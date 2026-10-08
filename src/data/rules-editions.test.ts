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
            // BTC p.116: the Beagle Active Probe and Artemis IV FCS rows are printed one column to the right.
            "equipment beagle-active-probe battletech-compendium",
            "equipment lrm-10-artemis-iv battletech-compendium",
            "equipment lrm-15-artemis-iv battletech-compendium",
            "equipment lrm-20-artemis-iv battletech-compendium",
            "equipment lrm-5-artemis-iv battletech-compendium",
            "equipment srm-2-artemis-iv battletech-compendium",
            "equipment srm-4-artemis-iv battletech-compendium",
            "equipment srm-6-artemis-iv battletech-compendium",
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

// The BattleTech Manual: The Rules of Warfare (FASA, 1987), read from the page images. It is a rulebook with no
// 'Mech listings: it adds three autocannons, artillery, the vehicle flamer, Infernos, LAMs and prices.
describe("Rules editions: The BattleTech Manual, complete", () => {
    const TAG = "battletech-manual";
    const added = [
        // Weapons Table, BTM p.87
        "equipment autocannon-standard-a", "equipment autocannon-standard-c", "equipment autocannon-standard-d",
        "equipment long-tom-artillery", "equipment sniper-artillery", "equipment thumper-artillery",
        "equipment ammo-is-ac-2-standard", "equipment ammo-is-ac-10-standard", "equipment ammo-is-ac-20-standard",
        "equipment ammo-long-tom-standard", "equipment ammo-sniper-standard", "equipment ammo-thumper-standard",
        // Special Weapons, Smoke Rounds and Night Combat, BTM pp.41, 45-46
        "equipment vehicle-flamer", "equipment ammo-vehicle-flamer-standard", "equipment ammo-srm-inferno",
        "equipment ammo-long-tom-smoke", "equipment ammo-sniper-smoke", "equipment ammo-thumper-smoke",
        "equipment searchlight",
        // Dive Bombing, BTM pp.68-69
        "equipment ammo-bomb-standard", "equipment ammo-bomb-inferno",
        // Land-Air 'Mechs, BTM pp.74, 78; vehicle engines, BTM p.81
        "mech type lam", "engine ice",
    ];

    it("includes everything the Second Edition does, and these additions", () => {
        expect(inEdition(TAG)).toEqual([...inEdition("battletech-2nd-edition"), ...added].sort());
        for (const label of added) {
            expect(labelled.find(entry => entry.label === label)!.record.introducedInEdition, label).toBe(TAG);
        }
        const edition = getRulesEditions().find(entry => entry.tag === TAG)!;
        expect(edition.complete).toBe(true);
        expect(edition.mechs).toEqual([]);
        expect(edition.otherUnits).toHaveLength(15);
    });

    // Weapons Table, BTM p.87, and Weapons Price List, BTM p.86, as printed:
    // [tag, heat, damage (per missile for launchers), minimum, short, medium, long, tons, critical locations,
    //  shots per ton (0 = none printed), price in C-bills].
    const table: [string, number, number, number, number, number, number, number, number, number, number][] = [
        ["small-laser", 1, 3, 0, 1, 2, 3, 0.5, 1, 0, 11250],
        ["medium-laser", 3, 5, 0, 3, 6, 9, 1, 1, 0, 40000],
        ["large-laser", 8, 8, 0, 5, 10, 15, 5, 2, 0, 100000],
        ["standard-ppc", 10, 10, 3, 6, 12, 18, 7, 3, 0, 200000],
        ["standard-flamer", 3, 2, 0, 1, 2, 3, 1, 1, 0, 7500],
        ["autocannon-standard-a", 1, 2, 4, 8, 16, 24, 6, 1, 45, 75000],
        ["autocannon-standard-b", 1, 5, 3, 6, 12, 18, 8, 4, 20, 125000],
        ["autocannon-standard-c", 3, 10, 0, 5, 10, 15, 12, 7, 10, 200000],
        ["autocannon-standard-d", 7, 20, 0, 3, 6, 9, 14, 10, 5, 300000],
        ["machine-gun", 0, 2, 0, 1, 2, 3, 0.5, 1, 200, 5000],
        ["lrm-5", 2, 1, 6, 7, 14, 21, 2, 1, 24, 30000],
        ["lrm-10", 4, 1, 6, 7, 14, 21, 5, 2, 12, 100000],
        ["lrm-15", 5, 1, 6, 7, 14, 21, 7, 2, 8, 175000],
        ["lrm-20", 6, 1, 6, 7, 14, 21, 10, 5, 6, 250000],
        ["srm-2", 2, 2, 0, 3, 6, 9, 1, 1, 50, 10000],
        ["srm-4", 3, 2, 0, 3, 6, 9, 2, 1, 25, 60000],
        ["srm-6", 4, 2, 0, 3, 6, 9, 3, 2, 15, 80000],
    ];

    it.each(table)("%s carries the printed Weapons Table row and price", (tag, heat, damage, min, short, medium, long, tons, spaces, shots, price) => {
        const stats = equipment.find(record => record.tag === tag)!.editionStats![TAG]!;
        expect([stats.book, stats.page]).toEqual(["BTM", 87]);
        expect([stats.heat, stats.range, stats.weight, stats.criticals, stats.shotsPerTon ?? 0, stats.cbills])
            .toEqual([heat, { min, short, medium, long }, tons, spaces, shots, price]);
        expect(stats.damage ?? stats.damagePerMissile).toBe(damage);
    });

    // What the Manual changed in the weapons the Second Edition already had: nothing but the 15-pack's critical
    // locations, printed as 2 against 3 before and since. Not an obvious misprint, so it stays as printed.
    it("reprints the Second Edition's weapon rows, but for the LRM 15-pack's critical locations", () => {
        const different = table.map(([tag]) => equipment.find(record => record.tag === tag)!)
            .filter(item => "battletech-2nd-edition" in item.editionStats!)
            .filter(item => {
                const now = item.editionStats![TAG]!;
                const before = getEditionStats(item, "battletech-2nd-edition")!;
                return JSON.stringify([now.heat, now.damage, now.damagePerMissile, now.range, now.weight, now.criticals, now.shotsPerTon])
                    !== JSON.stringify([before.heat, before.damage, before.damagePerMissile, before.range, before.weight, before.criticals, before.shotsPerTon]);
            }).map(item => item.tag);
        expect(different).toEqual(["lrm-15"]);
        const pack = equipment.find(record => record.tag === "lrm-15")!;
        expect([pack.editionStats![TAG]!.criticals, getEditionStats(pack, "battletech-2nd-edition")!.criticals, pack.space.battlemech]).toEqual([2, 3, 3]);
        expect(pack.editionStats![TAG]!.notes).toContain("Entered as printed");
        expect(pack.editionStats![TAG]!.errata).toBeUndefined();
    });

    // The new autocannons match the records the catalogs carry today (TM p.208) in every printed column.
    it.each(["autocannon-standard-a", "autocannon-standard-c", "autocannon-standard-d"])("%s is printed as it stands today", tag => {
        const item = equipment.find(record => record.tag === tag)!;
        const stats = item.editionStats![TAG]!;
        expect([stats.heat, stats.damage, stats.weight, stats.criticals, stats.shotsPerTon])
            .toEqual([item.heat, item.damage, item.weight, item.space.battlemech, item.shotsPerTon]);
        expect(stats.range).toEqual({ min: item.range.min, short: item.range.short, medium: item.range.medium, long: item.range.long });
    });

    // Weapons Table, BTM p.87, and Artillery Piece Table, BTM p.42:
    // [tag, heat, target hex damage, adjacent hex damage, mapsheets, tons, critical locations, shots, price].
    it.each([
        ["long-tom-artillery", 20, 20, 10, 20, 30, 30, 5, 450000],
        ["sniper-artillery", 10, 10, 5, 12, 20, 20, 10, 300000],
        ["thumper-artillery", 6, 5, 2, 14, 15, 15, 20, 187500],
    ])("%s carries the printed artillery row", (tag, heat, damage, adjacent, sheets, tons, spaces, shots, price) => {
        const stats = equipment.find(record => record.tag === tag)!.editionStats![TAG]!;
        expect([stats.heat, stats.damage, stats.damageAdjacent, stats.rangeMapsheets, stats.weight, stats.criticals, stats.shotsPerTon, stats.cbills])
            .toEqual([heat, damage, adjacent, sheets, tons, spaces, shots, price]);
    });

    // Reloads column, BTM p.86; shots per ton, BTM p.87.
    it.each([
        ["ammo-is-ac-2-standard", 45, 1000], ["ammo-is-ac-5-standard", 20, 4500], ["ammo-is-ac-10-standard", 10, 6000],
        ["ammo-is-ac-20-standard", 5, 10000], ["ammo-machine-gun-standard", 200, 1000],
        ["ammo-long-tom-standard", 5, 10000], ["ammo-sniper-standard", 10, 6000], ["ammo-thumper-standard", 20, 4500],
    ])("%s has %i shots and costs %i a ton", (tag, shots, price) => {
        const stats = equipment.find(record => record.tag === tag)!.editionStats![TAG]!;
        expect([stats.shotsPerTon, stats.cbills, stats.weight]).toEqual([shots, price, 1]);
    });

    it("prices missile reloads by the ton and Infernos apart", () => {
        const price = (tag: string) => equipment.find(record => record.tag === tag)!.editionStats![TAG]!.cbills;
        expect([price("ammo-lrm-standard"), price("ammo-srm-standard"), price("ammo-srm-inferno")]).toEqual([30000, 27000, 13500]);
    });

    // BTM p.79: the worked example now agrees with the Weapons Table, so the Battledroids erratum ends here.
    it("drops the machine gun ammunition erratum", () => {
        const ammo = equipment.find(record => record.tag === "ammo-machine-gun-standard")!;
        expect(getEditionStats(ammo, "battletech-2nd-edition")!.errata).toBeDefined();
        expect(getEditionStats(ammo, TAG)!.errata).toBeUndefined();
        expect(getEditionStats(ammo, TAG)!.notes).toContain("half-ton lots");
    });

    // Internal Structure Table, BTM p.79: the 60- and 65-ton leg boxes are printed as 14 and 15 at last, so the
    // table equals the corrected Second Edition one and carries no erratum of its own.
    it("prints the Internal Structure Table the earlier editions meant", () => {
        const standard = mechInternalStructureTypes.find(structure => structure.tag === "standard")!;
        const stats = standard.editionStats![TAG]!;
        expect(stats.structure).toEqual(getEditionStats(standard, "battletech-2nd-edition")!.structure);
        expect([stats.structure![60].leg, stats.structure![65].leg]).toEqual([14, 15]);
        expect(stats.errata).toBeUndefined();
    });

    // BTM pp.79-80: engine rating / 25, rounded down, heat sinks are integral; the rest take a location each.
    it("makes part of the engine's heat sinks integral", () => {
        const stats = mechHeatSinkTypes.find(sink => sink.tag === "single")!.editionStats![TAG]!;
        expect([stats.weight, stats.criticals, stats.cbills]).toEqual([1, 1, 2000]);
        expect(stats.notes).toContain("Engine rating divided by 25, rounded down");
    });

    // Engine Table p.88, cockpit and gyro p.78, jump jet table and armor p.79: as the Second Edition has them.
    it("leaves the engine, cockpit, gyro, jump jets, armor, layout and tonnages unchanged", () => {
        const unchanged = labelled.filter(entry => entry.record.editionStats && TAG in entry.record.editionStats && entry.record.editionStats[TAG] === null)
            .map(entry => entry.label).sort();
        expect(unchanged).toEqual([
            "engine standard", "gyro standard", "cockpit standard", "jump jet standard", "armor standard", "mech type biped",
            ...[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(tons => `tonnage ${tons}`),
        ].sort());
    });

    // BTM p.45 prints the conventional Vehicle Flamer at 5 tons. Odd, but nothing in the book contradicts it.
    it("keeps the Vehicle Flamer's printed 5 tons, flagged", () => {
        const stats = equipment.find(record => record.tag === "vehicle-flamer")!.editionStats![TAG]!;
        expect([stats.heat, stats.damage, stats.range, stats.weight, stats.shotsPerTon])
            .toEqual([3, 2, { min: 0, short: 1, medium: 2, long: 3 }, 5, 20]);
        expect(stats.notes).toContain("entered as printed");
    });
});

// The BattleTech Compendium (FASA 1640, 1990), read from the page images. The first edition with Clan equipment
// and the Star League technology of 2750: two weapons tables (Inner Sphere p.116, Clan p.115), the Advanced
// Equipment section (pp.117-122) and one price list (p.129).
describe("Rules editions: The BattleTech Compendium, complete", () => {
    const TAG = "battletech-compendium";
    const added = [
        // Inner Sphere Weapons and Equipment, BTC p.116; hatchets, BTC p.31
        "equipment standard-gauss-rifle", "equipment autocannon-lbx-10", "equipment autocannon-ultra-b",
        "equipment is-ams", "equipment melee-hatchet",
        "equipment er-large-laser", "equipment er-ppc", "equipment large-pulse-laser", "equipment medium-pulse-laser",
        "equipment small-pulse-laser",
        // Launchers with Artemis IV and single-shot launchers, BTC pp.118, 121
        "equipment streak-srm-2", "equipment narc", "equipment lrm-5-artemis-iv", "equipment lrm-10-artemis-iv",
        "equipment lrm-15-artemis-iv", "equipment lrm-20-artemis-iv", "equipment srm-2-artemis-iv",
        "equipment srm-4-artemis-iv", "equipment srm-6-artemis-iv", "equipment lrm-5-os", "equipment lrm-10-os",
        "equipment lrm-15-os", "equipment lrm-20-os", "equipment srm-2-os", "equipment srm-4-os",
        "equipment srm-6-os",
        "equipment arrow-iv-system",
        "equipment is-tag", "equipment beagle-active-probe", "equipment case", "equipment c3-computer-master",
        "equipment c3-computer-slave", "equipment ecm-suite", "equipment masc",
        // Inner Sphere ammunition, BTC pp.116, 129
        "equipment ammo-is-ams-standard", "equipment ammo-is-gauss-rifle-standard",
        "equipment ammo-is-lb-10x-standard", "equipment ammo-is-lb-10x-cluster",
        "equipment ammo-is-ultra-ac-5-standard", "equipment ammo-is-narc-standard",
        "equipment ammo-is-streak-srm-standard", "equipment ammo-is-arrow-iv-standard",
        "equipment ammo-is-arrow-iv-homing", "equipment ammo-is-lrm-artemis-iv", "equipment ammo-is-srm-artemis-iv",
        "equipment ammo-is-lrm-swarm", "equipment ammo-is-lrm-thunder",
        // Clan Weapons & Equipment, BTC p.115
        "equipment clan-er-large-laser", "equipment er-medium-laser-clan", "equipment er-small-laser-clan",
        "equipment er-ppc-clan", "equipment clan-flamer", "equipment clan_large-pulse-laser",
        "equipment clan_medium-pulse-laser", "equipment clan-small-pulse-laser",
        "equipment clan-ams", "equipment clan-gauss-rifle", "equipment clan-autocannon-lbx-2",
        "equipment clan-autocannon-lbx-5", "equipment clan-autocannon-lbx-10", "equipment clan-autocannon-lbx-20",
        "equipment clan-machine-gun", "equipment clan-autocannon-uac-2", "equipment clan-autocannon-uac-5",
        "equipment clan-autocannon-uac-10", "equipment clan-autocannon-uac-20",
        "equipment clan-lrm-5", "equipment clan-lrm-5-artemis-iv", "equipment clan-lrm-5-os", "equipment clan-lrm-10",
        "equipment clan-lrm-10-artemis-iv", "equipment clan-lrm-10-os", "equipment clan-lrm-15",
        "equipment clan-lrm-15-artemis-iv", "equipment clan-lrm-15-os", "equipment clan-lrm-20",
        "equipment clan-lrm-20-artemis-iv", "equipment clan-lrm-20-os", "equipment clan-srm-2",
        "equipment clan-srm-2-artemis-iv", "equipment clan-srm-2-os", "equipment clan-srm-4",
        "equipment clan-srm-4-artemis-iv", "equipment clan-srm-4-os", "equipment clan-srm-6",
        "equipment clan-srm-6-artemis-iv", "equipment clan-srm-6-os", "equipment clan-streak-srm-2",
        "equipment clan-streak-srm-4", "equipment clan-streak-srm-6", "equipment clan-narc",
        "equipment clan-arrow-iv-system",
        "equipment clan-tag", "equipment clan-active-probe", "equipment clan-a-pod", "equipment clan-ecm-system",
        "equipment clan-masc", "equipment clan-targeting-computer",
        // Clan ammunition, BTC pp.115, 129
        "equipment ammo-clan-ams-standard", "equipment ammo-clan-gauss-rifle-standard",
        "equipment ammo-clan-lb-2x-standard", "equipment ammo-clan-lb-2x-cluster",
        "equipment ammo-clan-lb-5x-standard", "equipment ammo-clan-lb-5x-cluster",
        "equipment ammo-clan-lb-10x-standard", "equipment ammo-clan-lb-10x-cluster",
        "equipment ammo-clan-lb-20x-standard", "equipment ammo-clan-lb-20x-cluster",
        "equipment ammo-clan-ultra-ac-2-standard", "equipment ammo-clan-ultra-ac-5-standard",
        "equipment ammo-clan-ultra-ac-10-standard", "equipment ammo-clan-ultra-ac-20-standard",
        "equipment ammo-clan-narc-standard", "equipment ammo-clan-streak-srm-standard",
        "equipment ammo-clan-arrow-iv-standard", "equipment ammo-clan-arrow-iv-homing",
        "equipment ammo-clan-arrow-iv-fascam", "equipment ammo-clan-lrm-artemis-iv",
        "equipment ammo-clan-srm-artemis-iv", "equipment ammo-clan-lrm-swarm", "equipment ammo-clan-lrm-fascam",
        // Advanced Equipment, BTC pp.119, 122; four-legged BattleMechs, BTC p.56
        "armor ferro-fibrous", "armor ferro-aluminum",
        "engine xl", "engine clan_xl",
        "heat sink double",
        "structure endo-steel",
        "myomer tsm",
        "mech type quad",
    ];

    it("includes everything the Manual does, and these additions", () => {
        expect(inEdition(TAG)).toEqual([...inEdition("battletech-manual"), ...added].sort());
        expect(added).toHaveLength(129);
        for (const label of added) {
            expect(labelled.find(entry => entry.label === label)!.record.introducedInEdition, label).toBe(TAG);
        }
        const edition = getRulesEditions().find(entry => entry.tag === TAG)!;
        expect(edition.complete).toBe(true);
        expect(edition.mechs).toEqual([]);
        expect(edition.otherUnits).toHaveLength(19);
        expect(edition.otherUnits).toEqual(expect.arrayContaining(["BattleArmor point", "OmniMech", "OmniFighter", "JumpShip"]));
    });

    // [tag, heat, damage (per missile for launchers; -1 where the table prints none), minimum, short, medium,
    //  long, tons, critical slots, shots per ton (0 = none printed), price in C-bills (0 = none printed)].
    type Row = [string, number, number, number, number, number, number, number, number, number, number];
    const check = (page: number) => (tag: string, heat: number, damage: number, min: number, short: number, medium: number, long: number,
        tons: number, slots: number, shots: number, price: number) => {
        const stats = equipment.find(record => record.tag === tag)!.editionStats![TAG]!;
        expect([stats.book, stats.page]).toEqual(["BTC", page]);
        expect([stats.heat, stats.range, stats.weight, stats.criticals, stats.shotsPerTon ?? 0, stats.cbills ?? 0])
            .toEqual([heat, { min, short, medium, long }, tons, slots, shots, price]);
        expect(stats.damage ?? stats.damagePerMissile ?? -1).toBe(damage);
    };

    // Inner Sphere Weapons and Equipment, BTC p.116, with the Weapon and Equipment Costs of p.129.
    const innerSphere: Row[] = [
        ["er-large-laser", 12, 8, 0, 7, 14, 19, 5, 2, 0, 200000],
        ["er-ppc", 15, 10, 0, 7, 14, 23, 7, 3, 0, 300000],
        ["large-pulse-laser", 10, 9, 0, 3, 7, 10, 7, 2, 0, 175000],
        ["medium-pulse-laser", 4, 6, 0, 2, 4, 6, 2, 1, 0, 60000],
        ["small-pulse-laser", 2, 3, 0, 1, 2, 3, 1, 1, 0, 16000],
        ["vehicle-flamer", 3, 2, 0, 1, 2, 3, 0.5, 1, 20, 0],
        ["autocannon-standard-a", 1, 2, 4, 8, 16, 24, 6, 1, 45, 75000],
        ["autocannon-standard-b", 1, 5, 3, 6, 12, 18, 8, 4, 20, 125000],
        ["autocannon-standard-c", 3, 10, 0, 5, 10, 15, 12, 7, 10, 200000],
        ["autocannon-standard-d", 7, 20, 0, 3, 6, 9, 14, 10, 5, 300000],
        ["standard-gauss-rifle", 1, 15, 2, 7, 15, 22, 15, 7, 8, 300000],
        ["autocannon-lbx-10", 2, 10, 0, 6, 12, 18, 11, 6, 10, 400000],
        ["autocannon-ultra-b", 1, 5, 2, 6, 13, 20, 9, 5, 20, 200000],
        ["lrm-5", 2, 1, 6, 7, 14, 21, 2, 1, 24, 30000],
        ["lrm-10", 4, 1, 6, 7, 14, 21, 5, 2, 12, 100000],
        ["lrm-15", 5, 1, 6, 7, 14, 21, 7, 3, 8, 175000],
        ["lrm-20", 6, 1, 6, 7, 14, 21, 10, 5, 6, 250000],
        ["narc", 0, -1, 0, 3, 6, 9, 3, 2, 6, 100000],
        ["srm-2", 2, 2, 0, 3, 6, 9, 1, 1, 50, 10000],
        ["srm-4", 3, 2, 0, 3, 6, 9, 2, 1, 25, 60000],
        ["srm-6", 4, 2, 0, 3, 6, 9, 3, 2, 15, 80000],
        ["streak-srm-2", 2, -1, 0, 3, 6, 9, 1.5, 1, 50, 15000],
        ["is-tag", 0, -1, 0, 5, 9, 15, 1, 1, 0, 50000],
    ];
    it.each(innerSphere)("Inner Sphere %s carries the printed table row and price", check(116));

    // Clan Weapons & Equipment, BTC p.115, with the same price list.
    const clan: Row[] = [
        ["clan-er-large-laser", 12, 10, 0, 8, 15, 25, 4, 1, 0, 200000],
        ["er-medium-laser-clan", 5, 7, 0, 5, 10, 15, 1, 1, 0, 80000],
        ["er-small-laser-clan", 2, 5, 0, 2, 4, 6, 0.5, 1, 0, 11250],
        ["er-ppc-clan", 15, 15, 0, 7, 14, 23, 6, 2, 0, 300000],
        ["clan-flamer", 3, 2, 0, 1, 2, 3, 0.5, 1, 0, 7500],
        ["clan_large-pulse-laser", 10, 10, 0, 6, 14, 20, 6, 2, 0, 175000],
        ["clan_medium-pulse-laser", 4, 7, 0, 4, 8, 12, 2, 1, 0, 60000],
        ["clan-small-pulse-laser", 2, 3, 0, 2, 4, 6, 1, 1, 0, 16000],
        ["clan-gauss-rifle", 1, 15, 2, 7, 15, 22, 12, 6, 8, 300000],
        ["clan-autocannon-lbx-2", 1, 2, 4, 10, 20, 30, 5, 3, 45, 150000],
        ["clan-autocannon-lbx-5", 1, 5, 3, 8, 15, 24, 7, 4, 20, 250000],
        ["clan-autocannon-lbx-10", 2, 10, 0, 6, 12, 18, 10, 5, 10, 400000],
        ["clan-autocannon-lbx-20", 6, 20, 0, 4, 8, 12, 12, 9, 5, 600000],
        ["clan-machine-gun", 0, 2, 0, 1, 2, 3, 0.25, 1, 200, 5000],
        ["clan-autocannon-uac-2", 1, 2, 2, 9, 18, 27, 5, 2, 45, 120000],
        ["clan-autocannon-uac-5", 1, 5, 0, 7, 14, 21, 7, 3, 20, 200000],
        ["clan-autocannon-uac-10", 3, 10, 0, 6, 12, 18, 10, 4, 10, 320000],
        ["clan-autocannon-uac-20", 7, 20, 0, 4, 8, 12, 12, 8, 5, 480000],
        ["clan-lrm-5", 2, 1, 0, 7, 14, 21, 1, 1, 24, 30000],
        ["clan-lrm-10", 4, 1, 0, 7, 14, 21, 2.5, 1, 12, 100000],
        ["clan-lrm-15", 5, 1, 0, 7, 14, 21, 3.5, 2, 8, 175000],
        ["clan-lrm-20", 6, 1, 0, 7, 14, 21, 5, 4, 6, 250000],
        ["clan-narc", 0, -1, 0, 4, 8, 12, 2, 1, 6, 100000],
        ["clan-srm-2", 2, 2, 0, 3, 6, 9, 0.5, 1, 50, 10000],
        ["clan-srm-4", 3, 2, 0, 3, 6, 9, 1, 1, 25, 60000],
        ["clan-srm-6", 4, 2, 0, 3, 6, 9, 1.5, 1, 15, 80000],
        ["clan-streak-srm-2", 2, -1, 0, 4, 8, 12, 1, 1, 50, 15000],
        ["clan-streak-srm-4", 3, -1, 0, 4, 8, 12, 2, 1, 25, 90000],
        ["clan-streak-srm-6", 4, -1, 0, 4, 8, 12, 3, 2, 15, 120000],
        ["clan-tag", 0, -1, 0, 5, 9, 15, 1, 1, 0, 50000],
    ];
    it.each(clan)("Clan %s carries the printed table row and price", check(115));

    // Artillery rows of both tables and the Artillery Pieces table, BTC p.49:
    // [tag, heat, target hex damage, adjacent hex damage, mapsheets, tons, critical slots, shots, price].
    it.each([
        ["arrow-iv-system", 10, 20, 10, 5, 15, 15, 5, 450000],
        ["clan-arrow-iv-system", 10, 20, 10, 6, 12, 12, 5, 450000],
        ["long-tom-artillery", 20, 20, 10, 20, 30, 30, 5, 450000],
        ["sniper-artillery", 10, 10, 5, 12, 20, 20, 10, 300000],
        ["thumper-artillery", 6, 5, 2, 14, 15, 15, 20, 187500],
    ])("%s carries the printed artillery row", (tag, heat, damage, adjacent, boards, tons, slots, shots, price) => {
        const stats = equipment.find(record => record.tag === tag)!.editionStats![TAG]!;
        expect([stats.heat, stats.damage, stats.damageAdjacent, stats.rangeMapsheets, stats.weight, stats.criticals, stats.shotsPerTon, stats.cbills])
            .toEqual([heat, damage, adjacent, boards, tons, slots, shots, price]);
    });

    // Other Equipment rows: [tag, tons, critical slots, price (0 = none printed for that name)].
    it.each([
        ["is-ams", 0.5, 1, 100000], ["clan-ams", 0.5, 1, 100000],
        ["beagle-active-probe", 1.5, 2, 200000], ["clan-active-probe", 1, 1, 0],
        ["case", 0.5, 1, 50000],
        ["c3-computer-master", 5, 5, 1500000], ["c3-computer-slave", 1, 1, 250000],
        ["ecm-suite", 1.5, 2, 200000], ["clan-ecm-system", 1, 1, 0],
        ["clan-a-pod", 0.5, 1, 1500],
    ])("%s weighs %d tons in %d critical slots", (tag, tons, slots, price) => {
        const stats = equipment.find(record => record.tag === tag)!.editionStats![TAG]!;
        expect([stats.weight, stats.criticals, stats.cbills ?? 0]).toEqual([tons, slots, price]);
    });

    // Weapon and Equipment Costs, BTC p.129, ammunition column; shots from the tables' Ammo column (0 where the
    // shots depend on the launcher).
    it.each([
        ["ammo-is-ams-standard", 12, 2000], ["ammo-clan-ams-standard", 24, 2000],
        ["ammo-is-gauss-rifle-standard", 8, 20000], ["ammo-clan-gauss-rifle-standard", 8, 20000],
        ["ammo-clan-lb-2x-standard", 45, 2000], ["ammo-clan-lb-2x-cluster", 45, 3300],
        ["ammo-clan-lb-5x-standard", 20, 9000], ["ammo-clan-lb-5x-cluster", 20, 15000],
        ["ammo-is-lb-10x-standard", 10, 12000], ["ammo-is-lb-10x-cluster", 10, 20000],
        ["ammo-clan-lb-10x-standard", 10, 12000], ["ammo-clan-lb-10x-cluster", 10, 20000],
        ["ammo-clan-lb-20x-standard", 5, 20000], ["ammo-clan-lb-20x-cluster", 5, 34000],
        ["ammo-clan-ultra-ac-2-standard", 45, 1000], ["ammo-is-ultra-ac-5-standard", 20, 9000],
        ["ammo-clan-ultra-ac-5-standard", 20, 9000], ["ammo-clan-ultra-ac-10-standard", 10, 12000],
        ["ammo-clan-ultra-ac-20-standard", 5, 20000],
        ["ammo-is-narc-standard", 6, 6000], ["ammo-clan-narc-standard", 6, 6000],
        ["ammo-is-streak-srm-standard", 0, 54000], ["ammo-clan-streak-srm-standard", 0, 54000],
        ["ammo-is-arrow-iv-standard", 5, 10000], ["ammo-is-arrow-iv-homing", 5, 15000],
        ["ammo-clan-arrow-iv-standard", 5, 10000], ["ammo-clan-arrow-iv-homing", 5, 15000],
        // "2 x normal": Artemis, Swarm and Thunder missiles against the 30,000 (LRM) and 27,000 (SRM) reloads.
        ["ammo-is-lrm-artemis-iv", 0, 60000], ["ammo-is-srm-artemis-iv", 0, 54000],
        ["ammo-clan-lrm-artemis-iv", 0, 60000], ["ammo-clan-srm-artemis-iv", 0, 54000],
        ["ammo-is-lrm-swarm", 0, 60000], ["ammo-clan-lrm-swarm", 0, 60000],
        ["ammo-is-lrm-thunder", 0, 60000], ["ammo-clan-lrm-fascam", 0, 60000],
    ])("%s has %i shots and costs %i a ton", (tag, shots, price) => {
        const stats = equipment.find(record => record.tag === tag)!.editionStats![TAG]!;
        expect([stats.shotsPerTon ?? 0, stats.cbills, stats.weight]).toEqual([shots, price, 1]);
    });

    // BTC pp.118, 129: the Artemis IV FCS is 1 ton, 1 critical slot and 100,000 C-bills on top of its launcher.
    it("adds the Artemis IV FCS row to each launcher that carries one", () => {
        const pairs = [
            ...[5, 10, 15, 20].flatMap(size => [[`lrm-${size}`, `lrm-${size}-artemis-iv`], [`clan-lrm-${size}`, `clan-lrm-${size}-artemis-iv`]]),
            ...[2, 4, 6].flatMap(size => [[`srm-${size}`, `srm-${size}-artemis-iv`], [`clan-srm-${size}`, `clan-srm-${size}-artemis-iv`]]),
        ];
        for (const [plain, artemis] of pairs) {
            const base = equipment.find(record => record.tag === plain)!.editionStats![TAG]!;
            const stats = equipment.find(record => record.tag === artemis)!.editionStats![TAG]!;
            expect([stats.weight, stats.criticals, stats.cbills], artemis).toEqual([base.weight! + 1, base.criticals! + 1, base.cbills! + 100000]);
            expect([stats.heat, stats.range, stats.shotsPerTon], artemis).toEqual([base.heat, base.range, base.shotsPerTon]);
            // The Inner Sphere table prints the row a column out of place; the Clan table prints it straight.
            expect(stats.errata !== undefined, artemis).toBe(!artemis.startsWith("clan-"));
        }
    });

    // BTC pp.121, 129: half a ton heavier than the standard launcher, half its price, no ammunition.
    it("derives single-shot launchers from the standard ones", () => {
        const pairs = [
            ...[5, 10, 15, 20].flatMap(size => [[`lrm-${size}`, `lrm-${size}-os`], [`clan-lrm-${size}`, `clan-lrm-${size}-os`]]),
            ...[2, 4, 6].flatMap(size => [[`srm-${size}`, `srm-${size}-os`], [`clan-srm-${size}`, `clan-srm-${size}-os`]]),
        ];
        for (const [plain, single] of pairs) {
            const base = equipment.find(record => record.tag === plain)!.editionStats![TAG]!;
            const stats = equipment.find(record => record.tag === single)!.editionStats![TAG]!;
            expect([stats.weight, stats.cbills, stats.shotsPerTon, stats.criticals], single).toEqual([base.weight! + 0.5, base.cbills! / 2, undefined, undefined]);
        }
    });

    // What the Compendium changed in the Manual's weapons: the LRM-15 is back to 3 critical slots, and the
    // Vehicle Flamer drops from 5 tons to half a ton with a critical slot. The rest differ in their names only.
    it("reprints the Manual's weapon rows, but for the LRM-15's critical slots and the Vehicle Flamer's weight", () => {
        const numbers = (stats: IEditionStats) => JSON.stringify([stats.heat, stats.damage, stats.damagePerMissile, stats.damageAdjacent,
            stats.range, stats.rangeMapsheets, stats.weight, stats.criticals, stats.shotsPerTon, stats.cbills]);
        const different = equipment.filter(item => item.editionStats && "battletech-manual" in item.editionStats && item.editionStats[TAG])
            .filter(item => numbers(item.editionStats![TAG]!) !== numbers(getEditionStats(item, "battletech-manual")!))
            .map(item => item.tag).sort();
        expect(different).toEqual(["lrm-15", "vehicle-flamer"]);
        expect(equipment.find(item => item.tag === "lrm-15")!.editionStats![TAG]!.criticals).toBe(3);
        expect(getEditionStats(equipment.find(item => item.tag === "lrm-15")!, "battletech-manual")!.criticals).toBe(2);
    });

    // Engine table p.114, structure table p.112, jump jets p.112, cockpit and gyro p.111, armor p.112: all as
    // the Manual has them; so are the lasers, PPC, flamer, machine gun and the Manual's ammunition prices.
    it("leaves the Manual's engine, structure, controls, heat sinks, jump jets, armor and tonnages unchanged", () => {
        const unchanged = labelled.filter(entry => entry.record.editionStats && TAG in entry.record.editionStats && entry.record.editionStats[TAG] === null)
            .map(entry => entry.label).sort();
        expect(unchanged).toEqual([
            "armor standard", "cockpit standard", "engine ice", "engine standard", "gyro standard", "heat sink single",
            "jump jet standard", "mech type biped", "structure standard",
            "equipment large-laser", "equipment medium-laser", "equipment small-laser", "equipment standard-ppc",
            "equipment standard-flamer", "equipment machine-gun",
            "equipment ammo-is-ac-2-standard", "equipment ammo-is-ac-5-standard", "equipment ammo-is-ac-10-standard",
            "equipment ammo-is-ac-20-standard", "equipment ammo-lrm-standard", "equipment ammo-srm-standard",
            "equipment ammo-machine-gun-standard", "equipment ammo-long-tom-standard", "equipment ammo-sniper-standard",
            "equipment ammo-thumper-standard", "equipment ammo-vehicle-flamer-standard",
            "equipment ammo-bomb-standard", "equipment ammo-bomb-inferno",
            ...[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(tons => `tonnage ${tons}`),
        ].sort());
        const engine = mechEngineTypes.find(type => type.tag === "standard")!;
        expect(getEditionStats(engine, TAG)!.engineWeights![400]).toBe(52.5);
        const structure = mechInternalStructureTypes.find(type => type.tag === "standard")!;
        expect(getEditionStats(structure, TAG)!.structure![100]).toEqual({ head: 3, ct: 31, torso: 21, arm: 17, leg: 21 });
    });

    // BTC pp.119, 122: the tables give one figure for the Inner Sphere and one for the Clans.
    it("describes the advanced components for both technology bases", () => {
        const notes = (records: (IEditionHistory & { tag?: string })[], tag: string) => records.find(record => record.tag === tag)!.editionStats![TAG]!.notes!;
        expect(notes(mechArmorTypes, "ferro-fibrous")).toContain("1.12 (Inner Sphere) or 1.2 (Clan)");
        expect(notes(mechArmorTypes, "ferro-fibrous")).toContain("14 critical slots (Inner Sphere) or 7 (Clan)");
        expect(notes(mechInternalStructureTypes, "endo-steel")).toContain("14 critical slots (Inner Sphere) or 7 (Clan)");
        expect(notes(mechHeatSinkTypes, "double")).toContain("3 critical slots (Inner Sphere)");
        expect(notes(mechEngineTypes, "xl")).toContain("3 in the left torso and 3 in the right");
        expect(notes(mechEngineTypes, "clan_xl")).toContain("2 in the left torso and 2 in the right");
        expect(mechMyomerTypes.find(myomer => myomer.tag === "tsm")!.editionStats![TAG]!.criticals).toBe(6);
        expect(notes(equipment, "masc")).toContain("divided by 20");
        expect(notes(equipment, "clan-masc")).toContain("divided by 25");
        expect(notes(mechTypeOptions, "lam")).toContain("never heavier than 55 tons");
    });

    // BTC p.116: the Beagle row is printed one column to the right (4 / 1.5 / 2 under Tonnage / Critical / Ammo).
    it("records the Beagle Active Probe's shifted row as an erratum", () => {
        const stats = equipment.find(record => record.tag === "beagle-active-probe")!.editionStats![TAG]!;
        expect(stats.errata).toContain("one column to the right");
        expect(stats.notes).toContain("within 4 hexes");
    });
});

// BattleTech, Third Edition (FASA 1604, 1992), read from the page images of the box set's rulebook: BattleMech
// Design pp.41-43, the Fusion Engine Table and Inner Sphere Weapons Table p.44, and the fourteen pregenerated
// record sheets. An introductory game: it holds the 3025 weapons only and prints no prices.
describe("Rules editions: Third Edition, complete", () => {
    const TAG = "battletech-3rd-edition";
    const find = (tag: string) => equipment.find(item => item.tag === tag)!;

    // Of everything the Manual and Compendium added, only the Autocannon/2, /10 and /20 are in this box.
    it("includes the Second Edition's records and the three autocannon the Manual added", () => {
        expect(inEdition(TAG)).toEqual([
            ...inEdition("battletech-2nd-edition"),
            "equipment autocannon-standard-a", "equipment autocannon-standard-c", "equipment autocannon-standard-d",
            "equipment ammo-is-ac-2-standard", "equipment ammo-is-ac-10-standard", "equipment ammo-is-ac-20-standard",
        ].sort());
        const edition = getRulesEditions().find(entry => entry.tag === TAG)!;
        expect(edition.complete).toBe(true);
        expect(edition.mechs).toHaveLength(14);
        expect(edition.otherUnits).toEqual([]);
    });

    // BT3 p.44, Inner Sphere Weapons Table: heat, damage, minimum, short, medium, long, tonnage, critical, ammo.
    const table: [string, number, number, number, number, number, number, number, number, number | undefined][] = [
        ["standard-flamer", 3, 2, 0, 1, 2, 3, 1, 1, undefined],
        ["large-laser", 8, 8, 0, 5, 10, 15, 5, 2, undefined],
        ["medium-laser", 3, 5, 0, 3, 6, 9, 1, 1, undefined],
        ["small-laser", 1, 3, 0, 1, 2, 3, 0.5, 1, undefined],
        ["standard-ppc", 10, 10, 3, 6, 12, 18, 7, 3, undefined],
        ["autocannon-standard-a", 1, 2, 4, 8, 16, 24, 6, 1, 45],
        ["autocannon-standard-b", 1, 5, 3, 6, 12, 18, 8, 4, 20],
        ["autocannon-standard-c", 3, 10, 0, 5, 10, 15, 12, 7, 10],
        ["autocannon-standard-d", 7, 20, 0, 3, 6, 9, 14, 10, 5],
        ["machine-gun", 0, 2, 0, 1, 2, 3, 0.5, 1, 200],
        ["lrm-5", 2, 1, 6, 7, 14, 21, 2, 1, 24],
        ["lrm-10", 4, 1, 6, 7, 14, 21, 5, 2, 12],
        ["lrm-15", 5, 1, 6, 7, 14, 21, 7, 3, 8],
        ["lrm-20", 6, 1, 6, 7, 14, 21, 10, 5, 6],
        ["srm-2", 2, 2, 0, 3, 6, 9, 1, 1, 50],
        ["srm-4", 3, 2, 0, 3, 6, 9, 2, 1, 25],
        ["srm-6", 4, 2, 0, 3, 6, 9, 3, 2, 15],
    ];
    it.each(table)("%s carries the printed Weapons Table row", (tag, heat, damage, min, short, medium, long, tons, slots, shots) => {
        const stats = find(tag).editionStats![TAG]!;
        expect([stats.book, stats.page]).toEqual(["BT3", 44]);
        expect(stats.heat).toBe(heat);
        expect(stats.damage ?? stats.damagePerMissile).toBe(damage);
        expect(stats.range).toEqual({ min, short, medium, long });
        expect([stats.weight, stats.criticals, stats.shotsPerTon]).toEqual([tons, slots, shots]);
    });

    it("prints the Compendium's rows for those weapons, without their prices", () => {
        const numbers = (stats: IEditionStats) => JSON.stringify([stats.heat, stats.damage, stats.damagePerMissile, stats.range,
            stats.weight, stats.criticals, stats.shotsPerTon]);
        for (const [tag] of table) {
            expect(numbers(find(tag).editionStats![TAG]!), tag).toBe(numbers(getEditionStats(find(tag), "battletech-compendium")!));
        }
        const priced = labelled.filter(entry => entry.record.editionStats?.[TAG]?.cbills !== undefined).map(entry => entry.label);
        expect(priced).toEqual([]);
        expect(getEditionStats(find("medium-laser"), "battletech-compendium")!.cbills).toBe(40000);
    });

    // BT3 p.43: half-ton lots for machine guns only; shots per ton from the table's Ammo column.
    it("counts ammunition by the ton", () => {
        expect(["ammo-is-ac-2-standard", "ammo-is-ac-5-standard", "ammo-is-ac-10-standard", "ammo-is-ac-20-standard", "ammo-machine-gun-standard"]
            .map(tag => find(tag).editionStats![TAG]!.shotsPerTon)).toEqual([45, 20, 10, 5, 200]);
        expect(find("ammo-lrm-standard").editionStats![TAG]!.notes).toContain("24 (LRM-5), 12 (LRM-10), 8 (LRM-15), 6 (LRM-20)");
        expect(find("ammo-srm-standard").editionStats![TAG]!.notes).toContain("50 (SRM-2), 25 (SRM-4), 15 (SRM-6)");
        expect(find("ammo-machine-gun-standard").editionStats![TAG]!.notes).toContain("half-ton lots");
    });

    // Engine table p.44, structure table p.42, jump jets p.43, cockpit and gyro p.42, armor p.43: as the
    // Compendium has them. The heat sink has its own entry because the price is gone.
    it("leaves the engine, structure, controls, jump jets, armor, layout and tonnages unchanged", () => {
        const unchanged = labelled.filter(entry => entry.record.editionStats && TAG in entry.record.editionStats && entry.record.editionStats[TAG] === null)
            .map(entry => entry.label).sort();
        expect(unchanged).toEqual([
            "armor standard", "cockpit standard", "engine standard", "gyro standard", "jump jet standard", "mech type biped",
            "structure standard",
            ...[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(tons => `tonnage ${tons}`),
        ].sort());
        expect(getEditionStats(mechEngineTypes.find(type => type.tag === "standard")!, TAG)!.engineWeights![400]).toBe(52.5);
        expect(getEditionStats(mechInternalStructureTypes.find(type => type.tag === "standard")!, TAG)!.structure![100])
            .toEqual({ head: 3, ct: 31, torso: 21, arm: 17, leg: 21 });
        expect(getEditionStats(mechJumpJetTypes.find(type => type.tag === "standard")!, TAG)!.weightByTonnage)
            .toEqual([{ upTo: 55, tons: 0.5 }, { upTo: 85, tons: 1 }, { upTo: 100, tons: 2 }]);
        expect(getEditionStats(mechArmorTypes.find(type => type.tag === "standard")!, TAG)!.pointsPerTon).toBe(16);
        const sink = mechHeatSinkTypes.find(type => type.tag === "single")!.editionStats![TAG]!;
        expect([sink.weight, sink.criticals, sink.cbills]).toEqual([1, 1, undefined]);
        expect(sink.notes).toContain("divided by 25");
    });
});

// BattleTech Compendium: The Rules of Warfare (FASA, 1994), read from the page images of the third printing.
describe("Rules editions: The Rules of Warfare, complete", () => {
    const TAG = "compendium-rules-of-warfare";
    const BEFORE = "battletech-compendium";
    const find = (tag: string) => equipment.find(item => item.tag === tag)!;
    const figures = (stats: IEditionStats) => [stats.heat, stats.damage ?? stats.damagePerMissile,
        stats.range && [stats.range.min, stats.range.short, stats.range.medium, stats.range.long],
        stats.weight, stats.criticals, stats.shotsPerTon, stats.cbills];
    const row = (tag: string) => figures(find(tag).editionStats![TAG]!);

    // BTC:RoW p.7: a ground game, so the 1990 Compendium's AeroTech rules are gone and Land-Air BattleMechs move
    // to the Tactical Handbook. New: torpedoes (BTC:RoW p.121), Narc-equipped missiles (BTC:RoW p.119), single-shot
    // Streak and Narc launchers (BTC:RoW p.120) and the ordnance of aerospace support fighters (BTC:RoW p.73).
    it("includes the Compendium's records less Ferro-Aluminum armor and LAMs, and thirty-seven new ones", () => {
        const added = labelled.filter(entry => entry.record.introducedInEdition === TAG).map(entry => entry.label);
        const dropped = ["armor ferro-aluminum", "mech type lam"];
        expect(inEdition(BEFORE).filter(label => !inEdition(TAG).includes(label)).sort()).toEqual(dropped);
        expect(inEdition(TAG)).toEqual([...inEdition(BEFORE).filter(label => !dropped.includes(label)), ...added].sort());
        expect(added.sort()).toEqual([
            ...["is", "clan"].flatMap(base => ["lrm-narc", "srm-narc", "lrt-standard", "srt-standard"].map(kind => `equipment ammo-${base}-${kind}`)),
            ...["", "clan-"].flatMap(base => ["lrt-5", "lrt-10", "lrt-15", "lrt-20", "srt-2", "srt-4", "srt-6"].map(kind => `equipment ${base}${kind}`)),
            ...["streak-srm-2-os", "narc-os", "clan-streak-srm-2-os", "clan-streak-srm-4-os", "clan-streak-srm-6-os", "clan-narc-os"].map(tag => "equipment " + tag),
            ...["is", "clan"].flatMap(base => ["thunder", "arrow-iv", "arrow-iv-homing", "tag"].map(kind => `equipment ammo-${base}-bomb-${kind}`)),
            "equipment ammo-bomb-cluster",
        ].sort());
        expect(added).toHaveLength(37);
        const edition = getRulesEditions().find(entry => entry.tag === TAG)!;
        expect(edition.complete).toBe(true);
        expect(edition.mechs).toEqual(["RVN-3L Raven", "BSW-X1 Bushwacker", "AXM-2N Axman", "MAL-1R Mauler",
            "Hunchback IIC", "Mad Dog (Vulture)", "Summoner (Thor)", "Timber Wolf (Mad Cat)"]);
        expect(edition.otherUnits).toHaveLength(16);
        expect(edition.otherUnits).toContain("Gun emplacement");
    });

    // BTC:RoW pp.104-106 and p.124 against BTC pp.115-116 and p.129: every weapon row and price is reprinted.
    // Two differences are columns the Compendium entries leave empty: the Double Heat Sink's heat and critical
    // slots, and the Hatchet's heat.
    it("reprints the Compendium's rows and prices", () => {
        const changed = labelled.filter(({ record }) => {
            const [old, current] = [record.editionStats?.[BEFORE], record.editionStats?.[TAG]];
            return old && current && JSON.stringify(figures(old)) !== JSON.stringify(figures(current));
        }).map(entry => entry.label);
        // The other three gain a price the Compendium's entries do not have (user rulings, 2026-10-08).
        expect(changed.sort()).toEqual(["equipment clan-active-probe", "equipment clan-ecm-system",
            "equipment melee-hatchet", "equipment vehicle-flamer", "heat sink double"]);
        const cited = labelled.filter(({ record }) => record.editionStats?.[TAG]).map(({ record }) => record.editionStats![TAG]!);
        expect(cited.every(stats => stats.book === "BTC:RoW")).toBe(true);
        expect(cited.filter(stats => /\bBTC p/.test(stats.notes ?? ""))).toEqual([]);
        // Only the four prices filled by ruling look ahead to the Master Rules.
        expect(cited.filter(stats => /BMR p/.test(stats.notes ?? "")).map(stats => stats.cbills).sort((a, b) => a! - b!)).toEqual([1000, 7500, 200000, 200000]);
    });

    // BTC:RoW pp.105-106, Inner Sphere Weapons and Equipment Table; prices p.124.
    it.each([
        ["er-large-laser", 105, [12, 8, [0, 7, 14, 19], 5, 2, undefined, 200000]],
        ["er-ppc", 105, [15, 10, [0, 7, 14, 23], 7, 3, undefined, 300000]],
        ["medium-pulse-laser", 105, [4, 6, [0, 2, 4, 6], 2, 1, undefined, 60000]],
        ["standard-gauss-rifle", 105, [1, 15, [2, 7, 15, 22], 15, 7, 8, 300000]],
        ["autocannon-lbx-10", 105, [2, 10, [0, 6, 12, 18], 11, 6, 10, 400000]],
        ["autocannon-ultra-b", 105, [1, 5, [2, 6, 13, 20], 9, 5, 20, 200000]],
        ["lrm-15", 105, [5, 1, [6, 7, 14, 21], 7, 3, 8, 175000]],
        ["streak-srm-2", 105, [2, undefined, [0, 3, 6, 9], 1.5, 1, 50, 15000]],
        ["narc", 105, [0, undefined, [0, 3, 6, 9], 3, 2, 6, 100000]],
        ["beagle-active-probe", 106, [undefined, undefined, undefined, 1.5, 2, undefined, 200000]],
        ["c3-computer-master", 106, [undefined, undefined, undefined, 5, 5, undefined, 1500000]],
        ["is-tag", 106, [0, undefined, [0, 5, 9, 15], 1, 1, undefined, 50000]],
    ] as [string, number, unknown[]][])("prints the Inner Sphere %s row", (tag, page, expected) => {
        expect(row(tag)).toEqual(expected);
        expect(find(tag).editionStats![TAG]!.page).toBe(page);
    });

    // BTC:RoW pp.104-105, Clan Weapons and Equipment Table; prices p.124.
    it.each([
        ["clan-er-large-laser", 104, [12, 10, [0, 8, 15, 25], 4, 1, undefined, 200000]],
        ["er-ppc-clan", 104, [15, 15, [0, 7, 14, 23], 6, 2, undefined, 300000]],
        ["clan_large-pulse-laser", 104, [10, 10, [0, 6, 14, 20], 6, 2, undefined, 175000]],
        ["clan-autocannon-lbx-20", 104, [6, 20, [0, 4, 8, 12], 12, 9, 5, 600000]],
        ["clan-autocannon-uac-2", 104, [1, 2, [2, 9, 18, 27], 5, 2, 45, 120000]],
        ["clan-machine-gun", 104, [0, 2, [0, 1, 2, 3], 0.25, 1, 200, 5000]],
        ["clan-lrm-20", 104, [6, 1, [0, 7, 14, 21], 5, 4, 6, 250000]],
        ["clan-streak-srm-6", 104, [4, undefined, [0, 4, 8, 12], 3, 2, 15, 120000]],
        ["clan-a-pod", 104, [0, undefined, undefined, 0.5, 1, undefined, 1500]],
        ["clan-tag", 105, [0, undefined, [0, 5, 9, 15], 1, 1, undefined, 50000]],
    ] as [string, number, unknown[]][])("prints the Clan %s row", (tag, page, expected) => {
        expect(row(tag)).toEqual(expected);
        expect(find(tag).editionStats![TAG]!.page).toBe(page);
    });

    // BTC:RoW p.124 has rows for the Beagle Active Probe and the Guardian ECM Suite only, and one Flamer row.
    // User rulings, 2026-10-08: the list prices an item once for both technology bases, so the Clan probe and
    // ECM suite take the Inner Sphere price; the Vehicle Flamer and its ammunition take MegaMek's prices.
    it("fills the four prices the list does not print, and says where each comes from", () => {
        const stats = (tag: string) => find(tag).editionStats![TAG]!;
        expect(["clan-active-probe", "clan-ecm-system"].map(tag => stats(tag).cbills)).toEqual([200000, 200000]);
        expect(["beagle-active-probe", "ecm-suite"].map(tag => stats(tag).cbills)).toEqual([200000, 200000]);
        expect(["vehicle-flamer", "ammo-vehicle-flamer-standard"].map(tag => stats(tag).cbills)).toEqual([7500, 1000]);
        for (const tag of ["clan-active-probe", "clan-ecm-system", "vehicle-flamer", "ammo-vehicle-flamer-standard"]) {
            expect(stats(tag).notes, tag).toContain("user ruling, 2026-10-08");
        }
        // The shared prices that ruling rests on: the same figure on either table.
        for (const [inner, clan] of [["er-large-laser", "clan-er-large-laser"], ["er-ppc", "er-ppc-clan"], ["standard-gauss-rifle", "clan-gauss-rifle"],
            ["autocannon-lbx-10", "clan-autocannon-lbx-10"], ["autocannon-ultra-b", "clan-autocannon-uac-5"], ["streak-srm-2", "clan-streak-srm-2"],
            ["narc", "clan-narc"], ["is-ams", "clan-ams"], ["is-tag", "clan-tag"]]) {
            expect(stats(clan).cbills, clan).toBe(stats(inner).cbills);
        }
    });

    // BTC:RoW p.120 allows a single-shot launcher a Streak or Narc fitting "at double the base cost of the
    // launcher"; p.124 says single-shot launchers are "Half normal". The two do not settle a price.
    it("enters the single-shot Streak and Narc launchers without a price", () => {
        for (const tag of ["streak-srm-2", "narc", "clan-streak-srm-2", "clan-streak-srm-4", "clan-streak-srm-6", "clan-narc"]) {
            const [launcher, single] = [find(tag).editionStats![TAG]!, find(tag + "-os").editionStats![TAG]!];
            expect([single.page, single.weight, single.heat, single.range, single.cbills], tag)
                .toEqual([120, launcher.weight! + 0.5, launcher.heat, launcher.range, undefined]);
            expect(single.notes).toContain("double the base cost of the launcher");
            expect(single.notes).toContain("Half normal");
        }
    });

    // BTC:RoW pp.104-106 and p.80, Artillery Table: damage to the target hex and the adjacent hexes, range in mapsheets.
    it("prints the artillery rows", () => {
        const piece = (tag: string) => {
            const stats = find(tag).editionStats![TAG]!;
            return [stats.heat, stats.damage, stats.damageAdjacent, stats.rangeMapsheets, stats.weight, stats.criticals, stats.shotsPerTon, stats.cbills];
        };
        expect(piece("arrow-iv-system")).toEqual([10, 20, 10, 5, 15, 15, 5, 450000]);
        expect(piece("clan-arrow-iv-system")).toEqual([10, 20, 10, 6, 12, 12, 5, 450000]);
        expect(piece("long-tom-artillery")).toEqual([20, 20, 10, 20, 30, 30, 5, 450000]);
        expect(piece("sniper-artillery")).toEqual([10, 10, 5, 12, 20, 20, 10, 300000]);
        expect(piece("thumper-artillery")).toEqual([6, 5, 2, 14, 15, 15, 20, 187500]);
    });

    // BTC:RoW p.120: single-shot launchers weigh half a ton more; p.124: half the normal price.
    it.each(["lrm-5", "lrm-20", "srm-2", "srm-6", "clan-lrm-15", "clan-srm-4"])("derives the single-shot %s from the standard launcher", tag => {
        const [launcher, single] = [find(tag).editionStats![TAG]!, find(tag + "-os").editionStats![TAG]!];
        expect([single.page, single.weight, single.cbills, single.heat]).toEqual([120, launcher.weight! + 0.5, launcher.cbills! / 2, launcher.heat]);
    });

    // BTC:RoW p.121: torpedo stats are those of the land-based launcher; no table row and no price.
    it("gives torpedo launchers the matching missile launcher's figures and no price", () => {
        for (const [torpedo, launcher] of [["lrt-10", "lrm-10"], ["srt-6", "srm-6"], ["clan-lrt-20", "clan-lrm-20"], ["clan-srt-2", "clan-srm-2"]]) {
            const [a, b] = [find(torpedo).editionStats![TAG]!, find(launcher).editionStats![TAG]!];
            expect([a.page, a.heat, a.range, a.weight, a.criticals, a.shotsPerTon, a.cbills], torpedo)
                .toEqual([121, b.heat, b.range, b.weight, b.criticals, b.shotsPerTon, undefined]);
            expect(find(torpedo).introducedInEdition).toBe(TAG);
        }
    });

    // BTC:RoW p.124: munitions priced as multiples of the standard ton; p.119: Narc-equipped missiles cost twice.
    it("prices ammunition and munitions", () => {
        const stats = (tag: string) => find(tag).editionStats![TAG]!;
        const load = (tag: string) => [stats(tag).shotsPerTon, stats(tag).cbills];
        expect(["ammo-is-ac-2-standard", "ammo-is-ac-5-standard", "ammo-is-ac-10-standard", "ammo-is-ac-20-standard"].map(load))
            .toEqual([[45, 1000], [20, 4500], [10, 6000], [5, 10000]]);
        expect([2, 5, 10, 20].map(size => [stats(`ammo-clan-lb-${size}x-standard`).cbills, stats(`ammo-clan-lb-${size}x-cluster`).cbills]))
            .toEqual([[2000, 3300], [9000, 15000], [12000, 20000], [20000, 34000]]);
        expect([2, 5, 10, 20].map(size => load(`ammo-clan-ultra-ac-${size}-standard`))).toEqual([[45, 1000], [20, 9000], [10, 12000], [5, 20000]]);
        expect(["ammo-lrm-standard", "ammo-srm-standard", "ammo-srm-inferno"].map(tag => stats(tag).cbills)).toEqual([30000, 27000, 13500]);
        expect(["ammo-is-lrm-artemis-iv", "ammo-is-srm-artemis-iv", "ammo-is-lrm-swarm", "ammo-is-lrm-thunder", "ammo-clan-lrm-fascam"].map(tag => stats(tag).cbills))
            .toEqual([60000, 54000, 60000, 60000, 60000]);
        expect(["ammo-is-lrm-narc", "ammo-clan-srm-narc"].map(tag => [stats(tag).page, stats(tag).cbills])).toEqual([[119, 60000], [119, 54000]]);
        expect(["ammo-is-arrow-iv-standard", "ammo-is-arrow-iv-homing", "ammo-long-tom-standard", "ammo-sniper-standard", "ammo-thumper-standard"].map(load))
            .toEqual([[5, 10000], [5, 15000], [5, 10000], [10, 6000], [20, 4500]]);
        expect(stats("ammo-clan-arrow-iv-fascam").cbills).toBeUndefined();
    });

    // BTC:RoW p.73: aerospace support fighters carry high-explosive, cluster, inferno and mine-type bombs, Arrow IV
    // missiles and TAG. Each is its own record.
    it("gives each kind of aerospace support ordnance its own record", () => {
        const stats = (tag: string) => find(tag).editionStats![TAG]!;
        expect(stats("ammo-bomb-standard")).toMatchObject({ page: 73, name: "High Explosive (HE) Bomb" });
        expect(stats("ammo-bomb-standard").notes).toContain("10 points");
        expect(stats("ammo-bomb-standard").notes).not.toContain("Cluster");
        expect(stats("ammo-bomb-cluster").notes).toContain("5 points");
        expect(stats("ammo-bomb-inferno").notes).toContain("30 turns");
        for (const base of ["is", "clan"]) {
            expect(stats(`ammo-${base}-bomb-thunder`).notes).toContain("20-point minefield");
            expect(stats(`ammo-${base}-bomb-arrow-iv`).notes).toContain("space of 5 bombs");
            expect(stats(`ammo-${base}-bomb-arrow-iv-homing`).notes).toContain("homing version");
            expect(stats(`ammo-${base}-bomb-tag`).notes).toContain("space of 1 bomb");
        }
        // No aerospace units in the Master Rules: none of this ordnance carries over.
        expect(["ammo-bomb-cluster", "ammo-is-bomb-thunder", "ammo-clan-bomb-tag"].map(tag => isInRulesEdition(find(tag), "master-rules"))).toEqual([false, false, false]);
    });

    // BTC:RoW p.100: BattleMechs weigh between 10 and 100 tons, and the Internal Structure Table runs from 10.
    it("builds BattleMechs from 10 to 100 tons on the Manual's Internal Structure Table", () => {
        const tons = btMechTonnages.filter(entry => entry.editionStats && TAG in entry.editionStats).map(entry => entry.tons);
        expect(tons).toEqual(Array.from({ length: 19 }, (_, index) => 10 + index * 5));
        const structure = getEditionStats(mechInternalStructureTypes.find(type => type.tag === "standard")!, TAG)!.structure!;
        // Read from the table on BTC:RoW p.100: center torso, left/right torso, each arm, each leg.
        const printed: Record<number, number[]> = {
            10: [4, 3, 1, 2], 15: [5, 4, 2, 3], 20: [6, 5, 3, 4], 25: [8, 6, 4, 6], 30: [10, 7, 5, 7], 35: [11, 8, 6, 8], 40: [12, 10, 6, 10],
            45: [14, 11, 7, 11], 50: [16, 12, 8, 12], 55: [18, 13, 9, 13], 60: [20, 14, 10, 14], 65: [21, 15, 10, 15], 70: [22, 15, 11, 15],
            75: [23, 16, 12, 16], 80: [25, 17, 13, 17], 85: [27, 18, 14, 18], 90: [29, 19, 15, 19], 95: [30, 20, 16, 20], 100: [31, 21, 17, 21],
        };
        expect(Object.fromEntries(Object.entries(structure).map(([weight, boxes]) => [weight, [boxes.ct, boxes.torso, boxes.arm, boxes.leg]]))).toEqual(printed);
    });

    // BTC:RoW p.116 (endo steel, ferro-fibrous), p.122 (XL Engines Table), pp.121-122 (TSM), p.87 (quads).
    it("keeps the components, with the changes noted", () => {
        const unchanged = labelled.filter(entry => entry.record.editionStats && TAG in entry.record.editionStats && entry.record.editionStats[TAG] === null)
            .map(entry => entry.label).sort();
        expect(unchanged).toEqual([
            "armor standard", "cockpit standard", "engine standard", "gyro standard", "jump jet standard", "mech type biped", "structure standard",
            ...Array.from({ length: 19 }, (_, index) => "tonnage " + (10 + index * 5)),
        ].sort());
        const engine = (tag: string) => mechEngineTypes.find(type => type.tag === tag)!.editionStats![TAG]!;
        expect(engine("xl").notes).toContain("3 critical slots in the left torso and 3 in the right");
        expect(engine("clan_xl").notes).toContain("2 critical slots in the left torso and 2 in the right");
        expect(engine("ice").notes).toContain("one half of the fusion plant");
        expect(mechArmorTypes.find(type => type.tag === "ferro-fibrous")!.editionStats![TAG]!.notes).toContain("round .5 down");
        expect(mechHeatSinkTypes.find(type => type.tag === "double")!.editionStats![TAG]).toMatchObject({ page: 106, heat: -2, criticals: 3 });
        expect(mechMyomerTypes.find(type => type.tag === "tsm")!.editionStats![TAG]).toMatchObject({ page: 121, criticals: 6 });
        expect(mechTypeOptions.find(type => type.tag === "quad")!.editionStats![TAG]!.notes).toContain("12 fewer critical slots");
    });
});

// BattleTech, Fourth Edition (FASA, 1996), read from the page images of the box set's rulebook: Construction
// pp.40-44, the Weapons and Equipment Table p.45 and the Equipment section p.46. The Third Edition's weapons
// with the hatchet, the vehicle flamer and single-shot missile launchers; still no prices.
describe("Rules editions: Fourth Edition, complete", () => {
    const TAG = "battletech-4th-edition";
    const PREVIOUS = "battletech-3rd-edition";
    const find = (tag: string) => equipment.find(item => item.tag === tag)!;
    const numbers = (stats: IEditionStats) => JSON.stringify([stats.heat, stats.damage, stats.damagePerMissile, stats.range,
        stats.weight, stats.criticals, stats.shotsPerTon]);

    it("includes the Third Edition's records, the hatchet, the vehicle flamer and single-shot launchers", () => {
        expect(inEdition(TAG)).toEqual([
            ...inEdition(PREVIOUS),
            "equipment melee-hatchet", "equipment vehicle-flamer", "equipment ammo-vehicle-flamer-standard",
            "equipment lrm-5-os", "equipment lrm-10-os", "equipment lrm-15-os", "equipment lrm-20-os",
            "equipment srm-2-os", "equipment srm-4-os", "equipment srm-6-os",
        ].sort());
        const edition = getRulesEditions().find(entry => entry.tag === TAG)!;
        expect(edition.complete).toBe(true);
        // BT4 p.5 counts twenty-four designs; the rulebook names twenty of them (pp.36-39).
        expect(edition.mechs).toHaveLength(20);
        expect(edition.notModelled!.some(note => note.includes("twenty-four"))).toBe(true);
        expect(edition.otherUnits).toEqual([]);
    });

    // BT4 p.45 reprints the Third Edition's seventeen rows figure for figure.
    it("reprints the Third Edition's weapon rows", () => {
        const weapons = equipment.filter(item => item.editionStats?.[PREVIOUS]?.range);
        expect(weapons).toHaveLength(17);
        for (const weapon of weapons) {
            const stats = weapon.editionStats![TAG]!;
            expect([stats.book, stats.page], weapon.tag).toEqual(["BT4", 45]);
            expect(numbers(stats), weapon.tag).toBe(numbers(weapon.editionStats![PREVIOUS]!));
        }
        expect(find("lrm-15").editionStats![TAG]!.name).toBe("LRM 15");
    });

    // BT4 p.45: Flamer (Vehicle), heat 3, damage 2, ranges 1 / 2 / 3, .5 tons, 1 critical, 20 shots.
    it("lists the vehicle flamer on the 'Mech table", () => {
        const stats = find("vehicle-flamer").editionStats![TAG]!;
        expect([stats.heat, stats.damage, stats.range, stats.weight, stats.criticals, stats.shotsPerTon])
            .toEqual([3, 2, { min: 0, short: 1, medium: 2, long: 3 }, 0.5, 1, 20]);
        expect(find("ammo-vehicle-flamer-standard").editionStats![TAG]!.shotsPerTon).toBe(20);
    });

    // BT4 pp.45-46: tonnage / 5 damage, tonnage / 15 tons and critical slots.
    it("prints the hatchet as a table row", () => {
        const stats = find("melee-hatchet").editionStats![TAG]!;
        expect([stats.page, stats.heat, stats.weight, stats.criticals]).toEqual([45, 0, undefined, undefined]);
        expect(stats.notes).toContain("tonnage divided by 5");
        expect(stats.notes).toContain("tonnage divided by 15");
    });

    // BT4 p.46: a single-shot launcher weighs half a ton more than the standard one and is otherwise the same.
    it.each([["lrm-5", 2.5], ["lrm-10", 5.5], ["lrm-15", 7.5], ["lrm-20", 10.5], ["srm-2", 1.5], ["srm-4", 2.5], ["srm-6", 3.5]] as [string, number][])(
        "%s (OS) weighs half a ton more than the launcher", (tag, tons) => {
            const launcher = find(tag).editionStats![TAG]!;
            const single = find(`${tag}-os`).editionStats![TAG]!;
            expect(single.weight).toBe(tons);
            expect(single.weight).toBe(launcher.weight! + 0.5);
            expect([single.heat, single.damagePerMissile, single.range]).toEqual([launcher.heat, launcher.damagePerMissile, launcher.range]);
            expect([single.page, single.criticals, single.shotsPerTon]).toEqual([46, undefined, undefined]);
        });

    it("prints no prices", () => {
        expect(labelled.filter(entry => entry.record.editionStats?.[TAG]?.cbills !== undefined).map(entry => entry.label)).toEqual([]);
    });

    // Engine table p.41, structure table p.40, jump jets p.43, cockpit and gyro p.40, armor pp.43-44.
    it("leaves the engine, structure, controls, jump jets, armor, layout and tonnages unchanged", () => {
        const unchanged = labelled.filter(entry => entry.record.editionStats && TAG in entry.record.editionStats && entry.record.editionStats[TAG] === null)
            .map(entry => entry.label).sort();
        expect(unchanged).toEqual([
            "armor standard", "cockpit standard", "engine standard", "gyro standard", "jump jet standard", "mech type biped",
            "structure standard",
            ...[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(tons => `tonnage ${tons}`),
        ].sort());
        expect(getEditionStats(mechEngineTypes.find(type => type.tag === "standard")!, TAG)!.engineWeights![400]).toBe(52.5);
        expect(getEditionStats(mechInternalStructureTypes.find(type => type.tag === "standard")!, TAG)!.structure![100])
            .toEqual({ head: 3, ct: 31, torso: 21, arm: 17, leg: 21 });
        const sink = mechHeatSinkTypes.find(type => type.tag === "single")!.editionStats![TAG]!;
        expect([sink.page, sink.heat, sink.weight, sink.criticals]).toEqual([45, -1, 1, 1]);
    });
});

describe("Rules editions: Master Rules, complete", () => {
    const TAG = "master-rules";
    const find = (tag: string) => equipment.find(item => item.tag === tag)!;
    const row = (tag: string) => {
        const stats = find(tag).editionStats![TAG]!;
        return [stats.heat, stats.damage ?? stats.damagePerMissile, stats.range && [stats.range.min, stats.range.short, stats.range.medium, stats.range.long],
            stats.weight, stats.criticals, stats.shotsPerTon, stats.cbills];
    };

    // BMR p.5: the book supersedes the BattleTech Manual, the Compendium, The Rules of Warfare and the Fourth
    // Edition. It has no aerospace units, so the Compendium's bombs, Ferro-Aluminum armor and Land-Air BattleMechs
    // go, and BattleMechs now start at 20 tons (BMR p.109).
    it("includes the earlier rulebooks' records less the aerospace ones, and sixty-seven new ones", () => {
        const bombs = ["bomb-cluster", "bomb-inferno", "bomb-standard",
            ...["clan", "is"].flatMap(base => ["arrow-iv", "arrow-iv-homing", "tag", "thunder"].map(kind => `${base}-bomb-${kind}`))];
        const dropped = ["armor ferro-aluminum", ...bombs.map(kind => "equipment ammo-" + kind), "mech type lam", "tonnage 10", "tonnage 15"].sort();
        const earlier = [...new Set([...inEdition("battletech-compendium"), ...inEdition("compendium-rules-of-warfare"), ...inEdition("battletech-4th-edition")])];
        const added = labelled.filter(entry => entry.record.introducedInEdition === TAG).map(entry => entry.label);
        expect(earlier.filter(label => !inEdition(TAG).includes(label)).sort()).toEqual(dropped);
        expect(inEdition(TAG)).toEqual([...earlier.filter(label => !dropped.includes(label)), ...added].sort());
        expect(added).toHaveLength(67);
        expect(added).toEqual(expect.arrayContaining(["equipment mrm-40", "equipment gauss-rifle-light", "equipment melee-sword",
            "equipment large-heavy-laser", "equipment er-micro-laser", "equipment clan-light-tag", "equipment lrt-5-os", "equipment ammo-is-lrm-semi-guided"]));
        const edition = getRulesEditions().find(entry => entry.tag === TAG)!;
        expect(edition.complete).toBe(true);
        expect(edition.mechs).toEqual([]);
        expect(edition.otherUnits).toHaveLength(15);
    });

    // BMR p.115, Inner Sphere Weapons and Equipment Table; prices p.138.
    it.each([
        ["er-medium-laser", [5, 5, [0, 4, 8, 12], 1, 1, undefined, 80000]],
        ["gauss-rifle-light", [1, 8, [3, 8, 17, 25], 12, 5, 16, 275000]],
        ["autocannon-lbx-20", [6, 20, [0, 4, 8, 12], 14, 11, 5, 600000]],
        ["autocannon-ultra-c", [4, 10, [0, 6, 12, 18], 13, 7, 10, 320000]],
        ["mrm-30", [10, 1, [0, 3, 8, 15], 10, 5, 8, 225000]],
        ["streak-srm-6", [4, undefined, [0, 3, 6, 9], 4.5, 2, 15, 120000]],
        ["medium-laser", [3, 5, [0, 3, 6, 9], 1, 1, undefined, 40000]],
    ] as [string, unknown[]][])("prints the Inner Sphere %s row", (tag, expected) => {
        expect(row(tag)).toEqual(expected);
        expect(find(tag).editionStats![TAG]!.page).toBe(115);
    });

    // BMR pp.116-117, Clan Weapons and Equipment Table; prices p.138.
    it.each([
        ["er-micro-laser", 116, [1, 2, [0, 1, 2, 4], 0.25, 1, undefined, 10000]],
        ["large-heavy-laser", 116, [18, 16, [0, 5, 10, 15], 4, 3, undefined, 250000]],
        ["micro-pulse-laser", 116, [1, 3, [0, 1, 2, 3], 0.5, 1, undefined, 12500]],
        ["clan-light-machine-gun", 117, [0, 1, [0, 2, 4, 6], 0.25, 1, 200, 5000]],
        ["clan-autocannon-uac-20", 117, [7, 20, [0, 4, 8, 12], 12, 8, 5, 480000]],
        ["clan-light-tag", 117, [0, undefined, [0, 3, 6, 9], 0.5, 1, undefined, 40000]],
    ] as [string, number, unknown[]][])("prints the Clan %s row", (tag, page, expected) => {
        expect(row(tag)).toEqual(expected);
        expect(find(tag).editionStats![TAG]!.page).toBe(page);
    });

    // BMR p.117 prints a dash under Long for the Heavy Machine Gun.
    it("records that the Heavy Machine Gun has no long range", () => {
        const stats = find("clan-heavy-machine-gun").editionStats![TAG]!;
        expect([stats.damage, stats.range, stats.shotsPerTon]).toEqual([3, { min: 0, short: 1, medium: 2, long: 0 }, 100]);
        expect(stats.notes).toContain("dash under Long");
    });

    // BMR p.138: one price list for both technology bases; munitions are multiples of the normal price.
    it("prices munitions as multiples of the standard ton", () => {
        const price = (tag: string) => find(tag).editionStats![TAG]!.cbills;
        expect([price("ammo-lrm-standard"), price("ammo-srm-standard")]).toEqual([30000, 27000]);
        expect([price("ammo-is-lrm-fragmentation"), price("ammo-lrm-incendiary"), price("ammo-is-lrm-semi-guided"), price("ammo-is-lrm-swarm-i")])
            .toEqual([60000, 45000, 90000, 90000]);
        expect([price("ammo-is-srm-frag"), price("ammo-srm-inferno"), price("ammo-is-narc-explosive")]).toEqual([54000, 13500, 1500]);
        expect([price("ammo-is-ac-5-standard"), price("ammo-clan-light-machine-gun-standard")]).toEqual([4500, 500]);
    });

    // BMR p.129: any missile launcher can be single-shot, half a ton heavier and half the price (p.138).
    it.each(["lrm-20", "srm-6", "mrm-40", "narc", "streak-srm-4", "clan-lrm-15", "clan-narc", "clan-streak-srm-6"])(
        "%s (OS) weighs half a ton more and costs half", tag => {
            const launcher = find(tag).editionStats![TAG]!;
            const single = find(tag + "-os").editionStats![TAG]!;
            expect([single.weight, single.cbills]).toEqual([launcher.weight! + 0.5, launcher.cbills! / 2]);
            expect([single.page, single.criticals]).toEqual([129, undefined]);
        });

    // BMR p.130: torpedoes take their land-based counterparts' stats; neither table nor price list has a row.
    it("gives torpedo launchers the matching missile launcher's figures and no price", () => {
        for (const [torpedo, missile] of [["lrt-15", "lrm-15"], ["srt-4", "srm-4"], ["clan-lrt-20", "clan-lrm-20"], ["clan-srt-2", "clan-srm-2"]]) {
            expect(row(torpedo).slice(0, 6), torpedo).toEqual(row(missile).slice(0, 6));
            expect(find(torpedo).editionStats![TAG]!.cbills, torpedo).toBeUndefined();
        }
    });

    // The Artemis IV FCS row: 1 ton, 1 critical slot (BMR pp.116, 117), 100,000 C-bills (p.138).
    it("adds the Artemis IV row to each launcher", () => {
        for (const tag of ["lrm-10", "srm-2", "clan-lrm-5", "clan-srm-6"]) {
            const launcher = find(tag).editionStats![TAG]!;
            const artemis = find(tag + "-artemis-iv").editionStats![TAG]!;
            expect([artemis.weight, artemis.criticals, artemis.cbills], tag).toEqual([launcher.weight! + 1, launcher.criticals! + 1, launcher.cbills! + 100000]);
        }
    });

    // BMR p.71, Artillery Table; pp.116-117.
    it("prints the artillery rows", () => {
        const gun = (tag: string) => {
            const stats = find(tag).editionStats![TAG]!;
            return [stats.heat, stats.damage, stats.damageAdjacent, stats.rangeMapsheets, stats.weight, stats.criticals, stats.shotsPerTon];
        };
        expect(gun("arrow-iv-system")).toEqual([10, 20, 10, 5, 15, 15, 5]);
        expect(gun("clan-arrow-iv-system")).toEqual([10, 20, 10, 6, 12, 12, 5]);
        expect(gun("thumper-artillery")).toEqual([6, 5, 2, 14, 15, 15, 20]);
    });

    // BMR pp.109-113 against p.127: the two statements of the ferro-fibrous rounding are kept side by side.
    it("keeps the components, with the changes noted", () => {
        const unchanged = labelled.filter(entry => entry.record.editionStats && TAG in entry.record.editionStats && entry.record.editionStats[TAG] === null)
            .map(entry => entry.label).sort();
        expect(unchanged).toEqual([
            "armor standard", "cockpit standard", "engine standard", "gyro standard", "jump jet standard", "mech type biped",
            ...[20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(tons => "tonnage " + tons),
        ].sort());
        const structure = mechInternalStructureTypes.find(type => type.tag === "standard")!.editionStats![TAG]!;
        expect(Object.keys(structure.structure!)).toHaveLength(17);
        expect([structure.structure![20], structure.structure![100]])
            .toEqual([{ head: 3, ct: 6, torso: 5, arm: 3, leg: 4 }, { head: 3, ct: 31, torso: 21, arm: 17, leg: 21 }]);
        const ferro = mechArmorTypes.find(type => type.tag === "ferro-fibrous")!.editionStats![TAG]!;
        expect(ferro.notes).toContain("up on .5");
        expect(ferro.notes).toContain("round .5 down");
        const sinks = ["single", "double"].map(tag => mechHeatSinkTypes.find(type => type.tag === tag)!.editionStats![TAG]!);
        expect(sinks.map(sink => [sink.heat, sink.weight, sink.criticals, sink.cbills])).toEqual([[-1, 1, 1, 2000], [-2, 1, 3, undefined]]);
        expect(mechMyomerTypes.find(type => type.tag === "tsm")!.editionStats![TAG]!.criticals).toBe(6);
        expect(mechTypeOptions.find(type => type.tag === "quad")!.editionStats![TAG]!.page).toBe(75);
    });
});

describe("Rules editions: Master Rules, Revised Edition, complete", () => {
    const TAG = "master-rules-revised";
    const BEFORE = "master-rules";
    const find = (tag: string) => equipment.find(item => item.tag === tag)!;
    const figures = (stats: IEditionStats) => [stats.heat, stats.damage ?? stats.damagePerMissile,
        stats.range && [stats.range.min, stats.range.short, stats.range.medium, stats.range.long],
        stats.weight, stats.criticals, stats.shotsPerTon, stats.cbills];
    const row = (tag: string) => figures(find(tag).editionStats![TAG]!);

    // The Revised Edition reprints the Master Rules and adds to it: nothing is dropped.
    it("includes every Master Rules record and forty-five new ones", () => {
        const added = labelled.filter(entry => entry.record.introducedInEdition === TAG).map(entry => entry.label);
        expect(inEdition(TAG)).toEqual([...inEdition(BEFORE), ...added].sort());
        expect(added).toHaveLength(45);
        expect(added).toEqual(expect.arrayContaining(["equipment gauss-rifle-heavy", "equipment rotary-ac-2", "equipment inarc",
            "equipment rocket-launcher-20", "equipment c3i-computer", "equipment targeting-computer", "equipment atm-12",
            "equipment ammo-is-ac-20-precision", "equipment ammo-is-lrm-thunder-active", "equipment ammo-is-arrow-iv-inferno",
            "engine light", "armor stealth-basic"]));
        const edition = getRulesEditions().find(entry => entry.tag === TAG)!;
        expect(edition.complete).toBe(true);
        expect(edition.mechs).toEqual([]);
        expect(edition.otherUnits).toHaveLength(17);
        expect(edition.otherUnits).toContain("ProtoMech");
    });

    // BMR(R) pp.121-123 and p.151 against BMR pp.115-117 and p.138: the old rows are reprinted figure for figure.
    // The one change is the Clan Arrow IV FASCAM round, which now has a price (1.5 x normal, BMR(R) p.151).
    it("reprints the Master Rules rows unchanged", () => {
        const changed = labelled.filter(({ record }) => {
            const [old, current] = [record.editionStats?.[BEFORE], record.editionStats?.[TAG]];
            return old && current && JSON.stringify(figures(old)) !== JSON.stringify(figures(current));
        }).map(entry => entry.label);
        expect(changed).toEqual(["equipment ammo-clan-arrow-iv-fascam"]);
        const cited = labelled.filter(({ record }) => record.editionStats?.[TAG]).map(({ record }) => record.editionStats![TAG]!);
        expect(cited.every(stats => stats.book === "BMR(R)")).toBe(true);
        expect(cited.filter(stats => /BMR p/.test(stats.notes ?? ""))).toEqual([]);
    });

    // BMR(R) pp.121-122, Inner Sphere Weapons and Equipment Table; prices p.151.
    it.each([
        ["gauss-rifle-heavy", 121, [2, 25, [4, 6, 13, 20], 18, 11, 4, 500000]],
        ["rotary-ac-2", 121, [1, 2, [0, 6, 12, 18], 8, 3, 45, 175000]],
        ["rotary-ac-5", 121, [1, 5, [0, 5, 10, 15], 10, 6, 20, 275000]],
        ["inarc", 121, [0, undefined, [0, 4, 9, 15], 5, 3, 4, 250000]],
        ["rocket-launcher-10", 121, [3, 1, [0, 5, 11, 18], 0.5, 1, undefined, 15000]],
        ["rocket-launcher-20", 121, [5, 1, [0, 3, 7, 12], 1.5, 3, undefined, 45000]],
        ["medium-laser", 121, [3, 5, [0, 3, 6, 9], 1, 1, undefined, 40000]],
        ["streak-srm-6", 122, [4, undefined, [0, 3, 6, 9], 4.5, 2, 15, 120000]],
        ["c3i-computer", 122, [0, undefined, undefined, 2.5, 2, undefined, 750000]],
    ] as [string, number, unknown[]][])("prints the Inner Sphere %s row", (tag, page, expected) => {
        expect(row(tag)).toEqual(expected);
        expect(find(tag).editionStats![TAG]!.page).toBe(page);
    });

    // BMR(R) p.121 prints "25/20/10*" for the Heavy Gauss Rifle and p.138 says only that damage falls with range.
    it("records the Heavy Gauss Rifle's printed damage", () => {
        const stats = find("gauss-rifle-heavy").editionStats![TAG]!;
        expect(stats.notes).toContain("25/20/10*");
        expect(find("ammo-is-heavy-gauss-rifle-standard").editionStats![TAG]).toMatchObject({ shotsPerTon: 4, cbills: 20000 });
    });

    // BMR(R) pp.122-123, Clan Weapons and Equipment Table: energy weapons on p.122, the rest on p.123.
    it.each([
        ["er-micro-laser", 122, [1, 2, [0, 1, 2, 4], 0.25, 1, undefined, 10000]],
        ["clan-autocannon-lbx-2", 123, [1, 2, [4, 10, 20, 30], 5, 3, 45, 150000]],
        ["atm-3", 123, [2, 2, [4, 5, 10, 15], 1.5, 2, 20, 50000]],
        ["atm-9", 123, [6, 2, [4, 5, 10, 15], 5, 4, 7, 225000]],
        ["atm-12", 123, [8, 2, [4, 5, 10, 15], 7, 5, 5, 350000]],
        ["clan-light-tag", 123, [0, undefined, [0, 3, 6, 9], 0.5, 1, undefined, 40000]],
    ] as [string, number, unknown[]][])("prints the Clan %s row", (tag, page, expected) => {
        expect(row(tag)).toEqual(expected);
        expect(find(tag).editionStats![TAG]!.page).toBe(page);
    });

    // BMR(R) p.123: the ATM ER and HE rows; p.151 prices ATM ammunition once, at 75,000 C-bills a ton.
    it("gives the ATM loads their own damage and ranges", () => {
        const load = (tag: string) => {
            const stats = find(tag).editionStats![TAG]!;
            return [stats.damagePerMissile, stats.range, stats.cbills];
        };
        expect(load("ammo-clan-atm-er")).toEqual([1, { min: 4, short: 9, medium: 18, long: 27 }, undefined]);
        expect(load("ammo-clan-atm-he")).toEqual([3, { min: 0, short: 3, medium: 6, long: 9 }, undefined]);
        expect(find("ammo-clan-atm-standard").editionStats![TAG]!.cbills).toBe(75000);
    });

    // BMR(R) p.151: munitions are multiples of the normal price; pp.133-134 and 144-145 halve some loads.
    it("prices the new munitions as multiples of the standard ton", () => {
        const stats = (tag: string) => find(tag).editionStats![TAG]!;
        const load = (tag: string) => [stats(tag).shotsPerTon, stats(tag).cbills];
        expect(["ammo-is-ac-2-armor-piercing", "ammo-is-ac-10-armor-piercing", "ammo-is-ac-20-armor-piercing"].map(load))
            .toEqual([[22, 4000], [5, 24000], [2, 40000]]);
        expect(["ammo-is-ac-5-flechette", "ammo-is-ac-20-flechette"].map(load)).toEqual([[20, 6750], [5, 15000]]);
        expect(["ammo-is-ac-5-precision", "ammo-is-ac-20-precision"].map(load)).toEqual([[10, 27000], [2, 60000]]);
        expect(["ammo-is-rotary-ac-2-standard", "ammo-is-rotary-ac-5-standard"].map(load)).toEqual([[45, 3000], [20, 12000]]);
        expect(["augmented", "inferno", "vibrabomb", "active"].map(kind => stats("ammo-is-lrm-thunder-" + kind).cbills))
            .toEqual([120000, 30000, 75000, 90000]);
        expect(["ammo-is-arrow-iv-fascam", "ammo-clan-arrow-iv-fascam", "ammo-is-arrow-iv-inferno", "ammo-is-arrow-iv-vibrabomb"].map(load))
            .toEqual([[5, 15000], [5, 15000], [5, 10000], [5, 20000]]);
        expect(["standard", "ecm", "explosive", "haywire", "nemesis"].map(kind => load("ammo-is-inarc-" + kind)))
            .toEqual([[4, 7500], [4, 15000], [4, 1500], [4, 20000], [4, 10000]]);
    });

    // BMR(R) p.148: the targeting computer is now Inner Sphere equipment too, at 1 ton per 4 tons of weapons.
    it("adds the Inner Sphere targeting computer", () => {
        expect(find("targeting-computer").editionStats![TAG]!.notes).toContain("every 4 tons");
        expect(find("clan-targeting-computer").editionStats![TAG]!.notes).toContain("every 5 tons");
        expect(find("targeting-computer").introducedInEdition).toBe(TAG);
    });

    // BMR(R) p.140: single-shot launchers; p.141: torpedoes.
    it("moves the single-shot launchers and torpedoes to their new pages", () => {
        for (const tag of ["lrm-20", "srm-6", "mrm-40", "narc", "clan-lrm-15", "clan-streak-srm-6"]) {
            const [launcher, single] = [find(tag).editionStats![TAG]!, find(tag + "-os").editionStats![TAG]!];
            expect([single.page, single.weight, single.cbills], tag).toEqual([140, launcher.weight! + 0.5, launcher.cbills! / 2]);
        }
        expect(["lrt-15", "clan-srt-2"].map(tag => find(tag).editionStats![TAG]!.page)).toEqual([141, 141]);
    });

    // BMR(R) pp.117-118 and 139 (light engines), p.147 (stealth armor), p.82 (four-legged BattleMechs).
    it("adds the light engine and stealth armor to the components", () => {
        const unchanged = labelled.filter(entry => entry.record.editionStats && TAG in entry.record.editionStats && entry.record.editionStats[TAG] === null)
            .map(entry => entry.label).sort();
        expect(unchanged).toEqual([
            "armor standard", "cockpit standard", "engine standard", "gyro standard", "jump jet standard", "mech type biped",
            ...[20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(tons => "tonnage " + tons),
        ].sort());
        const light = mechEngineTypes.find(type => type.tag === "light")!;
        expect([light.introducedInEdition, light.editionStats![TAG]!.page]).toEqual([TAG, 139]);
        expect(light.editionStats![TAG]!.notes).toContain("Three-quarters of the standard engine weight");
        const stealth = mechArmorTypes.find(type => type.tag === "stealth-basic")!;
        expect([stealth.introducedInEdition, stealth.editionStats![TAG]!.page]).toEqual([TAG, 147]);
        expect(stealth.editionStats![TAG]!.notes).toContain("12 critical slots");
        const ferro = mechArmorTypes.find(type => type.tag === "ferro-fibrous")!.editionStats![TAG]!;
        expect(ferro.notes).toContain("up on .5");
        expect(ferro.notes).toContain("round .5 down");
        expect(mechTypeOptions.find(type => type.tag === "quad")!.editionStats![TAG]!.page).toBe(82);
    });
});
