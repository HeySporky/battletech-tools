import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TechnicalReadout } from "../../classes/technical-readout";
import { ITroUnitAdapter } from "../../data/technical-readout-interfaces";
import TechnicalReadoutSheet from "./technical-readout-sheet";

const adapter: ITroUnitAdapter = {
    getComponentRows: () => [],
    getEquipmentCopies: () => [
        { uuid: "a", tag: "medium-laser", name: "Medium Laser", locationLabel: "LT" },
        { uuid: "b", tag: "medium-laser", name: "Medium Laser", locationLabel: "RT" },
    ],
    getKnownEquipmentUuids: () => ["a", "b"],
    getKnownEquipmentTags: () => ["medium-laser"],
    ensureEquipmentUuid: (copy) => copy.uuid,
    getSpecValues: () => ({ title: "Archer", subtitle: "ARC-2R, Inner Sphere, 70 tons", mass: "70 tons", cruisingSpeed: "43 kph", armorType: "Standard" }),
    getConstructionRows: () => [{ label: "Engine", value: "280", mass: "16" }],
};

const sheet = (tro: TechnicalReadout) => renderToStaticMarkup(<TechnicalReadoutSheet tro={tro} adapter={adapter} />);

describe("TechnicalReadoutSheet", () => {
    it("prints the power plant make and the armament line", () => {
        const tro = new TechnicalReadout();
        tro.setComponent("engine", "VOX 280");
        tro.setTypeMake("medium-laser", { manufacturer: "Diverse Optics" });
        const markup = sheet(tro);
        expect(markup).toContain("Power Plant:");
        expect(markup).toContain("VOX 280");
        expect(markup).toContain("Armament:");
        expect(markup).toContain("2 Diverse Optics Medium Laser");
    });

    it("prints the suggested make when none is entered, and the entered one over it", () => {
        const suggesting: ITroUnitAdapter = { ...adapter, getComponentRows: () => [{ key: "engine", label: "Engine", suggested: "Pitban 240" }] };
        const tro = new TechnicalReadout();
        expect(renderToStaticMarkup(<TechnicalReadoutSheet tro={tro} adapter={suggesting} />)).toContain("Pitban 240");
        tro.setComponent("engine", "VOX 240");
        const markup = renderToStaticMarkup(<TechnicalReadoutSheet tro={tro} adapter={suggesting} />);
        expect(markup).toContain("VOX 240");
        expect(markup).not.toContain("Pitban");
    });

    it("leaves out empty lines and sections but keeps the mass and the construction table", () => {
        const markup = sheet(new TechnicalReadout());
        expect(markup).not.toContain("Manufacturer:");
        expect(markup).not.toContain("Overview");
        expect(markup).toContain("Mass:");
        expect(markup).toContain("<td>280</td>");
        expect(markup).toContain("Armor:");
    });

    it("gives each blank-line-separated paragraph its own p", () => {
        const tro = new TechnicalReadout();
        tro.setText("overview", "Line one\n\nLine two");
        const markup = sheet(tro);
        expect(markup).toContain("<p>Line one</p>");
        expect(markup).toContain("<p>Line two</p>");
    });

    it("prints & and script tags literally", () => {
        const tro = new TechnicalReadout();
        tro.setProduction("manufacturer", "Smith & <script>alert(1)</script>");
        const markup = sheet(tro);
        expect(markup).toContain("Smith &amp; &lt;script&gt;alert(1)&lt;/script&gt;");
        expect(markup).not.toContain("<script>");
    });

    it("carries the trademark notice", () => {
        expect(sheet(new TechnicalReadout())).toContain("not published or endorsed by");
    });

    // The logo's default cream and gold are for dark headers and vanish on the white page (#373).
    it("draws the footer logo in ink, like the record sheets", () => {
        const markup = sheet(new TechnicalReadout());
        expect(markup).toContain("fill:rgb(0,0,0)");
        expect(markup).not.toContain("rgb(253,253,227)");
    });
});
