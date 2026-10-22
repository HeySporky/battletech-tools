import { describe, expect, it } from "vitest";
import InfantryPlatoon, { formatInfantryASDamage, INFANTRY_FORMATIONS, INFANTRY_MOTIVE_TYPES, INFANTRY_RANGE_MODIFIERS, normalizeInfantryPlatoonExport } from "./infantry-platoon";
import { INFANTRY_SUPPORT_PPC_TAG, findInfantryWeapon, infantryWeapons } from "../data/infantry-weapons";
import { BattleMechGroup } from "./battlemech-group";
import { findInfantryArmor, infantryArmor } from "../data/infantry-armor";

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
        expect(infantryWeapons.length).toBe(212);
        expect(new Set(infantryWeapons.map((weapon) => weapon.tag)).size).toBe(212);
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
        expect(INFANTRY_MOTIVE_TYPES.map((motive) => motive.maxPlatoonSize)).toEqual([30, 30, 30, 20, 28, 24]);
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
        expect(platoon.getBattleValueLog()).toContain("Defensive Battle Rating = 37.80");
        // Standard skills, Gunnery 4 and Anti-'Mech 5.
        expect(platoon.getSkillAdjustedBattleValue()).toBe(168);
        platoon.setAntiMechKit(false);
        // Without kits the Anti-'Mech Skill is fixed at 8: x 0.85.
        expect(platoon.getAntiMechSkill()).toBe(8);
        expect(platoon.getSkillAdjustedBattleValue()).toBe(Math.round(168 * 0.85));
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
        expect(group.getTotaBV2()).toBe(copy.getSkillAdjustedBattleValue());
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
        // Gunnery only, from the 5 column, as for mechanized infantry.
        expect(platoon.getSkillMultiplier()).toBe(1);
        platoon.setGunnery(3);
        expect(platoon.getSkillMultiplier()).toBe(1.2);
        expect(platoon.getNotes().join(" | ")).toContain("add no weight, cost or skill");

        // Removing the armor brings the kits back.
        platoon.setArmor("");
        expect(platoon.hasAntiMechKit()).toBe(true);
        expect(platoon.getWeight()).toBe(6);
        expect(new InfantryPlatoon(platoon.exportJSON()).getAntiMechSkill()).toBe(3);
    });

    it("works out Battle Value by rules edition, falling back to the default where an edition has no method entered", () => {
        const platoon = darrell();
        expect(platoon.getBattleValueEdition()).toBe("total-warfare");
        expect(platoon.getBattleValueEdition("master-rules")).toBe("total-warfare");
        expect(platoon.getBattleValueEdition("constructor")).toBe("total-warfare");
        expect(platoon.getBattleValue("master-rules")).toBe(platoon.getBattleValue());
        // The skill multiplier is the edition's own: Master Rules reads the 5 column for all infantry.
        platoon.setGunnery(3);
        expect(platoon.getSkillAdjustedBattleValue("master-rules")).toBe(Math.round(platoon.getBattleValue() * 1.2));
    });
});
