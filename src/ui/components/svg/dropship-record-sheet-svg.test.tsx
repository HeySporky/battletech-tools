import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SmallCraft from "../../../classes/small-craft";
import SmallCraftRecordSheet from "../small-craft-record-sheet";
import DropShipRecordSheetSVG from "./dropship-record-sheet-svg";

const sample = (shape: "aerodyne" | "spheroid"): SmallCraft => {
    const ship = new SmallCraft();
    ship.setCraftType("dropShip");
    ship.setShape(shape);
    ship.setTonnage(3000);
    ship.setName("Test Carrier");
    for (const tag of ["large-laser", "large-laser", "medium-laser", "medium-laser", "medium-laser"]) ship.addEquipmentFromTag(tag, "nose");
    ship.addBay("fighter", 6);
    ship.setBay(0, 6, 2);
    return ship;
};

const render = (ship: SmallCraft, props: { showPilot?: boolean; showDamage?: boolean } = {}) =>
    renderToStaticMarkup(<DropShipRecordSheetSVG craft={ship} {...props} />);

describe("DropShip record sheet", () => {
    it("is titled for its shape, with the blocks the Total Warfare DropShip sheets print and no heat scale", () => {
        const aerodyne = render(sample("aerodyne"));
        expect(aerodyne).toContain("AERODYNE DROPSHIP RECORD SHEET");
        for (const block of ["DROPSHIP DATA", "ARMOR DIAGRAM", "NOTES", "CRITICAL DAMAGE", "CREW DATA", "VELOCITY RECORD", "HEAT DATA", "Heat Generation Per Arc", "Capital Scale"]) {
            expect(aerodyne).toContain(block);
        }
        expect(aerodyne).not.toContain("Overflow");
        expect(render(sample("spheroid"))).toContain("SPHEROID DROPSHIP RECORD SHEET");
    });

    it("lists weapon bays with their summed heat and damage (TM p.199)", () => {
        const markup = render(sample("aerodyne"));
        expect(markup).toContain("Lasers: 2 Large Laser, 3 Medium Laser");
        expect(markup).toContain(">31<");
        expect(markup).toContain(">16<");
        expect(markup).toContain(">25<");
    });

    it("prints the fighters and Small Craft carried and their launch rate", () => {
        const markup = render(sample("aerodyne"));
        expect(markup).toContain("Fighters/Small Craft:");
        expect(markup).toContain(">6/0<");
        expect(markup).toContain(">4/0<");
        expect(markup).toContain("Bay 1: Fighter Cubicle (6) 2 Doors");
    });

    it("prints the DropShip's critical tracks and the crew's hits with the incapacitated box", () => {
        const markup = render(sample("aerodyne"));
        for (const track of ["Avionics", "FCS", "Sensors", "Engine", "Left Thruster", "Right Thruster", "Gear", "K-F Boom", "Docking Collar"]) {
            expect(markup).toContain(`>${track}<`);
        }
        expect(markup.match(/>-[1-5]</g)).toHaveLength(5);
        expect(markup).toContain(">Incp.<");
    });

    it("fills in damage marked in play", () => {
        const ship = sample("aerodyne");
        ship.setCriticalHits("engine", 2);
        ship.setCriticalHits("crewHits", 1);
        expect(render(ship).match(/data-hit="filled"/g)).toBeNull();
        expect(render(ship, { showDamage: true }).match(/data-hit="filled"/g)).toHaveLength(3);
    });

    it("is the sheet a DropShip prints", () => {
        expect(renderToStaticMarkup(<SmallCraftRecordSheet craft={sample("spheroid")} />)).toContain("SPHEROID DROPSHIP RECORD SHEET");
    });
});
