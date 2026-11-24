import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { getEquipmentCatalogDefinitions, mergeAlphaStrikeCountedCodes } from "../data/equipment-registry";
import type { IEquipmentItem } from "../data/data-interfaces";
import { EXPERIMENTAL_RULES_LEVEL, STANDARD_RULES_LEVEL } from "../data/rules-level-options";
import { getASTaserEffect, applyASTaserHit, IASEWarUnit } from "../utils/alpha-strike-ewar-play";

const makeUnitForTest = (): IASEWarUnit => ({ uuid: "t1", abilities: [], type: "BM", isInfantry: false, isAerospace: false, rulesLevel: 4, ewarPlay: {}, isWrecked: () => false });

/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
 * All official lore, trademarks, and intellectual property belong strictly to
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders.
 * Any original, fan-made content or custom homebrew data processed by this tool
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for
 * tabletop gameplay assistance. Content processed by this file is not intended
 * to challenge any copyright or trademark status, and this data is explicitly
 * excluded from the software's underlying license (GNU GPLv3).
 */

// #647 Task 2: canon Alpha Strike lookups, the inferred-level gate, MTAS play and the Coolant Pod heat.
const record = (tag: string): IEquipmentItem => {
    for (const catalog of getEquipmentCatalogDefinitions()) {
        const found = catalog.equipment.find((item) => item.tag === tag);
        if (found) return found;
    }
    throw new Error(`no record ${tag}`);
};

describe("#647 canon Alpha Strike lookups", () => {
    it("converts the BattleMech Taser to MTAS1, heat 6, 0.1 short", () => {
        const taser = record("mech-taser").alphaStrike;
        expect(taser.specialAbility).toEqual(["MTAS1"]);
        expect(taser.heat).toBe(6);
        expect(taser.rangeShort).toBe(0.1);
    });
    it("gives the Apollo MRMs the Companion values", () => {
        expect(record("mrm-10-apollo").alphaStrike.rangeShort).toBe(0.6);
        expect(record("mrm-20-apollo").alphaStrike.rangeMedium).toBe(1.2);
        expect(record("mrm-30-apollo").alphaStrike.rangeShort).toBe(1.8);
        expect(record("mrm-40-apollo").alphaStrike.rangeMedium).toBe(2.4);
    });
    it("gives the Recon Camera RCN and the pods their reasons", () => {
        expect(record("recon-camera").alphaStrike.specialAbility).toEqual(["RCN"]);
        expect(record("m-pod").alphaStrike.noConversion).toBe("explosive-component-only");
        expect(record("b-pod").alphaStrike.noConversion).toBe("explosive-component-only");
        expect(record("vehicular-grenade-launcher").alphaStrike.noConversion).toBe("no-alpha-strike-rule");
    });
    it("infers the CRB plasma rifles and the canon Chaff Pod", () => {
        const light = record("light-plasma-rifle").alphaStrike;
        expect([light.heat, light.rangeShort, light.rangeMedium, light.rangeLong]).toEqual([4, 0.4, 0.4, 0.4]);
        expect(light.notes?.join(" ")).toContain("Heat");
        const heavy = record("heavy-plasma-rifle").alphaStrike;
        expect([heavy.heat, heavy.rangeShort, heavy.rangeMedium, heavy.rangeLong]).toEqual([12, 1.2, 1.2, 0]);
        for (const tag of ["light-plasma-rifle", "heavy-plasma-rifle", "chaff-pod"]) {
            const strike = record(tag).alphaStrike;
            expect(strike.inferred).toBe(true);
            expect(strike.notes?.some((note) => note.startsWith("Inferred (NGCFells, 2026-11-22, #647)"))).toBe(true);
        }
    });
    it("sums two Tasers to MTAS2", () => {
        expect(mergeAlphaStrikeCountedCodes(["MTAS1", "MTAS1"])).toEqual(["MTAS2"]);
    });
});

describe("#647 cards", () => {
    const mech = (level: number, ...tags: string[]) => {
        const unit = new BattleMech();
        unit.setTonnage(50);
        unit.applyGameSettings({ ...unit.getGameSettings(level), rulesLevel: level });
        tags.forEach((tag, index) => unit.addEquipmentFromTag(tag, "is", index % 2 ? "lt" : "rt", false, undefined, "", false, [], undefined, undefined));
        return unit;
    };
    it("shows MTAS on a level 2 'Mech with a Taser and leaves the card level alone", () => {
        const card = mech(STANDARD_RULES_LEVEL, "mech-taser").calcAlphaStrike();
        expect(card.abilities).toContain("MTAS1");
        expect(card.rulesLevel).toBeLessThan(6);
        expect(mech(STANDARD_RULES_LEVEL, "mech-taser", "mech-taser").calcAlphaStrike().abilities).toContain("MTAS2");
    });
    it("shows the inferred CHF1 on a level 4 card without raising it", () => {
        const card = mech(EXPERIMENTAL_RULES_LEVEL, "chaff-pod").calcAlphaStrike();
        expect(card.abilities).toContain("CHF1");
        expect(card.rulesLevel).toBe(EXPERIMENTAL_RULES_LEVEL);
    });
    it("adds each Coolant Pod to the Alpha Strike dissipation", () => {
        const plain = mech(EXPERIMENTAL_RULES_LEVEL);
        plain.calcAlphaStrike();
        const pods = mech(EXPERIMENTAL_RULES_LEVEL, "coolant-pod", "coolant-pod");
        pods.calcAlphaStrike();
        expect(pods.getASCalcHTML()).toContain("Coolant Pods: 2");
    });
});

describe("#647 Taser play", () => {
    it("rolls the MTAS effect", () => {
        expect(getASTaserEffect("MTAS", "BM", [], 9)).toBe("interference");
        expect(getASTaserEffect("MTAS", "BA", [], 6)).toBe("shutdown");
        expect(getASTaserEffect("MTAS", "CI", [], 12)).toBe("none");
        expect(getASTaserEffect("MTAS", "BM", ["ABA"], 12)).toBe("none");
        expect(getASTaserEffect("ITAS", "BM", [], 8)).toBe("shutdown");
        expect(getASTaserEffect("ITAS", "CI", [], 2)).toBe("infantry-damage");
    });
    it("leaves interference that lasts this turn and the next; an Improved Taser adds heat", () => {
        const unit = makeUnitForTest();
        applyASTaserHit(unit, "interference", "MTAS");
        expect(unit.ewarPlay.tsempHit).toEqual({ effect: "interference", turnsLeft: 2 });
        const hot = makeUnitForTest();
        hot.currentHeat = 0;
        applyASTaserHit(hot, "interference", "ITAS");
        expect(hot.currentHeat).toBe(1);
    });
});
