// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ICalcBreakdown, ICalcStep } from "../../data/calc-steps";
import AerospaceFighter from "../../classes/aerospace-fighter";
import BattleArmor from "../../classes/battle-armor";
import InfantryPlatoon from "../../classes/infantry-platoon";
import ProtoMech from "../../classes/protomech";
import CalcBreakdown, { BattleArmorCalcBreakdown, FighterCalcBreakdown, InfantryCalcBreakdown, ProtoMechCalcBreakdown, VehicleCalcBreakdown, type ICalcBreakdownProps } from "./calc-breakdown";
import Vehicle from "../../classes/vehicle";

afterEach(cleanup);

const step = (over: Partial<ICalcStep>): ICalcStep => ({
    id: "t.step", section: "Defensive Battle Rating", cites: [{ source: "tm", page: "302" }], status: "cited", label: "Armor", ...over,
});

const bv2 = (steps: ICalcStep[], result: number | null = 1000): ICalcBreakdown => ({ kind: "battle-value", edition: "total-warfare", scheme: "bv2", steps, result });
const bv1 = (steps: ICalcStep[], result: number | null = 800): ICalcBreakdown => ({ kind: "battle-value", edition: "master-rules-revised", scheme: "bv1", steps, result });
const none = (): ICalcBreakdown => ({
    kind: "battle-value", edition: "battletech-compendium", scheme: "none", result: null,
    steps: [step({ id: "none.no-battle-value", section: "Battle Value", cites: [], label: "The BattleTech Compendium has no Battle Value" })],
});

const renderIt = (props: Partial<ICalcBreakdownProps>) => {
    const all: ICalcBreakdownProps = {
        battleValue: () => bv2([step({})]),
        editions: ["battletech-compendium", "master-rules-revised", "total-warfare"],
        edition: "total-warfare",
        ...props,
    };
    return render(<MemoryRouter><CalcBreakdown {...all} /></MemoryRouter>);
};

describe("CalcBreakdown (#599)", () => {
    it("shows each step's label, arithmetic, result and citation", () => {
        renderIt({ battleValue: () => bv2([
            step({ label: "Armor", detail: "152 x 2.5", value: 380 }),
            step({ id: "t.total", section: "Final", label: "Battle Value", value: 1234, emphasis: true, cites: [{ source: "tm", page: "302-304" }] }),
        ], 1234) });
        const row = screen.getByText("Armor").closest("tr") as HTMLElement;
        expect(within(row).getByText("152 x 2.5")).toBeTruthy();
        expect(within(row).getByText("380")).toBeTruthy();
        expect(within(row).getByText("TM p.302")).toBeTruthy();
        // Steps sit under their section's heading, and an emphasis row is marked.
        expect(screen.getByRole("columnheader", { name: "Defensive Battle Rating" })).toBeTruthy();
        const total = screen.getByText("TM pp.302-304").closest("tr") as HTMLElement;
        expect(total.className).toContain("calc-breakdown-emphasis");
        expect(within(total).getByText("1,234")).toBeTruthy();
    });

    it("changing the edition select re-reads battleValue with that tag", () => {
        const battleValue = vi.fn((edition: string) => edition === "master-rules-revised" ? bv1([step({ label: "BV1 armor" })]) : bv2([step({ label: "BV2 armor" })]));
        renderIt({ battleValue });
        expect(battleValue).toHaveBeenLastCalledWith("total-warfare");
        expect(screen.getByText("BV2 armor")).toBeTruthy();
        const select = screen.getByLabelText("Rules edition") as HTMLSelectElement;
        expect([...select.options].map((option) => option.value)).toEqual(["battletech-compendium", "master-rules-revised", "total-warfare"]);
        fireEvent.change(select, { target: { value: "master-rules-revised" } });
        expect(battleValue).toHaveBeenLastCalledWith("master-rules-revised");
        expect(screen.getByText("BV1 armor")).toBeTruthy();
        expect(screen.queryByText("BV2 armor")).toBeNull();
    });

    it("says the edition has no Battle Value when scheme is none, and shows no 0", () => {
        renderIt({ battleValue: none, edition: "battletech-compendium", skillBattleValue: () => 0, mulBattleValue: 900 });
        const section = screen.getByRole("region", { name: "Battle Value" });
        expect(within(section).getByText("The BattleTech Compendium has no Battle Value")).toBeTruthy();
        expect(section.textContent).not.toMatch(/\d/);
        expect(within(section).queryByRole("table")).toBeNull();
    });

    it("marks provisional and source-missing steps with their notes", () => {
        renderIt({ battleValue: () => bv2([
            step({ label: "Armored gyro", status: "provisional", note: "Follows the record sheets." }),
            step({ label: "Satellite uplink", status: "source-missing", note: "Needs the 1997 printing.", cites: [] }),
        ]) });
        const provisional = screen.getByText("Armored gyro").closest("tr") as HTMLElement;
        expect(provisional.textContent).toContain("Provisional: Follows the record sheets.");
        const missing = screen.getByText("Satellite uplink").closest("tr") as HTMLElement;
        expect(missing.textContent).toContain("Source not yet in NGCFells's library: Needs the 1997 printing.");
    });

    // A weapon list repeats one long note on every row: it is printed once, and the later rows point back to it.
    it("prints a note shared by several steps once, and points the later steps back to it", () => {
        const note = "Each price comes from the JBT equipment records.";
        renderIt({ battleValue: () => bv2([
            step({ label: "Medium Laser", status: "provisional", note }),
            step({ label: "Large Laser", status: "provisional", note }),
            step({ label: "Armored gyro", status: "provisional", note: "Follows the record sheets." }),
        ]) });
        expect((screen.getByText("Medium Laser").closest("tr") as HTMLElement).textContent).toContain(`Provisional: ${note}`);
        const later = screen.getByText("Large Laser").closest("tr") as HTMLElement;
        expect(later.textContent).toContain("Provisional: as noted at Medium Laser, above.");
        expect(later.textContent).not.toContain(note);
        expect((screen.getByText("Armored gyro").closest("tr") as HTMLElement).textContent).toContain("Provisional: Follows the record sheets.");
    });

    it("shows the MUL's BV beside ours only under a bv2 breakdown, and the accuracy link only when they differ", () => {
        const battleValue = (edition: string) => edition === "master-rules-revised" ? bv1([step({})], 800) : bv2([step({})], 1000);
        // The same number: shown, no link.
        renderIt({ battleValue, mulBattleValue: 1000, accuracyHref: "/accuracy" });
        expect(screen.getByText(/Master Unit List: 1,000/)).toBeTruthy();
        expect(screen.queryByRole("link")).toBeNull();
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules-revised" } });
        expect(screen.queryByText(/Master Unit List/)).toBeNull();
        cleanup();
        // A different number: the link shows.
        renderIt({ battleValue, mulBattleValue: 1012, accuracyHref: "/accuracy" });
        expect(screen.getByText(/Master Unit List: 1,012/)).toBeTruthy();
        expect(screen.getByRole("link").getAttribute("href")).toBe("/accuracy");
        cleanup();
        // No page to link to yet: the numbers alone.
        renderIt({ battleValue, mulBattleValue: 1012 });
        expect(screen.getByText(/Master Unit List: 1,012/)).toBeTruthy();
        expect(screen.queryByRole("link")).toBeNull();
    });

    it("renders a label with markup as text", () => {
        const { container } = renderIt({ battleValue: () => bv2([step({ label: "<img onerror=x>", detail: "<b>1</b> & \"2\"", note: "<i>n</i>", status: "provisional" })]) });
        expect(screen.getByText("<img onerror=x>")).toBeTruthy();
        expect(screen.getByText("<b>1</b> & \"2\"")).toBeTruthy();
        expect(container.querySelector("img, b, i")).toBeNull();
    });

    // The log's "Pilot Adjusted BV" line went with the old log (Task 3 ruling): the view shows it.
    it("shows the Battle Value adjusted for skill under the edition picked", () => {
        const skillBattleValue = vi.fn((edition: string) => edition === "master-rules-revised" ? 880 : 1320);
        renderIt({
            battleValue: (edition) => edition === "master-rules-revised" ? bv1([step({})], 800) : bv2([step({})], 1000),
            skillBattleValue, skillLabel: "Gunnery 3, Piloting 4",
        });
        expect(screen.getByText("Adjusted for skill (Gunnery 3, Piloting 4): 1,320")).toBeTruthy();
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules-revised" } });
        expect(screen.getByText("Adjusted for skill (Gunnery 3, Piloting 4): 880")).toBeTruthy();
    });

    it("shows the cost steps and total in their own section, and no cost section without cost", () => {
        const cost = (): ICalcBreakdown => ({ kind: "cost", edition: "total-warfare", result: 2229479, steps: [
            step({ id: "cost.engine", section: "Engine", label: "Fusion engine", detail: "5,000 x 200 x 25 / 75", value: 333333.3333, cites: [{ source: "tm", page: "274" }] }),
        ] });
        renderIt({ cost });
        const section = screen.getByRole("region", { name: "Cost" });
        expect(within(section).getByText("2,229,479 C-bills")).toBeTruthy();
        expect(within(section).getByText("333,333.333")).toBeTruthy();
        cleanup();
        renderIt({});
        expect(screen.queryByRole("region", { name: "Cost" })).toBeNull();
    });

    it("prints the breakdown's notes under its heading, for Battle Value and cost (#172)", () => {
        const battleValue = (): ICalcBreakdown => ({ ...bv2([step({})]), notes: ["Built under a construction ruleset: BV note."] });
        const cost = (): ICalcBreakdown => ({ kind: "cost", edition: "total-warfare", result: 5, steps: [step({ id: "cost.x", label: "Thing" })], notes: ["Cost note."] });
        renderIt({ battleValue, cost });
        expect(within(screen.getByRole("region", { name: "Battle Value" })).getByText("Built under a construction ruleset: BV note.")).toBeTruthy();
        expect(within(screen.getByRole("region", { name: "Cost" })).getByText("Cost note.")).toBeTruthy();
    });

    it("an edition tag that is not offered starts on the last one offered", () => {
        const battleValue = vi.fn(() => bv2([step({})]));
        renderIt({ battleValue, edition: "no-such-edition" });
        expect((screen.getByLabelText("Rules edition") as HTMLSelectElement).value).toBe("total-warfare");
        expect(battleValue).toHaveBeenLastCalledWith("total-warfare");
    });
});

describe("FighterCalcBreakdown (#599)", () => {
    const fighter = () => {
        const unit = new AerospaceFighter();
        unit.setTonnage(50);
        unit.setSafeThrust(5);
        unit.setArmorAllocation("nose", 20);
        unit.addEquipmentFromTag("medium-laser", "nose");
        return unit;
    };

    it("offers the last edition without Battle Value, both Master Rules and Total Warfare, starting on the fighter's own", () => {
        const { container } = render(<MemoryRouter><FighterCalcBreakdown fighter={fighter()} /></MemoryRouter>);
        const select = screen.getByLabelText("Rules edition") as HTMLSelectElement;
        expect([...select.options].map((option) => option.value)).toEqual(["battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare"]);
        expect(select.value).toBe("total-warfare");
        expect(container.querySelector(".calc-breakdown-result")?.textContent).toBe(fighter().getBattleValue("total-warfare").toLocaleString("en-US"));
        expect(screen.getAllByText("TM p.311").length).toBeGreaterThan(0);
        expect(screen.getByText("Attitude thruster")).toBeTruthy();
    });

    it("works BV1 under a Master Rules edition, with its AeroTech 2 page", () => {
        render(<MemoryRouter><FighterCalcBreakdown fighter={fighter()} /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules" } });
        expect(screen.getByText(/Battle Value 1, as this edition works it out/)).toBeTruthy();
        expect(screen.getAllByText("AT2 p.53").length).toBeGreaterThan(0);
    });

    it("shows a bundled fighter's MUL BV beside ours", () => {
        const ours = fighter().getBattleValue("total-warfare");
        render(<MemoryRouter><FighterCalcBreakdown fighter={fighter()} mulBattleValue={ours + 5} /></MemoryRouter>);
        expect(screen.getByText(/Master Unit List: /).textContent).toContain(`${(ours + 5).toLocaleString("en-US")}. The JBT value differs by -5`);
    });
});

describe("InfantryCalcBreakdown (#599)", () => {
    const platoon = () => {
        const unit = new InfantryPlatoon();
        unit.setMotive("foot");
        unit.setPrimaryWeapon("inf-laser-rifle");
        unit.setSquadSize(7);
        unit.setSquads(4);
        return unit;
    };

    it("offers the Battle Value editions starting on the platoon's own, with the skill-adjusted BV and the cost", () => {
        const { container } = render(<MemoryRouter><InfantryCalcBreakdown platoon={platoon()} /></MemoryRouter>);
        const select = screen.getByLabelText("Rules edition") as HTMLSelectElement;
        expect([...select.options].map((option) => option.value)).toEqual(["battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare"]);
        expect(select.value).toBe("total-warfare");
        expect(container.querySelector(".calc-breakdown-result")?.textContent).toBe(platoon().getBattleValue("total-warfare").toLocaleString("en-US"));
        expect(screen.getByText(/Adjusted for skill \(Gunnery \d, Anti-'Mech \d\)/)).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Cost" })).toBeTruthy();
    });

    it("works BV1 from the Master Rules table under a Master Rules edition", () => {
        render(<MemoryRouter><InfantryCalcBreakdown platoon={platoon()} /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules" } });
        expect(screen.getByText(/Battle Value 1, as this edition works it out/)).toBeTruthy();
        expect(screen.getAllByText("37").length).toBeGreaterThan(0);
    });

    it("shows no BV1 and the source-missing step for a mechanized platoon, and no Battle Value before the Master Rules", () => {
        const tracked = new InfantryPlatoon();
        tracked.setMotive("mech-tracked");
        render(<MemoryRouter><InfantryCalcBreakdown platoon={tracked} /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules" } });
        expect(screen.getByText("no BV1")).toBeTruthy();
        expect(screen.getAllByText(/Source not yet in NGCFells/).length).toBeGreaterThan(0);
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "battletech-4th-edition" } });
        expect(screen.getByText(/has no Battle Value/)).toBeTruthy();
    });

    it("shows a bundled platoon's MUL BV beside ours under BV2, and not under BV1", () => {
        const ours = platoon().getBattleValue("total-warfare");
        render(<MemoryRouter><InfantryCalcBreakdown platoon={platoon()} mulBattleValue={ours + 5} /></MemoryRouter>);
        expect(screen.getByText(/Master Unit List: /).textContent).toContain(`${(ours + 5).toLocaleString("en-US")}. The JBT value differs by -5`);
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules" } });
        expect(screen.queryByText(/Master Unit List: /)).toBeNull();
    });
});

describe("ProtoMechCalcBreakdown (#599)", () => {
    const proto = () => {
        const unit = new ProtoMech();
        unit.setTons(9);
        unit.setWalkMP(5);
        unit.setJump("standard", 5);
        unit.setArmor("torso", 16);
        unit.setArmor("head", 6);
        unit.setArmor("la", 4);
        unit.setArmor("ra", 4);
        unit.setArmor("legs", 10);
        unit.addMount("er-micro-laser", "la");
        unit.addMount("er-micro-laser", "ra");
        return unit;
    };

    it("offers the editions starting on the ProtoMech own, with the skill-adjusted BV and the cost", () => {
        const { container } = render(<MemoryRouter><ProtoMechCalcBreakdown proto={proto()} /></MemoryRouter>);
        const select = screen.getByLabelText("Rules edition") as HTMLSelectElement;
        expect([...select.options].map((option) => option.value)).toEqual(["battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare"]);
        expect(select.value).toBe("total-warfare");
        expect(container.querySelector(".calc-breakdown-result")?.textContent).toBe(proto().getBattleValue("total-warfare").toLocaleString("en-US"));
        expect(screen.getByText(/Adjusted for skill \(Gunnery \d\)/)).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Cost" })).toBeTruthy();
    });

    it("works BV1 under the Master Rules, Revised Edition, shows no Battle Value under the 1998 Master Rules, and the MUL BV beside ours under BV2 only", () => {
        const unit = proto();
        const ours = unit.getBattleValue("total-warfare");
        render(<MemoryRouter><ProtoMechCalcBreakdown proto={unit} mulBattleValue={ours + 5} /></MemoryRouter>);
        expect(screen.getByText(/Master Unit List: /).textContent).toContain(`${(ours + 5).toLocaleString("en-US")}. The JBT value differs by -5`);
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules-revised" } });
        expect(screen.getByText(/Battle Value 1, as this edition works it out/)).toBeTruthy();
        expect(screen.queryByText(/Master Unit List: /)).toBeNull();
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules" } });
        expect(screen.getByText(/has no Battle Value for a ProtoMech/)).toBeTruthy();
    });
});

describe("VehicleCalcBreakdown (#599)", () => {
    const tank = () => {
        const unit = new Vehicle();
        unit.addEquipmentFromTag("medium-laser");
        unit.addEquipmentFromTag("autocannon-standard-b");
        unit.addEquipmentFromTag("ammo-ac-5-standard");
        return unit;
    };

    it("offers the Battle Value editions starting on the vehicle's own, with its BV2 steps, cost and loaded cost", () => {
        const { container } = render(<MemoryRouter><VehicleCalcBreakdown vehicle={tank()} /></MemoryRouter>);
        const select = screen.getByLabelText("Rules edition") as HTMLSelectElement;
        expect([...select.options].map((option) => option.value)).toEqual(["battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare"]);
        expect(select.value).toBe("total-warfare");
        expect(container.querySelector(".calc-breakdown-result")?.textContent).toBe(tank().getBattleValue("total-warfare").toLocaleString("en-US"));
        expect(screen.getAllByText("TM p.307").length).toBeGreaterThan(0);
        expect(screen.getByText("Loaded cost, with the ammunition carried")).toBeTruthy();
    });

    it("works BV1 and the cost from the Master Rules pages under a Master Rules edition", () => {
        render(<MemoryRouter><VehicleCalcBreakdown vehicle={tank()} /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules-revised" } });
        expect(screen.getByText(/Battle Value 1, as this edition works it out/)).toBeTruthy();
        expect(screen.getAllByText("BMR(R) p.154").length).toBeGreaterThan(0);
        expect(screen.getAllByText("BMR(R) p.150").length).toBeGreaterThan(0);
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "battletech-4th-edition" } });
        expect(screen.getByText(/has no Battle Value/)).toBeTruthy();
    });

    it("shows a bundled design's MUL BV beside ours under BV2", () => {
        const ours = tank().getBattleValue("total-warfare");
        render(<MemoryRouter><VehicleCalcBreakdown vehicle={tank()} mulBattleValue={ours + 5} /></MemoryRouter>);
        expect(screen.getByText(/Master Unit List: /).textContent).toContain(`${(ours + 5).toLocaleString("en-US")}. The JBT value differs by -5`);
    });
});

describe("BattleArmorCalcBreakdown (#599)", () => {
    const suit = () => {
        const unit = new BattleArmor();
        unit.setWeightClass("medium");
        unit.setMotive("jump", 3);
        unit.setManipulator("ra", "battle-claw");
        unit.setArmor("ba-mimetic");
        unit.setArmorPoints(6);
        unit.addItem("is-er-small-laser", "la");
        unit.updateItem(0, { modular: true });
        unit.setSquadSize(6);
        return unit;
    };

    it("starts on the unit's edition with the BV2 steps, the skill-adjusted BV and the cost with its training", () => {
        const { container } = render(<MemoryRouter><BattleArmorCalcBreakdown suit={suit()} /></MemoryRouter>);
        const select = screen.getByLabelText("Rules edition") as HTMLSelectElement;
        expect(select.value).toBe("total-warfare");
        expect(container.querySelector(".calc-breakdown-result")?.textContent).toBe("466");
        expect(screen.getByText(/Adjusted for skill \(Gunnery \d, Anti-'Mech \d\)/)).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Cost" })).toBeTruthy();
        expect(screen.getAllByText(/Trooper training \(Inner Sphere troopers\)/).length).toBeGreaterThan(0);
    });

    it("works the Companion's BV1 under a Master Rules edition, and gives no Battle Value before them", () => {
        render(<MemoryRouter><BattleArmorCalcBreakdown suit={suit()} /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules-revised" } });
        expect(screen.getByText(/Battle Value 1, as this edition works it out/)).toBeTruthy();
        expect(screen.getAllByText(/CBT Companion/).length).toBeGreaterThan(0);
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "battletech-4th-edition" } });
        expect(screen.getByText(/has no Battle Value/)).toBeTruthy();
    });

    it("shows the Revised Master Rules' fixed price of a stock suit once the breakdown is switched to a Master Rules edition (BMR(R) p.150)", () => {
        const stock = suit();
        stock.setSquadSize(4);
        stock.setName("Purifier Battle Armor");
        render(<MemoryRouter><BattleArmorCalcBreakdown suit={stock} /></MemoryRouter>);
        expect(screen.queryByText(/fixed price for the stock suit/)).toBeNull();
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules-revised" } });
        expect(screen.getAllByText(/fixed price for the stock suit/).length).toBeGreaterThan(0);
    });

    it("shows a bundled unit's MUL BV beside ours under BV2, and not under BV1", () => {
        const ours = suit().getBattleValue("total-warfare");
        render(<MemoryRouter><BattleArmorCalcBreakdown suit={suit()} mulBattleValue={ours + 5} /></MemoryRouter>);
        expect(screen.getByText(/Master Unit List: /).textContent).toContain(`${(ours + 5).toLocaleString("en-US")}. The JBT value differs by -5`);
        fireEvent.change(screen.getByLabelText("Rules edition"), { target: { value: "master-rules" } });
        expect(screen.queryByText(/Master Unit List: /)).toBeNull();
    });
});
