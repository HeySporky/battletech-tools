import { BattleMech } from "../classes/battlemech";
import { generateUUID } from "./generateUUID";
import { tabulate, untabulate } from "./packed-json";
import type { UnitStanding } from "./unit-standing";

// Bundled designs (#241): designs converted at build time from SSW (and later MegaMekLab) files, kept as small as
// they can be and imported only when one is opened. Each carries the few fields the lists and the Master Unit List
// search show, so nothing is imported to list them.

export type BundledDesignSource = "ssw" | "megamek" | "mordel" | "verified";

/** What the lists and the Master Unit List search show of a bundled design, so nothing is imported to list them. */
export interface IBundledDesignHeader {
    /** Place in the type's index; the design is in chunk floor(id / BUNDLED_CHUNK_SIZE). */
    id: number;
    /** Chassis and model, as the Master Unit List search matches them. */
    name: string;
    model: string;
    tons: number;
    bv: number;
    cost: number;
    /** SSW rules level (0 Introductory, 1 Standard, 2 Advanced, 3 Experimental, 4 Era Specific), for the rules filter. */
    rulesLevel: number;
    year: number;
    tech: string;
    /** Master Unit List id the design matched at build time, if any. */
    mulId?: number;
    /** Where the data comes from: a MegaMek design carries its credit until it is checked against its TRO. */
    source: BundledDesignSource;
    /** The design's own page at its source (a mordel.net unit page), linked from the source label. */
    sourceUrl?: string;
    /** An OmniMech's configurations, each its own Master Unit List variant. */
    configs?: { name: string; bv: number; layout?: string }[];
    /** getMechFingerprint of the design, to tell it from a saved design of the same name and model. */
    layout?: string;
    /** Canon unless set: an apocryphal source, or gear at the Custom Homebrew or Munchkin rules level. */
    standing?: UnitStanding;
}

/** A crit table as text, without the UUIDs and object links a reload changes. */
export const describeCriticals = (mech: BattleMech): string =>
    JSON.stringify(mech.getCriticals(), (key, value) => key === "obj" || key === "uuid" ? undefined : value);

/** A design's exact layout: its crit table and armor. */
export const describeLayout = (mech: BattleMech): string => describeCriticals(mech) + JSON.stringify(mech.getArmorAllocation());

// CASE takes no critical hit (TW p.124), like the slots marked "roll again".
const CASE_TAG = /^(clan-|is-)?case(-ii|-prototype)?$/;

/** What the duplicate check compares of a design (the user's rulings, #241). */
export interface IDesignSummary {
    /** The exact crit table and armor. */
    strict: string;
    /** Each location's equipment that can take a critical hit, in name order, heat sinks apart. */
    equipment: [string, string[]][];
    /** Heat sinks in crit slots, by location. */
    heatSinkSlots: Record<string, number>;
    /** Heat sink count and type. */
    heatSinks: string;
    /** Lines that take no critical hit (CASE and the like) other than structure and armor slots, in name order. */
    rollAgain: string[];
    /** Where those lines sit. */
    rollAgainSlots: string;
    armor: string;
    armorType: string;
    armorWeight: number;
}

export function summarizeDesign(mech: BattleMech): IDesignSummary {
    const structural = new Set([mech.getInternalStructureType(), mech.getArmorType()]);
    const equipment: [string, string[]][] = [];
    const heatSinkSlots: Record<string, number> = {};
    const rollAgain: string[] = [];
    const rollAgainSlots: [string, string[]][] = [];
    for (const [loc, slots] of Object.entries(mech.getCriticals())) {
        const items: string[] = [];
        heatSinkSlots[loc] = 0;
        for (const slot of slots as ({ name?: string; tag?: string; rollAgain?: boolean } | null)[]) {
            if (!slot?.name || structural.has(slot.tag ?? "")) continue;
            if (slot.tag === "heat-sink") heatSinkSlots[loc]++;
            else if (slot.rollAgain || CASE_TAG.test(slot.tag ?? "")) {
                rollAgain.push(slot.name);
                rollAgainSlots.push([loc, [slot.name]]);
            } else items.push(slot.name);
        }
        equipment.push([loc, items.sort()]);
    }
    return {
        strict: describeLayout(mech), equipment, heatSinkSlots, heatSinks: mech.getHeatSinks() + " " + mech.getHeatSinksObj()?.tag,
        rollAgain: rollAgain.sort(), rollAgainSlots: JSON.stringify(rollAgainSlots), armor: JSON.stringify(mech.getArmorAllocation()), armorType: mech.getArmorType(), armorWeight: mech.getArmorWeight(),
    };
}

/**
 * Whether two designs of the same name and model are one (the user's rulings, #241): the same equipment in another
 * slot of its location, structure and armor slots or CASE anywhere, engine heat sinks shown in crit slots or not, and
 * armor spread differently over the same tonnage are the same design. Another ammo type, actuators, equipment added,
 * dropped or moved to another location, or another armor tonnage is a different submodel. `why` names the first
 * difference that makes it one, or what the duplicate differs in.
 */
export function compareDesigns(kept: IDesignSummary, other: IDesignSummary): { duplicate: boolean; why: string } {
    if (kept.strict === other.strict) return { duplicate: true, why: "" };
    const kinds = new Set<string>();
    kept.equipment.forEach(([loc, items], index) => {
        const theirs = [...(other.equipment[index]?.[0] === loc ? other.equipment[index][1] : other.equipment.find(([key]) => key === loc)?.[1] ?? [])];
        const only = items.filter((item) => {
            const at = theirs.indexOf(item);
            if (at < 0) return true;
            theirs.splice(at, 1);
            return false;
        });
        [...only, ...theirs].forEach((item) => kinds.add(/Ammo/i.test(item) ? "ammo type" : /Actuator/i.test(item) ? "actuators" : "equipment"));
    });
    const variant = ["ammo type", "actuators", "equipment"].find((kind) => kinds.has(kind));
    if (variant) return { duplicate: false, why: variant };
    if (kept.heatSinks !== other.heatSinks) return { duplicate: false, why: "heat sinks" };
    // Engine heat sinks shown in crit slots: one design has at least the other's heat sink slots in every location.
    const locations = Object.keys({ ...kept.heatSinkSlots, ...other.heatSinkSlots });
    const covers = (a: IDesignSummary, b: IDesignSummary) => locations.every((loc) => (a.heatSinkSlots[loc] ?? 0) >= (b.heatSinkSlots[loc] ?? 0));
    if (!covers(kept, other) && !covers(other, kept)) return { duplicate: false, why: "heat sinks placed" };
    if (kept.rollAgain.join() !== other.rollAgain.join()) {
        return { duplicate: false, why: [...kept.rollAgain, ...other.rollAgain].some((name) => /\bCASE\b/.test(name)) ? "CASE" : "equipment" };
    }
    if (kept.armorType !== other.armorType || kept.armorWeight !== other.armorWeight) return { duplicate: false, why: "armor tonnage" };
    const same: string[] = [];
    if (locations.some((loc) => (kept.heatSinkSlots[loc] ?? 0) !== (other.heatSinkSlots[loc] ?? 0))) same.push("engine heat sinks in crit slots");
    if (kept.rollAgainSlots !== other.rollAgainSlots) same.push("CASE placed");
    if (kept.armor !== other.armor) same.push("armor spread");
    return { duplicate: true, why: same.join(", ") };
}

/**
 * The part of summarizeDesign two designs that are one share: equipment by location, heat sink count, CASE and the
 * like in any location, armor type and tonnage. Heat sinks in crit slots are left out, so a heat sink moved to
 * another location (a different submodel to compareDesigns) keeps the fingerprint.
 */
export const describeEquipmentLayout = (mech: BattleMech): string => {
    const summary = summarizeDesign(mech);
    return JSON.stringify([summary.equipment, summary.heatSinks, summary.rollAgain, summary.armorType, summary.armorWeight]);
};

/** describeEquipmentLayout, hashed short (32-bit FNV-1a): designs with the same name, model and fingerprint are one. */
export function getMechFingerprint(mech: BattleMech): string {
    let hash = 0x811c9dc5;
    for (const char of describeEquipmentLayout(mech)) {
        hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
}

export const BUNDLED_CHUNK_SIZE = 150;

// A UUID, alone or with a suffix such as a crit slot's ":7".
const UUID = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(:.*)?$/i;
const SHORT_ID = /^(#\d+)(:.*)?$/;
// Recomputed on import, or identity and timestamps a bundled copy should not carry.
const DERIVED = ["uuid", "lastUpdated", "battle_value", "c_bills", "as_value", "tech_label"];

const isEmpty = (value: unknown): boolean => value === false || value === "" || value === null
    || (Array.isArray(value) && value.length === 0)
    || (typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0);

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Drops empty fields inside list entries and shortens UUIDs to "#n", the same id for the same UUID. */
function shrink(value: unknown, ids: Map<string, string>, inList: boolean): unknown {
    const uuid = typeof value === "string" ? UUID.exec(value) : null;
    if (uuid) {
        if (!ids.has(uuid[1])) ids.set(uuid[1], "#" + ids.size);
        return ids.get(uuid[1]) + (uuid[2] ?? "");
    }
    if (Array.isArray(value)) return value.map((item) => shrink(item, ids, true));
    if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(value)) {
            if (inList && isEmpty(item)) continue;
            out[key] = shrink(item, ids, inList);
        }
        return out;
    }
    return value;
}

function grow(value: unknown, ids: Map<string, string>): unknown {
    const id = typeof value === "string" ? SHORT_ID.exec(value) : null;
    if (id) {
        if (!ids.has(id[1])) ids.set(id[1], generateUUID());
        return ids.get(id[1]) + (id[2] ?? "");
    }
    if (Array.isArray(value)) return value.map((item) => grow(item, ids));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, grow(item, ids)]));
    return value;
}

/** A unit export reduced to the fields that differ from `blank`, without the derived ones, UUIDs as short ids. */
function reduce(design: Record<string, unknown>, blank: Record<string, unknown>): Record<string, unknown> {
    const kept = Object.fromEntries(Object.entries(design).filter(([key, value]) => !DERIVED.includes(key) && value !== undefined && !same(value, blank[key])));
    return shrink(kept, new Map(), false) as Record<string, unknown>;
}

/**
 * A unit export reduced to what a fresh unit of the same type would not export anyway: top-level fields equal to
 * `blank`'s and the derived ones go, empty fields in list entries go, UUIDs become short ids and lists of objects
 * become tables.
 */
export const compactDesign = (design: Record<string, unknown>, blank: Record<string, unknown>): Record<string, unknown> =>
    tabulate(reduce(design, blank)) as Record<string, unknown>;

/** The export compactDesign was made from, with fresh UUIDs, ready for the unit's importJSON. */
export function expandDesign(compact: Record<string, unknown>, blank: Record<string, unknown>): Record<string, unknown> {
    return { ...blank, ...(grow(untabulate(compact), new Map()) as Record<string, unknown>) };
}

// A chunk of designs keeps one copy of each long text or object its designs repeat (a TRO paragraph a variant shares,
// an Endo-Steel slot's details) in `shared`, and "~n" for each use. A string of the design's own that starts with "~"
// gets a second one.
const SHARED_MIN_LENGTH = 24;

/** Moves what the designs of one chunk repeat into a shared list. */
export function shareChunk(designs: Record<string, unknown>): { shared: unknown[]; designs: Record<string, unknown> } {
    const counts = new Map<string, number>();
    const count = (value: unknown): void => {
        if (value === null || typeof value !== "object" && typeof value !== "string") return;
        const text = JSON.stringify(value);
        if (text.length > SHARED_MIN_LENGTH) counts.set(text, (counts.get(text) ?? 0) + 1);
        if (Array.isArray(value)) value.forEach(count);
        else if (typeof value === "object") Object.values(value).forEach(count);
    };
    Object.values(designs).forEach((design) => Object.values(design as object).forEach(count));
    const shared: unknown[] = [];
    const refs = new Map<string, string>();
    const escape = (value: unknown): unknown => typeof value === "string" ? (value.startsWith("~") ? "~" + value : value)
        : Array.isArray(value) ? value.map(escape)
        : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, escape(item)])) : value;
    const share = (value: unknown): unknown => {
        if (value === null || typeof value !== "object" && typeof value !== "string") return value;
        const text = JSON.stringify(value);
        if ((counts.get(text) ?? 0) > 1) {
            if (!refs.has(text)) {
                refs.set(text, "~" + shared.length);
                shared.push(escape(value));
            }
            return refs.get(text);
        }
        if (typeof value === "string") return escape(value);
        if (Array.isArray(value)) return value.map(share);
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, share(item)]));
    };
    return { shared, designs: Object.fromEntries(Object.entries(designs).map(([id, design]) => [id, Object.fromEntries(Object.entries(design as object).map(([key, item]) => [key, share(item)]))])) };
}

/** A design of a chunk shareChunk made, with what it shares put back. */
export function unshareDesign(design: Record<string, unknown>, shared: unknown[]): Record<string, unknown> {
    const resolve = (value: unknown): unknown => {
        if (typeof value === "string") {
            if (!value.startsWith("~")) return value;
            return value.startsWith("~~") ? value.slice(1) : resolve(shared[+value.slice(1)]);
        }
        if (Array.isArray(value)) return value.map(resolve);
        if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item)]));
        return value;
    };
    return resolve(design) as Record<string, unknown>;
}

let blankMech: Record<string, unknown> | null = null;
const getBlankMech = () => blankMech ??= { ...(new BattleMech().export(true) as unknown as Record<string, unknown>) };

/**
 * A 'Mech's crit table entry for an installed item is rebuilt from the item, so only its place is kept; an item's
 * crit table location is dropped when it is the item's own, and a crit count when it matches the slots it fills.
 */
function thinMech(design: Record<string, unknown>): Record<string, unknown> {
    const equipment = ((design.equipment ?? []) as Record<string, unknown>[])
        .map((item) => item.allocationLocation === item.loc ? Object.fromEntries(Object.entries(item).filter(([key]) => key !== "allocationLocation")) : item);
    const installed = new Set(equipment.map((item) => item.uuid));
    const allocation = ((design.allocation ?? []) as Record<string, unknown>[])
        .map((slot) => installed.has(slot.uuid) ? Object.fromEntries(Object.entries(slot)
            .filter(([key]) => ["uuid", "loc", "slot", "rear", "size", "crits"].includes(key) && !(key === "crits" && slot.crits === slot.size))) : slot);
    // An OmniMech's active configuration is its equipment and crit table, stored again when the design is next saved.
    const omniConfigurations = (design.omniConfigurations as { name: string }[] | undefined)?.filter((configuration) => configuration.name !== design.activeOmniConfiguration);
    return { ...design, equipment, allocation, ...(omniConfigurations ? { omniConfigurations } : {}) };
}

function thickenMech(design: Record<string, unknown>): Record<string, unknown> {
    const equipment = ((design.equipment ?? []) as Record<string, unknown>[]).map((item): Record<string, unknown> => ({ allocationLocation: item.loc, ...item }));
    const installed = new Set(equipment.map((item) => item.uuid));
    const allocation = ((design.allocation ?? []) as Record<string, unknown>[])
        .map((slot) => installed.has(slot.uuid) && slot.size !== undefined ? { crits: slot.size, ...slot } : slot);
    return { ...design, equipment, allocation };
}

// A crit slot is stored as [location, slot, id, size, the rest of its fields], the rest left off when it has none.
type SlotTuple = [unknown, unknown, unknown, unknown, Record<string, unknown>?];
const SLOT_FIELDS = ["loc", "slot", "uuid", "size"];

const toTuple = (slot: Record<string, unknown>): SlotTuple => {
    const rest = Object.fromEntries(Object.entries(slot).filter(([key]) => !SLOT_FIELDS.includes(key)));
    return Object.keys(rest).length > 0 ? [slot.loc, slot.slot, slot.uuid, slot.size ?? null, rest] : [slot.loc, slot.slot, slot.uuid, slot.size ?? null];
};

const fromTuple = (slot: unknown): unknown => {
    if (!Array.isArray(slot)) return slot;
    const [loc, place, uuid, size, rest] = slot as SlotTuple;
    return { uuid, loc, slot: place, ...(size === null ? {} : { size }), ...rest };
};

/** Applies `change` to the design's crit table and each OmniMech configuration's. */
function mapSlots<T>(design: Record<string, unknown>, change: (slot: T) => unknown): Record<string, unknown> {
    const slots = (allocation: unknown) => Array.isArray(allocation) ? (allocation as T[]).map((slot) => change(slot)) : allocation;
    const omniConfigurations = (design.omniConfigurations as Record<string, unknown>[] | undefined)
        ?.map((configuration) => "allocation" in configuration ? { ...configuration, allocation: slots(configuration.allocation) } : configuration);
    return { ...design, ...("allocation" in design ? { allocation: slots(design.allocation) } : {}), ...(omniConfigurations ? { omniConfigurations } : {}) };
}

export const compactMech = (mech: BattleMech): Record<string, unknown> =>
    tabulate(mapSlots(reduce(thinMech(mech.export(true) as unknown as Record<string, unknown>), getBlankMech()), toTuple)) as Record<string, unknown>;

export const loadBundledMech = (design: Record<string, unknown>): BattleMech =>
    new BattleMech(JSON.stringify(thickenMech(mapSlots(expandDesign(design, getBlankMech()), fromTuple))));

/** A unit class the bundled designs of another type are made of: a JSON constructor and a play-free export. */
export interface IBundledUnitClass<T> {
    new (json?: string): T;
}

const blanks = new Map<unknown, Record<string, unknown>>();
const getBlank = <T extends { export(noInPlayVariables?: boolean): object }>(Unit: IBundledUnitClass<T>): Record<string, unknown> => {
    if (!blanks.has(Unit)) blanks.set(Unit, { ...(new Unit().export(true) as Record<string, unknown>) });
    return blanks.get(Unit)!;
};

export const compactUnit = <T extends { export(noInPlayVariables?: boolean): object }>(unit: T, Unit: IBundledUnitClass<T>): Record<string, unknown> =>
    compactDesign(unit.export(true) as Record<string, unknown>, getBlank(Unit));

export const loadBundledUnit = <T extends { export(noInPlayVariables?: boolean): object }>(design: Record<string, unknown>, Unit: IBundledUnitClass<T>): T =>
    new Unit(JSON.stringify(expandDesign(design, getBlank(Unit))));
