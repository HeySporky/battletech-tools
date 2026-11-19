import { describe, expect, it } from "vitest";
import { stringifyTable as stringifyTableForSync } from "../../tools/mul-sync/pack-json.mjs";
import { stringifyTable, tabulate, untabulate } from "./packed-json";

const records = [
    { Id: 1, Name: "Atlas", Role: { Id: 3, Name: "Juggernaut", Image: null }, GroupName: null, BFArcs: {}, Availability: [{ EraId: 11, FactionIds: [1, 2] }, { EraId: 13, FactionIds: [] }] },
    { Id: 2, Name: "Locust", Variant: "LCT-1V", Role: { Id: 4, Name: "Scout", Image: null }, Availability: [] },
];

describe("tables of records", () => {
    it("give back the same records, real nulls and empty objects kept and absent fields left absent", () => {
        expect(untabulate(tabulate(records))).toEqual(records);
        expect(untabulate(JSON.parse(stringifyTable(records)))).toEqual(records);
        expect("Variant" in (untabulate(tabulate(records)) as object[])[0]).toBe(false);
    });

    it("write each key once", () => {
        const text = stringifyTable(records);
        expect(text.match(/"Name"/g)).toHaveLength(1);
        expect(text.split("\n").length).toBe(records.length + 3);
    });

    // A field set to undefined is not written, as JSON leaves it out of a plain object: a battle armor suit reloaded
    // from its bundled design carried such fields on its equipment, and wrote a column of nulls for each (#241).
    it("leave out fields set to undefined, as JSON does", () => {
        const rows = [{ name: "A", shots: undefined }, { name: "B", shots: undefined }];
        expect(JSON.stringify(tabulate(rows))).toBe(JSON.stringify(tabulate([{ name: "A" }, { name: "B" }])));
        expect(untabulate(JSON.parse(JSON.stringify(tabulate([{ name: "A", shots: 3 }, { name: "B", shots: undefined }]))))).toEqual([{ name: "A", shots: 3 }, { name: "B" }]);
    });

    it("read a plain list as it is, for files from before", () => {
        expect(untabulate(records)).toEqual(records);
    });

    it("are written the same by the MUL sync", () => {
        expect(stringifyTableForSync(records)).toBe(stringifyTable(records));
    });
});
