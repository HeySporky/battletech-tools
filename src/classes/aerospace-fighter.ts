import { generateUUID } from "../utils/generateUUID";
import { aerospaceArmorTypes, getAerospaceArmorPointsPerTon } from "../data/aerospace-armor-types";
import { mechEngineOptions } from "../data/mech-engine-options";
import { mechEngineTypes } from "../data/mech-engine-types";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { btTechOptions } from "../data/tech-options";
import { btEraOptions, findEraByTag, getClosestEraForTech, getErasForTech } from "../data/era-options";
import { CUSTOM_HOMEBREW_RULES_LEVEL, getEffectiveIntroduction, getEquipmentListByTech, isEquipmentWithinRulesLevel } from "../data/equipment-registry";
import { findByTag } from "../data/tag-match";
import { IAerospaceArmorType, IEngineType, IEquipmentItem, IEras, IHeatSync, ITechDates, ITechOptions } from "../data/data-interfaces";

// Aerospace Fighter construction (TechManual pp.180-197). Shares the engine, heat sink and equipment catalogs
// with BattleMechs and Combat Vehicles; armor comes from the aerospace armor catalog.

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
/** The Master Engine Table ends at 400 (TM p.49). */
export const FIGHTER_MAX_ENGINE_RATING = 400;
/** Cockpit and controls: 3 tons (Aerospace Control Systems Table, TM p.189). */
export const FIGHTER_COCKPIT_TONS = 3;
/** Fuel points per ton (Aerospace Fuel Table, TM p.188). */
export const FIGHTER_FUEL_POINTS_PER_TON = 80;
/** Heat sinks that come free with the engine (Aerospace Unit Heat Sinks Table, TM p.194). */
export const FIGHTER_FREE_HEAT_SINKS = 10;
/** "For fighters, this limit is set at 5 weapons per arc (less if the unit uses non-standard armor)" (TM p.196). */
export const FIGHTER_WEAPONS_PER_ARC = 5;
/** Maximum armor: tonnage x 8 points (Aerospace Unit Maximum Armor Levels Table, TM p.191). */
export const FIGHTER_ARMOR_POINTS_PER_TON_OF_FIGHTER = 8;
export const MAX_FIGHTER_EQUIPMENT = 200;

/** Fusion engines an aerospace fighter may use, by tech base (Aerospace Unit Engine Table, TM p.186). */
const ENGINE_TAGS: Record<"is" | "clan", string[]> = {
    is: ["standard", "light", "xl", "compact"],
    clan: ["standard", "clan_xl"],
};

export interface IFighterEquipmentExport {
    tag: string;
    location?: string;
    uuid?: string;
}

export interface IAerospaceFighterExport {
    uuid: string;
    lastUpdated: Date;
    name: string;
    model: string;
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

    public getTonnage(): number { return this._tonnage; }

    /** 5 to 100 tons in 5-ton increments (TM p.184). Thrust and armor are pulled back inside the new limits. */
    public setTonnage(tonnage: number): number {
        const stepped = Math.round((Number.isFinite(tonnage) ? tonnage : this._tonnage) / 5) * 5;
        this._tonnage = Math.min(FIGHTER_MAX_TONNAGE, Math.max(FIGHTER_MIN_TONNAGE, stepped));
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

    /** Engine rating = tonnage x (Safe Thrust - 2) (TM p.186). */
    public getEngineRating(): number { return this._tonnage * (this._safeThrust - 2); }

    /** The lowest Safe Thrust whose engine is on the Master Engine Table, which starts at a rating of 10. */
    public getMinSafeThrust(): number { return Math.ceil(10 / this._tonnage) + 2; }

    /** The highest Safe Thrust whose engine is on the Master Engine Table, which ends at a rating of 400. */
    public getMaxSafeThrust(): number { return Math.floor(FIGHTER_MAX_ENGINE_RATING / this._tonnage) + 2; }

    public setSafeThrust(safeThrust: number): number {
        const value = Number.isFinite(safeThrust) ? Math.floor(safeThrust) : this._safeThrust;
        this._safeThrust = Math.min(this.getMaxSafeThrust(), Math.max(this.getMinSafeThrust(), value));
        this._calc();
        return this._safeThrust;
    }

    /** From the Master Engine Table (TM p.49); a fighter's fusion engine needs no extra shielding. */
    public getEngineWeight(): number {
        const rating = this.getEngineRating();
        const option = mechEngineOptions.find((entry) => entry.rating >= rating) ?? mechEngineOptions[mechEngineOptions.length - 1];
        const tag = this._engineType.tag as keyof typeof option.weight;
        return option.weight[tag] ?? option.weight.standard;
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

    /** 80 fuel points per ton (TM p.188). */
    public getFuelPoints(): number { return Math.floor(this._fuelTons * FIGHTER_FUEL_POINTS_PER_TON); }

    // Armor ---------------------------------------------------------------------------------------------------

    public getArmorType(): IAerospaceArmorType { return this._armorType; }

    /** Armor a fighter of this tech base can mount (TM pp.191-192). */
    public getAvailableArmorTypes(rulesLevel: number = 2): (IAerospaceArmorType & { available: boolean })[] {
        const techBase = this.getChassisTechBase();
        return aerospaceArmorTypes
            .filter((armor) => armor.fighterSlots !== null && armor.fighterSlots[techBase] !== null
                && getAerospaceArmorPointsPerTon(armor.tag, "aerospace-fighter", techBase) !== null)
            .map((armor) => ({ ...armor, available: this._datesAvailability(armorDates(armor), rulesLevel).available }));
    }

    public setArmorType(tag: string): IAerospaceArmorType {
        const armor = this.getAvailableArmorTypes().find((entry) => entry.tag === tag);
        if (armor) this._armorType = aerospaceArmorTypes.find((entry) => entry.tag === armor.tag) ?? this._armorType;
        this._calc();
        return this._armorType;
    }

    public getArmorPointsPerTon(): number | null {
        return getAerospaceArmorPointsPerTon(this._armorType.tag, "aerospace-fighter", this.getChassisTechBase());
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

    /** Tonnage x 8 points (TM p.191). */
    public getMaxArmorPoints(): number { return this._tonnage * FIGHTER_ARMOR_POINTS_PER_TON_OF_FIGHTER; }

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
        this._additionalHeatSinks = Math.min(200, Math.max(0, Number.isFinite(count) ? Math.floor(count) : 0));
        this._calc();
        return this._additionalHeatSinks;
    }

    /** Ten come free with the engine; each one beyond that weighs a ton (TM pp.193-194). */
    public getTotalHeatSinks(): number { return FIGHTER_FREE_HEAT_SINKS + this._additionalHeatSinks; }

    public getHeatDissipation(): number { return this.getTotalHeatSinks() * (this._heatSinkType.dissipation ?? 1); }

    /** Heat of every weapon fired together: a fighter builds heat for energy and non-energy weapons alike (TM p.195). */
    public getWeaponHeat(): number {
        return this._equipmentList.filter((item) => !item.isAmmo).reduce((sum, item) => sum + (item.heatAero ?? item.heat ?? 0), 0);
    }

    // Equipment -----------------------------------------------------------------------------------------------

    /** External stores hardpoints: tonnage divided by 5, rounded down (TM p.196). */
    public getExternalStoresHardpoints(): number { return Math.floor(this._tonnage / 5); }

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
        if (this.getTotalArmorPoints() > this.getMaxArmorPoints()) issues.push(`Armor exceeds the maximum of ${this.getMaxArmorPoints()} points (tonnage x 8, TM p.191).`);
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
            if (!this.isEquipmentAllowed(item)) issues.push(`${item.name} cannot be mounted on an aerospace fighter.`);
        }
        if (this._fuelTons <= 0) issues.push("The fighter carries no fuel.");
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
            { name: "Cockpit and Controls", weight: FIGHTER_COCKPIT_TONS },
            { name: `Fuel (${this.getFuelPoints()} points)`, weight: this._fuelTons },
            { name: `Armor (${this._armorType.name}, ${this.getTotalArmorPoints()} points)`, weight: this.getArmorWeight() },
            { name: `Heat Sinks (${this.getTotalHeatSinks()} ${this._heatSinkType.name}, 10 free)`, weight: this._additionalHeatSinks },
            ...this._equipmentList.map((item) => ({ name: item.name, weight: item.weight || 0 })),
        ];
        this._currentTonnage = Math.round(this._weights.reduce((sum, entry) => sum + entry.weight, 0) * 1000) / 1000;
    }

    // Saving --------------------------------------------------------------------------------------------------

    public export(): IAerospaceFighterExport {
        return {
            uuid: this._uuid,
            lastUpdated: this.lastUpdated,
            name: this._name,
            model: this._model,
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
            equipment: this._equipmentList.map((item) => ({ tag: item.tag, location: item.location, uuid: item.uuid })),
        };
    }

    public exportJSON(): string {
        return JSON.stringify(this.export());
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
                this._equipmentList.push(this._newEquipment(catalogItem, entry.location, entry.uuid));
            }
            this._calc();
        } catch (error) {
            issue("The saved fighter could not be read completely");
            console.error("AerospaceFighter importJSON failed:", error);
        }
    }
}
