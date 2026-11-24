// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuirkList } from "../../classes/quirk-list";
import { BattleMech } from "../../classes/battlemech";
import Vehicle from "../../classes/vehicle";
import { getOfferedQuirks } from "../../data/quirk-registry";
import { registerLocalCustomContent } from "../../data/custom-content-local";
import QuirkPicker from "./quirk-picker";

afterEach(() => {
    cleanup();
    localStorage.clear();
    registerLocalCustomContent([]);
});

const picker = (quirks: QuirkList, editionTag: string, onChange = vi.fn(), rulesLevel = 3) => render(
    <QuirkPicker
        quirks={quirks}
        unitType="mech"
        editionTag={editionTag}
        rulesLevel={rulesLevel}
        locations={[{ tag: "ra", label: "Right Arm" }]}
        weapons={[{ uuid: "w1", label: "Medium Laser (RA)", maxDamage: 5 }]}
        unitMaxDamage={5}
        onChange={onChange}
    />,
);

const quirkSelect = () => screen.getByLabelText("Quirk") as HTMLSelectElement;

describe("getOfferedQuirks", () => {
    it("offers no quirks under Battledroids", () => {
        expect(getOfferedQuirks("mech", "battledroids", 3)).toEqual([]);
    });

    it("offers quirks under Total Warfare, positive first, then by name", () => {
        const offered = getOfferedQuirks("mech", "total-warfare", 3);
        expect(offered.length).toBeGreaterThan(0);
        const firstNegative = offered.findIndex((quirk) => quirk.kind === "negative");
        expect(offered.slice(firstNegative).every((quirk) => quirk.kind === "negative")).toBe(true);
        const positives = offered.slice(0, firstNegative).map((quirk) => quirk.name);
        expect(positives).toEqual([...positives].sort((a, b) => a.localeCompare(b)));
    });

    it("offers nothing below the Advanced level", () => {
        expect(getOfferedQuirks("mech", "total-warfare", 2)).toEqual([]);
    });
});

describe("QuirkPicker", () => {
    it("keeps a quirk the edition does not offer, with a note, and offers nothing to add", () => {
        const quirks = new QuirkList();
        quirks.add({ tag: "quirk-command-mech" });
        picker(quirks, "battledroids");
        expect(screen.getByText(/Command 'Mech/).textContent).toBeTruthy();
        expect(screen.getByText(/not offered in Battledroids/)).toBeTruthy();
        expect(Array.from(quirkSelect().options).filter((option) => option.value)).toEqual([]);
    });

    it("shows why Battle Computer cannot join Command 'Mech", () => {
        const quirks = new QuirkList();
        quirks.add({ tag: "quirk-command-mech" });
        const onChange = vi.fn();
        picker(quirks, "total-warfare", onChange);
        fireEvent.change(quirkSelect(), { target: { value: "quirk-battle-computer" } });
        fireEvent.click(screen.getByRole("button", { name: "Add quirk" }));
        expect(screen.getByText(/excluded by Command 'Mech/)).toBeTruthy();
        expect(quirks.getAll()).toHaveLength(1);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("adds a weapon quirk to the chosen weapon", () => {
        const quirks = new QuirkList();
        const onChange = vi.fn();
        picker(quirks, "total-warfare", onChange);
        fireEvent.change(quirkSelect(), { target: { value: "quirk-accurate-weapon" } });
        fireEvent.change(screen.getByLabelText("Weapon"), { target: { value: "w1" } });
        fireEvent.click(screen.getByRole("button", { name: "Add quirk" }));
        expect(quirks.getAll()).toEqual([{ tag: "quirk-accurate-weapon", equipmentUuid: "w1" }]);
        expect(onChange).toHaveBeenCalled();
    });

    // User ruling 2026-10-22: Improved Cooling Jacket only goes on a weapon that makes heat.
    it("offers Improved Cooling Jacket only for weapons that make heat", () => {
        render(
            <QuirkPicker
                quirks={new QuirkList()}
                unitType="mech"
                editionTag="total-warfare"
                rulesLevel={3}
                locations={[{ tag: "ra", label: "Right Arm" }]}
                weapons={[{ uuid: "w1", label: "Medium Laser (RA)", maxDamage: 5, heat: 3 }, { uuid: "w2", label: "Machine Gun (RA)", maxDamage: 2, heat: 0 }]}
                unitMaxDamage={7}
                onChange={vi.fn()}
            />,
        );
        fireEvent.change(quirkSelect(), { target: { value: "quirk-improved-cooling-jacket" } });
        const options = Array.from((screen.getByLabelText("Weapon") as HTMLSelectElement).options).map((option) => option.value);
        expect(options).toEqual(["", "w1"]);
        fireEvent.change(quirkSelect(), { target: { value: "quirk-accurate-weapon" } });
        expect(Array.from((screen.getByLabelText("Weapon") as HTMLSelectElement).options).map((option) => option.value)).toEqual(["", "w1", "w2"]);
    });

    it("notes a weapon quirk whose weapon is not installed", () => {
        const quirks = new QuirkList();
        quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: "gone" });
        picker(quirks, "total-warfare");
        expect(screen.getByText(/not installed/)).toBeTruthy();
    });

    it("cites the balance advice on Campaign Operations p.225", () => {
        picker(new QuirkList(), "total-warfare");
        expect(screen.getByText(/Campaign Operations \(p\.225\) recommends/)).toBeTruthy();
    });

    it("counts no points for a quirk on a weapon not installed", () => {
        const quirks = new QuirkList();
        quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: "gone" });
        picker(quirks, "total-warfare");
        expect(screen.getByText(/weapon not installed\): 0/)).toBeTruthy();
        expect(screen.getByText("Positive 0, negative 0")).toBeTruthy();
    });

    it("totals the points and removes a quirk", () => {
        const quirks = new QuirkList();
        quirks.add({ tag: "quirk-command-mech" });
        const onChange = vi.fn();
        picker(quirks, "total-warfare", onChange);
        expect(screen.getByText(/Positive 2/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Remove Command 'Mech" }));
        expect(quirks.getAll()).toEqual([]);
        expect(onChange).toHaveBeenCalled();
    });
});

describe("quirk locations", () => {
    // Right arm has a hand; left arm has a lower arm actuator and no hand.
    const arms = [
        { tag: "ra", label: "Right Arm", arm: true, lowerArm: true, hand: true },
        { tag: "la", label: "Left Arm", arm: true, lowerArm: true, hand: false },
        { tag: "rt", label: "Right Torso", torso: true },
        { tag: "hd", label: "Head" },
    ];
    const armPicker = (quirks: QuirkList, onChange = vi.fn()) => render(
        <QuirkPicker quirks={quirks} unitType="mech" editionTag="total-warfare" rulesLevel={3} locations={arms} weapons={[]} unitMaxDamage={0} onChange={onChange} />,
    );
    const locationOptions = () => Array.from((screen.getByLabelText("Location") as HTMLSelectElement).options).map((option) => option.value).filter(Boolean);

    it("offers Barrel Fist only on an arm with a lower arm actuator and no hand (CO p.225)", () => {
        armPicker(new QuirkList());
        fireEvent.change(quirkSelect(), { target: { value: "quirk-barrel-fist" } });
        expect(locationOptions()).toEqual(["la"]);
    });

    it("offers Battlefists only on an arm with a hand, and only once (CO p.225)", () => {
        const quirks = new QuirkList();
        armPicker(quirks);
        fireEvent.change(quirkSelect(), { target: { value: "quirk-battlefists" } });
        fireEvent.change(screen.getByLabelText("Attach to"), { target: { value: "location" } });
        expect(locationOptions()).toEqual(["ra"]);
        expect(quirks.add({ tag: "quirk-battlefists" })).toBeNull();
        expect(quirks.add({ tag: "quirk-battlefists", location: "ra" })).toBe("only once per unit");
    });

    it("offers Directional Torso Mount only on a torso", () => {
        armPicker(new QuirkList());
        fireEvent.change(quirkSelect(), { target: { value: "quirk-directional-torso-mount" } });
        expect(locationOptions()).toEqual(["rt"]);
    });

    it("leaves Fast Reload free to go on any location", () => {
        armPicker(new QuirkList());
        fireEvent.change(quirkSelect(), { target: { value: "quirk-fast-reload" } });
        fireEvent.change(screen.getByLabelText("Attach to"), { target: { value: "location" } });
        expect(locationOptions()).toEqual(["ra", "la", "rt", "hd"]);
    });

    it("refuses Battlefists on the whole unit when no arm has a hand", () => {
        const quirks = new QuirkList();
        const onChange = vi.fn();
        render(<QuirkPicker quirks={quirks} unitType="mech" editionTag="total-warfare" rulesLevel={3} locations={arms.filter((arm) => !arm.hand)} weapons={[]} unitMaxDamage={0} onChange={onChange} />);
        fireEvent.change(quirkSelect(), { target: { value: "quirk-battlefists" } });
        fireEvent.click(screen.getByRole("button", { name: "Add quirk" }));
        expect(screen.getByRole("alert").textContent).toMatch(/hand actuator/);
        expect(quirks.getAll()).toEqual([]);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("notes a Barrel Fist on an arm that has since gained a hand", () => {
        const quirks = new QuirkList();
        quirks.add({ tag: "quirk-barrel-fist", location: "ra" });
        armPicker(quirks);
        expect(screen.getByText(/needs an arm with a lower arm actuator and no hand actuator/)).toBeTruthy();
    });

    const valueOptions = () => Array.from((screen.getByLabelText("Value") as HTMLSelectElement).options).map((option) => option.value);
    const quadPicker = (quirks: QuirkList, quad: boolean) => render(
        <QuirkPicker quirks={quirks} unitType="mech" editionTag="total-warfare" rulesLevel={3} locations={arms} weapons={[]} unitMaxDamage={0} quad={quad} onChange={vi.fn()} />,
    );

    it("offers only the 2-point Directional Torso Mount on a 'Mech that is not a quad (CO p.226)", () => {
        quadPicker(new QuirkList(), false);
        fireEvent.change(quirkSelect(), { target: { value: "quirk-directional-torso-mount" } });
        expect(valueOptions()).toEqual(["2"]);
    });

    it("offers the 3-point Directional Torso Mount on a quad", () => {
        const quirks = new QuirkList();
        quadPicker(quirks, true);
        fireEvent.change(quirkSelect(), { target: { value: "quirk-directional-torso-mount" } });
        expect(valueOptions()).toEqual(["2", "3"]);
        fireEvent.change(screen.getByLabelText("Value"), { target: { value: "3" } });
        fireEvent.change(screen.getByLabelText("Location"), { target: { value: "rt" } });
        fireEvent.click(screen.getByRole("button", { name: "Add quirk" }));
        expect(quirks.getAll()).toEqual([{ tag: "quirk-directional-torso-mount", location: "rt", parameter: 3 }]);
    });

    it("notes a 3-point Directional Torso Mount on a 'Mech that is no longer a quad", () => {
        const quirks = new QuirkList();
        quirks.add({ tag: "quirk-directional-torso-mount", location: "rt", parameter: 3 });
        quadPicker(quirks, false);
        expect(screen.getByText(/the 3-point version needs a quad 'Mech/)).toBeTruthy();
    });

    it("marks a 'Mech's arms and their actuators, and a quad has no arms", () => {
        const mech = new BattleMech();
        const ra = mech.getQuirkTargets().locations.find((location) => location.tag === "ra");
        expect(ra).toMatchObject({ arm: true, lowerArm: true, hand: true });
        expect(mech.getQuirkTargets().locations.find((location) => location.tag === "ct")).toMatchObject({ torso: true });
        mech.setMechType("quad");
        expect(mech.isQuad()).toBe(true);
        expect(mech.getQuirkTargets().locations.find((location) => location.tag === "ra")?.arm).toBeFalsy();
    });

    it("tells the picker whether the 'Mech is a quad", () => {
        const mech = new BattleMech();
        expect(mech.getQuirkTargets().quad).toBeFalsy();
        mech.setMechType("quad");
        expect(mech.getQuirkTargets().quad).toBe(true);
    });
});

describe("custom quirks", () => {
    it("only offers the custom quirk form from the custom rules level up", () => {
        picker(new QuirkList(), "total-warfare");
        expect(screen.queryByRole("button", { name: "Save custom quirk" })).toBeNull();
    });

    it("saves a custom quirk in this browser and offers it", () => {
        picker(new QuirkList(), "total-warfare", vi.fn(), 6);
        fireEvent.change(screen.getByLabelText("Custom quirk name"), { target: { value: "Lucky Paint" } });
        fireEvent.change(screen.getByLabelText("Custom quirk kind"), { target: { value: "negative" } });
        fireEvent.change(screen.getByLabelText("Custom quirk points"), { target: { value: "2" } });
        fireEvent.change(screen.getByLabelText("Custom quirk summary"), { target: { value: "The crew swear by it." } });
        fireEvent.click(screen.getByRole("button", { name: "Save custom quirk" }));
        const saved = JSON.parse(localStorage.getItem("localCustomContent") ?? "[]");
        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({ kind: "quirk", record: { tag: "quirk-custom-lucky-paint", kind: "negative", cost: { points: 2 }, unitTypes: ["mech"], attaches: ["unit"] } });
        expect(Array.from(quirkSelect().options).map((option) => option.value)).toContain("quirk-custom-lucky-paint");
    });

    it("refuses a custom quirk named like an existing quirk", () => {
        picker(new QuirkList(), "total-warfare", vi.fn(), 6);
        fireEvent.change(screen.getByLabelText("Custom quirk name"), { target: { value: "Command 'Mech" } });
        fireEvent.change(screen.getByLabelText("Custom quirk points"), { target: { value: "2" } });
        fireEvent.click(screen.getByRole("button", { name: "Save custom quirk" }));
        expect(screen.getByRole("alert").textContent).toMatch(/already/);
        expect(localStorage.getItem("localCustomContent")).toBeNull();
    });
});

describe("quirk issue lines", () => {
    it("names a quirk a Battledroids 'Mech cannot have", () => {
        const mech = new BattleMech();
        mech.quirks.add({ tag: "quirk-command-mech" });
        mech.setRulesEdition("battledroids");
        expect(mech.getRulesEditionIssues(3)).toContain("Quirk: Command 'Mech (not in Battledroids)");
    });

    it("names a quirk above the selected rules level", () => {
        const vehicle = new Vehicle();
        vehicle.quirks.add({ tag: "quirk-rugged", parameter: 1 });
        expect(vehicle.getQuirkIssues(2)).toEqual(["Quirk: Rugged (above the selected rules level)"]);
        expect(vehicle.getQuirkIssues(3)).toEqual([]);
    });
});

describe("Trailer Hitch", () => {
    const offered = (editionTag: string, rulesLevel: number) => getOfferedQuirks("vehicle", editionTag, rulesLevel).some((quirk) => quirk.tag === "quirk-trailer-hitch");

    it("is canon in Total Warfare and apocryphal in the editions after it", () => {
        expect(offered("total-warfare", 3)).toBe(true);
        expect(offered("battlemech-manual", 4)).toBe(false);
        expect(offered("battlemech-manual", 5)).toBe(true);
        expect(offered("core-rulebook", 5)).toBe(true);
        expect(offered("master-rules", 5)).toBe(false);
    });

    it("is marked apocryphal in the picker after Total Warfare", () => {
        const quirks = new QuirkList();
        quirks.add({ tag: "quirk-trailer-hitch" });
        render(<QuirkPicker quirks={quirks} unitType="vehicle" editionTag="battlemech-manual" rulesLevel={5} locations={[]} weapons={[]} unitMaxDamage={0} onChange={vi.fn()} />);
        expect(screen.getByRole("listitem").textContent).toMatch(/^Trailer Hitch \(apocryphal\): \+1/);
        expect(Array.from(quirkSelect().options).find((option) => option.value === "quirk-trailer-hitch")?.textContent).toBe("+ Trailer Hitch (apocryphal)");
    });

    it("is not marked apocryphal in Total Warfare", () => {
        const quirks = new QuirkList();
        quirks.add({ tag: "quirk-trailer-hitch" });
        render(<QuirkPicker quirks={quirks} unitType="vehicle" editionTag="total-warfare" rulesLevel={5} locations={[]} weapons={[]} unitMaxDamage={0} onChange={vi.fn()} />);
        expect(screen.queryByText(/apocryphal/)).toBeNull();
    });
});

describe("QuirkPicker on a craft that fires bays", () => {
    it("puts a weapon quirk on a whole bay", () => {
        const quirks = new QuirkList();
        render(
            <QuirkPicker quirks={quirks} unitType="dropship" editionTag="total-warfare" rulesLevel={3} locations={[]} weapons={[]}
                bays={[{ uuids: ["a", "b"], label: "Lasers: 1 Large Laser, 1 Medium Laser (Nose)", maxDamage: 13 }]} unitMaxDamage={13} onChange={vi.fn()} />,
        );
        fireEvent.change(quirkSelect(), { target: { value: "quirk-accurate-weapon" } });
        fireEvent.change(screen.getByLabelText("Weapon"), { target: { value: "bay:a,b" } });
        fireEvent.click(screen.getByRole("button", { name: "Add quirk" }));
        expect(quirks.getAll()).toEqual([{ tag: "quirk-accurate-weapon", bayUuids: ["a", "b"] }]);
    });

    it("lists a quirk on an emptied bay as not installed, worth nothing", () => {
        const quirks = new QuirkList();
        quirks.add({ tag: "quirk-accurate-weapon", bayUuids: ["gone"] });
        render(<QuirkPicker quirks={quirks} unitType="dropship" editionTag="total-warfare" rulesLevel={3} locations={[]} weapons={[]} bays={[]} unitMaxDamage={0} onChange={vi.fn()} />);
        expect(screen.getByText(/Accurate Weapon \(weapon not installed\): 0/)).toBeTruthy();
    });
});

