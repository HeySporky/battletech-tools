import { generateUUID } from "../utils/generateUUID";
import { getSkillMultiplier } from "../data/skill-multipliers";
import Pilot, { IPilot } from "./pilot";
import { AlphaStrikeUnit, IASMULUnit } from "./alpha-strike-unit";
import { mechArmorTypes } from "../data/mech-armor-types";
import { mechEngineOptions } from "../data/mech-engine-options";
import { mechEngineTypes } from "../data/mech-engine-types";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { btTechOptions } from "../data/tech-options";
import { btEraOptions } from "../data/era-options";
import { getVehicleMotiveType, getVehicleSuspensionFactor, vehicleMotiveTypes } from "../data/vehicle-motive-types";
import { getAmmoBattleValuePerTon, getCompatibleAmmo, getEffectiveIntroduction, getEquipmentListByTech, getEquipmentRulesLevel, getWeaponShotsPerTon } from "../data/equipment-registry";
import { isTargetingComputerWeapon } from "../data/variable-equipment";
import { getMovementModifier } from "../utils";
import {
    IArmorType,
    IEngineType,
    IEquipmentItem,
    IEras,
    IHeatSync,
    ITechOptions,
    IVehicleArmorAllocation,
    IVehicleMotiveType,
    IVehicleStructureAllocation,
    VehicleLocation,
} from "../data/data-interfaces";

// Combat Vehicle construction rules (TechManual). Shares the engine/armor/heat sink/equipment
// catalogs with BattleMech - only chassis-specific rules (locations, structure, motive systems)
// are modeled separately here.

export interface IVehicleEquipmentExport {
    tag: string;
    location?: string;
    rear?: boolean;
    uuid?: string;
    currentAmmo?: number;
    selectedAmmoBinUUID?: string;
    currentAdditionalArmor?: number;
}

/** An Alpha Strike damage value: a whole number, or minimal damage (0*). */
export interface IVehicleASDamageValue {
    damage: number;
    minimal: boolean;
}

export interface IVehicleAlphaStrikeStats {
    size: number;
    movement: number;
    movementType: string;
    jumpMovement: number;
    tmm: number;
    damage: { short: number; medium: number; long: number; extreme: number };
    /** The same damage with minimal (0*) flags, as printed on the card. */
    damageValues: { short: IVehicleASDamageValue; medium: IVehicleASDamageValue; long: IVehicleASDamageValue; extreme: IVehicleASDamageValue };
    armor: number;
    structure: number;
    overheat: number;
    pointValue: number;
    specialAbilities: string[];
    calcLog: string;
}

/** Card text for a damage value: 0* for minimal damage. */
export function formatVehicleASDamage(value: IVehicleASDamageValue): string {
    return value.minimal ? "0*" : `${value.damage}`;
}

export type VehicleMovementMode = "stationary" | "cruise" | "flank" | "jump";

/** Motive system damage levels (TW, as implemented by MegaMek Tank.addMovementDamage). */
export interface IVehicleMotiveDamage {
    minor: boolean;
    moderate: boolean;
    heavy: boolean;
    immobilized: boolean;
}

/** Vehicle critical hits (TW, as implemented by MegaMek Tank). */
export interface IVehicleCriticalHits {
    driverHit: boolean;
    commanderHit: boolean;
    crewStunned: boolean;
    crewKilled: boolean;
    engineHit: boolean;
    fuelTankHit: boolean;
    cargoHit: boolean;
    turretJammed: boolean;
    turretLocked: boolean;
    turretDestroyed: boolean;
    sensorHits: number;
    stabilizers: VehicleLocation[];
}

/** Damage and status tracked while a vehicle is in play. */
export interface IVehicleInPlay {
    armorDamage: Partial<Record<VehicleLocation, number>>;
    structureDamage: Partial<Record<VehicleLocation, number>>;
    motiveDamage: IVehicleMotiveDamage;
    criticals: IVehicleCriticalHits;
    jammedWeapons: string[];
    destroyedWeapons: string[];
    movementMode: VehicleMovementMode;
    hexesMoved: number;
}

const newInPlay = (): IVehicleInPlay => ({
    armorDamage: {},
    structureDamage: {},
    motiveDamage: { minor: false, moderate: false, heavy: false, immobilized: false },
    criticals: {
        driverHit: false, commanderHit: false, crewStunned: false, crewKilled: false, engineHit: false,
        fuelTankHit: false, cargoHit: false, turretJammed: false, turretLocked: false, turretDestroyed: false,
        sensorHits: 0, stabilizers: [],
    },
    jammedWeapons: [],
    destroyedWeapons: [],
    movementMode: "stationary",
    hexesMoved: 0,
});

/** A vehicle's sensors are destroyed at 4 hits (as implemented by MegaMek Tank.CRIT_SENSOR). */
export const VEHICLE_MAX_SENSOR_HITS = 4;

export interface IVehicleExport {
    uuid: string;
    lastUpdated: Date;
    name: string;
    model: string;
    nickname: string;
    tonnage: number;
    motiveType: string;
    hasTurret: boolean;
    dualTurret?: boolean;
    jumpMP?: number;
    troopSpace?: number;
    tech: string;
    era: string;
    engineType: string;
    cruiseMP: number;
    armorType: string;
    armorAllocation: IVehicleArmorAllocation;
    structureType: string;
    heatSinkType: string;
    additionalHeatSinks: number;
    equipment: IVehicleEquipmentExport[];
    pilot?: IPilot;
    inPlay?: IVehicleInPlay;
}

// Combat Vehicle internal structure weighs the same 10%/20% of tonnage as 'Mech structure,
// just without the per-location tonnage table (vehicles split points evenly per location instead).
const VEHICLE_STRUCTURE_MULTIPLIERS: Record<string, number> = {
    standard: 0.1,
    reinforced: 0.2,
};

/** A VTOL rotor mounts at most 2 armor points (TM, as implemented by MegaMek TestTank). */
export const VTOL_MAX_ROTOR_ARMOR = 2;

/** Highest engine rating without Large engines (TO:AUE; Experimental rules level here, as for 'Mechs). */
const MAX_STANDARD_ENGINE_RATING = 400;
const MAX_LARGE_ENGINE_RATING = 500;

const emptyArmorAllocation = (): IVehicleArmorAllocation => ({
    front: 0, left: 0, right: 0, rear: 0, turret: 0, rotor: 0,
    frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0, turret2: 0,
});

const LOCATION_NAMES: Record<VehicleLocation, string> = {
    front: "Front",
    left: "Left",
    right: "Right",
    rear: "Rear",
    frontLeft: "Front Left",
    frontRight: "Front Right",
    rearLeft: "Rear Left",
    rearRight: "Rear Right",
    rotor: "Rotor",
    turret: "Turret",
    turret2: "Front Turret",
};

// Free heat sinks from the engine: fusion 10, fission 5, fuel cell 1, ICE none (as implemented by MegaMek Engine).
const FUSION_ENGINE_TAGS = ["standard", "xl", "clan_xl", "light", "compact", "xxl", "clan_xxl", "primitive"];

// Item slots an engine takes in a vehicle (as implemented by MegaMek Tank.getFreeSlots).
const ENGINE_ITEM_SLOTS: Record<string, number> = { light: 1, xl: 2, clan_xl: 1, xxl: 4, clan_xxl: 2, compact: -1 };

/** Vehicular jump jets (TO:AUE p.161 per MegaMek): Advanced; IS prototype 2650, production 3083. */
export const VEHICLE_JUMP_JET_INTRODUCED = 3083;

export default class Vehicle {
    private _uuid: string = generateUUID();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _model: string = "";
    private _nickname: string = "";

    private _tonnage: number = 20;
    private _motiveType: IVehicleMotiveType = vehicleMotiveTypes[0];
    private _hasTurret: boolean = true;
    private _dualTurret: boolean = false;
    private _jumpMP: number = 0;
    private _troopSpace: number = 0;
    private _inPlay: IVehicleInPlay = newInPlay();

    private _tech: ITechOptions = btTechOptions[0];
    private _era: IEras = btEraOptions[0];

    private _engineType: IEngineType = mechEngineTypes[0];
    private _cruiseMP: number = 3;

    private _armorType: IArmorType = mechArmorTypes[0];
    private _armorAllocation: IVehicleArmorAllocation = emptyArmorAllocation();

    private _structureType: string = "standard";

    private _heatSinkType: IHeatSync = mechHeatSinkTypes[0];
    private _additionalHeatSinks: number = 0;

    private _equipmentList: IEquipmentItem[] = [];
    private _pilot: Pilot = new Pilot();

    private _weights: { name: string; weight: number }[] = [];
    private _battleValue: number = 0;
    private _calcLogBV: string = "";
    private _cost: number = 0;
    private _calcLogCost: string = "";
    private _currentTonnage: number = 0;
    private _remainingTonnage: number = 0;

    constructor(importJSON: string = "") {
        if (importJSON) {
            this.importJSON(importJSON);
        }
        this._calc();
    }

    public getUUID(): string {
        return this._uuid;
    }

    public getName(): string {
        return this._name;
    }

    public setName(name: string): string {
        this._name = name;
        return this._name;
    }

    public getModel(): string {
        return this._model;
    }

    public setModel(model: string): string {
        this._model = model;
        return this._model;
    }

    public getNickname(): string {
        return this._nickname;
    }

    public setNickname(nickname: string): string {
        this._nickname = nickname;
        return this._nickname;
    }

    public getTonnage(): number {
        return this._tonnage;
    }

    public setTonnage(tonnage: number): number {
        this._tonnage = tonnage;
        this._pruneLocations();
        this._calc();
        return this._tonnage;
    }

    /** Superheavy: heavier than the motive type's standard maximum (Advanced rules). */
    public isSuperheavy(): boolean {
        return this._tonnage > this._motiveType.standardMaxTonnage;
    }

    /**
     * Lowest rules level at which this vehicle is legal: Superheavy vehicles and the VTOL chin
     * turret are Advanced, plus the rules level of its installed equipment. Standard (2) is
     * tournament play.
     */
    public getRequiredRulesLevel(): number {
        let level = this.isSuperheavy() || this.hasChinTurret() || this._jumpMP > 0 ? 3 : 0;
        for (const item of this._equipmentList) {
            if (item) level = Math.max(level, getEquipmentRulesLevel(item));
        }
        return level;
    }

    public getMotiveType(): IVehicleMotiveType {
        return this._motiveType;
    }

    public setMotiveType(motiveTag: string): IVehicleMotiveType {
        const previous = this._motiveType;
        this._motiveType = getVehicleMotiveType(motiveTag);
        if (!!previous.hasRotor !== !!this._motiveType.hasRotor) {
            // VTOLs mount only a chin turret (Advanced) and other vehicles have no rotor, so the
            // turret and rotor start over when switching to or from a VTOL.
            this._removeTurret();
            this._armorAllocation.rotor = 0;
        }
        if (!this.canHaveDualTurret()) this._removeDualTurret();
        if (!this._motiveType.allowsJumpJets) this._jumpMP = 0;
        this._pruneLocations();
        this._calc();
        return this._motiveType;
    }

    public hasTurret(): boolean {
        return this._hasTurret;
    }

    /** A VTOL's turret is a chin turret (Advanced rules). */
    public hasChinTurret(): boolean {
        return this._hasTurret && this._motiveType.turret === "chin";
    }

    public getTurretName(): string {
        if (this._motiveType.turret === "chin") return "Chin Turret";
        return this._dualTurret ? "Rear Turret" : "Turret";
    }

    /** Dual turrets: not on VTOLs (chin turret only) or WiGE vehicles (as implemented by MegaMekLab). */
    public canHaveDualTurret(): boolean {
        return this._motiveType.turret === "standard" && this._motiveType.tag !== "wige";
    }

    public hasDualTurret(): boolean {
        return this._hasTurret && this._dualTurret;
    }

    public setDualTurret(dualTurret: boolean): boolean {
        if (dualTurret && this.canHaveDualTurret()) {
            this._hasTurret = true;
            this._dualTurret = true;
        } else {
            this._removeDualTurret();
        }
        this._calc();
        return this._dualTurret;
    }

    private _removeDualTurret(): void {
        this._dualTurret = false;
        this._armorAllocation.turret2 = 0;
        for (const item of this._equipmentList) {
            if (item.location === "turret2") item.location = "";
        }
    }

    // Armor and equipment in locations the vehicle no longer has (Superheavy side locations,
    // a removed rotor or turret) are cleared or returned to the unallocated list.
    private _pruneLocations(): void {
        const present = new Set<string>(this.getLocations().map((loc) => loc.tag));
        for (const key of Object.keys(this._armorAllocation) as (keyof IVehicleArmorAllocation)[]) {
            if (!present.has(key)) this._armorAllocation[key] = 0;
        }
        for (const item of this._equipmentList) {
            if (item.location && !present.has(item.location)) item.location = "";
        }
    }

    /** Crew: 1 per 15 tons, rounded up (as implemented by MegaMek Compute.getFullCrewSize). */
    public getCrew(): number {
        return Math.ceil(this._tonnage / 15);
    }

    public getJumpMP(): number {
        return this._jumpMP;
    }

    /** Vehicular jump jets: hover, wheeled, tracked and WiGE only, up to Cruise MP (TO:AUE p.161). */
    public setJumpMP(jumpMP: number): number {
        this._jumpMP = this._motiveType.allowsJumpJets ? Math.max(0, Math.min(Math.floor(jumpMP), this._cruiseMP)) : 0;
        this._calc();
        return this._jumpMP;
    }

    /** Each jump jet weighs 0.5 t up to 55 t, 1 t up to 85 t, 2 t above (as for 'Mech jump jets). */
    public getJumpJetWeight(): number {
        const each = this._tonnage <= 55 ? 0.5 : this._tonnage <= 85 ? 1 : 2;
        return this._jumpMP * each;
    }

    public getTroopSpace(): number {
        return this._troopSpace;
    }

    /**
     * Infantry compartment (troop space) in tons, by the half ton: weight only, one item slot for
     * all compartments, and IT on the Alpha Strike card (as implemented by MegaMek; it adds no cost).
     */
    public setTroopSpace(tons: number): number {
        this._troopSpace = Math.max(0, Math.round(tons * 2) / 2);
        this._calc();
        return this._troopSpace;
    }

    public isFusionEngine(): boolean {
        return FUSION_ENGINE_TAGS.includes(this._engineType.tag);
    }

    public getFreeHeatSinks(): number {
        if (this.isFusionEngine()) return 10;
        if (this._engineType.tag === "fission") return 5;
        if (this._engineType.tag === "cell") return 1;
        return 0;
    }

    private static _isEnergyWeapon(item: IEquipmentItem): boolean {
        return item.category === "Energy Weapons" && !item.isAmmo;
    }

    /**
     * Heat sinks a vehicle must carry: the heat of its energy weapons that use no ammunition, plus
     * heat-producing equipment (vehicles are built heat-neutral; as implemented by MegaMek
     * TestEntity.calcHeatNeutralHSRequirement).
     */
    public getRequiredHeatSinks(): number {
        let heat = 0;
        for (const item of this._equipmentList) {
            if (item.isAmmo) continue;
            const usesAmmo = !!item.ammoTypes?.length || (item.shotsPerTon ?? 0) > 0;
            if (Vehicle._isEnergyWeapon(item)) {
                if (!usesAmmo) heat += item.heat || 0;
            } else if (item.isEquipment) {
                heat += item.heat || 0;
            }
        }
        return heat;
    }

    /** Heat sinks that weigh anything: those above the engine's free ones, plus any extra ones added. */
    public getWeightedHeatSinks(): number {
        return Math.max(0, this.getRequiredHeatSinks() - this.getFreeHeatSinks()) + this._additionalHeatSinks;
    }

    public getTotalHeatSinks(): number {
        return Math.max(this.getRequiredHeatSinks(), this.getFreeHeatSinks()) + this._additionalHeatSinks;
    }

    /**
     * Power amplifiers: vehicles without a fusion or fission engine need 10% of their energy weapons'
     * weight, rounded up to the half ton (vehicle flamers and chemical lasers excepted; as
     * implemented by MegaMek TestTank).
     */
    public getPowerAmplifierWeight(): number {
        if (this.isFusionEngine() || this._engineType.tag === "fission") return 0;
        const weight = this._equipmentList
            .filter((item) => Vehicle._isEnergyWeapon(item) && !/vehicle-flamer|chemical-laser/.test(item.tag))
            .reduce((sum, item) => sum + (item.weight || 0), 0);
        return Math.ceil(weight / 10 * 2) / 2;
    }

    /** Item slots: 5 + tonnage / 5, rounded down (as implemented by MegaMek Tank.getTotalSlots). */
    public getTotalItemSlots(): number {
        return 5 + Math.floor(this._tonnage / 5);
    }

    /**
     * Item slots used: equipment (ammunition takes one slot per ammo type), one slot for all jump
     * jets, and engine slots (as implemented by MegaMek Tank.getFreeSlots).
     */
    public getUsedItemSlots(): number {
        const ammoTypes = new Set<string>();
        let used = 0;
        for (const item of this._equipmentList) {
            if (item.isAmmo) {
                ammoTypes.add(item.tag);
            } else if (!item.isModularArmor) {
                used += Math.max(0, item.space?.combatVehicle ?? 1);
            }
        }
        used += ammoTypes.size;
        if (this._jumpMP > 0) used += 1;
        if (this._troopSpace > 0) used += 1;
        used += ENGINE_ITEM_SLOTS[this._engineType.tag] ?? 0;
        if (this.getEngineRating() > 400) used += 1;
        return used;
    }

    public setHasTurret(hasTurret: boolean): boolean {
        if (hasTurret) {
            this._hasTurret = true;
        } else {
            this._removeTurret();
        }
        this._calc();
        return this._hasTurret;
    }

    // Without a turret its armor goes away and its equipment returns to the unallocated list.
    private _removeTurret(): void {
        this._hasTurret = false;
        this._removeDualTurret();
        this._armorAllocation.turret = 0;
        for (const item of this._equipmentList) {
            if (item.location === "turret") item.location = "";
        }
    }

    /** The vehicle's locations in record-sheet order: front, sides, rear, rotor (VTOL), turret. */
    public getLocations(): { tag: VehicleLocation; name: string }[] {
        // Superheavy vehicles (other than VTOLs) have front/rear side locations instead of Left/Right
        // (as implemented by MegaMek SuperHeavyTank).
        const locations: VehicleLocation[] = this.isSuperheavy() && !this._motiveType.hasRotor
            ? ["front", "frontLeft", "frontRight", "rearLeft", "rearRight", "rear"]
            : ["front", "left", "right", "rear"];
        if (this._motiveType.hasRotor) locations.push("rotor");
        if (this._hasTurret && this._dualTurret) locations.push("turret2");
        if (this._hasTurret) locations.push("turret");
        return locations.map((tag) => ({ tag, name: tag === "turret" ? this.getTurretName() : LOCATION_NAMES[tag] }));
    }

    public getTech(): ITechOptions {
        return this._tech;
    }

    public setTech(tag: string): ITechOptions {
        this._tech = btTechOptions.find((t) => t.tag === tag) ?? this._tech;
        return this._tech;
    }

    public getEra(): IEras {
        return this._era;
    }

    public setEra(tag: string): IEras {
        this._era = btEraOptions.find((e) => e.tag === tag) ?? this._era;
        return this._era;
    }

    public getEngineType(): IEngineType {
        return this._engineType;
    }

    public setEngineType(tag: string): IEngineType {
        this._engineType = mechEngineTypes.find((e) => e.tag === tag) ?? this._engineType;
        this._calc();
        return this._engineType;
    }

    public getCruiseMP(): number {
        return Math.max(0, this._cruiseMP - (this.hasActiveModularArmor() ? 1 : 0));
    }

    public setCruiseMP(cruiseMP: number): number {
        this._cruiseMP = Math.max(0, cruiseMP);
        this._jumpMP = Math.min(this._jumpMP, this._cruiseMP);
        this._calc();
        return this._cruiseMP;
    }

    public getFlankMP(): number {
        return Math.ceil(this.getCruiseMP() * 1.5);
    }

    /**
     * Engine rating = cruise MP x tonnage - suspension factor, at least 10 (TechManual Combat
     * Vehicle construction; minimum as in MegaMekLab).
     */
    public getEngineRating(): number {
        return Math.max(10, Math.ceil(this._tonnage * this._cruiseMP) - this.getSuspensionFactor());
    }

    /** Fastest Cruise MP whose engine rating fits: 400, or 500 with Large engines (Experimental). */
    public getMaxCruiseMP(rulesLevel: number = 2): number {
        const maxRating = rulesLevel >= 4 ? MAX_LARGE_ENGINE_RATING : MAX_STANDARD_ENGINE_RATING;
        return Math.max(0, Math.floor((maxRating + this.getSuspensionFactor()) / this._tonnage));
    }

    public getSuspensionFactor(): number {
        return getVehicleSuspensionFactor(this._motiveType.tag, this._tonnage);
    }

    public getEngineWeight(): number {
        const requiredRating = this.getEngineRating();
        const engineOption = mechEngineOptions.find((option) => option.rating >= requiredRating)
            ?? mechEngineOptions[mechEngineOptions.length - 1];
        const engineTag = this._engineType.tag as keyof typeof engineOption.weight;
        const weight = engineOption.weight[engineTag] ?? engineOption.weight.standard;
        // Fusion and fission engines in vehicles need extra shielding: weight x 1.5 (TechManual, Combat Vehicle engines).
        const shielded = this._engineType.tag !== "ice" && this._engineType.tag !== "cell";
        return shielded ? Math.ceil(weight * 1.5 * 2) / 2 : weight;
    }

    public getArmorType(): IArmorType {
        return this._armorType;
    }

    public getAvailableArmorTypes(): IArmorType[] {
        const techTag = this.getTech().tag;
        const isMixed = techTag === "mis" || techTag === "mclan";
        return mechArmorTypes.filter((armor) => armor.unitTypes.combatVehicle
            && (this._motiveType.allowsHardenedArmor || armor.tag !== "hardened")
            && armor.constructionStatus !== "deferred" && armor.constructionMode !== "equipment" && (isMixed
            ? armor.armorMultiplier.is > 0 || armor.armorMultiplier.clan > 0
            : armor.armorMultiplier[techTag === "clan" ? "clan" : "is"] > 0));
    }

    public setArmorType(tag: string): IArmorType {
        this._armorType = this.getAvailableArmorTypes().find((armor) => armor.tag === tag) ?? this._armorType;
        this._calc();
        return this._armorType;
    }

    public getArmorAllocation(): IVehicleArmorAllocation {
        return this._armorAllocation;
    }

    public setArmorAllocation(location: keyof IVehicleArmorAllocation, points: number): IVehicleArmorAllocation {
        const maxForLocation = this.getMaxArmorAllocation()[location] ?? 0;
        this._armorAllocation[location] = Math.min(Math.max(0, points), maxForLocation);
        this._calc();
        return this._armorAllocation;
    }

    public getArmorPointsPerTon(): number {
        const preferredBase = this.getTech().tag === "clan" || this.getTech().tag === "mclan" ? "clan" : "is";
        const armorBase = this._armorType.armorMultiplier[preferredBase] > 0
            ? preferredBase
            : preferredBase === "clan" ? "is" : "clan";
        return this._armorType.armorMultiplier[armorBase] || 16;
    }

    public getArmorWeight(): number {
        const totalPoints = Object.values(this._armorAllocation).reduce((sum: number, points) => sum + (points ?? 0), 0);
        return Math.ceil((totalPoints / this.getArmorPointsPerTon()) * 2) / 2;
    }

    // TechManual Combat Vehicle armor cap: (Tonnage x 3.5) + 40 points, rounded down.
    public getMaxArmorPoints(): number {
        return Math.floor(this._tonnage * 3.5 + 40);
    }

    // The largest armor tonnage the vehicle can actually mount: whichever is smaller of the
    // point-formula cap and what fits in the tonnage still available (current armor + remaining).
    public getMaxArmorTonnage(): number {
        const pointsPerTon = this.getArmorPointsPerTon();
        const formulaCapTons = Math.floor((this.getMaxArmorPoints() / pointsPerTon) * 2) / 2;
        const weightBudgetTons = Math.floor((this.getArmorWeight() + Math.max(0, this.getRemainingTonnage())) * 2) / 2;
        return Math.max(0, Math.min(formulaCapTons, weightBudgetTons));
    }

    // Sets total armor by tonnage (0.5-ton increments) and redistributes points across locations,
    // keeping each location's current proportion of the total (or splitting evenly when empty).
    public setArmorTonnage(tons: number): number {
        const clampedTons = Math.max(0, Math.min(this.getMaxArmorTonnage(), Math.round(tons * 2) / 2));
        const targetPoints = Math.min(this.getMaxArmorPoints(), Math.floor(clampedTons * this.getArmorPointsPerTon()));
        this._distributeArmorPoints(targetPoints);
        this._calc();
        return this.getArmorWeight();
    }

    public allocateMaxArmor(): void {
        this.setArmorTonnage(this.getMaxArmorTonnage());
    }

    public allocateArmorClear(): void {
        this._armorAllocation = emptyArmorAllocation();
        this._calc();
    }

    private _distributeArmorPoints(targetPoints: number): void {
        const locations = this.getLocations().map((loc) => loc.tag);
        const currentTotal = locations.reduce((sum, loc) => sum + (this._armorAllocation[loc] ?? 0), 0);
        const nextAllocation: IVehicleArmorAllocation = emptyArmorAllocation();

        if (currentTotal <= 0) {
            const base = Math.floor(targetPoints / locations.length);
            let remainder = targetPoints - base * locations.length;
            for (const loc of locations) {
                nextAllocation[loc] = base + (remainder > 0 ? 1 : 0);
                if (remainder > 0) remainder--;
            }
        } else {
            let assigned = 0;
            for (const loc of locations) {
                const share = Math.floor((targetPoints * (this._armorAllocation[loc] ?? 0)) / currentTotal);
                nextAllocation[loc] = share;
                assigned += share;
            }
            nextAllocation.front += targetPoints - assigned;
        }

        // The rotor holds at most 2 points; anything above that goes to the front. A VTOL rotor
        // gets its 2 points first, taken from the most heavily armored location.
        if ((nextAllocation.rotor ?? 0) > VTOL_MAX_ROTOR_ARMOR) {
            nextAllocation.front += (nextAllocation.rotor ?? 0) - VTOL_MAX_ROTOR_ARMOR;
            nextAllocation.rotor = VTOL_MAX_ROTOR_ARMOR;
        }
        if (this._motiveType.hasRotor) {
            const wanted = Math.min(VTOL_MAX_ROTOR_ARMOR, targetPoints) - (nextAllocation.rotor ?? 0);
            for (let point = 0; point < wanted; point++) {
                const donor = locations.filter((loc) => loc !== "rotor")
                    .reduce((best, loc) => ((nextAllocation[loc] ?? 0) > (nextAllocation[best] ?? 0) ? loc : best), "front" as VehicleLocation);
                if ((nextAllocation[donor] ?? 0) <= 0) break;
                nextAllocation[donor] = (nextAllocation[donor] ?? 0) - 1;
                nextAllocation.rotor = (nextAllocation.rotor ?? 0) + 1;
            }
        }

        this._armorAllocation = nextAllocation;
    }

    public getStructureType(): string {
        return this._structureType;
    }

    public setStructureType(tag: string): string {
        this._structureType = VEHICLE_STRUCTURE_MULTIPLIERS[tag] !== undefined ? tag : "standard";
        this._calc();
        return this._structureType;
    }

    // Superheavy vehicles (other than naval ones) have twice the structure weight
    // (as implemented by MegaMek; not yet checked against the book).
    public getStructureWeight(): number {
        const multiplier = (VEHICLE_STRUCTURE_MULTIPLIERS[this._structureType] ?? 0.1)
            * (this.isSuperheavy() && !this._motiveType.naval ? 2 : 1);
        return Math.ceil(this._tonnage * multiplier * 2) / 2;
    }

    // Combat Vehicle Internal Structure: 1 point per 10 tons, rounded up, in every location
    // including the rotor and turret (as implemented by MegaMek Tank.autoSetInternal).
    public getStructureAllocation(): IVehicleStructureAllocation {
        const pointsPerLocation = Math.max(1, Math.ceil(this._tonnage / 10));
        const result: IVehicleStructureAllocation = emptyArmorAllocation();
        for (const loc of this.getLocations()) {
            result[loc.tag] = pointsPerLocation;
        }
        return result;
    }

    // Any single location can use up the vehicle's total armor point budget, minus whatever is
    // already allocated to the other locations; only the VTOL rotor has its own cap (2 points).
    public getMaxArmorAllocation(): IVehicleArmorAllocation {
        const maxPoints = this.getMaxArmorPoints();
        const locations = this.getLocations().map((loc) => loc.tag);
        const result: IVehicleArmorAllocation = emptyArmorAllocation();
        for (const loc of locations) {
            const othersTotal = locations.reduce((sum, l) => sum + (l === loc ? 0 : this._armorAllocation[l] ?? 0), 0);
            result[loc] = Math.max(0, maxPoints - othersTotal);
        }
        result.rotor = Math.min(VTOL_MAX_ROTOR_ARMOR, result.rotor ?? 0);
        return result;
    }

    public getHeatSinkType(): IHeatSync {
        return this._heatSinkType;
    }

    public setHeatSinkType(tag: string): IHeatSync {
        this._heatSinkType = mechHeatSinkTypes.find((h) => h.tag === tag && h.tag === "single") ?? this._heatSinkType;
        this._calc();
        return this._heatSinkType;
    }

    public getAdditionalHeatSinks(): number {
        return this._additionalHeatSinks;
    }

    // Heat sinks beyond the required ones (see getRequiredHeatSinks).
    public setAdditionalHeatSinks(count: number): number {
        this._additionalHeatSinks = Math.max(0, count);
        this._calc();
        return this._additionalHeatSinks;
    }

    // Vehicles use single heat sinks only (as implemented by MegaMek TestTank); each weighs 1 ton.
    public getHeatSinkWeight(): number {
        return this.getWeightedHeatSinks();
    }

    public getEquipmentList(): IEquipmentItem[] {
        return this._equipmentList;
    }

    public addEquipment(item: IEquipmentItem, location?: string, rear?: boolean): IEquipmentItem[] {
        const equipmentCopy: IEquipmentItem = { ...item, location, rear, uuid: generateUUID() };
        if (equipmentCopy.isModularArmor) {
            equipmentCopy.currentAdditionalArmor = equipmentCopy.additionalArmor ?? 10;
        }
        this._equipmentList.push(equipmentCopy);
        this._calc();
        return this._equipmentList;
    }

    public addEquipmentFromTag(tag: string, location?: string, rear?: boolean, uuid?: string): IEquipmentItem[] {
        const catalogItem = getEquipmentListByTech(this._tech.tag, true).find((item) => item.tag === tag);
        if (catalogItem) {
            const equipment = { ...catalogItem, location, rear, uuid: uuid || generateUUID() };
            if (equipment.isModularArmor) {
                equipment.currentAdditionalArmor = equipment.additionalArmor ?? 10;
            }
            this._equipmentList.push(equipment);
            this._calc();
        }
        return this._equipmentList;
    }

    public removeEquipment(uuid: string): IEquipmentItem[] {
        this._equipmentList = this._equipmentList.filter((item) => item.uuid !== uuid);
        this._calc();
        return this._equipmentList;
    }

    public setEquipmentLocation(uuid: string, location: string): IEquipmentItem[] {
        const item = this._equipmentList.find((equipment) => equipment.uuid === uuid);
        // Equipment goes in the body locations or the turret, never the rotor.
        if (location && (location === "rotor" || !this.getLocations().some((loc) => loc.tag === location))) {
            return this._equipmentList;
        }
        if (item) {
            if (item.isModularArmor && location && this._equipmentList.some(equipment =>
                equipment.uuid !== uuid && equipment.isModularArmor && equipment.location === location
            )) {
                return this._equipmentList;
            }
            item.location = location;
            this._calc();
        }
        return this._equipmentList;
    }

    public hasActiveModularArmor(): boolean {
        return this._equipmentList.some(item =>
            item.isModularArmor && item.location && (item.currentAdditionalArmor ?? item.additionalArmor ?? 0) > 0
        );
    }

    // Combat Vehicles allocate equipment against per-location slot capacity (space.combatVehicle)
    // rather than a fixed 'Mech-style critical slot grid.
    public getEquipmentSlotsUsed(location: string): number {
        return this._equipmentList
            .filter((item) => item.location === location)
            .reduce((sum, item) => sum + (item.space?.combatVehicle ?? 0), 0);
    }

    // Mech-only physical/melee weapons (hatchet, sword, claw, mace, retractable blade) and
    // hand-actuator-dependent equipment cannot be mounted on Combat Vehicles.
    private _isEquipmentAllowedForVehicle(item: IEquipmentItem): boolean {
        if (item.requiresHandActuator) return false;
        if (item.metadata?.domains && !item.metadata.domains.includes("vehicle")) return false;

        const tag = item.tag.toLowerCase();
        const name = item.name.toLowerCase();
        return !(
            item.isMelee ||
            tag.includes("hatchet") || tag.includes("sword") || tag.includes("claw") || tag.includes("mace") ||
            name.includes("hatchet") || name.includes("sword") || name.includes("claw") || name.includes("mace")
        );
    }

    private _itemIsAvailable(introduced: number | null, extinct: number | null, reintroduced: number | null, ignoreExtinction: boolean = false): boolean {
        const introductionYear = introduced ?? 0;
        const extinctionYear = extinct ?? 0;
        const reintroductionYear = reintroduced ?? 0;
        const eraStart = this._era.yearStart;
        const eraEnd = this._era.yearEnd ?? Number.POSITIVE_INFINITY;
        const overlapsEra = introductionYear <= eraEnd && (extinctionYear === 0 || extinctionYear >= eraStart);

        if (ignoreExtinction) return introductionYear <= eraEnd;
        return overlapsEra || (reintroductionYear > 0 && reintroductionYear <= eraEnd);
    }

    private _setAvailability(item: IEquipmentItem, rulesLevel: number): void {
        // Equipment records carry side-specific IS or Clan dates, so extinction always applies.
        const inProduction = this._itemIsAvailable(item.introduced, item.extinct, item.reintroduced);
        const effectiveIntroduction = getEffectiveIntroduction(item, rulesLevel);
        const asPrototype = !inProduction && effectiveIntroduction !== item.introduced
            && this._itemIsAvailable(effectiveIntroduction, item.extinct, item.reintroduced);
        item.availableAsPrototype = asPrototype;
        item.available = (inProduction || asPrototype) && this._isEquipmentAllowedForVehicle(item);
    }

    public getAvailableEquipment(includeCustom: boolean = false, rulesLevel: number = 2): IEquipmentItem[] {
        const returnItems: IEquipmentItem[] = [];
        const techTag = this._tech.tag;
        const includeClan = ["clan", "mclan", "mis"].includes(techTag);
        const includeIS = ["is", "mis", "mclan"].includes(techTag);

        if (includeClan) {
            for (const item of getEquipmentListByTech("clan", includeCustom && !includeIS)) {
                item.catalog = item.catalog ?? (item.category === "Custom Equipment" ? "custom" : "clan");
                item.criticals = item.space.combatVehicle;
                this._setAvailability(item, rulesLevel);
                returnItems.push(item);
            }
        }
        if (includeIS) {
            for (const item of getEquipmentListByTech("is", includeCustom)) {
                item.catalog = item.catalog ?? (item.category === "Custom Equipment" ? "custom" : "is");
                item.criticals = item.space.combatVehicle;
                this._setAvailability(item, rulesLevel);
                returnItems.push(item);
            }
        }
        returnItems.sort((a, b) => (a.sort > b.sort ? 1 : a.sort < b.sort ? -1 : 0));
        return returnItems;
    }

    public getAvailableEquipmentByCatalog(catalog: "all" | "is" | "clan" | "custom", includeCustom: boolean = false, rulesLevel: number = 2): IEquipmentItem[] {
        const equipment = this.getAvailableEquipment(includeCustom, rulesLevel);
        return catalog === "all" ? equipment : equipment.filter((item) => item.catalog === catalog);
    }

    public getPilot(): Pilot {
        return this._pilot;
    }

    public setPilot(pilot: Pilot): Pilot {
        this._pilot = pilot;
        return this._pilot;
    }

    public getWeights(): { name: string; weight: number }[] {
        return this._weights;
    }

    public getCurrentTonnage(): number {
        return this._currentTonnage;
    }

    public getRemainingTonnage(): number {
        return this._remainingTonnage;
    }

    /** Control systems: 5% of tonnage, rounded up to the half ton (TM, as implemented by MegaMek). */
    public getControlSystemsWeight(): number {
        return Math.ceil(this._tonnage * 0.05 * 2) / 2;
    }

    /**
     * Lift/dive equipment for hover, VTOL, WiGE, hydrofoil and submarine vehicles: 10% of tonnage,
     * rounded up to the half ton (TM, as implemented by MegaMek). Other motive types need none.
     */
    public getLiftEquipmentWeight(): number {
        return this._motiveType.liftEquipment ? Math.ceil(this._tonnage * 0.1 * 2) / 2 : 0;
    }

    /** Defensive BV type modifier by motive (as implemented by MegaMek CombatVehicleBVCalculator). */
    private _bvTypeModifier(): number {
        switch (this._motiveType.tag) {
            case "tracked": return 0.9;
            case "wheeled": return 0.8;
            case "hover":
            case "vtol":
            case "wige": return 0.7;
            default: return 0.6;
        }
    }

    public hasTargetingComputer(): boolean {
        return this._equipmentList.some((item) => item.variableFormula?.startsWith("targeting-computer"));
    }

    private _isWeapon(item: IEquipmentItem): boolean {
        return !item.isAmmo && !item.isEquipment && !item.battleValueDefensive && (item.battleValue || 0) > 0;
    }

    /**
     * Battle Value (TM Combat Vehicle BV, as implemented by MegaMek CombatVehicleBVCalculator;
     * provisional until checked against the book):
     * Defensive = (armor x 2.5 x armor type + structure x 1.5 x structure type + defensive
     * equipment) x motive type modifier x (1 + best TMM / 10), where VTOLs and WiGEs are airborne
     * (+1 TMM) and jumping adds +1.
     * Offensive = (weapons + ammunition (capped at the weapons it feeds) + tonnage / 2) x Speed
     * Factor (TM p.316) for Flank MP + half Jump MP. The weaker of the front and rear arcs counts
     * half; turret and side weapons count in full. Checked against the MUL BV of published
     * tracked, wheeled, hover, VTOL and hydrofoil designs (vehicle.test.ts).
     */
    private _calcBattleValue(): void {
        let log = "<strong>DEFENSIVE BATTLE RATING</strong><br />";
        const locations = this.getLocations().map((loc) => loc.tag);
        const modularArmor = this._equipmentList
            .filter((item) => item.isModularArmor)
            .reduce((sum, item) => sum + (item.currentAdditionalArmor ?? item.additionalArmor ?? 0), 0);
        const armorPoints = locations.reduce((sum, loc) => sum + (this._armorAllocation[loc] ?? 0), 0) + modularArmor;
        const armorMultiplier = this._armorType.bvMultiplier ?? (this._armorType.tag === "commercial" ? 0.5 : 1);
        const armorBV = armorPoints * 2.5 * armorMultiplier;
        log += `Armor: ${armorPoints} points x 2.5 x ${armorMultiplier} (${this._armorType.name}) = ${armorBV.toFixed(2)}<br />`;

        const structure = this.getStructureAllocation();
        const structurePoints = locations.reduce((sum, loc) => sum + (structure[loc] ?? 0), 0);
        const structureMultiplier = this._structureType === "reinforced" ? 2 : 1;
        const structureBV = structurePoints * 1.5 * structureMultiplier;
        log += `Internal Structure: ${structurePoints} points x 1.5 x ${structureMultiplier} = ${structureBV.toFixed(2)}<br />`;

        let defensiveEquipmentBV = 0;
        let amsAmmoBV = 0;
        let amsBV = 0;
        const weapons = this._equipmentList.filter((item) => !item.isAmmo);
        for (const item of this._equipmentList) {
            if (item.isAmmo) {
                const fed = weapons.find((weapon) => weapon.battleValueDefensive && getCompatibleAmmo(weapon, item));
                if (fed) amsAmmoBV += getAmmoBattleValuePerTon(fed, item) * item.weight;
            } else if (item.battleValueDefensive) {
                defensiveEquipmentBV += item.battleValue || 0;
                if (item.weaponType?.includes("AMS")) amsBV += item.battleValue || 0;
                log += `+ Defensive Equipment: ${item.name} = ${item.battleValue || 0}<br />`;
            }
        }
        defensiveEquipmentBV += Math.min(amsAmmoBV, amsBV);

        let defensive = armorBV + structureBV + defensiveEquipmentBV;
        const typeModifier = this._bvTypeModifier();
        log += `Subtotal ${defensive.toFixed(2)} x ${typeModifier} (${this._motiveType.name} type modifier)`;
        defensive *= typeModifier;
        log += ` = ${defensive.toFixed(2)}<br />`;

        const flank = this.getFlankMP();
        const airborne = this._motiveType.tag === "vtol" || this._motiveType.tag === "wige";
        const runTMM = flank > 0 ? getMovementModifier(flank) + (airborne ? 1 : 0) : 0;
        const jumpTMM = this._jumpMP > 0 ? getMovementModifier(this._jumpMP) + 1 : 0;
        const defensiveFactor = 1 + Math.max(runTMM, jumpTMM) / 10;
        defensive *= defensiveFactor;
        log += `Defensive Factor: 1 + max(Flank TMM ${runTMM}${airborne ? " incl. +1 airborne" : ""}, Jump TMM ${jumpTMM}) / 10 = ${defensiveFactor.toFixed(2)} -> ${defensive.toFixed(2)}<br />`;

        log += "<strong>OFFENSIVE BATTLE RATING</strong><br />";
        const hasTC = this.hasTargetingComputer();
        const baseWeaponBV = (item: IEquipmentItem) => (item.battleValue || 0) * (hasTC && isTargetingComputerWeapon(item) ? 1.25 : 1);
        const offensiveWeapons = this._equipmentList.filter((item) => this._isWeapon(item));
        const arcBV = (location: string) => offensiveWeapons.filter((item) => item.location === location).reduce((sum, item) => sum + baseWeaponBV(item), 0);
        // The weaker of the front and rear arcs counts half; side and turret weapons count in full.
        // (MegaMek also halves side weapons when the rear arc is stronger, but the MUL does not:
        // Sea Skimmer Hydrofoil, BV 288.)
        const rearIsFront = arcBV("front") < arcBV("rear");
        const isHalved = (item: IEquipmentItem) => item.location === (rearIsFront ? "front" : "rear");
        let weaponBV = 0;
        const weaponBVByTag: Record<string, number> = {};
        for (const item of offensiveWeapons) {
            const value = baseWeaponBV(item) * (isHalved(item) ? 0.5 : 1);
            weaponBV += value;
            weaponBVByTag[item.tag] = (weaponBVByTag[item.tag] ?? 0) + value;
            log += `+ ${item.name} (${item.location || "unallocated"}) = ${value.toFixed(2)}${isHalved(item) ? " (rear arc x 0.5)" : ""}<br />`;
        }

        const ammoBVByTag: Record<string, number> = {};
        for (const ammo of this._equipmentList.filter((item) => item.isAmmo)) {
            const fed = offensiveWeapons.find((weapon) => getCompatibleAmmo(weapon, ammo));
            if (!fed) continue;
            ammoBVByTag[fed.tag] = (ammoBVByTag[fed.tag] ?? 0) + getAmmoBattleValuePerTon(fed, ammo) * ammo.weight;
        }
        let ammoBV = 0;
        for (const [tag, value] of Object.entries(ammoBVByTag)) {
            const capped = Math.min(value, weaponBVByTag[tag] ?? 0);
            ammoBV += capped;
            log += `+ Ammunition for ${tag} = ${capped.toFixed(2)}${capped < value ? " (capped at weapon BV)" : ""}<br />`;
        }

        const weightBV = this._tonnage / 2;
        let offensive = weaponBV + ammoBV + weightBV;
        const speedMP = flank + Math.round(this._jumpMP / 2);
        const speedFactor = Math.round(Math.pow(1 + (speedMP - 5) / 10, 1.2) * 100) / 100;
        log += `(Weapons ${weaponBV.toFixed(2)} + Ammo ${ammoBV.toFixed(2)} + Tonnage / 2 ${weightBV}) x Speed Factor ${speedFactor} (MP ${speedMP})`;
        offensive *= speedFactor;
        log += ` = ${offensive.toFixed(2)}<br />`;

        this._battleValue = Math.round(defensive + offensive);
        log += `<strong>Battle Value</strong>: ${defensive.toFixed(2)} + ${offensive.toFixed(2)} = ${this._battleValue} (provisional)<br />`;
        this._calcLogBV = log;
    }

    /**
     * C-Bill cost (TM Combat Vehicle cost, as implemented by MegaMek CombatVehicleCostCalculator;
     * provisional): engine, armor, structure, control systems, power amplifiers, heat sinks,
     * turrets, equipment and ammunition, lift/dive equipment, then x (1 + tonnage / motive divisor).
     * Vehicular jump jets add no cost (MegaMek gives them none; source not checked).
     */
    private _calcCost(): void {
        const rows: [string, number][] = [];
        const engineRating = Math.ceil(this.getEngineRating() / 5) * 5;
        rows.push([`${this._engineType.name} (${this._engineType.costMultiplier} x rating ${engineRating} x ${this._tonnage} t / 75)`,
            (this._engineType.costMultiplier || 0) * engineRating * this._tonnage / 75]);
        rows.push([`Armor (${this.getArmorWeight()} t)`, this.getArmorWeight() * (this._armorType.costMultiplier || 10000)]);
        rows.push([`Internal Structure (${this.getStructureWeight()} t)`, this.getStructureWeight() * 10000]);
        rows.push([`Control Systems (${this.getControlSystemsWeight()} t)`, this.getControlSystemsWeight() * 10000]);
        if (this.getPowerAmplifierWeight() > 0) rows.push(["Power Amplifiers", this.getPowerAmplifierWeight() * 20000]);
        if (this.getWeightedHeatSinks() > 0) rows.push([`Heat Sinks (${this.getWeightedHeatSinks()})`, this.getWeightedHeatSinks() * 2000]);
        const turretWeaponWeight = this._equipmentList
            .filter((item) => (item.location === "turret" || item.location === "turret2") && !item.isAmmo)
            .reduce((sum, item) => sum + item.weight, 0) / 10;
        if (turretWeaponWeight > 0) rows.push(["Turret", Math.ceil(turretWeaponWeight * 2) / 2 * 5000]);
        const equipmentCost = this._equipmentList.reduce((sum, item) => sum + (item.isAmmo ? (item.cbills || 0) * item.weight : item.cbills || 0), 0);
        rows.push(["Weapons, Equipment and Ammunition", equipmentCost]);
        if (this._motiveType.liftEquipment) {
            const liftTons = Math.ceil(this._tonnage / 5) / 2;
            rows.push([`${this._motiveType.liftEquipment} (${liftTons} t)`, liftTons * (this._motiveType.hasRotor ? 40000 : 20000)]);
        }
        const subtotal = rows.reduce((sum, [, value]) => sum + value, 0);
        const divisors: Record<string, number> = {
            hover: 50, "naval-sub": 50, hydrofoil: 75, "naval-surface": 200, wheeled: 200, tracked: 100, vtol: 30, wige: 25,
        };
        const multiplier = 1 + this._tonnage / (divisors[this._motiveType.tag] ?? 100);
        this._cost = Math.round(subtotal * multiplier);
        this._calcLogCost = rows.map(([name, value]) => `${name}: ${Math.round(value).toLocaleString()}`).join("<br />")
            + `<br />Subtotal ${Math.round(subtotal).toLocaleString()} x ${multiplier.toFixed(3)} (1 + ${this._tonnage} / ${divisors[this._motiveType.tag] ?? 100})`
            + ` = <strong>${this._cost.toLocaleString()}</strong> (provisional)`;
    }

    public getBattleValue(): number {
        return this._battleValue;
    }

    public getBattleValueLog(): string {
        return this._calcLogBV;
    }

    public getCBillCost(): number {
        return this._cost;
    }

    public getCBillCostLog(): string {
        return this._calcLogCost;
    }

    private _calc() {
        this._weights = [];

        this._weights.push({ name: "Internal Structure", weight: this.getStructureWeight() });
        this._weights.push({ name: this._engineType.name, weight: this.getEngineWeight() });
        this._weights.push({ name: "Control Systems", weight: this.getControlSystemsWeight() });
        if (this._motiveType.liftEquipment) {
            this._weights.push({ name: this._motiveType.liftEquipment, weight: this.getLiftEquipmentWeight() });
        }
        this._weights.push({ name: "Armor", weight: this.getArmorWeight() });

        if (this.getWeightedHeatSinks() > 0) {
            this._weights.push({ name: `${this._heatSinkType.name} Heat Sinks`, weight: this.getWeightedHeatSinks() });
        }
        if (this.getPowerAmplifierWeight() > 0) {
            this._weights.push({ name: "Power Amplifiers", weight: this.getPowerAmplifierWeight() });
        }
        if (this._jumpMP > 0) {
            this._weights.push({ name: "Jump Jets", weight: this.getJumpJetWeight() });
        }
        if (this._troopSpace > 0) {
            this._weights.push({ name: "Troop Space", weight: this._troopSpace });
        }

        // Turret mass: 10% of the combined weight of turret-mounted equipment (ammunition excluded),
        // rounded up to the nearest half-ton, minimum half a ton.
        const turretWeight = (location: string) => Math.max(0.5, Math.ceil(this._equipmentList
            .filter((item) => item.location === location && !item.isAmmo)
            .reduce((sum, item) => sum + item.weight, 0) * 0.1 * 2) / 2);
        if (this._hasTurret && this._dualTurret) {
            this._weights.push({ name: "Front Turret", weight: turretWeight("turret2") });
        }
        if (this._hasTurret) {
            this._weights.push({ name: this.getTurretName(), weight: turretWeight("turret") });
        }

        for (const item of this._equipmentList) {
            this._weights.push({ name: item.name, weight: item.weight });
        }

        this._currentTonnage = this._weights.reduce((sum, w) => sum + w.weight, 0);
        this._remainingTonnage = this._tonnage - this._currentTonnage;
        this._calcBattleValue();
        this._calcCost();
    }

    // Alpha Strike conversion for Combat Vehicles (Alpha Strike Companion conversion rules as
    // implemented by MegaMek's ASConverter; checked against the MUL cards in vehicle.test.ts).
    // Weapon damage comes from each catalog record's alphaStrike values.

    // Size: under 40 t 1, under 60 t 2, under 80 t 3, else 4 (matches 1,189 of 1,190 MUL vehicles).
    public getAlphaStrikeSize(): number {
        if (this._tonnage >= 80) return 4;
        if (this._tonnage >= 60) return 3;
        if (this._tonnage >= 40) return 2;
        return 1;
    }

    // Movement mode code on the AS card (e.g. 18"h for a Hover unit), as the Master Unit List prints
    // them: t tracked, w wheeled, h hover, v VTOL, g WiGE, n naval/hydrofoil, s submarine.
    public getAlphaStrikeMovementType(): string {
        return this._motiveType.alphaStrikeMove;
    }

    // AS ground movement conversion: 1 Cruise MP = 2".
    public getAlphaStrikeMovement(): number {
        return this.getCruiseMP() * 2;
    }

    /** AS Target Movement Modifier from movement in inches. */
    public static alphaStrikeTMM(inches: number): number {
        if (inches >= 35) return 5;
        if (inches >= 19) return 4;
        if (inches >= 13) return 3;
        if (inches >= 9) return 2;
        if (inches >= 5) return 1;
        return 0;
    }

    private static _roundUpToTenth(value: number): number {
        return Math.ceil(Math.round(value * 1000) / 100) / 10;
    }

    /** Rounded up to the tenth; under 0.5 is minimal damage (0*), otherwise rounded up. */
    private static _asDamage(raw: number): IVehicleASDamageValue {
        const tenth = Vehicle._roundUpToTenth(raw);
        if (tenth <= 0) return { damage: 0, minimal: false };
        if (tenth < 0.5) return { damage: 0, minimal: true };
        return { damage: Math.ceil(tenth), minimal: false };
    }

    /**
     * A special ability's damage vector (as implemented by MegaMek ASDamageVector): a turret's
     * standard damage rounds up; REAR and FLK round normally; LRM/SRM/AC/IF round normally with no
     * minimal damage. Values are rounded up to the tenth first; 0 prints as "-".
     */
    private static _asVector(values: number[], rounding: "up" | "normal" | "normalNoMinimal"): string {
        return values.map((raw) => {
            const tenth = Vehicle._roundUpToTenth(raw);
            let value: IVehicleASDamageValue;
            if (rounding === "up") {
                value = Vehicle._asDamage(raw);
            } else {
                const minimal = rounding === "normal" && tenth > 0 && tenth < 0.5;
                value = { damage: minimal ? 0 : Math.round(tenth), minimal };
            }
            return value.minimal ? "0*" : value.damage > 0 ? `${value.damage}` : "-";
        }).join("/");
    }

    /**
     * Damage multiplier for low ammunition: fewer than 10 shots per weapon of a kind x 0.75, none x 0
     * (as implemented by MegaMek ASDamageConverter.assembleAmmoCounts).
     */
    private _asAmmoMultiplier(weapon: IEquipmentItem): number {
        const usesAmmo = !!weapon.ammoTypes?.length || (weapon.shotsPerTon ?? 0) > 0;
        if (!usesAmmo) return 1;
        const sameWeapons = this._equipmentList.filter((item) => !item.isAmmo && item.tag === weapon.tag).length;
        const shots = this._equipmentList
            .filter((item) => item.isAmmo && getCompatibleAmmo(weapon, item))
            .reduce((sum, ammo) => sum + getWeaponShotsPerTon(weapon, ammo) * ammo.weight, 0);
        if (shots <= 0) return 0;
        return shots / sameWeapons >= 10 ? 1 : 0.75;
    }

    private _asWeaponDamage(weapon: IEquipmentItem): number[] {
        const as = weapon.alphaStrike;
        if (!as) return [0, 0, 0, 0];
        const multiplier = this._asAmmoMultiplier(weapon) * (this.hasTargetingComputer() && as.tc ? 1.1 : 1);
        return [as.rangeShort || 0, as.rangeMedium || 0, as.rangeLong || 0, as.rangeExtreme || 0].map((value) => value * multiplier);
    }

    private _asSum(weapons: IEquipmentItem[]): number[] {
        return weapons.reduce((sum, weapon) => {
            const damage = this._asWeaponDamage(weapon);
            return sum.map((value, index) => value + damage[index]);
        }, [0, 0, 0, 0]);
    }

    // Weapon families that earn their own special ability (LRM, SRM, AC, IF), from the catalog notes.
    private static _asFamily(weapon: IEquipmentItem, family: "LRM" | "SRM" | "AC" | "IF"): boolean {
        const notes = weapon.alphaStrike?.notes ?? [];
        if (family === "IF") return notes.includes("Indirect Fire");
        if (family === "AC") return notes.some((note) => note.toLowerCase() === "ac");
        return notes.includes(family);
    }

    // LRM/SRM/AC specials need at least 1 medium-range damage; IF needs long-range damage.
    private _asFamilySpecials(weapons: IEquipmentItem[]): string[] {
        const specials: string[] = [];
        for (const family of ["IF", "LRM", "SRM", "AC"] as const) {
            const damage = this._asSum(weapons.filter((weapon) => Vehicle._asFamily(weapon, family)));
            if (family === "IF") {
                if (damage[2] > 0) specials.push(`IF${Vehicle._asVector([damage[2]], "normalNoMinimal").replace("-", "0")}`);
            } else if (Vehicle._roundUpToTenth(damage[1]) >= 1) {
                specials.push(`${family}${Vehicle._asVector(family === "SRM" ? damage.slice(0, 2) : damage.slice(0, 3), "normalNoMinimal")}`);
            }
        }
        return specials;
    }

    public getAlphaStrikeArmor(): number {
        const modifiers: Record<string, number> = { hardened: 2, "ferro-lamellor": 1.2, commercial: 0.5 };
        const points = this.getLocations().reduce((sum, loc) => sum + (this._armorAllocation[loc.tag] ?? 0), 0)
            * (modifiers[this._armorType.tag] ?? 1);
        const modularPacks = this._equipmentList.filter((item) => item.isModularArmor).length;
        return Math.round((points + 10 * modularPacks) / 30);
    }

    public getAlphaStrikeStructure(): number {
        const structure = this.getStructureAllocation();
        const points = this.getLocations().reduce((sum, loc) => sum + (structure[loc.tag] ?? 0), 0);
        return Math.ceil(points / 10);
    }

    public getAlphaStrikeDamage(): { short: number; medium: number; long: number; extreme: number } {
        const values = this.getAlphaStrikeStats().damageValues;
        return { short: values.short.damage, medium: values.medium.damage, long: values.long.damage, extreme: values.extreme.damage };
    }

    public getAlphaStrikeStats(): IVehicleAlphaStrikeStats {
        let log = "";
        const weapons = this._equipmentList.filter((item) => !item.isAmmo && item.alphaStrike
            && ((item.alphaStrike.rangeShort || 0) + (item.alphaStrike.rangeMedium || 0) + (item.alphaStrike.rangeLong || 0) + (item.alphaStrike.rangeExtreme || 0)) > 0);
        const standardWeapons = weapons.filter((item) => item.location !== "rear");
        const rearWeapons = weapons.filter((item) => item.location === "rear");
        const turretWeapons = weapons.filter((item) => item.location === "turret" || item.location === "turret2");

        const standardRaw = this._asSum(standardWeapons);
        const [short, medium, long, extreme] = standardRaw.map((raw) => Vehicle._asDamage(raw));
        log += `Standard damage (all but rear weapons): ${standardRaw.map((raw) => raw.toFixed(2)).join("/")} -> ${[short, medium, long].map(formatVehicleASDamage).join("/")}<br />`;

        const specials: string[] = [];
        specials.push(...this._asFamilySpecials(standardWeapons));
        if (rearWeapons.length) {
            specials.push(`REAR${Vehicle._asVector(this._asSum(rearWeapons).slice(0, 3), "normal")}`);
        }
        if (turretWeapons.length) {
            const turretSpecials = this._asFamilySpecials(turretWeapons);
            specials.push(`TUR(${[Vehicle._asVector(this._asSum(turretWeapons).slice(0, 3), "up"), ...turretSpecials].join(",")})`);
        }
        if (this._engineType.tag === "ice") specials.push("EE");
        if (this._engineType.tag === "cell") specials.push("FC");
        specials.push("SRCH");
        if (this._troopSpace > 0) specials.push(`IT${this._troopSpace}`);
        if (this._motiveType.hasRotor) specials.push("ATMO");
        const equipmentSpecials = new Set<string>();
        for (const item of this._equipmentList) {
            if (item.isAmmo) continue;
            for (const code of item.alphaStrike?.specialAbility ?? []) {
                if (!code.includes("#")) equipmentSpecials.add(code);
            }
        }
        specials.push(...equipmentSpecials);
        specials.sort();

        const size = this.getAlphaStrikeSize();
        const move = this.getAlphaStrikeMovement();
        const jumpMove = this._jumpMP * 2;
        const tmm = Vehicle.alphaStrikeTMM(move);
        const armor = this.getAlphaStrikeArmor();
        const structure = this.getAlphaStrikeStructure();
        log += `Size ${size}, Move ${move}"${this.getAlphaStrikeMovementType()}${jumpMove ? ` / ${jumpMove}"j` : ""}, TMM ${tmm}, Armor ${armor}, Structure ${structure}<br />`;

        // Point Value (ASC, as implemented by MegaMek ASPointValueConverter for ground units).
        const pvDamage = (value: IVehicleASDamageValue) => (value.minimal ? 0.5 : value.damage);
        let offensive = pvDamage(short) + 2 * pvDamage(medium) + pvDamage(long);
        const ifSpecial = specials.find((code) => /^IF/.test(code));
        if (ifSpecial) offensive += +ifSpecial.slice(2) || 0;
        log += `Offensive value: S + 2M + L${ifSpecial ? " + IF" : ""} = ${offensive}<br />`;

        const highestMove = Math.max(move, jumpMove);
        let defensive = 0.125 * highestMove + (jumpMove > 0 ? 0.5 : 0);
        if (equipmentSpecials.has("AMS")) defensive += 1;
        const armorMultiplier = ["t", "n", "s"].includes(this._motiveType.alphaStrikeMove) ? 1.8
            : ["h", "w"].includes(this._motiveType.alphaStrikeMove) ? 1.7 : 1.5;
        let dir = armor * armorMultiplier + structure;
        const airborne = ["v", "g"].includes(this._motiveType.alphaStrikeMove);
        const jumpBonus = jumpMove > 0 && !(short.damage || medium.damage || long.damage || short.minimal || medium.minimal || long.minimal) ? 1 : 0;
        const defenseModifier = tmm + jumpBonus + (airborne ? 1 : 0);
        const defenseFactor = 1 + (defenseModifier <= 2 ? 0.1 : 0.25) * defenseModifier;
        dir = 0.5 * Math.round(dir * defenseFactor * 2);
        defensive += dir;
        log += `Defensive value: 0.125 x ${highestMove}" + DIR (${armor} x ${armorMultiplier} + ${structure}) x ${defenseFactor} = ${defensive}<br />`;

        let subtotal = offensive + defensive;
        const roundToHalf = (value: number) => 0.5 * Math.round(value * 2);
        // Agile bonus.
        let agile = 0;
        if (tmm > 1) {
            if (pvDamage(medium) > 0) agile = (tmm - 1) * pvDamage(medium);
            else if (tmm >= 3) agile = (tmm - 2) * pvDamage(short);
        }
        // Brawler malus: short-range-only (or short/medium-only when slow) units.
        let brawler = 0;
        if (highestMove >= 2 && !equipmentSpecials.has("ECM") && !equipmentSpecials.has("AECM")) {
            const onlyShort = pvDamage(medium) + pvDamage(long) === 0 && pvDamage(short) > 0;
            const onlyShortMedium = pvDamage(long) === 0 && pvDamage(short) + pvDamage(medium) > 0;
            const multiplier = highestMove >= 6 && highestMove <= 10 && onlyShort ? 0.25
                : highestMove < 6 && onlyShort ? 0.5 : highestMove < 6 && onlyShortMedium ? 0.25 : 0;
            brawler = roundToHalf(multiplier * subtotal);
        }
        subtotal += roundToHalf(agile) - brawler;
        // Force bonuses.
        const forceBonus: Record<string, number> = { AECM: 3, BH: 2, C3RS: 2, ECM: 2, RCN: 2, TRN: 2, LPRB: 1, PRB: 1, LECM: 0.5 };
        for (const code of equipmentSpecials) subtotal += forceBonus[code] ?? 0;
        const pointValue = Math.max(1, Math.round(subtotal));
        log += `Agile +${roundToHalf(agile)}, Brawler -${brawler}; Point Value ${pointValue} (provisional)<br />`;

        return {
            size,
            movement: move,
            movementType: this.getAlphaStrikeMovementType(),
            jumpMovement: jumpMove,
            tmm,
            damage: { short: short.damage, medium: medium.damage, long: long.damage, extreme: extreme.damage },
            damageValues: { short, medium, long, extreme },
            armor,
            structure,
            overheat: 0,
            pointValue,
            specialAbilities: specials,
            calcLog: log,
        };
    }

    /** The converted Alpha Strike card, built the same way as a Master Unit List record. */
    public getAlphaStrikeUnit(): AlphaStrikeUnit {
        const stats = this.getAlphaStrikeStats();
        const damage = stats.damageValues;
        const move = `${stats.movement}"${stats.movementType}` + (stats.jumpMovement ? `/${stats.jumpMovement}"j` : "");
        const record = {
            Id: 0,
            Name: `${this._name} ${this._model}`.trim() || "Combat Vehicle",
            Class: this._name,
            Variant: this._model,
            Tonnage: this._tonnage,
            Cost: this.getCBillCost(),
            BattleValue: this.getBattleValue(),
            BFType: "CV",
            BFSize: stats.size,
            BFMove: move,
            BFTMM: stats.tmm,
            BFArmor: stats.armor,
            BFStructure: stats.structure,
            BFThreshold: 0,
            BFDamageShort: damage.short.damage,
            BFDamageMedium: damage.medium.damage,
            BFDamageLong: damage.long.damage,
            BFDamageExtreme: damage.extreme.damage,
            BFDamageShortMin: damage.short.minimal,
            BFDamageMediumMin: damage.medium.minimal,
            BFDamageLongMin: damage.long.minimal,
            BFDamageExtremeMin: damage.extreme.minimal,
            BFOverheat: 0,
            BFPointValue: stats.pointValue,
            BFAbilities: stats.specialAbilities.join(","),
            Role: { Id: 0, Name: "None", Image: null, SortOrder: 0 },
            Technology: { Id: 0, Name: this._tech.name, Image: null, SortOrder: 0 },
            Type: { Id: 19, Name: "Combat Vehicle", Image: null, SortOrder: 0 },
        } as unknown as IASMULUnit;
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        unit.rulesLevel = Math.max(2, this.getRequiredRulesLevel());
        return unit;
    }

    // ---------------------------------------------------------------------------------------
    // Play mode: damage, motive damage and critical hits (TW; effects as implemented by MegaMek)
    // ---------------------------------------------------------------------------------------

    public newUUID(): void {
        this._uuid = generateUUID();
    }

    public getInPlay(): IVehicleInPlay {
        return this._inPlay;
    }

    public resetInPlay(): void {
        this._inPlay = newInPlay();
    }

    public getArmorRemaining(location: VehicleLocation): number {
        return Math.max(0, (this._armorAllocation[location] ?? 0) - (this._inPlay.armorDamage[location] ?? 0));
    }

    public getStructureRemaining(location: VehicleLocation): number {
        return Math.max(0, (this.getStructureAllocation()[location] ?? 0) - (this._inPlay.structureDamage[location] ?? 0));
    }

    /**
     * Applies damage to a location: armor first, then internal structure. Returns what was taken and
     * whether the location's structure is gone.
     */
    public takeDamage(location: VehicleLocation, amount: number): { armor: number; structure: number; locationDestroyed: boolean } {
        const armorTaken = Math.min(this.getArmorRemaining(location), Math.max(0, amount));
        this._inPlay.armorDamage[location] = (this._inPlay.armorDamage[location] ?? 0) + armorTaken;
        const structureTaken = Math.min(this.getStructureRemaining(location), amount - armorTaken);
        this._inPlay.structureDamage[location] = (this._inPlay.structureDamage[location] ?? 0) + structureTaken;
        const locationDestroyed = (this.getStructureAllocation()[location] ?? 0) > 0 && this.getStructureRemaining(location) === 0;
        if (locationDestroyed && (location === "turret" || location === "turret2")) this._inPlay.criticals.turretDestroyed = true;
        return { armor: armorTaken, structure: structureTaken, locationDestroyed };
    }

    // Record sheet pips: clicking pip n marks n+1 points of damage, or clears back to n if already marked.
    public toggleArmorPip(location: VehicleLocation, index: number): void {
        const damage = this._inPlay.armorDamage[location] ?? 0;
        this._inPlay.armorDamage[location] = Math.min(this._armorAllocation[location] ?? 0, damage > index ? index : index + 1);
    }

    public toggleStructurePip(location: VehicleLocation, index: number): void {
        const damage = this._inPlay.structureDamage[location] ?? 0;
        this._inPlay.structureDamage[location] = Math.min(this.getStructureAllocation()[location] ?? 0, damage > index ? index : index + 1);
    }

    public getTotalArmorPoints(): number {
        return this.getLocations().reduce((sum, loc) => sum + (this._armorAllocation[loc.tag] ?? 0), 0);
    }

    public getCurrentArmor(): number {
        return this.getLocations().reduce((sum, loc) => sum + this.getArmorRemaining(loc.tag), 0);
    }

    public getTotalStructurePoints(): number {
        const structure = this.getStructureAllocation();
        return this.getLocations().reduce((sum, loc) => sum + (structure[loc.tag] ?? 0), 0);
    }

    public getCurrentStructure(): number {
        return this.getLocations().reduce((sum, loc) => sum + this.getStructureRemaining(loc.tag), 0);
    }

    public getArmorPercentage(): number {
        const total = this.getTotalArmorPoints();
        return total > 0 ? Math.round(this.getCurrentArmor() / total * 100) : 0;
    }

    public getStructurePercentage(): number {
        const total = this.getTotalStructurePoints();
        return total > 0 ? Math.round(this.getCurrentStructure() / total * 100) : 0;
    }

    /** True once the vehicle has taken any damage, motive damage or critical hit. */
    public isDamaged(): boolean {
        const crits = this._inPlay.criticals;
        return this.getCurrentArmor() < this.getTotalArmorPoints()
            || this.getCurrentStructure() < this.getTotalStructurePoints()
            || Object.values(this._inPlay.motiveDamage).some((hit) => hit)
            || Object.entries(crits).some(([key, value]) => key === "stabilizers" ? (value as VehicleLocation[]).length > 0 : !!value)
            || this._inPlay.jammedWeapons.length > 0 || this._inPlay.destroyedWeapons.length > 0;
    }

    public setMotiveDamage(level: keyof IVehicleMotiveDamage, damaged: boolean): void {
        this._inPlay.motiveDamage[level] = damaged;
    }

    public setCriticalHit(critical: Exclude<keyof IVehicleCriticalHits, "sensorHits" | "stabilizers">, hit: boolean): void {
        this._inPlay.criticals[critical] = hit;
    }

    public setSensorHits(hits: number): void {
        this._inPlay.criticals.sensorHits = Math.max(0, Math.min(VEHICLE_MAX_SENSOR_HITS, Math.floor(hits)));
    }

    public setStabilizerHit(location: VehicleLocation, hit: boolean): void {
        const stabilizers = this._inPlay.criticals.stabilizers.filter((loc) => loc !== location);
        this._inPlay.criticals.stabilizers = hit ? [...stabilizers, location] : stabilizers;
    }

    public setWeaponStatus(uuid: string, status: "ok" | "jammed" | "destroyed"): void {
        this._inPlay.jammedWeapons = this._inPlay.jammedWeapons.filter((id) => id !== uuid);
        this._inPlay.destroyedWeapons = this._inPlay.destroyedWeapons.filter((id) => id !== uuid);
        if (status === "jammed") this._inPlay.jammedWeapons.push(uuid);
        if (status === "destroyed") this._inPlay.destroyedWeapons.push(uuid);
    }

    public getWeaponStatus(uuid: string | undefined): "ok" | "jammed" | "destroyed" {
        if (!uuid) return "ok";
        if (this._inPlay.destroyedWeapons.includes(uuid)) return "destroyed";
        if (this._inPlay.jammedWeapons.includes(uuid)) return "jammed";
        return "ok";
    }

    public setMovement(mode: VehicleMovementMode, hexesMoved: number = 0): void {
        this._inPlay.movementMode = mode;
        this._inPlay.hexesMoved = Math.max(0, Math.floor(hexesMoved));
    }

    /** Start of a new turn: the vehicle has not moved yet. */
    public turnReset(): void {
        this.setMovement("stationary", 0);
    }

    /** Destroyed: a body location (not a turret or rotor) has lost all its structure, or the crew is killed. */
    public isDestroyed(): boolean {
        if (this._inPlay.criticals.crewKilled) return true;
        return this.getLocations().some((loc) => loc.tag !== "turret" && loc.tag !== "turret2" && loc.tag !== "rotor"
            && (this.getStructureAllocation()[loc.tag] ?? 0) > 0 && this.getStructureRemaining(loc.tag) === 0);
    }

    /** A VTOL whose rotor is destroyed, or that is immobilized, crashes. */
    public isCrashed(): boolean {
        return !!this._motiveType.hasRotor && (this.getStructureRemaining("rotor") === 0 || this.isImmobile());
    }

    /** Immobile: immobilizing motive damage, an engine hit, or a dead crew (as implemented by MegaMek). */
    public isImmobile(): boolean {
        return this._inPlay.motiveDamage.immobilized || this._inPlay.criticals.engineHit || this._inPlay.criticals.crewKilled;
    }

    /**
     * Cruise MP after motive damage: moderate -1, heavy halves what is left (rounded up), immobilized 0
     * (as implemented by MegaMek Tank.addMovementDamage).
     */
    public getEffectiveCruiseMP(): number {
        if (this.isImmobile()) return 0;
        let mp = this.getCruiseMP();
        if (this._inPlay.motiveDamage.moderate) mp = Math.max(0, mp - 1);
        if (this._inPlay.motiveDamage.heavy) mp = Math.ceil(mp / 2);
        return mp;
    }

    public getEffectiveFlankMP(): number {
        return Math.ceil(this.getEffectiveCruiseMP() * 1.5);
    }

    public getEffectiveJumpMP(): number {
        return this.isImmobile() ? 0 : this._jumpMP;
    }

    /** Driving skill roll modifier: motive damage +1/+2/+3, driver hit +2, VTOL rotor stabilizer +3. */
    public getDrivingModifier(): number {
        const motive = this._inPlay.motiveDamage;
        let modifier = (motive.minor ? 1 : 0) + (motive.moderate ? 2 : 0) + (motive.heavy ? 3 : 0);
        if (this._inPlay.criticals.driverHit) modifier += 2;
        if (this._motiveType.hasRotor && this._inPlay.criticals.stabilizers.includes("rotor")) modifier += 3;
        return modifier;
    }

    /** Attacker movement modifier: stationary 0, cruise +1, flank +2, jump +3 (TW). */
    public getAttackerMovementModifier(): number {
        switch (this._inPlay.movementMode) {
            case "cruise": return 1;
            case "flank": return 2;
            case "jump": return 3;
            default: return 0;
        }
    }

    /** Target movement modifier from hexes moved (+1 jumping, +1 airborne VTOL/WiGE). */
    public getTargetMovementModifier(): number {
        const mode = this._inPlay.movementMode;
        if (mode === "stationary") return 0;
        let modifier = getMovementModifier(this._inPlay.hexesMoved);
        if (mode === "jump") modifier += 1;
        if (this._motiveType.hasRotor || this._motiveType.tag === "wige") modifier += 1;
        return modifier;
    }

    /**
     * To-hit modifiers for one of this vehicle's weapons: movement, sensor hits (+1 each), commander
     * hit (+1), and a stabilizer hit in the weapon's location (movement modifier again). With 4 sensor
     * hits the vehicle cannot fire (as implemented by MegaMek ComputeAttackerToHitMods).
     */
    public getWeaponToHitModifier(weapon: IEquipmentItem): number | null {
        if (this._inPlay.criticals.sensorHits >= VEHICLE_MAX_SENSOR_HITS || this._inPlay.criticals.crewStunned) return null;
        const status = this.getWeaponStatus(weapon.uuid);
        if (status !== "ok") return null;
        if ((weapon.location === "turret" || weapon.location === "turret2") && this._inPlay.criticals.turretDestroyed) return null;
        let modifier = this.getAttackerMovementModifier() + this._inPlay.criticals.sensorHits;
        if (this._inPlay.criticals.commanderHit) modifier += 1;
        if (weapon.location && this._inPlay.criticals.stabilizers.includes(weapon.location as VehicleLocation)) {
            modifier += this.getAttackerMovementModifier();
        }
        return modifier;
    }

    /** Battle Value adjusted for gunnery and driving skill (TM p. 305 skill multipliers, as for 'Mechs). */
    public getPilotAdjustedBattleValue(): number {
        const gunnery = this._pilot?.gunnery ?? 4;
        const piloting = this._pilot?.piloting ?? 5;
        const multiplier = getSkillMultiplier(gunnery, piloting) ?? 1;
        return Math.round(this._battleValue * multiplier);
    }

    public export(noInPlayVariables: boolean = false): IVehicleExport {
        return {
            uuid: this._uuid,
            lastUpdated: this.lastUpdated,
            name: this._name,
            model: this._model,
            nickname: this._nickname,
            tonnage: this._tonnage,
            motiveType: this._motiveType.tag,
            hasTurret: this._hasTurret,
            dualTurret: this._dualTurret,
            jumpMP: this._jumpMP,
            troopSpace: this._troopSpace || undefined,
            tech: this._tech.tag,
            era: this._era.tag,
            engineType: this._engineType.tag,
            cruiseMP: this._cruiseMP,
            armorType: this._armorType.tag,
            armorAllocation: this._armorAllocation,
            structureType: this._structureType,
            heatSinkType: this._heatSinkType.tag,
            additionalHeatSinks: this._additionalHeatSinks,
            equipment: this._equipmentList.map((item) => ({
                tag: item.tag,
                location: item.location,
                rear: item.rear,
                uuid: item.uuid,
                currentAmmo: item.currentAmmo,
                selectedAmmoBinUUID: item.selectedAmmoBinUUID,
                currentAdditionalArmor: item.currentAdditionalArmor,
            })),
            pilot: this._pilot.export(),
            inPlay: noInPlayVariables ? undefined : this._inPlay,
        };
    }

    public exportJSON(): string {
        return JSON.stringify(this.export());
    }

    public importJSON(json: string) {
        try {
            const importObject: IVehicleExport = JSON.parse(json);
            this._uuid = importObject.uuid || generateUUID();
            this.lastUpdated = importObject.lastUpdated ? new Date(importObject.lastUpdated) : new Date();
            this._name = importObject.name || "";
            this._model = importObject.model || "";
            this._nickname = importObject.nickname || "";
            this._tonnage = importObject.tonnage || 20;
            this._motiveType = getVehicleMotiveType(importObject.motiveType);
            this._hasTurret = importObject.hasTurret ?? true;
            this._dualTurret = !!importObject.dualTurret && this._hasTurret;
            this._jumpMP = importObject.jumpMP || 0;
            this._troopSpace = importObject.troopSpace || 0;
            const inPlay = newInPlay();
            this._inPlay = importObject.inPlay
                ? { ...inPlay, ...importObject.inPlay, criticals: { ...inPlay.criticals, ...importObject.inPlay.criticals },
                    motiveDamage: { ...inPlay.motiveDamage, ...importObject.inPlay.motiveDamage } }
                : inPlay;
            this.setTech(importObject.tech);
            this.setEra(importObject.era);
            this.setEngineType(importObject.engineType);
            this._cruiseMP = importObject.cruiseMP || 0;
            this.setArmorType(importObject.armorType);
            this._armorAllocation = { ...emptyArmorAllocation(), ...(importObject.armorAllocation || {}) };
            this._structureType = importObject.structureType || "standard";
            this.setHeatSinkType(importObject.heatSinkType);
            this._additionalHeatSinks = importObject.additionalHeatSinks || 0;
            if (importObject.pilot) {
                this._pilot = new Pilot(importObject.pilot);
            }
            this._equipmentList = [];
            for (const equipmentItem of importObject.equipment || []) {
                this.addEquipmentFromTag(equipmentItem.tag, equipmentItem.location, equipmentItem.rear, equipmentItem.uuid);
                const restoredItem = this._equipmentList.find(item => item.uuid === equipmentItem.uuid);
                if (restoredItem && typeof equipmentItem.currentAdditionalArmor === "number") {
                    restoredItem.currentAdditionalArmor = equipmentItem.currentAdditionalArmor;
                }
            }
        } catch (error) {
            console.error("Vehicle importJSON failed:", error);
        }
    }
}
