// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMechForce } from "../../../../classes/battlemech-force";
import Walker from "../../../../classes/walker";
import type { IAppGlobals } from "../../../app-router";
import WalkerGroupTable from "./_walkerGroupTable";

afterEach(cleanup);

const save = () => {
    const walker = new Walker();
    walker.setTons(50);
    walker.setWalkMP(4);
    walker.setName("Mule MUL-4W");
    return walker.export();
};

const setup = (saves: ReturnType<typeof save>[]) => {
    const force = new BattleMechForce();
    force.newGroup();
    const saveCurrentCBTForce = vi.fn();
    const appGlobals = { currentCBTForce: force, walkerSaves: saves, saveCurrentCBTForce } as unknown as IAppGlobals;
    return { force, appGlobals, saveCurrentCBTForce };
};

describe("Walker roster table (#172, Chunk E)", () => {
    it("adds a saved Walker to the group as its own copy", () => {
        const { force, appGlobals, saveCurrentCBTForce } = setup([save()]);
        render(<WalkerGroupTable appGlobals={appGlobals} bmGroupIndex={0} showAdd={true} showEdit={true} />);
        fireEvent.change(screen.getByLabelText("Saved Walker to add"), { target: { value: "0" } });
        fireEvent.click(screen.getByRole("button", { name: /Add Walker/ }));
        expect(force.groups[0].walkers).toHaveLength(1);
        expect(force.groups[0].walkers[0].getName()).toBe("Mule MUL-4W");
        expect(force.groups[0].walkers[0].getUUID()).not.toBe(appGlobals.walkerSaves[0].uuid);
        expect(saveCurrentCBTForce).toHaveBeenCalled();
    });

    it("shows nothing when the user holds no Walker and the group has none", () => {
        const { appGlobals } = setup([]);
        const { container } = render(<WalkerGroupTable appGlobals={appGlobals} bmGroupIndex={0} showAdd={true} showEdit={true} />);
        expect(container.querySelector('[data-testid="walker-group-table"]')).toBeNull();
    });

    it("lists a group's Walker with its tonnage and Battle Value, and the roster total includes it", () => {
        const { force, appGlobals } = setup([]);
        const walker = new Walker(JSON.stringify(save()));
        force.groups[0].walkers.push(walker);
        render(<WalkerGroupTable appGlobals={appGlobals} bmGroupIndex={0} showAdd={false} showEdit={false} />);
        expect(screen.getByText("Mule MUL-4W")).toBeTruthy();
        expect(screen.getByText(/fan-made, NOT OFFICIAL/)).toBeTruthy();
        expect(force.groups[0].getTotalBattleValue()).toBe(walker.getBattleValue());
    });

    it("sets the pilot's skills, which adjust the Battle Value and the roster total (Chunk F)", () => {
        const { force, appGlobals, saveCurrentCBTForce } = setup([]);
        const walker = new Walker(JSON.stringify(save()));
        force.groups[0].walkers.push(walker);
        render(<WalkerGroupTable appGlobals={appGlobals} bmGroupIndex={0} showAdd={false} showEdit={true} />);
        fireEvent.change(screen.getByLabelText("Walker gunnery skill"), { target: { value: "3" } });
        fireEvent.change(screen.getByLabelText("Walker piloting skill"), { target: { value: "4" } });
        expect(walker.getGunnery()).toBe(3);
        expect(walker.getPiloting()).toBe(4);
        expect(saveCurrentCBTForce).toHaveBeenCalled();
        expect(walker.getSkillAdjustedBattleValue()).toBeGreaterThan(walker.getBattleValue());
        expect(force.groups[0].getTotalBattleValue()).toBe(walker.getSkillAdjustedBattleValue());
        expect(screen.getByTestId("walker-group-bv-0").textContent).toMatch(/Base:/);
    });

    it("keeps a Walker's damage in the group save, and leaves it out when asked", () => {
        const { force } = setup([]);
        const walker = new Walker(JSON.stringify(save()));
        walker.setArmor("ct", 10);
        walker.applyDamage("ct", 4);
        force.groups[0].walkers.push(walker);
        expect(force.groups[0].export().walkers?.[0].inPlay).toEqual({ armor: { ct: 4 } });
        expect(force.groups[0].export(true).walkers?.[0].inPlay).toBeUndefined();
    });

    it("removes a Walker after the confirmation", () => {
        const { force, appGlobals } = setup([]);
        force.groups[0].walkers.push(new Walker(JSON.stringify(save())));
        const openConfirmDialog = vi.fn((_title: string, _text: string, _yes: string, _no: string, onYes: () => void) => onYes());
        (appGlobals as unknown as { openConfirmDialog: typeof openConfirmDialog }).openConfirmDialog = openConfirmDialog;
        render(<WalkerGroupTable appGlobals={appGlobals} bmGroupIndex={0} showAdd={false} showEdit={true} />);
        fireEvent.click(screen.getByTitle("Click here to remove this Walker."));
        expect(openConfirmDialog).toHaveBeenCalled();
        expect(force.groups[0].walkers).toHaveLength(0);
    });
});
