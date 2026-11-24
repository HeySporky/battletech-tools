import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BattledroidsUnit from "../../../classes/battledroids-unit";
import BattledroidsUnitRecordSheet from "../battledroids-unit-record-sheet";
import BattledroidsUnitRecordSheetSVG from "./battledroids-unit-record-sheet-svg";

const render = (units: BattledroidsUnit[], showDamage = false) =>
    renderToStaticMarkup(<BattledroidsUnitRecordSheetSVG units={units} showDamage={showDamage} />).replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

describe("Battledroids unit record sheet", () => {
    it("prints a tank with its armor by location, weapons and the book's tables", () => {
        const markup = render([new BattledroidsUnit("vde-3t-vedette")]);
        for (const label of [
            "BATTLEDROIDS UNIT RECORD SHEET", "VDE-3T Vedette", "ARMOR DIAGRAM", "WEAPONS", "Gunnery Skill:", "Movement Points:",
            "TO-HIT NUMBER", "MOVEMENT MODIFIERS", "TERRAIN MODIFIERS", "TANK HIT LOCATIONS", "MISSILE HIT TABLE", "FIRING ARC",
            "Tracks", "Turret",
        ]) expect(markup).toContain(label);
        expect(markup).toContain('data-testid="tank-silhouette"');
        // Every tank carries 20 front, 10 on each side, 8 back and 5 turret armor (BD p.22).
        for (const [location, points] of [["front", 20], ["left", 10], ["right", 10], ["back", 8], ["turret", 5]]) {
            expect(markup).toContain(`data-testid="armor-${location}" data-points="${points}"`);
        }
        // The Missile Hit Table's 20 column on a roll of 9: 16 missiles (BD p.19).
        expect(markup).toMatch(/data-testid="missile-hit" data-roll="9"[^>]*data-hits="2,3,4,5,8,12,16"/);
    });

    it("prints jeeps and infantry with their damage boxes, two units to a page", () => {
        const markup = render([new BattledroidsUnit("jeep-mg"), new BattledroidsUnit("infantry-srm")]);
        expect(markup.match(/data-testid="battledroids-unit"/g)).toHaveLength(2);
        expect(markup).toContain('data-testid="damage-boxes" data-boxes="6"');
        expect(markup).toContain('data-testid="damage-boxes" data-boxes="1"');
        expect(markup).not.toContain("ARMOR DIAGRAM");
    });

    it("writes in the damage and shots of play", () => {
        const unit = new BattledroidsUnit("scr-8n-scorpion");
        unit.setArmorLeft("front", 12);
        unit.changeShotsFired(0, 3);
        expect(render([unit])).not.toContain('data-testid="armor-front" data-points="20" data-left="12"');
        const markup = render([unit], true);
        expect(markup).toContain('data-testid="armor-front" data-points="20" data-left="12"');
        expect(markup).toContain("12 of 15");
    });

    it("prints a roster's units two to a page", () => {
        const units = ["scr-8n-scorpion", "hnt-3r-hunter", "vde-3t-vedette"].map((tag) => new BattledroidsUnit(tag));
        const markup = renderToStaticMarkup(<BattledroidsUnitRecordSheet units={units} showDamage={false} />);
        expect(markup.match(/BATTLEDROIDS UNIT RECORD SHEET/g)).toHaveLength(2);
    });
});
