# Shared game settings, round 5: ruleset attribution, About and home news — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every record sheet, Alpha Strike card, TRO and printout of a unit built under Special Rulesets names them with their source; About lists the rulesets; the home news covers #324 as a whole.

**Architecture:** One text builder (`getRulesetsAttribution` in special-rulesets.ts) and one unit reader (`getUnitRulesets` in unit-game-settings.ts) feed one shared component file, `rulesets-attribution.tsx`, which gives an HTML paragraph (TRO sheet, HTML Alpha Strike cards) and an SVG text line (record sheets, SVG cards). `sheetFooter` takes the rulesets, so the twelve kit sheets get the line through it; the 'Mech and droid sheets and the two SVG cards place the same SVG line themselves. Alpha Strike conversions copy the unit's rulesets onto the card (call 11: the save, never the block).

**Tech Stack:** React 19 + TypeScript, Vitest (`--project unit`), Playwright for a throwaway visual check.

**Spec:** `docs/superpowers/specs/2026-10-26-shared-game-settings-design.md` (section "Attribution (#324)", call 11).

## Global Constraints

- Copy (spec): `Special Rulesets: <name>, <source title>` per ruleset, joined with `; `; a source URL follows the title in parentheses. Nothing at all is rendered when the unit has no rulesets.
- An id with no registry entry (a ruleset since removed) still prints, as `<id> (ruleset no longer listed)`, so the sheet never hides what the unit was built under.
- Attribution reads the unit's save (call 11): BattleMech `getRulesets()`, other Classic classes `gameSettings.getRulesets()`, `AlphaStrikeUnit.rulesets`.
- Battledroids non-'Mech units (`BattledroidsUnit`) carry no rulesets: nothing changes there.
- Reuse shared components (memory): one attribution component file; no per-sheet copies of the text logic.
- Never commit `handoff.md`.
- Verify: `npx vitest run --project unit --reporter=dot`, `npx tsc --noEmit -p .`, `npx eslint <changed files>`.

## Review Focus

1. A unit with no rulesets: no "Special Rulesets" text anywhere on its sheet, card or TRO (pinned in Tasks 1-4).
2. An unknown id in an old save prints with the "no longer listed" note rather than vanishing or crashing (Task 1).
3. A Classic unit converted to an Alpha Strike card (creator print-as, AS roster Add Units) keeps its rulesets; a MUL card has none (Task 3).
4. A long attribution must stay on the page: the SVG line caps its width with `textLength` (Task 2) and is checked visually (Task 5).
5. The roster prints (Classic and AS) show each unit's own line, since they render the same sheet and card components (Task 5 visual check).

---

### Task 1: Text builder and unit reader

**Files:**
- Modify: `src/data/special-rulesets.ts`, `src/classes/unit-game-settings.ts`
- Test: `src/data/special-rulesets.test.ts`, `src/classes/unit-game-settings.test.ts`

**Interfaces — Produces:**
- `getRulesetsAttribution(ids: readonly string[]): string | undefined` — `undefined` for `[]`.
- `getRulesetCredits(ids: readonly string[]): { name: string; source?: { title: string; url?: string } }[]` (the HTML component links each source).
- `getUnitRulesets(unit: IGameSettingsUnit | { getRulesets(): string[] } | { rulesets?: string[] } | null | undefined): string[]`

- [ ] Tests: `[]` → `undefined`; `["sample-no-clans"]` → `"Special Rulesets: Sample: The Clans never existed (alternate universe), Sample ruleset (#324)"`; `["gone"]` → `"Special Rulesets: gone (ruleset no longer listed)"`; a source with a url renders `Title (url)` (use a stub through `vi.spyOn` on the registry or a test-only id list). `getUnitRulesets` on a Vehicle with rulesets set, a BattleMech after `applyGameSettings`, an AlphaStrikeUnit with `rulesets`, `null` → `[]`.
- [ ] Implement, run, pass, commit.

### Task 2: Shared component, record sheets and TRO

**Files:**
- Create: `src/ui/components/rulesets-attribution.tsx`
- Modify: `src/ui/components/svg/record-sheet-svg-kit.tsx` (`sheetFooter(tablesCitation: string, rulesets: readonly string[] = [])`), the twelve `sheetFooter` callers, `battlemech-svg.tsx`, `battledroids-mech-record-sheet-svg.tsx` (BattleMech's own footer), `technical-readout-sheet.tsx` (`rulesets?: string[]` prop), `creator-tro-pages.tsx` (passes `getUnitRulesets(unit)`)
- Test: `src/ui/components/svg/record-sheet-footer.test.tsx`

**Interfaces — Produces:**
- `RulesetsAttribution(props: { rulesets: readonly string[]; className?: string }): JSX.Element | null` — `<p data-testid="rulesets-attribution">` with each source linked when it has a url.
- `rulesetsAttributionSvg(x: number, y: number, rulesets: readonly string[], options?: { size?: number; anchor?: "start" | "end"; fill?: string; maxWidth?: number; transform?: string }): JSX.Element | null` — one `<text data-testid="rulesets-attribution">`; when the estimated width (0.55 × size per character) exceeds `maxWidth`, sets `textLength={maxWidth}` with `lengthAdjust="spacingAndGlyphs"`.

- [ ] Tests: `sheetFooter("Tables: TW p.1.", ["sample-no-clans"])` contains the attribution; with `[]` contains no "Special Rulesets"; a Vehicle sheet with the sample ruleset shows it, without shows none; a BattleMech sheet likewise; `TechnicalReadoutSheet` with `rulesets` shows the paragraph.
- [ ] Sheet placement: the kit line sits right-aligned one row above the notice (`y - 26`); the 'Mech sheet line at `x=450, y=docHeight - 105`, same style as its notices. Adjust in Task 5 if it collides.
- [ ] Implement, run, pass, commit.

### Task 3: Alpha Strike cards

**Files:**
- Modify: `getAlphaStrikeUnit()` in `vehicle.ts`, `aerospace-fighter.ts`, `battle-armor.ts`, `infantry-platoon.ts`, `protomech.ts`; `calcAlphaStrike()` in `battlemech.ts` — each sets `rulesets` from the unit's save.
- Modify: `alpha-strike-unit-svg.tsx` (line along the bottom-left), `alpha-strike-print-unit.tsx` (second rotated line beside `CARD_NOTICE`), `small-craft-as-card.tsx`, `capital-ship-as-card.tsx` (`RulesetsAttribution` at the bottom; rulesets from the craft/ship).
- Test: `src/ui/components/svg/record-sheet-footer.test.tsx` (card cases), class tests for the conversions.

- [ ] Tests: a Vehicle with the sample ruleset → `getAlphaStrikeUnit().rulesets` equals it; BattleMech `getAlphaStrikeForceStats().rulesets` likewise; a card built from a plain `new AlphaStrikeUnit()` shows no attribution; with `rulesets` both SVG cards show it; small craft card shows it.
- [ ] Implement, run, pass, commit.

### Task 4: About, home news, spec

**Files:** `src/ui/pages/about.tsx`, `src/ui/pages/home.tsx`, the spec.

- [ ] About: a "Special Rulesets" TextSection listing every registry ruleset (`getSpecialRulesets()`) with its source, saying that sheets, cards and TROs credit them and that new rulesets come in through GitHub issues.
- [ ] Home news: an "October 26th, 2026" entry covering #324 as a whole (settings block order, Special Rulesets pop-up and sample, last level as default, MUL searches, AS creator, attribution).
- [ ] Spec: round 5 done; builder's calls for this round (unknown-id wording, placement, AS conversions carry rulesets).
- [ ] Commit.

### Task 5: Visual check, review, ship

- [ ] Throwaway Playwright drive (deleted afterwards): a vehicle and a 'Mech with the sample ruleset, screenshot record sheet, AS card print and TRO print; fix any overlap.
- [ ] Full verify; final review on the branch; fix all findings.
- [ ] Ship: commit, `git push origin beta`, `git deploy-beta`, ff `master` in `C:/repo/battletech-tools` and push, close #324 with a summary comment, fresh handoff.
