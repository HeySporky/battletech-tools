import { describe, expect, it } from "vitest";
import { aerospaceArmorTypes, getAerospaceArmorPointsPerTon } from "./aerospace-armor-types";

describe("aerospace and large-craft armor catalog", () => {
    const find = (tag: string) => aerospaceArmorTypes.find(armor => armor.tag === tag);

    it("lists the armor of TechManual p.192, Strategic Operations p.140 and IO:AE p.119", () => {
        expect(aerospaceArmorTypes.map(armor => armor.tag)).toEqual([
            "aerospace-standard", "light-ferro-aluminum", "ferro-aluminum", "clan-ferro-aluminum", "heavy-ferro-aluminum",
            "primitive-aerospace-fighter",
            "capital-standard", "improved-ferro-aluminum", "ferro-carbide", "lamellor-ferro-carbide",
        ]);
        for (const armor of aerospaceArmorTypes) {
            expect(armor.book, armor.tag).toBeTruthy();
            expect(armor.page, armor.tag).toBeGreaterThan(0);
            expect(armor.costMultiplier, armor.tag).toBeGreaterThan(0);
        }
    });

    it("gives fighters and small craft their points per ton (TM p.192)", () => {
        expect(getAerospaceArmorPointsPerTon("aerospace-standard", "aerospace-fighter", "is")).toBe(16);
        expect(getAerospaceArmorPointsPerTon("aerospace-standard", "aerospace-fighter", "clan")).toBe(16);
        expect(getAerospaceArmorPointsPerTon("aerospace-standard", "small-craft", "clan")).toBe(20);
        expect(getAerospaceArmorPointsPerTon("aerospace-standard", "small-craft", "is")).toBe(16);
        expect(getAerospaceArmorPointsPerTon("light-ferro-aluminum", "conventional-fighter", "is")).toBe(16.96);
        expect(getAerospaceArmorPointsPerTon("ferro-aluminum", "aerospace-fighter", "is")).toBe(17.92);
        expect(getAerospaceArmorPointsPerTon("clan-ferro-aluminum", "aerospace-fighter", "clan")).toBe(19.2);
        expect(getAerospaceArmorPointsPerTon("clan-ferro-aluminum", "small-craft", "clan")).toBe(24);
        expect(getAerospaceArmorPointsPerTon("heavy-ferro-aluminum", "aerospace-fighter", "is")).toBe(19.84);
        // Not available to the other tech base.
        expect(getAerospaceArmorPointsPerTon("ferro-aluminum", "aerospace-fighter", "clan")).toBeNull();
        expect(getAerospaceArmorPointsPerTon("clan-ferro-aluminum", "aerospace-fighter", "is")).toBeNull();
    });

    it("steps DropShip armor down by hull shape and tonnage (TM p.192)", () => {
        const points = (tag: string, unit: "spheroid-dropship" | "aerodyne-dropship", tons: number, tech: "is" | "clan") => getAerospaceArmorPointsPerTon(tag, unit, tech, tons);
        expect(points("aerospace-standard", "spheroid-dropship", 3500, "is")).toBe(16);
        expect(points("aerospace-standard", "spheroid-dropship", 12499, "clan")).toBe(20);
        expect(points("aerospace-standard", "spheroid-dropship", 12500, "is")).toBe(14);
        expect(points("aerospace-standard", "spheroid-dropship", 12500, "clan")).toBe(17);
        expect(points("aerospace-standard", "aerodyne-dropship", 5999, "is")).toBe(16);
        expect(points("aerospace-standard", "aerodyne-dropship", 6000, "is")).toBe(14);
        expect(points("aerospace-standard", "aerodyne-dropship", 35000, "is")).toBe(6);
        expect(points("aerospace-standard", "spheroid-dropship", 100000, "clan")).toBe(7);
        expect(points("ferro-aluminum", "spheroid-dropship", 16000, "is")).toBe(15.68);
        expect(points("heavy-ferro-aluminum", "aerodyne-dropship", 20000, "is")).toBe(9.92);
        expect(points("clan-ferro-aluminum", "spheroid-dropship", 70000, "clan")).toBe(8.4);
        // Outside the table.
        expect(points("aerospace-standard", "spheroid-dropship", 150, "is")).toBeNull();
        expect(points("aerospace-standard", "aerodyne-dropship", 40000, "is")).toBeNull();
    });

    it("takes fighter weapon slots for ferro-aluminum (TM p.192)", () => {
        expect(find("aerospace-standard")?.fighterSlots).toEqual({ is: 0, clan: 0, placement: "" });
        expect(find("light-ferro-aluminum")?.fighterSlots).toEqual({ is: 1, clan: null, placement: "Aft" });
        expect(find("ferro-aluminum")?.fighterSlots).toEqual({ is: 2, clan: null, placement: "1 each Wing" });
        expect(find("clan-ferro-aluminum")?.fighterSlots).toEqual({ is: null, clan: 2, placement: "1 each Wing" });
        expect(find("heavy-ferro-aluminum")?.fighterSlots).toEqual({ is: 4, clan: null, placement: "1 each Arc" });
    });

    it("gives capital-scale points per ton for JumpShips, WarShips and stations (SO p.140)", () => {
        const points = (tag: string, tons: number, tech: "is" | "clan") => getAerospaceArmorPointsPerTon(tag, "advanced-aerospace", tech, tons);
        expect(points("capital-standard", 100000, "is")).toBe(0.8);
        expect(points("capital-standard", 100000, "clan")).toBe(1.0);
        expect(points("improved-ferro-aluminum", 149999, "is")).toBe(1.0);
        expect(points("improved-ferro-aluminum", 150000, "is")).toBe(0.8);
        expect(points("ferro-carbide", 200000, "clan")).toBe(1.1);
        expect(points("lamellor-ferro-carbide", 250000, "is")).toBe(1.0);
        expect(points("lamellor-ferro-carbide", 2500000, "clan")).toBe(1.1);
        expect(points("lamellor-ferro-carbide", 1999, "is")).toBeNull();
        expect(find("capital-standard")?.scale).toBe("capital");
        // Fighter armor is not capital armor and the reverse.
        expect(points("aerospace-standard", 100000, "is")).toBeNull();
        expect(getAerospaceArmorPointsPerTon("ferro-carbide", "aerospace-fighter", "is")).toBeNull();
    });

    it("carries cost, rating and dates (TM p.283, SO p.146, IO:AE pp.29-30)", () => {
        expect(find("aerospace-standard")).toMatchObject({ costMultiplier: 10000, techRating: "d", availability: "C-C-C-B", prototype: 2460, introduced: 2470, extinct: null, book: "TM", page: 205 });
        expect(find("light-ferro-aluminum")).toMatchObject({ costMultiplier: 15000, techBase: "is", techRating: "e", availability: "X-X-E-D", prototype: 3055, introduced: 3067 });
        expect(find("ferro-aluminum")).toMatchObject({ costMultiplier: 20000, techBase: "is", availability: "D-F-D-C", prototype: 2557, introduced: 2571, extinct: 2810, reintroduced: 3040 });
        expect(find("clan-ferro-aluminum")).toMatchObject({ costMultiplier: 20000, techBase: "clan", techRating: "f", availability: "X-E-D-C", prototype: 2820, introduced: 2825, extinct: null });
        expect(find("heavy-ferro-aluminum")).toMatchObject({ costMultiplier: 25000, techBase: "is", prototype: 3056, introduced: 3069 });
        expect(find("primitive-aerospace-fighter")).toMatchObject({ costMultiplier: 5000, techBase: "is", techRating: "c", availability: "B-C-B-B", prototype: 2100, introduced: 2300, book: "IO:AE", page: 119 });
        expect(getAerospaceArmorPointsPerTon("primitive-aerospace-fighter", "aerospace-fighter", "is")).toBeCloseTo(10.72, 6);
        expect(find("capital-standard")).toMatchObject({ costMultiplier: 10000, techBase: "both", book: "SO", page: 140 });
        expect(find("improved-ferro-aluminum")).toMatchObject({ costMultiplier: 50000, techRating: "e", availability: "E-X-E-D", prototype: 2500, introduced: 2520, extinct: 2950, reintroduced: 3052 });
        expect(find("ferro-carbide")).toMatchObject({ costMultiplier: 75000, availability: "E-F-E-D", prototype: 2550, introduced: 2570, extinct: 2950, reintroduced: 3055 });
        expect(find("lamellor-ferro-carbide")).toMatchObject({ costMultiplier: 100000, availability: "E-F-E-D", prototype: 2600, introduced: 2615, extinct: 2950, reintroduced: 3055 });
    });
});
