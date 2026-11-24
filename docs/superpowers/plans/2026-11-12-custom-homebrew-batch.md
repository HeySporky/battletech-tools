# Custom Homebrew Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan. The owner chose
> the execution method: **one chunk per session**, each ending with a commit, a ledger entry and a handoff, and the
> session is cleared before the next chunk. Do not run two chunks in one session. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bring eleven fan-made items in under the Custom Homebrew rules level: the Permanent Air 'Mech (#175), the
Mini Engine (#249), the Pile Bunker (#250), the Omni-Laser (#253), Micro 'Mechs (#173), Compact 'Mechs (#172), and
five Reddit items whose posts are not saved yet (#263 to #267).

**Architecture:** Each item goes where its kind already lives: a LAM type in `LAM_TYPE_RULES`, an engine type in
`mech-custom-engine-types.ts`, equipment in the `*-custom.ts` catalogs. Nothing touches a canon list or the canon
Battle Value or Point Value math. The two unit types (Micro and Compact 'Mechs) are too large to plan unread, so
their chunks are a reading and planning session each, which writes its own plan.

**Tech Stack:** TypeScript, React, Vitest.

**Spec:** the GitHub issues named above (`gh issue view <n> --repo ngcfells/battletech-tools`) and the owner rulings
of 2026-11-12 listed under Global Constraints. There is no separate design document.

## Global Constraints

- Fan equipment is Custom Homebrew; joke material is Munchkin. A fan unit sits at the level its equipment sets.
- Custom catalogs only (`*-custom.ts`, `mech-custom-*.ts`, or a homebrew row in `LAM_TYPE_RULES`). Never a canon list,
  never canon BV or PV math.
- Every item's notes credit the author of the post and link the source. Where any stat or rule is ours, the notes say
  "Inspired by: <author>, <source>" and name what we extrapolated.
- Nothing from memory. Read the saved source before writing a stat. A stat the author did not give is either left at
  the catalog's "unverified" convention (`battleValue: 0`, `cbills: 0`) or extrapolated and labelled as ours.
- Reddit refuses automated fetching. Do not work around it: an unsaved post waits for the owner to save the page into
  `C:/repo/ResourceLibrary/scrapes/reddit/`.
- Public repository: no rulebook text beyond short labels, no MegaMek, Solaris Skunk Werks or mordel.net numbers.
- Failing test first. Tests: `npx vitest run --project unit src/classes src/data src/utils`, then `npm run check`,
  both from PowerShell.
- A new equipment record needs its tag in `src/data/__fixtures__/tech-lists.json`.
- Never grep `src/data/equipment-*.ts` without `| cut -c1-200`.
- Commit and push to `beta` are approved. Ask the owner before any deploy, `master` fast-forward, news entry or
  comment on #599.
- No kept bundled design's Battle Value or record sheet value may change. The bundle tests
  (`src/data/bundled-mechs.test.ts`) run with the unit tests; if one fails, stop for the owner.
- End each commit message with `Co-Authored-By:` and the model that did the work.

## Session protocol (every chunk)

1. Read `C:/repo/JBTToolsSupportFiles/handoff.md`, this plan, and the ledger
   `.superpowers/sdd/2026-11-12-custom-homebrew-batch/progress.md`. Do the first chunk not marked done.
2. Do that one chunk. Run the tests and `npm run check`. Commit and push `beta`.
3. Append to the ledger: what was built, every call that was ours, anything left open.
4. Rewrite the top block of the handoff: which chunk is done, which is next, and the model to use for it.
5. Stop. The owner clears the session.

## Models

| Chunk | Work | Model |
|---|---|---|
| 1 | Permanent Air 'Mech: rule judgement inside a 12,000-line class | Opus 5.5 |
| 2 | Mini Engine: engine wiring in the same class | Opus 5.5 |
| 3 | Pile Bunker and Omni-Laser: catalog records after an existing pattern | Sonnet 5.5 |
| 4 | Micro 'Mechs: read the source, design the unit type, write its plan | Fable 5.2 |
| 5 | Compact 'Mechs: read the fanzine, design, write its plan | Fable 5.2 |
| 6 | Five Reddit items, once saved: catalog records | Sonnet 5.5 |
| 7 | Rebuild and verify | Sonnet 5.5 |

Chunks 4 and 5 produce plans; those plans name their own models (expect Opus 5.5 for class changes, Sonnet 5.5 for
records).

## Review Focus

- A saved design with `lamType: "pam"` opened in a build that predates the type: it must fall back to a standard LAM
  rather than fail (`setLAMType` already does this; Chunk 1 pins it).
- A Permanent Air 'Mech whose transformation mode was saved as `mech`: it must come back in `airmech` (Chunk 1).
- A user below the Custom Homebrew rules level: none of these items may be offered, but a design that already carries
  one must still open and show it (Chunks 1, 2, 3).
- A Mini Engine on a superheavy or a rating over 400: either handled or refused with a message, never a silent
  wrong weight (Chunk 2).
- A weapon with `battleValue: 0`: the BV breakdown must not divide by it or drop the weapon's heat (Chunk 3).

---

## Chunk 1: Permanent Air 'Mech (#175)

**Source:** BattleTech forums, "Custom Weapons and Equipment" (topic 44833), reply #5 by Red Pins, 21 Feb 2015:
PAMs are AirMechs with only one mode. The full rules were never published, so the rules below are **ours**,
extrapolated from the Land-Air 'Mech rules (IO:AE pp.100-110, 180, 186). Owner rulings of 2026-11-12: it is "a single
mode LAM as opposed to bi or trimodal"; it has **no conversion equipment** because it does not convert (a cost saving).

**Our extrapolation (state each in the type's notes):**

| Rule | Value | Why |
|---|---|---|
| Modes | `["airmech"]` only | the author's one line |
| Conversion equipment | none: 0 tons, no cost | owner ruling |
| Avionics slots | kept as on a LAM (head and each side torso), weightless | owner ruling: it has wings |
| Landing gear | none: no slots | owner ruling: landing gear is only for the pure air mode; it lands on its feet |
| Minimum Jump MP | 3 | AirMech MP comes from Jump MP |
| LAM limits (engine, gyro, armor, structure, single-location equipment, 55 tons, biped, Inner Sphere) | kept | least invention |
| Fuel | decide in Step 1 | see Step 1 |
| Bomb bays | allowed | as a LAM in AirMech mode |
| Battle Value | the LAM rules unchanged (IO:AE p.186), marked provisional | no rule of its own |
| Rules level | Custom Homebrew | fan content |

**Files:**
- Modify: `src/classes/battlemech.ts` (`LAMType` and `LAM_TYPE_RULES` near line 211; `hasAirMechMode` near 7416;
  `isBattleValueProvisional` near 7436; `getRequiredRulesLevel` near 7465; `getLAMFuelPoints` near 7926;
  `setTransformationMode` near 8821; the conversion cost step near 2212; the conversion weight near 4398)
- Modify: `src/ui/pages/classic-battletech/mech-creator/step1.tsx` (LAM type picker near line 359)
- Test: `src/classes/battlemech.test.ts` (new `describe("Permanent Air 'Mech")` after the VTOLAM blocks near 1805)

**Interfaces:**
- Produces: `LAMType` gains `"pam"`; `BattleMech.isPermanentAirMech(): boolean`; `ILAMTypeRules` gains
  `homebrew?: boolean` (set on `pam`).

- [ ] **Step 1: Settle the fuel question from the book.** Read IO:AE pp.102-104 in the library
  (`C:/repo/ResourceLibrary/search.sqlite`) for whether AirMech-mode movement spends fuel points. If it does not, a
  Permanent Air 'Mech has no fuel: `getLAMFuelPoints()` returns 0 and the Fuel Tank is not offered. If it does, it keeps
  the free 80 points and may add tanks. Record the page and the answer in the ledger.

- [ ] **Step 2: Write the failing tests**

```ts
describe("Permanent Air 'Mech", () => {
    const makePAM = (tonnage = 30) => {
        const lam = new BattleMech();
        lam.setEra("ilClan");
        lam.setType("lam");
        lam.setTonnage(tonnage);
        lam.setLAMType("pam");
        return lam;
    };

    it("is a LAM with only the AirMech mode, at the Custom Homebrew level", () => {
        const pam = makePAM();
        expect(pam.getLAMType()).toBe("pam");
        expect(pam.isPermanentAirMech()).toBe(true);
        expect(pam.hasAirMechMode()).toBe(true);
        expect(pam.getTransformationMode()).toBe("airmech");
        expect(pam.setTransformationMode("mech")).toBe("airmech");
        expect(pam.setTransformationMode("aerospace")).toBe("airmech");
        expect(pam.getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(pam.isBattleValueProvisional()).toBe(true);
    });

    it("carries no conversion equipment, in weight or in cost", () => {
        const pam = makePAM();
        expect(pam.getWeightBreakdown().some(entry => /Conversion/.test(entry.name))).toBe(false);
        expect(pam.getCostBreakdown().steps.some(step => /^cost\.conversion/.test(step.id))).toBe(false);
    });

    it("has the LAM avionics slots but no landing gear", () => {
        const slots = JSON.stringify(makePAM().exportJSON());
        expect(slots).toContain("lam-avionics");
        expect(slots).not.toContain("lam-landing-gear");
    });

    it("moves as an AirMech on its Jump MP and needs 3 of it", () => {
        const pam = makePAM();
        pam.setWalkSpeed(5);
        pam.setJumpSpeed(4);
        expect(pam.getAirMechCruiseMP()).toBe(12);
        expect(pam.getAirMechFlankMP()).toBe(18);
    });

    it("credits the author and says the rules are ours", () => {
        const notes = makePAM().getLAMTypeNotes();
        expect(notes).toContain("Inspired by: Red Pins");
        expect(notes).toContain("topic 44833");
        expect(notes).toMatch(/extrapolat/);
    });

    it("comes back in AirMech mode from a save, and an unknown type falls back to a standard LAM", () => {
        const pam = makePAM();
        const copy = new BattleMech();
        copy.importJSON(JSON.stringify({ ...JSON.parse(pam.exportJSON()), transformationMode: "mech" }));
        expect(copy.getLAMType()).toBe("pam");
        expect(copy.getTransformationMode()).toBe("airmech");
        expect(pam.setLAMType("no-such-type")).toBe("standard");
    });
});
```

  Use the export and import method names the neighbouring VTOLAM tests use if they differ. Add the fuel assertion that
  Step 1 decided.

- [ ] **Step 3: Run them and see them fail.** `npx vitest run --project unit src/classes/battlemech.test.ts -t "Permanent Air"`

- [ ] **Step 4: Implement.**
  - `LAM_TYPE_RULES.pam = { name: "Permanent Air 'Mech", conversion: 0, costRate: 0, modes: ["airmech"], minJumpMP: 3, lamLimits: true, homebrew: true, notes: ... }`.
    The notes open "Permanent Air 'Mech (Custom Homebrew). Inspired by: Red Pins, BattleTech forums, "Custom Weapons
    and Equipment" (topic 44833), who described it as an AirMech with only one mode. The rules here are our own
    extrapolation from the Land-Air 'Mech rules:" and then list the table above in plain sentences.
  - `hasAirMechMode()`: true when the type's `modes` include `"airmech"`.
  - `setTransformationMode()`: fall back to the first allowed mode, not to `"mech"`. `setLAMType` already re-applies it.
  - No weight entry and no cost step when `conversion` or `costRate` is 0. The Battletech Into The Future VTOLAM
    already has `costRate: 0`; check its existing cost test still passes and keep its behaviour.
  - `isBattleValueProvisional()` and `getRequiredRulesLevel()`: include `isPermanentAirMech()`.
  - Critical slots (near line 5024): the avionics as on a LAM, no landing gear. Count the avionics per location from
    the critical table in the test if the export does not carry fixed slots.
  - Fuel per Step 1.

- [ ] **Step 5: Add the picker option** in `step1.tsx`, beside the VTOLAM options and under the same rules-level
  test (also shown when the current design already is one): `<option value="pam">Permanent Air 'Mech (AirMech only;
  Custom Homebrew)</option>`. Show `getLAMTypeNotes()` under the picker for it, as the VTOLAM paragraph does.

- [ ] **Step 6: Run the unit tests and `npm run check`.** Expected: all pass, bundle tests unchanged.

- [ ] **Step 7: Commit, push `beta`, ledger, handoff.** Message: `Custom Homebrew: Permanent Air 'Mech, a single-mode LAM (#175)`.

---

## Chunk 2: Mini Engine (#249)

**Source:** `C:/repo/ResourceLibrary/scrapes/reddit/1nk9g3e.txt`, by u/VanillaPhysics. From the post: critical slots
as a standard engine, weight as a light engine, heat exactly as an XXL engine, destroyed after two hits with the
first hit counted as two.

**Files:**
- Modify: `src/data/mech-custom-engine-types.ts` (the empty `mechCustomEngineTypes` array)
- Modify: `src/classes/battlemech.ts` (engine weight switch near 2390; the second engine switch near 2448; the XXL
  heat test near 5503; the BV engine modifier switch near 1003)
- Test: `src/classes/battlemech.test.ts`, and `src/data/custom-component-registry.test.ts` if it pins the catalog

**Interfaces:**
- Produces: engine type record with `tag: "mini-engine"`, `name: "Mini Engine"`.

- [ ] **Step 1: Read the post in full.** Take from it, and only from it: tech base, dates, cost, rules on engine
  ratings and unit types. Write into the ledger which fields the author gave and which he did not.

- [ ] **Step 2: Write the failing tests.** For a 50-ton 'Mech at the Custom Homebrew level with a 200-rated engine:

```ts
it("Mini Engine: standard engine slots, light engine weight, XXL engine heat", () => {
    const standard = makeMech("standard"), light = makeMech("light"), xxl = makeMech("xxl"), mini = makeMech("mini-engine");
    expect(mini.getEngineType().tag).toBe("mini-engine");
    expect(mini.getEngineWeight()).toBe(light.getEngineWeight());
    expect(engineSlots(mini)).toEqual(engineSlots(standard));
    expect(mini.getMaxMovementHeat()).toBe(xxl.getMaxMovementHeat());
    expect(mini.getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
});
```

  `makeMech(tag)` builds the 'Mech and calls `setEngineType(tag)`; `engineSlots` counts engine slots per location from
  the critical table. Add: the record's notes contain `u/VanillaPhysics` and the post's link; a canon design's BV is
  unchanged (any one bundled design before and after, or rely on the bundle tests).

- [ ] **Step 3: See them fail.**

- [ ] **Step 4: Implement.** Add the record after the shape of the light engine record in `mech-engine-types.ts`,
  with the standard engine's `criticals`. In each engine switch add the `"mini-engine"` case beside the engine it
  borrows from (weight: light; heat: XXL). The two-hits rule is play text: put it in the notes. For the BV engine
  modifier, the author gives none: use 1.0 (no side-torso slots, as a standard engine) and say in the notes that the
  Battle Value treatment is ours ("Inspired by" wording). A field the author did not give follows the Global
  Constraints. Refuse ratings or chassis the post rules out with a violation message; if the post is silent on large
  engines (over 400) and superheavies, do not offer it there.

- [ ] **Step 5: Unit tests and `npm run check`.**

- [ ] **Step 6: Commit, push `beta`, ledger, handoff.** Message: `Custom Homebrew: Mini Engine (#249)`.

---

## Chunk 3: Pile Bunker (#250) and Omni-Laser (#253)

**Sources:** `C:/repo/ResourceLibrary/scrapes/reddit/1dak8pu.txt` (Pile Bunker, u/FweeCom; the author calls the
numbers tentative) and `1n30c2j.txt` (Omni-Laser, u/heavyarmormecha).

**Files:**
- Modify: `src/data/misc-custom.ts` (Pile Bunker), `src/data/ammo-custom.ts` (its ammunition),
  `src/data/energy-custom.ts` (Omni-Laser), `src/data/__fixtures__/tech-lists.json` (three tags)
- Test: `src/data/custom-homebrew-batch.test.ts` (new)

**Interfaces:**
- Produces: tags `custom-pile-bunker`, `ammo-custom-pile-bunker`, `custom-omni-laser`.

- [ ] **Step 1: Read both posts in full** and list in the ledger each stat the author gave.

- [ ] **Step 2: Write the failing test** `src/data/custom-homebrew-batch.test.ts`: each tag is found in its custom
  catalog; is absent from every canon catalog; has `rulesLevel` at Custom Homebrew; its notes contain the author's
  handle and the post's link. Pin the posted numbers:
  - Pile Bunker: weight 5, 5 BattleMech slots, damage 15, heat 2; ammunition 3 shots per ton, explosive.
  - Omni-Laser: Inner Sphere, introduced 3150, weight 10, 4 BattleMech slots, range 6 / 12 / 18, heat 20, damage 16
    (its Focus mode).
  And one 'Mech test: a 'Mech carrying each item still produces a finite Battle Value and counts the weapon's heat.

- [ ] **Step 3: See it fail.**

- [ ] **Step 4: Add the records** after the single-line record shape used for "Disruptor (MekTek)" in
  `energy-custom.ts`. The Omni-Laser's three modes (Focus, Pulse, Dazzler), the Pile Bunker's Piloting roll on a hit
  and its ammunition explosion are play text: put them in the notes, in our own words. Battle Value and cost the
  author did not give stay 0 with a note saying so. Add the three tags to `tech-lists.json` in sorted order.

- [ ] **Step 5: Unit tests and `npm run check`.**

- [ ] **Step 6: Commit, push `beta`, ledger, handoff.** Message: `Custom Homebrew: Pile Bunker and Omni-Laser (#250, #253)`.

---

## Chunk 4: Micro 'Mechs (#173): read, design, plan

**Sources:** `C:/repo/ResourceLibrary/Custom/text/Micro-Mechs6-1-0-2.txt` (about 74 KB),
`C:/repo/JBTIICRework/fan-made/rules-and-variants/MicroMechs602.pdf`, `micromechwarrior.pdf`.

- [ ] **Step 1:** Read the text source in full; open the PDFs only where the text is unclear. Note the author and
  version for the credit.
- [ ] **Step 2:** Write a rules summary in the ledger (not in the repository): construction rules, tonnage range,
  the record sheet, what equipment it uses, and what differs from a BattleMech.
- [ ] **Step 3:** Check what the code already offers that it could sit on (Ultra-light 'Mechs under 20 tons,
  ProtoMechs, the custom component registry) and decide the smallest honest form: a 'Mech type, a tonnage class, or a
  unit type of its own.
- [ ] **Step 4:** Write `docs/superpowers/plans/<date>-micro-mechs.md` with the same header, chunk and handoff
  protocol as this plan, and a model per chunk. Bring any question only the owner can answer in one message.
- [ ] **Step 5:** Commit the plan, push `beta`, ledger, handoff.

## Chunk 5: Compact 'Mechs (#172): read, design, plan

**Sources:** `C:/repo/JBTIICRework/magazines/Future Wars/Future Wars Magazine - Best of - Future Wars Magazine.pdf`;
twelve HeavyMetal Pro files in `C:/repo/battletech-tools/WorkingData_DEV/HMPdata/hmpFiles/FutureWars`. The issue adds
that other material in the fanzine should come in too.

- [ ] **Step 1:** Read the Compact 'Mech rules in the fanzine; list the fanzine's other rules and equipment by title
  and page for the owner to pick from.
- [ ] **Step 2:** Rules summary in the ledger, as in Chunk 4.
- [ ] **Step 3:** See whether the twelve files can be read by an existing importer; if so they are the test designs.
- [ ] **Step 4:** Write `docs/superpowers/plans/<date>-compact-mechs.md` as in Chunk 4.
- [ ] **Step 5:** Commit the plan, push `beta`, ledger, handoff.

## Chunk 6: The five unsaved Reddit items (blocked on the owner)

PPC-X (#266, u/Distinct-Duck-7120, post 1hqnzwy), Superheavy PPC (#265, u/FedditSuns, 1bhfssf), Fusion Lance (#263,
u/Magical_Savior, 1mhvhwp), Tandem Charge SRM (#264, u/Magical_Savior, 1jamkvn), Re-Engineered Fusion Engine (#267,
u/Bookwyrm517, 1iky8lg).

**Owner ruling 2026-11-16, PPC-X:** the PPC-X is **Apocryphal, not Custom Homebrew**: it is a MechWarrior 5
weapon (the post also names the BattleTech 2018 Snub-Nose). Record it at `APOCRYPHAL_RULES_LEVEL` in the apocryphal
catalog layout (`hailstorm-apocryphal.ts` / `equipment-energy.ts` line ~116 show the pattern), sourced to the game,
with the Reddit tabletop conversion credited as "Inspired by". Before choosing the stat line: find the PPC-X's stats
in MW5 (damage, heat, range, weight, slots, cooldown, projectile behaviour) and the same stats for the other MW5 PPCs
(Light, standard, Heavy, Snub-Nose, ER; IS and Clan as MW5 has them). Write a table in the ledger: how the PPC-X
sits against those in the game, how the tabletop PPCs map from their MW5 numbers, what that mapping predicts for a
tabletop PPC-X, and how u/Severe_Ad_5022's line (7 t, 3 slots, 10 heat, 5/9/12, 12 damage in 3s on the cluster
table, -1 to hit) and u/Omega_Chris_8352's (Snub-Nose on the cluster table, 5 x 2) compare. Bring the table and a
recommended stat line to the owner before writing the record.

- [ ] **Step 1:** Check `C:/repo/ResourceLibrary/scrapes/reddit/` for a file per post id. For any that is missing,
  say so in the handoff and skip that item.
- [ ] **Step 2:** For each saved post: the equipment items follow Chunk 3 (extend `custom-homebrew-batch.test.ts`,
  records in the matching `*-custom.ts` catalog, tags in `tech-lists.json`); the engine follows Chunk 2.
- [ ] **Step 3:** Unit tests, `npm run check`, commit, push `beta`, ledger, handoff.

## Chunk 7: Rebuild and verify

- [ ] **Step 1:** `npm run build:bundled` in the background (about 25 minutes).
- [ ] **Step 2:** The 'Mech match count in `src/data/bundled/mechs-accuracy.json` must not fall below
  `MECH_MATCHED_FLOOR` (`src/data/bv-verdicts.ts`), and no kept design may change: compare the bundle at `HEAD` with
  the working tree design by design, keyed by name, model and layout (design ids shift). Any change: stop for the owner.
- [ ] **Step 3:** Unit tests, `npm run check`, commit and push `beta` if the bundle changed, ledger, handoff.
- [ ] **Step 4:** Ask the owner about shipping. Do not deploy, fast-forward `master`, write the news entry or comment
  on #599 without the answer.
