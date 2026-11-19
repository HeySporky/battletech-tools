
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
import { FW_DROPSHIP_RULESET_IDS, FW_DROPSHIP_SOURCES } from "./future-wars-dropships";

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

/** The Special Rulesets window's groups. */
export type RulesetCategory = "construction" | "play" | "campaign" | "setting";

/** The window's groups, in the order it shows them. */
export const RULESET_CATEGORIES: { id: RulesetCategory; label: string }[] = [
    { id: "construction", label: "Construction" },
    { id: "play", label: "Play" },
    { id: "campaign", label: "Campaign & Economics" },
    { id: "setting", label: "Setting" },
];

/** Each `changes` key in words, for "Clashes with X (both change <label>)". */
export const CHANGE_LABELS: Record<string, string> = {
    mechConstruction: "'Mech construction",
    firePhase: "the fire phase",
    movementModes: "movement modes",
    morale: "morale",
    weaponFailure: "weapon failures",
    weaponRanges: "weapon ranges",
    futureWarsEquipment: "Future Wars equipment rules",
    tandemChargeSrm: "Tandem-Charge SRM ammunition",
    dropshipConstruction: "DropShip construction",
    techBases: "the tech bases",
};

export interface ISpecialRuleset {
    id: string;
    name: string;
    /** One line, at most 120 characters, our words: the window's row text. */
    summary: string;
    description: string;
    category: RulesetCategory;
    /**
     * Where the ruleset comes from, printed on every unit built with it. `publication` feeds the window's source filter,
     * `tag` is the short label on its row (e.g. "FW #14"), `author` the writer when known.
     */
    source: { title: string; url?: string; publication: string; tag: string; author?: string };
    /** Rulesets that cannot be used with this one, beyond a shared `changes` key; it works in both directions. */
    excludes?: string[];
    /** Rulesets that must be ticked before this one. */
    requires?: string[];
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
    + "torso slots by its weight and the gyro one slot a ton. NGCFells's rulings, not Flint's: two-legged 'Mechs of up to 100 tons only (his "
    + "four-legged rules are the Walker unit type); Battle Value and cost by the edition's rules on the design as built; the order of "
    + "the head's items; half the engine before the gyro and half after; no small, torso-mounted or interface cockpit. Also NGCFells's: "
    + "a location's slots print in tables of six, the last one short. For a critical hit, roll 1D6 for the table when there is more "
    + "than one (two tables 1-3 / 4-6, three 1-2 / 3-4 / 5-6, four 1 / 2 / 3 / 4, re-rolling a number with no table), then 1D6 for "
    + "the slot, re-rolling a number with no slot as for an empty one.";

export const btSpecialRulesets: ISpecialRuleset[] = [
    // Both printings print the same rules for two-legged 'Mechs; they differ only on walkers (NGCFells's ruling 3, 2026-11-13).
    {
        id: "best-of-future-wars-construction",
        summary: "Clell Flint's 'Mech building: critical slots by weight class, cockpit by weight, engine and gyro slots by weight.",
        category: "construction",
        name: "Future Wars: Alternate 'Mech construction (Best of Future Wars printing)",
        description: FUTURE_WARS_CONSTRUCTION_DESCRIPTION,
        source: { title: "Clell Flint, 'Alternate Rules for Building Mechs in BattleTech', The Best of Future Wars, Volume One (1991), pp.35-36", publication: "Future Wars", tag: "Best of FW", author: "Clell Flint" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["mechConstruction"],
    },
    {
        id: "future-wars-11-construction",
        summary: "Clell Flint's 'Mech building: critical slots by weight class, cockpit by weight, engine and gyro slots by weight.",
        category: "construction",
        name: "Future Wars: Alternate 'Mech construction (Future Wars #11 printing)",
        description: FUTURE_WARS_CONSTRUCTION_DESCRIPTION,
        source: { title: "Clell Flint, 'Alternative Rules for Building Mechs in BattleTech', Future Wars #11 (1989), p.24", publication: "Future Wars", tag: "FW #11", author: "Clell Flint" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["mechConstruction"],
    },
    // Bill Swisher's Power Armor (#172, Power Armor plan): a suit is a small BattleMech, so it is built by the 'Mech
    // rules with these changes and cannot sit with Flint's construction rules.
    {
        id: FW_POWER_ARMOR_RULESET,
        summary: "Build 5, 10 or 15-ton suits as small two-legged 'Mechs, piloted through a waldo instead of a cockpit.",
        category: "construction",
        name: "Future Wars: Power Armor",
        description: "Bill Swisher's Power Armor, \"the poor man's BattleMech\": suits of 5, 10 or 15 tons, built as two-legged 'Mechs with "
            + "fewer critical slots (six a location, the center torso full: 3 free per arm, 6 per side torso, 2 per leg). Upper and lower arm "
            + "actuators are required. No cockpit: a half-ton waldo system (50,000 C-bills), the pilot in head slots 3-4 and center torso "
            + "slots 11-12 as the Future Wars #14 sample sheets show. A 5-ton suit has no gyro, internal structure H1 CT3 ST2 A1 L1, "
            + "shielding of half the engine's weight with a fusion engine, and only flamers, machine guns and small lasers. "
            + "No weapons in the head or center torso. NGCFells's rulings, not Swisher's: no other tonnage; head armor at most twice head structure at "
            + "every weight; the later variants of the 5-ton weapons (ER, pulse, light and heavy machine guns) are refused; shielding "
            + "rounded up to the half ton. "
            + "Dates from the article's history: prototype 2963 (a Tharkan research project), introduced 3027 (Defiance Industries, Hesperus II). "
            + "Battle Value and cost by the edition's rules on the suit as built; NGCFells's ruling: the +1 to hit a suit counts as +1 TMM. Alpha Strike (NGCFells's): "
            + "a BattleMech card of Size 1 with the PWA special ability. More in TRO - JBT: Power Armor.",
        source: { title: "Bill Swisher, 'Power Armor: The Poor Man's Battlemech', Future Wars #14 (1989), p.39; reprinted in The Best of Future Wars, Volume One (1991), pp.14-16 (rules read from the reprint: the library's scan of #14 lacks pp.39-42)", publication: "Future Wars", tag: "FW #14", author: "Bill Swisher" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["mechConstruction"],
    },
    // The fanzine's optional play rules (#172, Best of Future Wars plan Chunk D). Each changes one thing no other ruleset
    // does, so all five may be used together; the rules summaries are in future-wars-play-rules.ts.
    {
        id: "fw-opportunity-fire",
        summary: "Shoot one non-missile weapon during the Movement Phase as an enemy crosses your line of sight.",
        category: "play",
        name: "Future Wars: Opportunity Fire",
        description: "A 'Mech may shoot one non-missile weapon at an enemy during the Movement Phase as it crosses the firer's line of sight, "
            + "at 6 / 8 / 10 to hit; its other weapons then fire at +1.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-opportunity-fire"], publication: "Future Wars", tag: "Best of FW", author: "Charles J. Tomaszewski" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["firePhase"],
    },
    {
        id: "fw-strategic-movement",
        summary: "Units out of the fight move at double speed on big maps, for extra heat and no firing.",
        category: "play",
        name: "Future Wars: Strategic Movement",
        description: "On more than four map sheets, a unit out of the fight may move at double speed, for extra heat and no firing; "
            + "it stops the moment it is attacked.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-strategic-movement"], publication: "Future Wars", tag: "Best of FW", author: "Herb Barents" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["movementModes"],
    },
    {
        id: "fw-morale",
        summary: "Hurt units of Militia to Crack quality check morale and may become disorganized, break or rout.",
        category: "play",
        name: "Future Wars: Morale (Best of Future Wars printing)",
        description: "Units rated Militia to Crack check morale when hurt, and may carry on, become disorganized, break or rout; "
            + "'Mechs, vehicles and infantry each have their own tables.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-morale"], publication: "Future Wars", tag: "Best of FW", author: "Herb Barents" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["morale"],
    },
    // The original printings (#172, printing alternates; NGCFells 2026-11-17): where the 1991 reprint changed a rule,
    // the original is offered too. Each shares its reprint twin's change, so the two refuse each other.
    {
        id: "fw-morale-17",
        summary: "Morale as Future Wars #17 first printed it: shaken units check at a higher number, and routs last until off the board.",
        category: "play",
        name: "Future Wars: Morale (Future Wars #17 printing)",
        description: "The 1990 original of the morale rules: a disorganized, broken or routed unit needs 1, 2 or 3 more to pass; "
            + "a 'Mech checks on every hit once three locations have internal damage; a rout lasts until the unit is off the "
            + "board; a 13 raises the unit 1 on the morale scale.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-morale-17"], publication: "Future Wars", tag: "FW #17", author: "Herb Barents" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["morale"],
    },
    {
        id: "fw-weapon-malfunctions",
        summary: "A to-hit roll of 2 misses, and the weapon may then jam, lose its sight or overheat.",
        category: "play",
        name: "Future Wars: Weapon Malfunctions (Best of Future Wars printing)",
        description: "A to-hit roll of 2 misses, and flamers, missiles, autocannons and lasers then roll for a jam, a damaged sight, "
            + "extra heat or worse.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-weapon-malfunctions"], publication: "Future Wars", tag: "Best of FW", author: "Karl Bruanning and Herb Barents" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["weaponFailure"],
    },
    {
        id: "fw-weapon-malfunctions-9",
        summary: "Weapon Malfunctions as Future Wars #9 first printed them, with its own flamer, autocannon and laser rows.",
        category: "play",
        name: "Future Wars: Weapon Malfunctions (Future Wars #9 printing)",
        description: "The 1988 original of the malfunction tables: a to-hit roll of 2 misses and rolls on the weapon's table; a "
            + "flamer has no row 5, a jammed autocannon on 11 can still fire, and a laser burned out on 17 is gone for good.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-weapon-malfunctions-9"], publication: "Future Wars", tag: "FW #9", author: "Karl Bruanning and Herb Barents" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["weaponFailure"],
    },
    {
        id: "fw-long-range-wars",
        summary: "Two range bands past long, extended and extreme, with ranging on slow targets.",
        category: "play",
        name: "Future Wars: The Long Range Wars (Best of Future Wars printing)",
        description: "Two range bands past long: extended (twice long, to-hit 10) and extreme (twice extended, to-hit 13), with ranging "
            + "on a slow target and an eight-sided-dice option.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-long-range-wars"], publication: "Future Wars", tag: "Best of FW", author: "Herb Barents" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["weaponRanges"],
    },
    {
        id: "fw-long-range-wars-12",
        summary: "The Long Range Wars as FW #12 first printed it: ranging on any target, and 2 or 3 malfunctions on eight-sided dice.",
        category: "play",
        name: "Future Wars: The Long Range Wars (Future Wars #12 printing)",
        description: "The 1989 original: extended and extreme range bands (to-hit 10 and 13), ranging on any target the same 'Mech "
            + "keeps firing at, and an eight-sided-dice option where a to-hit roll of 2 or 3 malfunctions.",
        source: { title: FUTURE_WARS_PLAY_SOURCES["fw-long-range-wars-12"], publication: "Future Wars", tag: "FW #12", author: "Herb Barents" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["weaponRanges"],
    },
    {
        id: "fw-equipment-first-printings",
        summary: "Future Wars equipment as the original issues printed it: Power Booster, Inferno Gauss, LR Flamer, PDS and Swing Fire.",
        category: "play",
        name: "Future Wars: equipment as first printed",
        description: "Unticked, the fanzine equipment plays as The Best of Future Wars (1991) reprints it. Ticked, as the original "
            + "issues printed it: the Power Booster has no fourth-turn burnout (later turns fail on 11 or less, NGCFells's "
            + "ruling); a hit on Inferno Gauss shells does 30 heat (20 with CASE) and 1 damage a shell; a hit on Long Range "
            + "Flamer fuel does 2 damage and 3 heat a round left; the EII PDS makes no heat; and Swing Fire's three extra rules apply.",
        source: {
            title: "*Future Wars* #8 and #9 (1988), #14 (1989) and #19 (1990), where each item first appeared; the 1991 reprint is "
                + "The Best of Future Wars, Volume One",
            publication: "Future Wars", tag: "FW originals", author: "Karl Sander, Mike Reese and Chris Congdon",
        },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["futureWarsEquipment"],
    },
    // The four Future Wars DropShip construction methods (#172, DropShips plan). Each replaces the TechManual's DropShip
    // construction, so they refuse each other; the tables and weights are in future-wars-dropships.ts.
    {
        id: FW_DROPSHIP_RULESET_IDS.stock,
        summary: "Mark Stock's DropShip building: engine, integrity, bridge and heat sinks from the DS&JS ships' own figures.",
        category: "construction",
        name: "Future Wars: DropShip construction (Stock)",
        description: "DropShips only. Mark Stock's rules, written to build ships like those of DropShips and JumpShips (1988): engine "
            + "tonnage / (15 / thrust), Structural Integrity x tonnage / 100, a bridge of 1 to 10 tons a crew member, free heat sinks "
            + "of the engine / 10 to 25, cubicles 150 tons, doors 5 tons, heavy vehicles 100 and light 50, 5 tons a crew member or "
            + "passenger (10 first class), 2 an infantry trooper and 3 jump or motorized. Where Stock says \"look in DS/JS\", "
            + "NGCFells set formulae fitted to every DropShip in that book, which the builder may change: thrust points a ton of fuel, "
            + "tons of fuel a burn-day, crew, armor points a ton, the bridge multiplier and the heat-sink divisor (Inspired by Stock). "
            + "Battle Value and cost by the edition's rules on the ship as built. More in TRO - JBT: Future Wars DropShips.",
        source: { title: FW_DROPSHIP_SOURCES.stock, publication: "Future Wars", tag: "FW #16", author: "Mark Stock" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["dropshipConstruction"],
    },
    {
        id: FW_DROPSHIP_RULESET_IDS.eid,
        summary: "Erik Eid's deluxe DropShip building: Stock's rules with charts for fuel, heat sinks and armor by size.",
        category: "construction",
        name: "Future Wars: DropShip construction (Eid)",
        description: "DropShips only. Erik Eid's \"Deluxe Dropship Construction\", built on Stock's: engine tonnage / (16 / thrust), "
            + "Structural Integrity greater than the Overthrust, thrust points a ton of fuel by tonnage (Chart A, to 100,000 tons), "
            + "1.84 tons of fuel a burn-day under 15,000 tons, a bridge of 0.0075 x tonnage, free heat sinks of the engine / Chart B, "
            + "armor points a ton by shape and size (Charts C and D). Cubicles 150 tons with weightless doors, at most eight (five with "
            + "ferro-aluminum armor); 5 tons a crew member or passenger, 10 an officer or first-class passenger, 7 an infantry trooper "
            + "and 8 jump or motorized; a crew of at least nine. His advanced-technology notes are warnings. NGCFells's: above 15,000 "
            + "tons the burn-day the builder sets, else the Stock formula; Battle Value by the edition's rules, and cost by the "
            + "edition's rules, as Eid leaves cost to the builder.",
        source: { title: FW_DROPSHIP_SOURCES.eid, publication: "Future Wars", tag: "FW #25", author: "Erik Eid" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["dropshipConstruction"],
    },
    {
        id: FW_DROPSHIP_RULESET_IDS.reese,
        summary: "Mike Reese's DropShip building: Eid's charts extended past 100,000 tons, fuel by days, tonnage from a model.",
        category: "construction",
        name: "Future Wars: DropShip construction (Reese)",
        description: "DropShips only. Mike Reese's rules, Eid's extended: tonnage measured from a 1/285 model (cubic centimeters x 23.1 "
            + "x 0.07), engine tonnage / (16 / thrust), Structural Integrity from the Overthrust to three times it, 20 to 30 days of "
            + "fuel at 1,440 thrust points a day, a bridge of 0.0075 x tonnage up to 25 tons, Eid's charts carried past 100,000 tons, "
            + "at most eight doors for a combat drop, several engines allowed, and Clan ships with half-weight XL engines and double "
            + "heat sinks. Every line rounds to the whole ton, as his worked examples do. Battle Value and cost by the edition's rules.",
        source: { title: FW_DROPSHIP_SOURCES.reese, publication: "Future Wars", tag: "FW #36", author: "Mike Reese" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["dropshipConstruction"],
    },
    {
        id: FW_DROPSHIP_RULESET_IDS.houseman,
        summary: "Doug Houseman's DropShip design: every system a share of the hull's mass, with integrity, docking and quarters.",
        category: "construction",
        name: "Future Wars: DropShip construction (Houseman)",
        description: "DropShips only. Doug Houseman's \"Designing a Dropship\": the hull's systems as shares of its mass (structure 3% "
            + "a point of integrity, hull 5% spheroid or 10% aerodyne, power 2%, landing 10% or 15%, controls 3%, recycling 1%), "
            + "thrusters of 3 tons a point a 100 tons, thrust no higher than integrity, fuel 3 tons a thrust point a day, a docking "
            + "system by size, armor by size, quarters by the person, weapons x 1.5, bays at twice what they carry and cargo at 110%; "
            + "armor, systems, quarters, weapons and bays under a quarter of the weight. NGCFells's: the integrity table carried past "
            + "row 8 (3% of mass, 10 internal structure, 20 armor and 1 g a point), heat sinks a ton each with none free. Battle Value "
            + "and cost by the edition's rules.",
        source: { title: FW_DROPSHIP_SOURCES.houseman, publication: "Future Wars", tag: "FW #36", author: "Doug Houseman" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["dropshipConstruction"],
    },
    {
        id: "tandem-charge-srm-house-rule",
        summary: "Tandem-Charge SRM ammo holds half the rounds a ton and gets a free critical check by launcher size.",
        category: "play",
        name: "House rule: Tandem Charge SRMs (u/Magical_Savior)",
        description: "An alternate rule for the existing Tandem-Charge SRM ammunition, which its author finds far too strong for its Battle Value. "
            + "A ton holds half the rounds, rounded up. Each attack gets one free critical check, as armor-piercing rounds do, by launcher size: "
            + "roll 2D6 once, at the first location hit, for each launcher; a critical hit on a 12 for a launcher of 2 or 3 tubes, an 11 for 4 or 5, "
            + "a 10 for 6 or 7, and a 9 for the MML-9. Against vehicles and battle armor, which are critically hit automatically, one critical hit comes "
            + "for every 3 missiles, as with Infernos. Against Hardened armor and Ferro-Lamellor armor the rounds get no critical check. "
            + "Inspired by: u/Magical_Savior. NGCFells's reading, not in the post: the launcher sizes are read from its grouped lines (size /2 (3), /4 (5), /6 (7)) as 2-3, 4-5 and 6-7 tubes, "
            + "and the rule is recorded as text only, so a ton still holds the ammunition's printed rounds in the builder.",
        source: { title: "u/Magical_Savior, 'Tandem Charge SRM - House Rules', r/battletech", url: "https://www.reddit.com/r/battletech/comments/1jamkvn/", publication: "r/battletech", tag: "r/battletech", author: "u/Magical_Savior" },
        minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        changes: ["tandemChargeSrm"],
    },
    {
        id: "sample-no-clans",
        summary: "A sample alternate universe in which the Clans never formed: no Clan or Mixed tech, no ProtoMechs.",
        category: "setting",
        name: "Sample: The Clans never existed (alternate universe)",
        description: "A sample alternate universe in which the Clans never formed: no Clan or Mixed tech. A placeholder until real rulesets are added.",
        source: { title: "Sample ruleset (#324)", publication: "Samples", tag: "Sample" },
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
        if (!ruleset) {
            return { name: `${id} (ruleset no longer listed)` };
        }
        // A credit carries the title and link only; the window's tag and publication are not printed on sheets.
        const { title, url } = ruleset.source;
        return { name: ruleset.name, source: url ? { title, url } : { title } };
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

/** Whether one of the two names the other in its `excludes`. */
function excludesEither(one: ISpecialRuleset, other: ISpecialRuleset): boolean {
    return !!one.excludes?.includes(other.id) || !!other.excludes?.includes(one.id);
}

/** The first `changes` key the two share, or undefined. */
function sharedChange(one: ISpecialRuleset, other: ISpecialRuleset): string | undefined {
    return one.changes.find((change) => other.changes.includes(change));
}

/** The listed rulesets among `ids`, leaving out `exceptId`. */
function listedRulesets(ids: readonly string[], exceptId: string): ISpecialRuleset[] {
    return ids.filter((id) => id !== exceptId).map(findSpecialRuleset).filter((ruleset): ruleset is ISpecialRuleset => !!ruleset);
}

/** The ticked ruleset that cannot sit with `candidateId` (an exclusion either way, or a shared change), or undefined. */
export function getRulesetConflict(tickedIds: string[], candidateId: string): ISpecialRuleset | undefined {
    const candidate = findSpecialRuleset(candidateId);
    if (!candidate) {
        return undefined;
    }
    const others = listedRulesets(tickedIds, candidateId);
    return others.find((ticked) => excludesEither(candidate, ticked)) ?? others.find((ticked) => !!sharedChange(candidate, ticked));
}

export type RulesetBlockKind = "clash" | "excluded" | "needs" | "neededBy" | "unitType";

/** Why a ruleset cannot be ticked (or, when ticked, unticked or kept without a warning), with the reason in words. */
export interface IRulesetBlock {
    kind: RulesetBlockKind;
    by?: ISpecialRuleset;
    reason: string;
}

/**
 * Why `id` cannot be ticked now, or undefined. For an unticked ruleset: the unit type, an exclusion, a clash, then the
 * first missing requirement. For a ticked one: a ticked ruleset that needs it (it cannot be unticked), then an exclusion
 * or clash with the other ticked rulesets, as a warning on a saved combination that no longer fits.
 */
export function getRulesetBlock(tickedIds: readonly string[], id: string, unitType?: RulesEditionUnitType): IRulesetBlock | undefined {
    const ruleset = findSpecialRuleset(id);
    if (!ruleset) {
        return undefined;
    }
    const others = listedRulesets(tickedIds, id);
    const excluded = others.find((other) => excludesEither(ruleset, other));
    const clash = others.find((other) => !!sharedChange(ruleset, other));
    const clashOrExclusion = (): IRulesetBlock | undefined => {
        if (excluded) {
            return { kind: "excluded", by: excluded, reason: `Cannot be used with ${excluded.name}` };
        }
        if (clash) {
            const change = sharedChange(ruleset, clash)!;
            return { kind: "clash", by: clash, reason: `Clashes with ${clash.name} (both change ${CHANGE_LABELS[change] ?? change})` };
        }
        return undefined;
    };
    if (tickedIds.includes(id)) {
        const dependant = others.find((other) => !!other.requires?.includes(id));
        if (dependant) {
            return { kind: "neededBy", by: dependant, reason: `Needed by ${dependant.name}` };
        }
        const warning = clashOrExclusion();
        if (warning) {
            return warning;
        }
        // A saved ruleset whose requirement is not ticked (it gained `requires` later): a warning, not a refusal.
        const unmet = (ruleset.requires ?? []).find((required) => !tickedIds.includes(required));
        if (unmet) {
            const needed = findSpecialRuleset(unmet);
            return { kind: "needs", by: needed, reason: `Needs ${needed?.name ?? unmet}` };
        }
        return undefined;
    }
    if (unitType && ruleset.removesUnitTypes?.includes(unitType)) {
        return { kind: "unitType", reason: `${UNIT_TYPE_PLURALS[unitType]} do not exist under this ruleset` };
    }
    const blocked = clashOrExclusion();
    if (blocked) {
        return blocked;
    }
    const missing = (ruleset.requires ?? []).find((required) => !tickedIds.includes(required));
    if (missing) {
        const needed = findSpecialRuleset(missing);
        return { kind: "needs", by: needed, reason: `Needs ${needed?.name ?? missing}` };
    }
    return undefined;
}

/**
 * `ids` in an order that can be unticked one at a time: each ruleset before any ruleset it needs, so no untick is
 * refused as "Needed by". Otherwise the order is kept.
 */
export function orderForUntick(ids: readonly string[]): string[] {
    const left = [...ids];
    const ordered: string[] = [];
    while (left.length > 0) {
        // The first id no other remaining id needs; with a cycle (never shipped), the first one, so this always ends.
        const index = Math.max(0, left.findIndex((id) => !left.some((other) => !!findSpecialRuleset(other)?.requires?.includes(id))));
        ordered.push(...left.splice(index, 1));
    }
    return ordered;
}

/** Who a ruleset cannot be used with, needs and is needed by, for its More info view. */
export function getRulesetRelations(id: string): { clashesWith: ISpecialRuleset[]; excludes: ISpecialRuleset[]; requires: ISpecialRuleset[]; requiredBy: ISpecialRuleset[] } {
    const ruleset = findSpecialRuleset(id);
    if (!ruleset) {
        return { clashesWith: [], excludes: [], requires: [], requiredBy: [] };
    }
    const others = btSpecialRulesets.filter((other) => other.id !== id);
    const excludes = others.filter((other) => excludesEither(ruleset, other));
    return {
        excludes,
        clashesWith: others.filter((other) => !excludes.includes(other) && !!sharedChange(ruleset, other)),
        requires: (ruleset.requires ?? []).map(findSpecialRuleset).filter((other): other is ISpecialRuleset => !!other),
        requiredBy: others.filter((other) => !!other.requires?.includes(id)),
    };
}
