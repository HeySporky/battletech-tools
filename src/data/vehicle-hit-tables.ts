// Combat vehicle hit location, critical hit and motive system damage tables, transcribed from the
// Total Warfare record sheets (Ground Vehicle, VTOL and Naval Vehicle sheets, which cite Combat,
// TW p. 192, and Rotor Hits, TW p. 197) with Total Warfare Errata 2.2 applied.

export type VehicleAttackDirection = "front" | "rear" | "left" | "right";

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

export const getVehicleHitLocation = (roll: number, direction: VehicleAttackDirection, isVTOL: boolean): IVehicleHitLocationResult => {
    const column = direction === "front" || direction === "rear" ? direction : "side";
    const row = (isVTOL ? VTOL_HIT_LOCATIONS : GROUND_HIT_LOCATIONS)[column][Math.max(2, Math.min(12, Math.floor(roll))) - 2];
    return { area: row[0], critical: row[1], motive: row[2] };
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
export const VEHICLE_MOTIVE_DIRECTION_MODIFIER: Record<VehicleAttackDirection, number> = { front: 0, rear: 1, left: 2, right: 2 };

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
