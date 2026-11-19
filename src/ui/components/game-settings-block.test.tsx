// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IGameSettings } from "../../data/game-settings";
import { DEFAULT_RULES_EDITION, RulesEditionUnitType } from "../../data/rules-editions";
import { btSpecialRulesets } from "../../data/special-rulesets";
import Vehicle from "../../classes/vehicle";
import { IAppGlobals } from "../app-router";
import GameSettingsBlock, { UnitGameSettingsBlock, unitRulesLevel } from "./game-settings-block";
import { testSpecialRuleset } from "../../test-support/rulesets";

afterEach(() => {
    cleanup();
    const index = btSpecialRulesets.findIndex((ruleset) => ruleset.id === "test-clash");
    if (index >= 0) btSpecialRulesets.splice(index, 1);
});

const base: IGameSettings = { rulesets: [], edition: DEFAULT_RULES_EDITION, rulesLevel: 2, techBase: "clan", era: "clan-inv" };
const SAMPLE = "Sample: The Clans never existed (alternate universe)";

// The parent keeps the settings, as a builder does with its design.
function Harness(props: { start: IGameSettings; unitType?: RulesEditionUnitType; hiddenSteps?: Array<"edition" | "techBase" | "era">; onChange?: (settings: IGameSettings, step: string) => void }) {
    const [settings, setSettings] = useState(props.start);
    return <GameSettingsBlock unitType={props.unitType ?? "mech"} hiddenSteps={props.hiddenSteps} settings={settings} onChange={(next, step) => { props.onChange?.(next, step); setSettings(next); }} />;
}

const select = (label: RegExp) => screen.getByLabelText(label) as HTMLSelectElement;
const optionNames = (label: RegExp) => Array.from(select(label).options).map((option) => option.textContent);

describe("GameSettingsBlock (#324)", () => {
    it("shows the steps in order: Special Rulesets, Rules Edition, Rules Level, Technology Base, Era", () => {
        const { container } = render(<Harness start={base} />);
        const text = container.textContent ?? "";
        const at = ["Special Rulesets:", "Rules Edition:", "Rules Level:", "Technology Base:", "Era:"].map((label) => text.indexOf(label));
        expect(at.every((index) => index >= 0)).toBe(true);
        expect([...at].sort((a, b) => a - b)).toEqual(at);
    });

    it("Special Rulesets defaults to No and Yes opens the window", () => {
        render(<Harness start={base} />);
        expect(select(/Special Rulesets/).value).toBe("no");
        fireEvent.change(select(/Special Rulesets/), { target: { value: "yes" } });
        expect(screen.getByRole("dialog")).toBeTruthy();
        expect(screen.getByLabelText(new RegExp(SAMPLE.replace(/[()]/g, "\\$&")))).toBeTruthy();
        expect(screen.getByText(/the Clans never formed/)).toBeTruthy();
    });

    it("No clears a requirement and the ruleset that needs it in one go", () => {
        btSpecialRulesets.push(
            testSpecialRuleset({ id: "test-clash", name: "C", changes: ["c"] }),
            testSpecialRuleset({ id: "test-needs-c", name: "D", changes: ["d"], requires: ["test-clash"] }),
        );
        try {
            const onChange = vi.fn();
            render(<Harness start={{ ...base, rulesets: ["test-clash", "test-needs-c"] }} onChange={onChange} />);
            fireEvent.change(select(/Special Rulesets/), { target: { value: "no" } });
            expect(onChange.mock.calls.at(-1)?.[0].rulesets).toEqual([]);
            expect(select(/Special Rulesets/).value).toBe("no");
        } finally {
            const index = btSpecialRulesets.findIndex((ruleset) => ruleset.id === "test-needs-c");
            if (index >= 0) btSpecialRulesets.splice(index, 1);
        }
    });

    it("ticking the no-Clans universe on a Clan design moves Tech Base and reports it", () => {
        render(<Harness start={base} />);
        fireEvent.change(select(/Special Rulesets/), { target: { value: "yes" } });
        fireEvent.click(screen.getByRole("checkbox", { name: new RegExp(SAMPLE.replace(/[()]/g, "\\$&")) }));
        expect(optionNames(/Technology Base/)).toEqual(["Inner Sphere"]);
        expect(screen.getByRole("status").textContent).toMatch(/Tech Base moved to Inner Sphere/);
    });

    it("No clears the rulesets with no moves", () => {
        const onChange = vi.fn();
        render(<Harness start={{ ...base, techBase: "is", era: "star-league", rulesets: ["sample-no-clans"] }} onChange={onChange} />);
        expect(select(/Special Rulesets/).value).toBe("yes");
        fireEvent.change(select(/Special Rulesets/), { target: { value: "no" } });
        expect(onChange.mock.lastCall?.[0].rulesets).toEqual([]);
        expect(screen.queryByText(/moved to/)).toBeNull();
        expect(optionNames(/Technology Base/)).toContain("Clan");
    });

    it("a clashing ruleset is disabled and names the one it clashes with", () => {
        btSpecialRulesets.push(testSpecialRuleset({ id: "test-clash", name: "Test clash", changes: ["techBases"] }));
        render(<Harness start={{ ...base, techBase: "is", era: "star-league", rulesets: ["sample-no-clans"] }} />);
        fireEvent.click(screen.getByRole("button", { name: /Choose rulesets/ }));
        const clash = screen.getByRole("checkbox", { name: /Test clash/ }) as HTMLInputElement;
        expect(clash.disabled).toBe(true);
        expect(screen.getByText(new RegExp("Clashes with " + SAMPLE.replace(/[()]/g, "\\$&")))).toBeTruthy();
    });

    it("a stored value the lists do not offer is kept and flagged", () => {
        render(<Harness start={{ ...base, rulesets: ["sample-no-clans"] }} />);
        expect(select(/Technology Base/).value).toBe("clan");
        expect(screen.getByText(/The stored value is not offered under the ticked rulesets/)).toBeTruthy();
    });

    it("an edition without eras hides the Era step", () => {
        render(<Harness start={{ ...base, edition: "battledroids", techBase: "is", rulesLevel: 2 }} />);
        expect(screen.queryByLabelText(/^Era/)).toBeNull();
    });

    it("tells the parent which step was edited", () => {
        const onChange = vi.fn();
        render(<Harness start={base} onChange={onChange} />);
        fireEvent.change(select(/Rules Level/), { target: { value: "3" } });
        expect(onChange.mock.lastCall?.[1]).toBe("rulesLevel");
        fireEvent.change(select(/Rules Edition/), { target: { value: "battledroids" } });
        expect(onChange.mock.lastCall?.[1]).toBe("edition");
    });

    it("the notice goes once the parent's design differs from what the change made", () => {
        let made: IGameSettings | undefined;
        const start = { ...base, techBase: "is", era: "star-league" };
        const { rerender } = render(<GameSettingsBlock unitType="mech" settings={start} onChange={(next) => { made = next; }} />);
        fireEvent.change(select(/Technology Base/), { target: { value: "clan" } });
        rerender(<GameSettingsBlock unitType="mech" settings={made!} onChange={() => undefined} />);
        expect(screen.getByText(/Era moved to/)).toBeTruthy();
        // A design replaced (a printed droid, a way back to an edition) is not what the notice described.
        rerender(<GameSettingsBlock unitType="mech" settings={{ ...made!, era: "star-league" }} onChange={() => undefined} />);
        expect(screen.queryByText(/moved to/)).toBeNull();
    });

    it("a stored edition the rulesets do not offer stays selected and flagged", () => {
        btSpecialRulesets.push(testSpecialRuleset({ id: "test-clash", name: "Test min edition", minEdition: DEFAULT_RULES_EDITION, changes: ["edition"] }));
        render(<Harness start={{ ...base, edition: "battledroids", techBase: "is", rulesets: ["test-clash"] }} />);
        expect(select(/Rules Edition/).value).toBe("battledroids");
        expect(select(/Rules Edition/).selectedOptions[0].textContent).toMatch(/not offered under the ticked rulesets/);
    });

    it("a clashing ruleset's checkbox is described by its clash", () => {
        btSpecialRulesets.push(testSpecialRuleset({ id: "test-clash", name: "Test clash", changes: ["techBases"] }));
        render(<Harness start={{ ...base, techBase: "is", era: "star-league", rulesets: ["sample-no-clans"] }} />);
        fireEvent.click(screen.getByRole("button", { name: /Choose rulesets/ }));
        const clash = screen.getByRole("checkbox", { name: /Test clash/ });
        expect(document.getElementById(clash.getAttribute("aria-describedby") ?? "")?.textContent).toMatch(/Clashes with/);
    });

    it("an earlier edition with one tech base hides the Tech Base step, as the builders did", () => {
        render(<Harness start={{ ...base, edition: "battledroids", techBase: "is", rulesLevel: 2 }} />);
        expect((select(/Technology Base/).closest("div") as HTMLElement).style.display).toBe("none");
    });
    it("a ProtoMech has no Technology Base step", () => {
        render(<Harness unitType="protomech" start={{ ...base, era: "clan-inv" }} />);
        expect((select(/Technology Base/).closest("div") as HTMLElement).style.display).toBe("none");
    });

    it("a ProtoMech saved under the no-Clans universe is flagged: ProtoMechs do not exist there", () => {
        const { container } = render(<Harness unitType="protomech" start={{ ...base, rulesets: ["sample-no-clans"] }} />);
        expect((select(/Technology Base/).closest("div") as HTMLElement).style.display).toBe("none");
        expect(container.textContent).not.toMatch(/not offered under the ticked rulesets/);
        expect(screen.getByText(/ProtoMechs do not exist under Sample: The Clans never existed/)).toBeTruthy();
    });

    it("a ProtoMech cannot tick the no-Clans universe", () => {
        render(<Harness unitType="protomech" start={{ ...base, era: "clan-inv" }} />);
        fireEvent.change(screen.getByLabelText(/Special Rulesets/), { target: { value: "yes" } });
        const box = screen.getByLabelText(SAMPLE) as HTMLInputElement;
        expect(box.disabled).toBe(true);
        expect(screen.getByText(/ProtoMechs do not exist under this ruleset/)).toBeTruthy();
    });

    it("a suit offers Inner Sphere and Clan only", () => {
        render(<Harness unitType="battle-armor" start={{ ...base, techBase: "is", era: "jihad" }} />);
        expect(optionNames(/Technology Base/)).toEqual(["Inner Sphere", "Clan"]);
    });

    it("hides the steps it is told to hide", () => {
        const { container } = render(<Harness start={base} hiddenSteps={["edition", "techBase", "era"]} />);
        const text = container.textContent ?? "";
        expect(text).toContain("Special Rulesets:");
        expect(text).toContain("Rules Level:");
        expect(text).not.toContain("Rules Edition:");
        expect(text).not.toContain("Technology Base:");
        expect(text).not.toContain("Era:");
    });

    it("says nothing about a hidden step that moved", () => {
        render(<Harness start={{ ...base, techBase: "is", era: "" }} hiddenSteps={["edition", "techBase", "era"]} />);
        fireEvent.change(select(/Rules Level/), { target: { value: "3" } });
        expect(screen.queryByRole("status")?.textContent ?? "").not.toMatch(/Era moved/);
        expect(screen.queryByText(/not offered under the ticked rulesets/)).toBeNull();
    });

    it("unitRulesLevel prefers the design's own level", () => {
        const vehicle = new Vehicle();
        expect(unitRulesLevel(vehicle, { mechRulesFilter: 2 })).toBe(2);
        expect(unitRulesLevel(undefined, { mechRulesFilter: 2 })).toBe(2);
        vehicle.gameSettings.set(4, []);
        expect(unitRulesLevel(vehicle, { mechRulesFilter: 2 })).toBe(4);
    });

    it("UnitGameSettingsBlock applies a picked level to the design and the app-wide default", () => {
        const vehicle = new Vehicle();
        const appGlobals = { appSettings: { mechRulesFilter: 2 }, saveAppSettings: vi.fn() } as unknown as IAppGlobals;
        const onChange = vi.fn();
        render(<UnitGameSettingsBlock unitType="vehicle" unit={vehicle} appGlobals={appGlobals} onChange={onChange} />);
        fireEvent.change(select(/Rules Level/), { target: { value: "1" } });
        expect(vehicle.gameSettings.getRulesLevel(9)).toBe(1);
        expect(appGlobals.appSettings.mechRulesFilter).toBe(1);
        expect(appGlobals.saveAppSettings).toHaveBeenCalled();
        expect(onChange).toHaveBeenCalledWith("rulesLevel");
    });

    it("UnitGameSettingsBlock leaves the app-wide level alone for other steps", () => {
        const vehicle = new Vehicle();
        const appGlobals = { appSettings: { mechRulesFilter: 2 }, saveAppSettings: vi.fn() } as unknown as IAppGlobals;
        render(<UnitGameSettingsBlock unitType="vehicle" unit={vehicle} appGlobals={appGlobals} onChange={vi.fn()} />);
        fireEvent.change(select(/Technology Base/), { target: { value: "clan" } });
        expect(vehicle.getTech().tag).toBe("clan");
        expect(appGlobals.saveAppSettings).not.toHaveBeenCalled();
    });
});
