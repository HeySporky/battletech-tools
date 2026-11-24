/**
 * Fighters at altitude and velocity on the low-altitude (ground) map, and their air-to-ground attacks, one rule set for each
 * edition that prints them (#137): AeroTech (1986), BattleSpace (1993), AeroTech 2 (2000), AeroTech 2 Revised (2004) and
 * Total Warfare. Pure functions over a small flight state; the fighter class keeps the state and the roster panel shows it.
 * Play mode has no map, so nothing here draws the aerospace map: the player moves the pieces, this applies the thrust,
 * velocity, altitude, Control Roll and to-hit rules (owner call, 2026-11-22). Every number is as printed; the table says where
 * a number is inferred or unresolved.
 *
 * Sources (printed pages): TW pp.79-85 (movement), pp.242-247 (air-to-ground); AT2R pp.33-38; AT2 pp.24-30; BattleSpace
 * pp.83-86; AeroTech (1986) pp.11-22.
 */

export type AeroGroundEdition = "aerotech" | "battlespace" | "aerotech-2" | "aerotech-2-revised" | "total-warfare";

/** Oldest first; the order the editions were published. */
export const AERO_GROUND_EDITIONS: { tag: AeroGroundEdition; name: string; book: string; year: number }[] = [
    { tag: "aerotech", name: "AeroTech", book: "AT", year: 1986 },
    { tag: "battlespace", name: "BattleSpace", book: "BS", year: 1993 },
    { tag: "aerotech-2", name: "AeroTech 2", book: "AT2", year: 2000 },
    { tag: "aerotech-2-revised", name: "AeroTech 2, Revised Edition", book: "AT2R", year: 2004 },
    { tag: "total-warfare", name: "Total Warfare", book: "TW", year: 2005 },
];

/** The edition's own rules where the book prints them; Total Warfare's for every other edition and for no edition. */
export function getAeroGroundEdition(tag: string | undefined): AeroGroundEdition {
    return AERO_GROUND_EDITIONS.find((entry) => entry.tag === tag)?.tag ?? "total-warfare";
}

export type AirToGroundAttack = "strike" | "strafe" | "dive-bomb" | "altitude-bomb";

export interface IAirToGroundAttackRule {
    /** What the edition calls it (TW altitude-bombing is level-bombing in AT2 and AT2 Revised, ripple bombing in BattleSpace). */
    name: string;
    /** Added to the pilot's Gunnery Skill; null where the book's scan does not print the number. */
    modifier: number | null;
    /** The book prints a base number for a Gunnery 4 pilot and moves it 1 for each Gunnery level above or below 4 (AeroTech p.17; BattleSpace pp.34, 80): `modifier` is that base less 4. */
    printedBase?: boolean;
    /** Modifier against a building or immobile structure, where the edition prints one (BattleSpace strike). */
    structureModifier?: number;
    /** Added once per altitude: "altitude" is the fighter's altitude level, "above-very-low" one per level above Very Low. */
    altitudeModifier?: "altitude" | "above-very-low";
    minAltitude: number;
    maxAltitude: number | null;
    /** Altitude levels lost before the attacks resolve. */
    altitudeLoss: number;
    /** Fewest and most hexes the attack covers along the attack line (AeroTech 1986: a three-hex-wide row). */
    hexes: [number, number];
    /** Target movement and terrain modifiers apply (bombing is aimed at a hex, so they do not). */
    terrainAndMovement: boolean;
    /** Every unit in the hexes is a target, friends included (strafing and bombing). */
    hitsFriendlies: boolean;
    usesBombs: boolean;
    /** Damage is divided into groups of this many points. */
    damageGroup: number;
    note: string;
}

export type VelocityLoss = "halve" | "minus-5" | "reset" | "none";

export interface IAeroGroundRules {
    edition: AeroGroundEdition;
    book: string;
    /** Highest altitude level on the low-altitude map; null where the edition has only high and low altitude (AeroTech 1986). */
    maxAltitude: number | null;
    /** How the velocity falls at the start of a turn. */
    velocityLoss: VelocityLoss;
    /** Hexes a unit must move in a turn: its velocity, half of it, or the Thrust it spends (one a hex). */
    hexesPerTurn: "velocity" | "half-velocity" | "thrust";
    /** Highest velocity as a multiple of Safe Thrust; null where the edition gives a flat maximum instead. */
    maxVelocityFactor: number | null;
    maxVelocity: number | null;
    /** Past the maximum: a Control Roll for each point of excess, or not allowed. */
    overspeed: "roll-per-point" | "forbidden" | null;
    climbThrustPerLevel: number | null;
    /** Descending this many altitude levels or more gives +1 velocity, to the cap. */
    descentBonus: { levels: number; cap: number } | null;
    /** A Control Roll when a unit descends more than this many levels, modifier = levels; null for none. */
    descentControlRollAbove: number | null;
    /** A unit at velocity 0 at the end of movement: falls a level (with or without a Control Roll), must try to land, or nothing. */
    stall: { effect: "fall" | "land"; controlRoll: boolean } | null;
    /** Attacker exceeded Safe Thrust this turn: added to the to-hit (the TW attack table). */
    exceededSafeThrustModifier: number | null;
    /** To-hit penalty for flying at altitude 1 (NOE) on every air-to-ground attack (BattleSpace). */
    noeModifier: number | null;
    noeOmniModifier: number | null;
    scatter: "margin" | "d6" | "2d6-table";
    attacks: Partial<Record<AirToGroundAttack, IAirToGroundAttackRule>>;
    controlRollTriggers: string[];
}

const attack = (rule: Omit<IAirToGroundAttackRule, "damageGroup" | "hitsFriendlies" | "usesBombs" | "terrainAndMovement" | "altitudeLoss" | "hexes" | "minAltitude" | "maxAltitude"> & Partial<IAirToGroundAttackRule>): IAirToGroundAttackRule => ({
    damageGroup: 5, hitsFriendlies: false, usesBombs: false, terrainAndMovement: true, altitudeLoss: 0, hexes: [1, 1], minAltitude: 1, maxAltitude: null, ...rule,
});

const TW_FAMILY_STRAFE = attack({
    name: "Strafing", modifier: 4, maxAltitude: 3, hexes: [1, 5], hitsFriendlies: true,
    note: "Gunnery +4; within three altitudes of the ground; one to five consecutive hexes; non-ammo direct-fire energy and pulse weapons; every target, hostile or friendly, is rolled for; +2 more at altitude 1 (NOE).",
});

const twFamilyAttacks = (level: string, altitudeBomb: string): Partial<Record<AirToGroundAttack, IAirToGroundAttackRule>> => ({
    strafe: { ...TW_FAMILY_STRAFE, note: `${TW_FAMILY_STRAFE.note} (${level})` },
    strike: attack({
        name: "Striking", modifier: 2, minAltitude: 2, maxAltitude: 5, altitudeLoss: 1,
        note: `Gunnery +2; altitude 5 or lower, never at NOE; one ground unit or hex on the flight path; no bombs; the altitude drops by one before the attacks (${level}).`,
    }),
    "dive-bomb": attack({
        name: "Dive-bombing", modifier: 2, minAltitude: 3, maxAltitude: 5, altitudeLoss: 2, terrainAndMovement: false, hitsFriendlies: true, usesBombs: true,
        note: `Gunnery +2; altitude 5 or lower, dives two altitudes; one hex; no terrain or target movement modifiers (${level}).`,
    }),
    "altitude-bomb": attack({
        name: altitudeBomb, modifier: 2, altitudeModifier: "altitude", hexes: [1, 10], terrainAndMovement: false, hitsFriendlies: true, usesBombs: true,
        note: `Gunnery +2 plus the fighter's altitude, from any altitude; up to ten adjacent hexes, one or two bombs in each (${level}).`,
    }),
});

export const AERO_GROUND_RULES: Record<AeroGroundEdition, IAeroGroundRules> = {
    "total-warfare": {
        edition: "total-warfare", book: "TW pp.79-85, 242-247", maxAltitude: 10, velocityLoss: "halve", hexesPerTurn: "velocity",
        maxVelocityFactor: 2, maxVelocity: null, overspeed: "roll-per-point", climbThrustPerLevel: 2, descentBonus: { levels: 2, cap: 12 },
        descentControlRollAbove: 2, stall: { effect: "fall", controlRoll: true }, exceededSafeThrustModifier: 2, noeModifier: null, noeOmniModifier: null,
        scatter: "margin",
        attacks: twFamilyAttacks("TW pp.243-246", "Altitude-bombing"),
        controlRollTriggers: [
            "Descending more than two altitudes in a turn (modifier = altitudes descended, TW p.84)",
            "Velocity above twice Safe Thrust (+1 a point of excess, TW p.84)",
            "Stalled at velocity 0 (TW p.84)",
            "Hovering past Safe Thrust (TW p.84)",
            "Entering a hex higher than the unit's altitude: it crashes (TW p.81)",
        ],
    },
    "aerotech-2-revised": {
        edition: "aerotech-2-revised", book: "AT2R pp.33-38", maxAltitude: 10, velocityLoss: "halve", hexesPerTurn: "velocity",
        maxVelocityFactor: 2, maxVelocity: null, overspeed: "forbidden", climbThrustPerLevel: 2, descentBonus: { levels: 2, cap: 12 },
        descentControlRollAbove: 1, stall: { effect: "fall", controlRoll: true }, exceededSafeThrustModifier: null, noeModifier: null, noeOmniModifier: null,
        scatter: "d6",
        attacks: twFamilyAttacks("AT2R pp.35-38", "Level-bombing"),
        controlRollTriggers: [
            "Descending more than one altitude level in a turn (modifier = levels descended, AT2R p.34)",
            "Stalled at velocity 0 (AT2R p.33)",
        ],
    },
    "aerotech-2": {
        edition: "aerotech-2", book: "AT2 pp.24-30", maxAltitude: 10, velocityLoss: "minus-5", hexesPerTurn: "half-velocity",
        maxVelocityFactor: 2, maxVelocity: null, overspeed: "forbidden", climbThrustPerLevel: 2, descentBonus: { levels: 2, cap: 12 },
        descentControlRollAbove: 1, stall: { effect: "fall", controlRoll: true }, exceededSafeThrustModifier: null, noeModifier: null, noeOmniModifier: null,
        scatter: "d6",
        attacks: twFamilyAttacks("AT2 pp.24-26", "Level-bombing"),
        controlRollTriggers: [
            "Descending more than one altitude level in a turn (modifier = levels descended, AT2 p.29)",
            "Stalled at velocity 0 (AT2 p.28)",
        ],
    },
    "battlespace": {
        edition: "battlespace", book: "BattleSpace pp.83-86", maxAltitude: 6, velocityLoss: "reset", hexesPerTurn: "thrust",
        maxVelocityFactor: null, maxVelocity: 12, overspeed: "forbidden", climbThrustPerLevel: 2, descentBonus: { levels: 2, cap: 12 },
        descentControlRollAbove: null, stall: { effect: "fall", controlRoll: false }, exceededSafeThrustModifier: null, noeModifier: 2, noeOmniModifier: 1,
        scatter: "d6",
        attacks: {
            strafe: attack({
                name: "Strafing", modifier: 4, printedBase: true, maxAltitude: 3, hexes: [1, 5], hitsFriendlies: true,
                note: "Low, very low or NOE; a block of five hexes on the attack line; energy weapons only; base 8 (BattleSpace p.84: the English scan cuts the number off, the Spanish edition of the page prints 8).",
            }),
            strike: attack({
                name: "Strike", modifier: 4, printedBase: true, structureModifier: 0, maxAltitude: 3,
                note: "Low, very low or NOE; base 8 (4 against a building or immobile structure); every weapon on one unit (BattleSpace p.85).",
            }),
            "dive-bomb": attack({
                name: "Dive-bombing", modifier: 2, printedBase: true, minAltitude: 3, maxAltitude: 4, terrainAndMovement: false, hitsFriendlies: true, usesBombs: true,
                damageGroup: 10, note: "Low or medium altitude; base 6; no target movement or terrain modifiers (BattleSpace p.85).",
            }),
            "altitude-bomb": attack({
                name: "Ripple bombing", modifier: 4, printedBase: true, altitudeModifier: "above-very-low", hexes: [1, 10], terrainAndMovement: false,
                hitsFriendlies: true, usesBombs: true, damageGroup: 10,
                note: "Any altitude; base 8, +1 for each level above very low; up to ten adjacent hexes, one or two bomb units in each (BattleSpace pp.85-86).",
            }),
        },
        controlRollTriggers: ["Every 5 bomb units carried add +1 to Control and Landing Rolls (BattleSpace p.85)"],
    },
    "aerotech": {
        edition: "aerotech", book: "AeroTech pp.11-22", maxAltitude: null, velocityLoss: "none", hexesPerTurn: "thrust",
        maxVelocityFactor: null, maxVelocity: null, overspeed: null, climbThrustPerLevel: null, descentBonus: null, descentControlRollAbove: null,
        stall: { effect: "land", controlRoll: false }, exceededSafeThrustModifier: null, noeModifier: null, noeOmniModifier: null, scatter: "2d6-table",
        attacks: {
            strafe: attack({
                name: "Strafing", modifier: 4, printedBase: true, hexes: [3, 3], hitsFriendlies: true,
                note: "A row three hexes wide parallel to the flight; energy weapons grouped into one strafing factor; weapons need a range of 4 or more; base 8 (AeroTech p.21, OCR).",
            }),
            "dive-bomb": attack({
                name: "Dive bombing", modifier: 2, printedBase: true, terrainAndMovement: false, hitsFriendlies: true, usesBombs: true, damageGroup: 10,
                note: "Base 6; adjacent hexes take half damage; a miss scatters on the Scatter Table (AeroTech p.22).",
            }),
        },
        controlRollTriggers: ["A Structural Integrity roll for every turn whose thrust spent exceeds the current SI (AeroTech p.12)"],
    },
};

// ---- flight state and movement ----------------------------------------------------------------------------------

/** Altitude 0 is landed, or not on the low-altitude map at all (in space the space map rules apply). */
export interface IFlightState {
    altitude: number;
    velocity: number;
    /** Thrust spent this turn. */
    thrustUsed: number;
    /** Control Rolls failed so far (the player records the result of each roll). */
    controlRollsFailed: number;
}

export interface IControlRollNeeded { reason: string; modifier: number }

export interface IFlightStep {
    state: IFlightState;
    controlRolls: IControlRollNeeded[];
    notes: string[];
    /** The unit climbed off the top of the low-altitude map. */
    leftMap?: boolean;
}

export const newFlightState = (): IFlightState => ({ altitude: 0, velocity: 0, thrustUsed: 0, controlRollsFailed: 0 });

const step = (state: IFlightState, extra: Partial<IFlightStep> = {}): IFlightStep => ({ state, controlRolls: [], notes: [], leftMap: false, ...extra });

/** The Control Roll target: Piloting Skill plus the modifiers (avionics hits, the descent modifier and so on). */
export function getControlRollTarget(piloting: number, ...modifiers: number[]): number {
    return piloting + modifiers.reduce((sum, value) => sum + value, 0);
}

/** The new turn: velocity falls as the edition says and the turn's thrust starts again at 0. */
export function startFlightTurn(state: IFlightState, edition: AeroGroundEdition): IFlightState {
    const loss = AERO_GROUND_RULES[edition].velocityLoss;
    const velocity = loss === "halve" ? Math.floor(state.velocity / 2) : loss === "minus-5" ? Math.max(0, state.velocity - 5) : loss === "reset" ? 0 : state.velocity;
    return { ...state, velocity, thrustUsed: 0 };
}

/** Hexes a unit must move this turn at this velocity. */
export function getHexesToMove(velocity: number, edition: AeroGroundEdition): number {
    return AERO_GROUND_RULES[edition].hexesPerTurn === "half-velocity" ? Math.ceil(velocity / 2) : velocity;
}

/** Thrust spent to speed up (positive) or slow down (negative): one point of thrust, one point of velocity. */
export function accelerate(state: IFlightState, change: number, edition: AeroGroundEdition, safeThrust: number): IFlightStep {
    void edition;
    const delta = Math.trunc(change) || 0;
    const velocity = Math.max(0, state.velocity + delta);
    const used = state.thrustUsed + Math.abs(velocity - state.velocity);
    const notes = used > safeThrust ? [`Thrust spent (${used}) is over Safe Thrust (${safeThrust}).`] : [];
    return step({ ...state, velocity, thrustUsed: used }, { notes });
}

/** Climb (positive) or descend (negative) altitude levels. Descending is free; the book says what else it does. */
export function changeAltitude(state: IFlightState, levels: number, edition: AeroGroundEdition): IFlightStep {
    const rules = AERO_GROUND_RULES[edition];
    const change = Math.trunc(levels) || 0;
    if (state.altitude <= 0 || change === 0) return step(state);
    if (rules.maxAltitude === null || rules.climbThrustPerLevel === null) {
        return step(state, { notes: ["AeroTech (1986) has no altitude levels, only high and low altitude."] });
    }
    if (change > 0) {
        const next = state.altitude + change;
        const used = state.thrustUsed + change * rules.climbThrustPerLevel;
        if (next > rules.maxAltitude) {
            const note = edition === "battlespace"
                ? "Above Very High the standard BattleSpace rules apply (BattleSpace p.83)."
                : "Climbed off the low-altitude map: the unit goes to row 1 of the atmosphere on the space map, or leaves the fight (TW p.84).";
            return step({ ...state, altitude: next, thrustUsed: used }, { leftMap: true, notes: [note] });
        }
        return step({ ...state, altitude: next, thrustUsed: used });
    }
    const down = -change;
    const next = Math.max(0, state.altitude - down);
    let velocity = state.velocity;
    const notes: string[] = [];
    if (rules.descentBonus && down >= rules.descentBonus.levels) velocity = Math.max(velocity, Math.min(rules.descentBonus.cap, velocity + 1));
    const controlRolls: IControlRollNeeded[] = [];
    if (rules.descentControlRollAbove !== null && down > rules.descentControlRollAbove) controlRolls.push({ reason: `Descended ${down} altitudes`, modifier: down });
    if (next === 0) notes.push("Dropped to altitude 0: the unit must land or crash.");
    return step({ ...state, altitude: next, velocity }, { controlRolls, notes });
}

export interface IEndMovementOptions {
    safeThrust: number;
    vstol?: boolean;
    /** Thrust still unspent: a VSTOL unit at velocity 0 hovers for 2 instead of stalling. */
    thrustLeft?: number;
}

/** The end of the Movement Phase: the speed limit and the stall. */
export function endFlightMovement(state: IFlightState, edition: AeroGroundEdition, options: IEndMovementOptions): IFlightStep {
    const rules = AERO_GROUND_RULES[edition];
    if (state.altitude <= 0) return step(state);
    const controlRolls: IControlRollNeeded[] = [];
    const notes: string[] = [];
    let next = state;
    const limit = rules.maxVelocityFactor !== null ? rules.maxVelocityFactor * options.safeThrust : rules.maxVelocity;
    if (limit !== null && state.velocity > limit) {
        const over = state.velocity - limit;
        if (rules.overspeed === "roll-per-point") {
            controlRolls.push({ reason: `Velocity ${state.velocity} is ${over} over twice Safe Thrust (${limit})`, modifier: over });
        } else {
            notes.push(`A unit may not fly faster than ${rules.maxVelocityFactor !== null ? "twice its Safe Thrust" : "velocity " + limit} (${rules.book}): velocity ${state.velocity} is ${over} over.`);
        }
    }
    if (state.velocity === 0 && rules.stall) {
        if (options.vstol && (options.thrustLeft ?? 0) >= 2) {
            notes.push("A VSTOL unit hovers for 2 Thrust instead of stalling (TW p.84).");
        } else if (rules.stall.effect === "land") {
            notes.push("A craft that moves no hexes must try to land (AeroTech p.12).");
        } else {
            const altitude = Math.max(0, state.altitude - 1);
            next = { ...state, altitude };
            if (rules.stall.controlRoll) controlRolls.push({ reason: "Stalled at velocity 0", modifier: 0 });
            notes.push(altitude === 0 ? "Stalled and fell out of altitude 1: the unit must land or crash." : "Stalled: the unit falls one altitude.");
        }
    }
    return step(next, { controlRolls, notes });
}

// ---- air-to-ground attacks ------------------------------------------------------------------------------------

export interface IAirToGroundAttacker {
    gunnery: number;
    altitude: number;
    omniFighter?: boolean;
    /** Damage and critical modifiers the fighter carries (FCS, sensors, pilot hits); the caller sums them. */
    otherModifiers?: number;
    exceededSafeThrust?: boolean;
}

export interface IAirToGroundToHit {
    allowed: boolean;
    reason?: string;
    /** The attack's modifier on the Gunnery Skill; null where the number is unresolved. */
    modifier: number | null;
    /** The to-hit number before target movement and terrain; null where unresolved. */
    baseToHit: number | null;
    autoMiss: boolean;
    autoHit: boolean;
    altitudeLoss: number;
    hexes: [number, number];
    hitsFriendlies: boolean;
    usesBombs: boolean;
    terrainAndMovement: boolean;
    damageGroup: number;
    labels: string[];
}

const refused = (reason: string): IAirToGroundToHit => ({
    allowed: false, reason, modifier: null, baseToHit: null, autoMiss: false, autoHit: false, altitudeLoss: 0, hexes: [0, 0],
    hitsFriendlies: false, usesBombs: false, terrainAndMovement: false, damageGroup: 5, labels: [],
});

/** To-hit for one air-to-ground attack, and whether the fighter at this altitude may make it at all. */
export function getAirToGroundToHit(
    attacker: IAirToGroundAttacker, type: AirToGroundAttack, edition: AeroGroundEdition, options: { targetIsStructure?: boolean } = {},
): IAirToGroundToHit {
    const rules = AERO_GROUND_RULES[edition];
    const rule = rules.attacks[type];
    if (attacker.altitude <= 0) return refused("A landed fighter, or one in space, makes no air-to-ground attack.");
    if (!rule) return refused(`${AERO_GROUND_EDITIONS.find((entry) => entry.tag === edition)?.name ?? edition} has no ${type} attack.`);
    if (rules.maxAltitude !== null) {
        if (attacker.altitude < rule.minAltitude) {
            return refused(attacker.altitude === 1 ? `${rule.name} cannot be made at NOE (altitude 1).` : `${rule.name} needs altitude ${rule.minAltitude} or higher.`);
        }
        if (rule.maxAltitude !== null && attacker.altitude > rule.maxAltitude) return refused(`${rule.name} needs altitude ${rule.maxAltitude} or lower.`);
    }
    const labels: string[] = [];
    const base = (rule.structureModifier !== undefined && options.targetIsStructure) ? rule.structureModifier : rule.modifier;
    const result: IAirToGroundToHit = {
        allowed: true, modifier: base, baseToHit: null, autoMiss: false, autoHit: false, altitudeLoss: rule.altitudeLoss, hexes: rule.hexes,
        hitsFriendlies: rule.hitsFriendlies, usesBombs: rule.usesBombs, terrainAndMovement: rule.terrainAndMovement, damageGroup: rule.damageGroup, labels,
    };
    if (base === null) {
        labels.push(`${rule.name}: the printed number is unresolved (${rule.note})`);
        return result;
    }
    let modifier = base;
    labels.push(`${rule.name} ${base >= 0 ? "+" : ""}${base}${rule.printedBase ? ` (base ${base + 4} for Gunnery 4, moved 1 a Gunnery level, as the book prints)` : ""}`);
    if (rule.altitudeModifier === "altitude") {
        modifier += attacker.altitude;
        labels.push(`+${attacker.altitude} for altitude ${attacker.altitude}`);
    } else if (rule.altitudeModifier === "above-very-low") {
        const extra = Math.max(0, attacker.altitude - 2);
        modifier += extra;
        if (extra) labels.push(`+${extra} for altitude ${attacker.altitude} (above very low)`);
    }
    if (attacker.altitude === 1 && rules.maxAltitude !== null) {
        // TW family: strafing only; BattleSpace: every attack, less for a Clan OmniFighter.
        const noe = rules.noeModifier !== null ? (attacker.omniFighter ? rules.noeOmniModifier ?? 0 : rules.noeModifier) : (type === "strafe" ? 2 : 0);
        if (noe) {
            modifier += noe;
            labels.push(`+${noe} for NOE (altitude 1)`);
        }
    }
    let total = attacker.gunnery + modifier;
    if (attacker.otherModifiers) {
        total += attacker.otherModifiers;
        labels.push(`+${attacker.otherModifiers} for damage to the attacker`);
    }
    if (attacker.exceededSafeThrust && rules.exceededSafeThrustModifier) {
        total += rules.exceededSafeThrustModifier;
        labels.push(`+${rules.exceededSafeThrustModifier} attacker exceeded Safe Thrust this turn`);
    }
    result.modifier = modifier;
    result.baseToHit = total;
    result.autoMiss = total > 12;
    result.autoHit = total <= 2;
    return result;
}

const SCATTER_2D6_HEXES: Record<number, number> = { 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 2, 9: 3, 10: 4, 11: 5 };

export interface IBombScatterRolls {
    marginOfFailure: number;
    /** 1D6 direction on the scatter diagram. */
    direction: number;
    /** TW does not use it; 1D6 for the distance in AT2, AT2R and BattleSpace; 2D6 for AeroTech (1986). */
    distanceRoll: number;
}

/** Where a missed bomb lands: how many hexes from the aimed hex, and which direction. AeroTech 1986 jams on a 2 or 12. */
export function getBombScatter(edition: AeroGroundEdition, rolls: IBombScatterRolls): { hexes: number; direction: number; jammed: boolean } {
    const kind = AERO_GROUND_RULES[edition].scatter;
    if (kind === "margin") return { hexes: Math.max(0, rolls.marginOfFailure), direction: rolls.direction, jammed: false };
    if (kind === "d6") return { hexes: rolls.distanceRoll, direction: rolls.direction, jammed: false };
    const jammed = rolls.distanceRoll === 2 || rolls.distanceRoll === 12;
    return { hexes: jammed ? 0 : SCATTER_2D6_HEXES[rolls.distanceRoll] ?? 0, direction: rolls.direction, jammed };
}
