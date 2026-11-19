import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../classes/battlemech";
import BattleMechSVG from "./battlemech-svg";

// "Circle the number before each of the critical slots the component takes up" (TO:AUE p.95) (#46).
describe("armored components on the record sheet", () => {
    it("circles the slot numbers of an armored component and no others", () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const mech = new BattleMech();
        mech.importSSWXML(readFileSync("src/utils/__fixtures__/violator-vt-u1.ssw", "utf8"));
        const armoredSlots = (markup: string) => (markup.match(/data-testid="armored-slot"/g) ?? []).length;

        expect(armoredSlots(renderToStaticMarkup(<BattleMechSVG mechData={mech} />))).toBe(1);

        mech.setComponentArmored("engine", true);
        // A standard engine: 6 center torso slots.
        expect(armoredSlots(renderToStaticMarkup(<BattleMechSVG mechData={mech} />))).toBe(7);
    });
});

// The sheet's pack line and Jumping MP (Maximum Tech pp.80-81; TO:AUE p.105).
describe("Jump pack on the record sheet", () => {
    const words = (mech: BattleMech) => renderToStaticMarkup(<BattleMechSVG mechData={mech} />).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    it("prints the pack note and its Jumping MP only with a pack strapped on", () => {
        const mech = new BattleMech();
        mech.setTonnage(55);
        mech.setWalkSpeed(5);
        mech.setRulesEdition("master-rules-revised");
        expect(words(mech)).not.toContain("Jump pack:");
        mech.setJumpPackTons(4);
        expect(words(mech)).toContain("Jump pack: 4 t, 10 hexes");
        expect(words(mech)).toContain("Jumping 5");
    });

    it("keeps the longest note, Total Warfare's, to the two lines above the cost", () => {
        const mech = new BattleMech();
        mech.setTonnage(55);
        mech.setWalkSpeed(6);
        mech.setRulesEdition("total-warfare");
        mech.setJumpPackTons(20);
        expect(renderToStaticMarkup(<BattleMechSVG mechData={mech} />).match(/data-testid="jump-pack-note"/g)).toHaveLength(2);
    });
});

// The sheet's EI note: an on/off box and the feedback reminder, each edition's own (Maximum Tech p.61; IO:AE p.69).
describe("Enhanced Imaging on the record sheet", () => {
    const eiMech = (edition: string) => {
        const mech = new BattleMech();
        mech.setRulesEdition(edition);
        mech.setTech("clan");
        mech.setEra("jihad");
        mech.setEnhancedImaging(true);
        return mech;
    };
    const sheet = (mech: BattleMech, inPlay = false) => renderToStaticMarkup(<BattleMechSVG mechData={mech} inPlay={inPlay} />);
    const words = (markup: string) => markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const marked = 'data-testid="ei-box" fill="rgb(0,0,0)"';

    it("prints the note and each edition's reminder only with the interface mounted", () => {
        expect(words(sheet(eiMech("master-rules-revised")))).toContain("Structure damage: roll 2D6, 7 or better or the pilot takes 1 damage (Maximum Tech p.61)");
        expect(words(sheet(eiMech("total-warfare")))).toContain("1 damage and a consciousness roll (IO:AE p.69)");
        expect(sheet(new BattleMech())).not.toContain("ei-box");
    });

    it("leaves the box blank on paper and marks it in play while EI is active", () => {
        const mech = eiMech("master-rules-revised");
        expect(sheet(mech)).not.toContain(marked);
        expect(sheet(mech, true)).toContain(marked);
        mech.enhancedImagingOff = true;
        expect(sheet(mech, true)).not.toContain(marked);
    });
});

// Maximum Tech p.62: the sheet still has to draw when the arms hold nothing.
describe("an armless 'Mech on the record sheet", () => {
    const sheet = (type: string, armless: boolean) => {
        const mech = new BattleMech();
        mech.setRulesEdition(type === "biped" ? "master-rules-revised" : "total-warfare");
        mech.setMechType(type);
        mech.setTonnage(50);
        mech.setArmless(armless);
        return renderToStaticMarkup(<BattleMechSVG mechData={mech} />);
    };

    it.each(["biped", "tripod"])("draws no arms on a %s, and notes the play rules", (type) => {
        const withArms = sheet(type, false);
        expect(withArms).toContain("LEFT ARM");
        expect(withArms).toContain("Hand Actuator");
        expect(withArms).not.toContain("armless-outline");
        const markup = sheet(type, true);
        expect(markup).not.toContain("LEFT ARM");
        expect(markup).not.toContain("RIGHT ARM");
        expect(markup).not.toContain("ARM [");
        expect(markup).not.toContain("Shoulder");
        expect(markup).not.toContain("Hand Actuator");
        // Armor, structure and damage transfer outlines.
        expect((markup.match(/armless-outline/g) ?? []).length).toBeGreaterThanOrEqual(3);
        expect(markup).toContain("Standing: +4 Piloting");
    });
});
