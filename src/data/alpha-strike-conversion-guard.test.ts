import { describe, expect, it } from "vitest";
import { getAlphaStrikeEquipmentAbilityCodes, getEquipmentCatalogDefinitions } from "./equipment-registry";
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

/**
 * #647 guard: every Custom Homebrew (6) and Munchkin (7) record, and every record still marked "not yet looked up",
 * converts to Alpha Strike or states a reason (alphaStrike.noConversion). The 2026-11-22 sweep's pending list is
 * empty: every tag it found converts or states a reason.
 */
const all: IEquipmentItem[] = (() => {
    const byTag = new Map<string, IEquipmentItem>();
    for (const catalog of getEquipmentCatalogDefinitions()) {
        for (const item of catalog.equipment) {
            if (!byTag.has(item.tag)) byTag.set(item.tag, item);
        }
    }
    return [...byTag.values()];
})();

const NOT_LOOKED_UP = /not yet looked up/;
const BANNED = /no Alpha Strike (conversion|effect)|^Unverified custom equipment$|not yet looked up/i;

function inScope(item: IEquipmentItem): boolean {
    return (item.rulesLevel ?? 0) >= 6 || (item.alphaStrike?.notes ?? []).some((note) => NOT_LOOKED_UP.test(note));
}

function damageSum(item: IEquipmentItem): number {
    const as = item.alphaStrike;
    return as.rangeShort + as.rangeMedium + as.rangeLong + as.rangeExtreme;
}

function passes(item: IEquipmentItem): boolean {
    const as = item.alphaStrike;
    return getAlphaStrikeEquipmentAbilityCodes(item).length > 0 || damageSum(item) > 0 || Boolean(as?.munition) || Boolean(as?.noConversion);
}

describe("Alpha Strike conversion guard (#647)", () => {
    it("every custom, Munchkin and unresolved record converts or states a reason", () => {
        const offenders = all
            .filter(inScope)
            .filter((item) => !passes(item))
            .map((item) => item.tag);
        expect(offenders).toEqual([]);
    });

    it("no record keeps a banned Alpha Strike note", () => {
        const flagged = all
            .filter((item) => item.alphaStrike?.notes?.some((note) => BANNED.test(note)))
            .map((item) => item.tag);
        expect(flagged).toEqual([]);
    });
});

import homebrewReadout from "../../docs/lore/homebrew-equipment-tro.md?raw";
import futureWarsReadout from "../../docs/lore/best-of-future-wars-tro.md?raw";
import ammunitionReadout from "../../docs/lore/ammunition-tro.md?raw";

describe("Alpha Strike lines in the TRO sections (#647)", () => {
    const names = all.filter((item) => (item.rulesLevel ?? 0) >= 6 && item.name.length >= 6).map((item) => item.name);
    const docs: [string, string][] = [["homebrew", homebrewReadout], ["best of future wars", futureWarsReadout], ["ammunition", ammunitionReadout]];
    it("every section that names a level 6-7 record says what it does in Alpha Strike", () => {
        const missing: string[] = [];
        for (const [doc, text] of docs) {
            for (const section of text.split(/\r?\n## /).slice(1)) {
                const heading = section.split(/\r?\n/)[0];
                if (names.some((name) => section.includes(name)) && !section.includes("Alpha Strike")) missing.push(`${doc}: ${heading}`);
            }
        }
        expect(missing.join(" | ")).toBe("");
    });
});
