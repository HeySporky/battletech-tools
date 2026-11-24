// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AlphaStrikeForce from "../../../../classes/alpha-strike-force";
import { AlphaStrikeUnit } from "../../../../classes/alpha-strike-unit";
import { ASEWarBlock, ASEWarBoardPanel } from "./_asEWar";

afterEach(cleanup);

const makeUnit = (name: string, abilities: string[], armor = 10): AlphaStrikeUnit => {
    const unit = new AlphaStrikeUnit();
    unit.name = name;
    unit.abilities = abilities;
    unit.armor = armor;
    unit.structure = 10;
    unit.rulesLevel = 4;
    unit.move = [{ move: 8, currentMove: 8, type: "" }];
    unit.calcCurrentValues();
    return unit;
};

const roundDamage = (unit: AlphaStrikeUnit): number => unit.roundArmor.filter(Boolean).length + unit.roundStructure.filter(Boolean).length;

const build = (...units: AlphaStrikeUnit[]) => {
    const force = new AlphaStrikeForce();
    for (const unit of units) force.addToGroup(unit);
    const onChange = vi.fn();
    return { force, onChange };
};

describe("Alpha Strike in-play E-War block", () => {
    it("renders nothing for a unit with no E-War specials", () => {
        const unit = makeUnit("Plain", ["IF2"]);
        const { force, onChange } = build(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={onChange} />);
        expect(screen.queryByTestId("as-ewar-block")).toBeNull();
        expect(screen.getByRole("button", { name: "E-War" })).toBeTruthy();
        render(<ASEWarBoardPanel force={force} onChange={onChange} />);
        expect(screen.queryByTestId("as-ewar-board")).toBeNull();
    });

    it("shows an ECM unit's 12 inch bubble and saves a switch to ECCM", () => {
        const unit = makeUnit("Jammer", ["ECM"]);
        const { force, onChange } = build(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={onChange} />);
        expect(screen.getByTestId("as-ewar-block")).toBeTruthy();
        fireEvent.change(screen.getByLabelText("ECM mode"), { target: { value: "eccm" } });
        expect(unit.ewarPlay.ecmMode).toBe("eccm");
        expect(onChange).toHaveBeenCalled();
    });

    it("adds the Narc damage to a missile hit, and not inside friendly ECM", () => {
        const target = makeUnit("Target", []);
        target.ewarPlay.narcs = ["SNARC"];
        const { force, onChange } = build(target);
        render(<ASEWarBlock unit={target} force={force} onChange={onChange} />);
        fireEvent.click(screen.getByRole("button", { name: "Missile hit 3" }));
        expect(roundDamage(target)).toBe(4);
        cleanup();

        const covered = makeUnit("Covered", []);
        covered.ewarPlay.narcs = ["SNARC"];
        const ecm = makeUnit("Shield", ["ECM"]);
        const second = build(ecm, covered);
        second.force.ewarBoard = { friendlyEcm: { [ecm.uuid]: [covered.uuid] } };
        render(<ASEWarBlock unit={covered} force={second.force} onChange={second.onChange} />);
        fireEvent.click(screen.getByRole("button", { name: "Missile hit 3" }));
        expect(roundDamage(covered)).toBe(3);
    });

    it("keeps a 1-point front-arc missile hit at 1 against an AMS", () => {
        const unit = makeUnit("Defender", ["AMS"]);
        const { force, onChange } = build(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={onChange} />);
        fireEvent.click(screen.getByRole("button", { name: "Missile hit 1" }));
        expect(roundDamage(unit)).toBe(1);
        fireEvent.click(screen.getByRole("button", { name: "Missile hit 3" }));
        expect(roundDamage(unit)).toBe(3);
    });

    it("shows a stealth target's to-hit additions beside the card numbers", () => {
        const unit = makeUnit("Gunner", ["ECM"]);
        const { force, onChange } = build(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={onChange} />);
        fireEvent.change(screen.getByLabelText("Target stealth"), { target: { value: "unit" } });
        expect(unit.ewarPlay.target).toEqual({ stealth: "unit" });
        const table = screen.getByRole("table", { name: "Modified to-hit" });
        expect(table.textContent).toContain("(+1)");
        expect(table.textContent).toContain("(+2)");
        expect(screen.getByText(/Target STL: \+1 Medium, \+2 Long and Extreme/)).toBeTruthy();
    });

    it("shows each member of a C3 network down when the master is under hostile ECM", () => {
        const master = makeUnit("Master", ["C3M"]);
        const slave = makeUnit("Slave", ["C3S"]);
        const { force, onChange } = build(master, slave);
        force.ewarBoard = { c3Networks: [{ name: "Lance", kind: "c3", members: [master.uuid, slave.uuid], master: master.uuid }] };
        master.ewarPlay.hostileEcm = 1;
        render(<ASEWarBlock unit={slave} force={force} onChange={onChange} />);
        expect(screen.getByText(/C3 network Lance: down/)).toBeTruthy();
    });

    it("clears stood still at End Round", () => {
        const unit = makeUnit("Ghost", ["MAS"]);
        const { force, onChange } = build(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={onChange} />);
        const box = screen.getByLabelText("Stood still this turn") as HTMLInputElement;
        fireEvent.click(box);
        expect(unit.ewarPlay.stoodStill).toBe(true);
        expect(screen.getByText(/\+3 to non-physical attacks/)).toBeTruthy();
        force.applyEWarRound();
        expect(unit.ewarPlay.stoodStill).toBeUndefined();
    });
});

describe("Alpha Strike E-War board panel", () => {
    it("names who stands inside a bubble and builds a network, with the problems shown", () => {
        const master = makeUnit("Master", ["C3M", "ECM"]);
        const other = makeUnit("Other", ["ECM"]);
        const { force, onChange } = build(master, other);
        render(<ASEWarBoardPanel force={force} onChange={onChange} />);
        fireEvent.click(screen.getByLabelText(/Other.*inside the bubble of Master/));
        expect(force.ewarBoard.friendlyEcm?.[master.uuid]).toEqual([other.uuid]);
        fireEvent.click(screen.getByRole("button", { name: "Add network" }));
        expect(force.ewarBoard.c3Networks?.length).toBe(1);
        expect(screen.getByText(/no master named/)).toBeTruthy();
        fireEvent.click(screen.getByLabelText(/Other.*in Network 1/));
        expect(screen.getByText(/cannot join this network/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Remove network" }));
        expect(force.ewarBoard.c3Networks).toEqual([]);
    });
});

describe("E-War block on a unit with no E-War gear", () => {
    it("opens on request so a Narc beacon can be attached and a missile hit takes it", () => {
        const unit = makeUnit("Atlas", []);
        const { force, onChange } = build(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={onChange} />);
        fireEvent.click(screen.getByRole("button", { name: "E-War" }));
        fireEvent.click(screen.getByRole("button", { name: "Attach INARC" }));
        expect(unit.ewarPlay.narcs).toEqual(["INARC"]);
        fireEvent.click(screen.getByRole("button", { name: "Missile hit 3" }));
        expect(roundDamage(unit)).toBe(4);
    });
});

describe("Alpha Strike stun controls (#645)", () => {
    it("a CI unit rolling under 8 on a stun falls back", () => {
        const unit = makeUnit("Militia", ["ECM"]);
        unit.type = "CI";
        unit.isInfantry = true;
        unit.rulesLevel = 6;
        const { force, onChange } = build(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={onChange} />);
        fireEvent.click(screen.getByRole("button", { name: "Apply stun hit" }));
        expect(unit.ewarPlay.fellBack).toEqual({ turnsLeft: 2 });
        expect(screen.getByTestId("as-fell-back")).toBeTruthy();
    });

    it("keeps the hit controls out of a force below Custom Homebrew", () => {
        const unit = makeUnit("Canon", ["ECM"]);
        const { force, onChange } = build(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={onChange} />);
        expect(screen.queryByTestId("as-stun-hit")).toBeNull();
    });
});

// #647 Task 5: controls for our specials (Blue Saviour, Power Boosters, smoke, Tasers).
describe("Alpha Strike E-War block: our specials (#647)", () => {
    const ours = (name: string, abilities: string[], level = 6): AlphaStrikeUnit => {
        const unit = makeUnit(name, abilities);
        unit.rulesLevel = level;
        return unit;
    };

    it("switches the Blue Saviour on and halves an energy hit", () => {
        const unit = ours("Saviour", ["BSF2/2/1/0"]);
        const { force, onChange } = build(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={onChange} />);
        fireEvent.click(screen.getByLabelText("Blue Saviour on"));
        expect(unit.ewarPlay.bsfOn).toBe(true);
        fireEvent.change(screen.getByLabelText("Incoming attack kind"), { target: { value: "energy" } });
        fireEvent.click(screen.getByRole("button", { name: "Missile hit 5" }));
        expect(roundDamage(unit)).toBe(2);
    });

    it("renders a Power Booster use button, a smoke button and a Taser hit button", () => {
        const unit = ours("Racer", ["PBR", "SMKB10", "SMKT", "MTAS1"]);
        const { force, onChange } = build(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={onChange} />);
        fireEvent.change(screen.getByLabelText("Special roll"), { target: { value: "6" } });
        fireEvent.click(screen.getByRole("button", { name: "Use PBR (ours)" }));
        expect(unit.ewarPlay.boost?.PBR?.streak).toBe(1);
        fireEvent.click(screen.getByRole("button", { name: "Lay a smoke screen (ours)" }));
        expect(unit.ewarPlay.smokeUsesSpent).toBe(1);
        fireEvent.click(screen.getByRole("button", { name: "Lay a smoke trail (ours)" }));
        expect(unit.ewarPlay.smokeLaid).toBe("trail");
        fireEvent.change(screen.getByLabelText("Special roll"), { target: { value: "12" } });
        fireEvent.click(screen.getByRole("button", { name: "Hit by a Taser (roll above)" }));
        expect(unit.ewarPlay.tsempHit?.effect).toBeDefined();
    });

    it("renders none of these controls on a level 4 unit", () => {
        const unit = ours("Plain", ["BSF2/2/1/0", "PBR", "SMKB10"], 4);
        const { force, onChange } = build(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={onChange} />);
        expect(screen.queryByLabelText("Blue Saviour on")).toBeNull();
        expect(screen.queryByRole("button", { name: "Use PBR (ours)" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Lay a smoke screen (ours)" })).toBeNull();
    });
});
