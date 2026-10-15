import { generateUUID } from "../utils/generateUUID";
import { DEFAULT_RULES_EDITION, getSelectableRulesEditionTag } from "../data/rules-editions";
import { aerospaceArmorTypes, getAerospaceArmorPointsPerTon } from "../data/aerospace-armor-types";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { btTechOptions } from "../data/tech-options";
import { btEraOptions, findEraByTag, getClosestEraForTech, getErasForTech } from "../data/era-options";
import { CUSTOM_HOMEBREW_RULES_LEVEL, EXPERIMENTAL_RULES_LEVEL, getAmmoBattleValuePerTon, getBattleArmorScaleListByTech, getCompatibleAmmo, getEffectiveIntroduction, getEquipmentListByTech, getEquipmentRulesLevel, getWeaponShotsPerTon, isEquipmentWithinRulesLevel } from "../data/equipment-registry";
import { getFractionalAerospaceArmorTonsPerPoint, roundUpToKilogram } from "../data/fractional-accounting";
import Pilot, { IPilot } from "./pilot";
import { getSkillMultiplier } from "../data/skill-multipliers";
import { isTargetingComputerWeapon } from "../data/variable-equipment";
import { findByTag } from "../data/tag-match";
import { IAerospaceArmorType, ICapitalWeapon, IEquipmentItem, IEras, IHeatSync, ITechDates, ITechOptions } from "../data/data-interfaces";
import {
    CAPITAL_WEAPON_CATALOG, findCapitalWeapon, getCapitalAmmoBattleValue, getCapitalAmmoCost, getCapitalAmmoTags, getCapitalAmmoTons,
} from "../data/capital-weapon-helpers";
import {
    BAY_DOOR_COST, ESCAPE_SYSTEM_COST, ESCAPE_SYSTEM_TONS, QuartersTag, SMALL_CRAFT_ARCS, SMALL_CRAFT_ARC_FACING, SMALL_CRAFT_BASE_CREW,
    SMALL_CRAFT_CONTROLS_FACTOR, SMALL_CRAFT_FACINGS, SMALL_CRAFT_FUEL_POINTS_PER_TON, SMALL_CRAFT_FUEL_PUMP_FACTOR, SMALL_CRAFT_MAX_ARMOR_TONS_PER_SI,
    SMALL_CRAFT_MAX_BAY_DOORS, SMALL_CRAFT_MAX_SI_FACTOR, SMALL_CRAFT_MAX_TONNAGE, SMALL_CRAFT_MIN_TONNAGE, SMALL_CRAFT_MIN_TURNS_OF_FIRE,
    SMALL_CRAFT_OPPOSITE_ARC, SMALL_CRAFT_SHAPES, SMALL_CRAFT_STRATEGIC_FUEL_TONS_PER_DAY, SMALL_CRAFT_TONNAGE_STEP, SMALL_CRAFT_WEAPONS_PER_ARC,
    SMALL_CRAFT_WEAPONS_PER_GUNNER, SmallCraftArc, SmallCraftFacing, SmallCraftShape, findTransportBayType, getSmallCraftArcName,
    getSmallCraftEngineWeight, getSmallCraftFacingName, getSmallCraftFireControlWeight, getSmallCraftFreeHeatSinks, getSmallCraftStructureWeight,
    quartersTypes, roundUpToHalfTon,
    CraftType, DROPSHIP_MIN_TONNAGE, DROPSHIP_MAX_TONNAGE, DROPSHIP_TONNAGE_STEP, getDropShipFuelPointsPerTon,
    getDropShipStrategicFuelPerDay, getDropShipControlsWeight, getDropShipBaseCrew, getDropShipFreeHeatSinks,
    getDropShipMaxBayDoors, DOCKING_COLLAR_COST, GUNNERY_CONTROL_COST_PER_ARC, DROPSHIP_COST_MULTIPLIER,
} from "../data/small-craft-construction";
import {
    LARGE_CRAFT_AS_DEFENSIVE_ABILITY_FACTORS, getLargeCraftASHeat, getLargeCraftASPointDefense, getLargeCraftMovementFactor, roundUpToTenth, toLargeCraftASDamage,
} from "../data/large-craft-alpha-strike";
import { SMALL_CRAFT_CRITICAL_NAMES, SmallCraftAttackDirection, SmallCraftCritical, getSmallCraftHitLocation } from "../data/small-craft-hit-tables";

// Small Craft construction (TechManual pp.180-197): aerodyne and spheroid craft of 100 to 200 tons. They share
// the heat sink and equipment catalogs and the aerospace armor catalog with fighters, but nearly every
// construction step is their own: the engine is weighed from tonnage and thrust, Structural Integrity is bought,
// the crew needs quarters, and what is left goes to transport bays.

export const MAX_SMALL_CRAFT_EQUIPMENT = 300;
export const MAX_SMALL_CRAFT_BAYS = 20;
export const MAX_SMALL_CRAFT_PEOPLE = 200;
/** Crew, passengers and quarters a DropShip may list; well above the largest published ships. */
export const MAX_DROPSHIP_PEOPLE = 10000;
/** Units a DropShip bay may hold; well above the largest published bays. */
export const MAX_DROPSHIP_BAY_UNITS = 1000;
/** Unit Type Modifier for the Defensive Battle Rating (Unit Type Modifiers Table, TM p.316). */
export const SMALL_CRAFT_BV_TYPE_MODIFIER = 1.0;
export const MAX_SMALL_CRAFT_CAPITAL_WEAPONS = 100;
export const MAX_SMALL_CRAFT_CAPITAL_SHOTS = 9999;
/** Shots a capital weapon that fires ammunition carries at the least: 10 turns of fire (TM pp.194, 210). */
export const MIN_CAPITAL_SHOTS = 10;

/** A capital or sub-capital weapon in a firing arc, with its ammunition by the tag of the weapon whose rounds they are. */
export interface ISmallCraftCapitalMount {
    uuid: string;
    weapon: ICapitalWeapon;
    location?: string;
    /** Shots carried, by the tag of the weapon whose ammunition they are (an AR-10 carries three kinds). */
    shots: Record<string, number>;
}

export interface ISmallCraftCapitalExport {
    tag: string;
    location?: string;
    uuid?: string;
    shots?: Record<string, number>;
}

export type ISmallCraftArmorAllocation = Record<SmallCraftFacing, number>;

export interface ISmallCraftASDamageValue {
    damage: number;
    /** Minimal damage, printed 0*. */
    minimal: boolean;
}
export type SmallCraftASArc = "nose" | "left" | "right" | "rear";
export const SMALL_CRAFT_AS_ARCS: { tag: SmallCraftASArc; name: string }[] = [
    { tag: "nose", name: "Nose" },
    { tag: "left", name: "Left Side" },
    { tag: "right", name: "Right Side" },
    { tag: "rear", name: "Rear" },
];
export interface ISmallCraftAlphaStrikeStats {
    type: "SC";
    size: number;
    /** Thrust, with "a" for an aerodyne craft and "p" for a spheroid. */
    movement: number;
    moveCode: "a" | "p";
    armor: number;
    structure: number;
    threshold: number;
    /** Standard-weapon damage at Short, Medium, Long and Extreme range for each firing arc. */
    arcs: Record<SmallCraftASArc, ISmallCraftASDamageValue[]>;
    pointValue: number;
    specialAbilities: string[];
    calcLog: string;
}
export const formatSmallCraftASDamage = (value: ISmallCraftASDamageValue): string => (value.minimal ? "0*" : `${value.damage}`);
export type ISmallCraftQuarters = Record<QuartersTag, number>;

export interface ISmallCraftBay {
    tag: string;
    /** Bays or cubicles; for a cargo bay, its tons. */
    amount: number;
    doors: number;
}

export type SmallCraftCriticalTrack = "avionics" | "engine" | "fcs" | "sensors" | "crewHits" | "leftThruster" | "rightThruster";
/** Critical hits that are counted in boxes, and how many boxes each has (TW pp.239-240). */
export const SMALL_CRAFT_CRITICAL_TRACKS: { tag: SmallCraftCriticalTrack; name: string; boxes: number }[] = [
    { tag: "avionics", name: "Avionics", boxes: 3 },
    { tag: "engine", name: "Engine", boxes: 6 },
    { tag: "fcs", name: "FCS", boxes: 3 },
    { tag: "sensors", name: "Sensors", boxes: 3 },
    { tag: "leftThruster", name: "Left Thruster", boxes: 4 },
    { tag: "rightThruster", name: "Right Thruster", boxes: 4 },
    { tag: "crewHits", name: "Crew", boxes: 6 },
];

/**
 * Heat levels at which a Small Craft must make an Avoid Roll (Aerospace Fighter/Small Craft Heat Point Table,
 * TW p.161). The Avoid numbers are on the record sheet's Heat Scale.
 */
export const SMALL_CRAFT_HEAT_TRIGGERS: { name: string; levels: number[] }[] = [
    { name: "Random movement", levels: [5, 10, 15, 20, 25] },
    { name: "Ammunition explosion", levels: [19, 23, 28] },
    { name: "Crew damage", levels: [21, 27] },
];

export interface ISmallCraftPendingWeaponCritical {
    facing: SmallCraftFacing;
    /** Who chooses: the 1D6 came up 1-3 (controlling player) or 4-6 (attacking player) (TW p.240). */
    chooser: "controlling" | "attacking";
}

/** Damage and critical hits taken in play (TW pp.237-240). */
export interface ISmallCraftInPlay {
    armorDamage: ISmallCraftArmorAllocation;
    structureDamage: number;
    avionics: number;
    engine: number;
    fcs: number;
    sensors: number;
    crewHits: number;
    leftThruster: number;
    rightThruster: number;
    gear: boolean;
    lifeSupport: boolean;
    doorsDamaged: number;
    /** Percent of the cargo and carried units destroyed by Cargo critical hits. */
    cargoLostPercent: number;
    fuelExploded: boolean;
    destroyedWeapons: string[];
    heat: number;
    firedWeapons: string[];
    pendingWeaponCriticals: ISmallCraftPendingWeaponCritical[];
}

const emptyArmor = (): ISmallCraftArmorAllocation => ({ nose: 0, left: 0, right: 0, aft: 0 });
const emptyQuarters = (): ISmallCraftQuarters => ({ firstClass: 0, secondClass: 0, crew: 0, steerage: 0 });
const newInPlay = (): ISmallCraftInPlay => ({
    armorDamage: emptyArmor(), structureDamage: 0, avionics: 0, engine: 0, fcs: 0, sensors: 0, crewHits: 0, leftThruster: 0, rightThruster: 0,
    gear: false, lifeSupport: false, doorsDamaged: 0, cargoLostPercent: 0, fuelExploded: false, destroyedWeapons: [], heat: 0, firedWeapons: [],
    pendingWeaponCriticals: [],
});

export interface ISmallCraftEquipmentExport {
    tag: string;
    location?: string;
    uuid?: string;
}

export interface ISmallCraftExport {
    /** The rules edition it is built under (rules-editions.ts); absent means Total Warfare. */
    rulesEdition?: string;
    version: number;
    uuid: string;
    lastUpdated: Date;
    name: string;
    model: string;
    shape: SmallCraftShape;
    /** Absent in saves from before DropShips: a Small Craft. */
    craftType?: CraftType;
    military?: boolean;
    tonnage: number;
    tech: string;
    /** The engine's tech base; a Mixed Tech craft may use either. */
    engineTech?: "is" | "clan";
    era: string;
    safeThrust: number;
    fuelTons: number;
    structuralIntegrity: number;
    armorType: string;
    armorTons: number;
    /** Fractional Accounting (TO:AUE p.188); absent = standard rounding. */
    weightAccounting?: "fractional";
    /** Fractional Accounting: armor points bought, at the Fractional Armor Table weight (TO:AUE p.188). */
    fractionalArmorPoints?: number;
    armorAllocation: ISmallCraftArmorAllocation;
    heatSinkType: string;
    additionalHeatSinks: number;
    crew: number;
    officers: number;
    passengers: number;
    quarters: ISmallCraftQuarters;
    bays: ISmallCraftBay[];
    escapePods: number;
    lifeBoats: number;
    equipment: ISmallCraftEquipmentExport[];
    /** Capital and sub-capital weapons; absent in saves from before them. */
    capitalWeapons?: ISmallCraftCapitalExport[];
    pilot?: IPilot;
    inPlay?: ISmallCraftInPlay;
}

const savedString = (value: unknown, fallback: string = ""): string => typeof value === "string" ? value : fallback;
const savedNumber = (value: unknown, fallback: number, min: number, max: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
/** The aerospace armor catalog writes an absent prototype year as null; ITechDates leaves it out. */
const armorDates = (armor: IAerospaceArmorType): ITechDates => ({ ...armor, prototype: armor.prototype ?? undefined });
const wholeNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, Number.isFinite(value) ? Math.floor(value) : min));
/** Escapes text written into the HTML calculation logs, which the summary page renders as markup. */
const escapeLogText = (value: unknown): string => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** A saved Small Craft cleaned by a full import, with what the import changed; null when it is not an object. */
export const normalizeSmallCraftExport = (raw: unknown): { craft: ISmallCraftExport | null; issues: string[] } => {
    if (!isPlainObject(raw)) return { craft: null, issues: ["Skipped a saved Small Craft that could not be read"] };
    let json: string;
    try {
        json = JSON.stringify(raw);
    } catch {
        return { craft: null, issues: ["Skipped a saved Small Craft that could not be read"] };
    }
    const loaded = new SmallCraft(json);
    return { craft: loaded.export(), issues: [...loaded.getImportIssues()] };
};

export default class SmallCraft {
    private _uuid: string = generateUUID();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _rulesEdition: string = DEFAULT_RULES_EDITION;
    private _model: string = "";
    private _shape: SmallCraftShape = "aerodyne";
    private _craftType: CraftType = "smallCraft";
    private _military: boolean = false;
    private _pilot: Pilot = new Pilot();
    private _inPlay: ISmallCraftInPlay = newInPlay();
    private _battleValue: number = 0;
    private _calcLogBV: string = "";
    private _cost: number = 0;
    private _calcLogCost: string = "";
    private _tonnage: number = 200;
    private _tech: ITechOptions = btTechOptions[0];
    private _engineTech: "is" | "clan" = "is";
    private _era: IEras = btEraOptions[0];
    private _safeThrust: number = 4;
    private _fuelTons: number = 10;
    private _structuralIntegrity: number = 6;
    private _armorType: IAerospaceArmorType = aerospaceArmorTypes[0];
    private _armorTons: number = 0;
    /** Weight rounding: "fractional" is the Fractional Accounting construction option (TO:AUE p.188). */
    private _weightAccounting: "standard" | "fractional" = "standard";
    // Whether battle armor items were mounted at the last recalculation: only the first one turns Fractional Accounting on.
    private _hadBattleArmorEquipment = false;
    /** Armor points bought under Fractional Accounting, which buys armor by the point (TO:AUE p.188). */
    private _fractionalArmorPoints: number = 0;
    private _armorAllocation: ISmallCraftArmorAllocation = emptyArmor();
    private _heatSinkType: IHeatSync = mechHeatSinkTypes[0];
    private _additionalHeatSinks: number = 0;
    private _crew: number = SMALL_CRAFT_BASE_CREW;
    private _officers: number = 1;
    private _passengers: number = 0;
    private _quarters: ISmallCraftQuarters = { ...emptyQuarters(), crew: SMALL_CRAFT_BASE_CREW };
    private _bays: ISmallCraftBay[] = [];
    private _escapePods: number = 0;
    private _lifeBoats: number = 0;
    private _equipmentList: IEquipmentItem[] = [];
    private _capitalWeapons: ISmallCraftCapitalMount[] = [];
    private _importIssues: string[] = [];

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
        this._rulesEdition = getSelectableRulesEditionTag(editionTag, "small-craft");
        return this._rulesEdition;
    }

    public setName(name: string): string {
        this._name = String(name ?? "").slice(0, 200);
        return this._name;
    }

    public getModel(): string { return this._model; }
    public setModel(model: string): string {
        this._model = String(model ?? "").slice(0, 200);
        return this._model;
    }

    // Shape, weight and tech ------------------------------------------------------------------------------------

    public getShape(): SmallCraftShape { return this._shape; }
    public getShapeName(): string { return SMALL_CRAFT_SHAPES.find((shape) => shape.tag === this._shape)?.name ?? ""; }
    public isAerodyne(): boolean { return this._shape === "aerodyne"; }

    public getCraftType(): CraftType { return this._craftType; }
    public isDropShip(): boolean { return this._craftType === "dropShip"; }
    public getCraftTypeName(): string { return this.isDropShip() ? "DropShip" : "Small Craft"; }

    /** Small Craft and DropShips share every construction step; the tables give each its own values (TM pp.180-197). */
    public setCraftType(craftType: string): CraftType {
        if (craftType === "smallCraft" || craftType === "dropShip") this._craftType = craftType;
        this._tonnage = this._steppedTonnage(this._tonnage);
        this._clampToRules();
        this._calc();
        return this._craftType;
    }

    /** Military or civilian construction: a DropShip's crew, free heat sinks and fuel use depend on it (TM pp.186-193). */
    public isMilitary(): boolean { return this._military; }
    public setMilitary(military: boolean): boolean {
        this._military = !!military;
        this._clampToRules();
        this._calc();
        return this._military;
    }

    public getMinTonnage(): number { return this.isDropShip() ? DROPSHIP_MIN_TONNAGE : SMALL_CRAFT_MIN_TONNAGE; }
    public getMaxTonnage(): number { return this.isDropShip() ? DROPSHIP_MAX_TONNAGE[this._shape] : SMALL_CRAFT_MAX_TONNAGE; }
    public getTonnageStep(): number { return this.isDropShip() ? DROPSHIP_TONNAGE_STEP : SMALL_CRAFT_TONNAGE_STEP; }
    private _steppedTonnage(tonnage: number): number {
        const step = this.getTonnageStep();
        return Math.min(this.getMaxTonnage(), Math.max(this.getMinTonnage(), Math.round(tonnage / step) * step));
    }
    private _maxPeople(): number { return this.isDropShip() ? MAX_DROPSHIP_PEOPLE : MAX_SMALL_CRAFT_PEOPLE; }

    /** Changing shape changes the weight of the structure, the armor limit, the free heat sinks and the door limit. */
    public setShape(shape: string): SmallCraftShape {
        if (shape === "aerodyne" || shape === "spheroid") this._shape = shape;
        this._tonnage = this._steppedTonnage(this._tonnage);
        this._clampToRules();
        this._calc();
        return this._shape;
    }

    public getTonnage(): number { return this._tonnage; }

    /** Small Craft 100 to 200 tons in 5-ton steps; DropShips 200 to 35,000 (aerodyne) or 100,000 tons in 100-ton steps (TM p.184). */
    public setTonnage(tonnage: number): number {
        this._tonnage = this._steppedTonnage(Number.isFinite(tonnage) ? tonnage : this.getMaxTonnage());
        this._clampToRules();
        this._calc();
        return this._tonnage;
    }

    public getTech(): ITechOptions { return this._tech; }

    public setTech(tag: string): ITechOptions {
        this._tech = findByTag(btTechOptions, tag) ?? this._tech;
        this._era = getClosestEraForTech(this._era, this._tech.tag);
        if (!this.isMixedTech()) this._engineTech = this.getChassisTechBase();
        if (this.getArmorPointsPerTon() === null) this._armorType = aerospaceArmorTypes[0];
        this._clampToRules();
        this._calc();
        return this._tech;
    }

    public isMixedTech(): boolean { return this._tech.tag === "mis" || this._tech.tag === "mclan"; }

    /** The tech base that sets armor points per ton: Clan for Clan and Mixed (Clan chassis). */
    public getChassisTechBase(): "is" | "clan" {
        return this._tech.tag === "clan" || this._tech.tag === "mclan" ? "clan" : "is";
    }

    public getEngineTechBase(): "is" | "clan" { return this._engineTech; }

    /** A Clan craft uses a Clan engine and an Inner Sphere craft an Inner Sphere one (TM p.184); Mixed Tech chooses. */
    public setEngineTechBase(techBase: string): "is" | "clan" {
        if (this.isMixedTech() && (techBase === "is" || techBase === "clan")) this._engineTech = techBase;
        this._clampToRules();
        this._calc();
        return this._engineTech;
    }

    public getEra(): IEras { return this._era; }

    public setEra(tag: string): IEras {
        this._era = getClosestEraForTech(findEraByTag(tag) ?? this._era, this._tech.tag);
        return this._era;
    }

    public getAvailableEras(): IEras[] {
        return getErasForTech(this._tech.tag);
    }

    // Engine, fuel and structure --------------------------------------------------------------------------------

    public getSafeThrust(): number { return this._safeThrust; }
    /** Maximum Thrust is Safe Thrust x 1.5, rounded up (TM p.185). */
    public getMaxThrust(): number { return Math.ceil(this._safeThrust * 1.5); }

    public setSafeThrust(safeThrust: number): number {
        this._safeThrust = wholeNumber(safeThrust, 1, 20);
        this._clampToRules();
        this._calc();
        return this._safeThrust;
    }

    /** Tonnage x Safe Thrust x 0.065 (0.061 for a Clan engine), rounded up to the half ton (TM p.185). */
    public getEngineWeight(): number { return getSmallCraftEngineWeight(this._tonnage, this._safeThrust, this._engineTech, this._round); }

    public getFuelTons(): number { return this._fuelTons; }

    /**
     * Fuel comes in whole or half tons (TM p.186). That is a lot size, not a calculated weight, so Fractional
     * Accounting, which frees calculated weights, armor and ammunition (TO:AUE pp.188-189), leaves it.
     */
    public setFuelTons(tons: number): number {
        const value = Number.isFinite(tons) ? tons : 0;
        this._fuelTons = Math.min(this._tonnage, Math.max(0, Math.round(value * 2) / 2));
        this._calc();
        return this._fuelTons;
    }

    /** 80 points a ton for a Small Craft; a DropShip's points fall with its weight (TM p.186). */
    public getFuelPointsPerTon(): number { return this.isDropShip() ? getDropShipFuelPointsPerTon(this._tonnage) : SMALL_CRAFT_FUEL_POINTS_PER_TON; }
    public getFuelPoints(): number { return Math.floor(this._fuelTons * this.getFuelPointsPerTon()); }
    /** Tanks and pumps: 2 percent of the fuel, rounded up to the half ton (TM p.186). */
    public getFuelPumpWeight(): number { return this._round(this._fuelTons * SMALL_CRAFT_FUEL_PUMP_FACTOR); }
    /** Tons of fuel a day at 1 G: 1.84, or more for a large civilian DropShip (TM p.186). */
    public getStrategicFuelPerDay(): number {
        return this.isDropShip() ? getDropShipStrategicFuelPerDay(this._tonnage, this._military) : SMALL_CRAFT_STRATEGIC_FUEL_TONS_PER_DAY;
    }
    public getBurnDays(): number { return Math.round(this._fuelTons / this.getStrategicFuelPerDay() * 100) / 100; }

    public getStructuralIntegrity(): number { return this._structuralIntegrity; }
    public getMinStructuralIntegrity(): number { return this.getMaxThrust(); }
    public getMaxStructuralIntegrity(): number { return this.getMaxThrust() * SMALL_CRAFT_MAX_SI_FACTOR; }

    /** From Maximum Thrust to 30 times it (TM p.187). */
    public setStructuralIntegrity(value: number): number {
        this._structuralIntegrity = wholeNumber(value, this.getMinStructuralIntegrity(), this.getMaxStructuralIntegrity());
        this._clampToRules();
        this._calc();
        return this._structuralIntegrity;
    }

    /** SI x tonnage / 200 for an aerodyne craft, / 500 for a spheroid, rounded up to the half ton (TM p.187). */
    public getStructureWeight(): number { return getSmallCraftStructureWeight(this._tonnage, this._structuralIntegrity, this._shape, this._round); }

    /** Tonnage x 0.0075, rounded up to the half ton (the kilogram under Fractional Accounting), or to the whole ton for a
     * DropShip (TM p.189). */
    public getControlsWeight(): number {
        return this.isDropShip() ? getDropShipControlsWeight(this._tonnage) : this._round(this._tonnage * SMALL_CRAFT_CONTROLS_FACTOR);
    }

    // Fractional Accounting -----------------------------------------------------------------------------------

    public usesFractionalAccounting(): boolean { return this._weightAccounting === "fractional"; }

    /** Fractional Accounting is "experimental-level unit design" (TO:AUE p.188): Experimental rules and above. */
    public canUseFractionalAccounting(rulesLevel: number = 2): boolean { return rulesLevel >= EXPERIMENTAL_RULES_LEVEL; }

    /**
     * Turns the Fractional Accounting construction option on or off (TO:AUE p.188). It can be turned on only at
     * the Experimental rules level or above; it can always be turned off. Armor keeps its points when turned on; turned
     * off, armor and ammunition round back up to the half ton, except battle armor ammunition, which stays by the
     * kilogram (Ghosts of Obeedah p.54).
     */
    public setWeightAccounting(accounting: "standard" | "fractional", rulesLevel: number = 2): "standard" | "fractional" {
        if (accounting === this._weightAccounting) return this._weightAccounting;
        if (accounting === "fractional" && !this.canUseFractionalAccounting(rulesLevel)) return this._weightAccounting;
        if (accounting === "fractional") {
            this._fractionalArmorPoints = this.getPurchasedArmorPoints();
        } else {
            this._armorTons = Math.min(this.getMaxArmorTons(), roundUpToHalfTon(this.getArmorTons()));
            for (const item of this._equipmentList) {
                if (item.isAmmo && !item.battleArmorScale) item.weight = roundUpToHalfTon(item.weight || 0);
            }
        }
        this._weightAccounting = accounting;
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
    private _round = (weight: number): number => this.usesFractionalAccounting() ? roundUpToKilogram(weight) : roundUpToHalfTon(weight);

    /** Pulls values that depend on others back inside the rules after a change. */
    private _clampToRules(): void {
        this._structuralIntegrity = wholeNumber(this._structuralIntegrity, this.getMinStructuralIntegrity(), this.getMaxStructuralIntegrity());
        this._armorTons = Math.min(this._armorTons, this.getMaxArmorTons());
        this._fractionalArmorPoints = Math.min(this._fractionalArmorPoints, this.getMaxFractionalArmorPoints());
        this._crew = Math.max(this._crew, this.getMinimumCrew());
        this._officers = Math.min(this._officers, this._crew);
    }

    // Armor ---------------------------------------------------------------------------------------------------

    public getArmorType(): IAerospaceArmorType { return this._armorType; }

    /** Armor a Small Craft of this tech base can mount (Aerospace Armor Points per Ton Table, TM p.192). */
    public getAvailableArmorTypes(rulesLevel: number = 2): (IAerospaceArmorType & { available: boolean })[] {
        const techBase = this.getChassisTechBase();
        return aerospaceArmorTypes
            .filter((armor) => getAerospaceArmorPointsPerTon(armor.tag, this._armorUnit(), techBase, this._tonnage) !== null)
            .map((armor) => ({ ...armor, available: this._datesAvailability(armorDates(armor), rulesLevel).available }));
    }

    public setArmorType(tag: string): IAerospaceArmorType {
        const armor = this.getAvailableArmorTypes().find((entry) => entry.tag === tag);
        if (armor) this._armorType = aerospaceArmorTypes.find((entry) => entry.tag === armor.tag) ?? this._armorType;
        this._calc();
        return this._armorType;
    }

    public getArmorPointsPerTon(): number | null {
        return getAerospaceArmorPointsPerTon(this._armorType.tag, this._armorUnit(), this.getChassisTechBase(), this._tonnage);
    }
    /** The row of the Aerospace Armor Points per Ton Table (TM p.192). */
    private _armorUnit(): "small-craft" | "aerodyne-dropship" | "spheroid-dropship" {
        return this.isDropShip() ? `${this._shape}-dropship` : "small-craft";
    }

    /** Under Fractional Accounting, the points bought times the Fractional Armor Table weight, to the kilogram (TO:AUE p.188). */
    public getArmorTons(): number {
        return this.usesFractionalAccounting() ? roundUpToKilogram(this._fractionalArmorPoints * this.getFractionalArmorTonsPerPoint()) : this._armorTons;
    }

    /** Tons per point of the selected armor under Fractional Accounting (Fractional Armor Table, TO:AUE p.188). */
    public getFractionalArmorTonsPerPoint(): number {
        return getFractionalAerospaceArmorTonsPerPoint(this._armorType.tag, this.getChassisTechBase(), this.getArmorPointsPerTon() ?? 16);
    }

    /** Most points Fractional Accounting can buy: what the armor tonnage limit holds. */
    public getMaxFractionalArmorPoints(): number {
        return Math.floor(this.getMaxArmorTons() / this.getFractionalArmorTonsPerPoint() + 1e-6);
    }

    /** Fractional Accounting: buy armor by the point, "in any desired quantity" (TO:AUE p.188). */
    public setPurchasedArmorPoints(points: number): number {
        if (!this.usesFractionalAccounting()) return this.getPurchasedArmorPoints();
        this._fractionalArmorPoints = wholeNumber(points, 0, this.getMaxFractionalArmorPoints());
        this._calc();
        return this._fractionalArmorPoints;
    }
    /** Structural Integrity x 4.5 tons for an aerodyne craft, x 3.6 for a spheroid, in half tons (TM p.191). */
    public getMaxArmorTons(): number {
        return Math.floor(this._structuralIntegrity * SMALL_CRAFT_MAX_ARMOR_TONS_PER_SI[this._shape] * 2 + 1e-9) / 2;
    }

    /** Armor is bought in whole or half tons (TM p.190). */
    public setArmorTons(tons: number): number {
        const value = Number.isFinite(tons) ? tons : 0;
        this._armorTons = Math.min(this.getMaxArmorTons(), Math.max(0, Math.round(value * 2) / 2));
        this._calc();
        return this._armorTons;
    }

    /** Points the armor tonnage buys, rounded down (TM p.191). */
    public getPurchasedArmorPoints(): number {
        if (this.usesFractionalAccounting()) return this._fractionalArmorPoints;
        return Math.floor(this._armorTons * (this.getArmorPointsPerTon() ?? 16) + 1e-9);
    }
    /** Free points from the structure: the Structural Integrity for each of the four facings (TM p.191). */
    public getBonusArmorPoints(): number { return this._structuralIntegrity * SMALL_CRAFT_FACINGS.length; }
    public getAvailableArmorPoints(): number { return this.getPurchasedArmorPoints() + this.getBonusArmorPoints(); }

    public getArmorAllocation(): ISmallCraftArmorAllocation { return this._armorAllocation; }

    public setArmorAllocation(facing: SmallCraftFacing, points: number): ISmallCraftArmorAllocation {
        this._armorAllocation[facing] = wholeNumber(points, 0, 10000);
        this._calc();
        return this._armorAllocation;
    }

    public getTotalArmorPoints(): number {
        return SMALL_CRAFT_FACINGS.reduce((sum, facing) => sum + this._armorAllocation[facing], 0);
    }
    public getUnallocatedArmorPoints(): number { return this.getAvailableArmorPoints() - this.getTotalArmorPoints(); }

    /** Spreads the points on hand over the facings: 30 percent nose, 25 percent each side, the rest aft. */
    public allocateArmorEvenly(): ISmallCraftArmorAllocation {
        const total = this.getAvailableArmorPoints();
        const nose = Math.round(total * 0.3);
        const side = Math.round(total * 0.25);
        this._armorAllocation = { nose, left: side, right: side, aft: Math.max(0, total - nose - side * 2) };
        this._calc();
        return this._armorAllocation;
    }

    public clearArmor(): void {
        this._armorAllocation = emptyArmor();
        this._calc();
    }

    public getFacingName(facing: SmallCraftFacing): string { return getSmallCraftFacingName(facing, this._shape); }
    public getArcName(arc: SmallCraftArc): string { return getSmallCraftArcName(arc, this._shape); }

    /** Damage Threshold of each facing: a tenth of its full armor, rounded up (TW p.239). */
    public getDamageThresholds(): ISmallCraftArmorAllocation {
        const thresholds = emptyArmor();
        for (const facing of SMALL_CRAFT_FACINGS) thresholds[facing] = Math.ceil(this._armorAllocation[facing] / 10);
        return thresholds;
    }

    // Heat sinks ----------------------------------------------------------------------------------------------

    public getHeatSinkType(): IHeatSync { return this._heatSinkType; }

    /** Single or double heat sinks (TM p.193); doubles follow the era. */
    public getAvailableHeatSinkTypes(rulesLevel: number = 2): (IHeatSync & { available: boolean })[] {
        return mechHeatSinkTypes.filter((sink) => sink.tag === "single" || sink.tag === "double")
            .map((sink) => ({ ...sink, available: sink.tag === "single" || this._techDatesAvailability(sink, rulesLevel).available }));
    }

    public setHeatSinkType(tag: string): IHeatSync {
        this._heatSinkType = mechHeatSinkTypes.find((sink) => sink.tag === tag && (tag === "single" || tag === "double")) ?? this._heatSinkType;
        this._calc();
        return this._heatSinkType;
    }

    public getAdditionalHeatSinks(): number { return this._additionalHeatSinks; }

    public setAdditionalHeatSinks(count: number): number {
        this._additionalHeatSinks = wholeNumber(count, 0, this._tonnage);
        this._calc();
        return this._additionalHeatSinks;
    }

    /** Engine tons / 60 on an aerodyne craft, the square root of engine tons x 1.6 on a spheroid; / 20 and x 6.8 for a military DropShip (TM p.193). */
    public getFreeHeatSinks(): number {
        return this.isDropShip()
            ? getDropShipFreeHeatSinks(this.getEngineWeight(), this._shape, this._military)
            : getSmallCraftFreeHeatSinks(this.getEngineWeight(), this._shape);
    }
    public getTotalHeatSinks(): number { return this.getFreeHeatSinks() + this._additionalHeatSinks; }
    public getHeatDissipation(): number { return this.getTotalHeatSinks() * (this._heatSinkType.dissipation ?? 1); }

    /** Heat of every weapon fired together: energy and non-energy weapons alike (TM p.194). */
    public getWeaponHeat(): number {
        return this._equipmentList.filter((item) => !item.isAmmo).reduce((sum, item) => sum + (item.heatAero ?? item.heat ?? 0), 0)
            + this._capitalWeapons.reduce((sum, mount) => sum + this.getCapitalWeaponHeat(mount), 0);
    }

    // Crew, quarters and bays -----------------------------------------------------------------------------------

    /** Weapons that need a gunner: those fired with a Gunnery Skill roll, so not anti-missile systems or other gear (TM p.188). */
    public getGunneryWeaponCount(): number {
        return this._equipmentList.filter((item) => this._isWeapon(item)).length
            + this._capitalWeapons.filter((mount) => !mount.weapon.battleValueDefensive && mount.weapon.category !== "Capital Missile").length;
    }
    /** Capital missile launchers: each needs a gunner of its own (TM p.210). */
    public getCapitalMissileLauncherCount(): number {
        return this._capitalWeapons.filter((mount) => mount.weapon.category === "Capital Missile").length;
    }
    /** One gunner for every six weapons, rounded up (TM p.189), and one for each capital missile launcher (TM p.210). */
    public getMinimumGunners(): number {
        return Math.ceil(this.getGunneryWeaponCount() / SMALL_CRAFT_WEAPONS_PER_GUNNER) + this.getCapitalMissileLauncherCount();
    }
    /** Three for a Small Craft; for a DropShip 3 (civilian) or 4 (military) and 1 for every 5,000 tons (TM p.189). */
    public getBaseCrew(): number { return this.isDropShip() ? getDropShipBaseCrew(this._tonnage, this._military) : SMALL_CRAFT_BASE_CREW; }
    /** The base crew and the gunners (TM p.189). */
    public getMinimumCrew(): number { return this.getBaseCrew() + this.getMinimumGunners(); }
    /** One crew member in five, rounded up, is an officer (TM p.189). */
    public getMinimumOfficers(): number { return Math.ceil(this._crew / 5); }

    public getCrew(): number { return this._crew; }
    public setCrew(crew: number): number {
        this._crew = wholeNumber(crew, this.getMinimumCrew(), this._maxPeople());
        this._officers = Math.min(this._officers, this._crew);
        this._calc();
        return this._crew;
    }

    public getOfficers(): number { return this._officers; }
    public setOfficers(officers: number): number {
        this._officers = wholeNumber(officers, 0, this._crew);
        this._calc();
        return this._officers;
    }

    public getPassengers(): number { return this._passengers; }
    public setPassengers(passengers: number): number {
        this._passengers = wholeNumber(passengers, 0, this._maxPeople());
        this._calc();
        return this._passengers;
    }

    public getQuarters(): ISmallCraftQuarters { return this._quarters; }
    public setQuarters(tag: QuartersTag, count: number): ISmallCraftQuarters {
        if (quartersTypes.some((type) => type.tag === tag)) this._quarters[tag] = wholeNumber(count, 0, this._maxPeople());
        this._calc();
        return this._quarters;
    }
    public getQuartersCapacity(): number { return quartersTypes.reduce((sum, type) => sum + this._quarters[type.tag], 0); }
    public getQuartersWeight(): number { return quartersTypes.reduce((sum, type) => sum + this._quarters[type.tag] * type.tons, 0); }

    public getBays(): ISmallCraftBay[] { return this._bays; }

    public addBay(tag: string, amount: number = 1): ISmallCraftBay | null {
        const type = findTransportBayType(tag);
        if (!type || this._bays.length >= MAX_SMALL_CRAFT_BAYS) return null;
        const bay: ISmallCraftBay = { tag: type.tag, amount: 1, doors: type.infantry || type.tonsEach === null ? 0 : 1 };
        this._bays.push(bay);
        this.setBay(this._bays.length - 1, amount, bay.doors);
        return bay;
    }

    /** Cargo is bought by the ton; other bays by the bay or cubicle. */
    public setBay(index: number, amount: number, doors: number): ISmallCraftBay[] {
        const bay = this._bays[index];
        const type = bay ? findTransportBayType(bay.tag) : undefined;
        if (bay && type) {
            const value = Number.isFinite(amount) ? amount : 1;
            // Whatever weight is left over is cargo (TM p.184), so a cargo bay is not held to half tons.
            bay.amount = type.tonsEach === null ? Math.min(this.getMaxTonnage(), Math.max(0.001, Math.round(value * 1000) / 1000))
                : wholeNumber(value, 1, this.isDropShip() ? MAX_DROPSHIP_BAY_UNITS : 40);
            bay.doors = wholeNumber(doors, 0, Math.max(SMALL_CRAFT_MAX_BAY_DOORS.spheroid, this.getMaxBayDoors()));
        }
        this._calc();
        return this._bays;
    }

    public removeBay(index: number): ISmallCraftBay[] {
        this._bays = this._bays.filter((_bay, bayIndex) => bayIndex !== index);
        this._calc();
        return this._bays;
    }

    public getBayWeight(bay: ISmallCraftBay): number {
        const type = findTransportBayType(bay.tag);
        return type ? (type.tonsEach === null ? bay.amount : type.tonsEach * bay.amount) : 0;
    }
    public getBayName(bay: ISmallCraftBay): string { return findTransportBayType(bay.tag)?.name ?? bay.tag; }
    public getBaysWeight(): number { return this._bays.reduce((sum, bay) => sum + this.getBayWeight(bay), 0); }
    public getBayDoors(): number { return this._bays.reduce((sum, bay) => sum + bay.doors, 0); }
    /** 2 on an aerodyne Small Craft, 4 on a spheroid; 7 plus the weight / 50,000 on a DropShip (TM p.196). */
    public getMaxBayDoors(): number { return this.isDropShip() ? getDropShipMaxBayDoors(this._tonnage) : SMALL_CRAFT_MAX_BAY_DOORS[this._shape]; }
    /** Tons of cargo the cargo bays hold, after each kind's share is taken off (TM p.239). */
    public getCargoCapacity(): number {
        return Math.round(this._bays.reduce((sum, bay) => {
            const type = findTransportBayType(bay.tag);
            return sum + (type && type.cargoFactor ? this.getBayWeight(bay) * type.cargoFactor : 0);
        }, 0) * 100) / 100;
    }

    public getEscapePods(): number { return this._escapePods; }
    public setEscapePods(count: number): number {
        this._escapePods = wholeNumber(count, 0, this.isDropShip() ? 1000 : 20);
        this._calc();
        return this._escapePods;
    }
    public getLifeBoats(): number { return this._lifeBoats; }
    public setLifeBoats(count: number): number {
        this._lifeBoats = wholeNumber(count, 0, this.isDropShip() ? 1000 : 20);
        this._calc();
        return this._lifeBoats;
    }

    // Weapons and equipment -------------------------------------------------------------------------------------

    /** Whether the item is mounted in a firing arc (anything that takes a weapon slot) or sits in the hull. */
    public getItemSlots(item: IEquipmentItem): number {
        if (item.isAmmo) return 0;
        return Math.max(0, item.space?.smallCraft ?? 0);
    }

    public getArcItems(arc: SmallCraftArc): IEquipmentItem[] {
        return this._equipmentList.filter((item) => item.location === arc);
    }
    public getHullItems(): IEquipmentItem[] {
        return this._equipmentList.filter((item) => item.location === "hull");
    }
    /** Weapons in an arc, for the limit of 12 (TM p.196). */
    public getArcWeaponCount(arc: SmallCraftArc): number { return this.getArcItems(arc).length + this.getArcCapitalWeapons(arc).length; }
    /** Extra fire control for an arc with more than 12 weapons (TM p.196). */
    public getArcFireControlWeight(arc: SmallCraftArc): number {
        const items = this.getArcItems(arc);
        const capital = this.getArcCapitalWeapons(arc);
        return getSmallCraftFireControlWeight(items.length + capital.length,
            items.reduce((sum, item) => sum + (item.weight || 0), 0) + capital.reduce((sum, mount) => sum + mount.weapon.weight, 0), this._round);
    }
    public getFireControlWeight(): number {
        return SMALL_CRAFT_ARCS.reduce((sum, arc) => sum + this.getArcFireControlWeight(arc), 0);
    }

    public getEquipmentList(): IEquipmentItem[] { return this._equipmentList; }

    public isEquipmentAllowed(item: IEquipmentItem): boolean {
        return ((this.isDropShip() ? item.space?.dropShip : item.space?.smallCraft) ?? -1) >= 0;
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
            // A Small Craft tracks heat, so its battle armor energy weapons run off heat sinks, never power cells (p.54).
            const energyTags = battleArmorScale.filter((item) => item.category === "Energy Weapons").map((item) => item.tag);
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
        // A saved craft keeps what it mounted, including equipment since moved to the other tech base's catalog.
        const catalog = techTag === "is" || techTag === "clan" ? [...own, ...getEquipmentListByTech(techTag === "clan" ? "mclan" : "mis", true)] : own;
        // Battle armor scale items go last, so a catalog record always wins a lookup.
        return [...catalog, ...getBattleArmorScaleListByTech(techTag)];
    }

    // Ammunition by the shot ----------------------------------------------------------------------------------

    /** Shots in one full ton of a bin's ammunition, for the weapon it feeds; 0 with no such weapon aboard. */
    public getAmmoBinShotsPerTon(ammo: IEquipmentItem): number {
        if (!ammo.isAmmo) return 0;
        const weapon = this._equipmentList.find((item) => !item.isAmmo && getCompatibleAmmo(item, ammo));
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

    private _newEquipment(catalogItem: IEquipmentItem, location?: unknown, uuid?: unknown): IEquipmentItem {
        const freshId = typeof uuid !== "string" || !uuid || this._equipmentList.some((item) => item.uuid === uuid);
        // A deep copy: mounted items never share nested data with each other or the catalog.
        const item: IEquipmentItem = { ...JSON.parse(JSON.stringify(catalogItem)), uuid: freshId ? generateUUID() : uuid as string };
        item.location = this._validLocation(item, location);
        return item;
    }

    /** A weapon, or an anti-missile system: something that has to face a firing arc. */
    public needsArc(item: IEquipmentItem): boolean {
        return this.getItemSlots(item) > 0 && (this._isWeapon(item) || !!item.weaponType?.includes("AMS"));
    }

    /**
     * Weapons sit in a firing arc. Ammunition goes with the weapons it feeds and is listed with the hull; other
     * equipment (probes, ECM and the like) may be given an arc or left in the hull.
     */
    private _validLocation(item: IEquipmentItem, location: unknown): string | undefined {
        if (this.getItemSlots(item) === 0) return "hull";
        if (typeof location === "string" && (SMALL_CRAFT_ARCS as string[]).includes(location)) return location;
        return this.needsArc(item) ? undefined : "hull";
    }

    public addEquipmentFromTag(tag: string, location?: string): IEquipmentItem | null {
        const catalogItem = findByTag(this._catalog(), tag);
        if (!catalogItem || !this.isEquipmentAllowed(catalogItem) || this._equipmentList.length >= MAX_SMALL_CRAFT_EQUIPMENT) return null;
        const item = this._newEquipment(catalogItem, location);
        this._equipmentList.push(item);
        this._clampToRules();
        this._calc();
        return item;
    }

    public removeEquipment(uuid: string): IEquipmentItem[] {
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

    // Capital and sub-capital weapons (TM pp.210, 237; TO:AUE pp.82-83) -----------------------------------------

    /** Capital missile launchers for DropShips, Screen Launchers for both, sub-capital weapons as TO:AUE allows. */
    public isCapitalWeaponAllowed(weapon: ICapitalWeapon): boolean {
        return ((this.isDropShip() ? weapon.space.dropShip : weapon.space.smallCraft) ?? -1) > 0;
    }
    private _capitalTechAllowed(weapon: ICapitalWeapon): boolean {
        return weapon.techBase === "both" || this.isMixedTech() || weapon.techBase === this.getChassisTechBase();
    }
    private _capitalDates(weapon: ICapitalWeapon): ITechDates {
        return { introduced: weapon.introduced, extinct: weapon.extinct, reintroduced: weapon.reintroduced, prototype: weapon.prototype ?? undefined } as ITechDates;
    }
    /** Capital and sub-capital weapons the craft type, technology base, era and rules level offer. */
    public getAvailableCapitalWeapons(rulesLevel: number = 2): ICapitalWeapon[] {
        return CAPITAL_WEAPON_CATALOG.filter((weapon) => this.isCapitalWeaponAllowed(weapon) && this._capitalTechAllowed(weapon)
            && weapon.rulesLevel <= rulesLevel && this._datesAvailability(this._capitalDates(weapon), rulesLevel).available);
    }
    public getCapitalWeapons(): ISmallCraftCapitalMount[] { return this._capitalWeapons; }
    public getArcCapitalWeapons(arc: SmallCraftArc): ISmallCraftCapitalMount[] {
        return this._capitalWeapons.filter((mount) => mount.location === arc);
    }
    public getCapitalAmmoTags(mount: ISmallCraftCapitalMount): string[] { return getCapitalAmmoTags(mount.weapon); }
    public getCapitalShots(mount: ISmallCraftCapitalMount): number { return Object.values(mount.shots).reduce((sum, shots) => sum + shots, 0); }
    /** The launcher and its ammunition. */
    public getCapitalWeaponWeight(mount: ISmallCraftCapitalMount): number {
        return Math.round((mount.weapon.weight + Object.keys(mount.shots).reduce((sum, tag) => sum + getCapitalAmmoTons(tag, mount.shots[tag]), 0)) * 1000) / 1000;
    }
    /**
     * Heat of one shot. An AR-10 makes the heat of the missile it fires (TM p.342); counted here at the hottest
     * missile it carries, or the hottest it may fire when it carries none (a reading).
     */
    public getCapitalWeaponHeat(mount: ISmallCraftCapitalMount): number {
        if (mount.weapon.heat !== null) return mount.weapon.heat;
        const tags = getCapitalAmmoTags(mount.weapon);
        const loaded = tags.filter((tag) => (mount.shots[tag] ?? 0) > 0);
        return Math.max(0, ...(loaded.length ? loaded : tags).map((tag) => findCapitalWeapon(tag)?.heat ?? 0));
    }

    private _newCapitalMount(weapon: ICapitalWeapon, location: unknown, shots: unknown, uuid?: unknown): ISmallCraftCapitalMount {
        const taken = (id: string) => this._capitalWeapons.some((mount) => mount.uuid === id) || this._equipmentList.some((item) => item.uuid === id);
        const mount: ISmallCraftCapitalMount = {
            uuid: typeof uuid === "string" && uuid && !taken(uuid) ? uuid : generateUUID(),
            weapon,
            location: typeof location === "string" && (SMALL_CRAFT_ARCS as string[]).includes(location) ? location : undefined,
            shots: {},
        };
        for (const tag of getCapitalAmmoTags(weapon)) {
            mount.shots[tag] = Math.floor(savedNumber(isPlainObject(shots) ? shots[tag] : undefined, 0, 0, MAX_SMALL_CRAFT_CAPITAL_SHOTS));
        }
        return mount;
    }

    /** A new weapon that fires ammunition comes with 10 shots, the least it may carry (TM pp.194, 210). */
    public addCapitalWeapon(tag: string, location?: string): ISmallCraftCapitalMount | null {
        const weapon = findCapitalWeapon(tag);
        if (!weapon || !this.isCapitalWeaponAllowed(weapon) || this._capitalWeapons.length >= MAX_SMALL_CRAFT_CAPITAL_WEAPONS) return null;
        const first = getCapitalAmmoTags(weapon)[0];
        const mount = this._newCapitalMount(weapon, location, first ? { [first]: MIN_CAPITAL_SHOTS } : {});
        this._capitalWeapons.push(mount);
        this._clampToRules();
        this._calc();
        return mount;
    }
    public removeCapitalWeapon(uuid: string): ISmallCraftCapitalMount[] {
        this._capitalWeapons = this._capitalWeapons.filter((mount) => mount.uuid !== uuid);
        this._calc();
        return this._capitalWeapons;
    }
    public setCapitalWeaponLocation(uuid: string, location: string): void {
        const mount = this._capitalWeapons.find((entry) => entry.uuid === uuid);
        if (mount) mount.location = (SMALL_CRAFT_ARCS as string[]).includes(location) ? location : undefined;
        this._calc();
    }
    /** Shots of one kind of ammunition; only kinds the weapon fires. */
    public setCapitalWeaponShots(uuid: string, ammoTag: string, shots: number): void {
        const mount = this._capitalWeapons.find((entry) => entry.uuid === uuid);
        if (!mount || !getCapitalAmmoTags(mount.weapon).includes(ammoTag)) return;
        mount.shots[ammoTag] = Math.floor(savedNumber(shots, 0, 0, MAX_SMALL_CRAFT_CAPITAL_SHOTS));
        this._calc();
    }

    /** Shots a weapon fires in a turn at its fastest: 2 for an Ultra autocannon, 6 for a rotary one (TM p.194). */
    private static _shotsPerTurn(weapon: IEquipmentItem): number {
        const text = `${weapon.tag} ${weapon.name}`.toLowerCase();
        if (/rotary|\brac\b/.test(text)) return 6;
        if (/ultra|\buac\b/.test(text)) return 2;
        return 1;
    }

    /**
     * Ammunition-fed weapon models that carry fewer than 10 turns of fire for each launcher (TM p.194). One-shot
     * weapons carry their own round and are left out.
     */
    public getAmmunitionShortfalls(): { name: string; shots: number; needed: number }[] {
        const shortfalls: { name: string; shots: number; needed: number }[] = [];
        const seen = new Set<string>();
        for (const weapon of this._equipmentList) {
            // An anti-missile system fires only when missiles come in, so it has no "turns of fire" to count.
            if (weapon.isAmmo || weapon.isOneShot || seen.has(weapon.tag) || weapon.weaponType?.includes("AMS")) continue;
            const usesAmmo = !!weapon.ammoTypes?.length || (weapon.shotsPerTon ?? 0) > 0;
            if (!usesAmmo) continue;
            seen.add(weapon.tag);
            const count = this._equipmentList.filter((item) => !item.isAmmo && item.tag === weapon.tag).length;
            const shots = this._equipmentList.filter((item) => item.isAmmo && getCompatibleAmmo(weapon, item))
                .reduce((sum, ammo) => sum + getWeaponShotsPerTon(weapon, ammo) * (ammo.weight || 0), 0);
            const needed = count * SMALL_CRAFT_MIN_TURNS_OF_FIRE * SmallCraft._shotsPerTurn(weapon);
            if (shots < needed) shortfalls.push({ name: weapon.name, shots: Math.floor(shots), needed });
        }
        return shortfalls;
    }

    // Totals --------------------------------------------------------------------------------------------------

    public getWeights(): { name: string; weight: number }[] { return this._weights; }
    public getCurrentTonnage(): number { return this._currentTonnage; }
    public getRemainingTonnage(): number { return Math.round((this._tonnage - this._currentTonnage) * 1000) / 1000; }

    /** Everything that keeps the design from being legal under TechManual, in plain words. */
    public getIssues(rulesLevel: number = 2): string[] {
        const issues: string[] = [];
        const remaining = this.getRemainingTonnage();
        if (remaining < 0) issues.push(`Overweight by ${-remaining} tons.`);
        if (this._structuralIntegrity < this.getMinStructuralIntegrity() || this._structuralIntegrity > this.getMaxStructuralIntegrity()) {
            issues.push(`Structural Integrity must be from ${this.getMinStructuralIntegrity()} to ${this.getMaxStructuralIntegrity()} (Maximum Thrust to 30 times it, TM p.187).`);
        }
        if (this.getArmorTons() > this.getMaxArmorTons()) {
            issues.push(`Armor exceeds the maximum of ${this.getMaxArmorTons()} tons (Structural Integrity x ${SMALL_CRAFT_MAX_ARMOR_TONS_PER_SI[this._shape]}, TM p.191).`);
        }
        if (this.getUnallocatedArmorPoints() < 0) {
            issues.push(`${-this.getUnallocatedArmorPoints()} more armor points are allocated than the armor provides (${this.getAvailableArmorPoints()}).`);
        }
        if (this.getArmorPointsPerTon() === null) issues.push(`${this._armorType.name} is not available to this tech base.`);
        else if (!this._datesAvailability(armorDates(this._armorType), rulesLevel).available) issues.push(`${this._armorType.name} is not available in the selected era.`);
        if (this._heatSinkType.tag !== "single" && !this._techDatesAvailability(this._heatSinkType, rulesLevel).available) {
            issues.push(`${this._heatSinkType.name} heat sinks are not available in the selected era.`);
        }
        const unplaced = this._equipmentList.filter((item) => !item.location).length + this._capitalWeapons.filter((mount) => !mount.location).length;
        if (unplaced > 0) issues.push(`${unplaced} item${unplaced === 1 ? " has" : "s have"} no firing arc yet.`);
        for (const item of this._equipmentList) {
            if (!this.isEquipmentAllowed(item)) issues.push(`${item.name} cannot be mounted on a ${this.getCraftTypeName()}.`);
        }
        for (const mount of this._capitalWeapons) {
            if (!this.isCapitalWeaponAllowed(mount.weapon)) {
                issues.push(`${mount.weapon.name} cannot be mounted on a ${this.getCraftTypeName()}${mount.weapon.category === "Capital Missile" ? "; only DropShips mount capital missile launchers (TM p.210)" : ""}.`);
            } else if (mount.weapon.rulesLevel > rulesLevel) {
                issues.push(`${mount.weapon.name} needs a higher rules level (${mount.weapon.book}).`);
            } else if (!this._capitalTechAllowed(mount.weapon) || !this._datesAvailability(this._capitalDates(mount.weapon), rulesLevel).available) {
                issues.push(`${mount.weapon.name} is not available to this tech base in the selected era.`);
            }
            if (getCapitalAmmoTags(mount.weapon).length > 0 && this.getCapitalShots(mount) < MIN_CAPITAL_SHOTS) {
                issues.push(`${mount.weapon.name}: ${this.getCapitalShots(mount)} shots carried, at least ${MIN_CAPITAL_SHOTS} needed (TM pp.194, 210).`);
            }
        }
        // Side and wing weapons must be the same on both sides (TM p.195).
        for (const arc of ["left", "leftAft"] as SmallCraftArc[]) {
            const other = SMALL_CRAFT_OPPOSITE_ARC[arc] as SmallCraftArc;
            const tags = (side: SmallCraftArc) => [...this.getArcItems(side).map((item) => item.tag), ...this.getArcCapitalWeapons(side).map((mount) => mount.weapon.tag)].sort().join(",");
            if (tags(arc) !== tags(other)) {
                issues.push(`${this.getArcName(arc)} and ${this.getArcName(other)} must carry the same weapons (TM p.195).`);
            }
        }
        for (const shortfall of this.getAmmunitionShortfalls()) {
            issues.push(`${shortfall.name}: ${shortfall.shots} shots carried, ${shortfall.needed} needed for 10 turns of fire for each (TM p.194).`);
        }
        if (this._crew < this.getMinimumCrew()) issues.push(`The crew must be at least ${this.getMinimumCrew()} (${this.getBaseCrew()} and ${this.getMinimumGunners()} gunners, TM p.189).`);
        const people = this._crew + this._passengers;
        if (this.getQuartersCapacity() < people) {
            issues.push(`Quarters for ${this.getQuartersCapacity()} of ${people} crew and passengers; everyone aboard needs quarters (TM p.195).`);
        }
        if (this.getBayDoors() > this.getMaxBayDoors()) {
            issues.push(`${this.getBayDoors()} bay doors; ${this.isDropShip() ? `a DropShip of ${this._tonnage.toLocaleString("en-US")} tons` : this.isAerodyne() ? "an aerodyne Small Craft" : "a spheroid Small Craft"} has no more than ${this.getMaxBayDoors()} (TM p.196).`);
        }
        for (const bay of this._bays) {
            const type = findTransportBayType(bay.tag);
            // "Transport bays for any unit type other than infantry": a cargo bay carries no unit and needs none.
            if (type && !type.infantry && !type.cargoFactor && type.tonsEach !== null && bay.doors < 1) issues.push(`${type.name}: a bay for units other than infantry needs a door (TM p.196).`);
        }
        if (this._fuelTons <= 0) issues.push("The craft carries no fuel.");
        return issues;
    }

    /** Things worth knowing that are not errors. */
    public getNotes(): string[] {
        const notes: string[] = [];
        if (this._officers < this.getMinimumOfficers()) notes.push(`One crew member in five is normally an officer: ${this.getMinimumOfficers()} for this crew (TM p.189).`);
        if (this._fuelTons > 0 && this._fuelTons < this._tonnage * 0.05) notes.push(`A ${this.getCraftTypeName()} should give at least 5 percent of its weight to fuel: ${roundUpToHalfTon(this._tonnage * 0.05)} tons (TM p.186).`);
        const remaining = this.getRemainingTonnage();
        if (remaining > 0) notes.push(`${remaining} tons are unspent: cargo if a bay is added for them, wasted otherwise (TM p.184).`);
        if (this.getWeaponHeat() > this.getHeatDissipation()) notes.push(`Firing everything makes ${this.getWeaponHeat()} heat against ${this.getHeatDissipation()} dissipated; a Small Craft tracks heat as a fighter does (TM p.193).`);
        if (this._capitalWeapons.length > 0) notes.push("Capital and sub-capital weapons are not yet counted in the Alpha Strike conversion or in play.");
        for (const arc of SMALL_CRAFT_ARCS) {
            const count = this.getArcWeaponCount(arc);
            if (count > SMALL_CRAFT_WEAPONS_PER_ARC) notes.push(`${this.getArcName(arc)}: ${count} weapons, over the 12 an arc holds; ${this.getArcFireControlWeight(arc)} tons of extra fire control added (TM p.196).`);
        }
        return notes;
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
        // Mounting the first battle armor item turns Fractional Accounting on (Ghosts of Obeedah p.54).
        const hasBattleArmorEquipment = this.defaultsToFractionalAccounting();
        if (hasBattleArmorEquipment && !this._hadBattleArmorEquipment) this._weightAccounting = "fractional";
        this._hadBattleArmorEquipment = hasBattleArmorEquipment;
        const quarters = quartersTypes.filter((type) => this._quarters[type.tag] > 0)
            .map((type) => ({ name: `Quarters, ${type.name} (${this._quarters[type.tag]})`, weight: this._quarters[type.tag] * type.tons }));
        const bays = this._bays.map((bay) => {
            const type = findTransportBayType(bay.tag);
            const amount = type && type.tonsEach === null ? `${bay.amount} tons` : `${bay.amount}`;
            return { name: `${this.getBayName(bay)} (${amount}, ${bay.doors} door${bay.doors === 1 ? "" : "s"})`, weight: this.getBayWeight(bay) };
        });
        this._weights = [
            { name: `Engine (Safe Thrust ${this._safeThrust}, ${this._engineTech === "clan" ? "Clan" : "Inner Sphere"})`, weight: this.getEngineWeight() },
            { name: `Fuel (${this.getFuelPoints()} points)`, weight: this._fuelTons },
            { name: "Fuel Tanks and Pumps", weight: this.getFuelPumpWeight() },
            { name: `Structural Integrity (${this._structuralIntegrity})`, weight: this.getStructureWeight() },
            { name: "Control Systems", weight: this.getControlsWeight() },
            { name: `Armor (${this._armorType.name}, ${this.getPurchasedArmorPoints()} + ${this.getBonusArmorPoints()} points)`, weight: this.getArmorTons() },
            { name: `Heat Sinks (${this.getTotalHeatSinks()} ${this._heatSinkType.name}, ${this.getFreeHeatSinks()} free)`, weight: this._additionalHeatSinks },
            ...(this.getFireControlWeight() > 0 ? [{ name: "Extra Fire Control", weight: this.getFireControlWeight() }] : []),
            ...this._equipmentList.map((item) => ({ name: item.name, weight: item.weight || 0 })),
            ...this._capitalWeapons.map((mount) => {
                const shots = this.getCapitalShots(mount);
                return { name: `${mount.weapon.name}${getCapitalAmmoTags(mount.weapon).length ? ` (${shots} shot${shots === 1 ? "" : "s"})` : ""}`, weight: this.getCapitalWeaponWeight(mount) };
            }),
            ...quarters,
            ...bays,
            ...(this._escapePods > 0 ? [{ name: `Escape Pods (${this._escapePods})`, weight: this._escapePods * ESCAPE_SYSTEM_TONS }] : []),
            ...(this._lifeBoats > 0 ? [{ name: `Lifeboats (${this._lifeBoats})`, weight: this._lifeBoats * ESCAPE_SYSTEM_TONS }] : []),
        ];
        this._currentTonnage = Math.round(this._weights.reduce((sum, entry) => sum + entry.weight, 0) * 1000) / 1000;
        this._calcBattleValue();
        this._calcCost();
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

    /**
     * Heat a weapon counts for in the Battle Value: Ultra x 2, rotary x 6, Streak x 0.5, one-shot x 0.25 (TM
     * p.312). The multipliers apply to the heat of one shot, so a rapid-fire weapon starts from that and not
     * from its aerospace heat, which is already the heat of a full burst.
     */
    public static bvHeat(item: IEquipmentItem): number {
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

    /** A launcher with Artemis IV counts 20 percent more than the plain launcher (TM p.312). */
    private _weaponBaseBV(item: IEquipmentItem): number {
        if (item.tag.endsWith("-artemis-iv")) {
            const plain = findByTag(this._catalog(), item.tag.slice(0, -"-artemis-iv".length));
            if (plain && (plain.battleValue || 0) > 0) return (plain.battleValue || 0) * 1.2;
        }
        return item.battleValue || 0;
    }

    /** The Speed Factor for a Maximum Thrust (Speed Factor Table and formula, TM p.316). */
    public static speedFactor(maxThrust: number): number {
        return Math.round(Math.pow(1 + (maxThrust - 5) / 10, 1.2) * 100) / 100;
    }

    /**
     * Battle Value (Calculating Aerospace BV, TM pp.311-313). A Small Craft is worked as a fighter is:
     * Defensive = (armor x 2.5 + Structural Integrity x 2 + defensive equipment - 15 per type of explosive
     * ammunition and 1 per Gauss weapon on an Inner Sphere craft without CASE, never below 1) x 1.0. Offensive =
     * (weapons + ammunition, capped at its weapons, + other equipment) x the Speed Factor for Maximum Thrust.
     * The weaker of the nose and the rear-firing weapon groups counts half. On an aerodyne craft the wing weapons
     * turned to face the rear are rear-firing with the aft ones; a spheroid's aft-side arcs are not considered
     * (TM p.312). A craft that makes more heat than 6 + its heat sinks halves every weapon after the one that
     * crosses that line, taking the highest values first.
     */
    private _calcBattleValue(): void {
        let log = "<strong>DEFENSIVE BATTLE RATING</strong><br />";
        const armorPoints = this.getTotalArmorPoints();
        const structuralIntegrity = this._structuralIntegrity;
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
        if (amsAmmoBV > 0) log += `+ Anti-missile ammunition = ${Math.min(amsAmmoBV, amsBV)}<br />`;
        // A Screen Launcher counts toward the Defensive Battle Rating, with its ammunition capped at its own value.
        for (const mount of this._capitalWeapons.filter((entry) => entry.weapon.battleValueDefensive)) {
            const ammoBV = Math.min(mount.weapon.battleValue, Object.keys(mount.shots).reduce((sum, tag) => sum + getCapitalAmmoBattleValue(tag, mount.shots[tag]), 0));
            defensive += mount.weapon.battleValue + ammoBV;
            log += `+ Defensive Equipment: ${escapeLogText(mount.weapon.name)} = ${mount.weapon.battleValue} + ammunition ${ammoBV}<br />`;
        }

        // Clan craft are taken to have CASE; an Inner Sphere one needs to mount it (TM p.311).
        // The subtraction is for fighters and Small Craft only (TM p.311).
        const hasCASE = this.isDropShip() || this.getChassisTechBase() === "clan" || this._equipmentList.some((item) => /(^|-)case(-|$)/.test(item.tag));
        if (!hasCASE) {
            const explosiveTypes = new Set(this._equipmentList.filter((item) => item.isAmmo && item.explosive).map((item) => item.tag)).size;
            const gaussWeapons = weapons.filter((item) => /gauss|(^|-)hag(-|$)/.test(item.tag)).length;
            const penalty = explosiveTypes * 15 + gaussWeapons;
            if (penalty > 0) {
                defensive = Math.max(1, defensive - penalty);
                log += `- Explosive ammunition (${explosiveTypes} type${explosiveTypes === 1 ? "" : "s"} x 15) and Gauss weapons (${gaussWeapons} x 1), no CASE = -${penalty}<br />`;
            }
        }
        log += `Subtotal ${defensive.toFixed(2)} x ${SMALL_CRAFT_BV_TYPE_MODIFIER} (${this.getCraftTypeName()})`;
        defensive *= SMALL_CRAFT_BV_TYPE_MODIFIER;
        log += ` = ${defensive.toFixed(2)}<br />`;

        log += "<strong>OFFENSIVE BATTLE RATING</strong><br />";
        const hasTC = this.hasTargetingComputer();
        const offensiveWeapons = this._equipmentList.filter((item) => this._isWeapon(item));
        const rearArcs: string[] = this.isAerodyne() ? ["aft", "leftAft", "rightAft"] : ["aft"];
        const isRear = (item: IEquipmentItem) => rearArcs.includes(item.location ?? "");
        const groupBV = (rear: boolean) => offensiveWeapons.filter((item) => (rear ? isRear(item) : item.location === "nose"))
            .reduce((sum, item) => sum + (item.battleValue || 0), 0);
        const rearHalved = groupBV(false) >= groupBV(true);
        const isHalved = (item: IEquipmentItem) => (rearHalved ? isRear(item) : item.location === "nose");
        const modifiedBV = (item: IEquipmentItem) => this._weaponBaseBV(item)
            * (hasTC && isTargetingComputerWeapon(item) ? 1.25 : 1) * (isHalved(item) ? 0.5 : 1);

        let rating = 0;
        if (this.isDropShip()) {
            const dropShip = this._dropShipWeaponRating(offensiveWeapons, hasTC);
            rating = dropShip.rating;
            log += dropShip.log;
        } else {
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
            const totalHeat = offensiveWeapons.reduce((sum, item) => sum + SmallCraft.bvHeat(item), 0);
            const overEfficiency = totalHeat > efficiency;
            log += `Heat Efficiency 6 + ${this.getHeatDissipation()} = ${efficiency}; Total Weapon Heat ${totalHeat}<br />`;
            const ordered = [...offensiveWeapons].sort((a, b) => {
                const heatless = (SmallCraft.bvHeat(a) > 0 ? 1 : 0) - (SmallCraft.bvHeat(b) > 0 ? 1 : 0);
                if (heatless !== 0) return heatless;
                return modifiedBV(b) - modifiedBV(a) || SmallCraft.bvHeat(a) - SmallCraft.bvHeat(b);
            });
            let runningHeat = 0;
            let overheated = false;
            for (const item of ordered) {
                const heat = SmallCraft.bvHeat(item);
                const halved = overEfficiency && overheated && heat > 0;
                const value = modifiedBV(item) * (halved ? 0.5 : 1);
                rating += value;
                if (overEfficiency && heat > 0 && !overheated) {
                    runningHeat += heat;
                    if (runningHeat >= efficiency) overheated = true;
                }
                const arcName = item.location && item.location !== "hull" ? this.getArcName(item.location as SmallCraftArc) : "no arc";
                log += `+ ${escapeLogText(item.name)} (${escapeLogText(arcName)}) = ${value.toFixed(2)}`
                    + `${isHalved(item) ? " (weaker of nose and rear x 0.5)" : ""}${halved ? " (over Heat Efficiency x 0.5)" : ""}<br />`;
            }
        }
        const speedFactor = SmallCraft.speedFactor(this.getMaxThrust());
        const offensive = rating * speedFactor;
        log += `Weapon Battle Rating ${rating.toFixed(2)} x Speed Factor ${speedFactor} (Max Thrust ${this.getMaxThrust()}) = ${offensive.toFixed(2)}<br />`;

        this._battleValue = Math.round(defensive + offensive);
        log += `<strong>Battle Value</strong>: ${defensive.toFixed(2)} + ${offensive.toFixed(2)} = ${this._battleValue}<br />`;
        this._calcLogBV = log;
    }

    /**
     * A DropShip's Weapon Battle Rating, worked by firing arc (TM p.312). The arc with the highest weapon BV is the
     * Front, at full value with its ammunition. Of the two arcs beside it the higher is the Left Side, halved if
     * firing the Front alone exceeds the Heat Efficiency (the heat sink capacity, with no 6 added); the other is the
     * Right Side, x 0.5, or x 0.25 if the Front and Left Side together exceed it, as the book prints step 7. The
     * three remaining arcs are the Rear, x 0.25. Then equipment with a BV. Rear-firing halving does not apply.
     * Readings: ammunition kept in the hull goes to the arcs of the weapons it feeds, shared by their BV; a tie for
     * Front takes the first arc from the nose, a tie for Left Side the arc after the Front going around the left.
     */
    private _dropShipWeaponRating(offensiveWeapons: IEquipmentItem[], hasTC: boolean): { rating: number; log: string } {
        const ring: SmallCraftArc[] = ["nose", "left", "leftAft", "aft", "rightAft", "right"];
        const arcBV: Record<string, number> = {};
        const arcHeat: Record<string, number> = {};
        for (const arc of ring) { arcBV[arc] = 0; arcHeat[arc] = 0; }
        for (const item of offensiveWeapons) {
            const arc = item.location ?? "";
            if (!(arc in arcBV)) continue;
            arcBV[arc] += this._weaponBaseBV(item) * (hasTC && isTargetingComputerWeapon(item) ? 1.25 : 1);
            arcHeat[arc] += SmallCraft.bvHeat(item);
        }
        let log = "";
        // Capital and sub-capital weapons count in their arcs as other weapons do. Their ammunition is capped at the
        // value of the launchers of the model and shared among those launchers' arcs by the ammunition each carries.
        const capital = this._capitalWeapons.filter((mount) => !mount.weapon.battleValueDefensive && (mount.location ?? "") in arcBV);
        const capitalAmmoArcBV: Record<string, number> = {};
        for (const mount of capital) {
            arcBV[mount.location as string] += mount.weapon.battleValue;
            arcHeat[mount.location as string] += this.getCapitalWeaponHeat(mount);
        }
        for (const tag of new Set(capital.map((mount) => mount.weapon.tag))) {
            const mounts = capital.filter((mount) => mount.weapon.tag === tag);
            const ammoBV = mounts.map((mount) => Object.keys(mount.shots).reduce((sum, ammoTag) => sum + getCapitalAmmoBattleValue(ammoTag, mount.shots[ammoTag]), 0));
            const value = ammoBV.reduce((sum, entry) => sum + entry, 0);
            if (value <= 0) continue;
            const capped = Math.min(value, mounts.reduce((sum, mount) => sum + mount.weapon.battleValue, 0));
            mounts.forEach((mount, index) => {
                capitalAmmoArcBV[mount.location as string] = (capitalAmmoArcBV[mount.location as string] ?? 0) + capped * ammoBV[index] / value;
            });
            log += `Ammunition for ${escapeLogText(mounts[0].weapon.name)} = ${capped.toFixed(2)}${capped < value ? " (capped at weapon BV)" : ""}, with the arcs of its weapons<br />`;
        }
        // Ammunition, capped at the unmodified value of the weapons of the model it feeds, then given to arcs.
        const weaponBVByTag: Record<string, number> = {};
        for (const item of offensiveWeapons) weaponBVByTag[item.tag] = (weaponBVByTag[item.tag] ?? 0) + (item.battleValue || 0);
        const ammoBVByTag: Record<string, number> = {};
        const ammoArcBV: Record<string, number> = {};
        for (const ammo of this._equipmentList.filter((item) => item.isAmmo)) {
            const fed = offensiveWeapons.find((weapon) => getCompatibleAmmo(weapon, ammo));
            if (fed) ammoBVByTag[fed.tag] = (ammoBVByTag[fed.tag] ?? 0) + getAmmoBattleValuePerTon(fed, ammo) * (ammo.weight || 0);
        }
        for (const [tag, value] of Object.entries(ammoBVByTag)) {
            const capped = Math.min(value, weaponBVByTag[tag] ?? 0);
            for (const item of offensiveWeapons.filter((weapon) => weapon.tag === tag && (weapon.location ?? "") in arcBV)) {
                const share = weaponBVByTag[tag] > 0 ? (item.battleValue || 0) / weaponBVByTag[tag] : 0;
                ammoArcBV[item.location as string] = (ammoArcBV[item.location as string] ?? 0) + capped * share;
            }
            log += `Ammunition for ${escapeLogText(tag)} = ${capped.toFixed(2)}${capped < value ? " (capped at weapon BV)" : ""}, with the arcs of its weapons<br />`;
        }
        const total = (arc: SmallCraftArc) => arcBV[arc] + (ammoArcBV[arc] ?? 0) + (capitalAmmoArcBV[arc] ?? 0);
        for (const arc of ring) log += `${escapeLogText(this.getArcName(arc))}: weapons ${arcBV[arc].toFixed(2)}, heat ${arcHeat[arc]}<br />`;

        const front = ring.reduce((best, arc) => (arcBV[arc] > arcBV[best] ? arc : best), ring[0]);
        const index = ring.indexOf(front);
        const before = ring[(index + 5) % 6];
        const after = ring[(index + 1) % 6];
        const left = arcBV[before] > arcBV[after] ? before : after;
        const right = left === after ? before : after;
        const rear = ring.filter((arc) => arc !== front && arc !== left && arc !== right);
        const efficiency = this.getHeatDissipation();
        const frontOver = arcHeat[front] > efficiency;
        const leftOver = arcHeat[front] + arcHeat[left] > efficiency;
        const leftFactor = frontOver ? 0.5 : 1;
        const rightFactor = leftOver ? 0.25 : 0.5;
        log += `Heat Efficiency ${efficiency} (heat sink capacity)<br />`;
        const parts: [string, SmallCraftArc[], number][] = [
            ["Front", [front], 1], ["Left Side", [left], leftFactor], ["Right Side", [right], rightFactor], ["Rear", rear, 0.25],
        ];
        let rating = 0;
        for (const [name, arcs, factor] of parts) {
            const value = arcs.reduce((sum, arc) => sum + total(arc), 0);
            rating += value * factor;
            log += `+ ${name} (${arcs.map((arc) => escapeLogText(this.getArcName(arc))).join(", ")}): ${value.toFixed(2)} x ${factor} = ${(value * factor).toFixed(2)}<br />`;
        }
        for (const item of this._equipmentList) {
            if (!item.isAmmo && !this._isWeapon(item) && !item.battleValueDefensive && (item.battleValue || 0) > 0) {
                rating += item.battleValue || 0;
                log += `+ ${escapeLogText(item.name)} = ${item.battleValue}<br />`;
            }
        }
        return { rating, log };
    }

    /**
     * C-bill cost (Aerospace Unit Structural Costs table, TM p.283; final formula p.285). Bridge, computer, life
     * support, sensors, fire control, structure, thruster, landing gear, drive unit, engine, fuel tanks, armor,
     * heat sinks, weapons and ammunition, bays, doors and escape systems, then x (1 + tonnage / 50). Quarters
     * are paid for through life support (TM p.284).
     */
    private _calcCost(): void {
        const people = this._crew + this._passengers;
        const rows: [string, number][] = [
            [`Bridge (200,000 + 10 x ${this._tonnage} t)`, 200000 + 10 * this._tonnage],
            ["Computer", 200000],
            [`Life Support (5,000 x ${people} crew and passengers)`, 5000 * people],
            ["Sensors", 80000],
            ["Fire Control Computer", 100000],
            [`Structural Integrity (100,000 x ${this._structuralIntegrity})`, 100000 * this._structuralIntegrity],
            ["Attitude Thruster", 25000],
            [`Landing Gear (10 x ${this._tonnage} t)`, 10 * this._tonnage],
            [`Drive Unit (500 x Safe Thrust ${this._safeThrust} x ${this._tonnage} t / 100)`, 500 * this._safeThrust * this._tonnage / 100],
            [`Engine (1,000 x ${this.getEngineWeight()} t)`, 1000 * this.getEngineWeight()],
            // The Nekohono'o example prices the fuel with its tanks and pumps (TM p.284).
            this.isDropShip()
                ? [`Fuel Tanks (200 x ${this._fuelTons + this.getFuelPumpWeight()} t with pumps)`, 200 * (this._fuelTons + this.getFuelPumpWeight())]
                : [`Fuel Tanks (200 x ${this._fuelTons} t)`, 200 * this._fuelTons],
            [`Armor (${this._armorType.name}, ${this.getArmorTons()} t)`, this.getArmorTons() * (this._armorType.costMultiplier || 10000)],
        ];
        if (this.isDropShip()) {
            const arcs = SMALL_CRAFT_ARCS.filter((arc) => this.getArcWeaponCount(arc) > 0).length;
            if (arcs > 0) rows.push([`Gunnery Control Systems (10,000 x ${arcs} arcs)`, GUNNERY_CONTROL_COST_PER_ARC * arcs]);
            rows.push(["Docking Collar", DOCKING_COLLAR_COST]);
        }
        if (this.getTotalHeatSinks() > 0) rows.push([`Heat Sinks (${this.getTotalHeatSinks()} ${this._heatSinkType.name})`, this.getTotalHeatSinks() * (this._heatSinkType.cost || 2000)]);
        const equipment = this._equipmentList.reduce((sum, item) => sum + (item.isAmmo ? (item.cbills || 0) * (item.weight || 0) : item.cbills || 0), 0);
        rows.push(["Weapons, Equipment and Ammunition", equipment]);
        for (const mount of this._capitalWeapons) {
            const ammo = Object.keys(mount.shots).reduce((sum, tag) => sum + getCapitalAmmoCost(tag, mount.shots[tag]), 0);
            rows.push([`${mount.weapon.name}${ammo > 0 ? " and ammunition" : ""}`, mount.weapon.cbills + ammo]);
        }
        for (const bay of this._bays) {
            const type = findTransportBayType(bay.tag);
            if (!type) continue;
            const price = type.costPerTon ? type.cost * this.getBayWeight(bay) : type.cost * bay.amount;
            if (price > 0) rows.push([`${type.name} (${bay.amount})`, price]);
        }
        if (this.getBayDoors() > 0) rows.push([`Bay Doors (${this.getBayDoors()})`, this.getBayDoors() * BAY_DOOR_COST]);
        const escape = this._escapePods + this._lifeBoats;
        if (escape > 0) rows.push([`Escape Pods and Lifeboats (${escape})`, escape * ESCAPE_SYSTEM_COST]);
        const subtotal = rows.reduce((sum, [, value]) => sum + value, 0);
        const multiplier = this.isDropShip() ? DROPSHIP_COST_MULTIPLIER[this._shape] : 1 + this._tonnage / 50;
        this._cost = Math.round(subtotal * multiplier);
        const money = (value: number) => Math.round(value).toLocaleString("en-US");
        this._calcLogCost = rows.map(([name, value]) => `${escapeLogText(name)}: ${money(value)}`).join("<br />")
            + `<br />Subtotal ${money(subtotal)} x ${multiplier} (${this.isDropShip() ? `${this.getShapeName()} DropShip` : `1 + ${this._tonnage} / 50`}) = <strong>${money(this._cost)}</strong>`;
    }

    /** The lowest rules level that allows everything on the design. */
    public getRequiredRulesLevel(): number {
        let level = 0;
        for (const item of this._equipmentList) level = Math.max(level, getEquipmentRulesLevel(item));
        for (const mount of this._capitalWeapons) level = Math.max(level, mount.weapon.rulesLevel);
        // Fractional Accounting is "experimental-level unit design" (TO:AUE p.188).
        if (this.usesFractionalAccounting()) level = Math.max(level, EXPERIMENTAL_RULES_LEVEL);
        return level;
    }

    // Alpha Strike --------------------------------------------------------------------------------------------
    // A Small Craft converts as a large aerospace unit: four firing arcs, each with its own damage (Alpha Strike
    // Companion pp.92-102, 115-116), and the large aerospace Point Value (ASC p.144 with errata v1.6). Weapon
    // damage comes from each catalog record's alphaStrike values.

    /** Fewer than 10 shots for each weapon of a kind x 0.75; no ammunition at all x 0 (ASC p.101). */
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

    /**
     * How much of a firing arc's weapons count toward each Alpha Strike arc (ASC p.102). An aerodyne craft keeps
     * its arcs, with rear-facing wing weapons joining the rear. A spheroid's nose takes half of each fore-side
     * arc, each side takes half of its fore-side and half of its aft-side, and the rear takes half of each
     * aft-side arc.
     */
    private _asArcShares(arc: SmallCraftArc): Partial<Record<SmallCraftASArc, number>> {
        if (this.isAerodyne()) {
            if (arc === "leftAft" || arc === "rightAft" || arc === "aft") return { rear: 1 };
            return { [arc]: 1 };
        }
        switch (arc) {
            case "nose": return { nose: 1 };
            case "aft": return { rear: 1 };
            case "left": return { nose: 0.5, left: 0.5 };
            case "right": return { nose: 0.5, right: 0.5 };
            case "leftAft": return { left: 0.5, rear: 0.5 };
            default: return { right: 0.5, rear: 0.5 };
        }
    }

    public getAlphaStrikeStats(): ISmallCraftAlphaStrikeStats {
        let log = "";
        const weapons = this._equipmentList.filter((item) => !item.isAmmo && item.alphaStrike && item.location && item.location !== "hull"
            && ((item.alphaStrike.rangeShort || 0) + (item.alphaStrike.rangeMedium || 0) + (item.alphaStrike.rangeLong || 0) + (item.alphaStrike.rangeExtreme || 0)) > 0);
        const raw: Record<SmallCraftASArc, number[]> = { nose: [0, 0, 0, 0], left: [0, 0, 0, 0], right: [0, 0, 0, 0], rear: [0, 0, 0, 0] };
        for (const weapon of weapons) {
            const damage = this._asWeaponDamage(weapon);
            for (const [arc, share] of Object.entries(this._asArcShares(weapon.location as SmallCraftArc)) as [SmallCraftASArc, number][]) {
                raw[arc] = raw[arc].map((value, index) => value + damage[index] * share);
            }
        }
        // Heat: a craft that fires in several arcs counts every weapon, and anti-missile systems. Once the heat
        // passes the dissipation by 4 or more, damage is base x dissipation / (heat - 4) (ASC pp.115-116).
        const dissipation = this.getHeatDissipation();
        const heat = this._equipmentList.filter((item) => !item.isAmmo).reduce((sum, item) => sum + getLargeCraftASHeat(item), 0);
        const factor = heat - dissipation >= 4 ? dissipation / (heat - 4) : 1;
        log += `Heat ${heat} against ${dissipation} dissipated${factor < 1 ? `: damage x ${factor.toFixed(2)}` : ""}<br />`;
        const arcs = {} as Record<SmallCraftASArc, ISmallCraftASDamageValue[]>;
        for (const arc of SMALL_CRAFT_AS_ARCS) {
            arcs[arc.tag] = raw[arc.tag].map((value) => toLargeCraftASDamage(value * factor));
            log += `${arc.name}: ${raw[arc.tag].map((value) => (value * factor).toFixed(2)).join("/")} = ${arcs[arc.tag].map(formatSmallCraftASDamage).join("/")}<br />`;
        }

        // Small Craft are Size 1 (ASC p.92). Armor / 30, half the Structural Integrity rounded up, and a
        // Threshold of the armor over 3, over the four arcs, rounded up (ASC pp.95-98).
        const size = 1;
        const armor = Math.round(this.getTotalArmorPoints() / 30);
        const structure = Math.ceil(this._structuralIntegrity / 2);
        const threshold = Math.ceil(armor / 3 / 4);
        const move = this._safeThrust;
        log += `Size ${size}, Thrust ${move}${this.isAerodyne() ? "a" : "p"}, Armor ${armor} (${this.getTotalArmorPoints()} / 30), Structure ${structure} (SI ${this._structuralIntegrity} / 2), Threshold ${threshold}<br />`;

        const specials: string[] = ["LG", "SPC"];
        if (this.isAerodyne()) specials.push("VSTOL");
        const pointDefense = Math.ceil(roundUpToTenth(this._equipmentList.reduce((sum, item) => sum + getLargeCraftASPointDefense(item), 0)) - 1e-9);
        if (pointDefense > 0) specials.push(`PNT${pointDefense}`);
        const usesAmmo = weapons.some((item) => !!item.ammoTypes?.length || (item.shotsPerTon ?? 0) > 0);
        if (weapons.length > 0 && !usesAmmo) specials.push("ENE");
        // Cargo Transport: the tons given to general cargo, with the doors of those bays on a spacecraft (ASC
        // p.122). Infantry Transport: the tons given to infantry and battle armor bays (ASC p.125).
        const cargoBays = this._bays.filter((bay) => { const type = findTransportBayType(bay.tag); return !!type && !type.infantry && (type.cargoFactor !== undefined || type.tag === "cargo-container"); });
        const cargo = Math.round(cargoBays.reduce((total, bay) => total + this.getBayWeight(bay), 0) * 1000) / 1000;
        const cargoDoors = cargoBays.reduce((total, bay) => total + bay.doors, 0);
        if (cargo > 0) specials.push(`CT${cargo}${cargoDoors > 0 ? `-D${cargoDoors}` : ""}`);
        const infantry = this._bays.filter((bay) => findTransportBayType(bay.tag)?.infantry).reduce((sum, bay) => sum + this.getBayWeight(bay), 0);
        if (infantry > 0) specials.push(`IT${Math.round(infantry * 10) / 10}`);
        const equipmentSpecials = new Set<string>();
        for (const item of this._equipmentList) {
            if (item.isAmmo) continue;
            for (const code of item.alphaStrike?.specialAbility ?? []) {
                if (!code.includes("#")) equipmentSpecials.add(code);
            }
        }
        specials.push(...[...equipmentSpecials].filter((code) => !specials.includes(code)));
        specials.sort();

        // Point Value (ASC p.144): an aerodyne craft counts the Short, Medium and Long damage of its nose and
        // side arcs; a spheroid counts all four arcs and divides by 4. Minimal damage counts as 0.
        const sum = (arc: SmallCraftASArc) => arcs[arc].slice(0, 3).reduce((total, value) => total + value.damage, 0);
        const offensive = this.isAerodyne() ? sum("nose") + sum("left") + sum("right") : (sum("nose") + sum("left") + sum("right") + sum("rear")) / 4;
        const movementFactor = getLargeCraftMovementFactor(move);
        const defensive = movementFactor + pointDefense + armor * 1.5 + structure + threshold * size / 2;
        let subtotal = offensive + defensive;
        for (const code of equipmentSpecials) subtotal += LARGE_CRAFT_AS_DEFENSIVE_ABILITY_FACTORS[code] ?? 0;
        const pointValue = Math.max(1, Math.round(subtotal));
        log += `Offensive value ${offensive}; Defensive value: Thrust ${movementFactor}${pointDefense ? ` + PNT ${pointDefense}` : ""} + Armor ${armor} x 1.5 + Structure ${structure} + Threshold ${threshold} x Size ${size} / 2 = ${defensive}<br />`;
        log += `Point Value ${pointValue} (provisional: published Small Craft cards run higher than this formula gives)<br />`;

        return { type: "SC", size, movement: move, moveCode: this.isAerodyne() ? "a" : "p", armor, structure, threshold, arcs, pointValue, specialAbilities: specials, calcLog: log };
    }

    // Roster and play ------------------------------------------------------------------------------------------
    // Damage, Damage Thresholds and critical hits (Total Warfare pp.237-240).

    public getPilot(): Pilot { return this._pilot; }

    public setPilot(pilot: Pilot): Pilot {
        this._pilot = pilot;
        return this._pilot;
    }

    public getPilotAdjustedBattleValue(edition?: string): number {
        const multiplier = getSkillMultiplier(this._pilot?.gunnery ?? 4, this._pilot?.piloting ?? 5, "fighter", edition) ?? 1;
        return Math.round(this._battleValue * multiplier);
    }

    public getInPlay(): ISmallCraftInPlay { return this._inPlay; }
    public resetInPlay(): void { this._inPlay = newInPlay(); }
    /** A new turn: nothing is marked as fired yet. Heat stays until the Heat Phase works it off. */
    public turnReset(): void { this._inPlay.firedWeapons = []; }

    public isWeaponFired(uuid: string): boolean { return this._inPlay.firedWeapons.includes(uuid); }

    public setWeaponFired(uuid: string, fired: boolean): void {
        this._inPlay.firedWeapons = this._inPlay.firedWeapons.filter((entry) => entry !== uuid);
        const item = this._equipmentList.find((entry) => entry.uuid === uuid);
        if (fired && item && !item.isAmmo && !this.isWeaponDestroyed(uuid)) this._inPlay.firedWeapons.push(uuid);
    }

    /** Heat this turn will add: the weapons marked as fired. */
    public getHeatGeneratedThisTurn(): number {
        return this._equipmentList.filter((item) => this.isWeaponFired(item.uuid ?? ""))
            .reduce((sum, item) => sum + (item.heatAero ?? item.heat ?? 0), 0);
    }

    public setHeat(heat: number): void { this._inPlay.heat = wholeNumber(heat, 0, 200); }

    /**
     * The Heat Phase: add this turn's heat, take off what the heat sinks dissipate, and list the Avoid Rolls the
     * new heat level calls for (TW p.161). The weapons are cleared for the next turn.
     */
    public applyHeatPhase(): string[] {
        const generated = this.getHeatGeneratedThisTurn();
        const dissipated = this.getHeatDissipation();
        const before = this._inPlay.heat;
        this.setHeat(before + generated - dissipated);
        this._inPlay.firedWeapons = [];
        const heat = this._inPlay.heat;
        const log = [`Heat Phase: ${before} + ${generated} generated - ${dissipated} dissipated = ${heat}`];
        for (const trigger of SMALL_CRAFT_HEAT_TRIGGERS) {
            const reached = trigger.levels.filter((level) => heat >= level);
            if (reached.length) log.push(`${trigger.name}: Avoid Roll for heat ${reached[reached.length - 1]}+ (number on the record sheet's Heat Scale)`);
        }
        return log;
    }

    public getPendingWeaponCritical(): (ISmallCraftPendingWeaponCritical & { weapons: IEquipmentItem[] }) | null {
        const pending = this._inPlay.pendingWeaponCriticals[0];
        return pending ? { ...pending, weapons: this._workingWeapons(pending.facing) } : null;
    }

    private _workingWeapons(facing: SmallCraftFacing): IEquipmentItem[] {
        return this._equipmentList.filter((item) => !item.isAmmo && item.location && item.location !== "hull"
            && SMALL_CRAFT_ARC_FACING[item.location as SmallCraftArc] === facing && !this.isWeaponDestroyed(item.uuid ?? ""));
    }

    /** Destroys the chosen weapon for the waiting critical hit. False when it is not a working weapon there. */
    public resolvePendingWeaponCritical(uuid: string): boolean {
        const pending = this.getPendingWeaponCritical();
        if (!pending || !pending.weapons.some((item) => item.uuid === uuid)) return false;
        this.setWeaponDestroyed(uuid, true);
        this._inPlay.pendingWeaponCriticals.shift();
        return true;
    }

    public skipPendingWeaponCritical(): void { this._inPlay.pendingWeaponCriticals.shift(); }

    public getCurrentArmor(): number {
        return SMALL_CRAFT_FACINGS.reduce((sum, facing) => sum + Math.max(0, this._armorAllocation[facing] - this._inPlay.armorDamage[facing]), 0);
    }

    public getArmorPercentage(): number {
        const total = this.getTotalArmorPoints();
        return total > 0 ? Math.round(this.getCurrentArmor() / total * 100) : 0;
    }

    public getCurrentStructure(): number { return Math.max(0, this._structuralIntegrity - this._inPlay.structureDamage); }

    public getStructurePercentage(): number {
        return Math.round(this.getCurrentStructure() / Math.max(1, this._structuralIntegrity) * 100);
    }

    /** Marks armor damage on a facing directly (a pip clicked on the diagram). */
    public setArmorDamage(facing: SmallCraftFacing, points: number): void {
        this._inPlay.armorDamage[facing] = wholeNumber(points, 0, this._armorAllocation[facing]);
    }

    public setStructureDamage(points: number): void {
        this._inPlay.structureDamage = wholeNumber(points, 0, this._structuralIntegrity);
    }

    /** Sets the boxes crossed off on a critical track. */
    public setCriticalHits(track: SmallCraftCriticalTrack, hits: number): void {
        const boxes = SMALL_CRAFT_CRITICAL_TRACKS.find((entry) => entry.tag === track)?.boxes ?? 3;
        this._inPlay[track] = wholeNumber(hits, 0, boxes);
    }

    public setGearDamaged(damaged: boolean): void { this._inPlay.gear = damaged === true; }
    public setLifeSupportDamaged(damaged: boolean): void { this._inPlay.lifeSupport = damaged === true; }
    public setDoorsDamaged(count: number): void { this._inPlay.doorsDamaged = wholeNumber(count, 0, this.getBayDoors()); }
    public setCargoLostPercent(percent: number): void { this._inPlay.cargoLostPercent = wholeNumber(percent, 0, 100); }

    public isWeaponDestroyed(uuid: string): boolean { return this._inPlay.destroyedWeapons.includes(uuid); }

    public setWeaponDestroyed(uuid: string, destroyed: boolean): void {
        this._inPlay.destroyedWeapons = this._inPlay.destroyedWeapons.filter((entry) => entry !== uuid);
        if (destroyed && this._equipmentList.some((item) => item.uuid === uuid)) {
            this._inPlay.destroyedWeapons.push(uuid);
            this._inPlay.firedWeapons = this._inPlay.firedWeapons.filter((entry) => entry !== uuid);
        }
    }

    /** Six engine hits destroy the engine of a craft that is not a fighter (TW p.240). */
    public isEngineDestroyed(): boolean { return this._inPlay.engine >= 6; }

    /** Out of the fight: no Structural Integrity left, a fuel explosion or a sixth crew hit. */
    public isDestroyed(): boolean {
        return this.getCurrentStructure() <= 0 || this._inPlay.fuelExploded || this._inPlay.crewHits >= 6;
    }

    public isDamaged(): boolean {
        const play = this._inPlay;
        return this.getCurrentArmor() < this.getTotalArmorPoints() || play.structureDamage > 0 || play.avionics > 0 || play.engine > 0
            || play.fcs > 0 || play.sensors > 0 || play.crewHits > 0 || play.leftThruster > 0 || play.rightThruster > 0 || play.gear
            || play.lifeSupport || play.doorsDamaged > 0 || play.cargoLostPercent > 0 || play.fuelExploded
            || play.destroyedWeapons.length > 0 || play.heat > 0;
    }

    /** Safe Thrust now: 1 less for each engine hit (TW p.240). */
    public getCurrentSafeThrust(): number {
        return this.isEngineDestroyed() ? 0 : Math.max(0, this._safeThrust - this._inPlay.engine);
    }

    public getCurrentMaxThrust(): number { return Math.ceil(this.getCurrentSafeThrust() * 1.5); }

    /**
     * To-hit modifier from damage: +2 per FCS hit, +1 per sensor hit (+5 once the sensors are destroyed) and +1
     * per crew hit (TW pp.237, 240). Null when a third FCS hit stops all weapon attacks.
     */
    public getDamageToHitModifier(): number | null {
        const play = this._inPlay;
        if (play.fcs >= 3) return null;
        return play.fcs * 2 + (play.sensors >= 3 ? 5 : play.sensors) + play.crewHits;
    }

    /** Control Roll modifier: avionics +1, +2, then +5 when destroyed; +2 for failed life support (TW pp.239-240). */
    public getControlRollModifier(): number {
        return (this._inPlay.avionics >= 3 ? 5 : this._inPlay.avionics) + (this._inPlay.lifeSupport ? 2 : 0);
    }

    private _applyCritical(critical: SmallCraftCritical, facing: SmallCraftFacing, damage: number, random: () => number, fuelRoll?: number): string {
        const play = this._inPlay;
        const d6 = () => Math.floor(random() * 6) + 1;
        const facingName = this.getFacingName(facing);
        switch (critical) {
            case "avionics":
                play.avionics = Math.min(3, play.avionics + 1);
                return `Avionics hit ${play.avionics}: Control Rolls at +${this._inPlay.avionics >= 3 ? 5 : this._inPlay.avionics}; make a Control Roll now`;
            case "control":
                return "Control hit: make a Control Roll, or go out of control";
            case "crew":
                play.crewHits = Math.min(6, play.crewHits + 1);
                return play.crewHits >= 6 ? "Crew hit 6: the crew is disabled" : `Crew hit ${play.crewHits}: +1 to hit for each; make a Consciousness Roll`;
            case "engine":
                play.engine = Math.min(6, play.engine + 1);
                return play.engine >= 6 ? "Engine hit 6: the engine is destroyed"
                    : `Engine hit ${play.engine}: Safe Thrust -1 (now ${this.getCurrentSafeThrust()}/${this.getCurrentMaxThrust()})`;
            case "fcs":
                play.fcs = Math.min(3, play.fcs + 1);
                return play.fcs >= 3 ? "FCS hit 3: the fire control system is destroyed; no weapon attacks" : `FCS hit ${play.fcs}: +2 to hit for each`;
            case "sensors":
                play.sensors = Math.min(3, play.sensors + 1);
                return play.sensors >= 3 ? "Sensor hit 3: the sensors are destroyed; +5 to hit" : `Sensor hit ${play.sensors}: +1 to hit for each`;
            case "gear":
                play.gear = true;
                return "Landing gear damaged: +5 to Control Rolls when landing";
            case "lifeSupport":
                play.lifeSupport = true;
                return "Life support fails: +2 to all Control Rolls";
            case "thruster": {
                const track = facing === "left" ? "leftThruster" : "rightThruster";
                play[track] = Math.min(4, play[track] + 1);
                const away = facing === "left" ? "right" : "left";
                return play[track] >= 4 ? `${facingName} thruster hit 4: the thrusters are out; no turns to the ${away}`
                    : `${facingName} thruster hit ${play[track]}: turns to the ${away} cost ${play[track]} more`;
            }
            case "door":
                if (play.doorsDamaged >= this.getBayDoors()) return "Door hit: no working bay door, no effect";
                play.doorsDamaged += 1;
                return "Door hit: one bay door, picked at random, cannot be used for the rest of the scenario";
            case "cargo": {
                const percent = Math.ceil(damage / (2 * Math.max(1, this._structuralIntegrity)) * 100);
                play.cargoLostPercent = Math.min(100, play.cargoLostPercent + percent);
                return `Cargo hit: ${percent} percent of the cargo is destroyed (damage ${damage} / twice the Structural Integrity); roll 1D6, 1-3 general cargo, 4-6 carried units`;
            }
            case "kfBoom":
                return "K-F Boom hit: a Small Craft has none, no effect";
            case "dockingCollar":
                return "Docking Collar hit: a Small Craft has none, no effect";
            case "fuel": {
                const roll = fuelRoll ?? d6() + d6();
                if (roll >= 10) {
                    play.fuelExploded = true;
                    return `Fuel tank hit, roll ${roll}: the fuel explodes and the craft is destroyed`;
                }
                return `Fuel tank hit, roll ${roll}: no explosion (10+ explodes)`;
            }
            default: {
                // Weapons already waiting on an earlier choice on this facing are spoken for.
                const working = this._workingWeapons(facing);
                const waiting = play.pendingWeaponCriticals.filter((pending) => pending.facing === facing).length;
                if (working.length - waiting <= 0) return `Weapon hit on the ${facingName}: no working weapon there, no effect`;
                if (working.length === 1) {
                    this.setWeaponDestroyed(working[0].uuid ?? "", true);
                    return `Weapon hit on the ${facingName}: ${working[0].name} is destroyed`;
                }
                const chooser = d6();
                play.pendingWeaponCriticals.push({ facing, chooser: chooser <= 3 ? "controlling" : "attacking" });
                return `Weapon hit on the ${facingName}, roll ${chooser}: the ${chooser <= 3 ? "controlling" : "attacking"} player chooses a weapon there to mark destroyed`;
            }
        }
    }

    /**
     * Resolves one hit (one Attack Value grouping): hit location by attack direction and 2D6, armor damage, half
     * of any excess (rounded down) against Structural Integrity, then a critical hit check (8+ on 2D6) for each
     * of: damage over the facing's Damage Threshold, any Structural Integrity damage, and a natural 12 on the
     * to-hit roll (TW pp.237-239). Pass criticalRolls, sideRoll and fuelRoll to use physical dice.
     */
    public resolveAttack(roll: number, direction: SmallCraftAttackDirection, damage: number,
        options: { natural12?: boolean; sideRoll?: number; criticalRolls?: number[]; fuelRoll?: number } = {}, random: () => number = Math.random): string[] {
        const d6 = () => Math.floor(random() * 6) + 1;
        const log: string[] = [];
        const points = Math.max(0, Math.floor(Number.isFinite(damage) ? damage : 0));
        const hit = getSmallCraftHitLocation(roll, direction, options.sideRoll ?? d6());
        const facingName = this.getFacingName(hit.facing);
        const remaining = Math.max(0, this._armorAllocation[hit.facing] - this._inPlay.armorDamage[hit.facing]);
        const armorDamage = Math.min(remaining, points);
        this._inPlay.armorDamage[hit.facing] += armorDamage;
        const structureDamage = Math.min(this.getCurrentStructure(), Math.floor((points - armorDamage) / 2));
        this._inPlay.structureDamage += structureDamage;
        log.push(`Hit location ${roll}: ${facingName} / ${SMALL_CRAFT_CRITICAL_NAMES[hit.critical]} takes ${armorDamage} armor`
            + (points > armorDamage ? ` and ${structureDamage} Structural Integrity (half of the ${points - armorDamage} left over, rounded down)` : ""));
        if (this.getCurrentStructure() <= 0) {
            log.push("Structural Integrity is gone: the craft is destroyed");
            return log;
        }
        const reasons: string[] = [];
        const threshold = this.getDamageThresholds()[hit.facing];
        if (points > threshold) reasons.push(`damage ${points} over the Damage Threshold of ${threshold}`);
        if (structureDamage >= 1) reasons.push("Structural Integrity damage");
        if (options.natural12) reasons.push("a natural 12 to hit");
        reasons.forEach((reason, index) => {
            const check = options.criticalRolls?.[index] ?? d6() + d6();
            if (check >= 8) log.push(`Critical check for ${reason}: ${check}. ${this._applyCritical(hit.critical, hit.facing, points, random, options.fuelRoll)}`);
            else log.push(`Critical check for ${reason}: ${check}, no critical hit (8+ needed)`);
        });
        return log;
    }

    // Saving --------------------------------------------------------------------------------------------------

    public export(noInPlayVariables: boolean = false): ISmallCraftExport {
        return {
            ...(noInPlayVariables ? {} : {
                pilot: this._pilot.export(),
                inPlay: {
                    ...this._inPlay, armorDamage: { ...this._inPlay.armorDamage }, destroyedWeapons: [...this._inPlay.destroyedWeapons],
                    firedWeapons: [...this._inPlay.firedWeapons], pendingWeaponCriticals: this._inPlay.pendingWeaponCriticals.map((entry) => ({ ...entry })),
                },
            }),
            version: 1,
            uuid: this._uuid,
            lastUpdated: this.lastUpdated,
            name: this._name,
            ...(this._rulesEdition !== DEFAULT_RULES_EDITION ? { rulesEdition: this._rulesEdition } : {}),
            model: this._model,
            shape: this._shape,
            craftType: this._craftType,
            military: this._military,
            tonnage: this._tonnage,
            tech: this._tech.tag,
            engineTech: this._engineTech,
            era: this._era.tag,
            safeThrust: this._safeThrust,
            fuelTons: this._fuelTons,
            structuralIntegrity: this._structuralIntegrity,
            armorType: this._armorType.tag,
            armorTons: this.getArmorTons(),
            ...(this.usesFractionalAccounting() ? { weightAccounting: "fractional" as const, fractionalArmorPoints: this._fractionalArmorPoints } : {}),
            armorAllocation: { ...this._armorAllocation },
            heatSinkType: this._heatSinkType.tag,
            additionalHeatSinks: this._additionalHeatSinks,
            crew: this._crew,
            officers: this._officers,
            passengers: this._passengers,
            quarters: { ...this._quarters },
            bays: this._bays.map((bay) => ({ ...bay })),
            escapePods: this._escapePods,
            lifeBoats: this._lifeBoats,
            equipment: this._equipmentList.map((item) => ({
                tag: item.tag, location: item.location, uuid: item.uuid,
                ...(this.canSetAmmoBinShots(item) && (item.weight || 0) < 1 ? { shots: this.getAmmoBinShots(item) } : {}),
            })),
            capitalWeapons: this._capitalWeapons.map((mount) => ({ tag: mount.weapon.tag, location: mount.location, uuid: mount.uuid, shots: { ...mount.shots } })),
        };
    }

    public exportJSON(): string {
        return JSON.stringify(this.export());
    }

    /** The pilot and in-play damage of a saved craft, field by field through the setters. */
    private _importPlay(pilot: unknown, inPlay: unknown): void {
        this._pilot = new Pilot();
        if (isPlainObject(pilot)) {
            this._pilot.name = savedString(pilot.name).slice(0, 200);
            this._pilot.piloting = Math.floor(savedNumber(pilot.piloting, 5, 0, 8));
            this._pilot.gunnery = Math.floor(savedNumber(pilot.gunnery, 4, 0, 8));
            this._pilot.wounds = Math.floor(savedNumber(pilot.wounds, 0, 0, 6));
        }
        this._inPlay = newInPlay();
        if (!isPlainObject(inPlay)) return;
        const armor = isPlainObject(inPlay.armorDamage) ? inPlay.armorDamage : {};
        for (const facing of SMALL_CRAFT_FACINGS) this.setArmorDamage(facing, savedNumber(armor[facing], 0, 0, 10000));
        this.setStructureDamage(savedNumber(inPlay.structureDamage, 0, 0, 1000));
        for (const track of SMALL_CRAFT_CRITICAL_TRACKS) this.setCriticalHits(track.tag, savedNumber(inPlay[track.tag], 0, 0, 6));
        this.setGearDamaged(inPlay.gear === true);
        this.setLifeSupportDamaged(inPlay.lifeSupport === true);
        this.setDoorsDamaged(savedNumber(inPlay.doorsDamaged, 0, 0, 10));
        this.setCargoLostPercent(savedNumber(inPlay.cargoLostPercent, 0, 0, 100));
        this._inPlay.fuelExploded = inPlay.fuelExploded === true;
        const destroyed = Array.isArray(inPlay.destroyedWeapons) ? inPlay.destroyedWeapons.slice(0, MAX_SMALL_CRAFT_EQUIPMENT) : [];
        for (const uuid of destroyed) if (typeof uuid === "string") this.setWeaponDestroyed(uuid, true);
        this.setHeat(savedNumber(inPlay.heat, 0, 0, 200));
        const fired = Array.isArray(inPlay.firedWeapons) ? inPlay.firedWeapons.slice(0, MAX_SMALL_CRAFT_EQUIPMENT) : [];
        for (const uuid of fired) if (typeof uuid === "string") this.setWeaponFired(uuid, true);
        const pending = Array.isArray(inPlay.pendingWeaponCriticals) ? inPlay.pendingWeaponCriticals.slice(0, 20) : [];
        for (const entry of pending) {
            if (!isPlainObject(entry)) continue;
            const facing = SMALL_CRAFT_FACINGS.find((candidate) => candidate === entry.facing);
            if (facing) this._inPlay.pendingWeaponCriticals.push({ facing, chooser: entry.chooser === "attacking" ? "attacking" : "controlling" });
        }
    }

    /** Problems found in the last import: fields that were invalid and replaced, or entries that were dropped. */
    public getImportIssues(): string[] { return this._importIssues; }

    /**
     * Loads a saved Small Craft. Saves can come from other people's backup files, so every field is type-checked,
     * allowlisted or clamped through the setters, and anything dropped is recorded in getImportIssues().
     * Never spread or Object.assign the parsed JSON into class state.
     */
    public importJSON(json: string): void {
        this._importIssues = [];
        const issue = (text: string) => { if (this._importIssues.length < 50) this._importIssues.push(text); };
        try {
            const parsed: unknown = JSON.parse(json);
            if (!isPlainObject(parsed)) {
                issue("The saved Small Craft is not an object");
                return;
            }
            const saved = parsed as Partial<Record<keyof ISmallCraftExport, unknown>>;
            this._uuid = savedString(saved.uuid).slice(0, 100) || generateUUID();
            const updated = typeof saved.lastUpdated === "string" || typeof saved.lastUpdated === "number" ? new Date(saved.lastUpdated) : new Date();
            this.lastUpdated = Number.isNaN(updated.getTime()) ? new Date() : updated;
            for (const key of ["name", "model"] as const) {
                if (saved[key] !== undefined && typeof saved[key] !== "string") issue(`Ignored a ${key} that is not text`);
            }
            this.setName(savedString(saved.name));
            this._rulesEdition = getSelectableRulesEditionTag(saved.rulesEdition, "small-craft");
            this.setModel(savedString(saved.model));
            if (saved.shape !== undefined && saved.shape !== "aerodyne" && saved.shape !== "spheroid") issue("Ignored an unknown shape");
            this._shape = saved.shape === "spheroid" ? "spheroid" : "aerodyne";
            if (saved.craftType !== undefined && saved.craftType !== "smallCraft" && saved.craftType !== "dropShip") issue("Ignored an unknown craft type");
            this._craftType = saved.craftType === "dropShip" ? "dropShip" : "smallCraft";
            this._military = saved.military === true;
            this.setTech(savedString(saved.tech));
            this.setEngineTechBase(savedString(saved.engineTech));
            this.setEra(savedString(saved.era));
            if (saved.tonnage !== undefined && typeof saved.tonnage !== "number") issue("Ignored a tonnage that is not a number");
            this.setTonnage(savedNumber(saved.tonnage, this.getMaxTonnage(), this.getMinTonnage(), this.getMaxTonnage()));
            this.setSafeThrust(savedNumber(saved.safeThrust, 4, 1, 20));
            this.setFuelTons(savedNumber(saved.fuelTons, 10, 0, this._tonnage));
            const integrity = savedNumber(saved.structuralIntegrity, this.getMinStructuralIntegrity(), 0, 10000);
            this.setStructuralIntegrity(integrity);
            if (this._structuralIntegrity !== Math.floor(integrity)) issue(`Structural Integrity set to ${this._structuralIntegrity}`);
            const armorTag = savedString(saved.armorType);
            this.setArmorType(armorTag);
            if (armorTag && this._armorType.tag !== armorTag) issue(`Replaced armor "${armorTag.slice(0, 40)}" with ${this._armorType.name}`);
            this.setArmorTons(savedNumber(saved.armorTons, 0, 0, 10000));
            // Fractional Accounting is kept from the save whatever the rules level, so the design loads as built.
            this._weightAccounting = saved.weightAccounting === "fractional" ? "fractional" : "standard";
            if (this.usesFractionalAccounting()) this.setPurchasedArmorPoints(savedNumber(saved.fractionalArmorPoints, 0, 0, 100000));
            this._armorAllocation = emptyArmor();
            const armor = isPlainObject(saved.armorAllocation) ? saved.armorAllocation : {};
            for (const facing of SMALL_CRAFT_FACINGS) this.setArmorAllocation(facing, savedNumber(armor[facing], 0, 0, 10000));
            this.setHeatSinkType(savedString(saved.heatSinkType));
            this.setAdditionalHeatSinks(savedNumber(saved.additionalHeatSinks, 0, 0, SMALL_CRAFT_MAX_TONNAGE));

            this._equipmentList = [];
            if (saved.equipment !== undefined && !Array.isArray(saved.equipment)) issue("Ignored an equipment list that is not a list");
            const entries = Array.isArray(saved.equipment) ? saved.equipment : [];
            if (entries.length > MAX_SMALL_CRAFT_EQUIPMENT) issue(`Kept the first ${MAX_SMALL_CRAFT_EQUIPMENT} of ${entries.length} equipment entries`);
            const catalog = this._catalog();
            const pendingShots: { uuid: string | undefined; shots: number }[] = [];
            for (const entry of entries.slice(0, MAX_SMALL_CRAFT_EQUIPMENT)) {
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
                if (item.isAmmo && typeof entry.shots === "number" && Number.isFinite(entry.shots)) pendingShots.push({ uuid: item.uuid, shots: entry.shots });
            }
            this._capitalWeapons = [];
            if (saved.capitalWeapons !== undefined && !Array.isArray(saved.capitalWeapons)) issue("Ignored a capital weapon list that is not a list");
            for (const entry of (Array.isArray(saved.capitalWeapons) ? saved.capitalWeapons : []).slice(0, MAX_SMALL_CRAFT_CAPITAL_WEAPONS)) {
                const weapon = isPlainObject(entry) && typeof entry.tag === "string" ? findCapitalWeapon(entry.tag) : undefined;
                if (!isPlainObject(entry) || !weapon) {
                    issue("Skipped a capital weapon that could not be read");
                    continue;
                }
                this._capitalWeapons.push(this._newCapitalMount(weapon, entry.location, entry.shots, entry.uuid));
            }
            // After every weapon is aboard, so each bin can find the weapon it feeds; clamped to one ton.
            // A saved design keeps the accounting it was saved with, battle armor items or not.
            this._hadBattleArmorEquipment = this.defaultsToFractionalAccounting();
            for (const pending of pendingShots) this.setAmmoBinShots(pending.uuid, pending.shots);

            this._crew = Math.floor(savedNumber(saved.crew, this.getBaseCrew(), 0, this._maxPeople()));
            this._officers = Math.floor(savedNumber(saved.officers, 0, 0, this._maxPeople()));
            this.setPassengers(savedNumber(saved.passengers, 0, 0, this._maxPeople()));
            this._quarters = emptyQuarters();
            const quarters = isPlainObject(saved.quarters) ? saved.quarters : {};
            for (const type of quartersTypes) this.setQuarters(type.tag, savedNumber(quarters[type.tag], 0, 0, this._maxPeople()));
            this._bays = [];
            if (saved.bays !== undefined && !Array.isArray(saved.bays)) issue("Ignored a bay list that is not a list");
            for (const entry of (Array.isArray(saved.bays) ? saved.bays : []).slice(0, MAX_SMALL_CRAFT_BAYS)) {
                if (!isPlainObject(entry) || typeof entry.tag !== "string" || !findTransportBayType(entry.tag)) {
                    issue("Skipped a transport bay that could not be read");
                    continue;
                }
                if (this.addBay(entry.tag, savedNumber(entry.amount, 1, 0, this.getMaxTonnage()))) {
                    this.setBay(this._bays.length - 1, savedNumber(entry.amount, 1, 0, this.getMaxTonnage()), savedNumber(entry.doors, 0, 0, 20));
                }
            }
            this.setEscapePods(savedNumber(saved.escapePods, 0, 0, this.isDropShip() ? 1000 : 20));
            this.setLifeBoats(savedNumber(saved.lifeBoats, 0, 0, this.isDropShip() ? 1000 : 20));
            this._clampToRules();
            this._importPlay(saved.pilot, saved.inPlay);
            this._calc();
        } catch (error) {
            issue("The saved Small Craft could not be read completely");
            console.error("SmallCraft importJSON failed:", error);
        }
    }
}
