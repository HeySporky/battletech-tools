// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { onStorageSaveError, saveAppSettings, saveBattleMechSaves } from "./dataSaves";
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
