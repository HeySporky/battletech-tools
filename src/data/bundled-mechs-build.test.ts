import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import type { IASMULUnit } from "../classes/alpha-strike-unit";
import { untabulate } from "../utils/packed-json";
import {
    buildBundledAccuracy, buildBundledMechs, findLooseMULMatch, getBundledStanding, getMordelUnitUrl, getRenumberedModel, isMULMech, isOfficialMULRecord, loadCanonMechs, loadMULIndex,
    writeBundledMechs, writeMegaMekCustomRecords,
} from "./bundled-mechs-build";

// #241: canon is what the live MUL or MUL 1.0 lists. These records stand in for the MUL's own spellings of 'Mechs
// that Skunk Werks names another way (found by a scan of the bundled designs without a MUL id).
const record = (Id: number, Name: string, Variant: string, Tonnage: number, BattleValue: number) => ({ Id, Name, Variant, Tonnage, BattleValue }) as unknown as IASMULUnit;
const MUL = [
    record(1, "Centurion", "CN9-YLW \"Yen-lo-wang\"", 50, 957),
    record(2, "Centurion", "CN9-YLW2 \"Yen-lo-wang\"", 50, 1415),
    record(3, "Panther", "PNT-8Z", 35, 741),
    record(4, "Scorpion", "SCP-1O", 55, 1098),
    record(5, "Powerman", "SC XVI HaulerMech", 35, 198),
    record(6, "Powerman", "SC XI LoaderMech", 35, 198),
    record(7, "Powerman", "SC XV HaulerMech", 35, 198),
    record(8, "Rock Hound", "AM-PRM-RH7 ProspectorMech", 40, 0),
    record(9, "Rock Hound", "AM-PRM-RH7C \"Rock Possum\" ProspectorMech", 40, 0),
    record(10, "Rifleman", "RFL-4D", 60, 1173),
    record(11, "Tian-zong", "TNZ-N2 (Jasminda)", 75, 1826),
    record(12, "Marauder", "MAD-7R", 75, 1832),
];

it("finds the MUL record a 'Mech's other spelling stands for", () => {
    const find = (chassis: string, model: string, tons: number, bv: number) => findLooseMULMatch(chassis, model, tons, bv, MUL)?.Id;
    expect(find("Centurion", "CN9-YLW \"Yen Lo Wang\"", 50, 957)).toBe(1);
    // The same code and nickname with another BV is the same 'Mech: the build then leaves it out for its BV.
    expect(find("Centurion", "CN9-YLW2 \"Yen Lo Wang\"", 50, 1435)).toBe(2);
    expect(find("Scorpion", "SCP-10", 55, 1098)).toBe(4);
    expect(find("Powerman Loadermech", "SC XV", 35, 198)).toBe(7);
    expect(find("Powerman Loadermech", "SC XVI", 35, 198)).toBe(5);
    expect(find("\"Rock Possum\" ProspectorMech", "AM-PRM-RH7", 40, 479)).toBe(9);
    expect(find("\"Rock Hound\" ProspectorMech", "AM-PRM-RH7", 40, 523)).toBe(8);
    expect(find("Tian-Zong", "TNZ-N3 (Jasminda)", 75, 1826)).toBe(11);
    // Same BV, other numbers: another 'Mech.
    expect(find("Panther", "PNT-9Rh", 35, 741)).toBeUndefined();
    expect(find("Marauder", "MAD-3D (Sanchez)", 75, 1832)).toBeUndefined();
    // A pilot's own 'Mech the MUL does not list.
    expect(find("Rifleman", "RFL-4D (Cyrus)", 60, 1428)).toBeUndefined();
});

// #241: a different submodel under a kept design's name and model takes a free canon designation, else the next number.
it("renames a different submodel to a free canon designation or the next number", () => {
    const canon = [{ name: "Archer ARC-5S", tons: 70, bv: 1500 }, { name: "Archer ARC-6S", tons: 70, bv: 1650 }, { name: "Bane 12", tons: 100, bv: 3000 }];
    const none = () => false;
    expect(getRenumberedModel("Archer", "ARC-5S", 70, 1650, ["ARC-5S"], canon, none)).toBe("ARC-6S");
    expect(getRenumberedModel("Archer", "ARC-5S", 70, 1650, ["ARC-5S"], canon, (model) => model === "ARC-6S")).toBe("ARC-5S 2");
    expect(getRenumberedModel("Archer", "ARC-5S", 70, 1400, ["ARC-5S", "ARC-5S 2"], canon, none)).toBe("ARC-5S 3");
    expect(getRenumberedModel("Bane", "2", 100, 2900, ["1", "2"], canon, none)).toBe("13");
    expect(getRenumberedModel("Archer", "ARC-5S", 70, 1400, ["ARC-5S"], canon, (model) => model === "ARC-5S 2")).toBe("ARC-5S 3");
});

it("reads mordel's canon list, quotes and all", () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "canon-mechs-")), "canon.csv");
    fs.writeFileSync(file, 'name,tons,bv\n"""Battle Tripod"" R/H3L-2X",60,1972\r\n"Atlas AS7-D",100,1897\n');
    expect(loadCanonMechs(file)).toEqual([{ name: '"Battle Tripod" R/H3L-2X', tons: 60, bv: 1972 }, { name: "Atlas AS7-D", tons: 100, bv: 1897 }]);
});

it("keeps a design from an official record sheet canon off the MUL, and a worse standing its gear gives", () => {
    const level = (rulesLevel: number) => ({ getRequiredRulesLevel: () => rulesLevel });
    expect(getBundledStanding("Shrapnel/Starhawk.ssw", level(1))).toEqual({});
    expect(getBundledStanding("megamek/Force Manuals/Davion/x.mtf", level(1))).toEqual({});
    expect(getBundledStanding("MWDA/Blade BLD-7R.ssw", level(1))).toEqual({});
    expect(getBundledStanding("TRO 3025/Atlas AS7-D.ssw", level(1))).toEqual({});
    expect(getBundledStanding("Videogame (Apocryphal)/x.mtf", level(1))).toEqual({ standing: "apocryphal" });
    expect(getBundledStanding("Misc/x.ssw", level(6))).toEqual({ standing: "custom" });
    expect(isOfficialMULRecord({ MulSource: "custom" } as IASMULUnit)).toBe(false);
    expect(isOfficialMULRecord({ MulSource: "mul1" } as IASMULUnit)).toBe(true);
});

// MegaMek keeps an OmniMech configuration in a file of its own; it is compared with that configuration of the kept
// Skunk Werks OmniMech, not with its base (Dire Wolf A was once reported as a design with "different equipment").
it("takes MegaMek's one-configuration file for a duplicate of the kept OmniMech's configuration", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-mechs-build-"));
    const ssw = path.join(root, "ssw"), megamek = path.join(root, "megamek", "3050U");
    fs.mkdirSync(ssw, { recursive: true });
    fs.mkdirSync(megamek, { recursive: true });
    fs.copyFileSync(path.resolve(__dirname, "../utils/__fixtures__/dire-wolf-omni.ssw"), path.join(ssw, "dire-wolf-omni.ssw"));
    fs.copyFileSync(path.resolve(__dirname, "../utils/__fixtures__/daishi-dire-wolf-a.mtf"), path.join(megamek, "Daishi (Dire Wolf) A.mtf"));
    try {
        const build = buildBundledMechs(ssw, path.resolve(__dirname, "mul"), path.join(root, "megamek"));
        expect(build.headers.map((header) => header.name)).toEqual(["Dire Wolf (Daishi)"]);
        expect(build.leftOut).toEqual([expect.objectContaining({ file: "megamek/3050U/Daishi (Dire Wolf) A.mtf", reason: expect.stringMatching(/^duplicate of a design already kept/) })]);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}, 120_000);

// #109: the Ryoken III (Skinwalker) A of RG24 and the Ryoken III-XP (Skinwalker) A of XTR:RotS 3 are two MUL records
// sharing the name Skinwalker; each name's own key beats another's alternate one, and an alternate key two names share
// finds neither.
it("finds no MUL record by an alternate name two records share", () => {
    const mul = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-mechs-mul-"));
    for (const list of ["live", "mul1", "custom"]) fs.mkdirSync(path.join(mul, list));
    fs.writeFileSync(path.join(mul, "live", "a.json"), JSON.stringify([
        record(105538, "Ryoken III-XP (Skinwalker)", "A", 75, 3777), record(106647, "Ryoken III (Skinwalker)", "A", 75, 3500),
        record(1, "Mad Cat (Timber Wolf)", "Prime", 75, 2737), record(2, "Timber Wolf", "Prime", 75, 2737),
    ]));
    fs.writeFileSync(path.join(mul, "mul1", "a.json"), JSON.stringify([record(106647, "Ryoken III (Skinwalker)", "A", 75, 3500)]));
    try {
        const index = loadMULIndex(mul, () => true);
        expect(index.get("ryoken iii a")?.Id).toBe(106647);
        expect(index.get("ryoken iii-xp a")?.Id).toBe(105538);
        expect(index.has("skinwalker a")).toBe(false);
        expect(index.get("timber wolf prime")?.Id).toBe(2);
    } finally {
        fs.rmSync(mul, { recursive: true, force: true });
    }
});

it("keeps two MUL records' designs that share an alternate name", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-mechs-build-"));
    const ssw = path.join(root, "ssw"), megamek = path.join(root, "megamek", "RG");
    for (const dir of [ssw, megamek]) fs.mkdirSync(dir, { recursive: true });
    for (const [fixture, name] of [["ryoken-iii-skinwalker-b", "(Ryoken III) Skinwalker B"], ["ryoken-iii-xp-skinwalker-b", "Ryoken III-XP B"]]) {
        fs.copyFileSync(path.resolve(__dirname, `../utils/__fixtures__/${fixture}.mtf`), path.join(megamek, name + ".mtf"));
    }
    try {
        const build = buildBundledMechs(ssw, path.resolve(__dirname, "mul"), path.join(root, "megamek"));
        expect(build.headers.map((header) => [header.name, header.model, header.bv])).toEqual([["Skinwalker (Ryoken III)", "B", 2851]]);
        // Checked against its own record, not taken for the Ryoken III's twin.
        expect(build.leftOut).toEqual([expect.objectContaining({ file: "megamek/RG/Ryoken III-XP B.mtf", detail: expect.stringMatching(/MUL 3613$/) })]);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}, 120_000);

// mordel.net's MegaMek-format files fill in the canon 'Mechs neither Skunk Werks nor MegaMek has a file for (#241),
// checked like MegaMek's; a MegaMek file for the same 'Mech comes first.
it("keeps a mordel.net file as source mordel, after MegaMek's for the same unit", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-mechs-build-"));
    const ssw = path.join(root, "ssw"), mordel = path.join(root, "mordel", "23454"), megamek = path.join(root, "megamek", "DA");
    for (const dir of [ssw, mordel, megamek]) fs.mkdirSync(dir, { recursive: true });
    const fixture = path.resolve(__dirname, "../utils/__fixtures__/mordel-dola-dol-1a2.mtf");
    fs.copyFileSync(fixture, path.join(mordel, "Dola DOL-1A2.mtf"));
    try {
        const alone = buildBundledMechs(ssw, path.resolve(__dirname, "mul"), undefined, [], path.join(root, "mordel"));
        expect(alone.leftOut).toEqual([]);
        expect(alone.headers.map((header) => [header.name, header.model, header.bv, header.source, header.sourceUrl]))
            .toEqual([["Dola", "DOL-1A2 \"Yoh Ti Ts'ang\"", 826, "mordel", "https://www.mordel.net/tro.php?a=vt&ut=bm&id=23454"]]);
        fs.copyFileSync(fixture, path.join(megamek, "Dola DOL-1A2.mtf"));
        const both = buildBundledMechs(ssw, path.resolve(__dirname, "mul"), path.join(root, "megamek"), [], path.join(root, "mordel"));
        expect(both.headers.map((header) => [header.source, header.sourceUrl])).toEqual([["megamek", undefined]]);
        expect(both.leftOut).toEqual([expect.objectContaining({ file: "mordel/23454/Dola DOL-1A2.mtf", reason: "duplicate of a design already kept" })]);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}, 120_000);

// #595: a MegaMek 'Mech the MUL lacks is filed in the custom unit list at our own BV, credited to MegaMek, and
// bundled under that entry; a rebuild keeps its id, and the units build's entries stay.
it("files a MegaMek 'Mech the MUL lacks in the custom unit list at our own BV", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-mechs-build-"));
    const ssw = path.join(root, "ssw"), megamek = path.join(root, "megamek"), mul = path.join(root, "mul");
    for (const dir of [ssw, path.join(megamek, "Custom"), ...["live", "mul1", "custom"].map((list) => path.join(mul, list))]) fs.mkdirSync(dir, { recursive: true });
    const text = fs.readFileSync(path.resolve(__dirname, "../utils/__fixtures__/mordel-dola-dol-1a2.mtf"), "utf8")
        .replace(/^chassis:.*$/m, "chassis:Testmech").replace(/^model:.*$/m, "model:TST-1");
    fs.writeFileSync(path.join(megamek, "Custom", "Testmech TST-1.mtf"), text);
    try {
        const first = buildBundledMechs(ssw, mul, megamek);
        const [entry] = first.customRecords;
        expect(first.leftOut).toEqual([]);
        expect(first.customRecords).toHaveLength(1);
        expect([entry.MulUnitKey, entry.Name, entry.Variant, entry.Type?.Id, entry.Role?.Name, entry.BattleValue, entry.CustomInfo?.author])
            .toEqual(["CUSTOM-MEGAMEK-TESTMECH-TST-1", "Testmech", "TST-1", 18, "Scout", 826, "MegaMek"]);
        expect(entry.BFPointValue).toBeGreaterThan(0);
        expect(first.headers.map((header) => [header.name, header.model, header.bv, header.mulId, header.source])).toEqual([["Testmech", "TST-1", 826, entry.Id, "megamek"]]);

        // Written beside a units-build entry, then rebuilt: the 'Mech keeps its id, and the vehicle stays.
        const vehicle = { ...entry, Id: 950001, MulUnitKey: "CUSTOM-MEGAMEK-TEST-TANK", Name: "Test Tank", Class: "Combat Vehicle", Type: { Id: 19, Name: "Combat Vehicle" } } as IASMULUnit;
        const customFile = path.join(mul, "custom", "custom-units.json");
        fs.writeFileSync(customFile, writeMegaMekCustomRecords(writeMegaMekCustomRecords(null, [vehicle], (unit) => !isMULMech(unit)), [{ ...entry, Id: 912345 }], isMULMech));
        const second = buildBundledMechs(ssw, mul, megamek);
        expect(second.customRecords.map((record) => record.Id)).toEqual([912345]);
        expect(second.headers.map((header) => header.mulId)).toEqual([912345]);
        const written = untabulate(JSON.parse(writeMegaMekCustomRecords(fs.readFileSync(customFile, "utf8"), [], isMULMech))) as IASMULUnit[];
        expect(written.map((record) => record.Name)).toEqual(["Test Tank"]);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}, 120_000);

it("links a mordel.net file to its BattleMech or IndustrialMech page", () => {
    expect(getMordelUnitUrl("mordel/23454/Dola DOL-1A2.mtf")).toBe("https://www.mordel.net/tro.php?a=vt&ut=bm&id=23454");
    expect(getMordelUnitUrl("mordel/im/121/Crosscut ED-X2 LoggerMech (RL).mtf")).toBe("https://www.mordel.net/tro.php?a=vt&ut=im&id=121");
    expect(getMordelUnitUrl("megamek/3075/Quasit QUA-51M MilitiaMech.mtf")).toBeUndefined();
});

// #599: the build records where our BV and the MUL's differ, as data. Nothing is dropped to improve a count.
it("records a kept design as matched and a file whose BV differs from the MUL as one row with both numbers", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-mechs-build-"));
    const ssw = path.join(root, "ssw"), megamek = path.join(root, "megamek", "RG");
    for (const dir of [ssw, megamek]) fs.mkdirSync(dir, { recursive: true });
    for (const [fixture, name] of [["ryoken-iii-skinwalker-b", "(Ryoken III) Skinwalker B"], ["ryoken-iii-xp-skinwalker-b", "Ryoken III-XP B"]]) {
        fs.copyFileSync(path.resolve(__dirname, `../utils/__fixtures__/${fixture}.mtf`), path.join(megamek, name + ".mtf"));
    }
    try {
        const { accuracy } = buildBundledMechs(ssw, path.resolve(__dirname, "mul"), path.join(root, "megamek"));
        expect(accuracy.unitType).toBe("mechs");
        expect(accuracy.matched).toBe(1);
        expect(accuracy.differs).toEqual([{ mulId: expect.any(Number), name: expect.stringContaining("Ryoken III-XP"), ours: expect.any(Number), mul: 3613, file: "megamek/RG/Ryoken III-XP B.mtf" }]);
        expect(accuracy.differs[0].ours).not.toBe(3613);
        expect(accuracy.notChecked).toEqual({ importFailed: 0, noMulEntry: 0 });
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}, 120_000);

it("counts a file that fails to import and a design the MUL does not list as not checked", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-mechs-build-"));
    const ssw = path.join(root, "ssw"), megamek = path.join(root, "megamek"), mul = path.join(root, "mul");
    for (const dir of [ssw, path.join(megamek, "Custom"), ...["live", "mul1", "custom"].map((list) => path.join(mul, list))]) fs.mkdirSync(dir, { recursive: true });
    const text = fs.readFileSync(path.resolve(__dirname, "../utils/__fixtures__/mordel-dola-dol-1a2.mtf"), "utf8")
        .replace(/^chassis:.*$/m, "chassis:Testmech").replace(/^model:.*$/m, "model:TST-1");
    fs.writeFileSync(path.join(megamek, "Custom", "Testmech TST-1.mtf"), text);
    fs.writeFileSync(path.join(ssw, "broken.ssw"), "<notamech />");
    try {
        const { accuracy } = buildBundledMechs(ssw, mul, megamek);
        expect(accuracy).toEqual({ unitType: "mechs", matched: 0, differs: [], notChecked: { importFailed: 1, noMulEntry: 1 } });
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}, 120_000);

it("gives an OmniMech's wrong configuration a row of its own, with the configuration named", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-mechs-build-"));
    const ssw = path.join(root, "ssw"), mul = path.join(root, "mul");
    for (const dir of [ssw, ...["live", "mul1", "custom"].map((list) => path.join(mul, list))]) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.resolve(__dirname, "../utils/__fixtures__/dire-wolf-omni.ssw"), path.join(ssw, "dire-wolf-omni.ssw"));
    try {
        // Our own BV of each configuration, then a MUL that agrees on all but the last.
        const configs = buildBundledMechs(ssw, path.resolve(__dirname, "mul")).headers[0].configs!;
        expect(configs.length).toBeGreaterThan(2);
        const wrong = configs[configs.length - 1];
        fs.writeFileSync(path.join(mul, "live", "a.json"), JSON.stringify(configs.map((config, index) =>
            ({ ...record(500 + index, "Dire Wolf (Daishi)", config.name, 100, config === wrong ? config.bv + 7 : config.bv), Class: "BattleMech" }))));
        const { accuracy, headers } = buildBundledMechs(ssw, mul);
        expect(headers[0].configs!.map((config) => config.name)).not.toContain(wrong.name);
        expect(accuracy.matched).toBe(configs.length - 1);
        expect(accuracy.differs).toEqual([{ mulId: 500 + configs.length - 1, name: "Dire Wolf (Daishi)", config: wrong.name, ours: wrong.bv, mul: wrong.bv + 7, file: "dire-wolf-omni.ssw" }]);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}, 240_000);

it("counts a MUL entry with a kept design as matched only, and lists each differing entry once, by name then configuration", () => {
    const miss = (mulId: number | null, name: string, file: string, config?: string) => ({ mulId, name, ...(config ? { config } : {}), ours: 100, mul: 110, file });
    const accuracy = buildBundledAccuracy([1, 2], [
        miss(1, "Atlas AS7-D", "megamek/a.mtf"), miss(3, "Zeus ZEU-6S", "ssw/z.ssw"), miss(3, "Zeus ZEU-6S", "megamek/z.mtf"),
        miss(5, "Mad Cat", "ssw/m.ssw", "B"), miss(4, "Mad Cat", "ssw/m.ssw", "A"),
    ], { importFailed: 2, noMulEntry: 3 });
    expect(accuracy.matched).toBe(2);
    expect(accuracy.differs.map((row) => [row.mulId, row.config, row.file])).toEqual([[4, "A", "ssw/m.ssw"], [5, "B", "ssw/m.ssw"], [3, undefined, "megamek/z.mtf"]]);
    expect(accuracy.notChecked).toEqual({ importFailed: 2, noMulEntry: 3 });
});

it("writes the accuracy data beside the report, one differing unit a line", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-mechs-write-"));
    try {
        const accuracy = buildBundledAccuracy([1], [{ mulId: 3, name: "Zeus ZEU-6S", ours: 100, mul: 110, file: "z.ssw" }, { mulId: 4, name: "Atlas AS7-K", ours: 5, mul: 6, file: "a.ssw" }], { importFailed: 0, noMulEntry: 0 });
        writeBundledMechs({ headers: [], designs: [], leftOut: [], accuracy }, dir);
        const text = fs.readFileSync(path.join(dir, "mechs-accuracy.json"), "utf8");
        expect(JSON.parse(text)).toEqual(accuracy);
        expect(text.split("\n").filter((line) => line.includes("\"mulId\""))).toHaveLength(2);
        expect(text.indexOf("Atlas")).toBeLessThan(text.indexOf("Zeus"));
        expect(fs.existsSync(path.join(dir, "mechs-report.md"))).toBe(true);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
