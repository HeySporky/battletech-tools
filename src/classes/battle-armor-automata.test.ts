import { describe, expect, it } from "vitest";
import BattleArmor, { AUTOMATA_DISRUPTION_EFFECTS } from "./battle-armor";
import { EXPERIMENTAL_RULES_LEVEL } from "../data/rules-level-options";

// Automata: BattleTech Adventures: Ghosts of Obeedah pp.51-53.

const automata = (): BattleArmor => {
    const suit = new BattleArmor();
    suit.setWeightClass("medium");
    suit.setAutomata(true, EXPERIMENTAL_RULES_LEVEL);
    return suit;
};

/** Dice that come up in the order given. */
const dice = (...rolls: number[]) => () => rolls.shift() ?? 1;

describe("Automata construction (Ghosts of Obeedah p.51)", () => {
    it("are offered only at the Experimental rules level, and make the design Experimental", () => {
        const suit = new BattleArmor();
        expect(suit.setAutomata(true, EXPERIMENTAL_RULES_LEVEL - 1)).toBe(false);
        expect(suit.isAutomata()).toBe(false);
        expect(suit.getRequiredRulesLevel()).toBeLessThan(EXPERIMENTAL_RULES_LEVEL);
        expect(suit.setAutomata(true, EXPERIMENTAL_RULES_LEVEL)).toBe(true);
        expect(suit.getRequiredRulesLevel()).toBe(EXPERIMENTAL_RULES_LEVEL);
        // Turning it off is never refused.
        expect(suit.setAutomata(false, 0)).toBe(true);
        expect(suit.isAutomata()).toBe(false);
    });

    it("use the Clan chassis weight whatever the technology base: an Inner Sphere Medium chassis is 250 kg, not 175", () => {
        const suit = new BattleArmor();
        suit.setWeightClass("medium");
        expect(suit.getChassisWeight()).toBe(175);
        suit.setAutomata(true, EXPERIMENTAL_RULES_LEVEL);
        expect(suit.getChassisWeight()).toBe(250);
        expect(suit.getWeightLog()[0].label).toBe("Chassis (Medium, Clan, with the Automata Core)");
        expect(suit.getBaseName()).toBe("Medium Automata");
    });

    it("may not take the Inner Sphere chassis weight of a Clan exoskeleton", () => {
        const suit = new BattleArmor();
        suit.setTechBase("clan");
        suit.setWeightClass("pa-l");
        suit.setExoskeletonChassis(true);
        expect(suit.getChassisWeight()).toBe(80);
        suit.setAutomata(true, EXPERIMENTAL_RULES_LEVEL);
        expect(suit.canUseExoskeletonChassis()).toBe(false);
        expect(suit.getChassisWeight()).toBe(130);
    });

    it("are not available before ca. 3090", () => {
        const suit = automata();
        expect(suit.getEraIssues().some((issue) => issue.startsWith("The Automata Core"))).toBe(false);
        suit.setEra("civil-war");
        expect(suit.getEraIssues().some((issue) => issue.startsWith("The Automata Core"))).toBe(true);
    });

    it("have Anti-Personnel capability with basic manipulators as well as armored gloves", () => {
        const suit = new BattleArmor();
        suit.setManipulator("la", "basic");
        const note = (s: BattleArmor) => s.getNotes().some((line) => line.includes("Anti-Personnel capability"));
        expect(note(suit)).toBe(false);
        suit.setAutomata(true, EXPERIMENTAL_RULES_LEVEL);
        expect(note(suit)).toBe(true);
        suit.setManipulator("la", "none");
        expect(note(suit)).toBe(false);
    });
});

describe("Automata in play (Ghosts of Obeedah pp.52-53)", () => {
    it("take Gunnery 4 and Anti-'Mech 5 from the Core, which cannot be changed", () => {
        const suit = new BattleArmor();
        suit.setGunnery(2);
        suit.setAntiMechSkill(3);
        suit.setAutomata(true, EXPERIMENTAL_RULES_LEVEL);
        expect([suit.getGunnery(), suit.getAntiMechSkill()]).toEqual([4, 5]);
        suit.setGunnery(2);
        suit.setAntiMechSkill(3);
        expect([suit.getGunnery(), suit.getAntiMechSkill()]).toEqual([4, 5]);
        suit.setAutomata(false, EXPERIMENTAL_RULES_LEVEL);
        suit.setGunnery(2);
        expect(suit.getGunnery()).toBe(2);
    });

    it("roll on the Automata Disruption Effects Table", () => {
        const suit = automata();
        expect(AUTOMATA_DISRUPTION_EFFECTS.map((row) => [row.from, row.to])).toEqual([[2, 7], [8, 9], [10, 10], [11, 11], [12, 12]]);
        expect(suit.rollAutomataDisruption(dice(3, 4))).toContain("roll 7: No Effect");
        expect(suit.rollAutomataDisruption(dice(4, 4))).toContain("roll 8: Berserker!");
        expect(suit.rollAutomataDisruption(dice(5, 5))).toContain("roll 10: Roll for Reboot");
        expect(suit.rollAutomataDisruption(dice(5, 6))).toContain("roll 11: Forced Withdrawal");
        expect(suit.rollAutomataDisruption(dice(6, 6))).toContain("roll 12: System Crash!");
    });

    it("self-destruct unless the roll is 10 or more, with +2 when shut down", () => {
        const suit = automata();
        expect(suit.rollAutomataSelfDestruct(false, dice(4, 4))).toContain("= 8: the Automata self-destructs");
        expect(suit.rollAutomataSelfDestruct(true, dice(4, 4))).toContain("8 + 2 (shut down) = 10: the self-destruct fails to engage");
    });

    it("survive a save and load, and older saves load as battle armor", () => {
        const suit = automata();
        const loaded = new BattleArmor(suit.exportJSON());
        expect(loaded.isAutomata()).toBe(true);
        expect(loaded.getChassisWeight()).toBe(250);
        expect(loaded.getImportIssues()).toEqual([]);

        const saved = JSON.parse(suit.exportJSON());
        saved.gunnery = 1;
        expect(new BattleArmor(JSON.stringify(saved)).getGunnery()).toBe(4);
        delete saved.automata;
        expect(new BattleArmor(JSON.stringify(saved)).isAutomata()).toBe(false);
        expect(new BattleArmor(JSON.stringify(saved)).getGunnery()).toBe(1);
    });
});

// The five published Automata, from their record sheets (Ghosts of Obeedah pp.73-77). The first, filled circle of
// each trooper's armor track is the Core (p.51), not armor.
describe("The Automata of Obeedah (Ghosts of Obeedah pp.51, 73-77)", () => {
    type Placement = [tag: string, location: "la" | "ra" | "body", shots?: number];
    const build = (weightClass: string, groundMP: number, armor: string, points: number, items: Placement[],
        options: { manipulator?: string; jumpMP?: number; quad?: boolean; mixed?: boolean; cargoHalfTons?: number } = {}): BattleArmor => {
        const suit = new BattleArmor();
        suit.setTechBase("is");
        if (options.mixed) suit.setMixedTech(true);
        suit.setEra("dark-ages");
        suit.setWeightClass(weightClass);
        if (options.quad) suit.setBodyType("quad");
        expect(suit.setAutomata(true, EXPERIMENTAL_RULES_LEVEL)).toBe(true);
        suit.setGroundMP(groundMP);
        if (options.jumpMP) suit.setMotive("jump", options.jumpMP);
        for (const arm of ["la", "ra"] as const) {
            if (options.manipulator) suit.setManipulator(arm, options.manipulator);
            if (options.cargoHalfTons) suit.setCargoHalfTons(arm, options.cargoHalfTons);
        }
        expect(suit.setArmor(armor)).toBe(true);
        suit.setArmorPoints(points);
        for (const [tag, location, shots] of items) {
            expect(suit.addItem(tag, location)).toBe(true);
            if (shots) suit.updateItem(suit.getItems().length - 1, { shots });
        }
        suit.setSquadSize(6);
        expect(suit.getIssues()).toEqual([]);
        return suit;
    };

    it("Scout Automata: Medium, mimetic armor, two machine guns and a heat sensor, BV 369", () => {
        const suit = build("medium", 3, "ba-mimetic", 6, [["is-machine-gun", "la"], ["is-machine-gun", "ra"], ["is-heat-sensor", "body"]],
            { manipulator: "basic", jumpMP: 3 });
        expect(suit.getBattleValue()).toBe(369);
    });

    it("Patrol Automata: a Light quad in basic stealth armor with a heavy machine gun, BV 270", () => {
        expect(build("light", 5, "ba-stealth-basic", 6, [["is-heavy-machine-gun", "body"]], { quad: true }).getBattleValue()).toBe(270);
    });

    it("Battle Automata: Heavy, Mixed, with a Clan Advanced SRM 5 and Micro Pulse Laser, BV 825", () => {
        const suit = build("heavy", 2, "ba-standard-advanced", 12, [["clan-advanced-srm-5", "body", 3], ["clan-micro-pulse-laser", "ra"]],
            { manipulator: "battle-claw", mixed: true });
        expect(suit.getBattleValue()).toBe(825);
    });

    it("Labor Automata: both Assault versions are BV 109 and weigh 1,560 kg", () => {
        const repair = build("assault", 2, "ba-standard", 4, [["is-cutting-torch", "la"], ["is-cutting-torch", "ra"], ["is-searchlight", "body"],
            ["is-searchlight", "body"], ["is-heat-sensor", "body"], ["is-mission-equipment", "body"]], { manipulator: "salvage-arm" });
        // "Mission Equipment Storage (400 kg)" on the sheet.
        repair.updateItem(repair.getItems().length - 1, { kg: 400 });
        expect(repair.getBattleValue()).toBe(109);
        // "Cargo Lifter: 4t" on each arm.
        const lifter = build("assault", 2, "ba-standard", 4, [["is-cutting-torch", "la"], ["is-cutting-torch", "ra"], ["is-searchlight", "body"],
            ["is-searchlight", "body"]], { manipulator: "cargo-lifter", cargoHalfTons: 8 });
        expect(lifter.getBattleValue()).toBe(109);
        // The book says both "run 500kg underweight" (p.51); built from the sheets they are 440 kg under the 2,000 kg
        // of the Assault class. Not an obvious misprint, so the construction rules' weight stands (flagged).
        expect(repair.getWeight()).toBe(1560);
        expect(lifter.getWeight()).toBe(1560);
    });
});
