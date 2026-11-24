import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { BUNDLED_CHUNK_SIZE } from "../utils/bundled-designs";
import { buildBundledUnits, getBlkRulesLevel, writeMegaMekCustomRecords } from "./bundled-units-build";
import { BLK_ILLEGAL_AS_PRINTED } from "./blk-design-corrections";
import { BundledUnitType, loadBundledIndex, loadBundledUnitDesign } from "./bundled-units";
import { importBattleArmorBlk } from "../classes/battle-armor-blk";
import type AerospaceFighter from "../classes/aerospace-fighter";
import type InfantryPlatoon from "../classes/infantry-platoon";

// The bundled battle armor, ProtoMechs, Small Craft and DropShips, Support Vehicles (#241 round 2), fighters (#600 round 4b) and Combat
// Vehicles (round 4a). Regenerate
// from MegaMek's unit files with
//   npm run build:bundled -- units
// Each file is imported, its BV checked against the Master Unit List and its round trip through the compact format;
// the designs that pass are written, with a report of the rest (bundled/<type>-report.md).
const dataDir = path.resolve(__dirname, "bundled");

// Pinned so a growing data set is a deliberate change.
const DESIGNS: Record<BundledUnitType, number> = { "battle-armor": 1032, "fighters": 315, "infantry": 317, "protomechs": 70, "small-craft": 101, "support-vehicles": 183, "vehicles": 1097 };
// Each type's index and chunks together, in bytes, with a little room.
const MAX_BYTES: Record<BundledUnitType, number> = { "battle-armor": 1_560_000, "fighters": 1_060_000, "infantry": 340_000, "protomechs": 210_000, "small-craft": 500_000, "support-vehicles": 830_000, "vehicles": 3_480_000 };

describe("bundled units other than 'Mechs", () => {
    // A clean MegaMek file the MUL lacks gets a record of its own in the custom unit list, credited to MegaMek, and is
    // bundled under it; a rebuild keeps the record's id.
    it("files a clean vehicle the MUL lacks in the custom unit list, credited to MegaMek, and bundles it", () => {
        const block = (tag: string, ...lines: string[]): string[] => [`<${tag}>`, ...lines, `</${tag}>`];
        const tank = [
            ...block("UnitType", "Tank"), ...block("Name", "Test Tank"), ...block("Model", "TT-2"), ...block("year", "3060"),
            ...block("type", "IS Level 2"), ...block("role", "Brawler"), ...block("motion_type", "Tracked"), ...block("cruiseMP", "4"), ...block("engine_type", "2"),
            ...block("armor_type", "1"), ...block("armor_tech_level", "1"), ...block("armor", "30", "20", "20", "15", "25"),
            ...block("Front Equipment", "ISSRM6", "ISSRM6"), ...block("Right Equipment", "Machine Gun"), ...block("Left Equipment"), ...block("Rear Equipment"),
            ...block("Turret Equipment", "Medium Laser"), ...block("Body Equipment", "ISSRM6 Ammo", "ISCASE", "IS Ammo MG - Half"), ...block("tonnage", "50.0"),
        ].join("\n");
        const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-units-"));
        try {
            const megamek = path.join(root, "unit_files");
            fs.mkdirSync(path.join(megamek, "vehicles"), { recursive: true });
            fs.writeFileSync(path.join(megamek, "vehicles", "Test Tank TT-2.blk"), tank);
            const mul = path.join(root, "mul");
            for (const list of ["live", "mul1", "custom"]) fs.mkdirSync(path.join(mul, list), { recursive: true });
            const first = buildBundledUnits(megamek, mul);
            const [record] = first.customRecords;
            expect(first.customRecords).toHaveLength(1);
            expect(record.MulUnitKey).toBe("CUSTOM-MEGAMEK-TEST-TANK-TT-2");
            expect([record.Name, record.Variant, record.Type?.Id, record.Role?.Name, record.CustomInfo?.author]).toEqual(["Test Tank", "TT-2", 19, "Brawler", "MegaMek"]);
            expect(record.BFPointValue).toBeGreaterThan(0);
            expect(first.builds.vehicles.headers.map((header) => [header.name, header.model, header.bv, header.mulId])).toEqual([["Test Tank", "TT-2", record.BattleValue, record.Id]]);
            // Written out, then a rebuild: the same record, under the same id.
            fs.writeFileSync(path.join(mul, "custom", "custom-units.json"), writeMegaMekCustomRecords(null, [{ ...record, Id: 912345 }]));
            const second = buildBundledUnits(megamek, mul);
            expect(second.customRecords.map((entry) => entry.Id)).toEqual([912345]);
            expect(second.builds.vehicles.headers.map((header) => header.mulId)).toEqual([912345]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 60_000);

    // MegaMek's "Fulcrum Heavy HoverTank" is the MUL's "Fulcrum Heavy Hover Tank", and the MUL files some tanks, such
    // as the Koryu Submarine, as Support Vehicles: canon units, checked against the MUL, never custom entries.
    it("matches a vehicle to the MUL across spacing and hyphens, and among its Support Vehicles", () => {
        const tank = (name: string, model: string) => [
            ["UnitType", "Tank"], ["Name", name], ["Model", model], ["year", "3060"], ["type", "IS Level 2"], ["motion_type", "Tracked"], ["cruiseMP", "4"],
            ["engine_type", "0"], ["armor_type", "0"], ["armor", "10\n10\n10\n10"], ["Front Equipment", "Medium Laser"], ["Right Equipment", ""], ["Left Equipment", ""],
            ["Rear Equipment", ""], ["Body Equipment", ""], ["tonnage", "20.0"],
        ].map(([tag, value]) => `<${tag}>\n${value}\n</${tag}>`).join("\n");
        const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-units-"));
        try {
            const megamek = path.join(root, "unit_files");
            fs.mkdirSync(path.join(megamek, "vehicles"), { recursive: true });
            fs.writeFileSync(path.join(megamek, "vehicles", "a.blk"), tank("Test HoverTank", "(SRM-2)"));
            fs.writeFileSync(path.join(megamek, "vehicles", "b.blk"), tank("Test Submarine", "(Civilian)"));
            const mul = path.join(root, "mul");
            for (const list of ["live", "mul1", "custom"]) fs.mkdirSync(path.join(mul, list), { recursive: true });
            const bv = buildBundledUnits(megamek, mul).customRecords[0].BattleValue;
            const entry = (Id: number, Name: string, Variant: string, type: number) => ({ Id, Name, Variant, BattleValue: bv, Tonnage: 20, Technology: { Name: "Inner Sphere" }, Type: { Id: type } });
            // MegaMek's "Browning Mobile HQ" is the MUL's "Browning Mobile Headquarters", by the alias table.
            fs.writeFileSync(path.join(megamek, "vehicles", "c.blk"), tank("Browning Mobile HQ", ""));
            fs.writeFileSync(path.join(mul, "live", "units.json"), JSON.stringify([entry(1, "Test Hover Tank", "(SRM2)", 19), entry(2, "Test Submarine", "(Civilian)", 24),
                entry(100191, "Browning Mobile Headquarters", "", 19)]));
            const { builds, customRecords } = buildBundledUnits(megamek, mul);
            expect(customRecords).toEqual([]);
            expect(builds.vehicles.headers.map((header) => header.mulId)).toEqual([100191, 1, 2]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 60_000);

    // MegaMek's Clan Mechanized Hover and Tracked Point (SRM Basic) files both carry MUL 1.0 id 9613, the Tracked
    // Point's: a file's own words, when one MUL entry alone has them, beat its id. A file whose words name no entry
    // (an era variant, "(SRM 2400+)") still takes the record the archive gives its id.
    it("matches an infantry file by its own words before its MUL 1.0 id, and by the id when its words name no entry", () => {
        const point = (motion: string, squad: number, squads: number, model = "(SRM Basic)") => [
            ["UnitType", "Infantry"], ["Name", `Clan Mechanized ${motion} Point`], ["Model", model], ["mul id:", "9613"], ["year", "2807"], ["type", "IS Level 2"],
            ["motion_type", motion], ["squad_size", String(squad)], ["squadn", String(squads)], ["secondn", "2"], ["Primary", "InfantryAssaultRifle"], ["Secondary", "InfantryHeavySRM"],
        ].map(([tag, value]) => `<${tag}>\n${value}\n</${tag}>`).join("\n");
        const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-units-"));
        try {
            const megamek = path.join(root, "unit_files");
            fs.mkdirSync(path.join(megamek, "infantry"), { recursive: true });
            fs.writeFileSync(path.join(megamek, "infantry", "hover.blk"), point("Hover", 5, 4));
            fs.writeFileSync(path.join(megamek, "infantry", "tracked.blk"), point("Tracked", 7, 4));
            fs.writeFileSync(path.join(megamek, "infantry", "tracked-era.blk"), point("Tracked", 7, 4, "(SRM 2400+)"));
            const mul = path.join(root, "src", "data", "mul");
            for (const list of ["live", "mul1", "custom"]) fs.mkdirSync(path.join(mul, list), { recursive: true });
            const entry = (Id: number, Name: string, MulUnitKey: string) => ({ Id, Name, Variant: "(SRM)", MulUnitKey, BattleValue: 1, Tonnage: 20, Technology: { Name: "Clan" }, Type: { Id: 21 } });
            fs.writeFileSync(path.join(mul, "live", "units.json"), JSON.stringify([entry(108498, "Clan Mechanized Hover Point (Basic)", "HOVER"), entry(101282, "Clan Mechanized Tracked Point (Basic)", "TRACKED")]));
            const archive = path.join(root, "tools", "mul-sync", "archive");
            fs.mkdirSync(archive, { recursive: true });
            fs.writeFileSync(path.join(archive, "replaced-legacy-records.json"), JSON.stringify([{ replacedBy: "TRACKED", record: { Id: 9613 } }]));
            const { builds } = buildBundledUnits(megamek, mul);
            expect(builds.infantry.accuracy!.differs.map((item) => [item.name, item.mulId]).sort()).toEqual([
                ["Clan Mechanized Hover Point (SRM Basic)", 108498], ["Clan Mechanized Tracked Point (SRM 2400+)", 101282],
            ]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 60_000);

    // The live MUL renamed battle armor variants; the legacy archive maps a file's MUL 1.0 id to the live record, as for
    // infantry, but only where the squad size agrees (#600): a Sqd1 file is not the Sqd4 record.
    it("matches a battle armor file through the legacy archive only when the squad size agrees", () => {
        const suit = (troopers: number) => [
            ["UnitType", "BattleArmor"], ["Name", "Test Suit"], ["Model", `[Flamer](Sqd${troopers})`], ["mul id:", "5199"], ["year", "3060"], ["type", "IS Level 2"],
            ["motion_type", "Jump"], ["cruiseMP", "1"], ["armor_type", "28"], ["armor_tech", "1"],
            ["Squad Equipment", "BABasicManipulator:LA\nBABasicManipulator:RA\nISBASRM2:Body"],
            ["chassis", "biped"], ["jumpingMP", "3"], ["armor", "7"], ["Trooper Count", String(troopers)], ["weightclass", "2"],
        ].map(([tag, value]) => `<${tag}>\n${value}\n</${tag}>`).join("\n");
        const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-units-"));
        try {
            const megamek = path.join(root, "unit_files");
            fs.mkdirSync(path.join(megamek, "battlearmor"), { recursive: true });
            fs.writeFileSync(path.join(megamek, "battlearmor", "squad4.blk"), suit(4));
            fs.writeFileSync(path.join(megamek, "battlearmor", "squad1.blk"), suit(1));
            const mul = path.join(root, "src", "data", "mul");
            for (const list of ["live", "mul1", "custom"]) fs.mkdirSync(path.join(mul, list), { recursive: true });
            const ours = (importBattleArmorBlk(suit(4)).suit as { getBattleValue(): number }).getBattleValue();
            fs.writeFileSync(path.join(mul, "live", "units.json"), JSON.stringify([
                { Id: 108460, Name: "Test Battle Armor", Variant: "[SRM/Flamer] (Sqd4)", MulUnitKey: "RENAMED", BattleValue: ours, Tonnage: 0.9, Technology: { Name: "Inner Sphere" }, Type: { Id: 22 } },
            ]));
            const archive = path.join(root, "tools", "mul-sync", "archive");
            fs.mkdirSync(archive, { recursive: true });
            fs.writeFileSync(path.join(archive, "replaced-legacy-records.json"), JSON.stringify([{ replacedBy: "RENAMED", record: { Id: 5199 } }]));
            const { builds } = buildBundledUnits(megamek, mul);
            const suits = builds["battle-armor"];
            expect(suits.headers.map((header) => [header.name, header.mulId])).toEqual([["Test Suit [Flamer](Sqd4)", 108460]]);
            expect(suits.leftOut.map((item) => [item.file, item.reason])).toEqual([["battlearmor/squad1.blk", "no Master Unit List entry to check its BV against"]]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 60_000);

    // The MUL lists some units with no BV: ours stands, certified by the rules and errata, not another tool's figure.
    it("keeps a unit the MUL gives no BV at our own BV", () => {
        const tank = (name: string) => [
            ["UnitType", "Tank"], ["Name", name], ["Model", ""], ["year", "3060"], ["type", "IS Level 2"], ["motion_type", "Tracked"], ["cruiseMP", "4"],
            ["engine_type", "0"], ["armor_type", "0"], ["armor", "10\n10\n10\n10"], ["Front Equipment", "Medium Laser"], ["Right Equipment", ""], ["Left Equipment", ""],
            ["Rear Equipment", ""], ["Body Equipment", ""], ["tonnage", "20.0"],
        ].map(([tag, value]) => `<${tag}>\n${value}\n</${tag}>`).join("\n");
        const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-units-"));
        try {
            const megamek = path.join(root, "unit_files");
            fs.mkdirSync(path.join(megamek, "vehicles"), { recursive: true });
            fs.writeFileSync(path.join(megamek, "vehicles", "Kept Tank.blk"), tank("Kept Tank"));
            const mul = path.join(root, "mul");
            for (const list of ["live", "mul1", "custom"]) fs.mkdirSync(path.join(mul, list), { recursive: true });
            fs.writeFileSync(path.join(mul, "live", "units.json"), JSON.stringify([{ Id: 1, Name: "Kept Tank", Variant: null, BattleValue: 0, Tonnage: 20, Technology: { Name: "Inner Sphere" }, Type: { Id: 19 } }]));
            const { builds, customRecords } = buildBundledUnits(megamek, mul);
            expect(customRecords).toEqual([]);
            expect(builds.vehicles.leftOut).toEqual([]);
            expect(builds.vehicles.headers.map((header) => [header.name, header.bv > 0, header.mulId])).toEqual([["Kept Tank", true, 1]]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 60_000);

    // Round 4b: the MUL files fighters under type 17 with the larger craft; a fighter is checked against its fighters only.
    it("bundles a fighter checked against the MUL's fighters", () => {
        const fighter = (name: string) => [
            ["UnitType", "AeroSpaceFighter"], ["Name", name], ["Model", "TF-1"], ["year", "3025"], ["type", "IS Level 1"], ["motion_type", "Aerodyne"],
            ["SafeThrust", "5"], ["engine_type", "0"], ["heatsinks", "10"], ["sink_type", "0"], ["fuel", "400"], ["armor_type", "0"], ["armor", "10\n8\n8\n6"],
            ["Nose Equipment", "Medium Laser"], ["Left Wing Equipment", ""], ["Right Wing Equipment", ""], ["Aft Equipment", ""], ["Fuselage Equipment", ""], ["tonnage", "30.0"],
        ].map(([tag, value]) => `<${tag}>\n${value}\n</${tag}>`).join("\n");
        const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-units-"));
        try {
            const megamek = path.join(root, "unit_files");
            fs.mkdirSync(path.join(megamek, "fighters"), { recursive: true });
            fs.writeFileSync(path.join(megamek, "fighters", "a.blk"), fighter("Test Fighter"));
            fs.writeFileSync(path.join(megamek, "fighters", "b.blk"), fighter("Test Leopard"));
            const mul = path.join(root, "mul");
            for (const list of ["live", "mul1", "custom"]) fs.mkdirSync(path.join(mul, list), { recursive: true });
            fs.writeFileSync(path.join(mul, "live", "units.json"), JSON.stringify([{ Id: 1, Name: "Test Fighter", Variant: "TF-1", BattleValue: 0, Tonnage: 30, Technology: { Name: "Inner Sphere" }, Type: { Id: 17, Name: "Fighter Craft" } },
                // A DropShip of the same name is not a fighter's entry.
                { Id: 2, Name: "Test Leopard", Variant: "TF-1", BattleValue: 0, Tonnage: 1900, Technology: { Name: "Inner Sphere" }, Type: { Id: 17, Name: "Aerospace Craft" } }]));
            const { builds, customRecords } = buildBundledUnits(megamek, mul);
            expect(customRecords).toEqual([]);
            expect(builds.fighters.headers.map((header) => [header.name, header.model, header.tons, header.mulId])).toEqual([["Test Fighter", "TF-1", 30, 1]]);
            expect(builds.fighters.leftOut.map((left) => [left.file, left.reason])).toEqual([["fighters/b.blk", "no Master Unit List entry to check its BV against"]]);
            expect(builds["small-craft"].headers).toEqual([]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 60_000);

    // #599: every type's accuracy record, as the 'Mechs have: matched, each difference with both numbers, the files not compared.
    it("records each type's matches, differences and files not compared", () => {
        const fighter = (name: string, cockpit = "0") => [
            ["UnitType", "AeroSpaceFighter"], ["Name", name], ["Model", "TF-1"], ["year", "3025"], ["type", "IS Level 1"], ["motion_type", "Aerodyne"],
            ["SafeThrust", "5"], ["cockpit_type", cockpit], ["engine_type", "0"], ["heatsinks", "10"], ["sink_type", "0"], ["fuel", "400"], ["armor_type", "0"], ["armor", "10\n8\n8\n6"],
            ["Nose Equipment", "Medium Laser"], ["Left Wing Equipment", ""], ["Right Wing Equipment", ""], ["Aft Equipment", ""], ["Fuselage Equipment", ""], ["tonnage", "30.0"],
        ].map(([tag, value]) => `<${tag}>\n${value}\n</${tag}>`).join("\n");
        const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundled-units-"));
        try {
            const megamek = path.join(root, "unit_files");
            fs.mkdirSync(path.join(megamek, "fighters"), { recursive: true });
            fs.writeFileSync(path.join(megamek, "fighters", "a.blk"), fighter("Alpha Fighter"));
            fs.writeFileSync(path.join(megamek, "fighters", "b.blk"), fighter("Bravo Fighter"));
            fs.writeFileSync(path.join(megamek, "fighters", "c.blk"), fighter("Charlie Fighter"));
            fs.writeFileSync(path.join(megamek, "fighters", "d.blk"), fighter("Delta Fighter", "1"));
            const mul = path.join(root, "mul");
            for (const list of ["live", "mul1", "custom"]) fs.mkdirSync(path.join(mul, list), { recursive: true });
            const entry = (Id: number, Name: string, BattleValue: number) => ({ Id, Name, Variant: "TF-1", BattleValue, Tonnage: 30, DateIntroduced: "3025", Rules: "Standard",
                Technology: { Name: "Inner Sphere" }, Type: { Id: 17, Name: "Fighter Craft" } });
            fs.writeFileSync(path.join(mul, "live", "units.json"), JSON.stringify([entry(1, "Alpha Fighter", 1)]));
            const ours = buildBundledUnits(megamek, mul).builds.fighters.accuracy!.differs[0].ours;
            fs.writeFileSync(path.join(mul, "live", "units.json"), JSON.stringify([entry(1, "Alpha Fighter", ours), entry(2, "Bravo Fighter", ours + 9)]));
            const { builds } = buildBundledUnits(megamek, mul);
            expect(builds.fighters.accuracy).toEqual({
                unitType: "fighters", matched: 1,
                matches: [{ mulId: 1, name: "Alpha Fighter TF-1", bv: ours, tons: 30, tech: "Inner Sphere", rules: "Standard", year: 3025 }],
                differs: [{ mulId: 2, name: "Bravo Fighter TF-1", ours, mul: ours + 9, file: "fighters/b.blk", tons: 30, tech: "Inner Sphere", rules: "Standard", year: 3025 }],
                notChecked: { importFailed: 1, noMulEntry: 1 },
            });
            expect(builds.vehicles.accuracy).toEqual({ unitType: "vehicles", matched: 0, matches: [], differs: [], notChecked: { importFailed: 0, noMulEntry: 0 } });
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 60_000);

    // A bundled fighter converts to Alpha Strike as a saved one does; the MUL's Sabre SB-27 card: AF, size 1, 11a,
    // 2/2/0/0, armor 2, structure 6, threshold 1, 25 points.
    it("converts a bundled fighter to the Master Unit List's Alpha Strike card", async () => {
        const headers = await loadBundledIndex("fighters");
        const sabre = await loadBundledUnitDesign("fighters", headers.find((header) => header.name === "Sabre" && header.model === "SB-27")!) as AerospaceFighter;
        const card = sabre.getAlphaStrikeStats();
        const damage = card.damageValues;
        expect([card.type, card.size, `${card.movement}${card.movementCode}`, damage.short.damage, damage.medium.damage, damage.long.damage, damage.extreme.damage,
            card.armor, card.structure, card.threshold, card.pointValue]).toEqual(["AF", 1, "11a", 2, 2, 0, 0, 2, 6, 1, 25]);
    }, 60_000);

    // #600 round 4c: a bundled platoon converts to Alpha Strike as a saved one does; the MUL's Jump Platoon (Flamer) card:
    // CI, size 1, 4"j, 1/0/0, armor 1, structure 1, 8 points, BV 70.
    it("converts a bundled infantry platoon to the Master Unit List's Alpha Strike card", async () => {
        const headers = await loadBundledIndex("infantry");
        const header = headers.find((entry) => entry.name === "Jump Platoon (Flamer)")!;
        expect(header.bv).toBe(70);
        const platoon = await loadBundledUnitDesign("infantry", header) as InfantryPlatoon;
        const card = platoon.getAlphaStrikeStats();
        const damage = card.damageValues;
        expect([card.type, card.size, `${card.movement}${card.movementCode}`, damage.short.damage, damage.medium.damage, damage.long.damage,
            card.armor, card.structure, card.pointValue]).toEqual(["CI", 1, "4j", 1, 0, 0, 1, 1, 8]);
    }, 60_000);

    it("reads MegaMek's rules levels as Skunk Werks'", () => {
        expect(["IS Level 1", "IS Level 2", "Clan Level 3", "IS Level 4", "IS Level 5"].map(getBlkRulesLevel)).toEqual([0, 1, 2, 3, 4]);
        expect(["Mixed (IS Chassis)", "Mixed (Clan Chassis) Advanced", "Mixed (IS Chassis) Experimental"].map(getBlkRulesLevel)).toEqual([1, 2, 3]);
    });

    for (const type of Object.keys(DESIGNS) as BundledUnitType[]) {
        it(`${type}: every design listed once, in its chunk, and loading at the BV and cost it was built with`, async () => {
            vi.spyOn(console, "log").mockImplementation(() => {});
            vi.spyOn(console, "warn").mockImplementation(() => {});
            const headers = await loadBundledIndex(type);
            expect(headers).toHaveLength(DESIGNS[type]);
            expect(headers.map((header) => header.id)).toEqual(headers.map((_header, index) => index));
            const files = fs.readdirSync(path.join(dataDir, type));
            expect(files).toHaveLength(Math.ceil(DESIGNS[type] / BUNDLED_CHUNK_SIZE));
            const bytes = files.reduce((total, file) => total + fs.statSync(path.join(dataDir, type, file)).size, fs.statSync(path.join(dataDir, `${type}-index.json`)).size);
            expect(bytes).toBeLessThanOrEqual(MAX_BYTES[type]);
            expect(headers.every((header) => header.source === "megamek" && header.mulId)).toBe(true);
            const wrong: string[] = [];
            for (const header of headers) {
                const unit = await loadBundledUnitDesign(type, header);
                const got = { name: unit.getName(), bv: unit.getBattleValue(), cost: unit.getCBillCost() };
                if (JSON.stringify(got) !== JSON.stringify({ name: header.name, bv: header.bv, cost: header.cost })) wrong.push(`${header.name} ${header.model}: ${JSON.stringify(got)}`);
            }
            vi.restoreAllMocks();
            expect(wrong).toEqual([]);
        }, 300_000);
    }

    // NGCFells 2026-11-20: designs that break the construction rules as printed stay, flagged illegal.
    it("flags a bundled Support Vehicle that breaks the construction rules, with what it breaks", async () => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const headers = await loadBundledIndex("support-vehicles");
        const brunel = (model: string) => headers.find((header) => header.name === "Brunel Dump Truck" && header.model === model)?.illegal;
        expect(brunel("(AC)")).toEqual(["34 item slots used of 20 (TM p.120)", "168.5 tons used of 150"]);
        expect(brunel("(LRM)")).toEqual(["24 item slots used of 20 (TM p.120)", "168.5 tons used of 150"]);
        // A Combat Vehicle by its weight and, on an OmniVehicle, its base chassis turret (TM p.108).
        const vehicles = await loadBundledIndex("vehicles");
        expect(vehicles.find((header) => header.name === "Ajax Assault Tank" && header.model === "C")?.illegal).toEqual(["92.5 tons used of 90"]);
        // Only designs checked against their book are flagged, so a fault in our own checks brands nothing; every listed
        // design the bundle keeps is flagged (some listed ones are left out of the bundle, e.g. by BV).
        const all = [...headers, ...vehicles];
        const label = (header: { name: string; model: string }) => `${header.name} ${header.model}`.trim();
        const bundled = new Set(all.map(label));
        expect(all.filter((header) => header.illegal).map(label).sort())
            .toEqual([...BLK_ILLEGAL_AS_PRINTED].filter((name) => bundled.has(name)).sort());
        expect(all.find((header) => header.name === "Estevez MBT" && header.model === "")?.illegal).toEqual(["BAR 8 armor does not exist at Tech Rating C (TM p.134)"]);
        vi.restoreAllMocks();
    }, 300_000);
});
