# Rulebook library: where the books are and how to cite them

The BattleTech rulebooks are local, in `C:/repo/JBTIICRework/` (its own repository, ngcfells/JBTIICRework, outside this one), sorted into category folders. `INDEX.md` there is the full
catalog: every PDF, edition, errata sheet, and what each errata applies to. Read it before a source lookup. Never
reference these files from shipped code.

## Search the library first

`library_search.py` is a full-text index (SQLite FTS5, one row per page) over every extract: 1,388 books, 80,097 pages (2026-10-10).
Use it before grepping or guessing which book a rule is in:

    python C:/repo/JBTIICRework/library_search.py "partial wing" --canon          # current rulebooks and errata
    python C:/repo/JBTIICRework/library_search.py "double heat sinks" --books      # which books mention it
    python C:/repo/JBTIICRework/library_search.py "NEAR(hatchet damage, 8)" --book TM
    python C:/repo/JBTIICRework/library_search.py "stealth" --folder rulebooks-legacy --limit 20

- Hits read `TM p.266 (pdf 268) [rulebooks]`: the printed page (with `?` when the offset is unverified), the PDF
  page and the folder. `[OCR]` hits come from scans: confirm numbers on the page image.
- A hit is a lead. Open the page (`--page <extract name> <pdf page>`, or the PDF) and read the rule before citing.
- The folder tells you the standing (see Folders below): a hit in `fan-made/` or `apocryphal/` is never canon.
- After adding, renaming or removing files: `sync_library.py --apply`, `extract_rulebooks.py`, `page_offsets.py`,
  `hash_library.py`, `build_index.py`, then `library_search.py build` (see Keeping it current). Run the scripts with
  `py -3.11` from the library folder: PyMuPDF is installed there, not in the default Python.

## Reading the extracts directly

Search the extracts before downloading anything or asking Ollama/Sarna:

- `text/<name>.txt`: `pdftotext -layout`, for prose.
- `text/<name>.raw.txt`: `pdftotext -raw`, for tables (layout scrambles columns).
- Pages are separated by form feeds. PDF page N is the Nth chunk: `awk -v RS='\f' 'NR==N' file`.
- **Printed page = PDF page − offset.** Always cite the printed page.

| Cite as | Book | Text file (under `C:/repo/JBTIICRework/`) | Offset |
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

## Folders (reorganised 2026-10-06, extended 2026-10-10)

The library holds 1,463 files (2026-10-10), sorted into folders. Text extracts stay flat in `text/<file name as slug>.txt`
whatever folder the PDF is in, so the table above is unchanged. `INDEX.md` ends with a generated catalog of every
file by folder, with its SHA-256 and VirusTotal result; `_reorg-2026-10-06.json` maps old names to new paths and lists the 97 duplicates removed.

| Folder | What | Standing |
|---|---|---|
| `rulebooks/` | Current Catalyst line, older printings of it, BMM, Core Rulebook, box sets, quick-start rules | Canon (newest printing wins) |
| `alpha-strike/`, `errata/`, `errata-2025/` | Alpha Strike books and cards; errata sheets | Canon |
| `rulebooks-legacy/` | Battledroids, BattleTech 2nd/3rd Edition, Rules of Warfare, Compendium, Master Rules, Maximum Tech, Tactical Handbook, CityTech, AeroTech 1/2, BattleSpace, BattleForce 2, BattleTroops, ClanTroops, FanPro Total Warfare / TechManual | Canon for its own edition only; superseded for current rules |
| `rpg/` | MechWarrior 1st-3rd Edition, A Time of War and companions | Canon for the RPG |
| `technical-readouts/` | TROs 2750-3150 and era volumes, 31 XTROs, Recognition Guides | Canon unit data; the old scans are OCR |
| `record-sheets/`, `sourcebooks/`, `maps-and-art/` | Record sheet books; house books, field manuals, handbooks, era reports, historicals, scenario packs; maps. `sourcebooks/` has series sub-folders (Field Manual, Force Manual, Historical, Hot Spots, House Books, Jihad, Mercenaries, Objectives, Turning Points, Touring the Stars, Scenarios and Campaigns, Official Magazines and others) | Canon where Catalyst/FanPro/FASA published it |
| `card-games/` | BattleTech TCG/CCG rulebooks and card lists | Canon for the card game only; not a source for tabletop rules |
| `apocryphal/` | BattleTechnology magazine, House Arano (HBS game), MechWarrior 2 manual, WizKids clix cards | **Apocryphal: rules level 5** |
| `magazines/mechforce/` | MechForce UK Comnet, MechForce NA Mech magazine | Not canon; treat as Apocryphal at best, ask first |
| `magazines/australian-realms/` | Australian Realms, issues 1-30 and three specials (1988-1996), scans with no text layer | General gaming magazine: only some issues carry BattleTech material. Not canon; ask first |
| `fan-made/`, `fan-made/magazines/`, `Custom/` | Fan rules, fan TROs, fanzines, personal designs | **Custom-only: rules level 6 or 7, with approval** |
| `languages/de/`, `es/`, `fr/`, `it/`, `jp/`, `ru/` | German, Spanish, French, Italian, Japanese and Russian material: newsletters, Punto Nadir, Perditecnia, Troll, Lider (Spanish general RPG magazine, issues 1-62, scans) | Not canon; cite the English book where one exists |
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

Added 2026-10-10:
- About 270 files the user added by hand (the series sub-folders, `card-games/`, `languages/it/`, `languages/jp/`).
- 42 files sorted out of `unsorted/` (`unsorted/_moves.json`); 39 byte-identical copies removed
  (`_dupes-2026-10-10.json`). 18 files remain in `unsorted/`: different scans of held books, four unidentified
  files and three non-PDFs.
- The names given that day (titles, publishers, product numbers, years) came from product-line knowledge, not from
  opening each PDF. Confirm against the credits page before citing one of them.

## File names (user, 2026-10-10)

New and renamed files are `Title (Publisher CatalogID)[copyright year](printing).ext`, for example
`Field Manual - SLDF (CGL)[2012].pdf`. Leave out a part that is not known; never guess it. A Scribd or archive
upload number at the front of a file name is not a product number. Older names (`(FASA 1687, scan)`) have not been
converted; convert one only when renaming it anyway or when asked.

## Hashes, duplicates and VirusTotal

- `hash_library.py .` stores a SHA-256 for every file in `text/_hashes.json`; `build_index.py` prints it in the
  catalog. Before adding a file, run `py -3.11 hash_library.py . --check <file or folder>`: `HELD` means the same
  bytes are already in the library.
- `hash_library.py . --dupes` must report 0 groups after any change (it did on 2026-10-10). A different scan of the
  same book has a different hash: compare title and page count as well (`verify_dupes.py`).
- `virustotal_check.py .` looks each hash up on virustotal.com (the hash only, never the file) and fills the
  VirusTotal column. It needs the user's API key in `VT_API_KEY`; the free key allows 500 lookups a day, so a full
  pass takes about three days of runs and resumes each time. As of 2026-10-10 no key was set and every row reads
  `not checked`. `unknown` means VirusTotal has never seen the file, not that it is safe.
- A VirusTotal flag is not proof of malware. Read which engines flagged it and inspect the file (for a PDF:
  JavaScript, launch and form-submit actions, embedded files), then record the finding in `virustotal_reviews.json`.
  Confirmed malware is deleted, with the user's approval, and its hash added to `blacklist.txt`.
  `check_blacklist.py .` fails if a blacklisted hash is in the repository; `.github/workflows/blacklist-scan.yml`
  runs it every Monday and on every push. First flag (2026-10-10): `Dossiers - Jason Zaklan.pdf`, a ClamAV
  open-action heuristic, reviewed as a false positive and kept.
- `inspect_files.py .` looks inside every file locally (no upload) for a program hiding under another extension, PDF
  JavaScript and launch / submit / remote actions, embedded files, and programs or macros in archives and Office
  files; the result is the Contents column of the catalog. It is a structural check, not an antivirus scan. Checked
  findings go in `inspect_reviews.json` (17 on 2026-10-10, all harmless). Do not upload VirusTotal "unknown" files:
  uploading shares them (user, 2026-10-10). No command-line antivirus is available here: AVG has no command-line
  scanner and Windows Defender is off while AVG is installed.
- New files go in `unsorted/`. The watcher `watch_unsorted.py` (started at logon by a per-user Run entry,
  "JBTIICRework intake") hashes them, moves byte-identical copies to `unsorted/_duplicates/` and blacklisted files or
  disguised programs to `unsorted/_quarantine/`, inspects contents, looks the hashes up on VirusTotal, rebuilds
  `INDEX.md` and logs to `unsorted/_intake.log`. It deletes nothing and sorts nothing. `--once` runs it by hand.
- `sort_unsorted.py` asks a local Ollama model to name and place files in `unsorted/`. Treat its proposal as a draft
  and check each row before `--apply`: on 2026-10-10 it got publishers, product numbers and folders wrong.

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
- About 290 files were scans with no text layer on 2026-10-10 (most FASA-era books, the old Technical Readouts,
  the magazines). `ocr_queue.py` was started that day to OCR them all (about 91 hours; progress in
  `text/_ocr_queue.log`), so check whether it finished before assuming a scan has text; `INDEX.md` shows which have it. OCR is fine for prose and
  unreliable for stat blocks: check numbers against the page image.
- Offsets for the 2026-10-06 additions were measured automatically. `INDEX.md` marks the weak ones with `?`.
- Not in the library: Interstellar Operations: Alpha Strike Edition.

## Keeping it current

When PDFs are added:
0. Move each new file into the matching folder and give it its real title (publisher and product number in
   parentheses). Remove it if a better copy of the same book is already there.
1. Run `sync_library.py . --apply` if anything was renamed or removed, then `extract_rulebooks.py .`. It walks the
   folders and skips files already extracted.
2. Run `page_offsets.py text`, `hash_library.py .` (and `virustotal_check.py .` when a key is set), then
   `build_index.py .` to refresh the catalog in `INDEX.md`.
   Scanned PDFs (no text layer) need OCR instead:
   `python C:/repo/JBTIICRework/ocr_ollama.py C:/repo/JBTIICRework "<folder>/<file>.pdf"`. It uses the
   local Ollama vision model `glm-ocr` (about 7 s a page), reads only pages with no text layer, resumes if
   interrupted and falls back to Tesseract on a page the model fails on. `ocr_rulebooks.py` is Tesseract alone
   (`C:\Program Files\Tesseract-OCR`). Tesseract language packs (deu, spa, fra, ita, jpn, pol, por, rus) are in
   `%USERPROFILE%/tessdata`; the scripts point `TESSDATA_PREFIX` there and pick the language from the
   `languages/<code>/` folder. Japanese has its own script, `ocr_japanese.py` (2026-10-13): `ocr_ollama.py` hands anything in
   `languages/jp/` to it, and with no file named it reads every PDF, image, zip or folder of page images there
   that has no extract. It handles vertical text (`jpn_vert`) and Japanese line lengths; the opening-page reads
   in `sort_unsorted.py` and `verify_unsorted.py` do not include Japanese, so the user files those by hand.
   `ocr_queue.py .` works through every scan without an extract (maps and record sheets
   excluded), most useful folders first; `--list` shows what is waiting. Then rebuild the search index.
3. Dedupe by edition, not file name.
4. Update `INDEX.md` and this table.
