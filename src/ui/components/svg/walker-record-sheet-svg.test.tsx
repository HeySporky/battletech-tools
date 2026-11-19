import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Walker from "../../../classes/walker";
import { WALKER_HIT_TABLE, WALKER_LOCATIONS } from "../../../data/walker-construction";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../../data/rules-level-options";
import WalkerRecordSheet from "../walker-record-sheet";
import WalkerRecordSheetSVG from "./walker-record-sheet-svg";

// The walker record sheet (#172, Chunk E): built through the class, rendered to markup, read back by test id.

const build = (tons: number, walk: number, edition: "best-of-1991" | "future-wars-11" = "best-of-1991", variant = false): Walker => {
    const walker = new Walker();
    walker.setEdition(edition);
    expect(walker.setTons(tons)).toBe(true);
    expect(walker.setWalkMP(walk)).toBe(true);
    walker.setName(`Test ${tons}`);
    for (const location of WALKER_LOCATIONS) walker.setArmor(location, Math.min(walker.getMaxArmor(location), 12));
    if (variant) walker.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, [edition === "best-of-1991" ? "best-of-future-wars-construction" : "future-wars-11-construction"]);
    return walker;
};
const count = (markup: string, pattern: RegExp): number => (markup.match(pattern) ?? []).length;
const render = (walker: Walker): string => renderToStaticMarkup(<WalkerRecordSheetSVG walker={walker} />);

describe("Walker record sheet", () => {
    it("prints a circle for every armor and structure point of the ten locations, and six pilot boxes", () => {
        const walker = build(50, 4);
        const markup = render(walker);
        for (const location of WALKER_LOCATIONS) {
            expect(count(markup, new RegExp(`data-testid="walker-armor-${location}-\\d+"`, "g")), location).toBe(walker.getArmor(location));
            expect(count(markup, new RegExp(`data-testid="walker-structure-${location}-\\d+"`, "g")), location).toBe(walker.getStructure(location));
        }
        expect(count(markup, /data-testid="walker-pilot-\d"/g)).toBe(6);
    });

    it("lays out every slot of every location under the standard slot system and under the variant's", () => {
        for (const variant of [false, true]) {
            for (const tons of [20, 50, 70, 100]) {
                const walker = build(tons, 3, "best-of-1991", variant);
                const markup = render(walker);
                for (const location of WALKER_LOCATIONS) {
                    expect(count(markup, new RegExp(`data-testid="walker-slot-${location}-\\d+"`, "g")), `${tons} t ${location} variant=${variant}`).toBe(walker.getSlotCount(location));
                }
            }
        }
    });

    it("renders in both editions and names the printing in the credit and the footer", () => {
        for (const edition of ["best-of-1991", "future-wars-11"] as const) {
            const walker = build(50, 4, edition);
            const markup = render(walker);
            expect(markup).toContain("NOT OFFICIAL");
            expect(markup).toContain(walker.getEditionRules().name);
            expect(markup).toContain("Clell Flint");
        }
    });

    it("prints the printed anti-infantry to-hit for the edition (8 in the Best-of, 0 in #11)", () => {
        const best = build(50, 4, "best-of-1991");
        const eleven = build(50, 4, "future-wars-11");
        expect(render(best)).toContain("base to-hit 8, -2");
        expect(render(eleven)).toContain("base to-hit 0, -2");
    });

    it("prints the hit location table row by row, the six arcs and the heat scale", () => {
        const markup = render(build(50, 4));
        expect(count(markup, /data-testid="walker-hit-\d+"/g)).toBe(WALKER_HIT_TABLE.length);
        expect(markup).toContain("Rr/(Fr) Rt Leg");
        expect(markup).toContain("CS Critical");
        expect(count(markup, /data-testid="walker-arc-\d"/g)).toBe(6);
        expect(markup).toContain("Shut down");
        expect(markup).toContain("-2 Move");
    });

    it("prints Walk with the x 1.25, the heat sinks, the turret and the weapons with their locations", () => {
        const walker = build(50, 4);
        walker.setTurret(true);
        expect(walker.addEquipment("medium-laser", "cs", true).added).toBe(true);
        expect(walker.addEquipment("machine-gun", "ct").added).toBe(true);
        const markup = render(walker);
        expect(markup).toContain(`${walker.getWalkerWalkMP()} / ${walker.getRunMP()} / ${walker.getJumpMP()}`);
        expect(walker.getWalkerWalkMP()).toBe(5);
        expect(markup).toContain("Medium Laser");
        expect(markup).toContain("CS (T)");
        expect(markup).toContain("Machine Gun *");
        expect(markup).toContain("turret");
    });

    it("prints the cost and the provisional Battle Value", () => {
        const walker = build(50, 4);
        const markup = render(walker);
        expect(markup).toContain(walker.getCBillCost().toLocaleString("en-US"));
        expect(markup).toContain(`${walker.getBattleValue().toLocaleString("en-US")} (provisional)`);
    });

    it("titles an industrial walker as one", () => {
        const walker = build(40, 3);
        walker.setIndustrial(true);
        expect(render(walker)).toContain("INDUSTRIAL WALKER RECORD SHEET");
    });

    it("wraps each design in a page of its own", () => {
        const markup = renderToStaticMarkup(<WalkerRecordSheet walkers={[build(30, 5), build(90, 2)]} />);
        expect(count(markup, /class="print-page"/g)).toBe(2);
        expect(count(markup, /data-testid="walker-record-sheet-svg"/g)).toBe(2);
    });
});
