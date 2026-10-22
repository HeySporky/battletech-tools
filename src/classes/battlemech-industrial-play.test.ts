import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";

// IndustrialMechs and Primitive 'Mechs in play: critical hits (TW pp.68, 124, 128, 144; IO:AE p.114), movement heat
// (TW p.158; TM p.303) and Non-Fusion BattleMechs (TO:AUE p.120).

const build = (options: { structure?: string, engine?: string, primitive?: boolean, era?: string } = {}) => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra(options.era ?? "dark-ages");
    if (options.primitive) mech.setPrimitive(true);
    mech.setTonnage(50);
    if (options.structure) mech.setInternalStructureType(options.structure);
    if (options.engine) mech.setEngineType(options.engine);
    mech.setWalkSpeed(3);
    return mech;
};
const industrial = (engine?: string) => build({ structure: "industrial", engine });
const placeIn = (mech: BattleMech, tag: string, location: string, key: string) => {
    const item = mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined)!;
    const from = mech.unallocatedCriticals.findIndex(critical => critical?.uuid === item.uuid);
    const slot = mech.getCriticals()[key].findIndex(critical => !critical);
    expect(mech.moveCritical("un", from, location, slot)).toBe(true);
    return slot;
};

describe("Determining Critical Hits for IndustrialMechs and Primitive 'Mechs", () => {
    it("adds +2 against an IndustrialMech (TW p.124) and +2 / +4 against Primitive 'Mechs (IO:AE p.114)", () => {
        expect(build().getCriticalHitRollModifier()).toBe(0);
        expect(industrial().getCriticalHitRollModifier()).toBe(2);
        expect(build({ primitive: true, era: "age-of-war" }).getCriticalHitRollModifier()).toBe(2);
        expect(build({ primitive: true, era: "age-of-war", structure: "industrial" }).getCriticalHitRollModifier()).toBe(4);
    });

    it("rolls the Total Warfare table for a BattleMech: 7 is no critical hit, 8 is one", () => {
        const mech = build();
        expect(mech.rollCriticalHit("ct", { chance: 7 })).toEqual(["Critical hit roll 7.", "No critical hit."]);
        const log = mech.rollCriticalHit("ct", { chance: 8, lines: [1, 1] });
        expect(log.slice(0, 2)).toEqual(["Critical hit roll 8.", "One critical hit."]);
        expect(log[2]).toBe("Line 1-3, 1: Standard Fusion is hit.");
        expect(mech.isCriticalDamaged("ct", 0)).toBe(true);
    });

    it("gives the CattleMaster's 4 + 3 + 2 = 9 one critical hit in its right arm (TW p.124)", () => {
        const mech = industrial();
        const log = mech.rollCriticalHit("ra", { chance: 7, lines: [1, 1] });
        expect(log.slice(0, 2)).toEqual(["Critical hit roll 7 + 2 = 9.", "One critical hit."]);
        expect(mech.isCriticalDamaged("ra", 0)).toBe(true);
    });

    it("counts an IndustrialMech's 13 as 12, and on 14 makes four torso hits or blows the limb off", () => {
        const torso = industrial().rollCriticalHit("lt", { chance: 11, lines: [1, 1, 1, 2, 1, 3] });
        expect(torso.slice(0, 2)).toEqual(["Critical hit roll 11 + 2 = 13.", "3 critical hits."]);
        expect(industrial().rollCriticalHit("lt", { chance: 12, lines: [1, 1, 1, 2, 1, 3, 1, 4] })[1]).toBe("4 critical hits.");

        const mech = industrial();
        const before = mech.getCurrentStructure();
        expect(mech.rollCriticalHit("ra", { chance: 11 })).toEqual(["Critical hit roll 11 + 2 = 13.", "Right Arm blown off."]);
        // A 50-ton 'Mech's arm has 8 internal structure points.
        expect(mech.getCurrentStructure()).toBe(before - 8);
    });

    it("counts a Primitive BattleMech's 13 or more as 12, and gives a Primitive IndustrialMech four torso hits on 14", () => {
        const battleMech = build({ primitive: true, era: "age-of-war" });
        expect(battleMech.rollCriticalHit("lt", { chance: 12, lines: [1, 1, 1, 2, 1, 3] }).slice(0, 2))
            .toEqual(["Critical hit roll 12 + 2 = 14.", "3 critical hits."]);
        const industrialMech = build({ primitive: true, era: "age-of-war", structure: "industrial" });
        expect(industrialMech.rollCriticalHit("lt", { chance: 10, lines: [1, 1, 1, 2, 1, 3, 1, 4] }).slice(0, 2))
            .toEqual(["Critical hit roll 10 + 4 = 14.", "4 critical hits."]);
    });

    it("rolls again on an empty line, a line already hit and CASE (TW p.124)", () => {
        const mech = build();
        // Head: life support, sensors, cockpit, an empty line, sensors, life support.
        expect(mech.rollCriticalHit("hd", { chance: 8, lines: [4, 2] }).at(-1)).toBe("Line 2: Sensors is hit.");
        expect(mech.rollCriticalHit("hd", { chance: 8, lines: [2, 5] }).at(-1)).toBe("Line 5: Sensors is hit.");

        const withCASE = build();
        const caseSlot = placeIn(withCASE, "case", "lt", "leftTorso");
        const laserSlot = placeIn(withCASE, "medium-laser", "lt", "leftTorso");
        const lineDice = (slot: number) => [slot < 6 ? 1 : 4, slot % 6 + 1];
        const log = withCASE.rollCriticalHit("lt", { chance: 8, lines: [...lineDice(caseSlot), ...lineDice(laserSlot)] });
        expect(withCASE.isCriticalDamaged("lt", caseSlot)).toBe(false);
        expect(withCASE.isCriticalDamaged("lt", laserSlot)).toBe(true);
        expect(log.at(-1)).toMatch(/Medium Laser is hit\.$/);
        // With nothing left to hit, the roll says so.
        expect(build().rollCriticalHit("lt", { chance: 8 }).at(-1)).toBe("No line left that can take a critical hit.");
    });

    it("keeps an earlier edition's own critical hit rule", () => {
        const mech = build();
        mech.setRulesEdition("battledroids");
        expect(mech.rollCriticalHit("hd", { chance: 6 })).toEqual(["Critical hit roll 6: no critical hit (7 or more is needed)."]);
    });
});

describe("IndustrialMech End Phase damage check (TW pp.68, 144)", () => {
    it("rolls a location on the Front/Rear column, then the critical hit table with +1 a level fallen above 1", () => {
        const mech = industrial();
        // Fell 3 levels: +2 for the fall and +2 for an IndustrialMech.
        const log = mech.rollIndustrialMechDamageCheck(3, { location: 12, chance: 7, lines: [2, 5] });
        expect(log.slice(0, 3)).toEqual(["Location roll 12: Head.", "Critical hit roll 7 + 4 = 11.", "2 critical hits."]);
        // A physical attack: no fall modifier.
        expect(industrial().rollIndustrialMechDamageCheck(0, { location: 7, chance: 5 })).toEqual(["Location roll 7: Center Torso.", "Critical hit roll 5 + 2 = 7.", "No critical hit."]);
        // A BattleMech makes no such check.
        expect(build().rollIndustrialMechDamageCheck(0, { location: 7, chance: 12 })).toEqual([]);
    });
});

describe("IndustrialMech sensors and movement heat", () => {
    it("loses an IndustrialMech's sensors to one critical hit (TW p.128)", () => {
        const mech = industrial();
        mech.toggleCritical("hd", 1);
        expect(mech.areSensorsDestroyed()).toBe(true);
        const battleMech = build();
        battleMech.toggleCritical("hd", 1);
        expect(battleMech.areSensorsDestroyed()).toBe(false);
        battleMech.toggleCritical("hd", 4);
        expect(battleMech.areSensorsDestroyed()).toBe(true);
    });

    it("makes no walking or running heat on ICE and fuel cell IndustrialMechs (TW p.158)", () => {
        for (const engine of ["ice", "cell"]) {
            const mech = industrial(engine);
            mech.currentMovementMode = "r";
            expect(mech.getActiveMoveHeat(), engine).toBe(0);
        }
        const fusion = industrial("standard");
        fusion.currentMovementMode = "r";
        expect(fusion.getActiveMoveHeat()).toBe(2);
    });

    it("gives an ICE IndustrialMech a Battle Value Movement Heat of 0 (TM p.303), but not a fuel cell one", () => {
        expect(industrial("ice").getMaxMovementHeat()).toBe(0);
        expect(industrial("cell").getMaxMovementHeat()).toBe(2);
    });
});

describe("Non-Fusion BattleMechs (TO:AUE p.120)", () => {
    it("are Experimental, offered only at that rules level, and make movement heat as BattleMechs", () => {
        const mech = build();
        const ice = () => mech.getAvailableEngines(3).find(engine => engine.tag === "ice");
        expect(ice()?.available).toBe(false);
        expect(mech.getAvailableEngines(4).find(engine => engine.tag === "ice")?.available).toBe(true);
        mech.setEngineType("ice");
        expect(mech.isNonFusionBattleMech()).toBe(true);
        expect(mech.getRequiredRulesLevel()).toBe(4);
        mech.currentMovementMode = "w";
        expect(mech.getActiveMoveHeat()).toBe(1);
        // An IndustrialMech mounts them by its own rules.
        expect(industrial("ice").isNonFusionBattleMech()).toBe(false);
        expect(industrial("ice").getRequiredRulesLevel()).toBeLessThan(4);
    });
});
