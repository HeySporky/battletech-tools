import json
import re
from pathlib import Path

WORKBOOK = Path("tools/alpha-strike-workbook-data.json")
OUTPUT = Path("tools/alpha-strike-workbook-review-blocks.md")
CATALOGS = list(Path("src/data").glob("mech-*-equipment-*.ts"))

def normalize(value: str) -> str:
    value = re.sub(r"\s*\*\s*$", "", value.strip())
    value = re.sub(r"\s*\(C\)\s*$", "", value, flags=re.IGNORECASE)
    return re.sub(r"[^a-z0-9]+", "", value.casefold())

names = set()
for path in CATALOGS:
    names.update(normalize(match) for match in re.findall(r'^\s*name:\s*"([^"]+)"', path.read_text(encoding="utf-8"), re.MULTILINE))

rows = json.loads(WORKBOOK.read_text(encoding="utf-8"))["rows"]
remaining = [
    row for row in rows
    if normalize(str(row.get("Weapon", "")))
    and str(row.get("Weapon", "")).strip().upper() not in {"INNER SPHERE WEAPONS", "CLAN WEAPONS"}
    and normalize(str(row.get("Weapon", ""))) not in names
]

lines = ["# Workbook Review Blocks", "", "Classify each row as `IS`, `Clan`, or `Universal`. Universal requires exact IS/Clan equality for name, weight, BattleMech slots, damage, and range. Rows already represented in source catalogs were removed.", ""]
for index, row in enumerate(remaining, 1):
    if (index - 1) % 10 == 0:
        lines.extend([f"## Block {(index - 1) // 10 + 1}", "", "| # | Weapon | Heat | S | M | L | E | TC | Notes | Classification |", "|---:|---|---:|---:|---:|---:|---:|---|---|---|"])
    values = [row.get(key, "") for key in ("Weapon", "Heat", "Short", "Medium", "Long", "Extreme", "TC", "Notes")]
    values = [str(value).replace("|", "/") if value is not None else "" for value in values]
    lines.append(f"| {index} | " + " | ".join(values) + " |  |")

OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(json.dumps({"catalog_names": len(names), "workbook_rows": len(rows), "remaining_rows": len(remaining), "blocks": (len(remaining) + 9) // 10, "output": str(OUTPUT)}))
