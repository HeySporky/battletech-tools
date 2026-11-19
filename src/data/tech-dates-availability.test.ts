import { describe, expect, it } from "vitest";
import type { ITechDates } from "./data-interfaces";
import { getTechDatesAvailability } from "./equipment-registry";
import { EXPERIMENTAL_RULES_LEVEL } from "./rules-level-options";

// One tech-dates filter for every unit and every record (design 2026-10-24-catalog-consolidation §2).
const inYear = (year: number) => (introduced: number | null, extinct: number | null, reintroduced: number | null) =>
    (introduced !== null && introduced <= year && (extinct === null || extinct >= year))
    || (reintroduced !== null && reintroduced <= year);

// The Arrow IV standard ammunition's two date sets (IS 2600/2830/3044, Clan 2844).
const arrowIV: ITechDates & { clanDates?: ITechDates } = {
    introduced: 2600, extinct: 2830, reintroduced: 3044,
    clanDates: { introduced: 2844, extinct: null, reintroduced: null },
};

describe("getTechDatesAvailability", () => {
    it("reads clanDates for a Clan unit", () => {
        expect(getTechDatesAvailability(arrowIV, "clan", 2, inYear(2900))).toEqual({ available: true, asPrototype: false });
        expect(getTechDatesAvailability(arrowIV, "is", 2, inYear(2900)).available).toBe(false);
    });

    it("uses the record's own dates for a Clan unit when it has no clanDates", () => {
        const own = { ...arrowIV, clanDates: undefined };
        expect(getTechDatesAvailability(own, "clan", 2, inYear(2900)).available).toBe(false);
    });

    it("prefers production over a prototype for mixed tech", () => {
        const item = { prototype: 3040, introduced: 3060, extinct: null, reintroduced: null, clanDates: { introduced: 3050, extinct: null, reintroduced: null } };
        for (const mixed of ["mis", "mclan"]) {
            expect(getTechDatesAvailability(item, mixed, EXPERIMENTAL_RULES_LEVEL, inYear(3055))).toEqual({ available: true, asPrototype: false });
        }
    });

    it("keeps the Star League version for a Clan unit before the Clan version", () => {
        const item = { introduced: 2700, extinct: null, reintroduced: null, clanDates: { introduced: 2830, extinct: null, reintroduced: null } };
        expect(getTechDatesAvailability(item, "clan", 2, inYear(2790))).toEqual({ available: true, asPrototype: false });
    });
});
