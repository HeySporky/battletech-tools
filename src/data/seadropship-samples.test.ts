import { describe, expect, it } from "vitest";
import SmallCraft from "../classes/small-craft";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import { getSeaDropshipSamples } from "./seadropship-samples";
import { getSeaDropshipsReadout } from "./seadropships-readout";
import { TRO_DOCUMENTS } from "../ui/pages/classic-battletech/tro-jbt";


/** SeaDropships plan (#643), Task 6: the Pelican, Petrel and Gannet, built to the spec table. */

const load = (id: string): SmallCraft => {
    const sample = getSeaDropshipSamples().find((each) => each.id === id);
    if (!sample) throw new Error(`no sample ${id}`);
    return new SmallCraft(JSON.stringify(sample.save));
};
const bayCount = (craft: SmallCraft, tag: string): number => craft.getBays().filter((bay) => bay.tag === tag).reduce((sum, bay) => sum + bay.amount, 0);

describe("SeaDropship samples", () => {
    it("the three ships build legal, on the Flotation Hull, to the spec table", () => {
        const samples = getSeaDropshipSamples();
        expect(samples.map((sample) => sample.id)).toEqual(["pelican", "petrel", "gannet", "pregnant-guppy"]);
        for (const [id, tonnage, thrust] of [["pelican", 5000, 4], ["petrel", 7000, 3], ["gannet", 2000, 5], ["pregnant-guppy", 4000, 2]] as const) {
            const craft = load(id);
            expect(craft.getIssues(CUSTOM_HOMEBREW_RULES_LEVEL), id).toEqual([]);
            expect(craft.getRemainingTonnage(), id).toBeGreaterThanOrEqual(0);
            expect(craft.getShape(), id).toBe("aerodyne");
            expect(craft.hasFlotationHull(), id).toBe(true);
            expect(craft.getTonnage(), id).toBe(tonnage);
            expect(craft.getSafeThrust(), id).toBe(thrust);
            expect(craft.getRequiredRulesLevel(), id).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
            expect(craft.getBattleValue(), id).toBeGreaterThan(0);
            expect(craft.getCBillCost(), id).toBeGreaterThan(0);
            expect(craft.tro.export()?.text?.notes, id).toContain("NOT OFFICIAL");
        }
    });

    it("the Pelican carries 6 well decks, 4 'Mech cubicles, 2 foot infantry bays", () => {
        const craft = load("pelican");
        expect(bayCount(craft, "well-deck")).toBe(6);
        expect(bayCount(craft, "mech")).toBe(4);
        expect(bayCount(craft, "infantry-foot")).toBe(2);
    });

    it("the Petrel hauls about 3,500 tons of cargo and 50 passengers; the Gannet carries a small craft and LRT torpedoes", () => {
        const petrel = load("petrel");
        expect(bayCount(petrel, "cargo")).toBeGreaterThanOrEqual(3500);
        expect(bayCount(petrel, "cargo")).toBeLessThanOrEqual(3700);
        expect(petrel.getPassengers()).toBe(50);
        const gannet = load("gannet");
        expect(bayCount(gannet, "small-craft")).toBe(1);
        expect(gannet.getEquipmentList().filter((item) => item.tag?.startsWith("lrt-")).length).toBeGreaterThan(0);
    });

    it("the Pregnant Guppy is StingerTheRaven's forum stat block, built as posted on the Flotation Hull", () => {
        const guppy = load("pregnant-guppy");
        expect(guppy.isMilitary()).toBe(true);
        expect(guppy.getStructuralIntegrity()).toBe(10);
        expect(guppy.getMaxThrust()).toBe(3);
        expect(guppy.getFuelTons()).toBe(222);
        expect(guppy.getTotalHeatSinks()).toBe(83);
        expect(guppy.getTotalArmorPoints()).toBe(760);
        expect(guppy.getEscapePods()).toBe(20);
        expect(bayCount(guppy, "vehicle-light")).toBe(8);
        expect(bayCount(guppy, "vehicle-heavy")).toBe(4);
        expect(bayCount(guppy, "vehicle-superheavy")).toBe(2);
        expect(bayCount(guppy, "fighter")).toBe(2);
        expect(bayCount(guppy, "cargo")).toBe(204);
        const weapons = guppy.getEquipmentList().filter((item) => !item.isAmmo);
        const count = (tag: string) => weapons.filter((item) => item.tag === tag).length;
        expect([count("large-pulse-laser"), count("large-laser"), count("autocannon-standard-b"), count("lrm-20")]).toEqual([5, 5, 11, 8]);
        // His 200 tons of sealant, pumps and plating are the hull's 5%.
        expect(guppy.getFlotationHullWeight()).toBe(200);
        const sample = getSeaDropshipSamples().find((each) => each.id === "pregnant-guppy");
        expect(sample?.forum?.url).toBe("https://www.battletech.com/forums/index.php?topic=73429.0");
        expect(guppy.tro.export()?.text?.notes).toContain("Custom Homebrew by StingerTheRaven (BattleTech forums, Pregnant Guppy: an amphibious dropship, 25 April 2021)");
    });

    it("offers every sample, the Pregnant Guppy among them", () => {
        expect(getSeaDropshipSamples().map((sample) => sample.id)).toEqual(["pelican", "petrel", "gannet", "pregnant-guppy"]);
    });

    it("the readout credits the forum creator by username with the thread and its URL", () => {
        const readout = getSeaDropshipsReadout();
        expect(readout).toMatch(/## Pregnant Guppy\s+\*Custom Homebrew by StingerTheRaven \(BattleTech forums, Pregnant Guppy: an amphibious dropship, 25 April 2021\)/);
        expect(readout).toContain("https://www.battletech.com/forums/index.php?topic=73429.0");
    });

    it("the readout lists each ship and credits Vehrec for the Pelican, NGCFells for the Petrel and Gannet", () => {
        const readout = getSeaDropshipsReadout();
        expect(readout).toContain("## Pelican");
        expect(readout).toContain("## Petrel");
        expect(readout).toContain("## Gannet");
        expect(readout).toMatch(/## Pelican\s+\*Custom Homebrew by Vehrec \(BattleTech forums, ok time for silly question about dropships and submarines, 14 February 2015/);
        expect(readout).toContain("https://www.battletech.com/forums/index.php?topic=44777.0");
        expect(readout).toMatch(/## Petrel\s+\*NGCFells/);
        expect(readout).toMatch(/## Gannet\s+\*NGCFells/);
    });

    it("the TRO index files SeaDropships under Unit Types", () => {
        const doc = TRO_DOCUMENTS.find((each) => each.slug === "seadropships");
        expect(doc?.category).toBe("unit-types");
        expect(doc?.text).toContain("## Pelican");
        expect(doc?.examples).toEqual(["Pelican", "Petrel", "Gannet", "Pregnant Guppy"]);
    });
});
