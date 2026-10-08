import { describe, expect, it } from "vitest";
import {
    battledroidsBasicDroids, getBattledroidsBasicArmorValue, getBattledroidsBasicDamageEffect, getBattledroidsBasicDamageNumber,
    getBattledroidsBasicRange, getBattledroidsBasicToHit,
} from "./battledroids-basic-game";
import {
    battledroidsFacingAfterFall, battledroidsRulesTables, getBattledroidsFallingDamage, getBattledroidsHeatEffects,
    getBattledroidsPhysicalDamage, getBattledroidsPilotingTarget,
} from "./battledroids-rules";

// Basic Battledroids (Battledroids, FASA 1984, pp.3-6).
describe("Basic Battledroids", () => {
    // Basic Game Statistics, BD p.6: [move, jump, armor, contact, short, medium, long], a dash entered as 0.
    it("carries the Basic Game Statistics of the ten droids", () => {
        expect(battledroidsBasicDroids.map(droid => [droid.name, droid.move, droid.jump, droid.armor, droid.damage.contact, droid.damage.short, droid.damage.medium, droid.damage.long])).toEqual([
            ["Stinger", 6, 6, 5, 3, 6, 5, 0],
            ["Wasp", 6, 6, 5, 3, 6, 5, 0],
            ["Shadow Hawk", 5, 3, 9, 7, 7, 9, 6],
            ["Phoenix Hawk", 6, 6, 8, 7, 11, 10, 6],
            ["Griffin", 5, 6, 8, 7, 7, 9, 9],
            ["Archer", 4, 0, 11, 8, 7, 15, 12],
            ["Crusader", 4, 0, 10, 8, 11, 16, 10],
            ["Warhammer", 4, 0, 9, 8, 16, 16, 11],
            ["Rifleman", 4, 0, 7, 7, 14, 14, 14],
            ["Marauder", 4, 0, 10, 9, 16, 16, 12],
        ]);
    });

    // Range Table, BD p.5.
    it("names the range by the Range Table", () => {
        expect([1, 2, 3, 4, 10, 11, 21, 22, 0].map(getBattledroidsBasicRange)).toEqual(["contact", "short", "short", "medium", "medium", "long", "long", undefined, undefined]);
    });

    // BD p.5: base 6 at medium range, the attacker walked (+1), the target moved 4 hexes (+1 by the table), the
    // target in light woods (+1) and one hex of light woods between (+1): 10. The book's example counts the 4 hexes
    // as +2 and reaches 11; the Movement Modifiers Table on the same page gives 3-4 hexes +1.
    it("works out the To-Hit Number", () => {
        const shot = { range: "medium" as const, attackerMove: "walked" as const, targetHexesMoved: 4, targetJumped: false, lightWoodsBetween: 1, targetInLightWoods: true, targetInHeavyWoods: false };
        expect(getBattledroidsBasicToHit(shot)).toBe(10);
        expect(getBattledroidsBasicToHit({ ...shot, range: "contact", attackerMove: "stationary", targetHexesMoved: 0, lightWoodsBetween: 0, targetInLightWoods: false })).toBe(4);
        expect(getBattledroidsBasicToHit({ ...shot, attackerMove: "jumped", targetHexesMoved: 9, targetJumped: true, lightWoodsBetween: 0, targetInLightWoods: false, targetInHeavyWoods: true })).toBe(6 + 3 + 3 + 1 + 2);
    });

    // BD p.6: a Damage Value of 15 against an Armor Value of 12 (13 less 1 through a rear side hexside) needs a 5.
    it("reads the Armor Penetration Table", () => {
        expect(getBattledroidsBasicArmorValue(13, "rear-side")).toBe(12);
        expect(getBattledroidsBasicArmorValue(13, "rear")).toBe(11);
        expect(getBattledroidsBasicDamageNumber(15, 12)).toEqual({ number: 5, belowTable: false });
        expect(getBattledroidsBasicDamageNumber(3, 5)?.number).toBe(8);
        expect(getBattledroidsBasicDamageNumber(3, 13)?.number).toBe(11);
        expect(getBattledroidsBasicDamageNumber(16, 5)?.number).toBe(3);
        expect(getBattledroidsBasicDamageNumber(16, 13)?.number).toBe(5);
        expect(getBattledroidsBasicDamageNumber(10, 9)?.number).toBe(6);
        // Off the table: no row for a Damage Value of 2 or 17, no column above 13; below 5 the lowest column is used and flagged.
        expect([getBattledroidsBasicDamageNumber(2, 8), getBattledroidsBasicDamageNumber(17, 8), getBattledroidsBasicDamageNumber(8, 14)]).toEqual([undefined, undefined, undefined]);
        expect(getBattledroidsBasicDamageNumber(6, 3)).toEqual({ number: 6, belowTable: true });
    });

    // Damage Effects Table, BD p.6.
    it("reads the Damage Effects Table", () => {
        expect([2, 3, 4, 10, 11, 12].map(getBattledroidsBasicDamageEffect).every(effect => effect === "Battledroid destroyed.")).toBe(true);
        expect(getBattledroidsBasicDamageEffect(5)).toContain("Weapons destroyed");
        expect([6, 7, 8].map(getBattledroidsBasicDamageEffect)).toEqual([
            "Battledroid cannot move or fire for 2 turns.", "Battledroid cannot move or fire for 1 turn.", "Battledroid cannot move or fire for 2 turns.",
        ]);
        expect(getBattledroidsBasicDamageEffect(9)).toContain("MP reduced to half");
    });
});

describe("Advanced and Expert Battledroids helpers", () => {
    // BD p.12: a 70-ton Warhammer punches for 7 and kicks for 14. BD p.20: its charge does 7 a hex moved.
    it("gives the damage of physical attacks by tonnage", () => {
        expect(getBattledroidsPhysicalDamage(70)).toEqual({ punch: 7, kick: 14, chargePerHex: 7, club: 14 });
        expect(getBattledroidsPhysicalDamage(55)).toEqual({ punch: 6, kick: 11, chargePerHex: 6, club: 11 });
    });

    // BD p.15: a 70-ton droid falling in its own hex takes 7; pushed down 2 levels, 21. Halved in water, rounding up.
    it("gives falling damage", () => {
        expect([getBattledroidsFallingDamage(70, 0), getBattledroidsFallingDamage(70, 2), getBattledroidsFallingDamage(70, -1), getBattledroidsFallingDamage(70, 0, true)]).toEqual([7, 21, 7, 4]);
        expect(battledroidsFacingAfterFall.map(row => row.column)).toEqual(["Front/Back", "Right Side", "Right Side", "Front/Back", "Left Side", "Left Side"]);
    });

    // Falling Or Standing Table, BD p.15.
    it("adds the Falling Or Standing modifiers to the Piloting Skill", () => {
        expect(getBattledroidsPilotingTarget(5, {})).toBe(5);
        expect(getBattledroidsPilotingTarget(5, { charged: 1, damage: 1, shutdown: 1, gyro: 1 })).toBe(5 + 2 + 1 + 3 + 3);
        // Two hips at most; water makes the roll easier.
        expect(getBattledroidsPilotingTarget(5, { hip: 5, "leg-actuator": 2, water: 1, levels: 2 })).toBe(5 + 4 + 2 - 1 + 2);
    });

    // Heat Scale on the record sheet, BD p.28.
    it("reads the Heat Scale", () => {
        const at = (heat: number) => { const effects = getBattledroidsHeatEffects(heat); return [effects.move, effects.fire, effects.shutdownAvoid, effects.ammoExplosionAvoid]; };
        expect(at(4)).toEqual([0, 0, 0, 0]);
        expect(at(5)).toEqual([1, 0, 0, 0]);
        expect(at(8)).toEqual([1, 1, 0, 0]);
        expect(at(14)).toEqual([2, 2, 4, 0]);
        expect(at(19)).toEqual([3, 3, 6, 4]);
        expect(at(23)).toEqual([4, 3, 8, 6]);
        expect(at(26)).toEqual([5, 4, 10, 6]);
        expect(at(28)).toEqual([5, 4, 10, 8]);
        expect(at(30)).toEqual([5, 4, 13, 8]);
    });

    it("cites a page for every reference table", () => {
        expect(battledroidsRulesTables.length).toBeGreaterThan(10);
        for (const table of battledroidsRulesTables) {
            expect(table.page, table.title).toMatch(/^BD pp?\.\d/);
            expect(table.rows.length, table.title).toBeGreaterThan(0);
        }
    });
});
