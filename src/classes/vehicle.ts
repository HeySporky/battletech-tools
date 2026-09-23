import { generateUUID } from "../utils/generateUUID";
import Pilot, { IPilot } from "./pilot";
import { mechArmorTypes } from "../data/mech-armor-types";
import { mechEngineOptions } from "../data/mech-engine-options";
import { mechEngineTypes } from "../data/mech-engine-types";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { btTechOptions } from "../data/tech-options";
import { btEraOptions } from "../data/era-options";
import { getVehicleMotiveType, vehicleMotiveTypes } from "../data/vehicle-motive-types";
import { getEquipmentListByTech } from "../data/equipment-registry";
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

export interface IVehicleAlphaStrikeStats {
    size: number;
    movement: number;
    movementType: string;
    damage: { short: number; medium: number; long: number; extreme: number };
    armor: number | null;
    structure: number | null;
    overheat: number | null;
    pointValue: number | null;
}

export interface IVehicleExport {
    uuid: string;
    lastUpdated: Date;
    name: string;
    model: string;
    nickname: string;
    tonnage: number;
    motiveType: string;
    hasTurret: boolean;
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
}

// Combat Vehicle internal structure weighs the same 10%/20% of tonnage as 'Mech structure,
// just without the per-location tonnage table (vehicles split points evenly per location instead).
const VEHICLE_STRUCTURE_MULTIPLIERS: Record<string, number> = {
    standard: 0.1,
    reinforced: 0.2,
};

export default class Vehicle {
    private _uuid: string = generateUUID();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _model: string = "";
    private _nickname: string = "";

    private _tonnage: number = 20;
    private _motiveType: IVehicleMotiveType = vehicleMotiveTypes[0];
    private _hasTurret: boolean = true;

    private _tech: ITechOptions = btTechOptions[0];
    private _era: IEras = btEraOptions[0];

    private _engineType: IEngineType = mechEngineTypes[0];
    private _cruiseMP: number = 3;

    private _armorType: IArmorType = mechArmorTypes[0];
    private _armorAllocation: IVehicleArmorAllocation = { front: 0, left: 0, right: 0, rear: 0, turret: 0 };

    private _structureType: string = "standard";

    private _heatSinkType: IHeatSync = mechHeatSinkTypes[0];
    private _additionalHeatSinks: number = 0;

    private _equipmentList: IEquipmentItem[] = [];
    private _pilot: Pilot = new Pilot();

    private _weights: { name: string; weight: number }[] = [];
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
        this._calc();
        return this._tonnage;
    }

    public getMotiveType(): IVehicleMotiveType {
        return this._motiveType;
    }

    public setMotiveType(motiveTag: string): IVehicleMotiveType {
        this._motiveType = getVehicleMotiveType(motiveTag);
        // Naval hulls have no exposed turret facing to allocate armor against by default.
        if (this._motiveType.tag === "naval-surface" || this._motiveType.tag === "naval-sub") {
            this._hasTurret = false;
        }
        this._calc();
        return this._motiveType;
    }

    public hasTurret(): boolean {
        return this._hasTurret;
    }

    public setHasTurret(hasTurret: boolean): boolean {
        this._hasTurret = hasTurret;
        this._calc();
        return this._hasTurret;
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

    // NOTE: rating = tonnage x Cruise MP mirrors the 'Mech walk-MP formula (TechManual).
    // Motive-type-specific efficiency modifiers (e.g. Hover/Wheeled getting "free" MP) are not
    // yet modeled here and should be verified before this is treated as construction-final.
    public setCruiseMP(cruiseMP: number): number {
        this._cruiseMP = Math.max(0, cruiseMP);
        this._calc();
        return this._cruiseMP;
    }

    public getFlankMP(): number {
        return Math.ceil(this.getCruiseMP() * 1.5);
    }

    public getEngineRating(): number {
        return Math.ceil(this._tonnage * this._cruiseMP);
    }

    public getEngineWeight(): number {
        const requiredRating = this.getEngineRating();
        const engineOption = mechEngineOptions.find((option) => option.rating >= requiredRating)
            ?? mechEngineOptions[mechEngineOptions.length - 1];
        const engineTag = this._engineType.tag as keyof typeof engineOption.weight;
        return engineOption.weight[engineTag] ?? engineOption.weight.standard;
    }

    public getArmorType(): IArmorType {
        return this._armorType;
    }

    public getAvailableArmorTypes(): IArmorType[] {
        const techTag = this.getTech().tag;
        const isMixed = techTag === "mis" || techTag === "mclan";
        return mechArmorTypes.filter((armor) => armor.unitTypes.combatVehicle
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
        const maxForLocation = this.getMaxArmorAllocation()[location];
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
        const totalPoints = Object.values(this._armorAllocation).reduce((sum, points) => sum + points, 0);
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
        this._armorAllocation = { front: 0, left: 0, right: 0, rear: 0, turret: 0 };
        this._calc();
    }

    private _distributeArmorPoints(targetPoints: number): void {
        const locations: (keyof IVehicleArmorAllocation)[] = this._hasTurret
            ? ["front", "left", "right", "rear", "turret"]
            : ["front", "left", "right", "rear"];
        const currentTotal = locations.reduce((sum, loc) => sum + this._armorAllocation[loc], 0);
        const nextAllocation: IVehicleArmorAllocation = { front: 0, left: 0, right: 0, rear: 0, turret: 0 };

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
                const share = Math.floor((targetPoints * this._armorAllocation[loc]) / currentTotal);
                nextAllocation[loc] = share;
                assigned += share;
            }
            nextAllocation.front += targetPoints - assigned;
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

    public getStructureWeight(): number {
        const multiplier = VEHICLE_STRUCTURE_MULTIPLIERS[this._structureType] ?? 0.1;
        return Math.ceil(this._tonnage * multiplier * 2) / 2;
    }

    // Combat Vehicle Internal Structure Table (TechManual): 1 point per 10 tons, rounded normally,
    // minimum 1, applied uniformly to every location including the turret.
    public getStructureAllocation(): IVehicleStructureAllocation {
        const pointsPerLocation = Math.max(1, Math.round(this._tonnage / 10));
        return {
            front: pointsPerLocation,
            left: pointsPerLocation,
            right: pointsPerLocation,
            rear: pointsPerLocation,
            turret: this._hasTurret ? pointsPerLocation : 0,
        };
    }

    // Any single location can use up the vehicle's total armor point budget, minus whatever is
    // already allocated to the other locations - there is no separate per-location subcap.
    public getMaxArmorAllocation(): IVehicleArmorAllocation {
        const maxPoints = this.getMaxArmorPoints();
        const locations: (keyof IVehicleArmorAllocation)[] = ["front", "left", "right", "rear", "turret"];
        const result: IVehicleArmorAllocation = { front: 0, left: 0, right: 0, rear: 0, turret: 0 };
        for (const loc of locations) {
            const othersTotal = locations.reduce((sum, l) => sum + (l === loc ? 0 : this._armorAllocation[l]), 0);
            result[loc] = Math.max(0, maxPoints - othersTotal);
        }
        return result;
    }

    public getHeatSinkType(): IHeatSync {
        return this._heatSinkType;
    }

    public setHeatSinkType(tag: string): IHeatSync {
        this._heatSinkType = mechHeatSinkTypes.find((h) => h.tag === tag) ?? this._heatSinkType;
        this._calc();
        return this._heatSinkType;
    }

    public getAdditionalHeatSinks(): number {
        return this._additionalHeatSinks;
    }

    // Unlike 'Mechs, Combat Vehicles get no free heat sinks - every one mounted must be bought and weighed.
    public setAdditionalHeatSinks(count: number): number {
        this._additionalHeatSinks = Math.max(0, count);
        this._calc();
        return this._additionalHeatSinks;
    }

    // Every Combat Vehicle heat sink weighs 1 ton regardless of type; dissipation (not weight) differs by type.
    public getHeatSinkWeight(): number {
        return this._additionalHeatSinks;
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

    public getAvailableEquipment(includeCustom: boolean = false): IEquipmentItem[] {
        const returnItems: IEquipmentItem[] = [];
        const techTag = this._tech.tag;
        const clanAvailability = techTag === "clan" || techTag === "mclan";
        const includeClan = ["clan", "mclan", "mis"].includes(techTag);
        const includeIS = ["is", "mis", "mclan"].includes(techTag);

        if (includeClan) {
            for (const item of getEquipmentListByTech("clan", includeCustom && !includeIS)) {
                item.catalog = item.catalog ?? (item.category === "Custom Equipment" ? "custom" : "clan");
                item.criticals = item.space.combatVehicle;
                item.available = this._itemIsAvailable(item.introduced, item.extinct, item.reintroduced, clanAvailability) && this._isEquipmentAllowedForVehicle(item);
                returnItems.push(item);
            }
        }
        if (includeIS) {
            for (const item of getEquipmentListByTech("is", includeCustom)) {
                item.catalog = item.catalog ?? (item.category === "Custom Equipment" ? "custom" : "is");
                item.criticals = item.space.combatVehicle;
                item.available = this._itemIsAvailable(item.introduced, item.extinct, item.reintroduced) && this._isEquipmentAllowedForVehicle(item);
                returnItems.push(item);
            }
        }
        returnItems.sort((a, b) => (a.sort > b.sort ? 1 : a.sort < b.sort ? -1 : 0));
        return returnItems;
    }

    public getAvailableEquipmentByCatalog(catalog: "all" | "is" | "clan" | "custom", includeCustom: boolean = false): IEquipmentItem[] {
        const equipment = this.getAvailableEquipment(includeCustom);
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

    private _calc() {
        this._weights = [];

        this._weights.push({ name: "Internal Structure", weight: this.getStructureWeight() });
        this._weights.push({ name: this._engineType.name, weight: this.getEngineWeight() });
        this._weights.push({ name: "Armor", weight: this.getArmorWeight() });

        if (this._additionalHeatSinks > 0) {
            this._weights.push({ name: `${this._heatSinkType.name} Heat Sinks`, weight: this._additionalHeatSinks });
        }

        if (this._hasTurret) {
            // Turret basket mass: 10% of the combined weight of turret-mounted equipment,
            // rounded up to the nearest half-ton, minimum half a ton (TechManual).
            const turretEquipmentWeight = this._equipmentList
                .filter((item) => item.location === "turret")
                .reduce((sum, item) => sum + item.weight, 0);
            this._weights.push({ name: "Turret", weight: Math.max(0.5, Math.ceil(turretEquipmentWeight * 0.1 * 2) / 2) });
        }

        for (const item of this._equipmentList) {
            this._weights.push({ name: item.name, weight: item.weight });
        }

        this._currentTonnage = this._weights.reduce((sum, w) => sum + w.weight, 0);
        this._remainingTonnage = this._tonnage - this._currentTonnage;
    }

    // Alpha Strike Size bands for ground Combat Vehicles (Alpha Strike Companion).
    public getAlphaStrikeSize(): number {
        if (this._tonnage >= 100) return 4;
        if (this._tonnage >= 60) return 3;
        if (this._tonnage >= 40) return 2;
        return 1;
    }

    // Movement type suffix used on the AS card (e.g. "8h" for an 8" Hover unit). Tracked/Wheeled
    // ground vehicles carry no suffix, same as 'Mechs. VTOL/WiGE suffixes are unconfirmed pending
    // a rules pass - verify against the Alpha Strike Companion before treating them as final.
    public getAlphaStrikeMovementType(): string {
        switch (this._motiveType.tag) {
            case "hover": return "h";
            case "naval-surface": return "n";
            case "naval-sub": return "s";
            case "vtol": return "a"; // TODO: verify VTOL movement suffix
            case "wige": return "g"; // TODO: verify WiGE movement suffix
            default: return "";
        }
    }

    // AS ground movement conversion: 1 Cruise MP = 2".
    public getAlphaStrikeMovement(): number {
        return this._cruiseMP * 2;
    }

    // Sums each mounted item's precomputed Alpha Strike damage (rear-mounted weapons are excluded
    // from the front arc total). Armor/Structure/Overheat/Point Value conversion for Combat Vehicles
    // is not yet implemented - see TODO.md Phase 2 "Add Alpha Strike conversion for each vehicle category".
    public getAlphaStrikeDamage(): { short: number; medium: number; long: number; extreme: number } {
        const totals = { short: 0, medium: 0, long: 0, extreme: 0 };
        for (const item of this._equipmentList) {
            if (item.rear || !item.alphaStrike) continue;
            totals.short += item.alphaStrike.rangeShort || 0;
            totals.medium += item.alphaStrike.rangeMedium || 0;
            totals.long += item.alphaStrike.rangeLong || 0;
            totals.extreme += item.alphaStrike.rangeExtreme || 0;
        }
        return {
            short: Math.round(totals.short),
            medium: Math.round(totals.medium),
            long: Math.round(totals.long),
            extreme: Math.round(totals.extreme),
        };
    }

    public getAlphaStrikeStats(): IVehicleAlphaStrikeStats {
        return {
            size: this.getAlphaStrikeSize(),
            movement: this.getAlphaStrikeMovement(),
            movementType: this.getAlphaStrikeMovementType(),
            damage: this.getAlphaStrikeDamage(),
            // Pending a verified Combat Vehicle Alpha Strike conversion table (TODO.md Phase 2).
            armor: null,
            structure: null,
            overheat: null,
            pointValue: null,
        };
    }

    public export(): IVehicleExport {
        return {
            uuid: this._uuid,
            lastUpdated: this.lastUpdated,
            name: this._name,
            model: this._model,
            nickname: this._nickname,
            tonnage: this._tonnage,
            motiveType: this._motiveType.tag,
            hasTurret: this._hasTurret,
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
            this.setTech(importObject.tech);
            this.setEra(importObject.era);
            this.setEngineType(importObject.engineType);
            this._cruiseMP = importObject.cruiseMP || 0;
            this.setArmorType(importObject.armorType);
            this._armorAllocation = importObject.armorAllocation || { front: 0, left: 0, right: 0, rear: 0, turret: 0 };
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
