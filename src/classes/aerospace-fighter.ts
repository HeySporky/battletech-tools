import { generateUUID } from "../utils/generateUUID";
import { DEFAULT_RULES_EDITION, getSelectableRulesEditionTag } from "../data/rules-editions";
import { aerospaceArmorTypes, getAerospaceArmorPointsPerTon } from "../data/aerospace-armor-types";
import { mechEngineOptions } from "../data/mech-engine-options";
import { mechEngineTypes } from "../data/mech-engine-types";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { btTechOptions } from "../data/tech-options";
import { btEraOptions, findEraByTag, getClosestEraForTech, getErasForTech } from "../data/era-options";
import { CUSTOM_HOMEBREW_RULES_LEVEL, getArtemisLauncherBattleValue, EXPERIMENTAL_RULES_LEVEL, getAmmoBattleValuePerTon, getBattleArmorScaleListByTech, getCompatibleAmmo, getEffectiveIntroduction, getEquipmentListByTech, getEquipmentRulesLevel, getWeaponShotsPerTon, isEquipmentWithinRulesLevel } from "../data/equipment-registry";
import { getFractionalAerospaceArmorTonsPerPoint, getFractionalEngineWeight, roundUpToKilogram } from "../data/fractional-accounting";
import { AlphaStrikeUnit, IASMULUnit } from "./alpha-strike-unit";
import Pilot, { IPilot } from "./pilot";
import { getSkillMultiplier } from "../data/skill-multipliers";
import {
    getRoboticControlCost, getRoboticControlSystem, getRoboticControlSystemsFor, getRoboticControlWeight, getRoboticSkills,
    IRoboticControlSystem, RoboticControlTag, RoboticUnitType, SRCS_BATTLE_VALUE_MULTIPLIER, SRCS_RULES_LEVEL,
} from "../data/robotic-control-systems";
import { FIGHTER_CRITICAL_NAMES, FighterAttackDirection, FighterCritical, getFighterHitLocation } from "../data/fighter-hit-tables";
import { isTargetingComputerWeapon, sizeDroneSystems } from "../data/variable-equipment";
import { findByTag } from "../data/tag-match";
import {
    getSupportVehicleBaseCrew, getSupportVehicleChassisModification, getSupportVehicleEngine, getSupportVehicleEngineWeight,
    getSupportVehicleGunners, getSupportVehicleItemSlots, getSupportVehicleMaxArmor, getSupportVehicleOfficers,
    getSupportVehicleStructureWeight, ISupportVehicleEngine, ISupportVehicleWeightClass, roundSupportVehicleWeight,
    SATELLITE_FUEL_TONS_PER_BURN_DAY, SUPPORT_AIRCRAFT_AS_MOVE, SUPPORT_AIRCRAFT_BV_TYPE_MODIFIER, SUPPORT_AIRCRAFT_MOTIVES,
    SUPPORT_VEHICLE_ARMOR_REQUIRED_MODIFICATIONS, SUPPORT_VEHICLE_CHASSIS_COST_PER_TON, SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS,
    SUPPORT_VEHICLE_COST_TECH_MULTIPLIER, SUPPORT_VEHICLE_COST_TONNAGE_DIVISOR, SUPPORT_VEHICLE_ENGINE_COST_PER_TON,
    SUPPORT_VEHICLE_ENGINES, SUPPORT_VEHICLE_FIRE_CONTROL, SUPPORT_VEHICLE_HEAT_SINK_COST, SUPPORT_VEHICLE_MIN_TONNAGE,
    SUPPORT_VEHICLE_POWER_AMPLIFIER_COST_PER_TON, SUPPORT_VEHICLE_SMALL_LIMIT, SUPPORT_VEHICLE_TECH_RATINGS, SupportAircraftMotive,
    SupportVehicleEngineTag, SupportVehicleFireControl, SupportVehicleTechRating, ULTRA_LIGHT_MAX_BAR,
} from "../data/support-vehicle-construction";
import { supportVehicleArmor } from "../data/support-vehicle-armor";
import {
    getFixedWingDamageThreshold, getSupportAircraftFuelKgPerPoint, getSupportAircraftMaxThrust, getSupportAircraftMaxTonnage,
    getSupportAircraftStructuralIntegrity, getSupportAircraftWeightClass, AIRSHIP_MAX_SAFE_THRUST, AIRSHIP_THRUST_STEP,
} from "../data/support-aircraft";
import {
    AIRCRAFT_BAY_TYPES, getVehicleBayAlphaStrikeSpecials, getVehicleBayCost, getVehicleBaySlots, getVehicleBayType, getVehicleBayWeight,
    IVehicleBay, MAX_VEHICLE_BAY_COUNT, MAX_VEHICLE_BAYS, MAX_VEHICLE_CARGO_TONS, normalizeVehicleBays,
} from "../data/vehicle-transport-bays";
import { getSmallCraftHitLocation, SMALL_CRAFT_CRITICAL_NAMES, SmallCraftCritical } from "../data/small-craft-hit-tables";
import { IAerospaceArmorType, IEngineType, IEquipmentItem, IEras, IHeatSync, ITechDates, ITechOptions } from "../data/data-interfaces";

// Aerospace Fighter construction (TechManual pp.180-197). Shares the engine, heat sink and equipment catalogs
// with BattleMechs and Combat Vehicles; armor comes from the aerospace armor catalog. The same class builds
// conventional fighters, which differ in weight limit, engine, controls, fuel, armor limit and heat sinks, and the
// Support Vehicles that fly by aerospace rules: Fixed-Wing, Airship and Satellite (TM pp.116-139; TO:AUE pp.52-71),
// built with the Support Vehicle tables.

export type FighterType = "aerospace" | "conventional" | "support";
export const FIGHTER_TYPES: { tag: FighterType; name: string }[] = [
    { tag: "aerospace", name: "Aerospace Fighter" },
    { tag: "conventional", name: "Conventional Fighter" },
    { tag: "support", name: "Support Vehicle (Fixed-Wing, Airship or Satellite)" },
];

/** The four firing arcs, and the fuselage for whatever takes no weapon slot (TM p.196). */
export type FighterLocation = "nose" | "leftWing" | "rightWing" | "aft" | "fuselage";
export type FighterArc = Exclude<FighterLocation, "fuselage">;

export const FIGHTER_ARCS: { tag: FighterArc; name: string }[] = [
    { tag: "nose", name: "Nose" },
    { tag: "leftWing", name: "Left Wing" },
    { tag: "rightWing", name: "Right Wing" },
    { tag: "aft", name: "Aft" },
];
export const FIGHTER_LOCATIONS: { tag: FighterLocation; name: string }[] = [...FIGHTER_ARCS, { tag: "fuselage", name: "Fuselage" }];

export type IFighterArmorAllocation = Record<FighterArc, number>;

/** "Aerospace fighters may weigh anywhere from 5 to 100 tons, in 5-ton increments" (TM p.184). */
export const FIGHTER_MIN_TONNAGE = 5;
export const FIGHTER_MAX_TONNAGE = 100;
/** "For conventional fighters, designers may choose any weight from 5 tons to 50 tons" (TM p.184). */
export const CONVENTIONAL_FIGHTER_MAX_TONNAGE = 50;
/** The Master Engine Table ends at 400 (TM p.49). */
export const FIGHTER_MAX_ENGINE_RATING = 400;
/** Cockpit and controls: 3 tons (Aerospace Control Systems Table, TM p.189). */
export const FIGHTER_COCKPIT_TONS = 3;
/** Fuel points per ton (Aerospace Fuel Table, TM p.188). */
export const FIGHTER_FUEL_POINTS_PER_TON = 80;
export const CONVENTIONAL_FIGHTER_FUEL_POINTS_PER_TON = 160;
/** Heat sinks that come free with the engine (Aerospace Unit Heat Sinks Table, TM p.194). */
export const FIGHTER_FREE_HEAT_SINKS = 10;
/** "For fighters, this limit is set at 5 weapons per arc (less if the unit uses non-standard armor)" (TM p.196). */
export const FIGHTER_WEAPONS_PER_ARC = 5;
/** Maximum armor: tonnage x 8 points (Aerospace Unit Maximum Armor Levels Table, TM p.191). */
export const FIGHTER_ARMOR_POINTS_PER_TON_OF_FIGHTER = 8;
/** A conventional fighter's maximum armor: tonnage x 1 points (same table). */
export const CONVENTIONAL_FIGHTER_ARMOR_POINTS_PER_TON_OF_FIGHTER = 1;
export const MAX_FIGHTER_EQUIPMENT = 200;
/**
 * VSTOL equipment on an aerospace fighter is an optional rule, offered from the Advanced rules level. TechManual
 * p.190 says aerospace fighters "may mount this equipment to eliminate the +2 penalty for attempting a vertical
 * landing in atmosphere"; the Sabutai example on the same page says an aerospace fighter "may not mount the VSTOL
 * enhancement". The rule text is followed, as an option.
 */
export const AEROSPACE_VSTOL_RULES_LEVEL = 3;
/** Patchwork Armor is an "advanced construction option" (TO:AUE p.189): the Advanced rules level. */
export const PATCHWORK_ARMOR_RULES_LEVEL = 3;
/** Unit Type Modifiers Table (TM p.316). */
export const FIGHTER_BV_TYPE_MODIFIER: Record<FighterType, number> = { aerospace: 1.2, conventional: 1.1, support: 1.0 };

/** An Alpha Strike damage value: a whole number, or minimal damage (0*). */
export interface IFighterASDamageValue {
    damage: number;
    minimal: boolean;
}

export interface IFighterAlphaStrikeStats {
    type: "AF" | "CF" | "SV";
    /** The movement code: a for fighters and Fixed-Wing Support Vehicles, i for Airships, k for Satellites (ASC p.94). */
    movementCode: string;
    size: number;
    /** Thrust: the Safe Thrust, with the "a" movement code. */
    movement: number;
    damageValues: { short: IFighterASDamageValue; medium: IFighterASDamageValue; long: IFighterASDamageValue; extreme: IFighterASDamageValue };
    armor: number;
    structure: number;
    threshold: number;
    overheat: number;
    pointValue: number;
    specialAbilities: string[];
    calcLog: string;
}

/** Card text for a damage value: 0* for minimal damage. */
export const formatFighterASDamage = (value: IFighterASDamageValue): string => (value.minimal ? "0*" : `${value.damage}`);

/** Damage and critical hits taken in play (TW pp.237-240). */
export interface IFighterInPlay {
    armorDamage: IFighterArmorAllocation;
    structureDamage: number;
    avionics: number;
    engine: number;
    fcs: number;
    sensors: number;
    gear: boolean;
    heatSinks: number;
    pilotHits: number;
    bombsLost: number;
    fuelExploded: boolean;
    storesDropped: boolean;
    /** uuids of weapons knocked out by Weapon critical hits. */
    destroyedWeapons: string[];
    /** Heat carried on the Heat Scale (aerospace fighters only). */
    heat: number;
    /** uuids of weapons marked as fired this turn. */
    firedWeapons: string[];
    /** Weapon critical hits waiting for a player to choose the weapon. */
    pendingWeaponCriticals: IFighterPendingWeaponCritical[];
}

export interface IFighterPendingWeaponCritical {
    arc: FighterArc;
    /** Who chooses: the 1D6 came up 1-3 (controlling player) or 4-6 (attacking player) (TW p.240). */
    chooser: "controlling" | "attacking";
}

/**
 * Heat levels at which an aerospace fighter must make an Avoid Roll (TW p.161). The Avoid numbers are on the
 * record sheet's Heat Scale; weapon attack modifiers and shutdown follow the same scale as for 'Mechs.
 */
export const FIGHTER_HEAT_TRIGGERS: { name: string; levels: number[] }[] = [
    { name: "Random movement", levels: [5, 10, 15, 20, 25] },
    { name: "Ammunition explosion", levels: [19, 23, 28] },
    { name: "Pilot damage", levels: [21, 27] },
];

const newFighterInPlay = (): IFighterInPlay => ({
    armorDamage: { nose: 0, leftWing: 0, rightWing: 0, aft: 0 },
    structureDamage: 0, avionics: 0, engine: 0, fcs: 0, sensors: 0, gear: false, heatSinks: 0, pilotHits: 0, bombsLost: 0,
    fuelExploded: false, storesDropped: false, destroyedWeapons: [], heat: 0, firedWeapons: [], pendingWeaponCriticals: [],
});

/** Critical hits that are counted in boxes, and how many boxes each has. */
export const FIGHTER_CRITICAL_TRACKS: { tag: "avionics" | "engine" | "fcs" | "sensors" | "pilotHits"; name: string; boxes: number }[] = [
    { tag: "avionics", name: "Avionics", boxes: 3 },
    { tag: "engine", name: "Engine", boxes: 3 },
    { tag: "fcs", name: "FCS", boxes: 3 },
    { tag: "sensors", name: "Sensors", boxes: 3 },
    { tag: "pilotHits", name: "Pilot", boxes: 6 },
];

/** One kind of bomb or pod on the external hardpoints, and how many are carried. */
export interface IFighterExternalStore {
    tag: string;
    count: number;
}

/** Fusion engines an aerospace fighter may use, by tech base (Aerospace Unit Engine Table, TM p.186). */
const ENGINE_TAGS: Record<"is" | "clan", string[]> = {
    is: ["standard", "light", "xl", "compact"],
    clan: ["standard", "clan_xl"],
};
/** A conventional fighter of either tech base uses a turbine (ICE) or a standard fusion engine (TM pp.185-186). */
const CONVENTIONAL_ENGINE_TAGS = ["ice", "standard"];

export interface IFighterEquipmentExport {
    tag: string;
    location?: string;
    uuid?: string;
    /** On an OmniFighter: true for a pod-mounted item, absent for one fixed to the base chassis. */
    pod?: boolean;
    /** Fractional Accounting: shots bought for an ammunition bin of less than a ton (TO:AUE p.189). */
    shots?: number;
}

export interface IAerospaceFighterExport {
    /** The rules edition it is built under (rules-editions.ts); absent means Total Warfare. */
    rulesEdition?: string;
    uuid: string;
    lastUpdated: Date;
    name: string;
    model: string;
    /** Absent in saves made before conventional fighters could be built: those are aerospace fighters. */
    fighterType?: FighterType;
    /** VSTOL equipment, conventional fighters only (TM p.190). */
    vstol?: boolean;
    roboticControl?: RoboticControlTag;    // Smart Robotic Control System (IO:AE p.134); absent = piloted
    /** An OmniFighter: equipment may be pod-mounted (aerospace fighters only). */
    omni?: boolean;
    /** Bombs and pods on the external hardpoints. */
    externalStores?: IFighterExternalStore[];
    /** Fractional Accounting (TO:AUE p.188); absent = standard rounding. */
    weightAccounting?: "fractional";
    tonnage: number;
    tech: string;
    era: string;
    engineType: string;
    safeThrust: number;
    fuelTons: number;
    armorType: string;
    armorAllocation: IFighterArmorAllocation;
    /** Patchwork Armor: armor type tag by arc; present only when armorType is "patchwork". */
    patchworkArmor?: Partial<Record<FighterArc, string>>;
    heatSinkType: string;
    additionalHeatSinks: number;
    equipment: IFighterEquipmentExport[];
    /** Present only on an Airship, Fixed-Wing or Satellite Support Vehicle. */
    supportVehicle?: IFighterSupportExport;
    /** A Support Vehicle's transport bays (TM p.239). */
    bays?: IVehicleBay[];
    pilot?: IPilot;
    inPlay?: IFighterInPlay;
}

/** A flying Support Vehicle's construction choices: the parts of the Support Vehicle rules fighters do not have. */
export interface IFighterSupportExport {
    motive: SupportAircraftMotive;
    structuralTechRating: SupportVehicleTechRating;
    engine: SupportVehicleEngineTag;
    engineTechRating: SupportVehicleTechRating;
    chassisModifications: string[];
    /** Barrier Armor Rating, 2 to 10 (TM p.134). */
    bar: number;
    armorTechRating: SupportVehicleTechRating;
    fireControl: SupportVehicleFireControl;
    /** Crew carried above the minimum (TM p.131). */
    extraCrew?: number;
    /** A Satellite built without crew: no weapons or crew-served equipment but satellite communications (TO:AUE p.66). */
    unmanned?: boolean;
}

const newFighterSupport = (motive: SupportAircraftMotive): IFighterSupportExport => ({
    motive, structuralTechRating: "d", engine: motive === "satellite" ? "solar" : "ice", engineTechRating: "d",
    chassisModifications: [], bar: 5, armorTechRating: "d", fireControl: "none",
});

const savedString = (value: unknown, fallback: string = ""): string => typeof value === "string" ? value : fallback;
const savedNumber = (value: unknown, fallback: number, min: number, max: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
const emptyArmor = (): IFighterArmorAllocation => ({ nose: 0, leftWing: 0, rightWing: 0, aft: 0 });
/** The aerospace armor catalog writes an absent prototype year as null; ITechDates leaves it out. */
const armorDates = (armor: IAerospaceArmorType): ITechDates => ({ ...armor, prototype: armor.prototype ?? undefined });
const roundUpHalf = (tons: number): number => Math.ceil(tons * 2 - 1e-9) / 2;
/** Escapes text written into the HTML calculation logs, which the summary page renders as markup. */
const escapeLogText = (value: unknown): string => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** A saved fighter cleaned by a full import, with what the import changed; null when it is not an object. */
export const normalizeAerospaceFighterExport = (raw: unknown): { fighter: IAerospaceFighterExport | null; issues: string[] } => {
    if (!isPlainObject(raw)) return { fighter: null, issues: ["Skipped a saved fighter that could not be read"] };
    let json: string;
    try {
        json = JSON.stringify(raw);
    } catch {
        return { fighter: null, issues: ["Skipped a saved fighter that could not be read"] };
    }
    const loaded = new AerospaceFighter(json);
    return { fighter: loaded.export(), issues: [...loaded.getImportIssues()] };
};

export default class AerospaceFighter {
    public static readonly PATCHWORK_ARMOR_TAG = "patchwork";

    private _uuid: string = generateUUID();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _rulesEdition: string = DEFAULT_RULES_EDITION;
    private _model: string = "";
    private _fighterType: FighterType = "aerospace";
    private _vstol: boolean = false;
    private _roboticControl: RoboticControlTag = "none";
    private _omni: boolean = false;
    private _podUUIDs: Set<string> = new Set();
    private _externalStores: IFighterExternalStore[] = [];
    private _pilot: Pilot = new Pilot();
    private _inPlay: IFighterInPlay = newFighterInPlay();
    private _battleValue: number = 0;
    private _calcLogBV: string = "";
    private _cost: number = 0;
    private _calcLogCost: string = "";
    private _tonnage: number = 50;
    private _tech: ITechOptions = btTechOptions[0];
    private _era: IEras = btEraOptions[0];
    private _engineType: IEngineType = mechEngineTypes[0];
    private _safeThrust: number = 5;
    private _fuelTons: number = 5;
    private _armorType: IAerospaceArmorType = aerospaceArmorTypes[0];
    private _armorAllocation: IFighterArmorAllocation = emptyArmor();
    /** Patchwork Armor: the armor type tag of each arc (TO:AUE p.189); standard where none is set. */
    private _patchworkArmor: Partial<Record<FighterArc, string>> = {};
    private _heatSinkType: IHeatSync = mechHeatSinkTypes[0];
    private _additionalHeatSinks: number = 0;
    private _equipmentList: IEquipmentItem[] = [];
    private _importIssues: string[] = [];
    // Set on an Airship, Fixed-Wing or Satellite Support Vehicle, which replaces the fighter's structure, engine, fuel,
    // armor and crew rules with the Support Vehicle ones.
    private _support: IFighterSupportExport | null = null;
    private _bays: IVehicleBay[] = [];
    /** Weight rounding: "fractional" is the Fractional Accounting construction option (TO:AUE p.188). */
    private _weightAccounting: "standard" | "fractional" = "standard";
    // Whether battle armor items were mounted at the last recalculation: only the first one turns Fractional Accounting on.
    private _hadBattleArmorEquipment = false;

    private _weights: { name: string; weight: number }[] = [];
    private _currentTonnage: number = 0;

    constructor(importJSON: string = "") {
        if (importJSON) {
            this.importJSON(importJSON);
        }
        this._calc();
    }

    public getUUID(): string { return this._uuid; }
    public newUUID(): void { this._uuid = generateUUID(); }

    public getName(): string { return this._name; }
    /** The rules edition the design is built under. Only the editions with rules for this unit type are offered. */
    public getRulesEdition(): string { return this._rulesEdition; }
    public setRulesEdition(editionTag: string): string {
        this._rulesEdition = getSelectableRulesEditionTag(editionTag, "fighter");
        return this._rulesEdition;
    }

    public setName(name: string): string {
        this._name = name.slice(0, 200);
        return this._name;
    }

    public getModel(): string { return this._model; }
    public setModel(model: string): string {
        this._model = model.slice(0, 200);
        return this._model;
    }

    public getFighterType(): FighterType { return this._fighterType; }
    public getFighterTypeName(): string {
        if (this._support) return SUPPORT_AIRCRAFT_MOTIVES.find((motive) => motive.tag === this._support?.motive)?.name ?? "Support Vehicle";
        return FIGHTER_TYPES.find((type) => type.tag === this._fighterType)?.name ?? "";
    }
    public isConventional(): boolean { return this._fighterType === "conventional"; }

    /** Switching type pulls tonnage, engine, thrust, armor and heat sinks back inside the new type's rules. */
    public setFighterType(type: string): FighterType {
        if (type === "support") {
            if (!this._support) {
                this._fighterType = "support";
                this._support = newFighterSupport("fixed-wing");
                this._vstol = false;
                this._externalStores = [];
                this._heatSinkType = mechHeatSinkTypes.find((sink) => sink.tag === "single") ?? this._heatSinkType;
                this._additionalHeatSinks = 0;
                this._armorAllocation = emptyArmor();
                this._safeThrust = 4;
                this._fuelTons = 1;
            }
            this.setTonnage(this._tonnage);
            return this._fighterType;
        }
        if (this._support && (type === "conventional" || type === "aerospace")) {
            this._support = null;
            this._bays = [];
            this._armorAllocation = emptyArmor();
            this._tonnage = Math.round(this._tonnage / 5) * 5;
        }
        this._fighterType = type === "conventional" ? "conventional" : type === "aerospace" ? "aerospace" : this._fighterType;
        if (this.isConventional()) this._omni = false;
        if (this.isConventional()) this._heatSinkType = mechHeatSinkTypes.find((sink) => sink.tag === "single") ?? this._heatSinkType;
        if (!this.getPermittedEngineTags().includes(this._engineType.tag)) this._engineType = mechEngineTypes[0];
        if (this.getArmorPointsPerTon() === null) this._armorType = aerospaceArmorTypes[0];
        // A conventional fighter's SRCS cannot be Improved (IO:AE p.135).
        if (!this.getAvailableRoboticControls().some((system) => system.tag === this._roboticControl)) this._roboticControl = "srcs";
        this.setTonnage(this._tonnage);
        return this._fighterType;
    }

    public hasVSTOL(): boolean { return this._vstol; }

    /**
     * VSTOL equipment (TM p.190). A conventional fighter may always take it. On an aerospace fighter it is an
     * optional rule (see AEROSPACE_VSTOL_RULES_LEVEL): getIssues reports it below that rules level.
     */
    public setVSTOL(vstol: boolean): boolean {
        this._vstol = vstol === true;
        this._calc();
        return this._vstol;
    }

    private _roboticUnitType(): RoboticUnitType { return this.isConventional() ? "conventional-fighter" : "aerospace-fighter"; }

    public getRoboticControl(): IRoboticControlSystem { return getRoboticControlSystem(this._roboticControl); }

    public getAvailableRoboticControls(): IRoboticControlSystem[] { return getRoboticControlSystemsFor(this._roboticUnitType()); }

    /**
     * Fits a Smart Robotic Control System (IO:AE pp.134-135), or "none" for a piloted fighter. The cockpit stays: a
     * drone "is not exempt" from it (p.135). The pilot then takes the system's Gunnery and Piloting Skills.
     */
    public setRoboticControl(tag: string): IRoboticControlSystem {
        const wanted = getRoboticControlSystem(tag);
        this._roboticControl = this.getAvailableRoboticControls().some((system) => system.tag === wanted.tag) ? wanted.tag : "none";
        const skills = this.getRoboticSkills();
        if (skills) {
            this._pilot.gunnery = skills.gunnery;
            this._pilot.piloting = skills.piloting;
        }
        this._calc();
        return this.getRoboticControl();
    }

    /** Gunnery and Piloting Skills of a drone fighter (IO:AE p.135); null when piloted. */
    public getRoboticSkills(): { gunnery: number; piloting: number } | null {
        return getRoboticSkills(this._roboticUnitType(), this._roboticControl);
    }

    public getRoboticControlWeight(): number {
        return getRoboticControlWeight(this._roboticUnitType(), this._roboticControl, this._tonnage, (weight) => this._roundWeight(weight));
    }

    /** Whether VSTOL equipment is offered to this fighter at the rules level. */
    public isVSTOLOffered(rulesLevel: number = 2): boolean {
        // A Fixed-Wing Support Vehicle takes VSTOL as a chassis modification instead (TM p.122).
        if (this._support) return false;
        return this.isConventional() || rulesLevel >= AEROSPACE_VSTOL_RULES_LEVEL;
    }

    // Airship, Fixed-Wing and Satellite Support Vehicles (TM pp.116-139; TO:AUE pp.52-71) ---------------------------

    public isSupportVehicle(): boolean { return this._support !== null; }

    /** The Support Vehicle settings; null on a fighter. A copy: change them through the setters. */
    public getSupportVehicleSettings(): IFighterSupportExport | null {
        return this._support ? { ...this._support, chassisModifications: [...this._support.chassisModifications] } : null;
    }

    public getSupportMotive(): SupportAircraftMotive | null { return this._support?.motive ?? null; }

    public getSupportWeightClass(): ISupportVehicleWeightClass | null {
        return this._support ? getSupportAircraftWeightClass(this._support.motive, this._tonnage) : null;
    }

    /** A Large Airship or a Satellite: the advanced Support Vehicles of TO:AUE, at the Advanced rules level. */
    public isAdvancedSupportVehicle(): boolean { return !!this.getSupportWeightClass()?.advanced; }

    private _isSmallSupport(): boolean { return !!this._support && this._tonnage < SUPPORT_VEHICLE_SMALL_LIMIT; }

    private _roundSupport(tons: number): number { return roundSupportVehicleWeight(tons, this._isSmallSupport()); }

    /** Makes the Support Vehicle a Fixed-Wing, Airship or Satellite; engine, thrust and modifications follow the new type. */
    public setSupportMotive(motive: string): void {
        const option = SUPPORT_AIRCRAFT_MOTIVES.find((entry) => entry.tag === motive);
        if (!this._support || !option) return;
        this._support.motive = option.tag;
        const available = this.getAvailableSupportChassisModifications();
        this._support.chassisModifications = this._support.chassisModifications.filter((tag) => available.includes(tag));
        if (!this.getAvailableSupportEngines().some((engine) => engine.tag === this._support?.engine)) {
            this._support.engine = this.getAvailableSupportEngines()[0]?.tag ?? "fusion";
        }
        if (option.tag !== "satellite") this._support.unmanned = undefined;
        this.setTonnage(this._tonnage);
    }

    /** The chassis modifications in force, with Omni on an OmniVehicle (TM p.119). */
    public getSupportChassisModifications(): string[] {
        if (!this._support) return [];
        const mods = new Set(this._support.chassisModifications);
        if (this._omni) mods.add("omni");
        return SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS.map((mod) => mod.tag).filter((tag) => mods.has(tag));
    }

    /** Chassis modifications the type and size may take (TM p.122; TO:AUE p.59). */
    public getAvailableSupportChassisModifications(): string[] {
        if (!this._support) return [];
        const motive = this._support.motive;
        return SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS
            .filter((mod) => mod.tag !== "omni" && (!mod.motives || mod.motives.includes(motive)) && (!mod.smallOnly || this._isSmallSupport()))
            .map((mod) => mod.tag);
    }

    public setSupportChassisModification(tag: string, installed: boolean): void {
        if (!this._support || !getSupportVehicleChassisModification(tag) || tag === "omni") return;
        const mods = this._support.chassisModifications.filter((mod) => mod !== tag);
        if (installed) mods.push(tag);
        this._support.chassisModifications = mods;
        this._calc();
    }

    public setSupportTechRating(part: "structural" | "engine" | "armor", rating: string): void {
        if (!this._support || !SUPPORT_VEHICLE_TECH_RATINGS.includes(rating as SupportVehicleTechRating)) return;
        const value = rating as SupportVehicleTechRating;
        if (part === "structural") this._support.structuralTechRating = value;
        else if (part === "engine") this._support.engineTechRating = value;
        else this._support.armorTechRating = value;
        this._calc();
    }

    public getSupportEngine(): ISupportVehicleEngine | null {
        return this._support ? getSupportVehicleEngine(this._support.engine) ?? null : null;
    }

    /**
     * Engines the type may use (Base Support Vehicle Engine Compatibilities Table, TM p.127; TO:AUE p.62). A
     * Fixed-Wing may use an electric engine only with the Prop modification; that is reported, not hidden.
     */
    public getAvailableSupportEngines(): ISupportVehicleEngine[] {
        const motive = this._support?.motive;
        return motive ? SUPPORT_VEHICLE_ENGINES.filter((engine) => !engine.incompatible.includes(motive)) : [];
    }

    public setSupportEngine(tag: string): void {
        const engine = this.getAvailableSupportEngines().find((option) => option.tag === tag);
        if (!this._support || !engine) return;
        this._support.engine = engine.tag;
        this._calc();
    }

    /** Barrier Armor Rating (TM p.134); fighters carry full-strength armor, BAR 10. */
    public getBAR(): number { return this._support?.bar ?? 10; }

    public setBAR(bar: number): void {
        if (!this._support || !supportVehicleArmor.some((armor) => armor.bar === bar)) return;
        this._support.bar = bar;
        this._calc();
    }

    /** Kilograms per armor point; Large Airships and Satellites use the advanced table (TM p.134; TO:AUE p.69). */
    public getSupportArmorKgPerPoint(): number | null {
        if (!this._support) return null;
        const support = this._support;
        const armor = supportVehicleArmor.find((entry) => entry.bar === support.bar);
        const table = this.isAdvancedSupportVehicle() ? armor?.advancedKgPerPoint : armor?.kgPerPoint;
        return table?.[support.armorTechRating] ?? null;
    }

    private _armorNeedsArmoredChassis(): boolean {
        if (!this._support) return false;
        const support = this._support;
        const armor = supportVehicleArmor.find((entry) => entry.bar === support.bar);
        const ratings = this.isAdvancedSupportVehicle() ? armor?.advancedArmoredChassisRatings : armor?.armoredChassisRatings;
        return !!ratings?.includes(support.armorTechRating);
    }

    public getSupportFireControl(): SupportVehicleFireControl { return this._support?.fireControl ?? "advanced"; }

    public setSupportFireControl(fireControl: string): void {
        if (!this._support || !Object.prototype.hasOwnProperty.call(SUPPORT_VEHICLE_FIRE_CONTROL, fireControl)) return;
        this._support.fireControl = fireControl as SupportVehicleFireControl;
        this._calc();
    }

    /** Weight of the heavy weapons, ammunition excluded: what fire control and gunners are based on (TM pp.131, 217). */
    private _supportWeaponTons(): number {
        return this._equipmentList.filter((item) => this._isWeapon(item)).reduce((sum, item) => sum + (item.weight || 0), 0);
    }

    /** Basic fire control weighs 5 percent of the weapons, advanced 10 percent (TM p.217). */
    public getSupportFireControlWeight(): number {
        if (!this._support) return 0;
        const factor = SUPPORT_VEHICLE_FIRE_CONTROL[this._support.fireControl].weightFactor;
        return factor > 0 ? this._roundSupport(this._supportWeaponTons() * factor) : 0;
    }

    /** To-hit modifier for a Support Vehicle's weapons: +2 without fire control, +1 with basic (TW p.206). */
    public getFireControlToHitModifier(): number {
        return this._support ? SUPPORT_VEHICLE_FIRE_CONTROL[this._support.fireControl].toHit : 0;
    }

    public getSupportExtraCrew(): number { return this._support?.extraCrew ?? 0; }

    public setSupportExtraCrew(crew: number): void {
        if (!this._support) return;
        this._support.extraCrew = Math.max(0, Math.min(1000, Math.floor(Number.isFinite(crew) ? crew : 0))) || undefined;
        this._calc();
    }

    /** A Satellite may be built unmanned (TO:AUE p.66). */
    public setUnmanned(unmanned: boolean): void {
        if (!this._support) return;
        this._support.unmanned = this._support.motive === "satellite" && unmanned === true ? true : undefined;
        this._calc();
    }

    /** Tons of communications equipment; one record is mounted per ton (TM p.212). */
    public getCommunicationsTons(): number {
        return this._equipmentList.filter((item) => item.tag === "communications-equipment").length;
    }

    /**
     * Crew (Support Vehicle Minimum Crew Table, TM p.131; TO:AUE p.66): base crew, 3 per Field Kitchen, 5 per MASH
     * theater, 1 a ton of communications equipment (none on an unmanned Satellite), gunners by fire control and weapon
     * tonnage (Small: 1 per weapon, or per facing with fire control), any extra crew, then officers for 4 or more.
     */
    public getCrew(): number {
        if (!this._support) return 1;
        const weightClass = this.getSupportWeightClass();
        if (!weightClass) return 0;
        const unmanned = !!this._support.unmanned;
        let crew = getSupportVehicleBaseCrew(this._support.motive, weightClass.size, unmanned, this._tonnage);
        for (const item of this._equipmentList) {
            if (item.tag === "field-kitchen") crew += 3;
            if (item.tag === "mash-core" || item.tag === "mash-theater") crew += 5;
        }
        if (!unmanned) crew += this.getCommunicationsTons();
        const weapons = this._equipmentList.filter((item) => this._isWeapon(item));
        if (weightClass.size === "small") {
            const facings = new Set(weapons.map((item) => item.location ?? "")).size;
            crew += this._support.fireControl === "none" ? weapons.length : this._support.fireControl === "advanced" ? Math.max(0, facings - 1) : facings;
        } else {
            crew += getSupportVehicleGunners(this._support.fireControl, this._support.structuralTechRating, this._supportWeaponTons());
        }
        crew += this._support.extraCrew ?? 0;
        return crew + getSupportVehicleOfficers(crew);
    }

    /** Overall Tech Rating: the highest of the structure, engine, armor and installed equipment (TM p.117). */
    public getSupportOverallTechRating(): SupportVehicleTechRating | null {
        if (!this._support) return null;
        const ratings = [this._support.structuralTechRating, this._support.engineTechRating];
        if (this.getTotalArmorPoints() > 0) ratings.push(this._support.armorTechRating);
        for (const item of this._equipmentList) {
            const rating = item.techRating?.toLowerCase();
            if (rating && SUPPORT_VEHICLE_TECH_RATINGS.includes(rating as SupportVehicleTechRating)) ratings.push(rating as SupportVehicleTechRating);
        }
        return ratings.reduce((best, rating) => (rating > best ? rating : best));
    }

    /** Item slots: 5 + tonnage / 10, or 35 + tonnage / 100 over 300 tons (TM p.120; TO:AUE p.56). */
    public getTotalItemSlots(): number { return this._support ? getSupportVehicleItemSlots(this._tonnage) : 0; }

    /**
     * Item slots used: each item's Support Vehicle slots, one per kind of ammunition, one for all communications
     * equipment, the bays, and BAR 10 armor at Tech E or F (Ferro-Fibrous space, errata v8.0).
     */
    public getUsedItemSlots(): number {
        const ammoTypes = new Set<string>();
        let used = 0;
        for (const item of this._equipmentList) {
            if (item.isAmmo) ammoTypes.add(item.tag);
            else if (item.tag !== "communications-equipment") used += Math.max(0, item.space?.supportVehicle ?? 0);
        }
        used += ammoTypes.size + (this.getCommunicationsTons() > 0 ? 1 : 0) + getVehicleBaySlots(this._bays);
        const ferroFibrous = supportVehicleArmor.find((armor) => armor.bar === this._support?.bar)?.ferroFibrousSlotRatings ?? [];
        if (this._support && this.getTotalArmorPoints() > 0 && ferroFibrous.includes(this._support.armorTechRating)) used += this.getChassisTechBase() === "clan" ? 1 : 2;
        return used;
    }

    public getBays(): IVehicleBay[] { return this._bays; }

    public addBay(tag: string): IVehicleBay | null {
        const type = AIRCRAFT_BAY_TYPES.find((entry) => entry.tag === tag);
        if (!this._support || !type || this._bays.length >= MAX_VEHICLE_BAYS) return null;
        const bay: IVehicleBay = { tag: type.tag, amount: 1, doors: type.infantry || type.tonsEach === null ? 0 : 1 };
        this._bays.push(bay);
        this._calc();
        return bay;
    }

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

    /** Days of station-keeping fuel: 0.043 tons a day, 0.005 for a fusion engine (TO:AUE p.63). */
    public getSatelliteBurnDays(): number {
        if (this._support?.motive !== "satellite") return 0;
        const perDay = this._support.engine === "fusion" ? SATELLITE_FUEL_TONS_PER_BURN_DAY.fusion : SATELLITE_FUEL_TONS_PER_BURN_DAY.other;
        return Math.floor(this._fuelTons / perDay + 1e-9);
    }

    /** Kilograms per Fuel Point, or null when the unit needs none (TM pp.128-129; TO:AUE p.63). */
    public getSupportFuelKgPerPoint(): number | null {
        const weightClass = this.getSupportWeightClass();
        if (!this._support || !weightClass) return null;
        return getSupportAircraftFuelKgPerPoint(this._support.motive, weightClass.size, this._support.engineTechRating, this._support.engine,
            this.getSupportChassisModifications().includes("prop"));
    }

    /** Fuel carried, in tons: none for an engine that needs no Fuel Points (a Satellite's is station-keeping fuel). */
    public getSupportFuelWeight(): number {
        if (!this._support) return this._fuelTons;
        return this._support.motive === "satellite" || this.getSupportFuelKgPerPoint() !== null ? this._fuelTons : 0;
    }

    /** Chassis weight: Base Chassis Value x Tech Rating multiplier x modifications x weight (TM p.122); fighters have none. */
    public getStructureWeight(): number {
        const weightClass = this.getSupportWeightClass();
        if (!this._support || !weightClass) return 0;
        return getSupportVehicleStructureWeight(weightClass, this._support.structuralTechRating, this.getSupportChassisModifications(), this._tonnage);
    }

    /** Heat sinks a Support Vehicle needs: the heat of its heavy energy weapons fired together (TM p.133). */
    public getRequiredHeatSinks(): number {
        return this._support ? this.getWeaponHeat() : 0;
    }

    // OmniFighters --------------------------------------------------------------------------------------------

    public isOmni(): boolean { return this._omni; }

    /** Aerospace fighters and Support Vehicles can be built as Omnis (TM pp.122, 184, 285). A standard fighter has no pods. */
    public setOmni(omni: boolean): boolean {
        // Aerospace fighters and Support Vehicles (with the Omni chassis modification, TM p.122) may be Omnis.
        this._omni = !this.isConventional() && omni === true;
        if (!this._omni) this._podUUIDs.clear();
        this._calc();
        return this._omni;
    }

    public isPodMounted(uuid: string): boolean { return this._omni && this._podUUIDs.has(uuid); }

    public setPodMounted(uuid: string, pod: boolean): boolean {
        if (this._omni && pod && this._equipmentList.some((item) => item.uuid === uuid)) this._podUUIDs.add(uuid);
        else this._podUUIDs.delete(uuid);
        this._calc();
        return this.isPodMounted(uuid);
    }

    /** Weight of the base chassis: everything but the pod-mounted equipment. */
    public getBaseChassisTonnage(): number {
        const pods = this._equipmentList.filter((item) => this.isPodMounted(item.uuid ?? "")).reduce((sum, item) => sum + (item.weight || 0), 0);
        return Math.round((this._currentTonnage - pods) * 1000) / 1000;
    }

    /** Tonnage the base chassis leaves for pods. */
    public getPodSpace(): number { return Math.round((this._tonnage - this.getBaseChassisTonnage()) * 1000) / 1000; }

    /** VSTOL equipment weighs 5 percent of the fighter, rounded up to the half ton (TM p.190). */
    public getVSTOLWeight(): number { return this._vstol ? this._roundWeight(this._tonnage * 0.05) : 0; }

    // Fractional Accounting -----------------------------------------------------------------------------------

    public usesFractionalAccounting(): boolean { return this._weightAccounting === "fractional"; }

    /** Fractional Accounting is "experimental-level unit design" (TO:AUE p.188): Experimental rules and above. */
    public canUseFractionalAccounting(rulesLevel: number = 2): boolean { return rulesLevel >= EXPERIMENTAL_RULES_LEVEL; }

    /**
     * Turns the Fractional Accounting construction option on or off (TO:AUE p.188). It can be turned on only at
     * the Experimental rules level or above; it can always be turned off. Turning it off rounds every ammunition bin back
     * up to the half ton, except battle armor ammunition, which stays by the kilogram (Ghosts of Obeedah p.54).
     */
    public setWeightAccounting(accounting: "standard" | "fractional", rulesLevel: number = 2): "standard" | "fractional" {
        if (accounting === this._weightAccounting) return this._weightAccounting;
        if (accounting === "fractional" && !this.canUseFractionalAccounting(rulesLevel)) return this._weightAccounting;
        this._weightAccounting = accounting;
        if (accounting === "standard") {
            for (const item of this._equipmentList) {
                if (item.isAmmo && !item.battleArmorScale) item.weight = roundUpHalf(item.weight || 0);
            }
        }
        this._calc();
        return this._weightAccounting;
    }

    /**
     * A unit "built or modified to carry battle armor equipment uses the Fractional Accounting construction
     * option by default" (Ghosts of Obeedah p.54). The book's own designs are built with standard rounding, so
     * the option is turned on when the first such item is mounted and can be turned off (user ruling, 2026-10-14).
     */
    public defaultsToFractionalAccounting(): boolean {
        return this._equipmentList.some((item) => item.battleArmorScale === true);
    }

    /** Ammunition can be bought by the shot under Fractional Accounting, and battle armor ammunition always. */
    public canSetAmmoBinShots(bin: IEquipmentItem): boolean {
        return !!bin.isAmmo && (this.usesFractionalAccounting() || bin.battleArmorScale === true);
    }

    /** Rounds a calculated weight up: to the half ton, or to the kilogram under Fractional Accounting (TO:AUE p.188). */
    private _roundWeight(weight: number): number {
        return this.usesFractionalAccounting() ? roundUpToKilogram(weight) : roundUpHalf(weight);
    }

    public getTonnage(): number { return this._tonnage; }
    public getMaxTonnage(): number {
        if (this._support) return getSupportAircraftMaxTonnage(this._support.motive);
        return this.isConventional() ? CONVENTIONAL_FIGHTER_MAX_TONNAGE : FIGHTER_MAX_TONNAGE;
    }

    /** 5 tons for a fighter; a Support Vehicle from 100 kg (TM p.120). */
    public getMinTonnage(): number { return this._support ? SUPPORT_VEHICLE_MIN_TONNAGE : FIGHTER_MIN_TONNAGE; }

    /**
     * 5 to 100 tons in 5-ton increments, 5 to 50 for a conventional fighter (TM p.184). Thrust, fuel and armor
     * are pulled back inside the new limits.
     */
    public setTonnage(tonnage: number): number {
        if (this._support) {
            // Under 5 tons by the kilogram, from 5 tons by the half ton (TM p.120).
            const tons = Math.max(SUPPORT_VEHICLE_MIN_TONNAGE, Math.min(this.getMaxTonnage(), Number.isFinite(tonnage) ? tonnage : this._tonnage));
            this._tonnage = tons < SUPPORT_VEHICLE_SMALL_LIMIT ? Math.round(tons * 1000) / 1000 : Math.round(tons * 2) / 2;
            for (const arc of FIGHTER_ARCS) this._armorAllocation[arc.tag] = Math.min(this.getMaxArmorPoints(), this._armorAllocation[arc.tag]);
            this._fuelTons = Math.min(this._tonnage, this._fuelTons);
            this._safeThrust = Math.min(this.getMaxSafeThrust(), Math.max(this.getMinSafeThrust(), this._safeThrust));
            this._calc();
            return this._tonnage;
        }
        const stepped = Math.round((Number.isFinite(tonnage) ? tonnage : this._tonnage) / 5) * 5;
        this._tonnage = Math.min(this.getMaxTonnage(), Math.max(FIGHTER_MIN_TONNAGE, stepped));
        for (const arc of FIGHTER_ARCS) this._armorAllocation[arc.tag] = Math.min(this.getMaxArmorPoints(), this._armorAllocation[arc.tag]);
        this._fuelTons = Math.min(this._tonnage, this._fuelTons);
        this._safeThrust = Math.min(this.getMaxSafeThrust(), Math.max(this.getMinSafeThrust(), this._safeThrust));
        this._calc();
        return this._tonnage;
    }

    public getTech(): ITechOptions { return this._tech; }

    public setTech(tag: string): ITechOptions {
        this._tech = findByTag(btTechOptions, tag) ?? this._tech;
        this._era = getClosestEraForTech(this._era, this._tech.tag);
        // An engine or armor the new tech base cannot use falls back to the standard one.
        if (!this.getPermittedEngineTags().includes(this._engineType.tag)) this._engineType = mechEngineTypes[0];
        if (this.getArmorPointsPerTon() === null) this._armorType = aerospaceArmorTypes[0];
        this._calc();
        return this._tech;
    }

    /** The tech base that sets armor points per ton and weapon slots: Clan for Clan and Mixed (Clan chassis). */
    public getChassisTechBase(): "is" | "clan" {
        return this._tech.tag === "clan" || this._tech.tag === "mclan" ? "clan" : "is";
    }

    public getEra(): IEras { return this._era; }

    public setEra(tag: string): IEras {
        this._era = getClosestEraForTech(findEraByTag(tag) ?? this._era, this._tech.tag);
        return this._era;
    }

    public getAvailableEras(): IEras[] {
        return getErasForTech(this._tech.tag);
    }

    // Engine and thrust ---------------------------------------------------------------------------------------

    /** Engine types the tech base may use (TM p.186); Mixed Tech may use either list. */
    public getPermittedEngineTags(): string[] {
        if (this.isConventional()) return CONVENTIONAL_ENGINE_TAGS;
        const tag = this._tech.tag;
        if (tag === "is") return ENGINE_TAGS.is;
        if (tag === "clan") return ENGINE_TAGS.clan;
        return [...new Set([...ENGINE_TAGS.is, ...ENGINE_TAGS.clan])];
    }

    public getAvailableEngineTypes(rulesLevel: number = 2): IEngineType[] {
        return mechEngineTypes.filter((engine) => this.getPermittedEngineTags().includes(engine.tag)).map((engine) => {
            const availability = this._datesAvailability(engine, rulesLevel);
            return { ...engine, available: availability.available, availableAsPrototype: availability.asPrototype };
        });
    }

    public getEngineType(): IEngineType { return this._engineType; }

    public setEngineType(tag: string): IEngineType {
        const engine = findByTag(mechEngineTypes, tag);
        if (engine && this.getPermittedEngineTags().includes(engine.tag)) this._engineType = engine;
        this._calc();
        return this._engineType;
    }

    public getSafeThrust(): number { return this._safeThrust; }

    /** Max Thrust = Safe Thrust x 1.5, rounded up (TM p.186); an Airship's to the 0.25, a Satellite's none (TM p.127). */
    public getMaxThrust(): number {
        if (this._support) return getSupportAircraftMaxThrust(this._support.motive, this._safeThrust);
        return Math.ceil(this._safeThrust * 1.5);
    }

    /** What the engine formula takes off Safe Thrust: 2 for an aerospace fighter, nothing for a conventional one. */
    private _thrustOffset(): number { return this.isConventional() ? 0 : 2; }

    /** Engine rating = tonnage x (Safe Thrust - 2); tonnage x Safe Thrust for a conventional fighter (TM p.185). */
    public getEngineRating(): number {
        // A Support Vehicle's Engine Rating is Safe Thrust x tonnage, at most 500 (TM errata v8.0, p.126).
        if (this._support) return Math.min(500, Math.ceil(this._safeThrust * this._tonnage - 1e-9));
        return this._tonnage * (this._safeThrust - this._thrustOffset());
    }

    /** The lowest Safe Thrust whose engine is on the Master Engine Table, which starts at a rating of 10. */
    public getMinSafeThrust(): number {
        if (this._support) return this._support.motive === "satellite" ? 0 : this._support.motive === "airship" ? AIRSHIP_THRUST_STEP : 1;
        return Math.ceil(10 / this._tonnage) + this._thrustOffset();
    }

    /** The highest Safe Thrust whose engine is on the Master Engine Table, which ends at a rating of 400. */
    public getMaxSafeThrust(): number {
        if (this._support) {
            // An Airship flies at Safe Thrust 2 at most (TM p.127); a Fixed-Wing as fast as its engine still fits beside
            // the chassis, up to 20 (a bound for the choice list, not a rule); a Satellite only keeps station.
            if (this._support.motive === "satellite") return 0;
            if (this._support.motive === "airship") return AIRSHIP_MAX_SAFE_THRUST;
            const weightClass = this.getSupportWeightClass();
            const engine = this.getSupportEngine();
            if (!weightClass || !engine) return 1;
            const room = this._tonnage - this.getStructureWeight();
            let thrust = 1;
            while (thrust < 20 && (getSupportVehicleEngineWeight(weightClass, engine, this._support.engineTechRating, thrust + 1, this._tonnage) ?? Infinity) <= room) thrust++;
            return thrust;
        }
        return Math.floor(FIGHTER_MAX_ENGINE_RATING / this._tonnage) + this._thrustOffset();
    }

    public setSafeThrust(safeThrust: number): number {
        // An Airship's Thrust Points come in quarters (TM p.127).
        const step = this._support?.motive === "airship" ? AIRSHIP_THRUST_STEP : 1;
        const value = Number.isFinite(safeThrust) ? Math.floor(safeThrust / step + 1e-9) * step : this._safeThrust;
        this._safeThrust = Math.min(this.getMaxSafeThrust(), Math.max(this.getMinSafeThrust(), value));
        this._calc();
        return this._safeThrust;
    }

    /**
     * From the Master Engine Table (TM p.49); an aerospace fighter's fusion engine needs no extra shielding.
     * "Conventional fighters multiply fusion engine weights by 1.5 (round up to the nearest 0.5 ton)" (TM p.185).
     */
    public getEngineWeight(): number {
        if (this._support) {
            const weightClass = this.getSupportWeightClass();
            const engine = this.getSupportEngine();
            if (!weightClass || !engine) return 0;
            return getSupportVehicleEngineWeight(weightClass, engine, this._support.engineTechRating, this._safeThrust, this._tonnage) ?? 0;
        }
        const rating = this.getEngineRating();
        const option = mechEngineOptions.find((entry) => entry.rating >= rating) ?? mechEngineOptions[mechEngineOptions.length - 1];
        const shielded = this.isConventional() && this._engineType.tag !== "ice";
        if (this.usesFractionalAccounting()) {
            // Standard fusion weight x the Fractional Engine Multiplier, then the conventional fighter's x 1.5 (TO:AUE p.188).
            const fractionalWeight = getFractionalEngineWeight(this._engineType.tag, option.weight.standard, shielded ? 1.5 : 1);
            if (fractionalWeight !== null) return fractionalWeight;
        }
        const tag = this._engineType.tag as keyof typeof option.weight;
        const weight = option.weight[tag] ?? option.weight.standard;
        return shielded ? roundUpHalf(weight * 1.5) : weight;
    }

    /** 3 tons; a tenth of the tonnage, rounded up to the half ton, for a conventional fighter (TM p.189). */
    public getControlsWeight(): number {
        // A Support Vehicle's controls are part of its chassis (TM p.131).
        if (this._support) return 0;
        return this.isConventional() ? this._roundWeight(this._tonnage * 0.1) : FIGHTER_COCKPIT_TONS;
    }

    /** The higher of Safe Thrust and 10 percent of tonnage, rounded down; it weighs nothing (TM p.187). */
    public getStructuralIntegrity(): number {
        if (this._support) return getSupportAircraftStructuralIntegrity(this._support.motive, this._safeThrust, this._tonnage);
        return Math.max(this._safeThrust, Math.floor(this._tonnage / 10));
    }

    // Fuel ----------------------------------------------------------------------------------------------------

    public getFuelTons(): number { return this._fuelTons; }

    /**
     * "Fuel may only be added in full or half-ton lots" (TM p.186). That is a lot size, not a calculated weight,
     * so Fractional Accounting, which frees calculated weights, armor and ammunition (TO:AUE pp.188-189), leaves it.
     */
    public setFuelTons(tons: number): number {
        const value = Number.isFinite(tons) ? tons : this._fuelTons;
        // A Support Vehicle's fuel is rounded to the kilogram when Small, the half ton from 5 tons (TM p.129).
        const step = this._isSmallSupport() ? 1000 : 2;
        this._fuelTons = Math.min(this._tonnage, Math.max(0, Math.round(value * step) / step));
        this._calc();
        return this._fuelTons;
    }

    /** 80 fuel points per ton, 160 for a conventional fighter (TM p.186). */
    public getFuelPointsPerTon(): number {
        if (this._support) {
            const kg = this.getSupportFuelKgPerPoint();
            return kg ? 1000 / kg : 0;
        }
        return this.isConventional() ? CONVENTIONAL_FIGHTER_FUEL_POINTS_PER_TON : FIGHTER_FUEL_POINTS_PER_TON;
    }

    public getFuelPoints(): number {
        if (this._support) {
            const kg = this.getSupportFuelKgPerPoint();
            return kg ? Math.floor(Math.round(this._fuelTons * 1000) / kg + 1e-9) : 0;
        }
        return Math.floor(this._fuelTons * this.getFuelPointsPerTon());
    }

    // Armor ---------------------------------------------------------------------------------------------------

    public getArmorType(): IAerospaceArmorType { return this._armorType; }

    /** Armor a fighter of this tech base can mount (TM pp.191-192). */
    public getAvailableArmorTypes(rulesLevel: number = 2): (IAerospaceArmorType & { available: boolean })[] {
        // A Support Vehicle's armor is chosen by BAR and Tech Rating instead (TM p.134).
        if (this._support) return [];
        const techBase = this.getChassisTechBase();
        return aerospaceArmorTypes
            .filter((armor) => armor.fighterSlots !== null && armor.fighterSlots[techBase] !== null
                && getAerospaceArmorPointsPerTon(armor.tag, this._armorUnit(), techBase) !== null)
            .map((armor) => ({ ...armor, available: this._datesAvailability(armorDates(armor), rulesLevel).available
                && (armor.tag !== AerospaceFighter.PATCHWORK_ARMOR_TAG || rulesLevel >= PATCHWORK_ARMOR_RULES_LEVEL) }));
    }

    public setArmorType(tag: string): IAerospaceArmorType {
        const armor = this.getAvailableArmorTypes().find((entry) => entry.tag === tag);
        const previous = this._armorType.tag;
        if (armor) this._armorType = aerospaceArmorTypes.find((entry) => entry.tag === armor.tag) ?? this._armorType;
        if (this._armorType.tag !== previous) this._patchworkArmor = {};
        this._calc();
        return this._armorType;
    }

    /** The armor for a record sheet: the type, or under Patchwork Armor each arc's type. */
    public getArmorDescription(): string {
        if (!this.isPatchworkArmor()) return this._armorType.name;
        return `${this._armorType.name} (${FIGHTER_ARCS.map((arc) => `${arc.name}: ${this.getPatchworkArmorType(arc.tag).name}`).join(", ")})`;
    }

    /** Patchwork Armor: an armor type for each arc (TO:AUE p.189). */
    public isPatchworkArmor(): boolean {
        return this._armorType.tag === AerospaceFighter.PATCHWORK_ARMOR_TAG;
    }

    /** The armor types an arc may carry: those the fighter could mount as its only armor that the Patchwork Armor Table lists. */
    public getAvailablePatchworkArmorTypes(rulesLevel: number = 2): (IAerospaceArmorType & { available: boolean })[] {
        const techBase = this.getChassisTechBase();
        return this.getAvailableArmorTypes(rulesLevel).filter((armor) => armor.tag !== AerospaceFighter.PATCHWORK_ARMOR_TAG
            && armor.patchwork?.slots[techBase] !== undefined && armor.patchwork?.tonsPerPoint[techBase] !== undefined);
    }

    public getPatchworkArmorType(arc: FighterArc): IAerospaceArmorType {
        return aerospaceArmorTypes.find((armor) => armor.tag === (this._patchworkArmor[arc] ?? "aerospace-standard")) ?? aerospaceArmorTypes[0];
    }

    public setPatchworkArmorType(arc: FighterArc, armorTag: string): IAerospaceArmorType {
        const armor = this.getAvailablePatchworkArmorTypes().find((entry) => entry.tag === armorTag);
        if (this.isPatchworkArmor() && armor && FIGHTER_ARCS.some((entry) => entry.tag === arc)) {
            this._patchworkArmor[arc] = armor.tag;
            this._calc();
        }
        return this.getPatchworkArmorType(arc);
    }

    /** Weapon slots the arc gives up for its armor (Patchwork Armor Table, right of the slash; TO:AUE p.189). */
    public getPatchworkArcSlots(arc: FighterArc): number {
        if (!this.isPatchworkArmor()) return 0;
        return this.getPatchworkArmorType(arc).patchwork?.slots[this.getChassisTechBase()] ?? 0;
    }

    /** Tons of armor on the arc: points x the type's tons per point, "rounding the final result up to the nearest half-ton" (TO:AUE p.189). */
    public getPatchworkArcWeight(arc: FighterArc): number {
        if (!this.isPatchworkArmor()) return 0;
        const tonsPerPoint = this.getPatchworkArmorType(arc).patchwork?.tonsPerPoint[this.getChassisTechBase()] ?? 0;
        const weight = this._armorAllocation[arc] * tonsPerPoint;
        return weight > 0 ? roundUpHalf(weight) : 0;
    }

    /** Drops arc types the fighter can no longer carry (a new tech base or fighter type). */
    private _prunePatchworkArmor(): void {
        if (!this.isPatchworkArmor()) return;
        const allowed = this.getAvailablePatchworkArmorTypes().map((armor) => armor.tag);
        for (const arc of Object.keys(this._patchworkArmor) as FighterArc[]) {
            if (!allowed.includes(this._patchworkArmor[arc] ?? "")) delete this._patchworkArmor[arc];
        }
    }

    private _armorUnit(): "aerospace-fighter" | "conventional-fighter" {
        return this.isConventional() ? "conventional-fighter" : "aerospace-fighter";
    }

    public getArmorPointsPerTon(): number | null {
        if (this._support) {
            const kg = this.getSupportArmorKgPerPoint();
            return kg ? Math.floor(1000 / kg) : null;
        }
        return getAerospaceArmorPointsPerTon(this._armorType.tag, this._armorUnit(), this.getChassisTechBase());
    }

    public getArmorAllocation(): IFighterArmorAllocation { return this._armorAllocation; }

    public setArmorAllocation(arc: FighterArc, points: number): IFighterArmorAllocation {
        const value = Number.isFinite(points) ? Math.floor(points) : 0;
        this._armorAllocation[arc] = Math.min(this.getMaxArmorPoints(), Math.max(0, value));
        this._calc();
        return this._armorAllocation;
    }

    public getTotalArmorPoints(): number {
        return FIGHTER_ARCS.reduce((sum, arc) => sum + this._armorAllocation[arc.tag], 0);
    }

    public getMaxArmorPointsPerTonOfFighter(): number {
        return this.isConventional() ? CONVENTIONAL_FIGHTER_ARMOR_POINTS_PER_TON_OF_FIGHTER : FIGHTER_ARMOR_POINTS_PER_TON_OF_FIGHTER;
    }

    /** Tonnage x 8 points, tonnage x 1 for a conventional fighter (TM p.191); a Support Vehicle by its type (TM p.134; TO:AUE p.69). */
    public getMaxArmorPoints(): number {
        if (this._support) return getSupportVehicleMaxArmor(this._support.motive, this._tonnage);
        return this._tonnage * this.getMaxArmorPointsPerTonOfFighter();
    }

    /**
     * Damage Threshold of each facing: a tenth of its full armor, rounded up. A single hit that does more than
     * this may cause a critical hit (TW p.239).
     */
    public getDamageThresholds(): IFighterArmorAllocation {
        const thresholds = emptyArmor();
        // A Fixed-Wing Support Vehicle's thresholds go by its BAR (TW p.206).
        const fixedWing = this._support?.motive === "fixed-wing";
        for (const arc of FIGHTER_ARCS) {
            thresholds[arc.tag] = fixedWing ? getFixedWingDamageThreshold(this.getBAR(), this._armorAllocation[arc.tag]) : Math.ceil(this._armorAllocation[arc.tag] / 10);
        }
        return thresholds;
    }

    /**
     * Armor is bought in half tons: the allocated points divided by the points per ton, rounded up (TM p.191).
     * Under Fractional Accounting it is bought by the point, at the Fractional Armor Table weight (TO:AUE p.188).
     */
    public getArmorWeight(): number {
        if (this._support) {
            // Points x kilograms a point: to the kilogram when Small, up to the half ton from 5 tons (TM p.134).
            const kg = this.getSupportArmorKgPerPoint();
            return kg ? this._roundSupport(this.getTotalArmorPoints() * kg / 1000) : 0;
        }
        if (this.isPatchworkArmor()) return FIGHTER_ARCS.reduce((sum, arc) => sum + this.getPatchworkArcWeight(arc.tag), 0);
        if (this.usesFractionalAccounting()) return roundUpToKilogram(this.getTotalArmorPoints() * this.getFractionalArmorTonsPerPoint());
        const perTon = this.getArmorPointsPerTon() ?? 16;
        return roundUpHalf(this.getTotalArmorPoints() / perTon);
    }

    /** Tons per point of the selected armor under Fractional Accounting (Fractional Armor Table, TO:AUE p.188). */
    public getFractionalArmorTonsPerPoint(): number {
        return getFractionalAerospaceArmorTonsPerPoint(this._armorType.tag, this.getChassisTechBase(), this.getArmorPointsPerTon() ?? 16);
    }

    /** Points the armor tonnage paid for but that are not allocated yet (fractions of a point are lost). */
    public getUnallocatedArmorPoints(): number {
        // A Support Vehicle buys armor by the point.
        if (this._support) return 0;
        // Patchwork armor is weighed from the points on each arc: nothing is bought that is not allocated.
        if (this.isPatchworkArmor()) return 0;
        // Fractional Accounting buys by the point: nothing is paid for that is not allocated.
        if (this.usesFractionalAccounting()) return 0;
        const perTon = this.getArmorPointsPerTon() ?? 16;
        return Math.min(this.getMaxArmorPoints(), Math.floor(this.getArmorWeight() * perTon + 1e-9)) - this.getTotalArmorPoints();
    }

    public clearArmor(): void {
        this._armorAllocation = emptyArmor();
        this._calc();
    }

    // Heat sinks ----------------------------------------------------------------------------------------------

    public getHeatSinkType(): IHeatSync { return this._heatSinkType; }

    /** Single or double heat sinks, single only for a conventional fighter (TM p.193); doubles follow the era. */
    public getAvailableHeatSinkTypes(rulesLevel: number = 2): (IHeatSync & { available: boolean })[] {
        // Support Vehicles use single heat sinks only (TM p.133).
        return mechHeatSinkTypes.filter((sink) => sink.tag === "single" || (sink.tag === "double" && !this.isConventional() && !this._support))
            .map((sink) => ({ ...sink, available: sink.tag === "single" || this._techDatesAvailability(sink, rulesLevel).available }));
    }

    public setHeatSinkType(tag: string): IHeatSync {
        const allowed = tag === "single" || (tag === "double" && !this.isConventional() && !this._support);
        this._heatSinkType = mechHeatSinkTypes.find((sink) => sink.tag === tag && allowed) ?? this._heatSinkType;
        this._calc();
        return this._heatSinkType;
    }

    public getAdditionalHeatSinks(): number { return this._additionalHeatSinks; }

    public setAdditionalHeatSinks(count: number): number {
        this._additionalHeatSinks = Math.min(200, Math.max(0, Number.isFinite(count) ? Math.floor(count) : 0));
        this._calc();
        return this._additionalHeatSinks;
    }

    /** Ten come free with a fusion engine and none with a turbine (Aerospace Unit Heat Sinks Table, TM p.193). */
    public getFreeHeatSinks(): number {
        // Support Vehicle engines give no free heat sinks (TM p.133).
        if (this._support) return 0;
        return this._engineType.tag === "ice" ? 0 : FIGHTER_FREE_HEAT_SINKS;
    }

    /** Each heat sink beyond the free ones weighs a ton (TM pp.193-194). */
    public getTotalHeatSinks(): number { return this.getFreeHeatSinks() + this._additionalHeatSinks; }

    public getHeatDissipation(): number { return this.getTotalHeatSinks() * (this._heatSinkType.dissipation ?? 1); }

    private static _isEnergyWeapon(item: IEquipmentItem): boolean {
        return item.category === "Energy Weapons" && !item.isAmmo;
    }

    /**
     * Heat of every weapon fired together: an aerospace fighter builds heat for energy and non-energy weapons
     * alike (TM p.194). A conventional fighter counts its energy weapons only, and must sink all of it (TM p.193).
     */
    public getWeaponHeat(): number {
        return this._equipmentList.filter((item) => !item.isAmmo && (!(this.isConventional() || this._support) || AerospaceFighter._isEnergyWeapon(item)))
            .filter((item) => !this._hasPowerCells(item))
            .reduce((sum, item) => sum + (item.heatAero ?? item.heat ?? 0), 0);
    }

    /**
     * A battle armor energy weapon fed from power cells (its "ammunition") needs no heat sinks. Only a unit that
     * does not track heat may use them, so an aerospace fighter never does (Ghosts of Obeedah p.54).
     */
    private _hasPowerCells(weapon: IEquipmentItem): boolean {
        return this.isConventional() && weapon.battleArmorScale === true && AerospaceFighter._isEnergyWeapon(weapon)
            && this._equipmentList.some((ammo) => ammo.isAmmo && getCompatibleAmmo(weapon, ammo));
    }

    /**
     * Power amplifiers: a turbine-powered conventional fighter needs 10 percent of its energy weapons' weight,
     * rounded up to the half ton (TM p.195). Flamers and chemical lasers are left out, as on vehicles, and so are
     * battle armor weapons, whose mount includes them (Ghosts of Obeedah p.54).
     */
    public getPowerAmplifierWeight(): number {
        // A Support Vehicle without a fission or fusion engine needs amplifiers too (TM p.137).
        if (this._support ? ["fission", "fusion"].includes(this._support.engine) : this._engineType.tag !== "ice") return 0;
        const energyTons = this._equipmentList
            .filter((item) => AerospaceFighter._isEnergyWeapon(item) && !item.battleArmorScale && !/vehicle-flamer|chemical-laser/.test(item.tag))
            .reduce((sum, item) => sum + (item.weight || 0), 0);
        return this._roundWeight(energyTons * 0.1);
    }

    // Equipment -----------------------------------------------------------------------------------------------

    /** External stores hardpoints: tonnage divided by 5, rounded down (TM p.196). */
    public getExternalStoresHardpoints(): number { return this._support ? 0 : Math.floor(this._tonnage / 5); }

    /**
     * Bombs and pods the hardpoints can carry: catalog records that give a bomb size, one hardpoint per size
     * point (TW pp.245-247; the larger ordnance is from Tactical Operations and follows its rules level).
     */
    public getAvailableExternalStores(rulesLevel: number = 2): IEquipmentItem[] {
        const seen = new Set<string>();
        const stores: IEquipmentItem[] = [];
        for (const item of getEquipmentListByTech(this._tech.tag, false)) {
            if (!item.isAmmo || !(item.bombBaySlots && item.bombBaySlots > 0) || seen.has(item.tag)) continue;
            if (!isEquipmentWithinRulesLevel(item, rulesLevel)) continue;
            seen.add(item.tag);
            stores.push({ ...item, available: this._datesAvailability(item, rulesLevel).available });
        }
        return stores.sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
    }

    private _storeRecord(tag: string): IEquipmentItem | undefined {
        const item = findByTag(this._catalog(), tag);
        return item && item.isAmmo && item.bombBaySlots && item.bombBaySlots > 0 ? item : undefined;
    }

    public getExternalStores(): (IFighterExternalStore & { name: string; hardpoints: number })[] {
        return this._externalStores.map((store) => {
            const record = this._storeRecord(store.tag);
            return { ...store, name: record?.name ?? store.tag, hardpoints: (record?.bombBaySlots ?? 1) * store.count };
        });
    }

    /** Sets how many of one store are carried; 0 removes it. The count is not cut to fit: getIssues reports an overload. */
    public setExternalStore(tag: string, count: number): IFighterExternalStore[] {
        const record = this._storeRecord(tag);
        const value = Number.isFinite(count) ? Math.min(100, Math.max(0, Math.floor(count))) : 0;
        this._externalStores = this._externalStores.filter((store) => store.tag !== (record?.tag ?? tag));
        if (record && value > 0 && this._externalStores.length < 50) this._externalStores.push({ tag: record.tag, count: value });
        return this._externalStores;
    }

    public clearExternalStores(): void { this._externalStores = []; }

    public getExternalStoresHardpointsUsed(): number {
        return this.getExternalStores().reduce((sum, store) => sum + store.hardpoints, 0);
    }

    /** "1 for every 5 bombs, rounded up" comes off Safe Thrust while the stores are carried (TW p.247). */
    public getExternalStoresThrustLoss(): number { return Math.ceil(this.getExternalStoresHardpointsUsed() / 5); }

    public getLoadedSafeThrust(): number { return Math.max(0, this._safeThrust - this.getExternalStoresThrustLoss()); }
    public getLoadedMaxThrust(): number { return Math.ceil(this.getLoadedSafeThrust() * 1.5); }

    /** Weapon slots an item takes in an arc. Ammunition and core components take none (TM p.196). */
    public getItemSlots(item: IEquipmentItem): number {
        if (item.isAmmo) return 0;
        // A Support Vehicle reads the Support Vehicle slot column (TM p.136).
        if (this._support) return Math.max(0, item.space?.supportVehicle ?? 0);
        return Math.max(0, item.space?.aerospaceFighter ?? 0);
    }

    /** Weapon slots an arc has: 5, less what the armor type takes there (TM pp.191, 196; TO:AUE p.189). */
    public getArcSlots(arc: FighterArc): number {
        // A Support Vehicle has item slots for the whole unit, not weapon slots by arc (TM p.120).
        if (this._support) return this.getTotalItemSlots();
        if (this.isPatchworkArmor()) return FIGHTER_WEAPONS_PER_ARC - this.getPatchworkArcSlots(arc);
        const lost = this._armorType.fighterSlots?.[this.getChassisTechBase()] ?? 0;
        const placement = (this._armorType.fighterSlots?.placement ?? "").toLowerCase();
        let taken = 0;
        if (lost > 0) {
            if (placement.includes("each arc")) taken = 1;
            else if (placement.includes("each wing")) taken = arc === "leftWing" || arc === "rightWing" ? 1 : 0;
            else if (placement.includes("aft")) taken = arc === "aft" ? lost : 0;
        }
        return FIGHTER_WEAPONS_PER_ARC - taken;
    }

    public getArcSlotsUsed(arc: FighterArc): number {
        return this._equipmentList.filter((item) => item.location === arc).reduce((sum, item) => sum + this.getItemSlots(item), 0);
    }

    public getEquipmentList(): IEquipmentItem[] { return this._equipmentList; }

    public isEquipmentAllowed(item: IEquipmentItem): boolean {
        if (this._support) {
            if ((item.space?.supportVehicle ?? -1) < 0) return false;
            // Small Support Vehicles carry no heavy weapons (TM p.136).
            return !(this._isSmallSupport() && (this._isWeapon(item) || item.isAmmo));
        }
        return (item.space?.aerospaceFighter ?? -1) >= 0;
    }

    public getAvailableEquipment(includeCustom: boolean = false, rulesLevel: number = 2): IEquipmentItem[] {
        const items: IEquipmentItem[] = [];
        const techTag = this._tech.tag;
        const lists: ("clan" | "is")[] = [];
        if (["clan", "mclan", "mis"].includes(techTag)) lists.push("clan");
        if (["is", "mis", "mclan"].includes(techTag)) lists.push("is");
        for (const list of lists) {
            for (const item of getEquipmentListByTech(list, includeCustom && (list === "is" || lists.length === 1))) {
                if (!this.isEquipmentAllowed(item)) continue;
                item.catalog = item.catalog ?? (item.category === "Custom Equipment" ? "custom" : list);
                item.criticals = this.getItemSlots(item);
                const availability = this._datesAvailability(item, rulesLevel);
                item.availableAsPrototype = availability.asPrototype;
                item.available = availability.available;
                items.push(item);
            }
        }
        // Battle armor weapons on aerospace fighters and small craft are Experimental (Ghosts of Obeedah p.53).
        if (rulesLevel >= EXPERIMENTAL_RULES_LEVEL) {
            const battleArmorScale = getBattleArmorScaleListByTech(techTag);
            // An aerospace fighter tracks heat, so its battle armor energy weapons run off heat sinks, never power cells.
            const energyTags = this.isConventional() ? [] : battleArmorScale.filter((item) => AerospaceFighter._isEnergyWeapon(item)).map((item) => item.tag);
            for (const item of battleArmorScale) {
                if (energyTags.includes(item.feedsWeaponTag ?? "")) continue;
                item.criticals = this.getItemSlots(item);
                const availability = this._datesAvailability(item, rulesLevel);
                item.availableAsPrototype = availability.asPrototype;
                item.available = availability.available;
                items.push(item);
            }
        }
        items.sort((a, b) => (a.sort > b.sort ? 1 : a.sort < b.sort ? -1 : 0));
        const offeredLevel = includeCustom ? Math.max(rulesLevel, CUSTOM_HOMEBREW_RULES_LEVEL) : rulesLevel;
        return items.filter((item) => isEquipmentWithinRulesLevel(item, offeredLevel));
    }

    private _catalog(): IEquipmentItem[] {
        const techTag = this._tech.tag;
        const own = getEquipmentListByTech(techTag, true);
        // A saved fighter keeps what it mounted, including equipment since moved to the other tech base's catalog.
        const catalog = techTag === "is" || techTag === "clan" ? [...own, ...getEquipmentListByTech(techTag === "clan" ? "mclan" : "mis", true)] : own;
        // Battle armor scale items go last, so a catalog record always wins a lookup.
        return [...catalog, ...getBattleArmorScaleListByTech(techTag)];
    }

    private _newEquipment(catalogItem: IEquipmentItem, location?: unknown, uuid?: unknown): IEquipmentItem {
        const freshId = typeof uuid !== "string" || !uuid || this._equipmentList.some((item) => item.uuid === uuid);
        // A deep copy: mounted items never share nested data with each other or the catalog.
        const item: IEquipmentItem = { ...JSON.parse(JSON.stringify(catalogItem)), uuid: freshId ? generateUUID() : uuid as string };
        item.location = this._validLocation(item, location);
        return item;
    }

    /** Whatever takes a weapon slot sits in an arc; everything else is in the fuselage (TM p.196). */
    private _validLocation(item: IEquipmentItem, location: unknown): string | undefined {
        // On a Support Vehicle anything but a weapon may sit in the body (fuselage), as the Dixon's cargo and
        // communications gear do (TM p.140); weapons fire from an arc.
        if (this._support) {
            if (typeof location === "string" && FIGHTER_LOCATIONS.some((loc) => loc.tag === location)) {
                return location === "fuselage" && this._isWeapon(item) ? undefined : location;
            }
            return this._isWeapon(item) ? undefined : "fuselage";
        }
        if (this.getItemSlots(item) === 0) return "fuselage";
        return typeof location === "string" && FIGHTER_ARCS.some((arc) => arc.tag === location) ? location : undefined;
    }

    public addEquipmentFromTag(tag: string, location?: string): IEquipmentItem | null {
        const catalogItem = findByTag(this._catalog(), tag);
        if (!catalogItem || !this.isEquipmentAllowed(catalogItem) || this._equipmentList.length >= MAX_FIGHTER_EQUIPMENT) return null;
        const item = this._newEquipment(catalogItem, location);
        this._equipmentList.push(item);
        this._calc();
        return item;
    }

    public removeEquipment(uuid: string): IEquipmentItem[] {
        this._podUUIDs.delete(uuid);
        this._equipmentList = this._equipmentList.filter((item) => item.uuid !== uuid);
        this._calc();
        return this._equipmentList;
    }

    public setEquipmentLocation(uuid: string, location: string): IEquipmentItem[] {
        const item = this._equipmentList.find((entry) => entry.uuid === uuid);
        if (item) item.location = this._validLocation(item, location);
        this._calc();
        return this._equipmentList;
    }

    // Ammunition by the shot ----------------------------------------------------------------------------------

    /** The weapon a bin feeds; undefined with no such weapon aboard. */
    private _binWeapon(ammo: IEquipmentItem): IEquipmentItem | undefined {
        return this._equipmentList.find((item) => !item.isAmmo && getCompatibleAmmo(item, ammo));
    }

    /** Shots in one full ton of a bin's ammunition, for the weapon it feeds; 0 with no such weapon aboard. */
    public getAmmoBinShotsPerTon(ammo: IEquipmentItem): number {
        if (!ammo.isAmmo) return 0;
        const weapon = this._binWeapon(ammo);
        return weapon ? getWeaponShotsPerTon(weapon, ammo) : 0;
    }

    /** Shots a bin holds as bought. */
    public getAmmoBinShots(ammo: IEquipmentItem): number {
        return Math.floor(this.getAmmoBinShotsPerTon(ammo) * (ammo.weight || 0) + 1e-6);
    }

    /**
     * Fractional Accounting: carry ammunition by the shot. A shot weighs a full-ton bin divided by its number of
     * shots, rounded up to the kilogram; a bin holds from one shot to a full ton (TO:AUE p.189).
     */
    public setAmmoBinShots(uuid: string | undefined, shots: number): number {
        const bin = this._equipmentList.find((item) => item.uuid === uuid && item.isAmmo);
        if (!bin || !this.canSetAmmoBinShots(bin)) return 0;
        const shotsPerTon = this.getAmmoBinShotsPerTon(bin);
        if (!(shotsPerTon > 0)) return 0;
        const wanted = Math.max(1, Math.min(shotsPerTon, Math.floor(shots) || 1));
        bin.weight = roundUpToKilogram(wanted / shotsPerTon);
        this._calc();
        return wanted;
    }

    // Totals --------------------------------------------------------------------------------------------------

    public getWeights(): { name: string; weight: number }[] { return this._weights; }
    public getCurrentTonnage(): number { return this._currentTonnage; }
    public getRemainingTonnage(): number { return Math.round((this._tonnage - this._currentTonnage) * 1e6) / 1e6; }

    /** Everything that keeps the design from being legal under TechManual, in plain words. */
    public getIssues(rulesLevel: number = 2): string[] {
        if (this._support) return this._getSupportIssues(rulesLevel);
        const issues: string[] = [];
        const remaining = this.getRemainingTonnage();
        if (remaining < 0) issues.push(`Overweight by ${-remaining} tons.`);
        const rating = this.getEngineRating();
        if (rating < 10 || rating > FIGHTER_MAX_ENGINE_RATING) issues.push(`Engine rating ${rating} is not on the Master Engine Table (10 to 400).`);
        if (!this.getPermittedEngineTags().includes(this._engineType.tag)) issues.push(`${this._engineType.name} is not a fighter engine for this tech base (TM p.186).`);
        else if (!this._datesAvailability(this._engineType, rulesLevel).available) issues.push(`${this._engineType.name} is not available in the selected era.`);
        if (this.getTotalArmorPoints() > this.getMaxArmorPoints()) {
            issues.push(`Armor exceeds the maximum of ${this.getMaxArmorPoints()} points (tonnage x ${this.getMaxArmorPointsPerTonOfFighter()}, TM p.191).`);
        }
        if (this.isConventional() && this.getWeaponHeat() > this.getHeatDissipation()) {
            issues.push(`A conventional fighter needs heat sinks for all its energy weapons: ${this.getWeaponHeat()} heat, ${this.getHeatDissipation()} sinks (TM p.193).`);
        }
        if (this.getArmorPointsPerTon() === null) issues.push(`${this._armorType.name} is not available to this tech base.`);
        else if (!this._datesAvailability(armorDates(this._armorType), rulesLevel).available) issues.push(`${this._armorType.name} is not available in the selected era.`);
        if (this.isPatchworkArmor()) {
            for (const arc of FIGHTER_ARCS) {
                const arcArmor = this.getPatchworkArmorType(arc.tag);
                if (!this._datesAvailability(armorDates(arcArmor), rulesLevel).available) issues.push(`${arc.name}: ${arcArmor.name} is not available in the selected era.`);
            }
        }
        if (this._heatSinkType.tag !== "single" && !this._techDatesAvailability(this._heatSinkType, rulesLevel).available) {
            issues.push(`${this._heatSinkType.name} heat sinks are not available in the selected era.`);
        }
        for (const arc of FIGHTER_ARCS) {
            const used = this.getArcSlotsUsed(arc.tag);
            if (used > this.getArcSlots(arc.tag)) issues.push(`${arc.name}: ${used} weapon slots used of ${this.getArcSlots(arc.tag)} (TM p.196).`);
        }
        const unplaced = this._equipmentList.filter((item) => !item.location).length;
        if (unplaced > 0) issues.push(`${unplaced} item${unplaced === 1 ? " has" : "s have"} no firing arc yet.`);
        for (const item of this._equipmentList) {
            if (!this.isEquipmentAllowed(item)) issues.push(`${item.name} cannot be mounted on a fighter.`);
        }
        if (this._fuelTons <= 0) issues.push("The fighter carries no fuel.");
        if (this._vstol && !this.isVSTOLOffered(rulesLevel)) {
            issues.push("VSTOL equipment on an aerospace fighter is an optional rule, offered from the Advanced rules level: TM p.190 allows it in the rule text and denies it in the Sabutai example.");
        }
        if (this._omni && this.isConventional()) issues.push("A conventional fighter cannot be built as an Omni.");
        if (this.isConventional() && this._engineType.tag === "ice") {
            // A unit without a fusion or fission engine runs battle armor energy weapons off power cells (Ghosts of Obeedah p.54).
            for (const item of this._equipmentList.filter((entry) => entry.battleArmorScale && AerospaceFighter._isEnergyWeapon(entry) && !this._hasPowerCells(entry))) {
                issues.push(`${item.name} needs power cells: a turbine-powered fighter cannot run battle armor energy weapons off heat sinks (Ghosts of Obeedah p.54).`);
            }
        }
        const hardpoints = this.getExternalStoresHardpointsUsed();
        if (hardpoints > this.getExternalStoresHardpoints()) {
            issues.push(`External stores need ${hardpoints} hardpoints; the fighter has ${this.getExternalStoresHardpoints()} (TM p.196).`);
        } else if (hardpoints > 0 && this.getLoadedSafeThrust() < 1) {
            issues.push("The external stores leave the fighter with no Safe Thrust (TW p.247).");
        }
        for (const store of this.getExternalStores()) {
            const record = this._storeRecord(store.tag);
            if (record && !isEquipmentWithinRulesLevel(record, rulesLevel)) issues.push(`${record.name} is above the selected rules level.`);
        }
        return issues;
    }

    /** What makes an Airship, Fixed-Wing or Satellite Support Vehicle illegal (TM pp.116-139; TO:AUE pp.52-71). */
    private _getSupportIssues(rulesLevel: number): string[] {
        const support = this._support;
        if (!support) return [];
        const issues: string[] = [];
        const weightClass = this.getSupportWeightClass();
        if (!weightClass) return [`${this.getFighterTypeName()}s weigh from 0.1 to ${this.getMaxTonnage()} tons (TM p.120; TO:AUE p.57).`];
        const remaining = this.getRemainingTonnage();
        if (remaining < 0) issues.push(`Overweight by ${-remaining} tons.`);
        const rating = (value: string) => value.toUpperCase();
        if (support.structuralTechRating < weightClass.minTechRating) issues.push(`The structure needs at least Tech Rating ${rating(weightClass.minTechRating)} for this type and size (TM p.120).`);
        const mods = this.getSupportChassisModifications();
        const available = new Set([...this.getAvailableSupportChassisModifications(), "omni"]);
        for (const tag of mods) {
            const mod = getSupportVehicleChassisModification(tag);
            if (!mod) continue;
            if (!available.has(tag)) issues.push(`${mod.name} is not available to this type or size (TM p.122).`);
            if (support.structuralTechRating < mod.minTechRating) issues.push(`${mod.name} needs a Structural Tech Rating of ${rating(mod.minTechRating)} or better (TM p.122).`);
            for (const excluded of mod.excludes ?? []) {
                if (mods.includes(excluded) && tag < excluded) issues.push(`${mod.name} and ${getSupportVehicleChassisModification(excluded)?.name} may not be combined (TM p.122).`);
            }
        }
        const engine = this.getSupportEngine();
        if (!engine || engine.incompatible.includes(support.motive)) issues.push("This engine cannot power this type (TM p.127; TO:AUE p.62).");
        else if (engine.multiplier[support.engineTechRating] === null) issues.push(`${engine.name} engines do not exist at Tech Rating ${rating(support.engineTechRating)} (TM p.127).`);
        if (support.motive === "fixed-wing" && engine && ["battery", "fuel-cell", "solar"].includes(engine.tag) && !mods.includes("prop")) {
            issues.push("A Fixed-Wing Support Vehicle may use an electric engine only with the Prop modification (TM p.127).");
        }
        if (this.getSupportFuelKgPerPoint() !== null && this._fuelTons <= 0) issues.push("This engine needs Fuel Points (TM p.129).");
        if (support.motive !== "satellite" && this._safeThrust <= 0) issues.push("A Fixed-Wing or Airship needs a Safe Thrust of at least 1 (0.25 for an Airship).");
        const kgPerPoint = this.getSupportArmorKgPerPoint();
        if (this.getTotalArmorPoints() > 0 || mods.some((mod) => SUPPORT_VEHICLE_ARMOR_REQUIRED_MODIFICATIONS.includes(mod))) {
            if (kgPerPoint === null) issues.push(`BAR ${support.bar} armor does not exist at Tech Rating ${rating(support.armorTechRating)} (TM p.134).`);
            else if (this._armorNeedsArmoredChassis() && !mods.includes("armored")) issues.push(`BAR ${support.bar} armor at Tech Rating ${rating(support.armorTechRating)} needs the Armored chassis modification (TM p.134).`);
        }
        if (mods.includes("ultra-light") && support.bar > ULTRA_LIGHT_MAX_BAR) issues.push(`An Ultra-Light chassis may not mount armor better than BAR ${ULTRA_LIGHT_MAX_BAR} (TM p.123).`);
        if (this.getTotalArmorPoints() > this.getMaxArmorPoints()) issues.push(`Armor exceeds the maximum of ${this.getMaxArmorPoints()} points (TM p.134; TO:AUE p.69).`);
        if (mods.some((mod) => SUPPORT_VEHICLE_ARMOR_REQUIRED_MODIFICATIONS.includes(mod)) && FIGHTER_ARCS.some((arc) => this._armorAllocation[arc.tag] < 1)) {
            issues.push("Armored, Amphibious and Environmentally Sealed chassis need at least 1 armor point in every facing (TM p.134).");
        }
        if (this.getWeaponHeat() > this.getTotalHeatSinks()) issues.push(`Heavy energy weapons make ${this.getWeaponHeat()} heat; ${this.getTotalHeatSinks()} heat sinks are installed (TM p.133).`);
        if (this.getUsedItemSlots() > this.getTotalItemSlots()) issues.push(`${this.getUsedItemSlots()} item slots used of ${this.getTotalItemSlots()} (TM p.120).`);
        if (this._isSmallSupport() && this._equipmentList.some((item) => this._isWeapon(item) || item.isAmmo)) issues.push("Small Support Vehicles may not mount heavy weapons (TM p.136).");
        if (support.unmanned && this._equipmentList.some((item) => this._isWeapon(item) || ["field-kitchen", "mash-core", "mash-theater"].includes(item.tag))) {
            issues.push("An unmanned Satellite may not mount weapons or crew-served equipment (TO:AUE p.66).");
        }
        if (this._isSmallSupport()) {
            const seats = this._equipmentList.filter((item) => ["seating-standard", "seating-pillion", "support-vehicle-ejection-seat"].includes(item.tag)).length;
            if (seats < this.getCrew()) issues.push(`A Small Support Vehicle needs a seat for each of its ${this.getCrew()} crew (${seats} installed; TM p.132).`);
        }
        if (this.getCommunicationsTons() > 15) issues.push(`${this.getCommunicationsTons()} tons of communications equipment; a unit carries at most 15 (TM p.212).`);
        for (const item of this._equipmentList) {
            if (!this.isEquipmentAllowed(item)) issues.push(`${item.name} cannot be mounted on this Support Vehicle.`);
        }
        const unplaced = this._equipmentList.filter((item) => !item.location).length;
        if (unplaced > 0) issues.push(`${unplaced} weapon${unplaced === 1 ? " has" : "s have"} no firing arc yet.`);
        if (this.isAdvancedSupportVehicle() && rulesLevel < 3) issues.push("Large Airships and Satellites are Advanced rules (TO:AUE).");
        return issues;
    }

    private _itemIsAvailable(introduced: number | null, extinct: number | null, reintroduced: number | null): boolean {
        const introductionYear = introduced ?? 0;
        const extinctionYear = extinct ?? 0;
        const reintroductionYear = reintroduced ?? 0;
        const eraStart = this._era.yearStart;
        const eraEnd = this._era.yearEnd ?? Number.POSITIVE_INFINITY;
        const overlapsEra = introductionYear <= eraEnd && (extinctionYear === 0 || extinctionYear >= eraStart);
        return overlapsEra || (reintroductionYear > 0 && reintroductionYear <= eraEnd);
    }

    /** In production in the selected era, or (where the rules level allows) a prototype. */
    private _datesAvailability(dates: ITechDates, rulesLevel: number): { available: boolean; asPrototype: boolean } {
        const prototypeOnly = dates.introduced === null && !!dates.prototype;
        const inProduction = !prototypeOnly && this._itemIsAvailable(dates.introduced, dates.extinct, dates.reintroduced);
        const effectiveIntroduction = getEffectiveIntroduction(dates, rulesLevel);
        const asPrototype = !inProduction && effectiveIntroduction !== dates.introduced
            && this._itemIsAvailable(effectiveIntroduction, dates.extinct, dates.reintroduced);
        return { available: inProduction || asPrototype, asPrototype };
    }

    /** As above, reading the Clan window for a Clan chassis where the record has one. */
    private _techDatesAvailability(item: ITechDates & { clanDates?: ITechDates }, rulesLevel: number): { available: boolean; asPrototype: boolean } {
        const innerSphere = this._datesAvailability(item, rulesLevel);
        const clan = this._datesAvailability(item.clanDates ?? item, rulesLevel);
        if (this._tech.tag === "clan") return clan;
        if (this._tech.tag === "is") return innerSphere;
        return innerSphere.available ? innerSphere : clan;
    }

    private _calc(): void {
        // A drone operating system weighs 10 percent of the fighter plus its sensors (TO:AUE p.117).
        sizeDroneSystems(this._equipmentList, this._tonnage);
        if (this._support) {
            this._calcSupportWeights();
            this._calcBattleValue();
            this._calcCost();
            return;
        }
        this._prunePatchworkArmor();
        // Mounting the first battle armor item turns Fractional Accounting on (Ghosts of Obeedah p.54).
        const hasBattleArmorEquipment = this.defaultsToFractionalAccounting();
        if (hasBattleArmorEquipment && !this._hadBattleArmorEquipment) this._weightAccounting = "fractional";
        this._hadBattleArmorEquipment = hasBattleArmorEquipment;
        this._weights = [
            { name: `Engine (${this._engineType.name}, rating ${this.getEngineRating()})`, weight: this.getEngineWeight() },
            { name: "Cockpit and Controls", weight: this.getControlsWeight() },
            ...(this.getRoboticControlWeight() > 0 ? [{ name: this.getRoboticControl().name, weight: this.getRoboticControlWeight() }] : []),
            ...(this._vstol ? [{ name: "VSTOL Equipment", weight: this.getVSTOLWeight() }] : []),
            { name: `Fuel (${this.getFuelPoints()} points)`, weight: this._fuelTons },
            { name: `Armor (${this._armorType.name}, ${this.getTotalArmorPoints()} points)`, weight: this.getArmorWeight() },
            { name: `Heat Sinks (${this.getTotalHeatSinks()} ${this._heatSinkType.name}, ${this.getFreeHeatSinks()} free)`, weight: this._additionalHeatSinks },
            ...(this.getPowerAmplifierWeight() > 0 ? [{ name: "Power Amplifiers", weight: this.getPowerAmplifierWeight() }] : []),
            ...this._equipmentList.map((item) => ({ name: item.name, weight: item.weight || 0 })),
        ];
        this._currentTonnage = Math.round(this._weights.reduce((sum, entry) => sum + entry.weight, 0) * 1000) / 1000;
        this._calcBattleValue();
        this._calcCost();
    }

    /**
     * A Support Vehicle's weights: chassis, engine, fuel, armor, heat sinks, amplifiers, fire control, bays and
     * equipment; on Medium and Large ones, items weighed in kilograms are totalled and rounded up to the half ton
     * (TM p.137).
     */
    private _calcSupportWeights(): void {
        const engine = this.getSupportEngine();
        const fuelPoints = this.getFuelPoints();
        this._weights = [
            { name: "Chassis (Structural Integrity)", weight: this.getStructureWeight() },
            { name: `${engine?.name ?? "Engine"} Engine`, weight: this.getEngineWeight() },
            ...(this.getSupportFuelWeight() > 0 ? [{ name: this._support?.motive === "satellite" ? `Station-keeping Fuel (${this.getSatelliteBurnDays()} burn days)` : `Fuel (${fuelPoints} points)`, weight: this.getSupportFuelWeight() }] : []),
            { name: `Armor (BAR ${this.getBAR()}, ${this.getTotalArmorPoints()} points)`, weight: this.getArmorWeight() },
            ...(this._additionalHeatSinks > 0 ? [{ name: `Heat Sinks (${this._additionalHeatSinks})`, weight: this._additionalHeatSinks }] : []),
            ...(this.getPowerAmplifierWeight() > 0 ? [{ name: "Power Amplifiers", weight: this.getPowerAmplifierWeight() }] : []),
            ...(this.getSupportFireControlWeight() > 0 ? [{ name: SUPPORT_VEHICLE_FIRE_CONTROL[this.getSupportFireControl()].name, weight: this.getSupportFireControlWeight() }] : []),
        ];
        // Loose kilograms may go to cargo, so cargo by the kilogram joins the kilogram total (TM p.137).
        let smallItems = 0;
        for (const bay of this._bays) {
            const weight = getVehicleBayWeight(bay);
            if (!this._isSmallSupport() && (weight * 2) % 1 !== 0) smallItems += weight;
            else this._weights.push({ name: this.getBayName(bay), weight });
        }
        for (const item of this._equipmentList) {
            if (!this._isSmallSupport() && ((item.weight || 0) * 2) % 1 !== 0) smallItems += item.weight || 0;
            else this._weights.push({ name: item.name, weight: item.weight || 0 });
        }
        if (smallItems > 0) this._weights.push({ name: `Items and cargo weighed in kilograms (${Math.round(smallItems * 1000)} kg)`, weight: roundSupportVehicleWeight(smallItems, false) });
        this._currentTonnage = Math.round(this._weights.reduce((sum, entry) => sum + entry.weight, 0) * 1e6) / 1e6;
    }

    // Battle Value and cost -----------------------------------------------------------------------------------

    public getBattleValue(): number { return this._battleValue; }
    public getBattleValueLog(): string { return this._calcLogBV; }
    public getCBillCost(): number { return this._cost; }
    public getCBillCostLog(): string { return this._calcLogCost; }

    public hasTargetingComputer(): boolean {
        return this._equipmentList.some((item) => item.variableFormula?.startsWith("targeting-computer"));
    }

    private _isWeapon(item: IEquipmentItem): boolean {
        return !item.isAmmo && !item.isEquipment && !item.battleValueDefensive && (item.battleValue || 0) > 0;
    }

    /** Heat a weapon counts for in the Battle Value: Ultra x 2, rotary x 6, Streak x 0.5, one-shot x 0.25 (TM p.303). */
    private static _bvHeat(item: IEquipmentItem): number {
        // The multipliers apply to the heat of one shot: a rapid-fire weapon's aerospace heat is already that of
        // a full burst, so it is not multiplied again.
        const text = `${item.tag} ${item.name}`.toLowerCase();
        const rotary = /rotary|\brac\b/.test(text);
        const ultra = !rotary && /ultra|\buac\b/.test(text);
        const heat = rotary || ultra ? item.heat ?? 0 : item.heatAero ?? item.heat ?? 0;
        if (item.isOneShot) return heat * 0.25;
        if (rotary) return heat * 6;
        if (ultra) return heat * 2;
        if (/streak/.test(text)) return heat * 0.5;
        return heat;
    }

    /**
     * A weapon's Battle Value before arc and heat adjustments. "Increase by 20 percent the BV of any missile
     * launcher equipped with Artemis IV" (TM p.303): the catalog holds a launcher with Artemis IV as its own
     * record, so the plain launcher's value is looked up and raised.
     */
    private _weaponBaseBV(item: IEquipmentItem): number {
        return getArtemisLauncherBattleValue(item, () => this._catalog());
    }

    /** The Speed Factor for a Maximum Thrust (Speed Factor Table and formula, TM p.316). */
    public static speedFactor(maxThrust: number): number {
        return Math.round(Math.pow(1 + (maxThrust - 5) / 10, 1.2) * 100) / 100;
    }

    /**
     * Battle Value (Calculating Aerospace BV, TM pp.302-304; the worked TRB-D36 Thunderbird on p.313).
     * Defensive = (armor x 2.5 + Structural Integrity x 2 + defensive equipment - 15 per type of explosive
     * ammunition and 1 per Gauss weapon on an Inner Sphere fighter without CASE, never below 1) x 1.2, or 1.1
     * for a conventional fighter. Offensive = (weapons + ammunition, capped at its weapons, + other equipment)
     * x the Speed Factor for Maximum Thrust. The weaker of the nose and aft weapon groups counts half. An
     * aerospace fighter that makes more heat than 6 + its heat sinks halves every weapon after the one that
     * crosses that line, taking the highest values first. A launcher fitted with Artemis IV counts 20 percent
     * more than the plain launcher. External stores are not part of a fighter's own Battle Value.
     */
    private _calcBattleValue(): void {
        if (this._support) {
            this._calcSupportBattleValue(this._support);
            return;
        }
        let log = "<strong>DEFENSIVE BATTLE RATING</strong><br />";
        const armorPoints = this.getTotalArmorPoints();
        const structuralIntegrity = this.getStructuralIntegrity();
        let defensive = armorPoints * 2.5 + structuralIntegrity * 2;
        log += `Armor: ${armorPoints} x 2.5 = ${armorPoints * 2.5}<br />Structural Integrity: ${structuralIntegrity} x 2 = ${structuralIntegrity * 2}<br />`;

        const weapons = this._equipmentList.filter((item) => !item.isAmmo);
        let amsAmmoBV = 0;
        let amsBV = 0;
        for (const item of this._equipmentList) {
            if (item.isAmmo) {
                const fed = weapons.find((weapon) => weapon.battleValueDefensive && getCompatibleAmmo(weapon, item));
                if (fed) amsAmmoBV += getAmmoBattleValuePerTon(fed, item) * (item.weight || 0);
            } else if (item.battleValueDefensive) {
                defensive += item.battleValue || 0;
                if (item.weaponType?.includes("AMS")) amsBV += item.battleValue || 0;
                log += `+ Defensive Equipment: ${escapeLogText(item.name)} = ${item.battleValue || 0}<br />`;
            }
        }
        defensive += Math.min(amsAmmoBV, amsBV);

        // Clan fighters are taken to have CASE; an Inner Sphere one needs to mount it (TM p.302).
        const hasCASE = this.getChassisTechBase() === "clan" || this._equipmentList.some((item) => /(^|-)case(-|$)/.test(item.tag));
        if (!hasCASE) {
            const explosiveTypes = new Set(this._equipmentList.filter((item) => item.isAmmo && item.explosive).map((item) => item.tag)).size;
            const gaussWeapons = weapons.filter((item) => /gauss|(^|-)hag(-|$)/.test(item.tag)).length;
            const penalty = explosiveTypes * 15 + gaussWeapons;
            if (penalty > 0) {
                defensive = Math.max(1, defensive - penalty);
                log += `- Explosive ammunition (${explosiveTypes} type${explosiveTypes === 1 ? "" : "s"} x 15) and Gauss weapons (${gaussWeapons} x 1), no CASE = -${penalty}<br />`;
            }
        }
        const typeModifier = FIGHTER_BV_TYPE_MODIFIER[this._fighterType];
        log += `Subtotal ${defensive.toFixed(2)} x ${typeModifier} (${this.getFighterTypeName()})`;
        defensive *= typeModifier;
        log += ` = ${defensive.toFixed(2)}<br />`;

        log += "<strong>OFFENSIVE BATTLE RATING</strong><br />";
        const hasTC = this.hasTargetingComputer();
        const offensiveWeapons = this._equipmentList.filter((item) => this._isWeapon(item));
        const arcBV = (arc: FighterArc) => offensiveWeapons.filter((item) => item.location === arc).reduce((sum, item) => sum + (item.battleValue || 0), 0);
        const halvedArc: FighterArc = arcBV("nose") < arcBV("aft") ? "nose" : "aft";
        const modifiedBV = (item: IEquipmentItem) => this._weaponBaseBV(item)
            * (hasTC && isTargetingComputerWeapon(item) ? 1.25 : 1) * (item.location === halvedArc ? 0.5 : 1);

        let rating = 0;
        // Ammunition, capped at the unmodified value of the weapons of the model it feeds.
        const weaponBVByTag: Record<string, number> = {};
        for (const item of offensiveWeapons) weaponBVByTag[item.tag] = (weaponBVByTag[item.tag] ?? 0) + (item.battleValue || 0);
        const ammoBVByTag: Record<string, number> = {};
        for (const ammo of this._equipmentList.filter((item) => item.isAmmo)) {
            const fed = offensiveWeapons.find((weapon) => getCompatibleAmmo(weapon, ammo));
            if (fed) ammoBVByTag[fed.tag] = (ammoBVByTag[fed.tag] ?? 0) + getAmmoBattleValuePerTon(fed, ammo) * (ammo.weight || 0);
        }
        for (const [tag, value] of Object.entries(ammoBVByTag)) {
            const capped = Math.min(value, weaponBVByTag[tag] ?? 0);
            rating += capped;
            log += `+ Ammunition for ${escapeLogText(tag)} = ${capped.toFixed(2)}${capped < value ? " (capped at weapon BV)" : ""}<br />`;
        }
        // Equipment that is neither a weapon nor defensive.
        for (const item of weapons) {
            if (!this._isWeapon(item) && !item.battleValueDefensive && (item.battleValue || 0) > 0) {
                rating += item.battleValue || 0;
                log += `+ ${escapeLogText(item.name)} = ${item.battleValue}<br />`;
            }
        }

        const efficiency = 6 + this.getHeatDissipation();
        const totalHeat = offensiveWeapons.reduce((sum, item) => sum + AerospaceFighter._bvHeat(item), 0);
        const tracksHeat = !this.isConventional() && totalHeat > efficiency;
        if (!this.isConventional()) log += `Heat Efficiency 6 + ${this.getHeatDissipation()} = ${efficiency}; Total Weapon Heat ${totalHeat}<br />`;
        const ordered = [...offensiveWeapons].sort((a, b) => {
            const heatless = (AerospaceFighter._bvHeat(a) > 0 ? 1 : 0) - (AerospaceFighter._bvHeat(b) > 0 ? 1 : 0);
            if (heatless !== 0) return heatless;
            return modifiedBV(b) - modifiedBV(a) || AerospaceFighter._bvHeat(a) - AerospaceFighter._bvHeat(b);
        });
        let runningHeat = 0;
        let overheated = false;
        for (const item of ordered) {
            const heat = AerospaceFighter._bvHeat(item);
            const halved = tracksHeat && overheated && heat > 0;
            const value = modifiedBV(item) * (halved ? 0.5 : 1);
            rating += value;
            if (tracksHeat && heat > 0 && !overheated) {
                runningHeat += heat;
                if (runningHeat >= efficiency) overheated = true;
            }
            log += `+ ${escapeLogText(item.name)} (${escapeLogText(FIGHTER_LOCATIONS.find((loc) => loc.tag === item.location)?.name ?? "no arc")}) = ${value.toFixed(2)}`
                + `${item.location === halvedArc ? " (weaker of nose and aft x 0.5)" : ""}${halved ? " (over Heat Efficiency x 0.5)" : ""}<br />`;
        }
        const speedFactor = AerospaceFighter.speedFactor(this.getMaxThrust());
        const offensive = rating * speedFactor;
        log += `Weapon Battle Rating ${rating.toFixed(2)} x Speed Factor ${speedFactor} (Max Thrust ${this.getMaxThrust()}) = ${offensive.toFixed(2)}<br />`;

        const robotic = this._roboticControl === "none" ? 1 : SRCS_BATTLE_VALUE_MULTIPLIER;
        this._battleValue = Math.round((defensive + offensive) * robotic);
        log += `<strong>Battle Value</strong>: ${defensive.toFixed(2)} + ${offensive.toFixed(2)}`
            + `${robotic !== 1 ? ` x ${robotic} (Smart Robotic Control System, IO:AE p.187)` : ""} = ${this._battleValue}<br />`;
        this._calcLogBV = log;
    }

    /**
     * Battle Value of an Airship, Fixed-Wing or Satellite Support Vehicle (TM pp.312-314; TO:AUE p.190): defensive =
     * (armor x 2.5 x BAR / 10 + Structural Integrity x 2 + defensive equipment) x the type modifier (Airship 0.7,
     * Fixed-Wing 1.0, Satellite 0.7); no explosive ammunition penalty, which is for fighters and Small Craft.
     * Offensive = weapons (the weaker of nose and aft at half) and ammunition (capped at its weapons) x the fire
     * control multiplier, plus other equipment, x the Speed Factor for Maximum Thrust: an Airship's rounded up, a
     * Satellite's 0. Support Vehicles track no heat, so no weapon is halved for it.
     */
    private _calcSupportBattleValue(support: IFighterSupportExport): void {
        let log = "<strong>DEFENSIVE BATTLE RATING</strong><br />";
        const armorPoints = this.getTotalArmorPoints();
        const armorBV = armorPoints * 2.5 * support.bar / 10;
        const structuralIntegrity = this.getStructuralIntegrity();
        let defensive = armorBV + structuralIntegrity * 2;
        log += `Armor: ${armorPoints} x 2.5 x ${support.bar / 10} (BAR ${support.bar}) = ${armorBV.toFixed(2)}<br />Structural Integrity: ${structuralIntegrity} x 2 = ${structuralIntegrity * 2}<br />`;
        const weapons = this._equipmentList.filter((item) => !item.isAmmo);
        let amsAmmoBV = 0;
        let amsBV = 0;
        for (const item of this._equipmentList) {
            if (item.isAmmo) {
                const fed = weapons.find((weapon) => weapon.battleValueDefensive && getCompatibleAmmo(weapon, item));
                if (fed) amsAmmoBV += getAmmoBattleValuePerTon(fed, item) * (item.weight || 0);
            } else if (item.battleValueDefensive) {
                defensive += item.battleValue || 0;
                if (item.weaponType?.includes("AMS")) amsBV += item.battleValue || 0;
                log += `+ Defensive Equipment: ${escapeLogText(item.name)} = ${item.battleValue || 0}<br />`;
            }
        }
        defensive += Math.min(amsAmmoBV, amsBV);
        const typeModifier = SUPPORT_AIRCRAFT_BV_TYPE_MODIFIER[support.motive];
        log += `Subtotal ${defensive.toFixed(2)} x ${typeModifier} (${escapeLogText(this.getFighterTypeName())})`;
        defensive *= typeModifier;
        log += ` = ${defensive.toFixed(2)}<br /><strong>OFFENSIVE BATTLE RATING</strong><br />`;

        const hasTC = this.hasTargetingComputer();
        const offensiveWeapons = this._equipmentList.filter((item) => this._isWeapon(item));
        const arcBV = (arc: FighterArc) => offensiveWeapons.filter((item) => item.location === arc).reduce((sum, item) => sum + (item.battleValue || 0), 0);
        const halvedArc: FighterArc = arcBV("nose") < arcBV("aft") ? "nose" : "aft";
        let weaponBV = 0;
        const weaponBVByTag: Record<string, number> = {};
        for (const item of offensiveWeapons) {
            const value = this._weaponBaseBV(item) * (hasTC && isTargetingComputerWeapon(item) ? 1.25 : 1) * (item.location === halvedArc ? 0.5 : 1);
            weaponBV += value;
            weaponBVByTag[item.tag] = (weaponBVByTag[item.tag] ?? 0) + (item.battleValue || 0);
            log += `+ ${escapeLogText(item.name)} = ${value.toFixed(2)}${item.location === halvedArc ? " (weaker of nose and aft x 0.5)" : ""}<br />`;
        }
        const ammoBVByTag: Record<string, number> = {};
        for (const ammo of this._equipmentList.filter((item) => item.isAmmo)) {
            const fed = offensiveWeapons.find((weapon) => getCompatibleAmmo(weapon, ammo));
            if (fed) ammoBVByTag[fed.tag] = (ammoBVByTag[fed.tag] ?? 0) + getAmmoBattleValuePerTon(fed, ammo) * (ammo.weight || 0);
        }
        let ammoBV = 0;
        for (const [tag, value] of Object.entries(ammoBVByTag)) ammoBV += Math.min(value, weaponBVByTag[tag] ?? 0);
        const fireControl = SUPPORT_VEHICLE_FIRE_CONTROL[support.fireControl];
        weaponBV *= fireControl.bvMultiplier;
        ammoBV *= fireControl.bvMultiplier;
        log += `Weapons and ammunition x ${fireControl.bvMultiplier} (${fireControl.name === "None" ? "no fire control" : escapeLogText(fireControl.name)})<br />`;
        let equipmentBV = 0;
        for (const item of weapons) {
            if (!this._isWeapon(item) && !item.battleValueDefensive && (item.battleValue || 0) > 0) equipmentBV += item.battleValue || 0;
        }
        const maxThrust = support.motive === "satellite" ? 0 : Math.ceil(this.getMaxThrust() - 1e-9);
        const speedFactor = AerospaceFighter.speedFactor(maxThrust);
        const rating = weaponBV + ammoBV + equipmentBV;
        const offensive = rating * speedFactor;
        log += `(Weapons ${weaponBV.toFixed(2)} + Ammo ${ammoBV.toFixed(2)} + Equipment ${equipmentBV}) x Speed Factor ${speedFactor} (Max Thrust ${maxThrust}) = ${offensive.toFixed(2)}<br />`;
        this._battleValue = Math.round(defensive + offensive);
        log += `<strong>Battle Value</strong>: ${defensive.toFixed(2)} + ${offensive.toFixed(2)} = ${this._battleValue}<br />`;
        this._calcLogBV = log;
    }

    /**
     * C-bill cost (Aerospace Unit Structural Costs table and the final cost formula, TM pp.283-285; the worked
     * 'Mechbuster on p.277). Structure, engine, fuel, armor, heat sinks, amplifiers, weapons and ammunition,
     * then x 1.25 for an OmniFighter and x (1 + tonnage / 200). External stores are not part of the price.
     */
    private _calcCost(): void {
        if (this._support) {
            this._calcSupportCost(this._support);
            return;
        }
        const rows: [string, number][] = [];
        if (this.isConventional()) {
            rows.push([`Avionics (4,000 x ${this.getControlsWeight()} t)`, 4000 * this.getControlsWeight()]);
        } else {
            rows.push(["Cockpit", 200000], ["Life Support", 50000], [`Sensors (2,000 x ${this._tonnage} t)`, 2000 * this._tonnage]);
        }
        if (this._vstol) rows.push([`VSTOL (5,000 x ${this.getVSTOLWeight()} t)`, 5000 * this.getVSTOLWeight()]);
        if (this._roboticControl !== "none") {
            rows.push([`${this.getRoboticControl().name} (${this.getRoboticControlWeight()} t)`, getRoboticControlCost(this._roboticControl, this.getRoboticControlWeight())]);
        }
        const structureRate = this.isConventional() ? 4000 : 50000;
        rows.push([`Structural Integrity (${structureRate.toLocaleString("en-US")} x ${this.getStructuralIntegrity()})`, structureRate * this.getStructuralIntegrity()]);
        rows.push(["Attitude Thruster", 25000], [`Landing Gear (10 x ${this._tonnage} t)`, 10 * this._tonnage]);
        const rating = this.getEngineRating();
        rows.push([`${this._engineType.name} Engine (${(this._engineType.costMultiplier || 0).toLocaleString("en-US")} x rating ${rating} x ${this._tonnage} t / 75)`,
            (this._engineType.costMultiplier || 0) * rating * this._tonnage / 75]);
        rows.push([`Fuel Tanks (200 x ${this._fuelTons} t)`, 200 * this._fuelTons]);
        if (this.isPatchworkArmor()) {
            // Patchwork: each arc's armor at its own type's cost per ton.
            for (const arc of FIGHTER_ARCS) {
                const weight = this.getPatchworkArcWeight(arc.tag);
                const arcArmor = this.getPatchworkArmorType(arc.tag);
                if (weight > 0) rows.push([`Armor, ${arc.name} (${arcArmor.name}, ${weight} t)`, weight * (arcArmor.costMultiplier || 10000)]);
            }
        } else {
            rows.push([`Armor (${this._armorType.name}, ${this.getArmorWeight()} t)`, this.getArmorWeight() * (this._armorType.costMultiplier || 10000)]);
        }
        if (this.getTotalHeatSinks() > 0) rows.push([`Heat Sinks (${this.getTotalHeatSinks()} ${this._heatSinkType.name})`, this.getTotalHeatSinks() * (this._heatSinkType.cost || 2000)]);
        if (this.getPowerAmplifierWeight() > 0) rows.push([`Power Amplifiers (20,000 x ${this.getPowerAmplifierWeight()} t)`, 20000 * this.getPowerAmplifierWeight()]);
        const equipment = this._equipmentList.reduce((sum, item) => sum + (item.isAmmo ? (item.cbills || 0) * (item.weight || 0) : item.cbills || 0), 0);
        rows.push(["Weapons, Equipment and Ammunition", equipment]);
        const subtotal = rows.reduce((sum, [, value]) => sum + value, 0);
        const omni = this._omni ? 1.25 : 1;
        const multiplier = 1 + this._tonnage / 200;
        this._cost = Math.round(subtotal * omni * multiplier);
        const money = (value: number) => Math.round(value).toLocaleString("en-US");
        this._calcLogCost = rows.map(([name, value]) => `${escapeLogText(name)}: ${money(value)}`).join("<br />")
            + `<br />Subtotal ${money(subtotal)}${this._omni ? " x 1.25 (OmniFighter)" : ""} x ${multiplier} (1 + ${this._tonnage} / 200)`
            + ` = <strong>${money(this._cost)}</strong>`;
    }

    /**
     * Support Vehicle cost (TM pp.280, 285; TO:AUE p.229): (chassis 2,500 x structure tons x the modifications' cost
     * multipliers + engine 5,000 x engine tons x the engine's multiplier + armor points x BAR cost) x the Structural
     * Tech Rating multiplier (none for a Large Airship or Satellite), plus heat sinks, power amplifiers, bays,
     * equipment and fire control, all x (1 + tonnage / 50 Fixed-Wing, 10,000 Airship, 75 Satellite) x 1.25 for an
     * OmniVehicle.
     */
    private _calcSupportCost(support: IFighterSupportExport): void {
        const rows: [string, number][] = [];
        const mods = this.getSupportChassisModifications();
        const modMultiplier = mods.reduce((product, tag) => product * (getSupportVehicleChassisModification(tag)?.costMultiplier ?? 1), 1);
        const chassis = SUPPORT_VEHICLE_CHASSIS_COST_PER_TON * this.getStructureWeight() * modMultiplier;
        const engine = this.getSupportEngine();
        const engineCost = SUPPORT_VEHICLE_ENGINE_COST_PER_TON * this.getEngineWeight() * (engine?.costMultiplier ?? 0);
        const armorCost = this.getTotalArmorPoints() * (supportVehicleArmor.find((armor) => armor.bar === support.bar)?.costPerPoint ?? 0);
        const techMultiplier = this.isAdvancedSupportVehicle() ? 1 : SUPPORT_VEHICLE_COST_TECH_MULTIPLIER[support.structuralTechRating];
        rows.push([`Chassis (${SUPPORT_VEHICLE_CHASSIS_COST_PER_TON} x ${this.getStructureWeight()} t${modMultiplier !== 1 ? ` x ${modMultiplier.toFixed(3)}` : ""})`, chassis]);
        if (engine) rows.push([`${engine.name} Engine (${SUPPORT_VEHICLE_ENGINE_COST_PER_TON} x ${this.getEngineWeight()} t x ${engine.costMultiplier})`, engineCost]);
        if (armorCost > 0) rows.push([`Armor (${this.getTotalArmorPoints()} points of BAR ${support.bar})`, armorCost]);
        const structural = (chassis + engineCost + armorCost) * techMultiplier;
        rows.push([`Structural subtotal x ${techMultiplier} (Structural Tech Rating ${support.structuralTechRating.toUpperCase()})`, structural - chassis - engineCost - armorCost]);
        if (this._additionalHeatSinks > 0) rows.push([`Heat Sinks (${this._additionalHeatSinks})`, this._additionalHeatSinks * SUPPORT_VEHICLE_HEAT_SINK_COST]);
        if (this.getPowerAmplifierWeight() > 0) rows.push(["Power Amplifiers", this.getPowerAmplifierWeight() * SUPPORT_VEHICLE_POWER_AMPLIFIER_COST_PER_TON]);
        const bayCost = this._bays.reduce((sum, bay) => sum + getVehicleBayCost(bay), 0);
        if (bayCost > 0) rows.push(["Transport Bays and Doors", bayCost]);
        rows.push(["Weapons, Equipment and Ammunition", this._equipmentList.reduce((sum, item) => sum + (item.isAmmo ? (item.cbills || 0) * (item.weight || 0) : item.cbills || 0), 0)]);
        const fireControl = SUPPORT_VEHICLE_FIRE_CONTROL[support.fireControl];
        if (fireControl.costFactor > 0) {
            const weaponCost = this._equipmentList.filter((item) => this._isWeapon(item)).reduce((sum, item) => sum + (item.cbills || 0), 0);
            rows.push([`${fireControl.name} (${fireControl.costFactor * 100}% of weapons)`, weaponCost * fireControl.costFactor]);
        }
        const divisor = SUPPORT_VEHICLE_COST_TONNAGE_DIVISOR[support.motive];
        const subtotal = rows.reduce((sum, [, value]) => sum + value, 0);
        const multiplier = 1 + this._tonnage / divisor;
        const omni = this._omni ? 1.25 : 1;
        this._cost = Math.round(subtotal * multiplier * omni);
        const money = (value: number) => (Math.round(value * 100) / 100).toLocaleString("en-US");
        this._calcLogCost = rows.map(([name, value]) => `${escapeLogText(name)}: ${money(value)}`).join("<br />")
            + `<br />Subtotal ${money(subtotal)} x ${multiplier.toFixed(4)} (1 + ${this._tonnage} / ${divisor})${this._omni ? " x 1.25 (OmniVehicle)" : ""}`
            + ` = <strong>${money(this._cost)}</strong>`;
    }

    /** The lowest rules level that allows everything on the design. */
    public getRequiredRulesLevel(): number {
        let level = this._vstol && !this.isConventional() ? AEROSPACE_VSTOL_RULES_LEVEL : 0;
        // Large Airships and Satellites are Advanced (TO:AUE).
        if (this.isAdvancedSupportVehicle()) level = Math.max(level, 3);
        // Patchwork Armor is an "advanced construction option" (TO:AUE p.189).
        if (this.isPatchworkArmor()) level = Math.max(level, PATCHWORK_ARMOR_RULES_LEVEL);
        if (this._roboticControl !== "none") level = Math.max(level, SRCS_RULES_LEVEL);
        for (const item of this._equipmentList) level = Math.max(level, getEquipmentRulesLevel(item));
        for (const store of this._externalStores) {
            const record = this._storeRecord(store.tag);
            if (record) level = Math.max(level, getEquipmentRulesLevel(record));
        }
        // Fractional Accounting is "experimental-level unit design" (TO:AUE p.188).
        if (this.usesFractionalAccounting()) level = Math.max(level, EXPERIMENTAL_RULES_LEVEL);
        return level;
    }

    // Alpha Strike --------------------------------------------------------------------------------------------
    // Conversion from the Alpha Strike Companion (pp.92-100, 115-116, 121), with the Point Value as MegaMek's
    // aerospace converter works it out; checked against Master Unit List cards in fighter-alpha-strike.test.ts.
    // Weapon damage comes from each catalog record's alphaStrike values.

    /** Fighters under 50 tons are Size 1, 50 to 74 tons Size 2, 75 tons and over Size 3 (ASC p.92). */
    public getAlphaStrikeSize(): number {
        // Support Vehicles by type and weight: Small 1, Medium 2, Large 3; Large Airships 3 to 5 (ASC p.92).
        const weightClass = this.getSupportWeightClass();
        if (weightClass) {
            if (weightClass.size === "small") return 1;
            if (weightClass.size === "medium") return 2;
            if (this._support?.motive === "airship") return this._tonnage > 900 ? 5 : this._tonnage > 600 ? 4 : 3;
            return 3;
        }
        return this._tonnage >= 75 ? 3 : this._tonnage >= 50 ? 2 : 1;
    }

    private static _roundUpToTenth(value: number): number {
        return Math.ceil(Math.round(value * 1000) / 100) / 10;
    }

    /** Rounded up to the tenth; under 0.5 is minimal damage (0*), otherwise rounded up. */
    private static _asDamage(raw: number): IFighterASDamageValue {
        const tenth = AerospaceFighter._roundUpToTenth(raw);
        if (tenth <= 0) return { damage: 0, minimal: false };
        if (tenth < 0.5) return { damage: 0, minimal: true };
        return { damage: Math.ceil(tenth), minimal: false };
    }

    /** Fewer than 10 shots for each weapon of a kind x 0.75; no ammunition at all x 0. */
    private _asAmmoMultiplier(weapon: IEquipmentItem): number {
        const usesAmmo = !!weapon.ammoTypes?.length || (weapon.shotsPerTon ?? 0) > 0;
        if (!usesAmmo || weapon.isOneShot) return 1;
        const sameWeapons = this._equipmentList.filter((item) => !item.isAmmo && item.tag === weapon.tag).length;
        const shots = this._equipmentList
            .filter((item) => item.isAmmo && getCompatibleAmmo(weapon, item))
            .reduce((sum, ammo) => sum + getWeaponShotsPerTon(weapon, ammo) * (ammo.weight || 0), 0);
        if (shots <= 0) return 0;
        return shots / sameWeapons >= 10 ? 1 : 0.75;
    }

    private _asWeaponDamage(weapon: IEquipmentItem): number[] {
        const as = weapon.alphaStrike;
        if (!as) return [0, 0, 0, 0];
        const multiplier = this._asAmmoMultiplier(weapon) * (this.hasTargetingComputer() && as.tc ? 1.1 : 1);
        // On an aerospace unit a battle armor weapon's range is Short (Ghosts of Obeedah p.54).
        if (weapon.battleArmorScale) return [(as.rangeShort || 0) * multiplier, 0, 0, 0];
        return [as.rangeShort || 0, as.rangeMedium || 0, as.rangeLong || 0, as.rangeExtreme || 0].map((value) => value * multiplier);
    }

    private _asSum(weapons: IEquipmentItem[]): number[] {
        return weapons.reduce((sum, weapon) => {
            const damage = this._asWeaponDamage(weapon);
            return sum.map((value, index) => value + damage[index]);
        }, [0, 0, 0, 0]);
    }

    /** Heat a weapon adds to the maximum heat output: none for one-shot and rocket launchers (ASC p.115). */
    private static _asHeat(item: IEquipmentItem): number {
        if (item.isOneShot || /rocket-launcher/.test(item.tag)) return 0;
        return item.heatAero ?? item.heat ?? 0;
    }

    /**
     * Point Defense weapons, as marked in the Alpha Strike Companion's weapon conversion tables (pp.104-109):
     * machine guns, small-class lasers (not the small pulse laser) and flamers. An anti-missile system counts
     * as 0.3 at Short range (ASC p.128).
     */
    private static _asPointDefense(item: IEquipmentItem): number {
        if (item.isAmmo) return 0;
        if (item.weaponType?.includes("AMS")) return 0.3;
        const name = item.name.toLowerCase();
        const listed = (/machine gun/.test(name) && !/array/.test(name))
            || /\b(er |heavy )?small (laser|x-pulse laser|chemical laser|re-engineered laser)\b/.test(name)
            || /\b(er )?micro (laser|pulse laser)\b/.test(name)
            || /^flamer\b|^vehicle flamer\b|^flamer \(vehicle\)/.test(name);
        return listed && !/small pulse/.test(name) ? item.alphaStrike?.rangeShort || 0 : 0;
    }

    /** Flak weapons in the same tables: LB-X autocannons, Hyper-Assault Gauss rifles and the Silver Bullet Gauss. */
    private static _asIsFlak(item: IEquipmentItem): boolean {
        return !item.isAmmo && /\blb[ -]?\d+-?x\b|hyper-assault|\bhag\b|silver bullet/.test(item.name.toLowerCase());
    }

    public getAlphaStrikeStats(): IFighterAlphaStrikeStats {
        let log = "";
        const weapons = this._equipmentList.filter((item) => !item.isAmmo && item.alphaStrike
            && ((item.alphaStrike.rangeShort || 0) + (item.alphaStrike.rangeMedium || 0) + (item.alphaStrike.rangeLong || 0) + (item.alphaStrike.rangeExtreme || 0)) > 0);
        // Nose and wing weapons make the standard attack; aft weapons earn REAR (ASC p.100).
        const front = weapons.filter((item) => item.location !== "aft");
        const rear = weapons.filter((item) => item.location === "aft");
        const base = this._asSum(front);
        const adjusted = [...base];
        let overheat = 0;
        log += `Base damage (nose and wings): ${base.map((raw) => raw.toFixed(2)).join("/")}<br />`;

        // Heat: a unit overheats when its heat output passes its dissipation by 4 or more; damage is then
        // base x dissipation / (heat - 4). Long and Extreme use the heat of the long-range weapons only (ASC
        // pp.115-116). Conventional fighters do not track heat.
        if (!this.isConventional()) {
            const dissipation = this.getHeatDissipation();
            const heat = front.reduce((sum, item) => sum + AerospaceFighter._asHeat(item), 0);
            const longHeat = front.filter((item) => (item.alphaStrike?.rangeLong || 0) > 0 || !(item.alphaStrike?.rangeShort || 0))
                .reduce((sum, item) => sum + AerospaceFighter._asHeat(item), 0);
            if (heat - dissipation >= 4) {
                adjusted[0] = base[0] * dissipation / (heat - 4);
                adjusted[1] = base[1] * dissipation / (heat - 4);
            }
            if (longHeat - dissipation >= 4) {
                adjusted[2] = base[2] * dissipation / (longHeat - 4);
                adjusted[3] = base[3] * dissipation / (longHeat - 4);
            }
            const column = base[1] > 0 ? 1 : 0;
            overheat = Math.min(4, Math.max(0, AerospaceFighter._asDamage(base[column]).damage - AerospaceFighter._asDamage(adjusted[column]).damage));
            log += `Heat ${heat} (long range ${longHeat}) against ${dissipation} dissipated: ${adjusted.map((raw) => raw.toFixed(2)).join("/")}, Overheat ${overheat}<br />`;
        }
        const [short, medium, long, extreme] = adjusted.map((raw) => AerospaceFighter._asDamage(raw));

        const size = this.getAlphaStrikeSize();
        const specials: string[] = this._support ? [] : [`BOMB${size}`];
        if (this._support) {
            // BAR under 10 (ASC p.95); fire control (AS p.170); engine specials as for vehicles; Large Airships are LG,
            // VLG or SLG on the ground map (ASC p.92); transport bays and communications equipment as MegaMek assigns them.
            if (this._support.bar < 10) specials.push("BAR");
            if (this._support.fireControl === "advanced") specials.push("AFC");
            if (this._support.fireControl === "basic") specials.push("BFC");
            if (this._support.engine === "ice" || this._support.engine === "steam") specials.push("EE");
            if (this._support.engine === "fuel-cell") specials.push("FC");
            if (this._support.motive === "airship" && size >= 3) specials.push(size >= 5 ? "SLG" : size === 4 ? "VLG" : "LG");
            specials.push(...getVehicleBayAlphaStrikeSpecials(this._bays, 0));
            const commsTons = this.getCommunicationsTons();
            if (commsTons > 0) specials.push(`MHQ${commsTons}`);
            if (commsTons > 0 && commsTons >= this._tonnage / 20) specials.push("RCN");
        } else if (this.isConventional()) {
            specials.push("ATMO");
            if (this._engineType.tag === "ice") specials.push("EE");
        } else {
            specials.push("SPC", `FUEL${Math.round(this.getFuelPoints() / 20)}`);
        }
        // The Master Unit List prints VSTOL on every fighter card, with or without the equipment.
        if (!this._support) specials.push("VSTOL");
        if (rear.length) {
            const vector = this._asSum(rear).slice(0, 3).map((raw) => {
                const tenth = AerospaceFighter._roundUpToTenth(raw);
                return tenth > 0 && tenth < 0.5 ? "0*" : Math.round(tenth) > 0 ? `${Math.round(tenth)}` : "-";
            });
            specials.push(`REAR${vector.join("/")}`);
        }
        // FLK: the Flak weapons' damage, rounded normally (ASC p.121). PNT: the Point Defense weapons' Short
        // damage, rounded up (ASC p.128).
        const flak = this._asSum(front.filter((item) => AerospaceFighter._asIsFlak(item))).slice(0, 3);
        if (flak.some((value) => value > 0)) {
            specials.push(`FLK${flak.map((raw) => {
                const tenth = AerospaceFighter._roundUpToTenth(raw);
                return tenth > 0 && tenth < 0.5 ? "0*" : Math.round(tenth) > 0 ? `${Math.round(tenth)}` : "-";
            }).join("/")}`);
        }
        const pointDefense = Math.ceil(AerospaceFighter._roundUpToTenth(this._equipmentList.reduce((sum, item) => sum + AerospaceFighter._asPointDefense(item), 0)) - 1e-9);
        if (pointDefense > 0) specials.push(`PNT${pointDefense}`);
        const usesAmmo = weapons.some((item) => !!item.ammoTypes?.length || (item.shotsPerTon ?? 0) > 0);
        if (weapons.length > 0 && !usesAmmo) specials.push("ENE");
        const equipmentSpecials = new Set<string>();
        for (const item of this._equipmentList) {
            if (item.isAmmo) continue;
            for (const code of item.alphaStrike?.specialAbility ?? []) {
                if (!code.includes("#")) equipmentSpecials.add(code);
            }
        }
        specials.push(...[...equipmentSpecials].filter((code) => !specials.includes(code)));
        specials.sort();

        // A Support Vehicle's armor under BAR 10 counts BAR / 10, rounded, before converting (ASC p.95); a Satellite's
        // Structure is 1 (ASC p.97).
        const armorFactor = this._support ? Math.round(this.getTotalArmorPoints() * Math.min(10, this._support.bar) / 10) : this.getTotalArmorPoints();
        const armor = Math.round(armorFactor / 30);
        const structure = this._support?.motive === "satellite" ? 1 : Math.ceil(this.getStructuralIntegrity() / 2);
        const threshold = Math.ceil(armor / 3);
        const move = this._safeThrust;
        const movementCode = this._support ? SUPPORT_AIRCRAFT_AS_MOVE[this._support.motive] : "a";
        log += `Size ${size}, Thrust ${move}${movementCode}, Armor ${armor} (${armorFactor} / 30), Structure ${structure} (SI ${this.getStructuralIntegrity()} / 2), Threshold ${threshold}<br />`;

        const pvDamage = (value: IFighterASDamageValue) => (value.minimal ? 0.5 : value.damage);
        let offensive = pvDamage(short) + 2 * pvDamage(medium) + pvDamage(long);
        if (overheat >= 1) offensive += (1 + 0.5 * (overheat - 1)) / (pvDamage(medium) + pvDamage(long) === 0 ? 2 : 1);
        offensive += size;
        log += `Offensive value: S + 2M + L + Overheat + BOMB ${size} = ${offensive}<br />`;
        let defensive = 4 + 0.25 * move + (move >= 10 ? 1 : move >= 7 ? 0.5 : 0);
        if (equipmentSpecials.has("AMS")) defensive += 1;
        defensive += pointDefense;
        const armorMultiplier = Math.min(1.3 + 0.1 * threshold, 1.9);
        const dir = 0.5 * Math.round((armor * armorMultiplier + structure) * 1.2 * 2);
        defensive += dir;
        log += `Defensive value: 4 + ${move} / 4${move >= 10 ? " + 1" : move >= 7 ? " + 0.5" : ""}${pointDefense ? ` + PNT ${pointDefense}` : ""} + (Armor ${armor} x ${armorMultiplier.toFixed(1)} + Structure ${structure}) x 1.2 = ${defensive}<br />`;
        let subtotal = offensive + defensive;
        const forceBonus: Record<string, number> = { AECM: 3, BH: 2, C3RS: 2, ECM: 2, RCN: 2, TRN: 2, LPRB: 1, PRB: 1, LECM: 0.5 };
        for (const code of equipmentSpecials) subtotal += forceBonus[code] ?? 0;
        const pointValue = Math.max(1, Math.round(subtotal));
        log += `Point Value ${pointValue} (provisional)<br />`;

        return {
            type: this._support ? "SV" : this.isConventional() ? "CF" : "AF",
            movementCode,
            size, movement: move, damageValues: { short, medium, long, extreme },
            armor, structure, threshold, overheat, pointValue, specialAbilities: specials, calcLog: log,
        };
    }

    /** The converted Alpha Strike card, built the same way as a Master Unit List record. */
    public getAlphaStrikeUnit(): AlphaStrikeUnit {
        const stats = this.getAlphaStrikeStats();
        const damage = stats.damageValues;
        const record = {
            Id: 0,
            Name: `${this._name} ${this._model}`.trim() || this.getFighterTypeName(),
            Class: this._name,
            Variant: this._model,
            Tonnage: this._tonnage,
            Cost: this.getCBillCost(),
            BattleValue: this.getBattleValue(),
            BFType: stats.type,
            BFSize: stats.size,
            BFMove: `${stats.movement}${stats.movementCode}`,
            BFTMM: 0,
            BFArmor: stats.armor,
            BFStructure: stats.structure,
            BFThreshold: stats.threshold,
            BFDamageShort: damage.short.damage,
            BFDamageMedium: damage.medium.damage,
            BFDamageLong: damage.long.damage,
            BFDamageExtreme: damage.extreme.damage,
            BFDamageShortMin: damage.short.minimal,
            BFDamageMediumMin: damage.medium.minimal,
            BFDamageLongMin: damage.long.minimal,
            BFDamageExtremeMin: damage.extreme.minimal,
            BFOverheat: stats.overheat,
            BFPointValue: stats.pointValue,
            BFAbilities: stats.specialAbilities.join(","),
            Role: { Id: 0, Name: "None", Image: null, SortOrder: 0 },
            Technology: { Id: 0, Name: this._tech.name, Image: null, SortOrder: 0 },
            Type: { Id: 17, Name: "Fighter Craft", Image: null, SortOrder: 0 },
        } as unknown as IASMULUnit;
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        unit.rulesLevel = Math.max(2, this.getRequiredRulesLevel());
        return unit;
    }

    // Roster and play ------------------------------------------------------------------------------------------
    // Damage, Damage Thresholds and critical hits (Total Warfare pp.237-240).

    public getPilot(): Pilot { return this._pilot; }

    public setPilot(pilot: Pilot): Pilot {
        this._pilot = pilot;
        return this._pilot;
    }

    /** Battle Value adjusted for gunnery and piloting skill (TM p.315 skill multipliers, as for 'Mechs). */
    public getPilotAdjustedBattleValue(edition?: string): number {
        // A drone fights at its control system's Skills (IO:AE p.187).
        const skills = this.getRoboticSkills();
        const multiplier = getSkillMultiplier(skills?.gunnery ?? this._pilot?.gunnery ?? 4, skills?.piloting ?? this._pilot?.piloting ?? 5, "fighter", edition) ?? 1;
        return Math.round(this._battleValue * multiplier);
    }

    public getInPlay(): IFighterInPlay { return this._inPlay; }
    public resetInPlay(): void { this._inPlay = newFighterInPlay(); }
    /** A new turn: nothing is marked as fired yet. Heat stays until the Heat Phase works it off. */
    public turnReset(): void { this._inPlay.firedWeapons = []; }

    // Heat in play (TW p.161): an aerospace fighter builds heat from weapons fire and engine hits only.

    /** Conventional fighters work on a zero-heat principle and have no Heat Scale (TM p.193). */
    /** Conventional fighters and Support Vehicles track no heat (TW p.161; TM p.141). */
    public tracksHeat(): boolean { return !this.isConventional() && !this._support; }

    public isWeaponFired(uuid: string): boolean { return this._inPlay.firedWeapons.includes(uuid); }

    public setWeaponFired(uuid: string, fired: boolean): void {
        this._inPlay.firedWeapons = this._inPlay.firedWeapons.filter((entry) => entry !== uuid);
        const item = this._equipmentList.find((entry) => entry.uuid === uuid);
        if (fired && item && !item.isAmmo && !this.isWeaponDestroyed(uuid)) this._inPlay.firedWeapons.push(uuid);
    }

    /** Heat this turn will add: the weapons marked as fired, and 2 for each engine hit (TW p.240). */
    public getHeatGeneratedThisTurn(): number {
        const weapons = this._equipmentList.filter((item) => this.isWeaponFired(item.uuid ?? ""))
            .reduce((sum, item) => sum + (item.heatAero ?? item.heat ?? 0), 0);
        return weapons + this._inPlay.engine * 2;
    }

    public setHeat(heat: number): void {
        this._inPlay.heat = Math.min(200, Math.max(0, Number.isFinite(heat) ? Math.floor(heat) : 0));
    }

    /**
     * The Heat Phase: add this turn's heat, take off what the working heat sinks dissipate, and list the Avoid
     * Rolls the new heat level calls for (TW p.161). The weapons are cleared for the next turn.
     */
    public applyHeatPhase(): string[] {
        if (!this.tracksHeat()) return ["Conventional fighters do not track heat"];
        const generated = this.getHeatGeneratedThisTurn();
        const dissipated = this.getCurrentHeatDissipation();
        const before = this._inPlay.heat;
        this.setHeat(before + generated - dissipated);
        this._inPlay.firedWeapons = [];
        const heat = this._inPlay.heat;
        const log = [`Heat Phase: ${before} + ${generated} generated - ${dissipated} dissipated = ${heat}`];
        for (const trigger of FIGHTER_HEAT_TRIGGERS) {
            const reached = trigger.levels.filter((level) => heat >= level);
            if (reached.length) log.push(`${trigger.name}: Avoid Roll for heat ${reached[reached.length - 1]}+ (number on the record sheet's Heat Scale)`);
        }
        return log;
    }

    // Weapon critical hits that need a player's choice (TW p.240).

    public getPendingWeaponCritical(): (IFighterPendingWeaponCritical & { weapons: IEquipmentItem[] }) | null {
        const pending = this._inPlay.pendingWeaponCriticals[0];
        return pending ? { ...pending, weapons: this._workingWeapons(pending.arc) } : null;
    }

    private _workingWeapons(arc: FighterArc): IEquipmentItem[] {
        return this._equipmentList.filter((item) => item.location === arc && !item.isAmmo && this.getItemSlots(item) > 0 && !this.isWeaponDestroyed(item.uuid ?? ""));
    }

    /** Destroys the chosen weapon for the waiting critical hit. False when it is not a working weapon in that arc. */
    public resolvePendingWeaponCritical(uuid: string): boolean {
        const pending = this.getPendingWeaponCritical();
        if (!pending || !pending.weapons.some((item) => item.uuid === uuid)) return false;
        this.setWeaponDestroyed(uuid, true);
        this._inPlay.pendingWeaponCriticals.shift();
        return true;
    }

    public skipPendingWeaponCritical(): void { this._inPlay.pendingWeaponCriticals.shift(); }

    public getCurrentArmor(): number {
        return FIGHTER_ARCS.reduce((sum, arc) => sum + Math.max(0, this._armorAllocation[arc.tag] - this._inPlay.armorDamage[arc.tag]), 0);
    }

    public getArmorPercentage(): number {
        const total = this.getTotalArmorPoints();
        return total > 0 ? Math.round(this.getCurrentArmor() / total * 100) : 0;
    }

    public getCurrentStructure(): number { return Math.max(0, this.getStructuralIntegrity() - this._inPlay.structureDamage); }

    public getStructurePercentage(): number {
        return Math.round(this.getCurrentStructure() / Math.max(1, this.getStructuralIntegrity()) * 100);
    }

    /** Marks armor damage on a facing directly (a pip clicked on the diagram). */
    public setArmorDamage(arc: FighterArc, points: number): void {
        const value = Number.isFinite(points) ? Math.floor(points) : 0;
        this._inPlay.armorDamage[arc] = Math.min(this._armorAllocation[arc], Math.max(0, value));
    }

    public setStructureDamage(points: number): void {
        const value = Number.isFinite(points) ? Math.floor(points) : 0;
        this._inPlay.structureDamage = Math.min(this.getStructuralIntegrity(), Math.max(0, value));
    }

    /** Sets the boxes crossed off on a critical track. */
    public setCriticalHits(track: "avionics" | "engine" | "fcs" | "sensors" | "pilotHits", hits: number): void {
        const boxes = FIGHTER_CRITICAL_TRACKS.find((entry) => entry.tag === track)?.boxes ?? 3;
        this._inPlay[track] = Math.min(boxes, Math.max(0, Number.isFinite(hits) ? Math.floor(hits) : 0));
    }

    public setGearDamaged(damaged: boolean): void { this._inPlay.gear = damaged === true; }

    public setHeatSinksLost(count: number): void {
        this._inPlay.heatSinks = Math.min(this.getTotalHeatSinks(), Math.max(0, Number.isFinite(count) ? Math.floor(count) : 0));
    }

    public setStoresDropped(dropped: boolean): void { this._inPlay.storesDropped = dropped === true; }

    public isWeaponDestroyed(uuid: string): boolean { return this._inPlay.destroyedWeapons.includes(uuid); }

    public setWeaponDestroyed(uuid: string, destroyed: boolean): void {
        this._inPlay.destroyedWeapons = this._inPlay.destroyedWeapons.filter((entry) => entry !== uuid);
        if (destroyed && this._equipmentList.some((item) => item.uuid === uuid)) {
            this._inPlay.destroyedWeapons.push(uuid);
            this._inPlay.firedWeapons = this._inPlay.firedWeapons.filter((entry) => entry !== uuid);
        }
    }

    /** Three engine hits destroy the engine and shut the fighter down (TW p.240). */
    public isEngineDestroyed(): boolean { return this._inPlay.engine >= 3; }

    /** Out of the fight: no Structural Integrity left, a fuel explosion or a sixth pilot hit. */
    public isDestroyed(): boolean {
        return this.getCurrentStructure() <= 0 || this._inPlay.fuelExploded || this._inPlay.pilotHits >= 6;
    }

    public isDamaged(): boolean {
        const play = this._inPlay;
        return this.getCurrentArmor() < this.getTotalArmorPoints() || play.structureDamage > 0 || play.avionics > 0 || play.engine > 0
            || play.fcs > 0 || play.sensors > 0 || play.gear || play.heatSinks > 0 || play.pilotHits > 0 || play.fuelExploded
            || play.destroyedWeapons.length > 0 || play.heat > 0;
    }

    /** Safe Thrust now: less the external stores still carried and 2 per engine hit (TW pp.240, 247). */
    public getCurrentSafeThrust(): number {
        if (this.isEngineDestroyed()) return 0;
        const stores = this._inPlay.storesDropped ? 0 : Math.ceil(Math.max(0, this.getExternalStoresHardpointsUsed() - this._inPlay.bombsLost) / 5);
        return Math.max(0, this._safeThrust - stores - this._inPlay.engine * 2);
    }

    public getCurrentMaxThrust(): number { return Math.ceil(this.getCurrentSafeThrust() * 1.5); }

    /** Heat sinking left after Heat Sink critical hits: each costs one sink (TW p.240). */
    public getCurrentHeatDissipation(): number {
        return Math.max(0, this.getTotalHeatSinks() - this._inPlay.heatSinks) * (this._heatSinkType.dissipation ?? 1);
    }

    /**
     * To-hit modifier from damage: +2 per FCS hit, +1 per sensor hit (+5 once the sensors are destroyed) and +1
     * per pilot hit (TW pp.237, 240). Null when a third FCS hit stops all weapon attacks.
     */
    public getDamageToHitModifier(): number | null {
        const play = this._inPlay;
        if (play.fcs >= 3) return null;
        // A Support Vehicle adds its fire control's to-hit modifier (TW p.206).
        return play.fcs * 2 + (play.sensors >= 3 ? 5 : play.sensors) + play.pilotHits + this.getFireControlToHitModifier();
    }

    /** Control Roll modifier from avionics damage: +1, +2, then +5 when destroyed (TW p.239). */
    public getControlRollModifier(): number {
        return this._inPlay.avionics >= 3 ? 5 : this._inPlay.avionics;
    }

    private _applyCritical(critical: FighterCritical, arc: FighterArc, random: () => number, fuelRoll?: number): string {
        const play = this._inPlay;
        const d6 = () => Math.floor(random() * 6) + 1;
        const arcName = FIGHTER_ARCS.find((entry) => entry.tag === arc)?.name ?? arc;
        switch (critical) {
            case "avionics":
                play.avionics = Math.min(3, play.avionics + 1);
                return `Avionics hit ${play.avionics}: Control Rolls at +${this.getControlRollModifier()}; make a Control Roll now`;
            case "control":
                return "Control hit: make a Control Roll, or go out of control";
            case "crew":
                play.pilotHits = Math.min(6, play.pilotHits + 1);
                return play.pilotHits >= 6 ? "Pilot hit 6: the pilot is killed" : `Pilot hit ${play.pilotHits}: make a Consciousness Roll`;
            case "engine":
                play.engine = Math.min(3, play.engine + 1);
                return play.engine >= 3 ? "Engine hit 3: the engine is destroyed and the fighter shuts down"
                    : `Engine hit ${play.engine}: Safe Thrust -2 (now ${this.getCurrentSafeThrust()}/${this.getCurrentMaxThrust()}) and +2 heat each turn`;
            case "fcs":
                play.fcs = Math.min(3, play.fcs + 1);
                return play.fcs >= 3 ? "FCS hit 3: the fire control system is destroyed; no weapon attacks" : `FCS hit ${play.fcs}: +2 to hit for each`;
            case "sensors":
                play.sensors = Math.min(3, play.sensors + 1);
                return play.sensors >= 3 ? "Sensor hit 3: the sensors are destroyed; +5 to hit" : `Sensor hit ${play.sensors}: +1 to hit for each`;
            case "gear":
                play.gear = true;
                return "Landing gear damaged: +5 to Control Rolls when landing";
            case "heatSink":
                if (play.heatSinks >= this.getTotalHeatSinks()) return "Heat sink hit: no heat sinks left to lose";
                play.heatSinks += 1;
                return `Heat sink destroyed: ${this.getCurrentHeatDissipation()} heat dissipated now`;
            case "fuel": {
                const roll = fuelRoll ?? d6() + d6();
                if (roll >= 10) {
                    play.fuelExploded = true;
                    return `Fuel tank hit, roll ${roll}: the fuel explodes and the fighter is destroyed`;
                }
                return `Fuel tank hit, roll ${roll}: no explosion (10+ explodes)`;
            }
            case "bomb": {
                const carried = play.storesDropped ? 0 : this.getExternalStoresHardpointsUsed() - play.bombsLost;
                if (carried <= 0) return "Bomb hit: no bombs carried, no effect";
                play.bombsLost += 1;
                return "Bomb hit: one bomb is useless (the controlling player chooses which)";
            }
            default: {
                // Weapons already waiting on an earlier choice in this arc are spoken for.
                const working = this._workingWeapons(arc);
                const waiting = play.pendingWeaponCriticals.filter((pending) => pending.arc === arc).length;
                if (working.length - waiting <= 0) return `Weapon hit in the ${arcName}: no working weapon there, no effect`;
                if (working.length === 1) {
                    this.setWeaponDestroyed(working[0].uuid ?? "", true);
                    return `Weapon hit in the ${arcName}: ${working[0].name} is destroyed`;
                }
                const chooser = d6();
                play.pendingWeaponCriticals.push({ arc, chooser: chooser <= 3 ? "controlling" : "attacking" });
                return `Weapon hit in the ${arcName}, roll ${chooser}: the ${chooser <= 3 ? "controlling" : "attacking"} player chooses a weapon there to mark destroyed`;
            }
        }
    }

    /**
     * Resolves one hit (one Attack Value grouping): hit location by attack direction and 2D6, armor damage, half
     * of any excess (rounded down) against Structural Integrity, then a critical hit check (8+ on 2D6) for each
     * of: damage over the facing's Damage Threshold, any Structural Integrity damage, and a natural 12 on the
     * to-hit roll (TW pp.237-239). Pass criticalRolls, wingRoll and fuelRoll to use physical dice.
     */
    public resolveAttack(roll: number, direction: FighterAttackDirection, damage: number,
        options: { natural12?: boolean; wingRoll?: number; criticalRolls?: number[]; fuelRoll?: number } = {}, random: () => number = Math.random): string[] {
        const d6 = () => Math.floor(random() * 6) + 1;
        const log: string[] = [];
        const points = Math.max(0, Math.floor(Number.isFinite(damage) ? damage : 0));
        const hit = this._supportUsesDropShipTable()
            ? this._airshipHitLocation(roll, direction, options.wingRoll ?? d6(), random, log)
            : getFighterHitLocation(roll, direction, options.wingRoll ?? d6());
        const arcName = FIGHTER_ARCS.find((entry) => entry.tag === hit.arc)?.name ?? hit.arc;
        const remaining = Math.max(0, this._armorAllocation[hit.arc] - this._inPlay.armorDamage[hit.arc]);
        const armorDamage = Math.min(remaining, points);
        this._inPlay.armorDamage[hit.arc] += armorDamage;
        const structureDamage = Math.min(this.getCurrentStructure(), Math.floor((points - armorDamage) / 2));
        this._inPlay.structureDamage += structureDamage;
        log.push(`Hit location ${roll}: ${arcName} / ${FIGHTER_CRITICAL_NAMES[hit.critical]} takes ${armorDamage} armor`
            + (points > armorDamage ? ` and ${structureDamage} Structural Integrity (half of the ${points - armorDamage} left over, rounded down)` : ""));
        if (this.getCurrentStructure() <= 0) {
            log.push("Structural Integrity is gone: the fighter is destroyed");
            return log;
        }
        const reasons: string[] = [];
        const threshold = this.getDamageThresholds()[hit.arc];
        if (points > threshold) reasons.push(`damage ${points} over the Damage Threshold of ${threshold}`);
        if (structureDamage >= 1) reasons.push("Structural Integrity damage");
        if (options.natural12) reasons.push("a natural 12 to hit");
        // A Support Vehicle hit harder than its BAR may take a penetrating critical hit (TW p.206).
        if (this._support && this._support.bar < 10 && points > this._support.bar) reasons.push(`damage ${points} over BAR ${this._support.bar} (penetrating)`);
        reasons.forEach((reason, index) => {
            const check = options.criticalRolls?.[index] ?? d6() + d6();
            if (check >= 8) log.push(`Critical check for ${reason}: ${check}. ${this._applyCritical(hit.critical, hit.arc, random, options.fuelRoll)}`);
            else log.push(`Critical check for ${reason}: ${check}, no critical hit (8+ needed)`);
        });
        return log;
    }

    /** Airships (and Satellites) use the aerodyne DropShip hit locations (TW p.206); Fixed-Wings the fighter table. */
    private _supportUsesDropShipTable(): boolean {
        return !!this._support && this._support.motive !== "fixed-wing";
    }

    /**
     * An Airship's hit on the DropShips/Small Craft column of the Aerospace Units Hit Location Table (TW p.237): the
     * side facings are its wings. Critical hits to the K-F boom, docking collar or gear are re-rolled until one applies
     * (TW p.206); the others are mapped to the fighter's tracks, or described where the fighter has none.
     */
    private _airshipHitLocation(roll: number, direction: FighterAttackDirection, sideRoll: number, random: () => number, log: string[]): { arc: FighterArc; critical: FighterCritical } {
        const smallCraftDirection = direction === "left" || direction === "right" || direction === "nose" || direction === "aft" ? direction : "above";
        const hit = getSmallCraftHitLocation(roll, smallCraftDirection, sideRoll);
        const arc: FighterArc = hit.facing === "left" ? "leftWing" : hit.facing === "right" ? "rightWing" : hit.facing;
        let critical: SmallCraftCritical = hit.critical;
        for (let tries = 0; tries < 20 && ["kfBoom", "dockingCollar", "gear"].includes(critical); tries++) {
            const reroll = Math.floor(random() * 6) + Math.floor(random() * 6) + 2;
            log.push(`${SMALL_CRAFT_CRITICAL_NAMES[critical]} critical does not apply to an Airship: re-rolled ${reroll} (TW p.206)`);
            critical = getSmallCraftHitLocation(reroll, smallCraftDirection, sideRoll).critical;
        }
        const mapped: Partial<Record<SmallCraftCritical, FighterCritical>> = {
            crew: "crew", avionics: "avionics", weapon: "weapon", fcs: "fcs", control: "control", sensors: "sensors", engine: "engine", fuel: "fuel",
        };
        if (!mapped[critical]) log.push(`Critical location ${SMALL_CRAFT_CRITICAL_NAMES[critical]}: apply it from the DropShip rules (TW p.240); it is not tracked here`);
        return { arc, critical: mapped[critical] ?? "control" };
    }

    // Saving --------------------------------------------------------------------------------------------------

    public export(noInPlayVariables: boolean = false): IAerospaceFighterExport {
        return {
            ...(noInPlayVariables ? {} : {
                pilot: this._pilot.export(),
                inPlay: {
                    ...this._inPlay, armorDamage: { ...this._inPlay.armorDamage }, destroyedWeapons: [...this._inPlay.destroyedWeapons],
                    firedWeapons: [...this._inPlay.firedWeapons], pendingWeaponCriticals: this._inPlay.pendingWeaponCriticals.map((entry) => ({ ...entry })),
                },
            }),
            uuid: this._uuid,
            lastUpdated: this.lastUpdated,
            name: this._name,
            ...(this._rulesEdition !== DEFAULT_RULES_EDITION ? { rulesEdition: this._rulesEdition } : {}),
            model: this._model,
            fighterType: this._fighterType,
            vstol: this._vstol,
            roboticControl: this._roboticControl !== "none" ? this._roboticControl : undefined,
            omni: this._omni,
            externalStores: this._externalStores.map((store) => ({ ...store })),
            ...(this.usesFractionalAccounting() ? { weightAccounting: "fractional" as const } : {}),
            tonnage: this._tonnage,
            tech: this._tech.tag,
            era: this._era.tag,
            engineType: this._engineType.tag,
            safeThrust: this._safeThrust,
            fuelTons: this._fuelTons,
            armorType: this._armorType.tag,
            armorAllocation: { ...this._armorAllocation },
            patchworkArmor: this.isPatchworkArmor()
                ? Object.fromEntries(FIGHTER_ARCS.map((arc) => [arc.tag, this.getPatchworkArmorType(arc.tag).tag]))
                : undefined,
            heatSinkType: this._heatSinkType.tag,
            additionalHeatSinks: this._additionalHeatSinks,
            supportVehicle: this.getSupportVehicleSettings() ?? undefined,
            bays: this._bays.length > 0 ? this._bays.map((bay) => ({ ...bay })) : undefined,
            equipment: this._equipmentList.map((item) => ({
                tag: item.tag, location: item.location, uuid: item.uuid, ...(this.isPodMounted(item.uuid ?? "") ? { pod: true } : {}),
                ...(this.canSetAmmoBinShots(item) && (item.weight || 0) < 1 ? { shots: this.getAmmoBinShots(item) } : {}),
            })),
        };
    }

    public exportJSON(): string {
        return JSON.stringify(this.export());
    }

    /** The pilot and in-play damage of a saved fighter, field by field through the setters. */
    private _importPlay(pilot: unknown, inPlay: unknown): void {
        this._pilot = new Pilot();
        if (isPlainObject(pilot)) {
            this._pilot.name = savedString(pilot.name).slice(0, 200);
            this._pilot.piloting = Math.floor(savedNumber(pilot.piloting, 5, 0, 8));
            this._pilot.gunnery = Math.floor(savedNumber(pilot.gunnery, 4, 0, 8));
            this._pilot.wounds = Math.floor(savedNumber(pilot.wounds, 0, 0, 6));
        }
        this._inPlay = newFighterInPlay();
        if (!isPlainObject(inPlay)) return;
        const armor = isPlainObject(inPlay.armorDamage) ? inPlay.armorDamage : {};
        for (const arc of FIGHTER_ARCS) this.setArmorDamage(arc.tag, savedNumber(armor[arc.tag], 0, 0, 10000));
        this.setStructureDamage(savedNumber(inPlay.structureDamage, 0, 0, 1000));
        for (const track of FIGHTER_CRITICAL_TRACKS) this.setCriticalHits(track.tag, savedNumber(inPlay[track.tag], 0, 0, 6));
        this.setGearDamaged(inPlay.gear === true);
        this.setHeatSinksLost(savedNumber(inPlay.heatSinks, 0, 0, 1000));
        this._inPlay.bombsLost = Math.floor(savedNumber(inPlay.bombsLost, 0, 0, 100));
        this._inPlay.fuelExploded = inPlay.fuelExploded === true;
        this._inPlay.storesDropped = inPlay.storesDropped === true;
        const destroyed = Array.isArray(inPlay.destroyedWeapons) ? inPlay.destroyedWeapons.slice(0, MAX_FIGHTER_EQUIPMENT) : [];
        for (const uuid of destroyed) if (typeof uuid === "string") this.setWeaponDestroyed(uuid, true);
        if (this.tracksHeat()) this.setHeat(savedNumber(inPlay.heat, 0, 0, 200));
        const fired = Array.isArray(inPlay.firedWeapons) ? inPlay.firedWeapons.slice(0, MAX_FIGHTER_EQUIPMENT) : [];
        for (const uuid of fired) if (typeof uuid === "string") this.setWeaponFired(uuid, true);
        const pending = Array.isArray(inPlay.pendingWeaponCriticals) ? inPlay.pendingWeaponCriticals.slice(0, 20) : [];
        for (const entry of pending) {
            if (!isPlainObject(entry)) continue;
            const arc = FIGHTER_ARCS.find((candidate) => candidate.tag === entry.arc);
            if (arc) this._inPlay.pendingWeaponCriticals.push({ arc: arc.tag, chooser: entry.chooser === "attacking" ? "attacking" : "controlling" });
        }
    }

    /** Problems found in the last import: fields that were invalid and replaced, or entries that were dropped. */
    public getImportIssues(): string[] { return this._importIssues; }

    /** Reads saved Support Vehicle settings: every field allowlisted or clamped, anything invalid replaced and reported. */
    private _importSupport(saved: unknown, issue: (text: string) => void): IFighterSupportExport {
        const record = isPlainObject(saved) ? saved : {};
        if (!isPlainObject(saved)) issue("Read Support Vehicle settings that were missing as a Fixed-Wing");
        const motive = SUPPORT_AIRCRAFT_MOTIVES.find((entry) => entry.tag === record.motive)?.tag ?? "fixed-wing";
        const defaults = newFighterSupport(motive);
        const rating = (key: "structuralTechRating" | "engineTechRating" | "armorTechRating"): SupportVehicleTechRating => {
            const value = record[key];
            if (typeof value === "string" && SUPPORT_VEHICLE_TECH_RATINGS.includes(value as SupportVehicleTechRating)) return value as SupportVehicleTechRating;
            if (value !== undefined) issue(`Replaced an unknown ${key} with ${defaults[key].toUpperCase()}`);
            return defaults[key];
        };
        const engine = SUPPORT_VEHICLE_ENGINES.find((option) => option.tag === record.engine && !option.incompatible.includes(motive))?.tag;
        if (record.engine !== undefined && !engine) issue(`Replaced an unknown Support Vehicle engine with ${defaults.engine}`);
        const mods = Array.isArray(record.chassisModifications) ? record.chassisModifications.filter((tag): tag is string => typeof tag === "string") : [];
        const known = mods.filter((tag) => !!getSupportVehicleChassisModification(tag) && tag !== "omni");
        if (known.length < mods.length) issue("Dropped unknown chassis modifications");
        const bar = supportVehicleArmor.some((armor) => armor.bar === record.bar) ? record.bar as number : defaults.bar;
        if (record.bar !== undefined && bar !== record.bar) issue(`Replaced an unknown BAR with ${defaults.bar}`);
        const fireControl = typeof record.fireControl === "string" && Object.prototype.hasOwnProperty.call(SUPPORT_VEHICLE_FIRE_CONTROL, record.fireControl)
            ? record.fireControl as SupportVehicleFireControl : defaults.fireControl;
        return {
            motive,
            structuralTechRating: rating("structuralTechRating"),
            engine: engine ?? defaults.engine,
            engineTechRating: rating("engineTechRating"),
            chassisModifications: [...new Set(known)].slice(0, SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS.length),
            bar,
            armorTechRating: rating("armorTechRating"),
            fireControl,
            extraCrew: Math.floor(savedNumber(record.extraCrew, 0, 0, 1000)) || undefined,
            unmanned: motive === "satellite" && record.unmanned === true ? true : undefined,
        };
    }

    /**
     * Loads a saved fighter. Saves can come from other people's backup files, so every field is type-checked,
     * allowlisted or clamped through the setters, and anything dropped is recorded in getImportIssues().
     * Never spread or Object.assign the parsed JSON into class state.
     */
    public importJSON(json: string): void {
        this._importIssues = [];
        const issue = (text: string) => { if (this._importIssues.length < 50) this._importIssues.push(text); };
        try {
            const parsed: unknown = JSON.parse(json);
            if (!isPlainObject(parsed)) {
                issue("The saved fighter is not an object");
                return;
            }
            const saved = parsed as Partial<Record<keyof IAerospaceFighterExport, unknown>>;
            this._uuid = savedString(saved.uuid).slice(0, 100) || generateUUID();
            const updated = typeof saved.lastUpdated === "string" || typeof saved.lastUpdated === "number" ? new Date(saved.lastUpdated) : new Date();
            this.lastUpdated = Number.isNaN(updated.getTime()) ? new Date() : updated;
            for (const key of ["name", "model"] as const) {
                if (saved[key] !== undefined && typeof saved[key] !== "string") issue(`Ignored a ${key} that is not text`);
            }
            this.setName(savedString(saved.name));
            this._rulesEdition = getSelectableRulesEditionTag(saved.rulesEdition, "fighter");
            this.setModel(savedString(saved.model));
            // A save from before conventional fighters has no type: it is an aerospace fighter.
            if (saved.fighterType !== undefined && !["aerospace", "conventional", "support"].includes(saved.fighterType as string)) issue("Ignored an unknown fighter type");
            this._support = saved.fighterType === "support" ? this._importSupport(saved.supportVehicle, issue) : null;
            this._fighterType = this._support ? "support" : saved.fighterType === "conventional" ? "conventional" : "aerospace";
            this.setTech(savedString(saved.tech));
            this.setEra(savedString(saved.era));
            if (saved.tonnage !== undefined && typeof saved.tonnage !== "number") issue("Ignored a tonnage that is not a number");
            this.setTonnage(savedNumber(saved.tonnage, 50, this.getMinTonnage(), this.getMaxTonnage()));
            if (!this._support) {
                const engineTag = savedString(saved.engineType);
                this.setEngineType(engineTag);
                if (engineTag && this._engineType.tag !== engineTag) issue(`Replaced engine "${engineTag.slice(0, 40)}" with ${this._engineType.name}`);
            }
            const thrust = savedNumber(saved.safeThrust, 5, 0, 1000);
            this.setSafeThrust(thrust);
            if (!this._support && this._safeThrust !== Math.floor(thrust)) issue(`Safe Thrust set to ${this._safeThrust}`);
            this.setFuelTons(savedNumber(saved.fuelTons, 5, 0, this.getMaxTonnage()));
            this._patchworkArmor = {};
            if (!this._support) {
                const armorTag = savedString(saved.armorType);
                this.setArmorType(armorTag);
                if (armorTag && this._armorType.tag !== armorTag) issue(`Replaced armor "${armorTag.slice(0, 40)}" with ${this._armorType.name}`);
                const patchwork = isPlainObject(saved.patchworkArmor) ? saved.patchworkArmor : {};
                for (const arc of FIGHTER_ARCS) {
                    const arcTag = patchwork[arc.tag];
                    if (!this.isPatchworkArmor() || typeof arcTag !== "string") continue;
                    if (this.setPatchworkArmorType(arc.tag, arcTag).tag !== arcTag) issue(`Replaced patchwork armor "${arcTag.slice(0, 40)}" (${arc.name}) with ${this.getPatchworkArmorType(arc.tag).name}`);
                }
            }
            this._bays = this._support ? normalizeVehicleBays(saved.bays, AIRCRAFT_BAY_TYPES) : [];
            this._armorAllocation = emptyArmor();
            const armor = isPlainObject(saved.armorAllocation) ? saved.armorAllocation : {};
            for (const arc of FIGHTER_ARCS) this.setArmorAllocation(arc.tag, savedNumber(armor[arc.tag], 0, 0, 10000));
            this.setHeatSinkType(savedString(saved.heatSinkType));
            this.setAdditionalHeatSinks(savedNumber(saved.additionalHeatSinks, 0, 0, 200));
            this.setVSTOL(saved.vstol === true);
            const robotic = getRoboticControlSystem(typeof saved.roboticControl === "string" ? saved.roboticControl : "none").tag;
            this._roboticControl = this.getAvailableRoboticControls().some((system) => system.tag === robotic) ? robotic : "srcs";

            // Fractional Accounting is kept from the save whatever the rules level, so the design loads as built.
            this._weightAccounting = saved.weightAccounting === "fractional" ? "fractional" : "standard";
            this._omni = saved.omni === true && !this.isConventional();
            this._podUUIDs = new Set();
            this._equipmentList = [];
            if (saved.equipment !== undefined && !Array.isArray(saved.equipment)) issue("Ignored an equipment list that is not a list");
            const entries = Array.isArray(saved.equipment) ? saved.equipment : [];
            if (entries.length > MAX_FIGHTER_EQUIPMENT) issue(`Kept the first ${MAX_FIGHTER_EQUIPMENT} of ${entries.length} equipment entries`);
            const catalog = this._catalog();
            const pendingShots: { uuid: string | undefined; shots: number }[] = [];
            for (const entry of entries.slice(0, MAX_FIGHTER_EQUIPMENT)) {
                if (!isPlainObject(entry) || typeof entry.tag !== "string") {
                    issue("Skipped an equipment entry that could not be read");
                    continue;
                }
                const catalogItem = findByTag(catalog, entry.tag);
                if (!catalogItem) {
                    issue(`Skipped unknown equipment "${entry.tag.slice(0, 60)}"`);
                    continue;
                }
                const item = this._newEquipment(catalogItem, entry.location, entry.uuid);
                this._equipmentList.push(item);
                if (this._omni && entry.pod === true && item.uuid) this._podUUIDs.add(item.uuid);
                if (item.isAmmo && typeof entry.shots === "number" && Number.isFinite(entry.shots)) pendingShots.push({ uuid: item.uuid, shots: entry.shots });
            }
            // After every weapon is aboard, so each bin can find the weapon it feeds; clamped to one ton.
            // A saved design keeps the accounting it was saved with, battle armor items or not.
            this._hadBattleArmorEquipment = this.defaultsToFractionalAccounting();
            for (const pending of pendingShots) this.setAmmoBinShots(pending.uuid, pending.shots);

            this._externalStores = [];
            if (saved.externalStores !== undefined && !Array.isArray(saved.externalStores)) issue("Ignored an external stores list that is not a list");
            for (const entry of (Array.isArray(saved.externalStores) ? saved.externalStores : []).slice(0, 50)) {
                if (!isPlainObject(entry) || typeof entry.tag !== "string" || typeof entry.count !== "number") {
                    issue("Skipped an external store that could not be read");
                    continue;
                }
                const before = this._externalStores.length;
                this.setExternalStore(entry.tag, entry.count);
                if (this._externalStores.length === before && entry.count > 0) issue(`Skipped unknown external store "${entry.tag.slice(0, 60)}"`);
            }
            this._importPlay(saved.pilot, saved.inPlay);
            this._calc();
        } catch (error) {
            issue("The saved fighter could not be read completely");
            console.error("AerospaceFighter importJSON failed:", error);
        }
    }
}
