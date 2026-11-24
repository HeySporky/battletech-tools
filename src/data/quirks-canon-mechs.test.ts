import { describe, expect, it } from "vitest";
import { findCanonEntry } from "./quirk-canon";
import { getQuirk } from "./quirk-registry";
import { canonMechQuirks } from "./quirks-canon-mechs";

const quirksOf = (chassis: string) => findCanonEntry(chassis)?.quirks;
const nameKey = (value: string) => value.toLowerCase().replace(/['’]/g, "");

describe("the BattleMech Quirk Table", () => {
    it("resolves every tag to a catalog quirk", () => {
        for (const entry of canonMechQuirks) for (const quirk of entry.quirks) expect(getQuirk(quirk.tag), `${entry.chassis}: ${quirk.tag}`).toBeDefined();
    });

    it("cites BMM pp.90-95 on every entry", () => {
        for (const entry of canonMechQuirks) {
            expect(entry.source.book).toBe("BattleMech Manual");
            expect(entry.source.page).toBeGreaterThanOrEqual(90);
            expect(entry.source.page).toBeLessThanOrEqual(95);
        }
    });

    it("has no chassis twice, by its name or another name it goes by", () => {
        const names = canonMechQuirks.flatMap((entry) => [entry.chassis, ...(entry.altChassis ?? [])].map(nameKey));
        expect(names.filter((name, index) => names.indexOf(name) !== index)).toEqual([]);
    });

    it("gives the Atlas Battlefists, Command 'Mech, Distracting and Improved Comm.", () => {
        expect(quirksOf("Atlas")).toEqual([
            { tag: "quirk-battlefists" },
            { tag: "quirk-command-mech" },
            { tag: "quirk-distracting" },
            { tag: "quirk-improved-communications" },
        ]);
    });

    it("gives the Banshee Rugged (1) and Bad Reputation before 3025", () => {
        expect(quirksOf("Banshee")).toEqual([{ tag: "quirk-rugged", parameter: 1 }, { tag: "quirk-bad-reputation", toYear: 3024 }]);
    });

    it("gives the Avatar Stabilized Weapon on its CT medium lasers", () => {
        expect(quirksOf("Avatar")).toEqual([{ tag: "quirk-stabilized-weapon", weapon: { name: "Medium Laser", location: "ct", all: true } }]);
    });

    it("gives the Catapult No/Minimal Arms and Weak Head Armor (1)", () => {
        expect(quirksOf("Catapult")).toEqual([{ tag: "quirk-no-minimal-arms" }, { tag: "quirk-weak-head-armor", parameter: 1 }]);
    });

    it("names a weapon the way the equipment catalog does: the Marauder's AC/5 (p.93)", () => {
        expect(quirksOf("Marauder")).toContainEqual({ tag: "quirk-exposed-weapon-linkage", weapon: { name: "Autocannon/5" } });
        expect(findCanonEntry("Marauder")?.source.page).toBe(93);
    });

    it("keeps a qualifier it cannot place as a note: the Sirocco's Directional Torso Mount (All) (p.94)", () => {
        expect(quirksOf("Sirocco")).toEqual([{ tag: "quirk-directional-torso-mount", note: "All" }, { tag: "quirk-difficult-to-maintain" }]);
    });

    it("finds a Clan 'Mech by either name, and neither 'Mech by the name both go by", () => {
        expect(findCanonEntry("Timber Wolf")?.chassis).toBe("Mad Cat (Timber Wolf)");
        expect(findCanonEntry("Mad Cat")?.chassis).toBe("Mad Cat (Timber Wolf)");
        expect(findCanonEntry("Viper")).toBeUndefined();
    });
});
