import { getEWarKind } from "../utils/ewar-play";
import { describe, expect, it } from "vitest";
import InfantryPlatoon, { formatInfantryASDamage, INFANTRY_BEAST_MOUNTS, INFANTRY_BEAST_SIZES, INFANTRY_ENGINEER_TASKS, INFANTRY_FORMATIONS, INFANTRY_MOTIVE_TYPES, INFANTRY_RANGE_MODIFIERS, INFANTRY_SPECIALTIES, INFANTRY_XCT_ENVIRONMENTS, normalizeInfantryPlatoonExport } from "./infantry-platoon";
import { INFANTRY_SUPPORT_PPC_TAG, findInfantryWeapon, getFieldGunKind, infantryWeapons, findInfantryWeaponByName } from "../data/infantry-weapons";
import { BattleMechGroup } from "./battlemech-group";
import { findInfantryArmor, findInfantryAugmentation, findInfantryAugmentationByKey, findInfantryProstheticItem, infantryArmor, infantryAugmentations } from "../data/infantry-armor";
import { buildSupportVehicleLightWeapon } from "../data/support-vehicle-light-weapons";
import { getEquipmentRulesLevel } from "../data/equipment-registry";
import * as fs from "fs";
import * as path from "path";
import { findCalcDefProblems, formatCalcNumber, formatCalcStep, type ICalcStep } from "../data/calc-steps";
import { getBattleValueSkillEdition, getSkillMultiplier } from "../data/battle-value";
import { INFANTRY_BV1_ENGINEERS, INFANTRY_BV1_STANDARD_SIZE, INFANTRY_BV1_TABLE, INFANTRY_BV2_STEPS, INFANTRY_COST_STEPS, getInfantryBv1Class, getInfantryBv1Line, getInfantryBv1Steps } from "../data/calc-steps-infantry";

// The four platoons TechManual builds as its running examples (pp.146-155).

// Darrell's motorized laser rifle platoon.
const darrell = (): InfantryPlatoon => {
    const platoon = new InfantryPlatoon();
    platoon.setMotive("motorized");
    expect(platoon.setPrimaryWeapon("inf-laser-rifle")).toBe(true);
    return platoon;
};

// Eberhard's Marian Hegemony foot platoon: auto-rifles and 2 support machine guns per squad.
const eberhard = (): InfantryPlatoon => {
    const platoon = new InfantryPlatoon();
    expect(platoon.setFormation("marian-hegemony")).toBe(true);
    expect(platoon.setPrimaryWeapon("inf-auto-rifle")).toBe(true);
    expect(platoon.setSecondaryWeapon("inf-machine-gun-support")).toBe(true);
    platoon.setSecondaryPerSquad(2);
    return platoon;
};

// Jason's Clan mechanized (tracked) Point: Gauss SMGs and 1 Bearhunter per squad.
const jason = (): InfantryPlatoon => {
    const platoon = new InfantryPlatoon();
    platoon.setTechBase("clan");
    platoon.setMotive("mech-tracked");
    expect(platoon.setPrimaryWeapon("inf-gauss-submachine-gun")).toBe(true);
    expect(platoon.setSecondaryWeapon("inf-autocannon-bearhunter-super-heavy")).toBe(true);
    return platoon;
};

describe("Conventional infantry weapons data (TechManual pp.298-301, 319, 349-352)", () => {
    it("holds every row of the weapons table once, with the values the book's examples quote", () => {
        // 212 TechManual rows, 3 from Handbook: House Liao p.147, 3 from the AToW Companion p.195, 1 from IO:AE p.52 and 1 Custom Homebrew.
        const tm = infantryWeapons.filter((weapon) => !weapon.book);
        expect(tm.length).toBe(212);
        expect(infantryWeapons.filter((weapon) => weapon.book === "HB:HL").map((weapon) => weapon.tag)).toEqual(["inf-blade-slasher-combat-knife", "inf-rifle-stalker-sniper", "inf-rifle-striker-carbine"]);
        expect(new Set(infantryWeapons.map((weapon) => weapon.tag)).size).toBe(221);
        expect(infantryWeapons.filter((weapon) => weapon.book === "AToW:C").map((weapon) => weapon.tag)).toEqual(["inf-gauss-rifle-gungnir-heavy-support", "inf-support-ppc-snub-nose", "inf-wire-guided-missile-launcher"]);
        // AToW Companion p.195 rows; the MegaMek names resolve to them, and the IS pulse laser rifle answers to the MegaMek name.
        expect(findInfantryWeapon("inf-gauss-rifle-gungnir-heavy-support")).toMatchObject({ techBase: "is", baseRange: 3, damage: 1.23, crew: 3, weight: 60, ammoWeight: 20, shots: 10, cost: 15000, ammoCost: 50, battleValue: 8.82 });
        expect(findInfantryWeapon("inf-support-ppc-snub-nose")).toMatchObject({ techBase: "is", baseRange: 5, damage: 1.58, crew: 3, weight: 1600, ammoWeight: 25, shots: 150, cost: 60000, battleValue: 18.65 });
        expect(findInfantryWeaponByName("Gauss Rifle (Gungnir Heavy Support)", "is")?.tag).toBe("inf-gauss-rifle-gungnir-heavy-support");
        expect(findInfantryWeaponByName("Support PPC (Snub-Nose)", "is")?.tag).toBe("inf-support-ppc-snub-nose");
        expect(findInfantryWeaponByName("Pulse Laser Rifle (Inner Sphere)", "is")?.tag).toBe("inf-pulse-laser-rifle-is");
        expect(findInfantryWeapon("inf-laser-rifle")).toMatchObject({ type: "standard", damageType: "E", baseRange: 2, damage: 0.28, crew: 1, cost: 1250 });
        expect(findInfantryWeapon("inf-auto-rifle")).toMatchObject({ baseRange: 1, damage: 0.52 });
        expect(findInfantryWeapon("inf-machine-gun-support")).toMatchObject({ type: "support", special: "B", baseRange: 2, damage: 0.94, crew: 2 });
        expect(findInfantryWeapon("inf-autocannon-bearhunter-super-heavy")).toMatchObject({ techBase: "clan", special: "B", baseRange: 0, damage: 2.33, crew: 2 });
        expect(findInfantryWeapon("inf-lrm-launcher-corean-farshot")).toMatchObject({ techBase: "is", baseRange: 3, crew: 1, encumbering: true });
        expect(findInfantryWeapon("inf-laser-rifle-blazer")?.battleValue).toBe(1.79);
        // The cost table has no row for these: unknown, not free.
        expect(findInfantryWeapon("inf-club-vibro-mace")?.cost).toBeNull();
        expect(infantryWeapons.filter((weapon) => weapon.cost === null).length).toBe(7);
    });
});

// The Hammel Marksman (Shrapnel #1 p.77) prints only A Time of War stats: AP/BD 4B/4, 130/260/520/780 m, 12 shots.
describe("Infantry weapons converted from A Time of War (AToW Companion pp.169-171, errata v1.1)", () => {
    it("converts the Hammel Marksman: damage 0.28, range 4, and a Battle Value by the table's rule", () => {
        // Penetration 4 / 4 = 1; Damage 4 x (3.5 + 1 / 5 rounded normally to 0) = 14; Reload 12 / 10, held to 1.
        const damage = Math.round(1 * 4 * (3.5 + Math.round(1 / 5)) / 50 * Math.min(1, 12 / 10) * 100) / 100;
        expect(damage).toBe(0.28);
        const rifle = findInfantryWeaponByName("Sniper Rifle (Hammel Marksman)", "is");
        expect(rifle).toMatchObject({ damage, baseRange: Math.round(130 / 30), type: "standard", damageType: "B", special: "", crew: 1, techBase: "is", techRating: "C", availability: "C-C-B", cost: 500, ammoCost: 6, weight: 5, ammoWeight: 0.05, shots: 12, introducedIS: null, book: "Shrapnel #1", page: 77 });
        // Range 4: one hex at -2, four at 0, two each at +1 to +4; (36 + 4 x 33 + 2 x (30 + 26 + 21 + 15)) / 36 x 0.28 = 2.74.
        expect(rifle?.battleValue).toBe(2.74);
        expect(findInfantryWeaponByName("Hammel Marksman", "is")?.tag).toBe(rifle?.tag);
    });
});

// Ideas #85: the Ceres Arms Leiting-23 heavy combat carbine, converted from A Time of War (AToW Companion pp.169-171).
describe("Custom Homebrew infantry weapons", () => {
    const carbine = "inf-rifle-leiting-23-heavy-combat-carbine";

    it("converts the carbine's standard load by the AToW Companion formula", () => {
        // AP 3, BD 7 with splash, no Burst, 6 shots: [(3 / 4) x 7 x (3.5 + 0 + 1) / 50] x 0.6 = 0.2835.
        const damage = Math.round((3 / 4) * 7 * (3.5 + Math.round(1 / 5) + 1) / 50 * Math.min(1, 6 / 10) * 100) / 100;
        expect(findInfantryWeapon(carbine)).toMatchObject({ damage, baseRange: Math.round(5 / 30), type: "standard", damageType: "B", special: "", crew: 1, cost: 450, ammoCost: 5, shots: 6, techBase: "is", introducedIS: 3100, rulesLevel: 6, book: "Custom" });
        expect(damage).toBe(0.28);
    });

    it("takes its Battle Value as the TM table does: damage times the chance to hit over its range at Gunnery 4", () => {
        const hits = (target: number): number => [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((roll) => roll >= Math.max(2, target)).reduce((sum, roll) => sum + 6 - Math.abs(roll - 7), 0);
        const derived = (weapon: { baseRange: number; damage: number }): number =>
            Math.round(weapon.damage * INFANTRY_RANGE_MODIFIERS[weapon.baseRange].reduce((sum, modifier) => sum + hits(4 + modifier), 0) / 36 * 100 + 1e-9) / 100;
        const tm = infantryWeapons.filter((weapon) => !weapon.book);
        expect(tm.filter((weapon) => Math.abs(derived(weapon) - weapon.battleValue) < 0.005).length).toBe(208);
        expect(findInfantryWeapon(carbine)?.battleValue).toBe(derived(findInfantryWeapon(carbine)!));
    });

    it("is offered only at the Custom Homebrew rules level, and raises the platoon to it", () => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setEra("dark-ages")).toBe(true);
        expect(platoon.getAvailablePrimaryWeapons().map((weapon) => weapon.tag)).not.toContain(carbine);
        expect(platoon.getAvailablePrimaryWeapons(5).map((weapon) => weapon.tag)).not.toContain(carbine);
        expect(platoon.getAvailablePrimaryWeapons(6).map((weapon) => weapon.tag)).toContain(carbine);
        expect(platoon.setPrimaryWeapon(carbine)).toBe(true);
        expect(platoon.getRequiredRulesLevel()).toBe(6);
        // Once carried it stays on offer, so the list can show it.
        expect(platoon.getAvailablePrimaryWeapons().map((weapon) => weapon.tag)).toContain(carbine);
    });

    it("keeps its level when a Support Vehicle mounts it as a Light weapon", () => {
        const item = buildSupportVehicleLightWeapon(findInfantryWeapon(carbine)!);
        expect(getEquipmentRulesLevel(item)).toBe(6);
        expect(getEquipmentRulesLevel(buildSupportVehicleLightWeapon(findInfantryWeapon("inf-laser-rifle")!))).toBe(2);
    });

    it("is not in production before 3100", () => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setEra("jihad")).toBe(true);
        expect(platoon.getAvailablePrimaryWeapons(6).map((weapon) => weapon.tag)).not.toContain(carbine);
    });
});

describe("Infantry platoon type (TechManual pp.145-147)", () => {
    it("takes squad size, platoon size and MP from the Motive Types and Formations Tables", () => {
        const platoon = darrell();
        expect([platoon.getSquadSize(), platoon.getSquads(), platoon.getTroopers()]).toEqual([7, 4, 28]);
        expect(platoon.getMP()).toBe(3);
        expect(platoon.getMovementText()).toBe("3 (Ground)");
        expect(platoon.getSubPlatoons()).toEqual([28]);

        platoon.setMotive("jump");
        expect([platoon.getSquadSize(), platoon.getSquads()]).toEqual([7, 3]);
        platoon.setMotive("mech-hover");
        expect([platoon.getTroopers(), platoon.getMP()]).toEqual([20, 5]);
        platoon.setTechBase("clan");
        platoon.setMotive("foot");
        expect([platoon.getSquadSize(), platoon.getSquads()]).toEqual([5, 5]);
        expect(platoon.getFormation().tag).toBe("clan");
        expect(INFANTRY_FORMATIONS.length).toBe(13);
        expect(INFANTRY_MOTIVE_TYPES.map((motive) => motive.maxPlatoonSize)).toEqual([30, 30, 30, 20, 28, 24, 21, 8, 16, 30, 12, 20]);
    });

    it("splits an oversized platoon evenly into sub-platoons of 30 or fewer (TM p.146)", () => {
        expect(eberhard().getSubPlatoons()).toEqual([25, 25, 25, 25]);
        const blake = new InfantryPlatoon();
        blake.setFormation("comstar-word-of-blake");
        expect(blake.getSubPlatoons()).toEqual([18, 18]);
        const marianJump = new InfantryPlatoon();
        marianJump.setFormation("marian-hegemony");
        marianJump.setMotive("jump");
        expect(marianJump.getSubPlatoons()).toEqual([25, 25]);
        // Odd troopers go to the first sub-platoon.
        blake.setSquadSize(7);
        blake.setSquads(5);
        expect(blake.getSubPlatoons()).toEqual([18, 17]);
        expect(blake.usesFormationSizes()).toBe(false);
        expect(blake.getNotes().join(" | ")).toContain("Custom arrangement");
    });
});

describe("Infantry platoon weapons (TechManual pp.148-154)", () => {
    it("builds Darrell's motorized laser rifle platoon: 8 damage, effective to 6 hexes", () => {
        const platoon = darrell();
        expect(platoon.getRangeModifiers()).toEqual([-2, 0, 0, 2, 2, 4, 4]);
        expect(platoon.getTotalDamage()).toBe(8);
        expect(platoon.getDamageTable().slice(0, 3)).toEqual([0, 1, 1]);
        expect(platoon.getDamageTable().length).toBe(28);
        expect(platoon.getDamageForTroopers(28)).toBe(8);
        expect(platoon.getSpecialFeatures()).toEqual([]);
        expect(platoon.getIssues()).toEqual([]);
    });

    it("builds Eberhard's Marian machine gun platoon: 60 damage, 0.6 a trooper, move or shoot", () => {
        const platoon = eberhard();
        expect(platoon.getSecondaryCount()).toBe(20);
        expect(platoon.getPrimaryCount()).toBe(80);
        expect(platoon.getTotalDamage()).toBe(60);
        expect(platoon.getDamagePerTrooper()).toBeCloseTo(0.6);
        // Two per squad: the machine guns' range applies. In its own hex: -2, -1 for heavy burst, +1 for a crew of 2 (p.151).
        expect(platoon.getRangeModifiers()).toEqual([-2, 0, 0, 2, 2, 4, 4]);
        expect(platoon.getSpecialFeatures()).toEqual(["B"]);
        expect(platoon.isMoveOrFire()).toBe(true);
        expect(platoon.getMovementText()).toBe("1 (Ground), Move or Shoot");
        expect(platoon.getDamageTable()).toHaveLength(25);
        expect(platoon.getDamageTable()[24]).toBe(15);
    });

    it("builds Glenn's mechanized hover LRM platoon: 4 MP and the launchers' range", () => {
        const platoon = new InfantryPlatoon();
        platoon.setMotive("mech-hover");
        // The example's 0.19 a launcher is the table's inferno row; the standard missile does 0.48.
        expect(platoon.setSecondaryWeapon("inf-lrm-launcher-corean-farshot-inferno")).toBe(true);
        platoon.setSecondaryPerSquad(2);
        expect(platoon.getMP()).toBe(4);
        expect(platoon.getRangeModifiers()).toEqual([-1, 0, 0, 0, 2, 2, 2, 4, 4, 4]);
        expect(platoon.getTotalDamage()).toBe(8);
        expect(platoon.getDamagePerTrooper()).toBeCloseTo(0.4);
        expect(platoon.getSpecialFeatures()).toEqual(["F"]);
        expect(platoon.getWeight()).toBe(20);
    });

    it("builds Jason's Clan tracked Point: 17 damage, the primary weapon's range with 1 Bearhunter a squad", () => {
        const platoon = jason();
        expect(platoon.getTroopers()).toBe(20);
        expect(platoon.getSecondaryPerSquad()).toBe(1);
        expect(platoon.getRangeModifiers()).toEqual([-1, 0, 2, 4]);
        expect(platoon.getTotalDamage()).toBe(17);
        expect(platoon.getDamagePerTrooper()).toBeCloseTo(0.85);
        expect(platoon.hasHeavyBurst()).toBe(false);
        platoon.setSecondaryPerSquad(2);
        expect(platoon.hasHeavyBurst()).toBe(true);
        // Tracked platoons lose no MP to support weapons.
        expect(platoon.getMP()).toBe(3);
        expect(platoon.getMaxRange()).toBe(0);
    });

    it("limits secondary weapons to 2 per squad, or squad size over crew (TM p.151)", () => {
        const platoon = new InfantryPlatoon();
        const heavyLaser = findInfantryWeapon("inf-support-laser-heavy")!;
        expect(heavyLaser.crew).toBe(3);
        expect(platoon.getMaxSecondaryPerSquad(heavyLaser)).toBe(2);
        platoon.setTechBase("clan");
        expect(platoon.getMaxSecondaryPerSquad(heavyLaser)).toBe(1);
        expect(platoon.setSecondaryWeapon("inf-support-laser-heavy")).toBe(true);
        platoon.setSecondaryPerSquad(2);
        expect(platoon.getSecondaryPerSquad()).toBe(1);
    });

    it("keeps melee and point-blank weapons from mechanized platoons, and support secondaries from melee platoons", () => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setPrimaryWeapon("inf-blade-vibro-blade")).toBe(true);
        expect(platoon.setPrimaryWeapon("inf-machine-gun-support")).toBe(false);
        expect(platoon.setSecondaryWeapon("inf-machine-gun-support")).toBe(false);
        expect(platoon.setSecondaryWeapon("inf-auto-rifle")).toBe(true);
        // A point-blank weapon adds 1 in the platoon's own hex, its only range.
        platoon.setSecondaryWeapon("");
        expect(platoon.getRangeModifiers()).toEqual([1]);
        platoon.setMotive("mech-wheeled");
        expect(platoon.getPrimaryWeapon().tag).toBe("inf-auto-rifle");
        expect(platoon.setPrimaryWeapon("inf-blade-vibro-blade")).toBe(false);
        // Clan-only weapons stay with the Clans.
        expect(platoon.setPrimaryWeapon("inf-gauss-submachine-gun")).toBe(false);
    });

    it("caps a primary weapon at 0.60 and gives it heavy burst (TM p.150)", () => {
        const heavy = infantryWeapons.find((weapon) => weapon.type === "standard" && weapon.damage > 0.6 && weapon.techBase !== "clan" && !weapon.special.includes("B"))!;
        const platoon = new InfantryPlatoon();
        expect(platoon.setPrimaryWeapon(heavy.tag)).toBe(true);
        expect(platoon.getPrimaryDamage()).toBe(0.6);
        expect(platoon.getTotalDamage()).toBe(17);
        expect(platoon.getSpecialFeatures()).toContain("B");
    });

    it("holds a platoon with the Support Particle Cannon to 2 MP, on motorized and tracked platoons only (TM p.352)", () => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setSecondaryWeapon(INFANTRY_SUPPORT_PPC_TAG)).toBe(false);
        platoon.setMotive("motorized");
        expect(platoon.setSecondaryWeapon(INFANTRY_SUPPORT_PPC_TAG)).toBe(true);
        expect(platoon.getMP()).toBe(2);
        expect(INFANTRY_RANGE_MODIFIERS[7].length).toBe(22);
    });
});

describe("Infantry platoon weight, Battle Value and cost", () => {
    it("weighs platoons by trooper, with 15 kg each for Anti-'Mech kits, rounded up to the half ton (TM p.155)", () => {
        const motorized = darrell();
        expect(motorized.getWeight()).toBe(5.5);
        motorized.setAntiMechKit(true);
        // 28 x 0.21 = 5.88.
        expect(motorized.getWeight()).toBe(6);
        const marian = eberhard();
        marian.setAntiMechKit(true);
        expect(marian.getWeight()).toBe(10);
        expect(marian.getWeight(25)).toBe(2.5);
        const tracked = jason();
        expect(tracked.setAntiMechKit(true)).toBe(false);
        expect(tracked.getWeight()).toBe(20);
    });

    it("gives the Anti-'Mech jump platoon of the worked example a Battle Value of 168 (TM p.309)", () => {
        const platoon = new InfantryPlatoon();
        platoon.setMotive("jump");
        platoon.setAntiMechKit(true);
        expect(platoon.setPrimaryWeapon("inf-laser-rifle-blazer")).toBe(true);
        expect(platoon.setSecondaryWeapon("inf-support-laser-heavy")).toBe(true);
        expect([platoon.getTroopers(), platoon.getPrimaryCount(), platoon.getSecondaryCount()]).toEqual([21, 18, 3]);
        expect(platoon.getTargetMovementModifier()).toBe(2);
        expect(InfantryPlatoon.speedFactor(3)).toBe(0.77);
        expect(InfantryPlatoon.speedFactor(1)).toBe(0.54);
        expect(platoon.getBattleValue()).toBe(168);
        expect(platoon.getBattleValueLog().join("\n")).toContain("Defensive Battle Rating: 31.5 x 1.2 = 37.8 (TM p.309");
        // Standard skills, Gunnery 4 and Anti-'Mech 5.
        expect(platoon.getSkillAdjustedBattleValue()).toBe(168);
        platoon.setAntiMechKit(false);
        // Without kits the Anti-'Mech Skill is fixed at 8: x 0.85.
        expect(platoon.getAntiMechSkill()).toBe(8);
        expect(platoon.getSkillAdjustedBattleValue()).toBe(Math.round(168 * 0.85));
    });

    it("rates a move-or-fire foot platoon at 0 MP for its Speed Factor, as the Generic Conventional Infantry Units table does (TW p.213)", () => {
        // Clan Foot Point (Basic) (SRM): 25 troopers, 2 heavy SRMs a squad. TM p.151's "move or fire" is TW's 0 Ground MP.
        // 25 x 1.5 = 37.5; (15 x 1.59 + 10 x 2.91) x 2 = 105.9 x 0.44 = 46.6; 84 (MUL 100205, MegaMek alike).
        const point = new InfantryPlatoon();
        point.setTechBase("clan");
        expect(point.setPrimaryWeapon("inf-auto-rifle")).toBe(true);
        expect(point.setSecondaryWeapon("inf-srm-launcher-heavy")).toBe(true);
        point.setSecondaryPerSquad(2);
        expect(point.isMoveOrFire()).toBe(true);
        expect(point.getBattleValueBreakdown("total-warfare").steps.find((item) => item.id === "ci.bv2.off.speed")).toMatchObject({ detail: "0 MP (move or fire)", value: 0.44 });
        expect(point.getBattleValue()).toBe(84);
        // The record sheet and the Alpha Strike card keep the 1 MP: the MUL prints 2"f.
        expect(point.getMP()).toBe(1);
    });

    it("does not add the weapons again for mechanized infantry, which cannot make Anti-'Mech attacks", () => {
        const platoon = jason();
        // 20 x 1.5 x 1.1 = 33; (16 x 1.38 + 4 x 2.13) x 0.77 = 23.56.
        expect(platoon.getBattleValue()).toBe(57);
        platoon.setGunnery(3);
        expect(platoon.getSkillMultiplier()).toBe(1.2);
    });

    it("prices Darrell's platoon at 3,167,838 C-bills (TM p.276)", () => {
        const platoon = darrell();
        expect(platoon.getCBillCost()).toBe(3167838);
        platoon.setAntiMechKit(true);
        expect(platoon.getCBillCost()).toBe(Math.floor(2000 * Math.sqrt(1250) * 1.6 * 28 * 5 + 1e-6));
        expect(platoon.setPrimaryWeapon("inf-harpoon-gun-pequod-mk-i")).toBe(true);
        expect(platoon.getCBillCost()).toBeNull();
        expect(platoon.getCBillCostLog().join(" ")).toContain("no price");
    });
});

describe("Saved infantry platoons", () => {
    it("round-trips through JSON", () => {
        const platoon = eberhard();
        platoon.setName("Legio I");
        platoon.setAntiMechKit(true);
        platoon.setGunnery(3);
        const copy = new InfantryPlatoon(platoon.exportJSON());
        expect(copy.export()).toEqual(platoon.export());
        expect(copy.getImportIssues()).toEqual([]);
        expect(copy.getDisplayName()).toBe("Legio I");
        expect(new InfantryPlatoon().getDisplayName()).toBe("Foot Auto-Rifle Infantry");
    });

    it("reads a hostile save one field at a time and reports what it changed", () => {
        const hostile = new InfantryPlatoon(JSON.stringify({
            uuid: "<script>", name: { toString: 1 }, techBase: "clan", formation: "marian-hegemony", motive: "rocket",
            squadSize: 1e9, squads: -4, primaryWeapon: "inf-machine-gun-support", secondaryWeapon: "medium-laser", secondaryPerSquad: 2,
            antiMechKit: "yes", gunnery: 99, antiMech: null, __proto__: { polluted: true }, extra: "ignored",
        }));
        expect(hostile.getUUID()).not.toBe("<script>");
        expect(hostile.getName()).toBe("");
        expect(hostile.getFormation().tag).toBe("clan");
        expect(hostile.getMotive().tag).toBe("foot");
        expect([hostile.getSquadSize(), hostile.getSquads()]).toEqual([10, 1]);
        expect(hostile.getPrimaryWeapon().tag).toBe("inf-auto-rifle");
        expect(hostile.getSecondaryWeapon()).toBeNull();
        expect(hostile.hasAntiMechKit()).toBe(false);
        expect(hostile.getGunnery()).toBe(8);
        expect(hostile.getImportIssues().length).toBeGreaterThanOrEqual(5);
        expect(Object.keys(hostile.export())).not.toContain("extra");

        expect(normalizeInfantryPlatoonExport(7).platoon).toBeNull();
        expect(normalizeInfantryPlatoonExport([]).platoon).toBeNull();
        expect(new InfantryPlatoon("not json").getImportIssues().length).toBe(1);
        expect(normalizeInfantryPlatoonExport({}).platoon?.primaryWeapon).toBe("inf-auto-rifle");
    });
});

describe("Infantry platoons in play (Total Warfare pp.215-217)", () => {
    it("eliminates troopers by the Non-Infantry Weapon Damage Against Infantry Table, fractions rounded up", () => {
        const platoon = darrell();
        // A PPC (direct fire, 10) hits 1 trooper; an AC/20 hits 2.
        platoon.resolveAttack(0, "direct", 10);
        expect(platoon.getLineTroopers(0)).toBe(27);
        platoon.resolveAttack(0, "direct", 20);
        expect(platoon.getLineTroopers(0)).toBe(25);
        // A medium laser (5) still hits 1; a kick for 11 hits 2.
        platoon.resolveAttack(0, "direct", 5);
        platoon.resolveAttack(0, "physical", 11);
        expect(platoon.getLineTroopers(0)).toBe(22);
        // LB 10-X cluster: 10 / 10 + 1 = 2. Medium pulse laser: 6 / 10 + 2 = 3. LRM 20: 20 / 5 = 4.
        platoon.resolveAttack(0, "cluster-ballistic", 10);
        platoon.resolveAttack(0, "pulse", 6);
        platoon.resolveAttack(0, "cluster-missile", 20);
        expect(platoon.getLineTroopers(0)).toBe(13);
        // Area effect: 5 / 0.5 = 10.
        const log = platoon.resolveAttack(0, "area-effect", 5);
        expect(platoon.getLineTroopers(0)).toBe(3);
        expect(log.join(" | ")).toContain("10 troopers eliminated: 3 of 28 remain");
        // The platoon's own damage falls with its strength: 3 x 0.286 = 0.86.
        expect(platoon.getLineAttackDamage(0)).toBe(1);
        expect(platoon.isDamaged()).toBe(true);
        expect(platoon.resolveAttack(0, "direct", 0).join(" ")).toContain("0 troopers eliminated");
    });

    it("applies burst-fire and infantry damage point for point, and doubles damage in Clear terrain", () => {
        const platoon = darrell();
        platoon.resolveAttack(0, "burst", 7);
        expect(platoon.getLineTroopers(0)).toBe(21);
        platoon.resolveAttack(0, "infantry", 4, true);
        expect(platoon.getLineTroopers(0)).toBe(13);
        const log = platoon.resolveAttack(0, "direct", 10, true);
        expect(log.join(" | ")).toContain("Clear terrain: doubled to 2");
        expect(platoon.getLineTroopers(0)).toBe(11);
        platoon.resolveAttack(0, "area-effect", 20);
        expect(platoon.isDestroyed()).toBe(true);
        expect(platoon.getLineAttackDamage(0)).toBe(0);
    });

    it("doubles non-infantry weapon losses against mechanized infantry, whose troopers take 2 points from other attacks (TW p.217)", () => {
        const platoon = jason();
        platoon.resolveAttack(0, "direct", 10);
        expect(platoon.getLineTroopers(0)).toBe(18);
        // 3 points of machine gun fire eliminate 1 trooper and leave another half gone.
        platoon.resolveAttack(0, "burst", 3);
        expect(platoon.getLineTroopers(0)).toBe(17);
        platoon.resolveAttack(0, "infantry", 1);
        expect(platoon.getLineTroopers(0)).toBe(16);
    });

    it("tracks each sub-platoon on its own line and saves the damage with a roster, not with a design", () => {
        const platoon = eberhard();
        platoon.resolveAttack(2, "cluster-missile", 20);
        expect([0, 1, 2, 3].map((line) => platoon.getLineTroopers(line))).toEqual([25, 25, 21, 25]);
        expect(platoon.getCurrentTroopers()).toBe(96);
        expect(platoon.getStrengthPercentage()).toBe(96);
        platoon.setLineTroopers(0, 0);
        expect(platoon.isLineDestroyed(0)).toBe(true);
        expect(platoon.isDestroyed()).toBe(false);

        const copy = new InfantryPlatoon(platoon.exportJSON());
        expect(copy.getCurrentTroopers()).toBe(71);
        expect(platoon.export(true).inPlay).toBeUndefined();
        expect(normalizeInfantryPlatoonExport(platoon.export()).platoon?.inPlay).toBeUndefined();

        const group = new BattleMechGroup();
        group.infantry.push(copy);
        expect(group.isUnderStrength()).toBe(true);
        expect(group.getTotalBattleValue()).toBe(copy.getSkillAdjustedBattleValue());
        expect(group.getTotalUnits()).toBe(1);
        expect(group.getTech()).toBe("Inner Sphere");
        const reloaded = new BattleMechGroup(JSON.parse(JSON.stringify(group.export())));
        expect(reloaded.infantry[0].getCurrentTroopers()).toBe(71);
        expect(new BattleMechGroup(JSON.parse(JSON.stringify(group.export(true)))).infantry[0].isDamaged()).toBe(false);

        // A hostile save cannot mark more damage than the line holds, and resizing the platoon clears the lines.
        const hostile = new InfantryPlatoon(JSON.stringify({ ...platoon.export(), inPlay: { damage: [1e9, "x", -5, null, 7, 7] } }));
        expect([0, 1, 2, 3].map((line) => hostile.getLineTroopers(line))).toEqual([0, 25, 25, 25]);
        hostile.setSquads(3);
        expect(hostile.isDamaged()).toBe(false);
        expect(hostile.resolveAttack(9, "direct", 10)).toEqual([]);
    });
});

describe("Infantry Alpha Strike conversion, against Master Unit List cards", () => {
    const card = (platoon: InfantryPlatoon) => {
        const stats = platoon.getAlphaStrikeStats();
        const damage = stats.damageValues;
        return {
            move: `${stats.movement}"${stats.movementCode}`, armor: stats.armor, structure: stats.structure,
            damage: [damage.short, damage.medium, damage.long].map(formatInfantryASDamage).join("/"),
            specials: stats.specialAbilities.join(","), pointValue: stats.pointValue,
        };
    };

    it("converts the Motorized Platoon (Rifle, Energy): 6\"m, Armor 2, 1/1/0, AM, CAR6, PV 10", () => {
        const platoon = darrell();
        platoon.setAntiMechKit(true);
        // Troop Factor 17 (ASC p.103): 5 damage at 17 troopers, 0.5, rounded up to 1; 6 hexes reaches Medium.
        expect(card(platoon)).toEqual({ move: "6\"m", armor: 2, structure: 1, damage: "1/1/0", specials: "AM,CAR6", pointValue: 10 });
        const unit = platoon.getAlphaStrikeUnit();
        expect(unit.type).toBe("CI");
        expect(unit.basePoints).toBe(10);
    });

    it("converts the Mechanized Hover Platoon (Rifle, Energy): 10\"h, Armor 1, minimal damage, CAR20, PV 8", () => {
        const platoon = new InfantryPlatoon();
        platoon.setMotive("mech-hover");
        expect(platoon.setPrimaryWeapon("inf-laser-rifle")).toBe(true);
        // A mechanized platoon's damage divisor is halved: 20 / 30 rounds to 1. 3 damage at Troop Factor 12 is 0*.
        expect(card(platoon)).toEqual({ move: "10\"h", armor: 1, structure: 1, damage: "0*/0*/0", specials: "CAR20", pointValue: 8 });
    });

    it("converts the Taurian Foot Platoon (Rifle, Energy): 2\"f, Armor 2, 1/1/0, PV 9", () => {
        const platoon = new InfantryPlatoon();
        platoon.setFormation("taurian-concordat");
        platoon.setAntiMechKit(true);
        expect(platoon.setPrimaryWeapon("inf-laser-rifle")).toBe(true);
        expect(card(platoon)).toEqual({ move: "2\"f", armor: 2, structure: 1, damage: "1/1/0", specials: "AM,CAR3", pointValue: 9 });
    });

    it("gives a flame-based platoon HT and holds a short-range mechanized platoon back as a brawler", () => {
        // Jump platoon with 2 man-portable flamers a squad: 4"j, Short range only, HT1.
        const flamers = new InfantryPlatoon();
        flamers.setMotive("jump");
        expect(flamers.setSecondaryWeapon("inf-flamer-man-portable")).toBe(true);
        flamers.setSecondaryPerSquad(2);
        const jump = card(flamers);
        expect(jump.move).toBe("4\"j");
        expect(jump.damage).toBe("1/0/0");
        expect(jump.specials).toContain("HT1/-/-");

        // Clan Mechanized Hover Point with rifles and 2 machine guns a squad: 8"h, Armor 1, 1/0/0, PV 5 (MUL).
        const point = new InfantryPlatoon();
        point.setTechBase("clan");
        point.setMotive("mech-hover");
        expect(point.setSecondaryWeapon("inf-machine-gun-portable")).toBe(true);
        point.setSecondaryPerSquad(2);
        expect(card(point)).toEqual({ move: "8\"h", armor: 1, structure: 1, damage: "1/0/0", specials: "CAR20", pointValue: 5 });
        expect(point.getAlphaStrikeStats().calcLog.join(" | ")).toContain("Brawler: - 1.5");
    });
});

describe("Infantry weapons by era (TechManual pp.298-301)", () => {
    it("offers a weapon from its introduction, and not while it is extinct", () => {
        const platoon = new InfantryPlatoon();
        // New platoons start in the latest era, where everything not extinct is on offer.
        expect(platoon.getEra().tag).toBe(platoon.getAvailableEras().slice(-1)[0].tag);
        const tags = (): string[] => platoon.getAvailableSecondaryWeapons().map((weapon) => weapon.tag);
        expect(tags()).toContain("inf-aa-weapon-mk-1-light-aa");

        // The Mk. 1 Light AA weapon: introduced 2500, extinct 2790, reintroduced 3056.
        expect(platoon.setEra("age-of-war")).toBe(true);
        expect(tags()).toContain("inf-aa-weapon-mk-1-light-aa");
        expect(platoon.setEra("late-sw-lt")).toBe(true);
        expect(tags()).not.toContain("inf-aa-weapon-mk-1-light-aa");
        expect(platoon.setEra("clan-inv")).toBe(true);
        expect(tags()).toContain("inf-aa-weapon-mk-1-light-aa");

        // The Stetta auto-pistol dates from 3010; pre-spaceflight weapons are always there.
        const primaries = (): string[] => platoon.getAvailablePrimaryWeapons().map((weapon) => weapon.tag);
        platoon.setEra("early-sw");
        expect(primaries()).not.toContain("inf-auto-pistol-stetta");
        expect(primaries()).toContain("inf-auto-rifle");
        // A weapon with no row in the cost table has no date and is not ruled out.
        expect(primaries()).toContain("inf-harpoon-gun-pequod-mk-i");
    });

    it("reports a carried weapon the era does not have, keeps it selectable, and saves the era", () => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setPrimaryWeapon("inf-auto-pistol-stetta")).toBe(true);
        platoon.setEra("star-league");
        expect(platoon.getIssues().join(" | ")).toContain("Auto-Pistol (Stetta) is not available to Inner Sphere infantry in the Star League");
        expect(platoon.getAvailablePrimaryWeapons().map((weapon) => weapon.tag)).toContain("inf-auto-pistol-stetta");
        expect(new InfantryPlatoon(platoon.exportJSON()).getEra().tag).toBe("star-league");

        // Clan platoons use Clan eras and Clan dates; a weapon both bases use goes by its Inner Sphere date.
        platoon.setTechBase("clan");
        expect(platoon.getAvailableEras().some((era) => era.tag === "age-of-war")).toBe(false);
        expect(platoon.setEra("age-of-war")).toBe(false);
        expect(platoon.setEra("clan-golden-years")).toBe(true);
        const clanTags = platoon.getAvailablePrimaryWeapons().map((weapon) => weapon.tag);
        expect(clanTags).toContain("inf-laser-rifle");
        // The Gauss submachine gun is a Clan weapon of 3055.
        expect(clanTags).not.toContain("inf-gauss-submachine-gun");

        // A save from before eras were tracked loads into the latest era; an unknown era is reported.
        const saved = { ...new InfantryPlatoon().export() } as Record<string, unknown>;
        delete saved.era;
        const old = new InfantryPlatoon(JSON.stringify(saved));
        expect(old.getEra().tag).toBe(old.getAvailableEras().slice(-1)[0].tag);
        expect(old.getImportIssues()).toEqual([]);
        expect(new InfantryPlatoon(JSON.stringify({ ...saved, era: "<b>" })).getImportIssues().join(" ")).toContain("Unknown era");
    });
});

describe("Mixed technology platoons (TO:AUE p.189)", () => {
    it("lets a Clan point carry Inner Sphere weapons and armor kits, at the Advanced level, and saves it", () => {
        const point = new InfantryPlatoon();
        point.setTechBase("clan");
        // The Corean FarShot is an Inner Sphere launcher (TM p.300); a pure Clan point may not carry it.
        expect(point.setSecondaryWeapon("inf-lrm-launcher-corean-farshot")).toBe(false);
        expect(point.isMixedTech()).toBe(false);
        point.setMixedTech(true);
        expect(point.isMixedTech()).toBe(true);
        expect(point.setSecondaryWeapon("inf-lrm-launcher-corean-farshot")).toBe(true);
        expect(point.setArmor("inf-armor-free-worlds-league")).toBe(true);
        expect(point.getTechName()).toBe("Mixed (Clan)");
        expect(point.getIssues().join(" ")).not.toContain("not available");
        // "Any unit may be constructed using a mix of Clan and Inner Sphere technologies": an Advanced construction option.
        point.setArmor("");
        expect(point.getRequiredRulesLevel()).toBe(3);
        // An Inner Sphere weapon goes by its Inner Sphere date: the FarShot (3057) is not there before 3049.
        const farShot = findInfantryWeapon("inf-lrm-launcher-corean-farshot")!;
        expect(point.setEra("clan-golden-years")).toBe(true);
        expect(point.isWeaponInEra(farShot)).toBe(false);
        expect(point.getIssues().join(" ")).toContain("LRM Launcher (Corean FarShot) is not available");
        expect(point.setEra("clan-post-reaving")).toBe(true);
        expect(point.isWeaponInEra(farShot)).toBe(true);
        const loaded = new InfantryPlatoon(point.exportJSON());
        expect([loaded.isMixedTech(), loaded.getSecondaryWeapon()?.tag, loaded.getTechBase()]).toEqual([true, "inf-lrm-launcher-corean-farshot", "clan"]);
        // A save from before mixed technology loads as a pure platoon.
        expect(new InfantryPlatoon(new InfantryPlatoon().exportJSON()).isMixedTech()).toBe(false);
        // Switched off, the point drops what its own base cannot carry and is Standard again.
        point.setMixedTech(false);
        expect(point.getSecondaryWeapon()).toBeNull();
        expect(point.getRequiredRulesLevel()).toBe(2);
    });
});

describe("Infantry armor (Tactical Operations: Advanced Units & Equipment pp.129-130, 191)", () => {
    it("holds the Conventional Infantry Armor Table, with a record for each Sneak Suit combination", () => {
        // 47 rows; the three Sneak Suit rows become seven combinations of Camo, IR and ECM.
        expect(infantryArmor.length).toBe(51);
        expect(new Set(infantryArmor.map((armor) => armor.tag)).size).toBe(51);
        expect(findInfantryArmor("inf-armor-lyran-alliance-3060-plus")).toMatchObject({ damageDivisor: 2, encumbering: false, techBase: "is", introduced: 3060, cost: 730 });
        expect(findInfantryArmor("inf-armor-ballistic-plate-standard")).toMatchObject({ damageDivisor: 2, encumbering: true, cost: 1600 });
        expect(findInfantryArmor("inf-armor-clothing-light-e-g-summer-wear-none")?.damageDivisor).toBe(0.5);
        expect(findInfantryArmor("inf-armor-environment-suit-marine")).toMatchObject({ damageDivisor: 2, vacuum: true, encumbering: false });
        expect(findInfantryArmor("inf-armor-sneak-suit-camo-ir")).toMatchObject({ stealth: ["camo", "ir"], cost: 21000 });
    });

    it("divides damage by the armor's divisor, rounding up: the Lyran field kit example (TO:AUE p.129)", () => {
        const platoon = darrell();
        expect(platoon.getRequiredRulesLevel()).toBe(2);
        expect(platoon.setArmor("inf-armor-lyran-alliance-3060-plus")).toBe(true);
        expect(platoon.getRequiredRulesLevel()).toBe(3);
        // LB 20-X: ((20 / 10) + 1) / 2 = 1.5, a 2-point hit.
        platoon.resolveAttack(0, "cluster-ballistic", 20);
        expect(platoon.getLineTroopers(0)).toBe(26);
        // A machine gun rolling 17: 17 / 2 = 8.5, 9 points.
        platoon.resolveAttack(0, "burst", 17);
        expect(platoon.getLineTroopers(0)).toBe(17);
        // Light clothing has a divisor of 0.5: damage is doubled.
        platoon.resetInPlay();
        platoon.setArmor("inf-armor-clothing-light-e-g-summer-wear-none");
        platoon.resolveAttack(0, "infantry", 3);
        expect(platoon.getLineTroopers(0)).toBe(22);
    });

    it("slows a platoon in encumbering armor and bars it from Anti-'Mech attacks (TO:AUE p.130)", () => {
        const platoon = darrell();
        platoon.setAntiMechKit(true);
        const plain = platoon.getBattleValue();
        expect(platoon.setArmor("inf-armor-ballistic-plate-standard")).toBe(true);
        expect(platoon.getMP()).toBe(2);
        expect(platoon.canMakeAntiMechAttacks()).toBe(false);
        expect(platoon.getAlphaStrikeStats().specialAbilities).not.toContain("AM");
        // Defensive: 28 x 2 x 1.5 x 1.0 = 84; offensive: 28 x 1.43 x 0.65, not added again.
        expect(platoon.getBattleValue()).toBe(Math.round(84 + 28 * 1.43 * 0.65));
        expect(platoon.getBattleValue()).not.toBe(plain);
        // A foot platoon is not slowed below 1 MP.
        const foot = new InfantryPlatoon();
        foot.setArmor("inf-armor-snowsuit");
        expect(foot.getMP()).toBe(1);
        // Alpha Strike armor: 28 x 2 / 15 = 3.73, rounded to 4.
        expect(platoon.getAlphaStrikeStats().armor).toBe(4);
    });

    it("keeps a jump platoon's jump MP in encumbering armor: the 1 MP comes off ground movement (NGCFells, TO:AUE p.130)", () => {
        // The Royal Gurkha Battalion's kit: 3 Jump MP, as the MUL (115) and MegaMek rate it.
        const platoon = new InfantryPlatoon();
        platoon.setMotive("jump");
        expect(platoon.setArmor("inf-armor-ballistic-plate-standard")).toBe(true);
        expect(platoon.getMP()).toBe(3);
        expect(platoon.canMakeAntiMechAttacks()).toBe(false);
    });

    it("leaves archaic weapons out of the Anti-'Mech weapons added again: a blade does nothing to a 'Mech (NGCFells; the MUL alike)", () => {
        // The Otomo Guard: 20 vibro-katanas and 8 auto-rifles. 42 + (5.8 + 12.72 + 12.72) x 0.54 = 58.87: 59 (MUL 108062).
        const platoon = new InfantryPlatoon();
        expect(platoon.setPrimaryWeapon("inf-blade-vibro-katana")).toBe(true);
        expect(platoon.setSecondaryWeapon("inf-auto-rifle")).toBe(true);
        platoon.setSecondaryPerSquad(2);
        // TM p.309 adds every weapon again, so leaving the blades out is a ruling: its step is provisional, with the note.
        expect(platoon.getBattleValueBreakdown("total-warfare").steps.find((item) => item.id === "ci.bv2.off.anti-mech.archaic")).toMatchObject({ value: 31.24, status: "provisional" });
        expect(platoon.getBattleValue()).toBe(59);
        // With no archaic weapon the step is the book's, cited.
        const rifles = new InfantryPlatoon();
        expect(rifles.getBattleValueBreakdown("total-warfare").steps.find((item) => item.id === "ci.bv2.off.anti-mech")?.status).toBe("cited");
    });

    it("marks a weapon Battle Value the TM p.319 table does not print, and that is inferred, as provisional", () => {
        const platoon = new InfantryPlatoon();
        platoon.setMotive("mech-tracked");
        expect(platoon.setSecondaryWeapon("inf-gauss-rifle-gungnir-heavy-support")).toBe(true);
        platoon.setSecondaryPerSquad(1);
        const steps = platoon.getBattleValueBreakdown("total-warfare").steps;
        const secondary = steps.find((item) => item.id === "ci.bv2.off.secondary.inferred");
        expect(secondary?.status).toBe("provisional");
        expect(secondary?.value).toBeCloseTo(platoon.getSecondaryCount() * 8.82, 6);
        expect(steps.some((item) => item.id === "ci.bv2.off.secondary")).toBe(false);
        // A table weapon as primary stays cited.
        expect(steps.find((item) => item.id === "ci.bv2.off.primary")?.status).toBe("cited");
    });

    it("adds stealth armor to the Defensive Factor and each trooper's armor to the cost", () => {
        const platoon = darrell();
        const cost = platoon.getCBillCost()!;
        const value = platoon.getBattleValue();
        expect(platoon.setArmor("inf-armor-sneak-suit-camo-ir-ecm")).toBe(true);
        // Camo +0.2, IR +0.2, ECM +0.1 on top of 1.1 for 3 MP: 28 x 1.5 x 1.6 = 67.2 against 46.2.
        expect(platoon.getStealthDefensiveFactor()).toBeCloseTo(0.5);
        expect(platoon.getBattleValue()).toBe(Math.round(value - 46.2 + 67.2));
        // 28 suits at 28,000, before the motorized multiplier of 1.6.
        expect(platoon.getCBillCost()).toBe(Math.floor(cost + 28 * 28000 * 1.6 + 1e-6));
        expect(platoon.getNotes().join(" | ")).toContain("Sneak, Camo: Camo to-hit modifier +3/+2/+1/0/0");
    });

    it("offers armor by technology base and era, and saves it", () => {
        const platoon = new InfantryPlatoon();
        const offered = (): string[] => platoon.getAvailableArmor().map((armor) => armor.tag);
        expect(offered()).not.toContain("inf-armor-clan-all");
        expect(platoon.setArmor("inf-armor-clan-all")).toBe(false);
        platoon.setEra("late-sw-lt");
        expect(offered()).toContain("inf-armor-federated-suns");
        expect(offered()).not.toContain("inf-armor-lyran-alliance-3060-plus");
        expect(platoon.setArmor("inf-armor-lyran-alliance-3060-plus")).toBe(true);
        expect(platoon.getIssues().join(" | ")).toContain("Lyran Alliance (3060+) is not available in the");
        expect(new InfantryPlatoon(platoon.exportJSON()).getArmor()?.tag).toBe("inf-armor-lyran-alliance-3060-plus");
        platoon.setTechBase("clan");
        expect(platoon.getArmor()).toBeNull();
        expect(platoon.export().armor).toBeUndefined();
        expect(new InfantryPlatoon(JSON.stringify({ ...platoon.export(), armor: "inf-armor-comstar" })).getImportIssues().join(" ")).toContain("cannot be worn");
    });
});

describe("Rulings on infantry (user, 2026-10-07)", () => {
    it("applies damage modifiers in the order the books give them: Clear terrain, mechanized, then armor", () => {
        // LB 20-X against a platoon in Lyran field kits (divisor 2) in Clear terrain: 3 troopers, doubled to 6, halved to 3.
        const platoon = darrell();
        platoon.setArmor("inf-armor-lyran-alliance-3060-plus");
        const log = platoon.resolveAttack(0, "cluster-ballistic", 20, true).join(" | ");
        expect(platoon.getLineTroopers(0)).toBe(25);
        expect(log.indexOf("Clear terrain")).toBeLessThan(log.indexOf("damage divisor"));
        // Dividing first would round 1.5 up to 2 and double it to 4.
        // A machine gun rolling 5 in Clear terrain: 10, halved to 5 (dividing first: 3, doubled to 6).
        platoon.resolveAttack(0, "burst", 5, true);
        expect(platoon.getLineTroopers(0)).toBe(20);
    });

    it("gives a platoon that cannot make Anti-'Mech attacks neither the benefits nor the drawbacks of its kits", () => {
        const platoon = darrell();
        const bareWeight = platoon.getWeight();
        const bareCost = platoon.getCBillCost()!;
        platoon.setAntiMechKit(true);
        platoon.setAntiMechSkill(3);
        expect(platoon.getWeight()).toBe(6);
        expect(platoon.getSkillMultiplier()).toBe(1.2);

        // Encumbering armor: the kits stay chosen but count for nothing.
        platoon.setArmor("inf-armor-ablative-standard");
        expect(platoon.isAntiMechKitChosen()).toBe(true);
        expect(platoon.hasAntiMechKit()).toBe(false);
        expect(platoon.getWeight()).toBe(bareWeight);
        expect(platoon.getCBillCost()).toBe(Math.floor(bareCost + 28 * 1000 * 1.6 + 1e-6));
        // Anti-'Mech 8, which cannot be improved (BV v4.1 p.23, #609): the 8 column, not mechanized infantry's 5.
        expect(platoon.getSkillMultiplier()).toBe(0.85);
        platoon.setGunnery(3);
        expect(platoon.getSkillMultiplier()).toBe(1.04);
        expect(platoon.getNotes().join(" | ")).toContain("add no weight, cost or skill");

        // Removing the armor brings the kits back.
        platoon.setArmor("");
        expect(platoon.hasAntiMechKit()).toBe(true);
        expect(platoon.getWeight()).toBe(6);
        expect(new InfantryPlatoon(platoon.exportJSON()).getAntiMechSkill()).toBe(3);
    });

    it("works out Battle Value by rules edition: BV1 from the Master Rules' table under both Master Rules editions, BV2 elsewhere (#599)", () => {
        const platoon = darrell();
        // 28 motorized laser riflemen, no Anti-'Mech kit: BMR p.142 and BMR(R) p.155 both print 42.
        expect(platoon.getBattleValue("master-rules")).toBe(42);
        expect(platoon.getBattleValue("master-rules-revised")).toBe(42);
        expect(platoon.getBattleValue("constructor")).toBe(platoon.getBattleValue());
        expect(platoon.getBattleValue("master-rules")).not.toBe(platoon.getBattleValue("total-warfare"));
        // Infantry BV1 is entered, so the skill multiplier reads the edition's own table (plan ruling 2).
        platoon.setGunnery(3);
        expect(platoon.getSkillMultiplier("master-rules")).toBe(getSkillMultiplier(3, platoon.getAntiMechSkill(), "infantry", getBattleValueSkillEdition("master-rules", "infantry")));
        expect(platoon.getSkillAdjustedBattleValue("master-rules")).toBe(Math.floor(42 * platoon.getSkillMultiplier("master-rules") + 0.5 + 1e-9));
    });
});

describe("E-War carrier (#642)", () => {
    const build = () => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setArmor("inf-armor-sneak-suit-ecm")).toBe(true);
        return platoon;
    };

    it("lists its E-War gear", () => {
        // A platoon carries no equipment list: its only E-War gear is the armor kit.
        const gear = build().getEWarGear();
        expect(gear.map(item => item.kind)).toEqual(["ecm-infantry"]);
        expect(gear[0]).toMatchObject({ tag: "inf-armor-sneak-suit-ecm", location: "armor", destroyed: false });
        expect(gear[0].name).toBeTruthy();
        expect(gear[0].uuid).toBeUndefined();
        expect(new InfantryPlatoon().getEWarGear()).toEqual([]);
        const combo = new InfantryPlatoon();
        combo.setArmor("inf-armor-sneak-suit-camo-ir-ecm");
        expect(combo.getEWarGear().map(item => item.kind)).toEqual(["ecm-infantry"]);
    });

    it("reports destroyed E-War gear", () => {
        // No per-item damage state: the kit is reported not destroyed, even on a destroyed platoon.
        const platoon = build();
        for (let line = 0; line < platoon.getSubPlatoons().length; line++) platoon.setLineDamage(line, 99);
        expect(platoon.isDestroyed()).toBe(true);
        expect(platoon.getEWarGear().map(item => item.destroyed)).toEqual([false]);
    });

    it("lists stealth armor", () => {
        // Infantry stealth armor (camo, IR) is not an E-War stealth kind; only the ECM sneak suits classify.
        const platoon = new InfantryPlatoon();
        platoon.setArmor("inf-armor-sneak-suit-camo");
        expect(platoon.getEWarGear()).toEqual([]);
    });

    it("saves E-War state and loads old saves without it", () => {
        const platoon = build();
        expect(platoon.export().ewarPlay).toBeUndefined();
        platoon.ewarPlay.inHostileEcm = true;
        const saved = JSON.parse(JSON.stringify(platoon.export()));
        expect(saved.ewarPlay).toEqual({ inHostileEcm: true });
        expect(platoon.export(true).ewarPlay).toBeUndefined();
        expect(new InfantryPlatoon(JSON.stringify(saved)).ewarPlay).toEqual({ inHostileEcm: true });
        delete saved.ewarPlay;
        expect(new InfantryPlatoon(JSON.stringify(saved)).ewarPlay).toEqual({});
    });
});

// ---- E-War Phase 3, Task 7: infantry Narc launchers and TAG (Maximum Tech p.40) ----
describe("infantry field gear (Maximum Tech p.40)", () => {
    const laserPlatoon = () => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setPrimaryWeapon("inf-laser-rifle")).toBe(true);
        return platoon;
    };

    it("offers the Narc launcher and TAG as apocryphal MT gear, and TAG only with a laser", () => {
        const plain = new InfantryPlatoon();
        expect(plain.getFieldGearOptions().map((option) => option.tag)).toEqual(["inf-field-narc", "inf-field-tag"]);
        expect(plain.getFieldGearOptions().every((option) => option.apocryphal)).toBe(true);
        expect(plain.setFieldGear(["inf-field-tag"])).toBe(false);
        expect(plain.getFieldGear()).toEqual([]);
        expect(plain.setFieldGear(["inf-field-narc"])).toBe(true);
        expect(laserPlatoon().setFieldGear(["inf-field-tag"])).toBe(true);
        expect(plain.setFieldGear(["not-a-gear"])).toBe(false);
    });

    it("lists the gear as Narc and TAG E-War gear that the missile rules read", () => {
        const platoon = laserPlatoon();
        platoon.setFieldGear(["inf-field-narc", "inf-field-tag"]);
        expect(platoon.getEWarGear().map((gear) => gear.kind)).toEqual(["narc", "tag"]);
        expect(getEWarKind("inf-field-narc")).toBe("narc");
        expect(getEWarKind("inf-field-tag")).toBe("tag");
    });

    it("adds 10,000 C-bills for each Narc launcher (one a squad, four a platoon, three for jump) and 50,000 for TAG", () => {
        const foot = laserPlatoon();
        const base = foot.getCBillCost()!;
        foot.setFieldGear(["inf-field-narc"]);
        expect(foot.getNarcLaunchers()).toBe(4);
        expect(foot.getCBillCost()).toBe(base + 40000);
        foot.setFieldGear(["inf-field-tag"]);
        expect(foot.getCBillCost()).toBe(base + 50000);
        const jump = laserPlatoon();
        jump.setMotive("jump");
        const jumpBase = jump.getCBillCost()!;
        jump.setFieldGear(["inf-field-narc"]);
        expect(jump.getNarcLaunchers()).toBe(3);
        expect(jump.getCBillCost()).toBe(jumpBase + 30000);
        foot.setSquads(2);
        foot.setFieldGear(["inf-field-narc"]);
        expect(foot.getNarcLaunchers()).toBe(2);
    });

    it("saves the gear only when there is some, and loads an older save without it", () => {
        const platoon = laserPlatoon();
        expect(platoon.export().fieldGear).toBeUndefined();
        platoon.setFieldGear(["inf-field-tag", "inf-field-narc"]);
        const saved = platoon.export();
        expect(saved.fieldGear).toEqual(["inf-field-narc", "inf-field-tag"]);
        const loaded = new InfantryPlatoon();
        expect(loaded.importJSON(JSON.stringify(saved))).toBe(true);
        expect(loaded.getFieldGear()).toEqual(["inf-field-narc", "inf-field-tag"]);
        const old = new InfantryPlatoon();
        expect(old.importJSON(JSON.stringify(laserPlatoon().export()))).toBe(true);
        expect(old.getFieldGear()).toEqual([]);
        // Changing the primary weapon to one that is not a laser takes the TAG off.
        loaded.setPrimaryWeapon("inf-auto-rifle");
        expect(loaded.getFieldGear()).toEqual(["inf-field-narc"]);
    });
});

describe("deferred minors: infantry field gear limits", () => {
    it("offers the Narc launcher to foot, motorized and jump platoons only, MT p.40 (not mechanized)", () => {
        const platoon = new InfantryPlatoon();
        platoon.setMotive("mech-tracked");
        expect(platoon.getFieldGearOptions().find((option) => option.tag === "inf-field-narc")?.available).toBe(false);
        expect(platoon.setFieldGear(["inf-field-narc"])).toBe(false);
        platoon.setMotive("motorized");
        expect(platoon.getFieldGearOptions().find((option) => option.tag === "inf-field-narc")?.available).toBe(true);
    });

    it("takes TAG off when the secondary laser is dropped, and when the platoon turns mechanized", () => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setSecondaryWeapon("inf-laser-rifle")).toBe(true);
        platoon.setSecondaryPerSquad(1);
        expect(platoon.setFieldGear(["inf-field-tag", "inf-field-narc"])).toBe(true);
        platoon.setSecondaryWeapon("");
        expect(platoon.getFieldGear()).toEqual(["inf-field-narc"]);
        platoon.setMotive("mech-tracked");
        expect(platoon.getFieldGear()).toEqual([]);
    });
});

// Conventional infantry stealth converts to LMAS (#642 Phase 5, Call 4a): the MUL gives its six stealthy infantry
// units LMAS, and the Companion converts dermal camouflage to it (ASC p.127, ASCE p.140).
describe("Infantry stealth armor in Alpha Strike (LMAS)", () => {
    const withArmor = (tag: string): InfantryPlatoon => {
        const platoon = new InfantryPlatoon();
        platoon.setMotive("foot");
        expect(platoon.setPrimaryWeapon("inf-auto-rifle")).toBe(true);
        expect(platoon.setArmor(tag), tag).toBe(true);
        return platoon;
    };
    it("gives the DEST suit and every camo sneak suit LMAS", () => {
        for (const tag of ["inf-armor-dest-infiltration-suit", "inf-armor-sneak-suit-camo", "inf-armor-sneak-suit-camo-ir", "inf-armor-sneak-suit-camo-ecm", "inf-armor-sneak-suit-camo-ir-ecm"]) {
            expect(withArmor(tag).getAlphaStrikeStats().specialAbilities, tag).toContain("LMAS");
        }
    });
    it("gives IR-only and ECM-only sneak suits and plain platoons none", () => {
        for (const tag of ["inf-armor-sneak-suit-ir", "inf-armor-sneak-suit-ecm", "inf-armor-sneak-suit-ir-ecm"]) {
            expect(withArmor(tag).getAlphaStrikeStats().specialAbilities, tag).not.toContain("LMAS");
        }
        const plain = new InfantryPlatoon();
        plain.setMotive("foot");
        expect(plain.getAlphaStrikeStats().specialAbilities).not.toContain("LMAS");
    });
    it("raises the defensive Point Value the way mimetic armor does (target modifier of at least 2)", () => {
        const camo = withArmor("inf-armor-sneak-suit-camo").getAlphaStrikeStats();
        const none = withArmor("inf-armor-sneak-suit-ir").getAlphaStrikeStats();
        expect(camo.pointValue).toBeGreaterThan(none.pointValue);
    });
});

// Stun and rout (#645): sonic projectors on conventional infantry.
describe("stun and rout on conventional infantry (#645)", () => {
    it("stun takes troopers out of the attack until the End Phase of next turn", () => {
        const platoon = eberhard();
        const all = platoon.getCurrentTroopers();
        platoon.resolveStun(7, 3, {});
        expect(platoon.getStunnedTroopers()).toBe(7);
        expect(platoon.getAttackTroopers()).toBe(all - 7);
        expect(platoon.getCurrentTroopers()).toBe(all);
        platoon.endTurnStun(3);
        expect(platoon.getStunnedTroopers()).toBe(7);
        platoon.endTurnStun(4);
        expect(platoon.getStunnedTroopers()).toBe(0);
    });

    it("stunned never exceeds the living", () => {
        const platoon = eberhard();
        platoon.resolveStun(999, 1, {});
        expect(platoon.getStunnedTroopers()).toBe(platoon.getCurrentTroopers());
        expect(platoon.getAttackTroopers()).toBe(0);
    });

    it("the dead come off the stunned first", () => {
        const platoon = jason();
        const all = platoon.getCurrentTroopers();
        platoon.resolveStun(10, 1, {});
        platoon.setLineTroopers(0, platoon.getLineTroopers(0) - 7);
        expect(platoon.getCurrentTroopers()).toBe(all - 7);
        expect(platoon.getStunnedTroopers()).toBe(3);
        expect(platoon.getAttackTroopers()).toBe(all - 7 - 3);
    });

    it("mechanized platoons count troopers, not points", () => {
        const platoon = jason();
        const all = platoon.getCurrentTroopers();
        platoon.resolveStun(4, 1, {});
        expect(platoon.getStunnedTroopers()).toBe(4);
        expect(platoon.getAttackTroopers()).toBe(all - 4);
        expect(platoon.getCurrentTroopers()).toBe(all);
    });

    it("sealed kits are immune", () => {
        const platoon = eberhard();
        expect(platoon.setArmor("inf-armor-environment-suit-marine")).toBe(true);
        expect(platoon.isStunImmune().immune).toBe(true);
        expect(platoon.resolveStun(5, 1, {})[0]).toMatch(/Immune/);
        expect(platoon.getStunnedTroopers()).toBe(0);
    });

    it("sonic needs air, and a standard kit halves the dice", () => {
        const bare = eberhard();
        expect(bare.resolveStun(7, 1, { sonic: true, atmosphere: "trace" })[0]).toMatch(/No effect: sonic needs Thin atmosphere or denser/);
        expect(bare.getStunnedTroopers()).toBe(0);
        const kitted = eberhard();
        expect(kitted.setArmor("inf-armor-ablative-standard")).toBe(true);
        kitted.resolveStun(7, 1, { sonic: true });
        expect(kitted.getStunnedTroopers()).toBe(3);
    });

    it("a failed Morale Check falls back for next turn", () => {
        const platoon = eberhard();
        platoon.setMoraleResult(false, 3, "Riot Sonic Projector");
        expect(platoon.isFellBack(4)).toBe(true);
        expect(platoon.isFellBack(5)).toBe(false);
        const steady = eberhard();
        steady.setMoraleResult(true, 3);
        expect(steady.isFellBack(4)).toBe(false);
    });

    it("saves the state, and an old save has none", () => {
        const platoon = eberhard();
        expect(platoon.export().inPlay).toBeUndefined();
        platoon.resolveStun(5, 2, {});
        platoon.setMoraleResult(false, 2, "Riot Sonic Projector");
        const copy = new InfantryPlatoon();
        copy.importJSON(JSON.stringify(platoon.export()));
        expect(copy.getStunnedTroopers()).toBe(5);
        expect(copy.isFellBack(3)).toBe(true);
        copy.endTurnStun(4);
        const plain = JSON.parse(JSON.stringify(copy.export()));
        expect(plain.inPlay?.stunned).toBeUndefined();
        expect(plain.inPlay?.fellBack).toBeUndefined();
    });
});

// #599: the infantry step definitions (calc-steps-infantry.ts), read 2026-11-23.
describe("Infantry step definitions", () => {
    it("are clean definitions, BV2, BV1 under both editions, and cost", () => {
        expect(findCalcDefProblems(INFANTRY_BV2_STEPS)).toEqual([]);
        for (const id of Object.keys(INFANTRY_BV2_STEPS)) expect(id.startsWith("ci.bv2."), id).toBe(true);
        for (const edition of ["master-rules", "master-rules-revised"]) {
            expect(findCalcDefProblems(getInfantryBv1Steps(edition)), edition).toEqual([]);
            for (const id of Object.keys(getInfantryBv1Steps(edition))) expect(id.startsWith("ci.bv1."), id).toBe(true);
        }
        expect(findCalcDefProblems(INFANTRY_COST_STEPS)).toEqual([]);
    });

    it("are each listed in the reading ledger", () => {
        const ledger = fs.readFileSync(path.join(__dirname, "../../docs/superpowers/plans/2026-11-10-cited-bv-ledger.md"), "utf8");
        const ids = [INFANTRY_BV2_STEPS, getInfantryBv1Steps("master-rules"), getInfantryBv1Steps("master-rules-revised"), INFANTRY_COST_STEPS].flatMap(Object.keys);
        for (const id of ids) expect(ledger, id).toContain("`" + id + "`");
    });

    it("hold the Infantry Battle Values table as printed (BMR p.142, BMR(R) p.155)", () => {
        expect(INFANTRY_BV1_TABLE.foot.rifle).toEqual([23, 32]);
        expect(INFANTRY_BV1_TABLE.jump.laser).toEqual([41, 71]);
        expect(INFANTRY_BV1_TABLE.motorized["machine-gun"]).toEqual([39, 63]);
        expect(INFANTRY_BV1_TABLE.jump.lrm).toEqual([87, 87]);
    });
});

// Field guns and field artillery (TO:AUE pp.122-123, 190-191, 225), read 2026-11-23.
describe("Infantry field guns and field artillery (TO:AUE pp.122-123)", () => {
    const motorized = (squadSize = 7, squads = 4): InfantryPlatoon => {
        const platoon = new InfantryPlatoon();
        platoon.setMotive("motorized");
        platoon.setSquadSize(squadSize);
        platoon.setSquads(squads);
        return platoon;
    };

    const clanMotorized = (): InfantryPlatoon => {
        const platoon = new InfantryPlatoon();
        platoon.setTechBase("clan");
        platoon.setMotive("motorized");
        platoon.setSquadSize(7);
        platoon.setSquads(4);
        return platoon;
    };

    it("classes the records: autocannon of every kind, Gauss but not heavy or Hyper-Assault, Rifle (Cannon), the artillery pieces", () => {
        const kind = (tag: string): string | null => getFieldGunKind({ tag, category: /artillery|sniper-cannon|thumper-cannon|long-tom|arrow-iv/.test(tag) ? "Artillery Weapons" : "Ballistic Weapons" });
        for (const tag of ["autocannon-standard-b", "autocannon-light-2", "autocannon-ultra-d", "autocannon-lbx-10", "rotary-ac-5", "is-hvac-5", "protomech-autocannon-4", "standard-gauss-rifle", "gauss-rifle-light", "ap-gauss-rifle", "light-rifle", "medium-rifle", "heavy-rifle", "clan-autocannon-uac-10"]) {
            expect(kind(tag), tag).toBe("gun");
        }
        for (const tag of ["gauss-rifle-heavy", "gauss-rifle-heavy-improved", "hyper-assault-gauss-20", "machine-gun", "is-machine-gun-array", "medium-laser"]) expect(kind(tag), tag).toBeNull();
        for (const tag of ["sniper-artillery", "thumper-artillery", "long-tom-artillery", "arrow-iv-system", "clan-arrow-iv-system", "sniper-cannon", "thumper-cannon", "long-tom-cannon"]) expect(kind(tag), tag).toBe("artillery");
        expect(kind("hailstorm-artillery")).toBeNull();
    });

    it("crews a gun with its tons rounded up, 2 at least, and takes as many guns as the platoon can crew", () => {
        const platoon = motorized();
        expect(platoon.setFieldGuns("autocannon-ultra-b", 99)).toBe(true);
        // Ultra AC/5 is 9 t: 9 troopers a gun, 28 troopers crew 3.
        expect(platoon.getFieldGunCrew()).toBe(9);
        expect(platoon.getMaxFieldGuns()).toBe(3);
        expect(platoon.getFieldGunCount()).toBe(3);
        expect(platoon.getIssues()).toEqual([]);
        expect(platoon.getRequiredRulesLevel()).toBeGreaterThanOrEqual(3);
        const light = clanMotorized();
        expect(light.setFieldGuns("ap-gauss-rifle", 99)).toBe(true);
        expect(light.getFieldGunCrew()).toBe(2);
        expect(light.getFieldGunCount()).toBe(14);
    });

    it("is only for motorized or mechanized wheeled and tracked platoons, and one weapon type", () => {
        for (const motive of ["foot", "jump", "mech-hover"]) {
            const platoon = new InfantryPlatoon();
            platoon.setMotive(motive);
            expect(platoon.setFieldGuns("autocannon-standard-a", 1), motive).toBe(false);
            expect(platoon.getFieldGunCount()).toBe(0);
        }
        for (const motive of ["motorized", "mech-wheeled", "mech-tracked"]) {
            const platoon = new InfantryPlatoon();
            platoon.setMotive(motive);
            expect(platoon.setFieldGuns("autocannon-standard-a", 1), motive).toBe(true);
        }
        const platoon = motorized();
        expect(platoon.setFieldGuns("gauss-rifle-heavy", 1)).toBe(false);
        expect(platoon.setFieldGuns("machine-gun", 1)).toBe(false);
        expect(platoon.setFieldGuns("clan-autocannon-uac-5", 1)).toBe(false);
        expect(platoon.setFieldGuns("autocannon-ultra-b", 1)).toBe(true);
        expect(platoon.setFieldGuns("", 0)).toBe(true);
        expect(platoon.getFieldGunWeapon()).toBeNull();
    });

    it("gives each gun a ton of ammunition, each ton its own type; an LB-X fires cluster only", () => {
        const platoon = motorized();
        platoon.setFieldGuns("autocannon-lbx-5", 2);
        expect(platoon.getFieldGunAmmo().map((ammo) => ammo.tag)).toEqual(["ammo-is-lb-5x-cluster", "ammo-is-lb-5x-cluster"]);
        expect(platoon.setFieldGunAmmo(0, "ammo-is-lb-5x-standard")).toBe(false);
        expect(platoon.setFieldGunAmmo(1, "ammo-is-ultra-ac-5-standard")).toBe(false);
        expect(platoon.getFieldGunAmmoOptions().length).toBeGreaterThan(0);
        const ac = motorized();
        ac.setFieldGuns("autocannon-standard-b", 2);
        const special = ac.getFieldGunAmmoOptions().find((ammo) => ammo.isSpecialAmmo);
        expect(special).toBeDefined();
        expect(ac.setFieldGunAmmo(1, special!.tag)).toBe(true);
        expect(ac.getFieldGunAmmo()[0].isSpecialAmmo).toBeFalsy();
        expect(ac.getFieldGunAmmo()[1].tag).toBe(special!.tag);
        expect(ac.setFieldGunAmmo(2, special!.tag)).toBe(false);
    });

    it("adds the guns and their ammunition to the transport weight", () => {
        const platoon = motorized();
        const bare = platoon.getWeight();
        platoon.setFieldGuns("autocannon-ultra-b", 3);
        expect(platoon.getFieldGunWeight()).toBe(3 * 9 + 3);
        expect(platoon.getWeight()).toBe(bare + 30);
    });

    it("rolls field artillery up as one piece, which needs troopers equal to its tons and moves the platoon 1 MP", () => {
        const platoon = motorized(6, 4);
        expect(platoon.setFieldGuns("thumper-artillery", 1)).toBe(true);
        expect(platoon.isFieldArtillery()).toBe(true);
        expect(platoon.getMaxFieldGuns()).toBe(1);
        // A Thumper is 15 t; 24 troopers are enough.
        expect(platoon.getIssues()).toEqual([]);
        expect(platoon.getMP()).toBe(1);
        platoon.setFieldGuns("thumper-artillery", 3);
        expect(platoon.getFieldGunCount()).toBe(1);
        const small = motorized(4, 3);
        expect(small.setFieldGuns("sniper-artillery", 1)).toBe(true);
        expect(small.getIssues().join(" ")).toContain("20 troopers");
    });

    it("reports an issue for every rule a saved platoon breaks", () => {
        const saved = JSON.parse(motorized().exportJSON());
        saved.fieldGuns = { weapon: "autocannon-ultra-b", count: 5, ammo: [] };
        const over = new InfantryPlatoon(JSON.stringify(saved));
        expect(over.getFieldGunCount()).toBe(5);
        expect(over.getIssues().join(" ")).toMatch(/crew 3 .*Ultra AC\/5/);
        expect(over.getIssues().join(" ")).toMatch(/ammunition/i);
        saved.motive = "foot";
        const foot = new InfantryPlatoon(JSON.stringify(saved));
        expect(foot.getIssues().join(" ")).toMatch(/motorized/i);
        saved.fieldGuns = { weapon: "no-such-gun", count: 1 };
        const unknown = new InfantryPlatoon(JSON.stringify(saved));
        expect(unknown.getFieldGunCount()).toBe(0);
        expect(unknown.getImportIssues().join(" ")).toContain("no-such-gun");
    });

    it("saves and loads, and an older save without guns loads as it did", () => {
        const platoon = motorized();
        platoon.setFieldGuns("autocannon-lbx-10", 2);
        const copy = new InfantryPlatoon(platoon.exportJSON());
        expect(copy.getImportIssues()).toEqual([]);
        expect(copy.export()).toEqual(platoon.export());
        expect(copy.export().fieldGuns).toEqual({ weapon: "autocannon-lbx-10", count: 2, ammo: ["ammo-is-lb-10x-cluster", "ammo-is-lb-10x-cluster"] });
        expect(normalizeInfantryPlatoonExport(JSON.parse(platoon.exportJSON())).platoon?.fieldGuns?.count).toBe(2);
        expect("fieldGuns" in new InfantryPlatoon().export()).toBe(false);
        expect(new InfantryPlatoon(JSON.stringify({ motive: "motorized" })).getFieldGunCount()).toBe(0);
    });

    it("adds the guns and ammunition Battle Value to the offensive sum before the speed factor (TO:AUE p.191)", () => {
        const platoon = motorized();
        platoon.setFieldGuns("autocannon-ultra-b", 3);
        const value = platoon.getFieldGunBattleValue();
        // Ultra AC/5: BV 112 each; 14 a ton of ammunition, 3 tons.
        expect(value.weapons).toBe(336);
        expect(value.ammo).toBe(42);
        const log = platoon.getBattleValueLog("total-warfare");
        expect(log.join("\n")).toMatch(/3 x Ultra AC\/5: 3 x 112 = 336/);
        expect(log.join("\n")).toMatch(/Ultra AC\/5 ammunition/);
        const base = platoon.getPrimaryCount() * platoon.getPrimaryWeapon().battleValue;
        const offensive = log.find((line) => line.startsWith("Offensive Battle Rating")) ?? "";
        expect(offensive).toContain(`${formatCalcNumber(base + 378)} x ${formatCalcNumber(InfantryPlatoon.speedFactor(platoon.getMP()))}`);
        expect(platoon.getBattleValue("total-warfare")).toBeGreaterThan(new InfantryPlatoon().getBattleValue("total-warfare"));
    });

    it("holds ammunition Battle Value to the guns' value", () => {
        const platoon = clanMotorized();
        expect(platoon.setFieldGuns("ap-gauss-rifle", 14)).toBe(true);
        const value = platoon.getFieldGunBattleValue();
        expect(value.weapons).toBe(14 * 21);
        expect(value.ammo).toBeLessThanOrEqual(value.weapons);
    });

    it("prices the guns at the weapon's cost (TO:AUE p.225)", () => {
        const platoon = motorized();
        const before = platoon.getCBillCost()!;
        platoon.setFieldGuns("autocannon-ultra-b", 3);
        expect(platoon.getCBillCost()).toBe(before + 3 * 200000);
        expect(platoon.getCBillCostLog().join("\n")).toMatch(/3 x Ultra AC\/5: 3 x 200,000 = 600000/);
    });

    it("keeps the platoon from Anti-'Mech attacks while it has guns, and gets them back with none", () => {
        const platoon = motorized();
        platoon.setAntiMechKit(true);
        expect(platoon.canMakeAntiMechAttacks()).toBe(true);
        platoon.setFieldGuns("autocannon-ultra-b", 3);
        expect(platoon.canMakeAntiMechAttacks()).toBe(false);
        expect(platoon.getAlphaStrikeStats().specialAbilities).not.toContain("AM");
        platoon.setFieldGuns("", 0);
        expect(platoon.canMakeAntiMechAttacks()).toBe(true);
    });

    describe("in play", () => {
        const crewed = (): InfantryPlatoon => {
            const platoon = motorized();
            platoon.setFieldGuns("autocannon-ultra-b", 3);
            return platoon;
        };

        it("loses guns as the crew dies: a gun counts destroyed when it cannot be fully crewed", () => {
            const platoon = crewed();
            expect(platoon.getActiveFieldGuns()).toBe(3);
            platoon.setLineTroopers(0, 27);
            expect(platoon.getActiveFieldGuns()).toBe(3);
            platoon.setLineTroopers(0, 17);
            expect(platoon.getActiveFieldGuns()).toBe(1);
            platoon.setLineTroopers(0, 8);
            expect(platoon.getActiveFieldGuns()).toBe(0);
            expect(platoon.canMakeAntiMechAttacksNow()).toBe(true);
        });

        it("plays as a normal platoon of its type once every gun is gone", () => {
            const platoon = crewed();
            platoon.setAntiMechKit(true);
            expect(platoon.canMakeAntiMechAttacksNow()).toBe(false);
            platoon.setLineTroopers(0, 5);
            expect(platoon.getActiveFieldGuns()).toBe(0);
            expect(platoon.canFireFieldGuns()).toMatch(/no gun/i);
            expect(platoon.canMakeAntiMechAttacksNow()).toBe(true);
        });

        it("fires with the vehicle weapon, a facing for all, and spends ammunition at platoon level", () => {
            const platoon = crewed();
            platoon.setFieldGunFacing(2);
            expect(platoon.getFieldGunFacing()).toBe(2);
            expect(platoon.getFieldGunShots()).toEqual([20, 20, 20]);
            const log = platoon.fireFieldGuns(2);
            expect(platoon.getFieldGunShots().reduce((a, b) => a + b, 0)).toBe(58);
            expect(log.join(" ")).toContain("Ultra AC/5");
            expect(log.join(" ")).toMatch(/damage 5/);
            // Losing troopers does not reduce the ammunition.
            platoon.setLineTroopers(0, 20);
            expect(platoon.getFieldGunShots().reduce((a, b) => a + b, 0)).toBe(58);
            expect(platoon.fireFieldGuns(5).join(" ")).toMatch(/only 2/i);
        });

        it("may not fire after moving or using its infantry weapons, nor at its own hex", () => {
            const platoon = crewed();
            platoon.setFieldGunMoved(true);
            expect(platoon.canFireFieldGuns()).toMatch(/moved/i);
            platoon.endTurnStun(1);
            expect(platoon.canFireFieldGuns()).toBeNull();
            platoon.setFieldGunUsedInfantryWeapons(true);
            expect(platoon.canFireFieldGuns()).toMatch(/infantry weapons/i);
            expect(platoon.getFieldGunPlayNotes().join(" ")).toMatch(/same hex/i);
        });

        it("tells the guns that never jam or explode, and an LB-X that it may flak", () => {
            expect(crewed().getFieldGunPlayNotes().join(" ")).toMatch(/never jam/i);
            const gauss = motorized();
            gauss.setFieldGuns("standard-gauss-rifle", 1);
            expect(gauss.getFieldGunPlayNotes().join(" ")).toMatch(/never explode/i);
            const lbx = motorized();
            lbx.setFieldGuns("autocannon-lbx-10", 1);
            expect(lbx.getFieldGunPlayNotes().join(" ")).toMatch(/flak/i);
        });

        it("loses the artillery when the troopers fall under its tons", () => {
            const platoon = motorized(6, 4);
            platoon.setFieldGuns("thumper-artillery", 1);
            platoon.setLineTroopers(0, 15);
            expect(platoon.getActiveFieldGuns()).toBe(1);
            platoon.setLineTroopers(0, 14);
            expect(platoon.getActiveFieldGuns()).toBe(0);
        });

        it("keeps its facing and ammunition in the saved game", () => {
            const platoon = crewed();
            platoon.setFieldGunFacing(4);
            platoon.fireFieldGuns(1);
            const copy = new InfantryPlatoon(platoon.exportJSON());
            expect(copy.getFieldGunFacing()).toBe(4);
            expect(copy.getFieldGunShots()).toEqual(platoon.getFieldGunShots());
            expect(new InfantryPlatoon(JSON.stringify(platoon.export(true))).getFieldGunShots()).toEqual([20, 20, 20]);
        });
    });

    describe("Alpha Strike", () => {
        it("converts guns from their vehicle weapon values, inferred (no printed rule), and says so", () => {
            const platoon = motorized();
            platoon.setFieldGuns("autocannon-ultra-b", 3);
            const stats = platoon.getAlphaStrikeStats();
            // 3 Ultra AC/5 at 0.623 / 0.75 / 0.75, each gun with 20 shots of ammunition: 1.869 -> 2, 2.25 -> 3, 2.25 -> 3.
            expect([stats.damageValues.short.damage, stats.damageValues.medium.damage, stats.damageValues.long.damage]).toEqual([2, 3, 3]);
            expect(stats.calcLog.join("\n")).toMatch(/Field guns.*inferred/i);
            expect(stats.specialAbilities).not.toContain("AM");
        });

        it("counts a gun with under 10 shots a gun at three quarters", () => {
            const platoon = motorized();
            platoon.setFieldGuns("autocannon-standard-d", 2);
            const stats = platoon.getAlphaStrikeStats();
            // AC/20: 5 shots per ton, 1 ton a gun: x 0.75.
            expect(stats.calcLog.join("\n")).toContain("x 0.75");
        });

        it("keeps field artillery out of the damage and gives it its artillery special", () => {
            const platoon = motorized(6, 4);
            const plain = platoon.getAlphaStrikeStats();
            platoon.setFieldGuns("thumper-artillery", 1);
            const stats = platoon.getAlphaStrikeStats();
            expect(stats.damageValues.short.damage).toBe(plain.damageValues.short.damage);
            expect(stats.specialAbilities.some((code) => code.startsWith("ART"))).toBe(true);
            expect(stats.movement).toBe(2);
        });
    });
});

describe("Beast-mounted infantry (TO:AUE pp.106-108, 191, 225)", () => {
    const beast = (tag: string, primary: string = "inf-auto-rifle"): InfantryPlatoon => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setMount(tag)).toBe(true);
        expect(platoon.setPrimaryWeapon(primary)).toBe(true);
        return platoon;
    };

    // NGCFells (2026-11-23): Alpha Strike armor uses the same summed divisor as BV and play (TO:AUE p.191).
    it("converts a beast platoon's Alpha Strike armor with the rider and mount divisors summed", () => {
        const platoon = beast("elephant");
        expect(platoon.getDamageDivisor()).toBe(3);
        const stats = platoon.getAlphaStrikeStats();
        const troopers = platoon.getSubPlatoons()[0];
        expect(stats.armor).toBe(Math.round(troopers * 3 / 15 + 1e-9));
        expect(stats.calcLog.join(" | ")).toContain("damage divisor 3");
    });

    it("holds the eleven creatures of the Sample Types Table as printed (p.106)", () => {
        expect(INFANTRY_BEAST_MOUNTS.map((mount) => mount.name)).toEqual(["Donkey", "Coventry Kangaroo", "Horse", "Camel", "Branth", "Odessan Raxx", "Tabiranth", "Tariq", "Elephant", "Orca", "Hipposaur"]);
        const by = (name: string) => INFANTRY_BEAST_MOUNTS.find((mount) => mount.name === name)!;
        expect(by("Donkey")).toMatchObject({ size: "large", weight: 0.15, mp: 2, moveType: "Ground", bonusVsInfantryDice: 0, bonusVsOthers: 0, damageDivisor: 1, terrain: "Water (Depth 1+)" });
        expect(by("Branth")).toMatchObject({ weight: 0.72, mp: 6, moveType: "VTOL", bonusVsInfantryDice: 2, bonusVsOthers: 1, terrain: "As VTOLs (TW p.54)" });
        expect(by("Elephant")).toMatchObject({ size: "very-large", weight: 6, mp: 2, bonusVsInfantryDice: 1, bonusVsOthers: 1, damageDivisor: 2, terrain: "Water (Depth 2+)" });
        expect(by("Orca")).toMatchObject({ size: "very-large", weight: 7.2, mp: 5, moveType: "Submarine", bonusVsInfantryDice: 2, damageDivisor: 2 });
        expect(by("Hipposaur")).toMatchObject({ size: "monstrous", weight: 35.5, mp: 2, moveType: "Submarine", bonusVsInfantryDice: 10, bonusVsOthers: 4, damageDivisor: 4, terrain: "1 Ground MP on Land" });
        expect(INFANTRY_BEAST_SIZES.large).toMatchObject({ troopsPerCreature: 1, creaturesPerPlatoon: 21, toHit: 0, supportWeapons: 0, buildingMP: 0, buildingCF: 0, leg: true, swarm: true });
        expect(INFANTRY_BEAST_SIZES["very-large"]).toMatchObject({ troopsPerCreature: 2, creaturesPerPlatoon: 7, toHit: -1, supportWeapons: 2, buildingMP: 1, buildingCF: 2, leg: true, swarm: false });
        expect(INFANTRY_BEAST_SIZES.monstrous).toMatchObject({ troopsPerCreature: 4, creaturesPerPlatoon: 2, toHit: -2, supportWeapons: 3, buildingMP: 2, buildingCF: 4, leg: false, swarm: false });
    });

    it("moves by the creature: its MP and movement type, its terrain restriction, no mechanized rules", () => {
        const horse = beast("horse");
        expect(horse.getMotive().tag).toBe("beast");
        expect(horse.isMechanized()).toBe(false);
        expect(horse.getMP()).toBe(3);
        expect(horse.getMovementText()).toBe("3 (Ground)");
        expect(horse.getMotive().prohibitedTerrain).toBe("Water (Depth 1+)");
        expect(beast("branth").getMovementText()).toBe("6 (VTOL)");
        expect(beast("orca").getMovementText()).toBe("5 (Submarine)");
        expect(beast("hipposaur").getMotive().prohibitedTerrain).toBe("1 Ground MP on Land");
        // Support weapons never cost a Very Large creature MP (p.107); encumbering armor takes 1, as for any platoon (p.130; NGCFells 2026-11-23).
        const elephant = beast("elephant");
        expect(elephant.setSecondaryWeapon("inf-machine-gun-support")).toBe(true);
        elephant.setSecondaryPerSquad(2);
        expect(elephant.getMP()).toBe(2);
        expect(elephant.setArmor("inf-armor-ballistic-plate-standard")).toBe(true);
        expect(elephant.getMP()).toBe(1);
        expect(elephant.isMoveOrFire()).toBe(false);
    });

    it("sizes the platoon by creature: 21 Large, 7 Very Large and 2 Monstrous, each of those a squad", () => {
        const horse = beast("horse");
        expect([horse.getSquadSize(), horse.getSquads(), horse.getTroopers()]).toEqual([7, 3, 21]);
        horse.setSquadSize(10);
        expect(horse.getSquadSize()).toBe(10);
        const elephant = beast("elephant");
        expect([elephant.getSquadSize(), elephant.getSquads()]).toEqual([2, 7]);
        elephant.setSquadSize(5);
        expect(elephant.getSquadSize()).toBe(2);
        elephant.setSquads(8);
        expect(elephant.getIssues().join(" ")).toContain("at most 7 Elephants");
        const hipposaur = beast("hipposaur");
        expect([hipposaur.getSquadSize(), hipposaur.getSquads(), hipposaur.getTroopers()]).toEqual([4, 2, 8]);
        hipposaur.setSquads(3);
        expect(hipposaur.getIssues().join(" ")).toContain("at most 2 Hipposaurs");
        hipposaur.setSquads(2);
        expect(hipposaur.getIssues().join(" ")).not.toContain("at most");
    });

    it("weighs the creatures plus 0.2 t for each trooper, and breaks no lower than one creature and its riders", () => {
        // 21 x (0.5 + 0.2) = 14.7, to the half ton.
        expect(beast("horse").getWeight()).toBe(15);
        const elephant = beast("elephant");
        elephant.setSquads(5);
        expect(elephant.getWeight()).toBe(32);
        expect(elephant.getWeight(4)).toBe(13);
        expect(beast("hipposaur").getWeight()).toBe(73);
        expect(beast("donkey").getWeight()).toBe(Math.ceil(21 * 0.35 * 2) / 2);
        expect(elephant.getMinimumBreakdownWeight()).toBe(6.5);
        expect(beast("horse").getMinimumBreakdownWeight()).toBe(1);
    });

    it("limits support weapons by creature size and halves their crews", () => {
        const horse = beast("horse");
        expect(horse.setSecondaryWeapon("inf-machine-gun-support")).toBe(false);
        expect(horse.setSecondaryWeapon("inf-submachine-gun")).toBe(true);
        const elephant = beast("elephant");
        expect(elephant.setSecondaryWeapon("inf-machine-gun-support")).toBe(true);
        elephant.setSecondaryPerSquad(2);
        // A crew of 2 is 1 on a creature: a squad of 2 can work 2, the creature's limit.
        expect(elephant.getSecondaryPerSquad()).toBe(2);
        const hipposaur = beast("hipposaur");
        expect(hipposaur.setSecondaryWeapon("inf-support-laser-heavy")).toBe(true);
        hipposaur.setSecondaryPerSquad(3);
        // Crew 3 halves to 2; four riders work 2, not the 3 the creature could carry.
        expect(hipposaur.getSecondaryPerSquad()).toBe(2);
        expect(hipposaur.getMaxSecondaryPerSquad(findInfantryWeapon("inf-machine-gun-support"))).toBe(3);
    });

    it("lowers the attackers' to-hit by size and bars anti-'Mech attacks by size (p.108)", () => {
        expect(beast("horse").getAttackerToHitModifier()).toBe(0);
        expect(beast("elephant").getAttackerToHitModifier()).toBe(-1);
        expect(beast("hipposaur").getAttackerToHitModifier()).toBe(-2);
        const large = beast("horse");
        large.setAntiMechKit(true);
        expect([large.canMakeLegAttacks(), large.canMakeSwarmAttacks(), large.canMakeAntiMechAttacks()]).toEqual([true, true, true]);
        const elephant = beast("elephant");
        expect([elephant.canMakeLegAttacks(), elephant.canMakeSwarmAttacks(), elephant.canMakeAntiMechAttacks()]).toEqual([true, false, true]);
        const hipposaur = beast("hipposaur");
        hipposaur.setAntiMechKit(true);
        expect([hipposaur.canMakeLegAttacks(), hipposaur.canMakeSwarmAttacks(), hipposaur.canMakeAntiMechAttacks(), hipposaur.hasAntiMechKit()]).toEqual([false, false, false, false]);
    });

    it("divides incoming damage by the summed divisor, as BV does: rider 1 + mount 2 for an unarmored elephant rider (TO:AUE pp.129, 191; ruled by NGCFells 2026-11-23)", () => {
        const elephant = beast("elephant");
        // p.108 reads "in the same fashion as infantry armor"; NGCFells ruled it is the sum of divisors, an unarmored rider counting 1 (p.129).
        expect(elephant.getDamageDivisor()).toBe(3);
        const ac = elephant.resolveAttack(0, "direct", 20);
        expect(ac.join(" ")).toContain("damage divisor 3");
        // An AC/20 hit is 2 troopers on the table, divided by 3 and rounded up: 1 trooper.
        expect(elephant.getCurrentTroopers()).toBe(elephant.getTroopers() - 1);
        const before = elephant.getCurrentTroopers();
        elephant.resolveAttack(0, "burst", 5);
        // A burst of 5 troopers hit, divided by 3 and rounded up, is 2.
        expect(before - elephant.getCurrentTroopers()).toBe(2);
        // The armor and the creature add; they do not multiply.
        const plated = beast("elephant");
        expect(plated.setArmor("inf-armor-ballistic-plate-standard")).toBe(true);
        expect(plated.getDamageDivisor()).toBe(4);
        const hippo = beast("hipposaur");
        expect(hippo.setArmor("inf-armor-ballistic-plate-standard")).toBe(true);
        expect(hippo.getDamageDivisor()).toBe(6);
        // A foot platoon is untouched.
        expect(new InfantryPlatoon().getDamageDivisor()).toBe(1);
    });

    it("adds the creature's bonus damage at range 0: dice against infantry, points against the rest", () => {
        expect(beast("horse").getBonusDamage()).toEqual({ infantryDice: 0, others: 0 });
        expect(beast("branth").getBonusDamage()).toEqual({ infantryDice: 2, others: 1 });
        expect(beast("hipposaur").getBonusDamage()).toEqual({ infantryDice: 10, others: 4 });
        expect(beast("hipposaur").getBonusDamageText()).toBe("+10D6 against conventional infantry (4 against other units) at range 0");
        expect(beast("horse").getBonusDamageText()).toBe("");
        expect(new InfantryPlatoon().getBonusDamage()).toEqual({ infantryDice: 0, others: 0 });
    });

    it("joins the mount's divisor to the Defensive Battle Rating; Very Large and Monstrous take a Defensive Factor modifier (p.191)", () => {
        // Horse, 21 troopers, 3 MP: target modifier +1, factor 1.1; divisor 1.
        const horseLog = beast("horse").getBattleValueLog().join("\n");
        expect(horseLog).toContain("21 troopers x 1.5 = 31.5");
        expect(horseLog).toContain("Defensive Factor: Target Movement Modifier +1: 1 + 1 / 10 = 1.1");
        const elephant = beast("elephant");
        elephant.setSquads(5);
        const log = elephant.getBattleValueLog().join("\n");
        // 10 troopers x 1.5 x (1 + 2) = 45; 2 MP: modifier 0, factor 1.0 - 0.1 = 0.9; rating 40.5.
        expect(log).toContain("Damage divisors with the Elephant mount: 15 x (1 + 2) = 45");
        expect(log).toContain("Defensive Factor with mount: 1 - 0.1 (Very Large mount) = 0.9");
        expect(log).toContain("Defensive Battle Rating: 45 x 0.9 = 40.5");
        const hipposaurLog = beast("hipposaur").getBattleValueLog().join("\n");
        expect(hipposaurLog).toContain("Defensive Factor with mount: 1 - 0.2 (Monstrous mount) = 0.8");
    });

    it("counts a flying creature's VTOL movement as airborne: +1 on the target modifier (TW p.117, TM p.315)", () => {
        // One squad of 7 on branths, auto-rifles: 6 VTOL MP is +2, airborne +1, factor 1.3; 10.5 x (1 + 1) = 21, x 1.3 = 27.3;
        // (11.13 + 11.13) x 1.12 = 24.93; 52.23, rounded 52 (MegaMek, which multiplies the divisors, gives the file 39).
        const branth = beast("branth");
        branth.setSquads(1);
        expect(branth.getTargetMovementModifier()).toBe(3);
        const log = branth.getBattleValueLog().join("\n");
        expect(log).toContain("Defensive Battle Rating: 21 x 1.3 = 27.3");
        expect(branth.getBattleValue()).toBe(52);
        // A creature on the ground, however fast, has no such bonus: the Tariq's 5 Ground MP is +2.
        expect(beast("tariq").getTargetMovementModifier()).toBe(2);
    });

    it("prices the creatures at 5,000 C-bills for each ton of the whole unit (p.225)", () => {
        const horse = beast("horse");
        const foot = new InfantryPlatoon();
        foot.setPrimaryWeapon("inf-auto-rifle");
        foot.setSquadSize(7);
        foot.setSquads(3);
        expect(horse.getCBillCost()).toBe(foot.getCBillCost()! + 5000 * 15);
        expect(horse.getCBillCostLog().join("\n")).toContain("Beast mounts: 5,000 x 15 tons (the whole unit) = 75000");
    });

    it("converts to Alpha Strike: ground creatures move as foot, VTOL creatures v, the divisor sets the armor (ASC p.95)", () => {
        const elephant = beast("elephant");
        const stats = elephant.getAlphaStrikeStats();
        expect(stats.movement).toBe(4);
        expect(stats.movementCode).toBe("f");
        // 14 troopers / (15 / (1 + 2)) = 2.8, rounded to 3: the rider and mount divisors summed (TO:AUE p.191; NGCFells 2026-11-23).
        expect(stats.armor).toBe(3);
        expect(stats.calcLog.join("\n")).toContain("damage divisor 3");
        expect(beast("branth").getAlphaStrikeStats()).toMatchObject({ movement: 12, movementCode: "v" });
        expect(beast("orca").getAlphaStrikeStats()).toMatchObject({ movement: 10, movementCode: "s" });
        expect(beast("horse").getAlphaStrikeStats().movementCode).toBe("f");
        // Monstrous creatures make no anti-'Mech attacks.
        expect(beast("hipposaur").getAlphaStrikeStats().specialAbilities).not.toContain("AM");
    });

    it("is Advanced, and says what the rules say about the creatures", () => {
        expect(beast("horse").getRequiredRulesLevel()).toBe(3);
        expect(beast("orca").getNotes().join(" ")).toContain("SCUBA");
        expect(beast("hipposaur").getNotes().join(" ")).toContain("surface once every 2 turns");
        expect(beast("orca").getNotes().join(" ")).toContain("surface once every 180 turns");
        expect(beast("branth").getNotes().join(" ")).toContain("High Altitude");
    });

    it("saves and loads the creature, and an old save without one still loads", () => {
        const saved = beast("tariq");
        saved.setSquadSize(5);
        const exported = saved.export();
        expect(exported.motive).toBe("beast");
        expect(exported.mount).toBe("tariq");
        const loaded = new InfantryPlatoon(JSON.stringify(exported));
        expect(loaded.getMount()?.name).toBe("Tariq");
        expect(loaded.getSquadSize()).toBe(5);
        expect(loaded.getImportIssues()).toEqual([]);
        expect(new InfantryPlatoon().export().mount).toBeUndefined();
        const noMount = new InfantryPlatoon(JSON.stringify({ ...exported, mount: undefined }));
        expect(noMount.getMount()?.name).toBe("Horse");
        expect(noMount.getImportIssues().join(" ")).toContain("no creature");
        const odd = new InfantryPlatoon(JSON.stringify({ ...exported, mount: "dragon" }));
        expect(odd.getImportIssues().join(" ")).toContain("Unknown creature");
        // A foot platoon that carries a stray creature loses it.
        const stray = new InfantryPlatoon(JSON.stringify({ ...new InfantryPlatoon().export(), mount: "horse" }));
        expect(stray.getMount()).toBeNull();
        expect(normalizeInfantryPlatoonExport(exported).platoon?.mount).toBe("tariq");
    });

    it("drops the creature when the platoon changes motive", () => {
        const platoon = beast("elephant");
        expect(platoon.setMotive("foot")).toBe(true);
        expect(platoon.getMount()).toBeNull();
        expect(platoon.getMP()).toBe(1);
        expect(platoon.setMotive("beast")).toBe(true);
        expect(platoon.getMount()?.name).toBe("Horse");
    });
});

describe("Specialized infantry, VTOL and SCUBA infantry and XCT troops (TO:AUE pp.135-136, 152-153, 162-163, 193, 225)", () => {
    const veteran = (platoon: InfantryPlatoon): InfantryPlatoon => { platoon.setGunnery(3); platoon.setAntiMechSkill(4); return platoon; };
    const make = (motive: string = "foot", specialties: string[] = []): InfantryPlatoon => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setMotive(motive)).toBe(true);
        for (const tag of specialties) expect(platoon.setSpecialty(tag, true)).toBe(true);
        return veteran(platoon);
    };
    /** The sum the plain platoon's steps round: Defensive + Offensive Battle Rating. */
    const rawBv = (platoon: InfantryPlatoon): number => platoon.getBattleValueBreakdown("total-warfare").steps.find((entry) => entry.id === "ci.bv2.final.sum")!.value!;
    const trooperCost = 2000 * Math.sqrt(findInfantryWeapon("inf-auto-rifle")!.cost!);

    it("holds the Specialized Infantry Types Table as printed (p.153) with the cost lines (p.225) and the type modifiers (p.193)", () => {
        const by = (tag: string) => INFANTRY_SPECIALTIES.find((item) => item.tag === tag)!;
        expect(INFANTRY_SPECIALTIES.map((item) => item.name)).toEqual(["Combat Engineers", "Marines", "Mountain Troops", "Paratroops", "TAG Troops", "Paramedics"]);
        expect(by("engineers")).toMatchObject({ maxSquadSize: 10, maxPlatoonSize: 20, maxSquads: 2, maxSecondary: 0, addedTons: 0.1, costMultiplier: 5, bvModifier: 0.1, ratings: "C/A-B-A" });
        expect(by("marines")).toMatchObject({ maxSquadSize: 10, maxPlatoonSize: 30, maxSquads: 4, maxSecondary: null, addedTons: 0, costMultiplier: 3, bvModifier: 0.3, ratings: "C/A-A-A" });
        expect(by("mountain")).toMatchObject({ maxPlatoonSize: 20, maxSquads: 2, maxSecondary: 1, footOnly: true, costMultiplier: 2, bvModifier: 0.2, prohibitedTerrain: "Water (Any)" });
        expect(by("paratroops")).toMatchObject({ maxPlatoonSize: 30, maxSquads: 3, maxSecondary: 1, footOnly: true, addedTons: 0.05, costMultiplier: 3, bvModifier: 0.1 });
        expect(by("paramedics")).toMatchObject({ addedTons: 0.05, ratings: "B/C-C-C" });
        expect(by("tag")).toMatchObject({ addedTons: 0, bvModifier: 0 });
        expect(INFANTRY_ENGINEER_TASKS.map((task) => task.name)).toEqual(["Bridge-Building", "Demolition", "Firefighting", "Minesweeping", "Sensor", "Trench/Fieldworks"]);
        const motive = (tag: string) => INFANTRY_MOTIVE_TYPES.find((item) => item.tag === tag)!;
        expect(motive("microlite")).toMatchObject({ maxSquadSize: 2, maxSquads: 4, mp: 6, moveType: "VTOL", weightPerTrooper: 1.5, costMultiplier: 4, maxSecondary: 0, mechanized: true });
        expect(motive("microcopter")).toMatchObject({ maxSquadSize: 4, maxSquads: 4, mp: 5, weightPerTrooper: 2, costMultiplier: 4.5, maxSecondary: 1, supportAnyMPLoss: 1 });
        expect(motive("scuba")).toMatchObject({ maxSquadSize: 10, maxPlatoonSize: 30, maxSquads: 4, maxSecondary: 0, mp: 1, prohibitedTerrain: "Water (Depth 3+)", costMultiplier: 2 });
        expect(motive("scuba-motorized")).toMatchObject({ maxSquadSize: 6, maxPlatoonSize: 12, maxSquads: 2, maxSecondary: 1, mp: 2, costMultiplier: 2.5 });
        expect(motive("scuba-mech")).toMatchObject({ maxSquadSize: 5, maxPlatoonSize: 20, maxSquads: 4, maxSecondary: 2, mp: 3, prohibitedTerrain: "Depth 0 and non-water hexes" });
        expect(INFANTRY_MOTIVE_TYPES.map((item) => item.tag)).toEqual(["foot", "motorized", "jump", "mech-hover", "mech-tracked", "mech-wheeled", "beast", "microlite", "microcopter", "scuba", "scuba-motorized", "scuba-mech"]);
    });

    it("applies the most restrictive limits of the motive and every specialty, and sets the weight by the book's example (0.21 + 0 + 0.1 = 0.31)", () => {
        const engineers = make("foot", ["engineers"]);
        expect([engineers.getMaxSquadSize(), engineers.getMaxPlatoonSize(), engineers.getMaxSquads(), engineers.getSecondarySlotsPerSquad()]).toEqual([10, 20, 2, 0]);
        // 7 x 4 = 28 troopers are over 20: two sub-platoons of 14, and 4 squads are 2 each.
        expect([engineers.getSubPlatoons(), engineers.getIssues()]).toEqual([[14, 14], []]);
        const oneBig = make("foot", ["engineers"]);
        oneBig.setSquadSize(6);
        oneBig.setSquads(3);
        expect(oneBig.getSubPlatoons()).toEqual([18]);
        expect(oneBig.getIssues().join(" ")).toContain("At most 2 squads are allowed");
        const marineEngineer = make("motorized", ["marines", "engineers"]);
        marineEngineer.setAntiMechKit(true);
        expect(marineEngineer.getWeightPerTrooper()).toBeCloseTo(0.31, 6);
        expect(marineEngineer.getMaxPlatoonSize()).toBe(20);
        expect(marineEngineer.getMaxSquads()).toBe(2);
        const mountainParatroops = make("foot", ["mountain", "paratroops"]);
        expect([mountainParatroops.getMaxPlatoonSize(), mountainParatroops.getMaxSquads(), mountainParatroops.getSecondarySlotsPerSquad()]).toEqual([20, 2, 1]);
        expect(mountainParatroops.getWeightPerTrooper()).toBeCloseTo(0.085 + 0.05, 6);
        expect(mountainParatroops.getProhibitedTerrain()).toBe("Water (Any)");
        // A squad size the specialty or the motive cannot hold is cut back.
        const small = make("scuba-motorized", ["marines"]);
        expect(small.getMaxSquadSize()).toBe(6);
        expect(small.getFormationSizes()).toEqual([6, 2]);
    });

    it("keeps Mountain Troops and Paratroops on the Foot motive (1 Ground MP) and Combat Engineers and Marines off beasts", () => {
        const motorized = new InfantryPlatoon();
        motorized.setMotive("motorized");
        expect(motorized.setSpecialty("mountain", true)).toBe(false);
        expect(motorized.setSpecialty("paratroops", true)).toBe(false);
        expect(motorized.setSpecialty("marines", true)).toBe(true);
        const foot = make("foot", ["mountain", "paratroops", "engineers"]);
        expect(foot.getMP()).toBe(1);
        foot.setMotive("jump");
        expect(foot.hasSpecialty("mountain")).toBe(false);
        expect(foot.hasSpecialty("engineers")).toBe(true);
        const beast = new InfantryPlatoon();
        beast.setMount("horse");
        expect(beast.setSpecialty("marines", true)).toBe(false);
        expect(beast.setSpecialty("engineers", true)).toBe(false);
        expect(beast.setXCT("liquid")).toBe(true);
        const scuba = make("scuba", ["mountain"]);
        expect(scuba.hasSpecialty("mountain")).toBe(true);
        expect(scuba.getProhibitedTerrain()).toBe("Water (Any)");
    });

    it("asks Veteran or better of every specialist, and of nobody else", () => {
        const platoon = new InfantryPlatoon();
        expect(platoon.getIssues().join(" ")).not.toContain("Veteran");
        platoon.setSpecialty("marines", true);
        expect(platoon.getIssues().join(" ")).toContain("Veteran or better");
        platoon.setGunnery(3);
        expect(platoon.getIssues().join(" ")).not.toContain("Veteran");
        platoon.setAntiMechKit(true);
        platoon.setAntiMechSkill(5);
        expect(platoon.getIssues().join(" ")).toContain("Anti-'Mech 4");
        platoon.setAntiMechSkill(4);
        expect(platoon.getIssues()).toEqual([]);
        const scuba = new InfantryPlatoon();
        scuba.setMotive("scuba");
        expect(scuba.getIssues().join(" ")).toContain("Veteran or better");
        expect(scuba.getRequiredRulesLevel()).toBe(3);
        const microlite = new InfantryPlatoon();
        microlite.setMotive("microlite");
        expect(microlite.getIssues().join(" ")).not.toContain("Veteran");
        expect(microlite.getRequiredRulesLevel()).toBe(3);
        expect(new InfantryPlatoon().getRequiredRulesLevel()).toBe(2);
    });

    it("lets paramedics replace secondary weapon troopers: no weapon, no damage, 0.05 t each, 0.375 of the total added last", () => {
        const platoon = veteran(new InfantryPlatoon());
        expect(platoon.setSecondaryWeapon("inf-machine-gun-support")).toBe(true);
        platoon.setSecondaryPerSquad(2);
        expect(platoon.setParamedicsPerSquad(1)).toBe(true);
        // The 2 slots a squad hold 1 paramedic and 1 machine gun; 28 troopers: 4 medics, 4 gunners, 20 riflemen.
        expect([platoon.getSecondaryPerSquad(), platoon.getParamedicCount(), platoon.getPrimaryCount()]).toEqual([1, 4, 20]);
        expect(platoon.getWeight()).toBe(Math.ceil((28 * 0.085 + 4 * 0.05) * 2 - 1e-9) / 2);
        expect(platoon.hasSpecialty("paramedics")).toBe(true);
        expect(platoon.getRequiredRulesLevel()).toBe(3);
        // Two a squad take both slots, and the machine guns give way.
        expect(platoon.setParamedicsPerSquad(2)).toBe(true);
        expect(platoon.getSecondaryWeapon()).toBeNull();
        expect(platoon.setParamedicsPerSquad(3)).toBe(false);
        expect(platoon.getParamedicsPerSquad()).toBe(2);
        // Cost: the weapon cost of the 20 who carry one, then 0.375 of that total for each of the 8 medics, last.
        expect(platoon.getPrimaryCount()).toBe(20);
        expect(platoon.getCBillCost()).toBe(Math.floor(20 * trooperCost * (1 + 8 * 0.375) + 1e-6));
        expect(platoon.getCBillCostLog().join("\n")).toContain("8 paramedics: 8 x 0.375 x");
        // No damage from the medics: 20 riflemen.
        expect(platoon.getTotalDamage()).toBe(Math.floor(20 * 0.52 + 0.5 + 1e-9));
        // Not on a platoon with no secondary slot.
        const engineers = make("foot", ["engineers"]);
        expect(engineers.setSpecialty("paramedics", true)).toBe(false);
        expect(engineers.getParamedicsPerSquad()).toBe(0);
    });

    it("holds paramedics and TAG troopers to the squad and the secondary slots when either shrinks", () => {
        const platoon = veteran(new InfantryPlatoon());
        platoon.setParamedicsPerSquad(2);
        platoon.setSquadSize(1);
        expect(platoon.getParamedicsPerSquad()).toBe(1);
        const jump = veteran(new InfantryPlatoon());
        jump.setMotive("scuba-motorized");
        jump.setTagTroopersPerSquad(1);
        expect(jump.getTagTroopersPerSquad()).toBe(1);
        // Motorized SCUBA have 1 slot: a second TAG trooper does not fit, and engineers (none) drop the medics.
        expect(jump.setTagTroopersPerSquad(2)).toBe(false);
        expect(jump.getSecondarySlotsPerSquad()).toBe(1);
        const medics = veteran(new InfantryPlatoon());
        medics.setParamedicsPerSquad(1);
        expect(medics.setSpecialty("engineers", true)).toBe(true);
        expect(medics.getParamedicsPerSquad()).toBe(0);
    });

    it("tends 5 wounded to a paramedic, and loses medics with the platoon", () => {
        const platoon = veteran(new InfantryPlatoon());
        platoon.setParamedicsPerSquad(1);
        expect(platoon.getParamedicCapacity()).toBe(20);
        expect(platoon.tendWounded(30)[0]).toContain("tend 20 of 30 wounded");
        platoon.setLineTroopers(0, 14);
        expect(platoon.getActiveParamedics()).toBe(2);
        expect(platoon.getParamedicCapacity()).toBe(10);
        expect(new InfantryPlatoon().tendWounded(3)).toEqual(["The platoon has no paramedics"]);
    });

    it("replaces secondary weapons with TAG troops that work at 2 a squad, shoot at 3/6/9 and do not slow the platoon", () => {
        const platoon = veteran(new InfantryPlatoon());
        expect(platoon.setTagTroopersPerSquad(1)).toBe(true);
        expect(platoon.isTagWorking()).toBe(false);
        expect(platoon.fireTag()[0]).toContain("at least 2 troopers a squad");
        expect(platoon.getAlphaStrikeStats().specialAbilities).not.toContain("TAG");
        expect(platoon.setTagTroopersPerSquad(2)).toBe(true);
        expect(platoon.fireTag()[0]).toContain("3/6/9");
        expect([platoon.getTagTrooperCount(), platoon.getPrimaryCount()]).toEqual([8, 20]);
        expect(platoon.getAlphaStrikeStats().specialAbilities).toContain("TAG");
        expect(platoon.getAlphaStrikeStats().calcLog.join("\n")).toContain("TAG: + 0.5");
        // 2 together: no paramedics beside two TAG troopers.
        expect(platoon.setParamedicsPerSquad(1)).toBe(false);
        expect(platoon.getParamedicsPerSquad()).toBe(0);
        // Support machine guns (2 a squad) make a foot platoon move or fire; TAG troopers in their place do not.
        const guns = veteran(new InfantryPlatoon());
        guns.setSecondaryWeapon("inf-machine-gun-support");
        guns.setSecondaryPerSquad(2);
        expect(guns.isMoveOrFire()).toBe(true);
        guns.setTagTroopersPerSquad(2);
        expect([guns.isMoveOrFire(), guns.getMP(), guns.getSecondaryWeapon()]).toEqual([false, 1, null]);
        // Priced as a secondary weapon trooper with a TAG (the table has no row), provisional.
        expect(platoon.getCBillCostLog().join("\n")).toContain("8 TAG troopers x 2,000 x square root of 50,000");
        expect(platoon.getCBillCost()).toBe(Math.floor(20 * trooperCost + 8 * 2000 * Math.sqrt(50000) + 1e-6));
    });

    it("counts the unit type modifiers in the Battle Value: +0.1, +0.3, +0.2, +0.1, SCUBA +0.1, XCT +0.1 (p.193)", () => {
        const plain = new InfantryPlatoon();
        const raw = rawBv(plain);
        const cases: [string[], number][] = [[["engineers"], 1.1], [["marines"], 1.3], [["mountain"], 1.2], [["paratroops"], 1.1], [["marines", "engineers"], 1.4], [["mountain", "paratroops"], 1.3]];
        for (const [specialties, modifier] of cases) {
            const platoon = make("foot", specialties);
            expect(platoon.getTypeModifier()).toBeCloseTo(modifier, 6);
            // The same weapons and movement as the plain platoon: its raw sum, rounded after the multiplier.
            expect(platoon.getBattleValue()).toBe(Math.floor(raw * modifier + 0.5 + 1e-9));
            expect(platoon.getBattleValueLog().join("\n")).toContain(`= ${formatCalcNumber(modifier)}; `);
        }
        const scuba = make("scuba");
        expect(scuba.getTypeModifier()).toBeCloseTo(1.1, 6);
        expect(scuba.getBattleValue()).toBe(Math.floor(raw * 1.1 + 0.5 + 1e-9));
        const xct = make("foot");
        expect(xct.setXCT("vacuum")).toBe(true);
        expect(xct.setArmor("inf-armor-spacesuit")).toBe(true);
        expect(xct.getTypeModifier()).toBeCloseTo(1.1, 6);
        expect(xct.getBattleValueLog().join("\n")).toContain("0.1 (XCT)");
        expect(plain.getBattleValueLog().join("\n")).not.toContain("Unit type modifier");
        expect(plain.getTypeModifier()).toBe(1);
    });

    it("costs the specialties by the Construction Data (p.225): x5, x3, x2, x3, SCUBA x2 and x2.5, XCT x1.5", () => {
        const base = 28 * trooperCost;
        const cost = (platoon: InfantryPlatoon): number => platoon.getCBillCost()!;
        expect(cost(make("foot", ["engineers"]))).toBe(Math.floor(base * 5 + 1e-6));
        expect(cost(make("foot", ["marines"]))).toBe(Math.floor(base * 3 + 1e-6));
        expect(cost(make("foot", ["mountain"]))).toBe(Math.floor(base * 2 + 1e-6));
        expect(cost(make("foot", ["paratroops"]))).toBe(Math.floor(base * 3 + 1e-6));
        expect(cost(make("foot", ["marines", "engineers"]))).toBe(Math.floor(base * 15 + 1e-6));
        expect(cost(make("motorized", ["marines"]))).toBe(Math.floor(base * 1.6 * 3 + 1e-6));
        expect(cost(make("scuba"))).toBe(Math.floor(base * 2 + 1e-6));
        const motorizedScuba = make("scuba-motorized");
        expect(cost(motorizedScuba)).toBe(Math.floor(motorizedScuba.getTroopers() * trooperCost * 2.5 + 1e-6));
        const xct = make("foot");
        xct.setXCT("hot");
        xct.setArmor("inf-armor-heatsuit");
        expect(cost(xct)).toBe(Math.floor((base + xct.getTroopers() * xct.getArmor()!.cost) * 1.5 + 1e-6));
        expect(xct.getCBillCostLog().join("\n")).toContain("XCT troops: x 1.5");
        expect(make("foot", ["marines"]).getCBillCostLog().join("\n")).toContain("Marines: x 3 (the total unit cost)");
        // The Construction Data has no Mechanized SCUBA row: the mechanized multiplier, provisional.
        expect(make("scuba-mech").getCBillCostLog().join("\n")).toContain("provisional");
    });

    it("builds Microlite and Micro-copter VTOL platoons: at most 4 squads, 2 or 4 a squad, weight, MP, no anti-'Mech (pp.135-136, 152)", () => {
        const microlite = make("microlite");
        expect([microlite.getSquadSize(), microlite.getSquads(), microlite.getTroopers()]).toEqual([2, 4, 8]);
        expect(microlite.getMP()).toBe(6);
        expect(microlite.getMovementText()).toBe("6 (VTOL), 1 (Ground)");
        expect(microlite.setSecondaryWeapon("inf-machine-gun-support")).toBe(false);
        expect(microlite.isMechanized()).toBe(true);
        expect(microlite.canMakeAntiMechAttacks()).toBe(false);
        expect(microlite.setAntiMechKit(true)).toBe(false);
        expect(microlite.getWeightPerTrooper()).toBe(1.5);
        expect(microlite.getWeight()).toBe(12);
        // Never broken below a squad: 2 troopers of 1.5 t.
        expect(microlite.getMinimumBreakdownWeight()).toBe(3);
        microlite.setSquadSize(3);
        expect(microlite.getSquadSize()).toBe(2);
        const plainMicrolite = make("microlite");
        expect(plainMicrolite.getCBillCost()).toBe(Math.floor(8 * trooperCost * 4 + 1e-6));
        expect(plainMicrolite.getBattleValueLog().join("\n")).toContain("Target Movement Modifier +3");
        microlite.setSquads(5);
        expect(microlite.getIssues().join(" ")).toContain("At most 4 squads");
        expect(microlite.getRequiredRulesLevel()).toBe(3);
        const copter = make("microcopter");
        expect([copter.getSquadSize(), copter.getSquads(), copter.getTroopers(), copter.getMP()]).toEqual([4, 4, 16, 5]);
        expect(copter.getWeightPerTrooper()).toBe(2);
        expect(copter.getMinimumBreakdownWeight()).toBe(8);
        expect(copter.getCBillCost()).toBe(Math.floor(16 * trooperCost * 4.5 + 1e-6));
        // 0 or 1 support weapon a squad; any support weapon costs 1 VTOL MP, and a second is not allowed.
        expect(copter.setSecondaryWeapon("inf-machine-gun-support")).toBe(true);
        expect(copter.getMP()).toBe(4);
        copter.setSecondaryPerSquad(2);
        expect(copter.getSecondaryPerSquad()).toBe(1);
        expect(copter.getMovementText()).toBe("4 (VTOL), 1 (Ground)");
        expect(plainMicrolite.getNotes().join(" ")).toContain("must enter at least 1 hex a turn");
        expect(make("microcopter").getNotes().join(" ")).toContain("hover in flight at 0 MP");
    });

    it("builds the three SCUBA types: 10/30/4 and 1 MP, 6/12/2 and 2 MP, 5/20/4 and 3 MP, with the added weights (p.153)", () => {
        const standard = make("scuba");
        expect([standard.getMaxSquadSize(), standard.getMaxPlatoonSize(), standard.getMaxSquads(), standard.getSecondarySlotsPerSquad()]).toEqual([10, 30, 4, 0]);
        expect(standard.getMovementText()).toBe("1 (Ground), 1 (Submarine)");
        expect(standard.getProhibitedTerrain()).toBe("Water (Depth 3+)");
        // 0.085 t foot trooper + 0.05 t; with the kit's 0.015 t that is the table's 0.1 + 0.05.
        expect(standard.getWeightPerTrooper()).toBeCloseTo(0.135, 6);
        standard.setAntiMechKit(true);
        expect(standard.getWeightPerTrooper()).toBeCloseTo(0.15, 6);
        expect(standard.setSecondaryWeapon("inf-machine-gun-support")).toBe(false);
        const motorized = make("scuba-motorized");
        expect([motorized.getSquadSize(), motorized.getSquads(), motorized.getMP(), motorized.getMovementText()]).toEqual([6, 2, 2, "1 (Ground), 2 (Submarine)"]);
        motorized.setAntiMechKit(true);
        expect(motorized.getWeightPerTrooper()).toBeCloseTo(0.2, 6);
        expect(motorized.setSecondaryWeapon("inf-machine-gun-support")).toBe(true);
        motorized.setSecondaryPerSquad(2);
        expect(motorized.getSecondaryPerSquad()).toBe(1);
        const mech = make("scuba-mech");
        expect([mech.getSquadSize(), mech.getSquads(), mech.getTroopers(), mech.getMP(), mech.getMovementText()]).toEqual([5, 4, 20, 3, "3 (Submarine)"]);
        expect(mech.getWeightPerTrooper()).toBe(1);
        expect(mech.isMechanized()).toBe(true);
        expect(mech.canMakeAntiMechAttacks()).toBe(false);
        mech.setSquads(5);
        expect(mech.getIssues().join(" ")).toContain("at most 20 troopers");
        expect(standard.getNotes().join(" ")).toContain("half their range underwater");
        expect(mech.getNotes().join(" ")).toContain("submarine vehicles");
    });

    it("sets XCT troops: one environment, the armor kits it needs, the effects, no beast or VTOL platoon for vacuum (pp.162-163)", () => {
        const names = (platoon: InfantryPlatoon): string[] => platoon.getXCTArmorOptions().map((armor) => armor.name);
        const platoon = make("foot");
        expect(INFANTRY_XCT_ENVIRONMENTS.map((item) => item.tag)).toEqual(["cold", "hot", "liquid", "vacuum", "toxic", "tainted"]);
        expect(platoon.setXCT("lava")).toBe(false);
        expect(platoon.setXCT("cold")).toBe(true);
        expect(names(platoon)).toEqual(expect.arrayContaining(["Snowsuit", "Environment Suit, Hostile", "Environment Suit, Marine", "Spacesuit", "Spacesuit, Combat"]));
        expect(names(platoon)).not.toContain("Heatsuit");
        // No armor, or the wrong armor, is an issue; a matching kit clears it.
        expect(platoon.getIssues().join(" ")).toContain("XCT troops for extreme temperatures (cold) must wear one of");
        platoon.setArmor("inf-armor-heatsuit");
        expect(platoon.getXCTProblem()).not.toBeNull();
        platoon.setArmor("inf-armor-snowsuit");
        expect(platoon.getXCTProblem()).toBeNull();
        expect(platoon.getIssues()).toEqual([]);
        platoon.setXCT("hot");
        expect(names(platoon)).toEqual(expect.arrayContaining(["MechWarrior Cooling Suit", "MechWarrior Cooling Vest (Only)", "Heatsuit", "Spacesuit"]));
        platoon.setXCT("liquid");
        expect(names(platoon)).toEqual(expect.arrayContaining(["Environment Suit, Light", "Engineering Suit"]));
        platoon.setXCT("tainted");
        expect(names(platoon)).toContain("Environment Suit, Light");
        platoon.setXCT("toxic");
        expect(names(platoon)).not.toContain("Environment Suit, Light");
        // The effects: liquid / 3 rounded down to at least 1, bad atmosphere doubled, temperatures nothing.
        platoon.setXCT("liquid");
        expect([1, 2, 3, 10].map((damage) => platoon.getXCTEnvironmentDamage(damage).damage)).toEqual([1, 1, 1, 3]);
        platoon.setXCT("vacuum");
        expect(platoon.getXCTEnvironmentDamage(4).damage).toBe(8);
        platoon.setXCT("cold");
        expect(platoon.getXCTEnvironmentDamage(4).damage).toBe(4);
        // Not for beasts or mechanized VTOL in vacuum.
        const beast = new InfantryPlatoon();
        beast.setMount("elephant");
        beast.setXCT("vacuum");
        beast.setArmor("inf-armor-spacesuit");
        expect(beast.getIssues().join(" ")).toContain("may not be beast-mounted or mechanized VTOL");
        beast.setXCT("toxic");
        expect(beast.getXCTProblem()).toBeNull();
        const copter = make("microcopter");
        copter.setXCT("vacuum");
        copter.setArmor("inf-armor-environment-suit-marine");
        expect(copter.getXCTProblem()).toContain("mechanized VTOL");
        expect(platoon.getRequiredRulesLevel()).toBe(3);
        expect(platoon.getNomenclature()).toContain("XCT");
    });

    it("saves and loads the specialties, tasks, medics, TAG troopers and XCT, and reads an older save as having none", () => {
        const platoon = make("foot", ["engineers"]);
        platoon.setSpecialty("marines", true);
        expect(platoon.setEngineerTasks(["trench", "bridge"])).toBe(true);
        platoon.setXCT("vacuum");
        platoon.setArmor("inf-armor-environment-suit-marine");
        const saved = platoon.export();
        expect(saved).toMatchObject({ specialties: ["engineers", "marines"], engineerTasks: ["bridge", "trench"], xct: "vacuum" });
        const loaded = new InfantryPlatoon(JSON.stringify(saved));
        expect(loaded.getImportIssues()).toEqual([]);
        expect([loaded.getSpecialties(), loaded.getEngineerTasks(), loaded.getXCT()]).toEqual([["engineers", "marines"], ["bridge", "trench"], "vacuum"]);
        expect(loaded.getBattleValue()).toBe(platoon.getBattleValue());
        expect(loaded.getCBillCost()).toBe(platoon.getCBillCost());
        const medics = veteran(new InfantryPlatoon());
        medics.setParamedicsPerSquad(1);
        medics.setTagTroopersPerSquad(1);
        const reloaded = new InfantryPlatoon(JSON.stringify(medics.export()));
        expect([reloaded.getParamedicsPerSquad(), reloaded.getTagTroopersPerSquad(), reloaded.getImportIssues()]).toEqual([1, 1, []]);
        const motorizedScuba = make("scuba-motorized");
        expect(new InfantryPlatoon(JSON.stringify(motorizedScuba.export())).getMotive().tag).toBe("scuba-motorized");
        // An older save has none of it; the new fields are absent on a plain platoon.
        const plain = new InfantryPlatoon().export();
        for (const field of ["specialties", "engineerTasks", "paramedics", "tagTroopers", "xct"]) expect(field in plain).toBe(false);
        const old = new InfantryPlatoon(JSON.stringify(plain));
        expect([old.getSpecialties(), old.getXCT(), old.getImportIssues()]).toEqual([[], null, []]);
        // Strays are dropped and reported; a specialty the motive cannot have goes.
        const odd = new InfantryPlatoon(JSON.stringify({ ...plain, specialties: ["marines", "ninjas", "mountain"], xct: "lava", motive: "motorized", engineerTasks: ["trench"] }));
        expect(odd.getSpecialties()).toEqual(["marines"]);
        expect(odd.getImportIssues().join(" ")).toContain("Unknown specialty 'ninjas'");
        expect(odd.getImportIssues().join(" ")).toContain("Mountain Troops cannot go on this platoon");
        expect(odd.getImportIssues().join(" ")).toContain("Unknown XCT environment 'lava'");
        expect(odd.getImportIssues().join(" ")).toContain("Engineer tasks need the Combat Engineers specialty");
        expect(normalizeInfantryPlatoonExport(saved).platoon?.specialties).toEqual(["engineers", "marines"]);
    });

    it("plays Combat Engineers: a designated task, bridge turns with damage, charges, firefighting, minesweeping, sensors and trenches (p.152)", () => {
        const engineers = make("foot", ["engineers"]);
        expect(engineers.getAvailableEngineerTasks().length).toBe(6);
        expect(engineers.setEngineerTask("sensor")).toBe(true);
        expect(engineers.deploySensor()[0]).toContain("Remote Sensor 1 of 8");
        expect(engineers.setEngineerTasks(["bridge", "demolition"])).toBe(true);
        expect(engineers.setEngineerTask("trench")).toBe(false);
        expect(engineers.setEngineerTask("bridge")).toBe(true);
        for (let turn = 0; turn < 5; turn++) engineers.workEngineers();
        expect(engineers.completeBridge("light")[0]).toContain("needs 6 turns");
        // A damaged turn adds one.
        expect(engineers.workEngineers(true)[0]).toContain("turn 6 of 7");
        expect(engineers.workEngineers()[1]).toContain("ready to raise");
        expect(engineers.completeBridge("medium", true)[0]).toBe("A medium bridge is raised in one hex: CF 80 (doubled over water); 0 of 2 bridge units left");
        expect(engineers.workEngineers()[0]).toContain("Both bridge units");
        // Demolition: turns (6 at most) x the damage of an SRM platoon of the same numbers.
        engineers.setEngineerTask("demolition");
        const perTurn = Math.floor(findInfantryWeapon("inf-srm-launcher-standard-two-shot")!.damage * 28 + 0.5);
        for (let turn = 0; turn < 8; turn++) engineers.workEngineers();
        expect(engineers.getDemolitionDamage()).toBe(6 * perTurn);
        expect(engineers.detonateCharges()[0]).toContain(`${6 * perTurn} damage`);
        expect(engineers.getDemolitionDamage()).toBe(0);
        // The state is saved and loaded.
        engineers.setEngineerTask("bridge");
        expect(new InfantryPlatoon(JSON.stringify(engineers.export())).getEngineerProgress()?.task).toBe("bridge");

        const fire = make("foot", ["engineers"]);
        fire.setEngineerTask("firefighting");
        expect(fire.resolveFirefight(7)[0]).toContain("against 8+: the fire burns on");
        expect(fire.resolveFirefight(7)[0]).toContain("against 7+: the fire is out");
        fire.resolveFirefight(2);
        // 1 more off for each other platoon, -2 to the roll for an Inferno, never under 3.
        expect(fire.resolveFirefight(9, { inferno: true })[0]).toContain("= 7 against 7+");
        expect(fire.resolveFirefight(3, { extraPlatoons: 9 })[0]).toContain("against 3+: the fire is out");
        const mines = make("foot", ["engineers"]);
        mines.setEngineerTask("minesweeping");
        expect([9, 3, 6].map((roll) => mines.resolveMinesweeping(roll)[0])).toEqual(["Rolled 9: the minefield is cleared", "Rolled 3: the minefield detonates", "Rolled 6: the minesweepers fail and the minefield stays active"]);
        const trench = make("foot", ["engineers"]);
        trench.setEngineerTask("trench");
        trench.workEngineers();
        trench.workEngineers(true);
        expect(trench.workEngineers()[0]).toContain("turn 3 of 4");
        expect(trench.workEngineers()[1]).toContain("fortified hex is dug");
        expect(new InfantryPlatoon().workEngineers()).toEqual(["The platoon is not Combat Engineers"]);
    });

    it("drops paratroops: 2D6 a squad, 3 or less is 1 casualty", () => {
        const paratroops = make("foot", ["paratroops"]);
        paratroops.setSquads(3);
        const lines = paratroops.resolveParatroopDrop([3, 7, 2]);
        expect(lines[0]).toContain("1 casualty");
        expect(lines[1]).toContain("lands safely");
        expect(lines.at(-1)).toBe(`${paratroops.getTroopers() - 2} of ${paratroops.getTroopers()} troopers on the ground`);
        expect(paratroops.getCurrentTroopers()).toBe(paratroops.getTroopers() - 2);
        expect(new InfantryPlatoon().resolveParatroopDrop([2])).toEqual(["The platoon is not Paratroops"]);
    });

    it("converts the specialties to Alpha Strike: MTN, PAR, TAG, TRN, MSW, FF, UMU, and v for VTOL (ASC)", () => {
        expect(make("foot", ["mountain"]).getAlphaStrikeStats().specialAbilities).toContain("MTN");
        expect(make("foot", ["paratroops"]).getAlphaStrikeStats().specialAbilities).toContain("PAR");
        const engineers = make("foot", ["engineers"]);
        // Every task open: no task to convert. Tasks chosen: their specials; bridge, demolition and sensor have none printed.
        expect(engineers.getAlphaStrikeStats().specialAbilities.filter((code) => ["TRN", "MSW", "FF"].includes(code))).toEqual([]);
        engineers.setEngineerTasks(["bridge", "firefighting", "minesweeping", "trench"]);
        expect(engineers.getAlphaStrikeStats().specialAbilities).toEqual(expect.arrayContaining(["FF", "MSW", "TRN"]));
        expect(make("foot", ["marines"]).getAlphaStrikeStats().specialAbilities).not.toContain("MTN");
        const motorized = make("scuba-motorized");
        const stats = motorized.getAlphaStrikeStats();
        expect([stats.movement, stats.movementCode, stats.secondaryMovement]).toEqual([2, "f", { movement: 4, code: "s" }]);
        expect(stats.specialAbilities).toContain("UMU");
        expect(motorized.getAlphaStrikeUnit().move.map((move) => `${move.move}${move.type}`)).toEqual(["2f", "4s"]);
        const standard = make("scuba").getAlphaStrikeStats();
        expect([standard.movement, standard.secondaryMovement?.movement]).toEqual([2, 2]);
        const mech = make("scuba-mech").getAlphaStrikeStats();
        expect([mech.movement, mech.movementCode, mech.secondaryMovement, mech.specialAbilities.includes("UMU")]).toEqual([6, "s", undefined, false]);
        expect(make("microlite").getAlphaStrikeStats()).toMatchObject({ movement: 12, movementCode: "v" });
        expect(make("microcopter").getAlphaStrikeStats()).toMatchObject({ movement: 10, movementCode: "v" });
        expect(make("microlite").getAlphaStrikeStats().specialAbilities).not.toContain("AM");
    });

    it("tells a platoon's play notes and names it by its specialties", () => {
        const platoon = make("foot", ["marines", "mountain"]);
        platoon.setParamedicsPerSquad(1);
        const notes = platoon.getNotes().join(" ");
        expect(notes).toContain("Specialized infantry: Veteran or better only");
        expect(notes).toContain("Marines suffer no combat penalties");
        expect(notes).toContain("Mountain Troops are immune to Thin atmospheres");
        expect(notes).toContain("4 paramedics");
        expect(platoon.getNomenclature()).toBe("Foot Marines Mountain Troops Paramedics Auto-Rifle Infantry");
    });
});

// Cybernetic and prosthetic augmentation (Interstellar Operations: Alternate Eras pp.70-79, 179, 184-185, 191, 194-195, 217).
describe("augmentation (IO:AE)", () => {
    const foot = (...tags: string[]): InfantryPlatoon => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setAugmentations(tags)).toBe(true);
        return platoon;
    };
    const roundNormally = (value: number): number => Math.floor(value + 0.5 + 1e-9);

    it("holds the implants conventional infantry has rules for, with the cost table's prices and the tech table's data", () => {
        const byTag = (tag: string) => findInfantryAugmentation(tag)!;
        expect(infantryAugmentations).toHaveLength(24);
        expect(byTag("aug-dermal-armor")).toMatchObject({ cost: 1500000, introduced: 2950, rulesLevel: 4, page: 74, megamekKey: "dermal_armor" });
        expect(byTag("aug-pain-shunt")).toMatchObject({ cost: 500000, introduced: "ES", rulesLevel: 3 });
        expect(byTag("aug-tsm").cost).toBe(2500000);
        expect(byTag("aug-comm")).toMatchObject({ cost: 8000, scope: "quarter" });
        expect(byTag("aug-tcp")).toMatchObject({ cost: 3000000, scope: "commander", extinct: 3085 });
        expect(byTag("aug-suicide").cost).toBe(250);
        expect(findInfantryAugmentationByKey("tsm_implant")?.tag).toBe("aug-tsm");
        // The neural interfaces are for other unit types.
        for (const key of ["vdni", "bvdni", "proto_dni", "ei_implant"]) expect(findInfantryAugmentationByKey(key)).toBeNull();
        expect(findInfantryProstheticItem("Rumal/Garrote")).toMatchObject({ damage: 0.14, battleValue: 0.14, infantryOnly: true });
        expect(findInfantryProstheticItem("SMG")?.tag).toBe("smg");
    });

    it("adds to the damage divisor as the book says: dermal armor +1, triple-strength 0.5 with no armor, camouflage never 0.5 (pp.74-75)", () => {
        expect(new InfantryPlatoon().getDamageDivisor()).toBe(1);
        expect(foot("aug-dermal-armor").getDamageDivisor()).toBe(2);
        expect(foot("aug-tsm").getDamageDivisor()).toBe(0.5);
        expect(foot("aug-tsm", "aug-dermal-armor").getDamageDivisor()).toBe(1.5);
        expect(foot("aug-dermal-camo").getDamageDivisor()).toBe(1);
        expect(foot("aug-dermal-camo", "aug-tsm").getDamageDivisor()).toBe(1);
        // Armor worn over them: triple-strength adds nothing, dermal armor adds 1.
        const armored = foot("aug-tsm", "aug-dermal-armor");
        expect(armored.setArmor("inf-armor-comstar")).toBe(true);
        expect(armored.getDamageDivisor()).toBe(3);
        const tsmOnly = foot("aug-tsm");
        tsmOnly.setArmor("inf-armor-comstar");
        expect(tsmOnly.getDamageDivisor()).toBe(2);
    });

    it("divides the damage the platoon takes by the implants' divisor", () => {
        const platoon = foot("aug-dermal-armor");
        expect(platoon.resolveAttack(0, "direct", 10).join(" ")).toContain("damage divisor 2");
        // 40 damage is 4 troopers, divided by 2.
        const hard = foot("aug-dermal-armor");
        hard.resolveAttack(0, "direct", 40);
        expect(hard.getLineTroopers(0)).toBe(hard.getSubPlatoons()[0] - 2);
    });

    it("cuts support weapon crews and lifts the secondary limit with dermal armor and triple-strength myomer, with no MP loss (pp.74-75)", () => {
        const make = (...tags: string[]): InfantryPlatoon => {
            const platoon = foot(...tags);
            platoon.setMotive("motorized");
            expect(platoon.setSecondaryWeapon("inf-machine-gun-support")).toBe(true);
            return platoon;
        };
        // A support machine gun has a crew of 2: a squad of 7 crews 2 of them a squad without implants (the limit).
        const plain = make();
        expect(plain.getEffectiveCrew(plain.getSecondaryWeapon()!)).toBe(2);
        plain.setSecondaryPerSquad(4);
        expect(plain.getSecondaryPerSquad()).toBe(2);
        const dermal = make("aug-dermal-armor");
        expect(dermal.getEffectiveCrew(dermal.getSecondaryWeapon()!)).toBe(1);
        dermal.setSecondaryPerSquad(4);
        expect(dermal.getSecondaryPerSquad()).toBe(3);
        const both = make("aug-dermal-armor", "aug-tsm");
        expect(both.getEffectiveCrew(both.getSecondaryWeapon()!)).toBe(1);
        both.setSecondaryPerSquad(4);
        expect(both.getSecondaryPerSquad()).toBe(4);
        // Two support weapons a squad cost a motorized platoon 1 MP, unless the troopers have the implants.
        plain.setSecondaryPerSquad(2);
        dermal.setSecondaryPerSquad(2);
        expect(plain.getMP()).toBe(plain.getMotive().mp - 1);
        expect(dermal.getMP()).toBe(dermal.getMotive().mp);
        expect(dermal.isMoveOrFire()).toBe(false);
        const footDermal = foot("aug-tsm");
        footDermal.setSecondaryWeapon("inf-machine-gun-support");
        footDermal.setSecondaryPerSquad(2);
        expect(footDermal.isMoveOrFire()).toBe(false);
        const footPlain = new InfantryPlatoon();
        footPlain.setSecondaryWeapon("inf-machine-gun-support");
        footPlain.setSecondaryPerSquad(2);
        expect(footPlain.isMoveOrFire()).toBe(true);
    });

    it("gives prosthetic leg MASC to foot infantry only: +1 MP, and +1 to hit against the platoon (p.77)", () => {
        const masc = foot("aug-pl-masc");
        expect(masc.getMP()).toBe(2);
        expect(masc.getMovementText()).toBe("2 (Ground)");
        expect(masc.getAugmentationPlayNotes().join(" ")).toContain("+1 to-hit");
        const jump = foot("aug-pl-masc");
        jump.setMotive("jump");
        expect(jump.getMP()).toBe(INFANTRY_MOTIVE_TYPES.find((motive) => motive.tag === "jump")!.mp);
        expect(jump.getIssues().join(" ")).toContain("foot infantry only");
        expect(foot("aug-pl-masc", "aug-tsm").getIssues().join(" ").toLowerCase()).toContain("triple-strength");
        // A foot platoon held to move-or-fire by 2 support weapons a squad keeps its 1 MP and may move and attack (p.77).
        const heavy = foot("aug-pl-masc");
        heavy.setSecondaryWeapon("inf-machine-gun-support");
        heavy.setSecondaryPerSquad(2);
        expect(heavy.getMP()).toBe(1);
        expect(heavy.isMoveOrFire()).toBe(false);
    });

    it("gives a 2-hex active probe for IR/EM and audio implants, 3 hexes for the enhanced multi-modal ones (pp.72-73)", () => {
        expect(new InfantryPlatoon().getProbeRange()).toBe(0);
        expect(foot("aug-sensory-visual").getProbeRange()).toBe(2);
        expect(foot("aug-sensory-audio").getProbeRange()).toBe(2);
        expect(foot("aug-sensory-laser").getProbeRange()).toBe(0);
        expect(foot("aug-mm").getProbeRange()).toBe(2);
        expect(foot("aug-enh-mm").getProbeRange()).toBe(3);
        expect(foot("aug-sensory-visual").getAugmentationPlayNotes().join(" ")).toContain("2-hex active probe");
    });

    it("takes 1 off every to-hit number for laser-sight, telescopic and multi-modal implants, and not for the rest (pp.72-73)", () => {
        const base = new InfantryPlatoon().getRangeModifiers();
        expect(foot("aug-sensory-laser").getRangeModifiers()).toEqual(base.map((modifier) => modifier - 1));
        expect(foot("aug-sensory-tele").getRangeModifiers()).toEqual(base.map((modifier) => modifier - 1));
        expect(foot("aug-mm").getRangeModifiers()).toEqual(base.map((modifier) => modifier - 1));
        expect(foot("aug-enh-mm").getRangeModifiers()).toEqual(base.map((modifier) => modifier - 1));
        // Two kinds that give the same benefit do not stack.
        expect(foot("aug-sensory-laser", "aug-sensory-tele").getRangeModifiers()).toEqual(base.map((modifier) => modifier - 1));
        expect(foot("aug-sensory-visual").getRangeModifiers()).toEqual(base);
    });

    it("adds 0.14 damage a trooper in its own hex for triple-strength myomer and the prosthetics' damage (pp.75, 78)", () => {
        const platoon = foot("aug-tsm");
        const troopers = platoon.getTroopers();
        expect(platoon.getSameHexBonusDamage()).toBeCloseTo(0.14 * troopers, 5);
        const limbs = foot("aug-limb-enhanced");
        expect(limbs.setLimbs([{ item: "laser", count: 2 }])).toBe(true);
        expect(limbs.getSameHexBonusDamage()).toBeCloseTo(0.22 * limbs.getTroopers(), 5);
        // Damage that counts against other infantry only is split out.
        const blades = foot("aug-limb-enhanced");
        blades.setLimbs([{ item: "blade", count: 2 }]);
        expect(blades.getSameHexBonusDamage()).toBe(0);
        expect(blades.getSameHexBonusDamage(true)).toBeCloseTo(0.04 * blades.getTroopers(), 5);
        expect(blades.getAugmentationPlayNotes().join(" ")).toContain("+2 to hit");
    });

    it("halves flame damage for pain-shunted troopers (p.71)", () => {
        const shunted = foot("aug-pain-shunt");
        const plain = new InfantryPlatoon();
        shunted.resolveAttack(0, "heat", 8);
        plain.resolveAttack(0, "heat", 8);
        expect(plain.getLineDamage(0)).toBe(8);
        expect(shunted.getLineDamage(0)).toBe(4);
        expect(shunted.getAugmentationPlayNotes().join(" ")).toContain("-4");
        // Other damage is not halved.
        const direct = foot("aug-pain-shunt");
        direct.resolveAttack(0, "burst", 8);
        expect(direct.getLineDamage(0)).toBe(8);
    });

    it("applies dermal camouflage to foot and jump infantry in no other armor, +3/+2/+1 by hexes moved (p.74)", () => {
        const camo = foot("aug-dermal-camo");
        expect(camo.getCamoModifiers()).toEqual([3, 2, 1, 0]);
        const armored = foot("aug-dermal-camo");
        armored.setArmor("inf-armor-flak-standard");
        expect(armored.getCamoModifiers()).toBeNull();
        const motorized = foot("aug-dermal-camo");
        motorized.setMotive("motorized");
        expect(motorized.getCamoModifiers()).toBeNull();
        expect(motorized.getIssues().join(" ")).toContain("foot or jump infantry only");
        expect(new InfantryPlatoon().getCamoModifiers()).toBeNull();
    });

    it("prices the implants per trooper and adds the book's worked example: 30 dermal armor troopers with 2 enhanced limbs add 51,000,000 (p.179)", () => {
        const plain = new InfantryPlatoon();
        plain.setSquadSize(6);
        plain.setSquads(5);
        const platoon = foot("aug-dermal-armor", "aug-limb-enhanced");
        platoon.setSquadSize(6);
        platoon.setSquads(5);
        platoon.setLimbs([{ item: "laser", count: 2 }]);
        expect(platoon.getTroopers()).toBe(30);
        expect(platoon.getAugmentationCost().value).toBe(51000000);
        expect(platoon.getCBillCost()).toBe(plain.getCBillCost()! + 51000000);
        expect(platoon.getCBillCostLog().join("\n")).toContain("Prosthetic Limb, Enhanced (2 limbs): 30 x 200,000 = 6000000");
        // A fourth of the troopers carry a communications implant, rounded up; only the commander carries a triple-core processor.
        const comm = foot("aug-comm", "aug-tcp");
        expect(comm.setEra("jihad")).toBe(true);
        expect(comm.getTroopers()).toBe(28);
        expect(comm.getAugmentationCost().value).toBe(7 * 8000 + 3000000);
    });

    it("doubles the cost where the faction does not field the implant, and again where it is extinct in the era (p.71)", () => {
        const base = foot("aug-dermal-armor");
        base.setSquadSize(6);
        base.setSquads(5);
        expect(base.getAugmentationCost().value).toBe(30 * 1500000);
        const outsider = foot("aug-dermal-armor");
        expect(outsider.setFormation("federated-suns")).toBe(true);
        outsider.setSquadSize(6);
        outsider.setSquads(5);
        expect(outsider.getAugmentationCost().value).toBe(30 * 1500000 * 2);
        const owner = foot("aug-dermal-armor");
        owner.setFormation("capellan-confederation");
        owner.setSquadSize(6);
        owner.setSquads(5);
        expect(owner.getAugmentationCost().value).toBe(30 * 1500000);
        // The Capellan tail went extinct in 3085: in the Jihad era a Capellan platoon pays list price, after it double, and a Federated Suns one quadruple.
        const tail = foot("aug-tail");
        tail.setFormation("capellan-confederation");
        expect(tail.setEra("jihad")).toBe(true);
        expect(tail.getAugmentationCost().value).toBe(tail.getTroopers() * 60000);
        expect(tail.setEra("dark-ages")).toBe(true);
        expect(tail.getAugmentationCost().value).toBe(tail.getTroopers() * 60000 * 2);
        tail.setFormation("federated-suns");
        expect(tail.getAugmentationCost().value).toBe(tail.getTroopers() * 60000 * 4);
    });

    it("works out the book's Battle Value steps: pheromone to the defensive rating, toxin, triple-strength, suicide and the tail to the offensive (p.185)", () => {
        const troopers = 28;
        const speed = InfantryPlatoon.speedFactor(1);
        const weaponBV = new InfantryPlatoon().getPrimaryWeapon().battleValue * troopers * 2;
        const baseDefensive = troopers * 1.5;
        const plain = new InfantryPlatoon();
        expect(plain.getBattleValue()).toBe(roundNormally(baseDefensive + weaponBV * speed));
        const toxin = foot("aug-toxin");
        expect(toxin.getBattleValue()).toBe(roundNormally(baseDefensive + (weaponBV + troopers * 0.23) * speed));
        expect(toxin.getBattleValueLog().join("\n")).toContain("Toxin gas effuser: 28 x 0.23 = 6.44");
        const pheromone = foot("aug-pheromone");
        expect(pheromone.getBattleValue()).toBe(roundNormally((baseDefensive + troopers * 0.05) + weaponBV * speed));
        const tsm = foot("aug-tsm");
        // Divisor 0.5: the defensive rating halves, and 0.1 a trooper joins the weapons.
        expect(tsm.getBattleValue()).toBe(roundNormally(baseDefensive * 0.5 + (weaponBV + troopers * 0.1) * speed));
        const suicide = foot("aug-suicide");
        expect(suicide.getBattleValue()).toBe(roundNormally(baseDefensive + (weaponBV + troopers * 0.12) * speed));
        const tail = foot("aug-tail");
        expect(tail.getBattleValue()).toBe(roundNormally(baseDefensive + (weaponBV + troopers * 0.2) * speed));
        // Dermal armor adds 1 to the sum of damage divisors.
        expect(foot("aug-dermal-armor").getBattleValue()).toBe(roundNormally(baseDefensive * 2 + weaponBV * speed));
    });

    it("uses the prosthetics' Battle Value per trooper, not their damage, and 1.2 on the Anti-'Mech part for grappler lines and claws (pp.185, 191)", () => {
        const troopers = 28;
        const speed = InfantryPlatoon.speedFactor(1);
        const weaponBV = new InfantryPlatoon().getPrimaryWeapon().battleValue * troopers;
        const lasers = foot("aug-limb-enhanced");
        lasers.setLimbs([{ item: "laser", count: 2 }]);
        expect(lasers.getBattleValue()).toBe(roundNormally(troopers * 1.5 + (weaponBV * 2 + troopers * 0.24 * 2) * speed));
        expect(lasers.getBattleValueLog().join("\n")).toContain("2 x Laser");
        const grappler = foot("aug-limb-enhanced");
        grappler.setLimbs([{ item: "grappler", count: 1 }]);
        expect(grappler.getBattleValue()).toBe(roundNormally(troopers * 1.5 + (weaponBV + weaponBV * 1.2) * speed));
        // A platoon that cannot make Anti-'Mech attacks has no Anti-'Mech rating to multiply.
        const mech = foot("aug-limb-enhanced");
        mech.setMotive("mech-wheeled");
        mech.setLimbs([{ item: "grappler", count: 1 }]);
        expect(mech.getBattleValueLog().join("\n")).not.toContain("x 1.2");
    });

    it("counts dermal camouflage's +3 stationary modifier as the defensive modifier when it is the highest (p.185)", () => {
        const troopers = 28;
        const speed = InfantryPlatoon.speedFactor(1);
        const weaponBV = new InfantryPlatoon().getPrimaryWeapon().battleValue * troopers * 2;
        const camo = foot("aug-dermal-camo");
        // A 1 MP foot platoon: modifier +0 normally, +3 with the camouflage.
        expect(camo.getBattleValue()).toBe(roundNormally(troopers * 1.5 * 1.3 + weaponBV * speed));
        expect(camo.getBattleValueLog().join("\n")).toContain("dermal camouflage +3");
    });

    it("puts powered flight wings' 2 VTOL MP into the defensive modifier (p.185)", () => {
        const flight = foot("aug-flight");
        expect(flight.getFlightMP()).toBe(2);
        expect(flight.getMovementText()).toBe("1 (Ground), 2 (VTOL)");
        // VTOL movement counts +1 on top of its 2 MP modifier of 0.
        expect(flight.getBattleValue()).toBeGreaterThan(new InfantryPlatoon().getBattleValue());
        expect(foot("aug-glider").getFlightMP()).toBe(0);
    });

    it("lowers the effective skills used for the Battle Value skill multiplier (p.184)", () => {
        const kitted = (...tags: string[]): InfantryPlatoon => {
            const platoon = foot(...tags);
            platoon.setAntiMechKit(true);
            platoon.setAntiMechSkill(5);
            return platoon;
        };
        const plain = kitted();
        expect(plain.getSkillMultiplier()).toBe(1);
        const reference = (gunnery: number, antiMech: number): number => {
            const platoon = kitted();
            platoon.setGunnery(gunnery);
            platoon.setAntiMechSkill(antiMech);
            return platoon.getSkillMultiplier();
        };
        // Pain shunt: Piloting -1 (the Anti-'Mech skill); a communications implant too; they differ in what they do, so they add up.
        expect(kitted("aug-pain-shunt").getSkillMultiplier()).toBe(reference(4, 4));
        expect(kitted("aug-pain-shunt", "aug-comm").getSkillMultiplier()).toBe(reference(4, 3));
        // Sensory implants: Gunnery -1, once whichever of them the troopers have.
        expect(kitted("aug-sensory-laser", "aug-sensory-visual").getSkillMultiplier()).toBe(reference(3, 5));
        expect(kitted("aug-mm").getSkillMultiplier()).toBe(reference(3, 5));
        // The boosted communications implant counts as a C3 slave, not as a skill modifier.
        expect(kitted("aug-boosted-comm").getSkillMultiplier()).toBe(1);
        expect(kitted("aug-tcp").getSkillMultiplier()).toBe(reference(4, 4));
        // A skill never falls below 0.
        const sharp = kitted("aug-pain-shunt", "aug-comm", "aug-tcp");
        sharp.setAntiMechSkill(1);
        expect(sharp.getSkillMultiplier()).toBe(reference(4, 0));
        expect(kitted("aug-pain-shunt").getBattleValueLog().join("\n")).toContain("Anti-'Mech 5 to 4");
    });

    it("converts to Alpha Strike by the book's list of specials (pp.194-195)", () => {
        const specials = (...tags: string[]): string[] => foot(...tags).getAlphaStrikeStats().specialAbilities;
        expect(specials("aug-comm")).toContain("CI");
        expect(specials("aug-boosted-comm")).toEqual(expect.arrayContaining(["CI", "C3I"]));
        expect(specials("aug-sensory-laser")).toEqual(expect.arrayContaining(["LPRB", "RCN"]));
        expect(specials("aug-enh-mm")).toEqual(expect.arrayContaining(["PRB", "RCN"]));
        expect(specials("aug-enh-mm")).not.toContain("LPRB");
        expect(specials("aug-filtration")).toContain("FI");
        expect(specials("aug-dermal-camo")).toContain("LMAS");
        expect(specials("aug-tsm")).toContain("TSI");
        expect(specials("aug-tcp")).toEqual(expect.arrayContaining(["TCP", "MHQ1"]));
        expect(specials("aug-pl-masc")).toContain("PL");
        expect(specials("aug-glider")).toContain("PAR");
        expect(specials("aug-flight")).toContain("PAR");
        expect(specials("aug-pain-shunt")).not.toContain("PAR");
        // Prosthetic leg MASC adds its MP to the movement; powered flight adds 2 MP of VTOL.
        expect(foot("aug-pl-masc").getAlphaStrikeStats().movement).toBe(4);
        const flight = foot("aug-flight").getAlphaStrikeStats();
        expect(flight.movement).toBe(2);
        expect(flight.flightMovement).toBe(4);
        expect(foot("aug-flight").getAlphaStrikeUnit().move).toEqual(expect.arrayContaining([expect.objectContaining({ move: 4, type: "v" })]));
    });

    it("factors the extra damage into the Alpha Strike attack values, multi-modal damage x1.05, and the divisors into the armor (p.195)", () => {
        const plain = new InfantryPlatoon();
        plain.setMotive("jump");
        const withImplants = foot("aug-tsm", "aug-dermal-armor");
        withImplants.setMotive("jump");
        expect(withImplants.getAlphaStrikeStats().armor).toBeGreaterThan(plain.getAlphaStrikeStats().armor);
        expect(withImplants.getAlphaStrikeStats().calcLog.join("\n")).toContain("triple-strength myomer");
        const stronger = foot("aug-limb-enhanced");
        stronger.setLimbs([{ item: "vibroblade", count: 2 }]);
        expect(stronger.getAlphaStrikeStats().calcLog.join("\n")).toContain("prosthetic");
        const mm = foot("aug-mm");
        expect(mm.getAlphaStrikeStats().calcLog.join("\n")).toContain("x 1.05");
        // Non-infantry skill modifiers do not apply: none of these changes the Alpha Strike skill.
        expect(foot("aug-pain-shunt").getAlphaStrikeStats().pointValue).toBe(new InfantryPlatoon().getAlphaStrikeStats().pointValue);
    });

    it("is Experimental (4), or Advanced (3) for the pain shunt alone, in the rules level (p.216)", () => {
        expect(new InfantryPlatoon().getRequiredRulesLevel()).toBe(2);
        expect(foot("aug-pain-shunt").getRequiredRulesLevel()).toBe(3);
        expect(foot("aug-dermal-armor").getRequiredRulesLevel()).toBe(4);
        expect(foot("aug-pain-shunt", "aug-tsm").getRequiredRulesLevel()).toBe(4);
    });

    it("refuses the combinations the book bars (pp.71-79)", () => {
        const issues = (...tags: string[]): string => foot(...tags).getIssues().join(" | ").toLowerCase();
        expect(issues("aug-dermal-armor", "aug-dermal-camo")).toContain("cannot be combined");
        expect(issues("aug-glider", "aug-flight")).toContain("one set of wings");
        expect(issues("aug-sensory-visual", "aug-sensory-audio", "aug-sensory-laser")).toContain("two sensory implants");
        expect(issues("aug-limb-enhanced", "aug-limb-improved")).toContain("improved limbs take the place of enhanced ones");
        expect(issues("aug-dermal-armor", "aug-tsm")).toBe("");
        expect(issues("aug-dermal-camo", "aug-tsm", "aug-pl-masc")).toContain("triple-strength");
    });

    it("keeps the prosthetic limb rules: enhanced one kind up to twice, improved two to four items, extraneous in pairs (pp.78-79)", () => {
        const enhanced = foot("aug-limb-enhanced");
        expect(enhanced.setLimbs([{ item: "laser", count: 1 }, { item: "ballistic", count: 1 }])).toBe(true);
        expect(enhanced.getIssues().join(" ")).toContain("one kind");
        expect(enhanced.setLimbs([{ item: "laser", count: 3 }])).toBe(true);
        expect(enhanced.getLimbs()).toEqual([{ item: "laser", count: 2 }]);
        const improved = foot("aug-limb-improved");
        expect(improved.setLimbs([{ item: "ballistic", count: 2 }, { item: "grappler", count: 2 }])).toBe(true);
        expect(improved.getIssues()).toEqual([]);
        expect(improved.getAugmentationCost().value).toBe(28 * 202000 * 2);
        improved.setLimbs([{ item: "ballistic", count: 1 }]);
        expect(improved.getIssues().join(" ")).toContain("at least two");
        expect(improved.setLimbs([{ item: "plasma", count: 1 }])).toBe(false);
        const extra = foot("aug-limb-extraneous");
        extra.setEra("jihad");
        expect(extra.setExtraneousPairs(["laser", "vibroblade", "blade"])).toBe(true);
        expect(extra.getExtraneousPairs()).toEqual(["laser", "vibroblade"]);
        expect(extra.getAugmentationCost().value).toBe(28 * 400000 * 2);
        expect(extra.getSameHexBonusDamage()).toBeCloseTo(28 * (0.11 * 2 + 0.14 * 2), 5);
        const wings = foot("aug-limb-extraneous", "aug-flight");
        wings.setExtraneousPairs(["laser", "vibroblade"]);
        expect(wings.getIssues().join(" ")).toContain("one pair");
        // Melee items need +2 to hit; the grappler line and claws change the Anti-'Mech target number.
        expect(extra.getAugmentationPlayNotes().join(" ")).toContain("+2 to hit");
        const claws = foot("aug-limb-enhanced");
        claws.setLimbs([{ item: "grappler", count: 1 }]);
        expect(claws.getAntiMechToHitModifier()).toBe(-2);
        claws.setLimbs([{ item: "climbing-claws", count: 1 }]);
        expect(claws.getAntiMechToHitModifier()).toBe(-1);
    });

    it("writes a note for the Augmentation Limits Table, and for the troopers it asks for (pp.70-71)", () => {
        const notes = foot("aug-dermal-armor", "aug-tsm", "aug-pain-shunt").getNotes().join("\n");
        expect(notes).toContain("3 augmentations");
        expect(notes).toContain("1 to 4");
        expect(notes).toContain("Morale");
        const wob = foot("aug-dermal-armor");
        wob.setFormation("comstar-word-of-blake");
        expect(wob.getNotes().join("\n")).toContain("2 to 6");
        const clan = new InfantryPlatoon();
        clan.setTechBase("clan");
        clan.setAugmentations(["aug-pain-shunt", "aug-sensory-laser", "aug-sensory-tele"]);
        expect(clan.getNotes().join("\n")).toContain("1 to 2");
    });

    it("saves and loads the augmentation, and an old save without any still loads", () => {
        const saved = foot("aug-dermal-armor", "aug-limb-improved", "aug-limb-extraneous", "aug-pain-shunt");
        saved.setLimbs([{ item: "ballistic", count: 2 }, { item: "grappler", count: 2 }]);
        saved.setExtraneousPairs(["vibroblade"]);
        const exported = saved.export();
        expect(exported.augmentation).toEqual({
            implants: ["aug-pain-shunt", "aug-dermal-armor", "aug-limb-improved", "aug-limb-extraneous"],
            limbs: [{ item: "ballistic", count: 2 }, { item: "grappler", count: 2 }],
            extraneous: ["vibroblade"],
        });
        const loaded = new InfantryPlatoon(JSON.stringify(exported));
        expect(loaded.getImportIssues()).toEqual([]);
        expect(loaded.getAugmentations().map((item) => item.tag)).toEqual(["aug-pain-shunt", "aug-dermal-armor", "aug-limb-improved", "aug-limb-extraneous"]);
        expect(loaded.getLimbs()).toEqual([{ item: "ballistic", count: 2 }, { item: "grappler", count: 2 }]);
        expect(loaded.getExtraneousPairs()).toEqual(["vibroblade"]);
        expect(normalizeInfantryPlatoonExport(exported).platoon?.augmentation).toEqual(exported.augmentation);
        expect(new InfantryPlatoon().export().augmentation).toBeUndefined();
        const old = new InfantryPlatoon(JSON.stringify({ ...new InfantryPlatoon().export(), augmentation: undefined }));
        expect(old.getAugmentations()).toEqual([]);
        expect(old.getImportIssues()).toEqual([]);
        const odd = new InfantryPlatoon(JSON.stringify({ ...exported, augmentation: { implants: ["aug-dermal-armor", "aug-vdni", 7], limbs: [{ item: "plasma", count: 1 }], extraneous: ["laser", 4] } }));
        expect(odd.getAugmentations().map((item) => item.tag)).toEqual(["aug-dermal-armor"]);
        expect(odd.getImportIssues().join(" ")).toContain("aug-vdni");
        expect(odd.getImportIssues().join(" ")).toContain("plasma");
    });

    it("loads the implants before the weapons, so a saved 4 secondary weapons a squad survives", () => {
        const saved = foot("aug-dermal-armor", "aug-tsm");
        saved.setMotive("motorized");
        saved.setSecondaryWeapon("inf-machine-gun-support");
        saved.setSecondaryPerSquad(4);
        expect(saved.getSecondaryPerSquad()).toBe(4);
        const loaded = new InfantryPlatoon(saved.exportJSON());
        expect(loaded.getSecondaryPerSquad()).toBe(4);
        expect(loaded.getImportIssues()).toEqual([]);
    });

    it("writes the rules into the notes and the sheet text, and gives every implant a line in the Battle Value and cost logs", () => {
        const platoon = foot("aug-dermal-armor", "aug-sensory-visual");
        expect(platoon.getNotes().join("\n")).toContain("Cybernetic Myomer Implants, Dermal Armor");
        expect(platoon.getAugmentationSheetText()).toContain("Dermal Armor");
        expect(platoon.getCBillCostLog().join("\n")).toContain("Augmentation");
        expect(new InfantryPlatoon().getAugmentationSheetText()).toBe("");
    });
});

// #599: infantry Battle Value and cost as cited steps (Tasks 6-8).
describe("Infantry Battle Value as cited steps (#599)", () => {
    const workedJump = (): InfantryPlatoon => {
        const platoon = new InfantryPlatoon();
        platoon.setMotive("jump");
        platoon.setAntiMechKit(true);
        expect(platoon.setPrimaryWeapon("inf-laser-rifle-blazer")).toBe(true);
        expect(platoon.setSecondaryWeapon("inf-support-laser-heavy")).toBe(true);
        return platoon;
    };
    const first = (steps: ICalcStep[], id: string): ICalcStep => steps.find((entry) => entry.id === id)!;

    it("records the worked Anti-'Mech Jump platoon at every number BV v4.1 p.310 prints", () => {
        const breakdown = workedJump().getBattleValueBreakdown("total-warfare");
        expect(breakdown.kind).toBe("battle-value");
        expect(breakdown.scheme).toBe("bv2");
        expect(breakdown.result).toBe(168);
        const steps = breakdown.steps;
        // 21 troopers x 1.5 = 31.5; +2 target modifier: factor 1.2; Defensive Battle Rating 37.8.
        expect(first(steps, "ci.bv2.def.troopers").value).toBeCloseTo(31.5, 6);
        expect(first(steps, "ci.bv2.def.factor").value).toBeCloseTo(1.2, 6);
        expect(first(steps, "ci.bv2.def.rating").value).toBeCloseTo(37.8, 6);
        // 18 Blazer rifles at 1.79; 3 heavy support lasers. The worked example prints 3 x 17.34 = 52.02 and a weapon rating of 168.48, but
        // the Conventional Infantry Weapons BV Table (p.319, in every version of the library) prints 17.35 for the heavy support laser:
        // the page contradicts itself by 0.01 a laser. We follow the table: 3 x 17.35 = 52.05 and 168.54. The rating, the sum and the
        // rounded Battle Value (167.5 and a bit, 168) come out the same.
        expect(first(steps, "ci.bv2.off.primary").value).toBeCloseTo(18 * 1.79, 6);
        expect(first(steps, "ci.bv2.off.secondary").value).toBeCloseTo(3 * 17.35, 6);
        expect(first(steps, "ci.bv2.off.anti-mech").value).toBeCloseTo(2 * (18 * 1.79 + 3 * 17.35), 6);
        expect(2 * (18 * 1.79 + 3 * 17.34)).toBeCloseTo(168.48, 6);
        // 3 MP: Speed Factor 0.77; 168.54 x 0.77 = 129.7758; 37.8 + 129.7758 = 167.5758, rounded to 168 (the printed 168.48 gives 167.5296).
        expect(first(steps, "ci.bv2.off.speed").value).toBe(0.77);
        expect(first(steps, "ci.bv2.off.rating").value).toBeCloseTo(168.54 * 0.77, 6);
        expect(first(steps, "ci.bv2.final.sum").value).toBeCloseTo(37.8 + 168.54 * 0.77, 6);
        expect(first(steps, "ci.bv2.final.round").value).toBe(168);
        // Every step names a page; the order follows the book's three steps.
        for (const entry of steps) expect(entry.cites.length, entry.id).toBeGreaterThan(0);
        expect(steps.map((entry) => entry.id)).toEqual(["ci.bv2.def.troopers", "ci.bv2.def.factor", "ci.bv2.def.rating", "ci.bv2.off.primary", "ci.bv2.off.secondary", "ci.bv2.off.anti-mech", "ci.bv2.off.speed", "ci.bv2.off.rating", "ci.bv2.final.sum", "ci.bv2.final.round"]);
    });

    it("renders the log from the steps", () => {
        const platoon = workedJump();
        expect(platoon.getBattleValueLog("total-warfare")).toEqual(platoon.getBattleValueBreakdown("total-warfare").steps.map(formatCalcStep));
        expect(platoon.getBattleValueLog("total-warfare").join("\n")).toContain("(TM p.309");
    });

    it("records the divisor steps, the stealth and mount addenda, and marks the provisional rulings", () => {
        const armored = new InfantryPlatoon();
        expect(armored.setArmor("inf-armor-ablative-standard")).toBe(true);
        const ids = armored.getBattleValueBreakdown("total-warfare").steps.map((entry) => entry.id);
        expect(ids).toContain("ci.bv2.def.divisor");
        const elephant = new InfantryPlatoon();
        
        expect(elephant.setMount("elephant")).toBe(true);
        const beastSteps = elephant.getBattleValueBreakdown("total-warfare").steps;
        const divisor = first(beastSteps, "ci.bv2.def.divisor.beast");
        // The sum of the divisors, as p.191 prints it (NGCFells 2026-11-23): cited.
        expect(divisor.status).toBe("cited");
        expect(divisor.detail).toBe("21 x (1 + 2)");
        expect(first(beastSteps, "ci.bv2.def.factor.beast").value).toBeCloseTo(0.9, 6);
        const microlite = new InfantryPlatoon();
        expect(microlite.setMotive("microlite")).toBe(true);
        // VTOL movement is airborne, +1 (TW p.117), and the Defensive Factor counts it (TM p.315): cited, not provisional.
        const vtolStep = first(microlite.getBattleValueBreakdown("total-warfare").steps, "ci.bv2.def.factor.vtol");
        expect(vtolStep.status).toBe("cited");
        expect(vtolStep.cites).toEqual([{ source: "tm", page: "315" }, { source: "tw", page: "117" }]);
        const guns = new InfantryPlatoon();
        guns.setMotive("motorized");
        expect(guns.setFieldGuns("autocannon-ultra-b", 3)).toBe(true);
        const gunSteps = guns.getBattleValueBreakdown("total-warfare").steps;
        expect(first(gunSteps, "ci.bv2.off.field-guns").value).toBe(336);
        expect(first(gunSteps, "ci.bv2.off.field-guns.ammo").status).toBe("provisional");
    });

    it("records the augmentation additions and skill modifiers", () => {
        const make = (...tags: string[]): InfantryPlatoon => {
            const platoon = new InfantryPlatoon();
            expect(platoon.setEra("jihad")).toBe(true);
            platoon.setAntiMechKit(true);
            platoon.setAugmentations(tags);
            return platoon;
        };
        const toxin = make("aug-toxin").getBattleValueBreakdown("total-warfare").steps;
        expect(first(toxin, "ci.bv2.off.augmentation").value).toBeCloseTo(28 * 0.23, 6);
        const pheromone = make("aug-pheromone").getBattleValueBreakdown("total-warfare").steps;
        expect(first(pheromone, "ci.bv2.def.augmentation").value).toBeCloseTo(28 * 0.05, 6);
        const shunt = make("aug-pain-shunt").getBattleValueBreakdown("total-warfare").steps;
        expect(first(shunt, "ci.bv2.final.skill").detail).toContain("Anti-'Mech 5 to 4");
    });

    it("holds the Infantry Battle Values table as data, motive by weapon class, both columns (BMR p.142, BMR(R) p.155)", () => {
        const table: Record<string, [number, number][]> = {
            foot: [[28, 41], [37, 60], [56, 56], [31, 47], [23, 32], [60, 60]],
            jump: [[32, 51], [41, 71], [87, 87], [37, 62], [29, 46], [71, 71]],
            motorized: [[35, 54], [42, 70], [75, 75], [39, 63], [28, 42], [70, 70]],
        };
        const classes = ["flamer", "laser", "lrm", "machine-gun", "rifle", "srm"] as const;
        for (const motive of ["foot", "jump", "motorized"] as const) {
            classes.forEach((weapon, index) => {
                expect(getInfantryBv1Line(motive, weapon, false), `${motive} ${weapon}`).toBe(table[motive][index][0]);
                expect(getInfantryBv1Line(motive, weapon, true), `${motive} ${weapon} anti-Mech`).toBe(table[motive][index][1]);
            });
        }
        expect(INFANTRY_BV1_ENGINEERS).toEqual([42, 63]);
    });

    it("reads our weapons onto the six classes, and no others", () => {
        const classOf = (tag: string) => getInfantryBv1Class(findInfantryWeapon(tag)!);
        expect(classOf("inf-laser-rifle")).toBe("laser");
        expect(classOf("inf-support-laser-heavy")).toBe("laser");
        expect(classOf("inf-machine-gun-support")).toBe("machine-gun");
        expect(classOf("inf-flamer-man-portable")).toBe("flamer");
        expect(classOf("inf-rifle-bolt-action")).toBe("rifle");
        expect(classOf("inf-srm-launcher-light-inferno")).toBe("srm");
        expect(classOf("inf-lrm-launcher-corean-farshot-inferno")).toBe("lrm");
        expect(classOf("inf-gauss-rifle-thunderstroke")).toBeNull();
        expect(classOf("inf-submachine-gun")).toBeNull();
    });

    const sized = (motive: "foot" | "jump" | "motorized", weapon: string): InfantryPlatoon => {
        const platoon = new InfantryPlatoon();
        platoon.setMotive(motive);
        expect(platoon.setPrimaryWeapon(weapon), weapon).toBe(true);
        platoon.setSquadSize(7);
        platoon.setSquads(motive === "jump" ? 3 : 4);
        expect(platoon.getTroopers()).toBe(INFANTRY_BV1_STANDARD_SIZE[motive]);
        return platoon;
    };

    it("takes a standard platoon's BV1 from the table under both Master Rules editions, the Anti-'Mech column when trained", () => {
        for (const edition of ["master-rules", "master-rules-revised"]) {
            const rifle = sized("foot", "inf-rifle-bolt-action");
            const breakdown = rifle.getBattleValueBreakdown(edition);
            expect(breakdown.scheme, edition).toBe("bv1");
            expect(breakdown.result, edition).toBe(INFANTRY_BV1_TABLE.foot.rifle[0]);
            expect(rifle.getBattleValue(edition), edition).toBe(23);
            expect(first(breakdown.steps, "ci.bv1.table").value).toBe(23);
            rifle.setAntiMechKit(true);
            expect(rifle.getBattleValue(edition), edition).toBe(32);
            const laser = sized("jump", "inf-laser-rifle");
            expect(laser.getBattleValue(edition), edition).toBe(41);
            laser.setAntiMechKit(true);
            expect(laser.getBattleValue(edition), edition).toBe(71);
            const motorized = sized("motorized", "inf-laser-rifle");
            expect(motorized.getBattleValue(edition), edition).toBe(42);
            motorized.setAntiMechKit(true);
            expect(motorized.getBattleValue(edition), edition).toBe(70);
            // The edition is told apart by its citations.
            expect(rifle.getBattleValueBreakdown(edition).steps[0].cites.map((cite) => cite.source)).toContain(edition === "master-rules" ? "bmr" : "bmrr");
        }
    });

    it("names the platoon by its support weapon: rifle troopers with an SRM, MG, flamer or LRM secondary read that row, under both editions", () => {
        const armed = (motive: "foot" | "jump" | "motorized", secondary: string): InfantryPlatoon => {
            const platoon = sized(motive, "inf-auto-rifle");
            expect(platoon.setSecondaryWeapon(secondary), secondary).toBe(true);
            return platoon;
        };
        for (const edition of ["master-rules", "master-rules-revised"]) {
            const srm = armed("foot", "inf-srm-launcher-light-inferno");
            expect(srm.getBattleValue(edition), edition).toBe(60);
            expect(armed("jump", "inf-machine-gun-support").getBattleValue(edition), edition).toBe(37);
            expect(armed("motorized", "inf-flamer-man-portable").getBattleValue(edition), edition).toBe(35);
            const lrm = armed("foot", "inf-lrm-launcher-corean-farshot-inferno");
            const breakdown = lrm.getBattleValueBreakdown(edition);
            expect(breakdown.result, edition).toBe(56);
            const step = first(breakdown.steps, "ci.bv1.table.lrm");
            expect(step.value).toBe(56);
            // Maximum Tech p.93 gives the LRM line as Level 3; the BMR errata cut it from the 1998 table.
            expect(step.cites.map((cite) => cite.source)).toContain(edition === "master-rules" ? "mt" : "mt-revised");
            expect(first(srm.getBattleValueBreakdown(edition).steps, "ci.bv1.map").detail).toContain("(secondary) read as srm");
        }
        // A secondary outside the six classes leaves the primary to name the platoon.
        const gauss = sized("foot", "inf-laser-rifle");
        expect(gauss.setSecondaryWeapon("inf-gauss-rifle-magshot")).toBe(true);
        expect(gauss.getBattleValue("master-rules")).toBe(37);
    });

    it("scales the table to a nonstandard platoon, provisionally", () => {
        const rifle = sized("foot", "inf-rifle-bolt-action");
        rifle.setSquads(2);
        expect(rifle.getTroopers()).toBe(14);
        const breakdown = rifle.getBattleValueBreakdown("master-rules");
        expect(breakdown.result).toBe(Math.floor(23 * 14 / 28 + 0.5 + 1e-9));
        expect(first(breakdown.steps, "ci.bv1.size").status).toBe("provisional");
    });

    it("adds the unit equipment of Maximum Tech p.93 before the skill, and the Level 3 motorized engineers' line", () => {
        const base = sized("foot", "inf-laser-rifle");
        expect(base.getBattleValue("master-rules")).toBe(37);
        const sneak = sized("foot", "inf-laser-rifle");
        expect(sneak.setArmor("inf-armor-sneak-suit-camo")).toBe(true);
        expect(first(sneak.getBattleValueBreakdown("master-rules").steps, "ci.bv1.equipment").value).toBe(1);
        const paratroops = sized("foot", "inf-laser-rifle");
        expect(paratroops.setSpecialty("paratroops", true)).toBe(true);
        expect(paratroops.getBattleValue("master-rules")).toBe(38);
        const engineers = sized("motorized", "inf-laser-rifle");
        expect(engineers.setSpecialty("engineers", true)).toBe(true);
        expect(engineers.getBattleValue("master-rules")).toBe(42);
        expect(first(engineers.getBattleValueBreakdown("master-rules").steps, "ci.bv1.table.level3").value).toBe(42);
    });

    it("adds each field gun's Master Rules BV without ammunition", () => {
        const plain = sized("motorized", "inf-laser-rifle");
        const guns = sized("motorized", "inf-laser-rifle");
        expect(guns.setFieldGuns("autocannon-ultra-b", 3)).toBe(true);
        const step = first(guns.getBattleValueBreakdown("master-rules").steps, "ci.bv1.field-guns");
        expect(step.value).toBeGreaterThan(0);
        expect(guns.getBattleValue("master-rules")).toBe(plain.getBattleValue("master-rules") + Math.floor(step.value! + 0.5 + 1e-9));
        expect(guns.getBattleValueBreakdown("master-rules").steps.some((entry) => entry.id === "ci.bv1.field-guns.ammo")).toBe(false);
    });

    it("marks a field gun the Master Rules tables do not print as provisional, at its BV2 figure, as the 'Mech and fighter BV1 do", () => {
        for (const edition of ["master-rules", "master-rules-revised"]) {
            const guns = sized("motorized", "inf-laser-rifle");
            expect(guns.setFieldGuns("light-rifle", 2)).toBe(true);
            const steps = guns.getBattleValueBreakdown(edition).steps;
            expect(steps.some((entry) => entry.id === "ci.bv1.field-guns"), edition).toBe(false);
            const step = first(steps, "ci.bv1.field-guns.unlisted");
            expect(step.status, edition).toBe("provisional");
            expect(step.value, edition).toBe(2 * 21);
            // A gun the tables print stays cited.
            const printed = sized("motorized", "inf-laser-rifle");
            expect(printed.setFieldGuns("autocannon-ultra-b", 1)).toBe(true);
            expect(first(printed.getBattleValueBreakdown(edition).steps, "ci.bv1.field-guns").status, edition).toBe("cited");
        }
    });

    it("rates a standard SCUBA platoon on the foot line with Maximum Tech's Submersible +1 (pp.42, 93: foot infantry equipped to operate underwater)", () => {
        for (const edition of ["master-rules", "master-rules-revised"]) {
            const scuba = new InfantryPlatoon();
            scuba.setMotive("scuba");
            expect(scuba.setPrimaryWeapon("inf-laser-rifle")).toBe(true);
            scuba.setSquadSize(7);
            scuba.setSquads(4);
            expect(scuba.getTroopers()).toBe(28);
            const breakdown = scuba.getBattleValueBreakdown(edition);
            expect(breakdown.result, edition).toBe(INFANTRY_BV1_TABLE.foot.laser[0] + 1);
            const submersible = first(breakdown.steps, "ci.bv1.submersible");
            expect(submersible.value, edition).toBe(1);
            expect(submersible.status, edition).toBe("cited");
            expect(submersible.cites.map((cite) => cite.page), edition).toEqual(["42", "93"]);
            // Maximum Tech's submersible infantry are foot troops: a motorized or mechanized SCUBA platoon still has no line.
            const motorized = new InfantryPlatoon();
            motorized.setMotive("scuba-motorized");
            expect(motorized.getBattleValueBreakdown(edition).result, edition).toBeNull();
        }
    });

    it("gives no BV1 where the books have no line: mechanized, other motives, other weapon classes", () => {
        const tracked = new InfantryPlatoon();
        tracked.setMotive("mech-tracked");
        const mechanized = tracked.getBattleValueBreakdown("master-rules");
        expect(mechanized.result).toBeNull();
        expect(first(mechanized.steps, "ci.bv1.mechanized").status).toBe("source-missing");
        expect(tracked.getBattleValue("master-rules")).toBe(0);
        expect(first(sized("foot", "inf-laser-rifle").getBattleValueBreakdown("master-rules").steps, "ci.bv1.map").status).toBe("provisional");
        const smg = sized("foot", "inf-submachine-gun");
        expect(smg.getBattleValueBreakdown("master-rules").result).toBeNull();
        expect(first(smg.getBattleValueBreakdown("master-rules").steps, "ci.bv1.weapon-class").status).toBe("source-missing");
        const microlite = new InfantryPlatoon();
        microlite.setMotive("microlite");
        expect(first(microlite.getBattleValueBreakdown("master-rules").steps, "ci.bv1.motive").status).toBe("source-missing");
        // Under Total Warfare the BV2 method still runs.
        expect(sized("foot", "inf-laser-rifle").getBattleValueBreakdown("total-warfare").scheme).toBe("bv2");
        expect(tracked.getBattleValue("total-warfare")).toBeGreaterThan(0);
    });
});

describe("Infantry cost as cited steps (#599)", () => {
    const first = (steps: ICalcStep[], id: string): ICalcStep => steps.find((entry) => entry.id === id)!;

    it("records Darrell's platoon at the book's numbers (TM pp.276, 282)", () => {
        const platoon = darrell();
        const breakdown = platoon.getCostBreakdown();
        expect(breakdown.kind).toBe("cost");
        expect(breakdown.result).toBe(3167838);
        expect(first(breakdown.steps, "ci.cost.trooper").value).toBeCloseTo(28 * 2000 * Math.sqrt(1250), 3);
        expect(first(breakdown.steps, "ci.cost.motive").detail).toContain("1.6");
        expect(first(breakdown.steps, "ci.cost.final").value).toBe(3167838);
        for (const entry of breakdown.steps) expect(entry.cites.length, entry.id).toBeGreaterThan(0);
        expect(platoon.getCBillCostLog()).toEqual(breakdown.steps.map(formatCalcStep));
    });

    it("records the kits, field guns, beasts, specializations, paramedics and implants as steps", () => {
        const kitted = darrell();
        kitted.setAntiMechKit(true);
        expect(first(kitted.getCostBreakdown().steps, "ci.cost.anti-mech").detail).toContain("5");
        const guns = new InfantryPlatoon();
        guns.setMotive("motorized");
        guns.setFieldGuns("autocannon-ultra-b", 3);
        expect(first(guns.getCostBreakdown().steps, "ci.cost.field-guns").value).toBe(600000);
        const horse = new InfantryPlatoon();
        horse.setMotive("beast");
        horse.setMount("horse");
        expect(first(horse.getCostBreakdown().steps, "ci.cost.beast").value).toBe(75000);
        const marines = new InfantryPlatoon();
        marines.setSpecialty("marines", true);
        expect(first(marines.getCostBreakdown().steps, "ci.cost.specialization").detail).toContain("3");
        const scubaMech = new InfantryPlatoon();
        scubaMech.setMotive("scuba-mech");
        expect(first(scubaMech.getCostBreakdown().steps, "ci.cost.motive.scuba-mech").status).toBe("provisional");
        const unpriced = new InfantryPlatoon();
        expect(unpriced.setPrimaryWeapon("inf-harpoon-gun-pequod-mk-i")).toBe(true);
        expect(unpriced.getCostBreakdown().result).toBeNull();
    });
});

describe("NGCFells rulings on infantry and beast-mounted infantry (2026-11-23, #599, #600)", () => {
    const beast = (tag: string, primary: string = "inf-auto-rifle"): InfantryPlatoon => {
        const platoon = new InfantryPlatoon();
        expect(platoon.setMount(tag)).toBe(true);
        expect(platoon.setPrimaryWeapon(primary)).toBe(true);
        return platoon;
    };
    const step = (platoon: InfantryPlatoon, id: string, edition: string = "total-warfare"): ICalcStep | undefined =>
        platoon.getBattleValueBreakdown(edition).steps.find((entry) => entry.id === id);
    const bv1Steps = (platoon: InfantryPlatoon): ICalcStep[] => platoon.getBattleValueBreakdown("master-rules-revised").steps;

    it("A1: encumbering armor takes 1 MP off a mechanized VTOL platoon's VTOL MP, and still none off jump MP (TO:AUE p.130)", () => {
        const microlite = new InfantryPlatoon();
        microlite.setMotive("microlite");
        expect(microlite.setArmor("inf-armor-ballistic-plate-standard")).toBe(true);
        expect(microlite.getMP()).toBe(5);
        const copter = new InfantryPlatoon();
        copter.setMotive("microcopter");
        expect(copter.setSecondaryWeapon("inf-machine-gun-support")).toBe(true);
        expect(copter.setArmor("inf-armor-ballistic-plate-standard")).toBe(true);
        // 5 VTOL MP, -1 for the support weapon (p.136), -1 for the armor.
        expect(copter.getMP()).toBe(3);
        const jump = new InfantryPlatoon();
        jump.setMotive("jump");
        expect(jump.setArmor("inf-armor-ballistic-plate-standard")).toBe(true);
        expect(jump.getMP()).toBe(3);
    });

    it("A1: a beast platoon's Defensive Battle Rating is the sum of the rider's and the mount's divisors x 1.5 (TO:AUE pp.129, 191)", () => {
        // Unarmored riders count the Fatigues/Non-Armored divisor 1 (p.129): 21 x 1.5 x (1 + 1) = 63.
        const horse = beast("horse");
        expect(horse.getBattleValueLog().join("\n")).toContain("Damage divisors with the Horse mount: 31.5 x (1 + 1) = 63");
        expect(step(horse, "ci.bv2.def.divisor.beast")?.status).toBe("cited");
        // 10 troopers on elephants: 15 x (1 + 2) = 45, x 0.9 = 40.5.
        const elephant = beast("elephant");
        elephant.setSquads(5);
        expect(elephant.getBattleValueLog().join("\n")).toContain("Defensive Battle Rating: 45 x 0.9 = 40.5");
        // Ballistic plate (2) on a hipposaur (4): 2 + 4.
        const plated = beast("hipposaur");
        expect(plated.setArmor("inf-armor-ballistic-plate-standard")).toBe(true);
        expect(plated.getBattleValueLog().join("\n")).toContain("12 x (2 + 4) = 72");
        // The play divisor is the same sum (ruled by NGCFells 2026-11-23).
        expect(plated.getDamageDivisor()).toBe(6);
        // One squad on branths: 10.5 x 2 = 21, x 1.3 = 27.3; (11.13 + 11.13) x 1.12 = 24.93; 52.23, rounded 52.
        const branth = beast("branth");
        branth.setSquads(1);
        expect(branth.getBattleValue()).toBe(52);
    });

    it("A2: beast riders in encumbering armor lose 1 MP like anyone; only support weapons on Very Large and Monstrous creatures cost none (p.107)", () => {
        const elephant = beast("elephant");
        expect(elephant.setSecondaryWeapon("inf-machine-gun-support")).toBe(true);
        elephant.setSecondaryPerSquad(2);
        expect(elephant.getMP()).toBe(2);
        expect(elephant.setArmor("inf-armor-ballistic-plate-standard")).toBe(true);
        expect(elephant.getMP()).toBe(1);
        const branth = beast("branth");
        expect(branth.setArmor("inf-armor-ballistic-plate-standard")).toBe(true);
        expect(branth.getMP()).toBe(5);
        expect(branth.getMovementText()).toBe("5 (VTOL)");
        const donkey = beast("donkey");
        expect(donkey.setArmor("inf-armor-snowsuit")).toBe(true);
        expect(donkey.getMP()).toBe(1);
    });

    it("A1: the Branth Irregulars (Beast Infantry (Aerial), TRO 3085 p.201) rate 43, the MUL's figure", () => {
        // 7 x 1.5 x (2 + 1) = 31.5; 5 VTOL MP is +2, airborne +1: x 1.3 = 40.95; 7 x 0.34 x 1.0 = 2.38; 43.33, rounded 43.
        const platoon = beast("branth", "inf-elephant-gun");
        platoon.setSquads(1);
        expect(platoon.setArmor("inf-armor-free-worlds-league-3035-plus")).toBe(true);
        expect(platoon.getMP()).toBe(5);
        expect(platoon.getBattleValue()).toBe(43);
    });

    it("A3: keeps the Creature Size Table's anti-'Mech limits and quotes the p.108 text that differs, in the notes, the play note and the step", () => {
        const elephant = beast("elephant");
        elephant.setAntiMechKit(true);
        expect([elephant.canMakeLegAttacks(), elephant.canMakeSwarmAttacks()]).toEqual([true, false]);
        const quote = "For units using Very Large creatures (roughly the size of a Terran elephant), the unit may not engage in Leg Attacks.";
        expect(elephant.getBeastAntiMechNote()).toContain(quote);
        expect(elephant.getNotes().join(" ")).toContain(quote);
        const antiMech = step(elephant, "ci.bv2.off.anti-mech.beast");
        expect(antiMech?.status).toBe("cited");
        expect(antiMech?.note).toContain(quote);
        expect(beast("horse").getBeastAntiMechNote()).toBeNull();
        expect(beast("hipposaur").getBeastAntiMechNote()).toContain("may not make anti-'Mech attacks");
    });

    it("A4: Large creature riders take no weapon of the Support type (TM p.148), whatever its crew; Standard weapons they may", () => {
        const horse = beast("horse");
        // A hand grenade is a Support weapon with a crew of 1.
        expect(findInfantryWeapon("inf-grenade")).toMatchObject({ type: "support", crew: 1 });
        expect(horse.setSecondaryWeapon("inf-grenade")).toBe(false);
        expect(horse.getAvailableSecondaryWeapons().some((weapon) => weapon.type === "support")).toBe(false);
        expect(horse.setSecondaryWeapon("inf-submachine-gun")).toBe(true);
        expect(beast("elephant").setSecondaryWeapon("inf-grenade")).toBe(true);
    });

    it("B6: specialty and XCT multipliers apply to the total unit cost last, after the add-ons (TO:AUE p.225)", () => {
        const plain = new InfantryPlatoon();
        expect(plain.setPrimaryWeapon("inf-laser-rifle")).toBe(true);
        expect(plain.setFieldGear(["inf-field-tag"])).toBe(true);
        const marines = new InfantryPlatoon();
        expect(marines.setPrimaryWeapon("inf-laser-rifle")).toBe(true);
        expect(marines.setFieldGear(["inf-field-tag"])).toBe(true);
        expect(marines.setSpecialty("marines", true)).toBe(true);
        // (troopers + 50,000 TAG) x 3, rounded down.
        const before = plain.getCostBreakdown().steps.find((entry) => entry.id === "ci.cost.tag")!.total!;
        expect(marines.getCBillCost()).toBe(Math.floor(before * 3 + 1e-6));
        const ids = marines.getCostBreakdown().steps.map((entry) => entry.id);
        expect(ids.indexOf("ci.cost.specialization")).toBeGreaterThan(ids.indexOf("ci.cost.tag"));
        // A microlite platoon's TC x 4 is the same: last.
        const microlite = new InfantryPlatoon();
        microlite.setMotive("microlite");
        const microIds = microlite.getCostBreakdown().steps.map((entry) => entry.id);
        expect(microIds.indexOf("ci.cost.motive.vtol")).toBe(microIds.length - 2);
    });

    it("B7: marks the weapon line provisional for specialties Maximum Tech prints no line for", () => {
        const marines = new InfantryPlatoon();
        expect(marines.setSpecialty("marines", true)).toBe(true);
        const plain = new InfantryPlatoon();
        expect(marines.getBattleValue("master-rules-revised")).toBe(plain.getBattleValue("master-rules-revised"));
        const specialty = bv1Steps(marines).find((entry) => entry.id === "ci.bv1.specialty");
        expect(specialty?.status).toBe("provisional");
        expect(specialty?.label).toContain("Marines");
        const mountain = new InfantryPlatoon();
        expect(mountain.setSpecialty("mountain", true)).toBe(true);
        expect(bv1Steps(mountain).some((entry) => entry.id === "ci.bv1.specialty")).toBe(true);
        const engineers = new InfantryPlatoon();
        expect(engineers.setSpecialty("engineers", true)).toBe(true);
        expect(bv1Steps(engineers).find((entry) => entry.id === "ci.bv1.specialty")?.label).toContain("Combat Engineers");
        // Motorized engineers have their own Level 3 line, cited.
        const motorized = new InfantryPlatoon();
        motorized.setMotive("motorized");
        expect(motorized.setSpecialty("engineers", true)).toBe(true);
        expect(bv1Steps(motorized).some((entry) => entry.id === "ci.bv1.specialty")).toBe(false);
        const medics = new InfantryPlatoon();
        expect(medics.setParamedicsPerSquad(1)).toBe(true);
        expect(bv1Steps(medics).find((entry) => entry.id === "ci.bv1.specialty")?.label).toContain("Paramedics");
        const xct = new InfantryPlatoon();
        expect(xct.setArmor("inf-armor-snowsuit")).toBe(true);
        expect(xct.setXCT("cold")).toBe(true);
        expect(bv1Steps(xct).find((entry) => entry.id === "ci.bv1.specialty")?.label).toContain("XCT");
    });

    it("B8: a TAG Troops platoon takes the TAG +1 of Maximum Tech p.93 in BV1, as the TAG field gear does", () => {
        const tag = new InfantryPlatoon();
        expect(tag.setTagTroopersPerSquad(2)).toBe(true);
        const steps = bv1Steps(tag);
        expect(steps.find((entry) => entry.id === "ci.bv1.equipment" && entry.label.includes("TAG"))?.value).toBe(1);
        expect(steps.find((entry) => entry.id === "ci.bv1.specialty")?.label).toContain("TAG Troops");
    });

    it("minors: claws with blades mark the Anti-'Mech step provisional, and an unpriced weapon leaves a cost step that says so", () => {
        const claws = new InfantryPlatoon();
        expect(claws.setPrimaryWeapon("inf-blade-vibro-katana")).toBe(true);
        expect(claws.setAugmentations(["aug-limb-enhanced"])).toBe(true);
        claws.setLimbs([{ item: "grappler", count: 1 }]);
        expect(step(claws, "ci.bv2.off.anti-mech.tool.archaic")?.status).toBe("provisional");
        const unpriced = new InfantryPlatoon();
        expect(unpriced.setPrimaryWeapon("inf-harpoon-gun-pequod-mk-i")).toBe(true);
        const breakdown = unpriced.getCostBreakdown();
        expect(breakdown.result).toBeNull();
        expect(breakdown.steps.map((entry) => entry.id)).toEqual(["ci.cost.unpriced"]);
        expect(breakdown.steps[0].label).toContain("Harpoon");
    });
});
