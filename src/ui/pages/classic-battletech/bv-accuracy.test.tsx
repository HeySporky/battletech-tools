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
        { mulId: 1, name: "Archer ARC-5R", ours: 1672, mul: 1674, file: "x/Archer ARC-5R.mtf", tons: 70, tech: "Inner Sphere", rules: "Standard", year: 3067, role: "Missile Boat", book: "TRO 3067" },
        { mulId: 2, name: "Alpha Wolf", config: "A", ours: 3435, mul: 3359, file: "x/Alpha Wolf A.mtf", tons: 100, tech: "Clan", rules: "Advanced", year: 3151, role: "Juggernaut", book: "RG ilClan 24" },
        { mulId: 3, name: "Anzu ZU-G60", ours: 1503, mul: 1486, file: "x/Anzu ZU-G60.mtf", tons: 60, tech: "Inner Sphere", rules: "Standard", year: 3140, role: "Brawler", book: "TRO 3145 Marik" },
    ],
};

const withMatches: IBundledAccuracy = {
    ...accuracy,
    matches: [
        { mulId: 10, name: "Atlas AS7-D", bv: 1897, tons: 100, tech: "Inner Sphere", rules: "Introductory", year: 2755, role: "Juggernaut", book: "TRO 3039" },
        { mulId: 11, name: "Locust LCT-1V", bv: 432, tons: 20, tech: "Inner Sphere", rules: "Introductory", year: 2499, role: "Scout", book: "TRO 3039" },
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

const unitRows = () => within(screen.getByRole("table", { name: "Units compared" })).getAllByRole("row").slice(1);
const unitNames = () => unitRows().map((row) => within(row).getByRole("rowheader").textContent);
const choose = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("Battle Value accuracy page (#599)", () => {
    it("shows the per-type counts and percentage", () => {
        renderPage();
        const row = within(screen.getByRole("table", { name: "Battle Value accuracy by unit type" })).getByRole("row", { name: /BattleMechs/ });
        // 97 of 97 + 3: the units not yet checked are shown and are not part of the percentage.
        expect(within(row).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["97", "3", "9", "97%"]);
    });

    // Every bundled type has a record (#600 round 4b): the fighters join the 'Mechs.
    it("counts every unit type, filters by type, and gives the 'Mech weight classes to 'Mechs only", () => {
        const fighters: IBundledAccuracy = { unitType: "fighters", matched: 306, notChecked: { importFailed: 102, noMulEntry: 2 },
            differs: [{ mulId: 9, name: "Mechbuster", ours: 401, mul: 368, file: "convfighter/3039u/Mechbuster.blk", tons: 25, tech: "Inner Sphere", year: 2470 }] };
        renderPage([accuracy, fighters]);
        const counts = within(screen.getByRole("table", { name: "Battle Value accuracy by unit type" }));
        expect(within(counts.getByRole("row", { name: /Fighters/ })).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["306", "1", "104", "99.6%"]);
        expect(unitRows()).toHaveLength(4);
        choose("Unit type", "fighters");
        expect(unitNames()).toEqual(["Mechbuster"]);
        // 25 tons is a light 'Mech, but a fighter is not a 'Mech.
        expect(within(screen.getByLabelText("Weight")).getAllByRole("option").map((option) => option.textContent)).toEqual(["All", "Heavy", "Assault"]);
        choose("Unit type", "");
        expect(unitRows()).toHaveLength(4);
    });

    it("has no Unit type choice with one type", () => {
        renderPage();
        expect(screen.queryByLabelText("Unit type")).toBeNull();
    });

    it("lists every differing unit with both numbers, its facts and its verdict", () => {
        renderPage();
        expect(unitRows()).toHaveLength(3);
        const archer = screen.getByText("Archer ARC-5R").closest("tr") as HTMLElement;
        const cells = (row: HTMLElement) => within(row).getAllByRole("cell").slice(0, 8).map((cell) => cell.textContent);
        expect(cells(archer)).toEqual(["70", "3067", "", "Inner Sphere", "TRO 3067", "1,672", "1,674", "-2"]);
        expect(archer.textContent).toContain("JBT bug");
        expect(archer.textContent).toContain("We miss the armored gyro.");
        expect(within(archer).getByRole("link", { name: "#640" }).getAttribute("href")).toBe("https://github.com/ngcfells/battletech-tools/issues/640");
        const wolf = screen.getByText("Alpha Wolf").closest("tr") as HTMLElement;
        expect(cells(wolf)).toEqual(["100", "3151", "A", "Clan", "RG ilClan 24", "3,435", "3,359", "+76"]);
        expect(wolf.textContent).toContain("Open");
        const anzu = screen.getByText("Anzu ZU-G60").closest("tr") as HTMLElement;
        expect(anzu.textContent).toContain("Master Unit List questioned");
        expect(anzu.textContent).toContain("TM p.303");
    });

    it("filters by verdict and by which way JBT differs", () => {
        renderPage();
        choose("Verdict", "open");
        expect(unitNames()).toEqual(["Alpha Wolf"]);
        choose("Verdict", "our-bug");
        expect(unitNames()).toEqual(["Archer ARC-5R"]);
        choose("Verdict", "");
        choose("JBT is", "higher");
        expect(unitNames()).toEqual(["Alpha Wolf", "Anzu ZU-G60"]);
        choose("JBT is", "lower");
        expect(unitNames()).toEqual(["Archer ARC-5R"]);
    });

    it("filters by weight class, tech base, rules level, era, role and book", () => {
        renderPage();
        choose("Weight", "Assault");
        expect(unitNames()).toEqual(["Alpha Wolf"]);
        choose("Weight", "");
        choose("Tech base", "Inner Sphere");
        expect(unitNames()).toEqual(["Anzu ZU-G60", "Archer ARC-5R"]);
        choose("Tech base", "");
        choose("Rules level", "Advanced");
        expect(unitNames()).toEqual(["Alpha Wolf"]);
        choose("Rules level", "");
        choose("Era", "Civil War (3062-3067)");
        expect(unitNames()).toEqual(["Archer ARC-5R"]);
        choose("Era", "");
        choose("Role", "Brawler");
        expect(unitNames()).toEqual(["Anzu ZU-G60"]);
        choose("Role", "");
        choose("Book", "RG ilClan 24");
        expect(unitNames()).toEqual(["Alpha Wolf"]);
    });

    it("offers only the choices the units have", () => {
        renderPage();
        const options = (label: string) => within(screen.getByLabelText(label)).getAllByRole("option").map((option) => option.textContent);
        // The Anzu's 60 tons are heavy (TW: 60 to 75).
        expect(options("Weight")).toEqual(["All", "Heavy", "Assault"]);
        expect(options("Era")).toEqual(["All", "Civil War (3062-3067)", "Dark Ages (3131-3150)", "ilClan (3151+)"]);
        expect(options("Tech base")).toEqual(["All", "Clan", "Inner Sphere"]);
        expect(options("Rules level")).toEqual(["All", "Standard", "Advanced"]);
    });

    it("searches by name, configuration, book and note", () => {
        renderPage();
        choose("Search", "anzu");
        expect(unitNames()).toEqual(["Anzu ZU-G60"]);
        choose("Search", "ilclan");
        expect(unitNames()).toEqual(["Alpha Wolf"]);
        choose("Search", "armored gyro");
        expect(unitNames()).toEqual(["Archer ARC-5R"]);
        choose("Search", "no such unit");
        expect(screen.getByText("No unit matches.")).toBeTruthy();
    });

    it("shows matching units on request, to look up any unit compared", () => {
        renderPage([withMatches]);
        expect(unitNames()).toEqual(["Alpha Wolf", "Anzu ZU-G60", "Archer ARC-5R"]);
        choose("Result", "matches");
        expect(unitNames()).toEqual(["Atlas AS7-D", "Locust LCT-1V"]);
        const atlas = screen.getByText("Atlas AS7-D").closest("tr") as HTMLElement;
        expect(atlas.textContent).toContain("Match");
        expect((screen.getByLabelText("Verdict") as HTMLSelectElement).disabled).toBe(true);
        choose("Result", "");
        choose("Search", "atlas");
        expect(unitNames()).toEqual(["Atlas AS7-D"]);
        choose("Search", "");
        choose("Weight", "Light");
        expect(unitNames()).toEqual(["Locust LCT-1V"]);
        expect(screen.getByText("1 of 5 units shown.")).toBeTruthy();
    });

    it("has no Result choice when the record lists no matching units", () => {
        renderPage();
        expect(screen.queryByLabelText("Result")).toBeNull();
    });

    it("sorts by a column, and the other way when pressed again", () => {
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Difference" }));
        expect(unitNames()).toEqual(["Alpha Wolf", "Anzu ZU-G60", "Archer ARC-5R"]);
        expect(screen.getByRole("columnheader", { name: /Difference/ }).getAttribute("aria-sort")).toBe("descending");
        fireEvent.click(screen.getByRole("button", { name: /Difference/ }));
        expect(unitNames()).toEqual(["Archer ARC-5R", "Anzu ZU-G60", "Alpha Wolf"]);
        fireEvent.click(screen.getByRole("button", { name: "Tons" }));
        expect(unitNames()).toEqual(["Alpha Wolf", "Archer ARC-5R", "Anzu ZU-G60"]);
    });

    it("sorts from a menu too, for a phone, which shows units as cards without column headings", () => {
        renderPage();
        choose("Sort by", "difference:down");
        expect(unitNames()).toEqual(["Alpha Wolf", "Anzu ZU-G60", "Archer ARC-5R"]);
        choose("Sort by", "tons:up");
        expect(unitNames()).toEqual(["Anzu ZU-G60", "Archer ARC-5R", "Alpha Wolf"]);
        fireEvent.click(screen.getByRole("button", { name: /Year/ }));
        expect((screen.getByLabelText("Sort by") as HTMLSelectElement).value).toBe("year:down");
    });

    it("shows a long list a page at a time", () => {
        const many = Array.from({ length: 150 }, (_unused, index) => ({ mulId: 1000 + index, name: `Unit ${String(index).padStart(3, "0")}`, ours: 10, mul: 11, file: "f" }));
        renderPage([{ ...accuracy, differs: many }], {});
        expect(unitRows()).toHaveLength(100);
        fireEvent.click(screen.getByRole("button", { name: "Show 50 more" }));
        expect(unitRows()).toHaveLength(150);
        expect(screen.queryByRole("button", { name: /more/ })).toBeNull();
    });

    it("clears every filter at once", () => {
        renderPage();
        choose("Tech base", "Clan");
        choose("Search", "wolf");
        fireEvent.click(screen.getByRole("button", { name: "Clear" }));
        expect(unitRows()).toHaveLength(3);
        expect((screen.getByLabelText("Search") as HTMLInputElement).value).toBe("");
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
