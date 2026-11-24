import { IMechTonnage } from "./data-interfaces";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import { DEFAULT_RULES_EDITION, isEarlierRulesEdition, isInRulesEdition } from "./rules-editions";
/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
* Topps, and their respective rights holders. 
*
* This open-source utility is a non-commercial fan project designed purely for 
* tabletop gameplay assistance. Content processed by this file is not intended 
* to challenge any copyright or trademark status, and this data is explicitly 
* excluded from the software's underlying license (GNU GPLv3).
*/
export const btMechTonnages: IMechTonnage[] = [
    {
        // "Battledroids weigh between 5 and 100 tons" (BD p.23); the Second Edition's table starts at 10.
        tons: 5,
        editions: ["battledroids", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Ultralight",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 } },
    },
    {
        tons: 10,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Ultralight",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null },
    },
    {
        tons: 15,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Ultralight",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null },
    },
    {
        tons: 20,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Light",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 25,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Light",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 30,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Light",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 35,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Light",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 40,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Medium",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 45,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Medium",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 50,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Medium",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 55,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Medium",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 60,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Heavy",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 65,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Heavy",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 70,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Heavy",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 75,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Heavy",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 80,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Assault",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 85,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Assault",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 90,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Assault",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 95,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Assault",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 100,
        editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Assault",
        introducedInEdition: "battledroids",
        editionStats: { battledroids: { book: "BD", page: 23 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "compendium-rules-of-warfare": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
    },
    {
        tons: 105,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 110,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 115,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 120,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 125,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 130,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 135,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 140,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 145,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 150,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 155,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 160,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 165,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 170,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 175,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 180,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 185,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 190,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 195,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    },
    {
        tons: 200,
        editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
        type: "Colossal",
    } 
]

/*
 * Returns the min/max tonnage a given chassis type can legally be built at for a given rules level.
 *
 * - LAMs are capped at 20-55 tons (TechManual).
 * - QuadVees are capped at 20-100 tons (Tactical Operations); no Ultra-light or Superheavy QuadVees.
 * - Tripods cannot be built as Ultra-light (10-15 tons); Superheavy Tripods (105-200 tons) require Advanced+ rules.
 * - Biped and Quad chassis support the full range, but Ultra-light and Superheavy tonnages require Advanced+ rules.
 * - Superheavy 'Mechs are available only to the Inner Sphere tech base (IO:AE p.154); a Clan tech base stops at 100 tons.
 * - Custom Homebrew and Munchkin (rules levels 6 and 7) lift all of the above tonnage restrictions.
 */
export function getTonnageBoundsForMechType(mechTypeTag: string, rulesLevel: number = 2, techTag?: string, editionTag: string = DEFAULT_RULES_EDITION): { min: number; max: number } {
    // An earlier rules edition has no rules levels: its own tonnage table sets the range.
    if (isEarlierRulesEdition(editionTag)) {
        const tons = btMechTonnages.filter((option) => isInRulesEdition(option, editionTag)).map((option) => option.tons);
        const chassis = getTonnageBoundsForMechType(mechTypeTag, 3, techTag);
        // A chassis that can be built Ultralight goes as low as the edition's table does (Battledroids: 5 tons).
        const chassisMin = chassis.min <= 10 ? 0 : chassis.min;
        return { min: Math.max(chassisMin, Math.min(...tons)), max: Math.min(chassis.max, Math.max(...tons)) };
    }
    if (rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL) {
        return { min: 10, max: 200 };
    }
    if (techTag === "clan" || techTag === "mclan") {
        const bounds = getTonnageBoundsForMechType(mechTypeTag, rulesLevel);
        return { min: bounds.min, max: Math.min(bounds.max, 100) };
    }

    switch (mechTypeTag) {
        case "lam":
            return { min: 20, max: 55 };
        case "quadvee":
            return { min: 20, max: 100 };
        case "tripod":
            return rulesLevel >= 3 ? { min: 20, max: 200 } : { min: 20, max: 100 };
        case "biped":
        case "quad":
        default:
            return rulesLevel >= 3 ? { min: 10, max: 200 } : { min: 20, max: 100 };
    }
}

// Returns the list of tonnages a chassis type/rules level combination can legally select from.
export function getAvailableTonnagesForMechType(mechTypeTag: string, rulesLevel: number = 2, techTag?: string, editionTag: string = DEFAULT_RULES_EDITION): IMechTonnage[] {
    const { min, max } = getTonnageBoundsForMechType(mechTypeTag, rulesLevel, techTag, editionTag);
    return btMechTonnages.filter((option) => option.tons >= min && option.tons <= max
        && (!isEarlierRulesEdition(editionTag) || isInRulesEdition(option, editionTag)));
}
