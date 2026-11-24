import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { getTargetToHitFromWeapon } from "../utils";

// AirMech mode in play (IO:AE pp.102-103 Movement Phase, p.106 Combat Phase; #634).
const makeLAM = (walk = 5, jump = 5): BattleMech => {
    const lam = new BattleMech();
    lam.setType("lam");
    lam.setTonnage(50);
    lam.setWalkSpeed(walk);
    lam.setJumpSpeed(jump);
    lam.setTransformationMode("airmech");
    return lam;
};

describe("AirMech movement in play (IO:AE p.102)", () => {
    it("walks on 'Mech Walking MP x 0.33 rounded up and runs on that x 1.5 rounded up", () => {
        // Phoenix Hawk LAM: Walk 5 -> 1.65 -> 2, Run 3.
        const lam = makeLAM(5, 5);
        expect(lam.getAirMechWalkMP()).toBe(2);
        expect(lam.getAirMechRunMP()).toBe(3);
        // Walk 3 -> 0.99 -> 1; Walk 6 -> 1.98 -> 2.
        expect(makeLAM(3, 3).getAirMechWalkMP()).toBe(1);
        expect(makeLAM(6, 3).getAirMechWalkMP()).toBe(2);
    });

    it("offers Walking, Running, AirMech Cruise and AirMech Flank, and no jump", () => {
        const lam = makeLAM();
        expect(lam.canUseJumpJetsInCurrentMode()).toBe(false);
        lam.setTransformationMode("mech");
        expect(lam.canUseJumpJetsInCurrentMode()).toBe(true);
    });

    it("takes the AirMech Attacker Modifiers Table: Walking +1, Running +2, Cruise +3, Flank +4 (p.106)", () => {
        const lam = makeLAM();
        const modifierFor = (mode: string) => { lam.currentMovementMode = mode; return lam.getAttackerMovementModifier(); };
        expect(["n", "w", "r", "c", "f"].map(modifierFor)).toEqual([0, 1, 2, 3, 4]);
    });

    it("keeps the standard attacker modifiers in 'Mech mode, a jump +3", () => {
        const lam = makeLAM();
        lam.setTransformationMode("mech");
        const modifierFor = (mode: string) => { lam.currentMovementMode = mode; return lam.getAttackerMovementModifier(); };
        expect(["n", "w", "r", "j"].map(modifierFor)).toEqual([0, 1, 2, 3]);
    });

    it("is airborne and +1 to be hit when it spent AirMech MP (p.106)", () => {
        const lam = makeLAM();
        lam.currentMovementMode = "f";
        lam.currentToHitMovementModifier = 4;
        expect(lam.isAirMechAirborne()).toBe(true);
        expect(lam.getMovementToHitModifier()).toBe(5);
        lam.currentMovementMode = "r";
        expect(lam.isAirMechAirborne()).toBe(false);
        expect(lam.getMovementToHitModifier()).toBe(4);
    });

    it("makes AirMech MP spent / 3 heat, rounded normally; walking and running as a 'Mech (p.102)", () => {
        const lam = makeLAM();
        lam.currentMovementMode = "f";
        lam.currentTargetJumpingMP = 19; // the Phoenix Hawk example's 19 MP
        expect(lam.getActiveMoveHeat()).toBe(6);
        lam.currentTargetJumpingMP = 14;
        expect(lam.getActiveMoveHeat()).toBe(5);
        lam.currentMovementMode = "c";
        lam.currentTargetJumpingMP = 5; // take-off and hover only
        expect(lam.getActiveMoveHeat()).toBe(2);
        lam.currentMovementMode = "w";
        lam.currentTargetJumpingMP = 0;
        expect(lam.getActiveMoveHeat()).toBe(1);
        lam.currentMovementMode = "r";
        expect(lam.getActiveMoveHeat()).toBe(2);
    });

    it("may make physical attacks in AirMech mode, at half damage when airborne (p.106)", () => {
        const lam = makeLAM();
        expect(lam.canUsePhysicalAttacksInCurrentMode()).toBe(true);
        lam.currentMovementMode = "c";
        expect(lam.getPhysicalAttackNote()).toContain("half");
        lam.currentMovementMode = "w";
        expect(lam.getPhysicalAttackNote()).toBe("");
        lam.setTransformationMode("aerospace");
        expect(lam.canUsePhysicalAttacksInCurrentMode()).toBe(false);
    });

    it("names the movement on the sheet, with the elevation when airborne", () => {
        const lam = makeLAM();
        lam.currentMovementMode = "f";
        lam.currentToHitMovementModifier = 4;
        lam.airMechElevation = 3;
        expect(lam.getMovementText()).toBe("AirMech Flank 10-17⬣, Elevation 3");
        expect(lam.getMovementToHitText()).toBe("+4 to attack, -5 to be hit");
        lam.currentMovementMode = "w";
        lam.currentToHitMovementModifier = 0;
        expect(lam.getMovementText()).toBe("Walked 0-2⬣");
    });

    it("keeps the elevation through save and load, capped at 25 (p.102)", () => {
        const lam = makeLAM();
        lam.currentMovementMode = "c";
        lam.airMechElevation = 30;
        expect(lam.airMechElevation).toBe(25);
        const restored = new BattleMech();
        restored.import(lam.export());
        expect(restored.getTransformationMode()).toBe("airmech");
        expect(restored.airMechElevation).toBe(25);
    });

    it("puts the AirMech attacker modifier in the weapon to-hit (p.106)", () => {
        const lam = makeLAM();
        lam.addEquipmentFromTag("medium-laser", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        const index = lam.equipmentList.findIndex(item => item.tag === "medium-laser");
        lam.equipmentList[index].target = "a";
        const target = { name: "A", active: true, range: 2, movement: 0, otherMods: 0, jumped: false, primary: true, inRearArc: false };
        lam.setTargets(target, { ...target, name: "B" }, { ...target, name: "C" });
        const toHit = (mode: string) => { lam.currentMovementMode = mode; return getTargetToHitFromWeapon(lam, index); };
        expect(toHit("f").attackerMovementModifier).toBe(4);
        expect(toHit("f").finalToHit - toHit("w").finalToHit).toBe(3);
    });

    // #161: the LAM Skill Table (IO:AE p.100) and the BV average (IO:AE p.186, TM p.314).
    it("reads the LAM Skill Table: Fighter mode aerospace both, airborne AirMech aerospace Piloting with BattleMech Gunnery, otherwise BattleMech both", () => {
        const lam = makeLAM();
        lam.setPilotPiloting(5);
        lam.setPilotGunnery(4);
        lam.setPilotAeroPiloting(3);
        lam.setPilotAeroGunnery(2);
        const skills = () => lam.getActiveSkills();
        lam.setTransformationMode("mech");
        expect(skills()).toEqual({ piloting: 5, gunnery: 4 });
        lam.setTransformationMode("airmech");
        lam.currentMovementMode = "w";
        expect(skills()).toEqual({ piloting: 5, gunnery: 4 });
        lam.currentMovementMode = "c";
        expect(skills()).toEqual({ piloting: 3, gunnery: 4 });
        lam.currentMovementMode = "f";
        expect(skills()).toEqual({ piloting: 3, gunnery: 4 });
        lam.setTransformationMode("aerospace");
        expect(skills()).toEqual({ piloting: 3, gunnery: 2 });
        expect(lam.getGATOR().gunnerySkill).toBe(2);
    });

    it("uses the BattleMech pair everywhere for a save with no aerospace skills", () => {
        const lam = makeLAM();
        lam.setPilotPiloting(5);
        lam.setPilotGunnery(4);
        lam.setTransformationMode("aerospace");
        expect(lam.getActiveSkills()).toEqual({ piloting: 5, gunnery: 4 });
        expect(lam.getGATOR().gunnerySkill).toBe(4);
        const restored = new BattleMech(lam.exportJSON());
        expect(restored.getPilot().aeroGunnery).toBeUndefined();
        expect(restored.getActiveSkills()).toEqual({ piloting: 5, gunnery: 4 });
    });

    it("rates BV on the average of the BattleMech and aerospace skills, a half rounding up (IO:AE p.186: round normally)", () => {
        const bvWith = (piloting: number, gunnery: number, aeroPiloting?: number, aeroGunnery?: number) => {
            const lam = makeLAM();
            lam.setPilotPiloting(piloting);
            lam.setPilotGunnery(gunnery);
            if (aeroPiloting !== undefined) lam.setPilotAeroPiloting(aeroPiloting);
            if (aeroGunnery !== undefined) lam.setPilotAeroGunnery(aeroGunnery);
            return lam.getPilotAdjustedBattleValue();
        };
        // 4/5 and 2/3 average to 3/4.
        expect(bvWith(5, 4, 3, 2)).toBe(bvWith(4, 3));
        // 4 and 3 average 3.5, which rounds to 4; 5 and 4 average 4.5, which rounds to 5.
        expect(bvWith(5, 4, 4, 3)).toBe(bvWith(5, 4));
        // No aerospace skills: today's BV.
        expect(bvWith(5, 4)).toBe(bvWith(5, 4, 5, 4));
        expect(bvWith(5, 4, 2, 2)).not.toBe(bvWith(5, 4));
    });

    it("gives a Permanent Air 'Mech the aerospace Piloting skill while airborne, and averages BV the same way", () => {
        const pam = new BattleMech();
        pam.setType("lam");
        pam.setLAMType("pam");
        pam.setWalkSpeed(5);
        pam.setJumpSpeed(4);
        pam.setPilotPiloting(5);
        pam.setPilotGunnery(4);
        pam.setPilotAeroPiloting(3);
        pam.setPilotAeroGunnery(2);
        pam.currentMovementMode = "w";
        expect(pam.getActiveSkills()).toEqual({ piloting: 5, gunnery: 4 });
        pam.currentMovementMode = "c";
        expect(pam.getActiveSkills()).toEqual({ piloting: 3, gunnery: 4 });
        const plain = new BattleMech();
        plain.setType("lam");
        plain.setLAMType("pam");
        plain.setWalkSpeed(5);
        plain.setJumpSpeed(4);
        plain.setPilotPiloting(4);
        plain.setPilotGunnery(3);
        expect(pam.getPilotAdjustedBattleValue()).toBe(plain.getPilotAdjustedBattleValue());
    });

    it("keeps a plain BattleMech on its own pair whatever the aerospace skills say", () => {
        const mech = new BattleMech();
        mech.setPilotAeroPiloting(1);
        mech.setPilotAeroGunnery(1);
        expect(mech.getActiveSkills()).toEqual({ piloting: 5, gunnery: 4 });
        const same = new BattleMech();
        expect(mech.getPilotAdjustedBattleValue()).toBe(same.getPilotAdjustedBattleValue());
    });

    it("gives a Permanent Air 'Mech the AirMech modes every turn", () => {
        const pam = new BattleMech();
        pam.setType("lam");
        pam.setLAMType("pam");
        pam.setWalkSpeed(5);
        pam.setJumpSpeed(4);
        expect(pam.getTransformationMode()).toBe("airmech");
        expect(pam.canUseJumpJetsInCurrentMode()).toBe(false);
        pam.currentMovementMode = "c";
        expect(pam.getAttackerMovementModifier()).toBe(3);
    });
});
