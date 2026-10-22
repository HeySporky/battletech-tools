import { describe, expect, it } from "vitest";
import { ALL_RULES_EDITION_UNIT_TYPES, getSelectableRulesEditions, RulesEditionUnitType } from "../data/rules-editions";
import AerospaceFighter from "./aerospace-fighter";
import BattleArmor from "./battle-armor";
import Building from "./building";
import InfantryPlatoon from "./infantry-platoon";
import ProtoMech from "./protomech";
import SmallCraft from "./small-craft";
import Vehicle from "./vehicle";

interface IEditionUnit { getRulesEdition(): string; setRulesEdition(tag: string): string; exportJSON(): string }

const units: [RulesEditionUnitType, () => IEditionUnit, (json: string) => IEditionUnit][] = [
    ["vehicle", () => new Vehicle(), (json) => new Vehicle(json)],
    ["fighter", () => new AerospaceFighter(), (json) => new AerospaceFighter(json)],
    ["small-craft", () => new SmallCraft(), (json) => new SmallCraft(json)],
    ["infantry", () => new InfantryPlatoon(), (json) => new InfantryPlatoon(json)],
    ["battle-armor", () => new BattleArmor(), (json) => new BattleArmor(json)],
    ["protomech", () => new ProtoMech(), (json) => new ProtoMech(json)],
    ["building", () => new Building(), (json) => new Building(json)],
];

describe("Rules editions offered by each unit creator", () => {
    it("offers each unit type only the editions with rules for it", () => {
        const offered = (unitType: RulesEditionUnitType) => getSelectableRulesEditions(unitType).map((edition) => edition.tag);
        // The earlier rulebooks print their tanks and infantry as fixed designs; the Core Rulebook builds 'Mechs and
        // has buildings (CRB pp.130-137), its other units being Battlefield Support Assets (CRB p.140).
        for (const unitType of ALL_RULES_EDITION_UNIT_TYPES.filter((type) => type !== "mech" && type !== "building")) {
            expect(offered(unitType), unitType).toEqual(["total-warfare"]);
        }
        expect(offered("building")).toEqual(["total-warfare", "core-rulebook"]);
        expect(offered("mech")).toEqual(expect.arrayContaining(["battledroids", "master-rules", "total-warfare", "core-rulebook"]));
    });

    it.each(units)("%s: defaults to Total Warfare, refuses an edition it has no rules for, and saves its edition", (unitType, create, load) => {
        const unit = create();
        expect(unit.getRulesEdition()).toBe("total-warfare");
        expect(JSON.parse(unit.exportJSON()).rulesEdition).toBeUndefined();
        expect(unit.setRulesEdition("battledroids")).toBe("total-warfare");

        if (unitType === "building") {
            expect(unit.setRulesEdition("core-rulebook")).toBe("core-rulebook");
            expect(load(unit.exportJSON()).getRulesEdition()).toBe("core-rulebook");
        }
        const saved = JSON.parse(unit.exportJSON());
        expect(load(JSON.stringify({ ...saved, rulesEdition: "no-such-edition" })).getRulesEdition()).toBe("total-warfare");
    });
});
