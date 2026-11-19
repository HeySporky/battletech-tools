# Cited Battle Value and cost breakdowns, by edition (#599)

Date: 2026-11-10. Issue: #599. Related: #590 (books as sources, per edition), #241 and #600 (bundled MUL designs),
`docs/superpowers/plans/2026-11-03-edition-aware-bv.md` (the BV1 and BV2 page audit this builds on).

## Why

Two readers, one goal.

- **The owner** wants to trust our math outright, so we can stop comparing against anything that is not Catalyst's
  own material. Most players trust the MUL; MegaMek and mordel.net are close seconds, and Catalyst itself uses
  MegaMek for its sheet creator. We want to be trusted like that, on the strength of showing our work.
- **A player** wants to open a unit and understand why it has that Battle Value and why it costs that many
  C-bills.

What no other tool offers, and what makes this ours: **Battle Value by edition.** The same unit valued under each
edition's own rules (no BV, BV1, BV2 and its later item values), each step cited.

The owner's words on what must not go wrong: "The math. The math is key." And: "transparency is necessary for
trust."

## Goals

1. **A cited breakdown.** For any unit, a list of steps for Battle Value and for C-bill cost. Each step shows its
   label, its arithmetic, its result, and the rule it comes from: book, page, and the errata version where errata
   changed it.
2. **By edition.** The breakdown can be read under any rules edition the unit type exists in. An edition with no
   Battle Value says so and cites where BV first appears.
3. **A public accuracy record.** A page in the app that says, per unit type, how many Master Unit List (MUL) units
   our math matches, and lists every unit where it does not: our number, the MUL's number, and a verdict. Misses
   that are still our open bugs are shown, not hidden.
4. **The gap list becomes a work queue.** Today about 635 designs are left out of the bundle because our BV differs
   from the MUL's ('Mechs 248, Combat Vehicles 113, battle armor 166, Small Craft and DropShips 56, Support
   Vehicles 37, ProtoMechs 15; see `src/data/bundled/*-report.md`). Each is worked to a verdict.
5. **Catalyst sources only.** When goal 3 exists for a unit type, the MegaMek audit for it is removed
   (`MEGAMEK_AUDIT` test, `src/data/bundled/megamek-bv-audit.md`).

## Non-goals

- New construction rules or new equipment. Gear the creators cannot build yet stays with its own issue (#610, #611,
  #622, #624).
- Force-level BV changes (C3, TAG, command console side bonuses) beyond citing the steps that already exist.
- Alpha Strike Point Value. Its conversion log is a separate system.
- Roster edition selection (#590 step 3). This work supplies the per-edition numbers it will need.
- Changing which number a bundled design carries. The #590 ruling stands: a bundled design carries the MUL's BV.

## Anti-goals: what would make this a failure even if it works

- **A step that was written from memory.** A citation in the app is a claim that someone read that page. A wrong or
  invented page number is worse than no citation.
- **Tuning to hit the MUL.** No constant, rounding choice or special case goes in because it makes a number match.
  It goes in because a cited rule says so.
- **Hiding a miss.** No unit is dropped from the accuracy record to improve the count.
- **Two sets of math.** The breakdown must be the calculation, not a second description of it that can drift.

## The rule for the math

This is the discipline every step follows. The plan must carry it into each task.

1. **Read the page.** Each step is checked against the rulebook page and its errata in the library
   (`C:/repo/ResourceLibrary`: `library_search.py` for the text, `render_page.py` for the page image when the text
   extract is doubtful, as the 2026-11-03 audit did). The citation recorded is the page that was read. The audit in
   `2026-11-03-edition-aware-bv.md` already lists many pages as "checked on the page image"; reuse those, and
   re-read anything it does not cover.
2. **Reproduce the book's worked examples.** Where a book works an example (Tech Manual's BV example, Maximum
   Tech's and the Master Rules' BV1 examples, the cost examples), a test builds that unit and checks our steps
   against the book line by line, not just the final number. If a book's example disagrees with its own rules text
   or errata, record that as a finding with both citations; the errata wins.
3. **Status on every step.** `cited` (read and confirmed), `provisional` (the rule does not cover the case and we
   chose a reading; the step says what and why), or `source-missing` (the rule points to a book, printing or errata
   version the library does not hold).
4. **A missing source stops the step, not the work.** List it for the owner, who will add it to the library. Carry
   on with the next step.
5. **Who does the reading.** The session's own model or a Claude subagent on a named model. The `astech` agent is
   not used for this work (owner ruling 2026-11-10: fidelity first).

## What gets built

### 1. Steps, not text

Today each unit class builds its BV log (and most build a cost log) as HTML or text lines while it calculates:
`battlemech.ts` (`_calcLogBV`, `_calcBattleValue1`, `_calcLogCBill`), `vehicle.ts`, `aerospace-fighter.ts`,
`small-craft.ts`, `capital-ship.ts`, `protomech.ts`, `battle-armor.ts`, `infantry-platoon.ts`. Some lines name a
page; most do not; errata are not named.

Replace the text with a list of step records produced by the calculation itself. A step holds, at least:

- a stable id (for tests and for the accuracy record to point at),
- its section (for example Defensive Battle Rating, Offensive Battle Rating, Final),
- a label and the arithmetic as shown to the reader,
- the result, and the running total where that helps,
- one or more citations,
- its status and, for `provisional`, the note.

A citation names a source from one registry (book, edition or printing, and for errata the document and version),
plus the page. The registry is one data file, so a book's name and printing are written once. Reuse the book tags
the editions already carry in `src/data/rules-editions.ts` where they exist.

The existing log getters (`getBattleValueLog`, `calcLogBV`, `getCBillCostLog`, `calcLogCBill`) keep working by
rendering the steps, so nothing has two sources. The math itself moves only where a step proves it wrong.

### 2. By edition

`src/data/battle-value.ts` already picks the scheme per edition and unit type (`BV_RULES`, `getBattleValueFor`,
per-edition item values through `getItemBattleValue`). The breakdown takes an edition and returns that edition's
steps with that edition's citations. Where item values differ inside BV2 by book (the #590 note: prototype rocket
launchers 17/21/22 on the MUL and in Record Sheets: Operation Klondike against IO:AE p.189's 15/18/19), the step
cites the value's own source for that edition.

Cost follows the same shape. Where our cost code is not yet edition-aware, the breakdown says which edition's rules
it applies; making cost edition-aware everywhere is a finding to file, not part of the first rounds.

### 3. The breakdown view

One shared component, used wherever a log shows today (every creator's summary step, the roster, the TRO view from
the MUL search):

- two tabs or sections: Battle Value and Cost;
- steps grouped by section, each with its arithmetic, result and citation;
- `provisional` and `source-missing` steps visibly marked;
- an edition switch listing the editions the unit type exists in, starting on the design's own edition;
- for a bundled MUL design, the MUL's BV beside ours, and a link to the accuracy record when they differ.

It must read well on a phone and print cleanly. Citations are plain text ("TM p.302; errata v8.0 p.14"), never
links to book content, and no rulebook text is quoted beyond the short labels a step needs.

### 4. The accuracy record

The bundle builds (`src/data/bundled-mechs-build.ts`, `src/data/bundled-units-build.ts`) already compute our BV for
every file and compare it with the MUL. They keep the matches and write the misses to a Markdown report. Add a data
output of the same facts: per unit type, the count matched, and for each miss the unit, our BV, the MUL BV and the
reason group. The other left-out reasons (import could not carry it over, no MUL entry) are counted and shown as
"not yet checked", so the totals are honest about what the match rate covers.

Verdicts live in a hand-kept data file keyed by unit, so a rebuild never loses them:

- `open`: not yet explained (the default);
- `our-bug`: the root cause is known and has an issue;
- `import`: the design was not carried over faithfully, so the comparison is not yet meaningful;
- `mul-suspect`: our cited steps stand and the MUL number looks wrong; the entry gives the rule, and the record
  sheet's number where we hold the sheet.

A page in the app shows the record: the per-type table first, then the list, filterable by verdict. A test fails
when a verdict's unit no longer differs (so fixed units leave the list) and when the count of matches drops.

### 5. Working the queue

Group the misses by likely root cause before fixing anything (same difference pattern, same equipment, same chassis
type). One fix usually clears many. Each fix is a normal test-first change with its rule cited; each round ends
with the record rebuilt and the counts in the commit message.

## Order of work

One unit type at a time, 'Mechs first: they are most of the bundle and the most-read rules.

1. The step and citation model, the renderer, and the old getters reading from it.
2. 'Mech BV2 as steps, each read on the page; the Tech Manual worked example as a test.
3. 'Mech BV1 as steps (Master Rules, Master Rules Revised, Maximum Tech), with the books' examples.
4. 'Mech cost as steps, with the books' examples.
5. The breakdown view with the edition switch, in the 'Mech creator, the roster and the MUL search TRO.
6. The accuracy record for 'Mechs (build output, verdict file, page). Remove the MegaMek audit.
7. The 'Mech queue: group the 248, fix root causes, give the rest verdicts.
8. Then the same seven steps for each remaining type, in this order: Combat Vehicles, battle armor, ProtoMechs,
   conventional infantry, fighters, Small Craft and DropShips, capital ships, Support Vehicles.

Each numbered item is a round: tests first, `npm run check`, commit, push `beta`, `git deploy-beta`, fast-forward
`master`, push, and a comment on #599. Production deploy stays the owner's call.

## Constraints

- battletech-tools is public: no rulebook text or art ships, no MegaMek, SSW or mordel.net numbers ship.
- `upstream/*` is Jeff's repo: never touched.
- The mordel list and mirror stay git-ignored; this work does not read them.
- Existing saved designs, exports and the record sheets must not change, except where a cited fix changes a number.
- Model use (owner, 2026-11-10): the work is done by the session itself or by Claude subagents on a named model, to
  make the best use of the session and weekly quotas. Rules reading and anything that decides a number: the
  strongest model available. Mechanical conversion of existing log lines into steps: Sonnet. One Opus whole-branch
  review per unit type before its round 6. No `astech`.

## Decided by the owner

- Both audiences, one breakdown.
- Cost is in scope, not only BV.
- By edition is the headline.
- The accuracy record is public, misses and all.
- Catalyst sources only; MegaMek leaves once the record exists.
- Missing sources are reported to the owner, who adds them to the library.
- No `astech`; native or Claude subagents on assigned models.

## My calls (not the owner's; check these)

- 'Mechs first, then the order in step 8.
- The old HTML logs are rendered from the steps instead of being kept beside them.
- The four verdict names, and keeping verdicts in a hand-kept file.
- Left-out designs appear in the accuracy record by name and numbers only. Opening the full breakdown of a left-out
  design (which would mean shipping it) waits until its verdict is `mul-suspect`, when it can be bundled with the
  MUL's BV as #590 rules.
- The accuracy page lives under the Classic BattleTech menu, linked from the breakdown view and the About page.
- Cost made fully edition-aware is filed as its own issue if the cost code turns out not to be.

## Settled after the builder check (2026-11-10)

From the project, not a choice:

- **The MUL's BV is a BV2 number.** "Ours beside the MUL's" and the accuracy record compare under the current BV2
  edition only. A BV1 or no-BV edition's number is never called a miss; the view shows it without a MUL figure.
- **The library holds the BV2 sources**: TechManual (first, 3rd, 4th and 6th printings), TM errata v3.1 and v8.0,
  the BV 2.1 revision (2017) and the Battle Value tables v4.1, Total Warfare and errata v11.01, TO:AUE and errata
  v7.0, IO:AE and errata v3.01, Strategic Operations and SO:AA errata v5.0 (`ResourceLibrary/INDEX.md`). The BV1
  books (Master Rules, Master Rules Revised, Maximum Tech, AeroTech 2, the Companion) were read for the 2026-11-03
  audit. Before round 3, list each BV1 source with its printing from the INDEX; any not held is a `source-missing`
  report to the owner, and round 4 (cost) moves ahead of round 3 while it is fetched.

My calls:

- **What counts in the accuracy record.** The unit is a MUL entry we hold a file for. Duplicates and "different
  submodel" files are not units and are not counted. Matched = that MUL entry has a kept design. Differs = it has
  files but none whose BV matches. Not yet checked = import failures and files with no MUL entry, shown as their
  own counts.
- **Verdict key.** The MUL id where the unit has one, plus the configuration name for an OmniMech configuration;
  the file path only where there is no MUL id. Renames then do not lose a verdict.
- **Step status is written by hand, in code**, by whoever read the page; there is no tool that can confirm a
  citation. The review at the end of each unit type samples citations against the pages.
- **No worked example in the book** (likely for some unit types): the step is still `cited` once its page is read.
  The example rule applies where an example exists. The plan lists, per unit type and edition, which examples exist.
- **Tests that assert on the old log's HTML may be rewritten** to assert on steps. The rendered text need not be
  byte-identical; the numbers must be.
- **A cited fix lands without a separate sign-off.** The guard is the existing tests plus the bundle build's match
  count. Every changed number is listed in the round's commit message and #599 comment, with its citation. A fix
  that would lower the match count, or change a printed record sheet value for a kept design, stops for the owner.
- **Round 4 (cost) converts and cites the cost math we have.** It states which edition's cost rules each step
  applies. It does not rewrite cost to be edition-aware; where an edition's cost rules differ and we do not model
  that, the step is `provisional` with a note, and an issue is filed.

## Left to the builder

- The exact shape and names of the step and citation types, and where the registry lives.
- How each class threads steps through its calculation with the least churn (`battlemech.ts` is very large).
- The component's layout, within the house style of the existing summary pages.
- The format of the build's data output and how the page loads it (lazy, like the bundled indexes).
- How to group the queue.
