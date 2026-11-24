import { describe, expect, it, vi } from "vitest";
import { getLegacyMULFactionID, loadMULListItems, normalizeMULSourceSelection } from "./mul-list-items";
import { getMULFactionIDs, getMULFactionLabels } from "../utils/mulUtilities";

describe("MUL chunk loader", () => {
    it("serves only current MUL 2.0 records by default", async () => {
        const items = await loadMULListItems();

        expect(items.length).toBeGreaterThan(0);
        expect(items.every((item) => item.MulSource === "mul2" && item.MulUnitKey)).toBe(true);
        expect(items.some((item) => item.Name?.trim() === "AA Jump Infantry")).toBe(true);
        expect(items.some((item) => "Title" in item)).toBe(false);

        const blackKnight = items.find((item) => item.MulUnitKey === "000RM4HYJ9");
        expect(blackKnight?.Role.Name).toBe("Brawler");
        expect(blackKnight?.Type).toMatchObject({ Id: 18, Name: "BattleMech" });
        expect(blackKnight?.EraId).toBe(11);
    }, 30_000);

    // The live MUL keeps RS:3075's IndustrialMech BVs, which took the x0.9 off the whole BV, not the Offensive
    // Battle Rating alone (TM p.304); MUL: Battle Values v1.0 pp.173-174 printed the corrected figures (#354).
    it("serves the corrected Battle Value where the live MUL's is stale", async () => {
        const items = await loadMULListItems();
        const bv = (id: number) => items.find((item) => item.Id === id)?.BattleValue;

        expect(bv(108513)).toBe(350); // Jabberwocky JAW-66B, live MUL 322
        expect(bv(103087)).toBe(352); // Jabberwocky JAW-66D, live MUL 326
        expect(bv(107159)).toBe(250); // Jabberwocky JAW-65A, live MUL 230
        expect(bv(100674)).toBe(680); // Quasit QUA-51M, live MUL 636
        expect(bv(106363)).toBe(826); // Quasit QUA-51P, live MUL 779
        expect(bv(108024)).toBe(351); // Jabberwocky JAW-66C, already right on the live MUL
        expect(bv(102180)).toBe(1227); // Diomede D-M3D-3, live MUL 1228 (#371)
        expect(bv(101073)).toBe(1234); // Diomede D-M3D-4, live MUL 1235
        expect(bv(100319)).toBe(73); // Patron PTN-1, live MUL 107
        expect(bv(100143)).toBe(954); // Kiso K-3N-KR4, live MUL 946 (#171)
        expect(bv(104760)).toBe(1091); // Kiso K-3N-KR5, live MUL 1082
        expect(bv(108066)).toBe(2278); // Atlas AS7-S3-DC, live MUL 2276
        expect(bv(105956)).toBe(3107); // Ryoken III (Skinwalker) E, live MUL 3102 (#109)
    }, 30_000);

    it("adds MUL 1.0 leftovers only when selected, one record per legacy id", async () => {
        const items = await loadMULListItems(["mul2", "mul1"]);
        const legacy = items.filter((item) => item.MulSource === "mul1");

        expect(legacy.length).toBeGreaterThan(0);
        expect(legacy.some((item) => item.Id === 4800 && item.Name === "Pendragon PDG-2R")).toBe(true);
        expect(new Set(legacy.map((item) => item.Id)).size).toBe(legacy.length);
        expect(items.length).toBe((await loadMULListItems(["mul2"])).length + legacy.length);
    }, 30_000);

    // MUL 2.0 renumbered factions from id 37 up (masterunitlist.battletech.com /data/factions.json).
    it("maps MUL 2.0 faction ids to the legacy MUL 1.0 faction taxonomy", async () => {
        expect(getLegacyMULFactionID(37)).toBe(38); // Pirates
        expect(getLegacyMULFactionID(68)).toBe(87); // Terran Hegemony
        expect(getLegacyMULFactionID(74)).toBe(94); // Star League in Exile
        expect(getLegacyMULFactionID(20)).toBe(20); // Clan Smoke Jaguar, unchanged below 37
        expect(getMULFactionLabels(getLegacyMULFactionID(190))).toBe("Jade Falcon Remnant");

        const items = await loadMULListItems();
        const labelled = new Set(getMULFactionIDs());
        const unlabelled = new Set<number>();
        for (const item of items) {
            for (const entry of item.Availability ?? []) {
                entry.FactionIds.filter((id) => !labelled.has(id)).forEach((id) => unlabelled.add(id));
            }
        }
        expect([...unlabelled]).toEqual([]);

        // The site lists the Mackie MSK-7A for the Terran Hegemony (AoW, SL), Rim Worlds Republic (SL) and
        // Star League in Exile, Smoke Jaguar and Steel Viper (Early Succession War).
        const mackie = items.find((item) => item.Name === "Mackie" && item.Variant === "MSK-7A");
        const names = (mackie?.Availability ?? []).map((entry) => entry.FactionIds.map(getMULFactionLabels).sort());
        expect(names).toEqual([
            ["Terran Hegemony"],
            ["Rim Worlds Republic", "Terran Hegemony"],
            ["Clan Smoke Jaguar", "Clan Steel Viper", "Star League in Exile"],
        ]);
    }, 30_000);

    it("serves this browser's local custom entries only when customs are selected", async () => {
        const local = { Id: 900123, MulUnitKey: "CUSTOM-LOCALTEST1", Name: "Local Test", Variant: "LT-1", Class: "BattleMech", CustomInfo: { local: true } };
        const store: Record<string, string> = { localCustomMULUnits: JSON.stringify([local]) };
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => store[key] ?? null,
            setItem: (key: string, value: string) => { store[key] = value; },
        });
        try {
            const withCustoms = await loadMULListItems(["mul2", "mul1", "custom"]);
            expect(withCustoms.find((item) => item.MulUnitKey === "CUSTOM-LOCALTEST1")).toMatchObject({ MulSource: "custom", Name: "Local Test" });
            expect((await loadMULListItems(["mul2", "mul1"])).some((item) => item.MulUnitKey === "CUSTOM-LOCALTEST1")).toBe(false);
        } finally {
            vi.unstubAllGlobals();
        }
    }, 30_000);

    it("reads any ticked lists, and the strings saved before the lists became checkboxes", () => {
        expect(normalizeMULSourceSelection(["custom", "mul2"])).toEqual(["mul2", "custom"]);
        expect(normalizeMULSourceSelection(["mul1"])).toEqual(["mul1"]);
        expect(normalizeMULSourceSelection("mul2+mul1")).toEqual(["mul2", "mul1"]);
        expect(normalizeMULSourceSelection("mul2+mul1+custom")).toEqual(["mul2", "mul1", "custom"]);
        expect(normalizeMULSourceSelection([])).toBeNull();
        expect(normalizeMULSourceSelection(["bogus"])).toBeNull();
    });

    it("searches only the lists ticked, so customs alone leave out the MUL", async () => {
        const customsOnly = await loadMULListItems(["custom"]);
        expect(customsOnly.every((item) => item.MulSource === "custom")).toBe(true);
    }, 30_000);
});
