// Small Craft and DropShip hit locations and critical hits (Aerospace Units Hit Location Table, DropShips/Small
// Craft, Total Warfare p.237).

import { SmallCraftFacing } from "./small-craft-construction";

/** Where the attack comes from. "above" is the Above/Below column (TW p.238). */
export type SmallCraftAttackDirection = "nose" | "aft" | "left" | "right" | "above";

export const SMALL_CRAFT_ATTACK_DIRECTIONS: { tag: SmallCraftAttackDirection; name: string }[] = [
    { tag: "nose", name: "Nose" },
    { tag: "aft", name: "Aft" },
    { tag: "left", name: "Left Side" },
    { tag: "right", name: "Right Side" },
    { tag: "above", name: "Above / Below" },
];

export type SmallCraftCritical = "crew" | "avionics" | "weapon" | "thruster" | "fcs" | "control" | "sensors" | "kfBoom"
    | "lifeSupport" | "door" | "engine" | "dockingCollar" | "gear" | "fuel" | "cargo";

export const SMALL_CRAFT_CRITICAL_NAMES: Record<SmallCraftCritical, string> = {
    crew: "Crew",
    avionics: "Avionics",
    weapon: "Weapon",
    thruster: "Thruster",
    fcs: "FCS",
    control: "Control",
    sensors: "Sensors",
    kfBoom: "K-F Boom",
    lifeSupport: "Life Support",
    door: "Door",
    engine: "Engine",
    dockingCollar: "Docking Collar",
    gear: "Gear",
    fuel: "Fuel",
    cargo: "Cargo",
};

type TableArea = "nose" | "aft" | "right" | "left" | "side";
type TableEntry = [TableArea, SmallCraftCritical];

// Rolls 2 to 12, one column per attack direction. "side" is the side attacked, or a random side for an attack
// from above or below.
const NOSE_COLUMN: TableEntry[] = [
    ["nose", "crew"], ["nose", "avionics"], ["right", "weapon"], ["right", "thruster"], ["nose", "fcs"], ["nose", "weapon"],
    ["nose", "control"], ["left", "thruster"], ["left", "weapon"], ["nose", "sensors"], ["nose", "kfBoom"],
];
const AFT_COLUMN: TableEntry[] = [
    ["aft", "lifeSupport"], ["aft", "control"], ["right", "weapon"], ["right", "door"], ["aft", "engine"], ["aft", "weapon"],
    ["aft", "dockingCollar"], ["left", "door"], ["left", "weapon"], ["aft", "gear"], ["aft", "fuel"],
];
// The Side and Above/Below columns are the same for these craft.
const SIDE_COLUMN: TableEntry[] = [
    ["nose", "weapon"], ["nose", "fcs"], ["nose", "sensors"], ["side", "thruster"], ["side", "cargo"], ["side", "weapon"],
    ["side", "door"], ["side", "thruster"], ["aft", "avionics"], ["aft", "engine"], ["aft", "weapon"],
];

/**
 * The armor facing hit and the critical hit that may follow, for a 2D6 roll and attack direction. For an attack
 * from above or below, sideRoll is the 1D6 that picks the side: 1-3 right, 4-6 left (TW p.238).
 */
export const getSmallCraftHitLocation = (roll: number, direction: SmallCraftAttackDirection, sideRoll: number = 1): { facing: SmallCraftFacing; critical: SmallCraftCritical } => {
    const index = Math.min(12, Math.max(2, Math.floor(Number.isFinite(roll) ? roll : 7))) - 2;
    const column = direction === "nose" ? NOSE_COLUMN : direction === "aft" ? AFT_COLUMN : SIDE_COLUMN;
    const [area, critical] = column[index];
    let facing: SmallCraftFacing;
    if (area !== "side") facing = area;
    else if (direction === "left") facing = "left";
    else if (direction === "right") facing = "right";
    else facing = sideRoll >= 4 ? "left" : "right";
    return { facing, critical };
};
