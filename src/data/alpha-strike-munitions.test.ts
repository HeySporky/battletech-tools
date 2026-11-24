import { describe, expect, it } from "vitest";
import { AS_MUNITIONS, canUseASMunition, getASMunition } from "./alpha-strike-munitions";
import { getEquipmentCatalogDefinitions } from "./equipment-registry";
import type { IEquipmentItem } from "./data-interfaces";
import { getASEWarToHit } from "../utils/alpha-strike-ewar-play";

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

// #647 Task 6: the ASCE Alternate Munitions table and the records that play as its rows.
const all = (() => {
    const byTag = new Map<string, IEquipmentItem>();
    for (const catalog of getEquipmentCatalogDefinitions()) for (const item of catalog.equipment) if (!byTag.has(item.tag)) byTag.set(item.tag, item);
    return byTag;
})();
const rec = (tag: string): IEquipmentItem => {
    const found = all.get(tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found;
};

describe("ASCE alternate munitions table", () => {
    const row = (key: string) => AS_MUNITIONS.find((munition) => munition.key === key)!;
    it("holds the printed modifiers and required specials", () => {
        expect(row("ac-armor-piercing")).toMatchObject({ toHit: 1, requires: ["AC"] });
        expect(row("ac-flak").toHit).toBe(-2);
        expect(row("ac-precision").toHit).toBe(-2);
        expect(row("msl-semi-guided")).toMatchObject({ toHit: -2, requires: ["LRM"] });
        expect(row("msl-heat-seeking")).toMatchObject({ toHit: -2, requires: ["LRM", "SRM"] });
        for (const munition of AS_MUNITIONS.filter((each) => !each.custom)) expect(munition.page).toBeGreaterThanOrEqual(143);
    });
    it("shows our own rows only at levels 6-7", () => {
        expect(getASMunition("emp", 5)).toBeUndefined();
        expect(getASMunition("emp", 6)).toBeDefined();
        expect(getASMunition("art-cluster", 5)).toBeDefined();
    });
    it("needs the required special", () => {
        expect(canUseASMunition(row("msl-semi-guided"), ["IF1", "SRM1/1"])).toBe(false);
        expect(canUseASMunition(row("msl-semi-guided"), ["LRM1/1/1"])).toBe(true);
        expect(canUseASMunition(row("art-cluster"), ["HAIL"])).toBe(true);
    });
});

describe("ammunition records", () => {
    it("every canon AC round plays as its ASCE row, light ACs and the AC/12 included", () => {
        for (const size of [2, 5, 10, 20]) {
            expect(rec(`ammo-is-ac-${size}-armor-piercing`).alphaStrike.munition).toBe("ac-armor-piercing");
            expect(rec(`ammo-ac-${size}-flak`).alphaStrike.munition).toBe("ac-flak");
            expect(rec(`ammo-is-ac-${size}-precision`).alphaStrike.munition).toBe("ac-precision");
        }
        expect(rec("ammo-is-light-ac-5-tracer").alphaStrike.munition).toBe("ac-tracer");
        expect(rec("ammo-custom-ac-12-flechette").alphaStrike.munition).toBe("ac-flechette");
    });
    it("settles the custom rounds", () => {
        expect(rec("ammo-ac-10-sabot").alphaStrike.munition).toBe("ac-armor-piercing");
        expect(rec("ammo-ac-10-sabot").alphaStrike.notes?.join(" ")).toContain("Ours");
        expect(rec("ammo-is-lrm-emp").alphaStrike.munition).toBe("emp");
        expect(rec("ammo-ac-2-boosted").alphaStrike.munition).toBe("boosted");
        expect(rec("ammo-is-gauss-rifle-vhe").alphaStrike.munition).toBe("vhe");
        expect(rec("ammo-is-gauss-rifle-inferno").alphaStrike.munition).toBe("gauss-inferno");
        expect(rec("ammo-hailstorm-cluster").alphaStrike.munition).toBe("art-cluster");
        expect(rec("ammo-is-thunderbolt-10-semi-guided").alphaStrike.munition).toBe("msl-semi-guided");
    });
    it("states a reason where there is no round", () => {
        for (const tag of ["ammo-hailstorm-fae", "ammo-machine-gun-ap", "ammo-is-rotary-ac-2-caseless", "ammo-is-thunderbolt-5-narc-capable"]) {
            expect(rec(tag).alphaStrike.noConversion, tag).toBe("no-alpha-strike-munition");
        }
        expect(rec("ammo-lb-15x-cluster").alphaStrike.noConversion).toBe("carried-by-weapon");
        expect(rec("ammo-ac-15-standard").alphaStrike.noConversion).toBe("standard-ammunition");
    });
});

describe("munition play", () => {
    const unit = (abilities: string[], munition: string) => ({
        uuid: "m1", abilities, type: "BM", isInfantry: false, isAerospace: false, rulesLevel: 6, munition, ewarPlay: {}, isWrecked: () => false,
    });
    it("adds the Armor-Piercing modifier line", () => {
        const result = getASEWarToHit(unit(["AC2/2/0"], "ac-armor-piercing"), { hj: false, nc3Up: false }, "alpha-strike-commanders-edition", false);
        expect(result.labels.join(" ")).toContain("+1 Armor-Piercing ammo (ASCE p.145)");
        expect(result.short).toBe(1);
    });
    it("adds no modifier for Semi-Guided without the LRM special, and says it needs LRM", () => {
        const result = getASEWarToHit(unit(["SRM1/1"], "msl-semi-guided"), { hj: false, nc3Up: false }, "alpha-strike-commanders-edition", false);
        expect(result.short).toBe(0);
        expect(result.labels.join(" ")).toContain("needs LRM");
    });
});
