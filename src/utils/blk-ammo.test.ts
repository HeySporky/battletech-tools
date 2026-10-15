import { describe, expect, it } from "vitest";
import { getEquipmentListByTech } from "../data/equipment-registry";
import { findBlkAmmo, findBlkAmmoWeapon, parseBlkAmmoLine } from "./blk-ammo";

describe("MegaMek .blk ammunition lines", () => {
    it("reads the weapon, half-ton bins and the kind of round", () => {
        expect(parseBlkAmmoLine("IS Ammo AC/10 - Half")).toMatchObject({ weaponKey: "ac10", half: true, kind: undefined });
        expect(parseBlkAmmoLine("IS LB 10-X Cluster Ammo")?.kind?.source).toBe("cluster");
        expect(parseBlkAmmoLine("Medium Laser")).toBeNull();
        expect(parseBlkAmmoLine("IS Ammo MG - Full")).toMatchObject({ weaponKey: "machinegun", half: false });
    });

    it("finds the mounted weapon a line feeds and its standard round", () => {
        const lrm20 = getEquipmentListByTech("is", false).find((item) => item.tag === "lrm-20");
        expect(lrm20).toBeDefined();
        const line = parseBlkAmmoLine("IS Ammo LRM-20");
        expect(line).not.toBeNull();
        expect(findBlkAmmoWeapon(line!, [lrm20!])).toBe(lrm20);
        const ammo = findBlkAmmo(line!, lrm20!);
        expect(ammo?.isAmmo).toBe(true);
        expect(ammo?.isSpecialAmmo).toBeFalsy();
        // No weapon is guessed when nothing mounted fires the round.
        expect(findBlkAmmoWeapon(parseBlkAmmoLine("IS Gauss Ammo")!, [lrm20!])).toBeUndefined();
    });
});
