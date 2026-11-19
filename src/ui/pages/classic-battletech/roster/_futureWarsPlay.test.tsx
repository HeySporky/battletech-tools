// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../../classes/battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../../../data/rules-level-options";
import FutureWarsPlayPanel, { getBoostedMoveNote, showFutureWarsPlay } from "./_futureWarsPlay";

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

    it("gives the first printings' reminders with Future Wars: equipment as first printed", () => {
        const mech = build(["custom-swing-fire-lrm-10", "custom-lr-flamer", "ammo-custom-lr-flamer-standard", "custom-power-booster-running"]);
        mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL, rulesets: ["fw-equipment-first-printings"] });
        const legs = mech.equipmentList.find((item) => item.tag === "custom-power-booster-running")!.uuid!;
        mech.futureWarsPlay.boosters = { [legs]: { turnInARow: 3, usedThisTurn: false, boostedThisTurn: false } };
        render(<FutureWarsPlayPanel mech={mech} onChange={vi.fn()} />);
        const text = screen.getByTestId("fw-play").textContent ?? "";
        expect(text).toContain("As first printed: swinging takes a turn; on AeroTech maps it fires into the front or rear arc; a critical hit on its own slot stops the swing.");
        expect(text).toContain("If this fuel is hit, it does 2 damage and 3 heat for each round left (the critical hit roll applies it).");
        expect(screen.getByTestId(`fw-booster-status-${legs}`).textContent).toBe("Ready: turn 4 in a row, fails on 11 or less, a 2 burns out the system");
        mech.futureWarsPlay.boosters = { [legs]: { turnInARow: 1, usedThisTurn: true, boostedThisTurn: false, failed: true, systemBurnedOut: true } };
        cleanup();
        render(<FutureWarsPlayPanel mech={mech} onChange={vi.fn()} />);
        expect(screen.getByTestId(`fw-booster-status-${legs}`).textContent).toBe("Burned out: the 'Mech can walk but not run");
    });

    it("says when a booster failed and when it burned out its system", () => {
        const mech = build(["custom-power-booster-ppc", "custom-power-booster-running"]);
        const ppc = mech.equipmentList.find((item) => item.tag === "custom-power-booster-ppc")!.uuid!;
        const legs = mech.equipmentList.find((item) => item.tag === "custom-power-booster-running")!.uuid!;
        mech.rollPowerBooster(ppc, 4);
        mech.rollPowerBooster(legs, 2);
        render(<FutureWarsPlayPanel mech={mech} onChange={vi.fn()} />);
        expect(screen.getByTestId(`fw-booster-status-${ppc}`).textContent).toMatch(/Failed: the booster can no longer be used/);
        expect(screen.getByTestId(`fw-booster-status-${legs}`).textContent).toMatch(/Burned out: the 'Mech cannot run/);
    });

    it("counts the PDS's extra magazine with its built-in bursts", () => {
        const mech = build(["custom-eii-pds", "ammo-custom-eii-pds-standard"]);
        render(<FutureWarsPlayPanel mech={mech} onChange={vi.fn()} />);
        const uuid = mech.equipmentList.find((item) => item.tag === "custom-eii-pds")!.uuid!;
        expect(screen.getByTestId(`fw-pds-bursts-${uuid}`).textContent).toBe("150");
        expect(screen.getByTestId(`fw-pds-bursts-detail-${uuid}`).textContent).toMatch(/50 built-in \+ 100 in the magazine/);
    });

    it("saves the hexes run when the box is left, not on every keystroke", () => {
        const mech = build(["custom-power-booster-running"]);
        const legs = mech.equipmentList.find((item) => item.tag === "custom-power-booster-running")!.uuid!;
        mech.rollPowerBooster(legs, 8);
        const onChange = vi.fn();
        render(<FutureWarsPlayPanel mech={mech} onChange={onChange} />);
        const box = screen.getByTestId(`fw-booster-hexes-${legs}`);
        fireEvent.change(box, { target: { value: "5" } });
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.blur(box);
        expect(mech.futureWarsPlay.boostedRunHexes).toBe(5);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("limits the Penitrator die to the die of the range band", () => {
        const mech = build(["custom-penitrator"]);
        render(<FutureWarsPlayPanel mech={mech} onChange={vi.fn()} />);
        const uuid = mech.equipmentList.find((item) => item.tag === "custom-penitrator")!.uuid!;
        fireEvent.change(screen.getByTestId(`fw-penitrator-range-${uuid}`), { target: { value: "30" } });
        expect(screen.getByTestId(`fw-penitrator-roll-${uuid}`).getAttribute("max")).toBe("4");
    });

    it("shows the 15-heat cap on fires and shells that ignited aboard", () => {
        const mech = build([]);
        mech.addLRFlamerHit(3);
        mech.addInfernoGaussHit();
        mech.futureWarsPlay.pendingHeat = 36;
        render(<FutureWarsPlayPanel mech={mech} onChange={vi.fn()} />);
        expect(screen.getByTestId("fw-external-heat").textContent).toMatch(/15 heat from fires this turn \(17, 15 at most\)/);
        expect(screen.getByTestId("fw-pending-heat").textContent).toMatch(/36 heat/);
    });

    it("notes the boosted run and jump MP for the movement dialog", () => {
        const mech = build(["custom-power-booster-running", "custom-power-booster-jumping"]);
        expect(getBoostedMoveNote(mech, "r")).toBe("");
        expect(getBoostedMoveNote(mech, "j")).toBe("");
        mech.rollPowerBooster(mech.equipmentList.find((item) => item.tag === "custom-power-booster-running")!.uuid!, 8);
        mech.rollPowerBooster(mech.equipmentList.find((item) => item.tag === "custom-power-booster-jumping")!.uuid!, 8);
        expect(getBoostedMoveNote(mech, "r")).toBe(` (boosted ${mech.getRunSpeed() + 2})`);
        expect(getBoostedMoveNote(mech, "j")).toBe(" (boosted 6)");
        expect(getBoostedMoveNote(mech, "w")).toBe("");
    });
});
