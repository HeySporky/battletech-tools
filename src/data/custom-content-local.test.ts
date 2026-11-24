// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { findImportedEquipment } from "../utils/importedEquipment";
import type { ICustomContentDraft } from "./custom-content-types";
import {
    buildCustomQuirkDraft, getLocalCustomContentDrafts, getLocalCustomContentEvidence, registerLocalCustomContent,
    saveLocalCustomContentDrafts, saveLocalCustomContentEvidence, toRuntimeRecord,
} from "./custom-content-local";
import { getEquipmentListByTech } from "./equipment-registry";
import { miscCustom } from "./misc-custom";
import { getOfferedQuirks, getQuirk } from "./quirk-registry";

const draft = (overrides: Partial<ICustomContentDraft> = {}): ICustomContentDraft => ({
    id: "d1",
    kind: "equipment",
    faction: "is",
    targetCatalogId: "misc-custom",
    record: { ...JSON.parse(JSON.stringify(miscCustom.find((item) => item.tag === "custom-null-signature-system"))), name: "Widget Array", tag: "local-is-widget-array", altNames: ["Widget Array"], altTags: [], battleValue: null, book: "Custom" },
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

    // #45: the source text is kept once per file, by hash, apart from the drafts.
    it("keeps evidence by hash only while a draft names the file", () => {
        const a = draft({ sourceFiles: [{ fileName: "a.ssw", designs: ["A"], sha256: "aaa" }] });
        expect(saveLocalCustomContentEvidence({ aaa: "<mech a/>", bbb: "<mech b/>" }, [a])).toBe(true);
        expect(getLocalCustomContentEvidence()).toEqual({ aaa: "<mech a/>" });
        expect(saveLocalCustomContentEvidence({}, [])).toBe(true);
        expect(getLocalCustomContentEvidence()).toEqual({});
    });

    it("moves the source text of an older draft into the evidence store", () => {
        const old = draft({ sourceFiles: [{ fileName: "a.ssw", designs: ["A"], sha256: "aaa" }], sourceXml: { "a.ssw": "<mech a/>" } });
        expect(saveLocalCustomContentDrafts([old])).toBe(true);
        expect(getLocalCustomContentDrafts()[0].sourceXml).toBeUndefined();
        expect(getLocalCustomContentEvidence()).toEqual({ aaa: "<mech a/>" });
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

    it("a custom quirk draft registers, and getQuirk finds it by tag and by name", () => {
        const quirk = buildCustomQuirkDraft("q1", { name: "Lucky Paint", kind: "positive", points: 2, attaches: ["unit"], unitTypes: ["mech"], summary: "The crew swear by it." });
        expect(quirk.kind).toBe("quirk");
        expect(quirk.faction).toBe("universal");
        expect(quirk.targetCatalogId).toBe("quirks-custom");
        expect(quirk.record).toMatchObject({ tag: "quirk-custom-lucky-paint", custom: true, editions: [], sources: [], rulesLevel: 6, cost: { points: 2 } });
        saveLocalCustomContentDrafts([quirk]);
        expect(getQuirk("quirk-custom-lucky-paint")?.name).toBe("Lucky Paint");
        expect(getQuirk("lucky paint")?.tag).toBe("quirk-custom-lucky-paint");
        expect(getLocalCustomContentDrafts().map((d) => d.id)).toEqual(["q1"]);
    });

    it("offers a custom quirk from the custom rules level up, in any edition", () => {
        saveLocalCustomContentDrafts([buildCustomQuirkDraft("q1", { name: "Lucky Paint", kind: "negative", points: 3, attaches: ["unit"], unitTypes: ["mech"], summary: "" })]);
        expect(getOfferedQuirks("mech", "total-warfare", 6).map((q) => q.tag)).toContain("quirk-custom-lucky-paint");
        expect(getOfferedQuirks("mech", "battledroids", 6).map((q) => q.tag)).toContain("quirk-custom-lucky-paint");
        expect(getOfferedQuirks("mech", "total-warfare", 5).map((q) => q.tag)).not.toContain("quirk-custom-lucky-paint");
        expect(getOfferedQuirks("vehicle", "total-warfare", 6).map((q) => q.tag)).not.toContain("quirk-custom-lucky-paint");
    });

    it("equipment drafts still register beside a quirk draft", () => {
        saveLocalCustomContentDrafts([draft(), buildCustomQuirkDraft("q1", { name: "Lucky Paint", kind: "positive", points: 1, attaches: ["unit"], unitTypes: ["mech"], summary: "" })]);
        expect(findImportedEquipment("Widget Array", "is")?.item.tag).toBe("local-is-widget-array");
        expect(getQuirk("quirk-custom-lucky-paint")).toBeTruthy();
    });

    it("drops a stored quirk draft whose record is malformed", () => {
        const good = buildCustomQuirkDraft("q1", { name: "Lucky Paint", kind: "positive", points: 1, attaches: ["unit"], unitTypes: ["mech"], summary: "" });
        const bad = { ...good, id: "q2", record: { ...good.record, tag: "quirk-custom-bad", altNames: null } };
        localStorage.setItem("localCustomContent", JSON.stringify([bad, good]));
        expect(getLocalCustomContentDrafts().map((d) => d.id)).toEqual(["q1"]);
    });
});
