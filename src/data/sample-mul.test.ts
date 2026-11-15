import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { IASMULUnit } from "../classes/alpha-strike-unit";
import { buildArtVeeMULRecords, buildSampleMULRecords, buildVTOLAMMULRecords } from "./sample-mul";
import { ARTVEE_SAMPLES } from "./artvee-samples";
import { VTOLAM_SAMPLES } from "./vtolam-samples";
import { loadMULListItems } from "./mul-list-items";
import { CUSTOM_MUL_FILE_PATH, mergeCustomMULEntries } from "./custom-mul";
import { untabulate } from "../utils/packed-json";

// The creators' sample units ride in the shared custom unit list (#376). Regenerate after changing a sample:
//   WRITE_SAMPLE_MUL=1 npx vitest run --project unit src/data/sample-mul.test.ts
const listPath = path.resolve(__dirname, "..", "..", CUSTOM_MUL_FILE_PATH);

describe("Sample units in the custom unit list", () => {
    const built = buildSampleMULRecords();

    if (process.env.WRITE_SAMPLE_MUL) {
        fs.writeFileSync(listPath, mergeCustomMULEntries(fs.readFileSync(listPath, "utf8"), built));
    }

    it("carries every sample with the stats its creator converts to", () => {
        const list = untabulate(JSON.parse(fs.readFileSync(listPath, "utf8"))) as IASMULUnit[];
        expect(built).toHaveLength(ARTVEE_SAMPLES.length + VTOLAM_SAMPLES.length);
        for (const record of built) {
            expect(list.find((entry) => entry.MulUnitKey === record.MulUnitKey)).toEqual(record);
        }
        expect(new Set(built.map((record) => record.Id)).size).toBe(built.length);
    });

    it("loads them only when Custom units is ticked", async () => {
        const key = built[0].MulUnitKey;
        expect((await loadMULListItems(["custom"])).some((unit) => unit.MulUnitKey === key)).toBe(true);
        expect((await loadMULListItems(["mul2", "mul1"])).some((unit) => unit.MulUnitKey === key)).toBe(false);
    }, 30_000);
});

describe("ArtVees in the custom unit list", () => {
    const built = buildArtVeeMULRecords();

    it("gives each one a real card: a vehicle with a point value, movement and an era", () => {
        for (const record of built) {
            expect(record.Type.Id).toBe(19);
            expect(record.BFPointValue).toBeGreaterThan(0);
            expect(record.BFMove).toMatch(/^\d+"[a-z]+/);
            expect(record.EraId).toBeGreaterThan(0);
        }
    });

    // The MUL prints minimal indirect fire as IF0* and leaves out a rear arc with no damage; it never shows IF0 or
    // REAR-/-/-, which the conversion gave the Archerfish and the rear-searchlight ArtVees.
    it("writes their specials the way the MUL does", () => {
        for (const record of built) {
            const codes = (record.BFAbilities ?? "").split(",");
            expect(codes).not.toContain("IF0");
            expect(codes.some((code) => /^REAR-(\/-)*$/.test(code))).toBe(false);
        }
        expect(built.find((record) => record.Name === "Archerfish ArtVee")?.BFAbilities?.split(",")).toContain("IF0*");
    });
});

describe("VTOLAMs in the custom unit list (#376)", () => {
    const built = buildVTOLAMMULRecords();

    it("gives each one a real card: a 'Mech with a point value, movement, TMM and an era", () => {
        for (const record of built) {
            expect(record.Type.Id).toBe(18);
            expect(record.Name).toMatch(/^\S.* VTOLAM$/);
            expect(record.BFPointValue).toBeGreaterThan(0);
            expect(record.BFMove).toMatch(/^\d+"/);
            expect(record.BFTMM).toBeGreaterThan(0);
            expect(record.EraId).toBeGreaterThan(0);
            expect(record.BFAbilities ?? "").not.toMatch(/\s/);
            // No empty damage specials (#378): IF0, SRM0/0/0, HEAT0/0/0.
            expect((record.BFAbilities ?? "").split(",").filter((code) => /^IF0$|^\w+0\/0(\/0)*$/.test(code))).toEqual([]);
        }
    });

    it("credits the designer of each one", () => {
        expect(built.find((record) => record.Variant === "LCT-XX")?.CustomInfo?.author).toBe("BishopSteiner");
        expect(built.filter((record) => record.CustomInfo?.author === "professorheyteen")).toHaveLength(VTOLAM_SAMPLES.length - 1);
    });

    // A Medium Laser is 0.5 at short and medium range, which rounds up to 1, not 0* (Converting Heat errata v1.3; the
    // MUL Locust's card is 1/1/0). Fixed with the 'Mech heat step (#636).
    it("rounds a half point up to 1, not 0*", () => {
        const locust = built.find((record) => record.Variant === "LCT-XX")!;
        expect([locust.BFDamageShort, locust.BFDamageMedium]).toEqual([1, 1]);
        expect(locust.BFDamageShortMin).toBeFalsy();
        expect(locust.BFDamageMediumMin).toBeFalsy();
    });
});
