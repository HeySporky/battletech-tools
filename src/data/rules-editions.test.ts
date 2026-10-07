import { describe, expect, it } from "vitest";
import { IEditionHistory, IEditionStats } from "./data-interfaces";
import { getEquipmentCatalogDefinitions } from "./equipment-registry";
import { mechArmorTypes } from "./mech-armor-types";
import { mechCockpitTypes } from "./mech-cockpit-types";
import { mechEngineOptions } from "./mech-engine-options";
import { mechEngineTypes, mechLargeEngineTypes } from "./mech-engine-types";
import { mechGyroTypes } from "./mech-gyro-types";
import { mechHeatSinkTypes } from "./mech-heat-sink-types";
import { mechInternalStructureTypes } from "./mech-internal-structure-types";
import { mechJumpJetTypes } from "./mech-jump-jet-types";
import { mechMyomerTypes } from "./mech-myomer-types";
import { btMechTonnages } from "./mech-tonnages";
import { mechTypeOptions } from "./mech-type-options";
import { DEFAULT_RULES_EDITION, getEditionStats, getIntroducedInEdition, getRulesEditions, isInRulesEdition } from "./rules-editions";

// Every record that can carry an edition history, labelled so a failure says where to look.
const equipment = getEquipmentCatalogDefinitions().flatMap(definition => definition.equipment);
const sets: [string, (IEditionHistory & { tag?: string; tons?: number })[]][] = [
    ["equipment", equipment],
    ["engine", [...mechEngineTypes, ...mechLargeEngineTypes]],
    ["gyro", mechGyroTypes],
    ["cockpit", mechCockpitTypes],
    ["heat sink", mechHeatSinkTypes],
    ["jump jet", mechJumpJetTypes],
    ["armor", mechArmorTypes],
    ["structure", mechInternalStructureTypes],
    ["myomer", mechMyomerTypes],
    ["tonnage", btMechTonnages],
    ["mech type", mechTypeOptions],
];
const labelled = sets.flatMap(([set, records]) => records.map(record => ({ label: `${set} ${record.tag ?? record.tons}`, record })));
const inEdition = (tag: string) => labelled.filter(entry => entry.record.editionStats && tag in entry.record.editionStats).map(entry => entry.label).sort();

describe("Rules editions", () => {
    it("lists editions oldest first, with unique tags, and includes the default", () => {
        const editions = getRulesEditions();
        expect(editions.map(edition => edition.year)).toEqual([...editions.map(edition => edition.year)].sort((a, b) => a - b));
        expect(new Set(editions.map(edition => edition.tag)).size).toBe(editions.length);
        expect(new Set(editions.map(edition => edition.book)).size).toBe(editions.length);
        expect(editions.some(edition => edition.tag === DEFAULT_RULES_EDITION)).toBe(true);
    });

    // CRB p.247 lists the core rulebooks before Total Warfare: BattleTech Manual (1987), BattleTech Compendium
    // (1990), BattleTech Compendium: The Rules of Warfare (1994), BattleTech Master Rules (1998) and Master
    // Rules: Revised Edition (2001), and dates the Second Edition box set to 1985. The Third and Fourth Edition
    // box sets are dated by their rulebooks' credits pages (1992, 1996).
    it("lists the core rulebooks and box sets with their cited years", () => {
        expect(getRulesEditions().map(edition => [edition.tag, edition.year])).toEqual([
            ["battledroids", 1984],
            ["battletech-2nd-edition", 1985],
            ["battletech-manual", 1987],
            ["battletech-compendium", 1990],
            ["battletech-3rd-edition", 1992],
            ["compendium-rules-of-warfare", 1994],
            ["battletech-4th-edition", 1996],
            ["master-rules", 1998],
            ["master-rules-revised", 2001],
            ["total-warfare", 2006],
            ["core-rulebook", 2026],
        ]);
    });

    it("treats a record with no edition as part of the default edition and later", () => {
        expect(getIntroducedInEdition({})).toBe(DEFAULT_RULES_EDITION);
        expect(isInRulesEdition({})).toBe(true);
        expect(isInRulesEdition({}, "core-rulebook")).toBe(true);
        expect(isInRulesEdition({}, "master-rules-revised")).toBe(false);
        expect(isInRulesEdition({ introducedInEdition: "core-rulebook" })).toBe(false);
    });

    // The box sets hold less than the rulebooks around them, so an earlier edition includes a record only when
    // the record's table lists that edition by name.
    it("includes a record in an earlier edition only when its table lists that edition", () => {
        const stats: IEditionStats = { book: "BD", page: 20, heat: 1 };
        const record = { introducedInEdition: "battledroids", editionStats: { "battledroids": stats, "battletech-manual": null } };
        expect(isInRulesEdition(record, "battledroids")).toBe(true);
        expect(isInRulesEdition(record, "battletech-2nd-edition")).toBe(false);
        expect(isInRulesEdition(record, "battletech-manual")).toBe(true);
        expect(isInRulesEdition(record)).toBe(true);
    });

    it("reads an unchanged (null) edition from the nearest earlier edition that lists the record", () => {
        const first: IEditionStats = { book: "BD", page: 20, heat: 1 };
        const second: IEditionStats = { book: "BT2", page: 44, heat: 2 };
        const record = { editionStats: { "battledroids": first, "battletech-2nd-edition": second, "battletech-manual": null, "battletech-3rd-edition": null } };
        expect(getEditionStats(record, "battledroids")).toBe(first);
        expect(getEditionStats(record, "battletech-manual")).toBe(second);
        expect(getEditionStats(record, "battletech-3rd-edition")).toBe(second);
        expect(getEditionStats(record, "battletech-compendium")).toBeUndefined();
        expect(getEditionStats(record, "total-warfare")).toBeUndefined();
        expect(getEditionStats({}, "battledroids")).toBeUndefined();
    });

    it("never matches an edition that is not in the list", () => {
        expect(isInRulesEdition({ introducedInEdition: "no-such-edition" })).toBe(false);
        expect(isInRulesEdition({}, "no-such-edition")).toBe(false);
    });

    it("keeps every record's edition table well formed", () => {
        const editions = getRulesEditions().map(edition => edition.tag);
        const earlier = editions.slice(0, editions.indexOf(DEFAULT_RULES_EDITION));
        const books = Object.fromEntries(getRulesEditions().map(edition => [edition.tag, edition.book]));
        const problems: string[] = [];
        for (const { label, record } of labelled) {
            const keys = Object.keys(record.editionStats ?? {});
            if (record.introducedInEdition !== undefined && !editions.includes(record.introducedInEdition)) {
                problems.push(`${label}: unknown edition ${record.introducedInEdition}`);
            }
            if (!record.editionStats) {
                // No table: the record must not claim an earlier edition.
                if (record.introducedInEdition !== undefined && earlier.includes(record.introducedInEdition)) {
                    problems.push(`${label}: introduced in ${record.introducedInEdition} but has no editionStats`);
                }
                continue;
            }
            const ordered = earlier.filter(tag => keys.includes(tag));
            if (ordered.length !== keys.length) problems.push(`${label}: a key is not an edition before ${DEFAULT_RULES_EDITION}`);
            if (ordered[0] !== record.introducedInEdition) problems.push(`${label}: introducedInEdition is not its first edition`);
            if (record.editionStats[ordered[0]] === null) problems.push(`${label}: the first edition cannot be null`);
            for (const tag of ordered) {
                const stats = record.editionStats[tag];
                if (stats && stats.book !== books[tag]) problems.push(`${label}: ${tag} cites ${stats.book}`);
            }
        }
        expect(problems).toEqual([]);
    });

    it("says what the book prints wherever a misprint was corrected", () => {
        const corrected = labelled.flatMap(({ label, record }) => Object.entries(record.editionStats ?? {})
            .filter(([, stats]) => stats?.errata).map(([tag]) => `${label} ${tag}`)).sort();
        expect(corrected).toEqual([
            "equipment ammo-machine-gun-standard battledroids",
            "structure standard battledroids",
            "structure standard battletech-2nd-edition",
        ]);
    });

    it("lists what a complete edition includes beyond the catalogs", () => {
        const battledroids = getRulesEditions().find(edition => edition.tag === "battledroids")!;
        expect(battledroids.complete).toBe(true);
        expect(battledroids.mechs).toHaveLength(10);
        expect(battledroids.otherUnits).toHaveLength(5);
    });
});

// Battledroids (FASA, 1984), read from the page images of the Basic Battledroids rulebook. Everything the book
// lets a player build with or field is listed here; a record gaining or losing the edition fails the first test.
describe("Rules editions: Battledroids, complete", () => {
    it("includes exactly these records", () => {
        expect(inEdition("battledroids")).toEqual([
            // Weapons Table, BD p.20
            "equipment small-laser", "equipment medium-laser", "equipment large-laser", "equipment standard-ppc",
            "equipment lrm-5", "equipment lrm-10", "equipment lrm-15", "equipment lrm-20",
            "equipment srm-2", "equipment srm-4", "equipment srm-6",
            "equipment autocannon-standard-b", "equipment machine-gun", "equipment standard-flamer",
            // Their ammunition, BD pp.20, 25
            "equipment ammo-lrm-standard", "equipment ammo-srm-standard", "equipment ammo-machine-gun-standard",
            "equipment ammo-is-ac-5-standard",
            // Construction, BD pp.23-25
            "engine standard", "gyro standard", "cockpit standard", "heat sink single", "jump jet standard",
            "armor standard", "structure standard", "mech type biped",
            // "Battledroids weigh between 5 and 100 tons (in increments of 5 tons)", BD p.23; the tool has no 5.
            ...[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(tons => `tonnage ${tons}`),
        ].sort());
    });

    // Weapons Table, BD p.20 (repeated on the reference sheet, BD p.27), as printed:
    // [tag, heat, minimum, short, medium, long, tons, critical spaces, shots per ton (0 = none printed)].
    const table: [string, number, number, number, number, number, number, number, number][] = [
        ["small-laser", 1, 0, 1, 2, 3, 0.5, 1, 0],
        ["medium-laser", 3, 0, 3, 6, 9, 1, 1, 0],
        ["large-laser", 8, 0, 5, 10, 15, 5, 2, 0],
        ["standard-ppc", 10, 3, 6, 12, 18, 7, 3, 0],
        ["lrm-5", 1, 6, 7, 14, 21, 2, 1, 24],
        ["lrm-10", 2, 6, 7, 14, 21, 5, 2, 12],
        ["lrm-15", 4, 6, 7, 14, 21, 7, 3, 8],
        ["lrm-20", 6, 6, 7, 14, 21, 10, 5, 6],
        ["srm-2", 0, 0, 3, 6, 9, 1, 1, 50],
        ["srm-4", 1, 0, 3, 6, 9, 2, 1, 25],
        ["srm-6", 2, 0, 3, 6, 9, 3, 2, 15],
        ["autocannon-standard-b", 1, 3, 6, 12, 18, 8, 4, 20],
        ["machine-gun", 0, 0, 1, 2, 3, 0.5, 1, 200],
        ["standard-flamer", 3, 0, 1, 2, 3, 1, 1, 0],
    ];
    const damage: Record<string, number> = {
        "small-laser": 3, "medium-laser": 5, "large-laser": 8, "standard-ppc": 10,
        "autocannon-standard-b": 5, "machine-gun": 2, "standard-flamer": 2,
    };
    const perMissile: Record<string, number> = { "lrm-5": 1, "lrm-10": 1, "lrm-15": 1, "lrm-20": 1, "srm-2": 2, "srm-4": 2, "srm-6": 2 };

    it.each(table)("%s carries the printed Weapons Table row", (tag, heat, min, short, medium, long, tons, spaces, shots) => {
        const stats = getEditionStats(equipment.find(record => record.tag === tag)!, "battledroids")!;
        expect([stats.book, stats.page]).toEqual(["BD", 20]);
        expect([stats.heat, stats.range, stats.weight, stats.criticals, stats.shotsPerTon ?? 0])
            .toEqual([heat, { min, short, medium, long }, tons, spaces, shots]);
        expect(stats.damage).toBe(damage[tag]);
        expect(stats.damagePerMissile).toBe(perMissile[tag]);
    });

    // What changed between Battledroids and the rules the catalogs cite. If a record's own stats change, or the
    // edition entry does, this list has to be revisited rather than silently drifting.
    it("differs from today's weapon stats only in missile launcher heat", () => {
        const differences: string[] = [];
        for (const [tag] of table) {
            const item = equipment.find(record => record.tag === tag)!;
            const stats = getEditionStats(item, "battledroids")!;
            const then = [stats.heat, stats.range!.min, stats.range!.short, stats.range!.medium, stats.range!.long, stats.weight, stats.criticals, stats.shotsPerTon ?? 0];
            const now = [item.heat, item.range.min, item.range.short, item.range.medium, item.range.long, item.weight, item.space.battlemech, item.shotsPerTon ?? 0];
            const names = ["heat", "min", "short", "medium", "long", "weight", "criticals", "shotsPerTon"];
            names.forEach((name, index) => {
                if (then[index] !== now[index]) differences.push(`${tag} ${name} ${then[index]} -> ${now[index]}`);
            });
            if (stats.damage !== undefined && stats.damage !== item.damage) differences.push(`${tag} damage`);
        }
        expect(differences).toEqual([
            "lrm-5 heat 1 -> 2", "lrm-10 heat 2 -> 4", "lrm-15 heat 4 -> 5",
            "srm-2 heat 0 -> 2", "srm-4 heat 1 -> 3", "srm-6 heat 2 -> 4",
        ]);
    });

    // Engine Table, BD p.23: 79 ratings from 10 to 400.
    it("prints the engine weights the standard fusion engine still has, but for the 170", () => {
        const stats = getEditionStats(mechEngineTypes.find(engine => engine.tag === "standard")!, "battledroids")!;
        const ratings = Object.keys(stats.engineWeights!).map(Number);
        expect(ratings).toEqual(Array.from({ length: 79 }, (_, index) => 10 + index * 5));
        const differences = ratings.filter(rating => mechEngineOptions.find(option => option.rating === rating)?.weight.standard !== stats.engineWeights![rating]);
        // Battledroids prints 6.5 tons for the 170 (DAV); TechManual p.49 gives 6.0.
        expect(differences).toEqual([170]);
        expect(stats.engineWeights![170]).toBe(6.5);
        // Spot checks against the page: the worked example's 240 Pitban is 11.5 tons, the largest is 52.5.
        expect([stats.engineWeights![240], stats.engineWeights![400], stats.engineWeights![10]]).toEqual([11.5, 52.5, 0.5]);
    });

    // Internal Structure Table, BD p.24.
    // User ruling, 2026-10-07: an obvious misprint is corrected in the data and the printed value kept in
    // `errata`. Battledroids prints 15 leg boxes at 60 tons and 14 at 65; its own worked example gives 60 tons 14.
    it("holds the Internal Structure Table with the 60- and 65-ton leg misprint corrected", () => {
        const stats = getEditionStats(mechInternalStructureTypes.find(structure => structure.tag === "standard")!, "battledroids")!;
        expect(Object.keys(stats.structure!).map(Number)).toEqual(Array.from({ length: 20 }, (_, index) => 5 + index * 5));
        expect(stats.structure![5]).toEqual({ head: 3, ct: 3, torso: 2, arm: 1, leg: 1 });
        expect(stats.structure![25]).toEqual({ head: 3, ct: 8, torso: 6, arm: 4, leg: 6 });
        expect(stats.structure![55]).toEqual({ head: 3, ct: 18, torso: 13, arm: 9, leg: 13 });
        expect(stats.structure![60]).toEqual({ head: 3, ct: 20, torso: 14, arm: 10, leg: 14 });
        expect(stats.structure![65]).toEqual({ head: 3, ct: 21, torso: 15, arm: 10, leg: 15 });
        expect(stats.structure![100]).toEqual({ head: 3, ct: 31, torso: 21, arm: 17, leg: 21 });
        expect(stats.errata).toContain("prints 15 leg boxes at 60 tons and 14 at 65");
    });

    // BD p.24: cockpit 3 tons; gyro = rating / 100 rounded up; jump jets .5 tons per jump MP; extra heat sinks
    // 1 ton each; an Armor Value of 16 weighs 1 ton. Critical boxes from the record sheet on BD p.13.
    it("prints the control, heat sink, jump jet and armor rules", () => {
        const of = (records: IEditionHistory[]) => getEditionStats(records[0], "battledroids")!;
        expect(of(mechCockpitTypes.filter(cockpit => cockpit.tag === "standard")).weight).toBe(3);
        expect(of(mechGyroTypes.filter(gyro => gyro.tag === "standard")).criticals).toBe(4);
        expect(of(mechEngineTypes.filter(engine => engine.tag === "standard")).criticals).toBe(6);
        const sink = of(mechHeatSinkTypes.filter(heatSink => heatSink.tag === "single"));
        expect([sink.weight, sink.criticals]).toEqual([1, 1]);
        expect(of(mechArmorTypes.filter(armor => armor.tag === "standard")).pointsPerTon).toBe(16);
        // Today a jump jet weighs 0.5, 1 or 2 tons by weight class (TM p.225); Battledroids has one weight.
        const jets = mechJumpJetTypes.find(jumpJet => jumpJet.tag === "standard")!;
        expect(of([jets]).weight).toBe(0.5);
        expect(jets.weight_multiplier.heavy).toBe(2);
    });
});

// BattleTech, Second Edition (FASA, 1985), read from the page images of its rulebook. It builds with the same
// records as Battledroids; what it changes is listed below. Tanks, jeeps and infantry have no rules in it.
describe("Rules editions: Second Edition, complete", () => {
    const changed = (tag: string) => labelled.filter(entry => entry.record.editionStats?.[tag]).map(entry => entry.label).sort();

    it("includes exactly the records Battledroids does", () => {
        expect(inEdition("battletech-2nd-edition")).toEqual(inEdition("battledroids"));
        const edition = getRulesEditions().find(entry => entry.tag === "battletech-2nd-edition")!;
        expect(edition.complete).toBe(true);
        expect(edition.mechs).toHaveLength(15);
    });

    it("reprints nine of them with changes and leaves the rest as they were", () => {
        expect(changed("battletech-2nd-edition")).toEqual([
            "engine standard", "equipment lrm-10", "equipment lrm-15", "equipment lrm-5",
            "equipment srm-2", "equipment srm-4", "equipment srm-6", "jump jet standard", "structure standard",
        ]);
    });

    // Weapons Table, BT2 back cover: the missile launchers take the heat they have had since.
    it.each([["lrm-5", 2], ["lrm-10", 4], ["lrm-15", 5], ["lrm-20", 6], ["srm-2", 2], ["srm-4", 3], ["srm-6", 4]])(
        "%s has heat %i, as it does today", (tag, heat) => {
            const item = equipment.find(record => record.tag === tag)!;
            const stats = getEditionStats(item, "battletech-2nd-edition")!;
            expect(stats.heat).toBe(heat);
            expect(item.heat).toBe(heat);
            const first = getEditionStats(item, "battledroids")!;
            expect([stats.range, stats.weight, stats.criticals, stats.shotsPerTon, stats.damagePerMissile])
                .toEqual([first.range, first.weight, first.criticals, first.shotsPerTon, first.damagePerMissile]);
        });

    it("keeps the Battledroids rows of the other weapons", () => {
        const medium = equipment.find(record => record.tag === "medium-laser")!;
        expect(medium.editionStats!["battletech-2nd-edition"]).toBeNull();
        expect(getEditionStats(medium, "battletech-2nd-edition")).toBe(getEditionStats(medium, "battledroids"));
    });

    // Engine Table, BT2 p.37: the 170 is 6.0 tons, so the whole table now matches TechManual p.49.
    it("prints the engine weights the standard fusion engine still has", () => {
        const stats = getEditionStats(mechEngineTypes.find(engine => engine.tag === "standard")!, "battletech-2nd-edition")!;
        const ratings = Object.keys(stats.engineWeights!).map(Number);
        expect(ratings).toEqual(Array.from({ length: 79 }, (_, index) => 10 + index * 5));
        expect(ratings.filter(rating => mechEngineOptions.find(option => option.rating === rating)?.weight.standard !== stats.engineWeights![rating])).toEqual([]);
    });

    // Internal Structure Table, BT2 p.38: 10 to 100 tons; the 60/65-ton leg misprint is reprinted and corrected.
    it("holds the Internal Structure Table from 10 tons, with the same misprint corrected", () => {
        const stats = getEditionStats(mechInternalStructureTypes.find(structure => structure.tag === "standard")!, "battletech-2nd-edition")!;
        expect(Object.keys(stats.structure!).map(Number)).toEqual(Array.from({ length: 19 }, (_, index) => 10 + index * 5));
        expect([stats.structure![60].leg, stats.structure![65].leg]).toEqual([14, 15]);
        expect(stats.errata).toContain("still prints 15 leg boxes at 60 tons and 14 at 65");
        const first = getEditionStats(mechInternalStructureTypes.find(structure => structure.tag === "standard")!, "battledroids")!;
        for (const tons of Object.keys(stats.structure!).map(Number)) {
            expect(stats.structure![tons], `${tons} tons`).toEqual(first.structure![tons]);
        }
    });

    // Jump jet table, BT2 p.39: the weights the standard jump jet has today (TM p.225), one box per jet.
    it("weighs jump jets by the 'Mech's tonnage, as today", () => {
        const jets = mechJumpJetTypes.find(jumpJet => jumpJet.tag === "standard")!;
        const stats = getEditionStats(jets, "battletech-2nd-edition")!;
        expect(stats.weightByTonnage).toEqual([{ upTo: 55, tons: 0.5 }, { upTo: 85, tons: 1 }, { upTo: 100, tons: 2 }]);
        expect([jets.weight_multiplier.light, jets.weight_multiplier.medium, jets.weight_multiplier.heavy]).toEqual([0.5, 1, 2]);
        expect([stats.criticals, jets.criticals]).toEqual([1, 1]);
    });
});
