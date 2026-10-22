// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IAppGlobals } from "../app-router";
import TopMenu from "./top-menu";

afterEach(cleanup);

const renderMenu = (current: string) => {
    const appGlobals = {
        appSettings: { developerMenu: false, uiTheme: "" },
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
