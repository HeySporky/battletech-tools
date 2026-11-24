# mordel.net API: Scott's 2026-11-05 update mapped against our wish list

Wish list: `2026-11-01-mordel-data-pipeline.md` (ticket #2611-001). Scott's update: "Mordel.Net API update for
testers" (2026-11-05). Where his model differs from the wish list, his model wins.

Tested on the sandbox 2026-11-06 with the documented example units, read-only, 1 s between requests. Raw
responses (no key in them) were saved as sample fixtures for the sync client.

## 1. What his update covers

| Wish list item | Status after this update | Our side |
|---|---|---|
| §1.5 stable ids | Done: `id` per unit, sandbox = live (checked 2026-11-04) | Key on `unit_type_short` + `id` |
| §1.6 change feed | `updated_since` (inclusive). Units never edited have `updated: null`, and `updated_since` still returns them by `created` (checked: bm 98087). No deletions feed. | One `updated_since` query per sync; weekly full list diff for removals |
| §1.7 data plus exports | JSON detail is here. Exports (record sheet, AS card, MegaMek) are "coming next" as files | Wait for files |
| §1.8 provenance | `canon` (true = designer "Catalyst Game Labs"), `sources` (title, publisher, year; no page), `created`/`updated`. No code release marker | Use `canon` instead of the designer test |
| §2.1 types | `bm`, `cv`, `im`, `pm` only | Others never come from mordel |
| §2.1 identity | `name_parts` (name, alternate_name, model), `mul_id`, `omni`, `omni_base_id`, `omni_variants` | Use `name_parts`; drop our `[BASE]` name parsing |
| §2.1 status | `canon`, `designer` (display name only, no member id), `created`, `updated`. No approved flag, no public flag (only public units are served) | Credit by display name |
| §2.1 rules | `tech_base`, `mixed_tech`, `era`, `year`, `rules_level` (word) + `extinct`. No designer's own level, no edition built under | Map levels as decided; drop `extinct`; grade by equipment |
| §2.1 construction | `configuration`, `engine`, `heat_sinks`, `structure`, `armor` (+ points), `gyro`, `cockpit`, `myomer`, `jump_jets`, `targeting`, `fire_control`, turrets, `locations` (armor, rear, structure, patchwork types), `equipment` by item `id` per location with slots, facing, links, flags, stacks | Map each to our classes. Equipment `id` is an instance id; matching to our catalog is by `name` + `technology` (see §3) |
| §2.1 values | `battle_value`, `point_value`, `cost`. No member rating | Compare with ours |
| §2.1 Alpha Strike | `type`, `size`, `move` (text, e.g. `12"j`), `tmm`, `armor`, `structure`, `damage` S/M/L (text, `0*` minimal), `overheat`, `point_value`, `specials`. No E range, no threshold, no role here (role is a top-level field) | Parse move and damage text |
| §2.1 quirks | Not coming (he has none) | None |
| §2.1 availability | Not in the update | None |
| §2.1 text | `fluff` (overview, capabilities, deployment, variants, notables) | Import as readout text, credited |
| §2.1 reviews | Not in the update (low priority anyway) | None |
| §2.1 bulk archive | Not offered | Capped detail batches per run |
| §2.2 equipment database | Not yet | Match by name |
| §2.3 quirks database | Not coming | None |
| §2.4 forum | Out (Scott, 2026-11-02) | None |
| §2.5 downloads, §2.6 products | Not yet | None |
| §3 errors | JSON `{"status":"Error","message":...}` with 400/401/404/405/503 | Handle each; 401 stops the run |
| §3 ETag / Last-Modified | Not sent; `Cache-Control: no-store` only (fixed as he said) | Use `updated` instead |
| §3 API key | `X-API-Key` header only; a key in the URL is refused | As is |
| §3 versioned paths | `/api/v1/` | As is |
| Pictures | `image_url` with `?v=` cache buster, no key, needs a real User-Agent | Fetch only when `?v=` changes |

## 2. What we checked on the sandbox (2026-11-06)

All as documented:

- `/units?limit=3`: the 21 fields in the stated order, `canon` and `omni` present.
- `/units/{type}/{id}` for bm 474, 2303, 123, 5280, 75003, cv 1, 2993, 4774, 4411, pm 14: list fields first in the
  same order, then every detail field in the stated order, none missing, none extra. Every equipment entry has
  exactly the 17 stated fields.
- Location armor adds up to `armor.points` on all 12 units fetched.
- Wasp WSP-3L (bm 474): no Endo Steel or Stealth entries in `equipment`; `structure.type` and `armor.type` name them.
- Goliath (bm 123): `LFL RFL LRL RRL`, no arms. Pwwka LAM (bm 5280): biped codes, `configuration` "Land-Air (Standard)".
- Gold Knight (bm 75003): the PPC Capacitor's `associated_id` is 90, the ER PPC entry's `id`.
- Schiltron PRIME (cv 2993): `omni_turret_tons` {turret 2}. Atlatl II (cv 4774): `Dual`, FT/RT locations.
  TNK-420 (cv 4411): `artemis` "IV-P". Ferret (cv 1): rotor `RO`.
- Errors: unknown id, leading zero and upper-case type give 404 "Unit not found"; a query parameter gives 400 with
  his message; no key gives 401; POST gives 405. Every response sends only `Cache-Control: no-store`.

Not as documented (for Scott):

1. **Hammer HMR-5M (bm 98087)** still shows `cost: 0` and `armor.tons: 0` (105 points, Impact-Resistant) in both
   `/units` and `/units/bm/98087`. The update says 7.5 tons and 5,167,240. Maybe the data fix is on live only.
2. **Sheinhardt Rokett Trukk (cv 5001)** still starts with a non-breaking space in `name` and `name_parts.name`.
3. A trailing slash (`/units/bm/474/`) gives 404 "Endpoint not found", not "Unit not found". Still a 404 as the
   update says; only the message differs.
4. An Omni base lists itself as its own base: Fire Falcon [BASE] (bm 2303) has `omni_base_id: 2303`. Fine for us,
   but the update only describes variants, so worth one line in the docs.
5. `updated` is `null` on units never edited, and `updated_since` returns them by `created`. That answers our earlier
   question (no need for `created_since` in a sync); worth one line in the docs.
6. Equipment `id` is a per-unit instance number (Heat Sink is 13 on bm 474 and on bm 123, ER Medium Laser 5 on
   bm 474 and 77 on bm 98087), and it is `null` on slotless items: the Centaur's (pm 14) ProtoMech ammo comes as five
   `LRM 3 (Ammo 1)` entries with `id` and `location` both null. The docs say only that `location` is null.

## 3. Open for our side

- **Equipment matching.** Unit `equipment[].id` is an instance id within the unit, not an equipment database id,
  so grading rules levels by equipment (wish list §4) means matching `name` + `technology` to our catalogs. Until
  his equipment database exists, unmatched names go to a review list, not a guess.
- **Load on his server.** A full detail pull is about 56,000 requests. The sync client takes the list in 57 pages,
  then details only for new or changed units, capped per run (like `mul:sync`), with a pause between requests.
  Ask Scott what pace he wants for the first full pull.
- **Where the copy lives.** The battletech-tools repo is public. Member designs should not be committed there
  until the user and Scott agree; the mirror stays git-ignored until then.

## 4. Reply to Scott (approved and sent by the user, 2026-11-06)

This final text replaces the first draft. Changes from the draft: the three mismatches are put down to a sandbox not
yet updated (to recheck after his next update), the pacing question is dropped, and the per-user key idea is added.

> Thanks, Scott. We ran your examples against the sandbox and nearly everything matched your notes: the field order,
> every detail field, the armor totals, the four-legged and LAM codes, the PPC Capacitor link, the turrets, the errors
> and the cache header. Nice work.
>
> Three items didn't match yet. We suspect the sandbox just hasn't picked up those fixes, which is no problem; we'll
> check them again after your next sandbox update:
>
> - Hammer HMR-5M (bm 98087) still shows cost 0 and 0 armor tons.
> - The Sheinhardt Rokett Trukk (cv 5001) name still starts with a non-breaking space.
> - `/units/bm/474/` returns "Endpoint not found" rather than "Unit not found".
>
> A few things work well for us as they are, and might be worth a line in the docs for other testers:
>
> - An Omni base lists its own id as `omni_base_id` (Fire Falcon [BASE], bm 2303).
> - `updated` is null on units that were never edited, and `updated_since` still finds them by `created`.
> - Equipment `id` is numbered within each unit, and it is null on slotless items. For example, the Centaur (pm 14)
>   has five `LRM 3 (Ammo 1)` entries with null `id` and `location`. The docs mention only the null `location`.
>
> One bigger idea we'd love your thoughts on. Rather than bundle unit details with the app, we'd like to ship only the
> list of units. Each user would get their own mordel.net API key, enter it in the app, and pull up details for just
> the units they want, straight from your server. That keeps our download small, keeps the data current, and leaves
> you in control of who has access and how much each person uses. Would you be open to that? If so, two practical
> questions: can any member request a key, and will the API accept calls made directly from a web browser (CORS),
> since the app runs in the browser?
>
> Our first full pull is running now at one request per second. Just say if you'd like it slower.

Follow-ups: recheck the three mismatches after Scott's next sandbox update. His answer on per-user keys and CORS
decides option (c) in the storage decision memo (tools handoff, step 2).

## 5. Scott's answer and our second reply (2026-11-06, evening)

Scott's answer, in short:

- The Hammer (bm 98087) and Sheinhardt (cv 5001) are fixed in production, with code to stop designs getting into
  that state. The sandbox shows the fix only after he copies production to it again. The rewrite rules are being
  changed to accept a trailing slash.
- When the docs are complete, our agent can walk through them for gaps.
- He agrees with per-user keys: pulling the list is cheaper, and users pull stats with their own accounts. His
  agent says CORS is safe and easy if the key stays in the browser. He asked: do users need accounts on his site
  (the key links the two)? Is the key entered once and stored in the browser? Should private units, such as the
  user's own, come in too? Should the list carry more data?

Measured for the reply (sample of every 50th of the 40,047 details pulled by 21:15): a unit detail averages
9.4 KB (1.6 KB gzipped). All 56,043 come to about 530 MB raw, 87 MB gzipped each. The list fields alone are about
440 bytes per unit: about 25 MB raw, about 3.5 MB as one gzipped file.

Reply as sent by the user (2026-11-06):

> Scott,
>
> Thanks. That all makes sense on the Hammer, the Sheinhardt and the trailing slash. I'll recheck them after your
> next sandbox copy. And yes, I'd be glad to have my agent walk through the docs when they're done.
>
> I'm glad you like the per-user key idea. To your questions:
>
> 1. Accounts: Yes. Each user makes their own mordel.net account and requests a key, and the key is the link
>    between the two. Our app has no server and no accounts of its own, so we never see or store anyone's key.
> 2. Storage: Yes. They enter it once and it stays in the app's storage on their own device. It's only ever sent to
>    mordel.net, in the X-API-Key header. They can remove it at any time, and if you revoke a key, the app will see
>    the 401 and ask them for a new one.
> 3. Private units: I like that a lot. Something like a "my units" list that returns the key owner's own designs,
>    private ones included, in the same format as the main list. Private details would only ever go to their
>    owner's key. Then people could use their own work-in-progress designs in the app. If you have the tie in on the
>    API, I will build a couple of private units to test the functionality.
>
> On CORS, a few details from our side:
>
> - The app runs from three addresses: https://jeffs-bt-tools.github.io (the original), https://heysporky.github.io,
>   and https://ngcfells.github.io (my test copy). Allowing those three origins is enough, or "*" works too, since
>   the key travels in a header and not a cookie.
> - Because X-API-Key is a custom header, the browser first sends an OPTIONS request without the key. That request
>   needs to succeed without a key and allow the X-API-Key header and GET. An Access-Control-Max-Age header would
>   save a lot of those extra requests.
> - If it's easy, the same header on the unit images would let the app draw them onto printed record sheets.
> - A 429 with a Retry-After header when someone goes too fast would let the app back off politely rather than keep
>   hammering.
>
> On extra list data: the list we ship would be a snapshot, and each user's app would keep it current with
> updated_since. Three additions would help:
>
> - name_parts, so people can search by chassis and model
> - mul_id, so we can match your canon units to the MUL data we already have
> - role
>
> The one gap is removals. updated_since can't tell us when a unit is deleted or made private. Something like a
> removed_since list of type and id would close that.
>
> For scale: the full details come to about 530 MB (about 87 MB compressed), while the list alone is about 25 MB
> (about 3.5 MB compressed). The per-user approach is clearly the right one. My full pull is about 40,000 of 56,000
> units in and should finish early tomorrow morning. I will also be out of pocket for a bit… I have to get packed
> up, and then the wife and I are headed to UT as I have conference to attend there next week for work. I may be
> able to some stuff from the hotel, but am going to assume I may be fully out next week.
>
> Chris

## 6. Archived fan designs (separate thread, 2026-11-06)

The user asked Scott whether to post old fan designs found through archive.org under an archivist account, crediting
the original creators. Scott had no problem with it but worried about forum clutter, and asked whether building
them as real designs in the designer would preserve them better.

Reply as sent by the user (2026-11-06):

> Scott,
>
> Good point. Building them as real designs is the better way to preserve them, and it keeps them out of the
> forums. Here's my plan, if it works for you:
>
> - Build each one in the designer under a separate archivist account and mark it as non-canon.
> - Put the credit in the notes: the original creator when known, where and when it was posted, and the
>   archive.org link.
> - Where an old design isn't legal under current rules, build it as close as I can and note what changed.
>
> A few questions:
>
> 1. Is there, or could there be, an "original designer" field, so the credit shows on the design rather than only
>    my account name?
> 2. If an original creator turns up later and wants their design, could you move it to their account?
> 3. Many of these survive as old MegaMek (.mtf), Solaris Skunk Werks or HeavyMetal files. Can the designer import
>    any of those? It would save a lot of retyping.
> 4. Or could we do a push from my API key specifically? I build it in our app and push it over to your server? That
>    would be awesome long term, but we would need to do some reverse mapping to make it work.
>
> Chris

## 7. Scott's answers to both threads (received 2026-11-08)

API thread:

- Per-user keys: going ahead. Users can fetch a list of their own units, and he will add everything CORS needs.
- Images: they are plain files under `images/tro/`, not API responses, so a small `.htaccess` in that folder adds
  the same CORS header. **Our side:** set `crossOrigin = "anonymous"` on any image we draw onto a record sheet
  (canvas), or the canvas is tainted.
- The unit list will carry name_parts, mul_id and role.
- Removals: instead of `removed_since` he will add an id list, something like `/units/ids`, returning the type and
  id of every unit the key can see, in one small response (about 600 KB uncompressed for all 56,000). We compare
  it with our local copy and drop anything missing. It catches every removal (account deletions too), works with
  `owner=me`, only lists units the key can already see, and needs no website changes. A daily check is plenty.
  Keep using `updated_since` for additions and changes.
- He expects the API to be done or nearly done when the user is back from Utah, ready for us to walk it for gaps.

Archive-designs thread (he agrees with the plan: archivist account, non-canon, credit in notes):

1. Original-designer field: no dedicated field (only one use case). He plans user-defined fluff fields, and an
   "Original Designer" fluff field could be made then.
2. Moving a design to its original creator's account later: yes.
3. Import: no HMP or SSW import (those programs are dead). A MegaMek file upload is requested but not built yet.
4. Push from our API key: possible as an API v2 if we can wait, depending on volume. It needs a shared unit format,
   likely JSON (his old "MechML" idea). He suggests drafting the structure with AI and wants to involve Hammer so
   the MegaMek team is on board.

Follow-ups (both threads):

- Recheck the Hammer, the Sheinhardt and the trailing slash after Scott's next production-to-sandbox copy.
- Per-user keys are confirmed (2026-11-08), so option (c) is the plan. He is building CORS (images via
  `.htaccess`), a "my units" list, name_parts/mul_id/role in the list, and `/units/ids` for removals. When it
  lands: walk the docs for gaps, recheck the preflight, Max-Age and 429 details we asked for (not confirmed in his
  reply), make test private units, and set `crossOrigin = "anonymous"` on record-sheet images.
- Removals in the sync client: replace any planned `removed_since` with a daily `/units/ids` compare.
- Archive designs: plan agreed. Credit goes in the notes for now (fluff field later). Import is out for now. A push
  API is a possible v2: it would need a shared JSON unit format, drafted with MegaMek (Hammer) involved.
- The user is away at a conference in Utah the week of 2026-11-09 and may be fully offline.

## 7. Scott's REST API v1 docs (2026-11-10) against the `mordel-user-key` branch

Read: `documentation.php?a=api&s=start`, `s=endpoints`, `s=reference` (Code Release 2.26.30). The docs pages answer 406
to curl without a browser User-Agent. Checked live with the sandbox key, read-only, 5 points in all: `/key` 200;
`/units?owner=me&limit=2` 200 with 0 units (the sandbox key owns none yet); `/units?type=bm&updated_since=...&limit=2`
200, `next_cursor` is `bm-41449`, and the rows come back in id order, NOT by `updated`; the OPTIONS preflight returns
204 with `Allow-Headers: X-API-Key`, `Allow-Methods: GET`, `Max-Age: 86400`; every response carries `Allow-Origin: *`
and exposes `Content-Disposition, Retry-After`.

### What already matches

CORS works from the browser as built (no User-Agent, key in the header only, no credentials). `limit` 1000, cursor
paging, `updated_since`, `/units/{type}/{id}`, 401 stops and asks for a new key, 404 gives null, and the summary and
detail fields in `mordel-types.ts` are the documented ones.

### Gaps, most important first

1. **"My designs" calls a path that does not exist.** `MORDEL_MY_UNITS_PATH = "/units/mine"` in `mordel-api.ts` is a
   placeholder, and the panel says "does not offer a list of your designs yet". Scott's answer is
   `GET /units?owner=me` (every privacy level, same cursor paging). Change `fetchMyMordelUnits` to page through
   `listUnits(... { owner: "me" })` (add `owner` to `listUnits` in `tools/mordel-sync/mordel-client.mjs`) and drop the
   400-means-not-there branch. Rows now carry `privacy`: add it to `IMordelListRow` and show it in the panel, and treat
   `semi_private` and `private` details as private (cache cleared with the key, as now).
2. **The top-up resume rule is wrong for the way pages are ordered.** `topUpMordelList` (`src/data/mordel-list.ts`)
   assumes "pages come oldest first" and, when it hits `TOP_UP_LIMIT` (2000), resumes from the newest `updated` in the
   rows it kept. The docs and the live call say pages are ordered by type, then id. After a cut-short run, `since`
   jumps forward and every changed unit not yet read (later ids, other types) with an older stamp is skipped for good.
   Fix: when cut short, save the `next_cursor` with the `since` and the first page's `server_time`, resume from that
   cursor next time, and move `since` on only when a sweep reaches `next_cursor: null`. A full list is only 57 pages
   (57 of the 120 points per 60 s), so raising the cap is the other option.
3. **`server_time` is taken from the wrong page.** `fetchMordelListSince` keeps the LAST page's `server_time`
   (`page.serverTime ?? serverTime`). The docs say to save the one from the FIRST page, because it is taken before the
   units are read (a unit saved mid-sync is then picked up next time). The CLI (`mordel-run.mjs`) already uses
   `serverTime ??= page.serverTime`. Same fix in the app.
4. **Removals are not handled in the app.** Deleted and newly private units just stop appearing in `/units`. Scott's
   answer is `GET /units/ids` (2 points, all ids grouped by type, a few hundred KB, gzipped). The app never calls it, so
   a removed unit stays in the shipped list and the top-up rows. Add `fetchMordelIds()`; drop from the top-up rows,
   and hide in the shipped list (the hidden-keys list already exists), any unit missing from it. The CLI's weekly full
   list for removals can become one `/units/ids` call.
5. **429 is not honoured.** The client retries 429 and 503 after a fixed 30 s times attempt, and the app sets
   `retries: 0`, so a 429 shows "busy, try again in a minute". Retry-After is readable from the browser (exposed
   header) and exact: read it, wait that many seconds (cap about 60), then retry. A 503 stays a "try later". The "too
   many files at once" 429 (Retry-After 2) is the same if files are ever downloaded.
6. **Key test uses the wrong call.** `testMordelKey` calls `/units?limit=1`. `GET /key` exists for this (1 point, no
   data). Use it: it also keeps answering during a site release, when `/units` gives 503 and a good key would look
   "unavailable".
7. **Stale CORS wording.** The error says "mordel.net does not allow this site yet", and `MORDEL_DEV_PROXIES` in
   `mordel-key.ts` exists "before mordel.net allows this site (CORS)". CORS is open (`*`) and the preflight is cached a
   day, so remove the dev proxies and their vite config entries, and reword the error to "You may be offline, or
   mordel.net is down".
8. **Production base URL is unverified.** `MORDEL_BASES.production = https://mordel.net/api/v1` is marked VERIFY. The
   docs only give the sandbox address. Ask Scott (reply draft below).
9. **Types.** `IMordelEquipment.id` is `number | null` (slotless items), `technology` is `string | null`, and `facing`
   can be null. Missing from the detail type: `privacy`, `files`, `omni_variants`, `retrotech`, `frankenmech`,
   `communications_model`, `omni_turret_tons`, `jump_jets` tons. `alpha_strike.damage` has no `extreme` in the API (the
   optional field can go). `omni_base_id` is null for a variant whose base is private, so the importer must not
   require it.
10. **Possible features (owner's call, not gaps):**
    - `files.megamek` is a ready .mtf/.blk (1 point; 422 for FrankenMechs). We convert the JSON ourselves, so it
      could cross-check our converter against mordel.net's own export, or be the fallback for a unit our converter
      cannot build yet (section 2 of the next-steps plan). The Alpha Strike card and record sheet PDFs cost 10 and 4.
    - The five texts (readout, BV, Alpha Strike, weight, cost) give the book-style breakdowns: fetch the BV
      breakdown for a mismatch (section 4) instead of guessing. Texts can change without `updated`.
    - `image_url` is CORS-open: the record sheet can draw it on a canvas (`crossOrigin = "anonymous"`).
11. **Rate budget.** 120 points per 60 s: a 250 ms pause per call is 240 a minute, over budget if the app ever
    batches. Fine for one-at-a-time use; a batch import (a whole force) should pace at 500 ms or follow Retry-After.
12. **Not in v1, so keep our workarounds:** a removals feed (use `/units/ids`), an original-designer field, file
    import, a push endpoint. `designer` is the account display name only.

### Draft reply to Scott (for the owner to send or change)

> Scott,
>
> Thanks for the v1 docs. They are clear, and the CORS note (open origin, preflight cached for a day, Retry-After
> readable) is exactly what the browser app needed. We ran `/key`, `/units?owner=me` and a cursor page against the
> sandbox and it all behaved as documented.
>
> Two small questions:
>
> 1. Is the production address `https://mordel.net/api/v1`? The docs show only the sandbox.
> 2. Pages are ordered by type and id, so we resume a cut-short sync by cursor. Is a saved cursor safe to use a few
>    hours later (for example, to finish tomorrow), or should we start over?
>
> `/units/ids` covers removals well, so we will use that. The original-designer field is still the one we would use
> most: our archive designs are built under an archivist account, so the credit sits in the notes today. A free-text
> "credit" field on the unit would do.
>
> One thing we noticed: our sandbox key owns no units, so `owner=me` returned an empty list. We will make a few private
> test units and try again.

### Owner decisions needed

- Items 1 to 7 are fixes with no rules judgment; say go and they are built test-first on this branch.
- Item 10: wanted at all? Suggest the BV-breakdown use first (it speeds section 4).
- Send the reply, or change it.

## 8. After the fixes: rerun against the sandbox (2026-11-10)

Fixes for section 7 items 1 to 9 and 11 are in commit 152009764 (item 10 is the owner's call; item 12 is Scott's).
`npm run check` passes. Built: `owner=me` for My designs (paged, with `privacy` shown), cursor resume for a cut-short
top-up (`since` moves on only when a sweep ends), the first page's `server_time`, removals through `/units/ids`
(guarded: an empty answer or one lacking half of what we know is ignored), Retry-After on 429 (once, up to 60 s; 503
is shown at once), `GET /key` for the Test button, a 404 from a wrong address or a server without the API is now an
error and not "no such unit", the dev proxies and the CORS wording are gone, the types match the docs.

Rerun (read-only, about 33 points, key never printed; script was a throwaway):

- Errors: 14 cases all give the documented status and a JSON message. The messages are clear and name the fix
  (unknown parameter lists the allowed ones; limit, type, cursor, owner, updated_since each say what is valid).
- Fixed since our last reply: the trailing slash `/units/bm/474/` now answers 200, the Hammer HMR-5M (cost 5,167,240,
  armor 7.5 t) and the Sheinhardt name (no leading space) are right.
- `/units`: the 26 summary fields are all there in the documented order, no extras. Cursor `bm-32` style, rows in
  type then id order (bm30..bm34, bm37..). `updated_since` is inclusive; a future time gives an empty list.
  `server_time` differs from page to page (so taking the first page's, as the docs say, matters).
- `/units/ids`: 56,263 ids (bm 49,819, cv 5,447, im 582, pm 415), gzip, every id of a `/units` page is in it.
- Detail: all 28 documented detail fields present, none extra, on bm 474, cv 2993, pm 14, bm 2303. `files` has all 8
  links on every unit tried. Equipment `id` and `location` are null on slotless items (bm 474 has 1, pm 14 has 18);
  `technology` and `facing` were never null in the four units.
- Files: the BV breakdown text and the MegaMek .mtf download fine (content types and Content-Disposition as documented);
  an unknown format gives 404 with the list of formats; `quantity` on a MegaMek file gives 400.
- Headers: `Access-Control-Allow-Origin: *`, `Expose-Headers: Content-Disposition, Retry-After`, `Cache-Control:
  no-store` on success and on a 401, which also carries `WWW-Authenticate: X-API-Key`. The OPTIONS preflight (checked
  earlier) is 204 with `Max-Age: 86400`.

### Still open: nothing found wrong in the sandbox API; the gaps are these

1. **Production has no API yet.** `https://mordel.net/api/v1/ping` answers an HTML 404 (checked 2026-11-10). The app
   defaults to "production", so until Scott opens it every call fails with "mordel.net could not answer (404)" unless
   the user picks the sandbox in Settings. Options: default to the sandbox until production answers, or leave it and
   ask Scott when production opens (the draft reply asks).
2. **Not tested, cannot be from here:** `owner=me` with private and semi-private units (the sandbox key owns none; the
   owner will make some); a real 429 and its body (it needs 120 points in a minute: not worth forcing); the 503 during a
   release; the "Too many files at once" 429; the 422 for a FrankenMech MegaMek file.
3. **Docs wording that would help other testers** (for Scott, optional):
   - `omni_base_id` on a base is its own id (said); say that `omni_variants` lists only the variants the key can see
     (said), and that the base of a variant can be another member's private unit (said). All covered: no gap.
   - The docs say `/units/ids` is "all in one response"; it is about 56,000 ids (about 400 KB raw): say gzip is on.
   - `created_since` and `updated_since` together: not described (we never combine them).
   - Which time zone/clock `server_time` uses is Unix UTC (said). No gap.
   - The sandbox is a copy of production taken at a point in time (Scott told us in mail): a line in the docs would
     tell other testers why ids can differ from production.
4. **Command-line sync (`tools/mordel-sync`) still lists everything weekly to find removals.** One `/units/ids` call
   (2 points) would do it instead of 57 list pages. Not changed: it works, and the app now uses ids.
5. **Texts can change without `updated`** (Scott's note). The app does not store texts, so nothing to do until we
   fetch the BV breakdown for the BV work (section 4 of the next-steps plan); fetch it fresh each time.
