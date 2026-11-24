import { afterEach, describe, expect, it } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./equipment-registry";
import { getComponentRecords, isCustomComponent, setLocalCustomComponents } from "./custom-component-registry";
import { mechArmorTypes } from "./mech-armor-types";
import { sswTestFixtures } from "./ssw/sswTestFixtures";

const customArmor = { ...JSON.parse(JSON.stringify(mechArmorTypes[0])), name: "Widget Plate", tag: "local-is-widget-plate", altTags: [], altNames: ["Widget Plate"] };

afterEach(() => setLocalCustomComponents("armor", []));

describe("custom component registry", () => {
    it("lists canon records first, then custom, then local drafts", () => {
        setLocalCustomComponents("armor", [customArmor]);
        const records = getComponentRecords("armor");
        expect(records[0]).toBe(mechArmorTypes[0]);
        expect(records[records.length - 1].tag).toBe("local-is-widget-plate");
    });

    it("tells custom components from canon ones", () => {
        setLocalCustomComponents("armor", [customArmor]);
        expect(isCustomComponent("armor", mechArmorTypes[0])).toBe(false);
        expect(isCustomComponent("armor", getComponentRecords("armor").find((a) => a.tag === "local-is-widget-plate"))).toBe(true);
    });

    it("a design with a custom armor needs Custom Homebrew and reloads with it", () => {
        setLocalCustomComponents("armor", [customArmor]);
        const mech = new BattleMech();
        mech.setArmorType("local-is-widget-plate");
        expect(mech.getArmorType()).toBe("local-is-widget-plate");
        expect(mech.getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(new BattleMech(mech.exportJSON(true)).getArmorType()).toBe("local-is-widget-plate");
    });

    it("canon armor keeps its rules level", () => {
        const mech = new BattleMech();
        mech.setArmorType("ferro-fibrous");
        expect(mech.getRequiredRulesLevel()).toBeLessThan(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("a draft can never capture a canon tag", () => {
        setLocalCustomComponents("armor", [{ ...customArmor, tag: "ferro-fibrous" }]);
        const mech = new BattleMech();
        mech.setArmorType("ferro-fibrous");
        expect(isCustomComponent("armor", mechArmorTypes.find((a) => a.tag === mech.getArmorType()))).toBe(false);
        expect(mech.getRequiredRulesLevel()).toBeLessThan(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("an SSW design resolves a custom armor by name", () => {
        setLocalCustomComponents("armor", [customArmor]);
        const xml = sswTestFixtures["Champion C"].replace("<type>Ferro-Fibrous</type>", "<type>Widget Plate</type>");
        const mech = new BattleMech();
        mech.importSSWXML(xml);
        expect(mech.getArmorType()).toBe("local-is-widget-plate");
    });
});
