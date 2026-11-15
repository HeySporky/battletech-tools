// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import AerospaceFighter from "../../classes/aerospace-fighter";
import BattleArmor from "../../classes/battle-armor";
import Building from "../../classes/building";
import { BattleMech } from "../../classes/battlemech";
import CapitalShip from "../../classes/capital-ship";
import InfantryPlatoon from "../../classes/infantry-platoon";
import ProtoMech from "../../classes/protomech";
import SmallCraft from "../../classes/small-craft";
import { getUnitTroAdapter } from "../../classes/unit-tro";
import Vehicle from "../../classes/vehicle";
import type { IAppGlobals } from "../app-router";
import BattleArmorCreatorLoadouts from "../pages/classic-battletech/battle-armor-creator/loadouts";
import BattleArmorCreatorSummary from "../pages/classic-battletech/battle-armor-creator/summary";
import BuildingCreatorEquipment from "../pages/classic-battletech/building-creator/equipment";
import BuildingCreatorSummary from "../pages/classic-battletech/building-creator/summary";
import CapitalShipCreatorCrew from "../pages/classic-battletech/capital-ship-creator/crew";
import CapitalShipCreatorSummary from "../pages/classic-battletech/capital-ship-creator/summary";
import {
    BATTLE_ARMOR_TRO, BUILDING_TRO, CAPITAL_SHIP_TRO, CREATOR_TRO_CONFIGS, FIGHTER_TRO, INFANTRY_TRO, MECH_TRO, PROTOMECH_TRO, SMALL_CRAFT_TRO, VEHICLE_TRO, WALKER_TRO,
} from "../pages/classic-battletech/creator-tro-configs";
import FighterCreatorEquipment from "../pages/classic-battletech/fighter-creator/equipment";
import FighterCreatorSummary from "../pages/classic-battletech/fighter-creator/summary";
import InfantryCreatorSummary from "../pages/classic-battletech/infantry-creator/summary";
import InfantryCreatorWeapons from "../pages/classic-battletech/infantry-creator/weapons";
import MechCreatorStep6 from "../pages/classic-battletech/mech-creator/step6";
import MechCreatorSummary from "../pages/classic-battletech/mech-creator/summary";
import ProtoMechCreatorEquipment from "../pages/classic-battletech/protomech-creator/equipment";
import ProtoMechCreatorSummary from "../pages/classic-battletech/protomech-creator/summary";
import SmallCraftCreatorCrew from "../pages/classic-battletech/small-craft-creator/crew";
import SmallCraftCreatorSummary from "../pages/classic-battletech/small-craft-creator/summary";
import VehicleCreatorEquipmentPlacement from "../pages/classic-battletech/vehicle-creator/equipment-placement";
import VehicleCreatorSummary from "../pages/classic-battletech/vehicle-creator/summary";
import WalkerCreatorCriticals from "../pages/classic-battletech/walker-creator/criticals";
import WalkerCreatorSummary from "../pages/classic-battletech/walker-creator/summary";
import Walker from "../../classes/walker";
import { CreatorPrintTRO, CreatorTechnicalReadoutStep, type ICreatorTroConfig, troStepPath } from "./creator-tro-pages";
import TechnicalReadoutSheet from "./technical-readout-sheet";

afterEach(cleanup);

type Page = ComponentType<{ appGlobals: IAppGlobals }>;
type TroUnit = { tro: { getProduction(field: string): string } };

const creators: [ICreatorTroConfig, () => TroUnit, Page, Page][] = [
    [MECH_TRO, () => new BattleMech(), MechCreatorStep6, MechCreatorSummary],
    [VEHICLE_TRO, () => new Vehicle(), VehicleCreatorEquipmentPlacement, VehicleCreatorSummary],
    [FIGHTER_TRO, () => new AerospaceFighter(), FighterCreatorEquipment, FighterCreatorSummary],
    [INFANTRY_TRO, () => new InfantryPlatoon(), InfantryCreatorWeapons, InfantryCreatorSummary],
    [BATTLE_ARMOR_TRO, () => new BattleArmor(), BattleArmorCreatorLoadouts, BattleArmorCreatorSummary],
    [PROTOMECH_TRO, () => new ProtoMech(), ProtoMechCreatorEquipment, ProtoMechCreatorSummary],
    [SMALL_CRAFT_TRO, () => new SmallCraft(), SmallCraftCreatorCrew, SmallCraftCreatorSummary],
    [CAPITAL_SHIP_TRO, () => new CapitalShip(), CapitalShipCreatorCrew, CapitalShipCreatorSummary],
    [BUILDING_TRO, () => new Building(), BuildingCreatorEquipment, BuildingCreatorSummary],
    [WALKER_TRO, () => new Walker(), WalkerCreatorCriticals, WalkerCreatorSummary],
];

const makeGlobals = (config: ICreatorTroConfig, unit: TroUnit) => ({
    appSettings: { developerMenu: false, uiTheme: "", equipmentFilter: "", installEquipCategory: "", mechRulesFilter: "" },
    [config.current]: unit,
    [config.save]: vi.fn(),
    makeDocumentTitle: vi.fn(),
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
    siteAlerts: { activeAlerts: [] },
} as unknown as IAppGlobals);

const hrefs = () => screen.getAllByRole("link").map((link) => link.getAttribute("href") ?? "");
const linksTo = (config: ICreatorTroConfig, route: string) => hrefs().some((href) => href.endsWith(`/${config.creator}/${route}`));

describe("Technical Readout step and printed TRO sheet, shared by every creator (#78)", () => {
    it("covers every creator config", () => {
        expect(creators.map(([config]) => config)).toEqual(CREATOR_TRO_CONFIGS);
    });

    describe.each(creators)("$name", (config, makeUnit, PreviousStep, Summary) => {
        it("edits the unit's TRO record and saves the unit", () => {
            const unit = makeUnit();
            const globals = makeGlobals(config, unit);
            render(<MemoryRouter><CreatorTechnicalReadoutStep appGlobals={globals} config={config} /></MemoryRouter>);
            expect(screen.getByText(`Step ${config.step}: Technical Readout (optional)`)).toBeTruthy();
            fireEvent.change(screen.getByLabelText("Manufacturer"), { target: { value: "Coventry Metal Works" } });
            expect(unit.tro.getProduction("manufacturer")).toBe("Coventry Metal Works");
            expect(globals[config.save]).toHaveBeenCalledWith(unit);
            expect(globals.makeDocumentTitle).toHaveBeenCalledWith(`Step ${config.step} | ${config.name}`);
        });

        it("links back to the previous step, on to Summary, and to the printed TRO sheet", () => {
            render(<MemoryRouter><CreatorTechnicalReadoutStep appGlobals={makeGlobals(config, makeUnit())} config={config} /></MemoryRouter>);
            expect(linksTo(config, config.previous)).toBe(true);
            expect(linksTo(config, "summary")).toBe(true);
            expect(linksTo(config, "print-tro")).toBe(true);
        });

        it("has a side menu entry between the previous step and Summary", () => {
            const { SideMenu } = config;
            render(<MemoryRouter><SideMenu appGlobals={makeGlobals(config, makeUnit())} current={troStepPath(config)} /></MemoryRouter>);
            const links = hrefs();
            const previous = links.findIndex((href) => href.endsWith(`/${config.previous}`));
            const tro = links.findIndex((href) => href.endsWith(`/${troStepPath(config)}`));
            const summary = links.findIndex((href) => href.endsWith("/summary"));
            expect(tro).toBeGreaterThan(previous);
            expect(tro).toBeLessThan(summary);
            expect(screen.getAllByRole("link")[tro].className).toContain("btn-primary");
        });

        it("the previous step leads on to the Technical Readout step", () => {
            render(<MemoryRouter><PreviousStep appGlobals={makeGlobals(config, makeUnit())} /></MemoryRouter>);
            expect(linksTo(config, troStepPath(config))).toBe(true);
        });

        it("the summary offers the printed TRO sheet", () => {
            render(<MemoryRouter><Summary appGlobals={makeGlobals(config, makeUnit())} /></MemoryRouter>);
            expect(linksTo(config, "print-tro")).toBe(true);
        });

        it("prints the TRO sheet with a way back to the step", () => {
            const globals = makeGlobals(config, makeUnit());
            const { container } = render(<MemoryRouter><CreatorPrintTRO appGlobals={globals} config={config} /></MemoryRouter>);
            expect(linksTo(config, troStepPath(config))).toBe(true);
            expect(container.querySelector(".print-page .tro-sheet")).not.toBeNull();
            expect(globals.makeDocumentTitle).toHaveBeenCalledWith(`Technical Readout | ${config.name}`);
        });

        it("the print guard checks the design's own rules level, not the app-wide one (#324)", () => {
            const unit = makeUnit() as unknown as { getRequiredRulesLevel(): number; gameSettings?: { set(level: number, rulesets: string[]): void } };
            if (unit.gameSettings) unit.gameSettings.set(4, []);
            else { const mech = unit as unknown as BattleMech; mech.applyGameSettings({ ...mech.getGameSettings(0), rulesLevel: 4 }); }
            vi.spyOn(unit, "getRequiredRulesLevel").mockReturnValue(3);
            const globals = makeGlobals(config, unit as unknown as TroUnit);
            globals.appSettings.mechRulesFilter = 0;
            const confirm = vi.fn(() => false);
            window.confirm = confirm;
            const print = vi.fn();
            window.print = print;
            render(<MemoryRouter><CreatorPrintTRO appGlobals={globals} config={config} /></MemoryRouter>);
            fireEvent.click(screen.getByRole("button", { name: /Print/ }));
            expect(confirm).not.toHaveBeenCalled();
            expect(print).toHaveBeenCalled();
            });
    });
});

describe("Technical Readout sheet: construction tables", () => {
    const sheetText = (unit: Parameters<typeof getUnitTroAdapter>[0]) =>
        render(<TechnicalReadoutSheet tro={unit.tro} adapter={getUnitTroAdapter(unit)} />).container.textContent ?? "";

    it("Vehicle: control systems, turret, armor by location and ammunition", () => {
        const vehicle = new Vehicle();
        vehicle.setTonnage(25);
        vehicle.setEngineType("ice");
        vehicle.setCruiseMP(4);
        vehicle.setArmorAllocation("front", 16);
        vehicle.addEquipmentFromTag("autocannon-standard-b");
        vehicle.setEquipmentLocation(vehicle.getEquipmentList().at(-1)!.uuid!, "turret");
        vehicle.addEquipmentFromTag("ammo-ac-5-standard");
        const text = sheetText(vehicle);
        expect(text).toContain("Control Systems");
        expect(text).toContain("Internal Structure / Armor by location");
        expect(text).toContain("3 / 16");
        expect(text).toContain("AC/5 - Standard Ammo");
        expect(text).toContain("Body");
    });

    it("Fighter: cockpit, fuel, heat sinks, armor by arc and ammunition", () => {
        const fighter = new AerospaceFighter();
        fighter.setTonnage(50);
        fighter.setSafeThrust(5);
        fighter.setArmorAllocation("nose", 30);
        fighter.addEquipmentFromTag("lrm-10", "nose");
        fighter.addEquipmentFromTag("ammo-lrm-standard");
        const text = sheetText(fighter);
        expect(text).toContain("Cockpit and Controls");
        expect(text).toContain("Fuel (");
        expect(text).toContain("Heat Sinks (");
        expect(text).toContain("Armor by location");
        expect(text).toContain("Fuselage");
    });

    it("Small Craft: thrust, armor by side and the weapons by arc", () => {
        const craft = new SmallCraft();
        craft.setTonnage(200);
        craft.setSafeThrust(4);
        craft.setArmorTons(36);
        craft.setArmorAllocation("nose", 183);
        craft.addEquipmentFromTag("large-laser", "nose");
        const text = sheetText(craft);
        expect(text).toContain("Safe Thrust");
        expect(text).toContain("Armor by location");
        expect(text).toContain("183");
        expect(text).toContain("Large Laser");
        expect(text).toContain("Nose");
    });

    it("Building: no mass line, the superstructure and size, and the weapons by hex", () => {
        const building = new Building();
        building.setClassification("fortress");
        building.setHexes(2);
        building.addEquipmentFromTag("medium-laser", 2);
        const text = sheetText(building);
        expect(text).not.toContain("Mass:");
        expect(text).toContain("Superstructure (");
        expect(text).toContain("2 hexes, 1 level");
        expect(text).toContain("Hex 2");
    });
});
