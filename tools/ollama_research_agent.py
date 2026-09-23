"""
Local research agent: gives a local Ollama model real web-search + page-fetch
tool access (no API keys, keyless DuckDuckGo HTML search + direct HTTP fetch)
so it can look up BattleTech weapon stats and return compact structured JSON.

This is a throwaway project tool (not shipped with the app) used to offload
token-heavy web research/extraction to the local machine instead of the
assistant's own context budget.

Usage:
    python tools/ollama_research_agent.py "question or task" [--model qwen3-coder:30b]
"""
import sys
import json
import re
import argparse
import urllib.parse
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
DEFAULT_MODEL = "qwen3-coder:30b"
APPROVED_SOURCE_HOSTS = ("sarna.net", "battletech.com")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
}


def web_search(query: str, max_results: int = 6):
    """Keyless web search using the Sarna.net (BattleTechWiki) MediaWiki search
    API. DuckDuckGo/Bing HTML scraping is bot-blocked (anomaly-detection
    challenge pages), so we search the authoritative BattleTech wiki directly
    instead - it is comprehensive for canon equipment/unit lookups and its
    MediaWiki API is public, keyless and CORS-friendly."""
    api_url = (
        "https://www.sarna.net/wiki/api.php?action=query&list=search&format=json"
        "&srlimit=" + str(max_results) + "&srsearch=" + urllib.parse.quote(query)
    )
    try:
        resp = requests.get(api_url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return [{"error": str(e)}]

    results = []
    for item in data.get("query", {}).get("search", []):
        title = item.get("title", "")
        snippet = re.sub(r"<.*?>", "", item.get("snippet", ""))
        page_url = "https://www.sarna.net/wiki/" + title.replace(" ", "_")
        results.append({"title": title, "url": page_url, "snippet": snippet})
    return results


def fetch_page(url: str, max_chars: int = 16000):
    """Fetch a URL and return simplified, truncated plain text.

    For sarna.net (MediaWiki) pages, the actual article content starts at the
    "mw-body-content" marker - everything before that is nav/header chrome
    that wastes context, so it is trimmed off when present.
    """
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        return f"ERROR fetching {url}: {e}"

    html = resp.text
    marker_idx = html.find("mw-body-content")
    if marker_idx > 0:
        html = html[marker_idx:]

    # Strip script/style blocks
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    # Strip tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_chars]


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the BattleTechWiki (sarna.net) for a topic (unit, weapon, equipment) and return a list of {title, url, snippet} results.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_page",
            "description": "Fetch a web page by URL and return simplified plain text content (truncated).",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "The URL to fetch"}
                },
                "required": ["url"]
            }
        }
    }
]

GUARDRAIL_SYSTEM = (
    "You are an evidence extraction worker, not a creative assistant. Use only "
    "the supplied evidence or fetched approved source pages. Never invent a "
    "stat, filename, citation, URL, or rule. If any requested field is absent, "
    "ambiguous, conflicting, or domain-inapplicable, return found:false. Unknown "
    "is not zero. Return exactly one JSON object and no prose. Every positive "
    "numeric claim requires a source URL or local source filename. Same-name IS "
    "and Clan equipment is universal only if name, weight, BattleMech slots, "
    "damage, and range are exactly equal; otherwise keep variants separate."
)

TOOL_IMPLS = {
    "web_search": lambda args: web_search(args["query"]),
    "fetch_page": lambda args: fetch_page(args["url"]),
}


def _valid_source_url(value):
    return isinstance(value, str) and any(host in value.lower() for host in APPROVED_SOURCE_HOSTS)


def validate_lookup_result(result):
    """Fail closed for the structured lookup contract used by batch jobs."""
    if not isinstance(result, dict):
        return {"found": False, "error": "model output was not an object"}
    if not isinstance(result.get("name"), str) or not result["name"].strip():
        return {"found": False, "error": "missing name"}
    if result.get("found") is True:
        if not _valid_source_url(result.get("source_url", "")):
            return {"name": result["name"], "found": False, "error": "positive result lacks approved source URL"}
        required = ("heat", "short", "medium", "long", "extreme")
        if any(not isinstance(result.get(field), (int, float)) for field in required):
            return {"name": result["name"], "found": False, "error": "positive result has missing numeric fields"}
    return result


def parse_model_json(content):
    try:
        parsed = json.loads(content)
    except (TypeError, json.JSONDecodeError):
        return {"found": False, "error": "model output was not valid JSON"}
    return validate_lookup_result(parsed)


def run_agent(task, model=DEFAULT_MODEL, max_turns=8, system=None):
    messages = []
    messages.append({"role": "system", "content": GUARDRAIL_SYSTEM + ("\n" + system if system else "")})
    messages.append({"role": "user", "content": task})

    for _ in range(max_turns):
        payload = {
            "model": model,
            "messages": messages,
            "tools": TOOLS,
            "stream": False,
            "options": {"temperature": 0, "top_p": 0.2},
        }
        resp = requests.post(OLLAMA_URL, json=payload, timeout=180)
        resp.raise_for_status()
        data = resp.json()
        msg = data["message"]
        messages.append(msg)

        tool_calls = msg.get("tool_calls") or []
        if not tool_calls:
            return json.dumps(parse_model_json(msg.get("content", "")))

        for call in tool_calls:
            fn_name = call["function"]["name"]
            fn_args = call["function"].get("arguments") or {}
            if isinstance(fn_args, str):
                try:
                    fn_args = json.loads(fn_args)
                except Exception:
                    fn_args = {}
            impl = TOOL_IMPLS.get(fn_name)
            result = impl(fn_args) if impl else {"error": "unknown tool " + fn_name}
            messages.append({
                "role": "tool",
                "content": json.dumps(result)[:16000],
            })

    return "AGENT_DID_NOT_FINISH: max turns reached"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("task")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--system", default=None)
    args = parser.parse_args()

    result = run_agent(args.task, model=args.model, system=args.system)
    print(result)
