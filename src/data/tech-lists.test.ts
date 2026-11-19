import { describe, expect, it } from "vitest";
import { getEquipmentListByTech } from "./equipment-registry";
import snapshot from "./__fixtures__/tech-lists.json";

// The registry reads each record's own tech base. The fixture holds every tech list's tags as they were when the
// catalog file still decided it (2026-10-21), so moving records between files cannot change a list.
describe("equipment lists by tech base", () => {
    it("an IS list holds no Clan records", () => {
        expect(getEquipmentListByTech("is").filter((item) => item.techBase === "clan").map((item) => item.tag)).toEqual([]);
        expect(getEquipmentListByTech("clan").filter((item) => item.techBase === "is").map((item) => item.tag)).toEqual([]);
    });

    it("keeps every tech list as it was before records said their own tech base", () => {
        for (const tech of ["is", "clan", "universal", "custom"] as const) {
            expect(getEquipmentListByTech(tech).map((item) => item.tag).sort(), tech).toEqual(snapshot[tech]);
        }
    });
});
