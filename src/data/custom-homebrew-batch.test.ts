import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { getEquipmentCatalogById, getEquipmentCatalogDefinitions, getEquipmentCatalogs } from "./equipment-registry";
import { energyCustom } from "./energy-custom";
import { miscCustom } from "./misc-custom";
import { ammoCustom } from "./ammo-custom";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

// Custom Homebrew batch, chunk 3: the Pile Bunker (u/FweeCom, #250) and the Omni-Laser (u/heavyarmormecha, #253).

const PILE_LINK = "https://www.reddit.com/r/battletech/comments/1dak8pu/homebrew_equipment_pile_bunker/";
const OMNI_LINK = "https://www.reddit.com/r/battletech/comments/1n30c2j/custom_weapons_omnilaser/";

const find = (list: { tag: string }[], tag: string) => {
    const found = list.find((item) => item.tag === tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found as (typeof miscCustom)[number];
};

const pile = () => find(miscCustom, "custom-pile-bunker");
const pileAmmo = () => find(ammoCustom, "ammo-custom-pile-bunker-standard");
const omni = () => find(energyCustom, "custom-omni-laser");

describe("Pile Bunker and Omni-Laser (Custom Homebrew)", () => {
    it("each tag is in its custom catalog and in no canon catalog", () => {
        const definitions = getEquipmentCatalogDefinitions();
        const canonLists = Object.values(getEquipmentCatalogs());
        for (const tag of ["custom-pile-bunker", "ammo-custom-pile-bunker-standard", "custom-omni-laser"]) {
            const holders = definitions.filter((d) => getEquipmentCatalogById(d.id)?.some((item) => item.tag === tag));
            expect(holders.length, tag).toBe(1);
            expect(holders[0].custom, `${tag} in ${holders[0].id}`).toBe(true);
            expect(canonLists.some((list) => list.some((item) => item.tag === tag)), tag).toBe(false);
        }
    });

    it("sit at Custom Homebrew and credit the author with the post's link", () => {
        expect(pile().rulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(pileAmmo().rulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(omni().rulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        for (const item of [pile(), pileAmmo()]) {
            expect(item.notes).toContain("u/FweeCom");
            expect(item.notes).toContain(PILE_LINK);
            expect(item.notes).toContain("Inspired by");
        }
        expect(omni().notes).toContain("u/heavyarmormecha");
        expect(omni().notes).toContain(OMNI_LINK);
        expect(omni().notes).toContain("Inspired by");
    });

    it("Pile Bunker: 5 tons, 5 slots, 15 damage, 2 heat; ammunition 3 shots a ton, explosive", () => {
        const bunker = pile();
        expect(bunker.weight).toBe(5);
        expect(bunker.space.battlemech).toBe(5);
        expect(bunker.damage).toBe(15);
        expect(bunker.heat).toBe(2);
        expect(bunker.ammoTypes).toContain("ammo-custom-pile-bunker-standard");
        expect(bunker.shotsPerTon).toBe(3);
        const ammo = pileAmmo() as unknown as { roundsPerTon: number; explosive: boolean };
        expect(ammo.roundsPerTon).toBe(3);
        expect(ammo.explosive).toBe(true);
        // The author did not give a cost or a Battle Value: derived (derived-cost-and-bv.test.ts).
        expect(bunker.cbills).toBe(25000);
        expect(bunker.battleValue).toBe(19);
        expect(bunker.notes).toMatch(/not given|unverified/i);
    });

    it("Omni-Laser: Inner Sphere, 3150, 10 tons, 4 slots, 6/12/18, heat 20, damage 16", () => {
        const laser = omni();
        expect(laser.techBase).toBe("is");
        expect(laser.introduced).toBe(3150);
        expect(laser.weight).toBe(10);
        expect(laser.space.battlemech).toBe(4);
        expect(laser.range).toMatchObject({ short: 6, medium: 12, long: 18 });
        expect(laser.heat).toBe(20);
        expect(laser.damage).toBe(16);
        expect(laser.battleValue).toBe(288);
        expect(laser.cbills).toBe(377000);
        for (const mode of ["Focus", "Pulse", "Dazzler"]) expect(laser.notes).toContain(mode);
    });

    it("a 'Mech carrying each item has a finite Battle Value and counts the weapon's heat", () => {
        const build = () => {
            const mech = new BattleMech();
            mech.setTech("is");
            mech.setEra("dark-ages");
            mech.setTonnage(100);
            mech.setWalkSpeed(3);
            return mech;
        };
        const add = (mech: BattleMech, tag: string) => mech.addEquipmentFromTag(tag, "custom", "", false, undefined, "", false, [], undefined, undefined);
        const baseline = build();
        const baseHeat = baseline.getWeaponHeat();
        for (const [tag, heat] of [["custom-pile-bunker", 2], ["custom-omni-laser", 20]] as const) {
            const mech = build();
            expect(add(mech, tag), tag).toBeTruthy();
            expect(Number.isFinite(mech.getBattleValue())).toBe(true);
            expect(mech.getWeaponHeat() - baseHeat, tag).toBe(heat);
            expect(mech.getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        }
    });
});
