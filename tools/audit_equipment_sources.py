"""Audit scraped equipment profiles against the current TypeScript catalogs.

This tool produces a candidate report only. It never writes catalog source
files and never treats an incomplete profile as permission to invent values.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


PROFILE_START = re.compile(r"^## Weapon:\s*(.+)$")
FIELD_PATTERNS = {
    "tech_base": re.compile(r"^\| Tech Base =\s*(.*)$"),
    "introduced": re.compile(r"^\| Year Introduced =\s*(.*)$"),
    "extinct": re.compile(r"^\| Year Extinction =\s*(.*)$"),
    "reintroduced": re.compile(r"^\| Year Reintroduced =\s*(.*)$"),
    "heat": re.compile(r"^\| Heat =\s*(.*)$"),
    "damage": re.compile(r"^\| Damage =\s*(.*)$"),
    "short_range": re.compile(r"^\| Short Range =\s*(.*)$"),
    "medium_range": re.compile(r"^\| Medium Range =\s*(.*)$"),
    "long_range": re.compile(r"^\| Long Range =\s*(.*)$"),
    "weight": re.compile(r"^\| Tons =\s*(.*)$"),
    "cost": re.compile(r"^\| Cost \(unloaded\) =\s*(.*)$"),
    "battle_value": re.compile(r"^\| BV \(2\.0\) =\s*(.*)$"),
}
REQUIRED_FIELDS = ("tech_base", "heat", "damage", "short_range", "medium_range", "long_range", "weight", "cost", "battle_value")


def normalize(value: str) -> str:
    value = value.lower().replace("∕", "/")
    return re.sub(r"[^a-z0-9]+", "", value)


def parse_profiles(source_dir: Path) -> list[dict[str, object]]:
    profiles: list[dict[str, object]] = []
    for path in sorted(source_dir.glob("*.md")):
        current: dict[str, object] | None = None
        for line in path.read_text(encoding="utf-8").splitlines():
            match = PROFILE_START.match(line)
            if match:
                if current:
                    profiles.append(current)
                current = {"name": match.group(1).strip(), "source_file": path.name}
                continue
            if current is None:
                continue
            for field, pattern in FIELD_PATTERNS.items():
                field_match = pattern.match(line)
                if field_match:
                    current[field] = field_match.group(1).strip()
                    break
        if current:
            profiles.append(current)
    return profiles


def catalog_names(data_dir: Path) -> set[str]:
    names: set[str] = set()
    for path in data_dir.glob("mech-*-equipment-*.ts"):
        text = path.read_text(encoding="utf-8")
        names.update(normalize(match) for match in re.findall(r'^\s*name:\s*"([^"]+)"', text, re.MULTILINE))
    return names


def classify(profile: dict[str, object], current_names: set[str]) -> dict[str, object]:
    name = str(profile["name"])
    missing = [field for field in REQUIRED_FIELDS if not str(profile.get(field, "")).strip()]
    tech_base = str(profile.get("tech_base", ""))
    reasons: list[str] = []
    if name.startswith("Category:"):
        reasons.append("category-page")
    if profile["source_file"] == "apocryphal_weapons.md":
        reasons.append("apocryphal-source")
    if missing:
        reasons.append("incomplete-profile")
    if "capital" in name.lower() or "naval" in name.lower() or "cruise missile" in name.lower():
        reasons.append("domain-review-required")
    if "Clan" not in tech_base and "Inner Sphere" not in tech_base and "Clans" not in tech_base:
        reasons.append("tech-base-unresolved")
    if not reasons and normalize(name) in current_names:
        reasons.append("already-present")
    status = "candidate-canon-gap" if not reasons else ("present" if reasons == ["already-present"] else "excluded-or-review")
    return {**profile, "status": status, "missing_fields": missing, "reasons": reasons}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", default="_KNOWLEDGE_DEV/weapons")
    parser.add_argument("--data-dir", default="src/data")
    parser.add_argument("--output", default="tools/equipment-inventory-report.json")
    args = parser.parse_args()

    profiles = parse_profiles(Path(args.source_dir))
    current_names = catalog_names(Path(args.data_dir))
    report = [classify(profile, current_names) for profile in profiles]
    counts: dict[str, int] = {}
    for item in report:
        counts[str(item["status"])] = counts.get(str(item["status"]), 0) + 1

    output = {
        "source_profile_count": len(report),
        "current_catalog_name_count": len(current_names),
        "counts": counts,
        "profiles": report,
    }
    Path(args.output).write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"source_profile_count": len(report), "current_catalog_name_count": len(current_names), "counts": counts}, indent=2))


if __name__ == "__main__":
    main()