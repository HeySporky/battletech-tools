import { describe, expect, it } from "vitest";
import AerospaceFighter from "./aerospace-fighter";
import { BattleMechGroup } from "./battlemech-group";
import { getFighterHitLocation } from "../data/fighter-hit-tables";

// Total Warfare's Slayer has 94 points of nose armor, a Damage Threshold of 10 (TW p.239).
const slayer = (): AerospaceFighter => {
    const fighter = new AerospaceFighter();
    fighter.setTonnage(80);
    fighter.setSafeThrust(6);
    fighter.setArmorAllocation("nose", 94);
    fighter.setArmorAllocation("leftWing", 60);
    fighter.setArmorAllocation("rightWing", 60);
    fighter.setArmorAllocation("aft", 40);
    fighter.addEquipmentFromTag("medium-laser", "nose");
    fighter.addEquipmentFromTag("large-laser", "nose");
    fighter.addEquipmentFromTag("medium-laser", "aft");
    return fighter;
};

describe("Fighter hit locations (Aerospace Units Hit Location Table, TW p.237)", () => {
    it("reads the nose, aft, side and above/below columns", () => {
        expect(getFighterHitLocation(6, "nose")).toEqual({ arc: "nose", critical: "avionics" });
        expect(getFighterHitLocation(10, "nose")).toEqual({ arc: "leftWing", critical: "heatSink" });
        expect(getFighterHitLocation(11, "nose")).toEqual({ arc: "nose", critical: "gear" });
        expect(getFighterHitLocation(4, "aft")).toEqual({ arc: "rightWing", critical: "fuel" });
        expect(getFighterHitLocation(8, "aft")).toEqual({ arc: "aft", critical: "engine" });
        expect(getFighterHitLocation(8, "left")).toEqual({ arc: "leftWing", critical: "bomb" });
        expect(getFighterHitLocation(8, "right")).toEqual({ arc: "rightWing", critical: "bomb" });
        expect(getFighterHitLocation(5, "right")).toEqual({ arc: "nose", critical: "crew" });
        // Above or below: 1-3 is the right wing, 4-6 the left (TW p.238).
        expect(getFighterHitLocation(6, "above", 3)).toEqual({ arc: "rightWing", critical: "weapon" });
        expect(getFighterHitLocation(6, "above", 4)).toEqual({ arc: "leftWing", critical: "weapon" });
        expect(getFighterHitLocation(7, "above")).toEqual({ arc: "nose", critical: "avionics" });
    });
});

describe("Fighter damage and critical hits (TW pp.238-240)", () => {
    it("checks for a critical hit only when a hit exceeds the Damage Threshold (the Slayer example, TW p.239)", () => {
        const fighter = slayer();
        expect(fighter.getDamageThresholds().nose).toBe(10);
        // A PPC's 10 points equal the threshold: no check.
        let log = fighter.resolveAttack(6, "nose", 10);
        expect(log).toHaveLength(1);
        // A Gauss rifle's 15 exceed it; the check of 8 succeeds and location 6 is an avionics hit.
        log = fighter.resolveAttack(6, "nose", 15, { criticalRolls: [8] });
        expect(log.join(" | ")).toContain("over the Damage Threshold of 10");
        expect(fighter.getInPlay().avionics).toBe(1);
        expect(fighter.getControlRollModifier()).toBe(1);
        expect(fighter.getInPlay().armorDamage.nose).toBe(25);
        // A 7 fails.
        fighter.resolveAttack(6, "nose", 15, { criticalRolls: [7] });
        expect(fighter.getInPlay().avionics).toBe(1);
        // A natural 12 to hit checks even under the threshold.
        fighter.resolveAttack(6, "nose", 5, { natural12: true, criticalRolls: [9] });
        expect(fighter.getInPlay().avionics).toBe(2);
    });

    it("halves damage that reaches Structural Integrity, and checks again for it (TW p.238)", () => {
        // A large laser (8) strikes a wing with 3 armor left: 2 points come off the Structural Integrity.
        const fighter = slayer();
        fighter.setArmorDamage("leftWing", 57);
        const log = fighter.resolveAttack(9, "nose", 8, { criticalRolls: [2, 2] });
        expect(fighter.getInPlay().armorDamage.leftWing).toBe(60);
        expect(fighter.getInPlay().structureDamage).toBe(2);
        // Over the threshold of 6, and Structural Integrity damage: two checks.
        expect(log.filter((line) => line.startsWith("Critical check"))).toHaveLength(2);
        expect(fighter.getCurrentStructure()).toBe(6);

        fighter.resolveAttack(9, "nose", 40);
        expect(fighter.isDestroyed()).toBe(true);
    });

    it("applies each critical hit's effect (TW pp.239-240)", () => {
        const fighter = slayer();
        fighter.setExternalStore("ammo-bomb-standard", 6);
        expect(fighter.getCurrentSafeThrust()).toBe(4);

        // Engine: Safe Thrust -2 each; the third destroys it.
        fighter.resolveAttack(8, "aft", 20, { criticalRolls: [12] });
        expect(fighter.getCurrentSafeThrust()).toBe(2);
        expect(fighter.getCurrentMaxThrust()).toBe(3);
        fighter.setStoresDropped(true);
        expect(fighter.getCurrentSafeThrust()).toBe(4);
        fighter.setCriticalHits("engine", 3);
        expect(fighter.isEngineDestroyed()).toBe(true);
        expect(fighter.getCurrentSafeThrust()).toBe(0);

        // FCS +2 each, sensors +1 each then +5, pilot +1 each; a third FCS hit stops all attacks.
        fighter.setCriticalHits("fcs", 1);
        fighter.setCriticalHits("sensors", 2);
        fighter.setCriticalHits("pilotHits", 1);
        expect(fighter.getDamageToHitModifier()).toBe(5);
        fighter.setCriticalHits("sensors", 3);
        expect(fighter.getDamageToHitModifier()).toBe(8);
        fighter.setCriticalHits("fcs", 3);
        expect(fighter.getDamageToHitModifier()).toBeNull();

        // Heat sink: one sink lost.
        const before = fighter.getCurrentHeatDissipation();
        fighter.resolveAttack(10, "nose", 20, { criticalRolls: [8] });
        expect(fighter.getCurrentHeatDissipation()).toBe(before - 1);

        // Weapon: the only working weapon in the aft is destroyed; two in the nose leave a choice.
        fighter.resolveAttack(2, "aft", 20, { criticalRolls: [8] });
        expect(fighter.getInPlay().destroyedWeapons).toHaveLength(1);
        const log = fighter.resolveAttack(2, "nose", 20, { criticalRolls: [8] });
        expect(log.join(" | ")).toContain("player chooses a weapon");

        // Fuel: 10+ explodes.
        fighter.resolveAttack(4, "aft", 20, { criticalRolls: [8], fuelRoll: 9 });
        expect(fighter.isDestroyed()).toBe(false);
        fighter.resolveAttack(4, "aft", 20, { criticalRolls: [8], fuelRoll: 10 });
        expect(fighter.isDestroyed()).toBe(true);
    });

    it("keeps pilot and damage through a save, joins a roster group, and survives a hostile save", () => {
        const fighter = slayer();
        fighter.getPilot().gunnery = 3;
        fighter.getPilot().piloting = 4;
        fighter.resolveAttack(6, "nose", 15, { criticalRolls: [8] });
        expect(fighter.getPilotAdjustedBattleValue()).toBeGreaterThan(fighter.getBattleValue());

        const group = new BattleMechGroup();
        group.fighters.push(fighter);
        expect(group.getTotalUnits()).toBe(1);
        expect(group.getTotaBV2()).toBe(fighter.getPilotAdjustedBattleValue());
        expect(group.getTotalTons()).toBe(80);
        expect(group.isUnderStrength()).toBe(true);

        const loaded = new BattleMechGroup(JSON.parse(JSON.stringify(group.export())));
        expect(loaded.fighters).toHaveLength(1);
        expect(loaded.fighters[0].getInPlay().avionics).toBe(1);
        expect(loaded.fighters[0].getPilot().gunnery).toBe(3);
        expect(new BattleMechGroup(JSON.parse(JSON.stringify(group.export(true)))).fighters[0].isDamaged()).toBe(false);

        const hostile = new AerospaceFighter(JSON.stringify({
            pilot: { name: 5, gunnery: -9, piloting: "x" },
            inPlay: { armorDamage: { nose: 1e9 }, structureDamage: 1e9, avionics: 99, pilotHits: "6", destroyedWeapons: [1, "nope"], heatSinks: 1e9 },
        }));
        expect(hostile.getPilot().gunnery).toBe(0);
        expect(hostile.getPilot().piloting).toBe(5);
        expect(hostile.getInPlay().avionics).toBe(3);
        expect(hostile.getInPlay().pilotHits).toBe(0);
        expect(hostile.getInPlay().destroyedWeapons).toEqual([]);
        expect(hostile.getInPlay().armorDamage.nose).toBe(0);
        expect(hostile.getInPlay().heatSinks).toBe(10);
        expect(new BattleMechGroup({ name: "x", units: [], uuid: "u", lastUpdated: new Date(), groupLabel: "Lance", fighters: [5, null, []] as never }).fighters).toHaveLength(0);
    });
});
