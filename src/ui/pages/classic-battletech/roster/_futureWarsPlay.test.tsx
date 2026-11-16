// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../../classes/battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../../../data/rules-level-options";
import FutureWarsPlayPanel, { showFutureWarsPlay } from "./_futureWarsPlay";

afterEach(cleanup);

/** Best of Future Wars plan, Chunk C (#172): the panel of counters, rollers and reminders in roster play. */
const build = (tags: string[], level: number = CUSTOM_HOMEBREW_RULES_LEVEL): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-ages");
    mech.setTonnage(65);
    mech.setWalkSpeed(4);
    mech.setJumpSpeed(4);
    mech.applyGameSettings({ ...mech.getGameSettings(level), rulesLevel: level });
    for (const tag of tags) mech.addEquipmentFromTag(tag, "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
    return mech;
};

describe("Best of Future Wars play panel", () => {
    it("shows for a 'Mech with fanzine equipment or at Custom Homebrew; not for a canon 'Mech below it", () => {
        expect(showFutureWarsPlay(build(["custom-gatling-laser"]))).toBe(true);
        expect(showFutureWarsPlay(build([]))).toBe(true);
        expect(showFutureWarsPlay(build(["medium-laser"], 2))).toBe(false);
    });

    it("rolls a weapon's booster and shows the boosted shot", () => {
        const mech = build(["custom-power-booster-ppc"]);
        const onChange = vi.fn();
        render(<FutureWarsPlayPanel mech={mech} onChange={onChange} />);
        const uuid = mech.equipmentList.find((item) => item.tag === "custom-power-booster-ppc")!.uuid!;
        fireEvent.change(screen.getByTestId(`fw-booster-roll-${uuid}`), { target: { value: "8" } });
        fireEvent.click(screen.getByTestId(`fw-booster-use-${uuid}`));
        expect(mech.isPowerBoosterOn(uuid)).toBe(true);
        expect(screen.getByTestId(`fw-booster-status-${uuid}`).textContent).toMatch(/Boosted/);
        expect(screen.getByTestId(`fw-booster-shot-${uuid}`).textContent).toMatch(/15 damage/);
        expect(onChange).toHaveBeenCalledWith(mech);
    });

    it("resolves a PDS salvo and spends a burst", () => {
        const mech = build(["custom-eii-pds"]);
        render(<FutureWarsPlayPanel mech={mech} onChange={vi.fn()} />);
        const uuid = mech.equipmentList.find((item) => item.tag === "custom-eii-pds")!.uuid!;
        fireEvent.change(screen.getByTestId(`fw-pds-hits-${uuid}`), { target: { value: "5" } });
        fireEvent.change(screen.getByTestId(`fw-pds-roll-${uuid}`), { target: { value: "4" } });
        fireEvent.click(screen.getByTestId(`fw-pds-fire-${uuid}`));
        expect(screen.getByTestId(`fw-pds-result-${uuid}`).textContent).toMatch(/4 stopped, 1 hits?/);
        expect(screen.getByTestId(`fw-pds-bursts-${uuid}`).textContent).toBe("49");
    });

    it("marks a Long Range Flamer hit and an Inferno Gauss hit on this 'Mech", () => {
        const mech = build([]);
        render(<FutureWarsPlayPanel mech={mech} onChange={vi.fn()} />);
        fireEvent.click(screen.getByTestId("fw-lr-flamer-hit"));
        expect(screen.getByTestId("fw-burn").textContent).toMatch(/5 damage.*5 heat/);
        fireEvent.click(screen.getByTestId("fw-inferno-hit"));
        expect(screen.getByTestId("fw-inferno").textContent).toMatch(/5 turns/);
    });

    it("rolls a Penitrator hit by range", () => {
        const mech = build(["custom-penitrator"]);
        render(<FutureWarsPlayPanel mech={mech} onChange={vi.fn()} />);
        const uuid = mech.equipmentList.find((item) => item.tag === "custom-penitrator")!.uuid!;
        fireEvent.change(screen.getByTestId(`fw-penitrator-range-${uuid}`), { target: { value: "20" } });
        fireEvent.change(screen.getByTestId(`fw-penitrator-roll-${uuid}`), { target: { value: "5" } });
        expect(screen.getByTestId(`fw-penitrator-result-${uuid}`).textContent).toMatch(/medium.*5 to the armor.*2 to the internal structure/);
    });

    it("gives each item its reminder", () => {
        const mech = build(["custom-pom-pom-ac-5", "custom-swing-fire-lrm-10", "custom-gatling-laser", "custom-lr-flamer"]);
        render(<FutureWarsPlayPanel mech={mech} onChange={vi.fn()} />);
        const text = screen.getByTestId("fw-play").textContent ?? "";
        expect(text).toMatch(/twice a turn/);
        expect(text).toMatch(/180 degrees/);
        expect(text).toMatch(/SRM 6/);
        expect(text).toMatch(/\+2 at medium, \+3 at long/);
    });
});
