import { describe, expect, it } from "vitest";
import CapitalShip from "./capital-ship";
import { getCapitalShipHitLocation } from "../data/capital-ship-hit-tables";

// The worked examples of the construction chapter (SO:AA pp.132-147), built through the class: each check is a
// running "unspent tons" total the book prints.
const build = (type: string, tonnage: number, tech: string = "is"): CapitalShip => {
    const ship = new CapitalShip();
    ship.setShipType(type);
    ship.setTech(tech);
    ship.setTonnage(tonnage);
    return ship;
};

/** Vincent Mk 39 corvette, built to its TRO:3057R p.132 loadout. */
const buildVincent = (): CapitalShip => {
    const ship = build("warShip", 420000);
    ship.setSafeThrust(4);
    ship.setStructuralIntegrity(40);
    ship.setHeatSinkType("single");
    ship.setAdditionalHeatSinks(493 - ship.getFreeHeatSinks());
    ship.setArmorType("ferro-carbide");
    ship.setArmorTons(104);
    // Fore 16, Fore-Sides 19, Aft-Sides 19, Aft 16, with SI 40's 4 free points a facing already in them.
    const totals = { nose: 16, foreLeft: 19, foreRight: 19, aftLeft: 19, aftRight: 19, aft: 16 } as const;
    for (const [facing, total] of Object.entries(totals)) ship.setArmorAllocation(facing as keyof typeof totals, total - ship.getFreeArmorPerFacing());
    for (const arc of ["nose", "nose"]) {
        const mount = ship.addCapitalWeapon("barracuda", arc);
        ship.setCapitalWeaponShots(mount!.uuid, "barracuda", 10);
    }
    for (const arc of ["foreLeft", "foreRight", "leftBroadside", "rightBroadside"]) {
        const mount = ship.addCapitalWeapon("nac-10", arc);
        ship.setCapitalWeaponShots(mount!.uuid, "nac-10", 50);
        ship.addEquipmentFromTag("large-laser", arc);
        ship.addEquipmentFromTag("large-laser", arc);
    }
    return ship;
};

describe("CapitalShip (SO:AA pp.130-149)", () => {
    it("Alliance-class space station, 100,000 tons: 86,652.5 tons left after armor (SO:AA pp.134-140)", () => {
        const ship = build("spaceStation", 100000);
        ship.setFuelTons(10000);
        expect(ship.getRemainingTonnage()).toBe(87600 - 100);
        ship.setQuarters("crew", 54);
        ship.setQuarters("firstClass", 11);
        expect(ship.getRemainingTonnage()).toBe(87012);
        ship.setAdditionalHeatSinks(307);
        expect(ship.getTotalHeatSinks()).toBe(400);
        ship.setArmorTons(52.5);
        expect(ship.getRemainingTonnage()).toBe(86652.5);
        expect(ship.hasKFDrive()).toBe(false);
        expect(ship.getArcs()).toHaveLength(6);
    });

    it("Odyssey-class JumpShip, 345,000 tons, Clan: 8,502 tons left after armor (SO:AA pp.134-140)", () => {
        const ship = build("jumpShip", 345000, "clan");
        ship.setFuelTons(1000);
        ship.setQuarters("crew", 20);
        ship.setQuarters("firstClass", 4);
        expect(ship.getRemainingTonnage()).toBe(8671);
        ship.setAdditionalHeatSinks(1);
        ship.setArmorTons(168);
        expect(ship.getPurchasedArmorPoints()).toBe(84);
        expect(ship.getRemainingTonnage()).toBe(8502);
        expect(ship.getKFDriveIntegrity()).toBe(7);
        expect(ship.getJumpSailIntegrity()).toBe(5);
        expect(ship.getArcs()).not.toContain("leftBroadside");
    });

    it("McKenna-class WarShip, 1,930,000 tons: 509,057.5 tons left after armor (SO:AA pp.134-140)", () => {
        const ship = build("warShip", 1930000);
        ship.setSafeThrust(3);
        ship.setStructuralIntegrity(95);
        ship.setFuelTons(1600);
        expect(ship.getMaxThrust()).toBe(5);
        expect(ship.getBaseCrew()).toBe(431);
        expect(ship.getMinimumOfficers()).toBe(72);
        ship.setQuarters("crew", 359);
        ship.setQuarters("firstClass", 72);
        expect(ship.getRemainingTonnage()).toBe(516108);
        ship.setHeatSinkType("double");
        ship.setAdditionalHeatSinks(5447);
        expect(ship.getHeatDissipation()).toBe(12650);
        ship.setArmorType("ferro-carbide");
        ship.setArmorTons(1603.5);
        expect(ship.getPurchasedArmorPoints()).toBe(1282);
        expect(ship.getFreeArmorPerFacing()).toBe(10);
        expect(ship.getRemainingTonnage()).toBe(509057.5);
    });

    it("a JumpShip or WarShip always carries a K-F drive and sail (SO:AA errata v5.0, p.136)", () => {
        for (const type of ["jumpShip", "warShip"]) {
            const ship = build(type, 200000);
            expect(ship.hasKFDrive()).toBe(true);
            expect(ship.getWeights().some((entry) => entry.name.includes("K-F Drive"))).toBe(true);
            expect(ship.getWeights().some((entry) => entry.name.startsWith("Jump Sail"))).toBe(true);
        }
    });

    it("M-5 Caspar SDS drone, 680,000 tons: a WarShip with a K-F drive (Historical: Liberation of Terra I p.169)", () => {
        // The stat block prints KF Drive Integrity 15 and Sail Integrity 5; its drone controls are not modelled yet.
        const ship = build("warShip", 680000);
        ship.setSafeThrust(4);
        ship.setStructuralIntegrity(50);
        ship.setFuelTons(1000);
        expect(ship.getMaxThrust()).toBe(6);
        expect(ship.getFuelPoints()).toBe(2500);
        expect(ship.getStrategicFuelPerDay()).toBe(39.52);
        expect(ship.getKFDriveIntegrity()).toBe(15);
        expect(ship.getJumpSailIntegrity()).toBe(5);
    });

    it("weapon bays split at 70 capital damage; heat sinks must cover the hottest bay (SO:AA p.142)", () => {
        const ship = build("warShip", 1930000);
        ship.addCapitalWeapon("nac-40", "nose");
        ship.addCapitalWeapon("nac-40", "nose");
        // Two NAC/40s (40 damage each) need two bays, as in the McKenna example (p.145).
        expect(ship.getArcWeaponBays("nose")).toHaveLength(2);
        expect(ship.getHottestBayHeat()).toBe(135);
        ship.setAdditionalHeatSinks(0);
        const dissipation = ship.getHeatDissipation();
        expect(dissipation).toBeGreaterThan(135);
        expect(ship.getIssues().some((text) => text.includes("hottest weapon bay"))).toBe(false);
    });

    it("side arcs mirror each other (SO:AA p.142)", () => {
        const ship = build("warShip", 500000);
        ship.addCapitalWeapon("nac-20", "leftBroadside");
        expect(ship.getIssues().some((text) => text.includes("Left Broadside and Right Broadside"))).toBe(true);
        ship.addCapitalWeapon("nac-20", "rightBroadside");
        expect(ship.getIssues().some((text) => text.includes("Left Broadside and Right Broadside"))).toBe(false);
    });

    it("a capital weapon that fires ammunition carries at least 10 shots (SO:AA p.142)", () => {
        const ship = build("warShip", 500000);
        const mount = ship.addCapitalWeapon("nac-20", "nose")!;
        expect(ship.getCapitalShots(mount)).toBe(10);
        ship.setCapitalWeaponShots(mount.uuid, "nac-20", 9);
        expect(ship.getIssues().some((text) => text.includes("at least 10 needed"))).toBe(true);
    });

    it("broadside weapons lose their arc when a WarShip becomes a JumpShip", () => {
        const ship = build("warShip", 400000);
        const mount = ship.addCapitalWeapon("nl45", "leftBroadside")!;
        ship.setShipType("jumpShip");
        expect(ship.getCapitalWeapons().find((entry) => entry.uuid === mount.uuid)?.location).toBeUndefined();
    });

    it("a station with a K-F boom is held to 100,000 tons and costs x20 (SO:AA p.139, errata v5.0)", () => {
        const ship = build("spaceStation", 300000);
        ship.setKFBoom(true);
        expect(ship.getTonnage()).toBe(100000);
        expect(ship.getCBillCostLog()).toContain("x 20");
    });

    it("Battle Value by firing arc: Vincent Mk 39 corvette is 15,822 (SO:AA pp.148-149; loadout TRO:3057R p.132)", () => {
        const ship = buildVincent();
        // Defensive (108 x 25 + 40 x 20) x 0.8 = 2,800. The broadsides tie as the strongest arc (2,142 each): the left
        // is the front, Fore-Left beside it x 1 (92 heat against 493), the Right Broadside opposite x 0.5, the rest
        // x 0.25; ammunition is capped at its weapons' BV. 11,626.5 x Speed Factor 1.12 (Max Thrust 6) = 13,021.68.
        expect(ship.getBattleValue()).toBe(15822);
        expect(ship.getBattleValueLog()).toContain("Left Broadside (front)");
    });

    it("Battle Value with no weapons: Explorer-class JumpShip is 428 (SO:AA p.149; armor TRO:3026R p.124)", () => {
        const ship = build("jumpShip", 50000);
        ship.setArmorTons(27);
        const totals = { nose: 7, foreLeft: 3, foreRight: 3, aftLeft: 3, aftRight: 3, aft: 3 } as const;
        for (const [facing, total] of Object.entries(totals)) ship.setArmorAllocation(facing as keyof typeof totals, total - ship.getFreeArmorPerFacing());
        // (22 x 25 + 1 x 20) x 0.75 = 427.5. TRO:3026R prints 424, worked under the older rules.
        expect(ship.getBattleValue()).toBe(428);
    });

    it("a space station's Speed Factor is for Maximum Thrust 0 (SO:AA p.149)", () => {
        const ship = build("spaceStation", 100000);
        ship.addCapitalWeapon("nac-10", "nose");
        expect(ship.getBattleValueLog()).toContain("Speed Factor 0.44 (Max Thrust 0)");
    });

    it("Custom Homebrew monitor: no K-F drive, a keel of half the structure, double crew, carried on collars (after XTRO: Boondoggles p.19)", () => {
        const warShip = build("warShip", 1930000);
        warShip.setSafeThrust(3);
        warShip.setStructuralIntegrity(95);
        const monitor = new CapitalShip(warShip.exportJSON());
        expect(monitor.setMonitor(true)).toBe(true);
        expect(monitor.hasKFDrive()).toBe(false);
        expect(monitor.getJumpSailWeight()).toBe(0);
        // 183,350 tons of structure: a 91,675-ton keel; the 873,325-ton K-F drive and 127-ton sail are gone.
        expect(monitor.getKeelWeight()).toBe(91675);
        expect(monitor.getRemainingTonnage() - warShip.getRemainingTonnage()).toBe(873325 + 127 - 91675);
        expect(monitor.getBaseCrew()).toBe(warShip.getBaseCrew() * 2);
        expect(monitor.getCarrierCollarsNeeded()).toBe(20);
        expect(monitor.getCBillCostLog()).not.toContain("K-F Drive");
        expect(monitor.getIssues(2).some((text) => text.includes("Custom Homebrew"))).toBe(true);
        expect(monitor.getIssues(6).some((text) => text.includes("Custom Homebrew"))).toBe(false);
        // Only a WarShip can be a monitor, and saves without the field load as ordinary vessels.
        monitor.setShipType("jumpShip");
        expect(monitor.isMonitor()).toBe(false);
        expect(monitor.hasKFDrive()).toBe(true);
        const old = JSON.parse(warShip.exportJSON());
        delete old.monitor;
        expect(new CapitalShip(JSON.stringify(old)).isMonitor()).toBe(false);
    });

    it("saves and loads", () => {
        const ship = build("warShip", 1930000);
        ship.setName("McKenna");
        ship.setSafeThrust(3);
        ship.setStructuralIntegrity(95);
        ship.setArmorType("ferro-carbide");
        ship.setArmorTons(1603.5);
        ship.setDockingCollars(6);
        ship.setGravDecks("small", 3);
        ship.setLithiumFusionBattery(true);
        ship.setMonitor(true);
        ship.addCapitalWeapon("nac-40", "nose");
        ship.addBay("fighter", 25);
        const loaded = new CapitalShip(ship.exportJSON());
        expect(loaded.getImportIssues()).toEqual([]);
        expect(loaded.exportJSON()).toBe(ship.exportJSON());
        expect(loaded.getCBillCost()).toBe(ship.getCBillCost());
    });

    it("rejects junk in a save", () => {
        const loaded = new CapitalShip(JSON.stringify({ shipType: "deathStar", tonnage: "huge", equipment: [{ tag: "nope" }], capitalWeapons: 5 }));
        expect(loaded.getShipType()).toBe("warShip");
        expect(loaded.getTonnage()).toBe(100000);
        expect(loaded.getImportIssues().length).toBeGreaterThan(0);
    });

    it("record sheet values: bays list Attack Values by bracket, thresholds are a tenth of armor (SO:AA p.146; TW p.239)", () => {
        const ship = build("warShip", 420000);
        const nac = ship.addCapitalWeapon("nac-10", "foreLeft");
        ship.setCapitalWeaponShots(nac!.uuid, "nac-10", 50);
        ship.addEquipmentFromTag("large-laser", "foreLeft");
        ship.addEquipmentFromTag("large-laser", "foreLeft");
        const bays = ship.getArcWeaponBays("foreLeft");
        const lasers = bays.find((bay) => !bay.capital);
        // 2 Large Lasers: 8 heat and 8 damage each out to Medium, combined as one line (SO:AA p.146).
        expect(lasers).toMatchObject({ weapons: 2, heat: 16, values: [16, 16, 0, 0], weaponNames: ["Large Laser", "Large Laser"] });
        expect(bays.find((bay) => bay.capital)).toMatchObject({ weapons: 1, heat: 30, values: [10, 10, 10, 0] });
        ship.setArmorTons(100);
        ship.setArmorAllocation("nose", 15);
        expect(ship.getDamageThresholds().nose).toBe(Math.ceil(ship.getFacingArmor("nose") / 10));
        expect(ship.getRequiredRulesLevel()).toBe(3);
        ship.setMonitor(true);
        expect(ship.getRequiredRulesLevel()).toBe(6);
    });

    it("Alpha Strike: Explorer-class JumpShip matches its published card (ASC pp.92-98, 144; Alpha Strike Cards: WarShips & JumpShips)", () => {
        const ship = build("jumpShip", 50000);
        ship.setArmorTons(27);
        const totals = { nose: 7, foreLeft: 3, foreRight: 3, aftLeft: 3, aftRight: 3, aft: 3 } as const;
        for (const [facing, total] of Object.entries(totals)) ship.setArmorAllocation(facing as keyof typeof totals, total - ship.getFreeArmorPerFacing());
        const card = ship.getAlphaStrikeStats();
        // 22 capital armor x 0.33 = 7; Threshold 7 / 3 / 4 arcs, up = 1; a JumpShip's Structure is 1 and its drive 0.2k.
        expect(card).toMatchObject({ type: "JS", size: 1, movement: 0.2, moveCode: "k", armor: 7, structure: 1, threshold: 1 });
        expect(card.specialAbilities).toContain("KF");
        // 0.2 x 0.25 + 7 x 1.5 + 1 + 1 x 1 / 2 = 12.05: the card prints 12.
        expect(card.pointValue).toBe(12);
    });

    it("Alpha Strike: a WarShip's fore-sides join its Front and aft-sides its broadsides, by attack type (ASC p.103)", () => {
        const card = buildVincent().getAlphaStrikeStats();
        // The card's armor, Threshold, Size, Thrust and Structure (36, 3, 1, 4, 40).
        expect(card).toMatchObject({ type: "WS", size: 1, movement: 4, moveCode: "", armor: 36, structure: 40, threshold: 3 });
        const values = (arc: "front" | "left" | "rear", attackClass: "STD" | "CAP" | "MSL") => card.arcs[arc][attackClass].map((value) => value.damage);
        // Two NAC/10s from the fore-sides (10 each, ASC p.114), two Barracudas in the nose, four Large Lasers.
        expect(values("front", "CAP")).toEqual([20, 20, 20, 0]);
        expect(values("front", "MSL")).toEqual([4, 4, 4, 4]);
        expect(values("front", "STD")).toEqual([4, 4, 0, 0]);
        expect(values("left", "CAP")).toEqual([10, 10, 10, 0]);
        expect(values("rear", "CAP")).toEqual([0, 0, 0, 0]);
        // (4 + 4 + 12 + 2 x 4 + 120 / 5) / 4 = 13 offensive, 96.5 defensive. The published card splits each fore-side arc
        // between the Front and the broadside (Front CAP 10, sides 15) and prints PV 107; the ASC p.103 rule is followed.
        expect(card.pointValue).toBe(110);
    });

    it("Alpha Strike: a station keeps the JumpShip's four arcs, with capital weapons apart from standard ones", () => {
        const ship = build("spaceStation", 100000);
        ship.addCapitalWeapon("medium-n-gauss", "foreLeft");
        const card = ship.getAlphaStrikeStats();
        expect(card).toMatchObject({ type: "SS", movement: 0.2, moveCode: "k", structure: 1 });
        expect(card.specialAbilities).not.toContain("KF");
        // Half of a fore-side arc goes to the Front and half to its side: 25 x 0.5 = 12.5, up to 13.
        expect(card.arcs.front.CAP.map((value) => value.damage)).toEqual([13, 13, 13, 13]);
        expect(card.arcs.left.CAP.map((value) => value.damage)).toEqual([13, 13, 13, 13]);
        expect(card.arcs.front.STD.map((value) => value.damage)).toEqual([0, 0, 0, 0]);
    });

    it("play: the SO:AA p.83 hit table, by attack direction", () => {
        expect(getCapitalShipHitLocation(6, "nose", true)).toEqual({ facing: "nose", critical: "cic", weaponArc: null });
        expect(getCapitalShipHitLocation(12, "aft", true)).toEqual({ facing: "aft", critical: "kfDrive", weaponArc: null });
        // Side 7: Aft-Side / Broadside Weapon. A JumpShip has no broadside, so no bay is hit.
        expect(getCapitalShipHitLocation(7, "left", true)).toEqual({ facing: "aftLeft", critical: "weapon", weaponArc: "leftBroadside" });
        expect(getCapitalShipHitLocation(7, "right", false).weaponArc).toBeNull();
        expect(getCapitalShipHitLocation(4, "right", true)).toEqual({ facing: "foreRight", critical: "weapon", weaponArc: "foreRight" });
        // Above or below: the Side column on a random side (4-6 left).
        expect(getCapitalShipHitLocation(5, "above", true, 5).facing).toBe("foreLeft");
    });

    it("play: standard-scale damage is a tenth against capital armor, and half the excess reaches SI (TW p.238)", () => {
        const ship = buildVincent();
        // A 25-point standard attack to the nose: 3 capital points (2.5 rounds up), under the nose's Threshold of 2? No: 16 armor, Threshold 2.
        const log = ship.resolveAttack(7, "nose", 25, { standardScale: true, criticalRolls: [2] });
        expect(ship.getCurrentFacingArmor("nose")).toBe(13);
        expect(log[0]).toContain("25 standard-scale damage / 10 = 3");
        // 3 over the Threshold of 2: a critical check (2 here, no hit).
        expect(log[1]).toContain("no critical hit");
        // 20 capital points into 13 left: 7 over, 3 to SI (rounded down).
        ship.resolveAttack(7, "nose", 20, { criticalRolls: [2, 2] });
        expect(ship.getCurrentStructure()).toBe(37);
    });

    it("play: a K-F Drive hit takes 1 Drive Integrity; at 0 the ship cannot jump (SO:AA p.82)", () => {
        const ship = buildVincent();
        const integrity = ship.getKFDriveIntegrity();
        ship.resolveAttack(12, "nose", 10, { criticalRolls: [8] });
        expect(ship.getCurrentKFDriveIntegrity()).toBe(integrity - 1);
        ship.setKFDriveDamage(integrity);
        expect(ship.canJump()).toBe(false);
    });

    it("play: a Weapon hit on Large Craft takes out a bay; both bays of an arc wait for a choice (TW p.240)", () => {
        const ship = buildVincent();
        // Fore-Right holds a capital bay (NAC/10) and a standard bay (Large Lasers).
        const log = ship.resolveAttack(4, "nose", 10, { criticalRolls: [9] }, () => 0.9);
        expect(log.join(" ")).toContain("attacking player chooses a bay");
        const pending = ship.getPendingWeaponCritical();
        expect(pending?.arc).toBe("foreRight");
        expect(ship.resolvePendingWeaponCritical(pending!.bays[0].index)).toBe(true);
        expect(ship.getWorkingBays("foreRight")).toHaveLength(1);
    });

    it("play: arcs fired in a turn may not pass the heat sinks (zero net heat, TW p.161)", () => {
        const ship = buildVincent();
        // 493 heat sinks. Heavy Naval PPCs (225 heat) in the nose and left broadside push those arcs to 245 and 271.
        ship.addCapitalWeapon("heavy-n-ppc", "nose");
        ship.addCapitalWeapon("heavy-n-ppc", "leftBroadside");
        expect(ship.getArcHeat("leftBroadside")).toBe(30 + 16 + 225);
        expect(ship.setArcFired("nose", true)).toBe(true);
        // 245 + 271 = 516 is over 493: the broadside may not fire this turn.
        expect(ship.setArcFired("leftBroadside", false)).toBe(true);
        expect(ship.setArcFired("leftBroadside", true)).toBe(false);
        expect(ship.setArcFired("foreLeft", true)).toBe(true);
        expect(ship.getHeatThisTurn()).toBe(245 + 46);
        ship.turnReset();
        expect(ship.getHeatThisTurn()).toBe(0);
    });

    it("play: damage and crew are saved with the vessel and can be left out", () => {
        const ship = buildVincent();
        ship.setArmorDamage("aft", 5);
        ship.setCriticalHits("cic", 2);
        ship.setBayDestroyed("nose", 0, true);
        ship.getPilot().gunnery = 3;
        const copy = new CapitalShip(ship.exportJSON());
        expect(copy.getCurrentFacingArmor("aft")).toBe(11);
        expect(copy.getInPlay().cic).toBe(2);
        expect(copy.isBayDestroyed("nose", 0)).toBe(true);
        expect(copy.getPilot().gunnery).toBe(3);
        expect(copy.getDamageToHitModifier()).toBe(4);
        expect(ship.export(true).inPlay).toBeUndefined();
    });
});
