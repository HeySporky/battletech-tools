import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Building from "../../../classes/building";
import BuildingRecordSheet from "../building-record-sheet";
import BuildingRecordSheetSVG, { BUILDING_HEXES_PER_PAGE, buildingSheetPages } from "./building-record-sheet-svg";

// Kenyon's Clan gun emplacement from TO:AR p.129: Heavy, CF 80, 80 points of armor, two ER large lasers in the turret.
const kenyon = (): Building => {
    const building = new Building();
    building.setName("Kenyon's Emplacement");
    building.setTech("clan");
    building.setClassification("gun-emplacement");
    building.setType("heavy");
    building.setCF(80);
    building.setArmorTons(4);
    building.addEquipmentFromTag("clan-er-large-laser", 1, true);
    building.addEquipmentFromTag("clan-er-large-laser", 1, true);
    return building;
};

// Tara's fortress from TO:AR p.130: Hardened, CF 150, 6 hexes, 5 levels.
const tara = (hexes = 6): Building => {
    const building = new Building();
    building.setName("Tara's Keep");
    building.setClassification("fortress");
    building.setType("hardened");
    building.setCF(150);
    building.setHexes(hexes);
    building.setLevels(5);
    building.setArmorTons(9);
    return building;
};

const render = (building: Building, showDamage = false) =>
    renderToStaticMarkup(<BuildingRecordSheetSVG building={building} page={0} showDamage={showDamage} />);

describe("Structure record sheet", () => {
    it("has the blocks of the Tactical Operations sheet, with our rules helpers", () => {
        const markup = render(kenyon());
        for (const label of ["STRUCTURE RECORD SHEET", "STRUCTURE DATA", "WEAPONS &amp; EQUIPMENT INVENTORY", "CF &amp; ARMOR", "CREW DATA", "STRUCTURE MAP",
            "BUILDING CRITICAL HITS", "Gunners Stunned", "Turret", "Kenyon&#x27;s Emplacement", "Damage Threshold"]) {
            expect(markup).toContain(label);
        }
        // Identical weapons in the same hex and turret share a line.
        expect(markup).toMatch(/data-testid="building-weapon" data-qty="2"/);
        // The map grid is numbered like a mapsheet.
        expect(markup).toContain(">0101<");
        expect(markup).toContain(">0907<");
    });

    it("lists each hex with its Construction Factor and armor", () => {
        const markup = render(tara());
        expect(markup.match(/data-testid="building-hex"/g)).toHaveLength(6);
        expect(markup).toContain('data-testid="building-hex" data-hex="6" data-cf="150" data-armor="');
    });

    it("writes in what play has left", () => {
        const building = tara();
        building.setHexCF(2, 100);
        expect(render(building)).not.toContain('data-current-cf="100"');
        expect(render(building, true)).toContain('data-current-cf="100"');
    });

    it("carries hexes past the first page onto continuation pages", () => {
        const building = new Building();
        building.setClassification("wall");
        building.setType("light");
        building.setHexes(BUILDING_HEXES_PER_PAGE + 5);
        const markup = renderToStaticMarkup(<BuildingRecordSheet building={building} />);
        expect(markup.match(/STRUCTURE RECORD SHEET/g)).toHaveLength(2);
        expect(markup.match(/data-testid="building-hex"/g)).toHaveLength(BUILDING_HEXES_PER_PAGE + 5);
    });
    // A fortress fitted with everything: no fitting is cut off the sheet.
    it("prints every fitting, on a continuation page when they do not fit", () => {
        const sealed = (doors: number, elevators: number): Building => {
            const building = tara();
            building.setSealed(true);
            building.setHeavyMetalSuperstructure(true);
            building.setCeilings("low");
            building.setSubsurface("underground");
            building.setDepth(2);
            building.setLiquidStorage(20);
            for (let i = 0; i < doors; i++) building.addDoor(2);
            for (let i = 0; i < elevators; i++) building.addElevator(i % 6 + 1, 20, 3);
            return building;
        };
        const fittings = (building: Building): string[] => [
            "Underground, depth 2", "Environmental sealing (breach roll", "Heavy metal superstructure", "Low ceilings",
            "Liquid storage for", ...building.getElevators().map((elevator, i) => `Industrial elevator in hex ${elevator.hex}: 20 tons, 3 levels${i}`),
        ];
        // The text of every fittings block, its wrapped lines joined back up.
        const sheet = (building: Building) => [...renderToStaticMarkup(<BuildingRecordSheet building={building} />)
            .matchAll(/<g data-testid="building-fittings">(.*?)<\/g>/g)]
            .map((block) => [...block[1].matchAll(/>([^<]+)</g)].map((line) => line[1]).join(" ")).join(" | ");

        const few = sealed(2, 2);
        expect(buildingSheetPages(few)).toBe(1);
        for (const fitting of fittings(few).map((f) => f.replace(/\d$/, ""))) expect(sheet(few)).toContain(fitting);
        expect(sheet(few)).toContain("2 large doors (2 levels, 2 levels)");

        const many = sealed(12, 20);
        expect(buildingSheetPages(many)).toBe(2);
        const markup = sheet(many);
        expect(renderToStaticMarkup(<BuildingRecordSheet building={many} />)).toContain("FITTINGS (CONTINUED)");
        expect(markup).toContain("more fittings on the next page");
        expect(markup).toContain("12 large doors");
        for (let hex = 1; hex <= 6; hex++) expect(markup).toContain(`Industrial elevator in hex ${hex}: 20 tons, 3 levels`);
        expect(markup.match(/Industrial elevator in hex/g)?.length ?? 0).toBeGreaterThanOrEqual(20);
    });
});
