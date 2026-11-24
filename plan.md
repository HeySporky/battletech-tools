# Enhancement: Tiered, sharded unit data pipeline for the combined MUL (50k+ units)

## Problem

The current approach loads unit data as a single tabled JSON. With the mordel.net ingestion (~50,000 units) layered on top of the official MUL, the 1.0 MUL leftovers, and custom units, this will:

- Bloat the SPA bundle / initial payload well past what a phone or tablet can load comfortably
- Make list rendering and search sluggish or unusable on mobile
- Drown canonical units under tens of thousands of community designs, so users can't find what they're looking for
- Produce duplicate entries where the same unit exists in more than one source
- Grow the repo with every re-scrape if generated data is committed

## Goals

- Initial JS < 300 KB; first-paint data < 100 KB; search index < 2 MB (lazy-loaded)
- Any list interaction < 100 ms on a mid-range phone
- Official units findable by default; community units opt-in
- One stable identity per unit across all sources, with provenance
- Static hosting only (GitHub Pages / custom beta domain); no server component
- Offline-capable after first visit

## Proposal

### 1. Canonical merged dataset (build time)

All sources normalize into one `data/canonical.jsonl`, one line per unit:

```jsonc
{
  "id": "mul:1234",            // stable: mul:<id> | mordel:<id> | custom:<slug>
  "chassis_id": "atlas",       // groups variants under a parent
  "name": "Atlas",
  "variant": "AS7-D",
  "tier": "official",          // official | community | custom
  "source": "mul",             // mul | mul-1.0 | mordel | custom
  "source_url": "https://...",
  "scraped_at": "2026-10-29",
  "alt_sources": ["mordel:88721"],   // same unit found elsewhere; not a separate record
  "tonnage": 100, "bv": 1897, "pv": 52,
  "tech_base": "IS", "era": [...], "factions": [...], "role": "Juggernaut",
  "detail_ref": "atlas"        // which detail shard holds the full record
}
```

Merge precedence when the same unit appears in multiple sources: **official MUL → 1.0 leftovers → mordel → custom**. Losers are recorded in `alt_sources[]`, not duplicated.

Tier policy: `official` is on by default in all filters; `community` (mordel) and `custom` are opt-in toggles.

### 2. Three shipped data tiers

| Tier | Contents | Size target | When loaded |
|---|---|---|---|
| Search index | id, name, variant, tonnage, BV, PV, era, tech base, role, tier (~10 fields × 50k) | 1–2 MB brotli | Lazy, after first paint; cached in IndexedDB |
| Summary shards | List-view fields, grouped by chassis or weight class, ~200–500 units each | 20–80 KB each | On demand when a list needs them |
| Detail shards | Full record (equipment, quirks, record-sheet data), one file per chassis | varies | On tap; cached |

The tabled JSON we have today becomes an *input* to the normalizer. The app never fetches it.

### 3. Navigation and search

- Faceted filtering (tier, era, faction, tech base, weight class, role, tonnage/BV range) instead of a flat scroll
- Chassis-first browsing: ~1,500 chassis rows, expand to variants
- Client-side search via MiniSearch or FlexSearch over the index tier, with the serialized index prebuilt at compile time (no re-indexing on device)
- Virtualized lists (TanStack Virtual or equivalent) everywhere; never mount 50k rows

### 4. Caching and updates

- `manifest.json` lists version + content hash per shard
- Shard filenames are content-hashed (`shard.heavy-a7f3c2.json`) so GitHub Pages' short cache TTL doesn't matter; the client treats hashed files as immutable
- IndexedDB (Dexie) stores the index and visited shards; client diffs the manifest and refetches only changed shards

### 5. Repo and deploy hygiene

- Commit only `data/canonical.jsonl` (or compressed) plus scraper/normalizer source. Generated index/shards/manifest are **not** committed.
- GitHub Actions on this fork: `normalize → build data → vite build → actions/deploy-pages`. Keeps `main` small and history clean across re-scrapes.
- Beta on the custom domain via `CNAME` file + `beta.` subdomain; set bundler `base` so shard URLs resolve on both hosts.
- If `canonical.jsonl` exceeds ~50 MB, move it to Git LFS or regenerate in CI from a raw scrape cache.
- Known limits: Pages site 1 GB, single file 100 MB, soft repo limit ~1 GB.

### Alternative considered: SQLite over HTTP range requests

A single SQLite file queried with `sql.js-httpvfs` works on GitHub Pages (Range requests are honored) and gives arbitrary SQL filtering over all 50k rows with only touched pages downloaded. Trade-off: ~1 MB WASM runtime and a harder debug story. Worth a prototype *after* the sharded JSON path is working, not before.

## Implementation order

- [ ] Normalizer + canonical schema (`tier`, `source`, `chassis_id`, `alt_sources`). Validate against official MUL and 1.0 leftovers first.
- [ ] Build script emitting index + shards + manifest. Measure brotli sizes before touching UI.
- [ ] Facets + virtualized chassis list; `official` tier default-on.
- [ ] IndexedDB cache keyed by manifest hashes.
- [ ] Actions workflow deploying to the beta domain.
- [ ] Enable mordel ingestion; if index tier crosses ~2 MB, shard the index by tier.
- [ ] (Optional) Prototype sql.js-httpvfs and compare cold-start size and filter latency.

## Open questions

- Scraper etiquette for mordel.net: rate limiting, caching raw responses, and whether to attribute per-unit.
- Do custom units need a separate "my units" local store rather than being baked into the shipped data?
- Which chassis grouping key to use when sources disagree on naming (e.g. Clan vs IS designations)?
