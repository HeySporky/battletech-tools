import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL, EXPERIMENTAL_RULES_LEVEL, MUNCHKIN_RULES_LEVEL } from "../data/rules-level-options";

describe("Alpha Strike heat-modified damage", () => {
    it("two LRM 5s on a cool 'Mech do not gain short-range damage (issue 62)", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.addEquipmentFromTag("lrm-5", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("lrm-5", "is", "lt", false, undefined, "", false, [], undefined, undefined);
        expect(mech.getAlphaStrikeForceStats().damage.short).toBeLessThanOrEqual(1);
    });
});

// Our Chaff Pod conversion (TO:AUE p.111, no published one): one CHF per pod, summed over the unit (#642). Our rules
// appear only at Custom Homebrew (6) and Munchkin (7); canon levels 0-4 and Apocryphal 5 get the canon card (NGCFells).
describe("Alpha Strike Chaff Pod pods (ours, Custom Homebrew and up)", () => {
    const chaffCodes = (mech: BattleMech) => mech.calcAlphaStrike().abilities.filter((code) => code.startsWith("CHF"));
    const podMech = (level?: number) => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        if (level !== undefined) mech.applyGameSettings({ ...mech.getGameSettings(level), rulesLevel: level });
        mech.addEquipmentFromTag("chaff-pod", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("chaff-pod", "is", "lt", false, undefined, "", false, [], undefined, undefined);
        return mech;
    };

    it("a canon design with Chaff Pods shows the inferred CHF at its own level (no book converts the pod, #647)", () => {
        expect(chaffCodes(podMech())).toEqual(["CHF2"]);
        expect(chaffCodes(podMech(EXPERIMENTAL_RULES_LEVEL))).toEqual(["CHF2"]);
        expect(chaffCodes(podMech(APOCRYPHAL_RULES_LEVEL))).toEqual(["CHF2"]);
    });

    it("at Custom Homebrew and Munchkin two Chaff Pods convert to CHF2, and a Chaff Pod 2.0 adds its 4 pods", () => {
        expect(chaffCodes(podMech(MUNCHKIN_RULES_LEVEL))).toEqual(["CHF2"]);
        const mech = podMech(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(chaffCodes(mech)).toEqual(["CHF2"]);
        // An inferred code never raises the card: the Chaff Pod card stays at the pod's own level (#647).
        expect(mech.calcAlphaStrike().rulesLevel).toBe(EXPERIMENTAL_RULES_LEVEL);
        expect(podMech(EXPERIMENTAL_RULES_LEVEL).calcAlphaStrike().rulesLevel).toBe(EXPERIMENTAL_RULES_LEVEL);
        mech.addEquipmentFromTag("custom-chaff-pod-2", "is", "ct", false, null, "", false, [], undefined, undefined, -1, "", true);
        expect(chaffCodes(mech)).toEqual(["CHF6"]);
    });

    it("a Chaff Pod 2.0 makes the design Custom Homebrew, so its pods convert", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.addEquipmentFromTag("custom-chaff-pod-2", "is", "ct", false, null, "", false, [], undefined, undefined, -1, "", true);
        expect(chaffCodes(mech)).toEqual(["CHF4"]);
    });
});

// ASC p.101, Ammunition: under 10 shots a weapon's damage is x 0.75 (20 for an Ultra autocannon, 60 for a Rotary); a
// one-shot launcher is x 0.1. Checked against the MUL cards of the Clan LRM 20 'Mechs (Bowman, Naja, Atlas C).
describe("Alpha Strike low-ammunition damage (ASC p.101)", () => {
    const clanMech = (launcher: string, ammoTag: string, ammoTons: number, launchers = 1): BattleMech => {
        const mech = new BattleMech();
        mech.setTech("clan");
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        for (let count = 0; count < launchers; count++) {
            mech.addEquipmentFromTag(launcher, "clan", count === 0 ? "rt" : "lt", false, undefined, "", false, [], undefined, undefined);
        }
        for (let ton = 0; ton < ammoTons; ton++) {
            mech.addEquipmentFromTag(ammoTag, "clan", "lt", false, undefined, "", false, [], undefined, undefined);
        }
        return mech;
    };

    it("a Clan LRM 20 with 6 shots is x 0.75: 1.2 becomes 0.9, a damage of 1 at every range", () => {
        const damage = clanMech("clan-lrm-20", "ammo-lrm-standard", 1).getAlphaStrikeForceStats().damage;
        expect([damage.short, damage.medium, damage.long]).toEqual([1, 1, 1]);
    });

    it("a Clan LRM 20 with 12 shots is not reduced: 1.2 rounds up to 2", () => {
        const damage = clanMech("clan-lrm-20", "ammo-lrm-standard", 2).getAlphaStrikeForceStats().damage;
        expect([damage.short, damage.medium, damage.long]).toEqual([2, 2, 2]);
    });

    it("two Clan UAC/20s with 15 shots each are x 0.75 (an Ultra needs 20): 6 becomes 4.5, a 5, against 6 at 20 shots", () => {
        // 2 x 3 = 6 at Short and Medium; Ultra ammunition is 5 shots a ton. 6 tons are 30 shots (15 each), 8 tons are 40 (20 each).
        const low = clanMech("clan-autocannon-uac-20", "ammo-clan-ultra-ac-20-standard", 6, 2).getAlphaStrikeForceStats();
        const full = clanMech("clan-autocannon-uac-20", "ammo-clan-ultra-ac-20-standard", 8, 2).getAlphaStrikeForceStats();
        expect(full.damage.short).toBeGreaterThan(low.damage.short);
    });

    it("a one-shot launcher is x 0.1: a Clan LRM 20 (OS) is Minimal Damage", () => {
        const damage = clanMech("clan-lrm-20-os", "ammo-lrm-standard", 0).getAlphaStrikeForceStats().damage;
        expect(damage.shortMinimal).toBe(true);
        expect(damage.short).toBe(0);
    });
});

// A 'Mech carrying a Watchdog and a Beagle converts with each E-War code once (#642 Phase 5, ASC v1.6).
describe("Alpha Strike E-War codes list once", () => {
    it("lists ECM, LPRB, PRB, RCN and WAT once each", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.addEquipmentFromTag("clan-watchdog-cews", "clan", "rt", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("beagle-active-probe", "is", "lt", false, undefined, "", false, [], undefined, undefined);
        const abilities = mech.calcAlphaStrike().abilities;
        for (const code of ["ECM", "LPRB", "PRB", "RCN", "WAT"]) expect(abilities.filter((each) => each === code), code).toHaveLength(1);
    });
});
