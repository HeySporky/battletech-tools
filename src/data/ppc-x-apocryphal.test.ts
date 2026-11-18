import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { equipmentEnergy } from "./equipment-energy";
import { APOCRYPHAL_RULES_LEVEL } from "./rules-level-options";

// PPC-X (#266): a MechWarrior 5 (Solaris Showdown) weapon, Apocryphal. Tabletop line from u/Severe_Ad_5022 with the damage
// set by NGCFells (2026-11-16) to three 5-point groups, a compromise between that line (12) and the game's PPC-X (about 20).

const ppcX = () => {
    const found = equipmentEnergy.find((item) => item.tag === "ppc-x");
    if (!found) throw new Error("no record ppc-x");
    return found;
};

describe("PPC-X (Apocryphal, #266)", () => {
    it("sits at the Apocryphal level, Inner Sphere, sourced to the game", () => {
        expect(ppcX().rulesLevel).toBe(APOCRYPHAL_RULES_LEVEL);
        expect(ppcX().techBase).toBe("is");
        expect(ppcX().book).toMatch(/MechWarrior 5/);
        expect(ppcX().notes).toContain("Solaris Showdown");
    });

    it("credits the Reddit thread's authors as Inspired by, and links the post", () => {
        for (const handle of ["u/Distinct-Duck-7120", "u/Severe_Ad_5022", "u/Omega_Chris_8352"]) expect(ppcX().notes).toContain(handle);
        expect(ppcX().notes).toContain("https://www.reddit.com/r/battletech/comments/1hqnzwy/");
        expect(ppcX().notes).toContain("Inspired by");
    });

    it("7 tons, 3 slots, 10 heat, 0/5/9/12, three 5-point groups for 15, -1 to hit", () => {
        const weapon = ppcX();
        expect(weapon.weight).toBe(7);
        expect(weapon.space.battlemech).toBe(3);
        expect(weapon.heat).toBe(10);
        expect(weapon.range).toMatchObject({ min: 0, short: 5, medium: 9, long: 12 });
        expect(weapon.damageClusters).toBe(3);
        expect(weapon.damagePerCluster).toBe(5);
        expect(weapon.damage).toBe(15);
        expect(weapon.accuracyModifier).toBe(-1);
        expect(weapon.weaponType).toContain("C");
    });

    it("rules: cluster table, groups of 5, the game's ion-separator burst", () => {
        expect(ppcX().rules).toMatch(/cluster/i);
        expect(ppcX().rules).toMatch(/3 column|three/i);
    });

    it("lore says who, why, where and when, and what is NGCFells's", () => {
        const lore = ppcX().lore ?? "";
        for (const part of ["Solaris Arms", "Solaris", "arena", "ion"]) expect(lore, part).toContain(part);
        expect(ppcX().notes).toMatch(/Ours/);
        expect(ppcX().introduced).toBe(3015);
        expect(ppcX().extinct).toBeNull();
    });

    it("a 'Mech carrying it has a finite Battle Value, counts 10 heat and needs the Apocryphal level", () => {
        const build = () => {
            const mech = new BattleMech();
            mech.setTech("is");
            mech.setEra("late-succession-war");
            mech.setTonnage(100);
            mech.setWalkSpeed(3);
            return mech;
        };
        const baseHeat = build().getWeaponHeat();
        const mech = build();
        expect(mech.addEquipmentFromTag("ppc-x", "is", "", false, undefined, "", false, [], undefined, undefined)).toBeTruthy();
        expect(Number.isFinite(mech.getBattleValue())).toBe(true);
        expect(mech.getWeaponHeat() - baseHeat).toBe(10);
        expect(mech.getRequiredRulesLevel()).toBe(APOCRYPHAL_RULES_LEVEL);
    });
});
