// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerLocalCustomContent } from "../../../../data/custom-content-local";
import { sswTestFixtures } from "../../../../data/ssw/sswTestFixtures";
import type { IAppGlobals } from "../../../app-router";
import MechCreatorSSWFileImport from "./ssw-file-import";

afterEach(cleanup);
beforeEach(() => { registerLocalCustomContent([]); try { localStorage.clear(); } catch { /* none */ } });

const griffin = sswTestFixtures["Griffin GRF-1N"];
const withWidget = griffin.replace(/\(IS\) PPC</, "(IS) Widget Cannon<");

const renderPage = () => {
    const saveBattleMechSaves = vi.fn();
    const appGlobals = {
        appSettings: { developerMenu: false, uiTheme: "" },
        battleMechSaves: [],
        saveBattleMechSaves,
        makeDocumentTitle: vi.fn(),
        toggleMobile: vi.fn(),
        closeMobile: vi.fn(),
        siteAlerts: { activeAlerts: [] },
    } as unknown as IAppGlobals;
    render(<MemoryRouter><MechCreatorSSWFileImport appGlobals={appGlobals} /></MemoryRouter>);
    return { saveBattleMechSaves };
};
const choose = async (xml: string) => {
    const file = new File([xml], "widget.ssw", { type: "text/plain" });
    Object.defineProperty(file, "text", { value: async () => xml });
    fireEvent.change(screen.getByLabelText("Choose .ssw files"), { target: { files: [file] } });
    await waitFor(() => expect(screen.queryByText("Importing…")).toBeNull());
};
const saveButton = () => screen.getByRole("button", { name: "Save selected to my 'Mechs" }) as HTMLButtonElement;

describe("SSW import asks about unknown items (#76)", () => {
    it("shows a fieldset per unknown item, filled with the guesses, each answer with an I do not know box", async () => {
        renderPage();
        await choose(withWidget);
        const box = await screen.findByRole("group", { name: /Widget Cannon/ });
        expect((within(box).getByLabelText("Tech base") as HTMLSelectElement).value).toBe("is");
        expect((within(box).getByLabelText("Tons") as HTMLInputElement).value).not.toBe("");
        expect((within(box).getByLabelText("Slots") as HTMLInputElement).value).toBe("8");
        expect(within(box).getAllByLabelText("I do not know")).toHaveLength(3);
        expect(within(box).getByLabelText("Damage")).toBeTruthy();
        expect(within(box).getByLabelText("Source note")).toBeTruthy();
    });

    it("keeps Save disabled while a required field is empty and not marked I do not know", async () => {
        renderPage();
        await choose(withWidget);
        const box = await screen.findByRole("group", { name: /Widget Cannon/ });
        expect(saveButton().disabled).toBe(false);
        fireEvent.change(within(box).getByLabelText("Tons"), { target: { value: "" } });
        expect(saveButton().disabled).toBe(true);
        fireEvent.click(within(box).getAllByLabelText("I do not know")[1]);
        expect(saveButton().disabled).toBe(false);
    });

    it("saves with the typed answers: the design weighs the answered tons", async () => {
        const { saveBattleMechSaves } = renderPage();
        await choose(withWidget);
        const box = await screen.findByRole("group", { name: /Widget Cannon/ });
        fireEvent.change(within(box).getByLabelText("Tons"), { target: { value: "7" } });
        fireEvent.change(within(box).getByLabelText("Slots"), { target: { value: "3" } });
        fireEvent.click(saveButton());
        await waitFor(() => expect(saveBattleMechSaves).toHaveBeenCalled());
        expect(screen.getByText(/1 design added/)).toBeTruthy();
        const saved = saveBattleMechSaves.mock.calls[0][0];
        expect(saved).toHaveLength(1);
    });

    it("a file with no unknown items shows no questions and Save is enabled at once", async () => {
        renderPage();
        await choose(griffin);
        await waitFor(() => expect(saveButton().disabled).toBe(false));
        expect(screen.queryByRole("group", { name: /Widget Cannon/ })).toBeNull();
    });
});
