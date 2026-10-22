import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SmallCraft from "../../../classes/small-craft";
import SmallCraftRecordSheetSVG from "./small-craft-record-sheet-svg";

const sample = (shape: "aerodyne" | "spheroid"): SmallCraft => {
    const craft = new SmallCraft();
    craft.setShape(shape);
    craft.setName("Test Lander");
    craft.setArmorAllocation("nose", 40);
    craft.setArmorAllocation("left", 30);
    craft.setArmorAllocation("right", 30);
    craft.setArmorAllocation("aft", 20);
    craft.addEquipmentFromTag("large-laser", "nose");
    craft.addEquipmentFromTag("medium-laser", "left");
    craft.addEquipmentFromTag("medium-laser", "leftAft");
    craft.setPassengers(4);
    craft.setQuarters("firstClass", 4);
    craft.addBay("cargo", 9);
    return craft;
};

const render = (craft: SmallCraft, props: { showPilot?: boolean; showDamage?: boolean } = {}) =>
    renderToStaticMarkup(<SmallCraftRecordSheetSVG craft={craft} {...props} />);

describe("Small Craft record sheet", () => {
    it("is titled for its shape, with the blocks the Total Warfare Small Craft sheets print", () => {
        const aerodyne = render(sample("aerodyne"));
        expect(aerodyne).toContain("AERODYNE SMALL CRAFT RECORD SHEET");
        for (const block of ["CRAFT DATA", "ARMOR DIAGRAM", "NOTES", "CRITICAL DAMAGE", "VELOCITY RECORD", "HEAT DATA", "Overflow", "Weapons &amp; Equipment Inventory"]) {
            expect(aerodyne).toContain(block);
        }
        expect(aerodyne).not.toContain("EXTERNAL STORES");
        expect(aerodyne).toContain('data-testid="aerodyne-silhouette"');
        const spheroid = render(sample("spheroid"));
        expect(spheroid).toContain("SPHEROID SMALL CRAFT RECORD SHEET");
        expect(spheroid).toContain('data-testid="spheroid-silhouette"');
        expect(spheroid).toContain("Left Side");
    });

    it("lists weapons by arc with the arc codes keyed", () => {
        const markup = render(sample("aerodyne"));
        expect(markup).toContain("Large Laser");
        expect(markup).toContain(">LW(R)<");
        expect(markup).toContain("LW(R) Left Wing (Rear)");
        expect(render(sample("spheroid"))).toContain("AL Aft-Left");
    });

    it("prints crew, passengers, quarters and bays", () => {
        const markup = render(sample("aerodyne"));
        expect(markup).toContain("CREW &amp; CARGO");
        expect(markup).toContain("Passengers:");
        expect(markup).toContain("4 Officer / 1st Class");
        expect(markup).toMatch(/Cargo[^<]*9/);
    });

    it("prints a Small Craft's critical tracks: six engine boxes, two thrusters, gear and life support", () => {
        const markup = render(sample("aerodyne"));
        for (const track of ["Avionics", "FCS", "Sensors", "Engine", "Left Thruster", "Right Thruster", "Gear", "Life Support"]) {
            expect(markup).toContain(`>${track}<`);
        }
        expect(markup.match(/>-[1-5]</g)).toHaveLength(5);
        expect(markup).toContain("CREW DATA");
    });

    it("fills in damage marked in play", () => {
        const craft = sample("aerodyne");
        craft.setCriticalHits("engine", 2);
        craft.setCriticalHits("leftThruster", 1);
        craft.setCriticalHits("crewHits", 1);
        craft.setLifeSupportDamaged(true);
        expect(render(craft).match(/data-hit="filled"/g)).toBeNull();
        expect(render(craft, { showDamage: true }).match(/data-hit="filled"/g)).toHaveLength(5);
    });
});
