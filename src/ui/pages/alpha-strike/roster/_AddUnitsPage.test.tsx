// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import AlphaStrikeForce from "../../../../classes/alpha-strike-force";
import { AppSettings } from "../../../classes/app_settings";
import type { IAppGlobals } from "../../../app-router";
import AlphaStrikeAddUnits from "./_AddUnitsPage";

// The live search knows nothing of Special Rulesets: it hands back a Clan 'Mech beside an Inner Sphere one.
vi.mock("../../../../utils", async (original) => ({
    ...await original<typeof import("../../../../utils")>(),
    getMULASSearchResults: vi.fn(async () => [
        { Id: 1, Name: "Atlas", Variant: "AS7-D", Technology: { Id: 1, Name: "Inner Sphere" }, Type: { Id: 18 }, Role: { Name: "Juggernaut" }, EraId: 13 },
        { Id: 2, Name: "Timber Wolf", Variant: "Prime", Technology: { Id: 2, Name: "Clan" }, Type: { Id: 18 }, Role: { Name: "Juggernaut" }, EraId: 13 },
    ]),
}));

afterEach(cleanup);

describe("Alpha Strike roster MUL search: Special Rulesets (#324 round 4)", () => {
    it("leaves the units a ticked ruleset removes out of the live results", async () => {
        const appSettings = new AppSettings({ alphaStrikeSearchTerm: "wolf atlas", alphaStrikeSearchRulesets: ["sample-no-clans"] } as never);
        const appGlobals = { appSettings, currentASForce: new AlphaStrikeForce(), saveAppSettings: vi.fn(), favoriteASGroups: [] } as unknown as IAppGlobals;
        render(<MemoryRouter><AlphaStrikeAddUnits appGlobals={appGlobals} openEditUnit={vi.fn()} openViewUnit={vi.fn()} /></MemoryRouter>);
        await waitFor(() => expect(screen.getByText(/Search Results \(1\)/)).toBeTruthy(), { timeout: 10000 });
        expect(screen.queryByText(/Timber Wolf/)).toBeNull();
    }, 20000);
});

describe("Alpha Strike roster MUL search: no filters", () => {
    // With no term or ability the page searched nothing on opening, so every list showed no units (#377).
    it("lists the units on opening with no filters set", async () => {
        const appSettings = new AppSettings({} as never);
        const appGlobals = { appSettings, currentASForce: new AlphaStrikeForce(), saveAppSettings: vi.fn(), favoriteASGroups: [] } as unknown as IAppGlobals;
        render(<MemoryRouter><AlphaStrikeAddUnits appGlobals={appGlobals} openEditUnit={vi.fn()} openViewUnit={vi.fn()} /></MemoryRouter>);
        await waitFor(() => expect(screen.getByText(/Search Results \(2\)/)).toBeTruthy(), { timeout: 10000 });
    }, 20000);
});
