// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMechForce } from "../../../../classes/battlemech-force";
import { ANTI_ORBITAL_AMMO_TAG } from "../../../../classes/space-tracker";
import Vehicle from "../../../../classes/vehicle";
import { AntiOrbitalGunControls, SpaceResolutionDialog } from "./_antiOrbitalControls";

afterEach(cleanup);

// Anti-orbital gun controls and the space-phase resolution (design 2026-10-22; house rules in TRO.md).
const setup = (on: boolean = true) => {
    const vehicle = new Vehicle();
    vehicle.setTech("is");
    vehicle.setEra("jihad");
    vehicle.setMotiveType("tracked");
    vehicle.setTonnage(60);
    vehicle.setName("Long Tom Carrier");
    vehicle.addEquipmentFromTag("long-tom-artillery", "body");
    vehicle.addEquipmentFromTag(ANTI_ORBITAL_AMMO_TAG, "body");
    const force = new BattleMechForce();
    force.groups[0].vehicles.push(vehicle);
    force.spaceInPlay = on;
    return { force, vehicle };
};

const controls = (force: BattleMechForce, vehicle: Vehicle) =>
    render(<AntiOrbitalGunControls force={force} unitUuid={vehicle.getUUID()} onChange={vi.fn()} />);

const fireAt = (hex: string) => {
    fireEvent.change(screen.getByLabelText("Aimed hex"), { target: { value: hex } });
    fireEvent.click(screen.getByRole("button", { name: "Fire anti-orbital" }));
};

describe("anti-orbital gun controls", () => {
    it("renders nothing while the option is off", () => {
        const { force, vehicle } = setup(false);
        const { container } = controls(force, vehicle);
        expect(container.firstChild).toBeNull();
    });

    it("fires and shows the cooldown", () => {
        const { force, vehicle } = setup();
        controls(force, vehicle);
        expect(screen.getByText(/3 shots left/)).toBeTruthy();
        fireAt("0712");
        expect(screen.getByText(/Fires again in 6 ground turns/)).toBeTruthy();
        expect(screen.getByText(/2 shots left/)).toBeTruthy();
        expect(force.spaceTracker.shotsInFlight).toHaveLength(1);
    });

    it("asks for a 2D6 roll to fire early, and a 3 destroys the gun", () => {
        const { force, vehicle } = setup();
        controls(force, vehicle);
        fireAt("0712");
        fireAt("0713");
        expect(screen.getByText(/Enter the 2D6 roll/)).toBeTruthy();
        expect(force.spaceTracker.shotsInFlight).toHaveLength(1);
        fireEvent.change(screen.getByLabelText("2D6 roll"), { target: { value: "3" } });
        fireEvent.click(screen.getByRole("button", { name: "Fire anti-orbital" }));
        expect(screen.getByText(/Destroyed: inoperable for the rest of the game/)).toBeTruthy();
        expect((screen.getByRole("button", { name: "Fire anti-orbital" }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("shows a gun's message only in the turn it was made", () => {
        const { force, vehicle } = setup();
        force.turn = 2;
        const { rerender } = controls(force, vehicle);
        fireAt("0712");
        expect(screen.getByText(/Fired at hex 0712/)).toBeTruthy();
        force.turn = 3;
        rerender(<AntiOrbitalGunControls force={force} unitUuid={vehicle.getUUID()} onChange={vi.fn()} />);
        expect(screen.queryByText(/Fired at hex 0712/)).toBeNull();
    });
});

describe("space resolution dialog", () => {
    it("resolves a due shot with the +4 reminder and the hit damage", () => {
        const { force, vehicle } = setup();
        controls(force, vehicle);
        fireAt("0712");
        cleanup();
        force.turn = 7;
        render(<SpaceResolutionDialog force={force} onChange={vi.fn()} onClose={vi.fn()} />);
        expect(screen.getByText(/Long Tom Carrier/)).toBeTruthy();
        fireEvent.change(screen.getByLabelText("What happened"), { target: { value: "one-hex" } });
        expect(screen.getByText("Normal attack roll at +4")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Hit" }));
        expect(screen.getByText(/2 capital \(20 standard\)/)).toBeTruthy();
        expect(force.spaceTracker.shotsInFlight).toEqual([]);
    });
});
