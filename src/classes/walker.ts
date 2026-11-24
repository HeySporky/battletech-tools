import { generateUUID } from "../utils/generateUUID";
import { getEWarKind, normalizeEWarPlay, type IEWarGear, type IEWarPlayState } from "../utils/ewar-play";
import { IGameSettingsUnit, UnitGameSettings } from "./unit-game-settings";
import { TechnicalReadout } from "./technical-readout";
import type { ITechnicalReadoutExport } from "../data/technical-readout-interfaces";
import { DEFAULT_RULES_EDITION, getSelectableRulesEditionTag } from "../data/rules-editions";
import { IEras } from "../data/data-interfaces";
import { btEraOptions, findEraByTag } from "../data/era-options";
import { getUnitTypeEras } from "../data/game-settings";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { mechEngineOptions } from "../data/mech-engine-options";
import { mechEngineTypes } from "../data/mech-engine-types";
import { mechGyroTypes } from "../data/mech-gyro-types";
import { getCockpitType } from "../data/mech-cockpit-types";
import { findSpecialRuleset } from "../data/special-rulesets";
import { IEquipmentItem, IHeatSync, IJumpJet, ITechDates } from "../data/data-interfaces";
import {
    getCompatibleAmmo,
    getEquipmentListForChassis,
    getEquipmentRecordsByTech,
    getTechDatesAvailability,
    isEquipmentOffered,
    isUnderUnitLimit,
} from "../data/equipment-registry";
import { getAmmoBattleValuePerTon, getItemBattleValue as getCatalogBattleValue } from "../data/equipment-registry";
import { getAlphaStrikeEquipmentDisplayAbilityCodes, getWeaponShotsPerTon } from "../data/equipment-registry";
import { AlphaStrikeStructureColumn, getAlphaStrikeMechStructure } from "../data/alpha-strike-mech-structure";
import { isAlphaStrikeAbilityCode } from "../data/alpha-strike-special-abilities";
import { getMountedHeat } from "../data/laser-insulator";
import { calculateGroundPointValue, groundTMM } from "../utils/alphaStrikeGroundPointValue";
import { addsNoAlphaStrikeWeaponHeat, alphaStrikeExtraHeat, alphaStrikeMovementHeat, applyAlphaStrikeHeat, finalAlphaStrikeDamage, roundAlphaStrikeAbilityDamage, roundUpToTenth } from "../utils/alphaStrikeHeat";
import { AlphaStrikeUnit, IASMULUnit } from "./alpha-strike-unit";
import { matchesTag } from "../data/tag-match";
import { VariableEquipmentFormula, getTargetingComputerWeaponWeight, isTargetingComputerWeapon, sizeVariableEquipment } from "../data/variable-equipment";
import { CalcTrace, ICalcBreakdown, formatCalcNumber } from "../data/calc-steps";
import { NO_BATTLE_VALUE_STEPS } from "../data/calc-steps-mech-bv1";
import { WALKER_BV2_STEPS, WALKER_COST_STEPS, getWalkerBv1Steps } from "../data/calc-steps-walker";
import { getBinDamagePerShot } from "../data/ammo-explosion";
import { rollCriticalLine } from "../utils/critical-tables";
import {
    editionHasBattleValue,
    getBattleValue1Ammo,
    getBattleValueEdition,
    getBattleValueFor,
    getBattleValueRules,
    getBattleValueSkillEdition,
    getSkillMultiplier,
    getSpeedFactor,
    isBattleValue1Defensive,
    rateBattleValue1,
} from "../data/battle-value";
import { getEditionStats, getRulesEdition } from "../data/rules-editions";
import { mechInternalStructureTypes } from "../data/mech-internal-structure-types";
import { getMovementModifier } from "../utils";
import { describeEngineRequirement, engineMeetsRequirement } from "../data/mech-engine-types";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { mechJumpJetTypes } from "../data/mech-jump-jet-types";
import {
    FUTURE_WARS_CONSTRUCTION_RULESETS,
    FUTURE_WARS_EXTRA_SLOT_TONS,
    FUTURE_WARS_SENSOR_SLOTS,
    getFutureWarsCockpit,
    getFutureWarsEngineSlots,
    getFutureWarsGyroSlots,
    getFutureWarsWeightClass,
} from "../data/future-wars-construction";
import {
    IWalkerEditionRules,
    WALKER_DEFAULT_EDITION,
    WALKER_EDITION_RULES,
    WALKER_ADJACENT_LOCATIONS,
    WALKER_BATTLEMECH_ENGINE_TYPES,
    WALKER_CENTER_TORSO_RULE,
    WALKER_ENGINE_TYPES,
    WALKER_HEAT_SINK_LOCATIONS,
    WALKER_HEAT_SINK_TYPES,
    WALKER_JUMP_JET_LOCATIONS,
    WALKER_JUMP_JET_TYPES,
    WALKER_OUTER_TORSOS,
    WALKER_VARIABLE_FORMULAS,
    WalkerHeatSinkType,
    WalkerJumpJetType,
    getWalkerLocationsForMechLocations,
    isWalkerAntiInfantryWeapon,
    isWalkerLocation,
    isWalkerWeapon,
    WALKER_GYRO_TYPES,
    WALKER_INDUSTRIAL_ENGINE_TYPES,
    WALKER_INDUSTRIAL_GYRO_TYPES,
    WALKER_INDUSTRIAL_STRUCTURE_FACTOR,
    WALKER_LEGS,
    WALKER_LOCATIONS,
    WALKER_LOCATION_NAMES,
    WALKER_MAX_ENGINE_RATING,
    WALKER_MAX_TONS,
    WALKER_MIN_TONS,
    WALKER_TON_STEP,
    WalkerEdition,
    WalkerEngineType,
    WalkerGyroType,
    WalkerLocation,
    getWalkerCredit,
    readWalkerHitCell,
    WALKER_ALL_ARCS,
    WALKER_ATTACK_DIRECTIONS,
    WALKER_DAMAGE_TRANSFER,
    WALKER_HIT_TABLE,
    WALKER_LOCATION_ARCS,
    WalkerAttackDirection,
    WalkerFiringArc,
    getWalkerSlotCount,
    getWalkerStructure,
    getWalkerTurret,
    isWalkerEdition,
} from "../data/walker-construction";

// A Walker (#172): Clell Flint's four-legged 'Mech from Future Wars, a unit type of its own (NGCFells's ruling 2,
// 2026-11-13). Ten locations, its own structure table and slot counts (walker-construction.ts); the 'Mech engine, gyro
// and cockpit data. Custom Homebrew. Chunks A (construction core), B (equipment, turret, heat sinks, jump jets,
// ammunition) and C (cost and Battle Value, both provisional) of docs/superpowers/plans/2026-11-13-future-wars-walkers.md.

export type WalkerTechTag = "is" | "clan";

export const MAX_WALKER_NAME_LENGTH = 120;
/** A standard 'Mech cockpit: 3 tons (TechManual p.209). */
const STANDARD_COCKPIT_TONS = 3;
/** Standard armor: 16 points a ton, bought by the half ton (TechManual p.205). */
const ARMOR_POINTS_PER_TON = 16;

export interface IWalkerExport {
    /** The save format. */
    format: 1;
    /** The printing the design is built under; absent means the Best-of. */
    edition?: WalkerEdition;
    rulesEdition?: string;
    rulesLevel?: number;
    rulesets?: string[];
    uuid: string;
    tro?: ITechnicalReadoutExport;
    name: string;
    tons: number;
    /** The biped Walking MP the engine is rated on; the walker moves at x 1.25. */
    walkMP: number;
    techBase: WalkerTechTag;
    engineType: WalkerEngineType;
    gyroType: WalkerGyroType;
    /** An industrial walker (NGCFells's); absent means a BattleMech walker. */
    industrial?: boolean;
    /** An industrial walker's Advanced Fire Control (TechManual p.69). */
    advancedFireControl?: boolean;
    turret?: boolean;
    /** A heavy walker's 4-ton cockpit under the variant. */
    largeCockpit?: boolean;
    extraSensors?: boolean;
    extraLifeSupport?: boolean;
    armor: Partial<Record<WalkerLocation, number>>;
    /** Mounted equipment and ammunition (Chunk B); absent in older saves. */
    equipment?: IWalkerMountExport[];
    /** Total heat sinks, the engine's free ones included; absent means the engine's free ones only. */
    heatSinks?: number;
    heatSinkType?: WalkerHeatSinkType;
    jumpJets?: number;
    jumpJetType?: WalkerJumpJetType;
    era: string;
    /** The pilot's skills (roster); absent means 4 and 5. */
    gunnery?: number;
    piloting?: number;
    /** The record sheet in play (roster); absent when clean. */
    inPlay?: IWalkerInPlay;
    ewarPlay?: IEWarPlayState;
    lastUpdated?: string;
}

/**
 * The record sheet's state in play (Chunk F), saved with the roster. Every field is optional and absent when clean:
 * armor and structure points lost per location, hit slot indexes (into getSlots), pilot hits, and shots fired per
 * ammunition bin (getAmmo order).
 */
export interface IWalkerInPlay {
    armor?: Partial<Record<WalkerLocation, number>>;
    structure?: Partial<Record<WalkerLocation, number>>;
    slots?: Partial<Record<WalkerLocation, number[]>>;
    pilotHits?: number;
    shotsFired?: number[];
}

/** A hit location read off the table: the 2D6 roll, the printed cell, and whether it is also a critical hit chance. */
export interface IWalkerHitLocation {
    roll: number;
    direction: WalkerAttackDirection;
    cell: string;
    location: WalkerLocation;
    critical: boolean;
}

export interface IWalkerPlayMovement {
    walk: number;
    run: number;
    jump: number;
    text: string;
    notes: string[];
}

export interface IWalkerModifier {
    total: number;
    lines: string[];
}

/** A weapon in play: where it fires, its to-hit modifier from damage, whether it is lost and whether it may fire now. */
export interface IWalkerWeaponPlayLine {
    uuid: string;
    name: string;
    location: WalkerLocation;
    inTurret: boolean;
    arcs: WalkerFiringArc[];
    toHit: number;
    destroyed: boolean;
    canFire: boolean;
    reasons: string[];
    /** The center torso's anti-infantry rule, or the turret's. */
    note: string;
}

const WALKER_PILOT_HITS = 6;
/** "MechWarriors take 2 points of damage" from an ammunition explosion (TW p.125). */
const AMMO_EXPLOSION_PILOT_HITS = 2;
const LEG_ACTUATORS = ["Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"];
/** A slot a critical hit rolls again on: CASE (TW p.124). */
const isRollAgainTag = (tag: string): boolean => /^(clan-|is-)?case(-ii|-prototype)?$/.test(tag);
/** Determining Critical Hits Table (TW p.124): the hits for a 2D6 roll; 12 is three in a torso, a leg or the control section blown off. */
const criticalHitsForRoll = (roll: number): number => (roll >= 12 ? 3 : roll >= 10 ? 2 : roll >= 8 ? 1 : 0);

/** One mounted 'Mech catalog item: its tag, its location and whether it is in the turret. */
export interface IWalkerMountExport {
    tag: string;
    location: WalkerLocation;
    inTurret?: boolean;
    /** The chosen size of a sized item (a cargo bay's tons, a modular C3's links). */
    size?: number;
    /** An item split into one adjacent location: that location and the slots it takes there (NGCFells's ruling 2026-11-14). */
    split?: IWalkerSplit;
}

export interface IWalkerSplit {
    location: WalkerLocation;
    slots: number;
}

export interface IWalkerAddOptions {
    size?: number;
    /** The adjacent location to split into when the item does not fit whole; without it the first adjacent one with room. */
    splitInto?: WalkerLocation;
}

/** A mounted item as the creator and the sheet read it. */
export interface IWalkerEquipment {
    uuid: string;
    tag: string;
    name: string;
    location: WalkerLocation;
    inTurret: boolean;
    weight: number;
    slots: number;
    heat: number;
    isAmmo: boolean;
    /** A center-torso weapon: fires only at infantry and vehicles in the walker's hex (Best-of p.36). */
    antiInfantryOnly: boolean;
    /** Where the rest of a split item sits; its slots in `location` are `slots` less these. */
    split?: IWalkerSplit;
    item: IEquipmentItem;
}

export interface IWalkerAddResult {
    added: boolean;
    uuid?: string;
    /** Why the item was refused. */
    reason?: string;
}

export interface IWalkerWeightLine {
    name: string;
    weight: number;
}

interface IWalkerMount {
    uuid: string;
    tag: string;
    location: WalkerLocation;
    inTurret: boolean;
    size?: number;
    split?: IWalkerSplit;
}

/** Jump jet weight class (TM p.51): up to 55 tons, 60 to 85, 90 and over. */
const jumpJetWeightClass = (tons: number): "light" | "medium" | "heavy" => (tons <= 55 ? "light" : tons <= 85 ? "medium" : "heavy");
/** A 'Mech arm item: hand and lower arm actuator items (hatchets, swords, claws and the like). */
const needsArm = (item: IEquipmentItem): boolean => !!(item.requiresHandActuator || item.requiresLowerArmActuator || item.replacesHandActuator);
/**
 * Equipment an IndustrialMech cannot use without Advanced Fire Control (TM p.69): Artemis, the Beagle Active Probe or its
 * Clan equivalent, C3 and C3i units and targeting computers. The same test as BattleMech's, which is private there.
 */
const needsAdvancedFireControl = (item: IEquipmentItem): boolean => {
    const tag = item.tag.toLowerCase();
    if (tag === "c3-remote-sensor-launcher") return false;
    return /-artemis-(iv|v|p)$/.test(tag) || /^c3/.test(tag)
        || ["beagle-active-probe", "clan-active-probe", "targeting-computer", "clan-targeting-computer"].includes(tag);
};
const isMASC = (item: IEquipmentItem): boolean => item.variableFormula === "masc-is" || item.variableFormula === "masc-clan";

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const ceilHalf = (tons: number): number => Math.ceil(Math.round(tons * 2000) / 1000) / 2;
const isEngineType = (value: unknown): value is WalkerEngineType => (WALKER_ENGINE_TYPES as readonly unknown[]).includes(value);
const isGyroType = (value: unknown): value is WalkerGyroType => (WALKER_GYRO_TYPES as readonly unknown[]).includes(value);
const isTonnage = (tons: number): boolean => Number.isInteger(tons) && tons >= WALKER_MIN_TONS && tons <= WALKER_MAX_TONS && tons % WALKER_TON_STEP === 0;
const emptyArmor = (): Record<WalkerLocation, number> => ({ cs: 0, ft: 0, lt: 0, ct: 0, rt: 0, rrt: 0, lfl: 0, rfl: 0, lrl: 0, rrl: 0 });

/** A walker's Alpha Strike unit type: one of its own (NGCFells, 2026-11-15), read as BM wherever Alpha Strike asks the type. */
export const WALKER_AS_TYPE = "WK";
/** An industrial walker's: read as IM. */
export const WALKER_INDUSTRIAL_AS_TYPE = "IWK";
/** The one ability every walker card carries (alpha-strike-special-abilities.ts has its text). */
export const WALKER_AS_ABILITY = "WLK";

export interface IWalkerASDamageValue {
    damage: number;
    /** 0*: more than nothing and under half a point. */
    minimal: boolean;
}

export interface IWalkerAlphaStrikeStats {
    type: typeof WALKER_AS_TYPE | typeof WALKER_INDUSTRIAL_AS_TYPE;
    size: number;
    move: string;
    tmm: number;
    armor: number;
    structure: number;
    overheat: number;
    damageValues: { short: IWalkerASDamageValue; medium: IWalkerASDamageValue; long: IWalkerASDamageValue };
    specialAbilities: string[];
    pointValue: number;
    calcLog: string[];
}

export const formatWalkerASDamage = (value: IWalkerASDamageValue): string => (value.minimal ? "0*" : `${value.damage}`);

/**
 * Internal structure points of a biped BattleMech, all eight locations, 10 to 100 tons (TM p.47, as
 * mech-internal-structure-types.ts holds the table): what the ASC p.98 structure values stand for.
 */
const BIPED_STRUCTURE_POINTS: Record<number, number> = {
    10: 19, 15: 26, 20: 33, 25: 43, 30: 51, 35: 58, 40: 67, 45: 75, 50: 83, 55: 91,
    60: 99, 65: 104, 70: 107, 75: 114, 80: 122, 85: 130, 90: 138, 95: 145, 100: 152,
};


/** "multiply by 1.25, dropping fractions of .25 and rounding up the rest" (Best-of p.37; #11 p.26). */
export function getWalkerWalkMPFromBiped(walk: number): number {
    const quarters = walk * 5; // walk x 1.25, in quarters
    const whole = Math.floor(quarters / 4);
    const remainder = quarters % 4;
    return remainder === 0 || remainder === 1 ? whole : whole + 1;
}

/** Reads a saved Walker; null when the data is not one. Each value clamped on the way in gives an issue. */
export const normalizeWalkerExport = (raw: unknown): { walker: IWalkerExport | null; issues: string[] } => {
    const notOne = { walker: null, issues: ["Not a Walker record."] };
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return notOne;
    const data = raw as Partial<IWalkerExport>;
    if (typeof data.tons !== "number" || !data.armor || typeof data.armor !== "object") return notOne;
    const walker = new Walker();
    if (!walker.import(data as IWalkerExport)) return notOne;
    return { walker: walker.export(), issues: walker.getImportIssues() };
};

export default class Walker implements IGameSettingsUnit {
    public lastUpdated: Date = new Date();

    private _uuid: string = generateUUID();
    public tro: TechnicalReadout = new TechnicalReadout();
    private _name: string = "";
    private _edition: WalkerEdition = WALKER_DEFAULT_EDITION;
    private _rulesEdition: string = DEFAULT_RULES_EDITION;
    /** The rules level and Special Rulesets the design is built under (#324). */
    public readonly gameSettings = new UnitGameSettings();
    private _tons: number = 50;
    private _walkMP: number = 4;
    private _tech: WalkerTechTag = "is";
    private _engineType: WalkerEngineType = "standard";
    private _gyroType: WalkerGyroType = "standard";
    private _industrial: boolean = false;
    private _advancedFireControl: boolean = false;
    private _turret: boolean = false;
    private _largeCockpit: boolean = false;
    private _extraSensors: boolean = false;
    private _extraLifeSupport: boolean = false;
    private _armor: Record<WalkerLocation, number> = emptyArmor();
    private _mounts: IWalkerMount[] = [];
    /** Heat sinks beyond the engine's free ones (as BattleMech's additional heat sinks). */
    private _extraHeatSinks: number = 0;
    private _heatSinkType: WalkerHeatSinkType = "single";
    private _jumpJets: number = 0;
    private _jumpJetType: WalkerJumpJetType = "standard";
    /** Flint wrote for the 3025 rules: the late Succession Wars (NGCFells's). */
    private _era: IEras = findEraByTag("late-sw-lt") ?? btEraOptions[btEraOptions.length - 1];
    private _gunnery: number = 4;
    private _piloting: number = 5;
    private _inPlay: IWalkerInPlay = {};
    /** What the unit has switched on, been hit by or been told by the force board in E-War play (#642). */
    public ewarPlay: IEWarPlayState = {};
    private _importIssues: string[] = [];

    constructor(json: string = "") {
        if (json) this.importJSON(json);
    }

    // Identity and settings ---------------------------------------------------------------------------------------

    public getUUID(): string { return this._uuid; }
    public newUUID(): void { this._uuid = generateUUID(); }
    public getName(): string { return this._name; }
    public setName(name: string): void { this._name = String(name ?? "").slice(0, MAX_WALKER_NAME_LENGTH); }
    public getDisplayName(): string { return this._name.trim() || `${this._tons}-ton Walker`; }
    public getImportIssues(): string[] { return [...this._importIssues]; }

    public getRulesEdition(): string { return this._rulesEdition; }
    public setRulesEdition(editionTag: string): string {
        this._rulesEdition = getSelectableRulesEditionTag(editionTag, "walker");
        return this._rulesEdition;
    }

    public getTechTag(): WalkerTechTag { return this._tech; }
    /** Inner Sphere or Clan. A gyro the tech base lacks goes back to standard; an engine stays, and getIssues says so. */
    public setTechTag(tag: string): void {
        if (tag !== "is" && tag !== "clan") return;
        this._tech = tag;
        if (!this.getGyroTypeOptions().includes(this._gyroType)) this._gyroType = "standard";
    }
    public chooseEra(tag: string): void { this.setEra(tag); }
    public getEra(): IEras { return this._era; }
    public getAvailableEras(): IEras[] { return getUnitTypeEras("mech", this._tech); }
    public setEra(tag: string): boolean {
        const era = this.getAvailableEras().find((each) => each.tag === tag);
        if (!era) return false;
        this._era = era;
        return true;
    }

    /** The printing of Flint's rules (NGCFells's ruling 3). */
    public getEdition(): WalkerEdition { return this._edition; }
    public getEditionRules(): IWalkerEditionRules { return WALKER_EDITION_RULES[this._edition]; }
    public setEdition(edition: WalkerEdition): void { if (isWalkerEdition(edition)) this._edition = edition; }
    public getCredit(): string { return getWalkerCredit(this._edition, this._industrial); }

    /**
     * An industrial walker (NGCFells's ruling 2026-11-14; ours, inspired by Flint and the IndustrialMech rules). Switching
     * keeps the engine and gyro; one the chassis does not allow is reported by getIssues, nothing is changed.
     */
    public isIndustrial(): boolean { return this._industrial; }
    public setIndustrial(industrial: boolean): void { this._industrial = !!industrial; }
    public hasAdvancedFireControl(): boolean { return this._industrial && this._advancedFireControl; }
    public setAdvancedFireControl(fitted: boolean): void { this._advancedFireControl = !!fitted; }

    /** Flint's variant slots: a Future Wars construction ruleset (either printing) is ticked and registered. */
    public usesVariantSlots(): boolean {
        return this.gameSettings.getRulesets().some((id) => (FUTURE_WARS_CONSTRUCTION_RULESETS as readonly string[]).includes(id) && !!findSpecialRuleset(id));
    }

    // Chassis -----------------------------------------------------------------------------------------------------

    public getTons(): number { return this._tons; }
    /** 10 to 100 tons in 5-ton steps (the structure table). The Walking MP is cut to what the engine table allows. */
    public setTons(tons: number): boolean {
        if (!isTonnage(tons)) return false;
        this._tons = tons;
        this._walkMP = Math.min(this._walkMP, this.getMaxWalkMP());
        this._clampArmor();
        return true;
    }

    public getLocations(): WalkerLocation[] { return [...WALKER_LOCATIONS]; }
    public getLocationName(location: WalkerLocation): string { return WALKER_LOCATION_NAMES[location]; }

    // Movement and engine -----------------------------------------------------------------------------------------

    /** The biped Walking MP the engine is rated on (Best-of p.37: "as you would for a two legged mech"). */
    public getWalkMP(): number { return this._walkMP; }
    public getMaxWalkMP(): number { return Math.max(1, Math.floor(WALKER_MAX_ENGINE_RATING / this._tons)); }
    public setWalkMP(walk: number): boolean {
        if (!Number.isInteger(walk) || walk < 1 || walk > this.getMaxWalkMP()) return false;
        this._walkMP = walk;
        return true;
    }
    /** Walking MP on four working legs: the biped figure x 1.25. */
    public getWalkerWalkMP(): number { return getWalkerWalkMPFromBiped(this._walkMP); }
    /** Running MP from the four-legged walking figure (Best-of p.37). */
    public getRunMP(): number { return Math.ceil(this.getWalkerWalkMP() * 1.5); }

    public getEngineRating(): number { return this._tons * this._walkMP; }
    public getEngineType(): WalkerEngineType { return this._engineType; }
    private _engineRecord() { return mechEngineTypes.find((type) => type.tag === this._engineType)!; }
    public getEngineName(): string { return this._engineRecord().name; }
    /**
     * Engine types for the chassis (fusion for a BattleMech walker, the IndustrialMech's for an industrial one) with
     * slot data for the tech base; an Inner Sphere walker takes no Clan engine and the reverse.
     */
    public getEngineTypeOptions(): WalkerEngineType[] {
        const chassis = this._industrial ? WALKER_INDUSTRIAL_ENGINE_TYPES : WALKER_BATTLEMECH_ENGINE_TYPES;
        return chassis.filter((tag) => {
            const record = mechEngineTypes.find((type) => type.tag === tag);
            if (!record?.criticals?.[this._tech]) return false;
            return this._tech === "clan" ? tag !== "xl" && tag !== "xxl" : !tag.startsWith("clan_");
        });
    }
    public setEngineType(tag: string): boolean {
        if (!isEngineType(tag) || !this.getEngineTypeOptions().includes(tag)) return false;
        this._engineType = tag;
        return true;
    }
    /** The 'Mech engine table's weight for the rating and type (TechManual p.49 and its type columns). */
    public getEngineWeight(): number {
        const row = mechEngineOptions.find((option) => option.rating === this.getEngineRating());
        return (row?.weight as Record<string, number> | undefined)?.[this._engineType] ?? 0;
    }

    // Gyro and cockpit --------------------------------------------------------------------------------------------

    public getGyroType(): WalkerGyroType { return this._gyroType; }
    private _gyroRecord() { return mechGyroTypes.find((gyro) => gyro.tag === this._gyroType)!; }
    public getGyroName(): string { return this._gyroRecord().name; }
    /** Every 'Mech gyro but "none"; the XL, Compact and Heavy-Duty gyros are Inner Sphere only. */
    public getGyroTypeOptions(): WalkerGyroType[] {
        if (this._industrial) return [...WALKER_INDUSTRIAL_GYRO_TYPES];
        return WALKER_GYRO_TYPES.filter((tag) => this._tech === "is" || !mechGyroTypes.find((gyro) => gyro.tag === tag)?.innerSphereOnly);
    }
    public setGyroType(tag: string): boolean {
        if (!isGyroType(tag) || !this.getGyroTypeOptions().includes(tag)) return false;
        this._gyroType = tag;
        return true;
    }
    /** As on a 'Mech: engine rating / 100 rounded up, times the gyro's multiplier, rounded up to the half ton. */
    public getGyroWeight(): number {
        return Math.ceil(Math.ceil(this.getEngineRating() / 100) * this._gyroRecord().weight_multiplier * 2) / 2;
    }
    private _gyroSlots(): number {
        return this.usesVariantSlots() ? getFutureWarsGyroSlots(this.getGyroWeight()) : this._gyroRecord().criticals;
    }

    /** Flint's cockpit under the variant: 2, 3 or 4 tons by class, life support included. Otherwise a 3-ton 'Mech cockpit. */
    private _variantCockpit() {
        return this.usesVariantSlots() ? getFutureWarsCockpit(this._tons, this.getLargeCockpit()) : undefined;
    }
    /** Under the variant Flint's cockpit weight applies to an industrial walker too (NGCFells's, as on a Compact IndustrialMech). */
    public getCockpitWeight(): number { return this._variantCockpit()?.tons ?? (this._industrial ? getCockpitType("industrial").weight : STANDARD_COCKPIT_TONS); }
    /** The cockpit's name: the IndustrialMech cockpit, with or without Advanced Fire Control (TechManual p.211), or "Cockpit". */
    public getCockpitName(): string {
        if (!this._industrial) return "Cockpit";
        return getCockpitType(this._advancedFireControl ? "industrial-advanced-fire-control" : "industrial").name;
    }
    /** A heavy walker's 4-ton cockpit ("a few heavy mechs", Best-of p.35); false for any other class or without the variant. */
    public getLargeCockpit(): boolean { return this._largeCockpit && getFutureWarsWeightClass(this._tons)?.tag === "heavy"; }
    public setLargeCockpit(large: boolean): void { this._largeCockpit = !!large; }
    /** Extra sensors and extra life support (Best-of p.35): the variant only. */
    public hasExtraSensors(): boolean { return this._extraSensors && this.usesVariantSlots(); }
    public setExtraSensors(fitted: boolean): void { this._extraSensors = !!fitted; }
    public hasExtraLifeSupport(): boolean { return this._extraLifeSupport && this.usesVariantSlots(); }
    public setExtraLifeSupport(fitted: boolean): void { this._extraLifeSupport = !!fitted; }

    // Turret --------------------------------------------------------------------------------------------------------

    public hasTurret(): boolean { return this._turret; }
    public setTurret(fitted: boolean): void { this._turret = !!fitted; }
    public getTurretWeight(): number { return this._turret ? getWalkerTurret(this._tons, this.usesVariantSlots()).tons : 0; }

    // Equipment (Chunk B) ---------------------------------------------------------------------------------------------

    private _rulesLevel(): number { return this.gameSettings.getRulesLevel(CUSTOM_HOMEBREW_RULES_LEVEL); }
    /** Does the walker's era overlap the item's years? The 'Mech's test (BattleMech._itemIsAvailable). */
    private _inEra(introduced: number | null, extinct: number | null, reintroduced: number | null): boolean {
        const start = this._era.yearStart;
        const end = this._era.yearEnd ?? Number.POSITIVE_INFINITY;
        const first = (introduced ?? 0) <= end && (!extinct || extinct >= start);
        return first || (!!reintroduced && reintroduced <= end);
    }
    private _available(dates: ITechDates & { clanDates?: ITechDates }): boolean {
        return getTechDatesAvailability(dates, this._tech, this._rulesLevel(), (a, b, c) => this._inEra(a, b, c)).available;
    }

    /** The catalog record for a tag (altTags too), copied; undefined when no 'Mech catalog has it. */
    private _findRecord(tag: string): IEquipmentItem | undefined {
        const records = getEquipmentRecordsByTech(this._tech, true);
        const record = records.find((each) => each.tag === tag) ?? records.find((each) => matchesTag(each, tag));
        return record ? { ...record, space: { ...record.space } } : undefined;
    }

    /** Weight and slots of an item on this walker: sized items by their formula with the walker's figures (NGCFells's). */
    private _sized(item: IEquipmentItem, mount: Pick<IWalkerMount, "size">, weaponWeight: number): { weight: number; slots: number; cbills?: number } {
        const formula = item.variableFormula as VariableEquipmentFormula | undefined;
        if (formula) {
            const size = sizeVariableEquipment(formula, {
                tonnage: this._tons, engineRating: this.getEngineRating(), engineWeight: this.getEngineWeight(),
                directFireWeaponWeight: weaponWeight, isQuad: true, size: mount.size ?? item.size,
            });
            if (size) return { weight: size.weight, slots: size.slots, cbills: size.cbills };
        }
        return { weight: item.weight || 0, slots: Math.max(0, item.space.battlemech) };
    }

    private _resolveMounts(mounts: readonly IWalkerMount[] = this._mounts): IWalkerEquipment[] {
        const records = mounts.map((mount) => ({ mount, item: this._findRecord(mount.tag) }))
            .filter((each): each is { mount: IWalkerMount; item: IEquipmentItem } => !!each.item);
        const weaponWeight = getTargetingComputerWeaponWeight(records.map((each) => each.item));
        return records.map(({ mount, item }) => {
            const { weight, slots, cbills } = this._sized(item, mount, weaponWeight);
            return {
                uuid: mount.uuid, tag: mount.tag, name: item.name, location: mount.location, inTurret: mount.inTurret,
                weight, slots, heat: item.heat || 0, isAmmo: !!item.isAmmo,
                antiInfantryOnly: mount.location === "ct" && isWalkerAntiInfantryWeapon(item),
                ...(mount.split ? { split: { ...mount.split } } : {}),
                // A sized item's price is its formula's (the cost, Chunk C).
                item: { ...item, weight, criticals: slots, ...(cbills !== undefined ? { cbills } : {}) },
            };
        });
    }

    public getEquipment(): IWalkerEquipment[] { return this._resolveMounts(); }
    public getAmmo(): IWalkerEquipment[] { return this.getEquipment().filter((each) => each.isAmmo); }
    public getEquipmentWeight(): number { return this.getEquipment().reduce((sum, each) => sum + each.weight, 0); }
    /** Heat of every weapon fired at once. */
    public getHeat(): number {
        return this.getEquipment().filter((each) => isWalkerWeapon(each.item)).reduce((sum, each) => sum + each.heat, 0);
    }

    /**
     * Why a 'Mech item cannot go on this walker at all, or null (NGCFells's ruling 4: "any equipment that makes sense"). Arm
     * items, items of another 'Mech type, items spread over 'Mech locations and variable items outside
     * WALKER_VARIABLE_FORMULAS are NGCFells's to refuse; the IndustrialMech limits are TM pp.69-70.
     */
    public getChassisRefusal(item: IEquipmentItem): string | null {
        const name = item.name;
        if (item.space.battlemech < 0 || item.bombBaySlots) return `${name} cannot be mounted on a 'Mech.`;
        if (needsArm(item)) return `${name} needs an arm, and a walker has none.`;
        if ((item.chassisTypes?.length ?? 0) > 0 || item.tag === "mech-turret-head") return `${name} is built for another kind of 'Mech.`;
        if (item.spreadLocations || item.spreadSlots) return `${name} spreads over a 'Mech's locations; a walker does not take it (NGCFells's).`;
        if ((item.variableFormula && !WALKER_VARIABLE_FORMULAS.includes(item.variableFormula)) || (item.variableSize && !item.variableFormula)) {
            return `${name} is not offered on a walker (NGCFells's).`;
        }
        if (item.allowedLocations && !item.armTool && getWalkerLocationsForMechLocations(item.allowedLocations).length === 0) {
            return `${name} has no place on a walker.`;
        }
        if (!engineMeetsRequirement(item.requiresEngine, this._engineType)) return `${name} needs ${describeEngineRequirement(item.requiresEngine!)}.`;
        if (item.industrialMechOnly && !this._industrial) return `${name} can only be mounted on an IndustrialMech (industrial walker).`;
        if (this._industrial && isMASC(item)) return `${name} cannot be mounted on an IndustrialMech (TM p.70).`;
        if (this._industrial && item.armorRepairBVMultiplier) return `${name} can only be mounted on a BattleMech.`;
        if (this._industrial && !this.hasAdvancedFireControl() && needsAdvancedFireControl(item)) {
            return `${name} needs Advanced Fire Control on an IndustrialMech (TM p.69).`;
        }
        return null;
    }

    /** Why an item cannot go in this place, or null. `others` are the other mounts (not the one being checked). */
    private _placementRefusal(item: IEquipmentItem, location: WalkerLocation, inTurret: boolean, others: readonly IWalkerMount[]): string | null {
        const name = item.name;
        if (inTurret && location !== "cs") return `Turret items go in the control section.`;
        if (inTurret && !this._turret) return `${name} is in the turret, and the walker has no turret.`;
        if (location === "ct" && isWalkerWeapon(item) && !isWalkerAntiInfantryWeapon(item)) return `${name}: ${WALKER_CENTER_TORSO_RULE}`;
        if (item.armTool) {
            // Ours: a walker has no arms; its tools go on the legs or the outer torsos.
            if (!WALKER_LEGS.includes(location) && !WALKER_OUTER_TORSOS.includes(location)) return `${name} goes in the legs or outer torsos (NGCFells's: a walker has no arms).`;
        } else if (item.allowedLocations) {
            const allowed = getWalkerLocationsForMechLocations(item.allowedLocations);
            if (!allowed.includes(location)) return `${name} must be placed in: ${allowed.map((each) => this.getLocationName(each)).join(", ")}.`;
        }
        if (item.onePerLocationGroup) {
            const group = item.onePerLocationGroup;
            const clash = others.some((other) => other.location === location && this._findRecord(other.tag)?.onePerLocationGroup === group);
            if (clash) return `${name}: one ${group.replace(/-/g, " ")} to a location.`;
        }
        const installed = others.map((other) => this._findRecord(other.tag));
        if (!isUnderUnitLimit(item, installed)) return `${name}: at most ${item.maxPerUnit} to a unit.`;
        return null;
    }

    /**
     * The 'Mech catalogs at the walker's tech base, era, rules edition and rules level, less what a walker cannot mount
     * (getChassisRefusal), each sized for this walker.
     */
    public getEquipmentOffer(): IEquipmentItem[] {
        const level = this._rulesLevel();
        const seen = new Set<string>();
        const offer: IEquipmentItem[] = [];
        const weaponWeight = getTargetingComputerWeaponWeight(this.getEquipment().map((each) => each.item));
        for (const item of getEquipmentListForChassis(this._tech, level >= CUSTOM_HOMEBREW_RULES_LEVEL)) {
            if (seen.has(item.tag)) continue;
            seen.add(item.tag);
            if (!isEquipmentOffered(item, this._rulesEdition, level) || this.getChassisRefusal(item) || !this._available(item)) continue;
            const { weight, slots } = this._sized(item, {}, weaponWeight);
            offer.push({ ...item, weight, criticals: slots });
        }
        return offer.sort((a, b) => (a.sort > b.sort ? 1 : a.sort < b.sort ? -1 : 0));
    }

    /** Do the locations the mount uses fit their slot counts, with the equipment already mounted? */
    private _mountFits(mount: IWalkerMount): boolean {
        const { slots } = this._layout(false, mount);
        return [mount.location, ...(mount.split ? [mount.split.location] : [])].every((location) => Walker._usedLength(slots[location]) <= this.getSlotCount(location));
    }

    /**
     * Mounts a 'Mech catalog item. Refused, with the reason, when the walker cannot take it, the place breaks a rule, the
     * walker would be over its tonnage or there is no room. An item too big for the location's free slots fills them and
     * splits the rest into one adjacent location with room (NGCFells's ruling 2026-11-14), `options.splitInto` or the first in
     * WALKER_ADJACENT_LOCATIONS that takes it; a turret item never splits. The era and rules level are the offer's
     * business (getEquipmentOffer), as on a 'Mech.
     */
    public addEquipment(tag: string, location: WalkerLocation, inTurret: boolean = false, options: IWalkerAddOptions = {}): IWalkerAddResult {
        const item = this._findRecord(tag);
        if (!item) return { added: false, reason: `Unknown equipment "${String(tag).slice(0, 60)}".` };
        if (!isWalkerLocation(location)) return { added: false, reason: `Unknown location "${String(location).slice(0, 20)}".` };
        const refusal = this.getChassisRefusal(item) ?? this._placementRefusal(item, location, !!inTurret, this._mounts);
        if (refusal) return { added: false, reason: refusal };
        const { size, splitInto } = options;
        const mount: IWalkerMount = { uuid: generateUUID(), tag: item.tag, location, inTurret: !!inTurret, ...(size !== undefined ? { size } : {}) };
        const sized = this._resolveMounts([...this._mounts, mount]).find((each) => each.uuid === mount.uuid)!;
        const left = this._tons - this.getWeight();
        if (sized.weight > left + 1e-9) return { added: false, reason: `${item.name} weighs ${sized.weight} tons; the walker has ${Math.max(0, left)} left.` };
        if (!this._mountFits(mount)) {
            const name = this.getLocationName(location);
            if (inTurret || sized.slots < 2 || WALKER_ADJACENT_LOCATIONS[location].length === 0) {
                return { added: false, reason: `${item.name} needs ${sized.slots} slots together and the ${name} has no room for them.` };
            }
            if (splitInto !== undefined && !WALKER_ADJACENT_LOCATIONS[location].includes(splitInto)) {
                return { added: false, reason: `${item.name} can split only into a location next to the ${name}; ${String(splitInto).slice(0, 20)} is not next to the ${name}.` };
            }
            // The free slots after the last item in the location; the rest goes into the adjacent location.
            const here = this.getSlotCount(location) - Walker._usedLength(this._layout(false).slots[location]);
            const rest = sized.slots - here;
            const candidates = splitInto !== undefined ? [splitInto] : WALKER_ADJACENT_LOCATIONS[location];
            const into = here > 0 ? candidates.find((other) => {
                if (this._placementRefusal(item, other, false, this._mounts)) return false;
                return this._mountFits({ ...mount, split: { location: other, slots: rest } });
            }) : undefined;
            if (!into) {
                const names = candidates.map((other) => this.getLocationName(other)).join(", ");
                return { added: false, reason: `${item.name} needs ${sized.slots} slots; the ${name} has ${Math.max(0, here)} free, and no one adjacent location (${names}) can take the other ${Math.max(0, rest)}.` };
            }
            mount.split = { location: into, slots: rest };
        }
        this._mounts.push(mount);
        return { added: true, uuid: mount.uuid };
    }
    public removeEquipment(uuid: string): boolean {
        const before = this._mounts.length;
        this._mounts = this._mounts.filter((mount) => mount.uuid !== uuid);
        return this._mounts.length < before;
    }

    /**
     * Power amplifiers: energy weapons on an ICE or fuel cell walker need amplifiers weighing 10 percent of them, rounded
     * up to the half ton, taking no slots (TM p.72), as on an IndustrialMech.
     */
    public getPowerAmplifierWeight(): number {
        if (this._engineType !== "ice" && this._engineType !== "cell") return 0;
        const weight = this.getEquipment()
            .filter((each) => !each.isAmmo && each.item.category === "Energy Weapons" && !/vehicle-flamer|chemical-laser/.test(each.tag))
            .reduce((sum, each) => sum + each.weight, 0);
        return weight > 0 ? Math.ceil(weight / 10 * 2 - 1e-9) / 2 : 0;
    }

    // Heat sinks (as on a 'Mech) ----------------------------------------------------------------------------------

    private _heatSinkRecord(): IHeatSync { return mechHeatSinkTypes.find((type) => type.tag === this._heatSinkType)!; }
    /** Heat sinks that come with the engine and weigh nothing: 10 fusion, 5 fission, 1 fuel cell, 0 ICE (TM p.71). */
    public getFreeHeatSinks(): number {
        return this._engineType === "ice" ? 0 : this._engineType === "cell" ? 1 : this._engineType === "fission" ? 5 : 10;
    }
    public getHeatSinks(): number { return this.getFreeHeatSinks() + this._extraHeatSinks; }
    /** At least the engine's free heat sinks. */
    public setHeatSinks(total: number): boolean {
        if (!Number.isInteger(total) || total < this.getFreeHeatSinks() || total > this.getFreeHeatSinks() + 100) return false;
        this._extraHeatSinks = total - this.getFreeHeatSinks();
        return true;
    }
    /** Heat sinks the engine holds without slots: floor(rating / 25) (TM p.71). */
    public getEngineHeatSinkCapacity(): number { return Math.floor(this.getEngineRating() / 25); }
    /** Heat sinks that need slots of their own. */
    public getExternalHeatSinks(): number { return Math.max(0, this.getHeatSinks() - this.getEngineHeatSinkCapacity()); }
    private _heatSinkSlotsEach(): number { return this._heatSinkRecord().crits[this._tech] ?? 1; }
    public getHeatSinkWeight(): number { return this._extraHeatSinks * (this._heatSinkRecord().weightEach ?? 1); }
    public getHeatSinkType(): WalkerHeatSinkType { return this._heatSinkType; }
    /** Single, and double where the era has them; an industrial walker single only (TM p.71). */
    public getHeatSinkTypeOptions(): WalkerHeatSinkType[] {
        if (this._industrial) return ["single"];
        return WALKER_HEAT_SINK_TYPES.filter((tag) => tag === "single" || this._available(mechHeatSinkTypes.find((type) => type.tag === tag)!));
    }
    public setHeatSinkType(tag: string): boolean {
        const type = WALKER_HEAT_SINK_TYPES.find((each) => each === tag);
        if (!type || !this.getHeatSinkTypeOptions().includes(type)) return false;
        this._heatSinkType = type;
        return true;
    }
    public getHeatDissipation(): number { return this.getHeatSinks() * this._heatSinkRecord().dissipation; }

    // Jump jets (NGCFells's: in the legs and outer torsos, by the 'Mech rule) ---------------------------------------------

    private _jumpJetRecord(): IJumpJet { return mechJumpJetTypes.find((type) => type.tag === this._jumpJetType)!; }
    public getJumpJetType(): WalkerJumpJetType { return this._jumpJetType; }
    /**
     * Standard, and improved where the era has them. None without a fusion or fission engine; an industrial walker
     * standard only (TM p.69).
     */
    public getJumpJetTypeOptions(): WalkerJumpJetType[] {
        if (this._engineType === "ice" || this._engineType === "cell") return [];
        if (this._industrial) return ["standard"];
        return WALKER_JUMP_JET_TYPES.filter((tag) => {
            const record = mechJumpJetTypes.find((type) => type.tag === tag)!;
            return tag === "standard" || (this._available(record) && !(record.innerSphereOnly && this._tech === "clan"));
        });
    }
    public setJumpJetType(tag: string): boolean {
        const type = WALKER_JUMP_JET_TYPES.find((each) => each === tag);
        if (!type || !this.getJumpJetTypeOptions().includes(type)) return false;
        this._jumpJetType = type;
        return true;
    }
    /** Jump MP is at most the biped Walking MP, the Running MP with improved jets (NGCFells's: the x 1.25 is the legs, not the engine). */
    public getMaxJumpMP(): number { return this._jumpJetType === "improved" ? Math.ceil(this._walkMP * 1.5) : this._walkMP; }
    public getJumpJets(): number { return this._jumpJets; }
    public getJumpMP(): number { return this._jumpJets; }
    public setJumpJets(count: number): boolean {
        if (!Number.isInteger(count) || count < 0 || count > this.getMaxJumpMP()) return false;
        if (count > 0 && !this.getJumpJetTypeOptions().includes(this._jumpJetType)) return false;
        this._jumpJets = count;
        return true;
    }
    /** Tons a jet by weight class (TM p.51), times the count. */
    public getJumpJetWeight(): number { return this._jumpJets * this._jumpJetRecord().weight_multiplier[jumpJetWeightClass(this._tons)]; }

    // Structure and armor -----------------------------------------------------------------------------------------

    public getStructure(location: WalkerLocation): number { return getWalkerStructure(location, this._tons); }
    public getTotalStructure(): number { return WALKER_LOCATIONS.reduce((sum, location) => sum + this.getStructure(location), 0); }
    /** "Tons Required" is 10 percent of the walker's weight (Best-of p.37); industrial structure twice that (NGCFells's, TechManual p.66). */
    public getStructureWeight(): number { return this._tons * (this._industrial ? WALKER_INDUSTRIAL_STRUCTURE_FACTOR : 0.1); }

    /** At most twice the structure in every location (Best-of p.37); with no location, the whole walker's. */
    public getMaxArmor(location?: WalkerLocation): number {
        if (location) return this.getStructure(location) * 2;
        return this.getTotalStructure() * 2;
    }
    public getArmor(location: WalkerLocation): number { return this._armor[location] ?? 0; }
    public setArmor(location: WalkerLocation, points: number): void {
        if (!WALKER_LOCATIONS.includes(location)) return;
        this._armor[location] = clampInt(points, 0, this.getMaxArmor(location), 0);
    }
    public getArmorPoints(): number { return WALKER_LOCATIONS.reduce((sum, location) => sum + this._armor[location], 0); }
    public getArmorWeight(): number { return ceilHalf(this.getArmorPoints() / ARMOR_POINTS_PER_TON); }
    private _clampArmor(): void {
        for (const location of WALKER_LOCATIONS) this._armor[location] = Math.min(this._armor[location], this.getMaxArmor(location));
    }

    // Critical slots ------------------------------------------------------------------------------------------------

    public getSlotCount(location: WalkerLocation): number {
        return getWalkerSlotCount(location, this._tons, this.usesVariantSlots(), this._edition);
    }

    /** The fixed items of a location, in slot order: null is a slot left empty between them. */
    private _fixedItems(location: WalkerLocation): (string | null)[] {
        if (WALKER_LEGS.includes(location)) return ["Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"];
        const engine = this.getEngineName();
        const engineSlots = this._engineRecord().criticals?.[this._tech] ?? { ct: 6 };
        if (location === "ct") {
            const variant = this.usesVariantSlots();
            const ctSlots = variant ? getFutureWarsEngineSlots(this.getEngineWeight()) : engineSlots.ct ?? 0;
            // Standard: three engine slots, the gyro, the rest of the engine (as a 'Mech). Variant: half the engine first (NGCFells's, as the Compact 'Mech).
            const first = variant ? Math.ceil(ctSlots / 2) : Math.min(3, ctSlots);
            const gyro: string[] = Array(this._gyroSlots()).fill(this.getGyroName());
            return [...Array(first).fill(engine), ...gyro, ...Array(ctSlots - first).fill(engine)];
        }
        if (location === "lt" || location === "rt") return Array(engineSlots[location] ?? 0).fill(engine);
        if (location === "cs") {
            const cockpit = this._variantCockpit();
            if (!cockpit) return ["Life Support", "Sensors", "Cockpit", null, "Sensors", "Life Support"];
            // Flint's head order, as the Compact 'Mech's (NGCFells's): life support, sensors, cockpit; the turret follows (_layout).
            const lifeSupport = cockpit.lifeSupportSlots + (this.hasExtraLifeSupport() ? 1 : 0);
            const sensors = FUTURE_WARS_SENSOR_SLOTS + (this.hasExtraSensors() ? 1 : 0);
            return [...Array(lifeSupport).fill("Life Support"), ...Array(sensors).fill("Sensors"), ...Array(cockpit.slots).fill("Cockpit")];
        }
        return [];
    }
    private _turretSlots(): string[] {
        return this._turret ? Array(getWalkerTurret(this._tons, this.usesVariantSlots()).slots).fill("Turret") : [];
    }

    /**
     * Puts an item of `size` slots in the first run of free slots long enough, else after the last. `owners`, kept beside
     * `slots`, records what each slot belongs to (a mount's uuid, "fixed", "jet", "sink", "turret") for play.
     */
    private static _place(slots: (string | null)[], name: string, size: number, owners?: (string | null)[], owner: string = "fixed"): void {
        for (let start = 0; start + size <= slots.length; start++) {
            if (slots.slice(start, start + size).every((slot) => slot === null)) {
                for (let index = start; index < start + size; index++) {
                    slots[index] = name;
                    if (owners) owners[index] = owner;
                }
                return;
            }
        }
        let end = slots.length;
        while (end > 0 && slots[end - 1] === null) end--;
        slots.length = end;
        if (owners) owners.length = end;
        for (let index = 0; index < size; index++) {
            slots.push(name);
            if (owners) owners.push(owner);
        }
    }
    /** Slots used, counting free slots between items but not after the last. */
    private static _usedLength(slots: (string | null)[]): number {
        let end = slots.length;
        while (end > 0 && slots[end - 1] === null) end--;
        return end;
    }

    /**
     * Every location's slots in order: the fixed items, the equipment, then (with `auto`) the jump jets and the heat sinks
     * the engine cannot hold. In the control section the turret mechanism and the turret's items come last: "anything on
     * the critical chart listed below the turret mechanism" is in the turret (Best-of p.36). Jump jets and heat sinks are
     * placed where there is room (NGCFells's); what finds no room is counted in `unplaced`.
     */
    private _layout(auto: boolean = true, extra?: IWalkerMount): {
        slots: Record<WalkerLocation, (string | null)[]>; owners: Record<WalkerLocation, (string | null)[]>; unplacedJets: number; unplacedSinks: number;
    } {
        const slots = {} as Record<WalkerLocation, (string | null)[]>;
        const owners = {} as Record<WalkerLocation, (string | null)[]>;
        const mounts = extra ? [...this._mounts, extra] : this._mounts;
        const equipment = this._resolveMounts(mounts);
        for (const location of WALKER_LOCATIONS) {
            slots[location] = [...this._fixedItems(location)];
            owners[location] = slots[location].map((slot) => (slot === null ? null : "fixed"));
        }
        for (const each of equipment) {
            if (each.inTurret) continue;
            const rest = each.split ? Math.min(each.split.slots, each.slots) : 0;
            Walker._place(slots[each.location], each.name, each.slots - rest, owners[each.location], each.uuid);
            if (each.split && rest > 0) Walker._place(slots[each.split.location], each.name, rest, owners[each.split.location], each.uuid);
        }
        const turretItems = equipment.filter((each) => each.location === "cs" && each.inTurret);
        // The control section keeps room for the turret mechanism and the turret's items below it.
        const turretReserve = this._turretSlots().length + turretItems.reduce((sum, each) => sum + each.slots, 0);
        const fits = (location: WalkerLocation, size: number): boolean => {
            const trial = [...slots[location]];
            Walker._place(trial, "?", size);
            return Walker._usedLength(trial) <= this.getSlotCount(location) - (location === "cs" ? turretReserve : 0);
        };
        let unplacedJets = 0;
        let unplacedSinks = 0;
        if (auto) {
            const jet = this._jumpJetRecord();
            let jets = this._jumpJets;
            while (jets > 0) {
                const before = jets;
                for (const location of WALKER_JUMP_JET_LOCATIONS) {
                    if (jets > 0 && fits(location, jet.criticals)) {
                        Walker._place(slots[location], this._jumpJetType === "improved" ? "Improved Jump Jet" : "Jump Jet", jet.criticals, owners[location], "jet");
                        jets--;
                    }
                }
                if (jets === before) break;
            }
            unplacedJets = jets;
            const sinkSlots = this._heatSinkSlotsEach();
            const sinkName = this._heatSinkType === "double" ? "Double Heat Sink" : "Heat Sink";
            let sinks = this.getExternalHeatSinks();
            for (const location of WALKER_HEAT_SINK_LOCATIONS) {
                while (sinks > 0 && fits(location, sinkSlots)) {
                    Walker._place(slots[location], sinkName, sinkSlots, owners[location], "sink");
                    sinks--;
                }
            }
            unplacedSinks = sinks;
        }
        const cs = slots.cs;
        if (this._turret || turretItems.length > 0) {
            cs.length = Walker._usedLength(cs);
            owners.cs.length = cs.length;
            for (const turret of this._turretSlots()) {
                cs.push(turret);
                owners.cs.push("turret");
            }
            for (const each of turretItems) {
                for (let index = 0; index < each.slots; index++) {
                    cs.push(each.name);
                    owners.cs.push(each.uuid);
                }
            }
        }
        return { slots, owners, unplacedJets, unplacedSinks };
    }

    /** The location's slots, each an item name or null for a free slot. Items past the last slot are cut (getIssues says so). */
    public getSlots(location: WalkerLocation): (string | null)[] {
        const items = this._layout().slots[location];
        const count = this.getSlotCount(location);
        return Array.from({ length: count }, (_, index) => items[index] ?? null);
    }
    public getFreeSlots(location: WalkerLocation): number { return this.getSlots(location).filter((slot) => slot === null).length; }
    /** Slots the fixed items take, the turret mechanism included. */
    private _usedSlotCount(location: WalkerLocation): number {
        const items = this._fixedItems(location);
        return Walker._usedLength(items) + (location === "cs" ? this._turretSlots().length : 0);
    }

    // Weight, issues ------------------------------------------------------------------------------------------------

    public getWeightLog(): IWalkerWeightLine[] {
        const lines: IWalkerWeightLine[] = [
            { name: this._industrial ? "Industrial Internal Structure" : "Internal Structure", weight: this.getStructureWeight() },
            { name: "Engine", weight: this.getEngineWeight() },
            { name: "Gyro", weight: this.getGyroWeight() },
            { name: "Cockpit", weight: this.getCockpitWeight() },
        ];
        if (this.hasExtraSensors()) lines.push({ name: "Extra Sensors", weight: FUTURE_WARS_EXTRA_SLOT_TONS });
        if (this.hasExtraLifeSupport()) lines.push({ name: "Extra Life Support", weight: FUTURE_WARS_EXTRA_SLOT_TONS });
        if (this._turret) lines.push({ name: "Turret", weight: this.getTurretWeight() });
        if (this.getArmorPoints() > 0) lines.push({ name: "Armor", weight: this.getArmorWeight() });
        if (this.getHeatSinkWeight() > 0) lines.push({ name: "Heat Sinks", weight: this.getHeatSinkWeight() });
        if (this.getJumpJetWeight() > 0) lines.push({ name: "Jump Jets", weight: this.getJumpJetWeight() });
        const equipment = this.getEquipment();
        const gear = equipment.filter((each) => !each.isAmmo).reduce((sum, each) => sum + each.weight, 0);
        const ammo = equipment.filter((each) => each.isAmmo).reduce((sum, each) => sum + each.weight, 0);
        if (gear > 0) lines.push({ name: "Equipment", weight: gear });
        if (ammo > 0) lines.push({ name: "Ammunition", weight: ammo });
        if (this.getPowerAmplifierWeight() > 0) lines.push({ name: "Power Amplifiers", weight: this.getPowerAmplifierWeight() });
        return lines;
    }
    public getWeight(): number { return this.getWeightLog().reduce((sum, line) => sum + line.weight, 0); }
    public getRemainingWeight(): number { return this._tons - this.getWeight(); }

    /** Every Walker is Custom Homebrew (fan rules from a fanzine). */
    public getRequiredRulesLevel(): number { return CUSTOM_HOMEBREW_RULES_LEVEL; }

    public getIssues(): string[] {
        const issues: string[] = [];
        const over = this.getWeight() - this._tons;
        if (over > 0) issues.push(`The design weighs ${this.getWeight()} tons, ${over} over the ${this._tons}-ton limit.`);
        if (!this.getEngineTypeOptions().includes(this._engineType)) {
            const chassis = this._industrial ? "an industrial" : this._tech === "clan" ? "a Clan" : "an Inner Sphere";
            issues.push(`The ${this.getEngineName()} is not available to ${chassis} walker.`);
        }
        if (!this.getGyroTypeOptions().includes(this._gyroType)) {
            issues.push(`The ${this.getGyroName()} is not available to ${this._industrial ? "an industrial" : "a Clan"} walker.`);
        }
        if (this.getEngineRating() > WALKER_MAX_ENGINE_RATING) issues.push(`Engine rating ${this.getEngineRating()} is over ${WALKER_MAX_ENGINE_RATING}.`);
        if (!this.getHeatSinkTypeOptions().includes(this._heatSinkType)) {
            issues.push(`${this._heatSinkRecord().name} heat sinks are not available to ${this._industrial ? "an industrial walker" : "this walker in its era"}.`);
        }
        if (this._jumpJets > 0 && !this.getJumpJetTypeOptions().includes(this._jumpJetType)) {
            issues.push(this.getJumpJetTypeOptions().length === 0
                ? `Jump jets need a fusion or fission engine.`
                : `${this._jumpJetRecord().name} are not available to ${this._industrial ? "an industrial walker (TM p.69)" : "this walker in its era"}.`);
        }
        if (this._jumpJets > this.getMaxJumpMP()) issues.push(`Jump MP ${this._jumpJets} is over the most allowed, ${this.getMaxJumpMP()}.`);
        const layout = this._layout();
        for (const location of WALKER_LOCATIONS) {
            if (this._armor[location] > this.getMaxArmor(location)) {
                issues.push(`${this.getLocationName(location)} armor ${this._armor[location]} is over its maximum of ${this.getMaxArmor(location)}.`);
            }
            const used = this._usedSlotCount(location);
            const all = Walker._usedLength(layout.slots[location]);
            if (used > this.getSlotCount(location)) {
                issues.push(`${this.getLocationName(location)} needs ${used} slots for its fixed items and has ${this.getSlotCount(location)}.`);
            } else if (all > this.getSlotCount(location)) {
                issues.push(`${this.getLocationName(location)} needs ${all} slots for its items and has ${this.getSlotCount(location)}.`);
            }
        }
        if (layout.unplacedJets > 0) issues.push(`${layout.unplacedJets} jump ${layout.unplacedJets === 1 ? "jet has" : "jets have"} no slot.`);
        if (layout.unplacedSinks > 0) issues.push(`${layout.unplacedSinks} heat ${layout.unplacedSinks === 1 ? "sink has" : "sinks have"} no slot.`);
        // Each mount against the rules, as addEquipment checks it (a save, a switch to industrial, a turret taken off).
        const equipment = this.getEquipment();
        for (const each of equipment) {
            const others = this._mounts.filter((mount) => mount.uuid !== each.uuid);
            const problem = this.getChassisRefusal(each.item) ?? this._placementRefusal(each.item, each.location, each.inTurret, others)
                ?? (each.split ? this._placementRefusal(each.item, each.split.location, false, others) : null);
            if (problem) issues.push(problem);
        }
        const weapons = equipment.filter((each) => !each.isAmmo).map((each) => each.item);
        for (const ammo of equipment.filter((each) => each.isAmmo)) {
            if (!weapons.some((weapon) => getCompatibleAmmo(weapon, ammo.item))) issues.push(`${ammo.name} has no weapon to feed.`);
        }
        return issues;
    }
    public isLegal(): boolean { return this.getIssues().length === 0; }

    // Cost (Chunk C) --------------------------------------------------------------------------------------------------

    /**
     * The C-bill cost, step by step. Flint printed none: this is the BattleMech Costs Table (TechManual pp.274-285) run
     * over a walker (NGCFells's), every step provisional (calc-steps-walker.ts says how each row reads a walker). Four legs'
     * actuators; the turret mechanism at 7,500 C-bills a ton (NGCFells's ruling); an industrial walker as an
     * IndustrialMech. Ammunition is left out and shown as a loaded cost, as for a 'Mech.
     */
    public getCostBreakdown(): ICalcBreakdown {
        const trace = new CalcTrace(WALKER_COST_STEPS);
        const commas = (value: number): string => value.toLocaleString("en-US");
        const tons = this._tons;
        let total = 0;
        const add = (id: string, label: string, detail: string | undefined, value: number): void => {
            total += value;
            trace.add(id, { label, detail, value, total });
        };
        const cockpit = getCockpitType(!this._industrial ? "standard" : this._advancedFireControl ? "industrial-advanced-fire-control" : "industrial");
        add("walker.cost.cockpit", this.getCockpitName(), undefined, cockpit.cost);
        add("walker.cost.life-support", "Life support", undefined, 50000);
        add("walker.cost.sensors", "Sensors", `2,000 x ${tons} tons`, 2000 * tons);
        add("walker.cost.musculature", "Musculature (standard)", `2,000 x ${tons} tons`, 2000 * tons);
        const structure = mechInternalStructureTypes.find((type) => type.tag === (this._industrial ? "industrial" : "standard"));
        const structureCost = structure?.cost ?? (this._industrial ? 300 : 400);
        add("walker.cost.structure", this._industrial ? "Industrial internal structure" : "Internal structure", `${commas(structureCost)} x ${tons} tons`, structureCost * tons);
        // Upper leg 150, lower leg 80, foot 120 C-bills a ton (TM p.278), in each of four legs.
        add("walker.cost.actuators", "Leg actuators, four legs", `4 x (150 + 80 + 120) x ${tons} tons`, WALKER_LEGS.length * (150 + 80 + 120) * tons);
        const engine = this._engineRecord();
        add("walker.cost.engine", `Engine (${engine.name} ${this.getEngineRating()})`, `${commas(engine.costMultiplier)} x rating ${this.getEngineRating()} x ${tons} tons / 75`,
            engine.costMultiplier * this.getEngineRating() * tons / 75);
        const gyro = this._gyroRecord();
        add("walker.cost.gyro", gyro.name, `${commas(gyro.costMultiplier)} x ${this.getGyroWeight()} tons`, gyro.costMultiplier * this.getGyroWeight());
        if (this._jumpJets > 0) {
            const jet = this._jumpJetRecord();
            add("walker.cost.jump-jets", `${jet.name} (${this._jumpJets})`, `${commas(jet.costMultiplier)} x ${this._jumpJets} squared x ${tons} tons`, jet.costMultiplier * this._jumpJets * this._jumpJets * tons);
        }
        const sink = this._heatSinkRecord();
        const freeSinks = Math.min(this.getFreeHeatSinks(), sink.freeSinks ?? (this._heatSinkType === "single" ? 10 : 0));
        const paidSinks = Math.max(0, this.getHeatSinks() - freeSinks);
        add("walker.cost.heat-sinks", `${sink.name} (${this.getHeatSinks()})`, `${commas(sink.cost)} x ${paidSinks}${freeSinks > 0 ? `; ${freeSinks} free` : ""}`, sink.cost * paidSinks);
        if (this._turret) {
            // NGCFells's ruling 2026-11-14: 7,500 C-bills a ton, midway between the 'Mech turret (10,000) and the vehicle's (5,000).
            add("walker.cost.turret", "Turret mechanism", `7,500 x ${this.getTurretWeight()} tons`, 7500 * this.getTurretWeight());
        }
        if (this.getPowerAmplifierWeight() > 0) {
            add("walker.cost.power-amplifiers", "Power amplifiers", `20,000 x ${this.getPowerAmplifierWeight()} tons`, 20000 * this.getPowerAmplifierWeight());
        }
        add("walker.cost.armor", "Armor (standard)", `10,000 x ${this.getArmorWeight()} tons`, 10000 * this.getArmorWeight());
        let ammoCost = 0;
        for (const each of this.getEquipment()) {
            const price = each.item.cbills || 0;
            const place = `${this.getLocationName(each.location)}${each.inTurret ? ", turret" : ""}`;
            if (Walker._isAmmoItem(each.item)) {
                ammoCost += price * each.weight;
                trace.add("walker.cost.ammo", { label: `${each.name} (${place})`, detail: `${each.weight} tons x ${commas(price)}; not in the cost`, value: price * each.weight });
            } else {
                add("walker.cost.equipment", `${each.name} (${place})`, undefined, price);
            }
        }
        trace.add("walker.cost.subtotal", { label: "Structure, weapons and equipment", value: total, emphasis: true });
        const divisor = this._industrial ? 400 : 100;
        const multiplier = 1 + tons / divisor;
        trace.add("walker.cost.tonnage-multiplier", { label: "Tonnage multiplier", detail: `1 + ${tons} / ${divisor}${this._industrial ? " (industrial walker)" : ""}`, value: multiplier });
        const result = Math.round(total * multiplier);
        trace.add("walker.cost.final", { label: "Final cost (provisional)", detail: `${commas(total)} x ${multiplier}, rounded`, value: result, emphasis: true });
        if (ammoCost > 0) {
            trace.add("walker.cost.final.loaded", { label: "Loaded cost, with the ammunition carried", value: result + ammoCost, emphasis: true });
        }
        return { kind: "cost", edition: this._rulesEdition, steps: trace.steps, result };
    }
    public getCBillCost(): number { return this.getCostBreakdown().result ?? 0; }

    // Battle Value (Chunk C; provisional) ---------------------------------------------------------------------------------

    /** No Battle Value is published for a Future Wars Walker: ours is always provisional. */
    public isBattleValueProvisional(): true { return true; }

    private static _isAmmoItem(item: IEquipmentItem): boolean { return !!item.isAmmo || item.tag.startsWith("ammo-"); }
    /** Ammunition, or an item that explodes as ammunition does: each slot costs Battle Value (TM p.302). */
    private static _isExplosiveAmmo(item: IEquipmentItem): boolean { return item.explosive === true && (item.isAmmo === true || item.explosiveAsAmmo === true); }
    private static _isExplosiveComponent(item: IEquipmentItem): boolean { return !item.isAmmo && !item.explosiveAsAmmo && (item.gauss === true || item.explosive === true); }
    /** The weapon a bin feeds: the first mounted one that fires it (a walker's bins are not bound to a weapon). */
    private static _binWeapon(items: readonly IEquipmentItem[], bin: IEquipmentItem): IEquipmentItem | null {
        return items.find((item) => !item.isAmmo && !item.isEquipment && getCompatibleAmmo(item, bin)) ?? null;
    }
    /** The slots an item fills in each of its locations: a split item's in both. */
    private static _slotsByLocation(each: IWalkerEquipment): [WalkerLocation, number][] {
        const rest = each.split ? Math.min(each.split.slots, each.slots) : 0;
        return each.split && rest > 0 ? [[each.location, each.slots - rest], [each.split.location, rest]] : [[each.location, each.slots]];
    }
    private static _hasTag(equipment: readonly IWalkerEquipment[], location: WalkerLocation, tags: readonly string[]): boolean {
        return equipment.some((each) => each.location === location && tags.some((tag) => matchesTag(each.item, tag)));
    }

    /** Running MP for Battle Value: MASC or a Supercharger engaged (x 2; both x 2.5), on the four-legged Walking MP. */
    private _battleValueRunMP(equipment: readonly IWalkerEquipment[]): number {
        const walk = this.getWalkerWalkMP();
        const masc = equipment.some((each) => isMASC(each.item));
        const supercharger = equipment.some((each) => each.item.variableFormula === "supercharger");
        return masc && supercharger ? Math.ceil(walk * 2.5) : masc || supercharger ? walk * 2 : this.getRunMP();
    }
    /**
     * The most heat moving makes, as a BattleMech (TM p.303): running 2 (an XXL engine 6) or the jump (1 a hex, at least
     * 3; improved jets half; an XXL engine twice, at least 6); an ICE industrial walker none.
     */
    private _maxMovementHeat(): number {
        if (this._industrial && this._engineType === "ice") return 0;
        const xxl = this._engineType === "xxl" || this._engineType === "clan_xxl";
        const jumpMP = this._jumpJetType === "improved" ? Math.ceil(this._jumpJets / 2) : this._jumpJets;
        const jump = this._jumpJets <= 0 ? 0 : xxl ? Math.max(6, jumpMP * 2) : Math.max(3, jumpMP);
        return Math.max(xxl ? 6 : 2, jump);
    }
    /** Heat the walker sheds: its heat sinks, and any equipment that sheds heat. */
    private _heatSinkCapacity(equipment: readonly IWalkerEquipment[]): number {
        return this.getHeatDissipation() + equipment.reduce((sum, each) => sum + (each.item.heatDissipation ?? 0), 0);
    }

    /**
     * Our provisional BV2: the TechManual BattleMech procedure (pp.302-304) over a walker's ten locations. The armor and
     * structure of every location; explosive slots by location (center torso, control section and legs always cost;
     * the four outer torsos are read as side torsos); every weapon in full, the turret's too; the movement the walker
     * makes on four legs, with no bonus for its piloting modifier; an industrial walker as an IndustrialMech.
     */
    private _calcBattleValue2(trace: CalcTrace): number {
        const fmt = formatCalcNumber;
        const equipment = this.getEquipment();
        const items = equipment.map((each) => each.item);
        const isAmmo = Walker._isAmmoItem;
        const isDefensive = (item: IEquipmentItem): boolean => item.battleValueDefensive === true;
        const binWeapon = (bin: IEquipmentItem) => Walker._binWeapon(items, bin);
        const place = (each: IWalkerEquipment): string => `${this.getLocationName(each.location)}${each.inTurret ? ", turret" : ""}`;

        // Step 1: Defensive Battle Rating.
        const armor = this.getArmorPoints() * 2.5;
        trace.add("walker.bv2.def.armor", { label: "Armor", detail: `${this.getArmorPoints()} points x 2.5`, value: armor });
        const structureType = this._industrial ? 0.5 : 1;
        const structurePoints = this.getTotalStructure() * 1.5 * structureType;
        trace.add("walker.bv2.def.structure", { label: "Internal structure", detail: `${this.getTotalStructure()} points x 1.5 x ${structureType} (${this._industrial ? "Industrial" : "Standard"})`, value: structurePoints });
        const engineModifier = ({ light: 0.75, clan_xl: 0.75, xl: 0.5, xxl: 0.25, clan_xxl: 0.5 } as Record<string, number>)[this._engineType] ?? 1;
        const structure = structurePoints * engineModifier;
        trace.add("walker.bv2.def.engine", { label: `Engine modifier (${this.getEngineName()})`, detail: `${fmt(structurePoints)} x ${engineModifier}`, value: structure });
        const gyroModifier = this._gyroType === "heavy-duty" ? 1 : 0.5;
        const gyro = this._tons * gyroModifier;
        trace.add("walker.bv2.def.gyro", { label: `Gyro (${this.getGyroName()})`, detail: `${this._tons} tons x ${gyroModifier}`, value: gyro });

        let defensiveGear = 0;
        let defensiveAmmo = 0;
        let defensiveAmmoCap = 0;
        for (const each of equipment) {
            const item = each.item;
            if (isAmmo(item)) {
                const fed = binWeapon(item);
                if (!fed || !isDefensive(fed)) continue;
                const worth = getAmmoBattleValuePerTon(fed, item) * each.weight;
                defensiveAmmo += worth;
                trace.add("walker.bv2.def.equipment.ams-ammo", { label: `${each.name} (${place(each)})`, detail: `ammunition for ${fed.name}`, value: worth });
            } else if (isDefensive(item)) {
                defensiveGear += item.battleValue || 0;
                if (item.weaponType?.includes("AMS")) defensiveAmmoCap += item.battleValue || 0;
                trace.add("walker.bv2.def.equipment", { label: `${each.name} (${place(each)})`, value: item.battleValue || 0 });
            }
        }
        if (defensiveAmmo > defensiveAmmoCap) {
            trace.add("walker.bv2.def.equipment.ams-ammo", { label: "Defensive ammunition capped at the AMS BV (Excessive Ammunition rule)", detail: `${fmt(defensiveAmmo)} is over ${defensiveAmmoCap}`, value: defensiveAmmoCap });
            defensiveAmmo = defensiveAmmoCap;
        }
        defensiveGear += defensiveAmmo;
        if (defensiveGear !== 0) trace.add("walker.bv2.def.equipment.total", { label: "Total defensive equipment", value: defensiveGear });

        // Explosive slots, location by location (TM pp.302-303, read for a walker as calc-steps-walker.ts says).
        const clan = this._tech === "clan";
        const outer = (location: WalkerLocation): boolean => WALKER_OUTER_TORSOS.includes(location);
        const caseIIIn = (location: WalkerLocation): boolean => Walker._hasTag(equipment, location, ["case-ii", "clan-case-ii"]);
        // CASE II covers its location and the ones that pass damage into it, the legs excepted (TO:AUE p.193).
        const hasCaseII = (location: WalkerLocation): boolean => caseIIIn(location) || (outer(location) && caseIIIn("ct"));
        const hasCase = (location: WalkerLocation, prototype: boolean): boolean =>
            clan || Walker._hasTag(equipment, location, prototype ? ["case", "case-prototype"] : ["case"]);
        // Three or more engine slots in the left and right torso: CASE there cannot save the walker (TM p.302).
        const engineSideSlots = this._engineRecord().criticals?.[this._tech]?.lt ?? 0;
        const penalised = (location: WalkerLocation, prototype = true): boolean => {
            if (hasCaseII(location)) return false;
            if (!outer(location)) return true;
            return !hasCase(location, prototype) || ((location === "lt" || location === "rt") && engineSideSlots >= 3);
        };
        let explosive = 0;
        const cappedSlots = new Map<string, number>();
        for (const each of equipment) {
            const item = each.item;
            const ammo = Walker._isExplosiveAmmo(item);
            const component = Walker._isExplosiveComponent(item);
            if (!ammo && !component) continue;
            for (const [location, slotsHere] of Walker._slotsByLocation(each)) {
                const name = this.getLocationName(location);
                let slots = ammo ? (item.explosiveAsAmmo ? Math.max(1, slotsHere) : 1) : Math.max(1, slotsHere);
                if (component && item.explosiveBattleValueSlots !== undefined) {
                    // A record can cap the slots counted over the whole item (an HVAC counts as one, TO:AUE p.195).
                    const counted = cappedSlots.get(each.uuid) ?? 0;
                    slots = Math.max(0, Math.min(slots, item.explosiveBattleValueSlots - counted));
                    cappedSlots.set(each.uuid, counted + slots);
                    if (slots === 0) continue;
                }
                if (penalised(location)) {
                    const each1 = ammo ? 15 : 1;
                    for (let slot = 0; slot < (ammo ? slots : 1); slot++) {
                        const cost = ammo ? each1 : slots;
                        explosive += cost;
                        trace.add(ammo ? "walker.bv2.def.explosive.ammo" : "walker.bv2.def.explosive.component", {
                            label: `Explosive ${ammo ? "ammunition" : "component"}: ${each.name} in the ${name}`, value: -cost,
                        });
                    }
                } else if (ammo && penalised(location, false)) {
                    // Spared only by prototype CASE: each ammunition slot costs 8, not 15 (IO:AE p.189).
                    explosive += 8 * slots;
                    trace.add("walker.bv2.def.explosive.prototype-case", { label: `Explosive ammunition: ${each.name} in the ${name} behind prototype CASE`, value: -8 * slots });
                } else if (!clan || hasCaseII(location)) {
                    trace.add("walker.bv2.def.explosive.protected", {
                        label: `Explosive ${ammo ? "ammunition" : "component"} (${each.name}) in the ${name} protected by ${hasCaseII(location) ? "CASE II" : "CASE"}. Penalty negated`, value: 0,
                    });
                }
            }
        }
        let subtotal = armor + structure + gyro + defensiveGear - explosive;
        trace.add("walker.bv2.def.subtotal", { label: "Defensive Subtotal", detail: `${fmt(armor)} + ${fmt(structure)} + ${fmt(gyro)} + ${fmt(defensiveGear)} - ${explosive}`, value: subtotal, emphasis: true });
        if (explosive > 0 && subtotal < 1) {
            subtotal = 1;
            trace.add("walker.bv2.def.floor", { label: "Penalties cannot take the total below 1: Defensive Subtotal set to 1", value: 1 });
        }
        const run = this._battleValueRunMP(equipment);
        const jump = this.getJumpMP();
        const runModifier = getMovementModifier(run);
        const jumpModifier = jump > 0 ? getMovementModifier(jump) + 1 : 0;
        const moveModifier = Math.max(runModifier, jumpModifier);
        trace.add("walker.bv2.def.tmm", { label: "Best Base TMM", detail: `Running MP ${run}: ${runModifier}; Jumping MP ${jump}: ${jumpModifier}`, value: moveModifier });
        const factor = 1 + moveModifier / 10;
        trace.add("walker.bv2.def.factor", { label: "Defensive Factor", detail: `1 + ${moveModifier} / 10`, value: factor });
        let defensive = subtotal * factor;
        if (defensive < 1) {
            defensive = 1;
            trace.add("walker.bv2.def.floor", { label: "The Defensive Battle Rating cannot fall below 1", value: 1 });
        }
        trace.add("walker.bv2.def.rating", { label: "Defensive Battle Rating", detail: `${fmt(subtotal)} x ${fmt(factor)}`, value: defensive, emphasis: true });

        // Step 2: Offensive Battle Rating.
        const hasTargetingComputer = items.some((item) => !!item.variableFormula?.startsWith("targeting-computer"));
        const drone = items.some((item) => item.variableFormula === "drone-operating-system");
        /** A weapon's BV: a machine gun array 0.67 x its (up to four) guns in the same place; x 1.25 with a targeting computer. */
        const weaponValue = (each: IWalkerEquipment): number => {
            const item = each.item;
            const multiplier = drone ? 0.8 : 1;
            if (item.linkedWeaponTags?.length) {
                const same = (other: IWalkerEquipment): boolean => other.location === each.location && other.inTurret === each.inTurret;
                const arrays = equipment.filter((other) => other.tag === each.tag && same(other));
                const turn = arrays.indexOf(each);
                const linked = equipment
                    .filter((other) => same(other) && !other.item.linkedWeaponTags?.length && item.linkedWeaponTags!.includes(other.item.tag))
                    .filter((_gun, index) => index % arrays.length === turn)
                    .slice(0, 4);
                return linked.reduce((sum, gun) => sum + (gun.item.battleValue || 0), 0) * 0.67 * multiplier;
            }
            const base = getCatalogBattleValue(item, this._tech);
            return (hasTargetingComputer && isTargetingComputerWeapon(item) ? base * 1.25 : base) * multiplier;
        };
        const ammoByWeapon = new Map<string, number>();
        const weaponsByTag = new Map<string, number>();
        for (const each of equipment) {
            const item = each.item;
            if (isAmmo(item)) {
                const fed = binWeapon(item);
                if (!fed) {
                    trace.add("walker.bv2.off.ammo.unused", { label: `Ignoring ammunition: ${each.name} (${place(each)}), no mounted weapon fires it`, value: 0 });
                    continue;
                }
                if (isDefensive(fed)) continue;
                const perTon = getAmmoBattleValuePerTon(fed, item);
                const worth = perTon * each.weight;
                ammoByWeapon.set(fed.tag, (ammoByWeapon.get(fed.tag) ?? 0) + worth);
                trace.add("walker.bv2.off.ammo", { label: `${each.name} (${place(each)})`, detail: `for ${fed.name}: ${perTon} BV x ${each.weight} tons`, value: worth });
            } else if (!isDefensive(item)) {
                weaponsByTag.set(item.tag, (weaponsByTag.get(item.tag) ?? 0) + weaponValue(each));
            }
        }
        let ammoTotal = 0;
        for (const [tag, worth] of ammoByWeapon) {
            const cap = weaponsByTag.get(tag) ?? 0;
            if (!cap) continue;
            if (worth > cap) {
                trace.add("walker.bv2.off.ammo.cap", { label: `Excessive Ammunition: ammo for ${tag} capped at its weapons' BV`, detail: `${fmt(worth)} is over ${fmt(cap)}`, value: cap });
            }
            ammoTotal += Math.min(worth, cap);
        }
        if (ammoTotal !== 0) trace.add("walker.bv2.off.ammo.total", { label: "Total ammunition BV", value: ammoTotal });

        // Heat efficiency: 6 + what the heat sinks shed - the most heat moving makes (TM p.303).
        const sinks = this.getHeatSinks();
        let capacity = this._heatSinkCapacity(equipment);
        if (items.some((item) => matchesTag(item, "radical-heat-sink-system"))) {
            const radical = capacity + Math.ceil(sinks * 0.4);
            trace.add("walker.bv2.off.heat.radical", { label: "Radical Heat Sink System", detail: `heat sink capacity ${capacity} + ${sinks} heat sinks x 0.4`, value: radical });
            capacity = radical;
        }
        const movementHeat = this._maxMovementHeat();
        let efficiency = 6 + capacity - movementHeat;
        if (items.some((item) => matchesTag(item, "risc-emergency-coolant-system"))) {
            efficiency += 4;
            trace.add("walker.bv2.off.heat.emergency-coolant", { label: "RISC Emergency Coolant System: +4 heat efficiency", value: 4 });
        }
        const coolantPods = items.filter((item) => item.coolantPod).length;
        if (coolantPods > 0) {
            const pods = Math.min(Math.ceil(sinks * coolantPods / 5), sinks * 2);
            efficiency += pods;
            trace.add("walker.bv2.off.heat.coolant-pod", { label: "Coolant pods", detail: `${coolantPods} x ${sinks} heat sinks / 5`, value: pods });
        }
        trace.add("walker.bv2.off.heat.efficiency", { label: "Heat efficiency", detail: `6 + ${capacity} heat sink capacity - ${movementHeat} movement heat`, value: efficiency });

        const firing = equipment.filter((each) => !isAmmo(each.item) && !isDefensive(each.item)).map((each) => {
            const item = each.item;
            const worth = weaponValue(each);
            let heat = item.battleValueHeat ?? +(item.heat || 0);
            // "Include the heat generated by the capacitor with that generated by the weapon" (TO:AUE p.194).
            if (/(^|-)ppc-capacitor$/.test(item.tag)) heat += 5;
            if (item.isOneShot) heat /= 4;
            else if (item.isStreak) heat /= 2;
            else if (item.isUltra) heat *= 2;
            else if (item.isRotary) heat *= 6;
            return { each, worth, heat };
        }).filter((entry) => entry.heat > 0 || entry.worth > 0);
        const weaponHeat = firing.reduce((sum, entry) => sum + entry.heat, 0);
        trace.add("walker.bv2.off.heat.weapons", { label: "Total weapon heat", detail: firing.length > 0 ? firing.map((entry) => fmt(entry.heat)).join(" + ") : "0", value: weaponHeat });
        // Highest BV first and, between equals, the one that makes the least heat (TM p.303).
        const ordered = [...firing].sort((a, b) => b.worth - a.worth || a.heat - b.heat);
        let weaponTotal = 0;
        let runningHeat = 0;
        let halving = false;
        for (const entry of ordered) {
            const notes = [`Base BV ${fmt(entry.worth)}, heat ${fmt(entry.heat)}`];
            let share = 1;
            let overheated = false;
            if (weaponHeat >= efficiency) {
                if (halving && entry.heat > 0) {
                    share = 0.5;
                    overheated = true;
                    notes.push("halved: over heat efficiency");
                }
                runningHeat += entry.heat;
                if (!halving && runningHeat >= efficiency && entry.heat > 0) {
                    halving = true;
                    notes.push("this weapon reaches the heat efficiency; later weapons count half");
                }
            }
            if (entry.each.antiInfantryOnly) notes.push("anti-infantry only, counted in full");
            weaponTotal += entry.worth * share;
            trace.add(overheated ? "walker.bv2.off.weapon.overheat" : entry.each.inTurret ? "walker.bv2.off.weapon.turret" : "walker.bv2.off.weapon", {
                label: `${entry.each.name} (${place(entry.each)})`, detail: notes.join("; "), value: entry.worth * share, total: weaponTotal,
            });
        }
        trace.add("walker.bv2.off.weapons.total", { label: "Total weapon BV", value: weaponTotal, emphasis: true });
        const base = weaponTotal + ammoTotal + this._tons;
        trace.add("walker.bv2.off.tonnage", { label: "Tonnage", detail: `weapons ${fmt(weaponTotal)} + ammunition ${fmt(ammoTotal)} + tonnage ${this._tons}`, value: this._tons, total: base });
        const speedMP = run + Math.round(jump / 2);
        const speed = getSpeedFactor(speedMP);
        trace.add("walker.bv2.off.speed", { label: "Speed Factor", detail: `Running MP ${run} + half of Jumping MP ${jump} = MP ${speedMP}`, value: speed });
        let offensive = base * speed;
        const fireControl = !this._industrial || this._advancedFireControl;
        trace.add("walker.bv2.off.rating", { label: "Offensive Battle Rating", detail: `${fmt(base)} x ${speed}`, value: offensive, emphasis: fireControl });
        if (!fireControl) {
            trace.add("walker.bv2.off.industrial", { label: "Industrial walker without Advanced Fire Control", detail: `${fmt(offensive)} x 0.9`, value: offensive * 0.9, emphasis: true });
            offensive *= 0.9;
        }

        // Step 3: the final Battle Value.
        let battleValue = defensive + offensive;
        trace.add("walker.bv2.final.sum", { label: "Defensive + Offensive Battle Rating", detail: `${fmt(defensive)} + ${fmt(offensive)}`, value: battleValue });
        const finalMultipliers = new Map<string, IEquipmentItem>();
        for (const item of items) if (item.battleValueFinalMultiplier) finalMultipliers.set(item.tag, item);
        for (const item of finalMultipliers.values()) {
            battleValue *= item.battleValueFinalMultiplier!;
            trace.add(item.variableFormula === "drone-operating-system" ? "walker.bv2.final.drone" : "walker.bv2.final.equipment",
                { label: `${item.name}: total multiplied by ${item.battleValueFinalMultiplier}`, value: battleValue });
        }
        const result = Math.round(battleValue);
        trace.add("walker.bv2.final.round", { label: "Battle Value (provisional)", detail: `${fmt(battleValue)} rounded`, value: result, emphasis: true });
        return result;
    }

    /**
     * Our provisional BV1: the Master Rules BattleMech procedure (BMR pp.139-141; BMR(R) pp.152-154) of `edition` over a
     * walker, with its printing of Maximum Tech for Level 3 gear. The Master Rules have no IndustrialMech: an industrial
     * walker is rated as any other.
     */
    private _calcBattleValue1(edition: string, trace: CalcTrace): number {
        const fmt = formatCalcNumber;
        const equipment = this.getEquipment();
        const items = equipment.map((each) => each.item);
        const isAmmo = Walker._isAmmoItem;
        const isDefensive = isBattleValue1Defensive;
        const levelThree = getBattleValueRules(edition, "mech").levelThree;
        const rate = (item: IEquipmentItem, weapon?: IEquipmentItem) => rateBattleValue1(edition, this._tech, false, item, weapon);
        const valueOf = (item: IEquipmentItem, weapon?: IEquipmentItem): number => rate(item, weapon).value;
        const binWeapon = (bin: IEquipmentItem) => Walker._binWeapon(items, bin);
        const itemStep = (source: string, listed: string): string =>
            source === "unlisted" ? "walker.bv1.off.weapon.unlisted" : source === "level-three" ? "walker.bv1.l3.item"
                : source === "artemis-v" ? "walker.bv1.l3.item.artemis-v" : listed;

        // Step 1: Defensive Battle Rating.
        const levelThreeEngine = levelThree?.engines[this._engineType];
        const engineFactor = levelThreeEngine ?? ({ xl: 0.75, light: 1.125, clan_xl: 1.125 } as Record<string, number>)[this._engineType] ?? 1.5;
        const armor = this.getArmorPoints() * 2;
        const structure = this.getTotalStructure() * engineFactor;
        trace.add("walker.bv1.def.armor", { label: "Armor", detail: `${this.getArmorPoints()} points x 2`, value: armor });
        const structureStep = levelThreeEngine !== undefined ? "walker.bv1.l3.def.engine" : this._engineType === "clan_xl" ? "walker.bv1.def.structure.clan-xl"
            : this._engineType === "light" ? "walker.bv1.def.structure.light-engine" : "walker.bv1.def.structure";
        trace.add(structureStep, { label: `Internal structure (${this.getEngineName()})`, detail: `${this.getTotalStructure()} points x ${engineFactor}`, value: structure });
        trace.add("walker.bv1.def.tonnage", { label: "Tonnage", value: this._tons });
        let defensiveGear = getBattleValue1Ammo(items, binWeapon, valueOf, true);
        if (defensiveGear) trace.add("walker.bv1.def.equipment", { label: "Ammunition for defensive equipment", value: defensiveGear });
        for (const item of items) {
            if (isAmmo(item) || !isDefensive(item)) continue;
            const rating = rate(item);
            defensiveGear += rating.value;
            if (rating.value) trace.add(itemStep(rating.source, "walker.bv1.def.equipment"), { label: item.name, value: rating.value });
        }
        if (levelThree && this._gyroType === "heavy-duty") {
            defensiveGear += 30;
            trace.add("walker.bv1.l3.def.gyro", { label: "Heavy-duty gyro", value: 30 });
        }
        // 20 a ton of explosive ammunition, a Gauss rifle counting as a ton (BMR(R) pp.152-153); CASE II 5 a ton (Level 3).
        const innerSphereXL = (this._engineRecord().criticals?.[this._tech]?.lt ?? 0) >= 3;
        const caseII = (location: WalkerLocation): boolean => !!levelThree && Walker._hasTag(equipment, location, ["case-ii", "clan-case-ii"]);
        const hasCase = (location: WalkerLocation): boolean => this._tech === "clan" || Walker._hasTag(equipment, location, ["case", "case-prototype"]) || caseII(location);
        const penalised = (location: WalkerLocation): boolean => innerSphereXL || !WALKER_OUTER_TORSOS.includes(location) || !hasCase(location);
        let explosive = 0;
        for (const each of equipment) {
            const tons = Walker._isExplosiveAmmo(each.item) ? each.weight : Walker._isExplosiveComponent(each.item) && each.item.gauss ? 1 : 0;
            if (tons <= 0 || !penalised(each.location)) continue;
            const perTon = caseII(each.location) ? 5 : 20;
            explosive += perTon * tons;
            trace.add(perTon === 5 ? "walker.bv1.l3.def.case-ii" : "walker.bv1.def.explosive", {
                label: `Explosive: ${each.name} in the ${this.getLocationName(each.location)}${perTon === 5 ? " behind CASE II" : ""}`,
                detail: `${fmt(tons)} ${tons === 1 ? "ton" : "tons"} x ${perTon}`, value: -perTon * tons,
            });
        }
        // Maximum heat: every weapon (Ultra x 2, Streak / 2) and the hotter of running and jumping.
        const firing = items.filter((item) => !isAmmo(item) && !isDefensive(item));
        const statsEdition = getBattleValueEdition(edition);
        const heatOf = (item: IEquipmentItem): number => (getEditionStats(item, statsEdition)?.heat ?? item.heat ?? 0) * (item.isUltra ? 2 : item.isStreak ? 0.5 : 1);
        const maxHeat = firing.reduce((sum, item) => sum + heatOf(item), 0) + this._maxMovementHeat();
        const coolantPods = levelThree ? items.filter((item) => item.coolantPod).length : 0;
        const sinkCapacity = this._heatSinkCapacity(equipment) + coolantPods;
        const heatPenalty = Math.max(0, maxHeat - sinkCapacity) * 5;
        if (coolantPods) trace.add("walker.bv1.l3.def.coolant-pod", { label: "Coolant pods", detail: `${coolantPods} added to the heat sink capacity` });
        if (heatPenalty) trace.add("walker.bv1.def.heat", { label: "Heat the heat sinks cannot shed", detail: `(${fmt(maxHeat)} maximum heat - ${fmt(sinkCapacity)} heat sink capacity) x 5`, value: -heatPenalty });
        const unfloored = armor + structure + this._tons + defensiveGear - explosive - heatPenalty;
        const subtotal = Math.max(1, unfloored);
        trace.add("walker.bv1.def.subtotal", { label: "Defensive subtotal", detail: unfloored < 1 ? "the subtractions cannot take it below 1" : undefined, value: subtotal });
        // Target Movement Modifiers of the Attack Modifiers Table: up to +4, 1 more for jumping; MASC counts.
        const tmm = (mp: number): number => Math.min(getMovementModifier(mp), 4);
        const jump = this.getJumpMP();
        const movementModifier = Math.max(tmm(this._battleValueRunMP(equipment)), jump > 0 ? tmm(jump) + 1 : 0);
        const hasSupercharger = items.some((item) => item.variableFormula === "supercharger");
        const movementFactor = Math.round((1 + movementModifier / 10) * 100) / 100;
        const defensive = subtotal * movementFactor;
        if (levelThree && hasSupercharger) trace.add("walker.bv1.l3.def.factor.supercharger", { label: "Supercharger", detail: "its movement counts toward the Target Movement Modifier" });
        trace.add("walker.bv1.def.factor", { label: "Defensive Movement Factor", detail: `Target Movement Modifier +${movementModifier}`, value: movementFactor });
        trace.add("walker.bv1.def.rating", { label: "Defensive Battle Rating", detail: `${fmt(subtotal)} x ${movementFactor}`, value: defensive, emphasis: true });

        // Step 2: Offensive Battle Rating. A walker has no rear weapons: each counts in full.
        const weapons = firing.map((item) => ({ item, rating: rate(item) })).filter((entry) => entry.rating.value > 0);
        const weaponBV = weapons.reduce((sum, entry) => sum + entry.rating.value, 0);
        for (const entry of weapons) trace.add(itemStep(entry.rating.source, "walker.bv1.off.weapon"), { label: entry.item.name, value: entry.rating.value });
        // A targeting computer: 20% of the weapons it links; Level 3: a variable-range targeting system 10% more.
        const hasTargetingComputer = items.some((item) => !!item.variableFormula?.startsWith("targeting-computer"));
        const variableRange = !!levelThree && items.some((item) => matchesTag(item, "targeting-variable-range"));
        const linkedBV = weapons.reduce((sum, entry) => sum + (isTargetingComputerWeapon(entry.item) ? entry.rating.value : 0), 0);
        const computerBV = ((hasTargetingComputer ? 0.2 : 0) + (variableRange ? 0.1 : 0)) * linkedBV;
        if (hasTargetingComputer) trace.add("walker.bv1.off.targeting-computer", { label: "Targeting computer", detail: `${fmt(linkedBV)} of linked weapons x 0.2`, value: 0.2 * linkedBV });
        if (variableRange) trace.add("walker.bv1.l3.off.targeting.variable-range", { label: "Variable-range targeting system", detail: `${fmt(linkedBV)} of linked weapons x 0.1`, value: 0.1 * linkedBV });
        const ammoBV = getBattleValue1Ammo(items, binWeapon, valueOf, false);
        for (const bin of items.filter(isAmmo)) {
            const fed = binWeapon(bin);
            if (!fed || isDefensive(fed)) continue;
            const rating = rate(bin, fed);
            if (!rating.value) continue;
            trace.add(rating.source === "unlisted" ? "walker.bv1.off.weapon.unlisted" : rating.multiplier !== 1 ? "walker.bv1.l3.ammo.special" : "walker.bv1.off.ammo", {
                label: bin.name,
                detail: `${fmt(bin.weight)} ${bin.weight === 1 ? "ton" : "tons"} x ${fmt(rating.value)}${rating.multiplier !== 1 ? ` (standard ammunition x ${rating.multiplier})` : ""}`,
                value: rating.value * bin.weight,
            });
        }
        let base = weaponBV + computerBV + ammoBV;
        trace.add("walker.bv1.off.base", { label: "Base Weapon Battle Rating", detail: `weapons ${fmt(weaponBV)} + targeting ${fmt(computerBV)} + ammunition ${fmt(ammoBV)}`, value: base });
        // Weapons that cannot be fired once the walker overheats are worth half.
        if (maxHeat > sinkCapacity) {
            const x = sinkCapacity * base / maxHeat;
            const y = (base - x) / 2;
            base = x + y;
            trace.add("walker.bv1.off.heat", { label: "Modified Weapon Battle Rating", detail: `X = ${fmt(sinkCapacity)} x base / ${fmt(maxHeat)} = ${fmt(x)}; Y = (base - X) / 2 = ${fmt(y)}; X + Y`, value: base });
        }
        // Speed Factor MP: Running + Jumping, 1 more with MASC or a Supercharger (Maximum Tech p.91).
        const enhanced = hasSupercharger || items.some(isMASC);
        const speedMP = this.getRunMP() + jump + (enhanced ? 1 : 0);
        const speedFactor = getSpeedFactor(speedMP);
        const offensive = base * speedFactor;
        if (hasSupercharger) trace.add("walker.bv1.l3.off.speed.supercharger", { label: "Supercharger", detail: "counts as MASC does: 1 added to the MP" });
        trace.add("walker.bv1.off.speed", { label: "Speed Factor", detail: `Running ${this.getRunMP()} + Jumping ${jump}${enhanced ? " + 1" : ""} = MP ${speedMP}`, value: speedFactor });
        trace.add("walker.bv1.off.rating", { label: "Offensive Battle Rating", detail: `${fmt(base)} x ${fmt(speedFactor)}`, value: offensive, emphasis: true });

        const result = Math.round(defensive + offensive);
        trace.add("walker.bv1.final.round", { label: "Battle Value (provisional)", detail: `${fmt(defensive)} + ${fmt(offensive)}, rounded`, value: result, emphasis: true });
        return result;
    }

    /**
     * The Battle Value under `edition`, step by step: the edition's BattleMech procedure over a walker (BV1 under the
     * Master Rules editions, BV2 from Total Warfare on), every step provisional. An edition older than the Battle Value
     * system has none, and says so in one step.
     */
    public getBattleValueBreakdown(edition: string = this._rulesEdition): ICalcBreakdown {
        if (!editionHasBattleValue(edition, "walker")) {
            const trace = new CalcTrace(NO_BATTLE_VALUE_STEPS);
            trace.add("none.no-battle-value", { label: `${getRulesEdition(edition).name} has no Battle Value. Battle Value first appears in the BattleTech Master Rules (1998)` });
            return { kind: "battle-value", edition, scheme: "none", steps: trace.steps, result: null };
        }
        return getBattleValueFor<ICalcBreakdown>(edition, "walker", {
            bv1: () => {
                const trace = new CalcTrace(getWalkerBv1Steps(edition));
                return { kind: "battle-value", edition, scheme: "bv1", result: this._calcBattleValue1(edition, trace), steps: trace.steps };
            },
            bv2: () => {
                const trace = new CalcTrace(WALKER_BV2_STEPS);
                return { kind: "battle-value", edition, scheme: "bv2", result: this._calcBattleValue2(trace), steps: trace.steps };
            },
        });
    }
    /** The provisional Battle Value under `edition`; under an edition with no Battle Value, the BV2 figure (as a 'Mech's). */
    public getBattleValue(edition: string = this._rulesEdition): number {
        return getBattleValueFor(edition, "walker", {
            bv1: () => this._calcBattleValue1(edition, new CalcTrace(getWalkerBv1Steps(edition))),
            bv2: () => this._calcBattleValue2(new CalcTrace(WALKER_BV2_STEPS)),
        });
    }

    // Play (Chunk F) ----------------------------------------------------------------------------------------------
    // Flint's play rules (Best-of pp.36-37; Future Wars #11 pp.25-27, read on the page images). Where he says "as a
    // regular mech", Total Warfare (2022 printing) is followed and cited. What he leaves open is NGCFells's, and says so.

    public getGunnery(): number { return this._gunnery; }
    public setGunnery(skill: number): void { this._gunnery = clampInt(skill, 0, 8, 4); }
    public getPiloting(): number { return this._piloting; }
    public setPiloting(skill: number): void { this._piloting = clampInt(skill, 0, 8, 5); }
    /** The 'Mech skill table (NGCFells's: a walker is a 'Mech with four legs). */
    public getSkillMultiplier(edition: string = this._rulesEdition): number {
        return getSkillMultiplier(this._gunnery, this._piloting, "mech", getBattleValueSkillEdition(edition, "mech")) ?? 1;
    }
    /** The provisional Battle Value with the pilot's skills, for the roster (rounded to the nearest). */
    public getSkillAdjustedBattleValue(edition: string = this._rulesEdition): number {
        return Math.floor(this.getBattleValue(edition) * this.getSkillMultiplier(edition) + 0.5);
    }

    public getInPlay(): IWalkerInPlay { return JSON.parse(JSON.stringify(this._inPlay)); }
    /** Clears all damage, hits and shots fired. */
    public resetInPlay(): void { this._inPlay = {}; this.ewarPlay = {}; }
    /**
     * Every piece of E-War gear mounted (#642). A walker has only standard armor, so no armor entry. Destroyed is the
     * weapon-line rule: a hit slot owned by the item (in either location of a split item), or its location gone.
     */
    public getEWarGear(): IEWarGear[] {
        const gear: IEWarGear[] = [];
        for (const each of this.getEquipment()) {
            const kind = getEWarKind(each.tag);
            if (kind) gear.push({ kind, tag: each.tag, uuid: each.uuid, name: each.name, location: each.location, destroyed: this._isMountLost(each) });
        }
        return gear;
    }
    private _isMountSlotHit(each: IWalkerEquipment): boolean {
        const places = [each.location, ...(each.split ? [each.split.location] : [])];
        return places.some((place) => this._slotOwners(place).some((owner, index) => owner === each.uuid && this.isSlotHit(place, index)));
    }
    private _isMountLost(each: IWalkerEquipment): boolean { return this._isMountSlotHit(each) || this.isLocationDestroyed(each.location); }
    public hasInPlayState(): boolean { return Object.keys(this._inPlay).length > 0; }

    private _lost(field: "armor" | "structure", location: WalkerLocation): number { return this._inPlay[field]?.[location] ?? 0; }
    private _setLost(field: "armor" | "structure", location: WalkerLocation, points: number): void {
        const record = { ...(this._inPlay[field] ?? {}) };
        if (points > 0) record[location] = points;
        else delete record[location];
        if (Object.keys(record).length > 0) this._inPlay[field] = record;
        else delete this._inPlay[field];
    }
    public getArmorLeft(location: WalkerLocation): number { return Math.max(0, this.getArmor(location) - this._lost("armor", location)); }
    public getStructureLeft(location: WalkerLocation): number { return Math.max(0, this.getStructure(location) - this._lost("structure", location)); }
    /** Marks a location's armor points lost (the sheet's circles). */
    public setArmorDamage(location: WalkerLocation, points: number): void {
        if (isWalkerLocation(location)) this._setLost("armor", location, clampInt(points, 0, this.getArmor(location), 0));
    }
    public setStructureDamage(location: WalkerLocation, points: number): void {
        if (isWalkerLocation(location)) this._setLost("structure", location, clampInt(points, 0, this.getStructure(location), 0));
    }
    /** A location whose structure is gone (a leg or the control section blown off too). */
    public isLocationDestroyed(location: WalkerLocation): boolean { return this.getStructureLeft(location) === 0; }

    private _storedPilotHits(): number { return this._inPlay.pilotHits ?? 0; }
    /** Six hits, or killed outright (a Cockpit hit, or the control section gone with the cockpit in it). */
    public getPilotHits(): number { return this.isPilotKilled() ? WALKER_PILOT_HITS : this._storedPilotHits(); }
    public setPilotHits(hits: number): void {
        const value = clampInt(hits, 0, WALKER_PILOT_HITS, 0);
        if (value > 0) this._inPlay.pilotHits = value;
        else delete this._inPlay.pilotHits;
    }
    public isPilotKilled(): boolean {
        return this._storedPilotHits() >= WALKER_PILOT_HITS || this._fixedHits("cs", "Cockpit") > 0 || this.isLocationDestroyed("cs");
    }

    // Ammunition in play: one counter per bin, in getAmmo order.
    /** Shots in a bin: its tons times the shots a ton. */
    public getAmmoShots(binIndex: number): number {
        const bin = this.getAmmo()[binIndex];
        return bin ? Math.floor(bin.weight * (bin.item.roundsPerTon ?? 0)) : 0;
    }
    public getShotsFired(binIndex: number): number { return this._inPlay.shotsFired?.[binIndex] ?? 0; }
    public getShotsLeft(binIndex: number): number { return Math.max(0, this.getAmmoShots(binIndex) - this.getShotsFired(binIndex)); }
    public setShotsFired(binIndex: number, shots: number): void {
        const bins = this.getAmmo();
        if (!Number.isInteger(binIndex) || binIndex < 0 || binIndex >= bins.length) return;
        const fired = bins.map((_bin, index) => this._inPlay.shotsFired?.[index] ?? 0);
        fired[binIndex] = clampInt(shots, 0, this.getAmmoShots(binIndex), 0);
        if (fired.some((value) => value > 0)) this._inPlay.shotsFired = fired;
        else delete this._inPlay.shotsFired;
    }

    // Slots in play ---------------------------------------------------------------------------------------------

    /** What each slot of a location belongs to: a mount's uuid, "fixed", "jet", "sink" or "turret"; null when empty. */
    private _slotOwners(location: WalkerLocation): (string | null)[] {
        const owners = this._layout().owners[location];
        return Array.from({ length: this.getSlotCount(location) }, (_, index) => owners[index] ?? null);
    }
    public isSlotHit(location: WalkerLocation, slot: number): boolean { return this._inPlay.slots?.[location]?.includes(slot) ?? false; }
    /** Hit slots of one fixed item in a location. */
    private _fixedHits(location: WalkerLocation, name: string): number {
        const slots = this.getSlots(location);
        const owners = this._slotOwners(location);
        return (this._inPlay.slots?.[location] ?? []).filter((index) => slots[index] === name && owners[index] === "fixed").length;
    }
    /** Engine slots hit, in every location (an XL engine's side torso slots too). */
    public getEngineHits(): number {
        return WALKER_LOCATIONS.reduce((sum, location) => sum + this._fixedHits(location, this.getEngineName()), 0);
    }
    public getGyroHits(): number { return this._fixedHits("ct", this.getGyroName()); }
    /** A standard, XL or compact gyro is destroyed by two hits, a heavy-duty one by three (TW p.128; TM p.214). */
    public isGyroDestroyed(): boolean { return this.getGyroHits() >= (this._gyroType === "heavy-duty" ? 3 : 2); }
    public getSensorHits(): number { return this._fixedHits("cs", "Sensors"); }
    /** Two sensor hits end weapon attacks (TW p.128); an IndustrialMech's sensors go with one (TW p.128), as an industrial walker's (NGCFells's). */
    public areSensorsDestroyed(): boolean { return this.getSensorHits() >= (this._industrial ? 1 : 2); }

    /** +2 on the Determining Critical Hits Table against an industrial walker, as against an IndustrialMech (TW p.124). */
    public getCriticalHitRollModifier(): number { return this._industrial ? 2 : 0; }

    /**
     * Rolls on the Determining Critical Hits Table as for a 'Mech (TW p.124: 8-9 one hit, 10-11 two, 12 three in a torso
     * or a limb blown off; an industrial walker's 13 counts as 12 and 14 or more is four hits or the limb blown off).
     * A leg is a limb; so is the control section, as a 'Mech's head (NGCFells's). The line is rolled in tables of six, as the
     * sheet prints them, again on an empty line, CASE or a line already hit (TW p.124). `dice` supplies the players'
     * rolls in order; `extraModifier` is added to the chance roll (a fall).
     */
    public rollCriticalHit(location: WalkerLocation, dice: { chance?: number; lines?: number[] } = {}, extraModifier: number = 0): string[] {
        if (!isWalkerLocation(location)) return [];
        const die = () => 1 + Math.floor(Math.random() * 6);
        const roll = dice.chance ?? die() + die();
        const modifier = this.getCriticalHitRollModifier() + extraModifier;
        const result = roll + modifier;
        const name = this.getLocationName(location);
        const limb = WALKER_LEGS.includes(location) || location === "cs";
        const log = [modifier ? `Critical hit roll ${roll} + ${modifier} = ${result}.` : `Critical hit roll ${roll}.`];
        let hits = 0;
        let blownOff = false;
        if (this._industrial && result >= 14) {
            if (limb) blownOff = true;
            else hits = 4;
        } else if (Math.min(12, result) >= 12) {
            if (limb) blownOff = true;
            else hits = 3;
        } else {
            hits = criticalHitsForRoll(result);
        }
        if (blownOff) {
            this.setArmorDamage(location, this.getArmor(location));
            this.setStructureDamage(location, this.getStructure(location));
            log.push(`${name} blown off.${location === "cs" ? " The cockpit goes with it: the pilot is killed." : ""}`);
            return log;
        }
        if (hits === 0) {
            log.push("No critical hit.");
            return log;
        }
        log.push(hits === 1 ? "One critical hit." : `${hits} critical hits.`);
        const slots = this.getSlots(location);
        const owners = this._slotOwners(location);
        const mounts = this.getEquipment();
        const rollAgain = (index: number) => {
            const owner = owners[index];
            const mount = owner ? mounts.find((each) => each.uuid === owner) : undefined;
            return !!mount && isRollAgainTag(mount.tag);
        };
        const hittable = (index: number) => slots[index] !== null && !this.isSlotHit(location, index) && !rollAgain(index);
        const queue = [...(dice.lines ?? [])];
        const next = () => queue.shift() ?? die();
        for (let hit = 0; hit < hits; hit++) {
            if (!slots.some((_slot, index) => hittable(index))) {
                log.push("No line left that can take a critical hit.");
                break;
            }
            for (let attempt = 0; attempt < 100; attempt++) {
                const line = rollCriticalLine(slots.length, next);
                if (line.index === null || !hittable(line.index)) continue;
                const label = line.table ? `${line.table.label}, ${line.line}` : `${line.line}`;
                log.push(`Line ${label}: ${slots[line.index]} is hit.`, ...this.setSlotHit(location, line.index, true));
                break;
            }
        }
        return log;
    }

    /**
     * An industrial walker's End Phase damage check, made in a turn in which it fell or was the target of a successful
     * physical attack, as an IndustrialMech's (TW pp.68, 144): a location on the Front column, read as from the front
     * (NGCFells's), then the Determining Critical Hits Table with +1 a level fallen above 1.
     */
    public rollIndustrialDamageCheck(levelsFallen: number = 0, dice: { location?: number; chance?: number; lines?: number[] } = {}): string[] {
        if (!this._industrial) return [];
        const die = () => 1 + Math.floor(Math.random() * 6);
        const hit = this.getHitLocation("f", dice.location ?? die() + die());
        const fall = Math.max(0, Math.floor(levelsFallen) - 1);
        return [`Location roll ${hit.roll}: ${this.getLocationName(hit.location)}.`, ...this.rollCriticalHit(hit.location, dice, fall)];
    }

    /** Marks a slot hit or not; a new hit returns its effects (ammunition explodes). */
    public setSlotHit(location: WalkerLocation, slot: number, hit: boolean): string[] {
        if (!isWalkerLocation(location) || !Number.isInteger(slot)) return [];
        const slots = this.getSlots(location);
        if (slot < 0 || slot >= slots.length || slots[slot] === null) return [];
        const was = this.isSlotHit(location, slot);
        this._markSlot(location, slot, hit);
        if (!hit || was) return [];
        return this._criticalEffect(location, slot);
    }
    private _markSlot(location: WalkerLocation, slot: number, hit: boolean): void {
        const record = { ...(this._inPlay.slots ?? {}) };
        const list = (record[location] ?? []).filter((index) => index !== slot);
        if (hit) list.push(slot);
        list.sort((a, b) => a - b);
        if (list.length > 0) record[location] = list;
        else delete record[location];
        if (Object.keys(record).length > 0) this._inPlay.slots = record;
        else delete this._inPlay.slots;
    }

    private _criticalEffect(location: WalkerLocation, slot: number): string[] {
        const owner = this._slotOwners(location)[slot];
        const name = this.getSlots(location)[slot] ?? "";
        if (owner === "jet") return ["A jump jet is lost: -1 Jump MP."];
        if (owner === "sink") return [`A heat sink is lost: ${this._heatSinkType === "double" ? 2 : 1} less heat dissipated a turn.`];
        if (owner === "turret") return ["Turret mechanism hit: the turret is locked facing where it last fired (NGCFells's, as a vehicle's turret lock)."];
        if (owner && owner !== "fixed") {
            const ammoIndex = this.getAmmo().findIndex((each) => each.uuid === owner);
            if (ammoIndex >= 0) return this._explodeAmmo(location, ammoIndex);
            return [`${name} destroyed.`];
        }
        const legOut = WALKER_LEGS.includes(location) && !this._legModel().working.some((leg) => leg.leg === location);
        if (name === this.getEngineName()) {
            return this.getEngineHits() >= 3
                ? ["Third engine hit: the engine is destroyed, and the walker with it (TW p.128)."]
                : [`Engine hit ${this.getEngineHits()}: +5 heat a turn each (TW p.128).`];
        }
        if (name === this.getGyroName()) {
            return this.isGyroDestroyed()
                ? ["Gyro destroyed: the walker falls and cannot stand (TW p.128)."]
                : ["Gyro hit: +3 on Piloting Skill Rolls, and a roll at once to stay standing (TW p.128)."];
        }
        switch (name) {
            case "Cockpit": return ["Cockpit hit: the pilot is killed (TW p.128)."];
            case "Sensors": return this.areSensorsDestroyed()
                ? ["Sensors destroyed: no weapon attacks (TW p.128)."]
                : ["Sensors hit: +2 to hit on all weapon attacks (TW p.128)."];
            case "Life Support": return ["Life Support hit: the pilot takes 1 damage in every turn the heat is 15 or more (TW p.128)."];
            case "Hip": {
                const model = this._legModel();
                if (model.ceased?.leg === location) return ["Hip hit: the leg ceases to function. The walker loses its 1.25 movement and +3 piloting bonuses and moves as a two-legged 'Mech (Best-of p.37)."];
                return ["Hip hit after a leg is out: as on a 'Mech, Walking MP halved, +2 on Piloting Skill Rolls; with a second such hip it cannot move (Best-of p.37; TW p.128)."];
            }
            default:
                if (LEG_ACTUATORS.includes(name)) {
                    return legOut
                        ? [`${name} hit: no effect, the leg is already out (Best-of p.37).`]
                        : [`${name} hit: -1 MP off the walker's current movement base, +1 on Piloting Skill Rolls (Best-of p.37; TW p.128).`];
                }
                return [`${name} hit.`];
        }
    }

    /** CASE in the location: a CASE item, or a Clan walker's built-in CASE (NGCFells's, as a Clan 'Mech's). */
    private _hasCaseAt(location: WalkerLocation): boolean {
        if (this._tech === "clan") return true;
        return this.getEquipment().some((each) => isRollAgainTag(each.tag) && (each.location === location || each.split?.location === location));
    }

    /**
     * An ammunition bin explodes (TW p.125): its shots left times one shot's Damage Value go to the location's internal
     * structure, the rest inward to the next location's (as the Micro-Mech's, ours); CASE vents what is left after its
     * location. The pilot takes 2 hits.
     */
    private _explodeAmmo(location: WalkerLocation, binIndex: number): string[] {
        const bin = this.getAmmo()[binIndex];
        const weapon = this.getEquipment().find((each) => !each.isAmmo && getCompatibleAmmo(each.item, bin.item));
        const perShot = weapon ? getBinDamagePerShot(bin.item, weapon.item) : 0;
        const shots = this.getShotsLeft(binIndex);
        const damage = shots * perShot;
        this.setShotsFired(binIndex, this.getAmmoShots(binIndex));
        this.setPilotHits(this._storedPilotHits() + AMMO_EXPLOSION_PILOT_HITS);
        const lines = [`Ammunition explosion: ${damage} damage (${shots} shots x ${perShot}) to the ${this.getLocationName(location)}'s internal structure; the pilot takes ${AMMO_EXPLOSION_PILOT_HITS} hits (TW p.125).`];
        let where: WalkerLocation | null = location;
        let remaining = damage;
        while (remaining > 0 && where) {
            const points = Math.min(this.getStructureLeft(where), remaining);
            this.setStructureDamage(where, this._lost("structure", where) + points);
            remaining -= points;
            if (points > 0 && this.isLocationDestroyed(where)) lines.push(`${this.getLocationName(where)} destroyed.`);
            if (remaining <= 0) break;
            if (this._hasCaseAt(where)) {
                lines.push(`CASE: the other ${remaining} damage is vented.`);
                break;
            }
            where = WALKER_DAMAGE_TRANSFER[where];
        }
        if (remaining > 0 && !where) lines.push(`The other ${remaining} damage is lost: the walker is destroyed.`);
        return lines;
    }

    /**
     * The hit table (Best-of p.36; #11 p.25): the column for the hex face the attack comes through, the plain reading
     * from the front faces and the parenthesized one from the rear. Infantry and vehicles in the walker's hex use the
     * Front/(Rear) column, front or rear at random (pass "f" or "r"), and a control hit is a center torso hit.
     */
    public getHitLocation(direction: WalkerAttackDirection, roll: number, inHex: boolean = false): IWalkerHitLocation {
        const face = WALKER_ATTACK_DIRECTIONS.find((each) => each.tag === direction) ?? WALKER_ATTACK_DIRECTIONS[0];
        const dice = clampInt(roll, 2, 12, 7);
        const row = WALKER_HIT_TABLE.find((each) => each.roll === dice)!;
        const cell = row[inHex ? "front" : face.column];
        const read = readWalkerHitCell(cell, face.rear);
        const location = inHex && read.location === "cs" ? "ct" : read.location;
        return { roll: dice, direction: face.tag, cell, location, critical: read.critical };
    }
    /** Rolls 2D6 on the hit table; in the walker's hex the front or rear reading is picked at random. */
    public rollHitLocation(direction: WalkerAttackDirection, inHex: boolean = false): IWalkerHitLocation {
        const die = () => 1 + Math.floor(Math.random() * 6);
        const face: WalkerAttackDirection = inHex ? (die() <= 3 ? "f" : "r") : direction;
        return this.getHitLocation(face, die() + die(), inHex);
    }

    /**
     * Damage "as on a regular mech": armor, then internal structure; a location whose structure is gone passes the rest
     * on (WALKER_DAMAGE_TRANSFER, ours). Each hit on the control section (the turret is part of it for damage, Best-of
     * p.36) gives the pilot a hit, as a hit on a 'Mech's head does (NGCFells's). A walker has no rear armor: the rear torso is
     * a location of its own.
     */
    public applyDamage(location: WalkerLocation, points: number): string[] {
        if (!isWalkerLocation(location)) return [];
        let remaining = clampInt(points, 0, 9999, 0);
        const lines: string[] = [];
        if (location === "cs" && remaining > 0 && !this.isLocationDestroyed("cs")) {
            this.setPilotHits(this._storedPilotHits() + 1);
            lines.push("A hit on the control section: the pilot takes a hit (as a 'Mech's head, NGCFells's ruling).");
        }
        let where: WalkerLocation | null = location;
        while (remaining > 0 && where) {
            const name = this.getLocationName(where);
            if (!this.isLocationDestroyed(where)) {
                const armor = Math.min(this.getArmorLeft(where), remaining);
                this.setArmorDamage(where, this._lost("armor", where) + armor);
                remaining -= armor;
                if (remaining <= 0) break;
                const structure = Math.min(this.getStructureLeft(where), remaining);
                this.setStructureDamage(where, this._lost("structure", where) + structure);
                remaining -= structure;
                lines.push(`${name}: ${structure} to the internal structure; roll for critical hits.`);
                if (this.isLocationDestroyed(where)) lines.push(`${name} destroyed.${where === "cs" ? " The pilot is killed." : ""}`);
                if (remaining <= 0) break;
            }
            const next: WalkerLocation | null = WALKER_DAMAGE_TRANSFER[where];
            if (!next) {
                lines.push(`The other ${remaining} damage is lost: the walker is destroyed.`);
                break;
            }
            lines.push(`${remaining} passes to the ${this.getLocationName(next)}.`);
            where = next;
        }
        return lines;
    }

    /** Destroyed with its pilot, its center torso's structure or its engine (three hits), as a 'Mech (TW). */
    public isDestroyed(): boolean { return this.getDestroyedReason() !== null; }
    public getDestroyedReason(): string | null {
        if (this.isPilotKilled()) return "The pilot is killed.";
        if (this.isLocationDestroyed("ct")) return "The center torso's internal structure is gone.";
        if (this.getEngineHits() >= 3) return "The engine is destroyed (three hits).";
        return null;
    }

    /**
     * The legs (Best-of p.37; #11 p.26). A leg "ceases to function" with a hip critical, all its structure lost, or
     * blown off. "Hip criticals taken after one leg ceases to function ... affect a walker the way they would a normal
     * mech." The sheet keeps no order of events, so (NGCFells's): with a leg's structure gone, every hip hit on a standing leg
     * is a 'Mech hip; with none gone, the first hipped leg has ceased and any other hip hit is a 'Mech hip. Actuator hits
     * count only on standing legs without a hip hit (a hip supersedes them).
     */
    private _legModel() {
        const legs = WALKER_LEGS.map((leg) => {
            const hits = (this._inPlay.slots?.[leg] ?? []).map((index) => this.getSlots(leg)[index]);
            return {
                leg, destroyed: this.isLocationDestroyed(leg), hip: hits.includes("Hip"),
                actuators: hits.filter((name) => !!name && LEG_ACTUATORS.includes(name)).length,
            };
        });
        const destroyed = legs.filter((each) => each.destroyed);
        const hipped = legs.filter((each) => !each.destroyed && each.hip);
        const ceased = destroyed.length === 0 && hipped.length > 0 ? hipped[0] : null;
        const working = legs.filter((each) => !each.destroyed && each !== ceased);
        return {
            legs, ceased, working,
            out: destroyed.length + (ceased ? 1 : 0),
            mechHips: hipped.filter((each) => each !== ceased).length,
            actuatorHits: working.filter((each) => !each.hip).reduce((sum, each) => sum + each.actuators, 0),
        };
    }
    /** Legs still working (4 less those that have ceased to function). */
    public getWorkingLegs(): number { return WALKER_LEGS.length - this._legModel().out; }

    /** Jump jets lost: hit, or in a location whose structure is gone. */
    private _jumpJetsLost(): number {
        const per = Math.max(1, this._jumpJetRecord().criticals);
        let lost = 0;
        for (const location of WALKER_LOCATIONS) {
            const owners = this._slotOwners(location);
            const jets = owners.map((owner, index) => (owner === "jet" ? index : -1)).filter((index) => index >= 0);
            if (jets.length === 0) continue;
            lost += this.isLocationDestroyed(location) ? jets.length / per : Math.ceil(jets.filter((index) => this.isSlotHit(location, index)).length / per);
        }
        return Math.floor(lost);
    }

    /**
     * Movement now (Best-of p.37). Four legs: the biped Walking MP x 1.25, less one for each actuator hit ("actuator hits
     * reduce MP's off a walker's current movement base"). One leg out: the biped Walking MP, each 'Mech hip halving it
     * (round up; two leave none, TW p.128), less the actuator hits. Two out: it crawls, 1 MP (NGCFells's), no running or
     * jumping. Three or more: none. Running is figured from the walking figure. A destroyed gyro: no movement.
     */
    public getPlayMovement(): IWalkerPlayMovement {
        if (this.isDestroyed()) return { walk: 0, run: 0, jump: 0, text: "Destroyed", notes: [] };
        const model = this._legModel();
        const notes: string[] = [];
        let walk = 0;
        let canRun = true;
        let canJump = true;
        let crawl = false;
        if (model.out === 0) {
            walk = this.getWalkerWalkMP() - model.actuatorHits;
        } else if (model.out === 1) {
            walk = this._walkMP;
            for (let hip = 0; hip < model.mechHips; hip++) walk = Math.ceil(walk / 2);
            if (model.mechHips >= 2) walk = 0;
            walk -= model.actuatorHits;
            notes.push("A leg is out: no 1.25 movement or +3 piloting bonus; it moves as a two-legged 'Mech and cannot kick (Best-of p.37).");
        } else if (model.out === 2) {
            walk = 1;
            canRun = false;
            canJump = false;
            crawl = true;
            notes.push("Two legs are out: it may only crawl (Best-of p.37); 1 hex a turn, no running or jumping (NGCFells's).");
        } else {
            canRun = false;
            canJump = false;
            notes.push("Three or more legs are out: it cannot move (Best-of p.37).");
        }
        walk = Math.max(0, walk);
        if (this.isGyroDestroyed()) {
            walk = 0;
            canRun = false;
            canJump = false;
            crawl = false;
            notes.push("Gyro destroyed: it falls and cannot stand (TW p.128).");
        }
        const run = canRun && walk > 0 ? Math.ceil(walk * 1.5) : 0;
        const jump = canJump ? Math.max(0, this._jumpJets - this._jumpJetsLost()) : 0;
        const knockOver = this.getKnockOverRule();
        if (knockOver) notes.push(knockOver);
        const text = crawl ? `Crawl ${walk}` : `Walk ${walk}, Run ${run}${this._jumpJets > 0 ? `, Jump ${jump}` : ""}`;
        return { walk, run, jump, text, notes };
    }

    /**
     * The modifier on every Piloting Skill Roll now (target number; negative is easier). Four working legs: the "+3"
     * piloting bonus, -3 (Best-of p.37). Each actuator hit on a standing leg +1, a 'Mech hip +2, a gyro hit +3 (TW
     * p.128). Each leg out past the first +5, as a 'Mech's destroyed leg (NGCFells's: with one out it moves as a biped).
     */
    public getPilotingModifier(): IWalkerModifier {
        const model = this._legModel();
        const lines: string[] = [];
        let total = 0;
        if (model.out === 0) {
            total -= 3;
            lines.push("Four working legs -3");
        }
        for (const leg of model.working) {
            if (leg.hip) {
                if (model.ceased !== leg) {
                    total += 2;
                    lines.push(`${this.getLocationName(leg.leg)} hip +2`);
                }
            } else if (leg.actuators > 0) {
                total += leg.actuators;
                lines.push(`${this.getLocationName(leg.leg)} actuators +${leg.actuators}`);
            }
        }
        if (model.out >= 2) {
            const extra = 5 * (model.out - 1);
            total += extra;
            lines.push(`${model.out - 1} more ${model.out === 2 ? "leg" : "legs"} out +${extra}`);
        }
        if (this.getGyroHits() > 0) {
            total += 3 * this.getGyroHits();
            lines.push(`Gyro hit${this.getGyroHits() > 1 ? "s" : ""} +${3 * this.getGyroHits()}`);
        }
        return { total, lines };
    }

    /** "They may kick in any direction if all their legs are intact. If they lose a leg they may no longer kick" (Best-of p.37). No punches. */
    public canKick(): boolean { return !this.isDestroyed() && this._legModel().out === 0; }

    /**
     * #11 p.26 only: an immobilized walker with structure in every leg, not knocked over when it was immobilized, can be
     * knocked over only by a 'Mech pushing it until a leg's structure is gone. The rule text while it applies, else null.
     */
    public getKnockOverRule(): string | null {
        const rule = this.getEditionRules().immobilizedKnockOver;
        if (!rule || this.isDestroyed()) return null;
        if (WALKER_LEGS.some((leg) => this.isLocationDestroyed(leg))) return null;
        const model = this._legModel();
        const immobile = this.isGyroDestroyed() || model.out >= 3 || (model.out === 1 && (model.mechHips >= 2
            || Math.max(0, Math.ceil(this._walkMP / 2 ** model.mechHips) - model.actuatorHits) === 0));
        const fourLegs = model.out === 0 && this.getWalkerWalkMP() - model.actuatorHits <= 0;
        return immobile || fourLegs ? rule : null;
    }

    /**
     * Each weapon in play: its arcs (WALKER_LOCATION_ARCS; the turret all four), lost with any of its slots or its
     * location, +2 to hit with a sensor hit, none with the sensors destroyed, none with its ammunition gone.
     */
    public getWeaponPlayLines(): IWalkerWeaponPlayLine[] {
        const rules = this.getEditionRules();
        const ammo = this.getAmmo();
        const destroyedUnit = this.isDestroyed();
        return this.getEquipment().filter((each) => isWalkerWeapon(each.item)).map((each) => {
            const reasons: string[] = [];
            const slotHit = this._isMountSlotHit(each);
            const lost = this._isMountLost(each);
            if (lost) reasons.push(slotHit ? "destroyed" : `the ${this.getLocationName(each.location)} is gone`);
            if (this.areSensorsDestroyed()) reasons.push("sensors destroyed");
            const bins = ammo.map((bin, index) => ({ bin, index })).filter(({ bin }) => getCompatibleAmmo(each.item, bin.item));
            if (bins.length > 0 && bins.every(({ index }) => this.getShotsLeft(index) <= 0)) reasons.push("no ammunition");
            if (destroyedUnit) reasons.push("the walker is destroyed");
            const arcs = each.inTurret ? [...WALKER_ALL_ARCS] : each.antiInfantryOnly ? [] : [...WALKER_LOCATION_ARCS[each.location]];
            const note = each.antiInfantryOnly
                ? `Only at infantry and vehicles in the walker's hex, short range: base to-hit ${rules.antiInfantryBaseToHit} with the -2 (${rules.name}).`
                : each.inTurret ? "Turret: any arc (the standard turret rules)." : each.location === "cs" ? "Control section: front or rear." : "";
            return {
                uuid: each.uuid, name: each.name, location: each.location, inTurret: each.inTurret, arcs,
                toHit: this.getSensorHits() > 0 && !this.areSensorsDestroyed() ? 2 : 0,
                destroyed: lost, canFire: reasons.length === 0, reasons, note,
            };
        });
    }

    /** The play rules the sheet does not track, in our own words, for the play panel. */
    public getPlayNotes(): string[] {
        const rules = this.getEditionRules();
        const notes = [
            "Hit locations: roll on the column for the hex face the attack comes through; the plain reading from a front face, the one in brackets from a rear face. A 12 is a control section hit and a critical hit roll (NGCFells's).",
            "Infantry and vehicles in the walker's hex use the Front/(Rear) column, front or rear at random; a control section hit is a center torso hit.",
            `Firing arcs: ${rules.firingArcs} Legs fire into both arcs of their quadrant; control section weapons not in the turret fire front or rear; the turret fires all round.`,
            "No punches. Kicks in any direction while all four legs work; none once a leg is out.",
            "Damage passes from a leg to the torso on its side, and from an outer torso or the control section to the center torso (NGCFells's). The turret is part of the control section for damage.",
        ];
        if (rules.immobilizedKnockOver) notes.push(rules.immobilizedKnockOver);
        if (this._industrial) notes.push("Industrial walker: +2 on critical hit rolls, and an End Phase damage check after a fall or a successful physical attack (as an IndustrialMech, TW pp.68, 124, 144).");
        return notes;
    }

    // Alpha Strike --------------------------------------------------------------------------------------------------
    // Our ruleset (NGCFells's answers 2026-11-15): docs/superpowers/specs/2026-11-15-walker-alpha-strike.md. NOT OFFICIAL.

    /** Flint's base to-hit less his 2, in place of the pilot's Skill for an AIF attack: 6 (Best-of) or -2 (#11). */
    public getAlphaStrikeAntiInfantryTargetNumber(): number { return this.getEditionRules().antiInfantryBaseToHit - 2; }

    /**
     * Structure: the 'Mech Structure Conversion Table (ASC p.98) by tonnage and engine, scaled by the walker's own
     * structure points (ten locations) against a biped 'Mech's (eight), rounded normally, at least 1 (NGCFells, 2026-11-15).
     */
    public getAlphaStrikeStructure(): { structure: number; table: number; column: AlphaStrikeStructureColumn; bipedPoints: number } {
        const columns: Partial<Record<WalkerEngineType, AlphaStrikeStructureColumn>> = {
            xl: "isXl", clan_xl: "clanXl", light: "isLight", compact: "isCompact", xxl: "isXxl", clan_xxl: "clanXxl",
        };
        const column = columns[this._engineType] ?? "standard";
        const table = getAlphaStrikeMechStructure(column, this._tons) ?? Math.max(1, Math.ceil(this._tons / 10));
        const bipedPoints = BIPED_STRUCTURE_POINTS[this._tons] ?? this.getTotalStructure();
        const structure = Math.max(1, Math.round(table * this.getTotalStructure() / bipedPoints + 1e-9));
        return { structure, table, column, bipedPoints };
    }

    /** Damage multiplier for ammunition: none carried x 0, under 10 shots a weapon of its kind x 0.75 (ASC p.101). */
    private _asAmmoFactor(weapon: IEquipmentItem, equipment: IWalkerEquipment[]): number {
        const usesAmmo = !!weapon.ammoTypes?.length || (weapon.shotsPerTon ?? 0) > 0;
        if (!usesAmmo || weapon.isOneShot) return 1;
        const sameWeapons = equipment.filter((each) => !each.isAmmo && each.item.tag === weapon.tag).length;
        const shots = equipment.filter((each) => each.isAmmo && getCompatibleAmmo(weapon, each.item))
            .reduce((sum, bin) => sum + getWeaponShotsPerTon(weapon, bin.item) * bin.weight, 0);
        if (shots <= 0) return 0;
        return shots / Math.max(1, sameWeapons) >= 10 ? 1 : 0.75;
    }

    public getAlphaStrikeStats(): IWalkerAlphaStrikeStats {
        const log: string[] = [];
        const specials: string[] = [WALKER_AS_ABILITY];
        const add = (code: string): void => { if (code && !specials.includes(code)) specials.push(code); };
        const type = this._industrial ? WALKER_INDUSTRIAL_AS_TYPE : WALKER_AS_TYPE;
        const equipment = this.getEquipment();

        // Size by tonnage, the 'Mech rows (ASC p.92).
        const size = this._tons >= 80 ? 4 : this._tons >= 60 ? 3 : this._tons >= 40 ? 2 : 1;

        // Move: 2 inches a Walking MP on four legs; MASC or a Supercharger x 1.25, both x 1.5, rounded normally; the
        // jump is not boosted (ASC pp.92-93).
        const masc = equipment.some((each) => isMASC(each.item));
        const supercharger = equipment.some((each) => each.item.variableFormula === "supercharger");
        const boost = masc && supercharger ? 1.5 : masc || supercharger ? 1.25 : 1;
        const walk = Math.round(this.getWalkerWalkMP() * boost + 1e-9);
        const ground = walk * 2;
        const jumpMP = this.getJumpMP();
        const jump = jumpMP * 2;
        const move = jump <= 0 ? `${ground}"` : jump === ground ? `${ground}"j` : `${ground}"/${jump}"j`;
        const tmm = groundTMM(ground);
        const jumpDifference = jump > 0 ? groundTMM(jump) - tmm : 0;
        if (jumpDifference > 0) add(`JMPS${jumpDifference}`);
        if (jumpDifference < 0) add(`JMPW${-jumpDifference}`);
        log.push(`Size ${size} (${this._tons} tons). Move: ${this.getWalkerWalkMP()} Walking MP on four legs${boost > 1 ? ` x ${boost} = ${walk}` : ""} x 2 = ${move}; Target Movement Modifier +${tmm}`);

        // Armor: the ten locations' points / 30, rounded normally (ASC p.95).
        const armorPoints = this.getArmorPoints();
        const armor = Math.round(armorPoints / 30 + 1e-9);
        const scaled = this.getAlphaStrikeStructure();
        const structure = scaled.structure;
        log.push(`Armor: ${armorPoints} / 30 = ${(armorPoints / 30).toFixed(2)}, rounded to ${armor}`);
        log.push(`Structure: ASC p.98 column ${scaled.column}, ${scaled.table}; x ${this.getTotalStructure()} walker structure points / ${scaled.bipedPoints} for a biped = ${(scaled.table * this.getTotalStructure() / scaled.bipedPoints).toFixed(2)}, rounded to ${structure}`);

        // Which weapons count where: the rear torso is REAR only; the center torso is AIF only; the rest, the turret
        // included, is the damage line (spec section 2).
        const targetingComputer = equipment.some((each) => each.item.variableFormula === "targeting-computer-is" || each.item.variableFormula === "targeting-computer-clan");
        const weapons = equipment.filter((each) => !each.isAmmo && isWalkerWeapon(each.item) && !!each.item.alphaStrike).map((each) => {
            const as = each.item.alphaStrike;
            const factor = this._asAmmoFactor(each.item, equipment) * (targetingComputer && as.tc ? 1.1 : 1);
            const notes = (as.notes ?? []).map((note) => note.trim().toLowerCase());
            return {
                each, factor, notes,
                damage: [as.rangeShort || 0, as.rangeMedium || 0, as.rangeLong || 0].map((value) => value * factor),
                // Rocket launchers and one-shot launchers give no heat (ASC p.116).
                heat: each.item.isOneShot ? 0 : getMountedHeat(each.item, +as.heat || 0),
                where: (each.location === "ct" && !each.inTurret ? "aif" : each.location === "rrt" && !each.inTurret ? "rear" : "forward") as "aif" | "rear" | "forward",
            };
        });
        type Counted = typeof weapons[number];
        const sum = (list: Counted[]): number[] => list.reduce((total, weapon) => total.map((value, range) => value + weapon.damage[range]), [0, 0, 0]);
        const forward = weapons.filter((weapon) => weapon.where === "forward");
        const rear = weapons.filter((weapon) => weapon.where === "rear");
        const belly = weapons.filter((weapon) => weapon.where === "aif");
        const turret = forward.filter((weapon) => weapon.each.inTurret);
        for (const weapon of weapons) {
            const text = weapon.damage.map((value) => value.toFixed(2)).join(" / ");
            const place = weapon.each.inTurret ? "turret" : this.getLocationName(weapon.each.location);
            const counts = weapon.where === "aif" ? "AIF only" : weapon.where === "rear" ? "REAR only" : weapon.each.inTurret ? "damage line and TUR" : "damage line";
            log.push(`${weapon.each.name} (${place}): ${text}, ${counts}${weapon.factor === 0 ? ", no ammunition" : weapon.factor < 1 ? ", under 10 shots: x 0.75" : weapon.factor > 1 ? ", targeting computer: x 1.1" : ""}`);
        }

        // Heat (Companion Converting Heat errata v1.3, superseding ASC pp.115-116): movement heat, the forward weapons'
        // heat (the rear torso's instead when it is greater; the center torso's anti-infantry weapons add none, ours), every
        // AMS, against the heat sinks. The Long output leaves out the weapons with no Long damage.
        const moveHeat = alphaStrikeMovementHeat({
            jumpMP, industrial: this._industrial, improvedJets: this._jumpJetType === "improved",
            xxl: this._engineType === "xxl" || this._engineType === "clan_xxl",
        });
        const heatOf = (list: Counted[]): number => list.filter((weapon) => weapon.factor > 0 && !addsNoAlphaStrikeWeaponHeat(weapon.each.item))
            .reduce((total, weapon) => total + weapon.heat, 0);
        const rearHotter = heatOf(rear) > heatOf(forward);
        const firing = rearHotter ? rear : forward;
        const extraHeat = alphaStrikeExtraHeat({ equipmentTags: equipment.filter((each) => !each.isAmmo).map((each) => each.item.tag) });
        const heatAll = moveHeat + extraHeat + heatOf(firing);
        const heatLong = moveHeat + extraHeat + heatOf(firing.filter((weapon) => weapon.damage[2] > 0));
        const dissipation = this.getHeatDissipation();
        const base = sum(forward);
        const heat = applyAlphaStrikeHeat({ subtotals: [...base, 0], heatOutput: heatAll, longHeatOutput: heatLong, dissipation });
        const { modified, overheat, factor } = heat;
        const damageValues = { short: heat.values[0], medium: heat.values[1], long: heat.values[2] };
        // OVL only when there is an Overheat to use at Long range (NGCFells's: it does nothing otherwise).
        if (heat.ovl && overheat > 0) add("OVL");
        log.push(`Heat: ${moveHeat} for movement + ${heatAll - moveHeat - extraHeat} for the ${rearHotter ? "rear (hotter than the forward)" : "forward"} weapons${extraHeat > 0 ? ` + ${extraHeat} for AMS` : ""} = ${heatAll} (Long range ${heatLong}), less 4, against ${dissipation} dissipated`);
        log.push(`Damage: ${base.map((value) => value.toFixed(2)).join(" / ")}${heat.hot ? `, heat-modified to ${modified.slice(0, 3).map((value) => value.toFixed(2)).join(" / ")}` : ""}, giving ${[damageValues.short, damageValues.medium, damageValues.long].map(formatWalkerASDamage).join("/")}; Overheat ${overheat}${heat.ovl ? ", OVL" : ""}`);

        // The damage abilities (ASC pp.117-133), heat-modified like the damage line (errata v1.3). LRM, SRM and AC need
        // 1 point at Medium range before the heat; IF is the Long damage of the indirect-fire weapons; all rounded normally.
        const vector = (values: number[], rounding: "up" | "normal" | "normalNoMinimal", scale: number[] = [1, 1, 1]): string => values.map((raw, range) => {
            const scaled = raw * scale[range];
            const value = rounding === "up" ? finalAlphaStrikeDamage(scaled) : roundAlphaStrikeAbilityDamage(scaled);
            if (rounding === "normalNoMinimal" && value.minimal) return "-";
            return value.minimal ? "0*" : value.damage > 0 ? `${value.damage}` : "-";
        }).join("/");
        const families = (list: Counted[]): string[] => {
            const codes: string[] = [];
            const of = (...keys: string[]): number[] => sum(list.filter((weapon) => weapon.notes.some((note) => keys.includes(note))));
            const indirect = of("indirect fire", "if");
            if (indirect[2] > 0) codes.push(`IF${vector([indirect[2]], "normal", [factor[2]])}`);
            for (const [code, keys, ranges] of [["LRM", ["lrm"], 3], ["SRM", ["srm"], 2], ["AC", ["ac"], 3]] as const) {
                const damage = of(...keys);
                if (roundUpToTenth(damage[1]) >= 1) codes.push(`${code}${vector(damage.slice(0, ranges), "normalNoMinimal", factor)}`);
            }
            const flak = of("flak");
            if (flak.some((value) => value > 0)) codes.push(`FLK${vector(flak, "normal", factor)}`);
            const heatDamage = of("heat");
            if (heatDamage.some((value) => value > 0)) codes.push(`HT${vector(heatDamage, "normal", factor)}`);
            return codes;
        };
        families(forward).forEach(add);
        // REAR is not heat-modified: its heat is not in the output (unless it is the hotter side; then it is the one
        // weapon set counted, and the forward line is modified by it). Ours.
        const rearVector = vector(sum(rear), "normal");
        if (/[^-/]/.test(rearVector)) add(`REAR${rearVector}`);
        // TUR is heat-modified: its weapons' heat is in the output (NGCFells's).
        if (turret.length > 0) add(`TUR(${[vector(sum(turret), "up", factor), ...families(turret)].join(",")})`);
        // AIF#: the center-torso weapons' Short values, rounded normally; under 0.5 is AIF0*.
        const bellyShort = sum(belly)[0];
        if (bellyShort > 0) {
            add(`AIF${vector([bellyShort], "normal")}`);
            log.push(`AIF: ${bellyShort.toFixed(2)} at Short range from the center torso; target number ${this.getAlphaStrikeAntiInfantryTargetNumber()} (${this.getEditionRules().name})`);
        }

        // The equipment's own abilities; no MEL (a walker has no arms), and the keywords above are already written.
        const written = ["mel", "lrm", "srm", "ac", "flak", "flk", "heat", "ht", "if", "indirect fire", "rear", "missile", "msl"];
        let explosive = false;
        for (const each of equipment) {
            if (each.item.explosive) explosive = true;
            if (each.isAmmo || !each.item.alphaStrike) continue;
            const codes = [...getAlphaStrikeEquipmentDisplayAbilityCodes(each.item), ...(each.item.alphaStrike.notes ?? []).filter(isAlphaStrikeAbilityCode)];
            for (const code of codes) if (!written.includes(code.trim().toLowerCase())) add(code.replace(/\s+/g, ""));
        }
        if (["PRB", "LPRB", "BH"].some((code) => specials.includes(code))) add("RCN");
        if (this._industrial) {
            // An IndustrialMech's fire control and engine (ASC pp.117-118, 121, 123).
            add(this.hasAdvancedFireControl() ? "AFC" : "BFC");
            if (this._engineType === "ice") add("EE");
            if (this._engineType === "cell") add("FC");
        }
        if (!explosive) {
            add("ENE");
            for (const code of ["CASE", "CASEII"]) { const index = specials.indexOf(code); if (index >= 0) specials.splice(index, 1); }
        }
        specials.sort();

        // Point Value: the ground procedure (ASC pp.138-141, errata v1.6); WK on the BattleMech lines, IWK on the
        // IndustrialMech's. WLK and AIF cost nothing.
        const pv = calculateGroundPointValue({
            type, size, moves: [{ inches: ground, mode: "" }], jump,
            short: damageValues.short, medium: damageValues.medium, long: damageValues.long,
            overheat, armor, structure, specials,
        });
        log.push(...pv.log);

        return { type, size, move, tmm, armor, structure, overheat, damageValues, specialAbilities: specials, pointValue: pv.pointValue, calcLog: log };
    }

    /** The converted Alpha Strike card, built the same way as a Master Unit List record; a custom source, so NOT OFFICIAL. */
    public getAlphaStrikeUnit(): AlphaStrikeUnit {
        const stats = this.getAlphaStrikeStats();
        const damage = stats.damageValues;
        const className = this._industrial ? "Industrial Walker" : "Walker";
        const record = {
            Id: 0,
            Name: this.getDisplayName(),
            Class: className,
            Variant: "",
            Tonnage: this._tons,
            Cost: this.getCBillCost(),
            BattleValue: this.getBattleValue(),
            BFType: stats.type,
            BFSize: stats.size,
            BFMove: stats.move,
            BFTMM: stats.tmm,
            BFArmor: stats.armor,
            BFStructure: stats.structure,
            BFThreshold: 0,
            BFDamageShort: damage.short.damage,
            BFDamageMedium: damage.medium.damage,
            BFDamageLong: damage.long.damage,
            BFDamageExtreme: 0,
            BFDamageShortMin: damage.short.minimal,
            BFDamageMediumMin: damage.medium.minimal,
            BFDamageLongMin: damage.long.minimal,
            BFDamageExtremeMin: false,
            BFOverheat: stats.overheat,
            BFPointValue: stats.pointValue,
            BFAbilities: stats.specialAbilities.join(","),
            MulSource: "custom",
            Role: { Id: 0, Name: "None", Image: null, SortOrder: 0 },
            Technology: { Id: 0, Name: this._tech === "clan" ? "Clan" : "Inner Sphere", Image: null, SortOrder: 0 },
            Type: { Id: 0, Name: className, Image: null, SortOrder: 0 },
        } as unknown as IASMULUnit;
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        // The unit picture stored in the design (#95); with none, the picture the MUL record gave stays.
        if (this.tro.getImage()) unit.imageURL = this.tro.getImage();
        unit.rulesLevel = this.getRequiredRulesLevel();
        unit.rulesets = this.gameSettings.getRulesets();
        return unit;
    }

    // Save ----------------------------------------------------------------------------------------------------------

    public export(noInPlayVariables: boolean = false): IWalkerExport {
        const armor: Partial<Record<WalkerLocation, number>> = {};
        for (const location of WALKER_LOCATIONS) armor[location] = this._armor[location];
        return {
            format: 1,
            edition: this._edition,
            ...(this._rulesEdition !== DEFAULT_RULES_EDITION ? { rulesEdition: this._rulesEdition } : {}),
            ...this.gameSettings.export(),
            uuid: this._uuid,
            tro: this.tro.export(),
            name: this._name,
            tons: this._tons,
            walkMP: this._walkMP,
            techBase: this._tech,
            engineType: this._engineType,
            gyroType: this._gyroType,
            ...(this._industrial ? { industrial: true } : {}),
            ...(this._advancedFireControl ? { advancedFireControl: true } : {}),
            ...(this._turret ? { turret: true } : {}),
            ...(this._largeCockpit ? { largeCockpit: true } : {}),
            ...(this._extraSensors ? { extraSensors: true } : {}),
            ...(this._extraLifeSupport ? { extraLifeSupport: true } : {}),
            armor,
            ...(this._mounts.length > 0 ? {
                equipment: this._mounts.map((mount) => ({
                    tag: mount.tag, location: mount.location,
                    ...(mount.inTurret ? { inTurret: true } : {}),
                    ...(mount.size !== undefined ? { size: mount.size } : {}),
                    ...(mount.split ? { split: { ...mount.split } } : {}),
                })),
            } : {}),
            heatSinks: this.getHeatSinks(),
            heatSinkType: this._heatSinkType,
            ...(this._jumpJets > 0 ? { jumpJets: this._jumpJets, jumpJetType: this._jumpJetType } : {}),
            era: this._era.tag,
            ...(this._gunnery !== 4 ? { gunnery: this._gunnery } : {}),
            ...(this._piloting !== 5 ? { piloting: this._piloting } : {}),
            ...(!noInPlayVariables && this.hasInPlayState() ? { inPlay: this.getInPlay() } : {}),
            ...(!noInPlayVariables && Object.keys(this.ewarPlay).length ? { ewarPlay: JSON.parse(JSON.stringify(this.ewarPlay)) as IEWarPlayState } : {}),
            lastUpdated: this.lastUpdated.toISOString(),
        };
    }

    /** Reads saved play state, keeping only what fits this walker: points within each location, slots that exist. */
    private _importInPlay(raw: unknown): void {
        this._inPlay = {};
        if (!raw || typeof raw !== "object") return;
        const data = raw as IWalkerInPlay;
        for (const location of WALKER_LOCATIONS) {
            const armor = data.armor?.[location];
            if (armor !== undefined) this.setArmorDamage(location, armor);
            const structure = data.structure?.[location];
            if (structure !== undefined) this.setStructureDamage(location, structure);
            const slots = data.slots?.[location];
            if (Array.isArray(slots)) {
                const count = this.getSlots(location).length;
                for (const slot of slots.slice(0, 40)) {
                    if (Number.isInteger(slot) && slot >= 0 && slot < count && this.getSlots(location)[slot] !== null) this._markSlot(location, slot, true);
                }
            }
        }
        if (data.pilotHits !== undefined) this.setPilotHits(data.pilotHits);
        if (Array.isArray(data.shotsFired)) data.shotsFired.slice(0, 200).forEach((shots, index) => this.setShotsFired(index, shots));
    }
    public exportJSON(): string { return JSON.stringify(this.export()); }

    /** Reads a save. Each value out of range is clamped with an issue (getImportIssues); nothing is dropped silently. */
    public import(data: IWalkerExport): boolean {
        if (!data || typeof data !== "object" || typeof data.tons !== "number") return false;
        const issues: string[] = [];
        this._uuid = typeof data.uuid === "string" && data.uuid ? data.uuid.slice(0, 64) : generateUUID();
        this.tro.import(data.tro);
        this.setName(typeof data.name === "string" ? data.name : "");
        if (data.edition === undefined) this._edition = WALKER_DEFAULT_EDITION;
        else if (isWalkerEdition(data.edition)) this._edition = data.edition;
        else {
            this._edition = WALKER_DEFAULT_EDITION;
            issues.push(`Unknown edition "${String(data.edition).slice(0, 40)}": read as ${WALKER_EDITION_RULES[WALKER_DEFAULT_EDITION].name}.`);
        }
        this._rulesEdition = getSelectableRulesEditionTag(data.rulesEdition, "walker");
        this.gameSettings.import(data);
        this._tech = data.techBase === "clan" ? "clan" : "is";
        this._industrial = data.industrial === true;
        this._advancedFireControl = data.advancedFireControl === true;

        const tons = Math.min(WALKER_MAX_TONS, Math.max(WALKER_MIN_TONS, Math.round(Number(data.tons) / WALKER_TON_STEP) * WALKER_TON_STEP || WALKER_MIN_TONS));
        if (tons !== data.tons) issues.push(`Tonnage ${String(data.tons)} is out of range: set to ${tons}.`);
        this._tons = tons;
        const walk = clampInt(data.walkMP, 1, this.getMaxWalkMP(), 1);
        if (walk !== data.walkMP) issues.push(`Walking MP ${String(data.walkMP)} is out of range: set to ${walk}.`);
        this._walkMP = walk;

        // A saved engine the tech base lacks is kept (getIssues reports it); one the walker never offers is not.
        if (isEngineType(data.engineType)) this._engineType = data.engineType;
        else {
            this._engineType = "standard";
            issues.push(`Unknown engine "${String(data.engineType).slice(0, 40)}": read as standard fusion.`);
        }
        // As the engine: a known gyro the chassis or tech base does not allow is kept and reported by getIssues.
        if (isGyroType(data.gyroType)) this._gyroType = data.gyroType;
        else {
            this._gyroType = "standard";
            issues.push(`Unknown gyro "${String(data.gyroType).slice(0, 40)}": read as standard.`);
        }
        this._turret = data.turret === true;
        this._largeCockpit = data.largeCockpit === true;
        this._extraSensors = data.extraSensors === true;
        this._extraLifeSupport = data.extraLifeSupport === true;

        this._armor = emptyArmor();
        for (const location of WALKER_LOCATIONS) {
            const saved = data.armor?.[location];
            if (saved === undefined) continue;
            const points = clampInt(saved, 0, this.getMaxArmor(location), 0);
            if (points !== saved) issues.push(`${this.getLocationName(location)} armor ${String(saved)} is out of range: set to ${points}.`);
            this._armor[location] = points;
        }
        this._era = this.getAvailableEras().find((era) => era.tag === data.era) ?? this._era;

        // Equipment (Chunk B). An unknown item or location is dropped with an issue; a known item in a place the rules
        // do not allow is kept, and getIssues reports it.
        this._mounts = [];
        for (const raw of Array.isArray(data.equipment) ? data.equipment.slice(0, 200) : []) {
            if (!raw || typeof raw !== "object") continue;
            const tag = typeof raw.tag === "string" ? raw.tag : "";
            const record = tag ? this._findRecord(tag) : undefined;
            if (!record) {
                issues.push(`Unknown equipment "${tag.slice(0, 60)}": dropped.`);
                continue;
            }
            if (!isWalkerLocation(raw.location)) {
                issues.push(`Unknown location "${String(raw.location).slice(0, 20)}" for ${record.name}: dropped.`);
                continue;
            }
            const size = typeof raw.size === "number" && Number.isFinite(raw.size) && raw.size > 0 ? raw.size : undefined;
            // A split into a location next to this one, with at least one slot there; anything else is dropped with an
            // issue and the item is read whole (getIssues then reports a location over its slots).
            let split: IWalkerSplit | undefined;
            if (raw.split !== undefined) {
                const into = raw.split?.location;
                const slots = raw.split?.slots;
                if (isWalkerLocation(into) && WALKER_ADJACENT_LOCATIONS[raw.location].includes(into) && Number.isInteger(slots) && slots >= 1 && raw.inTurret !== true) {
                    split = { location: into, slots };
                } else {
                    issues.push(`${record.name}: the saved split into "${String(into).slice(0, 20)}" is not allowed; read as one piece in the ${this.getLocationName(raw.location)}.`);
                }
            }
            this._mounts.push({
                uuid: generateUUID(), tag: record.tag, location: raw.location, inTurret: raw.inTurret === true,
                ...(size !== undefined ? { size } : {}), ...(split ? { split } : {}),
            });
        }
        this._heatSinkType = (WALKER_HEAT_SINK_TYPES as readonly unknown[]).includes(data.heatSinkType) ? data.heatSinkType! : "single";
        if (data.heatSinkType !== undefined && data.heatSinkType !== this._heatSinkType) issues.push(`Unknown heat sink type "${String(data.heatSinkType).slice(0, 30)}": read as single.`);
        const sinks = data.heatSinks === undefined ? this.getFreeHeatSinks() : clampInt(data.heatSinks, this.getFreeHeatSinks(), this.getFreeHeatSinks() + 100, this.getFreeHeatSinks());
        if (data.heatSinks !== undefined && sinks !== data.heatSinks) issues.push(`Heat sinks ${String(data.heatSinks)} is out of range: set to ${sinks}.`);
        this._extraHeatSinks = sinks - this.getFreeHeatSinks();
        this._jumpJetType = (WALKER_JUMP_JET_TYPES as readonly unknown[]).includes(data.jumpJetType) ? data.jumpJetType! : "standard";
        if (data.jumpJetType !== undefined && data.jumpJetType !== this._jumpJetType) issues.push(`Unknown jump jet type "${String(data.jumpJetType).slice(0, 30)}": read as standard.`);
        // Kept above the limit (getIssues reports it) so a design is never cut silently; only junk is clamped.
        const jets = data.jumpJets === undefined ? 0 : clampInt(data.jumpJets, 0, 20, 0);
        if (data.jumpJets !== undefined && jets !== data.jumpJets) issues.push(`Jump jets ${String(data.jumpJets)} is out of range: set to ${jets}.`);
        this._jumpJets = jets;
        this._gunnery = clampInt(data.gunnery, 0, 8, 4);
        this._piloting = clampInt(data.piloting, 0, 8, 5);
        this._importInPlay(data.inPlay);
        this.ewarPlay = normalizeEWarPlay(data.ewarPlay);
        const saved = typeof data.lastUpdated === "string" ? new Date(data.lastUpdated) : new Date();
        this.lastUpdated = Number.isNaN(saved.getTime()) ? new Date() : saved;
        this._importIssues = issues;
        return true;
    }

    public importJSON(json: string): boolean {
        try {
            return this.import(JSON.parse(json));
        } catch {
            this._importIssues = ["The saved Walker could not be read."];
            return false;
        }
    }
}
