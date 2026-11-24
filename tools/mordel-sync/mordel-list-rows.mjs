// Pure helpers for the shipped mordel.net list: the row each unit gets, and the check that leaves out a canon unit the
// MUL list already has with the same stats. Tested from src/utils/mordelList.test.ts.

/** The list fields the app reads, plus what the picker and the Alpha Strike card need without a detail call. */
const ROW_FIELDS = [
    "unit_type", "unit_type_short", "id", "name", "designer", "canon", "tech_base", "mixed_tech", "era", "year",
    "rules_level", "extinct", "tons", "battle_value", "point_value", "cost", "omni", "omni_base_id", "created", "updated",
    "name_parts", "mul_id", "role", "alpha_strike",
];

/** A detail answer, or the unit inside it. */
export const unitOf = (detail) => detail?.unit ?? detail;

/** @returns {Record<string, any>} */
export function listRowOf(detail) {
    const unit = unitOf(detail);
    /** @type {Record<string, any>} */
    const row = {};
    for (const field of ROW_FIELDS) if (unit[field] !== undefined) row[field] = unit[field];
    return row;
}

/** Lower case, no quoted nickname, single spaces: so "DOL-1A2 \"Yoh Ti Ts'ang\"" and "DOL-1A2" compare equal. */
const plain = (text) => String(text ?? "").replace(/"[^"]*"/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

export const nameKey = (chassis, model, tons) => `${plain(chassis)}|${plain(model)}|${Number(tons)}`;

/**
 * The live MUL records, found by legacy MUL id (mordel.net's mul_id) through the archive of replaced legacy records,
 * and by chassis, model and tons.
 * @param live MUL 2.0 records (each with MulUnitKey)
 * @param archive tools/mul-sync/archive/replaced-legacy-records.json items ({ replacedBy, record: { Id } })
 */
export function buildMulIndex(live, archive) {
    const byKey = new Map(live.filter((r) => r.MulUnitKey).map((r) => [r.MulUnitKey, r]));
    const byLegacyId = new Map();
    for (const item of archive) {
        const record = byKey.get(item.replacedBy);
        if (record && item.record?.Id != null && !byLegacyId.has(item.record.Id)) byLegacyId.set(item.record.Id, record);
    }
    const byName = new Map();
    for (const record of live) {
        const key = nameKey(record.MulUnitKey ? record.Name : record.Class, record.Variant, record.Tonnage);
        // Two records sharing a name make the name useless for matching.
        byName.set(key, byName.has(key) ? null : record);
    }
    return { byLegacyId, byName };
}

const moveText = (move) => String(move ?? "").replace(/\s+/g, "").toLowerCase();

/** "3", "0*" or "-" as the MUL list keeps them: a number and a minimal flag. */
const damage = (text) => {
    const raw = String(text ?? "").trim();
    return { value: Number.parseInt(raw, 10) || 0, min: raw.endsWith("*") };
};
const damageText = ({ value, min }) => (min ? `${value}*` : `${value}`);

/**
 * The MUL record for a canon unit, and how its stats differ ("BV 826 vs 830"), or null when the MUL list has no such
 * unit. Compared: BV, PV, and the Alpha Strike size, move, armor, structure and damage.
 */
export function canonMatch(detail, index) {
    const unit = unitOf(detail);
    const byId = unit.mul_id != null ? index.byLegacyId.get(unit.mul_id) : undefined;
    const record = byId ?? index.byName.get(nameKey(unit.name_parts?.name ?? unit.name, unit.name_parts?.model, unit.tons));
    if (!record) return null;
    const diffs = [];
    const compare = (label, ours, theirs) => {
        if (String(ours) !== String(theirs)) diffs.push(`${label} ${ours} vs ${theirs}`);
    };
    compare("BV", unit.battle_value, record.BattleValue);
    const card = unit.alpha_strike;
    if (!card) {
        if (record.BFPointValue) diffs.push("no Alpha Strike card vs PV " + record.BFPointValue);
        return { record, diffs };
    }
    compare("PV", card.point_value ?? unit.point_value, record.BFPointValue);
    compare("size", card.size, record.BFSize);
    compare("move", moveText(card.move), moveText(record.BFMove));
    compare("armor", card.armor, record.BFArmor);
    compare("structure", card.structure, record.BFStructure);
    for (const [range, field] of [["short", "Short"], ["medium", "Medium"], ["long", "Long"]]) {
        const ours = damage(card.damage?.[range]);
        const theirs = { value: Number(record[`BFDamage${field}`]) || 0, min: !!record[`BFDamage${field}Min`] };
        compare(`damage ${range}`, damageText(ours), damageText(theirs));
    }
    return { record, diffs };
}

/**
 * Sorts the mirror's units into the shipped list. A canon unit whose MUL record matches is left out; one that differs
 * is kept and reported; one the MUL list lacks is kept.
 */
export function planList(details, index) {
    /** @type {Record<string, any>[]} */
    const rows = [];
    const mismatches = [];
    const counts = { total: 0, canon: 0, droppedMatching: 0, canonMismatched: 0, canonNotInMul: 0 };
    for (const detail of details) {
        const unit = unitOf(detail);
        counts.total++;
        if (unit.canon) {
            counts.canon++;
            const match = canonMatch(unit, index);
            if (match && match.diffs.length === 0) {
                counts.droppedMatching++;
                continue;
            }
            if (match) {
                counts.canonMismatched++;
                mismatches.push({ key: `${unit.unit_type_short}/${unit.id}`, name: unit.name, mulUnitKey: match.record.MulUnitKey ?? null, diffs: match.diffs });
            } else {
                counts.canonNotInMul++;
            }
        }
        rows.push(listRowOf(unit));
    }
    rows.sort((a, b) => (a.unit_type_short < b.unit_type_short ? -1 : a.unit_type_short > b.unit_type_short ? 1 : a.id - b.id));
    mismatches.sort((a, b) => (a.key < b.key ? -1 : 1));
    return { rows, mismatches, counts };
}

/** Rows split into chunks of `size` per unit type: [{ type, n, rows }]. */
export function chunkRows(rows, size = 2000) {
    const chunks = [];
    for (const type of [...new Set(rows.map((r) => r.unit_type_short))]) {
        const ofType = rows.filter((r) => r.unit_type_short === type);
        for (let i = 0; i < ofType.length; i += size) chunks.push({ type, n: i / size + 1, rows: ofType.slice(i, i + size) });
    }
    return chunks;
}
