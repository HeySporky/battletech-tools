import { IMechTonnage } from "./data-interfaces";
/*
 * The data here is/may be copyrighted and NOT included in the GPLv3 license.
 */
export const btMechTonnages: IMechTonnage[] = [
    {
        tons: 10,
        type: "Ultralight",
    },
    {
        tons: 15,
        type: "Ultralight",
    },
    {
        tons: 20,
        type: "Light",
    },
    {
        tons: 25,
        type: "Light",
    },
    {
        tons: 30,
        type: "Light",
    },
    {
        tons: 35,
        type: "Light",
    },
    {
        tons: 40,
        type: "Medium",
    },
    {
        tons: 45,
        type: "Medium",
    },
    {
        tons: 50,
        type: "Medium",
    },
    {
        tons: 55,
        type: "Medium",
    },
    {
        tons: 60,
        type: "Heavy",
    },
    {
        tons: 65,
        type: "Heavy",
    },
    {
        tons: 70,
        type: "Heavy",
    },
    {
        tons: 75,
        type: "Heavy",
    },
    {
        tons: 80,
        type: "Assault",
    },
    {
        tons: 85,
        type: "Assault",
    },
    {
        tons: 90,
        type: "Assault",
    },
    {
        tons: 95,
        type: "Assault",
    },
    {
        tons: 100,
        type: "Assault",
    },
    {
        tons: 105,
        type: "Colossal",
    },
    {
        tons: 110,
        type: "Colossal",
    },
    {
        tons: 115,
        type: "Colossal",
    },
    {
        tons: 120,
        type: "Colossal",
    },
    {
        tons: 125,
        type: "Colossal",
    },
    {
        tons: 130,
        type: "Colossal",
    },
    {
        tons: 135,
        type: "Colossal",
    },
    {
        tons: 140,
        type: "Colossal",
    },
    {
        tons: 145,
        type: "Colossal",
    },
    {
        tons: 150,
        type: "Colossal",
    },
    {
        tons: 155,
        type: "Colossal",
    },
    {
        tons: 160,
        type: "Colossal",
    },
    {
        tons: 165,
        type: "Colossal",
    },
    {
        tons: 170,
        type: "Colossal",
    },
    {
        tons: 175,
        type: "Colossal",
    },
    {
        tons: 180,
        type: "Colossal",
    },
    {
        tons: 185,
        type: "Colossal",
    },
    {
        tons: 190,
        type: "Colossal",
    },
    {
        tons: 195,
        type: "Colossal",
    },
    {
        tons: 200,
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
 * - Custom Homebrew (rules level 5) lifts all of the above tonnage restrictions.
 */
export function getTonnageBoundsForMechType(mechTypeTag: string, rulesLevel: number = 2): { min: number; max: number } {
    if (rulesLevel === 5) {
        return { min: 10, max: 200 };
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
export function getAvailableTonnagesForMechType(mechTypeTag: string, rulesLevel: number = 2): IMechTonnage[] {
    const { min, max } = getTonnageBoundsForMechType(mechTypeTag, rulesLevel);
    return btMechTonnages.filter((option) => option.tons >= min && option.tons <= max);
}
