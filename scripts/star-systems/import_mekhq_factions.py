"""Build the faction names the star catalog's owner codes need, from MegaMek Data (CC BY-NC-SA 4.0).

    python -I scripts/star-systems/import_mekhq_factions.py C:/repo/mekhq/MekHQ/data/universe

Reads <universe>/factions/*.yml and <universe>/commands/*.yml (the minor and pirate states, keys such as PP.AbM) and
keeps only the codes src/data/star-systems/data/index.json uses. Writes src/data/star-systems/data/factions.json:
    {"_notice": ..., "factions": {code: {"name": name, "changes": [[year, name], ...]}}}
"changes" is MegaMek's nameChanges, oldest first: from that year on, the faction is called that name.
"""
import json
import os
import sys

import yaml

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT_DIR = os.path.join(ROOT, 'src', 'data', 'star-systems', 'data')
NOTICE = ('MegaMek Data (C) 2025-2026 by The MegaMek Team is licensed under CC BY-NC-SA 4.0. '
          'https://creativecommons.org/licenses/by-nc-sa/4.0/')


def read_faction(path):
    with open(path, encoding='utf-8') as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict) or not data.get('key') or not data.get('name'):
        return None
    changes = data.get('nameChanges') or {}
    return str(data['key']), {
        'name': str(data['name']),
        'changes': [[int(year), str(name)] for year, name in sorted(changes.items(), key=lambda kv: int(kv[0]))],
    }


def build(universe, codes):
    out = {}
    for folder in ('factions', 'commands'):
        directory = os.path.join(universe, folder)
        if not os.path.isdir(directory):
            continue
        for name in sorted(os.listdir(directory)):
            if not name.endswith('.yml'):
                continue
            read = read_faction(os.path.join(directory, name))
            if read and read[0] in codes and read[0] not in out:
                out[read[0]] = read[1]
    return dict(sorted(out.items()))


def main(universe):
    with open(os.path.join(OUT_DIR, 'index.json'), encoding='utf-8') as f:
        index = json.load(f)
    codes = {code for system in index for owner in system['owners'] for code in owner['factions']}
    factions = build(universe, codes)
    with open(os.path.join(OUT_DIR, 'factions.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump({'_notice': NOTICE, 'factions': factions}, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    missing = sorted(codes - set(factions))
    print(f'{len(factions)} of {len(codes)} owner codes named; no name for: {", ".join(missing) or "none"}')


if __name__ == '__main__':
    main(sys.argv[1])
