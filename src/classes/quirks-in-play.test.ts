import { describe, expect, it, vi } from "vitest";
import AlphaStrikeForce, { IASForceExport } from "./alpha-strike-force";
import { BattleMech } from "./battlemech";
import { BattleMechForce, ICBTForceExport } from "./battlemech-force";
import { getCarrierQuirkEffects } from "../utils/quirk-effects";

// "Use design quirks": a per-game switch, saved with the force, off by default (quirks design, plan 3).
describe("the Classic force's design quirks switch", () => {
    it("is off on a new force", () => {
        expect(new BattleMechForce().quirksInPlay).toBe(false);
    });

    it("saves and reloads the switch", () => {
        const force = new BattleMechForce();
        force.quirksInPlay = true;
        expect(new BattleMechForce(JSON.parse(JSON.stringify(force.export()))).quirksInPlay).toBe(true);
    });

    it("loads a force saved before the switch with it off", () => {
        const old = new BattleMechForce().export();
        delete (old as Partial<ICBTForceExport>).quirksInPlay;
        expect(new BattleMechForce(old).quirksInPlay).toBe(false);
    });
});

describe("the Alpha Strike force's design quirks switch", () => {
    it("is off on a new force", () => {
        expect(new AlphaStrikeForce().quirksInPlay).toBe(false);
    });

    it("saves and reloads the switch", () => {
        const force = new AlphaStrikeForce();
        force.quirksInPlay = true;
        expect(new AlphaStrikeForce(JSON.parse(JSON.stringify(force.export()))).quirksInPlay).toBe(true);
    });

    it("loads a force saved before the switch with it off", () => {
        const old = new AlphaStrikeForce().export();
        delete (old as Partial<IASForceExport>).quirksInPlay;
        expect(new AlphaStrikeForce(old).quirksInPlay).toBe(false);
    });
});

// A side's Initiative takes its largest quirk, never the sum (CO p.225).
describe("the Classic force's quirk Initiative", () => {
    const mechWithQuirk = (tag: string): BattleMech => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        expect(mech.quirks.add({ tag })).toBeNull();
        return mech;
    };

    // Review Focus 4.
    it("gives +2 for a Command 'Mech and a Battle Computer, and +1 once the Battle Computer 'Mech is destroyed", () => {
        const force = new BattleMechForce();
        const battleComputer = mechWithQuirk("quirk-battle-computer");
        force.groups[0].members.push(mechWithQuirk("quirk-command-mech"), battleComputer);
        expect(force.getInitiativeModifier()).toEqual({ modifier: 2, label: "Battle Computer (+2)", title: "Battle Computer" });
        battleComputer.pilot.wounds = 6;
        expect(force.getInitiativeModifier()).toEqual({ modifier: 1, label: "Command 'Mech (+1)", title: "Command 'Mech" });
    });

    it("gives nothing for a side without an Initiative quirk", () => {
        const force = new BattleMechForce();
        force.groups[0].members.push(new BattleMech());
        expect(force.getInitiativeModifier()).toBeNull();
    });
});

// Exactly the side torso's armor and structure, so no damage transfers to the center torso.
const destroyLeftTorso = (mech: BattleMech): void => {
    mech.takeDamage(mech.getArmorAllocation().leftTorso + mech.getInternalStructure().leftTorso, "lt", false);
};

// A wrecked 'Mech drops out of its side's Initiative, as the record sheet shows it wrecked (final review).
describe("a destroyed 'Mech and its side's quirk Initiative", () => {
    it("drops an XL engine 'Mech that has lost a side torso", () => {
        const force = new BattleMechForce();
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        mech.setEngineType("xl");
        expect(mech.quirks.add({ tag: "quirk-battle-computer" })).toBeNull();
        force.groups[0].members.push(mech);
        expect(force.getInitiativeModifier()?.modifier).toBe(2);
        destroyLeftTorso(mech);
        expect(mech.isDestroyed()).toBe(true);
        expect(force.getInitiativeModifier()).toBeNull();
    });

    it("drops a 'Mech with more than two engine hits", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        vi.spyOn(mech, "engineHits").mockReturnValue(3);
        expect(mech.isDestroyed()).toBe(true);
    });

    it("keeps a standard engine 'Mech that has lost a side torso", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        destroyLeftTorso(mech);
        expect(mech.isDestroyed()).toBe(false);
    });
});

// Play checks a quirk's years against the game's year when the roster sets one, else the unit's era start (final review).
describe("the game year and quirks in play", () => {
    // A 'Mech defaults to the Star League era (2571-2780); this quirk ends in 2600.
    const mechWithEndingQuirk = (): BattleMech => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        expect(mech.quirks.add({ tag: "quirk-battle-computer", toYear: 2600 })).toBeNull();
        return mech;
    };

    it("has no game year on a new force, and saves and reloads one", () => {
        expect(new BattleMechForce().gameYear).toBeNull();
        const force = new BattleMechForce();
        force.setGameYear(2700);
        expect(new BattleMechForce(JSON.parse(JSON.stringify(force.export()))).gameYear).toBe(2700);
    });

    it("loads a force saved before the game year without one", () => {
        const old = new BattleMechForce().export();
        delete (old as Partial<ICBTForceExport>).gameYear;
        expect(new BattleMechForce(old).gameYear).toBeNull();
    });

    it("treats a blank or impossible year as none", () => {
        const force = new BattleMechForce();
        force.setGameYear(0);
        expect(force.gameYear).toBeNull();
        force.setGameYear(Number.NaN);
        expect(force.gameYear).toBeNull();
        force.setGameYear(3025.5);
        expect(force.gameYear).toBe(3025);
    });

    it("keeps a quirk that has ended by the game year out of the side's Initiative", () => {
        const force = new BattleMechForce();
        force.groups[0].members.push(mechWithEndingQuirk());
        expect(force.getInitiativeModifier()?.modifier).toBe(2);
        force.setGameYear(2700);
        expect(force.getInitiativeModifier()).toBeNull();
    });

    it("hands the game year to its units, so their effects drop an ended quirk", () => {
        const force = new BattleMechForce();
        const mech = mechWithEndingQuirk();
        force.groups[0].members.push(mech);
        expect(getCarrierQuirkEffects(mech)).toHaveLength(1);
        force.setGameYear(2700);
        expect(mech.getQuirkPlayYear()).toBe(2700);
        expect(getCarrierQuirkEffects(mech)).toEqual([]);
        force.setGameYear(0);
        expect(mech.getQuirkPlayYear()).toBe(2571);
    });

    it("hands a reloaded force's game year to its units", () => {
        const force = new BattleMechForce();
        force.groups[0].members.push(mechWithEndingQuirk());
        force.setGameYear(2700);
        const reloaded = new BattleMechForce(JSON.parse(JSON.stringify(force.export())));
        expect(reloaded.groups[0].members[0].getQuirkPlayYear()).toBe(2700);
    });
});

describe("the Alpha Strike force's game year", () => {
    it("has none on a new force, and saves and reloads one", () => {
        expect(new AlphaStrikeForce().gameYear).toBeNull();
        const force = new AlphaStrikeForce();
        force.setGameYear(3030);
        expect(new AlphaStrikeForce(JSON.parse(JSON.stringify(force.export()))).gameYear).toBe(3030);
    });

    it("leaves a design quirk that has ended by the game year off the card's to-hit", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        expect(mech.quirks.add({ tag: "quirk-improved-targeting", parameter: "short", toYear: 2600 })).toBeNull();
        const unit = mech.calcAlphaStrike();
        const force = new AlphaStrikeForce();
        force.quirksInPlay = true;
        force.addToGroup(unit, 0);
        unit.calcCurrentValues();
        const withQuirk = unit.currentToHitShort;
        force.setGameYear(2700);
        unit.calcCurrentValues();
        expect(unit.currentToHitShort).toBe(withQuirk + 1);
    });

    it("carries a quirk that starts later in the design's era, in force from its year on", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        expect(mech.quirks.add({ tag: "quirk-improved-targeting", parameter: "short", fromYear: 2700 })).toBeNull();
        const unit = mech.calcAlphaStrike();
        const force = new AlphaStrikeForce();
        force.quirksInPlay = true;
        force.addToGroup(unit, 0);
        unit.calcCurrentValues();
        const atEraStart = unit.currentToHitShort;
        force.setGameYear(2750);
        unit.calcCurrentValues();
        expect(unit.currentToHitShort).toBe(atEraStart - 1);
        const reloaded = new AlphaStrikeForce(JSON.parse(JSON.stringify(force.export())));
        const reloadedUnit = reloaded.groups[0].members[0];
        reloadedUnit.calcCurrentValues();
        expect(reloadedUnit.currentToHitShort).toBe(atEraStart - 1);
    });
});
