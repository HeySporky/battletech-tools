import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { findSpecialRuleset } from "../data/special-rulesets";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { getTargetToHitFromWeapon } from "../utils";
import { ITargetToHit } from "./battlemech";

/**
 * Best of Future Wars plan, Chunk C (#172): the fanzine equipment in roster play. The rules themselves are in
 * `src/utils/future-wars-play.ts`; these tests pin what the 'Mech does with them: heat, the booster's track over
 * turns, burns on the 'Mech, ammunition hits, the PDS's built-in bursts and the Long Range Flamer's to-hit.
 */
const build = (jump: number = 0): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-ages");
    mech.setTonnage(65);
    mech.setWalkSpeed(4);
    mech.setJumpSpeed(jump);
    mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL });
    mech.setArmorWeight(10);
    mech.setLeftTorsoArmor(10);
    mech.setLeftTorsoRearArmor(5);
    return mech;
};
const mount = (mech: BattleMech, tag: string) => mech.addEquipmentFromTag(tag, "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true)!;
/** The heat phase, then the next turn (the play page's Apply Heat and Next Turn). */
const endTurn = (mech: BattleMech) => { mech.applyHeat(); mech.turnReset(); };
const inPlay =(mech: BattleMech, tag: string) => mech.equipmentList.find((item) => item.tag === tag)!;
const placeIn = (mech: BattleMech, tag: string, location: string, key: string) => {
    const item = mount(mech, tag);
    const from = mech.unallocatedCriticals.findIndex(critical => critical?.uuid === item.uuid);
    const slot = mech.getCriticals()[key].findIndex(critical => !critical);
    expect(mech.moveCritical("un", from, location, slot)).toBe(true);
    return { item, slot };
};

describe("Best of Future Wars equipment in play", () => {
    it("a boosted weapon adds the chart's heat only on a turn it boosts, and a fresh roll each turn", () => {
        const mech = build();
        mount(mech, "custom-power-booster-medium-laser");
        const laser = inPlay(mech, "custom-power-booster-medium-laser");
        laser.target = "a";
        const plain = mech.getActiveWeaponHeat();
        expect(mech.rollPowerBooster(laser.uuid!, 7)).toBe("boosted");
        expect(mech.getActiveWeaponHeat()).toBe(plain + 1);
        // One use a turn.
        expect(mech.rollPowerBooster(laser.uuid!, 7)).toBeUndefined();
        endTurn(mech);
        expect(mech.getActiveWeaponHeat()).toBe(plain);
    });

    it("the booster's track: second turn running fails on 9; a failed booster cannot be used again", () => {
        const mech = build();
        mount(mech, "custom-power-booster-ppc");
        const ppc = inPlay(mech, "custom-power-booster-ppc");
        expect(mech.rollPowerBooster(ppc.uuid!, 6)).toBe("boosted");
        endTurn(mech);
        expect(mech.getPowerBoosterTurnInARow(ppc.uuid!)).toBe(2);
        expect(mech.rollPowerBooster(ppc.uuid!, 9)).toBe("failed");
        endTurn(mech);
        expect(mech.rollPowerBooster(ppc.uuid!, 12)).toBeUndefined();
        expect(mech.getPowerBoosterStatus(ppc.uuid!)).toBe("failed");
    });

    it("a turn without the booster starts its count again", () => {
        const mech = build();
        mount(mech, "custom-power-booster-ppc");
        const ppc = inPlay(mech, "custom-power-booster-ppc");
        mech.rollPowerBooster(ppc.uuid!, 10);
        endTurn(mech);
        endTurn(mech);
        expect(mech.getPowerBoosterTurnInARow(ppc.uuid!)).toBe(1);
        expect(mech.rollPowerBooster(ppc.uuid!, 6)).toBe("boosted");
    });

    it("a fourth turn burns out the weapon: it makes no heat and the booster is spent", () => {
        const mech = build();
        mount(mech, "custom-power-booster-large-laser");
        const laser = inPlay(mech, "custom-power-booster-large-laser");
        laser.target = "a";
        for (const roll of [12, 12, 12]) {
            expect(mech.rollPowerBooster(laser.uuid!, roll)).toBe("boosted");
            endTurn(mech);
        }
        expect(mech.rollPowerBooster(laser.uuid!, 12)).toBe("system-burned-out");
        expect(mech.isFutureWarsSystemBurnedOut(laser.uuid!)).toBe(true);
        expect(mech.getActiveWeaponHeat()).toBe(0);
    });

    it("a leg booster: running heat is 1 a hex run; a jump-jet booster doubles jumping heat", () => {
        const runner = build();
        mount(runner, "custom-power-booster-running");
        const legs = inPlay(runner, "custom-power-booster-running");
        runner.currentMovementMode = "r";
        expect(runner.getActiveMoveHeat()).toBe(2);
        runner.rollPowerBooster(legs.uuid!, 8);
        runner.futureWarsPlay.boostedRunHexes = 8;
        expect(runner.getActiveMoveHeat()).toBe(8);

        const jumper = build(6);
        mount(jumper, "custom-power-booster-jumping");
        const jets = inPlay(jumper, "custom-power-booster-jumping");
        jumper.currentMovementMode = "j";
        jumper.currentTargetJumpingMP = 9;
        expect(jumper.getActiveMoveHeat()).toBe(9);
        jumper.rollPowerBooster(jets.uuid!, 8);
        expect(jumper.getActiveMoveHeat()).toBe(18);
        expect(jumper.getBoostedJumpMP()).toBe(9);
    });

    it("Long Range Flamer burns on the 'Mech: its heat joins the turn's heat for three turns", () => {
        const mech = build();
        const base = mech.getTurnHeatDifference();
        mech.addLRFlamerHit();
        expect(mech.getFutureWarsIncomingHeat()).toBe(5);
        expect(mech.getTurnHeatDifference()).toBe(base + 5);
        expect(mech.getLRFlamerBurnThisTurn()).toEqual({ damage: 5, heat: 5 });
        endTurn(mech);
        mech.addLRFlamerHit();
        expect(mech.getLRFlamerBurnThisTurn()).toEqual({ damage: 7, heat: 6 });
        endTurn(mech);
        endTurn(mech);
        expect(mech.getLRFlamerBurnThisTurn()).toEqual({ damage: 0, heat: 5 });
        endTurn(mech);
        expect(mech.getFutureWarsIncomingHeat()).toBe(0);
    });

    it("Inferno Gauss hits: 10 heat a turn, each hit 5 more turns", () => {
        const mech = build();
        mech.addInfernoGaussHit();
        mech.addInfernoGaussHit();
        expect(mech.futureWarsPlay.infernoGaussTurns).toBe(10);
        expect(mech.getFutureWarsIncomingHeat()).toBe(10);
        mech.currentHeat = 0;
        endTurn(mech);
        expect(mech.futureWarsPlay.infernoGaussTurns).toBe(9);
        expect(mech.currentHeat).toBeGreaterThanOrEqual(10 - mech.getActiveHeatDissipation());
    });

    it("a critical hit on Inferno Gauss shells is 30 heat and 1 a shell, no damage", () => {
        const mech = build();
        mount(mech, "standard-gauss-rifle");
        const { item, slot } = placeIn(mech, "ammo-is-gauss-rifle-inferno", "lt", "leftTorso");
        item.currentAmmo = 6;
        const structure = mech.getCurrentStructure();
        const log = mech.rollCriticalHit("lt", { chance: 8, lines: [slot < 6 ? 1 : 4, slot % 6 + 1] });
        // The heat waits for the heat phase, with the turn's other heat, and is outside the 15 cap: it is the 'Mech's own.
        expect(mech.currentHeat).toBe(0);
        expect(mech.getFutureWarsIncomingHeat()).toBe(36);
        expect(mech.getCurrentStructure()).toBe(structure);
        expect(log.join(" ")).toContain("36 heat");
        expect(mech.getAmmoBinRemaining(item)).toBe(0);
        const heatPhase = mech.getTurnHeatDifference();
        endTurn(mech);
        expect(mech.currentHeat).toBe(heatPhase);
        expect(mech.getFutureWarsIncomingHeat()).toBe(0);
    });

    it("Inferno Gauss shells: 20 heat with CASE; an empty bin does not ignite", () => {
        const cased = build();
        mount(cased, "standard-gauss-rifle");
        placeIn(cased, "case", "lt", "leftTorso");
        const loaded = placeIn(cased, "ammo-is-gauss-rifle-inferno", "lt", "leftTorso");
        loaded.item.currentAmmo = 3;
        cased.rollCriticalHit("lt", { chance: 8, lines: [loaded.slot < 6 ? 1 : 4, loaded.slot % 6 + 1] });
        expect(cased.getFutureWarsIncomingHeat()).toBe(23);

        const spent = build();
        mount(spent, "standard-gauss-rifle");
        const empty = placeIn(spent, "ammo-is-gauss-rifle-inferno", "lt", "leftTorso");
        empty.item.currentAmmo = 0;
        spent.rollCriticalHit("lt", { chance: 8, lines: [empty.slot < 6 ? 1 : 4, empty.slot % 6 + 1] });
        expect(spent.getFutureWarsIncomingHeat()).toBe(0);
    });

    it("a boosted weapon's to-hit reads the boosted range bands", () => {
        const mech = build();
        mount(mech, "custom-power-booster-medium-laser");
        const index = mech.equipmentList.findIndex((item) => item.tag === "custom-power-booster-medium-laser");
        const laser = mech.equipmentList[index];
        laser.target = "a";
        const target: ITargetToHit = { ...mech.getTarget("a"), active: true, range: 10, movement: 0, otherMods: 0, primary: true } as ITargetToHit;
        // A medium laser's long band ends at 9; the booster adds 2 to each band (p.28).
        expect(getTargetToHitFromWeapon(mech, index, target).finalToHit).toBe(-1);
        mech.rollPowerBooster(laser.uuid!, 8);
        expect(getTargetToHitFromWeapon(mech, index, target).rangeExplanation).toBe("Long");
    });

    it("burned-out leg and jet boosters forbid running and jumping", () => {
        const runner = build(4);
        mount(runner, "custom-power-booster-running");
        mount(runner, "custom-power-booster-jumping");
        const legs = inPlay(runner, "custom-power-booster-running");
        const jets = inPlay(runner, "custom-power-booster-jumping");
        expect(runner.canUseFutureWarsMovementMode("r")).toBe(true);
        expect(runner.canUseFutureWarsMovementMode("j")).toBe(true);
        expect(runner.rollPowerBooster(legs.uuid!, 2)).toBe("system-burned-out");
        expect(runner.rollPowerBooster(jets.uuid!, 2)).toBe("system-burned-out");
        expect(runner.canUseFutureWarsMovementMode("r")).toBe(false);
        expect(runner.canUseFutureWarsMovementMode("j")).toBe(false);
        expect(runner.canUseFutureWarsMovementMode("w")).toBe(true);
    });

    it("a canon 'Mech's play heat is unchanged by the empty fanzine state", () => {
        const mech = build(4);
        mount(mech, "medium-laser");
        mech.equipmentList.forEach((item) => { item.target = "a"; });
        for (const mode of ["n", "w", "r", "j"]) {
            mech.currentMovementMode = mode;
            mech.currentTargetJumpingMP = 4;
            expect(mech.getActiveMoveHeat()).toBe({ n: 0, w: 1, r: 2, j: 4 }[mode]);
        }
        expect(mech.getFutureWarsIncomingHeat()).toBe(0);
        expect(mech.getActiveWeaponHeat()).toBe(3);
    });

    it("a VHE shell bin cooks off at 30 a shell, not the Gauss rifle's 15", () => {
        const mech = build();
        mount(mech, "standard-gauss-rifle");
        const { item, slot } = placeIn(mech, "ammo-is-gauss-rifle-vhe", "lt", "leftTorso");
        item.currentAmmo = 2;
        const log = mech.rollCriticalHit("lt", { chance: 8, lines: [slot < 6 ? 1 : 4, slot % 6 + 1] });
        expect(log).toContain("Gauss Rifle - VHE Shell explodes for 60 damage.");
    });

    it("the PDS spends its 50 built-in bursts, one a salvo", () => {
        const mech = build();
        mount(mech, "custom-eii-pds");
        const pds = inPlay(mech, "custom-eii-pds");
        expect(mech.getPDSIntegralBurstsLeft(pds.uuid!)).toBe(50);
        expect(mech.usePDSBurst(pds.uuid!)).toBe(true);
        expect(mech.getPDSIntegralBurstsLeft(pds.uuid!)).toBe(49);
        mech.futureWarsPlay.pdsBurstsUsed = { [pds.uuid!]: 50 };
        expect(mech.usePDSBurst(pds.uuid!)).toBe(false);
    });

    it("the Long Range Flamer is +2 to hit at medium and +3 at long over the range modifier", () => {
        const mech = build();
        mount(mech, "custom-lr-flamer");
        const index = mech.equipmentList.findIndex((item) => item.tag === "custom-lr-flamer");
        mech.equipmentList[index].target = "a";
        const target = (range: number): ITargetToHit => ({ ...mech.getTarget("a"), active: true, range, movement: 0, otherMods: 0, primary: true } as ITargetToHit);
        const toHit = (range: number) => getTargetToHitFromWeapon(mech, index, target(range)).finalToHit;
        const short = toHit(2);
        expect(toHit(6)).toBe(short + 2 + 2);
        expect(toHit(10)).toBe(short + 4 + 3);
    });

    it("the play state survives a save and load, and clears with the game", () => {
        const mech = build();
        mount(mech, "custom-power-booster-ppc");
        const ppc = inPlay(mech, "custom-power-booster-ppc");
        mech.rollPowerBooster(ppc.uuid!, 7);
        mech.addLRFlamerHit();
        mech.addInfernoGaussHit();
        const copy = new BattleMech();
        copy.importJSON(mech.exportJSON());
        expect(copy.futureWarsPlay).toEqual(mech.futureWarsPlay);
        mech.resetDamage();
        expect(mech.futureWarsPlay).toEqual({});
    });

    it("a booster on an XXL engine: the boosted heat replaces the standard table's, the XXL's extra stays", () => {
        const runner = build();
        runner.setEngineType("xxl");
        expect(runner.isXXLEngine()).toBe(true);
        mount(runner, "custom-power-booster-running");
        runner.currentMovementMode = "r";
        expect(runner.getActiveMoveHeat()).toBe(6);
        runner.rollPowerBooster(inPlay(runner, "custom-power-booster-running").uuid!, 8);
        runner.futureWarsPlay.boostedRunHexes = 8;
        // XXL running 6 = standard 2 + 4 extra; boosted 8 hexes + 4 extra.
        expect(runner.getActiveMoveHeat()).toBe(12);

        const jumper = build(6);
        jumper.setEngineType("xxl");
        mount(jumper, "custom-power-booster-jumping");
        jumper.currentMovementMode = "j";
        jumper.currentTargetJumpingMP = 9;
        expect(jumper.getActiveMoveHeat()).toBe(18);
        jumper.rollPowerBooster(inPlay(jumper, "custom-power-booster-jumping").uuid!, 8);
        // XXL jumping 18 = standard 9 + 9 extra; boosted 18 + 9 extra.
        expect(jumper.getActiveMoveHeat()).toBe(27);
    });

    it("the play run and jump MP: +2 running with the leg booster on, half again jumping with the jets on", () => {
        const mech = build(6);
        mount(mech, "custom-power-booster-running");
        mount(mech, "custom-power-booster-jumping");
        expect(mech.getPlayRunSpeed()).toBe(mech.getRunSpeed());
        expect(mech.getPlayJumpSpeed()).toBe(6);
        mech.rollPowerBooster(inPlay(mech, "custom-power-booster-running").uuid!, 8);
        mech.rollPowerBooster(inPlay(mech, "custom-power-booster-jumping").uuid!, 8);
        expect(mech.getPlayRunSpeed()).toBe(mech.getRunSpeed() + 2);
        expect(mech.getPlayJumpSpeed()).toBe(9);
    });

    it("a leg or jet booster's fourth turn in a row burns out the system", () => {
        for (const [tag, mode] of [["custom-power-booster-running", "r"], ["custom-power-booster-jumping", "j"]]) {
            const mech = build(4);
            mount(mech, tag);
            const booster = inPlay(mech, tag);
            for (let turn = 0; turn < 3; turn++) {
                expect(mech.rollPowerBooster(booster.uuid!, 12)).toBe("boosted");
                endTurn(mech);
            }
            expect(mech.rollPowerBooster(booster.uuid!, 12)).toBe("system-burned-out");
            expect(mech.canUseFutureWarsMovementMode(mode)).toBe(false);
        }
    });

    it("a booster's track survives a save and load mid-game", () => {
        const mech = build();
        mount(mech, "custom-power-booster-ppc");
        const ppc = inPlay(mech, "custom-power-booster-ppc");
        mech.rollPowerBooster(ppc.uuid!, 7);
        endTurn(mech);
        const copy = new BattleMech();
        copy.importJSON(mech.exportJSON());
        expect(copy.getPowerBoosterTurnInARow(ppc.uuid!)).toBe(2);
        expect(copy.rollPowerBooster(ppc.uuid!, 9)).toBe("failed");
    });

    it("heat from fires on the 'Mech is capped at 15 a turn (TW p.159)", () => {
        const mech = build();
        mech.addLRFlamerHit(3);
        mech.addInfernoGaussHit();
        expect(mech.getLRFlamerBurnThisTurn().heat).toBe(7);
        expect(mech.getFutureWarsIncomingHeat()).toBe(15);
    });

    it("the PDS count takes in its extra magazine, spent after the built-in bursts", () => {
        const mech = build();
        mount(mech, "custom-eii-pds");
        mount(mech, "ammo-custom-eii-pds-standard");
        const pds = inPlay(mech, "custom-eii-pds");
        const bin = inPlay(mech, "ammo-custom-eii-pds-standard");
        expect(mech.getAmmoBinRemaining(bin)).toBe(100);
        expect(mech.getPDSBurstsLeft(pds.uuid!)).toBe(150);
        mech.futureWarsPlay.pdsBurstsUsed = { [pds.uuid!]: 50 };
        expect(mech.getPDSBurstsLeft(pds.uuid!)).toBe(100);
        expect(mech.usePDSBurst(pds.uuid!)).toBe(true);
        expect(mech.getAmmoBinRemaining(bin)).toBe(99);
        expect(mech.getPDSBurstsLeft(pds.uuid!)).toBe(99);
        bin.currentAmmo = 0;
        expect(mech.usePDSBurst(pds.uuid!)).toBe(false);
    });

    describe("with Future Wars: equipment as first printed (#172, printing alternates)", () => {
        const first = (jump: number = 0): BattleMech => {
            const mech = build(jump);
            mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL, rulesets: ["fw-equipment-first-printings"] });
            return mech;
        };

        it("is a Custom Homebrew ruleset of its own", () => {
            expect(findSpecialRuleset("fw-equipment-first-printings")).toMatchObject({ category: "play", changes: ["futureWarsEquipment"], minRulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL });
            expect(first().usesFutureWarsEquipmentFirstPrintings()).toBe(true);
            expect(build().usesFutureWarsEquipmentFirstPrintings()).toBe(false);
        });

        it("the PDS makes no heat when fired or in the weapon heat; Battle Value is unchanged", () => {
            const plain = build();
            mount(plain, "custom-eii-pds");
            const mech = first();
            mount(mech, "custom-eii-pds");
            expect(plain.getWeaponHeat()).toBe(1);
            expect(mech.getWeaponHeat()).toBe(0);
            inPlay(mech, "custom-eii-pds").target = "a";
            inPlay(plain, "custom-eii-pds").target = "a";
            expect(plain.getActiveWeaponHeat()).toBe(1);
            expect(mech.getActiveWeaponHeat()).toBe(0);
            const weaponHeat = (unit: BattleMech) => unit.getBattleValueBreakdown().steps.filter((step) => step.id === "bv2.off.heat.weapons").pop()?.value;
            // BV2 counts the PDS as defensive equipment (as AMS), so its heat is in neither printing's weapon heat.
            expect(weaponHeat(mech)).toBe(weaponHeat(plain));
            expect(mech.getBattleValue()).toBe(plain.getBattleValue());
        });

        it("a fourth turn boosting is rolled at 11 or less, not burned out", () => {
            const mech = first();
            mount(mech, "custom-power-booster-ppc");
            const ppc = inPlay(mech, "custom-power-booster-ppc");
            for (let turn = 1; turn <= 3; turn++) {
                expect(mech.rollPowerBooster(ppc.uuid!, 12)).toBe("boosted");
                endTurn(mech);
            }
            expect(mech.rollPowerBooster(ppc.uuid!, 12)).toBe("boosted");
        });

        it("a hit on Inferno Gauss shells is 30 heat and 1 damage a shell", () => {
            const mech = first();
            mount(mech, "standard-gauss-rifle");
            const { item, slot } = placeIn(mech, "ammo-is-gauss-rifle-inferno", "lt", "leftTorso");
            item.currentAmmo = 6;
            const structure = mech.getCurrentStructure();
            const log = mech.rollCriticalHit("lt", { chance: 8, lines: [slot < 6 ? 1 : 4, slot % 6 + 1] });
            expect(mech.getFutureWarsIncomingHeat()).toBe(30);
            expect(mech.getCurrentStructure()).toBe(structure - 6);
            expect(log.join(" ")).toContain("30 heat and 6 damage");
            expect(mech.getAmmoBinRemaining(item)).toBe(0);
        });

        it("a hit on Long Range Flamer fuel is 2 damage and 3 heat a round left", () => {
            const mech = first();
            mount(mech, "custom-lr-flamer");
            const { item, slot } = placeIn(mech, "ammo-custom-lr-flamer-standard", "lt", "leftTorso");
            item.currentAmmo = 5;
            const structure = mech.getCurrentStructure();
            const log = mech.rollCriticalHit("lt", { chance: 8, lines: [slot < 6 ? 1 : 4, slot % 6 + 1] });
            expect(mech.getFutureWarsIncomingHeat()).toBe(15);
            expect(mech.getCurrentStructure()).toBe(structure - 10);
            expect(log.join(" ")).toContain("10 damage and 15 heat");
            expect(mech.getAmmoBinRemaining(item)).toBe(0);
        });
    });
});
