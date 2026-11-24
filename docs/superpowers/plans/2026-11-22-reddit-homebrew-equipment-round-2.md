# Reddit Homebrew Equipment, Round 2 Implementation Plan (#243, #248, #251, #252, #254-#257, #259, #260, #271, #274, #275)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan. One chunk per session, as `2026-11-12-custom-homebrew-batch.md` runs: each chunk ends with a commit, a ledger entry and a handoff. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bring in the fan equipment from r/battletech whose posts are saved or pasted: the X-ray Laser (#243, Munchkin), the battle armor tech and the Warden suit (#248), the Hypersonic Thunderbolt Missile (#251, Munchkin, with a Custom Homebrew rebalance), the Guild tech weapons (#252), 'Mech-scale recoilless rifles (#254), the Cryonic Coolant Injector and Cryonic Plant (#255), the Heavy Suction System (#256), the Dazzler and Volter (#257), the S.G.P. System (#259), the "unhinged weapon" (#260, Munchkin by ruling), the Retrotech concepts (#271), Mobile Repair Equipment (#274) and u/Riot0711's equipment idea (#275).

**Architecture:** Each item goes where its kind lives, in the custom catalogs only: lasers and other energy weapons in `src/data/energy-custom.ts`, ballistic weapons in `ballistic-custom.ts`, missiles in `missile-custom.ts`, ammunition in `ammo-custom.ts`, other equipment in `misc-custom.ts`, battle armor items in `src/data/battle-armor-equipment.ts` as level 6 / 7 records, values we work out in `derived-custom-values.ts`, rules text in `custom-lore-rules.ts`. Designs that use the items (the Warden suit) go on the custom unit list (`src/data/mul/custom/custom-units.json`, the #595 path). Tests extend `src/data/custom-homebrew-reddit-batch.test.ts`, `energy-custom.test.ts`, `misc-custom.test.ts`.

**Tech Stack:** TypeScript, Vitest (PowerShell).

**Spec:** each issue and the saved threads in `C:/repo/ResourceLibrary/scrapes/reddit/` (`1x77put.txt` and its mhtml, `tzw78c.txt`, `1njthgb.txt`, `15ktcew.txt`, `gy3abh.txt`, `pmv78q.txt`, `pj1aeo.txt`, `1fo4sq0.txt`, `1xcarxa.txt`, `1rh4fsx.txt`) or pasted into the issue (#271, #274, #275 by NGCFells on 2026-11-20).

## Global Constraints

- Intake rulings: fan equipment is Custom Homebrew (6); joke material is Munchkin (7) (#243, #251 as posted, #260 by NGCFells's "MUNCHKIN this"). A unit sits at the level its equipment sets.
- Custom catalogs only, never a canon list or canon BV/PV math (as `2026-11-12-custom-homebrew-batch.md`).
- Nothing from memory: read the thread first. A stat the author did not give is left at the "unverified" convention (`battleValue: 0`, `cbills: 0`) or worked out and labelled ours ("Inspired by: <author>, <link>" and what we extrapolated), as `derived-custom-values.ts` does.
- Every item gets an Alpha Strike conversion, ours, at its level (memory custom-items-get-as-conversion, our-rules-only-at-levels-6-7), and a TRO line.
- Every unit type that can mount the item, and every edition the custom rules ride (memory every-edition-every-rule).
- Credit the poster by Reddit name and link in notes, the TRO - JBT readout for custom items, and the news.
- A new record needs its tag in `src/data/__fixtures__/tech-lists.json`. Never grep `src/data/equipment-*.ts` without `| cut -c1-200`.
- No kept bundled design's BV or sheet value may change.
- Vitest: `npx vitest run --project unit src/data`, then `npm run check`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **#252 relative stats** ("I don't exactly have charts yet"). Recommended: work each out from the weapon it modifies by the post's rule (ER Re-Engineered: +50% range, heat as the ER step adds; HV Rifles: double damage against BAR under 7; and so on), labelled ours, at Custom Homebrew.
2. **#251 both versions.** Recommended: the as-posted HTM family at Munchkin and the commenters' single-shot fix at Custom Homebrew, as two record families with distinct names ("HTM" and "HTM (Rebalanced)").
3. **#257 Dazzler vs Gothic's Dazzle Mode Lasers.** Recommended: keep them separate; the Dazzler's notes point at the Gothic rule (`2026-11-22-battletech-gothic-edition.md` Task 2).
4. **#275** (NGCFells: "Let's see if we can figure that one out"). Recommended: read the post, write the best-fit record with every inferred value labelled ours, and post the proposed stats on #275 for a yes before committing.

## Usual checklist

| Item | Chunk |
|---|---|
| Records with notes, dates, BV, cost, credit | every chunk |
| Construction (offered on the right unit types at its level) | every chunk |
| Record sheet (the item prints on each sheet that carries it) | every chunk |
| Classic play (each item's effect: shutdown checks, one-shots, non-damaging effects, suction, cryonic heat) | every chunk |
| Alpha Strike (ours, at 6-7) | every chunk |
| TRO (a line per item; the custom TRO - JBT readout entry) | every chunk |
| Credits (poster and link) | every chunk |
| News, review, check, deploy, issue comments | 7 |

## Review Focus

- The X-ray Laser's shutdown check on 10+ and destruction on a to-hit roll of 2 happen in play, and it is refused without a fusion engine.
- Non-damaging weapons (Dazzler, Volter) never deal damage in play or in the AS conversion.
- BA items' kilogram weights and slot counts as posted; the Warden suit validates.
- No canon record changes.

## Session protocol (every chunk)

1. Read the handoff top block, this plan and the ledger `.superpowers/sdd/2026-11-22-reddit-round-2/progress.md`. Do the first chunk not marked done.
2. Per item in the chunk: read the thread; write every value (given, or ours with the reason) into the ledger; failing test (`custom-homebrew-reddit-batch.test.ts`: offered at its level on the right units, weight, slots, heat, damage, range, cost, BV, AS conversion, play effect, credit); run, FAIL; add the record; run, PASS.
3. `npm run check`; commit `Custom Homebrew: <item> from u/<poster> (#<n>)`; push `beta`.
4. Ledger and handoff; stop.

## Chunks

| Chunk | Items | Model |
|---|---|---|
| 1 | #243 X-ray Laser (Munchkin; fusion only, shutdown 10+, destroyed on a 2; BV and cost worked out like the Improved 'Mech Taser, #92); #251 HTM family (OWNER CALL 2) | Sonnet |
| 2 | #248 battle armor tech (the table in the issue: Small X-Pulse Laser (BA), Small Chemical Laser (BA), Combat Shields, MARS, MLP2, Defensor ECM, BA lasers, RAG) and the Warden Assault Armour on the custom list; #259 S.G.P. System | Sonnet |
| 3 | #252 Guild tech weapons (OWNER CALL 1): ER Re-Engineered Lasers, HV, Rotary and Scatter Rifles, ER and Heavy Rocket Launchers, the Plasma Rifle family, ER Binary Laser | Opus (many derived values) |
| 4 | #254 'Mech-scale recoilless rifles; #255 Cryonic Coolant Injector and Cryonic Plant; #256 Heavy Suction System | Sonnet |
| 5 | #257 Dazzler and Volter (OWNER CALL 3); #260 the unhinged weapon (Munchkin) | Sonnet |
| 6 | #271 Retrotech concepts; #274 Mobile Repair Equipment; #275 (OWNER CALL 4) | Sonnet |
| 7 | News, `npm run check`, astech Opus review of chunks 1-6 (fix Critical and Important test-first), push `beta`, `git deploy-beta`, comment on each issue in NGCFells' voice and close the finished ones; give the URLs | Sonnet; review Opus |
