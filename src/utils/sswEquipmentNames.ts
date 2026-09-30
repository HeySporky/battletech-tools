import { IEquipmentItem } from "../data/data-interfaces";
import { getCompatibleAmmo } from "../data/equipment-registry";

// Solaris Skunk Werks names equipment the way the TechManual tables print it ("SRM-6", "ER Medium Laser",
// "Ammo (LRM-15 (Artemis IV Capable))"). Our catalogs use their own names ("SRM 6", "ER Medium Laser (Clan)",
// "Clan LB 10-X AC") and store ammunition once per family and munition ("LRM - Artemis IV Ammo (IS)"), so an
// SSW name is matched loosely, and ammunition is found through the launcher it feeds.

/** Lower case, without tech-base markers, with "SRM-6" spelled "srm 6". */
export function normalizeEquipmentName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\((is|c|cl|clan)\)/g, " ")
        .replace(/^\s*clan\s+/, "")
        .replace(/([a-z])-(\d)/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim();
}

interface ISSWLookup {
    // A record's own name ranks above its alternate names: "LRM-10" is the Clan LRM 10 ("Clan LRM 10"), not the
    // Star League launcher whose alternate name happens to be "LRM-10".
    byName: Map<string, IEquipmentItem[]>;
    byNormalizedName: Map<string, IEquipmentItem[]>;
    // Alternate names, tags and altTags, lower case.
    byIdentifier: Map<string, IEquipmentItem[]>;
    byNormalizedAlternateName: Map<string, IEquipmentItem[]>;
    ammo: IEquipmentItem[];
    compatibleAmmo: Map<string, IEquipmentItem[]>;
}

// Built once per list; an import resolves every item against the same list.
const lookups = new WeakMap<IEquipmentItem[], ISSWLookup>();

function addTo(map: Map<string, IEquipmentItem[]>, key: string, item: IEquipmentItem): void {
    if (!key) {
        return;
    }
    const items = map.get(key);
    if (!items) {
        map.set(key, [item]);
    } else if (!items.includes(item)) {
        items.push(item);
    }
}

function getLookup(list: IEquipmentItem[]): ISSWLookup {
    let lookup = lookups.get(list);
    if (lookup) {
        return lookup;
    }
    lookup = {
        byName: new Map(), byNormalizedName: new Map(), byIdentifier: new Map(), byNormalizedAlternateName: new Map(),
        ammo: [], compatibleAmmo: new Map(),
    };
    for (const item of list) {
        addTo(lookup.byName, item.name.trim().toLowerCase(), item);
        addTo(lookup.byNormalizedName, normalizeEquipmentName(item.name), item);
        const alternateNames = [item.alternateName ?? "", ...(item.altNames ?? [])].filter((name) => name.trim());
        for (const identifier of [...alternateNames, item.tag, ...(item.altTags ?? [])]) {
            addTo(lookup.byIdentifier, identifier.trim().toLowerCase(), item);
        }
        for (const name of alternateNames) {
            addTo(lookup.byNormalizedAlternateName, normalizeEquipmentName(name), item);
        }
        if (item.isAmmo) {
            lookup.ammo.push(item);
        }
    }
    lookups.set(list, lookup);
    return lookup;
}

// One-shot launchers and prototype-only records share their production weapon's name; SSW means the production one.
const isVariantRecord = (item: IEquipmentItem): boolean =>
    /\((I-)?OS\)/.test(item.name) || /^prototype /i.test(item.name) || item.introduced === null;

function findWeaponOrEquipment(name: string, lookup: ISSWLookup): IEquipmentItem | null {
    const exact = name.trim().toLowerCase();
    const normalized = normalizeEquipmentName(name);
    for (const matches of [
        lookup.byName.get(exact),
        lookup.byNormalizedName.get(normalized),
        lookup.byIdentifier.get(exact),
        lookup.byNormalizedAlternateName.get(normalized),
    ]) {
        const candidates = (matches ?? []).filter((item) => !item.isAmmo);
        const match = candidates.find((item) => !isVariantRecord(item)) ?? candidates[0];
        if (match) {
            return match;
        }
    }
    return null;
}

// "Artemis IV Capable" -> "artemis iv", "Narc Capable" -> "narc-capable" (the catalog's munition wording).
function normalizeMunition(munition: string): string {
    const normalized = munition.toLowerCase().trim();
    if (normalized === "narc capable") {
        return "narc-capable";
    }
    return normalized.replace(/\s+capable$/, "");
}

const munitionOf = (ammo: IEquipmentItem): string =>
    (/ - (.+) ammo\b/i.exec(ammo.name)?.[1] ?? "").toLowerCase();

function getCompatible(weapon: IEquipmentItem, lookup: ISSWLookup): IEquipmentItem[] {
    let compatible = lookup.compatibleAmmo.get(weapon.tag);
    if (!compatible) {
        compatible = lookup.ammo.filter((ammo) => getCompatibleAmmo(weapon, ammo));
        const sameSide = compatible.filter((ammo) =>
            !weapon.catalog || !ammo.catalog || ammo.catalog === weapon.catalog || ammo.catalog === "universal");
        compatible = sameSide.length > 0 ? sameSide : compatible;
        lookup.compatibleAmmo.set(weapon.tag, compatible);
    }
    return compatible;
}

function findAmmo(inner: string, lookup: ISSWLookup): IEquipmentItem | null {
    let weapon = findWeaponOrEquipment(inner, lookup);
    let munition = "standard";
    const variant = / \(([^()]+)\)$/.exec(inner);
    if (!weapon && variant) {
        weapon = findWeaponOrEquipment(inner.slice(0, variant.index), lookup);
        munition = normalizeMunition(variant[1]);
    }
    if (!weapon) {
        return null;
    }

    const candidates = getCompatible(weapon, lookup);
    return candidates.find((ammo) => munitionOf(ammo) === munition)
        ?? (munition === "standard" ? candidates.find((ammo) => !ammo.isSpecialAmmo) : undefined)
        ?? null;
}

/** The catalog record SSW means by `name`, looked up in `list` (the design's tech-base equipment list). */
export function findEquipmentBySSWName(name: string, list: IEquipmentItem[]): IEquipmentItem | null {
    const lookup = getLookup(list);
    const ammo = /^Ammo \((.+)\)$/.exec(name.trim());
    if (ammo) {
        const key = name.trim().toLowerCase();
        const exact = [...(lookup.byName.get(key) ?? []), ...(lookup.byIdentifier.get(key) ?? [])].find((item) => item.isAmmo);
        return exact ?? findAmmo(ammo[1], lookup);
    }
    return findWeaponOrEquipment(name, lookup);
}
