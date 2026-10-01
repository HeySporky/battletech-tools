// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { findImportedEquipment } from "../utils/importedEquipment";
import type { ICustomContentDraft } from "./custom-content-types";
import { getLocalCustomContentDrafts, registerLocalCustomContent, saveLocalCustomContentDrafts, toRuntimeRecord } from "./custom-content-local";
import { getEquipmentListByTech } from "./equipment-registry";
import { mechCustomEquipmentMisc } from "./mech-custom-equipment-weapons-misc";

const draft = (overrides: Partial<ICustomContentDraft> = {}): ICustomContentDraft => ({
    id: "d1",
    kind: "equipment",
    faction: "is",
    targetCatalogId: "mech-custom-equipment-weapons-misc",
    record: { ...JSON.parse(JSON.stringify(mechCustomEquipmentMisc[0])), name: "Widget Array", tag: "local-is-widget-array", altNames: ["Widget Array"], altTags: [], battleValue: null, book: "Custom" },
    status: "draft",
    slotsEstimated: true,
    sourceFiles: [],
    sourceNote: "",
    ...overrides,
});

const installedTags = (mech: BattleMech) => mech.getInstalledEquipment().map((item) => item.tag);

afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    registerLocalCustomContent([]);
    vi.restoreAllMocks();
});

describe("local custom content", () => {
    it("round-trips drafts through localStorage", () => {
        expect(saveLocalCustomContentDrafts([draft()])).toBe(true);
        expect(getLocalCustomContentDrafts().map((d) => d.id)).toEqual(["d1"]);
    });

    it("save returns false when storage throws", () => {
        vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => { throw new Error("quota"); } });
        expect(saveLocalCustomContentDrafts([draft()])).toBe(false);
    });

    it("reads an empty list from corrupt storage", () => {
        localStorage.setItem("localCustomContent", "{not json");
        expect(getLocalCustomContentDrafts()).toEqual([]);
    });

    // Review finding: one malformed stored draft ([null], or a record without a name) broke app startup and every
    // later equipment lookup. Malformed entries are dropped on load.
    it("drops malformed stored drafts", () => {
        localStorage.setItem("localCustomContent", JSON.stringify([null, { kind: "equipment", record: null }, { ...draft(), kind: "bogus" }, { ...draft(), record: { tag: "x" } }, draft()]));
        expect(getLocalCustomContentDrafts().map((d) => d.id)).toEqual(["d1"]);
        registerLocalCustomContent();
        expect(findImportedEquipment("Widget Array", "is")?.item.tag).toBe("local-is-widget-array");
    });

    // Review finding: the custom lookup pass ignored faction, so a Clan item bound to the IS draft of that name.
    it("a Clan item does not bind to an IS draft", () => {
        saveLocalCustomContentDrafts([draft()]);
        expect(findImportedEquipment("Widget Array", "clan")).toBeNull();
        expect(findImportedEquipment("Widget Array", "clan", true)?.item.tag).toBe("local-is-widget-array");
    });

    it("runtime copies use 0 for unknown stats but keep unknown dates null", () => {
        const runtime = toRuntimeRecord<Record<string, any>>({ battleValue: null, introduced: null, range: { short: null } });
        expect(runtime.battleValue).toBe(0);
        expect(runtime.introduced).toBeNull();
        expect(runtime.range.short).toBe(0);
    });

    it("registered equipment drafts resolve by name, list with customs, and reload in a save", () => {
        saveLocalCustomContentDrafts([draft()]);
        expect(findImportedEquipment("Widget Array", "is")?.item.tag).toBe("local-is-widget-array");
        expect(getEquipmentListByTech("is", true).some((item) => item.tag === "local-is-widget-array")).toBe(true);
        expect(getEquipmentListByTech("is", false).some((item) => item.tag === "local-is-widget-array")).toBe(false);

        const mech = new BattleMech();
        mech.addEquipmentFromTag("local-is-widget-array", "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
        expect(installedTags(new BattleMech(mech.exportJSON(true)))).toContain("local-is-widget-array");
    });

    it("a canon tag still restores the canon record when a draft claims the same tag", () => {
        saveLocalCustomContentDrafts([draft({ record: { ...draft().record, tag: "medium-laser" } })]);
        const mech = new BattleMech();
        mech.addEquipmentFromTag("medium-laser", "is", "un", false, null, "", false, [], undefined, undefined);
        const restored = new BattleMech(mech.exportJSON(true)).getInstalledEquipment().find((item) => item.tag === "medium-laser");
        expect(restored?.name).toBe("Medium Laser");
    });
});
