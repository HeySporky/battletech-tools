// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMechForce } from "../../../../classes/battlemech-force";
import MicroMech from "../../../../classes/micro-mech";
import type { IAppGlobals } from "../../../app-router";
import MicroMechGroupTable from "./_microMechGroupTable";

afterEach(cleanup);

const save = () => {
    const micro = new MicroMech();
    micro.setTons(11);
    micro.setWalkMP(6);
    micro.setName("Storm STM-3X");
    return micro.export();
};

const setup = (saves: ReturnType<typeof save>[]) => {
    const force = new BattleMechForce();
    force.newGroup();
    const saveCurrentCBTForce = vi.fn();
    const appGlobals = { currentCBTForce: force, microMechSaves: saves, saveCurrentCBTForce } as unknown as IAppGlobals;
    return { force, appGlobals, saveCurrentCBTForce };
};

describe("Micro-Mech roster table (#173, Chunk E)", () => {
    it("adds a saved Micro-Mech to the group as its own copy", () => {
        const { force, appGlobals, saveCurrentCBTForce } = setup([save()]);
        render(<MicroMechGroupTable appGlobals={appGlobals} bmGroupIndex={0} showAdd={true} showEdit={true} />);
        fireEvent.change(screen.getByLabelText("Saved Micro-Mech to add"), { target: { value: "0" } });
        fireEvent.click(screen.getByRole("button", { name: /Add Micro-Mech/ }));
        expect(force.groups[0].microMechs).toHaveLength(1);
        expect(force.groups[0].microMechs[0].getName()).toBe("Storm STM-3X");
        expect(force.groups[0].microMechs[0].getUUID()).not.toBe(appGlobals.microMechSaves[0].uuid);
        expect(saveCurrentCBTForce).toHaveBeenCalled();
    });

    it("shows nothing when the user holds no Micro-Mech and the group has none", () => {
        const { appGlobals } = setup([]);
        const { container } = render(<MicroMechGroupTable appGlobals={appGlobals} bmGroupIndex={0} showAdd={true} showEdit={true} />);
        expect(container.querySelector('[data-testid="micro-mech-group-table"]')).toBeNull();
    });

    it("sets the pilot's Gunnery and Piloting, and the group's Battle Value takes the skill multiplier (Chunk F)", () => {
        const { force, appGlobals, saveCurrentCBTForce } = setup([]);
        const micro = new MicroMech(JSON.stringify(save()));
        force.groups[0].microMechs.push(micro);
        const base = force.groups[0].getTotalBattleValue();
        expect(base).toBe(micro.getBattleValue());
        render(<MicroMechGroupTable appGlobals={appGlobals} bmGroupIndex={0} showAdd={false} showEdit={true} />);
        fireEvent.change(screen.getByLabelText("Micro-Mech gunnery skill"), { target: { value: "3" } });
        fireEvent.change(screen.getByLabelText("Micro-Mech piloting skill"), { target: { value: "4" } });
        expect([micro.getGunnery(), micro.getPiloting()]).toEqual([3, 4]);
        expect(force.groups[0].getTotalBattleValue()).toBe(micro.getSkillAdjustedBattleValue());
        expect(force.groups[0].getTotalBattleValue()).toBeGreaterThan(base);
        expect(saveCurrentCBTForce).toHaveBeenCalled();
    });

    it("lists a group's Micro-Mech with its tonnage and Battle Value", () => {
        const { force, appGlobals } = setup([]);
        force.groups[0].microMechs.push(new MicroMech(JSON.stringify(save())));
        render(<MicroMechGroupTable appGlobals={appGlobals} bmGroupIndex={0} showAdd={false} showEdit={false} />);
        expect(screen.getByText("Storm STM-3X")).toBeTruthy();
        expect(screen.getByText(/fan-made, NOT OFFICIAL/)).toBeTruthy();
    });
});
