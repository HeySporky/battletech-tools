// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMech } from "../../test-support/builders";
import HandheldWeaponPanel from "./handheld-weapon-panel";

afterEach(cleanup);

describe("the handheld weapon panel (#611)", () => {
    it("builds a handheld weapon in the equipment step, with its weight and BV worked out", () => {
        const mech = buildMech({ tonnage: 50, walk: 4 });
        mech.setRulesEdition("total-warfare");
        const saved = vi.fn();
        render(<HandheldWeaponPanel mech={mech} rulesLevel={4} onChange={saved} />);
        fireEvent.change(screen.getByTestId("handheld-add"), { target: { value: "medium-laser" } });
        expect(saved).toHaveBeenCalled();
        expect(mech.getHandheldWeapon()?.entries).toEqual([{ tag: "medium-laser" }]);
        expect(screen.getByTestId("handheld-summary").textContent).toMatch(/4 tons \(3 heat sinks\)/);
        expect(screen.getByTestId("handheld-summary").textContent).toMatch(/BV 46/);
        expect(screen.getByText(/No Alpha Strike conversion/)).not.toBeNull();
    });

    it("is not shown where the edition and rules level do not offer it", () => {
        const mech = buildMech({ tonnage: 50, walk: 4 });
        mech.setRulesEdition("total-warfare");
        render(<HandheldWeaponPanel mech={mech} rulesLevel={2} onChange={() => undefined} />);
        expect(screen.queryByTestId("handheld-weapon")).toBeNull();
    });
});
