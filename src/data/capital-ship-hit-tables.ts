// JumpShip, WarShip and space station hit locations and critical hits (JumpShip/WarShip/Space Station Hit Location
// Table, SO:AA p.83; critical hit effects TW pp.239-240 and SO:AA p.82).

import { AdvancedAerospaceArc, AdvancedAerospaceFacing } from "./advanced-aerospace-construction";

/** Where the attack comes from. SO:AA's table has no Above/Below column: such attacks use the Side column on a random side, as TW p.238 does for DropShips. */
export type CapitalShipAttackDirection = "nose" | "aft" | "left" | "right" | "above";

export const CAPITAL_SHIP_ATTACK_DIRECTIONS: { tag: CapitalShipAttackDirection; name: string }[] = [
    { tag: "nose", name: "Nose" },
    { tag: "aft", name: "Aft" },
    { tag: "left", name: "Left Side" },
    { tag: "right", name: "Right Side" },
    { tag: "above", name: "Above / Below" },
];

export type CapitalShipCritical = "lifeSupport" | "control" | "weapon" | "thruster" | "cic" | "sensors" | "crew" | "kfDrive"
    | "fuel" | "avionics" | "engine" | "dockingCollar" | "gravDeck" | "door" | "cargo";

export const CAPITAL_SHIP_CRITICAL_NAMES: Record<CapitalShipCritical, string> = {
    lifeSupport: "Life Support",
    control: "Control",
    weapon: "Weapon",
    thruster: "Thruster",
    cic: "CIC",
    sensors: "Sensors",
    crew: "Crew",
    kfDrive: "K-F Drive",
    fuel: "Fuel",
    avionics: "Avionics",
    engine: "Engine",
    dockingCollar: "Docking Collar",
    gravDeck: "Grav Deck",
    door: "Door",
    cargo: "Cargo",
};

// "front"/"aftSide"/"broadside" stand for the side attacked; "right"/"left" columns name fixed sides.
type Area = "nose" | "aft" | "foreRight" | "foreLeft" | "aftRight" | "aftLeft" | "frontSide" | "aftSide" | "broadside";
type TableEntry = [AdvancedAerospaceFacing | "frontSide" | "aftSide", CapitalShipCritical, Area?];

// Rolls 2 to 12. The third entry is the firing arc of a Weapon result where it differs from the facing.
const NOSE_COLUMN: TableEntry[] = [
    ["nose", "lifeSupport"], ["nose", "control"], ["foreRight", "weapon"], ["foreRight", "thruster"], ["nose", "cic"], ["nose", "weapon"],
    ["nose", "sensors"], ["foreLeft", "thruster"], ["foreLeft", "weapon"], ["nose", "crew"], ["nose", "kfDrive"],
];
const AFT_COLUMN: TableEntry[] = [
    ["aft", "fuel"], ["aft", "avionics"], ["aftRight", "weapon"], ["aftRight", "thruster"], ["aft", "engine"], ["aft", "weapon"],
    ["aft", "engine"], ["aftLeft", "thruster"], ["aftLeft", "weapon"], ["aft", "control"], ["aft", "kfDrive"],
];
const SIDE_COLUMN: TableEntry[] = [
    ["nose", "avionics"], ["frontSide", "sensors"], ["frontSide", "weapon"], ["frontSide", "dockingCollar"], ["frontSide", "kfDrive"],
    ["aftSide", "weapon", "broadside"], ["aftSide", "gravDeck"], ["aftSide", "door"], ["aftSide", "weapon"], ["aft", "cargo"], ["aft", "engine"],
];

export interface ICapitalShipHit {
    facing: AdvancedAerospaceFacing;
    critical: CapitalShipCritical;
    /** For a Weapon result, the firing arc whose bay is hit; null where the unit has no such arc. */
    weaponArc: AdvancedAerospaceArc | null;
}

/**
 * The armor facing hit and the critical hit that may follow, for a 2D6 roll and attack direction. For an attack from
 * above or below, sideRoll is the 1D6 that picks the side: 1-3 right, 4-6 left. A broadside Weapon result on a ship
 * without broadsides (JumpShips, stations) hits no weapon.
 */
export const getCapitalShipHitLocation = (roll: number, direction: CapitalShipAttackDirection, warShip: boolean, sideRoll: number = 1): ICapitalShipHit => {
    const index = Math.min(12, Math.max(2, Math.floor(Number.isFinite(roll) ? roll : 7))) - 2;
    const column = direction === "nose" ? NOSE_COLUMN : direction === "aft" ? AFT_COLUMN : SIDE_COLUMN;
    const [area, critical, arcArea] = column[index];
    const left = direction === "left" || (direction === "above" && sideRoll >= 4);
    const facing: AdvancedAerospaceFacing = area === "frontSide" ? (left ? "foreLeft" : "foreRight")
        : area === "aftSide" ? (left ? "aftLeft" : "aftRight") : area;
    let weaponArc: AdvancedAerospaceArc | null = null;
    if (critical === "weapon") {
        if (arcArea === "broadside") weaponArc = warShip ? (left ? "leftBroadside" : "rightBroadside") : null;
        else weaponArc = facing;
    }
    return { facing, critical, weaponArc };
};

/** Capital missile critical hit chance on any hit to armor (TW p.239), by capital weapon tag. */
export const CAPITAL_MISSILE_CRITICAL_CHANCE: Record<string, number> = {
    "barracuda": 11, "barracuda-t": 11, "white-shark": 9, "white-shark-t": 9, "killer-whale": 10, "killer-whale-t": 10, "kraken-t": 8,
};
