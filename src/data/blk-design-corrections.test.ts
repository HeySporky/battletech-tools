import { describe, expect, it } from "vitest";
import { importSupportVehicleBlk } from "../classes/vehicle-blk";
import { blkLines, blkValue, parseBlkFile } from "../utils/blk-file";
import { BLK_DESIGN_CORRECTIONS } from "./blk-design-corrections";

const block = (tag: string, ...lines: string[]): string[] => [`<${tag}>`, ...lines, `</${tag}>`];

// The shape of MegaMek's Operation Klondike Brunel file (made-up armor spread); the correction gives it the book's
// armor: standard (BAR 10) at Tech Rating D on an Armored chassis.
const brunel = (model: string) => [
    ...block("UnitType", "LargeSupportTank"), ...block("Name", "Brunel Dump Truck"), ...block("Model", model), ...block("year", "2801"),
    ...block("type", "IS Level 3"), ...block("motion_type", "Wheeled"), ...block("cruiseMP", "3"), ...block("engine_type", "1"),
    ...block("armor_type", "47"), ...block("armor_tech_rating", "2"), ...block("barrating", "6"), ...block("armor", "21", "21", "21", "28", "28", "33"),
    ...block("Body Equipment", "ISOffRoadChassis"), ...block("structural_tech_rating", "3"), ...block("engine_tech_rating", "3"), ...block("tonnage", "150.0"),
].join("\n");

describe("MegaMek file corrections", () => {
    it("names its source for each corrected file", () => {
        for (const [name, correction] of Object.entries(BLK_DESIGN_CORRECTIONS)) {
            expect(correction.source, name).not.toBe("");
            expect(Object.keys(correction.blocks).every((tag) => tag === tag.toLowerCase()), name).toBe(true);
        }
    });

    it("replaces the corrected blocks when the file is read, and leaves other files alone", () => {
        const corrected = parseBlkFile(brunel("(AC)"))!;
        expect([blkValue(corrected, "barrating"), blkValue(corrected, "armor_type"), blkValue(corrected, "armor_tech_rating")]).toEqual(["10", "0", "3"]);
        expect(blkLines(corrected, "body equipment")).toContain("ArmoredChassis");
        const other = parseBlkFile(brunel("(Other)"))!;
        expect([blkValue(other, "barrating"), blkValue(other, "armor_tech_rating")]).toEqual(["6", "2"]);
    });

    // Historical: Operation Klondike: "some nine and a half tons of standard armor", 152 points.
    it("builds the armed Brunels with BAR 10 armor that exists and weighs", () => {
        for (const model of ["(AC)", "(LRM)"]) {
            const vehicle = importSupportVehicleBlk(brunel(model)).vehicle!;
            expect(vehicle.getBAR(), model).toBe(10);
            expect(vehicle.getSupportVehicleArmorKgPerPoint(), model).toBe(63);
            expect(vehicle.getArmorWeight(), model).toBe(10);
            expect(vehicle.getSupportVehicleIssues().filter((issue) => /BAR|armor/i.test(issue)), model).toEqual([]);
        }
    });
});
