import { IEquipmentItem } from "./data-interfaces";
import { getBattleArmorScaleRecordsByTech, getEquipmentCatalogVersion, getEquipmentRecordsByTech } from "./equipment-registry";

/*
 * The equipment lookup every unit class shares (#87). A unit looks a tag up in its own catalog first, then in the
 * other tech base's (a saved unit keeps equipment since moved there), then among the battle armor scale items it
 * may mount (Ghosts of Obeedah pp.53-54). Each is searched before the next, so a catalog record always wins.
 *
 * The records are the catalog's own, shared by every unit: read them, and mount a copyCatalogRecord. Lookups are
 * indexed and cached until the catalogs change (setLocalCustomEquipment).
 */

export interface IUnitCatalogOptions {
    /** Search the other tech base's catalog too, for an Inner Sphere or Clan unit. Default true. */
    otherTechBase?: boolean;
    /** Search battle armor scale items last. Default false. */
    battleArmorScale?: boolean;
    /** Include custom equipment. Default true. */
    includeCustom?: boolean;
}

interface ISegment {
    records: readonly IEquipmentItem[];
    byTag: Map<string, IEquipmentItem>;
    byAltTag: Map<string, IEquipmentItem>;
}

let cacheVersion = -1;
const segments = new Map<string, ISegment>();
const lists = new Map<string, readonly IEquipmentItem[]>();

const indexSegment = (records: readonly IEquipmentItem[]): ISegment => {
    const byTag = new Map<string, IEquipmentItem>();
    const byAltTag = new Map<string, IEquipmentItem>();
    for (const record of records) {
        // The first record wins, as a search through the list would find it.
        if (!byTag.has(record.tag)) byTag.set(record.tag, record);
        for (const alt of record.altTags ?? []) if (!byAltTag.has(alt)) byAltTag.set(alt, record);
    }
    return { records, byTag, byAltTag };
};

const segment = (key: string, build: () => readonly IEquipmentItem[]): ISegment => {
    if (cacheVersion !== getEquipmentCatalogVersion()) {
        segments.clear();
        lists.clear();
        cacheVersion = getEquipmentCatalogVersion();
    }
    let found = segments.get(key);
    if (!found) segments.set(key, found = indexSegment(build()));
    return found;
};

const segmentsFor = (techTag: string, options: IUnitCatalogOptions): ISegment[] => {
    const tech = techTag.toLowerCase();
    const custom = options.includeCustom !== false;
    const result = [segment(`own|${tech}|${custom}`, () => getEquipmentRecordsByTech(tech, custom))];
    const other = tech === "clan" ? "mclan" : tech === "is" ? "mis" : null;
    if (other && options.otherTechBase !== false) result.push(segment(`own|${other}|${custom}`, () => getEquipmentRecordsByTech(other, custom)));
    if (options.battleArmorScale) result.push(segment(`ba|${tech}`, () => getBattleArmorScaleRecordsByTech(tech)));
    return result;
};

/** The record for a tag, by its current tag or else an alternate one, from the first place that has it. */
export function findUnitCatalogRecord(techTag: string, tag: unknown, options: IUnitCatalogOptions = {}): IEquipmentItem | undefined {
    if (typeof tag !== "string" || tag === "") return undefined;
    for (const { byTag, byAltTag } of segmentsFor(techTag, options)) {
        const found = byTag.get(tag) ?? byAltTag.get(tag);
        if (found) return found;
    }
    return undefined;
}

/** Every record the lookup searches, in lookup order (an item can appear more than once). */
export function getUnitCatalogRecords(techTag: string, options: IUnitCatalogOptions = {}): readonly IEquipmentItem[] {
    const parts = segmentsFor(techTag, options);
    const key = `${techTag.toLowerCase()}|${options.otherTechBase !== false}|${!!options.battleArmorScale}|${options.includeCustom !== false}`;
    let list = lists.get(key);
    if (!list) lists.set(key, list = parts.flatMap((part) => part.records));
    return list;
}

/** A deep copy of a catalog record to mount on a unit: mounted items never share nested data with the catalog or each other. */
export function copyCatalogRecord(record: IEquipmentItem): IEquipmentItem {
    return JSON.parse(JSON.stringify(record)) as IEquipmentItem;
}
