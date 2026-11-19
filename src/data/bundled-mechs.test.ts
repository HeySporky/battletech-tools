import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { BUNDLED_CHUNK_SIZE } from "../utils/bundled-designs";
import { getBundledMechEntries, loadBundledMechDesign, loadBundledMechIndex } from "./bundled-mechs";

// The bundled 'Mechs (#241). Regenerate from the Skunk Werks, MegaMek and mordel.net files:
//   npm run build:bundled
// (src/data/bundled-build-runner.ts: every core, cached per file). The build imports every file, checks its BV against
// the Master Unit List (or the file) and its round trip through the compact format, and writes the designs that pass
// plus a report of the rest (bundled/mechs-report.md). A different submodel of a kept design is renamed by mordel.net's
// canon list (mordel/canon-mechs.csv, refreshed with ~/.claude/tools/mordel_canon_csv.py for BattleMech and
// IndustrialMech).
const dataDir = path.resolve(__dirname, "bundled");

// Pinned so a growing data set is a deliberate change.
// #595 added 127 MegaMek 'Mechs the MUL lacks, filed in the custom unit list at our own BV.
// Prototype endo steel and ferro-fibrous brought in the Jenner JR7-K (Grace) (#109).
// The corrected SSW Skinwalker B (#607) is a configuration of the SSW Skinwalker, not its own MegaMek record.
// Fourteen MegaMek files came to match the list once machine gun arrays, mixed launcher sizes and torpedo launchers
// with Artemis IV were read and valued by the rules (#599).
const DESIGNS = 3703;
// The table format with values shared per chunk (#241 follow-up) took it from 18.4 MB to 8.7 MB, read a chunk at a time.
const MAX_BYTES = 9_000_000;

describe("bundled 'Mechs", () => {
    it("list every design once, each in its chunk, at the pinned count and size", async () => {
        const headers = await loadBundledMechIndex();
        expect(headers).toHaveLength(DESIGNS);
        expect(headers.map((header) => header.id)).toEqual(headers.map((_header, index) => index));
        const files = fs.readdirSync(path.join(dataDir, "mechs"));
        expect(files).toHaveLength(Math.ceil(DESIGNS / BUNDLED_CHUNK_SIZE));
        const bytes = files.reduce((total, file) => total + fs.statSync(path.join(dataDir, "mechs", file)).size, fs.statSync(path.join(dataDir, "mechs-index.json")).size);
        expect(bytes).toBeLessThanOrEqual(MAX_BYTES);
        const keys = getBundledMechEntries(headers).map((entry) => (entry.chassis + " " + entry.model).toLowerCase());
        expect(new Set(keys).size).toBe(keys.length);
    });

    // Checked against the corrected MUL BV where the live MUL's is stale (#354).
    it("keep the IndustrialMechs whose live MUL BV is stale, at the corrected BV", async () => {
        const headers = await loadBundledMechIndex();
        const bv = (mulId: number) => headers.find((header) => header.mulId === mulId)?.bv;
        expect([103087, 107159, 108513, 100674, 106363].map(bv)).toEqual([352, 250, 350, 680, 826]);
        // #371: Nail/Rivet Gun ammo at 0 BV (TM p.317) and commercial armor at half (TM p.315).
        expect([102180, 101073, 100319].map(bv)).toEqual([1227, 1234, 73]);
        // #171: Command Console designs at their record sheets' BV.
        expect([100143, 104760, 108066].map(bv)).toEqual([954, 1091, 2278]);
        // #109: the Recognition Guide: ilClan Vol. 24 sheet prints 3,107 for the Skinwalker E (live MUL 3102).
        expect(headers.find((header) => header.mulId === 103438)?.configs?.find((config) => config.name === "E")?.bv).toBe(3107);
        // MegaMek files with no cockpit line whose record sheets have a plain Industrial cockpit (no AFC).
        const byModel = (model: string) => headers.find((header) => header.model === model)?.bv;
        expect(["QUA-51T MilitiaMech", "HYN-4A SalvageMech", "HYN-4B SalvageMech"].map(byModel)).toEqual([670, 474, 398]);
    });

    // MegaMek's superheavy tripods (#241): the Ares OmniMechs load as tripods over 100 tons.
    it("keep the Ares superheavy tripods", async () => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        const ares = (await loadBundledMechIndex()).filter((header) => header.name === "Ares");
        expect(ares.length).toBeGreaterThanOrEqual(5);
        const mech = await loadBundledMechDesign(ares[0]);
        vi.restoreAllMocks();
        expect([mech.isTripod(), mech.isSuperheavy(), mech.getBattleValue()]).toEqual([true, true, ares[0].bv]);
    });

    // The build checked every design; a sample here catches an import or Battle Value change that needs a rebuild.
    it("load at the Battle Value, cost and tonnage they were built with (every 10th design)", async () => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const headers = await loadBundledMechIndex();
        const wrong: string[] = [];
        for (const header of headers.filter((_header, index) => index % 10 === 0)) {
            const mech = await loadBundledMechDesign(header);
            const got = { name: mech.getChassisName() + " " + mech.getModelName(), bv: mech.getBattleValue(), cost: mech.getCBillCostNumeric(), tons: mech.getTonnage() };
            const want = { name: header.name + " " + header.model, bv: header.bv, cost: header.cost, tons: header.tons };
            if (JSON.stringify(got) !== JSON.stringify(want)) wrong.push(`${want.name}: ${JSON.stringify(got)}`);
        }
        vi.restoreAllMocks();
        expect(wrong).toEqual([]);
    }, 300_000);
});
