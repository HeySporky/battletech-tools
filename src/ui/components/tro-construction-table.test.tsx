import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TroConstructionTable from "./tro-construction-table";

describe("TroConstructionTable", () => {
    it("draws the values and masses, and escapes labels", () => {
        const markup = renderToStaticMarkup(<TroConstructionTable rows={[{ label: "Engine", value: "280", mass: "16" }, { label: "<b>x</b>", indent: true }]} />);
        expect(markup).toContain("<td>280</td>");
        expect(markup).toContain("<td>16</td>");
        expect(markup).toContain("&lt;b&gt;x&lt;/b&gt;");
        expect(markup).not.toContain("<b>");
        expect(markup).toContain('class="indent"');
    });

    it("draws a heading row as a header cell", () => {
        expect(renderToStaticMarkup(<TroConstructionTable rows={[{ label: "Armor", heading: true }]} />)).toContain('<th colSpan="3">Armor</th>');
    });
});
