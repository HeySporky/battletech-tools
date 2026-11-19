// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MicroMech from "../../../../classes/micro-mech";
import MicroMechPlayPanel from "./_microMechPlay";

afterEach(cleanup);

/** The Storm STM-3X (Micro-Mechs 6.1.0.2). */
const storm = (): MicroMech => {
    const micro = new MicroMech();
    micro.setTons(11);
    micro.setWalkMP(6);
    micro.setJumpJets(6);
    micro.setName("Storm STM-3X");
    for (const [location, points] of [["head", 4], ["torso", 16], ["torsoRear", 6], ["la", 4], ["ra", 4], ["ll", 6], ["rl", 6]] as const) micro.setArmor(location, points);
    micro.addMount("micro-er-laser-small", "ra");
    micro.addMount("micro-machine-gun", "la");
    micro.setAmmo(1, 500, "torso");
    return micro;
};

describe("Micro-Mech play panel (#173, Chunk F)", () => {
    it("shows the sheet's movement, piloting modifier, slots and ammunition", () => {
        render(<MicroMechPlayPanel micro={storm()} onChange={vi.fn()} />);
        expect(screen.getByTestId("micro-play-move").textContent).toBe("Walk 6, Run 9, Jump 6");
        expect(screen.getByTestId("micro-play-piloting").textContent).toBe("-1");
        expect(screen.getByTestId("micro-play-slot-torso-2").getAttribute("aria-label")).toMatch(/Cockpit/);
        expect(screen.getByTestId("micro-play-shots-0").textContent).toBe("100");
        expect(screen.getByTestId("micro-play-notes").textContent).toMatch(/swarm/);
    });

    it("applies a hit to a leg through the leg and on to the torso", () => {
        const micro = storm();
        const onChange = vi.fn();
        render(<MicroMechPlayPanel micro={micro} onChange={onChange} />);
        fireEvent.change(screen.getByTestId("micro-play-location"), { target: { value: "ll" } });
        fireEvent.change(screen.getByTestId("micro-play-damage"), { target: { value: "12" } });
        fireEvent.click(screen.getByTestId("micro-play-apply"));
        expect(micro.isLocationDestroyed("ll")).toBe(true);
        expect(micro.getArmorLeft("torso")).toBe(13);
        expect(screen.getByTestId("micro-play-move").textContent).toBe("Walk 1, Run 0, Jump 5");
        expect(screen.getByTestId("micro-play-log").textContent).toMatch(/passes to the torso/);
        expect(onChange).toHaveBeenCalledWith(micro);
    });

    it("marks an engine slot hit and stops the energy weapons; the second destroys the unit", () => {
        const micro = storm();
        render(<MicroMechPlayPanel micro={micro} onChange={vi.fn()} />);
        fireEvent.click(screen.getByTestId("micro-play-slot-torso-3"));
        expect(screen.getByText(/No energy weapons/)).toBeTruthy();
        fireEvent.click(screen.getByTestId("micro-play-slot-torso-4"));
        expect(screen.getByTestId("micro-play-destroyed").textContent).toMatch(/engine/);
    });

    it("fires a shot", () => {
        const micro = storm();
        render(<MicroMechPlayPanel micro={micro} onChange={vi.fn()} />);
        fireEvent.click(screen.getByTitle("Fire Machine Gun"));
        expect(screen.getByTestId("micro-play-shots-0").textContent).toBe("99");
    });
});
