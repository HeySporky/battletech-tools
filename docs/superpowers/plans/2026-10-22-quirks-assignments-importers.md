# Quirks, part 2: weapon-bay quirks, canon 'Mech quirks and BLK quirk import — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quirks can go on a weapon bay; a 'Mech builder can apply the BattleMech Manual's recommended quirks for its
chassis in one click; and the MegaMek BLK importers we have bring a file's quirks across.

**Architecture:** A bay is a new kind of weapon target (its weapons' uuids), so `QuirkList`, the picker and the sheet
lines treat it as one weapon. Canon assignments are a data file of chassis records citing BMM pp.90-95, and a small
resolver turns one record into `IAssignedQuirk`s for a given 'Mech, with a note for each quirk it cannot place. The BLK
importers read `<quirks>` and `<weaponQuirks>` and resolve each code through `getQuirk`, which already matches
`altNames`.

**Tech Stack:** Vite + React 18 + TypeScript + Vitest. Commands from the repo root: `npx vitest run <path>`,
`npm run typecheck`, `npm run lint`.

**Spec:** `docs/superpowers/specs/2026-10-21-quirks-design.md` (approved 2026-10-21). Plan 1:
`docs/superpowers/plans/2026-10-21-quirks-catalog.md` (done). This is plan 2 of 4 in the spec's delivery order.

## Global Constraints

- Never invent a stat, date, citation, page number or quirk. Every canon record cites `book` and `page`. Data entry
  reads BMM pp.90-95 from `C:/repo/JBTIICRework/rulebooks/BattleMech Manual.pdf` (PDF index 91-96) as page images,
  never from the text extract, which the two-column layout garbles.
- No MegaMek code or data copied (GPL). MegaMek's quirk codes (`command_mech`, `imp_com`, `battle_fists_la`...) are
  file-format identifiers: they go in `altNames` so imports match, nothing more. Canon assignments never come from
  MegaMek's unit files.
- No rules text copied: the library is not for distribution.
- Quirks are not on the Alpha Strike card (spec ruling 2).
- Installed things are never filtered: a quirk whose bay or weapon is gone stays in the save and is listed "not
  installed" (plan 1 Review Focus 1).
- Applying canon quirks is a button, never automatic: no save changes without the player asking (Claude's call, for
  the user to check).
- 4-space indentation, LF; the data-file disclaimer header the other `src/data` catalogs carry.
- Commit per task on `beta`; never push to `upstream`, never `npm run deploy-prod`, never commit `*_DEV/`, `.claude`,
  `.superpowers/`. Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**Out of this plan, flagged for the user:**
- TRO entries (TRO: Prototypes on, ForcePack sheets): a later plan, after the BMM table is in. Same record format.
- MTF: we have no MTF importer (development-status lists it as Coming); quirk reading goes in with it.
- Writing quirks to BLK: we have no BLK exporter.
- SSW: the SSW format has no quirk element in the files we ship (`src/data/ssw/` has none); Task 5 confirms this
  and records it.
- Combat vehicles, fighters and capital ships have no BLK importer yet, so no BLK quirk reading for them.

## Review Focus

1. A DropShip's bay loses a weapon, or gains one, after a quirk was put on it: the quirk stays on the remaining
   weapons, and a bay emptied entirely lists the quirk "not installed". (Task 1)
2. A BMM entry names a weapon the 'Mech variant does not carry ("Stabilized Weapon (Gauss Rifle)" on a variant without
   one): the resolver places nothing for it and returns a note; it never attaches to the wrong weapon. (Task 2)
3. Pressing "Apply canon quirks" twice, or on a 'Mech that already has some of them: no duplicates, no error, and the
   quirks the player added by hand stay. (Task 4)
4. A chassis name with a nickname or Clan/IS name pair ("Cauldron-Born (Ebon Jaguar)", "Mad Cat"/"Timber Wolf") is
   found under either name, case and apostrophes ignored. (Task 2, Task 3)
5. A BLK file with a quirk code we do not know, or a `<weaponQuirks>` line naming a weapon not on the unit: the import
   still succeeds and lists each skipped line in `issues`. (Task 5)

---

### Task 1: Weapon-bay quirk target

CO p.225 (index 226): a quirk on weapons grouped into a bay goes on all of them, and its cost is paid once, priced from
the bay's maximum damage in one Damage Value grouping.

**Files:**
- Modify: `src/data/quirk-interfaces.ts` (`IAssignedQuirk`, `IQuirkTargets`)
- Modify: `src/classes/quirk-list.ts` (`sameAssignment`, `getActive`, `getPointTotals`)
- Modify: `src/data/quirk-registry.ts` (`getQuirkTargets` gains bays)
- Modify: `src/classes/small-craft.ts`, `src/classes/capital-ship.ts` (`getQuirkTargets`)
- Modify: `src/ui/components/quirk-picker.tsx`, the small-craft and capital-ship `creator/summary.tsx` hosts
- Modify: `src/utils/quirk-sheet-lines.ts`, `src/ui/components/svg/dropship-record-sheet-svg.tsx`
  (`craftInventoryRows`) and the capital ship sheet's inventory
- Test: `src/classes/quirk-list.test.ts`, `src/classes/small-craft.test.ts`, `src/ui/components/quirk-picker.test.tsx`,
  `src/ui/components/svg/small-craft-record-sheet-svg.test.tsx`

**Interfaces:**
- Produces:
  - `IAssignedQuirk.bayUuids?: string[]`: the bay's weapon uuids when assigned. Attachment order becomes
    `bayUuids` → `equipmentUuid` → `location` → unit.
  - `IQuirkTargets.bays?: { uuids: string[]; label: string; maxDamage: number }[]`; on Small Craft, DropShips and
    capital ships `weapons` lists only items in no bay (none today), and `bays` lists every arc's bays. Label:
    `` `${weaponBayName(bay)} (${arcName})` ``.
  - `QuirkList.getActive`: a bay quirk is active when any of its `bayUuids` is installed.
  - `QuirkList.getPointTotals(installed, unitMaxDamage, weaponDamage, bayDamage?: (uuids: string[]) => number)`.
  - Picker prop `bays?: IQuirkTargets["bays"]`: when present, the "weapon" attach lists bays.

- [ ] **Step 1: Write the failing tests**

```ts
// quirk-list.test.ts
it("puts a bay quirk on the bay, costed once from the bay's damage (CO p.225)", () => {
    const list = new QuirkList();
    expect(list.add({ tag: "accurate-weapon", bayUuids: ["a", "b"] })).toBeNull();
    expect(list.add({ tag: "accurate-weapon", bayUuids: ["b", "a"] })).toBe("duplicate");
    expect(list.getActive(["b"], undefined)).toHaveLength(1);
    expect(list.getActive([], undefined)).toHaveLength(0);
    // 13 damage in one grouping: 1 point per 5 or fraction, 3 points
    expect(list.getPointTotals(["a", "b"], 0, () => 0, () => 13).positive).toBe(3);
});
// small-craft.test.ts
it("offers its bays, not its single weapons, as quirk targets", () => {
    const craft = new SmallCraft();
    craft.addEquipmentFromTag("large-laser", "nose");
    craft.addEquipmentFromTag("medium-laser", "nose");
    const targets = craft.getQuirkTargets();
    expect(targets.weapons).toEqual([]);
    expect(targets.bays).toHaveLength(1);
    expect(targets.bays![0].uuids).toHaveLength(2);
    expect(targets.bays![0].maxDamage).toBe(13);
});
```

Picker test: with `bays` set, choosing Accurate Weapon and the bay adds `{ tag: "accurate-weapon", bayUuids }`.
Sheet test: a Small Craft with Accurate Weapon on its nose laser bay prints the quirk on that bay's inventory row.

Check `accurate-weapon` is the tag in `src/data/quirks.ts`; use the tag there if it differs.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/classes/quirk-list.test.ts src/classes/small-craft.test.ts src/ui/components/quirk-picker.test.tsx src/ui/components/svg/small-craft-record-sheet-svg.test.tsx`
Expected: FAIL (`bayUuids`/`bays` not known; typecheck errors count as the failure here).

- [ ] **Step 3: Implement**

`sameAssignment` compares `bayUuids` as sorted, joined strings. The bay's damage is the sum of its working weapons'
standard-scale damage, as `groupWeaponBays` already totals it; capital-scale bays use their capital damage. The sheet
matches a bay quirk to a bay row when the row's `uuids` share any uuid with `bayUuids`.

- [ ] **Step 4: Run the tests, then the suite**

Run: the Step 2 command, then `npx vitest run > <scratchpad>/suite.txt` and `npm run typecheck`
Expected: PASS; the suite has no failures.

- [ ] **Step 5: Commit** — `Quirks on weapon bays: a bay is one weapon target, costed once (CO p.225)`

---

### Task 2: Canon assignment records and the resolver

**Files:**
- Create: `src/data/quirk-canon-interfaces.ts`, `src/data/quirk-canon.ts`
- Create: `src/data/quirks-canon-mechs.ts` (header, empty `canonMechQuirks` array)
- Test: `src/data/quirk-canon.test.ts`

**Interfaces:**
- Produces:

```ts
/** One quirk as a canon table lists it. */
export interface ICanonQuirk {
    tag: string;
    parameter?: string | number;      // "short", 1...
    locations?: string[];             // "Barrel Fist (LA/RA)": ["la", "ra"], one assignment each
    weapon?: { name: string; location?: string; all?: true };  // "(CT Medium Lasers)": all medium lasers in the CT
    fromYear?: number;
    toYear?: number;                  // "prior to 3025": toYear 3024
    techBase?: "clan" | "inner-sphere";  // "Bad Reputation (Clan)"
    /** Any qualifier the fields above cannot express, printed as written; the resolver never applies such a quirk. */
    note?: string;
}
export interface ICanonQuirkEntry {
    chassis: string;
    altChassis?: string[];            // "Ebon Jaguar" for "Cauldron-Born"
    quirks: ICanonQuirk[];
    source: { book: string; page: number };
}
export interface ICanonResolution { quirks: IAssignedQuirk[]; notes: string[] }

export const findCanonEntry = (chassis: string, entries?: ICanonQuirkEntry[]): ICanonQuirkEntry | undefined;
export const resolveCanonQuirks = (entry: ICanonQuirkEntry, unit: {
    targets: IQuirkTargets;
    /** Each weapon target's equipment name and location tag, by uuid. */
    weaponInfo: (uuid: string) => { name: string; location?: string } | undefined;
    clan: boolean;
}): ICanonResolution;
```

- [ ] **Step 1: Write the failing tests** (fixtures built in the test file, not taken from the data file)

```ts
it("finds an entry by either name, ignoring case and apostrophes", () => {
    const entries = [{ chassis: "Cauldron-Born", altChassis: ["Ebon Jaguar"], quirks: [], source: { book: "BMM", page: 90 } }];
    expect(findCanonEntry("ebon jaguar", entries)?.chassis).toBe("Cauldron-Born");
    expect(findCanonEntry("CAULDRON-BORN", entries)).toBeDefined();
    expect(findCanonEntry("Atlas", entries)).toBeUndefined();
});
it("puts a weapon quirk on every matching weapon in the location, and notes what it cannot place", () => { ... });
it("gives a quirk listed for two arms one assignment per arm", () => { ... });
it("carries 'prior to 3025' as toYear 3024", () => { ... });
it("skips a Clan-only quirk on an Inner Sphere 'Mech, with a note", () => { ... });
it("never applies a quirk with a note, and says so", () => { ... });
it("notes a tag the catalog does not know instead of assigning it", () => { ... });
```

Each `...` builds one entry and asserts the exact `quirks` array and that `notes` names the quirk.

- [ ] **Step 2: Run to verify failure** — `npx vitest run src/data/quirk-canon.test.ts` → FAIL, module not found.

- [ ] **Step 3: Implement.** Weapon names match the target's equipment name with case, spaces and "s" plural
  ignored. Name keys use the same normaliser as `getQuirk` in `quirk-registry.ts` (export it if private).

- [ ] **Step 4: Run** — same command → PASS.

- [ ] **Step 5: Commit** — `Canon quirk records and the resolver that places them on a 'Mech`

---

### Task 3: The BattleMech Quirk Table (BMM pp.90-95)

**Files:**
- Modify: `src/data/quirks-canon-mechs.ts`
- Test: `src/data/quirks-canon-mechs.test.ts`

**Interfaces:**
- Consumes: `ICanonQuirkEntry` (Task 2); `getQuirk` (plan 1).

- [ ] **Step 1: Write the failing tests**

```ts
it("resolves every tag to a catalog quirk", () => {
    for (const entry of canonMechQuirks) for (const quirk of entry.quirks) expect(getQuirk(quirk.tag), `${entry.chassis}: ${quirk.tag}`).toBeDefined();
});
it("cites BMM pp.90-95 on every entry", () => {
    for (const entry of canonMechQuirks) { expect(entry.source.book).toBe("BattleMech Manual"); expect(entry.source.page).toBeGreaterThanOrEqual(90); expect(entry.source.page).toBeLessThanOrEqual(95); }
});
it("has no chassis twice", () => { ... });
it("gives the Atlas Battlefists, Command 'Mech, Distracting and Improved Comm.", () => { ... });
it("gives the Banshee Rugged (1) and Bad Reputation before 3025", () => { ... });
it("gives the Avatar Stabilized Weapon on its CT medium lasers", () => { ... });
it("gives the Catapult No/Minimal Arms and Weak Head Armor (1)", () => { ... });
```

Before writing the spot checks, confirm each against the page image; the page each one cites is the page it is
printed on.

- [ ] **Step 2: Run to verify failure** — `npx vitest run src/data/quirks-canon-mechs.test.ts` → the spot checks fail.

- [ ] **Step 3: Enter the table, one PDF page per commit.** Render each page (PDF index 91-96) to an image in the
  scratchpad (`pymupdf`, 2x zoom, run with `python -I`) and read it. Enter every row in printed order. Write a
  qualifier the `ICanonQuirk` fields cannot hold as `note`, word for word. A quirk name the catalog does not know
  stops the row: list it in the ledger for the user, never add a record to make it fit. Page footers give the printed
  page number.
  Then rewrite that page in `C:/repo/JBTIICRework/text/BattleMech-Manual.txt` (pages split by form feed) to the
  text the image shows, row by row in reading order, and add the page to `text/_corrected_pages.md` (user,
  2026-10-22: later lookups read clean text). The library is not in git; this is a local edit.

- [ ] **Step 4: Run** — same command → PASS after the last page; `npm run typecheck`.

- [ ] **Step 5: Commit after each page** — `BMM quirk table p.<N>: <first>-<last> chassis`

---

### Task 4: "Apply canon quirks" in the 'Mech builder

**Files:**
- Modify: `src/classes/battlemech.ts` (`applyCanonQuirks`)
- Modify: `src/ui/pages/classic-battletech/mech-creator/summary.tsx`
- Test: `src/classes/battlemech-quirks.test.ts` (or the existing 'Mech quirk test file, if plan 1 made one)

**Interfaces:**
- Consumes: `findCanonEntry`, `resolveCanonQuirks` (Task 2); `canonMechQuirks` (Task 3).
- Produces: `BattleMech.applyCanonQuirks(): { added: number; notes: string[] } | null` — null when no entry matches
  the chassis. The chassis is `_model` (getName prints `_model` + variant `_name`), also tried against `_nickname`.

- [ ] **Step 1: Write the failing tests**

```ts
it("adds the chassis' canon quirks once, keeping the player's own", () => {
    const mech = new BattleMech();
    mech.setModel("Atlas");   // use the existing setter for _model
    mech.quirks.add({ tag: "easy-to-pilot" });
    expect(mech.applyCanonQuirks()?.added).toBeGreaterThan(0);
    expect(mech.applyCanonQuirks()?.added).toBe(0);
    expect(mech.quirks.getAll().some((quirk) => quirk.tag === "easy-to-pilot")).toBe(true);
});
it("returns null for a chassis the table does not list", () => { ... });
```

A summary-page test: the button "Apply canon quirks (BMM pp.90-95)" shows only when an entry matches, and after a
click the page lists how many quirks it added and each note.

Quirks `add` refuses (duplicate, excluded) are not counted and not errors.

- [ ] **Step 2: Run to verify failure** → FAIL, `applyCanonQuirks` is not a function.
- [ ] **Step 3: Implement.** `weaponInfo` reads `getEquipment()` by uuid; `clan` is `getTech().tag` of `clan` or
  `mclan`.
- [ ] **Step 4: Run** — the tests, the suite, typecheck → PASS.
- [ ] **Step 5: Commit** — `'Mech builder: apply the BattleMech Manual's canon quirks for the chassis`

---

### Task 5: MegaMek quirk codes and BLK quirk import

**Files:**
- Modify: `src/data/quirks.ts` (`altNames` gains each MegaMek code)
- Create: `src/utils/blk-quirks.ts`
- Modify: `src/classes/battle-armor-blk.ts`, `src/classes/small-craft-blk.ts`, `src/classes/support-vehicle-blk.ts`
  (both importers)
- Test: `src/utils/blk-quirks.test.ts`, and one import test in each importer's test file

**Interfaces:**
- Produces:

```ts
/** The quirks a BLK file lists, placed on the imported unit; a line it cannot place goes in issues. */
export const readBlkQuirks = (file: IBlkFile, unit: {
    targets: IQuirkTargets;
    weaponAt: (location: string, slot: number, name: string) => string | undefined;   // uuid
}): { quirks: IAssignedQuirk[]; issues: string[] };
```

BLK forms: `<quirks>` holds one code per line (`low_profile`); `<weaponQuirks>` holds `code:location:slot:weapon`
(`accurate:Squad:1:CLBALightMG`). A code with a location suffix (`battle_fists_la`) resolves to the quirk and that
location.

- [ ] **Step 1: List the codes.** For each record in `quirks.ts`, find its MegaMek code in MegaMek's quirk
  definitions (read only) and add the code to `altNames`. A record with no code gets none. Test:

```ts
it("finds a quirk by its MegaMek code", () => {
    expect(getQuirk("command_mech")?.tag).toBe(getQuirk("Command 'Mech")?.tag);
    expect(getQuirk("imp_com")).toBeDefined();
});
```

- [ ] **Step 2: Write the failing reader tests**

```ts
it("reads unit quirks and weapon quirks from a BLK file", () => { ... });
it("lists an unknown code in issues and keeps going", () => { ... });
it("lists a weapon quirk whose weapon is not on the unit in issues", () => { ... });
```

and, per importer, a file with `<quirks>\nlow_profile\n</quirks>` imports with that quirk on the unit.

- [ ] **Step 3: Run to verify failure** → FAIL.
- [ ] **Step 4: Implement**, then each importer calls `readBlkQuirks` after the unit is built, adds each quirk with
  `quirks.add`, and appends the issues (and any `add` refusal, as `Quirk <name>: <reason>`) to its issues list.
- [ ] **Step 5: Confirm SSW.** `grep -il quirk` over the shipped SSW files; with no match, ledger
  `Task 5: SSW files carry no quirk element; no SSW quirk import`.
- [ ] **Step 6: Run** — the tests, the suite, typecheck, lint → PASS.
- [ ] **Step 7: Commit** — `BLK import brings quirks across, matched by MegaMek's codes`; then update TODO.md and the
  News entry in `development-status.tsx` in the same commit.
