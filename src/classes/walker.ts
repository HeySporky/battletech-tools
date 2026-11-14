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
import { findSpecialRuleset } from "../data/special-rulesets";
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
    WALKER_ENGINE_TYPES,
    WALKER_GYRO_TYPES,
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
// and cockpit data. Custom Homebrew. Chunk A of docs/superpowers/plans/2026-11-13-future-wars-walkers.md: the
// construction core, no equipment yet.

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
    turret?: boolean;
    /** A heavy walker's 4-ton cockpit under the variant. */
    largeCockpit?: boolean;
    extraSensors?: boolean;
    extraLifeSupport?: boolean;
    armor: Partial<Record<WalkerLocation, number>>;
    era: string;
    lastUpdated?: string;
}

export interface IWalkerWeightLine {
    name: string;
    weight: number;
}

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
    private _turret: boolean = false;
    private _largeCockpit: boolean = false;
    private _extraSensors: boolean = false;
    private _extraLifeSupport: boolean = false;
    private _armor: Record<WalkerLocation, number> = emptyArmor();
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
    public getCredit(): string { return getWalkerCredit(this._edition); }

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
    /** Engine types with slot data for the tech base; an Inner Sphere walker takes no Clan engine and the reverse. */
    public getEngineTypeOptions(): WalkerEngineType[] {
        return WALKER_ENGINE_TYPES.filter((tag) => {
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
    public getCockpitWeight(): number { return this._variantCockpit()?.tons ?? STANDARD_COCKPIT_TONS; }
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

    // Structure and armor -----------------------------------------------------------------------------------------

    public getStructure(location: WalkerLocation): number { return getWalkerStructure(location, this._tons); }
    public getTotalStructure(): number { return WALKER_LOCATIONS.reduce((sum, location) => sum + this.getStructure(location), 0); }
    /** "Tons Required" is 10 percent of the walker's weight (Best-of p.37). */
    public getStructureWeight(): number { return this._tons / 10; }

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
            const turret: string[] = this._turret ? Array(getWalkerTurret(this._tons, this.usesVariantSlots()).slots).fill("Turret") : [];
            const cockpit = this._variantCockpit();
            if (!cockpit) return ["Life Support", "Sensors", "Cockpit", null, "Sensors", "Life Support", ...turret];
            // Flint's head order, as the Compact 'Mech's (ours): life support, sensors, cockpit, then the turret.
            const lifeSupport = cockpit.lifeSupportSlots + (this.hasExtraLifeSupport() ? 1 : 0);
            const sensors = FUTURE_WARS_SENSOR_SLOTS + (this.hasExtraSensors() ? 1 : 0);
            return [
                ...Array(lifeSupport).fill("Life Support"), ...Array(sensors).fill("Sensors"), ...Array(cockpit.slots).fill("Cockpit"), ...turret,
            ];
        }
        return [];
    }

    /** The location's slots, each an item name or null for a free slot. Items past the last slot are cut (getIssues says so). */
    public getSlots(location: WalkerLocation): (string | null)[] {
        const items = this._fixedItems(location);
        const count = this.getSlotCount(location);
        return Array.from({ length: count }, (_, index) => items[index] ?? null);
    }
    public getFreeSlots(location: WalkerLocation): number { return this.getSlots(location).filter((slot) => slot === null).length; }
    private _usedSlotCount(location: WalkerLocation): number {
        const items = this._fixedItems(location);
        let last = items.length;
        while (last > 0 && items[last - 1] === null) last--;
        return last;
    }

    // Weight, issues ------------------------------------------------------------------------------------------------

    public getWeightLog(): IWalkerWeightLine[] {
        const lines: IWalkerWeightLine[] = [
            { name: "Internal Structure", weight: this.getStructureWeight() },
            { name: "Engine", weight: this.getEngineWeight() },
            { name: "Gyro", weight: this.getGyroWeight() },
            { name: "Cockpit", weight: this.getCockpitWeight() },
        ];
        if (this.hasExtraSensors()) lines.push({ name: "Extra Sensors", weight: FUTURE_WARS_EXTRA_SLOT_TONS });
        if (this.hasExtraLifeSupport()) lines.push({ name: "Extra Life Support", weight: FUTURE_WARS_EXTRA_SLOT_TONS });
        if (this._turret) lines.push({ name: "Turret", weight: this.getTurretWeight() });
        if (this.getArmorPoints() > 0) lines.push({ name: "Armor", weight: this.getArmorWeight() });
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
            issues.push(`The ${this.getEngineName()} is not available to ${this._tech === "clan" ? "a Clan" : "an Inner Sphere"} walker.`);
        }
        if (this.getEngineRating() > WALKER_MAX_ENGINE_RATING) issues.push(`Engine rating ${this.getEngineRating()} is over ${WALKER_MAX_ENGINE_RATING}.`);
        for (const location of WALKER_LOCATIONS) {
            if (this._armor[location] > this.getMaxArmor(location)) {
                issues.push(`${this.getLocationName(location)} armor ${this._armor[location]} is over its maximum of ${this.getMaxArmor(location)}.`);
            }
            const used = this._usedSlotCount(location);
            if (used > this.getSlotCount(location)) {
                issues.push(`${this.getLocationName(location)} needs ${used} slots for its fixed items and has ${this.getSlotCount(location)}.`);
            }
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
            ...(this._turret ? { turret: true } : {}),
            ...(this._largeCockpit ? { largeCockpit: true } : {}),
            ...(this._extraSensors ? { extraSensors: true } : {}),
            ...(this._extraLifeSupport ? { extraLifeSupport: true } : {}),
            armor,
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
        if (isGyroType(data.gyroType) && this.getGyroTypeOptions().includes(data.gyroType)) this._gyroType = data.gyroType;
        else {
            this._gyroType = "standard";
            issues.push(`Gyro "${String(data.gyroType).slice(0, 40)}" is not offered: read as standard.`);
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
