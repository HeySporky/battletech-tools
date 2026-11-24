import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { BattleMech } from "./battlemech";
import { importBattleMechMtf } from "./battlemech-mtf";
import { getTargetToHitFromWeapon } from "../utils";

// Cockpit Command Console (TO:AUE pp.112-113, #171): an Advanced add-on of 3 tons and 1 slot beside the cockpit,
// 500,000 C-bills. Not with a Torso-Mounted, QuadVee or tripod cockpit (p.112; IO:AE p.159). The console takes
// head slot 3, as MegaMek's addCommandConsole; on a Small Cockpit the second Sensors move down to slot 4.
const tags = (slots: ({ tag: string } | null | undefined)[]) => slots.map((slot) => slot?.tag ?? "");

function mech(tons: number = 70): BattleMech {
    const unit = new BattleMech();
    unit.setTech("is");
    unit.setEra("dark-ages");
    unit.setTonnage(tons);
    unit.setWalkSpeed(4);
    return unit;
}

describe("a Cockpit Command Console", () => {
    it("adds 3 tons, 500,000 C-bills and a head slot beside the cockpit, at Advanced rules", () => {
        const unit = mech();
        expect(unit.canMountCommandConsole()).toBe(true);
        const tons = unit.getCurrentTonnage();
        const cost = unit.getCBillCostNumeric();
        expect(unit.setCommandConsole(true)).toBe(true);
        expect(unit.getCurrentTonnage()).toBe(tons + 3);
        // 500,000 C-bills (TO:AUE p.219), times the 1 + 70/100 tonnage multiplier.
        expect(unit.getCBillCostNumeric() - cost).toBe(850000);
        expect(tags(unit.getCriticals().head)).toEqual(["life-support", "sensors", "cockpit", "command-console", "sensors", "life-support"]);
        expect(unit.getRequiredRulesLevel()).toBe(3);
    });

    it("moves a Small Cockpit's second Sensors down a slot", () => {
        const unit = mech();
        unit.setCockpitType("small");
        unit.setCommandConsole(true);
        expect(tags(unit.getCriticals().head)).toEqual(["life-support", "sensors", "cockpit", "command-console", "sensors", ""]);
    });

    it("is not offered with a Torso-Mounted Cockpit, on a QuadVee or on a tripod", () => {
        const torso = mech();
        torso.setCockpitType("torso-mounted");
        expect(torso.canMountCommandConsole()).toBe(false);
        expect(torso.setCommandConsole(true)).toBe(false);
        const console = mech();
        console.setCommandConsole(true);
        console.setCockpitType("torso-mounted");
        expect(console.hasCommandConsole()).toBe(false);
        const tripod = mech();
        tripod.setMechType("tripod");
        expect(tripod.canMountCommandConsole()).toBe(false);
    });

    it("survives a save and load", () => {
        const unit = mech();
        unit.setCommandConsole(true);
        const loaded = new BattleMech(unit.exportJSON());
        expect(loaded.hasCommandConsole()).toBe(true);
        expect(loaded.getCurrentTonnage()).toBe(unit.getCurrentTonnage());
    });

    it("imports from SSW at the file's BV2: Hatamoto-Godai HTM-30Z is 1,899", () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const unit = new BattleMech();
        unit.importSSWXML(readFileSync("src/utils/__fixtures__/hatamoto-godai-htm-30z.ssw", "utf8"));
        expect(unit.sswImportErrors).toEqual([]);
        expect(unit.hasCommandConsole()).toBe(true);
        expect(unit.getUnallocatedCriticals()).toEqual([]);
        expect(unit.getBattleValue()).toBe(1899);
    });

    it("imports from MegaMek at the MUL BV: Atlas AS7-D-DC is 1,858", () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const { mech: unit, issues } = importBattleMechMtf(readFileSync("src/utils/__fixtures__/atlas-as7-d-dc.mtf", "utf8"));
        expect(issues).toEqual([]);
        expect(unit?.sswImportErrors).toEqual([]);
        expect(unit?.hasCommandConsole()).toBe(true);
        expect(unit?.getBattleValue()).toBe(1858);
    });

    it("gives a MegaMek IndustrialMech with a console Advanced Fire Control, as MegaMek does: Kiso K-3N-KR4 is 954 (RS:3075)", () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const { mech: unit, issues } = importBattleMechMtf(readFileSync("src/utils/__fixtures__/kiso-k-3n-kr4.mtf", "utf8"));
        expect(issues).toEqual([]);
        expect(unit?.hasCommandConsole()).toBe(true);
        expect(unit?.hasAdvancedFireControl()).toBe(true);
        expect(unit?.getBattleValue()).toBe(954);
    });
});

// Enhanced Imaging (2b-3, plan ruling R1): a Clan cockpit system with no weight or slots. Under BMR(R) it is Max Tech's
// Level 3 EI cockpit (pp.60-61): one cockpit system only, so not with a small, torso-mounted or command console
// cockpit (p.60), priced 400,000 for the display cockpit against the standard 200,000 (p.87). Under Total Warfare it is
// IO:AE's Experimental EI interface (p.69), on any Clan cockpit.
describe("an Enhanced Imaging cockpit", () => {
    function clanMech(edition: string, tech: string = "clan"): BattleMech {
        const unit = new BattleMech();
        unit.setRulesEdition(edition);
        unit.setTech(tech);
        unit.setEra("jihad");
        unit.setTonnage(50);
        unit.setWalkSpeed(4);
        return unit;
    }

    it("offers the EI cockpit to Clan 'Mechs under BMR(R) Level 3 and TW, not with small/torso/console under BMR(R)", () => {
        expect(clanMech("master-rules-revised").getEnhancedImagingOption(3).available).toBe(true);
        expect(clanMech("master-rules-revised").getEnhancedImagingOption(2).available).toBe(false);
        expect(clanMech("master-rules").getEnhancedImagingOption(5).available).toBe(false);
        expect(clanMech("total-warfare").getEnhancedImagingOption(4).available).toBe(true);
        expect(clanMech("total-warfare").getEnhancedImagingOption(3).available).toBe(false);
        expect(clanMech("total-warfare", "is").canMountEnhancedImaging()).toBe(false);
        for (const cockpit of ["small", "torso-mounted"]) {
            const unit = clanMech("master-rules-revised");
            unit.setCockpitType(cockpit);
            expect(unit.canMountEnhancedImaging(), cockpit).toBe(false);
            const tw = clanMech("total-warfare");
            tw.setCockpitType(cockpit);
            expect(tw.canMountEnhancedImaging(), cockpit).toBe(true);
        }
        const console = clanMech("master-rules-revised");
        console.setCommandConsole(true);
        expect(console.canMountEnhancedImaging()).toBe(false);
        const unit = clanMech("master-rules-revised");
        expect(unit.setEnhancedImaging(true)).toBe(true);
        expect(unit.getRequiredRulesLevel()).toBe(3);
    });

    it("prices the EI display at 400,000 under BMR(R) and adds no weight or slots", () => {
        const unit = clanMech("master-rules-revised");
        const [tons, cost, slots] = [unit.getCurrentTonnage(), unit.getCBillCostNumeric(), tags(unit.getCriticals().head)];
        unit.setEnhancedImaging(true);
        expect(unit.getCurrentTonnage()).toBe(tons);
        expect(tags(unit.getCriticals().head)).toEqual(slots);
        // 400,000 - 200,000 (Max Tech p.87), times the 1 + 50/100 tonnage multiplier.
        expect(unit.getCBillCostNumeric() - cost).toBe(300000);
    });

    it("survives a save and load", () => {
        const unit = clanMech("master-rules-revised");
        unit.setEnhancedImaging(true);
        expect(new BattleMech(unit.exportJSON()).hasEnhancedImaging()).toBe(true);
    });

    it("reads EI Interface from a MegaMek nocrit line", () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const file = readFileSync("src/utils/__fixtures__/daishi-dire-wolf-a.mtf", "utf8") + "\nnocrit:EIInterface:None\n";
        const { mech: unit, issues } = importBattleMechMtf(file);
        expect(issues).toEqual([]);
        expect(unit?.sswImportErrors).toEqual([]);
        expect(unit?.hasEnhancedImaging()).toBe(true);
    });

    it("plays: Piloting -1 and a feedback roll on structure damage while on; off or a sensors hit ends both", () => {
        const feedback = (unit: BattleMech) => unit.takeDamage(1, "ct", false).flatMap(result => result.criticalEffects);
        // Max Tech reads the interface alone (p.61); TW needs a pilot with EI implants (IO:AE p.69).
        const maxTech = clanMech("master-rules-revised");
        maxTech.setEnhancedImaging(true);
        expect(maxTech.getPilotingSkillModifier()).toBe(-1);
        expect(feedback(maxTech)).toEqual(["Enhanced Imaging feedback: roll 2D6, 7 or better or the pilot takes 1 damage (Maximum Tech p.61)"]);
        maxTech.enhancedImagingOff = true;
        expect(new BattleMech(maxTech.exportJSON()).enhancedImagingOff).toBe(true);
        expect(maxTech.getPilotingSkillModifier()).toBe(0);
        expect(feedback(maxTech)).toEqual([]);
        const tw = clanMech("total-warfare");
        tw.setEnhancedImaging(true);
        expect(tw.isEnhancedImagingActive()).toBe(false);
        tw.setPilotEIImplants(true);
        expect(tw.getPilotingSkillModifier()).toBe(-1);
        expect(feedback(tw)[0]).toContain("consciousness roll (IO:AE p.69)");
        tw.toggleCritical("hd", 1);
        expect(tw.isEnhancedImagingActive()).toBe(false);
        expect(feedback(tw)).toEqual([]);
    });

    it("to-hit: woods and smoke 1 less a hex (at least +1), darkness ignored; Max Tech light woods +1 in all", () => {
        const toHit = (unit: BattleMech, light: number, heavy: number, darkness = 0) => {
            const weapon = unit.addEquipmentFromTag("er-small-laser-clan", "clan", "rt", false, undefined, "a", false, [], undefined, undefined)!;
            const index = unit.equipmentList.findIndex(item => item.uuid === weapon.uuid);
            const target = { name: "T", active: true, range: 1, movement: 0, otherMods: 0, jumped: false, primary: true, inRearArc: false };
            return getTargetToHitFromWeapon(unit, index, { ...target, lightWoodsHexes: light, heavyWoodsHexes: heavy, darkness });
        };
        // Light +1 and heavy +2 a hex (TW p.117), darkness as entered.
        const tw = clanMech("total-warfare");
        const base = toHit(tw, 0, 0).finalToHit;
        expect(toHit(tw, 2, 1, 2).finalToHit).toBe(base + 6);
        expect(toHit(tw, 2, 1).otherModifiersExplanation).toContain("Woods / Smoke (+4)");
        tw.setEnhancedImaging(true);
        tw.setPilotEIImplants(true);
        expect(toHit(tw, 2, 1, 2).finalToHit).toBe(base + 3);
        const maxTech = clanMech("master-rules-revised");
        maxTech.setEnhancedImaging(true);
        expect(toHit(maxTech, 3, 2, 2).finalToHit).toBe(toHit(maxTech, 0, 0).finalToHit + 3);
    });

    it("to-hit: a targeting computer -1, immobile -4 and aimed shots by targeting computer, EI or both", () => {
        const toHit = (unit: BattleMech, aim: { aimedLocation?: string; immobile?: boolean } = {}, tag = "er-small-laser-clan") => {
            const weapon = unit.addEquipmentFromTag(tag, unit.getTech().tag, "rt", false, undefined, "a", false, [], undefined, undefined)!;
            const index = unit.equipmentList.findIndex(item => item.uuid === weapon.uuid);
            const target = { name: "T", active: true, range: 1, movement: 0, otherMods: 0, jumped: false, primary: true, inRearArc: false };
            return getTargetToHitFromWeapon(unit, index, { ...target, ...aim });
        };
        // No computer: aimed shots only at an immobile target, -4, the head +3 instead (TW p.110); missiles cannot aim.
        const is = clanMech("total-warfare", "is");
        const base = toHit(is, {}, "medium-laser").finalToHit;
        expect(toHit(is, { aimedLocation: "la" }, "medium-laser").finalToHit).toBe(base);
        expect(toHit(is, { aimedLocation: "la" }, "medium-laser").otherModifiersExplanation).toContain("Aimed Shot Not Allowed");
        expect(toHit(is, { immobile: true }, "medium-laser").finalToHit).toBe(base - 4);
        expect(toHit(is, { immobile: true, aimedLocation: "la" }, "medium-laser").finalToHit).toBe(base - 4);
        expect(toHit(is, { immobile: true, aimedLocation: "hd" }, "medium-laser").finalToHit).toBe(base + 3);
        expect(toHit(is, { immobile: true, aimedLocation: "la" }, "lrm-5").otherModifiersExplanation).toContain("Aimed Shot Not Allowed");
        // Targeting computer: -1, or +3 in its place aimed at an active target, never the head, no pulse (TW p.143).
        is.addEquipmentFromTag("targeting-computer", "is", "lt", false, undefined, undefined, false, [], undefined, undefined);
        expect(toHit(is, {}, "medium-laser").finalToHit).toBe(base - 1);
        expect(toHit(is, {}, "medium-laser").otherModifiersExplanation).toContain("Targeting Computer (-1)");
        expect(toHit(is, {}, "lrm-5").finalToHit).toBe(toHit(clanMech("total-warfare", "is"), {}, "lrm-5").finalToHit);
        expect(toHit(is, { aimedLocation: "la" }, "medium-laser").finalToHit).toBe(base + 3);
        expect(toHit(is, { aimedLocation: "hd" }, "medium-laser").finalToHit).toBe(base - 1);
        expect(toHit(is, { aimedLocation: "la" }, "medium-pulse-laser").finalToHit).toBe(toHit(is, {}, "medium-pulse-laser").finalToHit);
        expect(toHit(is, { immobile: true, aimedLocation: "la" }, "medium-laser").finalToHit).toBe(base - 5);
        // EI alone aims as a computer does: TW +2 more, Max Tech +6; with a computer TW -1 in place of the +2, Max Tech +2
        // (IO:AE p.69; Maximum Tech p.61).
        const tw = clanMech("total-warfare");
        tw.setEnhancedImaging(true);
        tw.setPilotEIImplants(true);
        const twBase = toHit(tw).finalToHit;
        expect(toHit(tw, { aimedLocation: "ra" }).finalToHit).toBe(twBase + 5);
        const maxTech = clanMech("master-rules-revised");
        maxTech.setEnhancedImaging(true);
        const maxTechBase = toHit(maxTech).finalToHit;
        expect(toHit(maxTech, { aimedLocation: "ra" }).finalToHit).toBe(maxTechBase + 6);
        for (const unit of [tw, maxTech]) {
            unit.addEquipmentFromTag("clan-targeting-computer", "clan", "lt", false, undefined, undefined, false, [], undefined, undefined);
        }
        expect(toHit(tw, { aimedLocation: "ra" }).finalToHit).toBe(twBase + 2);
        expect(toHit(maxTech, { aimedLocation: "ra" }).finalToHit).toBe(maxTechBase + 2);
    });
});
