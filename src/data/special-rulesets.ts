
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

import { RulesEditionUnitType } from "./rules-editions";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

// Special Rulesets (#324): optional and homebrew rules that change how the game plays or how units are built. They
// are chosen first in the shared settings block, so each can set the minimum edition and narrow every list below it.
// Only rules that change gameplay or construction belong here, never a single custom item or unit type.

/** The settings block's steps after Special Rulesets, in order. */
export type GameSettingStep = "edition" | "rulesLevel" | "techBase" | "era";

/** Plural names for the unit types a ruleset can take away, for its notices. */
export const UNIT_TYPE_PLURALS: Record<RulesEditionUnitType, string> = {
    mech: "BattleMechs", vehicle: "Vehicles", fighter: "Fighters", "small-craft": "Small Craft", "capital-ship": "Capital Ships",
    infantry: "Infantry", "battle-armor": "Battle Armor", protomech: "ProtoMechs", building: "Buildings",
};

export interface ISpecialRuleset {
    id: string;
    name: string;
    description: string;
    /** Where the ruleset comes from, printed on every unit built with it. */
    source: { title: string; url?: string };
    /** Edition tag; editions before it are not offered. */
    minEdition?: string;
    minRulesLevel?: number;
    /** Tech option tags (see tech-options.ts) the ruleset takes away. */
    removesTechBases?: string[];
    /** Era tags the ruleset takes away. */
    removesEras?: string[];
    /** Unit types that do not exist under the ruleset: it cannot be ticked on one, and they are not offered. */
    removesUnitTypes?: RulesEditionUnitType[];
    /** What the ruleset changes; two rulesets that change the same thing cannot both be in use. */
    changes: string[];
}

/** What both printings of Clell Flint's construction rules say, for the ruleset list. */
const FUTURE_WARS_CONSTRUCTION_DESCRIPTION = "Clell Flint's alternate rules for building two-legged 'Mechs (#172, \"Compact 'Mechs\"): "
    + "a 'Mech's critical slots go by its weight class (a light 'Mech has a 5-slot head, 6-slot arms, 7-slot legs and side torsos and an "
    + "11-slot center torso; an assault 'Mech 8, 12, 16 and 20). The head has 3 to 6 internal structure points by class and at most twice "
    + "that in armor. The cockpit is 2 tons for a light 'Mech, 3 for a medium or most heavies, 4 for a few heavies and every assault, "
    + "with its own life support; extra sensors and extra life support are a slot and half a ton each. The engine takes 4 to 10 center "
    + "torso slots by its weight and the gyro one slot a ton. Ours, not Flint's: two-legged 'Mechs of up to 100 tons only (his "
    + "four-legged rules are the Walker unit type); Battle Value and cost by the edition's rules on the design as built; the order of "
    + "the head's items; half the engine before the gyro and half after; no small, torso-mounted or interface cockpit.";

export const btSpecialRulesets: ISpecialRuleset[] = [
    // Both printings print the same rules for two-legged 'Mechs; they differ only on walkers (owner ruling 3, 2026-11-13).
    {
        id: "best-of-future-wars-construction",
        name: "Future Wars: Alternate 'Mech construction (Best of Future Wars printing)",
        description: FUTURE_WARS_CONSTRUCTION_DESCRIPTION,
        source: { title: "Clell Flint, 'Alternate Rules for Building Mechs in BattleTech', The Best of Future Wars, Volume One (1991), pp.35-36" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["mechConstruction"],
    },
    {
        id: "future-wars-11-construction",
        name: "Future Wars: Alternate 'Mech construction (Future Wars #11 printing)",
        description: FUTURE_WARS_CONSTRUCTION_DESCRIPTION,
        source: { title: "Clell Flint, 'Alternative Rules for Building Mechs in BattleTech', Future Wars #11, p.24" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["mechConstruction"],
    },
    {
        id: "sample-no-clans",
        name: "Sample: The Clans never existed (alternate universe)",
        description: "A sample alternate universe in which the Clans never formed: no Clan or Mixed tech. A placeholder until real rulesets are added.",
        source: { title: "Sample ruleset (#324)" },
        removesTechBases: ["clan", "mclan", "mis"],
        // ProtoMechs are a Clan creation: they do not exist either (user ruling 2026-10-26).
        removesUnitTypes: ["protomech"],
        changes: ["techBases"],
    },
];

export function getSpecialRulesets(): ISpecialRuleset[] {
    return btSpecialRulesets;
}

export function findSpecialRuleset(id: string): ISpecialRuleset | undefined {
    return btSpecialRulesets.find((ruleset) => ruleset.id === id);
}

/** One ruleset as a sheet credits it: an id no longer in the registry keeps its id, with a note. */
export interface IRulesetCredit {
    name: string;
    source?: { title: string; url?: string };
}

/** The rulesets a unit is built under, as its sheets, cards and TROs credit them (#324 attribution). */
export function getRulesetCredits(ids: readonly string[]): IRulesetCredit[] {
    return [...new Set(ids)].map((id) => {
        const ruleset = findSpecialRuleset(id);
        return ruleset ? { name: ruleset.name, source: ruleset.source } : { name: `${id} (ruleset no longer listed)` };
    });
}

/** "Special Rulesets: <name>, <source>[ (<url>)]; ...", or undefined when none are in use. */
export function getRulesetsAttribution(ids: readonly string[]): string | undefined {
    if (ids.length === 0) {
        return undefined;
    }
    const credits = getRulesetCredits(ids).map(({ name, source }) =>
        source ? `${name}, ${source.title}${source.url ? ` (${source.url})` : ""}` : name);
    return `Special Rulesets: ${credits.join("; ")}`;
}

/** The ticked ruleset under which `unitType` does not exist, or undefined. */
export function getRulesetRemovingUnitType(tickedIds: string[], unitType: RulesEditionUnitType): ISpecialRuleset | undefined {
    return tickedIds.map(findSpecialRuleset).find((ruleset) => !!ruleset?.removesUnitTypes?.includes(unitType));
}

/** The ticked ruleset that clashes with `candidateId` (they change the same thing), or undefined. */
export function getRulesetConflict(tickedIds: string[], candidateId: string): ISpecialRuleset | undefined {
    const candidate = findSpecialRuleset(candidateId);
    if (!candidate) {
        return undefined;
    }
    return tickedIds
        .filter((id) => id !== candidateId)
        .map(findSpecialRuleset)
        .find((ticked) => !!ticked && ticked.changes.some((change) => candidate.changes.includes(change)));
}
