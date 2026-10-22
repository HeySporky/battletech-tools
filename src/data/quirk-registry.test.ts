import { afterEach, describe, expect, it } from "vitest";
import { IAssignedQuirk, IQuirk } from "./quirk-interfaces";
import { getQuirk, getQuirkOfferIssue, getQuirkPoints, setLocalCustomQuirks } from "./quirk-registry";

const mechOnly: IQuirk = {
    tag: "quirk-test-mech-only",
    name: "Test Mech Only",
    altNames: ["Test-Mech-Only"],
    kind: "positive",
    cost: { points: 2 },
    unitTypes: ["mech"],
    attaches: ["unit"],
    summary: "A fixture.",
    sources: [{ book: "Test", page: 1 }],
    editions: ["total-warfare"],
    rulesLevel: 3,
};

const accurate: IQuirk = {
    ...mechOnly,
    tag: "quirk-test-accurate",
    name: "Test Accurate",
    altNames: [],
    cost: { per: { points: 1, damage: 5, scope: "weapon" }, zeroDamagePoints: 2 },
    attaches: ["weapon"],
};

const custom: IQuirk = {
    ...mechOnly,
    tag: "quirk-custom-test",
    name: "Custom Test",
    altNames: [],
    editions: [],
    rulesLevel: 6,
    sources: [],
    custom: true,
};

const assigned = (tag: string, parameter?: string | number): IAssignedQuirk => ({ tag, parameter });

afterEach(() => setLocalCustomQuirks([]));

describe("getQuirkOfferIssue", () => {
    it("refuses a quirk for a unit type it does not list", () => {
        expect(getQuirkOfferIssue(mechOnly, "vehicle", "total-warfare", 3)).toBe("unit-type");
    });

    it("offers a quirk in its edition at its level", () => {
        expect(getQuirkOfferIssue(mechOnly, "mech", "total-warfare", 3)).toBeNull();
    });

    it("refuses a quirk below its level", () => {
        expect(getQuirkOfferIssue(mechOnly, "mech", "total-warfare", 2)).toBe("level");
    });

    it("refuses a quirk outside its editions", () => {
        expect(getQuirkOfferIssue(mechOnly, "mech", "battledroids", 3)).toBe("edition");
    });

    it("offers a custom quirk only from the custom level up", () => {
        expect(getQuirkOfferIssue(custom, "mech", "total-warfare", 5)).toBe("level");
        expect(getQuirkOfferIssue(custom, "mech", "total-warfare", 6)).toBeNull();
        expect(getQuirkOfferIssue(custom, "mech", "battledroids", 6)).toBeNull();
    });
});

describe("getQuirk", () => {
    it("finds a quirk by an alternate name in another case", () => {
        setLocalCustomQuirks([mechOnly]);
        expect(getQuirk("test-mech-ONLY")?.tag).toBe("quirk-test-mech-only");
    });

    it("finds a quirk by tag", () => {
        setLocalCustomQuirks([mechOnly]);
        expect(getQuirk("quirk-test-mech-only")?.name).toBe("Test Mech Only");
    });

    it("finds nothing for an unknown name", () => {
        expect(getQuirk("no such quirk")).toBeUndefined();
    });
});

describe("getQuirkPoints", () => {
    it("costs a fixed positive quirk its points", () => {
        expect(getQuirkPoints(mechOnly, assigned(mechOnly.tag), 0)).toBe(2);
    });

    it("costs a negative quirk as negative points", () => {
        expect(getQuirkPoints({ ...mechOnly, kind: "negative" }, assigned(mechOnly.tag), 0)).toBe(-2);
    });

    it("costs per damage, rounding any fraction up", () => {
        expect(getQuirkPoints(accurate, assigned(accurate.tag), 10)).toBe(2);
        expect(getQuirkPoints(accurate, assigned(accurate.tag), 11)).toBe(3);
    });

    it("costs a zero-damage weapon its fixed points", () => {
        expect(getQuirkPoints(accurate, assigned(accurate.tag), 0)).toBe(2);
    });

    it("costs a choice quirk the chosen value", () => {
        const rugged: IQuirk = { ...mechOnly, cost: { choices: [1, 2] } };
        expect(getQuirkPoints(rugged, assigned(rugged.tag, 2), 0)).toBe(2);
        expect(getQuirkPoints(rugged, assigned(rugged.tag, 1), 0)).toBe(1);
    });

    it("costs a range-band choice by the band's position", () => {
        const improved: IQuirk = {
            ...mechOnly,
            cost: { choices: [1, 2, 3] },
            parameter: { kind: "range-band", options: ["short", "medium", "long"] },
        };
        expect(getQuirkPoints(improved, assigned(improved.tag, "long"), 0)).toBe(3);
        expect(getQuirkPoints(improved, assigned(improved.tag, "short"), 0)).toBe(1);
    });

    it("costs a quirk by what it is attached to", () => {
        const em: IQuirk = { ...mechOnly, kind: "negative", cost: { byAttach: { weapon: 1, unit: 2 } }, attaches: ["weapon", "unit"] };
        expect(getQuirkPoints(em, { tag: em.tag, equipmentUuid: "w1" }, 0)).toBe(-1);
        expect(getQuirkPoints(em, { tag: em.tag }, 0)).toBe(-2);
    });

    it("costs a quirk its numeric parameter", () => {
        const weakHead: IQuirk = { ...mechOnly, kind: "negative", cost: { fromParameter: true }, parameter: { kind: "value" } };
        expect(getQuirkPoints(weakHead, assigned(weakHead.tag, 2), 0)).toBe(-2);
        expect(getQuirkPoints(weakHead, assigned(weakHead.tag), 0)).toBe(0);
    });
});
