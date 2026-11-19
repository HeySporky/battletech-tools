// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Vehicle from "../../../../classes/vehicle";
import VehiclePlayPanel from "./_vehiclePlay";

afterEach(cleanup);

// The Thumper ArtVee the class tests build (ArtVee design 2026-10-20).
const thumperArtVee = (): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setTech("is");
    vehicle.setEra("jihad");
    vehicle.setMotiveType("tracked");
    vehicle.setTonnage(60);
    vehicle.setEngineType("xl");
    vehicle.setCruiseMP(4);
    vehicle.setHasTurret(true);
    vehicle.addEquipmentFromTag("custom-artvee-thumper-combo", "turret");
    vehicle.setArtVee(true);
    return vehicle;
};

const movementOptions = () => Array.from((screen.getByLabelText("Movement mode") as HTMLSelectElement).options).map((option) => option.value);

describe("ArtVee play panel", () => {
    it("offers only Stationary while transforming (ArtVee ruling 2026-10-21)", () => {
        const vehicle = thumperArtVee();
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} />);
        expect(movementOptions()).toContain("cruise");
        cleanup();
        vehicle.startArtVeeTransformation();
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} />);
        expect(movementOptions()).toEqual(["stationary"]);
    });

    it("shows Stationary in Siege Mode even when a save holds Cruise", () => {
        const vehicle = thumperArtVee();
        vehicle.startArtVeeTransformation();
        vehicle.turnReset();
        vehicle.getInPlay().movementMode = "cruise";
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} />);
        expect((screen.getByLabelText("Movement mode") as HTMLSelectElement).value).toBe("stationary");
    });

    it("offers Cancel for a declared transformation, but not once damage strands it", () => {
        const vehicle = thumperArtVee();
        vehicle.startArtVeeTransformation();
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} />);
        expect(screen.queryByTestId("vehicle-artvee-cancel")).not.toBeNull();
        cleanup();
        vehicle.applyCriticalHit("weaponDestroyed", "front", "artvee-conversion");
        render(<VehiclePlayPanel vehicle={vehicle} onChange={vi.fn()} />);
        expect(screen.queryByTestId("vehicle-artvee-cancel")).toBeNull();
    });
});

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
