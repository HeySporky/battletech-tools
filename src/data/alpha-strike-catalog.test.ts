import { describe, expect, it } from "vitest";
import { CONST_AS_PILOT_ABILITIES } from "./alpha-strike-pilot-abilities";
import { CONST_AS_SPECIAL_ABILITIES } from "./alpha-strike-special-abilities";

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

describe("Alpha Strike catalogs", () => {
    it("keeps every special ability source and unique tag valid", () => {
        const tags = CONST_AS_SPECIAL_ABILITIES.map(ability => ability.tag);

        expect(new Set(tags).size).toBe(tags.length);
        expect(CONST_AS_SPECIAL_ABILITIES.every(ability =>
            ability.source.book.length > 0 && ability.source.page > 0
        )).toBe(true);
        expect(tags).toContain("FLK#/#/#/#");
        expect(tags).toContain("MSL#/#/#/#");
    });

    it("keeps pilot ability ids and sources unique and complete", () => {
        const ids = CONST_AS_PILOT_ABILITIES.map(ability => ability.id);

        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toEqual(Array.from({ length: ids.length }, (_, index) => index + 1));
        expect(CONST_AS_PILOT_ABILITIES.every(ability =>
            ability.source.book.length > 0 && ability.source.page >= 0
        )).toBe(true);
        expect(CONST_AS_PILOT_ABILITIES
            .filter(ability => ability.source.book === "ASCE")
            .filter(ability => ability.ability !== "Goshen Grad")
            .every(ability => ability.source.page > 0)
        ).toBe(true);
    });
});