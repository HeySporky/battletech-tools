import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import InfantryPlatoon from "../../../classes/infantry-platoon";
import InfantryRecordSheet from "../infantry-record-sheet";
import InfantryRecordSheetSVG, { infantrySheetLines } from "./infantry-record-sheet-svg";

const sample = (name = "Test Platoon"): InfantryPlatoon => {
    const platoon = new InfantryPlatoon();
    platoon.setName(name);
    return platoon;
};

const render = (platoons: InfantryPlatoon[], showDamage = false) =>
    renderToStaticMarkup(<InfantryRecordSheetSVG lines={infantrySheetLines(platoons)} showDamage={showDamage} />);

describe("Conventional infantry record sheet", () => {
    it("prints four platoon blocks and the tables an infantry player needs", () => {
        const markup = render([sample()]);
        expect(markup).toContain("CONVENTIONAL INFANTRY RECORD SHEET");
        for (const n of [1, 2, 3, 4]) expect(markup).toContain(`CONVENTIONAL INFANTRY: PLATOON/POINT ${n}`);
        for (const table of ["LEG ATTACKS TABLE", "SWARM ATTACKS TABLE", "SWARM ATTACK MODIFIERS TABLE", "NON-INFANTRY WEAPON DAMAGE AGAINST INFANTRY TABLE",
            "BURST-FIRE WEAPON DAMAGE VS. CONVENTIONAL INFANTRY TABLE", "Damage Value / 10 + 2", "Automatic Grenade Launcher", "16-17**", "No attack possible"]) {
            expect(markup).toContain(table);
        }
    });

    it("fills the first block from the design and leaves the rest to write in", () => {
        const platoon = sample();
        const markup = render([platoon]);
        expect(markup).toContain("Test Platoon");
        expect(markup).toContain(platoon.getPrimaryWeapon().name);
        expect(markup).toContain('data-testid="inf-platoon-1" data-blank="false"');
        expect(markup).toContain('data-testid="inf-platoon-2" data-blank="true"');
        // Thirty trooper boxes; those past the platoon's 28 troopers are blacked out.
        expect(markup.match(/data-testid="inf-platoon-1-trooper-\d+"/g)).toHaveLength(30);
        expect(markup.match(/data-testid="inf-platoon-1-trooper-\d+" data-excess="true"/g)).toHaveLength(2);
        // The Max Weapon Damage under each trooper.
        expect(markup).toContain(`data-testid="inf-platoon-1-damage-28" data-value="${platoon.getDamageForTroopers(28)}"`);
        // Range boxes past the platoon's reach are blacked out.
        const max = platoon.getMaxRange();
        expect(markup).toContain(`data-testid="inf-platoon-1-range-${max}" data-reach="true"`);
        expect(markup).toContain(`data-testid="inf-platoon-1-range-${max + 1}" data-reach="false"`);
    });

    it("gives each sub-platoon of an oversized platoon its own block", () => {
        const platoon = sample();
        platoon.setSquads(10);
        expect(platoon.getSubPlatoons()).toHaveLength(3);
        const markup = render([platoon]);
        for (const n of [1, 2, 3]) expect(markup).toContain(`data-testid="inf-platoon-${n}" data-blank="false"`);
        expect(markup).toContain("Sub-platoon 3 of 3");
    });

    it("crosses off troopers lost in play", () => {
        const platoon = sample();
        platoon.setLineTroopers(0, 25);
        expect(render([platoon])).not.toContain('data-hit="filled"');
        expect(render([platoon], true).match(/data-hit="filled"/g)).toHaveLength(3);
    });

    it("is the sheet the creator and the roster print, four lines to a page", () => {
        const markup = renderToStaticMarkup(<InfantryRecordSheet platoons={[sample("One"), sample("Two"), sample("Three"), sample("Four"), sample("Five")]} />);
        expect(markup.match(/CONVENTIONAL INFANTRY RECORD SHEET/g)).toHaveLength(2);
        expect(markup).toContain("Five");
    });
});
