# mordel.net units: storage memo (2026-11-07)

For the owner. The question: how do mordel.net units reach users of the app?

## Recommendation

**Option (c), per-user keys.** It is built on branch `mordel-user-key` and works end to end in development:

- The app keeps a list of units.
- A user picks a unit.
- The app pulls its details from mordel.net with the user's own API key.

One decision is still open: where the list itself comes from (see "The list" below).

## The three options

| Option | Size to users | Member designs in our public repo | Status |
| --- | --- | --- | --- |
| (a) Ship every detail with the app | 635 MB on disk, 31 MB compressed | Yes | Not recommended |
| (b) An optional download pack | the same, in one download | Yes, unless it is hosted elsewhere | Not recommended |
| (c) Ship a list; details pulled with the user's own key | list: 15 MB, 3.1 MB gzipped | No: the list is git-ignored for now | Built |

Scott agreed to per-user keys in principle. (c) still needs CORS on mordel.net for our three origins. Until CORS is on, only the development server works, through a proxy.

## The list

The list rows hold member designs: names, designers, tonnage, Battle Value and Alpha Strike cards. **Answered
2026-11-07: Scott agreed to the list shipping with the app** (option 1 below), so the list now ships:

- The list files `src/data/mordel/mordel_*.json` are committed. `canon-mechs.csv` is tracked as before.
- Every build includes the list. The `VITE_MORDEL_LIST=local` dev-only gate is gone. Each chunk loads only when the
  list is first searched.
- With a key saved, the app pulls the units changed on mordel.net since the last check, once a day. It keeps up to
  10,000 rows on the device.
- Any unit can also be pulled by its link or `type/id`.
- The unit details stay in the git-ignored mirror (`tools/mordel-sync/.mirror/`) and are never committed.

The three options weighed before Scott answered, kept for the record:

1. **Scott agrees to us shipping the list** (it holds no more than his public site shows). Then we commit the list
   files and drop the dev-only gate. Smallest change. **Chosen.**
2. **The app pulls the whole list with the user's key** on first use: 57 pages, then the daily changes.
3. **Scott hosts a list file** we fetch.

## Canon units: dropped from the list where they match the MUL

Of 5,416 canon units on mordel.net (full pull, 2026-11-07, 56,043 units):

| Group | Units | What happens |
| --- | --- | --- |
| Match our MUL data (Battle Value and Alpha Strike stats) | 4,317 | Dropped from the list. Users get the MUL unit we already ship. |
| Do not match | 381 | Kept in the list. **Needs the discussion you asked for.** |
| Not in our MUL data | 718 | Kept in the list. |

The 381 mismatches (full list in `tools/mordel-sync/canon-mismatch-report.json`):

- 290 differ in Battle Value. The median gap is 22 BV, and 99 are within 10. The largest is 2,295.
- 141 differ in Point Value, 73 in damage, 18 in movement, 15 in armor, 10 in structure and 9 in size.
- One unit can differ in more than one way.

Questions for that discussion:

- Which side is right, unit by unit, and who decides?
- Should mismatches go to Scott as a report?
- Should a mismatched canon unit show both values?

The list has 51,726 rows in 29 files. These numbers come from the finished pull, with no details missing.

## How well the conversion works

Each Classic unit is built from mordel.net's detail, and our Battle Value is compared with mordel.net's, across the mirror's canon units:

- 'Mechs: 3,930 of 4,269 match.
- Vehicles: 942 of 1,002.
- ProtoMechs: 80 of 85.

A unit that does not match is still added, with a warning that lists why.
