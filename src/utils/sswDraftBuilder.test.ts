import { describe, expect, it } from "vitest";
import type { ISSWUnresolvedItem } from "../data/custom-content-types";
import { blankTemplate, buildDrafts, estimateSlots, missingFields, targetCatalogFor } from "./sswDraftBuilder";

const item = (overrides: Partial<ISSWUnresolvedItem> = {}): ISSWUnresolvedItem => ({
    kind: "equipment", name: "Widget Cannon", sswName: "(IS) Widget Cannon", faction: "is", sswType: "energy",
    location: "ra", slotIndex: 4, splitLocations: [], tons: null, ...overrides,
});
const source = (fileName: string) => ({ fileName, designs: [fileName.replace(".ssw", "")], sha256: "abc" });
let n = 0;
const newId = () => `id${++n}`;

describe("SSW draft builder", () => {
    it("estimates slots up to the next occupied slot", () => {
        expect(estimateSlots(4, [true, true, true, true, false, false, false, true])).toBe(3);
        expect(estimateSlots(10, Array(12).fill(false))).toBe(2);
        expect(estimateSlots(-1, [])).toBe(1);
    });

    it("picks the custom catalog by kind and SSW type", () => {
        expect(targetCatalogFor("equipment", "energy")).toBe("mech-custom-equipment-weapons-energy");
        expect(targetCatalogFor("equipment", "ballistic")).toBe("mech-custom-equipment-weapons-ballistic");
        expect(targetCatalogFor("equipment", "missile")).toBe("mech-custom-equipment-weapons-missile");
        expect(targetCatalogFor("equipment", "physical")).toBe("mech-custom-equipment-weapons-misc");
        expect(targetCatalogFor("ammunition", "ammunition")).toBe("mech-custom-ammo");
        expect(targetCatalogFor("armor", "armor")).toBe("mech-custom-armor-types");
    });

    it("templates follow the target catalog's first entry with every value unknown", () => {
        const template = blankTemplate("ammunition", "mech-custom-ammo");
        expect(Object.keys(template).slice(0, 3)).toEqual(["isAmmo", "isSpecialAmmo", "name"]);
        expect(template.battleValue).toBeNull();
        expect(template.name).toBe("");
    });

    it("builds a placeholder draft from the file's facts", () => {
        const [draft] = buildDrafts([{ item: item({ tons: 7 }), slots: 3, design: "Griffin GRF-1N", source: source("griffin.ssw") }], [], newId);
        expect(draft).toMatchObject({ kind: "equipment", faction: "is", targetCatalogId: "mech-custom-equipment-weapons-energy", status: "draft", slotsEstimated: true });
        expect(draft.record).toMatchObject({ name: "Widget Cannon", tag: "local-is-widget-cannon", altNames: ["Widget Cannon"], weight: 7, book: "Custom", introduced: null });
        expect((draft.record.space as Record<string, unknown>).battlemech).toBe(3);
        expect((draft.record.space as Record<string, unknown>).protomech).toBeNull();
    });

    it("merges a name shared by two designs", () => {
        const drafts = buildDrafts([
            { item: item(), slots: 3, design: "A", source: source("a.ssw") },
            { item: item({ name: "widget cannon" }), slots: 3, design: "B", source: source("b.ssw") },
        ], [], newId);
        expect(drafts).toHaveLength(1);
        expect(drafts[0].sourceFiles.map((s) => s.fileName)).toEqual(["a.ssw", "b.ssw"]);
    });

    it("reuses an existing draft", () => {
        const first = buildDrafts([{ item: item(), slots: 3, design: "A", source: source("a.ssw") }], [], newId);
        const second = buildDrafts([{ item: item(), slots: 3, design: "B", source: source("b.ssw") }], first, newId);
        expect(second).toHaveLength(1);
        expect(second[0].id).toBe(first[0].id);
        expect(second[0].sourceFiles).toHaveLength(2);
    });

    it("keeps IS and Clan items with one name apart", () => {
        expect(buildDrafts([
            { item: item(), slots: 3, design: "A", source: source("a.ssw") },
            { item: item({ faction: "clan" }), slots: 3, design: "B", source: source("b.ssw") },
        ], [], newId)).toHaveLength(2);
    });

    it("skips canon-pending names and cockpits", () => {
        expect(buildDrafts([{ item: item({ kind: "cockpit", name: "Torso-Mounted Cockpit" }), slots: 1, design: "A", source: source("a.ssw") }], [], newId)).toEqual([]);
    });

    it("ammunition gets an ammo tag and no slots field requirement", () => {
        const [draft] = buildDrafts([{ item: item({ kind: "ammunition", name: "Ammo (Widget Cannon)", sswType: "ammunition" }), slots: 1, design: "A", source: source("a.ssw") }], [], newId);
        expect(draft.record.tag).toBe("ammo-local-is-widget-cannon-standard");
        expect(draft.record.isAmmo).toBe(true);
        expect(missingFields(draft)).not.toContain("space.battlemech");
    });

    it("lists the missing required fields, the estimated slots and unset domain legality", () => {
        const [draft] = buildDrafts([{ item: item(), slots: 3, design: "A", source: source("a.ssw") }], [], newId);
        const missing = missingFields(draft);
        expect(missing).toEqual(expect.arrayContaining(["weight", "damage", "heat", "battleValue", "cbills", "introduced", "slotsEstimated", "space.protomech"]));
        expect(missing).not.toContain("space.battlemech");
    });

    // Ammo model: only a weapon's standard round has isSpecialAmmo false, and its tag ends in -standard.
    it("an ammo draft named for a special round is special ammunition", () => {
        const [draft] = buildDrafts([{ item: item({ kind: "ammunition", name: "Ammo (Widget Cannon Swarm)", sswType: "ammunition" }), slots: 1, design: "A", source: source("a.ssw") }], [], newId);
        expect(draft.record.tag).toBe("ammo-local-is-widget-cannon-swarm");
        expect(draft.record.isSpecialAmmo).toBe(true);
    });
});
