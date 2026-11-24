// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Walker from "../../../../classes/walker";
import { WALKER_LOCATIONS } from "../../../../data/walker-construction";
import WalkerPlayPanel from "./_walkerPlay";

afterEach(cleanup);

/** A 50-ton walker, biped Walking MP 4, full armor, a medium laser on the right front leg and an AC/5 in the left torso. */
const build = (): Walker => {
    const walker = new Walker();
    walker.setTons(50);
    walker.setWalkMP(4);
    for (const location of WALKER_LOCATIONS) walker.setArmor(location, walker.getMaxArmor(location));
    walker.addEquipment("medium-laser", "rfl");
    walker.addEquipment("autocannon-standard-b", "lt");
    walker.addEquipment("ammo-ac-5-standard", "lt");
    return walker;
};

describe("Walker play panel (#172, Chunk F)", () => {
    it("shows four legs, the 1.25 movement, the -3 piloting bonus, arcs and ammunition", () => {
        render(<WalkerPlayPanel walker={build()} onChange={vi.fn()} />);
        expect(screen.getByTestId("walker-play-legs").textContent).toBe("4");
        expect(screen.getByTestId("walker-play-move").textContent).toBe("Walk 5, Run 8");
        expect(screen.getByTestId("walker-play-piloting").textContent).toBe("-3");
        expect(screen.getByTestId("walker-play-kick").textContent).toMatch(/any direction/);
        expect(screen.getByTestId("walker-play-shots-0").textContent).toBe("20");
        expect(screen.getByTestId("walker-play-hit-table").textContent).toMatch(/Rr\/\(Fr\) Rt Leg/);
        expect(screen.getByTestId("walker-play-notes").textContent).toMatch(/No punches/);
    });

    it("plays a walker through two lost legs: biped, then crawl", () => {
        const walker = build();
        const onChange = vi.fn();
        render(<WalkerPlayPanel walker={walker} onChange={onChange} />);
        // A leg's armor and structure and a point more, which passes to the side torso.
        const legPoints = walker.getArmor("lfl") + walker.getStructure("lfl") + 1;
        fireEvent.change(screen.getByTestId("walker-play-damage"), { target: { value: String(legPoints) } });
        fireEvent.change(screen.getByTestId("walker-play-location"), { target: { value: "lfl" } });
        fireEvent.click(screen.getByTestId("walker-play-apply"));
        expect(walker.isLocationDestroyed("lfl")).toBe(true);
        expect(screen.getByTestId("walker-play-legs").textContent).toBe("3");
        expect(screen.getByTestId("walker-play-move").textContent).toBe("Walk 4, Run 6");
        expect(screen.getByTestId("walker-play-kick").textContent).toMatch(/no kicks/i);
        expect(screen.getByTestId("walker-play-log").textContent).toMatch(/passes to the Left Torso/);
        fireEvent.change(screen.getByTestId("walker-play-location"), { target: { value: "rrl" } });
        fireEvent.click(screen.getByTestId("walker-play-apply"));
        expect(screen.getByTestId("walker-play-legs").textContent).toBe("2");
        expect(screen.getByTestId("walker-play-move").textContent).toBe("Crawl 1");
        expect(screen.getByTestId("walker-play-piloting").textContent).toBe("+5");
        expect(onChange).toHaveBeenCalledWith(walker);
    });

    it("rolls the location on the column for the attack direction and logs the cell", () => {
        const walker = build();
        render(<WalkerPlayPanel walker={walker} onChange={vi.fn()} />);
        fireEvent.change(screen.getByTestId("walker-play-direction"), { target: { value: "r" } });
        fireEvent.click(screen.getByTestId("walker-play-roll"));
        expect(screen.getByTestId("walker-play-log").textContent).toMatch(/^Rolled \d+ \(Rear, Front\/\(Rear\) column\)/);
    });

    it("marks a hip hit: the leg ceases to function", () => {
        const walker = build();
        render(<WalkerPlayPanel walker={walker} onChange={vi.fn()} />);
        const hip = walker.getSlots("rfl").indexOf("Hip");
        fireEvent.click(screen.getByTestId(`walker-play-slot-rfl-${hip + 1}`));
        expect(screen.getByTestId("walker-play-legs").textContent).toBe("3");
        expect(screen.getByTestId("walker-play-log").textContent).toMatch(/ceases to function/);
    });

    it("fires a shot", () => {
        const walker = build();
        render(<WalkerPlayPanel walker={walker} onChange={vi.fn()} />);
        fireEvent.click(screen.getByTitle("Fire AC/5 - Standard Ammo"));
        expect(screen.getByTestId("walker-play-shots-0").textContent).toBe("19");
    });
});
