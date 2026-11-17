import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { ammoCustom } from "./ammo-custom";
import { canonRecord, reloadableBattleValue, reloadableCost } from "./derived-values";
import { getCompatibleAmmo, getWeaponShotsPerTon } from "./equipment-registry";
import { missileCustom } from "./missile-custom";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

// The Reloading Rocket Launchers: the catalog held rocket ammunition (240 rockets a ton) with no launcher to fire it, so the launchers are ours,
// built from the canon one-shot Rocket Launchers 10, 15 and 20.

const rrl = (size: number) => {
    const found = missileCustom.find((item) => item.tag === `custom-rrl-${size}`);
    if (!found) throw new Error(`no custom-rrl-${size}`);
    return found;
};
const ammo = () => {
    const found = ammoCustom.find((item) => item.tag === "ammo-rocket-launcher-standard");
    if (!found) throw new Error("no rocket ammunition");
    return found;
};

describe("Reloading Rocket Launchers (Custom Homebrew, ours)", () => {
    for (const [size, battleValue, cbills, ammoBattleValue] of [[10, 90, 30000, 11], [15, 115, 60000, 14], [20, 120, 90000, 15]] as const) {
        it(`RRL ${size}: the canon launcher's weight, slots, heat and ranges; BV ${battleValue}, ${cbills} C-Bills, ${240 / size} salvos a ton`, () => {
            const canon = canonRecord(`rocket-launcher-${size}`);
            const item = rrl(size);
            expect(item.rulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
            expect(item.weight).toBe(canon.weight);
            expect(item.space.battlemech).toBe(canon.space.battlemech);
            expect(item.heat).toBe(canon.heat);
            expect(item.range).toEqual(canon.range);
            expect(item.damageClusters).toBe(size);
            expect(item.shotsPerTon).toBe(240 / size);
            expect(item.battleValue).toBe(battleValue);
            expect(item.cbills).toBe(cbills);
            expect(item.ammoBattleValue).toBe(ammoBattleValue);
            expect(reloadableBattleValue(canon.battleValue!)).toBe(battleValue);
            expect(reloadableCost(canon.cbills!)).toBe(cbills);
            expect(item.isOneShot).toBeFalsy();
        });

        it(`RRL ${size}: fires the catalog's rocket ammunition, 240 rockets a ton`, () => {
            expect(item(size).ammoTypes).toContain("ammo-rocket-launcher-standard");
            expect(getCompatibleAmmo(rrl(size), ammo())).toBe(true);
            expect(getWeaponShotsPerTon(rrl(size), ammo())).toBe(240 / size);
        });
    }

    it("a one-shot launcher is a fifth of its reloadable twin in Battle Value and half in cost, across the canon lines", () => {
        for (const [oneShot, twin] of [["srm-2-os", "srm-2"], ["srm-4-os", "srm-4"], ["srm-6-os", "srm-6"], ["streak-srm-6-os", "streak-srm-6"], ["srt-4-os", "srt-4"],
            ["lrm-5-os", "lrm-5"], ["lrm-10-os", "lrm-10"], ["lrm-20-os", "lrm-20"]]) {
            expect(reloadableCost(canonRecord(oneShot).cbills!), oneShot).toBe(canonRecord(twin).cbills);
            expect(Math.abs(reloadableBattleValue(canonRecord(oneShot).battleValue!) - canonRecord(twin).battleValue!), oneShot).toBeLessThanOrEqual(5);
        }
    });

    it("notes, lore and rules say where it comes from, what is ours and how it plays", () => {
        for (const size of [10, 15, 20]) {
            const item = rrl(size);
            expect(item.notes).toContain("ours, not an author's");
            expect(item.notes).toContain("Derived, not given by the author");
            expect(item.notes).toContain(`Rocket Launcher ${size}`);
            expect(item.lore).toContain("Marian Hegemony");
            expect(item.rules).toContain("Cluster Hits Table");
            expect(item.rules).toContain("+1 to hit");
        }
    });

    it("the ammunition is Custom Homebrew, ours, with lore and rules, and its Battle Value 0 is deliberate", () => {
        expect(ammo().rulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(ammo().roundsPerTon).toBe(240);
        expect(ammo().notes).toContain("ours");
        expect(ammo().lore).toBeTruthy();
        expect(ammo().rules).toBeTruthy();
        expect(ammo().battleValue).toBe(0);
        expect(ammo().notes).toContain("Battle Value 0 is deliberate");
    });

    it("a 'Mech carrying one has a finite Battle Value and counts its heat", () => {
        const build = () => {
            const mech = new BattleMech();
            mech.setTech("is");
            mech.setEra("dark-ages");
            mech.setTonnage(100);
            mech.setWalkSpeed(3);
            return mech;
        };
        const baseHeat = build().getWeaponHeat();
        const mech = build();
        expect(mech.addEquipmentFromTag("custom-rrl-10", "custom", "", false, undefined, "", false, [], undefined, undefined)).toBeTruthy();
        expect(Number.isFinite(mech.getBattleValue())).toBe(true);
        expect(mech.getWeaponHeat() - baseHeat).toBe(3);
    });
});

function item(size: number) {
    return rrl(size);
}
