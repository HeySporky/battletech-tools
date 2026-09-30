import { describe, expect, it } from "vitest";
import { getEquipmentListByTech } from "../data/equipment-registry";
import { findEquipmentBySSWName } from "./sswEquipmentNames";

const is = getEquipmentListByTech("is");
const clan = getEquipmentListByTech("clan");
const tagOf = (name: string, list = is) => findEquipmentBySSWName(name, list)?.tag;

describe("findEquipmentBySSWName", () => {
    it("matches SSW's hyphenated launcher names", () => {
        expect(findEquipmentBySSWName("SRM-6", is)?.name).toMatch(/^SRM 6/);
        expect(findEquipmentBySSWName("LRM-15", is)?.name).toMatch(/^LRM 15/);
    });

    it("matches Clan weapons without the catalog's Clan marker", () => {
        expect(findEquipmentBySSWName("ER Medium Laser", clan)?.tag).toBe("er-medium-laser-clan");
        expect(findEquipmentBySSWName("LB 10-X AC", clan)?.name).toBe("Clan LB 10-X AC");
    });

    it("prefers the production weapon over one-shot and prototype versions", () => {
        const srm6 = findEquipmentBySSWName("SRM-6", is)!;
        expect(srm6.name).not.toMatch(/\((I-)?OS\)|Prototype/);
    });

    it("resolves ammunition through the launcher it feeds", () => {
        expect(findEquipmentBySSWName("Ammo (SRM-6)", is)?.name).toBe("SRM - Standard Ammo");
        expect(tagOf("Ammo (Gauss Rifle)")).toMatch(/^ammo-is-gauss-rifle/);
        expect(findEquipmentBySSWName("Ammo (LRM-15 (Artemis IV Capable))", is)?.name).toBe("LRM - Artemis IV Ammo (IS)");
        expect(findEquipmentBySSWName("Ammo (LB 10-X AC (Slug))", is)?.name).toBe("LB 10-X AC - Slug Ammo (IS)");
        expect(findEquipmentBySSWName("Ammo (LB 10-X AC (Cluster))", clan)?.name).toBe("LB 10-X AC - Cluster Ammo (C)");
    });

    it("keeps Clan designs on Clan ammunition", () => {
        const ammo = findEquipmentBySSWName("Ammo (Gauss Rifle)", clan)!;
        expect(ammo.name).toMatch(/\(C\)$/);
    });

    it("returns null for names it cannot place", () => {
        expect(findEquipmentBySSWName("Definitely Not A Weapon", is)).toBeNull();
        expect(findEquipmentBySSWName("Ammo (Definitely Not A Weapon)", is)).toBeNull();
    });
});

describe("findEquipmentBySSWName ranking", () => {
    // The Star League Clan launcher's alternate name is "LRM-10", but SSW's "(CL) LRM-10" is the Clan LRM 10.
    it("prefers a record's own name over another record's alternate name", () => {
        expect(findEquipmentBySSWName("LRM-10", clan)?.tag).toBe("clan-lrm-10");
        expect(findEquipmentBySSWName("SRM-6", clan)?.tag).toBe("clan-srm-6");
    });
});
