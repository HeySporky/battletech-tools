import { describe, expect, it } from "vitest";
import AlphaStrikeGroup from "../classes/alpha-strike-group";
import { AlphaStrikeUnit } from "../classes/alpha-strike-unit";
import { formationBonuses } from "./formation-bonuses";

interface IUnitSpec {
    size?: number;
    role?: string;
    type?: string;
    move?: number;
    jump?: number;
    damage?: [number, number, number];
    armor?: number;
    abilities?: string[];
    skill?: number;
    name?: string;
}

const unit = (spec: IUnitSpec = {}): AlphaStrikeUnit => {
    const rv = new AlphaStrikeUnit();
    rv.name = spec.name ?? "Test";
    rv.type = spec.type ?? "BM";
    rv.size = spec.size ?? 2;
    rv.role = spec.role ?? "Brawler";
    rv.armor = spec.armor ?? 5;
    rv.setSkill(spec.skill ?? 4);
    rv.abilities = spec.abilities ?? [];
    rv.isInfantry = rv.type === "BA" || rv.type === "CI";
    rv.move = [{ move: spec.move ?? 8, currentMove: spec.move ?? 8, type: "" }];
    if (spec.jump) rv.move.push({ move: spec.jump, currentMove: spec.jump, type: "j" });
    const [short, medium, long] = spec.damage ?? [2, 2, 1];
    rv.damage = { ...rv.damage, short, medium, long };
    return rv;
};

const group = (...specs: IUnitSpec[]): AlphaStrikeGroup => {
    const rv = new AlphaStrikeGroup();
    rv.members = specs.map(unit);
    return rv;
};

const isValid = (name: string, target: AlphaStrikeGroup, all: AlphaStrikeGroup[] = [target]): boolean =>
    formationBonuses.find((bonus) => bonus.Name === name)!.IsValid(target, all);

describe("Alpha Strike formation requirements", () => {
    it("Striker/Cavalry: every unit needs 10\" of ground Move or 8\"j, not just one of them", () => {
        const strikers = { role: "Striker", size: 2 };
        // One Scout keeps the all-Strikers shortcut out of it.
        const fast = [{ ...strikers, move: 12 }, { ...strikers, move: 10 }, { ...strikers, move: 6, jump: 8 }, { role: "Scout", size: 1, move: 12 }];
        expect(isValid("Striker/Cavalry Lance", group(...fast))).toBe(true);
        expect(isValid("Striker/Cavalry Lance", group(fast[0], fast[1], fast[3], { ...strikers, move: 6 }))).toBe(false);
    });

    it("Fast Assault: needs the Assault Lance's Juggernaut, or two Snipers", () => {
        const heavy = { size: 3, armor: 6, damage: [3, 3, 2] as [number, number, number], move: 10 };
        expect(isValid("Fast Assault Lance", group({ ...heavy, role: "Brawler" }, { ...heavy, role: "Brawler" }, { ...heavy, role: "Brawler" }))).toBe(false);
        expect(isValid("Fast Assault Lance", group({ ...heavy, role: "Juggernaut" }, { ...heavy, role: "Brawler" }, { ...heavy, role: "Brawler" }))).toBe(true);
        expect(isValid("Fast Assault Lance", group({ ...heavy, role: "Sniper" }, { ...heavy, role: "Sniper" }, { ...heavy, role: "Brawler" }))).toBe(true);
    });

    it("Pursuit: one unit must do more than 1 damage at Medium range", () => {
        const scout = { role: "Scout", size: 1, move: 12 };
        expect(isValid("Pursuit Lance", group({ ...scout, damage: [1, 1, 0] }, { ...scout, damage: [1, 1, 0] }, { ...scout, damage: [1, 1, 0] }))).toBe(false);
        expect(isValid("Pursuit Lance", group({ ...scout, damage: [2, 2, 0] }, { ...scout, damage: [1, 1, 0] }, { ...scout, damage: [1, 1, 0] }))).toBe(true);
    });

    it("Anti-Air: reads FLK, AC and ARTX-# as the cards print them, one count a unit", () => {
        const sniper = { role: "Sniper" };
        const boat = { role: "Missile Boat" };
        expect(isValid("Anti-Air Lance", group({ ...sniper, abilities: ["FLK1/1/1"] }, { ...sniper, abilities: ["ARTAIS-1"] }, boat, sniper))).toBe(true);
        // One unit with two of the abilities is still one unit.
        expect(isValid("Anti-Air Lance", group({ ...sniper, abilities: ["FLK1/1/1", "AC2/2/-"] }, sniper, boat, sniper))).toBe(false);
        expect(isValid("Anti-Air Lance", group({ ...sniper, abilities: ["AC2/2/-"] }, { ...sniper, abilities: ["FLK 1/1/-"] }, boat, sniper))).toBe(true);
    });

    it("Rifle: every unit needs a Move of 8\" or more", () => {
        const rifle = { size: 2, role: "Sniper", abilities: ["AC1/1/-"] };
        expect(isValid("Rifle Lance", group({ ...rifle, move: 8 }, { ...rifle, move: 8 }, { ...rifle, move: 10 }))).toBe(true);
        expect(isValid("Rifle Lance", group({ ...rifle, move: 8 }, { ...rifle, move: 8 }, { ...rifle, move: 6 }))).toBe(false);
    });

    it("Strategic Command Star: the fighter may be an aerospace fighter", () => {
        const mech = { size: 3, skill: 3 };
        expect(isValid("Strategic Command Star", group(mech, mech, mech, mech, { type: "AF", skill: 3 }))).toBe(true);
        expect(isValid("Strategic Command Star", group(mech, mech, mech, mech, mech))).toBe(false);
    });

    it("Nova and Mechanized: not offered to an empty group, and checking them leaves the roster order alone", () => {
        const carriers = group({ type: "BM", abilities: ["OMNI"] }, { type: "BM", abilities: ["OMNI"] }, { type: "BM", abilities: ["OMNI"] });
        expect(isValid("Nova", new AlphaStrikeGroup(), [carriers])).toBe(false);

        const infantry = group(
            { type: "BA", name: "A", abilities: ["CAR2", "MEC"] },
            { type: "BA", name: "B", abilities: ["CAR5", "MEC"] },
            { type: "BA", name: "C", abilities: ["CAR3", "MEC"] },
        );
        expect(isValid("Nova", infantry, [infantry, carriers])).toBe(true);
        expect(infantry.members.map((member) => member.name)).toEqual(["A", "B", "C"]);
    });
});
