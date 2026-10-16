# Rules levels by rules edition, starting with Battledroids

Date: 2026-10-15. Status: draft for review.

## Intent

Every unit creator lets the player choose a rules edition, but the Rules Level control beneath it ignores the
edition: it always lists Total Warfare's levels, and under an earlier edition the Mech Creator ignores it altogether
("rules levels do not apply", TODO.md, rules edition selector). A player building under Battledroids should see
Battledroids' own levels, get only what each level of that book allows, and never be offered construction the book
does not permit at that level.

The work goes one edition at a time. Battledroids is first and is otherwise complete, except for one apocryphal
'Mech: the SPI-5R Spider from *Game News* #3.

## Goals

1. **Step 1 order in every creator** (Mech, Vehicle, Fighter, Small Craft, Infantry, Battle Armor, ProtoMech,
   Building): Rules Edition first, then Rules Level directly beneath it, then everything else.
2. **Each edition lists its own level names.** Each name maps to one of the tool's numeric levels 0-4, so the
   existing filtering by number keeps working. Every edition also lists Apocryphal (5), Custom Homebrew (6) and
   Munchkin (7).
3. **Battledroids' levels** (BD: Basic pp.3-6, Advanced pp.7-?, Expert pp.?-25, pages to confirm from the page
   images):

   | Shown as | Maps to | What the book allows |
   | --- | --- | --- |
   | Basic Battledroids | 0 Beginners | The printed droids only, in the abstract Basic game. **Locked.** |
   | Advanced Battledroids | 1 Introductory | The printed droids on record sheets. **Editable with a warning**: editing moves the design to Expert as its minimum level. |
   | Expert Battledroids | 2 Standard | Construction: "the information needed to design and build new classes of droids" (Expert introduction). Full creator. |
   | Apocryphal | 5 | As Expert, plus the SPI-5R Spider in the droid list. |
   | Custom Homebrew | 6 | As Expert, plus custom content. |
   | Munchkin | 7 | As Custom Homebrew, plus munchkin content. |

   The 0/1/2 mapping is the builder's call, approved here. Basic is an abstract quick-start game, Advanced is
   location play with fixed designs, and Expert adds construction, critical hits and skills, which Total Warfare
   treats as Standard.
4. **Limit units to the books when construction is not allowed.** Under an edition and level with no construction
   rules, the creator's Step 1 shows a **Droid** (unit) picker instead of the chassis fields. The player chooses from
   the units that edition prints at or below the selected level, and the creator loads that design with the
   edition's stats. Construction is allowed when the edition's construction rules start at or below the selected
   level. Each edition records that level (`constructionLevel`; Battledroids: 2).
5. **The printed Battledroids droids become real designs**: the ten record listings (BD pp.16-17: STG-3R, WSP-1A,
   PXH-1K, GRF-1N, SHD-2H, RFL-3N, CRD-3R, ARC-2R, WHM-6R, MAD-3R) and the SPI-5R Spider (*Game News* #3, May 1985,
   pp.12-13, Apocryphal). Each is entered as Battledroids prints it, cited to book and page.
6. **SPI-5R Spider**, from the magazine's text layer, to be confirmed against the page image: 30 tons, GM 180 engine,
   Walking 6 / Running 9 / Jumping 8, 13 heat sinks, Armor Factor 64 (head 6, center torso 10 front / 4 rear, side
   torsos 6 / 2, arms 7, legs 7), four medium lasers (head, center torso, right arm, left arm). Its model code is not
   the canon SDR-5V, and its head-mounted laser and history belong to the magazine, hence Apocryphal.

7. **The TCI kit-back droids (Apocryphal).** FASA and Twentieth Century Imports sold single Japanese model kits
   with a printed "BATTLEDROIDS™ … © 1984 FASA Corporation" stat sheet glued to the back of the box (*Unseen: A
   History of FASA*, pdf p.63; Sarna, "TCI Model Sets"). Six sheets were read from photographs of the boxes on Sarna
   (`File:Crabgunner_Goliath_TCI.jpeg`, `File:Blockhead_Wolverine_TCI.jpeg`, `File:Soltic_Griffin_TCI.jpeg`,
   `File:TCIDougramBoxesBack.jpg`). Each is entered as printed, cited "TCI kit back (FASA 1984)" with the kit name:

   | Droid | Kit | Tons / IS | Engine | W/R/J | HS | Gyro / cockpit | Armor (printed AF) | Weapons: location, critical boxes |
   | --- | --- | --- | --- | --- | --- | --- | --- | --- |
   | GOL-1H Goliath (four-legged) | Abitate F44A Crabgunner | 80 / 8 | Pitban 320 | 4/6/0 | 13 | 4 / (not printed) | H12, CT 50/40, ST 30/27, A 20, L 20 (296) | PPC CT 3; LRM-10 RT 2; LRM-10 LT 2; 2 LRM ammo (12 packs) CT 2; 2 MG CT 2; MG ammo (200 rds) CT 1 |
   | WLV-3Nb Wolverine | Abitate T-10B Blockhead | 55 / 5.5 | Coretek 275 | 5/8/5 | 12 | 3 / 3 | H8, CT 24/8, ST 20/6, L 16, A 16 (168) | 3 SRM-2 LT 3; SRM ammo (50 racks) LT 1; AC RA 4; AC ammo (20) RT 1; ML head 1 |
   | WLV-3Nc Wolverine | Abitate T-10C Blockhead | as WLV-3Nb, every figure identical on the sheet | | | | | | |
   | GRF-2N Griffin | Soltic H8 Roundfacer | 55 / 5.5 | Coretek 275 | 5/8/6 | 13 | 3 / 3 | H7, CT 20/6, ST 20/6, A 13, L 16 (144) | PPC RA 3; LRM-10 RT 2; LRM ammo (24) RT 2 |
   | SHD-3H Shadow Hawk | Dougram | 55 / 5.5 | Coretek 275 | 5/8/3 | 12 | 3 / 3 | H (blank), CT 23/8, ST 18/6, A 16, L 16 (152) | AC LT 4; AC ammo (20) LT 1; LRM-5 RT 2; LRM ammo (24) LT 1; ML RA 1; MG head 1; MG ammo (200) LT 1 |
   | THN-8T Thunderbolt | Hasty F4X Ironfoot | 65 / 6.5 | Magna 260 | 4/6/0 | 15 | 3 / 3 | H9, CT 30/11, ST 24/6, L 29, A 20 (208) | LRM-15 LT 3; 2 LRM ammo (8 packs) RT 2; LL RA 2; "2 M. Laser" LT 3; SRM-2 RT 1; SRM ammo (50) RT 1; 2 MG RT (rear) 2; MG ammo (200) RT 1 |
   | BTL-5R BattleMaster | Soltic HT-128 Bigfoot | 85 / 8.5 | Vox 340 | 4/6/0 | 18 | 4 / 3 | H9, CT 40/11, ST 28/8, L 26, A 24 (232) | PPC RA 3; 3 SRM-2 LT 3; SRM ammo (50) LT 1; 2 ML LT 2; 2 ML RT 2; 2 MG LA 1; MG ammo (200) LA 1; ML LT (rear) 1; ML RT (rear) 1 |

   Sheet problems, to settle by the errata ruling (obvious misprint corrected with a note, otherwise as printed
   and flagged): (a) SHD-3H head armor is blank; the other locations sum to 143 against AF 152, so the head is 9
   (obvious: corrected). (b) WLV-3Nb/3Nc locations sum to 156 against AF 168 (not obvious which is wrong: as
   printed, flagged). (c) GRF-2N locations sum to 143 against AF 144 (flagged). (d) THN-8T lists "2 M. Laser" with
   3 critical boxes, the TDR-5S's three lasers (flagged; user ruling wanted). (e) BTL-5R lists 2 MG with 1
   critical box (flagged). (f) The Goliath sheet prints no cockpit line and carries its own four-legged rules ("treat
   all arm and arm critical hits as leg hits … no jumping or punching … -3 on the falling and standing table"),
   which predate the Compendium's four-legged layout. Weight is to be checked by the creator once entered; any
   over- or under-weight goes in the flags, not corrected.

   Rulings and cross-checks (user, 2026-10-16): (d) the THN-8T keeps two medium lasers as printed, with the 3
   critical boxes noted. Against the box set's own listings (BD record listings; the box's two models were the
   SHD-2H and GRF-1N, *Unseen* pdf p.63): the SHD-3H is the SHD-2H with the head SRM-2 and its ammunition replaced
   by a machine gun and 200 rounds, and the book's SHD-2H head of 9 confirms (a). The GRF-2N is the GRF-1N with two
   differences: 13 heat sinks (book: 12) and head armor 7 (book: 8). The book's head of 8 makes the 144 total, so
   (c) is an obvious misprint and the head is entered as 8 with a note; the 13 heat sinks stay as printed, flagged.
   The GRF-2N photograph is of the "Soltic H8 Round Facer" box, so it may be the kit Sarna lists as "Soltic H8-RF".

   GRF-2N weight by the edition's tables (BD pp.24-25; engine 275 = 15.5 t): the GRF-1N comes to exactly 55 tons
   (structure 5.5, engine 15.5, gyro 3, cockpit 3, 2 extra heat sinks 2, six jump jets 3, armor 144 / 16 = 9, PPC 7,
   LRM-10 5, ammunition 2). The kit's 13th heat sink makes the GRF-2N 56 tons, a ton over; dropping a point of head
   armor saves 1/16 ton. Entered as printed and flagged overweight, as the book's own STG-3R and WSP-1A are (user,
   2026-10-16: within Battledroids' printed tolerance).

   Two kit sheets have not been found. Until a photograph turns up, each is entered with the box set's own listing
   for the same 'Mech (user, 2026-10-16: best guess from the original printed data), at the Apocryphal level, marked
   `inferred` with a note that says so and what to replace:
   - **Shadow Hawk, Dougram Jakt-type kit (with LRM):** the SHD-2H as BD prints it. The MG kit (SHD-3H) is the one
     that departs from the book, so the LRM kit is taken to match it.
   - **Griffin, the other Soltic H8 kit:** the GRF-1N as BD prints it. The photographed sheet (GRF-2N) is on the
     "Soltic H8 Round Facer" box, read as Sarna's "Soltic H8-RF"; the plain "Soltic H8" kit is the inferred one.
   Model codes are not guessed: each keeps the book's code with the kit named beside it.
   The kit photographs are in `C:/repo/JBTIICRework/unsorted/TCI Battledroids kit backs (photos from Sarna)/`.
   The Scorpion and Locust are only in the 1985-86 TCI/FASA BattleTech Plastic Model Sets 1 and 2 (*Unseen* pdf
   p.65), which belong to the Second Edition pass, as does the OSR-9C Ostroc Mk II (Set 7) and the TCI Hunter.

## Non-goals

- Other editions' level names and construction levels. Each comes in its own pass, from its own book. Until then an
  edition with no level list shows Total Warfare's, as today.
- Changing Total Warfare's behavior beyond the Step 1 order. Total Warfare lists Beginners, Introductory, Standard,
  Advanced, Experimental and 5-7, as today.
- Roster and play mode changes. A printed droid loaded in the creator saves and enters rosters like any 'Mech.
- Battle Value or cost for Battledroids designs: the edition already has `noBattleValue` and `noPrices`.

## Anti-goals

- A droid list that offers anything Battledroids or *Game News* #3 does not print.
- Stats from memory, Sarna or the canon SDR-5V Spider. Every number comes from the page, and the Ollama/OCR output
  is a first pass for a person to check, never pasted into TypeScript (`astech-rules.md` 3).
- Breaking saved designs or settings: old saves and the stored `mechRulesFilter` must still load.

## Constraints

- **The rules level is one app-wide setting** (`appSettings.mechRulesFilter`), shared by every creator and not
  saved with a design. When the selected edition does not list the stored level, the control shows the lowest
  listed level above it, without overwriting the stored setting until the player changes it.
- Edition data lives in `src/data/rules-editions.ts`. The new fields are a per-edition level list (name, numeric
  level, citation) and `constructionLevel`. Absent fields mean Total Warfare's list and construction at every level.
- Step 1 uses the shared `RulesEditionSelect` (`src/ui/components/rules-edition-select.tsx`). The Rules Level
  control should be shared the same way rather than repeated in eight files.
- Domain logic goes in `src/data/` or `src/classes/`, not in the pages. Tests sit beside the source, name the rule,
  and cite the page (`astech-rules.md` 6). The existing e2e specs `mech-rules-edition.spec.ts` and
  `unit-rules-edition.spec.ts` cover Step 1 and get the new behavior.
- Sources: `C:/repo/JBTIICRework/text/Battledroids-A-Game-of-Armored-Combat-FASA-1984.txt` (and `.raw.txt`), and
  `text/Game-News-03-1985-05.txt`. Check numbers against the PDF page images in `rulebooks-legacy/` and
  `magazines/Game News/`. Ollama (`glm-ocr`, `astech-qwen3`) may do the first read of a listing to save tokens.

## Decided

- The level names are the edition's own, mapped to an equivalent numeric level (user).
- Battledroids lists only the droids its books print; custom and munchkin building only where the edition has
  construction rules (user).
- Basic locked; Advanced editable with a warning that editing moves the design to Expert as its minimum (user).
- The Spider is Apocryphal and cited to *Game News* #3 (user).
- Mapping Basic 0, Advanced 1, Expert 2, and `constructionLevel` 2 (builder's call, shown to the user above).

## Settled in the builder check (builder's calls)

- Raising the level to Expert after the Advanced warning changes the app-wide setting, as any change of the
  Rules Level control does today.
- From Apocryphal up, the droid picker stays above the chassis fields as a "start from a printed droid" option,
  since building is allowed there. It lists the Spider beside the ten book droids.
- The Spider has no Basic game statistics (*Game News* #3 prints only the record listing), so it never appears
  in the Basic game panel (`battledroids-basic-game.ts`).
- A locked Basic droid can still print its record sheet and join a roster: the Basic game's own statistics stay
  in the play panel, as today.

## Left to the builder

- **What the Advanced warning does.** It warns before the first edit. On confirmation it raises the rules level to
  Expert if it is lower; on cancel nothing changes.
- **Where the printed designs live.** A data file (for example `src/data/battledroids-mechs.ts`) of designs the
  BattleMech class can load, tagged with edition, level and source.
- **The picker.** Its exact layout, and how the Mech Creator shows that a loaded printed droid is locked (Basic):
  every later step read-only, with a note.
- **Other creators.** Their Rules Level moves under the edition and uses the shared control. Only Total Warfare and
  the Core Rulebook are selectable there today, so nothing else changes for them in this pass.
