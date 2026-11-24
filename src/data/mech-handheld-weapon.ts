import { ICatalogStanding, ITechDates } from "./data-interfaces";

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

/**
 * What a handheld weapon is allowed and how it plays in one edition's rules (#611). Two printings, two rule sets: Maximum Tech
 * pp.79 and 92 for the 1998 and Revised Master Rules (Level 3), Tactical Operations: Advanced Units and Equipment pp.126-128, 193
 * for Total Warfare and later (Experimental).
 */
export interface IHandheldRules {
    /** Which book's construction and play rules apply. */
    id: "maxtech" | "toaue";
    /** Where the construction rules are. */
    constructionSource: string;
    /** Where the play rules are. */
    playSource: string;
    /** Where the Battle Value is. */
    battleValueSource: string;
    /** Most items it may hold (Tactical Operations: six); none printed for Maximum Tech, where ten medium lasers is the example. */
    itemLimit: number | null;
    /** Weapons needing one standard heat sink for each point of the heat they make: "energy" only energy weapons (TO:AUE), "all" every weapon (Maximum Tech's SRM-6 example). */
    heatSinksFor: "energy" | "all";
    /** A d6 roll on an arm hit that strikes the weapon instead of the arm. */
    hitOn: number[];
    /** A hit to the center torso that can also strike the weapon (Maximum Tech p.79: a 6 on the extra die). */
    centerTorsoHitOn: number[];
    /** The weapon costs this many times what its parts cost (Maximum Tech p.87 and the TO:AUE cost table: 2 x normal). */
    costMultiplier: number;
    /** Armor points in half a ton, standard armor only. */
    armorPointsPerHalfTon: number;
    /** A damaged arm actuator costs the Piloting roll to hold on to the weapon in a fall this much more (Maximum Tech p.79); Tactical Operations says to apply the actuator modifiers. */
    fallRollPerActuator: number;
    /** Dropped weapons: Maximum Tech says it ceases to function and cannot be targeted, Tactical Operations that it can be shot at (+1, and -4 as an immobile target). */
    droppedCanBeTargeted: boolean;
    /** The play rules in short, for the sheet and the play view. */
    notes: string[];
}

export const HANDHELD_RULES: Record<IHandheldRules["id"], IHandheldRules> = {
    maxtech: {
        id: "maxtech",
        constructionSource: "Maximum Tech p.79",
        playSource: "Maximum Tech p.79",
        battleValueSource: "Maximum Tech p.92",
        itemLimit: null,
        heatSinksFor: "all",
        hitOn: [1, 6],
        centerTorsoHitOn: [6],
        costMultiplier: 2,
        armorPointsPerHalfTon: 8,
        fallRollPerActuator: 1,
        droppedCanBeTargeted: false,
        notes: [
            "Carried in both arms: it fires into the front arc only, and its weight is lifted under the BattleMech Lifting Capabilities (10 percent of the 'Mech's tonnage, BMR p.72).",
            "It carries its own heat sinks and ammunition, makes no heat for the 'Mech and cannot draw on the 'Mech's ammunition or its targeting computer.",
            "A hit to an arm: roll 1D6, on a 1 or 6 the weapon is hit instead (center torso front hit: on a 6). An unarmored weapon is destroyed by the first hit, an armored one when the damage passes its armor; the 'Mech takes nothing.",
            "Dropped or picked up in any End Phase, not both in the same phase; if the 'Mech falls a Piloting Skill Roll holds on to it, +1 for each damaged or missing arm actuator. A dropped weapon stops working and cannot be targeted. With no working hand actuator it is dropped at the end of the phase.",
        ],
    },
    toaue: {
        id: "toaue",
        constructionSource: "Tactical Operations: Advanced Units & Equipment pp.126-128",
        playSource: "Tactical Operations: Advanced Units & Equipment p.128",
        battleValueSource: "Tactical Operations: Advanced Units & Equipment p.193",
        itemLimit: 6,
        heatSinksFor: "energy",
        hitOn: [6],
        centerTorsoHitOn: [],
        costMultiplier: 2,
        armorPointsPerHalfTon: 8,
        fallRollPerActuator: 0,
        droppedCanBeTargeted: true,
        notes: [
            "It takes no tonnage or critical space on the carrier, which needs two full sets of arm and hand actuators; its weight counts toward the cargo limit (10 percent of the 'Mech's tonnage, 20 percent with active Triple-Strength Myomer).",
            "While it is carried the 'Mech makes no punching or pushing attacks, uses no physical weapon but the one in the handheld, and no weapon in its arms, torso or Main Gun unless rear-facing. Everything in it fires at one target a turn, makes no heat, draws on no ammunition but its own and takes no targeting computer or other electronics (AES modifiers apply with AES in both arms).",
            "A hit to either arm: roll 1D6, on a 6 the handheld takes the damage and is destroyed if the damage passes its armor, the excess going to the arm.",
            "Dropped in the End Phase in the 'Mech's hex, forced by a hit on a hand actuator or when Triple-Strength Myomer cools below its activation level with the weapon over 10 percent of the 'Mech's tonnage; a fall needs an extra Piloting Skill Roll with the arm actuator modifiers. A dropped weapon can be shot at (+1 to hit, -4 immobile target); in the same hex it is picked up in the End Phase of any later turn than the drop, and used from the next turn.",
        ],
    },
};

/**
 * The option the 'Mech creator offers: a handheld weapon is its own small design, carried in a hand actuator and not part of the
 * 'Mech's weight. It has no catalog record, so it carries its own edition standing: Level 3 in the Master Rules editions
 * (Maximum Tech p.79), Experimental in Total Warfare and later (TO:AUE p.126; prototype 3055 Inner Sphere, 2490 Clan).
 */
export const mechHandheldWeapon: ICatalogStanding & ITechDates & { name: string; tag: string; book: string; page: number; alphaStrikeNote: string } = {
    name: "Handheld Weapon",
    tag: "handheld-weapon",
    rulesLevel: 4,
    editions: ["master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
    editionLevels: { "master-rules": 3, "master-rules-revised": 3 },
    introducedInEdition: "master-rules",
    book: "TO:AUE",
    page: 126,
    alphaStrikeNote: "No Alpha Strike conversion: neither Tactical Operations: Advanced Units & Equipment nor the Alpha Strike Companion prints one for a handheld weapon, so the Alpha Strike card leaves it out rather than inventing a value.",
    prototype: 3055,
    introduced: null,
    extinct: null,
    reintroduced: null,
    clanDates: { prototype: 2490, introduced: null, extinct: null, reintroduced: null },
};

/** The rule set an edition prints, undefined where the edition has no handheld weapon rules. */
export const getHandheldRules = (edition: string): IHandheldRules | undefined =>
    ["master-rules", "master-rules-revised"].includes(edition) ? HANDHELD_RULES.maxtech
        : ["total-warfare", "battlemech-manual", "core-rulebook"].includes(edition) ? HANDHELD_RULES.toaue : undefined;
