// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import MicroMech from "./classes/micro-mech";
import { getMicroMechSaves, saveMicroMechSaves } from "./dataSaves";
import { AppSettings } from "./ui/classes/app_settings";

describe("Saved Micro-Mechs in storage (#173)", () => {
    beforeEach(() => localStorage.clear());

    it("are cleaned on the way back out: a record that is not a Micro-Mech is dropped", async () => {
        const settings = new AppSettings(null);
        const micro = new MicroMech();
        micro.setName("Kept");
        saveMicroMechSaves(settings, [JSON.parse(micro.exportJSON()), { name: "junk" } as never]);
        const read = await getMicroMechSaves(settings);
        expect(read.map((save) => save.name)).toEqual(["Kept"]);
    });

    it("read as none when storage holds something else", async () => {
        localStorage.setItem("microMechSaves", "not json");
        expect(await getMicroMechSaves(new AppSettings(null))).toEqual([]);
        localStorage.setItem("microMechSaves", JSON.stringify({ a: 1 }));
        expect(await getMicroMechSaves(new AppSettings(null))).toEqual([]);
    });
});
