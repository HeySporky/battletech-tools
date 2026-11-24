import { describe, expect, it } from "vitest";
// The shipped mordel.net list: rows, and leaving out canon units the MUL list already has. Made-up units only.
import { buildMulIndex, canonMatch, chunkRows, listRowOf, planList } from "../../tools/mordel-sync/mordel-list-rows.mjs";

const card = { type: "BM", size: 1, move: "16\"j", tmm: 3, armor: 3, structure: 1, damage: { short: "1", medium: "1", long: "0*" }, overheat: 0, point_value: 22, specials: ["ENE"] };

const detail = (over: Record<string, unknown> = {}) => ({
    unit_type: "BattleMech", unit_type_short: "bm", id: 900001, name: "Testmech TM-1 \"Nick\"", designer: null, canon: true,
    tech_base: "Inner Sphere", year: 3075, tons: 35, battle_value: 826, point_value: 22, updated: 5, created: 1,
    name_parts: { name: "Testmech", alternate_name: null, model: "TM-1 \"Nick\"" }, mul_id: 7001, role: "Scout",
    alpha_strike: card, engine: { type: "XL" }, equipment: [{ id: 1 }], fluff: { overview: "long text" },
    ...over,
});

const live = (over: Record<string, unknown> = {}) => ({
    Id: 100500, MulUnitKey: "TESTKEY001", Name: "Testmech", Variant: "TM-1", Class: "BattleMech", Tonnage: 35,
    BattleValue: 826, BFPointValue: 22, BFSize: 1, BFMove: "16\"j", BFArmor: 3, BFStructure: 1,
    BFDamageShort: 1, BFDamageMedium: 1, BFDamageLong: 0, BFDamageShortMin: false, BFDamageMediumMin: false, BFDamageLongMin: true,
    ...over,
});

const archive = [{ replacedBy: "TESTKEY001", record: { Id: 7001 } }];

describe("listRowOf", () => {
    it("keeps list fields, name parts, MUL id, role and the Alpha Strike card, and drops the rest", () => {
        const row = listRowOf({ unit: detail() });
        expect(row).toMatchObject({ id: 900001, unit_type_short: "bm", battle_value: 826, mul_id: 7001, role: "Scout", alpha_strike: card });
        expect(row.name_parts.model).toBe("TM-1 \"Nick\"");
        expect(row).not.toHaveProperty("equipment");
        expect(row).not.toHaveProperty("fluff");
        expect(row).not.toHaveProperty("engine");
    });
});

describe("canonMatch", () => {
    it("finds the MUL record by legacy MUL id through the archive, with no differences", () => {
        const index = buildMulIndex([live({ Name: "Other name" })], archive);
        const match = canonMatch(detail(), index)!;
        expect(match.record.MulUnitKey).toBe("TESTKEY001");
        expect(match.diffs).toEqual([]);
    });

    it("falls back to chassis, model (nickname ignored) and tons", () => {
        const index = buildMulIndex([live()], []);
        expect(canonMatch(detail({ mul_id: null }), index)!.diffs).toEqual([]);
        expect(canonMatch(detail({ mul_id: null, tons: 40 }), index)).toBeNull();
    });

    it("reports a BV difference the way the report shows it", () => {
        const index = buildMulIndex([live({ BattleValue: 830 })], archive);
        expect(canonMatch(detail(), index)!.diffs).toEqual(["BV 826 vs 830"]);
    });

    it("compares minimal damage, move and armor", () => {
        const index = buildMulIndex([live({ BFDamageLongMin: false, BFMove: "16\"", BFArmor: 4 })], archive);
        expect(canonMatch(detail(), index)!.diffs).toEqual(["move 16\"j vs 16\"", "armor 3 vs 4", "damage long 0* vs 0"]);
    });

    it("does not match by name when two MUL records share it", () => {
        const index = buildMulIndex([live(), live({ MulUnitKey: "TESTKEY002", Id: 100501 })], []);
        expect(canonMatch(detail({ mul_id: null }), index)).toBeNull();
    });
});

describe("planList", () => {
    it("drops a matching canon unit, keeps and reports a differing one, and keeps fan designs and unknown canon", () => {
        const index = buildMulIndex([live(), live({ MulUnitKey: "TESTKEY002", Name: "Othermech", Variant: "OM-1", BattleValue: 830 })], archive);
        const { rows, mismatches, counts } = planList([
            detail(),
            detail({ id: 900002, mul_id: null, name: "Othermech OM-1", name_parts: { name: "Othermech", alternate_name: null, model: "OM-1" } }),
            detail({ id: 900003, canon: false, mul_id: null }),
            detail({ id: 900004, mul_id: null, name_parts: { name: "Nowhere", alternate_name: null, model: "N-1" } }),
        ], index);
        expect(rows.map((r) => r.id)).toEqual([900002, 900003, 900004]);
        expect(mismatches).toEqual([{ key: "bm/900002", name: "Othermech OM-1", mulUnitKey: "TESTKEY002", diffs: ["BV 826 vs 830"] }]);
        expect(counts).toEqual({ total: 4, canon: 3, droppedMatching: 1, canonMismatched: 1, canonNotInMul: 1 });
    });
});

describe("chunkRows", () => {
    it("splits each unit type into chunks of the given size", () => {
        const rows = [1, 2, 3].map((id) => ({ unit_type_short: "bm", id })).concat([{ unit_type_short: "cv", id: 4 }]);
        expect(chunkRows(rows, 2).map((c: { type: string; n: number; rows: unknown[] }) => [c.type, c.n, c.rows.length])).toEqual([["bm", 1, 2], ["bm", 2, 1], ["cv", 1, 1]]);
    });
});
