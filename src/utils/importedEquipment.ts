import { IEquipmentItem } from "../data/data-interfaces";
import { EquipmentCatalog, getEquipmentCatalogDefinitions } from "../data/equipment-registry";
import { isUniversalEquipment } from "../data/mech-universal-equipment";

// Resolves an equipment name from an imported design (SSW, MegaMek, or any other tool) to a catalog record.
// Matching is exact and data-driven: another tool's spelling of an item is listed on the record itself, in
// `altNames` (names) or `altTags` (tags). To teach the importer a new name, add it to the right record; do not
// add name rewriting here.
//
// Lookup order:
//   1. the faction's catalog and the universal catalog, by the record's own name or tag;
//   2. the universal catalog, by any identifier (alternateName, altNames, altTags);
//   3. the faction's catalog (Inner Sphere or Clan), by any identifier;
//   4. on a Mixed Tech design, the other faction's catalog, by own name or tag, then by any identifier;
//   5. the custom catalogs, by any identifier (the item is then homebrew).
//
// The faction is the item's own when the source marks it (SSW's "(IS) " and "(CL) " prefixes), otherwise the
// design's.

export type ImportFaction = "is" | "clan";

export interface IImportedEquipmentMatch {
    item: IEquipmentItem;
    catalog: EquipmentCatalog;
}

interface ICatalogIndex {
    primary: Map<string, IEquipmentItem[]>;
    any: Map<string, IEquipmentItem[]>;
}

const key = (value: string): string => value.trim().toLowerCase();

function add(map: Map<string, IEquipmentItem[]>, identifier: string | undefined, item: IEquipmentItem): void {
    if (!identifier || !identifier.trim()) {
        return;
    }
    const items = map.get(key(identifier));
    if (!items) {
        map.set(key(identifier), [item]);
    } else if (!items.includes(item)) {
        items.push(item);
    }
}

/** Every identifier a record answers to, most specific first. */
export function getEquipmentIdentifiers(item: IEquipmentItem): string[] {
    return [item.name, item.tag, item.alternateName ?? "", ...(item.altNames ?? []), ...(item.altTags ?? [])]
        .filter((identifier) => identifier.trim() !== "");
}

let indexes: Map<EquipmentCatalog, ICatalogIndex> | null = null;

// Built once from the registry's own arrays (no copies); installed items are copied by the caller.
function getIndex(catalog: EquipmentCatalog): ICatalogIndex {
    if (!indexes) {
        indexes = new Map();
        for (const definition of getEquipmentCatalogDefinitions()) {
            let index = indexes.get(definition.techBase);
            if (!index) {
                index = { primary: new Map(), any: new Map() };
                indexes.set(definition.techBase, index);
            }
            for (const item of definition.equipment) {
                // Universal records are listed in the IS and Clan files too; they belong to the universal tier.
                if (definition.techBase !== "universal" && isUniversalEquipment(item)) {
                    continue;
                }
                add(index.primary, item.name, item);
                add(index.primary, item.tag, item);
                for (const identifier of getEquipmentIdentifiers(item)) {
                    add(index.any, identifier, item);
                }
            }
        }
    }
    return indexes.get(catalog) ?? { primary: new Map(), any: new Map() };
}

/** Records in `catalog` answering to `name`: by own name or tag only when `primaryOnly`, otherwise by any identifier. */
export function findCatalogMatches(name: string, catalog: EquipmentCatalog, primaryOnly = false): IEquipmentItem[] {
    const index = getIndex(catalog);
    return (primaryOnly ? index.primary : index.any).get(key(name)) ?? [];
}

/** The catalog record an imported design means by `name`, for an item of the given faction. */
export function findImportedEquipment(name: string, faction: ImportFaction, mixedTech = false): IImportedEquipmentMatch | null {
    const otherFaction: ImportFaction = faction === "is" ? "clan" : "is";
    const passes: [EquipmentCatalog, boolean][] = [
        [faction, true],
        ["universal", true],
        ["universal", false],
        [faction, false],
        ...(mixedTech ? [[otherFaction, true], [otherFaction, false]] as [EquipmentCatalog, boolean][] : []),
        ["custom", false],
    ];
    for (const [catalog, primaryOnly] of passes) {
        const item = findCatalogMatches(name, catalog, primaryOnly)[0];
        if (item) {
            return { item, catalog };
        }
    }
    return null;
}
