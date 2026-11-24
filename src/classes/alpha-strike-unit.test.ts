import { describe, expect, it } from "vitest";
import AlphaStrikeForce from "./alpha-strike-force";
import { CONST_AS_PILOT_ABILITIES } from "../data/alpha-strike-pilot-abilities";
import { AlphaStrikeUnit, getRulesLevelFromMULRules } from "./alpha-strike-unit";
import { BattleMech } from "./battlemech";

describe("Alpha Strike unit rules level", () => {
    // MUL "Rules" values drive the roster print guard (Standard = tournament play).
    it("maps MUL Rules values to rules-level ids", () => {
        expect(getRulesLevelFromMULRules("Introductory")).toBe(1);
        expect(getRulesLevelFromMULRules("Standard")).toBe(2);
        expect(getRulesLevelFromMULRules("Advanced")).toBe(3);
        expect(getRulesLevelFromMULRules("Experimental")).toBe(4);
        expect(getRulesLevelFromMULRules(undefined)).toBeUndefined();
    });

    it("keeps the rules level through export and import", () => {
        const unit = new AlphaStrikeUnit();
        unit.rulesLevel = 3;
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        const restored = new AlphaStrikeUnit();
        restored.importUnit(unit.export());
        expect(restored.rulesLevel).toBe(3);
    });
});

describe("Alpha Strike unit Special Rulesets (#324 round 4)", () => {
    const roundTrip = (unit: AlphaStrikeUnit) => {
        const restored = new AlphaStrikeUnit();
        restored.importUnit(JSON.parse(JSON.stringify(unit.export())));
        return restored;
    };

    it("rulesets round-trip and are left out when empty", () => {
        const unit = new AlphaStrikeUnit();
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        expect(unit.export()).not.toHaveProperty("rulesets");
        unit.rulesets = ["sample-no-clans"];
        expect(roundTrip(unit).rulesets).toEqual(["sample-no-clans"]);
    });

    it("a new card with no move yet works out its values (the creator opens on one)", () => {
        expect(() => new AlphaStrikeUnit().isWrecked()).not.toThrow();
    });

    it("an older save loads with no rulesets and its rules level stays unknown", () => {
        const unit = new AlphaStrikeUnit();
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        const saved = { ...unit.export(), rulesets: "sample-no-clans" } as unknown as ReturnType<AlphaStrikeUnit["export"]>;
        const restored = new AlphaStrikeUnit();
        restored.importUnit(saved);
        expect(restored.rulesets).toEqual([]);
        expect(restored.rulesLevel).toBeUndefined();
    });
});

describe("Alpha Strike unit Armor and Structure setters", () => {
    // Armor and Structure are separate values on an Alpha Strike unit (ASCE p.25); each setter changes only its own.
    it("setStructure changes structure and leaves armor alone", () => {
        const unit = new AlphaStrikeUnit();
        unit.armor = 4;
        unit.structure = 3;
        unit.setStructure(7);
        expect(unit.structure).toBe(7);
        expect(unit.armor).toBe(4);
    });

    it("setArmor changes armor and leaves structure alone", () => {
        const unit = new AlphaStrikeUnit();
        unit.armor = 4;
        unit.structure = 3;
        unit.setArmor(6);
        expect(unit.armor).toBe(6);
        expect(unit.structure).toBe(3);
    });
});

// The Alpha Strike Companion's quirks in play (quirks design, plan 3): only units made from a design carry them, and
// only the quirks the Companion lists act (ASC p.59).
describe("Alpha Strike unit quirks in play", () => {
    const groundUnit = (): AlphaStrikeUnit => {
        const unit = new AlphaStrikeUnit();
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        return unit;
    };
    const toHits = (unit: AlphaStrikeUnit): number[] => {
        unit.calcCurrentValues();
        return [unit.currentToHitShort, unit.currentToHitMedium, unit.currentToHitLong, unit.currentToHitExtreme];
    };

    it("gives Improved Targeting (Long) -1 at long range only, with the switch on", () => {
        const unit = groundUnit();
        const plain = toHits(unit);
        unit.quirks = [{ tag: "quirk-improved-targeting", parameter: "long" }];
        expect(toHits(unit)).toEqual(plain);
        unit.quirksInPlay = true;
        expect(toHits(unit)).toEqual([plain[0], plain[1], plain[2] - 1, plain[3]]);
    });

    it("gives Sensor Ghosts +1 in every band", () => {
        const unit = groundUnit();
        const plain = toHits(unit);
        unit.quirks = [{ tag: "quirk-sensor-ghosts" }];
        unit.quirksInPlay = true;
        expect(toHits(unit)).toEqual(plain.map((value) => value + 1));
    });

    it("ignores a quirk the Companion does not list", () => {
        const unit = groundUnit();
        const plain = toHits(unit);
        unit.quirks = [{ tag: "quirk-stabilized-weapon" }];
        unit.quirksInPlay = true;
        expect(toHits(unit)).toEqual(plain);
    });

    it("keeps its quirks through export and import, but not the game's switch", () => {
        const unit = new AlphaStrikeUnit();
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        unit.quirks = [{ tag: "quirk-improved-targeting", parameter: "short" }];
        unit.quirksInPlay = true;
        const restored = new AlphaStrikeUnit();
        restored.importUnit(JSON.parse(JSON.stringify(unit.export())));
        expect(restored.quirks).toEqual([{ tag: "quirk-improved-targeting", parameter: "short" }]);
        expect(restored.quirksInPlay).toBe(false);
    });

    it("reads a save made before quirks with none", () => {
        const unit = new AlphaStrikeUnit();
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        const saved = unit.export() as Partial<ReturnType<AlphaStrikeUnit["export"]>>;
        delete saved.quirks;
        const restored = new AlphaStrikeUnit();
        restored.importUnit(saved as ReturnType<AlphaStrikeUnit["export"]>);
        expect(restored.quirks).toEqual([]);
    });

    it("carries a 'Mech design's Companion quirks, and not its others", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        mech.quirks.add({ tag: "quirk-sensor-ghosts" });
        mech.quirks.add({ tag: "quirk-stabilized-weapon" });
        expect(mech.calcAlphaStrike().quirks).toEqual([{ tag: "quirk-sensor-ghosts" }]);
    });

    it("gets the switch from its Alpha Strike force", () => {
        const force = new AlphaStrikeForce();
        const unit = new AlphaStrikeUnit();
        force.groups[0].members.push(unit);
        force.quirksInPlay = true;
        force.syncQuirksInPlay();
        expect(unit.quirksInPlay).toBe(true);
    });
});

// E-War play state rides with the unit (#642 Phase 5 Task 5).
describe("Alpha Strike unit E-War state", () => {
    const build = (abilities: string[] = ["ECM"]) => {
        const unit = new AlphaStrikeUnit();
        unit.abilities = abilities;
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        return unit;
    };
    it("round-trips ewarPlay through export and import", () => {
        const unit = build();
        unit.ewarPlay = { narcs: ["SNARC"], ecmMode: "eccm", jammed: [{ kind: "DJ", turnsLeft: 3 }] };
        const restored = new AlphaStrikeUnit();
        restored.importUnit(JSON.parse(JSON.stringify(unit.export())));
        expect(restored.ewarPlay).toEqual({ narcs: ["SNARC"], ecmMode: "eccm", jammed: [{ kind: "DJ", turnsLeft: 3 }] });
    });
    it("leaves it out when empty or when the export holds no in-play state", () => {
        const unit = build();
        expect(unit.export()).not.toHaveProperty("ewarPlay");
        unit.ewarPlay = { stoodStill: true };
        expect(unit.export(true)).not.toHaveProperty("ewarPlay");
        expect(unit.export()).toHaveProperty("ewarPlay");
    });
    it("imports an old save with no ewarPlay unchanged", () => {
        const unit = build();
        const old = JSON.parse(JSON.stringify(unit.export()));
        const restored = new AlphaStrikeUnit();
        restored.importUnit(old);
        expect(restored.ewarPlay).toEqual({});
        unit.calcCurrentValues();
        restored.calcCurrentValues();
        expect(restored.currentToHitShort).toBe(unit.currentToHitShort);
    });
    it("clears ewarPlay on reset", () => {
        const unit = build();
        unit.ewarPlay = { narcs: ["INARC"] };
        unit.reset();
        expect(unit.ewarPlay).toEqual({});
    });
});

describe("Alpha Strike unit play by edition (#646)", () => {
    const make = (type: string, move: number, edition?: string) => {
        const unit = new AlphaStrikeUnit();
        unit.type = type;
        unit.move = [{ move, currentMove: move, type: "" }];
        unit.damage = { short: 1, medium: 1, long: 0, extreme: 0, shortMinimal: false, mediumMinimal: false, longMinimal: true, extremeMinimal: false };
        if (edition) {
            unit.playEdition = edition;
        }
        return unit;
    };

    it("heat 2 takes 1 off the TMM under the Commander's Edition only", () => {
        const asce = make("BM", 10, "alpha-strike-commanders-edition");
        const book = make("BM", 10, "alpha-strike");
        asce.currentHeat = 2;
        book.currentHeat = 2;
        asce.calcCurrentValues();
        book.calcCurrentValues();
        expect(asce.currentTMM).toBe("1");
        expect(book.currentTMM).toBe("2");
    });

    it("a weapon hit takes 1 to 0* under the Commander's Edition and to 0 under 2013", () => {
        const asce = make("BM", 10);
        const book = make("BM", 10, "alpha-strike");
        asce.weaponHits = [true];
        book.weaponHits = [true];
        asce.calcCurrentValues();
        book.calcCurrentValues();
        expect(asce.currentDamage.short).toBe(0);
        expect(asce.currentDamage.shortMinimal).toBe(true);
        expect(book.currentDamage.short).toBe(0);
        expect(book.currentDamage.shortMinimal).toBe(false);
        expect(asce.currentDamage.longMinimal).toBe(false);
        expect(book.currentDamage.longMinimal).toBe(false);
    });

    it("a vehicle engine hit halves TMM under the Commander's Edition only; Move halves under both", () => {
        const asce = make("CV", 12);
        const book = make("CV", 12, "alpha-strike");
        asce.engineHits = [true];
        book.engineHits = [true];
        asce.calcCurrentValues();
        book.calcCurrentValues();
        expect(asce.currentTMM).toBe("1");
        expect(book.currentTMM).toBe("2");
        expect(asce.currentMove).toBe(book.currentMove);
    });

    it("a unit with no edition set plays as the Commander's Edition", () => {
        const unit = make("BM", 10);
        unit.currentHeat = 2;
        unit.calcCurrentValues();
        expect(unit.currentTMM).toBe("1");
    });
});

describe("Alpha Strike pilot abilities by edition (#646)", () => {
    const pilotUnit = (edition: string, ...names: string[]) => {
        const unit = new AlphaStrikeUnit();
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        unit.playEdition = edition;
        const ids = names.map(name => CONST_AS_PILOT_ABILITIES.find(ability => ability.ability === name)!.id);
        unit.currentPilotAbilityID = ids[0];
        if (ids[1]) { unit.currentPilotAbilityID2 = ids[1]; }
        return unit;
    };

    it("a held ability the 2013 edition does not offer is kept, marked, and its points count", () => {
        const unit = pilotUnit("alpha-strike", "Headhunter", "Animal Mimicry");
        const held = unit.getPilotAbilities();
        expect(held[0]).toMatchObject({ ability: "Headhunter", notInEdition: true });
        expect(held[1].notInEdition).toBeUndefined();
        expect(unit.getTotalPilotAbilityPoints()).toBe(2 + 2);
    });

    it("costs follow the edition: Animal Mimicry is 3 under the Commander's Edition and 2 under 2013", () => {
        expect(pilotUnit("alpha-strike-commanders-edition", "Animal Mimicry").getTotalPilotAbilityPoints()).toBe(3);
        expect(pilotUnit("alpha-strike", "Animal Mimicry").getTotalPilotAbilityPoints()).toBe(2);
    });
});
