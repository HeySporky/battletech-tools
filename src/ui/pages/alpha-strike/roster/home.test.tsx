// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import AlphaStrikeForce from "../../../../classes/alpha-strike-force";
import { CONST_FORCE_PACKS } from "../../../../data/force-packs-mechs";
import type { IAppGlobals } from "../../../app-router";
import AlphaStrikeRosterHome from "./home";

afterEach(cleanup);

describe("Alpha Strike roster: Quickly add a ForcePack (issue 19)", () => {
    it("keeps each pack's name and members in their own column beside the add button", () => {
        const appGlobals = {
            appSettings: { developerMenu: false, uiTheme: "" },
            currentASForce: new AlphaStrikeForce(),
            favoriteASGroups: [],
            makeDocumentTitle: vi.fn(),
            toggleMobile: vi.fn(),
            closeMobile: vi.fn(),
            siteAlerts: { activeAlerts: [] },
        } as unknown as IAppGlobals;
        render(<MemoryRouter><AlphaStrikeRosterHome appGlobals={appGlobals} /></MemoryRouter>);
        const pack = CONST_FORCE_PACKS[0];
        const button = screen.getByRole("button", { name: `Add the ${pack.name}` });
        const column = button.nextElementSibling as HTMLElement;
        expect(column.className).toBe("force-pack-text");
        expect(column.textContent).toContain(pack.name);
        expect(button.parentElement?.className).toBe("force-pack-row");
    });

    // Members were matched against the MUL search's Name, which has no variant, so most packs added nothing.
    it("adds every member at its pack skill, found in the bundled MUL by name and variant (Ideas #82)", async () => {
        const saveCurrentASForce = vi.fn();
        const appGlobals = {
            appSettings: { developerMenu: false, uiTheme: "" },
            currentASForce: new AlphaStrikeForce(),
            favoriteASGroups: [],
            makeDocumentTitle: vi.fn(),
            toggleMobile: vi.fn(),
            closeMobile: vi.fn(),
            saveCurrentASForce,
            siteAlerts: { activeAlerts: [] },
        } as unknown as IAppGlobals;
        render(<MemoryRouter><AlphaStrikeRosterHome appGlobals={appGlobals} /></MemoryRouter>);
        const pack = CONST_FORCE_PACKS.find((entry) => entry.name.includes("Scouring Sands Sortie 06"))!;
        fireEvent.click(screen.getByRole("button", { name: `Add the ${pack.name}` }));
        await waitFor(() => expect(saveCurrentASForce).toHaveBeenCalled(), { timeout: 20000 });
        const group = appGlobals.currentASForce!.groups.at(-1)!;
        expect(group.customName).toBe(pack.name);
        expect(group.members.map((unit) => unit.name)).toEqual(pack.members);
        expect(group.members.map((unit) => unit.currentSkill)).toEqual(pack.skills);
        expect(screen.getAllByTestId("force-pack-note").length).toBeGreaterThan(20);
    }, 30000);
});
