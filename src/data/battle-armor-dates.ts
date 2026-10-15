/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
 * All official lore, trademarks, and intellectual property belong strictly to
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders.
 * Any original, fan-made content or custom homebrew data processed by this tool
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for
 * tabletop gameplay assistance. Content processed by this file is not intended
 * to challenge any copyright or trademark status, and this data is explicitly
 * excluded from the software's underlying license (GNU GPLv3).
 */

import { BattleArmorTechBase, BattleArmorWeightClass } from "./battle-armor-construction";
import { IBattleArmorDates } from "./battle-armor-equipment";

// When battle armor chassis, manipulators, motive systems and mounts entered service: the Universal Technology
// Advancement Table, "Battle Armor and Exoskeletons", "Battle Armor Tech" and "Battle Armor Weapons" (IO:AE
// pp.45-47). The Production date goes to the technology base that built the item first, the "IS Intro" or "Clan
// Intro" date to the other. Circa dates are entered as the year.

type ByTechBase = Record<BattleArmorTechBase, IBattleArmorDates>;
const both = (dates: IBattleArmorDates): ByTechBase => ({ is: dates, clan: dates });

/** The exoskeleton row is used for the PA(L) / Exoskeleton class: it has a prototype date and no production date. */
export const battleArmorChassisDates: Record<BattleArmorWeightClass, ByTechBase> = {
    "pa-l": both({ introduced: null, prototype: 2100 }),
    light: { clan: { introduced: 2870, prototype: 2865 }, is: { introduced: 3050 } },
    medium: { clan: { introduced: 2868, prototype: 2840 }, is: { introduced: 3052 } },
    heavy: { clan: { introduced: 2875, prototype: 2867 }, is: { introduced: 3050 } },
    assault: { clan: { introduced: 2877, prototype: 2870 }, is: { introduced: 3058 } },
};

const CLAW: ByTechBase = { clan: { introduced: 2868, prototype: 2865 }, is: { introduced: 3050 } };
const MAGNETS: ByTechBase = { is: { introduced: 3055, prototype: 3053 }, clan: { introduced: 3058 } };
const VIBRO: ByTechBase = { is: { introduced: 3054, prototype: 3053 }, clan: { introduced: 3062 } };

export const battleArmorManipulatorDates: Record<string, ByTechBase> = {
    "armored-glove": both({ introduced: "ES" }),
    basic: both({ introduced: 2110 }),
    "basic-mine-clearance": { is: { introduced: 3057, prototype: 3055 }, clan: { introduced: 3063 } },
    "battle-claw": CLAW,
    "battle-claw-magnets": MAGNETS,
    "battle-claw-vibro": VIBRO,
    "cargo-lifter": both({ introduced: 2110 }),
    "heavy-battle-claw": CLAW,
    "heavy-battle-claw-magnets": MAGNETS,
    "heavy-battle-claw-vibro": VIBRO,
    "industrial-drill": both({ introduced: "ES" }),
    "salvage-arm": both({ introduced: 2415, prototype: 2410 }),
};

export const battleArmorFeatureDates = {
    jump: both({ introduced: "ES" }),
    umu: both({ introduced: 3059, prototype: 2840 }),
    vtol: both({ introduced: 3060, prototype: 3052 }),
    adaptor: { is: { introduced: 3058, prototype: 3052 }, clan: { introduced: 3061 } } as ByTechBase,
    apMount: { clan: { introduced: 2868 }, is: { introduced: 3050 } } as ByTechBase,
    squadSupport: { is: { introduced: 3056, prototype: 3052 }, clan: { introduced: 3058 } } as ByTechBase,
    detachableMissilePack: { clan: { introduced: 2885, prototype: 2870 }, is: { introduced: 3051 } } as ByTechBase,
    detachableWeaponPack: { clan: { introduced: 3072, prototype: 3070 }, is: { introduced: 3073 } } as ByTechBase,
};
