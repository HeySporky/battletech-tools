// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import InfantryPlatoon from "../../../../classes/infantry-platoon";
import type { IAppGlobals } from "../../../app-router";
import InfantryCreatorSummary from "./summary";

afterEach(cleanup);

describe("Infantry Creator summary: Battle Value and cost breakdown (#599)", () => {
    it("shows the cited breakdown under the platoon's edition", () => {
        const platoon = new InfantryPlatoon();
        const appGlobals = {
            appSettings: { developerMenu: false, uiTheme: "", equipmentFilter: "", installEquipCategory: "" },
            currentInfantry: platoon,
            saveCurrentInfantry: vi.fn(),
            makeDocumentTitle: vi.fn(),
            toggleMobile: vi.fn(),
            closeMobile: vi.fn(),
            siteAlerts: { activeAlerts: [] },
        } as unknown as IAppGlobals;
        const { container } = render(<MemoryRouter><InfantryCreatorSummary appGlobals={appGlobals} /></MemoryRouter>);
        expect(screen.getByLabelText("Rules edition")).toBeTruthy();
        expect(container.querySelector(".calc-breakdown-result")?.textContent).toBe(platoon.getBattleValue().toLocaleString("en-US"));
        expect(screen.getByRole("heading", { name: "Cost" })).toBeTruthy();
    });
});
