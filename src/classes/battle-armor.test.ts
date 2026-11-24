import { describe, expect, it } from "vitest";
import BattleArmor, { normalizeBattleArmorExport } from "./battle-armor";
import { battleArmorEquipment } from "../data/battle-armor-equipment";
import { getBattleArmorSpeedFactor } from "../data/battle-armor-construction";

// The four designs the TechManual builds step by step (TM pp.162-172).
const purifier = (): BattleArmor => {
    const suit = new BattleArmor();
    suit.setWeightClass("medium");
    suit.setMotive("jump", 3);
    suit.setManipulator("ra", "battle-claw");
    suit.setArmor("ba-mimetic");
    suit.setArmorPoints(6);
    suit.addItem("is-er-small-laser", "la");
    suit.updateItem(0, { modular: true });
    suit.setSquadSize(6);
    return suit;
};

describe("Battle armor construction (TechManual pp.160-173)", () => {
    it("builds Keith's Tunnel Rat exoskeleton (TM pp.162-171)", () => {
        const suit = new BattleArmor();
        suit.setWeightClass("pa-l");
        expect(suit.getChassisWeight()).toBe(80);
        expect([suit.getSlots("la"), suit.getSlots("ra"), suit.getSlots("body")]).toEqual([2, 2, 2]);
        suit.setAdaptor("la", true);
        suit.setAdaptor("ra", true);
        suit.setManipulator("la", "basic");
        suit.setManipulator("ra", "industrial-drill");
        suit.setArmorPoints(1);
        expect(suit.getRemainingWeight()).toBe(220);
        expect([suit.getFreeSlots("la"), suit.getFreeSlots("ra")]).toEqual([0, 0]);
        expect(suit.getCapabilities().swarm).toBe(false);
        suit.setManipulator("ra", "basic");
        expect(suit.getCapabilities()).toMatchObject({ swarm: true, leg: true, mechanized: true });
        expect(suit.getIssues()).toEqual([]);
    });

    it("builds Lou's Sylph (TM pp.162-171)", () => {
        const suit = new BattleArmor();
        suit.setTechBase("clan");
        suit.setWeightClass("light");
        expect(suit.getChassisWeight()).toBe(150);
        expect(suit.setMotive("vtol", 5)).toBe(true);
        suit.setManipulator("la", "battle-claw");
        suit.setArmorPoints(5);
        suit.addItem("clan-bomb-rack", "body");
        suit.addItem("clan-micro-pulse-laser", "ra");
        expect(suit.getWeight()).toBe(750);
        expect(suit.getIssues()).toEqual([]);
        expect(suit.getCapabilities()).toMatchObject({ swarm: true, leg: true, mechanized: true });
        expect(suit.getSquadSize()).toBe(5);
    });

    it("builds Max's Purifier (TM pp.162-171) with its cost (TM p.276) and Battle Value (TM pp.310-311)", () => {
        const suit = purifier();
        expect(suit.getChassisWeight()).toBe(175);
        expect(suit.getWeight()).toBe(1000);
        expect(suit.getFreeSlots("la")).toBe(0);
        expect(suit.getFreeSlotsAfterArmor()).toBe(0);
        expect(suit.getIssues()).toEqual([]);
        expect(suit.getSuitBattleValue()).toBe(52);
        expect(suit.getBattleValue()).toBe(466);
        // Structural cost 425,000, with the ER small laser (11,250) and its modular mount (1,000).
        expect(suit.getSuitCost()).toBe(425000 + 11250 + 1000);
    });

    it("builds Peter's Fenrir quad with a configurable turret (TM pp.163-172)", () => {
        const suit = new BattleArmor();
        suit.setWeightClass("assault");
        suit.setBodyType("quad");
        expect(suit.getChassisWeight()).toBe(550);
        expect(suit.getSlots("body")).toBe(11);
        expect([suit.getFreeGroundMP(), suit.getMaxGroundMP()]).toEqual([2, 4]);
        suit.setGroundMP(4);
        expect(suit.setMotive("jump", 1)).toBe(false);
        suit.setArmorPoints(5);
        suit.setTurret(4, true);
        expect(suit.getSlots("turret")).toBe(3);
        expect(suit.getUsedSlots("body")).toBe(2);
        expect(suit.getRemainingWeight()).toBe(800);
        suit.addItem("is-srm-4", "turret");
        suit.updateItem(0, { shots: 4 });
        expect(suit.getItemWeight(suit.getItems()[0])).toBe(400);
        expect(suit.getFreeSlots("turret")).toBe(0);
        expect(suit.getRemainingWeight()).toBe(400);
        expect(suit.getIssues()).toEqual([]);
        expect(suit.getCapabilities()).toMatchObject({ swarm: false, leg: false, mechanized: false });
    });

    // TM p.311: 9 points of standard stealth armor, 2 Ground MP, a small laser and an SRM 4 with 7 shots; four suits.
    it("gives the Grenadier [SRM/SL] squad its Battle Value of 326", () => {
        const suit = new BattleArmor();
        suit.setWeightClass("heavy");
        suit.setGroundMP(2);
        suit.setArmor("ba-stealth-standard");
        suit.setArmorPoints(9);
        suit.addItem("is-small-laser", "ra");
        suit.addItem("is-srm-4", "body");
        suit.updateItem(1, { shots: 7 });
        expect(suit.getSuitBattleValue()).toBe(63);
        expect(suit.getBattleValue()).toBe(326);
    });

    it("reads the Speed Factor Table (TM p.316)", () => {
        expect([0, 1, 2, 3, 4, 5, 6, 7].map(getBattleArmorSpeedFactor)).toEqual([0.44, 0.54, 0.65, 0.77, 0.88, 1, 1.12, 1.24]);
    });

    it("holds a design to the rules", () => {
        const suit = purifier();
        // An Inner Sphere suit with jump jets must make a body-mounted launcher detachable (TM p.171).
        suit.setArmorPoints(0);
        suit.addItem("is-srm-2", "body");
        expect(suit.getIssues().some((issue) => issue.includes("detachable"))).toBe(true);
        suit.updateItem(1, { detachable: true });
        expect(suit.getIssues().some((issue) => issue.includes("detachable"))).toBe(false);
        // Missile reloads: a slot for every 4 shots, rounded up (TM p.171).
        suit.updateItem(1, { shots: 5 });
        expect(suit.getItemSlots(suit.getItems()[1])).toBe(2 + 2);
        // VTOL and UMU systems are Clan only; a partial wing needs jump jets.
        expect(suit.setMotive("vtol", 2)).toBe(false);
        suit.addItem("is-partial-wing", "la");
        expect(suit.getItems()[2].location).toBe("body");
        expect(suit.getJumpMP()).toBe(4);
        suit.setMotive("none");
        expect(suit.getIssues().some((issue) => issue.includes("needs jump jets"))).toBe(true);
        // A squad support weapon: half its weight on every Inner Sphere suit, 40 percent on a Clan suit (TM p.270).
        const support = new BattleArmor();
        support.addItem("is-medium-laser", "body");
        support.updateItem(0, { squadSupport: true });
        expect(support.getItemWeight(support.getItems()[0])).toBe(250);
        support.setTechBase("clan");
        expect(support.getItems()).toEqual([]);
        support.addItem("clan-er-medium-laser", "body");
        support.updateItem(0, { squadSupport: true });
        expect(support.getItemWeight(support.getItems()[0])).toBe(320);
    });

    it("gives every item a unique tag and a rules page", () => {
        const tags = battleArmorEquipment.map((entry) => entry.tag);
        expect(new Set(tags).size).toBe(tags.length);
        // TechManual equipment is described on pp.252-271; Tactical Operations items carry their page in that book.
        for (const entry of battleArmorEquipment) expect(entry.page, entry.tag).toBeGreaterThan(entry.book === "TO:AUE" ? 90 : entry.book === "IO:AE" ? 80 : 200);
    });

    it("saves and loads a design, and cleans a broken save", () => {
        const suit = purifier();
        const copy = new BattleArmor(suit.exportJSON());
        expect(copy.export()).toEqual(suit.export());
        expect(copy.getBattleValue()).toBe(466);
        const broken = normalizeBattleArmorExport({ weightClass: "nope", bodyType: "quad", items: [{ tag: "x" }, 5], armorPoints: 99, squadSize: 40 });
        expect(broken.suit).toMatchObject({ weightClass: "medium", bodyType: "quad", armorPoints: 10, squadSize: 6, items: [] });
        expect(broken.issues.length).toBeGreaterThan(0);
        expect(normalizeBattleArmorExport("x").suit).toBeNull();
    });
});

describe("E-War carrier (#642)", () => {
    const build = () => {
        const suit = new BattleArmor();
        suit.setTechBase("clan");
        suit.setWeightClass("medium");
        suit.setArmorPoints(4);
        expect(suit.addItem("clan-active-probe", "body")).toBe(true);
        expect(suit.addItem("clan-micro-pulse-laser", "ra")).toBe(true);
        return suit;
    };

    it("lists its E-War gear", () => {
        const gear = build().getEWarGear();
        expect(gear.map(item => item.kind)).toEqual(["probe-clan"]);
        for (const item of gear) {
            expect(item.name).toBeTruthy();
            expect(item.uuid).toBeTruthy();
            expect(item.destroyed).toBe(false);
        }
    });

    it("reports destroyed E-War gear", () => {
        // Squad gear is listed once, not per trooper; only an item carried by one trooper is lost with that trooper (isItemLost).
        const suit = build();
        suit.setSquadSize(4);
        suit.updateItem(0, { trooper: 2 });
        expect(suit.getEWarGear().map(item => [item.kind, item.destroyed])).toEqual([["probe-clan", false]]);
        suit.setTrooperDamage(1, suit.getTrooperCapacity());
        expect(suit.getEWarGear().map(item => [item.kind, item.destroyed])).toEqual([["probe-clan", true]]);
    });

    it("lists its real ECM and Narc tags", () => {
        // is-c3-system (BC3, a C3 Slave) and is-improved-c3-system (BC3i, a C3i) are classified in ewar-play.test.ts (TO:AUE p.109).
        const suit = new BattleArmor();
        suit.setWeightClass("heavy");
        for (const tag of ["is-ecm-suite", "is-compact-narc"]) expect(suit.addItem(tag, "body"), tag).toBe(true);
        expect(suit.getEWarGear().map(item => [item.tag, item.kind])).toEqual([["is-ecm-suite", "ecm-guardian"], ["is-compact-narc", "narc"]]);
        const clan = new BattleArmor();
        clan.setTechBase("clan");
        clan.setWeightClass("heavy");
        for (const tag of ["clan-ecm-suite", "clan-angel-ecm"]) expect(clan.addItem(tag, "body"), tag).toBe(true);
        expect(clan.getEWarGear().map(item => item.kind)).toEqual(["ecm-clan", "ecm-angel"]);
    });

    it("lists stealth and mimetic armor", () => {
        for (const [tag, kind] of [["ba-stealth-basic", "stealth-ba"], ["ba-stealth-improved", "stealth-ba"], ["ba-stealth-standard", "stealth-ba"], ["ba-mimetic", "mimetic"]] as const) {
            const suit = new BattleArmor();
            expect(suit.setArmor(tag)).toBe(true);
            const armor = suit.getEWarGear().find(item => item.kind === kind);
            expect(armor, tag).toMatchObject({ tag, location: "armor", destroyed: false });
            expect(armor?.uuid).toBeUndefined();
        }
    });

    it("saves E-War state and loads old saves without it", () => {
        const suit = build();
        expect(suit.export().ewarPlay).toBeUndefined();
        suit.ewarPlay.inHostileEcm = true;
        const saved = JSON.parse(JSON.stringify(suit.export()));
        expect(saved.ewarPlay).toEqual({ inHostileEcm: true });
        expect(suit.export(true).ewarPlay).toBeUndefined();
        expect(new BattleArmor(JSON.stringify(saved)).ewarPlay).toEqual({ inHostileEcm: true });
        delete saved.ewarPlay;
        expect(new BattleArmor(JSON.stringify(saved)).ewarPlay).toEqual({});
    });
});

// IO:AE p.69 (game and construction rules), p.184 (Warrior Augmentations: 1,500,000 C-bills, Experimental), p.186 (BV): the Clan
// enhanced imaging neural implants augment battle armor troopers. A unit with the EI interface operated by an augmented warrior
// takes -1 Piloting and -1 Gunnery for its BV Skill Modifier; the augmentation cost is multiplied by the augmented troopers.
describe("Battle armor EI implants (IO:AE pp.69, 184, 186)", () => {
    const clanSquad = (): BattleArmor => {
        const suit = new BattleArmor();
        suit.setTechBase("clan");
        suit.setWeightClass("medium");
        suit.setMotive("jump", 3);
        suit.setSquadSize(5);
        return suit;
    };

    it("is offered to Clan suits at the Experimental level and refused to Inner Sphere ones or below it", () => {
        const clan = clanSquad();
        expect(clan.canHaveEIImplants(3)).toBe(false);
        expect(clan.canHaveEIImplants(4)).toBe(true);
        expect(clan.setEIImplants(true, 3)).toBe(false);
        expect(clan.hasEIImplants()).toBe(false);
        expect(clan.setEIImplants(true, 4)).toBe(true);
        expect(clan.hasEIImplants()).toBe(true);
        const inner = new BattleArmor();
        expect(inner.canHaveEIImplants(4)).toBe(false);
        expect(inner.setEIImplants(true, 4)).toBe(false);
    });

    it("adds 1,500,000 C-bills for each augmented trooper and rates the squad one Gunnery and Anti-'Mech skill better for BV", () => {
        const plain = clanSquad();
        const augmented = clanSquad();
        augmented.setEIImplants(true, 4);
        expect(augmented.getCBillCost() - plain.getCBillCost()).toBe(5 * 1500000);
        plain.setGunnery(4);
        plain.setAntiMechSkill(5);
        augmented.setGunnery(4);
        augmented.setAntiMechSkill(5);
        const skills = (suit: BattleArmor) => suit.getSkillMultiplier();
        const better = clanSquad();
        better.setGunnery(3);
        better.setAntiMechSkill(4);
        expect(skills(augmented)).toBe(skills(better));
        expect(skills(augmented)).toBeGreaterThan(skills(plain));
        expect(augmented.getRequiredRulesLevel()).toBeGreaterThanOrEqual(4);
        expect(augmented.getNotes().join(" ")).toMatch(/EI implants/);
    });

    it("saves and loads", () => {
        const suit = clanSquad();
        suit.setEIImplants(true, 4);
        const saved = suit.export();
        expect(saved.eiImplants).toBe(true);
        expect(new BattleArmor(JSON.stringify(saved)).hasEIImplants()).toBe(true);
    });
});
