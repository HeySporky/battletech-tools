// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { BattleMech } from "../../classes/battlemech";
import MechViewPanel from "./mech-view-panel";

afterEach(cleanup);

describe("MechViewPanel", () => {
    // The roster's view kept the record sheet off to the side of the TRO (#372): a click on it fills the width.
    it("shows the record sheet alone when clicked, and the TRO again on a second click", () => {
        const mech = new BattleMech();
        mech.setName("Atlas");
        const { container } = render(<MechViewPanel mech={mech} />);
        const sheet = screen.getByRole("button", { name: "Record sheet, full width" });
        expect(container.querySelectorAll(".col")).toHaveLength(2);
        fireEvent.click(sheet);
        expect(sheet.getAttribute("aria-pressed")).toBe("true");
        expect(container.querySelectorAll(".col")).toHaveLength(1);
        fireEvent.click(sheet);
        expect(container.querySelectorAll(".col")).toHaveLength(2);
    });

    // The Battle Value and cost breakdown (#599) sits under a disclosure, closed until asked for.
    it("opens the Battle Value and cost breakdown on request", () => {
        const mech = new BattleMech();
        render(<MechViewPanel mech={mech} />);
        const toggle = screen.getByRole("button", { name: "Battle Value and cost breakdown" });
        expect(toggle.getAttribute("aria-expanded")).toBe("false");
        expect(screen.queryByLabelText("Rules edition")).toBeNull();
        fireEvent.click(toggle);
        expect(toggle.getAttribute("aria-expanded")).toBe("true");
        expect((screen.getByLabelText("Rules edition") as HTMLSelectElement).value).toBe(mech.getRulesEdition());
        expect(screen.getByRole("region", { name: "Cost" })).toBeTruthy();
        expect(screen.queryByText(/Master Unit List/)).toBeNull();
    });

    it("shows the Master Unit List's Battle Value beside ours for a bundled design", () => {
        const mech = new BattleMech();
        render(<MechViewPanel mech={mech} mulBattleValue={mech.getBattleValue()} />);
        fireEvent.click(screen.getByRole("button", { name: "Battle Value and cost breakdown" }));
        expect(screen.getByText(new RegExp(`Master Unit List: ${mech.getBattleValue().toLocaleString("en-US")}`))).toBeTruthy();
    });

    it("links to the accuracy record when our Battle Value differs from the Master Unit List", () => {
        const mech = new BattleMech();
        render(<MemoryRouter><MechViewPanel mech={mech} mulBattleValue={mech.getBattleValue() + 5} /></MemoryRouter>);
        fireEvent.click(screen.getByRole("button", { name: "Battle Value and cost breakdown" }));
        expect(screen.getByRole("link", { name: "See the Battle Value accuracy record" }).getAttribute("href")).toMatch(/\/classic-battletech\/battle-value-accuracy$/);
    });
});
