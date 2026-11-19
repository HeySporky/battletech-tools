import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MicroMech from "../../../classes/micro-mech";
import MicroMechRecordSheet from "../micro-mech-record-sheet";
import MicroMechRecordSheetSVG from "./micro-mech-record-sheet-svg";

// The document's Storm STM-3X (biped) and a quad of the Hillman's size, built through the class.
const storm = (): MicroMech => {
    const micro = new MicroMech();
    micro.setTons(11);
    micro.setWalkMP(6);
    micro.setJumpJets(6);
    micro.setName("Storm STM-3X");
    micro.setArmor("head", 4);
    micro.setArmor("torso", 16);
    micro.setArmor("torsoRear", 6);
    micro.setArmor("la", 4);
    micro.setArmor("ra", 4);
    micro.setArmor("ll", 6);
    micro.setArmor("rl", 6);
    micro.addMount("micro-er-laser-small", "ra");
    micro.addMount("micro-machine-gun", "la");
    micro.setAmmo(1, 500, "torso");
    return micro;
};
const hillman = (): MicroMech => {
    const micro = new MicroMech();
    micro.setLayout("quad");
    micro.setTons(15);
    micro.setWalkMP(5);
    micro.setName("Hillman HMN-2X");
    micro.setArmor("head", 4);
    micro.setArmor("torso", 14);
    micro.setArmor("torsoRear", 4);
    micro.setArmor("fll", 6);
    micro.setArmor("frl", 6);
    micro.setArmor("ll", 6);
    micro.setArmor("rl", 6);
    micro.addMount("micro-srm-2", "torso");
    return micro;
};
const count = (markup: string, pattern: RegExp): number => (markup.match(pattern) ?? []).length;
const render = (micro: MicroMech): string => renderToStaticMarkup(<MicroMechRecordSheetSVG micro={micro} />);

describe("Micro-Mech record sheet (#173, Chunk E)", () => {
    it("prints the Storm: a circle for every armor and structure point, the cockpit's 3, six pilot boxes", () => {
        const micro = storm();
        const markup = render(micro);
        for (const location of micro.getLocations()) {
            expect(count(markup, new RegExp(`data-testid="micro-armor-${location}-\\d+"`, "g")), location).toBe(micro.getArmor(location));
            if (location !== "torsoRear") expect(count(markup, new RegExp(`data-testid="micro-structure-${location}-\\d+"`, "g")), location).toBe(micro.getStructure(location));
        }
        expect(count(markup, /data-testid="micro-cockpit-\d+"/g)).toBe(3);
        expect(count(markup, /data-testid="micro-pilot-\d"/g)).toBe(6);
    });

    it("prints the data, the weapons with ammunition, the credit and the NOT OFFICIAL mark, and no heat scale", () => {
        const markup = render(storm());
        expect(markup).toContain("Storm STM-3X");
        expect(markup).toContain("6 / 9 / 6");
        expect(markup).toContain("ER Laser, Small");
        expect(markup).toContain("Machine Gun");
        expect(markup).toContain("Ammo: Machine Gun");
        expect(markup).toContain("NOT OFFICIAL");
        expect(markup).toContain("Micro-Mechs by Solarmech");
        expect(markup).toContain("695,853");
        expect(markup).not.toMatch(/HEAT DATA|HEAT SCALE/);
    });

    it("lays the slots out with the die ranges: head 1-3 / 4-6, limbs 1-2 / 3-4 / 5-6, torso in two columns of six", () => {
        const micro = storm();
        const markup = render(micro);
        const slots = (location: string) => count(markup, new RegExp(`data-testid="micro-slot-${location}-\\d+"`, "g"));
        expect(slots("head")).toBe(2);
        expect(slots("torso")).toBe(12);
        for (const location of ["la", "ra", "ll", "rl"]) expect(slots(location), location).toBe(3);
        const part = (from: string, to: string) => markup.slice(markup.indexOf(`data-testid="micro-slots-${from}"`), markup.indexOf(`data-testid="micro-slots-${to}"`));
        const head = part("head", "torso");
        expect(head).toContain(">1-3<");
        expect(head).toContain(">4-6<");
        const arm = part("la", "ra");
        for (const band of ["1-2", "3-4", "5-6"]) expect(arm).toContain(`>${band}<`);
        expect(markup).toContain('data-item="Ammo (Machine Gun)"');
    });

    it("prints the Hillman as a quad, with front legs where a biped has arms", () => {
        const markup = render(hillman());
        expect(markup).toContain("Left Front Leg");
        expect(markup).not.toContain('data-testid="micro-location-la"');
        expect(count(markup, /data-testid="micro-slots-(fll|frl|ll|rl)"/g)).toBe(4);
        expect(markup).toContain("SRM 2");
    });

    it("prints a blank design too, and one page for each design", () => {
        expect(render(new MicroMech())).toContain("MICRO-MECH RECORD SHEET");
        const pages = renderToStaticMarkup(<MicroMechRecordSheet micros={[storm(), hillman()]} />);
        expect(count(pages, /class="print-page"/g)).toBe(2);
    });
});
