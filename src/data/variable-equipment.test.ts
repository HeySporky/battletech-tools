import { describe, expect, it } from "vitest";
import { isTargetingComputerWeapon, roundUpHalfTon, sizeVariableEquipment } from "./variable-equipment";
import { IEquipmentItem } from "./data-interfaces";

const ctx = { tonnage: 75, engineRating: 300, engineWeight: 19, directFireWeaponWeight: 21 };

describe("variable equipment sizing", () => {
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

    it("sizes wings, boosters, tracks, sealing, AES and talons (TM pp.216, 249; TO:AUE pp.91, 103, 105)", () => {
        expect(sizeVariableEquipment("partial-wing-is", ctx)).toMatchObject({ weight: 5.5, slots: 8 });
        expect(sizeVariableEquipment("partial-wing-clan", ctx)).toMatchObject({ weight: 4, slots: 6 });
        expect(sizeVariableEquipment("jump-booster", { ...ctx, size: 2 })).toMatchObject({ weight: 7.5, slots: 4, cbills: 150000 });
        expect(sizeVariableEquipment("jump-booster", { ...ctx, size: 2, isQuad: true })?.slots).toBe(8);
        expect(sizeVariableEquipment("tracks", ctx)).toMatchObject({ weight: 7.5, slots: 2, cbills: 150000 });
        expect(sizeVariableEquipment("environmental-sealing", ctx)).toMatchObject({ weight: 7.5, slots: 8, cbills: 16875 });
        expect(sizeVariableEquipment("aes-arm", ctx)).toMatchObject({ weight: 2.5, slots: 3, cbills: 37500 });
        expect(sizeVariableEquipment("aes-leg", { ...ctx, isQuad: true })).toMatchObject({ weight: 1.5, cbills: 52500 });
        expect(sizeVariableEquipment("talons", ctx)).toMatchObject({ weight: 5, slots: 4, battleValue: 8 });
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
