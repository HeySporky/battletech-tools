// Lookup tables for the weekly MUL sync (sync-mul.mjs), kept in their own module so tests can import them
// (the sync script runs on import). The live site's data has no Alpha Strike type codes; these are fixed rules
// knowledge keyed off its unit_types.json names and unit_sub_types.json ids.

// Alpha Strike unit type by the live unit type's name.
const BF_TYPE_BY_UNIT_TYPE_NAME = {
    BattleMech: "BM",
    OmniMech: "BM",
    "Combat Vehicle": "CV",
    OmniVehicle: "CV",
    "Support Vehicle": "SV",
    "Fighter Craft": "AF",
    "Battle Armor": "BA",
    Infantry: "CI",
    ProtoMech: "PM",
    IndustrialMech: "IM",
    "Advanced Support": "SV",
    // The Alpha Strike Companion's unit type table has no code for buildings; MegaMek types them as vehicles, CV.
    // (They had "CF", which the app reads as a conventional fighter.)
    Buildings: "CV",
};

// Where the type alone doesn't say: the live unit_sub_types.json ids. "Aerospace Craft" holds every large craft,
// and "Fighter Craft" holds conventional fighters too.
const BF_TYPE_BY_SUB_TYPE_ID = {
    46: "DS", // Spheroid DropShip
    14: "DA", // Aerodyne DropShip
    26: "SC", // Small Craft
    33: "JS", // JumpShip
    29: "WS", // WarShip
    31: "SS", // Space Station
    5: "CF", // Conventional Fighter
    35: "MS", // Mobile Structure (Advanced Support)
};

/** The Alpha Strike type code ("BM", "DS", ...) for a live unit type name and sub-type id; null if unknown. */
export function bfTypeOf(unitTypeName, subTypeId) {
    return BF_TYPE_BY_SUB_TYPE_ID[subTypeId] ?? BF_TYPE_BY_UNIT_TYPE_NAME[unitTypeName] ?? null;
}

/** The sub-type id held in a stored record's summary hash (see summaryHashOf), for records stored before SubTypeId. */
export function subTypeIdOfSummaryHash(summaryHash) {
    try {
        const fields = JSON.parse(summaryHash);
        return Array.isArray(fields) && typeof fields[3] === "number" ? fields[3] : undefined;
    } catch {
        return undefined;
    }
}

// Live eras.json id -> the app's era id (src/utils/mulUtilities.ts mulEras), matched by name. The live site has
// no era 9.
const LEGACY_ERA_ID_BY_LIVE_ID = {
    1: 1, // Age of War
    2: 10, // Star League
    3: 11, // Early Succession War
    4: 13, // Clan Invasion
    5: 14, // Jihad
    6: 15, // Early Republic
    7: 16, // Dark Age
    8: 247, // Civil War
    10: 254, // Late Republic
    11: 255, // Late Succession War - LosTech
    12: 256, // Late Succession War - Renaissance
    13: 257, // ilClan
};

/** The app's era id for a live era id, or undefined for an era the table doesn't know (add it here). */
export function legacyEraIdOf(liveEraId) {
    return LEGACY_ERA_ID_BY_LIVE_ID[liveEraId];
}

const THRESHOLD_ABILITY = /^TH\s*(\d+)$/i;

/**
 * Moves the armor threshold out of the abilities into BFThreshold (0 when there is none), as the old MUL stored
 * it. The live site lists it as a "TH 3" ability. Returns true if the record changed.
 */
export function takeThreshold(record) {
    const abilities = typeof record.BFAbilities === "string" && record.BFAbilities !== "" ? record.BFAbilities.split(",") : [];
    const index = abilities.findIndex((ability) => THRESHOLD_ABILITY.test(ability.trim()));
    if (index < 0) {
        if (record.BFThreshold !== undefined) return false;
        record.BFThreshold = 0;
        return true;
    }
    record.BFThreshold = Number(abilities[index].trim().match(THRESHOLD_ABILITY)[1]);
    abilities.splice(index, 1);
    record.BFAbilities = abilities.join(",");
    return true;
}

const LEGACY_FILL_FIELDS = ["Rules", "TRO", "ImageUrl"];
const usableLegacyValue = (field, value) =>
    typeof value === "string" && value.trim() !== "" && !(field === "Rules" && value.trim() === "Unknown");

/**
 * From the archive of legacy records the live ones replaced: live key -> { Rules, TRO, ImageUrl }, the live site
 * having none of them. Each field comes from the first legacy copy that has it; "Unknown" is not a rules level.
 */
export function legacyFillByLiveKey(archiveItems) {
    const fills = new Map();
    for (const item of archiveItems) {
        if (!item?.replacedBy || !item.record) continue;
        const fill = fills.get(item.replacedBy) ?? {};
        for (const field of LEGACY_FILL_FIELDS) {
            if (fill[field] === undefined && usableLegacyValue(field, item.record[field])) fill[field] = item.record[field].trim();
        }
        fills.set(item.replacedBy, fill);
    }
    for (const [key, fill] of fills) if (Object.keys(fill).length === 0) fills.delete(key);
    return fills;
}

/** Sets the legacy fields a live record lacks; the live site's own values win. Returns true if it changed. */
export function fillFromLegacy(record, fill) {
    let changed = false;
    for (const [field, value] of Object.entries(fill ?? {})) {
        if (usableLegacyValue(field, record[field])) continue;
        record[field] = value;
        changed = true;
    }
    return changed;
}
