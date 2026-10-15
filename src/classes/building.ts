import { generateUUID } from "../utils/generateUUID";
import {
    BUILDING_ARMOR_COST_PER_TON, BUILDING_ARMOR_POINTS_PER_TON, BUILDING_CLASSIFICATIONS, BUILDING_GENERATORS, BUILDING_MAX_UNLIMITED_HEXES,
    BUILDING_UNSPECIFIED_EQUIPMENT_COST_PER_CF, findBuildingClassification, findBuildingGenerator, HANGAR_CAPACITY_PER_FOUR_LEVELS, BUILDING_CAPITAL_SCALE, OPEN_SPACE_MAX_CAPACITY,
    IBuildingClassification, IBuildingGenerator, IBuildingType,
} from "../data/building-classifications";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { btTechOptions } from "../data/tech-options";
import { btEraOptions, findEraByTag, getClosestEraForTech, getErasForTech } from "../data/era-options";
import { CUSTOM_HOMEBREW_RULES_LEVEL, getEffectiveIntroduction, getEquipmentListByTech, getEquipmentRulesLevel, isEquipmentWithinRulesLevel } from "../data/equipment-registry";
import { findByTag } from "../data/tag-match";
import { IInfantryWeapon, INFANTRY_POWER_CELL_COST, findInfantryWeapon, getInfantryClipCost, infantryWeapons, isInfantryWeaponAvailable } from "../data/infantry-weapons";
import { capitalWeapons } from "../data/capital-weapons";
import { subCapitalWeapons } from "../data/sub-capital-weapons";
import { ICapitalWeapon, IEquipmentItem, IEras, IHeatSync, ITechDates, ITechOptions } from "../data/data-interfaces";

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
    /** True for a weapon on an automated control system: no gunners, a fixed Gunnery of 5 (TO:AR p.131). */
    automated: boolean;
}

/** Light and Medium weapons a hex may mount for each level of the building (TO:AR p.129). */
export const BUILDING_LIGHT_WEAPONS_PER_HEX_LEVEL = 6;
export const MAX_BUILDING_LIGHT_WEAPONS = 600;
export const MAX_BUILDING_EXTRA_CLIPS = 999;
export type BuildingLightMountType = "fixed" | "pintle" | "turret";

/** A Light or Medium weapon: one from the Conventional Infantry Weapons Table (TO:AR p.129; TM p.136). */
export interface IBuildingLightMount {
    uuid: string;
    weapon: IInfantryWeapon;
    hex: number;
    mount: BuildingLightMountType;
    /** Clips carried beyond the free one the weapon comes with (TM p.136). */
    clips: number;
}

export interface IBuildingLightWeaponExport {
    tag: string;
    uuid?: string;
    hex?: number;
    mount?: string;
    clips?: number;
}

export const MAX_BUILDING_CAPITAL_WEAPONS = 100;
export const MAX_BUILDING_CAPITAL_SHOTS = 9999;
/** Gunners for each capital weapon (TO:AR p.130). */
export const BUILDING_CAPITAL_WEAPON_GUNNERS = 7;
/** Fire control and stabilizers: 10 percent more weight for a capital weapon that is not a missile launcher (TO:AUE p.83). */
export const BUILDING_CAPITAL_FIRE_CONTROL = 0.1;
/** Hexes next to the weapon's own that may share its weight (TO:AUE p.83). */
export const MAX_BUILDING_CAPITAL_SHARED_HEXES = 6;
/** The missiles an AR-10 fires: the standard ones only (TM p.342). */
const AR10_MISSILE_TAGS = ["killer-whale", "white-shark", "barracuda"];
const BUILDING_CAPITAL_CATALOG: ICapitalWeapon[] = [...capitalWeapons, ...subCapitalWeapons];
export const findBuildingCapitalWeapon = (tag: string): ICapitalWeapon | undefined => BUILDING_CAPITAL_CATALOG.find((weapon) => weapon.tag === tag);

/** A capital or sub-capital weapon, with its ammunition (TO:AR p.129; TO:AUE p.83). */
export interface IBuildingCapitalMount {
    uuid: string;
    weapon: ICapitalWeapon;
    hex: number;
    /** Hexes next to the weapon's own that share its weight evenly with it. */
    sharedHexes: number[];
    /** Shots carried, by the tag of the weapon whose ammunition they are (an AR-10 carries three kinds). */
    shots: Record<string, number>;
    /**
     * Custom rule (user, 2026-10-07): the hex of an ammunition bunker next to the weapon that holds its
     * ammunition, shared with the other capital weapons around it. Null keeps it in the weapon's own hex.
     */
    ammoHex: number | null;
}

export interface IBuildingCapitalWeaponExport {
    tag: string;
    uuid?: string;
    hex?: number;
    sharedHexes?: number[];
    shots?: Record<string, number>;
    ammoHex?: number;
}

export interface IBuildingEquipmentExport {
    tag: string;
    uuid?: string;
    hex?: number;
    turret?: boolean;
    automated?: boolean;
}

export type BuildingCeilings = "standard" | "high" | "low";
export type BuildingSubsurface = "none" | "underground" | "underwater";
/** An industrial elevator: the hex it fills, the tons it lifts and the levels it reaches above the ground level. */
export interface IBuildingElevator {
    hex: number;
    capacity: number;
    levels: number;
}

/** Automated weapons fire with a fixed Gunnery skill of 5 (TO:AR p.131). */
export const BUILDING_AUTOMATED_GUNNERY = 5;
export const MAX_BUILDING_DOORS = 60;
export const MAX_BUILDING_ELEVATORS = 20;
/** A ton of structure given to liquid storage holds 0.91 tons (TO:AR p.134). */
export const BUILDING_LIQUID_STORAGE_FACTOR = 0.91;
/** Final cost multipliers for structural modifications (TO:AR p.208). */
export const BUILDING_COST_MULTIPLIERS = { sealed: 1.5, heavyMetal: 1.25, ceilings: 1.1, subsurface: 5, tunnel: 1.875, openSpace: 2.5 };
/** Sealed Building Breach Table: a 2D6 roll of 10+ breaches, with these modifiers by building type (TO:AR p.135). */
export const BUILDING_BREACH_TARGET = 10;
export const BUILDING_BREACH_MODIFIERS: Record<string, number> = { light: 2, medium: 0, heavy: -2, hardened: -4 };

export interface IBuildingExport {
    /** The gunners' Gunnery skill; absent in saves from before buildings joined the roster. */
    gunnery?: number;
    /** Damage and critical hits taken in play; left out of a design save. */
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
    // Structural modifications and fittings (TO:AR pp.131-139); absent in older saves.
    sealed?: boolean;
    openSpace?: boolean;
    heavyMetal?: boolean;
    ceilings?: string;
    subsurface?: string;
    /** Levels below the ground or the water's surface. */
    depth?: number;
    tunnel?: boolean;
    /** Large doors, each by its height in levels. */
    doors?: number[];
    elevators?: IBuildingElevator[];
    /** Tons of capacity given to liquid fuel or chemical storage, across the building. */
    liquidStorage?: number;
    /** Hexes (times levels) of other buildings the generator also powers. */
    poweredHexes?: number;
    /** Light and Medium (infantry) weapons; absent in older saves. */
    lightWeapons?: IBuildingLightWeaponExport[];
    /** Capital and sub-capital weapons; absent in older saves. */
    capitalWeapons?: IBuildingCapitalWeaponExport[];
}

export interface IBuildingHexLoad {
    hex: number;
    armor: number;
    equipment: number;
    /** Light and Medium weapons with their extra clips, and the hex's pintle mounts. */
    lightWeapons: number;
    /** The hex's share of capital weapons and their fire control, and the ammunition stored in it. */
    capitalWeapons: number;
    turret: number;
    powerAmplifiers: number;
    heatSinks: number;
    generator: number;
    /** Industrial elevators and the hex's share of liquid storage. */
    fittings: number;
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
const round5 = (value: number): number => Math.round(value * 100000) / 100000;
const roundUpHalf = (tons: number): number => Math.ceil(tons * 2 - 1e-9) / 2 || 0;
const roundUpTenth = (tons: number): number => Math.ceil(tons * 10 - 1e-9) / 10 || 0;
const roundUpKilogram = (tons: number): number => Math.ceil(tons * 1000 - 1e-6) / 1000 || 0;
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
    private _lightWeapons: IBuildingLightMount[] = [];
    private _capitalWeapons: IBuildingCapitalMount[] = [];
    private _sealed: boolean = false;
    private _openSpace: boolean = false;
    private _heavyMetal: boolean = false;
    private _ceilings: BuildingCeilings = "standard";
    private _subsurface: BuildingSubsurface = "none";
    private _depth: number = 1;
    private _tunnel: boolean = false;
    private _doors: number[] = [];
    private _elevators: IBuildingElevator[] = [];
    private _liquidStorage: number = 0;
    private _poweredHexes: number = 0;
    private _gunnery: number = 4;
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
        this._clampFittings();
    }

    // Drops modifications the classification, type or size no longer allows.
    private _clampFittings(): void {
        if (!this.canMountLightWeapons()) this._lightWeapons = [];
        for (const mount of this._lightWeapons) mount.hex = Math.min(this._hexes, Math.max(1, mount.hex));
        if (!this.canMountCapitalWeapons()) this._capitalWeapons = [];
        for (const mount of this._capitalWeapons) {
            mount.hex = Math.min(this._hexes, Math.max(1, mount.hex));
            mount.sharedHexes = mount.sharedHexes.filter((hex) => hex <= this._hexes && hex !== mount.hex);
            if (mount.ammoHex !== null && (mount.ammoHex > this._hexes || mount.ammoHex === mount.hex)) mount.ammoHex = null;
        }
        if (!this.canBeSubsurface()) this._subsurface = "none";
        if (!this.canBeTunnel()) this._tunnel = false;
        if (this.isSealedByDefault()) this._sealed = true;
        else if (!this.canSeal()) this._sealed = false;
        else if (this._subsurface === "underwater") this._sealed = true;
        if (!this.canHaveOpenSpace()) this._openSpace = false;
        if (!this.canHaveHeavyMetalSuperstructure()) this._heavyMetal = false;
        if (!this.canSetCeilings()) this._ceilings = "standard";
        if (!this.canMountDoors()) this._doors = [];
        this._doors = this._doors.map((height) => Math.min(this._levels, Math.max(1, height)));
        this._elevators = this.canMountElevators()
            ? this._elevators.map((elevator) => ({
                hex: Math.min(this._hexes, Math.max(1, elevator.hex)),
                capacity: Math.min(this.getStandardCF(), Math.max(1, elevator.capacity)),
                levels: Math.min(this._levels, Math.max(1, elevator.levels)),
            })) : [];
        if (this._classification.capacity === "none" || this._tunnel) this._liquidStorage = 0;
        if (!this._generator) this._poweredHexes = 0;
        this._hexes = Math.min(this.getMaxHexes(), this._hexes);
        this._levels = Math.min(this.getMaxLevels(), this._levels);
        this._armorTons = Math.min(this._armorTons, this.getMaxArmorTons());
    }

    public getCF(): number { return this._cf; }
    /** A Castles Brian building: its Construction Factor and armor are capital-scale points (TO:AR pp.113, 127). */
    public isCapitalScale(): boolean { return this._classification.capitalScale === true; }
    /** Standard-scale points, and tons, in one point of this building's Construction Factor. */
    public getCFScale(): number { return this.isCapitalScale() ? BUILDING_CAPITAL_SCALE : 1; }
    /** The Construction Factor in standard-scale points: what it supports in tons (TO:AR p.127). */
    public getStandardCF(): number { return this._cf * this.getCFScale(); }
    /** The Damage Scaling column in plain words (TO:AR pp.113, 124). */
    public getDamageScalingText(): string {
        if (this.isCapitalScale()) return "Capital: damage to the building is divided by 10, damage the building does is multiplied by 10";
        return `x${this._classification.damageToBuilding} to the building, x${this._classification.damageToUnits} to units the building damages`;
    }
    public setCF(cf: number): number {
        this._cf = Math.min(this._type.maxCF, Math.max(this._type.minCF, Math.floor(Number.isFinite(cf) ? cf : this._cf)));
        this._clampFittings();
        return this._cf;
    }

    /** Hexes covered, or hexsides for a wall or fence. */
    public getHexes(): number { return this._hexes; }
    /** An underground building, other than a Castles Brian, may be half the size of one on the surface, rounded up (TO:AR p.138). */
    public getMaxHexes(): number {
        const max = this._type.maxHexes ?? BUILDING_MAX_UNLIMITED_HEXES;
        return this._subsurface === "underground" && this._type.maxHexes !== null && !this.isCapitalScale() ? Math.ceil(max / 2) : max;
    }
    public setHexes(hexes: number): number {
        this._hexes = Math.min(this.getMaxHexes(), Math.max(1, Math.floor(Number.isFinite(hexes) ? hexes : this._hexes)));
        for (const mount of this._equipment) mount.hex = Math.min(this._hexes, mount.hex);
        this._clampFittings();
        return this._hexes;
    }
    public getHexLabel(plural: boolean = false): string {
        return this._classification.perHexside ? (plural ? "hexsides" : "hexside") : (plural ? "hexes" : "hex");
    }

    public getLevels(): number { return this._levels; }
    /** A bridge has no height of its own: it is one level for these rules. */
    public getMaxLevels(): number {
        const max = this._type.maxLevels ?? 1;
        return this._subsurface === "underground" && !this.isCapitalScale() ? Math.ceil(max / 2) : max;
    }
    public setLevels(levels: number): number {
        this._levels = Math.min(this.getMaxLevels(), Math.max(1, Math.floor(Number.isFinite(levels) ? levels : this._levels)));
        this._clampFittings();
        return this._levels;
    }

    /**
     * Internal weight capacity of one hex: the Construction Factor times the levels. A hangar triples that, to
     * no more than 600 tons for every 4 levels or fraction; tents, fences and bridges carry nothing (TO:AR p.127).
     * A point of capital-scale Construction Factor carries 10 tons (TO:AR p.127); open-space construction holds
     * no more than 600 tons whatever the Construction Factor (TO:AR p.137).
     */
    public getCapacityPerHex(): number {
        if (this._classification.capacity === "none") return 0;
        const base = this.getStandardCF() * this._levels;
        let capacity = this._classification.capacity === "hangar" ? Math.min(base * 3, HANGAR_CAPACITY_PER_FOUR_LEVELS * Math.ceil(this._levels / 4)) : base;
        if (this._openSpace) capacity = Math.min(capacity, OPEN_SPACE_MAX_CAPACITY);
        // A heavy metal superstructure takes a quarter of it, rounded down (TO:AR p.135).
        return this._heavyMetal ? Math.floor(capacity * 0.75) : capacity;
    }

    // Structural modifications (TO:AR pp.134-139) ----------------------------------------------------------------

    /** Hangars, standard buildings, fortresses and gun emplacements may be environmentally sealed (TO:AR p.135). */
    public canSeal(): boolean { return ["hangar", "standard", "fortress", "gun-emplacement"].includes(this._classification.tag); }
    /** Castles Brian are sealed automatically, at no added cost (TO:AR pp.116, 135). */
    public isSealedByDefault(): boolean { return this.isCapitalScale(); }
    public isSealed(): boolean { return this._sealed; }
    /** An underwater building is always sealed (TO:AR p.138). */
    public setSealed(sealed: boolean): boolean {
        this._sealed = this.isSealedByDefault() || (this.canSeal() && (sealed || this._subsurface === "underwater"));
        return this._sealed;
    }

    /**
     * Open-space construction, for Castles Brian only: a man-made cave over other buildings, holding 600 tons
     * at most, all on the ground level, with nothing on the roof (TO:AR p.137).
     */
    public canHaveOpenSpace(): boolean { return this.isCapitalScale(); }
    public isOpenSpace(): boolean { return this._openSpace; }
    public setOpenSpace(openSpace: boolean): boolean {
        this._openSpace = openSpace && this.canHaveOpenSpace();
        this._clampFittings();
        return this._openSpace;
    }

    /** Heavy and Hardened buildings other than tents and fences (TO:AR p.135). */
    public canHaveHeavyMetalSuperstructure(): boolean {
        return !["tent", "fence"].includes(this._classification.tag) && ["heavy", "hardened"].includes(this._type.tag);
    }
    public hasHeavyMetalSuperstructure(): boolean { return this._heavyMetal; }
    public setHeavyMetalSuperstructure(heavyMetal: boolean): boolean {
        this._heavyMetal = heavyMetal && this.canHaveHeavyMetalSuperstructure();
        return this._heavyMetal;
    }

    /** Standard buildings, fortresses and Castles Brian may have high or low ceilings (TO:AR p.135). */
    public canSetCeilings(): boolean { return ["standard", "fortress", "castles-brian"].includes(this._classification.tag); }
    public getCeilings(): BuildingCeilings { return this._ceilings; }
    public setCeilings(ceilings: string): BuildingCeilings {
        this._ceilings = this.canSetCeilings() && (ceilings === "high" || ceilings === "low") ? ceilings : "standard";
        return this._ceilings;
    }

    /** Standard buildings, hangars (and tunnels), fortresses and Castles Brian may be built below ground or water (TO:AR p.138). */
    public canBeSubsurface(): boolean { return ["standard", "hangar", "fortress", "castles-brian"].includes(this._classification.tag); }
    public getSubsurface(): BuildingSubsurface { return this._subsurface; }
    public setSubsurface(subsurface: string): BuildingSubsurface {
        this._subsurface = this.canBeSubsurface() && (subsurface === "underground" || subsurface === "underwater") ? subsurface : "none";
        this._clampFittings();
        return this._subsurface;
    }
    /** Levels between the building's top and the surface of the ground or water. */
    public getDepth(): number { return this._depth; }
    public setDepth(depth: number): number {
        this._depth = Math.floor(savedNumber(depth, this._depth, 1, 1000));
        return this._depth;
    }

    /** A tunnel is a hangar that carries no equipment and ends in doors (TO:AR p.139). */
    public canBeTunnel(): boolean { return this._classification.tag === "hangar"; }
    public isTunnel(): boolean { return this._tunnel; }
    public setTunnel(tunnel: boolean): boolean {
        this._tunnel = tunnel && this.canBeTunnel();
        this._clampFittings();
        return this._tunnel;
    }

    /** Large doors go in hangars, fortresses, Castles Brian, standard buildings, walls and fences, and weigh nothing (TO:AR p.136). */
    public canMountDoors(): boolean { return ["hangar", "fortress", "castles-brian", "standard", "wall", "fence"].includes(this._classification.tag); }
    public getDoors(): number[] { return this._doors; }
    public addDoor(height: number = 1): number[] {
        if (this.canMountDoors() && this._doors.length < MAX_BUILDING_DOORS) this._doors.push(Math.floor(savedNumber(height, 1, 1, this._levels)));
        return this._doors;
    }
    public setDoorHeight(index: number, height: number): void {
        if (index >= 0 && index < this._doors.length) this._doors[index] = Math.floor(savedNumber(height, this._doors[index], 1, this._levels));
    }
    public removeDoor(index: number): void { this._doors.splice(index, 1); }

    /** Industrial elevators need a level above the ground to reach (TO:AR pp.135-136). */
    public canMountElevators(): boolean { return this._classification.capacity !== "none" && !this._tunnel; }
    public getElevators(): IBuildingElevator[] { return this._elevators; }
    public addElevator(hex: number = 1, capacity: number = 20, levels: number = 1): IBuildingElevator[] {
        if (this.canMountElevators() && this._elevators.length < MAX_BUILDING_ELEVATORS) {
            this._elevators.push({ hex: 1, capacity: 1, levels: 1 });
            this.setElevator(this._elevators.length - 1, hex, capacity, levels);
        }
        return this._elevators;
    }
    /** An elevator lifts no more than the Construction Factor and reaches no higher than the roof. */
    public setElevator(index: number, hex: number, capacity: number, levels: number): void {
        const elevator = this._elevators[index];
        if (!elevator) return;
        elevator.hex = Math.floor(savedNumber(hex, elevator.hex, 1, this._hexes));
        elevator.capacity = Math.floor(savedNumber(capacity, elevator.capacity, 1, this.getStandardCF()));
        elevator.levels = Math.floor(savedNumber(levels, elevator.levels, 1, this._levels));
    }
    public removeElevator(index: number): void { this._elevators.splice(index, 1); }
    /** A ton for every 20 tons lifted, rounded up, times the levels reached above the ground level (TO:AR p.136). */
    public static getElevatorWeight(elevator: IBuildingElevator): number { return Math.ceil(elevator.capacity / 20) * elevator.levels; }
    public getElevatorWeight(hex?: number): number {
        return this._elevators.filter((elevator) => hex === undefined || elevator.hex === hex).reduce((sum, elevator) => sum + Building.getElevatorWeight(elevator), 0);
    }

    /** Tons of capacity given to liquid fuel or chemical storage, spread evenly over the hexes (TO:AR p.134). */
    public getLiquidStorage(): number { return this._liquidStorage; }
    public setLiquidStorage(tons: number): number {
        this._liquidStorage = this._classification.capacity === "none" || this._tunnel ? 0 : Math.floor(savedNumber(tons, 0, 0, Math.max(0, this.getTotalCapacity())));
        return this._liquidStorage;
    }
    /** What the tanks hold: 0.91 tons for each ton given to them. */
    public getLiquidCapacity(): number { return round3(this._liquidStorage * BUILDING_LIQUID_STORAGE_FACTOR); }

    /** Hexes, times levels, of other buildings this building's generator also powers (TO:AR p.132). */
    public getPoweredHexes(): number { return this._poweredHexes; }
    public setPoweredHexes(hexes: number): number {
        this._poweredHexes = this._generator ? Math.floor(savedNumber(hexes, 0, 0, 100000)) : 0;
        return this._poweredHexes;
    }

    /** The structure cost multiplier: every modification's figure multiplied together (TO:AR p.208). */
    public getStructureCostMultiplier(): number {
        return round5((this._sealed && !this.isSealedByDefault() ? BUILDING_COST_MULTIPLIERS.sealed : 1) * (this._heavyMetal ? BUILDING_COST_MULTIPLIERS.heavyMetal : 1)
            * (this._openSpace ? BUILDING_COST_MULTIPLIERS.openSpace : 1)
            * (this._ceilings !== "standard" ? BUILDING_COST_MULTIPLIERS.ceilings : 1) * (this._subsurface !== "none" ? BUILDING_COST_MULTIPLIERS.subsurface : 1)
            * (this._tunnel ? BUILDING_COST_MULTIPLIERS.tunnel : 1));
    }
    public getTotalCapacity(): number {
        const total = this.getCapacityPerHex() * this._hexes;
        return this._openSpace ? Math.min(total, OPEN_SPACE_MAX_CAPACITY) : total;
    }

    // Step 2: armor (TO:AR p.128) ------------------------------------------------------------------------------

    public canMountArmor(): boolean { return this._classification.armor; }
    public getArmorPointsPerTon(): number { return BUILDING_ARMOR_POINTS_PER_TON[this.getTechBase()]; }
    /** Armor points a hex may carry: the Construction Factor x 1, or x 2 for a Castles Brian, in the building's own scale (TO:AR p.113). */
    public getMaxArmorPoints(): number { return this.canMountArmor() ? this._cf * (this.isCapitalScale() ? 2 : 1) : 0; }
    /** Armor comes in full tons; the last ton may be only partly used. */
    public getMaxArmorTons(): number { return Math.ceil(this.getMaxArmorPoints() * this.getCFScale() / this.getArmorPointsPerTon()); }
    /** Tons of armor on each hex. */
    public getArmorTons(): number { return this._armorTons; }
    public setArmorTons(tons: number): number {
        this._armorTons = Math.min(this.getMaxArmorTons(), Math.max(0, Math.floor(Number.isFinite(tons) ? tons : 0)));
        return this._armorTons;
    }
    /** The Armor Factor of each hex. Capital-scale armor is the standard points / 10, rounded down (TO:AR p.128). */
    public getArmorPoints(): number { return Math.min(this.getMaxArmorPoints(), Math.floor(this._armorTons * this.getArmorPointsPerTon() / this.getCFScale())); }

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
     * a gun emplacement's CF / 3, rounded down; a fortress's CF / 10 for each level; a Castles Brian's
     * Construction Factor, undivided, for each level (TO:AR p.129, TO:AUE p.82).
     */
    public getHeavyWeaponLimitPerHex(): number {
        if (this._classification.heavyWeapons === "cf-per-level") return this._cf * this._levels;
        if (this._classification.heavyWeapons === "cf-third") return Math.floor(this._cf / 3);
        if (this._classification.heavyWeapons === "cf-tenth-per-level") return round3(this._cf / 10 * this._levels);
        return 0;
    }

    /**
     * Weapons a 'Mech or vehicle mounts, where the classification takes Heavy weapons, with their ammunition;
     * other equipment where DropShips or Support Vehicles may carry it (TO:AR pp.129, 131; TO:AUE p.82).
     */
    public isEquipmentAllowed(item: IEquipmentItem): boolean {
        if (this._classification.capacity === "none" || this._tunnel) return false;
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

    private _newMount(catalogItem: IEquipmentItem, hex: unknown, turret: unknown, uuid?: unknown, automated?: unknown): IBuildingMount {
        const freshId = typeof uuid !== "string" || !uuid || this._equipment.some((mount) => mount.item.uuid === uuid);
        // A deep copy: mounted items never share nested data with each other or the catalog.
        const item: IEquipmentItem = { ...JSON.parse(JSON.stringify(catalogItem)), uuid: freshId ? generateUUID() : uuid as string };
        return {
            item,
            hex: Math.floor(savedNumber(hex, 1, 1, this._hexes)),
            turret: turret === true && !item.isAmmo,
            automated: automated === true && Building.canAutomate(item),
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

    /**
     * Automated control systems take Heavy weapons other than artillery, and nothing fired without a Gunnery
     * Skill Roll, such as anti-missile systems and A- or B-Pods (TO:AR p.131).
     */
    public static canAutomate(item: IEquipmentItem): boolean {
        return Building.isHeavyWeapon(item) && !/artillery/i.test(`${item.category} ${item.name}`) && !/anti-missile|a-pod|b-pod/.test(item.tag);
    }
    public setEquipmentAutomated(uuid: string, automated: boolean): void {
        const mount = this._equipment.find((entry) => entry.item.uuid === uuid);
        if (mount) mount.automated = automated && Building.canAutomate(mount.item);
    }
    /** Tons of automated weapons; ammunition, heat sinks, amplifiers and turrets are not counted (TO:AR p.208). */
    public getAutomatedWeaponTons(): number {
        return round3(this._equipment.filter((mount) => mount.automated).reduce((sum, mount) => sum + (mount.item.weight || 0), 0));
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
            .reduce((sum, mount) => sum + (mount.item.weight || 0), 0)
            + this._lightWeapons.filter((mount) => mount.hex === hex && mount.mount === "turret").reduce((sum, mount) => sum + mount.weapon.weight / 1000, 0);
        return roundUpHalf(mounted * 0.1);
    }
    public hasTurret(): boolean { return this._equipment.some((mount) => mount.turret) || this._lightWeapons.some((mount) => mount.mount === "turret"); }

    // Capital and sub-capital weapons (TO:AR pp.129-130; TO:AUE p.83) ----------------------------------------------

    /** Only fortresses and Castles Brian carry capital weapons (TO:AR p.129). */
    public canMountCapitalWeapons(): boolean { return ["fortress", "castles-brian"].includes(this._classification.tag); }

    /** Capital missile, sub-capital missile and screen launchers: the weapons that need no fusion or fission power. */
    public static isCapitalMissileLauncher(weapon: ICapitalWeapon): boolean {
        return ["Capital Missile", "Sub-Capital Missile", "Screen Launcher"].includes(weapon.category);
    }
    public static isCapitalEnergyWeapon(weapon: ICapitalWeapon): boolean {
        return ["Naval Laser", "Naval PPC", "Sub-Capital Laser"].includes(weapon.category);
    }
    /** The weapons whose ammunition this one fires: its own, or the three standard missiles for an AR-10. */
    public static getCapitalAmmoTags(weapon: ICapitalWeapon): string[] {
        return weapon.tag === "ar-10-launcher" ? [...AR10_MISSILE_TAGS] : weapon.ammo ? [weapon.tag] : [];
    }

    /**
     * What a Mobile Structure may mount, or a tournament-legal DropShip (TO:AUE pp.82-83). Mass Drivers, for
     * WarShips and space stations alone, are left out (TO:AUE p.135).
     */
    public isCapitalWeaponAllowed(weapon: ICapitalWeapon): boolean {
        return this.canMountCapitalWeapons() && ((weapon.space.mobileStructure ?? 0) > 0 || (weapon.space.dropShip ?? -1) > 0);
    }

    /** In production for the building's technology base in the selected era, or a prototype where the rules level allows. */
    public getCapitalWeaponAvailability(weapon: ICapitalWeapon, rulesLevel: number = BUILDING_RULES_LEVEL): { available: boolean; asPrototype: boolean } {
        const mixed = this._tech.tag === "mis" || this._tech.tag === "mclan";
        const own: ITechDates = { ...(weapon.prototype ? { prototype: weapon.prototype } : {}), introduced: weapon.introduced, extinct: weapon.extinct, reintroduced: weapon.reintroduced };
        const candidates: ITechDates[] = [];
        if (weapon.techBase !== "clan" && (mixed || this.getTechBase() === "is")) candidates.push(own);
        if (weapon.techBase !== "is" && (mixed || this.getTechBase() === "clan")) candidates.push(weapon.clanDates ?? own);
        let asPrototype = false;
        for (const dates of candidates) {
            const availability = this._datesAvailability(dates, rulesLevel);
            if (availability.available && !availability.asPrototype) return { available: true, asPrototype: false };
            asPrototype = asPrototype || availability.asPrototype;
        }
        return { available: asPrototype, asPrototype };
    }

    /** Capital and sub-capital weapons the classification, technology base, era and rules level offer. */
    public getAvailableCapitalWeapons(rulesLevel: number = BUILDING_RULES_LEVEL): ICapitalWeapon[] {
        return BUILDING_CAPITAL_CATALOG.filter((weapon) => this.isCapitalWeaponAllowed(weapon)
            && weapon.rulesLevel <= Math.max(rulesLevel, BUILDING_RULES_LEVEL) && this.getCapitalWeaponAvailability(weapon, rulesLevel).available);
    }

    public getCapitalWeapons(): IBuildingCapitalMount[] { return this._capitalWeapons; }

    private _newCapitalMount(weapon: ICapitalWeapon, hex: unknown, sharedHexes: unknown, shots: unknown, uuid?: unknown, ammoHex?: unknown): IBuildingCapitalMount {
        const taken = (id: string) => this._capitalWeapons.some((mount) => mount.uuid === id) || this._lightWeapons.some((mount) => mount.uuid === id)
            || this._equipment.some((mount) => mount.item.uuid === id);
        const mount: IBuildingCapitalMount = {
            uuid: typeof uuid === "string" && uuid && !taken(uuid) ? uuid : generateUUID(),
            weapon,
            hex: Math.floor(savedNumber(hex, 1, 1, this._hexes)),
            sharedHexes: [],
            shots: {},
            ammoHex: null,
        };
        mount.sharedHexes = this._cleanSharedHexes(mount.hex, sharedHexes);
        mount.ammoHex = this._cleanAmmoHex(mount, ammoHex);
        for (const tag of Building.getCapitalAmmoTags(weapon)) {
            mount.shots[tag] = Math.floor(savedNumber(isPlainObject(shots) ? shots[tag] : undefined, 0, 0, MAX_BUILDING_CAPITAL_SHOTS));
        }
        return mount;
    }
    private _cleanSharedHexes(home: number, raw: unknown): number[] {
        const hexes: number[] = [];
        for (const value of Array.isArray(raw) ? raw : []) {
            if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > this._hexes || value === home || hexes.includes(value)) continue;
            if (hexes.length < MAX_BUILDING_CAPITAL_SHARED_HEXES) hexes.push(value);
        }
        return hexes.sort((a, b) => a - b);
    }

    private _cleanAmmoHex(mount: IBuildingCapitalMount, raw: unknown): number | null {
        if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 1 || raw > this._hexes || raw === mount.hex) return null;
        return Building.getCapitalAmmoTags(mount.weapon).length > 0 ? raw : null;
    }

    /** A new weapon that fires ammunition comes with 10 shots, the least a DropShip's launcher carries (TM p.210). */
    public addCapitalWeapon(tag: string, hex: number = 1): IBuildingCapitalMount | null {
        const weapon = findBuildingCapitalWeapon(tag);
        if (!weapon || !this.isCapitalWeaponAllowed(weapon) || this._capitalWeapons.length >= MAX_BUILDING_CAPITAL_WEAPONS) return null;
        const first = Building.getCapitalAmmoTags(weapon)[0];
        const mount = this._newCapitalMount(weapon, hex, [], first ? { [first]: 10 } : {});
        this._capitalWeapons.push(mount);
        return mount;
    }
    public removeCapitalWeapon(uuid: string): IBuildingCapitalMount[] {
        this._capitalWeapons = this._capitalWeapons.filter((mount) => mount.uuid !== uuid);
        return this._capitalWeapons;
    }
    private _capitalMount(uuid: string): IBuildingCapitalMount | undefined { return this._capitalWeapons.find((mount) => mount.uuid === uuid); }

    public setCapitalWeaponHex(uuid: string, hex: number): void {
        const mount = this._capitalMount(uuid);
        if (!mount) return;
        mount.hex = Math.floor(savedNumber(hex, mount.hex, 1, this._hexes));
        mount.sharedHexes = mount.sharedHexes.filter((shared) => shared !== mount.hex);
        if (mount.ammoHex === mount.hex) mount.ammoHex = null;
    }
    /**
     * Custom rule (user, 2026-10-07): capital weapons in the hexes next to an ammunition bunker may share it.
     * The weapon's ammunition is stored in the bunker's hex; 0 or the weapon's own hex puts it back.
     */
    public setCapitalWeaponAmmoHex(uuid: string, hex: number): void {
        const mount = this._capitalMount(uuid);
        if (mount) mount.ammoHex = this._cleanAmmoHex(mount, hex);
    }
    public usesAmmoBunkers(): boolean { return this._capitalWeapons.some((mount) => mount.ammoHex !== null); }
    /** Shots pooled in a hex's ammunition bunker, by the weapon whose ammunition they are. */
    public getAmmoBunkerShots(hex: number): Record<string, number> {
        const pool: Record<string, number> = {};
        for (const mount of this._capitalWeapons.filter((entry) => entry.ammoHex === hex)) {
            for (const tag of Object.keys(mount.shots)) if (mount.shots[tag] > 0) pool[tag] = (pool[tag] ?? 0) + mount.shots[tag];
        }
        return pool;
    }
    /**
     * A weapon too heavy for its hex divides its tonnage evenly between that hex and hexes next to it
     * (TO:AUE p.83). The building has no map here: the designer names the neighbors.
     */
    public setCapitalWeaponSharedHexes(uuid: string, hexes: number[]): void {
        const mount = this._capitalMount(uuid);
        if (mount) mount.sharedHexes = this._cleanSharedHexes(mount.hex, hexes);
    }
    public setCapitalWeaponShots(uuid: string, ammoTag: string, shots: number): void {
        const mount = this._capitalMount(uuid);
        if (mount && Building.getCapitalAmmoTags(mount.weapon).includes(ammoTag)) {
            mount.shots[ammoTag] = Math.floor(savedNumber(shots, mount.shots[ammoTag] ?? 0, 0, MAX_BUILDING_CAPITAL_SHOTS));
        }
    }

    /** Fire control and stabilizers for a capital weapon that is not a missile launcher (TO:AUE p.83). */
    public static getCapitalFireControlWeight(weapon: ICapitalWeapon): number {
        return Building.isCapitalMissileLauncher(weapon) ? 0 : round3(weapon.weight * BUILDING_CAPITAL_FIRE_CONTROL);
    }
    public static getCapitalAmmoWeight(mount: IBuildingCapitalMount): number {
        return round3(Object.keys(mount.shots).reduce((sum, tag) => sum + mount.shots[tag] * (findBuildingCapitalWeapon(tag)?.ammo?.tonsPerShot ?? 0), 0));
    }
    public static getCapitalShots(mount: IBuildingCapitalMount): number {
        return Object.keys(mount.shots).reduce((sum, tag) => sum + mount.shots[tag], 0);
    }
    /** The weapon with its ammunition; fire control is counted apart. */
    public static getCapitalMountWeight(mount: IBuildingCapitalMount): number {
        return round3(mount.weapon.weight + Building.getCapitalAmmoWeight(mount));
    }
    public getCapitalFireControlWeight(): number {
        return round3(this._capitalWeapons.reduce((sum, mount) => sum + Building.getCapitalFireControlWeight(mount.weapon), 0));
    }
    /**
     * What one hex carries of the capital weapons: an even share of each weapon and its fire control that sits in
     * or spreads into the hex, and the ammunition of the weapons whose own hex it is.
     */
    public getCapitalWeaponWeight(hex: number): number {
        let tons = 0;
        for (const mount of this._capitalWeapons) {
            const share = (mount.weapon.weight + Building.getCapitalFireControlWeight(mount.weapon)) / (1 + mount.sharedHexes.length);
            if (mount.hex === hex) tons += share;
            else if (mount.sharedHexes.includes(hex)) tons += share;
            if ((mount.ammoHex ?? mount.hex) === hex) tons += Building.getCapitalAmmoWeight(mount);
        }
        return round3(tons);
    }
    /** Hexes that hold a capital weapon or a share of one: none of them takes a turret or pintle (TO:AUE p.83). */
    public isCapitalWeaponHex(hex: number): boolean {
        return this._capitalWeapons.some((mount) => mount.hex === hex || mount.sharedHexes.includes(hex));
    }
    private _capitalAmmoCost(mount: IBuildingCapitalMount): number {
        return Object.keys(mount.shots).reduce((sum, tag) => {
            const ammo = findBuildingCapitalWeapon(tag)?.ammo;
            if (!ammo || ammo.cbills === null) return sum;
            return sum + ammo.cbills * mount.shots[tag] * (ammo.cbillsPer === "ton" ? ammo.tonsPerShot ?? 0 : 1);
        }, 0);
    }

    // Light and Medium weapons (TO:AR p.129; TM pp.136-137, 349-352) -----------------------------------------------

    /** Only hangars, standard buildings and walls mount Light and Medium weapons (TO:AR p.129). */
    public canMountLightWeapons(): boolean { return this._classification.lightWeapons; }

    /**
     * Light weapons are the table's Standard weapons and Medium weapons its Support weapons (TM p.136). The
     * table's melee weapons are neither: a building mounts them, as traps and the like, only at the Custom
     * Homebrew rules level (user ruling, 2026-10-07).
     */
    public static getLightWeaponClass(weapon: IInfantryWeapon): "Light" | "Medium" | "Melee" {
        return weapon.type === "standard" ? "Light" : weapon.type === "support" ? "Medium" : "Melee";
    }

    public isLightWeaponAvailable(weapon: IInfantryWeapon): boolean {
        if (weapon.techBase !== "both" && weapon.techBase !== this.getTechBase()) return false;
        return isInfantryWeaponAvailable(weapon, this.getTechBase(), this._era.yearStart, this._era.yearEnd);
    }

    /** Light and Medium weapons the building's technology base and era offer; melee weapons with custom rules. */
    public getAvailableLightWeapons(rulesLevel: number = BUILDING_RULES_LEVEL): IInfantryWeapon[] {
        if (!this.canMountLightWeapons()) return [];
        return infantryWeapons.filter((weapon) => (weapon.type !== "melee" || rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL) && this.isLightWeaponAvailable(weapon));
    }

    public getLightWeapons(): IBuildingLightMount[] { return this._lightWeapons; }
    public getLightWeaponLimitPerHex(): number { return BUILDING_LIGHT_WEAPONS_PER_HEX_LEVEL * this._levels; }
    public getLightWeaponCount(hex: number): number { return this._lightWeapons.filter((mount) => mount.hex === hex).length; }

    private _newLightMount(weapon: IInfantryWeapon, hex: unknown, mountType: unknown, clips: unknown, uuid?: unknown): IBuildingLightMount {
        const taken = (id: string) => this._lightWeapons.some((mount) => mount.uuid === id) || this._equipment.some((mount) => mount.item.uuid === id);
        const mount: IBuildingLightMount = {
            uuid: typeof uuid === "string" && uuid && !taken(uuid) ? uuid : generateUUID(),
            weapon,
            hex: Math.floor(savedNumber(hex, 1, 1, this._hexes)),
            mount: mountType === "pintle" || mountType === "turret" ? mountType : "fixed",
            clips: 0,
        };
        mount.clips = Building.canCarryClips(weapon) ? Math.floor(savedNumber(clips, 0, 0, MAX_BUILDING_EXTRA_CLIPS)) : 0;
        return mount;
    }

    public addLightWeapon(tag: string, hex: number = 1, mountType: BuildingLightMountType = "fixed"): IBuildingLightMount | null {
        const weapon = findInfantryWeapon(tag);
        if (!weapon || !this.canMountLightWeapons() || this._lightWeapons.length >= MAX_BUILDING_LIGHT_WEAPONS) return null;
        const mount = this._newLightMount(weapon, hex, mountType, 0);
        this._lightWeapons.push(mount);
        return mount;
    }

    public removeLightWeapon(uuid: string): IBuildingLightMount[] {
        this._lightWeapons = this._lightWeapons.filter((mount) => mount.uuid !== uuid);
        return this._lightWeapons;
    }

    private _lightMount(uuid: string): IBuildingLightMount | undefined { return this._lightWeapons.find((mount) => mount.uuid === uuid); }

    public setLightWeaponHex(uuid: string, hex: number): void {
        const mount = this._lightMount(uuid);
        if (mount) mount.hex = Math.floor(savedNumber(hex, mount.hex, 1, this._hexes));
    }
    public setLightWeaponMount(uuid: string, mountType: string): void {
        const mount = this._lightMount(uuid);
        if (mount) mount.mount = mountType === "pintle" || mountType === "turret" ? mountType : "fixed";
    }

    /** A weapon carries more ammunition in whole clips; a single-use weapon, or one with no clip, carries none (TM p.136). */
    public static canCarryClips(weapon: IInfantryWeapon): boolean { return !weapon.disposable && weapon.ammoWeight !== null && weapon.shots !== null; }
    public setLightWeaponClips(uuid: string, clips: number): void {
        const mount = this._lightMount(uuid);
        if (mount) mount.clips = Building.canCarryClips(mount.weapon) ? Math.floor(savedNumber(clips, mount.clips, 0, MAX_BUILDING_EXTRA_CLIPS)) : 0;
    }

    /** The weapon and its extra clips, in tons; the first clip is free and weighs nothing more (TM p.136). */
    public static getLightMountWeight(mount: IBuildingLightMount): number {
        return round5((mount.weapon.weight + mount.clips * (mount.weapon.ammoWeight ?? 0)) / 1000);
    }

    /**
     * A hex's pintle mounts weigh 5 percent of the weapons on them, ammunition aside, rounded up to the
     * kilogram (TO:AUE p.83).
     */
    public getPintleWeight(hex: number): number {
        const mounted = this._lightWeapons.filter((mount) => mount.hex === hex && mount.mount === "pintle").reduce((sum, mount) => sum + mount.weapon.weight, 0);
        return roundUpKilogram(mounted * 0.05 / 1000);
    }

    /** Tons of Light and Medium weapons, clips and pintles in a hex. */
    public getLightWeaponWeight(hex: number): number {
        return round3(this._lightWeapons.filter((mount) => mount.hex === hex).reduce((sum, mount) => sum + Building.getLightMountWeight(mount), 0) + this.getPintleWeight(hex));
    }

    /** Shots a weapon starts with: its free clip and every extra one. */
    public static getLightMountShots(mount: IBuildingLightMount): number | null {
        return mount.weapon.shots === null ? null : mount.weapon.shots * (1 + mount.clips);
    }

    /**
     * A weapon fired on its own does its table damage rounded to the nearest point, a half rounding up, and
     * reaches its Base Range at short, twice that at medium and three times at long; Base Range 0 gives 0, 1
     * and 2 (TM p.136).
     */
    public static getLightWeaponDamage(weapon: IInfantryWeapon): number { return Math.floor(weapon.damage + 0.5 + 1e-9); }
    public static getLightWeaponRanges(weapon: IInfantryWeapon): { short: number; medium: number; long: number } {
        return weapon.baseRange === 0 ? { short: 0, medium: 1, long: 2 } : { short: weapon.baseRange, medium: weapon.baseRange * 2, long: weapon.baseRange * 3 };
    }

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
    /** Heat of every energy weapon fired together, capital and sub-capital lasers and PPCs among them. */
    public getEnergyWeaponHeat(): number {
        return this._equipment.filter((mount) => Building._isEnergyWeapon(mount.item)).reduce((sum, mount) => sum + (mount.item.heat || 0), 0)
            + this._capitalWeapons.filter((mount) => Building.isCapitalEnergyWeapon(mount.weapon)).reduce((sum, mount) => sum + (mount.weapon.heat ?? 0), 0);
    }
    /**
     * A building handles heat as a vehicle does: its heat sinks must cover every energy weapon fired together,
     * whatever powers it (user ruling, 2026-10-07). Unlike a vehicle's engine, no generator brings
     * free heat sinks (TO:AUE p.83).
     */
    public needsHeatSinksForEnergyWeapons(): boolean { return true; }

    public getGenerator(): IBuildingGenerator | null { return this._generator; }
    public canMountGenerator(): boolean { return this._classification.powered; }
    /** An empty tag puts the building back on the local power grid. */
    public setGenerator(tag: string): IBuildingGenerator | null {
        this._generator = this.canMountGenerator() ? findBuildingGenerator(tag) ?? null : null;
        if (!this._generator) this._poweredHexes = 0;
        return this._generator;
    }

    /**
     * Energy weapons that draw on amplifiers. A weapon that fires ammunition, such as a chemical laser, and any
     * flamer, which burns fuel or vents plasma, needs none (user ruling, 2026-10-07).
     */
    private static _needsAmplifier(item: IEquipmentItem): boolean {
        return Building._isEnergyWeapon(item) && !/flamer/.test(item.tag) && !(item.ammoTypes?.length) && !((item.shotsPerTon ?? 0) > 0);
    }
    private _amplifiedWeaponTons(hex?: number): number {
        return this._equipment
            .filter((mount) => (hex === undefined || mount.hex === hex) && Building._needsAmplifier(mount.item))
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
        const base = this._hexes * this._levels + this._poweredHexes + this._equipment
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
        const liquid = this._liquidStorage / this._hexes;
        const loads: IBuildingHexLoad[] = [];
        for (let hex = 1; hex <= this._hexes; hex++) {
            const equipment = round3(this._equipment.filter((mount) => mount.hex === hex).reduce((sum, mount) => sum + (mount.item.weight || 0), 0));
            const turret = this.getTurretWeight(hex);
            const powerAmplifiers = this.getPowerAmplifierWeight(hex);
            const fittings = round3(this.getElevatorWeight(hex) + liquid);
            const lightWeapons = this.getLightWeaponWeight(hex);
            const capital = this.getCapitalWeaponWeight(hex);
            const total = round3(this._armorTons + equipment + lightWeapons + capital + turret + powerAmplifiers + heatSinks + generator + fittings);
            loads.push({
                hex, armor: this._armorTons, equipment, lightWeapons, capitalWeapons: capital, turret, powerAmplifiers, heatSinks, generator, fittings, total,
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
        const pintles = round3(loads.reduce((total, load) => total + this.getPintleWeight(load.hex), 0));
        return [
            ...(this._armorTons > 0 ? [{ name: `Armor (${this.getArmorPoints()} points a ${this.getHexLabel()})`, weight: this._armorTons * this._hexes }] : []),
            ...(this._generator ? [{ name: `${this._generator.name} Generator`, weight: this.getGeneratorWeight() }] : []),
            ...(this._heatSinks > 0 ? [{ name: `Heat Sinks (${this._heatSinks} ${this._heatSinkType.name})`, weight: this._heatSinks }] : []),
            ...(sum("powerAmplifiers") > 0 ? [{ name: "Power Amplifiers", weight: sum("powerAmplifiers") }] : []),
            ...(sum("turret") > 0 ? [{ name: "Turrets", weight: sum("turret") }] : []),
            ...this._elevators.map((elevator) => ({
                name: `Industrial Elevator (${elevator.capacity} tons, ${elevator.levels} ${elevator.levels === 1 ? "level" : "levels"}${this._hexes > 1 ? `, hex ${elevator.hex}` : ""})`,
                weight: Building.getElevatorWeight(elevator),
            })),
            ...(this._liquidStorage > 0 ? [{ name: `Liquid Storage (holds ${this.getLiquidCapacity()} tons)`, weight: this._liquidStorage }] : []),
            ...this._equipment.map((mount) => ({
                name: `${mount.item.name}${mount.turret ? " (T)" : ""}${mount.automated ? " (automated)" : ""}${this._hexes > 1 ? `, hex ${mount.hex}` : ""}`, weight: mount.item.weight || 0,
            })),
            ...this._lightWeapons.map((mount) => ({
                name: `${mount.weapon.name}${mount.mount === "turret" ? " (T)" : mount.mount === "pintle" ? " (P)" : ""}${mount.clips > 0 ? `, ${mount.clips} extra ${mount.clips === 1 ? "clip" : "clips"}` : ""}${this._hexes > 1 ? `, hex ${mount.hex}` : ""}`,
                weight: Building.getLightMountWeight(mount),
            })),
            ...(pintles > 0 ? [{ name: "Pintle Mounts", weight: pintles }] : []),
            ...this._capitalWeapons.map((mount) => ({
                name: `${mount.weapon.name}${Building.getCapitalShots(mount) > 0 ? `, ${Building.getCapitalShots(mount)} ${Building.getCapitalShots(mount) === 1 ? "shot" : "shots"}${mount.ammoHex !== null ? ` in the hex ${mount.ammoHex} bunker` : ""}` : ""}${this._hexes > 1 ? `, hex ${mount.hex}${mount.sharedHexes.length > 0 ? ` with ${mount.sharedHexes.join(", ")}` : ""}` : ""}`,
                weight: Building.getCapitalMountWeight(mount),
            })),
            ...(this.getCapitalFireControlWeight() > 0 ? [{ name: "Capital Fire Control", weight: this.getCapitalFireControlWeight() }] : []),
        ];
    }

    /**
     * Minimum gunners and officers: a Heavy weapon needs its tonnage / 5 gunners, rounded up, and a military
     * building one officer for up to 9 crew or one for every 10 (TO:AR p.130). Automated weapons need no
     * gunners (TO:AR p.131). A Light or Medium weapon needs the crew the infantry table gives it (user ruling,
     * 2026-10-07; the table on TO:AR p.130 prints one each, and TM p.137 uses the weapon's Crew value). Only
     * Heavy weapons can be automated (TO:AR p.131). A capital weapon needs 7 (TO:AR p.130).
     */
    public getMinimumGunners(): number {
        return this._capitalWeapons.length * BUILDING_CAPITAL_WEAPON_GUNNERS + this._lightWeapons.reduce((sum, mount) => sum + mount.weapon.crew, 0) + this._equipment.filter((mount) => Building.isHeavyWeapon(mount.item) && !mount.automated).reduce((sum, mount) => sum + Math.ceil((mount.item.weight || 0) / 5 - 1e-9), 0);
    }
    /**
     * Crew for other equipment on the Advanced Building Minimum Crew Table (TO:AR p.130): one for each ton of
     * communications equipment, 3 for a field kitchen and 5 for each MASH theater. The table's flight deck,
     * landing deck, helipad, mobile field base and modular linkage are not in the equipment lists yet.
     */
    public getMinimumNonGunners(): number {
        let crew = 0;
        for (const mount of this._equipment) {
            if (/communications-equipment/.test(mount.item.tag)) crew += Math.ceil((mount.item.weight || 0) - 1e-9);
            else if (mount.item.tag === "field-kitchen") crew += 3;
            else if (mount.item.tag === "mash-core" || mount.item.tag === "mash-theater") crew += 5;
        }
        return crew;
    }
    public getMinimumOfficers(): number {
        const crew = this.getMinimumGunners() + this.getMinimumNonGunners();
        if (crew === 0 || (!this.canMountHeavyWeapons() && this._lightWeapons.length === 0)) return 0;
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
        if (this._lightWeapons.some((mount) => mount.weapon.type === "melee")) level = Math.max(level, CUSTOM_HOMEBREW_RULES_LEVEL);
        for (const mount of this._capitalWeapons) level = Math.max(level, mount.weapon.rulesLevel);
        if (this.usesAmmoBunkers()) level = Math.max(level, CUSTOM_HOMEBREW_RULES_LEVEL);
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
            issues.push(`The heat sinks must cover every energy weapon fired together, as on a vehicle: ${this.getEnergyWeaponHeat()} heat, ${this.getHeatDissipation()} sunk (TO:AUE p.83).`);
        }
        if (this.canMountLightWeapons()) {
            const lightLimit = this.getLightWeaponLimitPerHex();
            for (let hex = 1; hex <= this._hexes; hex++) {
                const count = this.getLightWeaponCount(hex);
                if (count > lightLimit) issues.push(`${this._hexes > 1 ? `Hex ${hex}` : "The building"} mounts ${count} Light and Medium weapons; the limit is ${lightLimit}, 6 for each level (TO:AR p.129).`);
            }
        }
        for (const mount of this._lightWeapons) {
            if (!this.isLightWeaponAvailable(mount.weapon)) issues.push(`${mount.weapon.name} is not available to this technology base in the selected era.`);
            else if (mount.weapon.type === "melee" && rulesLevel < CUSTOM_HOMEBREW_RULES_LEVEL) issues.push(`${mount.weapon.name} is a melee weapon: a building mounts one only under custom rules (TM p.136 names Standard and Support weapons).`);
        }
        if (this._capitalWeapons.some((mount) => !Building.isCapitalMissileLauncher(mount.weapon)) && !this._generator?.fusionOrFission) {
            issues.push("Without a fusion or fission generator a building mounts no capital weapons but missile launchers (TO:AUE p.83).");
        }
        for (let hex = 1; hex <= this._hexes; hex++) {
            const where = this._hexes > 1 ? `Hex ${hex}` : "The building";
            const guns = this._capitalWeapons.filter((mount) => mount.hex === hex && !Building.isCapitalMissileLauncher(mount.weapon)).length;
            if (guns > 1) issues.push(`${where} mounts ${guns} capital weapons that are not missile launchers; a hex takes one (TO:AUE p.83).`);
            if (this.isCapitalWeaponHex(hex) && (this._equipment.some((mount) => mount.hex === hex && mount.turret) || this._lightWeapons.some((mount) => mount.hex === hex && mount.mount !== "fixed"))) {
                issues.push(`${where} holds a capital weapon, which leaves no room there for a turret or pintle mount (TO:AUE p.83).`);
            }
        }
        for (const mount of this._capitalWeapons) {
            if (!this.isCapitalWeaponAllowed(mount.weapon)) issues.push(`${mount.weapon.name} cannot be mounted on a ${this._classification.name.toLowerCase()}.`);
            else if (!this.getCapitalWeaponAvailability(mount.weapon, rulesLevel).available) issues.push(`${mount.weapon.name} is not available to this technology base in the selected era.`);
            else if (mount.weapon.rulesLevel > Math.max(rulesLevel, BUILDING_RULES_LEVEL)) issues.push(`${mount.weapon.name} is above the selected rules level.`);
        }
        if (this.usesAmmoBunkers() && rulesLevel < CUSTOM_HOMEBREW_RULES_LEVEL) {
            issues.push("Capital weapon ammunition in a shared bunker in another hex is a custom rule: the books keep it with the weapon.");
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
        if (this._subsurface === "underground" && this.hasTurret()) issues.push("An underground building mounts no rooftop equipment or turrets (TO:AR p.138).");
        if (this._openSpace) {
            if (this.hasTurret()) issues.push("Open-space construction mounts no rooftop equipment or turrets (TO:AR p.137).");
            const carried = round3(this.getHexLoads().reduce((sum, load) => sum + load.total, 0));
            if (carried > OPEN_SPACE_MAX_CAPACITY) issues.push(`The building carries ${carried} tons; open-space construction holds ${OPEN_SPACE_MAX_CAPACITY} whatever the Construction Factor (TO:AR p.137).`);
        }
        if (this._subsurface === "underwater" && this._depth > this._cf) issues.push(`An underwater building may be no deeper than its Construction Factor: depth ${this._depth}, CF ${this._cf} (TO:AR p.138).`);
        for (const elevator of this._elevators) {
            if (elevator.levels >= this._levels && this._equipment.some((mount) => mount.hex === elevator.hex && mount.turret)) {
                issues.push(`The industrial elevator in ${this._hexes > 1 ? `hex ${elevator.hex}` : "the building"} reaches the roof, which leaves no room there for a turret (TO:AR p.136).`);
            }
        }
        if (this._tunnel && this._doors.length < 2) issues.push("A tunnel needs a large door at each connection, two at least (TO:AR p.139).");
        return issues;
    }

    /** Things worth knowing that are not errors. */
    public getNotes(): string[] {
        const notes: string[] = [];
        if (this.isGunEmplacement()) notes.push("Units other than infantry cannot enter a gun emplacement. It stacks and is attacked as a stationary vehicle, and tracks damage as a building (TO:AR p.115).");
        if (this._classification.capacity === "none") notes.push(`A ${this._classification.name.toLowerCase()} has no internal weight capacity: it mounts no equipment (TO:AR p.127).`);
        if (this.isCapitalScale()) {
            notes.push("A Castles Brian uses capital-scale Construction Factors and armor: each point is 10 standard points, supports 10 tons and carries 10 tons of equipment for each level (TO:AR pp.115, 127-128).");
            notes.push("Damage to it: total one unit's attacks in the phase, divide by 10 and round to the nearest point. The rule on TO:AR p.124 says 20; its worked example on p.125 divides by 10, and the example is followed.");
            notes.push("Units inside take nothing unless a single hit, divided by 10, is above the hex's Construction Factor / 10, rounded up: then every unit inside takes one 10-point hit in 5-point groupings, as an area-effect weapon against infantry (TO:AR p.124).");
            notes.push("Damage the building does, as to a unit crashing through its walls or under its collapse, is multiplied by 10. Area-effect weapons do not double their damage against it, and hostile infantry may not pass through it (TO:AR pp.113, 124).");
        }
        if (this._openSpace) notes.push("Open-space construction: all equipment is on the ground level and the inside is a paved hex to units, with no terrain modifiers against non-infantry targets; infantry inside count as in light woods. Bringing a hex to CF 0 collapses the roof on everything below (TO:AR p.137).");
        if (!this._generator && this.canMountGenerator() && this._equipment.length > 0) notes.push("With no generator the building draws its power from the local grid, and loses it if the grid fails (TO:AR p.129).");
        if (this._generator?.notes) notes.push(`${this._generator.name} generator: ${this._generator.notes}.`);
        if (this._generator?.dailyFuel) notes.push(`The generator burns ${round3(this._generator.dailyFuel * this._hexes * this._levels / 5)} tons of fuel a day (${this._generator.dailyFuel} for every five hexes and levels), stored outside the building (TO:AR p.132).`);
        if (this._lightWeapons.length > 0) notes.push("Light and Medium weapons need no heat sinks or power amplifiers and come with one free clip. Each does its table damage rounded to the nearest point, at its Base Range for short, twice that for medium and three times for long (TM pp.136-137).");
        if (this._lightWeapons.some((mount) => mount.weapon.powerCells)) notes.push("Energy-cell weapons are wired into the building's power and fire freely while it lasts; their cells are the backup when the power is out.");
        if (this._lightWeapons.some((mount) => mount.weapon.cost === null)) notes.push("A Light or Medium weapon with no row in the TechManual's cost table adds nothing to the price.");
        if (this._capitalWeapons.length > 0) {
            notes.push(`Capital and sub-capital weapons fire upward only: they have no firing arc on a ground map and go in no turret or pintle. Each needs ${BUILDING_CAPITAL_WEAPON_GUNNERS} gunners and none can be automated (TO:AUE p.83; TO:AR pp.130-131).`);
            notes.push("Capital weapons are not Heavy weapons: they count against the hex's weight capacity, not its Heavy weapon tonnage, and add nothing to the generator's weight (TO:AR pp.129, 132).");
            if (this.getCapitalFireControlWeight() > 0) notes.push("A capital weapon that is not a missile launcher weighs 10 percent more for fire control and stabilizers; the cost tables give that no price (TO:AUE p.83).");
            if (this._capitalWeapons.some((mount) => Building.isCapitalMissileLauncher(mount.weapon) && Building.getCapitalShots(mount) < 10)) {
                notes.push("A capital missile or screen launcher carries at least 10 shots on a DropShip (TM pp.210, 237); the building rules name no minimum.");
            }
        }
        if (this.usesAmmoBunkers()) notes.push("Custom rule: capital weapons in the hexes next to an ammunition bunker share it. Weapons that fire the same ammunition draw on one supply there; the bunker's hex must touch each weapon's, which is checked on the map in play.");
        if (this._equipment.some((mount) => mount.automated)) notes.push(`Automated weapons fire first in the Weapon Attack Phase at the closest enemy in range, with a Gunnery skill of ${BUILDING_AUTOMATED_GUNNERY}, +1 through hostile ECM (TO:AR p.131).`);
        if (this._sealed) notes.push(`Environmental sealing: a hit that does more than ${this.isCapitalScale() ? "1 capital-scale point (10 standard points)" : "10 points"} to the Construction Factor breaches ${this.isCapitalScale() ? "that hex alone" : "the building"} on a 2D6 roll of ${BUILDING_BREACH_TARGET}+, modified by ${this.getBreachModifier() >= 0 ? "+" : ""}${this.getBreachModifier()} (TO:AR pp.134-135).`);
        if (this._heavyMetal) notes.push("Heavy metal superstructure: lines of sight through or beside the building are treated as inside an electromagnetic interference field, and a unit that fails its roll entering takes double damage (TO:AR p.135).");
        if (this._ceilings === "high") notes.push("High ceilings: non-infantry units do half damage to a hex they enter and take half from a failed roll, rounded down (TO:AR p.135).");
        if (this._ceilings === "low") notes.push("Low ceilings: non-infantry units do double damage to a hex they enter and take double from a failed roll, rounded up (TO:AR p.135).");
        if (this._subsurface === "underground") notes.push(`Underground: damaged only from inside, except at tunnel openings; ${this.isCapitalScale() ? "" : "any 10 points of damage in a phase calls for a breach roll, and "}a breach collapses the hex (TO:AR p.138).`);
        if (this._subsurface === "underwater") notes.push(this.isCapitalScale() ? "Underwater: a breach floods the hex it happens in (TO:AR pp.134, 138)." : "Underwater: any 10 points of damage in a phase calls for a breach roll, and a breach floods the building (TO:AR p.138).");
        if (this._tunnel) notes.push("A tunnel moves units as an empty hangar does and carries no equipment (TO:AR p.139).");
        if (this._doors.length > 0) notes.push("Large doors open or close in the End Phase. Vehicles and ProtoMechs pass an open door without damage; 'Mechs need one 2 levels high (TO:AR p.136).");
        if (this._elevators.length > 0) notes.push("Industrial elevators move 1 level a turn; each level costs the unit aboard 1 Walking or Cruising MP (TO:AR p.136).");
        if (this._liquidStorage > 0) notes.push(`Liquid storage: if a hex is brought to CF 0 by weapons or fire, the contents explode on a 2D6 roll of 6+, out to ${Math.max(1, Math.ceil(this.getLiquidCapacity() / 1000))} ${Math.ceil(this.getLiquidCapacity() / 1000) > 1 ? "hexes" : "hex"} when full (TO:AR pp.132-133).`);
        return notes;
    }

    // Cost (TO:AR p.208) ---------------------------------------------------------------------------------------

    private _costRows(): [string, number][] {
        const rows: [string, number][] = [];
        const levels = this._classification.singleLevelCost ? 1 : this._levels;
        const rate = this._classification.costPerCF;
        const multiplier = this.getStructureCostMultiplier();
        rows.push([
            `Structure (${money(rate)} x CF ${this._cf} x ${this._hexes} ${this.getHexLabel(this._hexes !== 1)}${this._classification.singleLevelCost ? "" : ` x ${levels} ${levels === 1 ? "level" : "levels"}`}${multiplier !== 1 ? ` x ${multiplier} for structural modifications` : ""})`,
            rate * this._cf * this._hexes * levels * multiplier,
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
        if (this._lightWeapons.length > 0) {
            // TM pp.298-301: the weapon, and for each extra clip its ammunition price (inferno clips at the SRM
            // ratio); one supply of power cells covers an energy-cell weapon that carries extra clips.
            const light = this._lightWeapons.reduce((sum, mount) => sum + (mount.weapon.cost ?? 0)
                + mount.clips * (getInfantryClipCost(mount.weapon) ?? 0) + (mount.clips > 0 && mount.weapon.powerCells ? INFANTRY_POWER_CELL_COST : 0), 0);
            rows.push(["Light and Medium Weapons and Clips", light]);
        }
        if (this._capitalWeapons.length > 0) {
            // The weapon, and its ammunition by the ton (TO:AUE p.223) or by the missile (TM p.296).
            rows.push(["Capital Weapons and Ammunition", this._capitalWeapons.reduce((sum, mount) => sum + mount.weapon.cbills + this._capitalAmmoCost(mount), 0)]);
        }
        const pintles = round3(loads.reduce((sum, load) => sum + this.getPintleWeight(load.hex), 0));
        if (pintles > 0) rows.push([`Pintle Mounts (1,000 x ${pintles} t)`, 1000 * pintles]);
        const doorLevels = this._doors.reduce((sum, height) => sum + height, 0);
        if (doorLevels > 0) rows.push([`Large Doors (10,000 x ${doorLevels} ${doorLevels === 1 ? "level" : "levels"})`, 10000 * doorLevels]);
        if (this.getElevatorWeight() > 0) rows.push([`Industrial Elevators (15,000 x ${this.getElevatorWeight()} t)`, 15000 * this.getElevatorWeight()]);
        if (this._liquidStorage > 0) rows.push([`Fuel Storage (100 x ${this._liquidStorage} t)`, 100 * this._liquidStorage]);
        if (this.getAutomatedWeaponTons() > 0) rows.push([`Weapon Automation (1,000 x ${this.getAutomatedWeaponTons()} t)`, 1000 * this.getAutomatedWeaponTons()]);
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
     * A capital-scale CF is multiplied by 10 for the final multiplier (the table's footnote).
     */
    public getCBillCost(): number {
        const subtotal = this._costRows().reduce((sum, [, value]) => sum + value, 0);
        return Math.round(subtotal * (1 + this.getStandardCF() / 100));
    }

    /** The calculation, one plain-text line per step. */
    public getCBillCostLog(): string[] {
        const rows = this._costRows();
        const subtotal = rows.reduce((sum, [, value]) => sum + value, 0);
        return [
            ...rows.map(([name, value]) => `${name}: ${money(value)}`),
            `Subtotal ${money(subtotal)} x ${round3(1 + this.getStandardCF() / 100)} (1 + CF ${this.getStandardCF()} / 100${this.isCapitalScale() ? `, the capital-scale CF ${this._cf} x 10` : ""}) = ${money(this.getCBillCost())}`,
        ];
    }

    public getDisplayName(): string {
        return this._name.trim() || `${this._type.tag === "none" ? "" : this._type.name + " "}${this._classification.name}`;
    }

    /** Sealed Building Breach Table modifier: the building type, plus half the depth, rounded up (TO:AR p.135). */
    public getBreachModifier(): number {
        return (BUILDING_BREACH_MODIFIERS[this._type.tag] ?? 0) + (this._subsurface !== "none" ? Math.ceil(this._depth / 2) : 0);
    }

    public getGunnery(): number { return this._gunnery; }
    public setGunnery(skill: number): void { this._gunnery = Math.floor(savedNumber(skill, this._gunnery, 0, 8)); }

    // Saving and loading --------------------------------------------------------------------------------------

    public export(_noInPlayVariables: boolean = false): IBuildingExport {
        return {
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
            equipment: this._equipment.map((mount) => ({
                tag: mount.item.tag, uuid: mount.item.uuid, hex: mount.hex, ...(mount.turret ? { turret: true } : {}), ...(mount.automated ? { automated: true } : {}),
            })),
            sealed: this._sealed,
            ...(this._openSpace ? { openSpace: true } : {}),
            heavyMetal: this._heavyMetal,
            ceilings: this._ceilings,
            subsurface: this._subsurface,
            depth: this._depth,
            tunnel: this._tunnel,
            doors: [...this._doors],
            elevators: this._elevators.map((elevator) => ({ ...elevator })),
            liquidStorage: this._liquidStorage,
            poweredHexes: this._poweredHexes,
            ...(this._lightWeapons.length > 0 ? {
                lightWeapons: this._lightWeapons.map((mount) => ({
                    tag: mount.weapon.tag, uuid: mount.uuid, hex: mount.hex,
                    ...(mount.mount !== "fixed" ? { mount: mount.mount } : {}), ...(mount.clips > 0 ? { clips: mount.clips } : {}),
                })),
            } : {}),
            ...(this._capitalWeapons.length > 0 ? {
                capitalWeapons: this._capitalWeapons.map((mount) => ({
                    tag: mount.weapon.tag, uuid: mount.uuid, hex: mount.hex,
                    ...(mount.sharedHexes.length > 0 ? { sharedHexes: [...mount.sharedHexes] } : {}),
                    ...(Object.keys(mount.shots).length > 0 ? { shots: { ...mount.shots } } : {}),
                    ...(mount.ammoHex !== null ? { ammoHex: mount.ammoHex } : {}),
                })),
            } : {}),
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
            // Modifications that change the size limits and capacity come first.
            this._subsurface = "none";
            this._tunnel = false;
            this._sealed = false;
            this._openSpace = false;
            this._heavyMetal = false;
            this._ceilings = "standard";
            this._doors = [];
            this._elevators = [];
            this._liquidStorage = 0;
            this._poweredHexes = 0;
            this._subsurface = this.canBeSubsurface() && (saved.subsurface === "underground" || saved.subsurface === "underwater") ? saved.subsurface : "none";
            this._depth = Math.floor(savedNumber(saved.depth, 1, 1, 1000));
            this._tunnel = saved.tunnel === true && this.canBeTunnel();
            this._openSpace = saved.openSpace === true && this.canHaveOpenSpace();
            const cf = savedNumber(saved.cf, this._type.maxCF, 0, 100000);
            this._cf = this._type.maxCF;
            this.setCF(cf);
            if (this._cf !== Math.floor(cf)) issue(`Construction Factor set to ${this._cf}`);
            this._hexes = 1;
            this.setHexes(savedNumber(saved.hexes, 1, 1, 100000));
            this._levels = 1;
            this.setLevels(savedNumber(saved.levels, 1, 1, 100000));
            this.setSealed(saved.sealed === true);
            this.setHeavyMetalSuperstructure(saved.heavyMetal === true);
            this.setCeilings(savedString(saved.ceilings));
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
                this._equipment.push(this._newMount(catalogItem, entry.hex, entry.turret, entry.uuid, entry.automated));
            }
            this._lightWeapons = [];
            if (saved.lightWeapons !== undefined && !Array.isArray(saved.lightWeapons)) issue("Ignored a Light and Medium weapon list that is not a list");
            const lightEntries = Array.isArray(saved.lightWeapons) ? saved.lightWeapons : [];
            if (lightEntries.length > MAX_BUILDING_LIGHT_WEAPONS) issue(`Kept the first ${MAX_BUILDING_LIGHT_WEAPONS} of ${lightEntries.length} Light and Medium weapons`);
            for (const entry of lightEntries.slice(0, MAX_BUILDING_LIGHT_WEAPONS)) {
                if (!isPlainObject(entry) || typeof entry.tag !== "string") {
                    issue("Skipped a Light or Medium weapon that could not be read");
                    continue;
                }
                const weapon = findInfantryWeapon(entry.tag);
                if (!weapon) {
                    issue(`Skipped unknown Light or Medium weapon "${entry.tag.slice(0, 60)}"`);
                    continue;
                }
                if (!this.canMountLightWeapons()) {
                    issue(`Dropped ${weapon.name}: a ${this._classification.name.toLowerCase()} mounts no Light or Medium weapons`);
                    continue;
                }
                this._lightWeapons.push(this._newLightMount(weapon, entry.hex, entry.mount, entry.clips, entry.uuid));
            }
            this._capitalWeapons = [];
            if (saved.capitalWeapons !== undefined && !Array.isArray(saved.capitalWeapons)) issue("Ignored a capital weapon list that is not a list");
            const capitalEntries = Array.isArray(saved.capitalWeapons) ? saved.capitalWeapons : [];
            if (capitalEntries.length > MAX_BUILDING_CAPITAL_WEAPONS) issue(`Kept the first ${MAX_BUILDING_CAPITAL_WEAPONS} of ${capitalEntries.length} capital weapons`);
            for (const entry of capitalEntries.slice(0, MAX_BUILDING_CAPITAL_WEAPONS)) {
                if (!isPlainObject(entry) || typeof entry.tag !== "string") {
                    issue("Skipped a capital weapon that could not be read");
                    continue;
                }
                const weapon = findBuildingCapitalWeapon(entry.tag);
                if (!weapon) {
                    issue(`Skipped unknown capital weapon "${entry.tag.slice(0, 60)}"`);
                    continue;
                }
                if (!this.isCapitalWeaponAllowed(weapon)) {
                    issue(`Dropped ${weapon.name}: a ${this._classification.name.toLowerCase()} cannot mount it`);
                    continue;
                }
                this._capitalWeapons.push(this._newCapitalMount(weapon, entry.hex, entry.sharedHexes, entry.shots, entry.uuid, entry.ammoHex));
            }
            for (const key of ["doors", "elevators"] as const) {
                if (saved[key] !== undefined && !Array.isArray(saved[key])) issue(`Ignored a ${key} list that is not a list`);
            }
            for (const height of Array.isArray(saved.doors) ? saved.doors.slice(0, MAX_BUILDING_DOORS) : []) {
                if (typeof height === "number") this.addDoor(height);
            }
            for (const entry of Array.isArray(saved.elevators) ? saved.elevators.slice(0, MAX_BUILDING_ELEVATORS) : []) {
                if (isPlainObject(entry)) this.addElevator(savedNumber(entry.hex, 1, 1, 100000), savedNumber(entry.capacity, 1, 1, 100000), savedNumber(entry.levels, 1, 1, 100000));
            }
            this.setLiquidStorage(savedNumber(saved.liquidStorage, 0, 0, 1e9));
            this.setPoweredHexes(savedNumber(saved.poweredHexes, 0, 0, 1e9));
            if (saved.gunnery !== undefined && typeof saved.gunnery !== "number") issue("Ignored a gunnery skill that is not a number");
            this._gunnery = Math.floor(savedNumber(saved.gunnery, 4, 0, 8));
        } catch (error) {
            issue("The saved building could not be read completely");
            console.error("Building importJSON failed:", error);
        }
    }
}

export { BUILDING_CLASSIFICATIONS, BUILDING_GENERATORS };
