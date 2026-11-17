
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
import { FUTURE_WARS_PLAY_SOURCES } from "./future-wars-play-rules";
import { FW_POWER_ARMOR_RULESET } from "./future-wars-power-armor";

// Special Rulesets (#324): optional and homebrew rules that change how the game plays or how units are built. They
// are chosen first in the shared settings block, so each can set the minimum edition and narrow every list below it.
// Only rules that change gameplay or construction belong here, never a single custom item or unit type.

/** The settings block's steps after Special Rulesets, in order. */
export type GameSettingStep = "edition" | "rulesLevel" | "techBase" | "era";

/** Plural names for the unit types a ruleset can take away, for its notices. */
export const UNIT_TYPE_PLURALS: Record<RulesEditionUnitType, string> = {
    mech: "BattleMechs", vehicle: "Vehicles", fighter: "Fighters", "small-craft": "Small Craft", "capital-ship": "Capital Ships",
    infantry: "Infantry", "battle-armor": "Battle Armor", protomech: "ProtoMechs", building: "Buildings", walker: "Walkers",
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
    + "the head's items; half the engine before the gyro and half after; no small, torso-mounted or interface cockpit. Also ours: "
    + "a location's slots print in tables of six, the last one short. For a critical hit, roll 1D6 for the table when there is more "
    + "than one (two tables 1-3 / 4-6, three 1-2 / 3-4 / 5-6, four 1 / 2 / 3 / 4, re-rolling a number with no table), then 1D6 for "
    + "the slot, re-rolling a number with no slot as for an empty one.";

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
    // Bill Swisher's Power Armor (#172, Power Armor plan): a suit is a small BattleMech, so it is built by the 'Mech
    // rules with these changes and cannot sit with Flint's construction rules.
    {
        id: FW_POWER_ARMOR_RULESET,
        name: "Future Wars: Power Armor",
        description: "Bill Swisher's Power Armor, \"the poor man's BattleMech\": suits of 5, 10 or 15 tons, built as two-legged 'Mechs with "
            + "fewer critical slots (six a location, the center torso full: 3 free per arm, 6 per side torso, 2 per leg). Upper and lower arm "
            + "actuators are required. No cockpit: a half-ton waldo system (50,000 C-bills), the pilot in head slots 3-4 and center torso "
            + "slots 11-12 as the Future Wars #14 sample sheets show. A 5-ton suit has no gyro, internal structure H1 CT3 ST2 A1 L1, "
            + "shielding of half the engine's weight with a fusion engine, and only flamers, machine guns and small lasers. "
            + "No weapons in the head or center torso. Ours, not Swisher's: no other tonnage; head armor at most twice head structure at "
            + "every weight; the later variants of the 5-ton weapons (ER, pulse, light and heavy machine guns) are refused; shielding "
            + "rounded up to the half ton.",
        source: { title: "Bill Swisher, 'Power Armor: The Poor Man's Battlemech', Future Wars #14 (1989), p.39; reprinted in The Best of Future Wars, Volume One (1991), pp.14-16 (rules read from the reprint: the library's scan of #14 lacks pp.39-42)" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["mechConstruction"],
    },
    // The fanzine's optional play rules (#172, Best of Future Wars plan Chunk D). Each changes one thing no other ruleset
    // does, so all five may be used together; the rules summaries are in future-wars-play-rules.ts.
    {
        id: "fw-opportunity-fire",
        name: "Future Wars: Opportunity Fire",
        description: "A 'Mech may shoot one non-missile weapon at an enemy during the Movement Phase as it crosses the firer's line of sight, "
            + "at 6 / 8 / 10 to hit; its other weapons then fire at +1.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-opportunity-fire"] },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["firePhase"],
    },
    {
        id: "fw-strategic-movement",
        name: "Future Wars: Strategic Movement",
        description: "On more than four map sheets, a unit out of the fight may move at double speed, for extra heat and no firing; "
            + "it stops the moment it is attacked.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-strategic-movement"] },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["movementModes"],
    },
    {
        id: "fw-morale",
        name: "Future Wars: Morale",
        description: "Units rated Militia to Crack check morale when hurt, and may carry on, become disorganized, break or rout; "
            + "'Mechs, vehicles and infantry each have their own tables.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-morale"] },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["morale"],
    },
    {
        id: "fw-weapon-malfunctions",
        name: "Future Wars: Weapon Malfunctions",
        description: "A to-hit roll of 2 misses, and flamers, missiles, autocannons and lasers then roll for a jam, a damaged sight, "
            + "extra heat or worse.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-weapon-malfunctions"] },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["weaponFailure"],
    },
    {
        id: "fw-long-range-wars",
        name: "Future Wars: The Long Range Wars",
        description: "Two range bands past long: extended (twice long, to-hit 10) and extreme (twice extended, to-hit 13), with ranging "
            + "on a slow target and an eight-sided-dice option.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-long-range-wars"] },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["weaponRanges"],
    },
    {
        id: "tandem-charge-srm-house-rule",
        name: "House rule: Tandem Charge SRMs (u/Magical_Savior)",
        description: "An alternate rule for the existing Tandem-Charge SRM ammunition, which its author finds far too strong for its Battle Value. "
            + "A ton holds half the rounds, rounded up. Each attack gets one free critical check, as armor-piercing rounds do, by launcher size: "
            + "roll 2D6 once, at the first location hit, for each launcher; a critical hit on a 12 for a launcher of 2 or 3 tubes, an 11 for 4 or 5, "
            + "a 10 for 6 or 7, and a 9 for the MML-9. Against vehicles and battle armor, which are critically hit automatically, one critical hit comes "
            + "for every 3 missiles, as with Infernos. Against Hardened armor and Ferro-Lamellor armor the rounds get no critical check. "
            + "Inspired by: u/Magical_Savior. Ours, not in the post: the launcher sizes are read from its grouped lines (size /2 (3), /4 (5), /6 (7)) as 2-3, 4-5 and 6-7 tubes, "
            + "and the rule is recorded as text only, so a ton still holds the ammunition's printed rounds in the builder.",
        source: { title: "u/Magical_Savior, 'Tandem Charge SRM - House Rules', r/battletech", url: "https://www.reddit.com/r/battletech/comments/1jamkvn/" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["tandemChargeSrm"],
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
