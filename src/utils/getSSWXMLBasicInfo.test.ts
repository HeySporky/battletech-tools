import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { sswTestFixtures } from "../data/ssw/sswTestFixtures";
import { getSSWXMLBasicInfo } from "./getSSWXMLBasicInfo";

// Reads an attribute of the root <mech> tag straight from the XML text, independently of the XML parser under test.
function rootMechAttribute(xml: string, attribute: string): string | null {
    const mechTag = xml.match(/<mech\s[^>]*>/)?.[0] ?? "";
    const raw = mechTag.match(new RegExp(`\\s${attribute}="([^"]*)"`))?.[1];
    if (raw === undefined) {
        return null;
    }
    return raw
        .replace(/&quot;/g, "\"")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
}

describe("getSSWXMLBasicInfo", () => {
    it("parses name, model and tonnage of every SSW fixture", () => {
        for (const xml of Object.values(sswTestFixtures)) {
            const info = getSSWXMLBasicInfo(xml);
            const label = `${rootMechAttribute(xml, "name")} ${rootMechAttribute(xml, "model")}`;

            expect(info, label).not.toBeNull();
            expect(info!.name, label).toBe(rootMechAttribute(xml, "name"));
            expect(String(info!.model), label).toBe(rootMechAttribute(xml, "model"));
            expect(+info!.tonnage, label).toBe(Number(rootMechAttribute(xml, "tons")));
            expect(+info!.tonnage, label).toBeGreaterThanOrEqual(10);
            expect(+info!.tonnage, label).toBeLessThanOrEqual(200);
        }
    });

    it("returns null for XML without a <mech> root", () => {
        expect(getSSWXMLBasicInfo("<?xml version=\"1.0\"?><vehicle name=\"Demolisher\" />")).toBeNull();
    });
});

// #42: SSW saved two OmniMechs (Summoner (Thor), Puma (Adder)) with the image attribute's `="` missing:
// sswimage../Images/No_Image.png". The parser threw "readTagExp returned undefined".
describe("SSW files with a broken sswimage attribute", () => {
    const griffin = readFileSync("e2e/fixtures/griffin-widget.ssw", "utf8");
    const broken = griffin.replace('sswimage="../Images/No_Image.png"', 'sswimage../Images/No_Image.png"');

    it("are read like the file SSW meant to write", () => {
        expect(broken).not.toBe(griffin);
        const info = getSSWXMLBasicInfo(broken);
        expect(info?.name).toBe("Griffin");
        expect(info?.model).toBe("GRF-1N");
        expect(info?.tonnage).toBe(55);
    });

    it("import into the 'Mech creator", () => {
        const mech = new BattleMech();
        mech.importSSWXML(broken);
        const reference = new BattleMech();
        reference.importSSWXML(griffin);
        expect(mech.name).toBe("Griffin");
        expect(mech.model).toBe("GRF-1N");
        expect(mech.getTonnage()).toBe(55);
        expect(mech.getSSWUnresolved()).toEqual(reference.getSSWUnresolved());
        expect(mech.getInstalledEquipment().map((item) => item.name)).toEqual(reference.getInstalledEquipment().map((item) => item.name));
    });
});
