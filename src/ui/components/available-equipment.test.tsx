// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCompatibleAmmo, getEquipmentListByTech } from "../../data/equipment-registry";
import type { IAppGlobals } from "../app-router";
import AvailableEquipment from "./available-equipment";

afterEach(cleanup);

const list = getEquipmentListByTech("is", true).map((item) => ({ ...item, available: true }));
const ac5 = list.find((item) => !item.isAmmo && item.name === "Autocannon/5")!;
const ac5Ammo = list.find((item) => item.tag === "ammo-ac-5-standard")!;
const lrmAmmo = list.find((item) => item.tag === "ammo-is-lrm-artemis-iv")!;

const renderList = (mounted?: typeof list) => {
    const appGlobals = {
        appSettings: { equipmentFilter: "", installEquipCategory: "Ammunition" },
        saveAppSettings: vi.fn(),
    } as unknown as IAppGlobals;
    render(<AvailableEquipment appGlobals={appGlobals} equipment={[ac5, ac5Ammo, lrmAmmo]} mounted={mounted} addFunction={() => true} />);
};

describe("AvailableEquipment ammunition", () => {
    it("finds the records the tests use", () => {
        expect(getCompatibleAmmo(ac5, ac5Ammo)).toBeTruthy();
        expect(getCompatibleAmmo(ac5, lrmAmmo)).toBeFalsy();
    });

    it("lists only ammunition a mounted weapon fires, until Show all ammunition is ticked", () => {
        renderList([ac5]);
        expect(screen.queryByText(ac5Ammo.name)).not.toBeNull();
        expect(screen.queryByText(lrmAmmo.name)).toBeNull();
        const showAll = screen.getByLabelText(/Show all ammunition/) as HTMLInputElement;
        expect(showAll.checked).toBe(false);
        fireEvent.click(showAll);
        expect(screen.queryByText(lrmAmmo.name)).not.toBeNull();
    });

    it("lists no ammunition when no weapon is mounted", () => {
        renderList([]);
        expect(screen.queryByText(ac5Ammo.name)).toBeNull();
    });

    it("lists every ammunition record on a page that does not pass its mounted equipment", () => {
        renderList();
        expect(screen.queryByText(lrmAmmo.name)).not.toBeNull();
        expect(screen.queryByLabelText(/Show all ammunition/)).toBeNull();
    });
});
