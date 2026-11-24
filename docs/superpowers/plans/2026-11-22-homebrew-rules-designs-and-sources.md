# Homebrew Rules, Fan Designs, Monoped / Hexapod / Octapod 'Mechs, Fan Wikis and the NOVA Combat Books Implementation Plan (#174, #176, #177, #242, #244, #245, #246, #247, #258, #272, #273, #276, #289, #597)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan. One chunk per session (the `2026-11-12-custom-homebrew-batch.md` protocol): commit, ledger entry, handoff. Steps use checkbox (`- [ ]`) syntax.

**Goal:**
- Homebrew rules options: u/EyeStache's LAM rules (#258), the expanded BAR system (#272), using OV to exceed the heat scale (#273), Grimy Grondoval's ideas (#289), and kicking a jeep at another 'Mech through the book rule NGCFells pointed at (#276).
- Fan designs: the ROM Dossier: Star League ships (#245), Nightblade's Cheetah Racemech and Hellfire (#246), the drive-download pack and Wars of Grievance 'Mechs (#247), the Shadow Hawk SHD-5SD "Lyran Recon" (#597).
- New 'Mech configurations: one-legged 'Mechs with the LCT-Hopalong and Pogo Locust (#242, Munchkin), and hexapod and octapod 'Mechs (#174).
- Sources: the Lostech wiki (#176) and BattleTech Fanon wiki weapons (#177).
- The NOVA Combat Books simulator with its placeholder terrain cards (#244).

**Architecture:**
- Rules options are switches in the game settings (the Special Rulesets and quirks pattern: `src/data/rules-editions.ts` `getSelectableRulesExpansions` ~1350 for the canon side, `custom-lore-rules.ts` for fan rules), with play effects in the 'Mech play view. A homebrew LAM ruleset is a row in `LAM_TYPE_RULES` (`battlemech.ts`).
- Designs go in through the importers (`battlemech-mtf.ts`, `blk-unit-import.ts`; `2026-11-22-megamek-import-export.md` adds the capital ship BLK reader that #245 needs) or are built in the creators, and ship on the custom unit list (`src/data/mul/custom/custom-units.json`).
- New 'Mech configurations are rows in `src/data/mech-type-options.ts` (`mechTypeOptions`, beside biped, quad, tripod, LAM, QuadVee), with their locations, crit tables, hit location tables and sheet diagrams in `battlemech.ts` and the 'Mech sheet.
- The NOVA simulator is a page under Other Tools (`src/ui/pages/other-tools.tsx`) reading the six 1987 Nova Game Designs Combat Books in the library (`C:/repo/ResourceLibrary/text/Combat-Book-*-Nova-Game-Designs-*-1987.txt`).

**Tech Stack:** TypeScript, React, Vitest (PowerShell).

**Spec:** the issues; saved threads `C:/repo/ResourceLibrary/scrapes/reddit/1vis429.txt` (#258) and `Cursed Mech _ r_battletech.mhtml` (#242); threads pasted on #272, #273, #289 by NGCFells on 2026-11-20; #597's post body; the files in `C:/repo/JBTIICRework/unsorted/` (`ROM Dossier Star League-20261017T042211Z-1-001.zip`, `cheetah.mch.txt`, `hellfire.mch.txt`, `drive-download-20261017T042221Z-1-001.zip`, `Copilot_*.png`, the Pogo Locust sheet image); TO:AR pp.90-95 ("Picking Up and Throwing Objects", "Picking Up and Throwing Vehicles" p.94, `BattleTech-Tactical-Operations-Advanced-Rules.txt` line ~6090).

## Global Constraints

- Intake rulings: fan rules and equipment are Custom Homebrew (6); joke material is Munchkin (7) (#242); a fan design sits at the level its highest equipment sets, never the file's `type`.
- Our own rules or conversions appear only at levels 6-7; canon rules (TO:AR throwing) keep their own level (Advanced).
- Every edition and every unit type (memory every-edition-every-rule): a new 'Mech configuration works in every creator step, sheet, BV, cost, play and AS path a quad or tripod does; it gets a TRO Unit Types readout (memory plans-carry-full-checklist).
- Every custom item gets our AS conversion; every design gets its card (memory custom-items-get-as-conversion).
- Credits: each poster, author or site by name and link, in notes, the TRO - JBT readout and news. Wikis: CC BY-SA text is paraphrased, credited, and the licence named.
- Before adding a design, check no MUL design uses its name (#247 note).
- Condense and extend: new configurations are rows in existing data and branches in `battlemech.ts`; the NOVA page is one new page file with its test.
- Vitest: `npx vitest run --project unit <path>`, then `npm run check`, from PowerShell. No apostrophes in Bash commands or heredocs.
- Commit messages: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **#276.** NGCFells: "there is a reference to a book rule... we will use that versus this if it makes sense". Recommended: build TO:AR's Picking Up and Throwing Vehicles (p.94) and Objects (pp.90-93) as canon Advanced play rules; the post's variant only as a level 6 option if, once the thread is saved, it differs.
2. **Hexapods and octapods (#174).** No canon rules exist. Recommended: extend the quad rules (four legs: TM quad construction) to six and eight legs at Custom Homebrew: two or four more leg locations, structure per the quad table, leg actuator crits, Piloting bonus per extra pair of legs kept, hit location table rows rolled per pair; the post's specifics replace any of ours once it is saved (https://www.reddit.com/r/battletech/comments/fb5ufe/, "Eight and six legged mech thoughts"; the poster is credited once the thread is read).
3. **One-legged 'Mechs (#242).** Recommended: Munchkin; one Central Leg location, hopping movement (walking MP as posted), a Piloting roll each turn it moves, falls on any leg damage roll, the Pogo Locust's BV checked against its sheet's 1355.
4. **#597 stats.** The Lyran Recon's numbers are in the post image. Recommended: save the image into `scrapes/reddit/17tjmlv.jpg` first and transcribe; check our BV against the image's.
5. **NOVA Combat Books (#244).** No simulator exists yet. Recommended: a first-cut simulator page for the six Combat Books (pick two books, flip to the maneuver pages as the books direct), with the seven Copilot terrain cards tidied and marked "PLACEHOLDER" wherever they show, replaced when the real cards arrive.
6. **Wikis (#176, #177).** Recommended: save each item page into `C:/repo/ResourceLibrary/scrapes/` (`lostech.miraheze.org/`, `battletechfanon.fandom.com/`), triage into a list on each issue (item, kind, stats given, level), then build in batches of ten as the equipment round does.

## Usual checklist

| Item | Chunk |
|---|---|
| Records with notes, dates, BV, cost, credit | 1-8 |
| Construction (new configurations; designs validate) | 3, 4, 5 |
| Record sheet (monoped, hexapod and octapod diagrams; designs print) | 3, 4, 5 |
| Classic play (each rule; throwing; new configurations; NOVA) | 1, 2, 3, 4, 8 |
| Alpha Strike (rules ours at 6; every design's card; new configurations convert as their nearest canon kind, ours at 6-7) | 1-5 |
| TRO (each design; Unit Types readouts for the three configurations) | 3, 4, 5 |
| Credits | every chunk |
| News, review, check, deploy, issue comments | 9 |

## Review Focus

- A homebrew rule switch off: canon play unchanged (play tests stay green).
- Hexapod and octapod BV and cost: leg counts feed the same formulas the quad uses, never a hard-coded four.
- Throwing a vehicle: TO:AR's lifting limits and damage as printed.
- Imported designs: rules level from their equipment; MegaMek-only names handled by the import report.

---

## Chunks

| Chunk | Work | Model |
|---|---|---|
| 1 | Rules: #258 LAM rules (a `LAM_TYPE_RULES` homebrew row, from `1vis429.txt`), #273 OV over the heat scale, #289 Grondoval's ideas. Per rule: read, ledger, failing play test, switch in game settings at level 6, implement, PASS, commit `Homebrew rules: <rule> from u/<poster> (#<n>)` | Opus |
| 2 | Rules: #272 expanded BAR (weapon damage against BAR by weapon class, as posted); #276 TO:AR throwing (OWNER CALL 1): failing tests for lifting limits, throwing distance, damage to thrown and target | Opus |
| 3 | #242 one-legged 'Mechs (OWNER CALL 3): `mech-type-options.ts` row, locations, crits, sheet diagram, play, BV (Pogo Locust 1355 check), LCT-Hopalong and Pogo Locust on the custom list, Unit Types readout | Opus |
| 4 | #174 hexapods and octapods (OWNER CALL 2): rows, locations, crits, hit tables, sheet diagrams, BV, cost, play, AS, Unit Types readouts, one sample design each | Opus |
| 5 | Designs: #246 Cheetah Racemech and Hellfire (rebuild from the mass breakdowns); #597 SHD-5SD (OWNER CALL 4); #247 the drive-download pack and Wars of Grievance 'Mechs (MTF import; the Gwyllgi DropShip BLK; two Frenzy E files checked); #245 ROM Dossier ships (after the capital ship BLK reader lands) and `Shootist C 3.mtf`. One commit per pack `Custom designs: <pack> (#<n>)` | Sonnet |
| 6 | Wiki triage (OWNER CALL 6): save and list Lostech (#176) and Fanon weapons (#177); comment the lists on the issues | Haiku |
| 7 | Wiki builds: the triaged items in batches of ten, the equipment-round session protocol | Sonnet |
| 8 | NOVA Combat Books simulator first cut and placeholder terrain cards (OWNER CALL 5): page under Other Tools, its test (two books load, a maneuver resolves to the book's page, terrain card modifiers apply, "PLACEHOLDER" shows on every card) | Sonnet |
| 9 | News, `npm run check`, astech Opus review of chunks 1-4, push `beta`, `git deploy-beta`, comments on every issue in NGCFells' voice, close the finished ones, give the URLs | Sonnet; review Opus |

Each chunk: failing test first, run (FAIL), implement, run (PASS), `npm run check`, commit, push `beta`, ledger `.superpowers/sdd/2026-11-22-homebrew-rules-designs/progress.md`, handoff, stop.
