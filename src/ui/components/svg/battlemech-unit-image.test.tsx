// @vitest-environment happy-dom
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BattleMech } from "../../../classes/battlemech";
import { FW_POWER_ARMOR_RULESET } from "../../../data/future-wars-power-armor";
import { sswTestFixtures } from "../../../data/ssw/sswTestFixtures";
import { buildMech } from "../../../test-support/builders";
import { buildPrintedDroid } from "../../../classes/printed-droid";
import { getPrintedDroid } from "../../../data/battledroids-mechs";
import BattleMechSVG from "./battlemech-svg";
import BattledroidsMechRecordSheetSVG from "./battledroids-mech-record-sheet-svg";
import { assertImageClear } from "./image-clear-test-utils";

const URL_ = "data:image/webp;base64,AAAA";
const griffin = (): BattleMech => {
    const mech = new BattleMech();
    mech.importSSWXML(sswTestFixtures["Griffin GRF-1N"]);
    return mech;
};

describe("'Mech record sheet unit picture (#95)", () => {
    it("draws the picture once, clear of the printed text, in print and in play", () => {
        for (const inPlay of [false, true]) {
            const mech = griffin();
            mech.tro.setImage(URL_);
            assertImageClear(<BattleMechSVG mechData={mech} inPlay={inPlay} />, inPlay ? "play" : "print");
        }
    });

    it("draws the picture on the Battledroids droid sheet, clear of the printed text", () => {
        const droid = buildPrintedDroid(getPrintedDroid("stg-3r")!);
        droid.tro.setImage(URL_);
        assertImageClear(<BattledroidsMechRecordSheetSVG mechData={droid} />, "droid");
        const plain = buildPrintedDroid(getPrintedDroid("stg-3r")!);
        expect(renderToStaticMarkup(<BattledroidsMechRecordSheetSVG mechData={plain} />)).not.toContain("unit-image");
    });

    it("on a Power Armor suit the picture stays above the rules box that stands on the foot of the weapons box", () => {
        const suit = buildMech({ type: "biped", tonnage: 10, walk: 6, homebrew: [FW_POWER_ARMOR_RULESET] });
        suit.tro.setImage(URL_);
        assertImageClear(<BattleMechSVG mechData={suit} inPlay={false} />, "power-armor");
        const { container } = render(<BattleMechSVG mechData={suit} inPlay={false} />);
        const image = container.querySelector("image[data-testid='unit-image']");
        const box = container.querySelector("[data-testid='power-armor-box'] rect");
        // The picture, when it is drawn, ends above the rules box's top edge.
        if (image && box) expect(Number(image.getAttribute("y")) + Number(image.getAttribute("height"))).toBeLessThanOrEqual(Number(box.getAttribute("y")));
    });

    it("draws nothing without a picture", () => {
        expect(renderToStaticMarkup(<BattleMechSVG mechData={griffin()} inPlay={false} />)).not.toContain("unit-image");
    });

    it("leaves the picture off when the weapons list leaves no room for it", () => {
        const mech = griffin();
        mech.tro.setImage(URL_);
        // Pad the list to fill the box: the picture must not be drawn over the rows.
        while (mech.equipmentList.length < 22) mech.equipmentList.push({ ...mech.equipmentList[0] });
        expect(renderToStaticMarkup(<BattleMechSVG mechData={mech} inPlay={false} />)).not.toContain("unit-image");
    });
});
