import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ARC_REGIONS, stretchRegions } from "./fighter-diagram-regions";
import FighterDiagramSVG from "./fighter-diagram-svg";
import { edgeDistance, insideShape } from "./shape-bubbles";

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
        // The aerodyne's nose runs from its tip (y 6) to the SI (y 160), stretched by 760 / 470.
        const nose = /data-arc="nose"[^]*?<polygon points="([^"]+)"/.exec(markup)![1].split(" ").map((pair) => +pair.split(",")[1]);
        expect(Math.min(...nose)).toBeCloseTo(6 * 760 / 470, 0);
        expect(Math.max(...nose)).toBeCloseTo(160 * 760 / 470, 0);
    });

    it("draws a solid silhouette behind the arcs on the record sheet", () => {
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
        // DamageCircleSVG draws its circle 3 inside the radius it is given: a bubble half its spacing across. An arc
        // with room for its bubbles (the wings, here) draws them at the widest spacing.
        const radius = (markup: string) => Math.max(...[...markup.matchAll(/<circle[^>]* r="([\d.]+)"/g)].map((match) => Number(match[1])));
        expect(radius(renderToStaticMarkup(<FighterDiagramSVG armor={armor} structuralIntegrity={8} />))).toBeCloseTo(20 / 2 - 3);
        expect(radius(renderToStaticMarkup(<FighterDiagramSVG armor={armor} structuralIntegrity={8} maxPipSpacing={24} />))).toBeCloseTo(24 / 2 - 3);
    });

    // Every bubble drawn wholly inside one of its arc's parts of the silhouette: a wing's bubbles in the wing.
    it.each(["fighter", "aerodyne", "spheroid", "airship", "satellite"] as const)("packs each arc's bubbles inside the %s silhouette's own shapes", (silhouette) => {
        for (const tall of [false, true]) {
            const heavy = { nose: 300, leftWing: 250, rightWing: 250, aft: 200 };
            const regions = tall ? stretchRegions(ARC_REGIONS[silhouette], 760 / 470) : ARC_REGIONS[silhouette];
            const markup = renderToStaticMarkup(<FighterDiagramSVG armor={tall ? heavy : armor} structuralIntegrity={20} silhouette={silhouette} tall={tall}
                thresholds={{ nose: 9, leftWing: 9, rightWing: 9, aft: 9 }} maxPipSpacing={24} />);
            for (const arc of ["nose", "leftWing", "rightWing", "aft", "si"] as const) {
                const group = new RegExp(`data-arc="${arc}"[^>]*>(.*?)</g>(?=<g|</svg>)`).exec(markup)![1];
                const bubbles = [...group.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)].map((match) => match.slice(1).map(Number));
                expect(bubbles).toHaveLength(arc === "si" ? 20 : (tall ? heavy : armor)[arc]);
                for (const [cx, cy, r] of bubbles) {
                    expect(regions[arc].parts.some((part) => insideShape(part, [cx, cy]) && edgeDistance(part, [cx, cy]) >= r - 0.2)).toBe(true);
                }
            }
        }
    });

    it("labels each arc with its damage threshold and total armor", () => {
        const markup = renderToStaticMarkup(<FighterDiagramSVG armor={armor} structuralIntegrity={8} thresholds={{ nose: 2, leftWing: 2, rightWing: 2, aft: 1 }} />);
        expect(markup).toContain("Nose (20)");
        expect(markup).toContain("Threshold 2");
        expect(markup).toContain("SI (8)");
    });
});
