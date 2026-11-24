// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IAppGlobals } from "../app-router";
import TopMenu from "./top-menu";

afterEach(cleanup);

const renderMenu = (current: string, developerMenu = false) => {
    const appGlobals = {
        appSettings: { developerMenu, uiTheme: "" },
        toggleMobile: vi.fn(),
        closeMobile: vi.fn(),
    } as unknown as IAppGlobals;
    render(<MemoryRouter><TopMenu current={current} appGlobals={appGlobals} /></MemoryRouter>);
    return within(document.querySelector(".mobile-menu") as HTMLElement);
};

describe("mobile menu", () => {
    it("opens only the group holding the current page", () => {
        const menu = renderMenu("classic-battletech-mech-creator");
        expect(menu.getByRole("button", { name: /Classic BattleTech/ }).getAttribute("aria-expanded")).toBe("true");
        expect(menu.queryByRole("link", { name: "'Mech Creator" })).not.toBeNull();
        expect(menu.getByRole("button", { name: /Alpha Strike/ }).getAttribute("aria-expanded")).toBe("false");
    });

    it("opens a group when its header is tapped, and closes the one that was open", () => {
        const menu = renderMenu("classic-battletech-mech-creator");
        fireEvent.click(menu.getByRole("button", { name: /Alpha Strike/ }));
        expect(menu.getByRole("button", { name: /Alpha Strike/ }).getAttribute("aria-expanded")).toBe("true");
        expect(menu.queryByRole("link", { name: "'Mech Creator" })).toBeNull();
        fireEvent.click(menu.getByRole("button", { name: /Alpha Strike/ }));
        expect(menu.getByRole("button", { name: /Alpha Strike/ }).getAttribute("aria-expanded")).toBe("false");
    });

    it("starts with every group closed on the home page", () => {
        const menu = renderMenu("home");
        for (const button of menu.getAllByRole("button")) expect(button.getAttribute("aria-expanded")).toBe("false");
        expect(screen.queryAllByRole("link", { name: "'Mech Creator" }).filter((link) => link.closest(".mobile-menu"))).toEqual([]);
    });
});

describe("developer tools (#97)", () => {
    const topLevelLabels = () =>
        Array.from(document.querySelectorAll(".mobile-menu > .main-menu > li")).map((li) => (li.firstElementChild?.textContent || "").replace(/[▾▸]/g, ""));

    it("puts the editors under Settings, not on the main menu, when the developer menu is on", () => {
        const menu = renderMenu("settings-equipment-editor", true);
        expect(topLevelLabels()).not.toContain("Equipment Editor");
        expect(topLevelLabels()).not.toContain("Custom MUL Editor");
        expect(menu.getByRole("button", { name: /Settings/ }).getAttribute("aria-expanded")).toBe("true");
        expect(menu.getByRole("link", { name: "Equipment Editor" }).getAttribute("href")).toMatch(/\/settings\/equipment-editor$/);
        expect(menu.getByRole("link", { name: "Custom MUL Editor" }).getAttribute("href")).toMatch(/\/settings\/custom-mul-editor$/);
    });

    it("hides the editors when the developer menu is off", () => {
        const menu = renderMenu("settings-home");
        expect(menu.queryByRole("link", { name: "Equipment Editor" })).toBeNull();
        expect(menu.queryByRole("link", { name: "Custom MUL Editor" })).toBeNull();
    });

    it("keeps one Classic BattleTech and one Alpha Strike group either way", () => {
        for (const developerMenu of [false, true]) {
            cleanup();
            const menu = renderMenu("home", developerMenu);
            expect(menu.getAllByRole("button", { name: /Classic BattleTech/ })).toHaveLength(1);
            expect(menu.getAllByRole("button", { name: /Alpha Strike/ })).toHaveLength(1);
        }
    });
});
