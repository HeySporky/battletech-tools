# Mordel.net units with the user's own API key: design

Date: 2026-11-06. Branch `mordel-user-key`. The owner asked for this before going to bed ("build it all out") and was
not available for questions, so every decision below not quoted from the owner is marked **(my call)**.

## Intent

Users pick a mordel.net unit and use it in the app: add it to a Classic roster, an Alpha Strike roster, or load it into
the 'Mech/vehicle designer as a base to modify. It works like the MUL: we scrape and ship a list, the user picks from
the list, and the app pulls the unit's details from mordel.net with the user's own API key. Scott (mordel.net) agreed
to per-user keys on 2026-11-06 (mapping doc §5).

The owner's words:

- "select a unit from Mordel and have it added to their rosters... classic and/or alpha strike... in the unit designer
  to use a base to mod from"
- "we will scrape as we are now, get the list, then we can provide users that list, they can select from the list
  which they want to see, it then uses their API key to pull details"
- "a user can use their own key to pull units... either public, or their own private design"
- "their own My Mordel designs section"
- "as long as Scott's canon listings match our MUL listings in BV and stats, then we can reduce our size by pulling
  those off our shipped code. If they do not match then we need to have a discussion after we do everything else"

## Goals

1. Settings: a "Mordel.net" section to save, test and remove the user's API key.
2. A shipped list of Mordel units, kept current on the device with `updated_since` when the user has a key.
3. One "Mordel.net units" panel (search, pick, pull details) used in three places: the Alpha Strike roster's add
   page, the Classic roster's add dialog, and the 'Mech designer's imports page.
4. A separate "My Mordel designs" section for the key owner's own designs, private ones included.
5. Canon units that match our MUL (BV and Alpha Strike stats) are left out of the shipped list; mismatches go to a
   report for the owner to discuss.

## Non-goals

- Pushing designs to mordel.net (asked of Scott, not agreed).
- Any server or account of our own.
- Shipping unit details: only the list ships. Details come from mordel.net per user.

## Anti-goals

- The key never leaves the device except to mordel.net in the `X-API-Key` header. It is never put in a URL, a log
  line, a backup, an export, an error message or the repo.
- Member designs are never committed to a pushed branch without the owner's OK (mapping doc §3: "this repository is
  public"). The list data commit stays on this local branch until the owner decides.

## Constraints

- Static PWA on GitHub Pages; no backend. CORS is not enabled on mordel.net yet (asked; Scott's agent says it is
  easy). Until then the app can only reach the API through the Vite dev server proxy.
- Browsers cannot set `User-Agent`; the browser client omits it.
- API: `/api/v1/units` (paged list), `/api/v1/units/{type}/{id}` (detail); types bm, cv, im, pm; 401 bad key, 404 not
  found/private, 503 busy. The CLI sync (`tools/mordel-sync`) already has the client, retry and paging.
- localStorage is the app's only storage (about 5 MB shared with saves).

## Decisions

### Key storage **(my call)**

- Stored under its own localStorage key `mordelApiKey`, not in AppSettings. Backups list their fields explicitly
  (`getFullBackup`), so the key is never in a backup or a settings export.
- The settings page shows only whether a key is saved and its last four characters.
- "Test key" calls `/units?limit=1`. A 401 at any time marks the key as rejected and the panel asks for a new one.
- API base: production `https://mordel.net/api/v1` by default (VERIFY with Scott), sandbox selectable in the
  settings section when the developer menu is on. In `vite dev` the client goes through the `/mordel-api` and
  `/mordel-sandbox-api` proxies, so it works before CORS exists.

### Browser client

- Reuses `tools/mordel-sync/mordel-client.mjs` (`createClient`, `listUnits`), with `userAgent` made optional (no header
  when absent). A browser pause of 250 ms between calls replaces the CLI's 1 s **(my call)**: users pull one unit at a
  time.

### Detail cache **(my call)**

- Pulled details are kept in localStorage under `mordelDetailCache`, newest 50, keyed `type/id` with the list's
  `updated` stamp; a newer stamp in the list drops the cached copy. Units already added to a roster or saved in the
  designer are full app units and don't need the cache.

### Shipped list

- `tools/mordel-sync/build-mordel-list.mjs` reads the mirror's details and writes `src/data/mordel/*.json` in the MUL
  table format (`pack-json.mjs`), chunked by type and id. Row fields: the 21 list fields minus `url`, `created`,
  `cost`, plus `name_parts` (name, model), `mul_id`, `role`, and the Alpha Strike block (`type`, `size`, `move`,
  `tmm`, `armor`, `structure`, `damage`, `overheat`, `point_value`, `specials`) so the Alpha Strike panel can show and
  add a unit with no API call **(my call)**.
- Canon dedupe: a canon unit is left out when it matches a live MUL record on BV, PV, size, move, armor, structure and
  damage. Matching: `mul_id` → the legacy record in `tools/mul-sync/archive/replaced-legacy-records.json` → its live
  `MulUnitKey`; failing that, the same chassis, model and tonnage. Every canon unit that does not match goes in
  `tools/mordel-sync/canon-mismatch-report.json` with the differences, for the owner's discussion. Canon units with no
  MUL record at all stay in the list.
- With a key, the app tops the list up with `updated_since` (the newest stamp it has, saved in localStorage
  `mordelListTopUp`) and keeps the extra rows on the device, up to 2,000 **(my call)**.
- Removals: no feed yet (asked Scott for `removed_since`). A 404 on pull hides that unit on this device.

### My Mordel designs

- Scott has not named the endpoint yet. `MORDEL_MY_UNITS_PATH` is a placeholder (`/units/mine`); a 404 from it shows
  "mordel.net doesn't offer this yet". Its rows use the list format, so the same panel shows them.
- Until then, the section also accepts a pasted mordel.net unit link or `type/id`, so a user can pull a private design
  they own by its id **(my call)**.

### Using a unit

- Alpha Strike: the list row's (or detail's) `alpha_strike` block → an `IASMULUnit` → `AlphaStrikeUnit.importMUL`
  → the roster's `addToGroup`. `mulSource` is `"mordel"` so the unit card can say where it came from.
- Classic and the designer, 'Mechs (bm, im): the detail → MegaMek `.mtf` text → the existing `importBattleMechMtf`.
  Mordel gives no actuators and no engine, gyro, cockpit or dynamic (Endo/Ferro) slots, so the converter places the
  fixed slots in their standard places, keeps every actuator unless the arm's equipment can't fit (hand first, then
  lower arm), and fills dynamic slots into the empty slots, legs and arms first. Mordel's own MTF export does the
  same (all actuators kept; `src/utils/__fixtures__/mordel-dola-dol-1a2.mtf`).
- Vehicles (cv) and ProtoMechs (pm): the detail → `.blk` text → `importBlkUnit`. Done after the 'Mech path; if the
  night runs out, those types show "Classic import not ready" and Alpha Strike still works.
- Every conversion is checked: our computed BV against Mordel's `battle_value`. A mismatch or an import issue shows a
  "check this unit" warning listing the issues; the unit is still added.

## Left to the builder

- Panel layout, search fields (name, model, tons, era, tech base, canon/fan), page size.
- The exact Mordel-name to catalog mapping; measure it across the mirror's canon 'Mechs (BV match rate).

## Questions for Scott (add to the next reply)

- The API has no actuator data (lower arm and hand). Could the detail say which are present?
- Production API base: is it `https://mordel.net/api/v1`?
- The "my units" endpoint path once it exists. The app uses `/units/mine` as a placeholder.
- Stack increments: we read communications equipment as 1 ton per increment, and infantry and cargo bays as 0.5 ton.
  Is that right?
- OmniMechs: the detail gives no base (fixed) heat-sink count, so the MTF base heat-sink line cannot be written.
  Could it be added?
- Artemis and Apollo: `fire_control` says a vehicle has them, but not which launchers. We read it from the
  "[Artemis IV]" mark on the ammo. 19 of 345 Artemis vehicles mix marked and unmarked launcher ammo, and none of the
  25 Apollo vehicles mark their ammo. Could each launcher say what it is linked to?
- May we ship the unit list (names, designers, Battle Value and Alpha Strike cards) in our public app? If not,
  is about 57 list requests per new user acceptable for a first pull? (Storage memo, 2026-11-07.)
  **Answered 2026-11-07: yes, the list ships with the app** (storage memo, "The list").
