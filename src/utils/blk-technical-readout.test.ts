import { describe, expect, it } from "vitest";
import { parseBlkFile } from "./blk-file";
import { readBlkTechnicalReadout } from "./blk-technical-readout";

// The fluff blocks MegaMek writes into a unit file (TRO fields round 2, #78; spec "BLK import").
const FLUFF = [
    "<UnitType>",
    "BattleArmor",
    "</UnitType>",
    "<overview>",
    "<p>The Elemental is the Clans' first battle armor.</p><p>It set the pattern for every suit after it.</p>",
    "</overview>",
    "<capabilities>",
    "Strong &amp; fast, with a <b>battle claw</b>.",
    "</capabilities>",
    "<deployment>",
    "Every Clan touman.",
    "</deployment>",
    "<history>",
    "<p>",
    "First fielded in 2868.",
    "</p>",
    "<p>",
    "Feared in the Inner Sphere from 3050.",
    "</p>",
    "</history>",
    "<notes>",
    "Line one.<br>Line two.",
    "</notes>",
    "<manufacturer>",
    "Olivetti Weaponry",
    "</manufacturer>",
    "<primaryFactory>",
    "Sudeten",
    "</primaryFactory>",
    "<systemManufacturers>",
    "CHASSIS:Olivetti",
    "ENGINE:Unknown",
    "ARMOR:Ceres Arms",
    "JUMP_JET:Hellespont",
    "COMMUNICATIONS:Garret",
    "TARGETING:Dalban",
    "</systemManufacturers>",
    "<systemModels>",
    "CHASSIS:Type 1",
    "ARMOR:Standard",
    "TARGETING:HiRez",
    "</systemModels>",
].join("\n");

describe("readBlkTechnicalReadout", () => {
    it("reads the production fields, component makes and text sections of a MegaMek unit file", () => {
        const tro = readBlkTechnicalReadout(parseBlkFile(FLUFF)!);
        expect(tro.production).toEqual({ manufacturer: "Olivetti Weaponry", primaryFactory: "Sudeten", communications: "Garret", targeting: "Dalban HiRez" });
        expect(tro.components).toEqual({ chassis: "Olivetti Type 1", armor: "Ceres Arms Standard", jumpJets: "Hellespont" });
        expect(tro.text).toEqual({
            overview: "The Elemental is the Clans' first battle armor.\n\nIt set the pattern for every suit after it.",
            capabilities: "Strong & fast, with a battle claw.",
            deployment: "Every Clan touman.",
            battleHistory: "First fielded in 2868.\n\nFeared in the Inner Sphere from 3050.",
            notes: "Line one.\nLine two.",
        });
    });

    it("gives an empty record for a file with no fluff", () => {
        expect(readBlkTechnicalReadout(parseBlkFile("<UnitType>\nBattleArmor\n</UnitType>")!)).toEqual({});
    });

    it("keeps a model with no manufacturer, and skips lines with no type", () => {
        const tro = readBlkTechnicalReadout(parseBlkFile("<systemModels>\nENGINE:Fusion 20\nnonsense\n:Bare\n</systemModels>")!);
        expect(tro).toEqual({ components: { engine: "Fusion 20" } });
    });
});

describe("parseBlkFile and text markup", () => {
    it("keeps a line holding only paragraph markup inside its block", () => {
        const file = parseBlkFile("<history>\n<p>\nOne.\n</p>\n</history>\n<Name>\nElemental\n</Name>")!;
        expect(file.blocks.history).toEqual(["<p>", "One.", "</p>"]);
        expect(file.blocks.p).toBeUndefined();
        expect(file.blocks.name).toEqual(["Elemental"]);
    });
});
