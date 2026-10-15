import { describe, expect, it } from "vitest";
import BattleArmor from "./battle-armor";
import { importBattleArmorBlk } from "./battle-armor-blk";
import { battleArmorEquipment, isBattleArmorDateAvailable } from "../data/battle-armor-equipment";
import { parseBlkFile } from "../utils/blk-file";

// A Clan Elemental with a small laser, as the Master Unit List publishes it: Point of five.
const elemental = (): BattleArmor => {
    const suit = new BattleArmor();
    suit.setTechBase("clan");
    suit.setWeightClass("medium");
    suit.setMotive("jump", 3);
    suit.setManipulator("la", "battle-claw");
    suit.setArmorPoints(10);
    suit.addItem("clan-small-laser", "ra");
    suit.updateItem(0, { modular: true });
    suit.addItem("clan-srm-2", "body");
    suit.updateItem(1, { shots: 2 });
    suit.addAPMount("la");
    suit.setSquadSize(5);
    return suit;
};

const purifier = (troopers: number): BattleArmor => {
    const suit = new BattleArmor();
    suit.setWeightClass("medium");
    suit.setMotive("jump", 3);
    suit.setManipulator("ra", "battle-claw");
    suit.setArmor("ba-mimetic");
    suit.setArmorPoints(6);
    suit.addItem("is-er-small-laser", "la");
    suit.updateItem(0, { modular: true });
    suit.setSquadSize(troopers);
    return suit;
};

describe("Battle armor equipment from Tactical Operations (TO:AUE pp.91-161, 224-225)", () => {
    it("lists the Advanced and Experimental items at their rules level, with unique tags", () => {
        const tags = battleArmorEquipment.map((entry) => entry.tag);
        expect(new Set(tags).size).toBe(tags.length);
        const find = (tag: string) => battleArmorEquipment.find((entry) => entry.tag === tag);
        expect(find("clan-lb-x-autocannon")).toMatchObject({ kg: 400, slots: 2, bv: 20, cost: 70000, rulesLevel: 3, book: "TO:AUE" });
        expect(find("is-medium-variable-speed-pulse-laser")).toMatchObject({ kg: 900, slots: 4, bv: 56, cost: 200000, rulesLevel: 3 });
        expect(find("clan-er-medium-pulse-laser")).toMatchObject({ kg: 800, slots: 4, bv: 117, cost: 150000, rulesLevel: 4 });
        expect(find("is-angel-ecm")).toMatchObject({ kg: 250, slots: 3, cost: 750000, defensiveValue: 2 });
        expect(find("clan-angel-ecm")?.kg).toBe(150);
        expect(find("is-taser")).toMatchObject({ kg: 300, slots: 3, bv: 15, cost: 10000 });
        // TechManual items stay at the Standard level.
        expect(find("is-small-laser")?.rulesLevel).toBeUndefined();
    });

    it("offers Tactical Operations items only from their rules level up, and reports the level a suit needs", () => {
        const suit = new BattleArmor();
        expect(suit.getAvailableEquipment(2).some((entry) => entry.book === "TO:AUE")).toBe(false);
        expect(suit.getAvailableEquipment(3).some((entry) => entry.tag === "is-heavy-flamer")).toBe(true);
        expect(suit.getAvailableEquipment(3).some((entry) => entry.tag === "is-angel-ecm")).toBe(false);
        expect(suit.getAvailableEquipment(4).some((entry) => entry.tag === "is-angel-ecm")).toBe(true);
        expect(suit.getRequiredRulesLevel()).toBe(2);
        suit.addItem("is-heavy-flamer", "ra");
        expect(suit.getRequiredRulesLevel()).toBe(3);
        suit.addItem("is-angel-ecm", "body");
        expect(suit.getRequiredRulesLevel()).toBe(4);
        // What is mounted stays on offer at any level.
        expect(suit.getAvailableEquipment(2).some((entry) => entry.tag === "is-angel-ecm")).toBe(true);
    });

    it("carries a weapon in a detachable weapon pack at three quarters of its weight and one slot (TO:AUE pp.98-99)", () => {
        const suit = new BattleArmor();
        suit.setWeightClass("heavy");
        suit.setGroundMP(2);
        suit.addItem("is-medium-laser", "ra");
        expect(suit.getItemWeight(suit.getItems()[0])).toBe(500);
        expect(suit.getItemSlots(suit.getItems()[0])).toBe(3);
        suit.updateItem(0, { dwp: true });
        expect(suit.getItemWeight(suit.getItems()[0])).toBe(375);
        expect(suit.getItemSlots(suit.getItems()[0])).toBe(1);
        expect(suit.getRequiredRulesLevel()).toBe(3);
        expect(suit.getIssues()).toEqual([]);
        // 62.5% of a support PPC's 250 kg is 187.5, rounded up to the nearest 5 kg.
        suit.addItem("is-support-ppc", "la");
        suit.updateItem(1, { dwp: true });
        expect(suit.getItemWeight(suit.getItems()[1])).toBe(190);
        // The pack costs 18,000 on top of the weapon, and slows the suit while it is carried.
        expect(suit.getCBillCostLog().join(" ")).toContain("Weapons, equipment and mounts: 90,000");
        expect(suit.getPlayMovement().ground).toBe(1);
        suit.setPacksJettisoned(true);
        expect(suit.getPlayMovement().ground).toBe(2);
    });

    it("keeps detachable weapon packs to Medium and heavier suits and off missile launchers (TO:AUE pp.98-99)", () => {
        const light = new BattleArmor();
        light.setWeightClass("light");
        light.addItem("is-small-laser", "ra");
        light.updateItem(0, { dwp: true });
        expect(light.getIssues().join(" ")).toContain("Only Medium, Heavy and Assault battle armor may carry a detachable weapon pack");
        const medium = new BattleArmor();
        medium.addItem("is-srm-2", "body");
        medium.updateItem(0, { dwp: true });
        expect(medium.getItems()[0].dwp).toBeUndefined();
        // A Medium suit loses 3 Ground MP, which may not take it below 0.
        medium.addItem("is-small-laser", "ra");
        medium.updateItem(1, { dwp: true });
        expect(medium.getIssues().join(" ")).toContain("costs this suit 3 Ground MP");
        medium.setGroundMP(3);
        expect(medium.getIssues()).toEqual([]);
        expect(medium.getPlayMovement().ground).toBe(1);
    });

    it("adds Ground MP for a myomer booster and bars stealth armor with it (TO:AUE pp.98-99)", () => {
        const suit = new BattleArmor();
        suit.setTechBase("clan");
        suit.setWeightClass("medium");
        suit.addItem("clan-myomer-booster", "body");
        expect(suit.getTotalGroundMP()).toBe(3);
        // Its three slots are found anywhere on the suit, like armor slots.
        expect(suit.getUsedSlots("body")).toBe(0);
        expect(suit.getSpreadSlots()).toBe(3);
        expect(suit.getCBillCostLog().join(" ")).toContain("Weapons, equipment and mounts: 150,000");
        expect(suit.getAntiMechBonusDamage()).toBe(10);
        suit.setArmor("ba-stealth-basic");
        suit.setArmorPoints(2);
        expect(suit.getIssues().join(" ")).toContain("may not mount Stealth or Mimetic armor");
        const assault = new BattleArmor();
        assault.setTechBase("clan");
        assault.setWeightClass("assault");
        assault.addItem("clan-myomer-booster", "body");
        expect(assault.getTotalGroundMP()).toBe(2);
        expect(assault.getCBillCostLog().join(" ")).toContain("Weapons, equipment and mounts: 75,000");
    });

    it("gives a mechanical jump booster 1 Jumping MP and 1 Ground MP, at twice a jump MP's weight (TO:AUE pp.98, 225)", () => {
        const suit = new BattleArmor();
        suit.setWeightClass("heavy");
        const before = suit.getWeight();
        suit.addItem("is-mechanical-jump-booster", "body");
        expect(suit.getWeight() - before).toBe(2 * suit.getWeightClass().jump.kgPerMP);
        expect(suit.getJumpMP()).toBe(1);
        expect(suit.getTotalGroundMP()).toBe(2);
        expect(suit.getMovementText()).toBe("Ground 2 / Jump 1");
        // A partial wing adds to it; jump jets are not added together with it.
        suit.addItem("is-partial-wing", "body");
        expect(suit.getJumpMP()).toBe(2);
        expect(suit.getIssues()).toEqual([]);
        suit.setMotive("jump", 2);
        expect(suit.getJumpMP()).toBe(3);
    });

    it("counts Angel ECM as 2 in the Defensive Battle Rating (TO:AUE p.192)", () => {
        const suit = new BattleArmor();
        suit.addItem("is-angel-ecm", "body");
        expect(suit.getBattleValueLog().join(" ")).toContain("Improved sensors, active probes and ECM: +2");
    });
});

describe("Battle armor introduction dates (IO:AE pp.45-47)", () => {
    it("dates every item of equipment except mission equipment", () => {
        const undated = battleArmorEquipment.filter((entry) => !entry.dates).map((entry) => entry.tag);
        expect(undated).toEqual(["is-mission-equipment", "clan-mission-equipment"]);
    });

    it("reads availability from prototype, production, extinction and recovery dates", () => {
        // ECM suite: 2720, extinct 2766, recovered 3057.
        const ecm = battleArmorEquipment.find((entry) => entry.tag === "is-ecm-suite")?.dates;
        expect(ecm).toEqual({ introduced: 2720, prototype: 2718, extinct: 2766, reintroduced: 3057 });
        expect(isBattleArmorDateAvailable(ecm, 2571, 2780)).toBe(true);
        expect(isBattleArmorDateAvailable(ecm, 2781, 3049)).toBe(false);
        expect(isBattleArmorDateAvailable(ecm, 3050, 3061)).toBe(true);
        // A prototype counts from its own date; pre-spaceflight items are always there.
        const magshot = battleArmorEquipment.find((entry) => entry.tag === "is-magshot-gauss-rifle")?.dates;
        expect(isBattleArmorDateAvailable(magshot, 3050, 3056)).toBe(false);
        expect(isBattleArmorDateAvailable(magshot, 3050, 3057)).toBe(true);
        expect(isBattleArmorDateAvailable({ introduced: "PS" }, 2300, 2570)).toBe(true);
        expect(isBattleArmorDateAvailable(undefined, 2300, 2570)).toBe(true);
    });

    it("builds in the newest era by default and reports what an earlier era did not have", () => {
        const suit = purifier(4);
        expect(suit.getEra().tag).toBe(suit.getAvailableEras()[suit.getAvailableEras().length - 1].tag);
        expect(suit.getIssues()).toEqual([]);
        // Before the Clans came, the Inner Sphere had no Medium battle armor, mimetic armor or battlesuit ER lasers.
        expect(suit.setEra("late-sw-rn")).toBe(true);
        const issues = suit.getIssues().join(" ");
        expect(issues).toContain("Medium battle armor is not available to Inner Sphere battle armor in the");
        expect(issues).toContain("Mimetic armor is not available");
        expect(issues).toContain("ER Small Laser is not available");
        // What the era lacks is not offered, apart from what is mounted already.
        expect(suit.getAvailableEquipment().some((entry) => entry.tag === "is-plasma-rifle-man-portable")).toBe(false);
        expect(suit.getAvailableEquipment().some((entry) => entry.tag === "is-er-small-laser")).toBe(true);
        // The Clan Invasion era has all three, the mimetic armor as a prototype (3058).
        expect(suit.setEra("clan-inv")).toBe(true);
        expect(suit.getIssues()).toEqual([]);
        expect(suit.setEra("no-such-era")).toBe(false);
        // The era is saved with the suit; a suit saved before eras loads into the newest.
        expect(new BattleArmor(suit.exportJSON()).getEra().tag).toBe("clan-inv");
        const old = suit.export();
        delete old.era;
        expect(new BattleArmor(JSON.stringify(old)).getIssues()).toEqual([]);
    });
});

describe("Battle armor alternate loadouts", () => {
    it("refits modular mounts and adaptors without touching the base design", () => {
        const suit = purifier(4);
        expect(suit.canHaveLoadouts()).toBe(true);
        expect(suit.getSwappableItems().map((item) => item.index)).toEqual([0]);
        expect(suit.addLoadout("Support PPC")).toBe(true);
        expect(suit.setLoadoutWeapon(0, 0, "is-support-ppc")).toBe(true);
        // Equipment of the other technology base, or equipment barred from mounts, is refused.
        expect(suit.setLoadoutWeapon(0, 0, "clan-er-small-laser")).toBe(false);
        expect(suit.setLoadoutWeapon(0, 0, "is-camo-system")).toBe(false);
        expect(suit.setLoadoutWeapon(0, 5, "is-machine-gun")).toBe(false);

        const refit = suit.getLoadoutSuit(0);
        expect(refit.getDisplayName()).toBe("Medium Battle Armor [Support PPC]");
        expect(refit.getItems()[0]).toMatchObject({ tag: "is-support-ppc", location: "la", modular: true });
        // 250 kg in place of the laser's 350.
        expect(suit.getWeight() - refit.getWeight()).toBe(100);
        expect(refit.getBattleValue()).not.toBe(suit.getBattleValue());
        expect(suit.getItems()[0].tag).toBe("is-er-small-laser");
        expect(suit.getIssues()).toEqual([]);
    });

    it("reports a loadout that breaks the construction rules, and follows its mounts when items are removed", () => {
        const suit = purifier(4);
        suit.addItem("is-machine-gun", "ra");
        suit.updateItem(1, { modular: true });
        suit.addLoadout("Heavy");
        suit.setLoadoutWeapon(0, 1, "is-medium-laser");
        expect(suit.getIssues().some((issue) => issue.startsWith("Loadout \"Heavy\": The suit weighs"))).toBe(true);
        suit.setLoadoutWeapon(0, 1, "is-flamer-ba");
        suit.removeItem(0);
        expect(suit.getLoadouts()[0].weapons).toEqual({ "0": { tag: "is-flamer-ba" } });
        expect(suit.getLoadoutSuit(0).getItems()[0].tag).toBe("is-flamer-ba");
    });

    it("changes the manipulator in a modular equipment adaptor, and saves the loadouts and the one in use", () => {
        const suit = new BattleArmor();
        suit.setWeightClass("pa-l");
        suit.setManipulator("la", "basic");
        suit.setManipulator("ra", "basic");
        suit.addLoadout("Drill");
        expect(suit.setLoadoutManipulator(0, "ra", "industrial-drill")).toBe(false);
        suit.setAdaptor("ra", true);
        expect(suit.setLoadoutManipulator(0, "ra", "industrial-drill")).toBe(true);
        const refit = suit.getLoadoutSuit(0);
        expect(refit.getManipulator("ra").tag).toBe("industrial-drill");
        expect(suit.getManipulator("ra").tag).toBe("basic");
        expect(refit.getWeight() - suit.getWeight()).toBe(30);

        const loaded = new BattleArmor(refit.exportJSON());
        expect(loaded.getActiveLoadout()).toBe(0);
        expect(loaded.getManipulator("ra").tag).toBe("industrial-drill");
        expect(loaded.getLoadouts()).toEqual([{ name: "Drill", weapons: {}, manipulators: { ra: "industrial-drill" } }]);
        loaded.removeLoadout(0);
        expect(loaded.getActiveLoadout()).toBe(-1);
        expect(loaded.getManipulator("ra").tag).toBe("basic");
    });
});

describe("Battle armor in play (Total Warfare pp.219-221)", () => {
    it("gives each trooper their Armor Value and 1, and wastes damage beyond it (TW p.219)", () => {
        const suit = purifier(4);
        expect(suit.getTrooperCapacity()).toBe(7);
        // 1D6 picks the trooper: a 6 is rolled again, as the squad has four.
        const rolls = [6, 2, 2, 2, 3];
        const log = suit.resolveAttack("standard", [5, 5, 10], false, () => rolls.shift() ?? 1);
        expect(suit.getTrooperDamage(1)).toBe(7);
        expect(suit.isTrooperActive(1)).toBe(false);
        expect(log.join(" ")).toContain("Trooper 2 takes 2 (3 wasted): destroyed");
        // The third grouping rolled the destroyed trooper, then trooper 3.
        expect(suit.getTrooperDamage(2)).toBe(7);
        expect(suit.getActiveTroopers()).toBe(2);
        expect(suit.getStrengthPercentage()).toBe(50);
        expect(suit.isDamaged()).toBe(true);
        // Damage is saved with a roster unit and left out of a design.
        expect(new BattleArmor(suit.exportJSON()).getActiveTroopers()).toBe(2);
        expect(suit.export(true).inPlay).toBeUndefined();
        suit.resetInPlay();
        expect(suit.getActiveTroopers()).toBe(4);
    });

    it("applies area-effect damage to every trooper and the armor types' damage rules", () => {
        const suit = purifier(4);
        suit.resolveAttack("standard", [3], true);
        expect([0, 1, 2, 3].map((trooper) => suit.getTrooperDamage(trooper))).toEqual([3, 3, 3, 3]);

        const reflective = new BattleArmor();
        reflective.setArmor("ba-laser-reflective");
        reflective.setArmorPoints(5);
        reflective.resolveAttack("energy", [5], false, () => 1);
        expect(reflective.getTrooperDamage(0)).toBe(2);
        const reactive = new BattleArmor();
        reactive.setArmor("ba-reactive");
        reactive.setArmorPoints(5);
        reactive.resolveAttack("explosive", [5], false, () => 1);
        reactive.resolveAttack("standard", [1], false, () => 1);
        expect(reactive.getTrooperDamage(0)).toBe(3);
        const fire = new BattleArmor();
        fire.setTechBase("clan");
        fire.setArmor("ba-fire-resistant");
        fire.setArmorPoints(5);
        expect(fire.resolveAttack("heat", [6], false, () => 1).join(" ")).toContain("6 becomes 0");
        expect(fire.isDamaged()).toBe(false);
    });

    it("reads the Leg and Swarm attack modifiers off the troopers active (TW p.221)", () => {
        const suit = elemental();
        expect([suit.getLegAttackModifier(), suit.getSwarmAttackModifier()]).toEqual([0, 2]);
        expect(suit.getLegAttackDamage()).toBe(4);
        suit.setTrooperDamage(0, 99);
        suit.setTrooperDamage(1, 99);
        expect([suit.getLegAttackModifier(), suit.getSwarmAttackModifier()]).toEqual([2, 5]);
        suit.setTrooperDamage(2, 99);
        suit.setTrooperDamage(3, 99);
        expect([suit.getLegAttackModifier(), suit.getSwarmAttackModifier()]).toEqual([7, 5]);
        // Vibro-claws add a point each to a leg attack; magnets take 1 off a swarm attack.
        const claws = new BattleArmor();
        claws.setManipulator("la", "battle-claw-vibro");
        claws.setManipulator("ra", "battle-claw-vibro");
        expect(claws.getLegAttackDamage()).toBe(6);
        claws.setManipulator("la", "battle-claw-magnets");
        expect(claws.getSwarmAttackModifier()).toBe(1);
    });

    it("holds an Inner Sphere suit with body-mounted launchers to no Anti-'Mech attacks or jumping until they are jettisoned", () => {
        const suit = new BattleArmor();
        suit.setMotive("jump", 3);
        suit.setManipulator("la", "battle-claw");
        suit.addItem("is-srm-2", "body");
        suit.updateItem(0, { detachable: true, shots: 2 });
        expect(suit.getAntiMechBar()).toContain("TW p.220");
        expect(suit.getLegAttackModifier()).toBeNull();
        expect(suit.getPlayMovement().jump).toBe(0);
        suit.setMissilesJettisoned(true);
        expect(suit.getAntiMechBar()).toBe("");
        expect(suit.getPlayMovement().text).toBe("Ground 1 / Jump 3");
        expect(new BattleArmor(suit.exportJSON()).carriesMissilePacks()).toBe(false);
    });
});

describe("Mechanized battle armor (Total Warfare pp.226-227)", () => {
    it("seats each trooper by the Battle Armor Transport Position Table", () => {
        const suit = elemental();
        expect(suit.setRiding("11111111-aaaa", "mech")).toBe(true);
        expect([0, 1, 2, 3, 4].map((trooper) => suit.getTransportPosition(trooper, "mech"))).toEqual(["Right Torso", "Left Torso", "Right Torso (rear)", "Left Torso (rear)", "Center Torso (rear)"]);
        expect(suit.getOccupiedPositions("vehicle")).toEqual(["Right Side", "Left Side", "Rear"]);
        // The carrier is kept with the squad's play state, and cleared when play is reset.
        expect(new BattleArmor(suit.exportJSON()).getRiding()).toEqual({ uuid: "11111111-aaaa", kind: "mech" });
        suit.resetInPlay();
        expect(suit.getRiding()).toBeNull();
        // A suit that cannot ride does not mount.
        const assault = new BattleArmor();
        assault.setWeightClass("assault");
        expect(assault.setRiding("11111111-aaaa", "mech")).toBe(false);
    });

    it("rolls 1D6 for a trooper where the carrier is hit: 5-6 and the trooper takes the damage first", () => {
        const suit = elemental();
        suit.setRiding("11111111-aaaa", "vehicle");
        // Troopers 1 and 2 ride the Right Side: the first rolls 3 and is missed, the second rolls 5.
        const rolls = [3, 5];
        const hit = suit.resolveCarrierHit("Right Side", 14, () => rolls.shift() ?? 1);
        expect(suit.getTrooperDamage(0)).toBe(0);
        expect(suit.isTrooperActive(1)).toBe(false);
        // Eleven points destroy the trooper; three go on to the carrier.
        expect(hit.remaining).toBe(3);
        expect(hit.log).toEqual([
            "Trooper 1 (Right Side): rolled 3, takes no damage",
            "Trooper 2 (Right Side): rolled 5, takes 11 and is destroyed",
            "The carrier takes 3 in the Right Side",
        ]);
        expect(suit.getOccupiedPositions("vehicle")).toEqual(["Right Side", "Left Side", "Rear"]);
    });
});

describe("Battle armor Alpha Strike conversion (ASC pp.92-141)", () => {
    it("converts an Elemental Point to the card the Master Unit List publishes", () => {
        const stats = elemental().getAlphaStrikeStats();
        // Elemental Battle Armor [Laser] (Sqd5): 6"j, Armor 2, Structure 2, 2/1/0, 19 points, AM, CAR5, MEC.
        expect(stats.move).toBe("6\"j");
        expect([stats.armor, stats.structure]).toEqual([2, 2]);
        expect(stats.damageValues).toEqual({ short: { damage: 2, minimal: false }, medium: { damage: 1, minimal: false }, long: { damage: 0, minimal: false } });
        expect(stats.specialAbilities).toEqual(["AM", "CAR5", "MEC"]);
        expect(stats.pointValue).toBe(19);
    });

    it("converts the Purifier as the Master Unit List publishes it, four or six to the squad", () => {
        for (const troopers of [4, 6]) {
            const stats = purifier(troopers).getAlphaStrikeStats();
            // Purifier Adaptive Battle Armor [Laser]: 6"j, Armor 1, Structure 2, 2/2/0, 19 points, MAS.
            expect(stats.move).toBe("6\"j");
            expect(stats.armor).toBe(1);
            expect([stats.damageValues.short.damage, stats.damageValues.medium.damage, stats.damageValues.long.damage]).toEqual([2, 2, 0]);
            expect(stats.specialAbilities).toEqual(["AM", `CAR${troopers}`, "MAS", "MEC"]);
            expect(stats.pointValue).toBe(19);
        }
    });

    it("rates heat by the Heat-Generating Weaponry Table and indirect fire by Long range damage (ASC pp.124-125)", () => {
        const suit = elemental();
        suit.removeItem(0);
        suit.addItem("clan-flamer-ba", "ra");
        // One flamer a suit: Heat Value 2 x 3.5 = 7, which rates 1 at Short range.
        expect(suit.getAlphaStrikeStats().specialAbilities).toContain("HT1/-/-");
        const plasma = new BattleArmor();
        plasma.setWeightClass("heavy");
        plasma.addItem("is-plasma-rifle-man-portable", "ra");
        expect(plasma.getAlphaStrikeStats().specialAbilities).toContain("HT1/1/-");
        const missiles = new BattleArmor();
        missiles.setTechBase("clan");
        missiles.setWeightClass("heavy");
        missiles.addItem("clan-lrm-5", "body");
        missiles.updateItem(0, { shots: 4 });
        // 0.3 at Long range x 0.75 for under 10 shots x 3.5 = 0.79, which rounds to 1.
        const stats = missiles.getAlphaStrikeStats();
        expect(stats.specialAbilities).toContain("IF1");
        expect(stats.damageValues.long).toEqual({ damage: 1, minimal: false });
    });

    it("gives equipment its special abilities and adds 0.1 a vibro-claw after the Troop Factor (ASC pp.102, 117-133; errata v1.2)", () => {
        const suit = new BattleArmor();
        suit.setWeightClass("light");
        suit.setArmor("ba-stealth-basic");
        suit.setArmorPoints(5);
        suit.setManipulator("la", "battle-claw-vibro");
        suit.setManipulator("ra", "battle-claw-vibro");
        suit.addItem("is-ecm-suite", "body");
        suit.addItem("is-active-probe", "body");
        suit.addItem("is-parafoil", "body");
        const stats = suit.getAlphaStrikeStats();
        expect(stats.specialAbilities).toEqual(["AM", "CAR4", "LECM", "LPRB", "MEC", "PAR", "RCN", "STL"]);
        // No weapons: the 0.2 points of two vibro-claws are minimal damage.
        expect(stats.damageValues.short).toEqual({ damage: 0, minimal: true });
        const card = suit.getAlphaStrikeUnit();
        expect(card.type).toBe("BA");
        expect(card.basePoints).toBe(stats.pointValue);
        expect(card.isInfantry).toBe(true);
    });

    it("lists ground and underwater movement for a suit with UMUs (ASC p.94)", () => {
        const suit = new BattleArmor();
        suit.setTechBase("clan");
        suit.setMotive("umu", 3);
        const stats = suit.getAlphaStrikeStats();
        expect(stats.move).toBe("2\"f/6\"s");
        expect(stats.specialAbilities).toContain("UMU");
    });
});

// Written for this test in the layout MegaMek's battle armor files use.
const BLK = `
# comment line
<UnitType>
BattleArmor
</UnitType>
<Name>
Test Elemental
</Name>
<Model>
[Laser](Sqd5)
</Model>
<year>
2868
</year>
<type>
Clan Level 2
</type>
<motion_type>
Jump
</motion_type>
<cruiseMP>
1
</cruiseMP>
<armor_type>
28
</armor_type>
<Point Equipment>
CLBASmall Laser:RA
CLBASRM2:Body
BA-SRM2 Ammo:Body:Shots2#
BAAPMount:LA
InfantryAssaultRifle:APM:LA
BABattleClaw:LA
NotARealItem:Body
</Point Equipment>
<Trooper 1 Equipment>
</Trooper 1 Equipment>
<slotless_equipment>
BAJumpJet
</slotless_equipment>
<chassis>
biped
</chassis>
<jumpingMP>
3
</jumpingMP>
<armor>
10
</armor>
<Trooper Count>
5
</Trooper Count>
<weightclass>
2
</weightclass>
`;

describe("MegaMek battle armor file import", () => {
    it("reads the block layout of a .blk file", () => {
        const file = parseBlkFile(BLK);
        expect(file?.blocks.unittype).toEqual(["BattleArmor"]);
        expect(file?.blocks["point equipment"]?.length).toBe(7);
        expect(file?.blocks["trooper 1 equipment"]).toEqual([]);
        expect(parseBlkFile("")).toBeNull();
        expect(parseBlkFile("just some text")).toBeNull();
    });

    it("builds the suit the file describes and reports what it could not place", () => {
        const { suit, issues } = importBattleArmorBlk(BLK);
        expect(issues).toEqual(["'NotARealItem' is not in the battle armor equipment tables: left off."]);
        expect(suit).not.toBeNull();
        if (!suit) return;
        expect(suit.getName()).toBe("Test Elemental [Laser](Sqd5)");
        expect([suit.getTechBase(), suit.getWeightClass().tag, suit.getSquadSize()]).toEqual(["clan", "medium", 5]);
        expect(suit.getMovementText()).toBe("Ground 1 / Jump 3");
        expect([suit.getArmor().tag, suit.getArmorPoints()]).toEqual(["ba-standard", 10]);
        expect(suit.getItems()).toEqual([{ tag: "clan-small-laser", location: "ra" }, { tag: "clan-srm-2", location: "body", shots: 2 }]);
        expect(suit.getAPMounts()).toEqual([{ location: "la", weapon: "inf-auto-rifle" }]);
        expect(suit.getManipulator("la").tag).toBe("battle-claw");
        expect(suit.getEra().yearStart).toBeLessThanOrEqual(2868);
        expect(suit.getIssues()).toEqual([]);
        // Without the rifle in its mount this is the published Elemental: 447 for the Point.
        suit.setAPMountWeapon(0, "");
        expect(suit.getBattleValue()).toBe(447);
    });

    it("refuses a file for another unit type, and text that is not a unit file", () => {
        expect(importBattleArmorBlk("<UnitType>\nTank\n</UnitType>").issues[0]).toContain("not a battle armor file");
        expect(importBattleArmorBlk("{}").suit).toBeNull();
        expect(importBattleArmorBlk("x".repeat(500000)).suit).toBeNull();
    });

    it("leaves the other technology base's equipment off a suit that is not mixed, and keeps it on one that is", () => {
        const plain = importBattleArmorBlk(BLK.replace("Clan Level 2", "IS Level 2"));
        expect(plain.suit?.getTechBase()).toBe("is");
        expect(plain.issues.join(" ")).toContain("'CLBASmall Laser' is Clan equipment: left off.");
        const mixed = importBattleArmorBlk(BLK.replace("Clan Level 2", "Mixed (IS Chassis)"));
        expect([mixed.suit?.getTechBase(), mixed.suit?.isMixedTech()]).toEqual(["is", true]);
        expect(mixed.issues).toEqual(["'NotARealItem' is not in the battle armor equipment tables: left off."]);
        expect(mixed.suit?.getItems().map((entry) => entry.tag)).toEqual(["clan-small-laser", "clan-srm-2"]);
    });
});
