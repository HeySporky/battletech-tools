// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getFutureWarsPlayRules } from "../../data/future-wars-play-rules";
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

const MORALE = "Future Wars: Morale (Best of Future Wars printing)";
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
        expect(screen.getByText("Construction (1 of 7 ticked)")).toBeTruthy();
        expect(screen.getByText("Play (0 of 11 ticked)")).toBeTruthy();
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
        // A unit's window leaves the campaign rulesets out (NGCFells's builder's call 6).
        const unitRulesets = btSpecialRulesets.filter((ruleset) => ruleset.category !== "campaign").length;
        expect(rows().length).toBe(unitRulesets);
        fireEvent.change(screen.getByLabelText("Search rulesets"), { target: { value: "Bruanning" } });
        expect(rows().length).toBe(2); // Weapon Malfunctions in both printings
        fireEvent.change(screen.getByLabelText("Search rulesets"), { target: { value: "" } });
        fireEvent.change(screen.getByLabelText("Source"), { target: { value: "r/battletech" } });
        expect(rows().length).toBe(1);
        fireEvent.change(screen.getByLabelText("Source"), { target: { value: "" } });
        fireEvent.click(screen.getByLabelText("Show ticked only"));
        expect(rows().length).toBe(0);
        expect(screen.getByText("No rulesets match.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
        expect(rows().length).toBe(unitRulesets);
    });

    it("opens a folded group while a search is on", () => {
        openFromNo();
        const play = screen.getByTestId("ruleset-group-play") as HTMLDetailsElement;
        play.open = false;
        fireEvent(play, new Event("toggle"));
        expect(play.open).toBe(false);
        fireEvent.change(screen.getByLabelText("Search rulesets"), { target: { value: "Barents" } });
        expect((screen.getByTestId("ruleset-group-play") as HTMLDetailsElement).open).toBe(true);
    });

    it("hides unavailable rulesets on request", () => {
        open(["fw-power-armor"]);
        fireEvent.click(screen.getByLabelText("Hide unavailable"));
        expect(screen.queryByTestId("ruleset-row-future-wars-11-construction")).toBeNull();
        expect(screen.getByTestId("ruleset-row-fw-power-armor")).toBeTruthy();
    });

    it("opens More info in the same window and comes back to the same list", () => {
        openFromNo();
        fireEvent.change(screen.getByLabelText("Search rulesets"), { target: { value: "Barents" } });
        const button = moreInfo(MORALE);
        fireEvent.click(button);
        const detail = screen.getByTestId("ruleset-detail-fw-morale");
        expect(detail.textContent).toContain("Author: Herb Barents");
        expect(detail.textContent).toContain(getFutureWarsPlayRules("fw-morale")!.tables[0].title);
        expect(detail.textContent).toContain(findSpecialRuleset("fw-morale")!.description);
        expect(screen.getByTestId("ruleset-row-fw-morale").closest("[hidden]")).not.toBeNull();
        expect(document.activeElement?.textContent).toContain("Back to list");
        fireEvent.click(screen.getByRole("button", { name: /Back to list/ }));
        expect(screen.queryByTestId("ruleset-detail-fw-morale")).toBeNull();
        expect((screen.getByLabelText("Search rulesets") as HTMLInputElement).value).toBe("Barents");
        expect(document.activeElement).toBe(moreInfo(MORALE));
    });

    it("puts the list back where it was scrolled, on whichever ancestor scrolls", () => {
        openFromNo();
        // In the browser the whole .modal scrolls, not .modal-body: fake that layout.
        const modal = document.querySelector(".modal") as HTMLElement;
        Object.defineProperty(modal, "scrollHeight", { configurable: true, value: 2000 });
        Object.defineProperty(modal, "clientHeight", { configurable: true, value: 500 });
        modal.scrollTop = 300;
        fireEvent.click(moreInfo(MORALE));
        modal.scrollTop = 0;
        fireEvent.click(screen.getByRole("button", { name: /Back to list/ }));
        expect(modal.scrollTop).toBe(300);
    });

    it("ticks and unticks from More info, refusing what the list refuses", () => {
        const onToggle = vi.fn();
        open(["fw-power-armor"], onToggle);
        fireEvent.click(moreInfo(FLINT_11));
        const tick = screen.getByRole("button", { name: "Tick this ruleset" }) as HTMLButtonElement;
        expect(tick.disabled).toBe(true);
        expect(screen.getByTestId("ruleset-detail-future-wars-11-construction").textContent).toContain("Clashes with Future Wars: Power Armor");
        fireEvent.click(screen.getByRole("button", { name: /Back to list/ }));
        fireEvent.click(moreInfo("Future Wars: Power Armor"));
        fireEvent.click(screen.getByRole("button", { name: "Untick this ruleset" }));
        expect(onToggle).toHaveBeenCalledWith(["fw-power-armor"]);
    });

    it("lists what a ruleset cannot be used with", () => {
        openFromNo();
        fireEvent.click(moreInfo("Future Wars: Power Armor"));
        const text = screen.getByTestId("ruleset-detail-fw-power-armor").textContent ?? "";
        expect(text).toContain("Cannot be used with:");
        expect(text).toContain(FLINT_11);
        expect(text).toContain("Future Wars: Alternate 'Mech construction (Best of Future Wars printing)");
        expect(text).toContain("Changes: 'Mech construction");
        expect(text).toContain("Category: Construction");
    });

    it("reopens on the list after closing from More info", () => {
        open(["fw-morale"]);
        fireEvent.click(moreInfo(MORALE));
        fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
        fireEvent.click(screen.getByText("Choose rulesets", { selector: "button" }));
        expect(screen.queryByTestId("ruleset-detail-fw-morale")).toBeNull();
        expect(screen.getByTestId("ruleset-row-fw-morale").closest("[hidden]")).toBeNull();
    });

    it("calls onToggle with the ruleset id", () => {
        const onToggle = vi.fn();
        openFromNo([], onToggle);
        fireEvent.click(screen.getByLabelText(MORALE));
        expect(onToggle).toHaveBeenCalledWith(["fw-morale"]);
    });
});
