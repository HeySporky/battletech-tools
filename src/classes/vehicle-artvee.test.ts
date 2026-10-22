import { afterEach, describe, expect, it } from "vitest";
import { setLocalCustomEquipment } from "../data/equipment-registry";
import type { IEquipmentItem } from "../data/data-interfaces";
import { energyCustom } from "../data/energy-custom";
import { ARTVEE_CONVERSION_EQUIPMENT } from "../data/combat-vehicle-chassis-modifications-custom";
import Vehicle from "./vehicle";
import { getArtVeeComboGuns, getArtVeeIssues, getArtVeeNotes, getArtVeeVariant, getArtVeeWarnings } from "./vehicle-artvee";

describe("custom records by tech base", () => {
    const template = energyCustom[0];
    const fixture = (tag: string, techBase: "is" | "clan"): IEquipmentItem => ({
        ...structuredClone(template),
        name: tag,
        tag,
        techBase,
        category: "Custom Equipment",
        rulesLevel: 6,
        introduced: 2000,
        prototype: undefined,
        extinct: null,
        reintroduced: null
    });
    const universal = (tag: string): IEquipmentItem => {
        const item: IEquipmentItem = { ...fixture(tag, "is"), techBase: "universal" };
        return item;
    };
    const offered = (tech: string): string[] => {
        const vehicle = new Vehicle();
        vehicle.setTech(tech);
        return vehicle.getAvailableEquipment(true, 6)
            .map((item) => item.tag)
            .filter((tag) => tag === "artvee-test-is" || tag === "artvee-test-clan" || tag === "artvee-test-universal");
    };

    afterEach(() => setLocalCustomEquipment([]));

    it("offers an IS custom record to IS and mixed vehicles, a Clan one to Clan and mixed vehicles", () => {
        setLocalCustomEquipment([fixture("artvee-test-is", "is"), fixture("artvee-test-clan", "clan")]);
        expect(offered("is")).toEqual(["artvee-test-is"]);
        expect(offered("clan")).toEqual(["artvee-test-clan"]);
        expect(offered("mis").sort()).toEqual(["artvee-test-clan", "artvee-test-is"]);
        expect(offered("mclan").sort()).toEqual(["artvee-test-clan", "artvee-test-is"]);
    });

    it("offers an untagged or universal custom record to IS, Clan and mixed vehicles", () => {
        setLocalCustomEquipment([universal("artvee-test-universal")]);
        for (const tech of ["is", "clan", "mis", "mclan"]) expect(offered(tech), tech).toEqual(["artvee-test-universal"]);
        const untagged = { ...universal("artvee-test-universal") } as Partial<IEquipmentItem>;
        delete untagged.techBase;
        setLocalCustomEquipment([untagged as IEquipmentItem]);
        for (const tech of ["is", "clan", "mis", "mclan"]) expect(offered(tech), tech).toEqual(["artvee-test-universal"]);
    });
});

describe("ArtVee construction", () => {
    const thumperArtVee = (options: { tonnage?: number; combo?: string; location?: string } = {}): Vehicle => {
        const vehicle = new Vehicle();
        vehicle.setTech("is");
        vehicle.setEra("jihad");
        vehicle.setMotiveType("tracked");
        vehicle.setTonnage(options.tonnage ?? 60);
        vehicle.setEngineType("xl");
        vehicle.setCruiseMP(4);
        vehicle.setHasTurret(true);
        vehicle.addEquipmentFromTag(options.combo ?? "custom-artvee-thumper-combo", options.location ?? "turret");
        vehicle.addEquipmentFromTag("ammo-thumper-standard", "body");
        vehicle.addEquipmentFromTag("ammo-is-ac-5-standard", "body");
        vehicle.setArtVee(true);
        return vehicle;
    };
    const plain = (tonnage = 60): Vehicle => {
        const vehicle = thumperArtVee({ tonnage });
        vehicle.setArtVee(false);
        return vehicle;
    };
    const logValue = (log: string, label: string): number => {
        const row = log.split("<br />").find((line) => line.startsWith(label));
        if (!row) throw new Error(`no cost row ${label}`);
        return Number(row.slice(row.lastIndexOf(": ") + 2).replace(/,/g, ""));
    };

    it("is offered at Custom Homebrew to tracked Combat Vehicles only", () => {
        const vehicle = plain();
        expect(vehicle.canBeArtVee(5)).toBe(false);
        expect(vehicle.canBeArtVee(6)).toBe(true);
        const wheeled = plain();
        wheeled.setMotiveType("wheeled");
        expect(wheeled.canBeArtVee(6)).toBe(false);
        const support = plain();
        support.setSupportVehicle(true);
        expect(support.canBeArtVee(6)).toBe(false);
        const heavy = plain();
        heavy.setTonnage(110);
        expect(heavy.canBeArtVee(6)).toBe(false);
        const civilWar = plain();
        civilWar.setEra("civil-war");
        expect(civilWar.canBeArtVee(6)).toBe(false);
        const starLeague = plain();
        starLeague.setEra("star-league");
        expect(starLeague.canBeArtVee(6)).toBe(true);
    });

    it("weighs 10% of tonnage, rounded up to the half ton, and takes 2 body and 1 turret slots", () => {
        expect(thumperArtVee({ tonnage: 55 }).getArtVeeConversionWeight()).toBe(5.5);
        expect(thumperArtVee({ tonnage: 58 }).getArtVeeConversionWeight()).toBe(6);
        expect(thumperArtVee().getArtVeeConversionWeight()).toBe(6);
        expect(plain().getArtVeeConversionWeight()).toBe(0);
        expect(thumperArtVee().getWeights()).toContainEqual({ name: "ArtVee Conversion Equipment", weight: 6 });
        expect(plain().getWeights().some((row) => row.name === "ArtVee Conversion Equipment")).toBe(false);
        expect(thumperArtVee().getUsedItemSlots()).toBe(plain().getUsedItemSlots() + 3);
        expect(ARTVEE_CONVERSION_EQUIPMENT.bodySlots + ARTVEE_CONVERSION_EQUIPMENT.turretSlots).toBe(3);
    });

    it("takes no turret slot once its turret is removed", () => {
        const vehicle = thumperArtVee();
        const withTurret = vehicle.getUsedItemSlots();
        vehicle.setHasTurret(false);
        expect(vehicle.isArtVee()).toBe(true);
        expect(vehicle.getUsedItemSlots()).toBe(withTurret - ARTVEE_CONVERSION_EQUIPMENT.turretSlots);
    });

    it("adds half the weapons, equipment and structure cost before the final multiplier (IO:AE p.181 precedent)", () => {
        const vehicle = thumperArtVee();
        const log = vehicle.getCBillCostLog();
        const label = "ArtVee Conversion Equipment (0.5 x weapons, equipment and structure)";
        const structure = logValue(log, "Internal Structure");
        const equipment = vehicle.getEquipmentList().filter((item) => !item.isAmmo).reduce((sum, item) => sum + item.cbills, 0);
        expect(logValue(log, label)).toBe(Math.round(0.5 * (structure + equipment)));
        expect(plain().getCBillCostLog()).not.toContain("ArtVee Conversion Equipment");
        expect(vehicle.getCBillCost()).toBeGreaterThan(plain().getCBillCost());
    });

    it("needs an XL or XXL engine, 4/6 (3/5 for the Long Tom), and one combo gun in the turret", () => {
        expect(getArtVeeIssues(thumperArtVee())).toEqual([]);
        expect(getArtVeeVariant(thumperArtVee())).toBe("thumper");

        const standard = thumperArtVee();
        standard.setEngineType("standard");
        expect(getArtVeeIssues(standard)).toEqual(["ArtVee needs an XL or XXL engine"]);

        const slow = thumperArtVee();
        slow.setCruiseMP(3);
        expect(getArtVeeIssues(slow)).toEqual(["ArtVee needs at least 4 Cruising MP"]);

        const longTom = thumperArtVee({ tonnage: 100, combo: "custom-artvee-long-tom-combo" });
        longTom.setCruiseMP(3);
        expect(getArtVeeVariant(longTom)).toBe("long-tom");
        expect(getArtVeeIssues(longTom)).toEqual([]);
        longTom.setCruiseMP(2);
        expect(getArtVeeIssues(longTom)).toEqual(["ArtVee with a Long Tom combo gun needs at least 3 Cruising MP"]);

        const none = thumperArtVee();
        const gun = getArtVeeComboGuns(none)[0];
        expect(gun.tag).toBe("custom-artvee-thumper-combo");
        none.removeEquipment(gun.uuid as string);
        expect(getArtVeeComboGuns(none)).toEqual([]);
        expect(getArtVeeVariant(none)).toBeNull();
        expect(getArtVeeIssues(none)).toEqual(["ArtVee needs exactly one combo gun (has 0)"]);

        const two = thumperArtVee();
        two.addEquipmentFromTag("custom-artvee-sniper-combo", "turret");
        expect(getArtVeeVariant(two)).toBeNull();
        expect(getArtVeeIssues(two)).toEqual(["ArtVee needs exactly one combo gun (has 2)"]);

        const body = thumperArtVee({ location: "body" });
        expect(getArtVeeIssues(body)).toEqual(["ArtVee combo gun must be mounted in the turret"]);
    });

    it("warns below half armor and recommends Armored Motive when it is available", () => {
        const vehicle = thumperArtVee();
        vehicle.setArmorTonnage(0);
        const max = vehicle.getMaxArmorPoints();
        expect(getArtVeeWarnings(vehicle, 6)).toEqual([
            `ArtVee armor is below half the maximum (0 of ${max} points)`,
            "Armored Motive System recommended",
        ]);
        vehicle.allocateMaxArmor();
        expect(getArtVeeWarnings(vehicle, 6)).toEqual(["Armored Motive System recommended"]);
        vehicle.setChassisModification("armored-motive", true, 6);
        expect(getArtVeeWarnings(vehicle, 6)).toEqual([]);
        const starLeague = thumperArtVee();
        starLeague.setEra("star-league");
        starLeague.allocateMaxArmor();
        expect(getArtVeeWarnings(starLeague, 6)).toEqual([]);
        expect(getArtVeeWarnings(plain(), 6)).toEqual([]);
    });

    it("drops the ArtVee when the vehicle stops being a tracked Combat Vehicle", () => {
        const vehicle = thumperArtVee();
        vehicle.setMotiveType("wheeled");
        expect(vehicle.isArtVee()).toBe(false);
        expect(getArtVeeComboGuns(vehicle)).toHaveLength(1);
        expect(getArtVeeIssues(vehicle)).toContain("ArtVee Thumper Combo Gun is an ArtVee combo gun, but the vehicle is not an ArtVee");
        const heavy = thumperArtVee();
        heavy.setTonnage(110);
        expect(heavy.isArtVee()).toBe(false);
    });

    it("refuses combo guns on a vehicle that is not an ArtVee", () => {
        const offered = (vehicle: Vehicle): boolean => vehicle.getAvailableEquipment(true, 6).some((item) => item.tag === "custom-artvee-thumper-combo" && item.available);
        expect(offered(plain())).toBe(false);
        expect(offered(thumperArtVee())).toBe(true);
    });

    it("requires rules level 6", () => {
        expect(thumperArtVee().getRequiredRulesLevel()).toBe(6);
    });

    it("turns the turret on and clears Omni, and turning it off leaves the equipment alone", () => {
        const vehicle = plain();
        vehicle.setOmni(true);
        vehicle.setHasTurret(false);
        expect(vehicle.setArtVee(true)).toBe(true);
        expect(vehicle.hasTurret()).toBe(true);
        expect(vehicle.isOmni()).toBe(false);
        vehicle.setArtVee(false);
        expect(vehicle.isArtVee()).toBe(false);
        expect(getArtVeeComboGuns(vehicle)).toHaveLength(1);
        expect(plain().setArtVee(true, 5)).toBe(false);
    });

    it("offers IS combo guns to IS vehicles, Clan ones to Clan vehicles, and both to mixed tech", () => {
        const combos = (tech: string): string[] => {
            const vehicle = thumperArtVee();
            vehicle.setTech(tech);
            return vehicle.getAvailableEquipment(true, 6).filter((item) => item.comboArtilleryTag).map((item) => item.tag);
        };
        expect(combos("is").length).toBeGreaterThan(0);
        expect(combos("is").every((tag) => !tag.startsWith("custom-clan-"))).toBe(true);
        expect(combos("clan").length).toBeGreaterThan(0);
        expect(combos("clan").every((tag) => tag.startsWith("custom-clan-"))).toBe(true);
        for (const tech of ["mis", "mclan"]) {
            expect(combos(tech), tech).toContain("custom-artvee-thumper-combo");
            expect(combos(tech), tech).toContain("custom-clan-artvee-thumper-combo");
        }
    });

    it("rates the same as the vehicle without the conversion, Siege Mode adding nothing (IO:AE p.185)", () => {
        const artVee = thumperArtVee();
        expect(artVee.getBattleValue()).toBe(202);
        expect(plain().getBattleValue()).toBe(artVee.getBattleValue());
    });

    it("rates the ArtVee once, blended as for LAMs (IO:AE p.185)", () => {
        const log = thumperArtVee().getBattleValueLog();
        expect(log).toContain("ArtVee: movement from Vehicle Mode; Siege Mode (0 MP) adds nothing (blended, IO:AE p.185)");
        expect(log).toContain("+ ArtVee Thumper Combo Gun (turret) = 93.00");
        expect(log).toContain("+ Ammunition for custom-artvee-thumper-combo = 14.00");
        expect(plain().getBattleValueLog()).not.toContain("ArtVee:");
    });

    it("imports", () => {
        const vehicle = thumperArtVee();
        const saved = JSON.stringify(vehicle.export());
        const loaded = new Vehicle(saved);
        expect(loaded.isArtVee()).toBe(true);
        expect(getArtVeeVariant(loaded)).toBe("thumper");
        expect(loaded.getEquipmentList().filter((item) => item.isAmmo).map((item) => item.tag).sort())
            .toEqual(["ammo-is-ac-5-standard", "ammo-thumper-standard"]);
        expect(loaded.getImportIssues()).toEqual([]);

        const ordinary = JSON.parse(saved);
        delete ordinary.artVee;
        expect(new Vehicle(JSON.stringify(ordinary)).isArtVee()).toBe(false);
        expect(JSON.parse(JSON.stringify(plain().export())).artVee).toBeUndefined();

        const wheeled = JSON.parse(saved);
        wheeled.motiveType = "wheeled";
        const dropped = new Vehicle(JSON.stringify(wheeled));
        expect(dropped.isArtVee()).toBe(false);
        expect(dropped.getImportIssues()).toContain("Dropped the ArtVee conversion: the vehicle is not a tracked Combat Vehicle of 100 t or less");
    });

    it("keeps the flag out of its era, with an issue naming the dates, and across export and import", () => {
        const vehicle = thumperArtVee();
        expect(getArtVeeIssues(vehicle)).toEqual([]);
        vehicle.setEra("civil-war");
        expect(vehicle.isArtVee()).toBe(true);
        const issues = getArtVeeIssues(vehicle);
        expect(issues).toHaveLength(1);
        expect(issues[0]).toMatch(/^ArtVee Conversion Equipment: not available in this era \(Inner Sphere prototype 2690, introduced 2700, extinct 2865, reintroduced 3071\)$/);
        const loaded = new Vehicle(JSON.stringify(vehicle.export()));
        expect(loaded.isArtVee()).toBe(true);
        expect(loaded.getImportIssues()).toEqual([]);
        expect(getArtVeeIssues(loaded)).toEqual(issues);
        loaded.setEra("jihad");
        expect(getArtVeeIssues(loaded)).toEqual([]);
    });

    it("cannot be an OmniVehicle, and an ArtVee save carrying Omni loses the pods with an issue", () => {
        const vehicle = thumperArtVee();
        expect(vehicle.setOmni(true)).toBe(false);
        expect(vehicle.isOmni()).toBe(false);
        const saved = JSON.parse(JSON.stringify(vehicle.export()));
        saved.omni = true;
        saved.equipment.forEach((entry: { pod?: boolean }) => { entry.pod = true; });
        const loaded = new Vehicle(JSON.stringify(saved));
        expect(loaded.isArtVee()).toBe(true);
        expect(loaded.isOmni()).toBe(false);
        expect(loaded.getImportIssues()).toContain("Dropped OmniVehicle pods: an ArtVee is not an OmniVehicle");
        const ordinary = plain();
        expect(ordinary.setOmni(true)).toBe(true);
    });

    describe("play", () => {
        const withLaser = (): Vehicle => {
            const vehicle = thumperArtVee();
            vehicle.addEquipmentFromTag("medium-laser", "front");
            return vehicle;
        };
        const combo = (vehicle: Vehicle): IEquipmentItem => getArtVeeComboGuns(vehicle)[0];
        const laser = (vehicle: Vehicle): IEquipmentItem => vehicle.getEquipmentList().find((item) => item.tag === "medium-laser")!;

        it("transforms in the Movement Phase; the new mode takes effect at the end of the turn", () => {
            const vehicle = thumperArtVee();
            expect(vehicle.getArtVeeMode()).toBe("vehicle");
            expect(vehicle.startArtVeeTransformation()).toBeNull();
            expect(vehicle.getArtVeeMode()).toBe("vehicle");
            expect(vehicle.getInPlay().artVeeTransformingTo).toBe("siege");
            expect(vehicle.startArtVeeTransformation()).toBe("it is already transforming");
            vehicle.turnReset();
            expect(vehicle.getArtVeeMode()).toBe("siege");
            expect(vehicle.getInPlay().artVeeTransformingTo).toBe("");
            expect(vehicle.startArtVeeTransformation()).toBeNull();
            vehicle.turnReset();
            expect(vehicle.getArtVeeMode()).toBe("vehicle");
            expect(plain().startArtVeeTransformation()).toBe("it is not an ArtVee");
        });

        it("cancels a transformation declared this turn (ArtVee final review 2026-10-21)", () => {
            const vehicle = thumperArtVee();
            expect(vehicle.cancelArtVeeTransformation()).toBe(false);
            vehicle.startArtVeeTransformation();
            expect(vehicle.getEffectiveCruiseMP()).toBe(0);
            expect(vehicle.cancelArtVeeTransformation()).toBe(true);
            expect(vehicle.getInPlay().artVeeTransformingTo).toBe("");
            expect(vehicle.getArtVeeMode()).toBe("vehicle");
            expect(vehicle.getEffectiveCruiseMP()).toBe(4);
            expect(vehicle.getCannotFireReason()).toBeNull();
            vehicle.turnReset();
            expect(vehicle.getArtVeeMode()).toBe("vehicle");
        });

        it("in Siege Mode stays stationary whatever movement it is given", () => {
            const vehicle = thumperArtVee();
            vehicle.startArtVeeTransformation();
            vehicle.turnReset();
            vehicle.setMovement("cruise", 3);
            expect(vehicle.getInPlay().movementMode).toBe("stationary");
            expect(vehicle.getInPlay().hexesMoved).toBe(0);
        });

        it("in Siege Mode has 0 MP but is not immobile", () => {
            const vehicle = thumperArtVee();
            expect(vehicle.getEffectiveCruiseMP()).toBe(4);
            vehicle.startArtVeeTransformation();
            vehicle.turnReset();
            expect(vehicle.getEffectiveCruiseMP()).toBe(0);
            expect(vehicle.getEffectiveFlankMP()).toBe(0);
            expect(vehicle.isImmobile()).toBe(false);
            expect(vehicle.getTargetMovementModifier()).toBe(0);
            // It is stationary whatever movement mode is picked.
            vehicle.setMovement("cruise", 3);
            expect(vehicle.getAttackerMovementModifier()).toBe(0);
            vehicle.setMovement("flank", 4);
            expect(vehicle.getAttackerMovementModifier()).toBe(0);
            // The turret still turns through 360 degrees.
            expect(vehicle.canRotateTurret("turret")).toBe(true);
            expect(vehicle.setTurretFacing("turret", 3)).toBe(true);
            expect(vehicle.getTurretFacing("turret")).toBe(3);
        });

        it("fires the combo gun's AC profile only in Vehicle Mode, and nothing on a transformation turn", () => {
            const vehicle = thumperArtVee();
            const gun = combo(vehicle);
            expect(vehicle.getArtVeeWeaponBlock(gun)).toBeNull();
            expect(vehicle.getWeaponToHitModifier(gun)).not.toBeNull();
            vehicle.startArtVeeTransformation();
            expect(vehicle.getArtVeeWeaponBlock(gun)).toBeNull();
            expect(vehicle.getWeaponToHitModifier(gun)).toBeNull();
            vehicle.turnReset();
            expect(vehicle.getArtVeeWeaponBlock(gun)).toBe("Siege Mode: fires as the Thumper Artillery Piece artillery (artillery rules)");
            expect(vehicle.getWeaponToHitModifier(gun)).toBeNull();
            vehicle.startArtVeeTransformation();
            vehicle.turnReset();
            expect(vehicle.getArtVeeWeaponBlock(gun)).toBeNull();
            expect(vehicle.getWeaponToHitModifier(gun)).not.toBeNull();
        });

        it("lets the other weapons fire in both modes", () => {
            const vehicle = withLaser();
            const weapon = laser(vehicle);
            expect(vehicle.getArtVeeWeaponBlock(weapon)).toBeNull();
            expect(vehicle.getWeaponToHitModifier(weapon)).not.toBeNull();
            vehicle.startArtVeeTransformation();
            expect(vehicle.getArtVeeWeaponBlock(weapon)).toBeNull();
            expect(vehicle.getWeaponToHitModifier(weapon)).toBeNull();
            vehicle.turnReset();
            expect(vehicle.getArtVeeWeaponBlock(weapon)).toBeNull();
            expect(vehicle.getWeaponToHitModifier(weapon)).not.toBeNull();
        });

        it("cannot start transforming after moving this turn (ArtVee ruling 2026-10-21)", () => {
            const vehicle = thumperArtVee();
            vehicle.setMovement("cruise", 3);
            expect(vehicle.getArtVeeTransformationBlock()).toBe("it has already moved this turn");
            expect(vehicle.startArtVeeTransformation()).toBe("it has already moved this turn");
            expect(vehicle.getInPlay().artVeeTransformingTo).toBe("");
            expect(vehicle.getInPlay().movementMode).toBe("cruise");
            expect(vehicle.getInPlay().hexesMoved).toBe(3);
            vehicle.setMovement("stationary", 0);
            expect(vehicle.startArtVeeTransformation()).toBeNull();
            // The earlier reasons still win.
            const stranded = thumperArtVee();
            stranded.setMovement("cruise", 3);
            stranded.getInPlay().artVeeConversionDestroyed = true;
            expect(stranded.startArtVeeTransformation()).toBe("the conversion equipment is destroyed");
        });

        it("has no movement while transforming, but is stationary, not immobile (ArtVee ruling 2026-10-21)", () => {
            const vehicle = thumperArtVee();
            expect(vehicle.getEffectiveCruiseMP()).toBe(4);
            vehicle.startArtVeeTransformation();
            expect(vehicle.getEffectiveCruiseMP()).toBe(0);
            expect(vehicle.getEffectiveFlankMP()).toBe(0);
            expect(vehicle.getEffectiveJumpMP()).toBe(0);
            vehicle.setMovement("cruise", 4);
            expect(vehicle.getInPlay().movementMode).toBe("stationary");
            expect(vehicle.getInPlay().hexesMoved).toBe(0);
            expect(vehicle.isImmobile()).toBe(false);
            expect(vehicle.getTargetMovementModifier()).toBe(0);
            expect(vehicle.getAttackerMovementModifier()).toBe(0);
            vehicle.turnReset();
            vehicle.startArtVeeTransformation();
            vehicle.turnReset();
            expect(vehicle.getEffectiveCruiseMP()).toBe(4);
        });

        it("fires no weapon while transforming, and the other weapons fire again next turn (ArtVee ruling 2026-10-21)", () => {
            const vehicle = withLaser();
            const gun = combo(vehicle);
            const weapon = laser(vehicle);
            expect(vehicle.getCannotFireReason()).toBeNull();
            vehicle.startArtVeeTransformation();
            expect(vehicle.getCannotFireReason()).toBe("Transforming (ArtVee)");
            expect(vehicle.getWeaponToHitModifier(gun)).toBeNull();
            expect(vehicle.getWeaponToHitModifier(weapon)).toBeNull();
            vehicle.turnReset();
            expect(vehicle.getArtVeeMode()).toBe("siege");
            expect(vehicle.getCannotFireReason()).toBeNull();
            expect(vehicle.getWeaponToHitModifier(weapon)).not.toBeNull();
            expect(vehicle.getArtVeeWeaponBlock(gun)).toContain("Siege Mode");
        });

        it("is stranded in its mode when the conversion equipment is destroyed", () => {
            const vehicle = thumperArtVee();
            // Only the conversion equipment is a candidate when it is the pick.
            const text = vehicle.applyCriticalHit("weaponDestroyed", "front", "artvee-conversion");
            expect(text).toBe("Weapon Destroyed: ArtVee Conversion Equipment (stuck in its current Mode)");
            expect(vehicle.getInPlay().artVeeConversionDestroyed).toBe(true);
            expect(vehicle.startArtVeeTransformation()).toBe("the conversion equipment is destroyed");
            expect(vehicle.getArtVeeMode()).toBe("vehicle");
            // Once destroyed, it is no longer a candidate.
            vehicle.applyCriticalHit("weaponDestroyed", "front", "artvee-conversion");
            expect(vehicle.getInPlay().artVeeConversionDestroyed).toBe(true);
            expect(plain().applyCriticalHit("weaponDestroyed", "front", "artvee-conversion")).not.toContain("ArtVee Conversion");
        });

        it("stays in its current mode when the conversion equipment is destroyed mid-transformation", () => {
            const vehicle = thumperArtVee();
            vehicle.startArtVeeTransformation();
            vehicle.applyCriticalHit("weaponDestroyed", "front", "artvee-conversion");
            vehicle.turnReset();
            expect(vehicle.getArtVeeMode()).toBe("vehicle");
            expect(vehicle.getInPlay().artVeeTransformingTo).toBe("");
        });

        it("stays in its current mode when the crew is killed mid-transformation", () => {
            const vehicle = thumperArtVee();
            vehicle.startArtVeeTransformation();
            vehicle.applyCriticalHit("crewKilled", "front");
            vehicle.turnReset();
            expect(vehicle.getArtVeeMode()).toBe("vehicle");
            expect(vehicle.getInPlay().artVeeTransformingTo).toBe("");
        });

        it("keeps the mode in the save", () => {
            const vehicle = thumperArtVee();
            vehicle.startArtVeeTransformation();
            vehicle.turnReset();
            vehicle.startArtVeeTransformation();
            vehicle.getInPlay().artVeeConversionDestroyed = true;
            const loaded = new Vehicle(JSON.stringify(vehicle.export(false)));
            expect(loaded.getArtVeeMode()).toBe("siege");
            expect(loaded.getInPlay().artVeeTransformingTo).toBe("vehicle");
            expect(loaded.getInPlay().artVeeConversionDestroyed).toBe(true);

            const old = JSON.parse(JSON.stringify(thumperArtVee().export(false)));
            delete old.inPlay.artVeeMode;
            delete old.inPlay.artVeeTransformingTo;
            delete old.inPlay.artVeeConversionDestroyed;
            const legacy = new Vehicle(JSON.stringify(old));
            expect(legacy.getArtVeeMode()).toBe("vehicle");
            expect(legacy.getInPlay().artVeeTransformingTo).toBe("");
            expect(legacy.getInPlay().artVeeConversionDestroyed).toBe(false);
            expect(JSON.parse(JSON.stringify(vehicle.export(true))).inPlay).toBeUndefined();
        });
    });
});

describe("ArtVee record sheet notes", () => {
    const build = (): Vehicle => {
        const vehicle = new Vehicle();
        vehicle.setTech("is");
        vehicle.setEra("jihad");
        vehicle.setMotiveType("tracked");
        vehicle.setTonnage(60);
        vehicle.setEngineType("xl");
        vehicle.setCruiseMP(4);
        vehicle.setHasTurret(true);
        vehicle.addEquipmentFromTag("custom-artvee-thumper-combo", "turret");
        vehicle.addEquipmentFromTag("ammo-thumper-standard", "body");
        vehicle.addEquipmentFromTag("ammo-is-ac-5-standard", "body");
        vehicle.setArtVee(true);
        return vehicle;
    };

    it("notes both modes for the record sheet", () => {
        const vehicle = build();
        expect(getArtVeeNotes(vehicle).slice(0, 3)).toEqual([
            `ArtVee (MAP): Vehicle Mode ${vehicle.getCruiseMP()}/${vehicle.getFlankMP()}, Siege Mode 0/0`,
            "Thumper / AC/5 combo: Vehicle Mode AC/5 (5 damage, 1 heat, 3/7/14/21); Siege Mode Thumper artillery (6 heat, 15 damage, 21 mapsheets)",
            "Transforms in the Movement Phase before moving; it cannot move or fire that turn",
        ]);
        expect(getArtVeeNotes(vehicle)[0]).toBe("ArtVee (MAP): Vehicle Mode 4/6, Siege Mode 0/0");
    });

    it("puts the artillery special on the card, marked Siege Mode only, and ARS with Armored Motive", () => {
        const vehicle = build();
        expect(vehicle.getAlphaStrikeStats().specialAbilities).toContain("ARTTH-1");
        expect(vehicle.getAlphaStrikeStats().specialAbilities).not.toContain("ARS");
        expect(getArtVeeNotes(vehicle)).toContain('Alpha Strike: ARTTH-1 in Siege Mode only; Siege Mode Move 0"');
        vehicle.setChassisModification("armored-motive", true, 6);
        expect(vehicle.getAlphaStrikeStats().specialAbilities).toContain("ARS");
    });

    it("notes two identical combo guns once", () => {
        const vehicle = build();
        vehicle.addEquipmentFromTag("custom-artvee-thumper-combo", "front");
        const notes = getArtVeeNotes(vehicle);
        expect(getArtVeeComboGuns(vehicle)).toHaveLength(2);
        expect(new Set(notes).size).toBe(notes.length);
    });

    it("has no notes for an ordinary vehicle", () => {
        const vehicle = build();
        vehicle.setArtVee(false);
        expect(getArtVeeNotes(vehicle)).toEqual([]);
    });
});
