"""Inventory MegaMek IS/Clan weapon paths without parsing Java class bodies.

MegaMek is useful here as a secondary identity and tech-base cross-check. Its
Java weapon classes are not treated as authoritative values for this project.
The report records only path identity, family, tech-base subtree, and filename.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


TECH_BASE_DIRS = {"clan", "innerSphere"}


def inventory(root: Path) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() != ".java":
            continue
        relative = path.relative_to(root)
        parts = relative.parts
        matches = [(index, part) for index, part in enumerate(parts[:-1]) if part in TECH_BASE_DIRS]
        if not matches:
            continue
        index, tech_base = matches[-1]
        family = "/".join(parts[:index])
        records.append({
            "tech_base": "is" if tech_base == "innerSphere" else "clan",
            "family": family,
            "path": str(relative).replace("\\", "/"),
            "file_stem": path.stem,
        })
    return sorted(records, key=lambda record: record["path"].lower())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=r"C:\repo\megamek\megamek\src\megamek\common\weapons")
    parser.add_argument("--output", default="tools/megamek-techbase-inventory.json")
    args = parser.parse_args()

    records = inventory(Path(args.root))
    counts: dict[str, int] = {}
    families: dict[str, int] = {}
    for record in records:
        counts[record["tech_base"]] = counts.get(record["tech_base"], 0) + 1
        key = f'{record["tech_base"]}:{record["family"]}'
        families[key] = families.get(key, 0) + 1

    report = {
        "source": "MegaMek weapon subtree paths",
        "stats_source": False,
        "root": args.root,
        "record_count": len(records),
        "counts_by_tech_base": counts,
        "counts_by_family": families,
        "records": records,
    }
    Path(args.output).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"record_count": len(records), "counts_by_tech_base": counts}, indent=2))


if __name__ == "__main__":
    main()