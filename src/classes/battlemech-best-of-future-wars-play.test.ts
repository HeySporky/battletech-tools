import { describe, expect, it, vi } from "vitest";
import { BattleMech } from "./battlemech";
import { findSpecialRuleset } from "../data/special-rulesets";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { getTargetToHitFromWeapon } from "../utils";
import { blueSaviourFails, getBlueSaviourDamageText, getBlueSaviourFailureTarget, getBlueSaviourReminders, getIncomingEnergyDamage, halveEnergyDamage, isEnergyWeapon } from "../utils/future-wars-play";
import { getEquipmentCatalogs } from "../data/equipment-registry";
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

// Pleiades Mechworks Boosted Autocannon Rounds (#641) in play: the selected bin sets the range bands and adds heat.
describe("Boosted Autocannon Rounds in play", () => {
    const withAC10 = () => {
        const mech = build();
        mount(mech, "autocannon-standard-c");
        const standard = mount(mech, "ammo-ac-10-standard");
        const boosted = mount(mech, "ammo-ac-10-boosted");
        const index = mech.equipmentList.findIndex((item) => item.tag === "autocannon-standard-c");
        const gun = mech.equipmentList[index];
        gun.target = "a";
        return { mech, gun, index, standard, boosted };
    };

    it("adds the boosted round's extra heat only while its bin is the selected one", () => {
        const { mech, gun, standard, boosted } = withAC10();
        mech.selectAmmoBin(gun.uuid!, standard.uuid!);
        const plain = mech.getActiveWeaponHeat();
        mech.selectAmmoBin(gun.uuid!, boosted.uuid!);
        expect(mech.getActiveWeaponHeat()).toBe(plain + 3);
        mech.selectAmmoBin(gun.uuid!, standard.uuid!);
        expect(mech.getActiveWeaponHeat()).toBe(plain);
    });

    it("reads the boosted range bands: 14 hexes is medium with the boosted bin and long beyond it", () => {
        const { mech, gun, index, standard, boosted } = withAC10();
        const target = (range: number): ITargetToHit => ({ ...mech.getTarget("a"), active: true, range, movement: 0, otherMods: 0, primary: true } as ITargetToHit);
        mech.selectAmmoBin(gun.uuid!, standard.uuid!);
        expect(getTargetToHitFromWeapon(mech, index, target(14)).rangeExplanation).not.toBe("Medium");
        mech.selectAmmoBin(gun.uuid!, boosted.uuid!);
        expect(getTargetToHitFromWeapon(mech, index, target(14)).rangeExplanation).toBe("Medium");
        expect(getTargetToHitFromWeapon(mech, index, target(21)).rangeExplanation).toBe("Long");
    });

    it("a 'Mech with only standard ammunition is unchanged", () => {
        const { mech, gun, standard } = withAC10();
        mech.selectAmmoBin(gun.uuid!, standard.uuid!);
        expect(mech.getActiveWeaponHeat()).toBe(gun.heat);
    });
});

// Pleiades Mechworks Blue Saviour Dispersion Field (#641): the pure rules, then the 'Mech's play state.
describe("Blue Saviour rules (future-wars-play.ts)", () => {
    it("halves energy damage rounded down, at least 1", () => {
        expect(halveEnergyDamage(1)).toBe(1);
        expect(halveEnergyDamage(2)).toBe(1);
        expect(halveEnergyDamage(15)).toBe(7);
        expect(halveEnergyDamage(0)).toBe(0);
    });

    it("halves once for each field the shot crosses: Heavy PPC 15 to 7 to 3 with both", () => {
        expect(getIncomingEnergyDamage(15, { blueSaviourActive: true, reflective: true })).toBe(3);
        expect(getIncomingEnergyDamage(15, { blueSaviourActive: true, reflective: false })).toBe(7);
        expect(getIncomingEnergyDamage(15, { blueSaviourActive: false, reflective: true })).toBe(7);
        expect(getIncomingEnergyDamage(15, { blueSaviourActive: false, reflective: false })).toBe(15);
        expect(getIncomingEnergyDamage(1, { blueSaviourActive: true, reflective: true })).toBe(1);
    });

    it("is safe for six active turns, then fails on a 2D6 roll below 2 plus 1 for each turn after the sixth", () => {
        expect(getBlueSaviourFailureTarget(1)).toBeUndefined();
        expect(getBlueSaviourFailureTarget(6)).toBeUndefined();
        expect(getBlueSaviourFailureTarget(7)).toBe(3);
        expect(getBlueSaviourFailureTarget(12)).toBe(8);
        expect(blueSaviourFails(7, 2)).toBe(true);
        expect(blueSaviourFails(7, 3)).toBe(false);
        expect(blueSaviourFails(12, 7)).toBe(true);
        expect(blueSaviourFails(12, 8)).toBe(false);
    });

    it("keeps the missile and ECM reminders only where the E-War rules do not play them, and always the stealth loss and that it cannot hide", () => {
        expect(getBlueSaviourReminders({ hasStealth: false, ewarLive: false })).toEqual(["missiles: treat as AMS", "inside a hostile ECM field, no ECCM", "cannot be hidden"]);
        expect(getBlueSaviourReminders({ hasStealth: false, ewarLive: true })).toEqual(["cannot be hidden"]);
        expect(getBlueSaviourReminders({ hasStealth: true, ewarLive: true })).toEqual(["stealth off", "cannot be hidden"]);
    });

    it("counts catalog energy weapons, not ballistics, missiles or ammunition", () => {
        const catalog = (tag: string) => getEquipmentCatalogs().is.find((item) => item.tag === tag)!;
        expect(isEnergyWeapon(catalog("standard-ppc"))).toBe(true);
        expect(isEnergyWeapon(catalog("er-flamer"))).toBe(true);
        expect(isEnergyWeapon(catalog("plasma-rifle"))).toBe(true);
        expect(isEnergyWeapon(catalog("autocannon-standard-c"))).toBe(false);
    });
});

describe("Blue Saviour in play", () => {
    const placeSpread = (mech: BattleMech, tag: string, location: string, key: string) => {
        const from = mech.unallocatedCriticals.findIndex((critical) => critical?.tag === tag);
        const slot = mech.getCriticals()[key].findIndex((critical) => !critical);
        expect(mech.moveCritical("un", from, location, slot)).toBe(true);
        return slot;
    };
    const crit = (mech: BattleMech, location: string, slot: number) => mech.rollCriticalHit(location, { chance: 8, lines: location === "hd" ? [slot + 1] : [slot < 6 ? 1 : 4, slot % 6 + 1] });
    const saviour = () => {
        const mech = build();
        mount(mech, "custom-blue-saviour");
        return mech;
    };

    it("is switched on and off only on a 'Mech that mounts it", () => {
        const plain = build();
        expect(plain.setBlueSaviour(true)).toBe(false);
        expect(plain.isBlueSaviourOn()).toBe(false);
        const mech = saviour();
        expect(mech.setBlueSaviour(true)).toBe(true);
        expect(mech.isBlueSaviourOn()).toBe(true);
        // Off holds from the next turn: this turn it is still on.
        expect(mech.setBlueSaviour(false)).toBe(true);
        expect(mech.isBlueSaviourOn()).toBe(true);
        endTurn(mech);
        expect(mech.isBlueSaviourOn()).toBe(false);
    });

    it("adds 7 heat in the heat phase of a turn it is on, and nothing when off", () => {
        const mech = saviour();
        expect(mech.getFutureWarsIncomingHeat()).toBe(0);
        mech.setBlueSaviour(true);
        expect(mech.getFutureWarsIncomingHeat()).toBe(7);
        mech.setBlueSaviour(false);
        expect(mech.getFutureWarsIncomingHeat()).toBe(7);
        endTurn(mech);
        expect(mech.getFutureWarsIncomingHeat()).toBe(0);
    });

    it("counts active turns and asks for no roll before the seventh", () => {
        const mech = saviour();
        mech.setBlueSaviour(true);
        for (let turn = 1; turn <= 6; turn++) {
            expect(mech.getBlueSaviourCheckTarget(), `turn ${turn}`).toBeUndefined();
            endTurn(mech);
        }
        expect(mech.getBlueSaviourState().activeTurns).toBe(6);
        expect(mech.getBlueSaviourCheckTarget()).toBe(3);
    });

    it("fails on a roll below the target and stays off for the scenario; a roll equal to the target survives", () => {
        const mech = saviour();
        mech.setBlueSaviour(true);
        for (let turn = 1; turn <= 6; turn++) endTurn(mech);
        expect(mech.rollBlueSaviourCheck(3)).toBe("safe");
        expect(mech.getBlueSaviourCheckTarget()).toBeUndefined();
        expect(mech.isBlueSaviourOn()).toBe(true);
        endTurn(mech);
        expect(mech.getBlueSaviourCheckTarget()).toBe(4);
        expect(mech.rollBlueSaviourCheck(3)).toBe("failed");
        expect(mech.isBlueSaviourOn()).toBe(false);
        expect(mech.setBlueSaviour(true)).toBe(false);
        endTurn(mech);
        expect(mech.isBlueSaviourOn()).toBe(false);
    });

    it("halves an outgoing energy weapon's damage only while on", () => {
        const mech = saviour();
        mount(mech, "standard-ppc");
        const ppc = inPlay(mech, "standard-ppc");
        expect(mech.getBlueSaviourOutgoingDamage(ppc, 10)).toBe(10);
        mech.setBlueSaviour(true);
        expect(mech.getBlueSaviourOutgoingDamage(ppc, 10)).toBe(5);
        expect(mech.getBlueSaviourOutgoingDamage(ppc, 1)).toBe(1);
        mount(mech, "autocannon-standard-c");
        expect(mech.getBlueSaviourOutgoingDamage(inPlay(mech, "autocannon-standard-c"), 10)).toBe(10);
    });

    it("halves incoming energy damage for an active field and Laser Reflective armor, and leaves other damage alone", () => {
        const mech = saviour();
        expect(mech.getIncomingDamageApplied(15, true)).toBe(15);
        mech.setBlueSaviour(true);
        expect(mech.getIncomingDamageApplied(15, true)).toBe(7);
        expect(mech.getIncomingDamageApplied(15, false)).toBe(15);
        mech.setArmorType("laser-reflective");
        expect(mech.getIncomingDamageApplied(15, true)).toBe(3);
        const reflectiveOnly = build();
        reflectiveOnly.setArmorType("laser-reflective");
        expect(reflectiveOnly.getIncomingDamageApplied(15, true)).toBe(7);
    });

    it("a critical hit on a slot while on explodes for 5 in that location, once, and kills it", () => {
        const mech = saviour();
        mech.setBlueSaviour(true);
        const slot = placeSpread(mech, "custom-blue-saviour", "lt", "leftTorso");
        const structure = mech.getCurrentStructure();
        const log = crit(mech, "lt", slot);
        expect(log.join(" ")).toContain("5");
        expect(mech.getCurrentStructure()).toBeLessThan(structure);
        expect(mech.getBlueSaviourState()).toMatchObject({ exploded: true });
        expect(mech.isBlueSaviourOn()).toBe(false);
        const second = placeSpread(mech, "custom-blue-saviour", "rt", "rightTorso");
        const after = mech.getCurrentStructure();
        crit(mech, "rt", second);
        expect(mech.getCurrentStructure()).toBe(after);
    });

    it("explodes in the head too, and CASE contains it in a torso", () => {
        const head = saviour();
        head.setBlueSaviour(true);
        const slot = placeSpread(head, "custom-blue-saviour", "hd", "head");
        const before = head.getCurrentStructure();
        crit(head, "hd", slot);
        expect(head.getCurrentStructure()).toBeLessThan(before);

        const open = saviour();
        open.setBlueSaviour(true);
        const openSlot = placeSpread(open, "custom-blue-saviour", "lt", "leftTorso");
        const openBefore = open.getCurrentStructure();
        crit(open, "lt", openSlot);
        const openLoss = openBefore - open.getCurrentStructure();

        const cased = saviour();
        placeIn(cased, "case", "lt", "leftTorso");
        cased.setBlueSaviour(true);
        const casedSlot = placeSpread(cased, "custom-blue-saviour", "lt", "leftTorso");
        const casedBefore = cased.getCurrentStructure();
        crit(cased, "lt", casedSlot);
        expect(casedBefore - cased.getCurrentStructure()).toBeLessThanOrEqual(openLoss);
    });

    it("no explosion when it is off or has failed", () => {
        const off = saviour();
        const slot = placeSpread(off, "custom-blue-saviour", "lt", "leftTorso");
        const structure = off.getCurrentStructure();
        crit(off, "lt", slot);
        expect(off.getCurrentStructure()).toBe(structure);
        expect(off.getBlueSaviourState().exploded).toBeFalsy();
    });

    it("saves and loads with the force, and clears with the game", () => {
        const mech = saviour();
        mech.setBlueSaviour(true);
        endTurn(mech);
        const copy = new BattleMech();
        copy.importJSON(mech.exportJSON());
        expect(copy.getBlueSaviourState()).toEqual(mech.getBlueSaviourState());
        expect(copy.getBlueSaviourState().activeTurns).toBe(1);
        mech.resetDamage();
        expect(mech.isBlueSaviourOn()).toBe(false);
        expect(mech.getBlueSaviourState().activeTurns).toBe(0);
    });

    it("lists the missile and ECM clauses as reminders only under an edition with no E-War rules", () => {
        const mech = saviour();
        mech.setBlueSaviour(true);
        mech.setRulesEdition("total-warfare");
        expect(mech.getBlueSaviourReminders()).not.toContain("missiles: treat as AMS");
        mech.setRulesEdition("battletech-4th-edition");
        expect(mech.getBlueSaviourReminders()).toContain("missiles: treat as AMS");
    });

    it("a 'Mech without it is unchanged", () => {
        const plain = build();
        expect(plain.getIncomingDamageApplied(15, true)).toBe(15);
        expect(plain.getFutureWarsIncomingHeat()).toBe(0);
        expect(plain.getBlueSaviourReminders()).toEqual([]);
    });
});

// Pleiades Mechworks Pilot Suit and its cockpit (u/PleiadesMechworks, #640).
/** The Pilot Suit is a 3151 prototype: the ilClan era is the first that has it. */
const buildIlClan = (): BattleMech => {
    const mech = build();
    mech.setEra("ilClan");
    return mech;
};

describe("Pilot Suit cockpit in play and construction", () => {
    const suit = (): BattleMech => {
        const mech = buildIlClan();
        mech.setCockpitType("pilot-suit");
        return mech;
    };

    it("is a 5 ton Custom Homebrew cockpit offered where the Interface Cockpit is, and takes its two head slots", () => {
        const mech = buildIlClan();
        const offered = mech.getAvailableCockpits(CUSTOM_HOMEBREW_RULES_LEVEL).find((cockpit) => cockpit.tag === "pilot-suit");
        expect(offered, "offered").toBeTruthy();
        expect(offered!.available).toBe(true);
        expect(mech.setCockpitType("pilot-suit")).toMatchObject({ tag: "pilot-suit", weight: 5, techBase: "is", prototype: 3151, rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL });
        expect(mech.getCockpitWeight()).toBe(5);
        const head = mech.getCriticals().head as Array<{ tag?: string } | null>;
        const interfaceMech = buildIlClan();
        interfaceMech.setCockpitType("interface");
        expect(head.filter(Boolean).length).toBe((interfaceMech.getCriticals().head as unknown[]).filter(Boolean).length);
        expect(head.filter(Boolean).length).toBe(buildIlClan().getCriticals().head.filter(Boolean).length + 1);
        // Not on an IndustrialMech, as the Interface Cockpit is not.
        const industrial = new BattleMech();
        industrial.setTech("is");
        industrial.setEra("ilClan");
        industrial.setInternalStructureType("industrial");
        industrial.applyGameSettings({ ...industrial.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL });
        expect(industrial.getAvailableCockpits(CUSTOM_HOMEBREW_RULES_LEVEL).some((cockpit) => cockpit.tag === "pilot-suit" && cockpit.available)).toBe(false);
    });

    it("may go without a gyro, as the Interface Cockpit may, and a standard cockpit still may not", () => {
        const mech = suit();
        expect(mech.getAvailableGyros(4).find((gyro) => gyro.tag === "none")?.available).toBe(true);
        mech.setGyroType("none");
        expect(mech.getGyroWeight()).toBe(0);
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
        expect(mech.canMountCommandConsole()).toBe(false);
        mech.setCockpitType("standard");
        expect(mech.getChassisEquipmentViolations()).toContain("Only a 'Mech with an interface cockpit may be built without a gyro.");
    });

    it("saves and loads", () => {
        const mech = suit();
        mech.setGyroType("none");
        const copy = new BattleMech();
        copy.importJSON(mech.exportJSON());
        expect([copy.getCockpitType().tag, copy.getGyro().tag]).toEqual(["pilot-suit", "none"]);
        const interfaceMech = buildIlClan();
        interfaceMech.setCockpitType("interface");
        const interfaceCopy = new BattleMech();
        interfaceCopy.importJSON(interfaceMech.exportJSON());
        expect(interfaceCopy.getCockpitType().tag).toBe("interface");
    });

    it("plays one better at Gunnery and Piloting", () => {
        const mech = buildIlClan();
        mech.setPilotGunnery(4);
        mech.setPilotPiloting(5);
        const gunnery = mech.getGATOR().gunnerySkill;
        const piloting = mech.getPilotingSkillModifier();
        mech.setCockpitType("pilot-suit");
        expect(mech.getGATOR().gunnerySkill).toBe(gunnery - 1);
        expect(mech.getPilotingSkillModifier()).toBe(piloting - 1);
    });

    it("counts through the pilot skills for Battle Value: Gunnery 4 / Piloting 5 prices as 3 / 4", () => {
        const standard = buildIlClan();
        standard.setPilotGunnery(3);
        standard.setPilotPiloting(4);
        const mech = suit();
        mech.setPilotGunnery(4);
        mech.setPilotPiloting(5);
        expect(mech.getPilotAdjustedBattleValue()).toBe(standard.getPilotAdjustedBattleValue());
    });

    it("tells the player the suit is a full-head ejection cockpit and, with no gyro, that the 'Mech falls if the MechWarrior is knocked out", () => {
        const mech = suit();
        expect(mech.getPilotSuitLines()).toEqual(["Full-head ejection system built in (no extra weight or cost)."]);
        mech.setGyroType("none");
        expect(mech.getPilotSuitLines()).toContain("No gyro: the 'Mech falls if the MechWarrior is knocked out.");
        expect(buildIlClan().getPilotSuitLines()).toEqual([]);
    });
});

// Final review fixes (astech, 2026-11-20).
describe("Review fixes: Blue Saviour turn counting and the cockpit flags", () => {
    it("counts only turns it was on: switched on in an End Phase, the first active turn is the next one", () => {
        const mech = build();
        mount(mech, "custom-blue-saviour");
        endTurn(mech); // turn 1 ends with it off; the game has started
        mech.setBlueSaviour(true); // turn 2's End Phase: it is on from turn 3
        expect(mech.isBlueSaviourOn()).toBe(false);
        endTurn(mech);
        expect(mech.isBlueSaviourOn()).toBe(true);
        expect(mech.getBlueSaviourState().activeTurns).toBe(0);
        for (let turn = 1; turn <= 5; turn++) endTurn(mech);
        expect(mech.getBlueSaviourState().activeTurns).toBe(5);
        expect(mech.getBlueSaviourCheckTarget()).toBeUndefined();
        endTurn(mech);
        // Turn 9 is its 7th active turn: the first roll, against 3.
        expect(mech.getBlueSaviourState().activeTurns).toBe(6);
        expect(mech.getBlueSaviourCheckTarget()).toBe(3);
    });

    it("counts the turn it was on when switched off in an End Phase, and makes its heat that turn", () => {
        const mech = build();
        mount(mech, "custom-blue-saviour");
        mech.setBlueSaviour(true); // before turn 1: on for turn 1
        expect(mech.isBlueSaviourOn()).toBe(true);
        mech.setBlueSaviour(false); // turn 1's End Phase: off from turn 2
        expect(mech.isBlueSaviourOn()).toBe(true);
        expect(mech.getFutureWarsIncomingHeat()).toBe(7);
        endTurn(mech);
        expect(mech.isBlueSaviourOn()).toBe(false);
        expect(mech.getBlueSaviourState().activeTurns).toBe(1);
    });

    it("an Interface Cockpit does not keep its no-gyro build after the chassis becomes a Tripod", () => {
        const mech = build();
        mech.setEra("ilClan");
        mech.setCockpitType("interface");
        mech.setGyroType("none");
        mech.setType("tripod");
        expect(mech.getCockpitType().tag).toBe("tripod");
        expect(mech.getChassisEquipmentViolations().join(" ")).toContain("Only a 'Mech with an interface cockpit may be built without a gyro.");
    });

    it("a Pilot Suit's skill bonus ends when the structure becomes industrial", () => {
        const mech = buildIlClan();
        mech.setCockpitType("pilot-suit");
        expect(mech.hasPilotSuit()).toBe(true);
        mech.setInternalStructureType("industrial");
        expect(mech.getCockpitType().tag).not.toBe("pilot-suit");
        expect(mech.hasPilotSuit()).toBe(false);
        expect(mech.getPilotSuitLines()).toEqual([]);
    });

    it("chooses the Pilot Suit on a design that has no rules level of its own yet", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setEra("ilClan");
        mech.setTonnage(65);
        mech.setWalkSpeed(4);
        expect(mech.setCockpitType("pilot-suit").tag).toBe("pilot-suit");
    });

    it("shows the Blue Saviour and the Pilot Suit in the fan play panel whatever the rules level", async () => {
        const { showFutureWarsPlay } = await import("../ui/pages/classic-battletech/roster/_futureWarsPlay");
        const saviour = new BattleMech();
        saviour.setTech("is");
        saviour.setEra("ilClan");
        saviour.setTonnage(65);
        saviour.setWalkSpeed(4);
        saviour.addEquipmentFromTag("custom-blue-saviour", "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
        expect(saviour.getRulesLevel(0)).toBeLessThan(CUSTOM_HOMEBREW_RULES_LEVEL);
        expect(showFutureWarsPlay(saviour)).toBe(true);
        const suit = new BattleMech();
        suit.setTech("is");
        suit.setEra("ilClan");
        suit.setTonnage(65);
        suit.setWalkSpeed(4);
        suit.setCockpitType("pilot-suit");
        expect(showFutureWarsPlay(suit)).toBe(true);
    });
});

describe("Boosted Autocannon Rounds on the AC/15 in play", () => {
    it("adds 4 heat and reads the boosted bands (ours, midway of the AC/10 and AC/20 rows)", () => {
        const mech = build();
        mount(mech, "custom-ac-15");
        const standard = mount(mech, "ammo-ac-15-standard");
        const boosted = mount(mech, "ammo-ac-15-boosted");
        const index = mech.equipmentList.findIndex((item) => item.tag === "custom-ac-15");
        const gun = mech.equipmentList[index];
        gun.target = "a";
        const target = (range: number): ITargetToHit => ({ ...mech.getTarget("a"), active: true, range, movement: 0, otherMods: 0, primary: true } as ITargetToHit);
        mech.selectAmmoBin(gun.uuid!, standard.uuid!);
        const plain = mech.getActiveWeaponHeat();
        expect(getTargetToHitFromWeapon(mech, index, target(11)).rangeExplanation).not.toBe("Medium");
        mech.selectAmmoBin(gun.uuid!, boosted.uuid!);
        expect(mech.getActiveWeaponHeat()).toBe(plain + 4);
        expect(getTargetToHitFromWeapon(mech, index, target(11)).rangeExplanation).toBe("Medium");
        expect(getTargetToHitFromWeapon(mech, index, target(16)).rangeExplanation).toBe("Long");
    });
});

// Deferred minors from the Pleiades final review.
describe("Blue Saviour minors", () => {
    const saviour = (): BattleMech => {
        const mech = build();
        mount(mech, "custom-blue-saviour");
        return mech;
    };
    const placeSpread = (mech: BattleMech, tag: string, location: string, key: string) => {
        const from = mech.unallocatedCriticals.findIndex((critical) => critical?.tag === tag);
        const slot = mech.getCriticals()[key].findIndex((critical) => !critical);
        expect(mech.moveCritical("un", from, location, slot)).toBe(true);
        return slot;
    };
    const crit = (mech: BattleMech, location: string, slot: number) => mech.rollCriticalHit(location, { chance: 8, lines: location === "hd" ? [slot + 1] : [slot < 6 ? 1 : 4, slot % 6 + 1] });

    it("writes an outgoing energy hit halved: one number, or short / medium / long, with the note after the per-shot mark", () => {
        const half = (n: number) => halveEnergyDamage(n);
        expect(getBlueSaviourDamageText(10, false, half)).toBe("5 (half of 10, Blue Saviour)");
        expect(getBlueSaviourDamageText(10, true, half)).toBe("5/shot (half of 10, Blue Saviour)");
        expect(getBlueSaviourDamageText({ short: 10, medium: 8, long: 5 }, false, half)).toBe("5/4/2 (half of 10/8/5, Blue Saviour)");
        expect(getBlueSaviourDamageText(1, false, half)).toBe("1 (half of 1, Blue Saviour)");
    });

    it("reads Laser Reflective locations of a Patchwork 'Mech, by where the hit lands", () => {
        const mech = saviour();
        mech.setArmorType("patchwork");
        mech.setPatchworkArmorType("leftTorso", "laser-reflective");
        expect(mech.getIncomingDamageApplied(15, true, "lt")).toBe(7);
        expect(mech.getIncomingDamageApplied(15, true, "ct")).toBe(15);
        expect(mech.getEnergyDamageHalvings("lt")).toBe(1);
        expect(mech.getEnergyDamageHalvings("ct")).toBe(0);
        // The dialog asks before a location is picked: some location is Reflective, so the choice is offered.
        expect(mech.getEnergyDamageHalvings()).toBe(1);
        mech.setBlueSaviour(true);
        expect(mech.getIncomingDamageApplied(15, true, "lt")).toBe(3);
        expect(mech.getIncomingDamageApplied(15, true, "ct")).toBe(7);
    });

    it("rolls for the player a check they skipped when the turn ends, and says so", () => {
        const mech = saviour();
        mech.setBlueSaviour(true);
        for (let turn = 1; turn <= 6; turn++) endTurn(mech);
        expect(mech.getBlueSaviourCheckTarget()).toBe(3);
        const random = vi.spyOn(Math, "random").mockReturnValue(0);
        try {
            endTurn(mech);
        } finally {
            random.mockRestore();
        }
        expect(mech.getBlueSaviourState().failed).toBe(true);
        expect(mech.isBlueSaviourOn()).toBe(false);
        expect(mech.getBlueSaviourAutoRoll()).toEqual({ roll: 2, target: 3, result: "failed" });
    });

    it("rolls no check for the player that they rolled themselves", () => {
        const mech = saviour();
        mech.setBlueSaviour(true);
        for (let turn = 1; turn <= 6; turn++) endTurn(mech);
        expect(mech.rollBlueSaviourCheck(9)).toBe("safe");
        endTurn(mech);
        expect(mech.getBlueSaviourAutoRoll()).toBeUndefined();
        expect(mech.getBlueSaviourState().failed).toBe(false);
    });

    it("does no damage where the edition makes ammunition explosions heat only (Battledroids), but the field is still dead", () => {
        const mech = build();
        mech.setRulesEdition("battledroids");
        mount(mech, "custom-blue-saviour");
        mech.setBlueSaviour(true);
        const slot = placeSpread(mech, "custom-blue-saviour", "lt", "leftTorso");
        const structure = mech.getCurrentStructure();
        crit(mech, "lt", slot);
        expect(mech.getCurrentStructure()).toBe(structure);
        expect(mech.getBlueSaviourState().exploded).toBe(true);
        expect(mech.isBlueSaviourOn()).toBe(false);
    });

    it("CASE keeps the blast in the torso: 5 points through a nearly dead side torso reach the center torso only without CASE", () => {
        const loss = (withCase: boolean): number => {
            const mech = build();
            mount(mech, "custom-blue-saviour");
            if (withCase) placeIn(mech, "case", "lt", "leftTorso");
            mech.setBlueSaviour(true);
            const slot = placeSpread(mech, "custom-blue-saviour", "lt", "leftTorso");
            const damaged = (location: string) => Array.from({ length: 40 }, (_, index) => mech.structureDamaged(location, index)).filter(Boolean).length;
            // Leave the left torso 2 points of structure, so 3 of the 5 would transfer inward.
            mech.takeDamage(mech.getInternalStructure().leftTorso - 2, "lt", false, { structureOnly: true });
            const centerBefore = damaged("ct");
            crit(mech, "lt", slot);
            const centerAfter = damaged("ct");
            return centerAfter - centerBefore;
        };
        expect(loss(false)).toBe(3);
        expect(loss(true)).toBe(0);
    });
});

describe("the power dial in play (#645)", () => {
    const aim = (mech: BattleMech, tag: string, range: number = 4) => {
        const item = inPlay(mech, tag);
        const index = mech.equipmentList.indexOf(item);
        const target: ITargetToHit = { ...mech.getTarget("a"), active: true, range, movement: 0, otherMods: 0, primary: true } as ITargetToHit;
        return { item, index, target };
    };

    it("a dialed Bombast has its setting as heat", () => {
        const mech = build();
        mount(mech, "bombast-laser");
        const bombast = inPlay(mech, "bombast-laser");
        mech.setDialSetting(bombast.uuid!, 9);
        bombast.target = "a";
        expect(mech.getActiveWeaponHeat()).toBe(9);
    });

    it("the to-hit carries the dial, with its explanation", () => {
        const mech = build();
        mount(mech, "bombast-laser");
        const { item, index, target } = aim(mech, "bombast-laser", 5);
        item.target = "";
        mech.setDialSetting(item.uuid!, 7);
        item.target = "a";
        const low = getTargetToHitFromWeapon(mech, index, target).finalToHit;
        item.target = "";
        mech.setDialSetting(item.uuid!, 9);
        item.target = "a";
        const high = getTargetToHitFromWeapon(mech, index, target);
        expect(high.finalToHit - low).toBe(1);
        expect(high.otherModifiersExplanation).toContain("Dial 9 (Bombast)");
    });

    it("the Bombast keeps its printed +3 once, through the dial", () => {
        const mech = build();
        mount(mech, "bombast-laser");
        const { item, index, target } = aim(mech, "bombast-laser", 5);
        item.target = "a";
        const base = getTargetToHitFromWeapon(mech, index, target).finalToHit;
        item.target = "";
        mech.setDialSetting(item.uuid!, 7);
        item.target = "a";
        expect(base - getTargetToHitFromWeapon(mech, index, target).finalToHit).toBe(3);
        expect(mech.getActiveWeaponHeat()).toBe(7);
    });

    it("the dial locks once the weapon is marked fired", () => {
        const mech = build();
        mount(mech, "bombast-laser");
        const bombast = inPlay(mech, "bombast-laser");
        mech.setDialSetting(bombast.uuid!, 9);
        bombast.target = "a";
        mech.setDialSetting(bombast.uuid!, 8);
        expect(mech.getDialSetting(bombast.uuid!)).toBe(9);
        expect(mech.getActiveWeaponHeat()).toBe(9);
    });

    it("an old save fires a Bombast at 12; a new setting survives a round trip", () => {
        const mech = build();
        mount(mech, "bombast-laser");
        const bombast = inPlay(mech, "bombast-laser");
        bombast.target = "a";
        expect(mech.getActiveWeaponHeat()).toBe(12);
        bombast.target = "";
        mech.setDialSetting(bombast.uuid!, 9);
        const copy = build();
        copy.importJSON(mech.exportJSON());
        expect(copy.getDialSetting(inPlay(copy, "bombast-laser").uuid!)).toBe(9);
    });
});

describe("review fixes for the power dial (#645)", () => {
    it("an insulated Bombast still takes 1 off its heat at every setting", () => {
        const mech = build();
        mount(mech, "bombast-laser");
        const bombast = inPlay(mech, "bombast-laser");
        bombast.insulated = true;
        bombast.target = "a";
        expect(mech.getActiveWeaponHeat()).toBe(11);
    });
});
