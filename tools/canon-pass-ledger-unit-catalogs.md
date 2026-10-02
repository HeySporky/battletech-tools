# Canon equipment pass: unit-domain catalogs ledger

Companion to `canon-pass-ledger.md`, for the catalogs of units the builders do not construct yet (large craft,
aerospace, Support Vehicles, ProtoMechs, battle armor). Same columns and status words: **added** (new record),
**verified**, **fixed**, **flagged** (needs a source or a decision; not changed).

Book abbreviations follow the newest printing: TM = TechManual 6th printing (2021), TO:AUE = Tactical Operations:
Advanced Units & Equipment, IO:AE = Interstellar Operations: Alternate Eras, SO = Strategic Operations.
Pages are printed pages.

## Batch 49: capital and sub-capital weapon catalogs

Two new literal-array catalogs, `src/data/capital-weapons.ts` (27 records) and `src/data/sub-capital-weapons.ts` (10 records), typed by a new `ICapitalWeapon` interface. They are **not** registered in the equipment registry, so no 'Mech or vehicle builder can offer them; a test pins that and checks that no tag collides with 'Mech equipment.

| item | catalog | status | book p. | errata | notes |
|---|---|---|---|---|---|
| NAC/10, /20, /25, /30, /35, /40 | capital-weapons | **added** (6) | TO:AUE p.143 (rules), pp.220-221 (tables), p.196 (BV) | TO:AUE v7.0: none | Both tech bases, D, 2,000 to 4,500 tons. JumpShips, WarShips, space stations, mobile structures |
| Light / Medium / Heavy N-Gauss | same | **added** (3) | TO:AUE p.145; same tables | none | E. "do not cause additional explosive damage if hit" |
| NL35, NL45, NL55 | same | **added** (3) | TO:AUE p.145 | none | D |
| Light / Medium / Heavy N-PPC | same | **added** (3) | TO:AUE p.146 | none | D |
| Killer Whale, White Shark, Barracuda, AR-10 Launcher | same | **added** (4) | TM p.210 (rules), p.342 (table), pp.292, 296 (cost), p.318 (BV) | TM v8.0: availability D-X-D, introduced 2305 (AR-10 2550), Tech Rating F -> D; all already in the printing on file | Both tech bases, E. The AR-10 fires the other three and has no values of its own |
| Kraken-T, Killer Whale-T, White Shark-T, Barracuda-T | same | **added** (4) | same | none | Inner Sphere, F |
| Screen Launcher | same | **added** | TM p.237; same tables | TM v8.0: Tech Rating F -> E (table p.342) | Inner Sphere, F; BV 160 / 20 each count toward the Defensive Battle Rating |
| Light / Medium / Heavy Mass Driver | same | **added** (3) | TO:AUE p.135; tables pp.220-221; BV p.196 | none | Inner Sphere, D, Experimental. WarShips and space stations only, +2 to hit, 30,000 to 100,000 tons |
| Light / Medium / Heavy SCC | sub-capital-weapons | **added** (3) | TO:AUE p.155; tables pp.222-223; BV p.196 | none | E. Support vehicle slots 30 / 50 / 60; one slot on DropShips and larger |
| SCL/1, SCL/2, SCL/3 | same | **added** (3) | TO:AUE p.155 | none | Support vehicle slots 20 / 26 / 32 |
| Piranha, Stingray, Swordfish, Manta Ray | same | **added** (4) | TO:AUE p.156 | none | Support vehicle slots 18 / 25 / 30 / 38 |

Conventions:

- **Damage** is stored in capital-scale points. TO:AUE prints both ("20 (2-C)"); TechManual prints only the standard-scale figure for capital missiles (Killer Whale 40), which is stored as 4.
- **Dates and availability** follow the IO:AE advancement table (p.33), the newest source: for example Naval Autocannons E-X-E-E, extinct ~2950, reintroduced 3051. Early Spaceflight is 2100. IO:AE dates the weapons by family, so TO:AUE's per-size years are not kept where they differ (NAC/20 2197, NAC/40 2202, Heavy N-Gauss 2449, NL55 2307, Light / Medium N-PPC 2358).
- **Tech base** follows IO:AE: sub-capital cannons and lasers are "All" with "Clan Intro: 3091", missiles "Clan Intro: 3073", carried as `clanDates`. TO:AUE's rules boxes still say Inner Sphere for the cannons and lasers.
- **Rules level:** 2 for the TechManual items, 3 Advanced, 4 Experimental (Mass Drivers).

Flags:

- **Ammunition units.** TO:AUE's BV table marks only the sub-capital missiles "Per shot, not per ton", so the Naval Autocannon, Naval Gauss, Mass Driver and SCC ammunition values are recorded per ton. MegaMek applies the same numbers per shot. The cost column ("Item / Ammo Cost") names no unit at all: recorded per shot, as MegaMek does; the other reading is per ton. Both units are fields on the record (`cbillsPer`, `battleValuePer`), so either can be corrected without touching the numbers.
- **Tech Rating of capital missiles, two current sources.** TechManual (table p.342, as corrected by errata v8.0) rates the capital missile launchers, the AR-10 and the tele-operated launchers D and the Screen Launcher E. The IO:AE advancement table (p.33) rates the launchers and the AR-10 E and the tele-operated launchers and Screen Launcher F. The records follow IO:AE, as the rest of this pass does for ratings and dates. Say if TechManual should win here.
- **Large-craft slot columns for capital missiles.** TechManual's table stops at DropShips (Screen Launcher: Small Craft and DropShips). JumpShip, WarShip, space station and mobile structure columns are `null`, not guessed. Strategic Operations should supply them.
- **Not yet in the catalogs:** the non-teleoperated Kraken (TM names only the Kraken-T), capital missile special munitions and nuclear warheads, Naval C3, Naval Comm-Scanner Suites, Naval Tug Adaptor, repair facilities, bay and fire-control rules. Clan-only capital items: none are printed in these tables.
- N-PPC page: TO:AUE's own table says 146; IO:AE's reference column says 145.

Regression tests: `src/data/capital-weapons.test.ts` (6 tests).
