// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../../classes/battlemech";
import { BattleMechForce } from "../../../../classes/battlemech-force";
import { BattleMechGroup } from "../../../../classes/battlemech-group";
import type { IAppGlobals } from "../../../app-router";
import BattleMechAddMechDialog from "./_addMechDialog";
import BattleMechRosterHome from "./home";
import { newMULSearchFilters } from "../../../../utils/mulSearchFilters";
import { sswTestFixtures } from "../../../../data/ssw/sswTestFixtures";
import { getMULDisplayName } from "../../../../classes/alpha-strike-unit";
import Vehicle from "../../../../classes/vehicle";
import AerospaceFighter from "../../../../classes/aerospace-fighter";
import InfantryPlatoon from "../../../../classes/infantry-platoon";
import BattleArmor from "../../../../classes/battle-armor";
import ProtoMech from "../../../../classes/protomech";
import SmallCraft from "../../../../classes/small-craft";
import CapitalShip from "../../../../classes/capital-ship";
import { searchBundledMUL } from "../../../../utils";

afterEach(cleanup);

const makeAppGlobals = () => {
    const force = new BattleMechForce();
    force.newGroup();
    const favorite = new BattleMechGroup();
    favorite.members.push(new BattleMech());
    return {
        appSettings: { developerMenu: false, uiTheme: "", mechNameFilter: "", mechRulesFilter: -1, cbtMULSearch: newMULSearchFilters({ type: 18 }) },
        currentCBTForce: force,
        favoriteCBTGroups: [favorite],
        battleMechSaves: [],
        vehicleSaves: [], fighterSaves: [], smallCraftSaves: [], capitalShipSaves: [],
        infantrySaves: [], battleArmorSaves: [], protoMechSaves: [], buildingSaves: [],
        makeDocumentTitle: vi.fn(),
        saveAppSettings: vi.fn(),
        toggleMobile: vi.fn(),
        closeMobile: vi.fn(),
        siteAlerts: { activeAlerts: [] },
    } as unknown as IAppGlobals;
};

// Issue 18: review of the Classic BattleTech roster and its 2022 wording.
describe("Classic BattleTech roster page (issue 18)", () => {
    it("is titled as the Classic BattleTech roster, not the Alpha Strike one", () => {
        const appGlobals = makeAppGlobals();
        render(<MemoryRouter><BattleMechRosterHome appGlobals={appGlobals} /></MemoryRouter>);
        expect(appGlobals.makeDocumentTitle).toHaveBeenCalledWith("Classic BattleTech Roster");
    });

    it("drops the 2022 In Development banner and names every unit type", () => {
        const { container } = render(<MemoryRouter><BattleMechRosterHome appGlobals={makeAppGlobals()} /></MemoryRouter>);
        const text = container.textContent ?? "";
        expect(text).not.toContain("In Development");
        expect(text).not.toContain("2022");
        for (const unitType of ["'Mechs", "vehicles", "fighters", "Small Craft", "capital ships", "infantry", "battle armor", "ProtoMechs", "buildings", "Battledroids"]) {
            expect(text).toContain(unitType);
        }
    });

    // #34: the force totals counted only 'Mechs. Both total lines, above and below the groups, count every unit and show the same figures.
    it("counts a vehicle-only force in both force total lines, tons included", () => {
        const appGlobals = makeAppGlobals();
        appGlobals.currentCBTForce!.groups[0].vehicles.push(new Vehicle());
        const { container } = render(<MemoryRouter><BattleMechRosterHome appGlobals={appGlobals} /></MemoryRouter>);
        const totals = Array.from(container.querySelectorAll("p.text-center"))
            .map((line) => line.textContent ?? "").filter((text) => text.includes("Total Units"));
        expect(totals).toHaveLength(2);
        const tons = appGlobals.currentCBTForce!.getTotalTons();
        for (const line of totals) {
            expect(line).toContain("Total Units: 1");
            expect(line).toContain("Total Tons: " + tons);
        }
    });

    it("counts a one-unit favorite as One Unit and names the export file correctly", () => {
        const { container } = render(<MemoryRouter><BattleMechRosterHome appGlobals={makeAppGlobals()} /></MemoryRouter>);
        const text = container.textContent ?? "";
        expect(text).toContain("One Unit");
        expect(text).not.toContain("1 Units");
        expect(text).toContain("cbt-group-favorite-export-*.json");
    });
});

describe("Classic BattleTech roster: adding 'Mechs (issue 18)", () => {
    it("explains the Skunk Werks check instead of trusting only Introductory 'Mechs", () => {
        const appGlobals = makeAppGlobals();
        const { container } = render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={vi.fn()} />
            </MemoryRouter>
        );
        const text = container.textContent ?? "";
        expect(text).not.toContain("only Introductory Mechs");
        expect(text).toContain("checked against the Battle Value on the Master Unit List");
    });
});

// Ideas #84 (Camille, Centrella-Sworn, Star League Discord): search the MUL from the Classic roster.
describe("Classic roster Master Unit List search", () => {
    it("finds a 'Mech on the MUL and adds the design saved for it to the group", async () => {
        const appGlobals = makeAppGlobals();
        const champion = new BattleMech();
        champion.importSSWXML(sswTestFixtures["Champion C"]);
        appGlobals.battleMechSaves.push(JSON.parse(champion.exportJSON()));
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 18, term: "Champion" });
        const onChange = vi.fn();
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={onChange} />
            </MemoryRouter>
        );
        const add = await screen.findByRole("button", { name: "Add " + champion.getChassisName() + " " + champion.getModelName() }, { timeout: 20_000 });
        fireEvent.click(screen.getByRole("button", { name: "TRO " + champion.getChassisName() + " " + champion.getModelName() }));
        expect(screen.getByRole("heading", { name: /^Technical Readout: / })).toBeTruthy();
        fireEvent.click(screen.getAllByRole("button", { name: /^(Cancel|Close)$/ })[0]);
        fireEvent.click(add);
        expect(onChange).toHaveBeenCalledTimes(1);
        const group: BattleMechGroup = onChange.mock.calls[0][0];
        expect(group.members.map((member) => member.getName())).toContain(champion.getName());
    }, 30_000);

    // A design saved before it was named listed a blank name, its buttons read only "View", "TRO" and "Add".
    it("names a saved design that has no name yet", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.battleMechSaves.push(JSON.parse(new BattleMech().exportJSON()));
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={vi.fn()} />
            </MemoryRouter>
        );
        const add = await screen.findByRole("button", { name: "Add Unnamed design" }, { timeout: 20_000 });
        expect(add.closest("tr")?.textContent).toContain("Unnamed design");
        expect(screen.getByRole("button", { name: "TRO Unnamed design" })).toBeTruthy();
    }, 30_000);

    // #241: a 'Mech with nothing saved matches its bundled design, imported when a button is pressed.
    it("adds the bundled design for a MUL 'Mech, with nothing saved", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 18, term: "Atlas AS7-D" });
        const onChange = vi.fn();
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={onChange} />
            </MemoryRouter>
        );
        // The MUL row and the bundled list both offer it; either adds the same design.
        fireEvent.click((await screen.findAllByRole("button", { name: "Add Atlas AS7-D" }, { timeout: 20_000 }))[0]);
        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1), { timeout: 20_000 });
        const group: BattleMechGroup = onChange.mock.calls[0][0];
        expect(group.members.map((member) => member.getChassisName() + " " + member.getModelName())).toContain("Atlas AS7-D");
    }, 30_000);

    // #241 round 3: a 'Mech Skunk Werks has no file for comes from MegaMek's.
    it("adds the bundled MegaMek design for a MUL 'Mech, with nothing saved", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 18, term: "Albatross ALB-5W" });
        const onChange = vi.fn();
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={onChange} />
            </MemoryRouter>
        );
        fireEvent.click((await screen.findAllByRole("button", { name: "Add Albatross ALB-5W" }, { timeout: 20_000 }))[0]);
        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1), { timeout: 20_000 });
        const group: BattleMechGroup = onChange.mock.calls[0][0];
        expect(group.members.map((member) => [member.getChassisName() + " " + member.getModelName(), member.getBattleValue()])).toContainEqual(["Albatross ALB-5W", 2370]);
    }, 30_000);

    // #241: a canon 'Mech neither Skunk Werks nor MegaMek has a file for comes from mordel.net, linked to its page there.
    it("lists the bundled mordel.net design for a MUL 'Mech, its source linked to the unit's mordel page", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 18, term: "Dola DOL-1A2" });
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={vi.fn()} />
            </MemoryRouter>
        );
        const link = await screen.findByRole("link", { name: "mordel.net" }, { timeout: 20_000 });
        expect(link.getAttribute("href")).toBe("https://www.mordel.net/tro.php?a=vt&ut=bm&id=23454");
        expect(link.closest("tr")?.textContent).toContain("Dola");
    }, 30_000);

    it("views and adds the bundled MegaMek design for MUL battle armor, with nothing saved", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 22, term: "Achileus Light Battle Armor [David] (Sqd4)" });
        const onChange = vi.fn();
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={onChange} />
            </MemoryRouter>
        );
        fireEvent.click(await screen.findByRole("button", { name: "View Achileus Light Battle Armor [David] (Sqd4)" }, { timeout: 20_000 }));
        expect(await screen.findByRole("heading", { name: "Viewing Achileus Light Battle Armor [David](Sqd4)" }, { timeout: 20_000 })).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Add Achileus Light Battle Armor [David] (Sqd4)" }));
        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1), { timeout: 20_000 });
        const group: BattleMechGroup = onChange.mock.calls[0][0];
        expect(group.battleArmor.map((squad) => [squad.getName(), squad.getBattleValue()])).toEqual([["Achileus Light Battle Armor [David](Sqd4)", 189]]);
    }, 30_000);

    it("views and adds the bundled MegaMek design for a MUL combat vehicle, with nothing saved", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 19, term: "Donar Assault Helicopter (Close Support)" });
        const onChange = vi.fn();
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={onChange} />
            </MemoryRouter>
        );
        fireEvent.click(await screen.findByRole("button", { name: "View Donar Assault Helicopter (Close Support)" }, { timeout: 20_000 }));
        expect(await screen.findByRole("heading", { name: /^Viewing Donar Assault Helicopter/ }, { timeout: 20_000 })).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Add Donar Assault Helicopter (Close Support)" }));
        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1), { timeout: 20_000 });
        const group: BattleMechGroup = onChange.mock.calls[0][0];
        expect(group.vehicles.map((vehicle) => [vehicle.getName(), vehicle.getModel(), vehicle.getBattleValue()])).toEqual([["Donar Assault Helicopter", "(Close Support)", 582]]);
    }, 30_000);

    it("offers the creator for a MUL 'Mech with no Classic design", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 18, term: "Poseidon PSD-V2" });
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={vi.fn()} />
            </MemoryRouter>
        );
        await waitFor(() => expect(screen.getAllByText(/No Classic design yet/).length).toBeGreaterThan(0), { timeout: 20_000 });
        expect(screen.getAllByRole("link", { name: "build it" })[0].getAttribute("href")).toContain("/classic-battletech/mech-creator");
    }, 30_000);

    it("adds the bundled Classic design for an ArtVee found in the custom units, with nothing saved", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 19, term: "Falconet", sources: ["custom"] });
        const onChange = vi.fn();
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={onChange} />
            </MemoryRouter>
        );
        const add = await screen.findByRole("button", { name: /^Add Falconet ArtVee/ }, { timeout: 20_000 });
        fireEvent.click(add);
        const group: BattleMechGroup = onChange.mock.calls[0][0];
        expect(group.vehicles.map((vehicle) => vehicle.getName() + " " + vehicle.getModel())).toEqual(["Falconet ArtVee FLC-1"]);
    }, 30_000);

    // A MegaMek vehicle the MUL lacks is filed in the custom unit list, and is in the main search with it ticked.
    it("adds the bundled MegaMek design for a vehicle found in the custom units, with nothing saved", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 19, term: "Soarece Superheavy MBT", sources: ["mul2", "custom"] });
        const onChange = vi.fn();
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={onChange} />
            </MemoryRouter>
        );
        fireEvent.click(await screen.findByRole("button", { name: /^Add Soarece Superheavy MBT/ }, { timeout: 20_000 }));
        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1), { timeout: 20_000 });
        const group: BattleMechGroup = onChange.mock.calls[0][0];
        expect(group.vehicles.map((vehicle) => [vehicle.getName(), vehicle.getBattleValue()])).toEqual([["Soarece Superheavy MBT", 2466]]);
    }, 30_000);

    // The sample VTOLAMs were in the 'Mech Creator only, not the rosters (#376).
    it("adds the sample design for a VTOLAM found in the custom units, with nothing saved", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 18, term: "Spider VTOLAM", sources: ["custom"] });
        const onChange = vi.fn();
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={onChange} />
            </MemoryRouter>
        );
        const add = await screen.findByRole("button", { name: /^Add Spider VTOLAM/ }, { timeout: 20_000 });
        fireEvent.click(add);
        const group: BattleMechGroup = onChange.mock.calls[0][0];
        expect(group.members.map((member) => member.getName().trim())).toEqual(["Spider VTOLAM"]);
    }, 30_000);

    // #241: ArtVees and VTOLAMs are fan-made whatever their rules level; an official-units-only event ticks Canon alone.
    it("shows the ArtVees as fan-made and leaves them out when only Canon is ticked", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 19, term: "Falconet", sources: ["mul2", "custom"] });
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={vi.fn()} />
            </MemoryRouter>
        );
        const add = await screen.findByRole("button", { name: /^Add Falconet ArtVee/ }, { timeout: 20_000 });
        expect(add.closest("tr")!.querySelector(".unit-standing")!.textContent).toBe("Fan-made");
        for (const standing of ["apocryphal", "custom", "munchkin"]) {
            fireEvent.click(screen.getByRole("checkbox", { name: new RegExp("^\\W*" + { apocryphal: "Apocryphal", custom: "Fan-made", munchkin: "Munchkin" }[standing]) }));
        }
        expect(appGlobals.appSettings.cbtMULSearch.standings).toEqual(["canon"]);
        await waitFor(() => expect(screen.queryByRole("button", { name: /^Add Falconet ArtVee/ })).toBeNull(), { timeout: 20_000 });
        // The last standing ticked stays ticked.
        expect((screen.getByRole("checkbox", { name: /^\W*Canon/ }) as HTMLInputElement).disabled).toBe(true);
    }, 30_000);

    // Round 2: each other Classic type matches a saved design by name and lands in its own table in the group.
    const otherTypes: { label: string; type: number; saves: keyof IAppGlobals; table: keyof BattleMechGroup; make: (name: string, model: string) => { exportJSON(): string } }[] = [
        { label: "combat vehicle", type: 19, saves: "vehicleSaves", table: "vehicles", make: (name, model) => { const unit = new Vehicle(); unit.setName(name); unit.setModel(model); return unit; } },
        { label: "fighter", type: 17, saves: "fighterSaves", table: "fighters", make: (name, model) => { const unit = new AerospaceFighter(); unit.setName(name); unit.setModel(model); return unit; } },
        { label: "infantry platoon", type: 21, saves: "infantrySaves", table: "infantry", make: (name, model) => { const unit = new InfantryPlatoon(); unit.setName(name + " " + model); return unit; } },
        { label: "battle armor squad", type: 22, saves: "battleArmorSaves", table: "battleArmor", make: (name, model) => { const unit = new BattleArmor(); unit.setName(name + " " + model); return unit; } },
        { label: "ProtoMech point", type: 23, saves: "protoMechSaves", table: "protoMechs", make: (name, model) => { const unit = new ProtoMech(); unit.setName(name + " " + model); return unit; } },
        { label: "support vehicle", type: 24, saves: "vehicleSaves", table: "vehicles", make: (name, model) => { const unit = new Vehicle(); unit.setName(name); unit.setModel(model); return unit; } },
    ];
    for (const kind of otherTypes) {
        it("finds a saved " + kind.label + " on the MUL and adds it to the group's " + String(kind.table) + " table", async () => {
            const appGlobals = makeAppGlobals();
            const hit = (await searchBundledMUL(newMULSearchFilters({ type: kind.type }))).find((unit) => (unit.Variant ?? "").trim() !== "")!;
            const design = kind.make(hit.Name, hit.Variant ?? "");
            (appGlobals[kind.saves] as unknown[]).push(JSON.parse(design.exportJSON()));
            appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: kind.type, term: hit.Name + " " + hit.Variant });
            const onChange = vi.fn();
            render(
                <MemoryRouter>
                    <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={onChange} />
                </MemoryRouter>
            );
            const view = (await screen.findAllByRole("button", { name: "View " + getMULDisplayName(hit) }, { timeout: 20_000 }))[0];
            fireEvent.click(view);
            expect(screen.getByRole("heading", { name: /^Viewing / })).toBeTruthy();
            fireEvent.click(screen.getAllByRole("button", { name: /^(Cancel|Close)$/ })[0]);
            fireEvent.click((await screen.findAllByRole("button", { name: "TRO " + getMULDisplayName(hit) }))[0]);
            expect(screen.getByRole("heading", { name: /^Technical Readout: / })).toBeTruthy();
            fireEvent.click(screen.getAllByRole("button", { name: /^(Cancel|Close)$/ })[0]);
            const add = (await screen.findAllByRole("button", { name: "Add " + getMULDisplayName(hit) }, { timeout: 20_000 }))[0];
            fireEvent.click(add);
            expect(onChange).toHaveBeenCalledTimes(1);
            const group: BattleMechGroup = onChange.mock.calls[0][0];
            expect((group[kind.table] as unknown[]).length).toBe(1);
            expect(group.members.length).toBe(0);
        }, 30_000);
    }

    // The MUL files Small Craft and DropShips under type 17 with the fighters, as "Aerospace Craft".
    const largeCraftHit = async () => (await searchBundledMUL(newMULSearchFilters({ type: 17, term: "Foxhound Gunboat TIG-40" })))
        .find((unit) => unit.Name === "Foxhound Gunboat")!;
    it("finds a saved Small Craft on the MUL and adds it to the group's Small Craft table, not the fighters", async () => {
        const appGlobals = makeAppGlobals();
        const hit = await largeCraftHit();
        expect(hit.Class).toBe("Aerospace Craft");
        const craft = new SmallCraft();
        craft.setName(hit.Name);
        craft.setModel(hit.Variant ?? "");
        (appGlobals.smallCraftSaves as unknown[]).push(JSON.parse(craft.exportJSON()));
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 17, term: hit.Name + " " + hit.Variant });
        const onChange = vi.fn();
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={onChange} />
            </MemoryRouter>
        );
        fireEvent.click((await screen.findAllByRole("button", { name: "View " + getMULDisplayName(hit) }, { timeout: 20_000 }))[0]);
        expect(screen.getByRole("heading", { name: /^Viewing Foxhound Gunboat/ })).toBeTruthy();
        fireEvent.click(screen.getAllByRole("button", { name: /^(Cancel|Close)$/ })[0]);
        fireEvent.click((await screen.findAllByRole("button", { name: "TRO " + getMULDisplayName(hit) }))[0]);
        expect(screen.getByRole("heading", { name: /^Technical Readout: / })).toBeTruthy();
        fireEvent.click(screen.getAllByRole("button", { name: /^(Cancel|Close)$/ })[0]);
        fireEvent.click((await screen.findAllByRole("button", { name: "Add " + getMULDisplayName(hit) }))[0]);
        const group: BattleMechGroup = onChange.mock.calls[0][0];
        expect(group.smallCraft.map((unit) => unit.getName() + " " + unit.getModel())).toEqual(["Foxhound Gunboat TIG-40"]);
        expect(group.fighters.length).toBe(0);
    }, 30_000);

    it("sends a MUL Small Craft with no Classic design to the Small Craft Creator", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 17, term: "Foxhound Gunboat TIG-40" });
        const { container } = render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={vi.fn()} />
            </MemoryRouter>
        );
        await screen.findAllByText(/No Classic design yet/, undefined, { timeout: 20_000 });
        const links = Array.from(container.querySelectorAll("a")).map((link) => link.getAttribute("href") ?? "");
        expect(links.some((href) => href.endsWith("/small-craft-creator"))).toBe(true);
        expect(links.some((href) => href.endsWith("/fighter-creator"))).toBe(false);
    }, 30_000);

    // JumpShips, WarShips and stations are type 17 "Aerospace Craft" too; they go to the capital ship table.
    const capitalShipHit = async () => (await searchBundledMUL(newMULSearchFilters({ type: 17, term: "Essex Destroyer" })))
        .find((unit) => (unit.Variant ?? "").trim() !== "")!;
    it("finds a saved WarShip on the MUL and adds it to the group's capital ship table, not the Small Craft", async () => {
        const appGlobals = makeAppGlobals();
        const hit = await capitalShipHit();
        const ship = new CapitalShip();
        ship.setName(hit.Name);
        ship.setModel(hit.Variant ?? "");
        (appGlobals.capitalShipSaves as unknown[]).push(JSON.parse(ship.exportJSON()));
        // A Small Craft saved under the same name must not be the match.
        const lookalike = new SmallCraft();
        lookalike.setName(hit.Name);
        lookalike.setModel(hit.Variant ?? "");
        (appGlobals.smallCraftSaves as unknown[]).push(JSON.parse(lookalike.exportJSON()));
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 17, term: hit.Name + " " + hit.Variant });
        const onChange = vi.fn();
        render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={onChange} />
            </MemoryRouter>
        );
        fireEvent.click((await screen.findAllByRole("button", { name: "View " + getMULDisplayName(hit) }, { timeout: 20_000 }))[0]);
        expect(screen.getByRole("heading", { name: /^Viewing Essex Destroyer/ })).toBeTruthy();
        fireEvent.click(screen.getAllByRole("button", { name: /^(Cancel|Close)$/ })[0]);
        fireEvent.click((await screen.findAllByRole("button", { name: "TRO " + getMULDisplayName(hit) }))[0]);
        expect(screen.getByRole("heading", { name: /^Technical Readout: Essex Destroyer/ })).toBeTruthy();
        fireEvent.click(screen.getAllByRole("button", { name: /^(Cancel|Close)$/ })[0]);
        fireEvent.click((await screen.findAllByRole("button", { name: "Add " + getMULDisplayName(hit) }))[0]);
        const group: BattleMechGroup = onChange.mock.calls[0][0];
        expect(group.capitalShips.map((unit) => unit.getName() + " " + unit.getModel())).toEqual([hit.Name + " " + hit.Variant]);
        expect(group.smallCraft.length).toBe(0);
    }, 30_000);

    it("sends a MUL JumpShip with no Classic design to the Capital Ship Creator", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 17, term: "Magellan JumpShip" });
        const { container } = render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={vi.fn()} />
            </MemoryRouter>
        );
        await screen.findAllByText(/No Classic design yet/, undefined, { timeout: 20_000 });
        const links = Array.from(container.querySelectorAll("a")).map((link) => link.getAttribute("href") ?? "");
        expect(links.some((href) => href.endsWith("/capital-ship-creator"))).toBe(true);
        expect(links.some((href) => href.endsWith("/small-craft-creator"))).toBe(false);
    }, 30_000);
    // Issue 322: the Type list showed Aerospace three times (fighters, Small Craft and capital ships share MUL type 17).
    it("gives every unit type its own option, each aerospace kind included", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 1705, term: "Magellan JumpShip" });
        const { container } = render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={vi.fn()} />
            </MemoryRouter>
        );
        const typeSelect = Array.from(container.querySelectorAll("select")).find((select) => select.parentElement?.textContent?.startsWith("Type:"))!;
        const labels = Array.from(typeSelect.options).map((option) => option.text);
        expect(labels).toEqual(["All", "BattleMech", "IndustrialMech", "Combat Vehicle", "Support Vehicle", "Aerospace Fighter", "Conventional Fighter", "Small Craft", "DropShip", "JumpShip", "WarShip", "Space Station", "Infantry", "Battle Armor", "ProtoMech"]);
        await screen.findAllByText(/No Classic design yet/, undefined, { timeout: 20_000 });
        fireEvent.change(typeSelect, { target: { value: "1706" } });
        await screen.findByText("No units match your filters.", undefined, { timeout: 20_000 });
    }, 30_000);

    // Issue 325: the results pager sits above and below the list.
    it("puts the results pager above and below the list", async () => {
        const appGlobals = makeAppGlobals();
        appGlobals.appSettings.cbtMULSearch = newMULSearchFilters({ type: 18, term: "" });
        const { container } = render(
            <MemoryRouter>
                <BattleMechAddMechDialog appGlobals={appGlobals} currentForce={appGlobals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={vi.fn()} />
            </MemoryRouter>
        );
        const mulSearch = () => Array.from(container.querySelectorAll("fieldset")).find((fieldset) => fieldset.querySelector("legend")?.textContent === "Find Units")!;
        const pagers = () => Array.from(mulSearch().querySelectorAll("nav[aria-label^='Search results pages']"));
        await waitFor(() => expect(pagers()).toHaveLength(2), { timeout: 20_000 });
        fireEvent.click(pagers()[1].querySelector("[title='Next page']")!);
        expect(pagers().map((pager) => pager.textContent)).toEqual([expect.stringContaining("Page 2 of"), expect.stringContaining("Page 2 of")]);
    }, 30_000);
});
