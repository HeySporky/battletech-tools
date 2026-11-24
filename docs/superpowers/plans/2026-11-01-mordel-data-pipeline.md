# A mordel.net data API: what we'd love to have

Scott,

Here's everything we'd like from the API, so you can decide what to build and how. Take it as a wish list, not a
spec you have to meet. Where mordel already stores something differently, your model wins and we'll adapt to it.

In short:

- every unit mordel holds, canon and custom, with all of its computed outputs;
- the equipment and quirk databases;
- the custom equipment and rules your members work out in the Bar & Grill;
- a change feed, so we only ever fetch what changed.

## 1. How we'd behave

1. **Read-only.** We never write to mordel, and nothing we fetch needs a member's login.
2. **Public data only.** Only what a logged-out visitor can already see: public units and public forum boards.
   Private designs stay private.
3. **Light on your server.** We'd sync once a week from one machine, cache everything and keep to any rate limit or
   API key you set. Our app never sends its users to your API: it reads our own copy.
4. **Credit.** Everything we use links back to its mordel page and credits the designer or poster by display name.
   I'd like your guidance on the wording (§5).

And what would make it easiest for us to consume:

5. **Stable ids.** A permanent id for every unit, equipment item, quirk, forum topic, post and attachment, kept
   through renames.
6. **A change feed.** Every list can be asked for "changed since <timestamp>", deletions included, so after the
   first sync we only fetch what changed.
7. **Data as well as rendered output.** We want the eight unit exports exactly as they are, plus JSON alongside them
   where the numbers already exist as data (§2.1). Parsing text that you generated from data is the fragile part of
   what we do today.
8. **Provenance.** Every record says whether it's canon or custom, its source (book and page for canon, the designer
   for custom), when it last changed, and which mordel code release produced it.

## 2. What we'd like

### 2.1 Units: all types, canon and custom (highest priority)

**Types.** Every type mordel stores. We've seen `bm`, `im`, `cv` and the ProtoMech create page (`cpm`). If you hold
others (support vehicles, battle armor, infantry, aerospace, DropShips and so on), we'd like those too, since our app
builds them all.

**Unit record (JSON).** The fields we'd use, wherever they exist:

| Group | Fields |
|---|---|
| Identity | id, type, chassis, model, name/model as listed, alternate names, MUL id if linked, variant/OmniMech configuration and its base unit |
| Status | canon or custom, source (book and page, or "Custom Mordel.Net Units"), designer (display name and member id), approved / approval date, public flag, created, last modified |
| Rules | technology base (IS, Clan, mixed), era, year, rules level as mordel grades it, **the designer's stated rules level, or a "custom/munchkin" call-out if you record one**, **the rules edition the unit was built under** (e.g. BattleTech Compendium, Master Rules, Total Warfare / TechManual) and, if you know it, the editions it is or isn't legal in |
| Construction | tonnage, configuration (Biped, Quad, LAM...), engine, structure, armor type and points by location, heat sinks, movement, cockpit, gyro, myomer, every installed item **by equipment id** with location, slots, facing, rear-mounting and ammo type/shots |
| Values | BV, PV, cost, member rating |
| Alpha Strike | size, move (and modes), TMM, role, damage S/M/L/E, OV, armor, structure, threshold, specials, PV |
| Quirks | quirk ids, positive and negative |
| Availability | factions and eras (the Availability tab) |
| Text | readout/fluff text, notes |
| Reviews | count, average, review text with author display name (optional, low priority) |

**All eight exports.** As `GET .../exports/<format>`, the same file the unit page's "Generate in format" button gives:

| Export | We'd want | And, if it's easy |
|---|---|---|
| MegaMek (MTF, BLK for non-'Mechs) | the file | — |
| Technical Readout | text | — |
| Record Sheet | PDF | — |
| Alpha Strike Card | image/PDF | — |
| Alpha Strike Conversion | text | JSON: every step of the conversion |
| Battle Value Breakdown | text | JSON: each BV line (defensive and offensive factors, speed factor, ammo, modifiers, total) |
| Weight Breakdown | text | JSON: each component's tonnage |
| Cost Breakdown | text | JSON: each C-bill line |

The JSON breakdowns matter most to us. We're not out to dispute your math: we want to check our own. Our app is in
beta, and comparing our BV, Alpha Strike, weight and cost calculations with yours line by line is the fastest way to
find where we've gone wrong. When we find a difference, we look at our side first.

**Bulk.** The listing already has a bulk "Generate units in" export (Record Sheet, Alpha Strike Card, MegaMek Unit
Listing). A bulk or archive download for the first sync (say, all units of one type as a zip, rebuilt nightly) would
save you many thousands of single requests.

### 2.2 Equipment database (high priority)

Everything behind `equipment.php?a=v`, canon and custom, by stable id: name and alternate names, type and category,
technology base, rules level, weight, slots or space by unit type, heat, damage, ranges, minimum range, ammo per ton,
explosive, BV, cost, introduction/extinction/reintroduction dates, tech rating and availability, Alpha Strike
specials, source (book and page, or the member who added it), and canon or custom status. Where an item's stats or
rules level changed between editions, the values for each edition.

**Rules editions.** We're making our app edition-aware, so players who own older rules and don't want to upgrade
can still use it. A unit or item that is legal under one edition may not be under another, or its stats may differ,
in either direction. So on both units and equipment, the edition a record was built or entered under, and anything
you know about how it differs in other editions, would be a big help.

Unit records would refer to equipment by these ids. That's how we grade a unit's rules level (§4).

### 2.3 Design quirks (medium)

Everything behind `units.php?a=vq`: id, name, positive/negative, the rule text or a summary, the units it applies
to, and the source.

### 2.4 Bar & Grill forum (high, for custom content)

We don't want to republish anyone's posts. We'd read them to pull out custom equipment, construction rules and house
rules, and turn what's usable into equipment and rules in our app, credited to whoever came up with it. Post text
never ships in the app. For that we'd need read access to the public boards:

- **Boards**: the board list (id, category, name, description).
- **Topics**: a list per board with "changed since"; id, title, author display name, created, last post, reply count,
  and tags or a flag if you have them.
- **Posts**: id, topic, author display name, posted/edited timestamps, body (raw markup and rendered HTML), and a
  link to the post it replies to or quotes.
- **Attachments**: id, file name, type, size, download URL. "Design Submissions" says "Design files can be attached
  for download", and those files are what we'd import.

The boards that matter most are **Design Submissions** (f=2) and **General Discussion** (f=1, for Classic
BattleTech rules and gameplay). If there are, or could be, boards or tags for custom equipment and house rules,
those would come first.

It would also help to link a thread to the custom unit or equipment record it discusses, if you already track that.

### 2.5 Downloads (medium)

The downloads list (`downloads.php?a=v`): id, title, type, version, date and file URL. We track errata versions, and
your list is one of our sources for them.

### 2.6 Products (to be decided)

The product pages render client-side and we couldn't see what's on them. If a product record carries title,
publisher, product number, year, ISBN, the units and equipment that appear in it, or errata, it would help us check
our sources. What does a product record hold?

### 2.7 What we don't need

Accounts and profiles (beyond the display name we credit), the store, the lottery, the calendar, links, forces
(unless you see a use for them), and the off-topic and general gaming boards.

## 3. A possible endpoint layout

Only a suggestion; any shape that covers §2 works for us. JSON over HTTPS, paginated, `?since=` on every list.

```
GET /api/v1/meta                          code release, last data update, rate limits
GET /api/v1/changes?since=<ts>            every changed or deleted id of any kind, in time order

GET /api/v1/units?type=&source=canon|custom&since=&page=
GET /api/v1/units/{type}/{id}             the record in §2.1
GET /api/v1/units/{type}/{id}/exports/{mtf|readout|record-sheet|as-card|as-conversion|bv|weight|cost}
GET /api/v1/bulk/units/{type}.zip         nightly archive (optional)

GET /api/v1/equipment?source=&since=      GET /api/v1/equipment/{id}
GET /api/v1/quirks?since=                 GET /api/v1/quirks/{id}
GET /api/v1/downloads?since=
GET /api/v1/products?cat=&since=          GET /api/v1/products/{id}        (if §2.6 is a yes)

GET /api/v1/forum/boards
GET /api/v1/forum/boards/{id}/topics?since=
GET /api/v1/forum/topics/{id}/posts?since=
GET /api/v1/forum/attachments/{id}
```

- Errors as JSON with a code, and a `410 Gone` (or a tombstone in `/changes`) for deleted or unpublished records.
- `ETag` / `Last-Modified`, so an unchanged request costs you almost nothing.
- An API key per client, if you want to see and limit who calls it.
- Versioned paths, so a schema change can't break us silently.

## 4. What we do with it on our side

- **Rules levels.** Our app has two levels above canon: 6 (custom, fan-made and balanced) and 7 (munchkin). We grade
  each incoming unit by its installed equipment, so its level is the highest level of anything on it. A unit only
  goes to 6 if it carries custom equipment, or to 7 if it carries munchkin equipment, **unless the designer calls it
  out explicitly**. A custom design built entirely from canon equipment keeps its canon level and is just labelled
  custom. That's why we'd need equipment ids on every unit (§2.1), canon or custom status on every equipment record
  (§2.2), and the designer's call-out wherever you record one.
- **Forum content** is source material for us, not something we show. We distil each relevant thread into a proposed
  piece of equipment, a construction rule or a game rule, with a link back to the thread. Every proposal is reviewed
  by hand: we decide what to adopt, balance it, grade it 6 or 7 and credit the poster. Nothing goes in
  automatically. Design files attached to posts would come in as units, like the custom units in §2.1.
- **Canon units.** For published units, the Master Unit List and the rulebooks are our authority. Mordel fills the
  gaps they leave and gives us breakdowns to check our own work against.
- **Non-canon content** never goes into the MegaMek or Skunk Werks files our app exports. Those tools are canon-only,
  so custom content stays in our own save format.
- **Syncing.** Once a week, through `/changes`, into a copy our app reads. Our users never hit your server.

## 5. Questions for you

1. Which unit types does mordel store beyond BattleMech, IndustrialMech, ProtoMech and combat vehicle?
2. Are the BV, Alpha Strike, weight and cost breakdowns computed on the server or only in the browser? That decides
   whether the JSON breakdowns are cheap for you or a real piece of work.
3. Does a unit record carry the designer's intended rules level, or any "custom/munchkin" flag? If not, would you
   consider adding one?
4. How is custom equipment stored: per member, approved like units, or free-form?
5. The forum: we'd read posts only to distil rules and equipment from them, never to republish them. Are you happy
   with that, given credit and a link to the thread? Should your members be told, or offered an opt-out? Same
   question for attached design files, which we'd import as units.
6. How would you like us to credit mordel and its designers?
7. Rate limits, an API key, and whether a nightly bulk archive is easier for you than lots of single calls.
8. What a product record holds (§2.6).
9. The homepage says the site moved to GitHub. Is the repository public, and would you take pull requests from us
   for parts of the API?
10. Does mordel record which rules edition a unit was built under, or which edition an equipment record's stats
    come from? If not, could the unit editor capture it going forward?

## 6. A suggested order

1. **Units: list, record, the eight exports and the change feed.** This alone replaces our scraper.
2. **Equipment and quirks.** We need them to grade rules levels.
3. **The forum: Design Submissions and its attachments.**
4. **The forum's rules boards, and the JSON breakdowns.**
5. **Downloads and products.**

On our side, we'll build the client in parallel, with tests against sample responses, so we're ready the day the
first endpoint goes live.

Thanks again,

[your name]
