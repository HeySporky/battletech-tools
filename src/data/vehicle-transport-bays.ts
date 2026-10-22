// Transport bays on Combat and Support Vehicles (Transport Bay table, TM p.239, as revised by TechManual errata
// v8.0, 2024; prices TM pp.294-295). The bay records are shared with Small Craft (small-craft-construction.ts).
// A ground vehicle's infantry compartments are its troop space; Airship and Fixed-Wing Support Vehicles list them
// as bays (the Dixon's two compartments take a slot apiece, TM p.139).

import { BAY_DOOR_COST, findTransportBayType, ITransportBayType, transportBayTypes } from "./small-craft-construction";

/** One transport bay on a vehicle: for cargo, its tons; otherwise the number of bays or cubicles. */
export interface IVehicleBay {
    tag: string;
    amount: number;
    doors: number;
}

/** Most bay entries read from a save or added in the creator; far above any real design. */
export const MAX_VEHICLE_BAYS = 50;
/** Most bays or cubicles in one entry, and most doors on one bay. */
export const MAX_VEHICLE_BAY_COUNT = 1000;
/** Most tons in one cargo bay entry: the heaviest Large Naval Support Vehicle (TO:AUE p.55). */
export const MAX_VEHICLE_CARGO_TONS = 100000;

/** Bays a ground vehicle can carry: every Transport Bay table row but the infantry compartment, which is troop space. */
export const VEHICLE_BAY_TYPES: ITransportBayType[] = transportBayTypes.filter((type) => type.tag !== "infantry-compartment");
/** Bays an Airship, Fixed-Wing or Satellite Support Vehicle can carry: every row. */
export const AIRCRAFT_BAY_TYPES: ITransportBayType[] = transportBayTypes;

export function getVehicleBayType(tag: string): ITransportBayType | undefined {
    return findTransportBayType(tag);
}

/** Tons: a cargo bay's own figure, or the bay or cubicle weight times the count. */
export function getVehicleBayWeight(bay: IVehicleBay): number {
    const type = getVehicleBayType(bay.tag);
    if (!type) return 0;
    return type.tonsEach === null ? bay.amount : type.tonsEach * bay.amount;
}

/**
 * Item slots: 1 for each distinct bay, 1 per container; all infantry bays of the same type share one slot
 * (TM p.239 as revised by errata v8.0).
 */
export function getVehicleBaySlots(bays: IVehicleBay[]): number {
    const infantryTypes = new Set<string>();
    let slots = 0;
    for (const bay of bays) {
        const type = getVehicleBayType(bay.tag);
        if (!type) continue;
        if (type.tag === "cargo-container") slots += bay.amount;
        else if (type.infantry && type.tag !== "infantry-compartment") infantryTypes.add(type.tag);
        else slots += 1;
    }
    return slots + infantryTypes.size;
}

/** C-bills: by the ton or by the bay as the price table gives it, plus 1,000 for each door (TM pp.294-295). */
export function getVehicleBayCost(bay: IVehicleBay): number {
    const type = getVehicleBayType(bay.tag);
    if (!type) return 0;
    const bayCost = type.costPerTon ? type.cost * getVehicleBayWeight(bay) : type.cost * bay.amount;
    return bayCost + bay.doors * BAY_DOOR_COST;
}

/** Tons of cargo the bay holds after its share is taken off (TM p.239); 0 for a bay that carries units. */
export function getVehicleBayCargoCapacity(bay: IVehicleBay): number {
    const type = getVehicleBayType(bay.tag);
    if (!type) return 0;
    if (type.tag === "cargo-container") return 10 * bay.amount;
    return type.cargoFactor ? getVehicleBayWeight(bay) * type.cargoFactor : 0;
}

/**
 * Alpha Strike transport specials for the bays. Cargo Transport: tons of bay space not given to units, CT# under
 * 1,000 tons and CK# in kilotons from 1,000 (ASC p.122); Infantry Transport: tons of infantry and battle armor bays
 * plus the troop space (ASC p.125). Unit bays give the count of units carried, with their doors: AT fighters, MT
 * 'Mechs, PT ProtoMechs, ST Small Craft, VTM light and VTH heavy vehicles, and MFB (as MegaMek's
 * ASSpecialAbilityConverter assigns them; it gives superheavy vehicle cubicles no special).
 */
export function getVehicleBayAlphaStrikeSpecials(bays: IVehicleBay[], troopSpace: number): string[] {
    const specials: string[] = [];
    const round = (value: number) => Math.round(value * 1000) / 1000;
    const cargoBays = bays.filter((bay) => { const type = getVehicleBayType(bay.tag); return !!type && !type.infantry && (type.cargoFactor !== undefined || type.tag === "cargo-container"); });
    const cargo = round(cargoBays.reduce((sum, bay) => sum + getVehicleBayWeight(bay), 0));
    const cargoDoors = cargoBays.reduce((sum, bay) => sum + bay.doors, 0);
    const doorSuffix = (doors: number) => (doors > 0 ? `-D${doors}` : "");
    if (cargo >= 1000) specials.push(`CK${round(cargo / 1000)}${doorSuffix(cargoDoors)}`);
    else if (cargo > 0) specials.push(`CT${cargo}${doorSuffix(cargoDoors)}`);
    const infantry = bays.filter((bay) => getVehicleBayType(bay.tag)?.infantry).reduce((sum, bay) => sum + getVehicleBayWeight(bay), 0) + troopSpace;
    if (infantry > 0) specials.push(`IT${Math.round(infantry * 10) / 10}`);
    const unitBays: [string, string][] = [["fighter", "AT"], ["mech", "MT"], ["protomech", "PT"], ["small-craft", "ST"], ["vehicle-light", "VTM"], ["vehicle-heavy", "VTH"]];
    let fieldBase = false;
    for (const [tag, code] of unitBays) {
        const matching = bays.filter((bay) => bay.tag === tag);
        if (matching.length === 0) continue;
        // A ProtoMech entry is 5 cubicles; the others one unit each.
        const units = matching.reduce((sum, bay) => sum + bay.amount * (tag === "protomech" ? 5 : 1), 0);
        specials.push(`${code}${units}${doorSuffix(matching.reduce((sum, bay) => sum + bay.doors, 0))}`);
        fieldBase = true;
    }
    if (fieldBase) specials.push("MFB");
    return specials;
}

/** Cleans saved bays: known bay types (ground vehicles without compartments), whole counts and doors, cargo in kilograms. */
export function normalizeVehicleBays(saved: unknown, allowed: ITransportBayType[] = VEHICLE_BAY_TYPES): IVehicleBay[] {
    if (!Array.isArray(saved)) return [];
    const bays: IVehicleBay[] = [];
    for (const entry of saved.slice(0, MAX_VEHICLE_BAYS)) {
        if (typeof entry !== "object" || entry === null) continue;
        const record = entry as Record<string, unknown>;
        const type = typeof record.tag === "string" ? allowed.find((entry) => entry.tag === record.tag) : undefined;
        if (!type) continue;
        const amount = typeof record.amount === "number" && Number.isFinite(record.amount) ? record.amount : 1;
        const doors = typeof record.doors === "number" && Number.isFinite(record.doors) ? record.doors : 0;
        bays.push({
            tag: type.tag,
            amount: type.tonsEach === null
                ? Math.min(MAX_VEHICLE_CARGO_TONS, Math.max(0.001, Math.round(amount * 1000) / 1000))
                : Math.min(MAX_VEHICLE_BAY_COUNT, Math.max(1, Math.floor(amount))),
            doors: Math.min(MAX_VEHICLE_BAY_COUNT, Math.max(0, Math.floor(doors))),
        });
    }
    return bays;
}
