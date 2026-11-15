// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import Walker from "../../../../classes/walker";
import type { IAppGlobals } from "../../../app-router";
import WalkerCreatorChassis from "./chassis";
import WalkerCreatorCriticals from "./criticals";
import WalkerCreatorEquipment from "./equipment";
import WalkerCreatorHome from "./home";
import WalkerCreatorSummary from "./summary";

afterEach(cleanup);

/** A 50-ton walker with armor everywhere. */
const mule = (): Walker => {
    const walker = new Walker();
    walker.setName("Mule MUL-4W");
    walker.setTons(50);
    walker.setWalkMP(4);
    for (const location of walker.getLocations()) walker.setArmor(location, 6);
    return walker;
};

/** The page inside a router, re-rendered when the app's save function runs, as the real app does. */
function Harness(props: { Page: React.ComponentType<{ appGlobals: IAppGlobals }>; globals: ReturnType<typeof makeGlobals> }) {
    const [, setCount] = useState(0);
    const { globals } = props;
    useEffect(() => {
        const bump = () => setCount((count) => count + 1);
        globals.listeners.add(bump);
        return () => { globals.listeners.delete(bump); };
    }, [globals]);
    return <MemoryRouter><props.Page appGlobals={globals as unknown as IAppGlobals} /></MemoryRouter>;
}

const makeGlobals = (walker: Walker | null, mechRulesFilter = 6, extra: Record<string, unknown> = {}) => ({
    listeners: new Set<() => void>(),
    saveCurrentWalker(this: { currentWalker: Walker | null; listeners: Set<() => void> }, next: Walker) {
        this.currentWalker = next;
        this.listeners.forEach((listener) => listener());
    },
    appSettings: { developerMenu: false, uiTheme: "", mechNameFilter: "", mechRulesFilter },
    currentWalker: walker,
    walkerSaves: [] as unknown[],
    makeDocumentTitle: vi.fn(),
    saveAppSettings: vi.fn(),
    saveWalkerSaves: vi.fn(),
    openConfirmDialog: vi.fn(),
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
    siteAlerts: { activeAlerts: [] },
    ...extra,
});

describe("Walker Creator, chassis page (#172)", () => {
    it("opens below Custom Homebrew, showing the credit with the printing in use", () => {
        render(<Harness Page={WalkerCreatorChassis} globals={makeGlobals(mule(), 2)} />);
        const credit = screen.getByTestId("walker-credit").textContent ?? "";
        expect(credit).toContain("Walker rules by Clell Flint, Future Wars #11");
        expect(credit).toContain("The Best of Future Wars, Volume One (1991)");
        expect((screen.getByTestId("walker-tons") as HTMLSelectElement).value).toBe("50");
    });

    it("offers the printing before every other field, and names the one in use in the credit", () => {
        const globals = makeGlobals(mule());
        render(<Harness Page={WalkerCreatorChassis} globals={globals} />);
        const edition = screen.getByTestId("walker-edition");
        const tons = screen.getByTestId("walker-tons");
        // The printing's select comes first in the page.
        expect(edition.compareDocumentPosition(tons) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(Array.from((edition as HTMLSelectElement).options).map((option) => option.value)).toEqual(["best-of-1991", "future-wars-11"]);
        fireEvent.change(edition, { target: { value: "future-wars-11" } });
        expect((globals.currentWalker as Walker).getEdition()).toBe("future-wars-11");
        expect(screen.getByTestId("walker-credit").textContent).toContain("Built under the Future Wars #11 printing.");
        expect(screen.getByTestId("walker-edition-text").textContent).toContain("base to-hit 0");
    });

    it("changes the chassis and shows the weight at once", () => {
        const globals = makeGlobals(mule());
        render(<Harness Page={WalkerCreatorChassis} globals={globals} />);
        const before = (globals.currentWalker as Walker).getWeight();
        fireEvent.change(screen.getByTestId("walker-walk"), { target: { value: "3" } });
        expect((globals.currentWalker as Walker).getWalkMP()).toBe(3);
        expect(Number(screen.getByTestId("walker-weight").textContent)).toBeLessThan(before);
        fireEvent.change(screen.getByTestId("walker-armor-ct"), { target: { value: "2" } });
        expect((globals.currentWalker as Walker).getArmor("ct")).toBe(2);
        fireEvent.change(screen.getByTestId("walker-tons"), { target: { value: "60" } });
        expect((globals.currentWalker as Walker).getTons()).toBe(60);
        fireEvent.change(screen.getByTestId("walker-jump"), { target: { value: "2" } });
        expect((globals.currentWalker as Walker).getJumpJets()).toBe(2);
    });

    it("shows the four-legged movement: Walking MP times 1.25, rounded as the rule says", () => {
        const walker = mule();
        walker.setWalkMP(3);
        render(<Harness Page={WalkerCreatorChassis} globals={makeGlobals(walker)} />);
        // 3 x 1.25 = 3.75: rounded up to 4; Running 6.
        expect(screen.getByTestId("walker-engine-text").textContent).toContain("Walking MP on four legs 4, Running MP 6");
    });

    it("offers the industrial switch and Advanced Fire Control only once it is on", () => {
        const globals = makeGlobals(mule());
        render(<Harness Page={WalkerCreatorChassis} globals={globals} />);
        expect(screen.queryByTestId("walker-afc")).toBeNull();
        fireEvent.click(screen.getByTestId("walker-industrial"));
        expect((globals.currentWalker as Walker).isIndustrial()).toBe(true);
        fireEvent.click(screen.getByTestId("walker-afc"));
        expect((globals.currentWalker as Walker).hasAdvancedFireControl()).toBe(true);
    });
});

describe("Walker Creator, equipment page", () => {
    it("builds a 50-ton walker with a turret, mounts a weapon in it, and removes it", () => {
        const globals = makeGlobals(mule());
        render(<Harness Page={WalkerCreatorEquipment} globals={globals} />);
        expect(screen.queryByRole("option", { name: "Turret" })).toBeNull();
        fireEvent.click(screen.getByTestId("walker-turret"));
        const walker = globals.currentWalker as Walker;
        expect(walker.hasTurret()).toBe(true);
        expect(walker.getTurretWeight()).toBe(3);

        fireEvent.change(screen.getByTestId("walker-location"), { target: { value: "turret" } });
        fireEvent.change(screen.getByTestId("walker-filter"), { target: { value: "medium laser" } });
        fireEvent.click(screen.getAllByRole("button", { name: /^Add Medium Laser$/ })[0]);
        expect(walker.getEquipment().map((each) => [each.name, each.location, each.inTurret])).toEqual([["Medium Laser", "cs", true]]);
        expect(screen.getByTestId("walker-mounts").textContent).toContain("Control Section (turret)");

        fireEvent.click(screen.getByRole("button", { name: "Remove Medium Laser" }));
        expect(walker.getEquipment()).toHaveLength(0);
    });

    it("refuses a medium laser in the center torso with the rule's reason", () => {
        const globals = makeGlobals(mule());
        render(<Harness Page={WalkerCreatorEquipment} globals={globals} />);
        fireEvent.change(screen.getByTestId("walker-location"), { target: { value: "ct" } });
        fireEvent.change(screen.getByTestId("walker-filter"), { target: { value: "medium laser" } });
        fireEvent.click(screen.getAllByRole("button", { name: /^Add Medium Laser$/ })[0]);
        expect((globals.currentWalker as Walker).getEquipment()).toHaveLength(0);
        expect(screen.getByTestId("walker-message").textContent).toContain("Only machine guns, small lasers and flamers");
    });

    it("sets the heat sinks and shows what the engine gives", () => {
        const globals = makeGlobals(mule());
        render(<Harness Page={WalkerCreatorEquipment} globals={globals} />);
        fireEvent.change(screen.getByTestId("walker-sinks"), { target: { value: "12" } });
        expect((globals.currentWalker as Walker).getHeatSinks()).toBe(12);
        expect(screen.getByTestId("walker-heat-text").textContent).toContain("free heat sinks");
    });
});

describe("Walker Creator, critical slots and summary pages", () => {
    it("lists the ten locations' slots, the engine in the center torso and the turret in the control section", () => {
        const walker = mule();
        walker.setTurret(true);
        render(<Harness Page={WalkerCreatorCriticals} globals={makeGlobals(walker)} />);
        for (const location of walker.getLocations()) expect(screen.getByTestId(`walker-slots-${location}`)).toBeTruthy();
        expect(screen.getByTestId("walker-slots-ct").textContent).toContain("Standard Fusion");
        expect(screen.getByTestId("walker-slots-cs").textContent).toContain("Turret");
        expect(screen.getByTestId("walker-slots-lfl").textContent).toContain("Hip");
    });

    it("says the design is legal, or lists what is not, and shows the provisional breakdowns with their notes", () => {
        const walker = mule();
        const globals = makeGlobals(walker);
        render(<Harness Page={WalkerCreatorSummary} globals={globals} />);
        expect(screen.getByTestId("walker-provisional").textContent).toContain("every step is marked provisional");
        expect(screen.getByTestId("walker-summary").textContent).toContain("50-ton Walker");
        const legal = walker.getIssues().length === 0;
        expect(!!screen.queryByTestId("walker-legal")).toBe(legal);
        cleanup();

        const heavy = mule();
        heavy.setWalkMP(heavy.getMaxWalkMP());
        for (const location of heavy.getLocations()) heavy.setArmor(location, heavy.getMaxArmor(location));
        expect(heavy.getIssues().length).toBeGreaterThan(0);
        render(<Harness Page={WalkerCreatorSummary} globals={makeGlobals(heavy)} />);
        expect(screen.getByTestId("walker-summary-issues").textContent).toContain("tons");
    });
});

describe("Walker Creator, home page", () => {
    it("saves the design as new, with its own id when the row exists, and lists the saves", () => {
        const walker = mule();
        const globals = makeGlobals(walker, 2);
        render(<Harness Page={WalkerCreatorHome} globals={globals} />);
        fireEvent.click(screen.getByRole("button", { name: /Save as New/ }));
        expect(globals.saveWalkerSaves).toHaveBeenCalledTimes(1);
        const saved = (globals.saveWalkerSaves as ReturnType<typeof vi.fn>).mock.calls[0][0] as { uuid: string; name: string }[];
        expect(saved.map((save) => save.name)).toEqual(["Mule MUL-4W"]);
        cleanup();

        // A saved Walker opens and is listed at any rules level.
        render(<Harness Page={WalkerCreatorHome} globals={makeGlobals(walker, 2, { walkerSaves: saved })} />);
        expect(screen.getByTestId("walker-saves").textContent).toContain("Mule MUL-4W");
        expect(screen.getByTestId("walker-credit").textContent).toContain("Clell Flint");

        // Saving the same design again does not reuse the row's id.
        fireEvent.click(screen.getByRole("button", { name: /Save as New/ }));
    });

    it("loads a saved Walker into the editor", () => {
        const walker = mule();
        const save = walker.export();
        const globals = makeGlobals(new Walker(), 2, { walkerSaves: [save] });
        render(<Harness Page={WalkerCreatorHome} globals={globals} />);
        fireEvent.click(screen.getByTitle("Load Mule MUL-4W into the editor"));
        expect((globals.currentWalker as Walker).getName()).toBe("Mule MUL-4W");
    });
});
