// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AlphaStrikeUnit } from "../../../../classes/alpha-strike-unit";
import type { IAppGlobals } from "../../../app-router";
import AlphaStrikeUnitCreatorHome from "./home";

const SAMPLE = /Sample: The Clans never existed/;

const appGlobals = () => ({
    appSettings: { developerMenu: false, uiTheme: "", mechRulesFilter: 2 },
    makeDocumentTitle: vi.fn(),
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
    saveAppSettings: vi.fn(),
    siteAlerts: { activeAlerts: [] },
}) as unknown as IAppGlobals;

const renderCreator = () => render(<MemoryRouter><AlphaStrikeUnitCreatorHome appGlobals={appGlobals()} /></MemoryRouter>);
const saved = () => JSON.parse(localStorage.getItem("editing_as_unit") ?? "{}");
const startWith = (changes: Partial<AlphaStrikeUnit>) => {
    const unit = Object.assign(new AlphaStrikeUnit(), changes);
    localStorage.setItem("editing_as_unit", JSON.stringify(unit.export()));
};

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); localStorage.clear(); });

describe("Alpha Strike unit creator settings block (#324 round 4)", () => {
    it("the settings block comes first, with no Edition, Tech Base or Era", () => {
        const { container } = renderCreator();
        const text = container.textContent ?? "";
        expect(text.indexOf("Special Rulesets:")).toBeGreaterThanOrEqual(0);
        expect(text.indexOf("Special Rulesets:")).toBeLessThan(text.indexOf("Name"));
        expect(text.indexOf("Rules Level:")).toBeLessThan(text.indexOf("Name"));
        expect(text).not.toContain("Rules Edition:");
        expect(text).not.toContain("Technology Base:");
        expect(text).not.toContain("Era:");
    });

    it("on a ProtoMech card the no-Clans box is disabled", () => {
        startWith({ type: "PM" });
        renderCreator();
        fireEvent.change(screen.getByLabelText(/Special Rulesets/), { target: { value: "yes" } });
        expect((screen.getByRole("checkbox", { name: SAMPLE }) as HTMLInputElement).disabled).toBe(true);
    });

    it("with no-Clans ticked the ProtoMech type is disabled, saying why", () => {
        startWith({ rulesets: ["sample-no-clans"] });
        renderCreator();
        const proto = screen.getByRole("option", { name: "ProtoMech" }) as HTMLOptionElement;
        expect(proto.disabled).toBe(true);
        expect(proto.title).toMatch(/ProtoMechs do not exist under Sample: The Clans never existed/);
    });

    it("ticking a ruleset and picking a rules level save them on the card", () => {
        renderCreator();
        fireEvent.change(screen.getByLabelText(/Special Rulesets/), { target: { value: "yes" } });
        fireEvent.click(screen.getByRole("checkbox", { name: SAMPLE }));
        fireEvent.change(screen.getByLabelText(/Rules Level/), { target: { value: "3" } });
        expect(saved().rulesets).toEqual(["sample-no-clans"]);
        expect(saved().rulesLevel).toBe(3);
    });

    it("says what the rules level does for printing", () => {
        renderCreator();
        expect(screen.getByText(/Printing asks for confirmation above the selected rules level and stamps anything above Standard/)).toBeTruthy();
    });
});
