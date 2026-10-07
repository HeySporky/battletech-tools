import { generateUUID } from "../utils/generateUUID";
import {
    BUILDING_ARMOR_COST_PER_TON, BUILDING_ARMOR_POINTS_PER_TON, BUILDING_CLASSIFICATIONS, BUILDING_GENERATORS, BUILDING_MAX_UNLIMITED_HEXES,
    BUILDING_UNSPECIFIED_EQUIPMENT_COST_PER_CF, findBuildingClassification, findBuildingGenerator, HANGAR_CAPACITY_PER_FOUR_LEVELS,
    IBuildingClassification, IBuildingGenerator, IBuildingType,
} from "../data/building-classifications";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { btTechOptions } from "../data/tech-options";
import { btEraOptions, findEraByTag, getClosestEraForTech, getErasForTech } from "../data/era-options";
import { CUSTOM_HOMEBREW_RULES_LEVEL, equipmentMatchesIdentifier, getCompatibleAmmo, getEffectiveIntroduction, getEquipmentListByTech, getEquipmentRulesLevel, getWeaponShotsPerTon, isEquipmentWithinRulesLevel } from "../data/equipment-registry";
import { findByTag, matchesTag } from "../data/tag-match";
import { getWeaponExplosionDamage } from "../data/weapon-explosions";
import { IEquipmentItem, IEras, IHeatSync, ITechDates, ITechOptions } from "../data/data-interfaces";

/**
 * A gun emplacement or other advanced building, built under Tactical Operations: Advanced Rules pp.126-131,
 * with the classifications of pp.112-115, the Mobile Structure mounting rules those pages refer to
 * (TO:AUE pp.82-83) and the costs of TO:AR p.208. In play it tracks each hex's Armor Factor and Construction
 * Factor with scaled damage and the Advanced Building Critical Hits Table (TO:AR pp.118-119, 124).
 */

/** Advanced buildings are Advanced-level rules. */
export const BUILDING_RULES_LEVEL = 3;
export const MAX_BUILDING_EQUIPMENT = 400;
/** Heavy weapons weigh a quarter ton or more (TO:AR p.129). */
export const BUILDING_HEAVY_WEAPON_MIN_TONS = 0.25;
/** Heat sink types offered to a building. */
export const BUILDING_HEAT_SINK_TAGS = ["single", "double"];

export interface IBuildingMount {
    item: IEquipmentItem;
    /** The hex the item is in, from 1. */
    hex: number;
    /** True for an item in the hex's rooftop turret. */
    turret: boolean;
}

export interface IBuildingEquipmentExport {
    tag: string;
    uuid?: string;
    hex?: number;
    turret?: boolean;
}

/** One hex's condition in play. */
export interface IBuildingHexInPlay {
    armorDamage: number;
    cfDamage: number;
    gunnersKilled: boolean;
    /** Turns the gunners stay stunned. */
    gunnersStunned: number;
    /** Turret Jam critical hits taken; a second one locks the turret. */
    turretJams: number;
    turretJammed: boolean;
    turretLocked: boolean;
    ammoExploded: boolean;
    /** The Construction Factor at the start of the turn, set by the turn's first damage; null until then. */
    turnStartCF: number | null;
}

export interface IBuildingInPlay {
    hexes: IBuildingHexInPlay[];
    /** Items destroyed or rendered inoperative, by uuid. */
    destroyed: string[];
    /** Weapons with a malfunction to clear, by uuid. */
    malfunctions: string[];
    /** Shots fired from each ammunition bin, by uuid. */
    ammoUsed: Record<string, number>;
}

export interface IBuildingDamageResult {
    lines: string[];
    /** True when the attack calls for a roll on the Advanced Building Critical Hits Table. */
    criticalRoll: boolean;
}

/** The Advanced Building Critical Hits Table (TO:AR p.119). */
export const BUILDING_CRITICAL_HITS: { min: number; max: number; name: string }[] = [
    { min: 2, max: 5, name: "No Critical Hit" },
    { min: 6, max: 6, name: "Weapon Malfunction" },
    { min: 7, max: 7, name: "Gunners Stunned" },
    { min: 8, max: 8, name: "Weapon Destroyed" },
    { min: 9, max: 9, name: "Gunners Killed" },
    { min: 10, max: 10, name: "Turret Jammed (1-3) / Turret Locked (4-6)" },
    { min: 11, max: 11, name: "Ammunition" },
    { min: 12, max: 12, name: "Other" },
];

const newHexInPlay = (): IBuildingHexInPlay => ({
    armorDamage: 0, cfDamage: 0, gunnersKilled: false, gunnersStunned: 0, turretJams: 0, turretJammed: false, turretLocked: false,
    ammoExploded: false, turnStartCF: null,
});
const newInPlay = (): IBuildingInPlay => ({ hexes: [], destroyed: [], malfunctions: [], ammoUsed: {} });

export interface IBuildingExport {
    /** The gunners' Gunnery skill; absent in saves from before buildings joined the roster. */
    gunnery?: number;
    /** Damage and critical hits taken in play; left out of a design save. */
    inPlay?: IBuildingInPlay;
    uuid: string;
    lastUpdated: Date;
    name: string;
    tech: string;
    era: string;
    classification: string;
    type: string;
    cf: number;
    hexes: number;
    levels: number;
    /** Tons of armor on each hex. */
    armorTons: number;
    heatSinkType: string;
    heatSinks: number;
    /** A generator tag, or "" for a building on the local power grid. */
    generator: string;
    /** Capacity left over is counted as unspecified equipment (TO:AR p.129). */
    unspecifiedEquipment: boolean;
    equipment: IBuildingEquipmentExport[];
}

export interface IBuildingHexLoad {
    hex: number;
    armor: number;
    equipment: number;
    turret: number;
    powerAmplifiers: number;
    heatSinks: number;
    generator: number;
    total: number;
    remaining: number;
    heavyWeapons: number;
}

const savedString = (value: unknown, fallback: string = ""): string => typeof value === "string" ? value : fallback;
const savedNumber = (value: unknown, fallback: number, min: number, max: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
const round3 = (value: number): number => Math.round(value * 1000) / 1000;
const roundUpHalf = (tons: number): number => Math.ceil(tons * 2 - 1e-9) / 2;
const roundUpTenth = (tons: number): number => Math.ceil(tons * 10 - 1e-9) / 10;
const money = (value: number): string => Math.round(value).toLocaleString("en-US");
/** A new building starts in the newest era its tech base has, so nothing is hidden for being too recent. */
const latestEra = (techTag: string): IEras => {
    const eras = getErasForTech(techTag);
    return eras[eras.length - 1] ?? btEraOptions[btEraOptions.length - 1];
};

/** A saved building cleaned by a full import, with what the import changed; null when it is not an object. */
export const normalizeBuildingExport = (raw: unknown): { building: IBuildingExport | null; issues: string[] } => {
    if (!isPlainObject(raw)) return { building: null, issues: ["Skipped a saved building that could not be read"] };
    let json: string;
    try {
        json = JSON.stringify(raw);
    } catch {
        return { building: null, issues: ["Skipped a saved building that could not be read"] };
    }
    const loaded = new Building(json);
    return { building: loaded.export(), issues: [...loaded.getImportIssues()] };
};

export default class Building {
    private _uuid: string = generateUUID();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _tech: ITechOptions = btTechOptions[0];
    private _era: IEras = latestEra("is");
    private _classification: IBuildingClassification = BUILDING_CLASSIFICATIONS[0];
    private _type: IBuildingType = BUILDING_CLASSIFICATIONS[0].types[1];
    private _cf: number = BUILDING_CLASSIFICATIONS[0].types[1].maxCF;
    private _hexes: number = 1;
    private _levels: number = 1;
    private _armorTons: number = 0;
    private _heatSinkType: IHeatSync = mechHeatSinkTypes[0];
    private _heatSinks: number = 0;
    private _generator: IBuildingGenerator | null = null;
    private _unspecifiedEquipment: boolean = false;
    private _equipment: IBuildingMount[] = [];
    private _gunnery: number = 4;
    private _inPlay: IBuildingInPlay = newInPlay();
    private _importIssues: string[] = [];

    constructor(importJSON: string = "") {
        if (importJSON) this.importJSON(importJSON);
    }

    public getUUID(): string { return this._uuid; }
    public newUUID(): void { this._uuid = generateUUID(); }

    public getName(): string { return this._name; }
    public setName(name: string): string {
        this._name = name.slice(0, 200);
        return this._name;
    }

    // Step 1: superstructure (TO:AR pp.126-128) ----------------------------------------------------------------

    public getTech(): ITechOptions { return this._tech; }
    public setTech(tag: string): ITechOptions {
        this._tech = findByTag(btTechOptions, tag) ?? this._tech;
        this._era = getClosestEraForTech(this._era, this._tech.tag);
        this._armorTons = Math.min(this._armorTons, this.getMaxArmorTons());
        return this._tech;
    }
    /** The tech base that sets armor points a ton: Clan for Clan and Mixed (Clan base). */
    public getTechBase(): "is" | "clan" {
        return this._tech.tag === "clan" || this._tech.tag === "mclan" ? "clan" : "is";
    }

    public getEra(): IEras { return this._era; }
    public setEra(tag: string): IEras {
        this._era = getClosestEraForTech(findEraByTag(tag) ?? this._era, this._tech.tag);
        return this._era;
    }
    public getAvailableEras(): IEras[] { return getErasForTech(this._tech.tag); }

    public getClassification(): IBuildingClassification { return this._classification; }
    /** Changing the classification keeps the type where the new one has it, and brings the size back within its limits. */
    public setClassification(tag: string): IBuildingClassification {
        const classification = findBuildingClassification(tag);
        if (!classification) return this._classification;
        this._classification = classification;
        this._type = classification.types.find((type) => type.tag === this._type.tag) ?? classification.types[0];
        this._clampToType();
        return this._classification;
    }
    public isGunEmplacement(): boolean { return this._classification.tag === "gun-emplacement"; }

    public getType(): IBuildingType { return this._type; }
    /** Changing the type moves the Construction Factor into the new type's range. */
    public setType(tag: string): IBuildingType {
        this._type = this._classification.types.find((type) => type.tag === tag) ?? this._type;
        this._clampToType();
        return this._type;
    }

    private _clampToType(): void {
        this._cf = Math.min(this._type.maxCF, Math.max(this._type.minCF, this._cf));
        this._hexes = Math.min(this.getMaxHexes(), Math.max(1, this._hexes));
        this._levels = Math.min(this.getMaxLevels(), Math.max(1, this._levels));
        this._armorTons = Math.min(this._armorTons, this.getMaxArmorTons());
        if (!this._classification.powered) this._generator = null;
        for (const mount of this._equipment) mount.hex = Math.min(this._hexes, mount.hex);
    }

    public getCF(): number { return this._cf; }
    public setCF(cf: number): number {
        this._cf = Math.min(this._type.maxCF, Math.max(this._type.minCF, Math.floor(Number.isFinite(cf) ? cf : this._cf)));
        this._armorTons = Math.min(this._armorTons, this.getMaxArmorTons());
        return this._cf;
    }

    /** Hexes covered, or hexsides for a wall or fence. */
    public getHexes(): number { return this._hexes; }
    public getMaxHexes(): number { return this._type.maxHexes ?? BUILDING_MAX_UNLIMITED_HEXES; }
    public setHexes(hexes: number): number {
        this._hexes = Math.min(this.getMaxHexes(), Math.max(1, Math.floor(Number.isFinite(hexes) ? hexes : this._hexes)));
        for (const mount of this._equipment) mount.hex = Math.min(this._hexes, mount.hex);
        return this._hexes;
    }
    public getHexLabel(plural: boolean = false): string {
        return this._classification.perHexside ? (plural ? "hexsides" : "hexside") : (plural ? "hexes" : "hex");
    }

    public getLevels(): number { return this._levels; }
    /** A bridge has no height of its own: it is one level for these rules. */
    public getMaxLevels(): number { return this._type.maxLevels ?? 1; }
    public setLevels(levels: number): number {
        this._levels = Math.min(this.getMaxLevels(), Math.max(1, Math.floor(Number.isFinite(levels) ? levels : this._levels)));
        return this._levels;
    }

    /**
     * Internal weight capacity of one hex: the Construction Factor times the levels. A hangar triples that, to
     * no more than 600 tons for every 4 levels or fraction; tents, fences and bridges carry nothing (TO:AR p.127).
     */
    public getCapacityPerHex(): number {
        if (this._classification.capacity === "none") return 0;
        const base = this._cf * this._levels;
        if (this._classification.capacity === "hangar") return Math.min(base * 3, HANGAR_CAPACITY_PER_FOUR_LEVELS * Math.ceil(this._levels / 4));
        return base;
    }
    public getTotalCapacity(): number { return this.getCapacityPerHex() * this._hexes; }

    // Step 2: armor (TO:AR p.128) ------------------------------------------------------------------------------

    public canMountArmor(): boolean { return this._classification.armor; }
    public getArmorPointsPerTon(): number { return BUILDING_ARMOR_POINTS_PER_TON[this.getTechBase()]; }
    /** Armor points a hex may carry: the Construction Factor x 1 (TO:AR p.113). */
    public getMaxArmorPoints(): number { return this.canMountArmor() ? this._cf : 0; }
    /** Armor comes in full tons; the last ton may be only partly used. */
    public getMaxArmorTons(): number { return Math.ceil(this.getMaxArmorPoints() / this.getArmorPointsPerTon()); }
    /** Tons of armor on each hex. */
    public getArmorTons(): number { return this._armorTons; }
    public setArmorTons(tons: number): number {
        this._armorTons = Math.min(this.getMaxArmorTons(), Math.max(0, Math.floor(Number.isFinite(tons) ? tons : 0)));
        return this._armorTons;
    }
    /** The Armor Factor of each hex. */
    public getArmorPoints(): number { return Math.min(this.getMaxArmorPoints(), this._armorTons * this.getArmorPointsPerTon()); }

    // Step 3: weapons, heat sinks, equipment and power (TO:AR pp.129-132) ---------------------------------------

    private static _isWeapon(item: IEquipmentItem): boolean {
        return !item.isAmmo && /Weapons$/.test(item.category);
    }
    private static _isEnergyWeapon(item: IEquipmentItem): boolean {
        return !item.isAmmo && item.category === "Energy Weapons";
    }
    /** Heavy weapons: those of a quarter ton or more that 'Mechs or vehicles mount (TO:AR p.129). */
    public static isHeavyWeapon(item: IEquipmentItem): boolean {
        return Building._isWeapon(item) && (item.weight || 0) >= BUILDING_HEAVY_WEAPON_MIN_TONS;
    }

    public canMountHeavyWeapons(): boolean { return this._classification.heavyWeapons !== "none"; }

    /**
     * Heavy weapon tonnage one hex may mount, not counting ammunition, turrets, heat sinks or power amplifiers:
     * a gun emplacement's CF / 3, rounded down; a fortress's CF / 10 for each level (TO:AR p.129, TO:AUE p.82).
     */
    public getHeavyWeaponLimitPerHex(): number {
        if (this._classification.heavyWeapons === "cf-third") return Math.floor(this._cf / 3);
        if (this._classification.heavyWeapons === "cf-tenth-per-level") return round3(this._cf / 10 * this._levels);
        return 0;
    }

    /**
     * Weapons a 'Mech or vehicle mounts, where the classification takes Heavy weapons, with their ammunition;
     * other equipment where DropShips or Support Vehicles may carry it (TO:AR pp.129, 131; TO:AUE p.82).
     */
    public isEquipmentAllowed(item: IEquipmentItem): boolean {
        if (this._classification.capacity === "none") return false;
        if (item.category === "Melee" || item.requiresHandActuator) return false;
        if (Building._isWeapon(item)) {
            return this.canMountHeavyWeapons() && Building.isHeavyWeapon(item)
                && ((item.space?.battlemech ?? -1) >= 0 || (item.space?.combatVehicle ?? -1) >= 0);
        }
        if (item.isAmmo) return this.canMountHeavyWeapons();
        return (item.space?.dropShip ?? -1) >= 0 || (item.space?.supportVehicle ?? -1) >= 0;
    }

    public getAvailableEquipment(includeCustom: boolean = false, rulesLevel: number = BUILDING_RULES_LEVEL): IEquipmentItem[] {
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
        return items.filter((item) => isEquipmentWithinRulesLevel(item, offeredLevel));
    }

    private _catalog(): IEquipmentItem[] {
        const techTag = this._tech.tag;
        const own = getEquipmentListByTech(techTag, true);
        // A saved building keeps what it mounted, including equipment since moved to the other tech base's catalog.
        return techTag === "is" || techTag === "clan" ? [...own, ...getEquipmentListByTech(techTag === "clan" ? "mclan" : "mis", true)] : own;
    }

    private _newMount(catalogItem: IEquipmentItem, hex: unknown, turret: unknown, uuid?: unknown): IBuildingMount {
        const freshId = typeof uuid !== "string" || !uuid || this._equipment.some((mount) => mount.item.uuid === uuid);
        // A deep copy: mounted items never share nested data with each other or the catalog.
        const item: IEquipmentItem = { ...JSON.parse(JSON.stringify(catalogItem)), uuid: freshId ? generateUUID() : uuid as string };
        return {
            item,
            hex: Math.floor(savedNumber(hex, 1, 1, this._hexes)),
            turret: turret === true && !item.isAmmo,
        };
    }

    public getEquipment(): IBuildingMount[] { return this._equipment; }

    public addEquipmentFromTag(tag: string, hex: number = 1, turret: boolean = false): IBuildingMount | null {
        const catalogItem = findByTag(this._catalog(), tag);
        if (!catalogItem || !this.isEquipmentAllowed(catalogItem) || this._equipment.length >= MAX_BUILDING_EQUIPMENT) return null;
        const mount = this._newMount(catalogItem, hex, turret);
        this._equipment.push(mount);
        return mount;
    }

    public removeEquipment(uuid: string): IBuildingMount[] {
        this._equipment = this._equipment.filter((mount) => mount.item.uuid !== uuid);
        return this._equipment;
    }

    public setEquipmentHex(uuid: string, hex: number): void {
        const mount = this._equipment.find((entry) => entry.item.uuid === uuid);
        if (mount) mount.hex = Math.floor(savedNumber(hex, mount.hex, 1, this._hexes));
    }

    /** Ammunition is never in a turret (TO:AUE p.83). */
    public setEquipmentTurret(uuid: string, turret: boolean): void {
        const mount = this._equipment.find((entry) => entry.item.uuid === uuid);
        if (mount) mount.turret = turret && !mount.item.isAmmo;
    }

    /** Tons of Heavy weapons in a hex, the figure the classification limits. */
    public getHeavyWeaponTons(hex: number): number {
        return round3(this._equipment.filter((mount) => mount.hex === hex && Building.isHeavyWeapon(mount.item))
            .reduce((sum, mount) => sum + (mount.item.weight || 0), 0));
    }

    /**
     * A hex's turret weighs 10 percent of what is mounted in it, rounded up to the half ton; heat sinks, power
     * amplifiers and ammunition are not counted (TO:AUE p.83).
     */
    public getTurretWeight(hex: number): number {
        const mounted = this._equipment.filter((mount) => mount.hex === hex && mount.turret && !mount.item.isAmmo)
            .reduce((sum, mount) => sum + (mount.item.weight || 0), 0);
        return roundUpHalf(mounted * 0.1);
    }
    public hasTurret(): boolean { return this._equipment.some((mount) => mount.turret); }

    public getHeatSinkType(): IHeatSync { return this._heatSinkType; }
    public getAvailableHeatSinkTypes(): IHeatSync[] {
        return mechHeatSinkTypes.filter((type) => BUILDING_HEAT_SINK_TAGS.includes(type.tag));
    }
    public setHeatSinkType(tag: string): IHeatSync {
        this._heatSinkType = this.getAvailableHeatSinkTypes().find((type) => type.tag === tag) ?? this._heatSinkType;
        return this._heatSinkType;
    }
    /** A building has no free heat sinks (TO:AUE p.83); each weighs a ton. */
    public getHeatSinks(): number { return this._heatSinks; }
    public setHeatSinks(count: number): number {
        this._heatSinks = Math.min(2000, Math.max(0, Math.floor(Number.isFinite(count) ? count : 0)));
        return this._heatSinks;
    }
    public getHeatDissipation(): number { return this._heatSinks * (this._heatSinkType.dissipation ?? 1); }
    /** Heat of every energy weapon fired together. */
    public getEnergyWeaponHeat(): number {
        return this._equipment.filter((mount) => Building._isEnergyWeapon(mount.item)).reduce((sum, mount) => sum + (mount.item.heat || 0), 0);
    }
    /** Without a fission or fusion generator the heat sinks must cover all the energy weapons (TO:AUE p.83). */
    public needsHeatSinksForEnergyWeapons(): boolean { return !this._generator?.fusionOrFission; }

    public getGenerator(): IBuildingGenerator | null { return this._generator; }
    public canMountGenerator(): boolean { return this._classification.powered; }
    /** An empty tag puts the building back on the local power grid. */
    public setGenerator(tag: string): IBuildingGenerator | null {
        this._generator = this.canMountGenerator() ? findBuildingGenerator(tag) ?? null : null;
        return this._generator;
    }

    /** Energy weapons that draw on amplifiers; flamers and chemical lasers are left out, as on vehicles. */
    private _amplifiedWeaponTons(hex?: number): number {
        return this._equipment
            .filter((mount) => (hex === undefined || mount.hex === hex) && Building._isEnergyWeapon(mount.item) && !/vehicle-flamer|chemical-laser/.test(mount.item.tag))
            .reduce((sum, mount) => sum + (mount.item.weight || 0), 0);
    }

    /**
     * Power amplifiers for a hex: 10 percent of its Heavy energy weapons, rounded up to the tenth of a ton, for a
     * building on the grid or on a generator that is neither fusion nor fission (TO:AR p.129).
     */
    public getPowerAmplifierWeight(hex: number): number {
        if (this._generator?.fusionOrFission) return 0;
        return roundUpTenth(this._amplifiedWeaponTons(hex) * 0.1);
    }

    /**
     * Generator weight: one for each hex and level, plus 10 percent of the Heavy energy weapons' tonnage, times
     * the generator's multiplier, rounded up (TO:AR p.132). This building alone is counted.
     */
    public getGeneratorWeight(): number {
        if (!this._generator) return 0;
        const base = this._hexes * this._levels + this._equipment
            .filter((mount) => Building._isEnergyWeapon(mount.item) && Building.isHeavyWeapon(mount.item))
            .reduce((sum, mount) => sum + (mount.item.weight || 0), 0) * 0.1;
        return Math.ceil(base * this._generator.weightMultiplier - 1e-9);
    }

    public hasUnspecifiedEquipment(): boolean { return this._unspecifiedEquipment; }
    public setUnspecifiedEquipment(unspecified: boolean): boolean {
        this._unspecifiedEquipment = unspecified && this._classification.capacity !== "none";
        return this._unspecifiedEquipment;
    }

    // Totals --------------------------------------------------------------------------------------------------

    /** What each hex carries. Heat sinks and the generator are spread evenly over the hexes (TO:AR p.132). */
    public getHexLoads(): IBuildingHexLoad[] {
        const capacity = this.getCapacityPerHex();
        const heatSinks = round3(this._heatSinks / this._hexes);
        const generator = round3(this.getGeneratorWeight() / this._hexes);
        const loads: IBuildingHexLoad[] = [];
        for (let hex = 1; hex <= this._hexes; hex++) {
            const equipment = round3(this._equipment.filter((mount) => mount.hex === hex).reduce((sum, mount) => sum + (mount.item.weight || 0), 0));
            const turret = this.getTurretWeight(hex);
            const powerAmplifiers = this.getPowerAmplifierWeight(hex);
            const total = round3(this._armorTons + equipment + turret + powerAmplifiers + heatSinks + generator);
            loads.push({
                hex, armor: this._armorTons, equipment, turret, powerAmplifiers, heatSinks, generator, total,
                remaining: round3(capacity - total), heavyWeapons: this.getHeavyWeaponTons(hex),
            });
        }
        return loads;
    }

    public getTotalWeight(): number { return round3(this.getHexLoads().reduce((sum, load) => sum + load.total, 0)); }
    public getRemainingCapacity(): number { return round3(this.getTotalCapacity() - this.getTotalWeight()); }

    /** One line for each part of the building's load, across all hexes. */
    public getWeights(): { name: string; weight: number }[] {
        const loads = this.getHexLoads();
        const sum = (key: "turret" | "powerAmplifiers") => round3(loads.reduce((total, load) => total + load[key], 0));
        return [
            ...(this._armorTons > 0 ? [{ name: `Armor (${this.getArmorPoints()} points a ${this.getHexLabel()})`, weight: this._armorTons * this._hexes }] : []),
            ...(this._generator ? [{ name: `${this._generator.name} Generator`, weight: this.getGeneratorWeight() }] : []),
            ...(this._heatSinks > 0 ? [{ name: `Heat Sinks (${this._heatSinks} ${this._heatSinkType.name})`, weight: this._heatSinks }] : []),
            ...(sum("powerAmplifiers") > 0 ? [{ name: "Power Amplifiers", weight: sum("powerAmplifiers") }] : []),
            ...(sum("turret") > 0 ? [{ name: "Turrets", weight: sum("turret") }] : []),
            ...this._equipment.map((mount) => ({
                name: `${mount.item.name}${mount.turret ? " (T)" : ""}${this._hexes > 1 ? `, hex ${mount.hex}` : ""}`, weight: mount.item.weight || 0,
            })),
        ];
    }

    /**
     * Minimum gunners and officers: a Heavy weapon needs its tonnage / 5 gunners, rounded up, and a military
     * building one officer for up to 9 crew or one for every 10 (TO:AR p.130). Crew for other equipment, such
     * as communications gear, is not counted here.
     */
    public getMinimumGunners(): number {
        return this._equipment.filter((mount) => Building.isHeavyWeapon(mount.item)).reduce((sum, mount) => sum + Math.ceil((mount.item.weight || 0) / 5 - 1e-9), 0);
    }
    public getMinimumOfficers(): number {
        const crew = this.getMinimumGunners();
        if (crew === 0 || !this.canMountHeavyWeapons()) return 0;
        return crew <= 9 ? 1 : Math.ceil(crew / 10);
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

    /** The lowest rules level that allows everything on the design. */
    public getRequiredRulesLevel(): number {
        let level = BUILDING_RULES_LEVEL;
        for (const mount of this._equipment) level = Math.max(level, getEquipmentRulesLevel(mount.item));
        return level;
    }

    /** Everything that keeps the design from being legal, in plain words. */
    public getIssues(rulesLevel: number = BUILDING_RULES_LEVEL): string[] {
        const issues: string[] = [];
        if (rulesLevel < BUILDING_RULES_LEVEL) issues.push("Building construction is an Advanced rule (TO:AR p.126); the selected rules level is below it.");
        const hexLabel = this.getHexLabel();
        const limit = this.getHeavyWeaponLimitPerHex();
        for (const load of this.getHexLoads()) {
            const where = this._hexes > 1 ? `Hex ${load.hex}` : "The building";
            if (load.remaining < 0) issues.push(`${where} carries ${load.total} tons; a ${hexLabel} holds ${this.getCapacityPerHex()} (TO:AR p.127).`);
            if (load.heavyWeapons > limit && this.canMountHeavyWeapons()) {
                issues.push(`${where} mounts ${load.heavyWeapons} tons of Heavy weapons; the limit is ${limit} (TO:AR p.129).`);
            }
        }
        if (this.needsHeatSinksForEnergyWeapons() && this.getEnergyWeaponHeat() > this.getHeatDissipation()) {
            issues.push(`Without a fusion or fission generator the heat sinks must cover every energy weapon: ${this.getEnergyWeaponHeat()} heat, ${this.getHeatDissipation()} sunk (TO:AUE p.83).`);
        }
        if (this._generator?.noRooftopEquipment && this.hasTurret()) issues.push(`A ${this._generator.name.toLowerCase()} generator leaves no room on the roof for turrets (TO:AR p.132).`);
        for (const mount of this._equipment) {
            if (!this.isEquipmentAllowed(mount.item)) issues.push(`${mount.item.name} cannot be mounted on a ${this._classification.name.toLowerCase()}.`);
            else if (!this._datesAvailability(mount.item, rulesLevel).available) issues.push(`${mount.item.name} is not available in the selected era.`);
            else if (!isEquipmentWithinRulesLevel(mount.item, Math.max(rulesLevel, BUILDING_RULES_LEVEL))) issues.push(`${mount.item.name} is above the selected rules level.`);
        }
        if (this._heatSinkType.tag !== "single" && this._heatSinks > 0 && !this._datesAvailability(this._heatSinkType, rulesLevel).available) {
            issues.push(`${this._heatSinkType.name} heat sinks are not available in the selected era.`);
        }
        return issues;
    }

    /** Things worth knowing that are not errors. */
    public getNotes(): string[] {
        const notes: string[] = [];
        if (this.isGunEmplacement()) notes.push("Units other than infantry cannot enter a gun emplacement. It stacks and is attacked as a stationary vehicle, and tracks damage as a building (TO:AR p.115).");
        if (this._classification.capacity === "none") notes.push(`A ${this._classification.name.toLowerCase()} has no internal weight capacity: it mounts no equipment (TO:AR p.127).`);
        if (!this._generator && this.canMountGenerator() && this._equipment.length > 0) notes.push("With no generator the building draws its power from the local grid, and loses it if the grid fails (TO:AR p.129).");
        if (this._generator?.notes) notes.push(`${this._generator.name} generator: ${this._generator.notes}.`);
        if (this._generator?.dailyFuel) notes.push(`The generator burns ${round3(this._generator.dailyFuel * this._hexes * this._levels / 5)} tons of fuel a day (${this._generator.dailyFuel} for every five hexes and levels), stored outside the building (TO:AR p.132).`);
        if (this._classification.lightWeapons) notes.push("Light and Medium (infantry) weapons, 6 a hex for each level, are not built here yet (TO:AR p.129).");
        return notes;
    }

    // Cost (TO:AR p.208) ---------------------------------------------------------------------------------------

    private _costRows(): [string, number][] {
        const rows: [string, number][] = [];
        const levels = this._classification.singleLevelCost ? 1 : this._levels;
        const rate = this._classification.costPerCF;
        rows.push([
            `Structure (${money(rate)} x CF ${this._cf} x ${this._hexes} ${this.getHexLabel(this._hexes !== 1)}${this._classification.singleLevelCost ? "" : ` x ${levels} ${levels === 1 ? "level" : "levels"}`})`,
            rate * this._cf * this._hexes * levels,
        ]);
        if (this._generator) rows.push([`${this._generator.name} Generator (${money(this._generator.costPerTon)} x ${this.getGeneratorWeight()} t)`, this._generator.costPerTon * this.getGeneratorWeight()]);
        const armorTons = this._armorTons * this._hexes;
        if (armorTons > 0) rows.push([`Armor (${money(BUILDING_ARMOR_COST_PER_TON[this.getTechBase()])} x ${armorTons} t)`, BUILDING_ARMOR_COST_PER_TON[this.getTechBase()] * armorTons]);
        if (this._heatSinks > 0) rows.push([`Heat Sinks (${this._heatSinks} ${this._heatSinkType.name})`, this._heatSinks * (this._heatSinkType.cost || 2000)]);
        const loads = this.getHexLoads();
        const amplifiers = round3(loads.reduce((sum, load) => sum + load.powerAmplifiers, 0));
        if (amplifiers > 0) rows.push([`Power Amplifiers (20,000 x ${amplifiers} t)`, 20000 * amplifiers]);
        const turrets = round3(loads.reduce((sum, load) => sum + load.turret, 0));
        if (turrets > 0) rows.push([`Turrets (5,000 x ${turrets} t)`, 5000 * turrets]);
        const equipment = this._equipment.reduce((sum, mount) => sum + (mount.item.isAmmo ? (mount.item.cbills || 0) * (mount.item.weight || 0) : mount.item.cbills || 0), 0);
        if (this._equipment.length > 0) rows.push(["Weapons, Equipment and Ammunition", equipment]);
        if (this._unspecifiedEquipment) {
            rows.push([
                `Unspecified Equipment (${money(BUILDING_UNSPECIFIED_EQUIPMENT_COST_PER_CF)} x CF ${this._cf} x ${this._hexes} ${this.getHexLabel(this._hexes !== 1)})`,
                BUILDING_UNSPECIFIED_EQUIPMENT_COST_PER_CF * this._cf * this._hexes,
            ]);
        }
        return rows;
    }

    /**
     * (Structure + generator + armor + weapons and equipment) x (1 + CF / 100), TO:AR p.208. The table prices no
     * turrets, power amplifiers or heat sinks of its own: those take their TechManual prices (TM pp.279-280).
     */
    public getCBillCost(): number {
        const subtotal = this._costRows().reduce((sum, [, value]) => sum + value, 0);
        return Math.round(subtotal * (1 + this._cf / 100));
    }

    /** The calculation, one plain-text line per step. */
    public getCBillCostLog(): string[] {
        const rows = this._costRows();
        const subtotal = rows.reduce((sum, [, value]) => sum + value, 0);
        return [
            ...rows.map(([name, value]) => `${name}: ${money(value)}`),
            `Subtotal ${money(subtotal)} x ${round3(1 + this._cf / 100)} (1 + CF ${this._cf} / 100) = ${money(this.getCBillCost())}`,
        ];
    }

    // In play (TO:AR pp.115, 118-119, 124) ---------------------------------------------------------------------

    public getDisplayName(): string {
        return this._name.trim() || `${this._type.tag === "none" ? "" : this._type.name + " "}${this._classification.name}`;
    }

    public getGunnery(): number { return this._gunnery; }
    public setGunnery(skill: number): void { this._gunnery = Math.floor(savedNumber(skill, this._gunnery, 0, 8)); }

    public getInPlay(): IBuildingInPlay { return this._inPlay; }
    public resetInPlay(): void { this._inPlay = newInPlay(); }

    private _hexState(hex: number): IBuildingHexInPlay {
        const index = Math.min(this._hexes, Math.max(1, Math.floor(hex) || 1)) - 1;
        while (this._inPlay.hexes.length <= index) this._inPlay.hexes.push(newHexInPlay());
        return this._inPlay.hexes[index];
    }
    private _peekHex(hex: number): IBuildingHexInPlay { return this._inPlay.hexes[hex - 1] ?? newHexInPlay(); }

    /** Armor Factor left on a hex. */
    public getHexArmor(hex: number): number { return Math.max(0, this.getArmorPoints() - this._peekHex(hex).armorDamage); }
    /** Construction Factor left on a hex. */
    public getHexCF(hex: number): number { return Math.max(0, this._cf - this._peekHex(hex).cfDamage); }
    public isHexDestroyed(hex: number): boolean { return this.getHexCF(hex) <= 0; }
    public getHexState(hex: number): IBuildingHexInPlay { return { ...this._peekHex(hex) }; }

    /** Marks a hex's Armor Factor or Construction Factor by hand. */
    public setHexArmor(hex: number, remaining: number): void {
        this._hexState(hex).armorDamage = this.getArmorPoints() - Math.floor(savedNumber(remaining, this.getHexArmor(hex), 0, this.getArmorPoints()));
    }
    public setHexCF(hex: number, remaining: number): void {
        this._hexState(hex).cfDamage = this._cf - Math.floor(savedNumber(remaining, this.getHexCF(hex), 0, this._cf));
    }

    public isDestroyed(): boolean {
        for (let hex = 1; hex <= this._hexes; hex++) if (!this.isHexDestroyed(hex)) return false;
        return true;
    }
    public isDamaged(): boolean {
        return this._inPlay.destroyed.length > 0 || this._inPlay.malfunctions.length > 0 || Object.values(this._inPlay.ammoUsed).some((used) => used > 0)
            || this._inPlay.hexes.slice(0, this._hexes).some((state) => state.armorDamage > 0 || state.cfDamage > 0 || state.gunnersKilled
                || state.gunnersStunned > 0 || state.turretJammed || state.turretLocked || state.ammoExploded);
    }
    /** Armor Factor and Construction Factor left across the building. */
    public getCurrentPoints(): number {
        let points = 0;
        for (let hex = 1; hex <= this._hexes; hex++) points += this.isHexDestroyed(hex) ? 0 : this.getHexArmor(hex) + this.getHexCF(hex);
        return points;
    }
    public getStrengthPercentage(): number {
        const full = (this.getArmorPoints() + this._cf) * this._hexes;
        return full > 0 ? Math.round(this.getCurrentPoints() / full * 100) : 0;
    }

    /**
     * A hex's Damage Threshold: its Construction Factor at the start of the turn / 10, rounded up. A single
     * attack or Damage Value grouping above it calls for a critical hit roll (TO:AR p.118).
     */
    public getDamageThreshold(hex: number): number {
        return Math.ceil((this._peekHex(hex).turnStartCF ?? this.getHexCF(hex)) / 10);
    }

    /** Points a hex takes off each attack against a unit inside: its Construction Factor / 10, rounded up (TW p.171; TO:AR p.125). */
    public getDamageAbsorbed(hex: number): number { return Math.ceil(this.getHexCF(hex) / 10); }

    /**
     * Damage to a unit that fails its roll entering the hex: the Construction Factor / 10, rounded up (TO:AR
     * p.117), times the classification's scaling for damage to units, rounded down (TO:AR p.124).
     */
    public getUnitEntryDamage(hex: number): number {
        return Math.floor(Math.ceil(this.getHexCF(hex) / 10) * this._classification.damageToUnits);
    }

    /**
     * Applies one attack, or one Damage Value grouping, to a hex. Scaled damage multiplies it by the
     * classification's figure and rounds down (TO:AR p.124). Armor goes first and the rest reaches the
     * Construction Factor (TO:AR p.128); an attack from inside the building skips the armor (TO:AR p.119).
     * A critical hit roll is due when the Construction Factor was damaged and the damage is above the hex's
     * Damage Threshold (TO:AR p.118).
     */
    public applyDamage(hex: number, damage: number, scaled: boolean = true, fromInside: boolean = false): IBuildingDamageResult {
        const lines: string[] = [];
        const where = this._hexes > 1 ? `Hex ${hex}` : this.getDisplayName();
        if (hex < 1 || hex > this._hexes || this.isHexDestroyed(hex)) return { lines: [`${where} is already destroyed`], criticalRoll: false };
        const rated = Math.max(0, Math.floor(savedNumber(damage, 0, 0, 100000)));
        const multiplier = scaled ? this._classification.damageToBuilding : 1;
        const applied = Math.floor(rated * multiplier);
        if (multiplier !== 1) lines.push(`${rated} damage x${multiplier} for a ${this._classification.name.toLowerCase()} = ${applied} (TO:AR p.124)`);
        if (applied <= 0) return { lines: [...lines, `${where}: no damage`], criticalRoll: false };

        const state = this._hexState(hex);
        if (state.turnStartCF === null) state.turnStartCF = this.getHexCF(hex);
        const threshold = this.getDamageThreshold(hex);
        const armorTaken = fromInside ? 0 : Math.min(this.getHexArmor(hex), applied);
        state.armorDamage += armorTaken;
        const cfTaken = Math.min(this.getHexCF(hex), applied - armorTaken);
        state.cfDamage += cfTaken;
        if (armorTaken > 0) lines.push(`${where}: ${armorTaken} to armor, ${this.getHexArmor(hex)} left`);
        if (cfTaken > 0) lines.push(`${where}: ${cfTaken} to the Construction Factor, ${this.getHexCF(hex)} left`);
        if (this.isHexDestroyed(hex)) {
            lines.push(this._collapseLine(where));
            return { lines, criticalRoll: false };
        }
        const criticalRoll = cfTaken > 0 && applied > threshold;
        if (criticalRoll) lines.push(`${applied} damage is above the Damage Threshold of ${threshold}: roll on the Advanced Building Critical Hits Table (TO:AR p.118)`);
        return { lines, criticalRoll };
    }

    private _collapseLine(where: string): string {
        if (this.isGunEmplacement()) return `${where} is destroyed`;
        return `${where} collapses${this._hexes > 1 ? "; under the expanded collapse rules, halve the Construction Factor left on each adjacent hex of this building (TO:AR p.121)" : ""}`;
    }

    /** A collapsing hex halves the Construction Factor left on an adjacent hex of the same building, rounded down (TO:AR p.121). */
    public halveHexCF(hex: number): number {
        this.setHexCF(hex, Math.floor(this.getHexCF(hex) / 2));
        return this.getHexCF(hex);
    }

    // Damage that reaches the Construction Factor directly, as an explosion inside the hex does.
    private _damageCF(hex: number, damage: number): string[] {
        const where = this._hexes > 1 ? `Hex ${hex}` : this.getDisplayName();
        const taken = Math.min(this.getHexCF(hex), Math.max(0, damage));
        this._hexState(hex).cfDamage += taken;
        return [`${where}: ${taken} to the Construction Factor, ${this.getHexCF(hex)} left`, ...(this.isHexDestroyed(hex) ? [this._collapseLine(where)] : [])];
    }

    public isMountDestroyed(uuid: string): boolean { return this._inPlay.destroyed.includes(uuid); }
    public hasMalfunction(uuid: string): boolean { return this._inPlay.malfunctions.includes(uuid); }
    private _mount(uuid: string): IBuildingMount | undefined { return this._equipment.find((mount) => mount.item.uuid === uuid); }

    /** Weapons in a hex that still work. */
    public getWorkingWeapons(hex: number): IBuildingMount[] {
        return this._equipment.filter((mount) => mount.hex === hex && Building._isWeapon(mount.item) && !this.isMountDestroyed(mount.item.uuid || ""));
    }

    /** Why a weapon cannot fire this turn, or "" when it can. */
    public getMountStatus(uuid: string): string {
        const mount = this._mount(uuid);
        if (!mount) return "";
        const state = this._peekHex(mount.hex);
        if (this.isHexDestroyed(mount.hex)) return "Hex destroyed";
        if (this.isMountDestroyed(uuid)) return mount.item.isAmmo ? "Destroyed" : Building._isWeapon(mount.item) ? "Destroyed" : "Inoperative";
        if (mount.item.isAmmo) return state.ammoExploded ? "Destroyed" : "";
        if (!Building._isWeapon(mount.item)) return "";
        if (state.gunnersKilled) return "Gunners killed";
        if (state.gunnersStunned > 0) return "Gunners stunned";
        if (this.hasMalfunction(uuid)) return "Malfunction";
        if (mount.turret && state.turretLocked) return "Turret locked in its facing";
        if (mount.turret && state.turretJammed) return "Turret jammed in its facing";
        return "";
    }

    /**
     * Marks an item destroyed or working again. A weapon that can explode does so when a critical hit destroys
     * it, as an ammunition explosion of that damage in its hex (TO:AR p.119).
     */
    public setMountDestroyed(uuid: string, destroyed: boolean, byCriticalHit: boolean = false): string[] {
        const mount = this._mount(uuid);
        if (!mount) return [];
        this._inPlay.destroyed = this._inPlay.destroyed.filter((entry) => entry !== uuid);
        this._inPlay.malfunctions = this._inPlay.malfunctions.filter((entry) => entry !== uuid);
        if (!destroyed) return [];
        this._inPlay.destroyed.push(uuid);
        const lines = [`${mount.item.name} is ${Building._isWeapon(mount.item) ? "destroyed" : "inoperative"}`];
        const explosion = byCriticalHit ? getWeaponExplosionDamage(mount.item) : null;
        if (explosion) {
            const damage = this.hasCASE(mount.hex) ? Math.floor(explosion.damage / 10) : explosion.damage;
            lines.push(`${mount.item.name} explodes for ${explosion.damage} damage (${explosion.book} p.${explosion.page})${damage !== explosion.damage ? `, ${damage} with CASE` : ""}`);
            lines.push(...this._damageCF(mount.hex, damage));
        } else if (byCriticalHit && mount.item.explosive && !mount.item.isAmmo) {
            lines.push(`${mount.item.name} can explode, but its explosion damage is not in the rulebooks in hand`);
        }
        return lines;
    }

    /** A malfunction stops a weapon until the gunners spend a Weapon Attack Phase clearing it (TO:AR p.119). */
    public setMalfunction(uuid: string, malfunction: boolean): void {
        const mount = this._mount(uuid);
        this._inPlay.malfunctions = this._inPlay.malfunctions.filter((entry) => entry !== uuid);
        if (malfunction && mount && Building._isWeapon(mount.item) && !this.isMountDestroyed(uuid)) this._inPlay.malfunctions.push(uuid);
    }

    public setGunnersKilled(hex: number, killed: boolean): void { this._hexState(hex).gunnersKilled = killed; }
    public setGunnersStunned(hex: number, turns: number): void { this._hexState(hex).gunnersStunned = Math.floor(savedNumber(turns, 0, 0, 99)); }
    /** Fixing a jam takes the gunners a Weapon Attack Phase; a locked turret stays locked (TO:AR p.118). */
    public setTurretJammed(hex: number, jammed: boolean): void { this._hexState(hex).turretJammed = jammed && !this._peekHex(hex).turretLocked; }
    public setTurretLocked(hex: number, locked: boolean): void {
        const state = this._hexState(hex);
        state.turretLocked = locked;
        if (locked) state.turretJammed = false;
        else state.turretJams = 0;
    }

    /** A new turn: stunned gunners recover a turn, and the next damage sets a fresh Damage Threshold. */
    public startTurn(): void {
        for (const state of this._inPlay.hexes) {
            state.gunnersStunned = Math.max(0, state.gunnersStunned - 1);
            state.turnStartCF = null;
        }
    }

    public hasCASE(hex: number): boolean {
        return this._equipment.some((mount) => mount.hex === hex && ["case", "case-ii", "clan-case-ii"].some((tag) => matchesTag(mount.item, tag)));
    }

    // The weapon an ammunition bin feeds: one in its own hex first, then any on the building.
    private _binWeapon(bin: IBuildingMount): IEquipmentItem | undefined {
        const weapons = [...this._equipment.filter((mount) => mount.hex === bin.hex), ...this._equipment].filter((mount) => !mount.item.isAmmo).map((mount) => mount.item);
        return (bin.item.feedsWeaponTag ? weapons.find((weapon) => equipmentMatchesIdentifier(weapon, bin.item.feedsWeaponTag || "")) : undefined)
            ?? weapons.find((weapon) => getCompatibleAmmo(weapon, bin.item));
    }

    /** Shots in a full bin: the fed weapon's shots a ton times the bin's weight; 0 with no weapon to fire it. */
    public getAmmoCapacity(uuid: string): number {
        const bin = this._mount(uuid);
        const weapon = bin?.item.isAmmo ? this._binWeapon(bin) : undefined;
        return bin && weapon ? Math.floor(getWeaponShotsPerTon(weapon, bin.item) * (bin.item.weight || 0)) : 0;
    }
    public getAmmoShots(uuid: string): number {
        const bin = this._mount(uuid);
        if (!bin || this.isMountDestroyed(uuid) || this._peekHex(bin.hex).ammoExploded) return 0;
        return Math.max(0, this.getAmmoCapacity(uuid) - (this._inPlay.ammoUsed[uuid] ?? 0));
    }
    public setAmmoShots(uuid: string, shots: number): void {
        const capacity = this.getAmmoCapacity(uuid);
        if (!this._mount(uuid)?.item.isAmmo) return;
        const used = capacity - Math.floor(savedNumber(shots, capacity, 0, capacity));
        if (used > 0) this._inPlay.ammoUsed[uuid] = used;
        else delete this._inPlay.ammoUsed[uuid];
    }

    private static _damagePerShot(weapon: IEquipmentItem): number {
        if (weapon.damageClusters && weapon.damagePerCluster) return weapon.damageClusters * weapon.damagePerCluster;
        if (typeof weapon.damage === "number") return weapon.damage;
        return weapon.damage?.short ?? 0;
    }

    /**
     * The damage of all the explosive ammunition left in a hex: each bin's shots times the Damage Value of one
     * shot (TO:AR p.118; TW p.125). A bin with no weapon on the building to fire it cannot be valued.
     */
    public getAmmunitionExplosionDamage(hex: number): number {
        let total = 0;
        for (const bin of this._equipment.filter((mount) => mount.hex === hex && mount.item.isAmmo && mount.item.explosive)) {
            const weapon = this._binWeapon(bin);
            if (weapon) total += this.getAmmoShots(bin.item.uuid || "") * Building._damagePerShot(weapon);
        }
        return total;
    }

    /**
     * Resolves a roll on the Advanced Building Critical Hits Table (TO:AR pp.118-119). `roll` is the 2D6 result,
     * `die` the 1D6 that picks the side of a split result or who chooses the weapon. A successful aimed shot
     * adds 2. A result with nothing in the hex for it to affect is no critical hit.
     */
    public resolveCriticalHit(hex: number, roll: number, die: number, aimedShot: boolean = false): string[] {
        if (hex < 1 || hex > this._hexes || this.isHexDestroyed(hex)) return [];
        const state = this._hexState(hex);
        const total = Math.min(12, Math.floor(savedNumber(roll, 2, 2, 12)) + (aimedShot ? 2 : 0));
        const d6 = Math.floor(savedNumber(die, 1, 1, 6));
        const row = BUILDING_CRITICAL_HITS.find((entry) => total >= entry.min && total <= entry.max) ?? BUILDING_CRITICAL_HITS[0];
        const head = `Critical hit roll ${total}${aimedShot ? " (aimed shot +2)" : ""}: ${row.name}`;
        const none = (what: string): string[] => [`${head}. No ${what} in the hex: no critical hit`];
        const chooser = d6 <= 3 ? "the building's player chooses" : "the attacker chooses";
        const weapons = this.getWorkingWeapons(hex);
        const anyWeapons = this._equipment.some((mount) => mount.hex === hex && Building._isWeapon(mount.item));
        const hasTurret = this._equipment.some((mount) => mount.hex === hex && mount.turret);

        if (total <= 5) return [head];
        if (total === 6) {
            const ready = weapons.filter((mount) => !this.hasMalfunction(mount.item.uuid || ""));
            if (ready.length === 0) return none("working weapon");
            if (ready.length === 1) {
                this.setMalfunction(ready[0].item.uuid || "", true);
                return [`${head}. ${ready[0].item.name} cannot fire until the gunners spend a Weapon Attack Phase clearing it`];
            }
            return [`${head}. 1D6 ${d6}: ${chooser} the weapon; mark its malfunction below`];
        }
        if (total === 7) {
            if (!anyWeapons || state.gunnersKilled) return none("gunners");
            state.gunnersStunned += 1;
            return [`${head}. The hex takes no actions next turn${state.gunnersStunned > 1 ? ` (${state.gunnersStunned} turns in all)` : ""}`];
        }
        if (total === 8) {
            if (weapons.length === 0) return none("working weapon");
            if (weapons.length === 1) return [head, ...this.setMountDestroyed(weapons[0].item.uuid || "", true, true)];
            return [`${head}. 1D6 ${d6}: ${chooser} the weapon; mark it destroyed below`];
        }
        if (total === 9) {
            if (!anyWeapons || state.gunnersKilled) return none("gunners");
            state.gunnersKilled = true;
            return [`${head}. No weapons fire from this hex for the rest of the scenario`];
        }
        if (total === 10) {
            if (!hasTurret) return none("turret");
            if (state.turretLocked) return [`${head}. The turret is already locked: no further effect`];
            // A second Turret Jam is a Turret Locks result, whether or not the first was cleared.
            const locks = d6 >= 4 || state.turretJams > 0;
            if (d6 <= 3) state.turretJams += 1;
            if (locks) {
                state.turretLocked = true;
                state.turretJammed = false;
                return [`${head}. 1D6 ${d6}: ${d6 >= 4 ? "Turret Locked" : "a second Turret Jam locks the turret"} in its facing for the rest of the game`];
            }
            state.turretJammed = true;
            return [`${head}. 1D6 ${d6}: Turret Jammed in its facing until the gunners spend a Weapon Attack Phase fixing it`];
        }
        if (total === 11) {
            const bins = this._equipment.filter((mount) => mount.hex === hex && mount.item.isAmmo && this.getAmmoShots(mount.item.uuid || "") > 0);
            if (bins.length === 0 || state.ammoExploded) return none("ammunition");
            const rated = this.getAmmunitionExplosionDamage(hex);
            const damage = this.hasCASE(hex) ? Math.floor(rated / 10) : rated;
            state.ammoExploded = true;
            return [
                `${head}. All the hex's ammunition is lost: ${rated} damage${damage !== rated ? `, ${damage} with CASE` : ""}`,
                ...(damage > 0 ? this._damageCF(hex, damage) : []),
            ];
        }
        const others = this._equipment.filter((mount) => mount.hex === hex && !mount.item.isAmmo && !Building._isWeapon(mount.item) && !this.isMountDestroyed(mount.item.uuid || ""));
        if (others.length === 0) return none("other equipment");
        if (others.length === 1) return [head, ...this.setMountDestroyed(others[0].item.uuid || "", true)];
        return [`${head}. Pick one of the hex's other items at random and mark it inoperative below`];
    }

    // Saving and loading --------------------------------------------------------------------------------------

    // The play state worth saving: hexes and items that still exist, with nothing for an untouched building.
    private _exportInPlay(): IBuildingInPlay | undefined {
        if (!this.isDamaged() && !this._inPlay.hexes.some((state) => state.turnStartCF !== null)) return undefined;
        const uuids = new Set(this._equipment.map((mount) => mount.item.uuid || ""));
        const hexes: IBuildingHexInPlay[] = [];
        for (let hex = 1; hex <= this._hexes; hex++) hexes.push({ ...this._peekHex(hex) });
        const ammoUsed: Record<string, number> = {};
        for (const [uuid, used] of Object.entries(this._inPlay.ammoUsed)) if (uuids.has(uuid) && used > 0) ammoUsed[uuid] = used;
        return {
            hexes,
            destroyed: this._inPlay.destroyed.filter((uuid) => uuids.has(uuid)),
            malfunctions: this._inPlay.malfunctions.filter((uuid) => uuids.has(uuid)),
            ammoUsed,
        };
    }

    // Reads saved play state field by field; anything that is not what it should be is left at full strength.
    private _importInPlay(raw: unknown): void {
        this._inPlay = newInPlay();
        if (!isPlainObject(raw)) return;
        const uuids = new Set(this._equipment.map((mount) => mount.item.uuid || ""));
        const hexes = Array.isArray(raw.hexes) ? raw.hexes.slice(0, this._hexes) : [];
        hexes.forEach((entry, index) => {
            const state = this._hexState(index + 1);
            if (!isPlainObject(entry)) return;
            state.armorDamage = Math.floor(savedNumber(entry.armorDamage, 0, 0, this.getArmorPoints()));
            state.cfDamage = Math.floor(savedNumber(entry.cfDamage, 0, 0, this._cf));
            state.gunnersKilled = entry.gunnersKilled === true;
            state.gunnersStunned = Math.floor(savedNumber(entry.gunnersStunned, 0, 0, 99));
            state.turretJams = Math.floor(savedNumber(entry.turretJams, 0, 0, 99));
            state.turretLocked = entry.turretLocked === true;
            state.turretJammed = entry.turretJammed === true && !state.turretLocked;
            state.ammoExploded = entry.ammoExploded === true;
            state.turnStartCF = typeof entry.turnStartCF === "number" ? Math.floor(savedNumber(entry.turnStartCF, this._cf, 0, this._cf)) : null;
        });
        const list = (value: unknown): string[] => Array.isArray(value)
            ? Array.from(new Set(value.filter((entry): entry is string => typeof entry === "string" && uuids.has(entry)))).slice(0, MAX_BUILDING_EQUIPMENT) : [];
        this._inPlay.destroyed = list(raw.destroyed);
        this._inPlay.malfunctions = list(raw.malfunctions).filter((uuid) => !this._inPlay.destroyed.includes(uuid));
        if (isPlainObject(raw.ammoUsed)) {
            for (const mount of this._equipment) {
                const uuid = mount.item.uuid || "";
                const used = Object.prototype.hasOwnProperty.call(raw.ammoUsed, uuid) ? raw.ammoUsed[uuid] : undefined;
                if (mount.item.isAmmo && typeof used === "number") {
                    const clean = Math.floor(savedNumber(used, 0, 0, this.getAmmoCapacity(uuid)));
                    if (clean > 0) this._inPlay.ammoUsed[uuid] = clean;
                }
            }
        }
    }

    public export(noInPlayVariables: boolean = false): IBuildingExport {
        const inPlay = noInPlayVariables ? undefined : this._exportInPlay();
        return {
            ...(inPlay ? { inPlay } : {}),
            gunnery: this._gunnery,
            uuid: this._uuid,
            lastUpdated: this.lastUpdated,
            name: this._name,
            tech: this._tech.tag,
            era: this._era.tag,
            classification: this._classification.tag,
            type: this._type.tag,
            cf: this._cf,
            hexes: this._hexes,
            levels: this._levels,
            armorTons: this._armorTons,
            heatSinkType: this._heatSinkType.tag,
            heatSinks: this._heatSinks,
            generator: this._generator?.tag ?? "",
            unspecifiedEquipment: this._unspecifiedEquipment,
            equipment: this._equipment.map((mount) => ({ tag: mount.item.tag, uuid: mount.item.uuid, hex: mount.hex, ...(mount.turret ? { turret: true } : {}) })),
        };
    }

    public exportJSON(): string { return JSON.stringify(this.export()); }

    /** Problems found in the last import: fields that were invalid and replaced, or entries that were dropped. */
    public getImportIssues(): string[] { return this._importIssues; }

    /**
     * Loads a saved building. Saves can come from other people's backup files, so every field is type-checked,
     * allowlisted or clamped through the setters, and anything dropped is recorded in getImportIssues().
     * Never spread or Object.assign the parsed JSON into class state.
     */
    public importJSON(json: string): void {
        this._importIssues = [];
        this._inPlay = newInPlay();
        const issue = (text: string) => { if (this._importIssues.length < 50) this._importIssues.push(text); };
        try {
            const parsed: unknown = JSON.parse(json);
            if (!isPlainObject(parsed)) {
                issue("The saved building is not an object");
                return;
            }
            const saved = parsed as Partial<Record<keyof IBuildingExport, unknown>>;
            this._uuid = savedString(saved.uuid).slice(0, 100) || generateUUID();
            const updated = typeof saved.lastUpdated === "string" || typeof saved.lastUpdated === "number" ? new Date(saved.lastUpdated) : new Date();
            this.lastUpdated = Number.isNaN(updated.getTime()) ? new Date() : updated;
            if (saved.name !== undefined && typeof saved.name !== "string") issue("Ignored a name that is not text");
            this.setName(savedString(saved.name));
            this.setTech(savedString(saved.tech));
            this.setEra(savedString(saved.era));

            const classificationTag = savedString(saved.classification);
            if (classificationTag && !findBuildingClassification(classificationTag)) issue(`Replaced unknown classification "${classificationTag.slice(0, 40)}" with ${BUILDING_CLASSIFICATIONS[0].name}`);
            this._classification = findBuildingClassification(classificationTag) ?? BUILDING_CLASSIFICATIONS[0];
            const typeTag = savedString(saved.type);
            const type = this._classification.types.find((entry) => entry.tag === typeTag);
            if (typeTag && !type) issue(`Replaced building type "${typeTag.slice(0, 40)}" with ${this._classification.types[0].name}`);
            this._type = type ?? this._classification.types[0];
            for (const key of ["cf", "hexes", "levels", "armorTons", "heatSinks"] as const) {
                if (saved[key] !== undefined && typeof saved[key] !== "number") issue(`Ignored a ${key} value that is not a number`);
            }
            const cf = savedNumber(saved.cf, this._type.maxCF, 0, 100000);
            this._cf = this._type.maxCF;
            this.setCF(cf);
            if (this._cf !== Math.floor(cf)) issue(`Construction Factor set to ${this._cf}`);
            this._hexes = 1;
            this.setHexes(savedNumber(saved.hexes, 1, 1, 100000));
            this._levels = 1;
            this.setLevels(savedNumber(saved.levels, 1, 1, 100000));
            this._armorTons = 0;
            this.setArmorTons(savedNumber(saved.armorTons, 0, 0, 100000));
            this._heatSinkType = mechHeatSinkTypes[0];
            this.setHeatSinkType(savedString(saved.heatSinkType));
            this.setHeatSinks(savedNumber(saved.heatSinks, 0, 0, 100000));
            const generatorTag = savedString(saved.generator);
            this.setGenerator(generatorTag);
            if (generatorTag && this._generator?.tag !== generatorTag) issue(`Dropped generator "${generatorTag.slice(0, 40)}"`);
            this.setUnspecifiedEquipment(saved.unspecifiedEquipment === true);

            this._equipment = [];
            if (saved.equipment !== undefined && !Array.isArray(saved.equipment)) issue("Ignored an equipment list that is not a list");
            const entries = Array.isArray(saved.equipment) ? saved.equipment : [];
            if (entries.length > MAX_BUILDING_EQUIPMENT) issue(`Kept the first ${MAX_BUILDING_EQUIPMENT} of ${entries.length} equipment entries`);
            const catalog = this._catalog();
            for (const entry of entries.slice(0, MAX_BUILDING_EQUIPMENT)) {
                if (!isPlainObject(entry) || typeof entry.tag !== "string") {
                    issue("Skipped an equipment entry that could not be read");
                    continue;
                }
                const catalogItem = findByTag(catalog, entry.tag);
                if (!catalogItem) {
                    issue(`Skipped unknown equipment "${entry.tag.slice(0, 60)}"`);
                    continue;
                }
                this._equipment.push(this._newMount(catalogItem, entry.hex, entry.turret, entry.uuid));
            }
            if (saved.gunnery !== undefined && typeof saved.gunnery !== "number") issue("Ignored a gunnery skill that is not a number");
            this._gunnery = Math.floor(savedNumber(saved.gunnery, 4, 0, 8));
            this._importInPlay(saved.inPlay);
        } catch (error) {
            issue("The saved building could not be read completely");
            console.error("Building importJSON failed:", error);
        }
    }
}

export { BUILDING_CLASSIFICATIONS, BUILDING_GENERATORS };
