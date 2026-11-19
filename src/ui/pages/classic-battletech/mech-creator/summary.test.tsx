// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../../classes/battlemech";
import type { IAppGlobals } from "../../../app-router";
import { btRulesEditions } from "../../../../data/rules-editions";
import { getMULGroundRoles } from "../../../../utils/mulUtilities";
import MechCreatorSummary from "./summary";

afterEach(cleanup);

const renderSummary = (mech: BattleMech) => {
    const appGlobals = {
        appSettings: { developerMenu: false, uiTheme: "", equipmentFilter: "", installEquipCategory: "" },
        currentBattleMech: mech,
        saveCurrentBattleMech: vi.fn(),
        makeDocumentTitle: vi.fn(),
        toggleMobile: vi.fn(),
        closeMobile: vi.fn(),
        siteAlerts: { activeAlerts: [] },
    } as unknown as IAppGlobals;
    render(<MemoryRouter><MechCreatorSummary appGlobals={appGlobals} /></MemoryRouter>);
};

describe("'Mech Creator summary: Alpha Strike Role (issue 15)", () => {
    it("is a drop-down of the published ground roles, and sets the role picked", () => {
        const mech = new BattleMech();
        renderSummary(mech);
        const select = screen.getByLabelText("Alpha Strike Role") as HTMLSelectElement;
        expect(select.tagName).toBe("SELECT");
        expect([...select.options].map((option) => option.value)).toEqual(["", ...getMULGroundRoles()]);
        fireEvent.change(select, { target: { value: "Sniper" } });
        expect(mech.getASRole()).toBe("Sniper");
    });

    it("keeps a role saved before the drop-down as an option, so it is not lost", () => {
        const mech = new BattleMech();
        mech.setASRole("Brawler-ish");
        renderSummary(mech);
        const select = screen.getByLabelText("Alpha Strike Role") as HTMLSelectElement;
        expect(select.value).toBe("Brawler-ish");
    });
});

describe("'Mech Creator summary: Battle Value and cost breakdown (#599)", () => {
    it("shows the cited breakdown under the design's edition, with the skill-adjusted Battle Value", () => {
        const mech = new BattleMech();
        mech.setPilotGunnery(3);
        mech.setPilotPiloting(4);
        renderSummary(mech);
        const select = screen.getByLabelText("Rules edition") as HTMLSelectElement;
        expect(select.value).toBe(mech.getRulesEdition());
        expect([...select.options].map((option) => option.value)).toEqual(btRulesEditions.map((edition) => edition.tag));
        const battleValue = screen.getByRole("region", { name: "Battle Value" });
        expect(within(battleValue).getByRole("table")).toBeTruthy();
        expect(battleValue.textContent).toContain(`Adjusted for skill (Gunnery 3, Piloting 4): ${mech.getPilotAdjustedBattleValue().toLocaleString("en-US")}`);
        expect(within(screen.getByRole("region", { name: "Cost" })).getByRole("table")).toBeTruthy();
    });

    it("switches to an edition without Battle Value and says so", () => {
        renderSummary(new BattleMech());
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "battletech-compendium" } });
        const battleValue = screen.getByRole("region", { name: "Battle Value" });
        expect(battleValue.textContent).toContain("has no Battle Value");
        expect(within(battleValue).queryByRole("table")).toBeNull();
    });
});
