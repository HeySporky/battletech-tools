import { describe, expect, it, vi } from "vitest";
import { sswMechs } from "../data/ssw/sswMechs";
import { getSSWXMLBasicInfo } from "../utils/getSSWXMLBasicInfo";
import { BattleMech } from "./battlemech";
import { mechInternalStructureTypes, validateChassisCombination } from "../data/mech-internal-structure-types";
import { getTargetToHitFromWeapon } from "../utils";
import { mechArmorTypes } from "../data/mech-armor-types";
import { getWeaponAmmoFamilies } from "../data/equipment-registry";
import { mechMyomerTypes } from "../data/mech-myomer-types";
import { getLargeEngineType, mechEngineTypes, mechLargeEngineTypes } from "../data/mech-engine-types";
import { mechEngineOptions } from "../data/mech-engine-options";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { mechCockpitTypes } from "../data/mech-cockpit-types";
import { mechCustomEquipmentEnergy } from "../data/mech-custom-equipment-weapons-energy";
import { mechCustomEquipmentMissile } from "../data/mech-custom-equipment-weapons-missile";
import { mechISAmmo } from "../data/mech-is-ammo";
import { mechClanAmmo } from "../data/mech-clan-ammo";
import { mechUniversalAmmo } from "../data/mech-universal-ammo";
import { mechJumpJetTypes } from "../data/mech-jump-jet-types";
import { mechISEquipmentMissiles } from "../data/mech-is-equipment-weapons-missiles";
import { mechClanEquipmentMissile } from "../data/mech-clan-equipment-weapons-missile";
import { mechISEquipmentArtillery } from "../data/mech-is-equipment-weapons-artillery";
import { mechClanEquipmentArtillery } from "../data/mech-clan-equipment-weapons-artillery";
import { mechISEquipmentBallistic } from "../data/mech-is-equipment-weapons-ballistic";
import { mechClanEquipmentBallistic } from "../data/mech-clan-equipment-weapons-ballistic";
import { mechISEquipmentEnergy } from "../data/mech-is-equipment-weapons-energy";
import { mechClanEquipmentEnergy } from "../data/mech-clan-equipment-weapons-energy";
import { mechISEquipmentMisc } from "../data/mech-is-equipment-weapons-misc";
import { mechClanEquipmentMisc } from "../data/mech-clan-equipment-weapons-misc";
import { mechUniversalEquipment } from "../data/mech-universal-equipment";
import { getAvailableTonnagesForMechType, getTonnageBoundsForMechType } from "../data/mech-tonnages";

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
        expect(available.some(item => item.tag === "clan-protomech-myomer-booster")).toBe(false);
        expect(available.every(item => item.space.battlemech >= 0)).toBe(true);
        // ProtoMech Autocannons are not ProtoMech-only: "Available To: BM, IM, PM, CV, SV..." (TO:AUE p.98).
        expect(available.some(item => item.tag === "protomech-autocannon-2")).toBe(true);
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

    // Regression: Best Guess dumped its rounding remainder onto the CT front,
    // pushing CT front + rear past 2x internal structure, so the Step 4 CT (R)
    // dropdown had no option for its value and rendered blank.
    it("keeps Best Guess within every location's armor cap on all chassis types", () => {
        const locations = [
            "head", "centerTorso", "centerTorsoRear", "leftTorso", "leftTorsoRear",
            "rightTorso", "rightTorsoRear", "leftArm", "rightArm", "leftLeg",
            "rightLeg", "centerLeg", "frontLeftLeg", "frontRightLeg",
        ] as const;
        for (const type of ["biped", "quad", "tripod", "lam"]) {
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

        // Swarm-I is an Inner Sphere munition (Batch 12d): the record answers to the tag it was saved under.
        expect(mech.getAlphaStrikeSpecialAmmoOptions().map(ammo => ammo.tag)).toEqual(["ammo-is-lrm-swarm-i"]);
        expect(mech.getAlphaStrikeForceStats().abilities).not.toContain("AOE#");

        expect(mech.setAlphaStrikeSpecialAmmoTag("ammo-lrm-swarm-i")).toBe("ammo-is-lrm-swarm-i");
        expect(mech.getAlphaStrikeForceStats().abilities).toContain("AOE#");

        const restored = new BattleMech(mech.exportJSON(true));
        expect(restored.getAlphaStrikeSpecialAmmoTag()).toBe("ammo-is-lrm-swarm-i");
    });

    it("keeps the special ammunition choice of a design saved before the tag changed", () => {
        const mech = new BattleMech();
        mech.addEquipmentFromTag("ammo-is-lrm-swarm-i", "is", "lt", false, undefined, "", false, [], undefined, undefined);
        mech.setAlphaStrikeSpecialAmmoTag("ammo-is-lrm-swarm-i");
        const saved = JSON.parse(mech.exportJSON(true));
        saved.as_special_ammo_tag = "ammo-lrm-swarm-i";
        for (const item of saved.equipment) {
            if (item.tag === "ammo-is-lrm-swarm-i") item.tag = "ammo-lrm-swarm-i";
        }

        const restored = new BattleMech(JSON.stringify(saved));
        expect(restored.equipmentList.map(item => item.tag)).toEqual(["ammo-is-lrm-swarm-i"]);
        expect(restored.getAlphaStrikeSpecialAmmoTag()).toBe("ammo-is-lrm-swarm-i");
        expect(restored.getAlphaStrikeForceStats().abilities).toContain("AOE#");
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

describe("LAM and QuadVee chassis rules", () => {
    // IO via MegaMek TestMek (provisional): at least 3 Jump MP, walking-MP cap still applies;
    // Standard, Compact, or Heavy-Duty gyros only.
    it("requires LAMs to have at least 3 jump MP and a Standard, Compact, or Heavy-Duty gyro", () => {
        const mech = new BattleMech();
        mech.setType("lam");
        mech.setTonnage(50);
        mech.setWalkSpeed(6);
        mech.setJumpSpeed(0);
        expect(mech.getJumpSpeed()).toBe(3);
        mech.setJumpSpeed(6);
        expect(mech.getJumpSpeed()).toBe(6);
        expect(mech.getChassisEquipmentViolations().some(message => /Jump MP/.test(message))).toBe(false);
        mech.setWalkSpeed(2);
        mech.setJumpSpeed(0);
        expect(mech.getChassisEquipmentViolations().some(message => /at least 3 Jump MP/.test(message))).toBe(true);

        // No jump jet type limit for LAMs (user decision 2026-09-28; MegaMek has none).
        mech.setJumpJetType("improved");
        expect(mech.getJumpJetType().tag).toBe("improved");

        mech.setGyroType("compact");
        expect(mech.getGyro().tag).toBe("compact");
        mech.setGyroType("heavy-duty");
        expect(mech.getGyro().tag).toBe("heavy-duty");
        mech.setGyroType("xl");
        expect(mech.getGyro().tag).toBe("standard");
        expect(mech.getAvailableGyros(4).find(gyro => gyro.tag === "xl")?.available).toBe(false);
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
        // Regression: play mode offered no Jump option to Bipeds with jump jets.
        expect(biped.canUseJumpJetsInCurrentMode()).toBe(true);
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
        // The cockpit sits in the head only (IO:AE record sheets).
        expect(criticals.centerTorso.some(item => item?.tag === "multi-pilot-cockpit")).toBe(false);
    });

    it("accounts for QuadVee conversion weight and dual cockpit weight", () => {
        const biped = new BattleMech();
        const quadvee = new BattleMech();
        quadvee.setType("quadvee");

        expect(quadvee.getCurrentTonnage() - biped.getCurrentTonnage()).toBe(3);
    });

    // IO p.113 (LAM) / p.134 (QuadVee): conversion equipment is 10% of mass, rounded up to a whole ton.
    it("rounds LAM and QuadVee conversion equipment up to a whole ton", () => {
        const conversionWeight = (mech: BattleMech) =>
            mech.getWeightBreakdown().find(entry => /Conversion/.test(entry.name))?.weight;

        const lam = new BattleMech();
        lam.setType("lam");
        lam.setTonnage(55);
        expect(conversionWeight(lam)).toBe(6);
        lam.setTonnage(30);
        expect(conversionWeight(lam)).toBe(3);

        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        quadvee.setTonnage(55);
        expect(conversionWeight(quadvee)).toBe(6);

        expect(conversionWeight(new BattleMech())).toBeUndefined();
    });

    // TRO:3085 pp.286-288 / IO p.113: no Endo Steel, ferro-fibrous (or other slot-occupying
    // armor/structure), Hardened armor, advanced engines, or OmniMech construction for LAMs.
    it("enforces LAM armor, structure, engine, and Omni construction limits", () => {
        const lam = new BattleMech();
        lam.setType("lam");

        lam.setArmorType("ferro-fibrous");
        expect(lam.getArmorType()).toBe("standard");
        lam.setArmorType("hardened");
        expect(lam.getArmorType()).toBe("standard");
        lam.setInternalStructureType("endo-steel");
        expect(lam.getInternalStructureType()).toBe("standard");
        lam.setEngineType("xl");
        expect(lam.getEngineType().tag).toBe("standard");
        lam.setEngineType("compact");
        expect(lam.getEngineType().tag).toBe("compact");
        lam.toggleOmni();
        expect(lam.isOmnimech).toBe(false);

        expect(lam.getAvailableArmorTypes().find(armor => armor.tag === "ferro-fibrous")?.available).toBe(false);
        expect(lam.getAvailableInternalStructures().find(structure => structure.tag === "endo-steel")?.available).toBe(false);
        expect(lam.getAvailableEngines().find(engine => engine.tag === "xl")?.available).toBe(false);
    });

    it("strips illegal components when an existing design is converted to a LAM", () => {
        const mech = new BattleMech();
        mech.setEra("ilClan");
        mech.setArmorType("ferro-fibrous");
        mech.setInternalStructureType("endo-steel");
        mech.setEngineType("xl");
        mech.toggleOmni();
        mech.setType("lam");

        expect(mech.getArmorType()).toBe("standard");
        expect(mech.getInternalStructureType()).toBe("standard");
        expect(mech.getEngineType().tag).toBe("standard");
        expect(mech.isOmnimech).toBe(false);
    });

    // Custom Homebrew Omni-LAM (Kronos Battle Systems fan rule KBS-3066-07-07-TRO3067).
    describe("Custom Homebrew Omni-LAM", () => {
        const makeOmniLAM = () => {
            const lam = new BattleMech();
            lam.setTech("is");
            lam.setType("lam");
            lam.toggleOmni(5);
            return lam;
        };

        it("is only available to Inner Sphere LAMs at the Custom Homebrew rules level", () => {
            const canon = new BattleMech();
            canon.setType("lam");
            canon.toggleOmni(4);
            expect(canon.isOmnimech).toBe(false);

            expect(makeOmniLAM().isOmniLAM()).toBe(true);

            const clan = new BattleMech();
            clan.setTech("clan");
            clan.setType("lam");
            expect(clan.canBeOmniMech(5)).toBe(false);
            clan.toggleOmni(5);
            expect(clan.isOmnimech).toBe(false);

            const omniLAM = makeOmniLAM();
            omniLAM.setTech("clan");
            expect(omniLAM.isOmnimech).toBe(false);
        });

        it("keeps every arm actuator (restriction 3)", () => {
            const lam = makeOmniLAM();
            lam.toggleHandActuator("la");
            lam.toggleLowerArmActuator("ra");
            lam.setTonnage(lam.getTonnage());
            expect(lam.hasHandActuator("la")).toBe(true);
            expect(lam.hasLowerArmActuator("ra")).toBe(true);
            expect(lam.hasHandActuator("ra")).toBe(true);
        });

        it("costs 1.75 times a normal LAM", () => {
            const canon = new BattleMech();
            canon.setTech("is");
            canon.setType("lam");
            canon.getCBillCalcHTML();
            const omni = makeOmniLAM();
            omni.getCBillCalcHTML();
            expect(omni.getCBillCostNumeric()).toBe(Math.round(canon.getCBillCostNumeric() * 1.75));
        });

        it("reports a symmetric empty chassis as balanced with equal pod space", () => {
            expect(makeOmniLAM().getOmniLAMViolations()).toEqual([]);
            expect(new BattleMech().getOmniLAMViolations()).toEqual([]);
        });

        it("requires equal equipment weight on the left and right sides (restriction 1)", () => {
            const lam = makeOmniLAM();
            const place = (location: "lt" | "rt", key: "leftTorso" | "rightTorso") => {
                const laser = lam.addEquipmentFromTag("medium-laser", "is", "", false, undefined, "", false, [], undefined, undefined)!;
                const fromIndex = lam.unallocatedCriticals.findIndex(item => item?.uuid === laser.uuid);
                expect(lam.moveCritical("un", fromIndex, location, lam.getCriticals()[key].findIndex(item => !item))).toBe(true);
            };

            place("lt", "leftTorso");
            expect(lam.getOmniLAMViolations().some(violation => violation.startsWith("Balance"))).toBe(true);
            place("rt", "rightTorso");
            expect(lam.getOmniLAMViolations()).toEqual([]);
        });
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

    it("marks prohibited LAM equipment unavailable (IO p.114)", () => {
        const mech = new BattleMech();
        mech.setType("lam");
        mech.setEra("ilClan");

        const available = (tag: string) => mech.getAvailableEquipment(true).find(item => item.tag === tag)?.available;
        // Needs a Piloting skill to fire, conversion-blocking equipment, or artillery.
        for (const tag of ["gauss-rifle-heavy", "gauss-rifle-heavy-improved", "supercharger", "partial-wing",
            "mechanical-jump-booster", "backhoe", "combine", "bridge-layer-light", "thumper-artillery"]) {
            expect([tag, available(tag)]).toEqual([tag, false]);
        }
        // Physical attack weapons and ordinary weapons stay legal.
        expect(available("melee-hatchet")).toBe(true);
        expect(available("rotary-ac-2")).toBe(true);
    });

    it("applies Tripod cockpit, gyro, Omni, and one-leg stability rules", () => {
        const tripod = new BattleMech();
        tripod.setType("tripod");
        tripod.setWalkSpeed(4);
        tripod.toggleOmni();
        expect(tripod.isOmnimech).toBe(false);
        expect(tripod.getCockpitWeight()).toBe(4);
        expect(tripod.getCriticals().head.some(item => item?.tag === "multi-pilot-cockpit")).toBe(true);
        expect(tripod.getCriticals().centerTorso.some(item => item?.tag === "multi-pilot-cockpit")).toBe(false);
        tripod.takeDamage(100, "ll", false);
        expect(tripod.getWalkSpeed()).toBe(4);
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
        expect(structure(50, "standard", "tripod")).toBe(5.5); // x1.1
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

    it("weighs the Superheavy Gyro as a Heavy-Duty gyro, whatever gyro is selected (IO:AE p.156, IO errata v1.21)", () => {
        // Engine rating / 100 rounded up, then doubled: not rating / 50, which differs whenever the
        // rating is not a multiple of 100.
        expect(build(150, 2, "standard").getGyroWeight()).toBe(6); // rating 300
        expect(build(175, 2, "standard").getGyroWeight()).toBe(8); // rating 350
        expect(build(110, 2, "standard").getGyroWeight()).toBe(6); // rating 220
        const xl = build(150, 2, "standard");
        xl.setGyroTypeByName("Extra-light (XL) Gyro");
        expect(xl.getGyroWeight()).toBe(6);
    });

    it("counts the Superheavy Gyro as a standard gyro for Battle Value (IO:AE p.187)", () => {
        const standard = build(150, 2, "standard");
        const heavyDuty = build(150, 2, "standard");
        heavyDuty.setGyroTypeByName("Heavy Duty Gyro");
        expect(heavyDuty.getBattleValue()).toBe(standard.getBattleValue());
        expect(heavyDuty.getBVCalcHTML()).toContain("Total Gyro BV = 0.5 x Tonnage");
    });

    it("gives the Superheavy Gyro two center torso slots (IO:AE p.156)", () => {
        const gyroSlots = (mech: BattleMech) =>
            mech.getCriticals().centerTorso.filter(item => item?.tag === "gyro")
                .reduce((total, item) => total + (item?.crits ?? 1), 0);
        expect(gyroSlots(build(150, 2, "standard"))).toBe(2);
        expect(gyroSlots(build(100, 2, "standard"))).toBe(4);
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

    // IO:AE p.44 (via MegaMek): Tripods and QuadVees are Advanced, LAMs Experimental; Standard is tournament play.
    it("reports the lowest legal rules level for each chassis", () => {
        const level = (type: string, tonnage = 50) => {
            const mech = new BattleMech();
            mech.setType(type);
            mech.setTonnage(tonnage);
            return mech.getRequiredRulesLevel();
        };
        expect(level("biped")).toBe(0);
        expect(level("quad")).toBe(0);
        expect(level("tripod")).toBe(3);
        expect(level("quadvee")).toBe(3);
        expect(level("lam")).toBe(4);
        expect(level("biped", 120)).toBe(3);

        const omniLAM = new BattleMech();
        omniLAM.setTech("is");
        omniLAM.setType("lam");
        omniLAM.toggleOmni(5);
        expect(omniLAM.getRequiredRulesLevel()).toBe(5);
    });

    it("hides Advanced and Experimental chassis from Standard play", async () => {
        const { getMechTypeOptionsForRulesLevel } = await import("../data/mech-type-options");
        expect(getMechTypeOptionsForRulesLevel(2).map(option => option.tag)).toEqual(["biped", "quad"]);
        expect(getMechTypeOptionsForRulesLevel(3).map(option => option.tag)).toEqual(["biped", "quad", "tripod", "quadvee"]);
        expect(getMechTypeOptionsForRulesLevel(4).map(option => option.tag)).toContain("lam");
    });

    // AirMech Cruise MP = Jump MP x 3, Flank = x1.5 rounded up (IO p.108); flank heat = MP / 3 (IO p.113).
    it("uses AirMech Flank MP for LAM movement heat", () => {
        const lam = new BattleMech();
        lam.setType("lam");
        lam.setWalkSpeed(5);
        lam.setJumpSpeed(3);
        expect(lam.getAirMechCruiseMP()).toBe(9);
        expect(lam.getAirMechFlankMP()).toBe(14);
        expect(lam.getMaxMovementHeat()).toBe(5);
        // Only loaded bombs and the Custom Omni-LAM keep LAM BV provisional; LAM PV stays provisional.
        expect(lam.isBattleValueProvisional()).toBe(false);
        expect(lam.isPointValueProvisional()).toBe(true);
        expect(new BattleMech().isBattleValueProvisional()).toBe(false);
        expect(new BattleMech().isPointValueProvisional()).toBe(false);
    });

    // IO p.192 worked example, Phoenix Hawk LAM: 50 t, Run 8, Jump 5 (AirMech Flank 23), 12 single
    // heat sinks. TMM +5 +1 airborne = +6; heat efficiency 9 + 12 - 8 = 13; speed factor 8 + 12 = 20 -> 3.00.
    it("follows the IO p.192 LAM Battle Value example", () => {
        const lam = new BattleMech();
        lam.setType("lam");
        lam.setTonnage(50);
        lam.setWalkSpeed(5);
        lam.setJumpSpeed(5);
        lam.setAdditionalHeatSinks(2);
        expect(lam.getBVRunSpeed()).toBe(8);
        expect(lam.getAirMechFlankMP()).toBe(23);
        expect(lam.getHeatSinks()).toBe(12);
        expect(lam.getMaxMovementHeat()).toBe(8);
        const log = lam.getBVCalcHTML();
        expect(log).toContain("Best Base TMM: 6");
        expect(log).toContain("Heat Efficiency Capacity Pool:</strong> 13");
        expect(log).toContain("x 3.0000 [Speed Factor Rating]");
    });

    it("applies the x1.25 OmniMech cost multiplier", () => {
        const standard = new BattleMech();
        const omni = new BattleMech();
        omni.toggleOmni();
        const html = omni.getCBillCalcHTML();
        expect(html).toContain("1.25 [OmniMech]");
        expect(cost(omni)).toBe(Math.round(cost(standard) * 1.25));
    });

    it("adds chassis cockpit, structure, and conversion equipment costs", () => {
        const quadvee = new BattleMech();
        quadvee.setType("quadvee");
        const quadveeHTML = quadvee.getCBillCalcHTML();
        expect(quadveeHTML).toContain("QuadVee Cockpit");
        expect(quadveeHTML).toContain("Conversion Equipment");

        const tripodHTML = (() => { const tripod = new BattleMech(); tripod.setType("tripod"); return tripod.getCBillCalcHTML(); })();
        expect(tripodHTML).toContain("Tripod 'Mech Cockpit");
        expect(tripodHTML).toContain("x 1.2 [Tripod]");

        const lamHTML = (() => { const lam = new BattleMech(); lam.setType("lam"); return lam.getCBillCalcHTML(); })();
        expect(lamHTML).toContain("0.75 x (Structure");
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

describe("LAM arm actuators", () => {
    // IO (via MegaMek TestMek): LAMs require upper and lower arm actuators in both arms; hands are optional.
    it("keeps lower arm actuators but allows removing hands", () => {
        const lam = new BattleMech();
        lam.setType("lam");
        lam.toggleLowerArmActuator("la");
        lam.toggleHandActuator("ra");
        lam.setTonnage(lam.getTonnage());
        expect(lam.hasLowerArmActuator("la")).toBe(true);
        expect(lam.hasHandActuator("ra")).toBe(false);
        expect(lam.hasLowerArmActuator("ra")).toBe(true);
    });
});

// Bimodal LAMs: no AirMech mode (IO p.106), 15% conversion weight (IO p.114), x0.65 conversion cost (IO p.186).
describe("Bimodal LAM", () => {
    const makeBimodal = () => {
        const lam = new BattleMech();
        lam.setType("lam");
        lam.setTonnage(30);
        lam.setLAMType("bimodal");
        return lam;
    };

    it("has no AirMech mode or AirMech BV terms", () => {
        const lam = makeBimodal();
        lam.setJumpSpeed(3);
        expect(lam.hasAirMechMode()).toBe(false);
        expect(lam.setTransformationMode("airmech")).toBe("mech");
        expect(lam.setTransformationMode("aerospace")).toBe("aerospace");
        expect(lam.getAirMechFlankMP()).toBe(0);
    });

    it("uses 15% conversion weight and 65% conversion cost", () => {
        const lam = makeBimodal();
        expect(lam.getWeightBreakdown().find(entry => /Conversion/.test(entry.name))?.weight).toBe(5);
        expect(lam.getCBillCalcHTML()).toContain("0.65 x (Structure");
    });

    it("keeps the LAM type through save and load and resets it for other chassis", () => {
        const restored = new BattleMech(makeBimodal().exportJSON(true));
        expect(restored.getLAMType()).toBe("bimodal");
        restored.setType("biped");
        expect(restored.getLAMType()).toBe("standard");
    });
});

// LAM Bomb Bays, bombs, and Fuel Tanks (IO pp.110-114, 192, 220-221). Bomb stats via MegaMek.
describe("LAM bombs and fuel", () => {
    const addTo = (mech: BattleMech, tag: string, location: "lt" | "rt" | "ct" | "la", key: "leftTorso" | "rightTorso" | "centerTorso" | "leftArm") => {
        const item = mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined)!;
        const fromIndex = mech.unallocatedCriticals.findIndex(slot => slot?.uuid === item.uuid);
        expect(mech.moveCritical("un", fromIndex, location, mech.getCriticals()[key].findIndex(slot => !slot))).toBe(true);
        return item;
    };
    const makeLAM = () => {
        const lam = new BattleMech();
        lam.setType("lam");
        lam.setTonnage(50);
        return lam;
    };

    it("offers Bomb Bays and Fuel Tanks only to LAMs, and never lists bombs as mountable", () => {
        const lamTags = makeLAM().getAvailableEquipment().filter(item => item.available).map(item => item.tag);
        expect(lamTags).toEqual(expect.arrayContaining(["lam-bomb-bay", "lam-fuel-tank"]));
        const biped = new BattleMech().getAvailableEquipment();
        expect(biped.find(item => item.tag === "lam-bomb-bay")?.available).toBe(false);
        expect(biped.some(item => item.bombBaySlots)).toBe(false);
    });

    it("adds 80 fuel points per Fuel Tank to the 80 base points", () => {
        const lam = makeLAM();
        expect(lam.getLAMFuelPoints()).toBe(80);
        addTo(lam, "lam-fuel-tank", "lt", "leftTorso");
        expect(lam.getLAMFuelPoints()).toBe(160);
    });

    it("loads bombs only into torso bays, one location per multi-slot bomb", () => {
        const lam = makeLAM();
        expect(lam.setBombCount("ammo-bomb-standard", 1)).toBe(false);
        for (let bay = 0; bay < 3; bay++) addTo(lam, "lam-bomb-bay", "lt", "leftTorso");
        addTo(lam, "lam-bomb-bay", "rt", "rightTorso");
        addTo(lam, "lam-bomb-bay", "la", "leftArm");
        addTo(lam, "lam-bomb-bay", "ct", "centerTorso");
        expect(lam.getBombBayCount()).toBe(6);
        // Bays go only in the left or right torso (IO p.114).
        expect(lam.getBombBaysByLocation()).toEqual({ lt: 3, rt: 1 });
        expect(lam.getChassisEquipmentViolations().find(message => /outside the side torsos/.test(message))).toMatch(/^2 Bomb Bay/);

        // A two-slot Fuel-Air bomb needs two bays in one location.
        expect(lam.setBombCount("ammo-bomb-fuel-air-large", 1)).toBe(true);
        expect(lam.setBombCount("ammo-bomb-standard", 2)).toBe(true);
        expect(lam.getBombLoadoutSlots()).toBe(4);
        expect(lam.setBombCount("ammo-bomb-fuel-air-large", 2)).toBe(false);
        expect(lam.getBombLoadout()).toEqual({ "ammo-bomb-fuel-air-large": 1, "ammo-bomb-standard": 2 });
    });

    it("adds loaded bomb BV after rounding and keeps the loadout through save and load", () => {
        const lam = makeLAM();
        addTo(lam, "lam-bomb-bay", "lt", "leftTorso");
        addTo(lam, "lam-bomb-bay", "rt", "rightTorso");
        lam.clearBombLoadout(); // recalculates with both bays placed
        const unloaded = lam.getBattleValue();
        expect(lam.setBombCount("ammo-bomb-standard", 2)).toBe(true);
        expect(lam.getBattleValue()).toBe(unloaded + 24);

        const restored = new BattleMech(lam.exportJSON(true));
        expect(restored.getBombLoadout()).toEqual({ "ammo-bomb-standard": 2 });
        expect(restored.getBattleValue()).toBe(unloaded + 24);
        restored.setType("biped");
        expect(restored.getBombLoadout()).toEqual({});
    });

    it("counts each Bomb Bay and Fuel Tank slot as explosive ammunition for BV (IO p.192)", () => {
        const penalty = (tag: string) => {
            const lam = makeLAM();
            addTo(lam, tag, "lt", "leftTorso");
            lam.clearBombLoadout();
            return lam.getBVCalcHTML();
        };
        for (const tag of ["lam-bomb-bay", "lam-fuel-tank"]) {
            const log = penalty(tag);
            expect(log).toContain("Explosive Ammo Crit in leftTorso (Inner Sphere, -15)");
            expect(log).not.toMatch(/Explosive Component Crit \((Bomb Bay|Fuel Tank)/);
        }
    });

    it("blocks artillery on LAMs and does not flag separate items in different locations", () => {
        const lam = makeLAM();
        expect(lam.getAvailableEquipment().find(item => item.tag === "thumper-artillery")?.available).toBe(false);
        expect(new BattleMech().getAvailableEquipment().find(item => item.tag === "thumper-artillery")?.available).toBe(true);
        addTo(lam, "lam-bomb-bay", "lt", "leftTorso");
        addTo(lam, "lam-bomb-bay", "rt", "rightTorso");
        expect(lam.getChassisEquipmentViolations().filter(message => /single location/.test(message))).toEqual([]);
    });

    it("raises the rules level for Advanced bombs and passes it to the Alpha Strike unit", () => {
        const lam = makeLAM();
        addTo(lam, "lam-bomb-bay", "lt", "leftTorso");
        expect(lam.calcAlphaStrike().rulesLevel).toBe(4); // LAM chassis: Experimental
        const biped = new BattleMech();
        expect(biped.calcAlphaStrike().rulesLevel).toBe(biped.getRequiredRulesLevel());
        expect(biped.getRequiredRulesLevel()).toBeLessThanOrEqual(2);
        expect(lam.setBombCount("ammo-bomb-inferno", 1)).toBe(true);
        expect(lam.getRequiredRulesLevel()).toBe(4);
    });

    it("gates Advanced bombs behind the Advanced rules level", () => {
        const lam = makeLAM();
        const standardTags = lam.getAvailableBombs(2).map(item => item.tag);
        expect(standardTags).toContain("ammo-bomb-standard");
        expect(standardTags).not.toContain("ammo-bomb-inferno");
        expect(lam.getAvailableBombs(3).map(item => item.tag)).toContain("ammo-bomb-inferno");
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

// Quads keep their front legs in "fll"/"frl". Hit location tables, the record sheet and saves
// made before that change still name them "la"/"ra" (TW p.24: quad front legs replace the arms).
describe("Quad front legs", () => {
    const buildQuad = () => {
        const quad = new BattleMech();
        quad.setType("quad");
        quad.setTonnage(50);
        quad.setWalkSpeed(4);
        quad.setArmorWeight(9.5);
        quad.allocateArmorMax();
        return quad;
    };
    const intactArmor = (quad: BattleMech, location: string, points: number) =>
        Array.from({ length: points }, (_, index) => index).filter(index => !quad.armorDamaged(location, index)).length;

    it("puts front-leg hits into the front leg, not the side torso", () => {
        const quad = buildQuad();
        const frontLeg = quad.getArmorAllocation().frontLeftLeg ?? 0;
        const leftTorso = quad.getArmorAllocation().leftTorso;
        expect(frontLeg).toBeGreaterThan(5);

        quad.takeDamage(5, "la", false);

        expect(intactArmor(quad, "fll", frontLeg)).toBe(frontLeg - 5);
        expect(intactArmor(quad, "la", frontLeg)).toBe(frontLeg - 5);
        expect(intactArmor(quad, "lt", leftTorso)).toBe(leftTorso);
    });

    it("tracks front-leg critical hits under the front-leg location", () => {
        const quad = buildQuad();
        expect(quad.getCriticals().frontRightLeg[0]?.tag).toBe("hip");

        quad.toggleCritical("ra", 0);

        expect(quad.isCriticalDamaged("frl", 0)).toBe(true);
        expect(quad.isCriticalDamaged("ra", 0)).toBe(true);
        expect(quad.criticalDamage.frl).toEqual([0]);
    });

    it("loads a quad saved with its front legs in the arm locations", () => {
        const quad = buildQuad();
        const laser = quad.addEquipmentFromTag("medium-laser", "is", "", false, undefined, "", false, [], undefined, undefined)!;
        const fromIndex = quad.unallocatedCriticals.findIndex(item => item?.uuid === laser.uuid);
        expect(quad.moveCritical("un", fromIndex, "fll", quad.getCriticals().frontLeftLeg.findIndex(item => !item))).toBe(true);
        quad.toggleCritical("fll", 4);
        const current = quad.export(false);

        // The same design as an older save: front legs in the arm locations.
        const legacy = JSON.parse(JSON.stringify(current));
        legacy.armor_allocation.leftArm = legacy.armor_allocation.frontLeftLeg;
        legacy.armor_allocation.rightArm = legacy.armor_allocation.frontRightLeg;
        delete legacy.armor_allocation.frontLeftLeg;
        delete legacy.armor_allocation.frontRightLeg;
        const toArm: Record<string, string> = { fll: "la", frl: "ra" };
        for (const slot of legacy.allocation) slot.loc = toArm[slot.loc] ?? slot.loc;
        for (const item of legacy.equipment) item.loc = toArm[item.loc] ?? item.loc;
        legacy.criticalDamage = { la: legacy.criticalDamage.fll };

        const restored = new BattleMech(JSON.stringify(legacy));

        expect(restored.getArmorAllocation().frontLeftLeg).toBe(current.armor_allocation.frontLeftLeg);
        expect(restored.getArmorAllocation().frontRightLeg).toBe(current.armor_allocation.frontRightLeg);
        expect(restored.getArmorAllocation().leftArm ?? 0).toBe(0);
        expect(restored.getCriticals().frontLeftLeg.some(item => item?.uuid === laser.uuid)).toBe(true);
        expect(restored.isCriticalDamaged("fll", 4)).toBe(true);
        expect(restored.getBattleValue()).toBe(quad.getBattleValue());
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
        for (const type of ["biped", "quad", "tripod"]) {
            const mech = new BattleMech();
            mech.setMechType(type);
            expect(mech.makeTROBBCode(), type).toContain("Internal Structure");
        }
    });
});

describe("Batch 3 myomer catalog", () => {
    const myomer = (tag: string) => mechMyomerTypes.find(item => item.tag === tag);
    const isMisc = (tag: string) => mechISEquipmentMisc.find(item => item.tag === tag);
    const clanMisc = (tag: string) => mechClanEquipmentMisc.find(item => item.tag === tag);

    it("dates standard myomer per IO:AE p.42 and cites TM p.277", () => {
        const standard = myomer("standard");
        expect(standard?.page).toBe(277);
        expect(standard?.prototype).toBe(2300);
        expect(standard?.introduced).toBe(2350);
    });

    it("uses null, not 0, for unknown myomer dates", () => {
        for (const item of mechMyomerTypes) {
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(item.introduced, item.tag).not.toBe(0);
        }
    });

    it("lists Super-Cooled Myomer as an experimental IS prototype (IO:AE p.88)", () => {
        const scm = myomer("risc-super-cooled-myomer");
        expect(scm?.book).toBe("IO:AE");
        expect(scm?.page).toBe(88);
        expect(scm?.techBase).toBe("is");
        expect(scm?.criticals).toBe(6);
        expect(scm?.prototype).toBe(3132);
        expect(scm?.introduced).toBeNull();
        expect(scm?.extinct).toBe(3140);
    });

    it("dates AES production Clan 3108 and IS 3109 (IO:AE p.42)", () => {
        expect(clanMisc("clan-aes-arm")?.introduced).toBe(3108);
        expect(clanMisc("clan-aes-leg")?.introduced).toBe(3108);
        expect(isMisc("aes-arm")?.introduced).toBe(3109);
        expect(isMisc("aes-leg")?.introduced).toBe(3109);
    });

    it("dates supercharger production 3078 (IO:AE p.29)", () => {
        const supercharger = mechUniversalEquipment.find(item => item.tag === "supercharger");
        expect(supercharger?.introduced).toBe(3078);
        expect(supercharger?.extinct).not.toBe(0);
    });

    it("cites MASC to TM p.232", () => {
        expect(isMisc("masc")?.page).toBe(232);
        expect(clanMisc("clan-masc")?.page).toBe(232);
    });

    it("adds the Clan ProtoMech Myomer Booster as ProtoMech-only (TM p.232)", () => {
        const booster = clanMisc("clan-protomech-myomer-booster");
        expect(booster?.space.protomech).toBe(1);
        expect(booster?.space.battlemech).toBe(-1);
        expect(booster?.book).toBe("TM");
        expect(booster?.page).toBe(232);
        expect(booster?.introduced).toBe(3068);
    });
});

describe("Batch 4 engine catalog", () => {
    const engine = (tag: string) => mechEngineTypes.find(item => item.tag === tag);

    it("dates compact and XXL engines from the IO:AE p.38 engine table", () => {
        expect(engine("compact")?.prototype).toBe(3065);
        expect(engine("compact")?.introduced).toBe(3068);
        expect(engine("xxl")?.prototype).toBe(3055);
        expect(engine("xxl")?.introduced).toBe(3110);
        expect(engine("clan_xxl")?.prototype).toBe(2954);
        expect(engine("clan_xxl")?.introduced).toBe(3084);
    });

    it("dates the primitive engine from the IO:AE p.44 primitive 'Mech entry", () => {
        const primitive = engine("primitive");
        expect(primitive?.prototype).toBe(2439);
        expect(primitive?.introduced).toBe(2443);
        expect(primitive?.extinct).toBe(2520);
        expect(primitive?.reintroduced).toBeNull();
        expect(primitive?.book).toBe("IO:AE");
        expect(primitive?.page).toBe(117);
    });

    it("cites a book and page for every engine", () => {
        const pages: Record<string, [string, number]> = {
            standard: ["TM", 214], xl: ["TM", 214], clan_xl: ["TM", 214], light: ["TM", 214], compact: ["TM", 214],
            xxl: ["TO:AUE", 121], clan_xxl: ["TO:AUE", 121],
            ice: ["TM", 215], cell: ["TM", 215], fission: ["TM", 215],
            primitive: ["IO:AE", 117],
        };
        for (const item of mechEngineTypes) {
            expect([item.book, item.page], item.tag).toEqual(pages[item.tag]);
        }
    });

    it("uses null, not 0, for engines that never went extinct", () => {
        for (const item of mechEngineTypes) {
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
        }
    });
});

describe("Batch 5 internal structure catalog", () => {
    const structure = (tag: string) => mechInternalStructureTypes.find(item => item.tag === tag);

    it("dates structures from the IO:AE p.42 universal advancement table", () => {
        expect(structure("standard")?.prototype).toBe(2430);
        expect(structure("standard")?.introduced).toBe(2439);
        expect(structure("composite")?.prototype).toBe(3061);
        expect(structure("composite")?.introduced).toBe(3082);
        expect(structure("endo-composite")?.prototype).toBe(3067);
        expect(structure("endo-composite")?.introduced).toBe(3085);
        expect(structure("endo-composite")?.clanDates?.prototype).toBe(3073);
        expect(structure("reinforced")?.prototype).toBe(3057);
        expect(structure("reinforced")?.introduced).toBe(3084);
        expect(structure("reinforced")?.clanDates?.prototype).toBe(3065);
        expect(structure("industrial")?.prototype).toBe(2300);
        expect(structure("industrial")?.introduced).toBe(2350);
    });

    it("cites a book and page for every structure", () => {
        const pages: Record<string, [string, number]> = {
            standard: ["TM", 225], "endo-steel": ["TM", 224], industrial: ["TM", 224],
            composite: ["TO:AUE", 154], "endo-composite": ["TO:AUE", 154], reinforced: ["TO:AUE", 155],
        };
        for (const item of mechInternalStructureTypes) {
            expect([item.book, item.page], item.tag).toEqual(pages[item.tag]);
        }
    });

    it("uses null, not 0, for structures that never went extinct", () => {
        for (const item of mechInternalStructureTypes) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(item.clanDates?.extinct, item.tag).not.toBe(0);
            expect(item.clanDates?.reintroduced, item.tag).not.toBe(0);
        }
    });
});

describe("Batch 6 armor catalog", () => {
    const armor = (tag: string) => mechArmorTypes.find(item => item.tag === tag);

    it("dates armor from the IO:AE pp.29-30 universal advancement table", () => {
        // tag: [prototype, production, extinct, reintroduced]
        const dates: Record<string, [number | undefined, number | null, number | null, number | null]> = {
            "standard": [2460, 2470, null, null],
            "ferro-fibrous": [2557, 2571, 2810, 3040],
            "light-ferro-fibrous": [3055, 3067, null, null],
            "heavy-ferro-fibrous": [3056, 3069, null, null],
            "stealth-basic": [3051, 3063, null, null],
            "hardened": [3047, 3081, null, null],
            "laser-reflective": [3058, 3080, null, null],
            "reactive": [3063, 3081, null, null],
            "ferro-lamellor": [3070, 3109, null, null],
            "ballistic-reinforced": [3120, 3131, null, null],
            "primitive": [2430, 2439, null, null],
            "ferro-aluminum": [2557, 2571, 2810, 3040],
            "commercial": [2290, 2300, null, null],
            "modular": [3072, 3096, null, null],
            "mimetic": [3058, 3061, null, null],
            "stealth-improved": [3055, 3057, null, null],
            "protomech-standard": [3055, 3060, null, null],
            "heat-dissipating": [3111, 3123, null, null],
            "impact-resistant": [3092, 3103, null, null],
            "anti-penetrative-ablation": [3105, 3114, null, null],
        };
        for (const [tag, expected] of Object.entries(dates)) {
            const item = armor(tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced], tag).toEqual(expected);
        }
        // Patchwork is a pre-spaceflight practice with no prototype year; production 3075 (IO:AE p.45).
        expect(armor("patchwork")?.introduced).toBe(3075);
        // Recovered prototype ferro-fibrous: 3034 (IO:AE p.97); the Star League prototype ends at production in 2571.
        expect([armor("ferro-fibrous-prototype")?.prototype, armor("ferro-fibrous-prototype")?.introduced]).toEqual([2557, null]);
    });

    it("keeps separate Clan dates where IO:AE prints a Clan row or note", () => {
        expect(armor("ferro-fibrous")?.clanDates).toEqual({ prototype: 2820, introduced: 2825, extinct: null, reintroduced: null });
        expect(armor("ferro-aluminum")?.clanDates).toEqual({ prototype: 2820, introduced: 2825, extinct: null, reintroduced: null });
        expect(armor("hardened")?.clanDates).toEqual({ prototype: 3061, introduced: 3081, extinct: null, reintroduced: null });
        expect(armor("laser-reflective")?.clanDates).toEqual({ prototype: 3061, introduced: 3080, extinct: null, reintroduced: null });
        expect(armor("reactive")?.clanDates).toEqual({ prototype: 3065, introduced: 3081, extinct: null, reintroduced: null });
        expect(armor("modular")?.clanDates).toEqual({ prototype: 3074, introduced: 3096, extinct: null, reintroduced: null });
        // No Clan prototype is published for these two; only a Clan introduction year.
        expect(armor("heat-dissipating")?.clanDates).toEqual({ introduced: 3126, extinct: null, reintroduced: null });
        expect(armor("stealth-improved")?.clanDates).toEqual({ introduced: 3058, extinct: null, reintroduced: null });
    });

    it("cites a book and page for every armor", () => {
        const pages: Record<string, [string, number]> = {
            "standard": ["TM", 205], "ferro-fibrous": ["TM", 205], "light-ferro-fibrous": ["TM", 205],
            "heavy-ferro-fibrous": ["TM", 205], "stealth-basic": ["TM", 206], "ferro-aluminum": ["TM", 205],
            "commercial": ["TM", 205], "protomech-standard": ["TM", 205],
            "mimetic": ["TM", 253], "stealth-improved": ["TM", 252],
            "hardened": ["TO:AUE", 93], "laser-reflective": ["TO:AUE", 93], "reactive": ["TO:AUE", 94],
            "ferro-lamellor": ["TO:AUE", 92], "modular": ["TO:AUE", 93], "patchwork": ["TO:AUE", 189],
            "primitive": ["IO:AE", 118], "ferro-fibrous-prototype": ["IO:AE", 66],
            "anti-penetrative-ablation": ["IO:AE", 80], "ballistic-reinforced": ["IO:AE", 81],
            "heat-dissipating": ["IO:AE", 81], "impact-resistant": ["IO:AE", 81],
        };
        for (const item of mechArmorTypes) {
            if (!(item.tag in pages)) continue;
            expect([item.book, item.page], item.tag).toEqual(pages[item.tag]);
        }
        for (const item of mechArmorTypes) {
            expect(item.book, item.tag).toBeTruthy();
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("uses null, not 0, for armor that never went extinct", () => {
        for (const item of mechArmorTypes) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(item.clanDates?.extinct, item.tag).not.toBe(0);
            expect(item.clanDates?.reintroduced, item.tag).not.toBe(0);
        }
    });

    it("matches the published points per ton and cost for IndustrialMech and ProtoMech armor", () => {
        // TM p.72: Commercial armor multiplies the 16 base points by 1.5; TM p.278: 3,000 C-bills per ton.
        expect(armor("commercial")?.armorMultiplier).toEqual({ clan: 24, is: 24 });
        expect(armor("commercial")?.costMultiplier).toBe(3000);
        // TM p.86: each ProtoMech armor point weighs 50 kg, so 20 points per ton.
        expect(armor("protomech-standard")?.armorMultiplier.clan).toBe(20);
    });

    it("restricts heat-dissipating, impact-resistant and primitive armor to the unit types their rules list", () => {
        // IO:AE pp.81-82: "Available to: BM, IM"; the Advanced Armor Table shows N/A for vehicles and fighters.
        for (const tag of ["heat-dissipating", "impact-resistant"]) {
            expect(armor(tag)?.unitTypes.battlemech, tag).toBe(true);
            expect(armor(tag)?.unitTypes.combatVehicle, tag).toBe(false);
            expect(armor(tag)?.unitTypes.supportVehicle, tag).toBe(false);
        }
        // IO:AE p.115: primitive combat vehicles use support vehicle armor, not Primitive Armor.
        expect(armor("primitive")?.unitTypes.combatVehicle).toBe(false);
        expect(armor("primitive")?.unitTypes.supportVehicle).toBe(false);
    });
});

describe("Batch 6b vehicle and ProtoMech armor", () => {
    const armor = (tag: string) => mechArmorTypes.find(item => item.tag === tag);

    it("keeps BattleMech Stealth armor off vehicles (TM p.206)", () => {
        expect(armor("stealth-basic")?.unitTypes.battlemech).toBe(true);
        expect(armor("stealth-basic")?.unitTypes.combatVehicle).toBe(false);
    });

    it("lists Vehicular Stealth for vehicles and fighters only (TO:AUE p.94)", () => {
        const stealth = armor("vehicular-stealth");
        expect(stealth?.unitTypes).toMatchObject({ battlemech: false, combatVehicle: true, supportVehicle: true, aerospaceFighter: true });
        expect(stealth?.armorMultiplier).toEqual({ clan: 0, is: 16 });
        expect(stealth?.costMultiplier).toBe(50000);
        expect([stealth?.prototype, stealth?.introduced, stealth?.extinct, stealth?.reintroduced]).toEqual([3067, 3084, null, null]);
        expect([stealth?.book, stealth?.page]).toEqual(["TO:AUE", 94]);

        const mech = new BattleMech();
        mech.setEra("ilClan");
        mech.setArmorType("vehicular-stealth");
        expect(mech.getArmorType()).toBe("standard");
    });

    it("lists Electric Discharge ProtoMech armor as a ProtoMech-only prototype (IO:AE pp.58-59)", () => {
        const edp = armor("protomech-edp");
        expect(Object.entries(edp?.unitTypes ?? {}).filter(([, legal]) => legal).map(([type]) => type)).toEqual(["protomech"]);
        // 75 kg per point.
        expect(edp?.armorMultiplier).toEqual({ clan: 1000 / 75, is: 0 });
        expect([edp?.prototype, edp?.introduced, edp?.extinct, edp?.reintroduced]).toEqual([3071, null, 3085, null]);
        expect([edp?.book, edp?.page]).toEqual(["IO:AE", 58]);
    });
});

describe("Batch 7 heat sink catalog", () => {
    const sink = (tag: string) => mechHeatSinkTypes.find(item => item.tag === tag);

    it("dates heat sinks from TM p.220 and the IO:AE p.36 advancement table", () => {
        // TM p.220: "Introduced: Circa 2022 (Western Alliance, Terra)"; IO:AE lists them as Early Spaceflight.
        expect(sink("single")?.introduced).toBe(2022);
        expect([sink("double")?.prototype, sink("double")?.introduced, sink("double")?.extinct, sink("double")?.reintroduced]).toEqual([2559, 2567, 2865, 3040]);
        expect(sink("double")?.clanDates).toEqual({ prototype: 2825, introduced: 2827, extinct: null, reintroduced: null });
        expect(sink("laser")?.clanDates).toEqual({ prototype: 3040, introduced: 3051, extinct: null, reintroduced: null });
        expect([sink("compact")?.prototype, sink("compact")?.introduced]).toEqual([3058, 3079]);
    });

    it("cites a book and page for every heat sink", () => {
        const pages: Record<string, [string, number]> = {
            single: ["TM", 220], double: ["TM", 221], laser: ["TO:AUE", 129], compact: ["TO:AUE", 128],
            "double-prototype": ["IO:AE", 65], "double-freezers": ["IO:AE", 96],
        };
        for (const item of mechHeatSinkTypes) {
            expect([item.book, item.page], item.tag).toEqual(pages[item.tag]);
        }
    });

    it("uses null, not 0, for heat sinks that never went extinct", () => {
        for (const item of mechHeatSinkTypes) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(item.clanDates?.extinct, item.tag).not.toBe(0);
            expect(item.clanDates?.reintroduced, item.tag).not.toBe(0);
        }
    });
});

describe("Batch 8 cockpit catalog", () => {
    const cockpit = (tag: string) => mechCockpitTypes.find(item => item.tag === tag);
    const chassis = (type: string, tonnage: number) => {
        const mech = new BattleMech();
        mech.setEra("ilClan");
        mech.setType(type);
        mech.setTonnage(tonnage);
        return mech;
    };

    it("weighs the superheavy tripod cockpit at 5 tons (IO:AE pp.156, 159)", () => {
        expect(chassis("tripod", 150).getCockpitWeight()).toBe(5);
        expect(chassis("tripod", 100).getCockpitWeight()).toBe(4);
        expect(chassis("biped", 150).getCockpitWeight()).toBe(4);
    });

    it("prices chassis cockpits from the catalog without a provisional label (IO:AE pp.215, 217)", () => {
        const html = chassis("tripod", 150).getCBillCalcHTML();
        expect(html).toContain("<strong>Superheavy Tripod 'Mech Cockpit</strong></td><td>500,000</td>");
        expect(chassis("biped", 150).getCBillCalcHTML()).toContain("<strong>Superheavy BattleMech Cockpit</strong></td><td>300,000</td>");
        expect(chassis("quadvee", 60).getCBillCalcHTML()).toContain("<strong>QuadVee Cockpit</strong></td><td>375,000</td>");
        expect(chassis("tripod", 60).getCBillCalcHTML()).toContain("<strong>Tripod 'Mech Cockpit</strong></td><td>400,000</td>");
    });

    it("lists every 'Mech cockpit with its published weight and cost", () => {
        // tag: [tons, C-bills]
        const stats: Record<string, [number, number]> = {
            "standard": [3, 200000], "small": [2, 175000],                                  // TM pp.211, 277
            "industrial": [3, 100000], "industrial-advanced-fire-control": [3, 200000],     // TM pp.211, 277
            "primitive": [5, 200000], "primitive-industrial": [5, 100000],                  // IO:AE p.117
            "torso-mounted": [4, 750000], "command-console": [3, 500000],                   // TO:AUE pp.112-113, 219
            "interface": [4, 1500000],                                                      // IO:AE pp.110, 213
            "direct-neural-interface": [0, 500000],                                         // IO:AE pp.62, 213
            "quadvee": [4, 375000], "tripod": [4, 400000],                                  // IO:AE pp.128, 159, 215, 217
            "superheavy": [4, 300000], "superheavy-industrial": [4, 200000],                // IO:AE pp.156, 215
            "superheavy-tripod": [5, 500000],                                               // IO:AE pp.156, 217
        };
        expect(mechCockpitTypes.map(item => item.tag).sort()).toEqual(Object.keys(stats).sort());
        for (const item of mechCockpitTypes) {
            expect([item.weight, item.cost], item.tag).toEqual(stats[item.tag]);
        }
    });

    it("dates cockpits from the IO:AE p.33-34 universal advancement table", () => {
        // tag: [prototype, production, extinct, reintroduced]
        const dates: Record<string, [number | undefined, number | null, number | null, number | null]> = {
            "standard": [2468, 2470, null, null],
            "small": [3060, 3067, null, null],
            "industrial": [2469, 2470, null, null],
            "industrial-advanced-fire-control": [2469, 2470, null, null],
            "primitive": [2430, 2439, 2520, null],
            "primitive-industrial": [2300, 2350, 2520, null],
            "torso-mounted": [3053, 3080, null, null],
            "command-console": [2625, 2631, 2850, 3030],
            "interface": [3074, null, null, null],
            "direct-neural-interface": [3052, 3055, null, null],
            "quadvee": [3130, 3135, null, null],
            "tripod": [2590, 2602, null, null],
            "superheavy": [3060, 3076, null, null],
            "superheavy-industrial": [2905, 2940, null, null],
            "superheavy-tripod": [3130, 3135, null, null],
        };
        for (const item of mechCockpitTypes) {
            expect([item.prototype, item.introduced, item.extinct, item.reintroduced], item.tag).toEqual(dates[item.tag]);
        }
        expect(cockpit("small")?.clanDates).toEqual({ introduced: 3080, extinct: null, reintroduced: null });
        expect(cockpit("torso-mounted")?.clanDates).toEqual({ prototype: 3055, introduced: 3080, extinct: null, reintroduced: null });
        // The Clans never lost the Command Console; only the Inner Sphere did (IO:AE p.33).
        expect(cockpit("command-console")?.clanDates).toEqual({ introduced: 2631, extinct: null, reintroduced: null });
        expect(cockpit("interface")?.clanDates).toEqual({ prototype: 3083, introduced: null, extinct: null, reintroduced: null });
    });

    it("cites a book and page for every cockpit and marks what the builder supports", () => {
        const pages: Record<string, [string, number]> = {
            "standard": ["TM", 211], "small": ["TM", 211], "industrial": ["TM", 211], "industrial-advanced-fire-control": ["TM", 211],
            "primitive": ["IO:AE", 117], "primitive-industrial": ["IO:AE", 117],
            "torso-mounted": ["TO:AUE", 113], "command-console": ["TO:AUE", 113],
            "interface": ["IO:AE", 110], "direct-neural-interface": ["IO:AE", 62],
            "quadvee": ["IO:AE", 128], "tripod": ["IO:AE", 159],
            "superheavy": ["IO:AE", 156], "superheavy-industrial": ["IO:AE", 156], "superheavy-tripod": ["IO:AE", 156],
        };
        for (const item of mechCockpitTypes) {
            expect([item.book, item.page], item.tag).toEqual(pages[item.tag]);
        }
        expect(mechCockpitTypes.filter(item => item.constructionStatus === "implemented").map(item => item.tag).sort())
            .toEqual(["quadvee", "small", "standard", "superheavy", "superheavy-tripod", "tripod"]);
        // Small (TM p.304) and Torso-Mounted (TO:AUE p.193) cockpits multiply the final BV by 0.95.
        expect(cockpit("small")?.bvMultiplier).toBe(0.95);
        expect(cockpit("torso-mounted")?.bvMultiplier).toBe(0.95);
    });
});

describe("Batch 9a misc equipment catalogs", () => {
    it("dates and cites the is records (IO:AE pp.29-39)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "ew-equipment": [3020, 3025, 3046, null, "TO:AUE", 123],
            "c3-computer-slave": [3039, 3050, null, null, "TM", 209],
            "c3-computer-master": [3039, 3050, null, null, "TM", 209],
            "ecm-suite": [2595, 2597, 2845, 3045, "TM", 213],
            "case": [2452, 2476, 2840, 3036, "TM", 210],
            "modular-armor": [3072, 3096, null, null, "TO:AUE", 93],
            "is-tag": [2593, 2600, 2835, 3044, "TM", 238],
            "prototype-tag": [2593, null, 2600, null, "IO:AE", 67],
            "c3-boosted-master": [3071, 3100, null, null, "TO:AUE", 110],
            "beagle-active-probe": [2560, 2576, 2835, 3045, "TM", 204],
            "beagle-active-probe-prototype": [2560, null, 2576, null, "IO:AE", 65],
            "bloodhound-active-probe": [3058, 3082, null, null, "TO:AUE", 90],
            "guardian-ecm-prototype": [2595, null, 2597, null, "IO:AE", 66],
            "angel-ecm": [3057, 3080, null, null, "TO:AUE", 91],
            "c3i-computer": [3052, 3062, 3085, null, "TM", 209],
            "c3-boosted-slave": [3071, 3100, null, null, "TO:AUE", 110],
            "c3-emergency-master": [3071, 3099, null, null, "TO:AUE", 110],
            "case-prototype": [2452, null, 2476, null, "IO:AE", 65],
            "case-ii": [3064, 3082, null, null, "TO:AUE", 111],
            "a-pod": [undefined, 3055, null, null, "TM", 205],
            "mass": [3048, 3083, null, null, "TO:AUE", 137],
            "harjel": [3067, 3115, null, null, "TO:AUE", 100],
            "null-signature-system": [2615, 2630, 2790, 3110, "TO:AUE", 148],
            "void-signature-system": [3070, 3085, null, null, "TO:AUE", 161],
            "chameleon-lps": [2630, null, 2790, 3099, "TO:AUE", 112],
            "masc": [2730, 2740, 2795, 3035, "TM", 232],
            "targeting-computer": [3052, 3062, null, null, "TM", 238],
            "melee-chain-whip": [3071, 3084, null, null, "TO:AUE", 101],
            "melee-flail": [3057, 3079, null, null, "TO:AUE", 101],
            "shield-small": [3067, 3079, null, null, "TO:AUE", 103],
            "shield-medium": [3067, 3079, null, null, "TO:AUE", 103],
            "shield-large": [3067, 3079, null, null, "TO:AUE", 103],
            "spikes": [3051, 3082, null, null, "TO:AUE", 103],
            "melee-vibroblade-small": [3065, 3091, null, null, "TO:AUE", 104],
            "melee-vibroblade-medium": [3065, 3091, null, null, "TO:AUE", 104],
            "melee-vibroblade-large": [3066, 3091, null, null, "TO:AUE", 104],
            "melee-mace": [3061, 3079, null, null, "TO:AUE", 102],
            "melee-lance": [3064, 3083, null, null, "TO:AUE", 102],
            "melee-claw": [3050, 3060, null, null, "TO:AUE", 101],
            "melee-retractable-blade": [2400, 2420, null, null, "TM", 237],
            "partial-wing": [3074, 3085, null, null, "TO:AUE", 105],
            "mechanical-jump-booster": [3060, 3083, null, null, "TO:AUE", 105],
            "aes-arm": [3070, 3109, null, null, "TO:AUE", 91],
            "aes-leg": [3070, 3109, null, null, "TO:AUE", 91],
            "blue-shield": [3053, null, null, null, "TO:AUE", 108],
            "radical-heat-sink-system": [3115, 3122, null, null, "IO:AE", 83],
            "risc-emergency-coolant-system": [3136, null, 3140, null, "IO:AE", 86],
            "remote-sensor-dispenser-prototype": [2586, null, 2590, null, "IO:AE", 67],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechISEquipmentMisc.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the is records", () => {
        for (const item of mechISEquipmentMisc) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("dates and cites the clan records (IO:AE pp.29-39)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "clan-active-probe": [2830, 2832, null, null, "TM", 204],
            "clan-ecm-system": [2830, 2832, null, null, "TM", 213],
            "clan-tag": [2828, 2830, null, null, "TM", 238],
            "clan-light-tag": [3051, 3054, null, null, "TM", 238],
            "clan-light-active-probe": [2890, 2900, null, null, "TM", 204],
            "clan-angel-ecm": [3058, 3080, null, null, "TO:AUE", 91],
            "clan-watchdog-cews": [3059, 3080, null, null, "TO:AUE", 90],
            "clan-case-ii": [3062, 3082, null, null, "TO:AUE", 111],
            "clan-a-pod": [2845, 2850, null, null, "TM", 205],
            "clan-mass": [3062, 3083, null, null, "TO:AUE", 137],
            "clan-harjel": [3059, 3115, null, null, "TO:AUE", 100],
            "clan-masc": [2820, 2827, null, null, "TM", 232],
            "clan-targeting-computer": [2850, 2860, null, null, "TM", 238],
            "clan-melee-claw": [undefined, 3090, null, null, "TO:AUE", 101],
            "clan-partial-wing": [3067, 3085, null, null, "TO:AUE", 105],
            "clan-aes-arm": [3070, 3108, null, null, "TO:AUE", 91],
            "clan-aes-leg": [3070, 3108, null, null, "TO:AUE", 91],
            "clan-talons": [3072, 3087, null, null, "TO:AUE", 103],
            "clan-nova-cews": [3065, null, 3085, null, "IO:AE", 60],
            "clan-protomech-myomer-booster": [3066, 3068, null, null, "TM", 232],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechClanEquipmentMisc.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the clan records", () => {
        for (const item of mechClanEquipmentMisc) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("prices Modular Armor at 10,000 C-bills per ton (TO:AUE p.217)", () => {
        expect(mechISEquipmentMisc.find(item => item.tag === "modular-armor")?.cbills).toBe(10000);
    });
});

describe("Batch 9b universal equipment catalog", () => {
    it("dates and cites the universal records (IO:AE pp.29-42)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "nail-gun": [2309, 2310, null, null, "TM", 246],
            "thumper-artillery": [undefined, 1950, null, null, "TO:AUE", 96],
            "long-tom-artillery": [2445, 2500, null, null, "TO:AUE", 96],
            "sniper-artillery": [undefined, 1950, null, null, "TO:AUE", 96],
            "vehicle-flamer": [undefined, 1950, null, null, "TM", 218],
            "fluid-gun": [undefined, 1950, null, null, "TO:AUE", 125],
            "supercharger": [undefined, 3078, null, null, "TO:AUE", 157],
            "backhoe": [undefined, 1950, null, null, "TM", 241],
            "bridge-layer-light": [undefined, 1950, null, null, "TM", 242],
            "bridge-layer-medium": [undefined, 1950, null, null, "TM", 242],
            "bridge-layer-heavy": [undefined, 1950, null, null, "TM", 242],
            "chainsaw": [undefined, 1950, null, null, "TM", 242],
            "combine": [undefined, 1950, null, null, "TM", 243],
            "dual-saw": [undefined, 1950, null, null, "TM", 243],
            "pile-driver": [undefined, 1950, null, null, "TM", 244],
            "lift-hoist": [undefined, 1950, null, null, "TM", 245],
            "mining-drill": [undefined, 1950, null, null, "TM", 246],
            "rock-cutter": [undefined, 1950, null, null, "TM", 247],
            "salvage-arm": [2400, 2415, null, null, "TM", 248],
            "spot-welder": [2312, 2320, null, null, "TM", 248],
            "wrecking-ball": [undefined, 1950, null, null, "TM", 249],
            "tracks": [2430, 2440, null, null, "TM", 249],
            "environmental-sealing": [2300, 2350, null, null, "TM", 216],
            "remote-sensor-dispenser": [2586, 2590, null, null, "TM", 236],
            "searchlight": [undefined, 1950, null, null, "TM", 237],
            "lam-bomb-bay": [2680, 2684, null, null, "IO", 114],
            "lam-fuel-tank": [undefined, 2100, null, null, "IO", 221],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechUniversalEquipment.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the universal records", () => {
        for (const item of mechUniversalEquipment) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });
});

describe("Batch 10a energy weapon catalogs", () => {
    it("dates and cites the isEnergy records (IO:AE pp.29-40)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "blazer": [2812, 3077, null, null, "TO:AUE", 131],
            "bombast-laser": [3064, 3085, null, null, "TO:AUE", 132],
            "cws": [2762, null, 2770, null, "IO:AE", 79],
            "er-flamer": [undefined, 3070, null, null, "TO:AUE", 124],
            "er-large-laser": [2610, 2620, 2950, 3037, "TM", 226],
            "er-medium-laser": [3052, 3058, null, null, "TM", 226],
            "er-ppc": [2740, 2751, 2860, 3037, "TM", 234],
            "er-small-laser": [3052, 3058, null, null, "TM", 226],
            "heavy-flamer": [undefined, 3068, null, null, "TO:AUE", 124],
            "heavy-ppc": [3062, 3067, null, null, "TM", 234],
            "large-laser": [2306, 2316, null, null, "TM", 226],
            "large-pulse-laser": [2595, 2609, 2950, 3037, "TM", 226],
            "large-re-engineered-laser": [3120, 3130, null, null, "IO:AE", 83],
            "large-vspl": [3070, 3072, null, null, "TO:AUE", 133],
            "large-x-pulse-laser": [3057, 3078, null, null, "TO:AUE", 133],
            "is-laser-ams": [3059, 3079, null, null, "TO:AUE", 134],
            "light-ppc": [3064, 3067, null, null, "TM", 234],
            "medium-laser": [2290, 2300, null, null, "TM", 226],
            "medium-pulse-laser": [2595, 2609, 2950, 3037, "TM", 226],
            "medium-re-engineered-laser": [3120, 3130, null, null, "IO:AE", 83],
            "medium-vspl": [3070, 3072, null, null, "TO:AUE", 133],
            "medium-x-pulse-laser": [3057, 3078, null, null, "TO:AUE", 133],
            "plasma-rifle": [3061, 3068, null, null, "TM", 235],
            "small-laser": [2290, 2300, null, null, "TM", 226],
            "small-pulse-laser": [2595, 2609, 2950, 3037, "TM", 226],
            "small-re-engineered-laser": [3120, 3130, null, null, "IO:AE", 83],
            "small-vspl": [3070, 3072, null, null, "TO:AUE", 133],
            "small-x-pulse-laser": [3057, 3078, null, null, "TO:AUE", 133],
            "snub-nose-ppc": [2779, 2784, 2790, 3067, "TM", 234],
            "standard-flamer": [undefined, 1950, null, null, "TM", 218],
            "standard-ppc": [2440, 2460, null, null, "TM", 234],
            "primitive-prototype-large-laser": [2306, null, 2316, null, "IO:AE", 112],
            "primitive-prototype-medium-laser": [2290, null, 2300, null, "IO:AE", 112],
            "primitive-prototype-small-laser": [2290, null, 2300, null, "IO:AE", 112],
            "primitive-prototype-ppc": [2439, null, 2460, null, "IO:AE", 112],
            "light-ppc-capacitor": [3064, 3081, null, null, "TO:AUE", 149],
            "ppc-capacitor": [3060, 3081, null, null, "TO:AUE", 149],
            "heavy-ppc-capacitor": [3062, 3081, null, null, "TO:AUE", 149],
            "er-ppc-capacitor": [3060, 3081, null, null, "TO:AUE", 149],
            "snub-nose-ppc-capacitor": [3067, 3081, null, null, "TO:AUE", 149],
            "risc-hyper-laser": [3134, null, 3141, null, "IO:AE", 87],
            "prototype-er-large-laser": [3030, null, 3037, null, "IO:AE", 97],
            "prototype-large-pulse-laser": [2595, null, 2609, null, "IO:AE", 67],
            "prototype-medium-pulse-laser": [2595, null, 2609, null, "IO:AE", 67],
            "recovered-prototype-medium-pulse-laser": [3031, null, 3037, null, "IO:AE", 97],
            "prototype-small-pulse-laser": [2595, null, 2609, null, "IO:AE", 67],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechISEquipmentEnergy.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the isEnergy records", () => {
        for (const item of mechISEquipmentEnergy) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("dates and cites the clanEnergy records (IO:AE pp.29-40)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "enhanced_er_ppc": [2822, 2823, 2831, 3080, "IO:AE", 90],
            "clan-er-large-laser": [2820, 2825, null, null, "TM", 226],
            "er_large_pulse_laser": [3057, 3082, null, null, "TO:AUE", 132],
            "er-medium-laser-clan": [2822, 2824, null, null, "TM", 226],
            "er_medium_pulse_laser": [3057, 3082, null, null, "TO:AUE", 132],
            "er-micro-laser": [3059, 3060, null, null, "TM", 226],
            "er-ppc-clan": [2823, 2826, null, null, "TM", 234],
            "er-small-laser-clan": [2822, 2825, null, null, "TM", 226],
            "er_small_pulse_laser": [3057, 3082, null, null, "TO:AUE", 132],
            "standard-flamer-clan": [undefined, 1950, 2830, null, "TM", 218],
            "large-heavy-laser": [3057, 3059, null, null, "TM", 226],
            "medium-heavy-laser": [3057, 3059, null, null, "TM", 226],
            "small-heavy-laser": [3057, 3059, null, null, "TM", 226],
            "clan-large-laser": [2306, 2316, 2850, null, "TM", 226],
            "clan_large-pulse-laser": [2820, 2824, null, null, "TM", 226],
            "clan-laser-ams": [3048, 3079, null, null, "TO:AUE", 134],
            "medium-laser-clan": [2290, 2300, 2850, null, "TM", 226],
            "clan_medium-pulse-laser": [2825, 2827, null, null, "TM", 226],
            "micro-pulse-laser": [3059, 3060, null, null, "TM", 226],
            "clan-standard-ppc": [2440, 2460, 2825, null, "TM", 234],
            "plasma-cannon": [3068, 3069, null, null, "TM", 235],
            "small-laser-clan": [2290, 2300, 2850, null, "TM", 226],
            "clan-small-pulse-laser": [2825, 2829, null, null, "TM", 226],
            "clan-sl-er-ppc": [2740, 2751, null, null, "TM", 234],
            "clan-heavy-flamer": [3065, 3067, null, null, "TO:AUE", 124],
            "clan-flamer": [2820, 2827, null, null, "TM", 218],
            "clan-improved-ppc": [2819, 2820, 2832, 3080, "IO:AE", 90],
            "clan-improved-large-pulse-laser": [2815, 2818, 2826, 3080, "IO:AE", 89],
            "clan-improved-large-laser": [2812, 2815, 2830, 3080, "IO:AE", 89],
            "clan-improved-heavy-large-laser": [3069, 3079, null, null, "TO:AUE", 133],
            "clan-improved-heavy-medium-laser": [3069, 3079, null, null, "TO:AUE", 133],
            "clan-improved-heavy-small-laser": [3069, 3079, null, null, "TO:AUE", 133],
            "clan-er-flamer": [3065, 3067, null, null, "TO:AUE", 124],
            "clan-large-chemical-laser": [3059, 3083, null, null, "TO:AUE", 132],
            "clan-medium-chemical-laser": [3059, 3083, null, null, "TO:AUE", 132],
            "clan-small-chemical-laser": [3059, 3083, null, null, "TO:AUE", 132],
            "clan-prototype-er-medium-laser": [2819, null, 2824, null, "IO:AE", 91],
            "clan-prototype-er-small-laser": [2819, null, 2825, null, "IO:AE", 91],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechClanEquipmentEnergy.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the clanEnergy records", () => {
        for (const item of mechClanEquipmentEnergy) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });
});

describe("Batch 10b ballistic weapon catalogs", () => {
    it("dates and cites the isBallistic records (IO:AE pp.29-38)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "autocannon-standard-a": [2290, 2300, null, null, "TM", 208],
            "autocannon-standard-b": [2240, 2250, null, null, "TM", 208],
            "autocannon-standard-c": [2443, 2460, null, null, "TM", 208],
            "autocannon-standard-d": [2488, 2500, null, null, "TM", 208],
            "gauss-rifle-light": [3049, 3056, null, null, "TM", 219],
            "standard-gauss-rifle": [2587, 2590, 2865, 3040, "TM", 219],
            "gauss-rifle-heavy": [3051, 3061, null, null, "TM", 219],
            "gauss-rifle-heavy-improved": [3065, 3081, null, null, "TO:AUE", 126],
            "silver-bullet-gauss-rifle": [3051, 3080, null, null, "TO:AUE", 127],
            "gauss-rifle-magshot": [3059, 3072, null, null, "TO:AUE", 126],
            "autocannon-lbx-2": [3055, 3058, null, null, "TM", 208],
            "autocannon-lbx-5": [3055, 3058, null, null, "TM", 208],
            "autocannon-lbx-10": [2590, 2595, 2840, 3035, "TM", 208],
            "autocannon-lbx-20": [3055, 3058, null, null, "TM", 208],
            "autocannon-light-2": [3062, 3068, null, null, "TM", 208],
            "autocannon-light-5": [3062, 3068, null, null, "TM", 208],
            "machine-gun": [undefined, 1950, null, null, "TM", 228],
            "machine-gun-heavy": [3063, 3068, null, null, "TM", 228],
            "machine-gun-light": [3064, 3068, null, null, "TM", 228],
            "melee-hatchet": [3015, 3022, null, null, "TM", 220],
            "melee-sword": [3050, 3058, null, null, "TM", 237],
            "rotary-ac-2": [3060, 3062, null, null, "TM", 208],
            "rotary-ac-5": [3060, 3062, null, null, "TM", 208],
            "autocannon-ultra-a": [3055, 3057, null, null, "TM", 208],
            "autocannon-ultra-b": [2635, 2640, 2915, 3035, "TM", 208],
            "autocannon-ultra-c": [3055, 3057, null, null, "TM", 208],
            "autocannon-ultra-d": [3057, 3060, null, null, "TM", 208],
            "primitive-prototype-ac-2": [2290, null, 2300, null, "IO:AE", 112],
            "primitive-prototype-ac-5": [2240, null, 2250, null, "IO:AE", 112],
            "primitive-prototype-ac-10": [2443, null, 2460, null, "IO:AE", 112],
            "primitive-prototype-ac-20": [2490, null, 2500, null, "IO:AE", 112],
            "prototype-autocannon-lbx-10": [2590, null, 2595, 3030, "IO:AE", 66],
            "prototype-gauss-rifle": [2587, null, 2590, 3038, "IO:AE", 66],
            "prototype-autocannon-uac-5": [3029, null, 3035, null, "IO:AE", 98],
            "light-rifle": [undefined, 1950, 2825, 3084, "TO:AUE", 150],
            "medium-rifle": [undefined, 1950, 2825, 3084, "TO:AUE", 150],
            "heavy-rifle": [undefined, 1950, 2825, 3084, "TO:AUE", 150],
            "is-ams": [2613, 2617, 2835, 3045, "TM", 204],
            "is-machine-gun-array": [3066, 3068, null, null, "TM", 228],
            "is-light-machine-gun-array": [3066, 3068, null, null, "TM", 228],
            "is-heavy-machine-gun-array": [3066, 3068, null, null, "TM", 228],
            "is-hvac-2": [3059, 3079, null, null, "TO:AUE", 97],
            "is-hvac-5": [3059, 3079, null, null, "TO:AUE", 97],
            "is-hvac-10": [3059, 3079, null, null, "TO:AUE", 97],
            "is-risc-apds": [3134, 3137, null, null, "IO:AE", 85],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechISEquipmentBallistic.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the isBallistic records", () => {
        for (const item of mechISEquipmentBallistic) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("dates and cites the clanBallistic records (IO:AE pp.29-38)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "clan-autocannon-lbx-5": [2824, 2826, null, null, "TM", 208],
            "clan-autocannon-lbx-2": [2824, 2826, null, null, "TM", 208],
            "clan-autocannon-lbx-10": [2824, 2826, null, null, "TM", 208],
            "clan-autocannon-lbx-20": [2824, 2826, null, null, "TM", 208],
            "clan-autocannon-rac-2": [3073, 3104, null, null, "TO:AUE", 98],
            "clan-autocannon-rac-5": [3073, 3104, null, null, "TO:AUE", 98],
            "clan-autocannon-uac-2": [2825, 2827, null, null, "TM", 208],
            "clan-autocannon-uac-5": [2825, 2827, null, null, "TM", 208],
            "clan-autocannon-uac-10": [2825, 2827, null, null, "TM", 208],
            "clan-autocannon-uac-20": [2825, 2827, null, null, "TM", 208],
            "hyper-assault-gauss-20": [3062, 3068, null, null, "TM", 219],
            "hyper-assault-gauss-30": [3062, 3068, null, null, "TM", 219],
            "hyper-assault-gauss-40": [3062, 3068, null, null, "TM", 219],
            "protomech-autocannon-2": [3070, 3073, null, null, "TO:AUE", 98],
            "protomech-autocannon-4": [3070, 3073, null, null, "TO:AUE", 98],
            "protomech-autocannon-8": [3070, 3073, null, null, "TO:AUE", 98],
            "ap-gauss-rifle": [3065, 3069, null, null, "TM", 219],
            "clan-sl-autocannon-standard-a": [2290, 2300, 2850, null, "TM", 208],
            "clan-sl-autocannon-standard-b": [2240, 2250, 2850, null, "TM", 208],
            "clan-sl-autocannon-standard-c": [2443, 2460, 2850, null, "TM", 208],
            "clan-sl-autocannon-standard-d": [2488, 2500, 2850, null, "TM", 208],
            "clan-sl-machine-gun": [undefined, 1950, 2826, null, "TM", 228],
            "clan-machine-gun": [2821, 2825, null, null, "TM", 228],
            "clan-light-machine-gun": [3055, 3060, null, null, "TM", 228],
            "clan-heavy-machine-gun": [3054, 3059, null, null, "TM", 228],
            "clan-gauss-rifle": [2822, 2828, null, null, "TM", 219],
            "clan-improved-ac-2": [undefined, 2815, 2833, 3080, "IO:AE", 90],
            "clan-improved-ac-5": [undefined, 2815, 2833, 3080, "IO:AE", 90],
            "clan-improved-ac-10": [undefined, 2815, 2833, 3080, "IO:AE", 90],
            "clan-improved-ac-20": [undefined, 2815, 2833, 3080, "IO:AE", 90],
            "clan-improved-gauss-rifle": [2818, 2821, 2837, 3080, "IO:AE", 90],
            "clan-ams": [2824, 2831, null, null, "TM", 204],
            "clan-machine-gun-array": [undefined, 3069, null, null, "TM", 228],
            "clan-light-machine-gun-array": [undefined, 3069, null, null, "TM", 228],
            "clan-heavy-machine-gun-array": [undefined, 3069, null, null, "TM", 228],
            "clan-prototype-lb-2-x-ac": [2820, null, 2826, null, "IO:AE", 91],
            "clan-prototype-lb-5-x-ac": [2820, null, 2825, null, "IO:AE", 91],
            "clan-prototype-lb-20-x-ac": [2820, null, 2826, null, "IO:AE", 91],
            "clan-prototype-ultra-ac-2": [2820, null, 2827, null, "IO:AE", 92],
            "clan-prototype-ultra-ac-10": [2820, null, 2825, null, "IO:AE", 92],
            "clan-prototype-ultra-ac-20": [2820, null, 2825, null, "IO:AE", 92],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechClanEquipmentBallistic.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the clanBallistic records", () => {
        for (const item of mechClanEquipmentBallistic) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });
});

describe("Batch 10c missile and artillery catalogs", () => {
    it("dates and cites the isMissile records (IO:AE pp.31-40)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "lrm-5": [2295, 2300, null, null, "TM", 231],
            "lrm-10": [2295, 2300, null, null, "TM", 231],
            "lrm-15": [2295, 2300, null, null, "TM", 231],
            "lrm-20": [2295, 2300, null, null, "TM", 231],
            "lrm-5-artemis-iv": [2592, 2598, 2855, 3035, "TM", 207],
            "lrm-10-artemis-iv": [2592, 2598, 2855, 3035, "TM", 207],
            "lrm-15-artemis-iv": [2592, 2598, 2855, 3035, "TM", 207],
            "lrm-20-artemis-iv": [2592, 2598, 2855, 3035, "TM", 207],
            "srm-2": [2365, 2370, null, null, "TM", 231],
            "srm-4": [2365, 2370, null, null, "TM", 231],
            "srm-6": [2365, 2370, null, null, "TM", 231],
            "srm-2-artemis-iv": [2592, 2598, 2855, 3035, "TM", 207],
            "srm-4-artemis-iv": [2592, 2598, 2855, 3035, "TM", 207],
            "srm-6-artemis-iv": [2592, 2598, 2855, 3035, "TM", 207],
            "streak-srm-2": [2645, 2647, 2845, 3035, "TM", 231],
            "streak-srm-4": [3055, 3058, null, null, "TM", 231],
            "streak-srm-6": [3055, 3058, null, null, "TM", 231],
            "extended-lrm-5": [3054, 3078, null, null, "TO:AUE", 139],
            "extended-lrm-10": [3054, 3078, null, null, "TO:AUE", 139],
            "extended-lrm-15": [3054, 3078, null, null, "TO:AUE", 139],
            "extended-lrm-20": [3054, 3078, null, null, "TO:AUE", 139],
            "mml-3": [3067, 3068, null, null, "TM", 231],
            "mml-5": [3067, 3068, null, null, "TM", 231],
            "mml-7": [3067, 3068, null, null, "TM", 231],
            "mml-9": [3067, 3068, null, null, "TM", 231],
            "mml-3-artemis-iv": [3067, 3068, null, null, "TM", 207],
            "mml-5-artemis-iv": [3067, 3068, null, null, "TM", 207],
            "mml-7-artemis-iv": [3067, 3068, null, null, "TM", 207],
            "mml-9-artemis-iv": [3067, 3068, null, null, "TM", 207],
            "thunderbolt-5": [3052, 3072, null, null, "TO:AUE", 159],
            "thunderbolt-10": [3052, 3072, null, null, "TO:AUE", 159],
            "thunderbolt-15": [3052, 3072, null, null, "TO:AUE", 159],
            "thunderbolt-20": [3052, 3072, null, null, "TO:AUE", 159],
            "thunderbolt-5-os": [3052, 3072, null, null, "TO:AUE", 159],
            "thunderbolt-10-os": [3052, 3072, null, null, "TO:AUE", 159],
            "thunderbolt-15-os": [3052, 3072, null, null, "TO:AUE", 159],
            "thunderbolt-20-os": [3052, 3072, null, null, "TO:AUE", 159],
            "thunderbolt-5-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "thunderbolt-10-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "thunderbolt-15-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "thunderbolt-20-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "mrm-10": [3052, 3058, null, null, "TM", 231],
            "mrm-20": [3052, 3058, null, null, "TM", 231],
            "mrm-30": [3052, 3058, null, null, "TM", 231],
            "mrm-40": [3052, 3058, null, null, "TM", 231],
            "mrm-10-os": [3052, 3058, null, null, "TM", 231],
            "mrm-20-os": [3052, 3058, null, null, "TM", 231],
            "mrm-30-os": [3052, 3058, null, null, "TM", 231],
            "mrm-40-os": [3052, 3058, null, null, "TM", 231],
            "mrm-10-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "mrm-20-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "mrm-30-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "mrm-40-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "rocket-launcher-10": [undefined, 3064, null, null, "TM", 231],
            "rocket-launcher-15": [undefined, 3064, null, null, "TM", 231],
            "rocket-launcher-20": [undefined, 3064, null, null, "TM", 231],
            "enhanced-lrm-5": [3058, 3082, null, null, "TO:AUE", 139],
            "enhanced-lrm-10": [3058, 3082, null, null, "TO:AUE", 139],
            "enhanced-lrm-15": [3058, 3082, null, null, "TO:AUE", 139],
            "enhanced-lrm-20": [3058, 3082, null, null, "TO:AUE", 139],
            "enhanced-lrm-5-artemis-iv": [3058, 3082, null, null, "TO:AUE", 139],
            "enhanced-lrm-10-artemis-iv": [3058, 3082, null, null, "TO:AUE", 139],
            "enhanced-lrm-15-artemis-iv": [3058, 3082, null, null, "TO:AUE", 139],
            "enhanced-lrm-20-artemis-iv": [3058, 3082, null, null, "TO:AUE", 139],
            "primitive-prototype-lrm-15": [2295, null, 2300, null, "IO:AE", 112],
            "primitive-prototype-lrm-20": [2295, null, 2300, null, "IO:AE", 112],
            "primitive-prototype-srm-2": [2365, null, 2370, null, "IO:AE", 112],
            "primitive-prototype-srm-4": [2365, null, 2370, null, "IO:AE", 112],
            "narc": [2580, 2587, 2795, 3035, "TM", 233],
            "inarc": [3054, 3062, null, null, "TM", 233],
            "inarc-os": [3054, 3062, null, null, "TM", 233],
            "narc-os": [2665, 2676, 2795, 3035, "TM", 233],
            "narc-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "lrt-5": [2370, 2380, null, null, "TM", 231],
            "lrt-10": [2370, 2380, null, null, "TM", 231],
            "lrt-15": [2370, 2380, null, null, "TM", 231],
            "lrt-20": [2370, 2380, null, null, "TM", 231],
            "srt-2": [2370, 2380, null, null, "TM", 231],
            "srt-4": [2370, 2380, null, null, "TM", 231],
            "srt-6": [2370, 2380, null, null, "TM", 231],
            "lrm-5-os": [2665, 2676, 2800, 3030, "TM", 231],
            "lrm-10-os": [2665, 2676, 2800, 3030, "TM", 231],
            "lrm-15-os": [2665, 2676, 2800, 3030, "TM", 231],
            "lrm-20-os": [2665, 2676, 2800, 3030, "TM", 231],
            "lrt-5-os": [2665, 2676, 2800, 3030, "TM", 231],
            "lrt-10-os": [2665, 2676, 2800, 3030, "TM", 231],
            "lrt-15-os": [2665, 2676, 2800, 3030, "TM", 231],
            "lrt-20-os": [2665, 2676, 2800, 3030, "TM", 231],
            "srm-2-os": [2665, 2676, 2800, 3030, "TM", 231],
            "srm-4-os": [2665, 2676, 2800, 3030, "TM", 231],
            "srm-6-os": [2665, 2676, 2800, 3030, "TM", 231],
            "srt-2-os": [2665, 2676, 2800, 3030, "TM", 231],
            "srt-4-os": [2665, 2676, 2800, 3030, "TM", 231],
            "srt-6-os": [2665, 2676, 2800, 3030, "TM", 231],
            "streak-srm-2-os": [2665, 2676, 2800, 3035, "TM", 231],
            "streak-srm-4-os": [3055, 3058, null, null, "TM", 231],
            "streak-srm-6-os": [3055, 3058, null, null, "TM", 231],
            "lrm-5-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "lrm-10-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "lrm-15-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "lrm-20-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "lrt-5-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "lrt-10-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "lrt-15-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "lrt-20-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "srm-2-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "srm-4-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "srm-6-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "srt-2-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "srt-4-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "srt-6-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "streak-srm-2-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "streak-srm-4-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "streak-srm-6-ios": [3056, 3081, null, null, "TO:AUE", 139],
            "prototype-narc": [2580, null, 2587, null, "IO:AE", 67],
            "prototype-rocket-launcher-10": [1950, null, 3064, null, "IO:AE", 67],
            "prototype-rocket-launcher-15": [1950, null, 3064, null, "IO:AE", 67],
            "prototype-rocket-launcher-20": [1950, null, 3064, null, "IO:AE", 67],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechISEquipmentMissiles.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the isMissile records", () => {
        for (const item of mechISEquipmentMissiles) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("dates and cites the clanMissile records (IO:AE pp.31-40)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "atm-3": [3052, 3053, null, null, "TM", 231],
            "atm-6": [3052, 3053, null, null, "TM", 231],
            "atm-9": [3052, 3053, null, null, "TM", 231],
            "atm-12": [3052, 3053, null, null, "TM", 231],
            "iatm-3": [3054, 3070, null, null, "IO:AE", 60],
            "iatm-6": [3054, 3070, null, null, "IO:AE", 60],
            "iatm-9": [3054, 3070, null, null, "IO:AE", 60],
            "iatm-12": [3054, 3070, null, null, "IO:AE", 60],
            "clan-lrm-5": [2820, 2824, null, null, "TM", 231],
            "clan-lrm-10": [2820, 2824, null, null, "TM", 231],
            "clan-lrm-15": [2820, 2824, null, null, "TM", 231],
            "clan-lrm-20": [2820, 2824, null, null, "TM", 231],
            "clan-lrm-5-os": [2820, 2824, null, null, "TM", 231],
            "clan-lrm-10-os": [2820, 2824, null, null, "TM", 231],
            "clan-lrm-15-os": [2820, 2824, null, null, "TM", 231],
            "clan-lrm-20-os": [2820, 2824, null, null, "TM", 231],
            "clan-lrm-5-artemis-iv": [2820, 2824, null, null, "TM", 207],
            "clan-lrm-10-artemis-iv": [2820, 2824, null, null, "TM", 207],
            "clan-lrm-15-artemis-iv": [2820, 2824, null, null, "TM", 207],
            "clan-lrm-20-artemis-iv": [2820, 2824, null, null, "TM", 207],
            "clan-lrm-5-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-lrm-10-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-lrm-15-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-lrm-20-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-srm-2": [2820, 2824, null, null, "TM", 231],
            "clan-srm-4": [2820, 2824, null, null, "TM", 231],
            "clan-srm-6": [2820, 2824, null, null, "TM", 231],
            "clan-srm-2-os": [2820, 2824, null, null, "TM", 231],
            "clan-srm-4-os": [2820, 2824, null, null, "TM", 231],
            "clan-srm-6-os": [2820, 2824, null, null, "TM", 231],
            "clan-srm-2-artemis-iv": [2820, 2824, null, null, "TM", 207],
            "clan-srm-4-artemis-iv": [2820, 2824, null, null, "TM", 207],
            "clan-srm-6-artemis-iv": [2820, 2824, null, null, "TM", 207],
            "clan-srm-2-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-srm-4-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-srm-6-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-streak-srm-2": [2819, 2822, null, null, "TM", 231],
            "clan-streak-srm-4": [2819, 2822, null, null, "TM", 231],
            "clan-streak-srm-6": [2819, 2822, null, null, "TM", 231],
            "clan-streak-srm-2-os": [2819, 2822, null, null, "TM", 231],
            "clan-streak-srm-4-os": [2819, 2822, null, null, "TM", 231],
            "clan-streak-srm-6-os": [2819, 2822, null, null, "TM", 231],
            "clan-streak-srm-2-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-streak-srm-4-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-streak-srm-6-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-lrt-5": [2820, 2824, null, null, "TM", 231],
            "clan-lrt-10": [2820, 2824, null, null, "TM", 231],
            "clan-lrt-15": [2820, 2824, null, null, "TM", 231],
            "clan-lrt-20": [2820, 2824, null, null, "TM", 231],
            "clan-lrt-5-os": [2820, 2824, null, null, "TM", 231],
            "clan-lrt-10-os": [2820, 2824, null, null, "TM", 231],
            "clan-lrt-15-os": [2820, 2824, null, null, "TM", 231],
            "clan-lrt-20-os": [2820, 2824, null, null, "TM", 231],
            "clan-lrt-5-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-lrt-10-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-lrt-15-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-lrt-20-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-srt-2": [2820, 2824, null, null, "TM", 231],
            "clan-srt-4": [2820, 2824, null, null, "TM", 231],
            "clan-srt-6": [2820, 2824, null, null, "TM", 231],
            "clan-srt-2-os": [2820, 2824, null, null, "TM", 231],
            "clan-srt-4-os": [2820, 2824, null, null, "TM", 231],
            "clan-srt-6-os": [2820, 2824, null, null, "TM", 231],
            "clan-srt-2-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-srt-4-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-srt-6-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "streak-lrm-5": [3057, 3079, null, null, "TO:AUE", 139],
            "streak-lrm-10": [3057, 3079, null, null, "TO:AUE", 139],
            "streak-lrm-15": [3057, 3079, null, null, "TO:AUE", 139],
            "streak-lrm-20": [3057, 3079, null, null, "TO:AUE", 139],
            "streak-lrm-5-os": [3057, 3079, null, null, "TO:AUE", 139],
            "streak-lrm-10-os": [3057, 3079, null, null, "TO:AUE", 139],
            "streak-lrm-15-os": [3057, 3079, null, null, "TO:AUE", 139],
            "streak-lrm-20-os": [3057, 3079, null, null, "TO:AUE", 139],
            "streak-lrm-5-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "streak-lrm-10-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "streak-lrm-15-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "streak-lrm-20-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-sl-lrm-5": [2295, 2300, 2830, null, "TM", 231],
            "clan-sl-lrm-10": [2295, 2300, 2830, null, "TM", 231],
            "clan-sl-lrm-15": [2295, 2300, 2830, null, "TM", 231],
            "clan-sl-lrm-20": [2295, 2300, 2830, null, "TM", 231],
            "clan-sl-lrm-5-artemis-iv": [2592, 2598, 2830, null, "TM", 207],
            "clan-sl-lrm-10-artemis-iv": [2592, 2598, 2830, null, "TM", 207],
            "clan-sl-lrm-15-artemis-iv": [2592, 2598, 2830, null, "TM", 207],
            "clan-sl-lrm-20-artemis-iv": [2592, 2598, 2830, null, "TM", 207],
            "clan-sl-lrm-5-os": [2665, 2676, 2830, null, "TM", 231],
            "clan-sl-lrm-10-os": [2665, 2676, 2830, null, "TM", 231],
            "clan-sl-lrm-15-os": [2665, 2676, 2830, null, "TM", 231],
            "clan-sl-lrm-20-os": [2665, 2676, 2830, null, "TM", 231],
            "clan-sl-srm-2": [2365, 2370, 2836, null, "TM", 231],
            "clan-sl-srm-4": [2365, 2370, 2836, null, "TM", 231],
            "clan-sl-srm-6": [2365, 2370, 2836, null, "TM", 231],
            "clan-sl-srm-2-artemis-iv": [2592, 2598, 2836, null, "TM", 207],
            "clan-sl-srm-4-artemis-iv": [2592, 2598, 2836, null, "TM", 207],
            "clan-sl-srm-6-artemis-iv": [2592, 2598, 2836, null, "TM", 207],
            "clan-sl-streak-srm-2": [2645, 2647, 2845, null, "TM", 231],
            "clan-narc": [2820, 2828, null, null, "TM", 233],
            "clan-narc-os": [2820, 2828, null, null, "TM", 233],
            "clan-narc-ios": [3058, 3081, null, null, "TO:AUE", 139],
            "clan-improved-lrm-5": [2815, 2818, 2831, 3080, "IO:AE", 90],
            "clan-improved-lrm-10": [2815, 2818, 2831, 3080, "IO:AE", 90],
            "clan-improved-lrm-15": [2815, 2818, 2831, 3080, "IO:AE", 90],
            "clan-improved-lrm-20": [2815, 2818, 2831, 3080, "IO:AE", 90],
            "clan-improved-srm-2": [2815, 2817, 2828, 3080, "IO:AE", 90],
            "clan-improved-srm-4": [2815, 2817, 2828, 3080, "IO:AE", 90],
            "clan-improved-srm-6": [2815, 2817, 2828, 3080, "IO:AE", 90],
            "clan-prototype-streak-srm-4": [2819, null, 2826, null, "IO:AE", 91],
            "clan-prototype-streak-srm-6": [2819, null, 2826, null, "IO:AE", 91],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechClanEquipmentMissile.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the clanMissile records", () => {
        for (const item of mechClanEquipmentMissile) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("dates and cites the isArtillery records (IO:AE pp.31-40)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "arrow-iv-system": [2593, 2600, 2830, 3044, "TO:AUE", 96],
            "prototype-arrow-iv": [2593, null, 2600, null, "IO:AE", 64],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechISEquipmentArtillery.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the isArtillery records", () => {
        for (const item of mechISEquipmentArtillery) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("dates and cites the clanArtillery records (IO:AE pp.31-40)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "clan-arrow-iv-system": [undefined, 2844, null, null, "TO:AUE", 96],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechClanEquipmentArtillery.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the clanArtillery records", () => {
        for (const item of mechClanEquipmentArtillery) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });
});

describe("Batch 11 jump jet catalog", () => {
    const jumpJet = (tag: string) => mechJumpJetTypes.find(item => item.tag === tag);

    it("dates jump jets from the IO:AE p.29 universal advancement table", () => {
        expect([jumpJet("standard")?.prototype, jumpJet("standard")?.introduced]).toEqual([2464, 2471]);
        // Improved Jump Jets: Clan Wolf-in-Exile ~3060 prototype, 3069 production; Inner Sphere introduction 3070.
        expect([jumpJet("improved")?.prototype, jumpJet("improved")?.introduced]).toEqual([undefined, 3070]);
        expect(jumpJet("improved")?.clanDates).toEqual({ prototype: 3060, introduced: 3069, extinct: null, reintroduced: null });
        // UMUs: Goliath Scorpion ~3061 prototype, Lyran production 3066, Clan introduction 3072.
        expect([jumpJet("umu")?.prototype, jumpJet("umu")?.introduced]).toEqual([undefined, 3066]);
        expect(jumpJet("umu")?.clanDates).toEqual({ prototype: 3061, introduced: 3072, extinct: null, reintroduced: null });
    });

    it("cites a book and page for every jump jet and uses null for unknown dates", () => {
        const pages: Record<string, [string, number]> = { standard: ["TM", 225], improved: ["TM", 225], umu: ["TO:AUE", 107] };
        for (const item of mechJumpJetTypes) {
            expect([item.book, item.page], item.tag).toEqual(pages[item.tag]);
            expect(item.extinct, item.tag).toBeNull();
            expect(item.reintroduced, item.tag).toBeNull();
        }
    });
});

describe("Batch 9c pods added from TechManual and TO:AUE", () => {
    it("lists the B-Pod as universal equipment (TM pp.205, 291, 317, 342)", () => {
        const pod = mechUniversalEquipment.find(item => item.tag === "b-pod");
        expect(pod).toMatchObject({ name: "B-Pod", weight: 1, cbills: 2500, battleValue: 2, battleValueDefensive: true, explosive: true, book: "TM", page: 205 });
        expect(pod?.space).toMatchObject({ battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1 });
        // IO:AE p.34: ~3065 prototype (Wolf-in-Exile and Lyran), 3068 production for both tech bases.
        expect([pod?.prototype, pod?.introduced, pod?.extinct, pod?.reintroduced]).toEqual([3065, 3068, null, null]);
    });

    it("lists the M-Pod as Inner Sphere equipment (TO:AUE pp.143, 195, 221)", () => {
        const pod = mechISEquipmentMisc.find(item => item.tag === "m-pod");
        expect(pod).toMatchObject({ name: "M-Pod", weight: 1, cbills: 6000, battleValue: 5, battleValueDefensive: true, explosive: true, accuracyModifier: -1, book: "TO:AUE", page: 143 });
        expect(pod?.range).toEqual({ min: 0, short: 1, medium: 2, long: 3 });
        expect(pod?.space).toMatchObject({ battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: -1 });
        // IO:AE p.34: ~3060 prototype, 3064 production.
        expect([pod?.prototype, pod?.introduced, pod?.extinct, pod?.reintroduced]).toEqual([3060, 3064, null, null]);
    });

    it("lists the Chaff Pod as Inner Sphere equipment (TO:AUE pp.111, 195, 219)", () => {
        const pod = mechISEquipmentMisc.find(item => item.tag === "chaff-pod");
        expect(pod).toMatchObject({ name: "Chaff Pod", weight: 1, cbills: 2000, battleValue: 19, battleValueDefensive: true, explosive: true, book: "TO:AUE", page: 111 });
        expect(pod?.space).toMatchObject({ battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 });
        // IO:AE p.39: 3069 prototype, 3079 production.
        expect([pod?.prototype, pod?.introduced, pod?.extinct, pod?.reintroduced]).toEqual([3069, 3079, null, null]);
    });

    it("mounts a B-Pod on Inner Sphere and Clan designs and counts it as defensive BV", () => {
        for (const tech of ["is", "clan"]) {
            const mech = new BattleMech();
            mech.setTech(tech);
            mech.setEra("ilClan");
            const before = mech.getBattleValue();
            const pod = mech.addEquipmentFromTag("b-pod", "", "", false, null, undefined, undefined, undefined, undefined, undefined);
            expect(pod?.tag, tech).toBe("b-pod");
            expect(mech.getBattleValue(), tech).toBeGreaterThan(before);
        }
    });
});

describe("Batch 12b standard ammunition follows its launcher", () => {
    it("dates and cites the isAmmo records (launcher dates; IO:AE pp.53-56)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "ammo-is-arrow-iv-standard": [2593, 2600, 2830, 3044, "TO:AUE", 96],
            "ammo-is-enhanced-lrm-standard": [3058, 3082, null, null, "TO:AUE", 139],
            "ammo-is-inarc-standard": [3054, 3062, null, null, "TM", 233],
            "ammo-is-mech-mortar-standard": [2526, 2531, 2819, 3043, "TO:AUE", 136],
            "ammo-is-mrm-standard": [3052, 3058, null, null, "TM", 231],
            "ammo-is-narc-standard": [2580, 2587, 2795, 3035, "TM", 233],
            "ammo-is-plasma-rifle-standard": [3061, 3068, null, null, "TM", 235],
            "ammo-is-thunderbolt-5-standard": [3052, 3072, null, null, "TO:AUE", 159],
            "ammo-is-thunderbolt-10-standard": [3052, 3072, null, null, "TO:AUE", 159],
            "ammo-is-thunderbolt-15-standard": [3052, 3072, null, null, "TO:AUE", 159],
            "ammo-is-thunderbolt-20-standard": [3052, 3072, null, null, "TO:AUE", 159],
            "ammo-is-heavy-machine-gun-standard": [3063, 3068, null, null, "TM", 228],
            "ammo-is-light-machine-gun-standard": [3064, 3068, null, null, "TM", 228],
            "ammo-is-lrt-standard": [2370, 2380, null, null, "TM", 231],
            "ammo-is-srt-standard": [2370, 2380, null, null, "TM", 231],
            "ammo-is-rotary-ac-2-standard": [3060, 3062, null, null, "TM", 208],
            "ammo-is-rotary-ac-5-standard": [3060, 3062, null, null, "TM", 208],
            "ammo-is-ultra-ac-2-standard": [3055, 3057, null, null, "TM", 208],
            "ammo-is-ultra-ac-5-standard": [2635, 2640, 2915, 3035, "TM", 208],
            "ammo-is-ultra-ac-10-standard": [3055, 3057, null, null, "TM", 208],
            "ammo-is-ultra-ac-20-standard": [3057, 3060, null, null, "TM", 208],
            "ammo-is-gauss-rifle-standard": [2587, 2590, 2865, 3040, "TM", 219],
            "ammo-is-heavy-flamer-standard": [undefined, 3068, null, null, "TO:AUE", 124],
            "ammo-is-ac-2-standard": [2290, 2300, null, null, "TM", 208],
            "ammo-is-lb-2x-standard": [3055, 3058, null, null, "TM", 208],
            "ammo-is-ac-5-standard": [2240, 2250, null, null, "TM", 208],
            "ammo-is-lb-5x-standard": [3055, 3058, null, null, "TM", 208],
            "ammo-is-ac-10-standard": [2443, 2460, null, null, "TM", 208],
            "ammo-is-lb-10x-standard": [2590, 2595, 2840, 3035, "TM", 208],
            "ammo-is-ac-20-standard": [2488, 2500, null, null, "TM", 208],
            "ammo-is-lb-20x-standard": [3055, 3058, null, null, "TM", 208],
            "ammo-is-light-ac-2-standard": [3062, 3068, null, null, "TM", 208],
            "ammo-is-light-ac-5-standard": [3062, 3068, null, null, "TM", 208],
            "ammo-is-heavy-gauss-rifle-standard": [3051, 3061, null, null, "TM", 219],
            "ammo-is-light-gauss-rifle-standard": [3049, 3056, null, null, "TM", 219],
            "ammo-is-improved-heavy-gauss-rifle-standard": [3065, 3081, null, null, "TO:AUE", 126],
            "ammo-is-magshot-gauss-rifle-standard": [3059, 3072, null, null, "TO:AUE", 126],
            "ammo-is-silver-bullet-gauss-rifle-standard": [3051, 3080, null, null, "TO:AUE", 127],
            "ammo-is-streak-srm-standard": [2645, 2647, 2845, 3035, "TM", 231],
            "ammo-is-extended-lrm-standard": [3054, 3078, null, null, "TO:AUE", 139],
            "ammo-is-ams-standard": [2613, 2617, 2835, 3045, "TM", 204],
            "ammo-is-light-rifle-standard": [undefined, 1950, 2900, 3084, "TO:AUE", 150],
            "ammo-is-medium-rifle-standard": [undefined, 1950, 2900, 3084, "TO:AUE", 150],
            "ammo-is-heavy-rifle-standard": [undefined, 1950, 2900, 3084, "TO:AUE", 150],
            "ammo-is-hvac-2-standard": [3059, 3079, null, null, "TO:AUE", 97],
            "ammo-is-hvac-5-standard": [3059, 3079, null, null, "TO:AUE", 97],
            "ammo-is-hvac-10-standard": [3059, 3079, null, null, "TO:AUE", 97],
            "ammo-is-risc-apds-standard": [3134, 3137, null, null, "IO:AE", 85],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechISAmmo.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the isAmmo records", () => {
        for (const item of mechISAmmo) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("dates and cites the clanAmmo records (launcher dates; IO:AE pp.53-56)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "ammo-clan-arrow-iv-standard": [undefined, 2844, null, null, "TO:AUE", 96],
            "ammo-clan-atm-standard": [3052, 3053, null, null, "TM", 231],
            "ammo-clan-lb-5x-standard": [2824, 2826, null, null, "TM", 208],
            "ammo-clan-lb-2x-standard": [2824, 2826, null, null, "TM", 208],
            "ammo-clan-lb-10x-standard": [2824, 2826, null, null, "TM", 208],
            "ammo-clan-lb-20x-standard": [2824, 2826, null, null, "TM", 208],
            "ammo-clan-mech-mortar-standard": [2835, 2840, null, null, "TO:AUE", 136],
            "ammo-clan-plasma-cannon-standard": [3068, 3069, null, null, "TM", 235],
            "ammo-clan-narc-standard": [2820, 2828, null, null, "TM", 233],
            "ammo-clan-heavy-machine-gun-standard": [3054, 3059, null, null, "TM", 228],
            "ammo-clan-light-machine-gun-standard": [3055, 3060, null, null, "TM", 228],
            "ammo-clan-lrt-standard": [2820, 2824, null, null, "TM", 231],
            "ammo-clan-srt-standard": [2820, 2824, null, null, "TM", 231],
            "ammo-clan-rotary-ac-2-standard": [3073, 3104, null, null, "TO:AUE", 98],
            "ammo-clan-rotary-ac-5-standard": [3073, 3104, null, null, "TO:AUE", 98],
            "ammo-clan-ultra-ac-2-standard": [2825, 2827, null, null, "TM", 208],
            "ammo-clan-ultra-ac-5-standard": [2825, 2827, null, null, "TM", 208],
            "ammo-clan-ultra-ac-10-standard": [2825, 2827, null, null, "TM", 208],
            "ammo-clan-ultra-ac-20-standard": [2825, 2827, null, null, "TM", 208],
            "ammo-clan-gauss-rifle-standard": [2822, 2828, null, null, "TM", 219],
            "ammo-clan-heavy-flamer-standard": [3065, 3067, null, null, "TO:AUE", 124],
            "ammo-clan-ac-2-standard": [2290, 2300, 2850, null, "TM", 208],
            "ammo-clan-ac-5-standard": [2240, 2250, 2850, null, "TM", 208],
            "ammo-clan-ac-10-standard": [2443, 2460, 2850, null, "TM", 208],
            "ammo-clan-ac-20-standard": [2488, 2500, 2850, null, "TM", 208],
            "ammo-clan-streak-srm-standard": [2645, 2647, null, null, "TM", 231],
            "ammo-clan-streak-lrm-standard": [3057, 3079, null, null, "TO:AUE", 139],
            "ammo-clan-improved-ac-2-standard": [undefined, 2815, 2833, 3080, "IO:AE", 90],
            "ammo-clan-improved-ac-5-standard": [undefined, 2815, 2833, 3080, "IO:AE", 90],
            "ammo-clan-improved-ac-10-standard": [undefined, 2815, 2833, 3080, "IO:AE", 90],
            "ammo-clan-improved-ac-20-standard": [undefined, 2815, 2833, 3080, "IO:AE", 90],
            "ammo-clan-improved-gauss-rifle-standard": [2818, 2821, 2837, 3080, "IO:AE", 90],
            "ammo-clan-improved-lrm-standard": [2815, 2818, 2831, 3080, "IO:AE", 90],
            "ammo-clan-improved-srm-standard": [2815, 2817, 2828, 3080, "IO:AE", 90],
            "ammo-clan-ams-standard": [2824, 2831, null, null, "TM", 204],
            "ammo-clan-large-chemical-laser-standard": [3059, 3085, null, null, "TO:AUE", 132],
            "ammo-clan-medium-chemical-laser-standard": [3059, 3085, null, null, "TO:AUE", 132],
            "ammo-clan-small-chemical-laser-standard": [3059, 3085, null, null, "TO:AUE", 132],
            "ammo-clan-hag-20-standard": [3062, 3068, null, null, "TM", 219],
            "ammo-clan-hag-30-standard": [3062, 3068, null, null, "TM", 219],
            "ammo-clan-hag-40-standard": [3062, 3068, null, null, "TM", 219],
            "ammo-clan-protomech-ac-2-standard": [3070, 3073, null, null, "TO:AUE", 98],
            "ammo-clan-protomech-ac-4-standard": [3070, 3073, null, null, "TO:AUE", 98],
            "ammo-clan-protomech-ac-8-standard": [3070, 3073, null, null, "TO:AUE", 98],
            "ammo-clan-ap-gauss-rifle-standard": [3065, 3069, null, null, "TM", 219],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechClanAmmo.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the clanAmmo records", () => {
        for (const item of mechClanAmmo) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("dates and cites the universalAmmo records (launcher dates; IO:AE pp.53-56)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "ammo-long-tom-standard": [2445, 2500, null, null, "TO:AUE", 96],
            "ammo-lrm-standard": [2295, 2300, null, null, "TM", 231],
            "ammo-machine-gun-standard": [undefined, 1950, null, null, "TM", 228],
            "ammo-sniper-standard": [undefined, 1950, null, null, "TO:AUE", 96],
            "ammo-srm-standard": [2365, 2370, null, null, "TM", 231],
            "ammo-thumper-standard": [undefined, 1950, null, null, "TO:AUE", 96],
            "ammo-vehicle-flamer-standard": [undefined, 1950, null, null, "TM", 218],
            "ammo-long-tom-cannon-standard": [3012, 3079, null, null, "TO:AUE", 97],
            "ammo-sniper-cannon-standard": [3012, 3079, null, null, "TO:AUE", 97],
            "ammo-thumper-cannon-standard": [3012, 3079, null, null, "TO:AUE", 97],
            "ammo-nail-rivet-gun-standard": [2309, 2310, null, null, "TM", 246],
            "ammo-fluid-gun-standard": [undefined, 1950, null, null, "TO:AUE", 125],
            "ammo-bomb-standard": [undefined, 1950, null, null, "TW", 246],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechUniversalAmmo.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the universalAmmo records", () => {
        for (const item of mechUniversalAmmo) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });
});

describe("Batch 13 records without a canon source", () => {
    it("keeps Enhanced ER Large Laser and Enhanced Clan LRM 10 out of the canon Clan catalogs", () => {
        expect(mechClanEquipmentEnergy.some(item => item.tag === "enhanced_er_large_laser")).toBe(false);
        expect(mechClanEquipmentMissile.some(item => item.tag === "enhanced_clan_lrm_10")).toBe(false);
    });

    it("lists them as Custom Homebrew, with the old tags, until a source is found", () => {
        const laser = mechCustomEquipmentEnergy.find(item => item.tag === "enhanced_er_large_laser");
        const lrm = mechCustomEquipmentMissile.find(item => item.tag === "enhanced_clan_lrm_10");
        for (const item of [laser, lrm]) {
            expect(item).toMatchObject({ catalog: "custom", book: "Custom", page: null, rulesLevel: 5 });
            expect(item?.notes).toContain("No canon source found");
        }
        // Game statistics are unchanged by the move.
        expect(laser).toMatchObject({ damage: 10, heat: 12, weight: 4, battleValue: 222 });
        expect(lrm).toMatchObject({ damage: 12, heat: 4, weight: 5, battleValue: 114 });
    });
});

describe("Batch 14 prototype weapon statistics", () => {
    it("match the IO:AE construction, game data and Battle Value tables (pp.189, 210-213)", () => {
        const expected: [{ tag: string }[], string, Record<string, unknown>][] = [
            [mechISEquipmentBallistic, "primitive-prototype-ac-2", { weight: 6, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, cbills: 75000, battleValue: 37, range: { min: 4, short: 8, medium: 16, long: 24 }, shotsPerTon: 34, ammoBattleValue: 4, ammoTypes: ["ammo-is-ac-2-standard"], techRating: "c", rangeAero: "l" }],
            [mechISEquipmentBallistic, "primitive-prototype-ac-5", { weight: 8, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, cbills: 125000, battleValue: 70, range: { min: 3, short: 6, medium: 12, long: 18 }, shotsPerTon: 15, ammoBattleValue: 7, ammoTypes: ["ammo-is-ac-5-standard"], techRating: "c", rangeAero: "m" }],
            [mechISEquipmentBallistic, "primitive-prototype-ac-10", { weight: 12, space: { battlemech: 7, protomech: -1, combatVehicle: 1, supportVehicle: 7, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, cbills: 200000, battleValue: 123, range: { min: 0, short: 5, medium: 10, long: 15 }, shotsPerTon: 8, ammoBattleValue: 12, ammoTypes: ["ammo-is-ac-10-standard"], techRating: "c", rangeAero: "m" }],
            [mechISEquipmentBallistic, "primitive-prototype-ac-20", { weight: 14, space: { battlemech: 10, protomech: -1, combatVehicle: 1, supportVehicle: 10, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, cbills: 300000, battleValue: 178, range: { min: 0, short: 3, medium: 6, long: 9 }, shotsPerTon: 4, ammoBattleValue: 17, ammoTypes: ["ammo-is-ac-20-standard"], techRating: "c", rangeAero: "s" }],
            [mechISEquipmentBallistic, "prototype-autocannon-lbx-10", { weight: 11, space: { battlemech: 7, protomech: -1, combatVehicle: 1, supportVehicle: 7, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, cbills: 1600000, battleValue: 148, ammoBattleValue: 15 }],
            [mechISEquipmentBallistic, "prototype-gauss-rifle", { weight: 15, space: { battlemech: 8, protomech: -1, combatVehicle: 1, supportVehicle: 8, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, cbills: 1200000, battleValue: 320, ammoBattleValue: 40 }],
            [mechISEquipmentBallistic, "prototype-autocannon-uac-5", { weight: 9, space: { battlemech: 6, protomech: -1, combatVehicle: 1, supportVehicle: 6, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, cbills: 1000000, battleValue: 112, ammoBattleValue: 14 }],
            [mechISEquipmentEnergy, "primitive-prototype-small-laser", { weight: 0.5, cbills: 11250, battleValue: 9, heat: 2, range: { min: 0, short: 1, medium: 2, long: 3 }, techRating: "c", rangeAero: "s" }],
            [mechISEquipmentEnergy, "primitive-prototype-medium-laser", { weight: 1, cbills: 40000, battleValue: 46, heat: 5, range: { min: 0, short: 3, medium: 6, long: 9 }, techRating: "c", rangeAero: "s" }],
            [mechISEquipmentEnergy, "primitive-prototype-large-laser", { weight: 5, cbills: 100000, battleValue: 123, heat: 12, range: { min: 0, short: 5, medium: 10, long: 15 }, techRating: "c", rangeAero: "m" }],
            [mechISEquipmentEnergy, "primitive-prototype-ppc", { weight: 7, cbills: 200000, battleValue: 176, heat: 15, range: { min: 3, short: 6, medium: 12, long: 18 }, techRating: "d", rangeAero: "m" }],
            [mechISEquipmentMissiles, "primitive-prototype-lrm-15", { weight: 7, cbills: 175000, battleValue: 132, shotsPerTon: 6, ammoBattleValue: 13 }],
            [mechISEquipmentMissiles, "primitive-prototype-lrm-20", { weight: 10, cbills: 250000, battleValue: 168, shotsPerTon: 5, ammoBattleValue: 16 }],
            [mechISEquipmentMissiles, "primitive-prototype-srm-2", { weight: 1, cbills: 10000, battleValue: 10, shotsPerTon: 38, ammoBattleValue: 1 }],
            [mechISEquipmentMissiles, "primitive-prototype-srm-4", { weight: 2, cbills: 60000, battleValue: 21, shotsPerTon: 19, ammoBattleValue: 3 }],
            [mechISEquipmentMissiles, "primitive-prototype-lrm-5", { name: "Primitive Prototype LRM 5", weight: 2, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, cbills: 30000, battleValue: 38, heat: 2, shotsPerTon: 18, ammoBattleValue: 4, damageClusters: 5, prototype: 2295, introduced: null, extinct: 2300, book: "IO:AE", page: 112 }],
            [mechISEquipmentMissiles, "primitive-prototype-lrm-10", { name: "Primitive Prototype LRM 10", weight: 5, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, cbills: 100000, battleValue: 78, heat: 4, shotsPerTon: 9, ammoBattleValue: 8, damageClusters: 10, prototype: 2295, introduced: null, extinct: 2300, book: "IO:AE", page: 112 }],
            [mechISEquipmentMissiles, "primitive-prototype-srm-6", { name: "Primitive Prototype SRM 6", weight: 3, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, cbills: 80000, battleValue: 41, heat: 4, shotsPerTon: 11, ammoBattleValue: 4, damageClusters: 6, prototype: 2365, introduced: null, extinct: 2370, book: "IO:AE", page: 112 }],
            [mechClanEquipmentMissile, "clan-improved-srm-2", { cbills: 15000, battleValue: 28, ammoBattleValue: 4 }],
            [mechClanEquipmentMissile, "clan-improved-srm-4", { cbills: 90000, battleValue: 52, ammoBattleValue: 7 }],
            [mechClanEquipmentMissile, "clan-improved-srm-6", { cbills: 120000, battleValue: 79, ammoBattleValue: 10 }],
            [mechClanEquipmentMissile, "clan-prototype-streak-srm-4", { cbills: 90000, battleValue: 59, ammoBattleValue: 7 }],
            [mechClanEquipmentMissile, "clan-prototype-streak-srm-6", { cbills: 120000, battleValue: 89, ammoBattleValue: 11 }],
            [mechClanEquipmentBallistic, "clan-prototype-lb-2-x-ac", { battleValue: 42, ammoBattleValue: 5 }],
            [mechClanEquipmentBallistic, "clan-prototype-lb-5-x-ac", { battleValue: 83, ammoBattleValue: 10 }],
            [mechClanEquipmentBallistic, "clan-prototype-lb-20-x-ac", { battleValue: 237, ammoBattleValue: 30 }],
            [mechClanEquipmentBallistic, "clan-prototype-ultra-ac-2", { battleValue: 56, ammoBattleValue: 7 }],
            [mechClanEquipmentBallistic, "clan-prototype-ultra-ac-10", { battleValue: 210, ammoBattleValue: 26 }],
            [mechClanEquipmentBallistic, "clan-prototype-ultra-ac-20", { battleValue: 281, ammoBattleValue: 35 }],
            [mechClanEquipmentEnergy, "enhanced_er_ppc", { name: "Enhanced PPC", altNames: ["Enhanced ER PPC"], weight: 7, cbills: 300000, battleValue: 329 }],
            [mechClanEquipmentMisc, "clan-nova-cews", { cbills: 1110000 }],
        ];
        for (const [catalog, tag, fields] of expected) {
            const item = catalog.find(entry => entry.tag === tag);
            expect(item, tag).toBeDefined();
            expect(item, tag).toMatchObject(fields);
        }
    });
});

describe("Batch 14 Star League ER PPC in Clan space", () => {
    it("stays available in every era and says why the original tool listed an extinction", () => {
        const erPPC = mechClanEquipmentEnergy.find(item => item.tag === "clan-sl-er-ppc");
        expect(erPPC).toMatchObject({ prototype: 2740, introduced: 2751, extinct: null, reintroduced: null });
        // IO:AE p.40: the ER PPC extinction applies to the Inner Sphere only.
        expect(erPPC?.notes).toContain("2860");
        expect(erPPC?.notes).toContain("Clan ER PPC");
    });
});

describe("Batch 15 tech-base splits", () => {
    const universalTags = mechUniversalEquipment.map(item => item.tag);

    it("splits 'Mech Mortars: Clan launchers are lighter and were never lost (TO:AUE pp.136, 221; IO:AE p.40)", () => {
        // size: [tons, slots] (TO:AUE p.221); BV and ammo BV per ton (TO:AUE p.194)
        const sizes: [number, [number, number], [number, number], number, number][] = [
            [1, [2, 1], [1, 1], 10, 1],
            [2, [5, 2], [2.5, 1], 14, 2],
            [4, [7, 3], [3.5, 2], 26, 3],
            [8, [10, 5], [5, 3], 50, 6],
        ];
        for (const [size, [isTons, isSlots], [clanTons, clanSlots], bv, ammoBV] of sizes) {
            const is = mechISEquipmentMissiles.find(item => item.tag === `mech-mortar-${size}`);
            const clan = mechClanEquipmentMissile.find(item => item.tag === `clan-mech-mortar-${size}`);
            expect(is, `mech-mortar-${size}`).toMatchObject({
                catalog: "is", weight: isTons, battleValue: bv, ammoBattleValue: ammoBV, techRating: "b",
                prototype: 2526, introduced: 2531, extinct: 2819, reintroduced: 3043, book: "TO:AUE", page: 136,
            });
            expect(is?.space.battlemech).toBe(isSlots);
            expect(clan, `clan-mech-mortar-${size}`).toMatchObject({
                catalog: "clan", weight: clanTons, battleValue: bv, ammoBattleValue: ammoBV, techRating: "b",
                prototype: 2835, introduced: 2840, extinct: null, reintroduced: null, book: "TO:AUE", page: 136,
            });
            expect(clan?.space.battlemech).toBe(clanSlots);
            // Everything the two launchers share stays identical.
            expect([clan?.heat, clan?.range, clan?.shotsPerTon, clan?.cbills]).toEqual([is?.heat, is?.range, is?.shotsPerTon, is?.cbills]);
            expect(universalTags).not.toContain(`mech-mortar-${size}`);
        }
    });

    it("splits Artillery Cannons: the Clan prototype is 3032, twenty years after the Lyran one (IO:AE p.31)", () => {
        for (const cannon of ["long-tom-cannon", "sniper-cannon", "thumper-cannon"]) {
            const is = mechISEquipmentArtillery.find(item => item.tag === cannon);
            const clan = mechClanEquipmentArtillery.find(item => item.tag === `clan-${cannon}`);
            expect(is, cannon).toMatchObject({ catalog: "is", prototype: 3012, introduced: 3079, extinct: null, book: "TO:AUE", page: 97 });
            expect(clan, `clan-${cannon}`).toMatchObject({ catalog: "clan", prototype: 3032, introduced: 3079, extinct: null, book: "TO:AUE", page: 97 });
            expect([clan?.weight, clan?.space, clan?.battleValue, clan?.ammoBattleValue, clan?.cbills, clan?.heat, clan?.damage, clan?.range, clan?.shotsPerTon])
                .toEqual([is?.weight, is?.space, is?.battleValue, is?.ammoBattleValue, is?.cbills, is?.heat, is?.damage, is?.range, is?.shotsPerTon]);
            expect(universalTags).not.toContain(cannon);
        }
    });

    it("splits the Laser Insulator: lost in the Inner Sphere in 2820, never in Clan space (IO:AE p.38)", () => {
        const is = mechISEquipmentMisc.find(item => item.tag === "laser-insulator");
        const clan = mechClanEquipmentMisc.find(item => item.tag === "clan-laser-insulator");
        expect(is).toMatchObject({ catalog: "is", prototype: 2575, introduced: null, extinct: 2820, reintroduced: null, book: "TO:AUE", page: 134 });
        expect(clan).toMatchObject({ catalog: "clan", prototype: 2575, introduced: null, extinct: null, reintroduced: null, book: "TO:AUE", page: 134 });
        expect([clan?.weight, clan?.space, clan?.cbills, clan?.battleValue]).toEqual([is?.weight, is?.space, is?.cbills, is?.battleValue]);
        expect(universalTags).not.toContain("laser-insulator");
    });

    it("gives the Clans their own Modular Armor record: prototype 3074 (IO:AE p.29)", () => {
        const is = mechISEquipmentMisc.find(item => item.tag === "modular-armor");
        const clan = mechClanEquipmentMisc.find(item => item.tag === "clan-modular-armor");
        expect(is).toMatchObject({ prototype: 3072, introduced: 3096, isModularArmor: true });
        expect(clan).toMatchObject({ catalog: "clan", prototype: 3074, introduced: 3096, extinct: null, book: "TO:AUE", page: 93, isModularArmor: true });
        expect([clan?.weight, clan?.space, clan?.cbills, clan?.additionalArmor]).toEqual([is?.weight, is?.space, is?.cbills, is?.additionalArmor]);
    });

    it("loads designs saved with the old universal tags: each side gets its own record", () => {
        const load = (tech: string, tag: string) => {
            const mech = new BattleMech();
            mech.setTech(tech);
            mech.setEra("dark-ages");
            mech.setTonnage(100);
            return mech.addEquipmentFromTag(tag, tech, "", false, undefined, "", false, [], undefined, undefined);
        };
        // [old universal tag, Clan record it now loads on a Clan design]
        const oldTags: [string, string][] = [
            ["mech-mortar-1", "clan-mech-mortar-1"], ["mech-mortar-2", "clan-mech-mortar-2"],
            ["mech-mortar-4", "clan-mech-mortar-4"], ["mech-mortar-8", "clan-mech-mortar-8"],
            ["long-tom-cannon", "clan-long-tom-cannon"], ["sniper-cannon", "clan-sniper-cannon"],
            ["thumper-cannon", "clan-thumper-cannon"], ["laser-insulator", "clan-laser-insulator"],
        ];
        for (const [oldTag, clanTag] of oldTags) {
            expect(load("is", oldTag)?.tag, `is ${oldTag}`).toBe(oldTag);
            expect(load("clan", oldTag)?.tag, `clan ${oldTag}`).toBe(clanTag);
        }
        expect(load("clan", "mech-mortar-8")?.weight).toBe(5);
        expect(load("is", "mech-mortar-8")?.weight).toBe(10);
    });

    it("lets a Clan 'Mech mount only one Modular Armor pack per location, as an Inner Sphere one", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        mech.setEra("dark-ages");
        mech.setTonnage(50);
        const first = mech.addEquipmentFromTag("clan-modular-armor", "clan", "", false, undefined, "", false, [], undefined, undefined)!;
        const second = mech.addEquipmentFromTag("clan-modular-armor", "clan", "", false, undefined, "", false, [], undefined, undefined)!;
        const unallocatedIndex = (uuid: string) => mech.unallocatedCriticals.findIndex(item => item?.uuid === uuid);
        const openSlot = () => mech.getCriticals().leftTorso.findIndex(item => !item);
        expect(first.isModularArmor).toBe(true);
        expect(mech.moveCritical("un", unallocatedIndex(first.uuid!), "lt", openSlot())).toBe(true);
        expect(mech.moveCritical("un", unallocatedIndex(second.uuid!), "lt", openSlot())).toBe(false);
    });
});

describe("Batch 15 saved designs keep custom-catalog equipment", () => {
    const add = (mech: BattleMech, tag: string) =>
        mech.addEquipmentFromTag(tag, mech.getTech().tag, "", false, undefined, "", false, [], undefined, undefined, undefined, undefined, true);

    it("restores Custom Homebrew equipment when a saved design is loaded", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        mech.setEra("dark-ages");
        mech.setTonnage(75);
        // Both records moved from the Clan catalogs to custom in Batch 13.
        expect(add(mech, "enhanced_er_large_laser")?.tag).toBe("enhanced_er_large_laser");
        expect(add(mech, "enhanced_clan_lrm_10")?.tag).toBe("enhanced_clan_lrm_10");

        const restored = new BattleMech(mech.exportJSON());
        expect(restored.equipmentList.map(item => item.tag).sort()).toEqual(["enhanced_clan_lrm_10", "enhanced_er_large_laser"]);
    });

    it("still keeps custom equipment out of the lists a canon design chooses from", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        mech.setEra("dark-ages");
        mech.setTonnage(75);
        expect(mech.addEquipmentFromTag("enhanced_er_large_laser", "clan", "", false, undefined, "", false, [], undefined, undefined)).toBeNull();
        expect(mech.getAvailableEquipment(false, 4).some(item => item.catalog === "custom")).toBe(false);
    });
});

describe("Batch 16 large engines", () => {
    const build = (tonnage: number, walk: number, engine: string, tech = "is", era = "late-rep") => {
        const mech = new BattleMech();
        mech.setTech(tech);
        mech.setEra(era);
        mech.setTonnage(tonnage);
        mech.setWalkSpeed(walk);
        mech.setEngineType(engine);
        return mech;
    };
    const offered = (mech: BattleMech, tag: string, rulesLevel: number) => {
        const engine = mech.getAvailableEngines(rulesLevel).find(item => item.tag === tag);
        return engine ? [!!engine.available, !!engine.availableAsPrototype] : null;
    };

    it("lists the seven large engine types with their own dates (IO:AE p.38; TO:AUE pp.119-120, 219)", () => {
        // tag: [base type, prototype, production, extinct, recovered, cost multiplier, criticals]
        const expected: Record<string, [string, number, number, number | null, number | null, number, object]> = {
            "large-ice": ["ice", 2630, 3085, null, null, 2500, { is: { ct: 8 }, clan: { ct: 8 } }],
            "large-standard": ["standard", 2630, 3085, null, null, 10000, { is: { ct: 8 }, clan: { ct: 8 } }],
            "large-light": ["light", 3064, 3065, null, null, 30000, { is: { ct: 8, lt: 2, rt: 2 } }],
            "large-xl": ["xl", 2635, 3085, 2822, 3054, 40000, { is: { ct: 8, lt: 3, rt: 3 } }],
            "large-clan_xl": ["clan_xl", 2850, 3080, null, null, 40000, { clan: { ct: 8, lt: 2, rt: 2 } }],
            "large-xxl": ["xxl", 3058, 3130, null, null, 200000, { is: { ct: 8, lt: 6, rt: 6 } }],
            "large-clan_xxl": ["clan_xxl", 3055, 3125, null, null, 200000, { clan: { ct: 8, lt: 4, rt: 4 } }],
        };
        expect(mechLargeEngineTypes.map(engine => engine.tag).sort()).toEqual(Object.keys(expected).sort());
        for (const [tag, [largeOf, prototype, introduced, extinct, reintroduced, costMultiplier, criticals]] of Object.entries(expected)) {
            const engine = mechLargeEngineTypes.find(item => item.tag === tag);
            expect(engine, tag).toMatchObject({ largeOf, prototype, introduced, extinct, reintroduced, costMultiplier, criticals, book: "TO:AUE", page: 119 });
            // A large engine costs twice its base type and adds two center torso slots.
            const base = mechEngineTypes.find(item => item.tag === largeOf)!;
            expect(costMultiplier, tag).toBe(base.costMultiplier * 2);
            expect(getLargeEngineType(largeOf)?.tag).toBe(tag);
        }
        // No large Compact, Fuel Cell, Fission (TO:AUE p.120) or Primitive engines.
        for (const tag of ["compact", "cell", "fission", "primitive"]) {
            expect(getLargeEngineType(tag), tag).toBeUndefined();
        }
    });

    it("cites the XXL engine rules box (TO:AUE p.121)", () => {
        expect(mechEngineTypes.filter(engine => engine.tag.endsWith("xxl")).map(engine => [engine.book, engine.page]))
            .toEqual([["TO:AUE", 121], ["TO:AUE", 121]]);
    });

    it("weighs ratings above 400 from the Large Engine Weight Table and offers no other columns (TO:AUE p.120)", () => {
        // rating: [ICE, standard, light, XL, XXL]
        const table: Record<number, number[]> = {
            405: [113, 56.5, 42.5, 28.5, 19], 420: [145, 72.5, 54.5, 36.5, 24.5], 450: [267, 133.5, 100.5, 67, 44.5],
            475: [486, 243, 182.5, 121.5, 81], 500: [925, 462.5, 347, 231.5, 154.5],
        };
        for (const [rating, [ice, standard, light, xl, xxl]] of Object.entries(table)) {
            const option = mechEngineOptions.find(item => item.rating === +rating)!;
            expect(option.weight, rating).toEqual({ standard, xl, clan_xl: xl, light, xxl, clan_xxl: xxl, ice });
        }
        for (const option of mechEngineOptions.filter(item => item.rating > 400)) {
            expect(Object.keys(option.weight).sort(), option.name).toEqual(["clan_xl", "clan_xxl", "ice", "light", "standard", "xl", "xxl"]);
        }
    });

    it("gives Primitive engines no weight once the adjusted rating passes 400 (IO:AE p.117: TM Master Engine Table)", () => {
        // 330 x 1.2 = 396, rounded up to 400: the last primitive engine. 335 x 1.2 = 402.
        expect(mechEngineOptions.find(item => item.rating === 330)?.weight.primitive).toBe(52.5);
        expect(mechEngineOptions.filter(item => item.rating >= 335 && item.weight.primitive !== undefined)).toEqual([]);
    });

    it("offers a large engine by its own dates, not its base type's", () => {
        // Rating 500 in the Late Republic (3101-3130): all five are in production (Large XXL from 3130).
        const lateRepublic = build(100, 5, "standard");
        for (const tag of ["standard", "ice", "light", "xl", "xxl"]) {
            expect(offered(lateRepublic, tag, 4), tag).toEqual([true, false]);
        }
        for (const tag of ["compact", "cell", "fission", "primitive"]) {
            expect(offered(lateRepublic, tag, 4)?.[0], tag).toBe(false);
        }

        // Civil War (3062-3067): Large Fusion is still a prototype (production ~3085); Large Light is in production (3065).
        const civilWar = build(100, 5, "standard", "is", "civil-war");
        expect(offered(civilWar, "standard", 4)).toEqual([true, true]);
        expect(offered(civilWar, "standard", 2)).toEqual([false, false]);
        expect(offered(civilWar, "light", 2)).toEqual([true, false]);
        expect(offered(civilWar, "xl", 4)).toEqual([true, true]);
        expect(offered(civilWar, "xxl", 4)).toEqual([true, true]);

        // The same types at rating 400 keep their own, earlier dates.
        const standardSize = build(100, 4, "standard", "is", "civil-war");
        expect(offered(standardSize, "standard", 2)).toEqual([true, false]);
        expect(offered(standardSize, "xl", 2)).toEqual([true, false]);
    });

    it("loses the Inner Sphere Large XL prototype in 2822 and gets it back in 3054 (IO:AE p.38)", () => {
        expect(offered(build(100, 5, "xl", "is", "star-league"), "xl", 4)).toEqual([true, true]);
        expect(offered(build(100, 5, "xl", "is", "late-sw-lt"), "xl", 4)).toEqual([false, false]);
        expect(offered(build(100, 5, "xl", "is", "clan-inv"), "xl", 4)).toEqual([true, true]);
        expect(offered(build(100, 5, "xl", "is", "clan-inv"), "xl", 2)).toEqual([false, false]);
        expect(offered(build(100, 5, "xl", "is", "early-rep"), "xl", 2)).toEqual([true, false]);
    });

    it("dates the Clan Large XL from ~2850 (prototype) and ~3080 (IO:AE p.38)", () => {
        expect(offered(build(100, 5, "clan_xl", "clan", "the-founding"), "clan_xl", 4)).toEqual([false, false]);
        expect(offered(build(100, 5, "clan_xl", "clan", "golden-century"), "clan_xl", 4)).toEqual([true, true]);
        expect(offered(build(100, 5, "clan_xl", "clan", "jihad"), "clan_xl", 2)).toEqual([true, false]);
    });

    it("names, prices and sizes a large engine from its record", () => {
        const mech = build(100, 5, "xl");
        expect(mech.getLargeEngineType()?.tag).toBe("large-xl");
        expect(build(100, 4, "xl").getLargeEngineType()).toBeNull();
        expect(mech.getEngineName()).toBe("Large XL Fusion");
        expect(build(100, 4, "xl").getEngineName()).toBe("XL Fusion");
        const html = mech.getCBillCalcHTML();
        expect(html).toContain("Engine: Large XL Fusion");
        expect(html).toContain("40,000 [Multiplier] x Engine Rating [500]");
        const slots = (location: "centerTorso" | "leftTorso" | "rightTorso") =>
            mech.getCriticals()[location].filter(item => item?.tag === "engine").reduce((total, item) => total + (item?.crits ?? 1), 0);
        expect([slots("centerTorso"), slots("leftTorso"), slots("rightTorso")]).toEqual([8, 3, 3]);
    });
});

describe("Batch 17 explosive weapons in Battle Value (TO:AUE pp.194-195)", () => {
    const mount = (tag: string) => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("dark-ages");
        mech.setTonnage(75);
        mech.setWalkSpeed(4);
        const item = mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined)!;
        const from = mech.unallocatedCriticals.findIndex(critical => critical?.uuid === item.uuid);
        const slot = mech.getCriticals().rightArm.findIndex(critical => !critical);
        expect(mech.moveCritical("un", from, "ra", slot), tag).toBe(true);
        return mech;
    };
    // Points taken off for the named item: the log prints one line per item per location, "(Inner Sphere, -N)".
    const penalties = (mech: BattleMech, name: string) =>
        mech.getBVCalcHTML().split("<br />")
            .filter(line => line.startsWith(`Explosive Component Crit (${name}) in `))
            .reduce((total, line) => total + Number(/-(\d+)\)$/.exec(line)?.[1] ?? 0), 0);

    it("gives a PPC with a Capacitor its combined Battle Value and marks it explosive", () => {
        // tag: BV (TO:AUE p.194, "Treat as Gauss weapon when calculating defensive battle rating")
        const expected: Record<string, number> = {
            "ppc-capacitor": 264, "heavy-ppc-capacitor": 370, "light-ppc-capacitor": 132,
            "snub-nose-ppc-capacitor": 252, "er-ppc-capacitor": 343,
        };
        for (const [tag, battleValue] of Object.entries(expected)) {
            expect(mechISEquipmentEnergy.find(item => item.tag === tag), tag).toMatchObject({ battleValue, explosive: true, book: "TO:AUE", page: 149 });
        }
    });

    it("takes one point off the defensive rating for each slot of a PPC with a Capacitor", () => {
        // PPC (3 slots) + Capacitor (1 slot)
        expect(penalties(mount("ppc-capacitor"), "PPC w/ Capacitor")).toBe(4);
        expect(penalties(mount("standard-ppc"), "PPC")).toBe(0);
    });

    it("takes a single point off for an HVAC, whatever its size (footnote Q)", () => {
        for (const tag of ["is-hvac-2", "is-hvac-5", "is-hvac-10"]) {
            expect(mechISEquipmentBallistic.find(item => item.tag === tag), tag).toMatchObject({ explosive: true, explosiveBattleValueSlots: 1 });
        }
        expect(penalties(mount("is-hvac-10"), "HVAC/10")).toBe(1);
        expect(penalties(mount("is-hvac-2"), "HVAC/2")).toBe(1);
        // A Gauss Rifle still loses one point per slot.
        expect(penalties(mount("standard-gauss-rifle"), "Gauss Rifle")).toBe(7);
    });
});

describe("Batch 17 Battle Value follows critical slot moves", () => {
    it("recalculates when an explosive item is placed, without waiting for another change", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("dark-ages");
        mech.setTonnage(75);
        mech.setWalkSpeed(4);
        const gauss = mech.addEquipmentFromTag("standard-gauss-rifle", "is", "", false, undefined, "", false, [], undefined, undefined)!;
        const unplaced = mech.getBattleValue();
        const from = mech.unallocatedCriticals.findIndex(critical => critical?.uuid === gauss.uuid);
        expect(mech.moveCritical("un", from, "ra", mech.getCriticals().rightArm.findIndex(critical => !critical))).toBe(true);

        // The value a reload of the same design gives is the value shown straight after the move.
        expect(mech.getBattleValue()).toBe(new BattleMech(mech.exportJSON()).getBattleValue());
        expect(mech.getBattleValue()).toBeLessThan(unplaced);
    });
});

describe("Batch 18 TechManual table audit", () => {
    it("matches the TechManual tech ratings (pp.341-343), costs (pp.290-294) and the Nail/Rivet Gun rows (pp.317, 344)", () => {
        const expected: [{ tag: string }[], string, Record<string, unknown>][] = [
            [mechISEquipmentBallistic, "autocannon-light-2", { techRating: "d" }],
            [mechISEquipmentBallistic, "autocannon-light-5", { techRating: "d" }],
            [mechISEquipmentBallistic, "rotary-ac-2", { techRating: "e" }],
            [mechISEquipmentBallistic, "rotary-ac-5", { techRating: "e" }],
            [mechISEquipmentEnergy, "standard-flamer", { techRating: "c" }],
            [mechISEquipmentEnergy, "er-large-laser", { techRating: "e" }],
            [mechISEquipmentMissiles, "mrm-10", { techRating: "c" }],
            [mechISEquipmentMissiles, "mrm-20", { techRating: "c" }],
            [mechISEquipmentMissiles, "mrm-30", { techRating: "c" }],
            [mechISEquipmentMissiles, "mrm-40", { techRating: "c" }],
            [mechISEquipmentMissiles, "rocket-launcher-10", { techRating: "b" }],
            [mechISEquipmentMissiles, "rocket-launcher-15", { techRating: "b" }],
            [mechISEquipmentMissiles, "rocket-launcher-20", { techRating: "b" }],
            [mechISEquipmentMissiles, "streak-srm-2", { techRating: "e" }],
            [mechISEquipmentMissiles, "streak-srm-4", { techRating: "e" }],
            [mechISEquipmentMissiles, "streak-srm-6", { techRating: "e" }],
            [mechClanEquipmentBallistic, "clan-autocannon-lbx-2", { techRating: "f" }],
            [mechClanEquipmentBallistic, "clan-autocannon-lbx-5", { techRating: "f" }],
            [mechClanEquipmentBallistic, "clan-autocannon-lbx-10", { techRating: "f" }],
            [mechClanEquipmentBallistic, "clan-autocannon-lbx-20", { techRating: "f" }],
            [mechClanEquipmentBallistic, "clan-autocannon-uac-2", { techRating: "f" }],
            [mechClanEquipmentBallistic, "clan-autocannon-uac-5", { techRating: "f" }],
            [mechClanEquipmentBallistic, "clan-autocannon-uac-10", { techRating: "f" }],
            [mechClanEquipmentBallistic, "clan-autocannon-uac-20", { techRating: "f" }],
            [mechClanEquipmentBallistic, "clan-light-machine-gun", { techRating: "f" }],
            [mechClanEquipmentBallistic, "ap-gauss-rifle", { cbills: 10000 }],
            // TM p.317: Nail/Rivet Gun ammunition has no Battle Value.
            [mechUniversalAmmo, "ammo-nail-rivet-gun-standard", { battleValue: 0, cbills: 300 }],
            [mechClanEquipmentEnergy, "er-small-laser-clan", { techRating: "f" }],
            [mechClanEquipmentEnergy, "small-heavy-laser", { techRating: "f" }],
            [mechClanEquipmentEnergy, "plasma-cannon", { techRating: "f" }],
            [mechClanEquipmentMissile, "clan-lrm-5", { techRating: "f" }],
            [mechClanEquipmentMissile, "clan-lrm-10", { techRating: "f" }],
            [mechClanEquipmentMissile, "clan-lrm-15", { techRating: "f" }],
            [mechClanEquipmentMissile, "clan-lrm-20", { techRating: "f" }],
            [mechUniversalEquipment, "nail-gun", { cbills: 7000, battleValue: 1, ammoBattleValue: 0, range: { min: 0, short: 1, medium: 0, long: 0 } }],
            [mechUniversalEquipment, "mining-drill", { cbills: 100000 }],
            [mechUniversalEquipment, "remote-sensor-dispenser", { cbills: 30000 }],
            [mechUniversalEquipment, "wrecking-ball", { cbills: 80000 }],
        ];
        for (const [catalog, tag, fields] of expected) {
            const item = catalog.find(entry => entry.tag === tag);
            expect(item, tag).toBeDefined();
            expect(item, tag).toMatchObject(fields);
        }
    });
});

describe("Batch 19 TO:AUE table audit", () => {
    it("matches the TO:AUE game data, construction data and tech ratings (pp.216-223)", () => {
        const expected: [{ tag: string }[], string, Record<string, unknown>][] = [
            [mechISEquipmentMissiles, "thunderbolt-5", { space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechISEquipmentMissiles, "thunderbolt-5-os", { space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechISEquipmentMissiles, "thunderbolt-5-ios", { space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechISEquipmentMissiles, "thunderbolt-10", { space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechISEquipmentMissiles, "thunderbolt-10-os", { space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechISEquipmentMissiles, "thunderbolt-10-ios", { space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechISEquipmentMissiles, "thunderbolt-15", { space: { battlemech: 3, protomech: -1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechISEquipmentMissiles, "thunderbolt-15-os", { space: { battlemech: 3, protomech: -1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechISEquipmentMissiles, "thunderbolt-15-ios", { space: { battlemech: 3, protomech: -1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechISEquipmentMissiles, "thunderbolt-20", { space: { battlemech: 5, protomech: -1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechISEquipmentMissiles, "thunderbolt-20-os", { space: { battlemech: 5, protomech: -1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechISEquipmentMissiles, "thunderbolt-20-ios", { space: { battlemech: 5, protomech: -1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 }, range: { min: 5, short: 6, medium: 12, long: 18 } }],
            [mechClanEquipmentBallistic, "protomech-autocannon-2", { space: { battlemech: 2, protomech: 1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 } }],
            [mechClanEquipmentBallistic, "protomech-autocannon-4", { space: { battlemech: 3, protomech: 1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 } }],
            [mechClanEquipmentBallistic, "protomech-autocannon-8", { space: { battlemech: 4, protomech: 2, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 } }],
            [mechClanEquipmentBallistic, "clan-autocannon-rac-2", { techRating: "f" }],
            [mechClanEquipmentBallistic, "clan-autocannon-rac-5", { techRating: "f" }],
            [mechClanEquipmentMissile, "streak-lrm-5", { techRating: "f" }],
            [mechClanEquipmentMissile, "streak-lrm-10", { techRating: "f" }],
            [mechClanEquipmentMissile, "streak-lrm-15", { techRating: "f" }],
            [mechClanEquipmentMissile, "streak-lrm-20", { techRating: "f" }],
            [mechClanEquipmentMisc, "clan-watchdog-cews", { cbills: 600000 }],
        ];
        for (const [catalog, tag, fields] of expected) {
            const item = catalog.find(entry => entry.tag === tag);
            expect(item, tag).toBeDefined();
            expect(item, tag).toMatchObject(fields);
        }
    });
});

describe("Batch 12c special munitions", () => {
    it("dates and cites the isAmmo records (IO:AE pp.53-56 and TO:AUE headers, gated by the launcher)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "ammo-is-arrow-iv-cluster": [2594, 2600, 2830, 3047, "TO:AUE", 166],
            "ammo-is-arrow-iv-homing": [2593, 2600, 2830, 3045, "TO:AUE", 166],
            "ammo-is-arrow-iv-illumination": [2615, 2621, 2800, 3047, "TO:AUE", 167],
            "ammo-is-arrow-iv-smoke": [2595, 2600, 2840, 3044, "TO:AUE", 168],
            "ammo-is-enhanced-lrm-artemis-iv": [3058, 3082, null, null, "TM", 207],
            "ammo-is-inarc-ecm": [3054, 3062, null, null, "TM", 233],
            "ammo-is-inarc-explosive": [3054, 3062, null, null, "TM", 233],
            "ammo-is-inarc-haywire": [3054, 3062, null, null, "TM", 233],
            "ammo-is-inarc-nemesis": [3054, 3062, null, null, "TM", 233],
            "ammo-is-long-tom-copperhead": [2640, 2645, 2800, 3051, "TO:AUE", 167],
            "ammo-is-long-tom-thunder": [undefined, 2621, 2833, 3051, "TO:AUE", 169],
            "ammo-is-lrm-artemis-iv": [2592, 2598, 2855, 3035, "TM", 207],
            "ammo-is-lrm-ftl": [3053, null, null, null, "TO:AUE", 180],
            "ammo-is-lrm-narc": [2520, 2587, 2795, 3035, "TW", 142],
            "ammo-is-lrm-swarm": [2615, 2621, 2833, 3053, "TO:AUE", 183],
            "ammo-is-lrt-artemis-iv": [2592, 2598, 2855, 3035, "TM", 207],
            "ammo-is-mech-mortar-airburst": [2540, 2544, 2819, 3043, "TO:AUE", 185],
            "ammo-is-mech-mortar-apersonnel": [2526, 2531, 2819, 3043, "TO:AUE", 186],
            "ammo-is-mech-mortar-flare": [2533, 2536, 2819, 3043, "TO:AUE", 186],
            "ammo-is-mech-mortar-smoke": [2526, 2531, 2819, 3043, "TO:AUE", 187],
            "ammo-is-sniper-copperhead": [2640, 2645, 2800, 3051, "TO:AUE", 167],
            "ammo-is-sniper-thunder": [undefined, 2621, 2833, 3051, "TO:AUE", 169],
            "ammo-is-srm-artemis-iv": [2592, 2598, 2855, 3035, "TM", 207],
            "ammo-is-srm-magnetic-pulse": [3055, 3057, 3065, null, "TO:AUE", 182],
            "ammo-is-srm-narc": [2520, 2587, 2795, 3035, "TW", 142],
            "ammo-is-srm-tandem-charge": [2757, 3062, null, null, "TO:AUE", 184],
            "ammo-is-srt-artemis-iv": [2592, 2598, 2855, 3035, "TM", 207],
            "ammo-is-thumper-copperhead": [2640, 2645, 2800, 3051, "TO:AUE", 167],
            "ammo-is-thumper-thunder": [undefined, 2621, 2833, 3051, "TO:AUE", 169],
            "ammo-is-arrow-iv-fae": [2593, 2600, 2830, 3044, "IO:AE", 159],
            "ammo-is-lrm-arad": [3066, null, null, null, "TO:AUE", 180],
            "ammo-is-heavy-flamer-coolant": [undefined, 3068, null, null, "TO:AUE", 173],
            "ammo-is-ac-2-flak": [2290, 2310, null, null, "TO:AUE", 164],
            "ammo-is-ac-2-tracer": [2290, 2300, null, null, "TO:AUE", 165],
            "ammo-is-ac-2-armor-piercing": [3055, 3059, null, null, "TM", 208],
            "ammo-is-ac-2-caseless": [3056, 3079, null, null, "TO:AUE", 164],
            "ammo-is-ac-2-flechette": [3053, 3055, null, null, "TM", 208],
            "ammo-is-ac-2-precision": [3058, 3062, null, null, "TM", 208],
            "ammo-is-lb-2x-cluster": [3055, 3058, null, null, "TM", 208],
            "ammo-is-ac-5-flak": [2240, 2310, null, null, "TO:AUE", 164],
            "ammo-is-ac-5-tracer": [2240, 2300, null, null, "TO:AUE", 165],
            "ammo-is-ac-5-armor-piercing": [3055, 3059, null, null, "TM", 208],
            "ammo-is-ac-5-caseless": [3056, 3079, null, null, "TO:AUE", 164],
            "ammo-is-ac-5-flechette": [3053, 3055, null, null, "TM", 208],
            "ammo-is-ac-5-precision": [3058, 3062, null, null, "TM", 208],
            "ammo-is-lb-5x-cluster": [3055, 3058, null, null, "TM", 208],
            "ammo-is-ac-10-flak": [2443, 2460, null, null, "TO:AUE", 164],
            "ammo-is-ac-10-tracer": [2443, 2460, null, null, "TO:AUE", 165],
            "ammo-is-ac-10-armor-piercing": [3055, 3059, null, null, "TM", 208],
            "ammo-is-ac-10-caseless": [3056, 3079, null, null, "TO:AUE", 164],
            "ammo-is-ac-10-flechette": [3053, 3055, null, null, "TM", 208],
            "ammo-is-ac-10-precision": [3058, 3062, null, null, "TM", 208],
            "ammo-is-lb-10x-cluster": [2590, 2595, 2840, 3035, "TM", 208],
            "ammo-is-ac-20-flak": [2488, 2500, null, null, "TO:AUE", 164],
            "ammo-is-ac-20-tracer": [2488, 2500, null, null, "TO:AUE", 165],
            "ammo-is-ac-20-armor-piercing": [3055, 3059, null, null, "TM", 208],
            "ammo-is-ac-20-caseless": [3056, 3079, null, null, "TO:AUE", 164],
            "ammo-is-ac-20-flechette": [3053, 3055, null, null, "TM", 208],
            "ammo-is-ac-20-precision": [3058, 3062, null, null, "TM", 208],
            "ammo-is-lb-20x-cluster": [3055, 3058, null, null, "TM", 208],
            "ammo-is-light-ac-2-armor-piercing": [3062, 3068, null, null, "TM", 208],
            "ammo-is-light-ac-2-caseless": [3062, 3079, null, null, "TO:AUE", 164],
            "ammo-is-light-ac-2-flak": [3062, 3068, null, null, "TO:AUE", 164],
            "ammo-is-light-ac-2-flechette": [3062, 3068, null, null, "TM", 208],
            "ammo-is-light-ac-2-precision": [3062, 3068, null, null, "TM", 208],
            "ammo-is-light-ac-2-tracer": [3062, 3068, null, null, "TO:AUE", 165],
            "ammo-is-light-ac-5-armor-piercing": [3062, 3068, null, null, "TM", 208],
            "ammo-is-light-ac-5-caseless": [3062, 3079, null, null, "TO:AUE", 164],
            "ammo-is-light-ac-5-flak": [3062, 3068, null, null, "TO:AUE", 164],
            "ammo-is-light-ac-5-flechette": [3062, 3068, null, null, "TM", 208],
            "ammo-is-light-ac-5-precision": [3062, 3068, null, null, "TM", 208],
            "ammo-is-light-ac-5-tracer": [3062, 3068, null, null, "TO:AUE", 165],
            "ammo-is-arrow-iv-davy-crockett-m": [2593, 2600, 2830, 3044, "IO:AE", 168],
            "ammo-is-lrm-thunder": [2618, 2620, 2840, 3052, "TO:AUE", 185],
            "ammo-is-srm-frag": [2375, 2377, 2790, 3054, "TM", 230],
            "ammo-is-arrow-iv-fascam": [undefined, 2621, 2833, 3051, "TO:AUE", 169],
            "ammo-is-long-tom-davy-crockett-m": [2480, 2500, null, null, "IO:AE", 168],
            "ammo-is-lrm-magnetic-pulse": [3055, 3057, 3065, null, "TO:AUE", 182],
            "ammo-is-lrm-fragmentation": [2375, 2377, 2790, 3054, "TM", 230],
            "ammo-is-srm-anti-radiation": [3066, null, null, null, "TO:AUE", 180],
            "ammo-is-enhanced-lrm-magnetic-pulse": [3058, null, 3065, null, "TO:AUE", 182],
            "ammo-is-enhanced-lrm-anti-radiation": [3066, null, null, null, "TO:AUE", 180],
            "ammo-is-enhanced-lrm-follow-the-leader": [3058, null, null, null, "TO:AUE", 180],
            "ammo-is-enhanced-lrm-heat-seeking": [3058, 3082, null, null, "TO:AUE", 181],
            "ammo-is-enhanced-lrm-semi-guided": [3058, 3082, null, null, "TM", 231],
            "ammo-is-enhanced-lrm-smoke": [3058, 3082, null, null, "TO:AUE", 183],
            "ammo-is-enhanced-lrm-swarm": [3058, 3082, null, null, "TO:AUE", 183],
            "ammo-is-enhanced-lrm-swarm-i": [3058, 3082, null, null, "TO:AUE", 183],
            "ammo-is-enhanced-lrm-thunder": [3058, 3082, null, null, "TO:AUE", 185],
            "ammo-is-enhanced-lrm-thunder-active": [3058, 3082, null, null, "TO:AUE", 185],
            "ammo-is-enhanced-lrm-thunder-augmented": [3058, 3082, null, null, "TO:AUE", 185],
            "ammo-is-enhanced-lrm-thunder-vibrabomb": [3058, 3082, null, null, "TO:AUE", 185],
            "ammo-is-enhanced-lrm-thunder-inferno": [3058, 3082, null, null, "TO:AUE", 185],
            "ammo-is-enhanced-lrm-anti-tsm": [3058, 3082, null, null, "IO:AE", 98],
            "ammo-is-enhanced-lrm-dead-fire": [3058, null, null, null, "IO:AE", 125],
            "ammo-is-enhanced-lrm-fragmentation": [3058, 3082, null, null, "TM", 230],
            "ammo-is-enhanced-lrm-mine-clearance": [3065, 3082, null, null, "TO:AUE", 182],
            "ammo-is-enhanced-lrm-narc-capable": [3058, 3082, null, null, "TW", 142],
            "ammo-is-extended-lrm-artemis-iv": [3054, 3078, null, null, "TM", 207],
            "ammo-is-bomb-laser-guided": [undefined, 2100, 2800, 3060, "TW", 247],
            "ammo-is-bomb-tag": [2600, 2605, 2835, 3035, "TM", 238],
            "ammo-is-bomb-arrow-iv": [2622, 2623, 2850, 3046, "TO:AUE", 171],
            "ammo-is-bomb-arrow-iv-homing": [2595, 2600, 2835, 3047, "TO:AUE", 171],
            "ammo-is-bomb-thunder": [2600, 2623, 2850, 3052, "TO:AUE", 172],
            "ammo-is-bomb-as-missile": [3071, 3075, null, null, "TO:AUE", 170],
            "ammo-is-bomb-asew-missile": [3067, 3073, null, null, "TO:AUE", 170],
            "ammo-is-bomb-laa-missile": [3069, 3072, null, null, "TO:AUE", 171],
            "ammo-is-bomb-rocket-launcher": [3060, 3064, null, null, "TM", 229],
            // moved from the universal catalog in Batch 12d (Inner Sphere only)
            "ammo-is-arrow-iv-ada": [3068, 3080, null, null, "TO:AUE", 165],
            "ammo-is-arrow-iv-inferno": [3053, 3055, null, null, "TO:AUE", 168],
            "ammo-is-arrow-iv-laser-inhibiting": [3053, 3083, null, null, "TO:AUE", 168],
            "ammo-is-arrow-iv-vibrabomb": [3056, 3065, null, null, "TO:AUE", 169],
            "ammo-is-lrm-anti-tsm": [3026, 3027, null, null, "IO:AE", 98],
            "ammo-is-srm-anti-tsm": [3026, 3027, null, null, "IO:AE", 98],
            "ammo-is-lrm-deadfire": [3052, null, null, null, "IO:AE", 125],
            "ammo-is-srm-deadfire": [3052, null, null, null, "IO:AE", 125],
            "ammo-is-lrm-listen-kill": [3037, null, 3040, null, "IO:AE", 99],
            "ammo-is-srm-listen-kill": [3037, null, 3040, null, "IO:AE", 99],
            "ammo-is-lrm-mine-clearance": [3065, 3069, null, null, "TO:AUE", 182],
            "ammo-is-srm-mine-clearance": [3065, 3069, null, null, "TO:AUE", 182],
            "ammo-is-lrm-semi-guided": [3053, 3057, null, null, "TM", 231],
            "ammo-is-lrm-swarm-i": [3052, 3057, null, null, "TO:AUE", 183],
            "ammo-is-lrm-thunder-active": [3054, 3058, null, null, "TO:AUE", 185],
            "ammo-is-lrm-thunder-augmented": [3054, 3057, null, null, "TO:AUE", 185],
            "ammo-is-lrm-thunder-inferno": [3054, 3056, null, null, "TO:AUE", 185],
            "ammo-is-lrm-thunder-vibrabomb": [3054, 3056, null, null, "TO:AUE", 185],
            "ammo-is-mech-mortar-guided": [3055, 3064, null, null, "TO:AUE", 186],
            "ammo-is-narc-explosive": [3054, 3060, null, null, "TM", 233],
            "ammo-is-srm-acid": [3053, null, null, null, "TO:AUE", 179],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechISAmmo.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the isAmmo records", () => {
        for (const item of mechISAmmo) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("dates and cites the clanAmmo records (IO:AE pp.53-56 and TO:AUE headers, gated by the launcher)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "ammo-clan-arrow-iv-cluster": [undefined, 2844, null, null, "TO:AUE", 166],
            "ammo-clan-arrow-iv-fascam": [undefined, 2844, null, null, "TO:AUE", 169],
            "ammo-clan-arrow-iv-homing": [undefined, 2844, null, null, "TO:AUE", 166],
            "ammo-clan-arrow-iv-illumination": [undefined, 2844, null, null, "TO:AUE", 167],
            "ammo-clan-atm-er": [3052, 3053, null, null, "TM", 231],
            "ammo-clan-atm-he": [3052, 3054, null, null, "TM", 231],
            "ammo-clan-iatm-inferno": [3070, null, null, null, "IO:AE", 61],
            "ammo-clan-iatm-mag-pulse": [3070, null, 3080, null, "IO:AE", 61],
            "ammo-clan-long-tom-copperhead": [2640, 2645, null, null, "TO:AUE", 167],
            "ammo-clan-long-tom-fascam": [undefined, 2621, null, null, "TO:AUE", 169],
            "ammo-clan-lrm-artemis-iv": [undefined, 2818, null, null, "TM", 207],
            "ammo-clan-lrm-artemis-v": [3061, 3085, null, null, "TO:AUE", 95],
            "ammo-clan-lrm-fascam": [2618, 2620, null, null, "TO:AUE", 185],
            "ammo-clan-lrm-narc": [undefined, 2828, null, null, "TW", 142],
            "ammo-clan-lrm-swarm": [2615, 2621, null, null, "TO:AUE", 183],
            "ammo-clan-lrt-artemis-iv": [2820, 2824, null, null, "TM", 207],
            "ammo-clan-mech-mortar-airburst": [2835, 2840, null, null, "TO:AUE", 185],
            "ammo-clan-mech-mortar-apersonnel": [2835, 2840, null, null, "TO:AUE", 186],
            "ammo-clan-mech-mortar-flare": [2835, 2840, null, null, "TO:AUE", 186],
            "ammo-clan-mech-mortar-smoke": [2835, 2840, null, null, "TO:AUE", 187],
            "ammo-clan-lrt-artemis-v": [3061, 3085, null, null, "TO:AUE", 95],
            "ammo-clan-sniper-copperhead": [2640, 2645, null, null, "TO:AUE", 167],
            "ammo-clan-srm-artemis-iv": [undefined, 2818, null, null, "TM", 207],
            "ammo-clan-sniper-fascam": [undefined, 2621, null, null, "TO:AUE", 169],
            "ammo-clan-srm-artemis-v": [3061, 3085, null, null, "TO:AUE", 95],
            "ammo-clan-srm-frag": [2375, 2377, null, null, "TM", 230],
            "ammo-clan-srm-narc": [undefined, 2828, null, null, "TW", 142],
            "ammo-clan-srt-artemis-iv": [2820, 2824, null, null, "TM", 207],
            "ammo-clan-srt-artemis-v": [3061, 3085, null, null, "TO:AUE", 95],
            "ammo-clan-thumper-copperhead": [2640, 2645, null, null, "TO:AUE", 167],
            "ammo-clan-thumper-fascam": [undefined, 2621, null, null, "TO:AUE", 169],
            "ammo-clan-arrow-iv-fae": [undefined, 2844, null, null, "IO:AE", 159],
            "ammo-clan-lrm-arad": [3057, null, null, null, "TO:AUE", 180],
            "ammo-clan-heavy-flamer-coolant": [3065, 3067, null, null, "TO:AUE", 173],
            "ammo-clan-ac-2-flak": [2290, 2310, 2850, null, "TO:AUE", 164],
            "ammo-clan-ac-2-tracer": [2290, 2300, 2850, null, "TO:AUE", 165],
            "ammo-clan-ac-5-flak": [2240, 2310, 2850, null, "TO:AUE", 164],
            "ammo-clan-ac-5-tracer": [2240, 2300, 2850, null, "TO:AUE", 165],
            "ammo-clan-ac-10-flak": [2443, 2460, 2850, null, "TO:AUE", 164],
            "ammo-clan-ac-10-tracer": [2443, 2460, 2850, null, "TO:AUE", 165],
            "ammo-clan-ac-20-flak": [2488, 2500, 2850, null, "TO:AUE", 164],
            "ammo-clan-ac-20-tracer": [2488, 2500, 2850, null, "TO:AUE", 165],
            "ammo-clan-lrm-ftl": [3053, null, null, null, "TO:AUE", 180],
            "ammo-clan-lb-2x-cluster": [2824, 2826, null, null, "TM", 208],
            "ammo-clan-lb-5x-cluster": [2824, 2826, null, null, "TM", 208],
            "ammo-clan-lb-10x-cluster": [2824, 2826, null, null, "TM", 208],
            "ammo-clan-lb-20x-cluster": [2824, 2826, null, null, "TM", 208],
            "ammo-clan-arrow-iv-smoke": [undefined, 2844, null, null, "TO:AUE", 168],
            "ammo-clan-lrm-fragmentation": [2375, 2377, null, null, "TM", 230],
            "ammo-clan-srm-anti-radiation": [3057, null, null, null, "TO:AUE", 180],
            "ammo-clan-bomb-laser-guided": [undefined, 2100, null, null, "TW", 247],
            "ammo-clan-bomb-tag": [2600, 2605, null, null, "TM", 238],
            "ammo-clan-bomb-arrow-iv": [2622, 2623, null, null, "TO:AUE", 171],
            "ammo-clan-bomb-arrow-iv-homing": [2595, 2600, null, null, "TO:AUE", 171],
            "ammo-clan-bomb-thunder": [2600, 2623, null, null, "TO:AUE", 172],
            "ammo-clan-bomb-as-missile": [undefined, 3076, null, null, "TO:AUE", 170],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechClanAmmo.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the clanAmmo records", () => {
        for (const item of mechClanAmmo) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });

    it("dates and cites the universalAmmo records (IO:AE pp.53-56 and TO:AUE headers, gated by the launcher)", () => {
        // tag: [prototype, production, extinct, reintroduced, book, page]
        const expected: Record<string, [number | undefined, number | null, number | null, number | null, string, number]> = {
            "ammo-long-tom-cannon-fae": [3012, 3079, null, null, "IO:AE", 159],
            "ammo-lrm-incendiary": [2341, 2342, null, null, "TO:AUE", 182],
            "ammo-lrm-smoke": [2341, 2342, null, null, "TO:AUE", 183],
            "ammo-sniper-cannon-fae": [3012, 3079, null, null, "IO:AE", 159],
            "ammo-srm-heatseeking": [2365, 2370, null, null, "TO:AUE", 181],
            "ammo-srm-inferno": [2370, 2380, null, null, "TW", 141],
            "ammo-srm-smoke": [2365, 2370, null, null, "TO:AUE", 183],
            "ammo-srm-tear-gas": [2370, 2375, null, null, "TO:AUE", 184],
            "ammo-srt-harpoon": [2395, 2400, null, null, "TO:AUE", 181],
            "ammo-thumper-cannon-fae": [3012, 3079, null, null, "IO:AE", 159],
            "ammo-vehicle-flamer-coolant": [undefined, 2100, null, null, "TO:AUE", 173],
            "ammo-heavy-flamer-inferno": [3065, 3067, null, null, "TO:AUE", 174],
            "ammo-heavy-flamer-water": [3065, 3067, null, null, "TO:AUE", 175],
            "ammo-vehicle-flamer-inferno": [2390, 2400, null, null, "TO:AUE", 174],
            "ammo-vehicle-flamer-water": [undefined, 1950, null, null, "TO:AUE", 175],
            "ammo-long-tom-cluster": [2445, 2500, null, null, "TO:AUE", 166],
            "ammo-sniper-cluster": [undefined, 1950, null, null, "TO:AUE", 166],
            "ammo-thumper-cluster": [undefined, 1950, null, null, "TO:AUE", 166],
            "ammo-long-tom-flechette": [2445, 2500, null, null, "TO:AUE", 167],
            "ammo-long-tom-illumination": [undefined, 2505, null, null, "TO:AUE", 167],
            "ammo-long-tom-smoke": [2445, 2500, null, null, "TO:AUE", 168],
            "ammo-sniper-flechette": [undefined, 2100, null, null, "TO:AUE", 167],
            "ammo-sniper-illumination": [undefined, 2100, null, null, "TO:AUE", 167],
            "ammo-sniper-smoke": [undefined, 1950, null, null, "TO:AUE", 168],
            "ammo-thumper-flechette": [undefined, 2100, null, null, "TO:AUE", 167],
            "ammo-thumper-illumination": [undefined, 2100, null, null, "TO:AUE", 167],
            "ammo-thumper-smoke": [undefined, 1950, null, null, "TO:AUE", 168],
            "ammo-lrm-heat-seeking": [2390, 2430, null, null, "TO:AUE", 181],
            "ammo-long-tom-fae": [2445, 2500, null, null, "IO:AE", 159],
            "ammo-sniper-fae": [undefined, 1950, null, null, "IO:AE", 159],
            "ammo-thumper-fae": [undefined, 1950, null, null, "IO:AE", 159],
            "ammo-bomb-cluster": [undefined, 1950, null, null, "TW", 246],
            "ammo-bomb-inferno": [undefined, 1950, null, null, "TO:AUE", 171],
            "ammo-bomb-torpedo": [undefined, 1950, null, null, "TO:AUE", 172],
            "ammo-bomb-fuel-air-small": [undefined, 1950, null, null, "IO:AE", 159],
            "ammo-bomb-fuel-air-large": [undefined, 1950, null, null, "IO:AE", 159],
            "ammo-bomb-aaa-missile": [3069, 3072, null, null, "TO:AUE", 169],
        };
        for (const [tag, want] of Object.entries(expected)) {
            const item = mechUniversalAmmo.find(record => record.tag === tag);
            expect([item?.prototype, item?.introduced, item?.extinct, item?.reintroduced, item?.book, item?.page], tag).toEqual(want);
        }
    });

    it("uses null, not 0, for unknown dates in the universalAmmo records", () => {
        for (const item of mechUniversalAmmo) {
            expect(item.introduced, item.tag).not.toBe(0);
            expect(item.extinct, item.tag).not.toBe(0);
            expect(item.reintroduced, item.tag).not.toBe(0);
            expect(typeof item.page, item.tag).toBe("number");
        }
    });
});

describe("Batch 12d saved designs keep equipment from the other tech base", () => {
    it("loads an Inner Sphere munition on a Clan design saved before the munition left the universal catalog", () => {
        const clan = new BattleMech();
        clan.setTech("clan");
        clan.setEra("dark-ages");
        clan.setTonnage(50);
        // A Clan design is no longer offered the round...
        expect(clan.addEquipmentFromTag("ammo-lrm-semi-guided", "clan", "", false, undefined, "", false, [], undefined, undefined)).toBeNull();
        // ...but one saved with it still loads, under the record's current tag.
        const donor = new BattleMech();
        donor.setTech("is");
        donor.setTonnage(50);
        donor.addEquipmentFromTag("ammo-is-lrm-semi-guided", "is", "", false, undefined, "", false, [], undefined, undefined);
        const saved = JSON.parse(donor.exportJSON());
        saved.tech = "clan";
        saved.equipment[0].tag = "ammo-lrm-semi-guided";

        const restored = new BattleMech(JSON.stringify(saved));
        expect(restored.getTech().tag).toBe("clan");
        expect(restored.equipmentList.map(item => item.tag)).toEqual(["ammo-is-lrm-semi-guided"]);
    });
});

describe("Batch 21 Superheavy 'Mech equipment limits (IO:AE p.156)", () => {
    const build = (tonnage: number) => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("late-rep");
        mech.setTonnage(tonnage);
        mech.setWalkSpeed(2);
        return mech;
    };
    const offered = (mech: BattleMech) => new Map(mech.getAvailableEquipment(false, 4).map(item => [item.tag, !!item.available]));
    const add = (mech: BattleMech, tag: string) =>
        mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined);

    it("offers no MASC, Supercharger, AES, Modular Armor, jump boosters or partial wings", () => {
        const heavy = offered(build(100));
        const superheavy = offered(build(150));
        for (const tag of ["masc", "supercharger", "aes-arm", "aes-leg", "modular-armor", "mechanical-jump-booster", "partial-wing"]) {
            expect(heavy.get(tag), `100 tons: ${tag}`).toBe(true);
            expect(superheavy.get(tag), `150 tons: ${tag}`).toBe(false);
        }
        // Weapons are unaffected.
        expect(superheavy.get("medium-laser")).toBe(true);
    });

    it("offers no Triple-Strength Myomer of any kind", () => {
        const myomer = (mech: BattleMech) => new Map(mech.getAvailableMyomerTypes(4).map(item => [item.tag, !!item.available]));
        expect(myomer(build(100)).get("tsm")).toBe(true);
        const superheavy = myomer(build(150));
        expect([superheavy.get("standard"), superheavy.get("tsm"), superheavy.get("industrial-tsm"), superheavy.get("prototype-tsm")])
            .toEqual([true, false, false, false]);
    });

    it("cannot jump: no jump jets, improved jump jets or UMUs", () => {
        const heavy = build(100);
        heavy.setJumpSpeed(2);
        expect(heavy.getJumpSpeed()).toBe(2);

        const superheavy = build(150);
        expect(superheavy.getAvailableJumpJets(4).some(jumpJet => jumpJet.available)).toBe(false);
        expect(superheavy.getMaxJumpSpeed()).toBe(0);
        superheavy.setJumpSpeed(2);
        expect(superheavy.getJumpSpeed()).toBe(0);
    });

    it("drops jump MP and Triple-Strength Myomer when a design is made superheavy", () => {
        const mech = build(100);
        mech.setJumpSpeed(2);
        mech.setMyomerType("tsm");
        expect(mech.hasTripleStrengthMyomer()).toBe(true);
        mech.setTonnage(150);
        expect(mech.getJumpSpeed()).toBe(0);
        expect(mech.hasTripleStrengthMyomer()).toBe(false);
    });

    it("reports prohibited equipment a superheavy design still mounts", () => {
        const mech = build(100);
        add(mech, "masc");
        add(mech, "supercharger");
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
        mech.setTonnage(150);
        expect(mech.getChassisEquipmentViolations()).toEqual([
            "MASC cannot be mounted on a superheavy 'Mech.",
            "Supercharger cannot be mounted on a superheavy 'Mech.",
        ]);
    });

    it("allows one Supercharger per unit (TO:AUE p.156, errata v7.0)", () => {
        const mech = build(75);
        expect(offered(mech).get("supercharger")).toBe(true);
        add(mech, "supercharger");
        expect(offered(mech).get("supercharger")).toBe(false);
        add(mech, "supercharger");
        expect(mech.getChassisEquipmentViolations()).toEqual(["Supercharger: 2 mounted; at most 1 allowed."]);
    });
});

describe("Batch 22 Superheavy 'Mech structure (IO:AE p.155)", () => {
    // mass: [standard, endo composite, endo steel, industrial weight, head, center torso, side torso, arm, leg]
    const table: Record<number, number[]> = {
        105: [21, 16, 10.5, 42, 4, 32, 22, 17, 22], 110: [22, 16.5, 11, 44, 4, 33, 23, 18, 23],
        115: [23, 17.5, 11.5, 46, 4, 35, 24, 19, 24], 120: [24, 18, 12, 48, 4, 36, 25, 20, 25],
        125: [25, 19, 12.5, 50, 4, 38, 26, 21, 26], 130: [26, 19.5, 13, 52, 4, 39, 27, 21, 27],
        135: [27, 20.5, 13.5, 54, 4, 41, 28, 22, 28], 140: [28, 21, 14, 56, 4, 42, 29, 23, 29],
        145: [29, 22, 14.5, 58, 4, 44, 31, 24, 31], 150: [30, 22.5, 15, 60, 4, 45, 32, 25, 32],
        155: [31, 23.5, 15.5, 62, 4, 47, 33, 26, 33], 160: [32, 24, 16, 64, 4, 48, 34, 26, 34],
        165: [33, 25, 16.5, 66, 4, 50, 35, 27, 35], 170: [34, 25.5, 17, 68, 4, 51, 36, 28, 36],
        175: [35, 26.5, 17.5, 70, 4, 53, 37, 29, 37], 180: [36, 27, 18, 72, 4, 54, 38, 30, 38],
        185: [37, 28, 18.5, 74, 4, 56, 39, 31, 39], 190: [38, 28.5, 19, 76, 4, 57, 40, 31, 40],
        195: [39, 29.5, 19.5, 78, 4, 59, 41, 32, 41], 200: [40, 30, 20, 80, 4, 60, 42, 33, 42],
    };
    const build = (tonnage: number, structure: string) => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("dark-ages");
        mech.setTonnage(tonnage);
        mech.setInternalStructureType(structure);
        return mech;
    };

    it("gives every location the structure points of the Superheavy 'Mech Structure Table", () => {
        for (const [mass, [, , , , head, centerTorso, sideTorso, arm, leg]] of Object.entries(table)) {
            const structure = build(+mass, "standard").getInternalStructure();
            expect([structure.head, structure.centerTorso, structure.leftTorso, structure.rightTorso, structure.leftArm, structure.rightArm, structure.leftLeg, structure.rightLeg], mass)
                .toEqual([head, centerTorso, sideTorso, sideTorso, arm, arm, leg, leg]);
        }
    });

    it("weighs standard, endo-composite and endo steel structure at 20, 15 and 10 percent", () => {
        for (const [mass, [standard, endoComposite, endoSteel]] of Object.entries(table)) {
            expect(build(+mass, "standard").getInternalStructureWeight(), `${mass} standard`).toBe(standard);
            expect(build(+mass, "endo-composite").getInternalStructureWeight(), `${mass} endo-composite`).toBe(endoComposite);
            expect(build(+mass, "endo-steel").getInternalStructureWeight(), `${mass} endo steel`).toBe(endoSteel);
        }
    });
});

describe("Batch 22 Superheavy 'Mech structure types (IO:AE p.155)", () => {
    const build = (tonnage: number) => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("dark-ages");
        mech.setTonnage(tonnage);
        return mech;
    };
    const available = (mech: BattleMech) => mech.getAvailableInternalStructures(4).filter(item => item.available).map(item => item.tag).sort();

    it("offers only standard, endo steel, endo-composite and industrial structure above 100 tons", () => {
        expect(available(build(100))).toEqual(["composite", "endo-composite", "endo-steel", "industrial", "reinforced", "standard"]);
        expect(available(build(150))).toEqual(["endo-composite", "endo-steel", "industrial", "standard"]);
    });

    it("reverts another structure type to standard when a design becomes superheavy", () => {
        const mech = build(100);
        mech.setInternalStructureType("reinforced");
        expect(mech.getInternalStructureType()).toBe("reinforced");
        mech.setTonnage(150);
        expect(mech.getInternalStructureType()).toBe("standard");
    });
});

describe("Batch 23 Rotary AC Caseless rounds are Custom", () => {
    const build = (tech: string) => {
        const mech = new BattleMech();
        mech.setTech(tech);
        mech.setEra("dark-ages");
        mech.setTonnage(75);
        return mech;
    };

    it("offers them only when Custom equipment is included", () => {
        for (const tech of ["is", "clan"]) {
            const caseless = (includeCustom: boolean) =>
                build(tech).getAvailableEquipment(includeCustom, 5).filter(item => /rotary-ac-\d-caseless/.test(item.tag)).map(item => item.tag).sort();
            expect(caseless(false), tech).toEqual([]);
            expect(caseless(true), tech).toEqual([
                "ammo-clan-rotary-ac-2-caseless", "ammo-clan-rotary-ac-5-caseless", "ammo-is-rotary-ac-2-caseless", "ammo-is-rotary-ac-5-caseless",
            ]);
        }
    });

    it("still loads a design saved with them", () => {
        for (const [tech, tag] of [["is", "ammo-is-rotary-ac-5-caseless"], ["clan", "ammo-clan-rotary-ac-5-caseless"]]) {
            const donor = build(tech);
            donor.addEquipmentFromTag(tech === "is" ? "ammo-is-rotary-ac-5-standard" : "ammo-clan-rotary-ac-5-standard", tech, "", false, undefined, "", false, [], undefined, undefined);
            const saved = JSON.parse(donor.exportJSON());
            saved.equipment[0].tag = tag;

            const restored = new BattleMech(JSON.stringify(saved));
            expect(restored.equipmentList.map(item => item.tag), tech).toEqual([tag]);
        }
    });
});

describe("Batch 24 cockpit critical slots (IO:AE record sheets, pp.128, 156, 159)", () => {
    const cockpitSlots = (type: string, tonnage: number) => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("dark-ages");
        mech.setType(type);
        mech.setTonnage(tonnage);
        const criticals = mech.getCriticals();
        const names = (slots: ({ tag: string, name: string } | null)[]) =>
            slots.map((item, index) => item && /cockpit/.test(item.tag) ? `${index + 1}. ${item.name}` : "").filter(Boolean);
        return { head: names(criticals.head), centerTorso: names(criticals.centerTorso) };
    };

    it("puts a Tripod cockpit in one head slot, whatever its weight", () => {
        expect(cockpitSlots("tripod", 75)).toEqual({ head: ["3. Tripod Cockpit"], centerTorso: [] });
        expect(cockpitSlots("tripod", 150)).toEqual({ head: ["3. Superheavy Tripod Cockpit"], centerTorso: [] });
    });

    it("puts a superheavy cockpit in one head slot", () => {
        expect(cockpitSlots("biped", 150)).toEqual({ head: ["3. Superheavy Cockpit"], centerTorso: [] });
        expect(cockpitSlots("quad", 150)).toEqual({ head: ["3. Superheavy Cockpit"], centerTorso: [] });
    });

    it("puts the QuadVee pilot and gunner in two head slots", () => {
        expect(cockpitSlots("quadvee", 75)).toEqual({ head: ["3. Cockpit (Pilot)", "4. Cockpit (Gunner)"], centerTorso: [] });
    });
});

describe("Batch 24 Superheavy 'Mech critical space (IO:AE pp.155-157)", () => {
    const build = (tonnage: number) => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("dark-ages");
        mech.setTonnage(tonnage);
        mech.setWalkSpeed(2);
        return mech;
    };
    const add = (mech: BattleMech, tag: string) =>
        mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined);
    const free = (slots: unknown[]) => slots.filter(item => !item).length;
    const unallocated = (mech: BattleMech, tag: string) => mech.getUnallocatedCriticals().filter(item => item.tag === tag);

    it("halves the engine's slots in every location, rounding up", () => {
        // slots left free in [center torso, left torso, right torso] of a 150-ton 'Mech (2 gyro slots)
        const expected: Record<string, number[]> = {
            "standard": [7, 12, 12],     // 6 -> 3
            "xl": [7, 10, 10],           // 6 + 3 + 3 -> 3 + 2 + 2 (the SHP-4X Omega, p.157)
            "light": [7, 11, 11],        // 6 + 2 + 2 -> 3 + 1 + 1
            "compact": [8, 12, 12],      // 3 -> 2
            "xxl": [7, 9, 9],            // 6 + 6 + 6 -> 3 + 3 + 3
        };
        for (const [engine, slots] of Object.entries(expected)) {
            const mech = build(150);
            mech.setEngineType(engine);
            const criticals = mech.getCriticals();
            expect([free(criticals.centerTorso), free(criticals.leftTorso), free(criticals.rightTorso)], engine).toEqual(slots);
        }
        const heavy = build(100);
        heavy.setEngineType("xl");
        const criticals = heavy.getCriticals();
        expect([free(criticals.centerTorso), free(criticals.leftTorso), free(criticals.rightTorso)]).toEqual([2, 9, 9]);
    });

    it("lays the center torso out as on the superheavy record sheet: three engine slots, then the gyro", () => {
        const names = build(150).getCriticals().centerTorso.map(item => !item ? "" : item.placeholder ? "..." : item.tag);
        expect(names).toEqual(["engine", "...", "...", "gyro", "...", "", "", "", "", "", "", ""]);
    });

    it("gives endo steel 7 slots and endo-composite 4", () => {
        const expected: [number, string, number][] = [
            [150, "endo-steel", 7], [150, "endo-composite", 4], [150, "standard", 0],
            [100, "endo-steel", 14], [100, "endo-composite", 7],
        ];
        for (const [tonnage, structure, slots] of expected) {
            const mech = build(tonnage);
            mech.setInternalStructureType(structure);
            expect(unallocated(mech, structure).length, `${tonnage} tons ${structure}`).toBe(slots);
        }
    });

    it("halves armor slots", () => {
        const expected: [number, string, number][] = [
            [150, "ferro-fibrous", 7], [150, "light-ferro-fibrous", 4], [150, "heavy-ferro-fibrous", 11],
            [100, "ferro-fibrous", 14], [100, "light-ferro-fibrous", 7], [100, "heavy-ferro-fibrous", 21],
        ];
        for (const [tonnage, armor, slots] of expected) {
            const mech = build(tonnage);
            mech.setArmorType(armor);
            expect(unallocated(mech, armor).length, `${tonnage} tons ${armor}`).toBe(slots);
        }
    });

    it("halves the slots of weapons and equipment, rounding up, without sharing", () => {
        // tag: [standard slots, superheavy slots]
        const expected: Record<string, [number, number]> = {
            "autocannon-standard-c": [7, 4], "standard-gauss-rifle": [7, 4], "autocannon-lbx-10": [6, 3], "medium-laser": [1, 1], "standard-ppc": [3, 2], "lrm-20": [5, 3],
        };
        for (const [tag, [standardSlots, superheavySlots]] of Object.entries(expected)) {
            const heavy = build(100);
            const superheavy = build(150);
            expect(add(heavy, tag), tag).not.toBeNull();
            add(superheavy, tag);
            add(superheavy, tag);
            expect(unallocated(heavy, tag).map(item => item.crits), `100 tons ${tag}`).toEqual([standardSlots]);
            // Two of the same weapon take twice the slots: no sharing.
            expect(unallocated(superheavy, tag).map(item => item.crits), `150 tons ${tag}`).toEqual([superheavySlots, superheavySlots]);
            expect(superheavy.getAvailableEquipment(false, 4).find(item => item.tag === tag)?.criticals, `offered ${tag}`).toBe(superheavySlots);
            expect(heavy.getAvailableEquipment(false, 4).find(item => item.tag === tag)?.criticals, `offered ${tag}`).toBe(standardSlots);
        }
    });

    it("fits two single heat sinks or four compact heat sinks in a slot; an Inner Sphere double takes two slots", () => {
        const sinks = (type: string, additional: number) => {
            const mech = build(150);
            mech.setHeatSinksType(type);
            mech.setAdditionalHeatSinks(additional);
            return {
                requirements: mech.getHeatSinkCriticalRequirements(),
                slots: unallocated(mech, "heat-sink").map(item => `${item.name}: ${item.crits}`),
            };
        };
        // The 300-rated engine holds 12 sinks (24 compact).
        expect(sinks("single", 5)).toEqual({ requirements: { slotsEach: 1, number: 2 }, slots: ["Heat Sinks (2): 1", "Heat Sink: 1"] });
        expect(sinks("single", 6)).toEqual({ requirements: { slotsEach: 1, number: 2 }, slots: ["Heat Sinks (2): 1", "Heat Sinks (2): 1"] });
        expect(sinks("double", 4)).toEqual({ requirements: { slotsEach: 2, number: 2 }, slots: ["Double Heat Sink: 2", "Double Heat Sink: 2"] });
        expect(sinks("compact", 20)).toEqual({ requirements: { slotsEach: 1, number: 2 }, slots: ["Compact Heat Sinks (4): 1", "Compact Heat Sinks (2): 1"] });
        expect(sinks("single", 2)).toEqual({ requirements: { slotsEach: 1, number: 0 }, slots: [] });
    });

    it("re-sizes equipment on a superheavy design saved with full-size slots", () => {
        const mech = build(150);
        add(mech, "autocannon-standard-c");
        const index = mech.getUnallocatedCriticals().findIndex(item => item.tag === "autocannon-standard-c");
        expect(mech.moveCritical("un", index, "rt", 0)).toBe(true);
        expect(free(mech.getCriticals().rightTorso)).toBe(8);

        const saved = JSON.parse(mech.exportJSON());
        const entry = saved.allocation.find((item: { tag: string }) => item.tag === "autocannon-standard-c");
        entry.crits = 7;
        entry.size = 7;
        const restored = new BattleMech(JSON.stringify(saved));
        expect(free(restored.getCriticals().rightTorso)).toBe(8);
        expect(unallocated(restored, "autocannon-standard-c")).toEqual([]);
    });
});

describe("Batch 25 Superheavy 'Mechs are Inner Sphere technology (IO:AE p.154)", () => {
    it("offers superheavy tonnages to the Inner Sphere tech base only", () => {
        // tech base: maximum tonnage at Advanced rules
        const expected: Record<string, number> = { is: 200, mis: 200, clan: 100, mclan: 100 };
        for (const [tech, max] of Object.entries(expected)) {
            for (const type of ["biped", "quad", "tripod"]) {
                expect(getTonnageBoundsForMechType(type, 3, tech).max, `${tech} ${type}`).toBe(max);
                expect(Math.max(...getAvailableTonnagesForMechType(type, 3, tech).map(option => option.tons)), `${tech} ${type}`).toBe(max);
            }
        }
        // Unchanged: no tech base given, lower rules levels, and Custom Homebrew.
        expect(getTonnageBoundsForMechType("biped", 3)).toEqual({ min: 10, max: 200 });
        expect(getTonnageBoundsForMechType("biped", 2, "clan")).toEqual({ min: 20, max: 100 });
        expect(getTonnageBoundsForMechType("biped", 5, "clan")).toEqual({ min: 10, max: 200 });
    });

    it("reports a superheavy design with a Clan tech base", () => {
        const message = "Superheavy 'Mechs are available only to the Inner Sphere tech base.";
        const build = (tech: string, tonnage: number) => {
            const mech = new BattleMech();
            mech.setTech(tech);
            mech.setEra("dark-ages");
            mech.setTonnage(tonnage);
            return mech.getChassisEquipmentViolations();
        };
        expect(build("clan", 150)).toEqual([message]);
        expect(build("mclan", 150)).toEqual([message]);
        expect(build("is", 150)).toEqual([]);
        expect(build("mis", 150)).toEqual([]);
        expect(build("clan", 100)).toEqual([]);
    });
});
