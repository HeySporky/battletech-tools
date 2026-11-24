# Campaign survey (Task 1 of the campaign play plan)

Date 2026-11-19. Read from the ResourceLibrary text extracts (contents pages and chapter openings). Page numbers are
the books' printed pages. **Every figure is re-read from the page image when its edition is built** (OCR rule); this
ledger is the map, not the data.

## What each book tracks

| Book | Kind | Money | Time step | What it runs (printed pages) |
|---|---|---|---|---|
| BattleForce (FASA 1987) | planet | Victory Points (buy reinforcements) | campaign turn | Strategic Map of sectors, Battlegroups, Regimental Battlegroup (repairs, VP if lost), recon, one sector a turn, searches, contact, battles, salvage counters repair lances, experience rolls, VP, reinforcements (pp.61-67) |
| Mercenary's Handbook (FASA 1616, 1987; FanPro reprint 2005) | unit | C-bills | month | expenses, maintenance and refits (p.13), support (p.27), contracts: command rights, transport, salvage rights (pp.20, 41-43), contract form, Mercenaries Guild. Scan extract is OCR only: use the 2005 reprint's text, compare printings at build |
| BattleTech Compendium (FASA 1640, 1990) | unit (light) | C-bills | battle | Prizes, Repairs and Scavenging (p.61); costs (pp.128-131) |
| Mercenary's Handbook 3055 (FASA 1670, 1993) | unit | C-bills | month | support units (p.15), contract requirements (p.72), support templates, transport (p.80), maintenance requirements (p.86), repairs, limits, repair kits (pp.93-95), contracts, payment, support, transport, salvage rights (pp.99-108) |
| BattleForce 2 (FASA 1703, 1997) | planet | Victory | game turn | Planetary Assault: JumpShips, DropShips (pp.71-72), default and seized control (p.78), supply, convoys, supply in space (p.79), planetary movement, recon, orbit, deep space (pp.80-81), combat drops, victory, damage (pp.84-87), scenarios (p.88), Appendix IV Campaigns (p.106), BattleTech / BattleSpace conversion (pp.100, 103) |
| Objective Raids (FASA 1665, 1992) | planet data | | | Conducting Raids (p.7), Planetfall and pirate points (p.8), border worlds listed by military district with garrisons and targets (pp.~10-80) |
| Field Manual: Mercenaries Revised (FanPro 10977, 2005) | unit | C-bills | month | employment and contracts (pp.19-28), force creation (p.137), payroll, equipment and personnel support (p.149), Mercenary Rating (p.153), contract offers, negotiations, terms, total payment, transportation, maintenance and logistics, breach (pp.155-179) |
| Chaos Campaign (CGL 2008; rulebook CAT35600, 2009) | unit | Support Points (warchest); conversion to C-bills printed | track | SP Activity Cost Tables (purchase, rearm, hire, repair), skill advancement, technology rating modifier, aftermath |
| Strategic Operations (CGL 2011 and errata to 2024) | travel + unit | C-bills | hour / day | jump range "approximately 30 light years" (jump diagrams), flight and transit times, interplanetary flight times (pp.68-69), hyperspace travel, jump points (p.86), recharge; maintenance / repair cycle, unit quality, support personnel, maintenance, mothballs, repair and replacement, diagnosis, experience, salvage (pp.166-192) |
| Objectives: CC, DC, FS (2011), FWL, LA, Periphery (2012), Clans (2013) | planet data | | | per world: industrial sites, main products, position in system; "using planetary" conditions for campaigns |
| Campaign Operations (CGL 2016, 2021, 2023; errata 2024) | unit (+ formations) | C-bills | month | force creation stages, procure equipment, support personnel, operating expenses, peacetime costs (pp.12-29), reputation (pp.32-33), hiring and campaigns: contract offers, base payment, reputation factor, transport, support, final payment, salvage rights, wartime costs, breaches and mission failure (pp.38-47), maintenance (p.52), Chaos Campaign conversions (p.53), formations (p.60). Compare printings at build |
| Interstellar Operations: BattleForce (CGL 2021) | planet + interstellar | Resource Points | turn | Strategic BattleForce (p.160), morale, salvage (p.180), hyperspace travel (p.249), Inner Sphere at War (p.274): game setup, Resource Points, banking (pp.281-282) |
| BattleTech: Mercenaries (CGL 2025 box) | unit | Support Points (warchest) | track | Asset and Strike cards, Battle Value integration (p.16), contracts, campaign flowchart, negotiating (pp.19-21), mission brief, tracks, salvage (p.26), time between tracks, formation training, SP Activity Cost Table, warchest debt (pp.29-30), breaking contract (p.31) |
| BattleTech: Aces (already built) | unit | Support Points | sortie | in the app (`aces-campaign.ts`) |
| Future Wars #5 / Best of FW (Barents) | planet (alternate) | C-bills | quarter | Economics (merged ruleset) |
| Future Wars #16 (Reese) | planet (alternate) | | | Planetary Assault Rules pp.14-25 |

Not campaign systems: Interstellar Operations: Alternate Eras (construction, costs). Fan systems in the library (DFA,
Chaos Campaign fan variants, Outworlds Wastes) are left out unless NGCFells asks.

## What the core has to carry

- **Money units:** C-bills, Support Points (Chaos, Mercenaries, Aces), Victory Points (BattleForce), Resource Points
  (Inner Sphere at War). Currency per edition, as planned.
- **Time steps:** month, track, sortie, campaign turn, game turn, plus hour/day for travel. Proposal: `CampaignTimeStep
  = "month" | "turn" | "track" | "sortie"`; travel time is a duration in days logged against the step, not a step.
- **Planet layer:** BattleForce's sectors and BattleForce 2's areas with control both fit `ICampaignArea`
  (`controllerSideId`); BattleForce 2 needs a "seized vs default control" flag; Inner Sphere at War works on systems,
  which the star catalog covers.

## Proposed hook list for `ICampaignEdition` (for NGCFells's check-in)

All optional; an edition implements only what its book prints; the screens show only the steps it has.

| Hook | Signature | Used by |
|---|---|---|
| `onStep` | `(campaign) => void` | upkeep, payroll, maintenance, payday (MH, FM:M, CamOps, Economics) |
| `afterBattle` | `(campaign, result: ICampaignBattleResult) => void` | salvage, experience, Victory/Resource Points (all) |
| `repairCost` | `(campaign, unit, damage) => { amount: number; currency: string; days?: number }` | MH 3055, SO, CamOps, Chaos, Mercenaries, BattleForce (salvage counters) |
| `purchaseCost` | `(campaign, unit) => { amount: number; currency: string }` | Chaos / Mercenaries SP tables, BattleForce reinforcements; C-bill editions use the unit's own cost |
| `contractOffer` / `contractPay` | `(campaign, terms) => ICampaignContract` / `(campaign, contract) => ICampaignLedgerEntry[]` | MH, MH 3055, FM:M, CamOps, Mercenaries |
| `rating` | `(campaign) => { value: number | string; label: string }` | FM:M Mercenary Rating, CamOps Reputation |
| `supply` | `(campaign) => void` | BattleForce 2, Inner Sphere at War |
| `control` | `(campaign, area, result) => void` | BattleForce 2 (default / seized), Inner Sphere at War |
| `travelTime` | `(campaign, from, to) => { days: number; jumps: number }` | Strategic Operations (transit by star type, recharge), CamOps |

`ICampaignBattleResult`: `{ areaId?: string; sides: { sideId: string; size: FightSize; losses: string[] }[]; heldBySideId: string | null }`.

## Objective Raids and Objectives: proposal

They hold, per world and year: garrisons (Objective Raids, 1992, border worlds of 3054) and factories with what they
make and where in the system (Objectives, 2011-13). Proposal:
1. The star catalog gains `sites` per system (factory name, products, position in system, book and page) and
   `garrisons` per date, read from these books (our own books, so no verification step needed beyond the OCR check).
2. The planet page offers "Seed dots from Objectives": each factory becomes a manufacturing dot (heavy if it makes
   'Mechs, vehicles or ships, light otherwise; NGCFells's call) in a new area named after the site. The GM can edit.
3. Objective Raids' raid and pirate-point rules go in the survey of the planet editions plan, not here.

## Corrections noted (ResourceLibrary, to apply when the other agent is done)

- `future-wars-05-Qyhm8x.txt` pp.5-6 (Economics): OCR unreadable; transcribe from the page image.
- Mercenary's Handbook 1987 and 3055 `.txt` extracts are empty (OCR in `.ocr.txt` only).
