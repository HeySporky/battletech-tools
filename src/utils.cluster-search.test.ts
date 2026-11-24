import { describe, expect, it } from "vitest";
import { IASMULUnit } from "./classes/alpha-strike-unit";
import Pilot from "./classes/pilot";
import { filterMULRecords, getClusterHitsPerRoll } from "./utils";

describe("the Cluster Hits Table", () => {
    it("has a column for 40 missiles", () => {
        expect(getClusterHitsPerRoll(2, 40)).toBe(12);
        expect(getClusterHitsPerRoll(7, 40)).toBe(24);
        expect(getClusterHitsPerRoll(12, 40)).toBe(40);
    });

    it("still reads the columns for 2 to 30", () => {
        expect(getClusterHitsPerRoll(7, 20)).toBe(12);
        expect(getClusterHitsPerRoll(11, 30)).toBe(30);
        expect(getClusterHitsPerRoll(2, 2)).toBe(1);
    });

    it("has no column for 31 to 39", () => {
        expect(getClusterHitsPerRoll(7, 31)).toBe(-1);
        expect(getClusterHitsPerRoll(7, 39)).toBe(-1);
    });
});

describe("MUL search terms still being typed", () => {
    const record = (name: string, pv: number): IASMULUnit => ({
        Name: name, Variant: "", Class: name, BFPointValue: pv,
        BFDamageShort: 2, BFDamageMedium: 2, BFDamageLong: 1, BFArmor: 4, BFStructure: 3,
        DateIntroduced: "3025", BFMove: "8\"", BFAbilities: "",
    } as unknown as IASMULUnit);
    const filters = (term: string) => ({ term, abilities: [], era: 0, rules: "", tech: "", role: "", type: 0, factions: [], rulesets: [], sources: [] }) as never;
    const names = (term: string) => filterMULRecords([record("Atlas", 52), record("Locust", 18)], filters(term)).map((found) => found.Name);

    it("filter by the finished operator", () => {
        expect(names("pv>20")).toEqual(["Atlas"]);
        expect(names("atlas pv<=52")).toEqual(["Atlas"]);
    });

    it("do not hide every unit while the number is missing or not a number", () => {
        expect(names("pv>")).toEqual(["Atlas", "Locust"]);
        expect(names("pv>x")).toEqual(["Atlas", "Locust"]);
        expect(names("atlas short>=")).toEqual(["Atlas"]);
    });
});

describe("a pilot's wounds", () => {
    it("come back from a save, kept between 0 and 6", () => {
        const pilot = new Pilot();
        pilot.wounds = 3;
        expect(new Pilot(JSON.parse(JSON.stringify(pilot.export()))).wounds).toBe(3);
        expect(new Pilot({ ...pilot.export(), wounds: 99 }).wounds).toBe(6);
        expect(new Pilot({ ...pilot.export(), wounds: -2 }).wounds).toBe(0);
        expect(new Pilot({ ...pilot.export(), wounds: "2" as never }).wounds).toBe(0);
    });
});
