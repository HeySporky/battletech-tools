import { describe, expect, it } from "vitest";
import { btRulesEditions } from "./rules-editions";
import { SKILL_MULTIPLIERS_BY_EDITION, getEditionSkillMultipliers, getEditionsWithSkillMultipliers, getSkillMultiplier } from "./skill-multipliers";

describe("Battle Value skill multipliers by rules edition", () => {
    it("only lists editions that exist, each with a square table whose Gunnery 4 / Piloting 5 entry is 1", () => {
        const known = btRulesEditions.map((edition) => edition.tag);
        for (const [tag, multipliers] of Object.entries(SKILL_MULTIPLIERS_BY_EDITION)) {
            expect(known, tag).toContain(tag);
            expect(multipliers.table[4][5], tag).toBe(1);
            for (const row of multipliers.table) expect(row.length, tag).toBe(multipliers.table.length);
            // Better skills never cost less.
            for (let gunnery = 0; gunnery < multipliers.table.length; gunnery++) {
                for (let piloting = 1; piloting < multipliers.table.length; piloting++) {
                    expect(multipliers.table[gunnery][piloting], `${tag} ${gunnery}/${piloting}`).toBeLessThanOrEqual(multipliers.table[gunnery][piloting - 1]);
                    expect(multipliers.table[piloting][gunnery], `${tag} ${piloting}/${gunnery}`).toBeLessThanOrEqual(multipliers.table[piloting - 1][gunnery]);
                }
            }
        }
        expect(getEditionsWithSkillMultipliers()).toEqual(["master-rules", "master-rules-revised", "total-warfare", "core-rulebook"]);
    });

    it("uses the TechManual's current table by default (TM p.315; Core Rulebook p.222)", () => {
        expect(getSkillMultiplier(4, 5)).toBe(1);
        expect(getSkillMultiplier(0, 0)).toBe(2.42);
        expect(getSkillMultiplier(3, 4)).toBe(1.32);
        expect(getSkillMultiplier(4, 3)).toBe(1.2);
        expect(getSkillMultiplier(8, 8)).toBe(0.64);
        expect(getSkillMultiplier(2, 3, "vehicle", "core-rulebook")).toBe(1.68);
        expect(getSkillMultiplier(9, 5)).toBeNull();
        expect(getSkillMultiplier(4, -1)).toBeNull();
    });

    it("uses the Master Rules table for skills 0 to 7 (BMR p.144, BMR Revised p.158)", () => {
        expect(getSkillMultiplier(0, 0, "mech", "master-rules")).toBe(2.05);
        expect(getSkillMultiplier(3, 4, "mech", "master-rules-revised")).toBe(1.25);
        expect(getSkillMultiplier(7, 7, "vehicle", "master-rules")).toBe(0.6);
        expect(getSkillMultiplier(8, 5, "mech", "master-rules")).toBeNull();
    });

    it("reads the 5 column for the unit types each edition gives no second skill", () => {
        // TechManual p.314: ProtoMechs and mechanized infantry.
        expect(getSkillMultiplier(3, 2, "protomech")).toBe(1.2);
        expect(getSkillMultiplier(3, 8, "mechanized-infantry")).toBe(1.2);
        // Other infantry and battle armor use their Anti-'Mech Skill.
        expect(getSkillMultiplier(4, 8, "infantry")).toBe(0.85);
        expect(getSkillMultiplier(3, 4, "battle-armor")).toBe(1.32);
        // Master Rules: "infantry units have no Piloting Skill; simply use the 5 column".
        expect(getSkillMultiplier(3, 2, "infantry", "master-rules")).toBe(1.2);
        expect(getSkillMultiplier(3, 2, "battle-armor", "master-rules-revised")).toBe(1.2);
        // ProtoMechs are in the Revised Edition only; the 1998 book has no rule for them.
        expect(getEditionSkillMultipliers("master-rules-revised")?.fixedColumnUnitTypes).toContain("protomech");
        expect(getEditionSkillMultipliers("master-rules")?.fixedColumnUnitTypes).not.toContain("protomech");
    });

    it("has no multipliers for the editions before the Battle Value system, or for an unknown edition", () => {
        for (const tag of ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "battletech-4th-edition"]) {
            expect(getSkillMultiplier(3, 4, "mech", tag), tag).toBeNull();
        }
        expect(getSkillMultiplier(3, 4, "mech", "toString")).toBeNull();
        expect(getEditionSkillMultipliers("__proto__")).toBeNull();
    });
});
