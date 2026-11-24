// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AlphaStrikeUnit, IASMULUnit } from "../../../classes/alpha-strike-unit";
import { IAppGlobals } from "../../app-router";
import AlphaStrikePrintUnitSVG from "./alpha-strike-print-unit";
import AlphaStrikeUnitSVG from "./alpha-strike-unit-svg";

afterEach(cleanup);

function unit(type: string): AlphaStrikeUnit {
    const rv = new AlphaStrikeUnit();
    rv.importMUL({
        Id: 0, Name: "Test", Variant: "T-1", Class: "Test", Tonnage: 20, BFType: type, BFSize: 1, BFMove: "8\"",
        BFArmor: 2, BFStructure: 1, BFPointValue: 10, BFAbilities: "", BFDamageShort: 1, BFDamageMedium: 1,
        BFDamageLong: 0, BFDamageExtreme: 0, BFOverheat: 0, BFTMM: 1,
        Role: { Id: 110, Name: "Brawler", Image: null, SortOrder: 0 },
        Type: { Id: 18, Name: "Test", Image: null, SortOrder: 0 },
    } as unknown as IASMULUnit);
    return rv;
}

const appGlobals = {} as IAppGlobals;
const heatShown = (asUnit: AlphaStrikeUnit): boolean[] => {
    const screenCard = render(<AlphaStrikeUnitSVG asUnit={asUnit} appGlobals={appGlobals} measurementsInHexes={false} />);
    const onScreen = !!screen.queryByText(/HEAT SCALE/i);
    screenCard.unmount();
    render(<AlphaStrikePrintUnitSVG asUnit={asUnit} appGlobals={appGlobals} measurementsInHexes={false} />);
    const printed = !!screen.queryByText(/^OV:/);
    cleanup();
    return [onScreen, printed];
};

// A Micro-Mech has no Heat Scale and no Overheat: its card leaves them off, as an official vehicle card does.
describe("Alpha Strike cards: heat scale", () => {
    it("shows the heat scale and OV for a BattleMech", () => {
        expect(heatShown(unit("BM"))).toEqual([true, true]);
    });

    it("leaves the heat scale and OV off a Micro-Mech, on screen and in print", () => {
        expect(heatShown(unit("MM"))).toEqual([false, false]);
    });
});
