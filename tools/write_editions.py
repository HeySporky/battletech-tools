"""Insert each record's `editions` (and a missing equipment `techBase`) from .superpowers/ic/editions.json.

    py -3.11 tools/write_editions.py .superpowers/ic/editions.json

The JSON comes from src/data/write-editions.generator.test.ts (run with WRITE_EDITIONS=1). Each key must match
exactly one `tag: "<tag>",` (or `tons: <n>,`) line in its file, or the script stops before writing anything.
"""
import json
import pathlib
import re
import sys

DATA = pathlib.Path("src/data")


def insertion(entry):
    text = "editions: [" + ", ".join(f'"{tag}"' for tag in entry["editions"]) + "],"
    if entry.get("techBase"):
        text += f' techBase: "{entry["techBase"]}",'
    return text


def main(path):
    plan = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    edited = {}
    problems = []
    for file, entries in plan.items():
        lines = (DATA / file).read_text(encoding="utf-8").splitlines(keepends=True)
        for key, entry in entries.items():
            if key.startswith("tons:"):
                needle = re.compile(r"\btons: " + re.escape(key[5:]) + r",")
            else:
                needle = re.compile(r'\btag: "' + re.escape(key) + r'",')
            hits = [i for i, line in enumerate(lines) if needle.search(line)]
            if len(hits) != 1:
                problems.append(f"{file} {key}: {len(hits)} matches")
                continue
            i = hits[0]
            line = lines[i]
            if "editions:" in line:
                problems.append(f"{file} {key}: already has editions")
                continue
            match = needle.search(line)
            if line.strip() == match.group(0):
                indent = line[: len(line) - len(line.lstrip())]
                ending = "\r\n" if line.endswith("\r\n") else "\n"
                lines.insert(i + 1, indent + insertion(entry) + ending)
            else:
                lines[i] = line[: match.end()] + " " + insertion(entry) + line[match.end():]
        edited[file] = lines
    if problems:
        sys.exit("nothing written:\n" + "\n".join(problems))
    for file, lines in edited.items():
        (DATA / file).write_text("".join(lines), encoding="utf-8", newline="")
    print(f"wrote {sum(len(e) for e in plan.values())} records in {len(edited)} files")


if __name__ == "__main__":
    main(sys.argv[1])
