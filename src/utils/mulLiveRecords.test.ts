import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AlphaStrikeUnit, IASMULUnit } from "../classes/alpha-strike-unit";
import { untabulate } from "./packed-json";

// The shipped live MUL records (src/data/mul/live) once had no BFThreshold, Rules or ImageUrl (#48).
const liveDir = "src/data/mul/live";
const liveRecords: IASMULUnit[] = readdirSync(liveDir).filter((file) => file.endsWith(".json"))
    .flatMap((file) => untabulate(JSON.parse(readFileSync(`${liveDir}/${file}`, "utf8"))) as IASMULUnit[]);
const find = (name: string, variant: string | null) => liveRecords.find((record) => record.Name === name && record.Variant === variant)!;

describe("the shipped live MUL records", () => {
    it("give an aerospace fighter its armor threshold, out of its special abilities", () => {
        const unit = new AlphaStrikeUnit();
        unit.importMUL(find("Lucifer", "LCF-R16"));
        expect(unit.threshold).toBe(2);
        expect(unit.abilities).not.toContain("TH 2");
        expect(unit.abilities).toContain("VSTOL");
    });

    it("keep the rules level, TRO and image of the legacy record they replaced", () => {
        const record = find("Lucifer", "LCF-R16");
        expect(record.Rules).toBe("Standard");
        expect(record.ImageUrl).toMatch(/^https:\/\//);
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        expect(unit.imageURL).toBe(record.ImageUrl);
        expect(unit.rulesLevel).toBe(2);
    });

    it("leave no threshold in any record's abilities", () => {
        expect(liveRecords.filter((record) => /(^|,)\s*TH\s*\d/.test(record.BFAbilities ?? "")).map((record) => record.Name)).toEqual([]);
        expect(liveRecords.every((record) => typeof record.BFThreshold === "number")).toBe(true);
    });

    // #32: every large craft's damage by firing arc, read off its MUL card back.
    it("give every large craft its arcs, as its MUL card back prints them", () => {
        const largeCraft = liveRecords.filter((record) => ["SC", "DS", "DA", "JS", "WS", "SS"].includes(record.BFType ?? ""));
        expect(largeCraft.length).toBe(437);
        expect(largeCraft.filter((record) => !record.BFArcs).map((record) => record.Name)).toEqual([]);
        const changedOnImport = largeCraft.filter((record) => {
            const unit = new AlphaStrikeUnit();
            unit.importMUL(record);
            // An unarmed craft's card back is blank: {} on the record, no card back in the app.
            const expected = Object.keys(record.BFArcs ?? {}).length === 0 ? null : record.BFArcs;
            return JSON.stringify(unit.arcs) !== JSON.stringify(expected);
        });
        expect(changedOnImport.map((record) => record.Name)).toEqual([]);
        const thera = new AlphaStrikeUnit();
        thera.importMUL(find("Thera Carrier", null));
        expect(thera.arcs?.front).toEqual({ std: ["82", "79", "33", ""], cap: ["187", "187", "187", "17"], msl: ["4", "4", "4", "4"], spe: "PNT12, FLK4/4/4/-" });
        const isegrim = new AlphaStrikeUnit();
        isegrim.importMUL(find("Isegrim Assault DropShip", null));
        expect(isegrim.arcs?.rear).toEqual({ std: ["24", "20", "17", "3"], spe: "PNT2, FLK8/7/7/-" });
    });
});
