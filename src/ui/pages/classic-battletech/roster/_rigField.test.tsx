// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMechForce } from "../../../../classes/battlemech-force";
import { buildVehicle } from "../../../../test-support/builders";
import { RigField } from "./_vehicleGroupTable";

afterEach(cleanup);

describe("the roster rig field (Maximum Tech p.92)", () => {
    const setup = () => {
        const force = new BattleMechForce();
        const tractor = buildVehicle("wheeled", 50);
        const trailer = buildVehicle("wheeled", 10);
        trailer.setCruiseMP(0);
        force.groups[0].vehicles.push(tractor, trailer);
        return { force, tractor, trailer };
    };

    it("links a trailer to its tractor from the picker and says what the rig moves at", () => {
        const { force, tractor, trailer } = setup();
        const onChange = vi.fn();
        render(<RigField force={force} unit={trailer} edit={true} onChange={onChange} />);
        fireEvent.change(screen.getByTestId("rig-tractor-select"), { target: { value: tractor.getUUID() } });
        expect(force.getRigTractor(trailer.getUUID())).toBe(tractor.getUUID());
        expect(onChange).toHaveBeenCalled();
        cleanup();
        render(<RigField force={force} unit={tractor} edit={false} onChange={onChange} />);
        expect(screen.getByTestId("rig-note").textContent).toMatch(/Pulls:.*rig Flank 5/);
    });

    it("shows the refusal when the trailers are too heavy", () => {
        const { force, tractor } = setup();
        const heavy = buildVehicle("wheeled", 60);
        heavy.setCruiseMP(0);
        force.groups[0].vehicles.push(heavy);
        render(<RigField force={force} unit={heavy} edit={true} onChange={vi.fn()} />);
        fireEvent.change(screen.getByTestId("rig-tractor-select"), { target: { value: tractor.getUUID() } });
        expect(screen.getByTestId("rig-labels").textContent).toMatch(/weigh 60 t/);
    });
});
