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
import { IBattleArmorEquipment, findBattleArmorEquipment, getBattleArmorEquipmentFor } from "../data/battle-armor-equipment";
import { IBattleArmorArmorType } from "../data/data-interfaces";
import { IInfantryWeapon, findInfantryWeapon, infantryWeapons } from "../data/infantry-weapons";
import { getSkillMultiplier } from "../data/skill-multipliers";

// Battle armor construction (TechManual pp.160-173), Battle Value (TM pp.310-311, 316) and cost (TM pp.276, 281, 296-298).

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
}

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
    return { suit: loaded.export(), issues: [...loaded.getImportIssues()] };
};

export default class BattleArmor {
    private _uuid: string = generateUUID();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _techBase: BattleArmorTechBase = "is";
    private _weightClass: IBattleArmorWeightClass = findBattleArmorWeightClass("medium");
    private _bodyType: BattleArmorBodyType = "humanoid";
    private _exoskeletonChassis: boolean = false;
    private _groundMP: number = 1;
    private _motive: BattleArmorMotive = "none";
    private _motiveMP: number = 0;
    private _arms: Record<BattleArmorArm, IBattleArmorArmExport> = { la: defaultArm(), ra: defaultArm() };
    private _armor: IBattleArmorArmorType = battleArmorArmorTypes[0];
    private _armorPoints: number = 0;
    private _items: IBattleArmorMountedItem[] = [];
    private _apMounts: IBattleArmorAPMount[] = [];
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
    public getDisplayName(): string { return this._name.trim() || `${this._weightClass.name} Battle Armor`; }
    public getImportIssues(): string[] { return this._importIssues; }
    /** Standard rules, or Advanced with armor from Tactical Operations. */
    public getRequiredRulesLevel(): number { return this._armorPoints > 0 && this._armor.book !== "TM" ? BATTLE_ARMOR_ADVANCED_RULES_LEVEL : BATTLE_ARMOR_RULES_LEVEL; }

    // Step 1: the chassis (TM pp.162-163)

    public getTechBase(): BattleArmorTechBase { return this._techBase; }
    public isClan(): boolean { return this._techBase === "clan"; }
    public isQuad(): boolean { return this._bodyType === "quad"; }
    public getBodyType(): BattleArmorBodyType { return this._bodyType; }
    public getWeightClass(): IBattleArmorWeightClass { return this._weightClass; }
    public usesExoskeletonChassis(): boolean { return this._exoskeletonChassis && this.canUseExoskeletonChassis(); }
    /** Clan-made industrial exoskeletons may use an Inner Sphere chassis weight (TM p.162). */
    public canUseExoskeletonChassis(): boolean { return this.isClan() && this._weightClass.tag === "pa-l"; }

    public setTechBase(techBase: BattleArmorTechBase): void {
        if (techBase === this._techBase) return;
        this._techBase = techBase;
        // The same item is a different record in the other table; keep what has a counterpart there.
        this._items = this._items.flatMap((entry) => {
            const counterpart = findBattleArmorEquipment(entry.tag.replace(/^(is|clan)-/, `${techBase}-`));
            return counterpart ? [{ ...entry, tag: counterpart.tag }] : [];
        });
        this._squadSize = techBase === "clan" ? 5 : 4;
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
    public getGroundMP(): number { return this._groundMP; }
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
        if (this._motive !== "jump") return 0;
        return this._motiveMP + this._items.reduce((sum, entry) => sum + (findBattleArmorEquipment(entry.tag)?.jumpBonus ?? 0), 0);
    }

    public getMovementText(): string {
        const parts = [`Ground ${this._groundMP}`];
        if (this._motive === "jump") parts.push(`Jump ${this.getJumpMP()}`);
        if (this._motive === "vtol") parts.push(`VTOL ${this._motiveMP}`);
        if (this._motive === "umu") parts.push(`UMU ${this._motiveMP}`);
        return parts.join(" / ");
    }

    // Step 3: manipulators (TM pp.166-167)

    public getArm(arm: BattleArmorArm): IBattleArmorArmExport { return this._arms[arm]; }
    public getManipulator(arm: BattleArmorArm): IBattleArmorManipulator { return findBattleArmorManipulator(this.isQuad() ? "none" : this._arms[arm].manipulator); }

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
    public getArmorKgPerPoint(armor: IBattleArmorArmorType = this._armor): number | null { return armor.kgPerPoint[this._techBase]; }

    public getAvailableArmor(rulesLevel: number = BATTLE_ARMOR_ADVANCED_RULES_LEVEL): IBattleArmorArmorType[] {
        return battleArmorArmorTypes.filter((armor) => this.getArmorKgPerPoint(armor) !== null
            && (armor.book === "TM" || rulesLevel >= BATTLE_ARMOR_ADVANCED_RULES_LEVEL || armor.tag === this._armor.tag));
    }

    public setArmor(tag: string): boolean {
        const armor = battleArmorArmorTypes.find((entry) => entry.tag === tag);
        if (!armor || this.getArmorKgPerPoint(armor) === null) return false;
        this._armor = armor;
        return true;
    }

    public setArmorPoints(points: number): void { this._armorPoints = Math.min(this.getMaxArmorPoints(), Math.max(0, Math.round(points) || 0)); }
    public getArmorWeight(): number { return this._armorPoints * (this.getArmorKgPerPoint() ?? 0); }
    /** Slots the armor takes, wherever on the suit they are found (TM p.168). */
    public getArmorSlots(): number { return this._armorPoints > 0 ? this._armor.slots : 0; }

    // Step 5: weapons, ammunition and other equipment (TM pp.170-171)

    public getItems(): IBattleArmorMountedItem[] { return this._items; }
    public getAPMounts(): IBattleArmorAPMount[] { return this._apMounts; }
    public getTurret(): IBattleArmorTurret | null { return this.isQuad() ? this._turret : null; }
    public getAvailableEquipment(): IBattleArmorEquipment[] { return getBattleArmorEquipmentFor(this._techBase); }

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
        if (!equipment) return 0;
        const oneShot = this.isOneShot(entry) && equipment.oneShot !== "always" && equipment.oneShot ? equipment.oneShot : null;
        const reloads = equipment.kind === "missile" && !this.isOneShot(entry) ? Math.ceil(this.getItemShots(entry) / BATTLE_ARMOR_SHOTS_PER_SLOT) : 0;
        return (oneShot ? oneShot.slots : equipment.slots) + reloads + (entry.modular ? BATTLE_ARMOR_MODULAR_MOUNT.slots : 0);
    }

    /** The weapon with its ammunition, before any mount. */
    private _itemLoadedWeight(entry: IBattleArmorMountedItem): number {
        const equipment = findBattleArmorEquipment(entry.tag);
        if (!equipment) return 0;
        if (equipment.variableWeight) return Math.max(0, entry.kg ?? 0);
        const oneShot = this.isOneShot(entry) && equipment.oneShot !== "always" && equipment.oneShot ? equipment.oneShot : null;
        const ammunition = equipment.kind === "missile" && !this.isOneShot(entry) ? this.getItemShots(entry) * (equipment.ammoKg ?? 0) : 0;
        return (oneShot ? oneShot.kg : equipment.kg) + ammunition;
    }

    public getItemWeight(entry: IBattleArmorMountedItem): number {
        let weight = this._itemLoadedWeight(entry);
        // Every suit carries a share of the squad support weapon, rounded up to the kilogram (TM p.270).
        if (entry.squadSupport) weight = Math.ceil(weight * BATTLE_ARMOR_SQUAD_SUPPORT_SHARE[this._techBase] - 1e-9);
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
    public getUsedSlots(location: BattleArmorLocation): number {
        let used = this._items.filter((entry) => entry.location === location).reduce((sum, entry) => sum + this.getItemSlots(entry), 0);
        used += this._apMounts.filter((mount) => mount.location === location).length * BATTLE_ARMOR_AP_MOUNT.slots;
        if ((location === "la" || location === "ra") && !this.isQuad() && this._arms[location].adaptor) used += BATTLE_ARMOR_ADAPTOR.slots;
        if (location === "body") used += this._turretMount().slots;
        return used;
    }

    public getFreeSlots(location: BattleArmorLocation): number { return this.getSlots(location) - this.getUsedSlots(location); }

    /** Slots left on the suit once the armor's are found; a turret's capacity is for what it mounts, not armor. */
    public getFreeSlotsAfterArmor(): number {
        return this.getLocations().filter((location) => location !== "turret").reduce((sum, location) => sum + Math.max(0, this.getFreeSlots(location)), 0) - this.getArmorSlots();
    }

    public addItem(tag: string, location: BattleArmorLocation): boolean {
        const equipment = findBattleArmorEquipment(tag);
        if (!equipment || equipment.techBase !== this._techBase || this._items.length >= MAX_BATTLE_ARMOR_ITEMS) return false;
        if (!this.getLocations().includes(location)) return false;
        const entry: IBattleArmorMountedItem = { tag, location: equipment.bodyOnly ? "body" : location };
        if (equipment.kind === "missile" && equipment.oneShot !== "always") entry.shots = 1;
        this._items.push(entry);
        return true;
    }

    public removeItem(index: number): void { this._items.splice(index, 1); }

    public updateItem(index: number, change: Partial<IBattleArmorMountedItem>): void {
        const entry = this._items[index];
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
        // One squad support weapon to a suit (TM p.270).
        if (next.squadSupport) this._items.forEach((other, otherIndex) => { if (otherIndex !== index) delete other.squadSupport; });
        this._items[index] = next;
    }

    /** Standard-type conventional infantry weapons an anti-personnel mount may carry (TM p.170). */
    public getAntiPersonnelWeapons(): IInfantryWeapon[] {
        return infantryWeapons.filter((weapon) => weapon.type === "standard" && (weapon.techBase === "both" || weapon.techBase === this._techBase));
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
        if (this._armorPoints > 0) log.push({ label: `${this._armor.name} armor, ${this._armorPoints} points`, kg: this.getArmorWeight() });
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
        if (entry.squadSupport) parts.push("squad support weapon");
        return `${equipment.name}${parts.length ? ` (${parts.join(", ")})` : ""}, ${BATTLE_ARMOR_LOCATION_NAMES[entry.location]}`;
    }

    public getWeight(): number { return round2(this.getWeightLog().reduce((sum, line) => sum + line.kg, 0)); }
    public getRemainingWeight(): number { return round2(this._weightClass.maxWeight - this.getWeight()); }

    // Legality

    private _countsAsAntiMechWeapon(entry: IBattleArmorMountedItem): boolean {
        const equipment = findBattleArmorEquipment(entry.tag);
        return !!equipment && equipment.kind !== "equipment";
    }

    public getIssues(): string[] {
        const issues: string[] = [];
        const weightClass = this._weightClass;
        const weight = this.getWeight();
        if (weight > weightClass.maxWeight) issues.push(`The suit weighs ${weight} kg, over the ${weightClass.maxWeight} kg of the ${weightClass.name} class (TM p.163).`);
        if (this.isQuad() && weightClass.quadSlots === null) issues.push("Exoskeletons and PA(L) suits may only be humanoid (TM p.162).");

        for (const location of this.getLocations()) {
            if (this.getFreeSlots(location) < 0) issues.push(`${BATTLE_ARMOR_LOCATION_NAMES[location]}: ${this.getUsedSlots(location)} slots used of ${this.getSlots(location)} (TM p.163).`);
        }
        if (this.getFreeSlotsAfterArmor() < 0 && this.getArmorSlots() > 0) {
            issues.push(`${this._armor.name} armor needs ${this.getArmorSlots()} weapon slots; the suit has ${this.getFreeSlotsAfterArmor() + this.getArmorSlots()} free (TM p.169).`);
        }
        if (this.getArmorKgPerPoint() === null) issues.push(`${this._armor.name} armor is not made for ${this.isClan() ? "Clan" : "Inner Sphere"} battle armor (TM p.169).`);

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
        if (boosters.length > 0 && this._motive !== "jump") issues.push("A jump booster or partial wing needs jump jets (TM p.165).");
        if (boosters.length > 1) issues.push("A jump booster and a partial wing may not be combined (TM p.165).");
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
        if (this.canUseExoskeletonChassis() && this.usesExoskeletonChassis() && this._motive === "umu") {
            notes.push("TM p.165 allows UMUs on a Clan exoskeleton with an Inner Sphere chassis weight; TM p.270 says such an exoskeleton may not use them. The construction step is followed.");
        }
        return notes;
    }

    // Battle Value (TM pp.310-311)

    private _bestMovement(): { mp: number; modifier: number } {
        const ground = { mp: this._groundMP, modifier: getBattleArmorTargetMovementModifier(this._groundMP) };
        if (this._motive === "none" || this._motive === "umu") {
            const mp = Math.max(this._groundMP, this.getMotiveMP());
            return { mp, modifier: getBattleArmorTargetMovementModifier(mp) };
        }
        // Jumping and VTOL movement add 1 to the target movement modifier.
        const other = this._motive === "jump" ? this.getJumpMP() : this._motiveMP;
        return { mp: Math.max(ground.mp, other), modifier: Math.max(ground.modifier, getBattleArmorTargetMovementModifier(other) + 1) };
    }

    private _itemBattleValue(entry: IBattleArmorMountedItem): number {
        const equipment = findBattleArmorEquipment(entry.tag);
        if (!equipment) return 0;
        const oneShot = this.isOneShot(entry) && equipment.oneShot !== "always";
        const launcherBV = oneShot ? equipment.bvOneShot ?? equipment.bv : equipment.bv;
        const ammunition = equipment.kind === "missile" && !this.isOneShot(entry) ? (this.getItemShots(entry) * (equipment.ammoKg ?? 0) / 1000) * (equipment.ammoBVPerTon ?? 0) : 0;
        return launcherBV + ammunition;
    }

    private _calcBattleValue(): { suit: number; squad: number; log: string[] } {
        const log: string[] = [];
        const armorBV = ["ba-fire-resistant", "ba-laser-reflective", "ba-reactive"].includes(this._armor.tag) ? 3.5 : 2.5;
        let defensive = this._armorPoints * armorBV + 1;
        log.push(`Armor: (${this._armorPoints} points x ${armorBV}) + 1 = ${round2(defensive)}`);
        const defensiveItems = this._items.filter((entry) => findBattleArmorEquipment(entry.tag)?.defensive).length;
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
        const modifier = BATTLE_ARMOR_UNIT_SIZE_BV[this._squadSize] ?? 1;
        log.push(`Battle Value of one suit: ${round2(defensiveRating)} + ${round2(offensiveRating)} = ${round2(suit)}, or ${roundNormally(suit)}`);
        log.push(`${this._squadSize} ${this._squadSize === 1 ? "trooper" : "troopers"}: ${round2(suit)} x ${modifier} = ${roundNormally(suit * modifier)}`);
        return { suit: roundNormally(suit), squad: roundNormally(suit * modifier), log };
    }

    public getSuitBattleValue(): number { return this._calcBattleValue().suit; }
    public getBattleValue(): number { return this._calcBattleValue().squad; }
    public getBattleValueLog(): string[] { return this._calcBattleValue().log; }
    public getSkillMultiplier(edition?: string): number { return getSkillMultiplier(this._gunnery, this._antiMech, "battle-armor", edition) ?? 1; }
    public getSkillAdjustedBattleValue(edition?: string): number { return roundNormally(this.getBattleValue() * this.getSkillMultiplier(edition)); }

    // Cost (TM pp.276, 281, 296-298)

    private _calcCost(): { suit: number; squad: number; log: string[] } {
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
        const suit = Math.round(structural + equipmentCost);
        const squad = Math.round((structural + equipmentCost) * this._squadSize + squadOnly);
        log.push(`One suit: ${suit.toLocaleString("en-US")}; ${this._squadSize} suits${squadOnly > 0 ? ` and the squad support weapon (${squadOnly.toLocaleString("en-US")})` : ""}: ${squad.toLocaleString("en-US")}`);
        return { suit, squad, log };
    }

    public getSuitCost(): number { return this._calcCost().suit; }
    public getCBillCost(): number { return this._calcCost().squad; }
    public getCBillCostLog(): string[] { return this._calcCost().log; }

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
        this._items.forEach((entry) => {
            if (!locations.includes(entry.location)) entry.location = fallback;
            if (this.isQuad()) { delete entry.modular; delete entry.squadSupport; }
        });
        this._apMounts.forEach((mount) => { if (!locations.includes(mount.location) || mount.location === "turret") mount.location = fallback; });
        if (this.isQuad()) this._arms = { la: defaultArm(), ra: defaultArm() };
    }

    public export(): IBattleArmorExport {
        const turret = this.getTurret();
        return {
            uuid: this._uuid,
            lastUpdated: this.lastUpdated.toISOString(),
            name: this._name,
            techBase: this._techBase,
            weightClass: this._weightClass.tag,
            bodyType: this._bodyType,
            ...(this.usesExoskeletonChassis() ? { exoskeletonChassis: true } : {}),
            groundMP: this._groundMP,
            motive: this._motive,
            motiveMP: this.getMotiveMP(),
            arms: { la: { ...this._arms.la }, ra: { ...this._arms.ra } },
            armor: this._armor.tag,
            armorPoints: this._armorPoints,
            items: this._items.map((entry) => ({ ...entry })),
            apMounts: this._apMounts.map((mount) => ({ ...mount })),
            ...(turret ? { turret: { ...turret } } : {}),
            squadSize: this._squadSize,
            gunnery: this._gunnery,
            antiMech: this._antiMech,
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
        if (armorTag && !this.setArmor(armorTag)) this._importIssues.push(`Armor '${armorTag.slice(0, 60)}' cannot be used: using ${this._armor.name}`);
        this._armorPoints = savedNumber(raw.armorPoints, 0, 0, this.getMaxArmorPoints());

        this._turret = null;
        if (isPlainObject(raw.turret) && this.isQuad()) this.setTurret(savedNumber(raw.turret.size, 1, 1, BATTLE_ARMOR_TURRET.maxCapacity), raw.turret.configurable === true);

        this._items = [];
        const items = Array.isArray(raw.items) ? raw.items.slice(0, MAX_BATTLE_ARMOR_ITEMS) : [];
        for (const saved of items) {
            if (!isPlainObject(saved)) continue;
            const tag = savedString(saved.tag);
            const location = LOCATIONS.find((entry) => entry === saved.location) ?? "body";
            const equipment = findBattleArmorEquipment(tag);
            if (!equipment || equipment.techBase !== this._techBase || !this.addItem(tag, this.getLocations().includes(location) ? location : "body")) {
                this._importIssues.push(`Equipment '${tag.slice(0, 60)}' cannot be mounted: removed`);
                continue;
            }
            this.updateItem(this._items.length - 1, {
                shots: typeof saved.shots === "number" ? saved.shots : undefined,
                oneShot: saved.oneShot === true,
                detachable: saved.detachable === true,
                modular: saved.modular === true,
                squadSupport: saved.squadSupport === true,
                kg: typeof saved.kg === "number" ? saved.kg : undefined,
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
        return true;
    }
}
