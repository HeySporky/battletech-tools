import { describe, expect, it } from "vitest";
import { MICRO_MECH_CREDIT } from "./micro-mech-construction";
import {
    MICRO_MECH_BANNED_ITEMS,
    findMicroMechItem,
    getMicroMechAmmoShots,
    getMicroMechItemIntroduced,
    getMicroMechItemRange,
    microMechItems,
} from "./micro-mech-equipment-custom";
import { findUnitCatalogRecord } from "./equipment-lookup";

// "Micro-Mechs" 6.1.0.2, the MicroMech Weapons and Equipment Table and the Ammunition Shots Per Quarter Ton table
// (raw text lines 274-515). Each pinned row is as printed.
const row = (tag: string) => {
    const item = findMicroMechItem(tag);
    if (!item) throw new Error(`no record ${tag}`);
    return item;
};

describe("Micro-Mech equipment table", () => {
    it.each([
        // tag, heat, damage, kg, slots, cost, BV
        ["micro-er-laser-small", 2, 3, 500, 1, 11250, 17],
        ["micro-laser-large", 8, 8, 5000, 2, 100000, 124],
        ["micro-machine-gun", 0, 2, 500, 1, 5000, 5],
        ["micro-lrm-9", 0, "1/Hit", 3600, 2, 99900, 78],
        ["micro-srm-6", 0, "2/Hit", 3000, 2, 75000, 59],
        ["micro-recoilless-rifle-heavy", 0, 3, 325, 1, 5000, 22],
        ["micro-grenade-launcher", 0, 1, 100, 1, 3000, 2],
        ["micro-beagle-active-probe", 0, 0, 1500, 2, 200000, 10],
        ["micro-thunderbolt-os-unbound", 0, "10+Heat", 1000, 1, 250000, 40],
    ] as [string, number, number | string, number, number, number, number][])("%s is as printed", (tag, heat, damage, kg, slots, cost, bv) => {
        const item = row(tag);
        expect([item.heat, item.damage, item.weightKg, item.slots, item.cost, item.battleValue]).toEqual([heat, damage, kg, slots, cost, bv]);
    });

    it("has the table's rows: 15 energy, 18 ballistic, 75 missile, 11 equipment", () => {
        const count = (kind: string) => microMechItems.filter((item) => item.kind === kind).length;
        expect([count("energy"), count("ballistic"), count("missile"), count("equipment")]).toEqual([15, 18, 75, 11]);
        expect(new Set(microMechItems.map((item) => item.tag)).size).toBe(microMechItems.length);
    });

    it("prints shots per 250, 500, 750 and 1,000 kg", () => {
        expect(row("micro-lrm-9").ammo?.[0].shotsPerQuarterTon).toEqual([4, 7, 10, 13]);
        expect(row("micro-recoilless-rifle-heavy").ammo?.[0].shotsPerQuarterTon).toEqual([6, 12, 18, 25]);
        expect(row("micro-grenade-launcher").ammo?.[0].shotsPerQuarterTon).toEqual([6, 12, 18, 24]);
        expect(row("micro-machine-gun").ammo?.[0]).toEqual({ type: "standard", shotsPerQuarterTon: [50, 100, 150, 200], costPerTon: 1000, bvPerTon: 1 });
    });

    it("gives the LB-X autocannons a cluster line beside the standard one", () => {
        expect(row("micro-lb-2x-ac").ammo?.map((ammo) => [ammo.type, ammo.costPerTon])).toEqual([["standard", 2000], ["cluster", 3300]]);
        expect(row("micro-lb-5x-ac").ammo?.map((ammo) => [ammo.type, ammo.costPerTon])).toEqual([["standard", 9000], ["cluster", 15000]]);
    });

    it("gives energy weapons, equipment and one-shot launchers no ammunition", () => {
        expect(row("micro-laser-large").ammo).toBeUndefined();
        expect(row("micro-guardian-ecm-suite").ammo).toBeUndefined();
        expect(row("micro-rocket-launcher-10").ammo).toBeUndefined();
        expect(row("micro-rocket-launcher-10").oneShot).toBe(true);
    });

    it("builds missile launchers from tubes: one family, a size per row", () => {
        expect(microMechItems.filter((item) => item.family === "lrm").map((item) => item.tubes)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
        expect(microMechItems.filter((item) => item.family === "mrm")).toHaveLength(20);
        expect(microMechItems.filter((item) => item.family === "srm")).toHaveLength(6);
        expect(microMechItems.filter((item) => item.family === "streak-srm")).toHaveLength(6);
        expect(microMechItems.filter((item) => item.family === "elrm")).toHaveLength(10);
    });

    it("prints a letter note instead of a BV for Artemis IV, CASE, C3 and TAG", () => {
        for (const tag of ["micro-artemis-iv-fcs", "micro-case", "micro-case-ii", "micro-c3-master-computer", "micro-c3-slave", "micro-c3i-computer", "micro-target-acquisition-gear-tag"]) {
            expect(row(tag).battleValue, tag).toBeNull();
            expect(row(tag).bvNote, tag).toBeTruthy();
        }
    });

    it("has no record for a banned item", () => {
        for (const banned of MICRO_MECH_BANNED_ITEMS) {
            expect(microMechItems.some((item) => item.name.toLowerCase().includes(banned.toLowerCase())), banned).toBe(false);
        }
    });

    it("credits the document in every record's notes", () => {
        for (const item of microMechItems) expect(item.notes, item.tag).toContain(MICRO_MECH_CREDIT);
    });

    it("names a catalog record that exists for every canonTag", () => {
        for (const item of microMechItems.filter((each) => each.canonTag)) {
            const record = findUnitCatalogRecord("is", item.canonTag) ?? findUnitCatalogRecord("universal", item.canonTag);
            expect(record, `${item.tag} -> ${item.canonTag}`).toBeTruthy();
        }
    });

    it("gives every weapon a range: its own book's, or the catalog record's", () => {
        for (const item of microMechItems.filter((each) => each.kind !== "equipment")) {
            expect(getMicroMechItemRange(item), item.tag).not.toBeNull();
            expect(!!item.range === !!item.rangeSource, item.tag).toBe(true);
        }
        expect(getMicroMechItemRange(row("micro-er-laser-small"))).toEqual({ min: 0, short: 2, medium: 4, long: 5 });
        // Combat Equipment p.111: Heavy Recoilless Rifle 3/5/7.
        expect(getMicroMechItemRange(row("micro-recoilless-rifle-heavy"))).toEqual({ min: 0, short: 3, medium: 5, long: 7 });
        // No LRM 9 in any book: the LRM family's range, and the notes say so.
        expect(getMicroMechItemRange(row("micro-lrm-9"))).toEqual({ min: 6, short: 7, medium: 14, long: 21 });
        expect(row("micro-lrm-9").rangeExtrapolated).toBe(true);
        expect(row("micro-lrm-9").notes).toMatch(/extrapolated by NGCFells/);
    });

    it("takes the date from the catalog record, none where there is none", () => {
        expect(getMicroMechItemIntroduced(row("micro-er-laser-small"))).toBe(3058);
        expect(getMicroMechItemIntroduced(row("micro-recoilless-rifle-light"))).toBeNull();
    });

    it("counts shots from the table, or as the 2019 post's fraction of a ton", () => {
        const srm2 = row("micro-srm-2").ammo![0];
        expect([250, 500, 750, 1000, 1250].map((kg) => getMicroMechAmmoShots(srm2, kg))).toEqual([13, 25, 38, 50, 63]);
        // "For an SMR-2 .75 tons of ammunition would be 37 rounds, .50 tons would be 25 rounds and .25 tons would be 12 rounds."
        expect([250, 500, 750, 1000].map((kg) => getMicroMechAmmoShots(srm2, kg, "fraction-of-ton"))).toEqual([12, 25, 37, 50]);
    });
});
