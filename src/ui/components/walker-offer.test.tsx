// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IAppGlobals } from "../app-router";
import ClassicBattleTechHome from "../pages/classic-battletech/home";
import TopMenu from "./top-menu";
import { walkerCreatorOffered } from "./walker-offer";

afterEach(cleanup);

const globals = (mechRulesFilter: number, walkerSaves: unknown[] = []) => ({
    appSettings: { developerMenu: false, uiTheme: "", mechRulesFilter },
    walkerSaves,
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
    makeDocumentTitle: vi.fn(),
    siteAlerts: { activeAlerts: [] },
}) as unknown as IAppGlobals;

const menuLinks = (appGlobals: IAppGlobals) => {
    render(<MemoryRouter><TopMenu current="classic-battletech-home" appGlobals={appGlobals} /></MemoryRouter>);
    return screen.queryAllByRole("link", { name: "Walker Creator" });
};

describe("the Walker Creator link (Custom Homebrew, #172)", () => {
    it("is offered at Custom Homebrew and above, and not below it", () => {
        expect(walkerCreatorOffered(globals(5))).toBe(false);
        expect(walkerCreatorOffered(globals(6))).toBe(true);
        expect(walkerCreatorOffered(globals(7))).toBe(true);
    });

    it("keeps the link for a user who holds a saved Walker, so it stays reachable", () => {
        expect(walkerCreatorOffered(globals(2, [{}]))).toBe(true);
    });

    it("is tolerant of settings that carry no level", () => {
        expect(walkerCreatorOffered({})).toBe(false);
    });

    it("is absent from the menu below Custom Homebrew and present at it, after the Micro-Mech Creator", () => {
        expect(menuLinks(globals(2))).toHaveLength(0);
        cleanup();
        const links = menuLinks(globals(6));
        expect(links.length).toBeGreaterThan(0);
        expect(links[0].getAttribute("href")).toContain("/classic-battletech/walker-creator");
        const names = screen.getAllByRole("link").map((link) => link.textContent);
        expect(names.indexOf("Walker Creator")).toBe(names.indexOf("Micro-Mech Creator") + 1);
    });

    it("is present in the menu for a saved Walker at any level", () => {
        expect(menuLinks(globals(2, [{}])).length).toBeGreaterThan(0);
    });

    it("is absent from the Classic BattleTech home below the level and present at it", () => {
        render(<MemoryRouter><ClassicBattleTechHome appGlobals={globals(2)} /></MemoryRouter>);
        expect(screen.queryAllByText(/Walker Creator/)).toHaveLength(0);
        cleanup();
        render(<MemoryRouter><ClassicBattleTechHome appGlobals={globals(6)} /></MemoryRouter>);
        expect(screen.queryAllByText(/Walker Creator/).length).toBeGreaterThan(0);
    });
});
