import { describe, expect, it } from "vitest";
import { getAmmoDamagePerShot, getAmmoExplosion, getAmmoExplosionRules, getHeatAmmoExplosion } from "./ammo-explosion";
import { IEquipmentItem } from "./data-interfaces";

const ac20 = { name: "AC/20", damage: 20 } as IEquipmentItem;
const ac10 = { name: "AC/10", damage: 10 } as IEquipmentItem;
const lrm20 = { name: "LRM 20", damageClusters: 20, damagePerCluster: 1 } as IEquipmentItem;
const bin = (shots: number, explosive = true) => ({ isAmmo: true, explosive, currentAmmo: shots }) as IEquipmentItem;
const weaponFor = (weapon: IEquipmentItem | undefined) => () => weapon;
const shots = (item: IEquipmentItem) => item.currentAmmo ?? 0;
const explode = (edition: string, type: Parameters<typeof getAmmoExplosion>[1], bins: IEquipmentItem[], weapon: IEquipmentItem | undefined, protection?: "none" | "case" | "case-ii") =>
    getAmmoExplosion(edition, type, bins, weaponFor(weapon), shots, protection);

describe("ammunition explosion rules", () => {
    it("explodes the bin hit on a Total Warfare 'Mech, the MechWarrior taking 2 (TW p.125)", () => {
        expect(getAmmoExplosionRules("total-warfare", "mech")).toMatchObject({ scope: "bin", pilotDamage: 2 });
    });

    it("explodes all the ammunition aboard a vehicle or in a building hex, hurting no pilot", () => {
        expect(getAmmoExplosionRules("total-warfare", "vehicle")).toMatchObject({ scope: "all", pilotDamage: 0 });
        expect(getAmmoExplosionRules("total-warfare", "building")).toMatchObject({ scope: "all", pilotDamage: 0 });
    });

    it("injures a fighter or small craft pilot 1 point (TW p.161)", () => {
        expect(getAmmoExplosionRules("total-warfare", "fighter")).toMatchObject({ scope: "bin", pilotDamage: 1 });
        expect(getAmmoExplosionRules("total-warfare", "small-craft")).toMatchObject({ scope: "bin", pilotDamage: 1 });
    });

    it("gives the Core Rulebook MechWarrior 1 hit (CRB p.107)", () => {
        expect(getAmmoExplosionRules("core-rulebook", "mech")).toMatchObject({ pilotDamage: 1 });
    });

    it("falls back to Total Warfare for an edition with no record of its own", () => {
        expect(getAmmoExplosionRules("battlemech-manual", "mech")).toBe(getAmmoExplosionRules("total-warfare", "mech"));
        expect(getAmmoExplosionRules("core-rulebook", "building")).toBe(getAmmoExplosionRules("total-warfare", "building"));
        expect(getAmmoExplosionRules(undefined, "vehicle")).toBe(getAmmoExplosionRules("total-warfare", "vehicle"));
    });

    it("has no ruling, so no explosion, for infantry", () => {
        expect(getAmmoExplosionRules("total-warfare", "infantry")).toBeUndefined();
        expect(explode("total-warfare", "infantry", [bin(5)], ac20)).toBeUndefined();
    });

    it("gives every earlier edition a 'Mech record of its own, the MechWarrior taking 2", () => {
        const scopes = {
            battledroids: "bin", "battletech-2nd-edition": "location", "battletech-manual": "location", "battletech-compendium": "location",
            "battletech-3rd-edition": "location", "compendium-rules-of-warfare": "location", "battletech-4th-edition": "location",
            "master-rules": "bin", "master-rules-revised": "bin", "classic-battletech-box-set": "bin",
        };
        for (const [edition, scope] of Object.entries(scopes)) {
            expect(getAmmoExplosionRules(edition, "mech")).toMatchObject({ scope, pilotDamage: 2 });
            expect(getAmmoExplosionRules(edition, "mech")).not.toBe(getAmmoExplosionRules("total-warfare", "mech"));
        }
        // Battledroids explodes ammunition by heat only (BD pp.13, 19).
        expect(getAmmoExplosionRules("battledroids", "mech")?.heatOnly).toBe(true);
    });

    it("destroys a vehicle outright in every edition before Total Warfare (CT p.30 to BMR(R) p.58)", () => {
        for (const edition of ["citytech", "citytech-2nd-edition", "battletech-manual", "battletech-compendium", "compendium-rules-of-warfare", "master-rules", "master-rules-revised"]) {
            expect(getAmmoExplosionRules(edition, "vehicle")).toMatchObject({ scope: "all", destroysUnit: true });
        }
        expect(getAmmoExplosionRules("total-warfare", "vehicle")?.destroysUnit).toBeUndefined();
    });

    it("has no ruling for a ProtoMech, whose crits never hit ammunition and which tracks no heat (TW p.186, BMR p.55, TM p.86)", () => {
        for (const edition of ["total-warfare", "master-rules-revised"]) {
            expect(getAmmoExplosionRules(edition, "protomech")).toBeUndefined();
            expect(explode(edition, "protomech", [bin(5)], ac20)).toBeUndefined();
        }
    });
});

describe("ammunition explosion damage", () => {
    it("is one shot's Damage Value, counting every missile", () => {
        expect(getAmmoDamagePerShot(ac20)).toBe(20);
        expect(getAmmoDamagePerShot(lrm20)).toBe(20);
        expect(getAmmoDamagePerShot({ damage: { short: 4 } } as unknown as IEquipmentItem)).toBe(4);
    });

    it("totals the shots left in each explosive bin, skipping spent, inert and unfed ones", () => {
        expect(explode("total-warfare", "mech", [bin(5)], ac20)).toMatchObject({ baseDamage: 100, damage: 100 });
        expect(explode("total-warfare", "vehicle", [bin(2), bin(3), bin(0), bin(9, false)], ac20)?.damage).toBe(100);
        expect(explode("total-warfare", "mech", [bin(5)], undefined)?.damage).toBe(0);
    });

    it("lets CASE vent a Total Warfare 'Mech's excess, but only 1 point past CASE II (TW p.125, TO:AUE p.111)", () => {
        expect(explode("total-warfare", "mech", [bin(5)], ac20, "case")?.damage).toBe(100);
        expect(explode("total-warfare", "mech", [bin(5)], ac20, "case-ii")).toMatchObject({ baseDamage: 100, damage: 1 });
    });

    it("caps a Core Rulebook 'Mech's structure damage at 20 / 10 / 1 (CRB p.96)", () => {
        expect(explode("core-rulebook", "mech", [bin(5)], ac20)).toMatchObject({ baseDamage: 100, damage: 20 });
        expect(explode("core-rulebook", "mech", [bin(5)], ac20, "case")?.damage).toBe(10);
        expect(explode("core-rulebook", "mech", [bin(5)], ac20, "case-ii")?.damage).toBe(1);
        expect(explode("core-rulebook", "mech", [bin(1)], ac10)?.damage).toBe(10);
    });

    it("divides a fighter's damage by 10, by 20 with CASE, at least 1, and to 1 with CASE II (TW p.161)", () => {
        expect(explode("total-warfare", "fighter", [bin(10)], ac10)?.damage).toBe(10);
        expect(explode("total-warfare", "fighter", [bin(10)], ac10, "case")?.damage).toBe(5);
        expect(explode("total-warfare", "fighter", [bin(10)], ac10, "case-ii")?.damage).toBe(1);
        expect(explode("total-warfare", "fighter", [bin(1)], { damage: 5 } as IEquipmentItem)?.damage).toBe(1);
        expect(explode("total-warfare", "small-craft", [bin(6)], lrm20)?.damage).toBe(12);
    });

    it("divides a building hex's damage by 10 with CASE, rounding down, with no minimum (TO:AR p.118)", () => {
        expect(explode("total-warfare", "building", [bin(5)], ac20)?.damage).toBe(100);
        expect(explode("total-warfare", "building", [bin(5)], ac20, "case")).toMatchObject({ baseDamage: 100, damage: 10 });
        expect(explode("total-warfare", "building", [bin(1)], { damage: 5 } as IEquipmentItem, "case")?.damage).toBe(0);
    });

    it("counts an extended fuel tank as 40 a ton (TM p.244) and battle-armor-scale ammo by weight left (GoO p.54)", () => {
        const tank = { variableFormula: "extended-fuel-tank", weight: 2 } as IEquipmentItem;
        const baScale = { isAmmo: true, explosive: true, battleArmorScale: true, kgPerShot: 125, currentAmmo: 2 } as IEquipmentItem;
        expect(explode("total-warfare", "vehicle", [tank, baScale], ac20)?.damage).toBe(100);
    });

    it("sends an AeroTech 2 fighter's full damage to the SI, but one shot's with CASE (AT2 p.13, AT2R p.21)", () => {
        for (const edition of ["aerotech-2", "aerotech-2-revised"]) {
            expect(explode(edition, "fighter", [bin(10)], ac10)).toMatchObject({ baseDamage: 100, damage: 100 });
            expect(explode(edition, "fighter", [bin(10)], ac10, "case")?.damage).toBe(10);
            expect(explode(edition, "small-craft", [bin(6)], lrm20)?.damage).toBe(120);
        }
    });

    it("logs the pilot's damage with the rule's citation", () => {
        expect(explode("total-warfare", "mech", [bin(5)], ac20)?.log).toEqual(["The MechWarrior takes 2 damage (TW p.125, TO:AUE p.111)"]);
        expect(explode("total-warfare", "fighter", [bin(5)], ac20)?.log).toEqual(["The pilot takes 1 damage (TW p.161, TO:AUE p.111)"]);
        expect(explode("total-warfare", "vehicle", [bin(5)], ac20)?.log).toEqual([]);
    });
});

describe("heat-triggered ammunition explosion (TW p.161)", () => {
    const mg = { name: "Machine Gun", damage: 2 } as IEquipmentItem;
    const fed = (bins: [IEquipmentItem, IEquipmentItem][]) => (item: IEquipmentItem) => bins.find(([candidate]) => candidate === item)?.[1];

    it("explodes the most destructive ammunition per shot, and the rest of that weapon's ammunition goes with it", () => {
        const mgBin = bin(200), ac10First = bin(10), ac10Second = bin(10);
        const weapons = fed([[mgBin, mg], [ac10First, ac10], [ac10Second, ac10]]);
        const explosion = getHeatAmmoExplosion("total-warfare", "fighter", [mgBin, ac10First, ac10Second], weapons, shots);
        expect(explosion).toMatchObject({ bin: ac10First, damage: 10 });
        expect(explosion?.spent).toEqual([ac10First, ac10Second]);
    });

    it("explodes all of that weapon's ammunition at full force in AeroTech (AT p.26, BTM p.71, BTC p.100)", () => {
        const mgBin = bin(200), ac10First = bin(10), ac10Second = bin(4);
        const weapons = fed([[mgBin, mg], [ac10First, ac10], [ac10Second, ac10]]);
        for (const edition of ["aerotech", "battletech-manual", "battletech-compendium"]) {
            const explosion = getHeatAmmoExplosion(edition, "fighter", [mgBin, ac10First, ac10Second], weapons, shots);
            expect(explosion).toMatchObject({ bin: ac10First, damage: 140 });
            expect(explosion?.spent).toEqual([ac10First, ac10Second]);
        }
    });

    it("skips spent and inert bins, such as Gauss ammunition, and finds nothing when none is left", () => {
        const gaussBin = bin(8, false), mgBin = bin(200), spentBin = bin(0);
        const weapons = fed([[gaussBin, { damage: 15 } as IEquipmentItem], [mgBin, mg], [spentBin, ac10]]);
        expect(getHeatAmmoExplosion("total-warfare", "fighter", [gaussBin, mgBin, spentBin], weapons, shots)?.bin).toBe(mgBin);
        expect(getHeatAmmoExplosion("total-warfare", "fighter", [gaussBin, spentBin], weapons, shots)).toBeUndefined();
    });
});
