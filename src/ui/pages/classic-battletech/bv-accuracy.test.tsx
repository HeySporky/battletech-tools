// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IBundledAccuracy } from "../../../data/bundled-mechs-build";
import type { IBvVerdict } from "../../../data/bv-verdicts";
import type { IAppGlobals } from "../../app-router";
import BvAccuracy from "./bv-accuracy";

afterEach(cleanup);

const accuracy: IBundledAccuracy = {
    unitType: "mechs",
    matched: 97,
    notChecked: { importFailed: 4, noMulEntry: 5 },
    differs: [
        { mulId: 1, name: "Archer ARC-5R", ours: 1672, mul: 1674, file: "x/Archer ARC-5R.mtf" },
        { mulId: 2, name: "Alpha Wolf", config: "A", ours: 3435, mul: 3359, file: "x/Alpha Wolf A.mtf" },
        { mulId: 3, name: "Anzu ZU-G60", ours: 1503, mul: 1486, file: "x/Anzu ZU-G60.mtf" },
    ],
};

const verdicts: Record<string, IBvVerdict> = {
    "mul:1": { verdict: "our-bug", note: "We miss the armored gyro.", issue: 640 },
    "mul:3": { verdict: "mul-suspect", note: "The list counts the ammunition twice.", cites: [{ source: "tm", page: "303" }] },
    "mul:999": { verdict: "import", note: "A unit that now matches." },
};

const renderPage = (data: IBundledAccuracy[] = [accuracy], useVerdicts = verdicts) => {
    const appGlobals = {
        appSettings: { developerMenu: false, uiTheme: "" },
        makeDocumentTitle: vi.fn(),
        toggleMobile: vi.fn(),
        closeMobile: vi.fn(),
        siteAlerts: { activeAlerts: [] },
    } as unknown as IAppGlobals;
    render(<MemoryRouter><BvAccuracy appGlobals={appGlobals} data={data} verdicts={useVerdicts} /></MemoryRouter>);
};

const unitRows = () => within(screen.getByRole("table", { name: "Units whose Battle Value differs" })).getAllByRole("row").slice(1);

describe("Battle Value accuracy page (#599)", () => {
    it("shows the per-type counts and percentage", () => {
        renderPage();
        const row = within(screen.getByRole("table", { name: "Battle Value accuracy by unit type" })).getByRole("row", { name: /BattleMechs/ });
        // 97 of 97 + 3: the units not yet checked are shown and are not part of the percentage.
        expect(within(row).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["97", "3", "9", "97%"]);
    });

    it("lists every differing unit with both numbers and its verdict", () => {
        renderPage();
        const rows = unitRows();
        expect(rows).toHaveLength(3);
        const archer = screen.getByText("Archer ARC-5R").closest("tr") as HTMLElement;
        expect(within(archer).getAllByRole("cell").slice(0, 4).map((cell) => cell.textContent)).toEqual(["", "1,672", "1,674", "-2"]);
        expect(archer.textContent).toContain("JBT bug");
        expect(archer.textContent).toContain("We miss the armored gyro.");
        expect(within(archer).getByRole("link", { name: "#640" }).getAttribute("href")).toBe("https://github.com/ngcfells/battletech-tools/issues/640");
        const wolf = screen.getByText("Alpha Wolf").closest("tr") as HTMLElement;
        expect(within(wolf).getAllByRole("cell").slice(0, 4).map((cell) => cell.textContent)).toEqual(["A", "3,435", "3,359", "+76"]);
        expect(wolf.textContent).toContain("Open");
        const anzu = screen.getByText("Anzu ZU-G60").closest("tr") as HTMLElement;
        expect(anzu.textContent).toContain("Master Unit List questioned");
        expect(anzu.textContent).toContain("TM p.303");
    });

    it("filters by verdict", () => {
        renderPage();
        fireEvent.change(screen.getByLabelText("Verdict"), { target: { value: "open" } });
        expect(unitRows()).toHaveLength(1);
        expect(screen.getByText("Alpha Wolf")).toBeTruthy();
        expect(screen.queryByText("Archer ARC-5R")).toBeNull();
        fireEvent.change(screen.getByLabelText("Verdict"), { target: { value: "our-bug" } });
        expect(screen.getByText("Archer ARC-5R")).toBeTruthy();
        expect(screen.queryByText("Alpha Wolf")).toBeNull();
    });

    it("searches by name", () => {
        renderPage();
        fireEvent.change(screen.getByLabelText("Search by name"), { target: { value: "anzu" } });
        expect(unitRows()).toHaveLength(1);
        expect(screen.getByText("Anzu ZU-G60")).toBeTruthy();
        fireEvent.change(screen.getByLabelText("Search by name"), { target: { value: "no such unit" } });
        expect(screen.getByText("No unit matches.")).toBeTruthy();
    });

    it("ignores a verdict whose key matches no unit", () => {
        renderPage();
        expect(unitRows()).toHaveLength(3);
        expect(screen.queryByText("A unit that now matches.")).toBeNull();
    });

    it("shows a unit name with markup as text", () => {
        renderPage([{ ...accuracy, differs: [{ mulId: 9, name: "<img onerror=x>", ours: 1, mul: 2, file: "f" }] }], {});
        expect(screen.getByText("<img onerror=x>")).toBeTruthy();
        expect(document.querySelector("td img")).toBeNull();
    });
});
