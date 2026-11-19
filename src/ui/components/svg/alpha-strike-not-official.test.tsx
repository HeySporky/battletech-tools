// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AlphaStrikeUnit, IASMULUnit, MULSource } from "../../../classes/alpha-strike-unit";
import { IAppGlobals } from "../../app-router";
import AlphaStrikePrintUnitSVG from "./alpha-strike-print-unit";
import AlphaStrikeUnitSVG from "./alpha-strike-unit-svg";

afterEach(cleanup);

function unit(id: number, source: MULSource | undefined): AlphaStrikeUnit {
    const rv = new AlphaStrikeUnit();
    rv.importMUL({
        Id: id, Name: "Thug", Variant: "THG-10E", Class: "BattleMech", Tonnage: 80, BFType: "BM", BFSize: 4, BFMove: "8\"",
        BFArmor: 8, BFStructure: 6, BFPointValue: 39, BFAbilities: "SRM 1/1", BFDamageShort: 3, BFDamageMedium: 3,
        BFDamageLong: 2, BFDamageExtreme: 0, BFOverheat: 1, BFTMM: 1, MulSource: source,
        Role: { Id: 110, Name: "Brawler", Image: null, SortOrder: 0 },
        Type: { Id: 18, Name: "BattleMech", Image: null, SortOrder: 0 },
    } as unknown as IASMULUnit);
    return rv;
}

const appGlobals = {} as IAppGlobals;
const marked = (asUnit: AlphaStrikeUnit): boolean[] => {
    const screenCard = render(<AlphaStrikeUnitSVG asUnit={asUnit} appGlobals={appGlobals} measurementsInHexes={false} />);
    const onScreen = !!screen.queryByTestId("not-official");
    screenCard.unmount();
    render(<AlphaStrikePrintUnitSVG asUnit={asUnit} appGlobals={appGlobals} measurementsInHexes={false} />);
    const printed = !!screen.queryByTestId("not-official");
    cleanup();
    return [onScreen, printed];
};

// Players can tell a card with official MUL 2.0 stats from one built from any other source.
describe("Alpha Strike cards: Not Official", () => {
    it("leaves MUL 2.0 cards unmarked", () => {
        expect(marked(unit(5011, "mul2"))).toEqual([false, false]);
    });

    it("marks MUL 1.0, custom-list and creator cards on screen and in print", () => {
        expect(marked(unit(5011, "mul1"))).toEqual([true, true]);
        expect(marked(unit(910003, "custom"))).toEqual([true, true]);
        expect(marked(unit(0, undefined))).toEqual([true, true]);
    });

    it("keeps the source through a save, and reads an older save by its MUL id", () => {
        const saved = unit(5011, "mul1").export();
        const reloaded = new AlphaStrikeUnit();
        reloaded.importUnit(saved);
        expect(reloaded.isOfficial()).toBe(false);
        const older = new AlphaStrikeUnit();
        older.importUnit({ ...unit(5011, "mul2").export(), mulSource: undefined });
        expect(older.isOfficial()).toBe(true);
        const olderBuilt = new AlphaStrikeUnit();
        olderBuilt.importUnit({ ...unit(0, undefined).export(), mulSource: undefined });
        expect(olderBuilt.isOfficial()).toBe(false);
    });
});
