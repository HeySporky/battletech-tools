import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { IBundledAccuracy, IBundledMiss } from "./bundled-mechs-build";
import { BV_VERDICTS, NO_MUL_VERDICTS, bvVerdictKey, findStaleVerdictKeys, findVerdictProblems, getBvVerdict, MATCHED_FLOORS, type IBvVerdict } from "./bv-verdicts";
import type { BundledType } from "./bundled-units";

// Every bundled type writes a record (#600 round 4b).
const records = (Object.keys(MATCHED_FLOORS) as BundledType[]).map((type) =>
    JSON.parse(fs.readFileSync(path.resolve(__dirname, `bundled/${type}-accuracy.json`), "utf8")) as IBundledAccuracy);

const miss = (over: Partial<IBundledMiss>): IBundledMiss => ({ mulId: 100, name: "Testmech TST-1", ours: 1000, mul: 1010, file: "a/Testmech TST-1.ssw", ...over });

describe("Battle Value verdicts (#599)", () => {
    it("keys a miss by its MUL id, its configuration, or its file where the MUL has no entry", () => {
        expect(bvVerdictKey(miss({}))).toBe("mul:100");
        expect(bvVerdictKey(miss({ config: "Prime" }))).toBe("mul:100:Prime");
        expect(bvVerdictKey(miss({ mulId: null }))).toBe("file:a/Testmech TST-1.ssw");
    });

    it("a miss with no entry is open; an entry gives its verdict", () => {
        const verdicts: Record<string, IBvVerdict> = { "mul:100": { verdict: "import", note: "The file drops the targeting computer." } };
        expect(getBvVerdict(miss({}), verdicts)).toBe("import");
        expect(getBvVerdict(miss({ config: "Prime" }), verdicts)).toBe("open");
        expect(getBvVerdict(miss({}), {})).toBe("open");
    });

    it("every verdict's key is a unit that still differs", () => {
        // The checker names the stale keys.
        expect(findStaleVerdictKeys({ "mul:100": { verdict: "import", note: "n" }, "mul:999": { verdict: "import", note: "n" } }, [miss({})])).toEqual(["mul:999"]);
        expect(findStaleVerdictKeys(BV_VERDICTS, records.flatMap((record) => record.differs)), "verdicts for units that no longer differ: remove them").toEqual([]);
    });

    it("a mul-suspect verdict cites a rule; an our-bug verdict names an issue", () => {
        expect(findVerdictProblems({
            "mul:1": { verdict: "mul-suspect", note: "The MUL counts the ammunition twice." },
            "mul:2": { verdict: "our-bug", note: "We miss the armored gyro." },
            "mul:3": { verdict: "mul-suspect", note: "n", cites: [{ source: "tm", page: "302" }] },
            "mul:4": { verdict: "our-bug", note: "n", issue: 599 },
            "mul:5": { verdict: "import", note: " " },
        })).toEqual(["mul:1: mul-suspect needs a citation", "mul:2: our-bug needs an issue", "mul:5: no note"]);
        expect(findVerdictProblems(BV_VERDICTS)).toEqual([]);
    });

    // The three Guardians have no Master Unit List value; ours follows IO:AE p.187's Smart Robotic Control System multiplier and
    // MegaMek's calculator does not (NGCFells 2026-11-23). Each verdict states both figures and the page.
    it("keeps the Guardian verdicts, each citing IO:AE p.187 and naming our value as the custom list holds it", () => {
        const custom = fs.readFileSync(path.resolve(__dirname, "mul/custom/custom-units.json"), "utf8");
        const ours: Record<string, number> = { "Giant Guardian": 683, "Main Guardian": 544, "Swift Guardian Tank": 90 };
        const guardians = Object.entries(NO_MUL_VERDICTS).filter(([key]) => key.includes("/Vol 21/"));
        expect(guardians).toHaveLength(3);
        for (const [key, entry] of guardians) {
            const name = /\/([^/]+)\.blk$/.exec(key)![1];
            expect(entry.cites).toEqual([{ source: "ioae", page: "187" }]);
            expect(entry.note, key).toContain(`Ours ${ours[name]}`);
            expect(custom, key).toContain(`"${name.replace(" Tank", "")}",${name.endsWith("Tank") ? "\"Tank\"" : "null"},"Combat Vehicle",null,"${ours[name] === 90 ? 5 : name.startsWith("Giant") ? 80 : 60}",${ours[name] === 90 ? 5 : name.startsWith("Giant") ? 80 : 60},${ours[name]},`);
        }
    });

    // The Gothic 'Mechs and the Hobbled Scarecrow have no Master Unit List value either; ours follows the book or a derived figure, and each verdict says which.
    it("keeps a verdict for each off-list 'Mech whose Battle Value differs from MegaMek's calculator, naming both figures and the page", () => {
        const mechs = Object.entries(NO_MUL_VERDICTS).filter(([key]) => key.endsWith(".mtf"));
        expect(mechs.map(([key]) => key.replace(/^file:megamek\//, "")).sort()).toEqual([
            "3145/Davion/Scarecrow UCU-F4 Hobbled Scarecrow.mtf", "Gothic/Firestarter FS9-HB.mtf", "Gothic/King Crab KGC-0KP.mtf", "Gothic/Marauder MAD-3H.mtf",
            "Shrapnel/Gothic/Phoenix Hawk 'Hammer Hawk' PXH-1S.mtf",
        ]);
        for (const [key, entry] of mechs) {
            expect(entry.note, key).toMatch(/^Ours [\d,]+, MegaMek [\d,]+\./);
            expect(entry.cites.length, key).toBeGreaterThan(0);
        }
    });

    it("no type's match count has dropped", () => {
        for (const record of records) expect(record.matched, record.unitType).toBeGreaterThanOrEqual(MATCHED_FLOORS[record.unitType]);
    });
});
