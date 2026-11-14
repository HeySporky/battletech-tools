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
import { matchesTag } from "../data/tag-match";
import { VariableEquipmentFormula, getTargetingComputerWeaponWeight, sizeVariableEquipment } from "../data/variable-equipment";
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
// and cockpit data. Custom Homebrew. Chunks A (construction core) and B (equipment, turret, heat sinks, jump jets,
// ammunition) of docs/superpowers/plans/2026-11-13-future-wars-walkers.md.

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
    private _sized(item: IEquipmentItem, mount: Pick<IWalkerMount, "size">, weaponWeight: number): { weight: number; slots: number } {
        const formula = item.variableFormula as VariableEquipmentFormula | undefined;
        if (formula) {
            const size = sizeVariableEquipment(formula, {
                tonnage: this._tons, engineRating: this.getEngineRating(), engineWeight: this.getEngineWeight(),
                directFireWeaponWeight: weaponWeight, isQuad: true, size: mount.size ?? item.size,
            });
            if (size) return { weight: size.weight, slots: size.slots };
        }
        return { weight: item.weight || 0, slots: Math.max(0, item.space.battlemech) };
    }

    private _resolveMounts(mounts: readonly IWalkerMount[] = this._mounts): IWalkerEquipment[] {
        const records = mounts.map((mount) => ({ mount, item: this._findRecord(mount.tag) }))
            .filter((each): each is { mount: IWalkerMount; item: IEquipmentItem } => !!each.item);
        const weaponWeight = getTargetingComputerWeaponWeight(records.map((each) => each.item));
        return records.map(({ mount, item }) => {
            const { weight, slots } = this._sized(item, mount, weaponWeight);
            return {
                uuid: mount.uuid, tag: mount.tag, name: item.name, location: mount.location, inTurret: mount.inTurret,
                weight, slots, heat: item.heat || 0, isAmmo: !!item.isAmmo,
                antiInfantryOnly: mount.location === "ct" && isWalkerAntiInfantryWeapon(item),
                item: { ...item, weight, criticals: slots },
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

    /**
     * Mounts a 'Mech catalog item. Refused, with the reason, when the walker cannot take it, the place breaks a rule, the
     * walker would be over its tonnage or the location has no room (an item is never split between locations: ours).
     * The era and rules level are the offer's business (getEquipmentOffer), as on a 'Mech.
     */
    public addEquipment(tag: string, location: WalkerLocation, inTurret: boolean = false, size?: number): IWalkerAddResult {
        const item = this._findRecord(tag);
        if (!item) return { added: false, reason: `Unknown equipment "${String(tag).slice(0, 60)}".` };
        if (!isWalkerLocation(location)) return { added: false, reason: `Unknown location "${String(location).slice(0, 20)}".` };
        const refusal = this.getChassisRefusal(item) ?? this._placementRefusal(item, location, !!inTurret, this._mounts);
        if (refusal) return { added: false, reason: refusal };
        const mount: IWalkerMount = { uuid: generateUUID(), tag: item.tag, location, inTurret: !!inTurret, ...(size !== undefined ? { size } : {}) };
        const sized = this._resolveMounts([...this._mounts, mount]).find((each) => each.uuid === mount.uuid)!;
        const left = this._tons - this.getWeight();
        if (sized.weight > left + 1e-9) return { added: false, reason: `${item.name} weighs ${sized.weight} tons; the walker has ${Math.max(0, left)} left.` };
        const trial = this._layout(false, mount).slots[location];
        if (Walker._usedLength(trial) > this.getSlotCount(location)) {
            return { added: false, reason: `${item.name} needs ${sized.slots} slots together and the ${this.getLocationName(location)} has no room for them.` };
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
        for (const location of WALKER_LOCATIONS) {
            const list: (string | null)[] = [...this._fixedItems(location)];
            for (const each of equipment) if (each.location === location && !each.inTurret) Walker._place(list, each.name, each.slots);
            slots[location] = list;
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
            const problem = this.getChassisRefusal(each.item) ?? this._placementRefusal(each.item, each.location, each.inTurret, others);
            if (problem) issues.push(problem);
        }
        const weapons = equipment.filter((each) => !each.isAmmo).map((each) => each.item);
        for (const ammo of equipment.filter((each) => each.isAmmo)) {
            if (!weapons.some((weapon) => getCompatibleAmmo(weapon, ammo.item))) issues.push(`${ammo.name} has no weapon to feed.`);
        }
        return issues;
    }
    public isLegal(): boolean { return this.getIssues().length === 0; }

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
            this._mounts.push({ uuid: generateUUID(), tag: record.tag, location: raw.location, inTurret: raw.inTurret === true, ...(size !== undefined ? { size } : {}) });
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
