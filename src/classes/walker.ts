import { generateUUID } from "../utils/generateUUID";
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
import { matchesTag } from "../data/tag-match";
import { VariableEquipmentFormula, getTargetingComputerWeaponWeight, isTargetingComputerWeapon, sizeVariableEquipment } from "../data/variable-equipment";
import { CalcTrace, ICalcBreakdown, formatCalcNumber } from "../data/calc-steps";
import { NO_BATTLE_VALUE_STEPS } from "../data/calc-steps-mech-bv1";
import { WALKER_BV2_STEPS, WALKER_COST_STEPS, getWalkerBv1Steps } from "../data/calc-steps-walker";
import {
    editionHasBattleValue,
    getBattleValue1Ammo,
    getBattleValueEdition,
    getBattleValueFor,
    getBattleValueRules,
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
    getWalkerSlotCount,
    getWalkerStructure,
    getWalkerTurret,
    isWalkerEdition,
} from "../data/walker-construction";

// A Walker (#172): Clell Flint's four-legged 'Mech from Future Wars, a unit type of its own (owner ruling 2,
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
    /** An industrial walker (ours); absent means a BattleMech walker. */
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
    lastUpdated?: string;
}

/** One mounted 'Mech catalog item: its tag, its location and whether it is in the turret. */
export interface IWalkerMountExport {
    tag: string;
    location: WalkerLocation;
    inTurret?: boolean;
    /** The chosen size of a sized item (a cargo bay's tons, a modular C3's links). */
    size?: number;
    /** An item split into one adjacent location: that location and the slots it takes there (owner ruling 2026-11-14). */
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
    /** Flint wrote for the 3025 rules: the late Succession Wars (ours). */
    private _era: IEras = findEraByTag("late-sw-lt") ?? btEraOptions[btEraOptions.length - 1];
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

    /** The printing of Flint's rules (owner ruling 3). */
    public getEdition(): WalkerEdition { return this._edition; }
    public getEditionRules(): IWalkerEditionRules { return WALKER_EDITION_RULES[this._edition]; }
    public setEdition(edition: WalkerEdition): void { if (isWalkerEdition(edition)) this._edition = edition; }
    public getCredit(): string { return getWalkerCredit(this._edition, this._industrial); }

    /**
     * An industrial walker (owner ruling 2026-11-14; ours, inspired by Flint and the IndustrialMech rules). Switching
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
    /** Under the variant Flint's cockpit weight applies to an industrial walker too (ours, as on a Compact IndustrialMech). */
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

    /** Weight and slots of an item on this walker: sized items by their formula with the walker's figures (ours). */
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
     * Why a 'Mech item cannot go on this walker at all, or null (owner ruling 4: "any equipment that makes sense"). Arm
     * items, items of another 'Mech type, items spread over 'Mech locations and variable items outside
     * WALKER_VARIABLE_FORMULAS are ours to refuse; the IndustrialMech limits are TM pp.69-70.
     */
    public getChassisRefusal(item: IEquipmentItem): string | null {
        const name = item.name;
        if (item.space.battlemech < 0 || item.bombBaySlots) return `${name} cannot be mounted on a 'Mech.`;
        if (needsArm(item)) return `${name} needs an arm, and a walker has none.`;
        if ((item.chassisTypes?.length ?? 0) > 0 || item.tag === "mech-turret-head") return `${name} is built for another kind of 'Mech.`;
        if (item.spreadLocations || item.spreadSlots) return `${name} spreads over a 'Mech's locations; a walker does not take it (ours).`;
        if ((item.variableFormula && !WALKER_VARIABLE_FORMULAS.includes(item.variableFormula)) || (item.variableSize && !item.variableFormula)) {
            return `${name} is not offered on a walker (ours).`;
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
            if (!WALKER_LEGS.includes(location) && !WALKER_OUTER_TORSOS.includes(location)) return `${name} goes in the legs or outer torsos (ours: a walker has no arms).`;
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
     * splits the rest into one adjacent location with room (owner ruling 2026-11-14), `options.splitInto` or the first in
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

    // Jump jets (ours: in the legs and outer torsos, by the 'Mech rule) ---------------------------------------------

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
    /** Jump MP is at most the biped Walking MP, the Running MP with improved jets (ours: the x 1.25 is the legs, not the engine). */
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
    /** "Tons Required" is 10 percent of the walker's weight (Best-of p.37); industrial structure twice that (ours, TechManual p.66). */
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
            // Standard: three engine slots, the gyro, the rest of the engine (as a 'Mech). Variant: half the engine first (ours, as the Compact 'Mech).
            const first = variant ? Math.ceil(ctSlots / 2) : Math.min(3, ctSlots);
            const gyro: string[] = Array(this._gyroSlots()).fill(this.getGyroName());
            return [...Array(first).fill(engine), ...gyro, ...Array(ctSlots - first).fill(engine)];
        }
        if (location === "lt" || location === "rt") return Array(engineSlots[location] ?? 0).fill(engine);
        if (location === "cs") {
            const cockpit = this._variantCockpit();
            if (!cockpit) return ["Life Support", "Sensors", "Cockpit", null, "Sensors", "Life Support"];
            // Flint's head order, as the Compact 'Mech's (ours): life support, sensors, cockpit; the turret follows (_layout).
            const lifeSupport = cockpit.lifeSupportSlots + (this.hasExtraLifeSupport() ? 1 : 0);
            const sensors = FUTURE_WARS_SENSOR_SLOTS + (this.hasExtraSensors() ? 1 : 0);
            return [...Array(lifeSupport).fill("Life Support"), ...Array(sensors).fill("Sensors"), ...Array(cockpit.slots).fill("Cockpit")];
        }
        return [];
    }
    private _turretSlots(): string[] {
        return this._turret ? Array(getWalkerTurret(this._tons, this.usesVariantSlots()).slots).fill("Turret") : [];
    }

    /** Puts an item of `size` slots in the first run of free slots long enough, else after the last. */
    private static _place(slots: (string | null)[], name: string, size: number): void {
        for (let start = 0; start + size <= slots.length; start++) {
            if (slots.slice(start, start + size).every((slot) => slot === null)) {
                for (let index = start; index < start + size; index++) slots[index] = name;
                return;
            }
        }
        let end = slots.length;
        while (end > 0 && slots[end - 1] === null) end--;
        slots.length = end;
        for (let index = 0; index < size; index++) slots.push(name);
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
     * placed where there is room (ours); what finds no room is counted in `unplaced`.
     */
    private _layout(auto: boolean = true, extra?: IWalkerMount): { slots: Record<WalkerLocation, (string | null)[]>; unplacedJets: number; unplacedSinks: number } {
        const slots = {} as Record<WalkerLocation, (string | null)[]>;
        const mounts = extra ? [...this._mounts, extra] : this._mounts;
        const equipment = this._resolveMounts(mounts);
        for (const location of WALKER_LOCATIONS) slots[location] = [...this._fixedItems(location)];
        for (const each of equipment) {
            if (each.inTurret) continue;
            const rest = each.split ? Math.min(each.split.slots, each.slots) : 0;
            Walker._place(slots[each.location], each.name, each.slots - rest);
            if (each.split && rest > 0) Walker._place(slots[each.split.location], each.name, rest);
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
                        Walker._place(slots[location], this._jumpJetType === "improved" ? "Improved Jump Jet" : "Jump Jet", jet.criticals);
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
                    Walker._place(slots[location], sinkName, sinkSlots);
                    sinks--;
                }
            }
            unplacedSinks = sinks;
        }
        const cs = slots.cs;
        if (this._turret || turretItems.length > 0) {
            cs.length = Walker._usedLength(cs);
            cs.push(...this._turretSlots());
            for (const each of turretItems) for (let index = 0; index < each.slots; index++) cs.push(each.name);
        }
        return { slots, unplacedJets, unplacedSinks };
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
     * over a walker (ours), every step provisional (calc-steps-walker.ts says how each row reads a walker). Four legs'
     * actuators; the turret mechanism at 7,500 C-bills a ton (owner ruling); an industrial walker as an
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
            // Owner ruling 2026-11-14: 7,500 C-bills a ton, midway between the 'Mech turret (10,000) and the vehicle's (5,000).
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

    // Save ----------------------------------------------------------------------------------------------------------

    public export(): IWalkerExport {
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
            lastUpdated: this.lastUpdated.toISOString(),
        };
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
