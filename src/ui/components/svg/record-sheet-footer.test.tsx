import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AlphaStrikeUnit } from "../../../classes/alpha-strike-unit";
import { BattleMech } from "../../../classes/battlemech";
import Vehicle from "../../../classes/vehicle";
import type { IAppGlobals } from "../../app-router";
import TrademarkNoticeParagraphs from "../trademark-notice";
import AlphaStrikePrintUnitSVG from "./alpha-strike-print-unit";
import BattleMechSVG from "./battlemech-svg";
import { CARD_NOTICE, sheetFooter, TRADEMARK_NOTICE } from "./record-sheet-svg-kit";
import VehicleRecordSheetSVG from "./vehicle-record-sheet-svg";

// Rendered markup puts an apostrophe in as &#x27; and an ampersand as &amp;.
const text = (markup: string) => markup.replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
const year = new Date().getFullYear();

// The notice MegaMekLab and Solaris Skunk Werks print, as on the official Total Warfare sheets, with the year filled in.
const TOPPS = `© ${year} The Topps Company, Inc. Classic BattleTech, BattleTech, 'Mech and BattleMech are trademarks of The Topps Company, Inc. All rights reserved.`;
// Fan tools like ours build on the permission the publishers give the community (user ruling 2026-10-22).
const CGL = "Catalyst Game Labs and the Catalyst Game Labs logo are trademarks of InMediaRes Productions, LLC. Used with permission.";

describe("record sheet trademark footer (user ruling 2026-10-22: the logo goes on the sheets)", () => {
    it("gives the notice in the official sheets' wording, this year", () => {
        expect(TRADEMARK_NOTICE(year)).toEqual([TOPPS, CGL]);
    });

    it("puts the BattleTech logo and the notice on the shared footer", () => {
        const markup = text(renderToStaticMarkup(<svg>{sheetFooter("Tables: TW p.1.")}</svg>));
        expect(markup).toContain('data-testid="battletech-logo"');
        expect(markup).toContain(TOPPS);
        expect(markup).toContain(CGL);
        expect(markup).toContain("Tables: TW p.1.");
        expect(markup).toContain("Created with Jeff's BattleTech Tools IIC");
    });

    it("says it is used with permission, does not grant photocopy permission, and is not endorsed", () => {
        for (const markup of [
            text(renderToStaticMarkup(<svg>{sheetFooter("Tables: TW p.1.")}</svg>)),
            text(renderToStaticMarkup(<BattleMechSVG mechData={new BattleMech()} />)),
        ]) {
            expect(markup).not.toContain("Permission to photocopy");
            expect(markup).toContain("Used with permission.");
            expect(markup).toContain("not published or endorsed by");
        }
    });

    it("prints the logo and notice on the Combat Vehicle sheet", () => {
        const markup = text(renderToStaticMarkup(<VehicleRecordSheetSVG vehicle={new Vehicle()} />));
        expect(markup).toContain('data-testid="battletech-logo"');
        expect(markup).toContain(TOPPS);
    });

    it("prints the notice in full in a printed page's footer", () => {
        const markup = text(renderToStaticMarkup(<TrademarkNoticeParagraphs />));
        expect(markup).toContain(`<p>${TOPPS}</p>`);
        expect(markup).toContain(`<p>${CGL}</p>`);
        expect(markup).toContain("not published or endorsed by");
    });

    it("gives the About page the same notice, as the site's (user ruling 2026-10-22)", () => {
        const markup = text(renderToStaticMarkup(<TrademarkNoticeParagraphs subject="site" />));
        expect(markup).toContain(`<p>${TOPPS}</p>`);
        expect(markup).toContain(`<p>${CGL}</p>`);
        expect(markup).toContain("<p>This site is not published or endorsed by The Topps Company, Inc. or Catalyst Game Labs.</p>");
    });

    it("prints the short notice down an Alpha Strike card's edge, with permission", () => {
        const unit = new AlphaStrikeUnit();
        unit.name = "Atlas";
        unit.type = "BM";
        const appGlobals = { appSettings: {} } as unknown as IAppGlobals;
        const markup = text(renderToStaticMarkup(<AlphaStrikePrintUnitSVG asUnit={unit} appGlobals={appGlobals} measurementsInHexes={false} />));
        expect(CARD_NOTICE(year)).toBe(`© ${year} The Topps Company, Inc. All rights reserved. Used with permission.`);
        expect(markup).toContain(CARD_NOTICE(year));
        expect(markup).not.toContain("©2018");
    });

    it("prints the same notice on the 'Mech sheet, under its logo", () => {
        const markup = text(renderToStaticMarkup(<BattleMechSVG mechData={new BattleMech()} />));
        expect(markup).toContain(TOPPS);
        expect(markup).toContain(CGL);
        expect(markup).not.toContain("Neither Topps nor Catalyst Game Labs makes no");
    });
});

describe("the 'Mech sheet's app name (issue 16)", () => {
    it("puts \"Created with\" on its own line and the name at 14 points, so the beta site's longer name clears the notices", () => {
        const markup = text(renderToStaticMarkup(<BattleMechSVG mechData={new BattleMech()} />));
        expect(markup).toMatch(/>\s*Created with\s*<\/text>/);
        expect(markup).toMatch(/font-size="14"[^>]*>\s*Jeff's BattleTech Tools IIC\s*<\/text>/);
    });
});
