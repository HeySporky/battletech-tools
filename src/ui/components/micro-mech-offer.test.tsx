// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IAppGlobals } from "../app-router";
import ClassicBattleTechHome from "../pages/classic-battletech/home";
import TopMenu from "./top-menu";
import { microMechCreatorOffered } from "./micro-mech-offer";

afterEach(cleanup);

const globals = (mechRulesFilter: number, microMechSaves: unknown[] = []) => ({
    appSettings: { developerMenu: false, uiTheme: "", mechRulesFilter },
    microMechSaves,
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
    makeDocumentTitle: vi.fn(),
    siteAlerts: { activeAlerts: [] },
}) as unknown as IAppGlobals;

const menuLinks = (appGlobals: IAppGlobals) => {
    render(<MemoryRouter><TopMenu current="classic-battletech-home" appGlobals={appGlobals} /></MemoryRouter>);
    return screen.queryAllByRole("link", { name: "Micro-Mech Creator" });
};

describe("the Micro-Mech Creator link (Custom Homebrew, #173)", () => {
    it("is offered at Custom Homebrew and above, and not below it", () => {
        expect(microMechCreatorOffered(globals(5))).toBe(false);
        expect(microMechCreatorOffered(globals(6))).toBe(true);
        expect(microMechCreatorOffered(globals(7))).toBe(true);
    });

    it("keeps the link for a user who holds a saved Micro-Mech, so it stays reachable", () => {
        expect(microMechCreatorOffered(globals(2, [{}]))).toBe(true);
    });

    it("is tolerant of settings that carry no level", () => {
        expect(microMechCreatorOffered({})).toBe(false);
    });

    it("is absent from the menu below Custom Homebrew and present at it, next to the ProtoMech Creator", () => {
        expect(menuLinks(globals(2))).toHaveLength(0);
        cleanup();
        const links = menuLinks(globals(6));
        expect(links.length).toBeGreaterThan(0);
        expect(links[0].getAttribute("href")).toContain("/classic-battletech/micro-mech-creator");
        const names = screen.getAllByRole("link").map((link) => link.textContent);
        expect(names.indexOf("Micro-Mech Creator")).toBe(names.indexOf("ProtoMech Creator") + 1);
    });

    it("is absent from the Classic BattleTech home below the level and present at it", () => {
        render(<MemoryRouter><ClassicBattleTechHome appGlobals={globals(2)} /></MemoryRouter>);
        expect(screen.queryAllByText(/Micro-Mech Creator/)).toHaveLength(0);
        cleanup();
        render(<MemoryRouter><ClassicBattleTechHome appGlobals={globals(6)} /></MemoryRouter>);
        expect(screen.queryAllByText(/Micro-Mech Creator/).length).toBeGreaterThan(0);
    });
});
