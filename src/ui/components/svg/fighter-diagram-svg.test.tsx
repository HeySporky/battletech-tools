import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FighterDiagramSVG from "./fighter-diagram-svg";

const armor = { nose: 20, leftWing: 15, rightWing: 15, aft: 10 };

describe("fighter armor diagram", () => {
    it("stands alone, scaled to the page, when not placed", () => {
        const markup = renderToStaticMarkup(<FighterDiagramSVG armor={armor} structuralIntegrity={8} />);
        expect(markup).toMatch(/^<svg[^>]*style="/);
        expect(markup).not.toMatch(/^<svg[^>]* x="/);
    });

    it("is placed at x, y inside a record sheet's SVG", () => {
        const markup = renderToStaticMarkup(<svg><FighterDiagramSVG armor={armor} structuralIntegrity={8} x={900} y={500} width={1000} /></svg>);
        const inner = /<svg<svg[^>]*>|<svg [^>]*viewBox="0 0 600 470"[^>]*>/.exec(markup)![0];
        expect(inner).toContain('x="900"');
        expect(inner).toContain('y="500"');
        expect(inner).toContain('height="783"');
        expect(inner).not.toContain("style=");
    });

    it("stands taller for a DropShip, its arcs given the extra height", () => {
        const markup = renderToStaticMarkup(<svg><FighterDiagramSVG armor={armor} structuralIntegrity={8} x={0} y={0} width={600} tall silhouette="aerodyne" /></svg>);
        expect(markup).toContain('viewBox="0 0 600 760"');
        expect(markup).toContain('height="760"');
        expect(markup).toMatch(/<rect x="215" y="20" width="170" height="230"/);
    });

    it("draws a solid silhouette behind the boxes on the record sheet", () => {
        const markup = renderToStaticMarkup(<FighterDiagramSVG armor={armor} structuralIntegrity={8} silhouette />);
        expect(markup).toContain('data-testid="fighter-silhouette"');
        expect(renderToStaticMarkup(<FighterDiagramSVG armor={armor} structuralIntegrity={8} />)).not.toContain("fighter-silhouette");
    });

    it("draws a Small Craft's own silhouette for its shape", () => {
        const aerodyne = renderToStaticMarkup(<FighterDiagramSVG armor={armor} structuralIntegrity={8} silhouette="aerodyne" />);
        expect(aerodyne).toContain('data-testid="aerodyne-silhouette"');
        expect(aerodyne).not.toContain("fighter-silhouette");
        const spheroid = renderToStaticMarkup(<FighterDiagramSVG armor={armor} structuralIntegrity={8} silhouette="spheroid" />);
        expect(spheroid).toContain('data-testid="spheroid-silhouette"');
        expect(spheroid).not.toContain("aerodyne-silhouette");
    });

    it("draws larger pips when given room, as a printed sheet does, and keeps play mode's size otherwise", () => {
        // DamageCircleSVG draws its circle 3 inside the radius it is given.
        const radius = (markup: string) => Number(/<circle[^>]* r="([\d.]+)"/.exec(markup)![1]);
        expect(radius(renderToStaticMarkup(<FighterDiagramSVG armor={armor} structuralIntegrity={8} />))).toBeCloseTo(14 * 0.42 - 3);
        expect(radius(renderToStaticMarkup(<FighterDiagramSVG armor={armor} structuralIntegrity={8} maxPipSpacing={24} />))).toBeCloseTo(24 * 0.42 - 3);
    });

    it("labels each arc with its damage threshold and total armor", () => {
        const markup = renderToStaticMarkup(<FighterDiagramSVG armor={armor} structuralIntegrity={8} thresholds={{ nose: 2, leftWing: 2, rightWing: 2, aft: 1 }} />);
        expect(markup).toContain("Nose (20)");
        expect(markup).toContain("Threshold 2");
        expect(markup).toContain("Structural Integrity (8)");
    });
});
