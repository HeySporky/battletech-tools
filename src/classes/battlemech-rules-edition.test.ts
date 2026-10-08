import { describe, expect, it } from "vitest";
import { getAvailableTonnagesForMechType, getTonnageBoundsForMechType } from "../data/mech-tonnages";
import { mechTypeOptions } from "../data/mech-type-options";
import { DEFAULT_RULES_EDITION, editionHasBattleValue, editionHasPrices, getRulesEdition, getSelectableRulesEditions, isEarlierRulesEdition } from "../data/rules-editions";
import { BattleMech } from "./battlemech";

const build = (edition?: string, tonnage: number = 50, walk: number = 4): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-ages");
    mech.setTonnage(tonnage);
    mech.setWalkSpeed(walk);
    if (edition) mech.setRulesEdition(edition);
    return mech;
};
const add = (mech: BattleMech, tag: string) => mech.addEquipmentFromTag(tag, mech.getTech().tag, "", false, undefined, "", false, [], undefined, undefined)!;
const offered = (mech: BattleMech) => mech.getAvailableEquipment(false, 2).filter(item => item.available).map(item => item.tag);
const available = (list: { tag: string; available?: boolean }[]) => list.filter(option => option.available).map(option => option.tag);

describe("Rules edition selector", () => {
    it("offers Total Warfare, the Core Rulebook and every earlier edition entered whole", () => {
        expect(getSelectableRulesEditions().map(edition => edition.tag)).toEqual([
            "battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition",
            "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "core-rulebook",
        ]);
        expect(["battledroids", "master-rules-revised", "total-warfare", "core-rulebook", "nonsense"].map(isEarlierRulesEdition))
            .toEqual([true, true, false, false, false]);
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
        expect(launcher.heat).toBe(2);
        expect(launcher.book).not.toBe("BD");
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
        expect(mech.getRulesEditionIssues()).toEqual(["Equipment: ER Large Laser"]);
        mech.setRulesEdition("battletech-compendium");
        expect(mech.getRulesEditionIssues()).toEqual([]);
        const light = build("battledroids", 10, 4);
        expect(light.getRulesEditionIssues()).toEqual([]);
        light.setRulesEdition("master-rules");
        expect(light.getRulesEditionIssues()).toEqual(["Tonnage: 10 tons"]);
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
        // Head 9, every other location twice its boxes (BD p.25).
        expect(mech.getMaxArmor()).toBe(9 + 2 * (3 + 2 + 2 + 1 + 1 + 1 + 1));

        const restored = new BattleMech(mech.exportJSON());
        expect([restored.getTonnage(), restored.getRulesEdition(), restored.getInternalStructure().centerTorso]).toEqual([5, "battledroids", 3]);
        // Under an edition without the chassis the design still opens, and the tonnage is reported.
        restored.setRulesEdition("total-warfare");
        expect(restored.getInternalStructure().centerTorso).toBe(3);
        restored.setRulesEdition("master-rules");
        expect(restored.getRulesEditionIssues()).toContain("Tonnage: 5 tons");
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

    it("asks for no rules level under an earlier edition", () => {
        expect(build(undefined, 10, 4).getRequiredRulesLevel()).toBe(3);
        expect(build("battledroids", 10, 4).getRequiredRulesLevel()).toBe(0);
    });

    // No edition before the Master Rules has Battle Value; Battledroids, the Second, Third and Fourth Editions print no prices.
    it("knows which editions have Battle Value and prices", () => {
        const tags = ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition",
            "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "core-rulebook"];
        expect(tags.map(editionHasBattleValue)).toEqual([false, false, false, false, false, false, false, true, true, true, true]);
        expect(tags.map(editionHasPrices)).toEqual([false, false, true, true, false, true, false, true, true, true, true]);
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
