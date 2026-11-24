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

// E-War board and rules edition ride with the force (#642 Phase 5 Task 5).
describe("Alpha Strike force E-War board", () => {
    const unitWith = (abilities: string[]) => {
        const unit = new AlphaStrikeUnit();
        unit.abilities = abilities;
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        return unit;
    };
    const roundTrip = (force: AlphaStrikeForce) => new AlphaStrikeForce(JSON.parse(JSON.stringify(force.export())));

    it("round-trips the board and drops a removed unit from it on export", () => {
        const force = new AlphaStrikeForce();
        const a = unitWith(["ECM"]);
        const b = unitWith(["C3I"]);
        force.addToGroup(a);
        force.addToGroup(b);
        force.ewarBoard = {
            friendlyEcm: { [a.uuid]: [b.uuid, "gone"], gone: [a.uuid] },
            c3Networks: [{ name: "N", kind: "c3i", members: [a.uuid, b.uuid, "gone"] }],
            droneControl: { [b.uuid]: a.uuid, gone: a.uuid, [a.uuid]: "gone" },
        };
        const restored = roundTrip(force);
        expect(restored.ewarBoard).toEqual({
            friendlyEcm: { [a.uuid]: [b.uuid] },
            c3Networks: [{ name: "N", kind: "c3i", members: [a.uuid, b.uuid] }],
            droneControl: { [b.uuid]: a.uuid },
        });
    });
    it("leaves the board out when empty or for a fresh export", () => {
        const force = new AlphaStrikeForce();
        expect(force.export()).not.toHaveProperty("ewarBoard");
        const a = unitWith(["ECM"]);
        force.addToGroup(a);
        force.ewarBoard = { friendlyEcm: { [a.uuid]: [a.uuid] } };
        expect(force.export(true)).not.toHaveProperty("ewarBoard");
    });
    it("imports an old save with an empty board", () => {
        const force = new AlphaStrikeForce();
        force.addToGroup(unitWith(["ECM"]));
        const old = JSON.parse(JSON.stringify(force.export()));
        expect(new AlphaStrikeForce(old).ewarBoard).toEqual({});
    });
    it("applies the End Round to every unit", () => {
        const force = new AlphaStrikeForce();
        const a = unitWith(["MAS"]);
        const b = unitWith(["LMAS"]);
        force.addToGroup(a);
        force.addToGroup(b, 0);
        a.ewarPlay.stoodStill = true;
        b.ewarPlay.stoodStill = true;
        force.applyEWarRound();
        expect(a.ewarPlay.stoodStill).toBeUndefined();
        expect(b.ewarPlay.stoodStill).toBeUndefined();
        expect(force.getEWarUnits().length).toBe(2);
    });
    it("keeps the rules edition: default for an old save, round-trip, unknown tag falls back", () => {
        const force = new AlphaStrikeForce();
        expect(force.rulesEdition).toBe("alpha-strike-commanders-edition");
        expect(force.export()).not.toHaveProperty("rulesEdition");
        force.rulesEdition = "alpha-strike";
        expect(roundTrip(force).rulesEdition).toBe("alpha-strike");
        const odd = JSON.parse(JSON.stringify(force.export()));
        odd.rulesEdition = "no-such-edition";
        expect(new AlphaStrikeForce(odd).rulesEdition).toBe("alpha-strike-commanders-edition");
    });
});

describe("Alpha Strike force rules edition and level (#646)", () => {
    const build = (): AlphaStrikeForce => {
        const force = new AlphaStrikeForce();
        const bm = new AlphaStrikeUnit();
        bm.type = "BM";
        bm.move = [{ move: 10, currentMove: 10, type: "" }];
        bm.damage = { short: 1, medium: 1, long: 0, extreme: 0, shortMinimal: false, mediumMinimal: false, longMinimal: true, extremeMinimal: false };
        bm.currentHeat = 2;
        bm.weaponHits = [true];
        const cv = new AlphaStrikeUnit();
        cv.type = "CV";
        cv.move = [{ move: 12, currentMove: 12, type: "" }];
        cv.engineHits = [true];
        force.groups[0].members.push(bm, cv);
        force.syncQuirksInPlay();
        force.groups[0].members.forEach((unit) => unit.calcCurrentValues());
        return force;
    };

    it("an old save plays as before and exports no edition or level", () => {
        const saved = build().export();
        delete (saved as { rulesEdition?: string }).rulesEdition;
        const restored = new AlphaStrikeForce(JSON.parse(JSON.stringify(saved)));
        const [bm, cv] = restored.groups[0].members;
        bm.calcCurrentValues();
        cv.calcCurrentValues();
        expect([bm.currentTMM, bm.currentDamage.short, bm.currentDamage.shortMinimal, cv.currentTMM]).toEqual(["1", 0, true, "1"]);
        expect(restored.rulesLevel).toBeUndefined();
        expect(restored.export()).not.toHaveProperty("rulesEdition");
        expect(restored.export()).not.toHaveProperty("rulesLevel");
    });

    it("switching edition recalculates every unit at once and switching back restores it", () => {
        const force = build();
        const [bm, cv] = force.groups[0].members;
        force.setRulesEdition("alpha-strike");
        expect([bm.currentTMM, bm.currentDamage.shortMinimal, cv.currentTMM]).toEqual(["2", false, "2"]);
        force.setRulesEdition("alpha-strike-commanders-edition");
        expect([bm.currentTMM, bm.currentDamage.shortMinimal, cv.currentTMM]).toEqual(["1", true, "1"]);
    });

    it("edition and level round-trip", () => {
        const force = build();
        force.setRulesEdition("alpha-strike");
        force.setRulesLevel(1);
        const restored = new AlphaStrikeForce(JSON.parse(JSON.stringify(force.export())));
        expect(restored.rulesEdition).toBe("alpha-strike");
        expect(restored.rulesLevel).toBe(1);
        expect(restored.groups[0].members[0].playEdition).toBe("alpha-strike");
    });
});

describe("Alpha Strike force: a saved 2013 force plays by 2013 after a reload (#646 review C1)", () => {
    it("recalculates every unit on import, with no other call", () => {
        const force = new AlphaStrikeForce();
        const bm = new AlphaStrikeUnit();
        bm.type = "BM";
        bm.move = [{ move: 10, currentMove: 10, type: "" }];
        bm.damage = { short: 1, medium: 1, long: 0, extreme: 0, shortMinimal: false, mediumMinimal: false, longMinimal: true, extremeMinimal: false };
        bm.currentHeat = 2;
        bm.weaponHits = [true];
        force.groups[0].members.push(bm);
        force.setRulesEdition("alpha-strike");
        const restored = new AlphaStrikeForce(JSON.parse(JSON.stringify(force.export())));
        const unit = restored.groups[0].members[0];
        expect(unit.currentTMM).toBe("2");
        expect(unit.currentDamage.shortMinimal).toBe(false);
    });
});
