// Build support, not app code: converts a folder of Skunk Werks files, then MegaMek's 'Mech files for the 'Mechs those
// lack, then mordel.net's for the canon 'Mechs neither has, into the bundled 'Mech data (#241). Run by
//   npm run build:bundled
// (bundled-build-runner.ts) with BUNDLED_SSW_DIR, BUNDLED_MEGAMEK_DIR and BUNDLED_MORDEL_DIR set when they are not the
// defaults below.
import fs from "node:fs";
import path from "node:path";
import { BattleMech } from "../classes/battlemech";
import { importBattleMechMtf } from "../classes/battlemech-mtf";
import type { IASMULUnit } from "../classes/alpha-strike-unit";
import { correctMULBattleValue } from "./mul-bv-corrections";
import { BUNDLED_CHUNK_SIZE, BundledDesignSource, compactMech, compareDesigns, describeCriticals, getMechFingerprint, IBundledDesignHeader, IDesignSummary, loadBundledMech, shareChunk, summarizeDesign } from "../utils/bundled-designs";
import { getClassicMechEntries, getMULMatchKeys } from "../utils/classicMULMatch";
import { stringifyTable, untabulate } from "../utils/packed-json";
import { getRulesLevelStanding, UnitStanding } from "../utils/unit-standing";
import { getSSWXMLBasicInfo, parseSSWXML } from "../utils/getSSWXMLBasicInfo";
import { buildCustomMULRecord, CUSTOM_MUL_ID_START, CUSTOM_MUL_KEY_PREFIX, CUSTOM_RULES_LEVELS, ICustomMULForm, serializeCustomMULRecords } from "./custom-mul";
import { mechMULForm } from "./sample-mul";

export const DEFAULT_SSW_DIR = "C:/repo/battletech-tools/WorkingData_DEV/SSWdata";
export const DEFAULT_MEGAMEK_DIR = "C:/repo/megamek/megamek/data/mekfiles/unit_files";
// MegaMek-format files from mordel.net's "Generate in MegaMek format", a folder per mordel unit id
// (node ~/.claude/tools/mordel_fetch.mjs C:/repo/mordel-units --ids-file=<ids> --formats=MTF; IndustrialMechs into
// C:/repo/mordel-units/im with --type=im).
export const DEFAULT_MORDEL_DIR = "C:/repo/mordel-units";

/**
 * The mordel.net unit page of a file fetched into DEFAULT_MORDEL_DIR: "mordel/<id>/<file>" is a BattleMech,
 * "mordel/im/<id>/<file>" an IndustrialMech (mordel's page types bm and im).
 */
export function getMordelUnitUrl(name: string): string | undefined {
    const match = /^mordel\/(?:(im)\/)?(\d+)\/[^/]+$/.exec(name);
    return match ? `https://www.mordel.net/tro.php?a=vt&ut=${match[1] ?? "bm"}&id=${match[2]}` : undefined;
}

// MegaMek's files for these IndustrialMechs have no cockpit line, which MegaMek (and the converter, #371) reads as a
// Standard cockpit with Advanced Fire Control; their record sheets have a plain Industrial cockpit. The Quasit's RS:3075
// sheet shows one, and the MUL's Battle Values (MUL: Battle Values v1.0 p.174 for the Quasit; the live MUL for the
// Hyena) are the no-AFC figures. Each gets the Industrial cockpit line it is missing.
export const MEGAMEK_INDUSTRIAL_COCKPIT = new Set([
    "megamek/3075/Quasit QUA-51M MilitiaMech.mtf",
    "megamek/3075/Quasit QUA-51P MilitiaMech.mtf",
    "megamek/3075/Quasit QUA-51T MilitiaMech.mtf",
    "megamek/3075/Hyena HYN-4A SalvageMech .mtf",
    "megamek/3075/Hyena HYN-4B SalvageMech.mtf",
]);

function withIndustrialCockpit(name: string, text: string): string {
    return MEGAMEK_INDUSTRIAL_COCKPIT.has(name) && !/^cockpit:/im.test(text) ? "cockpit:Industrial Cockpit\n" + text : text;
}
const COPYRIGHT_NOTICE = "The data here is/may be copyrighted and NOT included in the GPLv3 license. ";
const SSW_CREDIT = "the Solaris Skunk Werks project's files at https://github.com/Solaris-Skunk-Werks/SSW-Master";
const MEGAMEK_CREDIT = "MegaMek's unit files (https://github.com/MegaMek/megamek): MegaMek Data (C) 2025-2026 by The MegaMek Team, "
    + "licensed under CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/).";
export const MEGAMEK_NOTICE = COPYRIGHT_NOTICE + "Converted from " + MEGAMEK_CREDIT;
const MORDEL_CREDIT = "mordel.net's MegaMek-format files (https://www.mordel.net)";
export const BUNDLED_MECHS_NOTICE = COPYRIGHT_NOTICE + "Converted from " + SSW_CREDIT + ", from " + MORDEL_CREDIT + ", and from " + MEGAMEK_CREDIT;

const MECH_CLASSES = ["BattleMech", "IndustrialMech"];
const MECH_TYPE_IDS = [18, 20];
export const isMULMech = (unit: IASMULUnit): boolean => MECH_CLASSES.includes(unit.Class) || MECH_TYPE_IDS.includes(unit.Type?.Id);
/** A unit whose BV we work out differently from the Master Unit List (#599). `file` is the design file it was read from. */
export interface IBundledMiss { mulId: number | null; name: string; config?: string; ours: number; mul: number; file: string }
/** A miss before the build knows which file it came from. */
type Miss = Omit<IBundledMiss, "file">;

/** Where our BV and the MUL's agree and differ, for one unit type. Nothing is left out to improve a count. */
export interface IBundledAccuracy {
    unitType: "mechs";
    /** MUL entries with a kept design. */
    matched: number;
    /** MUL entries with files, none matching: one row per MUL entry (and configuration). */
    differs: IBundledMiss[];
    /** Files that could not be compared: the import failed, or the MUL has no entry with a BV for them. */
    notChecked: { importFailed: number; noMulEntry: number };
}

type Leave = (reason: string, detail?: string, misses?: Miss[]) => void;

/**
 * The accuracy record from a build's tallies. A MUL entry with a kept design is matched only, whatever other files
 * differ; a differing entry is listed once (its first file by name); rows are sorted by name, then configuration.
 */
export function buildBundledAccuracy(matchedIds: Iterable<number>, misses: IBundledMiss[], notChecked: IBundledAccuracy["notChecked"]): IBundledAccuracy {
    const matched = new Set(matchedIds);
    const rows = new Map<string, IBundledMiss>();
    for (const miss of [...misses].sort((a, b) => a.file.localeCompare(b.file))) {
        if (miss.mulId !== null && matched.has(miss.mulId)) continue;
        const key = miss.mulId !== null ? `mul:${miss.mulId}` : `file:${miss.file}:${miss.config ?? ""}`;
        if (!rows.has(key)) rows.set(key, miss);
    }
    const differs = [...rows.values()].sort((a, b) => a.name.localeCompare(b.name) || (a.config ?? "").localeCompare(b.config ?? ""));
    return { unitType: "mechs", matched: matched.size, differs, notChecked };
}

/**
 * A bundled design's standing, left out when canon: a file from an apocryphal folder (MegaMek's "Videogame
 * (Apocryphal)"), else what the gear's rules level makes it. Canon is what the live MUL or MUL 1.0 lists, or an
 * official FASA, FanPro or Catalyst record sheet (#241): Shrapnel, Field Manual pilot variants and the Classic
 * MechWarrior: Dark Age sheets stay canon off the MUL, until a check of the record sheet books fails to find one.
 */
export function getBundledStanding(file: string, unit: { getRequiredRulesLevel(): number }): { standing?: UnitStanding } {
    const standing = /apocryphal/i.test(file) ? "apocryphal" : getRulesLevelStanding(unit.getRequiredRulesLevel());
    return standing === "canon" ? {} : { standing };
}

/** A MUL record from the live MUL or MUL 1.0, not our own custom list. */
export const isOfficialMULRecord = (unit: IASMULUnit | undefined): boolean => !!unit && unit.MulSource !== "custom";

// MegaMek files the MUL lacks are filed in the custom unit list under MegaMek's name (#595 for 'Mechs). Each build
// writes its own: the units build its types, the 'Mech build its 'Mechs.
export const MEGAMEK_CUSTOM_KEY_PREFIX = CUSTOM_MUL_KEY_PREFIX + "MEGAMEK-";
export const MEGAMEK_CUSTOM_ID_START = CUSTOM_MUL_ID_START + 10000;
export const MEGAMEK_CUSTOM_DATE = "2026-10-27T00:00:00.000Z";
export const isMegaMekCustom = (unit: IASMULUnit): boolean => !!unit.MulUnitKey?.startsWith(MEGAMEK_CUSTOM_KEY_PREFIX);

/** The custom unit list's MegaMek entries of one build (`ours`) and the ids they hold, to keep or reuse. */
export interface IMegaMekCustomIds {
    earlier: Map<string, IASMULUnit>;
    used: Set<number>;
    next: number;
}

export function loadMegaMekCustomIds(mulDir: string, ours: (unit: IASMULUnit) => boolean): IMegaMekCustomIds {
    const custom = fs.readdirSync(path.join(mulDir, "custom")).flatMap((file) => untabulate(JSON.parse(fs.readFileSync(path.join(mulDir, "custom", file), "utf8"))) as IASMULUnit[]);
    return { earlier: new Map(custom.filter((record) => isMegaMekCustom(record) && ours(record)).map((record) => [record.MulUnitKey ?? "", record])),
        used: new Set(custom.map((record) => record.Id)), next: MEGAMEK_CUSTOM_ID_START };
}

/**
 * A MegaMek file's custom unit list entry, keeping the id and date an earlier build gave it; null when another file
 * already took its key.
 */
export function makeMegaMekCustomRecord(form: ICustomMULForm, ids: IMegaMekCustomIds, records: IASMULUnit[]): IASMULUnit | null {
    const key = MEGAMEK_CUSTOM_KEY_PREFIX + `${form.name} ${form.variant}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (records.some((record) => record.MulUnitKey === key)) return null;
    const before = ids.earlier.get(key);
    let id = before?.Id;
    if (!id) {
        while (ids.used.has(ids.next)) ids.next++;
        id = ids.next;
    }
    ids.used.add(id);
    const createdAt = before?.CustomInfo?.createdAt ?? MEGAMEK_CUSTOM_DATE;
    return buildCustomMULRecord(form, { id, key, createdAt }, createdAt);
}

/** The custom unit list's file text with one build's MegaMek entries (`ours`) replaced by `records`; the rest are kept. */
export function writeMegaMekCustomRecords(currentFileText: string | null, records: IASMULUnit[], ours: (unit: IASMULUnit) => boolean): string {
    const current = currentFileText ? untabulate(JSON.parse(currentFileText)) as IASMULUnit[] : [];
    return serializeCustomMULRecords([...current.filter((record) => !(isMegaMekCustom(record) && ours(record))), ...records]);
}

/** MegaMek's rules level ("rules level:3") as the custom list's: 1 Introductory to 4 Experimental, 5 Unofficial. */
const mtfRulesLevel = (text: string): string => CUSTOM_RULES_LEVELS[Math.min(Math.max(+(/^rules level:\s*(\d)/im.exec(text)?.[1] ?? 2) - 1, 0), 3)];

/** A MegaMek 'Mech file's path under MegaMek's unit_files. */
const megaMekFilePath = (jobName: string): string => jobName.replace(/^megamek\//, "meks/");

const squash = (text: string): string => text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
// The quoted or bracketed name a model carries ("Yen Lo Wang", (Jasminda)), squashed.
const nicknameOf = (text: string): string => squash(/["'“”‘’(]([^"'“”‘’()]+)["'“”‘’)]/.exec(text)?.[1] ?? "");
// A model's code, its first word ("CN9-YLW2", none for "(Jasminda)"), with a letter O after a digit read as zero (SCP-1O).
const codeOf = (model: string): string => {
    const first = model.trim().split(/\s+/)[0] ?? "";
    return /^["'“‘(]/.test(first) ? "" : squash(first).replace(/(?<=\d)o/g, "0");
};
const commonPrefix = (a: string, b: string): number => {
    let length = 0;
    while (length < a.length && a[length] === b[length]) length++;
    return length;
};

/**
 * The MUL record of a 'Mech whose name the MUL spells another way ("Yen-lo-wang", a SecurityMech suffix, ABS-5Y for
 * ANB-5Y), among records of the same tonnage whose name holds the chassis's first word. A record matches on the same
 * BV when the codes' numbers agree (or one has none, or both carry the same nickname); on the same code when this
 * model names no pilot or nickname the record lacks; or on the same nickname when the numbers agree. Best first:
 * BV, nickname, code, then the closest and shortest variant.
 */
export function findLooseMULMatch(chassis: string, model: string, tons: number, bv: number, units: IASMULUnit[]): IASMULUnit | undefined {
    const root = squash(chassis.replace(/^["'“‘]+/, "").split(/[\s("'“‘]/)[0] ?? "");
    if (!root) return undefined;
    const code = codeOf(model);
    const ownNickname = nicknameOf(model);
    const anyNickname = nicknameOf(chassis + " " + model);
    const digits = (text: string) => text.replace(/\D/g, "");
    let best: { unit: IASMULUnit; rank: number[] } | undefined;
    for (const unit of units) {
        if (unit.Tonnage !== tons || !squash(unit.Name ?? "").includes(root)) continue;
        const variant = unit.Variant ?? "";
        const theirCode = codeOf(variant);
        const theirNickname = nicknameOf(variant);
        const sameNickname = anyNickname !== "" && anyNickname === theirNickname;
        const numbersAgree = !digits(code) || !digits(theirCode) || digits(code) === digits(theirCode);
        const byBV = bv > 0 && unit.BattleValue === bv && (numbersAgree || sameNickname);
        const byNickname = sameNickname && numbersAgree;
        const byCode = code !== "" && code === theirCode && (ownNickname === "" || ownNickname === theirNickname);
        if (!byBV && !byNickname && !byCode) continue;
        const rank = [+byBV, +byNickname, +byCode, commonPrefix(squash(model), squash(variant)), -variant.length];
        const differs = best ? rank.findIndex((value, index) => value !== best!.rank[index]) : -1;
        if (!best || (differs >= 0 && rank[differs] > best.rank[differs])) best = { unit, rank };
    }
    return best?.unit;
}
interface IKeptLayout { summary: IDesignSummary; name: string; mulId?: number }

/** A canon 'Mech on mordel.net's list: its name and model as one, tonnage and BV (src/data/mordel/canon-mechs.csv). */
export interface ICanonMech { name: string; tons: number; bv: number }

/** mordel.net's canon 'Mech list, a build input only: "name,tons,bv" lines under a header, the name quoted. */
export function loadCanonMechs(file: string): ICanonMech[] {
    return fs.readFileSync(file, "utf8").split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
        const [, name, tons, bv] = /^"((?:[^"]|"")*)",(\d+),(\d*)$/.exec(line) ?? [];
        return { name: (name ?? "").replace(/""/g, "\""), tons: +tons, bv: +bv };
    }).filter(({ name }) => name);
}

/**
 * The model a different submodel of a kept design is renamed to (#241): a free canon designation on mordel's list with
 * the same chassis, tonnage and BV, else the next number of its model. The number is the highest one taken among the
 * kept models and mordel's for that chassis and base, plus one, an unnumbered model counting as 1: "ARC-5S" becomes
 * "ARC-5S 2", Bane 12 (base "") becomes Bane 13.
 */
export function getRenumberedModel(chassis: string, model: string, tons: number, bv: number, keptModels: string[],
    canon: ICanonMech[], isTaken: (model: string) => boolean): string {
    const prefix = chassis.trim().toLowerCase() + " ";
    const canonModels = canon.filter(({ name }) => name.toLowerCase().startsWith(prefix)).map((unit) => ({ ...unit, model: unit.name.slice(prefix.length) }));
    const free = canonModels.find((unit) => unit.tons === tons && unit.bv === bv && !isTaken(unit.model));
    if (free) return free.model;
    const base = model.trim().replace(/(?:^|\s+)\d+$/, "");
    const numberOf = (other: string): number => {
        const text = other.trim().toLowerCase(), lower = base.toLowerCase();
        if (text === lower) return 1;
        const rest = lower ? (text.startsWith(lower + " ") ? text.slice(lower.length + 1) : "") : text;
        return /^\d+$/.test(rest) ? +rest : 0;
    };
    let next = Math.max(1, ...[model, ...keptModels, ...canonModels.map((unit) => unit.model)].map(numberOf)) + 1;
    while (isTaken(base ? base + " " + next : String(next))) next++;
    return base ? base + " " + next : String(next);
}

// SSW's names for chassis components ("XL Engine", "Extra-Light Gyro", "Endo-Steel"). SSW's engine techbase
// attribute (0 Inner Sphere, 1 Clan) picks the Inner Sphere or Clan XL/XXL engine. Primitive I.C.E. and fuel cell
// engines are the plain ones on a Primitive 'Mech.
const ENGINES: Record<string, string> = {
    "Fusion Engine": "standard", "XL Engine/0": "xl", "XL Engine/1": "clan_xl", "XXL Engine/0": "xxl",
    "XXL Engine/1": "clan_xxl", "Light Fusion Engine": "light", "Compact Fusion Engine": "compact",
    "I.C.E. Engine": "ice", "Fuel-Cell Engine": "cell", "Fission Engine": "fission",
    "Primitive Fusion Engine": "primitive", "Primitive I.C.E. Engine": "ice", "Primitive Fuel-Cell Engine": "cell",
};
const GYROS: Record<string, string> = {
    "Standard Gyro": "standard", "Extra-Light Gyro": "xl", "Compact Gyro": "compact", "Heavy-Duty Gyro": "heavy-duty",
    "No Gyro": "none",
};
const STRUCTURES: Record<string, string> = {
    "Standard Structure": "standard", "Endo-Steel": "endo-steel", "Endo-Steel Prototype": "endo-steel-prototype", "Endo-Composite": "endo-composite",
    "Composite Structure": "composite", "Reinforced Structure": "reinforced", "Industrial Structure": "industrial",
    // A Primitive 'Mech's structure is the standard or industrial one with the Primitive flag.
    "Primitive Structure": "standard", "Primitive Industrial Structure": "industrial",
};

/** An engine, gyro or structure imported as another type, or structure slots left unplaced. */
function checkComponents(xml: string, mech: BattleMech): string[] {
    const wrong: string[] = [];
    const engine = /<engine [^>]*techbase="(\d)"[^>]*>([^<]+)</.exec(xml);
    const gyro = /<gyro[^>]*>([^<]+)</.exec(xml)?.[1] ?? "";
    const structure = /<structure[^>]*>\s*<type>([^<]+)</.exec(xml)?.[1] ?? "";
    const expectedEngine = engine ? ENGINES[`${engine[2]}/${engine[1]}`] ?? ENGINES[engine[2]] : undefined;
    if (mech.getEngineType().tag !== expectedEngine) wrong.push(`${engine?.[2]} -> ${mech.getEngineType().tag}`);
    if (mech.getGyro().tag !== GYROS[gyro]) wrong.push(`${gyro} -> ${mech.getGyro().tag}`);
    if (mech.getInternalStructureType() !== STRUCTURES[structure]) wrong.push(`${structure} -> ${mech.getInternalStructureType()}`);
    const unplaced = mech.getUnallocatedCriticals().filter((slot) => slot?.tag === STRUCTURES[structure]).length;
    if (unplaced > 0) wrong.push(`${unplaced} ${structure} slots unplaced`);
    return wrong;
}

const listFiles = (dir: string, extension: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory() ? listFiles(path.join(dir, entry.name), extension)
        : entry.name.toLowerCase().endsWith(extension) ? [path.join(dir, entry.name)] : []);

/** Every Master Unit List entry the test picks, by match key: live entries first, then MUL 1.0's, then our own. */
export function loadMULIndex(mulDir: string, test: (unit: IASMULUnit) => boolean): Map<string, IASMULUnit> {
    const index = new Map<string, IASMULUnit>();
    // The names each alternate key was given by, in either order ("Skinwalker (Ryoken III)" is "Ryoken III
    // (Skinwalker)"): one name's own key beats it, and other names' find neither (#109: the Ryoken III and
    // Ryoken III-XP are both "Skinwalker").
    const alternates = new Map<string, string | null>();
    for (const list of ["live", "mul1", "custom"]) {
        for (const file of fs.readdirSync(path.join(mulDir, list)).sort()) {
            for (const entry of untabulate(JSON.parse(fs.readFileSync(path.join(mulDir, list, file), "utf8"))) as IASMULUnit[]) {
                const unit = { ...(list === "live" ? correctMULBattleValue(entry) : entry), MulSource: list === "live" ? "mul2" as const : list as "mul1" | "custom" };
                if (!test(unit)) continue;
                const [own, ...others] = getMULMatchKeys(unit.Name ?? "", unit.Variant ?? "");
                const names = [...others].sort().join("|");
                if (!index.has(own) || alternates.has(own)) { index.set(own, unit); alternates.delete(own); }
                for (const key of others) {
                    if (index.has(key) && !alternates.has(key)) continue;
                    if (!alternates.has(key)) { index.set(key, unit); alternates.set(key, names); }
                    else if (alternates.get(key) !== names) { index.delete(key); alternates.set(key, null); }
                }
            }
        }
    }
    return index;
}

/** MUL 1.0's entries the test picks, by id: a MegaMek file's `mul id` is MUL 1.0's, not the live MUL's. */
function loadMUL1ById(mulDir: string, test: (unit: IASMULUnit) => boolean): Map<number, IASMULUnit> {
    const index = new Map<number, IASMULUnit>();
    for (const file of fs.readdirSync(path.join(mulDir, "mul1")).sort()) {
        for (const unit of JSON.parse(fs.readFileSync(path.join(mulDir, "mul1", file), "utf8")) as IASMULUnit[]) {
            if (test(unit)) index.set(unit.Id, unit);
        }
    }
    return index;
}

/**
 * Seeds Math.random from a file's name while it is built (mulberry32), so the UUIDs a design is given, and any order
 * they decide, come out the same every build and a rebuild's diff shows only the designs that changed.
 */
export function seedRandom(seed: string): void {
    let state = [...seed].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
    Math.random = () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = Math.imul(state ^ (state >>> 15), state | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export interface IBundledBuild {
    headers: IBundledDesignHeader[];
    designs: Record<string, unknown>[];
    /** Files left out: why, and the particulars. */
    leftOut: { file: string; reason: string; detail: string }[];
    /** Different submodels kept under a new model (#241). */
    renamed?: { file: string; from: string; to: string }[];
    /** Where our BV and the MUL's differ (#599); 'Mechs only so far. */
    accuracy?: IBundledAccuracy;
}

/**
 * An OmniMech keeps the configurations whose BV matches the MUL's, or the loadout's own in the file where the MUL has
 * no entry; the others are left out one by one (#112). False when none is left.
 */
function keepMatchingConfigurations(mech: BattleMech, xml: string, mul: Map<string, IASMULUnit>, leave: Leave): boolean {
    const names = mech.getOmniConfigurationNames();
    if (names.length < 2) return true;
    const loadouts = ([] as Record<string, unknown>[]).concat(parseSSWXML(xml)?.mech?.loadout ?? []);
    const fileBV = new Map(loadouts.map((loadout) => [String(loadout["@_name"] ?? "").trim(), Number(loadout.battle_value)]));
    const wrong = getClassicMechEntries([mech]).filter((entry) => names.includes(entry.model) && entry.design.getActiveOmniConfiguration() === entry.model)
        .flatMap(({ chassis, model, design }) => {
            const unit = [model, mech.getModelName() + " " + model].flatMap((variant) => getMULMatchKeys(chassis, variant)).map((key) => mul.get(key)).find((found) => found && found.BattleValue > 0);
            const expected = unit ? unit.BattleValue : fileBV.get(model);
            if (design.getBattleValue() === expected) return [];
            const miss: Miss | undefined = unit ? { mulId: unit.Id, name: chassis, config: model, ours: design.getBattleValue(), mul: unit.BattleValue } : undefined;
            return [{ detail: `${model}: BV ${design.getBattleValue()}, ${unit ? "MUL" : "file"} ${expected}`, miss }];
        });
    const missesOf = (list: typeof wrong) => list.flatMap(({ miss }) => miss ? [miss] : []);
    if (wrong.length === names.length) { leave("BV differs from the MUL in every configuration", wrong.map(({ detail }) => detail).join("; "), missesOf(wrong)); return false; }
    for (const entry of wrong) {
        leave("configuration BV differs from the MUL", entry.detail, missesOf([entry]));
        mech.deleteOmniConfiguration(entry.detail.slice(0, entry.detail.indexOf(": BV ")));
    }
    return true;
}

/** A file the 'Mechs are built from, in build order: Skunk Werks first, then MegaMek's, then mordel.net's. */
export interface IMechJob {
    file: string;
    source: Exclude<BundledDesignSource, "verified">;
    /** The file's name in the report: its path under its folder, a MegaMek-format one prefixed "megamek/" or "mordel/". */
    name: string;
}

export function listMechJobs(sswDir: string, megamekDir?: string, mordelDir?: string): IMechJob[] {
    const under = (dir: string | undefined, extension: string, source: IMechJob["source"], prefix: string): IMechJob[] =>
        (dir ? listFiles(dir, extension).sort() : []).map((file) => ({ file, source, name: prefix + path.relative(dir!, file).replace(/\\/g, "/") }));
    // Skunk Werks first; MegaMek's files fill in the 'Mechs it has no design for (#241 round 3), mordel.net's the canon
    // 'Mechs neither has a file for.
    return [...under(sswDir, ".ssw", "ssw", ""), ...under(megamekDir, ".mtf", "megamek", "megamek/"), ...under(mordelDir, ".mtf", "mordel", "mordel/")];
}

/** One of a prepared design's entries (an OmniMech's configurations too), with its layout. */
interface IPreparedEntry { chassis: string; model: string; summary: IDesignSummary; bv: number; base: boolean }

/**
 * What a file gives on its own, before the other files are weighed: the import, its checks, each entry's layout and
 * the compact design with its round trip. The build's slow part, so it is what runs on the workers and is cached.
 */
export interface IPreparedMech {
    /** Left out, or configurations dropped, for reasons that hold whatever the other files are. */
    leaves: { reason: string; detail: string; misses?: Miss[] }[];
    rejected?: boolean;
    chassis?: string;
    model?: string;
    tons?: number;
    bv?: number;
    /** The BV the Skunk Werks file gives. */
    fileBV?: number;
    omnimech?: boolean;
    /** The MUL 1.0 entry a MegaMek-format file names, when it has a BV. */
    mulUnitId?: number;
    entries?: IPreparedEntry[];
    /** The design reloads from the compact format at the same BV, cost, tonnage and crit table. */
    survives?: boolean;
    header?: Pick<IBundledDesignHeader, "cost" | "rulesLevel" | "year" | "tech" | "configs" | "layout" | "standing">;
    design?: Record<string, unknown>;
    /** A MegaMek file's custom unit list entry, for when the MUL has none. */
    customForm?: ICustomMULForm;
}

/** The MUL indexes a build reads, loaded once a process. */
export interface IMechMUL {
    mul: Map<string, IASMULUnit>;
    mul1ById: Map<number, IASMULUnit>;
}

// A MegaMek entry is NGCFells's, written from the file, not a BV to check the file against.
export const loadMechMUL = (mulDir: string): IMechMUL => ({ mul: loadMULIndex(mulDir, (unit) => isMULMech(unit) && !isMegaMekCustom(unit)), mul1ById: loadMUL1ById(mulDir, isMULMech) });

const hashText = (text: string): string => {
    let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
    return (hash >>> 0).toString(16) + ":" + text.length;
};

function megaMekMechForm(mech: BattleMech, job: IMechJob, mtf: string): ICustomMULForm {
    const role = /^role:\s*(.+)$/im.exec(mtf)?.[1].trim();
    return {
        ...mechMULForm(mech),
        rules: mtfRulesLevel(mtf),
        ...(role ? { role } : {}),
        dateIntroduced: /^era:\s*(\d+)/im.exec(mtf)?.[1] ?? "",
        author: "MegaMek",
        source: "MegaMek unit files",
        notes: `Not on the Master Unit List; converted from MegaMek's ${megaMekFilePath(job.name)} (MegaMek Data, CC BY-NC-SA 4.0). BV is this tool's own, by the rules and errata.`,
    };
}

/** Imports a file and runs the checks that need no other file. `model` renames it first (a renumbered submodel). */
export function prepareMechFile(job: IMechJob, { mul, mul1ById }: IMechMUL, model?: string): IPreparedMech {
    const leaves: IPreparedMech["leaves"] = [];
    const leave: Leave = (reason, detail = "", misses) => { leaves.push({ reason, detail, ...(misses?.length ? { misses } : {}) }); };
    const { warn, log } = console;
    const random = Math.random;
    let failedAllocations = 0;
    console.warn = (message?: unknown) => { if (String(message).startsWith("_allocateCritical failed")) failedAllocations++; };
    console.log = () => {};
    try {
        seedRandom(job.name);
        let mech: BattleMech, xml: string, mulUnitId: number | undefined, mtf = "";
        if (job.source === "ssw") {
            xml = fs.readFileSync(job.file, "utf8");
            if (!getSSWXMLBasicInfo(xml)) { leave("not a Skunk Werks 'Mech file"); return { leaves, rejected: true }; }
            mech = new BattleMech();
            try {
                mech.importSSWXML(xml);
            } catch (error) {
                leave("import threw", String(error)); return { leaves, rejected: true };
            }
            if (mech.sswImportErrors.length > 0) { leave("import errors", mech.sswImportErrors.join("; ")); return { leaves, rejected: true }; }
        } else {
            const text = withIndustrialCockpit(job.name, fs.readFileSync(job.file, "utf8"));
            mtf = text;
            const byId = mul1ById.get(Number(/^mul id:\s*(\d+)/m.exec(text)?.[1]));
            mulUnitId = byId && byId.BattleValue > 0 ? byId.Id : undefined;
            let imported: ReturnType<typeof importBattleMechMtf>;
            try {
                imported = importBattleMechMtf(text);
            } catch (error) {
                leave("import threw", String(error)); return { leaves, rejected: true };
            }
            if (!imported.mech || !getSSWXMLBasicInfo(imported.xml)) { leave("import failed", imported.issues.join("; ")); return { leaves, rejected: true }; }
            if (imported.issues.length > 0) { leave("the import could not carry all of it over", imported.issues.join("; ")); return { leaves, rejected: true }; }
            mech = imported.mech;
            xml = imported.xml;
        }
        const info = getSSWXMLBasicInfo(xml)!;
        if (model !== undefined) mech.setModel(model);
        if (failedAllocations > 0) { leave("crit slots failed to place", String(failedAllocations)); return { leaves, rejected: true }; }
        if (mech.getTonnage() !== +info.tonnage) { leave("tonnage differs", `${mech.getTonnage()} t, file says ${info.tonnage}`); return { leaves, rejected: true }; }
        const components = checkComponents(xml, mech);
        if (components.length > 0) { leave("chassis components differ", components.join("; ")); return { leaves, rejected: true }; }
        if (!keepMatchingConfigurations(mech, xml, mul, leave)) return { leaves, rejected: true };

        // Each entry (an OmniMech's configurations too) with its own layout: MegaMek's one-configuration file is
        // compared with that configuration of a kept OmniMech, not with its base. Layouts are compared whole only for
        // equality, so the exact one is kept as a hash.
        const entries = getClassicMechEntries([mech]).map((entry) => {
            const summary = summarizeDesign(entry.design);
            return { chassis: entry.chassis, model: entry.model, summary: { ...summary, strict: hashText(summary.strict) }, bv: entry.design.getBattleValue(), base: entry.design === mech };
        });
        const design = compactMech(mech);
        const reload = loadBundledMech(design);
        const configurations = mech.getOmniConfigurationNames();
        const configs = configurations.length > 1
            ? configurations.map((config) => {
                const configured = mech.cloneOmniConfiguration(config) as BattleMech;
                return { name: config, bv: configured.getBattleValue(), layout: getMechFingerprint(configured) };
            })
            : undefined;
        const reloadConfigs = configs?.map((config) => (reload.cloneOmniConfiguration(config.name) as BattleMech).getBattleValue());
        const survives = reload.getBattleValue() === mech.getBattleValue() && reload.getCBillCostNumeric() === mech.getCBillCostNumeric()
            && reload.getTonnage() === mech.getTonnage() && describeCriticals(reload) === describeCriticals(mech)
            && !(configs && reloadConfigs!.some((bv, index) => bv !== configs[index].bv));
        return {
            leaves, chassis: mech.getChassisName(), model: mech.getModelName(), tons: mech.getTonnage(), bv: mech.getBattleValue(),
            fileBV: +info.bv2, omnimech: !!info.omnimech, ...(mulUnitId ? { mulUnitId } : {}), entries, survives,
            header: {
                cost: mech.getCBillCostNumeric(), rulesLevel: +info.rules_level_ssw, year: +info.year, tech: mech.getTech().name,
                ...(configs ? { configs } : {}), layout: getMechFingerprint(mech), ...getBundledStanding(job.name, mech),
            },
            design,
            // An OmniMech's configurations would each need an entry; only single designs are filed for now.
            ...(job.source === "megamek" && configurations.length < 2 ? { customForm: megaMekMechForm(mech, job, mtf) } : {}),
        };
    } finally {
        console.warn = warn;
        console.log = log;
        Math.random = random;
    }
}

/**
 * Builds the bundled 'Mechs. `prepare` gives each file's prepared design (the build runner's workers and cache, see
 * bundled-build-runner.ts); by default each is prepared here, one after another.
 */
export function buildBundledMechs(sswDir: string, mulDir: string, megamekDir?: string, canon: ICanonMech[] = [], mordelDir?: string,
    prepare?: (job: IMechJob) => IPreparedMech): IBundledBuild & { customRecords: IASMULUnit[]; accuracy: IBundledAccuracy } {
    const indexes = loadMechMUL(mulDir);
    const customIds = loadMegaMekCustomIds(mulDir, isMULMech);
    const customRecords: IASMULUnit[] = [];
    const { mul, mul1ById } = indexes;
    const prepared = prepare ?? ((job: IMechJob) => prepareMechFile(job, indexes));
    const officialMechs = [...new Set(mul.values())].filter(isOfficialMULRecord);
    const kept: { header: Omit<IBundledDesignHeader, "id">; design: Record<string, unknown> }[] = [];
    const leftOut: IBundledBuild["leftOut"] = [];
    const renamed: NonNullable<IBundledBuild["renamed"]> = [];
    // The accuracy record (#599): MUL entries with a kept design, every BV difference, and the files not compared.
    const matchedIds = new Set<number>();
    const missed: IBundledMiss[] = [];
    const notChecked = { importFailed: 0, noMulEntry: 0 };
    // The kept design each match key and MUL id belongs to, with its layouts, to tell a duplicate from a variant.
    const taken = new Map<string, IKeptLayout>();
    const takenIds = new Map<number, IKeptLayout>();

    /**
     * Keeps a prepared design if it passes. A MegaMek-format file (MegaMek's or mordel's) may name its MUL 1.0 entry,
     * else it is matched by name like a Skunk Werks file; it is kept only on a MUL BV match, having no BV of its own.
     * A Skunk Werks file without a MUL entry is checked against its own BV. A Skunk Werks file of a different submodel
     * of a kept design is renamed and checked once more under its new model, against its own BV (a MegaMek file has
     * none to check a new model by). True when the design is kept.
     */
    const keep = (job: IMechJob, design: IPreparedMech, leave: Leave, renaming = false): boolean => {
        design.leaves.forEach(({ reason, detail, misses }) => leave(reason, detail, misses));
        if (design.rejected) {
            // Rejected with no BV difference recorded: the file never reached a comparison.
            if (!renaming && !design.leaves.some(({ misses }) => misses?.length)) notChecked.importFailed++;
            return false;
        }
        const { chassis, model, tons, bv, entries } = design as Required<IPreparedMech>;
        const mulUnit = design.mulUnitId ? mul1ById.get(design.mulUnitId) : undefined;
        const own = entries.map((entry) => ({ keys: getMULMatchKeys(entry.chassis, entry.model), layout: { summary: entry.summary, name: entry.chassis + " " + entry.model } }));
        const named = entries.map((entry, index) => ({ entry, unit: own[index].keys.map((key) => mul.get(key)).find(Boolean) }));
        // A 'Mech the MUL names another way is found by chassis, tonnage, BV and model code (#241).
        const loose = !mulUnit && !renaming && !design.omnimech && !named.some(({ unit }) => unit)
            ? findLooseMULMatch(chassis, model, tons, bv, officialMechs) : undefined;
        const listed = mulUnit || loose ? [{ entry: entries[entries.length - 1], unit: (mulUnit ?? loose)! }] : named.filter((match) => match.unit);
        const idOf = (index: number) => listed.find(({ entry }) => entry === entries[index])?.unit?.Id;
        // One copy of each MUL record: a design checked against a record already taken, by any name, is a twin. An
        // alternate name two records share is no twin (#109: Ryoken III and Ryoken III-XP are both "Skinwalker").
        const clash = own.flatMap(({ keys, layout }, index) => keys.map((key, at) => ({ layout, twin: taken.get(key), id: at > 0 ? idOf(index) : undefined })))
            .find(({ twin, id }) => twin && !(id && twin.mulId && id !== twin.mulId))
            ?? listed.map(({ entry, unit }) => ({ layout: own[entries.indexOf(entry)].layout, twin: takenIds.get(unit!.Id) })).find(({ twin }) => twin);
        if (clash) {
            const { layout, twin } = clash as { layout: IKeptLayout; twin: IKeptLayout };
            // A duplicate names what it differs in; a different submodel waits for its renumbered model.
            const { duplicate, why } = compareDesigns(twin.summary, layout.summary);
            if (!duplicate && !renaming && !design.omnimech && job.source === "ssw") {
                const keptModels = kept.filter(({ header }) => header.name.toLowerCase() === chassis.trim().toLowerCase()).map(({ header }) => header.model);
                // The twin's own name, spelled another way ("Cougar X 3" for Cougar X3), is taken too.
                const isTaken = (other: string) => squash(chassis + other) === squash(twin.name)
                    || getMULMatchKeys(chassis, other).some((key) => taken.has(key) || mul.has(key));
                const to = getRenumberedModel(chassis, model, tons, bv, keptModels, canon, isTaken);
                const note = `${chassis} ${model} renamed ${to}, a different submodel (${why}) of ${twin.name}`;
                if (keep(job, prepareMechFile(job, indexes, to), (reason, detail) => leave(reason, (detail ? detail + "; " : "") + note), true)) {
                    renamed.push({ file: job.name, from: chassis + " " + model, to: chassis + " " + to });
                    return true;
                }
                return false;
            }
            leave(duplicate ? "duplicate of a design already kept" + (why ? ", differs only in " + why : "") : "different submodel, same name and model: " + why, twin.name);
            return false;
        }
        const matched = listed.filter((match) => match.unit!.BattleValue > 0);
        const wrong = matched.filter(({ entry, unit }) => entry.bv !== unit!.BattleValue);
        if (wrong.length > 0) {
            leave("BV differs from the MUL", wrong.map(({ entry, unit }) => `${entry.model}: BV ${entry.bv}, MUL ${unit!.BattleValue}`).join("; "),
                wrong.map(({ entry, unit }) => ({ mulId: unit!.Id, name: `${entry.chassis} ${entry.model}`.trim(), ours: entry.bv, mul: unit!.BattleValue })));
            return false;
        }
        if (matched.length === 0 && !renaming) notChecked.noMulEntry++;
        // A MegaMek 'Mech the MUL lacks is filed in the custom unit list at our own BV, which the rules, books and
        // errata certify; no other tool's figure is the check.
        let customRecord: IASMULUnit | null = null;
        if (matched.length === 0 && listed.length === 0 && design.customForm && !renaming) {
            if (!(bv > 0)) { leave("not on the MUL, and has no BV of its own"); return false; }
            if (!design.survives) { leave("does not survive the compact format"); return false; }
            customRecord = makeMegaMekCustomRecord(design.customForm, customIds, customRecords);
            if (!customRecord) { leave("its custom unit list key is taken"); return false; }
        }
        if (matched.length === 0 && job.source !== "ssw" && !customRecord) { leave("no Master Unit List entry to check its BV against"); return false; }
        // An OmniMech's configurations were checked one by one.
        if (matched.length === 0 && !customRecord && !design.omnimech && bv !== design.fileBV) { leave("BV differs from the file (no MUL entry)", `BV ${bv}, file ${design.fileBV}`); return false; }
        if (!design.survives) { leave("does not survive the compact format"); return false; }
        own.forEach(({ keys, layout }, index) => keys.forEach((key) => taken.set(key, { ...layout, mulId: idOf(index) })));
        listed.forEach(({ entry, unit }) => takenIds.set(unit!.Id, own[entries.indexOf(entry)].layout));
        if (customRecord) customRecords.push(customRecord);
        matched.forEach(({ unit }) => matchedIds.add(unit!.Id));
        const mulId = customRecord?.Id ?? matched.find(({ entry }) => entry.base)?.unit?.Id ?? matched[0]?.unit?.Id;
        const sourceUrl = job.source === "mordel" ? getMordelUnitUrl(job.name) : undefined;
        const { cost, rulesLevel, year, tech, configs, layout, standing } = design.header!;
        kept.push({
            header: {
                name: chassis, model, tons, bv, cost, rulesLevel, year, tech, ...(mulId ? { mulId } : {}), source: job.source,
                ...(sourceUrl ? { sourceUrl } : {}), ...(configs ? { configs } : {}), layout, ...(standing ? { standing } : {}),
            },
            design: design.design!,
        });
        return true;
    };

    for (const job of listMechJobs(sswDir, megamekDir, mordelDir)) {
        keep(job, prepared(job), (reason, detail = "", misses = []) => {
            leftOut.push({ file: job.name, reason, detail });
            missed.push(...misses.map((miss) => ({ ...miss, file: job.name })));
        });
    }
    kept.sort((a, b) => (a.header.name + " " + a.header.model).localeCompare(b.header.name + " " + b.header.model));
    return {
        headers: kept.map(({ header }, id) => ({ id, ...header })), designs: kept.map(({ design }) => design), leftOut, renamed, customRecords,
        accuracy: buildBundledAccuracy(matchedIds, missed, notChecked),
    };
}

/** One record a line, so a rebuild's diff shows which designs changed. */
const lines = (records: [string, unknown][], open: string, close: string) =>
    open + "\n" + records.map(([key, value]) => (key ? JSON.stringify(key) + ":" : "") + JSON.stringify(value)).join(",\n") + "\n" + close;

/** Writes a type's index, its chunks and its report under dataDir, replacing the last build. */
export function writeBundledDesigns(type: string, title: string, notice: string, build: IBundledBuild, dataDir: string): void {
    const chunkDir = path.join(dataDir, type);
    fs.rmSync(chunkDir, { recursive: true, force: true });
    fs.mkdirSync(chunkDir, { recursive: true });
    const head = `"notice":${JSON.stringify(notice)},`;
    fs.writeFileSync(path.join(dataDir, `${type}-index.json`), `{${head}"designs":${stringifyTable(build.headers).trimEnd()}}\n`);
    for (let chunk = 0; chunk * BUNDLED_CHUNK_SIZE < build.designs.length; chunk++) {
        const ids = build.headers.slice(chunk * BUNDLED_CHUNK_SIZE, (chunk + 1) * BUNDLED_CHUNK_SIZE).map((header) => header.id);
        const { shared, designs } = shareChunk(Object.fromEntries(ids.map((id) => [String(id), build.designs[id]])));
        fs.writeFileSync(path.join(chunkDir, `${chunk}.json`), lines(shared.map((value) => ["", value]), `{${head}"shared":[`, "],")
            + lines(Object.entries(designs), `"designs":{`, "}}\n"));
    }
    const reasons = new Map<string, number>();
    for (const { reason } of build.leftOut) {
        reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
    }
    fs.writeFileSync(path.join(dataDir, `${type}-report.md`), [
        `# Bundled ${title}: build report`, "",
        `${build.headers.length} designs kept${build.renamed?.length ? ` (${build.renamed.length} renamed)` : ""}, ${build.leftOut.length} files left out.`, "",
        "| Reason | Files |", "|---|---|", ...[...reasons].sort((a, b) => b[1] - a[1]).map(([reason, count]) => `| ${reason} | ${count} |`), "",
        "## Left out", "", ...build.leftOut.map(({ file, reason, detail }) => `- \`${file}\`: ${reason}${detail ? ": " + detail : ""}`), "",
        ...(build.renamed?.length ? ["## Renamed", "", "Different submodels of a kept design, kept under a new model (#241).", "",
            ...build.renamed.map(({ file, from, to }) => `- \`${file}\`: ${from} -> ${to}`), ""] : []),
    ].join("\n"));
    // The accuracy data (#599): stable key order and one differing unit a line, so a rebuild's diff reads well.
    if (build.accuracy) {
        const { unitType, matched, differs, notChecked } = build.accuracy;
        fs.writeFileSync(path.join(dataDir, `${type}-accuracy.json`), `{"unitType":${JSON.stringify(unitType)},"matched":${matched},`
            + `"notChecked":${JSON.stringify({ importFailed: notChecked.importFailed, noMulEntry: notChecked.noMulEntry })},\n`
            + lines(differs.map(({ mulId, name, config, ours, mul, file }) => ["", { mulId, name, ...(config ? { config } : {}), ours, mul, file }]), `"differs":[`, "]}\n"));
    }
}

export const writeBundledMechs = (build: IBundledBuild, dataDir: string): void => writeBundledDesigns("mechs", "'Mechs", BUNDLED_MECHS_NOTICE, build, dataDir);
