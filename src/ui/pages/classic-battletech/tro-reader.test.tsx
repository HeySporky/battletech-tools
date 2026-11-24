// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IAppGlobals } from "../../app-router";
import TroJbt, { TRO_CATEGORIES, TRO_DOCUMENTS, TroReader, readoutContents, readoutPages, troIndex } from "./tro-jbt";


afterEach(cleanup);

const appGlobals = {
    appSettings: { developerMenu: false, uiTheme: "" },
    makeDocumentTitle: vi.fn(),
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
    siteAlerts: { activeAlerts: [] },
} as unknown as IAppGlobals;

const open = (slug: string) => render(<MemoryRouter><TroReader appGlobals={appGlobals} slug={slug} /></MemoryRouter>);

describe("TRO - JBT contents", () => {
    it("lists every page of a readout, with the sections one level below each page's own heading", () => {
        const walkers = TRO_DOCUMENTS.find((each) => each.slug === "walkers")!;
        const contents = readoutContents(readoutPages(walkers.text, walkers.pageStart), walkers.title);
        expect(contents.map((entry) => entry.title)).toEqual(expect.arrayContaining(["Harrowhound HRH-1", "Ironback IBK-2T", "Steppe Titan STN-5V"]));
        const ironback = contents.find((entry) => entry.title === "Ironback IBK-2T")!;
        expect(ironback.sections.map((section) => section.title)).toEqual(expect.arrayContaining(["Overview", "Capabilities", "Deployment"]));
        for (const document of TRO_DOCUMENTS) {
            const pages = readoutPages(document.text, document.pageStart);
            expect(readoutContents(pages, document.title), document.slug).toHaveLength(pages.length);
        }
    });

    it("opens the reader with the contents showing, and a click goes straight to that page", () => {
        open("power-armor");
        const contents = screen.getByTestId("tro-contents");
        expect(contents.hasAttribute("open")).toBe(true);
        fireEvent.click(within(contents).getByText("The Sample Suits"));
        expect(screen.getByTestId("tro-readout").textContent).toContain("IPA-4");
        expect(within(contents).getByText("The Sample Suits").getAttribute("aria-current")).toBe("page");
    });

    it("files every readout by category: unit types with their example designs, then equipment, ammunition and other", () => {
        const index = troIndex();
        expect(TRO_CATEGORIES.map((category) => category.title)).toEqual(["Unit Types", "Equipment", "Ammunition", "Other"]);
        expect(index["unit-types"].map((entry) => entry.slug)).toEqual(["micro-mechs", "walkers", "beast-mounted-infantry", "specialized-infantry", "seadropships", "power-armor", "vtolam", "permanent-air-mech"]);
        const walkers = index["unit-types"].find((entry) => entry.slug === "walkers")!;
        expect(walkers.examples).toEqual(expect.arrayContaining([{ name: "Ironback IBK-2T", hash: "ironback-ibk-2t" }]));
        for (const entry of index["unit-types"]) {
            expect(entry.examples!.length, entry.slug).toBeGreaterThan(0);
            for (const example of entry.examples!) expect(example.hash, `${entry.slug} ${example.name}`).not.toBe("");
        }
        const titles = (category: keyof typeof index) => index[category].map((entry) => entry.title);
        expect(titles("equipment")).toEqual(expect.arrayContaining(["Gatling Laser", "Superheavy PPC", "COIL-S, COIL-M and COIL-L"]));
        expect(titles("ammunition")).toEqual(expect.arrayContaining(["Gauss Rifle Shells: VHE and Inferno", "Autocannon SABOT Rounds", "Tandem Charge SRM House Rule"]));
        expect(titles("equipment")).not.toContain("Autocannon SABOT Rounds");
        expect(titles("other")).toEqual(["What Sets One Apart", "The Super-Heavy Combat Vehicle Table", "How the App Counts It", "Some Canon Designs", "Printing Differences",
            "How NGCFells derives Battle Value and cost", "Other Items Priced the Same Way",
            "The Four Methods", "What NGCFells Filled In", "Their Own Arithmetic", "Canon and the Methods",
            "Stock's Values from DropShips and JumpShips", "The Authors' Designs"]);
        // Every page of an equipment or ammunition readout is listed once, so nothing has to be hunted for.
        const listed = [...index.equipment, ...index.ammunition, ...index.other].length;
        const pages = TRO_DOCUMENTS.filter((document) => document.category !== "unit-types").reduce((sum, document) => sum + readoutPages(document.text, document.pageStart).length, 0);
        expect(listed).toBe(pages);
        // Each entry still credits its author.
        expect(index.ammunition.find((entry) => entry.title === "Gauss Rifle Shells: VHE and Inferno")!.credit).toMatch(/^Chris Congdon/);
        expect(index.equipment.find((entry) => entry.title === "Superheavy PPC")!.credit).toMatch(/u\/FedditSuns/);
    });

    it("the landing page shows each category and links straight to a design's page", () => {
        render(<MemoryRouter><TroJbt appGlobals={appGlobals} /></MemoryRouter>);
        const units = screen.getByTestId("tro-category-unit-types");
        expect(within(units).getByRole("link", { name: "Harrowhound HRH-1" }).getAttribute("href")).toMatch(/\/tro-jbt\/walkers#harrowhound-hrh-1$/);
        const ammunition = screen.getByTestId("tro-category-ammunition");
        expect(within(ammunition).getByRole("link", { name: "Autocannon SABOT Rounds" }).getAttribute("href")).toMatch(/\/tro-jbt\/best-of-future-wars#autocannon-sabot-rounds$/);
    });

    it("a section link opens its page too", () => {
        open("walkers");
        const contents = screen.getByTestId("tro-contents");
        const deployment = within(contents).getAllByText("Deployment")[0];
        fireEvent.click(deployment);
        expect(screen.getByTestId("tro-readout").textContent).toContain("Deployment");
        expect(screen.getByTestId("tro-readout").querySelector("#deployment")).not.toBeNull();
    });
});
