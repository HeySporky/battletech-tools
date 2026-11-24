"""Coverage checklist: MegaMek's inventory against our catalogs (design 2026-10-24-catalog-consolidation §4).

MegaMek is the inventory, the books are the authority (ruling 6). This lists every item MegaMek knows, by family,
and whether a catalog record (or a builder option elsewhere in src) covers it. Only names, aliases, tech base, rules
levels and MegaMek's rules references are read; no values or code.

    java -cp "<megamek>/build/launch4j/lib/*" megamek.MegaMek -eqe_db mm-eqedb.csv      (run from <megamek>/megamek)
    CATALOG_IDENTITIES_OUT=ids.json npx vitest run --project unit src/data/catalog-identities.generator.test.ts
    python tools/coverage_checklist.py --megamek mm-eqedb.csv --identities ids.json --out tools/coverage-checklist.md

"in src" means the name appears in the app's source outside the catalogs (a builder option such as a turret or a
chassis modification); "missing" means neither. Each missing row is checked in the book (its rules reference) before
a record is written (round 7).
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path

# Construction components MegaMek keeps outside its equipment list (Mek.java GYRO_STRING and COCKPIT_STRING,
# Aero.java COCKPIT_STRING, Engine.java TYPE_KEYS, Mek.java actuator names). Names only.
COMPONENTS = {
    "Engine": ["ICE Engine", "Fusion Engine", "XL Engine", "XXL Engine", "Fuel Cell Engine", "Light Engine",
               "Compact Engine", "Fission Engine", "MagLev", "Steam Engine", "Battery", "Solar", "External",
               "Large Fusion Engine", "Large XL Engine", "Large XXL Engine", "Large Light Engine", "Large ICE Engine",
               "Primitive Fusion Engine", "Primitive ICE Engine"],
    "Gyro": ["Standard Gyro", "XL Gyro", "Compact Gyro", "Heavy Duty Gyro", "Superheavy Gyro"],
    "Cockpit": ["Standard Cockpit", "Small Cockpit", "Command Console", "Torso-Mounted Cockpit", "Dual Cockpit",
                "Industrial Cockpit", "Primitive Cockpit", "Primitive Industrial Cockpit", "Superheavy Cockpit",
                "Superheavy Tripod Cockpit", "Tripod Cockpit", "Interface Cockpit", "Virtual Reality Piloting Pod",
                "QuadVee Cockpit", "Superheavy Industrial Cockpit", "Superheavy Command Console",
                "Small Command Console", "Tripod Industrial Cockpit", "Superheavy Tripod Industrial Cockpit",
                "Small Aerospace Cockpit"],
    "Actuator": ["Shoulder", "Upper Arm", "Lower Arm", "Hand", "Hip", "Upper Leg", "Lower Leg", "Foot"],
}

# Family by name, first match wins; the MegaMek type (W weapon, A ammo, M misc) decides the rest.
FAMILIES = [
    ("Infantry weapon", r"^(infantry|inf\b)|\b(rifle|pistol|smg|shotgun|grenade|knife|sword|axe|blazer|needler|"
                        r"sonic stunner|flamer \(pistol\)|vibro|whip|staff|crossbow|bow|club|mace|monowire|"
                        r"shuriken|taser|claymore|dagger|spear|hammer)\b"),
    ("Infantry armor", r"\b(armor kit|flak|ablative|jacket|suit|vest|parka|environment suit|kit)\b"),
    ("Battle armor", r"^ba |\bba\b|battle ?armor|manipulator|\bbattlesuit"),
    ("Armor", r"\barmor\b|\bferro|\bhardened\b|\breactive\b|\breflective\b|stealth armor|\bbar ?\d"),
    ("Structure", r"endo|structure|composite|reinforced|industrial internal"),
    ("Heat sink", r"heat ?sink|laser heat|compact heat"),
    ("Jump jet", r"jump jet|jump booster|mechanical jump|partial wing|umu|mobility unit"),
    ("Myomer", r"\btsm\b|myomer|masc|supercharger"),
    ("Capital / bay", r"capital|naval|bay\b|dock|k-f|kf |grav deck|lithium|hpg|sail|mass driver|screen launcher"),
    ("ProtoMech", r"proto(mech)?\b|protomech"),
]


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def family(kind: str, name: str) -> str:
    low = name.lower()
    if kind == "A" or re.search(r"\bammo\b", low):
        return "Ammunition"
    for label, pattern in FAMILIES:
        if re.search(pattern, low):
            return label
    return {"W": "Weapon", "A": "Ammunition", "M": "Equipment"}.get(kind, "Equipment")


PARENS = re.compile(r"\s*\([^)]*\)|\s*\[[^\]]*\]")
ABBREVIATION = re.compile(r"\s*\((?:[A-Z][A-Za-z0-9/-]{1,7}|Clan|IS|Inner Sphere)\)")
TECH_MARK = re.compile(r"\s*\((?:IS|C|Clan|Inner Sphere)\)", re.I)
# Launcher sizes that are their own records; any other size of these families is a ProtoMech or battle armor
# launcher, built by the tube models (protomech-construction.ts, battle-armor-equipment.ts).
CATALOG_SIZES = {"lrm": {5, 10, 15, 20}, "srm": {2, 4, 6}, "lrt": {5, 10, 15, 20}, "srt": {2, 4, 6},
                 "streaksrm": {2, 4, 6}, "mrm": {10, 20, 30, 40}, "streaklrm": {5, 10, 15, 20},
                 "enhancedlrm": {5, 10, 15, 20}, "extendedlrm": {5, 10, 15, 20}, "atm": {3, 6, 9, 12},
                 "improvedatm": {3, 6, 9, 12}, "mml": {3, 5, 7, 9}, "rocketlauncher": {10, 15, 20},
                 "advancedsrm": {2, 4, 6}, "improvedsrm": {2, 4, 6}, "improvedlrm": {5, 10, 15, 20}}
LAUNCHER = re.compile(r"^(?:Clan )?((?:Streak |Enhanced |Extended |Improved |Advanced )?(?:LRM|SRM|LRT|SRT|MRM|ATM|MML)|"
                      r"Rocket Launcher) (\d+)\b(.*)$", re.I)


def tube_model(name: str) -> bool:
    """A launcher size the catalogs build from a tube model rather than list."""
    m = LAUNCHER.match(name)
    if not m or "(I-OS)" in name:
        return False
    sizes = CATALOG_SIZES.get(norm(m.group(1)))
    return bool(sizes) and int(m.group(2)) not in sizes


def ammo_key(name: str, families: list[str]) -> str | None:
    """(weapon family, munition) of an ammunition name, sizes and tech marks dropped, so MegaMek's one bin per
    launcher size meets our one record per munition."""
    text = TECH_MARK.sub("", name)
    text = re.sub(r"\b(?:Ammo|Ammunition|Pods?|Shells?|Missiles?)\b|\[(?:Full|Half)\]", " ", text, flags=re.I)
    text = re.sub(r"^MML \d+ ", "", text)  # MMLs fire LRM and SRM ammunition (TM p.229)
    text = re.sub(r"(ATM)/\d+", r"\1", text)
    low = norm(text)
    # "Long Tom", "Sniper" and "Thumper" alone are the artillery pieces; the cannons say so (TO:AUE pp.96-97).
    low = re.sub(r"(longtom|sniper|thumper)(?!artillery|cannon)", r"\1artillery", low)
    for theirs, ours in (("artemisvcapable", "artemisv"), ("artemiscapable", "artemisiv"), ("mortar", "mechmortar")):
        if theirs not in ours or ours not in low:
            low = low.replace(theirs, ours)
    # The weapon family is the one named first (and then the longest): "vibrabomb" and "Narc-capable" are munitions.
    found = [(low.find(family), -len(family), family) for family in families if family in low]
    for at, _, family in sorted(found)[:1]:
        if at >= 0:
            after = low[at + len(family):]
            # The launcher size follows the family ("Airburst Mortar 4"); a family ending in a digit has none.
            after = re.sub(r"^\d+", "", after) if not family[-1].isdigit() else after
            return family + "|" + (low[:at] + after or "standard")
    return None


# Battle armor launchers carry their shots and fire inferno, torpedo or multi-purpose missiles (TM pp.261, 297).
AR10_MISSILES = ("killer-whale", "white-shark", "barracuda")  # TM p.342
BA_AMMO = re.compile(r"^(?:BA (?:LRM|SRM|MRM) \d+|Advanced SRM \d+)(?: \((?:Clan|IS)\))?\s*(?P<munition>.*?)\s*Ammo$")


def ammo_keys(name: str, families: list[str]) -> set[str]:
    """The ammo_key of a name as written, without its abbreviation and with the abbreviation for the word before it:
    MegaMek's "Air-Defense Arrow (ADA)" and "Thunder (FASCAM)" are our "ADA" and "FASCAM". A model name in
    parentheses ("Gauss Rifle (Magshot)") stays."""
    abbreviation = r"\(([A-Z0-9/-]{2,8})\)"
    keys = {ammo_key(name, families), ammo_key(re.sub(r"\s*" + abbreviation + r"|\s*\[[^\]]*\]", "", name), families),
            ammo_key(re.sub(r"[\w-]+\s*" + abbreviation, r"\1", name), families)}
    return {key for key in keys if key}


def read_megamek(path: Path) -> list[dict]:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()[2:]
    rows = []
    for row in csv.DictReader(lines):
        levels = row["Rules"].split("/")
        if all("Unofficial" in level for level in levels):
            continue
        aliases = [a for a in row["Alias"].split(",") if a.strip()]
        rows.append({"kind": row["Type"], "name": row["Name"], "tech": row["Tech Base"], "rules": row["Rules"],
                     "level": row["Static Tech Level"], "ref": row["RulesRef"], "aliases": aliases})
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--megamek", type=Path, required=True)
    parser.add_argument("--identities", type=Path, required=True)
    parser.add_argument("--src", type=Path, default=Path(__file__).resolve().parent.parent / "src")
    parser.add_argument("--triage", type=Path, default=Path(__file__).with_name("coverage-triage.tsv"))
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    known: dict[str, list[str]] = defaultdict(list)
    identities = json.loads(args.identities.read_text(encoding="utf-8"))
    for record in identities:
        where = ("custom " if record["custom"] else "") + record["catalog"]
        for identifier in [record["tag"], record["name"], record.get("alternateName"), *record["altNames"], *record["altTags"]]:
            if identifier:
                known[norm(identifier)].append(f"{where}: {record['tag']}")
                known[norm(PARENS.sub("", identifier))].append(f"{where}: {record['tag']}")
    # Our ammunition is named "<weapon family> - <munition> Ammo"; index it by (family, munition).
    ammo_names = [TECH_MARK.sub("", n) for r in identities if r["catalog"].startswith("ammo")
                  for n in [r["name"], *r["altNames"]] if " - " in n]
    families = sorted({norm(n.split(" - ")[0]) for n in ammo_names}, key=len, reverse=True)
    ammo_known = {ammo_key(n.split(" - ")[0] + " " + n.split(" - ", 1)[1], families) for n in ammo_names}
    ammo_known |= {k.replace("|standard", "|") for k in ammo_known if k}
    ammo_known.discard(None)
    corpus = norm(" ".join(p.read_text(encoding="utf-8", errors="replace") for p in args.src.rglob("*.ts*")
                           if ".test." not in p.name))

    items = read_megamek(args.megamek)
    for label, names in COMPONENTS.items():
        items += [{"kind": "C", "name": n, "tech": "", "rules": "", "level": "", "ref": "", "aliases": [], "family": label}
                  for n in names]

    # Hand rulings on rows the matcher can't settle: MegaMek name -> (status, note).
    triage = {}
    for line in args.triage.read_text(encoding="utf-8").splitlines()[1:]:
        if line.strip():
            name, status, note = line.split("	")
            triage[name] = (status, note)

    by_family: dict[str, list[tuple[dict, str, str]]] = defaultdict(list)
    for item in items:
        # MegaMek's parentheses hold an abbreviation ("(CEWS)") or a model name ("Machine Gun (Akai Ryu)"); only the
        # abbreviation may be dropped.
        keys = [norm(item["name"]), norm(ABBREVIATION.sub("", item["name"])), *(norm(a) for a in item["aliases"])]
        hit = next((known[k][0] for k in keys if k in known), None)
        if not hit and item["kind"] == "A":
            base = re.sub(r"\s*w/\s*Incendiary", "", item["name"], flags=re.I)
            # Incendiary combines with another LRM munition (BMR p.130; TO:AUE p.181): covered by the two records.
            if ammo_keys(base, families) & ammo_known or tube_model(TECH_MARK.sub("", base)):
                hit = "munition record"
            # Primitive prototype launchers are standard launchers that carry less a ton (IO:AE p.112), and improved
            # launchers and autocannon fire their standard counterpart's special munitions (IO:AE p.90); the prototype
            # Arrow IV uses the Inner Sphere Arrow IV's rules (IO:AE p.64).
            shared = re.sub(r"\b(?:Primitive Prototype|Prototype|Improved) ", "", base).replace("Autocannon/", "AC/")
            if not hit and shared != base and ammo_keys(shared, families) & ammo_known:
                hit = "munition record"
        ba = BA_AMMO.match(item["name"]) if item["kind"] == "A" else None
        if not hit and ba:
            munition = ba.group("munition")
            if "Incendiary" in munition:
                ba_ruling = ("not canon", "Incendiary LRMs are for standard LRMs and MMLs only (TO:AUE p.181)")
            elif munition in ("", "Torpedo", "Inferno", "Multi-Purpose"):
                hit = "battle armor launcher" + (f": {munition} (battleArmorMunitions)" if munition else " shots")
        if not hit and item["kind"] == "W" and tube_model(TECH_MARK.sub("", item["name"]).replace(" (OS)", "")):
            hit = "tube model"
        if hit:
            status = "catalog"
        elif any(len(k) > 5 and k in corpus for k in keys):
            status, hit = "in src", ""
        else:
            status, hit = "missing", ""
        if status != "catalog" and ba and not hit and "Incendiary" in ba.group("munition"):
            status, hit = ba_ruling
        if status != "catalog" and item["name"] in triage:
            status, hit = triage[item["name"]]
        by_family[item.get("family") or family(item["kind"], item["name"])].append((item, status, hit or ""))

    # A clip or bin named for one weapon ("Shotgun (AWA AS-105) Ammo", "Barracuda Ammo") goes with that weapon's row.
    # Infantry inferno clips (TM p.273) go with their weapon too, and capital and battle armor weapon records carry their
    # own shots (capital-weapon-helpers.ts; TM p.261).
    weapons = {i["name"]: (s, n) for rows in by_family.values() for i, s, n in rows if i["kind"] != "A"}
    carriers = ("capital-weapons", "sub-capital-weapons", "battle-armor-equipment")
    for rows in by_family.values():
        for at, (item, status, note) in enumerate(rows):
            if item["kind"] != "A" or status != "missing":
                continue
            weapon = re.sub(r"\s*(?:-\s*\w+ Ammo \(Inferno\)|w/\s*Incendiary Ammo \(Inferno\)|\(Incendiary Grenades\) Ammo "
                            r"\(Inferno\)|Ammo(?:\s*\[(?:Full|Half)\])?)$", "", item["name"])
            if weapon in weapons:
                status, note = weapons[weapon]
                rows[at] = (item, status, f"weapon's row: {note}" if status != "catalog" else f"weapon {note}")
                continue
            ar10 = weapon.startswith("AR10 ")
            weapon = re.sub(r"^(\w[\w ]*?) \(Tele-Operated\)$", r"\1-T", weapon.removeprefix("AR10 "))
            carrier = next((h for h in known.get(norm(weapon), []) if h.split(":")[0] in carriers), None)
            if carrier and (not ar10 or carrier.split(": ")[1] in AR10_MISSILES):
                rows[at] = (item, "catalog", f"{carrier} carries its shots" + (" (AR-10, TM p.342)" if ar10 else ""))

    out = ["# Coverage checklist", "",
           "Generated by `tools/coverage_checklist.py` (design 2026-10-24-catalog-consolidation §4). MegaMek is the",
           "inventory, the books are the authority: a missing row is read in its book before a record is written.",
           "Unofficial MegaMek items are left out. Hand notes go in `tools/canon-catalog-completeness.md`.", "",
           "Rows ruled by hand (`tools/coverage-triage.tsv`) show the ruling as their status.", "",
           "| Family | MegaMek items | In a catalog | In src only | Ruled | Missing |", "|---|---|---|---|---|---|"]
    for name in sorted(by_family):
        rows = by_family[name]
        count = lambda s: sum(1 for _, status, _ in rows if status == s)
        ruled = len(rows) - count("catalog") - count("in src") - count("missing")
        out.append(f"| {name} | {len(rows)} | {count('catalog')} | {count('in src')} | {ruled} | {count('missing')} |")
    for name in sorted(by_family):
        missing = [(i, s, n) for i, s, n in by_family[name] if s != "catalog"]
        if not missing:
            continue
        out += ["", f"## {name}", "", "| Item | Tech | MegaMek level | Rules reference | Status | Note |",
                "|---|---|---|---|---|---|"]
        for item, status, note in sorted(missing, key=lambda m: (m[1], m[0]["name"])):
            out.append(f"| {item['name']} | {item['tech']} | {item['level']} | {item['ref']} | {status} | {note} |")
    with open(args.out, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(out) + "\n")
    total = sum(len(r) for r in by_family.values())
    missing = sum(1 for r in by_family.values() for _, s, _ in r if s == "missing")
    print(f"{total} items, {missing} missing -> {args.out}")


if __name__ == "__main__":
    main()
