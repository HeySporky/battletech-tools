# Catalog consolidation, round 6: book → edition table and the coverage checklist

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every library book its rules edition by publication date (§3), and list everything MegaMek knows
against our catalogs (§4), so round 7 can fill the gaps family by family.

**Architecture:** Two scripts in `tools/`, each fed by a skipped-unless-asked generator test that writes what the app
knows (the edition timeline, every catalog record's identity). No app data changes apart from the publication months.

**Tech Stack:** Python 3 (tools), Vitest generator tests, TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-24-catalog-consolidation-design.md` (§3, §4; round 6 of "Order of work").

## Global Constraints

- A book belongs to the edition current at its publication, to the month where known; books between editions
  belong to the older one (ruling 7). The expansions count (ruling 9).
- When a date isn't in the book, look it up on the web and confirm with the user (user, 2026-10-24).
- MegaMek is the inventory, the books are the authority (ruling 6). Read only names, aliases, tech base, rules
  levels and rules references from MegaMek; copy no code.
- Never commit in `C:\repo\JBTIICRework`; the table is written to its `text/` folder.

## Review Focus

- A book published the month before an edition belongs to the edition before it, and one with no month counts from
  January. Pinned in `rules-editions.test.ts` ("reads the release month").
- A later printing carries its first book's copyright years: the cited books are dated by hand
  (`tools/book-editions-reviewed.tsv`), and a reviewed row that names no library file stops the script.
- Ammunition is matched by weapon family and munition, not by launcher size.

---

## Task 1: Book → edition table

- [x] `src/data/edition-timeline.generator.test.ts` writes the timeline for the script.
- [x] `tools/book_editions.py` dates each book from its copyright and printing lines and gives its edition for each
      unit type. It writes `<library>/text/_book-editions.tsv`. Of 1,076 books, 372 rows are marked "check".
- [x] `tools/book-editions-reviewed.tsv`: the 38 books the catalogs cite (every edition and expansion book, and the
      later books of each edition), dated by first publication with evidence. No rulebook prints a release month, so
      the months come from sarna.net. The user confirmed them (2026-10-24), and also ruled: BT3 stays 1992 from
      the book; Sarna's print dates where the two differ; the CBT box set stays 2002.
- [x] The months go into `btRulesEditions` and `btRulesExpansions`: Battledroids 8/1984, BT2 6/1985,
      BattleTech Manual 8/1987, Compendium 7/1990, Compendium RoW 7/1994, BMM 10/2017, CRB 7/2026, CityTech 8/1986,
      AeroTech 8/1986, BattleTroops 8/1989, ClanTroops 12/1991, CityTech 2 12/1994.

## Task 2: Coverage checklist

- [x] `src/data/catalog-identities.generator.test.ts` writes every catalog record's identity.
- [x] `tools/coverage_checklist.py` matches MegaMek's `-eqe_db` export, with the construction components added, against
      the identities. Unmatched names are then looked for in `src` (builder options). The result is
      `tools/coverage-checklist.md`: 3,830 items, 850 not matched to a catalog record.
- [x] Latest three books swept by hand (Core Rulebook, Gothic, XTRO: RISC); results in
      `tools/canon-catalog-completeness.md`.

## Verification

- [x] `npx vitest run --project unit`, `npx tsc --noEmit -p .`, `npx eslint` on the changed files.
- [x] No BV change: only edition months changed, and BV reads no month.
