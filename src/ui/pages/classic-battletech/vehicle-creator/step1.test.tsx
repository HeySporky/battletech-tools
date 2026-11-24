// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import Vehicle from "../../../../classes/vehicle";
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
});

describe("Vehicle builder step 1: the turret printing (TM p.307)", () => {
    it("offers the current printing first and saves the 3rd and 4th printing as an apocryphal choice", () => {
        const vehicle = new Vehicle();
        expect(vehicle.hasTurret()).toBe(true);
        const appGlobals = renderStep1(vehicle, 0);
        const printing = select(/Turret weapons in Battle Value/);
        expect([...printing.options].map((option) => option.value)).toEqual(["tm-6th", "tm-3rd-4th"]);
        expect(printing.options[1].textContent).toContain("(apocryphal)");
        fireEvent.change(printing, { target: { value: "tm-3rd-4th" } });
        expect(vehicle.getPrinting("turret-weapon-arc").tag).toBe("tm-3rd-4th");
        expect(appGlobals.saveCurrentVehicle).toHaveBeenCalledWith(vehicle);
    });

    it("is not offered on a vehicle without a turret", () => {
        const vehicle = new Vehicle();
        vehicle.setHasTurret(false);
        renderStep1(vehicle, 0);
        expect(screen.queryByLabelText(/Turret weapons in Battle Value/)).toBeNull();
    });
});
