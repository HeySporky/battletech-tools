"""Join catalog and Alpha Strike staging into a promotion-readiness report."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def read_jsonl(path: Path) -> list[dict[str, object]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", default="tools/astech-catalog-staging.jsonl")
    parser.add_argument("--alpha", default="tools/astech-alpha-staging.jsonl")
    parser.add_argument("--output", default="tools/catalog-promotion-report.json")
    args = parser.parse_args()

    alpha_by_name = {row.get("name"): row for row in read_jsonl(Path(args.alpha))}
    rows = []
    for catalog in read_jsonl(Path(args.catalog)):
        if catalog.get("disposition") != "accept" or catalog.get("catalog") not in {"is", "clan", "universal", "custom"}:
            continue
        alpha = alpha_by_name.get(catalog.get("name"))
        blockers = ["IEquipmentItem mapping not generated"]
        if not alpha or alpha.get("found") is not True:
            blockers.append("Alpha Strike evidence incomplete")
        rows.append({
            "name": catalog.get("name"),
            "catalog": catalog.get("catalog"),
            "source_file": catalog.get("source_file"),
            "alpha": alpha or {"found": False, "error": "no lookup row"},
            "promotion_ready": False,
            "blockers": blockers,
        })

    output = {
        "promotion_ready_count": 0,
        "candidate_count": len(rows),
        "candidates": rows,
        "policy": "No staged model result is promoted automatically; complete source mapping and tests are required.",
    }
    Path(args.output).write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"candidate_count": len(rows), "promotion_ready_count": 0}, indent=2))


if __name__ == "__main__":
    main()