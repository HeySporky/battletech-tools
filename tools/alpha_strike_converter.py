"""Reusable, fail-closed tabletop weapon to Alpha Strike converter.

The numeric engine is deterministic. Ollama may classify an input to an
existing rule ID, but it is never allowed to invent a rule or numeric value.
Input and output are JSON or JSONL so this can feed future catalog tooling.
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.request
from pathlib import Path


OLLAMA_URL = "http://localhost:11434/api/chat"
DEFAULT_MODEL = "astech-qwen3:latest"


def load_rules(path: Path) -> dict[str, dict[str, object]]:
    document = json.loads(path.read_text(encoding="utf-8"))
    return document["rules"]


def normalize_family(value: str) -> str:
    return re.sub(r"[^a-z0-9-]+", "-", value.lower()).strip("-")


def normalize_workbook_name(value: str) -> str:
    """Remove workbook notation while preserving the weapon identity."""
    normalized = re.sub(r"\s*\*\s*$", "", value.strip())
    normalized = re.sub(r"\s*\(C\)\s*$", "", normalized, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", normalized).casefold()


def convert(
    weapon: dict[str, object],
    rule_id: str | None,
    rules: dict[str, dict[str, object]],
    workbook_rows: dict[str, dict[str, object]] | None = None,
) -> dict[str, object]:
    if not rule_id and workbook_rows:
        workbook_row = workbook_rows.get(normalize_workbook_name(str(weapon.get("name", ""))))
        if workbook_row:
            return {
                "name": weapon.get("name", ""),
                "status": "calculated-provisional",
                "source": workbook_row.get("source", "Alpha Strike Converter v2.3 workbook"),
                "source_status": workbook_row.get("source_status", "provisional"),
                "heat": workbook_row.get("Heat"),
                "range_short": workbook_row.get("Short"),
                "range_medium": workbook_row.get("Medium"),
                "range_long": workbook_row.get("Long"),
                "range_extreme": workbook_row.get("Extreme"),
                "tc": workbook_row.get("TC"),
                "notes": workbook_row.get("Notes"),
                "promotion": "review-required",
            }
    if not rule_id:
        return unresolved(weapon, "No registered conversion rule was selected.")
    rule = rules.get(rule_id)
    if rule is None:
        return unresolved(weapon, f"Unknown conversion rule: {rule_id}")

    mode = rule.get("mode")
    if mode == "cluster_linear":
        clusters = number(weapon.get("damage_clusters"))
        per_cluster = number(weapon.get("damage_per_cluster"))
        if clusters is None or per_cluster is None:
            return unresolved(weapon, "cluster_linear requires damage_clusters and damage_per_cluster.")
        base = clusters * per_cluster
        values = [
            base * float(rule["short_factor"]),
            base * float(rule["medium_factor"]),
            base * float(rule["long_factor"]),
            base * float(rule["extreme_factor"]),
        ]
    elif mode == "rack_lookup":
        rack = number(weapon.get("rack_size"))
        values_by_rack = rule.get("values", {})
        values = values_by_rack.get(str(int(rack))) if rack is not None else None
        if values is None:
            return unresolved(weapon, f"No rack-size calibration for {rack}.")
    else:
        return unresolved(weapon, f"Unsupported rule mode: {mode}")

    return {
        "name": weapon.get("name", ""),
        "status": "calculated",
        "rule_id": rule_id,
        "rule_status": rule.get("status", "unverified"),
        "source": rule.get("source", ""),
        "source_notes": rule.get("notes", ""),
        "heat": weapon.get("heat"),
        "range_short": values[0],
        "range_medium": values[1],
        "range_long": values[2],
        "range_extreme": values[3],
        "promotion": "review-required",
    }


def unresolved(weapon: dict[str, object], reason: str) -> dict[str, object]:
    return {
        "name": weapon.get("name", ""),
        "status": "unresolved",
        "reason": reason,
        "promotion": "blocked",
    }


def number(value: object) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def classify_with_ollama(weapon: dict[str, object], rules: dict[str, dict[str, object]], model: str) -> str | None:
    rule_summary = {rule_id: {"family": rule.get("family"), "mode": rule.get("mode")} for rule_id, rule in rules.items()}
    prompt = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Choose only an existing rule_id. Never invent a rule or numeric value. Return JSON exactly: {\"rule_id\": string|null}. Return null if uncertain."},
            {"role": "user", "content": json.dumps({"weapon": weapon, "available_rules": rule_summary})},
        ],
        "format": "json",
        "stream": False,
        "options": {"temperature": 0, "top_p": 0.2},
    }
    request = urllib.request.Request(OLLAMA_URL, data=json.dumps(prompt).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=180) as response:
        result = json.loads(response.read().decode())
    content = json.loads(result["message"]["content"])
    rule_id = content.get("rule_id")
    return rule_id if rule_id in rules else None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", help="JSON or JSONL tabletop weapon input")
    parser.add_argument("--rules", default="tools/alpha-strike-conversion-rules.json")
    parser.add_argument("--output", default="")
    parser.add_argument("--workbook-data", default="", help="Imported workbook JSON for exact-name provisional lookup")
    parser.add_argument("--ollama-classify", action="store_true")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    args = parser.parse_args()

    rules = load_rules(Path(args.rules))
    workbook_rows = None
    if args.workbook_data:
        workbook = json.loads(Path(args.workbook_data).read_text(encoding="utf-8"))
        workbook_rows = {
            normalize_workbook_name(str(row["Weapon"])): row
            for row in workbook["rows"]
            if row.get("Weapon")
        }
    raw = Path(args.input).read_text(encoding="utf-8").splitlines()
    outputs = []
    for line in raw:
        if not line.strip():
            continue
        weapon = json.loads(line)
        rule_id = weapon.get("rule_id")
        if args.ollama_classify and not rule_id:
            rule_id = classify_with_ollama(weapon, rules, args.model)
        outputs.append(convert(weapon, rule_id, rules, workbook_rows))

    text = "\n".join(json.dumps(output, ensure_ascii=False) for output in outputs) + "\n"
    if args.output:
        Path(args.output).write_text(text, encoding="utf-8")
    else:
        print(text, end="")


if __name__ == "__main__":
    main()