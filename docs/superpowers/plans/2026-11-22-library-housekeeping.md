# Reference Library Housekeeping Plan (#222, #223, #224, #225, #226, #601)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the library work: read the 2026-10-06 sources for rules the tool lacks and file each gap (#222), finish OCR of the scanned files (#223), name the untitled files (#224), push the library within the LFS budget and clean up after (#225, #601), and apply the file renames folder by folder (#226).

**Architecture:** Two local repositories: `C:/repo/JBTIICRework` (the library files, Git LFS, `main` two commits ahead of `origin/main` on 2026-11-22: `c5971b76` part 1 and `7cbe16a7` part 2) and `C:/repo/ResourceLibrary` (the scripts: `rename_library.py`, `build_index.py`, `library_search.py`, `ocr_queue.py`, `ocr_textlayer.py`, `render_page.py`, and the `text/` extracts). No app code changes.

**Tech Stack:** Python 3.11, Git LFS, Surya 2.5 OCR on its own llama-server (memory ocr-ollama-surya).

**Spec:** the issues and their status comments (#225 and #601, 2026-11-20: trim, then push from 2026-12-01 in parts; the LFS allowance is 10 GB a month).

## Global Constraints

- LFS budget: at most 10 GB of LFS upload a month. Part 1 (8.74 GB) goes on or after 2026-12-01; part 2 (2.63 GB) the month after. Never force-push the library.
- Kept local on purpose (`.gitignore`): the 102 `.mobi`/`.azw`/`.mp4` files with no LFS rule (two videos over 100 MB), and `unsorted/Hairbrained Schemes/BATTLETECH-OST_wav.zip` (3.15 GB, over LFS's 2 GB file limit).
- OCR: Surya only; check OCR against the page image before citing a stat block; any page read from its image is written back WHOLE into every printing's extract and `_corrected_pages.md` (keep CRLF where the file has it), then ResourceLibrary is pushed.
- No model bake-offs until Qwen4 (memory hold-model-bakeoffs-for-qwen4): OCR keeps Surya 2.5.
- Commit messages in both library repos: plain, first person, no Co-Authored-By or Generated-with line.

## OWNER CALLS (written to the recommended answer)

1. **#226 publisher of 2008-09 WizKids-licensed books.** Recommended: Catalyst Game Labs (CGL), since Catalyst published under the WizKids licence from 2007 and FanPro's licence had ended; the file name says CGL and the edition notes the licence holder.
2. **#226 fan-made or official:** recommended rule: official when the file carries a FASA, FanPro or CGL copyright block or came from the publisher's site or store; fan-made otherwise. By that rule: IO Open Beta (CGL beta, official), MUL: Battle Values (CGL, official), CBT Tournament M21 and BTCC 2023 (official only if their copyright block is present; check the first page), the FASA/CGL product list (fan-made unless it has a block).
3. **Push day.** Recommended: run part 1 on 2026-12-01 as planned, verify, then part 2 on 2027-01-01.

## Usual checklist

Records, construction, record sheet, play, Alpha Strike, TRO, credits: none here (#222's gaps become their own issues, each with the full checklist when planned). News: none. Issue comments: Task 6.

---

### Task 1: Push part 1 on or after 2026-12-01 (#225, #601)

- [ ] `git -C C:/repo/JBTIICRework lfs status` and `git -C C:/repo/JBTIICRework log --oneline origin/main..main` (expect the two commits). Check the month's LFS bandwidth/storage on GitHub first.
- [ ] `git -C C:/repo/JBTIICRework push origin c5971b76:main`. Verify: `git -C C:/repo/JBTIICRework lfs ls-files | wc -l` against the commit, and fetch one new LFS file back from a fresh clone and compare its hash.
- [ ] Comment the result on #601 and #225.

### Task 2: Push part 2 the month after; clean up (#225, #601)

- [ ] On or after 2027-01-01: `git -C C:/repo/JBTIICRework push origin main`. Verify as in Task 1.
- [ ] Delete the local branch `backup/pre-lfs-strip` (`git -C C:/repo/JBTIICRework branch -D backup/pre-lfs-strip`) only after both pushes verify.
- [ ] Close #225 and #601 with the evidence.

### Task 3: File renames (#226)

- [ ] Review `_rename/review.md` (44 renames in `rulebooks/`, 12 to review, 10 fan-made) with OWNER CALLS 1-2 applied; record each decision in the review file.
- [ ] `py -3.11 C:/repo/ResourceLibrary/rename_library.py . rulebooks --apply`, then `sync_library.py . --apply`, then `build_index.py`. Check `library_search.py` still finds three renamed books by title.
- [ ] Commit in JBTIICRework (renames are cheap in LFS: pointers move, no re-upload) and push within the month's budget; then `sourcebooks/` and each other folder, one folder per commit.
- [ ] Update `text/` extract names in ResourceLibrary to match, and every path the battletech-tools repo cites (`grep -rn "rulebooks-legacy/\|record-sheets/" C:/repo/btt-plans/docs`), in one commit per repo.

### Task 4: Untitled files (#224)

- [ ] List files named "title unconfirmed" or "title truncated" (20 on 2026-10-17). For each: read the cover and first pages (extract, else `render_page.py` page 1), find the real title (magazine masthead, ISBN, product number), rename by the `Title(Publisher-ProductNo)[CopyrightYear]-Edition.ext` scheme. Record each in `_rename/review.md`. Commit and push within the budget.

### Task 5: OCR the scanned files (#223) and read the 2026-10-06 sources (#222)

- [ ] OCR: `py -3.11 C:/repo/ResourceLibrary/ocr_queue.py` for the queue order: the 20 scanned Technical Readouts next, then `rpg/` and `sourcebooks/` as needed. Each finished book: spot-check three stat blocks against page images; commit the extracts to ResourceLibrary.
- [ ] Read: the BattleMech Manual (7th printing), Ghosts of Obeedah, The Wars of Reaving and its Supplemental, the 31 XTROs and the quick-start rulebooks, for rules and options the tool lacks. Compare against the app (grep the feature names in `C:/repo/btt-plans/src`). For each gap, open an issue (title "<Book>: <rule or item>", body with the page and what the app lacks) or add it to the issue it belongs to. Keep a list in the #222 comment.

### Task 6: Issue comments

- [ ] Comment on #222, #223, #224, #225, #226, #601 in NGCFells' voice with what was done and what is next; close the finished ones; give NGCFells the URLs.

## Models

Haiku for Tasks 1-2 and 4 (mechanical, with checks); Sonnet for Task 3 reviews and Task 5 reading.
