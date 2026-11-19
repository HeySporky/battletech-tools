// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import SmallCraft from "../../../../classes/small-craft";
import type { IAppGlobals } from "../../../app-router";
import SmallCraftCreatorHome from "./home";

afterEach(cleanup);

const makeGlobals = () => ({
    saveCurrentSmallCraft(this: { currentSmallCraft: SmallCraft }, next: SmallCraft) { this.currentSmallCraft = next; },
    appSettings: { developerMenu: false, uiTheme: "", mechNameFilter: "", mechRulesFilter: 2 },
    currentSmallCraft: new SmallCraft(),
    smallCraftSaves: [] as unknown[],
    makeDocumentTitle: vi.fn(),
    saveAppSettings: vi.fn(),
    saveSmallCraftSaves: vi.fn(),
    openConfirmDialog: vi.fn(),
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
    siteAlerts: { activeAlerts: [] },
});

describe("Small Craft Creator home: the Future Wars sample DropShips (#172)", () => {
    it("lists the authors' designs and the verification builds, and loads one with its method ticked", () => {
        const globals = makeGlobals();
        render(<MemoryRouter><SmallCraftCreatorHome appGlobals={globals as unknown as IAppGlobals} /></MemoryRouter>);
        const table = screen.getByTestId("fw-dropship-samples");
        for (const name of ["Pioneer A", "UNION-12", "THUNDERWOLF", "GOLIATH-R", "Overlord (verification build)"]) expect(table.textContent).toContain(name);
        expect(table.textContent).toContain("Future Wars #36 (1993), p.21");
        expect(screen.getByText(/NGCFells's verification builds/)).toBeTruthy();
        fireEvent.click(screen.getByTestId("fw-dropship-sample-union-12"));
        const loaded = globals.currentSmallCraft;
        expect(loaded.getName()).toBe("UNION-12");
        expect(loaded.getFwDropShipMethod()).toBe("reese");
        expect(loaded.getTonnage()).toBe(22860);
    });
});
