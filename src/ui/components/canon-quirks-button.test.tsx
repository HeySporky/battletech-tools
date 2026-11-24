// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../classes/battlemech";
import CanonQuirksButton from "./canon-quirks-button";

afterEach(cleanup);

const LABEL = "Apply canon quirks (BMM pp.90-95)";

describe("CanonQuirksButton", () => {
    it("shows nothing for a chassis the table does not list", () => {
        const mech = new BattleMech();
        mech.setModel("No Such 'Mech");
        render(<CanonQuirksButton unit={mech} onApplied={vi.fn()} />);
        expect(screen.queryByRole("button", { name: LABEL })).toBeNull();
    });

    it("applies the quirks, says how many it added and lists each note", () => {
        const mech = new BattleMech();
        mech.setModel("Avatar");
        const onApplied = vi.fn();
        render(<CanonQuirksButton unit={mech} onApplied={onApplied} />);
        fireEvent.click(screen.getByRole("button", { name: LABEL }));
        expect(onApplied).toHaveBeenCalledTimes(1);
        expect(screen.getByText("Added 0 canon quirks.")).toBeTruthy();
        expect(screen.getByText("Stabilized Weapon: no Medium Laser in the CT on this 'Mech, not applied")).toBeTruthy();
    });

    it("says one quirk in the singular", () => {
        const mech = new BattleMech();
        mech.setModel("Catapult");
        mech.quirks.add({ tag: "quirk-no-minimal-arms" });
        render(<CanonQuirksButton unit={mech} onApplied={vi.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: LABEL }));
        expect(screen.getByText("Added 1 canon quirk.")).toBeTruthy();
    });

    // The message is about the 'Mech as it was; it goes once the quirks change or another 'Mech loads (final review).
    it("drops its message once the quirks change", () => {
        const mech = new BattleMech();
        mech.setModel("Catapult");
        const { rerender } = render(<CanonQuirksButton unit={mech} onApplied={vi.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: LABEL }));
        expect(screen.queryByText(/^Added /)).not.toBeNull();
        mech.quirks.remove(0);
        rerender(<CanonQuirksButton unit={mech} onApplied={vi.fn()} />);
        expect(screen.queryByText(/^Added /)).toBeNull();
    });

    it("drops its message when another 'Mech loads", () => {
        const mech = new BattleMech();
        mech.setModel("Catapult");
        const { rerender } = render(<CanonQuirksButton unit={mech} onApplied={vi.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: LABEL }));
        const other = new BattleMech();
        other.setModel("Catapult");
        rerender(<CanonQuirksButton unit={other} onApplied={vi.fn()} />);
        expect(screen.queryByText(/^Added /)).toBeNull();
    });
});
