import { describe, expect, test } from "vitest";
import { AlphaStrikeUnit, IASMULUnit } from "../classes/alpha-strike-unit";
import { calculateGroundPointValue, IGroundPVInput, parseGroundMove, splitSpecialAbilities } from "./alphaStrikeGroundPointValue";
import { calculateAlphaStrikeValue, IAlphaStrikeExport } from "./calculateAlphaStrikeValue";

/** A Master Unit List card's Alpha Strike fields, as tools/mul-sync/live-units.json holds them. */
interface ICard {
    name: string; type: string; size: number; move: string; armor: number; structure: number;
    damage: [number | "0*", number | "0*", number | "0*"]; overheat: number; abilities: string; pv: number;
}

const card = (name: string, type: string, size: number, move: string, damage: ICard["damage"], overheat: number, armor: number, structure: number, abilities: string, pv: number): ICard =>
    ({ name, type, size, move, damage, overheat, armor, structure, abilities, pv });

const toInput = (unit: ICard): IGroundPVInput => {
    const move = parseGroundMove(unit.move);
    const value = (damage: number | "0*") => ({ damage: damage === "0*" ? 0 : damage, minimal: damage === "0*" });
    return {
        type: unit.type, size: unit.size, moves: move.moves, jump: move.jump,
        short: value(unit.damage[0]), medium: value(unit.damage[1]), long: value(unit.damage[2]),
        overheat: unit.overheat, armor: unit.armor, structure: unit.structure, specials: splitSpecialAbilities(unit.abilities),
    };
};

// Published Master Unit List cards, chosen so each rule below is checked against a printed Point Value.
const CARDS: ICard[] = [
    card("Atlas AS7-D", "BM", 4, '6"', [5, 5, 2], 0, 10, 8, "AC 2/2/-,IF 1,LRM 1/1/1,REAR 1/1/-", 52),
    card("Locust LCT-1V (Agile)", "BM", 1, '16"', [1, 1, 0], 0, 2, 2, "", 18),
    card("Commando COM-2D", "BM", 1, '12"', [2, 2, 0], 0, 2, 2, "SRM 1/1", 17),
    card("Jenner JR7-D (overheat)", "BM", 1, '14"/10"j', [2, 2, 0], 1, 2, 3, "JMPW 1", 26),
    card("Catapult CPLT-A1 (jump equals walk: 8\"j)", "BM", 3, '8"j', [1, 2, 2], 0, 6, 5, "IF 2,LRM 1/2/2", 31),
    card("Eris ERS-2N (jumps farther than it walks, JMPS)", "BM", 2, '10"/14"j', [3, 3, 1], 0, 5, 2, "CASEII,IF 1,JMPS 1", 38),
    card("Crossbow U (torpedoes)", "BM", 3, '10"/10"s', [2, 2, 0], 0, 6, 5, "CASE,OMNI,TOR 2/2/2,UMU", 39),
    card("Naga T (artillery)", "BM", 4, '10"', [2, 2, 0], 0, 5, 4, "ARTAC -2,CASEII,LTAG,OMNI", 53),
    card("Rommel Tank Howitzer (turret codes)", "CV", 3, '6"t', [2, 2, 1], 0, 8, 4, "ARTLTC -1,IF 1,SRCH,TUR (0*/1/1,ARTLTC-1,IF1)", 41),
    card("Kanazuchi (Support) Sqd5 (CAR 5: no Brawler)", "BA", 1, '2"', [2, 2, 0], 0, 3, 2, "CAR 5", 17),
    card("Patron PTN-1 LoaderMech (IndustrialMech round-up)", "IM", 1, '4"', [0, 0, 0], 0, 0, 1, "BAR,BFC,CT 1.5,FC,SRCH", 2),
    card("Hoverbike (24\"w(b), minimal damage)", "SV", 1, '24"w(b)', ["0*", "0*", 0], 0, 0, 1, "AFC,FC", 8),
];

describe("Alpha Strike ground unit Point Value (ASC pp.138-141, errata v1.6)", () => {
    test.each(CARDS.map((unit) => [unit.name, unit] as const))("%s matches the Master Unit List", (_name, unit) => {
        expect(calculateGroundPointValue(toInput(unit)).pointValue).toBe(unit.pv);
    });

    test("Attack Damage Factor is Short + 2 x Medium + Long, with 0* counted as 0.5 (errata example 3/2/0* = 7.5)", () => {
        const result = calculateGroundPointValue({
            type: "CV", size: 1, moves: [{ inches: 0, mode: "t" }], jump: 0,
            short: { damage: 3, minimal: false }, medium: { damage: 2, minimal: false }, long: { damage: 0, minimal: true },
            overheat: 0, armor: 0, structure: 0, specials: [],
        });
        expect(result.offensive).toBe(7.5);
    });

    test("Movement Factor is the highest Move, jump included, divided by 8, + 0.5 for a jumper", () => {
        const walker = calculateGroundPointValue(toInput(card("walker", "BM", 2, '10"', [0, 0, 0], 0, 0, 0, "", 0)));
        const jumper = calculateGroundPointValue(toInput(card("jumper", "BM", 2, '10"/14"j', [0, 0, 0], 0, 0, 0, "", 0)));
        expect(walker.defensive).toBe(10 / 8);
        // 14 / 8 + 0.5; the jump-capable +1 Defense Factor modifier is only for unarmed units, and DIR is 0 here.
        expect(jumper.defensive).toBe(14 / 8 + 0.5);
    });

    test("turret codes stay whole when the specials are split", () => {
        expect(splitSpecialAbilities("ARTLTC -1,IF 1,TUR (0*/1/1,ARTLTC-1,IF1)")).toEqual(["ARTLTC -1", "IF 1", "TUR (0*/1/1,ARTLTC-1,IF1)"]);
    });
});

describe("Point Value callers", () => {
    test("the 'Mech conversion prices a jump-heavy 'Mech on its jump, not its walk", () => {
        const stats = {
            type: "BM", sizeClass: 2, move: 10, jumpMove: 14, ov: 0, armor: 5, structure: 2,
            damage: { short: 3, medium: 3, long: 1, extreme: 0 },
            abilityCodes: ["CASEII", "Indirect Fire", "JMPS 1"], specialUnitAbilities: [],
        } as unknown as IAlphaStrikeExport;
        const zero = () => ({ short: 0, medium: 0, long: 0, extreme: 0 });
        const result = calculateAlphaStrikeValue(stats, zero(), zero(), zero(), zero(), zero(), zero(), zero(), 1);
        // The Eris ERS-2N card: 38 PV.
        expect(result.finalValue).toBe(38);
        expect(result.calcLogs).toContain("14 / 8 + 0.5 (jump)");
    });

    test("the Alpha Strike unit creator recalculates a Master Unit List card to its printed Point Value", () => {
        const record = {
            Name: "Eris ERS-2N", Class: "Eris", Variant: "ERS-2N", BFType: "BM", BFSize: 2, BFMove: '10"/14"j',
            BFArmor: 5, BFStructure: 2, BFDamageShort: 3, BFDamageMedium: 3, BFDamageLong: 1, BFDamageExtreme: 0,
            BFOverheat: 0, BFAbilities: "CASEII,IF 1,JMPS 1", BFPointValue: 38, BFTMM: 2, BFThreshold: 0,
            Type: { Id: 18, Name: "BattleMech", Image: null, SortOrder: 0 },
        } as unknown as IASMULUnit;
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        unit.basePoints = 0;
        const log = unit.calc();
        expect(unit.basePoints).toBe(38);
        expect(log).toContain("14 / 8 + 0.5 (jump)");
    });

    test("card damage codes written with a space (\"IF 0*\", \"TUR (2/2/1\") survive and take weapon hits", () => {
        const unit = new AlphaStrikeUnit();
        unit.importMUL({
            Name: "Rommel Tank", Variant: "Howitzer", BFType: "CV", BFSize: 3, BFMove: '6"t', BFArmor: 8, BFStructure: 4,
            BFDamageShort: 2, BFDamageMedium: 2, BFDamageLong: 1, BFDamageExtreme: 0, BFOverheat: 0,
            BFAbilities: "ARTLTC -1,IF 0*,SRCH,TUR (2/2/1,ARTLTC-1,IF1)", BFPointValue: 41,
            Type: { Id: 19, Name: "Combat Vehicle", Image: null, SortOrder: 0 },
        } as unknown as IASMULUnit);
        unit.calcCurrentValues();
        expect(unit.currentAbilities).toContain("IF 0*");
        expect(unit.currentAbilities).toContain("TUR (2/2/1");
        unit.weaponHits = [true, false, false, false];
        unit.calcCurrentValues();
        // A weapon hit takes 0* to 0, and 2/2/1 to 1/1/0*.
        expect(unit.currentAbilities).toContain("IF 0");
        expect(unit.currentAbilities).toContain("TUR (1/1/0*");
    });

    test("the unit creator leaves an aerospace card's Point Value alone", () => {
        const record = {
            Name: "Sparrowhawk SPR-H5", BFType: "AF", BFSize: 1, BFMove: "9a", BFArmor: 3, BFStructure: 3,
            BFDamageShort: 2, BFDamageMedium: 2, BFDamageLong: 0, BFDamageExtreme: 0, BFOverheat: 0,
            BFAbilities: "", BFPointValue: 21, BFTMM: 0, BFThreshold: 1,
            Type: { Id: 17, Name: "Aerospace Fighter", Image: null, SortOrder: 0 },
        } as unknown as IASMULUnit;
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        unit.calc();
        expect(unit.basePoints).toBe(21);
    });
});
