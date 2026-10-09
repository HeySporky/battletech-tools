import { describe, expect, it } from "vitest";
import { AcesNamedPilot, getAcesPilotShares } from "./aces-campaign";
import AerospaceFighter from "./aerospace-fighter";
import { AlphaStrikeUnit } from "./alpha-strike-unit";
import { BattleMech } from "./battlemech";
import { importBattleArmorBlk } from "./battle-armor-blk";
import { importProtoMechBlk } from "./protomech-blk";
import { importSmallCraftBlk } from "./small-craft-blk";
import { getSkillMultiplier } from "../data/skill-multipliers";
import { DEFAULT_RULES_EDITION } from "../data/rules-editions";
import { customTagFaction } from "../utils/customTags";
import { AppSettings } from "../ui/classes/app_settings";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { IEquipmentItem } from "../data/data-interfaces";

// Findings from the review of the unit-builder bundle (upstream PR #115), each fixed and pinned here.
describe("review findings", () => {
    it("a 'Mech's skill-adjusted Battle Value uses its own rules edition's table (BMR p.144 against TM p.315)", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        mech.setPilotGunnery(3);
        mech.setPilotPiloting(4);
        const base = mech.getBattleValue();
        expect(mech.getPilotAdjustedBattleValue()).toBe(Math.round(base * getSkillMultiplier(3, 4, "mech", DEFAULT_RULES_EDITION)!));

        mech.setRulesEdition("master-rules");
        mech.setPilotGunnery(3);
        const multiplier = getSkillMultiplier(3, 4, "mech", "master-rules")!;
        expect(multiplier).not.toBe(getSkillMultiplier(3, 4, "mech", DEFAULT_RULES_EDITION));
        expect(mech.getPilotAdjustedBattleValue()).toBe(Math.round(mech.getBattleValue() * multiplier));
    });

    it("reset() clears the rules edition with the rest of the design", () => {
        const mech = new BattleMech();
        mech.setRulesEdition("master-rules");
        mech.reset();
        expect(mech.getRulesEdition()).toBe(DEFAULT_RULES_EDITION);
    });

    it("fighter Battle Value heat multiplies a rapid-fire weapon's single-shot heat, not its burst heat (TM p.303)", () => {
        const bvHeat = (AerospaceFighter as unknown as { _bvHeat(item: IEquipmentItem): number })._bvHeat;
        const rotary = { tag: "rotary-ac-5", name: "Rotary AC/5", heat: 1, heatAero: 6 } as IEquipmentItem;
        const ultra = { tag: "clan-autocannon-uac-10", name: "Clan Ultra AC/10", heat: 3, heatAero: 3 } as IEquipmentItem;
        const laser = { tag: "medium-laser", name: "Medium Laser", heat: 3, heatAero: 3 } as IEquipmentItem;
        expect(bvHeat(rotary)).toBe(6);
        expect(bvHeat(ultra)).toBe(6);
        expect(bvHeat(laser)).toBe(3);
    });

    it("a MegaMek file naming an item 'constructor' or '__proto__' is reported, not thrown on", () => {
        const equipment = "constructor\n__proto__\ntoString";
        const smallCraft = `<UnitType>\nSmallCraft\n</UnitType>\n<Name>\nTest\n</Name>\n<tonnage>\n100\n</tonnage>\n<SafeThrust>\n4\n</SafeThrust>\n<Nose Equipment>\n${equipment}\n</Nose Equipment>\n`;
        expect(() => importSmallCraftBlk(smallCraft)).not.toThrow();
        expect(importSmallCraftBlk(smallCraft).issues.join(" ")).toMatch(/constructor/i);
        const proto = `<UnitType>\nProtoMek\n</UnitType>\n<Name>\nTest\n</Name>\n<tonnage>\n5\n</tonnage>\n<cruiseMP>\n4\n</cruiseMP>\n<Torso Equipment>\n${equipment}\n</Torso Equipment>\n`;
        expect(() => importProtoMechBlk(proto)).not.toThrow();
        const suit = `<UnitType>\nBattleArmor\n</UnitType>\n<Name>\nTest\n</Name>\n<weightclass>\n2\n</weightclass>\n<Squad Equipment>\n${equipment}\n</Squad Equipment>\n`;
        expect(() => importBattleArmorBlk(suit)).not.toThrow();
    });

    it("a Small Craft file with no Safe Thrust or Structural Integrity says what was used instead", () => {
        const file = "<UnitType>\nSmallCraft\n</UnitType>\n<Name>\nTest\n</Name>\n<tonnage>\n100\n</tonnage>\n";
        const issues = importSmallCraftBlk(file).issues.join(" ");
        expect(issues).toMatch(/no Safe Thrust/);
        expect(issues).toMatch(/no Structural Integrity/);
        expect(issues).toMatch(/armor for 0 of the 4 facings/);
    });

    it("an Aces pilot id naming an Object.prototype property cannot corrupt the shares", () => {
        const shares = getAcesPilotShares(100, 40, [{ id: "__proto__", status: "participated" }, { id: "constructor", status: "absent" }]);
        expect(shares["__proto__"]).toBe(40);
        expect(shares["constructor"]).toBe(20);
        const pilot = new AcesNamedPilot();
        const own = pilot.id;
        pilot.import({ ...pilot.export(), id: "__proto__" });
        expect(pilot.id).toBe(own);
    });

    it("customTagFaction reads the faction after a hyphenated submitter name", () => {
        expect(customTagFaction("jade-falcon-clan-er-widget")).toBe("clan");
        expect(customTagFaction("ammo-some-user-is-widget-standard")).toBe("is");
        expect(customTagFaction("local-is-widget")).toBe("is");
        expect(customTagFaction("local-widget")).toBeNull();
    });

    it("settings saved when 5 meant Custom Homebrew load as Custom Homebrew, once", () => {
        const old = new AppSettings({ mechRulesFilter: 5 } as never);
        expect(old.mechRulesFilter).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        const resaved = new AppSettings(old.export());
        expect(resaved.mechRulesFilter).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
        const current = new AppSettings({ ...old.export(), mechRulesFilter: 5 });
        expect(current.mechRulesFilter).toBe(5);
    });

    it("a Master Unit List card's role is not read as a special ability", () => {
        const unit = new AlphaStrikeUnit();
        unit.importMUL({ Id: 1, Name: "Rifleman", Variant: "RFL-3N", Class: "BattleMech", BFType: "BM", BFMove: "8\"", BFAbilities: "AC 2/2/-,CASE,Brawler", Role: { Id: 1, Name: "Brawler" } } as never);
        expect(unit.abilities).toEqual(["AC 2/2/-", "CASE"]);
        expect(unit.role).toBe("Brawler");
    });
});
