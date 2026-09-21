"""Look up Alpha Strike fields for definite staged catalog candidates.

Results are review staging only. No catalog source file is modified.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import requests


OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "astech-qwen3:latest"
APPROVED_HOSTS = ("sarna.net", "battletech.com")
REQUIRED = ("heat", "short", "medium", "long", "extreme")

SYSTEM = """You are an evidence-only BattleTech Alpha Strike lookup worker.
Use web_search and fetch_page for the exact item. Never infer or calculate a value.
If the source does not explicitly provide all five requested Alpha Strike fields,
return found:false. Unknown is never zero. Do not use Classic BattleTech damage
as Alpha Strike damage. Return one JSON object only:
{"name":"exact input name","found":false,"heat":null,"short":null,"medium":null,"long":null,"extreme":null,"source_url":"","evidence":[],"notes":""}
"""

TOOLS = [
    {"type": "function", "function": {"name": "web_search", "description": "Search Sarna for exact item evidence.", "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}},
    {"type": "function", "function": {"name": "fetch_page", "description": "Fetch an approved source page.", "parameters": {"type": "object", "properties": {"url": {"type": "string"}}, "required": ["url"]}}},
]


def valid(result: object, name: str) -> dict[str, object]:
    if not isinstance(result, dict) or result.get("name") != name:
        return {"name": name, "found": False, "error": "invalid name or object"}
    if result.get("found") is True:
        url = result.get("source_url", "")
        if not isinstance(url, str) or not any(host in url.lower() for host in APPROVED_HOSTS):
            return {"name": name, "found": False, "error": "missing approved source URL"}
        if any(not isinstance(result.get(field), (int, float)) for field in REQUIRED):
            return {"name": name, "found": False, "error": "missing Alpha Strike field"}
    return result


def lookup(name: str) -> dict[str, object]:
    messages = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": f'Look up the exact item "{name}" and return the required JSON.'}]
    for _ in range(8):
        response = requests.post(OLLAMA_URL, json={"model": MODEL, "messages": messages, "tools": TOOLS, "stream": False, "options": {"temperature": 0, "top_p": 0.2}}, timeout=240)
        response.raise_for_status()
        message = response.json()["message"]
        messages.append(message)
        calls = message.get("tool_calls") or []
        if not calls:
            try:
                return valid(json.loads(message.get("content", "")), name)
            except json.JSONDecodeError:
                return {"name": name, "found": False, "error": "invalid JSON"}
        from ollama_research_agent import TOOL_IMPLS
        for call in calls:
            function = call["function"]
            arguments = function.get("arguments") or {}
            if isinstance(arguments, str):
                arguments = json.loads(arguments)
            result = TOOL_IMPLS[function["name"]](arguments)
            messages.append({"role": "tool", "content": json.dumps(result)[:16000]})
    return {"name": name, "found": False, "error": "max turns reached"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--staging", default="tools/astech-catalog-staging.jsonl")
    parser.add_argument("--output", default="tools/astech-alpha-staging.jsonl")
    args = parser.parse_args()
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    accepted = []
    for line in Path(args.staging).read_text(encoding="utf-8").splitlines():
        item = json.loads(line)
        if item.get("disposition") == "accept" and item.get("catalog") in {"is", "clan"}:
            accepted.append(item["name"])
    output = Path(args.output)
    done = {json.loads(line)["name"] for line in output.read_text(encoding="utf-8").splitlines()} if output.exists() else set()
    with output.open("a", encoding="utf-8") as stream:
        for name in accepted:
            if name in done:
                continue
            result = lookup(name)
            stream.write(json.dumps(result, ensure_ascii=False) + "\n")
            stream.flush()
            print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()