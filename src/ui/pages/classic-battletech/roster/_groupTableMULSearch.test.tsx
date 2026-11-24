// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMechForce } from "../../../../classes/battlemech-force";
import type { IAppGlobals } from "../../../app-router";
import BattleArmorGroupTable from "./_battleArmorGroupTable";
import CapitalShipGroupTable from "./_capitalShipGroupTable";
import FighterGroupTable from "./_fighterGroupTable";
import InfantryGroupTable from "./_infantryGroupTable";
import ProtoMechGroupTable from "./_protoMechGroupTable";
import SmallCraftGroupTable from "./_smallCraftGroupTable";
import VehicleGroupTable from "./_vehicleGroupTable";

afterEach(cleanup);

// Ideas #84: the MUL search sat behind the 'Mech table's Add button only; each other table now opens it too.
describe("Classic roster group tables open the Master Unit List search", () => {
    const tables = [
        { label: "vehicles", Table: VehicleGroupTable },
        { label: "fighters", Table: FighterGroupTable },
        { label: "infantry", Table: InfantryGroupTable },
        { label: "battle armor", Table: BattleArmorGroupTable },
        { label: "ProtoMechs", Table: ProtoMechGroupTable },
        { label: "Small Craft", Table: SmallCraftGroupTable },
        { label: "capital ships", Table: CapitalShipGroupTable },
    ];
    for (const { label, Table } of tables) {
        it("shows a Search MUL button on the " + label + " table, even with nothing saved", () => {
            const force = new BattleMechForce();
            force.newGroup();
            const appGlobals = {
                currentCBTForce: force,
                vehicleSaves: [], fighterSaves: [], infantrySaves: [], battleArmorSaves: [], protoMechSaves: [], smallCraftSaves: [], capitalShipSaves: [],
            } as unknown as IAppGlobals;
            const onSearchMUL = vi.fn();
            render(<Table appGlobals={appGlobals} bmGroupIndex={0} showAdd={true} showEdit={true} onSearchMUL={onSearchMUL} />);
            fireEvent.click(screen.getByRole("button", { name: /Search MUL/ }));
            expect(onSearchMUL).toHaveBeenCalledTimes(1);
        });
    }
});
