import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import { getAllPowerArmorSamples, getPowerArmorSamples } from "./power-armor-samples";

/**
 * Power Armor plan, Chunk E (#172): the three suits Future Wars #14 printed on 'Mech record sheets (pp.43-45, read from
 * the page images) and the owner's IPA-4, as samples for the 'Mech Creator.
 */
const load = (id: string): BattleMech => {
    const sample = getAllPowerArmorSamples().find(entry => entry.id === id);
    expect(sample, id).toBeDefined();
    return new BattleMech(JSON.stringify(sample!.save));
};

type Slot = { tag: string; placeholder?: boolean } | null;
/** A location's six (or twelve) slots by tag, 1-indexed as the sheet numbers them; a multi-slot item repeats its tag. */
const sheet = (mech: BattleMech, location: string): Record<number, string> => {
    const names: Record<string, string> = { hd: "head", ct: "centerTorso", lt: "leftTorso", rt: "rightTorso", la: "leftArm", ra: "rightArm", ll: "leftLeg", rl: "rightLeg" };
    const slots = (mech.getCriticals() as unknown as Record<string, Slot[]>)[names[location]];
    const rows: Record<number, string> = {};
    let last = "";
    slots.forEach((slot, index) => {
        if (!slot) { last = ""; return; }
        if (!slot.placeholder) last = slot.tag;
        rows[index + 1] = last;
    });
    return rows;
};

const SHEETS: { id: string; tons: number; mp: [number, number, number]; weapons: string[]; slots: Record<string, Record<number, string>> }[] = [
    {
        id: "ipa-1", tons: 10, mp: [14, 21, 0], weapons: ["small-laser"],
        slots: { la: { 5: "heat-sink" }, ra: { 5: "small-laser" }, ll: { 5: "heat-sink", 6: "heat-sink" }, rl: { 5: "heat-sink", 6: "heat-sink" } },
    },
    {
        id: "ipa-2", tons: 10, mp: [7, 11, 3], weapons: ["medium-laser", "small-laser", "small-laser"],
        slots: {
            la: { 5: "small-laser", 6: "small-laser" }, ra: { 5: "medium-laser", 6: "heat-sink" },
            lt: { 1: "heat-sink", 2: "jj-standard", 3: "heat-sink" }, rt: { 1: "heat-sink", 2: "jj-standard", 3: "jj-standard" },
            ll: { 5: "heat-sink", 6: "heat-sink" }, rl: { 5: "heat-sink", 6: "heat-sink" },
        },
    },
    {
        id: "ipa-3", tons: 15, mp: [3, 5, 2], weapons: ["large-laser", "medium-laser", "small-laser", "small-laser"],
        slots: {
            la: { 5: "medium-laser", 6: "heat-sink" }, ra: { 5: "large-laser", 6: "large-laser" },
            lt: { 1: "small-laser", 2: "heat-sink", 3: "heat-sink", 4: "jj-standard" }, rt: { 1: "small-laser", 2: "heat-sink", 3: "heat-sink", 4: "jj-standard" },
            ll: { 5: "heat-sink", 6: "heat-sink" }, rl: { 5: "heat-sink", 6: "heat-sink" },
        },
    },
    {
        id: "ipa-4", tons: 5, mp: [6, 9, 0], weapons: ["small-laser", "small-laser"],
        slots: { la: { 5: "small-laser" }, ra: { 5: "small-laser", 6: "heat-sink" }, lt: { 1: "heat-sink", 2: "heat-sink" }, rt: { 1: "heat-sink", 2: "heat-sink" } },
    },
];

describe("Sample Power Armor (Future Wars #14 pp.43-45, and IPA-4)", () => {
    it("offers IPA-1 to IPA-4 at Custom Homebrew only", () => {
        expect(getPowerArmorSamples(CUSTOM_HOMEBREW_RULES_LEVEL).map(sample => sample.id)).toEqual(["ipa-1", "ipa-2", "ipa-3", "ipa-4"]);
        expect(getPowerArmorSamples(CUSTOM_HOMEBREW_RULES_LEVEL - 1)).toEqual([]);
    });

    for (const printed of SHEETS) {
        describe(printed.id.toUpperCase(), () => {
            it("is a suit under the Power Armor ruleset with no issue", () => {
                const mech = load(printed.id);
                expect(mech.usesPowerArmorConstruction()).toBe(true);
                expect(mech.getTonnage()).toBe(printed.tons);
                expect(mech.getChassisEquipmentViolations()).toEqual([]);
                expect(mech.getRemainingTonnage()).toBeGreaterThanOrEqual(0);
                expect(mech.getUnallocatedCritCount()).toBe(0);
            });

            it("moves, fires and cools as its sheet", () => {
                const mech = load(printed.id);
                expect([mech.getWalkSpeed(), mech.getRunSpeed(), mech.getJumpSpeed()]).toEqual(printed.mp);
                expect(mech.getInstalledEquipment().map(item => item.tag).sort()).toEqual([...printed.weapons].sort());
                expect(mech.getHeatSinks()).toBe(10);
            });

            it("puts each item in the slot the sheet shows, the pilot in head 3-4 and center torso 11-12", () => {
                const mech = load(printed.id);
                for (const [location, rows] of Object.entries(printed.slots)) {
                    const actual = sheet(mech, location);
                    for (const [slot, tag] of Object.entries(rows)) expect(actual[Number(slot)], `${location} ${slot}`).toBe(tag);
                }
                expect([sheet(mech, "hd")[3], sheet(mech, "hd")[4], sheet(mech, "ct")[11], sheet(mech, "ct")[12]]).toEqual(["cockpit", "cockpit", "cockpit", "cockpit"]);
            });
        });
    }

    it("spreads IPA-1 to IPA-3's armor from every ton left over, the head within twice its structure", () => {
        for (const id of ["ipa-1", "ipa-2", "ipa-3"]) {
            const mech = load(id);
            expect(mech.getRemainingTonnage(), id).toBeLessThan(0.5);
            expect(mech.getArmorAllocation().head, id).toBeLessThanOrEqual(mech.getMaxHeadArmor());
            expect(mech.getUnallocatedArmor(), id).toBe(0);
        }
        // Weighed by hand: IPA-3 is structure 1.5 + engine 45 at 1 + gyro 1 + waldo 0.5 + weapons 7 + jets 1 = 12 t, so 3 t of armor.
        expect([load("ipa-1"), load("ipa-2"), load("ipa-3")].map(mech => mech.getTotalArmor())).toEqual([16, 32, 48]);
    });

    it("prices IPA-1 by the edition's BV2, checked by hand: (73.5 x 1.6) + (9 + 10) x 3.15 = 177", () => {
        // Armor 16 x 2.5 = 40, structure 19 x 1.5 = 28.5, gyro 10 x 0.5 = 5; run 21 gives TMM 5, plus 0.1 for the suit.
        expect(load("ipa-1").getBattleValue()).toBe(177);
    });

    it("loads IPA-4 as the owner saved it: the Chunk D figures (BV 147, 184,065 C-bills, 9 PV)", () => {
        const mech = load("ipa-4");
        const fixture = JSON.parse(readFileSync(new URL("./__fixtures__/power-armor-ipa-4.json", import.meta.url), "utf8"));
        expect(mech.getArmorAllocation()).toEqual(fixture.armor_allocation);
        expect(mech.getBattleValue()).toBe(147);
        expect(mech.getCostBreakdown().result).toBe(184065);
        expect(mech.calcAlphaStrike().basePoints).toBe(9);
        expect(mech.getPilot().piloting).toBe(3);
    });

    it("credits Swisher and Future Wars #14 and says what is ours", () => {
        const notes = (id: string) => (load(id).export(true) as unknown as { tro?: { text?: { notes?: string } } }).tro?.text?.notes ?? "";
        for (const id of ["ipa-1", "ipa-2", "ipa-3", "ipa-4"]) expect(notes(id), id).toMatch(/Bill Swisher.*Future Wars #14.*NOT OFFICIAL|NOT OFFICIAL.*Bill Swisher.*Future Wars #14/);
        expect(notes("ipa-1")).toMatch(/name is ours/);
        expect(notes("ipa-3")).toMatch(/name is ours/);
        expect(notes("ipa-2")).toMatch(/third in the free right torso slot \(RT 3\)/);
        expect(notes("ipa-2")).toMatch(/armor is ours/);
        expect(notes("ipa-4")).toMatch(/IPA-4 is ours/);
    });
});
