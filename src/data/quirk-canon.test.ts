import { describe, expect, it } from "vitest";
import { ICanonQuirkEntry } from "./quirk-canon-interfaces";
import { findCanonEntry, resolveCanonQuirks } from "./quirk-canon";
import { IQuirkTargets } from "./quirk-interfaces";

// Fixtures built here, not taken from the data file.
const source = { book: "BattleMech Manual", page: 90 };
const entry = (quirks: ICanonQuirkEntry["quirks"]): ICanonQuirkEntry => ({ chassis: "Test", quirks, source });

const weapons: Record<string, { name: string; location?: string }> = {
    m1: { name: "Medium Laser", location: "ct" },
    m2: { name: "Medium Laser", location: "ct" },
    m3: { name: "Medium Laser", location: "ra" },
    g1: { name: "Gauss Rifle", location: "rt" },
};
const targets: IQuirkTargets = {
    locations: [{ tag: "la", label: "Left Arm" }, { tag: "ra", label: "Right Arm" }, { tag: "ct", label: "Center Torso" }],
    weapons: Object.keys(weapons).map((uuid) => ({ uuid, label: weapons[uuid].name, maxDamage: 5 })),
    unitMaxDamage: 30,
};
const unit = (clan = false) => ({ targets, weaponInfo: (uuid: string) => weapons[uuid], clan });

describe("findCanonEntry", () => {
    it("finds an entry by either name, ignoring case and apostrophes", () => {
        const entries: ICanonQuirkEntry[] = [
            { chassis: "Cauldron-Born", altChassis: ["Ebon Jaguar"], quirks: [], source },
            { chassis: "Ostroc", quirks: [], source },
        ];
        expect(findCanonEntry("ebon jaguar", entries)?.chassis).toBe("Cauldron-Born");
        expect(findCanonEntry("CAULDRON-BORN", entries)).toBeDefined();
        expect(findCanonEntry("O'stroc", entries)?.chassis).toBe("Ostroc");
        expect(findCanonEntry("Atlas", entries)).toBeUndefined();
    });
});

describe("resolveCanonQuirks", () => {
    // A final "s" is dropped only to read a plural; two names that differ by one stay apart (final review).
    it("does not merge two weapons whose names differ only by a final s", () => {
        const pair: Record<string, { name: string; location?: string }> = { a: { name: "Thunder", location: "ra" }, b: { name: "Thunders", location: "ra" } };
        const pairUnit = {
            targets: { ...targets, weapons: Object.keys(pair).map((uuid) => ({ uuid, label: pair[uuid].name, maxDamage: 5 })) },
            weaponInfo: (uuid: string) => pair[uuid],
            clan: false,
        };
        expect(resolveCanonQuirks(entry([{ tag: "quirk-stabilized-weapon", weapon: { name: "Thunder", all: true } }]), pairUnit).quirks)
            .toEqual([{ tag: "quirk-stabilized-weapon", equipmentUuid: "a" }]);
        expect(resolveCanonQuirks(entry([{ tag: "quirk-stabilized-weapon", weapon: { name: "Thunders", all: true } }]), pairUnit).quirks)
            .toEqual([{ tag: "quirk-stabilized-weapon", equipmentUuid: "b" }]);
    });

    it("puts a weapon quirk on every matching weapon in the location, and notes what it cannot place", () => {
        const result = resolveCanonQuirks(entry([
            { tag: "quirk-stabilized-weapon", weapon: { name: "Medium Lasers", location: "ct", all: true } },
            { tag: "quirk-stabilized-weapon", weapon: { name: "PPC" } },
        ]), unit());
        expect(result.quirks).toEqual([
            { tag: "quirk-stabilized-weapon", equipmentUuid: "m1" },
            { tag: "quirk-stabilized-weapon", equipmentUuid: "m2" },
        ]);
        expect(result.notes).toEqual(["Stabilized Weapon: no PPC on this 'Mech, not applied"]);
    });

    it("puts a single-weapon quirk on the first match and says so when there are more", () => {
        const result = resolveCanonQuirks(entry([{ tag: "quirk-stabilized-weapon", weapon: { name: "Medium Laser" } }]), unit());
        expect(result.quirks).toEqual([{ tag: "quirk-stabilized-weapon", equipmentUuid: "m1" }]);
        expect(result.notes).toEqual(["Stabilized Weapon: put on the first of 3 Medium Laser"]);
    });

    it("gives a quirk listed for two arms one assignment per arm", () => {
        const result = resolveCanonQuirks(entry([{ tag: "quirk-barrel-fist", locations: ["la", "ra"] }]), unit());
        expect(result.quirks).toEqual([{ tag: "quirk-barrel-fist", location: "la" }, { tag: "quirk-barrel-fist", location: "ra" }]);
        expect(result.notes).toEqual([]);
    });

    it("carries 'prior to 3025' as toYear 3024, with a parameter", () => {
        const result = resolveCanonQuirks(entry([
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-bad-reputation", toYear: 3024 },
        ]), unit());
        expect(result.quirks).toEqual([{ tag: "quirk-rugged", parameter: 1 }, { tag: "quirk-bad-reputation", toYear: 3024 }]);
    });

    it("skips a Clan-only quirk on an Inner Sphere 'Mech, with a note", () => {
        const clanOnly = entry([{ tag: "quirk-bad-reputation", techBase: "clan" }]);
        expect(resolveCanonQuirks(clanOnly, unit(false))).toEqual({ quirks: [], notes: ["Bad Reputation: Clan only, not applied"] });
        expect(resolveCanonQuirks(clanOnly, unit(true)).quirks).toEqual([{ tag: "quirk-bad-reputation" }]);
    });

    it("never applies a quirk with a note, and says so", () => {
        const result = resolveCanonQuirks(entry([{ tag: "quirk-distracting", note: "BLR-1Gb only" }]), unit());
        expect(result).toEqual({ quirks: [], notes: ["Distracting (BLR-1Gb only): not applied, check by hand"] });
    });

    it("notes a tag the catalog does not know instead of assigning it", () => {
        const result = resolveCanonQuirks(entry([{ tag: "quirk-no-such-thing" }]), unit());
        expect(result).toEqual({ quirks: [], notes: ["quirk-no-such-thing: not in the quirk catalog"] });
    });
});
