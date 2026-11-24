import { describe, expect, it } from "vitest";
import { QuirkList } from "./quirk-list";

describe("QuirkList", () => {
    it("adds a known quirk", () => {
        const list = new QuirkList();
        expect(list.add({ tag: "quirk-command-mech" })).toBeNull();
        expect(list.getAll()).toEqual([{ tag: "quirk-command-mech" }]);
    });

    it("refuses an unknown quirk", () => {
        expect(new QuirkList().add({ tag: "quirk-no-such-thing" })).toBe("unknown quirk");
    });

    it("refuses the same unit quirk twice", () => {
        const list = new QuirkList();
        list.add({ tag: "quirk-command-mech" });
        expect(list.add({ tag: "quirk-command-mech" })).toBe("duplicate");
        expect(list.getAll()).toHaveLength(1);
    });

    it("refuses Battle Computer with Command 'Mech (CO p.225)", () => {
        const list = new QuirkList();
        list.add({ tag: "quirk-command-mech" });
        expect(list.add({ tag: "quirk-battle-computer" })).toBe("excluded by Command 'Mech");
    });

    it("accepts the same weapon quirk on two weapons", () => {
        const list = new QuirkList();
        expect(list.add({ tag: "quirk-accurate-weapon", equipmentUuid: "w1" })).toBeNull();
        expect(list.add({ tag: "quirk-accurate-weapon", equipmentUuid: "w2" })).toBeNull();
        expect(list.add({ tag: "quirk-accurate-weapon", equipmentUuid: "w1" })).toBe("duplicate");
    });

    it("accepts Improved Targeting once for each range bracket", () => {
        const list = new QuirkList();
        expect(list.add({ tag: "quirk-improved-targeting", parameter: "short" })).toBeNull();
        expect(list.add({ tag: "quirk-improved-targeting", parameter: "long" })).toBeNull();
        expect(list.add({ tag: "quirk-improved-targeting", parameter: "long" })).toBe("duplicate");
    });

    it("refuses a value quirk twice on one target whatever its value", () => {
        const list = new QuirkList();
        expect(list.add({ tag: "quirk-rugged", parameter: 1 })).toBeNull();
        expect(list.add({ tag: "quirk-rugged", parameter: 2 })).toBe("duplicate");
        expect(list.add({ tag: "quirk-directional-torso-mount", location: "ct", parameter: 2 })).toBeNull();
        expect(list.add({ tag: "quirk-directional-torso-mount", location: "ct", parameter: 3 })).toBe("duplicate");
    });

    it("removes by index", () => {
        const list = new QuirkList();
        list.add({ tag: "quirk-command-mech" });
        list.add({ tag: "quirk-rugged", parameter: 1 });
        list.remove(0);
        expect(list.getAll().map((quirk) => quirk.tag)).toEqual(["quirk-rugged"]);
    });

    it("returns copies from getAll", () => {
        const list = new QuirkList();
        list.add({ tag: "quirk-command-mech" });
        list.getAll()[0].tag = "changed";
        expect(list.getAll()[0].tag).toBe("quirk-command-mech");
    });

    it("leaves out a weapon quirk on an uninstalled weapon but keeps it", () => {
        const list = new QuirkList();
        list.add({ tag: "quirk-accurate-weapon", equipmentUuid: "gone" });
        list.add({ tag: "quirk-accurate-weapon", equipmentUuid: "here" });
        expect(list.getActive(["here"], undefined).map((quirk) => quirk.equipmentUuid)).toEqual(["here"]);
        expect(list.getAll()).toHaveLength(2);
    });

    it("keeps assignments whose year range includes the year, at both ends", () => {
        const list = new QuirkList();
        list.add({ tag: "quirk-command-mech", fromYear: 3025, toYear: 3050 });
        expect(list.getActive([], 3025)).toHaveLength(1);
        expect(list.getActive([], 3050)).toHaveLength(1);
        expect(list.getActive([], 3024)).toHaveLength(0);
        expect(list.getActive([], 3051)).toHaveLength(0);
    });

    it("keeps every assignment when no year is given", () => {
        const list = new QuirkList();
        list.add({ tag: "quirk-command-mech", fromYear: 3025, toYear: 3050 });
        expect(list.getActive([], undefined)).toHaveLength(1);
    });

    it("imports nothing from an old save and exports undefined", () => {
        const list = new QuirkList();
        list.import(undefined);
        expect(list.getAll()).toEqual([]);
        expect(list.export()).toBeUndefined();
    });

    it("drops imported entries without a string tag", () => {
        const list = new QuirkList();
        list.import([{ tag: "quirk-command-mech" }, null, { tag: 3 }, "quirk-rugged"]);
        expect(list.export()).toEqual([{ tag: "quirk-command-mech" }]);
    });

    it("keeps imported quirks it does not know, for a custom quirk not loaded yet", () => {
        const list = new QuirkList();
        list.import([{ tag: "quirk-custom-someone-elses" }]);
        expect(list.getAll()).toHaveLength(1);
    });

    it("totals positive and negative points", () => {
        const list = new QuirkList();
        list.add({ tag: "quirk-command-mech" });
        list.add({ tag: "quirk-accurate-weapon", equipmentUuid: "w1" });
        list.add({ tag: "quirk-no-ejection-system" });
        const weaponDamage = (uuid: string) => (uuid === "w1" ? 10 : 0);
        const totals = list.getPointTotals(["w1"], 0, weaponDamage);
        expect(totals.positive).toBe(4);
        expect(totals.negative).toBeLessThan(0);
    });

    it("leaves quirks on weapons not installed out of the totals", () => {
        const list = new QuirkList();
        list.add({ tag: "quirk-accurate-weapon", equipmentUuid: "gone" });
        list.add({ tag: "quirk-jettison-capable-weapon", equipmentUuid: "gone" });
        expect(list.getPointTotals([], 0, () => 0)).toEqual({ positive: 0, negative: 0 });
    });
    it("puts a bay quirk on the bay, costed once from the bay's damage (CO p.225)", () => {
        const list = new QuirkList();
        expect(list.add({ tag: "quirk-accurate-weapon", bayUuids: ["a", "b"] })).toBeNull();
        expect(list.add({ tag: "quirk-accurate-weapon", bayUuids: ["b", "a"] })).toBe("duplicate");
        expect(list.getActive(["b"], undefined)).toHaveLength(1);
        expect(list.getActive([], undefined)).toHaveLength(0);
        // 13 damage in one grouping: 1 point per 5 or fraction, 3 points
        expect(list.getPointTotals(["a", "b"], 0, () => 0, () => 13).positive).toBe(3);
    });
    // A bay that gains a weapon must not take the quirk again, nor its weapons one by one (final review).
    it("refuses the same quirk on a bay that shares a weapon with one that has it", () => {
        const list = new QuirkList();
        expect(list.add({ tag: "quirk-accurate-weapon", bayUuids: ["a", "b"] })).toBeNull();
        expect(list.add({ tag: "quirk-accurate-weapon", bayUuids: ["a", "b", "c"] })).toBe("duplicate");
        expect(list.add({ tag: "quirk-accurate-weapon", equipmentUuid: "b" })).toBe("duplicate");
        expect(list.add({ tag: "quirk-accurate-weapon", bayUuids: ["c", "d"] })).toBeNull();
        expect(list.add({ tag: "quirk-jettison-capable-weapon", equipmentUuid: "e" })).toBeNull();
        expect(list.add({ tag: "quirk-jettison-capable-weapon", bayUuids: ["e", "f"] })).toBe("duplicate");
    });
});
