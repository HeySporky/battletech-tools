"""Cross-check the star system index against the Inner Sphere Cartography Society's vector maps.

    python -I scripts/star-systems/iscs_crosscheck.py [maps-dir]

maps-dir defaults to C:/repo/JBTIICRework/maps-and-art. The maps are vector PDFs: each system is a 1.3-point stroked
circle, and its name label (2.73-point text) is set with the dot at the label's top-left corner. The label's colour is
its owner's; the legend sets each owner's name in that same colour, so owners are read from the label colour and only
for colours the legend names (black and any colour the legend leaves out are skipped and counted).

Scale and origin are measured, not assumed: origin at Terra's dot, scale from Terra to Tharkad (y flipped: up on the
page is +y), checked against a least-squares fit over every system whose name matches.

Reports, per map: positions more than 3 light-years from the index, map names the index lacks, index systems inside
the map's frame that the map lacks, and owners that differ at the map's date. Writes them into the verification ledger
between the ISCS markers (the rest of the ledger is kept).
"""
import json
import math
import os
import re
import sys
import unicodedata

import pymupdf

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
INDEX = os.path.join(ROOT, 'src', 'data', 'star-systems', 'data', 'index.json')
LEDGER = os.path.join(ROOT, '.superpowers', 'sdd', '2026-11-19-campaign-play', 'star-systems-verification.md')
START, END = '<!-- iscs:start -->', '<!-- iscs:end -->'
TOLERANCE_LY = 3.0

MAPS = [
    # (file, year, date the index is read at)
    ('Inner Sphere circa 2750 (Inner Sphere Cartography Society).pdf', 2750, '2750-12-31'),
    ('Inner Sphere map (Inner Sphere Cartography Society).pdf', 3025, '3025-12-31'),
    ('Inner Sphere circa 3040 (Inner Sphere Cartography Society).pdf', 3040, '3040-12-31'),
    ('Inner Sphere JumpShip paths 3062 (Inner Sphere Cartography Society).pdf', 3062, '3062-12-31'),
]

# Legend name -> MegaMek faction codes that count as the same owner. "Periphery (Other)" is any code not named by
# another legend entry on that map.
LEGEND_CODES = {
    'Capellan Confederation': {'CC'}, 'Cappellan Confederation': {'CC'},
    'Draconis Combine': {'DC'},
    'Federated Suns': {'FS'},
    'Federated Commonwealth': {'FC', 'FS'},
    'Free Worlds League': {'FWL'},
    'Lyran Commonwealth': {'LA'}, 'Lyran Alliance': {'LA'},
    'Terran Hegemony': {'TH'},
    'Magistry of Cannopus': {'MOC'},
    'Outworlds Alliance': {'OA'},
    'Taurian Concordat': {'TC'},
    'Marian Hegemony': {'MH'},
    'Free Rasalhague Republic': {'FRR'},
    'St. Ives Compact': {'SIC'},
    'Clan Ghost Bears': {'CGB'},
    "Clan Hell's Horses": {'CHH'},
    'Clan Jade Falcons': {'CJF'},
    'Clan Wolf': {'CW'},
    'Arc Royal Defense Cordon': {'ARDC'},
}
OTHER = 'Periphery (Other)'
# Codes that say nobody (or nobody yet) holds the world: never an owner disagreement with a coloured label.
NO_OWNER = {'UND', 'ABN', 'NONE', 'U'}


def norm(name):
    name = unicodedata.normalize('NFKD', name.replace('\ufffd', "'"))
    name = re.sub(r'\(.*?\)', '', name)
    return re.sub(r'[^a-z0-9]', '', name.lower())


def is_dot(d):
    r = d['rect']
    return d['type'] == 's' and abs(r.width - 1.3) < 0.2 and abs(r.height - 1.3) < 0.2


def read_map(path):
    page = pymupdf.open(path)[0]
    dots = [((d['rect'].x0 + d['rect'].x1) / 2, (d['rect'].y0 + d['rect'].y1) / 2)
            for d in page.get_drawings() if is_dot(d)]
    labels, legend = [], {}
    for b in page.get_text('dict')['blocks']:
        for line in b.get('lines', []):
            for s in line['spans']:
                text = s['text'].strip()
                if not text:
                    continue
                if s['size'] < 4:
                    labels.append((text, s['bbox'], s['color']))
                elif s['color'] != 0 and text.replace('\ufffd', "'") in LEGEND_CODES or text == OTHER:
                    legend[s['color']] = text.replace('\ufffd', "'")
    # Each label's dot: the nearest dot to the label's top-left corner (it sits about (+0.65, -0.45) from it).
    points = []
    for text, bbox, colour in labels:
        ax, ay = bbox[0] + 0.65, bbox[1] - 0.45
        best = min(dots, key=lambda p: (p[0] - ax) ** 2 + (p[1] - ay) ** 2)
        off = math.hypot(best[0] - ax, best[1] - ay)
        points.append({'name': text, 'px': best[0], 'py': best[1], 'off': off, 'colour': colour})
    return points, legend, dots


def owner_at(entry, date):
    current = []
    for o in entry['owners']:
        if o['date'] <= date:
            current = o['factions']
    return current


def fit(points, by_norm):
    """Terra-origin, Terra-Tharkad scale; and a least-squares scale over every exact match for comparison."""
    terra = next(p for p in points if p['name'] == 'Terra')
    tharkad = next(p for p in points if p['name'] == 'Tharkad')
    th = by_norm['tharkad'][0]
    scale = math.hypot(th['x'], th['y']) / math.hypot(tharkad['px'] - terra['px'], tharkad['py'] - terra['py'])
    num = den = 0.0
    for p in points:
        cands = by_norm.get(norm(p['name']), [])
        if len(cands) == 1:
            dx, dy = p['px'] - terra['px'], terra['py'] - p['py']
            num += dx * cands[0]['x'] + dy * cands[0]['y']
            den += dx * dx + dy * dy
    return terra, scale, (num / den if den else None)


def crosscheck(path, year, date, index):
    by_norm = {}
    for s in index:
        by_norm.setdefault(norm(s['id']), []).append(s)
    points, legend, dots = read_map(path)
    terra, scale, lsq = fit(points, by_norm)
    to_ly = lambda p: ((p['px'] - terra['px']) * scale, (terra['py'] - p['py']) * scale)
    named_codes = set().union(*(LEGEND_CODES[n] for n in legend.values() if n in LEGEND_CODES))
    res = {'year': year, 'file': os.path.basename(path), 'labels': len(points), 'dots': len(dots), 'scale': scale,
           'lsq': lsq, 'legend': sorted(set(legend.values())), 'far': [], 'renamed': [], 'map_only': [],
           'owner': [], 'matched': 0, 'owner_checked': 0, 'owner_skipped': 0, 'loose_label': []}
    seen = set()
    for p in points:
        x, y = to_ly(p)
        if p['off'] > 1.5:
            res['loose_label'].append((p['name'], round(p['off'], 2)))
        cands = by_norm.get(norm(p['name']), [])
        entry = min(cands, key=lambda s: math.hypot(s['x'] - x, s['y'] - y)) if cands else None
        if entry is None:
            near = min(index, key=lambda s: math.hypot(s['x'] - x, s['y'] - y))
            d = math.hypot(near['x'] - x, near['y'] - y)
            if d <= TOLERANCE_LY:
                res['renamed'].append((p['name'], near['id'], round(d, 2)))
                entry = near
            else:
                res['map_only'].append((p['name'], round(x, 2), round(y, 2), near['id'], round(d, 1)))
                continue
        seen.add(entry['id'])
        res['matched'] += 1
        d = math.hypot(entry['x'] - x, entry['y'] - y)
        if d > TOLERANCE_LY:
            res['far'].append((p['name'], entry['id'], round(x, 2), round(y, 2), entry['x'], entry['y'], round(d, 1)))
        owner_name = legend.get(p['colour'])
        if owner_name is None:
            res['owner_skipped'] += 1
            continue
        mm = owner_at(entry, date)
        if not mm or set(mm) <= NO_OWNER:
            res['owner_skipped'] += 1
            continue
        res['owner_checked'] += 1
        ok = (not (set(mm) & named_codes)) if owner_name == OTHER else bool(set(mm) & LEGEND_CODES[owner_name])
        if not ok:
            res['owner'].append((entry['id'], owner_name, ','.join(mm)))
    # Index systems inside the map's frame (the dots' extent, less the legend and title corner) that it lacks.
    xs = [(px - terra['px']) * scale for px, _ in dots]
    ys = [(terra['py'] - py) * scale for _, py in dots]
    legend_corner_x = (200 - terra['px']) * scale
    legend_corner_y = (terra['py'] - 460) * scale
    res['index_only'] = sorted(
        s['id'] for s in index if s['id'] not in seen
        and min(xs) <= s['x'] <= max(xs) and min(ys) <= s['y'] <= max(ys)
        and not (s['x'] < legend_corner_x and s['y'] > legend_corner_y)
        and any(o['date'][:4] <= str(year) for o in s['owners']))
    return res


def render(results):
    out = [START, '', '## ISCS cross-check (generated by scripts/star-systems/iscs_crosscheck.py)', '',
           'Origin at Terra\'s dot; scale from Terra to Tharkad; y flipped. "lsq" is the least-squares scale over every '
           'exact name match, as a check. Owners are read from the label colour, only for colours the legend names; '
           'the map\'s "circa" year is compared with MegaMek\'s owner on 31 December of that year, so owner rows near a '
           'change of owner are expected noise and are leads for the book check, not corrections.', '']
    for r in results:
        out += ['### %s (%s)' % (r['year'], r['file']), '',
                '- labels %d, dots %d, matched to the index %d; scale %.4f ly/pt (lsq %.4f)' % (
                    r['labels'], r['dots'], r['matched'], r['scale'], r['lsq'] or 0),
                '- legend: %s' % '; '.join(r['legend']),
                '- owners checked %d, skipped %d (label colour not in the legend, or MegaMek has no owner)' % (
                    r['owner_checked'], r['owner_skipped']),
                '- positions more than %.0f ly apart: %d; name differs (same place): %d; map names not in the index: '
                '%d; index systems in the frame not on the map: %d; owner differs: %d' % (
                    TOLERANCE_LY, len(r['far']), len(r['renamed']), len(r['map_only']), len(r['index_only']),
                    len(r['owner'])), '']
        if r['far']:
            out += ['Position more than 3 ly apart (map name, index id, map x,y, index x,y, distance):', '']
            out += ['- %s / %s: map %.2f,%.2f; index %.3f,%.3f; %.1f ly' % f for f in r['far']] + ['']
        if r['renamed']:
            out += ['Name differs, same place (map, index, ly apart): ' +
                    '; '.join('%s = %s (%.2f)' % n for n in r['renamed']), '']
        if r['map_only']:
            out += ['On the map, not in the index (map name, x,y, nearest index system, ly): ' +
                    '; '.join('%s %.1f,%.1f (near %s %.1f)' % m for m in r['map_only']), '']
        if r['loose_label']:
            out += ['Labels more than 1.5 pt from any dot (the dot may be wrong): ' +
                    '; '.join('%s %.2f' % m for m in r['loose_label']), '']
        if r['owner']:
            out += ['Owner differs (index id: map / MegaMek): ' +
                    '; '.join('%s: %s / %s' % o for o in r['owner']), '']
        if r['index_only']:
            out += ['In the index and inside the frame, not on the map (%d; mostly systems named after the map was '
                    'drawn): ' % len(r['index_only']) + ', '.join(r['index_only']), '']
    out.append(END)
    return '\n'.join(out)


def main(maps_dir):
    with open(INDEX, encoding='utf-8') as f:
        index = json.load(f)
    results = []
    for name, year, date in MAPS:
        r = crosscheck(os.path.join(maps_dir, name), year, date, index)
        results.append(r)
        print(year, 'labels', r['labels'], 'matched', r['matched'], 'far', len(r['far']), 'renamed', len(r['renamed']),
              'map_only', len(r['map_only']), 'index_only', len(r['index_only']), 'owner', len(r['owner']),
              'of', r['owner_checked'], 'scale %.4f lsq %.4f' % (r['scale'], r['lsq'] or 0))
    block = render(results)
    text = ''
    if os.path.exists(LEDGER):
        with open(LEDGER, encoding='utf-8') as f:
            text = f.read()
    if START in text and END in text:
        text = text[:text.index(START)] + block + text[text.index(END) + len(END):]
    else:
        text = text.rstrip() + '\n\n' + block + '\n'
    os.makedirs(os.path.dirname(LEDGER), exist_ok=True)
    with open(LEDGER, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else 'C:/repo/JBTIICRework/maps-and-art'))
