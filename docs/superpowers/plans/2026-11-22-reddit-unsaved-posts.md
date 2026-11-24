# Reddit Intake Waiting on Thread Text (#262, #268, #269, #277-#279, #281-#288, #290-#297)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native). Nothing here starts until an issue's thread text is saved. Each issue then runs through the chunk protocol of the plan it is routed to below.

**Goal:** Twenty-two r/battletech items are seen by title only. Reddit refuses automated fetching, and the standing rule is not to work around it, so each waits until NGCFells saves the thread into `C:/repo/ResourceLibrary/scrapes/reddit/<post id>.txt` or pastes it on the issue (as was done for #248, #252, #255-#261, #271-#275, #289 on 2026-11-20). This plan says where each one goes once it has text, so no further planning round is needed.

## What is needed for each

The post text, its comment thread (the intake rulings use commenters' fixes), and any images that carry stats (record sheets, tables). Save images beside the text as `<post id>-<n>.png`.

## Routing once saved

| Issue | Item | Post id | Goes to | Level by the intake rulings |
|---|---|---|---|---|
| #262 | One-shot Lasers (related to #243) | 1x9f0s6 | `2026-11-22-reddit-homebrew-equipment-round-2.md`, chunk 1 with the X-ray Laser | Custom Homebrew, or Munchkin if joke |
| #268 | Autocannon balance rework | 1ul9gt9 | `2026-11-22-homebrew-rules-designs-and-sources.md`, chunk 2 | Custom Homebrew rule switch |
| #269 | House rules and new tech ideas (balancing thread) | 1e2vcdg | same, chunk 1; each tech idea to the equipment round | Custom Homebrew |
| #277 | Improved Cluster Hits Table | sr19e5 | same, chunk 2 | Custom Homebrew rule switch |
| #278 | Machine Guns house rule | thado6 | same, chunk 2 | Custom Homebrew rule switch |
| #279 | Wind, Fire and Smoke | 1jykion | same, chunk 2 (beside the canon TO:AR weather and fire rules, which keep their level) | Custom Homebrew rule switch |
| #281 | Triga Battle Armour Transport (5 t wheeled) | 1vgemmv | same, chunk 5 (Support Vehicle creator) | its equipment's level |
| #282 | Goliath GOL-9H2 "Aquarius" | 1vc2r3s | same, chunk 5 | its equipment's level |
| #283 | Arthopleura Combat Vehicle (trailer) | 1q04per | same, chunk 5 (vehicle trailer rules) | its equipment's level |
| #284 | Eruptor ERP-01 | 1jujavk | same, chunk 5 | its equipment's level |
| #285 | Rowsdower superheavy tripod OmniMech | 1drtvkr | same, chunk 5 (superheavy tripod: already built) | its equipment's level |
| #286 | Orca OC-1T "Orca Tripod" | 1najagq | same, chunk 5 | its equipment's level |
| #287 | Tiger Moth Infiltrator LAM | 1rbxif1 | same, chunk 5 (LAM creator) | its equipment's level |
| #288 | The Crab (unofficial 'Mech to tabletop) | sro01l | same, chunk 5 | its equipment's level |
| #290 | OpFor Command: a solo opponent | 1v3dyq8 | a play-aid chunk: what the app can take (an automated opponent in Game Management, beside the Aces engine `src/classes/aces-engine.ts`) | content credited; any rule ours at 6 |
| #291 | Brym's OpFor (AS solo/co-op) | yxyz5c | play-aid chunk, as #290 | as #290 |
| #292 | Board game bot rules for an OpFor | 1v4p6id | play-aid chunk, as #290 | as #290 |
| #293 | Free campaign engine | 1wklfhe | play-aid chunk: Game Management campaigns (`src/classes/campaign/`) | as #290 |
| #294 | Lance Builder in Google Sheets | 1kdjikh | play-aid chunk: compare with the roster; take any feature the roster lacks | feature only |
| #295 | Instant Action Version 4 (scenario pack) | 1f1yf7b | play-aid chunk: scenarios in match play | content credited |
| #296 | Custom Missions for CBT | 13ant5x | play-aid chunk: scenarios in match play | content credited |
| #297 | Lego custom 'Mech with its own record sheet | 1w0ov1x | `2026-11-22-homebrew-rules-designs-and-sources.md`, chunk 5 | its equipment's level |

The play-aid chunk, when its first issue has text: read each tool or pack, write in the ledger `.superpowers/sdd/2026-11-22-play-aids/progress.md` what the app can take (a feature, a scenario, a table), with the author's licence and credit; for each take, failing test, implement, PASS, commit `Play aid: <item> from u/<poster> (#<n>)`. Same checklist as the other homebrew plans: records, construction, sheet, play, Alpha Strike (ours at 6-7 for any rule), TRO, credits, news, review, check, deploy, issue comment.

## OWNER CALLS

1. **Saving the threads.** Recommended: paste each thread into its issue as was done on 2026-11-20 (fastest), or save it into `scrapes/reddit/`; either unblocks the issue.

## Commit messages

Plain, first person, no Co-Authored-By or Generated-with line.
