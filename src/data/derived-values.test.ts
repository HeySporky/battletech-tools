import { describe, expect, it } from "vitest";
import { ammoBattleValueFromWeapon, ammoCostFromBattleValue, AMMO_COST_PER_BV, canonRecord, costFromBattleValue, COST_PER_BV, damageHexes,
    directFireBattleValue, extrapolate, fusionLanceBattleValue, fusionLanceDamage, fusionLanceHexDamage, interpolate, MELEE_BV_PER_DAMAGE,
    meleeBattleValue, oneShotBattleValue } from "./derived-values";
import { equipmentEnergy } from "./equipment-energy";
import { sizeVariableEquipment } from "./variable-equipment";

// The methods that derive a Battle Value or cost for fan equipment are checked here against canon weapons: how far each runs from
// the printed figure. The readout (docs/lore/homebrew-equipment-tro.md) quotes these checks, so others can see the margin.

const bv = (tag: string): number => canonRecord(tag).battleValue!;
const within = (derived: number, printed: number, fraction: number) => expect(Math.abs(derived - printed) / printed).toBeLessThanOrEqual(fraction);
const reach = (tag: string) => canonRecord(tag).range!;
const median = (values: number[]): number => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

describe("direct-fire weapons: damage over reach", () => {
    it("reproduces the plain canon lasers and PPCs within 7%", () => {
        for (const tag of ["standard-ppc", "er-ppc", "large-laser", "medium-laser", "small-laser", "er-large-laser", "er-medium-laser"]) {
            const item = canonRecord(tag);
            within(directFireBattleValue(item.damage!, reach(tag)), item.battleValue!, 0.07);
        }
    });

    it("runs about a sixth low on heavy hitters, as the readout says (Heavy PPC, Snub-Nose PPC)", () => {
        const heavy = canonRecord("heavy-ppc"), snub = canonRecord("snub-nose-ppc");
        const heavyDerived = directFireBattleValue(heavy.damage!, heavy.range!), snubDerived = directFireBattleValue(snub.damage!, snub.range!);
        expect(heavyDerived).toBe(270);
        expect(snubDerived).toBe(132);
        expect(Math.round(100 * (1 - heavyDerived / heavy.battleValue!))).toBe(15);
        expect(Math.round(100 * (1 - snubDerived / snub.battleValue!))).toBe(20);
    });

    it("sums damage over the hexes of each band", () => {
        expect(damageHexes({ short: 10, medium: 8, long: 5 }, { short: 9, medium: 13, long: 15 })).toBe(132);
        expect(damageHexes(10, { short: 6, medium: 12, long: 18 })).toBe(180);
    });

    it("costs a weapon at the canon energy median per Battle Value", () => {
        const ratios = equipmentEnergy
            .filter((item) => !item.isAmmo && item.battleValue && item.cbills && (item.rulesLevel ?? 1) <= 3)
            .map((item) => item.cbills! / item.battleValue!);
        within(COST_PER_BV, median(ratios), 0.01);
        expect(costFromBattleValue(180)).toBe(236000);
    });
});

describe("launchers: the canon line carried to a larger size", () => {
    it("two points reproduce the third within 4% (SRM, Streak SRM, LRM)", () => {
        within(extrapolate([2, bv("srm-2")], [4, bv("srm-4")], 6), bv("srm-6"), 0.04);
        within(extrapolate([2, bv("streak-srm-2")], [4, bv("streak-srm-4")], 6), bv("streak-srm-6"), 0.04);
        within(extrapolate([5, bv("lrm-5")], [10, bv("lrm-10")], 20), bv("lrm-20"), 0.01);
    });

    it("one-shot launchers are a fifth of their twins (canon SRM, Streak SRM, SRT, LRM OS)", () => {
        for (const [os, twin] of [["srm-2-os", "srm-2"], ["srm-4-os", "srm-4"], ["srm-6-os", "srm-6"], ["streak-srm-6-os", "streak-srm-6"], ["srt-4-os", "srt-4"], ["lrm-20-os", "lrm-20"]]) {
            expect(oneShotBattleValue(bv(twin)), os).toBe(bv(os));
        }
    });
});

describe("autocannon sizes: the line between canon neighbours", () => {
    const families: [string, string[], number, number][] = [
        ["Autocannon", ["autocannon-standard-a", "autocannon-standard-b", "autocannon-standard-c", "autocannon-standard-d"], 2, 20],
        ["LB-X", ["autocannon-lbx-2", "autocannon-lbx-5", "autocannon-lbx-10", "autocannon-lbx-20"], 2, 20],
        ["Ultra", ["autocannon-ultra-a", "autocannon-ultra-b", "autocannon-ultra-c", "autocannon-ultra-d"], 2, 20],
    ];
    it("two neighbours reproduce the size between them within 6%", () => {
        for (const [name, [a, b, c]] of families) {
            // The 5 from the 2 and the 10.
            within(interpolate([2, bv(a)], [10, bv(c)], 5), bv(b), 0.06);
            expect(name).toBeTruthy();
        }
    });

    it("an ammunition ton is an eighth of the weapon's Battle Value, within 1 point", () => {
        for (const [, tags] of families) {
            for (const tag of tags) expect(Math.abs(ammoBattleValueFromWeapon(bv(tag)) - canonRecord(tag).ammoBattleValue!), tag).toBeLessThanOrEqual(1);
        }
    });

    it("the 15-size weapons sit on the line between the 10 and the 20", () => {
        expect(Math.round(interpolate([10, bv("autocannon-standard-c")], [20, bv("autocannon-standard-d")], 15))).toBe(151);
        expect(Math.round(interpolate([10, bv("autocannon-lbx-10")], [20, bv("autocannon-lbx-20")], 15))).toBe(193);
        expect(Math.round(interpolate([10, bv("autocannon-ultra-c")], [20, bv("autocannon-ultra-d")], 15))).toBe(246);
        // The authors' own costs already sit on this line: 500,000 and 400,000 are the midpoints.
        expect(interpolate([10, canonRecord("autocannon-lbx-10").cbills!], [20, canonRecord("autocannon-lbx-20").cbills!], 15)).toBe(500000);
        expect(interpolate([10, canonRecord("autocannon-ultra-c").cbills!], [20, canonRecord("autocannon-ultra-d").cbills!], 15)).toBe(400000);
    });

    it("an ammunition ton costs the canon median per Battle Value", () => {
        const ratios = families.flatMap(([, tags]) => tags.map((tag) => {
            const ammo = canonRecord(tag);
            return ammo.ammoBattleValue ? (({ "autocannon-standard-a": 1000, "autocannon-standard-b": 4500, "autocannon-standard-c": 6000, "autocannon-standard-d": 10000,
                "autocannon-lbx-2": 2000, "autocannon-lbx-5": 9000, "autocannon-lbx-10": 12000, "autocannon-lbx-20": 20000,
                "autocannon-ultra-a": 1000, "autocannon-ultra-b": 9000, "autocannon-ultra-c": 12000, "autocannon-ultra-d": 20000 }) as Record<string, number>)[tag] / ammo.ammoBattleValue : 0;
        })).filter((ratio) => ratio > 0);
        within(AMMO_COST_PER_BV, median(ratios), 0.1);
        expect(ammoCostFromBattleValue(10)).toBe(4500);
    });
});

describe("physical weapons", () => {
    it("the melee multiplier is the median of the canon hatchet, sword, mace, lance and claw", () => {
        const multipliers = (["hatchet", "sword", "mace", "lance", "claw"] as const).map((formula) => {
            const size = sizeVariableEquipment(formula, { tonnage: 100, engineRating: 300, engineWeight: 19, directFireWeaponWeight: 0 })!;
            return size.battleValue! / size.damage!;
        });
        expect(median(multipliers)).toBe(MELEE_BV_PER_DAMAGE);
        expect(meleeBattleValue(15)).toBe(19);
    });
});

describe("Fusion Lance: Battle Value by engine rating", () => {
    it("damage is 10 plus 5 per 100 of rating or part, 15 to 30", () => {
        expect([100, 101, 200, 250, 300, 400, 500].map(fusionLanceDamage)).toEqual([15, 20, 20, 25, 25, 30, 30]);
        expect(fusionLanceDamage(0)).toBe(15);
    });

    it("falls 5 a hex, and its Battle Value is that damage over three hexes", () => {
        expect(fusionLanceHexDamage(250)).toEqual([25, 20, 15]);
        expect([100, 200, 250, 400].map(fusionLanceBattleValue)).toEqual([30, 45, 60, 75]);
    });

    it("is sized per unit by the variable-equipment formula, with its cost", () => {
        const size = sizeVariableEquipment("fusion-lance", { tonnage: 50, engineRating: 250, engineWeight: 12.5, directFireWeaponWeight: 0 })!;
        expect(size).toMatchObject({ weight: 4, slots: 2, damage: 25, battleValue: 60, cbills: costFromBattleValue(60) });
    });
});
