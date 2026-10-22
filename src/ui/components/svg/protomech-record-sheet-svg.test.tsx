import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProtoMech from "../../../classes/protomech";
import ProtoMechRecordSheet from "../protomech-record-sheet";
import ProtoMechRecordSheetSVG, { protoMechSheetUnits } from "./protomech-record-sheet-svg";

const sample = (name = "Delphyne-2"): ProtoMech => {
    const proto = new ProtoMech();
    proto.setName(name);
    proto.setTons(9);
    proto.setWalkMP(5);
    proto.setJump("standard", 5);
    proto.setArmor("torso", 16);
    proto.setArmor("head", 6);
    proto.setArmor("la", 4);
    proto.setArmor("ra", 4);
    proto.setArmor("legs", 10);
    proto.addMount("er-micro-laser", "la");
    proto.addMount("er-micro-laser", "ra");
    proto.addMount("pm-srm", "torso", 3);
    proto.addMount("pm-srm", "torso", 3);
    return proto;
};

const render = (protos: ProtoMech[], showDamage = false) =>
    renderToStaticMarkup(<ProtoMechRecordSheetSVG units={protoMechSheetUnits(protos)} showDamage={showDamage} />);

describe("ProtoMech record sheet", () => {
    it("prints a Point of five ProtoMechs with their hit location and critical hit tables", () => {
        const proto = sample();
        const markup = render([proto]);
        expect(markup).toContain("PROTOMECH RECORD SHEET");
        for (const n of [1, 2, 3, 4, 5]) {
            expect(markup).toContain(`PROTOMECH ${n}`);
            expect(markup).toContain(`data-testid="proto-unit-${n}" data-blank="false"`);
        }
        for (const label of ["WEAPONS INVENTORY", "HIT LOCATIONS AND CRITICAL HITS", "PILOT DATA", "ARMOR DIAGRAM", "Delphyne-2", "6,7,8", "Proto Destroyed", "Near Miss"]) {
            expect(markup).toContain(label);
        }
        // The torso weapon roll names the weapons (TW p.185).
        expect(markup).toContain(`1-2: ${proto.getWeaponLines()[2].name}`);
        // A circle for each point of armor and structure.
        expect(markup).toContain(`data-testid="proto-unit-1-torso" data-armor="16" data-structure="${proto.getStructure("torso")}"`);
    });

    it("leaves blocks past the Point to write in", () => {
        const proto = sample();
        proto.setPointSize(3);
        const markup = render([proto]);
        expect(markup).toContain('data-testid="proto-unit-3" data-blank="false"');
        expect(markup).toContain('data-testid="proto-unit-4" data-blank="true"');
    });

    it("sends a quad's arm hits to the legs and lists its own torso weapon roll (IO:AE pp.93-94)", () => {
        const proto = sample();
        proto.setChassis("quad");
        const markup = render([proto]);
        expect(markup).toContain("4,5,9,10");
        expect(markup).not.toContain("Right Arm Destroyed");
    });

    it("fills in damage marked in play", () => {
        const proto = sample();
        proto.setLocationDamage(0, "head", 2);
        proto.setPilotHits(0, 1);
        expect(render([proto])).not.toContain('data-hit="filled"');
        expect(render([proto], true).match(/data-hit="filled"/g)).toHaveLength(3);
    });

    it("is the sheet the creator and the roster print, five ProtoMechs to a page", () => {
        const markup = renderToStaticMarkup(<ProtoMechRecordSheet protos={[sample("One"), sample("Two")]} />);
        expect(markup.match(/PROTOMECH RECORD SHEET/g)).toHaveLength(2);
        expect(markup).toContain("Two");
    });
});
