// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AlphaStrikeUnit, IASMULUnit } from "../../../classes/alpha-strike-unit";
import { IAppGlobals } from "../../app-router";
import AlphaStrikePrintUnitSVG from "./alpha-strike-print-unit";
import AlphaStrikeUnitSVG from "./alpha-strike-unit-svg";

afterEach(cleanup);

function largeCraft(type: string, arcs: Record<string, unknown> | undefined): AlphaStrikeUnit {
    const unit = new AlphaStrikeUnit();
    unit.importMUL({
        Id: 1, Name: "Overlord", Variant: "(Vehicle)", Class: "Aerospace Craft", Tonnage: 9700, BFType: type,
        BFSize: 2, BFMove: "3p", BFArmor: 26, BFStructure: 9, BFPointValue: 69, BFAbilities: "TH 3",
        BFDamageShort: 0, BFDamageMedium: 0, BFDamageLong: 0, BFDamageExtreme: 0, BFOverheat: 0, BFTMM: 0,
        Role: { Id: 1, Name: "None", Image: null, SortOrder: 0 },
        Type: { Id: 17, Name: "Aerospace Craft", Image: null, SortOrder: 7 },
        BFArcs: arcs,
    } as unknown as IASMULUnit);
    return unit;
}

const appGlobals = {} as IAppGlobals;
const arcs = {
    front: { std: ["8", "9", "4", ""] },
    rear: { std: ["5", "6", "3", ""], spe: "PNT1" },
    left: { std: ["3", "3", "2", ""] },
    right: { std: ["3", "3", "2", ""] },
};

describe("a large craft's Alpha Strike card (#32)", () => {
    it("adds the card back with each arc's damage, and sends the front's damage line there", () => {
        render(<AlphaStrikeUnitSVG asUnit={largeCraft("DS", arcs)} appGlobals={appGlobals} measurementsInHexes={false} />);
        expect(screen.getByTestId("as-card-damage-by-arc").textContent).toContain("SEE CARD BACK");
        const back = screen.getByTestId("alpha-strike-card-back");
        expect(back.textContent).toContain("NOSE ARC");
        expect(back.textContent).toContain("RIGHT WING");
        expect(back.textContent).not.toMatch(/STDCAP/); // DropShips have no capital column
        expect(screen.getByTestId("arc-front").textContent).toContain("S (+0)8M (+2)9L (+4)4E (+6)");
        expect(screen.getByTestId("arc-rear-spe").textContent).toBe("PNT1");
    });

    it("gives a capital ship front/rear arcs and the CAP column, on the print card too", () => {
        render(<AlphaStrikePrintUnitSVG asUnit={largeCraft("WS", { front: { std: ["11", "11", "11", ""], cap: ["90", "90", "90", "36"] } })} appGlobals={appGlobals} measurementsInHexes={false} />);
        const back = screen.getByTestId("alpha-strike-card-back");
        expect(back.textContent).toContain("FRONT ARC");
        expect(back.textContent).toContain("STDCAPSCAPMSL");
        // Row by row: S 11 and 90, M 11 and 90, L 11 and 90, E only 36.
        expect(screen.getByTestId("arc-front").textContent).toContain("S (+0)1190M (+2)1190L (+4)1190E (+6)36");
    });

    it("keeps the one-sided card for units without arcs", () => {
        render(<AlphaStrikeUnitSVG asUnit={largeCraft("DS", undefined)} appGlobals={appGlobals} measurementsInHexes={false} />);
        expect(screen.queryByTestId("alpha-strike-card-back")).toBeNull();
        expect(screen.queryByTestId("as-card-damage-by-arc")).toBeNull();
    });
});
