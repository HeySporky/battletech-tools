import { describe, expect, it } from "vitest";
import { battleArmorArmorTypes, battleArmorMaximumArmor } from "./battle-armor-armor-types";

describe("battle armor armor catalog (TM pp.169, 252-253, 281; TO:AUE pp.93-94, 225; IO:AE p.30)", () => {
    const find = (tag: string) => battleArmorArmorTypes.find(armor => armor.tag === tag);

    it("lists the eleven armor types", () => {
        expect(battleArmorArmorTypes.map(armor => armor.tag)).toEqual([
            "ba-standard", "ba-standard-advanced", "ba-standard-prototype",
            "ba-stealth-basic", "ba-stealth-improved", "ba-stealth-prototype", "ba-stealth-standard",
            "ba-fire-resistant", "ba-mimetic", "ba-laser-reflective", "ba-reactive",
        ]);
        for (const armor of battleArmorArmorTypes) {
            expect(armor.book, armor.tag).toBeTruthy();
            expect(armor.page, armor.tag).toBeGreaterThan(0);
            expect(armor.costPerPoint, armor.tag).toBeGreaterThan(0);
        }
    });

    it("carries weight per point and slots (TM p.169; TO:AUE p.93)", () => {
        const row = (tag: string) => [find(tag)?.kgPerPoint.clan, find(tag)?.kgPerPoint.is, find(tag)?.slots];
        expect(row("ba-standard")).toEqual([25, 50, 0]);
        expect(row("ba-standard-advanced")).toEqual([null, 40, 5]);
        expect(row("ba-standard-prototype")).toEqual([null, 100, 4]);
        expect(row("ba-stealth-basic")).toEqual([30, 55, 3]);
        expect(row("ba-stealth-improved")).toEqual([35, 60, 5]);
        expect(row("ba-stealth-prototype")).toEqual([null, 100, 4]);
        expect(row("ba-stealth-standard")).toEqual([35, 60, 4]);
        expect(row("ba-fire-resistant")).toEqual([30, null, 5]);
        expect(row("ba-mimetic")).toEqual([null, 50, 7]);
        expect(row("ba-laser-reflective")).toEqual([30, 55, 7]);
        expect(row("ba-reactive")).toEqual([35, 60, 7]);
    });

    it("carries cost per point (TM p.281; TO:AUE p.225)", () => {
        expect(battleArmorArmorTypes.map(armor => armor.costPerPoint)).toEqual([10000, 12500, 10000, 12000, 20000, 50000, 15000, 10000, 15000, 37000, 37000]);
    });

    it("carries the Defensive Factor bonus of the stealth armors (TM p.316)", () => {
        expect(battleArmorArmorTypes.map(armor => armor.defensiveFactorBonus)).toEqual([0, 0, 0, 0.2, 0.3, 0.2, 0.2, 0, 0.3, 0, 0]);
    });

    it("carries dates and availability (IO:AE p.30)", () => {
        expect(find("ba-standard")).toMatchObject({ techBase: "both", techRating: "e", availability: "F-F-E-D", prototype: 2680, introduced: 2868, book: "TM", page: 252 });
        expect(find("ba-standard-advanced")).toMatchObject({ techBase: "is", availability: "X-X-F-E", prototype: null, introduced: 3057 });
        expect(find("ba-standard-prototype")).toMatchObject({ techBase: "is", prototype: 3050, introduced: null });
        expect(find("ba-stealth-basic")).toMatchObject({ availability: "F-F-E-D", prototype: 2700, introduced: 2710, extinct: 2770, reintroduced: 3052 });
        expect(find("ba-stealth-standard")).toMatchObject({ availability: "F-X-E-D", prototype: 2710, introduced: 2720, extinct: 2770, reintroduced: 3053 });
        expect(find("ba-stealth-improved")).toMatchObject({ techBase: "both", availability: "X-X-F-E", prototype: 3055, introduced: 3057, clanDates: { introduced: 3058, extinct: null, reintroduced: null } });
        expect(find("ba-stealth-prototype")).toMatchObject({ techBase: "is", availability: "X-X-F-X", prototype: 3050, introduced: 3052, extinct: 3055 });
        expect(find("ba-fire-resistant")).toMatchObject({ techBase: "clan", techRating: "f", availability: "X-X-F-E", prototype: 3052, introduced: 3058, page: 253 });
        expect(find("ba-mimetic")).toMatchObject({ techBase: "is", availability: "X-X-F-E", prototype: 3058, introduced: 3061, page: 253 });
        expect(find("ba-laser-reflective")).toMatchObject({ techBase: "both", techRating: "f", availability: "X-X-F-E", prototype: 3074, introduced: 3089, book: "TO:AUE", page: 93 });
        expect(find("ba-reactive")).toMatchObject({ techBase: "both", techRating: "f", availability: "X-X-F-E", prototype: 3075, introduced: 3093, book: "TO:AUE", page: 94 });
    });

    it("limits armor by weight class (TM p.169)", () => {
        expect(battleArmorMaximumArmor).toEqual({ "pa-l": 2, light: 6, medium: 10, heavy: 14, assault: 18 });
    });
});
