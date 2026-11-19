import { describe, expect, it } from "vitest";
import type { IAlphaStrikeDamage } from "../classes/alpha-strike-unit";
import { calculateAlphaStrikeValue, IAlphaStrikeExport } from "./calculateAlphaStrikeValue";

const none = (): IAlphaStrikeDamage => ({ short: 0, medium: 0, long: 0, extreme: 0 });
const dmg = (short: number, medium: number, long: number): IAlphaStrikeDamage => ({ short, medium, long, extreme: 0 });

function stats(abilityCodes: string[]): IAlphaStrikeExport {
    return {
        mechCreatorUUID: "", name: "Test", move: 8, type: "BM", customName: "", role: "", jumpMove: 0, pv: 0,
        damage: { short: 2, medium: 2, long: 1, extreme: 0 }, armor: 4, structure: 3, size: 2, skill: 4, overheat: 0,
        notes: "", tmm: 1, sizeClass: 2, sizeClassName: "", ov: 0, specialUnitAbilities: [], longHeat: 0, longOverheat: 0,
        abilityCodes,
    };
}

// The damage specials a 'Mech's conversion writes (#378): the sample VTOLAMs showed IF 0, SRM 0/0/0 and HEAT 0/0/0.
describe("calculateAlphaStrikeValue damage specials", () => {
    const codes = (abilities: string[], damage: Partial<Record<"heat" | "lrm" | "srm" | "ac" | "flak" | "msl", IAlphaStrikeDamage>>, indirectFire = 0) =>
        calculateAlphaStrikeValue(stats(abilities), none(), damage.heat ?? none(), damage.lrm ?? none(), damage.flak ?? none(),
            damage.ac ?? none(), damage.srm ?? none(), damage.msl ?? none(), indirectFire).alphaStrikeForceStats.abilityCodes;

    // LRM, SRM and AC need 10 or more points (1 or more) at medium range (StratOps errata 2.0, ASC errata).
    it("leaves off LRM, SRM and AC under 1 damage at medium range", () => {
        expect(codes(["SRM"], { srm: dmg(0.4, 0.4, 0) })).toEqual([]);
        expect(codes(["LRM"], { lrm: dmg(0.6, 0.9, 0.9) })).toEqual([]);
        expect(codes(["AC"], { ac: dmg(1, 1, 0) })).toEqual(["AC 1/1/0"]);
    });

    it("writes minimal indirect fire as IF 0*, and none at all as no IF", () => {
        expect(codes(["IF"], {}, 0.3)).toEqual(["IF 0*"]);
        expect(codes(["IF"], {}, 0)).toEqual([]);
        expect(codes(["IF"], {}, 1.4)).toEqual(["IF 1"]);
    });

    it("leaves off a special with no damage at any range", () => {
        expect(codes(["Heat"], { heat: none() })).toEqual([]);
        expect(codes(["Heat"], { heat: dmg(1, 1, 0) })).toEqual(["Heat 1/1/0"]);
    });

    it("keeps the abilities that carry no damage", () => {
        expect(codes(["ENE", "SRM"], { srm: none() })).toEqual(["ENE"]);
    });
});
