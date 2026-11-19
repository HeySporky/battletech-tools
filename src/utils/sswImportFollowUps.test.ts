import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { registerLocalCustomContent, toRuntimeRecord } from "../data/custom-content-local";
import type { ICustomContentDraft } from "../data/custom-content-types";
import type { IEquipmentItem } from "../data/data-interfaces";
import { getCompatibleAmmo } from "../data/equipment-registry";
import { sswTestFixtures } from "../data/ssw/sswTestFixtures";
import { buildDrafts } from "./sswDraftBuilder";
import { sha256HexSync } from "./sha256";
import { runSSWImportSession, sha256Hex } from "./sswImportSession";

// Follow-ups from the 2026-09-30 SSW import review (#45).

const pillager = readFileSync("src/utils/__fixtures__/pillager-plg-4x-anvil.ssw", "utf8");
const griffin = sswTestFixtures["Griffin GRF-1N"];
const withWidget = griffin.replace(/\(IS\) PPC</, "(IS) Widget Cannon<");

let saved: ICustomContentDraft[] = [];
let savedEvidence: Record<string, string> = {};
const options = () => ({
    existingDrafts: [] as ICustomContentDraft[],
    save: (drafts: ICustomContentDraft[]) => { saved = drafts; registerLocalCustomContent(drafts); return true; },
    saveEvidence: (evidence: Record<string, string>) => { savedEvidence = evidence; return true; },
});

const quiet = () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
};

describe("SSW import follow-ups (#45)", () => {
    beforeEach(() => { registerLocalCustomContent([]); quiet(); });
    afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

    it("a split item's slots are the counts SSW gives for each location, not an estimate", async () => {
        // The Long Tom is written as 10 slots in a side torso and 5 in its arm, with no main location.
        const xml = pillager.replace(/Long Tom Artillery Cannon</g, "Widget Artillery<");
        const { drafts } = await runSSWImportSession([{ fileName: "pillager.ssw", xml }], options());
        const widget = drafts.find((draft) => draft.record.name === "Widget Artillery")!;
        expect((widget.record.space as Record<string, unknown>).battlemech).toBe(15);
        expect(widget.slotsEstimated).toBe(false);
    });

    it("a design using a draft with stats still unknown says so outside the import screen", async () => {
        const { results, drafts } = await runSSWImportSession([{ fileName: "a.ssw", xml: withWidget }], options());
        const mech = new BattleMech();
        mech.import(results[0].mech!.export());
        expect(mech.getIncompleteCustomStats()).toEqual(["Widget Cannon"]);

        // Once every stat is entered and the draft is marked complete, the warning goes.
        const done = JSON.parse(JSON.stringify(drafts[0])) as ICustomContentDraft;
        Object.assign(done.record, { weight: 7, battleValue: 176, cbills: 200000, introduced: 3050, damage: 10, heat: 10 });
        done.record.range = { ...(done.record.range as object), short: 6, medium: 12, long: 18 };
        (done.record.space as Record<string, unknown>) = Object.fromEntries(
            Object.keys(done.record.space as object).map((key) => [key, key === "battlemech" ? 3 : 1]));
        Object.assign(done, { status: "complete", slotsEstimated: false });
        registerLocalCustomContent([done]);
        expect(mech.getIncompleteCustomStats()).toEqual([]);
    });

    it("two different files with the same name keep their own hash and text", async () => {
        const other = withWidget.replace('model="GRF-1N"', 'model="GRF-1X"');
        const { drafts } = await runSSWImportSession([
            { fileName: "griffin.ssw", xml: withWidget },
            { fileName: "griffin.ssw", xml: other },
        ], options());
        const [first, second] = drafts[0].sourceFiles;
        expect(drafts[0].sourceFiles).toHaveLength(2);
        expect(first.sha256).not.toBe(second.sha256);
        expect(savedEvidence[first.sha256]).toBe(withWidget);
        expect(savedEvidence[second.sha256]).toBe(other);
    });

    it("a file's text is stored once, beside the drafts, however many drafts it makes", async () => {
        const xml = withWidget.replace(/\(IS\) LRM-10</, "(IS) Widget Launcher<");
        const { drafts } = await runSSWImportSession([{ fileName: "a.ssw", xml }], options());
        expect(drafts.map((draft) => draft.record.name).sort()).toEqual(["Widget Cannon", "Widget Launcher"]);
        expect(JSON.stringify(saved)).not.toContain("<mech");
        expect(Object.values(savedEvidence)).toEqual([xml]);
    });

    it("an ammo draft feeds the weapon draft it is named for", async () => {
        const xml = griffin.replace(/\(IS\) LRM-10</, "(IS) Widget Launcher<").replace(/\(IS\) @ LRM-10</g, "(IS) @ Widget Launcher<");
        const { drafts } = await runSSWImportSession([{ fileName: "a.ssw", xml }], options());
        const weapon = drafts.find((draft) => draft.kind === "equipment")!;
        const ammo = drafts.find((draft) => draft.kind === "ammunition")!;
        expect(getCompatibleAmmo(toRuntimeRecord<IEquipmentItem>(weapon.record), toRuntimeRecord<IEquipmentItem>(ammo.record))).toBe(true);
        expect(results0Placed(xml)).toBe(true);
    });

    it("hashes and new draft ids work without a secure origin (LAN dev over http)", async () => {
        vi.stubGlobal("crypto", { getRandomValues: <T extends ArrayBufferView>(array: T) => array });
        expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        expect(await sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        const drafts = buildDrafts([{
            item: { kind: "equipment", name: "Widget", sswName: "Widget", faction: "is", sswType: "energy", location: "ra", slotIndex: 0, splitLocations: [], tons: null },
            slots: 1, design: "Test", source: { fileName: "a.ssw", designs: ["Test"], sha256: "x" },
        }], []);
        expect(drafts[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it("the script hash matches Node's on whole .ssw files, including non-ASCII text", () => {
        for (const text of [griffin, pillager, "Énergie — 'Mech", "x".repeat(55), "x".repeat(56), "x".repeat(64)]) {
            expect(sha256HexSync(text)).toBe(createHash("sha256").update(text, "utf8").digest("hex"));
        }
    });
});

// The weapon draft's ammo shows up as its ammo in the design: the bins are counted for it.
function results0Placed(xml: string): boolean {
    const mech = new BattleMech();
    mech.importSSWXML(xml);
    const weapon = mech.getInstalledEquipment().find((item) => item.name === "Widget Launcher");
    const ammo = mech.getInstalledEquipment().find((item) => item.isAmmo && /Widget Launcher/.test(item.name));
    return !!weapon && !!ammo && getCompatibleAmmo(weapon, ammo);
}
