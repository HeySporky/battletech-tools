# Rulebook library: where the books are and how to cite them

The BattleTech rulebooks are local, in `_KNOWLEDGE_DEV/rulebooks/` (git-ignored). `INDEX.md` there is the full
catalog: every PDF, edition, errata sheet, and what each errata applies to. Read it before a source lookup. Never
reference these files from shipped code.

## Look things up in the local text first

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
| CRB | BattleTech Core Rulebook (2026) | `text/Battletech-Core-Rulebook.txt` | 1 |
| Gothic | BattleTech Gothic (2025) | `text/BattleTech-Rulebook-Gothic.txt` | 1 |
| Merc box / AGoAC | Mercenaries (2023) / A Game of Armored Combat (2018) box rulebooks | `text/BattleTech-Mercenaries-Rulebook.txt`, `text/CAT3500D-A-Game-of-Armored-Combat-Rulebook.txt` | 2 |
| Aces / Aces SS | BattleTech: Aces rulebook / Scouring Sands campaign book (OCR text) | `text/Battletech-Aces-RuleBook.ocr.txt`, `text/battletech-aces-scouring-sands-campaign-books.ocr.txt` | 1 / 0 |
| AS cards | DropShips & Small Craft, WarShips & JumpShips card PDFs | `text/E-CAT35AS001-*.txt`, `text/E-CAT35AS002-*.txt` | – |

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
- ASCE v7.0, AS v2.4 (first and second printing), ASC v1.2 and ASC converting heat v1.1;
- BattleMech Manual v2.1 and its corrected p. 42 flowchart;
- A Time of War v2.02.

The file for each is listed in `INDEX.md`.

## Which edition wins

1. Cite the newest printing in the library: TW 11th, TM 6th, TO:AR / TO:AUE (not the original TO), SO:AA for
   aerospace construction, ASCE (not AS/ASC) for Alpha Strike.
2. Errata sheets name the printings they correct. A sheet written against an older printing (TW v5.1, TM v3.1,
   TO v3.02, SO v3.01) only applies to a current book if the current text still has the error. Check before
   applying it.
3. Use an older printing only to explain a difference, or when the newer book dropped the rule. Say which
   printing you're citing.
4. If no local book settles a rule, follow MegaMek and note that (see the canon-silent rule).

## Gaps

- The Aces rulebook and Aces: Scouring Sands are scans; their `.ocr.txt` text is OCR. Body text is reliable,
  flowcharts and icons are not. Verify a quote against the PDF page before citing it.
- Not in the library: BattleMech Manual, A Time of War, Interstellar Operations: Alpha Strike Edition, and the
  original TO PDF (text only).

## Keeping it current

When PDFs are added:
1. Run `python _KNOWLEDGE_DEV/rulebooks/extract_rulebooks.py _KNOWLEDGE_DEV/rulebooks`. It skips files
   already extracted.
2. Run `page_offsets.py` on `text/`.
   Scanned PDFs (no text layer) need OCR instead:
   `python _KNOWLEDGE_DEV/rulebooks/ocr_rulebooks.py _KNOWLEDGE_DEV/rulebooks "<file>.pdf"` (PyMuPDF and
   Tesseract, `C:\Program Files\Tesseract-OCR`).
3. Dedupe by edition, not file name.
4. Update `INDEX.md` and this table.
