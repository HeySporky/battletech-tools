import { describe, expect, it } from "vitest";
import { sswMechs } from "../data/ssw/sswMechs";
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
    it("has the bundled SSW mech library to test against", () => {
        expect(sswMechs.length).toBeGreaterThan(500);
    });

    it("parses name, model and tonnage of every bundled SSW mech", () => {
        for (const xml of sswMechs) {
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
