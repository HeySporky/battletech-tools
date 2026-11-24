import { describe, expect, it } from "vitest";
import { AlphaStrikeUnit, IASMULUnit } from "./alpha-strike-unit";

// Large craft from the MUL carry their damage by firing arc (BFArcs, read off the MUL card back), not as one
// S/M/L/E line (#32).
const overlordArcs = {
    front: { std: ["8", "9", "4", ""] },
    rear: { std: ["5", "6", "3", ""] },
    left: { std: ["3", "3", "2", ""] },
    right: { std: ["3", "3", "2", ""], spe: "PNT1" },
};

function mulRecord(extra: Partial<IASMULUnit> & Record<string, unknown>): IASMULUnit {
    return {
        Id: 100201, Name: "Overlord", Variant: "(Vehicle)", Class: "Aerospace Craft", Tonnage: 9700, BFType: "DS",
        BFSize: 2, BFMove: "3p", BFArmor: 26, BFStructure: 9, BFPointValue: 69, BFAbilities: "TH 3",
        BFDamageShort: 0, BFDamageMedium: 0, BFDamageLong: 0, BFDamageExtreme: 0, BFOverheat: 0, BFTMM: 0,
        Role: { Id: 1, Name: "None", Image: null, SortOrder: 0 },
        Type: { Id: 17, Name: "Aerospace Craft", Image: null, SortOrder: 7 },
        ...extra,
    } as unknown as IASMULUnit;
}

describe("Alpha Strike unit arcs", () => {
    it("takes a large craft's arcs from its MUL record", () => {
        const unit = new AlphaStrikeUnit();
        unit.importMUL(mulRecord({ BFArcs: overlordArcs }));
        expect(unit.arcs).toEqual(overlordArcs);
        expect(unit.hasArcs()).toBe(true);
    });

    it("keeps the arcs through a save and load", () => {
        const unit = new AlphaStrikeUnit();
        unit.importMUL(mulRecord({ BFArcs: overlordArcs }));
        const reloaded = new AlphaStrikeUnit();
        reloaded.importUnit(unit.export());
        expect(reloaded.arcs).toEqual(overlordArcs);
    });

    it("has no arcs when the record has none", () => {
        const unit = new AlphaStrikeUnit();
        unit.importMUL(mulRecord({}));
        expect(unit.arcs).toBeNull();
        expect(unit.hasArcs()).toBe(false);
    });

    it("drops anything in saved arcs that isn't an arc of short text values", () => {
        const unit = new AlphaStrikeUnit();
        unit.importMUL(mulRecord({
            BFArcs: <never>{
                front: { std: ["8", "9", "4", ""], cap: ["<b>", 5, "1", "2"], spe: 7 },
                sideways: { std: ["1", "1", "1", "1"] },
                rear: "nonsense",
                left: { std: ["3", "3"], msl: ["2", "2", "2", "x".repeat(50)] },
            },
        }));
        expect(unit.arcs).toEqual({ front: { std: ["8", "9", "4", ""] } });
    });
});

describe("Alpha Strike ground units (#32)", () => {
    it("counts every aerospace type as not a ground unit, so none can sprint", () => {
        for (const type of ["AF", "CF", "SC", "DS", "DA", "JS", "WS", "SS"]) {
            const unit = new AlphaStrikeUnit();
            unit.type = type;
            unit.move = [{ move: 5, currentMove: 5, type: "" }] as typeof unit.move;
            expect(unit.isGroundUnit(), type).toBe(false);
        }
        const mech = new AlphaStrikeUnit();
        mech.move = [{ move: 5, currentMove: 5, type: "" }] as typeof mech.move;
        expect(mech.isGroundUnit()).toBe(true);
    });
});
