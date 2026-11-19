# TRO Fields, Round 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One shared Technical Readout record, creator section, printed sheet and construction table, wired into the 'Mech Creator (Step 7) and filled by the SSW importer.

**Architecture:** A `TechnicalReadout` class owned by each unit (the same pattern as `QuirkList`: `export()` returns
`undefined` when empty, `import(data: unknown)` tolerates anything). Each unit type supplies an `ITroUnitAdapter`
(component rows, equipment copies, spec values, construction rows); the shared React section and sheet take the
record plus the adapter and know nothing about unit types. Round 2 adds adapters for the other unit types.

**Tech Stack:** TypeScript, React 18 class components, Vite, Vitest (unit project in Node; component tests use
`// @vitest-environment happy-dom` and `@testing-library/react`), fast-xml-parser (already used by the SSW import).

**Spec:** `docs/superpowers/specs/2026-10-22-tro-fields-design.md`

## Global Constraints

- Every TRO field is optional; a design with nothing filled in saves exactly as today (no `tro` key, no new uuids).
- One shared record, section, sheet and construction table; no per-unit-type copies (user ruling; memory
  `reuse-shared-components`).
- Text sections, in this order: Overview, Capabilities, Deployment, Battle History, Variants, Notable Units, Notes.
- Ammunition gets no make row.
- A per-copy uuid is assigned and saved only when its type is marked mixed or an import brings differing makes.
- A copy is one logical equipment item (one uuid), never a critical slot, split part or bay row.
- Armament group = count, manufacturer, model, item name, single spaces, empty parts left out; no automatic plurals;
  the name is left out when the make already contains it (case, hyphens and spaces ignored).
- The sheet is HTML (layout B): spec block left with image space right, text in two columns, construction table at
  the bottom, footer with the BattleTech logo and `TrademarkNoticeParagraphs`.
- Escape every user or imported string: render through JSX text only, never `SanitizedHTML raw` for TRO fields.
- Saved-data backward compatibility; tests next to the source; 4-space indent; small helpers, not a restructure of
  `battlemech.ts`.
- My call, recorded here: speeds print as MP × 10.8 rounded to the nearest whole kph ("43 kph", "65 kph", as
  TRO:3050's 4/6 MP designs print); jump capacity as jump MP × 30 meters. Modern TROs print "kph".
- My call: SSW makes "", "Unknown" and "None" (any case, trimmed) mean no make.

## Review Focus

1. An old save (no `tro`) loads, and re-saving it gives no `tro` key and no new equipment uuids. (Task 1, Task 3)
2. A make on a weapon that is then removed: its entry is pruned; a mixed type that falls to one copy goes unmixed;
   an OmniMech pod in another configuration keeps its make. (Task 1, Task 3)
3. `<script>` or `&` in any text field or make prints literally on the sheet and in the section. (Task 5, Task 6)
4. SSW Artemis launchers: `_applySSWFireControl` swaps the record; the launcher keeps its imported make. (Task 4)
5. Importing an SSW file onto a 'Mech that already has TRO data replaces it, not merges. (Task 4)

---

### Task 1: The shared record

**Files:**
- Create: `src/data/technical-readout-interfaces.ts`
- Create: `src/classes/technical-readout.ts`
- Test: `src/classes/technical-readout.test.ts`

**Interfaces:**
- Produces (in `technical-readout-interfaces.ts`):

```ts
export type TroTextKey = "overview" | "capabilities" | "deployment" | "battleHistory" | "variants" | "notableUnits" | "notes";
export const TRO_TEXT_SECTIONS: { key: TroTextKey; label: string }[]; // the seven, in the Global Constraints order; labels "Overview", ..., "Battle History", "Notable Units", "Notes"
export type TroProductionKey = "manufacturer" | "primaryFactory" | "communications" | "targeting";
export interface ITroMake { manufacturer?: string; model?: string; }
export interface ITroEquipmentMake extends ITroMake { mixed?: boolean; copies?: Record<string, ITroMake>; } // copies keyed by equipment uuid
export interface ITechnicalReadoutExport {
    production?: Partial<Record<TroProductionKey, string>>;
    components?: Record<string, string>;          // component key -> one make
    equipment?: Record<string, ITroEquipmentMake>; // catalog tag -> make
    text?: Partial<Record<TroTextKey, string>>;
}
export interface ITroComponentRow { key: string; label: string; }
export interface ITroEquipmentCopy { uuid: string; tag: string; name: string; locationLabel: string; }
export interface ITroSpecValues {
    title: string; subtitle: string; mass: string;
    cruisingSpeed?: string; maximumSpeed?: string; jumpCapacity?: string; armorType?: string;
}
export interface ITroConstructionRow { label: string; value?: string; mass?: string; indent?: boolean; heading?: boolean; }
export interface ITroUnitAdapter {
    getComponentRows(): ITroComponentRow[];
    getEquipmentCopies(): ITroEquipmentCopy[];        // the current loadout, ammo excluded
    getKnownEquipmentUuids(): string[];               // every uuid any configuration holds (OmniMech pods too)
    ensureEquipmentUuid(copy: ITroEquipmentCopy): string; // gives a uuid-less copy one and returns it
    getSpecValues(): ITroSpecValues;
    getConstructionRows(): ITroConstructionRow[];
}
```

- Produces (in `technical-readout.ts`), `export class TechnicalReadout`:
  - `getProduction(key)`, `setProduction(key, value: string)`, `getComponent(key)`, `setComponent(key, value)`,
    `getText(key)`, `setText(key, value)`; setters store trimmed-empty as absent.
  - `getTypeMake(tag): ITroMake`, `setTypeMake(tag, make: ITroMake)`.
  - `isMixed(tag): boolean`, `setMixed(tag, mixed: boolean, copies: ITroEquipmentCopy[])`: on, every copy of `tag`
    gets the type's make; off, per-copy makes are dropped and the type's make kept.
  - `getCopyMake(tag, uuid): ITroMake` (the type's make unless mixed), `setCopyMake(tag, uuid, make)`.
  - `prune(copies: ITroEquipmentCopy[], knownUuids: string[]): void`: drops type entries whose tag no copy has and
    whose copies are all unknown; drops per-copy makes for unknown uuids; a mixed type with one copy left goes
    unmixed keeping that copy's make as the type's make.
  - `getArmamentGroups(copies): { count: number; text: string }[]` and `getArmamentLine(copies): string` (groups
    joined by ", "), grouping by identical make and name, in the copies' order of first appearance.
  - `isEmpty(): boolean`, `export(): ITechnicalReadoutExport | undefined` (undefined when empty; no empty objects
    inside), `import(data: unknown): void` (non-objects and non-string values ignored).

- [ ] **Step 1: Write the failing tests** in `technical-readout.test.ts`:

```ts
const lrm = (uuid: string): ITroEquipmentCopy => ({ uuid, tag: "lrm-20", name: "LRM-20", locationLabel: "RT" });
const ml = (uuid: string, loc: string): ITroEquipmentCopy => ({ uuid, tag: "medium-laser", name: "Medium Laser", locationLabel: loc });

it("an empty readout saves as undefined", () => { expect(new TechnicalReadout().export()).toBeUndefined(); });
it("blank strings are not saved", () => { const t = new TechnicalReadout(); t.setText("overview", "  "); t.setProduction("manufacturer", ""); expect(t.export()).toBeUndefined(); });
it("round-trips every field", () => { /* set one of each kind, export, import into a new one, expect toEqual */ });
it("import ignores junk", () => { const t = new TechnicalReadout(); t.import({ text: { overview: 5 }, equipment: "x" }); expect(t.export()).toBeUndefined(); });
it("prints the armament line with makes", () => {
    const t = new TechnicalReadout();
    t.setTypeMake("lrm-20", { manufacturer: "Doombud" });
    const copies = [lrm("a"), lrm("b"), ml("c", "LT"), ml("d", "RT"), ml("e", "LT (R)"), ml("f", "RT (R)")];
    t.setMixed("medium-laser", true, copies);
    t.setCopyMake("medium-laser", "c", { manufacturer: "Diverse Optics", model: "Type 2" });
    t.setCopyMake("medium-laser", "d", { manufacturer: "Diverse Optics", model: "Type 2" });
    t.setCopyMake("medium-laser", "e", { manufacturer: "Martell" });
    t.setCopyMake("medium-laser", "f", { manufacturer: "Martell" });
    expect(t.getArmamentLine(copies)).toBe("2 Doombud LRM-20, 2 Diverse Optics Type 2 Medium Laser, 2 Martell Medium Laser");
});
it("does not repeat a name the make contains", () => { /* make "Zeus LRM-15", name "LRM-15" -> "1 Zeus LRM-15"; make "Doombud Long Range Missile 20 Racks", name "LRM-20" -> "1 Doombud Long Range Missile 20 Racks LRM-20" */ });
it("a copy with no make prints its plain name", () => { /* -> "2 Medium Laser" */ });
it("prune drops removed copies and unmixes a single copy", () => { /* mixed medium-laser with c..f; prune with only [ml("e")] known -> isMixed false, getTypeMake = Martell */ });
it("prune keeps makes for uuids another configuration holds", () => { /* copies [], known ["c"] -> copy c's make kept */ });
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run --project unit src/classes/technical-readout.test.ts`
Expected: FAIL, cannot resolve `./technical-readout`.

- [ ] **Step 3: Write the interfaces file and the class** as the Interfaces block gives them.

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run --project unit src/classes/technical-readout.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/technical-readout-interfaces.ts src/classes/technical-readout.ts src/classes/technical-readout.test.ts
git commit -m "Technical Readout: the shared record every unit type saves"
```

### Task 2: The shared construction table

**Files:**
- Create: `src/ui/components/tro-construction-table.tsx`
- Test: `src/ui/components/tro-construction-table.test.tsx`

**Interfaces:**
- Consumes: `ITroConstructionRow` (Task 1).
- Produces: `export default function TroConstructionTable(props: { rows: ITroConstructionRow[] }): JSX.Element`,
  a `<table className="tro-construction">` with columns item / value / mass; a `heading` row is `<th>`; `indent`
  rows get `className="indent"`.

- [ ] **Step 1: Write the failing test**: rendering `[{ label: "Engine", value: "280", mass: "16" }, { label: "<b>x</b>", indent: true }]` shows a cell with text `280`, a cell with text `16`, and the literal text `<b>x</b>` (no `b` element).
- [ ] **Step 2: Run it**: `npx vitest run --project unit src/ui/components/tro-construction-table.test.tsx`; expected FAIL (module missing).
- [ ] **Step 3: Write the component.**
- [ ] **Step 4: Run it again**; expected PASS.
- [ ] **Step 5: Commit**: `git commit -m "Technical Readout: one construction table for every unit type"`

### Task 3: The 'Mech's record and adapter

**Files:**
- Create: `src/classes/battlemech-tro.ts`
- Modify: `src/classes/battlemech.ts`: `IBattleMechExport` (around line 257, beside `quirks?`), the `quirks`
  field (line 368), `reset()` (line 583), `export()` (beside `quirks: this.quirks.export()`, line 7491),
  `_importRecord()` (beside `this.quirks.import(...)`, line 7718).
- Test: `src/classes/battlemech-tro.test.ts`

**Interfaces:**
- Consumes: `TechnicalReadout`, `ITroUnitAdapter` (Task 1).
- Produces:
  - `IBattleMechExport.tro?: ITechnicalReadoutExport`; `BattleMech.tro: TechnicalReadout` (public, new in `reset()`
    as well, so a reset or SSW import starts clean). Export: `tro: this.tro.export()`. Import:
    `this.tro.import(importObject?.tro)`.
  - `export function getBattleMechTroAdapter(mech: BattleMech): ITroUnitAdapter` in `battlemech-tro.ts`, using
    only public `BattleMech` methods (add small public getters to `battlemech.ts` only where none exists).
  - Component rows for a 'Mech, in order: `chassis` "Chassis (<structure label>)", `engine` "Engine (<engine name>)",
    `armor` "Armor (<armor type>)", `heatSinks` "Heat Sinks (<count> <type>)", `jumpJets` "Jump Jets" only when jump
    MP > 0, `gyro`, `cockpit`, `myomer`.
  - Copies: `getInstalledEquipment()` minus ammo; `locationLabel` = location upper-cased plus " (R)" when rear.
  - Known uuids: the current equipment's plus every OmniMech configuration snapshot's equipment uuids.
  - `ensureEquipmentUuid` sets `generateUUID()` on an installed item with none.
  - Spec values: title = chassis name, subtitle = "<model> · <tech base> · <tons> tons", mass "<tons> tons",
    cruising/maximum speed from walk/run MP (Global Constraints), jump capacity "<jump MP × 30> meters" or omitted at
    0, armor type name.
  - Construction rows: the same items and numbers `makeTROHTML()` prints (structure, engine with rating and mass,
    walking/running/jumping MP, heat sinks, gyro, cockpit, armor value and mass, then per-location internal
    structure / armor as indented rows, then equipment by location). `makeTROHTML()` itself stays as it is.

- [ ] **Step 1: Write the failing tests** in `battlemech-tro.test.ts`:
  - "an old save loads with no TRO and saves without one": `new BattleMech()`, `import(` an export with `tro`
    deleted `)`; `export().tro` is `undefined`, and the equipment uuids equal the input's.
  - "the TRO round-trips through the save": set manufacturer "Earthwerks Incorporated", component `engine` "VOX 280",
    text `overview` "Line one\n\nLine two"; export, import into a new 'Mech; same values.
  - "reset clears the TRO".
  - "the adapter lists no ammo and labels rear mounts": import `sswMechs[1]` (Archer ARC-2R) via `importSSWXML`;
    copies hold 4 `Medium Laser` and 2 `LRM-20`, none ammo, two with `locationLabel` ending " (R)".
  - "speeds in kph": the Archer's spec values give cruising "43 kph", maximum "65 kph".
  - "construction rows agree with the readout": engine row value "280" and mass "16", matching `makeTROHTML()`.
  - "an OmniMech pod in another configuration keeps its make": an OmniMech with two configurations; a make on a pod
    of configuration A; switch to B; `prune(adapter.getEquipmentCopies(), adapter.getKnownEquipmentUuids())`; switch
    back; the make is still there.
- [ ] **Step 2: Run**: `npx vitest run --project unit src/classes/battlemech-tro.test.ts`; expected FAIL.
- [ ] **Step 3: Implement** the `battlemech.ts` changes and `battlemech-tro.ts`.
- [ ] **Step 4: Run the new tests, then the 'Mech suites**:
  `npx vitest run --project unit src/classes/battlemech-tro.test.ts src/classes/battlemech.test.ts src/data/canonical-record.test.ts`;
  expected PASS.
- [ ] **Step 5: Commit**: `git commit -m "Technical Readout on 'Mechs: saved with the design, and the 'Mech's adapter"`

### Task 4: SSW import of the TRO fields

**Files:**
- Create: `src/utils/ssw-technical-readout.ts`
- Modify: `src/classes/battlemech.ts`: `_installSSWEquipment` (line 11716; capture the `@_manufacturer` of
  `item.name` against `newItem.uuid`), `importSSWXML` (line 11900; after the loadout, fire control and heat sinks,
  before `_calc()` at the end).
- Test: `src/utils/ssw-technical-readout.test.ts`

**Interfaces:**
- Consumes: `TechnicalReadout`, `getBattleMechTroAdapter` (Tasks 1, 3).
- Produces:
  - `export function readSSWTechnicalReadout(mech: any): ITechnicalReadoutExport`: from the parsed `jObj.mech`:
    `techbase@manufacturer` → `production.manufacturer`, `techbase@location` → `production.primaryFactory`,
    `fluff.commsystem` → `communications`, `fluff.tandtsystem` → `targeting`; `structure@manufacturer` →
    `components.chassis`, `engine@manufacturer` → `components.engine`, `armor@manufacturer` → `components.armor`,
    `fluff.jumpjet_model` → `components.jumpJets`; `fluff` `overview`, `capabilities`, `deployment`,
    `battlehistory` → `battleHistory`, `variants`, `notables` → `notableUnits`, `additional` → `notes`. No-make
    values (Global Constraints) dropped.
  - `export function isSSWNoMake(value: unknown): boolean`.
  - `TechnicalReadout.applyImportedCopyMakes(makes: { uuid: string; make: string }[], copies: ITroEquipmentCopy[], ensureUuid: (copy: ITroEquipmentCopy) => string): void`
    (add to the Task 1 class with its own test there): per tag, all copies share one make → type make (manufacturer
    field holds the whole SSW string); differing → mixed, per-copy makes.
  - Fire control: if `_applySSWFireControl` replaces an item, the replacement takes the captured make (carry it by
    the old uuid → new uuid, or by keeping the uuid; the test decides).

- [ ] **Step 1: Write the failing tests** in `ssw-technical-readout.test.ts`:
  - "reads the Archer's production and components": `importSSWXML(sswMechs[1])`; manufacturer starts
    "Earthwerks Incorporated", primary factory starts "Calloway VI", communications "Neil 9000", targeting
    "RCA Instatrac Mark XII", chassis "Earthwerks Archer", engine "VOX", armor "Maximillian 100", no `jumpJets`
    (SSW says "None").
  - "unmixed when all copies agree": medium laser type make "Diverse Optics Type 18", `isMixed` false; armament line
    contains "2 Doombud Long Range Missile 20 Racks LRM-20".
  - "mixed when copies differ": the Archer XML with one medium laser's manufacturer replaced by "Martell"; `isMixed`
    true and the line contains "3 Diverse Optics Type 18 Medium Laser, 1 Martell Medium Laser".
  - "ammo makes are ignored": no `equipment` entry for any ammo tag.
  - "an Artemis launcher keeps its make": an SSW fixture with `fcsa4` and a maked LRM (take one from
    `src/data/ssw/sswTestFixtures.ts` or the corpus, or edit the Archer XML to add the base-loadout flag); the
    swapped launcher's make is the imported one.
  - "import replaces earlier TRO data": set `text.overview` "old", then `importSSWXML`; overview is not "old".
  - "fluff text comes through": the Archer XML with `<overview>Line A</overview>` → `getText("overview")` "Line A".
- [ ] **Step 2: Run**: `npx vitest run --project unit src/utils/ssw-technical-readout.test.ts`; expected FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run it, then the SSW suites**:
  `npx vitest run --project unit src/utils/ssw-technical-readout.test.ts src/utils/getSSWXMLBasicInfo.test.ts src/classes/ssw-corpus-1.test.ts`;
  expected PASS.
- [ ] **Step 5: Commit**: `git commit -m "SSW import keeps the manufacturer, component makes, weapon makes and TRO text"`

### Task 5: The shared creator section

**Files:**
- Create: `src/ui/components/technical-readout-section.tsx`
- Test: `src/ui/components/technical-readout-section.test.tsx`

**Interfaces:**
- Consumes: `TechnicalReadout`, `ITroUnitAdapter`, `TRO_TEXT_SECTIONS` (Task 1).
- Produces: `export default class TechnicalReadoutSection extends React.Component<{ tro: TechnicalReadout; adapter: ITroUnitAdapter; onChange: () => void }>`.
  Four `<fieldset>`s with `<legend>` Production, Components, Equipment, Text, as in the approved mock
  (`.superpowers/brainstorm/29235-1792720735/content/creator-section.html`). Every input has an accessible label:
  "Manufacturer", "Primary Factory", "Communications System", "Targeting & Tracking"; each component row's label;
  per equipment type "<name> manufacturer", "<name> model", "<name> mixed"; per copy "<name> (<location>)
  manufacturer" / "model"; each text section's label. On mount it calls
  `tro.prune(adapter.getEquipmentCopies(), adapter.getKnownEquipmentUuids())`. Turning Mixed on calls
  `adapter.ensureEquipmentUuid` for each copy of that type first. Every edit calls `onChange`. A component make in
  the record whose key has no adapter row (an imported one) shows as an extra row labelled with its key, so it is
  never lost.

- [ ] **Step 1: Write the failing tests** (happy-dom, a stub adapter with two `medium-laser` copies and one `lrm-20`):
  - typing in "Manufacturer" sets `tro.getProduction("manufacturer")` and calls `onChange`;
  - Equipment lists one row per type ("Medium Laser" quantity 2, "LRM-20" quantity 1);
  - ticking "Medium Laser mixed" shows two copy rows; setting "Medium Laser (RT) manufacturer" to "Martell" sets that
    copy's make only;
  - a text value `<script>alert(1)</script>` shows as literal text in the textarea and adds no `script` element;
  - all seven text sections are present;
  - a record with component `kfDrive` "X" and no such adapter row shows an extra row with value "X".
- [ ] **Step 2: Run**: `npx vitest run --project unit src/ui/components/technical-readout-section.test.tsx`; expected FAIL.
- [ ] **Step 3: Write the component.**
- [ ] **Step 4: Run again**; expected PASS.
- [ ] **Step 5: Commit**: `git commit -m "Technical Readout: the creator section every unit type shares"`

### Task 6: The shared printed sheet

**Files:**
- Create: `src/ui/components/technical-readout-sheet.tsx`, `src/ui/components/technical-readout-sheet.scss`
- Test: `src/ui/components/technical-readout-sheet.test.tsx`

**Interfaces:**
- Consumes: Tasks 1-2; `BattleTechLogo` (`src/ui/components/battletech-logo.tsx`), `TrademarkNoticeParagraphs`
  (`src/ui/components/trademark-notice.tsx`).
- Produces: `export default function TechnicalReadoutSheet(props: { tro: TechnicalReadout; adapter: ITroUnitAdapter }): JSX.Element`.
  Layout B (`.superpowers/brainstorm/29235-1792720735/content/tro-sheet-layout.html`, option B). Spec lines in
  order: Mass, Chassis, Power Plant, Cruising Speed, Maximum Speed, Jump Jets, Jump Capacity, Armor, Armament,
  Manufacturer, Primary Factory, Communications System, Targeting & Tracking. Chassis, Power Plant, Jump Jets and
  Armor print the component make, falling back to the spec value (Armor) or leaving the line out. A line with no
  value is left out. Text sections with content print under their label in two CSS columns, each blank-line-separated
  paragraph as a `<p>`. `TroConstructionTable` at the bottom. A print-only page break is allowed inside the text
  columns, never inside the spec block.

- [ ] **Step 1: Write the failing tests**:
  - a filled record prints "Power Plant:" with "VOX 280" and "Armament:" with the armament line;
  - an empty record prints no "Manufacturer:" line and no "Overview" heading, but still prints Mass and the
    construction table;
  - text "Line one\n\nLine two" gives two `<p>`s;
  - `&` and `<script>` in a make print literally;
  - the footer contains "not published or endorsed by".
- [ ] **Step 2: Run**: `npx vitest run --project unit src/ui/components/technical-readout-sheet.test.tsx`; expected FAIL.
- [ ] **Step 3: Write the component and its styles.**
- [ ] **Step 4: Run again**; expected PASS.
- [ ] **Step 5: Commit**: `git commit -m "Technical Readout: the printed TRO sheet, shared by every unit type"`

### Task 7: The 'Mech Creator's Step 7 and print page

**Files:**
- Create: `src/ui/pages/classic-battletech/mech-creator/step7.tsx`, `src/ui/pages/classic-battletech/mech-creator/print-tro.tsx`
- Modify: `src/ui/pages/classic-battletech/mech-creator/_router.tsx` (routes `step7`, `print-tro`),
  `src/ui/components/mech-creator-side-menu.tsx` (a "Step 7" link between Step 6 and Summary, `current === "step7"`),
  `step6.tsx:658` (the next link goes to step7, labelled "Step 7"), `summary.tsx:263` (the previous link goes to
  step7), `summary.tsx` beside the record sheet print link at line 215 (a "Print the TRO sheet" link to `print-tro`),
  `imports.tsx:149` (the "Import TRO Text" importer loads a freshly parsed 'Mech's export over the current one,
  which would wipe the TRO fields: give the parsed 'Mech the current `tro` before that import).
- Test: `e2e/mech-tro.spec.ts`

**Interfaces:**
- Consumes: `TechnicalReadoutSection`, `TechnicalReadoutSheet`, `getBattleMechTroAdapter`, `BattleMech.tro`.
- Produces: Step 7 page (`label="Step 7: Technical Readout (optional)"`), copying step6's page frame (side menu, status
  bar, previous/next links); its `onChange` is `appGlobals.saveCurrentBattleMech(appGlobals.currentBattleMech)`, as
  the quirk picker does in `summary.tsx:203`. Print page: `print-rs.tsx`'s `PrintablePage` frame with
  `backTo` = step7, containing `TechnicalReadoutSheet`. Step 7 also has a "Print TRO sheet" link.

- [ ] **Step 1: Write the failing e2e test** in `e2e/mech-tro.spec.ts` (follow `e2e/artvee.spec.ts` for setup): open
  the 'Mech Creator, go to Step 7 from the side menu, fill "Manufacturer" with "Earthwerks Incorporated" and
  "Overview" with "Test overview", reload the page, the values are still there; open the TRO print page and see
  "Earthwerks Incorporated" and "Test overview". Then run "Import TRO Text" on the imports page with a short TRO
  text and check Step 7 still shows "Earthwerks Incorporated".
- [ ] **Step 2: Run**: `npx playwright test e2e/mech-tro.spec.ts --project=chromium --workers=2`; expected FAIL.
- [ ] **Step 3: Build the pages and links.**
- [ ] **Step 4: Run again**; expected PASS (a cold first run can fail; rerun once before investigating).
- [ ] **Step 5: Commit**: `git commit -m "'Mech Creator: Step 7, the optional Technical Readout, and its printed sheet"`

### Task 8: Verify, record and ship the round

**Files:**
- Modify: `TODO.md` (§2 Shared: note TRO fields are kept by the SSW import and the JSON save; add Round 2 as an
  open item linked to the spec), the home page news (follow the most recent news entry's file and format).

- [ ] **Step 1: Run the full checks**: `npm test`, `npx tsc --noEmit -p tsconfig.json`, `npm run lint`. Expected:
  0 new failures against the branch baseline in `.claude/rules/astech-rules.md` §7; report pre-existing ones separately.
- [ ] **Step 2: Update TODO.md and the news.**
- [ ] **Step 3: Commit**: `git commit -m "TODO and news: Technical Readout fields, round 1"`
- [ ] **Step 4: Ship** (memory `small-rounds`): `git push origin beta`, then `git deploy-beta`; report and stop.
