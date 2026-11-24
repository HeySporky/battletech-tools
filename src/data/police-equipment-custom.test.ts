import { describe, expect, it } from "vitest";
import { ammoCustom } from "./ammo-custom";
import { ballisticCustom } from "./ballistic-custom";
import { ammoCatalog } from "./ammo";
import { equipmentMissile } from "./equipment-missile";
import { getAmmoBattleValuePerTon, getCompatibleAmmo } from "./equipment-registry";

const tag = (t: string) => [...equipmentMissile, ...ammoCatalog].find((item) => item.tag === t)!;

describe("Battletech Into The Future police equipment (Ideas #92)", () => {
    it("the iTaser is the canon 'Mech Taser plus 14 BV and 100,000 C-bills", () => {
        const itaser = ballisticCustom.find((item) => item.tag === "custom-improved-mech-taser")!;
        expect(itaser).toMatchObject({ battleValue: 54, cbills: 300000, weight: 4, heat: 6, prototype: 3090, introduced: 3101, rulesLevel: 6, requiresEngine: "fusion" });
        expect(itaser.space.battlemech).toBe(3);
        expect(getCompatibleAmmo(itaser, tag("ammo-is-mech-taser-standard"))).toBe(true);
    });

    it("EMP missiles feed every non-Streak launcher at twice the cost and 2.5 times the BV", () => {
        const lrm = ammoCustom.find((item) => item.tag === "ammo-is-lrm-emp")!;
        expect(lrm).toMatchObject({ cbills: 60000, introduced: 3136, roundsPerTon: 120, battleValueMultiplier: 2.5, isSpecialAmmo: true });
        expect(getCompatibleAmmo(tag("lrm-20"), lrm)).toBe(true);
        expect(getCompatibleAmmo(tag("mml-5"), lrm)).toBe(true);
        expect(getAmmoBattleValuePerTon(tag("lrm-20"), lrm)).toBeCloseTo(23 * 2.5);
        expect(getCompatibleAmmo(tag("srm-6"), ammoCustom.find((item) => item.tag === "ammo-is-srm-emp")!)).toBe(true);
        expect(getCompatibleAmmo(tag("mrm-20"), ammoCustom.find((item) => item.tag === "ammo-is-mrm-emp")!)).toBe(true);
        expect(ammoCustom.filter((item) => item.tag.endsWith("-emp"))).toHaveLength(12);
    });
});
