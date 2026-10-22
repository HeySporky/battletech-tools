import { describe, expect, it } from "vitest";
import { CAPITAL_WEAPON_CATALOG } from "./capital-weapon-helpers";
import { CAPITAL_WEAPON_ALPHA_STRIKE, getCapitalASArmor, getCapitalShipASSize, getLargeCraftASThreshold, getLargeCraftMovementFactor, toLargeCraftASDamage } from "./large-craft-alpha-strike";

describe("large craft Alpha Strike conversion", () => {
    it("every capital and sub-capital weapon has a row of the ASC p.114 table except the Screen Launcher (SCR, ASC p.130) and the Dragon's Breath (DB, IO:AE p.207)", () => {
        const missing = CAPITAL_WEAPON_CATALOG.filter((weapon) => !CAPITAL_WEAPON_ALPHA_STRIKE[weapon.tag]).map((weapon) => weapon.tag);
        expect(missing).toEqual(["screen-launcher", "dragons-breath-mcm"]);
    });

    it("errata v1.6 corrects the NAC/25's Short damage from 23 to 25", () => {
        expect(CAPITAL_WEAPON_ALPHA_STRIKE["nac-25"].damage).toEqual([25, 25, 25, 0]);
    });

    it("Size by tonnage for WarShips, and for JumpShips and stations (ASC p.92)", () => {
        expect([499999, 500000, 799999, 800000, 1200000].map((tons) => getCapitalShipASSize(true, tons))).toEqual([1, 2, 2, 3, 4]);
        expect([99999, 100000, 300000].map((tons) => getCapitalShipASSize(false, tons))).toEqual([1, 2, 3]);
    });

    it("capital armor x 0.33, rounded normally, and a Threshold over four arcs rounded up (ASC p.95)", () => {
        // The Agamemnon example: 324 capital armor is 107, and the card's Threshold 9 (107 / 3 / 4 = 8.9).
        expect(getCapitalASArmor(324)).toBe(107);
        expect(getLargeCraftASThreshold(107, 4)).toBe(9);
        // The rule rounds up; the published Aegis card rounds 193 / 12 = 16.08 to 16.
        expect(getLargeCraftASThreshold(193, 4)).toBe(17);
    });

    it("minimal damage below 0.5, otherwise up to the next whole number (ASC p.116)", () => {
        expect(toLargeCraftASDamage(0.4)).toEqual({ damage: 0, minimal: true });
        expect(toLargeCraftASDamage(12.5)).toEqual({ damage: 13, minimal: false });
        expect(toLargeCraftASDamage(0)).toEqual({ damage: 0, minimal: false });
    });

    it("Movement Factor adds 0.5 at Thrust 7-9 and 2 at 10 or more (ASC p.144, errata v1.6)", () => {
        expect([0.2, 4, 7, 10].map(getLargeCraftMovementFactor)).toEqual([0.05, 1, 2.25, 4.5]);
    });
});
