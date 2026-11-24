// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { IFullBackup, MAX_MICRO_MECH_SAVES, onStorageSaveError, restoreFullBackup, saveAppSettings, saveBattleMechSaves } from "./dataSaves";
import MicroMech from "./classes/micro-mech";
import { AppSettings } from "./ui/classes/app_settings";

// Browsers cap localStorage at about 5 MB per origin. Once the saves pass that, setItem throws a
// QuotaExceededError. A failed save must not throw into the caller, and the user has to be told.
const failSetItem = () => vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
});

describe("Saving when localStorage is full", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        onStorageSaveError(null);
    });

    it("reports a failed save of the saved 'Mechs instead of rejecting", async () => {
        failSetItem();
        const failures: string[] = [];
        onStorageSaveError((keyName) => failures.push(keyName));

        saveBattleMechSaves(new AppSettings(null), []);
        await Promise.resolve();

        expect(failures).toEqual(["battleMechSaves"]);
    });

    it("reports a failed save of the app settings instead of throwing", () => {
        failSetItem();
        const failures: string[] = [];
        onStorageSaveError((keyName) => failures.push(keyName));

        expect(() => saveAppSettings(new AppSettings(null).export())).not.toThrow();
        expect(failures).toEqual(["appSettings"]);
    });

    it("does not throw when nothing is listening", () => {
        failSetItem();
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        expect(() => saveAppSettings(new AppSettings(null).export())).not.toThrow();
    });
});

// A Micro-Mech backup may come from someone else (#173): each save is cleaned and every cleaned value is reported.
describe("Restoring Micro-Mech saves", () => {
    const globals = () => ({ favoriteASGroups: [], favoriteCBTGroups: [], battleMechSaves: [], vehicleSaves: [], microMechSaves: [] }) as never;
    const backup = (extra: Record<string, unknown>): IFullBackup => ({ battleMechSaves: [], favoriteASGroups: [], ...extra }) as unknown as IFullBackup;
    const microSave = (name: string): Record<string, unknown> => {
        const micro = new MicroMech();
        micro.setName(name);
        micro.setTons(11);
        return JSON.parse(micro.exportJSON());
    };

    it("adds a saved Micro-Mech and replaces one with the same id", () => {
        const first = microSave("Storm");
        const target = { favoriteASGroups: [], favoriteCBTGroups: [], battleMechSaves: [], vehicleSaves: [], microMechSaves: [first] };
        const added = restoreFullBackup(backup({ microMechSaves: [microSave("Other")] }), target as never);
        expect(added.filter((msg) => msg.severity === "add").map((msg) => msg.message)).toEqual(["Add to your Saved Micro-Mechs: 'Other'"]);
        const replaced = restoreFullBackup(backup({ microMechSaves: [{ ...first, name: "Storm II" }] }), target as never);
        expect(replaced.filter((msg) => msg.severity === "replace" && msg.message.includes("Micro-Mech")).map((msg) => msg.message)).toEqual(["Replace Saved Micro-Mech 'Storm' with 'Storm II'"]);
    });

    it("says what it cleaned, and skips an entry that is not a Micro-Mech", () => {
        const tooHeavy = { ...microSave("Giant"), tons: 90, walkMP: 99 };
        const messages = restoreFullBackup(backup({ microMechSaves: [tooHeavy, { name: "junk" }, null, microSave("Fine")] }), globals());
        const warnings = messages.filter((msg) => msg.severity === "warning").map((msg) => msg.message);
        expect(warnings.some((msg) => msg.startsWith("Saved Micro-Mech 'Giant': "))).toBe(true);
        expect(warnings.filter((msg) => msg.includes("Not a Micro-Mech record"))).toHaveLength(2);
        expect(messages.filter((msg) => msg.severity === "add").map((msg) => msg.message)).toContain("Add to your Saved Micro-Mechs: 'Fine'");
    });

    it("caps the Micro-Mechs it reads, and says so", () => {
        const saves = Array.from({ length: MAX_MICRO_MECH_SAVES + 5 }, (_, i) => ({ ...microSave("m" + i), uuid: "u" + i }));
        const messages = restoreFullBackup(backup({ microMechSaves: saves }), globals());
        expect(messages.filter((msg) => msg.severity === "add")).toHaveLength(MAX_MICRO_MECH_SAVES);
        expect(messages.some((msg) => msg.severity === "warning" && msg.message.includes(String(MAX_MICRO_MECH_SAVES)))).toBe(true);
    });

    it("lists what a current Micro-Mech would have cleaned, and a backup without Micro-Mechs restores as before", () => {
        const bad = { ...microSave("Cur"), tons: 90 };
        const preview = restoreFullBackup(backup({ currentMicroMech: JSON.stringify(bad) }), globals()).filter((msg) => msg.severity === "warning");
        expect(preview.length).toBeGreaterThan(0);
        expect(preview.every((msg) => msg.message.startsWith("If you overwrite your current Micro-Mech: "))).toBe(true);
        expect(() => restoreFullBackup(backup({}), globals())).not.toThrow();
    });
});
