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
    it("prints the hull, the afloat bay line and a Large Well Deck with its vessel tons (#643, BattleTech forums merges)", () => {
        const ship = sample("aerodyne");
        ship.setTonnage(20000);
        ship.setFlotationHull(true);
        ship.addBay("well-deck-large", 11050);
        const markup = render(ship);
        expect(markup).toContain("Flotation Hull: lands on water");
        expect(markup).toContain("bow ramp");
        expect(markup).toContain("Well Deck, Large Vessel");
        expect(markup).toContain("8500 tons");
        expect(render(sample("aerodyne"))).not.toContain("bow ramp");
    });

    it("names a Future Wars method and prints its fire factors in the notes (#172)", () => {
        const ship = sample("aerodyne");
        ship.gameSettings.set(4, ["fw-dropships-eid"]);
        const markup = render(ship);
        expect(markup).toContain("Construction: Erik Eid");
        // Two large lasers (8 each) and three medium lasers (5 each): 31 damage, 3 fire factors.
        expect(markup).toContain("Fire Factors: Nose 3");
        expect(render(sample("aerodyne"))).not.toContain("Fire Factors");
    });

    it("fills the K-F Boom and Docking Collar boxes once they are destroyed in play", () => {
        const ship = sample("aerodyne");
        ship.setKFBoomDestroyed(true);
        ship.setDockingCollar("damaged");
        let markup = render(ship, { showDamage: true });
        expect(markup).toContain('data-testid="crit-K-F Boom" data-filled="1"');
        expect(markup).toContain('data-testid="crit-Docking Collar" data-filled="0"');
        ship.setDockingCollar("destroyed");
        markup = render(ship, { showDamage: true });
        expect(markup).toContain('data-testid="crit-Docking Collar" data-filled="1"');
        expect(render(ship)).toContain('data-testid="crit-K-F Boom" data-filled="0"');
    });

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

    it("lists anti-missile systems once, as a Point Defense bay, and pulse lasers in a bay of their own (TM p.195)", () => {
        const ship = sample("aerodyne");
        ship.addEquipmentFromTag("is-ams", "nose");
        ship.addEquipmentFromTag("medium-pulse-laser", "nose");
        const markup = render(ship);
        expect(markup).toContain("Point Defense: 1 Anti-Missile System");
        expect(markup.split("Anti-Missile System").length - 1).toBe(1);
        expect(markup).toContain("Pulse Lasers: 1 Medium Pulse Laser");
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
