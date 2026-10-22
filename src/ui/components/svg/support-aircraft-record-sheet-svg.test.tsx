import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AerospaceFighter from "../../../classes/aerospace-fighter";
import FighterRecordSheet from "../fighter-record-sheet";

// Rendered markup escapes apostrophes and ampersands.
const render = (craft: AerospaceFighter, props: { showDamage?: boolean } = {}) =>
    renderToStaticMarkup(<FighterRecordSheet fighter={craft} {...props} />).replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

const supportCraft = (motive: "airship" | "satellite" | "fixed-wing"): AerospaceFighter => {
    const craft = new AerospaceFighter();
    craft.setFighterType("support");
    craft.setSupportMotive(motive);
    craft.setTonnage(motive === "satellite" ? 20 : 100);
    if (motive !== "satellite") craft.setSafeThrust(1);
    craft.setName("Test Gasbag");
    craft.setArmorAllocation("nose", 10);
    craft.setArmorAllocation("leftWing", 8);
    craft.setArmorAllocation("rightWing", 8);
    craft.setArmorAllocation("aft", 6);
    return craft;
};

// The parity checklist: the blocks of the Total Warfare Airship and Tactical Operations Satellite record sheets.
describe("aerospace Support Vehicle record sheets", () => {
    it("prints an Airship on the Airship Record Sheet layout", () => {
        const markup = render(supportCraft("airship"));
        for (const label of [
            "AIRSHIP RECORD SHEET", "AIRSHIP DATA", "Test Gasbag", "Safe Thrust:", "Maximum Thrust:", "Tech Base:", "Weapons & Equipment Inventory",
            "SRV", "ERV", "ARMOR DIAGRAM", "BAR:", "NOTES", "CREW DATA", "Hits Taken", "Incp.", "Marines:", "Life Boats/Escape Pods:",
            "CRITICAL DAMAGE", "Thrusters", "Left", "Right", "Life Support", "VELOCITY RECORD", "Altitude", "AIRSHIP VELOCITY TABLE",
            "Thrust Points per Cycle Turn",
        ]) expect(markup).toContain(label);
        expect(markup).toContain('data-testid="airship-silhouette"');
        // The engine track runs -1 to -5, then destroyed.
        expect(markup).toContain(">-5<");
        // The velocity table's 2.75 row: 3, 2, 3, 3 Thrust Points over the four-turn cycle (TW p.204).
        expect(markup).toMatch(/data-testid="airship-velocity" data-velocity="2.75" data-thrust="3,2,3,3"/);
        expect(markup).not.toContain("FIGHTER DATA");
        expect(markup).not.toContain("GROUND MAP STRAIGHT MOVEMENT");
    });

    it("prints a Satellite on the Satellite Record Sheet layout", () => {
        const markup = render(supportCraft("satellite"));
        for (const label of ["SATELLITE RECORD SHEET", "SATELLITE DATA", "Station Keeping Only", "ARMOR DIAGRAM", "CREW DATA", "CRITICAL DAMAGE", "CIC", "Thrusters", "NOTES"]) {
            expect(markup).toContain(label);
        }
        expect(markup).toContain('data-testid="satellite-silhouette"');
        // A satellite holds station: no velocity record, no airship table, and its sides are not wings.
        expect(markup).not.toContain("VELOCITY RECORD");
        expect(markup).not.toContain("AIRSHIP VELOCITY TABLE");
        expect(markup).not.toContain("Left Wing");
    });

    it("keeps a Fixed-Wing Support Vehicle on the conventional fighter layout", () => {
        const markup = render(supportCraft("fixed-wing"));
        expect(markup).toContain("FIGHTER DATA");
        expect(markup).not.toContain("AIRSHIP VELOCITY TABLE");
    });

    it("fills in the critical hits taken in play", () => {
        const craft = supportCraft("airship");
        craft.getInPlay().avionics = 2;
        expect(render(craft).match(/data-hit="filled"/g)).toBeNull();
        expect(render(craft, { showDamage: true })).toMatch(/data-testid="crit-Avionics" data-filled="2"/);
    });
});
