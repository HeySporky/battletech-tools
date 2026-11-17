import { describe, expect, it } from "vitest";
import { ammoCustom } from "./ammo-custom";
import { ballisticCustom } from "./ballistic-custom";
import { rateBattleValue1 } from "./battle-value";
import { DERIVATION_RULES } from "./derived-custom-values";
import { canonRecord } from "./derived-values";
import { energyCustom } from "./energy-custom";
import { equipmentEnergy } from "./equipment-energy";
import { miscCustom } from "./misc-custom";
import { missileCustom } from "./missile-custom";
import { IEquipmentItem } from "./data-interfaces";

// Custom Homebrew batch chunk 6 follow-up (owner, 2026-11-16): items whose authors gave no Battle Value or cost get a derived one,
// by the methods checked against canon in derived-values.test.ts. BV1 (Master Rules) prints nothing for them, so it reads the same figure.

const all: IEquipmentItem[] = [...equipmentEnergy, ...energyCustom, ...miscCustom, ...ballisticCustom, ...missileCustom, ...ammoCustom];
const record = (tag: string): IEquipmentItem => {
    const found = all.find((item) => item.tag === tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found;
};

// tag: [Battle Value, cost]; a null cost is one the author gave (checked unchanged elsewhere).
const expected: Record<string, [number, number | null]> = {
    "ppc-x": [180, 236000],
    "light-blazer": [63, 83000],
    "custom-fusion-lance": [30, 39000],
    "custom-omni-laser": [288, 377000],
    "custom-disruptor": [150, 197000],
    "custom-gatling-laser": [72, 50000],
    "custom-power-booster-gatling-laser": [72, 800000],
    "custom-lr-flamer": [60, 65000],
    "custom-pile-bunker": [19, 25000],
    "ammo-custom-pile-bunker-standard": [2, 1000],
    "custom-ac-15": [151, 250000],
    "custom-lb-15x-ac": [193, 500000],
    "custom-ultra-ac-15": [246, 400000],
    "ammo-ac-15-standard": [19, 8000],
    "ammo-lb-15x-standard": [25, 16000],
    "ammo-lb-15x-cluster": [25, 27000],
    "ammo-ultra-ac-15-standard": [31, 16000],
    "custom-srm-8": [79, 100000], "custom-srm-10": [99, 120000], "custom-srm-8-os": [16, 20000], "custom-srm-10-os": [20, 24000],
    "custom-srt-8": [79, 105000], "custom-srt-10": [99, 125000], "custom-srt-8-os": [16, 21000], "custom-srt-10-os": [20, 25000],
    "custom-streak-srm-8": [119, 150000], "custom-streak-srm-10": [149, 180000], "custom-streak-srm-8-os": [24, 30000], "custom-streak-srm-10-os": [30, 36000],
    "custom-streak-srt-8": [119, 155000], "custom-streak-srt-10": [149, 185000], "custom-streak-srt-8-os": [24, 31000], "custom-streak-srt-10-os": [30, 37000],
    "custom-eii-pds": [32, 100000],
    "ammo-custom-eii-pds-standard": [11, 2000],
    "custom-null-signature-system": [0, 1400000],
    "custom-penitrator": [103, 135000],
    "ammo-heavy-machine-gun-ap": [1, 1500], "ammo-heavy-machine-gun-incendiary": [1, 2000], "ammo-heavy-machine-gun-tracer": [1, 1200],
    "ammo-light-machine-gun-ap": [1, 1500], "ammo-light-machine-gun-incendiary": [1, 2000], "ammo-light-machine-gun-tracer": [1, 1200],
    "ammo-machine-gun-ap": [1, 1500], "ammo-machine-gun-incendiary": [1, 2000], "ammo-machine-gun-tracer": [1, 1200],
    "ammo-ac-2-sabot": [5, 1000], "ammo-ac-5-sabot": [9, 4500], "ammo-ac-10-sabot": [15, 6000], "ammo-ac-20-sabot": [22, 10000],
    "ammo-is-gauss-rifle-vhe": [40, 20000], "ammo-is-gauss-rifle-inferno": [40, 20000],
    "ammo-custom-lr-flamer-standard": [2, 2000],
    "ammo-is-heavy-rotary-rifle-standard": [13, 4000], "ammo-medium-rotary-rifle-standard": [9, 2500], "ammo-light-rotary-rifle-standard": [6, 1500],
};

// Items whose Battle Value 0 is the canon figure for their kind: the notes say so.
const deliberateZero = [
    "custom-small-laser-array", "custom-medium-laser-array", "custom-modular-c3", "custom-power-booster-running", "custom-power-booster-jumping",
    "custom-mech-periscope", "custom-mech-improved-magnetic-grapples",
    ...["lrm", "srm", "mrm", "enhanced-lrm", "extended-lrm", "lrt", "srt", "enhanced-lrt"].map((family) => `ammo-is-${family}-emp`),
];

describe("derived cost and Battle Value", () => {
    for (const [tag, [battleValue, cbills]] of Object.entries(expected)) {
        it(`${tag}: BV ${battleValue}, ${cbills ?? "the author's"} C-Bills`, () => {
            const item = record(tag);
            expect(item.battleValue).toBe(battleValue);
            if (cbills !== null) expect(item.cbills).toBe(cbills);
        });
    }

    it("every item with a rule says in its notes that a figure was derived, or why 0 is right", () => {
        for (const tag of Object.keys(DERIVATION_RULES)) {
            expect(record(tag).notes, tag).toMatch(DERIVATION_RULES[tag].kind === "no-battle-value" ? /Battle Value 0 is deliberate/ : /Derived, not given by the author/);
        }
        for (const tag of deliberateZero) {
            expect(DERIVATION_RULES[tag]?.kind, tag).toBe("no-battle-value");
            expect(record(tag).battleValue, tag).toBe(0);
            for (const like of (DERIVATION_RULES[tag] as { like: string[] }).like) expect(canonRecord(like).battleValue, `${tag} like ${like}`).toBe(0);
        }
        expect(record("custom-penitrator").ammoBattleValue).toBe(13);
        for (const [tag, weapon] of [["ammo-is-heavy-rotary-rifle-standard", "heavy-rotary-rifle-cannon"], ["ammo-medium-rotary-rifle-standard", "medium-rotary-rifle-cannon"], ["ammo-light-rotary-rifle-standard", "light-rotary-rifle-cannon"]]) {
            expect((DERIVATION_RULES[tag] as { weaponBattleValue: number }).weaponBattleValue, tag).toBe(record(weapon).battleValue);
        }
        expect(record("ppc-x").notes).toMatch(/Derived, not given by the author/);
        expect(record("light-blazer").notes).toMatch(/derived/);
    });

    it("figures an author gave were not touched (Superheavy PPC 422 and 300,000; the AC/15 ammunition's 8,000)", () => {
        expect(record("custom-superheavy-ppc").battleValue).toBe(422);
        expect(record("custom-superheavy-ppc").cbills).toBe(300000);
        expect(record("ammo-ac-15-standard").cbills).toBe(8000);
    });

    it("BV1 reads the derived figure through the catalog fallback", () => {
        for (const tag of ["ppc-x", "custom-fusion-lance", "custom-omni-laser", "custom-pile-bunker", "custom-srm-8", "custom-ac-15"]) {
            const rating = rateBattleValue1("master-rules", "is", false, record(tag));
            expect(rating.value, tag).toBe(record(tag).battleValue);
            expect(rating.source, tag).toBe("unlisted");
        }
    });

    it("the neighbours the rules name exist in the catalog", () => {
        for (const rule of Object.values(DERIVATION_RULES)) {
            if (rule.kind === "copy-of") expect(canonRecord(rule.tag).name).toBeTruthy();
            if (rule.kind === "autocannon" || rule.kind === "ammo-interpolated") {
                expect(canonRecord(rule.low).battleValue).toBeGreaterThan(0);
                expect(canonRecord(rule.high).battleValue).toBeGreaterThan(0);
            }
        }
    });

    it("the Pile Bunker ammunition rule uses the Pile Bunker's own damage", () => {
        expect(record("custom-pile-bunker").damage).toBe(15);
        expect(record("ammo-custom-pile-bunker-standard").battleValue).toBe(Math.round(record("custom-pile-bunker").battleValue! * 0.125));
    });

    it("the PDS is defensive Battle Value, as the AMS it copies", () => {
        expect(record("custom-eii-pds").battleValueDefensive).toBe(true);
    });
});
