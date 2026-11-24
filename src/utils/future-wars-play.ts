import { IEquipmentItem } from "../data/data-interfaces";
import type { FutureWarsPrinting } from "./future-wars-ruleset-tools";

/**
 * Fan equipment play rules, as plain functions the 'Mech play panel and `BattleMech` read. Best of Future Wars (#172),
 * Chunk C: pages are the printed pages of *The Best of Future Wars, Volume One* (1991). Pleiades Mechworks (#641): the
 * Blue Saviour Dispersion Field, at the end.
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
/** A unit takes at most 15 points of heat from outside it a turn: flamers, infernos and the like (TW p.159). */
export const MAX_EXTERNAL_HEAT_PER_TURN = 15;
/** Turns of heat a hit adds; more hits only lengthen the burn. */
export const INFERNO_GAUSS_TURNS_PER_HIT = 5;

/**
 * A critical hit on Inferno Gauss shells: 30 heat (20 with CASE), and 1 more heat a shell in the reprint (Best-of
 * p.11); as Future Wars #19 first printed it, 1 damage a shell instead (#172, printing alternates).
 */
export function getInfernoGaussAmmoCrit(shellsLeft: number, hasCASE: boolean, printing: FutureWarsPrinting = "best-of"): { heat: number; damage: number } {
    const shells = Math.max(0, shellsLeft);
    const heat = hasCASE ? 20 : 30;
    return printing === "original" ? { heat, damage: shells } : { heat: heat + shells, damage: 0 };
}

/** A hit on Long Range Flamer fuel as first printed: 2 damage and 3 heat a round left (the reprint scales it as an explosion). */
export function getLRFlamerAmmoHit(roundsLeft: number): { damage: number; heat: number } {
    const rounds = Math.max(0, roundsLeft);
    return { damage: 2 * rounds, heat: 3 * rounds };
}

/** The EII PDS's heat: 1 from Future Wars #24's table (the record's), 0 as Future Wars #14 first printed it. */
export function getPDSHeat(printing: FutureWarsPrinting = "best-of"): number {
    return printing === "original" ? 0 : 1;
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
 * damage, and the die. Undefined beyond 36 hexes. Inside 8 hexes half the 1D4, rounded up (NGCFells's: the page prints "1D4/2").
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
export function getPowerBoosterRoll(turnInARow: number, roll: number, printing: FutureWarsPrinting = "best-of"): PowerBoosterResult {
    // Future Wars #14 p.34 has no fourth-turn burnout; NGCFells ruled (2026-11-17) that later turns keep 11 or less.
    if (roll <= 2 || (printing !== "original" && turnInARow >= 4)) return "system-burned-out";
    const failOn = turnInARow >= 3 ? 11 : turnInARow === 2 ? 9 : 5;
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

// --- Pleiades Mechworks Blue Saviour Dispersion Field (u/PleiadesMechworks, #641).
/** Heat a Blue Saviour makes each turn it is on. */
export const BLUE_SAVIOUR_HEAT = 7;
/** Turns on in a scenario that are safe from failure. */
export const BLUE_SAVIOUR_SAFE_TURNS = 6;
/** Damage a Blue Saviour slot explodes for when hit while on. */
export const BLUE_SAVIOUR_EXPLOSION = 5;

/** Energy damage halved, rounded down, at least 1 (0 stays 0): the Blue Saviour's field and Laser Reflective armor. */
export function halveEnergyDamage(damage: number): number {
    return damage <= 0 ? 0 : Math.max(1, Math.floor(damage / 2));
}

/** Damage one energy hit does to a unit: halved once for an active Blue Saviour, then once more for Laser Reflective armor. */
export function getIncomingEnergyDamage(damage: number, fields: { blueSaviourActive: boolean; reflective: boolean }): number {
    let result = damage;
    if (fields.blueSaviourActive) result = halveEnergyDamage(result);
    if (fields.reflective) result = halveEnergyDamage(result);
    return result;
}

/** The 2D6 target a Blue Saviour must meet on its `activeTurn`th turn on in the scenario: none up to the sixth, then 2 plus 1 for each turn after it. */
export function getBlueSaviourFailureTarget(activeTurn: number): number | undefined {
    return activeTurn <= BLUE_SAVIOUR_SAFE_TURNS ? undefined : 2 + (activeTurn - BLUE_SAVIOUR_SAFE_TURNS);
}

/** Whether the roll fails the field: less than the target (equal survives). */
export function blueSaviourFails(activeTurn: number, roll2d6: number): boolean {
    const target = getBlueSaviourFailureTarget(activeTurn);
    return target !== undefined && roll2d6 < target;
}

/**
 * An outgoing energy weapon's damage as the attack row writes it while a Blue Saviour is on: the halved figure (a number, or
 * short / medium / long), then what it was. `perShot` puts the "/shot" mark before the note.
 */
export function getBlueSaviourDamageText(
    damage: number | { short: number; medium: number; long: number },
    perShot: boolean,
    half: (damage: number) => number,
): string {
    const mark = perShot ? "/shot" : "";
    if (typeof damage === "number") return `${half(damage)}${mark} (half of ${damage}, Blue Saviour)`;
    return `${half(damage.short)}/${half(damage.medium)}/${half(damage.long)}${mark} (half of ${damage.short}/${damage.medium}/${damage.long}, Blue Saviour)`;
}

/**
 * Reminder lines while a Blue Saviour is on. The missile and ECM clauses play in the electronic warfare rules (`ewarLive`:
 * the unit edition has them) and are listed only where they do not.
 */
export function getBlueSaviourReminders(unit: { hasStealth: boolean; ewarLive: boolean }): string[] {
    return [...(unit.ewarLive ? [] : ["missiles: treat as AMS", "inside a hostile ECM field, no ECCM"]), ...(unit.hasStealth ? ["stealth off"] : []), "cannot be hidden"];
}

/** A non-capital energy weapon: lasers, PPCs, flamers, plasma and the like. Ammunition and equipment are not weapons. */
export function isEnergyWeapon(item: Pick<IEquipmentItem, "category" | "isAmmo" | "isEquipment" | "name" | "tag">): boolean {
    return !item.isAmmo && !item.isEquipment && item.category === "Energy Weapons" && !/capital/i.test(`${item.name} ${item.tag}`);
}
