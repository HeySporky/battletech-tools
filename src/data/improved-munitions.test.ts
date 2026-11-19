import { describe, expect, it } from "vitest";
import { IEquipmentItem } from "./data-interfaces";
import { ammoCatalog } from "./ammo";
import { getCompatibleAmmo, getWeaponShotsPerTon } from "./equipment-registry";
import { equipmentBallistic } from "./equipment-ballistic";
import { equipmentMissile } from "./equipment-missile";

// "Improved missile launchers are compatible with all special munitions types that are available for the standard
// missile launcher of corresponding type and rack size"; improved autocannon "may make use of all specialized ammo,
// with the exception of the LB-X cluster munitions" (IO:AE p.90).
describe("special munitions for improved launchers and autocannon (IO:AE p.90)", () => {
    const ammo = (tag: string) => ammoCatalog.find((item) => item.tag === tag) as IEquipmentItem;
    const iLRM = equipmentMissile.find((item) => item.tag === "clan-improved-lrm-10") as IEquipmentItem;
    const iAC = equipmentBallistic.find((item) => item.tag === "clan-improved-ac-2") as IEquipmentItem;

    it("fires the standard launcher's special munitions, with its own standard round", () => {
        expect(getCompatibleAmmo(iLRM, ammo("ammo-clan-improved-lrm-standard"))).toBe(true);
        expect(getCompatibleAmmo(iLRM, ammo("ammo-clan-lrm-swarm"))).toBe(true);
        expect(getCompatibleAmmo(iLRM, ammo("ammo-is-lrm-swarm-i"))).toBe(true);
        expect(getCompatibleAmmo(iLRM, ammo("ammo-lrm-standard"))).toBe(false);
        expect(getCompatibleAmmo(iLRM, ammo("ammo-is-enhanced-lrm-swarm"))).toBe(false);
        expect(getWeaponShotsPerTon(iLRM, ammo("ammo-clan-lrm-swarm"))).toBe(12);
    });

    it("gives improved autocannon every special round but cluster", () => {
        expect(getCompatibleAmmo(iAC, ammo("ammo-is-ac-2-armor-piercing"))).toBe(true);
        expect(getCompatibleAmmo(iAC, ammo("ammo-ac-2-standard"))).toBe(false);
        expect(getCompatibleAmmo(iAC, ammo("ammo-is-light-ac-2-armor-piercing"))).toBe(false);
    });
});
