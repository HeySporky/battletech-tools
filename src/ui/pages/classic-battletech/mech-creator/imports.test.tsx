// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../../classes/battlemech";
import type { IAppGlobals } from "../../../app-router";
import MechCreatorImports from "./imports";

afterEach(cleanup);

describe("'Mech Creator imports: the Skunk Werks section (issue 17)", () => {
    it("describes the importer as it is now, not as it was in 2022", () => {
        const appGlobals = {
            appSettings: { developerMenu: false, uiTheme: "", mechNameFilter: "", mechRulesFilter: -1 },
            currentBattleMech: new BattleMech(),
            saveCurrentBattleMech: vi.fn(),
            makeDocumentTitle: vi.fn(),
            saveAppSettings: vi.fn(),
            toggleMobile: vi.fn(),
            closeMobile: vi.fn(),
            siteAlerts: { activeAlerts: [] },
        } as unknown as IAppGlobals;
        const { container } = render(<MemoryRouter><MechCreatorImports appGlobals={appGlobals} /></MemoryRouter>);
        const text = container.textContent ?? "";
        expect(text).toContain("Imports From Skunkwerks");
        expect(text).not.toContain("only the TRO3039 is loadable");
        expect(text).not.toContain("short on base equipment for Clans");
        expect(text).toContain("Battle Value matches the Master Unit List");
        expect(screen.getByRole("link", { name: "Import your own .ssw files" })).toBeTruthy();
    });

    // #241: the bundled designs load when the page shows them, and one is imported only when it is opened. The
    // creators' rules level (here Standard) no longer filters the list: the Introductory Atlas still shows.
    it("lists the bundled 'Mechs and opens one to view", async () => {
        const appGlobals = {
            appSettings: { developerMenu: false, uiTheme: "", mechNameFilter: "Atlas AS7-D", mechRulesFilter: 2 },
            currentBattleMech: new BattleMech(),
            saveCurrentBattleMech: vi.fn(),
            makeDocumentTitle: vi.fn(),
            saveAppSettings: vi.fn(),
            toggleMobile: vi.fn(),
            closeMobile: vi.fn(),
            siteAlerts: { activeAlerts: [] },
        } as unknown as IAppGlobals;
        render(<MemoryRouter><MechCreatorImports appGlobals={appGlobals} /></MemoryRouter>);
        fireEvent.click(await screen.findByRole("button", { name: "View Atlas AS7-D" }, { timeout: 20_000 }));
        expect(await screen.findByRole("heading", { name: "Viewing AS7-D" }, { timeout: 20_000 })).toBeTruthy();
    }, 30_000);
});
