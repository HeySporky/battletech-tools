// Airship, Fixed-Wing and Satellite Support Vehicles: the rules they do not share with ground Support Vehicles
// (TechManual pp.118-139; Tactical Operations: Advanced Units & Equipment pp.16, 52-71; Total Warfare pp.204-207).
// They use the Support Vehicle construction tables (support-vehicle-construction.ts) and aerospace movement and
// combat; the fighter builder makes them (aerospace-fighter.ts).

import {
    getSupportVehicleWeightClass, ISupportVehicleWeightClass, SUPPORT_AIRCRAFT_FUEL_KG_PER_POINT, SUPPORT_VEHICLE_WEIGHT_CLASSES,
    SupportAircraftMotive, SupportVehicleEngineTag, SupportVehicleTechRating,
} from "./support-vehicle-construction";

export function getSupportAircraftWeightClass(motive: SupportAircraftMotive, tons: number): ISupportVehicleWeightClass | null {
    return getSupportVehicleWeightClass(motive, tons);
}

/** Heaviest of each type: Fixed-Wing 200 tons, Airship 1,000 (Large, TO:AUE), Satellite 300 (TM p.120; TO:AUE p.57). */
export function getSupportAircraftMaxTonnage(motive: SupportAircraftMotive): number {
    return Math.max(...SUPPORT_VEHICLE_WEIGHT_CLASSES.filter((row) => row.motive === motive).map((row) => row.maxTons));
}

/** "Airships have a Maximum Safe Thrust of 2 and may choose Thrust Points in multiples of 0.25" (TM p.127). */
export const AIRSHIP_MAX_SAFE_THRUST = 2;
export const AIRSHIP_THRUST_STEP = 0.25;

/**
 * Max Thrust = Safe Thrust x 1.5, rounded up; an Airship's is rounded up to the next 0.25 (TM p.127). A Satellite
 * has none: its engines only keep station (TO:AUE p.62).
 */
export function getSupportAircraftMaxThrust(motive: SupportAircraftMotive, safeThrust: number): number {
    if (motive === "satellite") return 0;
    if (motive === "airship") return Math.ceil(safeThrust * 1.5 / AIRSHIP_THRUST_STEP - 1e-9) * AIRSHIP_THRUST_STEP;
    return Math.ceil(safeThrust * 1.5 - 1e-9);
}

/**
 * Structural Integrity (TM p.130; TO:AUE pp.60, 65): an Airship's is its Safe Thrust or 2 percent of its tonnage
 * (rounded down), whichever is higher, at least 1; a Fixed-Wing's is its Safe Thrust; a Satellite's is 1. A
 * fractional Airship Safe Thrust counts rounded down.
 */
export function getSupportAircraftStructuralIntegrity(motive: SupportAircraftMotive, safeThrust: number, tons: number): number {
    if (motive === "satellite") return 1;
    if (motive === "airship") return Math.max(1, Math.floor(safeThrust), Math.floor(tons * 0.02 + 1e-9));
    return Math.max(0, Math.floor(safeThrust));
}

/** Engines an Airship or Prop-Driven Fixed-Wing runs without fuel (TM p.129; TO:AUE p.62). */
const FUELLESS_ENGINES: SupportVehicleEngineTag[] = ["solar", "fission", "fusion"];

/**
 * Kilograms per Fuel Point (Airship/Fixed Wing Support Vehicle Fuel Table, TM p.128; Large Airships TO:AUE p.63), or
 * null when the unit needs no Fuel Points: an Airship or Prop-Driven Fixed-Wing with a solar, fission or fusion
 * engine, and a Satellite (which carries station-keeping fuel by the burn day instead). Airships and Prop-Driven
 * Fixed-Wings with other engines pay three-quarters of the weight, rounded up to the kilogram.
 */
export function getSupportAircraftFuelKgPerPoint(motive: SupportAircraftMotive, size: "small" | "medium" | "large",
    engineTechRating: SupportVehicleTechRating, engine: SupportVehicleEngineTag, prop: boolean): number | null {
    if (motive === "satellite") return null;
    const propulsion = motive === "airship" || prop;
    if (propulsion && FUELLESS_ENGINES.includes(engine)) return null;
    const row = motive === "airship" && size === "large" ? "largeAirship" : size;
    const kg = SUPPORT_AIRCRAFT_FUEL_KG_PER_POINT[row][engineTechRating];
    return propulsion ? Math.ceil(kg * 0.75 - 1e-9) : kg;
}

/**
 * A Fixed-Wing Support Vehicle's Damage Threshold for a facing: 0 with only BAR 2 armor, 1 with BAR 3 to 9 whatever
 * the armor, and the standard tenth of the armor, rounded up, with BAR 10 (TW p.206).
 */
export function getFixedWingDamageThreshold(bar: number, armorPoints: number): number {
    if (bar >= 10) return Math.ceil(armorPoints / 10);
    return bar <= 2 ? 0 : 1;
}

/**
 * Airship Velocity Table (TW p.204): the Thrust Points an Airship may spend in each turn of its four-turn cycle at
 * each velocity, from 0.25 to 3.
 */
export const AIRSHIP_VELOCITY_TABLE: { velocity: number; thrustPerTurn: [number, number, number, number] }[] = [
    { velocity: 0.25, thrustPerTurn: [1, 0, 0, 0] },
    { velocity: 0.5, thrustPerTurn: [1, 0, 1, 0] },
    { velocity: 0.75, thrustPerTurn: [1, 0, 1, 1] },
    { velocity: 1, thrustPerTurn: [1, 1, 1, 1] },
    { velocity: 1.25, thrustPerTurn: [2, 1, 1, 1] },
    { velocity: 1.5, thrustPerTurn: [2, 1, 2, 1] },
    { velocity: 1.75, thrustPerTurn: [2, 1, 2, 2] },
    { velocity: 2, thrustPerTurn: [2, 2, 2, 2] },
    { velocity: 2.25, thrustPerTurn: [3, 2, 2, 2] },
    { velocity: 2.5, thrustPerTurn: [3, 2, 3, 2] },
    { velocity: 2.75, thrustPerTurn: [3, 2, 3, 3] },
    { velocity: 3, thrustPerTurn: [3, 3, 3, 3] },
];

/** Thrust Points to spend this turn of the cycle (turn 1-4) at a velocity; an Airship over Velocity 3 goes out of control (TW p.205). */
export function getAirshipThrustThisTurn(velocity: number, cycleTurn: number): number {
    const row = AIRSHIP_VELOCITY_TABLE.find((entry) => Math.abs(entry.velocity - velocity) < 1e-9);
    if (!row) return 0;
    return row.thrustPerTurn[Math.max(1, Math.min(4, Math.floor(cycleTurn))) - 1];
}

/**
 * Airship Random Altitude Change Table (TW p.205): an Airship that goes out of control after a hit rolls 2D6 here in
 * place of losing 1D6 altitude. Positive climbs, negative drops; no higher than Altitude 10 on a low-altitude map.
 */
export function getAirshipRandomAltitudeChange(roll: number): number {
    const r = Math.max(2, Math.min(12, Math.floor(roll)));
    const changes = [-3, -2, -1, -1, 0, 0, 0, 0, 1, 1, 2];
    return changes[r - 2];
}

/** Satellite orbit roll (TO:AUE p.16; errata v7.0): 2D6 against 8 when placed in orbit or changing it. */
export function describeSatelliteOrbitRoll(roll: number): string {
    const failure = 8 - Math.floor(roll);
    if (failure <= 0) return `Orbit roll ${roll} (8+): the satellite reaches its orbit`;
    if (failure <= 2) return `Orbit roll ${roll} (8+), failed by ${failure}: the orbit change takes twice as long`;
    if (failure <= 5) return `Orbit roll ${roll} (8+), failed by ${failure}: the orbit decays in 3D6 weeks (errata v7.0; the book prints 2D10)`;
    return `Orbit roll ${roll} (8+), failed by ${failure}: the satellite spirals into the body it orbits`;
}
