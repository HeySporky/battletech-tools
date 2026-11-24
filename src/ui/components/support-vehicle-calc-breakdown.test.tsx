// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import Vehicle from "../../classes/vehicle";
import { SupportVehicleCalcBreakdown } from "./support-vehicle-calc-breakdown";

afterEach(cleanup);

const truck = (): Vehicle => {
    const unit = new Vehicle();
    unit.setMotiveType("wheeled");
    unit.setSupportVehicle(true);
    unit.setTonnage(20);
    unit.setCruiseMP(4);
    unit.addEquipmentFromTag("machine-gun");
    unit.addEquipmentFromTag("ammo-machine-gun-standard");
    return unit;
};

describe("SupportVehicleCalcBreakdown (#599, #600)", () => {
    it("offers the Total Warfare edition alone, with the Support Vehicle BV2 and cost steps", () => {
        const { container } = render(<MemoryRouter><SupportVehicleCalcBreakdown vehicle={truck()} /></MemoryRouter>);
        const select = screen.queryByLabelText("Rules edition") as HTMLSelectElement | null;
        if (select) expect([...select.options].map((option) => option.value)).toEqual(["total-warfare"]);
        expect(container.querySelector(".calc-breakdown-result")?.textContent).toBe(truck().getBattleValue("total-warfare").toLocaleString("en-US"));
        expect(screen.getAllByText(/TM .*316/).length).toBeGreaterThan(0);
        expect(screen.getAllByText("TM p.280").length).toBeGreaterThan(0);
    });

    it("shows a bundled design's MUL BV beside ours", () => {
        const ours = truck().getBattleValue("total-warfare");
        render(<MemoryRouter><SupportVehicleCalcBreakdown vehicle={truck()} mulBattleValue={ours + 3} /></MemoryRouter>);
        expect(screen.getByText(/Master Unit List: /).textContent).toContain(`${(ours + 3).toLocaleString("en-US")}. The JBT value differs by -3`);
    });
});
