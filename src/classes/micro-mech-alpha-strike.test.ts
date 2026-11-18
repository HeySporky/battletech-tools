import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MicroMechLayout } from "../data/micro-mech-construction";
import { findMicroMechItem, getMicroMechItemAlphaStrike, microMechItems } from "../data/micro-mech-equipment-custom";
import MicroMech, { MICRO_MECH_AS_ABILITY, formatMicroMechASDamage } from "./micro-mech";

// The Alpha Strike ruleset for Micro-Mechs is NGCFells's (docs/superpowers/specs/2026-11-14-micro-mech-alpha-strike.md,
// approved by NGCFells 2026-11-14). The four samples of "Micro-Mechs" 6.1.0.2 are pinned to that spec's section 6.
const build = (name: string, tons: number, layout: MicroMechLayout, walk: number, jets: number, armor: Record<string, number>): MicroMech => {
    const micro = new MicroMech();
    micro.setName(name);
    micro.setLayout(layout);
    micro.setTons(tons);
    micro.setWalkMP(walk);
    micro.setJumpJets(jets);
    for (const [location, points] of Object.entries(armor)) micro.setArmor(location as never, points);
    return micro;
};
const storm = (): MicroMech => {
    const micro = build("Storm STM-3X", 11, "biped", 6, 6, { head: 4, torso: 16, torsoRear: 6, la: 4, ra: 4, ll: 6, rl: 6 });
    micro.addMount("micro-er-laser-small", "ra");
    micro.addMount("micro-machine-gun", "la");
    micro.setAmmo(1, 500, "torso");
    return micro;
};
const tunnelRat = (): MicroMech => {
    const micro = build("Tunnel Rat TNR-1X", 13, "biped", 4, 4, { head: 4, torso: 18, torsoRear: 6, la: 4, ra: 4, ll: 6, rl: 6 });
    micro.setLowerArm("left", false);
    micro.addMount("micro-er-laser-medium", "ra");
    micro.addMount("micro-grenade-launcher", "head");
    micro.setAmmo(1, 500, "torso");
    micro.addMount("micro-beagle-active-probe", "torso");
    micro.addMount("micro-recoilless-rifle-heavy", "la");
    micro.setAmmo(3, 500, "la");
    return micro;
};
const hillman = (): MicroMech => {
    const micro = build("Hillman HMN-2X", 15, "quad", 5, 0, { head: 4, torso: 18, torsoRear: 8, fll: 4, frl: 4, ll: 8, rl: 8 });
    micro.addMount("micro-pulse-laser-small", "head");
    micro.addMount("micro-lrm-9", "torso");
    micro.setAmmo(1, 750, "torso");
    return micro;
};
const slayer = (): MicroMech => {
    const micro = build("Slayer SL-X4", 18, "quad", 5, 5, { head: 4, torso: 20, torsoRear: 4, fll: 8, frl: 8, ll: 8, rl: 8 });
    micro.addMount("micro-laser-large", "torso");
    micro.addMount("micro-laser-small", "head");
    return micro;
};
const damageText = (micro: MicroMech): string => {
    const values = micro.getAlphaStrikeStats().damageValues;
    return [values.short, values.medium, values.long].map(formatMicroMechASDamage).join("/");
};
const item = (tag: string) => findMicroMechItem(tag)!;

describe("Micro-Mech Alpha Strike conversion (NGCFells's, NOT OFFICIAL)", () => {
    it.each([
        // name, builder, move, TMM, armor, damage, specials, Point Value
        ["Storm STM-3X", storm, '12"j', 2, 2, "1/0*/0", "MCR", 11],
        ["Tunnel Rat TNR-1X", tunnelRat, '8"j', 1, 2, "1/1/0", "MCR,PRB,RCN", 14],
        ["Hillman HMN-2X", hillman, '10"', 2, 2, "1/1/1", "IF1,MCR", 14],
        ["Slayer SL-X4", slayer, '10"j', 2, 2, "2/1/0", "ENE,MCR", 13],
    ])("converts the %s as the ruleset's sample table has it", (_name, make, move, tmm, armor, damage, specials, pointValue) => {
        const stats = make().getAlphaStrikeStats();
        expect(stats.type).toBe("MM");
        expect(stats.size).toBe(1);
        expect(stats.move).toBe(move);
        expect(stats.tmm).toBe(tmm);
        expect(stats.armor).toBe(armor);
        expect(stats.structure).toBe(1);
        expect(damageText(make())).toBe(damage);
        expect(stats.specialAbilities.join(",")).toBe(specials);
        expect(stats.pointValue).toBe(pointValue);
    });

    it.each([[storm], [tunnelRat], [hillman], [slayer]])("TRO - JBT prints the sample's figures as the app builds them (%#)", (make) => {
        const micro = make();
        const stats = micro.getAlphaStrikeStats();
        const rows = readFileSync("docs/lore/micro-mechs-tro.md", "utf8").split("\n").filter((line) => line.startsWith(`| ${micro.getName()}`));
        expect(rows).toHaveLength(2);
        expect(rows[0]).toContain(`| ${micro.getTons()} | ${micro.getWalkMP()} / ${micro.getJumpMP()} | ${micro.getArmorPoints()} |`);
        expect(rows[0]).toContain(`| ${micro.getCBillCost().toLocaleString("en-US")} | ${micro.getBattleValue("master-rules-revised")} |`);
        expect(rows[1]).toContain(`| MM | 1 | ${stats.move} | ${stats.armor} / ${stats.structure} | ${damageText(micro)} | ${stats.specialAbilities.join(", ")} | ${stats.pointValue} |`);
    });

    it("always carries the MCR ability and Structure 1, whatever the tonnage", () => {
        for (const tons of [10, 15, 19]) {
            const stats = build("", tons, "biped", 3, 0, {}).getAlphaStrikeStats();
            expect(stats.specialAbilities).toContain(MICRO_MECH_AS_ABILITY);
            expect(stats.structure).toBe(1);
            expect(stats.armor).toBe(0);
        }
    });

    it("prints both rates when the jump differs from the walk, with JMPW for a lower modifier", () => {
        const stats = build("", 10, "biped", 7, 2, {}).getAlphaStrikeStats();
        expect(stats.move).toBe('14"/4"j');
        expect(stats.tmm).toBe(3);
        expect(stats.specialAbilities).toContain("JMPW3");
    });

    it("reads a book weapon's value from the catalog", () => {
        expect(getMicroMechItemAlphaStrike(item("micro-laser-large")).damage).toEqual([0.8, 0.8, 0]);
        expect(getMicroMechItemAlphaStrike(item("micro-laser-large")).source).toBe("catalog");
        expect(getMicroMechItemAlphaStrike(item("micro-lrm-10")).damage).toEqual([0.3, 0.6, 0.6]);
        expect(getMicroMechItemAlphaStrike(item("micro-lrm-10"), true).damage).toEqual([0.4, 0.8, 0.8]);
    });

    it("gives an odd tube count the family's value a hit times the Cluster Hits Table", () => {
        // LRM 9: 5 hits at a roll of 7; an LRM hit is 0.1, half at Short.
        const lrm9 = getMicroMechItemAlphaStrike(item("micro-lrm-9"));
        expect(lrm9.source).toBe("cluster");
        expect(lrm9.damage.map((value) => +value.toFixed(3))).toEqual([0.25, 0.5, 0.5]);
        // SRM 3: 2 hits x 0.2. Streak SRM 3: every tube.
        expect(getMicroMechItemAlphaStrike(item("micro-srm-3")).damage.map((value) => +value.toFixed(3))).toEqual([0.4, 0.4, 0]);
        expect(getMicroMechItemAlphaStrike(item("micro-streak-srm-3")).damage.map((value) => +value.toFixed(3))).toEqual([0.6, 0.6, 0]);
        // With Artemis IV: the table at 9 (7 hits for 9 tubes).
        expect(getMicroMechItemAlphaStrike(item("micro-lrm-9"), true).damage.map((value) => +value.toFixed(3))).toEqual([0.35, 0.7, 0.7]);
    });

    it("converts a weapon no book converts by its damage and printed range", () => {
        const rifle = getMicroMechItemAlphaStrike(item("micro-recoilless-rifle-heavy"));
        expect(rifle.source).toBe("ours");
        expect(rifle.damage).toEqual([0.3, 0.3, 0]);
        expect(getMicroMechItemAlphaStrike(item("micro-grenade-launcher")).damage).toEqual([0.1, 0, 0]);
        // A minimum range halves Short; a long range of 6 reaches Medium.
        expect(getMicroMechItemAlphaStrike(item("micro-mortar-heavy")).damage).toEqual([0.15, 0.3, 0]);
    });

    it("gives every weapon row a value", () => {
        for (const row of microMechItems.filter((each) => each.kind !== "equipment" && !/narc/.test(each.tag))) {
            const value = getMicroMechItemAlphaStrike(row);
            expect(value.source, row.tag).not.toBe("none");
            expect(value.damage[0], row.tag).toBeGreaterThan(0);
        }
    });

    it("multiplies a weapon with fewer than 10 shots by 0.75, and counts none with no ammunition", () => {
        const micro = build("", 19, "biped", 2, 0, {});
        micro.addMount("micro-autocannon-5", "torso");
        expect(damageText(micro)).toBe("0/0/0");
        micro.setAmmo(0, 250);
        // 250 kg of AC/5 ammunition is 5 shots: 0.375 / 0.5 / 0.5 x 0.75.
        expect(micro.getAmmoLots()[0].shots).toBeLessThan(10);
        expect(damageText(micro)).toBe("0*/0*/0*");
        micro.setAmmo(0, 1000);
        expect(damageText(micro)).toBe("0*/1/1");
    });

    it("gives ENE to a design with no ammunition, and CASE for torso CASE", () => {
        expect(slayer().getAlphaStrikeStats().specialAbilities).toContain("ENE");
        const micro = storm();
        expect(micro.getAlphaStrikeStats().specialAbilities).not.toContain("ENE");
        expect(micro.getAlphaStrikeStats().specialAbilities).not.toContain("CASE");
        const cased = build("", 19, "biped", 2, 0, {});
        cased.addMount("micro-machine-gun", "la");
        cased.setAmmo(0, 500, "torso");
        cased.addMount("micro-case", "torso");
        expect(cased.getAlphaStrikeStats().specialAbilities).toContain("CASE");
        // CASE with no ammunition aboard prints nothing.
        const energy = build("", 19, "biped", 2, 0, {});
        energy.addMount("micro-laser-small", "la");
        energy.addMount("micro-case", "torso");
        expect(energy.getAlphaStrikeStats().specialAbilities).not.toContain("CASE");
    });

    it("turns equipment into its abilities, and sealing into SEAL", () => {
        const micro = build("", 19, "biped", 2, 0, {});
        micro.addMount("micro-guardian-ecm-suite", "torso");
        micro.addMount("micro-target-acquisition-gear-tag", "la");
        micro.addMount("micro-c3-slave", "torso");
        micro.setSealed(true);
        const specials = micro.getAlphaStrikeStats().specialAbilities;
        for (const code of ["ECM", "TAG", "C3S", "SEAL", "MCR"]) expect(specials, code).toContain(code);
    });

    it("builds a card that is not official, of type MM, with no Overheat", () => {
        const unit = storm().getAlphaStrikeUnit();
        expect(unit.type).toBe("MM");
        expect(unit.isOfficial()).toBe(false);
        expect(unit.mulSource).toBe("custom");
        expect(unit.name).toContain("Storm");
        expect(unit.overheat).toBe(0);
        expect(unit.basePoints).toBe(11);
        expect(unit.armor).toBe(2);
        expect(unit.structure).toBe(1);
        expect(unit.damage.mediumMinimal).toBe(true);
        // The card's own recalculation agrees with the conversion.
        unit.calc();
        expect(unit.basePoints).toBe(11);
    });

    it("is the same under the 2019 version", () => {
        const micro = storm();
        micro.setVersion("solarmech-2019");
        expect(micro.getAlphaStrikeStats().move).toBe('12"j');
        expect(micro.getAlphaStrikeStats().specialAbilities).toContain("MCR");
    });
});
