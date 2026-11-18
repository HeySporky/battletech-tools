import { describe, expect, it } from "vitest";
import {
    getFutureWarsPlayKind,
    getLRFlamerBurn,
    getLRFlamerRangeModifier,
    getLRFlamerScatter,
    getPDSInterception,
    getInfernoGaussAmmoCrit,
    getLRFlamerAmmoHit,
    getPDSHeat,
    INFERNO_GAUSS_TURNS_PER_HIT,
    INFERNO_GAUSS_HEAT_PER_TURN,
    getVHESplashLocations,
    getSabotDamage,
    getPenitratorHit,
    getPowerBoosterRoll,
    getBoostedRunHeat,
    getBoostedJumpHeat,
    getBoostedJumpMP,
    PDS_INTEGRAL_BURSTS,
} from "./future-wars-play";
import { getClusterHitsPerRoll } from "../utils";
import { getEquipmentRecordsByTech } from "../data/equipment-registry";

const getEquipmentByTag = (tag: string) => getEquipmentRecordsByTech("is", true).find((item) => item.tag === tag);

/** Best of Future Wars plan, Chunk C (#172): the play rule of each fanzine item, one test a rule. */
describe("Best of Future Wars in play: the rules", () => {
    it("Long Range Flamer burns three turns, 5 then 2 then 0 damage, 5 heat each (p.28)", () => {
        expect(getLRFlamerBurn([0])).toEqual({ damage: 5, heat: 5 });
        expect(getLRFlamerBurn([1])).toEqual({ damage: 2, heat: 5 });
        expect(getLRFlamerBurn([2])).toEqual({ damage: 0, heat: 5 });
        expect(getLRFlamerBurn([3])).toEqual({ damage: 0, heat: 0 });
        expect(getLRFlamerBurn([])).toEqual({ damage: 0, heat: 0 });
    });

    it("Long Range Flamer hit three turns in a row does 7, +1 heat a hit still burning, 10 heat at most (p.28)", () => {
        expect(getLRFlamerBurn([0, 1, 2])).toEqual({ damage: 7, heat: 7 });
        expect(getLRFlamerBurn([0, 0, 0, 0, 0, 0, 0, 0])).toEqual({ damage: 40, heat: 10 });
    });

    it("Long Range Flamer is +2 to hit at medium and +3 at long, nothing at short (p.28)", () => {
        expect(getLRFlamerRangeModifier("short")).toBe(0);
        expect(getLRFlamerRangeModifier("medium")).toBe(2);
        expect(getLRFlamerRangeModifier("long")).toBe(3);
    });

    it("Long Range Flamer miss scatters on a die: 1-3 short, 4 left, 5 right, 6 behind (p.28)", () => {
        expect([1, 2, 3, 4, 5, 6].map(getLRFlamerScatter)).toEqual(["one hex short", "one hex short", "one hex short", "one hex to the left", "one hex to the right", "one hex behind"]);
    });

    it("EII PDS: a die stops that many SRMs, die + 1 LRMs, one burst a salvo, 50 built-in bursts (p.8)", () => {
        expect(PDS_INTEGRAL_BURSTS).toBe(50);
        expect(getPDSInterception(5, 4, "srm")).toEqual({ stopped: 4, through: 1 });
        expect(getPDSInterception(3, 5, "lrm")).toEqual({ stopped: 3, through: 0 });
        expect(getPDSInterception(2, 6, "srm")).toEqual({ stopped: 2, through: 0 });
    });

    it("Liao Inferno Gauss shell: 10 heat a turn for 5 turns; an ammo critical is 30 heat (20 with CASE) + 1 a shell (p.11)", () => {
        expect(INFERNO_GAUSS_HEAT_PER_TURN).toBe(10);
        expect(INFERNO_GAUSS_TURNS_PER_HIT).toBe(5);
        expect(getInfernoGaussAmmoCrit(8, false)).toEqual({ heat: 38, damage: 0 });
        expect(getInfernoGaussAmmoCrit(8, true)).toEqual({ heat: 28, damage: 0 });
        expect(getInfernoGaussAmmoCrit(0, false)).toEqual({ heat: 30, damage: 0 });
    });

    it("VHE shell splashes 5 on each adjacent location: the center torso's are the head, both torsos and both legs (p.10)", () => {
        expect(getVHESplashLocations("ct").sort()).toEqual(["hd", "ll", "lt", "rl", "rt"]);
        expect(getVHESplashLocations("hd")).toEqual(["ct"]);
        expect(getVHESplashLocations("la")).toEqual(["lt"]);
        expect(getVHESplashLocations("lt").sort()).toEqual(["ct", "la", "ll"]);
        expect(getVHESplashLocations("rl").sort()).toEqual(["ct", "rt"]);
    });

    it("SABOT: half the damage outside, a quarter inside, rounded up (p.21)", () => {
        expect(getSabotDamage(2)).toEqual({ external: 1, internal: 1 });
        expect(getSabotDamage(5)).toEqual({ external: 3, internal: 2 });
        expect(getSabotDamage(10)).toEqual({ external: 5, internal: 3 });
        expect(getSabotDamage(20)).toEqual({ external: 10, internal: 5 });
    });

    it("Penitrator: dice damage and internal damage by band, inside 8 hexes half a 1D4 (p.20)", () => {
        expect(getPenitratorHit(5, 3)).toEqual({ band: "under 8", external: 2, internal: 1, dice: "1D4/2" });
        expect(getPenitratorHit(10, 7)).toEqual({ band: "short", external: 7, internal: 3, dice: "1D8" });
        expect(getPenitratorHit(20, 6)).toEqual({ band: "medium", external: 6, internal: 2, dice: "1D6" });
        expect(getPenitratorHit(36, 4)).toEqual({ band: "long", external: 4, internal: 1, dice: "1D4" });
        expect(getPenitratorHit(37, 4)).toBeUndefined();
    });

    it("Gatling Laser rolls on the cluster table as an SRM 6 for 2 a hit (p.27)", () => {
        const gatling = getEquipmentByTag("custom-gatling-laser")!;
        expect(gatling.damageClusters).toBe(6);
        expect(gatling.damagePerCluster).toBe(2);
        expect(getClusterHitsPerRoll(7, gatling.damageClusters!)).toBe(4);
    });

    it("Power Booster: fails on 5 or less, then 9 or less, then 11 or less; a 4th turn or a 2 burns out the system (p.28)", () => {
        expect(getPowerBoosterRoll(1, 6)).toBe("boosted");
        expect(getPowerBoosterRoll(1, 5)).toBe("failed");
        expect(getPowerBoosterRoll(2, 9)).toBe("failed");
        expect(getPowerBoosterRoll(2, 10)).toBe("boosted");
        expect(getPowerBoosterRoll(3, 11)).toBe("failed");
        expect(getPowerBoosterRoll(3, 12)).toBe("boosted");
        expect(getPowerBoosterRoll(4, 12)).toBe("system-burned-out");
        expect(getPowerBoosterRoll(1, 2)).toBe("system-burned-out");
    });

    it("Power Booster on the legs: 1 heat a hex run; on jump jets: x1.5 jump at double heat (p.28)", () => {
        expect(getBoostedRunHeat(7)).toBe(7);
        expect(getBoostedJumpMP(6)).toBe(9);
        expect(getBoostedJumpMP(5)).toBe(7);
        expect(getBoostedJumpHeat(9)).toBe(18);
        expect(getBoostedJumpHeat(1)).toBe(6);
    });

    it("each fanzine item has a play kind; a canon item has none", () => {
        const kinds = ["custom-lr-flamer", "custom-eii-pds", "custom-penitrator", "custom-gatling-laser", "custom-pom-pom-ac-5", "custom-swing-fire-lrm-10",
            "custom-power-booster-medium-laser", "custom-power-booster-running", "custom-power-booster-jumping", "ammo-is-gauss-rifle-vhe",
            "ammo-is-gauss-rifle-inferno", "ammo-ac-10-sabot", "ammo-custom-lr-flamer-standard"].map((tag) => getFutureWarsPlayKind(getEquipmentByTag(tag)!));
        expect(kinds).toEqual(["lr-flamer", "pds", "penitrator", "gatling", "pom-pom", "swing-fire", "booster-weapon", "booster-running", "booster-jumping",
            "vhe", "inferno-gauss", "sabot", "lr-flamer-ammo"]);
        expect(getFutureWarsPlayKind(getEquipmentByTag("medium-laser")!)).toBeUndefined();
    });
});

describe("Future Wars equipment as first printed (#172, printing alternates)", () => {
    it("Power Booster, FW #14 p.34: fails on 5 / 9 / 11 or less, a 2 burns out the system, and no fourth-turn burnout", () => {
        expect(getPowerBoosterRoll(1, 5, "original")).toBe("failed");
        expect(getPowerBoosterRoll(1, 6, "original")).toBe("boosted");
        expect(getPowerBoosterRoll(2, 9, "original")).toBe("failed");
        expect(getPowerBoosterRoll(3, 12, "original")).toBe("boosted");
        // NGCFells ruled (2026-11-17): the fourth turn and later keep the third turn's 11 or less.
        expect(getPowerBoosterRoll(4, 7, "original")).toBe("failed");
        expect(getPowerBoosterRoll(4, 11, "original")).toBe("failed");
        expect(getPowerBoosterRoll(4, 12, "original")).toBe("boosted");
        expect(getPowerBoosterRoll(9, 12, "original")).toBe("boosted");
        expect(getPowerBoosterRoll(4, 12)).toBe("system-burned-out");
        expect(getPowerBoosterRoll(1, 2, "original")).toBe("system-burned-out");
    });

    it("Inferno Gauss shells hit, FW #19: 30 heat (20 with CASE) and 1 damage a shell, not 1 heat a shell", () => {
        expect(getInfernoGaussAmmoCrit(8, false, "original")).toEqual({ heat: 30, damage: 8 });
        expect(getInfernoGaussAmmoCrit(8, true, "original")).toEqual({ heat: 20, damage: 8 });
    });

    it("Long Range Flamer fuel hit, as first printed: 2 damage and 3 heat a round left", () => {
        expect(getLRFlamerAmmoHit(5)).toEqual({ damage: 10, heat: 15 });
        expect(getLRFlamerAmmoHit(0)).toEqual({ damage: 0, heat: 0 });
    });

    it("the EII PDS's heat: 1 from the FW #24 table, 0 as FW #14 first printed it", () => {
        expect(getPDSHeat("best-of")).toBe(1);
        expect(getPDSHeat("original")).toBe(0);
    });
});
