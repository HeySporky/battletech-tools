// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { getCampaigns, getFullBackup, IFullBackup, restoreFullBackup, saveCampaigns } from "./dataSaves";
import { Campaign } from "./classes/campaign/campaign";
import { AppSettings } from "./ui/classes/app_settings";

// Campaigns ride in the full backup as an optional key, like the Aces campaigns.
describe("Campaigns in the full backup", () => {
    const backup = (extra: Record<string, unknown>): IFullBackup => ({ battleMechSaves: [], favoriteASGroups: [], ...extra }) as unknown as IFullBackup;

    it("backs up and restores campaigns", async () => {
        const appSettings = new AppSettings(null);
        const one = new Campaign(); one.name = "One";
        const two = new Campaign(); two.name = "Two"; two.advance(2);
        saveCampaigns(appSettings, [one.export(), two.export()]);
        const saved = JSON.parse(await getFullBackup(appSettings)) as IFullBackup;
        expect(saved.campaigns).toHaveLength(2);
        localStorage.removeItem("campaigns");
        // Restore only the campaigns section, with every other app action a no-op.
        const base: Record<string, unknown> = { appSettings, favoriteASGroups: [], favoriteCBTGroups: [], battleMechSaves: [], vehicleSaves: [] };
        const globals = new Proxy(base, { get: (target, key: string) => (key in target ? target[key] : () => undefined) }) as never;
        const messages = restoreFullBackup(backup({ campaigns: saved.campaigns }), globals, false, false, false, true);
        expect(messages.filter((msg) => msg.message.startsWith("Add or replace campaign")).map((msg) => msg.message))
            .toEqual(["Add or replace campaign 'One'", "Add or replace campaign 'Two'"]);
        expect((await getCampaigns(appSettings)).map((c) => [c.name, c.step])).toEqual([["One", 0], ["Two", 2]]);
    });

    it("restores a backup with no campaigns key", () => {
        const globals = { favoriteASGroups: [], favoriteCBTGroups: [], battleMechSaves: [], vehicleSaves: [] } as never;
        expect(() => restoreFullBackup(backup({}), globals)).not.toThrow();
    });
});
