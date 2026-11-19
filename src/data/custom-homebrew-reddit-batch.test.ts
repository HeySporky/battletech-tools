import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { getEquipmentCatalogById, getEquipmentCatalogDefinitions, getEquipmentCatalogs } from "./equipment-registry";
import { energyCustom } from "./energy-custom";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import { findSpecialRuleset, getRulesetConflict } from "./special-rulesets";

// Custom Homebrew batch, chunk 6: the Superheavy PPC (u/FedditSuns, #265), the Fusion Lance (u/Magical_Savior, #263) and
// the Tandem Charge SRM house rule (u/Magical_Savior, #264).

const SUPERHEAVY_LINK = "https://www.reddit.com/r/battletech/comments/1bhfssf/";
const LANCE_LINK = "https://www.reddit.com/r/battletech/comments/1mhvhwp/";
const TANDEM_LINK = "https://www.reddit.com/r/battletech/comments/1jamkvn/";

const find = (tag: string) => {
    const found = energyCustom.find((item) => item.tag === tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found;
};

describe("Superheavy PPC and Fusion Lance (Custom Homebrew)", () => {
    it("each tag is in the energy custom catalog and in no canon catalog", () => {
        const definitions = getEquipmentCatalogDefinitions();
        const canonLists = Object.values(getEquipmentCatalogs());
        for (const tag of ["custom-superheavy-ppc", "custom-fusion-lance"]) {
            const holders = definitions.filter((d) => getEquipmentCatalogById(d.id)?.some((item) => item.tag === tag));
            expect(holders.length, tag).toBe(1);
            expect(holders[0].custom, `${tag} in ${holders[0].id}`).toBe(true);
            expect(canonLists.some((list) => list.some((item) => item.tag === tag)), tag).toBe(false);
        }
    });

    it("sit at Custom Homebrew and credit the author with the post's link", () => {
        expect(find("custom-superheavy-ppc").rulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(find("custom-superheavy-ppc").notes).toContain("u/FedditSuns");
        expect(find("custom-superheavy-ppc").notes).toContain(SUPERHEAVY_LINK);
        expect(find("custom-superheavy-ppc").notes).toContain("Inspired by");
        expect(find("custom-fusion-lance").rulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        for (const handle of ["u/Magical_Savior", "u/sokttocs"]) expect(find("custom-fusion-lance").notes).toContain(handle);
        expect(find("custom-fusion-lance").notes).toContain(LANCE_LINK);
        expect(find("custom-fusion-lance").notes).toContain("Inspired by");
    });

    it("Superheavy PPC: 13 tons, 5 slots, 20 damage, 20 heat, 3/6/12/18, 422 BV, 300,000 C-Bills, medium aero range", () => {
        const ppc = find("custom-superheavy-ppc");
        expect(ppc.weight).toBe(13);
        expect(ppc.space.battlemech).toBe(5);
        expect(ppc.damage).toBe(20);
        expect(ppc.heat).toBe(20);
        expect(ppc.range).toMatchObject({ min: 3, short: 6, medium: 12, long: 18 });
        expect(ppc.battleValue).toBe(422);
        expect(ppc.cbills).toBe(300000);
        expect(ppc.rangeAero).toBe("m");
        // The post gives no tech base or dates.
        // Not given in the post: the Heavy PPC's date, which it enlarges (derived-custom-values.ts).
        expect(ppc.introduced).toBe(3067);
        expect(ppc.notes).toMatch(/not given|unverified/i);
    });

    it("Fusion Lance: 4 tons, 2 slots, 30 heat, 3 hexes, 15 damage at the smallest engine; rules carry the engine mount and Supercharger roll", () => {
        const lance = find("custom-fusion-lance");
        expect(lance.weight).toBe(4);
        expect(lance.space.battlemech).toBe(2);
        expect(lance.heat).toBe(30);
        expect(lance.range.long).toBe(3);
        expect(lance.damage).toEqual({ short: 15, medium: 10, long: 5, aeroShort: 15, aeroMedium: 10, aeroLong: 5 });
        expect(lance.battleValue).toBe(30);
        expect(lance.cbills).toBe(39000);
        expect(lance.rules).toMatch(/Engine/);
        expect(lance.rules).toMatch(/Supercharger/);
        expect(lance.rules).toMatch(/10 plus 5/);
        expect(lance.notes).toMatch(/not given|unverified/i);
        expect(lance.variableFormula).toBe("fusion-lance");
    });

    it("Fusion Lance: damage, Battle Value and cost follow the 'Mech's engine (the formula, not a fixed figure)", () => {
        const sized = (tonnage: number, walk: number) => {
            const mech = new BattleMech();
            mech.setTech("is");
            mech.setEra("dark-ages");
            mech.setTonnage(tonnage);
            mech.setWalkSpeed(walk);
            return { rating: mech.getEngineRating(), item: mech.sizeEquipmentForUnit(find("custom-fusion-lance")) };
        };
        // A 50-ton 'Mech at walk 5 has a 250 engine: damage 10 + 5 x 3 = 25, over 3 hexes 25 + 20 + 15 = 60 BV.
        const medium = sized(50, 5);
        expect(medium.rating).toBe(250);
        expect(medium.item).toMatchObject({ damage: { short: 25, medium: 20, long: 15 }, battleValue: 60, cbills: 79000, weight: 4 });
        // A 100-ton 'Mech at walk 4 has a 400 engine: the top of the range, 30 damage, 30 + 25 + 20 = 75 BV.
        expect(sized(100, 4).item).toMatchObject({ damage: { short: 30, medium: 25, long: 20 }, battleValue: 75, cbills: 98000 });
        // A light 'Mech with a 100 engine: 15 damage, 30 BV.
        expect(sized(20, 5).item).toMatchObject({ damage: { short: 15, medium: 10, long: 5 }, battleValue: 30, cbills: 39000 });
    });

    it("a 'Mech carrying each has a finite Battle Value and counts the weapon's heat", () => {
        const build = () => {
            const mech = new BattleMech();
            mech.setTech("is");
            mech.setEra("dark-ages");
            mech.setTonnage(100);
            mech.setWalkSpeed(3);
            return mech;
        };
        const baseHeat = build().getWeaponHeat();
        for (const [tag, heat] of [["custom-superheavy-ppc", 20], ["custom-fusion-lance", 30]] as const) {
            const mech = build();
            expect(mech.addEquipmentFromTag(tag, "custom", "", false, undefined, "", false, [], undefined, undefined), tag).toBeTruthy();
            expect(Number.isFinite(mech.getBattleValue())).toBe(true);
            expect(mech.getWeaponHeat() - baseHeat, tag).toBe(heat);
            expect(mech.getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        }
    });
});

describe("Tandem Charge SRM house rule (Special Ruleset)", () => {
    const ruleset = () => {
        const found = findSpecialRuleset("tandem-charge-srm-house-rule");
        if (!found) throw new Error("no ruleset");
        return found;
    };

    it("is a Custom Homebrew ruleset crediting u/Magical_Savior and linking the post", () => {
        expect(ruleset().minRulesLevel).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(ruleset().source.title).toContain("u/Magical_Savior");
        expect(ruleset().source.url).toBe(TANDEM_LINK);
    });

    it("says what changes: half the shots, a free critical check by launcher size, vehicles and battle armor", () => {
        const text = ruleset().description;
        for (const part of ["half", "rounded up", "2D6", "12", "11", "10", "MML-9", "Hardened", "Ferro-Lamellor", "Inferno", "Inspired by"]) {
            expect(text, part).toContain(part);
        }
    });

    it("does not clash with the Future Wars play rulesets", () => {
        expect(getRulesetConflict(["fw-morale", "fw-weapon-malfunctions"], "tandem-charge-srm-house-rule")).toBeUndefined();
    });
});
