import { describe, expect, it } from "vitest";
import { ASC_PILOT_ABILITIES, ASCE_ONLY_PILOT_ABILITIES, CONST_AS_PILOT_ABILITIES, getPilotAbilityForEdition } from "./alpha-strike-pilot-abilities";
import { CONST_AS_SPECIAL_ABILITIES, ESpecialAbilityType } from "./alpha-strike-special-abilities";

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
            // A Custom Homebrew ability of ours is in no book, so it has no page.
            ability.source.book.length > 0 && (ability.source.page > 0 || ability.type === ESpecialAbilityType.Custom)
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

describe("Alpha Strike pilot abilities by edition (#646)", () => {
    it("says where the 2013 edition finds every ability: the Companion list or the ASCE-only list", () => {
        const names = [...new Set(CONST_AS_PILOT_ABILITIES.map(ability => ability.ability))];
        const unplaced = names.filter(name => !(name in ASC_PILOT_ABILITIES) && !ASCE_ONLY_PILOT_ABILITIES.includes(name));
        expect(unplaced).toEqual([]);
        expect(names.filter(name => name in ASC_PILOT_ABILITIES && ASCE_ONLY_PILOT_ABILITIES.includes(name))).toEqual([]);
    });

    it("an ASCE-only ability is not offered under 2013 and is under the Commander's Edition", () => {
        const headhunter = CONST_AS_PILOT_ABILITIES.find(ability => ability.ability === "Headhunter")!;
        expect(getPilotAbilityForEdition(headhunter, "alpha-strike").offered).toBe(false);
        expect(getPilotAbilityForEdition(headhunter, "alpha-strike-commanders-edition").offered).toBe(true);
    });

    it("gives the Companion cost and page under 2013 where they differ", () => {
        const mimicry = CONST_AS_PILOT_ABILITIES.find(ability => ability.ability === "Animal Mimicry")!;
        expect(getPilotAbilityForEdition(mimicry, "alpha-strike")).toMatchObject({ cost: 2, offered: true, source: { book: "ASC", page: 51 } });
        expect(getPilotAbilityForEdition(mimicry, "alpha-strike-commanders-edition")).toMatchObject({ cost: 3, source: { book: "ASCE", page: 92 } });
    });

    it("the Companion drops nothing the Commander's Edition lacks, so no ability is carried forward as apocryphal", () => {
        expect(CONST_AS_PILOT_ABILITIES.filter(ability => getPilotAbilityForEdition(ability, "alpha-strike-commanders-edition").apocryphal)).toEqual([]);
    });
});

describe("Alpha Strike pilot abilities by edition: review fixes (#646)", () => {
    const find = (name: string, cost?: number) => CONST_AS_PILOT_ABILITIES.find(ability => ability.ability === name && (cost === undefined || ability.cost === cost))!;

    it("Iron Will costs 1 under both editions (Companion errata v1.1 to v1.6)", () => {
        expect(getPilotAbilityForEdition(find("Iron Will"), "alpha-strike").cost).toBe(1);
    });

    it("Terrain Master [Drag Racer] is 3 in the Companion and 1 in the Commander's Edition", () => {
        expect(getPilotAbilityForEdition(find("(Drag Racer)"), "alpha-strike")).toMatchObject({ cost: 3, source: { book: "ASC", page: 57 } });
        expect(getPilotAbilityForEdition(find("(Drag Racer)"), "alpha-strike-commanders-edition").cost).toBe(1);
    });

    it("each infantry ability is offered once under 2013 at the Companion cost", () => {
        for (const [name, cost] of [["Light Horseman", 2], ["Heavy Horse", 2], ["Foot Cavalry", 1], ["Urban Guerrilla", 1]] as const) {
            const offered = CONST_AS_PILOT_ABILITIES.filter(ability => ability.ability === name)
                .map(ability => getPilotAbilityForEdition(ability, "alpha-strike")).filter(result => result.offered);
            expect(offered.map(result => result.cost)).toEqual([cost]);
        }
    });
});
