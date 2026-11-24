import { beforeEach, describe, expect, it } from "vitest";
import { sswTestFixtures } from "../data/ssw/sswTestFixtures";
import { registerLocalCustomContent } from "../data/custom-content-local";
import type { ICustomContentDraft } from "../data/custom-content-types";
import { acceptSSWImport, analyzeSSWImport, MAX_SSW_IMPORT_FILE_BYTES, MAX_SSW_IMPORT_FILES, runSSWImportSession, sswImportLimitError } from "./sswImportSession";
import { guessTonnage, missingAnswers, missingFields } from "./sswDraftBuilder";

const griffin = sswTestFixtures["Griffin GRF-1N"];
const withWidget = griffin.replace(/\(IS\) PPC</, "(IS) Widget Cannon<");
let saved: ICustomContentDraft[] = [];
let evidence: Record<string, string> = {};
const options = () => ({
    existingDrafts: [] as ICustomContentDraft[],
    save: (drafts: ICustomContentDraft[]) => { saved = drafts; registerLocalCustomContent(drafts); return true; },
    saveEvidence: (files: Record<string, string>) => { evidence = files; return true; },
});

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
        expect(evidence[drafts[0].sourceFiles[0].sha256]).toBe(withWidget);
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

// #76: the importer is asked about each unknown item before anything is saved.
describe("SSW import: analyze and accept", () => {
    beforeEach(() => registerLocalCustomContent([]));

    it("analyze gives one question per unknown item with best guesses and saves nothing", async () => {
        let saveCalls = 0;
        const twoUnknown = withWidget.replace(/\(IS\) Medium Laser</, "(IS) Gadget Beam<");
        const spy = { ...options(), save: () => { saveCalls++; return true; } };
        const { questions } = await analyzeSSWImport([{ fileName: "a.ssw", xml: twoUnknown }], spy.existingDrafts);
        expect(saveCalls).toBe(0);
        expect(questions.length).toBeGreaterThanOrEqual(1);
        const widget = questions.find((q) => q.name === "Widget Cannon")!;
        expect(widget.designs).toEqual(["Griffin GRF-1N"]);
        expect(widget.required).toEqual(["techBase", "tons", "slots"]);
        expect(widget.guess.techBase).toBe("is");
        expect(widget.guess.unknown).toEqual({ techBase: false, tons: false, slots: false });
        expect(widget.guess.slots).toBe(8);
        expect(Number.isNaN(widget.guess.tons)).toBe(false);
        expect(widget.guess.tons).toBeGreaterThanOrEqual(0);
    });

    it("two files sharing an unknown item give one question naming both designs", async () => {
        const { questions } = await analyzeSSWImport([
            { fileName: "a.ssw", xml: withWidget },
            { fileName: "b.ssw", xml: withWidget.replace('model="GRF-1N"', 'model="GRF-1X"') },
        ], []);
        expect(questions).toHaveLength(1);
        expect(questions[0].designs).toEqual(["Griffin GRF-1N", "Griffin GRF-1X"]);
    });

    it("an item an earlier import already drafted is not asked about again", async () => {
        const first = await runSSWImportSession([{ fileName: "a.ssw", xml: withWidget }], options());
        const { questions } = await analyzeSSWImport([{ fileName: "c.ssw", xml: withWidget.replace('model="GRF-1N"', 'model="GRF-1Z"') }], first.drafts);
        expect(questions).toHaveLength(0);
    });

    it("accept builds the drafts from the answers; the design then weighs its full tonnage", async () => {
        const analysis = await analyzeSSWImport([{ fileName: "a.ssw", xml: withWidget }], []);
        const q = analysis.questions[0];
        const mech0 = analysis.results[0].mech!;
        const gap = mech0.getTonnage() - mech0.getCurrentTonnage();
        const answers = { [q.key]: { ...q.guess, tons: gap, slots: 3, damage: 10, heat: 4, sourceNote: "from the TRO" } };
        const out = await acceptSSWImport(analysis, answers, options());
        expect(out.drafts).toHaveLength(1);
        expect(out.drafts[0].record.weight).toBe(gap);
        expect((out.drafts[0].record.space as Record<string, unknown>).battlemech).toBe(3);
        expect(out.drafts[0].record.damage).toBe(10);
        expect(out.drafts[0].sourceNote).toBe("from the TRO");
        const mech = out.results[0].mech!;
        expect(mech.getCurrentTonnage()).toBe(mech.getTonnage());
    });

    it("I do not know keeps the guess and marks the field estimated", async () => {
        const analysis = await analyzeSSWImport([{ fileName: "a.ssw", xml: withWidget }], []);
        const q = analysis.questions[0];
        const answers = { [q.key]: { ...q.guess, unknown: { ...q.guess.unknown, tons: true } } };
        const out = await acceptSSWImport(analysis, answers, options());
        expect(out.drafts[0].estimated).toContain("weight");
        expect(missingFields(out.drafts[0])).toContain("estimated:weight");
    });

    it("missingAnswers: a null field is missing unless marked I do not know", async () => {
        const { questions } = await analyzeSSWImport([{ fileName: "a.ssw", xml: withWidget }], []);
        const q = questions[0];
        expect(missingAnswers(q, { ...q.guess, tons: null })).toEqual(["tons"]);
        expect(missingAnswers(q, { ...q.guess, tons: null, unknown: { ...q.guess.unknown, tons: true } })).toEqual([]);
        expect(missingAnswers(q, undefined)).toEqual(["techBase", "tons", "slots"]);
    });

    it("guessTonnage splits the gap, rounds to half a ton and never goes below zero", () => {
        expect(guessTonnage(3, 2)).toBe(1.5);
        expect(guessTonnage(1, 3)).toBe(0.5);
        expect(guessTonnage(0, 2)).toBe(0);
        expect(guessTonnage(-1, 1)).toBe(0);
        expect(guessTonnage(5, 0)).toBe(0);
    });
});

// #76 review fixes.
describe("SSW import: review fixes", () => {
    beforeEach(() => registerLocalCustomContent([]));

    it("I do not know on an emptied field keeps the guess, not a blank", async () => {
        const analysis = await analyzeSSWImport([{ fileName: "a.ssw", xml: withWidget }], []);
        const q = analysis.questions[0];
        const answers = { [q.key]: { ...q.guess, tons: null, unknown: { ...q.guess.unknown, tons: true } } };
        const out = await acceptSSWImport(analysis, answers, options());
        expect(out.drafts[0].record.weight).toBe(q.guess.tons);
        expect(out.drafts[0].estimated).toContain("weight");
    });

    it("tons and slots the importer typed are not marked estimated", async () => {
        const analysis = await analyzeSSWImport([{ fileName: "a.ssw", xml: withWidget }], []);
        const q = analysis.questions[0];
        const answers = { [q.key]: { ...q.guess, tons: 7, slots: 3, edited: { tons: true, slots: true } } };
        const out = await acceptSSWImport(analysis, answers, options());
        expect(out.drafts[0].estimated ?? []).not.toContain("weight");
        expect(out.drafts[0].estimated ?? []).not.toContain("space.battlemech");
        expect(out.drafts[0].slotsEstimated).toBe(false);
        expect(missingFields(out.drafts[0])).not.toContain("estimated:weight");
    });

    it("an unedited guess is still estimated", async () => {
        const analysis = await analyzeSSWImport([{ fileName: "a.ssw", xml: withWidget }], []);
        const q = analysis.questions[0];
        const out = await acceptSSWImport(analysis, { [q.key]: q.guess }, options());
        expect(out.drafts[0].estimated).toEqual(expect.arrayContaining(["weight", "space.battlemech"]));
    });

    it("an ammo bin is guessed at one ton and the weapon gets the rest of the gap", async () => {
        const xml = withWidget.replace(/@ LRM-10</g, "@ Widget Rocket<");
        const analysis = await analyzeSSWImport([{ fileName: "a.ssw", xml }], []);
        const ammo = analysis.questions.find((q) => q.kind === "ammunition")!;
        const weapon = analysis.questions.find((q) => q.name === "Widget Cannon")!;
        expect(ammo.guess.tons).toBe(1);
        const bins = analysis.entries.filter((e) => e.item.kind === "ammunition").length;
        const mech = analysis.results[0].mech!;
        const gap = mech.getTonnage() - mech.getCurrentTonnage();
        expect(weapon.guess.tons).toBe(guessTonnage(gap - bins, 1));
    });
});
