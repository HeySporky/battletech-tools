import { generateUUID } from "../utils/generateUUID";
import { IEquipmentItem, IEras } from "../data/data-interfaces";
import { btEraOptions, findEraByTag, getErasForTech } from "../data/era-options";
import { getAlphaStrikeEquipmentAbilityCodes, getAmmoBattleValuePerTon, getCompatibleAmmo, getEquipmentListByTech, getEquipmentRulesLevel, getWeaponShotsPerTon } from "../data/equipment-registry";
import { mechEngineOptions } from "../data/mech-engine-options";
import { getProtoMechJumpJetWeightKg, protoMechComponents } from "../data/protomech-components";
import {
    IProtoMechEquipment,
    IProtoMechMissile,
    PROTOMECH_ADVANCED_RULES_LEVEL,
    PROTOMECH_ARMOR_KG,
    PROTOMECH_CHASSIS,
    PROTOMECH_COSTS,
    PROTOMECH_EDP_ARMOR_KG,
    PROTOMECH_EXPERIMENTAL_RULES_LEVEL,
    PROTOMECH_FIXED_LAUNCHER_PATTERN,
    PROTOMECH_GLIDER_MIN_FLANK,
    PROTOMECH_HEAT_SINK_KG,
    PROTOMECH_INTERFACE_COCKPIT,
    PROTOMECH_LOCATION_NAMES,
    PROTOMECH_MAX_ENGINE_RATING,
    PROTOMECH_MAX_STANDARD_TONS,
    PROTOMECH_MAX_TONS,
    PROTOMECH_MIN_TONS,
    PROTOMECH_MYOMER_BOOSTER,
    PROTOMECH_QUAD_MIN_RUN,
    PROTOMECH_RULES_LEVEL,
    PROTOMECH_SMALL_ENGINE_KG,
    PROTOMECH_SMALL_ENGINE_MAX_RATING,
    PROTOMECH_ULTRAHEAVY_INTRODUCED,
    PROTOMECH_UMU,
    ProtoMechChassis,
    ProtoMechLocation,
    ProtoMechMountLocation,
    findProtoMechEquipment,
    getProtoMechEquipmentKg,
    getProtoMechFrenzyDamage,
    getProtoMechLocationLimit,
    getProtoMechMissileByTag,
    getProtoMechStructureRow,
    protoMechAmmoKgPerShot,
    protoMechEquipment,
    protoMechMissiles,
} from "../data/protomech-construction";
import { getSkillMultiplier } from "../data/skill-multipliers";
import { findByTag } from "../data/tag-match";
import { getMovementModifier } from "../utils";
import { AlphaStrikeUnit, IASMULUnit } from "./alpha-strike-unit";

// A ProtoMech (TechManual pp.80-89; Ultraheavy, Quad and Glider ProtoMechs, IO:AE pp.93-96), built in kilograms.
// One design stands for a Point of up to five identical ProtoMechs; each tracks its own damage in play.

export const MAX_PROTOMECH_NAME_LENGTH = 120;
export const MAX_PROTOMECH_MOUNTS = 16;
export const MAX_PROTOMECH_SHOTS = 500;
export const PROTOMECH_POINT_SIZE = 5;
/** Critical hit boxes by location (TW pp.186-187); the main gun has none. */
export const PROTOMECH_CRITICAL_BOXES: Record<ProtoMechLocation, number> = { head: 2, torso: 3, la: 2, ra: 2, legs: 3, mainGun: 0 };
/** What each critical hit to a location does, in order (TW pp.186-187). */
export const PROTOMECH_CRITICAL_EFFECTS: Record<ProtoMechLocation, string[]> = {
    head: ["+1 to hit on all attacks", "Head destroyed: +2 to hit on all attacks, no attacks at long range"],
    torso: ["Jumping MP -1; roll 1D6 for a torso weapon", "Jumping MP halved (round up); roll 1D6 for a torso weapon", "Engine destroyed: the ProtoMech is destroyed"],
    la: ["+1 to hit with this arm, its weapon and the main gun", "Arm destroyed with its weapon: +2 to hit with the main gun"],
    ra: ["+1 to hit with this arm, its weapon and the main gun", "Arm destroyed with its weapon: +2 to hit with the main gun"],
    legs: ["Walking MP -1", "Walking MP halved (round up)", "Legs destroyed: no movement, no torso twist"],
    mainGun: [],
};
/** The ProtoMech Hit Location Table (TW p.185), by 2D6 roll; null is a near miss. */
export const PROTOMECH_HIT_LOCATIONS: Record<number, ProtoMechLocation | null> = {
    2: "mainGun", 3: null, 4: "ra", 5: "legs", 6: "torso", 7: "torso", 8: "torso", 9: "legs", 10: "la", 11: null, 12: "head",
};

export type ProtoMechJumpType = "none" | "standard" | "extended" | "umu";
export type ProtoMechArmorType = "standard" | "edp";

export interface IProtoMechMount {
    /** A catalog tag, a ProtoMech-only item's tag, or a tube launcher's ("pm-lrm", "pm-srm", "pm-streak-srm", "pm-streak-lrm"). */
    tag: string;
    location: ProtoMechMountLocation;
    /** Tubes of a missile launcher. */
    tubes?: number;
    /** A torso item that fires to the rear. */
    rear?: boolean;
    /** Shots of ammunition carried for the item. */
    shots?: number;
    /** The ammunition carried, when not the weapon's standard round. */
    ammoTag?: string;
}

export interface IProtoMechUnitInPlay {
    /** Damage taken by each location: armor first, then internal structure. */
    damage?: Partial<Record<ProtoMechLocation, number>>;
    /** Critical hit boxes crossed off. */
    criticals?: Partial<Record<ProtoMechLocation, number>>;
    /** Shots fired, by mount index. */
    fired?: Record<string, number>;
    /** Mounts destroyed by a torso critical hit, by mount index. */
    lost?: number[];
    pilotHits?: number;
}

export interface IProtoMechInPlay {
    units: IProtoMechUnitInPlay[];
}

export interface IProtoMechExport {
    version: 1;
    uuid: string;
    name: string;
    tons: number;
    chassis: ProtoMechChassis;
    /** Walking MP; WiGE Cruising MP for a Glider. */
    walkMP: number;
    jumpType: ProtoMechJumpType;
    jumpMP: number;
    myomerBooster?: boolean;
    mainGun?: boolean;
    interfaceCockpit?: boolean;
    armorType: ProtoMechArmorType;
    armor: Partial<Record<ProtoMechLocation, number>>;
    mounts: IProtoMechMount[];
    era: string;
    gunnery: number;
    pointSize: number;
    inPlay?: IProtoMechInPlay;
    lastUpdated?: string;
}

export interface IProtoMechWeaponLine {
    index: number;
    name: string;
    location: string;
    damage: string;
    min: number;
    short: number;
    medium: number;
    long: number;
    shots: number | null;
}

export interface IProtoMechASDamageValue {
    damage: number;
    /** Minimal damage, written 0*. */
    minimal: boolean;
}

export interface IProtoMechAlphaStrikeStats {
    type: "PM";
    size: number;
    move: string;
    tmm: number;
    armor: number;
    structure: number;
    damageValues: { short: IProtoMechASDamageValue; medium: IProtoMechASDamageValue; long: IProtoMechASDamageValue };
    specialAbilities: string[];
    pointValue: number;
    calcLog: string[];
}

export const formatProtoMechASDamage = (value: IProtoMechASDamageValue): string => (value.minimal ? "0*" : `${value.damage}`);

/** The Cluster Hits Table at a roll of 7, by weapon size (TW p.116). */
const CLUSTER_HITS_ON_7: number[] = [0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12];
/** Heat Values at short, medium and long range (Heat-Generating Weaponry Table, ASC p.124). */
const PROTOMECH_AS_HEAT: Record<string, number[]> = {
    "clan-flamer": [2, 0, 0],
    "vehicle-flamer": [2, 0, 0],
    "clan-heavy-flamer": [4, 0, 0],
    "clan-er-flamer": [2, 2, 0],
    "plasma-cannon": [7, 7, 7],
};
const roundToHalf = (value: number): number => Math.round(value * 2 + 1e-9) / 2;

const round2 = (value: number): number => Math.round(value * 100) / 100;
const roundNormally = (value: number): number => Math.floor(value + 0.5);
const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
/** A weapon's damage for a table: one number, or short / medium / long where it changes with range. */
export const formatProtoMechDamage = (damage: IEquipmentItem["damage"]): string => {
    if (damage === undefined || damage === null) return "";
    if (typeof damage === "object") return `${damage.short}/${damage.medium}/${damage.long}`;
    return damage ? `${damage}` : "";
};
const speedFactor = (mp: number): number => Math.round(Math.pow(1 + (mp - 5) / 10, 1.2) * 100) / 100;
const LOCATIONS: ProtoMechLocation[] = ["head", "torso", "la", "ra", "legs", "mainGun"];
const MOUNT_LOCATIONS: ProtoMechMountLocation[] = ["torso", "la", "ra", "mainGun"];
const CHASSIS_TAGS: ProtoMechChassis[] = ["biped", "quad", "glider"];
const JUMP_TYPES: ProtoMechJumpType[] = ["none", "standard", "extended", "umu"];

let clanCatalog: IEquipmentItem[] | null = null;
const getClanCatalog = (): IEquipmentItem[] => {
    if (!clanCatalog) clanCatalog = getEquipmentListByTech("clan");
    return clanCatalog;
};
const findCatalogItem = (tag: string): IEquipmentItem | undefined => findByTag(getClanCatalog(), tag);

/** Catalog weapons and equipment a ProtoMech may mount; missile launchers are built from tubes instead. */
export const getProtoMechCatalogItems = (): IEquipmentItem[] =>
    getClanCatalog().filter((item) => !item.isAmmo && (item.space?.protomech ?? -1) >= 0
        && !PROTOMECH_FIXED_LAUNCHER_PATTERN.test(item.tag) && item.tag !== PROTOMECH_MYOMER_BOOSTER.tag && item.tag !== "clan-machine-gun-array");

/** Reads a saved ProtoMech; null when the data is not one. */
export const normalizeProtoMechExport = (raw: unknown): { proto: IProtoMechExport | null; issues: string[] } => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { proto: null, issues: ["Not a ProtoMech record."] };
    const data = raw as Partial<IProtoMechExport>;
    if (typeof data.tons !== "number" || typeof data.chassis !== "string" || !Array.isArray(data.mounts)) return { proto: null, issues: ["Not a ProtoMech record."] };
    const proto = new ProtoMech();
    if (!proto.import(data as IProtoMechExport)) return { proto: null, issues: ["Not a ProtoMech record."] };
    return { proto: proto.export(), issues: proto.getImportIssues() };
};

export default class ProtoMech {
    public lastUpdated: Date = new Date();

    private _uuid: string = generateUUID();
    private _name: string = "";
    private _tons: number = 5;
    private _chassis: ProtoMechChassis = "biped";
    private _walkMP: number = 4;
    private _jumpType: ProtoMechJumpType = "none";
    private _jumpMP: number = 0;
    private _myomerBooster: boolean = false;
    private _mainGun: boolean = false;
    private _interfaceCockpit: boolean = false;
    private _armorType: ProtoMechArmorType = "standard";
    private _armor: Record<ProtoMechLocation, number> = { head: 0, torso: 0, la: 0, ra: 0, legs: 0, mainGun: 0 };
    private _mounts: IProtoMechMount[] = [];
    private _era: IEras = findEraByTag("jihad") ?? btEraOptions[btEraOptions.length - 1];
    private _gunnery: number = 4;
    private _pointSize: number = PROTOMECH_POINT_SIZE;
    private _inPlay: IProtoMechInPlay = { units: [] };
    private _importIssues: string[] = [];

    constructor(json: string = "") {
        if (json) this.importJSON(json);
    }

    // Identity -------------------------------------------------------------------------------------------------

    public getUUID(): string { return this._uuid; }
    public newUUID(): void { this._uuid = generateUUID(); }
    public getName(): string { return this._name; }
    public setName(name: string): void { this._name = String(name ?? "").slice(0, MAX_PROTOMECH_NAME_LENGTH); }
    public getDisplayName(): string { return this._name.trim() || `${this.getWeightClassName()} ProtoMech`; }
    public getImportIssues(): string[] { return this._importIssues; }

    // Chassis --------------------------------------------------------------------------------------------------

    public getTons(): number { return this._tons; }
    public getChassis(): ProtoMechChassis { return this._chassis; }
    public getChassisName(): string { return PROTOMECH_CHASSIS.find((item) => item.tag === this._chassis)?.name ?? "Biped"; }
    public isQuad(): boolean { return this._chassis === "quad"; }
    public isGlider(): boolean { return this._chassis === "glider"; }
    public isUltraheavy(): boolean { return this._tons > PROTOMECH_MAX_STANDARD_TONS; }

    /** Light to 3 tons, Medium 4 to 5, Heavy 6 to 7, Assault 8 to 9 (TM pp.80-81); Ultraheavy from 10 (IO:AE p.95). */
    public getWeightClassName(): string {
        if (this._tons <= 3) return "Light";
        if (this._tons <= 5) return "Medium";
        if (this._tons <= 7) return "Heavy";
        if (this._tons <= PROTOMECH_MAX_STANDARD_TONS) return "Assault";
        return "Ultraheavy";
    }

    /** Gliders are built on the Ultraheavy biped chassis only (IO:AE p.95). */
    public getMinTons(chassis: ProtoMechChassis = this._chassis): number { return chassis === "glider" ? PROTOMECH_MAX_STANDARD_TONS + 1 : PROTOMECH_MIN_TONS; }
    public getMaxTons(): number { return PROTOMECH_MAX_TONS; }

    public setTons(tons: number): void {
        this._tons = clampInt(tons, this.getMinTons(), PROTOMECH_MAX_TONS, this._tons);
        this._clamp();
    }

    public setChassis(chassis: string): boolean {
        if (!CHASSIS_TAGS.includes(chassis as ProtoMechChassis)) return false;
        this._chassis = chassis as ProtoMechChassis;
        if (this._tons < this.getMinTons()) this._tons = this.getMinTons();
        this._clamp();
        return true;
    }

    public hasMainGun(): boolean { return this._mainGun; }
    /** The main gun mount weighs nothing; removing it removes what it carried and its armor (TM p.82). */
    public setMainGun(value: boolean): void {
        this._mainGun = value === true;
        this._clamp();
    }

    public hasInterfaceCockpit(): boolean { return this._interfaceCockpit; }
    public setInterfaceCockpit(value: boolean): void { this._interfaceCockpit = value === true; }
    public getTechName(): string { return this._interfaceCockpit ? "Mixed (Clan chassis)" : "Clan"; }

    public getLocations(): ProtoMechLocation[] {
        return LOCATIONS.filter((location) => (location !== "mainGun" || this._mainGun) && !(this.isQuad() && (location === "la" || location === "ra")));
    }
    public getMountLocations(): ProtoMechMountLocation[] {
        return MOUNT_LOCATIONS.filter((location) => this.getLocations().includes(location));
    }
    public getLocationName(location: ProtoMechLocation): string {
        return this.isQuad() && location === "legs" ? "Legs (all four)" : PROTOMECH_LOCATION_NAMES[location];
    }

    // Structure and armor --------------------------------------------------------------------------------------

    public getStructure(location: ProtoMechLocation): number {
        if (!this.getLocations().includes(location)) return 0;
        const row = getProtoMechStructureRow(this._tons);
        if (location === "la" || location === "ra") return row.arm.structure;
        if (location === "legs") return (this.isQuad() ? row.quadLegs : row.legs).structure;
        return row[location].structure;
    }
    public getMaxArmor(location: ProtoMechLocation): number {
        if (!this.getLocations().includes(location)) return 0;
        const row = getProtoMechStructureRow(this._tons);
        if (location === "la" || location === "ra") return row.arm.maxArmor;
        if (location === "legs") return (this.isQuad() ? row.quadLegs : row.legs).maxArmor;
        return row[location].maxArmor;
    }
    public getTotalStructure(): number { return this.getLocations().reduce((sum, location) => sum + this.getStructure(location), 0); }
    public getMaxTotalArmor(): number { return this.getLocations().reduce((sum, location) => sum + this.getMaxArmor(location), 0); }
    public getArmor(location: ProtoMechLocation): number { return this.getLocations().includes(location) ? this._armor[location] : 0; }
    public getTotalArmor(): number { return this.getLocations().reduce((sum, location) => sum + this._armor[location], 0); }
    public setArmor(location: ProtoMechLocation, points: number): void {
        if (!LOCATIONS.includes(location)) return;
        this._armor[location] = clampInt(points, 0, this.getMaxArmor(location), 0);
    }
    public setMaximumArmor(): void { for (const location of this.getLocations()) this._armor[location] = this.getMaxArmor(location); }
    public clearArmor(): void { for (const location of LOCATIONS) this._armor[location] = 0; }

    public getArmorType(): ProtoMechArmorType { return this._armorType; }
    public getArmorTypeName(): string { return this._armorType === "edp" ? "Electric Discharge ProtoMech (EDP) Armor" : "ProtoMech Standard Armor"; }
    public setArmorType(type: string): void { this._armorType = type === "edp" ? "edp" : "standard"; }
    public getArmorKgPerPoint(): number { return this._armorType === "edp" ? PROTOMECH_EDP_ARMOR_KG : PROTOMECH_ARMOR_KG; }
    public getArmorWeight(): number { return this.getTotalArmor() * this.getArmorKgPerPoint(); }

    // Movement and engine --------------------------------------------------------------------------------------

    /** Walking MP; a Glider's WiGE Cruising MP. */
    public getWalkMP(): number { return this._walkMP; }
    public getRunMP(): number { return Math.ceil(this._walkMP * 1.5); }
    /** A Glider moves 1 MP on the ground whatever its engine (IO:AE p.94). */
    public getGroundWalkMP(): number { return this.isGlider() ? 1 : this._walkMP; }
    public getGroundRunMP(): number { return this.isGlider() ? 1 : this.getRunMP(); }
    public getBoostedRunMP(): number { return this.hasMyomerBooster() ? this._walkMP * 2 : this.getGroundRunMP(); }

    public getMinWalkMP(): number {
        if (this.isGlider()) return 3;
        return this.isQuad() ? 2 : 1;
    }
    public getMaxWalkMP(): number {
        let mp = this.getMinWalkMP();
        while (mp < 40 && this._engineRatingFor(mp + 1) <= PROTOMECH_MAX_ENGINE_RATING) mp++;
        return mp;
    }
    public setWalkMP(mp: number): void {
        this._walkMP = clampInt(mp, this.getMinWalkMP(), this.getMaxWalkMP(), this._walkMP);
        this._clamp();
    }

    /**
     * Tonnage x Running MP; Quads and Gliders subtract 2 from the Running or WiGE Flanking MP (IO:AE p.96). The
     * rating is never below 1.
     */
    private _engineRatingFor(walkMP: number): number {
        const run = Math.ceil(walkMP * 1.5);
        return Math.max(1, this._tons * (this._chassis === "biped" ? run : run - 2));
    }
    public getEngineRating(): number { return this._engineRatingFor(this._walkMP); }
    /** Ratings of 40 or more round up to the Master Engine Table's next rating (TM p.83). */
    public getInstalledEngineRating(): number {
        const rating = this.getEngineRating();
        return rating <= PROTOMECH_SMALL_ENGINE_MAX_RATING ? rating : Math.ceil(rating / 5) * 5;
    }
    public getEngineWeight(): number {
        const rating = this.getInstalledEngineRating();
        if (rating <= PROTOMECH_SMALL_ENGINE_MAX_RATING) return rating * PROTOMECH_SMALL_ENGINE_KG;
        const option = mechEngineOptions.find((item) => item.rating >= rating) ?? mechEngineOptions[mechEngineOptions.length - 1];
        return option.weight.standard * 1000;
    }

    public getCockpitWeight(): number { return this.isUltraheavy() ? 750 : 500; }
    public getStructureWeight(): number { return this._tons * 100; }

    public getJumpType(): ProtoMechJumpType { return this.isGlider() ? "none" : this._jumpType; }
    public getAvailableJumpTypes(): ProtoMechJumpType[] { return this.isGlider() ? ["none"] : JUMP_TYPES; }
    /** Jump jets and UMUs up to the Walking MP; extended jump jets up to the Running MP (TM p.84; IO:AE p.59). */
    public getMaxJumpJets(type: ProtoMechJumpType = this.getJumpType()): number {
        if (type === "none") return 0;
        return type === "extended" ? this.getRunMP() : this._walkMP;
    }
    /** Jump jets, extended jump jets or UMUs mounted. */
    public getJumpJets(): number { return this.getJumpType() === "none" ? 0 : this._jumpMP; }
    public setJump(type: string, mp: number = this._jumpMP): void {
        this._jumpType = JUMP_TYPES.includes(type as ProtoMechJumpType) ? type as ProtoMechJumpType : "none";
        this._jumpMP = this._jumpType === "none" ? 0 : clampInt(mp, 1, this.getMaxJumpJets(this._jumpType), 1);
        this._clamp();
    }
    public hasPartialWing(): boolean { return this._mounts.some((mount) => mount.tag === "protomech-partial-wing"); }
    /** Jumping MP, with the partial wing's 2 in a standard atmosphere (TO:AUE p.107); UMUs give none. */
    public getJumpMP(): number {
        const type = this.getJumpType();
        if (type === "none" || type === "umu") return 0;
        return this._jumpMP + (this.hasPartialWing() ? 2 : 0);
    }
    public getUMUMP(): number { return this.getJumpType() === "umu" ? this._jumpMP : 0; }
    public getJumpWeight(): number {
        const type = this.getJumpType();
        if (type === "none") return 0;
        return getProtoMechJumpJetWeightKg(type === "extended" ? "protomech-extended-jump-jets" : "protomech-jump-jets", this._tons, this._jumpMP) ?? 0;
    }

    public canMountMyomerBooster(): boolean { return !this.isGlider(); }
    public hasMyomerBooster(): boolean { return this._myomerBooster && this.canMountMyomerBooster(); }
    public setMyomerBooster(value: boolean): void { this._myomerBooster = value === true; }
    public getMyomerBoosterWeight(): number { return this.hasMyomerBooster() ? this._tons * PROTOMECH_MYOMER_BOOSTER.kgPerTon : 0; }

    public getMovementText(): string {
        if (this.isGlider()) return `1 / 1 on the ground; WiGE ${this._walkMP} / ${this.getRunMP()}`;
        const run = this.hasMyomerBooster() ? `${this.getRunMP()} (${this.getBoostedRunMP()})` : `${this.getRunMP()}`;
        const jump = this.getUMUMP() > 0 ? `; UMU ${this.getUMUMP()}` : ` / ${this.getJumpMP()}`;
        return `${this._walkMP} / ${run}${jump}`;
    }

    // Weapons and equipment ------------------------------------------------------------------------------------

    public getMounts(): IProtoMechMount[] { return this._mounts; }
    public getMissile(mount: IProtoMechMount): IProtoMechMissile | undefined { return getProtoMechMissileByTag(mount.tag); }
    public getSpecial(mount: IProtoMechMount): IProtoMechEquipment | undefined { return findProtoMechEquipment(mount.tag); }
    public getCatalogItem(mount: IProtoMechMount): IEquipmentItem | undefined {
        const missile = this.getMissile(mount);
        if (missile) return findCatalogItem(missile.catalogTag);
        const special = this.getSpecial(mount);
        if (special) return special.catalogTag ? findCatalogItem(special.catalogTag) : undefined;
        return findCatalogItem(mount.tag);
    }
    private _known(mount: IProtoMechMount): boolean { return !!(this.getMissile(mount) || this.getSpecial(mount) || findCatalogItem(mount.tag)); }

    public getMountName(mount: IProtoMechMount): string {
        const missile = this.getMissile(mount);
        if (missile) return `${missile.name} ${mount.tubes ?? 1}`;
        return this.getSpecial(mount)?.name ?? findCatalogItem(mount.tag)?.name ?? mount.tag;
    }
    public getMountWeight(mount: IProtoMechMount): number {
        const missile = this.getMissile(mount);
        if (missile) return missile.kgPerTube * (mount.tubes ?? 1);
        const special = this.getSpecial(mount);
        if (special) return getProtoMechEquipmentKg(special, this._tons);
        return Math.round((findCatalogItem(mount.tag)?.weight ?? 0) * 1000);
    }

    /** Does the item draw on ammunition bought by the shot? */
    public usesAmmo(mount: IProtoMechMount): boolean {
        if (this.getMissile(mount)) return true;
        if (this.getSpecial(mount)) return false;
        const item = findCatalogItem(mount.tag);
        return !!item && ((item.shotsPerTon ?? 0) > 0 || !!item.ammoTypes?.length);
    }
    /** Ammunition a mount may carry: the weapon's family, limited to what a ProtoMech can load. */
    public getAmmoOptions(mount: IProtoMechMount): IEquipmentItem[] {
        const weapon = this.getCatalogItem(mount);
        if (!weapon || !this.usesAmmo(mount)) return [];
        return getClanCatalog().filter((ammo) => ammo.isAmmo && (ammo.space?.protomech ?? -1) >= 0 && getCompatibleAmmo(weapon, ammo));
    }
    public getAmmo(mount: IProtoMechMount): IEquipmentItem | undefined {
        const options = this.getAmmoOptions(mount);
        return options.find((ammo) => ammo.tag === mount.ammoTag) ?? options.find((ammo) => !ammo.isSpecialAmmo) ?? options[0];
    }
    /**
     * Kilograms a shot: a volley for a tube launcher (TM p.88). A weapon the ProtoMech Ammunition Weight Table leaves
     * out uses 1,000 divided by its shots a ton, as chemical lasers do (TO:AUE p.131). That rule rounds up to the
     * kilogram; the rounding is done on the load, as TM p.88 does, which is how the published designs weigh it: the
     * Svartalfa Ultra's 15 medium chemical laser shots are 500 kg (TRO: Prototypes p.91).
     */
    public getShotWeight(mount: IProtoMechMount): number {
        const missile = this.getMissile(mount);
        if (missile) return missile.kgPerMissile * (mount.tubes ?? 1);
        if (!this.usesAmmo(mount)) return 0;
        const listed = protoMechAmmoKgPerShot[mount.tag];
        if (listed) return listed;
        const weapon = findCatalogItem(mount.tag);
        const shots = weapon ? getWeaponShotsPerTon(weapon, this.getAmmo(mount)) : 0;
        return shots > 0 ? 1000 / shots : 0;
    }
    public getShots(mount: IProtoMechMount): number {
        const special = this.getSpecial(mount);
        if (special?.fixedShots) return special.fixedShots;
        return this.usesAmmo(mount) ? mount.shots ?? 0 : 0;
    }
    public getAmmoWeight(mount: IProtoMechMount): number {
        if (!this.usesAmmo(mount) || this.getSpecial(mount)) return 0;
        return Math.ceil(round2(this.getShots(mount) * this.getShotWeight(mount)));
    }
    /** Ammunition by kind: fractions of a kilogram round up once all its shots are added together (TM p.88). */
    public getAmmoLoads(): { name: string; shots: number; kg: number }[] {
        const loads: Record<string, { name: string; shots: number; raw: number }> = {};
        for (const mount of this._mounts) {
            if (!this.usesAmmo(mount) || this.getSpecial(mount) || this.getShots(mount) <= 0) continue;
            const ammo = this.getMissile(mount) ? undefined : this.getAmmo(mount);
            const key = `${this._mountKey(mount)}:${mount.ammoTag ?? ""}`;
            const special = ammo?.isSpecialAmmo ? ` (${ammo.name})` : "";
            const load = loads[key] ?? (loads[key] = { name: `${this.getMountName(mount)}${special}`, shots: 0, raw: 0 });
            load.shots += this.getShots(mount);
            load.raw += this.getShots(mount) * this.getShotWeight(mount);
        }
        return Object.values(loads).map((load) => ({ name: load.name, shots: load.shots, kg: Math.ceil(round2(load.raw)) }));
    }

    public getEdpArmorSlot(): number { return this._armorType === "edp" ? 1 : 0; }
    /** Items a location may hold; EDP armor takes one from the torso (IO:AE p.59). */
    public getLocationItems(location: ProtoMechMountLocation): number {
        const limit = getProtoMechLocationLimit(this._chassis, this._tons, location).items;
        return location === "torso" ? Math.max(0, limit - this.getEdpArmorSlot()) : limit;
    }
    public getLocationMaxWeight(location: ProtoMechMountLocation): number | null { return getProtoMechLocationLimit(this._chassis, this._tons, location).maxKg; }
    public getLocationMounts(location: ProtoMechMountLocation): IProtoMechMount[] { return this._mounts.filter((mount) => mount.location === location); }
    public getLocationWeight(location: ProtoMechMountLocation): number {
        return this.getLocationMounts(location).reduce((sum, mount) => sum + this.getMountWeight(mount), 0);
    }

    /** Catalog items, ProtoMech-only items and tube launchers on offer at a rules level. */
    public getAvailableCatalogItems(rulesLevel: number = 7): IEquipmentItem[] {
        return getProtoMechCatalogItems().filter((item) => getEquipmentRulesLevel(item) <= rulesLevel).sort((a, b) => a.name.localeCompare(b.name));
    }
    public getAvailableSpecials(rulesLevel: number = 7): IProtoMechEquipment[] {
        return protoMechEquipment.filter((item) => item.rulesLevel <= rulesLevel && item.chassis.includes(this._chassis));
    }
    public getAvailableMissiles(rulesLevel: number = 7): IProtoMechMissile[] { return protoMechMissiles.filter((item) => item.rulesLevel <= rulesLevel); }

    public addMount(tag: string, location: ProtoMechMountLocation, tubes?: number): boolean {
        if (this._mounts.length >= MAX_PROTOMECH_MOUNTS || !this.getMountLocations().includes(location)) return false;
        const mount: IProtoMechMount = { tag, location };
        if (!this._known(mount)) return false;
        const missile = this.getMissile(mount);
        if (missile) mount.tubes = clampInt(tubes, 1, missile.maxTubes, 1);
        const special = this.getSpecial(mount);
        if (special && !special.locations.includes(location)) return false;
        if (this.usesAmmo(mount)) mount.shots = 0;
        this._mounts.push(mount);
        return true;
    }
    public removeMount(index: number): void {
        if (index >= 0 && index < this._mounts.length) this._mounts.splice(index, 1);
        this._clamp();
    }
    public updateMount(index: number, change: Partial<IProtoMechMount>): void {
        const mount = this._mounts[index];
        if (!mount) return;
        if (change.location && this.getMountLocations().includes(change.location)) {
            const special = this.getSpecial(mount);
            if (!special || special.locations.includes(change.location)) mount.location = change.location;
        }
        const missile = this.getMissile(mount);
        if (change.tubes !== undefined && missile) mount.tubes = clampInt(change.tubes, 1, missile.maxTubes, mount.tubes ?? 1);
        if (change.rear !== undefined) mount.rear = change.rear === true;
        if (change.shots !== undefined && this.usesAmmo(mount)) mount.shots = clampInt(change.shots, 0, MAX_PROTOMECH_SHOTS, 0);
        if (change.ammoTag !== undefined) {
            if (this.getAmmoOptions(mount).some((ammo) => ammo.tag === change.ammoTag)) mount.ammoTag = change.ammoTag;
            else delete mount.ammoTag;
        }
        this._clamp();
    }

    // Heat sinks -----------------------------------------------------------------------------------------------

    /**
     * Does the weapon need heat sinks? Energy weapons do (TM p.86). Those fed by ammunition do not: chemical lasers
     * are treated as ballistic weapons (TO:AUE p.131) and vehicle and heavy flamers vent like them. The plasma cannon
     * is the exception, an energy weapon that also uses ammunition.
     */
    public needsHeatSinks(mount: IProtoMechMount): boolean {
        if (this.getMissile(mount) || this.getSpecial(mount)) return false;
        const item = findCatalogItem(mount.tag);
        if (!item || item.category !== "Energy Weapons") return false;
        return item.tag === "plasma-cannon" || !this.usesAmmo(mount);
    }
    /** One heat sink for each point of heat the energy weapons make; none come with the engine (TM p.86). */
    public getHeatSinks(): number {
        return this._mounts.reduce((sum, mount) => sum + (this.needsHeatSinks(mount) ? findCatalogItem(mount.tag)?.heat ?? 0 : 0), 0);
    }
    public getHeatSinkWeight(): number { return this.getHeatSinks() * PROTOMECH_HEAT_SINK_KG; }

    // Weight ---------------------------------------------------------------------------------------------------

    public getWeightLog(): { label: string; kg: number }[] {
        const lines = [
            { label: "Internal structure", kg: this.getStructureWeight() },
            { label: `Engine (rating ${this.getInstalledEngineRating()})`, kg: this.getEngineWeight() },
            { label: this.isUltraheavy() ? "Ultraheavy cockpit" : "Cockpit", kg: this.getCockpitWeight() },
        ];
        const jump = this.getJumpType();
        if (jump !== "none") lines.push({ label: `${jump === "umu" ? "UMUs" : jump === "extended" ? "Extended jump jets" : "Jump jets"} (${this._jumpMP})`, kg: this.getJumpWeight() });
        if (this.hasMyomerBooster()) lines.push({ label: "Myomer booster", kg: this.getMyomerBoosterWeight() });
        if (this.getHeatSinks() > 0) lines.push({ label: `Heat sinks (${this.getHeatSinks()})`, kg: this.getHeatSinkWeight() });
        if (this.getTotalArmor() > 0) lines.push({ label: `${this._armorType === "edp" ? "EDP armor" : "Armor"} (${this.getTotalArmor()} points)`, kg: this.getArmorWeight() });
        for (const mount of this._mounts) {
            lines.push({ label: `${this.getMountName(mount)} (${this.getLocationName(mount.location)}${mount.rear ? ", rear" : ""})`, kg: this.getMountWeight(mount) });
        }
        for (const load of this.getAmmoLoads()) lines.push({ label: `Ammunition: ${load.name} (${load.shots} shots)`, kg: load.kg });
        return lines;
    }
    public getWeight(): number { return round2(this.getWeightLog().reduce((sum, line) => sum + line.kg, 0)); }
    public getMaxWeight(): number { return this._tons * 1000; }
    public getRemainingWeight(): number { return round2(this.getMaxWeight() - this.getWeight()); }

    // Rules level, era, validation -----------------------------------------------------------------------------

    public getRequiredRulesLevel(): number {
        let level = PROTOMECH_RULES_LEVEL;
        if (this._chassis !== "biped" || this.isUltraheavy()) level = Math.max(level, PROTOMECH_ADVANCED_RULES_LEVEL);
        if (this._interfaceCockpit) level = Math.max(level, PROTOMECH_INTERFACE_COCKPIT.rulesLevel);
        if (this._armorType === "edp" || this.getJumpType() === "umu") level = Math.max(level, PROTOMECH_EXPERIMENTAL_RULES_LEVEL);
        for (const mount of this._mounts) {
            const missile = this.getMissile(mount);
            const special = this.getSpecial(mount);
            const item = findCatalogItem(mount.tag);
            level = Math.max(level, missile?.rulesLevel ?? special?.rulesLevel ?? (item ? getEquipmentRulesLevel(item) : level));
        }
        return level;
    }

    public getEra(): IEras { return this._era; }
    public getAvailableEras(): IEras[] { return getErasForTech("clan").filter((era) => (era.yearEnd ?? Infinity) >= 3055); }
    public setEra(tag: string): boolean {
        const era = this.getAvailableEras().find((item) => item.tag === tag);
        if (era) this._era = era;
        return !!era;
    }
    /** Is something first built in `year` in service by the end of the era? Experimental designs may use prototypes. */
    private _inEra(introduced: number | null | undefined, prototype?: number | null): boolean {
        const year = introduced ?? prototype ?? null;
        return year === null || year <= (this._era.yearEnd ?? Infinity);
    }
    public getEraIssues(): string[] {
        const issues: string[] = [];
        const late = (name: string, year: number | null | undefined): void => {
            if (year) issues.push(`${name} is not available before ${year}; the era chosen ends in ${this._era.yearEnd}.`);
        };
        const component = (tag: string) => protoMechComponents.find((item) => item.tag === tag);
        const chassis = PROTOMECH_CHASSIS.find((item) => item.tag === this._chassis);
        if (chassis && !this._inEra(chassis.introduced)) late(`The ${chassis.name} ProtoMech`, chassis.introduced);
        else if (this.isUltraheavy() && !this._inEra(PROTOMECH_ULTRAHEAVY_INTRODUCED)) late("The Ultraheavy ProtoMech", PROTOMECH_ULTRAHEAVY_INTRODUCED);
        else if (!this._inEra(component("protomech-cockpit")?.introduced, component("protomech-cockpit")?.prototype)) late("The ProtoMech", component("protomech-cockpit")?.prototype);
        const xjj = component("protomech-extended-jump-jets");
        if (this.getJumpType() === "extended" && !this._inEra(xjj?.introduced, xjj?.prototype)) late("The Extended Jump Jet System", xjj?.introduced ?? xjj?.prototype);
        if (this.getJumpType() === "umu" && !this._inEra(PROTOMECH_UMU.introduced, PROTOMECH_UMU.prototype)) late("ProtoMech UMUs", PROTOMECH_UMU.prototype);
        if (this._interfaceCockpit && !this._inEra(PROTOMECH_INTERFACE_COCKPIT.introduced)) late("The Inner Sphere ProtoMech Interface", PROTOMECH_INTERFACE_COCKPIT.introduced);
        if (this._armorType === "edp" && !this._inEra(null, 3071)) late("EDP armor", 3071);
        if (this.hasMyomerBooster()) {
            const booster = findCatalogItem(PROTOMECH_MYOMER_BOOSTER.tag);
            if (booster && !this._inEra(booster.introduced, booster.prototype)) late("The ProtoMech Myomer Booster", booster.introduced ?? booster.prototype);
        }
        const seen = new Set<string>();
        for (const mount of this._mounts) {
            if (seen.has(mount.tag)) continue;
            seen.add(mount.tag);
            const missile = this.getMissile(mount);
            const special = this.getSpecial(mount);
            const item = special ? undefined : this.getCatalogItem(mount);
            const introduced = special ? special.introduced : missile?.prototype ? null : item?.introduced;
            const prototype = special ? special.prototype : missile?.prototype ?? item?.prototype;
            if (!this._inEra(introduced, prototype)) late(missile ? `${missile.name} tubes` : special?.name ?? item?.name ?? mount.tag, introduced ?? prototype);
        }
        return issues;
    }

    public getIssues(): string[] {
        const issues: string[] = [];
        if (this.isGlider() && !this.isUltraheavy()) issues.push("A Glider ProtoMech is built on the Ultraheavy chassis: 10 to 15 tons (IO:AE p.95).");
        if (this.getEngineRating() > PROTOMECH_MAX_ENGINE_RATING) issues.push(`Engine Rating ${this.getEngineRating()} is over the limit of ${PROTOMECH_MAX_ENGINE_RATING} (TM p.83).`);
        if (this.isGlider() && this.getRunMP() < PROTOMECH_GLIDER_MIN_FLANK) issues.push(`A Glider needs a WiGE Flanking MP of ${PROTOMECH_GLIDER_MIN_FLANK} or more (IO:AE p.96).`);
        if (this.isQuad() && this.getRunMP() < PROTOMECH_QUAD_MIN_RUN) issues.push(`A Quad ProtoMech needs a Running MP of ${PROTOMECH_QUAD_MIN_RUN} or more (IO:AE p.96).`);
        if (this.getJumpJets() > this.getMaxJumpJets()) issues.push(`No more than ${this.getMaxJumpJets()} ${this.getJumpType() === "umu" ? "UMUs" : "jump jets"} may be mounted.`);
        for (const location of this.getLocations()) {
            if (this._armor[location] > this.getMaxArmor(location)) issues.push(`${this.getLocationName(location)}: ${this._armor[location]} armor points, over the limit of ${this.getMaxArmor(location)}.`);
        }
        for (const location of MOUNT_LOCATIONS) {
            const mounts = this._mounts.filter((mount) => mount.location === location);
            if (mounts.length === 0) continue;
            const name = PROTOMECH_LOCATION_NAMES[location];
            if (!this.getMountLocations().includes(location)) {
                issues.push(location === "mainGun" ? "Equipment is mounted on a main gun the ProtoMech does not have." : `A Quad ProtoMech has no ${name}.`);
                continue;
            }
            const items = this.getLocationItems(location);
            if (mounts.length > items) issues.push(`${name}: ${mounts.length} items, over the limit of ${items}${location === "torso" && this.getEdpArmorSlot() ? " (EDP armor takes one)" : ""} (${this.isQuad() || this.isUltraheavy() ? "IO:AE p.96" : "TM p.87"}).`);
            const maxKg = this.getLocationMaxWeight(location);
            const kg = this.getLocationWeight(location);
            if (maxKg !== null && kg > maxKg) issues.push(`${name}: ${kg} kg of equipment, over the limit of ${maxKg} kg.`);
        }
        for (const mount of this._mounts) {
            const special = this.getSpecial(mount);
            if (special && !special.chassis.includes(this._chassis)) issues.push(`${special.name} cannot be mounted on a ${this.getChassisName()} ProtoMech (${special.book} p.${special.page}).`);
            if (special && !special.locations.includes(mount.location)) issues.push(`${special.name} cannot be mounted in the ${PROTOMECH_LOCATION_NAMES[mount.location]}.`);
            if (mount.rear && mount.location !== "torso") issues.push(`${this.getMountName(mount)}: only torso weapons may be mounted to the rear (TM p.87).`);
            if (this.usesAmmo(mount) && !special && this.getShots(mount) <= 0) issues.push(`${this.getMountName(mount)} carries no ammunition.`);
        }
        for (const tag of ["protomech-melee-weapon", "protomech-magnetic-clamp", "protomech-partial-wing", "protomech-quad-melee-system"]) {
            if (this._mounts.filter((mount) => mount.tag === tag).length > 1) issues.push(`Only one ${findProtoMechEquipment(tag)?.name} may be mounted.`);
        }
        if (this.hasPartialWing() && this.getJumpType() === "umu") issues.push("A ProtoMech with UMUs has no jump jets for a partial wing to help.");
        const over = -this.getRemainingWeight();
        if (over > 0) issues.push(`${over} kg over its ${this._tons} tons.`);
        return [...issues, ...this.getEraIssues()];
    }
    public isLegal(): boolean { return this.getIssues().length === 0; }

    public getNotes(): string[] {
        const notes: string[] = [];
        const spare = this.getRemainingWeight();
        if (spare > 0) notes.push(`${spare} kg unspent; unspent weight is wasted (TM p.81).`);
        if (this.isGlider()) notes.push("Glider: 1 MP on the ground; takes off and stays aloft on 4 WiGE MP or more; no jump jets, partial wing, UMUs or myomer booster (IO:AE pp.94-96).");
        if (this.isQuad() && this._mainGun) notes.push("A Quad's main gun is a turret with a 360-degree arc (IO:AE p.93).");
        if (this.isUltraheavy()) notes.push("Ultraheavy: Frenzy attack damage 3; the pilot may eject (IO:AE pp.94-95).");
        if (this._interfaceCockpit) notes.push("Inner Sphere ProtoMech Interface: Mixed Technology; the pilot has no ejection system (IO:AE p.96).");
        if (this._armorType === "edp") notes.push("EDP armor: a successful Frenzy attack also hits as a BattleMech Taser at -2 on its effects table; six turns to recharge, during which weapons that need heat sinks do not work (IO:AE p.59).");
        if (this.hasPartialWing()) notes.push("Partial wing: +2 Jumping MP in a standard atmosphere, +1 in a trace one, +3 in a high or very high one, none in vacuum (TO:AUE p.107).");
        if (this.getHeatSinks() > 0) notes.push(`${this.getHeatSinks()} heat sinks cover the energy weapons; ProtoMechs do not track heat (TM p.86).`);
        return notes;
    }

    // Battle Value (TM pp.306-307) -----------------------------------------------------------------------------

    public getFrenzyDamage(): number {
        let damage = getProtoMechFrenzyDamage(this._tons);
        if (this._mounts.some((mount) => mount.tag === "protomech-melee-weapon")) damage += Math.ceil(this._tons / 5);
        if (this._mounts.some((mount) => mount.tag === "protomech-quad-melee-system")) damage += 2 * Math.ceil(this._tons / 5);
        return damage;
    }

    private _mountBattleValue(mount: IProtoMechMount): number {
        const missile = this.getMissile(mount);
        if (missile) return missile.bv[(mount.tubes ?? 1) - 1] ?? 0;
        const special = this.getSpecial(mount);
        if (special) {
            // The added Frenzy damage x 1.25 (TO:AUE p.199; IO:AE p.190).
            if (special.bv === "melee") return Math.ceil(this._tons / 5) * 1.25;
            if (special.bv === "quad-melee") return 2 * Math.ceil(this._tons / 5) * 1.25;
            return special.bv;
        }
        return findCatalogItem(mount.tag)?.battleValue ?? 0;
    }
    /** Kilograms of ammunition ÷ 1,000 x its Battle Value for a ton (TM p.306). */
    private _ammoBattleValue(mount: IProtoMechMount): number {
        if (!this.usesAmmo(mount)) return 0;
        const missile = this.getMissile(mount);
        const perTon = missile ? missile.ammoBV[(mount.tubes ?? 1) - 1] ?? 0 : (() => {
            const weapon = findCatalogItem(mount.tag);
            const ammo = this.getAmmo(mount);
            return weapon && ammo ? getAmmoBattleValuePerTon(weapon, ammo) : 0;
        })();
        return this.getShots(mount) * this.getShotWeight(mount) / 1000 * perTon;
    }
    private _isDefensive(mount: IProtoMechMount): boolean { return !this.getMissile(mount) && !this.getSpecial(mount) && !!findCatalogItem(mount.tag)?.battleValueDefensive; }
    private _mountKey(mount: IProtoMechMount): string { return `${mount.tag}:${mount.tubes ?? 0}`; }

    private _calcBattleValue(): { value: number; log: string[] } {
        const log: string[] = [];
        const armor = this.getTotalArmor() * 2.5;
        const structure = this.getTotalStructure() * 1.5;
        log.push(`Armor: ${this.getTotalArmor()} points x 2.5 = ${round2(armor)}`);
        log.push(`Internal structure: ${this.getTotalStructure()} points x 1.5 = ${round2(structure)}`);
        // Defensive equipment, with anti-missile ammunition up to the systems' own value.
        let defensiveEquipment = 0;
        const defensiveByKey: Record<string, { weapon: number; ammo: number }> = {};
        for (const mount of this._mounts.filter((item) => this._isDefensive(item))) {
            const entry = defensiveByKey[mount.tag] ?? (defensiveByKey[mount.tag] = { weapon: 0, ammo: 0 });
            entry.weapon += this._mountBattleValue(mount);
            entry.ammo += this._ammoBattleValue(mount);
        }
        for (const [tag, entry] of Object.entries(defensiveByKey)) {
            const value = entry.weapon + Math.min(entry.ammo, entry.weapon);
            defensiveEquipment += value;
            log.push(`Defensive equipment: ${findCatalogItem(tag)?.name ?? tag} = ${round2(value)}`);
        }
        // The highest target movement modifier: running (boosted), jumping (+1), a Glider's WiGE flank (+1) or UMUs.
        const run = this.isGlider() ? this.getRunMP() : this.getBoostedRunMP();
        const modifiers = [getMovementModifier(run) + (this.isGlider() ? 1 : 0)];
        if (this.getJumpMP() > 0) modifiers.push(getMovementModifier(this.getJumpMP()) + 1);
        if (this.getUMUMP() > 0) modifiers.push(getMovementModifier(this.getUMUMP()));
        const modifier = Math.max(...modifiers);
        const defensiveFactor = round2(1 + modifier / 10 + 0.1);
        const defensive = (armor + structure + defensiveEquipment) * defensiveFactor;
        log.push(`Defensive Factor: 1 + ${round2(modifier / 10)} (target movement modifier +${modifier}) + 0.1 (ProtoMech) = ${defensiveFactor}`);
        log.push(`Defensive Battle Rating: ${round2(armor + structure + defensiveEquipment)} x ${defensiveFactor} = ${round2(defensive)}`);

        const offensiveMounts = this._mounts.filter((mount) => !this._isDefensive(mount));
        const arc = (rear: boolean): number => offensiveMounts.filter((mount) => !!mount.rear === rear && mount.location === "torso").reduce((sum, mount) => sum + this._mountBattleValue(mount), 0);
        // Rear-firing weapons count half, or the forward torso weapons if those are worth less (TM p.303).
        const halveRear = arc(true) <= arc(false);
        const byKey: Record<string, { weapon: number; ammo: number; name: string }> = {};
        let weapons = 0;
        for (const mount of offensiveMounts) {
            const halved = mount.location === "torso" && arc(true) > 0 && !!mount.rear === halveRear;
            const value = this._mountBattleValue(mount) * (halved ? 0.5 : 1);
            weapons += value;
            const entry = byKey[this._mountKey(mount)] ?? (byKey[this._mountKey(mount)] = { weapon: 0, ammo: 0, name: this.getMountName(mount) });
            entry.weapon += this._mountBattleValue(mount);
            entry.ammo += this._ammoBattleValue(mount);
            log.push(`${this.getMountName(mount)} (${this.getLocationName(mount.location)}${mount.rear ? ", rear" : ""}) = ${round2(value)}${halved ? " (x 0.5)" : ""}`);
        }
        let ammo = 0;
        for (const entry of Object.values(byKey)) {
            if (entry.ammo <= 0) continue;
            const value = Math.min(entry.ammo, entry.weapon);
            ammo += value;
            log.push(`Ammunition: ${entry.name} = ${round2(value)}${value < entry.ammo ? " (held to the weapon's value)" : ""}`);
        }
        const edp = this._armorType === "edp" ? 32 : 0;
        if (edp) log.push("EDP armor = 32 (IO:AE p.190)");
        // Running MP + half the Jumping MP, rounded up, + 1 for a myomer booster (TM p.306); a Glider's WiGE Flanking MP (IO:AE p.190).
        const speedMP = (this.isGlider() ? this.getRunMP() : this.getGroundRunMP()) + Math.ceil(this.getJumpMP() / 2) + (this.hasMyomerBooster() ? 1 : 0);
        const factor = speedFactor(speedMP);
        const offensive = (weapons + ammo + edp) * factor;
        log.push(`Offensive Battle Rating: ${round2(weapons + ammo + edp)} x ${factor} (Speed Factor, ${speedMP}) = ${round2(offensive)}`);
        const value = roundNormally(defensive + offensive);
        log.push(`Battle Value: ${round2(defensive)} + ${round2(offensive)} = ${round2(defensive + offensive)}, or ${value}`);
        return { value, log };
    }
    public getBattleValue(): number { return this._calcBattleValue().value; }
    public getBattleValueLog(): string[] { return this._calcBattleValue().log; }
    public getPointBattleValue(): number { return this.getBattleValue() * this._pointSize; }
    /** ProtoMechs have no Piloting Skill; the multiplier is read from the Piloting 5 column. */
    public getSkillMultiplier(edition?: string): number { return getSkillMultiplier(this._gunnery, 5, "protomech", edition) ?? 1; }
    public getSkillAdjustedBattleValue(edition?: string): number { return roundNormally(this.getBattleValue() * this.getSkillMultiplier(edition)); }
    public getSkillAdjustedPointBattleValue(edition?: string): number { return this.getSkillAdjustedBattleValue(edition) * this._pointSize; }

    // Cost (TM pp.279, 283, 285), without ammunition -----------------------------------------------------------

    private _mountCost(mount: IProtoMechMount): number {
        const missile = this.getMissile(mount);
        if (missile) return missile.standardCost[mount.tubes ?? 1] ?? missile.costPerTube * (mount.tubes ?? 1);
        const special = this.getSpecial(mount);
        if (special) return special.cost === "partial-wing" ? 50000 * getProtoMechEquipmentKg(special, this._tons) / 1000 : special.cost;
        return findCatalogItem(mount.tag)?.cbills ?? 0;
    }
    private _calcCost(): { value: number; log: string[] } {
        const component = (tag: string): number => protoMechComponents.find((item) => item.tag === tag)?.cost.value ?? 0;
        const tons = this._tons;
        const jets = this.getJumpJets();
        const jump = this.getJumpType();
        const lines: [string, number][] = [
            ["Cockpit", this._interfaceCockpit ? PROTOMECH_INTERFACE_COCKPIT.cost : component(this.isUltraheavy() ? "protomech-ultraheavy-cockpit" : "protomech-cockpit")],
            ["Life support", PROTOMECH_COSTS.lifeSupport],
            ["Sensors", PROTOMECH_COSTS.sensorsPerTon * tons],
            ["Musculature", PROTOMECH_COSTS.musculaturePerTon * tons],
            ["Internal structure", component(this.isGlider() ? "protomech-glider-structure" : this.isQuad() ? "protomech-quad-structure" : "protomech-structure") * tons],
            ["Arm actuators", this.isQuad() ? 0 : 2 * PROTOMECH_COSTS.armActuatorPerTon * tons],
            ["Leg actuators", PROTOMECH_COSTS.legActuatorsPerTon * tons],
            ["Engine", 5000 * this.getInstalledEngineRating() * tons / 75],
            [jump === "umu" ? "UMUs" : "Jump jets", (jump === "umu" ? PROTOMECH_UMU.costFactor : jump === "extended" ? component("protomech-extended-jump-jets") : component("protomech-jump-jets")) * jets * jets * tons],
            ["Myomer booster", 1000 * this.getInstalledEngineRating() * this.getMyomerBoosterWeight() / 1000],
            ["Heat sinks", component("protomech-heat-sink") * this.getHeatSinks()],
            ["Armor", (this._armorType === "edp" ? PROTOMECH_COSTS.edpArmorPerPoint : PROTOMECH_COSTS.armorPerPoint) * this.getTotalArmor()],
            ["Weapons and equipment", this._mounts.reduce((sum, mount) => sum + this._mountCost(mount), 0)],
        ];
        const subtotal = lines.reduce((sum, line) => sum + line[1], 0);
        const multiplier = 1 + tons / 100;
        const value = Math.round(subtotal * multiplier);
        const log = lines.filter((line) => line[1] > 0).map((line) => `${line[0]}: ${Math.round(line[1]).toLocaleString("en-US")}`);
        log.push(`Total: ${Math.round(subtotal).toLocaleString("en-US")} x ${multiplier} (1 + ${tons} tons / 100) = ${value.toLocaleString("en-US")} C-bills, without ammunition`);
        return { value, log };
    }
    public getCBillCost(): number { return this._calcCost().value; }
    public getCBillCostLog(): string[] { return this._calcCost().log; }
    public getPointCBillCost(): number { return this.getCBillCost() * this._pointSize; }

    // Alpha Strike (Alpha Strike Companion pp.92-141, with errata v1.6) ----------------------------------------

    /** Alpha Strike damage of a mount at short, medium and long range, before any rounding. */
    private _alphaStrikeDamage(mount: IProtoMechMount): [number, number, number] {
        const missile = this.getMissile(mount);
        if (missile) {
            // The Companion's missile values are the Cluster Hits Table at a roll of 7 (TW p.116), a tenth of a point
            // a missile, doubled for SRMs; Streak launchers hit with every tube (ASC pp.110, 112).
            const tubes = mount.tubes ?? 1;
            const hits = missile.family.startsWith("streak") ? tubes : CLUSTER_HITS_ON_7[tubes] ?? tubes;
            const value = hits * (missile.family.endsWith("srm") ? 0.2 : 0.1);
            return missile.family.endsWith("lrm") ? [value, value, value] : [value, value, 0];
        }
        const special = this.getSpecial(mount);
        if (special) return special.tag === "protomech-fusillade" ? [0.45, 0.3, 0] : [0, 0, 0];
        const values = findCatalogItem(mount.tag)?.alphaStrike;
        return values ? [values.rangeShort || 0, values.rangeMedium || 0, values.rangeLong || 0] : [0, 0, 0];
    }

    public getAlphaStrikeStats(): IProtoMechAlphaStrikeStats {
        const log: string[] = [];
        const specials: string[] = [];
        const add = (code: string): void => { if (!specials.includes(code)) specials.push(code); };
        const tmmOf = (inches: number): number => (inches >= 35 ? 5 : inches >= 19 ? 4 : inches >= 13 ? 3 : inches >= 9 ? 2 : inches >= 5 ? 1 : 0);

        // Move: 2 inches a MP; a myomer booster counts as MASC, x 1.25 on the ground (ASC p.93).
        const groundMP = this.hasMyomerBooster() ? Math.round(this.getGroundWalkMP() * 1.25 + 1e-9) : this.getGroundWalkMP();
        const ground = groundMP * 2;
        const jump = this.getJumpMP() * 2;
        const glide = this.isGlider() ? this._walkMP * 2 : 0;
        const umu = this.getUMUMP() * 2;
        let move = `${ground}"`;
        if (glide > 0) { move = `${ground}"/${glide}"g`; add("GLD"); }
        else if (jump > 0) move = jump === ground ? `${ground}"j` : `${ground}"/${jump}"j`;
        if (umu > 0) { move += `/${umu}"s`; add("UMU"); }
        const best = Math.max(ground, jump, glide, umu);
        // The target movement modifier never comes from a jumping Move over a non-jumping one (errata v1.6, p.141).
        const primary = Math.max(ground, glide);
        const tmm = tmmOf(primary);
        const jumpDifference = jump > 0 ? tmmOf(jump) - tmm : 0;
        if (jumpDifference > 0) add(`JMPS${jumpDifference}`);
        if (jumpDifference < 0) add(`JMPW${-jumpDifference}`);
        log.push(`Move: ${move}${this.hasMyomerBooster() ? " (myomer booster, as MASC: x 1.25)" : ""}; target movement modifier +${tmm}`);

        // Armor: armor factor / 30, rounded; Structure is always 1 (ASC pp.95, 97).
        const armor = Math.round(this.getTotalArmor() / 30 + 1e-9);
        const structure = 1;
        log.push(`Armor: ${this.getTotalArmor()} / 30 = ${(this.getTotalArmor() / 30).toFixed(2)}, rounded to ${armor}. Structure: ${structure}`);

        // Damage: forward weapons, or the rear ones if they do more (ASC p.100). Under 10 shots: x 0.75 (ASC p.101).
        const sum = (mounts: IProtoMechMount[]): number[] => {
            const total = [0, 0, 0];
            for (const mount of mounts) {
                const few = this.usesAmmo(mount) && !this.getSpecial(mount) && this._shotsFor(mount) < 10;
                this._alphaStrikeDamage(mount).forEach((value, range) => { total[range] += value * (few ? 0.75 : 1); });
            }
            return total;
        };
        const front = this._mounts.filter((mount) => !mount.rear);
        const rear = this._mounts.filter((mount) => !!mount.rear);
        const useRear = sum(rear).reduce((a, b) => a + b, 0) > sum(front).reduce((a, b) => a + b, 0);
        const firing = useRear ? rear : front;
        const total = sum(firing);
        const value = (damage: number): IProtoMechASDamageValue =>
            damage <= 1e-9 ? { damage: 0, minimal: false } : damage < 0.5 ? { damage: 0, minimal: true } : { damage: Math.ceil(damage - 1e-9), minimal: false };
        const rated = (damage: number): IProtoMechASDamageValue =>
            damage <= 1e-9 ? { damage: 0, minimal: false } : damage < 0.5 ? { damage: 0, minimal: true } : { damage: Math.round(damage + 1e-9), minimal: false };
        const damageValues = { short: value(total[0]), medium: value(total[1]), long: value(total[2]) };
        log.push(`Damage: ${total.map((item) => item.toFixed(3)).join(" / ")}${useRear ? " (rear weapons)" : ""}, giving ${formatProtoMechASDamage(damageValues.short)}/${formatProtoMechASDamage(damageValues.medium)}/${formatProtoMechASDamage(damageValues.long)}`);

        // Special abilities (ASC pp.117-133).
        const family = (name: string): IProtoMechMount[] => firing.filter((mount) => this.getMissile(mount)?.family === name);
        const lrm = sum(family("lrm"));
        const srm = sum(family("srm"));
        const autocannon = sum(firing.filter((mount) => mount.tag.startsWith("protomech-autocannon-")));
        const flak = sum(firing.filter((mount) => (findCatalogItem(mount.tag)?.alphaStrike?.notes ?? []).some((note) => note.toLowerCase() === "flak")));
        const iatm = sum(firing.filter((mount) => mount.tag === "protomech-fusillade"));
        const triple = (values: number[], ranges: number): string => values.slice(0, ranges).map((item) => formatProtoMechASDamage(rated(item))).join("/");
        if (lrm[1] >= 1) add(`LRM${triple(lrm, 3)}`);
        if (srm[1] >= 1) add(`SRM${triple(srm, 2)}`);
        if (autocannon[1] >= 1) add(`AC${triple(autocannon, 3)}`);
        if (flak.some((item) => item > 1e-9)) add(`FLK${triple(flak, 3)}`);
        if (iatm[1] >= 1) add(`IATM${triple(iatm, 3)}`);
        // Indirect fire is rated by the Long range value of the LRMs (ASC p.125).
        const indirect = rated(lrm[2]);
        if (lrm[2] > 1e-9) add(`IF${formatProtoMechASDamage(indirect)}`);
        // Heat: 5 to 10 points at a range bracket rate 1, 11 or more rate 2 (ASC p.124).
        const heat = [0, 0, 0];
        for (const mount of firing) (PROTOMECH_AS_HEAT[mount.tag] ?? [0, 0, 0]).forEach((points, range) => { heat[range] += points; });
        const heatRatings = heat.map((points) => (points >= 11 ? 2 : points >= 5 ? 1 : 0));
        if (heatRatings.some((rating) => rating > 0)) add(`HT${heatRatings.map((rating) => rating || "-").join("/")}`);
        for (const mount of this._mounts) {
            const item = this.getSpecial(mount) ? undefined : this.getMissile(mount) ? undefined : findCatalogItem(mount.tag);
            if (item) for (const code of getAlphaStrikeEquipmentAbilityCodes(item)) add(code);
            if (mount.tag === "protomech-magnetic-clamp") add(this.isUltraheavy() ? "UCS" : "MCS");
            if (mount.tag === "protomech-melee-weapon" || mount.tag === "protomech-quad-melee-system") add("MEL");
        }
        if (["PRB", "LPRB", "BH", "WAT"].some((code) => specials.includes(code)) || this._mounts.some((mount) => mount.tag === "recon-camera")) add("RCN");
        // Energy: nothing that feeds on ammunition, and no improved heavy lasers (ASC p.122).
        const explosive = this._mounts.some((mount) => this.usesAmmo(mount) || !!this.getSpecial(mount)?.fixedShots || mount.tag.startsWith("clan-improved-heavy-"));
        if (!explosive) add("ENE");
        specials.sort();

        // Point Value (ASC pp.138-141 as corrected by errata v1.6).
        const points = (item: IProtoMechASDamageValue): number => (item.minimal ? 0.5 : item.damage);
        const short = points(damageValues.short);
        const medium = points(damageValues.medium);
        const long = points(damageValues.long);
        let offensive = short + medium * 2 + long + 0.5;
        const offensiveParts: string[] = [`${short} + 2 x ${medium} + ${long}`, "0.5 (half its Size)"];
        const addOffensive = (label: string, amount: number): void => { if (amount > 0) { offensive += amount; offensiveParts.push(`${amount} (${label})`); } };
        const heatValue = Math.max(...heatRatings);
        addOffensive("HT", heatValue > 0 ? heatValue + (heatRatings[1] > 0 ? 0.5 : 0) : 0);
        addOffensive("IF", lrm[2] > 1e-9 ? points(indirect) : 0);
        addOffensive("IATM", iatm[1] >= 1 ? points(rated(iatm[2])) : 0);
        addOffensive("SNARC", specials.includes("SNARC") ? 1 : 0);
        addOffensive("TAG", specials.includes("TAG") ? 0.5 : 0);
        addOffensive("LTAG", specials.includes("LTAG") ? 0.25 : 0);
        addOffensive("MEL", specials.includes("MEL") ? 0.5 : 0);
        log.push(`Offensive Value: ${offensiveParts.join(" + ")} = ${offensive}`);

        const jumps = jump > 0;
        const unarmed = short + medium + long === 0;
        // Movement modifier, + 1 for a ProtoMech, + half of JMPS; the jump-capable + 1 only for a unit with no damage values.
        // The table's "VTOL or WiGE Vehicle" + 1 is given to a Glider too, as the Master Unit List's cards do.
        const defenseModifier = tmm + 1 + Math.max(0, jumpDifference) / 2 + (jumps && unarmed ? 1 : 0) + (glide > 0 ? 1 : 0);
        const defenseFactor = 1 + (defenseModifier <= 2 ? 0.1 : 0.25) * defenseModifier;
        const interaction = roundToHalf((armor * 2 + structure) * defenseFactor);
        let defensive = best / 8 + (jumps ? 0.5 : 0);
        const defensiveParts: string[] = [`${best} / 8${jumps ? " + 0.5 (jump)" : ""} = ${defensive}`];
        if (specials.includes("AMS")) { defensive += 1; defensiveParts.push("1 (AMS)"); }
        defensive += interaction;
        defensiveParts.push(`(Armor ${armor} x 2 + Structure ${structure}) x ${defenseFactor.toFixed(2)} = ${interaction}`);
        log.push(`Defensive Value: ${defensiveParts.join(" + ")} = ${defensive}`);

        const subTotal = offensive + defensive;
        const agileTMM = tmm + Math.max(0, jumpDifference) / 2;
        let agile = 0;
        if (agileTMM > 1 && medium > 0) agile = (agileTMM - 1) * medium;
        else if (medium === 0 && tmm >= 3) agile = (agileTMM - 2) * short;
        agile = roundToHalf(agile);
        if (agile > 0) log.push(`Agile: + ${agile}`);
        // Brawler: slow units that reach no farther than Short or Medium range (errata v1.6, p.141).
        let brawler = 0;
        const shielded = specials.some((code) => code === "ECM" || code === "AECM" || code === "WAT");
        if (!unarmed && best >= 2 && !shielded) {
            const shortOnly = medium === 0 && long === 0;
            if (best >= 6 && best <= 10 && shortOnly) brawler = subTotal * 0.25;
            else if (best <= 5 && shortOnly) brawler = subTotal * 0.5;
            else if (best <= 5 && long === 0) brawler = subTotal * 0.25;
        }
        brawler = roundToHalf(brawler);
        if (brawler > 0) log.push(`Brawler: - ${brawler}`);
        let force = 0;
        if (specials.includes("AECM")) force += 3;
        if (specials.includes("ECM") || specials.includes("WAT")) force += 2;
        if (specials.includes("PRB") || specials.includes("LPRB")) force += 1;
        if (specials.includes("RCN")) force += 2;
        if (force > 0) log.push(`Force bonuses (ECM, probe, Recon): + ${force}`);
        const final = subTotal + agile - brawler + force;
        const pointValue = Math.max(1, Math.round(final + 1e-9));
        log.push(`Point Value: ${subTotal} ${agile > 0 ? `+ ${agile} ` : ""}${brawler > 0 ? `- ${brawler} ` : ""}${force > 0 ? `+ ${force} ` : ""}= ${final}, rounded to ${pointValue}`);

        return { type: "PM", size: 1, move, tmm, armor, structure, damageValues, specialAbilities: specials, pointValue, calcLog: log };
    }

    /** Shots carried for the weapon type a mount belongs to, shared by every mount of that type. */
    private _shotsFor(mount: IProtoMechMount): number {
        const key = this._mountKey(mount);
        const same = this._mounts.filter((item) => this._mountKey(item) === key);
        return same.reduce((sum, item) => sum + this.getShots(item), 0) / same.length;
    }

    /** The converted Alpha Strike card, built the same way as a Master Unit List record. */
    public getAlphaStrikeUnit(): AlphaStrikeUnit {
        const stats = this.getAlphaStrikeStats();
        const damage = stats.damageValues;
        const record = {
            Id: 0,
            Name: this.getDisplayName(),
            Class: "ProtoMech",
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
            BFOverheat: 0,
            BFPointValue: stats.pointValue,
            BFAbilities: stats.specialAbilities.join(","),
            Role: { Id: 0, Name: "None", Image: null, SortOrder: 0 },
            Technology: { Id: 0, Name: this._interfaceCockpit ? "Mixed" : "Clan", Image: null, SortOrder: 0 },
            Type: { Id: 0, Name: "ProtoMech", Image: null, SortOrder: 0 },
        } as unknown as IASMULUnit;
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        unit.rulesLevel = Math.max(2, this.getRequiredRulesLevel());
        return unit;
    }

    // Record sheet ---------------------------------------------------------------------------------------------

    public getWeaponLines(): IProtoMechWeaponLine[] {
        const letters: Record<string, number> = {};
        return this._mounts.map((mount, index) => {
            const item = this.getCatalogItem(mount);
            const missile = this.getMissile(mount);
            const special = this.getSpecial(mount);
            const letter = String.fromCharCode(65 + (letters[mount.location] ?? 0));
            letters[mount.location] = (letters[mount.location] ?? 0) + 1;
            const slot = mount.location === "torso" ? `Torso ${letter}${mount.rear ? " (rear)" : ""}` : this.getLocationName(mount.location);
            const damage = missile ? `${missile.family.includes("srm") ? 2 : 1}/missile` : special?.fixedShots ? "2/missile" : item && !special ? formatProtoMechDamage(item.damage) || "-" : "-";
            return {
                index, name: this.getMountName(mount), location: slot, damage,
                min: item?.range?.min ?? 0, short: item?.range?.short ?? 0, medium: item?.range?.medium ?? 0, long: item?.range?.long ?? 0,
                shots: this.usesAmmo(mount) || special?.fixedShots ? this.getShots(mount) : null,
            };
        });
    }

    // Skills and Point -----------------------------------------------------------------------------------------

    public getGunnery(): number { return this._gunnery; }
    public setGunnery(skill: number): void { this._gunnery = clampInt(skill, 0, 8, 4); }
    public getPointSize(): number { return this._pointSize; }
    public setPointSize(size: number): void { this._pointSize = clampInt(size, 1, PROTOMECH_POINT_SIZE, PROTOMECH_POINT_SIZE); }

    // Play -----------------------------------------------------------------------------------------------------

    public getInPlay(): IProtoMechInPlay { return this._inPlay; }
    public resetInPlay(): void { this._inPlay = { units: [] }; }
    private _unit(unit: number): IProtoMechUnitInPlay {
        while (this._inPlay.units.length <= unit) this._inPlay.units.push({});
        return this._inPlay.units[unit];
    }
    private _peek(unit: number): IProtoMechUnitInPlay { return this._inPlay.units[unit] ?? {}; }
    public getLocationCapacity(location: ProtoMechLocation): number { return this.getArmor(location) + this.getStructure(location); }
    public getLocationDamage(unit: number, location: ProtoMechLocation): number { return Math.min(this.getLocationCapacity(location), this._peek(unit).damage?.[location] ?? 0); }
    public setLocationDamage(unit: number, location: ProtoMechLocation, points: number): void {
        if (unit < 0 || unit >= this._pointSize || !this.getLocations().includes(location)) return;
        const state = this._unit(unit);
        state.damage = { ...state.damage, [location]: clampInt(points, 0, this.getLocationCapacity(location), 0) };
        // A destroyed location has all its critical hit boxes crossed off (TW p.186).
        if (this.isLocationDestroyed(unit, location)) state.criticals = { ...state.criticals, [location]: PROTOMECH_CRITICAL_BOXES[location] };
    }
    public getArmorLeft(unit: number, location: ProtoMechLocation): number { return Math.max(0, this.getArmor(location) - this.getLocationDamage(unit, location)); }
    public getStructureLeft(unit: number, location: ProtoMechLocation): number {
        return this.getStructure(location) - Math.max(0, this.getLocationDamage(unit, location) - this.getArmor(location));
    }
    public isLocationDestroyed(unit: number, location: ProtoMechLocation): boolean { return this.getStructure(location) > 0 && this.getStructureLeft(unit, location) <= 0; }
    public getCriticals(unit: number, location: ProtoMechLocation): number { return Math.min(PROTOMECH_CRITICAL_BOXES[location], this._peek(unit).criticals?.[location] ?? 0); }
    public setCriticals(unit: number, location: ProtoMechLocation, hits: number): void {
        if (unit < 0 || unit >= this._pointSize || !this.getLocations().includes(location)) return;
        const state = this._unit(unit);
        state.criticals = { ...state.criticals, [location]: clampInt(hits, 0, PROTOMECH_CRITICAL_BOXES[location], 0) };
    }
    public getPilotHits(unit: number): number { return Math.min(6, this._peek(unit).pilotHits ?? 0); }
    public setPilotHits(unit: number, hits: number): void {
        if (unit < 0 || unit >= this._pointSize) return;
        this._unit(unit).pilotHits = clampInt(hits, 0, 6, 0);
    }
    public getShotsFired(unit: number, index: number): number { return Math.min(this._mounts[index] ? this.getShots(this._mounts[index]) : 0, this._peek(unit).fired?.[String(index)] ?? 0); }
    public setShotsFired(unit: number, index: number, shots: number): void {
        const mount = this._mounts[index];
        if (unit < 0 || unit >= this._pointSize || !mount) return;
        const state = this._unit(unit);
        state.fired = { ...state.fired, [String(index)]: clampInt(shots, 0, this.getShots(mount), 0) };
    }
    public getShotsLeft(unit: number, index: number): number { return this._mounts[index] ? this.getShots(this._mounts[index]) - this.getShotsFired(unit, index) : 0; }
    public isMountLost(unit: number, index: number): boolean {
        const mount = this._mounts[index];
        if (!mount) return false;
        if ((this._peek(unit).lost ?? []).includes(index)) return true;
        if (mount.location === "mainGun") return this.isLocationDestroyed(unit, "la") && this.isLocationDestroyed(unit, "ra") && !this.isQuad();
        return this.isLocationDestroyed(unit, mount.location) || (mount.location !== "torso" && this.getCriticals(unit, mount.location) >= PROTOMECH_CRITICAL_BOXES[mount.location]);
    }
    public setMountLost(unit: number, index: number, lost: boolean): void {
        if (unit < 0 || unit >= this._pointSize || !this._mounts[index]) return;
        const state = this._unit(unit);
        const current = (state.lost ?? []).filter((item) => item !== index);
        state.lost = lost ? [...current, index] : current;
    }
    /** Destroyed: the torso gone, its third critical hit, or the warrior dead (TW pp.186-187). */
    public isUnitDestroyed(unit: number): boolean {
        return this.isLocationDestroyed(unit, "torso") || this.getCriticals(unit, "torso") >= PROTOMECH_CRITICAL_BOXES.torso || this.getPilotHits(unit) >= 6;
    }
    public isUnitDamaged(unit: number): boolean {
        const state = this._peek(unit);
        return Object.values(state.damage ?? {}).some((value) => (value ?? 0) > 0) || Object.values(state.criticals ?? {}).some((value) => (value ?? 0) > 0) || (state.pilotHits ?? 0) > 0;
    }
    public getActiveUnits(): number { return Array.from({ length: this._pointSize }, (_unused, unit) => unit).filter((unit) => !this.isUnitDestroyed(unit)).length; }
    public isDestroyed(): boolean { return this.getActiveUnits() <= 0; }
    public isDamaged(): boolean { return Array.from({ length: this._pointSize }, (_unused, unit) => unit).some((unit) => this.isUnitDamaged(unit)); }

    /** Movement after leg and torso critical hits (TW pp.186-187). */
    public getPlayMovement(unit: number): { walk: number; run: number; jump: number; text: string; toHit: number } {
        let walk = this.isGlider() ? this._walkMP : this.getGroundWalkMP();
        const legs = this.getCriticals(unit, "legs");
        if (legs >= 3 || this.isLocationDestroyed(unit, "legs")) walk = 0;
        else {
            if (legs >= 1) walk = Math.max(0, walk - 1);
            if (legs >= 2) walk = Math.ceil(walk / 2);
        }
        let jump = this.getJumpMP();
        const torso = this.getCriticals(unit, "torso");
        if (torso >= 1) jump = Math.max(0, jump - 1);
        if (torso >= 2) jump = Math.ceil(jump / 2);
        if (walk === 0) jump = 0;
        const run = Math.ceil(walk * 1.5);
        const head = this.getCriticals(unit, "head");
        const toHit = head >= 2 || this.isLocationDestroyed(unit, "head") ? 2 : head;
        return { walk, run, jump, text: this.isGlider() ? `WiGE ${walk} / ${run}` : `${walk} / ${run} / ${jump}`, toHit };
    }

    /** Applies damage to a location, passing what is left over to the torso (TW p.186). */
    public applyDamage(unit: number, location: ProtoMechLocation, points: number): string[] {
        const log: string[] = [];
        if (unit < 0 || unit >= this._pointSize || points <= 0) return log;
        let target: ProtoMechLocation = this.getLocations().includes(location) ? location : location === "la" || location === "ra" ? "legs" : "torso";
        if (target !== location) log.push(`No ${PROTOMECH_LOCATION_NAMES[location]}: the hit goes to the ${this.getLocationName(target)}.`);
        let left = Math.round(points);
        for (let pass = 0; pass < 2 && left > 0; pass++) {
            const room = this.getLocationCapacity(target) - this.getLocationDamage(unit, target);
            const taken = Math.min(room, left);
            const structureBefore = this.getStructureLeft(unit, target);
            this.setLocationDamage(unit, target, this.getLocationDamage(unit, target) + taken);
            left -= taken;
            if (taken > 0) log.push(`${this.getLocationName(target)}: ${taken} damage.`);
            if (this.getStructureLeft(unit, target) < structureBefore && !this.isLocationDestroyed(unit, target)) log.push(`${this.getLocationName(target)} structure damaged: roll for critical hits (TW p.186).`);
            if (this.isLocationDestroyed(unit, target)) log.push(`${this.getLocationName(target)} destroyed.`);
            if (target === "torso") break;
            target = "torso";
        }
        if (this.isUnitDestroyed(unit)) log.push("ProtoMech destroyed.");
        return log;
    }

    // Save and load --------------------------------------------------------------------------------------------

    /** Brings the design back inside what the chassis allows after a change. */
    private _clamp(): void {
        if (this._tons < this.getMinTons()) this._tons = this.getMinTons();
        this._walkMP = Math.min(this.getMaxWalkMP(), Math.max(this.getMinWalkMP(), this._walkMP));
        if (this.isGlider()) { this._jumpType = "none"; this._jumpMP = 0; this._myomerBooster = false; }
        if (this._jumpType === "none") this._jumpMP = 0;
        else this._jumpMP = Math.min(this.getMaxJumpJets(this._jumpType), Math.max(1, this._jumpMP));
        if (!this._mainGun) this._mounts = this._mounts.filter((mount) => mount.location !== "mainGun");
        if (this.isQuad()) this._mounts = this._mounts.filter((mount) => mount.location !== "la" && mount.location !== "ra");
        for (const location of LOCATIONS) this._armor[location] = Math.min(this._armor[location], this.getMaxArmor(location));
        for (const mount of this._mounts) if (mount.location !== "torso") delete mount.rear;
    }

    public export(noInPlayVariables: boolean = false): IProtoMechExport {
        const armor: Partial<Record<ProtoMechLocation, number>> = {};
        for (const location of this.getLocations()) armor[location] = this._armor[location];
        const data: IProtoMechExport = {
            version: 1,
            uuid: this._uuid,
            name: this._name,
            tons: this._tons,
            chassis: this._chassis,
            walkMP: this._walkMP,
            jumpType: this.getJumpType(),
            jumpMP: this.getJumpJets(),
            myomerBooster: this.hasMyomerBooster() || undefined,
            mainGun: this._mainGun || undefined,
            interfaceCockpit: this._interfaceCockpit || undefined,
            armorType: this._armorType,
            armor,
            mounts: this._mounts.map((mount) => ({ ...mount })),
            era: this._era.tag,
            gunnery: this._gunnery,
            pointSize: this._pointSize,
            lastUpdated: this.lastUpdated.toISOString(),
        };
        if (!noInPlayVariables && this._inPlay.units.some((unit) => Object.keys(unit).length > 0)) data.inPlay = JSON.parse(JSON.stringify(this._inPlay));
        return data;
    }
    public exportJSON(): string { return JSON.stringify(this.export()); }

    public import(data: IProtoMechExport): boolean {
        if (!data || typeof data !== "object" || typeof data.tons !== "number") return false;
        this._importIssues = [];
        this._uuid = typeof data.uuid === "string" && data.uuid ? data.uuid.slice(0, 64) : generateUUID();
        this.setName(typeof data.name === "string" ? data.name : "");
        this._chassis = CHASSIS_TAGS.includes(data.chassis) ? data.chassis : "biped";
        this._tons = clampInt(data.tons, this.getMinTons(), PROTOMECH_MAX_TONS, 5);
        this._mainGun = data.mainGun === true;
        this._interfaceCockpit = data.interfaceCockpit === true;
        this._myomerBooster = data.myomerBooster === true;
        this._walkMP = clampInt(data.walkMP, this.getMinWalkMP(), this.getMaxWalkMP(), this.getMinWalkMP());
        this._jumpType = JUMP_TYPES.includes(data.jumpType) ? data.jumpType : "none";
        this._jumpMP = clampInt(data.jumpMP, 0, 40, 0);
        this._armorType = data.armorType === "edp" ? "edp" : "standard";
        this._armor = { head: 0, torso: 0, la: 0, ra: 0, legs: 0, mainGun: 0 };
        this._mounts = [];
        for (const raw of Array.isArray(data.mounts) ? data.mounts.slice(0, MAX_PROTOMECH_MOUNTS) : []) {
            if (!raw || typeof raw.tag !== "string" || !MOUNT_LOCATIONS.includes(raw.location)) continue;
            const mount: IProtoMechMount = { tag: raw.tag.slice(0, 80), location: raw.location };
            if (!this._known(mount)) {
                this._importIssues.push(`Unknown equipment "${mount.tag}" was left off.`);
                continue;
            }
            const missile = this.getMissile(mount);
            if (missile) mount.tubes = clampInt(raw.tubes, 1, missile.maxTubes, 1);
            if (raw.rear === true && mount.location === "torso") mount.rear = true;
            if (this.usesAmmo(mount)) mount.shots = clampInt(raw.shots, 0, MAX_PROTOMECH_SHOTS, 0);
            if (typeof raw.ammoTag === "string" && this.getAmmoOptions(mount).some((ammo) => ammo.tag === raw.ammoTag)) mount.ammoTag = raw.ammoTag;
            this._mounts.push(mount);
        }
        this._clamp();
        for (const location of this.getLocations()) this._armor[location] = clampInt(data.armor?.[location], 0, this.getMaxArmor(location), 0);
        this._era = this.getAvailableEras().find((era) => era.tag === data.era) ?? this._era;
        this._gunnery = clampInt(data.gunnery, 0, 8, 4);
        this._pointSize = clampInt(data.pointSize, 1, PROTOMECH_POINT_SIZE, PROTOMECH_POINT_SIZE);
        this._inPlay = { units: [] };
        const units = Array.isArray(data.inPlay?.units) ? data.inPlay?.units ?? [] : [];
        units.slice(0, this._pointSize).forEach((raw, unit) => {
            if (!raw || typeof raw !== "object") return;
            for (const location of this.getLocations()) {
                if (raw.damage?.[location]) this.setLocationDamage(unit, location, Number(raw.damage[location]));
                if (raw.criticals?.[location]) this.setCriticals(unit, location, Number(raw.criticals[location]));
            }
            if (raw.pilotHits) this.setPilotHits(unit, Number(raw.pilotHits));
            for (const [index, shots] of Object.entries(raw.fired ?? {})) this.setShotsFired(unit, Number(index), Number(shots));
            for (const index of Array.isArray(raw.lost) ? raw.lost : []) this.setMountLost(unit, Number(index), true);
        });
        const saved = typeof data.lastUpdated === "string" ? new Date(data.lastUpdated) : new Date();
        this.lastUpdated = Number.isNaN(saved.getTime()) ? new Date() : saved;
        return true;
    }

    public importJSON(json: string): boolean {
        try {
            return this.import(JSON.parse(json));
        } catch {
            this._importIssues = ["The saved ProtoMech could not be read."];
            return false;
        }
    }
}
