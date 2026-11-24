// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MordelKeyError } from "../../utils/mordel/mordel-api";
import type { IMordelListRow } from "../../utils/mordel/mordel-types";
import MordelUnitsPanel from "./mordel-units-panel";

// Made-up rows. Canon or made-up units only.
const row = (id: number, name: string, over: Partial<IMordelListRow> = {}): IMordelListRow => ({
    unit_type: "BattleMech", unit_type_short: "bm", id, name, canon: false, designer: "Tester", tech_base: "Inner Sphere",
    year: 3050, tons: 50, battle_value: 1000, point_value: 20, updated: 100, ...over,
});
const ROWS = [
    row(1, "Hornet HNT-1"),
    row(2, "Hornet HNT-2"),
    row(3, "Wasp Hover Tank", { unit_type: "Combat Vehicle", unit_type_short: "cv" }),
    row(4, "Lynx LNX-1", {
        alpha_strike: { type: "BM", size: 2, move: "10\"", tmm: 2, armor: 4, structure: 4, damage: { short: "2", medium: "2", long: "1" }, overheat: 0, point_value: 25, specials: [] },
    }),
];

const mocks = vi.hoisted(() => ({
    key: { value: "key" as string | null },
    fetchMordelDetail: vi.fn(),
    hideMordelUnit: vi.fn(),
    importMordelMech: vi.fn(),
    loadMordelList: vi.fn(),
    shipped: { value: true },
    topUpDue: vi.fn(),
    topUpMordelList: vi.fn(),
}));

vi.mock("../../data/mordel-list", () => ({
    loadMordelList: mocks.loadMordelList, hideMordelUnit: mocks.hideMordelUnit,
    mordelListShipped: () => mocks.shipped.value, mordelTopUpDue: mocks.topUpDue, topUpMordelList: mocks.topUpMordelList,
}));
vi.mock("../../utils/mordel/mordel-key", async (actual) => ({
    ...(await actual<typeof import("../../utils/mordel/mordel-key")>()),
    getMordelKey: () => mocks.key.value,
}));
vi.mock("../../utils/mordel/mordel-mtf", () => ({ importMordelMech: mocks.importMordelMech }));
vi.mock("../../utils/mordel/mordel-api", async (actual) => ({
    ...(await actual<typeof import("../../utils/mordel/mordel-api")>()),
    fetchMordelDetail: mocks.fetchMordelDetail,
}));

const mech = { getName: () => "Hornet" };

beforeEach(() => {
    mocks.key.value = "key";
    mocks.fetchMordelDetail.mockReset();
    mocks.hideMordelUnit.mockReset();
    mocks.importMordelMech.mockReset();
    mocks.loadMordelList.mockReset().mockResolvedValue(ROWS);
    mocks.shipped.value = true;
    mocks.topUpDue.mockReset().mockReturnValue(false);
    mocks.topUpMordelList.mockReset().mockResolvedValue({ fetched: 0, tooMany: false });
});
afterEach(cleanup);

const search = async (text: string) => {
    fireEvent.change(await screen.findByRole("searchbox"), { target: { value: text } });
};
const renderPanel = (props: Partial<React.ComponentProps<typeof MordelUnitsPanel>> = {}) => {
    const onAddMech = vi.fn();
    render(<MemoryRouter><MordelUnitsPanel mode="classic" onAddMech={onAddMech} {...props} /></MemoryRouter>);
    return { onAddMech };
};

describe("MordelUnitsPanel", () => {
    it("finds units by name and model, and only the types the page takes", async () => {
        renderPanel();
        await search("hnt-2");
        expect(screen.getByRole("button", { name: "Add Hornet HNT-2" })).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Add Hornet HNT-1" })).toBeNull();
        await search("wasp");
        // No vehicle handler: the vehicle is not offered.
        expect(screen.getByText("No mordel.net units match.")).toBeTruthy();
    });

    it("sends the user to Settings when no key is saved", async () => {
        mocks.key.value = null;
        renderPanel();
        await search("hornet");
        fireEvent.click(screen.getByRole("button", { name: "Add Hornet HNT-1" }));
        expect(await screen.findByText(/needs your own mordel.net API key/)).toBeTruthy();
        // A new tab, so the roster dialog keeps what the user has done.
        const settings = screen.getByRole("link", { name: "Open Settings (opens in a new tab)" });
        expect(settings.getAttribute("href")).toMatch(/\/settings$/);
        expect(settings.getAttribute("target")).toBe("_blank");
        expect(mocks.fetchMordelDetail).not.toHaveBeenCalled();
    });

    it("says so when mordel.net refuses the key", async () => {
        mocks.fetchMordelDetail.mockRejectedValue(new MordelKeyError("rejected"));
        renderPanel();
        await search("hornet");
        fireEvent.click(screen.getByRole("button", { name: "Add Hornet HNT-1" }));
        expect(await screen.findByText(/refused the saved API key/)).toBeTruthy();
        expect(screen.getByRole("alert").textContent).toMatch(/refused the saved API key/);
    });

    it("cautions about guessed parts even when the Battle Value matches", async () => {
        mocks.fetchMordelDetail.mockResolvedValue({ ...ROWS[0] });
        mocks.importMordelMech.mockReturnValue({ mech, issues: [], cautions: ["Check the arms."], bvOk: true, ourBV: 1000 });
        renderPanel();
        await search("hornet");
        fireEvent.click(screen.getByRole("button", { name: "Add Hornet HNT-1" }));
        expect(await screen.findByText("Hornet HNT-1 added.")).toBeTruthy();
        expect(screen.getByRole("status").textContent).toContain("Check the arms.");
    });

    it("labels the buttons Load in the designer", async () => {
        render(<MemoryRouter><MordelUnitsPanel mode="designer" onAddMech={vi.fn()} /></MemoryRouter>);
        await search("hnt-2");
        expect(screen.getByRole("button", { name: "Load Hornet HNT-2" }).textContent).toBe("Load");
    });

    it("does not add the unit when the panel closes before the pull finishes", async () => {
        let answer: (value: unknown) => void = () => undefined;
        mocks.fetchMordelDetail.mockReturnValue(new Promise((resolve) => { answer = resolve; }));
        mocks.importMordelMech.mockReturnValue({ mech, issues: [], cautions: [], bvOk: true, ourBV: 1000 });
        const { onAddMech } = renderPanel();
        await search("hornet");
        fireEvent.click(screen.getByRole("button", { name: "Add Hornet HNT-1" }));
        cleanup();
        answer({ ...ROWS[0] });
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(onAddMech).not.toHaveBeenCalled();
    });

    it("switches tabs with the arrow keys", async () => {
        renderPanel();
        const list = screen.getByRole("tab", { name: "Mordel.net units" });
        fireEvent.keyDown(list, { key: "ArrowRight" });
        const mineTab = screen.getByRole("tab", { name: "My Mordel designs" });
        expect(mineTab.getAttribute("aria-selected")).toBe("true");
        expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(mineTab.id);
        fireEvent.keyDown(mineTab, { key: "ArrowRight" });
        expect(screen.getByRole("tab", { name: "Mordel.net units" }).getAttribute("aria-selected")).toBe("true");
    });

    it("says so when this build ships no list", async () => {
        mocks.loadMordelList.mockResolvedValue([]);
        mocks.shipped.value = false;
        renderPanel();
        expect(await screen.findByText(/does not ship the mordel.net list/)).toBeTruthy();
    });

    it("tops the list up once it is due, with a key, and shows the new rows", async () => {
        mocks.topUpDue.mockReturnValue(true);
        mocks.loadMordelList.mockResolvedValueOnce([]).mockResolvedValue(ROWS);
        renderPanel();
        await search("hnt-2");
        expect(await screen.findByRole("button", { name: "Add Hornet HNT-2" })).toBeTruthy();
        expect(mocks.topUpMordelList).toHaveBeenCalledTimes(1);
    });

    it("does not top up without a key", async () => {
        mocks.key.value = null;
        mocks.topUpDue.mockReturnValue(true);
        renderPanel();
        await search("hnt-2");
        expect(mocks.topUpMordelList).not.toHaveBeenCalled();
    });

    it("hides a unit mordel.net no longer has, with a note", async () => {
        mocks.fetchMordelDetail.mockResolvedValue(null);
        const { onAddMech } = renderPanel();
        await search("hornet");
        fireEvent.click(screen.getByRole("button", { name: "Add Hornet HNT-1" }));
        expect(await screen.findByText(/no longer has Hornet HNT-1/)).toBeTruthy();
        expect(mocks.hideMordelUnit).toHaveBeenCalledWith("bm/1");
        expect(screen.queryByRole("button", { name: "Add Hornet HNT-1" })).toBeNull();
        expect(onAddMech).not.toHaveBeenCalled();
    });

    it("adds a unit whose Battle Value is not mordel.net's, with a warning", async () => {
        mocks.fetchMordelDetail.mockResolvedValue({ ...ROWS[0] });
        mocks.importMordelMech.mockReturnValue({ mech, issues: ["'Quantum Flux' has no match"], bvOk: false, ourBV: 990 });
        const { onAddMech } = renderPanel();
        await search("hornet");
        fireEvent.click(screen.getByRole("button", { name: "Add Hornet HNT-1" }));
        expect(await screen.findByText(/our Battle Value is 990 and mordel.net's is 1000/)).toBeTruthy();
        expect(screen.getByText("'Quantum Flux' has no match")).toBeTruthy();
        expect(onAddMech).toHaveBeenCalledWith(mech);
    });

    it("adds an Alpha Strike card straight from the list, without a key", async () => {
        mocks.key.value = null;
        const onAddAS = vi.fn();
        render(<MemoryRouter><MordelUnitsPanel mode="alpha-strike" onAddAS={onAddAS} /></MemoryRouter>);
        await search("lnx");
        fireEvent.click(screen.getByRole("button", { name: "Add Lynx LNX-1" }));
        await waitFor(() => expect(onAddAS).toHaveBeenCalledTimes(1));
        expect(onAddAS.mock.calls[0][0].basePoints).toBe(25);
        // Rows without a card are not offered for Alpha Strike.
        await search("hornet");
        expect(screen.getByText("No mordel.net units match.")).toBeTruthy();
    });

    it("explains when the key has no designs on mordel.net", async () => {
        const api = await import("../../utils/mordel/mordel-api");
        vi.spyOn(api, "fetchMyMordelUnits").mockResolvedValue([]);
        renderPanel();
        fireEvent.click(screen.getByRole("tab", { name: "My Mordel designs" }));
        fireEvent.click(screen.getByRole("button", { name: "Load my designs" }));
        expect(await screen.findByText(/lists no designs under this key/)).toBeTruthy();
    });
});
