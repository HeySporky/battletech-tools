// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMech } from "../../../../test-support/builders";
import { BattleMechForce } from "../../../../classes/battlemech-force";
import type { IAppGlobals } from "../../../app-router";
import Vehicle from "../../../../classes/vehicle";
import EWarNotes from "../../../components/ewar-notes";
import { setEWarEcmMode } from "../../../../utils/ewar-play";
import { C3NetworkField } from "./_vehicleGroupTable";
import { MemoryRouter } from "react-router";
import ClassicBattleTechRosterPlay from "./play";

afterEach(cleanup);

/** A force with one selected 'Mech under the Total Warfare rules, in the shape the play page reads. */
const playPage = () => {
    const mech = buildMech();
    mech.setRulesEdition("total-warfare");
    mech.setArmorType("stealth-basic");
    mech.selectedMech = true;
    const force = new BattleMechForce();
    force.groups[0].members.push(mech);
    const save = vi.fn();
    const appGlobals = {
        currentCBTForce: force,
        saveCurrentCBTForce: save,
        appSettings: {},
        saveAppSettings: vi.fn(),
        makeDocumentTitle: vi.fn(),
    } as unknown as IAppGlobals;
    render(<MemoryRouter><ClassicBattleTechRosterPlay appGlobals={appGlobals} /></MemoryRouter>);
    return { mech, save };
};

describe("Classic BattleTech roster play page: E-War box (#642 Phase 2)", () => {
    it("shows the stealth switch for a stealth-armored 'Mech, and switching it on saves the force and sets the state", () => {
        const { mech, save } = playPage();
        const toggle = screen.getByTestId("ewar-stealth-stealth-armor") as HTMLInputElement;
        expect(toggle.checked).toBe(false);
        fireEvent.click(toggle);
        expect(mech.ewarPlay.stealthOn).toEqual({ "stealth-armor": true });
        expect(save).toHaveBeenCalled();
    });
    it("does not offer the target-stealth calculator on the 'Mech, which has its own Target dialog", () => {
        playPage();
        expect(screen.queryByTestId("ewar-target-stealth")).toBeNull();
    });
});

describe("Classic BattleTech roster play page: take-damage missile dialog (#642 Phase 1 minors)", () => {
    const withAms = (edition: string) => {
        const mech = buildMech();
        mech.setRulesEdition(edition);
        mech.addEquipmentFromTag("is-ams", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("ammo-is-ams-standard", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        mech.selectedMech = true;
        const force = new BattleMechForce();
        force.phase = 2;
        force.groups[0].members.push(mech);
        const appGlobals = { currentCBTForce: force, saveCurrentCBTForce: vi.fn(), appSettings: {}, saveAppSettings: vi.fn(), makeDocumentTitle: vi.fn() } as unknown as IAppGlobals;
        render(<MemoryRouter><ClassicBattleTechRosterPlay appGlobals={appGlobals} /></MemoryRouter>);
        fireEvent.click(screen.getByText("Take Damage"));
        fireEvent.click(screen.getByLabelText(/Missile attack \(anti-missile defense\)/));
    };
    it("says the AMS cannot engage a Swarm missile under the Master Rules, and engages a Thunder one under Total Warfare", () => {
        withAms("master-rules");
        fireEvent.change(screen.getByTestId("missile-munition"), { target: { value: "swarm" } });
        expect(screen.getByTestId("missile-no-defense").textContent).toContain("cannot engage swarm missiles");
        cleanup();
        withAms("total-warfare");
        fireEvent.change(screen.getByTestId("missile-munition"), { target: { value: "thunder" } });
        expect(screen.queryByTestId("missile-no-defense")).toBeNull();
    });
});

describe("Classic BattleTech roster play page: AMS heat (#642 Phase 1 minors)", () => {
    it("puts the AMS heat in the turn heat, not straight on the heat scale", () => {
        const mech = buildMech();
        mech.setRulesEdition("total-warfare");
        mech.addEquipmentFromTag("is-ams", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("ammo-is-ams-standard", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        mech.selectedMech = true;
        const force = new BattleMechForce();
        force.phase = 2;
        force.groups[0].members.push(mech);
        const appGlobals = { currentCBTForce: force, saveCurrentCBTForce: vi.fn(), appSettings: {}, saveAppSettings: vi.fn(), makeDocumentTitle: vi.fn() } as unknown as IAppGlobals;
        render(<MemoryRouter><ClassicBattleTechRosterPlay appGlobals={appGlobals} /></MemoryRouter>);
        fireEvent.click(screen.getByText("Take Damage"));
        fireEvent.click(screen.getByLabelText(/Missile attack \(anti-missile defense\)/));
        fireEvent.click(screen.getByText("Apply and use this damage"));
        expect(mech.ewarPlay.heat).toBe(1);
        expect(mech.currentHeat).toBe(0);
    });
});

describe("Classic BattleTech roster play page: missile damage groupings (#642 Phase 1 minors)", () => {
    it("splits the hit into groupings and queues the ones after the first", () => {
        const mech = buildMech();
        mech.setRulesEdition("total-warfare");
        mech.addEquipmentFromTag("is-ams", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("ammo-is-ams-standard", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        mech.selectedMech = true;
        const force = new BattleMechForce();
        force.phase = 2;
        force.groups[0].members.push(mech);
        const appGlobals = { currentCBTForce: force, saveCurrentCBTForce: vi.fn(), appSettings: {}, saveAppSettings: vi.fn(), makeDocumentTitle: vi.fn() } as unknown as IAppGlobals;
        render(<MemoryRouter><ClassicBattleTechRosterPlay appGlobals={appGlobals} /></MemoryRouter>);
        fireEvent.click(screen.getByText("Take Damage"));
        fireEvent.click(screen.getByLabelText(/Missile attack \(anti-missile defense\)/));
        fireEvent.change(screen.getByDisplayValue("10"), { target: { value: "20" } });
        fireEvent.click(screen.getByText("Apply and use this damage"));
        expect(screen.getByTestId("missile-queue").textContent).toMatch(/1 more/);
    });
});


describe("E-War Phase 3: C3 board and view controls", () => {
    const c3Vehicle = (tag: string) => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag(tag, "body");
        return vehicle;
    };
    const forceOf = (edition: string, units: Vehicle[]) => {
        const force = new BattleMechForce();
        force.rulesEdition = edition;
        for (const unit of units) unit.setRulesEdition(edition);
        force.groups[0].vehicles.push(...units);
        return force;
    };

    it("shows the network, role and link status of a networked unit in its E-War block, and why it is cut off", () => {
        const master = c3Vehicle("c3-computer-master");
        const slave = c3Vehicle("c3-computer-slave");
        const force = forceOf("total-warfare", [master, slave]);
        force.setC3Network(master.getUUID(), "A");
        force.setC3Network(slave.getUUID(), "A");
        render(<EWarNotes unit={slave} force={force} onChange={vi.fn()} />);
        expect(screen.getByTestId("ewar-c3-line").textContent).toContain("A");
        expect(screen.getByTestId("ewar-c3-line").textContent).toContain("linked");
        cleanup();
        slave.ewarPlay = { inHostileEcm: true };
        render(<EWarNotes unit={slave} force={force} onChange={vi.fn()} />);
        expect(screen.getByTestId("ewar-c3-line").textContent).toContain("cut off");
        expect(screen.getByTestId("ewar-c3-line").textContent).toContain("hostile ECM");
    });

    it("shows no C3 line for a unit with no C3 gear, and offers the nearest-range tick to a vehicle target calculator", () => {
        const plain = new Vehicle();
        const force = forceOf("total-warfare", [plain]);
        render(<EWarNotes unit={plain} force={force} onChange={vi.fn()} />);
        expect(screen.queryByTestId("ewar-c3-line")).toBeNull();
    });

    it("applies the nearest networked unit range in a vehicle target calculator, and not under an edition without C3", () => {
        const master = c3Vehicle("c3-computer-master");
        const slave = c3Vehicle("c3-computer-slave");
        const force = forceOf("total-warfare", [master, slave]);
        force.setC3Network(master.getUUID(), "A");
        force.setC3Network(slave.getUUID(), "A");
        render(<EWarNotes unit={slave} force={force} onChange={vi.fn()} />);
        fireEvent.change(screen.getByTestId("ewar-target-band"), { target: { value: "long" } });
        fireEvent.change(screen.getByTestId("ewar-target-c3"), { target: { value: "short" } });
        expect(screen.getByTestId("ewar-target-c3-result").textContent).toContain("-4");
        cleanup();
        // The vehicle builder only plays under the Total Warfare family, so an older edition is a stand-in carrier.
        const early = { getUUID: () => "e", getRulesEdition: () => "battletech-3rd-edition", ewarPlay: {}, getEWarGear: () => [{ kind: "c3-slave" as const, tag: "c3-computer-slave", name: "C3 Slave", destroyed: false }] };
        render(<EWarNotes unit={early} force={new BattleMechForce()} onChange={vi.fn()} />);
        expect(screen.getByTestId("ewar-c3-line").textContent).toContain("is not in");
    });

    it("lets the player set a role and refuses a fourth Slave under the Master Rules with the limit label", () => {
        const master = c3Vehicle("c3-computer-master");
        const slaves = [1, 2, 3, 4].map(() => c3Vehicle("c3-computer-slave"));
        const force = forceOf("master-rules", [master, ...slaves]);
        force.setC3Network(master.getUUID(), "A");
        for (const slave of slaves.slice(0, 3)) force.setC3Network(slave.getUUID(), "A");
        const onChange = vi.fn();
        render(<C3NetworkField force={force} unit={slaves[3]} edit={true} onChange={onChange} />);
        fireEvent.change(screen.getByTestId("c3-network-select"), { target: { value: "A" } });
        expect(screen.getByTestId("c3-network-labels").textContent).toContain("controls at most 3 Slaves");
        expect(force.c3Networks[slaves[3].getUUID()]).toBeUndefined();
    });

    it("shows the role select and takes a Master role without a label, and refuses it for a unit with no Master computer", () => {
        const first = c3Vehicle("c3-computer-master");
        const second = c3Vehicle("c3-computer-master");
        const force = forceOf("master-rules", [first, second]);
        force.setC3Network(first.getUUID(), "A");
        render(<C3NetworkField force={force} unit={second} edit={true} onChange={vi.fn()} />);
        fireEvent.change(screen.getByTestId("c3-network-select"), { target: { value: "A" } });
        fireEvent.change(screen.getByTestId("c3-role-select"), { target: { value: "master" } });
        expect(screen.queryByTestId("c3-network-labels")).toBeNull();
        expect(force.c3Records[0].members.find((member) => member.uuid === second.getUUID())?.role).toBe("master");
    });
});

describe("E-War Phase 3: aerospace ECM block", () => {
    const craft = (edition: string) => ({ getUUID: () => "f", getRulesEdition: () => edition, ewarPlay: {}, getEWarGear: () => [{ kind: "ecm-guardian" as const, tag: "ecm-suite", name: "ECM", destroyed: false }] });

    it("counts hostile ECM hexes into a to-hit result for a fighter under Total Warfare", () => {
        render(<EWarNotes unit={craft("total-warfare")} aero="fighter" onChange={vi.fn()} />);
        fireEvent.change(screen.getByTestId("ewar-aero-fighter"), { target: { value: "3" } });
        expect(screen.getByTestId("ewar-aero-result").textContent).toContain("+3");
        fireEvent.change(screen.getByTestId("ewar-aero-map"), { target: { value: "ground" } });
        expect(screen.getByTestId("ewar-aero-result").textContent).toContain("ground");
    });

    it("shows no aerospace block under an edition with no aerospace ECM rule, and keeps it as apocryphal after Total Warfare", () => {
        render(<EWarNotes unit={craft("battletech-compendium")} aero="fighter" onChange={vi.fn()} />);
        expect(screen.queryByTestId("ewar-aero-ecm")).toBeNull();
        cleanup();
        render(<EWarNotes unit={craft("battlemech-manual")} aero="fighter" onChange={vi.fn()} />);
        expect(screen.getByTestId("ewar-aero-ecm")).toBeTruthy();
    });
});


describe("E-War Phase 3 review fixes: C3 line controls", () => {
    const c3Vehicle = (tag: string) => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag(tag, "body");
        return vehicle;
    };
    const setup = () => {
        const master = c3Vehicle("c3-computer-master");
        const slave = c3Vehicle("c3-computer-slave");
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        force.groups[0].vehicles.push(master, slave);
        force.setC3Network(master.getUUID(), "A");
        force.setC3Network(slave.getUUID(), "A");
        return { master, slave, force };
    };

    it("lets the player say the unit is inside hostile ECM, friendly ECCM, Angel or Nova ECM, and tells the page", () => {
        const { slave, force } = setup();
        const onChange = vi.fn();
        render(<EWarNotes unit={slave} force={force} onChange={onChange} />);
        fireEvent.click(screen.getByTestId("ewar-in-hostile-ecm"));
        expect(slave.ewarPlay.inHostileEcm).toBe(true);
        expect(onChange).toHaveBeenCalled();
        fireEvent.click(screen.getByTestId("ewar-in-friendly-eccm"));
        expect(slave.ewarPlay.inFriendlyEccm).toBe(true);
        fireEvent.click(screen.getByTestId("ewar-hostile-angel"));
        expect(slave.ewarPlay.hostileAngelEcm).toBe(true);
        fireEvent.click(screen.getByTestId("ewar-hostile-nova"));
        expect(slave.ewarPlay.hostileNovaEcm).toBe(true);
    });

    it("puts a unit in a network and names the Master a Slave hangs from, from its own E-War block", () => {
        const { master, slave, force } = setup();
        const loose = c3Vehicle("c3-computer-slave");
        force.groups[0].vehicles.push(loose);
        render(<EWarNotes unit={loose} force={force} onChange={vi.fn()} />);
        fireEvent.change(screen.getByTestId("ewar-c3-network"), { target: { value: "A" } });
        expect(force.c3Networks[loose.getUUID()]).toBe("A");
        cleanup();
        force.setC3Network(master.getUUID(), "A", "master");
        render(<EWarNotes unit={slave} force={force} onChange={vi.fn()} />);
        fireEvent.change(screen.getByTestId("ewar-c3-master"), { target: { value: master.getUUID() } });
        expect(force.c3Records[0].members.find((member) => member.uuid === slave.getUUID())?.master).toBe(master.getUUID());
    });

    it("fires a Remote Sensor pod from the block and refuses it with the limit label", () => {
        const { master, force } = setup();
        const launcher = c3Vehicle("c3-remote-sensor-launcher");
        force.groups[0].vehicles.push(launcher);
        force.setC3Network(launcher.getUUID(), "A");
        render(<EWarNotes unit={launcher} force={force} onChange={vi.fn()} />);
        fireEvent.change(screen.getByTestId("ewar-pod-hex"), { target: { value: "0505" } });
        fireEvent.click(screen.getByTestId("ewar-pod-fire"));
        expect(force.ewarBoard.sensorPods?.[0]).toMatchObject({ network: "A", hex: "0505" });
        expect(master).toBeDefined();
    });

    it("shows the force ECCM from the units set to ECCM mode", () => {
        const { slave, force } = setup();
        const guardian = c3Vehicle("ecm-suite");
        force.groups[0].vehicles.push(guardian);
        const gear = guardian.getEWarGear()[0];
        guardian.ewarPlay = { ecmOn: { [gear.uuid as string]: true }, ecmMode: { [gear.uuid as string]: "eccm" } };
        render(<EWarNotes unit={slave} force={force} onChange={vi.fn()} />);
        expect(screen.getByTestId("ewar-force-eccm").textContent).toContain("1");
    });

    it("tunes a fighter ECCM suite against ECM in its own hex", () => {
        const craft = { getUUID: () => "f", getRulesEdition: () => "total-warfare", ewarPlay: {}, getEWarGear: () => [{ kind: "ecm-guardian" as const, tag: "ecm-suite", name: "ECM", destroyed: false }] };
        render(<EWarNotes unit={craft} aero="fighter" onChange={vi.fn()} />);
        fireEvent.change(screen.getByTestId("ewar-aero-fighter"), { target: { value: "2" } });
        fireEvent.change(screen.getByTestId("ewar-aero-large-craft"), { target: { value: "1" } });
        expect(screen.getByTestId("ewar-aero-result").textContent).toContain("+3");
        fireEvent.click(screen.getByTestId("ewar-aero-tuned"));
        expect(screen.getByTestId("ewar-aero-result").textContent).toContain("+1");
        expect(screen.queryByTestId("ewar-aero-eccm")).toBeNull();
    });
});

describe("E-War Phase 3 deferred minors: infantry Narc launchers", () => {
    it("counts down the one-shot disposable launchers and stops at none", () => {
        const platoon = {
            getUUID: () => "i", getRulesEdition: () => "total-warfare", ewarPlay: {} as import("../../../../utils/ewar-play").IEWarPlayState,
            getNarcLaunchers: () => 2,
            getEWarGear: () => [{ kind: "narc" as const, tag: "inf-field-narc", name: "Disposable Narc launcher", destroyed: false }],
        };
        render(<EWarNotes unit={platoon} onChange={vi.fn()} />);
        expect(screen.getByTestId("ewar-infantry-narc").textContent).toContain("left: 2 of 2");
        fireEvent.click(screen.getByTestId("ewar-infantry-narc-fire"));
        expect(platoon.ewarPlay.narcFired).toBe(1);
        fireEvent.click(screen.getByTestId("ewar-infantry-narc-fire"));
        expect(platoon.ewarPlay.narcFired).toBe(2);
        expect((screen.getByTestId("ewar-infantry-narc-fire") as HTMLButtonElement).disabled).toBe(false);
    });
});

describe("E-War Phase 4: the Blue Saviour in the take-damage missile dialog", () => {
    const withSaviour = (on: boolean) => {
        const mech = buildMech();
        mech.setRulesEdition("total-warfare");
        mech.addEquipmentFromTag("custom-blue-saviour", "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
        expect(mech.setBlueSaviour(on)).toBe(true);
        mech.selectedMech = true;
        const force = new BattleMechForce();
        force.phase = 2;
        force.groups[0].members.push(mech);
        const appGlobals = { currentCBTForce: force, saveCurrentCBTForce: vi.fn(), appSettings: {}, saveAppSettings: vi.fn(), makeDocumentTitle: vi.fn() } as unknown as IAppGlobals;
        render(<MemoryRouter><ClassicBattleTechRosterPlay appGlobals={appGlobals} /></MemoryRouter>);
        fireEvent.click(screen.getByText("Take Damage"));
        return mech;
    };
    it("offers the missile defense with no AMS fitted, takes the shift, costs no heat, and answers once a turn", () => {
        const mech = withSaviour(true);
        fireEvent.click(screen.getByLabelText(/Missile attack \(anti-missile defense\)/));
        expect(screen.getByTestId("missile-defense").textContent).toContain("Blue Saviour");
        fireEvent.click(screen.getByText("Apply and use this damage"));
        expect(mech.ewarPlay.heat ?? 0).toBe(0);
        expect(mech.ewarPlay.amsUses).toEqual({ "blue-saviour": 1 });
        fireEvent.click(screen.getByLabelText(/Missile attack \(anti-missile defense\)/));
        expect(screen.getByTestId("missile-no-defense")).toBeTruthy();
    });
    it("is not offered while the field is off", () => {
        withSaviour(false);
        expect(screen.queryByTestId("missile-defense")).toBeNull();
    });
});

describe("E-War Phase 4: the Blue Saviour in the C3 block", () => {
    it("shows the unit inside hostile ECM it cannot clear, cut off, with the box ticked and locked", () => {
        const master = new Vehicle();
        master.addEquipmentFromTag("c3-computer-master", "body");
        const slave = new Vehicle();
        slave.addEquipmentFromTag("c3-computer-slave", "body");
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        for (const unit of [master, slave]) unit.setRulesEdition("total-warfare");
        force.groups[0].vehicles.push(master, slave);
        force.setC3Network(master.getUUID(), "A");
        force.setC3Network(slave.getUUID(), "A");
        slave.ewarPlay = { inFriendlyEccm: true };
        (slave as unknown as { isBlueSaviourOn: () => boolean }).isBlueSaviourOn = () => true;
        render(<EWarNotes unit={slave} force={force} onChange={vi.fn()} />);
        const box = screen.getByTestId("ewar-in-hostile-ecm") as HTMLInputElement;
        expect(box.checked).toBe(true);
        expect(box.disabled).toBe(true);
        expect(screen.getByTestId("ewar-blue-saviour-ecm").textContent).toContain("ECCM cannot cancel");
        expect(screen.getByTestId("ewar-c3-line").textContent).toContain("cut off");
        expect(screen.getByTestId("ewar-notes").textContent).toContain("Blue Saviour");
    });
});

describe("E-War Phase 4: the Personal ECM hex in the E-War block", () => {
    const rig = () => {
        const force = new BattleMechForce();
        const carrier = buildMech();
        carrier.setRulesEdition("total-warfare");
        carrier.addEquipmentFromTag("custom-personal-ecm", "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
        const mate = buildMech();
        mate.setRulesEdition("total-warfare");
        force.groups[0].members.push(carrier, mate);
        return { force, carrier, mate };
    };
    it("lets the carrier name the units in its hex, and the mate shows the cover", () => {
        const { force, carrier, mate } = rig();
        const onChange = vi.fn();
        render(<EWarNotes unit={carrier} force={force} onChange={onChange} />);
        fireEvent.click(screen.getByTestId(`ewar-personal-mate-${mate.getUUID()}`));
        expect(force.ewarBoard.personalEcm).toEqual({ [carrier.getUUID()]: [mate.getUUID()] });
        expect(onChange).toHaveBeenCalled();
        cleanup();
        render(<EWarNotes unit={mate} force={force} onChange={vi.fn()} />);
        expect(screen.getByTestId("ewar-personal-ecm-cover").textContent).toContain("its hex only");
        expect(screen.queryByTestId(`ewar-personal-mate-${carrier.getUUID()}`)).toBeNull();
    });
    it("a unit with no Personal ECM near it shows nothing of it", () => {
        const { force, mate } = rig();
        render(<EWarNotes unit={mate} force={force} onChange={vi.fn()} />);
        expect(screen.queryByTestId("ewar-personal-ecm")).toBeNull();
    });
});

describe("E-War Phase 4: review fixes in the E-War block", () => {
    it("the mate loses the cover line the moment the carrier suite is switched off, even before the board is rewritten", () => {
        const force = new BattleMechForce();
        const carrier = buildMech();
        carrier.setRulesEdition("total-warfare");
        carrier.addEquipmentFromTag("custom-personal-ecm", "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
        const mate = buildMech();
        mate.setRulesEdition("total-warfare");
        force.groups[0].members.push(carrier, mate);
        force.setPersonalEcmMates(carrier.getUUID(), [mate.getUUID()]);
        render(<EWarNotes unit={mate} force={force} onChange={vi.fn()} />);
        expect(screen.getByTestId("ewar-personal-ecm-cover")).toBeTruthy();
        cleanup();
        setEWarEcmMode(carrier, carrier.getEWarGear().find((gear) => gear.kind === "ecm-personal")!, "off");
        render(<EWarNotes unit={mate} force={force} onChange={vi.fn()} />);
        expect(screen.queryByTestId("ewar-personal-ecm-cover")).toBeNull();
    });
    it("the Inside hostile ECM box is editable when no Blue Saviour is on", () => {
        const master = new Vehicle();
        master.addEquipmentFromTag("c3-computer-master", "body");
        const slave = new Vehicle();
        slave.addEquipmentFromTag("c3-computer-slave", "body");
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        for (const unit of [master, slave]) unit.setRulesEdition("total-warfare");
        force.groups[0].vehicles.push(master, slave);
        force.setC3Network(master.getUUID(), "A");
        force.setC3Network(slave.getUUID(), "A");
        render(<EWarNotes unit={slave} force={force} onChange={vi.fn()} />);
        expect((screen.getByTestId("ewar-in-hostile-ecm") as HTMLInputElement).disabled).toBe(false);
        expect(screen.queryByTestId("ewar-blue-saviour-ecm")).toBeNull();
    });
});

describe("Classic BattleTech roster play page: side Initiative (#622)", () => {
    it("shows the uplink bonus with its source unit and drops it when the unit is destroyed", () => {
        const mech = buildMech();
        mech.addEquipmentFromTag("satellite-uplink", "is", "ct", false, undefined, "", false, [], undefined, undefined);
        const force = new BattleMechForce();
        force.groups[0].members.push(mech);
        const appGlobals = { currentCBTForce: force, saveCurrentCBTForce: vi.fn(), appSettings: {}, saveAppSettings: vi.fn(), makeDocumentTitle: vi.fn() } as unknown as IAppGlobals;
        render(<MemoryRouter><ClassicBattleTechRosterPlay appGlobals={appGlobals} /></MemoryRouter>);
        const line = screen.getByTestId("side-initiative").textContent ?? "";
        expect(line).toContain("+2");
        expect(line).toContain("Maximum Tech p.59");
        expect(line).toContain(mech.getName());
        cleanup();
        mech.pilot.wounds = 6;
        render(<MemoryRouter><ClassicBattleTechRosterPlay appGlobals={appGlobals} /></MemoryRouter>);
        expect(screen.queryByTestId("side-initiative")).toBeNull();
    });
});
