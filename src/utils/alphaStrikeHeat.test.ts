import { describe, expect, it } from "vitest";
import {
    addsNoAlphaStrikeWeaponHeat, alphaStrikeAmmoFactor, alphaStrikeMmlBinShots,alphaStrikeExtraHeat, alphaStrikeMovementHeat, applyAlphaStrikeHeat, finalAlphaStrikeDamage, roundAlphaStrikeAbilityDamage,
    roundUpToTenth,
} from "./alphaStrikeHeat";

// Alpha Strike Companion, Converting Heat errata v1.3 (CGL 2025), which supersedes ASC pp.115-116.

describe("roundUpToTenth", () => {
    it.each([[0, 0], [0.401, 0.5], [0.901, 1], [3.52, 3.6], [3.75, 3.8], [1.1, 1.1], [0.3 * 3, 0.9]])("%f -> %f", (value, expected) => {
        expect(roundUpToTenth(value)).toBe(expected);
    });
});

describe("final damage values (errata v1.3, Determine Final Damage Values)", () => {
    it("rounds up to the tenth, then up to the whole number", () => {
        expect(finalAlphaStrikeDamage(0.95)).toEqual({ damage: 1, minimal: false });
        expect(finalAlphaStrikeDamage(3.52)).toEqual({ damage: 4, minimal: false });
        expect(finalAlphaStrikeDamage(0.5)).toEqual({ damage: 1, minimal: false });
        expect(finalAlphaStrikeDamage(0.401)).toEqual({ damage: 1, minimal: false });
    });

    it("more than 0 and under 0.5 is Minimal Damage, 0*; nothing is 0", () => {
        expect(finalAlphaStrikeDamage(0.4)).toEqual({ damage: 0, minimal: true });
        expect(finalAlphaStrikeDamage(0.05)).toEqual({ damage: 0, minimal: true });
        expect(finalAlphaStrikeDamage(0)).toEqual({ damage: 0, minimal: false });
    });

    it("special ability damage rounds normally, after the tenth", () => {
        expect(roundAlphaStrikeAbilityDamage(1.4)).toEqual({ damage: 1, minimal: false });
        // 1.41 is 1.5 at the tenth, then rounds to 2.
        expect(roundAlphaStrikeAbilityDamage(1.41)).toEqual({ damage: 2, minimal: false });
        expect(roundAlphaStrikeAbilityDamage(0.3)).toEqual({ damage: 0, minimal: true });
        expect(roundAlphaStrikeAbilityDamage(0)).toEqual({ damage: 0, minimal: false });
    });
});

describe("movement heat (errata v1.3, Heat Output and XXL Engine / Improved Jump Jets)", () => {
    it("a BattleMech that cannot jump: 2; a non-jumping IndustrialMech: 0", () => {
        expect(alphaStrikeMovementHeat({ jumpMP: 0 })).toBe(2);
        expect(alphaStrikeMovementHeat({ jumpMP: 0, industrial: true })).toBe(0);
    });

    it("jumping: 1 a Jumping MP, at least 3", () => {
        expect(alphaStrikeMovementHeat({ jumpMP: 2 })).toBe(3);
        expect(alphaStrikeMovementHeat({ jumpMP: 5 })).toBe(5);
        expect(alphaStrikeMovementHeat({ jumpMP: 5, industrial: true })).toBe(5);
    });

    it("improved jump jets halve it, rounding up, at least 3", () => {
        expect(alphaStrikeMovementHeat({ jumpMP: 5, improvedJets: true })).toBe(3);
        expect(alphaStrikeMovementHeat({ jumpMP: 8, improvedJets: true })).toBe(4);
        expect(alphaStrikeMovementHeat({ jumpMP: 9, improvedJets: true })).toBe(5);
    });

    it("an XXL engine: 6 without jump jets (IndustrialMech too), 2 a Jumping MP with them, at least 6", () => {
        expect(alphaStrikeMovementHeat({ jumpMP: 0, xxl: true })).toBe(6);
        expect(alphaStrikeMovementHeat({ jumpMP: 0, xxl: true, industrial: true })).toBe(6);
        expect(alphaStrikeMovementHeat({ jumpMP: 2, xxl: true })).toBe(6);
        expect(alphaStrikeMovementHeat({ jumpMP: 5, xxl: true })).toBe(10);
    });

    it("an XXL engine with improved jump jets: 1 a Jumping MP, at least 3", () => {
        expect(alphaStrikeMovementHeat({ jumpMP: 2, xxl: true, improvedJets: true })).toBe(3);
        expect(alphaStrikeMovementHeat({ jumpMP: 6, xxl: true, improvedJets: true })).toBe(6);
    });
});

describe("special-case heat (errata v1.3: Anti-Missile Systems, Stealth Systems)", () => {
    it("AMS +1 each, Clan Laser AMS +5 each, Inner Sphere Laser AMS +7 each", () => {
        expect(alphaStrikeExtraHeat({ equipmentTags: ["is-ams"] })).toBe(1);
        expect(alphaStrikeExtraHeat({ equipmentTags: ["clan-ams", "is-ams"] })).toBe(2);
        expect(alphaStrikeExtraHeat({ equipmentTags: ["clan-laser-ams"] })).toBe(5);
        expect(alphaStrikeExtraHeat({ equipmentTags: ["is-laser-ams", "is-laser-ams"] })).toBe(14);
        expect(alphaStrikeExtraHeat({ equipmentTags: ["medium-laser", "ammo-is-ams-standard"] })).toBe(0);
    });

    it("rocket launchers, one-shot launchers and AMS add no weapon heat of their own", () => {
        expect(addsNoAlphaStrikeWeaponHeat({ tag: "rocket-launcher-10" })).toBe(true);
        expect(addsNoAlphaStrikeWeaponHeat({ tag: "prototype-rocket-launcher-20" })).toBe(true);
        expect(addsNoAlphaStrikeWeaponHeat({ tag: "srm-6", isOneShot: true })).toBe(true);
        expect(addsNoAlphaStrikeWeaponHeat({ tag: "is-laser-ams" })).toBe(true);
        expect(addsNoAlphaStrikeWeaponHeat({ tag: "medium-laser" })).toBe(false);
        expect(addsNoAlphaStrikeWeaponHeat({ tag: "srm-6" })).toBe(false);
    });

    it("stealth armor, the Null-Signature or Void-Signature System +10 (once); Chameleon LPS +6", () => {
        expect(alphaStrikeExtraHeat({ equipmentTags: [], stealthArmor: true })).toBe(10);
        expect(alphaStrikeExtraHeat({ equipmentTags: ["null-signature-system"] })).toBe(10);
        expect(alphaStrikeExtraHeat({ equipmentTags: ["void-signature-system"], stealthArmor: true })).toBe(10);
        expect(alphaStrikeExtraHeat({ equipmentTags: ["chameleon-lps"] })).toBe(6);
        expect(alphaStrikeExtraHeat({ equipmentTags: ["chameleon-lps", "null-signature-system", "is-ams"] })).toBe(17);
    });
});

describe("applyAlphaStrikeHeat (errata v1.3, Heat-Modified Damage and Overheat)", () => {
    it("a unit that sheds its heat (dissipation >= output - 4) keeps its subtotals, rounded up to the tenth", () => {
        const result = applyAlphaStrikeHeat({ subtotals: [2.31, 2.31, 0.401, 0], heatOutput: 14, longHeatOutput: 14, dissipation: 10 });
        expect(result.hot).toBe(false);
        expect(result.modified).toEqual([2.4, 2.4, 0.5, 0]);
        expect(result.values.map((value) => value.damage)).toEqual([3, 3, 1, 0]);
        expect(result.overheat).toBe(0);
        expect(result.ovl).toBe(false);
        expect(result.factor).toEqual([1, 1, 1, 1]);
    });

    it("the errata's worked example: Long 4.5, 50 + 2 heat at Long, 53 + 2 in all, dissipation 40 -> OVL, Long 3.6 -> 4", () => {
        const result = applyAlphaStrikeHeat({ subtotals: [4.5, 4.5, 4.5, 0], heatOutput: 55, longHeatOutput: 52, dissipation: 40 });
        // The check: 4.5 x 40 / 48 = 3.75 -> 3.8 -> 4, at least 1 under 5: OVL.
        expect(result.ovl).toBe(true);
        // The actual Long damage uses the full output: 4.5 x 40 / 51 = 3.52 -> 3.6 -> 4.
        expect(result.modified[2]).toBe(3.6);
        expect(result.values[2]).toEqual({ damage: 4, minimal: false });
        // Medium: 5 before, 4 after: Overheat 1.
        expect(result.overheat).toBe(1);
        expect(result.factor[0]).toBeCloseTo(40 / 51);
        expect(result.factor[2]).toBeCloseTo(40 / 51);
    });

    it("without OVL the Long damage is the unmodified subtotal, rounded up to the tenth", () => {
        // 2 PPCs + 4 Medium Lasers on 10 sinks: Long output leaves the lasers out, 22 - 4 = 18: 2 x 10 / 18 = 1.2 -> 2, not
        // under 2: no OVL, Long stays 2.
        const result = applyAlphaStrikeHeat({ subtotals: [3.5, 4, 2, 0], heatOutput: 34, longHeatOutput: 22, dissipation: 10 });
        expect(result.ovl).toBe(false);
        expect(result.modified).toEqual([1.2, 1.4, 2, 0]);
        expect(result.values.map((value) => value.damage)).toEqual([2, 2, 2, 0]);
        expect(result.overheat).toBe(2);
        expect(result.factor[2]).toBe(1);
    });

    it("scales the raw subtotal, not a rounded one", () => {
        // 1.05 x 10 / 30 = 0.35 -> 0.4: 0*. Rounding first (2 x 10 / 30 = 0.67 -> 1) would print 1.
        const result = applyAlphaStrikeHeat({ subtotals: [1.05, 1.05, 0, 0], heatOutput: 34, longHeatOutput: 2, dissipation: 10 });
        expect(result.values[1]).toEqual({ damage: 0, minimal: true });
        // Overheat: 2 before (1.05 up to 2), 0 after.
        expect(result.overheat).toBe(2);
    });

    it("Overheat is at most 4", () => {
        const result = applyAlphaStrikeHeat({ subtotals: [8, 8, 0, 0], heatOutput: 64, longHeatOutput: 2, dissipation: 10 });
        // 8 x 10 / 60 = 1.33 -> 1.4 -> 2; 8 - 2 = 6, capped.
        expect(result.overheat).toBe(4);
    });

    it("Overheat comes from Short when there is no Medium damage", () => {
        const result = applyAlphaStrikeHeat({ subtotals: [3, 0, 0, 0], heatOutput: 34, longHeatOutput: 2, dissipation: 10 });
        // 3 x 10 / 30 = 1: 3 - 1 = 2.
        expect(result.values[0].damage).toBe(1);
        expect(result.overheat).toBe(2);
    });

    it("OVL scales Extreme as it scales Long", () => {
        const result = applyAlphaStrikeHeat({ subtotals: [4, 4, 4, 4], heatOutput: 44, longHeatOutput: 44, dissipation: 10 });
        expect(result.ovl).toBe(true);
        expect(result.modified[3]).toBe(1);
    });
});

// ASC p.101, Ammunition: a ballistic or missile weapon without at least 10 shots is x 0.75; an Ultra autocannon needs 20, a
// Rotary autocannon 60; a Multi-Missile Launcher counts the average of its two ammunition counts, rounded down; a one-shot
// launcher is x 0.1.
describe("the low-ammunition multiplier (ASC p.101)", () => {
    it("is x 0.75 under 10 shots and x 1 from 10", () => {
        expect(alphaStrikeAmmoFactor({ tag: "clan-lrm-20" }, 9)).toBe(0.75);
        expect(alphaStrikeAmmoFactor({ tag: "clan-lrm-20" }, 10)).toBe(1);
    });

    it("needs 20 shots for an Ultra autocannon and 60 for a Rotary autocannon", () => {
        expect(alphaStrikeAmmoFactor({ tag: "clan-autocannon-uac-20", isUltra: true }, 19)).toBe(0.75);
        expect(alphaStrikeAmmoFactor({ tag: "clan-autocannon-uac-20", isUltra: true }, 20)).toBe(1);
        expect(alphaStrikeAmmoFactor({ tag: "autocannon-ultra-a" }, 19)).toBe(0.75);
        expect(alphaStrikeAmmoFactor({ tag: "rotary-ac-5" }, 59)).toBe(0.75);
        expect(alphaStrikeAmmoFactor({ tag: "rotary-ac-5" }, 60)).toBe(1);
    });

    it("gives a one-shot launcher x 0.1 whatever its ammunition", () => {
        expect(alphaStrikeAmmoFactor({ tag: "clan-lrm-20-os", isOneShot: true }, 0)).toBe(0.1);
    });

    it("counts a Multi-Missile Launcher bin as the average of its LRM and SRM counts, rounded down", () => {
        // An MML-9 ton: 13 shots as LRM, 11 as SRM, 12 counted; an MML-5 ton: 24 and 20, 22.
        expect(alphaStrikeMmlBinShots(13, 11)).toBe(12);
        expect(alphaStrikeMmlBinShots(24, 20)).toBe(22);
    });

    it("leaves a rocket launcher unmodified though it is one-shot", () => {
        expect(alphaStrikeAmmoFactor({ tag: "rocket-launcher-10", isOneShot: true }, 0)).toBe(1);
        expect(alphaStrikeAmmoFactor({ tag: "prototype-rocket-launcher-15", isOneShot: true }, 0)).toBe(1);
    });
});
