"""Classify complete scraped equipment profiles into a review-only staging file.

The worker is intentionally unable to edit TypeScript catalogs. It accepts a
model result only when the model echoes source fields exactly and supplies
evidence plus an explicit disposition.
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import requests


OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "astech-qwen3:latest"
REQUIRED_FIELDS = ("tech_base", "heat", "damage", "short_range", "medium_range", "long_range", "weight", "cost", "battle_value")
DISPOSITIONS = {"accept", "review", "reject"}
CATALOGS = {"is", "clan", "universal", "custom", "review"}

SYSTEM = """You are Astech Catalog Worker. Classify one complete scraped BattleTech equipment profile.
Use only the supplied profile. Do not add, correct, infer, normalize, or invent any value.
Reject vehicle-only, aerospace, capital-scale, infantry-only, category, apocryphal, or incomplete records.
Universal is allowed only when a separately supplied IS/Clan counterpart has identical name, weight,
BattleMech slots, damage, and all range values; otherwise choose IS or Clan when the source supports it.
When domain or technology is uncertain, choose review. Return one JSON object only:
{"name":"exact input name","disposition":"accept|review|reject","catalog":"is|clan|universal|custom|review",
"source_fields":{"tech_base":"...","heat":"...","damage":"...","short_range":"...","medium_range":"...","long_range":"...","weight":"...","cost":"...","battle_value":"..."},
"evidence":["precise source field or source filename"],"missing_fields":[],"notes":""}
"""


def load_candidates(report_path: Path) -> list[dict[str, object]]:
    report = json.loads(report_path.read_text(encoding="utf-8"))
    return [item for item in report["profiles"] if item.get("status") == "candidate-canon-gap"]


def validate(result: object, profile: dict[str, object]) -> dict[str, object]:
    if not isinstance(result, dict):
        return {"name": profile["name"], "disposition": "review", "catalog": "review", "error": "non-object model output"}
    if result.get("name") != profile["name"]:
        return {"name": profile["name"], "disposition": "review", "catalog": "review", "error": "name changed by model"}
    if result.get("disposition") not in DISPOSITIONS or result.get("catalog") not in CATALOGS:
        return {"name": profile["name"], "disposition": "review", "catalog": "review", "error": "invalid disposition or catalog"}
    if result.get("disposition") == "accept" and result.get("catalog") == "review":
        return {"name": profile["name"], "disposition": "review", "catalog": "review", "error": "accepted result has no catalog assignment"}
    if not isinstance(result.get("evidence"), list) or not result["evidence"]:
        return {"name": profile["name"], "disposition": "review", "catalog": "review", "error": "missing evidence"}
    source_fields = result.get("source_fields")
    if not isinstance(source_fields, dict):
        return {"name": profile["name"], "disposition": "review", "catalog": "review", "error": "missing source fields"}
    for field in REQUIRED_FIELDS:
        if source_fields.get(field, "") != profile.get(field, ""):
            return {"name": profile["name"], "disposition": "review", "catalog": "review", "error": f"source field changed: {field}"}
    return {**result, "source_file": profile["source_file"]}


def classify(profile: dict[str, object]) -> dict[str, object]:
    prompt = json.dumps({key: profile.get(key, "") for key in ("name", "source_file", *REQUIRED_FIELDS)}, ensure_ascii=False)
    payload = {
        "model": MODEL,
        "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt}],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0, "top_p": 0.2},
    }
    response = requests.post(OLLAMA_URL, json=payload, timeout=240)
    response.raise_for_status()
    content = response.json().get("message", {}).get("content", "")
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        parsed = None
    return validate(parsed, profile)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", default="tools/equipment-inventory-report.json")
    parser.add_argument("--output", default="tools/astech-catalog-staging.jsonl")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    candidates = load_candidates(Path(args.report))
    output_path = Path(args.output)
    completed = set()
    if output_path.exists():
        for line in output_path.read_text(encoding="utf-8").splitlines():
            try:
                completed.add(json.loads(line)["name"])
            except (json.JSONDecodeError, KeyError):
                continue

    remaining = [profile for profile in candidates if profile["name"] not in completed]
    if args.limit:
        remaining = remaining[:args.limit]
    with output_path.open("a", encoding="utf-8") as output:
        for profile in remaining:
            try:
                result = classify(profile)
            except Exception as error:  # Keep the worker resumable after transient local failures.
                result = {"name": profile["name"], "disposition": "review", "catalog": "review", "error": str(error)}
            output.write(json.dumps(result, ensure_ascii=False) + "\n")
            output.flush()
            print(json.dumps(result, ensure_ascii=False))
            time.sleep(0.2)

    print(json.dumps({"candidate_count": len(candidates), "processed_this_run": len(remaining), "staged": len(completed) + len(remaining)}))


if __name__ == "__main__":
    main()