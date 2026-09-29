// Combat vehicle hit location, critical hit and motive system damage tables, transcribed from the
// Total Warfare record sheets (Ground Vehicle, VTOL and Naval Vehicle sheets, which cite Combat,
// TW p. 192, and Rotor Hits, TW p. 197) with Total Warfare Errata 2.2 applied.

// Superheavy vehicles are attacked from six directions: front, rear and the four split sides (TO, Super-Heavy
// Vehicle Record Sheet); other vehicles from four.
export type VehicleAttackDirection = "front" | "rear" | "left" | "right" | "frontLeft" | "frontRight" | "rearLeft" | "rearRight";

export const isRearwardAttack = (direction: VehicleAttackDirection): boolean => direction === "rear" || direction === "rearLeft" || direction === "rearRight";

// "side" is the side attacked; "turret" falls back to that side on a vehicle with no turret.
export type VehicleHitArea = "front" | "rear" | "left" | "right" | "side" | "turret" | "rotor";

export interface IVehicleHitLocationResult {
    area: VehicleHitArea;
    critical: boolean;  // roll once on the Critical Hits Table for this location
    motive: boolean;    // roll once on the Motive System Damage Table (ground and naval only)
}

type HitRow = [VehicleHitArea, boolean, boolean];
const h = (area: VehicleHitArea, critical = false, motive = false): HitRow => [area, critical, motive];

// Ground Combat Vehicle Hit Location Table; the Naval Combat Vehicle table is identical.
// Columns: front, rear, side attacks; rows: 2D6 roll 2-12.
const GROUND_HIT_LOCATIONS: Record<"front" | "rear" | "side", HitRow[]> = {
    front: [h("front", true), h("front", false, true), h("front", false, true), h("right", false, true), h("front"), h("front"), h("front"), h("left", false, true), h("turret"), h("turret"), h("turret", true)],
    rear: [h("rear", true), h("rear", false, true), h("rear", false, true), h("left", false, true), h("rear"), h("rear"), h("rear"), h("right", false, true), h("turret"), h("turret"), h("turret", true)],
    side: [h("side", true), h("side", false, true), h("side", false, true), h("front", false, true), h("side"), h("side"), h("side", true), h("rear", false, true), h("turret"), h("turret"), h("turret", true)],
};

// VTOL Combat Vehicle Hit Location Table. Rotor hits deal Damage Value / 10 (round up), TW p. 197.
const VTOL_HIT_LOCATIONS: Record<"front" | "rear" | "side", HitRow[]> = {
    front: [h("front", true), h("rotor"), h("rotor"), h("right"), h("front"), h("front"), h("front"), h("left"), h("rotor"), h("rotor"), h("rotor", true)],
    rear: [h("rear", true), h("rotor"), h("rotor"), h("left"), h("rear"), h("rear"), h("rear"), h("right"), h("rotor"), h("rotor"), h("rotor", true)],
    side: [h("side", true), h("rotor"), h("rotor"), h("front"), h("side"), h("side"), h("side", true), h("rear"), h("rotor"), h("rotor"), h("rotor", true)],
};

const tableRow = (rows: HitRow[], roll: number): IVehicleHitLocationResult => {
    const row = rows[Math.max(2, Math.min(12, Math.floor(roll))) - 2];
    return { area: row[0], critical: row[1], motive: row[2] };
};

export const getVehicleHitLocation = (roll: number, direction: VehicleAttackDirection, isVTOL: boolean): IVehicleHitLocationResult => {
    const column = direction === "front" || direction === "rear" ? direction : "side";
    return tableRow((isVTOL ? VTOL_HIT_LOCATIONS : GROUND_HIT_LOCATIONS)[column], roll);
};

// Super-Heavy Vehicle Hit Location Table (Tactical Operations, Super-Heavy Vehicle Record Sheet; TO p. 378 has
// Super-Heavy Combat Vehicles use it). Columns: front, rear, front side and rear side attacks. "Side" is the
// split side attacked (front side results strike the front-left/right armor, rear side results the
// rear-left/right armor); a Right/Left Side result strikes that side's half nearest the attack.
const SUPERHEAVY_HIT_LOCATIONS: Record<"front" | "rear" | "frontSide" | "rearSide", HitRow[]> = {
    front: [h("front", true), h("right", false, true), h("front", false, true), h("front", false, true), h("front"), h("front"), h("front"), h("front", false, true), h("turret"), h("turret"), h("turret", true)],
    rear: [h("rear", true), h("left", false, true), h("rear", false, true), h("rear", false, true), h("rear"), h("rear"), h("rear"), h("rear", false, true), h("turret"), h("turret"), h("turret", true)],
    frontSide: [h("side", true), h("front", false, true), h("side", false, true), h("side"), h("side"), h("side"), h("side", true), h("side", false, true), h("turret"), h("turret"), h("turret", true)],
    rearSide: [h("side", true), h("rear", false, true), h("side", false, true), h("side"), h("side"), h("side"), h("side", true), h("side", false, true), h("turret"), h("turret"), h("turret", true)],
};

export const getSuperheavyVehicleHitLocation = (roll: number, direction: VehicleAttackDirection): IVehicleHitLocationResult => {
    const column = direction === "front" || direction === "rear" ? direction : isRearwardAttack(direction) ? "rearSide" : "frontSide";
    return tableRow(SUPERHEAVY_HIT_LOCATIONS[column], roll);
};

/**
 * Vehicular Dual Turret (TO p. 347): which turret a Turret hit strikes. Roll 1D6, -2 for hits through the
 * front arc, +2 through the rear arc: 3 or less strikes the forward turret, 4 or more the rear turret.
 * Location tags: "turret2" is the forward turret and "turret" the rear one on a dual-turret vehicle.
 */
export const getDualTurretHit = (roll: number, direction: VehicleAttackDirection): "turret" | "turret2" => {
    const modifier = direction === "front" ? -2 : direction === "rear" ? 2 : 0;
    return roll + modifier <= 3 ? "turret2" : "turret";
};

export type VehicleCriticalEffect =
    | "none" | "driverHit" | "commanderHit" | "coPilotHit" | "pilotHit" | "crewStunned" | "crewKilled"
    | "weaponMalfunction" | "weaponDestroyed" | "stabilizer" | "sensors" | "engineHit" | "fuelTank"
    | "ammunition" | "cargoHit" | "turretJam" | "turretLocks" | "turretBlownOff"
    | "rotorDamage" | "flightStabilizer" | "rotorsDestroyed";

export type VehicleCriticalColumn = "front" | "side" | "rear" | "turret" | "rotor";

// Rows: 2D6 roll 6-12 (2-5 is no critical hit).
const GROUND_CRITICALS: Record<Exclude<VehicleCriticalColumn, "rotor">, VehicleCriticalEffect[]> = {
    front: ["driverHit", "weaponMalfunction", "stabilizer", "sensors", "commanderHit", "weaponDestroyed", "crewKilled"],
    side: ["cargoHit", "weaponMalfunction", "crewStunned", "stabilizer", "weaponDestroyed", "engineHit", "fuelTank"],
    rear: ["weaponMalfunction", "cargoHit", "stabilizer", "weaponDestroyed", "engineHit", "ammunition", "fuelTank"],
    turret: ["stabilizer", "turretJam", "weaponMalfunction", "turretLocks", "weaponDestroyed", "ammunition", "turretBlownOff"],
};

// VTOL Combat Vehicle Critical Hits Table (TW p. 196; errata 2.2 renames Engine Hit to Engine Damage).
const VTOL_CRITICALS: Record<Exclude<VehicleCriticalColumn, "turret">, VehicleCriticalEffect[]> = {
    front: ["coPilotHit", "weaponMalfunction", "stabilizer", "sensors", "pilotHit", "weaponDestroyed", "crewKilled"],
    side: ["weaponMalfunction", "cargoHit", "stabilizer", "weaponDestroyed", "engineHit", "ammunition", "fuelTank"],
    rear: ["cargoHit", "weaponMalfunction", "stabilizer", "weaponDestroyed", "sensors", "engineHit", "fuelTank"],
    rotor: ["rotorDamage", "rotorDamage", "rotorDamage", "flightStabilizer", "flightStabilizer", "rotorsDestroyed", "rotorsDestroyed"],
};

/**
 * The critical hit for a 2D6 roll. Fuel Tank is ICE only (fusion engines take an Engine Hit
 * instead); Ammunition with no ammunition aboard is Weapon Destroyed.
 */
export const getVehicleCriticalEffect = (
    roll: number,
    column: VehicleCriticalColumn,
    isVTOL: boolean,
    options: { fusionEngine: boolean; carriesAmmo: boolean },
): VehicleCriticalEffect => {
    const r = Math.floor(roll);
    if (r < 6) return "none";
    const table = isVTOL ? VTOL_CRITICALS : GROUND_CRITICALS;
    const effects = (table as Record<string, VehicleCriticalEffect[]>)[column];
    if (!effects) return "none";
    const effect = effects[Math.min(12, r) - 6];
    if (effect === "fuelTank" && options.fusionEngine) return "engineHit";
    if (effect === "ammunition" && !options.carriesAmmo) return "weaponDestroyed";
    return effect;
};

export const VEHICLE_CRITICAL_EFFECT_NAMES: Record<VehicleCriticalEffect, string> = {
    none: "No Critical Hit",
    driverHit: "Driver Hit",
    commanderHit: "Commander Hit",
    coPilotHit: "Co-Pilot Hit",
    pilotHit: "Pilot Hit",
    crewStunned: "Crew Stunned",
    crewKilled: "Crew Killed",
    weaponMalfunction: "Weapon Malfunction",
    weaponDestroyed: "Weapon Destroyed",
    stabilizer: "Stabilizer",
    sensors: "Sensors",
    engineHit: "Engine Hit",
    fuelTank: "Fuel Tank",
    ammunition: "Ammunition",
    cargoHit: "Cargo/Infantry Hit",
    turretJam: "Turret Jam",
    turretLocks: "Turret Locks",
    turretBlownOff: "Turret Blown Off",
    rotorDamage: "Rotor Damage",
    flightStabilizer: "Flight Stabilizer Hit",
    rotorsDestroyed: "Rotors Destroyed",
};

export type VehicleMotiveDamageLevel = "none" | "minor" | "moderate" | "heavy" | "immobilized";

// Motive System Damage Table (TW p. 193): attack direction and vehicle type modifiers.
// Superheavy split sides are side hits (+2), front or rear.
export const VEHICLE_MOTIVE_DIRECTION_MODIFIER: Record<VehicleAttackDirection, number> = {
    front: 0, rear: 1, left: 2, right: 2, frontLeft: 2, frontRight: 2, rearLeft: 2, rearRight: 2,
};

export const getVehicleMotiveTypeModifier = (motiveTag: string): number => {
    switch (motiveTag) {
        case "wheeled": return 2;
        case "hover": case "hydrofoil": return 3;
        case "wige": return 4;
        default: return 0; // Tracked, Naval
    }
};

export const getVehicleMotiveDamageLevel = (modifiedRoll: number): VehicleMotiveDamageLevel => {
    if (modifiedRoll >= 12) return "immobilized";
    if (modifiedRoll >= 10) return "heavy";
    if (modifiedRoll >= 8) return "moderate";
    if (modifiedRoll >= 6) return "minor";
    return "none";
};

// Facing After a Fall Table (TW p. 68), 1D6: the side that takes crash damage. A crashing VTOL uses it
// to pick the column of the VTOL Combat Vehicle Hit Location Table (TW p. 197).
const FACING_AFTER_FALL: VehicleAttackDirection[] = ["front", "right", "right", "rear", "left", "left"];

export const getFacingAfterFallDirection = (roll: number): VehicleAttackDirection =>
    FACING_AFTER_FALL[Math.min(6, Math.max(1, Math.floor(roll))) - 1];

// Falling and crash damage is applied in 5-point Damage Value groupings (TW pp. 68, 197). Damage comes from
// saved play state, so non-finite values give no groupings and the total is capped far above anything a legal
// vehicle can take (a 60-ton VTOL falling from elevation 100 takes 606).
export const MAX_GROUPED_DAMAGE = 5000;

export const getDamageGroupings = (damage: number, size: number = 5): number[] => {
    if (!Number.isFinite(damage) || !Number.isFinite(size) || size <= 0) return [];
    const total = Math.min(MAX_GROUPED_DAMAGE, Math.max(0, Math.floor(damage)));
    const groups: number[] = [];
    for (let left = total; left > 0; left -= size) groups.push(Math.min(size, left));
    return groups;
};
