// Build support, not app code: converts MegaMek's unit files into the bundled designs of the types other than 'Mechs
// (#241 round 2). Run by
//   npm run build:bundled -- units
// (bundled-build-runner.ts) with BUNDLED_MEGAMEK_DIR set to MegaMek's unit_files folder when it is not the default below.
import fs from "node:fs";
import path from "node:path";
import type { IASMULUnit } from "../classes/alpha-strike-unit";
import { getBlkUnitKind, importBlkUnit } from "../classes/blk-unit-import";
import { blkValue, parseBlkFile } from "../utils/blk-file";
import { BLK_ILLEGAL_AS_PRINTED, BLK_ILLEGAL_REASONS } from "./blk-design-corrections";
import { compactUnit, IBundledDesignHeader, loadBundledUnit } from "../utils/bundled-designs";
import { getClassicUnitEntries, getMULMatchKeys, isMULCapitalShip, isMULLargeAerospaceCraft } from "../utils/classicMULMatch";
import type Vehicle from "../classes/vehicle";
import {
    buildBundledAccuracy, getBundledStanding, IBundledAccuracy, IBundledBuild, IBundledMiss, isMegaMekCustom, isMULMech, loadMegaMekCustomIds, loadMULIndex, makeMegaMekCustomRecord, seedRandom,
    writeMegaMekCustomRecords as writeCustomRecords,
} from "./bundled-mechs-build";
import { BundledUnit, BundledUnitType, getBundledUnitClass } from "./bundled-units";
import { CUSTOM_RULES_LEVELS, ICustomMULForm } from "./custom-mul";
import { vehicleMULForm } from "./sample-mul";

export { DEFAULT_MEGAMEK_DIR, MEGAMEK_CUSTOM_ID_START, MEGAMEK_CUSTOM_KEY_PREFIX, MEGAMEK_NOTICE } from "./bundled-mechs-build";

interface IBlkKind {
    title: string;
    /** The Master Unit List entries of the type, as the Classic MUL search files them. */
    mul: (unit: IASMULUnit) => boolean;
}

// Each bundled type is a kind the shared MegaMek reader (importBlkUnit) gives, by the same name.
export const BLK_KINDS: Record<BundledUnitType, IBlkKind> = {
    "battle-armor": { title: "battle armor", mul: (unit) => unit.Type?.Id === 22 },
    // The MUL files fighters under type 17 with the larger aerospace craft.
    "fighters": { title: "fighters", mul: (unit) => unit.Type?.Id === 17 && !isMULLargeAerospaceCraft(unit) },
    "infantry": { title: "conventional infantry", mul: (unit) => unit.Type?.Id === 21 },
    "protomechs": { title: "ProtoMechs", mul: (unit) => unit.Type?.Id === 23 },
    "small-craft": { title: "Small Craft and DropShips", mul: (unit) => isMULLargeAerospaceCraft(unit) && !isMULCapitalShip(unit) },
    // The MUL files some tanks (the Koryu Submarine, the Marsden MBT II (Primitive)) as Support Vehicles.
    "vehicles": { title: "Combat Vehicles", mul: (unit) => [19, 24].includes(unit.Type?.Id) },
    "support-vehicles": { title: "Support Vehicles", mul: (unit) => [19, 24].includes(unit.Type?.Id) },
};
const isBundledType = (kind: string | null): kind is BundledUnitType => !!kind && kind in BLK_KINDS;

/** MegaMek's rules levels ("IS Level 2", "Mixed (IS Chassis) Advanced") as Skunk Werks' (0 Introductory to 4). */
export function getBlkRulesLevel(type: string): number {
    const level = /Level (\d)/i.exec(type);
    if (level) return Math.min(+level[1] - 1, 4);
    return /experimental/i.test(type) ? 3 : /advanced/i.test(type) ? 2 : 1;
}

const listFiles = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory() ? listFiles(path.join(dir, entry.name)) : /\.blk$/i.test(entry.name) ? [path.join(dir, entry.name)] : []);

const getCost = (unit: BundledUnit): number => unit.getCBillCost() ?? 0;

/** A MegaMek unit file, in build order. */
export interface IUnitJob { file: string; name: string }

export const listUnitJobs = (megamekDir: string): IUnitJob[] =>
    listFiles(megamekDir).sort().map((file) => ({ file, name: path.relative(megamekDir, file).replace(/\\/g, "/") }));

/**
 * What a file gives on its own, before the other files are weighed: its type, the import, its BV and the compact
 * design with its round trip. The slow part, so it runs on the build runner's workers and is cached.
 */
export interface IPreparedUnit {
    /** None when the file is not of a bundled type. */
    type?: BundledUnitType;
    leaves: { reason: string; detail: string }[];
    rejected?: boolean;
    /** The full name's match key first, then the alternate names'. */
    keys?: string[];
    /** The MUL 1.0 id the file names. */
    mulId?: number;
    bv?: number;
    /** The unit's own tonnage, if it has one (battle armor takes the MUL's). */
    tons?: number;
    /** The tech base the file's type gives, for a MUL entry that names none. */
    tech?: string;
    /** A battle armor file's trooper count, which the legacy archive match must agree with. */
    troopers?: number;
    survives?: boolean;
    header?: Pick<IBundledDesignHeader, "name" | "model" | "cost" | "rulesLevel" | "year" | "standing" | "illegal">;
    design?: Record<string, unknown>;
    /** A Combat Vehicle's custom unit list entry, for when the MUL has none. */
    customForm?: ICustomMULForm;
}

interface IKept { header: Omit<IBundledDesignHeader, "id">; design: Record<string, unknown> }
/** One type's part of a units build. `checked` holds the MUL entries a file was compared with, for the accuracy facts. */
interface ITypeWork {
    kind: IBlkKind; mul: Map<string, IASMULUnit>; taken: Set<string>; kept: IKept[]; leftOut: IBundledBuild["leftOut"];
    matchedIds: Set<number>; missed: IBundledMiss[]; notChecked: IBundledAccuracy["notChecked"]; checked: Map<number, IASMULUnit>;
}

/**
 * The types whose files the MUL lacks are filed in the custom unit list, credited to MegaMek, and bundled (#241);
 * Support Vehicles since the Support Vehicle round (#600), the same reading as the Combat Vehicles.
 */
const MEGAMEK_CUSTOM_TYPES: BundledUnitType[] = ["vehicles", "support-vehicles"];
/** The units build's MegaMek entries: every type but the 'Mechs, which the 'Mech build files. */
const isOurs = (unit: IASMULUnit): boolean => !isMULMech(unit);
const looseKey = (key: string): string => key.replace(/[^a-z0-9]/g, "");

/**
 * A conventional infantry key in the words the MUL and MegaMek share (#600): the MUL spells a weapon "(Rifle, Ballistic)"
 * and "(Rifle, Energy)" where MegaMek says "(Rifle)" and "(Laser)", and a faction platoon "(FS3067+)" and "(FW3035+)"
 * where MegaMek says "(AFFS) (... 3067+)" and "(FWLM) (... 3035+)"; the words then sort, so their order is no matter.
 */
export function infantryKey(key: string): string {
    return key.replace(/[(),]/g, " ").replace(/\brifle\s+ballistic\b/g, "rifle").replace(/\brifle\s+energy\b/g, "laser")
        .replace(/\bfs(\d{4}\+)/g, "affs $1").replace(/\bfw(\d{4}\+)/g, "fwlm $1").split(/\s+/).filter(Boolean).sort().join(" ");
}

/** The archive of the MUL 1.0 records the live MUL replaced (tools/mul-sync): a MUL 1.0 id to the live record's key. */
const LEGACY_ARCHIVE = path.join("tools", "mul-sync", "archive", "replaced-legacy-records.json");
function loadLegacyReplacements(mulDir: string): Map<number, string> {
    const file = path.resolve(mulDir, "..", "..", "..", LEGACY_ARCHIVE);
    if (!fs.existsSync(file)) return new Map();
    return new Map((JSON.parse(fs.readFileSync(file, "utf8")) as { replacedBy: string; record: { Id: number } }[]).map((item) => [item.record.Id, item.replacedBy]));
}

/** MegaMek files that name a MUL unit another way, by MegaMek's name and model: the MUL id they are. */
export const MEGAMEK_MUL_IDS: Record<string, number> = Object.fromEntries(([
    ["Bandit Hovercraft", "Mk 2", 102443],
    ["Basilisk ProtoMech (Quad)", "", 107613],
    ["Basilisk ProtoMech (Quad)", "B", 104262],
    // The WoR Ultraheavy ProtoMechs: the MUL files them under the chassis name alone ("Boggart", "Boggart 2").
    ["Boggart Ultraheavy ProtoMech", "", 108316],
    ["Boggart Ultraheavy ProtoMech 2", "", 104076],
    ["Browning Mobile HQ", "", 100191],
    ["Browning Mobile HQ", "(Half Track)", 104491],
    ["Coolant Truck", "135-K", 106317],
    ["DI Multipurpose VTOL", "", 105119],
    ["DI Multipurpose VTOL", "(Gunship)", 108135],
    ["Eldingar Hover Sled", "'HumHov'", 108700],
    ["Gun Trailer", "(Artillery/AA)", 101853],
    ["Hephaestus Jump Tank", "(AP)", 100592],
    ["Hobgoblin Ultraheavy ProtoMech", "", 102774],
    ["Hobgoblin Ultraheavy ProtoMech 2", "", 107455],
    ["Mobile Long Tom Artillery", "LT-MOB-25 (Support Carriage)", 103858],
    ["Phalanx Support Tank", "(Production)", 104219],
    ["Rommel Tank", "(Howitzer) Production", 106702],
    ["Sokar Urban Combat Unit", "", 104507],
    ["Sprite Ultraheavy ProtoMech", "", 101164],
    ["Sprite Ultraheavy ProtoMech 2", "", 108436],
    ["Sprite Ultraheavy ProtoMech 3", "", 101150],
] as [string, string, number][]).map(([name, model, id]) => [getMULMatchKeys(name, model)[0], id]));

function megaMekCustomForm(unit: Vehicle, job: IUnitJob, blk: NonNullable<ReturnType<typeof parseBlkFile>>): ICustomMULForm {
    return {
        ...vehicleMULForm(unit),
        rules: CUSTOM_RULES_LEVELS[Math.min(getBlkRulesLevel(blkValue(blk, "type")), 3)],
        role: blkValue(blk, "role") || "None",
        dateIntroduced: blkValue(blk, "year"),
        author: "MegaMek",
        source: "MegaMek unit files",
        notes: `Not on the Master Unit List; converted from MegaMek's ${job.name} (MegaMek Data, CC BY-NC-SA 4.0).`,
    };
}

/**
 * A design checked and found illegal as printed (BLK_ILLEGAL_AS_PRINTED) is kept and flagged with what it breaks
 * (NGCFells 2026-11-20): a Support Vehicle by the TechManual's Support Vehicle rules, a Combat Vehicle by its weight
 * and its OmniVehicle turret (TM p.108).
 */
export function getBundledIllegal(unit: unknown): { illegal?: string[] } {
    const vehicle = unit as Partial<Vehicle>;
    const designName = vehicle.getName ? `${vehicle.getName()} ${vehicle.getModel?.() ?? ""}`.trim() : "";
    if (!vehicle.getName || !BLK_ILLEGAL_AS_PRINTED.has(designName)) return {};
    const combatIssues = (tank: Vehicle): string[] => [
        ...(tank.getCurrentTonnage() > tank.getTonnage() ? [`${tank.getCurrentTonnage()} tons used of ${tank.getTonnage()}`] : []),
        ...(tank.getOmniTurretIssue() ? [tank.getOmniTurretIssue()!] : []),
    ];
    const issues = [
        ...(vehicle.isSupportVehicle?.() ? vehicle.getSupportVehicleIssues!() : vehicle.getOmniTurretIssue ? combatIssues(vehicle as Vehicle) : []),
        ...(BLK_ILLEGAL_REASONS[designName] ? [BLK_ILLEGAL_REASONS[designName]] : []),
    ];
    return issues.length ? { illegal: issues } : {};
}

export function prepareUnitFile(job: IUnitJob): IPreparedUnit {
    const text = fs.readFileSync(job.file, "utf8");
    const blk = parseBlkFile(text);
    const kind = getBlkUnitKind(text);
    const leaves: IPreparedUnit["leaves"] = [];
    if (!blk || !isBundledType(kind)) return { leaves };
    const type = kind;
    const leave = (reason: string, detail = "") => { leaves.push({ reason, detail }); };
    const { warn, log } = console;
    const random = Math.random;
    console.warn = () => {};
    console.log = () => {};
    try {
        seedRandom(job.name);
        let imported: ReturnType<typeof importBlkUnit>;
        try {
            imported = importBlkUnit(text, [type]);
        } catch (error) {
            leave("import threw", String(error)); return { type, leaves, rejected: true };
        }
        const unit = imported.unit as BundledUnit | null;
        if (!unit) { leave("import failed", imported.issues.join("; ")); return { type, leaves, rejected: true }; }
        if (imported.issues.length > 0) { leave("the import could not carry all of it over", imported.issues.join("; ")); return { type, leaves, rejected: true }; }
        const Unit = getBundledUnitClass(type);
        const bv = unit.getBattleValue();
        const design = compactUnit(unit, Unit);
        const reload = loadBundledUnit(design, Unit);
        const blkType = blkValue(blk, "type");
        return {
            type, leaves, keys: getClassicUnitEntries([unit]).flatMap((entry) => getMULMatchKeys(entry.chassis, entry.model)),
            ...(+blkValue(blk, "mul id:") ? { mulId: +blkValue(blk, "mul id:") } : {}), bv,
            ...(type === "battle-armor" && +blkValue(blk, "Trooper Count") > 0 ? { troopers: +blkValue(blk, "Trooper Count") } : {}),
            ...("getTonnage" in unit ? { tons: unit.getTonnage() } : {}),
            tech: /^clan/i.test(blkType) ? "Clan" : /^mixed/i.test(blkType) ? "Mixed" : "Inner Sphere",
            survives: reload.getBattleValue() === bv && getCost(reload) === getCost(unit) && JSON.stringify(compactUnit(reload, Unit)) === JSON.stringify(design),
            header: {
                name: unit.getName(), model: "getModel" in unit ? unit.getModel() : "", cost: getCost(unit),
                rulesLevel: getBlkRulesLevel(blkType), year: +blkValue(blk, "year") || 0, ...getBundledStanding(job.name, unit),
                ...getBundledIllegal(unit),
            },
            design,
            ...(MEGAMEK_CUSTOM_TYPES.includes(type) ? { customForm: megaMekCustomForm(unit as Vehicle, job, blk) } : {}),
        };
    } finally {
        console.warn = warn;
        console.log = log;
        Math.random = random;
    }
}

/**
 * Every MegaMek file of each type, kept when the import carried all of it over and its BV matches the Master Unit
 * List's (the files hold no BV of their own). A file's MUL id is MUL 1.0's, which only our MUL 1.0 entries still
 * carry; the rest are matched by name. `prepare` gives each file's prepared design (the build runner's workers and
 * cache); by default each is prepared here.
 */
export function buildBundledUnits(megamekDir: string, mulDir: string, prepare: (job: IUnitJob) => IPreparedUnit = prepareUnitFile): { builds: Record<BundledUnitType, IBundledBuild & { accuracy: IBundledAccuracy }>; customRecords: IASMULUnit[] } {
    const types = Object.keys(BLK_KINDS) as BundledUnitType[];
    const mul1 = new Map<number, IASMULUnit>();
    for (const file of fs.readdirSync(path.join(mulDir, "mul1"))) {
        for (const unit of JSON.parse(fs.readFileSync(path.join(mulDir, "mul1", file), "utf8")) as IASMULUnit[]) mul1.set(unit.Id, unit);
    }
    // The custom list as it stands: an earlier build's MegaMek entries keep their ids; new ones take the next free.
    const customIds = loadMegaMekCustomIds(mulDir, isOurs);
    const customRecords: IASMULUnit[] = [];
    // A MegaMek entry is NGCFells's, not a BV to check a file against. Each type keeps its accuracy tallies (#599):
    // the MUL entries with a kept design, every BV difference, and the files not compared, as the 'Mechs do.
    const work = Object.fromEntries(types.map((type) => [type, { kind: BLK_KINDS[type], mul: loadMULIndex(mulDir, (unit) => !isMegaMekCustom(unit) && BLK_KINDS[type].mul(unit)), taken: new Set<string>(),
        kept: [] as IKept[], leftOut: [] as IBundledBuild["leftOut"], matchedIds: new Set<number>(), missed: [] as IBundledMiss[],
        notChecked: { importFailed: 0, noMulEntry: 0 }, checked: new Map<number, IASMULUnit>() }])) as Record<BundledUnitType, ITypeWork>;
    // Each type's MUL keys with only letters and digits left, for MegaMek's spellings ("Fulcrum Heavy HoverTank",
    // "Darter Scout Car (SRM-2)"); a loose key two entries share matches neither.
    const loose = Object.fromEntries(types.map((type) => {
        const index = new Map<string, IASMULUnit | null>();
        for (const [key, entry] of work[type].mul) {
            const at = looseKey(key);
            index.set(at, index.has(at) && index.get(at) !== entry ? null : entry);
        }
        return [type, index];
    })) as Record<BundledUnitType, Map<string, IASMULUnit | null>>;
    const ids = Object.fromEntries(types.map((type) => [type, new Map([...work[type].mul.values()].map((entry) => [entry.Id, entry]))])) as Record<BundledUnitType, Map<number, IASMULUnit>>;
    // Conventional infantry only (#600): a file's MUL 1.0 id names the live record the archive says replaced it, and the
    // MUL's words and MegaMek's meet in infantryKey. A key two entries share matches neither, as the loose index does.
    const legacy = loadLegacyReplacements(mulDir);
    const byUnitKey = new Map([...work.infantry.mul.values()].map((entry) => [entry.MulUnitKey, entry]));
    // Battle armor too (#600): the live MUL renamed the variants ("[SRM/Flamer] (Sqd4)" for a file's "[Flamer](Sqd4)"), and
    // the archive names the record. A squad's record is a different unit from the same suit in another size, so the
    // squad size in the MUL's name must be the file's trooper count.
    const byBattleArmorKey = new Map([...work["battle-armor"].mul.values()].map((entry) => [entry.MulUnitKey, entry]));
    const squadOf = (entry: IASMULUnit): number | undefined => { const squad = /\bSqd\s*(\d+)\b/i.exec(`${entry.Name ?? ""} ${entry.Variant ?? ""}`); return squad ? +squad[1] : undefined; };
    const infantry = new Map<string, IASMULUnit | null>();
    for (const [key, entry] of work.infantry.mul) {
        const at = infantryKey(key);
        infantry.set(at, infantry.has(at) && infantry.get(at) !== entry ? null : entry);
    }
    for (const file of listUnitJobs(megamekDir)) {
        const unit = prepare(file);
        if (!unit.type) continue;
        const job = work[unit.type];
        const leave = (reason: string, detail = "") => job.leftOut.push({ file: file.name, reason, detail });
        unit.leaves.forEach(({ reason, detail }) => leave(reason, detail));
        if (unit.rejected) { job.notChecked.importFailed++; continue; }
        const keys = unit.keys!;
        // The full name alone: a battle armor name ends in its squad size, "(Sqd4)", which the alternate-name keys
        // read as a second chassis name.
        if (job.taken.has(keys[0])) { leave("duplicate of a design already kept"); continue; }
        const byId = unit.mulId ? mul1.get(unit.mulId) : undefined;
        const alias = MEGAMEK_MUL_IDS[keys[0]];
        const isInfantry = unit.type === "infantry";
        const archived = isInfantry && unit.mulId && legacy.has(unit.mulId) ? byUnitKey.get(legacy.get(unit.mulId)!) : undefined;
        // An infantry file's own words, when one MUL entry alone has them, beat its MUL 1.0 id: MegaMek's Clan
        // Mechanized Hover Point (SRM Basic) carries 9613, the Tracked Point's.
        const archivedSuit = unit.type === "battle-armor" && unit.mulId && legacy.has(unit.mulId) ? byBattleArmorKey.get(legacy.get(unit.mulId)!) : undefined;
        const sameSquad = archivedSuit && unit.troopers !== undefined && squadOf(archivedSuit) === unit.troopers ? archivedSuit : undefined;
        const named = isInfantry ? keys.map((key) => infantry.get(infantryKey(key))).find(Boolean) ?? undefined : undefined;
        let match = (byId && job.kind.mul(byId) ? byId : undefined) ?? (alias ? ids[unit.type].get(alias) : undefined) ?? sameSquad ?? keys.map((key) => job.mul.get(key)).find(Boolean)
            ?? named ?? archived ?? keys.map((key) => loose[unit.type!].get(looseKey(key))).find(Boolean) ?? undefined;
        // Only a MUL entry with a BV is a check; a custom record is our own figure.
        const official = match && match.BattleValue > 0 ? match : undefined;
        if (official) job.checked.set(official.Id, official);
        else job.notChecked.noMulEntry++;
        if (!match && unit.customForm) {
            if (!unit.survives) { leave("not on the MUL, and does not survive the compact format"); continue; }
            if (!(unit.bv! > 0)) { leave("not on the MUL, and has no BV of its own"); continue; }
            const record = makeMegaMekCustomRecord(unit.customForm, customIds, customRecords);
            if (!record) { leave("its custom unit list key is taken"); continue; }
            match = record;
            customRecords.push(match);
        }
        if (!match) { leave("no Master Unit List entry to check its BV against"); continue; }
        // Where the MUL gives no BV, ours stands: the rules, books and errata certify it, not another tool's figure.
        if (official && unit.bv !== official.BattleValue) {
            leave("BV differs from the MUL", `BV ${unit.bv}, MUL ${official.BattleValue}`);
            job.missed.push({ mulId: official.Id, name: `${unit.header!.name} ${unit.header!.model}`.trim(), ours: unit.bv!, mul: official.BattleValue, file: file.name });
            continue;
        }
        if (!(unit.bv! > 0)) { leave("has no BV of its own, and the MUL gives none"); continue; }
        if (!unit.survives) { leave("does not survive the compact format"); continue; }
        job.taken.add(keys[0]);
        if (official) job.matchedIds.add(official.Id);
        const { name, model, cost, rulesLevel, year, standing, illegal } = unit.header!;
        job.kept.push({
            header: {
                name, model, tons: unit.tons ?? +match.Tonnage, bv: unit.bv!, cost, rulesLevel, year, tech: match.Technology?.Name ?? unit.tech!,
                mulId: match.Id, source: "megamek", ...(standing ? { standing } : {}), ...(illegal ? { illegal } : {}),
            },
            design: unit.design!,
        });
    }
    const builds = Object.fromEntries(types.map((type) => {
        const { kept, leftOut, matchedIds, missed, notChecked, checked } = work[type];
        kept.sort((a, b) => (a.header.name + " " + a.header.model).localeCompare(b.header.name + " " + b.header.model));
        return [type, { headers: kept.map(({ header }, id) => ({ id, ...header })), designs: kept.map(({ design }) => design), leftOut,
            accuracy: buildBundledAccuracy(type, matchedIds, missed, notChecked, checked) }];
    })) as Record<BundledUnitType, IBundledBuild & { accuracy: IBundledAccuracy }>;
    return { builds, customRecords };
}

/** The custom unit list's file text with this build's MegaMek entries replaced by `records`; the rest are kept. */
export const writeMegaMekCustomRecords = (currentFileText: string | null, records: IASMULUnit[]): string => writeCustomRecords(currentFileText, records, isOurs);
