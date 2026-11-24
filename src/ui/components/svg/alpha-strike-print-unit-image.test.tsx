// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AlphaStrikeUnit } from "../../../classes/alpha-strike-unit";
import { BattleMech } from "../../../classes/battlemech";
import type { IAppGlobals } from "../../app-router";
import AlphaStrikePrintUnitSVG from "./alpha-strike-print-unit";

afterEach(cleanup);

// #95: a stored picture gets a fit box on the printed card, so any shape stays inside its slot; MUL art is untouched.
const appGlobals = {} as IAppGlobals;
const portrait = (unit: AlphaStrikeUnit): Element | null => {
    const { container } = render(<AlphaStrikePrintUnitSVG asUnit={unit} appGlobals={appGlobals} measurementsInHexes={false} />);
    return container.querySelector("image.unit-portrait");
};

describe("printed Alpha Strike card picture (#95)", () => {
    it("fits a stored picture into a box without distortion", () => {
        const mech = new BattleMech();
        mech.tro.setImage("data:image/webp;base64,AAAA");
        const image = portrait(mech.calcAlphaStrike());
        expect(image).not.toBeNull();
        expect(Number(image!.getAttribute("width"))).toBeGreaterThan(0);
        expect(Number(image!.getAttribute("height"))).toBeGreaterThan(0);
        expect(image!.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
    });

    it("leaves a MUL picture exactly as it was", () => {
        const unit = new AlphaStrikeUnit();
        unit.imageURL = "https://example.com/mul.png";
        const image = portrait(unit);
        expect(image).not.toBeNull();
        expect(image!.getAttribute("width")).toBeNull();
        expect(image!.getAttribute("preserveAspectRatio")).toBeNull();
    });
});
