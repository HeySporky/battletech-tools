import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { validateChassisCombination } from "../data/mech-internal-structure-types";
import { getTargetToHitFromWeapon } from "../utils";
import { mechArmorTypes } from "../data/mech-armor-types";

describe("BattleMech engine availability by era", () => {
    it("shows the expected Inner Sphere engines for a Star League mech", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setTonnage(20);
        mech.setEra("star-league");

        const availableEngineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(availableEngineTags).toEqual(["standard", "xl", "ice", "cell", "fission"]);
    });

    it("includes engines introduced during the selected era", () => {
        const mech = new BattleMech();
        mech.setEra("star-league");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).toContain("xl");
    });

    it("excludes engines in the gap between extinction and reintroduction", () => {
        const mech = new BattleMech();
        mech.setEra("late-sw-lt");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).not.toContain("xl");
    });

    it("includes reintroduced engines when the selected era overlaps reintroduction", () => {
        const mech = new BattleMech();
        mech.setEra("jihad");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).toContain("xl");
    });

    it("keeps Clan engines available after Inner Sphere extinction", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        mech.setEra("jihad");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).toContain("clan_xl");
        expect((mech as any)._itemIsAvailable(2300, 2500, 3070, true)).toBe(true);
    });

    it("selects and persists both mixed technology bases", () => {
        const isBase = new BattleMech();
        isBase.setTech("mis");
        expect(isBase.getTech().tag).toBe("mis");
        expect(new BattleMech(isBase.exportJSON(true)).getTech().tag).toBe("mis");

        const clanBase = new BattleMech();
        clanBase.setTech("mclan");
        expect(clanBase.getTech().tag).toBe("mclan");
        expect(new BattleMech(clanBase.exportJSON(true)).getTech().tag).toBe("mclan");
    });

    it("defaults mixed engines to the chassis base and permits the alternate technology", () => {
        const isBase = new BattleMech();
        isBase.setTech("mis");
        expect(isBase.getEngineTechBase()).toBe("is");
        expect(isBase.getAvailableEngines().some(engine => engine.tag === "clan_xl")).toBe(false);
        isBase.setEngineTechBase("clan");
        expect(isBase.getAvailableEngines().some(engine => engine.tag === "clan_xl")).toBe(true);
        isBase.setEngineType("clan_xl");
        expect(new BattleMech(isBase.exportJSON(true)).getEngineTechBase()).toBe("clan");

        const clanBase = new BattleMech();
        clanBase.setTech("mclan");
        expect(clanBase.getEngineTechBase()).toBe("clan");
        clanBase.setEngineTechBase("is");
        expect(clanBase.getAvailableEngines().some(engine => engine.tag === "xl")).toBe(true);
    });
});

describe("BattleMech equipment catalogs", () => {
    it("exposes only the chassis-legal source catalogs plus Custom at Custom Homebrew", () => {
        const isMech = new BattleMech();
        expect(isMech.getAvailableEquipmentByCatalog("is").length).toBeGreaterThan(0);
        expect(isMech.getAvailableEquipmentByCatalog("clan")).toEqual([]);
        expect(isMech.getAvailableEquipmentByCatalog("universal").length).toBeGreaterThan(0);
        expect(isMech.getAvailableEquipmentByCatalog("custom")).toEqual([]);
        expect(isMech.getAvailableEquipmentByCatalog("custom", true).length).toBeGreaterThan(0);

        const clanMech = new BattleMech();
        clanMech.setTech("clan");
        clanMech.setEra("ilClan");
        expect(clanMech.getAvailableEquipmentByCatalog("is")).toEqual([]);
        expect(clanMech.getAvailableEquipmentByCatalog("clan").length).toBeGreaterThan(0);
        expect(clanMech.getAvailableEquipmentByCatalog("universal").length).toBeGreaterThan(0);

        const mixedMech = new BattleMech();
        mixedMech.setTech("mis");
        expect(mixedMech.getAvailableEquipmentByCatalog("is").length).toBeGreaterThan(0);
        expect(mixedMech.getAvailableEquipmentByCatalog("clan").length).toBeGreaterThan(0);
        expect(mixedMech.getAvailableEquipmentByCatalog("universal").length).toBeGreaterThan(0);
        expect(new Set(mixedMech.getAvailableEquipment().map(item => item.tag)).size)
            .toBe(mixedMech.getAvailableEquipment().length);
    });
});

describe("BattleMech armor technology availability", () => {
    it("filters armor by multiplier for pure tech bases and permits both families for mixed bases", () => {
        const clanMech = new BattleMech();
        clanMech.setTech("clan");
        expect(clanMech.getAvailableArmorTypes().filter(armor => armor.available).map(armor => armor.tag))
            .toEqual(["standard", "ferro-fibrous"]);

        const mixedClanMech = new BattleMech();
        mixedClanMech.setTech("mclan");
        mixedClanMech.setEra("ilClan");
        const mixedArmorTags = mixedClanMech.getAvailableArmorTypes().filter(armor => armor.available).map(armor => armor.tag);
        expect(mixedArmorTags).toEqual(expect.arrayContaining(["standard", "ferro-fibrous", "light-ferro-fibrous", "heavy-ferro-fibrous", "stealth-basic", "ferro-lamellor"]));
        expect(mixedArmorTags).not.toContain("modular");
        expect(mixedArmorTags).not.toContain("patchwork");
        expect(mixedArmorTags).not.toContain("ferro-aluminum");
    });

    it("defines complete unit eligibility and Stealth locations for every Mech chassis", () => {
        const unitTypeKeys = ["battlemech", "protomech", "combatVehicle", "supportVehicle", "aerospaceFighter", "smallCraft", "dropShip", "battleArmor", "jumpShip", "warShip"];
        for (const armor of mechArmorTypes) {
            expect(Object.keys(armor.unitTypes).sort()).toEqual([...unitTypeKeys].sort());
            expect(Object.values(armor.unitTypes).every(value => typeof value === "boolean")).toBe(true);
        }

        const stealth = mechArmorTypes.find(armor => armor.tag === "stealth-basic")!;
        expect(Object.keys(stealth.critLocs ?? {}).sort()).toEqual(["biped", "lam", "quad", "quadvee", "tripod"]);
        expect(stealth.critLocs?.tripod?.cl).toBe(2);
        expect(stealth.critLocs?.quad?.fll).toBe(2);
        expect(stealth.critLocs?.quad?.frl).toBe(2);
    });

    it("places Stealth armor criticals according to Tripod anatomy", () => {
        const tripod = new BattleMech();
        tripod.setEra("ilClan");
        tripod.setType("tripod");
        tripod.setArmorType("stealth-basic");

        const criticals = tripod.getCriticals();
        for (const location of ["leftArm", "rightArm", "leftTorso", "rightTorso", "leftLeg", "rightLeg", "centerLeg"] as const) {
            expect(criticals[location].some(item => item?.tag === "stealth-basic"), location).toBe(true);
        }
    });

    it("adds specialty armor abilities to Alpha Strike conversion", () => {
        const mech = new BattleMech();
        mech.setEra("ilClan");
        mech.setArmorType("reactive");
        expect(mech.getAlphaStrikeForceStats().abilities).toContain("RCA");
    });
});

describe("BattleMech armor allocation", () => {
    it("uses the selected armor tonnage when making a best-guess allocation", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setArmorWeight(5);
        mech.allocateArmorClear();

        mech.allocateArmorSane();

        expect(mech.getTotalArmor()).toBeGreaterThan(0);
        expect(mech.getTotalArmor()).toBeLessThanOrEqual(mech.getMaxArmor());
        expect(mech.getUnallocatedArmor()).toBe(0);
    });

    it("keeps the chassis armor ceiling independent of selected tonnage and synchronizes Allocate Max", () => {
        const mech = new BattleMech();
        const maximumTonnage = mech.getMaxArmorTonnage();

        mech.setArmorWeight(5);
        expect(mech.getMaxArmorTonnage()).toBe(maximumTonnage);
        mech.setArmorWeight(3);
        expect(mech.getMaxArmorTonnage()).toBe(maximumTonnage);

        mech.allocateArmorMax();
        expect(mech.getArmorWeight()).toBe(maximumTonnage);
        expect(mech.getUnallocatedArmor()).toBeGreaterThanOrEqual(0);
    });
});

describe("BattleMech Modular Armor", () => {
    it("mounts one pack per location, absorbs damage, applies penalties, and persists remaining points", () => {
        const mech = new BattleMech();
        mech.setEra("ilClan");
        mech.setTonnage(50);
        mech.setWalkSpeed(5);
        mech.setJumpSpeed(3);
        mech.setArmorWeight(5);
        mech.setLeftTorsoArmor(10);

        const leftTorsoPack = mech.addEquipmentFromTag("modular-armor", "is", "", false, undefined, "", false, [], undefined, undefined)!;
        const duplicatePack = mech.addEquipmentFromTag("modular-armor", "is", "", false, undefined, "", false, [], undefined, undefined)!;
        const rightTorsoPack = mech.addEquipmentFromTag("modular-armor", "is", "", false, undefined, "", false, [], undefined, undefined)!;
        const unallocatedIndex = (uuid: string) => mech.unallocatedCriticals.findIndex(item => item?.uuid === uuid);
        const openSlot = (location: "leftTorso" | "rightTorso") => mech.getCriticals()[location].findIndex(item => !item);

        expect(mech.moveCritical("un", unallocatedIndex(leftTorsoPack.uuid!), "lt", openSlot("leftTorso"))).toBe(true);
        expect(mech.moveCritical("un", unallocatedIndex(duplicatePack.uuid!), "lt", openSlot("leftTorso"))).toBe(false);
        expect(mech.moveCritical("un", unallocatedIndex(rightTorsoPack.uuid!), "rt", openSlot("rightTorso"))).toBe(true);
        expect(mech.getWalkSpeed()).toBe(4);
        expect(mech.getJumpSpeed()).toBe(2);
        expect(mech.getPilotingSkillModifier()).toBe(1);

        mech.takeDamage(6, "lt", false);
        expect(mech.getModularArmorCurrentPoints(leftTorsoPack)).toBe(4);
        expect(mech.armorDamaged("lt", 0)).toBe(false);

        mech.takeDamage(7, "lt", false);
        expect(mech.getModularArmorCurrentPoints(leftTorsoPack)).toBe(0);
        expect(mech.armorDamaged("lt", 0)).toBe(true);
        expect(mech.getWalkSpeed()).toBe(4);

        const rightPackSlot = mech.getCriticals().rightTorso.findIndex(item => item?.uuid === rightTorsoPack.uuid);
        mech.toggleCritical("rt", rightPackSlot);
        expect(mech.getModularArmorCurrentPoints(rightTorsoPack)).toBe(0);
        expect(mech.getWalkSpeed()).toBe(5);
        expect(mech.getJumpSpeed()).toBe(3);
        expect(mech.getPilotingSkillModifier()).toBe(0);

        const restored = new BattleMech(mech.exportJSON());
        expect(restored.getModularArmorPacks()).toHaveLength(3);
        const restoredLeftPack = restored.getModularArmorPacks().find(pack => pack.uuid === leftTorsoPack.uuid)!;
        const restoredRightPack = restored.getModularArmorPacks().find(pack => pack.uuid === rightTorsoPack.uuid)!;
        expect(restored.getModularArmorCurrentPoints(restoredLeftPack)).toBe(0);
        expect(restored.getModularArmorCurrentPoints(restoredRightPack)).toBe(0);
    });
});

describe("BattleMech TRO anatomy", () => {
    it("renders Tripod legs instead of Quad front and rear legs", () => {
        const mech = new BattleMech();
        mech.setType("tripod");

        const troHtml = mech.makeTROHTML();

        expect(troHtml).toContain("Center Leg");
        expect(troHtml).not.toContain("Front Leg");
        expect(troHtml).not.toContain("Rear Leg");
    });
});

describe("BattleMech Alpha Strike special ammunition", () => {
    it("defaults to standard ammunition and permits one mounted special ammunition type", () => {
        const mech = new BattleMech();
        mech.addEquipmentFromTag("ammo-lrm-swarm-i", "is", "lt", false, undefined, "", false, [], undefined, undefined);

        expect(mech.getAlphaStrikeSpecialAmmoOptions().map(ammo => ammo.tag)).toEqual(["ammo-lrm-swarm-i"]);
        expect(mech.getAlphaStrikeForceStats().abilities).not.toContain("AOE#");

        mech.setAlphaStrikeSpecialAmmoTag("ammo-lrm-swarm-i");
        expect(mech.getAlphaStrikeForceStats().abilities).toContain("AOE#");

        const restored = new BattleMech(mech.exportJSON(true));
        expect(restored.getAlphaStrikeSpecialAmmoTag()).toBe("ammo-lrm-swarm-i");
    });
});

describe("BattleMech ATM ammunition", () => {
    it("exposes newly added ATM equipment and bins for critical allocation", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        const tags = ["atm-6", "ammo-atm-standard", "ammo-atm-er", "ammo-atm-he"];

        for (const tag of tags) {
            expect(mech.addEquipmentFromTag(tag, "clan", "", false, undefined, "", false, [], undefined, undefined)).not.toBeNull();
        }

        expect(mech.unallocatedCriticals.filter(item => tags.includes(item.tag)).map(item => item.tag).sort())
            .toEqual([...tags].sort());
    });

    it("consumes a full ATM rack from the selected ammunition bin", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        const weapon = mech.addEquipmentFromTag("atm-6", "clan", "lt", false, undefined, "", false, [], undefined, undefined)!;
        const ammo = mech.addEquipmentFromTag("ammo-atm-standard", "clan", "lt", false, undefined, "", false, [], undefined, undefined)!;
        const weaponIndex = mech.equipmentList.findIndex(item => item.uuid === weapon.uuid);

        mech.selectAmmoBin(weapon.uuid!, ammo.uuid!);
        mech.toggleResolved(weaponIndex);

        expect(ammo.currentAmmo).toBe(54);
    });

    it("uses the selected ATM profile for Classic range", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        const weapon = mech.addEquipmentFromTag("atm-6", "clan", "lt", false, undefined, "a", false, [], undefined, undefined)!;
        const standardAmmo = mech.addEquipmentFromTag("ammo-atm-standard", "clan", "lt", false, undefined, "", false, [], undefined, undefined)!;
        const extendedRangeAmmo = mech.addEquipmentFromTag("ammo-atm-er", "clan", "lt", false, undefined, "", false, [], undefined, undefined)!;
        const weaponIndex = mech.equipmentList.findIndex(item => item.uuid === weapon.uuid);
        const target = { name: "Target", active: true, range: 20, movement: 0, otherMods: 0, jumped: false, primary: true, inRearArc: false };

        mech.selectAmmoBin(weapon.uuid!, standardAmmo.uuid!);
        expect(getTargetToHitFromWeapon(mech, weaponIndex, target).finalToHit).toBe(-1);

        mech.selectAmmoBin(weapon.uuid!, extendedRangeAmmo.uuid!);
        expect(getTargetToHitFromWeapon(mech, weaponIndex, target).rangeExplanation).toBe("Long");
    });
});

describe("LAM and QuadVee chassis rules", () => {
    it("limits LAMs to 1 through 3 jump MP and a Standard Gyro", () => {
        const mech = new BattleMech();
        mech.setType("lam");
        mech.setJumpSpeed(0);
        expect(mech.getJumpSpeed()).toBe(1);
        mech.setJumpSpeed(8);
        expect(mech.getJumpSpeed()).toBe(3);
        mech.setGyroType("xl");
        expect(mech.getGyro().tag).toBe("standard");
    });

    it("restricts QuadVees to standard armor and internal structure", () => {
        const mech = new BattleMech();
        mech.setType("quadvee");
        mech.setArmorType("ferro-fibrous");
        mech.setInternalStructureType("endo-steel");
        expect(mech.getArmorType()).toBe("standard");
        expect(mech.getInternalStructureType()).toBe("standard");
    });

    it("persists the QuadVee tracked or wheeled motive selection", () => {
        const mech = new BattleMech();
        mech.setType("quadvee");
        mech.setQuadVeeMotive("wheeled");
        mech.setWalkSpeed(5);

        const restored = new BattleMech(mech.exportJSON(true));

        expect(restored.getQuadVeeMotive()).toBe("wheeled");
        expect(restored.getQuadVeeVehicleCruiseMP()).toBe(6);
        restored.setQuadVeeMotive("tracked");
        expect(restored.getQuadVeeVehicleCruiseMP()).toBe(5);
    });

    it("allows only chassis-appropriate transformation modes", () => {
        const lam = new BattleMech();
        lam.setType("lam");
        lam.setTransformationMode("aerospace");
        expect(lam.getTransformationMode()).toBe("aerospace");
        expect(lam.canUsePhysicalAttacksInCurrentMode()).toBe(false);

        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        quadvee.setTransformationMode("vehicle");
        expect(quadvee.getTransformationMode()).toBe("vehicle");
        expect(quadvee.canUseJumpJetsInCurrentMode()).toBe(false);
        expect(quadvee.getOperationalHeightLevels()).toBe(1);

        const biped = new BattleMech();
        biped.setTransformationMode("vehicle");
        expect(biped.getTransformationMode()).toBe("mech");
    });

    it("requires LAM avionics and landing gear in the mandated locations", () => {
        const mech = new BattleMech();
        mech.setType("lam");
        const criticals = mech.getCriticals();

        expect(criticals.head[3]?.tag).toBe("lam-avionics");
        expect(criticals.leftTorso.some(item => item?.tag === "lam-avionics")).toBe(true);
        expect(criticals.rightTorso.some(item => item?.tag === "lam-avionics")).toBe(true);
        expect(criticals.centerTorso.some(item => item?.tag === "lam-landing-gear")).toBe(true);
        expect(criticals.leftTorso.filter(item => item?.tag === "lam-landing-gear")).toHaveLength(1);
        expect(criticals.rightTorso.filter(item => item?.tag === "lam-landing-gear")).toHaveLength(1);
    });

    it("reserves both slots in all QuadVee legs for conversion gear", () => {
        const mech = new BattleMech();
        mech.setType("quadvee");
        const criticals = mech.getCriticals();

        expect(criticals.frontLeftLeg).toHaveLength(2);
        expect(criticals.frontRightLeg).toHaveLength(2);
        expect(criticals.leftLeg).toHaveLength(2);
        expect(criticals.rightLeg).toHaveLength(2);
        expect(criticals.frontLeftLeg.every(item => item?.tag === "quadvee-conversion" || item?.placeholder)).toBe(true);
        expect(criticals.frontRightLeg.every(item => item?.tag === "quadvee-conversion" || item?.placeholder)).toBe(true);
        expect(criticals.leftLeg.every(item => item?.tag === "quadvee-conversion" || item?.placeholder)).toBe(true);
        expect(criticals.rightLeg.every(item => item?.tag === "quadvee-conversion" || item?.placeholder)).toBe(true);
        expect(criticals.head.some(item => item?.tag === "multi-pilot-cockpit")).toBe(true);
        expect(criticals.centerTorso.some(item => item?.tag === "multi-pilot-cockpit")).toBe(true);
    });

    it("accounts for QuadVee conversion weight and dual cockpit weight", () => {
        const biped = new BattleMech();
        const quadvee = new BattleMech();
        quadvee.setType("quadvee");

        expect(quadvee.getCurrentTonnage() - biped.getCurrentTonnage()).toBe(3);
    });

    it("allows LAMs above 55 tons only at Custom Homebrew rules level", () => {
        expect(validateChassisCombination("standard", "lam", 60, 2)).toBe(false);
        expect(validateChassisCombination("standard", "lam", 60, 5)).toBe(true);
    });

    it("allows QuadVees to continue in Vehicle mode after gyro failure", () => {
        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        quadvee.setTransformationMode("vehicle");
        expect(quadvee.canOperateAfterGyroFailure()).toBe(true);
        expect(quadvee.hasMotiveSystemDamage()).toBe(false);

        const biped = new BattleMech();
        expect(biped.canOperateAfterGyroFailure()).toBe(false);
    });

    it("exposes chassis-specific combat capabilities", () => {
        const tripod = new BattleMech();
        tripod.setType("tripod");
        expect(tripod.hasFullTorsoTwist()).toBe(true);
        expect(tripod.getPilotingSkillModifier()).toBe(-1);
        expect(tripod.ignoresSecondaryTargetModifier()).toBe(true);

        const lam = new BattleMech();
        lam.setType("lam");
        lam.setTransformationMode("airmech");
        expect(lam.getAttackerMovementModifier()).toBe(3);

        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        quadvee.setTransformationMode("vehicle");
        expect(quadvee.hasFullTorsoTwist()).toBe(true);
        expect(quadvee.canUseHullDownRules()).toBe(true);
    });

    it("connects damaged QuadVee motive gear to Vehicle-mode Cruise MP", () => {
        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        quadvee.setQuadVeeMotive("wheeled");
        quadvee.setWalkSpeed(4);
        quadvee.setTransformationMode("vehicle");

        const frontLeg = quadvee.getCriticals().frontLeftLeg.find(item => item?.tag === "quadvee-conversion");
        expect(frontLeg).toBeDefined();
        frontLeg!.damaged = true;
        expect(quadvee.hasMotiveSystemDamage()).toBe(true);
        expect(quadvee.getQuadVeeVehicleCruiseMP()).toBe(0);
        expect(quadvee.getWalkSpeed()).toBe(0);
    });

    it("reduces effective movement after a leg is destroyed but preserves QuadVee vehicle motive", () => {
        const biped = new BattleMech();
        biped.setWalkSpeed(4);
        expect(biped.getWalkSpeed()).toBe(4);
        biped.takeDamage(100, "ll", false);
        expect(biped.getWalkSpeed()).toBe(3);

        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        quadvee.setWalkSpeed(4);
        quadvee.setQuadVeeMotive("wheeled");
        quadvee.setTransformationMode("vehicle");
        quadvee.takeDamage(100, "ll", false);
        expect(quadvee.getWalkSpeed()).toBe(5);
    });

    it("marks prohibited LAM equipment unavailable", () => {
        const mech = new BattleMech();
        mech.setType("lam");
        mech.setEra("ilClan");

        const equipment = mech.getAvailableEquipment(true);
        expect(equipment.find(item => item.tag === "gauss-rifle-heavy")?.available).toBe(false);
        expect(equipment.find(item => item.tag === "rotary-ac-2")?.available).toBe(false);
        expect(equipment.find(item => item.tag === "melee-hatchet")?.available).toBe(false);
    });

    it("applies Tripod cockpit, gyro, Omni, and one-leg stability rules", () => {
        const tripod = new BattleMech();
        tripod.setType("tripod");
        tripod.setWalkSpeed(4);
        tripod.toggleOmni();
        expect(tripod.isOmnimech).toBe(false);
        expect(tripod.getCockpitWeight()).toBe(4);
        expect(tripod.getCriticals().head.some(item => item?.tag === "multi-pilot-cockpit")).toBe(true);
        expect(tripod.getCriticals().centerTorso.some(item => item?.tag === "multi-pilot-cockpit")).toBe(true);
        tripod.takeDamage(100, "ll", false);
        expect(tripod.getWalkSpeed()).toBe(4);
    });
});