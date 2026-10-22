import {
    getLargeNavalVesselHitLocation,
    getSuperheavyVehicleHitLocation,
    getVehicleCriticalEffect,
    getVehicleHitLocation,
    IVehicleHitLocationResult,
    VEHICLE_CRITICAL_EFFECT_NAMES,
    VehicleAttackDirection,
    VehicleCriticalColumn,
    VehicleHitArea,
} from "./vehicle-hit-tables";

// The tables printed on a vehicle record sheet, laid out as the Total Warfare record sheets print them
// (Ground Vehicle, V.T.O.L. and Naval Vehicle sheets). Every cell comes from vehicle-hit-tables.ts, the
// tables play mode rolls on, so the sheet and play mode cannot disagree.

export type VehicleSheetKind = "ground" | "vtol" | "naval" | "largeNaval";

export interface IVehicleSheetTable {
    columns: string[];
    rows: { roll: string; cells: string[] }[];
}

const NAVAL_MOTIVES = ["naval-surface", "hydrofoil", "naval-sub"];

export const getVehicleSheetKind = (motiveTag: string, largeNaval: boolean): VehicleSheetKind => {
    if (largeNaval) return "largeNaval";
    if (motiveTag === "vtol") return "vtol";
    return NAVAL_MOTIVES.includes(motiveTag) ? "naval" : "ground";
};

const TITLE_WORDS: Record<string, string> = {
    tracked: "TRACKED", wheeled: "WHEELED", hover: "HOVER", wige: "WiGE", vtol: "VTOL",
    "naval-surface": "NAVAL", hydrofoil: "HYDROFOIL", "naval-sub": "SUBMARINE", rail: "RAIL",
};

export const getVehicleSheetTitle = (motiveTag: string, options: { superheavy: boolean; support: boolean; largeNaval: boolean }): string => {
    if (options.largeNaval) return "LARGE NAVAL VESSEL RECORD SHEET";
    const word = TITLE_WORDS[motiveTag] ?? "VEHICLE";
    const prefix = options.superheavy ? "SUPER-HEAVY " : "";
    // A Large Support Vehicle's sheet is named for its class, not its motive type (TW record sheets).
    if (options.support && options.superheavy) return `LARGE ${motiveTag === "vtol" ? "VTOL" : "GROUND"} SUPPORT VEHICLE RECORD SHEET`;
    if (options.support) return `${prefix}${word} SUPPORT VEHICLE RECORD SHEET`;
    // The official sheets name the VTOL and submarine sheets after the craft alone.
    if (motiveTag === "vtol" || motiveTag === "naval-sub") return `${prefix}${word} RECORD SHEET`;
    return `${prefix}${word} VEHICLE RECORD SHEET`;
};

// The name printed before "Hit Location Table" or "Critical Hits Table". A super-heavy combat vehicle has its own hit
// location table but shares the ground critical hits table; a Large Support Vehicle has its own of both.
export const getVehicleTableName = (kind: VehicleSheetKind, options: { superheavy: boolean; support: boolean }, table: "hit" | "critical"): string => {
    if (kind === "largeNaval") return table === "hit" ? "Large Naval Vessel" : "Naval Combat Vehicle";
    if (kind === "vtol") return options.support && options.superheavy ? "Large VTOL Support Vehicle" : "VTOL Combat Vehicle";
    if (kind === "naval") return "Naval Combat Vehicle";
    if (options.support && options.superheavy) return "Large Ground Support Vehicle";
    if (options.superheavy && table === "hit") return "Super-Heavy Combat Vehicle";
    return "Ground Combat Vehicle";
};

const AREA_NAMES: Record<VehicleHitArea, string> = {
    front: "Front", rear: "Rear", left: "Left Side", right: "Right Side", side: "Side", turret: "Turret", rotor: "Rotors",
};

const ROLLS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// "*" marks the rolls that may inflict a critical hit, on the roll for 2 and 12 and on the cell otherwise;
// "†" marks a motive system damage roll, or on a VTOL a rotor hit (TW p. 197).
const hitCell = (result: IVehicleHitLocationResult, roll: number): string => {
    const dagger = result.motive || result.area === "rotor" ? "†" : "";
    const critical = result.critical ? ` (critical)${roll === 2 || roll === 12 ? "" : "*"}` : "";
    return `${AREA_NAMES[result.area]}${critical}${dagger}`;
};

export const getVehicleHitLocationSheet = (kind: VehicleSheetKind, superheavy: boolean): IVehicleSheetTable => {
    const isVTOL = kind === "vtol";
    let columns: { name: string; lookup: (roll: number) => IVehicleHitLocationResult }[];
    if (kind === "largeNaval" || superheavy) {
        const lookup = kind === "largeNaval" ? getLargeNavalVesselHitLocation : getSuperheavyVehicleHitLocation;
        const side = isVTOL ? "" : "§";
        columns = (["front", "rear", "frontLeft", "rearLeft"] as VehicleAttackDirection[]).map((direction, index) => ({
            name: ["Front", "Rear", `Front Side${side}`, `Rear Side${side}`][index],
            lookup: (roll: number) => lookup(roll, direction),
        }));
    } else {
        columns = (["front", "rear", "left"] as VehicleAttackDirection[]).map((direction, index) => ({
            name: ["Front", "Rear", isVTOL ? "Side" : "Side§"][index],
            lookup: (roll: number) => getVehicleHitLocation(roll, direction, isVTOL),
        }));
    }
    return {
        columns: columns.map((column) => column.name),
        rows: ROLLS.map((roll) => ({
            roll: roll === 2 || roll === 12 ? `${roll}*` : `${roll}`,
            cells: columns.map((column) => hitCell(column.lookup(roll), roll)),
        })),
    };
};

// Fuel Tank (ICE only) and Ammunition (when carried) keep their footnote marks.
const criticalCell = (roll: number, column: VehicleCriticalColumn, isVTOL: boolean): string => {
    const effect = getVehicleCriticalEffect(roll, column, isVTOL, { fusionEngine: false, carriesAmmo: true });
    const mark = effect === "fuelTank" ? "*" : effect === "ammunition" ? "**" : "";
    return VEHICLE_CRITICAL_EFFECT_NAMES[effect] + mark;
};

export const getVehicleCriticalHitsSheet = (isVTOL: boolean): IVehicleSheetTable => {
    const columns: VehicleCriticalColumn[] = ["front", "side", "rear", isVTOL ? "rotor" : "turret"];
    return {
        columns: ["Front", "Side", "Rear", isVTOL ? "Rotors" : "Turret"],
        rows: [
            { roll: "2-5", cells: columns.map(() => VEHICLE_CRITICAL_EFFECT_NAMES.none) },
            ...[6, 7, 8, 9, 10, 11, 12].map((roll) => ({ roll: `${roll}`, cells: columns.map((column) => criticalCell(roll, column, isVTOL)) })),
        ],
    };
};

// Motive System Damage Table (TW p. 193); see getVehicleMotiveDamageLevel.
export const VEHICLE_MOTIVE_DAMAGE_SHEET_ROWS: { roll: string; effect: string }[] = [
    { roll: "2-5", effect: "No effect" },
    { roll: "6-7", effect: "Minor damage: +1 to all Driving Skill Rolls" },
    { roll: "8-9", effect: "Moderate damage: -1 Cruising MP, +2 to all Driving Skill Rolls" },
    { roll: "10-11", effect: "Heavy damage: half Cruising MP (round fractions up), +3 to all Driving Skill Rolls" },
    { roll: "12+", effect: "Major damage: no movement for the rest of the game; the vehicle is immobile" },
];

export const VEHICLE_MOTIVE_DIRECTION_ROWS: [string, string][] = [["Hit from rear", "+1"], ["Hit from the sides", "+2"]];

// Vehicle type modifiers (see getVehicleMotiveTypeModifier); the naval sheet lists only naval types.
export const getVehicleMotiveTypeModifierRows = (kind: VehicleSheetKind): [string, string][] =>
    kind === "naval" || kind === "largeNaval"
        ? [["Naval", "+0"], ["Hydrofoil", "+3"]]
        : [["Tracked, Naval", "+0"], ["Wheeled", "+2"], ["Hovercraft, Hydrofoil", "+3"], ["WiGE", "+4"]];

// Physical Attacks Against VTOL Vehicles Table, from the TW V.T.O.L. record sheet: the difference in levels between
// the attacker and the VTOL.
export const VTOL_PHYSICAL_ATTACK_ROWS: [string, string][] = [
    ["-1 or lower", "None"],
    ["0", "All except Punch"],
    ["1-2", "All except Kick"],
    ["3", "Club and Physical Weapons only"],
    ["4+", "None"],
];
