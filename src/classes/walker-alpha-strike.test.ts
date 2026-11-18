import { describe, expect, it } from "vitest";
import { WALKER_LOCATIONS } from "../data/walker-construction";
import { WALKER_AS_ABILITY_TEXT, getWalkerAntiInfantryFireText, isAlphaStrikeAbilityCode } from "../data/alpha-strike-special-abilities";
import { calculateGroundPointValue } from "../utils/alphaStrikeGroundPointValue";
import { BattleMech } from "./battlemech";
import Walker, { WALKER_AS_ABILITY, WALKER_AS_TYPE, WALKER_INDUSTRIAL_AS_TYPE, formatWalkerASDamage } from "./walker";

// The Alpha Strike ruleset for Clell Flint's walkers (#172) is NGCFells's: docs/superpowers/specs/2026-11-15-walker-alpha-strike.md,
// answered by NGCFells 2026-11-15 (a type of its own; one damage line; AIF by printing; structure scaled to the walker's
// ten locations; the Companion's four-legged rules). NOT OFFICIAL.

/** A walker with `armorPoints` spread over its locations in order, each to its maximum. */
const build = (tons: number, walk: number, armorPoints: number = 0): Walker => {
    const walker = new Walker();
    walker.setTons(tons);
    walker.setWalkMP(walk);
    let left = armorPoints;
    for (const location of WALKER_LOCATIONS) {
        const points = Math.min(left, walker.getMaxArmor(location));
        walker.setArmor(location, points);
        left -= points;
    }
    return walker;
};
const add = (walker: Walker, tag: string, location: Parameters<Walker["addEquipment"]>[1], inTurret: boolean = false): void => {
    const result = walker.addEquipment(tag, location, inTurret);
    if (!result.added) throw new Error(`${tag} in ${location}: ${result.reason}`);
};
/** The spec's worked walker (section 6): 50 tons, biped Walking MP 4, 12 single heat sinks, 152 armor points. */
const worked = (): Walker => {
    const walker = build(50, 4, 152);
    walker.setHeatSinks(12);
    walker.setTurret(true);
    add(walker, "large-laser", "cs", true);
    add(walker, "medium-laser", "ft");
    add(walker, "medium-laser", "ft");
    add(walker, "medium-laser", "rrt");
    add(walker, "machine-gun", "ct");
    add(walker, "machine-gun", "ct");
    add(walker, "ammo-machine-gun-standard", "lt");
    return walker;
};
const damageText = (walker: Walker): string => {
    const values = walker.getAlphaStrikeStats().damageValues;
    return [values.short, values.medium, values.long].map(formatWalkerASDamage).join("/");
};

describe("Walker Alpha Strike conversion (NGCFells's, NOT OFFICIAL)", () => {
    it("converts the spec's worked 50-ton walker (section 6)", () => {
        const walker = worked();
        expect(walker.getArmorPoints()).toBe(152);
        const stats = walker.getAlphaStrikeStats();
        expect(stats.type).toBe("WK");
        expect(stats.size).toBe(2);
        expect(stats.move).toBe('10"');
        expect(stats.tmm).toBe(2);
        expect(stats.armor).toBe(5);
        expect(stats.structure).toBe(4);
        expect(damageText(walker)).toBe("2/2/0");
        expect(stats.overheat).toBe(0);
        expect(stats.specialAbilities.join(",")).toBe("AIF0*,REAR1/1/-,TUR(1/1/-),WLK");
        expect(stats.pointValue).toBe(27);
    });

    it("has a type of its own: WK, and IWK for an industrial walker (NGCFells, 2026-11-15)", () => {
        expect(WALKER_AS_TYPE).toBe("WK");
        expect(WALKER_INDUSTRIAL_AS_TYPE).toBe("IWK");
        expect(WALKER_AS_ABILITY).toBe("WLK");
        const walker = build(50, 4, 100);
        expect(walker.getAlphaStrikeStats().type).toBe("WK");
        walker.setIndustrial(true);
        expect(walker.getAlphaStrikeStats().type).toBe("IWK");
    });

    it.each([[35, 1], [40, 2], [55, 2], [60, 3], [75, 3], [80, 4], [100, 4]])("Size by tonnage, the 'Mech rows: %i tons is Size %i (ASC p.92)", (tons, size) => {
        expect(build(tons, 2).getAlphaStrikeStats().size).toBe(size);
    });

    it("Move is 2 inches a Walking MP on four legs, with the jump beside it when it differs (ASC pp.92-93)", () => {
        const walker = build(50, 4);
        expect(walker.getWalkerWalkMP()).toBe(5);
        expect(walker.getAlphaStrikeStats().move).toBe('10"');
        walker.setJumpJets(4);
        const stats = walker.getAlphaStrikeStats();
        expect(stats.move).toBe('10"/8"j');
        expect(stats.tmm).toBe(2);
        expect(stats.specialAbilities).toContain("JMPW1");
    });

    it("MASC multiplies the four-legged Walking MP by 1.25, rounded normally, before the x 2 (ASC p.93)", () => {
        const walker = build(50, 4);
        add(walker, "masc", "lt");
        // 5 x 1.25 = 6.25, rounded to 6: 12".
        expect(walker.getAlphaStrikeStats().move).toBe('12"');
    });

    it.each([
        // tons, engine, structure: the ASC p.98 value x the walker's structure points / a biped's, rounded
        [10, "standard", 1], [50, "standard", 4], [55, "standard", 5], [60, "standard", 6], [100, "standard", 9],
        [70, "xl", 4], [90, "compact", 12], [100, "xxl", 4],
    ])("structure is the 'Mech table scaled to the walker's ten locations: %i tons, %s engine, %i (NGCFells, 2026-11-15)", (tons, engine, structure) => {
        const walker = build(tons, 2);
        expect(walker.setEngineType(engine)).toBe(true);
        expect(walker.getAlphaStrikeStats().structure).toBe(structure);
    });

    it("counts front, side, leg, control section and turret weapons on the damage line; the rear torso is REAR only", () => {
        const walker = build(60, 3);
        walker.setHeatSinks(20);
        add(walker, "medium-laser", "lt");
        add(walker, "medium-laser", "rt");
        add(walker, "medium-laser", "lfl");
        add(walker, "medium-laser", "cs");
        expect(damageText(walker)).toBe("2/2/0");
        expect(walker.getAlphaStrikeStats().specialAbilities.some((code) => code.startsWith("REAR"))).toBe(false);
        add(walker, "large-laser", "rrt");
        expect(damageText(walker)).toBe("2/2/0");
        expect(walker.getAlphaStrikeStats().specialAbilities).toContain("REAR1/1/-");
    });

    it("rear-torso and center-torso weapons add no heat (ASC p.116; ours for the center torso)", () => {
        const walker = build(60, 3);
        // 10 sinks; 2 Large Lasers forward: 2 + 16 - 4 = 14 against 10, so damage 2 x 10 / 14 = 1.43, up to 2, Overheat 0.
        add(walker, "large-laser", "lt");
        add(walker, "large-laser", "rt");
        const before = walker.getAlphaStrikeStats();
        add(walker, "large-laser", "rrt");
        add(walker, "small-laser", "ct");
        const after = walker.getAlphaStrikeStats();
        expect(after.overheat).toBe(before.overheat);
        expect(after.damageValues).toEqual(before.damageValues);
    });

    it("heat-modified damage and Overheat follow the Companion (ASC pp.115-116), worked by hand", () => {
        // 4 Large Lasers, 10 sinks: 2 + 32 - 4 = 30. 3.2 x 10 / 30 = 1.07, up to 1.1, up to 2; before the heat 4: Overheat 2.
        const lasers = build(75, 3);
        for (const location of ["lt", "rt", "lt", "rt"] as const) add(lasers, "large-laser", location);
        expect(damageText(lasers)).toBe("2/2/0");
        expect(lasers.getAlphaStrikeStats().overheat).toBe(2);

        // 2 PPCs and 4 Medium Lasers, 10 sinks: 2 + 32 - 4 = 30. Short 3.5 -> 1.2 -> 2; Medium 4 -> 1.4 -> 2 (Overheat
        // 4 - 2 = 2). Long range leaves the Medium Lasers out: 2 + 20 - 4 = 18, 2 x 10 / 18 = 1.2 -> 2, as before: no OVL.
        const mixed = build(75, 3);
        for (const location of ["lt", "rt"] as const) add(mixed, "standard-ppc", location);
        for (const location of ["lt", "rt", "ft", "ft"] as const) add(mixed, "medium-laser", location);
        const stats = mixed.getAlphaStrikeStats();
        expect(damageText(mixed)).toBe("2/2/2");
        expect(stats.overheat).toBe(2);
        expect(stats.specialAbilities).not.toContain("OVL");
    });

    const heatLine = (walker: Walker): string => walker.getAlphaStrikeStats().calcLog.find((line) => line.startsWith("Heat:")) ?? "";

    it("an XXL engine gives 6 movement heat without jump jets (errata v1.3; it was doubled to 4)", () => {
        const walker = build(100, 2);
        expect(walker.setEngineType("xxl")).toBe(true);
        expect(heatLine(walker)).toMatch(/^Heat: 6 for movement/);
    });

    it("every AMS adds 1 heat, an Inner Sphere Laser AMS 7 (errata v1.3)", () => {
        const walker = build(75, 3);
        add(walker, "is-ams", "lt");
        expect(heatLine(walker)).toContain("+ 1 for AMS");
        add(walker, "is-laser-ams", "rt");
        expect(heatLine(walker)).toContain("+ 8 for AMS");
    });

    it("the rear torso's heat counts instead of the forward weapons' when it is greater (errata v1.3)", () => {
        const walker = build(75, 3);
        add(walker, "medium-laser", "lt");
        expect(damageText(walker)).toBe("1/1/0");
        // 2 + 16 rear heat - 4 = 14 against 10: 0.5 x 10 / 14 = 0.36 -> 0.4: 0*. Overheat 1 - 0 = 1.
        add(walker, "large-laser", "rrt");
        add(walker, "large-laser", "rrt");
        expect(damageText(walker)).toBe("0*/0*/0");
        expect(walker.getAlphaStrikeStats().overheat).toBe(1);
        expect(heatLine(walker)).toContain("rear (hotter than the forward)");
    });

    it("with OVL the Long damage uses the full heat output, not the Long output (errata v1.3), worked by hand", () => {
        // 4 PPCs (0.75/1/1) and 4 Medium Lasers (0.5/0.5/0), 10 sinks: 2 + 52 - 4 = 50. Long output 2 + 40 - 4 = 38:
        // 4 x 10 / 38 = 1.05 -> 1.1 -> 2, 2 under 4: OVL. Long 4 x 10 / 50 = 0.8 -> 1. Short 5 -> 1, Medium 6 -> 1.2 -> 2,
        // Overheat 6 - 2 = 4.
        const walker = build(100, 2);
        for (const location of ["lt", "rt", "lt", "rt"] as const) add(walker, "standard-ppc", location);
        for (const location of ["ft", "ft", "ft", "ft"] as const) add(walker, "medium-laser", location);
        const stats = walker.getAlphaStrikeStats();
        expect(damageText(walker)).toBe("1/2/1");
        expect(stats.overheat).toBe(4);
        expect(stats.specialAbilities).toContain("OVL");
    });

    it("a walker gets the same card as a biped 'Mech with the same weapons and heat sinks, cool or hot (spec section 2)", () => {
        // Both use the shared heat routine (src/utils/alphaStrikeHeat.ts) since the 'Mech's heat step was fixed (#636).
        const loadouts: string[][] = [
            ["large-laser", "medium-laser"],
            ["medium-laser", "medium-laser", "medium-laser"],
            ["medium-laser", "medium-laser", "medium-laser", "medium-laser"],
            ["large-laser", "large-laser", "large-laser", "large-laser"],
            ["standard-ppc", "standard-ppc", "medium-laser", "medium-laser", "medium-laser", "medium-laser"],
            ["small-laser"],
        ];
        for (const loadout of loadouts) {
            const mech = new BattleMech();
            mech.setTonnage(75);
            const walker = build(75, 3);
            const places = ["lt", "rt", "ft", "lt", "rt", "ft"] as const;
            loadout.forEach((tag, index) => {
                mech.addEquipmentFromTag(tag, "is", index % 2 ? "rt" : "lt", false, undefined, "", false, [], undefined, undefined);
                add(walker, tag, places[index]);
            });
            walker.setHeatSinks(mech.getHeatSinks());
            const biped = mech.getAlphaStrikeForceStats();
            const stats = walker.getAlphaStrikeStats();
            const text = `${loadout.join(", ")}`;
            expect([stats.damageValues.short, stats.damageValues.medium, stats.damageValues.long].map(formatWalkerASDamage), text)
                .toEqual([biped.damage.shortMinimal ? "0*" : `${+biped.damage.short}`, biped.damage.mediumMinimal ? "0*" : `${+biped.damage.medium}`,
                    biped.damage.longMinimal ? "0*" : `${+biped.damage.long}`]);
            expect(stats.overheat, text).toBe(biped.overheat);
        }
    });

    it("a weapon whose ammunition is not carried counts nothing", () => {
        const walker = build(60, 3);
        add(walker, "autocannon-standard-b", "lt");
        expect(damageText(walker)).toBe("0/0/0");
        add(walker, "ammo-ac-5-standard", "lt");
        expect(damageText(walker)).not.toBe("0/0/0");
    });

    it("AIF# is the center-torso weapons' Short values, rounded normally; under 0.5 is AIF0*; none without one", () => {
        const none = build(50, 4);
        add(none, "small-laser", "ft");
        expect(none.getAlphaStrikeStats().specialAbilities.some((code) => code.startsWith("AIF"))).toBe(false);

        const two = build(50, 4);
        add(two, "small-laser", "ct");
        add(two, "small-laser", "ct");
        // 2 x 0.3 = 0.6, rounded to 1; off the damage line.
        expect(two.getAlphaStrikeStats().specialAbilities).toContain("AIF1");
        expect(damageText(two)).toBe("0/0/0");

        const one = build(50, 4);
        add(one, "small-laser", "ct");
        expect(one.getAlphaStrikeStats().specialAbilities).toContain("AIF0*");
    });

    it("the AIF target number follows the printing the walker is built under: 6 (Best-of) or -2 (#11)", () => {
        const walker = build(50, 4);
        expect(walker.getAlphaStrikeAntiInfantryTargetNumber()).toBe(6);
        expect(getWalkerAntiInfantryFireText(walker.getEditionRules()).join(" ")).toMatch(/target number is 6\b/);
        walker.setEdition("future-wars-11");
        expect(walker.getAlphaStrikeAntiInfantryTargetNumber()).toBe(-2);
        expect(getWalkerAntiInfantryFireText(walker.getEditionRules()).join(" ")).toMatch(/target number is -2\b/);
    });

    it("an industrial walker is IWK with BFC, or AFC with Advanced Fire Control; EE with an ICE, FC with a fuel cell", () => {
        const walker = build(50, 3, 100);
        walker.setIndustrial(true);
        expect(walker.getAlphaStrikeStats().specialAbilities).toContain("BFC");
        walker.setAdvancedFireControl(true);
        const advanced = walker.getAlphaStrikeStats().specialAbilities;
        expect(advanced).not.toContain("BFC");
        expect(advanced).toContain("AFC");
        expect(walker.setEngineType("ice")).toBe(true);
        expect(walker.getAlphaStrikeStats().specialAbilities).toContain("EE");
        expect(walker.setEngineType("cell")).toBe(true);
        expect(walker.getAlphaStrikeStats().specialAbilities).toContain("FC");
    });

    it("ENE without an explosive item; none with ammunition aboard", () => {
        const walker = build(50, 4);
        add(walker, "medium-laser", "ft");
        expect(walker.getAlphaStrikeStats().specialAbilities).toContain("ENE");
        expect(worked().getAlphaStrikeStats().specialAbilities).not.toContain("ENE");
    });

    it("has no MEL, and every walker has WLK", () => {
        const stats = worked().getAlphaStrikeStats();
        expect(stats.specialAbilities).toContain("WLK");
        expect(stats.specialAbilities).not.toContain("MEL");
    });
});

describe("Walker Alpha Strike card", () => {
    it("builds a custom card: NOT OFFICIAL, type WK, the stats of the conversion", () => {
        const walker = worked();
        walker.setName("Strider");
        const stats = walker.getAlphaStrikeStats();
        const unit = walker.getAlphaStrikeUnit();
        expect(unit.type).toBe("WK");
        expect(unit.name).toContain("Strider");
        expect(unit.mulSource).toBe("custom");
        expect(unit.armor).toBe(stats.armor);
        expect(unit.structure).toBe(stats.structure);
        expect(unit.currentPoints).toBe(stats.pointValue);
        expect(unit.abilities.join(",")).toContain("WLK");
    });

    it("recalculating the card's Point Value gives the conversion's (WK is priced on the 'Mech lines)", () => {
        const walker = worked();
        const unit = walker.getAlphaStrikeUnit();
        unit.calc();
        expect(unit.currentPoints).toBe(walker.getAlphaStrikeStats().pointValue);
    });
});

describe("Walker types in the Point Value procedure", () => {
    const input = {
        size: 2, moves: [{ inches: 10, mode: "" }], jump: 0,
        short: { damage: 2, minimal: false }, medium: { damage: 2, minimal: false }, long: { damage: 0, minimal: false },
        overheat: 0, armor: 5, structure: 4, specials: [] as string[],
    };

    it("WK is priced as BM", () => {
        expect(calculateGroundPointValue({ ...input, type: "WK" }).pointValue).toBe(calculateGroundPointValue({ ...input, type: "BM" }).pointValue);
    });

    it("IWK is priced as IM: structure halved, the fire control multiplier", () => {
        for (const specials of [[], ["BFC"], ["AFC"]]) {
            expect(calculateGroundPointValue({ ...input, specials, type: "IWK" }).pointValue)
                .toBe(calculateGroundPointValue({ ...input, specials, type: "IM" }).pointValue);
        }
        expect(calculateGroundPointValue({ ...input, type: "IWK" }).pointValue).toBeLessThan(calculateGroundPointValue({ ...input, type: "WK" }).pointValue);
    });
});

describe("WLK and AIF# in the special abilities reference", () => {
    it("lists both as Custom Homebrew codes", () => {
        expect(isAlphaStrikeAbilityCode("WLK")).toBe(true);
        expect(isAlphaStrikeAbilityCode("AIF1")).toBe(true);
        expect(isAlphaStrikeAbilityCode("AIF0*")).toBe(true);
    });

    it("WLK spells out the four-legged rules of the Companion, not Flint's Piloting bonus (NGCFells, 2026-11-15)", () => {
        const text = WALKER_AS_ABILITY_TEXT.join(" ");
        expect(text).toMatch(/-2/);
        expect(text).toMatch(/Control Roll/);
        expect(text).toMatch(/NOT OFFICIAL|not an official/i);
    });
});
