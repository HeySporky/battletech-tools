import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { ammoCatalog } from "./ammo";
import { ammoCustom } from "./ammo-custom";
import { artilleryCustom } from "./artillery-custom";
import { ballisticCustom } from "./ballistic-custom";
import { IEquipmentItem } from "./data-interfaces";
import { energyCustom } from "./energy-custom";
import { getCompatibleAmmo, getEquipmentRulesLevel, getWeaponShotsPerTon } from "./equipment-registry";
import { mechCustomArmorTypes } from "./mech-custom-armor-types";
import { miscCustom } from "./misc-custom";
import { missileCustom } from "./missile-custom";
import { CUSTOM_HOMEBREW_RULES_LEVEL, MUNCHKIN_RULES_LEVEL } from "./rules-level-options";
import { sizeVariableEquipment } from "./variable-equipment";

// Solaris7 forum equipment (#301). Balance rulings: the IS Heavy Laser trades with the Heavy PPC and Binary Laser Cannon,
// so it is Custom Homebrew; both railguns and the nanotube armor outclass every canon item of their kind, so Munchkin.
const find = (list: { tag: string }[], tag: string) => {
    const found = list.find((item) => item.tag === tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found;
};

describe("Solaris7 forum equipment (#301)", () => {
    it("IS Heavy Laser (Captain): 9 tons, 5 slots, 16 damage, 16 heat, 5/10/15, Custom Homebrew", () => {
        const laser = find(energyCustom, "custom-is-heavy-laser-solaris7") as typeof energyCustom[number];
        expect(laser).toMatchObject({ techBase: "is", catalog: "custom", weight: 9, damage: 16, heat: 16, accuracyModifier: 0, explosive: true });
        expect(laser.range).toEqual({ min: 0, short: 5, medium: 10, long: 15 });
        expect(laser.space.battlemech).toBe(5);
        expect(getEquipmentRulesLevel(laser)).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(laser.notes).toContain("25 damage to the location");
        // Not printed: the Binary Laser Cannon's (TO:AUE p.131) cost, dates and tech rating; BV scaled from its 18.5 a point.
        expect(laser).toMatchObject({ cbills: 200000, battleValue: 296, introduced: 3077, techRating: "d" });
        expect(laser.book).toBe("http://solaris7.com/thread/lostech-custom-weapons/");
    });

    it("Railgun (Nightstalker666): 20 tons, 8 slots, 25 damage, 12 heat, 16 shots a ton, Munchkin", () => {
        const gun = find(ballisticCustom, "custom-railgun-nightstalker666") as typeof ballisticCustom[number];
        const ammo = find(ammoCustom, "ammo-custom-railgun-nightstalker666-standard") as typeof ammoCustom[number];
        expect(gun).toMatchObject({ weight: 20, damage: 25, heat: 12, cbills: 2500000, battleValue: 660 });
        expect(gun.range).toEqual({ min: 6, short: 12, medium: 25, long: 39, extreme: 50 });
        expect(gun.space.battlemech).toBe(8);
        expect(ammo).toMatchObject({ roundsPerTon: 16, cbills: 400000, battleValue: 83, explosive: true });
        expect(getCompatibleAmmo(gun, ammo)).toBe(true);
        expect(getWeaponShotsPerTon(gun, ammo)).toBe(16);
        expect(getEquipmentRulesLevel(gun)).toBe(MUNCHKIN_RULES_LEVEL);
        expect(getEquipmentRulesLevel(ammo)).toBe(MUNCHKIN_RULES_LEVEL);
        expect(gun.notes).toContain("armor-piercing");
    });

    it("Railgun (Captain): 30 tons, 22 slots taking one whole side, 50 damage, 2 shots a ton, Munchkin", () => {
        const gun = find(ballisticCustom, "custom-railgun-captain") as typeof ballisticCustom[number];
        const ammo = find(ammoCustom, "ammo-custom-railgun-captain-standard") as typeof ammoCustom[number];
        expect(gun).toMatchObject({ weight: 30, damage: 50, heat: 5, explosive: true, spreadSlots: true, spreadLocations: "one-side" });
        expect(gun.range).toEqual({ min: 10, short: 11, medium: 22, long: 33 });
        expect(gun.space).toMatchObject({ battlemech: 22, protomech: -1, combatVehicle: 1, supportVehicle: 22, aerospaceFighter: 1 });
        expect(ammo).toMatchObject({ roundsPerTon: 2, battleValue: 154 });
        expect(gun.battleValue).toBe(1230);
        expect(getWeaponShotsPerTon(gun, ammo)).toBe(2);
        expect(getEquipmentRulesLevel(gun)).toBe(MUNCHKIN_RULES_LEVEL);
        expect(gun.notes).toContain("60-point");

        // The whole side (user ruling 2026-11-02): all 12 slots of a side torso and the 10 its arm has left without the
        // lower arm and hand actuators. Never the center torso, and never both sides.
        const mech = new BattleMech();
        mech.setTonnage(100);
        mech.setWalkSpeed(3);
        mech.removeLowerArmActuator("la");
        expect(mech.addEquipmentFromTag("custom-railgun-captain", "is", "", false, undefined, "", false, [], undefined, undefined, -1, "", true)).not.toBeNull();
        const criticals = mech.getCriticals() as unknown as Record<string, ({ tag?: string } | null)[]>;
        const area: Record<string, string> = { ct: "centerTorso", lt: "leftTorso", rt: "rightTorso", la: "leftArm", ra: "rightArm" };
        const place = (loc: string) => {
            const index = mech.unallocatedCriticals.findIndex((slot) => slot?.tag === "custom-railgun-captain");
            return mech.moveCritical("un", index, loc, criticals[area[loc]].findIndex((slot) => !slot));
        };
        expect(place("ct")).toBe(false);
        for (let slot = 0; slot < 12; slot++) expect(place("lt")).toBe(true);
        expect(place("rt")).toBe(false);
        expect(place("ra")).toBe(false);
        for (let slot = 0; slot < 10; slot++) expect(place("la")).toBe(true);
        expect(mech.unallocatedCriticals.filter((slot) => slot?.tag === "custom-railgun-captain")).toEqual([]);
        expect(mech.getChassisEquipmentViolations().filter((text) => text.includes("Railgun"))).toEqual([]);
    });

    it("Nanotube armor: 24 points a ton, no slots, 75,000 C-bills a ton, Munchkin, and a 'Mech using it needs Munchkin", () => {
        const armor = find(mechCustomArmorTypes, "custom-nanotube-armor") as typeof mechCustomArmorTypes[number];
        expect(armor.armorMultiplier).toEqual({ is: 24, clan: 24 });
        expect(armor.crits).toEqual({ is: 0, clan: 0 });
        expect(armor.costMultiplier).toBe(75000);
        expect(armor.rulesLevel).toBe(MUNCHKIN_RULES_LEVEL);
        expect(armor.unitTypes.battlemech).toBe(true);
        expect(armor.unitTypes.combatVehicle).toBe(false);

        const mech = new BattleMech();
        expect(mech.getRequiredRulesLevel()).toBeLessThan(MUNCHKIN_RULES_LEVEL);
        mech.setArmorType("custom-nanotube-armor");
        expect(mech.getRequiredRulesLevel()).toBe(MUNCHKIN_RULES_LEVEL);
    });
});

// Idea threads (#301, user ruling 2026-11-02: build what the posts give enough for, as with the anti-orbital Long Tom
// ammunition): the thread's own numbers, anything unprinted from the nearest canon item, named in the notes.
describe("Solaris7 forum idea equipment (#301)", () => {
    const all = [...ballisticCustom, ...energyCustom, ...missileCustom, ...miscCustom, ...artilleryCustom, ...ammoCustom, ...ammoCatalog];
    const get = (tag: string) => find(all, tag) as IEquipmentItem;

    it("Light AC/10 and AC/20 (Prince, Lycaon): 8 and 10 tons, laser-like ranges, their own ammunition, Custom Homebrew", () => {
        const lac10 = get("custom-light-ac-10"), lac20 = get("custom-light-ac-20");
        expect(lac10).toMatchObject({ weight: 8, damage: 10, heat: 3, shotsPerTon: 10, battleValue: 89 });
        expect(lac10.range).toEqual({ min: 0, short: 3, medium: 6, long: 9 });
        expect(lac20).toMatchObject({ weight: 10, damage: 20, heat: 7, shotsPerTon: 5, battleValue: 160 });
        expect(lac20.range).toEqual({ min: 0, short: 2, medium: 4, long: 6 });
        expect(getCompatibleAmmo(lac10, get("ammo-custom-light-ac-10-standard"))).toBe(true);
        expect(getCompatibleAmmo(lac20, get("ammo-custom-light-ac-20-standard"))).toBe(true);
        expect(getWeaponShotsPerTon(lac20, get("ammo-custom-light-ac-20-standard"))).toBe(5);
        expect([lac10, lac20].map(getEquipmentRulesLevel)).toEqual([CUSTOM_HOMEBREW_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL]);
    });

    it("ER-iNarc (Lycaon, after Thunder's Gauss Narc): 10 tons, 6 slots, minimum range 3, fires every iNarc pod", () => {
        const launcher = get("custom-er-inarc");
        expect(launcher).toMatchObject({ weight: 10, shotsPerTon: 4, battleValue: 111 });
        expect(launcher.space.battlemech).toBe(6);
        expect(launcher.range).toEqual({ min: 3, short: 7, medium: 14, long: 27 });
        expect(getCompatibleAmmo(launcher, get("ammo-is-inarc-standard"))).toBe(true);
        expect(getCompatibleAmmo(launcher, get("ammo-is-inarc-haywire"))).toBe(true);
        expect(getEquipmentRulesLevel(launcher)).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("Rotary Small Chemical Laser (Lonely Coyote): 5 tons, 2 slots, rotary fire from small chemical laser ammunition", () => {
        const laser = get("custom-rotary-small-chemical-laser");
        expect(laser).toMatchObject({ techBase: "clan", weight: 5, damage: 3, heat: 1, isRotary: true, battleValue: 25 });
        expect(laser.space.battlemech).toBe(2);
        expect(getCompatibleAmmo(laser, get("ammo-clan-small-chemical-laser-standard"))).toBe(true);
        expect(getEquipmentRulesLevel(laser)).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("Light Chemical Laser (IS, Prince): 15 tons, 10 slots, no heat, 5 shots a ton, explosive ammunition", () => {
        const laser = get("custom-is-light-chemical-laser");
        const ammo = get("ammo-custom-is-light-chemical-laser-standard");
        expect(laser).toMatchObject({ techBase: "is", weight: 15, damage: 10, heat: 0, shotsPerTon: 5, battleValue: 123 });
        expect(laser.space.battlemech).toBe(10);
        expect(ammo).toMatchObject({ roundsPerTon: 5, explosive: true, battleValue: 15 });
        expect(getCompatibleAmmo(laser, ammo)).toBe(true);
        expect(laser.notes).toContain("critical");
        expect(getEquipmentRulesLevel(laser)).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("Laser Arrays (Thunder's Megaton Cannon, Prince's bracket): link up to four of one laser like a Machine Gun Array", () => {
        const small = get("custom-small-laser-array"), medium = get("custom-medium-laser-array");
        expect(small).toMatchObject({ weight: 0.5, damage: 3, linkedWeaponTags: ["small-laser"] });
        expect(medium).toMatchObject({ weight: 1, damage: 5, linkedWeaponTags: ["medium-laser"] });
        expect([small, medium].map((item) => item.space.battlemech)).toEqual([1, 1]);
        expect(getEquipmentRulesLevel(medium)).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("'Mech Periscope (Thunder) and Chaff Pod 2.0 (Prince): 1 ton and 1 slot each", () => {
        const periscope = get("custom-mech-periscope"), chaff = get("custom-chaff-pod-2");
        expect(periscope).toMatchObject({ weight: 1, maxPerUnit: 1 });
        expect(periscope.space.battlemech).toBe(1);
        expect(chaff).toMatchObject({ weight: 1, battleValue: 76, explosive: true });
        expect(chaff.range.short).toBe(1);
        expect([periscope, chaff].map(getEquipmentRulesLevel)).toEqual([CUSTOM_HOMEBREW_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL]);
    });

    it("Modular C3 (Prince): 1 ton linking one other unit, half a ton more for each further unit, up to 11", () => {
        const c3 = get("custom-modular-c3");
        expect(c3).toMatchObject({ variableFormula: "modular-c3", sizeMax: 11, size: 1 });
        const sized = (size: number) => sizeVariableEquipment("modular-c3", { tonnage: 50, engineRating: 0, engineWeight: 0, directFireWeaponWeight: 0, size });
        expect(sized(1)).toMatchObject({ weight: 1, slots: 1, cbills: 250000 });
        expect(sized(3)).toMatchObject({ weight: 2, slots: 2, cbills: 500000 });
        expect(sized(11)).toMatchObject({ weight: 6, slots: 6, cbills: 1500000 });
        expect(getEquipmentRulesLevel(c3)).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("Nuclear Pulse Cannon (Prince): an Arrow IV-sized direct-fire superweapon, 3 rounds a ton, Munchkin", () => {
        const gun = get("custom-nuclear-pulse-cannon");
        const ammo = get("ammo-custom-nuclear-pulse-cannon-standard");
        expect(gun).toMatchObject({ weight: 15, damage: 35, heat: 20, shotsPerTon: 3, battleValue: 420 });
        expect(gun.space.battlemech).toBe(15);
        expect(ammo).toMatchObject({ roundsPerTon: 3, battleValue: 53 });
        expect(getCompatibleAmmo(gun, ammo)).toBe(true);
        expect(gun.notes).toContain("20 shots");
        expect([gun, ammo].map(getEquipmentRulesLevel)).toEqual([MUNCHKIN_RULES_LEVEL, MUNCHKIN_RULES_LEVEL]);
    });
});
