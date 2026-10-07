import { describe, expect, it } from "vitest";
import InfantryPlatoon, { INFANTRY_FORMATIONS, INFANTRY_MOTIVE_TYPES, INFANTRY_RANGE_MODIFIERS, normalizeInfantryPlatoonExport } from "./infantry-platoon";
import { INFANTRY_SUPPORT_PPC_TAG, findInfantryWeapon, infantryWeapons } from "../data/infantry-weapons";

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
