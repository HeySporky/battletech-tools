// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Vehicle from "../../../../classes/vehicle";
import VehiclePlayPanel from "./_vehiclePlay";


afterEach(cleanup);

// Design quirks in play (quirks design, plan 3).
describe("vehicle play quirks", () => {
    const laserTank = (): Vehicle => {
        const vehicle = new Vehicle();
        vehicle.setTech("is");
        vehicle.setMotiveType("tracked");
        vehicle.setTonnage(40);
        vehicle.setCruiseMP(4);
        vehicle.addEquipmentFromTag("medium-laser", "front");
        return vehicle;
    };
    const toHitCells = (): string[] => Array.from(screen.getByText("Medium Laser").closest("tr")!.querySelectorAll("td")).slice(5, 8).map((cell) => cell.textContent ?? "");

    it("shows an Accurate weapon's to-hit one lower with the switch on, and unchanged with it off", () => {
        const vehicle = laserTank();
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} quirksInPlay={true} />);
        const plain = toHitCells();
        cleanup();
        vehicle.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: vehicle.getEquipmentList()[0].uuid });
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} quirksInPlay={true} />);
        expect(toHitCells()).toEqual(plain.map((cell) => `${parseInt(cell, 10) - 1}+`));
        cleanup();
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} />);
        expect(toHitCells()).toEqual(plain);
    });

    // Anti-Aircraft Targeting: -2 against airborne (not grounded) units, not jumping 'Mechs (CO p.225).
    it("gives Anti-Aircraft Targeting -2 once the target is marked airborne", () => {
        const vehicle = laserTank();
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} quirksInPlay={true} />);
        const plain = toHitCells();
        cleanup();
        expect(vehicle.quirks.add({ tag: "quirk-anti-aircraft-targeting" })).toBeNull();
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} quirksInPlay={true} />);
        expect(toHitCells()).toEqual(plain);
        fireEvent.click(screen.getByLabelText("Target airborne"));
        expect(toHitCells()).toEqual(plain.map((cell) => `${parseInt(cell, 10) - 2}+`));
    });

    // The force's game year: a quirk that has ended by then no longer counts (final review).
    it("drops a quirk that has ended by the game year", () => {
        const vehicle = laserTank();
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} quirksInPlay={true} />);
        const plain = toHitCells();
        cleanup();
        const eraStart = vehicle.getEra().yearStart;
        expect(vehicle.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: vehicle.getEquipmentList()[0].uuid, toYear: eraStart + 10 })).toBeNull();
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} quirksInPlay={true} />);
        expect(toHitCells()).toEqual(plain.map((cell) => `${parseInt(cell, 10) - 1}+`));
        cleanup();
        vehicle.quirkPlayYear = eraStart + 20;
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} quirksInPlay={true} />);
        expect(toHitCells()).toEqual(plain);
    });
});

describe("Satellite uplink and HQ in vehicle play (#622, Maximum Tech pp.59, 70)", () => {
    it("switches the uplink on and off and says what it costs the vehicle", () => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag("satellite-uplink", "body");
        const onChange = vi.fn();
        render(<VehiclePlayPanel vehicle={vehicle} onChange={onChange} />);
        const toggle = screen.getByTestId("vehicle-uplink-on") as HTMLInputElement;
        expect(toggle.checked).toBe(true);
        fireEvent.click(toggle);
        expect(vehicle.isSatelliteUplinkActive()).toBe(false);
        expect(onChange).toHaveBeenCalled();
    });

    it("shows no uplink switch without an uplink, and tells when an HQ has lost its bonus", () => {
        const vehicle = new Vehicle();
        for (let i = 0; i < 3; i++) vehicle.addEquipmentFromTag("communications-equipment", "body");
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} />);
        expect(screen.queryByTestId("vehicle-uplink-on")).toBeNull();
        expect(screen.getByTestId("vehicle-hq-status").textContent).toContain("+1 Initiative");
        cleanup();
        vehicle.applyCriticalHit("crewKilled", "front");
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} />);
        expect(screen.getByTestId("vehicle-hq-status").textContent).toContain("no longer");
    });
});
