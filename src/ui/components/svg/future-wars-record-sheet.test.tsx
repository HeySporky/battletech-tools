import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../classes/battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../../data/rules-level-options";
import BattleMechSVG from "./battlemech-svg";

/**
 * Compact 'Mechs plan, Chunk D (#172): Clell Flint's slot counts on the record sheet. Our rule (no text for bipeds):
 * a location's slots print in tables of six, the last one short; more than one table gets the die numbers that pick it.
 */
const BEST_OF = "best-of-future-wars-construction";

const build = (tonnage: number, rulesets: string[] = [BEST_OF]): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-ages");
    mech.setTonnage(tonnage);
    mech.setWalkSpeed(4);
    mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL, rulesets });
    return mech;
};

const sheet = (mech: BattleMech, inPlay = false) => renderToStaticMarkup(<BattleMechSVG mechData={mech} inPlay={inPlay} />);

/** The table labels and die numbers printed for one location, in order. */
function locationTable(markup: string, location: string): { tables: string[]; dieNumbers: string[] } {
    const match = markup.match(new RegExp(`<g[^>]*data-crit-location="${location}"[^>]*>([\\s\\S]*?)</g>`));
    if (!match) throw new Error(`no table for ${location}`);
    const texts = (testid: string) => [...match[1].matchAll(new RegExp(`<text[^>]*data-testid="${testid}"[^>]*>([^<]*)</text>`, "g"))].map(m => m[1]);
    return { tables: texts("crit-table-dice"), dieNumbers: texts("crit-line-die") };
}

describe("Future Wars construction on the record sheet (#172)", () => {
    it("prints a 20-slot center torso as four tables of six, six, six and two, each with its die number", () => {
        const markup = sheet(build(100));
        const ct = locationTable(markup, "ct");
        expect(ct.tables).toEqual(["1", "2", "3", "4"]);
        expect(ct.dieNumbers).toEqual(["1.", "2.", "3.", "4.", "5.", "6.", "1.", "2.", "3.", "4.", "5.", "6.", "1.", "2.", "3.", "4.", "5.", "6.", "1.", "2."]);
    });

    it("prints a 16-slot leg as three tables picked by 1-2, 3-4 and 5-6", () => {
        const ll = locationTable(sheet(build(100)), "ll");
        expect(ll.tables).toEqual(["1-2", "3-4", "5-6"]);
        expect(ll.dieNumbers).toHaveLength(16);
    });

    it("prints a 5-slot head as one table with no table roll", () => {
        const hd = locationTable(sheet(build(35)), "hd");
        expect(hd.tables).toEqual([]);
        expect(hd.dieNumbers).toEqual(["1.", "2.", "3.", "4.", "5."]);
    });

    it("prints an 8-slot head as two tables, 1-3 and 4-6, the second two lines long", () => {
        const hd = locationTable(sheet(build(100)), "hd");
        expect(hd.tables).toEqual(["1-3", "4-6"]);
        expect(hd.dieNumbers).toEqual(["1.", "2.", "3.", "4.", "5.", "6.", "1.", "2."]);
    });

    it("keeps an assault 'Mech's tables inside the Critical Hit Table box", () => {
        const markup = sheet(build(100));
        // The box runs from y 1250 to 2465 on the sheet; every die number must sit inside it.
        const ys = [...markup.matchAll(/<text[^>]*data-testid="crit-line-die"[^>]*>/g)].map(m => Number(m[0].match(/ y="([\d.]+)"/)![1]));
        expect(ys.length).toBeGreaterThan(0);
        expect(Math.max(...ys)).toBeLessThanOrEqual(2465);
        expect(Math.min(...ys)).toBeGreaterThanOrEqual(1250);
    });
});

describe("a standard 'Mech's record sheet is unchanged (#172)", () => {
    it.each([
        ["a 50-ton biped", () => { const mech = new BattleMech(); mech.setTonnage(50); mech.setWalkSpeed(5); return mech; }],
        ["a 75-ton quad", () => { const mech = new BattleMech(); mech.setMechType("quad"); mech.setTonnage(75); mech.setWalkSpeed(4); return mech; }],
        ["the Violator fixture", () => {
            vi.spyOn(console, "error").mockImplementation(() => undefined);
            vi.spyOn(console, "warn").mockImplementation(() => undefined);
            const mech = new BattleMech();
            mech.importSSWXML(readFileSync("src/utils/__fixtures__/violator-vt-u1.ssw", "utf8"));
            return mech;
        }],
    ])("%s: the Critical Hit Table", (_name, make) => {
        const markup = sheet(make());
        // The critical hit table group box only, so unrelated sheet changes do not move this snapshot.
        const start = markup.indexOf("CRITICAL HIT TABLE");
        expect(start).toBeGreaterThan(-1);
        expect(markup.slice(start).replace(/ data-crit-location="[a-z]+"| data-testid="crit-(line-die|table-dice)"/g, "")).toMatchSnapshot();
    });
});
