import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Vehicle from "../../../classes/vehicle";
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

// The radius of each pip drawn, as printed.
const pipRadii = (markup: string): number[] => [...markup.matchAll(/<circle[^>]* r="([\d.]+)"[^>]*fill="rgb\(255,255,255\)"/g)]
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

    it("draws pips large enough to read and mark", () => {
        const vehicle = tank("tracked", 50, true);
        const radii = pipRadii(draw(vehicle));
        expect(radii.length).toBeGreaterThan(0);
        // Drawn at 500 wide, every pip of a 50-ton tank's structure is at least 4.5 units across its radius.
        expect(Math.min(...radii)).toBeGreaterThanOrEqual(4.5);
    });
});
