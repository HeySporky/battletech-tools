"""Batch source lookup: find rulebook references for equipment via Sarna + local Ollama.

Deterministic fetch (Sarna MediaWiki API via curl; Python's cert store fails on
this machine); the model only extracts; every extracted page/year/stat is
checked against the fetched text and mismatches are listed in "unverified".
Output is review-only staging - never write it straight into TypeScript.

Usage:
    python tools/ollama_equipment_sources.py tools/<name>-staging.jsonl ["Item A" "Item B" ...]
With no item names, runs the built-in ITEMS list.
"""
import json, re, sys, subprocess, urllib.parse, requests

OLLAMA = "http://localhost:11434/api/chat"
MODEL = "astech-qwen3:latest"
H = {"User-Agent": "Mozilla/5.0 (battletech-tools research)"}
API = "https://www.sarna.net/wiki/api.php"

ITEMS = [
    "Ejection Seat", "Enhanced Imaging", "Direct Neural Interface",
    "Drone Operating System", "Drone Carrier Control System", "Remote Drone Command Console",
    "SRCS Smart Robotic Control", "Recon Camera", "Sprayer", "Buzzsaw", "Fluid Suction System",
    "Ladder (equipment)", "Vehicular Mine Dispenser", "Booby Trap", "Cargo (equipment)",
    "Liquid Storage", "Chaff Pod", "Communications Equipment", "Collapsible Command Module",
    "HarJel II", "HarJel III", "Paramedic Equipment", "Ground-Mobile HPG",
    "RISC Viral Jammer", "RISC Laser Pulse Module", "Super-Cooled Myomer",
    "Drone Carrier", "Improved Sensors", "LAM Bomb Bay", "LAM Fuel Tank", "QuadVee Wheels",
    "Turret (BattleMech)", "Dumper", "Ram Plate", "Artemis V Fire Control System",
    "Apollo Fire Control System",
]

SYS = ("You extract BattleTech equipment data from the given wiki text. Use ONLY values "
       "literally present in the text. Never guess. Unknown -> null. Reply with one JSON object: "
       '{"name":str,"rules_refs":[{"book":str,"page":int|null}],"tonnage":str|null,"slots":str|null,'
       '"cost":str|null,"bv":str|null,"prototype_year":int|null,"production_year":int|null,'
       '"tech_base":str|null,"rules_level":str|null,"notes":str}')

def sarna(params):
    url = API + "?" + urllib.parse.urlencode(params)
    return json.loads(subprocess.run(["curl", "-s", "-A", H["User-Agent"], url], capture_output=True, text=True, encoding="utf-8", timeout=60).stdout)

def search1(q):
    r = sarna({"action": "query", "list": "search", "format": "json", "srlimit": 3, "srsearch": q})
    return [x["title"] for x in r.get("query", {}).get("search", [])]

def search(q):
    words = re.sub(r"[()]", "", q).split()
    for n in range(len(words), 0, -1):
        hits = search1(" ".join(words[:n]))
        if hits: return hits
    return []

def wikitext(title):
    r = sarna({"action": "parse", "page": title, "prop": "wikitext", "format": "json", "redirects": 1})
    return r.get("parse", {}).get("wikitext", {}).get("*", "")

def ask(item, title, text):
    body = {"model": MODEL, "stream": False, "format": "json",
            "options": {"temperature": 0, "num_ctx": 16384},
            "messages": [{"role": "system", "content": SYS},
                         {"role": "user", "content": f"Item: {item}\nPage: {title}\n\n{text[:14000]}"}]}
    return json.loads(requests.post(OLLAMA, json=body, timeout=600).json()["message"]["content"])

def check(res, text):
    flat = re.sub(r"\s+", " ", text)
    bad = []
    for ref in res.get("rules_refs") or []:
        p = ref.get("page")
        if p is not None and not re.search(rf"\b{p}\b", flat): bad.append(f"page {p}")
    for k in ("prototype_year", "production_year"):
        v = res.get(k)
        if v is not None and str(v) not in flat: bad.append(f"{k} {v}")
    for k in ("tonnage", "slots", "cost", "bv"):
        v = res.get(k)
        if v and not any(t in flat for t in re.findall(r"[\d.,]+", str(v))): bad.append(f"{k} {v}")
    return bad

if len(sys.argv) > 2:
    ITEMS = sys.argv[2:]
out = open(sys.argv[1], "w", encoding="utf-8")
for item in ITEMS:
    rec = {"query": item}
    try:
        titles = search(item)
        rec["candidates"] = titles
        if not titles:
            rec["found"] = False
        else:
            t = titles[0]; txt = wikitext(t)
            rec["title"] = t; rec["url"] = "https://www.sarna.net/wiki/" + urllib.parse.quote(t.replace(" ", "_"))
            res = ask(item, t, txt)
            rec["extract"] = res; rec["unverified"] = check(res, txt)
            rec["found"] = True
    except Exception as e:
        rec["error"] = str(e)
    out.write(json.dumps(rec) + "\n"); out.flush()
    print(item, "->", rec.get("title"), rec.get("unverified"), flush=True)
