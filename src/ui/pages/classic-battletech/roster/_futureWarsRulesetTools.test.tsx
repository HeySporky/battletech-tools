// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../../classes/battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../../../data/rules-level-options";
import FutureWarsRulesetTools, { showFutureWarsRulesetTools } from "./_futureWarsRulesetTools";

afterEach(cleanup);

/** Best of Future Wars plan, Chunk E (#172): the play-rule tools in roster play, one section a ruleset the 'Mech carries. */
const build = (rulesets: string[], tags: string[] = ["medium-laser"]): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-ages");
    mech.setTonnage(65);
    mech.setWalkSpeed(4);
    mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL, rulesets });
    for (const tag of tags) mech.addEquipmentFromTag(tag, "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
    return mech;
};
const uuidOf = (mech: BattleMech, tag: string) => mech.equipmentList.find((item) => item.tag === tag)!.uuid!;

describe("Best of Future Wars ruleset tools", () => {
    it("show only for a 'Mech carrying a play ruleset, with only that ruleset's section and its rules summary", () => {
        expect(showFutureWarsRulesetTools(build([]))).toBe(false);
        const mech = build(["fw-morale"]);
        expect(showFutureWarsRulesetTools(mech)).toBe(true);
        render(<FutureWarsRulesetTools mech={mech} onChange={vi.fn()} />);
        expect(screen.getByTestId("fw-tool-fw-morale")).toBeTruthy();
        expect(screen.queryByTestId("fw-tool-fw-long-range-wars")).toBeNull();
        expect(screen.getByTestId("future-wars-rules-fw-morale")).toBeTruthy();
    });

    it("Strategic Movement: doubled MP, the move's heat, and what it forbids", () => {
        const mech = build(["fw-strategic-movement"]);
        const onChange = vi.fn();
        render(<FutureWarsRulesetTools mech={mech} onChange={onChange} />);
        expect(screen.getByTestId("fw-strategic-mp").textContent).toMatch(/Walk 8, run 12/);
        fireEvent.change(screen.getByTestId("fw-strategic-mode"), { target: { value: "r" } });
        fireEvent.change(screen.getByTestId("fw-strategic-hexes"), { target: { value: "12" } });
        fireEvent.blur(screen.getByTestId("fw-strategic-hexes"));
        expect(mech.futureWarsPlay.strategicMovement).toEqual({ mode: "r", mp: 12 });
        expect(screen.getByTestId("fw-strategic-heat").textContent).toMatch(/14 heat/);
        expect(screen.getByTestId("fw-tool-fw-strategic-movement").textContent).toMatch(/no firing/i);
        expect(onChange).toHaveBeenCalledWith(mech);
    });

    it("Opportunity Fire: the shot's to-hit, then records it so the other weapons are +1", () => {
        const mech = build(["fw-opportunity-fire"], ["medium-laser", "lrm-10"]);
        render(<FutureWarsRulesetTools mech={mech} onChange={vi.fn()} />);
        // Missile weapons may not take the shot.
        const options = Array.from((screen.getByTestId("fw-opportunity-weapon") as HTMLSelectElement).options).map((option) => option.text);
        expect(options.some((text) => /LRM/.test(text))).toBe(false);
        fireEvent.change(screen.getByTestId("fw-opportunity-band"), { target: { value: "medium" } });
        fireEvent.change(screen.getByTestId("fw-opportunity-target"), { target: { value: "ran" } });
        expect(screen.getByTestId("fw-opportunity-to-hit").textContent).toMatch(/9\+/);
        fireEvent.click(screen.getByTestId("fw-opportunity-fire"));
        expect(mech.futureWarsPlay.opportunityShot).toBe(uuidOf(mech, "medium-laser"));
        expect(screen.getByTestId("fw-opportunity-taken").textContent).toMatch(/\+1/);
    });

    it("Morale: a failed check applies the result as a status on the 'Mech", () => {
        const mech = build(["fw-morale"]);
        render(<FutureWarsRulesetTools mech={mech} onChange={vi.fn()} />);
        fireEvent.change(screen.getByTestId("fw-morale-class"), { target: { value: "4" } });
        expect(mech.getMoraleClassIndex()).toBe(4);
        fireEvent.change(screen.getByTestId("fw-morale-check"), { target: { value: "3" } });
        fireEvent.change(screen.getByTestId("fw-morale-result"), { target: { value: "2" } });
        fireEvent.click(screen.getByTestId("fw-morale-roll"));
        // Elite +2: 4, disorganized 2 turns, +5 to fire.
        expect(mech.futureWarsPlay.morale?.status).toMatchObject({ kind: "disorganized", turnsLeft: 2 });
        expect(screen.getByTestId("fw-morale-status").textContent).toMatch(/Disorganized/);
        expect(screen.getByTestId("fw-morale-last").textContent).toMatch(/Disorganized 2 turns/);
    });

    it("Weapon Malfunctions: a roll on the weapon's table is recorded on the weapon, and can be cleared", () => {
        const mech = build(["fw-weapon-malfunctions"], ["medium-laser", "standard-ppc"]);
        render(<FutureWarsRulesetTools mech={mech} onChange={vi.fn()} />);
        const laser = uuidOf(mech, "medium-laser");
        expect(screen.queryByTestId(`fw-malfunction-roll-${uuidOf(mech, "standard-ppc")}`)).toBeNull();
        expect(screen.getByTestId("fw-tool-fw-weapon-malfunctions").textContent).toMatch(/PPC[^:]*: no table/);
        fireEvent.change(screen.getByTestId(`fw-malfunction-roll-${laser}`), { target: { value: "15" } });
        fireEvent.click(screen.getByTestId(`fw-malfunction-record-${laser}`));
        expect(mech.futureWarsPlay.malfunctions?.[laser]).toEqual([15]);
        expect(screen.getByTestId(`fw-malfunction-list-${laser}`).textContent).toMatch(/\+3 to-hit, \+5 heat/);
        fireEvent.click(screen.getByTestId(`fw-malfunction-clear-${laser}-0`));
        expect(mech.futureWarsPlay.malfunctions).toBeUndefined();
    });

    it("Long Range Wars: each weapon's extended and extreme bands and their to-hit; ranging kept on the 'Mech", () => {
        const mech = build(["fw-long-range-wars"], ["medium-laser"]);
        render(<FutureWarsRulesetTools mech={mech} onChange={vi.fn()} />);
        const line = screen.getByTestId(`fw-long-range-${uuidOf(mech, "medium-laser")}`).textContent;
        expect(line).toMatch(/Extended 10-18: 10\+/);
        expect(line).toMatch(/extreme 19-36: 13\+/);
        fireEvent.change(screen.getByTestId("fw-ranging"), { target: { value: "2" } });
        expect(mech.futureWarsPlay.ranging).toBe(2);
    });
});
