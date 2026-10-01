import { describe, expect, it } from "vitest";
import { sswMechs } from "../data/ssw/sswMechs";
import { registerLocalCustomContent } from "../data/custom-content-local";
import type { ICustomContentDraft } from "../data/custom-content-types";
import { runSSWImportSession } from "./sswImportSession";

const griffin = sswMechs.find((xml) => /name="Griffin" model="GRF-1N"/.test(xml))!;
const withWidget = griffin.replace(/\(IS\) PPC</, "(IS) Widget Cannon<");
let saved: ICustomContentDraft[] = [];
const options = () => ({ existingDrafts: [] as ICustomContentDraft[], save: (drafts: ICustomContentDraft[]) => { saved = drafts; registerLocalCustomContent(drafts); return true; } });

describe("SSW import session", () => {
    it("a clean file is clean and has our BV and SSW's", async () => {
        const { results } = await runSSWImportSession([{ fileName: "griffin.ssw", xml: griffin }], options());
        expect(results[0]).toMatchObject({ status: "clean", designName: "Griffin GRF-1N" });
        expect(results[0].sswBV2).toBeGreaterThan(0);
        expect(results[0].ourBV).toBeGreaterThan(0);
        expect(results[0].sha256).toMatch(/^[0-9a-f]{64}$/);
    });

    it("a malformed file fails alone", async () => {
        const { results } = await runSSWImportSession([
            { fileName: "broken.ssw", xml: "<mech><unclosed>" },
            { fileName: "notes.ssw", xml: "hello" },
            { fileName: "griffin.ssw", xml: griffin },
        ], options());
        expect(results.map((r) => r.status)).toEqual(["failed", "failed", "clean"]);
        expect(results[0].failureReason).toBeTruthy();
    });

    it("a non-BattleMech design fails with the reason", async () => {
        const industrial = griffin.replace("<mech_type>BattleMech</mech_type>", "<mech_type>IndustrialMech</mech_type>");
        const { results } = await runSSWImportSession([{ fileName: "agro.ssw", xml: industrial }], options());
        expect(results[0]).toMatchObject({ status: "failed" });
        expect(results[0].failureReason).toMatch(/IndustrialMech/);
    });

    it("an unknown weapon becomes one draft, and the design is re-imported with its placeholder", async () => {
        const { results, drafts } = await runSSWImportSession([
            { fileName: "a.ssw", xml: withWidget },
            { fileName: "b.ssw", xml: withWidget.replace('model="GRF-1N"', 'model="GRF-1X"') },
        ], options());
        expect(drafts).toHaveLength(1);
        expect(drafts[0].sourceFiles.map((s) => s.fileName)).toEqual(["a.ssw", "b.ssw"]);
        // SSW stores only the first slot. The estimate runs to the next occupied slot, so on the Griffin it takes
        // the PPC's 3 slots plus the 5 empty ones below them; the user confirms it (slotsEstimated).
        expect((drafts[0].record.space as Record<string, unknown>).battlemech).toBe(8);
        expect(drafts[0].slotsEstimated).toBe(true);
        expect(results.map((r) => r.status)).toEqual(["unresolved", "unresolved"]);
        expect(results[0].draftIds).toEqual([drafts[0].id]);
        expect(drafts[0].sourceXml?.["a.ssw"]).toBe(withWidget);
        expect(JSON.stringify(results[0].mech!.export(true))).toContain(drafts[0].record.tag as string);
        expect(saved).toHaveLength(1);
    });
});
