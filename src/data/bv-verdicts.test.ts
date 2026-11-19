import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { IBundledAccuracy, IBundledMiss } from "./bundled-mechs-build";
import { BV_VERDICTS, bvVerdictKey, findStaleVerdictKeys, findVerdictProblems, getBvVerdict, MECH_MATCHED_FLOOR, type IBvVerdict } from "./bv-verdicts";

const accuracy = JSON.parse(fs.readFileSync(path.resolve(__dirname, "bundled/mechs-accuracy.json"), "utf8")) as IBundledAccuracy;

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
        expect(findStaleVerdictKeys(BV_VERDICTS, accuracy.differs), "verdicts for units that no longer differ: remove them").toEqual([]);
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

    it("the 'Mech match count has not dropped", () => {
        expect(accuracy.matched).toBeGreaterThanOrEqual(MECH_MATCHED_FLOOR);
    });
});
