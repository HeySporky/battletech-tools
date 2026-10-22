import { describe, expect, it } from "vitest";
import Vehicle from "../classes/vehicle";
import { ammoCatalog } from "./ammo";
import { getCompatibleAmmo, getEquipmentListByTech, getWeaponShotsPerTon } from "./equipment-registry";
import { ammoApocryphal, artilleryApocryphal } from "./hailstorm-apocryphal";

// Hailstorm artillery (Apocryphal, from MechWarrior 5: Mercenaries and Clans). User rulings 2026-10-22: both tech
// bases; towed only; the other tubes' munitions; 35 damage at 12 mapsheets (the Long Tom does 25 at 30, TO:AUE p.96);
// 25 tons; 4 shots a ton; the Long Tom's dates.
const hailstorm = artilleryApocryphal.find((item) => item.tag === "hailstorm-artillery")!;
const round = (tag: string) => ammoApocryphal.find((item) => item.tag === tag)!;

describe("Hailstorm artillery (Apocryphal)", () => {
    it("is a 35-point tube with 12 mapsheets of reach, 25 tons and 4 shots a ton", () => {
        expect(hailstorm).toMatchObject({
            techBase: "universal", rulesLevel: 5, damage: 35, weight: 25, shotsPerTon: 4,
            prototype: 2445, introduced: 2500, extinct: null, reintroduced: null, weaponType: ["ART"],
        });
        expect(hailstorm.range.maxMapSheets).toBe(12);
    });

    it("costs and counts as the Long Tom does, scaled to its bigger shell", () => {
        // 15,000 C-bills a ton, as the Long Tom and Sniper; Battle Value the Long Tom's 368 x 35/25.
        expect(hailstorm).toMatchObject({ cbills: 375000, battleValue: 515, ammoBattleValue: 52 });
    });

    it("mounts only on a trailer", () => {
        expect(hailstorm.trailerOnly).toBe(true);
        expect(hailstorm.space).toMatchObject({ battlemech: -1, protomech: -1, combatVehicle: -1, supportVehicle: 12 });
        const build = (trailer: boolean) => {
            const vehicle = new Vehicle();
            vehicle.setMotiveType("wheeled");
            vehicle.setSupportVehicle(true);
            vehicle.setHasTurret(false);
            vehicle.setTonnage(40);
            if (trailer) vehicle.setSupportVehicleChassisModification("trailer", true);
            return vehicle.getAvailableEquipment(false, 5).find((item) => item.tag === "hailstorm-artillery");
        };
        expect(build(true)?.available).toBe(true);
        expect(build(false)?.available).toBe(false);
    });

    it("fires every munition the other tubes share, in its own caliber", () => {
        for (const munition of ["standard", "cluster", "fae", "fascam", "flechette", "illumination", "smoke", "thunder"]) {
            const longTom = ammoCatalog.find((item) => item.tag.replace(/^ammo-(is|clan)-/, "ammo-") === `ammo-long-tom-${munition}`)!;
            const tag = longTom.tag.replace("long-tom", "hailstorm");
            expect(round(tag), tag).toBeDefined();
            expect(round(tag).techBase).toBe(longTom.techBase);
            expect(getCompatibleAmmo(hailstorm, round(tag))).toBe(true);
        }
        expect(round("ammo-is-hailstorm-copperhead").techBase).toBe("is");
        expect(round("ammo-clan-hailstorm-copperhead").techBase).toBe("clan");
        expect(getCompatibleAmmo(hailstorm, ammoCatalog.find((item) => item.tag === "ammo-long-tom-standard")!)).toBe(false);
    });

    it("loads 4 standard rounds a ton at 52 Battle Value and 11,200 C-bills", () => {
        const standard = round("ammo-hailstorm-standard");
        expect(getWeaponShotsPerTon(hailstorm, standard)).toBe(4);
        expect(standard).toMatchObject({ rulesLevel: 5, battleValue: 52, cbills: 11200, roundsPerTon: 4, explosive: true });
    });

    it("joins both tech lists", () => {
        expect(getEquipmentListByTech("is").some((item) => item.tag === "hailstorm-artillery")).toBe(true);
        expect(getEquipmentListByTech("clan").some((item) => item.tag === "ammo-clan-hailstorm-copperhead")).toBe(true);
    });
});
