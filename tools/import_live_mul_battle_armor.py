"""Collect official MUL Battle Armor card data and regenerate the local fallback cache."""

from __future__ import annotations

import argparse
import json
import re
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent.parent
STAGING_DIR = Path(__file__).with_name(".live-mul-battle-armor")
CACHE_PATH = ROOT / "src" / "data" / "mul-battle-armor.ts"
REPORT_PATH = STAGING_DIR / "reconciliation-report.json"


def canonical_title(name: str, variant: str | None = None) -> str:
    title = f"{name} {variant or ''}".strip().casefold()
    title = title.replace("‘", "'").replace("’", "'").replace("–", "-")
    return re.sub(r"[^a-z0-9]+", "", title)


def extract_cached_items() -> list[dict]:
    content = CACHE_PATH.read_text(encoding="utf-8")
    match = re.search(r"=\s*(\[.*\]);\s*export default", content, flags=re.DOTALL)
    if not match:
        raise ValueError(f"Could not parse cached Battle Armor data from {CACHE_PATH}.")
    return json.loads(match.group(1))


def load_live_items() -> list[dict]:
    items: list[dict] = []
    for path in sorted(STAGING_DIR.glob("batch-*.json")):
        batch = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(batch, list):
            raise ValueError(f"{path} does not contain a JSON array.")
        items.extend(batch)

    ids = [item["id"] for item in items]
    if len(ids) != len(set(ids)):
        raise ValueError("Collected live data contains duplicate unit IDs.")
    return items


def as_number(value: str | int | float | None) -> int:
    if value in (None, "", "—"):
        return 0
    return int(value)


def merge_item(cached: dict, live: dict) -> dict:
    stats = live["stats"]
    damage = [as_number(value) for value in stats["damage"].split("/")]
    if len(damage) != 4:
        raise ValueError(f"Unexpected damage profile for {live['name']}: {stats['damage']}")

    merged = dict(cached)
    merged.update(
        {
            "Name": live["name"],
            "Class": live["name"],
            "Variant": live["variant"],
            "Tonnage": live["tonnage"],
            "BattleValue": live["battleValue"],
            "DateIntroduced": str(live["introYear"]),
            "Technology": live["technology"],
            "Role": live["role"],
            "BFType": "BA" if as_number(stats["pv"]) > 0 else None,
            "BFSize": as_number(stats["size"]),
            "BFMove": "" if stats["move"] == "—" else stats["move"],
            "BFTMM": as_number(stats["tmm"]),
            "BFArmor": as_number(stats["armor"]),
            "BFStructure": as_number(stats["structure"]),
            "BFDamageShort": damage[0],
            "BFDamageMedium": damage[1],
            "BFDamageLong": damage[2],
            "BFDamageExtreme": damage[3],
            "BFPointValue": as_number(stats["pv"]),
            "BFAbilities": ",".join(stats["abilities"]) or None,
        }
    )
    return merged


def create_item(live: dict, local_id: int) -> dict:
    return merge_item(
        {
            "Id": local_id,
            "Name": live["name"],
            "GroupName": None,
            "Class": live["name"],
            "Variant": live["variant"],
            "Cost": 0,
            "Rules": "Unknown",
            "TROId": 0,
            "TRO": "",
            "RSId": 0,
            "RS": "",
            "EraIcon": "",
            "EraId": 0,
            "EraStart": 0,
            "ImageUrl": "",
            "IsFeatured": False,
            "IsPublished": True,
            "Release": 1,
            "Type": {"Id": 22, "Name": "Battle Armor", "Image": "BattleArmor.gif", "SortOrder": 5},
            "BFThreshold": 0,
            "BFDamageShortMin": False,
            "BFDamageMediumMin": False,
            "BFDamageLongMin": False,
            "BFOverheat": 0,
            "Skill": 0,
            "FormatedTonnage": str(live["tonnage"]),
        },
        live,
    )


def render_module(items: list[dict]) -> str:
    data = json.dumps(items, ensure_ascii=True, indent=2)
    return (
        'import { IASMULUnit } from "../classes/alpha-strike-unit";\n\n'
        f"const battleArmorMulListItems: IASMULUnit[] = {data};\n\n"
        "export default battleArmorMulListItems;\n"
    )


def generate() -> None:
    cached_items = extract_cached_items()
    live_items = load_live_items()
    cached_by_title = {canonical_title(item["Name"]): item for item in cached_items}
    live_by_title = {canonical_title(item["name"], item["variant"]): item for item in live_items}

    unmatched_cached = [item for key, item in cached_by_title.items() if key not in live_by_title]
    unmatched_live = [item for key, item in live_by_title.items() if key not in cached_by_title]
    report = {
        "cachedCount": len(cached_items),
        "liveCount": len(live_items),
        "matchedCount": len(cached_by_title) - len(unmatched_cached),
        "unmatchedCached": [{"id": item["Id"], "name": item["Name"]} for item in unmatched_cached],
        "unmatchedLive": [{"id": item["id"], "name": item["name"], "variant": item["variant"]} for item in unmatched_live],
    }
    STAGING_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")

    if unmatched_cached:
        raise ValueError(
            f"Title reconciliation is incomplete: {len(unmatched_cached)} cached records are unmatched. "
            f"See {REPORT_PATH}."
        )

    merged_items = [merge_item(item, live_by_title[canonical_title(item["Name"])]) for item in cached_items]
    next_local_id = max(item["Id"] for item in merged_items) + 1
    for live in unmatched_live:
        merged_items.append(create_item(live, next_local_id))
        next_local_id += 1

    CACHE_PATH.write_text(render_module(merged_items), encoding="utf-8")
    populated = sum(item["BFPointValue"] > 0 for item in merged_items)
    elementals = sum("elemental" in item["Name"].casefold() for item in merged_items)
    print(f"Generated {len(merged_items)} Battle Armor records with {populated} published Alpha Strike stat lines and {elementals} Elemental variants.")


class Collector(BaseHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "https://masterunitlist.battletech.com")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_POST(self) -> None:
        match = re.fullmatch(r"/batch/(\d+)", urlparse(self.path).path)
        if not match:
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(content_length))
        if not isinstance(payload, list):
            self.send_error(HTTPStatus.BAD_REQUEST, "Expected a JSON array.")
            return

        STAGING_DIR.mkdir(parents=True, exist_ok=True)
        output = STAGING_DIR / f"batch-{int(match.group(1)):03d}.json"
        output.write_text(json.dumps(payload, ensure_ascii=True), encoding="utf-8")
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def log_message(self, format: str, *args: object) -> None:
        print(format % args)


def serve(port: int) -> None:
    server = ThreadingHTTPServer(("127.0.0.1", port), Collector)
    print(f"Collector listening on http://127.0.0.1:{port}")
    server.serve_forever()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    serve_parser = subparsers.add_parser("serve", help="Accept browser-scraped MUL batches.")
    serve_parser.add_argument("--port", type=int, default=8765)
    subparsers.add_parser("generate", help="Generate the Battle Armor cache from collected live data.")
    args = parser.parse_args()

    if args.command == "serve":
        serve(args.port)
    else:
        generate()


if __name__ == "__main__":
    main()