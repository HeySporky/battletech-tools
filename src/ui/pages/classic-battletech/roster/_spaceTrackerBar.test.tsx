// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMechForce } from "../../../../classes/battlemech-force";
import SpaceTrackerBar from "./_spaceTrackerBar";

afterEach(cleanup);

// Space turn tracker (design 2026-10-22): two clocks in the turn bar, and the shots in flight.
const forceAt = (turn: number, on: boolean = true): BattleMechForce => {
    const force = new BattleMechForce();
    force.spaceInPlay = on;
    force.turn = turn;
    return force;
};

describe("space tracker bar", () => {
    it("renders nothing while the option is off", () => {
        const { container } = render(<SpaceTrackerBar force={forceAt(7, false)} onResolve={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    it("shows the space turn and the countdown", () => {
        render(<SpaceTrackerBar force={forceAt(7)} onResolve={vi.fn()} />);
        expect(screen.getByText(/Space turn 2/)).toBeTruthy();
        expect(screen.getByText(/next in 6 ground turns/)).toBeTruthy();
        cleanup();
        render(<SpaceTrackerBar force={forceAt(12)} onResolve={vi.fn()} />);
        expect(screen.getByText(/next in 1 ground turn$/)).toBeTruthy();
    });

    it("lists shots in flight and offers to resolve the due ones", () => {
        const force = forceAt(3);
        force.spaceTracker.shotsInFlight.push({
            id: "s1", gunKey: "u:w", unitName: "Long Tom Carrier", weaponName: "Long Tom Artillery", aimedHex: "0712",
            targetName: "Lola III", firedGroundTurn: 2, firedSpaceTurn: 1,
        });
        render(<SpaceTrackerBar force={force} onResolve={vi.fn()} />);
        expect(screen.getByText("Long Tom Carrier: Long Tom Artillery at hex 0712 (Lola III)")).toBeTruthy();
        expect(screen.queryByRole("button", { name: /Resolve/ })).toBeNull();
        cleanup();
        force.turn = 7;
        const onResolve = vi.fn();
        render(<SpaceTrackerBar force={force} onResolve={onResolve} />);
        fireEvent.click(screen.getByRole("button", { name: "Resolve 1 shot" }));
        expect(onResolve).toHaveBeenCalledOnce();
    });
});
