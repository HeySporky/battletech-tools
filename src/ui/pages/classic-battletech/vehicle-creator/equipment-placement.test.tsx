// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import Vehicle from "../../../../classes/vehicle";
import type { IAppGlobals } from "../../../app-router";
import VehicleCreatorEquipmentPlacement from "./equipment-placement";

afterEach(cleanup);

const renderPlacement = (vehicle: Vehicle) => {
    const appGlobals = {
        appSettings: { developerMenu: false, uiTheme: "", equipmentFilter: "", installEquipCategory: "" },
        currentVehicle: vehicle,
        saveCurrentVehicle: vi.fn(),
        makeDocumentTitle: vi.fn(),
        toggleMobile: vi.fn(),
        closeMobile: vi.fn(),
        siteAlerts: { activeAlerts: [] },
    } as unknown as IAppGlobals;
    render(<MemoryRouter><VehicleCreatorEquipmentPlacement appGlobals={appGlobals} /></MemoryRouter>);
};

describe("vehicle equipment placement: sponsons", () => {
    it("offers Left Sponson and Right Sponson for weapons, and puts the weapon in the sponson chosen", () => {
        const tank = new Vehicle();
        tank.setMotiveType("tracked");
        tank.setTonnage(60);
        tank.setSponsonTurrets(true);
        tank.addEquipmentFromTag("large-laser");
        const laser = tank.getEquipmentList()[tank.getEquipmentList().length - 1];
        renderPlacement(tank);
        const select = screen.getByLabelText(`${laser.name} location`) as HTMLSelectElement;
        const names = [...select.options].map((option) => option.textContent);
        expect(names).toContain("Left Sponson");
        expect(names).toContain("Right Sponson");
        fireEvent.change(select, { target: { value: "right|sponson" } });
        const placed = tank.getEquipmentList().find((item) => item.uuid === laser.uuid)!;
        expect(placed.location).toBe("right");
        expect(tank.isSponsonMounted(placed)).toBe(true);
    });

    it("puts ammunition in the Body, with no location to choose (TM p. 107)", () => {
        const tank = new Vehicle();
        tank.setMotiveType("tracked");
        tank.setTonnage(60);
        tank.addEquipmentFromTag("ammo-ac-5-standard");
        const ammo = tank.getEquipmentList()[tank.getEquipmentList().length - 1];
        renderPlacement(tank);
        expect(screen.queryByLabelText(`${ammo.name} location`)).toBeNull();
        expect(screen.getByTestId(`body-${ammo.uuid}`).textContent).toBe("Body");
    });
});
