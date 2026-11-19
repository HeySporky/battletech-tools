import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BattleMech } from "../../../classes/battlemech";
import { buildPrintedDroid } from "../../../classes/printed-droid";
import { getPrintedDroid } from "../../../data/battledroids-mechs";
import BattleMechSVG from "./battlemech-svg";
import BattledroidsMechRecordSheetSVG, { getBattledroidsAmmo } from "./battledroids-mech-record-sheet-svg";

const droid = (id: string) => buildPrintedDroid(getPrintedDroid(id)!);
const render = (mech: BattleMech) => renderToStaticMarkup(<BattledroidsMechRecordSheetSVG mechData={mech} />);

describe("Battledroids droid record sheet", () => {
    it("prints the Stinger in the book's sheet: armor boxes by location, the DroidWarrior, heat sinks and criticals", () => {
        const markup = render(droid("stg-3r"));
        for (const label of [
            "ARMOR DIAGRAM", "INTERNAL STRUCTURE", "TOTAL HEAT SINKS", "DROID WARRIOR", "DroidWarrior Hits:", "AMMO",
            "AutoCannon Rounds", "M.G. Rounds", "BATTLEDROIDS", "CRITICAL HIT CHART", "HEAT SCALE", "Stinger", "STG-3R",
            "Medium Laser", "Shoulder", "Life Support", "Cockpit", "Engine", "Gyro",
        ]) expect(markup).toContain(label);
        // The Stinger's armor as printed (BD p.16).
        for (const [location, points] of [
            ["head", 9], ["centerTorso", 10], ["centerTorsoRear", 4], ["leftTorso", 7], ["rightTorsoRear", 2], ["leftArm", 6], ["rightLeg", 8],
        ]) expect(markup).toContain(`data-testid="droid-boxes-${location}" data-points="${points}"`);
        expect(markup).toContain('data-testid="droid-heat-sinks" data-count="10"');
        expect(markup.match(/data-testid="droid-warrior-hit"/g)).toHaveLength(5);
        expect(markup.match(/data-testid="droid-heat-level"/g)).toHaveLength(31);
        expect(markup).toContain("Ammo explosion; avoid on 8+");
    });

    it("totals the ammunition the way the sheet asks for it", () => {
        expect(getBattledroidsAmmo(droid("stg-3r"))).toMatchObject({ autoCannon: 0, machineGun: 200, srm: "", lrm: "" });
        expect(getBattledroidsAmmo(droid("wsp-1a")).srm).toBe("2 per pack, 50 packs");
    });

    it("is the printed sheet for a Battledroids biped; play mode and other editions keep the Total Warfare sheet", () => {
        const stinger = droid("stg-3r");
        expect(renderToStaticMarkup(<BattleMechSVG mechData={stinger} inPlay={false} />)).toContain('data-testid="battledroids-mech-record-sheet-svg"');
        expect(renderToStaticMarkup(<BattleMechSVG mechData={stinger} inPlay={true} />)).not.toContain("battledroids-mech-record-sheet-svg");
        expect(renderToStaticMarkup(<BattleMechSVG mechData={new BattleMech()} inPlay={false} />)).not.toContain("battledroids-mech-record-sheet-svg");
    });
});
