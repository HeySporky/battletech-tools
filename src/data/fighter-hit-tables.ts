// Fighter hit locations and critical hits (Aerospace Units Hit Location Table, Fighters, Total Warfare p.237).

/** Where the attack comes from. "above" is the Above/Below column (TW p.238). */
export type FighterAttackDirection = "nose" | "aft" | "left" | "right" | "above";

export const FIGHTER_ATTACK_DIRECTIONS: { tag: FighterAttackDirection; name: string }[] = [
    { tag: "nose", name: "Nose" },
    { tag: "aft", name: "Aft" },
    { tag: "left", name: "Left Side" },
    { tag: "right", name: "Right Side" },
    { tag: "above", name: "Above / Below" },
];

export type FighterHitArc = "nose" | "leftWing" | "rightWing" | "aft";

export type FighterCritical = "weapon" | "sensors" | "heatSink" | "avionics" | "control" | "fcs" | "gear" | "fuel" | "engine" | "crew" | "bomb";

export const FIGHTER_CRITICAL_NAMES: Record<FighterCritical, string> = {
    weapon: "Weapon",
    sensors: "Sensors",
    heatSink: "Heat Sink",
    avionics: "Avionics",
    control: "Control",
    fcs: "FCS",
    gear: "Gear",
    fuel: "Fuel",
    engine: "Engine",
    crew: "Crew",
    bomb: "Bomb",
};

type TableArea = "nose" | "aft" | "rightWing" | "leftWing" | "wing";
type TableEntry = [TableArea, FighterCritical];

// Rolls 2 to 12, one column per attack direction. "wing" is the wing on the side attacked, or a random wing
// for an attack from above or below.
const NOSE_COLUMN: TableEntry[] = [
    ["nose", "weapon"], ["nose", "sensors"], ["rightWing", "heatSink"], ["rightWing", "weapon"], ["nose", "avionics"], ["nose", "control"],
    ["nose", "fcs"], ["leftWing", "weapon"], ["leftWing", "heatSink"], ["nose", "gear"], ["nose", "weapon"],
];
const AFT_COLUMN: TableEntry[] = [
    ["aft", "weapon"], ["aft", "heatSink"], ["rightWing", "fuel"], ["rightWing", "weapon"], ["aft", "engine"], ["aft", "control"],
    ["aft", "engine"], ["leftWing", "weapon"], ["leftWing", "fuel"], ["aft", "heatSink"], ["aft", "weapon"],
];
const SIDE_COLUMN: TableEntry[] = [
    ["nose", "weapon"], ["wing", "gear"], ["nose", "sensors"], ["nose", "crew"], ["wing", "weapon"], ["wing", "avionics"],
    ["wing", "bomb"], ["aft", "control"], ["aft", "engine"], ["wing", "gear"], ["aft", "weapon"],
];
const ABOVE_COLUMN: TableEntry[] = [
    ["nose", "weapon"], ["wing", "gear"], ["nose", "sensors"], ["nose", "crew"], ["wing", "weapon"], ["nose", "avionics"],
    ["wing", "weapon"], ["aft", "control"], ["aft", "engine"], ["wing", "gear"], ["aft", "weapon"],
];

/**
 * The armor facing hit and the critical hit that may follow, for a 2D6 roll and attack direction. For an attack
 * from above or below, wingRoll is the 1D6 that picks the wing: 1-3 right, 4-6 left (TW p.238).
 */
export const getFighterHitLocation = (roll: number, direction: FighterAttackDirection, wingRoll: number = 1): { arc: FighterHitArc; critical: FighterCritical } => {
    const index = Math.min(12, Math.max(2, Math.floor(Number.isFinite(roll) ? roll : 7))) - 2;
    const column = direction === "nose" ? NOSE_COLUMN : direction === "aft" ? AFT_COLUMN : direction === "above" ? ABOVE_COLUMN : SIDE_COLUMN;
    const [area, critical] = column[index];
    let arc: FighterHitArc;
    if (area !== "wing") arc = area;
    else if (direction === "left") arc = "leftWing";
    else if (direction === "right") arc = "rightWing";
    else arc = wingRoll >= 4 ? "leftWing" : "rightWing";
    return { arc, critical };
};
