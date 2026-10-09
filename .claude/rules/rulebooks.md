# Rulebook library: where the books are and how to cite them

The BattleTech rulebooks are local, in `_KNOWLEDGE_DEV/rulebooks/` (git-ignored), sorted into category folders. `INDEX.md` there is the full
catalog: every PDF, edition, errata sheet, and what each errata applies to. Read it before a source lookup. Never
reference these files from shipped code.

## Search the library first

`library_search.py` is a full-text index (SQLite FTS5, one row per page) over every extract: 1,193 books, 66,700 pages.
Use it before grepping or guessing which book a rule is in:

    python _KNOWLEDGE_DEV/rulebooks/library_search.py "partial wing" --canon          # current rulebooks and errata
    python _KNOWLEDGE_DEV/rulebooks/library_search.py "double heat sinks" --books      # which books mention it
    python _KNOWLEDGE_DEV/rulebooks/library_search.py "NEAR(hatchet damage, 8)" --book TM
    python _KNOWLEDGE_DEV/rulebooks/library_search.py "stealth" --folder rulebooks-legacy --limit 20

- Hits read `TM p.266 (pdf 268) [rulebooks]`: the printed page (with `?` when the offset is unverified), the PDF
  page and the folder. `[OCR]` hits come from scans: confirm numbers on the page image.
- A hit is a lead. Open the page (`--page <extract name> <pdf page>`, or the PDF) and read the rule before citing.
- The folder tells you the standing (see Folders below): a hit in `fan-made/` or `apocryphal/` is never canon.
- After adding, renaming or removing files: `sync_library.py --apply`, `extract_rulebooks.py`, `page_offsets.py`,
  `build_index.py`, then `library_search.py build`.

## Reading the extracts directly

Search the extracts before downloading anything or asking Ollama/Sarna:

- `text/<name>.txt`: `pdftotext -layout`, for prose.
- `text/<name>.raw.txt`: `pdftotext -raw`, for tables (layout scrambles columns).
- Pages are separated by form feeds. PDF page N is the Nth chunk: `awk -v RS='\f' 'NR==N' file`.
- **Printed page = PDF page − offset.** Always cite the printed page.

| Cite as | Book | Text file (under `_KNOWLEDGE_DEV/rulebooks/`) | Offset |
|---|---|---|---|
| TW | Total Warfare, corrected 11th printing (2024) | `text/BattleTech-Total-Warfare-11th.txt` | 1 |
| TM | TechManual, corrected 6th printing (2021) | `text/BattleTech-TechManual.txt` | 2 |
| TO:AR | Tactical Operations: Advanced Rules | `text/BattleTech-Tactical-Operations-Advanced-Rules.txt` | 1 |
| TO:AUE | Tactical Operations: Advanced Units & Equipment | `text/BattleTech-Tactical-Operations-Advanced-Units-and-Equipment.txt` | 1 |
| SO:AA | Strategic Operations: Advanced Aerospace Rules (2021) | `text/BattleTech-Strategic-Operations.txt` | 2 |
| IO | Interstellar Operations (2016) | `text/InterstellarOperations-2016.txt` | 2 |
| IO:AE | Interstellar Operations: Alternate Eras | `text/BattleTech-Interstellar-Operations-Alternate-Eras.txt` | 2 |
| IO:BF | Interstellar Operations: BattleForce | `text/BattleTech-Interstellar-Operations-BattleForce.txt` | 2 |
| CO | Campaign Operations | `text/BattleTech-Campaign-Operations.txt` | 2 |
| ASCE | Alpha Strike: Commander's Edition (2024) | `text/Alpha-Strike-Commander-s-Edition.txt` | 1 |
| AS / ASC | Alpha Strike (2013) / Alpha Strike Companion (2014) | `text/Alpha-Strike.txt`, `text/Alpha-Strike-Companion.txt` | 2 |
| BMM | BattleMech Manual, corrected 7th printing (2023) | `text/BattleMech-Manual.txt` | 2 |
| CRB | BattleTech Core Rulebook (2026) | `text/Battletech-Core-Rulebook.txt` | 1 |
| Gothic | BattleTech Gothic (2025) | `text/BattleTech-Rulebook-Gothic.txt` | 1 |
| Merc box / AGoAC | Mercenaries (2023) / A Game of Armored Combat (2018) box rulebooks | `text/BattleTech-Mercenaries-Rulebook.txt`, `text/CAT3500D-A-Game-of-Armored-Combat-Rulebook.txt` | 2 |
| Aces / Aces SS | BattleTech: Aces rulebook / Scouring Sands campaign book (OCR text) | `text/Battletech-Aces-RuleBook.ocr.txt`, `text/battletech-aces-scouring-sands-campaign-books.ocr.txt` | 1 / 0 |
| AS cards | DropShips & Small Craft, WarShips & JumpShips card PDFs | `text/E-CAT35AS001-*.txt`, `text/E-CAT35AS002-*.txt` | – |

## Folders (reorganised 2026-10-06)

The library holds about 870 files, sorted into folders. Text extracts stay flat in `text/<file name as slug>.txt`
whatever folder the PDF is in, so the table above is unchanged. `INDEX.md` ends with a generated catalog of every
file by folder; `_reorg-2026-10-06.json` maps old names to new paths and lists the 97 duplicates removed.

| Folder | What | Standing |
|---|---|---|
| `rulebooks/` | Current Catalyst line, older printings of it, BMM, Core Rulebook, box sets, quick-start rules | Canon (newest printing wins) |
| `alpha-strike/`, `errata/`, `errata-2025/` | Alpha Strike books and cards; errata sheets | Canon |
| `rulebooks-legacy/` | Battledroids, BattleTech 2nd/3rd Edition, Rules of Warfare, Compendium, Master Rules, Maximum Tech, Tactical Handbook, CityTech, AeroTech 1/2, BattleSpace, BattleForce 2, BattleTroops, ClanTroops, FanPro Total Warfare / TechManual | Canon for its own edition only; superseded for current rules |
| `rpg/` | MechWarrior 1st-3rd Edition, A Time of War and companions | Canon for the RPG |
| `technical-readouts/` | TROs 2750-3150 and era volumes, 31 XTROs, Recognition Guides | Canon unit data; the old scans are OCR |
| `record-sheets/`, `sourcebooks/`, `maps-and-art/` | Record sheet books; house books, field manuals, handbooks, era reports, historicals, scenario packs; maps | Canon where Catalyst/FanPro/FASA published it |
| `apocryphal/` | BattleTechnology magazine, House Arano (HBS game), MechWarrior 2 manual, WizKids clix cards | **Apocryphal: rules level 5** |
| `magazines/mechforce/` | MechForce UK Comnet, MechForce NA Mech magazine | Not canon; treat as Apocryphal at best, ask first |
| `magazines/australian-realms/` | Australian Realms, issues 1-30 and three specials (1988-1996), scans with no text layer | General gaming magazine: only some issues carry BattleTech material. Not canon; ask first |
| `fan-made/`, `fan-made/magazines/`, `Custom/` | Fan rules, fan TROs, fanzines, personal designs | **Custom-only: rules level 6 or 7, with approval** |
| `languages/de/`, `languages/es/`, `languages/fr/`, `languages/ru/` | German, Spanish, French and Russian material: newsletters, Punto Nadir, Perditecnia, Troll, Lider (Spanish general RPG magazine, issues 1-62, scans) | Not canon; cite the English book where one exists |
| `fiction/` | Novels and comics | Not a rules source |

Cite a Technical Readout as *TRO:3050* (or the volume name), an Experimental TRO as *XTRO:Liao*, a Recognition Guide
as *RG:ilClan v12*. For anything from `rulebooks-legacy/`, name the edition: "*BattleTech Compendium* (FASA 1640) p.N".
A name that says "title unconfirmed" or "title truncated" must be opened and identified before it is cited.

Older printings, as text only in `legacy-extracts/`:
- TW corrected 3rd printing (offset 6);
- TM 2007 FanPro first printing (offset 2);
- the original single-volume Tactical Operations, 2008 (offset 2).

The original Strategic Operations (2009) is `text/Strategic-Operations.txt` (offset 2).

Errata (offset 0, "Page N of M"):
- TW v5.1 and TM v3.1;
- TM BV 2.1 rev. 2017 and TM infantry tables rev. 2017;
- TO v3.02 and the TO landing modifiers table;
- SO v3.01 and the revised SO customization (refit) rules;
- ASCE v7.02 (2025, newest) and v7.0, AS v2.4 (first and second printing), ASC v1.2 and ASC converting heat v1.1;
- BattleMech Manual v2.1 and its corrected p. 42 flowchart;
- A Time of War v2.02.

Added 2026-10-08 from mordel.net's errata downloads (file names keep mordel's number prefix; in `errata/`, the RPG
ones in `rpg/`): every older version of the sheets above, plus
- Alpha Strike Companion v1.3 to v1.6 (v1.6, 2022, is the newest), Alpha Strike v2.3, v2.3.1 and v2.5, ASCE v2.0 to
  v7.01;
- TW v4.4, v6.0, v8.0; TM v3.1 (2016), v4.0, v4.1, v6.0, BV v4.0, infantry tables (2013); BMM v1.1.1 to v4.12;
- TO v3.03 and v3.6; SO v2.0, v2.1, v3.02; IO v1.1; CO v4.0;
- A Game of Armored Combat v8.01, Battle of Tukayyid v3.0 and v4.0, Hot Spots: Hinterlands v2.0, TRO: Clan Invasion
  v3.0, Master Rules (FanPro, 2004), Shattered Sphere (2000);
- A Time of War v3.0 and v4.0, AToW Companion v1.1, MechWarrior: Destiny v2.0.

The file for each is listed in `INDEX.md`.

Added 2026-10-09:
- 37 files from the archive.org `rpg.rem.uz` BattleTech archive that the library lacked (`_archive-org-2026-10-09.json`
  lists each): FASA House Kurita and House Davion (text reproductions), Field Manual: Capellan Confederation, Field
  Manual: Periphery, Interstellar Players, Operation Flashpoint, the Succession Wars board game rules, the Fourth
  Edition box sheets and tables, Solaris VII Gamemaster's Book, Null Set, 3025 record sheets (medium, assault), blank
  record sheets, MechWarrior 3rd Edition character aids, fan maps, two Nova combat books (in `apocryphal/`, standing
  not confirmed) and a Cyrillic translation of the Master Rules (`languages/ru/`). The archive's novels were not taken.
- 43 files sorted out of `unsorted/` (`unsorted/_moves.json`); 17 byte-identical copies removed (`unsorted/_deleted.json`).
  Six files left in `unsorted/` are different scans of books already in the library.

## Which edition wins

1. Cite the newest printing in the library: TW 11th, TM 6th, TO:AR / TO:AUE (not the original TO), SO:AA for
   aerospace construction, ASCE (not AS/ASC) for Alpha Strike, BMM 7th. A file name is not proof of a printing
   (`BattleMech Manual(old).pdf` is the 6th printing, not the oldest): read the credits page.
2. Errata sheets name the printings they correct. A sheet written against an older printing (TW v5.1, TM v3.1,
   TO v3.02, SO v3.01) only applies to a current book if the current text still has the error. Check before
   applying it.
3. Use an older printing only to explain a difference, or when the newer book dropped the rule. Say which
   printing you're citing.
4. If no local book settles a rule, follow MegaMek and note that (see the canon-silent rule).

## Gaps

- The Aces rulebook and Aces: Scouring Sands are scans; their `.ocr.txt` text is OCR. Body text is reliable,
  flowcharts and icons are not. Verify a quote against the PDF page before citing it.
- About 200 files are scans with no text layer (most FASA-era books, the old Technical Readouts, BattleTechnology).
  OCR is run on request, not for the whole library; `INDEX.md` shows which have it. OCR is fine for prose and
  unreliable for stat blocks: check numbers against the page image.
- Offsets for the 2026-10-06 additions were measured automatically. `INDEX.md` marks the weak ones with `?`.
- Not in the library: Interstellar Operations: Alpha Strike Edition.

## Keeping it current

When PDFs are added:
0. Move each new file into the matching folder and give it its real title (publisher and product number in
   parentheses). Remove it if a better copy of the same book is already there.
1. Run `python _KNOWLEDGE_DEV/rulebooks/extract_rulebooks.py _KNOWLEDGE_DEV/rulebooks`. It walks the folders and
   skips files already extracted.
2. Run `page_offsets.py` on `text/`, then `build_index.py` to refresh the catalog in `INDEX.md`.
   Scanned PDFs (no text layer) need OCR instead:
   `python _KNOWLEDGE_DEV/rulebooks/ocr_ollama.py _KNOWLEDGE_DEV/rulebooks "<folder>/<file>.pdf"`. It uses the
   local Ollama vision model `glm-ocr` (about 7 s a page), reads only pages with no text layer, resumes if
   interrupted and falls back to Tesseract on a page the model fails on. `ocr_rulebooks.py` is Tesseract alone
   (`C:\Program Files\Tesseract-OCR`). Then rebuild the search index.
3. Dedupe by edition, not file name.
4. Update `INDEX.md` and this table.
