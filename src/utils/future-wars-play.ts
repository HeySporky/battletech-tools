import { IEquipmentItem } from "../data/data-interfaces";

/**
 * Best of Future Wars (#172), Chunk C: the play rules of the fanzine equipment, as plain functions the 'Mech play panel
 * and `BattleMech` read. Pages are the printed pages of *The Best of Future Wars, Volume One* (1991).
 */

export type FutureWarsPlayKind =
    | "lr-flamer" | "lr-flamer-ammo" | "pds" | "vhe" | "inferno-gauss" | "sabot" | "penitrator" | "gatling"
    | "pom-pom" | "swing-fire" | "booster-weapon" | "booster-running" | "booster-jumping";

/** Which fanzine play rule an item follows, or undefined for any other item. */
export function getFutureWarsPlayKind(item: Pick<IEquipmentItem, "tag" | "conversion"> | null | undefined): FutureWarsPlayKind | undefined {
    if (!item) return undefined;
    const conversion = item.conversion;
    if (conversion?.kind === "pom-pom") return "pom-pom";
    if (conversion?.kind === "swing-fire") return "swing-fire";
    if (conversion?.kind === "power-booster") {
        const target = conversion.booster?.target;
        return target === "running" ? "booster-running" : target === "jumping" ? "booster-jumping" : "booster-weapon";
    }
    switch (item.tag) {
        case "custom-lr-flamer": return "lr-flamer";
        case "ammo-custom-lr-flamer-standard": return "lr-flamer-ammo";
        case "custom-eii-pds": return "pds";
        case "custom-penitrator": return "penitrator";
        case "custom-gatling-laser": return "gatling";
        case "ammo-is-gauss-rifle-vhe": return "vhe";
        case "ammo-is-gauss-rifle-inferno": return "inferno-gauss";
    }
    if (/^ammo-ac-(2|5|10|20)-sabot$/.test(item.tag)) return "sabot";
    return undefined;
}

// --- Long Range Flamer, p.28.
const LR_FLAMER_DAMAGE_BY_TURN = [5, 2, 0];
const LR_FLAMER_HEAT = 5;
const LR_FLAMER_MAX_HEAT = 10;

/**
 * This turn's burn on a unit from the Long Range Flamer hits on it. `ages` holds one entry a hit: 0 the turn it hit,
 * 1 the turn after, 2 the last turn it burns. Damage adds up (three hits in a row: 5 + 2 + 0 = 7); heat is 5, plus 1
 * for each other hit still burning, 10 at most.
 */
export function getLRFlamerBurn(ages: readonly number[]): { damage: number; heat: number } {
    const burning = ages.filter((age) => age >= 0 && age < LR_FLAMER_DAMAGE_BY_TURN.length);
    if (burning.length === 0) return { damage: 0, heat: 0 };
    const damage = burning.reduce((sum, age) => sum + LR_FLAMER_DAMAGE_BY_TURN[age], 0);
    return { damage, heat: Math.min(LR_FLAMER_MAX_HEAT, LR_FLAMER_HEAT + burning.length - 1) };
}

/** Turns a Long Range Flamer hit burns. */
export const LR_FLAMER_BURN_TURNS = LR_FLAMER_DAMAGE_BY_TURN.length;

/** The Long Range Flamer's own to-hit penalty by range band, on top of the range modifier: +2 medium, +3 long. */
export function getLRFlamerRangeModifier(band: "short" | "medium" | "long"): number {
    return band === "medium" ? 2 : band === "long" ? 3 : 0;
}

/** Where a missed Long Range Flamer shot lands, from one die; the hex it lands in catches fire. */
export function getLRFlamerScatter(roll: number): string {
    if (roll <= 3) return "one hex short";
    if (roll === 4) return "one hex to the left";
    if (roll === 5) return "one hex to the right";
    return "one hex behind";
}

// --- EII Point Defense System, p.8.
/** Bursts in the half ton of ammunition built into each PDS. */
export const PDS_INTEGRAL_BURSTS = 50;

/** One salvo against a PDS: the die stops that many of the missiles that hit (die + 1 against LRMs). One burst a salvo. */
export function getPDSInterception(missileHits: number, roll: number, launcher: "srm" | "lrm"): { stopped: number; through: number } {
    const stopped = Math.min(missileHits, roll + (launcher === "lrm" ? 1 : 0));
    return { stopped, through: missileHits - stopped };
}

// --- Liao Inferno Gauss shell, p.11.
export const INFERNO_GAUSS_HEAT_PER_TURN = 10;
/** Turns of heat a hit adds; more hits only lengthen the burn. */
export const INFERNO_GAUSS_TURNS_PER_HIT = 5;

/** Heat from a critical hit on Inferno Gauss shells: 30 (20 with CASE) and 1 a shell. */
export function getInfernoGaussAmmoCritHeat(shellsLeft: number, hasCASE: boolean): number {
    return (hasCASE ? 20 : 30) + Math.max(0, shellsLeft);
}

// --- VHE Gauss shell, p.10.
/** Damage of a VHE shell where it hits, and on each adjacent location. */
export const VHE_DAMAGE = { hit: 20, adjacent: 5 } as const;
/** Each shell's damage when the ammunition cooks off. */
export const VHE_AMMO_EXPLOSION_PER_SHELL = 30;
const VHE_ADJACENT: Record<string, string[]> = {
    hd: ["ct"],
    ct: ["hd", "lt", "rt", "ll", "rl"],
    lt: ["ct", "la", "ll"],
    rt: ["ct", "ra", "rl"],
    la: ["lt"],
    ra: ["rt"],
    ll: ["ct", "lt"],
    rl: ["ct", "rt"],
};

/** The locations a VHE shell's 5-point splash reaches from the one it hit. */
export function getVHESplashLocations(location: string): string[] {
    return [...(VHE_ADJACENT[location] ?? [])];
}

// --- SABOT, p.21.
/** A SABOT round's damage: half the autocannon's to the armor, a quarter to the internal structure, rounded up. */
export function getSabotDamage(acDamage: number): { external: number; internal: number } {
    return { external: Math.ceil(acDamage / 2), internal: Math.ceil(acDamage / 4) };
}

// --- The Penitrator, p.20.
const PENITRATOR_BANDS: { band: string; upTo: number; dice: string; sides: number; halve: boolean; internal: number }[] = [
    { band: "under 8", upTo: 7, dice: "1D4/2", sides: 4, halve: true, internal: 1 },
    { band: "short", upTo: 12, dice: "1D8", sides: 8, halve: false, internal: 3 },
    { band: "medium", upTo: 24, dice: "1D6", sides: 6, halve: false, internal: 2 },
    { band: "long", upTo: 36, dice: "1D4", sides: 4, halve: false, internal: 1 },
];

/**
 * One Penitrator missile's hit at `range` hexes with `roll` on the band's die: the armor damage, the internal structure
 * damage, and the die. Undefined beyond 36 hexes. Inside 8 hexes half the 1D4, rounded up (ours: the page prints "1D4/2").
 */
export function getPenitratorHit(range: number, roll: number): { band: string; external: number; internal: number; dice: string } | undefined {
    const row = PENITRATOR_BANDS.find((band) => range <= band.upTo);
    if (!row) return undefined;
    const die = Math.max(1, Math.min(row.sides, roll));
    return { band: row.band, external: row.halve ? Math.ceil(die / 2) : die, internal: row.internal, dice: row.dice };
}

/** The die the Penitrator rolls for damage at `range`, or undefined out of range. */
export function getPenitratorDie(range: number): number | undefined {
    return PENITRATOR_BANDS.find((band) => range <= band.upTo)?.sides;
}

// --- Power Booster, p.28.
export type PowerBoosterResult = "boosted" | "failed" | "system-burned-out";

/**
 * A Power Booster's roll on its `turnInARow`-th turn of use (1 for a first use): it fails for good on 5 or less, on 9 or
 * less the second turn running, 11 or less the third; a fourth turn, or a 2 at any time, burns out the system it drives.
 */
export function getPowerBoosterRoll(turnInARow: number, roll: number): PowerBoosterResult {
    if (turnInARow >= 4 || roll <= 2) return "system-burned-out";
    const failOn = turnInARow === 3 ? 11 : turnInARow === 2 ? 9 : 5;
    return roll <= failOn ? "failed" : "boosted";
}

/** Running heat with a leg booster on: 1 a hex run. */
export function getBoostedRunHeat(hexesRun: number): number {
    return Math.max(0, hexesRun);
}

/** Jump MP with a jump-jet booster on: half again, rounded down (jump 6 is 9). */
export function getBoostedJumpMP(jumpMP: number): number {
    return Math.floor(jumpMP * 1.5);
}

/** Jumping heat with a jump-jet booster on: twice the normal 1 a hex, at least 3 (TW p.68), so at least 6. */
export function getBoostedJumpHeat(hexesJumped: number): number {
    return 2 * Math.max(3, hexesJumped);
}
