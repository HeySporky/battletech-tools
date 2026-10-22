import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BattleArmor from "../../../classes/battle-armor";
import BattleArmorRecordSheet from "../battle-armor-record-sheet";
import BattleArmorRecordSheetSVG from "./battle-armor-record-sheet-svg";

const sample = (name = "Test Suit"): BattleArmor => {
    const suit = new BattleArmor();
    suit.setName(name);
    suit.setWeightClass("medium");
    suit.setMotive("jump", 3);
    suit.setArmorPoints(6);
    suit.addItem("is-er-small-laser", "ra");
    suit.setSquadSize(4);
    return suit;
};

const render = (squads: BattleArmor[], showDamage = false) => renderToStaticMarkup(<BattleArmorRecordSheetSVG squads={squads} showDamage={showDamage} />);

describe("Battle armor record sheet", () => {
    it("prints five squad blocks and the tables the Total Warfare sheet prints", () => {
        const markup = render([sample()]);
        expect(markup).toContain("BATTLE ARMOR RECORD SHEET");
        for (const n of [1, 2, 3, 4, 5]) expect(markup).toContain(`BATTLE ARMOR: SQUAD/POINT ${n}`);
        for (const table of ["LEG ATTACKS TABLE", "SWARM ATTACKS TABLE", "SWARM ATTACK MODIFIERS TABLE", "SWARM ATTACKS HIT LOCATION TABLE",
            "TRANSPORT POSITIONS TABLE", "Claws with magnets", "Rear Center Torso", "LARGE SUPPORT", "Right Torso (rear)"]) {
            expect(markup).toContain(table);
        }
    });

    it("fills the first block from the design and leaves the rest to write in", () => {
        const suit = sample();
        const markup = render([suit]);
        expect(markup).toContain("Test Suit");
        expect(markup).toContain("ER Small Laser");
        expect(markup).toContain(">Jump 3<");
        expect(markup).toContain('data-testid="ba-squad-1" data-blank="false"');
        expect(markup).toContain('data-testid="ba-squad-2" data-blank="true"');
        // One row per trooper: the trooper circle and a circle for each armor point.
        expect(markup.match(/data-testid="ba-squad-1-trooper-\d" data-count="6"/g)).toHaveLength(4);
    });

    it("puts several squads on one page", () => {
        const markup = render([sample("First Suit"), sample("Second Suit")]);
        expect(markup).toContain("First Suit");
        expect(markup).toContain("Second Suit");
        expect(markup).toContain('data-testid="ba-squad-2" data-blank="false"');
    });

    it("fills in damage marked in play", () => {
        const suit = sample();
        suit.setTrooperDamage(0, 2);
        suit.setTrooperDamage(1, 7);
        expect(render([suit])).not.toContain('data-hit="filled"');
        // Two armor points on trooper 1; all six and the trooper on trooper 2.
        expect(render([suit], true).match(/data-hit="filled"/g)).toHaveLength(2 + 7);
    });

    it("is the sheet the creator and the roster print", () => {
        expect(renderToStaticMarkup(<BattleArmorRecordSheet squads={[sample()]} />)).toContain("BATTLE ARMOR RECORD SHEET");
    });
});
