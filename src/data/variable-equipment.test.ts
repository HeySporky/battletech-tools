import { describe, expect, it } from "vitest";
import { isTargetingComputerWeapon, roundUpHalfTon, sizeVariableEquipment } from "./variable-equipment";
import { IEquipmentItem } from "./data-interfaces";

const ctx = { tonnage: 75, engineRating: 300, engineWeight: 19, directFireWeaponWeight: 21 };

describe("variable equipment sizing", () => {
    it("sizes drone operating and carrier control systems (TO:AUE pp.117, 219)", () => {
        // 10% of a 75-ton drone (7.5 t) plus the half-ton sensors; 5,000 + 10,000 x 7.5.
        expect(sizeVariableEquipment("drone-operating-system", ctx)).toEqual({ weight: 8, slots: 1, cbills: 80000, battleValue: 0 });
        // 2 tons plus 0.5 per drone; 10,000 a ton.
        expect(sizeVariableEquipment("drone-carrier-control", { ...ctx, drones: 4 })).toEqual({ weight: 4, slots: 1, cbills: 40000, battleValue: 0 });
        expect(sizeVariableEquipment("drone-carrier-control", ctx)?.weight).toBe(2.5);
    });

    it("sizes the naval C3, tug adaptor and light sail from the vessel (TO:AUE pp.135, 144, 146, 221)", () => {
        expect(sizeVariableEquipment("naval-c3", { ...ctx, tonnage: 420000 })).toEqual({ weight: 4200, slots: 1, cbills: 420000000, battleValue: 0 });
        expect(sizeVariableEquipment("naval-c3", { ...ctx, tonnage: 1250 })?.weight).toBe(12.5);
        expect(sizeVariableEquipment("naval-tug-adaptor", { ...ctx, tonnage: 3500 })).toEqual({ weight: 450, slots: 1, cbills: 100000, battleValue: 0 });
        // To the ton from 5 tons, to the kilogram below.
        expect(sizeVariableEquipment("light-sail", { ...ctx, tonnage: 42 })).toEqual({ weight: 5, slots: 1, cbills: 500000, battleValue: 0 });
        expect(sizeVariableEquipment("light-sail", { ...ctx, tonnage: 2.345 })?.weight).toBe(0.235);
    });

    it("rounds up to the half ton", () => {
        expect(roundUpHalfTon(2.75)).toBe(3);
        expect(roundUpHalfTon(2.5)).toBe(2.5);
        expect(roundUpHalfTon(1.9)).toBe(2);
    });

    it("sizes physical weapons (TM pp.220, 236, 237; TO:AUE pp.101-102)", () => {
        expect(sizeVariableEquipment("hatchet", ctx)).toMatchObject({ weight: 5, slots: 5, damage: 15, battleValue: 22.5 });
        expect(sizeVariableEquipment("sword", ctx)).toMatchObject({ weight: 4, slots: 5, damage: 9 });
        expect(sizeVariableEquipment("retractable-blade", ctx)).toMatchObject({ weight: 4.5, slots: 5, damage: 8 });
        expect(sizeVariableEquipment("mace", ctx)).toMatchObject({ weight: 8, slots: 8, damage: 19, cbills: 130000 });
        expect(sizeVariableEquipment("lance", ctx)).toMatchObject({ weight: 4, slots: 4, damage: 15 });
        expect(sizeVariableEquipment("claw", ctx)).toMatchObject({ weight: 5, slots: 5, damage: 11 });
    });

    it("doubles physical weapon BV with TSM (TM p.303)", () => {
        expect(sizeVariableEquipment("hatchet", { ...ctx, hasTSM: true })?.battleValue).toBe(45);
    });

    it("sizes MASC, Supercharger and targeting computers (TM pp.225, 238; TO:AUE p.157)", () => {
        expect(sizeVariableEquipment("masc-is", ctx)).toMatchObject({ weight: 4, slots: 4, cbills: 1200000 });
        expect(sizeVariableEquipment("masc-clan", ctx)).toMatchObject({ weight: 3, slots: 3 });
        expect(sizeVariableEquipment("supercharger", ctx)).toMatchObject({ weight: 2, slots: 1, cbills: 3000000 });
        expect(sizeVariableEquipment("targeting-computer-is", ctx)).toMatchObject({ weight: 6, slots: 6, cbills: 60000 });
        expect(sizeVariableEquipment("targeting-computer-clan", ctx)).toMatchObject({ weight: 5, slots: 5 });
    });

    it("sizes wings, boosters, tracks, sealing, fuel tanks, AES and talons (TM pp.70, 216, 244, 249; TO:AUE pp.91, 103, 105)", () => {
        expect(sizeVariableEquipment("partial-wing-is", ctx)).toMatchObject({ weight: 5.5, slots: 8 });
        expect(sizeVariableEquipment("partial-wing-clan", ctx)).toMatchObject({ weight: 4, slots: 6 });
        expect(sizeVariableEquipment("jump-booster", { ...ctx, size: 2 })).toMatchObject({ weight: 7.5, slots: 4, cbills: 150000 });
        expect(sizeVariableEquipment("jump-booster", { ...ctx, size: 2, isQuad: true })?.slots).toBe(8);
        expect(sizeVariableEquipment("tracks", ctx)).toMatchObject({ weight: 7.5, slots: 2, cbills: 150000 });
        // QuadVee Wheels: 15% (half ton), (750 x rating x tonnage) / 75 (IO:AE pp.128, 181).
        expect(sizeVariableEquipment("quadvee-wheels", { ...ctx, isQuad: true })).toMatchObject({ weight: 11.5, slots: 4, cbills: 225000 });
        // 7.5 tons rounds up to 8: "Round this figure up to the nearest full ton" (TM p.70).
        expect(sizeVariableEquipment("environmental-sealing", ctx)).toMatchObject({ weight: 8, slots: 8, cbills: 16875 });
        // 10 percent of the engine weight, rounded up to the half ton; a slot per ton, rounded up (TM p.244).
        expect(sizeVariableEquipment("extended-fuel-tank", { ...ctx, engineWeight: 11 })).toMatchObject({ weight: 1.5, slots: 2, cbills: 750, battleValue: 0 });
        expect(sizeVariableEquipment("extended-fuel-tank", { ...ctx, engineWeight: 20 })).toMatchObject({ weight: 2, slots: 2, cbills: 1000 });
        expect(sizeVariableEquipment("aes-arm", ctx)).toMatchObject({ weight: 2.5, slots: 3, cbills: 37500 });
        expect(sizeVariableEquipment("aes-leg", { ...ctx, isQuad: true })).toMatchObject({ weight: 1.5, cbills: 52500 });
        expect(sizeVariableEquipment("talons", ctx)).toMatchObject({ weight: 5, slots: 4, battleValue: 8 });
    });

    it("values a Ram Plate so the printed Rhino sheet is reproduced (OTP: Hanseatic Crusade pp.30, 40)", () => {
        // 50 tons at 12 running MP: 60 charge damage, half is 30, plus 3 torsos of Spikes, times 1.1.
        const rhino = sizeVariableEquipment("ram-plate", { ...ctx, tonnage: 50, isQuad: true, runMP: 12, torsoSpikes: 3 })!;
        expect(rhino).toMatchObject({ weight: 5, slots: 3 });
        expect(rhino.battleValue).toBeCloseTo(36.3, 6);
        // 55 tons at 7 running MP: 38 charge damage (rounded down), half is 19.
        expect(sizeVariableEquipment("ram-plate", { ...ctx, tonnage: 55, isQuad: true, runMP: 7 })!.battleValue).toBeCloseTo(20.9, 6);
        expect(sizeVariableEquipment("ram-plate", { ...ctx, tonnage: 50, isQuad: true })!.battleValue).toBe(0);
    });

    it("counts energy and ballistic weapons except flamers, machine guns and AMS toward a targeting computer", () => {
        const item = (tag: string, category: string) => ({ tag, category }) as IEquipmentItem;
        expect(isTargetingComputerWeapon(item("large-laser", "Energy Weapons"))).toBe(true);
        expect(isTargetingComputerWeapon(item("gauss-rifle", "Ballistic Weapons"))).toBe(true);
        expect(isTargetingComputerWeapon(item("flamer", "Energy Weapons"))).toBe(false);
        expect(isTargetingComputerWeapon(item("machine-gun", "Ballistic Weapons"))).toBe(false);
        expect(isTargetingComputerWeapon(item("ams", "Ballistic Weapons"))).toBe(false);
        expect(isTargetingComputerWeapon(item("lrm-10", "Missile Weapons"))).toBe(false);
    });
});
