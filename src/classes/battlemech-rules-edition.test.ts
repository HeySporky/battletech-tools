import { describe, expect, it } from "vitest";
import { getAvailableTonnagesForMechType, getTonnageBoundsForMechType } from "../data/mech-tonnages";
import { mechTypeOptions } from "../data/mech-type-options";
import { DEFAULT_RULES_EDITION, editionHasPrices, getRulesEdition, getSelectableRulesEditions, isEarlierRulesEdition } from "../data/rules-editions";
import { editionHasBattleValue } from "../data/battle-value";
import { getTargetToHitFromWeapon } from "../utils";
import { BattleMech } from "./battlemech";
import { buildMech } from "../test-support/builders";

const build = (edition?: string, tonnage: number = 50, walk: number = 4): BattleMech => {
    const mech = buildMech({ tonnage, walk });
    if (edition) mech.setRulesEdition(edition);
    return mech;
};
const add = (mech: BattleMech, tag: string) => mech.addEquipmentFromTag(tag, mech.getTech().tag, "", false, undefined, "", false, [], undefined, undefined)!;
const offered = (mech: BattleMech) => mech.getAvailableEquipment(false, 2).filter(item => item.available).map(item => item.tag);
const available = (list: { tag: string; available?: boolean }[]) => list.filter(option => option.available).map(option => option.tag);

describe("Rules edition selector", () => {
    it("offers Total Warfare, the BattleMech Manual, the Core Rulebook and every earlier edition entered whole", () => {
        expect(getSelectableRulesEditions().map(edition => edition.tag)).toEqual([
            "battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition",
            "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook",
        ]);
        expect(["battledroids", "master-rules-revised", "classic-battletech-box-set", "total-warfare", "core-rulebook", "nonsense"].map(isEarlierRulesEdition))
            .toEqual([true, true, true, false, false, false]);
        expect(getRulesEdition("nonsense").tag).toBe(DEFAULT_RULES_EDITION);
    });

    it("defaults to Total Warfare and changes nothing there", () => {
        const [plain, chosen] = [build(), build(DEFAULT_RULES_EDITION)];
        expect(plain.getRulesEdition()).toBe("total-warfare");
        expect(plain.usesEarlierRulesEdition()).toBe(false);
        expect(plain.getRulesEditionIssues()).toEqual([]);
        expect(offered(chosen)).toEqual(offered(plain));
        expect(plain.setRulesEdition("nonsense")).toBe("total-warfare");
        expect(plain.exportJSON()).not.toContain("rulesEdition");
    });

    // Battledroids' weapon table (BD p.24) has ten weapons; nothing later is offered.
    it("offers only the equipment the edition includes", () => {
        const battledroids = offered(build("battledroids"));
        expect(battledroids).toEqual(expect.arrayContaining(["medium-laser", "standard-ppc", "autocannon-standard-b", "lrm-20", "srm-6", "machine-gun"]));
        for (const tag of ["autocannon-standard-d", "er-large-laser", "standard-gauss-rifle", "melee-hatchet", "er-medium-laser"]) {
            expect(battledroids, tag).not.toContain(tag);
        }
        const compendium = offered(build("battletech-compendium"));
        expect(compendium).toEqual(expect.arrayContaining(["autocannon-standard-d", "er-large-laser", "standard-gauss-rifle", "melee-hatchet"]));
        expect(compendium).not.toContain("er-medium-laser");
        expect(offered(build("master-rules"))).toContain("er-medium-laser");
    });

    it("offers only the components the edition includes", () => {
        const battledroids = build("battledroids");
        expect(available(battledroids.getAvailableEngines())).toEqual(["standard"]);
        expect(available(battledroids.getAvailableInternalStructures())).toEqual(["standard"]);
        expect(available(battledroids.getAvailableHeatSinks())).toEqual(["single"]);
        expect(available(battledroids.getAvailableArmorTypes())).toEqual(["standard"]);
        expect(available(battledroids.getAvailableGyros())).toEqual(["standard"]);
        expect(available(battledroids.getAvailableCockpits())).toEqual(["standard"]);
        expect(available(battledroids.getAvailableJumpJets())).toEqual(["standard"]);
        expect(available(battledroids.getAvailableMyomerTypes())).toEqual(["standard"]);

        const compendium = build("battletech-compendium");
        expect(available(compendium.getAvailableEngines())).toEqual(expect.arrayContaining(["standard", "xl"]));
        expect(available(compendium.getAvailableEngines())).not.toContain("light");
        expect(available(compendium.getAvailableInternalStructures()).sort()).toEqual(["endo-steel", "standard"]);
        expect(available(compendium.getAvailableHeatSinks()).sort()).toEqual(["double", "single"]);
        expect(available(compendium.getAvailableMyomerTypes()).sort()).toEqual(["standard", "tsm"]);
    });

    // Tonnage tables: 5 to 100 tons in Battledroids (BD p.23), 10 to 100 until the Master Rules, which start at 20
    // (BMR p.110). No rules level applies.
    it("takes the tonnage range from the edition's table", () => {
        const tons = (edition: string) => getAvailableTonnagesForMechType("biped", 2, "is", edition).map(option => option.tons);
        expect([tons("battledroids")[0], tons("battledroids").at(-1)]).toEqual([5, 100]);
        expect([tons("battletech-2nd-edition")[0], tons("battletech-2nd-edition").at(-1)]).toEqual([10, 100]);
        expect([tons("master-rules")[0], tons("master-rules").at(-1)]).toEqual([20, 100]);
        expect(getTonnageBoundsForMechType("biped", 2, "is", "battledroids")).toEqual({ min: 5, max: 100 });
        expect(getAvailableTonnagesForMechType("biped", 7, "is").map(option => option.tons)).not.toContain(5);
        expect(getTonnageBoundsForMechType("biped", 2, "is")).toEqual({ min: 20, max: 100 });
        expect(tons("total-warfare")).toEqual(getAvailableTonnagesForMechType("biped", 2, "is").map(option => option.tons));
    });

    it("knows which chassis types an edition has", () => {
        const types = (edition: string) => mechTypeOptions.filter(option => build(edition).isInRulesEdition(option)).map(option => option.tag);
        expect(types("battledroids")).toEqual(["biped"]);
        expect(types("battletech-compendium").sort()).toEqual(["biped", "lam", "quad"]);
        expect(types("master-rules").sort()).toEqual(["biped", "quad"]);
    });

    // BD p.24: SRM 2 heat 0, LRM 5 heat 1; the current rules print 2 and 2.
    it("mounts equipment with the stats the edition prints", () => {
        const battledroids = build("battledroids");
        expect([add(battledroids, "srm-2").heat, add(battledroids, "lrm-5").heat]).toEqual([0, 1]);
        const current = build();
        expect([add(current, "srm-2").heat, add(current, "lrm-5").heat]).toEqual([2, 2]);
        expect(add(battledroids, "medium-laser")).toMatchObject({ book: "BD", weight: 1, heat: 3, damage: 5 });
        expect(battledroids.getAvailableEquipment(false, 2).find(item => item.tag === "srm-2")).toMatchObject({ heat: 0, book: "BD" });
    });

    it("restats mounted equipment when the edition changes, and back again", () => {
        const mech = build();
        const launcher = add(mech, "srm-2");
        const weight = mech.getCurrentTonnage();
        mech.setRulesEdition("battledroids");
        expect([launcher.heat, launcher.book]).toEqual([0, "BD"]);
        expect(mech.getCurrentTonnage()).toBe(weight);
        mech.setRulesEdition("total-warfare");
        // Undoing the switch brings back the design as it was, its items included.
        const restored = mech.getInstalledEquipment().find(item => item.tag === "srm-2")!;
        expect(restored.heat).toBe(2);
        expect(restored.book).not.toBe("BD");
    });

    // BD p.24: 0.5 tons a jump point at every tonnage. BT2 p.39 brings in the three weight bands.
    it("weighs jump jets by the edition's rule", () => {
        const jets = (edition?: string) => {
            const mech = build(edition, 90, 3);
            mech.setJumpSpeed(3);
            return mech.getJumpJetWeight();
        };
        expect([jets("battledroids"), jets("battletech-2nd-edition"), jets("master-rules"), jets()]).toEqual([1.5, 6, 6, 6]);
    });

    // BD p.25: every heat sink takes a box, the engine's ten included. BTM pp.79-80: rating / 25 need none.
    it("puts every heat sink on the critical chart in the first two editions", () => {
        const capacity = (edition?: string) => build(edition, 50, 4).getEngineHeatSinkCapacity();
        expect([capacity("battledroids"), capacity("battletech-2nd-edition"), capacity("battletech-manual"), capacity("master-rules"), capacity()])
            .toEqual([0, 0, 8, 8, 8]);
    });

    // BD p.23 prints the 170 engine at 6.5 tons; BT2 p.37 and every later table give 6.
    it("reads engine weight from the edition's Engine Table", () => {
        const engine = (edition?: string) => build(edition, 85, 2).getEngineWeight();
        expect([engine("battledroids"), engine("battletech-2nd-edition"), engine()]).toEqual([6.5, 6, 6]);
    });

    it("lists what a design uses that its edition does not include", () => {
        const mech = build(undefined, 50, 4);
        add(mech, "er-large-laser");
        add(mech, "medium-laser");
        mech.setRulesEdition("battledroids");
        expect(mech.getRulesEditionIssues()).toEqual([`Equipment: ER Large Laser (not in ${getRulesEdition("battledroids").name})`]);
        mech.setRulesEdition("battletech-compendium");
        expect(mech.getRulesEditionIssues()).toEqual([]);
        const light = build("battledroids", 10, 4);
        expect(light.getRulesEditionIssues()).toEqual([]);
        light.setRulesEdition("master-rules");
        expect(light.getRulesEditionIssues()).toEqual([`Tonnage: 10 tons (not in ${getRulesEdition("master-rules").name})`]);
    });

    // BD pp.23-24: 5 tons is the lightest battledroid. Internal structure 0.5 tons, a 10-rated engine 0.5,
    // the cockpit 3 and the gyroscope 1 use up all 5 tons.
    it("builds Battledroids' 5-ton chassis", () => {
        const mech = build("battledroids", 5, 2);
        expect(mech.getRulesEditionIssues()).toEqual([]);
        expect(mech.getInternalStructure()).toMatchObject({ head: 3, centerTorso: 3, leftTorso: 2, rightTorso: 2, leftArm: 1, rightArm: 1, leftLeg: 1, rightLeg: 1 });
        expect([mech.getEngine()?.rating, mech.getEngineWeight(), mech.getInternalStructureWeight(), mech.getCockpitWeight(), mech.getGyroWeight()])
            .toEqual([10, 0.5, 0.5, 3, 1]);
        expect(mech.getRemainingTonnage()).toBe(0);
        // Engine Table, BD p.23: ratings 10 to 400, so 2 to 80 Walking MP at 5 tons.
        expect([mech.getMinWalkSpeed(), mech.getMaxWalkSpeed(4), build(undefined, 20, 4).getMinWalkSpeed()]).toEqual([2, 80, 1]);
        const slow = build("battledroids", 20, 1);
        slow.setTonnage(5);
        expect([slow.getWalkSpeed(), slow.getEngine()?.rating]).toEqual([2, 10]);
        // Head 9, every other location twice its boxes, each torso's front and rear apart (BD p.25).
        expect(mech.getMaxArmor()).toBe(9 + 2 * (1 + 1 + 1 + 1) + 2 * 2 * (3 + 2 + 2));

        const restored = new BattleMech(mech.exportJSON());
        expect([restored.getTonnage(), restored.getRulesEdition(), restored.getInternalStructure().centerTorso]).toEqual([5, "battledroids", 3]);
        // Under an edition without the chassis the design still opens, and the tonnage is reported.
        restored.setRulesEdition("total-warfare");
        expect(restored.getInternalStructure().centerTorso).toBe(3);
        restored.setRulesEdition("master-rules");
        expect(restored.getRulesEditionIssues()).toContain(`Tonnage: 5 tons (not in ${getRulesEdition("master-rules").name})`);
    });

    // BD p.25: "the Armor Value may not be more than twice the number of internal structure boxes at that location",
    // over the Armor Diagram's 11 locations, the torsos "divided into sections for front armor and rear armor". The
    // Compendium adds that front and rear together stay within twice the boxes (BTC p.113), as in Total Warfare. The book's own Stinger, Wasp, Phoenix Hawk, Archer and Marauder fit only the Battledroids way.
    it("caps a torso's front and rear armor apart under Battledroids", () => {
        const [droid, mech] = [build("battledroids", 60, 4), build("total-warfare", 60, 4)];
        // 60 tons: center torso 20 boxes, side torsos 14 (BD p.24; TM p.52).
        for (const unit of [droid, mech]) {
            unit.setCenterTorsoArmor(30);
            unit.setLeftTorsoArmor(20);
            unit.setRightTorsoArmor(20);
        }
        expect([droid.getMaxCenterTorsoRearArmor(), droid.getMaxLeftTorsoRearArmor(), droid.getMaxRightTorsoRearArmor()]).toEqual([40, 28, 28]);
        expect([mech.getMaxCenterTorsoRearArmor(), mech.getMaxLeftTorsoRearArmor(), mech.getMaxRightTorsoRearArmor()]).toEqual([10, 8, 8]);
        droid.setCenterTorsoRearArmor(15);
        mech.setCenterTorsoRearArmor(5);
        expect([droid.getMaxCenterTorsoArmor(), mech.getMaxCenterTorsoArmor()]).toEqual([40, 35]);
        expect(droid.getMaxArmor() - mech.getMaxArmor()).toBe(2 * (20 + 14 + 14));

        droid.allocateArmorMax();
        const max = droid.getArmorAllocation();
        expect([max.centerTorso, max.centerTorsoRear, max.leftTorso, max.leftTorsoRear]).toEqual([40, 40, 28, 28]);
        expect(droid.getTotalArmor()).toBe(droid.getMaxArmor());

        // Best Guess spreads more than Total Warfare's maximum without passing any section's cap.
        const sane = build("battledroids", 60, 4);
        sane.setArmorWeight(15);
        sane.allocateArmorSane();
        const spread = sane.getArmorAllocation();
        const structure = sane.getInternalStructure();
        expect(sane.getTotalArmor()).toBe(240);
        expect(spread.head).toBeLessThanOrEqual(9);
        for (const [front, rear, boxes] of [
            [spread.centerTorso, spread.centerTorsoRear, structure.centerTorso],
            [spread.leftTorso, spread.leftTorsoRear, structure.leftTorso],
            [spread.rightTorso, spread.rightTorsoRear, structure.rightTorso],
        ]) {
            expect(front).toBeLessThanOrEqual(2 * boxes);
            expect(rear).toBeLessThanOrEqual(2 * boxes);
        }
        expect(sane.getTotalArmor()).toBeGreaterThan(mech.getMaxArmor());
    });

    // Read from the page images: the Second Edition (BT2 p.40) and the BattleTech Manual (BTM p.80) keep the
    // Battledroids wording; the Compendium (BTC p.113) adds the shared cap, and every edition after it keeps it
    // (BT3 p.43, BMR p.113, BTC:RoW p.102, BT4 p.44, BMR(R) p.120).
    it("caps torso sections apart through the BattleTech Manual and together from the Compendium on", () => {
        const apart = getSelectableRulesEditions().filter(edition => build(edition.tag, 60, 4).torsoArmorSectionsApart()).map(edition => edition.tag);
        expect(apart).toEqual(["battledroids", "battletech-2nd-edition", "battletech-manual"]);
    });

    // Internal Structure Table, BD p.24: the boxes come from the edition's own table.
    it("takes internal structure boxes from the edition's table", () => {
        const boxes = (tons: number) => {
            const structure = build("battledroids", tons, 2).getInternalStructure();
            return [structure.centerTorso, structure.leftTorso, structure.leftArm, structure.leftLeg];
        };
        expect([boxes(25), boxes(55), boxes(60), boxes(65)]).toEqual([[8, 6, 4, 6], [18, 13, 9, 13], [20, 14, 10, 14], [21, 15, 10, 15]]);
    });

    // BD p.25 puts weapons and heat sinks on the Critical Hit Chart; the Second Edition adds the jets (BT2 p.39).
    it("keeps Battledroids jump jets off the Critical Hit Chart", () => {
        const jets = (edition?: string) => {
            const mech = build(edition, 50, 4);
            mech.setJumpSpeed(4);
            return mech.getUnallocatedCriticals().filter(item => item.tag.startsWith("jj-")).length
                + mech.exportJSON().split('"jj-standard"').length - 1;
        };
        expect(jets("battledroids")).toBe(0);
        expect(jets("battletech-2nd-edition")).toBeGreaterThan(0);
        expect(jets()).toBeGreaterThan(0);
    });

    // BD p.25: "At least 1 ton must be used for each missile launcher's or ballistic weapon's ammunition."
    // The Third Edition asks a ton for each class of them (BT3 p.43).
    it("asks for the edition's least ammunition", () => {
        const mech = build("battledroids", 60, 4);
        add(mech, "medium-laser");
        expect(mech.getRulesEditionRuleIssues()).toEqual([]);
        add(mech, "lrm-5");
        add(mech, "lrm-20");
        add(mech, "machine-gun");
        expect(mech.getRulesEditionRuleIssues()).toEqual([
            "Ammunition for LRM 5, LRM 20: at least 2 tons (1 for each weapon), 0 carried",
            "Ammunition for Machine Gun: at least 1 ton (1 for each weapon), 0 carried",
        ]);
        add(mech, "ammo-lrm-standard");
        add(mech, "ammo-machine-gun-standard");
        expect(mech.getRulesEditionRuleIssues()).toEqual(["Ammunition for LRM 5, LRM 20: at least 2 tons (1 for each weapon), 1 carried"]);
        mech.setRulesEdition("battletech-3rd-edition");
        expect(mech.getRulesEditionRuleIssues()).toEqual([]);
        mech.setRulesEdition("total-warfare");
        expect(mech.getRulesEditionRuleIssues()).toEqual([]);
        mech.setRulesEdition("battledroids");
        add(mech, "ammo-lrm-standard");
        expect(mech.getRulesEditionRuleIssues()).toEqual([]);
    });

    it("asks for no rules level under an earlier edition", () => {
        expect(build(undefined, 10, 4).getRequiredRulesLevel()).toBe(3);
        expect(build("battledroids", 10, 4).getRequiredRulesLevel()).toBe(0);
    });

    // No edition before the Master Rules has Battle Value; Battledroids, the Second, Third and Fourth Editions print no prices.
    it("knows which editions have Battle Value and prices", () => {
        const tags = ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition",
            "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "core-rulebook"];
        expect(tags.map((tag) => editionHasBattleValue(tag))).toEqual([false, false, false, false, false, false, false, true, true, true, true]);
        expect(tags.map(editionHasPrices)).toEqual([false, false, true, true, false, true, false, true, true, true, true]);
    });

    // Heat Point Table, BD p.12: walking 0, running +1 a turn, jumping +1 a hex. Total Warfare: 1, 2, and 1 a hex with a least of 3.
    it("heats a moving battledroid by the Heat Point Table of Battledroids", () => {
        const heat = (edition: string | undefined, mode: string, jumped: number = 0) => {
            const mech = build(edition, 50, 5);
            mech.setJumpSpeed(5);
            mech.currentMovementMode = mode;
            mech.currentTargetJumpingMP = jumped;
            return mech.getActiveMoveHeat();
        };
        expect([heat("battledroids", "n"), heat("battledroids", "w"), heat("battledroids", "r"), heat("battledroids", "j", 2), heat("battledroids", "j", 5)])
            .toEqual([0, 0, 1, 2, 5]);
        expect([heat(undefined, "n"), heat(undefined, "w"), heat(undefined, "r"), heat(undefined, "j", 2), heat(undefined, "j", 5)])
            .toEqual([0, 1, 2, 3, 5]);
        // The most a design can build up by moving, as the creator's status bar shows it.
        const walker = build("battledroids", 50, 4);
        expect([walker.getMoveHeat(), build(undefined, 50, 4).getMoveHeat()]).toEqual([1, 2]);
        walker.setJumpSpeed(4);
        expect(walker.getMoveHeat()).toBe(4);
    });

    describe("to-hit numbers in play", () => {
        const target = { name: "Target", active: true, range: 5, movement: 0, otherMods: 0, jumped: false, primary: true, inRearArc: false };
        const shot = (edition: string | undefined, weaponTag: string, changes: Partial<typeof target>) => {
            const mech = build(edition, 60, 4);
            const weapon = mech.addEquipmentFromTag(weaponTag, mech.getTech().tag, "rt", false, undefined, "a", false, [], undefined, undefined)!;
            const index = mech.equipmentList.findIndex(item => item.uuid === weapon.uuid);
            return getTargetToHitFromWeapon(mech, index, { ...target, ...changes });
        };

        // "[Minimum] - [Target Range] + 1" (TW p.118); a PPC's minimum range of 3 gives +1 at 3 hexes, +2 at 2, +3 at 1 (BD p.9).
        it("adds 1 at the minimum range and 1 more for each hex closer, in every edition", () => {
            for (const edition of [undefined, "battledroids"]) {
                const base = shot(edition, "standard-ppc", { range: 4 }).finalToHit;
                expect([3, 2, 1].map(range => shot(edition, "standard-ppc", { range }).finalToHit - base), String(edition)).toEqual([1, 2, 3]);
                expect(shot(edition, "standard-ppc", { range: 3 }).rangeExplanation).toBe("Minimum Range");
                expect(shot(edition, "medium-laser", { range: 1 }).rangeModifier).toBe(0);
            }
        });

        // Heat Scale: +1 to hit at 8, +2 at 13, +3 at 17, +4 at 24 (TW pp.158-160; the same on the Battledroids record sheet).
        it("adds the fire modifier of the Heat Scale, in every edition", () => {
            for (const edition of [undefined, "battledroids"]) {
                const mech = build(edition, 60, 4);
                const weapon = mech.addEquipmentFromTag("medium-laser", mech.getTech().tag, "rt", false, undefined, "a", false, [], undefined, undefined)!;
                const index = mech.equipmentList.findIndex(item => item.uuid === weapon.uuid);
                const toHit = (heat: number) => { mech.currentHeat = heat; return getTargetToHitFromWeapon(mech, index, { ...target, range: 2 }).finalToHit; };
                const cool = toHit(0);
                expect([7, 8, 12, 13, 17, 23, 24, 30].map(heat => toHit(heat) - cool), String(edition)).toEqual([0, 1, 1, 2, 3, 3, 4, 4]);
            }
        });

        // The weapon attack rules of Battledroids (BD pp.8-11, 15) have no modifier for a second target.
        it("has no modifier for a second target in Battledroids", () => {
            const extra = (edition: string | undefined, inRearArc: boolean) =>
                shot(edition, "medium-laser", { range: 2, primary: false, inRearArc }).otherModifiers - shot(edition, "medium-laser", { range: 2, inRearArc }).otherModifiers;
            expect([extra("battledroids", false), extra("battledroids", true)]).toEqual([0, 0]);
            expect([extra(undefined, false), extra(undefined, true)]).toEqual([1, 2]);
        });
    });

    // BD p.18: 7 or more on two dice is a critical hit; one die picks the line in the head or a leg, two dice
    // elsewhere (the first for the group, the second for the line); an empty line is rolled again.
    it("rolls a critical hit by the rules of Battledroids", () => {
        const mech = build("battledroids", 60, 4);
        expect(mech.rollEditionCriticalHit("hd", { chance: 6 })).toEqual(["Critical hit roll 6: no critical hit (7 or more is needed)."]);
        // Head line 3 is the cockpit.
        expect(mech.rollEditionCriticalHit("hd", { chance: 7, lines: [3] })).toEqual(["Critical hit roll 7: a critical hit.", "Line 3: Cockpit is hit."]);
        expect(mech.isCriticalDamaged("hd", 2)).toBe(true);
        expect(mech.rollEditionCriticalHit("hd", { chance: 9, lines: [3] }).at(-1)).toBe("Line 3, Cockpit: already hit.");
        // Center torso: group 2 (a 4), line 1 is the seventh box, the fourth gyro box.
        const torso = mech.rollEditionCriticalHit("ct", { chance: 12, lines: [4, 1] });
        expect(torso.at(-1)).toBe("Line 21: Standard Gyro is hit.");
        expect(mech.isCriticalDamaged("ct", 6)).toBe(true);
        // A leg's lines 5 and 6 are empty: rolled again.
        const leg = mech.rollEditionCriticalHit("ll", { chance: 8, lines: [6, 1] });
        expect(leg).toEqual(["Critical hit roll 8: a critical hit.", "Line 6 is empty: rolled again.", "Line 1: Hip is hit."]);
        // Total Warfare's own critical hit rules are not rolled here.
        expect(build().rollEditionCriticalHit("hd", { chance: 12 })).toEqual([]);
    });

    // The edition decides the technology bases: no Clan before the BattleTech Compendium ("Inner Sphere or Clan",
    // BTC p.111), Mixed Tech only through the Master Rules' custom modifications (BMR pp.87, 108; BMR(R) p.89).
    it("offers only the technology bases the rules edition has", () => {
        const techTags = (edition: string) => build(edition).getAvailableTechOptions().map((option) => option.tag);
        for (const edition of ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-3rd-edition", "battletech-4th-edition"]) {
            expect(techTags(edition), edition).toEqual(["is"]);
        }
        expect(techTags("battletech-compendium")).toEqual(["is", "clan"]);
        expect(techTags("compendium-rules-of-warfare")).toEqual(["is", "clan"]);
        expect(techTags("master-rules")).toEqual(["is", "clan", "mis", "mclan"]);
        expect(techTags("master-rules-revised")).toEqual(["is", "clan", "mis", "mclan"]);
        expect(techTags(DEFAULT_RULES_EDITION)).toEqual(["is", "clan", "mis", "mclan"]);
    });

    it("moves the technology base to one the new edition has", () => {
        const clan = build();
        clan.setTech("clan");
        clan.setRulesEdition("battledroids");
        expect(clan.getTech().tag).toBe("is");

        const mixedClan = build();
        mixedClan.setTech("mclan");
        mixedClan.setRulesEdition("battletech-compendium");
        expect(mixedClan.getTech().tag).toBe("clan");

        const mixed = build();
        mixed.setTech("mis");
        mixed.setRulesEdition("master-rules");
        expect(mixed.getTech().tag).toBe("mis");
    });

    it("flags a saved design whose technology base its edition does not have", () => {
        const saved = JSON.parse(build("battledroids").exportJSON());
        saved.tech = "clan";
        // A save loads as saved, and the creator says what the edition does not have.
        const loaded = new BattleMech(JSON.stringify(saved));
        expect(loaded.getTech().tag).toBe("clan");
        expect(loaded.getRulesEditionIssues()).toContain("Technology base: Clan");
    });

    it("saves the edition with the design and loads old saves as Total Warfare", () => {
        const mech = build("battledroids");
        add(mech, "srm-2");
        const restored = new BattleMech(mech.exportJSON());
        expect(restored.getRulesEdition()).toBe("battledroids");
        expect(restored.getEquipmentList("is").find(item => item.tag === "srm-2")!.heat).toBe(0);
        expect(restored.export().equipment).toHaveLength(1);
        expect(restored.getCurrentTonnage()).toBe(mech.getCurrentTonnage());

        const old = JSON.parse(build().exportJSON());
        expect("rulesEdition" in old).toBe(false);
        expect(new BattleMech(JSON.stringify(old)).getRulesEdition()).toBe("total-warfare");
        old.rulesEdition = "an-edition-from-a-newer-version";
        expect(new BattleMech(JSON.stringify(old)).getRulesEdition()).toBe("total-warfare");
    });
});

// TCI kit back, GOL-1H Goliath (FASA 1984): Battledroids has no four-legged layout except on this sheet.
describe("A four-legged droid under Battledroids", () => {
    const goliath = () => {
        const mech = build("battledroids", 80, 4);
        mech.setType("quad");
        return mech;
    };

    it("lists the four-legged layout as not in the edition below Apocryphal", () => {
        expect(goliath().getRulesEditionIssues(2)).toContain(`Chassis type: Quad (not in ${getRulesEdition("battledroids").name})`);
        expect(goliath().getRulesEditionIssues()).toContain(`Chassis type: Quad (not in ${getRulesEdition("battledroids").name})`);
    });

    it("allows it at Apocryphal", () => {
        expect(goliath().getRulesEditionIssues(5)).not.toContain(`Chassis type: Quad (not in ${getRulesEdition("battledroids").name})`);
        expect(goliath().isInRulesEdition(mechTypeOptions.find(option => option.tag === "quad")!, 5)).toBe(true);
    });
});

// An earlier rulebook offers only the construction options it prints: no OmniMechs before TR:3050 (1989), and no
// Primitive 'Mechs (IO:AE) or Fractional Accounting (TO:AUE), which came after every earlier edition.
describe("BattleMech construction options by rules edition", () => {
    it("offers OmniMechs, Primitive 'Mechs and Fractional Accounting only where the edition has them", () => {
        const options = (edition: string) => {
            const mech = new BattleMech();
            mech.setRulesEdition(edition);
            return [mech.canBeOmniMech(4), mech.canBePrimitive(), mech.canUseFractionalAccounting(4)];
        };
        expect(options("total-warfare")).toEqual([true, true, true]);
        expect(options("battledroids")).toEqual([false, false, false]);
        expect(options("battletech-manual")).toEqual([false, false, false]);
        expect(options("battletech-compendium")).toEqual([true, false, false]);
    });

    it("turns them off when the design moves to an edition without them", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setPrimitive(true);
        mech.setWeightAccounting("fractional", 4);
        expect([mech.isPrimitive(), mech.usesFractionalAccounting()]).toEqual([true, true]);
        mech.setRulesEdition("battledroids");
        expect([mech.isPrimitive(), mech.usesFractionalAccounting()]).toEqual([false, false]);
    });
});

// Issue 40. BattleMech construction in the FASA and FanPro editions takes a fusion engine only: "Each BattleMech
// carries one fusion plant" (BMR p.111). The Internal Combustion Engine is a vehicle and building engine (BTM pp.81-82,
// 84; BTC pp.123, 126; BTC:RoW p.107; BMR p.119; BMR(R) p.128). The Second, Third and Fourth Editions and the 2002 box
// set do not have it at all. From Total Warfare on, a Non-Fusion BattleMech is Experimental (TO:AUE p.120).
describe("ICE engines in BattleMechs by edition (issue 40)", () => {
    const iceOffered = (mech: BattleMech, rulesLevel: number) => mech.getAvailableEngines(rulesLevel).find(engine => engine.tag === "ice")?.available;
    it.each(["battletech-2nd-edition", "battletech-3rd-edition", "battletech-4th-edition", "classic-battletech-box-set"])(
        "%s has no ICE at any rules level", (edition) => {
        const mech = build(edition);
        expect([iceOffered(mech, 4), iceOffered(mech, 6), iceOffered(mech, 7)]).toEqual([false, false, false]);
    });

    it.each(["battletech-manual", "battletech-compendium", "compendium-rules-of-warfare", "master-rules", "master-rules-revised"])(
        "%s offers ICE to a BattleMech only from the Custom Homebrew level", (edition) => {
        const mech = build(edition);
        expect([iceOffered(mech, 4), iceOffered(mech, 5)]).toEqual([false, false]);
        expect(iceOffered(mech, 6)).toBe(true);
    });

    it.each(["battletech-manual", "master-rules-revised"])("%s makes an ICE BattleMech Custom Homebrew and lists the engine", (edition) => {
        const mech = build(edition);
        mech.setEngineType("ice");
        expect(mech.getEngineType().tag).toBe("ice");
        expect(mech.getRequiredRulesLevel()).toBe(6);
        expect(mech.getRulesEditionIssues(4).some(issue => issue.startsWith("Engine: Internal Combustion Engine"))).toBe(true);
        expect(mech.getRulesEditionIssues(6).some(issue => issue.startsWith("Engine:"))).toBe(false);
    });

    it.each(["total-warfare", "battlemech-manual", "core-rulebook"])("%s keeps the Non-Fusion BattleMech at Experimental", (edition) => {
        const mech = build(edition);
        expect([iceOffered(mech, 3), iceOffered(mech, 4)]).toEqual([false, true]);
        mech.setEngineType("ice");
        expect(mech.getRequiredRulesLevel()).toBe(4);
    });
});

// #616. Arm actuators: upper 100, lower 50, hand 80 x tonnage, no shoulder price (BMR(R) p.149; TM p.278). Before this,
// they took the leg rates and a shoulder charge, and removed actuators were still paid for.
describe("arm actuator costs (#616)", () => {
    const tons = 50;
    const multiplier = 1 + tons / 100;

    it("charges the book's prices and no shoulder", () => {
        const log = build().getCBillCalcHTML();
        expect(log).not.toContain("Shoulder");
        expect(log).toContain("Right Upper Arm Actuator<br /><span class=\"smaller-text\">100 x");
        expect(log).toContain("Left Lower Arm Actuator<br /><span class=\"smaller-text\">50 x");
        expect(log).toContain("Left Hand Actuator<br /><span class=\"smaller-text\">80 x");
    });

    it("does not charge for a removed hand, or a removed lower arm and its hand", () => {
        const mech = build();
        const full = mech.getCBillCostNumeric();
        mech.removeHandActuator("la");
        expect(full - mech.getCBillCostNumeric()).toBe(80 * tons * multiplier);
        mech.removeLowerArmActuator("ra");
        expect(full - mech.getCBillCostNumeric()).toBe((80 + 50 + 80) * tons * multiplier);
    });
});

// Maximum Tech pp.62-63, 87, 92 (user rulings R4, 2026-11-03): at Level 3 an armless 'Mech takes no armor or equipment
// in its arms, which are "technically not present"; TW drops the rule, so there it is built at the Apocryphal level.
describe("Armless 'Mechs (Maximum Tech pp.62-63)", () => {
    const armless = (type: string = "biped", edition: string = "master-rules-revised"): BattleMech => {
        const mech = build(edition);
        mech.setMechType(type);
        return mech;
    };

    it("offers armless at BMR(R) Level 3 on bipeds and tripods, at the Apocryphal level under TW, never quads or LAMs", () => {
        expect(armless().getArmlessOption(3).available).toBe(true);
        expect(armless().getArmlessOption(1).available).toBe(false);
        // Maximum Tech (FASA) prints the same p.62 rule, so BMR offers it too (#617; NGCFells 2026-11-20).
        expect(armless("biped", "master-rules").getArmlessOption(3).available).toBe(true);
        expect(armless("biped", "total-warfare").getArmlessOption(4).available).toBe(false);
        expect(armless("tripod", "total-warfare").getArmlessOption(5).available).toBe(true);
        for (const type of ["quad", "lam", "quadvee"]) {
            const mech = armless(type, "total-warfare");
            expect(mech.getArmlessOption(5).available, type).toBe(false);
            expect(mech.setArmless(true), type).toBe(false);
        }
    });

    it("grades the design Level 3 under BMR(R) and Apocryphal under TW", () => {
        const levelThree = armless();
        levelThree.setArmless(true);
        expect(levelThree.getRequiredRulesLevel()).toBe(3);
        const tripod = armless("tripod", "total-warfare");
        tripod.setArmless(true);
        expect(tripod.getRequiredRulesLevel()).toBe(5);
    });

    for (const type of ["biped", "tripod"]) {
        it(`${type}: no arm armor, structure, slots or actuator cost, structure weight unchanged`, () => {
            const mech = armless(type, type === "tripod" ? "total-warfare" : "master-rules-revised");
            mech.allocateArmorMax();
            const { leftArm, rightArm } = mech.getInternalStructure();
            const [weight, maxArmor, cost] = [mech.getInternalStructureWeight(), mech.getMaxArmor(), mech.getCBillCostNumeric()];
            expect(mech.setArmless(true)).toBe(true);
            expect(mech.getInternalStructure().leftArm).toBe(0);
            expect(mech.getInternalStructure().rightArm).toBe(0);
            expect(mech.getInternalStructureWeight()).toBe(weight);
            expect(mech.getMaxArmor()).toBe(maxArmor - ((leftArm ?? 0) + (rightArm ?? 0)) * 2);
            expect(mech.getArmorAllocation().leftArm).toBe(0);
            expect(mech.getArmorAllocation().rightArm).toBe(0);
            expect(mech.getCriticals().leftArm).toEqual([]);
            expect(mech.getCriticals().rightArm).toEqual([]);
            expect(mech.getCBillCostNumeric()).toBeLessThan(cost);
            expect(mech.getPatchworkLocations().map(location => location.key)).not.toContain("leftArm");
            expect(mech.hasHandActuator("la")).toBe(false);
            expect(mech.hasLowerArmActuator("ra")).toBe(false);
            expect(mech.getQuirkTargets().quad).toBeFalsy();
            mech.setArmless(false);
            expect(mech.getInternalStructure().leftArm).toBe(leftArm);
            expect(mech.getCriticals().leftArm.length).toBe(12);
        });
    }

    it("refuses arm equipment (Max Tech p.62): takes it off the arm, and flags a loaded design", () => {
        const mech = armless();
        const laser = add(mech, "medium-laser");
        laser.location = "ra";
        mech.setArmless(true);
        expect(laser.location).toBe("un");
        expect(mech.getChassisEquipmentViolations().join(" ")).not.toContain("armless");
        laser.location = "ra";
        expect(mech.getChassisEquipmentViolations().join(" ")).toContain("Medium Laser: an armless 'Mech has no arms to mount it (Maximum Tech p.62).");
    });

    it("spreads equipment over the locations left, at the slot count of a 'Mech with arms", () => {
        const tripod = armless("tripod", "total-warfare");
        const stealth = { space: { battlemech: 12 }, spreadLocations: "limbs-and-side-torsos" } as Parameters<BattleMech["getSpreadSlotCount"]>[0];
        const slots = tripod.getSpreadSlotCount(stealth);
        tripod.setArmless(true);
        expect(tripod.getSpreadSlotCount(stealth)).toBe(slots);
    });

    it("adds 0.1 to the Defensive Movement Factor under BMR(R) Level 3 (Max Tech p.92)", () => {
        const mech = armless();
        mech.setArmless(true);
        expect(mech.getBVCalcHTML()).toContain("Built without arms: 0.1 added to the Defensive Movement Factor");
    });

    it("keeps BV2 as built: no Defensive Movement Factor bonus under TW", () => {
        const mech = armless("tripod", "total-warfare");
        mech.setArmless(true);
        expect(mech.getBVCalcHTML()).not.toContain("Built without arms: 0.1 added to the Defensive Movement Factor");
    });

    it("does nothing on an arm hit: no damage, no transfer, no critical hit (Max Tech p.62)", () => {
        const mech = armless();
        mech.allocateArmorMax();
        mech.setArmless(true);
        const before = [mech.getCurrentArmor(), mech.getCurrentStructure()];
        for (const arm of ["la", "ra"]) {
            const results = mech.takeDamage(20, arm, false);
            expect(results.map(result => result.amount)).toEqual([0]);
            expect(results[0].criticalEffects.join(" ")).toContain("no effect");
            expect(mech.rollCriticalHit(arm, { chance: 12 }).join(" ")).toContain("no effect");
        }
        expect([mech.getCurrentArmor(), mech.getCurrentStructure()]).toEqual(before);
        mech.takeDamage(5, "lt", false);
        expect(mech.getCurrentArmor()).toBe(before[0] - 5);
    });

    it("lists Armless in the TRO weights and survives a save and load", () => {
        const mech = armless();
        mech.allocateArmorMax();
        mech.setArmless(true);
        expect(mech.makeTROHTML()).toContain("Armless");
        expect(mech.makeTROBBCode()).toContain("Armless");
        const saved = mech.exportJSON();
        expect(JSON.parse(saved).features).toContain("armless");
        const loaded = new BattleMech(saved);
        expect(loaded.isArmless()).toBe(true);
        expect(loaded.getInternalStructure().leftArm).toBe(0);
        expect(loaded.getCriticals().rightArm).toEqual([]);
        expect(loaded.getMaxArmor()).toBe(mech.getMaxArmor());
    });
});

// Maximum Tech pp.80-81, 87, 92; TO:AUE p.105 (user rulings R2, R3, 2026-11-03): strapped-on cargo, so no design weight,
// no slots, no cargo MP penalty; BV1 adds MP x 5 to the final BV, BV2 leaves the pack out.
describe("Jump packs (Maximum Tech pp.80-81; TO:AUE p.105)", () => {
    const BMRR = "master-rules-revised";
    const pack = (edition: string, tonnage: number, walk: number, tons: number): BattleMech => {
        const mech = build(edition, tonnage, walk);
        mech.setJumpPackTons(tons);
        return mech;
    };

    describe("in play", () => {
        const jump = (mech: BattleMech, mp: number) => {
            mech.currentMovementMode = "j";
            mech.currentTargetJumpingMP = mp;
        };

        it("jumps on the pack without heat (Maximum Tech p.81; TO:AUE p.105)", () => {
            const mech = pack(BMRR, 55, 5, 4);
            jump(mech, 5);
            expect(mech.getActiveMoveHeat()).toBe(0);
        });

        it("spends a hex of fuel per hex under Maximum Tech, then drops the empty pack (p.81)", () => {
            const mech = pack(BMRR, 55, 5, 4);
            expect(mech.getJumpPackFuelLeft()).toBe(10);
            jump(mech, 5);
            expect(mech.getJumpPackFuelLeft()).toBe(5);
            mech.turnReset();
            expect(mech.getJumpPackFuelLeft()).toBe(5);
            jump(mech, 5);
            mech.turnReset();
            expect(mech.getJumpPackSpeed()).toBe(0);
            expect(mech.jumpPackLost).toBe("out of fuel, dropped");
        });

        it("spends no fuel when the move of the turn was not a pack jump", () => {
            const mech = pack(BMRR, 55, 5, 4);
            jump(mech, 5);
            mech.currentMovementMode = "w";
            mech.turnReset();
            expect(mech.getJumpPackFuelLeft()).toBe(10);
        });

        it("cannot jump further than the fuel left", () => {
            const mech = pack(BMRR, 55, 5, 4);
            jump(mech, 4);
            mech.turnReset();
            jump(mech, 3);
            mech.turnReset();
            expect(mech.getJumpPackSpeed()).toBe(3);
        });

        it("is destroyed by a rear torso hit and by no other hit (Maximum Tech p.81; TO:AUE p.105)", () => {
            const mech = pack("total-warfare", 55, 6, 6);
            expect(mech.takeDamage(1, "ct", false)).toEqual([]);
            expect(mech.takeDamage(1, "rl", true)).toEqual([]);
            expect(mech.jumpPackLost).toBe("");
            const result = mech.takeDamage(1, "lt", true);
            expect(result[0].criticalEffects[0]).toContain("Jump pack destroyed");
            expect(mech.jumpPackLost).toBe("destroyed");
            expect(mech.getJumpPackSpeed()).toBe(0);
        });

        it("is not hit by an ammunition explosion, which is no attack", () => {
            const mech = pack("total-warfare", 55, 6, 6);
            mech.takeDamage(1, "ct", true, { structureOnly: true });
            expect(mech.jumpPackLost).toBe("");
        });

        it("is slowed by a medium shield as jump jets are (provides jumping in the same manner, p.105)", () => {
            const mech = pack("total-warfare", 55, 6, 6);
            mech.addEquipmentFromTag("shield-medium", "is", "la", false, undefined, "", false, [], undefined, undefined);
            expect(mech.getJumpPackSpeed()).toBe(mech.getJumpPackMP() - 1);
        });

        it("is whole again after a damage reset", () => {
            const mech = pack(BMRR, 55, 5, 4);
            jump(mech, 5);
            mech.turnReset();
            mech.dropJumpPack();
            mech.resetDamage();
            expect(mech.jumpPackLost).toBe("");
            expect(mech.getJumpPackFuelLeft()).toBe(10);
        });

        it("keeps fuel and losses across a save, but not in a design export", () => {
            const mech = pack(BMRR, 55, 5, 4);
            jump(mech, 3);
            mech.turnReset();
            mech.dropJumpPack();
            jump(mech, 1);
            const loaded = new BattleMech(mech.exportJSON());
            expect(loaded.jumpPackFuelUsed).toBe(3);
            expect(loaded.jumpPackLost).toBe("dropped");
            const design = JSON.parse(mech.exportJSON(true));
            expect(design).not.toHaveProperty("jumpPackFuelUsed");
            expect(design).not.toHaveProperty("jumpPackLost");
        });

        it("words the sheet line for each edition, and for a lost pack", () => {
            expect(pack(BMRR, 55, 5, 4).getJumpPackNote()).toContain("Jump pack: 4 t, 10 hexes");
            expect(pack(BMRR, 55, 5, 4).getJumpPackNote()).not.toContain("combat drop");
            const tw = pack("total-warfare", 55, 6, 6);
            expect(tw.getJumpPackNote()).toContain("Jump pack: 6 t, 72 fuel");
            expect(tw.getJumpPackNote()).not.toMatch(/combat drop/i);
            tw.dropJumpPack();
            expect(tw.getJumpPackNote()).toBe("Jump pack: dropped");
            expect(new BattleMech().getJumpPackNote()).toBe("");
        });

        it("shows the pack as the Jumping MP until it is dropped", () => {
            const mech = pack("total-warfare", 55, 6, 6);
            expect(mech.getJumpingText()).toBe("6");
            mech.dropJumpPack();
            expect(mech.getJumpingText()).toBe("0");
        });
    });

    it("is offered at Level 3 under BMR(R) and Advanced under TW, not before the Revised Master Rules", () => {
        expect(build(BMRR).getJumpPackOption(3).available).toBe(true);
        expect(build(BMRR).getJumpPackOption(2).available).toBe(false);
        expect(build("master-rules").getJumpPackOption(3).available).toBe(false);
        expect(build("total-warfare").getJumpPackOption(3).available).toBe(true);
        expect(build("total-warfare").getJumpPackOption(2).available).toBe(false);
    });

    it("follows the IO:AE p.29 dates under TW, while Maximum Tech prints none", () => {
        const inEra = (edition: string, era: string) => {
            const mech = build(edition);
            mech.setEra(era);
            return mech.getJumpPackOption(3).available;
        };
        expect(inEra("total-warfare", "star-league")).toBe(true);
        expect(inEra("total-warfare", "clan-inv")).toBe(false);
        expect(inEra(BMRR, "clan-inv")).toBe(true);
    });

    describe.each([BMRR, "total-warfare"])("is only for a 'Mech without jump jets under %s (TO:AUE p.105)", (edition) => {
        const expectBarred = (mech: BattleMech) => {
            expect(mech.getJumpPackOption(3).available).toBe(false);
            expect(mech.getJumpPackTons()).toBe(0);
            expect(mech.getJumpPackMP()).toBe(0);
        };

        it("goes when the 'Mech mounts jump jets, and comes back without them", () => {
            const mech = pack(edition, 55, 5, 4);
            mech.setJumpSpeed(3);
            expectBarred(mech);
            expect(mech.getJumpingText()).toBe("3");
            mech.setJumpSpeed(0);
            expect(mech.getJumpPackTons()).toBe(4);
        });

        it("goes when a 'Mech becomes a LAM, which has jump jets", () => {
            const mech = pack(edition, 55, 5, 4);
            expect(mech.getJumpPackMP()).toBe(5);
            mech.setMechType("lam");
            expectBarred(mech);
        });

        it("goes beside a partial wing, which needs integrated jets", () => {
            const mech = pack(edition, 55, 5, 4);
            mech.addEquipmentFromTag("partial-wing", "is", "lt", false, undefined, "", false, [], undefined, undefined);
            expect(mech.hasPartialWing()).toBe(true);
            expectBarred(mech);
        });
    });

    it("reaches Clan designs through the Star League version before Clan production in 3083 (IO:AE p.29)", () => {
        const mech = build("total-warfare");
        mech.setTech("clan");
        mech.setEra("clan-inv");
        expect(mech.getJumpPackOption(3).available).toBe(true);
        expect(mech.getJumpPackOption(3).availableAsPrototype).toBe(false);
    });

    it("is not offered above 100 tons, where the tables stop", () => {
        expect(build("total-warfare", 120, 3).getJumpPackOption(3).available).toBe(false);
    });

    it("gives a 4-ton pack 8 / 4 / 2 MP by weight class under BMR(R) (Max Tech p.81)", () => {
        expect(pack(BMRR, 55, 8, 4).getJumpPackMP()).toBe(8);
        expect(pack(BMRR, 60, 8, 4).getJumpPackMP()).toBe(4);
        expect(pack(BMRR, 90, 8, 4).getJumpPackMP()).toBe(2);
    });

    it("drops a fraction of a jump jet's weight under BMR(R)", () => {
        expect(pack(BMRR, 60, 8, 1.5).getJumpPackMP()).toBe(1);
    });

    it("TO:AUE: 6 t on 55 t, Walk 6 = 6 MP, 72 fuel (TO:AUE p.105)", () => {
        const mech = pack("total-warfare", 55, 6, 6);
        expect(mech.getJumpPackMP()).toBe(6);
        expect(mech.getJumpPackFuel()).toBe(72);
    });

    it("TO:AUE rounds MP up: 1.5 t on 90 t gives 1 MP, 9 fuel", () => {
        const mech = pack("total-warfare", 90, 4, 1.5);
        expect(mech.getJumpPackMP()).toBe(1);
        expect(mech.getJumpPackFuel()).toBe(9);
    });

    it("caps pack MP at Walking MP", () => {
        expect(pack(BMRR, 55, 3, 4).getJumpPackMP()).toBe(3);
    });

    it("carries fuel for MP x 2 hexes under BMR(R) (Max Tech p.80)", () => {
        expect(pack(BMRR, 55, 5, 4).getJumpPackFuel()).toBe(10);
    });

    it("takes half-ton steps up to the 'Mech's tonnage, and no more than 20 tons under TW", () => {
        expect(build(BMRR, 55, 5).getMaxJumpPackTons()).toBe(55);
        expect(build("total-warfare", 55, 5).getMaxJumpPackTons()).toBe(20);
        expect(pack("total-warfare", 55, 5, 30).getJumpPackTons()).toBe(20);
        expect(pack(BMRR, 55, 5, 2.3).getJumpPackTons()).toBe(2.5);
    });

    it("cuts a pack down when the 'Mech shrinks below it", () => {
        const mech = pack(BMRR, 55, 5, 40);
        mech.setTonnage(30);
        expect(mech.getJumpPackTons()).toBe(30);
    });

    it("is cargo: no design weight, slots, jump jets or walking penalty (R2)", () => {
        const mech = build(BMRR, 55, 5);
        const slots = () => JSON.stringify(mech.getCriticals()).replace(/"uuid":"[^"]*"/g, "");
        const [remaining, criticals, walk] = [mech.getRemainingTonnage(), slots(), mech.getWalkSpeed()];
        mech.setJumpPackTons(4);
        expect(mech.getRemainingTonnage()).toBe(remaining);
        expect(slots()).toBe(criticals);
        expect(mech.getWalkSpeed()).toBe(walk);
        expect(mech.getJumpSpeed()).toBe(0);
    });

    for (const edition of [BMRR, "total-warfare"]) {
        it(`costs 20,000 a ton as equipment under ${edition} (Max Tech p.87; TO:AUE cost table)`, () => {
            const mech = build(edition, 55, 5);
            const cost = mech.getCBillCostNumeric();
            mech.setJumpPackTons(6);
            expect(mech.getCBillCostNumeric() - cost).toBe(6 * 20000 * 1.55);
        });
    }

    it("adds pack MP x 5 to the final BV, no jump in the speed factor (Max Tech p.92)", () => {
        const mech = build(BMRR, 55, 6);
        const battleValue = mech.getBattleValue();
        mech.setJumpPackTons(3);
        expect(mech.getBattleValue()).toBe(battleValue + 30);
        expect(mech.getBVCalcHTML()).toContain("Jump pack: 6 MP x 5 = 30");
    });

    it("leaves BV2 alone (R3: book-silent)", () => {
        const mech = build("total-warfare", 55, 6);
        const battleValue = mech.getBattleValue();
        mech.setJumpPackTons(3);
        expect(mech.getBattleValue()).toBe(battleValue);
    });

    it("grades the design Level 3 and flags a pack the edition lacks", () => {
        const mech = pack(BMRR, 55, 5, 4);
        expect(mech.getRequiredRulesLevel()).toBe(3);
        mech.setRulesEdition("master-rules");
        expect(mech.getRulesEditionIssues(3).join(" ")).toContain("Jump pack");
    });

    it("lists the pack in the TRO and survives a save and load", () => {
        const mech = pack(BMRR, 55, 5, 4);
        expect(mech.makeTROHTML()).toContain("Jump Pack (4 t)");
        expect(mech.makeTROBBCode()).toContain("Jump Pack (4 t)");
        const saved = mech.exportJSON();
        expect(JSON.parse(saved).jumpPackTons).toBe(4);
        expect(new BattleMech(saved).getJumpPackTons()).toBe(4);
        expect(new BattleMech(saved).getJumpPackMP()).toBe(5);
    });

    it("leaves the save unchanged without a pack", () => {
        expect(JSON.parse(build(BMRR).exportJSON())).not.toHaveProperty("jumpPackTons");
    });
});

// Maximum Tech p.62 (both printings; #617): "In Level 2 play, these 'Mechs are treated the same as 'Mechs with arms; the arms have
// armor, internal structure and an upper arm and shoulder actuator, but contain no other components." Level 3 is the rule above.
describe("Armless 'Mechs at Level 2: the arms stay (Maximum Tech p.62; #617)", () => {
    const armless = (type: string = "biped", edition: string = "master-rules-revised"): BattleMech => {
        const mech = build(edition);
        mech.setMechType(type);
        return mech;
    };

    it("is offered from Level 2 in both Master Rules editions, still apocryphal under Total Warfare", () => {
        for (const edition of ["master-rules", "master-rules-revised"]) {
            expect(armless("biped", edition).getArmlessOption(2).available, edition).toBe(true);
            expect(armless("biped", edition).getArmlessOption(3).available, edition).toBe(true);
            expect(armless("biped", edition).getArmlessOption(1).available, edition).toBe(false);
        }
        expect(armless("biped", "total-warfare").getArmlessOption(4).available).toBe(false);
        expect(armless("biped", "total-warfare").getArmlessOption(5).available).toBe(true);
    });

    it("keeps arm armor, structure, shoulder and upper arm, and drops the lower arm and hand actuators", () => {
        const mech = armless();
        mech.allocateArmorMax();
        const structure = mech.getInternalStructure();
        const [maxArmor, arm] = [mech.getMaxArmor(), mech.getArmorAllocation().leftArm];
        expect(mech.setArmless(true, 2)).toBe(true);
        expect(mech.isArmless()).toBe(false);
        expect(mech.hasArmlessArms()).toBe(true);
        expect(mech.getInternalStructure().leftArm).toBe(structure.leftArm);
        expect(mech.getMaxArmor()).toBe(maxArmor);
        expect(mech.getArmorAllocation().leftArm).toBe(arm);
        expect(mech.hasLowerArmActuator("la")).toBe(false);
        expect(mech.hasHandActuator("ra")).toBe(false);
        mech.addLowerArmActuator("la");
        mech.addHandActuator("ra");
        expect(mech.hasLowerArmActuator("la")).toBe(false);
        expect(mech.hasHandActuator("ra")).toBe(false);
        expect(mech.getCriticals().leftArm.slice(0, 2).map((slot) => slot?.tag)).toEqual(["shoulder", "upper-arm-actuator"]);
        expect(mech.getCriticals().leftArm.length).toBe(12);
    });

    it("takes equipment off the arms, flags it when put back, and buys only the upper arm actuator (BMR(R) p.149; MT p.87)", () => {
        const mech = armless();
        const laser = add(mech, "medium-laser");
        laser.location = "ra";
        mech.setArmless(true, 2);
        expect(laser.location).toBe("un");
        laser.location = "la";
        expect(mech.getChassisEquipmentViolations().join(" ")).toContain("Medium Laser: an armless 'Mech's arms hold nothing but the shoulder and upper arm actuator (Maximum Tech p.62).");
        // Upper arm 100 x tonnage each, no lower arm (50) or hand (80): 2 x 130 x 50 tons less, times the final multiplier 1.5 (50 tons).
        const [bare, withArms] = [armless(), armless()];
        bare.setArmless(true, 2);
        expect(withArms.getCBillCostNumeric() - bare.getCBillCostNumeric()).toBe(2 * (50 + 80) * 50 * 1.5);
    });

    it("rates BV1 like a 'Mech with arms (no 0.1 on the Defensive Movement Factor) and grades the design Level 2", () => {
        const level2 = armless();
        level2.setArmless(true, 2);
        expect(level2.getRequiredRulesLevel()).toBeLessThanOrEqual(2);
        const level3 = armless();
        level3.setArmless(true, 3);
        expect(level3.getRequiredRulesLevel()).toBe(3);
        // No 0.1 on the Defensive Movement Factor: the same BV as a 'Mech with arms whose lower arms and hands are left off.
        const noHands = armless();
        for (const arm of ["la", "ra"]) noHands.removeLowerArmActuator(arm);
        expect(level2.getBattleValue()).toBe(noHands.getBattleValue());
        expect(level2.getBattleValue()).not.toBe(level3.getBattleValue());
    });

    it("saves and loads the Level 2 variant apart from the Level 3 one", () => {
        const two = armless();
        two.setArmless(true, 2);
        const loadedTwo = new BattleMech(two.exportJSON());
        expect([loadedTwo.isArmless(), loadedTwo.hasArmlessArms()]).toEqual([false, true]);
        const three = armless();
        three.setArmless(true, 3);
        const loadedThree = new BattleMech(three.exportJSON());
        expect([loadedThree.isArmless(), loadedThree.hasArmlessArms()]).toEqual([true, false]);
    });

    it("drops the armless choice when the chassis becomes a quad, and it stays dropped after switching back", () => {
        for (const level of [2, 3]) {
            const mech = armless();
            mech.setArmless(true, level);
            mech.setMechType("quad");
            mech.setMechType("biped");
            expect(mech.isArmless(), `level ${level}`).toBe(false);
            expect(mech.hasArmlessArms(), `level ${level}`).toBe(false);
        }
    });
});

describe("Armless 'Mechs and FrankenMech arm donors (#617)", () => {
    for (const level of [2, 3]) {
        it(`refuses an arm donor on a Level ${level} armless 'Mech and clears the ones it had`, () => {
            const mech = build();
            expect(mech.setFrankenMech(true)).toBe(true);
            mech.setFrankenMechDonor("leftArm", { tonnage: 35, name: "Donor" });
            expect(mech.getFrankenMechDonor("leftArm").tonnage).toBe(35);
            mech.setArmless(true, level);
            expect(mech.getFrankenMechLocations().map((location) => location.key)).not.toContain("leftArm");
            expect(mech.getFrankenMechLocations().map((location) => location.key)).not.toContain("rightArm");
            expect(mech.getFrankenMechDonor("leftArm").tonnage).toBe(mech.getTonnage());
            mech.setFrankenMechDonor("rightArm", { tonnage: 35 });
            expect(mech.getFrankenMechDonor("rightArm").tonnage).toBe(mech.getTonnage());
            mech.setArmless(false);
            expect(mech.getFrankenMechLocations().map((location) => location.key)).toContain("leftArm");
        });
    }
});

// Combat drops (#628). TO:AUE p.105: a jump pack lets a 'Mech without integral jump jets (or a Vehicular Drop Chute) follow the
// dropping rules, but it burns up all its fuel during the landing action and is jettisoned on landing. BMR(R) p.78: any 'Mech may
// make an assault drop, rolling Piloting for the landing; the dropping troops wear their own jump packs, and Maximum Tech's
// pack rules (pp.80-81) say nothing of drops, so the pack is neither needed nor spent.
describe("Combat drop with a jump pack (TO:AUE p.105; BMR(R) p.78)", () => {
    const withPack = (edition: string, tons: number, walk: number, packTons: number): BattleMech => {
        const mech = build(edition, tons, walk);
        mech.setJumpPackTons(packTons);
        return mech;
    };

    it("lets a Total Warfare 'Mech with no jump jets drop on its pack, burning all the fuel and jettisoning it", () => {
        const mech = withPack("total-warfare", 55, 6, 6);
        expect(mech.canCombatDrop()).toEqual({ allowed: true, reason: "" });
        const log = mech.combatDrop();
        expect(log.join(" ")).toMatch(/burns all (72 )?fuel/i);
        expect(mech.getJumpPackFuelLeft()).toBe(0);
        expect(mech.jumpPackLost).toBe("jettisoned in a combat drop");
        expect(mech.getJumpPackNote()).toBe("Jump pack: jettisoned in a combat drop");
    });

    it("refuses a Total Warfare 'Mech with neither jump jets, a drop chute nor a pack with fuel", () => {
        expect(build("total-warfare").canCombatDrop().allowed).toBe(false);
        expect(build("total-warfare").canCombatDrop().reason).toMatch(/jump jets|drop chute|jump pack/i);
        const spent = withPack("total-warfare", 55, 6, 6);
        spent.dropJumpPack();
        expect(spent.canCombatDrop().allowed).toBe(false);
        expect(build("total-warfare").combatDrop()).toEqual([]);
    });

    it("lets a 'Mech with jump jets drop on them: it cannot carry a pack, and the jets are not spent", () => {
        const jets = build("total-warfare", 55, 5);
        jets.setJumpSpeed(4);
        expect(jets.canCarryJumpPack()).toBe(false);
        expect(jets.canCombatDrop().allowed).toBe(true);
        expect(jets.combatDrop().join(" ")).not.toMatch(/fuel/i);
        expect(jets.jumpPackLost).toBe("");
    });

    it("lets any 'Mech make the BMR(R) assault drop and leaves a Maximum Tech pack alone", () => {
        const plain = build("master-rules-revised");
        expect(plain.canCombatDrop().allowed).toBe(true);
        const mech = withPack("master-rules-revised", 55, 5, 4);
        const fuel = mech.getJumpPackFuelLeft();
        const log = mech.combatDrop();
        expect(log.join(" ")).toMatch(/Piloting Skill Roll/i);
        expect(mech.getJumpPackFuelLeft()).toBe(fuel);
        expect(mech.jumpPackLost).toBe("");
    });

    it("no longer leaves the combat drop as a sheet note", () => {
        expect(withPack("total-warfare", 55, 6, 6).getJumpPackNote()).not.toMatch(/combat drop/i);
    });

    // The assault drop is printed in the Compendium: Rules of Warfare (p.82), BMR (pp.72-73) and BMR(R) (p.78); the editions
    // before them print no dropping rule, so they offer no drop (Opus review).
    it("offers the assault drop only in the earlier editions that print it, citing each one's own page", () => {
        const cited: Record<string, RegExp> = {
            "compendium-rules-of-warfare": /CRoW p\.82/, "master-rules": /BMR pp\.72-73/, "master-rules-revised": /BMR\(R\) p\.78/,
        };
        for (const [edition, page] of Object.entries(cited)) {
            const mech = build(edition);
            expect(mech.canCombatDrop().allowed, edition).toBe(true);
            expect(mech.combatDrop().join(" "), edition).toMatch(page);
        }
        // NGCFells D15 (2026-11-23): a 'Mech with no jump jets drops in a drop pod under a chute (flavor, BMR(R) p.78); one with jets does not.
        const podless = build("master-rules-revised", 55, 5);
        podless.setJumpSpeed(3);
        expect(build("master-rules-revised").combatDrop().join(" ")).toMatch(/drop pod and chute.*BMR\(R\) p\.78/);
        expect(podless.combatDrop().join(" ")).not.toMatch(/drop pod/);
        for (const edition of ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "battletech-4th-edition"]) {
            const mech = build(edition);
            expect(mech.canCombatDrop().allowed, edition).toBe(false);
            expect(mech.combatDrop(), edition).toEqual([]);
        }
    });
});

// Maximum Tech pp.85-86 (Level 3 tables) and pp.116-118 (master tables, both printings): the heavy flamer and the three
// artillery cannons are on the Inner Sphere tables only; the Clan tables print neither. The records are universal from Total
// Warfare on, so under BMR and BMR(R) a pure Clan 'Mech must not be offered them (Opus review, #612). Mixed Tech may (MT p.57).
describe("Maximum Tech Inner Sphere-only items under the Master Rules (MT pp.85-86, 116-118)", () => {
    const IS_ONLY = ["heavy-flamer", "long-tom-cannon", "sniper-cannon", "thumper-cannon",
        "ammo-heavy-flamer-standard", "ammo-long-tom-cannon-standard", "ammo-sniper-cannon-standard", "ammo-thumper-cannon-standard"];
    const listed = (edition: string, tech: string) => {
        const mech = build(edition);
        mech.setTech(tech);
        return mech.getAvailableEquipment(false, 3).map(item => item.tag);
    };

    for (const edition of ["master-rules", "master-rules-revised"]) {
        it(`offers them to Inner Sphere and Mixed Tech 'Mechs but not to Clan ones under ${edition}`, () => {
            expect(listed(edition, "is")).toEqual(expect.arrayContaining(IS_ONLY));
            expect(listed(edition, "mis")).toEqual(expect.arrayContaining(IS_ONLY));
            const clan = listed(edition, "clan");
            for (const tag of IS_ONLY) expect(clan, tag).not.toContain(tag);
        });

        it(`flags a Clan 'Mech that already mounts one under ${edition}, and still loads it`, () => {
            const mech = build(edition);
            mech.setTech("clan");
            add(mech, "heavy-flamer");
            expect(mech.getRulesEditionIssues(3).join(" ")).toMatch(/Heavy Flamer \(Inner Sphere only in /);
            expect(new BattleMech(mech.exportJSON()).getInstalledEquipment().some(item => item?.tag === "heavy-flamer")).toBe(true);
        });
    }

    it("keeps them universal from Total Warfare on", () => {
        expect(listed("total-warfare", "clan")).toEqual(expect.arrayContaining(["heavy-flamer", "long-tom-cannon", "sniper-cannon", "thumper-cannon"]));
        const mech = build("total-warfare");
        mech.setTech("clan");
        add(mech, "heavy-flamer");
        expect(mech.getRulesEditionIssues(3).join(" ")).not.toMatch(/Inner Sphere only/);
    });
});
