"""Build the star system catalog from MegaMek Data's canon systems (CC BY-NC-SA 4.0).

    python -I scripts/star-systems/import_mekhq_systems.py C:/repo/mekhq/MekHQ/data/universe/planetary_systems/canon_systems.zip

NGCFells's rule (2026-11-19): MegaMek's data is the base; our own books verify it. Corrections read from the books
live in src/data/star-systems/star-system-corrections.json and win over MegaMek's values here, with the book as
their source. Writes, sorted by id:
    src/data/star-systems/data/index.json      every system: id, name, x, y, owners by date (small; search and maps)
    src/data/star-systems/data/detail-<a-z|other>.json  star, recharge stations, planets with their sourced fields and events
"""
import json
import os
import sys
import zipfile

import yaml

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
CORRECTIONS = os.path.join(ROOT, 'src', 'data', 'star-systems', 'star-system-corrections.json')
# Not under src/data/bundled: the bundled-unit loader's globs (*-index.json, */*.json) would take these in.
OUT_DIR = os.path.join(ROOT, 'src', 'data', 'star-systems', 'data')


def shard_of(system_id):
    """Detail is split by the id's first letter (a-z, else "other"), so a page loads only what it opens."""
    first = system_id[:1].lower()
    return first if 'a' <= first <= 'z' else 'other'

PLANET_FIELDS = ('gravity', 'atmosphere', 'pressure', 'temperature', 'water')


class Loader(yaml.SafeLoader):
    """YAML 1.1 reads yes/no as booleans and dates as dates; keep dates as text."""


Loader.add_constructor('tag:yaml.org,2002:timestamp', lambda loader, node: loader.construct_scalar(node))


def plain(v):
    """A field's value, whether it is written plain or as {source, value}."""
    return v.get('value') if isinstance(v, dict) and 'value' in v else v


def sourced(v):
    """{value, source} for a field MegaMek cites; the bare value for one it does not (the app reads that as
    "MegaMek Data"), which keeps 124,000 repeated labels out of the files."""
    if v is None:
        return None
    if isinstance(v, dict) and 'value' in v:
        return {'value': v['value'], 'source': str(v['source'])} if v.get('source') else v['value']
    return v


# MegaMek estimates every planet's population every ten years (8.7 MB of 20). A campaign needs the figure, not the
# curve: keep a population that comes with a change of owner or rating, and one every POPULATION_YEARS years.
POPULATION_YEARS = 50


def date_of(v):
    return str(v)[:10]


def planet_record(p):
    rec = {'name': sourced(p.get('name')), 'type': str(plain(p.get('type')) or ''), 'sysPos': plain(p.get('sysPos'))}
    for field in PLANET_FIELDS:
        value = sourced(p.get(field))
        if value is not None:
            rec[field] = value
    events = []
    for e in p.get('event') or []:
        if not isinstance(e, dict) or 'date' not in e:
            continue
        ev = {'date': date_of(e['date'])}
        if e.get('faction') is not None:
            ev['factions'] = list(plain(e['faction']) or [])
        if e.get('socioIndustrial') is not None:
            ev['socioIndustrial'] = str(plain(e['socioIndustrial']))
        if e.get('population') is not None:
            year = int(ev['date'][:4])
            if len(ev) > 1 or year % POPULATION_YEARS == 0:
                ev['population'] = plain(e['population'])
        if len(ev) > 1:
            events.append(ev)
    events.sort(key=lambda ev: ev['date'])
    rec['events'] = events
    return rec


def system_records(data):
    sid = str(data['id'])
    primary = plain(data.get('primarySlot'))
    planets = [planet_record(p) for p in data.get('planet') or [] if isinstance(p, dict)]
    main = next((p for p in planets if p['sysPos'] == primary), planets[0] if planets else None)
    owners = []
    for ev in (main or {}).get('events', []):
        if 'factions' in ev:
            if owners and owners[-1]['date'] == ev['date']:
                owners[-1]['factions'] = ev['factions']
            elif not owners or owners[-1]['factions'] != ev['factions']:
                owners.append({'date': ev['date'], 'factions': ev['factions']})
    recharge = []
    for e in data.get('event') or []:
        if not isinstance(e, dict) or 'date' not in e:
            continue
        r = {'date': date_of(e['date'])}
        if 'nadirCharge' in e:
            r['nadir'] = bool(plain(e['nadirCharge']))
        if 'zenithCharge' in e:
            r['zenith'] = bool(plain(e['zenithCharge']))
        if len(r) > 1:
            recharge.append(r)
    index = {'id': sid, 'name': sid, 'x': float(data['xcood']), 'y': float(data['ycood']), 'owners': owners}
    detail = {'id': sid, 'spectralType': sourced(data.get('spectralType')), 'primarySlot': primary,
              'recharge': recharge, 'planets': planets}
    return index, detail


def apply_corrections(index, detail, corrections):
    """Each correction sets one field from a book. path: "x", "y", "name", "spectralType", "primarySlot", or
    "planets.<sysPos>.<field>" (sourced planet fields). Returns the corrections that found no target."""
    by_index = {s['id']: s for s in index}
    by_detail = {s['id']: s for s in detail}
    missed = []
    for c in corrections:
        sid, path = c['systemId'], c['path'].split('.')
        i, d = by_index.get(sid), by_detail.get(sid)
        if i is None or d is None:
            missed.append(c)
            continue
        if path[0] in ('x', 'y', 'name'):
            i[path[0]] = c['value']
        elif path[0] == 'spectralType':
            d['spectralType'] = {'value': c['value'], 'source': c['source']}
        elif path[0] == 'primarySlot':
            d['primarySlot'] = c['value']
        elif path[0] == 'planets' and len(path) == 3:
            planet = next((p for p in d['planets'] if str(p['sysPos']) == path[1]), None)
            if planet is None:
                missed.append(c)
                continue
            planet[path[2]] = {'value': c['value'], 'source': c['source']}
        else:
            missed.append(c)
    return missed


def read_zip(path):
    index, detail = [], []
    with zipfile.ZipFile(path) as z:
        for name in z.namelist():
            if not name.endswith('.yml'):
                continue
            data = yaml.load(z.read(name).decode('utf-8'), Loader=Loader)
            if not isinstance(data, dict) or 'id' not in data or 'xcood' not in data:
                print('skipped', name)
                continue
            i, d = system_records(data)
            index.append(i)
            detail.append(d)
    index.sort(key=lambda s: s['id'])
    detail.sort(key=lambda s: s['id'])
    return index, detail


def main(zip_path):
    index, detail = read_zip(zip_path)
    with open(CORRECTIONS, encoding='utf-8') as f:
        corrections = json.load(f)
    missed = apply_corrections(index, detail, corrections)
    for c in missed:
        print('correction found no target:', c['systemId'], c['path'])
    os.makedirs(OUT_DIR, exist_ok=True)
    for old in os.listdir(OUT_DIR):
        if old.endswith('.json'):
            os.remove(os.path.join(OUT_DIR, old))
    shards = {}
    for d in detail:
        shards.setdefault(shard_of(d['id']), {})[d['id']] = d
    files = [('index.json', index)] + [('detail-%s.json' % key, shards[key]) for key in sorted(shards)]
    total = 0
    for name, data in files:
        path = os.path.join(OUT_DIR, name)
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        total += os.path.getsize(path)
    print('index', os.path.getsize(os.path.join(OUT_DIR, 'index.json')), 'bytes;', len(files) - 1, 'detail shards;',
          total, 'bytes in all')
    print(len(index), 'systems,', len(corrections) - len(missed), 'corrections applied')
    return 1 if missed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
