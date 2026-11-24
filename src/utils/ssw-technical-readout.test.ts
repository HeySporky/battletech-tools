import { describe, expect, it } from "vitest";
import { sswTestFixtures } from "../data/ssw/sswTestFixtures";
import { BattleMech } from "../classes/battlemech";
import { getBattleMechTroAdapter } from "../classes/battlemech-tro";
import { isSSWNoMake } from "./ssw-technical-readout";

const archerXml = sswTestFixtures["Archer ARC-2R"];
const importArcher = (xml: string = archerXml): BattleMech => {
    const mech = new BattleMech();
    mech.importSSWXML(xml);
    return mech;
};
const armament = (mech: BattleMech): string => mech.tro.getArmamentLine(getBattleMechTroAdapter(mech).getEquipmentCopies());

describe("SSW Technical Readout import", () => {
    it("recognizes the values SSW uses for no make", () => {
        for (const value of ["", "  ", "Unknown", "none", "NONE", undefined]) {
            expect(isSSWNoMake(value), String(value)).toBe(true);
        }
        expect(isSSWNoMake("Martell")).toBe(false);
    });

    it("reads the Archer's production and components", () => {
        const mech = importArcher();
        expect(mech.tro.getProduction("manufacturer")).toMatch(/^Earthwerks Incorporated/);
        expect(mech.tro.getProduction("primaryFactory")).toMatch(/^Calloway VI/);
        expect(mech.tro.getProduction("communications")).toBe("Neil 9000");
        expect(mech.tro.getProduction("targeting")).toBe("RCA Instatrac Mark XII");
        expect(mech.tro.getComponent("chassis")).toBe("Earthwerks Archer");
        expect(mech.tro.getComponent("engine")).toBe("VOX");
        expect(mech.tro.getComponent("armor")).toBe("Maximillian 100");
        expect(mech.tro.getComponent("jumpJets")).toBe("");
    });

    it("is unmixed when all copies agree", () => {
        const mech = importArcher();
        expect(mech.tro.getTypeMake("medium-laser")).toEqual({ manufacturer: "Diverse Optics Type 18" });
        expect(mech.tro.isMixed("medium-laser")).toBe(false);
        // The catalog names the launcher "LRM 20", which the make does not contain, so the name follows it.
        expect(armament(mech)).toContain("2 Doombud Long Range Missile 20 Racks LRM 20");
    });

    it("is mixed when copies differ", () => {
        const xml = archerXml.replace('<name manufacturer="Diverse Optics Type 18">(IS) Medium Laser</name>', '<name manufacturer="Martell">(IS) Medium Laser</name>');
        const mech = importArcher(xml);
        expect(mech.tro.isMixed("medium-laser")).toBe(true);
        expect(armament(mech)).toContain("3 Diverse Optics Type 18 Medium Laser");
        expect(armament(mech)).toContain("1 Martell Medium Laser");
    });

    it("ignores ammo makes", () => {
        const saved = importArcher().tro.export()!;
        expect(Object.keys(saved.equipment ?? {}).filter((tag) => tag.startsWith("ammo"))).toEqual([]);
    });

    it("an Artemis launcher keeps its make", () => {
        const xml = sswTestFixtures["Commando COM-5S"];
        const marked = xml.replace('<name manufacturer="">(IS) SRM-6</name>', '<name manufacturer="Holly">(IS) SRM-6</name>');
        expect(marked).not.toBe(xml);
        const mech = importArcher(marked);
        expect(mech.getInstalledEquipment().some((item) => item.tag.endsWith("-artemis-iv"))).toBe(true);
        const artemis = getBattleMechTroAdapter(mech).getEquipmentCopies().find((copy) => copy.tag.endsWith("-artemis-iv"))!;
        expect(mech.tro.getCopyMake(artemis.tag, artemis.uuid)).toEqual({ manufacturer: "Holly" });
    });

    it("replaces earlier TRO data instead of merging", () => {
        const mech = new BattleMech();
        mech.tro.setText("overview", "old");
        mech.tro.setProduction("manufacturer", "Old Maker");
        mech.importSSWXML(archerXml);
        expect(mech.tro.getText("overview")).not.toBe("old");
        expect(mech.tro.getProduction("manufacturer")).toMatch(/^Earthwerks/);
    });

    it("brings the fluff text through", () => {
        const withFluff = archerXml.replace(/<overview>[\s\S]*?<\/overview>/, "<overview>Line A</overview>");
        expect(withFluff).toContain("<overview>Line A</overview>");
        expect(importArcher(withFluff).tro.getText("overview")).toBe("Line A");
    });

    it("survives a JSON save and load", () => {
        const mech = importArcher();
        const reloaded = new BattleMech(mech.exportJSON());
        expect(reloaded.tro.export()).toEqual(mech.tro.export());
    });
});
