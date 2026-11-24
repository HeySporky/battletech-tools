import { describe, expect, it } from "vitest";
import BattleArmor from "../classes/battle-armor";
import { BattleMech } from "../classes/battlemech";
import { BATTLE_ARMOR_SAMPLES } from "./battle-armor-samples";
import { buildBattleArmorMULRecords } from "./sample-mul";
import { ammoCatalog } from "./ammo";
import { ammoCustom } from "./ammo-custom";
import { ballisticCustom } from "./ballistic-custom";
import { miscCustom } from "./misc-custom";
import { getAmmoBattleValuePerTon, getCompatibleAmmo, getEquipmentCatalogById, getEquipmentCatalogDefinitions, getEquipmentCatalogs, getWeaponShotsPerTon } from "./equipment-registry";
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

// Pleiades Mechworks (u/PleiadesMechworks, #641): Autocannon/12 and its munitions.
describe("Pleiades Mechworks Autocannon/12 (Custom Homebrew)", () => {
    const ac12 = () => {
        const found = ballisticCustom.find((item) => item.tag === "custom-ac-12");
        if (!found) throw new Error("no record custom-ac-12");
        return found;
    };
    const ammo12 = (name: string) => {
        const found = ammoCustom.find((item) => item.tag === `ammo-custom-ac-12-${name}`);
        if (!found) throw new Error(`no record ammo-custom-ac-12-${name}`);
        return found;
    };
    const canonAmmo = (tag: string) => {
        const found = ammoCatalog.find((item) => item.tag === tag);
        if (!found) throw new Error(`no canon ${tag}`);
        return found;
    };

    it("carries the post numbers and is in no canon catalog", () => {
        const weapon = ac12();
        expect(weapon).toMatchObject({ damage: 12, heat: 4, weight: 13, cbills: 300000, battleValue: 142, prototype: 3020, introduced: 3020, shotsPerTon: 8, techBase: "is", catalog: "custom", rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL });
        expect(weapon.range).toEqual({ min: 0, short: 4, medium: 8, long: 12 });
        expect(weapon.space.battlemech).toBe(7);
        expect(weapon.notes).toContain("PleiadesMechworks");
        const canonLists = Object.values(getEquipmentCatalogs());
        expect(canonLists.some((list) => list.some((item) => item.tag === "custom-ac-12"))).toBe(false);
    });

    it("has standard ammunition: BV 18 and 10,000 C-bills a ton, 8 shots", () => {
        expect(ammo12("standard")).toMatchObject({ battleValue: 18, cbills: 10000, roundsPerTon: 8, introduced: 3020 });
    });

    it("has all seven AC/10 munitions, scaled from its standard round by the AC/10 ratios", () => {
        const standard10 = canonAmmo("ammo-ac-10-standard");
        const standard12 = ammo12("standard");
        const munitions: Array<[string, string]> = [
            ["armor-piercing", "ammo-is-ac-10-armor-piercing"], ["precision", "ammo-is-ac-10-precision"], ["flechette", "ammo-is-ac-10-flechette"],
            ["flak", "ammo-ac-10-flak"], ["tracer", "ammo-ac-10-tracer"], ["caseless", "ammo-is-ac-10-caseless"],
        ];
        for (const [name, canonTag] of munitions) {
            const canon = canonAmmo(canonTag);
            const mine = ammo12(name);
            expect(mine.cbills, name).toBe(Math.round(standard12.cbills * canon.cbills / standard10.cbills));
            expect(mine.roundsPerTon, name).toBe(Math.round(standard12.roundsPerTon! * canon.roundsPerTon! / standard10.roundsPerTon!));
            expect(mine.battleValue, name).toBe(standard12.battleValue);
            expect(mine.techRating, name).toBe(canon.techRating);
        }
    });
});

// Pleiades Mechworks (#641): Boosted Autocannon Rounds.
describe("Pleiades Mechworks Boosted Autocannon Rounds (Custom Homebrew)", () => {
    // weapon, standard ammo tag, boosted tag, [min, short, medium, long], extra heat, shots a ton, BV a ton
    const TABLE: Array<[string, string, string, [number, number, number, number], number, number, number]> = [
        ["AC/2", "ammo-ac-2-standard", "ammo-ac-2-boosted", [4, 10, 20, 30], 2, 22, 6],
        ["AC/5", "ammo-ac-5-standard", "ammo-ac-5-boosted", [3, 8, 16, 24], 2, 10, 12],
        ["AC/10", "ammo-ac-10-standard", "ammo-ac-10-boosted", [1, 7, 14, 21], 3, 5, 21],
        ["AC/12", "ammo-custom-ac-12-standard", "ammo-custom-ac-12-boosted", [1, 5, 10, 15], 4, 4, 22],
        // Not in the post: the AC/15 is the midway of the AC/10 and AC/20 rows (ours), like its other figures.
        ["AC/15", "ammo-ac-15-standard", "ammo-ac-15-boosted", [1, 5, 11, 16], 4, 3, 25],
        ["AC/20", "ammo-ac-20-standard", "ammo-ac-20-boosted", [1, 4, 8, 12], 5, 2, 29],
    ];
    const everyAmmo = [...ammoCatalog, ...ammoCustom];
    const record = (tag: string) => {
        const found = everyAmmo.find((item) => item.tag === tag);
        if (!found) throw new Error(`no record ${tag}`);
        return found;
    };

    it.each(TABLE)("%s boosted ammunition carries the post's bands, extra heat, shots and BV", (_name, standardTag, boostedTag, bands, extraHeat, shots, bv) => {
        const boosted = record(boostedTag);
        expect(boosted.ammoProfile?.range).toEqual({ min: bands[0], short: bands[1], medium: bands[2], long: bands[3] });
        expect(boosted.ammoProfile?.extraHeat).toBe(extraHeat);
        expect(boosted.roundsPerTon).toBe(shots);
        expect(boosted.isSpecialAmmo).toBe(true);
        expect(boosted).toMatchObject({ techBase: "is", catalog: "custom", rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL });
        expect(boosted.notes).toContain("PleiadesMechworks");
        // 6x the standard round, as the canon Precision round (36,000 against 6,000).
        expect(boosted.cbills).toBe(record(standardTag).cbills * 6);
        expect(boosted.introduced).toBeLessThan(3062);
        const weapon = [...ballisticCustom, ...getEquipmentCatalogs().is].find((item) => item.tag === (standardTag === "ammo-custom-ac-12-standard" ? "custom-ac-12" : { "ammo-ac-15-standard": "custom-ac-15", "ammo-ac-2-standard": "autocannon-standard-a", "ammo-ac-5-standard": "autocannon-standard-b", "ammo-ac-10-standard": "autocannon-standard-c", "ammo-ac-20-standard": "autocannon-standard-d" }[standardTag]));
        expect(weapon, "weapon").toBeTruthy();
        expect(getAmmoBattleValuePerTon(weapon!, boosted)).toBeCloseTo(bv, 5);
        expect(getCompatibleAmmo(weapon!, boosted)).toBe(true);
        expect(getWeaponShotsPerTon(weapon!, boosted)).toBe(shots);
    });
});

// Pleiades Mechworks (#641): the Personal ECM Suite record.
describe("Pleiades Mechworks Personal ECM Suite (Custom Homebrew)", () => {
    it("carries the post numbers: 0.5 t, 1 slot, 200,000 C-bills, defensive BV 20, Inner Sphere", () => {
        const found = miscCustom.find((item) => item.tag === "custom-personal-ecm");
        expect(found, "record").toBeTruthy();
        expect(found).toMatchObject({ weight: 0.5, cbills: 200000, battleValue: 20, battleValueDefensive: true, techBase: "is", catalog: "custom", rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL });
        expect(found!.space.battlemech).toBe(1);
        expect(found!.notes).toContain("PleiadesMechworks");
        // Dated from the Nighthawk battle armor ECM (2720) and rated as the Guardian ECM Suite.
        expect(found!.introduced).toBe(2720);
        expect(found!.techRating).toBe("e");
    });
});

// Pleiades Mechworks (#641): the Blue Saviour Dispersion Field record.
describe("Pleiades Mechworks Blue Saviour Dispersion Field (Custom Homebrew)", () => {
    it("is a 5 ton Inner Sphere prototype of 3151 spread over every location, explosive, 'Mechs only", () => {
        const found = miscCustom.find((item) => item.tag === "custom-blue-saviour");
        expect(found, "record").toBeTruthy();
        expect(found).toMatchObject({ weight: 5, techBase: "is", prototype: 3151, introduced: null, spreadLocations: "all", explosive: true, catalog: "custom", rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL });
        expect(found!.space.battlemech).toBe(8);
        for (const other of ["combatVehicle", "supportVehicle", "aerospaceFighter", "smallCraft", "dropShip", "protomech"] as const) expect(found!.space[other], other).toBe(-1);
        expect(found!.notes).toContain("PleiadesMechworks");
        expect(found!.notes).toContain("Taurian");
        expect(found!.cbills).toBe(1000000);
        expect(found!.techRating).toBe("e");
    });
});

// Pleiades Mechworks Hardsuit PA(L) and Hardsuit PA(L) VTOL battle armor (u/PleiadesMechworks, #640).
describe("Pleiades Mechworks Hardsuit battle armor (Custom Homebrew)", () => {
    const suit = (id: string): BattleArmor => {
        const sample = BATTLE_ARMOR_SAMPLES.find((entry) => entry.id === id);
        if (!sample) throw new Error(`no sample ${id}`);
        return new BattleArmor(JSON.stringify(sample.save));
    };

    it("loads the Hardsuit PA(L) as the sheet prints it", () => {
        const hardsuit = suit("hardsuit-pa-l");
        expect(hardsuit.getName()).toBe("Hardsuit PA(L)");
        expect(hardsuit.getTechBase()).toBe("is");
        expect(hardsuit.getWeightClass().tag).toBe("pa-l");
        expect(hardsuit.getSquadSize()).toBe(5);
        expect([hardsuit.getGroundMP(), hardsuit.getMotive(), hardsuit.getJumpMP()]).toEqual([3, "jump", 3]);
        expect(hardsuit.getItems().map((entry) => entry.tag).sort()).toEqual(["is-fuel-tank", "is-mission-equipment"]);
        expect(hardsuit.getItems().find((entry) => entry.tag === "is-mission-equipment")?.kg).toBe(45);
        expect(hardsuit.getArmorPoints()).toBe(2);
        expect(hardsuit.getEra().tag).toBe("star-league");
        // 400 kg: the PA(L) class full, as the sheet's 45 kg of storage is the room left.
        expect(hardsuit.getWeight()).toBe(400);
        expect(hardsuit.getIssues()).toEqual([]);
    });

    it("loads the Hardsuit PA(L) VTOL as Clan technology with VTOL 7 and 10 kg of storage", () => {
        const vtol = suit("hardsuit-pa-l-vtol");
        expect(vtol.getName()).toBe("Hardsuit PA(L) VTOL");
        expect(vtol.getTechBase()).toBe("clan");
        expect(vtol.getSquadSize()).toBe(5);
        expect([vtol.getGroundMP(), vtol.getMotive()]).toEqual([3, "vtol"]);
        expect(vtol.getMovementText()).toBe("Ground 3 / VTOL 7");
        expect(vtol.getItems().map((entry) => entry.tag)).toEqual(["clan-mission-equipment"]);
        expect(vtol.getItems()[0].kg).toBe(10);
        expect(vtol.getEra().tag).toBe("jihad");
    });

    it("prices them by our rules: Alpha Strike point values match the sheets' 9 and 12; the Battle Values do not, and are ours", () => {
        for (const sample of BATTLE_ARMOR_SAMPLES) {
            const printed = sample.sheet.split("/").map(Number);
            const built = suit(sample.id);
            expect(built.getAlphaStrikeStats().pointValue, sample.id).toBe(printed[1]);
            expect(built.getBattleValue(), sample.id).toBeGreaterThan(0);
            expect(built.getBattleValue(), sample.id).not.toBe(printed[0]);
            expect(built.getCBillCost(), sample.id).toBeGreaterThan(0);
        }
    });

    it("flags the VTOL as printed: 450 kg against the 400 kg of the PA(L) class", () => {
        expect(suit("hardsuit-pa-l-vtol").getIssues().join(" ")).toContain("over the 400 kg");
    });

    it("is offered by the roster's unit search from the custom unit list, credited to u/PleiadesMechworks", () => {
        const records = buildBattleArmorMULRecords();
        expect(records.map((record) => record.Name)).toEqual(["Hardsuit PA(L)", "Hardsuit PA(L) VTOL"]);
        for (const record of records) {
            expect(record.CustomInfo?.author).toBe("u/PleiadesMechworks");
            expect(record.Type?.Name).toBe("Battle Armor");
            expect(record.BFType).toBe("BA");
        }
        expect(records.map((record) => record.BFPointValue)).toEqual([9, 12]);
    });
});
