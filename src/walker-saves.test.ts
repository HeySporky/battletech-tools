// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import Walker from "./classes/walker";
import { IFullBackup, MAX_WALKER_SAVES, getWalkerSaves, restoreFullBackup, saveWalkerSaves } from "./dataSaves";
import { AppSettings } from "./ui/classes/app_settings";

const walkerSave = (name: string): Record<string, unknown> => {
    const walker = new Walker();
    walker.setName(name);
    walker.setTons(50);
    return JSON.parse(walker.exportJSON());
};

describe("Saved Walkers in storage (#172)", () => {
    beforeEach(() => localStorage.clear());

    it("are cleaned on the way back out: a record that is not a Walker is dropped", async () => {
        const settings = new AppSettings(null);
        saveWalkerSaves(settings, [walkerSave("Kept") as never, { name: "junk" } as never]);
        const read = await getWalkerSaves(settings);
        expect(read.map((save) => save.name)).toEqual(["Kept"]);
    });

    it("read as none when storage holds something else", async () => {
        localStorage.setItem("walkerSaves", "not json");
        expect(await getWalkerSaves(new AppSettings(null))).toEqual([]);
        localStorage.setItem("walkerSaves", JSON.stringify({ a: 1 }));
        expect(await getWalkerSaves(new AppSettings(null))).toEqual([]);
    });
});

// A Walker backup may come from someone else, or from a build that predates the type (#172): each save is cleaned and
// every cleaned value is reported; what is not a Walker is skipped with a message.
describe("Restoring Walker saves", () => {
    const globals = () => ({ favoriteASGroups: [], favoriteCBTGroups: [], battleMechSaves: [], vehicleSaves: [], walkerSaves: [] }) as never;
    const backup = (extra: Record<string, unknown>): IFullBackup => ({ battleMechSaves: [], favoriteASGroups: [], ...extra }) as unknown as IFullBackup;

    it("adds a saved Walker and replaces one with the same id", () => {
        const first = walkerSave("Mule");
        const target = { favoriteASGroups: [], favoriteCBTGroups: [], battleMechSaves: [], vehicleSaves: [], walkerSaves: [first] };
        const added = restoreFullBackup(backup({ walkerSaves: [walkerSave("Other")] }), target as never);
        expect(added.filter((msg) => msg.severity === "add").map((msg) => msg.message)).toEqual(["Add to your Saved Walkers: 'Other'"]);
        const replaced = restoreFullBackup(backup({ walkerSaves: [{ ...first, name: "Mule II" }] }), target as never);
        expect(replaced.filter((msg) => msg.severity === "replace" && msg.message.includes("Walker")).map((msg) => msg.message)).toEqual(["Replace Saved Walker 'Mule' with 'Mule II'"]);
    });

    it("previews a store that has no Walker list yet (a global from before the type) without failing", () => {
        const target = { favoriteASGroups: [], favoriteCBTGroups: [], battleMechSaves: [], vehicleSaves: [] } as Record<string, unknown>;
        const messages = restoreFullBackup(backup({ walkerSaves: [walkerSave("Mule")] }), target as never);
        expect(messages.filter((msg) => msg.severity === "add").map((msg) => msg.message)).toEqual(["Add to your Saved Walkers: 'Mule'"]);
    });

    it("says what it cleaned, and skips an entry that is not a Walker", () => {
        const tooBig = { ...walkerSave("Giant"), tons: 400, walkMP: 99 };
        const messages = restoreFullBackup(backup({ walkerSaves: [tooBig, { name: "junk" }, null, walkerSave("Fine")] }), globals());
        const warnings = messages.filter((msg) => msg.severity === "warning").map((msg) => msg.message);
        expect(warnings.filter((msg) => msg.includes("Not a Walker record"))).toHaveLength(2);
        expect(messages.filter((msg) => msg.severity === "add").map((msg) => msg.message)).toContain("Add to your Saved Walkers: 'Fine'");
    });

    it("caps the Walkers it reads, and says so", () => {
        const saves = Array.from({ length: MAX_WALKER_SAVES + 5 }, (_, i) => ({ ...walkerSave("w" + i), uuid: "u" + i }));
        const messages = restoreFullBackup(backup({ walkerSaves: saves }), globals());
        expect(messages.filter((msg) => msg.severity === "add")).toHaveLength(MAX_WALKER_SAVES);
        expect(messages.some((msg) => msg.severity === "warning" && msg.message.includes(String(MAX_WALKER_SAVES)))).toBe(true);
    });

    it("lists what a current Walker would have cleaned, and a backup without Walkers restores as before", () => {
        const bad = { ...walkerSave("Cur"), tons: 400 };
        const preview = restoreFullBackup(backup({ currentWalker: JSON.stringify(bad) }), globals()).filter((msg) => msg.severity === "warning");
        expect(preview.every((msg) => msg.message.startsWith("If you overwrite your current Walker: "))).toBe(true);
        expect(() => restoreFullBackup(backup({}), globals())).not.toThrow();
    });
});
