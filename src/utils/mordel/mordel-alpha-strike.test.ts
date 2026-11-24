import { describe, expect, it } from "vitest";
import { AlphaStrikeUnit } from "../../classes/alpha-strike-unit";
import { mordelToASMULUnit } from "./mordel-alpha-strike";
import { IMordelListRow } from "./mordel-types";

// Canon: the Dola DOL-1A2, as mordel.net lists it.
const dola: IMordelListRow = {
    unit_type: "BattleMech",
    unit_type_short: "bm",
    id: 23454,
    name: "Dola DOL-1A2",
    canon: true,
    tech_base: "Inner Sphere",
    year: 3075,
    rules_level: "Standard",
    tons: 35,
    battle_value: 826,
    point_value: 22,
    updated: 1,
    name_parts: { name: "Dola", alternate_name: null, model: "DOL-1A2" },
    mul_id: null,
    role: "Scout",
    alpha_strike: {
        type: "BM", size: 1, move: "16\"j", tmm: 3, armor: 3, structure: 1,
        damage: { short: "1", medium: "1", long: "0*" },
        overheat: 0, point_value: 22, specials: ["ENE", "MEL", "TAG"],
    },
};

describe("mordelToASMULUnit", () => {
    it("builds the Dola's Alpha Strike card through importMUL", () => {
        const record = mordelToASMULUnit(dola)!;
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        expect(unit.name).toBe("Dola DOL-1A2");
        expect(unit.size).toBe(1);
        expect(unit.armor).toBe(3);
        expect(unit.structure).toBe(1);
        expect(unit.damage.short).toBe(1);
        expect(unit.damage.medium).toBe(1);
        expect(unit.damage.long).toBe(0);
        expect(unit.damage.longMinimal).toBe(true);
        expect(unit.damage.shortMinimal).toBeFalsy();
        expect(unit.basePoints).toBe(22);
        expect(unit.abilities).toEqual(["ENE", "MEL", "TAG"]);
        expect(unit.role).toBe("Scout");
        expect(unit.isOfficial()).toBe(false);
        expect(record.MulSource).toBe("mordel");
        expect(record.BFMove).toBe("16\"j");
    });

    it("returns null for a unit with no Alpha Strike card", () => {
        expect(mordelToASMULUnit({ ...dola, alpha_strike: null })).toBeNull();
    });

    it("falls back to the full name when name parts are missing", () => {
        const record = mordelToASMULUnit({ ...dola, name_parts: null })!;
        expect(record.Class).toBe("Dola DOL-1A2");
        expect(record.Variant).toBeNull();
    });
});
