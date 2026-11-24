import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Vehicle from "../../../classes/vehicle";
import { edgeDistance, insideShape } from "./shape-bubbles";
import VehicleDiagramSVG from "./vehicle-diagram-svg";

const tank = (motive: string, tonnage: number = 30, turret: boolean = false): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setMotiveType(motive);
    vehicle.setTonnage(tonnage);
    vehicle.setHasTurret(turret);
    return vehicle;
};

const draw = (vehicle: Vehicle, width?: number): string => renderToStaticMarkup(
    <VehicleDiagramSVG
        motive={vehicle.getMotiveType()}
        locations={vehicle.getLocations()}
        structure={vehicle.getStructureAllocation()}
        armor={vehicle.getArmorAllocation()}
        width={width}
    />
);

// The radius of each armor (white) and structure (shaded) pip drawn in a location, as printed (the legend left out).
const pipRadii = (markup: string): number[] => [...markup.split('data-location="').slice(1).join("").matchAll(/<circle[^>]* r="([\d.]+)"[^>]*fill="rgb\((255,255,255|205,205,205)\)"/g)]
    .map((match) => +match[1]);

describe("vehicle armor diagram (beta feedback 2026-10-21)", () => {
    it("is centred horizontally and scales to its column", () => {
        const markup = draw(tank("tracked"), 600);
        expect(markup).toMatch(/<svg[^>]*style="display:block;margin:0 auto;max-width:100%;height:auto"/);
    });

    it("sits at a given place inside a record sheet, without page styles", () => {
        const vehicle = tank("tracked");
        const markup = renderToStaticMarkup(
            <VehicleDiagramSVG motive={vehicle.getMotiveType()} locations={vehicle.getLocations()}
                structure={vehicle.getStructureAllocation()} armor={vehicle.getArmorAllocation()} width={460} x={1500} y={240} />
        );
        expect(markup).toMatch(/^<svg x="1500" y="240" width="460" height="570"/);
        expect(markup).not.toContain("style=");
    });

    it.each([
        ["tracked", "tracked"],
        ["wheeled", "wheeled"],
        ["hover", "hover"],
        ["vtol", "vtol"],
        ["wige", "wige"],
        ["naval-surface", "naval"],
        ["hydrofoil", "naval"],
        ["naval-sub", "naval"],
        ["rail", "wheeled"],
    ])("draws a top-down %s outline (%s)", (motive, outline) => {
        expect(draw(tank(motive, 20))).toContain(`data-testid="vehicle-outline-${outline}"`);
    });

    it("draws the turret, with its gun, when there is one", () => {
        expect(draw(tank("tracked", 50, true))).toContain('data-testid="vehicle-turret-gun"');
        expect(draw(tank("tracked", 50))).not.toContain('data-testid="vehicle-turret-gun"');
    });

    // Every bubble of a location, structure and armor, drawn wholly inside that location's own section of the hull.
    it.each([
        ["tracked", 100, true, 0],
        ["vtol", 30, true, 0],
        ["hover", 50, false, 0],
        ["naval-surface", 300, true, 0],
        ["naval-sub", 100, false, 0],
        ["naval-surface", 2000, true, 5],
        ["tracked", 180, true, 0],
    ] as const)("packs a %s %i-ton vehicle's bubbles inside each section's shape", (motive, tonnage, turret, turrets) => {
        const vehicle = tank(motive, tonnage, turret);
        if (turrets) vehicle.setTurretCount(turrets);
        vehicle.allocateMaxArmor();
        const markup = draw(vehicle);
        const structure = vehicle.getStructureAllocation() as unknown as Record<string, number>;
        const armor = vehicle.getArmorAllocation() as unknown as Record<string, number>;
        for (const { tag } of vehicle.getLocations()) {
            const group = new RegExp(`<g data-location="${tag}">(.*?)</g>`).exec(markup)![1];
            const shape = /<polygon points="([^"]+)"/.exec(group)![1].split(" ").map((pair) => pair.split(",").map(Number) as [number, number]);
            const bubbles = [...group.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)].map((match) => match.slice(1).map(Number));
            expect(bubbles).toHaveLength((structure[tag] ?? 0) + (armor[tag] ?? 0));
            for (const [cx, cy, r] of bubbles) {
                expect(insideShape(shape, [cx, cy])).toBe(true);
                expect(edgeDistance(shape, [cx, cy])).toBeGreaterThanOrEqual(r - 0.2);
            }
        }
    // The 2000-ton hull checks thousands of bubbles: past the 5s default under a full-suite load.
    }, 20_000);

    it("draws pips large enough to read and mark", () => {
        const vehicle = tank("tracked", 50, true);
        const radii = pipRadii(draw(vehicle));
        expect(radii.length).toBeGreaterThan(0);
        // Drawn at 500 wide, every pip of a 50-ton tank's structure is at least 4.5 units across its radius.
        expect(Math.min(...radii)).toBeGreaterThanOrEqual(4.5);
    });
});
