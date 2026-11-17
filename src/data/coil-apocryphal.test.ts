import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { coilBattleValue, coilMultiplier, movementModifierForHexes } from "./derived-values";
import { equipmentEnergy } from "./equipment-energy";
import { getEquipmentRulesLevel } from "./equipment-registry";
import { energyCustom } from "./energy-custom";
import { APOCRYPHAL_RULES_LEVEL } from "./rules-level-options";

// The COIL weapons: BATTLETECH (Heavy Metal) video game weapons, Apocryphal, at DevianID's tabletop Final Stats ("A Hare-Brained Weapon",
// battletech.com forums, 7 December 2020). The catalog held the game's own numbers (meters, five times the damage) at the Standard level.

const coil = (tag: string) => {
    const found = equipmentEnergy.find((item) => item.tag === tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found;
};

const FINAL_STATS: [string, string, number, number, number, number, number, number, number][] = [
    // tag, name, weight, slots, damage, heat, short, medium, long
    ["coil_s", "COIL-S", 2, 4, 3, 2, 1, 2, 3],
    ["coil_m", "COIL-M", 3, 6, 5, 4, 3, 6, 9],
    ["coil_l", "COIL-L", 4, 8, 7, 9, 5, 10, 15],
];

describe("COIL weapons (Apocryphal)", () => {
    for (const [tag, name, weight, slots, damage, heat, short, medium, long] of FINAL_STATS) {
        it(`${name}: ${weight} tons, ${slots} slots, damage ${damage}, heat ${heat}, ranges in hexes 0/${short}/${medium}/${long}`, () => {
            const item = coil(tag);
            expect(item.name).toBe(name);
            expect(item.weight).toBe(weight);
            expect(item.space.battlemech).toBe(slots);
            expect(item.damage).toBe(damage);
            expect(item.heat).toBe(heat);
            expect(item.range).toEqual({ min: 0, short, medium, long });
            expect(item.explosive).toBe(true);
            expect(item.accuracyModifier).toBe(1);
        });
    }

    it("sits at the Apocryphal level, not Standard, and is in no custom list", () => {
        for (const [tag] of FINAL_STATS) {
            expect(coil(tag).rulesLevel).toBe(APOCRYPHAL_RULES_LEVEL);
            expect(getEquipmentRulesLevel(coil(tag))).toBe(APOCRYPHAL_RULES_LEVEL);
            expect(energyCustom.some((item) => item.tag === tag)).toBe(false);
        }
    });

    it("credits the game, the forum thread and its authors; says what is ours", () => {
        for (const [tag] of FINAL_STATS) {
            const notes = coil(tag).notes!;
            for (const text of ["Contained Overflow Inertia Linkage", "Heavy Metal", "DevianID", "Speedbump", "namar13766", "Inspired by",
                "https://battletech.com/forums/index.php?topic=71729.0", "https://www.sarna.net/wiki/Coil-M", "Ours, not in the thread"]) {
                expect(notes, `${tag} ${text}`).toContain(text);
            }
        }
    });

    it("lore and rules: the movement multiplier, the jump rule, the explosion, the Herakleion", () => {
        for (const [tag] of FINAL_STATS) {
            expect(coil(tag).lore).toContain("Contained Overflow Inertia Linkage");
            expect(coil(tag).lore).toContain("Herakleion");
            expect(coil(tag).rules).toMatch(/movement modifier/);
            expect(coil(tag).rules).toMatch(/jumped/);
            expect(coil(tag).rules).toMatch(/explosion/);
        }
    });

    it("the movement modifier table and the multiplier (over +1 only)", () => {
        expect([0, 2, 3, 4, 5, 6, 7, 9, 10, 17, 18, 24, 25].map(movementModifierForHexes)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6]);
        expect([0, 4, 5, 8, 12].map(coilMultiplier)).toEqual([1, 1, 2, 3, 4]);
        expect(coilBattleValue(7, 15, 6)).toBe(210);
    });

    it("Battle Value follows the 'Mech's running speed (a walk of 4 runs 6: +2, twice the base)", () => {
        const build = (walk: number) => {
            const mech = new BattleMech();
            mech.setTech("is");
            mech.setEra("dark-ages");
            mech.setTonnage(50);
            mech.setWalkSpeed(walk);
            return mech;
        };
        const sized = (tag: string, walk: number) => {
            const mech = build(walk);
            expect(mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined), tag).toBeTruthy();
            expect(mech.getBVRunSpeed()).toBe(Math.ceil(walk * 1.5));
            return mech.getInstalledEquipment().find((item) => item.tag === tag)!;
        };
        expect(sized("coil_l", 4).battleValue).toBe(210);
        expect(sized("coil_m", 4).battleValue).toBe(90);
        expect(sized("coil_s", 4).battleValue).toBe(18);
        // Walk 2 runs 3: modifier +1, no bonus: the base figure.
        expect(sized("coil_l", 2).battleValue).toBe(105);
        // Walk 6 runs 9: +3.
        expect(sized("coil_l", 6).battleValue).toBe(315);
        expect(Number.isFinite(build(4).getBattleValue())).toBe(true);
    });
});
