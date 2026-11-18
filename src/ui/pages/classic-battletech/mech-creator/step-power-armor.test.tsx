// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../../classes/battlemech";
import { FW_POWER_ARMOR_RULESET } from "../../../../data/future-wars-power-armor";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../../../data/rules-level-options";
import type { IAppGlobals } from "../../../app-router";
import { buildMech } from "../../../../test-support/builders";
import MechCreatorStep1 from "./step1";
import MechCreatorStep2 from "./step2";
import MechCreatorStep6 from "./step6";

/** Power Armor plan, Chunk B (#172): Bill Swisher's Power Armor in the 'Mech creator. */
afterEach(cleanup);

const PA = FW_POWER_ARMOR_RULESET;

const build = (tonnage: number, rulesets: string[] = [PA]): BattleMech => buildMech({ tonnage, walk: 6, homebrew: rulesets });

const globals = (mech: BattleMech): IAppGlobals => ({
    appSettings: { developerMenu: false, uiTheme: "", equipmentFilter: "", installEquipCategory: "", mechRulesFilter: CUSTOM_HOMEBREW_RULES_LEVEL },
    currentBattleMech: mech,
    saveCurrentBattleMech: vi.fn(),
    makeDocumentTitle: vi.fn(),
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
    siteAlerts: { activeAlerts: [] },
} as unknown as IAppGlobals);

const renderWith = (page: React.ReactElement): void => { render(<MemoryRouter>{page}</MemoryRouter>); };

const tonnages = (): number[] => Array.from((screen.getByLabelText(/Mech Tonnage/) as HTMLSelectElement).options).map(option => Number(option.value));
const selectLabelled = (label: RegExp): HTMLSelectElement => screen.getByLabelText(label) as HTMLSelectElement;

describe("Power Armor in the 'Mech creator (#172)", () => {
    it("step 1 offers 5, 10 and 15 tons with the ruleset, the usual list without it", () => {
        renderWith(<MechCreatorStep1 appGlobals={globals(build(10))} />);
        expect(tonnages()).toEqual([5, 10, 15]);
        cleanup();
        renderWith(<MechCreatorStep1 appGlobals={globals(build(10, []))} />);
        expect(tonnages()).not.toContain(5);
        expect(tonnages()).toContain(100);
    });

    it("step 1 moves a 50-ton 'Mech to 15 tons when the ruleset is ticked", () => {
        const mech = build(50, []);
        renderWith(<MechCreatorStep1 appGlobals={globals(mech)} />);
        fireEvent.change(selectLabelled(/Special Rulesets/), { target: { value: "yes" } });
        fireEvent.click(screen.getByRole("checkbox", { name: /Future Wars: Power Armor/ }));
        expect(mech.usesPowerArmorConstruction()).toBe(true);
        expect(mech.getTonnage()).toBe(15);
    });

    it("step 2 shows the waldo as the cockpit and no gyro at 5 tons", () => {
        const mech = build(5);
        renderWith(<MechCreatorStep2 appGlobals={globals(mech)} />);
        const cockpit = selectLabelled(/Select Cockpit/);
        expect(cockpit.value).toBe("power-armor-waldo");
        expect(Array.from(cockpit.options).map(option => option.textContent)).toEqual([expect.stringMatching(/Power Armor Waldo System/)]);
        const gyro = selectLabelled(/Select Gyro Type/);
        expect(gyro.value).toBe("none");
        expect(Array.from(gyro.options).map(option => option.value)).toEqual(["none"]);
    });

    it("step 2 keeps a gyro choice at 10 tons", () => {
        renderWith(<MechCreatorStep2 appGlobals={globals(build(10))} />);
        const gyro = selectLabelled(/Select Gyro Type/);
        expect(gyro.value).toBe("standard");
        expect(Array.from(gyro.options).map(option => option.value)).not.toContain("none");
    });

    it("step 6 lists the suit's issues: a weapon off the 5-ton list and a pilot who cannot pilot it", () => {
        const mech = build(5);
        mech.addEquipmentFromTag("medium-laser", "is", "", false, undefined, "", false, [], undefined, undefined);
        mech.setPilotPiloting(5);
        renderWith(<MechCreatorStep6 appGlobals={globals(mech)} />);
        const text = document.body.textContent ?? "";
        expect(text).toContain("a 5-ton Power Armor suit carries only flamers, machine guns and small lasers");
        expect(text).toContain("a pilot of Piloting 5 or worse cannot pilot it");
    });
});

describe("Sample Power Armor in step 1 (Chunk E)", () => {
    const loaded = (appGlobals: IAppGlobals): BattleMech => vi.mocked(appGlobals.saveCurrentBattleMech).mock.calls.at(-1)?.[0] as BattleMech;

    it("loads a sample suit with the ruleset ticked, from a design without it", () => {
        // A fresh design: nothing would be lost, so no confirmation is asked.
        const appGlobals = globals(new BattleMech());
        renderWith(<MechCreatorStep1 appGlobals={appGlobals} />);
        fireEvent.change(screen.getByTestId("power-armor-samples"), { target: { value: "ipa-3" } });
        const suit = loaded(appGlobals);
        expect([suit.getModelName(), suit.getTonnage(), suit.usesPowerArmorConstruction()]).toEqual(["IPA-3", 15, true]);
        expect(suit.getChassisEquipmentViolations()).toEqual([]);
    });

    it("drops a ruleset that cannot sit with Power Armor (Flint's construction) and keeps the others", () => {
        const current = build(50, ["best-of-future-wars-construction", "fw-morale"]);
        const appGlobals = globals(current);
        // The current design is saved, so nothing would be lost and no confirmation is asked.
        (appGlobals as unknown as { battleMechSaves: unknown[] }).battleMechSaves = [current.export()];
        renderWith(<MechCreatorStep1 appGlobals={appGlobals} />);
        fireEvent.change(screen.getByTestId("power-armor-samples"), { target: { value: "ipa-1" } });
        expect([...loaded(appGlobals).getRulesets()].sort()).toEqual([PA, "fw-morale"].sort());
    });

    it("offers no sample suits below Custom Homebrew", () => {
        const appGlobals = globals(new BattleMech());
        (appGlobals.appSettings as { mechRulesFilter: number }).mechRulesFilter = 2;
        renderWith(<MechCreatorStep1 appGlobals={appGlobals} />);
        expect(screen.queryByTestId("power-armor-samples")).toBeNull();
    });
});
