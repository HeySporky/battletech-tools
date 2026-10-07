import { generateUUID } from "../utils/generateUUID";
import { aerospaceArmorTypes, getAerospaceArmorPointsPerTon } from "../data/aerospace-armor-types";
import { mechEngineOptions } from "../data/mech-engine-options";
import { mechEngineTypes } from "../data/mech-engine-types";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { btTechOptions } from "../data/tech-options";
import { btEraOptions, findEraByTag, getClosestEraForTech, getErasForTech } from "../data/era-options";
import { CUSTOM_HOMEBREW_RULES_LEVEL, getAmmoBattleValuePerTon, getCompatibleAmmo, getEffectiveIntroduction, getEquipmentListByTech, getEquipmentRulesLevel, getWeaponShotsPerTon, isEquipmentWithinRulesLevel } from "../data/equipment-registry";
import { AlphaStrikeUnit, IASMULUnit } from "./alpha-strike-unit";
import Pilot, { IPilot } from "./pilot";
import { getSkillMultiplier } from "../data/skill-multipliers";
import { FIGHTER_CRITICAL_NAMES, FighterAttackDirection, FighterCritical, getFighterHitLocation } from "../data/fighter-hit-tables";
import { isTargetingComputerWeapon } from "../data/variable-equipment";
import { findByTag } from "../data/tag-match";
import { IAerospaceArmorType, IEngineType, IEquipmentItem, IEras, IHeatSync, ITechDates, ITechOptions } from "../data/data-interfaces";

// Aerospace Fighter construction (TechManual pp.180-197). Shares the engine, heat sink and equipment catalogs
// with BattleMechs and Combat Vehicles; armor comes from the aerospace armor catalog. The same class builds
// conventional fighters, which differ in weight limit, engine, controls, fuel, armor limit and heat sinks.

export type FighterType = "aerospace" | "conventional";
export const FIGHTER_TYPES: { tag: FighterType; name: string }[] = [
    { tag: "aerospace", name: "Aerospace Fighter" },
    { tag: "conventional", name: "Conventional Fighter" },
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
/** Unit Type Modifiers Table (TM p.316). */
export const FIGHTER_BV_TYPE_MODIFIER: Record<FighterType, number> = { aerospace: 1.2, conventional: 1.1 };

/** An Alpha Strike damage value: a whole number, or minimal damage (0*). */
export interface IFighterASDamageValue {
    damage: number;
    minimal: boolean;
}

export interface IFighterAlphaStrikeStats {
    type: "AF" | "CF";
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
}

export interface IAerospaceFighterExport {
    uuid: string;
    lastUpdated: Date;
    name: string;
    model: string;
    /** Absent in saves made before conventional fighters could be built: those are aerospace fighters. */
    fighterType?: FighterType;
    /** VSTOL equipment, conventional fighters only (TM p.190). */
    vstol?: boolean;
    /** An OmniFighter: equipment may be pod-mounted (aerospace fighters only). */
    omni?: boolean;
    /** Bombs and pods on the external hardpoints. */
    externalStores?: IFighterExternalStore[];
    tonnage: number;
    tech: string;
    era: string;
    engineType: string;
    safeThrust: number;
    fuelTons: number;
    armorType: string;
    armorAllocation: IFighterArmorAllocation;
    heatSinkType: string;
    additionalHeatSinks: number;
    equipment: IFighterEquipmentExport[];
    pilot?: IPilot;
    inPlay?: IFighterInPlay;
}

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
    private _uuid: string = generateUUID();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _model: string = "";
    private _fighterType: FighterType = "aerospace";
    private _vstol: boolean = false;
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
    private _heatSinkType: IHeatSync = mechHeatSinkTypes[0];
    private _additionalHeatSinks: number = 0;
    private _equipmentList: IEquipmentItem[] = [];
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
    public getFighterTypeName(): string { return FIGHTER_TYPES.find((type) => type.tag === this._fighterType)?.name ?? ""; }
    public isConventional(): boolean { return this._fighterType === "conventional"; }

    /** Switching type pulls tonnage, engine, thrust, armor and heat sinks back inside the new type's rules. */
    public setFighterType(type: string): FighterType {
        this._fighterType = type === "conventional" ? "conventional" : type === "aerospace" ? "aerospace" : this._fighterType;
        if (this.isConventional()) this._omni = false;
        if (this.isConventional()) this._heatSinkType = mechHeatSinkTypes.find((sink) => sink.tag === "single") ?? this._heatSinkType;
        if (!this.getPermittedEngineTags().includes(this._engineType.tag)) this._engineType = mechEngineTypes[0];
        if (this.getArmorPointsPerTon() === null) this._armorType = aerospaceArmorTypes[0];
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

    /** Whether VSTOL equipment is offered to this fighter at the rules level. */
    public isVSTOLOffered(rulesLevel: number = 2): boolean {
        return this.isConventional() || rulesLevel >= AEROSPACE_VSTOL_RULES_LEVEL;
    }

    // OmniFighters --------------------------------------------------------------------------------------------

    public isOmni(): boolean { return this._omni; }

    /** Only aerospace fighters can be built as Omnis (TM pp.184, 285). A standard fighter has no pods. */
    public setOmni(omni: boolean): boolean {
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
    public getVSTOLWeight(): number { return this._vstol ? roundUpHalf(this._tonnage * 0.05) : 0; }

    public getTonnage(): number { return this._tonnage; }
    public getMaxTonnage(): number { return this.isConventional() ? CONVENTIONAL_FIGHTER_MAX_TONNAGE : FIGHTER_MAX_TONNAGE; }

    /**
     * 5 to 100 tons in 5-ton increments, 5 to 50 for a conventional fighter (TM p.184). Thrust, fuel and armor
     * are pulled back inside the new limits.
     */
    public setTonnage(tonnage: number): number {
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

    /** Max Thrust = Safe Thrust x 1.5, rounded up (TM p.186). */
    public getMaxThrust(): number { return Math.ceil(this._safeThrust * 1.5); }

    /** What the engine formula takes off Safe Thrust: 2 for an aerospace fighter, nothing for a conventional one. */
    private _thrustOffset(): number { return this.isConventional() ? 0 : 2; }

    /** Engine rating = tonnage x (Safe Thrust - 2); tonnage x Safe Thrust for a conventional fighter (TM p.185). */
    public getEngineRating(): number { return this._tonnage * (this._safeThrust - this._thrustOffset()); }

    /** The lowest Safe Thrust whose engine is on the Master Engine Table, which starts at a rating of 10. */
    public getMinSafeThrust(): number { return Math.ceil(10 / this._tonnage) + this._thrustOffset(); }

    /** The highest Safe Thrust whose engine is on the Master Engine Table, which ends at a rating of 400. */
    public getMaxSafeThrust(): number { return Math.floor(FIGHTER_MAX_ENGINE_RATING / this._tonnage) + this._thrustOffset(); }

    public setSafeThrust(safeThrust: number): number {
        const value = Number.isFinite(safeThrust) ? Math.floor(safeThrust) : this._safeThrust;
        this._safeThrust = Math.min(this.getMaxSafeThrust(), Math.max(this.getMinSafeThrust(), value));
        this._calc();
        return this._safeThrust;
    }

    /**
     * From the Master Engine Table (TM p.49); an aerospace fighter's fusion engine needs no extra shielding.
     * "Conventional fighters multiply fusion engine weights by 1.5 (round up to the nearest 0.5 ton)" (TM p.185).
     */
    public getEngineWeight(): number {
        const rating = this.getEngineRating();
        const option = mechEngineOptions.find((entry) => entry.rating >= rating) ?? mechEngineOptions[mechEngineOptions.length - 1];
        const tag = this._engineType.tag as keyof typeof option.weight;
        const weight = option.weight[tag] ?? option.weight.standard;
        return this.isConventional() && this._engineType.tag !== "ice" ? roundUpHalf(weight * 1.5) : weight;
    }

    /** 3 tons; a tenth of the tonnage, rounded up to the half ton, for a conventional fighter (TM p.189). */
    public getControlsWeight(): number {
        return this.isConventional() ? roundUpHalf(this._tonnage * 0.1) : FIGHTER_COCKPIT_TONS;
    }

    /** The higher of Safe Thrust and 10 percent of tonnage, rounded down; it weighs nothing (TM p.187). */
    public getStructuralIntegrity(): number {
        return Math.max(this._safeThrust, Math.floor(this._tonnage / 10));
    }

    // Fuel ----------------------------------------------------------------------------------------------------

    public getFuelTons(): number { return this._fuelTons; }

    public setFuelTons(tons: number): number {
        const value = Number.isFinite(tons) ? tons : this._fuelTons;
        this._fuelTons = Math.min(this._tonnage, Math.max(0, Math.round(value * 2) / 2));
        this._calc();
        return this._fuelTons;
    }

    /** 80 fuel points per ton, 160 for a conventional fighter (TM p.186). */
    public getFuelPointsPerTon(): number {
        return this.isConventional() ? CONVENTIONAL_FIGHTER_FUEL_POINTS_PER_TON : FIGHTER_FUEL_POINTS_PER_TON;
    }

    public getFuelPoints(): number { return Math.floor(this._fuelTons * this.getFuelPointsPerTon()); }

    // Armor ---------------------------------------------------------------------------------------------------

    public getArmorType(): IAerospaceArmorType { return this._armorType; }

    /** Armor a fighter of this tech base can mount (TM pp.191-192). */
    public getAvailableArmorTypes(rulesLevel: number = 2): (IAerospaceArmorType & { available: boolean })[] {
        const techBase = this.getChassisTechBase();
        return aerospaceArmorTypes
            .filter((armor) => armor.fighterSlots !== null && armor.fighterSlots[techBase] !== null
                && getAerospaceArmorPointsPerTon(armor.tag, this._armorUnit(), techBase) !== null)
            .map((armor) => ({ ...armor, available: this._datesAvailability(armorDates(armor), rulesLevel).available }));
    }

    public setArmorType(tag: string): IAerospaceArmorType {
        const armor = this.getAvailableArmorTypes().find((entry) => entry.tag === tag);
        if (armor) this._armorType = aerospaceArmorTypes.find((entry) => entry.tag === armor.tag) ?? this._armorType;
        this._calc();
        return this._armorType;
    }

    private _armorUnit(): "aerospace-fighter" | "conventional-fighter" {
        return this.isConventional() ? "conventional-fighter" : "aerospace-fighter";
    }

    public getArmorPointsPerTon(): number | null {
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

    /** Tonnage x 8 points, tonnage x 1 for a conventional fighter (TM p.191). */
    public getMaxArmorPoints(): number { return this._tonnage * this.getMaxArmorPointsPerTonOfFighter(); }

    /**
     * Damage Threshold of each facing: a tenth of its full armor, rounded up. A single hit that does more than
     * this may cause a critical hit (TW p.239).
     */
    public getDamageThresholds(): IFighterArmorAllocation {
        const thresholds = emptyArmor();
        for (const arc of FIGHTER_ARCS) thresholds[arc.tag] = Math.ceil(this._armorAllocation[arc.tag] / 10);
        return thresholds;
    }

    /** Armor is bought in half tons: the allocated points divided by the points per ton, rounded up (TM p.191). */
    public getArmorWeight(): number {
        const perTon = this.getArmorPointsPerTon() ?? 16;
        return roundUpHalf(this.getTotalArmorPoints() / perTon);
    }

    /** Points the armor tonnage paid for but that are not allocated yet (fractions of a point are lost). */
    public getUnallocatedArmorPoints(): number {
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
        return mechHeatSinkTypes.filter((sink) => sink.tag === "single" || (sink.tag === "double" && !this.isConventional()))
            .map((sink) => ({ ...sink, available: sink.tag === "single" || this._techDatesAvailability(sink, rulesLevel).available }));
    }

    public setHeatSinkType(tag: string): IHeatSync {
        const allowed = tag === "single" || (tag === "double" && !this.isConventional());
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
    public getFreeHeatSinks(): number { return this._engineType.tag === "ice" ? 0 : FIGHTER_FREE_HEAT_SINKS; }

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
        return this._equipmentList.filter((item) => !item.isAmmo && (!this.isConventional() || AerospaceFighter._isEnergyWeapon(item)))
            .reduce((sum, item) => sum + (item.heatAero ?? item.heat ?? 0), 0);
    }

    /**
     * Power amplifiers: a turbine-powered conventional fighter needs 10 percent of its energy weapons' weight,
     * rounded up to the half ton (TM p.195). Flamers and chemical lasers are left out, as on vehicles.
     */
    public getPowerAmplifierWeight(): number {
        if (this._engineType.tag !== "ice") return 0;
        const energyTons = this._equipmentList
            .filter((item) => AerospaceFighter._isEnergyWeapon(item) && !/vehicle-flamer|chemical-laser/.test(item.tag))
            .reduce((sum, item) => sum + (item.weight || 0), 0);
        return roundUpHalf(energyTons * 0.1);
    }

    // Equipment -----------------------------------------------------------------------------------------------

    /** External stores hardpoints: tonnage divided by 5, rounded down (TM p.196). */
    public getExternalStoresHardpoints(): number { return Math.floor(this._tonnage / 5); }

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
        return Math.max(0, item.space?.aerospaceFighter ?? 0);
    }

    /** Weapon slots an arc has: 5, less what the armor type takes there (TM pp.191, 196). */
    public getArcSlots(arc: FighterArc): number {
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
        items.sort((a, b) => (a.sort > b.sort ? 1 : a.sort < b.sort ? -1 : 0));
        const offeredLevel = includeCustom ? Math.max(rulesLevel, CUSTOM_HOMEBREW_RULES_LEVEL) : rulesLevel;
        return items.filter((item) => isEquipmentWithinRulesLevel(item, offeredLevel));
    }

    private _catalog(): IEquipmentItem[] {
        const techTag = this._tech.tag;
        const own = getEquipmentListByTech(techTag, true);
        // A saved fighter keeps what it mounted, including equipment since moved to the other tech base's catalog.
        return techTag === "is" || techTag === "clan" ? [...own, ...getEquipmentListByTech(techTag === "clan" ? "mclan" : "mis", true)] : own;
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

    // Totals --------------------------------------------------------------------------------------------------

    public getWeights(): { name: string; weight: number }[] { return this._weights; }
    public getCurrentTonnage(): number { return this._currentTonnage; }
    public getRemainingTonnage(): number { return Math.round((this._tonnage - this._currentTonnage) * 1000) / 1000; }

    /** Everything that keeps the design from being legal under TechManual, in plain words. */
    public getIssues(rulesLevel: number = 2): string[] {
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
        this._weights = [
            { name: `Engine (${this._engineType.name}, rating ${this.getEngineRating()})`, weight: this.getEngineWeight() },
            { name: "Cockpit and Controls", weight: this.getControlsWeight() },
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
        const heat = item.heatAero ?? item.heat ?? 0;
        const text = `${item.tag} ${item.name}`.toLowerCase();
        if (item.isOneShot) return heat * 0.25;
        if (/rotary|\brac\b/.test(text)) return heat * 6;
        if (/ultra/.test(text)) return heat * 2;
        if (/streak/.test(text)) return heat * 0.5;
        return heat;
    }

    /**
     * A weapon's Battle Value before arc and heat adjustments. "Increase by 20 percent the BV of any missile
     * launcher equipped with Artemis IV" (TM p.303): the catalog holds a launcher with Artemis IV as its own
     * record, so the plain launcher's value is looked up and raised.
     */
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
        const rows: [string, number][] = [];
        if (this.isConventional()) {
            rows.push([`Avionics (4,000 x ${this.getControlsWeight()} t)`, 4000 * this.getControlsWeight()]);
        } else {
            rows.push(["Cockpit", 200000], ["Life Support", 50000], [`Sensors (2,000 x ${this._tonnage} t)`, 2000 * this._tonnage]);
        }
        if (this._vstol) rows.push([`VSTOL (5,000 x ${this.getVSTOLWeight()} t)`, 5000 * this.getVSTOLWeight()]);
        const structureRate = this.isConventional() ? 4000 : 50000;
        rows.push([`Structural Integrity (${structureRate.toLocaleString("en-US")} x ${this.getStructuralIntegrity()})`, structureRate * this.getStructuralIntegrity()]);
        rows.push(["Attitude Thruster", 25000], [`Landing Gear (10 x ${this._tonnage} t)`, 10 * this._tonnage]);
        const rating = this.getEngineRating();
        rows.push([`${this._engineType.name} Engine (${(this._engineType.costMultiplier || 0).toLocaleString("en-US")} x rating ${rating} x ${this._tonnage} t / 75)`,
            (this._engineType.costMultiplier || 0) * rating * this._tonnage / 75]);
        rows.push([`Fuel Tanks (200 x ${this._fuelTons} t)`, 200 * this._fuelTons]);
        rows.push([`Armor (${this._armorType.name}, ${this.getArmorWeight()} t)`, this.getArmorWeight() * (this._armorType.costMultiplier || 10000)]);
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

    /** The lowest rules level that allows everything on the design. */
    public getRequiredRulesLevel(): number {
        let level = this._vstol && !this.isConventional() ? AEROSPACE_VSTOL_RULES_LEVEL : 0;
        for (const item of this._equipmentList) level = Math.max(level, getEquipmentRulesLevel(item));
        for (const store of this._externalStores) {
            const record = this._storeRecord(store.tag);
            if (record) level = Math.max(level, getEquipmentRulesLevel(record));
        }
        return level;
    }

    // Alpha Strike --------------------------------------------------------------------------------------------
    // Conversion from the Alpha Strike Companion (pp.92-100, 115-116, 121), with the Point Value as MegaMek's
    // aerospace converter works it out; checked against Master Unit List cards in fighter-alpha-strike.test.ts.
    // Weapon damage comes from each catalog record's alphaStrike values.

    /** Fighters under 50 tons are Size 1, 50 to 74 tons Size 2, 75 tons and over Size 3 (ASC p.92). */
    public getAlphaStrikeSize(): number { return this._tonnage >= 75 ? 3 : this._tonnage >= 50 ? 2 : 1; }

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
        const specials: string[] = [`BOMB${size}`];
        if (this.isConventional()) {
            specials.push("ATMO");
            if (this._engineType.tag === "ice") specials.push("EE");
        } else {
            specials.push("SPC", `FUEL${Math.round(this.getFuelPoints() / 20)}`);
        }
        // The Master Unit List prints VSTOL on every fighter card, with or without the equipment.
        specials.push("VSTOL");
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

        const armor = Math.round(this.getTotalArmorPoints() / 30);
        const structure = Math.ceil(this.getStructuralIntegrity() / 2);
        const threshold = Math.ceil(armor / 3);
        const move = this._safeThrust;
        log += `Size ${size}, Thrust ${move}a, Armor ${armor} (${this.getTotalArmorPoints()} / 30), Structure ${structure} (SI ${this.getStructuralIntegrity()} / 2), Threshold ${threshold}<br />`;

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
            type: this.isConventional() ? "CF" : "AF",
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
            BFMove: `${stats.movement}a`,
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
        const multiplier = getSkillMultiplier(this._pilot?.gunnery ?? 4, this._pilot?.piloting ?? 5, "fighter", edition) ?? 1;
        return Math.round(this._battleValue * multiplier);
    }

    public getInPlay(): IFighterInPlay { return this._inPlay; }
    public resetInPlay(): void { this._inPlay = newFighterInPlay(); }
    /** A new turn: nothing is marked as fired yet. Heat stays until the Heat Phase works it off. */
    public turnReset(): void { this._inPlay.firedWeapons = []; }

    // Heat in play (TW p.161): an aerospace fighter builds heat from weapons fire and engine hits only.

    /** Conventional fighters work on a zero-heat principle and have no Heat Scale (TM p.193). */
    public tracksHeat(): boolean { return !this.isConventional(); }

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
        return play.fcs * 2 + (play.sensors >= 3 ? 5 : play.sensors) + play.pilotHits;
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
        const hit = getFighterHitLocation(roll, direction, options.wingRoll ?? d6());
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
        reasons.forEach((reason, index) => {
            const check = options.criticalRolls?.[index] ?? d6() + d6();
            if (check >= 8) log.push(`Critical check for ${reason}: ${check}. ${this._applyCritical(hit.critical, hit.arc, random, options.fuelRoll)}`);
            else log.push(`Critical check for ${reason}: ${check}, no critical hit (8+ needed)`);
        });
        return log;
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
            model: this._model,
            fighterType: this._fighterType,
            vstol: this._vstol,
            omni: this._omni,
            externalStores: this._externalStores.map((store) => ({ ...store })),
            tonnage: this._tonnage,
            tech: this._tech.tag,
            era: this._era.tag,
            engineType: this._engineType.tag,
            safeThrust: this._safeThrust,
            fuelTons: this._fuelTons,
            armorType: this._armorType.tag,
            armorAllocation: { ...this._armorAllocation },
            heatSinkType: this._heatSinkType.tag,
            additionalHeatSinks: this._additionalHeatSinks,
            equipment: this._equipmentList.map((item) => ({
                tag: item.tag, location: item.location, uuid: item.uuid, ...(this.isPodMounted(item.uuid ?? "") ? { pod: true } : {}),
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
            this.setModel(savedString(saved.model));
            // A save from before conventional fighters has no type: it is an aerospace fighter.
            if (saved.fighterType !== undefined && saved.fighterType !== "aerospace" && saved.fighterType !== "conventional") issue("Ignored an unknown fighter type");
            this._fighterType = saved.fighterType === "conventional" ? "conventional" : "aerospace";
            this.setTech(savedString(saved.tech));
            this.setEra(savedString(saved.era));
            if (saved.tonnage !== undefined && typeof saved.tonnage !== "number") issue("Ignored a tonnage that is not a number");
            this.setTonnage(savedNumber(saved.tonnage, 50, FIGHTER_MIN_TONNAGE, FIGHTER_MAX_TONNAGE));
            const engineTag = savedString(saved.engineType);
            this.setEngineType(engineTag);
            if (engineTag && this._engineType.tag !== engineTag) issue(`Replaced engine "${engineTag.slice(0, 40)}" with ${this._engineType.name}`);
            const thrust = savedNumber(saved.safeThrust, 5, 0, 1000);
            this.setSafeThrust(thrust);
            if (this._safeThrust !== Math.floor(thrust)) issue(`Safe Thrust set to ${this._safeThrust}`);
            this.setFuelTons(savedNumber(saved.fuelTons, 5, 0, FIGHTER_MAX_TONNAGE));
            const armorTag = savedString(saved.armorType);
            this.setArmorType(armorTag);
            if (armorTag && this._armorType.tag !== armorTag) issue(`Replaced armor "${armorTag.slice(0, 40)}" with ${this._armorType.name}`);
            this._armorAllocation = emptyArmor();
            const armor = isPlainObject(saved.armorAllocation) ? saved.armorAllocation : {};
            for (const arc of FIGHTER_ARCS) this.setArmorAllocation(arc.tag, savedNumber(armor[arc.tag], 0, 0, 10000));
            this.setHeatSinkType(savedString(saved.heatSinkType));
            this.setAdditionalHeatSinks(savedNumber(saved.additionalHeatSinks, 0, 0, 200));
            this.setVSTOL(saved.vstol === true);

            this._omni = saved.omni === true && !this.isConventional();
            this._podUUIDs = new Set();
            this._equipmentList = [];
            if (saved.equipment !== undefined && !Array.isArray(saved.equipment)) issue("Ignored an equipment list that is not a list");
            const entries = Array.isArray(saved.equipment) ? saved.equipment : [];
            if (entries.length > MAX_FIGHTER_EQUIPMENT) issue(`Kept the first ${MAX_FIGHTER_EQUIPMENT} of ${entries.length} equipment entries`);
            const catalog = this._catalog();
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
            }

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
