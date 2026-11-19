import { readFileSync } from "fs";
import { describe, expect, it, vi } from "vitest";
import { importBattleMechMtf } from "./battlemech-mtf";

// Regression: since quads lost their arm slots (getLocationSlotCount), the SSW
// import step put a quad's front-leg items (written by the converter as LA/RA)
// nowhere, so they ended up unallocated. Tarantula ZPH-1 carries jump jets in
// both front legs.
describe("quad import keeps front-leg items", () => {
    it("places the Tarantula ZPH-1's front-leg jump jets in the front legs", () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const { mech, issues } = importBattleMechMtf(readFileSync("src/utils/__fixtures__/tarantula-zph-1.mtf", "utf8"));
        expect(issues.filter((issue) => /unallocated/i.test(String(issue)))).toEqual([]);
        const tags = (slots: unknown[] | undefined) =>
            (slots ?? []).map((slot) => (slot as { tag?: string } | null)?.tag ?? null);
        expect(tags(mech?.getCriticals().frontLeftLeg)).toContain("jj-standard");
        expect(tags(mech?.getCriticals().frontRightLeg)).toContain("jj-standard");
        expect(mech?.getUnallocatedCritCount() ?? 0).toBe(0);
    });

    it("places the Kiso K-3N-KR4's front-leg searchlights in the front legs", () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const { mech, issues } = importBattleMechMtf(readFileSync("src/utils/__fixtures__/kiso-k-3n-kr4.mtf", "utf8"));
        expect(issues).toEqual([]);
        expect(mech?.getUnallocatedCritCount() ?? 0).toBe(0);
    });
});
