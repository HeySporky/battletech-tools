// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IEquipmentItem } from "../../data/data-interfaces";
import { getEquipmentListByTech } from "../../data/equipment-registry";
import EquipmentEditForm from "./equipment-edit-form";

afterEach(cleanup);

const ac5 = getEquipmentListByTech("is", true).find((item) => !item.isAmmo && item.name === "Autocannon/5")!;

const renderForm = (item: IEquipmentItem, onChange = vi.fn()) => {
    render(<EquipmentEditForm editingItem={item} onChange={onChange} techBase="is" category="Ballistic" />);
    return onChange;
};

describe("EquipmentEditForm Lore and Rules", () => {
    it("shows the record's Lore and Rules text", () => {
        renderForm({ ...ac5, lore: "Built on Hesperus II.", rules: "Fires twice a turn." });
        expect((screen.getByLabelText("Lore") as HTMLTextAreaElement).value).toBe("Built on Hesperus II.");
        expect((screen.getByLabelText("Rules") as HTMLTextAreaElement).value).toBe("Fires twice a turn.");
    });

    it("shows empty fields on a record with neither", () => {
        renderForm({ ...ac5 });
        expect((screen.getByLabelText("Lore") as HTMLTextAreaElement).value).toBe("");
        expect((screen.getByLabelText("Rules") as HTMLTextAreaElement).value).toBe("");
    });

    it("saves edited Lore and Rules on the item", () => {
        const onChange = renderForm({ ...ac5 });
        fireEvent.change(screen.getByLabelText("Lore"), { target: { value: "A TRO entry." } });
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ lore: "A TRO entry." }));
        fireEvent.change(screen.getByLabelText("Rules"), { target: { value: "+1 to-hit." } });
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ rules: "+1 to-hit." }));
    });
});
