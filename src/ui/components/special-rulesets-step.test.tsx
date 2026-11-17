// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { btSpecialRulesets, findSpecialRuleset } from "../../data/special-rulesets";
import { testSpecialRuleset } from "../../test-support/rulesets";
import SpecialRulesetsStep from "./special-rulesets-step";

/** The Special Rulesets window as a grouped checklist (#324, window refactor Tasks 4-5). */
afterEach(() => {
    cleanup();
    for (const id of ["test-a", "test-b"]) {
        const index = btSpecialRulesets.findIndex((ruleset) => ruleset.id === id);
        if (index >= 0) btSpecialRulesets.splice(index, 1);
    }
});

const FLINT_11 = "Future Wars: Alternate 'Mech construction (Future Wars #11 printing)";
const open = (rulesets: string[] = [], onToggle: (ids: string[]) => void = () => undefined) => {
    render(<SpecialRulesetsStep rulesets={rulesets} notice="" onToggle={onToggle} />);
    fireEvent.click(screen.getByText("Choose rulesets", { selector: "button" }) ?? undefined);
};
const openFromNo = (rulesets: string[] = [], onToggle: (ids: string[]) => void = () => undefined) => {
    render(<SpecialRulesetsStep rulesets={rulesets} notice="" onToggle={onToggle} />);
    fireEvent.change(screen.getByLabelText("Special Rulesets:"), { target: { value: "yes" } });
};
// The button is named by hidden text after "More info"; happy-dom may put a space before it.
const moreInfo = (name: string) => screen.getByRole("button", { name: new RegExp("^More info\\s*: " + name.replace(/[()]/g, "\\$&") + "$") });
const rows = () => document.querySelectorAll("[data-testid^='ruleset-row-']");
const reasonOf = (name: string) => document.getElementById(screen.getByLabelText(name).getAttribute("aria-describedby") ?? "")?.textContent ?? "";

describe("SpecialRulesetsStep list", () => {
    it("groups the rulesets by category with ticked counts", () => {
        open(["fw-power-armor"]);
        expect(screen.getByText("Construction (1 of 3 ticked)")).toBeTruthy();
        expect(screen.getByText("Play (0 of 6 ticked)")).toBeTruthy();
        expect(screen.getByText("Setting (0 of 1 ticked)")).toBeTruthy();
    });

    it("shows tag and summary on a row, the full description only in More info", () => {
        openFromNo();
        const row = screen.getByTestId("ruleset-row-fw-power-armor");
        expect(row.textContent).toContain("FW #14");
        expect(row.textContent).toContain(findSpecialRuleset("fw-power-armor")!.summary);
        expect(row.textContent).not.toContain("No weapons in the head or center torso.");
        expect(moreInfo("Future Wars: Power Armor")).toBeTruthy();
    });

    it("disables a clashing ruleset and says why", () => {
        open(["fw-power-armor"]);
        expect((screen.getByLabelText(FLINT_11) as HTMLInputElement).disabled).toBe(true);
        expect(reasonOf(FLINT_11)).toContain("both change 'Mech construction");
        expect((screen.getByLabelText("Future Wars: Power Armor") as HTMLInputElement).disabled).toBe(false);
    });

    it("keeps a saved pair that no longer fits ticked, warned and untickable", () => {
        btSpecialRulesets.push(
            testSpecialRuleset({ id: "test-a", name: "A", changes: ["a"], excludes: ["test-b"] }),
            testSpecialRuleset({ id: "test-b", name: "B", changes: ["b"] }),
        );
        open(["test-a", "test-b"]);
        for (const name of ["A", "B"]) {
            const box = screen.getByLabelText(name) as HTMLInputElement;
            expect(box.checked).toBe(true);
            expect(box.disabled).toBe(false);
            expect(reasonOf(name)).toContain("Cannot be used with");
        }
    });

    it("filters by search, source and the two toggles, and offers Clear filters", () => {
        openFromNo();
        expect(rows().length).toBe(btSpecialRulesets.length);
        fireEvent.change(screen.getByLabelText("Search rulesets"), { target: { value: "Bruanning" } });
        expect(rows().length).toBe(1);
        fireEvent.change(screen.getByLabelText("Search rulesets"), { target: { value: "" } });
        fireEvent.change(screen.getByLabelText("Source"), { target: { value: "r/battletech" } });
        expect(rows().length).toBe(1);
        fireEvent.change(screen.getByLabelText("Source"), { target: { value: "" } });
        fireEvent.click(screen.getByLabelText("Show ticked only"));
        expect(rows().length).toBe(0);
        expect(screen.getByText("No rulesets match.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
        expect(rows().length).toBe(btSpecialRulesets.length);
    });

    it("hides unavailable rulesets on request", () => {
        open(["fw-power-armor"]);
        fireEvent.click(screen.getByLabelText("Hide unavailable"));
        expect(screen.queryByTestId("ruleset-row-future-wars-11-construction")).toBeNull();
        expect(screen.getByTestId("ruleset-row-fw-power-armor")).toBeTruthy();
    });

    it("calls onToggle with the ruleset id", () => {
        const onToggle = vi.fn();
        openFromNo([], onToggle);
        fireEvent.click(screen.getByLabelText("Future Wars: Morale"));
        expect(onToggle).toHaveBeenCalledWith(["fw-morale"]);
    });
});
