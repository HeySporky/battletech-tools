import { IEquipmentItem } from "./data-interfaces";

// Alpha Strike conversion pieces shared by the large aerospace units: Small Craft, DropShips, JumpShips, WarShips and
// space stations (Alpha Strike Companion pp.91-117 and 144, with errata v1.6 and the Converting Heat errata).

/** A damage value at one range bracket: minimal damage prints 0*. */
export interface ILargeCraftASDamageValue {
    damage: number;
    /** Minimal damage, printed 0*. */
    minimal: boolean;
}

export const formatLargeCraftASDamage = (value: ILargeCraftASDamageValue): string => (value.minimal ? "0*" : `${value.damage}`);

export const roundUpToTenth = (value: number): number => Math.ceil(Math.round(value * 1000) / 100) / 10;

/** Rounded up to the tenth; under 0.5 is minimal damage (0*), otherwise rounded up (ASC p.116). */
export const toLargeCraftASDamage = (raw: number): ILargeCraftASDamageValue => {
    const tenth = roundUpToTenth(raw);
    if (tenth <= 0) return { damage: 0, minimal: false };
    if (tenth < 0.5) return { damage: 0, minimal: true };
    return { damage: Math.ceil(tenth), minimal: false };
};

/** Heat a standard weapon adds to the maximum heat output: none for one-shot and rocket launchers (ASC p.115). */
export const getLargeCraftASHeat = (item: IEquipmentItem): number => {
    if (item.isOneShot || /rocket-launcher/.test(item.tag)) return 0;
    return item.heatAero ?? item.heat ?? 0;
};

/** Point Defense weapons (ASC pp.104-109): machine guns, small-class lasers and flamers; an anti-missile system counts 0.3 (ASC p.128). */
export const getLargeCraftASPointDefense = (item: IEquipmentItem): number => {
    if (item.isAmmo) return 0;
    if (item.weaponType?.includes("AMS")) return 0.3;
    const name = item.name.toLowerCase();
    const listed = (/machine gun/.test(name) && !/array/.test(name))
        || /\b(er |heavy )?small (laser|x-pulse laser|chemical laser|re-engineered laser)\b/.test(name)
        || /\b(er )?micro (laser|pulse laser)\b/.test(name)
        || /^flamer\b|^vehicle flamer\b|^flamer \(vehicle\)/.test(name);
    return listed && !/small pulse/.test(name) ? item.alphaStrike?.rangeShort || 0 : 0;
};

/** Movement Factor of the large aerospace Point Value: 0.25 a Thrust point, +0.5 at Thrust 7-9, +2 at 10 or more (ASC p.144, errata v1.6). */
export const getLargeCraftMovementFactor = (thrust: number): number => 0.25 * thrust + (thrust >= 10 ? 2 : thrust >= 7 ? 0.5 : 0);

/** Defensive special ability factors that apply to large aerospace units (ASC p.143). */
export const LARGE_CRAFT_AS_DEFENSIVE_ABILITY_FACTORS: Record<string, number> = { AECM: 3, BH: 2, C3RS: 2, ECM: 2, RCN: 2, LPRB: 1, PRB: 1, LECM: 0.5 };

/** The attack types a large craft's arc can hold (ASC pp.102-103): standard, capital, sub-capital and missiles. */
export type LargeCraftASAttackClass = "STD" | "CAP" | "SCAP" | "MSL";
export const LARGE_CRAFT_AS_ATTACK_CLASSES: LargeCraftASAttackClass[] = ["STD", "CAP", "SCAP", "MSL"];

export interface ICapitalWeaponASValues {
    heat: number;
    /** Short, Medium, Long and Extreme; 0 where the table prints a dash. */
    damage: [number, number, number, number];
    attackClass: "CAP" | "SCAP" | "MSL";
    /** Tele-operated missiles add the TELE special. */
    tele?: boolean;
}

/**
 * The Alpha Strike Capital and Sub-Capital Weapon Conversion Table (ASC p.114), by capital weapon tag. Errata v1.6 corrects
 * the NAC/25's Short value from 23 to 25. The Screen Launcher is not in it: it converts as the SCR special (ASC p.130).
 */
export const CAPITAL_WEAPON_ALPHA_STRIKE: Record<string, ICapitalWeaponASValues> = {
    "light-mass-driver": { heat: 30, damage: [54, 54, 54, 0], attackClass: "CAP" },
    "medium-mass-driver": { heat: 60, damage: [90, 90, 90, 0], attackClass: "CAP" },
    "heavy-mass-driver": { heat: 90, damage: [126, 126, 126, 0], attackClass: "CAP" },
    "nac-10": { heat: 30, damage: [10, 10, 10, 0], attackClass: "CAP" },
    "nac-20": { heat: 60, damage: [20, 20, 20, 0], attackClass: "CAP" },
    "nac-25": { heat: 85, damage: [25, 25, 25, 0], attackClass: "CAP" },
    "nac-30": { heat: 100, damage: [30, 30, 30, 0], attackClass: "CAP" },
    "nac-35": { heat: 120, damage: [35, 35, 0, 0], attackClass: "CAP" },
    "nac-40": { heat: 135, damage: [40, 40, 0, 0], attackClass: "CAP" },
    "light-n-gauss": { heat: 9, damage: [15, 15, 15, 15], attackClass: "CAP" },
    "medium-n-gauss": { heat: 15, damage: [25, 25, 25, 25], attackClass: "CAP" },
    "heavy-n-gauss": { heat: 18, damage: [30, 30, 30, 30], attackClass: "CAP" },
    "light-n-ppc": { heat: 105, damage: [7, 7, 7, 0], attackClass: "CAP" },
    "medium-n-ppc": { heat: 135, damage: [9, 9, 9, 9], attackClass: "CAP" },
    "heavy-n-ppc": { heat: 225, damage: [15, 15, 15, 15], attackClass: "CAP" },
    "nl35": { heat: 52, damage: [3.5, 3.5, 3.5, 0], attackClass: "CAP" },
    "nl45": { heat: 70, damage: [4.5, 4.5, 4.5, 4.5], attackClass: "CAP" },
    "nl55": { heat: 85, damage: [5.5, 5.5, 5.5, 5.5], attackClass: "CAP" },
    "light-scc": { heat: 12, damage: [2, 2, 2, 0], attackClass: "SCAP" },
    "medium-scc": { heat: 30, damage: [5, 5, 0, 0], attackClass: "SCAP" },
    "heavy-scc": { heat: 42, damage: [7, 7, 0, 0], attackClass: "SCAP" },
    "scl-1": { heat: 24, damage: [1, 1, 1, 0], attackClass: "SCAP" },
    "scl-2": { heat: 28, damage: [2, 2, 0, 0], attackClass: "SCAP" },
    "scl-3": { heat: 32, damage: [3, 3, 0, 0], attackClass: "SCAP" },
    "killer-whale": { heat: 20, damage: [4, 4, 4, 4], attackClass: "MSL" },
    "white-shark": { heat: 15, damage: [3, 3, 3, 3], attackClass: "MSL" },
    "barracuda": { heat: 10, damage: [2, 2, 2, 2], attackClass: "MSL" },
    "ar-10-launcher": { heat: 15, damage: [3, 3, 3, 3], attackClass: "MSL" },
    "kraken-t": { heat: 50, damage: [10, 10, 10, 10], attackClass: "MSL", tele: true },
    "killer-whale-t": { heat: 20, damage: [4, 4, 4, 4], attackClass: "MSL", tele: true },
    "white-shark-t": { heat: 15, damage: [3, 3, 3, 3], attackClass: "MSL", tele: true },
    "barracuda-t": { heat: 10, damage: [2, 2, 2, 2], attackClass: "MSL", tele: true },
    "piranha": { heat: 9, damage: [3, 3, 3, 0], attackClass: "MSL" },
    "stingray": { heat: 12, damage: [3.5, 3.5, 0, 0], attackClass: "MSL" },
    "swordfish": { heat: 15, damage: [4.5, 0, 0, 0], attackClass: "MSL" },
    "manta-ray": { heat: 21, damage: [5, 0, 0, 0], attackClass: "MSL" },
};

/** Alpha Strike Size of a JumpShip or space station, or of a WarShip (ASC p.92). */
export const getCapitalShipASSize = (warShip: boolean, tons: number): number => warShip
    ? (tons < 500000 ? 1 : tons < 800000 ? 2 : tons < 1200000 ? 3 : 4)
    : (tons < 100000 ? 1 : tons < 300000 ? 2 : 3);

/** Alpha Strike armor of a unit with capital-scale armor: the sum over all facings x 0.33, rounded normally (ASC p.95). */
export const getCapitalASArmor = (capitalArmorPoints: number): number => Math.round(capitalArmorPoints * 0.33);

/**
 * Threshold: the Alpha Strike armor / 3 / the number of firing arcs (4 for large craft), rounded up (ASC p.95). The book's
 * Agamemnon example leaves out the division by the arcs (107 / 3 = 36); the rule, MegaMek and the published card (9) divide.
 * The published WarShip cards (2021) round normally (Aegis 193 armor: 16, Kimagure 290: 24); the rule's rounding up is followed.
 */
export const getLargeCraftASThreshold = (armor: number, arcs: number): number => Math.ceil(armor / 3 / arcs - 1e-9);
