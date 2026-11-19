// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../../classes/battlemech";
import type { IAppGlobals } from "../../../app-router";
import MechCreatorStep2 from "./step2";

afterEach(cleanup);

const renderStep2 = (mech: BattleMech, mechRulesFilter: number) => {
    const appGlobals = {
        appSettings: { developerMenu: false, uiTheme: "", equipmentFilter: "", installEquipCategory: "", mechRulesFilter },
        currentBattleMech: mech,
        saveCurrentBattleMech: vi.fn(),
        makeDocumentTitle: vi.fn(),
        toggleMobile: vi.fn(),
        closeMobile: vi.fn(),
        siteAlerts: { activeAlerts: [] },
    } as unknown as IAppGlobals;
    render(<MemoryRouter><MechCreatorStep2 appGlobals={appGlobals} /></MemoryRouter>);
};

describe("'Mech Creator step 2: Cockpit Command Console (#171)", () => {
    const mech = (): BattleMech => {
        const unit = new BattleMech();
        unit.setTech("is");
        unit.setEra("dark-ages");
        unit.setTonnage(70);
        return unit;
    };

    it("is a checkbox under the cockpit at Advanced rules, and mounts the console", () => {
        const unit = mech();
        renderStep2(unit, 3);
        const box = screen.getByLabelText(/Cockpit Command Console/) as HTMLInputElement;
        expect(box.checked).toBe(false);
        fireEvent.click(box);
        expect(unit.hasCommandConsole()).toBe(true);
    });

    it("is not offered at Standard rules", () => {
        renderStep2(mech(), 2);
        expect(screen.queryByLabelText(/Cockpit Command Console/)).toBeNull();
    });
});
