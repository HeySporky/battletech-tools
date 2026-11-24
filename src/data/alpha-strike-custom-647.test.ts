import { describe, expect, it } from "vitest";
import { getEquipmentCatalogDefinitions } from "./equipment-registry";
import { futureWarsSwingFires } from "./best-of-future-wars-conversions";
import { BattleMech } from "../classes/battlemech";
import type { IEquipmentItem } from "./data-interfaces";

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

// #647 Task 3: weapons that lost their Alpha Strike damage.
const record = (tag: string): IEquipmentItem => {
    for (const catalog of getEquipmentCatalogDefinitions()) {
        const found = catalog.equipment.find((item) => item.tag === tag);
        if (found) return found;
    }
    throw new Error(`no record ${tag}`);
};
const brackets = (item: IEquipmentItem) => [item.alphaStrike.rangeShort, item.alphaStrike.rangeMedium, item.alphaStrike.rangeLong];

describe("#647 Swing Fire racks play as the base rack", () => {
    it("copies the base rack's block and adds the Ours note, for every Swing Fire record", () => {
        for (const swing of futureWarsSwingFires()) {
            const base = record(swing.conversion!.baseTag!);
            const mine = record(swing.tag);
            expect(brackets(mine), swing.tag).toEqual(brackets(base));
            expect(mine.alphaStrike.specialAbility ?? [], swing.tag).toEqual(base.alphaStrike.specialAbility ?? []);
            expect(mine.alphaStrike.notes?.some((note) => note.startsWith("Ours (NGCFells, 2026-11-22, #647)")), swing.tag).toBe(true);
            expect(brackets(mine).some((value) => value > 0) || (mine.alphaStrike.specialAbility ?? []).length > 0, swing.tag).toBe(true);
        }
    });
    it("keeps the LRM and SRM keywords", () => {
        expect(record("custom-swing-fire-lrm-10").alphaStrike.notes?.join(" ")).toContain("LRM");
        expect(record("custom-swing-fire-srm-6").alphaStrike.notes?.join(" ")).toContain("SRM");
    });
});

describe("#647 weapons with a conversion of their own", () => {
    it("converts the EII PDS to AMS with machine-gun damage", () => {
        const pds = record("custom-eii-pds").alphaStrike;
        expect(pds.specialAbility).toEqual(["AMS"]);
        expect(pds.rangeShort).toBe(0.4);
        expect(pds.heat).toBe(1);
    });
    it("converts the Penitrator by its dice and minimum range", () => {
        expect(brackets(record("custom-penitrator"))).toEqual([0.15, 0.35, 0.25]);
        expect(record("custom-penitrator").alphaStrike.rangeExtreme).toBe(0.25);
    });
    it("gives the pile bunker MEL", () => {
        for (const tag of ["custom-pile-bunker"]) {
            expect(record(tag).alphaStrike.specialAbility, tag).toEqual(["MEL"]);
        }
    });
    it("keeps INARC on the ER iNarc, under an Ours note", () => {
        const narc = record("custom-er-inarc").alphaStrike;
        expect(narc.specialAbility).toEqual(["INARC"]);
        expect(narc.notes?.[0].startsWith("Ours")).toBe(true);
    });
    it("states that the laser arrays are carried by their linked lasers", () => {
        expect(record("custom-small-laser-array").alphaStrike.noConversion).toBe("carried-by-linked-weapons");
        expect(record("custom-medium-laser-array").alphaStrike.noConversion).toBe("carried-by-linked-weapons");
    });
    it("a 'Mech with a Medium Laser Array and three Medium Lasers converts as the same 'Mech without the array", () => {
        const build = (withArray: boolean) => {
            const mech = new BattleMech();
            mech.setTonnage(50);
            for (let i = 0; i < 3; i++) mech.addEquipmentFromTag("medium-laser", "is", "ra", false, undefined, "", false, [], undefined, undefined);
            if (withArray) mech.addEquipmentFromTag("custom-medium-laser-array", "is", "ra", false, undefined, "", false, [], undefined, undefined);
            const card = mech.calcAlphaStrike();
            return [card.damage.short, card.damage.medium, card.damage.long];
        };
        expect(build(true)).toEqual(build(false));
    });
});

// #76: the RISC Laser Pulse Module lasers (IO:AE p.197: the effects are factored into heat and damage).
describe("#76 RISC Laser Pulse Module lasers convert", () => {
    // Alpha Strike Companion, Weapon Conversion Table, Inner Sphere Standard Weapons (continued), pp.106-107.
    const printed: [string, number, number[], boolean][] = [
        ["small-laser-risc-pulse-module", 3, [0.315, 0, 0], true],
        ["medium-laser-risc-pulse-module", 5, [0.525, 0.525, 0], false],
        ["large-laser-risc-pulse-module", 10, [0.84, 0.84, 0], false],
        ["er-small-laser-risc-pulse-module", 4, [0.315, 0.315, 0], true],
        ["er-medium-laser-risc-pulse-module", 7, [0.525, 0.525, 0], false],
        ["er-large-laser-risc-pulse-module", 14, [0.84, 0.84, 0.84], false],
    ];
    it("the RISC pulse module lasers carry the printed Companion heat, damage and Point Defense", () => {
        for (const [tag, heat, damage, pointDefense] of printed) {
            const mod = record(tag);
            expect(mod.alphaStrike.notes?.some((n) => n.startsWith("Unresolved")), tag).toBeFalsy();
            expect(mod.alphaStrike.heat, tag).toBe(heat);
            expect(brackets(mod), tag).toEqual(damage);
            expect(mod.alphaStrike.notes?.includes("Point Defense") ?? false, tag).toBe(pointDefense);
        }
    });
});
