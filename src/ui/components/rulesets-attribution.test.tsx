import React, { type JSX } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AerospaceFighter from "../../classes/aerospace-fighter";
import { AlphaStrikeUnit } from "../../classes/alpha-strike-unit";
import BattleArmor from "../../classes/battle-armor";
import { BattleMech } from "../../classes/battlemech";
import Building from "../../classes/building";
import CapitalShip from "../../classes/capital-ship";
import InfantryPlatoon from "../../classes/infantry-platoon";
import ProtoMech from "../../classes/protomech";
import SmallCraft from "../../classes/small-craft";
import { TechnicalReadout } from "../../classes/technical-readout";
import { IGameSettingsUnit } from "../../classes/unit-game-settings";
import Vehicle from "../../classes/vehicle";
import { ITroUnitAdapter } from "../../data/technical-readout-interfaces";
import type { IAppGlobals } from "../app-router";
import CapitalShipAlphaStrikeCard from "./capital-ship-as-card";
import { RulesetsAttribution, rulesetsAttributionSvg } from "./rulesets-attribution";
import SmallCraftAlphaStrikeCard from "./small-craft-as-card";
import AlphaStrikePrintUnitSVG from "./svg/alpha-strike-print-unit";
import AlphaStrikeUnitSVG from "./svg/alpha-strike-unit-svg";
import BattleArmorRecordSheetSVG from "./svg/battle-armor-record-sheet-svg";
import BattledroidsMechRecordSheetSVG from "./svg/battledroids-mech-record-sheet-svg";
import BattleMechSVG from "./svg/battlemech-svg";
import BuildingRecordSheetSVG from "./svg/building-record-sheet-svg";
import CapitalShipRecordSheetSVG from "./svg/capital-ship-record-sheet-svg";
import DropShipRecordSheetSVG from "./svg/dropship-record-sheet-svg";
import FighterRecordSheetSVG from "./svg/fighter-record-sheet-svg";
import InfantryRecordSheetSVG, { infantrySheetLines } from "./svg/infantry-record-sheet-svg";
import ProtoMechRecordSheetSVG, { protoMechSheetUnits } from "./svg/protomech-record-sheet-svg";
import { sheetFooter } from "./svg/record-sheet-svg-kit";
import SmallCraftRecordSheetSVG from "./svg/small-craft-record-sheet-svg";
import VehicleRecordSheetSVG from "./svg/vehicle-record-sheet-svg";
import TechnicalReadoutSheet from "./technical-readout-sheet";

const CREDIT = "Special Rulesets: Sample: The Clans never existed (alternate universe), Sample ruleset (#324)";
const RULESETS = ["sample-no-clans"];
// Rendered markup puts an apostrophe in as &#x27; and an ampersand as &amp;.
const markup = (element: JSX.Element) => renderToStaticMarkup(element).replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

const withRulesets = <T extends IGameSettingsUnit>(unit: T, rulesets = RULESETS): T => {
    unit.gameSettings.set(4, rulesets);
    return unit;
};

describe("ruleset attribution (#324 round 5)", () => {
    it("draws nothing for a unit with no rulesets", () => {
        expect(markup(<svg>{rulesetsAttributionSvg(0, 0, [])}</svg>)).not.toContain("Special Rulesets");
        expect(markup(<div><RulesetsAttribution rulesets={[]} /></div>)).toBe("<div></div>");
        expect(markup(<svg>{sheetFooter("Tables: TW p.1.")}</svg>)).not.toContain("Special Rulesets");
    });

    it("squeezes a line longer than its room, and leaves a short one alone", () => {
        expect(markup(<svg>{rulesetsAttributionSvg(0, 0, RULESETS, { maxWidth: 200 })}</svg>)).toContain('textLength="200"');
        expect(markup(<svg>{rulesetsAttributionSvg(0, 0, RULESETS, { maxWidth: 1600 })}</svg>)).not.toContain("textLength");
    });

    it("puts the credit in the shared sheet footer", () => {
        expect(markup(<svg>{sheetFooter("Tables: TW p.1.", RULESETS)}</svg>)).toContain(CREDIT);
    });

    it("credits each ruleset once on a sheet of several units", () => {
        const squads = [withRulesets(new BattleArmor()), withRulesets(new BattleArmor())];
        const sheet = markup(<BattleArmorRecordSheetSVG squads={squads} />);
        expect(sheet.split(CREDIT)).toHaveLength(2);
    });

    const sheets: [string, (rulesets: string[]) => JSX.Element][] = [
        ["Combat Vehicle", (rulesets) => <VehicleRecordSheetSVG vehicle={withRulesets(new Vehicle(), rulesets)} />],
        ["aerospace fighter", (rulesets) => <FighterRecordSheetSVG fighter={withRulesets(new AerospaceFighter(), rulesets)} />],
        ["Small Craft", (rulesets) => <SmallCraftRecordSheetSVG craft={withRulesets(new SmallCraft(), rulesets)} />],
        ["DropShip", (rulesets) => <DropShipRecordSheetSVG craft={withRulesets(new SmallCraft(), rulesets)} />],
        ["capital ship", (rulesets) => <CapitalShipRecordSheetSVG ship={withRulesets(new CapitalShip(), rulesets)} />],
        ["building", (rulesets) => <BuildingRecordSheetSVG building={withRulesets(new Building(), rulesets)} />],
        ["battle armor", (rulesets) => <BattleArmorRecordSheetSVG squads={[withRulesets(new BattleArmor(), rulesets)]} />],
        ["infantry", (rulesets) => <InfantryRecordSheetSVG lines={infantrySheetLines([withRulesets(new InfantryPlatoon(), rulesets)])} />],
        ["ProtoMech", (rulesets) => <ProtoMechRecordSheetSVG units={protoMechSheetUnits([withRulesets(new ProtoMech(), rulesets)])} />],
        ["BattleMech", (rulesets) => {
            const mech = new BattleMech();
            mech.applyGameSettings({ ...mech.getGameSettings(2), rulesets });
            return <BattleMechSVG mechData={mech} />;
        }],
        ["Battledroids droid", (rulesets) => {
            const mech = new BattleMech();
            mech.applyGameSettings({ ...mech.getGameSettings(2), rulesets });
            return <BattledroidsMechRecordSheetSVG mechData={mech} />;
        }],
    ];

    it.each(sheets)("credits the rulesets on the %s sheet, and nothing without them", (_name, sheet) => {
        expect(markup(sheet(RULESETS))).toContain(CREDIT);
        expect(markup(sheet([]))).not.toContain("Special Rulesets");
    });

    it("credits them in the TRO sheet's footer, linking a source that has an address", () => {
        const adapter: ITroUnitAdapter = {
            getComponentRows: () => [],
            getEquipmentCopies: () => [],
            getKnownEquipmentUuids: () => [],
            getKnownEquipmentTags: () => [],
            ensureEquipmentUuid: (copy) => copy.uuid,
            getSpecValues: () => ({ title: "Archer", subtitle: "", mass: "70 tons", cruisingSpeed: "", armorType: "" }),
            getConstructionRows: () => [],
        };
        const tro = markup(<TechnicalReadoutSheet tro={new TechnicalReadout()} adapter={adapter} rulesets={RULESETS} />);
        expect(tro).toContain('data-testid="rulesets-attribution"');
        expect(tro.replace(/<[^>]+>/g, "")).toContain(CREDIT);
        expect(markup(<TechnicalReadoutSheet tro={new TechnicalReadout()} adapter={adapter} />)).not.toContain("Special Rulesets");
    });

    describe("Alpha Strike cards", () => {
        const appGlobals = { appSettings: {} } as unknown as IAppGlobals;
        const card = (rulesets: string[]): AlphaStrikeUnit => {
            const unit = new AlphaStrikeUnit();
            unit.name = "Atlas";
            unit.type = "BM";
            unit.rulesets = rulesets;
            return unit;
        };

        it("carries a Classic design's rulesets onto its card, and none from a design without", () => {
            const vehicle = withRulesets(new Vehicle());
            expect(vehicle.getAlphaStrikeUnit().rulesets).toEqual(RULESETS);
            expect(new Vehicle().getAlphaStrikeUnit().rulesets).toEqual([]);
            for (const unit of [new AerospaceFighter(), new BattleArmor(), new InfantryPlatoon(), new ProtoMech()]) {
                expect(withRulesets(unit).getAlphaStrikeUnit().rulesets, unit.constructor.name).toEqual(RULESETS);
            }
            const mech = new BattleMech();
            mech.applyGameSettings({ ...mech.getGameSettings(2), rulesets: RULESETS });
            expect(mech.getAlphaStrikeForceStats().rulesets).toEqual(RULESETS);
        });

        it("credits them on the card and the printed card, and nothing on a card without", () => {
            for (const render of [
                (unit: AlphaStrikeUnit) => <AlphaStrikeUnitSVG asUnit={unit} appGlobals={appGlobals} measurementsInHexes={false} />,
                (unit: AlphaStrikeUnit) => <AlphaStrikePrintUnitSVG asUnit={unit} appGlobals={appGlobals} measurementsInHexes={false} />,
            ]) {
                expect(markup(render(card(RULESETS)))).toContain(CREDIT);
                expect(markup(render(card([])))).not.toContain("Special Rulesets");
            }
        });

        it("credits them on the Small Craft and capital ship cards", () => {
            const strip = (element: JSX.Element) => markup(element).replace(/<[^>]+>/g, "");
            expect(strip(<SmallCraftAlphaStrikeCard craft={withRulesets(new SmallCraft())} />)).toContain(CREDIT);
            expect(strip(<CapitalShipAlphaStrikeCard ship={withRulesets(new CapitalShip())} />)).toContain(CREDIT);
            expect(strip(<SmallCraftAlphaStrikeCard craft={new SmallCraft()} />)).not.toContain("Special Rulesets");
        });
    });
});
