import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BattleMech } from "../../../classes/battlemech";
import { FW_POWER_ARMOR_RULESET } from "../../../data/future-wars-power-armor";
import { buildMech } from "../../../test-support/builders";
import BattleMechSVG from "./battlemech-svg";

/**
 * Power Armor plan, Chunk C (#172): a suit's record sheet. The FW #14 sample sheets are the standard 'Mech sheet with
 * six lines a location and "Pilot" in the waldo's four boxes; ours adds the Building Effects Table and a rules box.
 */
const build = (tonnage: number, rulesets: string[] = [FW_POWER_ARMOR_RULESET]): BattleMech =>
    buildMech({ type: "biped", tonnage, walk: 6, homebrew: rulesets });

const sheet = (mech: BattleMech, inPlay = false) => renderToStaticMarkup(<BattleMechSVG mechData={mech} inPlay={inPlay} />);

/** The text of one critical table, line by line. */
const locationLines = (markup: string, location: string): string[] => {
    const match = markup.match(new RegExp(`<g[^>]*data-crit-location="${location}"[^>]*>([\\s\\S]*?)</g>`));
    if (!match) throw new Error(`no table for ${location}`);
    return [...match[1].matchAll(/<text(?![^>]*data-testid)[^>]*>([^<]*)<\/text>/g)].map(m => m[1]);
};

describe("The Power Armor record sheet (#172)", () => {
    it("prints six lines a location, twelve in the center torso, with Pilot in head 3-4 and center torso 11-12", () => {
        const markup = sheet(build(10));
        for (const location of ["hd", "la", "ra", "lt", "rt", "ll", "rl"]) {
            expect(locationLines(markup, location)).toHaveLength(6);
        }
        const head = locationLines(markup, "hd");
        expect(head.slice(2, 4)).toEqual(["Pilot", "Pilot"]);
        const ct = locationLines(markup, "ct");
        expect(ct).toHaveLength(12);
        expect(ct.slice(10)).toEqual(["Pilot", "Pilot"]);
    });

    it("is headed POWER ARMOR, not BATTLEMECH", () => {
        const markup = sheet(build(15));
        expect(markup).toContain("POWER ARMOR");
        expect(markup).not.toMatch(/>\s*BATTLEMECH\s*</);
    });

    it("prints the suit's row of the Building Effects Table and the rules box", () => {
        const markup = sheet(build(15));
        const box = markup.match(/<g[^>]*data-testid="power-armor-box"[^>]*>([\s\S]*?)<\/g>/);
        expect(box).not.toBeNull();
        const text = [...box![1].matchAll(/>([^<]+)</g)].map(m => m[1]).join(" ");
        expect(text).toContain("BUILDING EFFECTS (15 TONS)");
        expect(text).toMatch(/Light\s+Medium\s+Heavy\s+Hardened/);
        expect(text).toMatch(/2\/0\s+3\/\+1\s+4\/\+2\s+5\/\+4/);
        expect(text).toContain("+1 to hit this suit");
        expect(text).not.toContain("No gyro");
        expect(markup).toContain("Gyro Hits");
    });

    it("a 5-ton suit has no gyro: no Gyro Hits boxes, and the pilot rule in the rules box", () => {
        const markup = sheet(build(5));
        expect(markup).not.toContain("Gyro Hits");
        expect(markup).toContain("No gyro: Piloting 3 or better");
        expect(markup).toMatch(/1\/0\s*<\/text>[\s\S]*2\/0/);
    });

    it("prints in play too", () => {
        expect(sheet(build(10), true)).toContain('data-testid="power-armor-box"');
    });

    it("a 'Mech without the ruleset keeps the BattleMech sheet", () => {
        const markup = sheet(build(10, []));
        expect(markup).toMatch(/>\s*BATTLEMECH\s*</);
        expect(markup).not.toContain("power-armor-box");
        expect(markup).toContain("Gyro Hits");
    });
});
