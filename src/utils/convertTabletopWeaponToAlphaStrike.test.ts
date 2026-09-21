import { describe, expect, it } from "vitest";
import { convertTabletopWeaponToAlphaStrike } from "./convertTabletopWeaponToAlphaStrike";

describe("tabletop weapon Alpha Strike conversion", () => {
    it("refuses to guess without a cited conversion rule", () => {
        expect(convertTabletopWeaponToAlphaStrike({
            heat: 3,
            damage: { short: 10, medium: 10, long: 10 },
        })).toEqual({
            status: "unresolved",
            reason: "An authoritative Alpha Strike conversion rule is required; Classic BattleTech ranges are not Alpha Strike damage values.",
        });
    });

    it("calculates values using an explicitly supplied rule", () => {
        const result = convertTabletopWeaponToAlphaStrike({
            heat: 10,
            damage: { short: 10, medium: 10, long: 10 },
            rule: {
                id: "test-source-rule",
                source: "Catalyst verification fixture",
                damageDivisor: 5,
                minimumDamage: 1,
                rounding: "nearest",
            },
        });

        expect(result).toEqual({
            status: "calculated",
            source: "Catalyst verification fixture",
            ruleId: "test-source-rule",
            heat: 10,
            rangeShort: 2,
            rangeMedium: 2,
            rangeLong: 2,
            rangeExtreme: 0,
        });
    });

    it("applies range multipliers and minimum damage after rounding", () => {
        const result = convertTabletopWeaponToAlphaStrike({
            heat: 2,
            damage: { short: 5, medium: 5, long: 0 },
            rule: {
                id: "multiplier-rule",
                source: "Verified conversion worksheet",
                damageDivisor: 10,
                shortMultiplier: 0.5,
                mediumMultiplier: 2,
                minimumDamage: 1,
                rounding: "nearest",
            },
        });

        expect(result.rangeShort).toBe(1);
        expect(result.rangeMedium).toBe(1);
        expect(result.rangeLong).toBe(0);
    });
});