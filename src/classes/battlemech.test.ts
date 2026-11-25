import { describe, expect, it, vi } from "vitest";
import { sswMechs } from "../data/ssw/sswMechs";
import { getSSWXMLBasicInfo } from "../utils/getSSWXMLBasicInfo";
import { BattleMech } from "./battlemech";
import { getTargetToHitFromWeapon } from "../utils";
import { mechArmorTypes } from "../data/mech-armor-types";
import { getWeaponAmmoFamilies } from "../data/equipment-registry";

describe("BattleMech engine availability by era", () => {
    it("shows the expected Inner Sphere engines for a Star League mech", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setTonnage(20);
        mech.setEra("star-league");

        const availableEngineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        // IO: fission engines are prototypes until production in 2882.
        expect(availableEngineTags).toEqual(["standard", "xl", "ice", "cell"]);
    });

    it("offers prototype engines only at the Experimental rules level", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("star-league");

        const standardRules = mech.getAvailableEngines(2).find(engine => engine.tag === "fission");
        expect(standardRules?.available).toBe(false);
        const experimental = mech.getAvailableEngines(4).find(engine => engine.tag === "fission");
        expect(experimental?.available).toBe(true);
        expect(experimental?.availableAsPrototype).toBe(true);
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

    it("never offers equipment a 'Mech cannot mount (space.battlemech -1)", () => {
        const clan = new BattleMech();
        clan.setTech("clan");
        clan.setEra("ilClan");
        const available = clan.getAvailableEquipment();
        expect(available.some(item => item.tag === "protomech-autocannon-2")).toBe(false);
        expect(available.every(item => item.space.battlemech >= 0)).toBe(true);
    });

    it("resolves split IS and Clan Arrow IV tags, including old Clan saves", () => {
        // IS Arrow IV 15 t, Clan Arrow IV 12 t (catalog records, TO p.96)
        const mixed = new BattleMech();
        mixed.setTech("mis");
        expect(mixed.addEquipmentFromTag("arrow-iv-system", "", "", false, null, undefined, undefined, undefined, undefined, undefined)?.weight).toBe(15);
        expect(mixed.addEquipmentFromTag("clan-arrow-iv-system", "", "", false, null, undefined, undefined, undefined, undefined, undefined)?.weight).toBe(12);
        expect(mixed.getAvailableEquipment().filter(item => item.name.startsWith("Arrow IV System"))).toHaveLength(2);

        const clan = new BattleMech();
        clan.setTech("clan");
        const restored = clan.addEquipmentFromTag("arrow-iv-system", "", "", false, null, undefined, undefined, undefined, undefined, undefined);
        expect(restored?.tag).toBe("clan-arrow-iv-system");
    });
});

describe("BattleMech armor technology availability", () => {
    it("uses IO production dates, per-tech windows and prototypes for armor (TO:AUE pp.92-94)", () => {
        const available = (tech: string, era: string, rulesLevel: number) => {
            const mech = new BattleMech();
            mech.setTech(tech);
            mech.setEra(era);
            return mech.getAvailableArmorTypes(rulesLevel).filter(armor => armor.available);
        };
        // Hardened armor: prototype 3047, production 3081.
        expect(available("is", "clan-inv", 2).map(armor => armor.tag)).not.toContain("hardened");
        expect(available("is", "clan-inv", 4).find(armor => armor.tag === "hardened")?.availableAsPrototype).toBe(true);
        // Clan Ferro-Fibrous enters production in 2825.
        expect(available("clan", "star-league", 2).map(armor => armor.tag)).not.toContain("ferro-fibrous");
        // Prototype-only armor never appears below Experimental.
        expect(available("is", "star-league", 2).map(armor => armor.tag)).not.toContain("ferro-fibrous-prototype");
        expect(available("is", "star-league", 4).map(armor => armor.tag)).toContain("ferro-fibrous-prototype");
    });

    it("applies the armor type BV modifier to the armor factor (TM p.302, TO:AUE)", () => {
        const withArmor = (tag: string) => {
            const mech = new BattleMech();
            mech.setTech("is");
            mech.setEra("ilClan");
            mech.setArmorType(tag);
            mech.getBattleValue();
            return mech.getBVCalcHTML();
        };
        expect(withArmor("hardened")).toContain("Total Armor Factor = 2 x Modifier for Hardened Armor");
        expect(withArmor("reactive")).toContain("Total Armor Factor = 1.5 x Modifier for Reactive Armor");
        expect(withArmor("standard")).toContain("Total Armor Factor = 1 x Modifier for Standard");
    });

    it("filters armor by multiplier for pure tech bases and permits both families for mixed bases", () => {
        const clanMech = new BattleMech();
        clanMech.setTech("clan");
        clanMech.setEra("clan-inv");
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
        expect(Object.keys(stealth.critLocs ?? {}).sort()).toEqual(["biped", "quad"]);
        expect(stealth.critLocs?.quad?.fll).toBe(2);
        expect(stealth.critLocs?.quad?.frl).toBe(2);
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

    // Regression: Best Guess dumped its rounding remainder onto the CT front,
    // pushing CT front + rear past 2x internal structure, so the Step 4 CT (R)
    // dropdown had no option for its value and rendered blank.
    it("keeps Best Guess within every location's armor cap on all chassis types", () => {
        const locations = [
            "head", "centerTorso", "centerTorsoRear", "leftTorso", "leftTorsoRear",
            "rightTorso", "rightTorsoRear", "leftArm", "rightArm", "leftLeg",
            "rightLeg", "centerLeg", "frontLeftLeg", "frontRightLeg",
        ] as const;
        for (const type of ["biped", "quad"]) {
            for (const tonnage of [20, 25, 55, 100]) {
                const mech = new BattleMech();
                mech.setType(type);
                mech.setTonnage(tonnage);
                const maxTonnage = mech.getMaxArmorTonnage();
                for (let weight = 0.5; weight < maxTonnage; weight += 0.5) {
                    // Start from stale Allocate Max values; Best Guess must replace them
                    mech.allocateArmorMax();
                    mech.setArmorWeight(weight);
                    mech.allocateArmorSane();

                    const allocation = mech.getArmorAllocation();
                    const label = `${type} ${tonnage}t ${weight}t armor`;
                    for (const location of locations) {
                        const value = allocation[location] ?? 0;
                        expect(Number.isInteger(value) && value >= 0, `${label} ${location}=${value}`).toBe(true);
                    }
                    expect(allocation.head, label).toBeLessThanOrEqual(9);
                    expect(allocation.centerTorso, label).toBeGreaterThan(0);
                    expect(allocation.centerTorso, label).toBeLessThanOrEqual(mech.getMaxCenterTorsoArmor());
                    expect(allocation.centerTorsoRear, label).toBeLessThanOrEqual(mech.getMaxCenterTorsoRearArmor());
                    expect(allocation.leftTorsoRear, label).toBeLessThanOrEqual(mech.getMaxLeftTorsoRearArmor());
                    expect(allocation.rightTorsoRear, label).toBeLessThanOrEqual(mech.getMaxRightTorsoRearArmor());
                    expect(mech.getUnallocatedArmor(), label).toBe(0);
                }
            }
        }
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
        const tags = ["atm-6", "ammo-clan-atm-standard", "ammo-clan-atm-er", "ammo-clan-atm-he"];

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
        const ammo = mech.addEquipmentFromTag("ammo-clan-atm-standard", "clan", "lt", false, undefined, "", false, [], undefined, undefined)!;
        const weaponIndex = mech.equipmentList.findIndex(item => item.uuid === weapon.uuid);

        mech.selectAmmoBin(weapon.uuid!, ammo.uuid!);
        mech.toggleResolved(weaponIndex);

        // ATM 6: 10 shots per ton; one resolved attack spends one shot.
        expect(mech.getAmmoBinCapacity(ammo)).toBe(10);
        expect(ammo.currentAmmo).toBe(9);
    });

    it("uses the selected ATM profile for Classic range", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        const weapon = mech.addEquipmentFromTag("atm-6", "clan", "lt", false, undefined, "a", false, [], undefined, undefined)!;
        const standardAmmo = mech.addEquipmentFromTag("ammo-clan-atm-standard", "clan", "lt", false, undefined, "", false, [], undefined, undefined)!;
        const extendedRangeAmmo = mech.addEquipmentFromTag("ammo-clan-atm-er", "clan", "lt", false, undefined, "", false, [], undefined, undefined)!;
        const weaponIndex = mech.equipmentList.findIndex(item => item.uuid === weapon.uuid);
        const target = { name: "Target", active: true, range: 20, movement: 0, otherMods: 0, jumped: false, primary: true, inRearArc: false };

        mech.selectAmmoBin(weapon.uuid!, standardAmmo.uuid!);
        expect(getTargetToHitFromWeapon(mech, weaponIndex, target).finalToHit).toBe(-1);

        mech.selectAmmoBin(weapon.uuid!, extendedRangeAmmo.uuid!);
        expect(getTargetToHitFromWeapon(mech, weaponIndex, target).rangeExplanation).toBe("Long");
    });
});

describe("BattleMech ammunition bins", () => {
    it("counts bin shots from the weapon it feeds and survives export", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        const srm6 = mech.addEquipmentFromTag("srm-6", "is", "lt", false, undefined, "", false, [], undefined, undefined)!;
        const bin = mech.addEquipmentFromTag("ammo-srm-standard", "is", "lt", false, undefined, "", false, [], undefined, undefined)!;
        const weaponIndex = mech.equipmentList.findIndex(item => item.uuid === srm6.uuid);

        // SRM 6: 15 shots per ton (not 100 rounds / 6 tubes).
        expect(mech.getAmmoBinCapacity(bin)).toBe(15);
        expect(mech.getAmmoBinRemaining(bin)).toBe(15);

        mech.selectAmmoBin(srm6.uuid!, bin.uuid!);
        expect(bin.feedsWeaponTag).toBe("srm-6");
        mech.toggleResolved(weaponIndex);
        expect(mech.getAmmoBinRemaining(bin)).toBe(14);

        // The design export keeps which launcher a ton is loaded for; the play export also keeps spent shots.
        const design = new BattleMech(mech.exportJSON(true));
        const designBin = design.equipmentList.find(item => item.uuid === bin.uuid)!;
        expect(designBin.feedsWeaponTag).toBe("srm-6");
        expect(design.getAmmoBinRemaining(designBin)).toBe(15);

        const inPlay = new BattleMech(mech.exportJSON());
        const inPlayBin = inPlay.equipmentList.find(item => item.uuid === bin.uuid)!;
        expect(inPlayBin.feedsWeaponTag).toBe("srm-6");
        expect(inPlay.getAmmoBinRemaining(inPlayBin)).toBe(14);
    });

    it("clamps bins saved with the old round counts to the weapon's shots", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.addEquipmentFromTag("lrm-10", "is", "lt", false, undefined, "", false, [], undefined, undefined);
        const bin = mech.addEquipmentFromTag("ammo-lrm", "is", "lt", false, undefined, "", false, [], undefined, undefined, 120)!;

        expect(bin.tag).toBe("ammo-lrm-standard");
        expect(mech.getAmmoBinRemaining(bin)).toBe(12);
    });

    it("counts family ammo toward BV under the weapon it feeds (TM p.303)", () => {
        const armed = () => {
            const mech = new BattleMech();
            mech.setTech("is");
            mech.addEquipmentFromTag("lrm-10", "is", "lt", false, undefined, "", false, [], undefined, undefined);
            return mech;
        };
        const noAmmo = armed();
        const withAmmo = armed();
        withAmmo.addEquipmentFromTag("ammo-lrm", "is", "lt", false, undefined, "", false, [], undefined, undefined);

        expect(withAmmo.getBattleValue()).toBeGreaterThan(noAmmo.getBattleValue());
        expect(withAmmo.getBVCalcHTML()).toContain("for LRM 10");
    });

    it("counts defensive equipment in the defensive rating, not as weapons (TM p.302)", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.addEquipmentFromTag("is-laser-ams", "is", "lt", false, undefined, "", false, [], undefined, undefined);
        mech.getBattleValue();
        const log = mech.getBVCalcHTML();

        expect(log).toContain("+ Defensive Equipment: Laser AMS");
        expect(log).not.toContain("Weapon Laser AMS");
    });

    it("counts AMS ammunition defensively, capped at the AMS BV (TM p.302)", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        mech.addEquipmentFromTag("clan-ams", "clan", "lt", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("ammo-clan-ams-standard", "clan", "lt", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("ammo-clan-ams-standard", "clan", "lt", false, undefined, "", false, [], undefined, undefined);
        mech.getBattleValue();
        const log = mech.getBVCalcHTML();

        expect(log).toContain("capped (Excessive Ammunition rule)");
        expect(log).toContain("Total Defensive Equipment BV: 64.00"); // 32 AMS + ammo capped at 32
        expect(log).not.toContain("+ Adding Ammunition: AMS");
    });

    it("values a machine gun array at 0.67 x its linked machine guns in the same location (TM p.228)", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.addEquipmentFromTag("machine-gun", "is", "ra", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("machine-gun", "is", "ra", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("machine-gun", "is", "la", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("is-machine-gun-array", "is", "ra", false, undefined, "", false, [], undefined, undefined);
        mech.getBattleValue();

        // Two linked MGs (BV 5 each) in the right arm; the left-arm MG is not linked.
        expect(mech.getBVCalcHTML()).toMatch(/Machine Gun Array \(ra\) - Base BV: 6\.7\b/);
    });

    it("gives one-shot launchers no ammunition and a quarter of their heat for BV (TM p.303)", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        const launcher = mech.addEquipmentFromTag("lrm-10-os", "is", "lt", false, undefined, "", false, [], undefined, undefined)!;
        mech.getBattleValue();

        expect(launcher.isOneShot).toBe(true);
        expect(getWeaponAmmoFamilies(launcher)).toEqual([]);
        expect(mech.equipmentList.find(item => item.tag === "lrm-10-os")!.bvHeat).toBe(1);
    });
});

describe("BattleMech equipment availability", () => {
    const find = (tag: string, rulesLevel: number, eraTag: string, tech = "is") => {
        const mech = new BattleMech();
        mech.setTech(tech);
        mech.setEra(eraTag);
        return mech.getAvailableEquipment(false, rulesLevel).find(eq => eq.tag === tag)!;
    };

    it("offers IO prototypes only at the Experimental rules level", () => {
        // Long Tom Cannon: prototype 3032, production 3079 (IO).
        expect(find("long-tom-cannon", 2, "late-sw-rn").available).toBe(false);
        const experimental = find("long-tom-cannon", 4, "late-sw-rn");
        expect(experimental.available).toBe(true);
        expect(experimental.availableAsPrototype).toBe(true);
        expect(find("long-tom-cannon", 2, "jihad").availableAsPrototype).toBe(false);
    });

    it("applies Clan extinction dates to Star League copies", () => {
        // The Clans fielded the Star League AC/20 until ~2850.
        expect(find("clan-sl-autocannon-standard-d", 2, "early-sw", "clan").available).toBe(true);
        expect(find("clan-sl-autocannon-standard-d", 2, "clan-inv", "clan").available).toBe(false);
    });
});

describe("BattleMech engine construction", () => {
    const engineSlots = (mech: BattleMech, location: "centerTorso" | "leftTorso" | "rightTorso") =>
        mech.getCriticals()[location].filter(item => item?.tag === "engine")
            .reduce((total, item) => total + (item?.crits ?? 1), 0);
    const build = (tonnage: number, walk: number, engine: string, tech = "is", era = "jihad") => {
        const mech = new BattleMech();
        mech.setTech(tech);
        mech.setEra(era);
        mech.setTonnage(tonnage);
        mech.setWalkSpeed(walk);
        mech.setEngineType(engine);
        mech.calcAlphaStrike();
        return mech;
    };

    it("uses the TM p.49 standard fusion weights", () => {
        expect(build(25, 4, "standard").getEngineWeight()).toBe(3); // rating 100
        expect(build(65, 6, "standard").getEngineWeight()).toBe(46); // rating 390
        expect(build(20, 5, "xl").getEngineWeight()).toBe(1.5); // rating 100: 3 x 0.5
    });

    it("rounds internal structure weight up to the half ton by type", () => {
        const structure = (tonnage: number, tag: string, type = "biped") => {
            const mech = build(tonnage, 4, "standard");
            mech.setType(type);
            mech.setTonnage(tonnage);
            mech.setInternalStructureType(tag);
            return mech.getInternalStructureWeight();
        };
        expect(structure(35, "standard")).toBe(3.5);
        expect(structure(35, "endo-steel")).toBe(2); // 1.75 rounds up
        expect(structure(50, "composite")).toBe(2.5);
        expect(structure(50, "endo-composite")).toBe(4); // 3.75 rounds up
        expect(structure(50, "reinforced")).toBe(10);
        expect(structure(50, "industrial")).toBe(10); // twice standard
    });

    it("uses running or jumping heat for BV movement heat, with XXL and Improved jump jet rules", () => {
        const standard = build(50, 5, "standard", "is", "ilClan");
        standard.setJumpSpeed(2);
        expect(standard.getMaxMovementHeat()).toBe(3); // jump heat is at least 3
        standard.setJumpSpeed(5);
        expect(standard.getMaxMovementHeat()).toBe(5);
        standard.setJumpJetType("improved");
        expect(standard.getMaxMovementHeat()).toBe(3); // ceil(5 / 2), minimum 3
        expect(standard.getMaxJumpSpeed()).toBe(standard.getRunSpeed());

        const xxl = build(50, 5, "xxl", "is", "ilClan");
        expect(xxl.getMaxMovementHeat()).toBe(6); // XXL running heat
        xxl.setJumpSpeed(4);
        expect(xxl.getMaxMovementHeat()).toBe(8); // XXL jump heat: 2 per MP, at least 6
    });

    it("offers Improved jump jets by era and keeps them through a save round trip", () => {
        const jumpJets = (tech: string, era: string, rulesLevel = 2) => {
            const mech = build(50, 5, "standard", tech, era);
            return mech.getAvailableJumpJets(rulesLevel).filter(jj => jj.available).map(jj => jj.tag);
        };
        expect(jumpJets("is", "civil-war")).toEqual(["standard", "umu"]); // UMU 3066
        expect(jumpJets("is", "jihad")).toEqual(["standard", "improved", "umu"]);
        expect(jumpJets("clan", "civil-war", 4)).toEqual(["standard", "improved", "umu"]); // Clan prototype 3060

        const mech = build(50, 5, "standard", "is", "jihad");
        mech.setJumpJetType("improved");
        mech.setJumpSpeed(6);
        const copy = new BattleMech();
        copy.importJSON(mech.exportJSON());
        expect(copy.getJumpJetType().tag).toBe("improved");
    });

    it("offers Large engine ratings (over 400) only at the Experimental rules level", () => {
        const mech = build(100, 4, "standard");
        expect(mech.getMaxWalkSpeed(2)).toBe(4); // rating 400
        expect(mech.getMaxWalkSpeed(4)).toBe(5); // rating 500
        expect(build(35, 4, "standard").getMaxWalkSpeed(2)).toBe(11); // 385
    });

    it("rounds gyro weight up to the half ton", () => {
        const mech = build(50, 5, "standard"); // rating 250
        mech.setGyroTypeByName("Extra-light (XL) Gyro");
        expect(mech.getGyroWeight()).toBe(1.5);
        mech.setGyroTypeByName("Compact Gyro");
        expect(mech.getGyroWeight()).toBe(4.5);
        expect(mech.getEngineType().tag).toBe("standard");
    });

    it("applies structure type BV modifiers and keeps Composite Inner Sphere only (TO:AUE p.154)", () => {
        const log = (tag: string) => {
            const mech = build(50, 4, "standard", "is", "ilClan");
            mech.setInternalStructureType(tag);
            mech.getBattleValue();
            return mech.getBVCalcHTML();
        };
        expect(log("reinforced")).toContain("Total Internal Structure BV = 2 x Reinforced Modifier");
        expect(log("composite")).toContain("Total Internal Structure BV = 0.5 x Composite Modifier");
        expect(log("industrial")).toContain("Total Internal Structure BV = 0.5 x Industrial Modifier");

        const clan = new BattleMech();
        clan.setTech("clan");
        clan.setEra("ilClan");
        expect(clan.getAvailableInternalStructures().find(structure => structure.tag === "composite")?.available).toBe(false);
    });

    it("keeps compact engines and their three center torso slots", () => {
        const mech = build(50, 4, "compact");
        expect(mech.getEngineType().tag).toBe("compact");
        expect(engineSlots(mech, "centerTorso")).toBe(3);
    });

    it("gives ICE and fuel cell engines six center torso slots", () => {
        expect(engineSlots(build(50, 4, "ice"), "centerTorso")).toBe(6);
        expect(engineSlots(build(50, 4, "cell"), "centerTorso")).toBe(6);
    });

    it("treats ratings above 400 as large engines (TO:AUE)", () => {
        const mech = build(100, 5, "standard");
        expect(mech.isLargeEngine()).toBe(true);
        expect(engineSlots(mech, "centerTorso")).toBe(8);
        expect(mech.getAvailableEngines().find(engine => engine.tag === "compact")?.available).toBe(false);
    });

    it("reads Alpha Strike structure from the ASC p.98 table", () => {
        expect(build(100, 3, "standard").getAlphaStrikeForceStats().structure).toBe(8);
        expect(build(100, 3, "xl").getAlphaStrikeForceStats().structure).toBe(4);
        expect(build(100, 3, "light").getAlphaStrikeForceStats().structure).toBe(6);
        expect(build(100, 3, "clan_xl", "clan").getAlphaStrikeForceStats().structure).toBe(5);
        expect(build(50, 4, "compact").getAlphaStrikeForceStats().structure).toBe(5);
    });
});

describe("BattleMech heat sink and gyro availability", () => {
    const heatSink = (tech: string, era: string, tag: string, rulesLevel = 2) => {
        const mech = new BattleMech();
        mech.setTech(tech);
        mech.setEra(era);
        return mech.getAvailableHeatSinks(rulesLevel).find(item => item.tag === tag)!;
    };

    it("follows the IO double heat sink windows for each tech base", () => {
        // Inner Sphere: production 2567, lost 2865, recovered 3040.
        expect(heatSink("is", "star-league", "double").available).toBe(true);
        expect(heatSink("is", "late-sw-lt", "double").available).toBe(false);
        expect(heatSink("is", "clan-inv", "double").available).toBe(true);
        // Clan: production 2827.
        expect(heatSink("clan", "early-sw", "double").available).toBe(true);
        expect(heatSink("clan", "late-sw-lt", "double").available).toBe(true);
        expect(heatSink("is", "late-sw-lt", "single").available).toBe(true);
    });

    it("offers Laser heat sinks to Clans and prototype doubles only at Experimental (TO:AUE p.129, IO:AE)", () => {
        expect(heatSink("clan", "clan-inv", "laser").available).toBe(true);
        expect(heatSink("is", "clan-inv", "laser").available).toBe(false);
        expect(heatSink("is", "age-of-war", "double-prototype").available).toBe(false);
        expect(heatSink("is", "age-of-war", "double-prototype", 4).availableAsPrototype).toBe(true);
        expect(heatSink("is", "late-sw-rn", "double-freezers", 4).available).toBe(true);
        expect(heatSink("clan", "late-sw-rn", "double-freezers", 4).available).toBe(false);
    });

    it("prices and rates heat sinks from the selected type", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        mech.setEra("clan-inv");
        mech.setHeatSinksType("laser");
        mech.setAdditionalHeatSinks(2);
        mech.getBattleValue();
        expect(mech.getHeatSyncName()).toBe("Laser Heat Sinks");
        expect(mech.getBVCalcHTML()).toContain("Engine Sinks: 24");
        expect(mech.getCBillCalcHTML()).toContain("6,000 x (Number of Heat Sinks [12])");
    });

    it("weighs and slots Compact heat sinks two per slot with doubled engine capacity (TO:AUE p.128)", () => {
        expect(heatSink("is", "jihad", "compact").available).toBe(true);
        expect(heatSink("clan", "jihad", "compact").available).toBe(false);
        expect(heatSink("is", "clan-inv", "compact", 4).availableAsPrototype).toBe(true);

        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("jihad");
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        mech.setHeatSinksType("compact");
        mech.setAdditionalHeatSinks(10);
        // 200-rated engine holds floor(200 / 25) x 2 = 16 of the 20 sinks; 4 remain, two per slot.
        expect(mech.getEngineHeatSinkCapacity()).toBe(16);
        expect(mech.getHeatSinkCriticalRequirements()).toEqual({ slotsEach: 1, number: 2 });
        expect(mech.getHeatSinksWeight()).toBe(15);
    });

    it("offers XL, Compact and Heavy-Duty gyros to Inner Sphere designs only", () => {
        const gyros = (tech: string) => {
            const mech = new BattleMech();
            mech.setTech(tech);
            mech.setEra("jihad");
            return mech.getAvailableGyros().filter(gyro => gyro.available).map(gyro => gyro.tag);
        };
        expect(gyros("is")).toEqual(["standard", "xl", "compact", "heavy-duty"]);
        expect(gyros("clan")).toEqual(["standard"]);
    });
});

describe("BattleMech internal structure availability", () => {
    const structure = (tech: string, era: string, tag: string) => {
        const mech = new BattleMech();
        mech.setTech(tech);
        mech.setEra(era);
        return mech.getAvailableInternalStructures().find(item => item.tag === tag)!;
    };

    it("follows the IO Endo Steel windows for each tech base", () => {
        // Inner Sphere: production 2487, lost 2850, recovered 3035. Clan: production 2827.
        expect(structure("is", "star-league", "endo-steel").available).toBe(true);
        expect(structure("is", "late-sw-lt", "endo-steel").available).toBe(false);
        expect(structure("clan", "late-sw-lt", "endo-steel").available).toBe(true);
        expect(structure("is", "late-sw-lt", "standard").available).toBe(true);
    });

    it("uses the TechManual structure costs per 'Mech ton", () => {
        expect(structure("is", "jihad", "endo-steel").cost).toBe(1600);
        expect(structure("is", "jihad", "reinforced").cost).toBe(6400);
    });
});

describe("BattleMech variable-size equipment", () => {
    const build = (tonnage: number) => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("jihad");
        mech.setTonnage(tonnage);
        mech.setWalkSpeed(4);
        return mech;
    };
    const add = (mech: BattleMech, tag: string, location = "ra") =>
        mech.addEquipmentFromTag(tag, "is", location, false, undefined, "", false, [], undefined, undefined)!;

    it("sizes a hatchet and sword from the 'Mech's tonnage (TM pp.220, 237)", () => {
        const mech = build(55);
        const hatchet = add(mech, "melee-hatchet");
        const sword = add(mech, "melee-sword", "la");
        mech.getInstalledEquipment();
        expect([hatchet.weight, hatchet.space.battlemech, hatchet.damage, hatchet.battleValue]).toEqual([4, 4, 11, 16.5]);
        // Sword: 55 / 20 = 2.75, rounded up to the half ton.
        expect([sword.weight, sword.space.battlemech, sword.damage]).toEqual([3, 4, 7]);
    });

    it("sizes MASC by tonnage and prices it from the engine rating (TM p.225)", () => {
        const mech = build(55);
        const masc = add(mech, "masc", "rt");
        mech.getInstalledEquipment();
        expect([masc.weight, masc.space.battlemech, masc.cbills]).toEqual([3, 3, 220 * 3 * 1000]);
    });

    it("sizes a targeting computer from direct-fire weapons and raises their BV by 25% (TM pp.238, 303)", () => {
        const mech = build(55);
        add(mech, "large-laser", "ra");
        add(mech, "large-laser", "la");
        add(mech, "medium-laser", "ct");
        const before = mech.getBattleValue();
        const tc = add(mech, "targeting-computer", "rt");
        mech.getInstalledEquipment();
        // 5 + 5 + 1 = 11 tons of direct-fire weapons / 4, rounded up.
        expect([tc.weight, tc.space.battlemech, tc.cbills]).toEqual([3, 3, 30000]);
        expect(mech.hasTargetingComputer()).toBe(true);
        expect(mech.getBattleValue()).toBeGreaterThan(before);
    });
});

describe("BattleMech myomer and MP boosters", () => {
    const build = (tech = "is", era = "jihad") => {
        const mech = new BattleMech();
        mech.setTech(tech);
        mech.setEra(era);
        mech.setTonnage(55);
        mech.setWalkSpeed(5);
        return mech;
    };

    it("offers TSM to the Inner Sphere from 3050 and the prototype only at Experimental (TM p.240, IO:AE p.98)", () => {
        const myomers = (tech: string, era: string, rulesLevel = 2) =>
            build(tech, era).getAvailableMyomerTypes(rulesLevel).filter(m => m.available).map(m => m.tag);
        expect(myomers("is", "jihad")).toEqual(["standard", "tsm", "industrial-tsm"]);
        expect(myomers("clan", "jihad")).toEqual(["standard"]);
        expect(myomers("is", "late-sw-rn", 4)).toContain("prototype-tsm");
    });

    it("spreads TSM slots, prices it and raises the BV weight factor (TM pp.240, 303)", () => {
        const standard = build();
        const tsm = build();
        tsm.setMyomerType("tsm");
        expect(tsm.hasTripleStrengthMyomer()).toBe(true);
        expect(tsm.getUnallocatedCritCount() - standard.getUnallocatedCritCount()).toBe(6);
        expect(tsm.getBVCalcHTML()).toContain("Tonnage modified by 1.5x");
        expect(tsm.getCBillCalcHTML()).toContain("16,000 x Unit Tonnage [55]");
        expect(tsm.getBattleValue()).toBeGreaterThan(standard.getBattleValue());

        const copy = new BattleMech();
        copy.importJSON(tsm.exportJSON());
        expect(copy.getMyomerType().tag).toBe("tsm");
    });

    it("rates running MP with MASC engaged for Battle Value", () => {
        const mech = build();
        const before = mech.getBattleValue();
        mech.addEquipmentFromTag("masc", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        expect(mech.getRunSpeed()).toBe(8);
        expect(mech.getBVRunSpeed()).toBe(10);
        expect(mech.getBattleValue()).toBeGreaterThan(before);
    });
});

describe("BattleMech spread, movement and limb equipment", () => {
    const build = (tonnage = 50, walk = 5, tech = "is", era = "dark-age") => {
        const mech = new BattleMech();
        mech.setTech(tech);
        mech.setEra(era);
        mech.setTonnage(tonnage);
        mech.setWalkSpeed(walk);
        return mech;
    };
    const add = (mech: BattleMech, tag: string, location = "", tech = "is") =>
        mech.addEquipmentFromTag(tag, tech, location, false, undefined, "", false, [], undefined, undefined)!;

    it("places each slot of spread equipment on its own (TO:AUE p.148)", () => {
        const mech = build();
        const before = mech.getUnallocatedCritCount();
        add(mech, "null-signature-system");
        expect(mech.getUnallocatedCritCount() - before).toBe(7);
    });

    it("adds partial wing jump MP without jump heat and +3 heat capacity (TO:AUE p.105)", () => {
        const mech = build(50, 5);
        mech.setJumpSpeed(4);
        const heatBefore = mech.getJumpHeat();
        const wing = add(mech, "partial-wing");
        mech.getInstalledEquipment();
        expect(wing.weight).toBe(3.5);
        expect(mech.getJumpSpeed()).toBe(6);
        expect(mech.getJumpHeat()).toBe(heatBefore);
        expect(mech.getBVCalcHTML()).toBeDefined();
        expect(mech.getPartialWingHeatBonus()).toBe(3);
    });

    it("sizes Mechanical Jump Boosters by chosen MP and keeps the size on save (TO:AUE p.105)", () => {
        const mech = build(55, 5);
        const booster = add(mech, "mechanical-jump-booster");
        mech.setEquipmentSize(booster.uuid, 3);
        mech.getInstalledEquipment();
        // 55 x 3 x 5% = 8.25, rounded up to the half ton.
        expect(booster.weight).toBe(8.5);
        expect(booster.space.battlemech).toBe(4);
        expect(mech.getMechanicalJumpBoosterSpeed()).toBe(3);
        expect(mech.getBVJumpSpeed()).toBe(3);
        const copy = new BattleMech();
        copy.importJSON(mech.exportJSON());
        expect(copy.getMechanicalJumpBoosterSpeed()).toBe(3);
    });

    it("slows 'Mechs carrying medium and large shields (TO:AUE p.103)", () => {
        const medium = build(50, 5);
        medium.setJumpSpeed(4);
        add(medium, "shield-medium", "la");
        expect(medium.getWalkSpeed()).toBe(4);
        expect(medium.getJumpSpeed()).toBe(3);
        const large = build(50, 5);
        large.setJumpSpeed(4);
        add(large, "shield-large", "la");
        expect(large.getJumpSpeed()).toBe(0);
    });

    it("treats UMUs as underwater MP generating 1 heat (TO:AUE p.107)", () => {
        const mech = build(50, 5);
        mech.setJumpJetType("umu");
        mech.setJumpSpeed(3);
        expect(mech.getJumpSpeed()).toBe(0);
        expect(mech.getUMUSpeed()).toBe(3);
        expect(mech.getJumpHeat()).toBe(1);
        expect(mech.getJumpJetWeight()).toBe(1.5);
    });

    it("raises the BV weight factor for AES in an arm (TO:AUE p.91)", () => {
        const mech = build(50, 5);
        const aes = add(mech, "aes-arm", "la");
        mech.getInstalledEquipment();
        expect([aes.weight, aes.space.battlemech]).toEqual([1.5, 2]);
        expect(mech.getAESBVMultiplier()).toBe(1.1);
    });

    it("shows variable equipment sized for the 'Mech in the equipment picker", () => {
        const mech = build(75, 4);
        const masc = mech.getAvailableEquipmentByCatalog("is", false, 2).find(item => item.tag === "masc")!;
        expect([masc.weight, masc.criticals]).toEqual([4, 4]);
    });

    it("limits additional Compact heat sinks by their 1.5-ton weight", () => {
        const mech = build(50, 4, "is", "jihad");
        mech.setHeatSinksType("compact");
        const tons = mech.getRemainingTonnage();
        expect(mech.getMaxAdditionalHeatSinks()).toBe(Math.floor(tons / 1.5));
    });
});

describe("Chassis rules levels, provisional BV, and cost multipliers", () => {
    const cost = (mech: BattleMech) => {
        mech.getCBillCalcHTML();
        return mech.getCBillCostNumeric();
    };

    // IO p.50 (via MegaMek): Standard is tournament play; Ultra-light and Superheavy tonnages are Advanced.
    it("reports the lowest legal rules level for each chassis", () => {
        const level = (type: string, tonnage = 50) => {
            const mech = new BattleMech();
            mech.setType(type);
            mech.setTonnage(tonnage);
            return mech.getRequiredRulesLevel();
        };
        expect(level("biped")).toBe(0);
        expect(level("quad")).toBe(0);
        expect(level("biped", 120)).toBe(3);
    });

    it("hides Advanced and Experimental chassis from Standard play", async () => {
        const { getMechTypeOptionsForRulesLevel } = await import("../data/mech-type-options");
        expect(getMechTypeOptionsForRulesLevel(2).map(option => option.tag)).toEqual(["biped", "quad"]);
        expect(getMechTypeOptionsForRulesLevel(3).map(option => option.tag)).toEqual(["biped", "quad"]);
    });

    it("applies the x1.25 OmniMech cost multiplier", () => {
        const standard = new BattleMech();
        const omni = new BattleMech();
        omni.toggleOmni();
        const html = omni.getCBillCalcHTML();
        expect(html).toContain("1.25 [OmniMech]");
        expect(cost(omni)).toBe(Math.round(cost(standard) * 1.25));
    });

    // TM / IO via MegaMek MekCostCalculator (provisional).
    it("prices Superheavy gyros at the Heavy-Duty rate and IndustrialMechs at 1 + tonnage / 400", () => {
        const superheavy = new BattleMech();
        superheavy.setTonnage(120);
        const superheavyHTML = superheavy.getCBillCalcHTML();
        expect(superheavyHTML).toContain("Gyro: Superheavy");
        expect(superheavyHTML).toContain("500,000 x Gyro Tonnage");

        const industrial = new BattleMech();
        industrial.setInternalStructureType("industrial");
        const industrialHTML = industrial.getCBillCalcHTML();
        expect(industrialHTML).toContain("/ 400) [IndustrialMech]");
        expect(new BattleMech().getCBillCalcHTML()).toContain("/ 100)");
    });
});

describe("OmniMech base chassis pod space", () => {
    const addLaser = (mech: BattleMech, location: "lt" | "rt", key: "leftTorso" | "rightTorso") => {
        const laser = mech.addEquipmentFromTag("medium-laser", "is", "", false, undefined, "", false, [], undefined, undefined)!;
        const fromIndex = mech.unallocatedCriticals.findIndex(item => item?.uuid === laser.uuid);
        expect(mech.moveCritical("un", fromIndex, location, mech.getCriticals()[key].findIndex(item => !item))).toBe(true);
        return laser;
    };

    // MegaMek omniFixedOnly (provisional): MASC and similar gear cannot be pod-mounted.
    it("keeps fixed-only equipment on the base chassis", () => {
        const omni = new BattleMech();
        omni.toggleOmni();
        const masc = omni.addEquipmentFromTag("masc", "is", "", false, undefined, "", false, [], undefined, undefined)!;
        expect(masc.omniFixed).toBe(true);
        omni.setEquipmentFixed(masc.uuid, false);
        expect(masc.omniFixed).toBe(true);
        addLaser(omni, "lt", "leftTorso");
        omni.stripPodEquipment();
        expect(omni.getInstalledEquipment().map(item => item.tag)).toEqual(["masc"]);
    });

    it("excludes fixed equipment from pod space and keeps the flag through save and load", () => {
        const omni = new BattleMech();
        omni.toggleOmni();
        const fixedLaser = addLaser(omni, "lt", "leftTorso");
        addLaser(omni, "rt", "rightTorso");
        const before = omni.getOmniPodSpace();

        omni.setEquipmentFixed(fixedLaser.uuid, true);
        const after = omni.getOmniPodSpace();
        expect(after.locations.leftTorso).toBe(before.locations.leftTorso - 1);
        expect(after.locations.rightTorso).toBe(before.locations.rightTorso);
        expect(after.podTonnage).toBe(before.podTonnage - 1);

        const restored = new BattleMech(omni.exportJSON(true));
        expect(restored.getInstalledEquipment().filter(item => item.omniFixed)).toHaveLength(1);
    });

    it("strips only pod equipment to start a new configuration", () => {
        const omni = new BattleMech();
        omni.toggleOmni();
        const fixedLaser = addLaser(omni, "lt", "leftTorso");
        addLaser(omni, "rt", "rightTorso");
        omni.setEquipmentFixed(fixedLaser.uuid, true);

        expect(omni.stripPodEquipment()).toBe(1);
        expect(omni.getInstalledEquipment().map(item => item.uuid)).toEqual([fixedLaser.uuid]);
    });

    it("has no pods on a standard BattleMech", () => {
        const standard = new BattleMech();
        const laser = addLaser(standard, "lt", "leftTorso");
        standard.setEquipmentFixed(laser.uuid, true);
        expect(laser.omniFixed).toBeUndefined();
        expect(standard.getOmniPodSpace().totalSlots).toBe(0);
    });
});

// OmniMech configurations (user decision 2026-09-28): all configurations live in one design,
// sharing the fixed base chassis, with a picker for the active one.
describe("OmniMech configurations", () => {
    const addTo = (mech: BattleMech, tag: string, location: "lt" | "rt", key: "leftTorso" | "rightTorso") => {
        const item = mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined)!;
        const fromIndex = mech.unallocatedCriticals.findIndex(slot => slot?.uuid === item.uuid);
        expect(mech.moveCritical("un", fromIndex, location, mech.getCriticals()[key].findIndex(slot => !slot))).toBe(true);
        return item;
    };
    const tags = (mech: BattleMech) => mech.getInstalledEquipment().map(item => item.tag).sort();
    const makeOmni = () => {
        const omni = new BattleMech();
        omni.toggleOmni();
        const fixed = addTo(omni, "medium-laser", "lt", "leftTorso");
        omni.setEquipmentFixed(fixed.uuid, true);
        addTo(omni, "small-laser", "rt", "rightTorso");
        return omni;
    };

    it("starts with Prime and swaps pods while keeping the base chassis", () => {
        const omni = makeOmni();
        expect(omni.getOmniConfigurationNames()).toEqual(["Prime"]);
        expect(omni.addOmniConfiguration("A")).toBe(true);
        expect(omni.getActiveOmniConfiguration()).toBe("A");
        expect(tags(omni)).toEqual(["medium-laser"]);
        addTo(omni, "large-laser", "rt", "rightTorso");

        expect(omni.switchOmniConfiguration("Prime")).toBe(true);
        expect(tags(omni)).toEqual(["medium-laser", "small-laser"]);
        expect(omni.getCriticals().rightTorso.some(slot => slot?.tag === "small-laser")).toBe(true);
        expect(omni.switchOmniConfiguration("A")).toBe(true);
        expect(tags(omni)).toEqual(["large-laser", "medium-laser"]);
        expect(omni.getCriticals().rightTorso.some(slot => slot?.tag === "large-laser")).toBe(true);
    });

    it("copies, renames, and deletes configurations and refuses duplicate names", () => {
        const omni = makeOmni();
        expect(omni.addOmniConfiguration("B", true)).toBe(true);
        expect(tags(omni)).toEqual(["medium-laser", "small-laser"]);
        expect(omni.addOmniConfiguration("B")).toBe(false);
        expect(omni.renameOmniConfiguration("B", "C")).toBe(true);
        expect(omni.getOmniConfigurationNames()).toEqual(["Prime", "C"]);
        expect(omni.deleteOmniConfiguration("C")).toBe(true);
        expect(omni.getActiveOmniConfiguration()).toBe("Prime");
        expect(omni.deleteOmniConfiguration("Prime")).toBe(false);
    });

    it("keeps every configuration through save and load and reports per-configuration BV", () => {
        const omni = makeOmni();
        omni.addOmniConfiguration("A");
        addTo(omni, "large-laser", "rt", "rightTorso");
        omni.switchOmniConfiguration("Prime");

        const restored = new BattleMech(omni.exportJSON(true));
        expect(restored.getOmniConfigurationNames()).toEqual(["Prime", "A"]);
        expect(restored.getActiveOmniConfiguration()).toBe("Prime");
        expect(tags(restored)).toEqual(["medium-laser", "small-laser"]);
        restored.switchOmniConfiguration("A");
        expect(tags(restored)).toEqual(["large-laser", "medium-laser"]);

        const stats = omni.getOmniConfigurationStats();
        expect(stats.map(entry => entry.name)).toEqual(["Prime", "A"]);
        expect(stats[1].battleValue).toBeGreaterThan(stats[0].battleValue);
        expect(stats[1].cost).toBeGreaterThan(stats[0].cost);
        expect(omni.getActiveOmniConfiguration()).toBe("Prime");
    });

    it("names the active configuration and clones a chosen one for the roster", () => {
        const omni = makeOmni();
        omni.setModel("Test Omni");
        expect(omni.getName()).toBe("Test Omni");
        omni.addOmniConfiguration("A");
        addTo(omni, "large-laser", "rt", "rightTorso");
        expect(omni.getName()).toBe("Test Omni A");
        omni.switchOmniConfiguration("Prime");
        expect(omni.getName()).toBe("Test Omni Prime");

        // No doubled label when the designation already ends with the configuration name
        omni.setModel("Test Omni Prime");
        expect(omni.getName()).toBe("Test Omni Prime");
        omni.setModel("Test Omni");

        const rosterCopy = omni.cloneOmniConfiguration("A")!;
        expect(rosterCopy.getName()).toBe("Test Omni A");
        expect(tags(rosterCopy)).toEqual(["large-laser", "medium-laser"]);
        expect(new BattleMech(rosterCopy.exportJSON()).getName()).toBe("Test Omni A");
        expect(omni.getActiveOmniConfiguration()).toBe("Prime");
        expect(omni.cloneOmniConfiguration("Z")).toBeNull();
    });

    it("drops stored configurations when Omni is turned off", () => {
        const omni = makeOmni();
        omni.addOmniConfiguration("A");
        omni.toggleOmni();
        expect(omni.getOmniConfigurationNames()).toEqual([]);
        expect(new BattleMech(omni.exportJSON(true)).getOmniConfigurationNames()).toEqual([]);
    });

});

describe("BattleMech", () => {
    it("constructs a default mech that survives a JSON round trip", () => {
        const mech = new BattleMech();
        const exported = mech.exportJSON();

        expect(new BattleMech(exported).exportJSON()).toBe(exported);
    });

    it("imports every bundled SSW mech at its declared tonnage and round-trips it through JSON", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const failedAllocations: string[] = [];
        for (const xml of sswMechs) {
            const info = getSSWXMLBasicInfo(xml)!;
            const label = `${info.name} ${info.model}`;

            const mech = new BattleMech();
            warn.mockClear();
            mech.importSSWXML(xml);
            for (const [message] of warn.mock.calls) {
                if (String(message).startsWith("_allocateCritical failed")) failedAllocations.push(`${label}: ${message}`);
            }
            expect(mech.getTonnage(), label).toBe(+info.tonnage);

            const reimported = new BattleMech(mech.exportJSON());
            expect(reimported.getTonnage(), label).toBe(mech.getTonnage());
            expect(reimported.getName(), label).toBe(mech.getName());
        }
        // Regression: allocation used to match by UUID only, so ~8,300 SSW-import allocations failed (heat sinks etc.).
        expect(failedAllocations).toEqual([]);
        warn.mockRestore();
    }, 120_000); // ~500 full imports; generous for slower phones running Termux

    // Regression: odd Jump MP used to produce a fractional Speed Factor table index and crash the import.
    // TechManual p. 316: MP = Run + round(Jump / 2) = 8 + round(2.5) = 11 -> Speed Factor 1.76.
    it("uses the canonical Speed Factor for odd Jump MP (Griffin GRF-1N)", () => {
        const griffin = sswMechs.find((xml) => /name="Griffin" model="GRF-1N"/.test(xml))!;
        const mech = new BattleMech();
        mech.importSSWXML(griffin);

        expect(mech.getRunSpeed()).toBe(8);
        expect(mech.getJumpSpeed()).toBe(5);
        expect(mech.getBVCalcHTML()).toContain("x 1.7600 [Speed Factor Rating]");
    });

    // Regression: heat sinks get a fresh UUID on every recalculation; allocation must fall back to tag + rear.
    it("places every critical of an imported SSW mech (Griffin GRF-1N)", () => {
        const griffin = sswMechs.find((xml) => /name="Griffin" model="GRF-1N"/.test(xml))!;
        const mech = new BattleMech();
        mech.importSSWXML(griffin);

        expect(mech.getUnallocatedCriticals()).toEqual([]);
    });

    // Regression: setEngine(0) is how reset() and Walk MP 0 clear the engine; it used to log an error and keep the
    // previous engine.
    it("clears the engine when Walk MP is set back to 0", () => {
        const errors = vi.spyOn(console, "error").mockImplementation(() => {});
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        expect(mech.getEngine()?.rating).toBe(200);

        mech.setWalkSpeed(0);
        expect(mech.getEngine()).toBeNull();
        expect(errors).not.toHaveBeenCalled();
        errors.mockRestore();
    });
});

describe("Regressions found by typechecking master", () => {
    // 179803d2 merged "// @ts-expect-error ..." and the following statement onto one line, commenting the code out.
    it("applies a weapon's accuracy modifier to the to-hit number (Clan ER Large Pulse Laser, -1)", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        const weapon = mech.addEquipmentFromTag("er_large_pulse_laser", "clan", "rt", false, undefined, "a", false, [], undefined, undefined)!;
        const weaponIndex = mech.equipmentList.findIndex(item => item.uuid === weapon.uuid);
        const target = { name: "Target", active: true, range: 3, movement: 0, otherMods: 0, jumped: false, primary: true, inRearArc: false };

        const gator = getTargetToHitFromWeapon(mech, weaponIndex, target);
        expect(gator.otherModifiers).toBe(-1);
        expect(gator.otherModifiersExplanation).toContain("Weapon Accuracy Modifier");
    });

    it("exports TRO BBCode for every chassis type without throwing", () => {
        for (const type of ["biped", "quad"]) {
            const mech = new BattleMech();
            mech.setMechType(type);
            expect(mech.makeTROBBCode(), type).toContain("Internal Structure");
        }
    });
});
