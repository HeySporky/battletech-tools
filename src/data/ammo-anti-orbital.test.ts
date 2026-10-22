import { describe, expect, it } from "vitest";
import { ammoCustom } from "./ammo-custom";
import { IEquipmentItem } from "./data-interfaces";
import { getCompatibleAmmo, getEquipmentRulesLevel, getWeaponShotsPerTon } from "./equipment-registry";
import { equipmentArtillery } from "./equipment-artillery";

// Anti-orbital Long Tom rounds (beta feedback item 9): requested on the Star League Discord by SmilingNid, with ideas
// from Vehrec, Arkaxe and Ryan DesCastris. User rulings 2026-10-22: Custom rules level; the Long Tom's 25 damage (TO:AUE
// p.96) at capital scale is 2.5, rounded down (2); half the standard round's 5 shots a ton, rounded up (3); built in; tech rating E as Copperhead;
// 60,000 C-bills a ton; developed by the Federated Suns after Smoke Jaguars razed Edo from orbit (7 May 3050,
// Era Report: 3052), prototype 3055, introduced 3062, Inner Sphere only.
describe("anti-orbital Long Tom ammunition", () => {
    const round = ammoCustom.find((item) => item.tag === "ammo-is-long-tom-anti-orbital") as IEquipmentItem;
    const longTom = equipmentArtillery.find((item) => item.tag === "long-tom-artillery") as IEquipmentItem;

    it("is a Custom special round for the Long Tom", () => {
        expect(round).toMatchObject({ isAmmo: true, isSpecialAmmo: true, catalog: "custom", rulesLevel: 6, book: "Custom", page: 0, weight: 1, explosive: true, techRating: "e", cbills: 60000 });
        expect(getEquipmentRulesLevel(round)).toBe(6);
        expect(getCompatibleAmmo(longTom, round)).toBe(true);
    });

    it("is a Federated Suns development of the Clan Invasion, in service before the Jihad", () => {
        expect(round).toMatchObject({ techBase: "is", prototype: 3055, introduced: 3062, extinct: null, reintroduced: null });
    });

    it("is worth the standard round's Battle Value per shot: 46 for 5 shots, so 28 for 3", () => {
        expect(round.battleValue).toBe(28);
    });

    it("loads 3 shots a ton", () => {
        expect(getWeaponShotsPerTon(longTom, round)).toBe(3);
    });

    it("does 2 points of capital-scale damage in a surface-to-orbit attack, and credits the people who asked for it", () => {
        expect(round.damage).toBe(2);
        for (const phrase of ["capital-scale", "surface-to-orbit", "Strategic Operations", "SmilingNid", "Star League Discord"]) {
            expect(round.notes).toContain(phrase);
        }
    });
});
