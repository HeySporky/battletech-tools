import { describe, expect, it } from "vitest";
import {
    getLongRangeWarsBand, getLongRangeWarsFirerModifier, getLongRangeWarsTargetModifier, getMalfunctionEffect, getMalfunctionTable,
    getMechMoraleModifier, getMechMoraleResult, getOpportunityFireToHit, getStrategicMovementHeat, getStrategicMovementMP,
    isMoralePass, MALFUNCTION_DICE,
} from "./future-wars-ruleset-tools";

/** Best of Future Wars plan, Chunk E (#172): the numbers behind the play-rule tools (BoFW pp.17-29, 55-56). */
describe("Best of Future Wars ruleset tools", () => {
    it("Strategic Movement doubles MP; heat is 2 plus 1 a walking MP or 2 a running MP beyond normal (pp.18-19)", () => {
        expect(getStrategicMovementMP(3, 5)).toEqual({ walk: 6, run: 10 });
        expect(getStrategicMovementHeat("r", 10, 3, 5)).toBe(12); // the article's Atlas
        expect(getStrategicMovementHeat("r", 5, 3, 5)).toBe(2);
        expect(getStrategicMovementHeat("w", 6, 3, 5)).toBe(5);
        expect(getStrategicMovementHeat("w", 2, 3, 5)).toBe(2);
    });

    it("Opportunity Fire to-hit is 6 / 8 / 10 at Gunnery 4, +0/+1/+2 by the target's move, +2 if the firer moved (p.17)", () => {
        expect(getOpportunityFireToHit({ gunnery: 4, band: "short", targetMove: "walked", firerMoved: false, other: 0 })).toBe(6);
        expect(getOpportunityFireToHit({ gunnery: 4, band: "medium", targetMove: "ran", firerMoved: false, other: 0 })).toBe(9);
        expect(getOpportunityFireToHit({ gunnery: 4, band: "long", targetMove: "jumped", firerMoved: true, other: 1 })).toBe(15);
        expect(getOpportunityFireToHit({ gunnery: 3, band: "short", targetMove: "walked", firerMoved: false, other: 0 })).toBe(5);
    });

    it("a morale check passes on the class number or more (p.24)", () => {
        expect(isMoralePass(0, 7)).toBe(true);  // Militia 7
        expect(isMoralePass(0, 6)).toBe(false);
        expect(isMoralePass(2, 6)).toBe(true);  // Regular 6
        expect(isMoralePass(5, 4)).toBe(false); // Crack 5
    });

    it("the 'Mech morale modifier adds class, status, earlier results and the rest (p.24)", () => {
        expect(getMechMoraleModifier(0, undefined, 0, 0)).toBe(-2);
        expect(getMechMoraleModifier(5, "broken", -1, 2)).toBe(3 - 2 - 1 + 2);
        expect(getMechMoraleModifier(2, "routed", 0, 0)).toBe(-3);
        expect(getMechMoraleModifier(2, "disorganized", 0, 0)).toBe(-1);
    });

    it("reads the 'Mech morale results, clamping off the table (p.24)", () => {
        expect(getMechMoraleResult(-9)).toMatchObject({ label: "-5", status: "routed", turns: 3, friendsCheck: true, fire: "none" });
        expect(getMechMoraleResult(0)).toMatchObject({ status: "broken", turns: 2, fire: "none" });
        expect(getMechMoraleResult(4)).toMatchObject({ status: "disorganized", turns: 2, fire: 5 });
        expect(getMechMoraleResult(7)).toMatchObject({ status: "disorganized", turns: 1, fire: 1 });
        expect(getMechMoraleResult(8)).toMatchObject({ scaleDrop: 2 });
        expect(getMechMoraleResult(8).status).toBeUndefined();
        expect(getMechMoraleResult(10)).toMatchObject({ laterRollModifier: -2 });
        expect(getMechMoraleResult(13)).toMatchObject({ laterRollModifier: 2 });
        expect(getMechMoraleResult(20)).toMatchObject({ label: "14+", text: "No effect" });
        expect(getMechMoraleResult(3).text).toMatch(/Broken 1 turn/);
    });

    it("picks a weapon's malfunction table; PPCs and Gauss rifles have none (p.29)", () => {
        const weapon = (name: string, category: string, tag = "") => ({ name, category, tag });
        expect(getMalfunctionTable(weapon("Flamer", "Energy Weapons"))).toBe("flamer");
        expect(getMalfunctionTable(weapon("Long Range Flamer", "Custom Equipment"))).toBe("flamer");
        expect(getMalfunctionTable(weapon("Medium Pulse Laser", "Energy Weapons"))).toBe("laser");
        expect(getMalfunctionTable(weapon("LRM 10", "Missile Weapons"))).toBe("missile");
        expect(getMalfunctionTable(weapon("Streak SRM 2", "Missile Weapons"))).toBe("missile");
        expect(getMalfunctionTable(weapon("Anti-Missile System", "Ballistic Weapons", "ams"))).toBeUndefined();
        expect(getMalfunctionTable(weapon("Autocannon/5", "Ballistic Weapons"))).toBe("ac");
        expect(getMalfunctionTable(weapon("Ultra AC/10", "Ballistic Weapons"))).toBe("ac");
        expect(getMalfunctionTable(weapon("LB 10-X AC", "Ballistic Weapons"))).toBe("ac");
        expect(getMalfunctionTable(weapon("Machine Gun", "Ballistic Weapons"))).toBe("ac");
        expect(getMalfunctionTable(weapon("PPC", "Energy Weapons"))).toBeUndefined();
        expect(getMalfunctionTable(weapon("Gauss Rifle", "Ballistic Weapons"))).toBeUndefined();
        expect(MALFUNCTION_DICE.laser).toEqual({ label: "3D6", min: 3, max: 18 });
        expect(MALFUNCTION_DICE.flamer).toEqual({ label: "1D6", min: 1, max: 6 });
    });

    it("turns a malfunction roll into to-hit, heat and out-of-action effects (p.29)", () => {
        expect(getMalfunctionEffect("laser", 15)).toMatchObject({ toHit: 3, heat: 5, out: false });
        expect(getMalfunctionEffect("laser", 17)).toMatchObject({ out: true });
        expect(getMalfunctionEffect("laser", 3)).toMatchObject({ toHit: 0, heat: 0, out: false, noEffect: true });
        expect(getMalfunctionEffect("missile", 4)).toMatchObject({ out: true, clearable: true });
        expect(getMalfunctionEffect("missile", 9)).toMatchObject({ toHit: 2 });
        expect(getMalfunctionEffect("ac", 11)).toMatchObject({ out: true, clearable: false });
        expect(getMalfunctionEffect("ac", 5)).toMatchObject({ heat: 1 });
        expect(getMalfunctionEffect("flamer", 5)).toMatchObject({ toHit: 2, heat: 2 });
        expect(getMalfunctionEffect("flamer", 5).text).toMatch(/\+2 heat a turn and \+2 to-hit/);
    });

    it("Long Range Wars: extended to 2 x long at +6, extreme to 4 x long at +9 (10 and 13 at Gunnery 4), pp.55-56", () => {
        expect(getLongRangeWarsBand(18, 18)).toBeUndefined();
        expect(getLongRangeWarsBand(18, 9)).toEqual({ band: "extended", modifier: 6 }); // medium laser 18 / 36
        expect(getLongRangeWarsBand(19, 9)).toEqual({ band: "extreme", modifier: 9 });
        expect(getLongRangeWarsBand(36, 18)).toEqual({ band: "extended", modifier: 6 });
        expect(getLongRangeWarsBand(37, 18)).toEqual({ band: "extreme", modifier: 9 });
        expect(getLongRangeWarsBand(73, 18)).toBeUndefined();
        expect([getLongRangeWarsFirerModifier("n"), getLongRangeWarsFirerModifier("w"), getLongRangeWarsFirerModifier("r"), getLongRangeWarsFirerModifier("j")]).toEqual([0, 2, 3, 5]);
        expect([0, 1, 2, 3, 4, 5, 6].map(getLongRangeWarsTargetModifier)).toEqual([0, 1, 2, 4, 5, 5, 5]);
    });
});
