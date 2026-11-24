import { describe, expect, it } from "vitest";
import { ammoCustom } from "./ammo-custom";
import { ballisticCustom } from "./ballistic-custom";
import { CLUSTER_HITS_ON_7, deriveAlphaStrike, shortRangeFactor } from "./derived-alpha-strike";
import { canonRecord } from "./derived-values";
import { energyCustom } from "./energy-custom";
import { equipmentEnergy } from "./equipment-energy";
import { miscCustom } from "./misc-custom";
import { missileCustom } from "./missile-custom";
import { IEquipmentItem } from "./data-interfaces";

// Alpha Strike values for the fan weapons whose records held none (the card calculation reads each weapon's block, so a zero block meant the weapon
// added nothing to a unit's Alpha Strike values). The conversion is the one the canon weapons follow; these tests check it against them.

const near = (a: number, b: number) => Math.abs(a - b) <= 0.02;
const all: IEquipmentItem[] = [...equipmentEnergy, ...energyCustom, ...miscCustom, ...ballisticCustom, ...missileCustom, ...ammoCustom];
const record = (tag: string): IEquipmentItem => {
    const found = all.find((item) => item.tag === tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found;
};

describe("Alpha Strike derivation against the canon weapons", () => {
    const CANON = ["small-laser", "medium-laser", "large-laser", "er-large-laser", "er-medium-laser", "standard-ppc", "er-ppc", "heavy-ppc", "snub-nose-ppc", "light-ppc",
        "autocannon-standard-a", "autocannon-standard-b", "autocannon-standard-c", "autocannon-standard-d", "medium-pulse-laser", "large-pulse-laser", "er_medium_pulse_laser",
        "er_large_pulse_laser", "er_small_pulse_laser", "srm-6", "srm-4", "srm-2", "gauss-rifle-heavy"];
    it("an Ultra autocannon counts half again the damage and twice the heat, as the canon Ultra AC/5 and /10 do", () => {
        for (const tag of ["autocannon-ultra-b", "autocannon-ultra-c"]) {
            const item = canonRecord(tag);
            const derived = deriveAlphaStrike(item);
            expect(near(derived.rangeShort, item.alphaStrike.rangeShort), tag).toBe(true);
            expect(derived.heat, tag).toBe(item.alphaStrike.heat);
        }
        // 15 damage, half again for the double rate, a tenth for the scale, the short bracket cut by its minimum range of 1.
        const block = record("custom-ultra-ac-15").alphaStrike;
        expect(block.heat).toBe(8);
        expect(near(block.rangeShort, 15 * 1.5 / 10 * (1 - 1 / 12))).toBe(true);
        expect(near(block.rangeMedium, 2.25)).toBe(true);
    });

    for (const tag of CANON) {
        it(`reproduces the canon ${tag}`, () => {
            const item = canonRecord(tag);
            const derived = deriveAlphaStrike(item);
            const canon = item.alphaStrike;
            expect(near(derived.rangeShort, canon.rangeShort), `short ${derived.rangeShort} v ${canon.rangeShort}`).toBe(true);
            expect(near(derived.rangeMedium, canon.rangeMedium), `medium ${derived.rangeMedium} v ${canon.rangeMedium}`).toBe(true);
            expect(near(derived.rangeLong, canon.rangeLong), `long ${derived.rangeLong} v ${canon.rangeLong}`).toBe(true);
            expect(near(derived.rangeExtreme, canon.rangeExtreme), `extreme ${derived.rangeExtreme} v ${canon.rangeExtreme}`).toBe(true);
        });
    }

    it("the hits on a 7 are the cluster table's: 6 missiles 4, 10 missiles 6, 20 missiles 12", () => {
        expect([CLUSTER_HITS_ON_7[6], CLUSTER_HITS_ON_7[10], CLUSTER_HITS_ON_7[20]]).toEqual([4, 6, 12]);
    });

    it("a minimum range cuts the short bracket by a twelfth a hex, to a quarter", () => {
        expect([0, 1, 3, 4, 6, 10, 20].map((minimum) => Math.round(shortRangeFactor(minimum) * 100) / 100)).toEqual([1, 0.92, 0.75, 0.67, 0.5, 0.25, 0.25]);
    });
});

describe("Alpha Strike values of the fan weapons", () => {
    const expected: Record<string, [number, number, number, number, number]> = {
        // tag: short, medium, long, extreme, heat
        "ppc-x": [1.05, 1.05, 0, 0, 10],
        "custom-omni-laser": [1.6, 1.6, 1.6, 0, 20],
        "custom-superheavy-ppc": [1.5, 2, 2, 0, 20],
        "custom-fusion-lance": [1.5, 0, 0, 0, 30],
        "coil_s": [0.3, 0, 0, 0, 2], "coil_m": [0.5, 0.5, 0, 0, 4], "coil_l": [0.7, 0.7, 0, 0, 9],
        "custom-srm-8": [0.917, 1, 0, 0, 5], "custom-srm-10": [1.1, 1.2, 0, 0, 6], "custom-streak-srm-10": [1.1, 1.2, 0, 0, 6],
        "custom-rrl-10": [0.6, 0.6, 0.6, 0, 3], "custom-rrl-20": [1.2, 1.2, 0, 0, 5],
        "custom-disruptor": [1, 1, 0, 0, 8],
        "custom-gatling-laser": [0.8, 0.8, 0, 0, 1],
    };
    for (const [tag, [short, medium, long, extreme, heat]] of Object.entries(expected)) {
        it(`${tag}: ${short} / ${medium} / ${long} / ${extreme}, heat ${heat}`, () => {
            const block = record(tag).alphaStrike;
            expect(near(block.rangeShort, short), `short ${block.rangeShort}`).toBe(true);
            expect(near(block.rangeMedium, medium), `medium ${block.rangeMedium}`).toBe(true);
            expect(near(block.rangeLong, long), `long ${block.rangeLong}`).toBe(true);
            expect(near(block.rangeExtreme, extreme), `extreme ${block.rangeExtreme}`).toBe(true);
            expect(block.heat).toBe(heat);
            expect(block.notes.join(" ")).toContain("derived-alpha-strike.ts");
        });
    }

    it("a canon weapon's block is never touched, and direct-fire weapons keep the targeting computer bonus", () => {
        const heavy = canonRecord("heavy-ppc");
        expect(heavy.alphaStrike.rangeShort).toBe(1.125);
        expect(record("ppc-x").alphaStrike.tc).toBe(true);
        expect(record("custom-srm-8").alphaStrike.tc).toBe(false);
    });
});
