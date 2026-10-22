// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
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
