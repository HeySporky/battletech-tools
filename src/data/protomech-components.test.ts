import { describe, expect, it } from "vitest";
import { getProtoMechJumpJetWeightKg, protoMechComponents } from "./protomech-components";

describe("ProtoMech component catalog (TM pp.82-86, 279; IO:AE pp.59, 92-95, 215)", () => {
    const find = (tag: string) => protoMechComponents.find(item => item.tag === tag);

    it("lists cockpits, heat sinks, jump jets and structures", () => {
        expect(protoMechComponents.map(item => `${item.kind}: ${item.tag}`)).toEqual([
            "cockpit: protomech-cockpit",
            "cockpit: protomech-ultraheavy-cockpit",
            "heat-sink: protomech-heat-sink",
            "jump-jet: protomech-jump-jets",
            "jump-jet: protomech-extended-jump-jets",
            "structure: protomech-structure",
            "structure: protomech-ultraheavy-structure",
            "structure: protomech-quad-structure",
            "structure: protomech-glider-structure",
        ]);
        for (const item of protoMechComponents) {
            expect(item.techBase, item.tag).toBe("clan");
            expect(item.book, item.tag).toBeTruthy();
            expect(item.page, item.tag).toBeGreaterThan(0);
        }
    });

    it("weighs the cockpits 500 and 750 kilograms", () => {
        expect(find("protomech-cockpit")).toMatchObject({
            weightKg: 500, minTons: 2, maxTons: 9, cost: { basis: "fixed", value: 500000 },
            techRating: "f", availability: "X-X-E-D", prototype: 3055, introduced: 3060, book: "TM", page: 85,
        });
        expect(find("protomech-ultraheavy-cockpit")).toMatchObject({
            weightKg: 750, minTons: 10, maxTons: 15, cost: { basis: "fixed", value: 800000 },
            techRating: "f", availability: "X-X-D", prototype: null, introduced: 3083, book: "IO:AE", page: 95,
        });
    });

    it("weighs a heat sink 250 kilograms at 2,000 C-bills each", () => {
        expect(find("protomech-heat-sink")).toMatchObject({
            weightKg: 250, cost: { basis: "each", value: 2000 }, techRating: "f", availability: "X-X-E-E", prototype: 3055, introduced: 3060, book: "TM", page: 86,
        });
    });

    it("weighs jump jets by Jumping MP and ProtoMech tonnage", () => {
        expect(getProtoMechJumpJetWeightKg("protomech-jump-jets", 5, 4)).toBe(200);
        expect(getProtoMechJumpJetWeightKg("protomech-jump-jets", 6, 5)).toBe(500);       // TM p.84 example
        expect(getProtoMechJumpJetWeightKg("protomech-jump-jets", 9, 3)).toBe(300);
        expect(getProtoMechJumpJetWeightKg("protomech-jump-jets", 12, 3)).toBe(450);      // Ultraheavy: 150 kg (IO:AE p.95)
        expect(getProtoMechJumpJetWeightKg("protomech-extended-jump-jets", 5, 4)).toBe(400);
        expect(getProtoMechJumpJetWeightKg("protomech-extended-jump-jets", 6, 8)).toBe(1600);
        expect(getProtoMechJumpJetWeightKg("protomech-extended-jump-jets", 10, 2)).toBe(600);
        expect(getProtoMechJumpJetWeightKg("protomech-jump-jets", 1, 2)).toBeNull();
        expect(getProtoMechJumpJetWeightKg("protomech-heat-sink", 5, 2)).toBeNull();
        expect(find("protomech-jump-jets")).toMatchObject({ cost: { basis: "jump-squared-per-unit-ton", value: 200 }, techRating: "d", availability: "X-X-D-C", prototype: 3055, introduced: 3060, book: "TM", page: 84 });
        expect(find("protomech-extended-jump-jets")).toMatchObject({ cost: { basis: "jump-squared-per-unit-ton", value: 500 }, jumpAsRun: true, availability: "X-X-F-D", prototype: 3071, introduced: 3075, book: "IO:AE", page: 59 });
    });

    it("weighs every structure a tenth of the ProtoMech", () => {
        expect(find("protomech-structure")).toMatchObject({ weightFraction: 0.1, minTons: 2, maxTons: 9, cost: { basis: "per-unit-ton", value: 400 }, techRating: "d", availability: "X-X-C-D", prototype: 3055, introduced: 3060, book: "TM", page: 82 });
        expect(find("protomech-ultraheavy-structure")).toMatchObject({ weightFraction: 0.1, minTons: 10, maxTons: 15, cost: { basis: "per-unit-ton", value: 400 }, techRating: "d", introduced: 3083, book: "IO:AE" });
        expect(find("protomech-quad-structure")).toMatchObject({ weightFraction: 0.1, cost: { basis: "per-unit-ton", value: 500 }, techRating: "d", introduced: 3083 });
        expect(find("protomech-glider-structure")).toMatchObject({ weightFraction: 0.1, cost: { basis: "per-unit-ton", value: 600 }, techRating: "f", introduced: 3084 });
    });
});
