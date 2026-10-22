import { generateUUID } from "../utils/generateUUID";
import { IAssignedQuirk, IQuirkTargets, QuirkUnitType } from "../data/quirk-interfaces";
import { getQuirkIssues, getQuirkTargets } from "../data/quirk-registry";
import { QuirkList } from "./quirk-list";
import { DEFAULT_RULES_EDITION, getSelectableRulesEditionTag } from "../data/rules-editions";
import { aerospaceArmorTypes, getAerospaceArmorPointsPerTon } from "../data/aerospace-armor-types";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { btTechOptions } from "../data/tech-options";
import { btEraOptions, findEraByTag, getClosestEraForTech, getErasForTech } from "../data/era-options";
import SmallCraft from "./small-craft";
import Pilot, { IPilot } from "./pilot";
import { getSkillMultiplier } from "../data/skill-multipliers";
import { CAPITAL_MISSILE_CRITICAL_CHANCE, CAPITAL_SHIP_CRITICAL_NAMES, CapitalShipAttackDirection, ICapitalShipHit, getCapitalShipHitLocation } from "../data/capital-ship-hit-tables";
import { CUSTOM_HOMEBREW_RULES_LEVEL, getArtemisLauncherBattleValue, getAmmoBattleValuePerTon, getCompatibleAmmo, getEquipmentRulesLevel, getEffectiveIntroduction, getEquipmentListByTech, getWeaponShotsPerTon, isEquipmentOffered } from "../data/equipment-registry";
import { findByTag } from "../data/tag-match";
import { sizeDroneSystems } from "../data/variable-equipment";
import { IWeaponBay, capitalBayWeapon, groupWeaponBays, standardBayWeapon } from "../data/weapon-bays";
import { ADVANCED_RULES_LEVEL } from "../data/rules-level-options";
import {
    CAPITAL_WEAPON_ALPHA_STRIKE, ILargeCraftASDamageValue, LARGE_CRAFT_AS_ATTACK_CLASSES, LARGE_CRAFT_AS_DEFENSIVE_ABILITY_FACTORS, LargeCraftASAttackClass,
    formatLargeCraftASDamage, getCapitalASArmor, getCapitalShipASSize, getLargeCraftASHeat, getLargeCraftASPointDefense, getLargeCraftASThreshold,
    getLargeCraftMovementFactor, roundUpToTenth, toLargeCraftASDamage,
} from "../data/large-craft-alpha-strike";
import { IAerospaceArmorType, ICapitalWeapon, IEquipmentItem, IEras, IHeatSync, ITechDates, ITechOptions } from "../data/data-interfaces";
import { CAPITAL_WEAPON_CATALOG, findCapitalWeapon, getCapitalAmmoBattleValue, getCapitalAmmoCost, getCapitalAmmoTags, getCapitalAmmoTons } from "../data/capital-weapon-helpers";
import {
    BAY_DOOR_COST, ESCAPE_SYSTEM_COST, ESCAPE_SYSTEM_TONS, QuartersTag, findTransportBayType, quartersTypes,
} from "../data/small-craft-construction";
import {
    ADVANCED_AEROSPACE_ARC_NAMES, ADVANCED_AEROSPACE_BV_ARMOR_FACTOR, ADVANCED_AEROSPACE_BV_SI_FACTOR, ADVANCED_AEROSPACE_FACINGS, ADVANCED_AEROSPACE_MAX_BAY_CAPITAL_DAMAGE, ADVANCED_AEROSPACE_MAX_SI_FACTOR,
    ADVANCED_AEROSPACE_OPPOSITE_ARC, AdvancedAerospaceArc, AdvancedAerospaceFacing, AdvancedAerospaceType, DOCKING_COLLAR_TONS, GRAV_DECKS,
    GravDeckSize, advancedAerospaceTypes, getAdvancedAerospaceArcs, getAdvancedAerospaceArmorPoints, getAdvancedAerospaceBaseCrew,
    getAdvancedAerospaceControlsWeight, getAdvancedAerospaceCostMultiplier, getAdvancedAerospaceEngineWeight, getAdvancedAerospaceFireControlWeight,
    getAdvancedAerospaceFreeArmorPerFacing, getAdvancedAerospaceFreeHeatSinks, getAdvancedAerospaceFuelPointsPerTon, getAdvancedAerospaceFuelPumpWeight,
    getAdvancedAerospaceMaxArmorTons, getAdvancedAerospaceMaxBayDoors, getAdvancedAerospaceMaxThrust, getAdvancedAerospaceMinimumGunners,
    getAdvancedAerospaceMinimumOfficers, getAdvancedAerospaceStrategicFuelPerDay, getAdvancedAerospaceStructuralCosts, getAdvancedAerospaceStructureWeight,
    getAdvancedAerospaceType, getJumpSailIntegrity, getJumpSailWeight, getKFDriveIntegrity, getKFDriveWeight, getLithiumFusionBatteryWeight,
    getAdvancedAerospaceArcRing, getAdvancedAerospaceBVMaxThrust, getAdvancedAerospaceFrontArcCandidates,
    getMaxDockingCollars, getMaxGravDecks, getMonitorCarrierCollars, getMonitorKeelWeight, MONITOR_CREW_MULTIPLIER,
} from "../data/advanced-aerospace-construction";

// JumpShip, WarShip and space station construction (Strategic Operations: Advanced Aerospace Rules pp.130-149).
// The steps follow the DropShip ones (TM pp.180-197), so quarters, transport bays, escape systems, capital weapons and
// the aerospace armor catalog are shared with SmallCraft; what differs (six facings, up to eight firing arcs, the
// K-F drive, docking collars, grav decks) comes from advanced-aerospace-construction.ts.

export const MAX_CAPITAL_SHIP_EQUIPMENT = 1000;
export const MAX_CAPITAL_SHIP_CAPITAL_WEAPONS = 500;
export const MAX_CAPITAL_SHIP_BAYS = 50;
export const MAX_CAPITAL_SHIP_PEOPLE = 100000;
export const MAX_CAPITAL_SHIP_BAY_UNITS = 10000;
export const MAX_CAPITAL_SHIP_SHOTS = 99999;
export const MAX_CAPITAL_SHIP_SAFE_THRUST = 20;
/** Every ammunition-fed weapon carries at least 10 shots (SO:AA p.142). */
export const CAPITAL_SHIP_MIN_SHOTS = 10;
/** A space station carried by a JumpShip has a K-F boom and weighs no more than 100,000 tons (SO:AA p.139). */
export const KF_BOOM_STATION_MAX_TONS = 100000;

export type CapitalShipASArc = "front" | "left" | "right" | "rear";
export const CAPITAL_SHIP_AS_ARCS: { tag: CapitalShipASArc; name: string }[] = [
    { tag: "front", name: "Front" },
    { tag: "left", name: "Left" },
    { tag: "right", name: "Right" },
    { tag: "rear", name: "Rear" },
];
export type CapitalShipASType = "JS" | "WS" | "SS";
export interface ICapitalShipAlphaStrikeStats {
    type: CapitalShipASType;
    size: number;
    /** Thrust; 0.2 with "k" for a station-keeping drive. */
    movement: number;
    moveCode: "" | "k";
    armor: number;
    structure: number;
    threshold: number;
    /** Damage at Short, Medium, Long and Extreme by arc and attack type (STD, CAP, SCAP, MSL). */
    arcs: Record<CapitalShipASArc, Record<LargeCraftASAttackClass, ILargeCraftASDamageValue[]>>;
    pointValue: number;
    specialAbilities: string[];
    calcLog: string;
}

export type CapitalShipCriticalTrack = "avionics" | "cic" | "sensors" | "crewHits" | "leftThruster" | "rightThruster" | "engine";
/** Critical damage tracks and how many boxes each has (SO:AA pp.10-11; TW pp.239-240). */
export const CAPITAL_SHIP_CRITICAL_TRACKS: { tag: CapitalShipCriticalTrack; name: string; max: number }[] = [
    { tag: "avionics", name: "Avionics", max: 3 },
    { tag: "cic", name: "CIC", max: 3 },
    { tag: "sensors", name: "Sensors", max: 3 },
    { tag: "crewHits", name: "Crew", max: 6 },
    { tag: "leftThruster", name: "Left Thrusters", max: 4 },
    { tag: "rightThruster", name: "Right Thrusters", max: 4 },
    { tag: "engine", name: "Engine", max: 6 },
];
export interface ICapitalShipPendingWeaponCritical {
    arc: AdvancedAerospaceArc;
    /** Who picks the bay: 1-3 on 1D6 the controlling player, 4-6 the attacker (TW p.240). */
    chooser: "controlling" | "attacking";
}
export interface ICapitalShipInPlay {
    armorDamage: ICapitalShipArmorAllocation;
    structureDamage: number;
    avionics: number;
    cic: number;
    sensors: number;
    crewHits: number;
    leftThruster: number;
    rightThruster: number;
    engine: number;
    lifeSupport: boolean;
    kfDriveDamage: number;
    dockingCollarsDamaged: number;
    gravDecksDamaged: number;
    doorsDamaged: number;
    cargoLostPercent: number;
    fuelExploded: boolean;
    /** Weapon bays lost to critical hits, as "arc:index" of getArcWeaponBays(). */
    destroyedBays: string[];
    firedArcs: AdvancedAerospaceArc[];
    pendingWeaponCriticals: ICapitalShipPendingWeaponCritical[];
}
const newCapitalShipInPlay = (): ICapitalShipInPlay => ({
    armorDamage: { nose: 0, foreLeft: 0, foreRight: 0, aftLeft: 0, aftRight: 0, aft: 0 }, structureDamage: 0, avionics: 0, cic: 0, sensors: 0,
    crewHits: 0, leftThruster: 0, rightThruster: 0, engine: 0, lifeSupport: false, kfDriveDamage: 0, dockingCollarsDamaged: 0,
    gravDecksDamaged: 0, doorsDamaged: 0, cargoLostPercent: 0, fuelExploded: false, destroyedBays: [], firedArcs: [], pendingWeaponCriticals: [],
});

export interface ICapitalShipMount {
    uuid: string;
    weapon: ICapitalWeapon;
    location?: AdvancedAerospaceArc;
    /** Shots by ammunition tag; an AR-10 carries several kinds of missile. */
    shots: Record<string, number>;
}
export type ICapitalShipArmorAllocation = Record<AdvancedAerospaceFacing, number>;
export type ICapitalShipQuarters = Record<QuartersTag, number>;
export type ICapitalShipGravDecks = Record<GravDeckSize, number>;
export interface ICapitalShipBay {
    tag: string;
    amount: number;
    doors: number;
}
export interface ICapitalShipEquipmentExport {
    tag: string;
    location?: string;
    uuid?: string;
}
export interface ICapitalShipMountExport {
    tag: string;
    location?: string;
    uuid?: string;
    shots?: Record<string, number>;
}

export interface ICapitalShipExport {
    pilot?: IPilot;
    inPlay?: ICapitalShipInPlay;
    /** The rules edition it is built under (rules-editions.ts); absent means Total Warfare. */
    rulesEdition?: string;
    version: number;
    uuid: string;
    quirks?: IAssignedQuirk[];
    lastUpdated: Date;
    name: string;
    model: string;
    shipType: AdvancedAerospaceType;
    tonnage: number;
    tech: string;
    era: string;
    safeThrust: number;
    structuralIntegrity: number;
    fuelTons: number;
    lithiumFusionBattery: boolean;
    kfBoom: boolean;
    /** Custom Homebrew: a WarShip built without a K-F drive. Older saves have no field. */
    monitor?: boolean;
    armorType: string;
    armorTons: number;
    armorAllocation: ICapitalShipArmorAllocation;
    heatSinkType: string;
    additionalHeatSinks: number;
    crew: number;
    officers: number;
    marines: number;
    passengers: number;
    quarters: ICapitalShipQuarters;
    bays: ICapitalShipBay[];
    dockingCollars: number;
    gravDecks: ICapitalShipGravDecks;
    escapePods: number;
    lifeBoats: number;
    equipment: ICapitalShipEquipmentExport[];
    capitalWeapons: ICapitalShipMountExport[];
}

const emptyArmor = (): ICapitalShipArmorAllocation => ({ nose: 0, foreLeft: 0, foreRight: 0, aftLeft: 0, aftRight: 0, aft: 0 });
const emptyQuarters = (): ICapitalShipQuarters => ({ firstClass: 0, secondClass: 0, crew: 0, steerage: 0 });
const emptyGravDecks = (): ICapitalShipGravDecks => ({ small: 0, medium: 0, large: 0 });
const savedString = (value: unknown, fallback: string = ""): string => typeof value === "string" ? value : fallback;
const savedNumber = (value: unknown, fallback: number, min: number, max: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
const wholeNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, Number.isFinite(value) ? Math.floor(value) : min));
const halfTons = (value: number, max: number): number => Math.min(max, Math.max(0, Math.round((Number.isFinite(value) ? value : 0) * 2) / 2));
/** The aerospace armor catalog writes an absent prototype year as null; ITechDates leaves it out. */
const armorDates = (armor: IAerospaceArmorType): ITechDates => ({ ...armor, prototype: armor.prototype ?? undefined });
/** Escapes text written into the HTML calculation log, which the summary page renders as markup. */
const escapeLogText = (value: unknown): string => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** A saved vessel cleaned by a full import, with what the import changed; null when it is not an object. */
export const normalizeCapitalShipExport = (raw: unknown): { ship: ICapitalShipExport | null; issues: string[] } => {
    if (!isPlainObject(raw)) return { ship: null, issues: ["Skipped a saved JumpShip, WarShip or station that could not be read"] };
    let json: string;
    try {
        json = JSON.stringify(raw);
    } catch {
        return { ship: null, issues: ["Skipped a saved JumpShip, WarShip or station that could not be read"] };
    }
    const loaded = new CapitalShip(json);
    return { ship: JSON.parse(loaded.exportJSON()) as ICapitalShipExport, issues: [...loaded.getImportIssues()] };
};

/** A weapon bay (SO:AA p.142) as the record sheet lists it (SO:AA p.146). */
export type ICapitalShipWeaponBay = IWeaponBay;

export default class CapitalShip {
    private _uuid: string = generateUUID();

    /** The design quirks assigned to this unit (quirk tables, Campaign Operations pp.228 and 232). */
    public quirks: QuirkList = new QuirkList();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _rulesEdition: string = DEFAULT_RULES_EDITION;
    private _model: string = "";
    private _shipType: AdvancedAerospaceType = "warShip";
    private _tonnage: number = 100000;
    private _tech: ITechOptions = btTechOptions[0];
    private _era: IEras = btEraOptions[0];
    private _safeThrust: number = 1;
    private _structuralIntegrity: number = 2;
    private _fuelTons: number = 1000;
    private _lithiumFusionBattery: boolean = false;
    private _kfBoom: boolean = false;
    private _monitor: boolean = false;
    private _armorType: IAerospaceArmorType = aerospaceArmorTypes.find((armor) => armor.tag === "capital-standard") ?? aerospaceArmorTypes[0];
    private _armorTons: number = 0;
    private _armorAllocation: ICapitalShipArmorAllocation = emptyArmor();
    private _heatSinkType: IHeatSync = mechHeatSinkTypes[0];
    private _additionalHeatSinks: number = 0;
    private _crew: number = 0;
    private _officers: number = 0;
    private _marines: number = 0;
    private _passengers: number = 0;
    private _quarters: ICapitalShipQuarters = emptyQuarters();
    private _bays: ICapitalShipBay[] = [];
    private _dockingCollars: number = 0;
    private _gravDecks: ICapitalShipGravDecks = emptyGravDecks();
    private _escapePods: number = 0;
    private _lifeBoats: number = 0;
    private _equipmentList: IEquipmentItem[] = [];
    private _capitalWeapons: ICapitalShipMount[] = [];
    private _importIssues: string[] = [];
    private _pilot: Pilot = new Pilot();
    private _inPlay: ICapitalShipInPlay = newCapitalShipInPlay();

    private _weights: { name: string; weight: number }[] = [];
    private _currentTonnage: number = 0;
    private _cost: number = 0;
    private _calcLogCost: string = "";
    private _battleValue: number = 0;
    private _calcLogBV: string = "";

    constructor(importJSON: string = "") {
        this._crew = this.getMinimumCrew();
        this._officers = this.getMinimumOfficers();
        if (importJSON) this.importJSON(importJSON);
        this._calc();
    }

    public getUUID(): string { return this._uuid; }
    public newUUID(): void { this._uuid = generateUUID(); }

    /** Which column of the quirk tables this unit is graded by. */
    public getQuirkUnitType(): QuirkUnitType { return "large-craft"; }

    /** What the quirk picker can attach quirks to on this unit. */
    public getQuirkTargets(): IQuirkTargets {
        return getQuirkTargets([], this._equipmentList.filter((item) => !item.isAmmo).map((item) => ({ ...item, label: item.name })));
    }

    /** One line for each quirk this unit could not be given now: rules edition, rules level or unit type. */
    public getQuirkIssues(rulesLevel: number): string[] {
        return getQuirkIssues(this.quirks.getAll(), this.getQuirkUnitType(), this._rulesEdition, rulesLevel);
    }

    public getName(): string { return this._name; }
    public setName(name: string): string {
        this._name = String(name ?? "").slice(0, 200);
        return this._name;
    }
    public getModel(): string { return this._model; }
    public setModel(model: string): string {
        this._model = String(model ?? "").slice(0, 200);
        return this._model;
    }
    /** The rules edition the design is built under. Only the editions with rules for this unit type are offered. */
    public getRulesEdition(): string { return this._rulesEdition; }
    public setRulesEdition(editionTag: string): string {
        this._rulesEdition = getSelectableRulesEditionTag(editionTag, "capital-ship");
        return this._rulesEdition;
    }

    // Type, weight and tech -------------------------------------------------------------------------------------

    public getShipType(): AdvancedAerospaceType { return this._shipType; }
    public getShipTypeName(): string { return getAdvancedAerospaceType(this._shipType).name + (this.isMonitor() ? " (Monitor)" : ""); }
    public isWarShip(): boolean { return this._shipType === "warShip"; }
    public isSpaceStation(): boolean { return this._shipType === "spaceStation"; }
    /**
     * JumpShips and WarShips always carry a K-F drive and jump sail: they cannot be designed without one (SO:AA errata v5.0,
     * p.136). The one exception is the custom monitor.
     */
    public hasKFDrive(): boolean { return !this.isSpaceStation() && !this.isMonitor(); }

    /**
     * Custom Homebrew (rules level 6): a monitor is a WarShip with no K-F drive or sail. It pays for the missing keel in
     * structure and needs twice the crew, and it moves between systems docked to a carrier (after XTRO: Boondoggles p.19).
     */
    public isMonitor(): boolean { return this._monitor && this.isWarShip(); }
    public setMonitor(on: boolean): boolean {
        this._monitor = on === true;
        this._clampToRules();
        this._calc();
        return this.isMonitor();
    }
    /** Custom: the keel that replaces the K-F drive's frame, half the structure's weight again. */
    public getKeelWeight(): number { return this.isMonitor() ? getMonitorKeelWeight(this.getStructureWeight()) : 0; }
    /** Custom: the docking collars a carrier needs to move a monitor, one for every 100,000 tons. */
    public getCarrierCollarsNeeded(): number { return this.isMonitor() ? getMonitorCarrierCollars(this._tonnage) : 0; }

    public setShipType(shipType: string): AdvancedAerospaceType {
        if (advancedAerospaceTypes.some((type) => type.tag === shipType)) this._shipType = shipType as AdvancedAerospaceType;
        this._tonnage = this._steppedTonnage(this._tonnage);
        // Broadside weapons go back to unplaced on a type without broadsides.
        const arcs = this.getArcs();
        for (const item of this._equipmentList) if (item.location && item.location !== "hull" && !(arcs as string[]).includes(item.location)) item.location = undefined;
        for (const mount of this._capitalWeapons) if (mount.location && !arcs.includes(mount.location)) mount.location = undefined;
        this._clampToRules();
        this._calc();
        return this._shipType;
    }

    /** Space stations 2,000 to 2,500,000 tons in 500-ton steps, JumpShips 50,000 to 500,000 in 1,000s, WarShips 100,000 to 2,500,000 in 10,000s (SO:AA p.133). */
    public getMinTonnage(): number { return getAdvancedAerospaceType(this._shipType).minTons; }
    public getMaxTonnage(): number {
        const max = getAdvancedAerospaceType(this._shipType).maxTons;
        return this.isSpaceStation() && this._kfBoom ? Math.min(max, KF_BOOM_STATION_MAX_TONS) : max;
    }
    public getTonnageStep(): number { return getAdvancedAerospaceType(this._shipType).tonsStep; }
    private _steppedTonnage(tonnage: number): number {
        const step = this.getTonnageStep();
        return Math.min(this.getMaxTonnage(), Math.max(this.getMinTonnage(), Math.round(tonnage / step) * step));
    }
    public getTonnage(): number { return this._tonnage; }
    public setTonnage(tonnage: number): number {
        this._tonnage = this._steppedTonnage(Number.isFinite(tonnage) ? tonnage : this.getMinTonnage());
        this._clampToRules();
        this._calc();
        return this._tonnage;
    }

    public getTech(): ITechOptions { return this._tech; }
    public setTech(tag: string): ITechOptions {
        this._tech = findByTag(btTechOptions, tag) ?? this._tech;
        this._era = getClosestEraForTech(this._era, this._tech.tag);
        if (this.getArmorPointsPerTon() === null) this._armorType = aerospaceArmorTypes.find((armor) => armor.tag === "capital-standard") ?? this._armorType;
        this._clampToRules();
        this._calc();
        return this._tech;
    }
    public isMixedTech(): boolean { return this._tech.tag === "mis" || this._tech.tag === "mclan"; }
    /** The tech base that sets armor points per ton: Clan for Clan and Mixed (Clan chassis). */
    public getChassisTechBase(): "is" | "clan" { return this._tech.tag === "clan" || this._tech.tag === "mclan" ? "clan" : "is"; }

    public getEra(): IEras { return this._era; }
    public setEra(tag: string): IEras {
        this._era = getClosestEraForTech(findEraByTag(tag) ?? this._era, this._tech.tag);
        return this._era;
    }
    public getAvailableEras(): IEras[] { return getErasForTech(this._tech.tag); }

    // Structure, drives and fuel (SO:AA pp.134-137) ---------------------------------------------------------------

    /** Station-keeping drives (JumpShips and stations) have no Safe Thrust to choose (SO:AA p.135). */
    public getSafeThrust(): number { return this.isWarShip() ? this._safeThrust : 0; }
    public getMaxThrust(): number { return getAdvancedAerospaceMaxThrust(this._shipType, this._safeThrust); }
    public setSafeThrust(safeThrust: number): number {
        this._safeThrust = wholeNumber(safeThrust, 1, MAX_CAPITAL_SHIP_SAFE_THRUST);
        this._clampToRules();
        this._calc();
        return this._safeThrust;
    }
    public getEngineWeight(): number { return getAdvancedAerospaceEngineWeight(this._shipType, this._tonnage, this.getSafeThrust()); }

    /** A WarShip's runs from its Maximum Thrust to 30 times it; JumpShips and stations have 1 (SO:AA pp.134, 136). */
    public getStructuralIntegrity(): number { return this.isWarShip() ? this._structuralIntegrity : 1; }
    public getMinStructuralIntegrity(): number { return this.isWarShip() ? this.getMaxThrust() : 1; }
    public getMaxStructuralIntegrity(): number { return this.isWarShip() ? this.getMaxThrust() * ADVANCED_AEROSPACE_MAX_SI_FACTOR : 1; }
    public setStructuralIntegrity(value: number): number {
        this._structuralIntegrity = wholeNumber(value, this.getMinStructuralIntegrity(), this.getMaxStructuralIntegrity());
        this._clampToRules();
        this._calc();
        return this.getStructuralIntegrity();
    }
    public getStructureWeight(): number { return getAdvancedAerospaceStructureWeight(this._shipType, this._tonnage, this.getStructuralIntegrity()); }

    public getFuelTons(): number { return this._fuelTons; }
    /** Fuel comes in half tons (SO:AA p.135). */
    public setFuelTons(tons: number): number {
        this._fuelTons = halfTons(tons, this._tonnage);
        this._calc();
        return this._fuelTons;
    }
    public getFuelPointsPerTon(): number { return getAdvancedAerospaceFuelPointsPerTon(this._tonnage); }
    public getFuelPoints(): number { return Math.floor(this._fuelTons * this.getFuelPointsPerTon() + 1e-9); }
    public getFuelPumpWeight(): number { return getAdvancedAerospaceFuelPumpWeight(this._fuelTons); }
    public getStrategicFuelPerDay(): number { return getAdvancedAerospaceStrategicFuelPerDay(this._shipType, this._tonnage); }
    public getBurnDays(): number { return Math.round(this._fuelTons / this.getStrategicFuelPerDay() * 100) / 100; }

    public getKFDriveWeight(): number { return getKFDriveWeight(this._shipType, this._tonnage); }
    public getKFDriveIntegrity(): number { return getKFDriveIntegrity(this._shipType, this._tonnage); }
    /** Installing a K-F drive ends with its jump sail (SO:AA p.136). */
    public getJumpSailWeight(): number { return this.hasKFDrive() ? getJumpSailWeight(this._shipType, this._tonnage) : 0; }
    public getJumpSailIntegrity(): number { return this.hasKFDrive() ? getJumpSailIntegrity(this.getJumpSailWeight()) : 0; }

    /** A lithium-fusion battery stores a second jump; only a vessel with a K-F drive has one (TO:AUE p.135). */
    public hasLithiumFusionBattery(): boolean { return this._lithiumFusionBattery && this.hasKFDrive(); }
    public setLithiumFusionBattery(on: boolean): boolean {
        this._lithiumFusionBattery = on === true;
        this._calc();
        return this.hasLithiumFusionBattery();
    }
    public getLithiumFusionBatteryWeight(): number { return this.hasLithiumFusionBattery() ? getLithiumFusionBatteryWeight(this._tonnage) : 0; }

    /** A station built to ride a JumpShip has a K-F boom, 100,000 tons at most, and costs x20 (SO:AA p.139). */
    public hasKFBoom(): boolean { return this._kfBoom && this.isSpaceStation(); }
    public setKFBoom(on: boolean): boolean {
        this._kfBoom = on === true;
        this._tonnage = this._steppedTonnage(this._tonnage);
        this._clampToRules();
        this._calc();
        return this.hasKFBoom();
    }

    public getControlsWeight(): number { return getAdvancedAerospaceControlsWeight(this._shipType, this._tonnage); }

    // Armor (SO:AA p.140) -----------------------------------------------------------------------------------------

    public getArmorType(): IAerospaceArmorType { return this._armorType; }
    /** The capital armors (Capital Armor Points per Ton Table, SO:AA p.140). */
    public getAvailableArmorTypes(rulesLevel: number = 2): (IAerospaceArmorType & { available: boolean })[] {
        const techBase = this.getChassisTechBase();
        return aerospaceArmorTypes
            .filter((armor) => getAerospaceArmorPointsPerTon(armor.tag, "advanced-aerospace", techBase, this._tonnage) !== null)
            .map((armor) => ({ ...armor, available: this._datesAvailability(armorDates(armor), rulesLevel).available }));
    }
    public setArmorType(tag: string): IAerospaceArmorType {
        const armor = this.getAvailableArmorTypes().find((entry) => entry.tag === tag);
        if (armor) this._armorType = aerospaceArmorTypes.find((entry) => entry.tag === armor.tag) ?? this._armorType;
        this._clampToRules();
        this._calc();
        return this._armorType;
    }
    public getArmorPointsPerTon(): number | null {
        return getAerospaceArmorPointsPerTon(this._armorType.tag, "advanced-aerospace", this.getChassisTechBase(), this._tonnage);
    }
    public getMaxArmorTons(): number { return getAdvancedAerospaceMaxArmorTons(this._shipType, this.getStructureWeight()); }
    public getArmorTons(): number { return this._armorTons; }
    public setArmorTons(tons: number): number {
        this._armorTons = halfTons(tons, this.getMaxArmorTons());
        this._clampToRules();
        this._calc();
        return this._armorTons;
    }
    /** Capital armor points bought, rounded down (SO:AA p.140). */
    public getPurchasedArmorPoints(): number { return getAdvancedAerospaceArmorPoints(this._armorTons, this.getArmorPointsPerTon() ?? 0); }
    /** Free armor on each facing: Structural Integrity / 10, rounded normally (SO:AA p.140). */
    public getFreeArmorPerFacing(): number { return getAdvancedAerospaceFreeArmorPerFacing(this.getStructuralIntegrity()); }
    public getArmorAllocation(): ICapitalShipArmorAllocation { return this._armorAllocation; }
    /** Bought points placed on a facing; the free armor is added on top. */
    public setArmorAllocation(facing: AdvancedAerospaceFacing, points: number): ICapitalShipArmorAllocation {
        if (ADVANCED_AEROSPACE_FACINGS.includes(facing)) this._armorAllocation[facing] = wholeNumber(points, 0, 1000000);
        this._calc();
        return this._armorAllocation;
    }
    public getFacingArmor(facing: AdvancedAerospaceFacing): number { return this._armorAllocation[facing] + this.getFreeArmorPerFacing(); }
    public getAllocatedArmorPoints(): number { return ADVANCED_AEROSPACE_FACINGS.reduce((sum, facing) => sum + this._armorAllocation[facing], 0); }
    public getUnallocatedArmorPoints(): number { return this.getPurchasedArmorPoints() - this.getAllocatedArmorPoints(); }
    /** Spreads the bought points over the six facings, the remainder from the nose back. */
    public allocateArmorEvenly(): ICapitalShipArmorAllocation {
        const points = this.getPurchasedArmorPoints();
        const each = Math.floor(points / ADVANCED_AEROSPACE_FACINGS.length);
        let extra = points - each * ADVANCED_AEROSPACE_FACINGS.length;
        for (const facing of ADVANCED_AEROSPACE_FACINGS) {
            this._armorAllocation[facing] = each + (extra > 0 ? 1 : 0);
            extra--;
        }
        this._calc();
        return this._armorAllocation;
    }
    public getFacingName(facing: AdvancedAerospaceFacing): string { return ADVANCED_AEROSPACE_ARC_NAMES[facing]; }

    // Heat sinks (SO:AA pp.139, 142) ------------------------------------------------------------------------------

    public getHeatSinkType(): IHeatSync { return this._heatSinkType; }
    public getAvailableHeatSinkTypes(rulesLevel: number = 2): (IHeatSync & { available: boolean })[] {
        return mechHeatSinkTypes.filter((type) => type.tag === "single" || type.tag === "double")
            .map((type) => ({ ...type, available: type.tag === "single" || this._datesAvailability(type, rulesLevel).available }));
    }
    public setHeatSinkType(tag: string): IHeatSync {
        this._heatSinkType = this.getAvailableHeatSinkTypes().some((type) => type.tag === tag)
            ? mechHeatSinkTypes.find((type) => type.tag === tag) ?? this._heatSinkType : this._heatSinkType;
        this._calc();
        return this._heatSinkType;
    }
    public getAdditionalHeatSinks(): number { return this._additionalHeatSinks; }
    /** Heat sinks beyond the free ones weigh a ton each. */
    public setAdditionalHeatSinks(count: number): number {
        this._additionalHeatSinks = wholeNumber(count, 0, this._tonnage);
        this._calc();
        return this._additionalHeatSinks;
    }
    public getFreeHeatSinks(): number { return getAdvancedAerospaceFreeHeatSinks(this.getEngineWeight()); }
    public getTotalHeatSinks(): number { return this.getFreeHeatSinks() + this._additionalHeatSinks; }
    public getHeatDissipation(): number { return this.getTotalHeatSinks() * (this._heatSinkType.dissipation ?? 1); }

    // Weapons and equipment (SO:AA pp.141-143) -------------------------------------------------------------------

    public getArcs(): AdvancedAerospaceArc[] { return getAdvancedAerospaceArcs(this._shipType); }
    public getArcName(arc: AdvancedAerospaceArc): string { return ADVANCED_AEROSPACE_ARC_NAMES[arc]; }
    public getEquipmentList(): IEquipmentItem[] { return this._equipmentList; }
    public getCapitalWeapons(): ICapitalShipMount[] { return this._capitalWeapons; }
    public getArcItems(arc: AdvancedAerospaceArc): IEquipmentItem[] { return this._equipmentList.filter((item) => item.location === arc); }
    public getArcCapitalWeapons(arc: AdvancedAerospaceArc): ICapitalShipMount[] { return this._capitalWeapons.filter((mount) => mount.location === arc); }
    public getHullItems(): IEquipmentItem[] { return this._equipmentList.filter((item) => item.location === "hull"); }

    /**
     * Standard-scale equipment: whatever a DropShip may mount. SO:AA allows standard weapons on advanced aerospace
     * units (p.141) and the catalogs have no column of their own for them, so the DropShip one is read.
     */
    public isEquipmentAllowed(item: IEquipmentItem): boolean { return (item.space?.dropShip ?? -1) >= 0; }
    private _isWeapon(item: IEquipmentItem): boolean {
        return !item.isAmmo && !item.isEquipment && !item.battleValueDefensive && (item.battleValue || 0) > 0;
    }
    /** A weapon that goes into a weapon bay (an anti-missile system does not: its BV is defensive). */
    public isWeapon(item: IEquipmentItem): boolean { return this._isWeapon(item); }
    /** A weapon, or an anti-missile system: something that has to face a firing arc. */
    public needsArc(item: IEquipmentItem): boolean { return !item.isAmmo && (this._isWeapon(item) || !!item.weaponType?.includes("AMS")); }

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
                const availability = this._datesAvailability(item, rulesLevel);
                item.availableAsPrototype = availability.asPrototype;
                item.available = availability.available;
                items.push(item);
            }
        }
        items.sort((a, b) => (a.sort > b.sort ? 1 : a.sort < b.sort ? -1 : 0));
        const offeredLevel = includeCustom ? Math.max(rulesLevel, CUSTOM_HOMEBREW_RULES_LEVEL) : rulesLevel;
        return items.filter((item) => isEquipmentOffered(item, this._rulesEdition, offeredLevel));
    }
    private _catalog(): IEquipmentItem[] {
        const techTag = this._tech.tag;
        const own = getEquipmentListByTech(techTag, true);
        return techTag === "is" || techTag === "clan" ? [...own, ...getEquipmentListByTech(techTag === "clan" ? "mclan" : "mis", true)] : own;
    }
    /** Weapons sit in a firing arc; ammunition and other equipment in the hull, or in an arc if given one. */
    private _validLocation(item: IEquipmentItem, location: unknown): string | undefined {
        if (typeof location === "string" && (this.getArcs() as string[]).includes(location)) return location;
        return this.needsArc(item) ? undefined : "hull";
    }
    private _newEquipment(catalogItem: IEquipmentItem, location?: unknown, uuid?: unknown): IEquipmentItem {
        const freshId = typeof uuid !== "string" || !uuid || this._equipmentList.some((item) => item.uuid === uuid);
        const item: IEquipmentItem = { ...JSON.parse(JSON.stringify(catalogItem)), uuid: freshId ? generateUUID() : uuid as string };
        item.location = this._validLocation(item, location);
        return item;
    }
    public addEquipmentFromTag(tag: string, location?: string): IEquipmentItem | null {
        const catalogItem = findByTag(this._catalog(), tag);
        if (!catalogItem || !this.isEquipmentAllowed(catalogItem) || this._equipmentList.length >= MAX_CAPITAL_SHIP_EQUIPMENT) return null;
        const item = this._newEquipment(catalogItem, location);
        this._equipmentList.push(item);
        this._clampToRules();
        this._calc();
        return item;
    }
    public removeEquipment(uuid: string): IEquipmentItem[] {
        this._equipmentList = this._equipmentList.filter((item) => item.uuid !== uuid);
        this._clampToRules();
        this._calc();
        return this._equipmentList;
    }
    public setEquipmentLocation(uuid: string, location: string): IEquipmentItem[] {
        const item = this._equipmentList.find((entry) => entry.uuid === uuid);
        if (item) item.location = this._validLocation(item, location);
        this._calc();
        return this._equipmentList;
    }

    /** Capital and sub-capital weapons the type may mount (SO:AA p.142; TO:AUE pp.143-146). */
    /**
     * Capital and sub-capital weapons go on every advanced aerospace unit, as does anything a DropShip may mount (SO:AA
     * p.141), so a weapon whose JumpShip, WarShip or station column the source table leaves blank (the capital missiles
     * and Screen Launcher, TM pp.210, 237) follows its DropShip column. A 0 is mountable without a weapon slot (the
     * Dragon's Breath, IO:AE p.215).
     */
    public isCapitalWeaponAllowed(weapon: ICapitalWeapon): boolean { return (weapon.space[this._shipType] ?? weapon.space.dropShip ?? -1) >= 0; }
    private _capitalTechAllowed(weapon: ICapitalWeapon): boolean {
        return weapon.techBase === "both" || this.isMixedTech() || weapon.techBase === this.getChassisTechBase();
    }
    private _capitalDates(weapon: ICapitalWeapon): ITechDates {
        return { introduced: weapon.introduced, extinct: weapon.extinct, reintroduced: weapon.reintroduced, prototype: weapon.prototype ?? undefined } as ITechDates;
    }
    public getAvailableCapitalWeapons(rulesLevel: number = 2): ICapitalWeapon[] {
        return CAPITAL_WEAPON_CATALOG.filter((weapon) => this.isCapitalWeaponAllowed(weapon) && this._capitalTechAllowed(weapon)
            && weapon.rulesLevel <= rulesLevel && this._datesAvailability(this._capitalDates(weapon), rulesLevel).available);
    }
    public getCapitalShots(mount: ICapitalShipMount): number { return Object.values(mount.shots).reduce((sum, shots) => sum + shots, 0); }
    public getCapitalAmmoWeight(mount: ICapitalShipMount): number {
        return Math.round(Object.keys(mount.shots).reduce((sum, tag) => sum + getCapitalAmmoTons(tag, mount.shots[tag]), 0) * 1000) / 1000;
    }
    /** The weapon and the ammunition carried with it (SO:AA p.142). */
    public getCapitalWeaponWeight(mount: ICapitalShipMount): number { return Math.round((mount.weapon.weight + this.getCapitalAmmoWeight(mount)) * 1000) / 1000; }
    /** An AR-10's heat is that of the missile it fires: counted at the hottest one it carries, or may fire (a reading, as for DropShips). */
    public getCapitalWeaponHeat(mount: ICapitalShipMount): number {
        if (mount.weapon.heat !== null) return mount.weapon.heat;
        const tags = getCapitalAmmoTags(mount.weapon);
        const loaded = tags.filter((tag) => (mount.shots[tag] ?? 0) > 0);
        return Math.max(0, ...(loaded.length ? loaded : tags).map((tag) => findCapitalWeapon(tag)?.heat ?? 0));
    }
    private _validArc(location: unknown): AdvancedAerospaceArc | undefined {
        return typeof location === "string" && (this.getArcs() as string[]).includes(location) ? location as AdvancedAerospaceArc : undefined;
    }
    private _newCapitalMount(weapon: ICapitalWeapon, location: unknown, shots: unknown, uuid?: unknown): ICapitalShipMount {
        const taken = (id: string) => this._capitalWeapons.some((mount) => mount.uuid === id) || this._equipmentList.some((item) => item.uuid === id);
        const mount: ICapitalShipMount = {
            uuid: typeof uuid === "string" && uuid && !taken(uuid) ? uuid : generateUUID(),
            weapon,
            location: this._validArc(location),
            shots: {},
        };
        for (const tag of getCapitalAmmoTags(weapon)) {
            mount.shots[tag] = Math.floor(savedNumber(isPlainObject(shots) ? shots[tag] : undefined, 0, 0, MAX_CAPITAL_SHIP_SHOTS));
        }
        return mount;
    }
    /** A new weapon that fires ammunition comes with 10 shots, the least it may carry (SO:AA p.142). */
    public addCapitalWeapon(tag: string, location?: string): ICapitalShipMount | null {
        const weapon = findCapitalWeapon(tag);
        if (!weapon || !this.isCapitalWeaponAllowed(weapon) || this._capitalWeapons.length >= MAX_CAPITAL_SHIP_CAPITAL_WEAPONS) return null;
        const first = getCapitalAmmoTags(weapon)[0];
        const mount = this._newCapitalMount(weapon, location, first ? { [first]: CAPITAL_SHIP_MIN_SHOTS } : {});
        this._capitalWeapons.push(mount);
        this._clampToRules();
        this._calc();
        return mount;
    }
    public removeCapitalWeapon(uuid: string): ICapitalShipMount[] {
        this._capitalWeapons = this._capitalWeapons.filter((mount) => mount.uuid !== uuid);
        this._clampToRules();
        this._calc();
        return this._capitalWeapons;
    }
    public setCapitalWeaponLocation(uuid: string, location: string): void {
        const mount = this._capitalWeapons.find((entry) => entry.uuid === uuid);
        if (mount) mount.location = this._validArc(location);
        this._calc();
    }
    public setCapitalWeaponShots(uuid: string, ammoTag: string, shots: number): void {
        const mount = this._capitalWeapons.find((entry) => entry.uuid === uuid);
        if (!mount || !getCapitalAmmoTags(mount.weapon).includes(ammoTag)) return;
        mount.shots[ammoTag] = Math.floor(savedNumber(shots, 0, 0, MAX_CAPITAL_SHIP_SHOTS));
        this._calc();
    }

    /** Weapons in an arc, for the limit of 12 (JumpShip) or 20 (SO:AA p.133, errata v5.0). */
    public getArcWeaponCount(arc: AdvancedAerospaceArc): number {
        return this.getArcItems(arc).filter((item) => this.needsArc(item)).length + this.getArcCapitalWeapons(arc).length;
    }
    /** Expanded fire control for an arc over its limit, on the weapons' weight without ammunition (SO:AA p.143). */
    public getArcFireControlWeight(arc: AdvancedAerospaceArc): number {
        const weapons = this.getArcItems(arc).filter((item) => this.needsArc(item));
        const tons = weapons.reduce((sum, item) => sum + (item.weight || 0), 0) + this.getArcCapitalWeapons(arc).reduce((sum, mount) => sum + mount.weapon.weight, 0);
        return getAdvancedAerospaceFireControlWeight(this._shipType, this.getArcWeaponCount(arc), tons);
    }
    public getFireControlWeight(): number { return this.getArcs().reduce((sum, arc) => sum + this.getArcFireControlWeight(arc), 0); }

    /**
     * Weapon bays: an arc's weapons of one class, split when they pass 700 standard (70 capital) damage (SO:AA
     * p.142). The rules let a designer split bays further; this groups each class in as few bays as the damage cap
     * allows, filling the emptiest bay first, as the McKenna example does. Standard weapons count their aerospace
     * damage / 10; the class is the weapon family (equipment-subtypes.ts) or the capital weapon category.
     */
    public getArcWeaponBays(arc: AdvancedAerospaceArc): ICapitalShipWeaponBay[] {
        return groupWeaponBays([
            ...this.getArcItems(arc).filter((entry) => this._isWeapon(entry)).map(standardBayWeapon),
            ...this.getArcCapitalWeapons(arc).map((mount) => capitalBayWeapon(mount.weapon, this.getCapitalWeaponHeat(mount))),
        ], ADVANCED_AEROSPACE_MAX_BAY_CAPITAL_DAMAGE);
    }
    /** Heat sinks must cover the hottest single weapon bay (SO:AA p.142). */
    public getHottestBayHeat(): number {
        return Math.max(0, ...this.getArcs().flatMap((arc) => this.getArcWeaponBays(arc).map((bay) => bay.heat)));
    }

    /**
     * Ammunition-fed standard weapon models with fewer than 10 shots for each weapon (SO:AA p.142). One-shot weapons
     * and anti-missile systems are left out.
     */
    public getAmmunitionShortfalls(): { name: string; shots: number; needed: number }[] {
        const shortfalls: { name: string; shots: number; needed: number }[] = [];
        const seen = new Set<string>();
        for (const weapon of this._equipmentList) {
            if (weapon.isAmmo || weapon.isOneShot || seen.has(weapon.tag) || weapon.weaponType?.includes("AMS")) continue;
            if (!weapon.ammoTypes?.length && !((weapon.shotsPerTon ?? 0) > 0)) continue;
            seen.add(weapon.tag);
            const count = this._equipmentList.filter((item) => !item.isAmmo && item.tag === weapon.tag).length;
            const shots = this._equipmentList.filter((item) => item.isAmmo && getCompatibleAmmo(weapon, item))
                .reduce((sum, ammo) => sum + getWeaponShotsPerTon(weapon, ammo) * (ammo.weight || 0), 0);
            const needed = count * CAPITAL_SHIP_MIN_SHOTS;
            if (shots < needed) shortfalls.push({ name: weapon.name, shots: Math.floor(shots), needed });
        }
        return shortfalls;
    }

    // Crew and quarters (SO:AA p.138) -----------------------------------------------------------------------------

    /** A gunner for every six standard weapons and one for each capital weapon; anti-missile systems need none (SO:AA p.138). */
    public getMinimumGunners(): number {
        return getAdvancedAerospaceMinimumGunners(this._equipmentList.filter((item) => this._isWeapon(item)).length, this._capitalWeapons.length);
    }
    public getBaseCrew(): number { return getAdvancedAerospaceBaseCrew(this._shipType, this._tonnage) * (this.isMonitor() ? MONITOR_CREW_MULTIPLIER : 1); }
    public getMinimumCrew(): number { return this.getBaseCrew() + this.getMinimumGunners(); }
    /** One in six of the whole crew, rounded up, is an officer; they are counted in the crew (SO:AA p.138). */
    public getMinimumOfficers(): number { return getAdvancedAerospaceMinimumOfficers(this._crew); }
    public getCrew(): number { return this._crew; }
    public setCrew(crew: number): number {
        this._crew = wholeNumber(crew, this.getMinimumCrew(), MAX_CAPITAL_SHIP_PEOPLE);
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
    public getMarines(): number { return this._marines; }
    public setMarines(marines: number): number {
        this._marines = wholeNumber(marines, 0, MAX_CAPITAL_SHIP_PEOPLE);
        this._calc();
        return this._marines;
    }
    public getPassengers(): number { return this._passengers; }
    public setPassengers(passengers: number): number {
        this._passengers = wholeNumber(passengers, 0, MAX_CAPITAL_SHIP_PEOPLE);
        this._calc();
        return this._passengers;
    }
    /** Everyone aboard but bay personnel needs quarters (SO:AA p.138). */
    public getPeopleNeedingQuarters(): number { return this._crew + this._marines + this._passengers; }
    public getQuarters(): ICapitalShipQuarters { return this._quarters; }
    public setQuarters(tag: QuartersTag, count: number): ICapitalShipQuarters {
        if (quartersTypes.some((type) => type.tag === tag)) this._quarters[tag] = wholeNumber(count, 0, MAX_CAPITAL_SHIP_PEOPLE);
        this._calc();
        return this._quarters;
    }
    public getQuartersCapacity(): number { return quartersTypes.reduce((sum, type) => sum + this._quarters[type.tag], 0); }
    public getQuartersWeight(): number { return quartersTypes.reduce((sum, type) => sum + this._quarters[type.tag] * type.tons, 0); }

    // Bays, collars, grav decks and escape craft (SO:AA pp.142-143; TO:AUE pp.116, 126) -----------------------------

    public getBays(): ICapitalShipBay[] { return this._bays; }
    public addBay(tag: string, amount: number = 1): ICapitalShipBay | null {
        const type = findTransportBayType(tag);
        if (!type || this._bays.length >= MAX_CAPITAL_SHIP_BAYS) return null;
        const bay: ICapitalShipBay = { tag: type.tag, amount: 1, doors: type.infantry || type.tonsEach === null ? 0 : 1 };
        this._bays.push(bay);
        this.setBay(this._bays.length - 1, amount, bay.doors);
        return bay;
    }
    public setBay(index: number, amount: number, doors: number): ICapitalShipBay[] {
        const bay = this._bays[index];
        const type = bay ? findTransportBayType(bay.tag) : undefined;
        if (bay && type) {
            const value = Number.isFinite(amount) ? amount : 1;
            bay.amount = type.tonsEach === null ? Math.min(this._tonnage, Math.max(0.001, Math.round(value * 1000) / 1000))
                : wholeNumber(value, 1, MAX_CAPITAL_SHIP_BAY_UNITS);
            bay.doors = wholeNumber(doors, 0, this.getMaxBayDoors());
        }
        this._calc();
        return this._bays;
    }
    public removeBay(index: number): ICapitalShipBay[] {
        this._bays = this._bays.filter((_bay, bayIndex) => bayIndex !== index);
        this._calc();
        return this._bays;
    }
    public getBayWeight(bay: ICapitalShipBay): number {
        const type = findTransportBayType(bay.tag);
        return type ? (type.tonsEach === null ? bay.amount : type.tonsEach * bay.amount) : 0;
    }
    public getBayName(bay: ICapitalShipBay): string { return findTransportBayType(bay.tag)?.name ?? bay.tag; }
    public getBayDoors(): number { return this._bays.reduce((sum, bay) => sum + bay.doors, 0); }
    public getMaxBayDoors(): number { return getAdvancedAerospaceMaxBayDoors(this._shipType, this._tonnage); }
    public getCargoCapacity(): number {
        return Math.round(this._bays.reduce((sum, bay) => {
            const type = findTransportBayType(bay.tag);
            return sum + (type && type.cargoFactor ? this.getBayWeight(bay) * type.cargoFactor : 0);
        }, 0) * 100) / 100;
    }

    public getDockingCollars(): number { return this._dockingCollars; }
    public getMaxDockingCollars(): number { return getMaxDockingCollars(this._tonnage); }
    public setDockingCollars(count: number): number {
        this._dockingCollars = wholeNumber(count, 0, this.getMaxDockingCollars());
        this._calc();
        return this._dockingCollars;
    }

    public getGravDecks(): ICapitalShipGravDecks { return this._gravDecks; }
    public getGravDeckCount(): number { return GRAV_DECKS.reduce((sum, deck) => sum + this._gravDecks[deck.tag], 0); }
    public getMaxGravDecks(): number { return getMaxGravDecks(this._tonnage); }
    public setGravDecks(size: GravDeckSize, count: number): ICapitalShipGravDecks {
        const deck = GRAV_DECKS.find((entry) => entry.tag === size);
        if (deck) this._gravDecks[size] = deck.stationOnly && !this.isSpaceStation() ? 0 : wholeNumber(count, 0, this.getMaxGravDecks());
        this._calc();
        return this._gravDecks;
    }

    public getEscapePods(): number { return this._escapePods; }
    public setEscapePods(count: number): number {
        this._escapePods = wholeNumber(count, 0, MAX_CAPITAL_SHIP_PEOPLE);
        this._calc();
        return this._escapePods;
    }
    public getLifeBoats(): number { return this._lifeBoats; }
    public setLifeBoats(count: number): number {
        this._lifeBoats = wholeNumber(count, 0, MAX_CAPITAL_SHIP_PEOPLE);
        this._calc();
        return this._lifeBoats;
    }

    // Totals --------------------------------------------------------------------------------------------------

    private _clampToRules(): void {
        this._structuralIntegrity = wholeNumber(this._structuralIntegrity, this.getMinStructuralIntegrity(), Math.max(this.getMinStructuralIntegrity(), this.getMaxStructuralIntegrity()));
        this._armorTons = Math.min(this._armorTons, this.getMaxArmorTons());
        this._fuelTons = Math.min(this._fuelTons, this._tonnage);
        this._crew = Math.max(this._crew, this.getMinimumCrew());
        this._officers = Math.min(this._officers, this._crew);
        this._dockingCollars = Math.min(this._dockingCollars, this.getMaxDockingCollars());
        if (!this.isSpaceStation()) this._gravDecks.large = 0;
    }

    public getWeights(): { name: string; weight: number }[] { return this._weights; }
    public getCurrentTonnage(): number { return this._currentTonnage; }
    public getRemainingTonnage(): number { return Math.round((this._tonnage - this._currentTonnage) * 1000) / 1000; }

    private _calc(): void {
        // Drone carrier control systems: 2 tons plus 0.5 per drone (TO:AUE p.117).
        sizeDroneSystems(this._equipmentList, this._tonnage);
        const quarters = quartersTypes.filter((type) => this._quarters[type.tag] > 0)
            .map((type) => ({ name: `Quarters, ${type.name} (${this._quarters[type.tag]})`, weight: this._quarters[type.tag] * type.tons }));
        const bays = this._bays.map((bay) => {
            const type = findTransportBayType(bay.tag);
            const amount = type && type.tonsEach === null ? `${bay.amount} tons` : `${bay.amount}`;
            return { name: `${this.getBayName(bay)} (${amount}, ${bay.doors} door${bay.doors === 1 ? "" : "s"})`, weight: this.getBayWeight(bay) };
        });
        const gravDecks = GRAV_DECKS.filter((deck) => this._gravDecks[deck.tag] > 0)
            .map((deck) => ({ name: `${deck.name} (${this._gravDecks[deck.tag]})`, weight: deck.tons * this._gravDecks[deck.tag] }));
        this._weights = [
            { name: `Structural Integrity (${this.getStructuralIntegrity()})`, weight: this.getStructureWeight() },
            ...(this.isMonitor() ? [{ name: "Monitor Keel (Custom)", weight: this.getKeelWeight() }] : []),
            { name: this.isWarShip() ? `Engine (Safe Thrust ${this._safeThrust})` : "Station-Keeping Drive", weight: this.getEngineWeight() },
            { name: `Fuel (${this.getFuelPoints()} points)`, weight: this._fuelTons },
            { name: "Fuel Tanks and Pumps", weight: this.getFuelPumpWeight() },
            ...(this.hasKFDrive() ? [
                { name: `${this.isWarShip() ? "Compact" : "Standard"} K-F Drive (Integrity ${this.getKFDriveIntegrity()})`, weight: this.getKFDriveWeight() },
                { name: `Jump Sail (Integrity ${this.getJumpSailIntegrity()})`, weight: this.getJumpSailWeight() },
            ] : []),
            ...(this.hasLithiumFusionBattery() ? [{ name: "Lithium-Fusion Battery", weight: this.getLithiumFusionBatteryWeight() }] : []),
            { name: "Control Systems", weight: this.getControlsWeight() },
            { name: `Armor (${this._armorType.name}, ${this.getPurchasedArmorPoints()} points + ${this.getFreeArmorPerFacing()} free a facing)`, weight: this._armorTons },
            { name: `Heat Sinks (${this.getTotalHeatSinks()} ${this._heatSinkType.name}, ${this.getFreeHeatSinks()} free)`, weight: this._additionalHeatSinks },
            ...(this.getFireControlWeight() > 0 ? [{ name: "Expanded Fire Control", weight: this.getFireControlWeight() }] : []),
            ...this._equipmentList.map((item) => ({ name: item.name, weight: item.weight || 0 })),
            ...this._capitalWeapons.map((mount) => {
                const shots = this.getCapitalShots(mount);
                return { name: `${mount.weapon.name}${getCapitalAmmoTags(mount.weapon).length ? ` (${shots} shot${shots === 1 ? "" : "s"})` : ""}`, weight: this.getCapitalWeaponWeight(mount) };
            }),
            ...(this._dockingCollars > 0 ? [{ name: `Docking Collars (${this._dockingCollars})`, weight: this._dockingCollars * DOCKING_COLLAR_TONS }] : []),
            ...gravDecks,
            ...quarters,
            ...bays,
            ...(this._escapePods > 0 ? [{ name: `Escape Pods (${this._escapePods})`, weight: this._escapePods * ESCAPE_SYSTEM_TONS }] : []),
            ...(this._lifeBoats > 0 ? [{ name: `Lifeboats (${this._lifeBoats})`, weight: this._lifeBoats * ESCAPE_SYSTEM_TONS }] : []),
        ];
        this._currentTonnage = Math.round(this._weights.reduce((sum, entry) => sum + entry.weight, 0) * 1000) / 1000;
        this._calcCost();
        this._calcBattleValue();
    }

    /**
     * Lowest rules level the vessel is legal at, for the printed sheet: Advanced, since these units "fall outside the
     * purview of the standard-rules game" (SO:AA p.8); higher for its equipment, and Custom Homebrew for a monitor.
     */
    public getRequiredRulesLevel(): number {
        let level = ADVANCED_RULES_LEVEL;
        for (const item of this._equipmentList) level = Math.max(level, getEquipmentRulesLevel(item));
        for (const mount of this._capitalWeapons) level = Math.max(level, mount.weapon.rulesLevel);
        if (this.isMonitor()) level = Math.max(level, CUSTOM_HOMEBREW_RULES_LEVEL);
        return level;
    }

    /** Damage Threshold of each facing: a tenth of its armor, rounded up (TW p.239), in capital points. */
    public getDamageThresholds(): ICapitalShipArmorAllocation {
        const thresholds = {} as ICapitalShipArmorAllocation;
        for (const facing of ADVANCED_AEROSPACE_FACINGS) thresholds[facing] = Math.ceil(this.getFacingArmor(facing) / 10);
        return thresholds;
    }

    // Alpha Strike (Alpha Strike Companion pp.91-117 and 144, errata v1.6) ---------------------------------------------

    /** How much of a firing arc's weapons count toward each Alpha Strike arc (ASC pp.102-103). */
    private _asArcShares(arc: AdvancedAerospaceArc): Partial<Record<CapitalShipASArc, number>> {
        // A WarShip's fore-sides join the nose and each aft-side joins its broadside.
        if (this.isWarShip()) {
            switch (arc) {
                case "nose": case "foreLeft": case "foreRight": return { front: 1 };
                case "leftBroadside": case "aftLeft": return { left: 1 };
                case "rightBroadside": case "aftRight": return { right: 1 };
                default: return { rear: 1 };
            }
        }
        // A JumpShip combines its arcs as a spheroid DropShip does. ASC p.103 gives stations six arcs, but their
        // published cards have four, as MegaMek gives them: stations are converted the JumpShip way (flagged).
        switch (arc) {
            case "nose": return { front: 1 };
            case "aft": return { rear: 1 };
            case "foreLeft": return { front: 0.5, left: 0.5 };
            case "foreRight": return { front: 0.5, right: 0.5 };
            case "aftLeft": return { left: 0.5, rear: 0.5 };
            default: return { right: 0.5, rear: 0.5 };
        }
    }

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

    private _bayTransportSpecial(code: string, tags: string[]): string | null {
        const bays = this._bays.filter((bay) => tags.includes(bay.tag));
        const units = bays.reduce((sum, bay) => sum + bay.amount, 0);
        return units > 0 ? `${code}${units}D${bays.reduce((sum, bay) => sum + bay.doors, 0)}` : null;
    }

    public getAlphaStrikeStats(): ICapitalShipAlphaStrikeStats {
        let log = "";
        const raw = {} as Record<CapitalShipASArc, Record<LargeCraftASAttackClass, number[]>>;
        for (const arc of CAPITAL_SHIP_AS_ARCS) raw[arc.tag] = { STD: [0, 0, 0, 0], CAP: [0, 0, 0, 0], SCAP: [0, 0, 0, 0], MSL: [0, 0, 0, 0] };
        const add = (location: string | undefined, attackClass: LargeCraftASAttackClass, damage: number[]) => {
            if (!location || !this.getArcs().includes(location as AdvancedAerospaceArc)) return;
            for (const [arc, share] of Object.entries(this._asArcShares(location as AdvancedAerospaceArc)) as [CapitalShipASArc, number][]) {
                raw[arc][attackClass] = raw[arc][attackClass].map((value, index) => value + damage[index] * share);
            }
        };

        // Standard weapons use their catalog records' alphaStrike values; capital and sub-capital weapons the ASC p.114 table.
        let heat = 0;
        for (const item of this._equipmentList) {
            if (item.isAmmo) continue;
            heat += getLargeCraftASHeat(item);
            const as = item.alphaStrike;
            if (!as) continue;
            const multiplier = this._asAmmoMultiplier(item) * (as.tc && this._equipmentList.some((entry) => /targeting-computer/.test(entry.tag)) ? 1.1 : 1);
            add(item.location, "STD", [as.rangeShort || 0, as.rangeMedium || 0, as.rangeLong || 0, as.rangeExtreme || 0].map((value) => value * multiplier));
        }
        let tele = false;
        for (const mount of this._capitalWeapons) {
            const values = CAPITAL_WEAPON_ALPHA_STRIKE[mount.weapon.tag];
            heat += values ? values.heat : mount.weapon.heat ?? 0;
            if (!values) continue;
            const shots = this.getCapitalShots(mount);
            const multiplier = !mount.weapon.ammo ? 1 : shots <= 0 ? 0 : shots < CAPITAL_SHIP_MIN_SHOTS ? 0.75 : 1;
            tele = tele || !!values.tele;
            add(mount.location, values.attackClass, values.damage.map((value) => value * multiplier));
        }

        // Every weapon's heat counts against the heat sinks; past the dissipation by 4 or more, damage is base x
        // dissipation / (heat - 4), worked out the same for each attack type (ASC pp.115-116, Converting Heat errata).
        const dissipation = this.getHeatDissipation();
        const factor = heat - dissipation >= 4 ? dissipation / (heat - 4) : 1;
        log += `Heat ${heat} against ${dissipation} dissipated${factor < 1 ? `: damage x ${factor.toFixed(3)}` : ""}<br />`;
        const arcs = {} as Record<CapitalShipASArc, Record<LargeCraftASAttackClass, ILargeCraftASDamageValue[]>>;
        for (const arc of CAPITAL_SHIP_AS_ARCS) {
            arcs[arc.tag] = {} as Record<LargeCraftASAttackClass, ILargeCraftASDamageValue[]>;
            for (const attackClass of LARGE_CRAFT_AS_ATTACK_CLASSES) {
                arcs[arc.tag][attackClass] = raw[arc.tag][attackClass].map((value) => toLargeCraftASDamage(value * factor));
                if (raw[arc.tag][attackClass].some((value) => value > 0)) {
                    log += `${arc.name} ${attackClass}: ${raw[arc.tag][attackClass].map((value) => (value * factor).toFixed(2)).join("/")} = ${arcs[arc.tag][attackClass].map(formatLargeCraftASDamage).join("/")}<br />`;
                }
            }
        }

        // Size by tonnage (p.92); Thrust, or 0.2 Thrust for a station-keeping drive (p.94); capital armor x 0.33 (p.95);
        // Structure is a WarShip's SI and 1 for the others (p.98).
        const type: CapitalShipASType = this.isWarShip() ? "WS" : this.isSpaceStation() ? "SS" : "JS";
        const size = getCapitalShipASSize(this.isWarShip(), this._tonnage);
        const movement = this.isWarShip() ? this.getSafeThrust() : 0.2;
        const moveCode = this.isWarShip() ? "" : "k";
        const capitalArmor = ADVANCED_AEROSPACE_FACINGS.reduce((sum, facing) => sum + this.getFacingArmor(facing), 0);
        const armor = getCapitalASArmor(capitalArmor);
        const structure = this.getStructuralIntegrity();
        const threshold = getLargeCraftASThreshold(armor, CAPITAL_SHIP_AS_ARCS.length);
        log += `${type}, Size ${size}, Thrust ${movement}${moveCode}, Armor ${armor} (${capitalArmor} x 0.33), Structure ${structure}, Threshold ${threshold}<br />`;

        const specials: string[] = [];
        const crew = Math.round(this._crew / 120);
        if (crew >= 1) specials.push(`CRW${crew}`);
        if (this.hasKFDrive()) specials.push("KF");
        if (this.hasLithiumFusionBattery()) specials.push("LF");
        if (this._dockingCollars > 0) specials.push(`DT${this._dockingCollars}`);
        for (const [code, tags] of [["AT", ["fighter"]], ["ST", ["small-craft"]], ["MT", ["mech"]], ["PT", ["protomech"]],
            ["VTM", ["vehicle-light"]], ["VTH", ["vehicle-heavy"]], ["VTS", ["vehicle-superheavy"]]] as [string, string[]][]) {
            const special = this._bayTransportSpecial(code, tags);
            if (special) specials.push(special);
        }
        // Cargo: general cargo bays in tons, as kilotons from 1,000 tons, with their doors (ASC p.122).
        const cargoBays = this._bays.filter((bay) => { const bayType = findTransportBayType(bay.tag); return !!bayType && !bayType.infantry && (bayType.cargoFactor !== undefined || bayType.tag === "cargo-container"); });
        const cargo = cargoBays.reduce((total, bay) => total + this.getBayWeight(bay), 0);
        const cargoDoors = cargoBays.reduce((total, bay) => total + bay.doors, 0);
        if (cargo > 0) specials.push(`${cargo >= 1000 ? `CK${Math.round(cargo) / 1000}` : `CT${Math.round(cargo * 1000) / 1000}`}${cargoDoors > 0 ? `-D${cargoDoors}` : ""}`);
        const infantry = this._bays.filter((bay) => findTransportBayType(bay.tag)?.infantry).reduce((sum, bay) => sum + this.getBayWeight(bay), 0);
        if (infantry > 0) specials.push(`IT${Math.round(infantry * 10) / 10}`);
        const screens = this._capitalWeapons.filter((mount) => mount.weapon.tag === "screen-launcher").length;
        if (screens > 0) specials.push(`SCR${screens}`);
        if (tele) specials.push("TELE");
        // Point Defense for the whole ship; MegaMek records it by arc, which the card's arc boxes allow.
        const pointDefense = Math.ceil(roundUpToTenth(this._equipmentList.reduce((sum, item) => sum + getLargeCraftASPointDefense(item), 0)) - 1e-9);
        if (pointDefense > 0) specials.push(`PNT${pointDefense}`);
        const equipmentSpecials = new Set<string>();
        for (const item of this._equipmentList) {
            if (item.isAmmo) continue;
            for (const code of item.alphaStrike?.specialAbility ?? []) {
                if (!code.includes("#")) equipmentSpecials.add(code);
            }
        }
        specials.push(...[...equipmentSpecials].filter((code) => !specials.includes(code)));
        specials.sort();

        // Point Value (ASC p.144): standard and missile damage at Short, Medium and Long over every arc, plus a fifth of
        // the capital and sub-capital damage, then / 4 for a WarShip and / 3 for a JumpShip or station. Minimal damage counts 0.
        const sum = (classes: LargeCraftASAttackClass[]) => CAPITAL_SHIP_AS_ARCS.reduce((total, arc) => total
            + classes.reduce((classTotal, attackClass) => classTotal + arcs[arc.tag][attackClass].slice(0, 3).reduce((bracketTotal, value) => bracketTotal + value.damage, 0), 0), 0);
        const attack = sum(["STD", "MSL"]) + sum(["CAP", "SCAP"]) / 5;
        const offensive = attack / (this.isWarShip() ? 4 : 3);
        const movementFactor = getLargeCraftMovementFactor(movement);
        const defensive = movementFactor + pointDefense + armor * 1.5 + structure + threshold * size / 2;
        let subtotal = offensive + defensive;
        for (const code of equipmentSpecials) subtotal += LARGE_CRAFT_AS_DEFENSIVE_ABILITY_FACTORS[code] ?? 0;
        const pointValue = Math.max(1, Math.round(subtotal));
        log += `Offensive value ${attack.toFixed(2)} / ${this.isWarShip() ? 4 : 3} = ${offensive.toFixed(2)}; Defensive value: Thrust ${movementFactor}${pointDefense ? ` + PNT ${pointDefense}` : ""} + Armor ${armor} x 1.5 + Structure ${structure} + Threshold ${threshold} x Size ${size} / 2 = ${defensive.toFixed(2)}<br />`;
        log += `Point Value ${pointValue}<br />`;

        return { type, size, movement, moveCode, armor, structure, threshold, arcs, pointValue, specialAbilities: specials, calcLog: log };
    }

    /** Everything that keeps the design from being legal under SO:AA, in plain words. */
    public getIssues(rulesLevel: number = 2): string[] {
        const issues: string[] = [];
        const remaining = this.getRemainingTonnage();
        if (remaining < 0) issues.push(`Overweight by ${(-remaining).toLocaleString("en-US")} tons.`);
        if (this.getStructuralIntegrity() < this.getMinStructuralIntegrity() || this.getStructuralIntegrity() > this.getMaxStructuralIntegrity()) {
            issues.push(`Structural Integrity must be from ${this.getMinStructuralIntegrity()} to ${this.getMaxStructuralIntegrity()} (Maximum Thrust to 30 times it, SO:AA p.136).`);
        }
        if (this._armorTons > this.getMaxArmorTons()) issues.push(`Armor exceeds the maximum of ${this.getMaxArmorTons()} tons (SO:AA p.140).`);
        if (this.getUnallocatedArmorPoints() < 0) {
            issues.push(`${-this.getUnallocatedArmorPoints()} more armor points are allocated than the armor provides (${this.getPurchasedArmorPoints()}).`);
        }
        if (this.getArmorPointsPerTon() === null) issues.push(`${this._armorType.name} is not capital armor for this tech base.`);
        else if (!this._datesAvailability(armorDates(this._armorType), rulesLevel).available) issues.push(`${this._armorType.name} is not available in the selected era.`);
        const unplaced = this._equipmentList.filter((item) => !item.location).length + this._capitalWeapons.filter((mount) => !mount.location).length;
        if (unplaced > 0) issues.push(`${unplaced} weapon${unplaced === 1 ? " has" : "s have"} no firing arc yet.`);
        for (const item of this._equipmentList) {
            if (!this.isEquipmentAllowed(item)) issues.push(`${item.name} cannot be mounted on a ${this.getShipTypeName()}.`);
        }
        for (const mount of this._capitalWeapons) {
            if (!this.isCapitalWeaponAllowed(mount.weapon)) issues.push(`${mount.weapon.name} cannot be mounted on a ${this.getShipTypeName()}.`);
            else if (mount.weapon.rulesLevel > rulesLevel) issues.push(`${mount.weapon.name} needs a higher rules level (${mount.weapon.book}).`);
            else if (!this._capitalTechAllowed(mount.weapon) || !this._datesAvailability(this._capitalDates(mount.weapon), rulesLevel).available) {
                issues.push(`${mount.weapon.name} is not available to this tech base in the selected era.`);
            }
            if (getCapitalAmmoTags(mount.weapon).length > 0 && this.getCapitalShots(mount) < CAPITAL_SHIP_MIN_SHOTS) {
                issues.push(`${mount.weapon.name}: ${this.getCapitalShots(mount)} shots carried, at least ${CAPITAL_SHIP_MIN_SHOTS} needed (SO:AA p.142).`);
            }
        }
        for (const shortfall of this.getAmmunitionShortfalls()) {
            issues.push(`${shortfall.name}: ${shortfall.shots} shots carried, at least ${shortfall.needed} needed (10 for each weapon, SO:AA p.142).`);
        }
        // Side weapons must be the same on both sides (SO:AA p.142).
        const checked = new Set<AdvancedAerospaceArc>();
        for (const arc of this.getArcs()) {
            const other = ADVANCED_AEROSPACE_OPPOSITE_ARC[arc];
            if (!other || checked.has(other)) continue;
            checked.add(arc);
            const tags = (side: AdvancedAerospaceArc) => [...this.getArcItems(side).map((item) => item.tag), ...this.getArcCapitalWeapons(side).map((mount) => mount.weapon.tag)].sort().join(",");
            if (tags(arc) !== tags(other)) issues.push(`${this.getArcName(arc)} and ${this.getArcName(other)} must carry the same weapons (SO:AA p.142).`);
        }
        const hottest = this.getHottestBayHeat();
        if (this.getHeatDissipation() < hottest) {
            issues.push(`Heat sinks dissipate ${this.getHeatDissipation()}; the hottest weapon bay makes ${hottest}, and the sinks must cover it (SO:AA p.142).`);
        }
        if (this._crew < this.getMinimumCrew()) issues.push(`The crew must be at least ${this.getMinimumCrew()} (${this.getBaseCrew()} and ${this.getMinimumGunners()} gunners, SO:AA p.138).`);
        if (this._officers < this.getMinimumOfficers()) issues.push(`One crew member in six is an officer: at least ${this.getMinimumOfficers()} for this crew (SO:AA p.138).`);
        if (this.getQuartersCapacity() < this.getPeopleNeedingQuarters()) {
            issues.push(`Quarters for ${this.getQuartersCapacity()} of ${this.getPeopleNeedingQuarters()} crew, marines and passengers; all but bay personnel need quarters (SO:AA p.138).`);
        }
        if (this.getBayDoors() > this.getMaxBayDoors()) issues.push(`${this.getBayDoors()} bay doors; this ${this.getShipTypeName()} has no more than ${this.getMaxBayDoors()} (SO:AA p.143).`);
        if (this._bays.length > 0 && this.getBayDoors() < 1) issues.push("A vessel with transport bays needs at least one bay door (SO:AA p.143).");
        if (this._dockingCollars > this.getMaxDockingCollars()) issues.push(`No more than ${this.getMaxDockingCollars()} docking collars (one for every 50,000 tons, TO:AUE p.116).`);
        if (this.getGravDeckCount() > this.getMaxGravDecks()) issues.push(`No more than ${this.getMaxGravDecks()} grav decks (TO:AUE p.126).`);
        if (this.hasKFBoom() && this._tonnage > KF_BOOM_STATION_MAX_TONS) issues.push("A space station with a K-F boom weighs no more than 100,000 tons (SO:AA p.139).");
        if (this.isMonitor() && rulesLevel < CUSTOM_HOMEBREW_RULES_LEVEL) issues.push("A monitor (a WarShip with no K-F drive) is Custom Homebrew: set the rules level to Custom Homebrew.");
        if (this._fuelTons <= 0) issues.push("The vessel carries no fuel.");
        return issues;
    }

    /** Things worth knowing that are not errors. */
    public getNotes(): string[] {
        const notes: string[] = [];
        const remaining = this.getRemainingTonnage();
        if (remaining > 0) notes.push(`${remaining.toLocaleString("en-US")} tons are unspent: cargo if a bay is added for them, wasted otherwise.`);
        const limit = getAdvancedAerospaceType(this._shipType).weaponsPerArc;
        for (const arc of this.getArcs()) {
            const count = this.getArcWeaponCount(arc);
            if (count > limit) notes.push(`${this.getArcName(arc)}: ${count} weapons, over the ${limit} an arc holds; ${this.getArcFireControlWeight(arc)} tons of expanded fire control added (SO:AA p.143).`);
        }
        if (this.isMonitor()) {
            notes.push(`Custom monitor: it cannot jump. A JumpShip or WarShip carries it on ${this.getCarrierCollarsNeeded()} docking collars, one for every 100,000 tons.`);
            notes.push("Custom monitor: the keel, doubled crew and collar transport are this tool's rules, after the SLDF's monitors (XTRO: Boondoggles p.19); the book also gives them triple maintenance costs.");
        }
        if (this.hasKFBoom()) notes.push("SO:AA gives the K-F boom no weight of its own; only the cost multiplier changes (p.139).");
        notes.push("Alpha Strike, the record sheet and play are not built for JumpShips, WarShips and space stations yet.");
        return notes;
    }

    private _itemIsAvailable(introduced: number | null, extinct: number | null, reintroduced: number | null): boolean {
        const eraStart = this._era.yearStart;
        const eraEnd = this._era.yearEnd ?? Number.POSITIVE_INFINITY;
        const overlapsEra = (introduced ?? 0) <= eraEnd && (!extinct || extinct >= eraStart);
        return overlapsEra || (!!reintroduced && reintroduced <= eraEnd);
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

    // Cost (SO:AA p.146) --------------------------------------------------------------------------------------

    public getCBillCost(): number { return this._cost; }
    public getCBillCostLog(): string { return this._calcLogCost; }

    public getBattleValue(): number { return this._battleValue; }
    public getBattleValueLog(): string { return this._calcLogBV; }

    /** A launcher with Artemis IV counts 20 percent more than the plain launcher (TM p.312), with Artemis V 30 percent (TO:AUE p.197). */
    private _weaponBaseBV(item: IEquipmentItem): number {
        return getArtemisLauncherBattleValue(item, () => this._catalog());
    }

    /**
     * Battle Value (SO:AA pp.148-149, on TM pp.311-313). Defensive: capital armor x 25 + Structural Integrity x 20 +
     * defensive equipment, x 0.75 (JumpShip), 0.8 (WarShip) or 0.7 (station); the explosive-ammunition subtraction is
     * for fighters and Small Craft only (TM p.311). Offensive, by firing arc on weapon BV without ammunition: the
     * strongest arc (a WarShip's nose, aft or broadsides; any arc on the others) is the front, x 1. The stronger arc
     * beside it is x 1, or x 0.5 if firing it with the front passes the heat sink capacity. The arc opposite the front
     * is x 0.5, or x 0.25 if the front and that adjacent arc pass it; every other arc x 0.25. Ammunition, capped at
     * the BV of the weapons of its model, goes with their arcs. Then x the Speed Factor for Maximum Thrust: a
     * WarShip's own, 1 for a JumpShip, 0 for a station.
     * Readings: p.149 halves the adjacent arc when "firing this arc" would pass the capacity, so its heat counts with
     * the front's (MegaMek checks the front alone). For the opposite arc the book is unclear and MegaMek's reading is
     * used (the front and adjacent arcs' heat). A tie for front takes nose, aft, left then right broadside, and a tie
     * beside it the right-hand arc (the book says pick at random), as MegaMek does.
     */
    private _calcBattleValue(): void {
        let log = "<strong>DEFENSIVE BATTLE RATING</strong><br />";
        const armorPoints = ADVANCED_AEROSPACE_FACINGS.reduce((sum, facing) => sum + this.getFacingArmor(facing), 0);
        const structuralIntegrity = this.getStructuralIntegrity();
        let defensive = armorPoints * ADVANCED_AEROSPACE_BV_ARMOR_FACTOR + structuralIntegrity * ADVANCED_AEROSPACE_BV_SI_FACTOR;
        log += `Armor: ${armorPoints} capital points x ${ADVANCED_AEROSPACE_BV_ARMOR_FACTOR} = ${armorPoints * ADVANCED_AEROSPACE_BV_ARMOR_FACTOR}<br />Structural Integrity: ${structuralIntegrity} x ${ADVANCED_AEROSPACE_BV_SI_FACTOR} = ${structuralIntegrity * ADVANCED_AEROSPACE_BV_SI_FACTOR}<br />`;
        const items = this._equipmentList.filter((item) => !item.isAmmo);
        let amsAmmoBV = 0;
        let amsBV = 0;
        for (const item of this._equipmentList) {
            if (item.isAmmo) {
                const fed = items.find((weapon) => weapon.battleValueDefensive && getCompatibleAmmo(weapon, item));
                if (fed) amsAmmoBV += getAmmoBattleValuePerTon(fed, item) * (item.weight || 0);
            } else if (item.battleValueDefensive) {
                defensive += item.battleValue || 0;
                if (item.weaponType?.includes("AMS")) amsBV += item.battleValue || 0;
                log += `+ Defensive Equipment: ${escapeLogText(item.name)} = ${item.battleValue || 0}<br />`;
            }
        }
        defensive += Math.min(amsAmmoBV, amsBV);
        if (amsAmmoBV > 0) log += `+ Anti-missile ammunition = ${Math.min(amsAmmoBV, amsBV)}<br />`;
        for (const mount of this._capitalWeapons.filter((entry) => entry.weapon.battleValueDefensive)) {
            const ammoBV = Math.min(mount.weapon.battleValue, Object.keys(mount.shots).reduce((sum, tag) => sum + getCapitalAmmoBattleValue(tag, mount.shots[tag]), 0));
            defensive += mount.weapon.battleValue + ammoBV;
            log += `+ Defensive Equipment: ${escapeLogText(mount.weapon.name)} = ${mount.weapon.battleValue} + ammunition ${ammoBV}<br />`;
        }
        const typeModifier = getAdvancedAerospaceType(this._shipType).bvTypeModifier;
        log += `Subtotal ${defensive.toFixed(2)} x ${typeModifier} (${escapeLogText(this.getShipTypeName())})`;
        defensive *= typeModifier;
        log += ` = ${defensive.toFixed(2)}<br />`;

        log += "<strong>OFFENSIVE BATTLE RATING</strong><br />";
        const ring = getAdvancedAerospaceArcRing(this._shipType);
        const arcBV: Record<string, number> = {};
        const arcHeat: Record<string, number> = {};
        const arcAmmoBV: Record<string, number> = {};
        for (const arc of ring) { arcBV[arc] = 0; arcHeat[arc] = 0; arcAmmoBV[arc] = 0; }
        const weapons = this._equipmentList.filter((item) => this._isWeapon(item) && (item.location ?? "") in arcBV);
        for (const item of weapons) {
            arcBV[item.location as string] += this._weaponBaseBV(item);
            arcHeat[item.location as string] += SmallCraft.bvHeat(item);
        }
        const capital = this._capitalWeapons.filter((mount) => !mount.weapon.battleValueDefensive && (mount.location ?? "") in arcBV);
        for (const mount of capital) {
            arcBV[mount.location as string] += mount.weapon.battleValue;
            arcHeat[mount.location as string] += this.getCapitalWeaponHeat(mount);
        }
        // Ammunition, capped at the unmodified BV of the weapons of its model, shared among their arcs.
        const weaponBVByTag: Record<string, number> = {};
        for (const item of weapons) weaponBVByTag[item.tag] = (weaponBVByTag[item.tag] ?? 0) + (item.battleValue || 0);
        const ammoBVByTag: Record<string, number> = {};
        for (const ammo of this._equipmentList.filter((item) => item.isAmmo)) {
            const fed = weapons.find((weapon) => getCompatibleAmmo(weapon, ammo));
            if (fed) ammoBVByTag[fed.tag] = (ammoBVByTag[fed.tag] ?? 0) + getAmmoBattleValuePerTon(fed, ammo) * (ammo.weight || 0);
        }
        for (const [tag, value] of Object.entries(ammoBVByTag)) {
            const capped = Math.min(value, weaponBVByTag[tag] ?? 0);
            for (const item of weapons.filter((weapon) => weapon.tag === tag)) {
                arcAmmoBV[item.location as string] += weaponBVByTag[tag] > 0 ? capped * (item.battleValue || 0) / weaponBVByTag[tag] : 0;
            }
            log += `Ammunition for ${escapeLogText(tag)} = ${capped.toFixed(2)}${capped < value ? " (capped at weapon BV)" : ""}, with the arcs of its weapons<br />`;
        }
        for (const tag of new Set(capital.map((mount) => mount.weapon.tag))) {
            const mounts = capital.filter((mount) => mount.weapon.tag === tag);
            const ammoBV = mounts.map((mount) => Object.keys(mount.shots).reduce((sum, ammoTag) => sum + getCapitalAmmoBattleValue(ammoTag, mount.shots[ammoTag]), 0));
            const value = ammoBV.reduce((sum, entry) => sum + entry, 0);
            if (value <= 0) continue;
            const capped = Math.min(value, mounts.reduce((sum, mount) => sum + mount.weapon.battleValue, 0));
            mounts.forEach((mount, index) => { arcAmmoBV[mount.location as string] += capped * ammoBV[index] / value; });
            log += `Ammunition for ${escapeLogText(mounts[0].weapon.name)} = ${capped.toFixed(2)}${capped < value ? " (capped at weapon BV)" : ""}, with the arcs of its weapons<br />`;
        }
        for (const arc of ring) log += `${escapeLogText(this.getArcName(arc))}: weapons ${arcBV[arc].toFixed(2)}, heat ${arcHeat[arc]}<br />`;

        const front = getAdvancedAerospaceFrontArcCandidates(this._shipType).reduce((best, arc) => (arcBV[arc] > arcBV[best] ? arc : best));
        const index = ring.indexOf(front);
        const leftward = ring[(index + 1) % ring.length];
        const rightward = ring[(index + ring.length - 1) % ring.length];
        const adjacent = arcBV[leftward] > arcBV[rightward] ? leftward : rightward;
        const opposite = ring[(index + ring.length / 2) % ring.length];
        const efficiency = this.getHeatDissipation();
        const over = arcHeat[front] + arcHeat[adjacent] > efficiency;
        log += `Heat Efficiency ${efficiency} (heat sink capacity); the front and adjacent arcs make ${arcHeat[front] + arcHeat[adjacent]} heat<br />`;
        const factor = (arc: AdvancedAerospaceArc): [string, number] => arc === front ? ["front", 1]
            : arc === adjacent ? ["adjacent", over ? 0.5 : 1]
                : arc === opposite ? ["opposite", over ? 0.25 : 0.5]
                    : ["other", 0.25];
        let rating = 0;
        for (const arc of ring) {
            const value = arcBV[arc] + arcAmmoBV[arc];
            if (value <= 0) continue;
            const [role, multiplier] = factor(arc);
            rating += value * multiplier;
            log += `+ ${escapeLogText(this.getArcName(arc))} (${role}): ${value.toFixed(2)} x ${multiplier} = ${(value * multiplier).toFixed(2)}<br />`;
        }
        for (const item of items) {
            if (!this._isWeapon(item) && !item.battleValueDefensive && (item.battleValue || 0) > 0) {
                rating += item.battleValue || 0;
                log += `+ ${escapeLogText(item.name)} = ${item.battleValue}<br />`;
            }
        }
        const maxThrust = getAdvancedAerospaceBVMaxThrust(this._shipType, this._safeThrust);
        const speedFactor = SmallCraft.speedFactor(maxThrust);
        const offensive = rating * speedFactor;
        log += `Weapon Battle Rating ${rating.toFixed(2)} x Speed Factor ${speedFactor} (Max Thrust ${maxThrust}) = ${offensive.toFixed(2)}<br />`;

        this._battleValue = Math.round(defensive + offensive);
        log += `<strong>Battle Value</strong>: ${defensive.toFixed(2)} + ${offensive.toFixed(2)} = ${this._battleValue}<br />`;
        this._calcLogBV = log;
    }

    private _calcCost(): void {
        const rows: [string, number][] = getAdvancedAerospaceStructuralCosts({
            type: this._shipType,
            tonnage: this._tonnage,
            safeThrust: this.getSafeThrust(),
            structuralIntegrity: this.getStructuralIntegrity(),
            engineTons: this.getEngineWeight(),
            fuelTons: this._fuelTons,
            crewAndPassengers: this.getPeopleNeedingQuarters(),
            arcsWithWeapons: this.getArcs().filter((arc) => this.getArcWeaponCount(arc) > 0).length,
            dockingCollars: this._dockingCollars,
            sailTons: this.getJumpSailWeight(),
            kfIntegrity: this.getKFDriveIntegrity(),
            lithiumFusionBattery: this.hasLithiumFusionBattery(),
            kfDrive: this.hasKFDrive(),
        }).map((row) => [row.name, row.cost]);
        rows.push([`Armor (${this._armorType.name}, ${this._armorTons} t)`, this._armorTons * (this._armorType.costMultiplier || 10000)]);
        rows.push([`Heat Sinks (${this.getTotalHeatSinks()} ${this._heatSinkType.name})`, this.getTotalHeatSinks() * (this._heatSinkType.tag === "double" ? 6000 : 2000)]);
        const equipment = this._equipmentList.reduce((sum, item) => sum + (item.isAmmo ? (item.cbills || 0) * (item.weight || 0) : item.cbills || 0), 0);
        if (equipment > 0) rows.push(["Weapons, Equipment and Ammunition", equipment]);
        for (const mount of this._capitalWeapons) {
            const ammo = Object.keys(mount.shots).reduce((sum, tag) => sum + getCapitalAmmoCost(tag, mount.shots[tag]), 0);
            rows.push([`${mount.weapon.name}${ammo > 0 ? " and ammunition" : ""}`, mount.weapon.cbills + ammo]);
        }
        for (const deck of GRAV_DECKS) if (this._gravDecks[deck.tag] > 0) rows.push([`${deck.name} (${this._gravDecks[deck.tag]})`, deck.cost * this._gravDecks[deck.tag]]);
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
        const multiplier = getAdvancedAerospaceCostMultiplier(this._shipType, this.hasKFBoom());
        this._cost = Math.round(subtotal * multiplier);
        const money = (value: number) => Math.round(value).toLocaleString("en-US");
        this._calcLogCost = rows.map(([name, value]) => `${escapeLogText(name)}: ${money(value)}`).join("<br />")
            + `<br />Subtotal ${money(subtotal)} x ${multiplier} (${escapeLogText(this.getShipTypeName())}${this.hasKFBoom() ? " with a K-F boom" : ""}) = <strong>${money(this._cost)}</strong>`;
    }

    // Roster and play ------------------------------------------------------------------------------------------
    // Total Warfare's aerospace rules (pp.237-240) with SO:AA's hit location table and critical hits (pp.82-83).
    // Armor and Structural Integrity are capital scale: standard-scale damage is totaled per location and divided by
    // 10, rounding .5 up (TW p.238).

    public getPilot(): Pilot { return this._pilot; }
    public setPilot(pilot: Pilot): Pilot {
        this._pilot = pilot;
        return this._pilot;
    }

    /** Battle Value adjusted for the crew's skills, with the multipliers Small Craft use. */
    public getPilotAdjustedBattleValue(edition?: string): number {
        const multiplier = getSkillMultiplier(this._pilot.gunnery ?? 4, this._pilot.piloting ?? 5, "fighter", edition) ?? 1;
        return Math.round(this._battleValue * multiplier);
    }

    public getInPlay(): ICapitalShipInPlay { return this._inPlay; }
    public resetInPlay(): void { this._inPlay = newCapitalShipInPlay(); }
    /** A new turn: no arc has fired yet. */
    public turnReset(): void { this._inPlay.firedArcs = []; }

    public static bayKey(arc: AdvancedAerospaceArc, index: number): string { return `${arc}:${index}`; }
    public isBayDestroyed(arc: AdvancedAerospaceArc, index: number): boolean { return this._inPlay.destroyedBays.includes(CapitalShip.bayKey(arc, index)); }
    public setBayDestroyed(arc: AdvancedAerospaceArc, index: number, destroyed: boolean): void {
        const key = CapitalShip.bayKey(arc, index);
        this._inPlay.destroyedBays = this._inPlay.destroyedBays.filter((entry) => entry !== key);
        if (destroyed && this.getArcs().includes(arc) && index >= 0 && index < this.getArcWeaponBays(arc).length) this._inPlay.destroyedBays.push(key);
    }
    /** The bays of an arc that can still fire, with their index in getArcWeaponBays(). */
    public getWorkingBays(arc: AdvancedAerospaceArc): (ICapitalShipWeaponBay & { index: number })[] {
        return this.getArcWeaponBays(arc).map((bay, index) => ({ ...bay, index })).filter((bay) => !this.isBayDestroyed(arc, bay.index));
    }

    /**
     * Large Craft work on zero net heat: firing an arc costs the heat of all its working bays, and the arcs fired in a
     * turn may not pass the heat sinks' dissipation (TW p.161; SO:AA p.82).
     */
    public getArcHeat(arc: AdvancedAerospaceArc): number { return this.getWorkingBays(arc).reduce((sum, bay) => sum + bay.heat, 0); }
    public getHeatThisTurn(): number { return this._inPlay.firedArcs.reduce((sum, arc) => sum + this.getArcHeat(arc), 0); }
    public isArcFired(arc: AdvancedAerospaceArc): boolean { return this._inPlay.firedArcs.includes(arc); }
    /** Marks an arc as fired; false (and not marked) when its heat would pass the dissipation or it has no working bay. */
    public setArcFired(arc: AdvancedAerospaceArc, fired: boolean): boolean {
        this._inPlay.firedArcs = this._inPlay.firedArcs.filter((entry) => entry !== arc);
        if (!fired) return true;
        if (!this.getArcs().includes(arc) || this.getWorkingBays(arc).length === 0 || this._inPlay.cic >= 3) return false;
        if (this.getHeatThisTurn() + this.getArcHeat(arc) > this.getHeatDissipation()) return false;
        this._inPlay.firedArcs.push(arc);
        return true;
    }

    public getCurrentFacingArmor(facing: AdvancedAerospaceFacing): number { return Math.max(0, this.getFacingArmor(facing) - this._inPlay.armorDamage[facing]); }
    public getCurrentArmor(): number { return ADVANCED_AEROSPACE_FACINGS.reduce((sum, facing) => sum + this.getCurrentFacingArmor(facing), 0); }
    public getArmorPercentage(): number {
        const total = ADVANCED_AEROSPACE_FACINGS.reduce((sum, facing) => sum + this.getFacingArmor(facing), 0);
        return total > 0 ? Math.round(this.getCurrentArmor() / total * 100) : 0;
    }
    public getCurrentStructure(): number { return Math.max(0, this.getStructuralIntegrity() - this._inPlay.structureDamage); }
    public getStructurePercentage(): number { return Math.round(this.getCurrentStructure() / Math.max(1, this.getStructuralIntegrity()) * 100); }
    public setArmorDamage(facing: AdvancedAerospaceFacing, points: number): void {
        if (ADVANCED_AEROSPACE_FACINGS.includes(facing)) this._inPlay.armorDamage[facing] = wholeNumber(points, 0, this.getFacingArmor(facing));
    }
    public setStructureDamage(points: number): void { this._inPlay.structureDamage = wholeNumber(points, 0, this.getStructuralIntegrity()); }
    public setCriticalHits(track: CapitalShipCriticalTrack, hits: number): void {
        const max = CAPITAL_SHIP_CRITICAL_TRACKS.find((entry) => entry.tag === track)?.max;
        if (max !== undefined) this._inPlay[track] = wholeNumber(hits, 0, max);
    }
    public setLifeSupportDamaged(damaged: boolean): void { this._inPlay.lifeSupport = damaged === true; }
    public setKFDriveDamage(points: number): void { this._inPlay.kfDriveDamage = wholeNumber(points, 0, this.hasKFDrive() ? this.getKFDriveIntegrity() : 0); }
    public setDockingCollarsDamaged(count: number): void { this._inPlay.dockingCollarsDamaged = wholeNumber(count, 0, this._dockingCollars); }
    public setGravDecksDamaged(count: number): void { this._inPlay.gravDecksDamaged = wholeNumber(count, 0, this.getGravDeckCount()); }
    public setDoorsDamaged(count: number): void { this._inPlay.doorsDamaged = wholeNumber(count, 0, this.getBayDoors()); }
    public setCargoLostPercent(percent: number): void { this._inPlay.cargoLostPercent = wholeNumber(percent, 0, 100); }

    public getCurrentKFDriveIntegrity(): number { return this.hasKFDrive() ? Math.max(0, this.getKFDriveIntegrity() - this._inPlay.kfDriveDamage) : 0; }
    /** A K-F drive at Integrity 0 cannot jump (SO:AA p.82). */
    public canJump(): boolean { return this.getCurrentKFDriveIntegrity() > 0; }
    public isEngineDestroyed(): boolean { return this._inPlay.engine >= 6; }
    /** Each engine hit takes 1 Safe Thrust; the sixth destroys the engine (TW p.240). */
    public getCurrentSafeThrust(): number { return this.isEngineDestroyed() ? 0 : Math.max(0, this.getSafeThrust() - this._inPlay.engine); }
    public getCurrentMaxThrust(): number { return Math.ceil(this.getCurrentSafeThrust() * 1.5); }
    public isDestroyed(): boolean { return this.getCurrentStructure() <= 0 || this._inPlay.fuelExploded; }
    public isDamaged(): boolean {
        const play = this._inPlay;
        return ADVANCED_AEROSPACE_FACINGS.some((facing) => play.armorDamage[facing] > 0) || play.structureDamage > 0
            || CAPITAL_SHIP_CRITICAL_TRACKS.some((track) => play[track.tag] > 0) || play.lifeSupport || play.kfDriveDamage > 0
            || play.dockingCollarsDamaged > 0 || play.gravDecksDamaged > 0 || play.doorsDamaged > 0 || play.cargoLostPercent > 0
            || play.fuelExploded || play.destroyedBays.length > 0;
    }
    /** To-hit modifier from damage: CIC +2 a hit (no attacks at 3), sensors +1, +2, then +5, crew +1 a hit (TW pp.239-240). Null when the ship cannot attack. */
    public getDamageToHitModifier(): number | null {
        const play = this._inPlay;
        if (play.cic >= 3 || play.crewHits >= 6) return null;
        return play.cic * 2 + (play.sensors >= 3 ? 5 : play.sensors) + play.crewHits;
    }
    /** Control Roll modifier: avionics +1, +2, then +5 when destroyed; +2 for failed life support (TW pp.239-240). */
    public getControlRollModifier(): number { return (this._inPlay.avionics >= 3 ? 5 : this._inPlay.avionics) + (this._inPlay.lifeSupport ? 2 : 0); }

    public getPendingWeaponCritical(): (ICapitalShipPendingWeaponCritical & { bays: (ICapitalShipWeaponBay & { index: number })[] }) | null {
        const pending = this._inPlay.pendingWeaponCriticals[0];
        return pending ? { ...pending, bays: this.getWorkingBays(pending.arc) } : null;
    }
    /** Destroys the chosen bay for the waiting critical hit. False when it is not a working bay of that arc. */
    public resolvePendingWeaponCritical(index: number): boolean {
        const pending = this.getPendingWeaponCritical();
        if (!pending || !pending.bays.some((bay) => bay.index === index)) return false;
        this.setBayDestroyed(pending.arc, index, true);
        this._inPlay.pendingWeaponCriticals.shift();
        return true;
    }
    public skipPendingWeaponCritical(): void { this._inPlay.pendingWeaponCriticals.shift(); }

    private _applyCritical(hit: ICapitalShipHit, damage: number, random: () => number, fuelRoll?: number): string {
        const play = this._inPlay;
        const d6 = () => Math.floor(random() * 6) + 1;
        switch (hit.critical) {
            case "avionics":
                play.avionics = Math.min(3, play.avionics + 1);
                return `Avionics hit ${play.avionics}: Control Rolls at +${play.avionics >= 3 ? 5 : play.avionics}; make a Control Roll now`;
            case "control":
                return "Control hit: make a Control Roll, or go out of control";
            case "crew":
                play.crewHits = Math.min(6, play.crewHits + 1);
                return play.crewHits >= 6 ? "Crew hit 6: the crew is disabled" : `Crew hit ${play.crewHits}: +1 to hit for each`;
            case "engine":
                play.engine = Math.min(6, play.engine + 1);
                return play.engine >= 6 ? "Engine hit 6: the engine is destroyed"
                    : `Engine hit ${play.engine}: Safe Thrust -1 (now ${this.getCurrentSafeThrust()}/${this.getCurrentMaxThrust()})`;
            case "cic":
                play.cic = Math.min(3, play.cic + 1);
                return play.cic >= 3 ? "CIC hit 3: the Combat Information Center is destroyed; no weapon attacks" : `CIC hit ${play.cic}: +2 to hit for each`;
            case "sensors":
                play.sensors = Math.min(3, play.sensors + 1);
                return play.sensors >= 3 ? "Sensor hit 3: the sensors are destroyed; +5 to hit" : `Sensor hit ${play.sensors}: +1 to hit for each`;
            case "lifeSupport":
                play.lifeSupport = true;
                return "Life support fails: +2 to all Control Rolls";
            case "thruster": {
                const left = hit.facing === "foreLeft" || hit.facing === "aftLeft";
                const track = left ? "leftThruster" : "rightThruster";
                play[track] = Math.min(4, play[track] + 1);
                const away = left ? "right" : "left";
                return play[track] >= 4 ? `${left ? "Left" : "Right"} thruster hit 4: the thrusters are out; no turns to the ${away}`
                    : `${left ? "Left" : "Right"} thruster hit ${play[track]}: turns to the ${away} cost ${play[track]} more`;
            }
            case "kfDrive":
                if (!this.hasKFDrive()) return "K-F Drive hit: no K-F drive, no effect";
                play.kfDriveDamage = Math.min(this.getKFDriveIntegrity(), play.kfDriveDamage + 1);
                return `K-F Drive hit: Drive Integrity ${this.getCurrentKFDriveIntegrity()}${this.canJump() ? "" : "; the ship cannot jump"}`;
            case "dockingCollar":
                if (play.dockingCollarsDamaged >= this._dockingCollars) return "Docking Collar hit: no working collar, no effect";
                play.dockingCollarsDamaged += 1;
                return "Docking Collar hit: one collar can no longer take a DropShip";
            case "gravDeck":
                if (play.gravDecksDamaged >= this.getGravDeckCount()) return "Grav Deck hit: no working grav deck, no effect";
                play.gravDecksDamaged += 1;
                return "Grav Deck hit: a grav deck, picked at random, is out (no effect in the battle)";
            case "door":
                if (play.doorsDamaged >= this.getBayDoors()) return "Door hit: no working bay door, no effect";
                play.doorsDamaged += 1;
                return "Door hit: one bay door, picked at random, cannot be used for the rest of the scenario";
            case "cargo": {
                // Capital-scale damage over twice the SI (TW p.239 uses standard scale only for DropShips and Small Craft).
                const percent = Math.min(100, Math.ceil(damage / (2 * Math.max(1, this.getStructuralIntegrity())) * 100));
                play.cargoLostPercent = Math.min(100, play.cargoLostPercent + percent);
                return `Cargo hit: ${percent} percent of the cargo is destroyed (damage ${damage} / twice the Structural Integrity); roll 1D6, 1-3 general cargo, 4-6 carried units`;
            }
            case "fuel": {
                const roll = fuelRoll ?? d6() + d6();
                if (roll >= 10) {
                    play.fuelExploded = true;
                    return `Fuel tank hit, roll ${roll}: the fuel explodes and the ship is destroyed`;
                }
                return `Fuel tank hit, roll ${roll}: no explosion (10+ explodes)`;
            }
            default: {
                const arc = hit.weaponArc;
                if (!arc || !this.getArcs().includes(arc)) return "Weapon hit: the ship has no such firing arc, no effect";
                const arcName = this.getArcName(arc);
                const working = this.getWorkingBays(arc);
                const waiting = play.pendingWeaponCriticals.filter((pending) => pending.arc === arc).length;
                if (working.length - waiting <= 0) return `Weapon hit on the ${arcName}: no working bay there, no effect`;
                if (working.length === 1) {
                    this.setBayDestroyed(arc, working[0].index, true);
                    return `Weapon hit on the ${arcName}: the ${working[0].name} bay is destroyed`;
                }
                const chooser = d6();
                play.pendingWeaponCriticals.push({ arc, chooser: chooser <= 3 ? "controlling" : "attacking" });
                return `Weapon hit on the ${arcName}, roll ${chooser}: the ${chooser <= 3 ? "controlling" : "attacking"} player chooses a bay there to mark destroyed`;
            }
        }
    }

    /**
     * Resolves one hit: hit location by attack direction and 2D6 (SO:AA p.83), capital-scale armor damage, half of any
     * excess (rounded down, TW p.238; MegaMek rounds normally) against Structural Integrity, then a critical hit check
     * (8+ on 2D6) for each of: damage over the facing's Damage Threshold, Structural Integrity damage and a natural 12;
     * a capital missile adds its own check (TW p.239). Standard-scale damage is divided by 10, .5 up (TW p.238).
     */
    public resolveAttack(roll: number, direction: CapitalShipAttackDirection, damage: number,
        options: { standardScale?: boolean; natural12?: boolean; sideRoll?: number; criticalRolls?: number[]; fuelRoll?: number; missileTag?: string } = {},
        random: () => number = Math.random): string[] {
        const d6 = () => Math.floor(random() * 6) + 1;
        const log: string[] = [];
        const given = Math.max(0, Math.floor(Number.isFinite(damage) ? damage : 0));
        const points = options.standardScale ? Math.floor(given / 10 + 0.5) : given;
        const hit = getCapitalShipHitLocation(roll, direction, this.isWarShip(), options.sideRoll ?? d6());
        const facingName = this.getFacingName(hit.facing);
        const armorDamage = Math.min(this.getCurrentFacingArmor(hit.facing), points);
        this._inPlay.armorDamage[hit.facing] += armorDamage;
        const structureDamage = Math.min(this.getCurrentStructure(), Math.floor((points - armorDamage) / 2));
        this._inPlay.structureDamage += structureDamage;
        log.push(`Hit location ${roll}: ${facingName} / ${CAPITAL_SHIP_CRITICAL_NAMES[hit.critical]} takes ${armorDamage} armor`
            + (options.standardScale ? ` (${given} standard-scale damage / 10 = ${points})` : "")
            + (points > armorDamage ? ` and ${structureDamage} Structural Integrity (half of the ${points - armorDamage} left over, rounded down)` : ""));
        if (this.getCurrentStructure() <= 0) {
            log.push("Structural Integrity is gone: the ship is destroyed");
            return log;
        }
        const checks: { reason: string; target: number }[] = [];
        const threshold = this.getDamageThresholds()[hit.facing];
        if (points > threshold) checks.push({ reason: `damage ${points} over the Damage Threshold of ${threshold}`, target: 8 });
        if (structureDamage >= 1) checks.push({ reason: "Structural Integrity damage", target: 8 });
        if (options.natural12) checks.push({ reason: "a natural 12 to hit", target: 8 });
        const missileChance = options.missileTag ? CAPITAL_MISSILE_CRITICAL_CHANCE[options.missileTag] : undefined;
        if (missileChance !== undefined && armorDamage > 0) checks.push({ reason: "a capital missile", target: missileChance });
        checks.forEach((check, index) => {
            const result = options.criticalRolls?.[index] ?? d6() + d6();
            if (result >= check.target) log.push(`Critical check for ${check.reason}: ${result}. ${this._applyCritical(hit, points, random, options.fuelRoll)}`);
            else log.push(`Critical check for ${check.reason}: ${result}, no critical hit (${check.target}+ needed)`);
        });
        return log;
    }

    private _importPlay(pilot: unknown, inPlay: unknown): void {
        this._pilot = new Pilot();
        if (isPlainObject(pilot)) {
            this._pilot.name = savedString(pilot.name).slice(0, 200);
            this._pilot.piloting = Math.floor(savedNumber(pilot.piloting, 5, 0, 8));
            this._pilot.gunnery = Math.floor(savedNumber(pilot.gunnery, 4, 0, 8));
            this._pilot.wounds = Math.floor(savedNumber(pilot.wounds, 0, 0, 6));
        }
        this._inPlay = newCapitalShipInPlay();
        if (!isPlainObject(inPlay)) return;
        const armor = isPlainObject(inPlay.armorDamage) ? inPlay.armorDamage : {};
        for (const facing of ADVANCED_AEROSPACE_FACINGS) this.setArmorDamage(facing, savedNumber(armor[facing], 0, 0, 1000000));
        this.setStructureDamage(savedNumber(inPlay.structureDamage, 0, 0, 100000));
        for (const track of CAPITAL_SHIP_CRITICAL_TRACKS) this.setCriticalHits(track.tag, savedNumber(inPlay[track.tag], 0, 0, track.max));
        this.setLifeSupportDamaged(inPlay.lifeSupport === true);
        this.setKFDriveDamage(savedNumber(inPlay.kfDriveDamage, 0, 0, 1000));
        this.setDockingCollarsDamaged(savedNumber(inPlay.dockingCollarsDamaged, 0, 0, 1000));
        this.setGravDecksDamaged(savedNumber(inPlay.gravDecksDamaged, 0, 0, 1000));
        this.setDoorsDamaged(savedNumber(inPlay.doorsDamaged, 0, 0, 1000));
        this.setCargoLostPercent(savedNumber(inPlay.cargoLostPercent, 0, 0, 100));
        this._inPlay.fuelExploded = inPlay.fuelExploded === true;
        const destroyed = Array.isArray(inPlay.destroyedBays) ? inPlay.destroyedBays.slice(0, MAX_CAPITAL_SHIP_EQUIPMENT) : [];
        for (const key of destroyed) {
            if (typeof key !== "string") continue;
            const [arc, index] = key.split(":");
            if (this.getArcs().includes(arc as AdvancedAerospaceArc)) this.setBayDestroyed(arc as AdvancedAerospaceArc, Number(index), true);
        }
        const fired = Array.isArray(inPlay.firedArcs) ? inPlay.firedArcs.slice(0, 8) : [];
        for (const arc of fired) if (typeof arc === "string" && this.getArcs().includes(arc as AdvancedAerospaceArc)) this.setArcFired(arc as AdvancedAerospaceArc, true);
        const pending = Array.isArray(inPlay.pendingWeaponCriticals) ? inPlay.pendingWeaponCriticals.slice(0, 20) : [];
        for (const entry of pending) {
            if (!isPlainObject(entry)) continue;
            const arc = this.getArcs().find((candidate) => candidate === entry.arc);
            if (arc) this._inPlay.pendingWeaponCriticals.push({ arc, chooser: entry.chooser === "attacking" ? "attacking" : "controlling" });
        }
    }

    // Saving and loading --------------------------------------------------------------------------------------

    public export(noInPlayVariables: boolean = false): ICapitalShipExport {
        return {
            ...(noInPlayVariables ? {} : {
                pilot: this._pilot.export(),
                inPlay: {
                    ...this._inPlay, armorDamage: { ...this._inPlay.armorDamage }, destroyedBays: [...this._inPlay.destroyedBays],
                    firedArcs: [...this._inPlay.firedArcs], pendingWeaponCriticals: this._inPlay.pendingWeaponCriticals.map((entry) => ({ ...entry })),
                },
            }),
            version: 1,
            uuid: this._uuid,
            quirks: this.quirks.export(),
            lastUpdated: this.lastUpdated,
            name: this._name,
            ...(this._rulesEdition !== DEFAULT_RULES_EDITION ? { rulesEdition: this._rulesEdition } : {}),
            model: this._model,
            shipType: this._shipType,
            tonnage: this._tonnage,
            tech: this._tech.tag,
            era: this._era.tag,
            safeThrust: this._safeThrust,
            structuralIntegrity: this._structuralIntegrity,
            fuelTons: this._fuelTons,
            lithiumFusionBattery: this._lithiumFusionBattery,
            kfBoom: this._kfBoom,
            monitor: this._monitor,
            armorType: this._armorType.tag,
            armorTons: this._armorTons,
            armorAllocation: { ...this._armorAllocation },
            heatSinkType: this._heatSinkType.tag,
            additionalHeatSinks: this._additionalHeatSinks,
            crew: this._crew,
            officers: this._officers,
            marines: this._marines,
            passengers: this._passengers,
            quarters: { ...this._quarters },
            bays: this._bays.map((bay) => ({ ...bay })),
            dockingCollars: this._dockingCollars,
            gravDecks: { ...this._gravDecks },
            escapePods: this._escapePods,
            lifeBoats: this._lifeBoats,
            equipment: this._equipmentList.map((item) => ({ tag: item.tag, location: item.location, uuid: item.uuid })),
            capitalWeapons: this._capitalWeapons.map((mount) => ({ tag: mount.weapon.tag, location: mount.location, uuid: mount.uuid, shots: { ...mount.shots } })),
        };
    }
    public exportJSON(): string { return JSON.stringify(this.export()); }
    public getImportIssues(): string[] { return this._importIssues; }

    /**
     * Loads a saved vessel. Saves can come from other people's backup files, so every field is type-checked,
     * allowlisted or clamped through the setters, and anything dropped is recorded in getImportIssues().
     */
    public importJSON(json: string): void {
        this._importIssues = [];
        const issue = (text: string) => { if (this._importIssues.length < 50) this._importIssues.push(text); };
        let parsed: unknown;
        try {
            parsed = JSON.parse(json);
        } catch {
            issue("The saved vessel could not be read");
            return;
        }
        if (!isPlainObject(parsed)) {
            issue("The saved vessel is not an object");
            return;
        }
        const saved = parsed as Partial<Record<keyof ICapitalShipExport, unknown>>;
        this._uuid = savedString(saved.uuid).slice(0, 100) || generateUUID();
        this.quirks.import(saved.quirks);
        const updated = typeof saved.lastUpdated === "string" || typeof saved.lastUpdated === "number" ? new Date(saved.lastUpdated) : new Date();
        this.lastUpdated = Number.isNaN(updated.getTime()) ? new Date() : updated;
        this.setName(savedString(saved.name));
        this.setModel(savedString(saved.model));
        this._rulesEdition = getSelectableRulesEditionTag(saved.rulesEdition, "capital-ship");
        if (saved.shipType !== undefined && !advancedAerospaceTypes.some((type) => type.tag === saved.shipType)) issue("Ignored an unknown vessel type");
        this._shipType = advancedAerospaceTypes.find((type) => type.tag === saved.shipType)?.tag ?? "warShip";
        this._kfBoom = saved.kfBoom === true;
        this._monitor = saved.monitor === true;
        this.setTech(savedString(saved.tech));
        this.setEra(savedString(saved.era));
        this.setTonnage(savedNumber(saved.tonnage, this.getMinTonnage(), this.getMinTonnage(), this.getMaxTonnage()));
        this.setSafeThrust(savedNumber(saved.safeThrust, 1, 1, MAX_CAPITAL_SHIP_SAFE_THRUST));
        this.setStructuralIntegrity(savedNumber(saved.structuralIntegrity, this.getMinStructuralIntegrity(), 0, 10000));
        this.setFuelTons(savedNumber(saved.fuelTons, 0, 0, this._tonnage));
        this._lithiumFusionBattery = saved.lithiumFusionBattery === true;
        const armorTag = savedString(saved.armorType);
        this.setArmorType(armorTag);
        if (armorTag && this._armorType.tag !== armorTag) issue(`Replaced armor "${armorTag.slice(0, 40)}" with ${this._armorType.name}`);
        this.setArmorTons(savedNumber(saved.armorTons, 0, 0, this._tonnage));
        const armor = isPlainObject(saved.armorAllocation) ? saved.armorAllocation : {};
        this._armorAllocation = emptyArmor();
        for (const facing of ADVANCED_AEROSPACE_FACINGS) this.setArmorAllocation(facing, savedNumber(armor[facing], 0, 0, 1000000));
        this.setHeatSinkType(savedString(saved.heatSinkType));
        this.setAdditionalHeatSinks(savedNumber(saved.additionalHeatSinks, 0, 0, this._tonnage));

        this._equipmentList = [];
        if (saved.equipment !== undefined && !Array.isArray(saved.equipment)) issue("Ignored an equipment list that is not a list");
        const entries = Array.isArray(saved.equipment) ? saved.equipment : [];
        if (entries.length > MAX_CAPITAL_SHIP_EQUIPMENT) issue(`Kept the first ${MAX_CAPITAL_SHIP_EQUIPMENT} of ${entries.length} equipment entries`);
        const catalog = this._catalog();
        for (const entry of entries.slice(0, MAX_CAPITAL_SHIP_EQUIPMENT)) {
            const catalogItem = isPlainObject(entry) && typeof entry.tag === "string" ? findByTag(catalog, entry.tag) : undefined;
            if (!isPlainObject(entry) || !catalogItem) {
                issue(`Skipped unknown equipment${isPlainObject(entry) && typeof entry.tag === "string" ? ` "${entry.tag.slice(0, 60)}"` : ""}`);
                continue;
            }
            this._equipmentList.push(this._newEquipment(catalogItem, entry.location, entry.uuid));
        }
        this._capitalWeapons = [];
        if (saved.capitalWeapons !== undefined && !Array.isArray(saved.capitalWeapons)) issue("Ignored a capital weapon list that is not a list");
        for (const entry of (Array.isArray(saved.capitalWeapons) ? saved.capitalWeapons : []).slice(0, MAX_CAPITAL_SHIP_CAPITAL_WEAPONS)) {
            const weapon = isPlainObject(entry) && typeof entry.tag === "string" ? findCapitalWeapon(entry.tag) : undefined;
            if (!isPlainObject(entry) || !weapon) {
                issue("Skipped a capital weapon that could not be read");
                continue;
            }
            this._capitalWeapons.push(this._newCapitalMount(weapon, entry.location, entry.shots, entry.uuid));
        }

        this._crew = Math.floor(savedNumber(saved.crew, this.getMinimumCrew(), 0, MAX_CAPITAL_SHIP_PEOPLE));
        this._officers = Math.floor(savedNumber(saved.officers, getAdvancedAerospaceMinimumOfficers(this._crew), 0, this._crew));
        this.setMarines(savedNumber(saved.marines, 0, 0, MAX_CAPITAL_SHIP_PEOPLE));
        this.setPassengers(savedNumber(saved.passengers, 0, 0, MAX_CAPITAL_SHIP_PEOPLE));
        this._quarters = emptyQuarters();
        const savedQuarters = isPlainObject(saved.quarters) ? saved.quarters : {};
        for (const type of quartersTypes) this.setQuarters(type.tag, savedNumber(savedQuarters[type.tag], 0, 0, MAX_CAPITAL_SHIP_PEOPLE));
        this._bays = [];
        if (saved.bays !== undefined && !Array.isArray(saved.bays)) issue("Ignored a bay list that is not a list");
        for (const entry of (Array.isArray(saved.bays) ? saved.bays : []).slice(0, MAX_CAPITAL_SHIP_BAYS)) {
            if (!isPlainObject(entry) || typeof entry.tag !== "string" || !findTransportBayType(entry.tag)) {
                issue("Skipped a bay that could not be read");
                continue;
            }
            this._bays.push({ tag: entry.tag, amount: 1, doors: 0 });
            this.setBay(this._bays.length - 1, savedNumber(entry.amount, 1, 0, this._tonnage), savedNumber(entry.doors, 0, 0, 1000));
        }
        this.setDockingCollars(savedNumber(saved.dockingCollars, 0, 0, 1000));
        this._gravDecks = emptyGravDecks();
        const decks = isPlainObject(saved.gravDecks) ? saved.gravDecks : {};
        for (const deck of GRAV_DECKS) this.setGravDecks(deck.tag, savedNumber(decks[deck.tag], 0, 0, 1000));
        this.setEscapePods(savedNumber(saved.escapePods, 0, 0, MAX_CAPITAL_SHIP_PEOPLE));
        this.setLifeBoats(savedNumber(saved.lifeBoats, 0, 0, MAX_CAPITAL_SHIP_PEOPLE));
        this._calc();
        this._importPlay(saved.pilot, saved.inPlay);
        this._clampToRules();
        this._calc();
    }
}

