"""
Batch Alpha Strike stat lookup for a fixed list of BattleTech energy weapons
using the local Ollama research agent. Writes one JSON object per line to
as_lookup_results.jsonl so the results can be reviewed/inserted by hand.
"""
import sys
import json

sys.path.insert(0, "tools")
from ollama_research_agent import run_agent

WEAPONS = [
    "Large Re-engineered Laser",
    "Medium Re-engineered Laser",
    "Small Re-engineered Laser",
    "RISC Hyper Laser",
    "Binary Laser Cannon",
    "Light Blazer",
    "ER Large Pulse Laser",
    "ER Medium Pulse Laser",
    "ER Small Pulse Laser",
    "Large Chemical Laser",
    "Medium Chemical Laser",
    "Small Chemical Laser",
    "Improved Heavy Large Laser",
    "Improved Heavy Medium Laser",
    "Improved Heavy Small Laser",
    "Improved Large Laser",
    "Improved Large Pulse Laser",
]

SYSTEM = (
    "You are a BattleTech rules-lookup research assistant. You have web_search "
    "(searches sarna.net BattleTechWiki) and fetch_page tools. When searching, "
    "use the exact quoted weapon name for best results. Fetch the page and look "
    "specifically for its Alpha Strike / BattleForce conversion stats: Damage "
    "values at Short/Medium/Long/Extreme range bands (as printed on an Alpha "
    "Strike weapon card, these are small integers like 1,2,3, NOT the tabletop "
    "damage number), and Heat (if any, 0 if the weapon has no separate AS heat "
    "value). If the wiki page has no Alpha Strike section/infobox at all (this "
    "is common and expected for rare/prototype weapons), set found to false - "
    "do not guess or invent numbers. Always finish with ONLY a single JSON "
    "object, no prose, no markdown fences."
)

TASK_TEMPLATE = (
    'Look up the BattleTech weapon "{name}" on sarna.net (BattleTechWiki). '
    'Return ONLY this JSON object: {{"name":"{name}","found":true|false,'
    '"heat":N,"short":N,"medium":N,"long":N,"extreme":N,"source_url":"...","notes":"..."}}'
)

if __name__ == "__main__":
    with open("as_lookup_results.jsonl", "w", encoding="utf-8") as out:
        for name in WEAPONS:
            task = TASK_TEMPLATE.format(name=name)
            print("Looking up:", name, file=sys.stderr)
            try:
                result = run_agent(task, model="qwen3-coder:30b", system=SYSTEM, max_turns=10)
            except Exception as e:
                result = json.dumps({"name": name, "found": False, "error": str(e)})
            out.write(result.strip() + "\n")
            out.flush()
            print(result, file=sys.stderr)
