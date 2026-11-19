import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { BUNDLED_CHUNK_SIZE } from "../utils/bundled-designs";
import { buildBundledUnits, getBlkRulesLevel, writeMegaMekCustomRecords } from "./bundled-units-build";
import { BundledUnitType, loadBundledIndex, loadBundledUnitDesign } from "./bundled-units";

// The bundled battle armor, ProtoMechs, Small Craft and DropShips, Support Vehicles (#241 round 2) and Combat
// Vehicles (round 4a). Regenerate
// from MegaMek's unit files with
//   npm run build:bundled -- units
// Each file is imported, its BV checked against the Master Unit List and its round trip through the compact format;
// the designs that pass are written, with a report of the rest (bundled/<type>-report.md).
const dataDir = path.resolve(__dirname, "bundled");

// Pinned so a growing data set is a deliberate change.
const DESIGNS: Record<BundledUnitType, number> = { "battle-armor": 921, "protomechs": 64, "small-craft": 101, "support-vehicles": 91, "vehicles": 1064 };
// Each type's index and chunks together, in bytes, with a little room.
const MAX_BYTES: Record<BundledUnitType, number> = { "battle-armor": 1_360_000, "protomechs": 180_000, "small-craft": 500_000, "support-vehicles": 460_000, "vehicles": 3_380_000 };

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
});
