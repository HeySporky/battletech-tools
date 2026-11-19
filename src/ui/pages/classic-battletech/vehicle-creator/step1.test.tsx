// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import Vehicle from "../../../../classes/vehicle";
import { ARTVEE_SAMPLES_RULES_LEVEL } from "../../../../data/artvee-samples";
import { getVehicleTonnageBounds } from "../../../../data/vehicle-motive-types";
import type { IAppGlobals } from "../../../app-router";
import VehicleCreatorStep1 from "./step1";

afterEach(cleanup);

function renderStep1(vehicle: Vehicle, mechRulesFilter: number) {
    const appGlobals = {
        appSettings: { developerMenu: false, uiTheme: "", mechNameFilter: "", mechRulesFilter },
        currentVehicle: vehicle,
        vehicleSaves: [],
        saveCurrentVehicle: vi.fn(),
        saveVehicleSaves: vi.fn(),
        makeDocumentTitle: vi.fn(),
        saveAppSettings: vi.fn(),
        toggleMobile: vi.fn(),
        closeMobile: vi.fn(),
        siteAlerts: { activeAlerts: [] },
    } as unknown as IAppGlobals;
    render(<MemoryRouter><VehicleCreatorStep1 appGlobals={appGlobals} /></MemoryRouter>);
    return appGlobals;
}

const select = (label: RegExp) => screen.getByLabelText(label) as HTMLSelectElement;

describe("Vehicle builder step 1: the shared game settings block (#324)", () => {
    it("a level change clamps tonnage at the design's level, not the app-wide one", () => {
        const vehicle = new Vehicle();
        const motive = vehicle.getMotiveType().tag;
        vehicle.gameSettings.set(3, []);
        vehicle.setTonnage(getVehicleTonnageBounds(motive, 3).max);
        const appGlobals = renderStep1(vehicle, 1);
        // A tech change keeps a superheavy tonnage the design's own level allows.
        fireEvent.change(select(/Technology Base/), { target: { value: "clan" } });
        expect(vehicle.getTonnage()).toBe(getVehicleTonnageBounds(motive, 3).max);
        fireEvent.change(select(/Rules Level/), { target: { value: "2" } });
        expect(vehicle.getTonnage()).toBeLessThanOrEqual(getVehicleTonnageBounds(motive, 2).max);
        expect(vehicle.gameSettings.getRulesLevel(-1)).toBe(2);
        expect(appGlobals.appSettings.mechRulesFilter).toBe(2);
        expect(appGlobals.saveCurrentVehicle).toHaveBeenCalled();
    });

    it("a support vehicle keeps its own tonnage through a level change (TM pp.116-139)", () => {
        const vehicle = new Vehicle();
        vehicle.setSupportVehicle(true);
        vehicle.setTonnage(150);
        const tonnage = vehicle.getTonnage();
        renderStep1(vehicle, 4);
        fireEvent.change(select(/Rules Level/), { target: { value: "1" } });
        expect(vehicle.gameSettings.getRulesLevel(-1)).toBe(1);
        expect(vehicle.getTonnage()).toBe(tonnage);
    });

    it("has one of each setting and no old era select", () => {
        renderStep1(new Vehicle(), 2);
        expect(screen.getAllByLabelText(/Rules Level/)).toHaveLength(1);
        expect(screen.getAllByLabelText(/Technology Base/)).toHaveLength(1);
        expect(screen.queryByText(/Vehicle Era:/)).toBeNull();
    });

    it("a sample ArtVee keeps the design's level and rulesets", () => {
        const vehicle = new Vehicle();
        vehicle.gameSettings.set(ARTVEE_SAMPLES_RULES_LEVEL, ["sample-no-clans"]);
        // The picker lists samples at the design's level, though the app-wide one is lower.
        const appGlobals = renderStep1(vehicle, 0);
        const picker = screen.getByTestId("artvee-samples") as HTMLSelectElement;
        fireEvent.change(picker, { target: { value: picker.options[1].value } });
        const loaded = vi.mocked(appGlobals.saveCurrentVehicle).mock.calls.at(-1)?.[0] as Vehicle;
        expect(loaded).not.toBe(vehicle);
        expect(loaded.gameSettings.getRulesLevel(-1)).toBe(ARTVEE_SAMPLES_RULES_LEVEL);
        expect(loaded.gameSettings.getRulesets()).toEqual(["sample-no-clans"]);
    });
});
