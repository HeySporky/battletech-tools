import { describe, expect, it } from "vitest";
import { DEFAULT_RULES_EDITION, btRulesEditions, getEditionStats } from "./rules-editions";
import { SKILL_MULTIPLIERS_BY_EDITION, formatBattleValue, getBattleValueFor, getBattleValueForceRules, getBattleValueRules, getBattleValueSkillEdition, getEditionSkillMultipliers, getEditionsWithSkillMultipliers, getItemBattleValue, getPrintedItemBattleValue, getSkillMultiplier } from "./battle-value";
import { equipmentArtillery } from "./equipment-artillery";
import { equipmentBallistic } from "./equipment-ballistic";
import { equipmentEnergy } from "./equipment-energy";
import { equipmentMisc } from "./equipment-misc";
import { equipmentMissile } from "./equipment-missile";

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
        expect(getEditionsWithSkillMultipliers()).toEqual(["master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"]);
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

describe("Battle Value rules by rules edition", () => {
    it("reads each edition's scheme, falling back to the newest edition before it that has one", () => {
        expect(getBattleValueRules("battletech-4th-edition", "mech").scheme).toBe("none");
        expect(getBattleValueRules("master-rules", "mech")).toMatchObject({ scheme: "bv1", source: expect.stringContaining("pp.139-145") });
        expect(getBattleValueRules("master-rules", "protomech").scheme).toBe("none");
        // Each Maximum Tech printing goes with the Master Rules edition it was written for.
        expect(getBattleValueRules("master-rules", "mech").levelThree?.source).toBe("Maximum Tech (FASA) pp.90-92");
        expect(getBattleValueRules("master-rules-revised", "mech").levelThree?.source).toBe("Maximum Tech, Revised pp.90-92");
        expect(getBattleValueRules("master-rules", "vehicle").levelThree?.source).toBe("Maximum Tech (FASA) pp.90-92");
        expect(getBattleValueRules("master-rules-revised", "fighter").source).toContain("AeroTech 2, Revised Edition");
        expect(getBattleValueRules("classic-battletech-box-set", "mech")).toBe(getBattleValueRules("master-rules-revised", "mech"));
        expect(getBattleValueRules("total-warfare", "vehicle").scheme).toBe("bv2");
        expect(getBattleValueRules("core-rulebook", "mech")).toBe(getBattleValueRules("total-warfare", "mech"));
        expect(getBattleValueRules("toString", "mech")).toBe(getBattleValueRules("total-warfare", "mech"));
    });

    it("runs BV2 until a unit type's BV1 is entered", () => {
        const methods = { bv2: () => 2 };
        expect(getBattleValueFor("total-warfare", "mech", methods)).toBe(2);
        expect(getBattleValueFor("master-rules", "mech", methods)).toBe(2);
        expect(getBattleValueFor("battletech-4th-edition", "mech", methods)).toBe(2);
    });

    it("formats the selected edition's BV with BV2 beside it (plan ruling 1)", () => {
        const battleValue = (edition: string) => edition === "total-warfare" ? 1456 : 1234;
        expect(formatBattleValue(battleValue, "mech", "total-warfare")).toBe("1,456");
        expect(formatBattleValue(battleValue, "mech", "battletech-4th-edition")).toBe("— (BV2: 1,456)");
        expect(formatBattleValue(battleValue, "mech", "master-rules")).toBe("1,234 (BV2: 1,456)");
        // Small Craft BV1 is not entered yet, so a force with Small Craft shows no BV1 figure; fighter BV1 is (#599).
        expect(formatBattleValue(battleValue, ["mech", "small-craft"], "master-rules")).toBe("— (BV2: 1,456)");
        expect(formatBattleValue(battleValue, ["mech", "fighter"], "master-rules")).toBe("1,234 (BV2: 1,456)");
        // A force total: BV2 when every unit type in it is BV2, and no BV1 figure until every one has one.
        expect(formatBattleValue(battleValue, ["mech", "vehicle"], "total-warfare")).toBe("1,456");
        expect(formatBattleValue(battleValue, ["mech", "protomech"], "master-rules")).toBe("— (BV2: 1,456)");
    });

    it("reads each edition's force adjustments: TM/v4.1 with the TO:AUE addendum, and the Core Rulebook's own C3", () => {
        const tw = getBattleValueForceRules("total-warfare");
        expect(tw).toMatchObject({ externalStores: true, c3: { kind: "network", percent: 5, boostedPercent: 7 } });
        expect(tw?.tagAmmo).toEqual(expect.arrayContaining(["ammo-is-lrm-semi-guided", "ammo-is-arrow-iv-homing", "ammo-thumper-copperhead"]));
        expect(getBattleValueForceRules("battlemech-manual")).toBe(tw);
        expect(getBattleValueForceRules("core-rulebook")).toMatchObject({ c3: { kind: "per-unit", twoUnits: 10, perExtraUnit: 5, cap: 40, boostedFlat: 5 } });
        expect(getBattleValueForceRules("core-rulebook")?.externalStores).toBeFalsy();
        // BV1: the Revised Edition's note A lets a C3 master guide homing missiles, the Master Rules' does not.
        expect(getBattleValueForceRules("master-rules")).toMatchObject({ c3: { kind: "weapons", percent: 35 }, homingTag: { bonus: 200 } });
        expect(getBattleValueForceRules("master-rules")?.homingTag?.designators).not.toContain("c3-computer-master");
        expect(getBattleValueForceRules("master-rules-revised")?.homingTag?.designators).toContain("c3-computer-master");
        expect(getBattleValueForceRules("classic-battletech-box-set")).toBe(getBattleValueForceRules("master-rules-revised"));
        expect(getBattleValueForceRules("battletech-4th-edition")).toBeUndefined();
    });

    it("pairs each BV with its skill table: the edition's own for BV1, the TechManual's for BV2 (plan ruling 2)", () => {
        expect(getBattleValueSkillEdition("total-warfare", "mech")).toBe(DEFAULT_RULES_EDITION);
        expect(getBattleValueSkillEdition("core-rulebook", "mech")).toBe(DEFAULT_RULES_EDITION);
        expect(getBattleValueSkillEdition("master-rules", "mech")).toBe("master-rules");
        // The box set reads BMR(R)'s BV1 and table; vehicle BV1 is not entered yet, so it shows BV2 with the TM table.
        expect(getBattleValueSkillEdition("classic-battletech-box-set", "mech")).toBe("master-rules-revised");
        expect(getBattleValueSkillEdition("master-rules", "vehicle")).toBe("master-rules");
        expect(getBattleValueSkillEdition("master-rules", "fighter")).toBe("master-rules");
        expect(getBattleValueSkillEdition("master-rules", "small-craft")).toBe(DEFAULT_RULES_EDITION);
    });
});

describe("BV1 equipment values (BMR pp.142-144; BMR(R) pp.156-158)", () => {
    const weapons = [...equipmentEnergy, ...equipmentBallistic, ...equipmentMissile, ...equipmentArtillery];
    const record = (tag: string) => [...weapons, ...equipmentMisc].find((item) => item.tag === tag)!;

    it("reads the BV and ammo BV per ton each Master Rules edition prints, and the catalog's BV2 otherwise", () => {
        expect(getItemBattleValue(record("clan-er-large-laser"), "master-rules")).toBe(249);
        expect(getItemBattleValue(record("clan-er-large-laser"), "total-warfare")).toBe(248);
        expect(getItemBattleValue(record("standard-gauss-rifle"), "master-rules-revised", "ammoBattleValue")).toBe(37);
        expect(getItemBattleValue(record("clan-gauss-rifle"), "master-rules", "ammoBattleValue")).toBe(33);
        expect(getItemBattleValue(record("long-tom-artillery"), "master-rules-revised")).toBe(171);
        expect(getItemBattleValue(record("clan-ams"), "master-rules")).toBe(63);
        expect(getItemBattleValue(record("lrm-20-os"), "master-rules")).toBe(36);
        expect(getItemBattleValue(record("clan-lrm-10-artemis-iv"), "master-rules-revised")).toBeCloseTo(130.8);
        // The box set reads BMR(R); BMR prints no Rotary AC, so BV2's figure stands there.
        expect(getItemBattleValue(record("rotary-ac-5"), "classic-battletech-box-set")).toBe(247);
        expect(getItemBattleValue(record("rotary-ac-5"), "master-rules-revised", "ammoBattleValue")).toBe(31);
        expect(getItemBattleValue(record("gauss-rifle-heavy"), "master-rules-revised")).toBe(346);
    });

    it("reads Maximum Tech's Level 3 values (p.90) under both Master Rules editions, Artemis V at the launcher's x 1.3", () => {
        expect(getItemBattleValue(record("er_large_pulse_laser"), "master-rules-revised")).toBe(271);
        // The FASA printing (written for the 1998 Master Rules, p.90) prints the same table (NGCFells's ruling 2026-11-10).
        expect(getItemBattleValue(record("er_large_pulse_laser"), "master-rules")).toBe(271);
        expect(getItemBattleValue(record("er_large_pulse_laser"), "total-warfare")).toBe(272);
        expect(getItemBattleValue(record("thunderbolt-15"), "master-rules-revised", "ammoBattleValue")).toBe(26);
        expect(getItemBattleValue(record("thunderbolt-15-os"), "master-rules-revised")).toBe(46);
        expect(getItemBattleValue(record("long-tom-cannon"), "classic-battletech-box-set")).toBe(348);
        // Grenade Launcher: 1 in the Inner Sphere and the Clan table of both printings (page images).
        for (const edition of ["master-rules", "master-rules-revised"]) {
            expect(getItemBattleValue(record("vehicular-grenade-launcher"), edition), edition).toBe(1);
            expect(getItemBattleValue(record("vehicular-grenade-launcher"), edition, "battleValue", true), edition).toBe(1);
        }
        expect(getItemBattleValue(record("clan-lrm-10-artemis-v"), "master-rules-revised")).toBeCloseTo(141.7);
    });

    it("gives torpedoes the BV of the missile launcher of their range (user ruling, 2026-11-03)", () => {
        expect(getItemBattleValue(record("lrt-15"), "master-rules")).toBe(136);
        expect(getItemBattleValue(record("srt-6"), "master-rules-revised", "ammoBattleValue")).toBe(7);
        expect(getItemBattleValue(record("clan-lrt-20-os"), "master-rules")).toBe(44);
        expect(getItemBattleValue(record("clan-srt-2"), "master-rules-revised")).toBe(21);
    });

    it("has a BV for every weapon each Master Rules edition includes, melee weapons aside", () => {
        // Hatchet and sword BVs come from their damage (BMR p.143); Maximum Tech's Level 3 items (Laser AMS, Streak LRM, Artemis V) read p.90.
        const unprinted = /^melee-/;
        for (const edition of ["master-rules", "master-rules-revised"]) {
            const missing = weapons
                .filter((item) => item.editionStats && edition in item.editionStats && !unprinted.test(item.tag) && getEditionStats(item, edition)?.battleValue === undefined && getPrintedItemBattleValue(item, edition) === undefined)
                .map((item) => item.tag);
            expect(missing, edition).toEqual([]);
        }
    });
});
