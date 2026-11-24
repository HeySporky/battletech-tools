// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import MicroMech from "../../../../classes/micro-mech";
import { MICRO_MECH_CREDIT } from "../../../../data/micro-mech-construction";
import type { IAppGlobals } from "../../../app-router";
import MicroMechCreatorChassis from "./chassis";
import MicroMechCreatorEquipment from "./equipment";
import MicroMechCreatorHome from "./home";
import MicroMechCreatorSummary from "./summary";

afterEach(cleanup);

const storm = (): MicroMech => {
    const micro = new MicroMech();
    micro.setName("Storm STM-3X");
    micro.setTons(11);
    micro.setWalkMP(6);
    micro.setJumpJets(6);
    for (const [location, points] of [["head", 4], ["torso", 16], ["torsoRear", 6], ["la", 4], ["ra", 4], ["ll", 6], ["rl", 6]] as const) micro.setArmor(location, points);
    return micro;
};

/** The Storm as the document prints it: its chassis, an ER Small Laser, and a Machine Gun with 500 kg of ammunition. */
const stormArmed = (): MicroMech => {
    const micro = storm();
    micro.addMount("micro-er-laser-small", "ra");
    micro.addMount("micro-machine-gun", "la");
    micro.setAmmo(1, 500, "torso");
    return micro;
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

const makeGlobals = (micro: MicroMech | null, mechRulesFilter = 2, extra: Record<string, unknown> = {}) => ({
    listeners: new Set<() => void>(),
    saveCurrentMicroMech(this: { currentMicroMech: MicroMech | null; listeners: Set<() => void> }, next: MicroMech) {
        this.currentMicroMech = next;
        this.listeners.forEach((listener) => listener());
    },
    appSettings: { developerMenu: false, uiTheme: "", mechNameFilter: "", mechRulesFilter },
    currentMicroMech: micro,
    microMechSaves: [],
    makeDocumentTitle: vi.fn(),
    saveAppSettings: vi.fn(),
    saveMicroMechSaves: vi.fn(),
    openConfirmDialog: vi.fn(),
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
    siteAlerts: { activeAlerts: [] },
    ...extra,
});

describe("Micro-Mech Creator, chassis page (#173)", () => {
    it("opens below Custom Homebrew, with the credit and the fan-made mark", () => {
        render(<Harness Page={MicroMechCreatorChassis} globals={makeGlobals(stormArmed(), 2)} />);
        expect(screen.getByTestId("mm-credit").textContent).toContain(MICRO_MECH_CREDIT);
        expect(screen.getByTestId("mm-credit").textContent).toContain("NOT OFFICIAL");
        expect((screen.getByTestId("mm-tons") as HTMLSelectElement).value).toBe("11");
        expect(screen.getByTestId("mm-weight").textContent).toBe("10975");
    });

    it("changes the chassis and shows the weight at once", () => {
        const globals = makeGlobals(storm());
        render(<Harness Page={MicroMechCreatorChassis} globals={globals} />);
        fireEvent.change(screen.getByTestId("mm-walk"), { target: { value: "5" } });
        expect((globals.currentMicroMech as MicroMech).getWalkMP()).toBe(5);
        fireEvent.change(screen.getByTestId("mm-armor-head"), { target: { value: "2" } });
        expect((globals.currentMicroMech as MicroMech).getArmor("head")).toBe(2);
        fireEvent.change(screen.getByTestId("mm-layout"), { target: { value: "quad" } });
        expect((globals.currentMicroMech as MicroMech).isQuad()).toBe(true);
        expect(screen.queryByTestId("mm-lower-arm-left")).toBeNull();
    });

    it("switches the rules text, keeps the design and lists what is no longer legal", () => {
        const globals = makeGlobals(storm());
        render(<Harness Page={MicroMechCreatorChassis} globals={globals} />);
        fireEvent.change(screen.getByTestId("mm-version"), { target: { value: "solarmech-2019" } });
        const micro = globals.currentMicroMech as MicroMech;
        expect(micro.getVersion()).toBe("solarmech-2019");
        expect(micro.getArmorPoints()).toBe(46);
        expect(screen.getByTestId("mm-version-issues").textContent).toContain("Nothing was removed");
        expect(screen.getByTestId("mm-borrowed").textContent).toContain("6.1.0.2");
        // 2019 offers no quad.
        const layouts = Array.from((screen.getByTestId("mm-layout") as HTMLSelectElement).options).map((option) => option.value);
        expect(layouts).toEqual(["biped"]);
    });
});

describe("Micro-Mech Creator, equipment page", () => {
    it("mounts a weapon, buys its ammunition, and removes it", () => {
        const globals = makeGlobals(storm());
        render(<Harness Page={MicroMechCreatorEquipment} globals={globals} />);
        fireEvent.change(screen.getByTestId("mm-location"), { target: { value: "ra" } });
        fireEvent.click(screen.getByRole("button", { name: "Add Laser, Medium" }));
        const micro = globals.currentMicroMech as MicroMech;
        expect(micro.getMounts().map((mount) => mount.item.name)).toEqual(["Laser, Medium"]);
        fireEvent.change(screen.getByTestId("mm-location"), { target: { value: "torso" } });
        fireEvent.change(screen.getByTestId("mm-filter"), { target: { value: "machine gun" } });
        fireEvent.click(screen.getByRole("button", { name: "Add Machine Gun" }));
        fireEvent.change(screen.getByTestId("mm-ammo-1-standard"), { target: { value: "500" } });
        expect(micro.getAmmoLots()[0].kg).toBe(500);
        fireEvent.click(screen.getByRole("button", { name: "Remove Machine Gun" }));
        expect(micro.getMounts()).toHaveLength(1);
    });

    it("puts a new lot of ammunition where it fits, and lets it be moved", () => {
        const globals = makeGlobals(storm());
        render(<Harness Page={MicroMechCreatorEquipment} globals={globals} />);
        fireEvent.change(screen.getByTestId("mm-location"), { target: { value: "la" } });
        fireEvent.change(screen.getByTestId("mm-filter"), { target: { value: "machine gun" } });
        fireEvent.click(screen.getByRole("button", { name: "Add Machine Gun" }));
        // The left arm is now full, so the ammunition goes to the torso, as the Storm's readout has it.
        fireEvent.change(screen.getByTestId("mm-ammo-0-standard"), { target: { value: "500" } });
        const micro = globals.currentMicroMech as MicroMech;
        expect(micro.getAmmoLots()[0]).toMatchObject({ kg: 500, location: "torso" });
        fireEvent.change(screen.getByTestId("mm-ammo-location-0-standard"), { target: { value: "ra" } });
        expect(micro.getAmmoLots()[0].location).toBe("ra");
        expect(screen.queryByTestId("mm-message")).toBeNull();
    });

    it("says why an item is refused", () => {
        const globals = makeGlobals(storm());
        render(<Harness Page={MicroMechCreatorEquipment} globals={globals} />);
        // The head has two slots (cockpit and sensors fixed): a three-slot item cannot go there.
        fireEvent.change(screen.getByTestId("mm-location"), { target: { value: "head" } });
        fireEvent.change(screen.getByTestId("mm-filter"), { target: { value: "LRM 9" } });
        fireEvent.click(screen.getByRole("button", { name: "Add LRM 9" }));
        expect((globals.currentMicroMech as MicroMech).getMounts()).toHaveLength(0);
        expect(screen.getByTestId("mm-message").textContent).toContain("does not fit");
    });

    it("sets the extra heat sinks", () => {
        const globals = makeGlobals(storm());
        render(<Harness Page={MicroMechCreatorEquipment} globals={globals} />);
        fireEvent.change(screen.getByTestId("mm-extra-sinks"), { target: { value: "2" } });
        expect((globals.currentMicroMech as MicroMech).getExtraHeatSinks()).toBe(2);
    });
});

describe("Micro-Mech Creator, home and summary", () => {
    it("lists the saved designs at any rules level and loads one", () => {
        const save = storm().export();
        const globals = makeGlobals(new MicroMech(), 2, { microMechSaves: [save] });
        render(<Harness Page={MicroMechCreatorHome} globals={globals} />);
        expect(screen.getByText("Storm STM-3X")).not.toBeNull();
        fireEvent.click(screen.getByTitle("Load Storm STM-3X into the editor"));
        expect((globals.currentMicroMech as MicroMech).getName()).toBe("Storm STM-3X");
    });

    it("offers the document's four sample designs and loads one", () => {
        const globals = makeGlobals(new MicroMech());
        render(<Harness Page={MicroMechCreatorHome} globals={globals} />);
        expect(screen.getByTestId("mm-samples").querySelectorAll("tbody tr")).toHaveLength(4);
        fireEvent.click(screen.getByTestId("mm-sample-hillman-hmn-2x"));
        const loaded = globals.currentMicroMech as MicroMech;
        expect(loaded.getName()).toBe("Hillman HMN-2X");
        expect(loaded.isQuad()).toBe(true);
        expect(loaded.getWeight()).toBe(14975);
    });

    it("saves the design as new, and starts a blank one", () => {
        const globals = makeGlobals(storm());
        render(<Harness Page={MicroMechCreatorHome} globals={globals} />);
        fireEvent.click(screen.getByRole("button", { name: /Save as New/ }));
        expect(globals.saveMicroMechSaves).toHaveBeenCalledTimes(1);
        const saved = (globals.saveMicroMechSaves as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(saved).toHaveLength(1);
        expect(saved[0].name).toBe("Storm STM-3X");
    });

    it("shows the cost, the Battle Value and the document's printed figures for a sample", () => {
        render(<Harness Page={MicroMechCreatorSummary} globals={makeGlobals(stormArmed())} />);
        expect(screen.getByTestId("mm-legal")).not.toBeNull();
        expect(screen.getByTestId("mm-summary").textContent).toContain("Cost");
        expect(screen.getByTestId("mm-printed").textContent).toContain("Battle Value 217");
        expect(screen.getByTestId("mm-weight-log").textContent).toContain("10975 kg");
    });

    it("shows the Alpha Strike figures on the summary, marked not official, with a link to the rules", () => {
        render(<Harness Page={MicroMechCreatorSummary} globals={makeGlobals(stormArmed())} />);
        const text = screen.getByTestId("micro-alpha-strike").textContent ?? "";
        expect(text).toContain("Type: MM");
        expect(text).toContain('Move: 12"j');
        expect(text).toContain("Damage (S/M/L): 1/0*/0");
        expect(text).toContain("Specials: MCR");
        expect(text).toContain("Point Value: 11");
        expect(screen.getByTestId("micro-alpha-strike-log").textContent).toContain("Armor: 46 / 30");
        expect(screen.getByText("View Alpha Strike Card").getAttribute("href")).toContain("/micro-mech-creator/print-as");
        expect(screen.getByText("TRO - JBT: Micro-Mechs").getAttribute("href")).toContain("/tro-jbt/micro-mechs");
    });
});
