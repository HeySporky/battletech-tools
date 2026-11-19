import { describe, expect, it } from "vitest";
import AlphaStrikeForce from "./alpha-strike-force";
import { AlphaStrikeUnit } from "./alpha-strike-unit";

const groundUnit = (points: number): AlphaStrikeUnit => {
    const unit = new AlphaStrikeUnit();
    unit.move = [{ move: 8, currentMove: 8, type: "" }];
    unit.basePoints = points;
    return unit;
};

describe("the Alpha Strike force's member count", () => {
    it("counts every member of a group, not as many as there are groups", () => {
        const force = new AlphaStrikeForce();
        force.addToGroup(groundUnit(20));
        force.addToGroup(groundUnit(30));
        force.addToGroup(groundUnit(25));
        force.getActiveMembers();
        expect(force.activeMembers).toBe(3);
        expect(force.membersLabel).toBe(" (3/3)");
    });
});

describe("a unit added to an Alpha Strike force", () => {
    it("takes the force's design quirks switch at once", () => {
        const force = new AlphaStrikeForce();
        force.quirksInPlay = true;
        const unit = groundUnit(20);
        force.addToGroup(unit);
        expect(unit.quirksInPlay).toBe(true);
    });
});

describe("an Alpha Strike force saved and loaded", () => {
    it("keeps the turn it was on", () => {
        const force = new AlphaStrikeForce();
        force.addToGroup(groundUnit(20));
        force.turn = 5;
        force.phase = 2;
        const loaded = new AlphaStrikeForce(JSON.parse(JSON.stringify(force.export())));
        expect(loaded.turn).toBe(5);
        expect(loaded.phase).toBe(2);
    });

    it("starts at turn 1 when the save has no usable turn", () => {
        const saved = JSON.parse(JSON.stringify(new AlphaStrikeForce().export()));
        delete saved.turn;
        expect(new AlphaStrikeForce(saved).turn).toBe(1);
        saved.turn = "x";
        expect(new AlphaStrikeForce(saved).turn).toBe(1);
    });
});

describe("adding to a group that is no longer there", () => {
    it("adds to the last group instead of dropping the unit", () => {
        const force = new AlphaStrikeForce();
        force.newGroup();
        force.addToGroup(groundUnit(20), 2);
        force.addToGroup(groundUnit(25), 7);
        expect(force.groups[1].members).toHaveLength(2);
        expect(force.getTotalUnits()).toBe(2);
    });
});

describe("an Alpha Strike group's default name", () => {
    it("spaces the label from the number", () => {
        expect(new AlphaStrikeForce().groups[0].getName(1)).toBe("Lance #1");
    });
});

describe("a vehicle's motive hit boxes for the round", () => {
    it("match the hit boxes however often the card is recalculated", () => {
        const unit = groundUnit(20);
        unit.type = "CV";
        // A save from before vehicles had five boxes.
        unit.mpControlHits = [false, false, false, false];
        unit.roundMpControlHits = [false, false, false, false];
        for (let count = 0; count < 4; count++) unit.calcCurrentValues();
        expect(unit.mpControlHits).toHaveLength(5);
        expect(unit.roundMpControlHits).toHaveLength(5);
    });
});

describe("the Point Value of a low-skill pilot", () => {
    it("drops one more point for each 10 points, or part of 10, over 104", () => {
        const pointsAtSkillFive = (basePoints: number): number => {
            const unit = groundUnit(basePoints);
            unit.setSkill(5);
            unit.calcCurrentValues();
            return unit.currentPoints;
        };
        expect(pointsAtSkillFive(104)).toBe(94);
        expect(pointsAtSkillFive(105)).toBe(94);
        expect(pointsAtSkillFive(114)).toBe(103);
        expect(pointsAtSkillFive(115)).toBe(103);
    });
});
