import { describe, expect, it, vi } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { sswTestFixtures } from "../data/ssw/sswTestFixtures";
import { compactDesign, compactMech, compareDesigns, describeCriticals, expandDesign, getMechFingerprint, loadBundledMech, shareChunk, summarizeDesign, unshareDesign } from "./bundled-designs";

describe("the compact design format (#241)", () => {
    it("gives back the same 'Mech: BV, cost, tonnage, crit table and equipment", () => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        for (const [label, xml] of Object.entries(sswTestFixtures)) {
            const mech = new BattleMech();
            mech.importSSWXML(xml);
            const reload = loadBundledMech(compactMech(mech));
            expect(reload.getBattleValue(), label).toBe(mech.getBattleValue());
            expect(reload.getCBillCostNumeric(), label).toBe(mech.getCBillCostNumeric());
            expect(reload.getTonnage(), label).toBe(mech.getTonnage());
            expect(describeCriticals(reload), label).toBe(describeCriticals(mech));
            expect(reload.getInstalledEquipment().map((item) => item.tag), label).toEqual(mech.getInstalledEquipment().map((item) => item.tag));
            expect(reload.tro.export(), label).toEqual(mech.tro.export());
        }
        vi.restoreAllMocks();
    // Every SSW fixture imported and reloaded: about 2 s alone, past the 5 s default under a full parallel run.
    }, 30_000);

    it("keeps far less than a saved design", () => {
        const mech = new BattleMech();
        mech.importSSWXML(sswTestFixtures["Atlas AS7-D"]);
        expect(JSON.stringify(compactMech(mech)).length).toBeLessThan(mech.exportJSON().length / 3);
    });

    it("leaves out what a blank unit has and the derived fields, and gives fresh UUIDs back", () => {
        const blank = { name: "", tonnage: 20, list: [] as unknown[] };
        const design = { uuid: "0f8fad5b-d9cb-469f-a165-70867728950e", name: "Atlas", tonnage: 20, battle_value: 1897,
            list: [{ uuid: "7c9e6679-7425-40de-944b-e07fc1f90ae7", rear: false, loc: "ct" }, { uuid: "7c9e6679-7425-40de-944b-e07fc1f90ae7", note: "" }] };
        const compact = compactDesign(design, blank);
        expect(compact).toEqual({ name: "Atlas", list: { $k: ["uuid", "loc"], $v: [["#0", "ct"], ["#0", null]] } });
        const expanded = expandDesign(compact, blank) as { tonnage: number; list: { uuid: string }[] };
        expect(expanded.tonnage).toBe(20);
        expect(expanded.list[0].uuid).toMatch(/^[0-9a-f-]{36}$/);
        expect(expanded.list[0].uuid).not.toBe(design.list[0].uuid);
        expect(expanded.list[1].uuid).toBe(expanded.list[0].uuid);
    });

    it("shortens a UUID with a suffix, such as a crit slot's, to the same id and keeps the suffix", () => {
        const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
        const compact = compactDesign({ list: [{ uuid: id }, { uuid: id + ":7" }] }, {});
        expect(compact).toEqual({ list: { $k: ["uuid"], $v: [["#0"], ["#0:7"]] } });
        const expanded = expandDesign(compact, {}) as { list: { uuid: string }[] };
        expect(expanded.list[1].uuid).toBe(expanded.list[0].uuid + ":7");
    });

    it("keeps one copy of what a chunk's designs repeat, and gives each design back whole", () => {
        const text = "A paragraph two variants share, long enough to share.";
        const slot = { name: "Endo-Steel", tag: "endo-steel", rollAgain: true, movable: true };
        const designs = {
            0: { tro: text, allocation: [["ra", 3, "#0", 1, slot], ["la", 3, "#1", 1, slot]], note: "~ a note of its own that starts with a tilde" },
            1: { tro: text, allocation: [["ct", 2, "#0", 1, slot]], model: "~short" },
        };
        const chunk = shareChunk(designs);
        expect(chunk.shared).toEqual([text, slot]);
        expect(chunk.designs[1]).toEqual({ tro: "~0", allocation: [["ct", 2, "#0", 1, "~1"]], model: "~~short" });
        expect(unshareDesign(chunk.designs[0] as Record<string, unknown>, chunk.shared)).toEqual(designs[0]);
        expect(unshareDesign(chunk.designs[1] as Record<string, unknown>, chunk.shared)).toEqual(designs[1]);
    });

    it("stores a 'Mech's crit slots as short rows", () => {
        const mech = new BattleMech();
        mech.importSSWXML(sswTestFixtures["Atlas AS7-D"]);
        const allocation = compactMech(mech).allocation as unknown[];
        expect(allocation.every((slot) => Array.isArray(slot) && slot.length >= 4 && slot.length <= 5)).toBe(true);
    });
});

describe("telling a duplicate from a variant", () => {
    const laser = { name: "Medium Laser", tag: "medium-laser" };
    const endo = { name: "Endo-Steel", tag: "endo-steel" };
    const ferro = { name: "Ferro-Fibrous", tag: "ferro-fibrous" };
    const sink = { name: "Heat Sink", tag: "heat-sink" };
    const caseSlot = { name: "CASE", tag: "case" };
    const srmAmmo = { name: "SRM 6 Ammo", tag: "ammo-srm-6" };
    const infernoAmmo = { name: "SRM 6 Inferno Ammo", tag: "ammo-srm-6-inferno" };
    const hand = { name: "Hand Actuator", tag: "hand-actuator" };
    const mech = (criticals: Record<string, unknown[]>, armor: { ra: number; la: number } = { ra: 10, la: 10 }, armorTons = 1, heatSinks = 10) => ({
        getCriticals: () => criticals, getArmorAllocation: () => armor, getArmorWeight: () => armorTons,
        getInternalStructureType: () => "endo-steel", getArmorType: () => "ferro-fibrous",
        getHeatSinks: () => heatSinks, getHeatSinksObj: () => ({ name: "Heat Sink", tag: "heat-sink" }),
    }) as unknown as BattleMech;
    const atlas = getMechFingerprint(mech({ ra: [laser, null, endo], la: [ferro, null, null] }));
    const compare = (a: BattleMech, b: BattleMech) => compareDesigns(summarizeDesign(a), summarizeDesign(b));
    const kept = mech({ ra: [laser, srmAmmo, hand], la: [caseSlot, sink, null] });

    it("counts the same equipment in another slot of its location, or structure and armor slots anywhere, as the same design", () => {
        expect(getMechFingerprint(mech({ ra: [null, endo, laser], la: [null, null, ferro] }))).toBe(atlas);
        expect(getMechFingerprint(mech({ ra: [laser, null, null], la: [ferro, endo, null] }))).toBe(atlas);
    });

    it("counts equipment moved to another location, or changed, as a different design", () => {
        expect(getMechFingerprint(mech({ ra: [null, null, endo], la: [ferro, laser, null] }))).not.toBe(atlas);
        expect(getMechFingerprint(mech({ ra: [laser, laser, endo], la: [ferro, null, null] }))).not.toBe(atlas);
    });

    // The user's ruling on same name and model files that differ (#241, 2026-10-27).
    it("counts engine heat sinks shown in crit slots, when the count is the same, as the same design", () => {
        const shown = mech({ ra: [laser, srmAmmo, hand], la: [caseSlot, sink, sink] });
        expect(compare(kept, shown)).toEqual({ duplicate: true, why: "engine heat sinks in crit slots" });
        expect(getMechFingerprint(shown)).toBe(getMechFingerprint(kept));
        expect(compare(kept, mech({ ra: [laser, srmAmmo, hand], la: [caseSlot, sink, sink] }, undefined, undefined, 11)).duplicate).toBe(false);
    });

    it("counts armor spread differently as the same design only when its tonnage is the same", () => {
        const spread = mech({ ra: [laser, srmAmmo, hand], la: [caseSlot, sink, null] }, { ra: 12, la: 8 });
        expect(compare(kept, spread)).toEqual({ duplicate: true, why: "armor spread" });
        expect(getMechFingerprint(spread)).toBe(getMechFingerprint(kept));
        expect(compare(kept, mech({ ra: [laser, srmAmmo, hand], la: [caseSlot, sink, null] }, { ra: 12, la: 10 }, 1.5)))
            .toEqual({ duplicate: false, why: "armor tonnage" });
    });

    it("counts CASE, which takes no critical hit, in another location as the same design, but not added or dropped", () => {
        expect(compare(kept, mech({ ra: [laser, srmAmmo, hand, caseSlot], la: [sink, null, null] }))).toEqual({ duplicate: true, why: "CASE placed" });
        expect(compare(kept, mech({ ra: [laser, srmAmmo, hand], la: [sink, null, null] }))).toEqual({ duplicate: false, why: "CASE" });
    });

    it("counts another ammo type, actuators or equipment as a different submodel", () => {
        expect(compare(kept, mech({ ra: [laser, infernoAmmo, hand], la: [caseSlot, sink, null] }))).toEqual({ duplicate: false, why: "ammo type" });
        expect(compare(kept, mech({ ra: [laser, srmAmmo, null], la: [caseSlot, sink, null] }))).toEqual({ duplicate: false, why: "actuators" });
        expect(compare(kept, mech({ ra: [srmAmmo, hand, null], la: [caseSlot, sink, laser] }))).toEqual({ duplicate: false, why: "equipment" });
        expect(compare(kept, mech({ ra: [laser, srmAmmo, hand, sink], la: [caseSlot, null, null] }))).toEqual({ duplicate: false, why: "heat sinks placed" });
    });
});
