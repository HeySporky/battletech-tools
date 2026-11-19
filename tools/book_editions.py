"""Book -> rules edition table (design 2026-10-24-catalog-consolidation §3, ruling 7).

Each book in the rulebook library gets its publication year, and month where the credits or printing line gives one,
read from the copyright and printing lines of its text extract. From that, it gets the edition or expansion current
for each unit type when it was published. The timeline comes from the app (src/data/edition-timeline.generator.test.ts),
so the table and the app agree.

    EDITION_TIMELINE_OUT=timeline.json npx vitest run --project unit src/data/edition-timeline.generator.test.ts
    python tools/book_editions.py --library C:/repo/JBTIICRework --timeline timeline.json

Writes <library>/text/_book-editions.tsv (never committed in the library repo). Rows marked "check" need a person
to confirm the year from the page image (render_page.py): no copyright line, or years that disagree. A later printing
carries its first book's copyright years, so the books the catalogs cite are dated by hand in
tools/book-editions-reviewed.tsv (first publication, with evidence); those rows are marked "reviewed".
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

FOLDERS = ["rulebooks", "rulebooks-legacy", "sourcebooks", "technical-readouts", "aerotech", "battletroops", "battlespace",
           "battleforce", "magazines", "rpg", "errata", "errata-2025", "gothic", "apocryphal", "alpha-strike"]
MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october",
          "november", "december"]
YEAR = r"(19[89]\d|20[0-3]\d)"
# "©2006–2024", "Copyright © 1986, 1990", "(c) 1998", "Copyright 1984"
COPYRIGHT = re.compile(r"(?:©|\(c\)|copyright)\s*(?:©\s*)?" + YEAR + r"((?:\s*[-–,]\s*" + YEAR + r")*)", re.I)
# "First Printing: March 1998", "Printed in the USA, June 2021", "March 2023" on a printing or version line
MONTH_YEAR = re.compile(r"\b(" + "|".join(MONTHS) + r")\.?,?\s+" + YEAR, re.I)
PRINTING = re.compile(r"print|edition|version|publish|release", re.I)


def slug(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "-", Path(name).stem).strip("-")


def pages_of(library: Path, pdf: Path) -> list[str]:
    best: list[str] = []
    for suffix in (".txt", ".ocr.txt"):
        path = library / "text" / (slug(pdf.name) + suffix)
        if path.exists():
            pages = path.read_text(encoding="utf-8", errors="replace").split("\f")
            if sum(len(p.strip()) for p in pages) > sum(len(p.strip()) for p in best):
                best = pages
    return best


def publication(pages: list[str]) -> tuple[int | None, int | None, str, bool]:
    """(year, month, evidence, needs a check). Credits sit in the first pages or on the last ones."""
    zone = pages[:8] + pages[-4:] if len(pages) > 12 else pages
    years: list[int] = []
    evidence: list[str] = []
    for page in zone:
        for line in page.splitlines():
            for m in COPYRIGHT.finditer(line):
                found = [int(m.group(1))] + [int(y) for y in re.findall(YEAR, m.group(2) or "")]
                # A range ("2006-2024") is a printing history: the book first appeared at its start. A list
                # ("1986, 1990") names a revision: the latest year is this book's.
                year = found[0] if "-" in (m.group(2) or "") or "–" in (m.group(2) or "") else found[-1]
                years.append(year)
                evidence.append(" ".join(line.split())[:160])
    if not years:
        return None, None, "", True
    year = max(set(years), key=years.count)
    disagree = len(set(years)) > 1
    month = None
    for page in zone:
        for line in page.splitlines():
            if not PRINTING.search(line):
                continue
            for m in MONTH_YEAR.finditer(line):
                if int(m.group(2)) == year:
                    month = MONTHS.index(m.group(1).lower()) + 1
                    evidence.append(" ".join(line.split())[:160])
                    break
            if month:
                break
        if month:
            break
    return year, month, " | ".join(dict.fromkeys(evidence))[:400], disagree


def edition_at(timeline: list[dict], unit_type: str, year: int, month: int | None) -> str:
    published = year * 12 + (month or 1)
    current = [e["tag"] for e in timeline if unit_type in e["unitTypes"] and e["year"] * 12 + (e.get("month") or 1) <= published]
    return current[-1] if current else ""


def cite_codes(library: Path) -> dict[str, str]:
    """Cite codes from the hand-written tables in INDEX.md, by PDF path."""
    codes: dict[str, str] = {}
    for line in (library / "INDEX.md").read_text(encoding="utf-8").splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 3 or not line.startswith("| ") or cells[0] in ("Cite as", "---"):
            continue
        for path in re.findall(r"`([^`]+\.pdf)`", cells[2]):
            codes.setdefault(path.replace("\\", "/"), cells[0])
    return codes


def reviewed(path: Path) -> dict[str, tuple[str, int, int | None, str]]:
    """Hand-dated books by library path: (cite, year, month, evidence)."""
    rows = path.read_text(encoding="utf-8").splitlines()[1:]
    out: dict[str, tuple[str, int, int | None, str]] = {}
    for row in rows:
        file, cite, year, month, evidence = row.split("	")
        out[file] = (cite, int(year), int(month) if month else None, evidence)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--library", type=Path, required=True)
    parser.add_argument("--timeline", type=Path, required=True)
    parser.add_argument("--reviewed", type=Path, default=Path(__file__).with_name("book-editions-reviewed.tsv"))
    args = parser.parse_args()
    data = json.loads(args.timeline.read_text(encoding="utf-8"))
    unit_types, timeline = data["unitTypes"], data["timeline"]
    codes = cite_codes(args.library)
    by_hand = reviewed(args.reviewed)
    rows = ["\t".join(["file", "cite", "year", "month", "status", *unit_types, "evidence"])]
    for folder in FOLDERS:
        for pdf in sorted((args.library / folder).rglob("*.pdf")):
            relative = pdf.relative_to(args.library).as_posix()
            cite = codes.get(relative, "")
            if relative in by_hand:
                cite, year, month, evidence = by_hand.pop(relative)
                status = "reviewed"
            else:
                year, month, evidence, disagree = publication(pages_of(args.library, pdf))
                status = "check" if year is None or disagree else "ok"
            editions = [edition_at(timeline, u, year, month) if year else "" for u in unit_types]
            rows.append("\t".join([relative, cite, str(year or ""), str(month or ""), status, *editions, evidence]))
    if by_hand:
        raise SystemExit(f"reviewed rows match no library file: {sorted(by_hand)}")
    out = args.library / "text" / "_book-editions.tsv"
    out.write_text("\n".join(rows) + "\n", encoding="utf-8")
    checks = sum(1 for r in rows[1:] if "\tcheck\t" in r)
    print(f"{len(rows) - 1} books, {checks} to check -> {out}")


if __name__ == "__main__":
    main()
