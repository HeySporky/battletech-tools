import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CapitalShip from "../../../classes/capital-ship";
import CapitalShipRecordSheet from "../capital-ship-record-sheet";
import CapitalShipRecordSheetSVG from "./capital-ship-record-sheet-svg";

const sample = (type = "warShip"): CapitalShip => {
    const ship = new CapitalShip();
    ship.setShipType(type);
    ship.setTonnage(type === "spaceStation" ? 100000 : 420000);
    ship.setName("Test Hull");
    ship.setStructuralIntegrity(type === "warShip" ? 40 : 1);
    ship.addEquipmentFromTag("large-laser", "nose");
    ship.addEquipmentFromTag("large-laser", "nose");
    ship.addCapitalWeapon("nac-10", "nose");
    ship.addBay("fighter", 6);
    ship.setBay(0, 6, 2);
    return ship;
};

const render = (ship: CapitalShip, props: { showPilot?: boolean; showDamage?: boolean } = {}) =>
    renderToStaticMarkup(<CapitalShipRecordSheetSVG ship={ship} {...props} />);

describe("JumpShip, WarShip and space station record sheet", () => {
    it("prints the blocks the WarShip sheet prints", () => {
        const markup = render(sample());
        expect(markup).toContain("WARSHIP RECORD SHEET");
        for (const block of ["WARSHIP DATA", "ARMOR DIAGRAM", "CREW DATA", "CRITICAL DAMAGE", "HEAT DATA", "VELOCITY RECORD", "NOTES",
            "Heat Generation Per Arc", "Capital Scale", "DropShip Capacity:", "Fighters/Small Craft:", "Launch Rate:",
            "K-F Drive Integrity", "Sail Integrity", "Docking Collars", ">CIC<", ">Engine<", ">Incp.<"]) {
            expect(markup).toContain(block);
        }
    });

    it("titles a JumpShip and a space station for their type; a station has no K-F drive, engine or velocity record", () => {
        expect(render(sample("jumpShip"))).toContain("JUMPSHIP RECORD SHEET");
        const station = render(sample("spaceStation"));
        expect(station).toContain("SPACE STATION RECORD SHEET");
        expect(station).toContain("SPACE STATION DATA");
        expect(station).toContain("Station-Keeping Only");
        // The official station sheet leaves a sail line to write in; a station may carry one (SO:AA p.136).
        expect(station).toContain('data-testid="capital-track-sail" data-count="0"');
        for (const missing of ["VELOCITY RECORD", "K-F Drive Integrity", ">Engine<"]) expect(station).not.toContain(missing);
    });

    it("lists weapon bays in capital scale, standard bays with standard scale in parentheses (SO:AA p.9)", () => {
        const markup = render(sample());
        expect(markup).toContain("Lasers: 2 Large Laser");
        expect(markup).toContain(">2 (16)<");
        expect(markup).toContain("Naval Autocannon: 1 NAC/10 (C)");
    });

    it("draws each facing's armor and the structural integrity in squares", () => {
        const ship = sample();
        const markup = render(ship);
        expect(markup).toContain(`data-testid="capital-armor-nose" data-count="${ship.getFacingArmor("nose")}"`);
        expect(markup).toContain('data-testid="capital-track-si" data-count="40"');
    });

    it("fills in damage marked in play", () => {
        const ship = sample();
        ship.setArmorDamage("nose", 3);
        ship.setCriticalHits("engine", 2);
        ship.setCriticalHits("crewHits", 1);
        expect(render(ship)).not.toContain('data-hit="filled"');
        const markup = render(ship, { showDamage: true });
        expect(markup.match(/data-hit="filled"/g)).toHaveLength(3);
        expect(markup).toContain('data-testid="capital-armor-nose" data-count="' + ship.getFacingArmor("nose") + '" data-damage="3"');
    });

    it("is the sheet the creator and the roster print", () => {
        expect(renderToStaticMarkup(<CapitalShipRecordSheet ship={sample("jumpShip")} />)).toContain("JUMPSHIP RECORD SHEET");
    });
});
