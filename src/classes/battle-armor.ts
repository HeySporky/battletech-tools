import { generateUUID } from "../utils/generateUUID";
import { battleArmorArmorTypes, battleArmorMaximumArmor } from "../data/battle-armor-armor-types";
import {
    BATTLE_ARMOR_ADAPTOR, BATTLE_ARMOR_AP_MOUNT, BATTLE_ARMOR_CLAN_COST_MULTIPLIER, BATTLE_ARMOR_DETACHABLE, BATTLE_ARMOR_GROUND_MP_COST,
    BATTLE_ARMOR_MAX_SQUAD, BATTLE_ARMOR_MODULAR_MOUNT, BATTLE_ARMOR_SHOTS_PER_SLOT, BATTLE_ARMOR_SQUAD_SUPPORT_COST,
    BATTLE_ARMOR_SQUAD_SUPPORT_SHARE, BATTLE_ARMOR_TURRET, BATTLE_ARMOR_UNIT_SIZE_BV, BATTLE_ARMOR_WEAPON_LIMITS, BattleArmorBodyType,
    BattleArmorMotive, BattleArmorTechBase, BattleArmorWeightClass, IBattleArmorManipulator, IBattleArmorMotiveLimit, IBattleArmorWeightClass,
    battleArmorWeightClasses, findBattleArmorManipulator, findBattleArmorWeightClass, getBattleArmorSpeedFactor,
    getBattleArmorTargetMovementModifier,
} from "../data/battle-armor-construction";
import { battleArmorChassisDates, battleArmorFeatureDates, battleArmorManipulatorDates } from "../data/battle-armor-dates";
import {
    IBattleArmorDates, IBattleArmorEquipment, battleArmorEquipment, battleArmorMineTypes, findBattleArmorEquipment, findBattleArmorMineType,
    formatBattleArmorDates, getBattleArmorEquipmentFor, isBattleArmorDateAvailable,
} from "../data/battle-armor-equipment";
import { IBattleArmorArmorType, IEras } from "../data/data-interfaces";
import { btEraOptions, findEraByTag, getErasForTech } from "../data/era-options";
import { IInfantryWeapon, findInfantryWeapon, infantryWeapons } from "../data/infantry-weapons";
import { getSkillMultiplier } from "../data/skill-multipliers";
import { AlphaStrikeUnit, IASMULUnit } from "./alpha-strike-unit";

// Battle armor construction (TechManual pp.160-173), Battle Value (TM pp.310-311, 316) and cost (TM pp.276, 281, 296-298);
// the battle armor equipment of Tactical Operations: Advanced Units & Equipment (pp.91-161, 192-197, 224-225);
// introduction dates (IO:AE pp.45-47); play (Total Warfare pp.219-227); Alpha Strike conversion (ASC pp.92-141).

export type BattleArmorLocation = "la" | "ra" | "body" | "turret";
export type BattleArmorArm = "la" | "ra";

export const BATTLE_ARMOR_LOCATION_NAMES: Record<BattleArmorLocation, string> = {
    la: "Left Arm",
    ra: "Right Arm",
    body: "Body",
    turret: "Turret",
};

/** Armor from Tactical Operations is offered from the Advanced rules level. */
export const BATTLE_ARMOR_ADVANCED_RULES_LEVEL = 3;
export const BATTLE_ARMOR_RULES_LEVEL = 2;
export const MAX_BATTLE_ARMOR_NAME_LENGTH = 120;
export const MAX_BATTLE_ARMOR_ITEMS = 40;
export const MAX_BATTLE_ARMOR_LOADOUTS = 12;
/** A detachable weapon pack (TO:AUE pp.99, 225): the weapon counts three quarters of its weight and takes one slot. */
export const BATTLE_ARMOR_WEAPON_PACK = { share: 0.75, roundTo: 5, slots: 1, cost: 18000, rulesLevel: 3 };

export type BattleArmorAttackKind = "standard" | "energy" | "explosive" | "heat";
export const BATTLE_ARMOR_ATTACK_KINDS: { tag: BattleArmorAttackKind; name: string }[] = [
    { tag: "standard", name: "Ballistic, physical or other" },
    { tag: "energy", name: "Energy weapon" },
    { tag: "explosive", name: "Missile, mortar or artillery" },
    { tag: "heat", name: "Heat-causing weapon (flamer, plasma, inferno)" },
];

/** Leg Attacks Table and Swarm Attacks Table, battle armor column (TW p.221): modifier by troopers active. */
export const BATTLE_ARMOR_LEG_ATTACK_MODIFIERS: (number | null)[] = [null, 7, 5, 2, 0, 0, 0];
export const BATTLE_ARMOR_SWARM_ATTACK_MODIFIERS: (number | null)[] = [null, 5, 5, 5, 2, 2, 2];
/**
 * Swarm Attack Modifiers Table (TW p.221): added when the target carries friendly mechanized battle armor.
 * Indexed by attacking battle armor troopers active, then by defending troopers active.
 */
export const BATTLE_ARMOR_SWARM_DEFENDER_MODIFIERS: number[][] = [
    [],
    [0, 2, 3, 4, 5, 6, 7],
    [0, 1, 2, 3, 4, 5, 6],
    [0, 0, 1, 2, 3, 4, 5],
    [0, 0, 0, 1, 2, 3, 4],
    [0, 0, 0, 0, 1, 2, 3],
    [0, 0, 0, 0, 0, 1, 2],
];
/** Most a cargo lifter is asked to lift here, in half tons; the book sets no ceiling but the suit's weight. */
export const BATTLE_ARMOR_MAX_CARGO_HALF_TONS = 20;

export interface IBattleArmorMountedItem {
    tag: string;
    location: BattleArmorLocation;
    /** A missile launcher built as a one-shot launcher. */
    oneShot?: boolean;
    /** Missile shots carried with the launcher. */
    shots?: number;
    /** A detachable missile pack. */
    detachable?: boolean;
    /** Fitted in a standard modular weapon mount. */
    modular?: boolean;
    /** The squad support weapon. */
    squadSupport?: boolean;
    /** Kilograms set aside, for mission equipment. */
    kg?: number;
    /** Carried in a detachable weapon pack (TO:AUE pp.98-99). */
    dwp?: boolean;
    /** Carried by this trooper only (1 to 6); absent when every trooper carries it. */
    trooper?: number;
    /** The mines a mine dispenser carries; absent for standard mines. */
    mine?: string;
}

export type BattleArmorCarrierKind = "mech" | "vehicle";
/** Battle Armor Transport Position Table (TW p.227): where each numbered trooper rides. */
export const BATTLE_ARMOR_TRANSPORT_POSITIONS: Record<BattleArmorCarrierKind, string>[] = [
    { mech: "Right Torso", vehicle: "Right Side" },
    { mech: "Left Torso", vehicle: "Right Side" },
    { mech: "Right Torso (rear)", vehicle: "Left Side" },
    { mech: "Left Torso (rear)", vehicle: "Left Side" },
    { mech: "Center Torso (rear)", vehicle: "Rear" },
    { mech: "Center Torso", vehicle: "Rear" },
];

export interface IBattleArmorLoadoutWeapon {
    tag: string;
    shots?: number;
    oneShot?: boolean;
}

/** An alternate configuration: what each modular mount and adaptor carries in place of the base design's choice. */
export interface IBattleArmorLoadout {
    name: string;
    /** By the index of the mounted item it replaces. */
    weapons: Record<string, IBattleArmorLoadoutWeapon>;
    manipulators: Partial<Record<BattleArmorArm, string>>;
}

export interface IBattleArmorInPlay {
    /** Damage taken by each trooper, armor and the trooper together. */
    damage: number[];
    /** Detachable missile packs have been jettisoned. */
    missilesJettisoned?: boolean;
    /** Detachable weapon packs have been jettisoned. */
    packsJettisoned?: boolean;
    /** The roster unit the squad rides as mechanized battle armor. */
    riding?: { uuid: string; kind: BattleArmorCarrierKind };
}

export interface IBattleArmorASDamageValue {
    damage: number;
    /** Minimal damage, printed 0* (Alpha Strike Companion p.103). */
    minimal: boolean;
}

export interface IBattleArmorAlphaStrikeStats {
    type: "BA";
    size: number;
    /** Printed Move, such as 6"j or 2"f/6"s. */
    move: string;
    /** Inches of the fastest mode. */
    movement: number;
    armor: number;
    structure: number;
    damageValues: { short: IBattleArmorASDamageValue; medium: IBattleArmorASDamageValue; long: IBattleArmorASDamageValue };
    specialAbilities: string[];
    pointValue: number;
    calcLog: string[];
}

export const formatBattleArmorASDamage = (value: IBattleArmorASDamageValue): string => (value.minimal ? "0*" : `${value.damage}`);

export interface IBattleArmorAPMount {
    location: BattleArmorLocation;
    /** Tag of the conventional infantry weapon it carries; empty for an empty mount. */
    weapon: string;
}

export interface IBattleArmorArmExport {
    manipulator: string;
    adaptor: boolean;
    cargoHalfTons: number;
}

export interface IBattleArmorTurret {
    /** Slots a standard turret mount of this size holds. */
    size: number;
    configurable: boolean;
}

export interface IBattleArmorExport {
    uuid: string;
    lastUpdated: string;
    name: string;
    techBase: BattleArmorTechBase;
    /** Mixed technology (TO:AUE p.189): the chassis is of `techBase`, the equipment of either. */
    mixedTech?: boolean;
    /** The technology base of the armor on a mixed-technology suit, when it is not the chassis'. */
    armorTechBase?: BattleArmorTechBase;
    weightClass: BattleArmorWeightClass;
    bodyType: BattleArmorBodyType;
    /** A Clan industrial exoskeleton on an Inner Sphere chassis weight (TM p.162). */
    exoskeletonChassis?: boolean;
    groundMP: number;
    motive: BattleArmorMotive;
    motiveMP: number;
    arms: { la: IBattleArmorArmExport; ra: IBattleArmorArmExport };
    armor: string;
    armorPoints: number;
    items: IBattleArmorMountedItem[];
    apMounts: IBattleArmorAPMount[];
    turret?: IBattleArmorTurret;
    squadSize: number;
    gunnery: number;
    antiMech: number;
    /** Era tag; absent in suits saved before eras were tracked, which load into the latest era. */
    era?: string;
    loadouts?: IBattleArmorLoadout[];
    /** The loadout a roster unit is fielded in; absent for the base design. */
    activeLoadout?: number;
    inPlay?: IBattleArmorInPlay;
}

export interface IBattleArmorCapabilities {
    swarm: boolean;
    leg: boolean;
    mechanized: boolean;
    notes: string[];
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const savedString = (value: unknown): string => (typeof value === "string" ? value : "");
const savedNumber = (value: unknown, fallback: number, min: number, max: number): number =>
    (typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback);
const roundNormally = (value: number): number => Math.floor(value + 0.5);
const round2 = (value: number): number => Math.round(value * 100) / 100;
const defaultArm = (): IBattleArmorArmExport => ({ manipulator: "none", adaptor: false, cargoHalfTons: 1 });
const LOCATIONS: BattleArmorLocation[] = ["la", "ra", "body", "turret"];
const roundToHalf = (value: number): number => Math.round(value * 2 + 1e-9) / 2;
const rollD6 = (): number => 1 + Math.floor(Math.random() * 6);

/** The newest era a technology base can design in. */
const latestEra = (techBase: string): IEras => {
    const eras = getErasForTech(techBase);
    return eras[eras.length - 1] ?? btEraOptions[btEraOptions.length - 1];
};

const techName = (techBase: BattleArmorTechBase): string => (techBase === "clan" ? "Clan" : "Inner Sphere");

// Infantry Troop Factor Table (ASC p.103), by troopers; battle armor adds 0.5.
const TROOP_FACTORS: number[] = [0, 1, 1, 2, 3, 3, 4];

/** A saved suit cleaned by a full import, with what the import changed; null when it is not an object. */
export const normalizeBattleArmorExport = (raw: unknown): { suit: IBattleArmorExport | null; issues: string[] } => {
    if (!isPlainObject(raw)) return { suit: null, issues: ["Skipped a saved battle armor design that could not be read"] };
    let json: string;
    try {
        json = JSON.stringify(raw);
    } catch {
        return { suit: null, issues: ["Skipped a saved battle armor design that could not be read"] };
    }
    const loaded = new BattleArmor(json);
    // A saved design is the base suit, undamaged; a roster squad keeps its loadout and damage in its group.
    loaded.setActiveLoadout(-1);
    return { suit: loaded.export(true), issues: [...loaded.getImportIssues()] };
};

export default class BattleArmor {
    private _uuid: string = generateUUID();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _techBase: BattleArmorTechBase = "is";
    private _mixedTech: boolean = false;
    private _armorTechBase: BattleArmorTechBase | null = null;
    /** The trooper whose suit is being worked out; 0 for the squad as a whole. */
    private _view: number = 0;
    private _weightClass: IBattleArmorWeightClass = findBattleArmorWeightClass("medium");
    private _bodyType: BattleArmorBodyType = "humanoid";
    private _exoskeletonChassis: boolean = false;
    private _groundMP: number = 1;
    private _motive: BattleArmorMotive = "none";
    private _motiveMP: number = 0;
    private _arms: Record<BattleArmorArm, IBattleArmorArmExport> = { la: defaultArm(), ra: defaultArm() };
    private _armor: IBattleArmorArmorType = battleArmorArmorTypes[0];
    private _armorPoints: number = 0;
    private _baseItems: IBattleArmorMountedItem[] = [];
    private _apMounts: IBattleArmorAPMount[] = [];
    private _era: IEras = latestEra("is");
    private _loadouts: IBattleArmorLoadout[] = [];
    private _activeLoadout: number = -1;
    private _inPlay: IBattleArmorInPlay = { damage: [] };
    private _turret: IBattleArmorTurret | null = null;
    private _squadSize: number = 4;
    private _gunnery: number = 4;
    private _antiMech: number = 5;
    private _importIssues: string[] = [];

    constructor(importJSON: string = "") {
        if (importJSON) this.importJSON(importJSON);
    }

    // Identity

    public getUUID(): string { return this._uuid; }
    public newUUID(): void { this._uuid = generateUUID(); }
    public getName(): string { return this._name; }
    public setName(name: string): void { this._name = String(name ?? "").slice(0, MAX_BATTLE_ARMOR_NAME_LENGTH); }
    public getBaseName(): string { return this._name.trim() || `${this._weightClass.name} Battle Armor`; }
    public getDisplayName(): string {
        const loadout = this._loadouts[this._activeLoadout];
        return loadout ? `${this.getBaseName()} [${loadout.name}]` : this.getBaseName();
    }
    public getImportIssues(): string[] { return this._importIssues; }
    /** Standard rules; Advanced or Experimental with armor and equipment from Tactical Operations. */
    public getRequiredRulesLevel(): number {
        let level = this._armorPoints > 0 && this._armor.book !== "TM" ? BATTLE_ARMOR_ADVANCED_RULES_LEVEL : BATTLE_ARMOR_RULES_LEVEL;
        for (const entry of this._items) {
            level = Math.max(level, findBattleArmorEquipment(entry.tag)?.rulesLevel ?? BATTLE_ARMOR_RULES_LEVEL, entry.dwp ? BATTLE_ARMOR_WEAPON_PACK.rulesLevel : 0);
        }
        // Mixed technology is an advanced construction option (TO:AUE p.189).
        if (this._mixedTech) level = Math.max(level, BATTLE_ARMOR_ADVANCED_RULES_LEVEL);
        return level;
    }

    /** The mounted items; when one trooper's suit is being worked out, the squad's and that trooper's own. */
    private get _items(): IBattleArmorMountedItem[] {
        const items = this._loadoutItems();
        return this._view > 0 ? items.filter((entry) => !entry.trooper || entry.trooper === this._view) : items;
    }

    /** The mounted items, with the active loadout's weapons in the mounts it changes. */
    private _loadoutItems(): IBattleArmorMountedItem[] {
        const loadout = this._loadouts[this._activeLoadout];
        if (!loadout) return this._baseItems;
        return this._baseItems.map((entry, index) => {
            const swap = loadout.weapons[String(index)];
            const equipment = swap ? findBattleArmorEquipment(swap.tag) : null;
            if (!swap || !equipment || !this.isSwappable(entry) || !this._fitsMount(equipment)) return entry;
            const missile = equipment.kind === "missile";
            return {
                tag: equipment.tag,
                location: entry.location,
                ...(entry.modular ? { modular: true } : {}),
                ...(entry.trooper ? { trooper: entry.trooper } : {}),
                ...(missile && equipment.oneShot !== "always" ? { shots: Math.min(40, Math.max(1, Math.round(swap.shots ?? 1) || 1)) } : {}),
                ...(missile && typeof equipment.oneShot === "object" && swap.oneShot ? { oneShot: true } : {}),
            };
        });
    }

    // Era (IO:AE pp.45-47)

    public getEra(): IEras { return this._era; }
    public getAvailableEras(): IEras[] { return getErasForTech(this._eraTech()); }
    /** Mixed technology has its own list of eras, which starts at the Clan Invasion. */
    private _eraTech(): string { return this._mixedTech ? (this.isClan() ? "mclan" : "mis") : this._techBase; }
    /** Sets the era the suit is built in; what it carries that the era does not have is reported, not removed. */
    public setEra(tag: string): boolean {
        const era = findEraByTag(tag);
        if (!era || !this.getAvailableEras().some((item) => item.tag === era.tag)) return false;
        this._era = era;
        return true;
    }
    private _inEra(dates: IBattleArmorDates | undefined): boolean { return isBattleArmorDateAvailable(dates, this._era.yearStart, this._era.yearEnd); }
    public isEquipmentInEra(equipment: IBattleArmorEquipment): boolean { return this._inEra(equipment.dates); }
    private _armorDates(armor: IBattleArmorArmorType): IBattleArmorDates {
        const dates = this._armorBase(armor) === "clan" && armor.clanDates ? armor.clanDates : armor;
        return {
            introduced: dates.introduced,
            ...(typeof dates.prototype === "number" ? { prototype: dates.prototype } : {}),
            ...(typeof dates.extinct === "number" ? { extinct: dates.extinct } : {}),
            ...(typeof dates.reintroduced === "number" ? { reintroduced: dates.reintroduced } : {}),
        };
    }
    public isArmorInEra(armor: IBattleArmorArmorType): boolean { return this._inEra(this._armorDates(armor)); }
    public isManipulatorInEra(tag: string): boolean { return this._inEra(battleArmorManipulatorDates[tag]?.[this._techBase]); }
    public isWeightClassInEra(tag: BattleArmorWeightClass): boolean { return this._inEra(battleArmorChassisDates[tag][this._techBase]); }

    /** What the suit carries that was not in service in its era. */
    public getEraIssues(): string[] {
        const issues: string[] = [];
        const check = (name: string, dates: IBattleArmorDates | undefined, base: BattleArmorTechBase = this._techBase): void => {
            const who = techName(base);
            if (!this._inEra(dates)) issues.push(`${name} is not available to ${who} battle armor in the ${this._era.name} era: ${formatBattleArmorDates(dates)} (IO:AE pp.45-47).`);
        };
        check(`${this._weightClass.name} battle armor`, battleArmorChassisDates[this._weightClass.tag][this._techBase]);
        if (this._motive === "jump") check("Jump jets", battleArmorFeatureDates.jump[this._techBase]);
        if (this._motive === "umu") check("UMUs", battleArmorFeatureDates.umu[this._techBase]);
        if (this._motive === "vtol") check("VTOL equipment", battleArmorFeatureDates.vtol[this._techBase]);
        if (!this.isQuad()) {
            const seen = new Set<string>();
            for (const arm of ["la", "ra"] as BattleArmorArm[]) {
                const manipulator = this.getManipulator(arm);
                if (manipulator.tag !== "none" && !seen.has(manipulator.tag)) check(manipulator.name, battleArmorManipulatorDates[manipulator.tag]?.[this._techBase]);
                seen.add(manipulator.tag);
            }
            if (this._arms.la.adaptor || this._arms.ra.adaptor) check("The modular equipment adaptor", battleArmorFeatureDates.adaptor[this._techBase]);
        }
        if (this._armorPoints > 0) check(`${this._armor.name} armor`, this._armorDates(this._armor), this._armorBase());
        const seenItems = new Set<string>();
        for (const entry of this._items) {
            const equipment = findBattleArmorEquipment(entry.tag);
            if (equipment && !seenItems.has(equipment.tag)) check(equipment.name, equipment.dates, equipment.techBase);
            seenItems.add(entry.tag);
        }
        if (this._apMounts.length > 0) check("The anti-personnel weapon mount", battleArmorFeatureDates.apMount[this._techBase]);
        if (this._items.some((entry) => entry.squadSupport)) check("The squad support weapon mount", battleArmorFeatureDates.squadSupport[this._techBase]);
        if (this._items.some((entry) => entry.detachable)) check("The detachable missile pack", battleArmorFeatureDates.detachableMissilePack[this._techBase]);
        if (this._items.some((entry) => entry.dwp)) check("The detachable weapon pack", battleArmorFeatureDates.detachableWeaponPack[this._techBase]);
        return issues;
    }

    // Step 1: the chassis (TM pp.162-163)

    public getTechBase(): BattleArmorTechBase { return this._techBase; }
    public isClan(): boolean { return this._techBase === "clan"; }
    /** Mixed technology (TO:AUE p.189): a chassis of one technology base carrying equipment and armor of either. */
    public isMixedTech(): boolean { return this._mixedTech; }
    public getTechName(): string { return this._mixedTech ? `Mixed (${techName(this._techBase)} chassis)` : techName(this._techBase); }
    /** May the suit carry equipment of this technology base? */
    private _offers(techBase: BattleArmorTechBase): boolean { return this._mixedTech || techBase === this._techBase; }
    public setMixedTech(value: boolean): void {
        if (value === this._mixedTech) return;
        this._mixedTech = value;
        if (!value) {
            this._armorTechBase = null;
            this._toChassisBase();
        }
        if (!this.getAvailableEras().some((item) => item.tag === this._era.tag)) this._era = latestEra(this._eraTech());
        this._clamp();
    }
    /** Brings every item to the chassis' technology base, dropping what has no counterpart there. */
    private _toChassisBase(): void {
        const before = this._baseItems.length;
        this._baseItems = this._baseItems.flatMap((entry) => {
            const counterpart = findBattleArmorEquipment(entry.tag.replace(/^(is|clan)-/, `${this._techBase}-`));
            return counterpart ? [{ ...entry, tag: counterpart.tag }] : [];
        });
        if (this._baseItems.length !== before) {
            // The mounts a loadout names are no longer the same mounts.
            this._loadouts = [];
            this._activeLoadout = -1;
        } else {
            for (const loadout of this._loadouts) {
                for (const [key, swap] of Object.entries(loadout.weapons)) {
                    if (findBattleArmorEquipment(swap.tag)?.techBase !== this._techBase) delete loadout.weapons[key];
                }
            }
        }
        this._apMounts.forEach((mount) => { if (mount.weapon && !this.getAntiPersonnelWeapons().some((weapon) => weapon.tag === mount.weapon)) mount.weapon = ""; });
    }
    public isQuad(): boolean { return this._bodyType === "quad"; }
    public getBodyType(): BattleArmorBodyType { return this._bodyType; }
    public getWeightClass(): IBattleArmorWeightClass { return this._weightClass; }
    public usesExoskeletonChassis(): boolean { return this._exoskeletonChassis && this.canUseExoskeletonChassis(); }
    /** Clan-made industrial exoskeletons may use an Inner Sphere chassis weight (TM p.162). */
    public canUseExoskeletonChassis(): boolean { return this.isClan() && this._weightClass.tag === "pa-l"; }

    public setTechBase(techBase: BattleArmorTechBase): void {
        if (techBase === this._techBase) return;
        this._techBase = techBase;
        if (!this._mixedTech) {
            // The same item is a different record in the other table; keep what has a counterpart there.
            this._baseItems = this._baseItems.flatMap((entry) => {
                const counterpart = findBattleArmorEquipment(entry.tag.replace(/^(is|clan)-/, `${techBase}-`));
                return counterpart ? [{ ...entry, tag: counterpart.tag }] : [];
            });
            // The mounts a loadout names are no longer the same mounts.
            this._loadouts = [];
            this._activeLoadout = -1;
        }
        this._squadSize = techBase === "clan" ? 5 : 4;
        if (!this.getAvailableEras().some((item) => item.tag === this._era.tag)) this._era = latestEra(this._eraTech());
        this._clamp();
    }

    public setWeightClass(tag: string): boolean {
        const weightClass = battleArmorWeightClasses.find((entry) => entry.tag === tag);
        if (!weightClass) return false;
        this._weightClass = weightClass;
        this._clamp();
        return true;
    }

    public setBodyType(bodyType: BattleArmorBodyType): void {
        this._bodyType = bodyType;
        this._clamp();
    }

    public setExoskeletonChassis(value: boolean): void { this._exoskeletonChassis = value; }

    public getChassisWeight(): number {
        return this.isClan() && !this.usesExoskeletonChassis() ? this._weightClass.chassisWeight.clan : this._weightClass.chassisWeight.is;
    }

    // Step 2: motive systems (TM pp.164-165)

    public getFreeGroundMP(): number { return this._weightClass.freeGroundMP[this._bodyType] ?? 1; }
    public getMaxGroundMP(): number { return this._weightClass.maxGroundMP[this._bodyType] ?? 1; }
    /** Ground MP bought with the chassis, before any booster. */
    public getGroundMP(): number { return this._groundMP; }
    /** Ground MP added by a myomer booster or a mechanical jump booster, which may pass the class maximum (TO:AUE pp.98-99). */
    public getGroundMPBonus(): number {
        const small = this._weightClass.tag === "pa-l" || this._weightClass.tag === "light" || this._weightClass.tag === "medium";
        return this._items.reduce((sum, entry) => {
            const equipment = findBattleArmorEquipment(entry.tag);
            if (!equipment) return sum;
            return sum + (equipment.groundBonus ? (small ? equipment.groundBonus.light : equipment.groundBonus.heavy) : 0) + (equipment.mechanicalJumpBooster ? 1 : 0);
        }, 0);
    }
    public getTotalGroundMP(): number { return this._groundMP + this.getGroundMPBonus(); }
    public setGroundMP(mp: number): void { this._groundMP = Math.min(this.getMaxGroundMP(), Math.max(this.getFreeGroundMP(), Math.round(mp) || 0)); }

    public getMotive(): BattleArmorMotive { return this._motive; }
    public getMotiveMP(): number { return this._motive === "none" ? 0 : this._motiveMP; }

    /** The table's row for a non-ground motive system, or null when this suit may not fit it. */
    public getMotiveLimit(motive: BattleArmorMotive): IBattleArmorMotiveLimit | null {
        if (motive === "none" || this.isQuad()) return null;
        if (motive === "jump") return this._weightClass.jump;
        // VTOL and UMU systems are Clan only (TM pp.164-165).
        if (!this.isClan()) return null;
        return motive === "vtol" ? this._weightClass.vtol : this._weightClass.umu;
    }

    public getAvailableMotives(): BattleArmorMotive[] {
        return (["none", "jump", "vtol", "umu"] as BattleArmorMotive[]).filter((motive) => motive === "none" || this.getMotiveLimit(motive) !== null);
    }

    public setMotive(motive: BattleArmorMotive, mp: number = this._motiveMP): boolean {
        if (motive === "none") {
            this._motive = "none";
            this._motiveMP = 0;
            return true;
        }
        const limit = this.getMotiveLimit(motive);
        if (!limit) return false;
        this._motive = motive;
        this._motiveMP = Math.min(limit.maxMP, Math.max(1, Math.round(mp) || 1));
        return true;
    }

    /** Jumping MP with a jump booster or partial wing, which may exceed the table's maximum (TM p.165). */
    public getJumpMP(): number {
        const equipment = this._items.map((entry) => findBattleArmorEquipment(entry.tag));
        const jets = this._motive === "jump" ? this._motiveMP + equipment.reduce((sum, item) => sum + (item?.jumpBonus ?? 0), 0) : 0;
        // A mechanical jump booster gives 1 Jumping MP of its own, which a partial wing adds to and a jump
        // booster does not; it is not added to the jump jets' MP (TO:AUE p.98).
        const mechanical = equipment.some((item) => item?.mechanicalJumpBooster)
            ? 1 + equipment.reduce((sum, item) => sum + (item?.name === "Partial Wing" ? item.jumpBonus ?? 0 : 0), 0)
            : 0;
        return Math.max(jets, mechanical);
    }

    public getMovementText(): string {
        const parts = [`Ground ${this.getTotalGroundMP()}`];
        if (this.getJumpMP() > 0) parts.push(`Jump ${this.getJumpMP()}`);
        if (this._motive === "vtol") parts.push(`VTOL ${this._motiveMP}`);
        if (this._motive === "umu") parts.push(`UMU ${this._motiveMP}`);
        return parts.join(" / ");
    }

    // Step 3: manipulators (TM pp.166-167)

    public getArm(arm: BattleArmorArm): IBattleArmorArmExport { return this._arms[arm]; }
    public getManipulator(arm: BattleArmorArm): IBattleArmorManipulator {
        if (this.isQuad()) return findBattleArmorManipulator("none");
        // A modular equipment adaptor carries the active loadout's manipulator.
        const swap = this._arms[arm].adaptor ? this._loadouts[this._activeLoadout]?.manipulators[arm] : undefined;
        return findBattleArmorManipulator(swap ?? this._arms[arm].manipulator);
    }

    public setManipulator(arm: BattleArmorArm, tag: string): void {
        if (this.isQuad()) return;
        const manipulator = findBattleArmorManipulator(tag);
        this._arms[arm].manipulator = manipulator.tag;
        // A manipulator that must be mounted in pairs goes on both arms.
        const other: BattleArmorArm = arm === "la" ? "ra" : "la";
        if (manipulator.mustPair) this._arms[other].manipulator = manipulator.tag;
        else if (findBattleArmorManipulator(this._arms[other].manipulator).mustPair) this._arms[other].manipulator = "none";
    }

    public setAdaptor(arm: BattleArmorArm, fitted: boolean): void { if (!this.isQuad()) this._arms[arm].adaptor = fitted; }

    public setCargoHalfTons(arm: BattleArmorArm, halfTons: number): void {
        this._arms[arm].cargoHalfTons = Math.min(BATTLE_ARMOR_MAX_CARGO_HALF_TONS, Math.max(1, Math.round(halfTons) || 1));
    }

    private _manipulatorWeight(arm: BattleArmorArm): number {
        const manipulator = this.getManipulator(arm);
        return manipulator.kg * (manipulator.kind === "cargo" ? this._arms[arm].cargoHalfTons : 1);
    }

    private _hasItem(name: string): boolean {
        return this._items.some((entry) => findBattleArmorEquipment(entry.tag)?.name === name);
    }

    /** Battle Armor Capabilities Table (TM p.167). */
    public getCapabilities(): IBattleArmorCapabilities {
        const notes: string[] = [];
        const none = { swarm: false, leg: false, mechanized: false };
        if (this.isQuad()) return { ...none, notes: ["Quad battle armor makes no Anti-'Mech attacks and cannot ride as mechanized battle armor."] };

        const kinds = (["la", "ra"] as BattleArmorArm[]).map((arm) => this.getManipulator(arm).kind);
        const gloves = kinds.filter((kind) => kind === "glove").length;
        const basics = kinds.filter((kind) => kind === "basic").length;
        const claw = kinds.includes("claw");
        const weightClass = this._weightClass.tag;
        const small = weightClass === "pa-l" || weightClass === "light";

        let antiMech = false;
        let mechanized = false;
        if (small) {
            antiMech = gloves === 2 || basics === 2 || claw;
            mechanized = gloves === 2 || basics >= 1 || claw;
        } else if (weightClass === "medium") {
            antiMech = basics === 2 || claw;
            mechanized = basics >= 1 || claw;
        } else if (weightClass === "heavy") {
            mechanized = basics >= 1 || claw;
            notes.push("Heavy battle armor makes no Swarm or Leg attacks.");
        } else {
            notes.push("Assault battle armor makes no Anti-'Mech attacks and cannot ride as mechanized battle armor.");
        }
        if (weightClass !== "assault" && !mechanized) notes.push("The manipulators fitted do not meet the table's minimum requirements.");

        let swarm = antiMech;
        const leg = antiMech;
        if (this._motive === "umu") {
            swarm = false;
            if (leg) notes.push("With UMUs: no Swarm attacks; Leg attacks only against targets in Depth 1+ water.");
        }
        if (this._hasItem("Magnetic Clamps") && weightClass !== "assault") {
            mechanized = true;
            notes.push("Magnetic clamps let the suit ride units that are not Omnis, whatever its manipulators.");
        }
        if (this._arms.la.adaptor || this._arms.ra.adaptor) notes.push("With modular equipment adaptors, the capabilities are those of the manipulators fitted for the mission.");
        return { swarm, leg, mechanized, notes };
    }

    // Step 4: armor (TM pp.168-169)

    public getArmor(): IBattleArmorArmorType { return this._armor; }
    public getArmorPoints(): number { return this._armorPoints; }
    public getMaxArmorPoints(): number { return battleArmorMaximumArmor[this._weightClass.tag]; }
    public getArmorKgPerPoint(armor: IBattleArmorArmorType = this._armor, techBase: BattleArmorTechBase = this._armorBase(armor)): number | null { return armor.kgPerPoint[techBase]; }
    /** The technology base an armor is taken from: the chassis', or on a mixed-technology suit the one chosen. */
    private _armorBase(armor: IBattleArmorArmorType = this._armor): BattleArmorTechBase {
        if (!this._mixedTech) return this._techBase;
        const preferred = this._armorTechBase ?? this._techBase;
        const other: BattleArmorTechBase = preferred === "clan" ? "is" : "clan";
        return armor.kgPerPoint[preferred] === null && armor.kgPerPoint[other] !== null ? other : preferred;
    }
    public getArmorTechBase(): BattleArmorTechBase { return this._armorBase(); }

    public getAvailableArmor(rulesLevel: number = BATTLE_ARMOR_ADVANCED_RULES_LEVEL): IBattleArmorArmorType[] {
        return battleArmorArmorTypes.filter((armor) => this.getArmorKgPerPoint(armor) !== null && (armor.tag === this._armor.tag
            || ((armor.book === "TM" || rulesLevel >= BATTLE_ARMOR_ADVANCED_RULES_LEVEL) && this.isArmorInEra(armor))));
    }

    /** The armors on offer with the technology base of each; a mixed-technology suit is offered both bases' versions. */
    public getArmorChoices(rulesLevel: number = BATTLE_ARMOR_ADVANCED_RULES_LEVEL): { armor: IBattleArmorArmorType; techBase: BattleArmorTechBase; kgPerPoint: number }[] {
        const choices: { armor: IBattleArmorArmorType; techBase: BattleArmorTechBase; kgPerPoint: number }[] = [];
        const bases: BattleArmorTechBase[] = this._mixedTech ? [this._techBase, this.isClan() ? "is" : "clan"] : [this._techBase];
        for (const armor of battleArmorArmorTypes) {
            for (const techBase of bases) {
                const kgPerPoint = armor.kgPerPoint[techBase];
                if (kgPerPoint === null) continue;
                const current = armor.tag === this._armor.tag && techBase === this._armorBase();
                const dates = techBase === "clan" && armor.clanDates ? { ...armor, ...armor.clanDates } : armor;
                const inEra = this._inEra({
                    introduced: dates.introduced,
                    ...(typeof dates.prototype === "number" ? { prototype: dates.prototype } : {}),
                    ...(typeof dates.extinct === "number" ? { extinct: dates.extinct } : {}),
                    ...(typeof dates.reintroduced === "number" ? { reintroduced: dates.reintroduced } : {}),
                });
                if (current || ((armor.book === "TM" || rulesLevel >= BATTLE_ARMOR_ADVANCED_RULES_LEVEL) && inEra)) choices.push({ armor, techBase, kgPerPoint });
            }
        }
        return choices;
    }

    /** Sets the armor; on a mixed-technology suit, with the technology base it is taken from. */
    public setArmor(tag: string, techBase?: BattleArmorTechBase): boolean {
        const armor = battleArmorArmorTypes.find((entry) => entry.tag === tag);
        if (!armor) return false;
        const base = this._mixedTech && techBase ? techBase : this._armorBase(armor);
        if (armor.kgPerPoint[base] === null) return false;
        this._armor = armor;
        this._armorTechBase = this._mixedTech && base !== this._techBase ? base : null;
        return true;
    }

    public setArmorPoints(points: number): void { this._armorPoints = Math.min(this.getMaxArmorPoints(), Math.max(0, Math.round(points) || 0)); }
    public getArmorWeight(): number { return this._armorPoints * (this.getArmorKgPerPoint() ?? 0); }
    /** Slots the armor takes, wherever on the suit they are found (TM p.168). */
    public getArmorSlots(): number { return this._armorPoints > 0 ? this._armor.slots : 0; }
    /** Slots that may be found anywhere on the suit: the armor's, and a myomer booster's (TO:AUE pp.98-99). */
    public getSpreadSlots(): number {
        return this._worst(() => this.getArmorSlots() + this._items.reduce((sum, entry) => {
            const equipment = findBattleArmorEquipment(entry.tag);
            return sum + (equipment?.spreadSlots ? equipment.slots : 0);
        }, 0));
    }

    // Equipment carried by one trooper only. The construction rules build one suit for the whole squad; published
    // squads with a trooper equipped differently (the Kage's support trooper, TRO:3058U p.16) are handled as
    // MegaMek does: every trooper's suit must be legal on its own.

    public hasTrooperEquipment(): boolean { return this._loadoutItems().some((entry) => !!entry.trooper); }
    /** Works something out for one trooper's suit: the squad's equipment and that trooper's own. */
    private _asTrooper<T>(trooper: number, calc: () => T): T {
        const before = this._view;
        this._view = trooper;
        try {
            return calc();
        } finally {
            this._view = before;
        }
    }
    /** The suits that differ in the squad: a trooper wearing each, and how many troopers wear it. */
    private _trooperSuits(): { trooper: number; count: number }[] {
        if (this._view > 0 || !this.hasTrooperEquipment()) return [{ trooper: this._view, count: this._squadSize }];
        const own = [...new Set(this._loadoutItems().map((entry) => entry.trooper ?? 0))].filter((trooper) => trooper > 0 && trooper <= this._squadSize).sort((a, b) => a - b);
        const suits = own.map((trooper) => ({ trooper, count: 1 }));
        const plain = Array.from({ length: this._squadSize }, (_unused, index) => index + 1).find((trooper) => !own.includes(trooper));
        if (plain) suits.push({ trooper: plain, count: this._squadSize - own.length });
        return suits;
    }
    private _suitName(suit: { trooper: number; count: number }): string {
        return suit.count > 1 ? `The other ${suit.count} troopers` : `Trooper ${suit.trooper}`;
    }
    /** The highest value among the troopers' suits. */
    private _worst(calc: () => number): number {
        return Math.max(...this._trooperSuits().map((suit) => this._asTrooper(suit.trooper, calc)));
    }
    /** The weight of one trooper's suit (1 to 6). */
    public getTrooperWeight(trooper: number): number {
        return this._asTrooper(trooper, () => round2(this.getWeightLog().reduce((sum, line) => sum + line.kg, 0)));
    }
    /** Is the item out of play because the one trooper who carries it is destroyed? */
    public isItemLost(entry: IBattleArmorMountedItem): boolean { return !!entry.trooper && !this.isTrooperActive(entry.trooper - 1); }

    // Step 5: weapons, ammunition and other equipment (TM pp.170-171)

    public getItems(): IBattleArmorMountedItem[] { return this._items; }
    public getAPMounts(): IBattleArmorAPMount[] { return this._apMounts; }
    public getTurret(): IBattleArmorTurret | null { return this.isQuad() ? this._turret : null; }
    /** Equipment on offer at a rules level: what the era has, and whatever is mounted already. */
    public getAvailableEquipment(rulesLevel: number = 7): IBattleArmorEquipment[] {
        const mounted = new Set(this._items.map((entry) => entry.tag));
        return (this._mixedTech ? battleArmorEquipment : getBattleArmorEquipmentFor(this._techBase)).filter((equipment) =>
            mounted.has(equipment.tag) || ((equipment.rulesLevel ?? BATTLE_ARMOR_RULES_LEVEL) <= rulesLevel && this.isEquipmentInEra(equipment)));
    }

    public getLocations(): BattleArmorLocation[] {
        if (this.isQuad()) return this.getTurret() ? ["body", "turret"] : ["body"];
        return ["la", "ra", "body"];
    }

    /** Weapon slots a location has (Battle Armor Structure Weights Table, TM p.163; turret capacity, TM p.262). */
    public getSlots(location: BattleArmorLocation): number {
        if (location === "turret") {
            const turret = this.getTurret();
            return turret ? turret.size + (turret.configurable ? BATTLE_ARMOR_TURRET.configurable.capacity : 0) : 0;
        }
        if (this.isQuad()) return location === "body" ? this._weightClass.quadSlots ?? 0 : 0;
        return location === "body" ? this._weightClass.bodySlots : this._weightClass.armSlots;
    }

    public isOneShot(entry: IBattleArmorMountedItem): boolean {
        const equipment = findBattleArmorEquipment(entry.tag);
        return equipment?.oneShot === "always" || (!!entry.oneShot && !!equipment?.oneShot);
    }

    public getItemShots(entry: IBattleArmorMountedItem): number {
        const equipment = findBattleArmorEquipment(entry.tag);
        if (!equipment || equipment.kind !== "missile") return 0;
        return this.isOneShot(entry) ? 1 : Math.max(0, entry.shots ?? 0);
    }

    public getItemSlots(entry: IBattleArmorMountedItem): number {
        const equipment = findBattleArmorEquipment(entry.tag);
        if (!equipment || equipment.spreadSlots) return 0;
        // The weapon in a detachable weapon pack is carried outside the suit; the pack takes one slot (TO:AUE pp.98-99).
        if (entry.dwp) return BATTLE_ARMOR_WEAPON_PACK.slots;
        const oneShot = this.isOneShot(entry) && equipment.oneShot !== "always" && equipment.oneShot ? equipment.oneShot : null;
        const reloads = equipment.kind === "missile" && !this.isOneShot(entry) ? Math.ceil(this.getItemShots(entry) / BATTLE_ARMOR_SHOTS_PER_SLOT) : 0;
        return (oneShot ? oneShot.slots : equipment.slots) + reloads + (entry.modular ? BATTLE_ARMOR_MODULAR_MOUNT.slots : 0);
    }

    /** The weapon with its ammunition, before any mount. */
    private _itemLoadedWeight(entry: IBattleArmorMountedItem): number {
        const equipment = findBattleArmorEquipment(entry.tag);
        if (!equipment) return 0;
        if (equipment.variableWeight) return Math.max(0, entry.kg ?? 0);
        // Twice the weight of one Jumping MP for the suit's weight class (TO:AUE p.225).
        if (equipment.mechanicalJumpBooster) return 2 * this._weightClass.jump.kgPerMP;
        const oneShot = this.isOneShot(entry) && equipment.oneShot !== "always" && equipment.oneShot ? equipment.oneShot : null;
        const ammunition = equipment.kind === "missile" && !this.isOneShot(entry) ? this.getItemShots(entry) * (equipment.ammoKg ?? 0) : 0;
        return (oneShot ? oneShot.kg : equipment.kg) + ammunition;
    }

    public getItemWeight(entry: IBattleArmorMountedItem): number {
        let weight = this._itemLoadedWeight(entry);
        // Every suit carries a share of the squad support weapon, rounded up to the kilogram (TM p.270).
        if (entry.squadSupport) weight = Math.ceil(weight * BATTLE_ARMOR_SQUAD_SUPPORT_SHARE[this._techBase] - 1e-9);
        // Three quarters of the weapon and its ammunition, rounded up to the nearest 5 kg (TO:AUE pp.98-99).
        if (entry.dwp) weight = Math.ceil(weight * BATTLE_ARMOR_WEAPON_PACK.share / BATTLE_ARMOR_WEAPON_PACK.roundTo - 1e-9) * BATTLE_ARMOR_WEAPON_PACK.roundTo;
        return weight + (entry.detachable ? BATTLE_ARMOR_DETACHABLE.kg : 0) + (entry.modular ? BATTLE_ARMOR_MODULAR_MOUNT.kg : 0);
    }

    private _turretMount(): { kg: number; slots: number; cost: number } {
        const turret = this.getTurret();
        if (!turret) return { kg: 0, slots: 0, cost: 0 };
        const configurable = turret.configurable ? BATTLE_ARMOR_TURRET.configurable : { kg: 0, slots: 0, cost: 0 };
        return {
            kg: BATTLE_ARMOR_TURRET.baseKg + BATTLE_ARMOR_TURRET.kgPerSlot * turret.size + configurable.kg,
            slots: BATTLE_ARMOR_TURRET.slots + configurable.slots,
            cost: BATTLE_ARMOR_TURRET.costPerSlot * turret.size + configurable.cost,
        };
    }

    /** Slots taken in a location by equipment, mounts and adaptors; armor is counted over the whole suit. */
    public getUsedSlots(location: BattleArmorLocation): number { return this._worst(() => this._usedSlots(location)); }
    private _usedSlots(location: BattleArmorLocation): number {
        let used = this._items.filter((entry) => entry.location === location).reduce((sum, entry) => sum + this.getItemSlots(entry), 0);
        used += this._apMounts.filter((mount) => mount.location === location).length * BATTLE_ARMOR_AP_MOUNT.slots;
        if ((location === "la" || location === "ra") && !this.isQuad() && this._arms[location].adaptor) used += BATTLE_ARMOR_ADAPTOR.slots;
        if (location === "body") used += this._turretMount().slots;
        return used;
    }

    public getFreeSlots(location: BattleArmorLocation): number { return this.getSlots(location) - this.getUsedSlots(location); }

    /** Slots left on the suit once the armor's are found; a turret's capacity is for what it mounts, not armor. */
    public getFreeSlotsAfterArmor(): number { return -this._worst(() => -this._freeSlotsAfterArmor()); }
    private _freeSlotsAfterArmor(): number {
        return this.getLocations().filter((location) => location !== "turret").reduce((sum, location) => sum + Math.max(0, this.getFreeSlots(location)), 0) - this.getSpreadSlots();
    }

    public addItem(tag: string, location: BattleArmorLocation): boolean {
        const equipment = findBattleArmorEquipment(tag);
        if (!equipment || !this._offers(equipment.techBase) || this._baseItems.length >= MAX_BATTLE_ARMOR_ITEMS) return false;
        if (!this.getLocations().includes(location)) return false;
        const entry: IBattleArmorMountedItem = { tag, location: equipment.bodyOnly ? "body" : location };
        if (equipment.kind === "missile" && equipment.oneShot !== "always") entry.shots = 1;
        this._baseItems.push(entry);
        return true;
    }

    /** Any weapon but a missile launcher may ride in a detachable weapon pack (TO:AUE pp.98-99). */
    private _packable(equipment: IBattleArmorEquipment): boolean {
        return (equipment.kind === "weapon" && !equipment.noMount) || equipment.tag.endsWith("-tube-artillery");
    }
    public canUseWeaponPack(entry: IBattleArmorMountedItem): boolean {
        const equipment = findBattleArmorEquipment(entry.tag);
        return !!equipment && this._packable(equipment) && entry.location !== "turret";
    }

    public removeItem(index: number): void {
        if (index < 0 || index >= this._baseItems.length) return;
        this._baseItems.splice(index, 1);
        // Loadouts name their mounts by position.
        for (const loadout of this._loadouts) {
            const weapons: Record<string, IBattleArmorLoadoutWeapon> = {};
            for (const [key, swap] of Object.entries(loadout.weapons)) {
                const at = Number(key);
                if (at !== index) weapons[String(at > index ? at - 1 : at)] = swap;
            }
            loadout.weapons = weapons;
        }
    }

    public updateItem(index: number, change: Partial<IBattleArmorMountedItem>): void {
        const entry = this._baseItems[index];
        const equipment = entry ? findBattleArmorEquipment(entry.tag) : null;
        if (!entry || !equipment) return;
        const next = { ...entry, ...change, tag: entry.tag };
        if (!this.getLocations().includes(next.location) || equipment.bodyOnly) next.location = equipment.bodyOnly ? "body" : entry.location;
        const missile = equipment.kind === "missile";
        next.shots = missile && equipment.oneShot !== "always" ? Math.min(40, Math.max(0, Math.round(next.shots ?? 0) || 0)) : undefined;
        next.oneShot = missile && typeof equipment.oneShot === "object" && !!next.oneShot ? true : undefined;
        next.detachable = missile && !!next.detachable ? true : undefined;
        next.modular = !equipment.noMount && !this.isQuad() && !!next.modular ? true : undefined;
        next.squadSupport = !equipment.noMount && !this.isQuad() && equipment.kind !== "equipment" && !!next.squadSupport ? true : undefined;
        next.kg = equipment.variableWeight ? Math.min(2000, Math.max(0, Math.round(next.kg ?? 0) || 0)) : undefined;
        // A detachable weapon pack carries one weapon that is not a missile launcher, and not in a modular mount (TO:AUE pp.98-99).
        next.dwp = this._packable(equipment) && next.location !== "turret" && !next.modular && !next.squadSupport && !!next.dwp ? true : undefined;
        // Every suit carries its share of the squad support weapon, so it is never one trooper's own.
        next.trooper = !next.squadSupport && typeof next.trooper === "number" && Number.isInteger(next.trooper) && next.trooper >= 1 && next.trooper <= BATTLE_ARMOR_MAX_SQUAD ? next.trooper : undefined;
        next.mine = equipment.mineDispenser && next.mine !== battleArmorMineTypes[0].tag && battleArmorMineTypes.some((mine) => mine.tag === next.mine) ? next.mine : undefined;
        // One squad support weapon to a suit (TM p.270).
        if (next.squadSupport) this._baseItems.forEach((other, otherIndex) => { if (otherIndex !== index) delete other.squadSupport; });
        this._baseItems[index] = next;
    }

    /** Standard-type conventional infantry weapons an anti-personnel mount may carry (TM p.170). */
    public getAntiPersonnelWeapons(): IInfantryWeapon[] {
        return infantryWeapons.filter((weapon) => weapon.type === "standard" && (weapon.techBase === "both" || this._mixedTech || weapon.techBase === this._techBase));
    }

    public addAPMount(location: BattleArmorLocation, weapon: string = ""): boolean {
        if (!this.getLocations().includes(location) || location === "turret" || this._apMounts.length >= 6) return false;
        this._apMounts.push({ location, weapon: this.getAntiPersonnelWeapons().some((entry) => entry.tag === weapon) ? weapon : "" });
        return true;
    }

    public setAPMountWeapon(index: number, weapon: string): void {
        if (this._apMounts[index]) this._apMounts[index].weapon = this.getAntiPersonnelWeapons().some((entry) => entry.tag === weapon) ? weapon : "";
    }

    public removeAPMount(index: number): void { this._apMounts.splice(index, 1); }

    /** A quad's turret mount: its standard size in slots, and whether it is configurable (TM p.262). */
    public setTurret(size: number, configurable: boolean = false): void {
        if (!this.isQuad() || size <= 0) {
            this._turret = null;
        } else {
            const clamped = Math.min(BATTLE_ARMOR_TURRET.maxCapacity, Math.max(BATTLE_ARMOR_TURRET.minCapacity, Math.round(size)));
            this._turret = { size: clamped, configurable: configurable && clamped > BATTLE_ARMOR_TURRET.minCapacity };
        }
        this._clamp();
    }

    // Squad

    public getSquadSize(): number { return this._squadSize; }
    public setSquadSize(size: number): void { this._squadSize = Math.min(BATTLE_ARMOR_MAX_SQUAD, Math.max(1, Math.round(size) || 1)); }
    public getGunnery(): number { return this._gunnery; }
    public getAntiMechSkill(): number { return this._antiMech; }
    public setGunnery(skill: number): void { this._gunnery = Math.min(8, Math.max(0, Math.round(skill) || 0)); }
    public setAntiMechSkill(skill: number): void { this._antiMech = Math.min(8, Math.max(0, Math.round(skill) || 0)); }

    // Weight

    public getWeightLog(): { label: string; kg: number }[] {
        const log: { label: string; kg: number }[] = [{ label: `Chassis (${this._weightClass.name}, ${this.isClan() && !this.usesExoskeletonChassis() ? "Clan" : "Inner Sphere"})`, kg: this.getChassisWeight() }];
        const extraGround = this._groundMP - this.getFreeGroundMP();
        if (extraGround > 0) log.push({ label: `Ground MP, ${extraGround} above the free ${this.getFreeGroundMP()}`, kg: extraGround * this._weightClass.kgPerGroundMP });
        const limit = this.getMotiveLimit(this._motive);
        if (limit && this._motiveMP > 0) log.push({ label: `${this._motive === "jump" ? "Jump jets" : this._motive.toUpperCase()}, ${this._motiveMP} MP`, kg: this._motiveMP * limit.kgPerMP });
        if (!this.isQuad()) {
            for (const arm of ["la", "ra"] as BattleArmorArm[]) {
                if (this._arms[arm].adaptor) log.push({ label: `Modular equipment adaptor (${BATTLE_ARMOR_LOCATION_NAMES[arm]})`, kg: BATTLE_ARMOR_ADAPTOR.kg });
                const weight = this._manipulatorWeight(arm);
                if (weight > 0) log.push({ label: `${this.getManipulator(arm).name} (${BATTLE_ARMOR_LOCATION_NAMES[arm]})`, kg: weight });
            }
        }
        if (this._armorPoints > 0) log.push({ label: `${this._mixedTech ? `${techName(this._armorBase())} ` : ""}${this._armor.name} armor, ${this._armorPoints} points`, kg: this.getArmorWeight() });
        const turret = this._turretMount();
        if (turret.kg > 0) log.push({ label: `${this.getTurret()?.configurable ? "Configurable" : "Standard"} turret mount (${this.getSlots("turret")} slots)`, kg: turret.kg });
        this._items.forEach((entry) => log.push({ label: this.getItemLabel(entry), kg: this.getItemWeight(entry) }));
        this._apMounts.forEach((mount) => log.push({ label: `Anti-personnel weapon mount (${BATTLE_ARMOR_LOCATION_NAMES[mount.location]})`, kg: BATTLE_ARMOR_AP_MOUNT.kg }));
        return log;
    }

    public getItemLabel(entry: IBattleArmorMountedItem): string {
        const equipment = findBattleArmorEquipment(entry.tag);
        if (!equipment) return entry.tag;
        const parts: string[] = [];
        if (this.isOneShot(entry) && equipment.oneShot !== "always") parts.push("one-shot");
        if (equipment.kind === "missile" && !this.isOneShot(entry)) parts.push(`${this.getItemShots(entry)} shots`);
        if (entry.detachable) parts.push("detachable");
        if (entry.modular) parts.push("modular mount");
        if (entry.dwp) parts.push("detachable weapon pack");
        if (entry.squadSupport) parts.push("squad support weapon");
        if (equipment.mineDispenser) parts.push(`${findBattleArmorMineType(entry.mine).name} mines`);
        if (entry.trooper) parts.push(`trooper ${entry.trooper} only`);
        return `${this._mixedTech ? `${equipment.techBase === "clan" ? "Clan" : "IS"} ` : ""}${equipment.name}${parts.length ? ` (${parts.join(", ")})` : ""}, ${BATTLE_ARMOR_LOCATION_NAMES[entry.location]}`;
    }

    /** The weight of the suit; where troopers carry equipment of their own, of the heaviest trooper's. */
    public getWeight(): number { return this._worst(() => round2(this.getWeightLog().reduce((sum, line) => sum + line.kg, 0))); }
    public getRemainingWeight(): number { return round2(this._weightClass.maxWeight - this.getWeight()); }

    // Legality

    private _countsAsAntiMechWeapon(entry: IBattleArmorMountedItem): boolean {
        const equipment = findBattleArmorEquipment(entry.tag);
        return !!equipment && equipment.kind !== "equipment";
    }

    /** What is wrong with one suit: the squad's, or the trooper's being worked out. */
    private _suitIssues(): string[] {
        const issues: string[] = [];
        const weightClass = this._weightClass;
        const weight = this.getWeight();
        if (weight > weightClass.maxWeight) issues.push(`The suit weighs ${weight} kg, over the ${weightClass.maxWeight} kg of the ${weightClass.name} class (TM p.163).`);
        if (this.isQuad() && weightClass.quadSlots === null) issues.push("Exoskeletons and PA(L) suits may only be humanoid (TM p.162).");

        for (const location of this.getLocations()) {
            if (this.getFreeSlots(location) < 0) issues.push(`${BATTLE_ARMOR_LOCATION_NAMES[location]}: ${this.getUsedSlots(location)} slots used of ${this.getSlots(location)} (TM p.163).`);
        }
        if (this.getFreeSlotsAfterArmor() < 0 && this.getSpreadSlots() > 0) {
            const what = this.getSpreadSlots() > this.getArmorSlots() ? (this.getArmorSlots() > 0 ? `${this._armor.name} armor and the myomer booster need` : "The myomer booster needs") : `${this._armor.name} armor needs`;
            issues.push(`${what} ${this.getSpreadSlots()} weapon slots; the suit has ${this.getFreeSlotsAfterArmor() + this.getSpreadSlots()} free (TM p.169).`);
        }
        if (this.getArmorKgPerPoint() === null) issues.push(`${this._armor.name} armor is not made for ${techName(this._armorBase())} battle armor (TM p.169).`);

        // Battle Armor Weapon Limits Table, TM p.170.
        for (const location of this.getLocations()) {
            const antiMech = this._items.filter((entry) => entry.location === location && this._countsAsAntiMechWeapon(entry)).length;
            const antiPersonnel = this._apMounts.filter((mount) => mount.location === location).length;
            if (location === "la" || location === "ra") {
                const limits = BATTLE_ARMOR_WEAPON_LIMITS.arm;
                if (antiMech > limits.antiMech || antiMech + antiPersonnel > limits.total) {
                    issues.push(`${BATTLE_ARMOR_LOCATION_NAMES[location]}: at most 1 anti-'Mech weapon and 1 anti-personnel mount, or 2 anti-personnel mounts (TM p.170).`);
                }
            }
        }
        const bodyLimits = this.isQuad() ? BATTLE_ARMOR_WEAPON_LIMITS.quadBody : BATTLE_ARMOR_WEAPON_LIMITS.body;
        const bodyAntiMech = this._items.filter((entry) => (entry.location === "body" || entry.location === "turret") && this._countsAsAntiMechWeapon(entry)).length;
        const bodyAntiPersonnel = this._apMounts.filter((mount) => mount.location === "body").length;
        if (bodyAntiMech > bodyLimits.antiMech || bodyAntiPersonnel > bodyLimits.antiPersonnel) {
            issues.push(`Body: at most ${bodyLimits.antiMech} anti-'Mech weapons and ${bodyLimits.antiPersonnel} anti-personnel mounts (TM p.170).`);
        }

        const counts = new Map<string, number>();
        this._items.forEach((entry) => counts.set(entry.tag, (counts.get(entry.tag) ?? 0) + 1));
        for (const [tag, count] of counts) {
            const equipment = findBattleArmorEquipment(tag);
            if (equipment?.max && count > equipment.max) issues.push(`A suit may mount only ${equipment.max} ${equipment.name} (TM p.${equipment.page}).`);
        }

        const boosters = this._items.filter((entry) => (findBattleArmorEquipment(entry.tag)?.jumpBonus ?? 0) > 0);
        const mechanical = this._items.some((entry) => findBattleArmorEquipment(entry.tag)?.mechanicalJumpBooster);
        const wingOnMechanical = mechanical && boosters.every((entry) => findBattleArmorEquipment(entry.tag)?.name === "Partial Wing");
        if (boosters.length > 0 && this._motive !== "jump" && !wingOnMechanical) issues.push("A jump booster or partial wing needs jump jets (TM p.165).");
        if (boosters.length > 1) issues.push("A jump booster and a partial wing may not be combined (TM p.165).");
        // Tactical Operations equipment (TO:AUE pp.98-99).
        const myomer = this._items.map((entry) => findBattleArmorEquipment(entry.tag)).find((equipment) => equipment?.groundBonus);
        if (myomer && mechanical) issues.push("A mechanical jump booster and a myomer booster may not be combined (TO:AUE p.98).");
        if (myomer?.barsArmor?.includes(this._armor.tag) && this._armorPoints > 0) issues.push(`A suit with a myomer booster may not mount Stealth or Mimetic armor (TO:AUE pp.98-99).`);
        if (this._items.some((entry) => entry.dwp)) {
            const heavy = weightClass.tag === "heavy" || weightClass.tag === "assault";
            if (weightClass.tag !== "medium" && !heavy) issues.push("Only Medium, Heavy and Assault battle armor may carry a detachable weapon pack (TO:AUE pp.98-99).");
            else if (this.getTotalGroundMP() - (heavy ? 2 : 3) < 0) issues.push(`A detachable weapon pack costs this suit ${heavy ? 2 : 3} Ground MP, which may not take it below 0 (TO:AUE pp.98-99).`);
        }
        if (this._hasItem("Magnetic Clamps")) {
            if (this.isQuad() || weightClass.tag === "assault") issues.push("Magnetic clamps are for humanoid suits of Heavy class or lighter (TM p.167).");
            if (this._motive === "umu") issues.push("Magnetic clamps may not be used on a suit with UMUs (TM p.167).");
        }
        if (this._hasItem("Bomb Rack") && this._motive !== "vtol") issues.push("A bomb rack is carried by battle armor with VTOL movement (TM p.253).");

        this._items.forEach((entry) => {
            const equipment = findBattleArmorEquipment(entry.tag);
            if (!equipment) return;
            if (equipment.kind === "missile" && !this.isOneShot(entry) && this.getItemShots(entry) < 1) issues.push(`${equipment.name}: a launcher needs at least one shot (TM p.171).`);
            // Inner Sphere suits with jump jets must make body-mounted missile launchers detachable (TM p.171).
            if (!this.isClan() && this._motive === "jump" && equipment.kind === "missile" && entry.location === "body" && !entry.detachable && equipment.tubes) {
                issues.push(`${equipment.name}: an Inner Sphere suit with jump jets must make a body-mounted missile launcher detachable (TM p.171).`);
            }
            if (entry.modular) {
                const sameLocation = this._items.filter((other) => other.location === entry.location && other.modular).length;
                const most = entry.location === "body" ? 2 : 1;
                if (sameLocation > most && this._items.find((other) => other.location === entry.location && other.modular) === entry) {
                    issues.push(`${BATTLE_ARMOR_LOCATION_NAMES[entry.location]}: at most ${most} standard modular weapon ${most === 1 ? "mount" : "mounts"} (TM p.171).`);
                }
            }
        });

        // Paired manipulators (TM p.166).
        if (!this.isQuad()) {
            const left = this.getManipulator("la");
            const right = this.getManipulator("ra");
            if ((left.mustPair || right.mustPair) && left.tag !== right.tag) issues.push(`${left.mustPair ? left.name : right.name} must be mounted in pairs (TM p.166).`);
        }
        issues.push(...this.getEraIssues());
        return issues;
    }

    public getIssues(): string[] {
        const suits = this._trooperSuits();
        const lists = suits.map((suit) => this._asTrooper(suit.trooper, () => this._suitIssues()));
        const issues: string[] = [];
        lists.forEach((list, at) => {
            for (const issue of list) {
                // What is wrong with every trooper's suit is said once.
                const text = lists.every((other) => other.includes(issue)) ? issue : `${this._suitName(suits[at])}: ${issue}`;
                if (!issues.includes(text)) issues.push(text);
            }
        });
        for (const entry of this._view === 0 ? this._items : []) {
            if ((entry.trooper ?? 0) > this._squadSize) issues.push(`${findBattleArmorEquipment(entry.tag)?.name ?? entry.tag} is carried by trooper ${entry.trooper}, but the squad has ${this._squadSize} troopers.`);
        }
        // Every alternate loadout must be a legal suit too.
        if (this._view === 0 && this._activeLoadout < 0) {
            this._loadouts.forEach((loadout, index) => {
                const base = new Set(issues);
                for (const issue of this.getLoadoutSuit(index).getIssues()) {
                    if (!base.has(issue)) issues.push(`Loadout "${loadout.name}": ${issue}`);
                }
            });
        }
        return issues;
    }

    public getNotes(): string[] {
        const notes: string[] = [];
        const weight = this.getWeight();
        if (weight < this._weightClass.minWeight) notes.push(`At ${weight} kg the suit is under the ${this._weightClass.minWeight} kg at which the ${this._weightClass.name} class starts; the unspent weight is wasted or left for modular mounts and mission equipment (TM p.162).`);
        if (this._weightClass.tag === "pa-l" && (!this.isClan() || this.usesExoskeletonChassis()) && !(this._hasItem("Extended Life Support") && this._armorPoints >= 1)) {
            notes.push("An exoskeleton on an Inner Sphere chassis weight is \"open\" unless it has extended life support and at least 1 point of armor; a PA(L) suit is enclosed (TM p.168).");
        }
        if (!this.isQuad() && (["la", "ra"] as BattleArmorArm[]).some((arm) => this.getManipulator(arm).kind === "glove")) {
            notes.push("With an armored glove the trooper may carry one more non-Melee conventional infantry weapon with a crew of less than 2; its weight is not counted (TM p.171).");
        }
        if (this._apMounts.length > 0) notes.push("The weight of anti-personnel weapons and their ammunition is not counted against the suit (TM p.271).");
        if (this._items.some((entry) => entry.squadSupport)) notes.push("Every suit carries a share of the squad support weapon; one trooper fires it (TM p.270).");
        if (this._items.some((entry) => entry.dwp)) {
            const heavy = this._weightClass.tag === "heavy" || this._weightClass.tag === "assault";
            notes.push(`While it carries a detachable weapon pack the suit loses ${heavy ? 2 : 3} Ground MP (a suit brought to 0 moves 1) and may not jump; the packs are dropped in an End Phase, and the squad regains its movement when all are gone (TO:AUE pp.98-99).`);
        }
        for (const entry of this._items) {
            const equipment = findBattleArmorEquipment(entry.tag);
            if (equipment?.book === "TO:AUE" && equipment.notes && !notes.includes(`${equipment.name}: ${equipment.notes}`)) notes.push(`${equipment.name}: ${equipment.notes}`);
        }
        if (this._mixedTech) notes.push("Mixed technology: any unit may combine Clan and Inner Sphere technology as an advanced construction option, each item following its own construction rules (TO:AUE p.189).");
        if (this.hasTrooperEquipment()) {
            notes.push("Some equipment is carried by one trooper only. The construction rules build one suit for the whole squad; as in MegaMek, each trooper's suit must be legal on its own, the weight shown is the heaviest trooper's and the Battle Value is the average of the troopers' suits. The equipment is lost with its trooper.");
        }
        if (this.canUseExoskeletonChassis() && this.usesExoskeletonChassis() && this._motive === "umu") {
            notes.push("TM p.165 allows UMUs on a Clan exoskeleton with an Inner Sphere chassis weight; TM p.270 says such an exoskeleton may not use them. The construction step is followed.");
        }
        return notes;
    }

    // Battle Value (TM pp.310-311)

    /** The suit's standard movement, boosters counted and detachable weapon packs not (TO:AUE p.192). */
    private _bestMovement(): { mp: number; modifier: number } {
        const groundMP = this.getTotalGroundMP();
        const modes = [{ mp: groundMP, modifier: getBattleArmorTargetMovementModifier(groundMP) }];
        if (this._motive === "umu") modes.push({ mp: this._motiveMP, modifier: getBattleArmorTargetMovementModifier(this._motiveMP) });
        // Jumping and VTOL movement add 1 to the target movement modifier.
        const jump = this.getJumpMP();
        if (jump > 0) modes.push({ mp: jump, modifier: getBattleArmorTargetMovementModifier(jump) + 1 });
        if (this._motive === "vtol") modes.push({ mp: this._motiveMP, modifier: getBattleArmorTargetMovementModifier(this._motiveMP) + 1 });
        return { mp: Math.max(...modes.map((mode) => mode.mp)), modifier: Math.max(...modes.map((mode) => mode.modifier)) };
    }

    private _itemBattleValue(entry: IBattleArmorMountedItem): number {
        const equipment = findBattleArmorEquipment(entry.tag);
        if (!equipment) return 0;
        // A mine dispenser is worth a 10-point minefield of the mines it carries (TO:AUE p.195; Minefield BV Table p.197).
        if (equipment.mineDispenser) return findBattleArmorMineType(entry.mine).bv;
        const oneShot = this.isOneShot(entry) && equipment.oneShot !== "always";
        const launcherBV = oneShot ? equipment.bvOneShot ?? equipment.bv : equipment.bv;
        const ammunition = equipment.kind === "missile" && !this.isOneShot(entry) ? (this.getItemShots(entry) * (equipment.ammoKg ?? 0) / 1000) * (equipment.ammoBVPerTon ?? 0) : 0;
        return launcherBV + ammunition;
    }

    private _suitBattleValue(): { raw: number; log: string[] } {
        const log: string[] = [];
        const armorBV = ["ba-fire-resistant", "ba-laser-reflective", "ba-reactive"].includes(this._armor.tag) ? 3.5 : 2.5;
        let defensive = this._armorPoints * armorBV + 1;
        log.push(`Armor: (${this._armorPoints} points x ${armorBV}) + 1 = ${round2(defensive)}`);
        const defensiveItems = this._items.reduce((sum, entry) => {
            const equipment = findBattleArmorEquipment(entry.tag);
            return sum + (equipment?.defensive ? equipment.defensiveValue ?? 1 : 0);
        }, 0);
        if (defensiveItems > 0) {
            defensive += defensiveItems;
            log.push(`Improved sensors, active probes and ECM: +${defensiveItems}`);
        }
        const movement = this._bestMovement();
        const camo = this._items.reduce((sum, entry) => Math.max(sum, findBattleArmorEquipment(entry.tag)?.defensiveFactorBonus ?? 0), 0);
        const factor = round2(1 + movement.modifier / 10 + 0.1 + this._armor.defensiveFactorBonus + camo);
        const defensiveRating = defensive * factor;
        log.push(`Defensive Factor: 1 + ${round2(movement.modifier / 10)} (target movement modifier +${movement.modifier}) + 0.1 (battle armor)${this._armor.defensiveFactorBonus ? ` + ${this._armor.defensiveFactorBonus} (${this._armor.name})` : ""}${camo ? ` + ${camo} (camo system)` : ""} = ${factor}`);
        log.push(`Defensive Battle Rating: ${round2(defensive)} x ${factor} = ${round2(defensiveRating)}`);

        const capabilities = this.getCapabilities();
        const own = this._items.filter((entry) => !entry.squadSupport);
        const directFire = own.filter((entry) => findBattleArmorEquipment(entry.tag)?.kind === "weapon").reduce((sum, entry) => sum + this._itemBattleValue(entry), 0);
        const missiles = own.filter((entry) => findBattleArmorEquipment(entry.tag)?.kind === "missile").reduce((sum, entry) => sum + this._itemBattleValue(entry), 0);
        let antiMech = 0;
        if (capabilities.swarm) {
            const manipulators = this.isQuad() ? [] : (["la", "ra"] as BattleArmorArm[]).map((arm) => this.getManipulator(arm));
            const each = manipulators.reduce((sum, manipulator) => sum + (manipulator.bv?.per === "each" ? manipulator.bv.value : 0), 0);
            const pair = manipulators.length === 2 && manipulators[0].bv?.per === "pair" && manipulators[0].tag === manipulators[1].tag ? manipulators[0].bv.value : 0;
            antiMech = directFire + each + pair;
        }
        const antiPersonnel = this._apMounts.reduce((sum, mount) => sum + (findInfantryWeapon(mount.weapon)?.battleValue ?? 0), 0);
        const squadSupport = this._items.filter((entry) => entry.squadSupport).reduce((sum, entry) => sum + this._itemBattleValue(entry), 0) / this._squadSize;
        const other = own.filter((entry) => findBattleArmorEquipment(entry.tag)?.kind === "equipment").reduce((sum, entry) => sum + this._itemBattleValue(entry), 0);
        const weaponRating = directFire + missiles + antiMech + antiPersonnel + squadSupport + other;
        log.push(`Weapon Battle Rating: ${round2(directFire)} (direct fire) + ${round2(missiles)} (missiles and ammunition) + ${round2(antiMech)} (Anti-'Mech attacks) + ${round2(antiPersonnel)} (anti-personnel) + ${round2(squadSupport)} (squad support weapon) + ${round2(other)} (other) = ${round2(weaponRating)}`);
        const speedFactor = getBattleArmorSpeedFactor(movement.mp);
        const offensiveRating = weaponRating * speedFactor;
        log.push(`Offensive Battle Rating: ${round2(weaponRating)} x ${speedFactor} (Speed Factor, ${movement.mp} MP) = ${round2(offensiveRating)}`);

        const suit = defensiveRating + offensiveRating;
        log.push(`Battle Value of one suit: ${round2(defensiveRating)} + ${round2(offensiveRating)} = ${round2(suit)}, or ${roundNormally(suit)}`);
        return { raw: suit, log };
    }

    private _calcBattleValue(): { suit: number; squad: number; log: string[] } {
        const suits = this._trooperSuits().map((suit) => ({ ...suit, ...this._asTrooper(suit.trooper, () => this._suitBattleValue()) }));
        const modifier = BATTLE_ARMOR_UNIT_SIZE_BV[this._squadSize] ?? 1;
        const log: string[] = [];
        let suit = suits[0].raw;
        if (suits.length === 1) {
            log.push(...suits[0].log);
        } else {
            // The rules value one suit and multiply; with unlike suits the troopers' average is used, as MegaMek does.
            for (const item of suits) log.push(`${this._suitName(item)}:`, ...item.log);
            suit = suits.reduce((sum, item) => sum + item.raw * item.count, 0) / this._squadSize;
            log.push(`Average of the ${this._squadSize} troopers' suits: ${round2(suit)}`);
        }
        log.push(`${this._squadSize} ${this._squadSize === 1 ? "trooper" : "troopers"}: ${round2(suit)} x ${modifier} = ${roundNormally(suit * modifier)}`);
        return { suit: roundNormally(suit), squad: roundNormally(suit * modifier), log };
    }

    public getSuitBattleValue(): number { return this._calcBattleValue().suit; }
    public getBattleValue(): number { return this._calcBattleValue().squad; }
    public getBattleValueLog(): string[] { return this._calcBattleValue().log; }
    public getSkillMultiplier(edition?: string): number { return getSkillMultiplier(this._gunnery, this._antiMech, "battle-armor", edition) ?? 1; }
    public getSkillAdjustedBattleValue(edition?: string): number { return roundNormally(this.getBattleValue() * this.getSkillMultiplier(edition)); }

    // Cost (TM pp.276, 281, 296-298)

    private _suitCost(): { raw: number; squadOnly: number; log: string[] } {
        const log: string[] = [];
        const weightClass = this._weightClass;
        let structural = weightClass.chassisCost;
        log.push(`Chassis (${weightClass.name}): ${weightClass.chassisCost.toLocaleString("en-US")}`);
        const extraGround = this._groundMP - this.getFreeGroundMP();
        if (extraGround > 0) {
            structural += extraGround * BATTLE_ARMOR_GROUND_MP_COST;
            log.push(`Ground MP above the free minimum: ${extraGround} x ${BATTLE_ARMOR_GROUND_MP_COST.toLocaleString("en-US")}`);
        }
        const limit = this.getMotiveLimit(this._motive);
        if (limit && this._motiveMP > 0) {
            structural += this._motiveMP * limit.costPerMP;
            log.push(`${this._motive === "jump" ? "Jump" : this._motive.toUpperCase()} MP: ${this._motiveMP} x ${limit.costPerMP.toLocaleString("en-US")}`);
        }
        if (!this.isQuad()) {
            for (const arm of ["la", "ra"] as BattleArmorArm[]) {
                const manipulator = this.getManipulator(arm);
                const cost = manipulator.cost * (manipulator.kind === "cargo" ? this._arms[arm].cargoHalfTons : 1) + (this._arms[arm].adaptor ? BATTLE_ARMOR_ADAPTOR.cost : 0);
                if (cost > 0) {
                    structural += cost;
                    log.push(`${BATTLE_ARMOR_LOCATION_NAMES[arm]}: ${manipulator.name}${this._arms[arm].adaptor ? " in a modular equipment adaptor" : ""}: ${cost.toLocaleString("en-US")}`);
                }
            }
        }
        if (this._armorPoints > 0) {
            structural += this._armorPoints * this._armor.costPerPoint;
            log.push(`${this._armor.name} armor: ${this._armorPoints} x ${this._armor.costPerPoint.toLocaleString("en-US")}`);
        }
        if (this.isClan()) {
            structural *= BATTLE_ARMOR_CLAN_COST_MULTIPLIER;
            log.push(`Clan Technology Multiplier: x ${BATTLE_ARMOR_CLAN_COST_MULTIPLIER}`);
        }
        log.push(`Structural cost: ${Math.round(structural).toLocaleString("en-US")}`);

        let equipmentCost = this._turretMount().cost;
        let squadOnly = 0;
        this._items.forEach((entry) => {
            const equipment = findBattleArmorEquipment(entry.tag);
            if (!equipment) return;
            if (equipment.cost === null) {
                log.push(`${equipment.name}: no price is listed`);
                return;
            }
            let cost = equipment.cost * (equipment.tubes ?? 1);
            if (this.isOneShot(entry) && equipment.oneShot !== "always") cost *= 0.5;
            if (entry.detachable) cost += BATTLE_ARMOR_DETACHABLE.cost;
            // Tactical Operations (TO:AUE p.225): a mechanical jump booster costs what a Jumping MP does, a myomer
            // booster 75,000 for each MP it provides, a detachable weapon pack 18,000 on top of its weapon.
            if (equipment.mechanicalJumpBooster) cost = this._weightClass.jump.costPerMP;
            if (equipment.costPerMP && equipment.groundBonus) cost = equipment.costPerMP * (weightClass.tag === "heavy" || weightClass.tag === "assault" ? equipment.groundBonus.heavy : equipment.groundBonus.light);
            if (entry.dwp) cost += BATTLE_ARMOR_WEAPON_PACK.cost;
            if (entry.squadSupport) {
                // One weapon for the squad; every suit has the mount.
                squadOnly += cost;
                equipmentCost += BATTLE_ARMOR_SQUAD_SUPPORT_COST;
                return;
            }
            equipmentCost += cost + (entry.modular ? BATTLE_ARMOR_MODULAR_MOUNT.cost : 0);
        });
        this._apMounts.forEach((mount) => { equipmentCost += BATTLE_ARMOR_AP_MOUNT.cost + (findInfantryWeapon(mount.weapon)?.cost ?? 0); });
        log.push(`Weapons, equipment and mounts: ${Math.round(equipmentCost).toLocaleString("en-US")}`);
        return { raw: structural + equipmentCost, squadOnly, log };
    }

    private _calcCost(): { suit: number; squad: number; log: string[] } {
        const suits = this._trooperSuits().map((suit) => ({ ...suit, ...this._asTrooper(suit.trooper, () => this._suitCost()) }));
        const squadOnly = suits[0].squadOnly;
        const log: string[] = [];
        if (suits.length === 1) log.push(...suits[0].log);
        else for (const item of suits) log.push(`${this._suitName(item)}:`, ...item.log, `Suit: ${Math.round(item.raw).toLocaleString("en-US")}`);
        // The price of one suit; with unlike suits, of the dearest.
        const suit = Math.round(Math.max(...suits.map((item) => item.raw)));
        const squad = Math.round(suits.reduce((sum, item) => sum + item.raw * item.count, 0) + squadOnly);
        log.push(`${suits.length === 1 ? "One suit" : "The dearest suit"}: ${suit.toLocaleString("en-US")}; ${this._squadSize} suits${squadOnly > 0 ? ` and the squad support weapon (${squadOnly.toLocaleString("en-US")})` : ""}: ${squad.toLocaleString("en-US")}`);
        return { suit, squad, log };
    }

    public getSuitCost(): number { return this._calcCost().suit; }
    public getCBillCost(): number { return this._calcCost().squad; }
    public getCBillCostLog(): string[] { return this._calcCost().log; }

    // Alternate loadouts: what the modular mounts and adaptors carry on another mission (TM pp.167, 171, 262)

    public getLoadouts(): IBattleArmorLoadout[] { return this._loadouts; }
    public getActiveLoadout(): number { return this._loadouts[this._activeLoadout] ? this._activeLoadout : -1; }
    public setActiveLoadout(index: number): void { this._activeLoadout = this._loadouts[index] ? index : -1; }

    /** A weapon in a standard modular weapon mount or a configurable turret mount can be changed between missions. */
    public isSwappable(entry: IBattleArmorMountedItem): boolean {
        return !!entry.modular || (entry.location === "turret" && !!this.getTurret()?.configurable);
    }
    private _fitsMount(equipment: IBattleArmorEquipment): boolean { return this._offers(equipment.techBase) && !equipment.noMount; }

    /** The base design's mounts a loadout may refit, by their position in the item list. */
    public getSwappableItems(): { index: number; entry: IBattleArmorMountedItem }[] {
        return this._baseItems.map((entry, index) => ({ index, entry })).filter((item) => this.isSwappable(item.entry));
    }
    public getAdaptorArms(): BattleArmorArm[] {
        return this.isQuad() ? [] : (["la", "ra"] as BattleArmorArm[]).filter((arm) => this._arms[arm].adaptor);
    }
    public canHaveLoadouts(): boolean { return this.getSwappableItems().length > 0 || this.getAdaptorArms().length > 0; }
    public getMountOptions(rulesLevel: number = 7): IBattleArmorEquipment[] {
        return this.getAvailableEquipment(rulesLevel).filter((equipment) => this._fitsMount(equipment));
    }

    public addLoadout(name: string): boolean {
        if (this._loadouts.length >= MAX_BATTLE_ARMOR_LOADOUTS) return false;
        this._loadouts.push({ name: String(name ?? "").trim().slice(0, 40) || `Loadout ${this._loadouts.length + 1}`, weapons: {}, manipulators: {} });
        return true;
    }
    public removeLoadout(index: number): void {
        if (!this._loadouts[index]) return;
        this._loadouts.splice(index, 1);
        if (this._activeLoadout === index) this._activeLoadout = -1;
        else if (this._activeLoadout > index) this._activeLoadout -= 1;
    }
    public setLoadoutName(index: number, name: string): void {
        if (this._loadouts[index]) this._loadouts[index].name = String(name ?? "").slice(0, 40);
    }
    /** Puts a weapon in one of the base design's mounts for this loadout; an empty tag goes back to the base weapon. */
    public setLoadoutWeapon(index: number, itemIndex: number, tag: string, shots?: number, oneShot?: boolean): boolean {
        const loadout = this._loadouts[index];
        const entry = this._baseItems[itemIndex];
        if (!loadout || !entry || !this.isSwappable(entry)) return false;
        if (!tag) {
            delete loadout.weapons[String(itemIndex)];
            return true;
        }
        const equipment = findBattleArmorEquipment(tag);
        if (!equipment || !this._fitsMount(equipment)) return false;
        const missile = equipment.kind === "missile";
        loadout.weapons[String(itemIndex)] = {
            tag: equipment.tag,
            ...(missile && equipment.oneShot !== "always" ? { shots: Math.min(40, Math.max(1, Math.round(shots ?? 1) || 1)) } : {}),
            ...(missile && typeof equipment.oneShot === "object" && oneShot ? { oneShot: true } : {}),
        };
        return true;
    }
    /** Fits a manipulator to an arm's modular equipment adaptor for this loadout; an empty tag goes back to the base one. */
    public setLoadoutManipulator(index: number, arm: BattleArmorArm, tag: string): boolean {
        const loadout = this._loadouts[index];
        if (!loadout || this.isQuad() || !this._arms[arm].adaptor) return false;
        if (!tag) {
            delete loadout.manipulators[arm];
            return true;
        }
        loadout.manipulators[arm] = findBattleArmorManipulator(tag).tag;
        return true;
    }
    /** The suit as it is fielded in one of its loadouts: a copy, so weight, Battle Value and cost can be read off it. */
    public getLoadoutSuit(index: number): BattleArmor {
        const suit = new BattleArmor(this.exportJSON());
        suit.setActiveLoadout(index);
        return suit;
    }

    // Play (Total Warfare pp.219-227)

    public getInPlay(): IBattleArmorInPlay { return this._inPlay; }
    public resetInPlay(): void { this._inPlay = { damage: [] }; }
    /** Damage a trooper takes before being destroyed: the Armor Value and 1 for the soldier inside (TW p.219). */
    public getTrooperCapacity(): number { return this._armorPoints + 1; }
    public getTrooperDamage(trooper: number): number {
        if (trooper < 0 || trooper >= this._squadSize) return 0;
        return Math.min(this.getTrooperCapacity(), Math.max(0, this._inPlay.damage[trooper] ?? 0));
    }
    public setTrooperDamage(trooper: number, points: number): void {
        if (trooper < 0 || trooper >= this._squadSize) return;
        const damage = Array.from({ length: this._squadSize }, (_unused, index) => this.getTrooperDamage(index));
        damage[trooper] = savedNumber(points, damage[trooper], 0, this.getTrooperCapacity());
        this._inPlay.damage = damage;
    }
    public isTrooperActive(trooper: number): boolean { return trooper >= 0 && trooper < this._squadSize && this.getTrooperDamage(trooper) < this.getTrooperCapacity(); }
    public getActiveTroopers(): number { return Array.from({ length: this._squadSize }, (_unused, trooper) => trooper).filter((trooper) => this.isTrooperActive(trooper)).length; }
    public isDestroyed(): boolean { return this.getActiveTroopers() <= 0; }
    public isDamaged(): boolean { return Array.from({ length: this._squadSize }, (_unused, trooper) => this.getTrooperDamage(trooper)).some((damage) => damage > 0); }
    public getStrengthPercentage(): number { return Math.round(this.getActiveTroopers() / this._squadSize * 100); }

    /**
     * Applies a successful attack and says what it did. Each Damage Value grouping strikes a trooper found with
     * 1D6, rolled again for a trooper the squad does not have or has lost; damage beyond what destroys that
     * trooper is wasted. An area-effect weapon applies its damage to every trooper (TW p.219). Laser-reflective
     * armor halves energy damage and reactive armor halves missile, mortar and artillery damage, rounded down;
     * fire-resistant armor ignores heat-causing weapons (TM p.169, TO:AUE pp.93-94).
     */
    public resolveAttack(kind: BattleArmorAttackKind, groupings: number[], areaEffect: boolean = false, roll: () => number = rollD6): string[] {
        const log: string[] = [];
        const armored = this._armorPoints > 0;
        const adjust = (damage: number): number => {
            const value = savedNumber(damage, 0, 0, 999);
            if (armored && kind === "heat" && this._armor.tag === "ba-fire-resistant") return 0;
            if (armored && kind === "energy" && this._armor.tag === "ba-laser-reflective") return Math.floor(value / 2);
            if (armored && kind === "explosive" && this._armor.tag === "ba-reactive") return Math.floor(value / 2);
            return value;
        };
        const apply = (trooper: number, damage: number): void => {
            const before = this.getTrooperDamage(trooper);
            this.setTrooperDamage(trooper, before + damage);
            const taken = this.getTrooperDamage(trooper) - before;
            const wasted = damage - taken;
            log.push(`Trooper ${trooper + 1} takes ${taken}${wasted > 0 ? ` (${wasted} wasted)` : ""}${this.isTrooperActive(trooper) ? `: ${this.getTrooperCapacity() - this.getTrooperDamage(trooper)} left` : ": destroyed"}`);
        };
        for (const grouping of groupings.slice(0, 40)) {
            if (this.isDestroyed()) break;
            const damage = adjust(grouping);
            if (damage !== savedNumber(grouping, 0, 0, 999)) log.push(`${this._armor.name} armor: ${grouping} becomes ${damage}`);
            if (damage <= 0) continue;
            if (areaEffect) {
                for (let trooper = 0; trooper < this._squadSize; trooper++) if (this.isTrooperActive(trooper)) apply(trooper, damage);
                continue;
            }
            let trooper = -1;
            for (let attempt = 0; attempt < 200 && trooper < 0; attempt++) {
                const result = Math.round(roll()) - 1;
                if (this.isTrooperActive(result)) trooper = result;
            }
            // A roller that never finds an active trooper still has to hit one.
            if (trooper < 0) trooper = Array.from({ length: this._squadSize }, (_unused, index) => index).find((index) => this.isTrooperActive(index)) ?? 0;
            apply(trooper, damage);
        }
        if (this.isDestroyed()) log.push("The squad is destroyed");
        return log;
    }

    public hasDetachableMissiles(): boolean { return this._items.some((entry) => entry.detachable); }
    public hasWeaponPacks(): boolean { return this._items.some((entry) => entry.dwp); }
    public setMissilesJettisoned(value: boolean): void { if (value) this._inPlay.missilesJettisoned = true; else delete this._inPlay.missilesJettisoned; }
    public setPacksJettisoned(value: boolean): void { if (value) this._inPlay.packsJettisoned = true; else delete this._inPlay.packsJettisoned; }
    public carriesMissilePacks(): boolean { return this.hasDetachableMissiles() && !this._inPlay.missilesJettisoned; }
    public carriesWeaponPacks(): boolean { return this.hasWeaponPacks() && !this._inPlay.packsJettisoned; }

    /** Movement as the squad stands: weapon packs slow it and stop it jumping (TO:AUE pp.98-99), as missile packs stop an Inner Sphere suit jumping (TM p.257). */
    public getPlayMovement(): { ground: number; jump: number; text: string; notes: string[] } {
        const notes: string[] = [];
        let ground = this.getTotalGroundMP();
        let jump = this.getJumpMP();
        if (this.carriesWeaponPacks()) {
            const heavy = this._weightClass.tag === "heavy" || this._weightClass.tag === "assault";
            ground = Math.max(1, ground - (heavy ? 2 : 3));
            jump = 0;
            notes.push(`Carrying detachable weapon packs: -${heavy ? 2 : 3} Ground MP and no jumping (TO:AUE pp.98-99).`);
        }
        if (!this.isClan() && this.carriesMissilePacks() && jump > 0) {
            jump = 0;
            notes.push("An Inner Sphere suit may not jump until its detachable missile packs are jettisoned (TM p.257).");
        }
        const parts = [`Ground ${ground}`];
        if (jump > 0) parts.push(`Jump ${jump}`);
        if (this._motive === "vtol") parts.push(`VTOL ${this._motiveMP}`);
        if (this._motive === "umu") parts.push(`UMU ${this._motiveMP}`);
        return { ground, jump, text: parts.join(" / "), notes };
    }

    /** Why the squad may not make Anti-'Mech attacks right now; empty when it may. */
    public getAntiMechBar(): string {
        const capabilities = this.getCapabilities();
        if (!capabilities.swarm && !capabilities.leg) return "This suit makes no Anti-'Mech attacks (TM p.167).";
        const bodyLauncher = this._items.some((entry) => entry.location === "body" && !!findBattleArmorEquipment(entry.tag)?.tubes);
        if (!this.isClan() && bodyLauncher && !this._inPlay.missilesJettisoned) return "Inner Sphere battle armor with body-mounted missile launchers makes no Anti-'Mech attacks until it jettisons them (TW p.220).";
        return "";
    }
    /** Leg Attacks Table modifier for the troopers active; null when no attack is possible (TW p.221). */
    public getLegAttackModifier(): number | null {
        return this.getCapabilities().leg && !this.getAntiMechBar() ? BATTLE_ARMOR_LEG_ATTACK_MODIFIERS[this.getActiveTroopers()] ?? null : null;
    }
    /** Swarm Attacks Table modifier for the troopers active, with -1 for magnetic claws (TW pp.220-221). */
    public getSwarmAttackModifier(): number | null {
        if (!this.getCapabilities().swarm || this.getAntiMechBar()) return null;
        const base = BATTLE_ARMOR_SWARM_ATTACK_MODIFIERS[this.getActiveTroopers()] ?? null;
        if (base === null) return null;
        const magnets = !this.isQuad() && (["la", "ra"] as BattleArmorArm[]).some((arm) => this.getManipulator(arm).tag.includes("magnets"));
        return base + (magnets ? -1 : 0);
    }
    private _vibroClaws(): number {
        return this.isQuad() ? 0 : (["la", "ra"] as BattleArmorArm[]).filter((arm) => this.getManipulator(arm).tag.includes("vibro")).length;
    }
    /** Damage added to a Leg or Swarm attack by a myomer booster: 2 for each active trooper (TO:AUE pp.98-99). */
    public getAntiMechBonusDamage(): number {
        return this._items.some((entry) => findBattleArmorEquipment(entry.tag)?.groundBonus) ? 2 * this.getActiveTroopers() : 0;
    }
    /** Leg attack damage: 4 points, 1 more for each vibro-claw (TW p.220), and a myomer booster's bonus. */
    public getLegAttackDamage(): number { return 4 + this._vibroClaws() + this.getAntiMechBonusDamage(); }

    // Mechanized battle armor (Total Warfare pp.226-227)

    public getRiding(): { uuid: string; kind: BattleArmorCarrierKind } | null { return this._inPlay.riding ?? null; }
    /** Mounts the squad on a roster unit; an empty id dismounts it. Only a suit that can ride may mount (TM p.167). */
    public setRiding(uuid: string, kind: BattleArmorCarrierKind = "mech"): boolean {
        if (!uuid) {
            delete this._inPlay.riding;
            return true;
        }
        if (!this.getCapabilities().mechanized) return false;
        this._inPlay.riding = { uuid, kind };
        return true;
    }
    /** Does the squad need magnetic clamps to ride a unit that is not an Omni? (TW p.227) */
    public hasMagneticClamps(): boolean { return this._hasItem("Magnetic Clamps"); }
    public getTransportPosition(trooper: number, kind: BattleArmorCarrierKind): string { return BATTLE_ARMOR_TRANSPORT_POSITIONS[trooper]?.[kind] ?? ""; }
    /** The carrier's locations with an active trooper on them. */
    public getOccupiedPositions(kind: BattleArmorCarrierKind): string[] {
        const positions: string[] = [];
        for (let trooper = 0; trooper < this._squadSize; trooper++) {
            const position = this.getTransportPosition(trooper, kind);
            if (this.isTrooperActive(trooper) && position && !positions.includes(position)) positions.push(position);
        }
        return positions;
    }
    /**
     * A hit on the carrier in a location a trooper rides: on 1D6 of 5-6 the trooper takes the damage before the
     * carrier does, and what is left once the trooper is destroyed goes on to the location. With more than one
     * trooper in the location, each is rolled for in turn (TW p.227). Returns what the carrier takes.
     */
    public resolveCarrierHit(position: string, damage: number, roll: () => number = rollD6): { log: string[]; remaining: number } {
        const log: string[] = [];
        let remaining = savedNumber(damage, 0, 0, 999);
        const kind = this._inPlay.riding?.kind ?? "mech";
        for (let trooper = 0; trooper < this._squadSize && remaining > 0; trooper++) {
            if (!this.isTrooperActive(trooper) || this.getTransportPosition(trooper, kind) !== position) continue;
            const result = Math.round(roll());
            if (result < 5) {
                log.push(`Trooper ${trooper + 1} (${position}): rolled ${result}, takes no damage`);
                continue;
            }
            const before = this.getTrooperDamage(trooper);
            this.setTrooperDamage(trooper, before + remaining);
            const taken = this.getTrooperDamage(trooper) - before;
            remaining -= taken;
            log.push(`Trooper ${trooper + 1} (${position}): rolled ${result}, takes ${taken}${this.isTrooperActive(trooper) ? "" : " and is destroyed"}`);
        }
        log.push(`The carrier takes ${remaining} in the ${position}`);
        return { log, remaining };
    }

    // Alpha Strike conversion (Alpha Strike Companion pp.92-141)

    /**
     * The converted Alpha Strike stats of the squad. The conversion follows the Alpha Strike Companion; the Point
     * Value is worked out the way the Master Unit List's battle armor cards are: no rounding of the Offensive
     * Value, Defense Factor steps of 0.1 (to a modifier of 2) and 0.25, +1 each for battle armor, jumping or VTOL
     * movement and stealth armor, and a mimetic or camo system counted as a movement modifier of 3 or 2.
     */
    public getAlphaStrikeStats(): IBattleArmorAlphaStrikeStats {
        const log: string[] = [];
        const troopers = this._squadSize;
        const specials: string[] = [];
        const add = (code: string): void => { if (!specials.includes(code)) specials.push(code); };

        // Move: the faster of ground and jumping movement at 2 inches a MP; detachable packs are ignored (ASC p.94).
        const ground = this.getTotalGroundMP();
        const jump = this.getJumpMP();
        let mp = ground;
        let code = "f";
        if (jump > 0 && jump >= ground) { mp = jump; code = "j"; }
        if (this._motive === "vtol" && this._motiveMP > mp) { mp = this._motiveMP; code = "v"; }
        let move = `${mp * 2}"${code}`;
        let movement = mp * 2;
        if (this._motive === "umu") {
            move += `/${this._motiveMP * 2}"s`;
            movement = Math.max(movement, this._motiveMP * 2);
            add("UMU");
        }
        log.push(`Move: ${mp} MP x 2 = ${move}`);

        // Armor: every trooper's armor, without the trooper, over 30 (ASC p.95); Structure is 2 (ASC p.99).
        const armorFactor = this._armorPoints * troopers;
        const special = this._armorPoints > 0 ? this._armor.tag : "";
        // The Master Unit List's cards give battle armor in reactive or reflective armor the special ability
        // without the 0.75 armor multiplier ASC p.97 applies to larger units; they are followed here.
        if (special === "ba-laser-reflective" || special === "ba-reactive") add(special === "ba-reactive" ? "RCA" : "RFA");
        const armor = Math.round(armorFactor / 30 + 1e-9);
        const structure = 2;
        log.push(`Armor: ${troopers} troopers x ${this._armorPoints} points = ${armorFactor}; / 30 = ${(armorFactor / 30).toFixed(2)}, rounded to ${armor}. Structure: ${structure}`);
        if (special.startsWith("ba-stealth")) add("STL");
        if (special === "ba-mimetic") add("MAS");
        if (special === "ba-fire-resistant") add("FR");

        // Damage: one suit's weapons, times the Troop Factor + 0.5 (ASC pp.102-103).
        const factor = (TROOP_FACTORS[Math.min(troopers, 6)] ?? 0) + 0.5;
        const suit = { short: 0, medium: 0, long: 0 };
        const squad = { short: 0, medium: 0, long: 0 };
        const heat = [0, 0, 0];
        let indirect = 0;
        const flak = [0, 0, 0];
        // Counted abilities: on every suit, and on each trooper's own.
        const counted = new Map<string, number[]>();
        const perSuit = (ability: string): number => {
            const counts = counted.get(ability) ?? [0];
            return counts[0] + Math.max(0, ...counts.slice(1).map((count) => count ?? 0));
        };
        const inUnit = (ability: string): number => {
            const counts = counted.get(ability) ?? [0];
            return counts[0] * troopers + counts.slice(1).reduce((sum, count) => sum + (count ?? 0), 0);
        };
        for (const entry of this._items) {
            const equipment = findBattleArmorEquipment(entry.tag);
            if (!equipment) continue;
            for (const ability of (equipment.alphaStrikeSpecial ?? "").split(",").filter((item) => item)) {
                if (["MDS", "BTAS", "BOMB", "RSD"].includes(ability)) {
                    const counts = counted.get(ability) ?? [0];
                    const at = entry.trooper ?? 0;
                    counts[at] = (counts[at] ?? 0) + 1;
                    for (let index = 0; index < counts.length; index++) counts[index] = counts[index] ?? 0;
                    counted.set(ability, counts);
                } else add(ability);
            }
            const values = equipment.alphaStrike;
            if (!values) continue;
            // One-shot launchers convert at a tenth; other missile launchers with under 10 shots at three quarters (ASC p.101).
            let multiplier = 1;
            if (this.isOneShot(entry) && equipment.oneShot !== "always") multiplier = 0.1;
            else if (equipment.kind === "missile" && equipment.oneShot !== "always" && this.getItemShots(entry) < 10) multiplier = 0.75;
            // A weapon one trooper carries, like the squad support weapon, is in the squad once.
            const once = !!entry.squadSupport || !!entry.trooper;
            const into = once ? squad : suit;
            into.short += values.short * multiplier;
            into.medium += values.medium * multiplier;
            into.long += values.long * multiplier;
            const share = once ? 1 : factor;
            if (values.heat) values.heat.forEach((points, range) => { heat[range] += points * share; });
            // Indirect fire is rated by the Long range value of the weapons that have it (ASC p.125).
            if (values.indirect) indirect += values.long * multiplier * share;
            if (values.flak) [values.short, values.medium, values.long].forEach((points, range) => { flak[range] += points * multiplier * share; });
        }
        const glove = !this.isQuad() && (["la", "ra"] as BattleArmorArm[]).some((arm) => this.getManipulator(arm).kind === "glove");
        const antiPersonnel = (this._apMounts.length + (glove ? 1 : 0)) * 0.05;
        suit.short += antiPersonnel;
        const vibro = this._vibroClaws();
        const total = {
            short: suit.short * factor + squad.short + vibro,
            medium: suit.medium * factor + squad.medium,
            long: suit.long * factor + squad.long,
        };
        const value = (damage: number): IBattleArmorASDamageValue =>
            damage <= 1e-9 ? { damage: 0, minimal: false } : damage < 0.5 ? { damage: 0, minimal: true } : { damage: Math.ceil(damage - 1e-9), minimal: false };
        const damageValues = { short: value(total.short), medium: value(total.medium), long: value(total.long) };
        log.push(`Damage of one suit: ${suit.short.toFixed(3)} / ${suit.medium.toFixed(3)} / ${suit.long.toFixed(3)}${antiPersonnel > 0 ? ` (with ${antiPersonnel.toFixed(2)} for anti-personnel weapons)` : ""}`);
        log.push(`x ${factor} (Troop Factor for ${troopers} + 0.5)${squad.short + squad.medium + squad.long > 0 ? `, + weapons the squad has only one of (${squad.short.toFixed(2)} / ${squad.medium.toFixed(2)} / ${squad.long.toFixed(2)})` : ""}${vibro > 0 ? `, + ${vibro} at Short range for vibro-claws` : ""} = ${total.short.toFixed(2)} / ${total.medium.toFixed(2)} / ${total.long.toFixed(2)}: ${formatBattleArmorASDamage(damageValues.short)}/${formatBattleArmorASDamage(damageValues.medium)}/${formatBattleArmorASDamage(damageValues.long)}`);

        // Special abilities (ASC pp.117-133).
        const capabilities = this.getCapabilities();
        if (capabilities.swarm || capabilities.leg) add("AM");
        add(`CAR${troopers}`);
        if (specials.includes("XMEC")) { /* magnetic clamps: XMEC in place of MEC */ } else if (capabilities.mechanized) add("MEC");
        if (!this.isQuad() && (["la", "ra"] as BattleArmorArm[]).some((arm) => this.getManipulator(arm).tag === "basic-mine-clearance")) add("MSW");
        // Heat Values of 5 to 10 at a range bracket rate 1, 11 or more rate 2 (ASC p.125).
        const heatRatings = heat.map((points) => (points >= 11 ? 2 : points >= 5 ? 1 : 0));
        const heatValue = Math.max(...heatRatings);
        if (heatValue > 0) add(`HT${heatRatings.map((rating) => rating || "-").join("/")}`);
        // Special ability values round normally; under a half is minimal damage (ASC pp.124-125).
        const rated = (damage: number): IBattleArmorASDamageValue =>
            damage <= 1e-9 ? { damage: 0, minimal: false } : damage < 0.5 ? { damage: 0, minimal: true } : { damage: Math.round(damage + 1e-9), minimal: false };
        const indirectValue = rated(indirect);
        if (indirect > 1e-9) add(`IF${formatBattleArmorASDamage(indirectValue)}`);
        if (flak.some((points) => points >= 0.5)) add(`FLK${flak.map((points) => (points >= 0.5 ? Math.round(points + 1e-9) : "-")).join("/")}`);
        // Mine dispensers and remote sensor dispensers are counted on one suit; tasers over the whole unit (ASC pp.127, 130, 132).
        const mines = perSuit("MDS");
        if (mines > 0) add(`MDS${mines}`);
        const tasers = inUnit("BTAS");
        if (tasers > 0) add(`BTAS${tasers}`);
        const sensors = perSuit("RSD");
        if (sensors > 0) add(`RSD${sensors}`);
        const bombs = Math.round(inUnit("BOMB") / 5 + 1e-9);
        if (bombs > 0) add(`BOMB${bombs}`);
        // Recon: an active probe, a remote sensor dispenser or improved sensors (ASC p.130).
        if (specials.includes("LPRB") || sensors > 0 || this._hasItem("Improved Sensors")) add("RCN");
        const artillery = specials.includes("ART-BA");
        if (artillery) specials[specials.indexOf("ART-BA")] = "ARTBA-1";
        specials.sort();

        // Point Value (ASC pp.139-141).
        const points = (item: IBattleArmorASDamageValue): number => item.minimal ? 0.5 : item.damage;
        const short = points(damageValues.short);
        const medium = points(damageValues.medium);
        const long = points(damageValues.long);
        let offensive = short + medium * 2 + long;
        const offensiveParts: string[] = [`${short} + 2 x ${medium} + ${long}`];
        const addOffensive = (label: string, amount: number): void => { if (amount > 0) { offensive += amount; offensiveParts.push(`${amount} (${label})`); } };
        addOffensive("HT", heatValue > 0 ? heatValue + (heatRatings[1] > 0 ? 0.5 : 0) : 0);
        addOffensive("IF", indirect > 1e-9 ? points(indirectValue) : 0);
        addOffensive("CNARC", specials.includes("CNARC") ? 0.5 : 0);
        addOffensive("LTAG", specials.includes("LTAG") ? 0.25 : 0);
        addOffensive("MDS", mines);
        addOffensive("BTAS", tasers * 0.25);
        addOffensive("ARTBA, 2 damage x 4", artillery ? 8 : 0);
        const blanket = specials.some((code) => code === "C3S" || code === "C3I") ? 1.1 : 1;
        offensive = Math.round(offensive * blanket * 1000) / 1000;
        log.push(`Offensive Value: ${offensiveParts.join(" + ")}${blanket > 1 ? `, x ${blanket} (C3)` : ""} = ${offensive}`);

        const jumps = code === "j";
        let targetMovement = 0;
        if (movement >= 35) targetMovement = 5;
        else if (movement >= 19) targetMovement = 4;
        else if (movement >= 13) targetMovement = 3;
        else if (movement >= 9) targetMovement = 2;
        else if (movement >= 5) targetMovement = 1;
        const stealth = specials.includes("STL");
        // A mimetic system counts as a movement modifier of 3, a camo system as 2, when the suit's own is lower.
        const concealed = specials.includes("MAS") ? 3 : specials.includes("LMAS") ? 2 : 0;
        const defenseModifier = Math.max(targetMovement + (jumps || code === "v" ? 1 : 0), concealed) + 1 + (stealth ? 1 : 0);
        const defenseFactor = 1 + (defenseModifier <= 2 ? 0.1 : 0.25) * defenseModifier;
        const interaction = roundToHalf((armor * 2 + structure * 2) * defenseFactor);
        let defensive = movement / 8 + (jumps ? 0.5 : 0);
        const defensiveParts: string[] = [`${movement} / 8${jumps ? " + 0.5 (jump)" : ""} = ${defensive}`];
        if (specials.includes("FR")) { defensive += 0.5; defensiveParts.push("0.5 (FR)"); }
        if (specials.includes("RCA") && armor >= 3) { defensive += Math.floor(armor / 3); defensiveParts.push(`${Math.floor(armor / 3)} (RCA)`); }
        defensive += interaction;
        defensiveParts.push(`(Armor ${armor} x 2 + Structure ${structure} x 2) x ${defenseFactor.toFixed(2)} = ${interaction}`);
        log.push(`Defensive Value: ${defensiveParts.join(" + ")} = ${defensive}`);

        let subTotal = offensive + defensive;
        let agile = 0;
        if (targetMovement > 1) {
            if (medium > 0) agile = (targetMovement - 1) * medium;
            else if (targetMovement >= 3) agile = (targetMovement - 2) * short;
        }
        agile = roundToHalf(agile);
        if (agile > 0) log.push(`Agile: + ${agile}`);
        subTotal += agile;
        let force = 0;
        if (specials.includes("LECM")) force += 0.5;
        if (specials.includes("AECM")) force += 3;
        if (specials.includes("LPRB")) force += 1;
        if (specials.includes("RCN")) force += 2;
        for (const code of specials) if (/^MHQ\d+$/.test(code)) force += Number(code.slice(3));
        if (force > 0) log.push(`Force bonuses (ECM, probe, Recon, MHQ): + ${force}`);
        subTotal += force;
        const pointValue = Math.max(1, Math.round(subTotal + 1e-9));
        log.push(`Point Value: ${subTotal}, rounded to ${pointValue}`);
        if (bombs > 0) log.push("The Alpha Strike Companion's factor tables give no value for BOMB on a ground unit; none is added.");

        return { type: "BA", size: 1, move, movement, armor, structure, damageValues, specialAbilities: specials, pointValue, calcLog: log };
    }

    /** The converted Alpha Strike card, built the same way as a Master Unit List record. */
    public getAlphaStrikeUnit(): AlphaStrikeUnit {
        const stats = this.getAlphaStrikeStats();
        const damage = stats.damageValues;
        const record = {
            Id: 0,
            Name: this.getDisplayName(),
            Class: "Battle Armor",
            Variant: "",
            Tonnage: Math.ceil(this._weightClass.maxWeight / 1000),
            Cost: this.getCBillCost(),
            BattleValue: this.getBattleValue(),
            BFType: stats.type,
            BFSize: stats.size,
            BFMove: stats.move,
            BFTMM: 0,
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
            Technology: { Id: 0, Name: this._mixedTech ? "Mixed" : techName(this._techBase), Image: null, SortOrder: 0 },
            Type: { Id: 22, Name: "Battle Armor", Image: null, SortOrder: 0 },
        } as unknown as IASMULUnit;
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        unit.rulesLevel = Math.max(2, this.getRequiredRulesLevel());
        return unit;
    }

    // Saving and loading

    /** Brings every choice back inside what the chassis allows. */
    private _clamp(): void {
        if (this.isQuad() && this._weightClass.quadSlots === null) this._bodyType = "humanoid";
        this.setGroundMP(this._groundMP);
        if (this._motive !== "none" && !this.setMotive(this._motive, this._motiveMP)) this.setMotive("none");
        if (this.getArmorKgPerPoint() === null) this._armor = battleArmorArmorTypes.find((armor) => this.getArmorKgPerPoint(armor) !== null) ?? battleArmorArmorTypes[0];
        this.setArmorPoints(this._armorPoints);
        if (!this.isQuad()) this._turret = null;
        const locations = this.getLocations();
        const fallback: BattleArmorLocation = "body";
        this._baseItems.forEach((entry) => {
            if (!locations.includes(entry.location)) entry.location = fallback;
            if (this.isQuad()) { delete entry.modular; delete entry.squadSupport; }
            if (entry.location === "turret") delete entry.dwp;
        });
        this.setSquadSize(this._squadSize);
        this._apMounts.forEach((mount) => { if (!locations.includes(mount.location) || mount.location === "turret") mount.location = fallback; });
        if (this.isQuad()) this._arms = { la: defaultArm(), ra: defaultArm() };
    }

    public export(noInPlayVariables: boolean = false): IBattleArmorExport {
        const turret = this.getTurret();
        const inPlay: IBattleArmorInPlay | undefined = noInPlayVariables || !(this.isDamaged() || this._inPlay.missilesJettisoned || this._inPlay.packsJettisoned || this._inPlay.riding) ? undefined : {
            damage: Array.from({ length: this._squadSize }, (_unused, trooper) => this.getTrooperDamage(trooper)),
            ...(this._inPlay.missilesJettisoned ? { missilesJettisoned: true } : {}),
            ...(this._inPlay.packsJettisoned ? { packsJettisoned: true } : {}),
            ...(this._inPlay.riding ? { riding: { ...this._inPlay.riding } } : {}),
        };
        return {
            ...(inPlay ? { inPlay } : {}),
            uuid: this._uuid,
            lastUpdated: this.lastUpdated.toISOString(),
            name: this._name,
            techBase: this._techBase,
            ...(this._mixedTech ? { mixedTech: true } : {}),
            ...(this._mixedTech && this._armorBase() !== this._techBase ? { armorTechBase: this._armorBase() } : {}),
            weightClass: this._weightClass.tag,
            bodyType: this._bodyType,
            ...(this.usesExoskeletonChassis() ? { exoskeletonChassis: true } : {}),
            groundMP: this._groundMP,
            motive: this._motive,
            motiveMP: this.getMotiveMP(),
            arms: { la: { ...this._arms.la }, ra: { ...this._arms.ra } },
            armor: this._armor.tag,
            armorPoints: this._armorPoints,
            items: this._baseItems.map((entry) => ({ ...entry })),
            apMounts: this._apMounts.map((mount) => ({ ...mount })),
            ...(turret ? { turret: { ...turret } } : {}),
            squadSize: this._squadSize,
            gunnery: this._gunnery,
            antiMech: this._antiMech,
            era: this._era.tag,
            ...(this._loadouts.length > 0 ? { loadouts: this._loadouts.map((loadout) => ({ name: loadout.name, weapons: { ...loadout.weapons }, manipulators: { ...loadout.manipulators } })) } : {}),
            ...(this._loadouts[this._activeLoadout] ? { activeLoadout: this._activeLoadout } : {}),
        };
    }

    public exportJSON(): string { return JSON.stringify(this.export()); }

    /** Reads a saved suit one field at a time; anything unusable falls back to a default and is reported. */
    public importJSON(json: string): boolean {
        this._importIssues = [];
        let raw: unknown;
        try {
            raw = JSON.parse(json);
        } catch {
            this._importIssues.push("The saved battle armor design could not be read");
            return false;
        }
        if (!isPlainObject(raw)) {
            this._importIssues.push("The saved battle armor design could not be read");
            return false;
        }

        const uuid = savedString(raw.uuid);
        if (/^[0-9a-zA-Z-]{8,64}$/.test(uuid)) this._uuid = uuid;
        const updated = new Date(savedString(raw.lastUpdated));
        if (!Number.isNaN(updated.getTime())) this.lastUpdated = updated;
        this.setName(savedString(raw.name));

        this._techBase = raw.techBase === "clan" ? "clan" : "is";
        this._mixedTech = raw.mixedTech === true;
        this._armorTechBase = null;
        this._view = 0;
        this._era = latestEra(this._eraTech());
        if (raw.era !== undefined && !this.setEra(savedString(raw.era))) this._importIssues.push(`Unknown era '${savedString(raw.era).slice(0, 60)}': using ${this._era.name}`);
        this._loadouts = [];
        this._activeLoadout = -1;
        const weightClass = battleArmorWeightClasses.find((entry) => entry.tag === raw.weightClass);
        if (!weightClass && raw.weightClass !== undefined) this._importIssues.push(`Unknown weight class '${savedString(raw.weightClass).slice(0, 60)}': using Medium`);
        this._weightClass = weightClass ?? findBattleArmorWeightClass("medium");
        this._bodyType = raw.bodyType === "quad" && this._weightClass.quadSlots !== null ? "quad" : "humanoid";
        if (raw.bodyType === "quad" && this._bodyType !== "quad") this._importIssues.push("Exoskeletons and PA(L) suits are humanoid: body type set to humanoid");
        this._exoskeletonChassis = raw.exoskeletonChassis === true;

        this._groundMP = savedNumber(raw.groundMP, this.getFreeGroundMP(), this.getFreeGroundMP(), this.getMaxGroundMP());
        this._motive = "none";
        this._motiveMP = 0;
        const motive = savedString(raw.motive);
        if (motive === "jump" || motive === "vtol" || motive === "umu") {
            if (!this.setMotive(motive, savedNumber(raw.motiveMP, 1, 1, 10))) this._importIssues.push(`This suit cannot fit ${motive === "jump" ? "jump jets" : motive.toUpperCase()}: removed`);
        }

        this._arms = { la: defaultArm(), ra: defaultArm() };
        const arms = isPlainObject(raw.arms) ? raw.arms : {};
        for (const arm of ["la", "ra"] as BattleArmorArm[]) {
            const saved = arms[arm];
            if (!isPlainObject(saved) || this.isQuad()) continue;
            this._arms[arm] = {
                manipulator: findBattleArmorManipulator(savedString(saved.manipulator)).tag,
                adaptor: saved.adaptor === true,
                cargoHalfTons: savedNumber(saved.cargoHalfTons, 1, 1, BATTLE_ARMOR_MAX_CARGO_HALF_TONS),
            };
        }

        this._armor = battleArmorArmorTypes.find((armor) => this.getArmorKgPerPoint(armor) !== null) ?? battleArmorArmorTypes[0];
        const armorTag = savedString(raw.armor);
        if (armorTag && !this.setArmor(armorTag, raw.armorTechBase === "clan" || raw.armorTechBase === "is" ? raw.armorTechBase : undefined)) this._importIssues.push(`Armor '${armorTag.slice(0, 60)}' cannot be used: using ${this._armor.name}`);
        this._armorPoints = savedNumber(raw.armorPoints, 0, 0, this.getMaxArmorPoints());

        this._turret = null;
        if (isPlainObject(raw.turret) && this.isQuad()) this.setTurret(savedNumber(raw.turret.size, 1, 1, BATTLE_ARMOR_TURRET.maxCapacity), raw.turret.configurable === true);

        this._baseItems = [];
        const items = Array.isArray(raw.items) ? raw.items.slice(0, MAX_BATTLE_ARMOR_ITEMS) : [];
        for (const saved of items) {
            if (!isPlainObject(saved)) continue;
            const tag = savedString(saved.tag);
            const location = LOCATIONS.find((entry) => entry === saved.location) ?? "body";
            const equipment = findBattleArmorEquipment(tag);
            if (!equipment || !this._offers(equipment.techBase) || !this.addItem(tag, this.getLocations().includes(location) ? location : "body")) {
                this._importIssues.push(`Equipment '${tag.slice(0, 60)}' cannot be mounted: removed`);
                continue;
            }
            this.updateItem(this._baseItems.length - 1, {
                shots: typeof saved.shots === "number" ? saved.shots : undefined,
                oneShot: saved.oneShot === true,
                detachable: saved.detachable === true,
                modular: saved.modular === true,
                squadSupport: saved.squadSupport === true,
                kg: typeof saved.kg === "number" ? saved.kg : undefined,
                dwp: saved.dwp === true,
                trooper: typeof saved.trooper === "number" ? saved.trooper : undefined,
                mine: typeof saved.mine === "string" ? saved.mine : undefined,
            });
        }

        this._apMounts = [];
        const mounts = Array.isArray(raw.apMounts) ? raw.apMounts.slice(0, 6) : [];
        for (const saved of mounts) {
            if (!isPlainObject(saved)) continue;
            const location = LOCATIONS.find((entry) => entry === saved.location) ?? "body";
            this.addAPMount(this.getLocations().includes(location) && location !== "turret" ? location : "body", savedString(saved.weapon));
        }

        this._squadSize = savedNumber(raw.squadSize, this.isClan() ? 5 : 4, 1, BATTLE_ARMOR_MAX_SQUAD);
        this._gunnery = savedNumber(raw.gunnery, 4, 0, 8);
        this._antiMech = savedNumber(raw.antiMech, 5, 0, 8);
        this._clamp();

        const loadouts = Array.isArray(raw.loadouts) ? raw.loadouts.slice(0, MAX_BATTLE_ARMOR_LOADOUTS) : [];
        for (const saved of loadouts) {
            if (!isPlainObject(saved) || !this.addLoadout(savedString(saved.name))) continue;
            const index = this._loadouts.length - 1;
            const weapons = isPlainObject(saved.weapons) ? saved.weapons : {};
            for (const [key, swap] of Object.entries(weapons)) {
                if (!isPlainObject(swap) || !/^\d{1,2}$/.test(key)) continue;
                if (!this.setLoadoutWeapon(index, Number(key), savedString(swap.tag), typeof swap.shots === "number" ? swap.shots : undefined, swap.oneShot === true)) {
                    this._importIssues.push(`Loadout '${this._loadouts[index].name}': '${savedString(swap.tag).slice(0, 60)}' cannot go in that mount: removed`);
                }
            }
            const manipulators = isPlainObject(saved.manipulators) ? saved.manipulators : {};
            for (const arm of ["la", "ra"] as BattleArmorArm[]) {
                if (typeof manipulators[arm] === "string") this.setLoadoutManipulator(index, arm, savedString(manipulators[arm]));
            }
        }
        this._activeLoadout = savedNumber(raw.activeLoadout, -1, -1, this._loadouts.length - 1);

        this._inPlay = { damage: [] };
        if (isPlainObject(raw.inPlay)) {
            const damage = Array.isArray(raw.inPlay.damage) ? raw.inPlay.damage : [];
            for (let trooper = 0; trooper < this._squadSize; trooper++) this.setTrooperDamage(trooper, savedNumber(damage[trooper], 0, 0, 99));
            if (raw.inPlay.missilesJettisoned === true) this._inPlay.missilesJettisoned = true;
            if (raw.inPlay.packsJettisoned === true) this._inPlay.packsJettisoned = true;
            const riding = raw.inPlay.riding;
            if (isPlainObject(riding) && /^[0-9a-zA-Z-]{8,64}$/.test(savedString(riding.uuid))) this.setRiding(savedString(riding.uuid), riding.kind === "vehicle" ? "vehicle" : "mech");
        }
        return true;
    }
}
