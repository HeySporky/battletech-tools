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
 * The tanks, jeeps and infantry of Expert Battledroids (Battledroids, FASA 1984, pp.22-23, cited as BD). They are
 * fixed designs: the rulebook gives each one its movement, armor and weapons and has no construction rules for
 * them, so they are data here and not something a creator builds. Every figure below is as the pages print it.
 */

export type BattledroidsUnitKind = "tank" | "jeep" | "infantry";

/** Where a tank's armor is: the four sides and the turret (BD p.22). */
export type BattledroidsArmorLocation = "front" | "left" | "right" | "back" | "turret";

export interface IBattledroidsUnitKind {
    kind: BattledroidsUnitKind;
    name: string;
    page: number;
    /** Movement points in a turn the unit does not fire, and in one it does. */
    movementPoints: number;
    movementPointsFiring: number;
    /** Added to the To-Hit Number of attacks against the unit. */
    toHitModifier: number;
    /** Tanks: armor points by location. */
    armor?: Record<BattledroidsArmorLocation, number>;
    /** Jeeps and infantry: the damage that destroys the unit. */
    damageToDestroy?: number;
    stacking: string;
    movement: string;
    combat: string[];
}

export interface IBattledroidsUnitWeapon {
    /** The weapon's tag in the equipment catalogs; its ranges and damage are the Battledroids edition's (BD p.20). */
    tag: string;
    count: number;
    /** Shots carried for each of them. */
    shots: number;
    arc: string;
}

export interface IBattledroidsUnitDesign {
    tag: string;
    name: string;
    kind: BattledroidsUnitKind;
    book: "BD";
    page: number;
    weapons: IBattledroidsUnitWeapon[];
    notes: string;
}

export const battledroidsUnitKinds: IBattledroidsUnitKind[] = [
    {
        kind: "tank",
        name: "Tank",
        page: 22,
        movementPoints: 4,
        movementPointsFiring: 3,
        toHitModifier: 0,
        armor: { front: 20, left: 10, right: 10, back: 8, turret: 5 },
        stacking: "2 tanks, or 1 tank and 1 battledroid, to a hex.",
        movement: "No heavy woods, lake or fire hexes; no more than 1 elevation level up or down in a hex. "
            + "Faces like a battledroid and pays 1 MP for each hexside turned.",
        combat: [
            "Attacks by and against tanks are judged like other weapon attacks.",
            "Any damage to the tracks makes it impossible for the tank to move.",
            "When all the armor points on any part of the tank are gone, the tank is destroyed.",
            "Killed by a shot to its back armor, it explodes: roll two dice, and on 9 or more a fire starts in the hex.",
            "Its firing arc is slightly smaller than a battledroid's: the hex ahead and the next one on either side (diagram).",
            "A ram is treated like a battledroid charge: 3 damage for each hex moved, and the tank takes 1 point for every 10 tons of what it rams (BD p.23).",
        ],
    },
    {
        kind: "jeep",
        name: "Jeep",
        page: 22,
        movementPoints: 6,
        movementPointsFiring: 5,
        toHitModifier: 1,
        // "Jeeps can withstand 5 points of damage. Any hit that does more than 5 damage points kills a jeep" (BD p.22):
        // read as destroyed by the sixth point, however the points arrive.
        damageToDestroy: 6,
        stacking: "2 jeeps, 1 jeep and 1 tank, or 1 jeep and 1 battledroid to a hex.",
        movement: "No heavy woods, lake or fire hexes; no more than 1 elevation level up or down in a hex. "
            + "The battledroid facing rules apply.",
        combat: [
            "Units firing on a jeep add 1 to their To-Hit Numbers.",
            "A jeep can withstand 5 points of damage; damage beyond what kills it spreads to other jeeps in the hex.",
            "A ram is treated like a battledroid charge: 1 damage for each hex moved, and the jeep takes 1 point for every 10 tons of what it rams (BD p.23).",
        ],
    },
    {
        kind: "infantry",
        name: "Infantry Squad",
        page: 23,
        movementPoints: 1,
        movementPointsFiring: 1,
        toHitModifier: 2,
        damageToDestroy: 1,
        stacking: "Up to 10 infantry units to a hex; vehicles and battledroids in the hex do not count.",
        movement: "1 hex a turn, ignoring terrain costs and facing. No lake or fire hexes.",
        combat: [
            "Vehicles and battledroids firing at infantry add 2 to their To-Hit Numbers.",
            "1 point of damage kills the unit; extra damage points affect other infantry units in the hex.",
            "Setting a hex on fire kills any infantry units in it.",
        ],
    },
];

export const battledroidsUnitDesigns: IBattledroidsUnitDesign[] = [
    {
        tag: "scr-8n-scorpion",
        name: "SCR-8N Scorpion",
        kind: "tank",
        book: "BD",
        page: 22,
        weapons: [{ tag: "srm-6", count: 3, shots: 15, arc: "Front" }],
        notes: "No turret: three 6-pack short-range missile launchers in front, with 15 shots per launcher.",
    },
    {
        tag: "hnt-3r-hunter",
        name: "HNT-3R Hunter",
        kind: "tank",
        book: "BD",
        page: 22,
        weapons: [{ tag: "lrm-20", count: 1, shots: 18, arc: "Front" }],
        notes: "No turret: one 20-pack long-range missile launcher in front, with ammunition for 18 shots.",
    },
    {
        tag: "vde-3t-vedette",
        name: "VDE-3T Vedette",
        kind: "tank",
        book: "BD",
        page: 22,
        weapons: [
            { tag: "autocannon-standard-b", count: 1, shots: 40, arc: "Any (turret)" },
            { tag: "machine-gun", count: 1, shots: 200, arc: "Any (turret)" },
        ],
        notes: "A turret with one auto cannon (40 shots) and one machine gun (200 shots); it can fire in any direction.",
    },
    {
        tag: "jeep-srm",
        name: "Jeep (SRM)",
        kind: "jeep",
        book: "BD",
        page: 22,
        weapons: [{ tag: "srm-2", count: 1, shots: 5, arc: "Any" }],
        notes: "A 2-pack short-range missile launcher that can fire in any direction, with 5 shots.",
    },
    {
        tag: "jeep-mg",
        name: "Jeep (Machine Gun)",
        kind: "jeep",
        book: "BD",
        page: 22,
        weapons: [{ tag: "machine-gun", count: 1, shots: 10, arc: "Any" }],
        notes: "A machine gun that can fire in any direction, with 10 shots.",
    },
    {
        tag: "infantry-srm",
        name: "Infantry Squad (SRM)",
        kind: "infantry",
        book: "BD",
        page: 23,
        weapons: [{ tag: "srm-2", count: 1, shots: 12, arc: "Any" }],
        notes: "A 9-man squad with a 2-pack short-range missile launcher that can fire in any direction, with 12 shots.",
    },
    {
        tag: "infantry-mg",
        name: "Infantry Squad (Machine Gun)",
        kind: "infantry",
        book: "BD",
        page: 23,
        weapons: [{ tag: "machine-gun", count: 1, shots: 25, arc: "Any" }],
        notes: "A 9-man squad with 1 machine gun that can fire in any direction, with 25 shots.",
    },
];

/** Tank Hit Locations, BD p.22: two dice, by the side the attack comes from. */
export function getBattledroidsTankHitLocation(roll: number, fromSide: boolean): "tracks" | "armor" | "turret" {
    if (roll >= 10) {
        return "turret";
    }
    if (roll <= 3 || (fromSide && roll === 4)) {
        return "tracks";
    }
    return "armor";
}
