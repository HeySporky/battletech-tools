import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HeatTrackSVG from "./heat-track-svg";

// The Total Warfare 'Mech record sheet's heat scale: an Overflow box, then 30 at the top down to 0.
describe("heat scale", () => {
    const markup = renderToStaticMarkup(<svg><HeatTrackSVG xLoc={0} yLoc={0} /></svg>);
    const numbers = [...markup.matchAll(/>(\d+)</g)].map((match) => Number(match[1]));

    it("runs from 30 at the top down to 0", () => {
        expect(numbers).toEqual(Array.from({ length: 31 }, (_, i) => 30 - i));
    });

    it("has an Overflow box above 30", () => {
        expect(markup).toContain(">Overflow<");
        const overflowY = Number(/y="([\d.]+)"[^>]*>Overflow</.exec(markup)![1]);
        const thirtyY = Number(/y="([\d.]+)"[^>]*>30</.exec(markup)![1]);
        expect(overflowY).toBeLessThan(thirtyY);
    });

    it("marks the heat levels with effects", () => {
        expect((markup.match(/>\*</g) ?? []).length).toBe(17);
    });
});
