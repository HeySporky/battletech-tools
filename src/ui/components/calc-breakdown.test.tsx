// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ICalcBreakdown, ICalcStep } from "../../data/calc-steps";
import CalcBreakdown, { type ICalcBreakdownProps } from "./calc-breakdown";

afterEach(cleanup);

const step = (over: Partial<ICalcStep>): ICalcStep => ({
    id: "t.step", section: "Defensive Battle Rating", cites: [{ source: "tm", page: "302" }], status: "cited", label: "Armor", ...over,
});

const bv2 = (steps: ICalcStep[], result: number | null = 1000): ICalcBreakdown => ({ kind: "battle-value", edition: "total-warfare", scheme: "bv2", steps, result });
const bv1 = (steps: ICalcStep[], result: number | null = 800): ICalcBreakdown => ({ kind: "battle-value", edition: "master-rules-revised", scheme: "bv1", steps, result });
const none = (): ICalcBreakdown => ({
    kind: "battle-value", edition: "battletech-compendium", scheme: "none", result: null,
    steps: [step({ id: "none.no-battle-value", section: "Battle Value", cites: [], label: "The BattleTech Compendium has no Battle Value" })],
});

const renderIt = (props: Partial<ICalcBreakdownProps>) => {
    const all: ICalcBreakdownProps = {
        battleValue: () => bv2([step({})]),
        editions: ["battletech-compendium", "master-rules-revised", "total-warfare"],
        edition: "total-warfare",
        ...props,
    };
    return render(<MemoryRouter><CalcBreakdown {...all} /></MemoryRouter>);
};

describe("CalcBreakdown (#599)", () => {
    it("shows each step's label, arithmetic, result and citation", () => {
        renderIt({ battleValue: () => bv2([
            step({ label: "Armor", detail: "152 x 2.5", value: 380 }),
            step({ id: "t.total", section: "Final", label: "Battle Value", value: 1234, emphasis: true, cites: [{ source: "tm", page: "302-304" }] }),
        ], 1234) });
        const row = screen.getByText("Armor").closest("tr") as HTMLElement;
        expect(within(row).getByText("152 x 2.5")).toBeTruthy();
        expect(within(row).getByText("380")).toBeTruthy();
        expect(within(row).getByText("TM p.302")).toBeTruthy();
        // Steps sit under their section's heading, and an emphasis row is marked.
        expect(screen.getByRole("columnheader", { name: "Defensive Battle Rating" })).toBeTruthy();
        const total = screen.getByText("TM pp.302-304").closest("tr") as HTMLElement;
        expect(total.className).toContain("calc-breakdown-emphasis");
        expect(within(total).getByText("1,234")).toBeTruthy();
    });

    it("changing the edition select re-reads battleValue with that tag", () => {
        const battleValue = vi.fn((edition: string) => edition === "master-rules-revised" ? bv1([step({ label: "BV1 armor" })]) : bv2([step({ label: "BV2 armor" })]));
        renderIt({ battleValue });
        expect(battleValue).toHaveBeenLastCalledWith("total-warfare");
        expect(screen.getByText("BV2 armor")).toBeTruthy();
        const select = screen.getByLabelText("Rules edition") as HTMLSelectElement;
        expect([...select.options].map((option) => option.value)).toEqual(["battletech-compendium", "master-rules-revised", "total-warfare"]);
        fireEvent.change(select, { target: { value: "master-rules-revised" } });
        expect(battleValue).toHaveBeenLastCalledWith("master-rules-revised");
        expect(screen.getByText("BV1 armor")).toBeTruthy();
        expect(screen.queryByText("BV2 armor")).toBeNull();
    });

    it("says the edition has no Battle Value when scheme is none, and shows no 0", () => {
        renderIt({ battleValue: none, edition: "battletech-compendium", skillBattleValue: () => 0, mulBattleValue: 900 });
        const section = screen.getByRole("region", { name: "Battle Value" });
        expect(within(section).getByText("The BattleTech Compendium has no Battle Value")).toBeTruthy();
        expect(section.textContent).not.toMatch(/\d/);
        expect(within(section).queryByRole("table")).toBeNull();
    });

    it("marks provisional and source-missing steps with their notes", () => {
        renderIt({ battleValue: () => bv2([
            step({ label: "Armored gyro", status: "provisional", note: "Follows the record sheets." }),
            step({ label: "Satellite uplink", status: "source-missing", note: "Needs the 1997 printing.", cites: [] }),
        ]) });
        const provisional = screen.getByText("Armored gyro").closest("tr") as HTMLElement;
        expect(provisional.textContent).toContain("Provisional: Follows the record sheets.");
        const missing = screen.getByText("Satellite uplink").closest("tr") as HTMLElement;
        expect(missing.textContent).toContain("Source not yet in NGCFells's library: Needs the 1997 printing.");
    });

    // A weapon list repeats one long note on every row: it is printed once, and the later rows point back to it.
    it("prints a note shared by several steps once, and points the later steps back to it", () => {
        const note = "Each price comes from the JBT equipment records.";
        renderIt({ battleValue: () => bv2([
            step({ label: "Medium Laser", status: "provisional", note }),
            step({ label: "Large Laser", status: "provisional", note }),
            step({ label: "Armored gyro", status: "provisional", note: "Follows the record sheets." }),
        ]) });
        expect((screen.getByText("Medium Laser").closest("tr") as HTMLElement).textContent).toContain(`Provisional: ${note}`);
        const later = screen.getByText("Large Laser").closest("tr") as HTMLElement;
        expect(later.textContent).toContain("Provisional: as noted at Medium Laser, above.");
        expect(later.textContent).not.toContain(note);
        expect((screen.getByText("Armored gyro").closest("tr") as HTMLElement).textContent).toContain("Provisional: Follows the record sheets.");
    });

    it("shows the MUL's BV beside ours only under a bv2 breakdown, and the accuracy link only when they differ", () => {
        const battleValue = (edition: string) => edition === "master-rules-revised" ? bv1([step({})], 800) : bv2([step({})], 1000);
        // The same number: shown, no link.
        renderIt({ battleValue, mulBattleValue: 1000, accuracyHref: "/accuracy" });
        expect(screen.getByText(/Master Unit List: 1,000/)).toBeTruthy();
        expect(screen.queryByRole("link")).toBeNull();
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules-revised" } });
        expect(screen.queryByText(/Master Unit List/)).toBeNull();
        cleanup();
        // A different number: the link shows.
        renderIt({ battleValue, mulBattleValue: 1012, accuracyHref: "/accuracy" });
        expect(screen.getByText(/Master Unit List: 1,012/)).toBeTruthy();
        expect(screen.getByRole("link").getAttribute("href")).toBe("/accuracy");
        cleanup();
        // No page to link to yet: the numbers alone.
        renderIt({ battleValue, mulBattleValue: 1012 });
        expect(screen.getByText(/Master Unit List: 1,012/)).toBeTruthy();
        expect(screen.queryByRole("link")).toBeNull();
    });

    it("renders a label with markup as text", () => {
        const { container } = renderIt({ battleValue: () => bv2([step({ label: "<img onerror=x>", detail: "<b>1</b> & \"2\"", note: "<i>n</i>", status: "provisional" })]) });
        expect(screen.getByText("<img onerror=x>")).toBeTruthy();
        expect(screen.getByText("<b>1</b> & \"2\"")).toBeTruthy();
        expect(container.querySelector("img, b, i")).toBeNull();
    });

    // The log's "Pilot Adjusted BV" line went with the old log (Task 3 ruling): the view shows it.
    it("shows the Battle Value adjusted for skill under the edition picked", () => {
        const skillBattleValue = vi.fn((edition: string) => edition === "master-rules-revised" ? 880 : 1320);
        renderIt({
            battleValue: (edition) => edition === "master-rules-revised" ? bv1([step({})], 800) : bv2([step({})], 1000),
            skillBattleValue, skillLabel: "Gunnery 3, Piloting 4",
        });
        expect(screen.getByText("Adjusted for skill (Gunnery 3, Piloting 4): 1,320")).toBeTruthy();
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules-revised" } });
        expect(screen.getByText("Adjusted for skill (Gunnery 3, Piloting 4): 880")).toBeTruthy();
    });

    it("shows the cost steps and total in their own section, and no cost section without cost", () => {
        const cost = (): ICalcBreakdown => ({ kind: "cost", edition: "total-warfare", result: 2229479, steps: [
            step({ id: "cost.engine", section: "Engine", label: "Fusion engine", detail: "5,000 x 200 x 25 / 75", value: 333333.3333, cites: [{ source: "tm", page: "274" }] }),
        ] });
        renderIt({ cost });
        const section = screen.getByRole("region", { name: "Cost" });
        expect(within(section).getByText("2,229,479 C-bills")).toBeTruthy();
        expect(within(section).getByText("333,333.333")).toBeTruthy();
        cleanup();
        renderIt({});
        expect(screen.queryByRole("region", { name: "Cost" })).toBeNull();
    });

    it("prints the breakdown's notes under its heading, for Battle Value and cost (#172)", () => {
        const battleValue = (): ICalcBreakdown => ({ ...bv2([step({})]), notes: ["Built under a construction ruleset: BV note."] });
        const cost = (): ICalcBreakdown => ({ kind: "cost", edition: "total-warfare", result: 5, steps: [step({ id: "cost.x", label: "Thing" })], notes: ["Cost note."] });
        renderIt({ battleValue, cost });
        expect(within(screen.getByRole("region", { name: "Battle Value" })).getByText("Built under a construction ruleset: BV note.")).toBeTruthy();
        expect(within(screen.getByRole("region", { name: "Cost" })).getByText("Cost note.")).toBeTruthy();
    });

    it("an edition tag that is not offered starts on the last one offered", () => {
        const battleValue = vi.fn(() => bv2([step({})]));
        renderIt({ battleValue, edition: "no-such-edition" });
        expect((screen.getByLabelText("Rules edition") as HTMLSelectElement).value).toBe("total-warfare");
        expect(battleValue).toHaveBeenLastCalledWith("total-warfare");
    });
});
