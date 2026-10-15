import { generateUUID } from "../utils/generateUUID";
import { getSkillMultiplier } from "../data/skill-multipliers";
import {
    getDamageGroupings, getDualTurretHit, getFacingAfterFallDirection, getLargeNavalVesselHitLocation, getSuperheavyVehicleHitLocation, getVehicleCriticalEffect,
    getVehicleHitLocation, getVehicleMotiveDamageLevel, isRearwardAttack,
    getVehicleMotiveTypeModifier, VEHICLE_CRITICAL_EFFECT_NAMES,
    VEHICLE_MOTIVE_DIRECTION_MODIFIER, VehicleAttackDirection, VehicleCriticalColumn, VehicleCriticalEffect, VehicleHitArea, VehicleMotiveDamageLevel,
} from "../data/vehicle-hit-tables";
import Pilot, { IPilot } from "./pilot";
import { AlphaStrikeUnit, IASMULUnit } from "./alpha-strike-unit";
import { mechArmorTypes } from "../data/mech-armor-types";
import { mechEngineOptions } from "../data/mech-engine-options";
import { engineMeetsRequirement, FUSION_ENGINE_TAGS, getLargeEngineType, mechEngineTypes } from "../data/mech-engine-types";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { btTechOptions } from "../data/tech-options";
import { btEraOptions, findEraByTag, getClosestEraForTech, getErasForTech } from "../data/era-options";
import { getVehicleMotiveType, getVehicleSuspensionFactor, vehicleMotiveTypes } from "../data/vehicle-motive-types";
import {
    getLargeVesselTemplate, getSupportVehicleBaseCrew, getSupportVehicleChassisModification, getSupportVehicleEngine, getSupportVehicleEngineWeight,
    getSupportVehicleStructurePoints, ILargeVesselTemplate,
    getSupportVehicleGunners, getSupportVehicleItemSlots, getSupportVehicleMaxArmor, getSupportVehicleOfficers, getSupportVehicleRangeKm,
    getSupportVehicleStructureWeight, getSupportVehicleWeightClass, ISupportVehicleEngine, ISupportVehicleWeightClass,
    roundSupportVehicleWeight, SUPPORT_VEHICLE_ARMOR_REQUIRED_MODIFICATIONS, SUPPORT_VEHICLE_CHASSIS_COST_PER_TON,
    SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS, SUPPORT_VEHICLE_COST_TECH_MULTIPLIER, SUPPORT_VEHICLE_COST_TONNAGE_DIVISOR,
    SUPPORT_VEHICLE_ENGINE_COST_PER_TON, SUPPORT_VEHICLE_ENGINES, SUPPORT_VEHICLE_FIRE_CONTROL, SUPPORT_VEHICLE_HEAT_SINK_COST,
    SUPPORT_VEHICLE_MIN_TONNAGE, SUPPORT_VEHICLE_MOTIVE_MODIFICATION, SUPPORT_VEHICLE_MOTIVES,
    SUPPORT_VEHICLE_POWER_AMPLIFIER_COST_PER_TON, SUPPORT_VEHICLE_SMALL_LIMIT, SUPPORT_VEHICLE_TECH_RATINGS,
    SUPPORT_VEHICLE_TURRET_COST_PER_TON, SUPPORT_VEHICLE_WEIGHT_CLASSES, SupportVehicleEngineTag, SupportVehicleFireControl, SupportVehicleMotive,
    SupportVehicleTechRating, ULTRA_LIGHT_MAX_BAR,
} from "../data/support-vehicle-construction";
import { supportVehicleArmor } from "../data/support-vehicle-armor";
import {
    buildSupportVehicleLightWeapon, findSupportVehicleLightWeapon, PINTLE_WEIGHT_FACTOR,
} from "../data/support-vehicle-light-weapons";
import { findInfantryWeapon } from "../data/infantry-weapons";
import {
    getVehicleBayAlphaStrikeSpecials, getVehicleBayCost, getVehicleBaySlots, getVehicleBayType, getVehicleBayWeight, IVehicleBay,
    MAX_VEHICLE_BAY_COUNT, MAX_VEHICLE_BAYS, MAX_VEHICLE_CARGO_TONS, normalizeVehicleBays, VEHICLE_BAY_TYPES,
} from "../data/vehicle-transport-bays";
import { CUSTOM_HOMEBREW_RULES_LEVEL, equipmentMatchesIdentifier, getAmmoBattleValuePerTon, getCompatibleAmmo, getEffectiveIntroduction, getEquipmentListByTech, getEquipmentRulesLevel, isEquipmentWithinRulesLevel, getStarLeagueCarryOverDates, getWeaponShotsPerTon } from "../data/equipment-registry";
import { isTargetingComputerWeapon, sizeVariableEquipment } from "../data/variable-equipment";
import { getWeaponExplosionDamage } from "../data/weapon-explosions";
import { findByTag, matchesTag } from "../data/tag-match";
import { getMovementModifier } from "../utils";
import {
    IArmorType,
    IEngineType,
    IEquipmentItem,
    IEras,
    IHeatSync,
    ITechDates,
    ITechOptions,
    IVehicleArmorAllocation,
    IVehicleMotiveType,
    IVehicleStructureAllocation,
    VehicleLocation,
} from "../data/data-interfaces";

// Combat Vehicle construction rules (TechManual). Shares the engine/armor/heat sink/equipment
// catalogs with BattleMech - only chassis-specific rules (locations, structure, motive systems)
// are modeled separately here.

export interface IVehicleEquipmentExport {
    tag: string;
    location?: string;
    rear?: boolean;
    uuid?: string;
    /** On an OmniVehicle: true for a pod-mounted item, absent for one fixed to the base chassis. */
    pod?: boolean;
    /** A Light or Medium weapon's extra clips. */
    size?: number;
    /** A half-ton bin of machine gun, nail gun or rivet gun ammunition (TM pp.107, 137). */
    halfTon?: boolean;
    /** A Light or Medium weapon on a pintle (TM p.234). */
    pintle?: boolean;
    currentAmmo?: number;
    selectedAmmoBinUUID?: string;
    currentAdditionalArmor?: number;
}

/** An Alpha Strike damage value: a whole number, or minimal damage (0*). */
export interface IVehicleASDamageValue {
    damage: number;
    minimal: boolean;
}

export interface IVehicleAlphaStrikeStats {
    size: number;
    movement: number;
    movementType: string;
    jumpMovement: number;
    tmm: number;
    damage: { short: number; medium: number; long: number; extreme: number };
    /** The same damage with minimal (0*) flags, as printed on the card. */
    damageValues: { short: IVehicleASDamageValue; medium: IVehicleASDamageValue; long: IVehicleASDamageValue; extreme: IVehicleASDamageValue };
    armor: number;
    structure: number;
    overheat: number;
    pointValue: number;
    specialAbilities: string[];
    /**
     * An exceptionally large Support Vehicle's firing arcs (LG, VLG, SLG): front, left (fore- and aft-side), right,
     * rear and each turret apart (ASC p.103). Absent on other vehicles.
     */
    arcs?: { name: string; damage: { short: IVehicleASDamageValue; medium: IVehicleASDamageValue; long: IVehicleASDamageValue; extreme: IVehicleASDamageValue } }[];
    calcLog: string;
}

/** Card text for a damage value: 0* for minimal damage. */
export function formatVehicleASDamage(value: IVehicleASDamageValue): string {
    return value.minimal ? "0*" : `${value.damage}`;
}

export type VehicleMovementMode = "stationary" | "cruise" | "flank" | "jump";

/** Motive System Damage Table results, in the order they were taken (TW p. 193). */
export type VehicleMotiveHit = "minor" | "moderate" | "heavy" | "immobilized";

/** Legacy (pre-table) motive damage flags, still read from older saves. */
export interface IVehicleMotiveDamage {
    minor: boolean;
    moderate: boolean;
    heavy: boolean;
    immobilized: boolean;
}

/** Combat vehicle critical hits (TW pp. 194-198). */
export interface IVehicleCriticalHits {
    driverHit: boolean;
    commanderHit: boolean;
    /** VTOL Co-Pilot Hit: +1 to all to-hit rolls (TW p. 197). */
    coPilotHit: boolean;
    /** VTOL Pilot Hit: +2 to all Driving Skill Rolls (TW p. 197). */
    pilotHit: boolean;
    /** Crew Stunned this turn: no faster than Cruising and no other actions (TW p. 194). */
    crewStunned: boolean;
    /** Further turns of Crew Stunned still to serve, starting next turn. */
    crewStunnedTurns: number;
    crewKilled: boolean;
    engineHit: boolean;
    fuelTankHit: boolean;
    ammoExploded: boolean;
    cargoHit: boolean;
    turretJammed: boolean;
    turretLocked: boolean;
    turretBlownOff: boolean;
    /** Set when a turret's internal structure is gone. */
    turretDestroyed: boolean;
    sensorHits: number;
    stabilizers: VehicleLocation[];
    /** VTOL Flight Stabilizer Hit: Cruising only, +3 Driving, +1 to-hit (TW p. 198). */
    flightStabilizer: boolean;
    /** VTOL Rotor Damage critical hits: -1 Cruising MP each (TW p. 197). */
    rotorDamage: number;
    rotorsDestroyed: boolean;
    /** Large Naval Vessel crew hits, marked off like a DropShip's: +1 each to Gunnery and Piloting, dead at 6 (TO:AUE p.27). */
    crewHits: number;
    /** Large Naval Vessel Engine Hits that were not shrugged off: -1 Cruising MP each (TO:AUE p.27). */
    engineHits: number;
    /** Large Naval Vessel Ammunition critical hits: -1 Cruising MP each (TO:AUE p.27). */
    ammoHits: number;
}

/** Damage and status tracked while a vehicle is in play. */
export interface IVehicleInPlay {
    armorDamage: Partial<Record<VehicleLocation, number>>;
    structureDamage: Partial<Record<VehicleLocation, number>>;
    motiveHits: VehicleMotiveHit[];
    /** VTOL rotor hits: each costs 1 Cruising MP (TW p. 196). */
    rotorHits: number;
    criticals: IVehicleCriticalHits;
    jammedWeapons: string[];
    destroyedWeapons: string[];
    movementMode: VehicleMovementMode;
    hexesMoved: number;
    /** A VTOL or WiGE on the ground (not airborne). */
    landed: boolean;
    /**
     * Over water: a hover vehicle over Depth 1+ water sinks if immobilized (TW p. 193); a VTOL or WiGE
     * that crashes into a water hex is destroyed (TW pp. 197, 199).
     */
    overDeepWater: boolean;
    /** Turret facing in hexsides clockwise from the front (-2..3); returns forward in the End Phase (TW p. 99). */
    turretFacing: Partial<Record<VehicleTurretLocation, number>>;
    /** Naval locations whose hull has been breached; nothing in them works (TW pp. 121, 198). */
    breachedLocations: VehicleLocation[];
    /** A submarine on the surface is not underwater and makes no Hull Integrity rolls. */
    surfaced: boolean;
    /** A flying VTOL's elevation above the underlying terrain. */
    elevation: number;
    /** A VTOL or WiGE over a clear, paved, rough or building hex, where it can land after engine damage (TW pp. 197, 199). */
    overLandableTerrain: boolean;
    /** Crashed (rotor destroyed or engine failure in flight, TW pp. 197-199). */
    crashed: boolean;
    /** Destroyed by a crash: the VTOL exploded (TW p. 198) or came down in water (TW p. 197). */
    crashDestroyed: "" | "exploded" | "water";
    /** The current target stands or flies higher than this VTOL, so its chin turret cannot fire at it (TO p. 348). */
    targetAbove: boolean;
    /** Tons of Trailers this Tractor is pulling (TW p.205). */
    towedTons: number;
    /** This Trailer is hitched to a Tractor; unhitched, an engineless Trailer is an immobile target (TW p.205). */
    beingTowed: boolean;
    /** Legacy flags from saves made before motiveHits. */
    motiveDamage?: IVehicleMotiveDamage;
}

const newCriticals = (): IVehicleCriticalHits => ({
    driverHit: false, commanderHit: false, coPilotHit: false, pilotHit: false,
    crewStunned: false, crewStunnedTurns: 0, crewKilled: false, engineHit: false,
    fuelTankHit: false, ammoExploded: false, cargoHit: false,
    turretJammed: false, turretLocked: false, turretBlownOff: false, turretDestroyed: false,
    sensorHits: 0, stabilizers: [], flightStabilizer: false, rotorDamage: 0, rotorsDestroyed: false,
    crewHits: 0, engineHits: 0, ammoHits: 0,
});

const newInPlay = (): IVehicleInPlay => ({
    armorDamage: {},
    structureDamage: {},
    motiveHits: [],
    rotorHits: 0,
    criticals: newCriticals(),
    jammedWeapons: [],
    destroyedWeapons: [],
    movementMode: "stationary",
    hexesMoved: 0,
    landed: false,
    overDeepWater: false,
    turretFacing: {},
    breachedLocations: [],
    surfaced: false,
    elevation: 1,
    overLandableTerrain: true,
    crashed: false,
    crashDestroyed: "",
    targetAbove: false,
    towedTons: 0,
    beingTowed: false,
});

/** The fourth sensor hit makes it impossible for the vehicle to fire weapons (TW p. 195). */
export const VEHICLE_MAX_SENSOR_HITS = 4;

// Sanity bounds for play state read back from saves; far above anything a game reaches, low enough that no
// loop or display built on them can run away.
export const VEHICLE_MAX_ELEVATION = 100;
export const VEHICLE_MAX_HEXES_MOVED = 100;
const MAX_PLAY_COUNTER = 100;
/** Most equipment entries read from a save; far above any real design, low enough that import stays fast. */
export const MAX_VEHICLE_EQUIPMENT = 500;
/** Most Motive System Damage results kept from a save (every roll after Major damage changes nothing). */
export const MAX_MOTIVE_HITS = 20;

/** A string from saved data, or the fallback. */
const savedString = (value: unknown, fallback: string = ""): string => typeof value === "string" ? value : fallback;

/** Turret locations: a dual-turret vehicle's two, or a Large Naval Vessel's one to nine (TO:AUE p.60). */
export const VEHICLE_TURRET_LOCATIONS: VehicleTurretLocation[] = ["turret", "turret2", "turret3", "turret4", "turret5", "turret6", "turret7", "turret8", "turret9"];
export const isTurretLocation = (location: string | undefined): location is VehicleTurretLocation =>
    !!location && (VEHICLE_TURRET_LOCATIONS as string[]).includes(location);
/** A Large Naval Vessel's crew boxes, as a DropShip's (TO:AUE p.27). */
export const LARGE_NAVAL_CREW_BOXES = 6;

const VEHICLE_LOCATION_TAGS: VehicleLocation[] = ["front", "left", "right", "rear", "frontLeft", "frontRight", "rearLeft", "rearRight", "rotor", ...VEHICLE_TURRET_LOCATIONS];
const MOTIVE_HIT_LEVELS: VehicleMotiveHit[] = ["minor", "moderate", "heavy", "immobilized"];
const MOVEMENT_MODES: VehicleMovementMode[] = ["stationary", "cruise", "flank", "jump"];

/** A finite number from saved data, clamped to [min, max], or the fallback. */
const savedNumber = (value: unknown, fallback: number, min: number, max: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

const savedLocations = (value: unknown): VehicleLocation[] =>
    Array.isArray(value) ? VEHICLE_LOCATION_TAGS.filter((tag) => value.includes(tag)) : [];

const savedStrings = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const savedLocationPoints = (value: unknown): Partial<Record<VehicleLocation, number>> => {
    const result: Partial<Record<VehicleLocation, number>> = {};
    if (!isPlainObject(value)) return result;
    for (const tag of VEHICLE_LOCATION_TAGS) {
        if (typeof value[tag] === "number") result[tag] = savedNumber(value[tag], 0, 0, 10000);
    }
    return result;
};

/**
 * Rebuilds play state from a save, keeping only well-formed values. Saves can come from other people's backup
 * files, so every field is type-checked, filtered to known values and clamped; anything else takes its default.
 */
export const normalizeVehicleInPlay = (saved: unknown): IVehicleInPlay => {
    const defaults = newInPlay();
    if (!isPlainObject(saved)) return defaults;
    const flag = (value: unknown, fallback: boolean) => typeof value === "boolean" ? value : fallback;
    // Saves from before the Motive System Damage Table stored one flag per level.
    const legacy = isPlainObject(saved.motiveDamage) ? saved.motiveDamage : null;
    const motiveHits = (Array.isArray(saved.motiveHits)
        ? saved.motiveHits.filter((hit): hit is VehicleMotiveHit => MOTIVE_HIT_LEVELS.includes(hit as VehicleMotiveHit))
        : legacy ? MOTIVE_HIT_LEVELS.filter((level) => legacy[level] === true) : []).slice(0, MAX_MOTIVE_HITS);
    const c = isPlainObject(saved.criticals) ? saved.criticals : {};
    const criticals = { ...defaults.criticals };
    for (const key of Object.keys(criticals) as (keyof IVehicleCriticalHits)[]) {
        if (typeof criticals[key] === "boolean") (criticals as Record<string, unknown>)[key] = flag(c[key], false);
    }
    criticals.crewStunnedTurns = Math.floor(savedNumber(c.crewStunnedTurns, 0, 0, MAX_PLAY_COUNTER));
    criticals.sensorHits = Math.floor(savedNumber(c.sensorHits, 0, 0, VEHICLE_MAX_SENSOR_HITS));
    criticals.rotorDamage = Math.floor(savedNumber(c.rotorDamage, 0, 0, MAX_PLAY_COUNTER));
    criticals.crewHits = Math.floor(savedNumber(c.crewHits, 0, 0, LARGE_NAVAL_CREW_BOXES));
    criticals.engineHits = Math.floor(savedNumber(c.engineHits, 0, 0, MAX_PLAY_COUNTER));
    criticals.ammoHits = Math.floor(savedNumber(c.ammoHits, 0, 0, MAX_PLAY_COUNTER));
    criticals.stabilizers = savedLocations(c.stabilizers);
    // An Engine Hit also locks the turret (TW p. 195), whatever an older save recorded.
    if (criticals.engineHit) criticals.turretLocked = true;
    const turretFacing: Partial<Record<VehicleTurretLocation, number>> = {};
    if (isPlainObject(saved.turretFacing)) {
        for (const turret of VEHICLE_TURRET_LOCATIONS) {
            const facing = saved.turretFacing[turret];
            // The forward turret of a dual-turret vehicle cannot face the rear hexside (TO p. 347).
            const maxFacing = turret === "turret2" ? 2 : 3;
            if (typeof facing === "number" && Number.isInteger(facing) && facing >= -2 && facing <= maxFacing) turretFacing[turret] = facing;
        }
    }
    const crashDestroyed = saved.crashDestroyed === "exploded" || saved.crashDestroyed === "water" ? saved.crashDestroyed : "";
    return {
        armorDamage: savedLocationPoints(saved.armorDamage),
        structureDamage: savedLocationPoints(saved.structureDamage),
        motiveHits,
        rotorHits: Math.floor(savedNumber(saved.rotorHits, 0, 0, MAX_PLAY_COUNTER)),
        criticals,
        jammedWeapons: savedStrings(saved.jammedWeapons).slice(0, MAX_VEHICLE_EQUIPMENT),
        destroyedWeapons: savedStrings(saved.destroyedWeapons).slice(0, MAX_VEHICLE_EQUIPMENT),
        movementMode: MOVEMENT_MODES.includes(saved.movementMode as VehicleMovementMode) ? saved.movementMode as VehicleMovementMode : "stationary",
        hexesMoved: Math.floor(savedNumber(saved.hexesMoved, 0, 0, VEHICLE_MAX_HEXES_MOVED)),
        landed: flag(saved.landed, defaults.landed),
        overDeepWater: flag(saved.overDeepWater, defaults.overDeepWater),
        turretFacing,
        breachedLocations: savedLocations(saved.breachedLocations),
        surfaced: flag(saved.surfaced, defaults.surfaced),
        elevation: Math.floor(savedNumber(saved.elevation, defaults.elevation, 0, VEHICLE_MAX_ELEVATION)),
        overLandableTerrain: flag(saved.overLandableTerrain, defaults.overLandableTerrain),
        crashed: flag(saved.crashed, defaults.crashed),
        crashDestroyed,
        targetAbove: flag(saved.targetAbove, defaults.targetAbove),
        towedTons: savedNumber(saved.towedTons, 0, 0, MAX_VEHICLE_CARGO_TONS),
        beingTowed: flag(saved.beingTowed, defaults.beingTowed),
    };
};

/**
 * Cleans a raw saved design (for example from a restored backup) by loading it into a Vehicle and exporting it
 * again, and reports what had to change. Use it before storing or rendering saved vehicles.
 */
export const normalizeVehicleExport = (raw: unknown): { vehicle: IVehicleExport | null; issues: string[] } => {
    // An entry that is not a saved vehicle at all is dropped, not turned into a blank default vehicle.
    if (!isPlainObject(raw)) return { vehicle: null, issues: ["Skipped an entry that is not a saved vehicle"] };
    // Defined below the class; hoisted at call time.
    const loaded = new Vehicle(JSON.stringify(raw));
    const issues = [...loaded.getImportIssues()];
    return { vehicle: loaded.export(), issues };
};

/** Escapes text written into the HTML calculation logs, which the summary page renders as markup. */
const escapeLogText = (value: unknown): string => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Direct-Fire Energy and Pulse weapons stop working after an Engine Hit (TW p. 195). */
export const isDirectFireEnergyOrPulse = (item: IEquipmentItem): boolean =>
    !!item.weaponType && (item.weaponType.includes("DE") || item.weaponType.includes("P"));

export type VehicleTurretLocation = "turret" | "turret2" | "turret3" | "turret4" | "turret5" | "turret6" | "turret7" | "turret8" | "turret9";

/** Why a Motive System Damage roll is made: a hit (TW p. 193), a skid (TW p. 192) or a jump landing (TO p. 349). */
export type VehicleMotiveRollCause = "attack" | "skid" | "jump";

/** Armor-piercing autocannon sizes and their critical hit roll modifiers (TW p. 140). */
export const ARMOR_PIERCING_CRITICAL_MODIFIER: Record<2 | 5 | 10 | 20, number> = { 2: -4, 5: -3, 10: -2, 20: -1 };

// Vehicular jump jet landing roll: these replace the vehicle type modifiers (TO p. 349).
const JUMP_LANDING_MODIFIER: Record<string, number> = { tracked: 2, wheeled: 1, hover: -1, wige: -2 };

/** A die roll the rules call for after a hit or critical hit, resolved with resolveFollowUpRoll. */
export type VehicleFollowUpRoll =
    | { kind: "critical"; location: VehicleLocation; modifier?: number }
    | { kind: "motive"; direction: VehicleAttackDirection; cause?: VehicleMotiveRollCause; roughTerrain?: boolean; modifier?: number }
    | { kind: "engineSurvival" }
    | { kind: "hullBreach"; location: VehicleLocation; target: number }
    /** FrankenVehicle: a damaged turret's mismatched linkages may lock it (Custom Homebrew). */
    | { kind: "turretLinkage"; target: number }
    | { kind: "drivingSkill"; reason: "pilotHit" | "engineDamage"; target: number }
    | { kind: "crashFacing"; damage: number }
    | { kind: "crashHit"; damage: number; direction: VehicleAttackDirection; fall: boolean };

/** The 'Mech firing arc a weapon fires into; turret weapons fire into the forward arc rotated by the turret (TW p. 104). */
export interface IVehicleFiringArc {
    arc: "front" | "left" | "right" | "rear";
    /** Hexsides the turret is rotated clockwise from the front, or null for a body-mounted weapon. */
    turretRotation: number | null;
    /** A sponson weapon: 180 degrees on its side, from the hex row directly behind to the row directly ahead (TO p. 348). */
    sponson?: boolean;
}

export interface IVehicleDamageResult {
    armor: number;
    structure: number;
    locationDestroyed: boolean;
    /** Internal structure was damaged, so a critical hit roll is required (TW pp. 193, 197). */
    criticalRoll: boolean;
}

/**
 * FrankenVehicle (Custom Homebrew; the user's rule, 2026-10-14, after CO pp.213-214's FrankenMechs): a vehicle
 * carrying a turret taken from another vehicle. The chassis sets tonnage, motive type and structure.
 */
export interface IFrankenVehicle {
    /** Tonnage of the vehicle the turret came from, no heavier than this one: the turret takes its structure points. */
    turretDonorTonnage: number;
    /** What the chassis's own turret weighed with everything in it, in tons; 0 if it had none. */
    originalTurretWeight: number;
    /** Who fires the turret weapons: the commander, riding in the turret, or a gunner in the chassis. */
    turretGunner: "commander" | "chassis";
    turretDonorName?: string;
}

export interface IVehicleExport {
    uuid: string;
    lastUpdated: Date;
    name: string;
    model: string;
    nickname: string;
    tonnage: number;
    motiveType: string;
    hasTurret: boolean;
    dualTurret?: boolean;
    sponsonTurrets?: boolean;
    frankenVehicle?: IFrankenVehicle;
    /** An OmniVehicle: one base chassis whose pod-mounted equipment changes between configurations (TM pp.95-97). */
    omni?: boolean;
    jumpMP?: number;
    troopSpace?: number;
    /** Transport bays other than the troop space (TM p.239). */
    bays?: IVehicleBay[];
    tech: string;
    era: string;
    engineType: string;
    cruiseMP: number;
    armorType: string;
    armorAllocation: IVehicleArmorAllocation;
    /** Patchwork Armor: armor type tag by location; present only when armorType is "patchwork". */
    patchworkArmor?: Partial<Record<VehicleLocation, string>>;
    structureType: string;
    heatSinkType: string;
    additionalHeatSinks: number;
    equipment: IVehicleEquipmentExport[];
    /** Present only on a Support Vehicle (TM pp.116-139). */
    supportVehicle?: IVehicleSupportExport;
    pilot?: IPilot;
    inPlay?: IVehicleInPlay;
}

/** A Support Vehicle's construction choices: the parts of TM pp.116-139 that Combat Vehicles do not have. */
export interface IVehicleSupportExport {
    structuralTechRating: SupportVehicleTechRating;
    engine: SupportVehicleEngineTag;
    engineTechRating: SupportVehicleTechRating;
    /** An ICE running on alcohol or natural gas (TM p.127). */
    alternativeFuel?: boolean;
    fuelTons: number;
    chassisModifications: string[];
    /** Barrier Armor Rating, 2 to 10 (TM p.134). */
    bar: number;
    armorTechRating: SupportVehicleTechRating;
    fireControl: SupportVehicleFireControl;
    /** Crew carried above the minimum (TM p.131). */
    extraCrew?: number;
    /** Turrets on a Large Naval Vessel: up to one per hex of its length (TO:AUE p.60). */
    turrets?: number;
}

const newSupportVehicle = (): IVehicleSupportExport => ({
    structuralTechRating: "d", engine: "ice", engineTechRating: "d", fuelTons: 0.5, chassisModifications: [],
    bar: 5, armorTechRating: "d", fireControl: "none",
});

// Combat Vehicle internal structure weighs the same 10%/20% of tonnage as 'Mech structure,
// just without the per-location tonnage table (vehicles split points evenly per location instead).
const VEHICLE_STRUCTURE_MULTIPLIERS: Record<string, number> = {
    standard: 0.1,
    reinforced: 0.2,
};

/** A VTOL rotor mounts at most 2 armor points (TM, as implemented by MegaMek TestTank). */
export const VTOL_MAX_ROTOR_ARMOR = 2;

/** Highest engine rating without Large engines (TO:AUE; Experimental rules level here, as for 'Mechs). */
const MAX_STANDARD_ENGINE_RATING = 400;
const MAX_LARGE_ENGINE_RATING = 500;

const emptyArmorAllocation = (): IVehicleArmorAllocation => ({
    front: 0, left: 0, right: 0, rear: 0, turret: 0, rotor: 0,
    frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0, turret2: 0,
});

const LOCATION_NAMES: Record<VehicleLocation, string> = {
    front: "Front",
    left: "Left",
    right: "Right",
    rear: "Rear",
    frontLeft: "Front Left",
    frontRight: "Front Right",
    rearLeft: "Rear Left",
    rearRight: "Rear Right",
    rotor: "Rotor",
    turret: "Turret",
    turret2: "Front Turret",
    turret3: "Turret 3",
    turret4: "Turret 4",
    turret5: "Turret 5",
    turret6: "Turret 6",
    turret7: "Turret 7",
    turret8: "Turret 8",
    turret9: "Turret 9",
};

// Free heat sinks from the engine: fusion 10, fission 5, fuel cell 1, ICE none (as implemented by MegaMek Engine).

// Item slots an engine takes in a vehicle (as implemented by MegaMek Tank.getFreeSlots).
const ENGINE_ITEM_SLOTS: Record<string, number> = { light: 1, xl: 2, clan_xl: 1, xxl: 4, clan_xxl: 2, compact: -1 };

/** Vehicular jump jets: Advanced (TO:AUE); prototype 2650 (TH), production ~3083 (CHH), extinct 2840 (IO p. 35). */
export const VEHICLE_JUMP_JET_INTRODUCED = 3083;

export default class Vehicle {
    private _uuid: string = generateUUID();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _model: string = "";
    private _nickname: string = "";

    private _tonnage: number = 20;
    private _motiveType: IVehicleMotiveType = vehicleMotiveTypes[0];
    private _hasTurret: boolean = true;
    private _dualTurret: boolean = false;
    /** FrankenVehicle: the turret's donor; null on an ordinary vehicle. */
    private _frankenVehicle: IFrankenVehicle | null = null;
    private _sponsonTurrets: boolean = false;
    private _omni: boolean = false;
    private _podUUIDs: Set<string> = new Set();
    private _jumpMP: number = 0;
    private _troopSpace: number = 0;
    private _bays: IVehicleBay[] = [];
    // Set on a Support Vehicle, which replaces the Combat Vehicle structure, engine, armor and crew rules.
    private _support: IVehicleSupportExport | null = null;
    private _inPlay: IVehicleInPlay = newInPlay();
    // Rolls the rules call for after a hit, a critical hit or another roll; not saved.
    private _followUps: VehicleFollowUpRoll[] = [];
    private _importIssues: string[] = [];

    private _tech: ITechOptions = btTechOptions[0];
    private _era: IEras = btEraOptions[0];

    private _engineType: IEngineType = mechEngineTypes[0];
    private _cruiseMP: number = 3;

    private _armorType: IArmorType = mechArmorTypes[0];
    private _armorAllocation: IVehicleArmorAllocation = emptyArmorAllocation();
    public static readonly PATCHWORK_ARMOR_TAG = "patchwork";
    /** Patchwork Armor: the armor type tag of each location (TO:AUE p.189); standard where none is set. */
    private _patchworkArmor: Partial<Record<VehicleLocation, string>> = {};

    private _structureType: string = "standard";

    private _heatSinkType: IHeatSync = mechHeatSinkTypes[0];
    private _additionalHeatSinks: number = 0;

    private _equipmentList: IEquipmentItem[] = [];
    private _pilot: Pilot = new Pilot();

    private _weights: { name: string; weight: number }[] = [];
    private _battleValue: number = 0;
    private _calcLogBV: string = "";
    private _cost: number = 0;
    private _calcLogCost: string = "";
    private _currentTonnage: number = 0;
    private _remainingTonnage: number = 0;

    constructor(importJSON: string = "") {
        if (importJSON) {
            this.importJSON(importJSON);
        }
        this._calc();
    }

    public getUUID(): string {
        return this._uuid;
    }

    public getName(): string {
        return this._name;
    }

    public setName(name: string): string {
        this._name = name;
        return this._name;
    }

    public getModel(): string {
        return this._model;
    }

    public setModel(model: string): string {
        this._model = model;
        return this._model;
    }

    public getNickname(): string {
        return this._nickname;
    }

    public setNickname(nickname: string): string {
        this._nickname = nickname;
        return this._nickname;
    }

    public getTonnage(): number {
        return this._tonnage;
    }

    public setTonnage(tonnage: number): number {
        this._tonnage = this._support ? Vehicle._supportVehicleTonnage(Math.min(tonnage, this.getSupportVehicleMaxTonnage())) : tonnage;
        this._pruneLocations();
        this._calc();
        return this._tonnage;
    }

    /** Support Vehicles weigh from 100 kg, by the kilogram under 5 tons and by the half ton from 5 (TM p.120). */
    private static _supportVehicleTonnage(tonnage: number): number {
        const tons = Math.max(SUPPORT_VEHICLE_MIN_TONNAGE, Number.isFinite(tonnage) ? tonnage : SUPPORT_VEHICLE_MIN_TONNAGE);
        return tons < SUPPORT_VEHICLE_SMALL_LIMIT ? Math.round(tons * 1000) / 1000 : Math.round(tons * 2) / 2;
    }

    /**
     * Superheavy: heavier than the motive type's standard maximum (Advanced rules). A Large Support Vehicle has
     * the same six facings (TM p.124) but is Standard rules.
     */
    public isSuperheavy(): boolean {
        if (this._support) return this.getSupportVehicleWeightClass()?.size === "large";
        return this._tonnage > this._motiveType.standardMaxTonnage;
    }

    // --- Support Vehicles (TM pp.116-139) ---

    public isSupportVehicle(): boolean {
        return this._support !== null;
    }

    /** Builds the vehicle as a Support Vehicle, or back as a Combat Vehicle. Equipment it cannot carry goes unallocated. */
    public setSupportVehicle(support: boolean): boolean {
        if (support && !this._support) {
            if (!SUPPORT_VEHICLE_MOTIVES[this._motiveType.tag]) this._motiveType = getVehicleMotiveType("wheeled");
            this._support = newSupportVehicle();
            this._tonnage = Vehicle._supportVehicleTonnage(Math.min(this._tonnage, this.getSupportVehicleMaxTonnage()));
            this._jumpMP = 0;
            this._sponsonTurrets = false;
            this._removeDualTurret();
            if (this._motiveType.hasRotor) this._removeTurret();
        } else if (!support && this._support) {
            this._support = null;
            this._tonnage = Math.max(1, Math.round(this._tonnage));
            // Rail is a Support Vehicle motive type only (TO:AUE p.55).
            if (this._motiveType.supportOnly) this._motiveType = getVehicleMotiveType("wheeled");
        }
        this._pruneLocations();
        this._calc();
        return this.isSupportVehicle();
    }

    /** The Support Vehicle settings; null on a Combat Vehicle. A copy: change them through the setters. */
    public getSupportVehicleSettings(): IVehicleSupportExport | null {
        return this._support ? { ...this._support, chassisModifications: [...this._support.chassisModifications] } : null;
    }

    public getSupportVehicleMotive(): SupportVehicleMotive | null {
        return SUPPORT_VEHICLE_MOTIVES[this._motiveType.tag] ?? null;
    }

    public getSupportVehicleWeightClass(): ISupportVehicleWeightClass | null {
        const motive = this.getSupportVehicleMotive();
        if (!this._support || !motive) return null;
        // A hydrofoil may weigh no more than 100 tons (TM p.118).
        if (this.getSupportVehicleChassisModifications().includes("hydrofoil") && this._tonnage > 100) return null;
        return getSupportVehicleWeightClass(motive, this._tonnage);
    }

    /** Heaviest Support Vehicle of this motive type (TM p.118); a hydrofoil tops out at 100 tons. */
    public getSupportVehicleMaxTonnage(): number {
        const motive = this.getSupportVehicleMotive() ?? "wheeled";
        if (this._motiveType.tag === "hydrofoil") return 100;
        return Math.max(...SUPPORT_VEHICLE_WEIGHT_CLASSES.filter((row) => row.motive === motive).map((row) => row.maxTons));
    }

    private _isSmallSupportVehicle(): boolean {
        return !!this._support && this._tonnage < SUPPORT_VEHICLE_SMALL_LIMIT;
    }

    /** An advanced Support Vehicle of TO:AUE (Rail, Large Naval): Advanced rules, its own armor, crew and cost tables. */
    public isAdvancedSupportVehicle(): boolean {
        return !!this.getSupportVehicleWeightClass()?.advanced;
    }

    /** A Large Naval Vessel Support Vehicle: over 300 tons (TO:AUE p.55). */
    public isLargeNavalVessel(): boolean {
        return !!this._support && this.getSupportVehicleMotive() === "naval" && this._tonnage > 300;
    }

    /** A Large Naval Vessel's template: length in hexes, height and the attacker's to-hit modifier (TO:AUE p.57). */
    public getLargeVesselTemplate(): ILargeVesselTemplate | null {
        return this.isLargeNavalVessel() ? getLargeVesselTemplate("naval", this._tonnage) : null;
    }

    /** Turrets the vehicle may mount: one per hex of a Large Naval Vessel's length, none on a Large Rail unit (TO:AUE pp.60, 71). */
    public getMaxTurrets(): number {
        if (!this.canHaveTurret()) return 0;
        return this.getLargeVesselTemplate()?.hexes ?? 1;
    }

    public getTurretCount(): number {
        if (!this._hasTurret) return 0;
        if (this.isLargeNavalVessel()) return Math.max(1, Math.min(this.getMaxTurrets(), this._support?.turrets ?? 1));
        return this._dualTurret ? 2 : 1;
    }

    /** Sets how many turrets a Large Naval Vessel mounts; 0 removes them. */
    public setTurretCount(count: number): number {
        if (!this.isLargeNavalVessel() || !this._support) return this.getTurretCount();
        const turrets = Math.max(0, Math.min(this.getMaxTurrets(), Math.floor(Number.isFinite(count) ? count : 0)));
        if (turrets === 0) {
            this._removeTurret();
        } else {
            this._hasTurret = true;
            this._support.turrets = turrets;
        }
        this._pruneLocations();
        this._calc();
        return this.getTurretCount();
    }

    /** The Attacker To-Hit Modifier against a Large Naval Vessel, from its template (TO:AUE pp.25, 57). */
    public getTemplateToHitModifier(): number {
        return this.getLargeVesselTemplate()?.attackerToHit ?? 0;
    }

    /** Rounds a component weight the Support Vehicle way: up to the kilogram when Small, the half ton otherwise. */
    private _roundSupportWeight(tons: number): number {
        return roundSupportVehicleWeight(tons, this._isSmallSupportVehicle());
    }

    /**
     * The chassis modifications in force: those chosen, the one a hydrofoil or submarine motive type implies, and
     * Omni on an OmniVehicle (TM p.119).
     */
    public getSupportVehicleChassisModifications(): string[] {
        if (!this._support) return [];
        const mods = new Set(this._support.chassisModifications);
        const implied = SUPPORT_VEHICLE_MOTIVE_MODIFICATION[this._motiveType.tag];
        if (implied) mods.add(implied);
        if (this._omni) mods.add("omni");
        return SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS.map((mod) => mod.tag).filter((tag) => mods.has(tag));
    }

    /** Chassis modifications the motive type and size may take (TM p.122); the implied ones are not optional. */
    public getAvailableSupportVehicleChassisModifications(): string[] {
        const motive = this.getSupportVehicleMotive();
        if (!this._support || !motive) return [];
        const implied = new Set([SUPPORT_VEHICLE_MOTIVE_MODIFICATION[this._motiveType.tag], "omni"]);
        return SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS
            .filter((mod) => !implied.has(mod.tag) && !Object.values(SUPPORT_VEHICLE_MOTIVE_MODIFICATION).includes(mod.tag))
            .filter((mod) => (!mod.motives || mod.motives.includes(motive)) && (!mod.smallOnly || this._isSmallSupportVehicle()))
            .map((mod) => mod.tag);
    }

    public setSupportVehicleChassisModification(tag: string, installed: boolean): string[] {
        if (!this._support || !getSupportVehicleChassisModification(tag)) return this.getSupportVehicleChassisModifications();
        const mods = this._support.chassisModifications.filter((mod) => mod !== tag);
        if (installed) mods.push(tag);
        this._support.chassisModifications = mods;
        // A Convertible may not mount a turret (TM p.123).
        if (tag === "convertible" && installed) this._removeTurret();
        // A Trailer needs no engine; anything else needs one (TM p.126).
        if (tag === "trailer" && !installed && this._support.engine === "none") this._support.engine = "ice";
        this._pruneLocations();
        this._calc();
        return this.getSupportVehicleChassisModifications();
    }

    public setSupportVehicleTechRating(part: "structural" | "engine" | "armor", rating: string): void {
        if (!this._support || !SUPPORT_VEHICLE_TECH_RATINGS.includes(rating as SupportVehicleTechRating)) return;
        const value = rating as SupportVehicleTechRating;
        if (part === "structural") this._support.structuralTechRating = value;
        else if (part === "engine") this._support.engineTechRating = value;
        else this._support.armorTechRating = value;
        this._calc();
    }

    public getSupportVehicleEngine(): ISupportVehicleEngine | null {
        return this._support ? getSupportVehicleEngine(this._support.engine) ?? null : null;
    }

    /**
     * Engines this motive type may use (Base Support Vehicle Engine Compatibilities Table, TM p.127; TO:AUE p.62);
     * "none" only on a Trailer. The External engine is listed for Rail units; it needs the External Power Pickup.
     */
    public getAvailableSupportVehicleEngines(): ISupportVehicleEngine[] {
        const motive = this.getSupportVehicleMotive();
        if (!motive) return [];
        const trailer = this.getSupportVehicleChassisModifications().includes("trailer");
        return SUPPORT_VEHICLE_ENGINES.filter((engine) => !engine.incompatible.includes(motive) && (engine.tag !== "none" || trailer));
    }

    public setSupportVehicleEngine(tag: string): void {
        const engine = this.getAvailableSupportVehicleEngines().find((option) => option.tag === tag);
        if (!this._support || !engine) return;
        this._support.engine = engine.tag;
        if (engine.tag === "none") this._cruiseMP = 0;
        this._calc();
    }

    public setSupportVehicleAlternativeFuel(alternativeFuel: boolean): void {
        if (!this._support) return;
        this._support.alternativeFuel = alternativeFuel;
        this._calc();
    }

    /** Fuel tanks, in tons: by the kilogram on a Small Support Vehicle, by the half ton from 5 tons (TM p.128). */
    public setSupportVehicleFuel(tons: number): void {
        if (!this._support) return;
        const clamped = Math.max(0, Math.min(Number.isFinite(tons) ? tons : 0, this._tonnage));
        this._support.fuelTons = this._isSmallSupportVehicle() ? Math.round(clamped * 1000) / 1000 : Math.round(clamped * 2) / 2;
        this._calc();
    }

    /** Fuel carried, in tons; engines that need none (fission, fusion, solar, a Trailer's) carry none (TM p.127). */
    public getSupportVehicleFuelWeight(): number {
        return this._support && this.getSupportVehicleEngine()?.fuelPercentPer100Km !== null ? this._support.fuelTons : 0;
    }

    /** Operating range in kilometers on a full tank, or null for an engine that needs no fuel (TM p.128). */
    public getSupportVehicleRangeKm(): number | null {
        const engine = this.getSupportVehicleEngine();
        if (!this._support || !engine) return null;
        return getSupportVehicleRangeKm(engine, this.getEngineWeight(), this._support.fuelTons, !!this._support.alternativeFuel);
    }

    /** Barrier Armor Rating (TM p.134). Combat Vehicles are BAR 10. */
    public getBAR(): number {
        return this._support ? this._support.bar : 10;
    }

    public setBAR(bar: number): void {
        if (!this._support || !supportVehicleArmor.some((armor) => armor.bar === bar)) return;
        this._support.bar = bar;
        this._calc();
    }

    /** Kilograms per armor point at the vehicle's BAR and armor Tech Rating, or null where that armor does not exist (TM p.134). */
    public getSupportVehicleArmorKgPerPoint(): number | null {
        if (!this._support) return null;
        const support = this._support;
        const armor = supportVehicleArmor.find((entry) => entry.bar === support.bar);
        // Advanced Support Vehicles use their own armor table (TO:AUE p.69).
        const table = this.isAdvancedSupportVehicle() ? armor?.advancedKgPerPoint : armor?.kgPerPoint;
        return table?.[support.armorTechRating] ?? null;
    }

    /** Whether this BAR at this armor Tech Rating needs the Armored chassis modification (TM p.134; TO:AUE p.69). */
    private _armorNeedsArmoredChassis(): boolean {
        if (!this._support) return false;
        const support = this._support;
        const armor = supportVehicleArmor.find((entry) => entry.bar === support.bar);
        const ratings = this.isAdvancedSupportVehicle() ? armor?.advancedArmoredChassisRatings : armor?.armoredChassisRatings;
        return !!ratings?.includes(support.armorTechRating);
    }

    public getSupportVehicleFireControl(): SupportVehicleFireControl {
        return this._support?.fireControl ?? "advanced";
    }

    public setSupportVehicleFireControl(fireControl: string): void {
        if (!this._support || !Object.prototype.hasOwnProperty.call(SUPPORT_VEHICLE_FIRE_CONTROL, fireControl)) return;
        this._support.fireControl = fireControl as SupportVehicleFireControl;
        this._calc();
    }

    /** Weight of the heavy weapons, ammunition excluded: what fire control and gunners are based on (TM pp.131, 217). */
    private _supportWeaponTons(): number {
        return this._equipmentList.filter((item) => this._isWeapon(item)).reduce((sum, item) => sum + item.weight, 0);
    }

    /** Basic fire control weighs 5 percent of the weapons, advanced 10 percent (TM p.217). */
    public getSupportVehicleFireControlWeight(): number {
        if (!this._support) return 0;
        const factor = SUPPORT_VEHICLE_FIRE_CONTROL[this._support.fireControl].weightFactor;
        return factor > 0 ? this._roundSupportWeight(this._supportWeaponTons() * factor) : 0;
    }

    /** To-hit modifier for the vehicle's weapons: +2 without fire control, +1 with basic (TM p.131). */
    public getFireControlToHitModifier(): number {
        return this._support ? SUPPORT_VEHICLE_FIRE_CONTROL[this._support.fireControl].toHit : 0;
    }

    public getSupportVehicleExtraCrew(): number {
        return this._support?.extraCrew ?? 0;
    }

    public setSupportVehicleExtraCrew(crew: number): void {
        if (!this._support) return;
        this._support.extraCrew = Math.max(0, Math.min(1000, Math.floor(Number.isFinite(crew) ? crew : 0)));
        this._calc();
    }

    /**
     * Crew (Support Vehicle Minimum Crew Table, TM p.131): base crew, 3 per Field Kitchen, 5 per MASH theater,
     * gunners by fire control and weapon tonnage, any extra crew, then officers for 4 or more non-officers.
     */
    private _supportVehicleCrew(extra: number): number {
        const motive = this.getSupportVehicleMotive();
        const weightClass = this.getSupportVehicleWeightClass();
        if (!this._support || !motive || !weightClass) return 0;
        let crew = getSupportVehicleBaseCrew(motive, weightClass.size, this._support.engine === "none", this._tonnage);
        for (const item of this._equipmentList) {
            if (item.tag === "field-kitchen") crew += 3;
            if (item.tag === "mash-core" || item.tag === "mash-theater") crew += 5;
        }
        // 1 crewman per ton of communications equipment (TM pp.131, 212).
        crew += this.getCommunicationsTons();
        crew += weightClass.size === "small" ? this._smallSupportVehicleGunners()
            : getSupportVehicleGunners(this._support.fireControl, this._support.structuralTechRating, this._supportWeaponTons());
        crew += extra;
        return crew + getSupportVehicleOfficers(crew);
    }

    /**
     * Gunners on a Small Support Vehicle (TM p.131): without fire control, each weapon's own crew (a Light or
     * Medium weapon's Crew value, TM p.137); with fire control, 1 per facing that has weapons, each pintle and the
     * turret counting as a facing of its own; advanced fire control's count includes the driver.
     */
    private _smallSupportVehicleGunners(): number {
        const weapons = this._equipmentList.filter((item) => this._isWeapon(item));
        if (!this._support || weapons.length === 0) return 0;
        const crewOf = (item: IEquipmentItem) => findSupportVehicleLightWeapon(item.tag)?.crew ?? 1;
        if (this._support.fireControl === "none") return weapons.reduce((sum, item) => sum + crewOf(item), 0);
        const facings = new Set(weapons.map((item) => `${item.location ?? ""}${item.pintle ? "-pintle" : ""}`)).size;
        return this._support.fireControl === "advanced" ? Math.max(0, facings - 1) : facings;
    }

    public getSupportVehicleMinimumCrew(): number {
        return this._supportVehicleCrew(0);
    }

    /**
     * Overall Tech Rating: the highest of the structure, engine, armor and installed equipment (TM p.117).
     */
    public getSupportVehicleOverallTechRating(): SupportVehicleTechRating | null {
        if (!this._support) return null;
        const ratings = [this._support.structuralTechRating, this._support.engineTechRating];
        if (this._armorPoints() > 0) ratings.push(this._support.armorTechRating);
        for (const item of this._equipmentList) {
            const rating = item.techRating?.toLowerCase();
            if (rating && SUPPORT_VEHICLE_TECH_RATINGS.includes(rating as SupportVehicleTechRating)) ratings.push(rating as SupportVehicleTechRating);
        }
        return ratings.reduce((best, rating) => (rating > best ? rating : best));
    }

    private _armorPoints(): number {
        return this.getLocations().reduce((sum, loc) => sum + (this._armorAllocation[loc.tag] ?? 0), 0);
    }

    /** What makes this Support Vehicle illegal under TM pp.116-139; empty when it is legal. */
    public getSupportVehicleIssues(): string[] {
        const support = this._support;
        const motive = this.getSupportVehicleMotive();
        if (!support) return [];
        if (!motive) return [`${this._motiveType.name} is not a Support Vehicle motive type`];
        const weightClass = this.getSupportVehicleWeightClass();
        if (!weightClass) return [`A ${this._motiveType.name} Support Vehicle weighs at most ${this.getSupportVehicleMaxTonnage()} tons (TM p.118)`];
        const issues: string[] = [];
        const ratingName = (rating: string) => rating.toUpperCase();
        if (support.structuralTechRating < weightClass.minTechRating) {
            issues.push(`The structure needs at least Tech Rating ${ratingName(weightClass.minTechRating)} for this motive type and size (TM p.120)`);
        }
        const mods = this.getSupportVehicleChassisModifications();
        const available = new Set([...this.getAvailableSupportVehicleChassisModifications(), SUPPORT_VEHICLE_MOTIVE_MODIFICATION[this._motiveType.tag], "omni"]);
        for (const tag of mods) {
            const mod = getSupportVehicleChassisModification(tag);
            if (!mod) continue;
            if (!available.has(tag)) issues.push(`${mod.name} is not available to this motive type or size (TM p.122)`);
            if (support.structuralTechRating < mod.minTechRating) issues.push(`${mod.name} needs a Structural Tech Rating of ${ratingName(mod.minTechRating)} or better (TM p.122)`);
            for (const excluded of mod.excludes ?? []) {
                if (mods.includes(excluded) && tag < excluded) issues.push(`${mod.name} and ${getSupportVehicleChassisModification(excluded)?.name} may not be combined (TM p.122)`);
            }
        }
        if (mods.includes("convertible") && this._hasTurret) issues.push("A Convertible may not mount a turret (TM p.123)");
        const engine = this.getSupportVehicleEngine();
        if (!engine || engine.incompatible.includes(motive)) issues.push("This engine cannot power this motive type (TM p.127)");
        else if (engine.multiplier[support.engineTechRating] === null) issues.push(`${engine.name} engines do not exist at Tech Rating ${ratingName(support.engineTechRating)} (TM p.127)`);
        if (engine && engine.requiresModification && !mods.includes(engine.requiresModification)) {
            issues.push(`${engine.name} engines need the ${getSupportVehicleChassisModification(engine.requiresModification)?.name} chassis modification (TO:AUE p.62)`);
        }
        if (engine?.tag === "maglev" && mods.includes("external-power-pickup")) issues.push("The External Power Pickup may not be used with a MagLev engine (TO:AUE p.59)");
        if (this.getTurretCount() > this.getMaxTurrets()) issues.push(`${this.getTurretCount()} turrets; this vehicle may mount ${this.getMaxTurrets()} (TO:AUE pp.60, 71)`);
        if (engine?.tag === "none" && !mods.includes("trailer")) issues.push("Only a Trailer may go without an engine (TM p.126)");
        if (engine && engine.fuelPercentPer100Km !== null && support.fuelTons <= 0) issues.push("This engine needs fuel (TM p.128)");
        const kgPerPoint = this.getSupportVehicleArmorKgPerPoint();
        if (this._armorPoints() > 0 || mods.some((mod) => SUPPORT_VEHICLE_ARMOR_REQUIRED_MODIFICATIONS.includes(mod))) {
            if (kgPerPoint === null) issues.push(`BAR ${support.bar} armor does not exist at Tech Rating ${ratingName(support.armorTechRating)} (TM p.134)`);
            else if (this._armorNeedsArmoredChassis() && !mods.includes("armored")) {
                issues.push(`BAR ${support.bar} armor at Tech Rating ${ratingName(support.armorTechRating)} needs the Armored chassis modification (TM p.134)`);
            }
        }
        if (mods.includes("ultra-light") && support.bar > ULTRA_LIGHT_MAX_BAR) issues.push(`An Ultra-Light chassis may not mount armor better than BAR ${ULTRA_LIGHT_MAX_BAR} (TM p.123)`);
        if (mods.some((mod) => SUPPORT_VEHICLE_ARMOR_REQUIRED_MODIFICATIONS.includes(mod))
            && this.getLocations().some((loc) => (this._armorAllocation[loc.tag] ?? 0) < 1)) {
            issues.push("Armored, Amphibious, Environmentally Sealed and Submersible chassis need at least 1 armor point in every location (TM p.134)");
        }
        const lightWeapons = this._equipmentList.filter((item) => findSupportVehicleLightWeapon(item.tag));
        if (this._isSmallSupportVehicle()) {
            if (this._equipmentList.some((item) => !findSupportVehicleLightWeapon(item.tag) && (this._isWeapon(item) || item.isAmmo))) {
                issues.push("Small Support Vehicles may not mount heavy weapons (TM p.136)");
            }
            const seatTags = ["seating-standard", "seating-pillion", "support-vehicle-ejection-seat"];
            const seats = this._equipmentList.filter((item) => seatTags.includes(item.tag)).length;
            const crew = this.getCrew();
            if (seats < crew) issues.push(`A Small Support Vehicle needs a seat for each of its ${crew} crew (${seats} installed; TM p.132)`);
            if (lightWeapons.some((item) => item.pintle) && !this.canHavePintles()) issues.push("Naval Support Vehicles may not use pintle mounts (TM p.234)");
        } else if (lightWeapons.length > 0) {
            issues.push("Support Vehicles of 5 tons or more may not mount Light or Medium weapons (TM p.136)");
        }
        if (this._equipmentList.some((item) => item.tag === "support-vehicle-ejection-seat") && !this._isSmallSupportVehicle() && motive !== "vtol") {
            issues.push("Only Small Support Vehicles and Airship, Fixed-Wing and VTOL Support Vehicles may install ejection seats (TM p.213)");
        }
        if (this.getCommunicationsTons() > 15) issues.push(`${this.getCommunicationsTons()} tons of communications equipment; a unit carries at most 15 (TM p.212)`);
        // Bay doors: at most 7 + 1 per 50,000 tons (rounded up); a Large Support Vehicle carrying units other than
        // infantry should have a door on each such bay (TM p.209).
        const doors = this._bays.reduce((sum, bay) => sum + bay.doors, 0);
        const maxDoors = 7 + Math.ceil(this._tonnage / 50000);
        if (doors > maxDoors) issues.push(`${doors} bay doors; this vehicle may have at most ${maxDoors} (TM p.209)`);
        if (this.isSuperheavy()) {
            for (const bay of this._bays) {
                const type = getVehicleBayType(bay.tag);
                if (type && !type.infantry && type.tonsEach !== null && type.tag !== "cargo-container" && bay.doors < 1) {
                    issues.push(`${type.name}: a Large Support Vehicle needs a bay door for each bay carrying units (TM p.209)`);
                }
            }
        }
        for (const item of this._equipmentList) {
            if (!item.isAmmo && !this._isEquipmentAllowedForVehicle(item)) issues.push(`${item.name} cannot be mounted on this Support Vehicle`);
        }
        if (this.getUsedItemSlots() > this.getTotalItemSlots()) issues.push(`${this.getUsedItemSlots()} item slots used of ${this.getTotalItemSlots()} (TM p.120)`);
        return issues;
    }

    // --- Sponson turrets (TO pp. 348, 411): always a pair, in place of side-mounted weapons ---

    public hasSponsonTurrets(): boolean {
        return this._sponsonTurrets;
    }

    /** Vehicles with vehicular jump jets cannot mount sponsons: the jets' nozzles sit on the sides (TO p. 348). */
    public canHaveSponsonTurrets(): boolean {
        return this._jumpMP === 0 && !this._support;
    }

    public setSponsonTurrets(sponsons: boolean): boolean {
        this._sponsonTurrets = sponsons && this.canHaveSponsonTurrets();
        this._calc();
        return this._sponsonTurrets;
    }

    private _sideWeaponTons(side: "left" | "right"): number {
        const locations = side === "left" ? ["left", "frontLeft", "rearLeft"] : ["right", "frontRight", "rearRight"];
        return this._equipmentList
            .filter((item) => !item.isAmmo && !!item.location && locations.includes(item.location) && (item.damage !== undefined || !!item.range))
            .reduce((sum, item) => sum + item.weight, 0);
    }

    /** Sponson weight: 10% of the weapons in both sponsons, 5% a side, each rounded up to the half ton (TO p. 411). */
    public getSponsonWeight(): number {
        if (!this._sponsonTurrets) return 0;
        const side = (tons: number) => Math.ceil(tons * 0.05 * 2) / 2;
        return side(this._sideWeaponTons("left")) + side(this._sideWeaponTons("right"));
    }

    /** Both sponsons must carry the same tonnage of weapons, not necessarily the same weapons (TO p. 411). */
    public getSponsonIssue(): string | null {
        if (!this._sponsonTurrets) return null;
        const left = this._sideWeaponTons("left");
        const right = this._sideWeaponTons("right");
        return left === right ? null : `Sponsons must carry the same tonnage of weapons (left ${left} t, right ${right} t)`;
    }

    /**
     * Lowest rules level at which this vehicle is legal, plus the rules level of its installed
     * equipment. Standard (2) is tournament play. Superheavy vehicles, dual, sponson and chin
     * turrets and vehicular jump jets are Advanced: TO:AUE, which moved the turrets and jump jets
     * from TO 2008's Experimental (TO pp. 347-349) to Advanced. IO pp. 35 and 50 date them as
     * production technology (turrets ~3079-3080, jump jets ~3083). Patchwork Armor is an "advanced
     * construction option" (TO:AUE p.189).
     */
    public getRequiredRulesLevel(): number {
        const advanced = (this.isSuperheavy() && !this._support) || this.hasChinTurret() || this._dualTurret
            || this._sponsonTurrets || this._jumpMP > 0 || this.isAdvancedSupportVehicle() || this.isPatchworkArmor();
        let level = advanced ? 3 : 0;
        for (const item of this._equipmentList) {
            if (item) level = Math.max(level, getEquipmentRulesLevel(item));
        }
        if (this._frankenVehicle) level = Math.max(level, CUSTOM_HOMEBREW_RULES_LEVEL);
        return level;
    }

    // FrankenVehicles ------------------------------------------------------------------------------------------

    /** Turret linkage roll target: a FrankenVehicle's turret locks when it takes damage and 2D6 makes this. */
    public static readonly FRANKEN_TURRET_LOCK_TARGET = 10;
    public static readonly FRANKEN_DONOR_NAME_LENGTH = 60;

    public isFrankenVehicle(): boolean {
        return this._frankenVehicle !== null;
    }

    /** A Custom Homebrew rule for a vehicle with a turret. */
    public canBeFrankenVehicle(rulesLevel: number): boolean {
        return rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL && this._hasTurret;
    }

    /** Makes the vehicle a FrankenVehicle, its turret starting as its own, or an ordinary vehicle again. Not an Omni. */
    public setFrankenVehicle(frankenVehicle: boolean, rulesLevel: number = CUSTOM_HOMEBREW_RULES_LEVEL): boolean {
        if (!frankenVehicle) {
            this._frankenVehicle = null;
        } else if (!this._frankenVehicle && this.canBeFrankenVehicle(rulesLevel)) {
            this._omni = false;
            this._podUUIDs.clear();
            this._frankenVehicle = { turretDonorTonnage: this._tonnage, originalTurretWeight: this.getTurretLoadedWeight(), turretGunner: "commander" };
        }
        this._calc();
        return this.isFrankenVehicle();
    }

    public getFrankenVehicle(): IFrankenVehicle | null {
        return this._frankenVehicle ? { ...this._frankenVehicle } : null;
    }

    /** Sets where the turret came from and who fires it. Values the vehicle may not take are ignored. */
    public setFrankenVehicleTurret(turret: Partial<IFrankenVehicle>): IFrankenVehicle | null {
        const current = this._frankenVehicle;
        if (!current) return null;
        if (typeof turret.turretDonorTonnage === "number" && Number.isInteger(turret.turretDonorTonnage)
            && turret.turretDonorTonnage >= 1 && turret.turretDonorTonnage <= this._tonnage) {
            current.turretDonorTonnage = turret.turretDonorTonnage;
        }
        if (typeof turret.originalTurretWeight === "number" && turret.originalTurretWeight >= 0
            && turret.originalTurretWeight <= this._tonnage && Number.isInteger(turret.originalTurretWeight * 2)) {
            current.originalTurretWeight = turret.originalTurretWeight;
        }
        if (turret.turretGunner === "commander" || turret.turretGunner === "chassis") current.turretGunner = turret.turretGunner;
        if (typeof turret.turretDonorName === "string") current.turretDonorName = turret.turretDonorName.slice(0, Vehicle.FRANKEN_DONOR_NAME_LENGTH);
        this._calc();
        return this.getFrankenVehicle();
    }

    /** Keeps a FrankenVehicle legal after the chassis changes: no turret, no FrankenVehicle; no donor heavier than the chassis. */
    private _pruneFrankenVehicle(): void {
        if (!this._frankenVehicle) return;
        if (!this._hasTurret) {
            this._frankenVehicle = null;
            return;
        }
        this._frankenVehicle.turretDonorTonnage = Math.min(this._frankenVehicle.turretDonorTonnage, this._tonnage);
    }

    /** The turret with everything in it, ammunition included. */
    public getTurretLoadedWeight(): number {
        if (!this._hasTurret) return 0;
        return this.getTurretWeight("turret") + this._equipmentList
            .filter((item) => item.location === "turret")
            .reduce((sum, item) => sum + item.weight, 0);
    }

    /**
     * Turret mass: 10% of the combined weight of turret-mounted equipment (ammunition excluded), rounded up to the
     * nearest half-ton, minimum half a ton.
     */
    public getTurretWeight(location: "turret" | "turret2"): number {
        return Math.max(0.5, Math.ceil(this._equipmentList
            .filter((item) => item.location === location && !item.isAmmo)
            .reduce((sum, item) => sum + item.weight, 0) * 0.1 * 2) / 2);
    }

    /** +1 to Driving Skill Rolls when the turret is heavier than the one the chassis was built for. */
    public getFrankenVehicleDrivingModifier(): number {
        return this._frankenVehicle && this.getTurretLoadedWeight() > this._frankenVehicle.originalTurretWeight ? 1 : 0;
    }

    /** +1 to hit for turret weapons fired by a gunner in the chassis; none when the commander in the turret fires them. */
    public getFrankenVehicleTurretToHitModifier(): number {
        return this._frankenVehicle?.turretGunner === "chassis" ? 1 : 0;
    }

    /** What a FrankenVehicle's crew needs at the table, for the record sheet. */
    public getFrankenVehicleNotes(): string[] {
        const franken = this._frankenVehicle;
        if (!franken) return [];
        const donor = franken.turretDonorName?.trim() ? ` (${franken.turretDonorName.trim()})` : "";
        const notes = [`FrankenVehicle: turret from a ${franken.turretDonorTonnage}-ton vehicle${donor}; turret linkage roll when the turret is damaged, locks on ${Vehicle.FRANKEN_TURRET_LOCK_TARGET}+.`];
        if (this.getFrankenVehicleDrivingModifier() > 0) notes.push("Turret heavier than the chassis's own: +1 to Driving Skill Rolls.");
        if (this.getFrankenVehicleTurretToHitModifier() > 0) notes.push("Turret weapons fired by a gunner in the chassis: +1 to hit.");
        return notes;
    }

    public getMotiveType(): IVehicleMotiveType {
        return this._motiveType;
    }

    public setMotiveType(motiveTag: string): IVehicleMotiveType {
        const previous = this._motiveType;
        this._motiveType = getVehicleMotiveType(motiveTag);
        // Choosing a Support Vehicle-only motive type (Rail) makes the vehicle a Support Vehicle.
        if (this._motiveType.supportOnly && !this._support) {
            this._motiveType = previous;
            this.setSupportVehicle(true);
            this._motiveType = getVehicleMotiveType(motiveTag);
        }
        if (!!previous.hasRotor !== !!this._motiveType.hasRotor) {
            // VTOLs mount only a chin turret (Advanced) and other vehicles have no rotor, so the
            // turret and rotor start over when switching to or from a VTOL.
            this._removeTurret();
            this._armorAllocation.rotor = 0;
        }
        if (!this.canHaveDualTurret()) this._removeDualTurret();
        if (!this._motiveType.allowsJumpJets) this._jumpMP = 0;
        if (this._support) {
            if (!SUPPORT_VEHICLE_MOTIVES[this._motiveType.tag]) this._motiveType = previous;
            this._tonnage = Vehicle._supportVehicleTonnage(Math.min(this._tonnage, this.getSupportVehicleMaxTonnage()));
            const engines = this.getAvailableSupportVehicleEngines();
            if (!engines.some((engine) => engine.tag === this._support?.engine)) this._support.engine = engines[0]?.tag ?? "ice";
            if (!this.canHaveTurret()) this._removeTurret();
        }
        this._pruneLocations();
        this._calc();
        return this._motiveType;
    }

    public hasTurret(): boolean {
        return this._hasTurret;
    }

    /** A VTOL's turret is a chin turret (Advanced rules). */
    public hasChinTurret(): boolean {
        return this._hasTurret && this._motiveType.turret === "chin";
    }

    public getTurretName(): string {
        if (this._motiveType.turret === "chin") return "Chin Turret";
        return this._dualTurret ? "Rear Turret" : "Turret";
    }

    /** Dual turrets: ground and naval vehicles, not airborne units such as VTOLs (TO p. 347); no WiGE (as implemented by MegaMekLab). */
    public canHaveDualTurret(): boolean {
        return !this._support && this._motiveType.turret === "standard" && this._motiveType.tag !== "wige";
    }

    public hasDualTurret(): boolean {
        return this._hasTurret && this._dualTurret;
    }

    public setDualTurret(dualTurret: boolean): boolean {
        if (dualTurret && this.canHaveDualTurret()) {
            this._hasTurret = true;
            this._dualTurret = true;
        } else {
            this._removeDualTurret();
        }
        this._calc();
        return this._dualTurret;
    }

    private _removeDualTurret(): void {
        this._dualTurret = false;
        this._armorAllocation.turret2 = 0;
        for (const item of this._equipmentList) {
            if (item.location === "turret2") item.location = "";
        }
    }

    // Armor and equipment in locations the vehicle no longer has (Superheavy side locations,
    // a removed rotor or turret) are cleared or returned to the unallocated list.
    private _pruneLocations(): void {
        const present = new Set<string>(this.getLocations().map((loc) => loc.tag));
        for (const key of Object.keys(this._armorAllocation) as (keyof IVehicleArmorAllocation)[]) {
            if (!present.has(key)) this._armorAllocation[key] = 0;
        }
        for (const item of this._equipmentList) {
            if (item.location && !present.has(item.location)) item.location = "";
        }
    }

    /**
     * Crew: 1 per 15 tons, rounded up (as implemented by MegaMek Compute.getFullCrewSize); a Support Vehicle's
     * minimum crew plus any extra crew (TM p.131).
     */
    public getCrew(): number {
        if (this._support) return this._supportVehicleCrew(this._support.extraCrew ?? 0);
        return Math.ceil(this._tonnage / 15);
    }

    public getJumpMP(): number {
        return this._jumpMP;
    }

    /** Vehicular jump jets: hover, wheeled, tracked and WiGE only, up to Cruise MP (TO:AUE p.161). */
    public setJumpMP(jumpMP: number): number {
        // No vehicular jump jets alongside sponson turrets (TO p. 348).
        // Support Vehicles may not jump (TM p.131).
        const allowed = this._motiveType.allowsJumpJets && !this._sponsonTurrets && !this._support;
        this._jumpMP = allowed ? Math.max(0, Math.min(Math.floor(jumpMP), this._cruiseMP)) : 0;
        this._calc();
        return this._jumpMP;
    }

    /** Each jump jet weighs 0.5 t up to 55 t, 1 t up to 85 t, 2 t above (as for 'Mech jump jets). */
    public getJumpJetWeight(): number {
        const each = this._tonnage <= 55 ? 0.5 : this._tonnage <= 85 ? 1 : 2;
        return this._jumpMP * each;
    }

    public getTroopSpace(): number {
        return this._troopSpace;
    }

    /**
     * Infantry compartment (troop space) in tons, by the half ton: weight only, one item slot for
     * all compartments, and IT on the Alpha Strike card (as implemented by MegaMek; it adds no cost).
     */
    public setTroopSpace(tons: number): number {
        this._troopSpace = Math.max(0, Math.round(tons * 2) / 2);
        this._calc();
        return this._troopSpace;
    }

    // Transport bays (TM p.239, errata v8.0) ------------------------------------------------------------------

    public getBays(): IVehicleBay[] { return this._bays; }

    /** Adds a bay: 1 bay or cubicle, or 1 ton of cargo; a bay for units starts with 1 door. */
    public addBay(tag: string): IVehicleBay | null {
        // A ground vehicle's infantry compartments are its troop space.
        const type = VEHICLE_BAY_TYPES.find((entry) => entry.tag === tag);
        if (!type || this._bays.length >= MAX_VEHICLE_BAYS) return null;
        const bay: IVehicleBay = { tag: type.tag, amount: 1, doors: type.infantry || type.tonsEach === null ? 0 : 1 };
        this._bays.push(bay);
        this._calc();
        return bay;
    }

    /** Cargo by the kilogram (any leftover weight may be cargo, TM p.120); other bays by the whole bay or cubicle. */
    public setBay(index: number, amount: number, doors: number): IVehicleBay[] {
        const bay = this._bays[index];
        const type = bay ? getVehicleBayType(bay.tag) : undefined;
        if (bay && type) {
            const value = Number.isFinite(amount) ? amount : bay.amount;
            bay.amount = type.tonsEach === null
                ? Math.min(MAX_VEHICLE_CARGO_TONS, Math.max(0.001, Math.round(value * 1000) / 1000))
                : Math.min(MAX_VEHICLE_BAY_COUNT, Math.max(1, Math.floor(value)));
            bay.doors = Math.min(MAX_VEHICLE_BAY_COUNT, Math.max(0, Math.floor(Number.isFinite(doors) ? doors : bay.doors)));
            this._calc();
        }
        return this._bays;
    }

    public removeBay(index: number): IVehicleBay[] {
        this._bays = this._bays.filter((_bay, bayIndex) => bayIndex !== index);
        this._calc();
        return this._bays;
    }

    public getBayName(bay: IVehicleBay): string { return getVehicleBayType(bay.tag)?.name ?? bay.tag; }

    public getBaysWeight(): number {
        return Math.round(this._bays.reduce((sum, bay) => sum + getVehicleBayWeight(bay), 0) * 1e6) / 1e6;
    }

    // Communications equipment (TM p.212) ----------------------------------------------------------------------

    /** Tons of communications equipment added to the design; one record is mounted per ton. */
    public getCommunicationsTons(): number {
        return this._equipmentList.filter((item) => item.tag === "communications-equipment").length;
    }

    // Half-ton ammunition bins (TM pp.107, 137) ------------------------------------------------------------------

    /** Machine guns, nail guns and rivet guns may carry ammunition in half-ton lots (TM pp.107, 137). */
    public canBeHalfTonBin(item: IEquipmentItem): boolean {
        return !!item.isAmmo && /machine-gun|nail-rivet-gun/.test(item.tag);
    }

    public isHalfTonBin(item: IEquipmentItem): boolean {
        return this.canBeHalfTonBin(item) && item.weight === 0.5;
    }

    /** Makes an ammunition bin a half-ton lot, or a full ton again: half the weight, shots, cost and Battle Value. */
    public setHalfTonBin(uuid: string, halfTon: boolean): void {
        const item = this._equipmentList.find((entry) => entry.uuid === uuid);
        const catalogItem = item && this.canBeHalfTonBin(item)
            ? findByTag(getEquipmentListByTech(this._tech.tag, true), item.tag) ?? findByTag(this._otherTechBaseEquipment(), item.tag)
            : undefined;
        if (!item || !catalogItem) return;
        item.weight = halfTon ? catalogItem.weight / 2 : catalogItem.weight;
        item.cbills = halfTon ? catalogItem.cbills / 2 : catalogItem.cbills;
        if (typeof item.currentAmmo === "number") item.currentAmmo = Math.min(item.currentAmmo, this._fullBinShots(item));
        this._calc();
    }

    // Light and Medium weapons on Small Support Vehicles (TM pp.136-137, 234) ------------------------------

    /**
     * Mounts a Light or Medium (infantry) weapon with extra clips, in a location or on a pintle on that side. Only
     * a Small Support Vehicle may: the record is returned, or null when the weapon or vehicle cannot take it.
     */
    public addLightWeapon(infantryWeaponTag: string, location: string, extraClips: number = 0, pintle: boolean = false): IEquipmentItem | null {
        const weapon = findInfantryWeapon(infantryWeaponTag);
        if (!weapon || !this._isSmallSupportVehicle() || this._equipmentList.length >= MAX_VEHICLE_EQUIPMENT) return null;
        const record = buildSupportVehicleLightWeapon(weapon, extraClips);
        if (!findSupportVehicleLightWeapon(record.tag)) return null;
        const item = this._newEquipment(record, location, false);
        item.pintle = pintle && this.canHavePintles() && !!item.location && item.location !== "turret";
        this._equipmentList.push(item);
        this._calc();
        return item;
    }

    /** Changes a Light or Medium weapon's extra clips. */
    public setLightWeaponClips(uuid: string, extraClips: number): void {
        const index = this._equipmentList.findIndex((item) => item.uuid === uuid);
        const weapon = index >= 0 ? findSupportVehicleLightWeapon(this._equipmentList[index].tag) : null;
        if (!weapon) return;
        const current = this._equipmentList[index];
        this._equipmentList[index] = { ...buildSupportVehicleLightWeapon(weapon, extraClips), location: current.location, rear: current.rear, pintle: current.pintle, uuid: current.uuid };
        this._calc();
    }

    /** Pintles: Small Support Vehicles other than Fixed-Wing and naval ones (TM p.234). */
    public canHavePintles(): boolean {
        return this._isSmallSupportVehicle() && this.getSupportVehicleMotive() !== "naval";
    }

    /** Puts a Light or Medium weapon on a pintle on its side, or takes it off. */
    public setPintle(uuid: string, pintle: boolean): void {
        const item = this._equipmentList.find((entry) => entry.uuid === uuid);
        if (!item || !findSupportVehicleLightWeapon(item.tag)) return;
        item.pintle = pintle && this.canHavePintles() && !!item.location && item.location !== "turret";
        this._calc();
    }

    /** Each side's pintle weighs 5 percent of the weapons on it, rounded up to the kilogram (TM p.234). */
    public getPintleWeight(): number {
        const bySide = new Map<string, number>();
        for (const item of this._equipmentList) {
            if (item.pintle && item.location) bySide.set(item.location, (bySide.get(item.location) ?? 0) + item.weight);
        }
        let total = 0;
        for (const tons of bySide.values()) total += Math.ceil(tons * PINTLE_WEIGHT_FACTOR * 1000 - 1e-9) / 1000;
        return Math.round(total * 1000) / 1000;
    }

    // Tractors and Trailers (TM pp.123, 126; TW p.205) -----------------------------------------------------------

    public isTractor(): boolean { return this.getSupportVehicleChassisModifications().includes("tractor"); }
    public isTrailer(): boolean { return this.getSupportVehicleChassisModifications().includes("trailer"); }

    /** A wheeled or tracked Tractor pulls up to its own weight, a naval or rail one up to 5 times it (TM p.123; TO:AUE p.17). */
    public getMaxTowTons(): number {
        if (!this.isTractor()) return 0;
        const motive = this.getSupportVehicleMotive();
        return motive === "naval" || motive === "rail" ? this._tonnage * 5 : this._tonnage;
    }

    /** Tons of Trailers hitched to this Tractor in play; 0 unhitches them all (TW p.205). */
    public setTowedTons(tons: number): number {
        this._inPlay.towedTons = this.isTractor() ? Math.max(0, Math.min(this.getMaxTowTons(), Number.isFinite(tons) ? tons : 0)) : 0;
        return this._inPlay.towedTons;
    }

    public setBeingTowed(towed: boolean): void {
        this._inPlay.beingTowed = this.isTrailer() && towed === true;
    }

    /**
     * Cruising MP after pulling Trailers: up to a quarter of the Tractor's weight costs 3 MP or half the Cruising
     * MP (rounded down), whichever is less; more than a quarter leaves half the Cruising MP, rounded down (TW
     * p.205). Applied to the Cruising MP after damage; the book gives no order.
     */
    private _cruiseAfterTowing(cruise: number): number {
        const towed = this._inPlay.towedTons;
        if (!this.isTractor() || towed <= 0) return cruise;
        if (this.getSupportVehicleMotive() === "rail") {
            // A Rail Tractor: nothing up to half its weight; -3 MP or a third (round down), whichever is less, up to
            // twice it; half up to 4 times; two-thirds up to 5 times; never below 2 MP (TO:AUE p.17).
            const ratio = towed / this._tonnage;
            if (ratio <= 0.5) return cruise;
            const loss = ratio <= 2 ? Math.min(3, Math.floor(cruise / 3)) : ratio <= 4 ? Math.floor(cruise / 2) : Math.floor(cruise * 2 / 3);
            return Math.max(Math.min(2, cruise), cruise - loss);
        }
        if (towed <= this._tonnage / 4) return cruise - Math.min(3, Math.floor(cruise / 2));
        return Math.floor(cruise / 2);
    }

    /** Large Support Vehicles ignore the multiple-targets modifier when firing at more than one unit (TW p.206). */
    public ignoresSecondaryTargetModifier(): boolean {
        return !!this._support && this.isSuperheavy();
    }

    public isFusionEngine(): boolean {
        if (this._support) return this._support.engine === "fusion";
        return FUSION_ENGINE_TAGS.includes(this._engineType.tag);
    }

    /**
     * The engine tag the play, equipment and Alpha Strike rules read: a Support Vehicle's fusion engine counts as a
     * standard fusion engine, its ICE and steam engines as ICE, its fuel cell as a fuel cell.
     */
    private _rulesEngineTag(): string {
        if (!this._support) return this._engineType.tag;
        const tags: Partial<Record<SupportVehicleEngineTag, string>> = { fusion: "standard", fission: "fission", ice: "ice", steam: "ice", "fuel-cell": "cell" };
        return tags[this._support.engine] ?? this._support.engine;
    }

    /** Support Vehicle engines never give free heat sinks (TM p.133). */
    public getFreeHeatSinks(): number {
        if (this._support) return 0;
        if (this.isFusionEngine()) return 10;
        if (this._engineType.tag === "fission") return 5;
        if (this._engineType.tag === "cell") return 1;
        return 0;
    }

    private static _isEnergyWeapon(item: IEquipmentItem): boolean {
        return item.category === "Energy Weapons" && !item.isAmmo;
    }

    /**
     * Heat sinks a vehicle must carry: the heat of its energy weapons that use no ammunition, plus
     * heat-producing equipment (vehicles are built heat-neutral; as implemented by MegaMek
     * TestEntity.calcHeatNeutralHSRequirement).
     */
    public getRequiredHeatSinks(): number {
        let heat = 0;
        for (const item of this._equipmentList) {
            if (item.isAmmo) continue;
            const usesAmmo = !!item.ammoTypes?.length || (item.shotsPerTon ?? 0) > 0;
            if (Vehicle._isEnergyWeapon(item)) {
                if (!usesAmmo) heat += item.heat || 0;
            } else if (item.isEquipment) {
                heat += item.heat || 0;
            }
        }
        return heat;
    }

    /** Heat sinks that weigh anything: those above the engine's free ones, plus any extra ones added. */
    public getWeightedHeatSinks(): number {
        return Math.max(0, this.getRequiredHeatSinks() - this.getFreeHeatSinks()) + this._additionalHeatSinks;
    }

    public getTotalHeatSinks(): number {
        return Math.max(this.getRequiredHeatSinks(), this.getFreeHeatSinks()) + this._additionalHeatSinks;
    }

    /**
     * Power amplifiers: vehicles without a fusion or fission engine need 10% of their energy weapons'
     * weight, rounded up to the half ton (vehicle flamers and chemical lasers excepted; as
     * implemented by MegaMek TestTank).
     */
    public getPowerAmplifierWeight(): number {
        if (this.isFusionEngine() || this._rulesEngineTag() === "fission") return 0;
        const weight = this._equipmentList
            .filter((item) => Vehicle._isEnergyWeapon(item) && !/vehicle-flamer|chemical-laser/.test(item.tag))
            .reduce((sum, item) => sum + (item.weight || 0), 0);
        return Math.ceil(weight / 10 * 2) / 2;
    }

    /**
     * Item slots: 5 + tonnage / 5, rounded down (as implemented by MegaMek Tank.getTotalSlots); a Support
     * Vehicle has 5 + tonnage / 10 (TM p.120).
     */
    public getTotalItemSlots(): number {
        if (this._support) return getSupportVehicleItemSlots(this._tonnage);
        return 5 + Math.floor(this._tonnage / 5);
    }

    /**
     * Item slots used: equipment (ammunition takes one slot per ammo type), armor (TM p.105), one slot
     * for all jump jets, and engine slots (as implemented by MegaMek Tank.getFreeSlots).
     */
    public getUsedItemSlots(): number {
        const ammoTypes = new Set<string>();
        let used = 0;
        for (const item of this._equipmentList) {
            if (item.isAmmo) {
                ammoTypes.add(item.tag);
            } else if (item.tag === "communications-equipment") {
                // One slot for the whole set of communications equipment, whatever its tonnage (TM p.212).
                continue;
            } else if (!item.isModularArmor) {
                used += Math.max(0, (this._support ? item.space?.supportVehicle : item.space?.combatVehicle) ?? 1);
            }
        }
        used += ammoTypes.size;
        if (this.getCommunicationsTons() > 0) used += 1;
        used += getVehicleBaySlots(this._bays);
        if (this._support) {
            // Support Vehicle engines, heat sinks, fuel and fire control take no slots; BAR 10 armor at Tech
            // Rating E or F takes Ferro-Fibrous space, 2 slots Inner Sphere and 1 Clan (TM p.134, errata v8.0).
            const ferroFibrous = supportVehicleArmor.find((armor) => armor.bar === this._support?.bar)?.ferroFibrousSlotRatings ?? [];
            if (this._armorPoints() > 0 && ferroFibrous.includes(this._support.armorTechRating)) used += this._tech.tag === "clan" ? 1 : 2;
            if (this._troopSpace > 0) used += 1;
            return used;
        }
        used += this.getArmorItemSlots();
        if (this._jumpMP > 0) used += 1;
        if (this._troopSpace > 0) used += 1;
        used += ENGINE_ITEM_SLOTS[this._engineType.tag] ?? 0;
        if (this.getEngineRating() > 400) used += 1;
        return used;
    }

    /**
     * Support Vehicles may carry one turret, except VTOLs and Convertibles (TM pp.123-124, 137); of the Rail units only
     * Small and Medium ones may (TO:AUE p.71).
     */
    public canHaveTurret(): boolean {
        if (!this._support) return true;
        if (this.getSupportVehicleMotive() === "rail" && this.isSuperheavy()) return false;
        return !this._motiveType.hasRotor && !this.getSupportVehicleChassisModifications().includes("convertible");
    }

    public setHasTurret(hasTurret: boolean): boolean {
        if (hasTurret && this.canHaveTurret()) {
            this._hasTurret = true;
        } else {
            this._removeTurret();
        }
        this._calc();
        return this._hasTurret;
    }

    // Without a turret its armor goes away and its equipment returns to the unallocated list.
    private _removeTurret(): void {
        this._hasTurret = false;
        this._removeDualTurret();
        if (this._support) this._support.turrets = undefined;
        for (const turret of VEHICLE_TURRET_LOCATIONS) {
            if (this._armorAllocation[turret] !== undefined) this._armorAllocation[turret] = 0;
        }
        for (const item of this._equipmentList) {
            if (isTurretLocation(item.location)) item.location = "";
        }
    }

    /** The vehicle's locations in record-sheet order: front, sides, rear, rotor (VTOL), turret. */
    public getLocations(): { tag: VehicleLocation; name: string }[] {
        // Super-Heavy Combat Vehicles, VTOLs included, have six facings (Front, Front-Left, Front-Right,
        // Rear-Left, Rear-Right, Rear) plus any rotor and turrets (Tactical Operations p. 378).
        const locations: VehicleLocation[] = this.isSuperheavy()
            ? ["front", "frontLeft", "frontRight", "rearLeft", "rearRight", "rear"]
            : ["front", "left", "right", "rear"];
        if (this._motiveType.hasRotor) locations.push("rotor");
        if (this.isLargeNavalVessel()) {
            // A Large Naval Vessel numbers its turrets from the bow (TO:AUE p.60).
            const turrets = VEHICLE_TURRET_LOCATIONS.slice(0, this.getTurretCount());
            return [...locations, ...turrets].map((tag, index) => ({ tag, name: isTurretLocation(tag) ? `Turret ${index - locations.length + 1}` : LOCATION_NAMES[tag] }));
        }
        if (this._hasTurret && this._dualTurret) locations.push("turret2");
        if (this._hasTurret) locations.push("turret");
        return locations.map((tag) => ({ tag, name: tag === "turret" ? this.getTurretName() : LOCATION_NAMES[tag] }));
    }

    public getTech(): ITechOptions {
        return this._tech;
    }

    public setTech(tag: string): ITechOptions {
        this._tech = findByTag(btTechOptions, tag) ?? this._tech;
        // Clan-only eras are closed to the Inner Sphere, and Mixed Tech starts at the Clan Invasion.
        this._era = getClosestEraForTech(this._era, this._tech.tag);
        return this._tech;
    }

    public getEra(): IEras {
        return this._era;
    }

    public setEra(tag: string): IEras {
        const era = findEraByTag(tag) ?? this._era;
        this._era = getClosestEraForTech(era, this._tech.tag);
        return this._era;
    }

    /** The eras this vehicle's tech base can be designed in. */
    public getAvailableEras(): IEras[] {
        return getErasForTech(this._tech.tag);
    }

    public getEngineType(): IEngineType {
        return this._engineType;
    }

    public setEngineType(tag: string): IEngineType {
        this._engineType = findByTag(mechEngineTypes, tag) ?? this._engineType;
        this._calc();
        return this._engineType;
    }

    public getCruiseMP(): number {
        let cruise = this._cruiseMP;
        // A Support Vehicle hydrofoil multiplies its base Cruising MP by 1.25, rounding .5 up (TM p.123).
        if (this.getSupportVehicleChassisModifications().includes("hydrofoil")) cruise = Math.floor(cruise * 1.25 + 0.5);
        return Math.max(0, cruise - (this.hasActiveModularArmor() ? 1 : 0));
    }

    /** The Cruising MP the engine is built for, before a hydrofoil's bonus or modular armor (TM p.127). */
    public getBaseCruiseMP(): number {
        return this._cruiseMP;
    }

    public setCruiseMP(cruiseMP: number): number {
        this._cruiseMP = Math.max(0, cruiseMP);
        this._jumpMP = Math.min(this._jumpMP, this._cruiseMP);
        this._calc();
        return this._cruiseMP;
    }

    public getFlankMP(): number {
        return Math.ceil(this.getCruiseMP() * 1.5);
    }

    /**
     * Engine rating = cruise MP x tonnage - suspension factor, at least 10 (TechManual Combat
     * Vehicle construction; minimum as in MegaMekLab).
     */
    public getEngineRating(): number {
        // A Support Vehicle's Engine Rating is Cruising MP x tonnage, at most 500 (TM errata v8.0, p.126).
        if (this._support) return Math.min(500, Math.ceil(this.getCruiseMP() * this._tonnage));
        return Math.max(10, Math.ceil(this._tonnage * this._cruiseMP) - this.getSuspensionFactor());
    }

    /**
     * Fastest Cruise MP whose engine rating fits: 400, or 500 with Large engines (Experimental).
     * Compact, Fuel Cell and Fission engines have no large form (TO:AUE p.120) and stay at 400.
     * A Support Vehicle has no rating limit: its fastest is the speed whose engine still fits beside the
     * structure, at most 30 (a bound for the choice list, not a rule).
     */
    public getMaxCruiseMP(rulesLevel: number = 2): number {
        if (this._support) {
            const weightClass = this.getSupportVehicleWeightClass();
            const engine = this.getSupportVehicleEngine();
            if (!weightClass || !engine || engine.tag === "none") return 0;
            const room = this._tonnage - this.getStructureWeight();
            let mp = 0;
            while (mp < 30 && (getSupportVehicleEngineWeight(weightClass, engine, this._support.engineTechRating, mp + 1, this._tonnage) ?? Infinity) <= room) mp++;
            return mp;
        }
        const largeAllowed = rulesLevel >= 4 && !!getLargeEngineType(this._engineType.tag);
        const maxRating = largeAllowed ? MAX_LARGE_ENGINE_RATING : MAX_STANDARD_ENGINE_RATING;
        return Math.max(0, Math.floor((maxRating + this.getSuspensionFactor()) / this._tonnage));
    }

    public getSuspensionFactor(): number {
        return getVehicleSuspensionFactor(this._motiveType.tag, this._tonnage);
    }

    public getEngineWeight(): number {
        if (this._support) {
            const weightClass = this.getSupportVehicleWeightClass();
            const engine = this.getSupportVehicleEngine();
            if (!weightClass || !engine) return 0;
            // An engine the Tech Rating cannot make weighs nothing here; getSupportVehicleIssues reports it.
            return getSupportVehicleEngineWeight(weightClass, engine, this._support.engineTechRating, this._cruiseMP, this._tonnage) ?? 0;
        }
        const requiredRating = this.getEngineRating();
        const engineOption = mechEngineOptions.find((option) => option.rating >= requiredRating)
            ?? mechEngineOptions[mechEngineOptions.length - 1];
        const engineTag = this._engineType.tag as keyof typeof engineOption.weight;
        const weight = engineOption.weight[engineTag] ?? engineOption.weight.standard;
        // Fusion and fission engines in vehicles need extra shielding: weight x 1.5 (TechManual, Combat Vehicle engines).
        const shielded = this._engineType.tag !== "ice" && this._engineType.tag !== "cell";
        return shielded ? Math.ceil(weight * 1.5 * 2) / 2 : weight;
    }

    public getArmorType(): IArmorType {
        return this._armorType;
    }

    /**
     * Armor this vehicle's tech base and motive type can mount. `available` marks what the era and rules
     * level allow; the setter checks only tech and motive, so saved designs keep their armor.
     */
    public getAvailableArmorTypes(rulesLevel: number = 2): IArmorType[] {
        const techTag = this.getTech().tag;
        const isMixed = techTag === "mis" || techTag === "mclan";
        // Copies: the availability marks are this vehicle's, and the shared table also serves 'Mechs.
        const armorTypes = mechArmorTypes.filter((armor) => armor.unitTypes.combatVehicle
            && (this._motiveType.allowsHardenedArmor || armor.tag !== "hardened")
            && armor.constructionStatus !== "deferred" && armor.constructionMode !== "equipment" && (isMixed
            ? armor.armorMultiplier.is > 0 || armor.armorMultiplier.clan > 0
            : armor.armorMultiplier[techTag === "clan" ? "clan" : "is"] > 0)).map((armor) => ({ ...armor }));
        for (const armor of armorTypes) {
            const availability = this._techDatesAvailability(armor, rulesLevel);
            // Patchwork Armor is an "advanced construction option" (TO:AUE p.189).
            armor.available = availability.available && (armor.tag !== Vehicle.PATCHWORK_ARMOR_TAG || rulesLevel >= 3);
            armor.availableAsPrototype = availability.asPrototype;
        }
        return armorTypes;
    }

    /** Engines for this vehicle's tech base (either one for Mixed Tech), with era availability marked. */
    public getAvailableEngineTypes(rulesLevel: number = 2): IEngineType[] {
        const techTag = this.getTech().tag;
        const bases: ("is" | "clan")[] = techTag === "is" ? ["is"] : techTag === "clan" ? ["clan"] : ["is", "clan"];
        const engineTypes = mechEngineTypes.filter((engine) => bases.some((base) => engine.criticals[base])).map((engine) => ({ ...engine }));
        for (const engine of engineTypes) {
            const availability = bases.filter((base) => engine.criticals[base])
                .map((base) => this._datesAvailability(base === "clan" ? engine.clanDates ?? engine : engine, rulesLevel));
            const inProduction = availability.find((option) => option.available && !option.asPrototype);
            const chosen = inProduction ?? availability.find((option) => option.available) ?? availability[0];
            engine.available = chosen.available;
            engine.availableAsPrototype = chosen.asPrototype;
        }
        return engineTypes;
    }

    public setArmorType(tag: string): IArmorType {
        // BattleMech Stealth is BM-only (TM p.206); vehicles saved with it get Vehicular Stealth (TO:AUE p.94).
        if (tag === "stealth-basic" || tag === "stealth") tag = "vehicular-stealth";
        const previous = this._armorType.tag;
        this._armorType = findByTag(this.getAvailableArmorTypes(), tag) ?? this._armorType;
        if (this._armorType.tag !== previous) this._patchworkArmor = {};
        this._calc();
        return this._armorType;
    }

    public getArmorAllocation(): IVehicleArmorAllocation {
        return this._armorAllocation;
    }

    public setArmorAllocation(location: keyof IVehicleArmorAllocation, points: number): IVehicleArmorAllocation {
        const maxForLocation = this.getMaxArmorAllocation()[location] ?? 0;
        this._armorAllocation[location] = Math.min(Math.max(0, points), maxForLocation);
        this._calc();
        return this._armorAllocation;
    }

    /** The tech base whose version of the armor this vehicle mounts. */
    private _armorTechBase(armor: IArmorType): "is" | "clan" {
        const starLeagueVersion = this.getTech().tag === "clan" && this._usesStarLeagueVersion(armor);
        const preferredBase = !starLeagueVersion && (this.getTech().tag === "clan" || this.getTech().tag === "mclan") ? "clan" : "is";
        return armor.armorMultiplier[preferredBase] > 0
            ? preferredBase
            : preferredBase === "clan" ? "is" : "clan";
    }

    public getArmorPointsPerTon(): number {
        // Support Vehicle armor: 1,000 kg divided by the kilograms a point weighs (TM p.134).
        if (this._support) {
            const kgPerPoint = this.getSupportVehicleArmorKgPerPoint();
            return kgPerPoint ? 1000 / kgPerPoint : 0;
        }
        return this._armorType.armorMultiplier[this._armorTechBase(this._armorType)] || 16;
    }

    public getArmorWeight(): number {
        if (this.isPatchworkArmor()) {
            return this.getLocations().reduce((total, location) => total + this.getPatchworkLocationWeight(location.tag), 0);
        }
        const totalPoints = Object.values(this._armorAllocation).reduce((sum: number, points) => sum + (points ?? 0), 0);
        if (this._support) {
            // Points x kilograms per point: unrounded on a Small Support Vehicle, up to the half ton from 5 tons (TM p.134).
            const kg = totalPoints * (this.getSupportVehicleArmorKgPerPoint() ?? 0);
            return this._isSmallSupportVehicle() ? kg / 1000 : Math.ceil(kg / 500 - 1e-9) / 2;
        }
        return Math.ceil((totalPoints / this.getArmorPointsPerTon()) * 2) / 2;
    }

    /**
     * Item slots the armor takes (Combat Vehicle Armor Table, TM p.105; TO:AUE p.93; IO:AE pp.66, 82). Under
     * Patchwork Armor each location takes its own type's slots, whatever its points (TO:AUE p.189).
     */
    public getArmorItemSlots(): number {
        if (this.isPatchworkArmor()) {
            return this.getLocations().reduce((total, location) => total + this.getPatchworkLocationSlots(location.tag), 0);
        }
        return this._armorType.combatVehicleSlots?.[this._armorTechBase(this._armorType)] ?? 0;
    }

    /** Commercial armor counts half in the defensive BV; the other modifiers are on the records. */
    private static _armorBVMultiplier(armor: IArmorType): number {
        return armor.bvMultiplier ?? (armor.tag === "commercial" ? 0.5 : 1);
    }

    /** The armor for a record sheet: the type, or under Patchwork Armor each location's type. */
    public getArmorDescription(): string {
        if (!this.isPatchworkArmor()) return this._armorType.name;
        return `${this._armorType.name} (${this.getLocations().map((location) => `${location.name}: ${this.getPatchworkArmorType(location.tag).name}`).join(", ")})`;
    }

    /** Patchwork Armor: an armor type for each location (TO:AUE p.189). */
    public isPatchworkArmor(): boolean {
        return this._armorType.tag === Vehicle.PATCHWORK_ARMOR_TAG;
    }

    /** A patchwork value of the armor for this vehicle's tech base, or undefined where the table has none. */
    private _patchworkValue(armor: IArmorType, field: "vehicleSlots" | "tonsPerPoint"): number | undefined {
        return armor.patchwork?.[field]?.[this._armorTechBase(armor)];
    }

    /**
     * The armor types a location may carry: those the vehicle could mount as its only armor that the
     * Patchwork Armor Table gives Combat Vehicle slots for (Hardened kept off VTOL, WiGE and Hover).
     */
    public getAvailablePatchworkArmorTypes(rulesLevel: number = 2): IArmorType[] {
        return this.getAvailableArmorTypes(rulesLevel).filter((armor) => armor.tag !== Vehicle.PATCHWORK_ARMOR_TAG
            && this._patchworkValue(armor, "vehicleSlots") !== undefined && this._patchworkValue(armor, "tonsPerPoint") !== undefined);
    }

    public getPatchworkArmorType(location: VehicleLocation): IArmorType {
        return findByTag(mechArmorTypes, this._patchworkArmor[location] ?? "standard") ?? mechArmorTypes[0];
    }

    public setPatchworkArmorType(location: VehicleLocation, armorTag: string): IArmorType {
        const armor = findByTag(this.getAvailablePatchworkArmorTypes(), armorTag);
        if (this.isPatchworkArmor() && armor && this.getLocations().some((entry) => entry.tag === location)) {
            this._patchworkArmor[location] = armor.tag;
            this._calc();
        }
        return this.getPatchworkArmorType(location);
    }

    /** Item slots the location's armor takes (Patchwork Armor Table, right of the slash; TO:AUE p.189, IO:AE p.82). */
    public getPatchworkLocationSlots(location: VehicleLocation): number {
        if (!this.isPatchworkArmor()) return 0;
        return this._patchworkValue(this.getPatchworkArmorType(location), "vehicleSlots") ?? 0;
    }

    /** Tons of armor in the location: points x the type's tons per point, "rounding the final result up to the nearest half-ton" (TO:AUE p.189). */
    public getPatchworkLocationWeight(location: VehicleLocation): number {
        if (!this.isPatchworkArmor()) return 0;
        const tonsPerPoint = this._patchworkValue(this.getPatchworkArmorType(location), "tonsPerPoint") ?? 0;
        const weight = (this._armorAllocation[location] ?? 0) * tonsPerPoint;
        return weight > 0 ? Math.ceil(weight * 2 - 1e-9) / 2 : 0;
    }

    /** Drops location types the vehicle can no longer carry there (a removed turret, a new motive type or tech base). */
    private _prunePatchworkArmor(): void {
        if (!this.isPatchworkArmor()) return;
        const locations = this.getLocations().map((location) => location.tag);
        const allowed = this.getAvailablePatchworkArmorTypes().map((armor) => armor.tag);
        for (const location of Object.keys(this._patchworkArmor) as VehicleLocation[]) {
            if (!locations.includes(location) || !allowed.includes(this._patchworkArmor[location] ?? "")) delete this._patchworkArmor[location];
        }
    }

    // TechManual Combat Vehicle armor cap: (Tonnage x 3.5) + 40 points, rounded down. Support Vehicles: 4 plus a
    // share of the tonnage by motive type (TM p.134).
    public getMaxArmorPoints(): number {
        const motive = this.getSupportVehicleMotive();
        if (this._support && motive) return getSupportVehicleMaxArmor(motive, this._tonnage);
        return Math.floor(this._tonnage * 3.5 + 40);
    }

    // The largest armor tonnage the vehicle can actually mount: whichever is smaller of the
    // point-formula cap and what fits in the tonnage still available (current armor + remaining).
    public getMaxArmorTonnage(): number {
        const pointsPerTon = this.getArmorPointsPerTon();
        if (pointsPerTon <= 0) return 0;
        // Support Vehicle armor is bought by the point and its weight rounded up, so the full maximum fits (TM p.135).
        const formulaCapTons = this._support
            ? Math.ceil((this.getMaxArmorPoints() / pointsPerTon) * 2 - 1e-9) / 2
            : Math.floor((this.getMaxArmorPoints() / pointsPerTon) * 2) / 2;
        const weightBudgetTons = Math.floor((this.getArmorWeight() + Math.max(0, this.getRemainingTonnage())) * 2) / 2;
        return Math.max(0, Math.min(formulaCapTons, weightBudgetTons));
    }

    // Sets total armor by tonnage (0.5-ton increments) and redistributes points across locations,
    // keeping each location's current proportion of the total (or splitting evenly when empty).
    public setArmorTonnage(tons: number): number {
        // Patchwork armor is set by the point in each location; its weight follows from the types.
        if (this.isPatchworkArmor()) return this.getArmorWeight();
        const clampedTons = Math.max(0, Math.min(this.getMaxArmorTonnage(), Math.round(tons * 2) / 2));
        const targetPoints = Math.min(this.getMaxArmorPoints(), Math.floor(clampedTons * this.getArmorPointsPerTon() + 1e-9));
        this._distributeArmorPoints(targetPoints);
        this._calc();
        return this.getArmorWeight();
    }

    public allocateMaxArmor(): void {
        if (!this.isPatchworkArmor()) {
            this.setArmorTonnage(this.getMaxArmorTonnage());
            return;
        }
        // Patchwork: the most points, spread as usual, whose per-location weights still fit the tonnage free.
        const budget = this.getArmorWeight() + Math.max(0, this.getRemainingTonnage());
        for (let points = this.getMaxArmorPoints(); points >= 0; points--) {
            this._distributeArmorPoints(points);
            if (this.getArmorWeight() <= budget) break;
        }
        this._calc();
    }

    public allocateArmorClear(): void {
        this._armorAllocation = emptyArmorAllocation();
        this._calc();
    }

    private _distributeArmorPoints(targetPoints: number): void {
        const locations = this.getLocations().map((loc) => loc.tag);
        const currentTotal = locations.reduce((sum, loc) => sum + (this._armorAllocation[loc] ?? 0), 0);
        const nextAllocation: IVehicleArmorAllocation = emptyArmorAllocation();

        if (currentTotal <= 0) {
            const base = Math.floor(targetPoints / locations.length);
            let remainder = targetPoints - base * locations.length;
            for (const loc of locations) {
                nextAllocation[loc] = base + (remainder > 0 ? 1 : 0);
                if (remainder > 0) remainder--;
            }
        } else {
            let assigned = 0;
            for (const loc of locations) {
                const share = Math.floor((targetPoints * (this._armorAllocation[loc] ?? 0)) / currentTotal);
                nextAllocation[loc] = share;
                assigned += share;
            }
            nextAllocation.front += targetPoints - assigned;
        }

        // The rotor holds at most 2 points; anything above that goes to the front. A VTOL rotor
        // gets its 2 points first, taken from the most heavily armored location.
        if ((nextAllocation.rotor ?? 0) > VTOL_MAX_ROTOR_ARMOR) {
            nextAllocation.front += (nextAllocation.rotor ?? 0) - VTOL_MAX_ROTOR_ARMOR;
            nextAllocation.rotor = VTOL_MAX_ROTOR_ARMOR;
        }
        if (this._motiveType.hasRotor) {
            const wanted = Math.min(VTOL_MAX_ROTOR_ARMOR, targetPoints) - (nextAllocation.rotor ?? 0);
            for (let point = 0; point < wanted; point++) {
                const donor = locations.filter((loc) => loc !== "rotor")
                    .reduce((best, loc) => ((nextAllocation[loc] ?? 0) > (nextAllocation[best] ?? 0) ? loc : best), "front" as VehicleLocation);
                if ((nextAllocation[donor] ?? 0) <= 0) break;
                nextAllocation[donor] = (nextAllocation[donor] ?? 0) - 1;
                nextAllocation.rotor = (nextAllocation.rotor ?? 0) + 1;
            }
        }

        this._armorAllocation = nextAllocation;
    }

    public getStructureType(): string {
        return this._structureType;
    }

    public setStructureType(tag: string): string {
        this._structureType = Object.prototype.hasOwnProperty.call(VEHICLE_STRUCTURE_MULTIPLIERS, tag) ? tag : "standard";
        this._calc();
        return this._structureType;
    }

    // Superheavy vehicles (other than naval ones) have twice the structure weight
    // (as implemented by MegaMek; not yet checked against the book).
    public getStructureWeight(): number {
        if (this._support) {
            const weightClass = this.getSupportVehicleWeightClass();
            if (!weightClass) return 0;
            return getSupportVehicleStructureWeight(weightClass, this._support.structuralTechRating, this.getSupportVehicleChassisModifications(), this._tonnage);
        }
        const multiplier = (VEHICLE_STRUCTURE_MULTIPLIERS[this._structureType] ?? 0.1)
            * (this.isSuperheavy() && !this._motiveType.naval ? 2 : 1);
        return Math.ceil(this._tonnage * multiplier * 2) / 2;
    }

    // Combat Vehicle Internal Structure: 1 point per 10 tons, rounded up, in every location
    // including the rotor and turret (as implemented by MegaMek Tank.autoSetInternal).
    public getStructureAllocation(): IVehicleStructureAllocation {
        // A Large Naval Vessel has 30 + tonnage / 2,000 points a location (TO:AUE p.60).
        const motive = this.getSupportVehicleMotive();
        const pointsPerLocation = Math.max(1, this._support && motive ? getSupportVehicleStructurePoints(motive, this._tonnage) : Math.ceil(this._tonnage / 10));
        const result: IVehicleStructureAllocation = emptyArmorAllocation();
        for (const loc of this.getLocations()) {
            result[loc.tag] = pointsPerLocation;
        }
        // A FrankenVehicle's turret keeps its donor's structure.
        if (this._frankenVehicle && this._hasTurret) result.turret = Math.max(1, Math.ceil(this._frankenVehicle.turretDonorTonnage / 10));
        return result;
    }

    // Any single location can use up the vehicle's total armor point budget, minus whatever is
    // already allocated to the other locations; only the VTOL rotor has its own cap (2 points).
    public getMaxArmorAllocation(): IVehicleArmorAllocation {
        const maxPoints = this.getMaxArmorPoints();
        const locations = this.getLocations().map((loc) => loc.tag);
        const result: IVehicleArmorAllocation = emptyArmorAllocation();
        for (const loc of locations) {
            const othersTotal = locations.reduce((sum, l) => sum + (l === loc ? 0 : this._armorAllocation[l] ?? 0), 0);
            result[loc] = Math.max(0, maxPoints - othersTotal);
        }
        result.rotor = Math.min(VTOL_MAX_ROTOR_ARMOR, result.rotor ?? 0);
        return result;
    }

    public getHeatSinkType(): IHeatSync {
        return this._heatSinkType;
    }

    public setHeatSinkType(tag: string): IHeatSync {
        this._heatSinkType = mechHeatSinkTypes.find((h) => matchesTag(h, tag) && h.tag === "single") ?? this._heatSinkType;
        this._calc();
        return this._heatSinkType;
    }

    public getAdditionalHeatSinks(): number {
        return this._additionalHeatSinks;
    }

    // Heat sinks beyond the required ones (see getRequiredHeatSinks).
    public setAdditionalHeatSinks(count: number): number {
        this._additionalHeatSinks = Math.max(0, count);
        this._calc();
        return this._additionalHeatSinks;
    }

    // Vehicles use single heat sinks only (as implemented by MegaMek TestTank); each weighs 1 ton.
    public getHeatSinkWeight(): number {
        return this.getWeightedHeatSinks();
    }

    public getEquipmentList(): IEquipmentItem[] {
        return this._equipmentList;
    }

    public addEquipment(item: IEquipmentItem, location?: string, rear?: boolean): IEquipmentItem[] {
        const equipmentCopy: IEquipmentItem = { ...item, location, rear, uuid: generateUUID() };
        if (equipmentCopy.isModularArmor) {
            equipmentCopy.currentAdditionalArmor = equipmentCopy.additionalArmor ?? 10;
        }
        this._equipmentList.push(equipmentCopy);
        this._calc();
        return this._equipmentList;
    }

    /** The mixed-tech catalog (both tech bases) for an Inner Sphere or Clan vehicle; empty for mixed tech, which already sees both. */
    private _otherTechBaseEquipment(): IEquipmentItem[] {
        const techTag = this._tech.tag;
        return techTag === "clan" || techTag === "is" ? getEquipmentListByTech(techTag === "clan" ? "mclan" : "mis", true) : [];
    }

    /**
     * `anyTechBase` is for loading a saved vehicle: it keeps whatever it mounted, including equipment
     * that has since moved to the other tech base's catalog.
     */
    public addEquipmentFromTag(tag: string, location?: string, rear?: boolean, uuid?: string, anyTechBase: boolean = false): IEquipmentItem[] {
        const catalogItem = findByTag(getEquipmentListByTech(this._tech.tag, true), tag)
            ?? (anyTechBase ? findByTag(this._otherTechBaseEquipment(), tag) : undefined);
        if (catalogItem) {
            this._equipmentList.push(this._newEquipment(catalogItem, location, rear, uuid));
            this._calc();
        }
        return this._equipmentList;
    }

    // A mounted copy of a catalog item. Only this vehicle's own locations (never the rotor) are kept, and ids
    // must be unique strings: saved data may hold anything.
    private _newEquipment(catalogItem: IEquipmentItem, location?: unknown, rear?: unknown, uuid?: unknown): IEquipmentItem {
        const validLocation = typeof location === "string" && location !== "rotor"
            && this.getLocations().some((loc) => loc.tag === location) ? location : undefined;
        const freshId = typeof uuid !== "string" || !uuid || this._equipmentList.some((item) => item.uuid === uuid);
        // A deep copy: mounted items never share nested data (ranges, Alpha Strike values) with each other.
        const equipment: IEquipmentItem = { ...JSON.parse(JSON.stringify(catalogItem)), location: validLocation, rear: rear === true, uuid: freshId ? generateUUID() : uuid as string };
        if (equipment.isModularArmor) {
            equipment.currentAdditionalArmor = equipment.additionalArmor ?? 10;
        }
        return equipment;
    }

    // OmniVehicles ---------------------------------------------------------------------------------------------

    /** Vehicles of either technology base may be built as OmniVehicles (TM p.97). */
    public isOmni(): boolean { return this._omni; }

    public setOmni(omni: boolean): boolean {
        // A FrankenVehicle is not an OmniVehicle, as a FrankenMech is not an OmniMech (CO p.213).
        this._omni = omni === true && !this._frankenVehicle;
        if (!this._omni) this._podUUIDs.clear();
        this._calc();
        return this._omni;
    }

    /** On an OmniVehicle: is the item pod-mounted, and not fixed to the base chassis? */
    public isPodMounted(uuid: string | undefined): boolean { return this._omni && !!uuid && this._podUUIDs.has(uuid); }

    public setPodMounted(uuid: string | undefined, pod: boolean): boolean {
        if (!uuid) return false;
        if (this._omni && pod && this._equipmentList.some((item) => item.uuid === uuid)) this._podUUIDs.add(uuid);
        else this._podUUIDs.delete(uuid);
        this._calc();
        return this.isPodMounted(uuid);
    }

    /** Tonnage of the pod-mounted equipment. */
    public getPodTonnage(): number {
        return Math.round(this._equipmentList.filter((item) => this.isPodMounted(item.uuid)).reduce((sum, item) => sum + (item.weight || 0), 0) * 1000) / 1000;
    }

    /** Tonnage the base chassis leaves for pods: what is pod-mounted, and what is still unspent. */
    public getPodSpace(): number {
        return this._omni ? Math.round((this.getPodTonnage() + Math.max(0, this.getRemainingTonnage())) * 1000) / 1000 : 0;
    }

    public removeEquipment(uuid: string): IEquipmentItem[] {
        this._podUUIDs.delete(uuid);
        this._equipmentList = this._equipmentList.filter((item) => item.uuid !== uuid);
        this._calc();
        return this._equipmentList;
    }

    public setEquipmentLocation(uuid: string, location: string): IEquipmentItem[] {
        const item = this._equipmentList.find((equipment) => equipment.uuid === uuid);
        // Equipment goes in the body locations or the turret, never the rotor.
        if (location && (location === "rotor" || !this.getLocations().some((loc) => loc.tag === location))) {
            return this._equipmentList;
        }
        if (item) {
            if (item.isModularArmor && location && this._equipmentList.some(equipment =>
                equipment.uuid !== uuid && equipment.isModularArmor && equipment.location === location
            )) {
                return this._equipmentList;
            }
            item.location = location;
            // A pintle sits on a side; in the turret or unplaced, the weapon is off it (TM p.234).
            if (item.pintle && (!location || location === "turret")) item.pintle = false;
            this._calc();
        }
        return this._equipmentList;
    }

    public hasActiveModularArmor(): boolean {
        return this._equipmentList.some(item =>
            item.isModularArmor && item.location && (item.currentAdditionalArmor ?? item.additionalArmor ?? 0) > 0
        );
    }

    // Combat Vehicles allocate equipment against per-location slot capacity (space.combatVehicle)
    // rather than a fixed 'Mech-style critical slot grid.
    public getEquipmentSlotsUsed(location: string): number {
        return this._equipmentList
            .filter((item) => item.location === location)
            .reduce((sum, item) => sum + this.getItemSlots(item), 0);
    }

    /** Item slots one piece of equipment takes: the Support Vehicle column on a Support Vehicle (TM p.136). */
    public getItemSlots(item: IEquipmentItem): number {
        return Math.max(0, (this._support ? item.space?.supportVehicle : item.space?.combatVehicle) ?? 0);
    }

    // Mech-only physical/melee weapons (hatchet, sword, claw, mace, retractable blade) and
    // hand-actuator-dependent equipment cannot be mounted on Combat Vehicles.
    private _isEquipmentAllowedForVehicle(item: IEquipmentItem): boolean {
        if (item.requiresHandActuator) return false;
        if (item.metadata?.domains && !item.metadata.domains.includes("vehicle")) return false;
        // No combat vehicle slot value in the equipment tables: not vehicle equipment (TM pp.341-345, TO:AUE pp.217-223).
        // Support Vehicles read their own column.
        if (((this._support ? item.space?.supportVehicle : item.space?.combatVehicle) ?? 0) < 0) return false;
        // Small Support Vehicles carry only light and medium (infantry) weapons, not the heavy ones in these
        // catalogs; larger ones only heavy weapons (TM p.136).
        const lightWeapon = !!findSupportVehicleLightWeapon(item.tag);
        if (lightWeapon) return this._isSmallSupportVehicle();
        if (this._isSmallSupportVehicle() && (this._isWeapon(item) || item.isAmmo)) return false;
        // TSEMP cannons need a fusion or fission engine, the BattleMech Taser a fusion engine (IO:AE p.85, TO:AUE p.158).
        if (!engineMeetsRequirement(item.requiresEngine, this._rulesEngineTag())) return false;

        const tag = item.tag.toLowerCase();
        const name = item.name.toLowerCase();
        return !(
            item.isMelee ||
            tag.includes("hatchet") || tag.includes("sword") || tag.includes("claw") || tag.includes("mace") ||
            name.includes("hatchet") || name.includes("sword") || name.includes("claw") || name.includes("mace")
        );
    }

    private _itemIsAvailable(introduced: number | null, extinct: number | null, reintroduced: number | null, ignoreExtinction: boolean = false): boolean {
        const introductionYear = introduced ?? 0;
        const extinctionYear = extinct ?? 0;
        const reintroductionYear = reintroduced ?? 0;
        const eraStart = this._era.yearStart;
        const eraEnd = this._era.yearEnd ?? Number.POSITIVE_INFINITY;
        const overlapsEra = introductionYear <= eraEnd && (extinctionYear === 0 || extinctionYear >= eraStart);

        if (ignoreExtinction) return introductionYear <= eraEnd;
        return overlapsEra || (reintroductionYear > 0 && reintroductionYear <= eraEnd);
    }

    /** In production in the selected era, or (at the Experimental rules level) a prototype. */
    private _datesAvailability(dates: ITechDates, rulesLevel: number): { available: boolean, asPrototype: boolean } {
        // A prototype year with no production year: IO prototype only (Experimental rules).
        const prototypeOnly = dates.introduced === null && !!dates.prototype;
        const inProduction = !prototypeOnly && this._itemIsAvailable(dates.introduced, dates.extinct, dates.reintroduced);
        const effectiveIntroduction = getEffectiveIntroduction(dates, rulesLevel);
        const asPrototype = !inProduction && effectiveIntroduction !== dates.introduced
            && this._itemIsAvailable(effectiveIntroduction, dates.extinct, dates.reintroduced);
        return { available: inProduction || asPrototype, asPrototype };
    }

    /** Availability using the Clan window for Clan designs; mixed tech may use either (as BattleMech). */
    private _techDatesAvailability(item: ITechDates & { clanDates?: ITechDates }, rulesLevel: number): { available: boolean, asPrototype: boolean } {
        const techTag = this._tech.tag;
        const innerSphere = this._datesAvailability(item, rulesLevel);
        const clan = this._clanDatesAvailability(item, rulesLevel);
        if (techTag === "clan") return clan;
        if (techTag === "is") return innerSphere;
        if (innerSphere.available && !innerSphere.asPrototype) return innerSphere;
        if (clan.available && !clan.asPrototype) return clan;
        return innerSphere.available ? innerSphere : clan;
    }

    /** Clan availability, including the Star League version before the Clan version replaces it (as BattleMech). */
    private _clanDatesAvailability(item: ITechDates & { clanDates?: ITechDates }, rulesLevel: number): { available: boolean, asPrototype: boolean } {
        const clan = this._datesAvailability(item.clanDates ?? item, rulesLevel);
        const starLeague = getStarLeagueCarryOverDates(item);
        if ((clan.available && !clan.asPrototype) || !starLeague) return clan;
        const carried = this._datesAvailability(starLeague, rulesLevel);
        return carried.available ? carried : clan;
    }

    /** Whether this Clan vehicle fields the Star League version of a component (Inner Sphere armor factor). */
    private _usesStarLeagueVersion(item: ITechDates & { clanDates?: ITechDates }): boolean {
        const starLeague = getStarLeagueCarryOverDates(item);
        if (!starLeague || !item.clanDates) return false;
        const clanInProduction = !!item.clanDates.introduced
            && this._itemIsAvailable(item.clanDates.introduced, item.clanDates.extinct, item.clanDates.reintroduced);
        return !clanInProduction
            && this._itemIsAvailable(starLeague.prototype ?? starLeague.introduced, starLeague.extinct, null);
    }

    private _setAvailability(item: IEquipmentItem, rulesLevel: number): void {
        // Equipment records carry side-specific IS or Clan dates, so extinction always applies.
        const availability = this._datesAvailability(item, rulesLevel);
        item.availableAsPrototype = availability.asPrototype;
        // One unit carries at most `maxPerUnit` of an item, or of its group (one RISC Viral Jammer of any type).
        const limitKey = item.maxPerUnitGroup ?? item.tag;
        const underUnitLimit = !item.maxPerUnit
            || this._equipmentList.filter(installed => (installed?.maxPerUnitGroup ?? installed?.tag) === limitKey).length < item.maxPerUnit;
        item.available = availability.available && this._isEquipmentAllowedForVehicle(item) && underUnitLimit;
    }

    public getAvailableEquipment(includeCustom: boolean = false, rulesLevel: number = 2): IEquipmentItem[] {
        const returnItems: IEquipmentItem[] = [];
        const techTag = this._tech.tag;
        const includeClan = ["clan", "mclan", "mis"].includes(techTag);
        const includeIS = ["is", "mis", "mclan"].includes(techTag);

        if (includeClan) {
            for (const item of getEquipmentListByTech("clan", includeCustom && !includeIS)) {
                item.catalog = item.catalog ?? (item.category === "Custom Equipment" ? "custom" : "clan");
                item.criticals = this._support ? item.space.supportVehicle ?? 0 : item.space.combatVehicle;
                this._setAvailability(item, rulesLevel);
                returnItems.push(item);
            }
        }
        if (includeIS) {
            for (const item of getEquipmentListByTech("is", includeCustom)) {
                item.catalog = item.catalog ?? (item.category === "Custom Equipment" ? "custom" : "is");
                item.criticals = this._support ? item.space.supportVehicle ?? 0 : item.space.combatVehicle;
                this._setAvailability(item, rulesLevel);
                returnItems.push(item);
            }
        }
        returnItems.sort((a, b) => (a.sort > b.sort ? 1 : a.sort < b.sort ? -1 : 0));
        // Apocryphal, Custom Homebrew and Munchkin items are only offered at their own level or above.
        const offeredLevel = includeCustom ? Math.max(rulesLevel, CUSTOM_HOMEBREW_RULES_LEVEL) : rulesLevel;
        return returnItems.filter((item) => isEquipmentWithinRulesLevel(item, offeredLevel));
    }

    public getAvailableEquipmentByCatalog(catalog: "all" | "is" | "clan" | "custom", includeCustom: boolean = false, rulesLevel: number = 2): IEquipmentItem[] {
        const equipment = this.getAvailableEquipment(includeCustom, rulesLevel);
        return catalog === "all" ? equipment : equipment.filter((item) => item.catalog === catalog);
    }

    public getPilot(): Pilot {
        return this._pilot;
    }

    public setPilot(pilot: Pilot): Pilot {
        this._pilot = pilot;
        return this._pilot;
    }

    public getWeights(): { name: string; weight: number }[] {
        return this._weights;
    }

    public getCurrentTonnage(): number {
        return this._currentTonnage;
    }

    public getRemainingTonnage(): number {
        return this._remainingTonnage;
    }

    /** Control systems: 5% of tonnage, rounded up to the half ton (TM, as implemented by MegaMek). */
    public getControlSystemsWeight(): number {
        // A Support Vehicle's controls are part of its chassis (TM p.131).
        if (this._support) return 0;
        return Math.ceil(this._tonnage * 0.05 * 2) / 2;
    }

    /**
     * Lift/dive equipment for hover, VTOL, WiGE, hydrofoil and submarine vehicles: 10% of tonnage,
     * rounded up to the half ton (TM, as implemented by MegaMek). Other motive types need none.
     */
    public getLiftEquipmentWeight(): number {
        // Support Vehicles build lift/dive equipment and rotors into the chassis (TM p.130).
        if (this._support) return 0;
        return this._motiveType.liftEquipment ? Math.ceil(this._tonnage * 0.1 * 2) / 2 : 0;
    }

    /**
     * Defensive BV type modifier by motive (as implemented by MegaMek CombatVehicleBVCalculator; TM p.316); naval and
     * Rail units 0.6 (TO:AUE p.190).
     */
    private _bvTypeModifier(): number {
        switch (this._motiveType.tag) {
            case "tracked": return 0.9;
            case "wheeled": return 0.8;
            case "hover":
            case "vtol":
            case "wige": return 0.7;
            default: return 0.6;
        }
    }

    public hasTargetingComputer(): boolean {
        return this._equipmentList.some((item) => item.variableFormula?.startsWith("targeting-computer"));
    }

    private _isWeapon(item: IEquipmentItem): boolean {
        return !item.isAmmo && !item.isEquipment && !item.battleValueDefensive && (item.battleValue || 0) > 0;
    }

    /**
     * Battle Value (TM Combat Vehicle BV, as implemented by MegaMek CombatVehicleBVCalculator;
     * provisional until checked against the book):
     * Defensive = (armor x 2.5 x armor type + structure x 1.5 x structure type + defensive
     * equipment) x motive type modifier x (1 + best TMM / 10), where VTOLs and WiGEs are airborne
     * (+1 TMM) and jumping adds +1.
     * Offensive = (weapons + ammunition (capped at the weapons it feeds) + tonnage / 2) x Speed
     * Factor (TM p.316) for Flank MP + half Jump MP. The weaker of the front and rear arcs counts
     * half; turret and side weapons count in full. Checked against the MUL BV of published
     * tracked, wheeled, hover, VTOL and hydrofoil designs (vehicle.test.ts).
     */
    private _calcBattleValue(): void {
        let log = "<strong>DEFENSIVE BATTLE RATING</strong><br />";
        const locations = this.getLocations().map((loc) => loc.tag);
        const modularArmor = this._equipmentList
            .filter((item) => item.isModularArmor)
            .reduce((sum, item) => sum + (item.currentAdditionalArmor ?? item.additionalArmor ?? 0), 0);
        let armorBV = 0;
        if (this._support) {
            const armorPoints = locations.reduce((sum, loc) => sum + (this._armorAllocation[loc] ?? 0), 0) + modularArmor;
            // Support Vehicles multiply their armor by BAR / 10 (TM p.307). TM p.308's CellCo Ranger example leaves out
            // the x 2.5 (38 x 0.7 = 26.6); the rule text and MegaMek keep it, so it is read as a misprint.
            const armorMultiplier = this._support.bar / 10;
            armorBV = armorPoints * 2.5 * armorMultiplier;
            log += `Armor: ${armorPoints} points x 2.5 x ${armorMultiplier} (BAR ${this._support.bar} / 10) = ${armorBV.toFixed(2)}<br />`;
        } else if (this.isPatchworkArmor()) {
            // Patchwork: each location's points at its own type's modifier (TO:AUE p.189); modular armor counts at 1.
            for (const loc of locations) {
                const locationArmor = this.getPatchworkArmorType(loc);
                const points = this._armorAllocation[loc] ?? 0;
                const multiplier = Vehicle._armorBVMultiplier(locationArmor);
                armorBV += points * 2.5 * multiplier;
                log += `Armor (${LOCATION_NAMES[loc]}): ${points} points x 2.5 x ${multiplier} (${locationArmor.name}) = ${(points * 2.5 * multiplier).toFixed(2)}<br />`;
            }
            if (modularArmor > 0) {
                armorBV += modularArmor * 2.5;
                log += `Armor (Modular): ${modularArmor} points x 2.5 = ${(modularArmor * 2.5).toFixed(2)}<br />`;
            }
        } else {
            const armorPoints = locations.reduce((sum, loc) => sum + (this._armorAllocation[loc] ?? 0), 0) + modularArmor;
            const armorMultiplier = Vehicle._armorBVMultiplier(this._armorType);
            armorBV = armorPoints * 2.5 * armorMultiplier;
            log += `Armor: ${armorPoints} points x 2.5 x ${armorMultiplier} (${this._armorType.name}) = ${armorBV.toFixed(2)}<br />`;
        }

        const structure = this.getStructureAllocation();
        const structurePoints = locations.reduce((sum, loc) => sum + (structure[loc] ?? 0), 0);
        const structureMultiplier = this._structureType === "reinforced" && !this._support ? 2 : 1;
        const structureBV = structurePoints * 1.5 * structureMultiplier;
        log += `Internal Structure: ${structurePoints} points x 1.5 x ${structureMultiplier} = ${structureBV.toFixed(2)}<br />`;

        let defensiveEquipmentBV = 0;
        let amsAmmoBV = 0;
        let amsBV = 0;
        const weapons = this._equipmentList.filter((item) => !item.isAmmo);
        for (const item of this._equipmentList) {
            if (item.isAmmo) {
                const fed = weapons.find((weapon) => weapon.battleValueDefensive && getCompatibleAmmo(weapon, item));
                if (fed) amsAmmoBV += getAmmoBattleValuePerTon(fed, item) * item.weight;
            } else if (item.battleValueDefensive) {
                defensiveEquipmentBV += item.battleValue || 0;
                if (item.weaponType?.includes("AMS")) amsBV += item.battleValue || 0;
                log += `+ Defensive Equipment: ${escapeLogText(item.name)} = ${item.battleValue || 0}<br />`;
            }
        }
        defensiveEquipmentBV += Math.min(amsAmmoBV, amsBV);

        let defensive = armorBV + structureBV + defensiveEquipmentBV;
        const typeModifier = this._bvTypeModifier();
        log += `Subtotal ${defensive.toFixed(2)} x ${typeModifier} (${this._motiveType.name} type modifier)`;
        defensive *= typeModifier;
        log += ` = ${defensive.toFixed(2)}<br />`;

        // An unmotorized Trailer counts as Flank MP 1 (TM p.308).
        const flank = this._support?.engine === "none" ? 1 : this.getFlankMP();
        const airborne = this._motiveType.tag === "vtol" || this._motiveType.tag === "wige";
        const runTMM = flank > 0 ? getMovementModifier(flank) + (airborne ? 1 : 0) : 0;
        const jumpTMM = this._jumpMP > 0 ? getMovementModifier(this._jumpMP) + 1 : 0;
        const defensiveFactor = 1 + Math.max(runTMM, jumpTMM) / 10;
        defensive *= defensiveFactor;
        log += `Defensive Factor: 1 + max(Flank TMM ${runTMM}${airborne ? " incl. +1 airborne" : ""}, Jump TMM ${jumpTMM}) / 10 = ${defensiveFactor.toFixed(2)} -> ${defensive.toFixed(2)}<br />`;

        log += "<strong>OFFENSIVE BATTLE RATING</strong><br />";
        const hasTC = this.hasTargetingComputer();
        const baseWeaponBV = (item: IEquipmentItem) => (item.battleValue || 0) * (hasTC && isTargetingComputerWeapon(item) ? 1.25 : 1);
        const offensiveWeapons = this._equipmentList.filter((item) => this._isWeapon(item));
        const arcBV = (location: string) => offensiveWeapons.filter((item) => item.location === location).reduce((sum, item) => sum + baseWeaponBV(item), 0);
        // The weaker of the front and rear arcs counts half; side and turret weapons count in full.
        // (MegaMek also halves side weapons when the rear arc is stronger, but the MUL does not:
        // Sea Skimmer Hydrofoil, BV 288.)
        const rearIsFront = arcBV("front") < arcBV("rear");
        const isHalved = (item: IEquipmentItem) => item.location === (rearIsFront ? "front" : "rear");
        let weaponBV = 0;
        const weaponBVByTag: Record<string, number> = {};
        for (const item of offensiveWeapons) {
            const value = baseWeaponBV(item) * (isHalved(item) ? 0.5 : 1);
            weaponBV += value;
            weaponBVByTag[item.tag] = (weaponBVByTag[item.tag] ?? 0) + value;
            log += `+ ${escapeLogText(item.name)} (${escapeLogText(item.location || "unallocated")}) = ${value.toFixed(2)}${isHalved(item) ? " (rear arc x 0.5)" : ""}<br />`;
        }

        const ammoBVByTag: Record<string, number> = {};
        for (const ammo of this._equipmentList.filter((item) => item.isAmmo)) {
            const fed = offensiveWeapons.find((weapon) => getCompatibleAmmo(weapon, ammo));
            if (!fed) continue;
            ammoBVByTag[fed.tag] = (ammoBVByTag[fed.tag] ?? 0) + getAmmoBattleValuePerTon(fed, ammo) * ammo.weight;
        }
        let ammoBV = 0;
        for (const [tag, value] of Object.entries(ammoBVByTag)) {
            const capped = Math.min(value, weaponBVByTag[tag] ?? 0);
            ammoBV += capped;
            log += `+ Ammunition for ${escapeLogText(tag)} = ${capped.toFixed(2)}${capped < value ? " (capped at weapon BV)" : ""}<br />`;
        }
        if (this._support) {
            // Heavy weapons and their ammunition x 0.8 without fire control, x 0.9 with basic (TM pp.307, 316).
            const fireControl = SUPPORT_VEHICLE_FIRE_CONTROL[this._support.fireControl];
            if (fireControl.bvMultiplier !== 1) {
                weaponBV *= fireControl.bvMultiplier;
                ammoBV *= fireControl.bvMultiplier;
                log += `Weapons and ammunition x ${fireControl.bvMultiplier} (${fireControl.name === "None" ? "no fire control" : escapeLogText(fireControl.name)})<br />`;
            }
        }

        const weightBV = this._tonnage / 2;
        let offensive = weaponBV + ammoBV + weightBV;
        // Rail units find their Speed Factor from Cruise MP, not Flank MP (TO:AUE p.190).
        const rail = this.getSupportVehicleMotive() === "rail";
        const speedMP = (rail ? this.getCruiseMP() : flank) + Math.round(this._jumpMP / 2);
        const speedFactor = Math.round(Math.pow(1 + (speedMP - 5) / 10, 1.2) * 100) / 100;
        log += `(Weapons ${weaponBV.toFixed(2)} + Ammo ${ammoBV.toFixed(2)} + Tonnage / 2 ${weightBV}) x Speed Factor ${speedFactor} (MP ${speedMP})`;
        offensive *= speedFactor;
        log += ` = ${offensive.toFixed(2)}<br />`;

        this._battleValue = Math.round(defensive + offensive);
        log += `<strong>Battle Value</strong>: ${defensive.toFixed(2)} + ${offensive.toFixed(2)} = ${this._battleValue} (provisional)<br />`;
        this._calcLogBV = log;
    }

    /**
     * C-Bill cost (TM Combat Vehicle cost, as implemented by MegaMek CombatVehicleCostCalculator;
     * provisional): engine, armor, structure, control systems, power amplifiers, heat sinks,
     * turrets, equipment and ammunition, lift/dive equipment, then x (1 + tonnage / motive divisor).
     * Vehicular jump jets cost 200 x tonnage x Jump MP squared and a pair of sponson turrets 4,000 per ton of
     * sponson (TO p. 411).
     */
    /**
     * Support Vehicle cost (TM pp.280, 285): (chassis 2,500 x structure tons x the modifications' cost multipliers
     * + engine 5,000 x engine tons x the engine's multiplier + armor points x BAR cost) x the Structural Tech
     * Rating multiplier, plus heat sinks, turret and power amplifiers; then equipment and fire control (5 or 10
     * percent of the weapons, TM p.293), all x (1 + tonnage / the motive divisor) x 1.25 for an OmniVehicle.
     */
    private _calcSupportVehicleCost(support: IVehicleSupportExport): void {
        const rows: [string, number][] = [];
        const mods = this.getSupportVehicleChassisModifications();
        const modMultiplier = mods.reduce((product, tag) => product * (getSupportVehicleChassisModification(tag)?.costMultiplier ?? 1), 1);
        const chassis = SUPPORT_VEHICLE_CHASSIS_COST_PER_TON * this.getStructureWeight() * modMultiplier;
        const engine = this.getSupportVehicleEngine();
        const engineCost = SUPPORT_VEHICLE_ENGINE_COST_PER_TON * this.getEngineWeight() * (engine?.costMultiplier ?? 0);
        const armorCost = this._armorPoints() * (supportVehicleArmor.find((armor) => armor.bar === support.bar)?.costPerPoint ?? 0);
        // Advanced Support Vehicles have no Tech Rating multiplier (TO:AUE p.229).
        const techMultiplier = this.isAdvancedSupportVehicle() ? 1 : SUPPORT_VEHICLE_COST_TECH_MULTIPLIER[support.structuralTechRating];
        rows.push([`Chassis (${SUPPORT_VEHICLE_CHASSIS_COST_PER_TON} x ${this.getStructureWeight()} t${modMultiplier !== 1 ? ` x ${modMultiplier.toFixed(3)}` : ""})`, chassis]);
        if (engine && engine.tag !== "none") rows.push([`${engine.name} Engine (${SUPPORT_VEHICLE_ENGINE_COST_PER_TON} x ${this.getEngineWeight()} t x ${engine.costMultiplier})`, engineCost]);
        if (armorCost > 0) rows.push([`Armor (${this._armorPoints()} points of BAR ${support.bar})`, armorCost]);
        const structural = (chassis + engineCost + armorCost) * techMultiplier;
        rows.push([`Structural subtotal x ${techMultiplier} (Structural Tech Rating ${support.structuralTechRating.toUpperCase()})`, structural - chassis - engineCost - armorCost]);
        if (this.getWeightedHeatSinks() > 0) rows.push([`Heat Sinks (${this.getWeightedHeatSinks()})`, this.getWeightedHeatSinks() * SUPPORT_VEHICLE_HEAT_SINK_COST]);
        if (this._hasTurret) rows.push([`Turret (${this._supportTurretWeight()} t)`, this._supportTurretWeight() * SUPPORT_VEHICLE_TURRET_COST_PER_TON]);
        // Pintles: 1,000 C-bills a ton (TM p.281).
        if (this.getPintleWeight() > 0) rows.push([`Pintle Mounts (${this.getPintleWeight()} t)`, this.getPintleWeight() * 1000]);
        const bayCost = this._bays.reduce((sum, bay) => sum + getVehicleBayCost(bay), 0);
        if (bayCost > 0) rows.push(["Transport Bays and Doors", bayCost]);
        if (this.getPowerAmplifierWeight() > 0) rows.push(["Power Amplifiers", this.getPowerAmplifierWeight() * SUPPORT_VEHICLE_POWER_AMPLIFIER_COST_PER_TON]);
        const equipmentCost = this._equipmentList.reduce((sum, item) => sum + (item.isAmmo ? (item.cbills || 0) * item.weight : item.cbills || 0), 0);
        rows.push(["Weapons, Equipment and Ammunition", equipmentCost]);
        const fireControl = SUPPORT_VEHICLE_FIRE_CONTROL[support.fireControl];
        if (fireControl.costFactor > 0) {
            const weaponCost = this._equipmentList.filter((item) => this._isWeapon(item)).reduce((sum, item) => sum + (item.cbills || 0), 0);
            rows.push([`${fireControl.name} (${fireControl.costFactor * 100}% of weapons)`, weaponCost * fireControl.costFactor]);
        }
        const motive = this.getSupportVehicleMotive() ?? "wheeled";
        const divisor = SUPPORT_VEHICLE_COST_TONNAGE_DIVISOR[motive];
        const subtotal = rows.reduce((sum, [, value]) => sum + value, 0);
        const multiplier = 1 + this._tonnage / divisor;
        const omni = this._omni ? 1.25 : 1;
        this._cost = Math.round(subtotal * multiplier * omni);
        this._calcLogCost = rows.map(([name, value]) => `${escapeLogText(name)}: ${(Math.round(value * 100) / 100).toLocaleString()}`).join("<br />")
            + `<br />Subtotal ${(Math.round(subtotal * 100) / 100).toLocaleString()} x ${multiplier.toFixed(4)} (1 + ${this._tonnage} / ${divisor})${this._omni ? " x 1.25 (OmniVehicle)" : ""}`
            + ` = <strong>${this._cost.toLocaleString()}</strong>`;
    }

    private _calcCost(): void {
        if (this._support) {
            this._calcSupportVehicleCost(this._support);
            return;
        }
        const rows: [string, number][] = [];
        const engineRating = Math.ceil(this.getEngineRating() / 5) * 5;
        // Above rating 400 the large engine record gives the name and cost (twice the base type, TO:AUE p.219).
        const engineForCost = (engineRating > MAX_STANDARD_ENGINE_RATING ? getLargeEngineType(this._engineType.tag) : undefined) ?? this._engineType;
        rows.push([`${engineForCost.name} (${engineForCost.costMultiplier} x rating ${engineRating} x ${this._tonnage} t / 75)`,
            (engineForCost.costMultiplier || 0) * engineRating * this._tonnage / 75]);
        if (this.isPatchworkArmor()) {
            // Patchwork: each location's armor at its own type's cost per ton.
            for (const location of this.getLocations()) {
                const weight = this.getPatchworkLocationWeight(location.tag);
                const locationArmor = this.getPatchworkArmorType(location.tag);
                if (weight > 0) rows.push([`Armor, ${location.name} (${locationArmor.name}, ${weight} t)`, weight * (locationArmor.costMultiplier || 10000)]);
            }
        } else {
            rows.push([`Armor (${this.getArmorWeight()} t)`, this.getArmorWeight() * (this._armorType.costMultiplier || 10000)]);
        }
        rows.push([`Internal Structure (${this.getStructureWeight()} t)`, this.getStructureWeight() * 10000]);
        rows.push([`Control Systems (${this.getControlSystemsWeight()} t)`, this.getControlSystemsWeight() * 10000]);
        if (this.getPowerAmplifierWeight() > 0) rows.push(["Power Amplifiers", this.getPowerAmplifierWeight() * 20000]);
        if (this.getWeightedHeatSinks() > 0) rows.push([`Heat Sinks (${this.getWeightedHeatSinks()})`, this.getWeightedHeatSinks() * 2000]);
        const turretWeaponWeight = this._equipmentList
            .filter((item) => (item.location === "turret" || item.location === "turret2") && !item.isAmmo)
            .reduce((sum, item) => sum + item.weight, 0) / 10;
        if (turretWeaponWeight > 0) rows.push(["Turret", Math.ceil(turretWeaponWeight * 2) / 2 * 5000]);
        const equipmentCost = this._equipmentList.reduce((sum, item) => sum + (item.isAmmo ? (item.cbills || 0) * item.weight : item.cbills || 0), 0);
        rows.push(["Weapons, Equipment and Ammunition", equipmentCost]);
        const bayCost = this._bays.reduce((sum, bay) => sum + getVehicleBayCost(bay), 0);
        if (bayCost > 0) rows.push(["Transport Bays and Doors", bayCost]);
        if (this._sponsonTurrets) rows.push([`Sponson Turrets (${this.getSponsonWeight()} t)`, this.getSponsonWeight() * 4000]);
        if (this._jumpMP > 0) rows.push(["Jump Jets", 200 * this._tonnage * this._jumpMP * this._jumpMP]);
        if (this._motiveType.liftEquipment) {
            const liftTons = Math.ceil(this._tonnage / 5) / 2;
            rows.push([`${this._motiveType.liftEquipment} (${liftTons} t)`, liftTons * (this._motiveType.hasRotor ? 40000 : 20000)]);
        }
        const subtotal = rows.reduce((sum, [, value]) => sum + value, 0);
        const divisors: Record<string, number> = {
            hover: 50, "naval-sub": 50, hydrofoil: 75, "naval-surface": 200, wheeled: 200, tracked: 100, vtol: 30, wige: 25,
        };
        const multiplier = 1 + this._tonnage / (divisors[this._motiveType.tag] ?? 100);
        // Omni Conversion Cost: x 1.25 (TM p.285).
        const omni = this._omni ? 1.25 : 1;
        this._cost = Math.round(subtotal * multiplier * omni);
        this._calcLogCost = rows.map(([name, value]) => `${escapeLogText(name)}: ${Math.round(value).toLocaleString()}`).join("<br />")
            + `<br />Subtotal ${Math.round(subtotal).toLocaleString()} x ${multiplier.toFixed(3)} (1 + ${this._tonnage} / ${divisors[this._motiveType.tag] ?? 100})${this._omni ? " x 1.25 (OmniVehicle)" : ""}`
            + ` = <strong>${this._cost.toLocaleString()}</strong> (provisional)`;
    }

    public getBattleValue(): number {
        return this._battleValue;
    }

    public getBattleValueLog(): string {
        return this._calcLogBV;
    }

    public getCBillCost(): number {
        return this._cost;
    }

    public getCBillCostLog(): string {
        return this._calcLogCost;
    }

    /**
     * A Support Vehicle turret weighs 10 percent of what it carries, ammunition excluded, rounded up to the kilogram
     * (Small) or the half ton (TM p.137); an empty turret weighs nothing until it is filled. Each of a Large Naval
     * Vessel's turrets is weighed on its own (TO:AUE p.71).
     */
    private _supportTurretWeight(): number {
        let total = 0;
        for (const turret of this.getLocations().filter((loc) => isTurretLocation(loc.tag))) {
            const weight = this._roundSupportWeight(this._equipmentList
                .filter((item) => item.location === turret.tag && !item.isAmmo)
                .reduce((sum, item) => sum + item.weight, 0) * 0.1);
            total += weight;
        }
        return Math.round(total * 1000) / 1000;
    }

    private _calcSupportVehicleWeights(): void {
        const engine = this.getSupportVehicleEngine();
        this._weights.push({ name: "Chassis (Internal Structure)", weight: this.getStructureWeight() });
        if (engine && engine.tag !== "none") this._weights.push({ name: `${engine.name} Engine`, weight: this.getEngineWeight() });
        if (this.getSupportVehicleFuelWeight() > 0) this._weights.push({ name: "Fuel", weight: this.getSupportVehicleFuelWeight() });
        this._weights.push({ name: `Armor (BAR ${this.getBAR()})`, weight: this.getArmorWeight() });
        if (this.getWeightedHeatSinks() > 0) this._weights.push({ name: "Heat Sinks", weight: this.getWeightedHeatSinks() });
        if (this.getPowerAmplifierWeight() > 0) this._weights.push({ name: "Power Amplifiers", weight: this.getPowerAmplifierWeight() });
        if (this.getSupportVehicleFireControlWeight() > 0) {
            this._weights.push({ name: SUPPORT_VEHICLE_FIRE_CONTROL[this.getSupportVehicleFireControl()].name, weight: this.getSupportVehicleFireControlWeight() });
        }
        if (this._troopSpace > 0) this._weights.push({ name: "Troop Space", weight: this._troopSpace });
        if (this._hasTurret) this._weights.push({ name: "Turret", weight: this._supportTurretWeight() });
        if (this.getPintleWeight() > 0) this._weights.push({ name: "Pintle Mounts", weight: this.getPintleWeight() });
        // On Medium and Large Support Vehicles, items weighed in kilograms are totalled and rounded up to the
        // half ton; loose kilograms may go to cargo instead, so cargo by the kilogram joins the total (TM p.137).
        let smallItems = 0;
        for (const bay of this._bays) {
            const weight = getVehicleBayWeight(bay);
            if (!this._isSmallSupportVehicle() && (weight * 2) % 1 !== 0) smallItems += weight;
            else this._weights.push({ name: this.getBayName(bay), weight });
        }
        for (const item of this._equipmentList) {
            if (!this._isSmallSupportVehicle() && (item.weight * 2) % 1 !== 0) smallItems += item.weight;
            else this._weights.push({ name: item.name, weight: item.weight });
        }
        if (smallItems > 0) {
            this._weights.push({ name: `Items weighed in kilograms (${Math.round(smallItems * 1000)} kg)`, weight: roundSupportVehicleWeight(smallItems, false) });
        }
    }

    /** Extended fuel tanks weigh 10 percent of the engine, rounded up to the half ton, 500 C-bills a ton (TM p.244). */
    private _sizeVariableEquipment(): void {
        for (const item of this._equipmentList) {
            if (item.variableFormula !== "extended-fuel-tank") continue;
            const size = sizeVariableEquipment("extended-fuel-tank", { tonnage: this._tonnage, engineRating: this.getEngineRating(), engineWeight: this.getEngineWeight(), directFireWeaponWeight: 0 });
            if (size) {
                item.weight = size.weight;
                item.cbills = size.cbills;
            }
        }
    }

    private _calc() {
        this._prunePatchworkArmor();
        this._pruneFrankenVehicle();
        this._weights = [];
        this._sizeVariableEquipment();
        if (this._support) {
            this._calcSupportVehicleWeights();
            // To the gram, so kilogram weights do not leave floating-point remainders.
            this._currentTonnage = Math.round(this._weights.reduce((sum, w) => sum + w.weight, 0) * 1e6) / 1e6;
            this._remainingTonnage = Math.round((this._tonnage - this._currentTonnage) * 1e6) / 1e6;
            this._calcBattleValue();
            this._calcCost();
            return;
        }

        this._weights.push({ name: "Internal Structure", weight: this.getStructureWeight() });
        this._weights.push({ name: this._engineType.name, weight: this.getEngineWeight() });
        this._weights.push({ name: "Control Systems", weight: this.getControlSystemsWeight() });
        if (this._motiveType.liftEquipment) {
            this._weights.push({ name: this._motiveType.liftEquipment, weight: this.getLiftEquipmentWeight() });
        }
        this._weights.push({ name: "Armor", weight: this.getArmorWeight() });

        if (this.getWeightedHeatSinks() > 0) {
            this._weights.push({ name: `${this._heatSinkType.name} Heat Sinks`, weight: this.getWeightedHeatSinks() });
        }
        if (this.getPowerAmplifierWeight() > 0) {
            this._weights.push({ name: "Power Amplifiers", weight: this.getPowerAmplifierWeight() });
        }
        if (this._jumpMP > 0) {
            this._weights.push({ name: "Jump Jets", weight: this.getJumpJetWeight() });
        }
        if (this._troopSpace > 0) {
            this._weights.push({ name: "Troop Space", weight: this._troopSpace });
        }
        for (const bay of this._bays) this._weights.push({ name: this.getBayName(bay), weight: getVehicleBayWeight(bay) });

        if (this._hasTurret && this._dualTurret) {
            this._weights.push({ name: "Front Turret", weight: this.getTurretWeight("turret2") });
        }
        if (this._hasTurret) {
            this._weights.push({ name: this.getTurretName(), weight: this.getTurretWeight("turret") });
        }
        if (this._sponsonTurrets) {
            this._weights.push({ name: "Sponson Turrets", weight: this.getSponsonWeight() });
        }

        for (const item of this._equipmentList) {
            this._weights.push({ name: item.name, weight: item.weight });
        }

        this._currentTonnage = this._weights.reduce((sum, w) => sum + w.weight, 0);
        this._remainingTonnage = this._tonnage - this._currentTonnage;
        this._calcBattleValue();
        this._calcCost();
    }

    // Alpha Strike conversion for Combat Vehicles (Alpha Strike Companion conversion rules as
    // implemented by MegaMek's ASConverter; checked against the MUL cards in vehicle.test.ts).
    // Weapon damage comes from each catalog record's alphaStrike values.

    // Size: under 40 t 1, under 60 t 2, under 80 t 3, else 4 (matches 1,189 of 1,190 MUL vehicles).
    public getAlphaStrikeSize(): number {
        // Support Vehicles by type and weight: Small 1, Medium 2, Large 3; Large Naval Vessels 3 to 5 (ASC p.92).
        const weightClass = this.getSupportVehicleWeightClass();
        if (weightClass) {
            if (weightClass.size === "small") return 1;
            if (weightClass.size === "medium") return 2;
            if (this.isLargeNavalVessel()) return this._tonnage > 30000 ? 5 : this._tonnage > 6000 ? 4 : 3;
            return 3;
        }
        if (this._tonnage >= 80) return 4;
        if (this._tonnage >= 60) return 3;
        if (this._tonnage >= 40) return 2;
        return 1;
    }

    // Movement mode code on the AS card (e.g. 18"h for a Hover unit), as the Master Unit List prints
    // them: t tracked, w wheeled, h hover, v VTOL, g WiGE, n naval/hydrofoil, s submarine.
    public getAlphaStrikeMovementType(): string {
        return this._motiveType.alphaStrikeMove;
    }

    // AS ground movement conversion: 1 Cruise MP = 2".
    public getAlphaStrikeMovement(): number {
        return this.getCruiseMP() * 2;
    }

    /** AS Target Movement Modifier from movement in inches. */
    public static alphaStrikeTMM(inches: number): number {
        if (inches >= 35) return 5;
        if (inches >= 19) return 4;
        if (inches >= 13) return 3;
        if (inches >= 9) return 2;
        if (inches >= 5) return 1;
        return 0;
    }

    private static _roundUpToTenth(value: number): number {
        return Math.ceil(Math.round(value * 1000) / 100) / 10;
    }

    /** Rounded up to the tenth; under 0.5 is minimal damage (0*), otherwise rounded up. */
    private static _asDamage(raw: number): IVehicleASDamageValue {
        const tenth = Vehicle._roundUpToTenth(raw);
        if (tenth <= 0) return { damage: 0, minimal: false };
        if (tenth < 0.5) return { damage: 0, minimal: true };
        return { damage: Math.ceil(tenth), minimal: false };
    }

    /**
     * A special ability's damage vector (as implemented by MegaMek ASDamageVector): a turret's
     * standard damage rounds up; REAR and FLK round normally; LRM/SRM/AC/IF round normally with no
     * minimal damage. Values are rounded up to the tenth first; 0 prints as "-".
     */
    private static _asVector(values: number[], rounding: "up" | "normal" | "normalNoMinimal"): string {
        return values.map((raw) => {
            const tenth = Vehicle._roundUpToTenth(raw);
            let value: IVehicleASDamageValue;
            if (rounding === "up") {
                value = Vehicle._asDamage(raw);
            } else {
                const minimal = rounding === "normal" && tenth > 0 && tenth < 0.5;
                value = { damage: minimal ? 0 : Math.round(tenth), minimal };
            }
            return value.minimal ? "0*" : value.damage > 0 ? `${value.damage}` : "-";
        }).join("/");
    }

    /**
     * Damage multiplier for low ammunition: fewer than 10 shots per weapon of a kind x 0.75, none x 0
     * (as implemented by MegaMek ASDamageConverter.assembleAmmoCounts).
     */
    private _asAmmoMultiplier(weapon: IEquipmentItem): number {
        const usesAmmo = !!weapon.ammoTypes?.length || (weapon.shotsPerTon ?? 0) > 0;
        if (!usesAmmo) return 1;
        const sameWeapons = this._equipmentList.filter((item) => !item.isAmmo && item.tag === weapon.tag).length;
        const shots = this._equipmentList
            .filter((item) => item.isAmmo && getCompatibleAmmo(weapon, item))
            .reduce((sum, ammo) => sum + getWeaponShotsPerTon(weapon, ammo) * ammo.weight, 0);
        if (shots <= 0) return 0;
        return shots / sameWeapons >= 10 ? 1 : 0.75;
    }

    private _asWeaponDamage(weapon: IEquipmentItem): number[] {
        const as = weapon.alphaStrike;
        if (!as) return [0, 0, 0, 0];
        const multiplier = this._asAmmoMultiplier(weapon) * (this.hasTargetingComputer() && as.tc ? 1.1 : 1);
        return [as.rangeShort || 0, as.rangeMedium || 0, as.rangeLong || 0, as.rangeExtreme || 0].map((value) => value * multiplier);
    }

    private _asSum(weapons: IEquipmentItem[]): number[] {
        return weapons.reduce((sum, weapon) => {
            const damage = this._asWeaponDamage(weapon);
            return sum.map((value, index) => value + damage[index]);
        }, [0, 0, 0, 0]);
    }

    // Weapon families that earn their own special ability (LRM, SRM, AC, IF), from the catalog notes.
    private static _asFamily(weapon: IEquipmentItem, family: "LRM" | "SRM" | "AC" | "IF"): boolean {
        const notes = weapon.alphaStrike?.notes ?? [];
        if (family === "IF") return notes.includes("Indirect Fire");
        if (family === "AC") return notes.some((note) => note.toLowerCase() === "ac");
        return notes.includes(family);
    }

    // LRM/SRM/AC specials need at least 1 medium-range damage; IF needs long-range damage.
    private _asFamilySpecials(weapons: IEquipmentItem[]): string[] {
        const specials: string[] = [];
        for (const family of ["IF", "LRM", "SRM", "AC"] as const) {
            const damage = this._asSum(weapons.filter((weapon) => Vehicle._asFamily(weapon, family)));
            if (family === "IF") {
                if (damage[2] > 0) specials.push(`IF${Vehicle._asVector([damage[2]], "normalNoMinimal").replace("-", "0")}`);
            } else if (Vehicle._roundUpToTenth(damage[1]) >= 1) {
                specials.push(`${family}${Vehicle._asVector(family === "SRM" ? damage.slice(0, 2) : damage.slice(0, 3), "normalNoMinimal")}`);
            }
        }
        return specials;
    }

    public getAlphaStrikeArmor(): number {
        const modifiers: Record<string, number> = { hardened: 2, "ferro-lamellor": 1.2, commercial: 0.5 };
        // Armor under BAR 10 is multiplied by BAR / 10 and rounded normally before converting (ASC p.95). Patchwork:
        // like armor types are grouped and take their own multipliers before the sum (ASC errata v1.6, p.97).
        const points = this._support
            ? Math.round(this._armorPoints() * Math.min(10, this._support.bar) / 10)
            : this.getLocations().reduce((sum, loc) => sum + (this._armorAllocation[loc.tag] ?? 0)
                * (modifiers[(this.isPatchworkArmor() ? this.getPatchworkArmorType(loc.tag) : this._armorType).tag] ?? 1), 0);
        const modularPacks = this._equipmentList.filter((item) => item.isModularArmor).length;
        return Math.round((points + 10 * modularPacks) / 30);
    }

    /**
     * Internal structure / 10, rounded up. Support Vehicles over 300 tons divide by more: Rail by 15; naval by 15 to
     * 500 tons, 20 to 6,000, 25 to 12,000, 30 to 30,000 and 35 above (ASC p.97).
     */
    public getAlphaStrikeStructure(): number {
        const structure = this.getStructureAllocation();
        const points = this.getLocations().reduce((sum, loc) => sum + (structure[loc.tag] ?? 0), 0);
        return Math.ceil(points / this._alphaStrikeStructureDivisor());
    }

    private _alphaStrikeStructureDivisor(): number {
        const motive = this.getSupportVehicleMotive();
        const tons = this._tonnage;
        if (!this._support || tons <= 300) return 10;
        if (motive === "rail") return 15;
        if (motive !== "naval") return 10;
        if (tons <= 500) return 15;
        if (tons <= 6000) return 20;
        if (tons <= 12000) return 25;
        return tons <= 30000 ? 30 : 35;
    }

    public getAlphaStrikeDamage(): { short: number; medium: number; long: number; extreme: number } {
        const values = this.getAlphaStrikeStats().damageValues;
        return { short: values.short.damage, medium: values.medium.damage, long: values.long.damage, extreme: values.extreme.damage };
    }

    public getAlphaStrikeStats(): IVehicleAlphaStrikeStats {
        let log = "";
        const weapons = this._equipmentList.filter((item) => !item.isAmmo && item.alphaStrike
            && ((item.alphaStrike.rangeShort || 0) + (item.alphaStrike.rangeMedium || 0) + (item.alphaStrike.rangeLong || 0) + (item.alphaStrike.rangeExtreme || 0)) > 0);
        const standardWeapons = weapons.filter((item) => item.location !== "rear");
        const rearWeapons = weapons.filter((item) => item.location === "rear");
        const turretWeapons = weapons.filter((item) => item.location === "turret" || item.location === "turret2");

        const standardRaw = this._asSum(standardWeapons);
        const [short, medium, long, extreme] = standardRaw.map((raw) => Vehicle._asDamage(raw));
        log += `Standard damage (all but rear weapons): ${standardRaw.map((raw) => raw.toFixed(2)).join("/")} -> ${[short, medium, long].map(formatVehicleASDamage).join("/")}<br />`;

        const specials: string[] = [];
        specials.push(...this._asFamilySpecials(standardWeapons));
        if (rearWeapons.length) {
            specials.push(`REAR${Vehicle._asVector(this._asSum(rearWeapons).slice(0, 3), "normal")}`);
        }
        if (turretWeapons.length) {
            const turretSpecials = this._asFamilySpecials(turretWeapons);
            specials.push(`TUR(${[Vehicle._asVector(this._asSum(turretWeapons).slice(0, 3), "up"), ...turretSpecials].join(",")})`);
        }
        if (this._rulesEngineTag() === "ice") specials.push("EE");
        if (this._rulesEngineTag() === "cell") specials.push("FC");
        if (this._support && this.isLargeNavalVessel()) {
            // Large Naval Vessels are LG, VLG or SLG on the ground map (ASC p.92).
            const size = this.getAlphaStrikeSize();
            specials.push(size >= 5 ? "SLG" : size === 4 ? "VLG" : "LG");
        }
        if (this._support) {
            // BAR under 10 (ASC p.95); a Support Vehicle's advanced or basic fire control (AS p.170 to-hit table).
            if (this._support.bar < 10) specials.push("BAR");
            if (this._support.fireControl === "advanced") specials.push("AFC");
            if (this._support.fireControl === "basic") specials.push("BFC");
        }
        specials.push("SRCH");
        specials.push(...getVehicleBayAlphaStrikeSpecials(this._bays, this._troopSpace));
        // Communications equipment: MHQ by its tons, and RCN when it is at least a twentieth of the unit's weight
        // (as MegaMek's ASSpecialAbilityConverter assigns them).
        const commsTons = this.getCommunicationsTons();
        if (commsTons > 0) {
            specials.push(`MHQ${commsTons}`);
            if (commsTons >= this._tonnage / 20) specials.push("RCN");
        }
        if (this._motiveType.hasRotor) specials.push("ATMO");
        const equipmentSpecials = new Set<string>();
        for (const item of this._equipmentList) {
            if (item.isAmmo) continue;
            for (const code of item.alphaStrike?.specialAbility ?? []) {
                if (!code.includes("#")) equipmentSpecials.add(code);
            }
        }
        specials.push(...equipmentSpecials);
        specials.sort();

        // Exceptionally large Support Vehicles fire by arc, like DropShips: front, the two sides (fore- and aft-side
        // weapons together), rear, and each turret on its own (ASC p.103).
        let arcs: IVehicleAlphaStrikeStats["arcs"];
        if (this.isLargeNavalVessel()) {
            const arcDamage = (locations: string[]) => {
                const [arcShort, arcMedium, arcLong, arcExtreme] = this._asSum(weapons.filter((item) => locations.includes(item.location ?? ""))).map((raw) => Vehicle._asDamage(raw));
                return { short: arcShort, medium: arcMedium, long: arcLong, extreme: arcExtreme };
            };
            arcs = [
                { name: "Front", damage: arcDamage(["front"]) },
                { name: "Left", damage: arcDamage(["frontLeft", "rearLeft"]) },
                { name: "Right", damage: arcDamage(["frontRight", "rearRight"]) },
                { name: "Rear", damage: arcDamage(["rear"]) },
                ...this.getLocations().filter((loc) => isTurretLocation(loc.tag)).map((loc) => ({ name: loc.name, damage: arcDamage([loc.tag]) })),
            ];
            log += `Arcs: ${arcs.map((arc) => `${arc.name} ${[arc.damage.short, arc.damage.medium, arc.damage.long, arc.damage.extreme].map(formatVehicleASDamage).join("/")}`).join("; ")}<br />`;
        }

        const size = this.getAlphaStrikeSize();
        const move = this.getAlphaStrikeMovement();
        const jumpMove = this._jumpMP * 2;
        const tmm = Vehicle.alphaStrikeTMM(move);
        const armor = this.getAlphaStrikeArmor();
        const structure = this.getAlphaStrikeStructure();
        log += `Size ${size}, Move ${move}"${this.getAlphaStrikeMovementType()}${jumpMove ? ` / ${jumpMove}"j` : ""}, TMM ${tmm}, Armor ${armor}, Structure ${structure}<br />`;

        // Point Value (ASC, as implemented by MegaMek ASPointValueConverter for ground units).
        const pvDamage = (value: IVehicleASDamageValue) => (value.minimal ? 0.5 : value.damage);
        let offensive = pvDamage(short) + 2 * pvDamage(medium) + pvDamage(long);
        const ifSpecial = specials.find((code) => /^IF/.test(code));
        if (ifSpecial) offensive += +ifSpecial.slice(2) || 0;
        log += `Offensive value: S + 2M + L${ifSpecial ? " + IF" : ""} = ${offensive}<br />`;

        const highestMove = Math.max(move, jumpMove);
        let defensive = 0.125 * highestMove + (jumpMove > 0 ? 0.5 : 0);
        if (equipmentSpecials.has("AMS")) defensive += 1;
        const armorMultiplier = ["t", "n", "s"].includes(this._motiveType.alphaStrikeMove) ? 1.8
            : ["h", "w"].includes(this._motiveType.alphaStrikeMove) ? 1.7 : 1.5;
        let dir = armor * armorMultiplier + structure;
        const airborne = ["v", "g"].includes(this._motiveType.alphaStrikeMove);
        const jumpBonus = jumpMove > 0 && !(short.damage || medium.damage || long.damage || short.minimal || medium.minimal || long.minimal) ? 1 : 0;
        const defenseModifier = tmm + jumpBonus + (airborne ? 1 : 0);
        const defenseFactor = 1 + (defenseModifier <= 2 ? 0.1 : 0.25) * defenseModifier;
        dir = 0.5 * Math.round(dir * defenseFactor * 2);
        defensive += dir;
        log += `Defensive value: 0.125 x ${highestMove}" + DIR (${armor} x ${armorMultiplier} + ${structure}) x ${defenseFactor} = ${defensive}<br />`;

        let subtotal = offensive + defensive;
        const roundToHalf = (value: number) => 0.5 * Math.round(value * 2);
        // Agile bonus.
        let agile = 0;
        if (tmm > 1) {
            if (pvDamage(medium) > 0) agile = (tmm - 1) * pvDamage(medium);
            else if (tmm >= 3) agile = (tmm - 2) * pvDamage(short);
        }
        // Brawler malus: short-range-only (or short/medium-only when slow) units.
        let brawler = 0;
        if (highestMove >= 2 && !equipmentSpecials.has("ECM") && !equipmentSpecials.has("AECM")) {
            const onlyShort = pvDamage(medium) + pvDamage(long) === 0 && pvDamage(short) > 0;
            const onlyShortMedium = pvDamage(long) === 0 && pvDamage(short) + pvDamage(medium) > 0;
            const multiplier = highestMove >= 6 && highestMove <= 10 && onlyShort ? 0.25
                : highestMove < 6 && onlyShort ? 0.5 : highestMove < 6 && onlyShortMedium ? 0.25 : 0;
            brawler = roundToHalf(multiplier * subtotal);
        }
        subtotal += roundToHalf(agile) - brawler;
        // Force bonuses.
        const forceBonus: Record<string, number> = { AECM: 3, BH: 2, C3RS: 2, ECM: 2, RCN: 2, TRN: 2, LPRB: 1, PRB: 1, LECM: 0.5 };
        for (const code of new Set([...equipmentSpecials, ...specials.filter((code) => code === "RCN")])) subtotal += forceBonus[code] ?? 0;
        const pointValue = Math.max(1, Math.round(subtotal));
        log += `Agile +${roundToHalf(agile)}, Brawler -${brawler}; Point Value ${pointValue} (provisional)<br />`;

        return {
            size,
            movement: move,
            movementType: this.getAlphaStrikeMovementType(),
            jumpMovement: jumpMove,
            tmm,
            damage: { short: short.damage, medium: medium.damage, long: long.damage, extreme: extreme.damage },
            damageValues: { short, medium, long, extreme },
            armor,
            structure,
            overheat: 0,
            pointValue,
            specialAbilities: specials,
            arcs,
            calcLog: log,
        };
    }

    /** The converted Alpha Strike card, built the same way as a Master Unit List record. */
    public getAlphaStrikeUnit(): AlphaStrikeUnit {
        const stats = this.getAlphaStrikeStats();
        const damage = stats.damageValues;
        const move = `${stats.movement}"${stats.movementType}` + (stats.jumpMovement ? `/${stats.jumpMovement}"j` : "");
        const record = {
            Id: 0,
            Name: `${this._name} ${this._model}`.trim() || "Combat Vehicle",
            Class: this._name,
            Variant: this._model,
            Tonnage: this._tonnage,
            Cost: this.getCBillCost(),
            BattleValue: this.getBattleValue(),
            BFType: "CV",
            BFSize: stats.size,
            BFMove: move,
            BFTMM: stats.tmm,
            BFArmor: stats.armor,
            BFStructure: stats.structure,
            BFThreshold: 0,
            BFDamageShort: damage.short.damage,
            BFDamageMedium: damage.medium.damage,
            BFDamageLong: damage.long.damage,
            BFDamageExtreme: damage.extreme.damage,
            BFDamageShortMin: damage.short.minimal,
            BFDamageMediumMin: damage.medium.minimal,
            BFDamageLongMin: damage.long.minimal,
            BFDamageExtremeMin: damage.extreme.minimal,
            BFOverheat: 0,
            BFPointValue: stats.pointValue,
            BFAbilities: stats.specialAbilities.join(","),
            Role: { Id: 0, Name: "None", Image: null, SortOrder: 0 },
            Technology: { Id: 0, Name: this._tech.name, Image: null, SortOrder: 0 },
            Type: { Id: 19, Name: "Combat Vehicle", Image: null, SortOrder: 0 },
        } as unknown as IASMULUnit;
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        unit.rulesLevel = Math.max(2, this.getRequiredRulesLevel());
        return unit;
    }

    // ---------------------------------------------------------------------------------------
    // Play mode: damage, motive damage, critical hits, crashes and hull breaches (Total Warfare pp. 68, 99-104,
    // 121, 192-199; Tactical Operations pp. 347-348, 378)
    // ---------------------------------------------------------------------------------------

    public newUUID(): void {
        this._uuid = generateUUID();
    }

    public getInPlay(): IVehicleInPlay {
        return this._inPlay;
    }

    public resetInPlay(): void {
        this._inPlay = newInPlay();
        this._followUps = [];
    }

    /**
     * The penetrating critical hit roll's modifier when a single hit of this much damage beats a Support Vehicle's
     * BAR, or null for no roll: -1 with the Armored chassis, and an Armored chassis with BAR 10 is immune (TW p.206).
     */
    public getPenetratingCriticalModifier(damage: number): number | null {
        if (!this._support || damage <= this._support.bar) return null;
        const armored = this.getSupportVehicleChassisModifications().includes("armored");
        if (armored && this._support.bar >= 10) return null;
        return armored ? -1 : 0;
    }

    /** Returns and clears the rolls the last hits and results call for, in the order they arose. */
    public takeFollowUpRolls(): VehicleFollowUpRoll[] {
        const rolls = this._followUps;
        this._followUps = [];
        return rolls;
    }

    private _locationName(location: VehicleLocation): string {
        return this.getLocations().find((loc) => loc.tag === location)?.name ?? LOCATION_NAMES[location] ?? location;
    }

    /**
     * Resolves one attack (one Damage Value grouping): hit location by attack direction and 2D6, damage, then
     * queues any Motive System Damage, Critical Hit and Hull Integrity rolls (TW pp. 121, 192-198). A dual
     * turret hit rolls 1D6 for the turret struck (TO p. 347); pass turretRoll to use a physical die.
     */
    public resolveAttack(roll: number, direction: VehicleAttackDirection, damage: number,
        options: { attackerUnderwater?: boolean; turretRoll?: number; armorPiercing?: 2 | 5 | 10 | 20 } = {}, random: () => number = Math.random): string[] {
        return this._applyHit(roll, direction, damage, { ...options, crash: false }, random);
    }

    private _applyHit(roll: number, direction: VehicleAttackDirection, damage: number,
        options: { attackerUnderwater?: boolean; turretRoll?: number; armorPiercing?: 2 | 5 | 10 | 20; crash: boolean }, random: () => number): string[] {
        const isVTOL = !!this._motiveType.hasRotor;
        const largeNaval = this.isLargeNavalVessel();
        const hit = largeNaval ? getLargeNavalVesselHitLocation(roll, direction)
            : this.isSuperheavy() && !isVTOL ? getSuperheavyVehicleHitLocation(roll, direction) : getVehicleHitLocation(roll, direction, isVTOL);
        const log: string[] = [];
        let location = this.resolveHitArea(hit.area, direction);
        if (largeNaval && isTurretLocation(location) && this.getStructureRemaining(location) === 0) {
            const side = this.resolveHitArea("side", direction);
            log.push(`${this._locationName(location)} is destroyed: the damage goes to the ${this._locationName(side)} armor (TO:AUE p.27)`);
            location = side;
        }
        if (hit.area === "turret" && this.hasDualTurret()) {
            const turretRoll = options.turretRoll ?? Math.floor(random() * 6) + 1;
            location = getDualTurretHit(turretRoll, direction);
            log.push(`Dual turret roll ${turretRoll}: ${this._locationName(location)}`);
        }
        const wasCrashed = this.isCrashed();
        const result = this.takeDamage(location, damage);
        const name = this._locationName(location);
        log.unshift(`Hit location ${roll}: ${name} takes ${result.armor} armor / ${result.structure} structure`
            + (location === "rotor" ? " (rotor: damage / 10, round up; -1 Cruising MP)" : ""));
        if (result.locationDestroyed) log.unshift(`${name} internal structure destroyed`);
        if (options.crash && isVTOL && result.structure > 0) {
            this._inPlay.crashDestroyed = "exploded";
            log.unshift("Crash damage reached the internal structure: the VTOL explodes (TW p. 198)");
            return log;
        }
        if (!wasCrashed && this.isCrashed()) log.push("Rotor destroyed in flight: the VTOL crashes (TW p. 197)");
        if (this.isDestroyed()) return log;
        // A Large Naval Vessel's motive roll takes -2 from an attack above the waterline (TO:AUE p.26).
        if (hit.motive && !isVTOL) this._followUps.push({ kind: "motive", direction, modifier: largeNaval && !options.attackerUnderwater ? -2 : undefined });
        const penetrating = this.getPenetratingCriticalModifier(damage);
        if (penetrating !== null) {
            // A Support Vehicle hit harder than its BAR rolls for a penetrating critical hit, even through armor,
            // on top of any other critical hit roll (TW p.206).
            this._followUps.push({ kind: "critical", location, modifier: penetrating || undefined });
            log.push(`${damage} damage exceeds BAR ${this.getBAR()}: roll for a penetrating critical hit${penetrating ? ` (${penetrating}, Armored chassis)` : ""} (TW p.206)`);
        }
        if (hit.critical || result.criticalRoll) {
            this._followUps.push({ kind: "critical", location });
        } else if (options.armorPiercing && result.armor > 0) {
            // Armor-piercing ammunition: a hit that damages only armor still rolls, with the autocannon's modifier
            // (TW p. 140), +2 against a Support Vehicle under BAR 10 (TW p.206); internal structure damage makes the
            // standard roll above instead.
            const lowBAR = this._support && this._support.bar < 10 ? 2 : 0;
            this._followUps.push({ kind: "critical", location, modifier: ARMOR_PIERCING_CRITICAL_MODIFIER[options.armorPiercing] + lowBAR });
        }
        // A FrankenVehicle's turret sits on linkages built for another turret: damage to it may lock it.
        const c = this._inPlay.criticals;
        if (this._frankenVehicle && location === "turret" && result.armor + result.structure > 0
            && !c.turretLocked && !c.turretBlownOff && !c.turretDestroyed) {
            this._followUps.push({ kind: "turretLinkage", target: Vehicle.FRANKEN_TURRET_LOCK_TARGET });
        }
        if (result.armor + result.structure > 0) {
            const target = this.getHullBreachTarget(location, !!options.attackerUnderwater);
            if (target !== null && !this.isBreached(location)) {
                if ((this._armorAllocation[location] ?? 0) > 0 && this.getArmorRemaining(location) === 0) {
                    this.setBreached(location, true);
                    log.push(`${name} armor destroyed: the hull is breached automatically (TW p. 121)`);
                } else {
                    this._followUps.push({ kind: "hullBreach", location, target });
                }
            }
        }
        return log;
    }

    /** Resolves a follow-up roll (2D6, or 1D6 for crash facing) and describes the result. */
    public resolveFollowUpRoll(followUp: VehicleFollowUpRoll, roll: number, random: () => number = Math.random): string {
        switch (followUp.kind) {
            case "critical": {
                const modifier = followUp.modifier ?? 0;
                const effect = this.resolveCriticalRoll(roll + modifier, followUp.location);
                const text = effect === "none" ? VEHICLE_CRITICAL_EFFECT_NAMES.none : this.applyCriticalHit(effect, followUp.location, undefined, random);
                const shown = modifier ? `${roll} ${modifier} = ${roll + modifier}` : `${roll}`;
                return `Critical Hit ${shown} (${this.getCriticalColumn(followUp.location)}): ${text}`;
            }
            case "motive": {
                const cause = followUp.cause ?? "attack";
                const extra = followUp.modifier ?? 0;
                const modifier = this.getMotiveDamageRollModifier(followUp.direction, cause, !!followUp.roughTerrain) + extra;
                const level = this.rollMotiveDamage(roll + extra, followUp.direction, cause, !!followUp.roughTerrain);
                const label = cause === "skid" ? " (skid)" : cause === "jump" ? " (jump landing)" : "";
                return `Motive System Damage${label} ${roll} ${modifier >= 0 ? "+" : ""}${modifier} = ${roll + modifier}: ${level === "none" ? "no effect" : level}`;
            }
            case "hullBreach": {
                const name = this._locationName(followUp.location);
                if (roll < followUp.target) return `Hull Integrity ${roll} (breach on ${followUp.target}+): the ${name} hull holds`;
                this.setBreached(followUp.location, true);
                return `Hull Integrity ${roll} (breach on ${followUp.target}+): the ${name} is breached and floods; nothing in it works`;
            }
            case "turretLinkage": {
                if (roll < followUp.target) return `Turret linkage ${roll} (locks on ${followUp.target}+): the turret still turns`;
                this._inPlay.criticals.turretLocked = true;
                return `Turret linkage ${roll} (locks on ${followUp.target}+): the mismatched linkages bind and the turret locks`;
            }
            case "drivingSkill": {
                const passed = roll >= followUp.target;
                if (followUp.reason === "pilotHit") {
                    if (passed) return `Driving Skill Roll ${roll} (${followUp.target}+): the pilot keeps control`;
                    this._inPlay.elevation = Math.max(0, this._inPlay.elevation - 1);
                    return `Driving Skill Roll ${roll} (${followUp.target}+) failed: the VTOL drops to elevation ${this._inPlay.elevation}`
                        + "; if that puts it into terrain it crashes (TW p. 197)";
                }
                if (passed) {
                    this._inPlay.landed = true;
                    return `Driving Skill Roll ${roll} (${followUp.target}+): it lands in its hex and cannot move for the rest of the game`;
                }
                return `Driving Skill Roll ${roll} (${followUp.target}+) failed: ${this._crashInFlight()}`;
            }
            case "crashFacing": {
                const direction = getFacingAfterFallDirection(roll);
                for (const damage of getDamageGroupings(followUp.damage)) {
                    this._followUps.push({ kind: "crashHit", damage, direction, fall: true });
                }
                return `Facing After a Fall ${roll}: ${followUp.damage} falling damage hits the ${direction} column in 5-point groupings (TW p. 68)`;
            }
            case "engineSurvival": {
                // A Large Naval Vessel shrugs off an Engine Hit on 8+; otherwise it loses 1 Cruising MP (TO:AUE p.27).
                if (roll >= 8) return `Engine Hit check ${roll} (8+): the engine hit is ignored`;
                this._inPlay.criticals.engineHits += 1;
                return `Engine Hit check ${roll} (8+) failed: -1 Cruising MP (${this._inPlay.criticals.engineHits} engine hit${this._inPlay.criticals.engineHits === 1 ? "" : "s"})`;
            }
            case "crashHit": {
                const isVTOL = !!this._motiveType.hasRotor;
                if (followUp.fall && getVehicleHitLocation(roll, followUp.direction, isVTOL).area === "rotor") {
                    this._followUps.push(followUp);
                    return `Crash hit ${roll}: rotor, re-roll (TW p. 197)`;
                }
                return this._applyHit(roll, followUp.direction, followUp.damage, { crash: true }, random).join("; ");
            }
        }
        return "";
    }

    // --- Ammunition (TW pp. 125, 194) ---

    /** CASE (or CASE II) vents a vehicle's ammunition explosion through the rear armor (TW p. 194). */
    public hasCASE(): boolean {
        return this._equipmentList.some((item) => ["case", "case-ii", "clan-case-ii"].some((tag) => matchesTag(item, tag)));
    }

    private static _damagePerShot(weapon: IEquipmentItem): number {
        if (weapon.damageClusters && weapon.damagePerCluster) return weapon.damageClusters * weapon.damagePerCluster;
        if (typeof weapon.damage === "number") return weapon.damage;
        return weapon.damage?.short ?? 0;
    }

    /**
     * The damage of all explosive ammunition carried: each bin's shots left (a full bin's shots when not
     * tracked) times the Damage Value of one shot, counting every missile (TW p. 125). A bin with no weapon
     * aboard to fire it cannot be valued and is left out.
     */
    private _binWeapon(ammo: IEquipmentItem): IEquipmentItem | undefined {
        const weapons = this._equipmentList.filter((item) => !item.isAmmo);
        return (ammo.feedsWeaponTag ? weapons.find((w) => equipmentMatchesIdentifier(w, ammo.feedsWeaponTag || "")) : undefined)
            ?? weapons.find((w) => getCompatibleAmmo(w, ammo));
    }

    // Shots in a full bin: the fed weapon's shots per ton times the bin's weight.
    private _fullBinShots(ammo: IEquipmentItem): number {
        const weapon = this._binWeapon(ammo);
        return weapon ? Math.floor(getWeaponShotsPerTon(weapon, ammo) * (ammo.weight || 0)) : 0;
    }

    public getAmmunitionExplosionDamage(): number {
        if (this._inPlay.criticals.ammoExploded) return 0;
        let total = 0;
        for (const ammo of this._equipmentList.filter((item) => item.isAmmo && item.explosive)) {
            const weapon = this._binWeapon(ammo);
            if (!weapon) continue;
            const shots = ammo.currentAmmo ?? this._fullBinShots(ammo);
            total += Math.max(0, shots) * Vehicle._damagePerShot(weapon);
        }
        // Extended fuel tanks are treated as ammo bins: 40 points per ton of tank (TM p.244).
        for (const tank of this._equipmentList.filter((item) => item.variableFormula === "extended-fuel-tank")) total += 40 * tank.weight;
        return total;
    }

    public getArmorRemaining(location: VehicleLocation): number {
        return Math.max(0, (this._armorAllocation[location] ?? 0) - (this._inPlay.armorDamage[location] ?? 0));
    }

    public getStructureRemaining(location: VehicleLocation): number {
        return Math.max(0, (this.getStructureAllocation()[location] ?? 0) - (this._inPlay.structureDamage[location] ?? 0));
    }

    /**
     * Applies one attack's damage (one Damage Value grouping) to a location: armor first, then internal
     * structure. Rotor hits take 1 point per 10 points of damage or fraction (TW p. 197) and each costs
     * the VTOL 1 Cruising MP (TW p. 196).
     */
    public takeDamage(location: VehicleLocation, amount: number): IVehicleDamageResult {
        const flying = this.isAirborne();
        let damage = Math.max(0, amount);
        if (location === "rotor" && damage > 0) {
            damage = Math.ceil(damage / 10);
            this._inPlay.rotorHits += 1;
        }
        const armorTaken = Math.min(this.getArmorRemaining(location), damage);
        this._inPlay.armorDamage[location] = (this._inPlay.armorDamage[location] ?? 0) + armorTaken;
        const structureTaken = Math.min(this.getStructureRemaining(location), damage - armorTaken);
        this._inPlay.structureDamage[location] = (this._inPlay.structureDamage[location] ?? 0) + structureTaken;
        const locationDestroyed = (this.getStructureAllocation()[location] ?? 0) > 0 && this.getStructureRemaining(location) === 0;
        if (locationDestroyed && (location === "turret" || location === "turret2")) this._inPlay.criticals.turretDestroyed = true;
        if (locationDestroyed && location === "rotor" && flying) this._crashInFlight();
        return { armor: armorTaken, structure: structureTaken, locationDestroyed, criticalRoll: structureTaken > 0 };
    }

    /**
     * Ammunition explosion: all ammunition is lost and its total damage goes straight to the internal
     * structure of the location struck; with CASE it goes to the rear armor instead (excess ignored)
     * and the crew is stunned (TW p. 194).
     */
    public applyAmmunitionExplosion(location: VehicleLocation, damage: number, hasCASE: boolean): void {
        this._inPlay.criticals.ammoExploded = true;
        this._explode(location, damage, hasCASE);
    }

    // An ammunition-style explosion in a location (ammunition, TW p. 194; explosive weapons, TW p. 195).
    private _explode(location: VehicleLocation, damage: number, hasCASE: boolean): void {
        if (hasCASE) {
            const taken = Math.min(this.getArmorRemaining("rear"), Math.max(0, damage));
            this._inPlay.armorDamage.rear = (this._inPlay.armorDamage.rear ?? 0) + taken;
            this._stunCrew();
            return;
        }
        const taken = Math.min(this.getStructureRemaining(location), Math.max(0, damage));
        this._inPlay.structureDamage[location] = (this._inPlay.structureDamage[location] ?? 0) + taken;
        if (this.getStructureRemaining(location) === 0 && (location === "turret" || location === "turret2")) {
            this._inPlay.criticals.turretDestroyed = true;
        }
        // Internal structure damage calls for a critical hit roll (TW p. 193).
        if (taken > 0 && !this.isDestroyed()) this._followUps.push({ kind: "critical", location });
    }

    // Record sheet pips: clicking pip n marks n+1 points of damage, or clears back to n if already marked.
    public toggleArmorPip(location: VehicleLocation, index: number): void {
        const damage = this._inPlay.armorDamage[location] ?? 0;
        this._inPlay.armorDamage[location] = Math.min(this._armorAllocation[location] ?? 0, damage > index ? index : index + 1);
    }

    public toggleStructurePip(location: VehicleLocation, index: number): void {
        const damage = this._inPlay.structureDamage[location] ?? 0;
        this._inPlay.structureDamage[location] = Math.min(this.getStructureAllocation()[location] ?? 0, damage > index ? index : index + 1);
    }

    public getTotalArmorPoints(): number {
        return this.getLocations().reduce((sum, loc) => sum + (this._armorAllocation[loc.tag] ?? 0), 0);
    }

    public getCurrentArmor(): number {
        return this.getLocations().reduce((sum, loc) => sum + this.getArmorRemaining(loc.tag), 0);
    }

    public getTotalStructurePoints(): number {
        const structure = this.getStructureAllocation();
        return this.getLocations().reduce((sum, loc) => sum + (structure[loc.tag] ?? 0), 0);
    }

    public getCurrentStructure(): number {
        return this.getLocations().reduce((sum, loc) => sum + this.getStructureRemaining(loc.tag), 0);
    }

    public getArmorPercentage(): number {
        const total = this.getTotalArmorPoints();
        return total > 0 ? Math.round(this.getCurrentArmor() / total * 100) : 0;
    }

    public getStructurePercentage(): number {
        const total = this.getTotalStructurePoints();
        return total > 0 ? Math.round(this.getCurrentStructure() / total * 100) : 0;
    }

    /** True once the vehicle has taken any damage, motive damage or critical hit. */
    public isDamaged(): boolean {
        const crits = this._inPlay.criticals;
        return this.getCurrentArmor() < this.getTotalArmorPoints()
            || this.getCurrentStructure() < this.getTotalStructurePoints()
            || this._inPlay.motiveHits.length > 0 || this._inPlay.rotorHits > 0
            || Object.entries(crits).some(([key, value]) => key === "stabilizers" ? (value as VehicleLocation[]).length > 0 : !!value)
            || this._inPlay.jammedWeapons.length > 0 || this._inPlay.destroyedWeapons.length > 0;
    }

    // --- Motive System Damage (TW p. 193) ---

    /** The Motive System Damage Table modifier for an attack from this direction on this vehicle. */
    public getMotiveDamageRollModifier(direction: VehicleAttackDirection, cause: VehicleMotiveRollCause = "attack", roughTerrain: boolean = false): number {
        // A jump landing disregards attack direction and uses its own type modifiers, +1 into rough, woods or
        // jungle (TO p. 349); a skid has no attack direction (TW p. 192).
        if (cause === "jump") return (JUMP_LANDING_MODIFIER[this._motiveType.tag] ?? 0) + (roughTerrain ? 1 : 0);
        const typeModifier = getVehicleMotiveTypeModifier(this._motiveType.tag);
        return cause === "skid" ? typeModifier : VEHICLE_MOTIVE_DIRECTION_MODIFIER[direction] + typeModifier;
    }

    /** Rolls on the Motive System Damage Table (2D6 before modifiers) and records the result. */
    public rollMotiveDamage(roll: number, direction: VehicleAttackDirection, cause: VehicleMotiveRollCause = "attack", roughTerrain: boolean = false): VehicleMotiveDamageLevel {
        const level = getVehicleMotiveDamageLevel(roll + this.getMotiveDamageRollModifier(direction, cause, roughTerrain));
        if (level !== "none") this.addMotiveHit(level);
        return level;
    }

    public addMotiveHit(level: VehicleMotiveHit): void {
        this._inPlay.motiveHits.push(level);
    }

    public removeMotiveHit(index: number): void {
        this._inPlay.motiveHits.splice(index, 1);
    }

    public getMotiveHits(): VehicleMotiveHit[] {
        return this._inPlay.motiveHits;
    }

    /**
     * The location a hit location table result strikes. "Side" is the side attacked; with no turret a
     * Turret result strikes the side attacked (the front or rear armor for front/rear attacks), TW p. 193.
     * Superheavy split sides take the front half for front and side attacks and the rear half for rear
     * attacks (a simplification; Superheavy hit locations are not in TW).
     */
    public resolveHitArea(area: VehicleHitArea, direction: VehicleAttackDirection): VehicleLocation {
        let attackedSide: VehicleLocation = direction;
        if (this.isSuperheavy() && (direction === "left" || direction === "right")) {
            attackedSide = direction === "left" ? "frontLeft" : "frontRight";
        } else if (!this.isSuperheavy() && direction !== "front" && direction !== "rear") {
            attackedSide = direction.endsWith("Left") || direction === "left" ? "left" : "right";
        }
        let location: VehicleLocation;
        if (area === "side") location = attackedSide;
        else if (area === "turret") location = this.hasTurret() ? this._turretStruck() : attackedSide;
        else location = area;
        // Superheavy: a Right/Left Side result strikes the half nearest the attack (the VTOL table has no split
        // sides, so Super-Heavy VTOLs use the same reading).
        if (this.isSuperheavy() && (location === "left" || location === "right")) {
            const half = isRearwardAttack(direction) ? "rear" : "front";
            location = `${half}${location === "left" ? "Left" : "Right"}` as VehicleLocation;
        }
        return location;
    }

    /**
     * The turret a Turret result strikes: a Large Naval Vessel's first turret still standing (the player who won
     * Initiative chooses among them, TO:AUE p.26; move the damage by hand for another), otherwise the turret.
     */
    private _turretStruck(): VehicleLocation {
        if (!this.isLargeNavalVessel()) return "turret";
        const turrets = this.getLocations().filter((loc) => isTurretLocation(loc.tag)).map((loc) => loc.tag);
        return turrets.find((turret) => this.getStructureRemaining(turret) > 0) ?? turrets[0] ?? "turret";
    }

    // --- Critical hits (TW pp. 194-198) ---

    /** The Critical Hits Table column for a location: body sides share the Side column. */
    public getCriticalColumn(location: VehicleLocation): VehicleCriticalColumn {
        if (location === "front" || location === "rear" || location === "rotor") return location;
        if (location === "turret" || location === "turret2") return "turret";
        return "side";
    }

    public getWeaponsInLocation(location: VehicleLocation): IEquipmentItem[] {
        return this.getEquipmentList().filter((item) => !item.isAmmo && item.location === location
            && (item.damage !== undefined || !!item.range));
    }

    public carriesAmmo(): boolean {
        return !this._inPlay.criticals.ammoExploded
            && this.getEquipmentList().some((item) => item.isAmmo || item.variableFormula === "extended-fuel-tank");
    }

    public hasCargoOrInfantry(): boolean {
        return this._troopSpace > 0 || this._bays.length > 0 || this.getEquipmentList().some((item) => /cargo|infantry-compartment|troop/i.test(item.tag));
    }

    /** Whether a critical result can still happen in this location (TW p. 193: otherwise move down the column). */
    public isCriticalApplicable(effect: VehicleCriticalEffect, location: VehicleLocation): boolean {
        const c = this._inPlay.criticals;
        const weapons = this.getWeaponsInLocation(location);
        switch (effect) {
            case "none": return false;
            case "driverHit": case "commanderHit": case "coPilotHit": case "pilotHit": case "crewStunned": case "crewKilled":
                return !c.crewKilled;
            case "weaponMalfunction": return weapons.some((w) => this.getWeaponStatus(w.uuid) === "ok");
            case "weaponDestroyed": return weapons.some((w) => this.getWeaponStatus(w.uuid) !== "destroyed");
            case "stabilizer": return !c.stabilizers.includes(location);
            case "sensors": return c.sensorHits < VEHICLE_MAX_SENSOR_HITS;
            case "engineHit": return !c.engineHit;
            case "fuelTank": return !c.fuelTankHit;
            case "ammunition": return this.isLargeNavalVessel() ? this._ammoInLocation(location).length > 0 : this.carriesAmmo();
            case "turretBlownOff":
                return this.isLargeNavalVessel() ? isTurretLocation(location) && this.getStructureRemaining(location) > 0 : this.hasTurret() && !c.turretBlownOff;
            case "cargoHit": return this.hasCargoOrInfantry() && !c.cargoHit;
            case "turretJam": return this.hasTurret() && !c.turretLocked && !c.turretBlownOff;
            case "turretLocks": return this.hasTurret() && !c.turretLocked && !c.turretBlownOff;
            case "rotorDamage": return !c.rotorsDestroyed;
            case "flightStabilizer": return !c.flightStabilizer;
            case "rotorsDestroyed": return !c.rotorsDestroyed;
        }
        return false;
    }

    /**
     * The critical hit for a 2D6 roll on this location's column. A result that does not apply moves
     * down the column, wrapping from 12 back to 6; if nothing applies the hit is ignored (TW pp. 193-194).
     */
    public resolveCriticalRoll(roll: number, location: VehicleLocation): VehicleCriticalEffect {
        const start = Math.min(12, Math.floor(roll));
        if (start < 6) return "none";
        const options = { fusionEngine: this.isFusionEngine(), carriesAmmo: this.carriesAmmo() };
        const column = this.getCriticalColumn(location);
        const isVTOL = !!this._motiveType.hasRotor;
        for (let step = 0; step < 7; step++) {
            const r = 6 + ((start - 6 + step) % 7);
            const effect = getVehicleCriticalEffect(r, column, isVTOL, options);
            if (this.isCriticalApplicable(effect, location)) return effect;
        }
        return "none";
    }

    /** Ammunition bins and extended fuel tanks in a location: a Large Naval Vessel stores ammunition by hex (TO:AUE p.71). */
    private _ammoInLocation(location: VehicleLocation): IEquipmentItem[] {
        return this._equipmentList.filter((item) => item.location === location && (item.isAmmo || item.variableFormula === "extended-fuel-tank"));
    }

    private _stunCrew(): void {
        this._inPlay.criticals.crewStunnedTurns += 1;
    }

    // A Crew Stunned result after both Commander Hit and Driver Hit is Crew Killed (TW p. 195).
    private _crewStunnedResult(): void {
        const c = this._inPlay.criticals;
        if (c.commanderHit && c.driverHit) {
            c.crewKilled = true;
        } else {
            this._stunCrew();
        }
    }

    /**
     * Applies a critical hit to a location and describes it. Weapon results take the weapon's UUID;
     * without one, a weapon in the location is picked at random (Weapon Malfunction is random, TW
     * p. 195; for Weapon Destroyed a 1D6 decides who chooses).
     */
    public applyCriticalHit(effect: VehicleCriticalEffect, location: VehicleLocation, weaponUUID?: string, random: () => number = Math.random): string {
        const c = this._inPlay.criticals;
        const flying = this.isAirborne();
        const name = VEHICLE_CRITICAL_EFFECT_NAMES[effect];
        const pickWeapon = (candidates: IEquipmentItem[]): IEquipmentItem | undefined =>
            candidates.find((w) => w.uuid === weaponUUID) ?? candidates[Math.floor(random() * candidates.length)];
        if (this.isLargeNavalVessel()) {
            const naval = this._applyLargeNavalCriticalHit(effect, location);
            if (naval !== null) return naval;
        }
        switch (effect) {
            case "none": return name;
            case "driverHit":
                if (c.driverHit) { this._crewStunnedResult(); return `${name} (second): treated as Crew Stunned`; }
                c.driverHit = true;
                return `${name}: +2 to all Driving Skill Rolls`;
            case "commanderHit":
                if (c.commanderHit) { this._crewStunnedResult(); return `${name} (second): treated as Crew Stunned`; }
                c.commanderHit = true;
                this._stunCrew();
                return `${name}: crew stunned next turn; +1 to all to-hit and Driving Skill Rolls`;
            case "coPilotHit":
                if (c.coPilotHit) { c.crewKilled = true; return `${name} (second): treated as Crew Killed`; }
                c.coPilotHit = true;
                return `${name}: +1 to all to-hit rolls`;
            case "pilotHit":
                if (c.pilotHit) { c.crewKilled = true; return `${name} (second): treated as Crew Killed`; }
                c.pilotHit = true;
                if (!flying) return `${name}: +2 to all Driving Skill Rolls`;
                this._followUps.push({ kind: "drivingSkill", reason: "pilotHit", target: this.getDrivingSkillTarget() });
                return `${name}: +2 to all Driving Skill Rolls; make a Driving Skill Roll (${this.getDrivingSkillTarget()}+) or drop one elevation`;
            case "crewStunned":
                this._crewStunnedResult();
                return c.crewKilled ? `${name} after Commander and Driver Hits: Crew Killed` : `${name}: next turn no faster than Cruising and no other actions`;
            case "crewKilled":
                c.crewKilled = true;
                return `${name}: the vehicle cannot move or fire and counts as destroyed for victory`;
            case "weaponMalfunction": {
                const weapon = pickWeapon(this.getWeaponsInLocation(location).filter((w) => this.getWeaponStatus(w.uuid) === "ok"));
                if (weapon?.uuid) this.setWeaponStatus(weapon.uuid, "jammed");
                return `${name}: ${weapon?.name ?? "no weapon"} (spend a Weapon Attack Phase, with no attacks, to clear it)`;
            }
            case "weaponDestroyed": {
                const weapon = pickWeapon(this.getWeaponsInLocation(location).filter((w) => this.getWeaponStatus(w.uuid) !== "destroyed"));
                if (weapon?.uuid) this.setWeaponStatus(weapon.uuid, "destroyed");
                // A destroyed weapon that can explode is an ammunition explosion in its location (TW p. 195).
                const explosion = weapon ? getWeaponExplosionDamage(weapon) : null;
                if (weapon && explosion) {
                    const cased = this.hasCASE();
                    this._explode(location, explosion.damage, cased);
                    return `${name}: ${weapon.name} explodes for ${explosion.damage} damage (${explosion.book} p. ${explosion.page})`
                        + (cased ? "; CASE vents it into the rear armor and stuns the crew" : ` to the ${this._locationName(location)} internal structure`);
                }
                const unresolved = weapon?.explosive ? "; it can explode, but its explosion damage is not in the rulebooks in hand" : "";
                return `${name}: ${weapon?.name ?? "no weapon"}${unresolved}`;
            }
            case "stabilizer":
                this.setStabilizerHit(location, true);
                return `${name}: double the attacker movement modifier for weapons in this location`;
            case "sensors":
                this.setSensorHits(c.sensorHits + 1);
                return c.sensorHits >= VEHICLE_MAX_SENSOR_HITS ? `${name}: fourth hit, the vehicle cannot fire` : `${name}: +${c.sensorHits} to all to-hit rolls`;
            case "engineHit":
                c.engineHit = true;
                c.turretLocked = true;
                if (flying) {
                    // In flight: land with a Driving Skill Roll (+4 for a VTOL) over clear, paved, rough or building
                    // hexes, otherwise crash (TW pp. 197, 199).
                    if (!this._inPlay.overLandableTerrain) return `${name} in flight over terrain it cannot land in: ${this._crashInFlight()}`;
                    const target = this.getDrivingSkillTarget(this._motiveType.hasRotor ? 4 : 0);
                    this._followUps.push({ kind: "drivingSkill", reason: "engineDamage", target });
                    return `${name} in flight: make a Driving Skill Roll (${target}+) to land, or crash`;
                }
                return `${name}: immobile; Direct-Fire Energy and Pulse weapons stop working; turret locked`;
            case "fuelTank":
                c.fuelTankHit = true;
                return `${name}: the vehicle explodes and is destroyed`;
            case "ammunition": {
                const damage = this.getAmmunitionExplosionDamage();
                const cased = this.hasCASE();
                this.applyAmmunitionExplosion(location, damage, cased);
                return cased
                    ? `${name}: all ammunition explodes for ${damage} damage; CASE vents it into the rear armor (excess ignored) and stuns the crew`
                    : `${name}: all ammunition explodes for ${damage} damage to the ${this._locationName(location)} internal structure`;
            }
            case "cargoHit":
                c.cargoHit = true;
                return `${name}: cargo destroyed; infantry take the attacking weapon's full damage`;
            case "turretJam":
                if (c.turretJammed) { c.turretLocked = true; c.turretJammed = false; return `${name} (second): treated as Turret Locks`; }
                c.turretJammed = true;
                return `${name}: the turret is stuck until the crew spends a Weapon Attack Phase (with no attacks) freeing it`;
            case "turretLocks":
                c.turretLocked = true;
                c.turretJammed = false;
                return `${name}: the turret is locked in its current facing for the rest of the game`;
            case "turretBlownOff":
                c.turretBlownOff = true;
                return `${name}: the vehicle is destroyed`;
            case "rotorDamage":
                c.rotorDamage += 1;
                return `${name}: -1 Cruising MP`;
            case "flightStabilizer":
                c.flightStabilizer = true;
                return `${name}: Cruising speed only, +3 to Driving Skill Rolls, +1 to all to-hit rolls`;
            case "rotorsDestroyed":
                c.rotorsDestroyed = true;
                return flying ? `${name}: ${this._crashInFlight()}` : `${name}: the VTOL is immobile`;
        }
        return name;
    }

    /**
     * Critical hits that work differently on a Large Naval Vessel (TO:AUE pp.26-27); null for one that works as on
     * other vehicles. Crew hits are marked off like a DropShip's; a Crew Stunned hit counts as one until the End Phase
     * of the following turn; an Engine Hit is shrugged off on 8+ and otherwise costs 1 Cruising MP; only the
     * ammunition in the location hit explodes, and each ammunition hit costs 1 Cruising MP; a turret blown off is
     * lost, not the vessel.
     */
    private _applyLargeNavalCriticalHit(effect: VehicleCriticalEffect, location: VehicleLocation): string | null {
        const c = this._inPlay.criticals;
        const name = VEHICLE_CRITICAL_EFFECT_NAMES[effect];
        switch (effect) {
            case "crewKilled":
                c.crewHits = Math.min(LARGE_NAVAL_CREW_BOXES, c.crewHits + 1);
                if (c.crewHits >= LARGE_NAVAL_CREW_BOXES) c.crewKilled = true;
                return c.crewKilled ? `${name}: the sixth crew box is marked off and the crew is dead`
                    : `${name}: crew box ${c.crewHits} of ${LARGE_NAVAL_CREW_BOXES} marked off; +${c.crewHits} to Gunnery and Piloting Skill Rolls`;
            case "crewStunned":
                this._stunCrew();
                return `${name}: counts as a crew hit (+1 to Gunnery and Piloting Skill Rolls) until the End Phase of the following turn`;
            case "engineHit":
                this._followUps.push({ kind: "engineSurvival" });
                return `${name}: roll 2D6; on 8+ it is ignored, otherwise -1 Cruising MP`;
            case "ammunition": {
                const bins = this._ammoInLocation(location);
                let damage = 0;
                for (const ammo of bins.filter((item) => item.isAmmo && item.explosive)) {
                    const weapon = this._binWeapon(ammo);
                    if (weapon) damage += Math.max(0, ammo.currentAmmo ?? this._fullBinShots(ammo)) * Vehicle._damagePerShot(weapon);
                    ammo.currentAmmo = 0;
                }
                for (const tank of bins.filter((item) => item.variableFormula === "extended-fuel-tank")) damage += 40 * tank.weight;
                c.ammoHits += 1;
                const cased = this.hasCASE();
                if (cased) {
                    const taken = Math.min(this.getArmorRemaining(location), damage);
                    this._inPlay.armorDamage[location] = (this._inPlay.armorDamage[location] ?? 0) + taken;
                } else {
                    this._explode(location, damage, false);
                }
                return `${name}: the ammunition in the ${this._locationName(location)} explodes for ${damage} damage`
                    + `${cased ? " into that location's armor (CASE)" : " to its internal structure"}; -1 Cruising MP`;
            }
            case "turretBlownOff":
                this._inPlay.structureDamage[location] = this.getStructureAllocation()[location] ?? 0;
                return `${name}: ${this._locationName(location)} is lost; the vessel fights on (TO:AUE p.27)`;
        }
        return null;
    }

    public setCriticalHit(critical: Exclude<keyof IVehicleCriticalHits, "sensorHits" | "stabilizers" | "crewStunnedTurns" | "rotorDamage" | "crewHits" | "engineHits" | "ammoHits">, hit: boolean): void {
        this._inPlay.criticals[critical] = hit;
        // An Engine Hit also locks the turret (TW p. 195).
        if (critical === "engineHit" && hit) this._inPlay.criticals.turretLocked = true;
    }

    /** Whether the current target is higher than this VTOL, which its chin turret cannot fire at (TO p. 348). */
    public setTargetAbove(above: boolean): void {
        this._inPlay.targetAbove = above;
    }

    /** A ground vehicle (not hover) that skids after a failed Driving Skill Roll rolls for motive damage (TW p. 192). */
    public startSkidMotiveRoll(): string {
        if (this._motiveType.tag !== "tracked" && this._motiveType.tag !== "wheeled") {
            return `A ${this._motiveType.name.toLowerCase()} vehicle makes no motive roll for a skid (ground vehicles other than hover only, TW p. 192)`;
        }
        this._followUps.push({ kind: "motive", direction: "front", cause: "skid" });
        return "Skid: roll on the Motive System Damage Table (TW p. 192)";
    }

    /** Every vehicular jump ends with a Motive System Damage roll on landing (TO p. 349). */
    public startJumpLandingRoll(roughTerrain: boolean): string {
        this._followUps.push({ kind: "motive", direction: "front", cause: "jump", roughTerrain });
        return `Jump landing: roll on the Motive System Damage Table (${roughTerrain ? "+1 rough, woods or jungle; " : ""}TO p. 349)`;
    }

    public setRotorDamage(count: number): void {
        this._inPlay.criticals.rotorDamage = Math.max(0, Math.floor(count));
    }

    public setRotorHits(count: number): void {
        this._inPlay.rotorHits = Math.max(0, Math.floor(count));
    }

    public setSensorHits(hits: number): void {
        this._inPlay.criticals.sensorHits = Math.max(0, Math.min(VEHICLE_MAX_SENSOR_HITS, Math.floor(hits)));
    }

    public setStabilizerHit(location: VehicleLocation, hit: boolean): void {
        const stabilizers = this._inPlay.criticals.stabilizers.filter((loc) => loc !== location);
        this._inPlay.criticals.stabilizers = hit ? [...stabilizers, location] : stabilizers;
    }

    public setLanded(landed: boolean): void {
        this._inPlay.landed = landed;
    }

    public setOverDeepWater(over: boolean): void {
        this._inPlay.overDeepWater = over;
    }

    public setOverLandableTerrain(landable: boolean): void {
        this._inPlay.overLandableTerrain = landable;
    }

    public setElevation(elevation: number): void {
        this._inPlay.elevation = Math.floor(savedNumber(elevation, 0, 0, VEHICLE_MAX_ELEVATION));
    }

    public setSurfaced(surfaced: boolean): void {
        this._inPlay.surfaced = surfaced;
    }

    // --- Turrets and firing arcs (TW pp. 99, 104-105, 192; TO pp. 347-348) ---

    public getTurretFacing(turret: VehicleTurretLocation): number {
        return this._inPlay.turretFacing[turret] ?? 0;
    }

    /** A turret can rotate unless it is jammed, locked (an Engine Hit also locks it) or gone. */
    public canRotateTurret(turret: VehicleTurretLocation): boolean {
        const c = this._inPlay.criticals;
        const exists = this.getLocations().some((loc) => loc.tag === turret);
        return exists && !c.turretJammed && !c.turretLocked && !c.turretBlownOff && !c.turretDestroyed && this.getStructureRemaining(turret) > 0;
    }

    /**
     * Rotates a turret to face a hexside, counted clockwise from the vehicle's front (negative is to the
     * left). A dual-turret vehicle's forward turret may not fire through the rear hexside (TO p. 347).
     */
    public setTurretFacing(turret: VehicleTurretLocation, facing: number): boolean {
        if (!this.canRotateTurret(turret)) return false;
        let hexside = ((Math.round(facing) % 6) + 6) % 6;
        if (hexside > 3) hexside -= 6;
        if (turret === "turret2" && Math.abs(hexside) === 3) return false;
        this._inPlay.turretFacing = { ...this._inPlay.turretFacing, [turret]: hexside };
        return true;
    }

    /** The firing arc of a weapon: body weapons use the 'Mech arc of their side; turret weapons a rotated forward arc. */
    public getWeaponFiringArc(weapon: IEquipmentItem): IVehicleFiringArc {
        switch (weapon.location) {
            case "turret": case "turret2":
                return { arc: "front", turretRotation: this.getTurretFacing(weapon.location) };
            case "rear":
                return { arc: "rear", turretRotation: null };
            case "left": case "frontLeft": case "rearLeft":
                return this._sponsonTurrets ? { arc: "left", turretRotation: null, sponson: true } : { arc: "left", turretRotation: null };
            case "right": case "frontRight": case "rearRight":
                return this._sponsonTurrets ? { arc: "right", turretRotation: null, sponson: true } : { arc: "right", turretRotation: null };
            default:
                return { arc: "front", turretRotation: null };
        }
    }

    public describeFiringArc(arc: IVehicleFiringArc): string {
        if (arc.sponson) return `${arc.arc === "left" ? "Left" : "Right"} sponson (180 degrees, row behind to row ahead)`;
        if (arc.turretRotation === null) {
            return { front: "Front", left: "Left side", right: "Right side", rear: "Rear" }[arc.arc];
        }
        const r = arc.turretRotation;
        if (r === 0) return "Turret, front";
        if (Math.abs(r) === 3) return "Turret, rear";
        return `Turret, ${Math.abs(r)} hexside${Math.abs(r) > 1 ? "s" : ""} ${r > 0 ? "right" : "left"}`;
    }

    // --- Naval hull integrity (TW pp. 121, 198) ---

    /**
     * The 2D6 result that breaches a naval vehicle's hull after a damaging hit to this location, or null when
     * no Hull Integrity roll is made. Submerged submarines follow the standard rule (10+) for every location;
     * surface vessels roll only for front, side and rear hits: 10+ against attacks from underwater units, 12
     * against all others.
     */
    public getHullBreachTarget(location: VehicleLocation, attackerUnderwater: boolean): number | null {
        if (!this._motiveType.naval) return null;
        if (this._motiveType.tag === "naval-sub") return this._inPlay.surfaced ? null : 10;
        if (location === "turret" || location === "turret2") return null;
        return attackerUnderwater ? 10 : 12;
    }

    public isBreached(location: VehicleLocation): boolean {
        return this._inPlay.breachedLocations.includes(location);
    }

    public setBreached(location: VehicleLocation, breached: boolean): void {
        const others = this._inPlay.breachedLocations.filter((loc) => loc !== location);
        this._inPlay.breachedLocations = breached ? [...others, location] : others;
    }

    // --- VTOL and WiGE flight (TW pp. 68, 197-199) ---

    /** The target number for a Driving Skill Roll: driving skill plus damage modifiers plus any extra modifier. */
    public getDrivingSkillTarget(extraModifier: number = 0): number {
        return this._pilot.piloting + this.getDrivingModifier() + extraModifier;
    }

    /** VTOL falling damage: 1 point per 10 tons (round up) times the levels fallen plus 1 (TW p. 197). */
    public getFallDamage(): number {
        return Math.ceil(this._tonnage / 10) * (this._inPlay.elevation + 1);
    }

    // A flying VTOL or WiGE crashes. Water destroys it (TW pp. 197, 199); a VTOL takes falling damage,
    // starting with the Facing After a Fall roll. TW p. 199 gives no crash damage for a WiGE.
    private _crashInFlight(): string {
        if (this._inPlay.crashed) return "it has already crashed";
        this._inPlay.crashed = true;
        if (this._inPlay.overDeepWater) {
            this._inPlay.crashDestroyed = "water";
            return "it crashes into water and is destroyed";
        }
        if (!this._motiveType.hasRotor) return "it crashes and cannot move for the rest of the game";
        const damage = this.getFallDamage();
        this._followUps.push({ kind: "crashFacing", damage });
        return `it crashes, taking ${damage} falling damage (roll 1D6 on the Facing After a Fall Table)`;
    }

    /**
     * A VTOL or WiGE crashing during a sideslip takes hexes moved x tonnage / 10 (round up) in 5-point
     * groupings on the side that struck the terrain; if it survives and can land there, it has landed
     * (TW p. 68). It cannot land in water.
     */
    public startSideslipCrash(direction: VehicleAttackDirection): string {
        const damage = Math.ceil(this._inPlay.hexesMoved * this._tonnage / 10);
        this._inPlay.landed = true;
        if (this._inPlay.overDeepWater) {
            this._inPlay.crashDestroyed = "water";
            return "Sideslip crash into water: the vehicle is destroyed";
        }
        for (const group of getDamageGroupings(damage)) {
            this._followUps.push({ kind: "crashHit", damage: group, direction, fall: false });
        }
        return `Sideslip crash: ${damage} damage (${this._inPlay.hexesMoved} hexes x ${this._tonnage} t / 10) to the ${direction} in 5-point groupings; it may not attack this turn (TW p. 68)`;
    }

    /** An airborne WiGE that can no longer enter five hexes a turn must land at the end of its movement (TW p. 199). */
    public mustLand(): boolean {
        return this._motiveType.tag === "wige" && this.isAirborne() && this.getEffectiveFlankMP() < 5;
    }

    public setWeaponStatus(uuid: string, status: "ok" | "jammed" | "destroyed"): void {
        this._inPlay.jammedWeapons = this._inPlay.jammedWeapons.filter((id) => id !== uuid);
        this._inPlay.destroyedWeapons = this._inPlay.destroyedWeapons.filter((id) => id !== uuid);
        if (status === "jammed") this._inPlay.jammedWeapons.push(uuid);
        if (status === "destroyed") this._inPlay.destroyedWeapons.push(uuid);
    }

    public getWeaponStatus(uuid: string | undefined): "ok" | "jammed" | "destroyed" {
        if (!uuid) return "ok";
        if (this._inPlay.destroyedWeapons.includes(uuid)) return "destroyed";
        if (this._inPlay.jammedWeapons.includes(uuid)) return "jammed";
        return "ok";
    }

    public setMovement(mode: VehicleMovementMode, hexesMoved: number = 0): void {
        this._inPlay.movementMode = mode;
        this._inPlay.hexesMoved = Math.floor(savedNumber(hexesMoved, 0, 0, VEHICLE_MAX_HEXES_MOVED));
    }

    /**
     * Start of a new turn: the vehicle has not moved yet, and a pending Crew Stunned result takes
     * effect for this turn (TW pp. 194-195).
     */
    public turnReset(): void {
        this.setMovement("stationary", 0);
        const c = this._inPlay.criticals;
        c.crewStunned = c.crewStunnedTurns > 0;
        if (c.crewStunned) c.crewStunnedTurns -= 1;
        // Turrets return to their forward position in the End Phase unless jammed or locked (TW p. 99).
        if (!c.turretJammed && !c.turretLocked) this._inPlay.turretFacing = {};
    }

    // --- Status ---

    /**
     * Destroyed: all internal structure in one location (including a turret, never a VTOL rotor) is
     * gone (TW p. 128), a Fuel Tank explosion or Turret Blown Off (TW p. 195), a hover vehicle
     * immobilized over deep water (TW p. 193), or Crew Killed (destroyed for victory, TW p. 194).
     */
    public isDestroyed(): boolean {
        const c = this._inPlay.criticals;
        if (c.crewKilled || c.fuelTankHit || c.turretBlownOff) return true;
        if (this.isSunk() || this._inPlay.crashDestroyed) return true;
        // A Large Naval Vessel survives the loss of a turret (TO:AUE p.27).
        const largeNaval = this.isLargeNavalVessel();
        return this.getLocations().some((loc) => loc.tag !== "rotor" && !(largeNaval && isTurretLocation(loc.tag))
            && (this.getStructureAllocation()[loc.tag] ?? 0) > 0 && this.getStructureRemaining(loc.tag) === 0);
    }

    /** Why the vehicle is destroyed, or null. */
    public getDestroyedReason(): string | null {
        const c = this._inPlay.criticals;
        if (c.crewKilled) return "crew killed";
        if (c.fuelTankHit) return "fuel tank exploded";
        if (c.turretBlownOff) return "turret blown off";
        if (this.isSunk()) return "sank";
        if (this._inPlay.crashDestroyed === "exploded") return "exploded";
        if (this._inPlay.crashDestroyed === "water") return "crashed into water";
        return this.isDestroyed() ? "internal structure destroyed" : null;
    }

    /** A hover vehicle immobilized over Depth 1 or deeper water sinks (TW p. 193). */
    public isSunk(): boolean {
        return this._motiveType.tag === "hover" && this._inPlay.overDeepWater && this._inPlay.motiveHits.includes("immobilized");
    }

    public isAirborneCapable(): boolean {
        return !!this._motiveType.hasRotor || this._motiveType.tag === "wige";
    }

    public isAirborne(): boolean {
        return this.isAirborneCapable() && !this._inPlay.landed && !this.isCrashed();
    }

    /**
     * Crashed: a flying VTOL whose rotor is destroyed (TW p. 197), or an airborne WiGE whose MP drops
     * to 0 (TW p. 199).
     */
    public isCrashed(): boolean {
        if (this._inPlay.crashed) return true;
        if (this._inPlay.landed) return false;
        if (this._motiveType.hasRotor) {
            const rotorGone = (this.getStructureAllocation().rotor ?? 0) > 0 && this.getStructureRemaining("rotor") === 0;
            return this._inPlay.criticals.rotorsDestroyed || rotorGone;
        }
        if (this._motiveType.tag === "wige") return this._getCruiseAfterDamage() === 0;
        return false;
    }

    /**
     * An immobile target: Major motive damage, an Engine Hit, Crew Killed, or a VTOL with a destroyed
     * rotor (TW pp. 193-197). Cruising MP reduced to 0 by other damage stops the vehicle but does not
     * make it an immobile target (TW p. 193).
     */
    public isImmobile(): boolean {
        const c = this._inPlay.criticals;
        if (this._inPlay.motiveHits.includes("immobilized") || c.engineHit || c.crewKilled || this._inPlay.crashed) return true;
        // A Trailer without an engine cannot move under its own power: unhitched, it is an immobile target (TW p.205).
        if (this._support?.engine === "none" && !this._inPlay.beingTowed) return true;
        return !!this._motiveType.hasRotor && (c.rotorsDestroyed
            || ((this.getStructureAllocation().rotor ?? 0) > 0 && this.getStructureRemaining("rotor") === 0));
    }

    // Motive damage applies in the order taken: Moderate -1, Heavy halves (round up); VTOL rotor
    // hits and Rotor Damage criticals cost 1 each (TW pp. 193, 196-197).
    private _getCruiseAfterDamage(): number {
        let mp = this.getCruiseMP();
        for (const hit of this._inPlay.motiveHits) {
            if (hit === "moderate") mp = Math.max(0, mp - 1);
            if (hit === "heavy") mp = Math.ceil(mp / 2);
            if (hit === "immobilized") mp = 0;
        }
        if (this._motiveType.hasRotor) mp = Math.max(0, mp - this._inPlay.rotorHits - this._inPlay.criticals.rotorDamage);
        // A Large Naval Vessel loses 1 Cruising MP for each Engine and Ammunition critical hit (TO:AUE p.27).
        if (this.isLargeNavalVessel()) mp = Math.max(0, mp - this._inPlay.criticals.engineHits - this._inPlay.criticals.ammoHits);
        return mp;
    }

    public getEffectiveCruiseMP(): number {
        return this.isImmobile() ? 0 : this._cruiseAfterTowing(this._getCruiseAfterDamage());
    }

    /** Flank MP; none while the crew is stunned or after a Flight Stabilizer hit (Cruising only). */
    public getEffectiveFlankMP(): number {
        if (this.isCruiseOnly()) return this.getEffectiveCruiseMP();
        return Math.ceil(this.getEffectiveCruiseMP() * 1.5);
    }

    public isCruiseOnly(): boolean {
        return this._inPlay.criticals.crewStunned || this._inPlay.criticals.flightStabilizer;
    }

    public getEffectiveJumpMP(): number {
        return this.isImmobile() || this.isCruiseOnly() ? 0 : this._jumpMP;
    }

    /**
     * Driving Skill Roll modifier: each motive damage level applies once (+1/+2/+3, TW p. 193),
     * Driver Hit +2 and Commander Hit +1 (TW pp. 194-195), VTOL Pilot Hit +2 and Flight Stabilizer +3
     * (TW pp. 197-198).
     */
    public getDrivingModifier(): number {
        const hits = this._inPlay.motiveHits;
        const c = this._inPlay.criticals;
        let modifier = (hits.includes("minor") ? 1 : 0) + (hits.includes("moderate") ? 2 : 0) + (hits.includes("heavy") ? 3 : 0);
        if (c.driverHit) modifier += 2;
        if (c.commanderHit) modifier += 1;
        if (c.pilotHit) modifier += 2;
        if (c.flightStabilizer) modifier += 3;
        return modifier + this.getFrankenVehicleDrivingModifier();
    }

    /** Attacker movement modifier: stationary 0, cruise +1, flank +2, jump +3 (TW). */
    public getAttackerMovementModifier(): number {
        switch (this._inPlay.movementMode) {
            case "cruise": return 1;
            case "flank": return 2;
            case "jump": return 3;
            default: return 0;
        }
    }

    /**
     * Target movement modifier for attacks against this vehicle: from hexes moved, +1 if it jumped,
     * +1 more against an airborne VTOL (TW p. 196) or WiGE (TW p. 199); -4 against an immobile target.
     */
    public getTargetMovementModifier(): number {
        if (this.isImmobile()) return -4;
        const mode = this._inPlay.movementMode;
        let modifier = mode === "stationary" ? 0 : getMovementModifier(this._inPlay.hexesMoved);
        if (mode === "jump") modifier += 1;
        if (this.isAirborne() && mode !== "stationary") modifier += 1;
        return modifier;
    }

    /** Why the vehicle cannot fire at all this turn, or null. */
    public getCannotFireReason(): string | null {
        const c = this._inPlay.criticals;
        if (c.crewKilled) return "Crew killed";
        if (c.crewStunned) return "Crew stunned";
        if (c.sensorHits >= VEHICLE_MAX_SENSOR_HITS) return "Sensors destroyed";
        return null;
    }

    /**
     * To-hit modifiers for one of this vehicle's weapons: movement, sensor hits (+1 each), Commander
     * Hit / Co-Pilot Hit / Flight Stabilizer (+1 each), and a stabilizer hit in the weapon's location
     * (attacker movement modifier doubled); a Support Vehicle adds +2 without fire control or +1 with basic fire
     * control (TW p.206). Returns null when the weapon cannot fire (TW pp. 194-198).
     */
    public getWeaponToHitModifier(weapon: IEquipmentItem): number | null {
        const c = this._inPlay.criticals;
        if (this.getCannotFireReason()) return null;
        if (this.getWeaponStatus(weapon.uuid) !== "ok") return null;
        const inTurret = weapon.location === "turret" || weapon.location === "turret2";
        if (inTurret && (c.turretDestroyed || c.turretBlownOff)) return null;
        if (c.engineHit && isDirectFireEnergyOrPulse(weapon)) return null;
        if (weapon.location && this.isBreached(weapon.location as VehicleLocation)) return null;
        if (inTurret && this.hasChinTurret() && this._inPlay.targetAbove) return null;
        let modifier = this.getAttackerMovementModifier() + c.sensorHits + this.getFireControlToHitModifier();
        // A Large Naval Vessel's crew hits, and a stunned crew, add to Gunnery Skill Rolls (TO:AUE pp.26-27).
        if (this.isLargeNavalVessel()) modifier += c.crewHits + (c.crewStunned || c.crewStunnedTurns > 0 ? 1 : 0);
        if (c.commanderHit) modifier += 1;
        if (c.coPilotHit) modifier += 1;
        if (c.flightStabilizer) modifier += 1;
        if (weapon.location === "turret") modifier += this.getFrankenVehicleTurretToHitModifier();
        if (weapon.location && c.stabilizers.includes(weapon.location as VehicleLocation)) {
            modifier += this.getAttackerMovementModifier();
        }
        return modifier;
    }

    /**
     * Battle Value adjusted for gunnery and driving skill, by the rules edition's BV Skill Multiplier Table
     * (TechManual p. 315 by default). An edition with no table leaves the Battle Value as it is.
     */
    public getPilotAdjustedBattleValue(edition?: string): number {
        const gunnery = this._pilot?.gunnery ?? 4;
        const piloting = this._pilot?.piloting ?? 5;
        const multiplier = getSkillMultiplier(gunnery, piloting, "vehicle", edition) ?? 1;
        return Math.round(this._battleValue * multiplier);
    }

    public export(noInPlayVariables: boolean = false): IVehicleExport {
        return {
            uuid: this._uuid,
            lastUpdated: this.lastUpdated,
            name: this._name,
            model: this._model,
            nickname: this._nickname,
            tonnage: this._tonnage,
            motiveType: this._motiveType.tag,
            hasTurret: this._hasTurret,
            dualTurret: this._dualTurret,
            sponsonTurrets: this._sponsonTurrets,
            frankenVehicle: this.getFrankenVehicle() ?? undefined,
            omni: this._omni || undefined,
            jumpMP: this._jumpMP,
            troopSpace: this._troopSpace || undefined,
            bays: this._bays.length > 0 ? this._bays.map((bay) => ({ ...bay })) : undefined,
            tech: this._tech.tag,
            era: this._era.tag,
            engineType: this._engineType.tag,
            cruiseMP: this._cruiseMP,
            armorType: this._armorType.tag,
            armorAllocation: this._armorAllocation,
            patchworkArmor: this.isPatchworkArmor()
                ? Object.fromEntries(this.getLocations().map((location) => [location.tag, this.getPatchworkArmorType(location.tag).tag]))
                : undefined,
            structureType: this._structureType,
            heatSinkType: this._heatSinkType.tag,
            additionalHeatSinks: this._additionalHeatSinks,
            equipment: this._equipmentList.map((item) => ({
                tag: item.tag,
                location: item.location,
                rear: item.rear,
                uuid: item.uuid,
                pod: this.isPodMounted(item.uuid) || undefined,
                size: findSupportVehicleLightWeapon(item.tag) ? item.size : undefined,
                halfTon: this.isHalfTonBin(item) || undefined,
                pintle: item.pintle || undefined,
                currentAmmo: item.currentAmmo,
                selectedAmmoBinUUID: item.selectedAmmoBinUUID,
                currentAdditionalArmor: item.currentAdditionalArmor,
            })),
            supportVehicle: this.getSupportVehicleSettings() ?? undefined,
            pilot: this._pilot.export(),
            inPlay: noInPlayVariables ? undefined : this._inPlay,
        };
    }

    public exportJSON(): string {
        return JSON.stringify(this.export());
    }

    /** Problems found in the last import: fields that were invalid and replaced, or entries that were dropped. */
    public getImportIssues(): string[] {
        return this._importIssues;
    }

    /** Reads saved Support Vehicle settings: every field allowlisted or clamped, anything invalid replaced and reported. */
    private _importSupportVehicle(saved: unknown, issue: (text: string) => void): IVehicleSupportExport | null {
        if (saved === undefined || saved === null) return null;
        if (!isPlainObject(saved)) {
            issue("Ignored Support Vehicle settings that could not be read");
            return null;
        }
        if (!SUPPORT_VEHICLE_MOTIVES[this._motiveType.tag]) {
            issue(`Loaded as a Combat Vehicle: ${this._motiveType.name} is not a Support Vehicle motive type`);
            return null;
        }
        const defaults = newSupportVehicle();
        const rating = (key: "structuralTechRating" | "engineTechRating" | "armorTechRating"): SupportVehicleTechRating => {
            const value = saved[key];
            if (typeof value === "string" && SUPPORT_VEHICLE_TECH_RATINGS.includes(value as SupportVehicleTechRating)) return value as SupportVehicleTechRating;
            if (value !== undefined) issue(`Replaced an unknown ${key} with ${defaults[key].toUpperCase()}`);
            return defaults[key];
        };
        const engine = SUPPORT_VEHICLE_ENGINES.find((option) => option.tag === saved.engine)?.tag;
        if (saved.engine !== undefined && !engine) issue("Replaced an unknown Support Vehicle engine with an ICE");
        const fireControl = typeof saved.fireControl === "string" && Object.prototype.hasOwnProperty.call(SUPPORT_VEHICLE_FIRE_CONTROL, saved.fireControl)
            ? saved.fireControl as SupportVehicleFireControl : defaults.fireControl;
        const mods = savedStrings(saved.chassisModifications);
        const knownMods = mods.filter((tag) => !!getSupportVehicleChassisModification(tag));
        if (knownMods.length < mods.length) issue("Dropped unknown chassis modifications");
        const bar = supportVehicleArmor.some((armor) => armor.bar === saved.bar) ? saved.bar as number : defaults.bar;
        if (saved.bar !== undefined && bar !== saved.bar) issue(`Replaced an unknown BAR with ${defaults.bar}`);
        return {
            structuralTechRating: rating("structuralTechRating"),
            engine: engine ?? defaults.engine,
            engineTechRating: rating("engineTechRating"),
            alternativeFuel: saved.alternativeFuel === true || undefined,
            fuelTons: savedNumber(saved.fuelTons, defaults.fuelTons, 0, 1000),
            chassisModifications: [...new Set(knownMods)].slice(0, SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS.length),
            bar,
            armorTechRating: rating("armorTechRating"),
            fireControl,
            extraCrew: Math.floor(savedNumber(saved.extraCrew, 0, 0, 1000)) || undefined,
            turrets: Math.floor(savedNumber(saved.turrets, 0, 0, 9)) || undefined,
        };
    }

    /**
     * Loads a saved vehicle. Saves can come from other people's backup files, so every field is type-checked,
     * allowlisted or clamped, construction rules the setters enforce are re-applied, and anything dropped is
     * recorded in getImportIssues(). Never spread or Object.assign the parsed JSON into class state.
     */
    public importJSON(json: string) {
        this._importIssues = [];
        const issue = (text: string) => { if (this._importIssues.length < 50) this._importIssues.push(text); };
        try {
            const parsed: unknown = JSON.parse(json);
            if (!isPlainObject(parsed)) {
                issue("The saved vehicle is not an object");
                return;
            }
            const importObject = parsed as Partial<Record<keyof IVehicleExport, unknown>>;
            const text = (key: "name" | "model" | "nickname") => {
                const value = importObject[key];
                if (value !== undefined && typeof value !== "string") issue(`Ignored a ${key} that is not text`);
                return savedString(value);
            };
            this._uuid = savedString(importObject.uuid) || generateUUID();
            const updated = typeof importObject.lastUpdated === "string" || typeof importObject.lastUpdated === "number"
                ? new Date(importObject.lastUpdated) : new Date();
            this.lastUpdated = Number.isNaN(updated.getTime()) ? new Date() : updated;
            this._name = text("name");
            this._model = text("model");
            this._nickname = text("nickname");
            if (importObject.tonnage !== undefined && typeof importObject.tonnage !== "number") issue("Ignored a tonnage that is not a number");
            this._motiveType = getVehicleMotiveType(savedString(importObject.motiveType));
            this._support = this._importSupportVehicle(importObject.supportVehicle, issue);
            this._tonnage = this._support
                ? Vehicle._supportVehicleTonnage(Math.min(savedNumber(importObject.tonnage, 20, SUPPORT_VEHICLE_MIN_TONNAGE, 100000), this.getSupportVehicleMaxTonnage()))
                : savedNumber(importObject.tonnage, 20, 1, 1000) || 20;
            this._hasTurret = typeof importObject.hasTurret === "boolean" ? importObject.hasTurret : true;
            this._dualTurret = importObject.dualTurret === true && this._hasTurret && this.canHaveDualTurret();
            this._troopSpace = savedNumber(importObject.troopSpace, 0, 0, 1000);
            this._bays = normalizeVehicleBays(importObject.bays);
            if (Array.isArray(importObject.bays) && this._bays.length < Math.min(importObject.bays.length, MAX_VEHICLE_BAYS)) issue("Dropped transport bays that could not be read");
            // Vehicles saved before Omnis were recorded load as standard vehicles.
            this._omni = importObject.omni === true;
            this._podUUIDs = new Set();
            this._inPlay = normalizeVehicleInPlay(importObject.inPlay);
            this.setTech(savedString(importObject.tech));
            this.setEra(savedString(importObject.era));
            this.setEngineType(savedString(importObject.engineType));
            this._cruiseMP = Math.floor(savedNumber(importObject.cruiseMP, 0, 0, 100));
            // Jump jets: only on motive types that allow them, never more than Cruise MP, never with sponsons.
            const jumpMP = Math.floor(savedNumber(importObject.jumpMP, 0, 0, 100));
            this._jumpMP = this._motiveType.allowsJumpJets && !this._support ? Math.min(jumpMP, this._cruiseMP) : 0;
            this._sponsonTurrets = importObject.sponsonTurrets === true && this.canHaveSponsonTurrets();
            if (this._hasTurret && !this.canHaveTurret()) {
                this._hasTurret = false;
                issue("Dropped the turret: this Support Vehicle cannot mount one");
            }
            if (importObject.sponsonTurrets === true && !this._sponsonTurrets) issue("Dropped sponson turrets: the design also has jump jets");
            this._patchworkArmor = {};
            this.setArmorType(savedString(importObject.armorType));
            const armor = savedLocationPoints(importObject.armorAllocation);
            for (const tag of Object.keys(armor) as VehicleLocation[]) armor[tag] = Math.floor(armor[tag] ?? 0);
            if (armor.rotor !== undefined) armor.rotor = Math.min(VTOL_MAX_ROTOR_ARMOR, armor.rotor);
            this._armorAllocation = { ...emptyArmorAllocation(), ...armor };
            const patchwork = importObject.patchworkArmor;
            if (this.isPatchworkArmor() && patchwork && typeof patchwork === "object") {
                for (const location of this.getLocations()) {
                    const armorTag = (patchwork as Record<string, unknown>)[location.tag];
                    if (typeof armorTag !== "string") continue;
                    if (this.setPatchworkArmorType(location.tag, armorTag).tag !== armorTag) issue(`Replaced patchwork armor "${armorTag.slice(0, 40)}" (${location.name}) with Standard`);
                }
            }
            this._structureType = "standard";
            this.setStructureType(savedString(importObject.structureType, "standard"));
            this.setHeatSinkType(savedString(importObject.heatSinkType));
            this._additionalHeatSinks = Math.floor(savedNumber(importObject.additionalHeatSinks, 0, 0, 1000));
            this._pilot = new Pilot(isPlainObject(importObject.pilot) ? importObject.pilot as unknown as IPilot : null);

            // Equipment: one catalog lookup, one recalculation at the end, and a hard cap on entries.
            this._equipmentList = [];
            const saved = Array.isArray(importObject.equipment) ? importObject.equipment : [];
            if (importObject.equipment !== undefined && !Array.isArray(importObject.equipment)) issue("Ignored an equipment list that is not a list");
            if (saved.length > MAX_VEHICLE_EQUIPMENT) issue(`Kept the first ${MAX_VEHICLE_EQUIPMENT} of ${saved.length} equipment entries`);
            const catalog = getEquipmentListByTech(this._tech.tag, true);
            const restored: [IEquipmentItem, Record<string, unknown>][] = [];
            for (const entry of saved.slice(0, MAX_VEHICLE_EQUIPMENT)) {
                if (!isPlainObject(entry) || typeof entry.tag !== "string") {
                    issue("Skipped an equipment entry that could not be read");
                    continue;
                }
                // A saved vehicle keeps what it mounted, including equipment since moved to the other tech base's catalog.
                // A Light or Medium weapon is rebuilt from its infantry weapon record with its extra clips.
                const lightWeapon = findSupportVehicleLightWeapon(entry.tag);
                const catalogItem = lightWeapon
                    ? buildSupportVehicleLightWeapon(lightWeapon, typeof entry.size === "number" ? entry.size : 0)
                    : findByTag(catalog, entry.tag) ?? findByTag(this._otherTechBaseEquipment(), entry.tag);
                if (!catalogItem) {
                    issue(`Skipped unknown equipment "${entry.tag.slice(0, 60)}"`);
                    continue;
                }
                const item = this._newEquipment(catalogItem, entry.location, entry.rear, entry.uuid);
                if (lightWeapon && entry.pintle === true && item.location && item.location !== "turret") item.pintle = true;
                if (entry.halfTon === true && this.canBeHalfTonBin(item)) {
                    item.weight = catalogItem.weight / 2;
                    item.cbills = catalogItem.cbills / 2;
                }
                if (item.isModularArmor && typeof entry.currentAdditionalArmor === "number") {
                    item.currentAdditionalArmor = savedNumber(entry.currentAdditionalArmor, item.currentAdditionalArmor ?? 0, 0, item.additionalArmor ?? 10);
                }
                this._equipmentList.push(item);
                if (this._omni && entry.pod === true && item.uuid) this._podUUIDs.add(item.uuid);
                restored.push([item, entry]);
            }
            // Shots left in each bin, clamped to what the bin holds, once every weapon is mounted.
            for (const [item, entry] of restored) {
                if (item.isAmmo && typeof entry.currentAmmo === "number" && Number.isFinite(entry.currentAmmo)) {
                    item.currentAmmo = Math.max(0, Math.min(this._fullBinShots(item), Math.floor(entry.currentAmmo)));
                }
            }
            // FrankenVehicle: each value is checked as it is set; one with no turret is an ordinary vehicle.
            this._frankenVehicle = null;
            const franken = importObject.frankenVehicle as unknown;
            if (isPlainObject(franken)) {
                if (!this._hasTurret) {
                    issue("Dropped the FrankenVehicle turret: the vehicle has no turret");
                } else {
                    if (this._omni) {
                        this._omni = false;
                        this._podUUIDs.clear();
                        issue("Dropped OmniVehicle pods: a FrankenVehicle is not an OmniVehicle");
                    }
                    this._frankenVehicle = { turretDonorTonnage: this._tonnage, originalTurretWeight: 0, turretGunner: "commander" };
                    this.setFrankenVehicleTurret(franken as Partial<IFrankenVehicle>);
                }
            }
            this._calc();
        } catch (error) {
            issue("The saved vehicle could not be read completely");
            console.error("Vehicle importJSON failed:", error);
        }
    }
}
