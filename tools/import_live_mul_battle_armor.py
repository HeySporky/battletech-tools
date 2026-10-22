"""Update the chunked MUL JSON records from live MUL data without touching catalog outputs."""

from __future__ import annotations

import argparse
import json
import re
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent.parent
MUL_DIR = ROOT / "src" / "data" / "mul"
STAGING_DIR = ROOT / ".live-mul-battle-armor"
REPORT_PATH = STAGING_DIR / "reconciliation-report.json"
CHUNK_RE = re.compile(r"mul_ids_(\d+)_to_(\d+)\.json$", re.IGNORECASE)


def chunk_path_for_id(unit_id: int) -> Path:
    for path in sorted(MUL_DIR.glob("mul_ids_*.json")):
        match = CHUNK_RE.search(path.name)
        if not match:
            continue
        start = int(match.group(1))
        end = int(match.group(2))
        if start <= unit_id <= end:
            return path

    raise ValueError(
        f"No MUL chunk file covers Id {unit_id}. "
        "Add or choose the matching chunk range before updating the JSON bundle."
    )


def extract_numeric_id(record: dict[str, Any]) -> int | None:
    value = record.get("Id")
    if value is None:
        value = record.get("id")
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        match = re.search(r"-?\d+", value.strip())
        if match:
            return int(match.group(0))
    return None


def is_unit_record(record: Any) -> bool:
    if not isinstance(record, dict):
        return False
    return extract_numeric_id(record) is not None and isinstance(record.get("Name"), str)


def load_chunk_file(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError(f"{path} does not contain a JSON array.")
    return payload


def persist_chunk_file(path: Path, items: list[dict[str, Any]]) -> None:
    path.write_text(json.dumps(items, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")


def load_live_items() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for path in sorted(STAGING_DIR.glob("batch-*.json")):
        batch = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(batch, list):
            raise ValueError(f"{path} does not contain a JSON array.")
        items.extend(batch)

    missing_ids = [item for item in items if extract_numeric_id(item) is None]
    if missing_ids:
        sample = missing_ids[0]
        raise ValueError(
            "One or more live MUL entries do not expose a numeric Id. "
            f"Cannot safely map them into the chunked JSON bundle: {sample}"
        )

    ids = [extract_numeric_id(item) for item in items]
    if len(ids) != len(set(ids)):
        raise ValueError("Collected live data contains duplicate unit IDs.")
    return items


def build_unit_record(live: dict[str, Any]) -> dict[str, Any]:
    unit_id = extract_numeric_id(live)
    if unit_id is None:
        raise ValueError(f"Record missing numeric Id: {live}")

    # Keep the chunked JSON aligned to the actual file-based MUL source shape.
    # The loader in src/data/mul-list-items.ts ignores metadata-only objects
    # and expects real unit records to include Id, Name, and Class.
    record = dict(live)
    record["Id"] = unit_id
    if "Name" not in record and "name" in record:
        record["Name"] = record["name"]
    if "Class" not in record and "class" in record:
        record["Class"] = record["class"]
    return record


def generate() -> None:
    if not MUL_DIR.exists():
        raise FileNotFoundError(f"MUL chunk directory not found: {MUL_DIR}")

    live_items = load_live_items()
    chunk_entries: dict[Path, list[dict[str, Any]]] = {}
    for path in sorted(MUL_DIR.glob("mul_ids_*.json")):
        chunk_entries[path] = load_chunk_file(path)

    for live in live_items:
        unit_id = extract_numeric_id(live)
        if unit_id is None:
            raise ValueError(f"Live record is missing a numeric Id: {live}")

        chunk_path = chunk_path_for_id(unit_id)
        if chunk_path not in chunk_entries:
            chunk_entries[chunk_path] = load_chunk_file(chunk_path)

        updated_record = build_unit_record(live)
        current_items = chunk_entries[chunk_path]
        replaced = False
        for index, item in enumerate(current_items):
            if is_unit_record(item) and extract_numeric_id(item) == unit_id:
                current_items[index] = updated_record
                replaced = True
                break

        if not replaced:
            current_items.append(updated_record)

    for path, items in chunk_entries.items():
        persist_chunk_file(path, items)

    print(f"Updated {len(chunk_entries)} MUL chunk file(s) with {len(live_items)} live records.")


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
    subparsers.add_parser("generate", help="Update the chunked MUL JSON records from collected live data.")
    args = parser.parse_args()

    if args.command == "serve":
        serve(args.port)
    else:
        generate()


if __name__ == "__main__":
    main()