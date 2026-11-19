// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../../classes/battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../../../data/rules-level-options";
import type { IAppGlobals } from "../../../app-router";
import MechCreatorStep1 from "./step1";

afterEach(cleanup);

const renderStep1 = (mech: BattleMech, mechRulesFilter: number) => {
    const appGlobals = {
        appSettings: { developerMenu: false, uiTheme: "", equipmentFilter: "", installEquipCategory: "", mechRulesFilter },
        currentBattleMech: mech,
        saveCurrentBattleMech: vi.fn(),
        makeDocumentTitle: vi.fn(),
        toggleMobile: vi.fn(),
        closeMobile: vi.fn(),
        siteAlerts: { activeAlerts: [] },
    } as unknown as IAppGlobals;
    render(<MemoryRouter><MechCreatorStep1 appGlobals={appGlobals} /></MemoryRouter>);
    return appGlobals;
};

const lam = (): BattleMech => {
    const unit = new BattleMech();
    unit.setEra("ilClan");
    unit.setType("lam");
    unit.setTonnage(30);
    return unit;
};

describe("'Mech Creator step 1: Permanent Air 'Mech picker (#175)", () => {
    it("is offered at Custom Homebrew, sets the type and shows the credited notes", () => {
        const unit = lam();
        renderStep1(unit, CUSTOM_HOMEBREW_RULES_LEVEL);
        fireEvent.change(screen.getByLabelText(/LAM Type/), { target: { value: "pam" } });
        expect(unit.isPermanentAirMech()).toBe(true);
        cleanup();
        renderStep1(unit, CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(screen.getByTestId("pam-notes").textContent).toContain("Inspired by: Red Pins");
    });

    it("loads a sample Permanent Air 'Mech, and offers none below Custom Homebrew", () => {
        // A fresh design: nothing would be lost, so no confirmation is asked.
        const appGlobals = renderStep1(new BattleMech(), CUSTOM_HOMEBREW_RULES_LEVEL);
        fireEvent.change(screen.getByTestId("pam-samples"), { target: { value: "magpie-mgp-1e" } });
        const saved = vi.mocked(appGlobals.saveCurrentBattleMech).mock.calls.at(-1)?.[0] as BattleMech;
        expect([saved.getName(), saved.getTonnage(), saved.isPermanentAirMech()]).toEqual(["MGP-1E Magpie", 30, true]);
        cleanup();
        renderStep1(lam(), 2);
        expect(screen.queryByTestId("pam-samples")).toBeNull();
    });

    it("offers a PAM tonnages from 20 to 75 (Heavy PAMs), and a standard LAM only to 55", () => {
        const tonnages = () => Array.from((screen.getByLabelText(/Mech Tonnage/) as HTMLSelectElement).options).map(option => Number(option.value));
        const unit = lam();
        unit.setLAMType("pam");
        renderStep1(unit, CUSTOM_HOMEBREW_RULES_LEVEL);
        expect([Math.min(...tonnages()), Math.max(...tonnages())]).toEqual([20, 75]);
        cleanup();
        renderStep1(lam(), CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(Math.max(...tonnages())).toBe(55);
    });

    it("is not offered below Custom Homebrew, but a design that already is one still shows it", () => {
        renderStep1(lam(), 2);
        expect(screen.queryByRole("option", { name: /Permanent Air/ })).toBeNull();
        cleanup();
        const unit = lam();
        unit.setLAMType("pam");
        renderStep1(unit, 2);
        expect((screen.getByLabelText(/LAM Type/) as HTMLSelectElement).value).toBe("pam");
        expect(screen.getByTestId("pam-notes")).toBeTruthy();
    });
});
