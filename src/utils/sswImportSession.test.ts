import { beforeEach, describe, expect, it } from "vitest";
import { sswMechs } from "../data/ssw/sswMechs";
import { registerLocalCustomContent } from "../data/custom-content-local";
import type { ICustomContentDraft } from "../data/custom-content-types";
import { MAX_SSW_IMPORT_FILE_BYTES, MAX_SSW_IMPORT_FILES, runSSWImportSession, sswImportLimitError } from "./sswImportSession";

const griffin = sswMechs.find((xml) => /name="Griffin" model="GRF-1N"/.test(xml))!;
const withWidget = griffin.replace(/\(IS\) PPC</, "(IS) Widget Cannon<");
let saved: ICustomContentDraft[] = [];
const options = () => ({ existingDrafts: [] as ICustomContentDraft[], save: (drafts: ICustomContentDraft[]) => { saved = drafts; registerLocalCustomContent(drafts); return true; } });

describe("SSW import session", () => {
    beforeEach(() => registerLocalCustomContent([]));

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
        // Review finding: SSW files don't give an item's tons, so the placeholder weighs 0; say so.
        expect(results[0].warnings.join(" ")).toMatch(/placeholders count as 0 tons/);
    });

    // Review finding: once a draft is registered, its name resolves, so a later import that uses it showed "Clean",
    // lost the incomplete-stats warning and never recorded the new design on the draft.
    it("a later import that uses an existing draft still reports the placeholder", async () => {
        const first = await runSSWImportSession([{ fileName: "a.ssw", xml: withWidget }], options());
        const { results, drafts } = await runSSWImportSession([{ fileName: "c.ssw", xml: withWidget.replace('model="GRF-1N"', 'model="GRF-1Z"') }],
            { ...options(), existingDrafts: first.drafts });
        expect(drafts).toHaveLength(1);
        expect(results[0].status).toBe("unresolved");
        expect(results[0].draftIds).toEqual([first.drafts[0].id]);
        expect(drafts[0].sourceFiles.map((s) => s.fileName)).toEqual(["a.ssw", "c.ssw"]);
    });

    // Review finding: an engine or armor draft has unknown (0) stats, so the setter refused it and the design
    // quietly fell back to Standard on every later import. It is reported instead.
    it("a component draft the design can't use yet is still reported", async () => {
        const xml = griffin.replace("<type>Standard Armor</type>", "<type>Widget Armor</type>").replace(">Fusion Engine</engine>", ">Widget Engine</engine>");
        const first = await runSSWImportSession([{ fileName: "a.ssw", xml }], options());
        expect(first.drafts.map((d) => d.kind).sort()).toEqual(["armor", "engine"]);
        const { results, drafts } = await runSSWImportSession([{ fileName: "b.ssw", xml }], { ...options(), existingDrafts: first.drafts });
        expect(drafts).toHaveLength(2);
        expect(results[0].status).toBe("unresolved");
        expect(results[0].unresolved.map((item) => item.kind).sort()).toEqual(["armor", "engine"]);
        expect(results[0].warnings.join(" ")).not.toMatch(/Widget/);
    });
});

// A whole batch is read into memory and kept in the review screen, so a mis-drop (a folder of archives, a video)
// has to be refused before any file is read.
describe("SSW import limits", () => {
    const file = (name: string, size: number) => ({ name, size });

    it("accepts a batch within both limits", () => {
        const batch = Array.from({ length: MAX_SSW_IMPORT_FILES }, (_, index) => file(`m${index}.ssw`, MAX_SSW_IMPORT_FILE_BYTES));
        expect(sswImportLimitError(batch)).toBeNull();
    });

    it("refuses more files than the limit and says how many were dropped", () => {
        const batch = Array.from({ length: MAX_SSW_IMPORT_FILES + 1 }, (_, index) => file(`m${index}.ssw`, 10));
        expect(sswImportLimitError(batch)).toContain(String(MAX_SSW_IMPORT_FILES + 1));
    });

    it("refuses a file over the size limit and names it", () => {
        expect(sswImportLimitError([file("ok.ssw", 10), file("huge.ssw", MAX_SSW_IMPORT_FILE_BYTES + 1)])).toContain("huge.ssw");
    });
});
