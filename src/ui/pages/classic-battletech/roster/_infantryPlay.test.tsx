// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import InfantryPlatoon from "../../../../classes/infantry-platoon";
import InfantryPlayPanel from "./_infantryPlay";

afterEach(cleanup);

const specialist = (motive: string, specialties: string[]): InfantryPlatoon => {
    const platoon = new InfantryPlatoon();
    platoon.setMotive(motive);
    for (const tag of specialties) platoon.setSpecialty(tag, true);
    platoon.setGunnery(3);
    return platoon;
};

describe("Infantry play panel: specialized infantry (TO:AUE pp.152-153, 162-163)", () => {
    it("shows no specialist controls for a plain platoon", () => {
        render(<InfantryPlayPanel platoon={new InfantryPlatoon()} onChange={vi.fn()} />);
        expect(screen.queryByTestId("infantry-specialties")).toBeNull();
    });

    it("keeps the bridge-building counters: a turn of work, and a bridge raised after six", () => {
        const platoon = specialist("foot", ["engineers"]);
        platoon.setEngineerTasks(["bridge"]);
        const { rerender } = render(<InfantryPlayPanel platoon={platoon} onChange={vi.fn()} />);
        expect(screen.getByTestId("infantry-engineers").textContent).toContain("0 of 6 turns");
        for (let turn = 0; turn < 6; turn++) {
            fireEvent.click(screen.getByText("Work a Turn"));
            rerender(<InfantryPlayPanel platoon={platoon} onChange={vi.fn()} />);
        }
        expect(screen.getByTestId("infantry-engineers").textContent).toContain("6 of 6 turns");
        fireEvent.click(screen.getByText("Raise Light Bridge"));
        expect(screen.getByTestId("infantry-play-log").textContent).toContain("A light bridge is raised in one hex: CF 15");
    });

    it("works the paratroop drop, the paramedics and the TAG attack", () => {
        const paratroops = specialist("foot", ["paratroops"]);
        paratroops.setSquads(2);
        render(<InfantryPlayPanel platoon={paratroops} onChange={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText("7, 3, 9"), { target: { value: "2, 8" } });
        fireEvent.click(screen.getByText("Resolve the Combat Drop"));
        expect(paratroops.getCurrentTroopers()).toBe(paratroops.getTroopers() - 1);
        cleanup();

        const medics = specialist("foot", []);
        medics.setParamedicsPerSquad(1);
        medics.setTagTroopersPerSquad(1);
        render(<InfantryPlayPanel platoon={medics} onChange={vi.fn()} />);
        expect(screen.getByTestId("infantry-paramedics").textContent).toContain("tending up to 20 wounded");
        fireEvent.click(screen.getByText("Tend the Wounded"));
        fireEvent.click(screen.getByText("TAG Attack (3/6/9)"));
        expect(screen.getByTestId("infantry-play-log").textContent).toContain("TAG only works with at least 2 troopers a squad");
    });

    it("works out XCT damage in its environment", () => {
        const xct = specialist("foot", []);
        xct.setXCT("liquid");
        xct.setArmor("inf-armor-engineering-suit");
        render(<InfantryPlayPanel platoon={xct} onChange={vi.fn()} />);
        fireEvent.click(screen.getByText("Work Out the Damage"));
        expect(screen.getByTestId("infantry-play-log").textContent).toContain("5 hazardous liquid damage divided by 3, rounded down, at least 1: 1");
    });
});
