import { describe, expect, it } from "vitest";
import Walker from "./walker";
import { WALKER_ATTACK_DIRECTIONS, WALKER_LOCATIONS, WalkerAttackDirection, WalkerLocation, readWalkerHitCell } from "../data/walker-construction";

// Clell Flint's walkers (#172), Chunk F of docs/superpowers/plans/2026-11-13-future-wars-walkers.md: play mode. The
// play rules are Best-of pp.36-37 and Future Wars #11 pp.25-27, read on the page images; where Flint says "as a
// regular mech", Total Warfare. What the text is silent on is ours, as the ledger lists.

/** A 50-ton walker, biped Walking MP 4 (5 on four legs), standard rules: legs Hip / Upper / Lower / Foot. */
const build = (edition?: "future-wars-11" | "best-of-1991"): Walker => {
    const walker = new Walker();
    walker.setTons(50);
    walker.setWalkMP(4);
    if (edition) walker.setEdition(edition);
    for (const location of WALKER_LOCATIONS) walker.setArmor(location, walker.getMaxArmor(location));
    return walker;
};
const slotOf = (walker: Walker, location: WalkerLocation, name: string, nth: number = 0): number =>
    walker.getSlots(location).map((slot, index) => (slot === name ? index : -1)).filter((index) => index >= 0)[nth];
const hit = (walker: Walker, location: WalkerLocation, name: string, nth: number = 0): string[] =>
    walker.setSlotHit(location, slotOf(walker, location, name, nth), true);
const destroy = (walker: Walker, location: WalkerLocation): void => {
    walker.setArmorDamage(location, walker.getArmor(location));
    walker.setStructureDamage(location, walker.getStructure(location));
};

describe("Walker hit location table (Best-of p.36; #11 p.25)", () => {
    it("reads the printed cells: the plain text for a front attack, the parenthesized one from the rear", () => {
        expect(readWalkerHitCell("Fr/(Rr) Torso", false)).toEqual({ location: "ft", critical: false });
        expect(readWalkerHitCell("Fr/(Rr) Torso", true)).toEqual({ location: "rrt", critical: false });
        expect(readWalkerHitCell("Rr/(Fr) Rt Leg", false).location).toBe("rrl");
        expect(readWalkerHitCell("Rr/(Fr) Rt Leg", true).location).toBe("rfl");
        expect(readWalkerHitCell("Lt Fr/(Rr) Leg", false).location).toBe("lfl");
        expect(readWalkerHitCell("Lt Fr/(Rr) Leg", true).location).toBe("lrl");
        expect(readWalkerHitCell("Rt Torso", true).location).toBe("rt");
        expect(readWalkerHitCell("CS", false)).toEqual({ location: "cs", critical: false });
        expect(readWalkerHitCell("CS Critical", false)).toEqual({ location: "cs", critical: true });
        expect(readWalkerHitCell("Center Torso", false).location).toBe("ct");
    });

    it("picks the column by the hex face the attack comes through", () => {
        const walker = build();
        expect(walker.getHitLocation("f", 3).location).toBe("rrl");
        expect(walker.getHitLocation("r", 3).location).toBe("rfl");
        expect(walker.getHitLocation("rf", 4).location).toBe("rrl");
        expect(walker.getHitLocation("rr", 4).location).toBe("rfl");
        expect(walker.getHitLocation("lf", 6).location).toBe("lt");
        expect(walker.getHitLocation("f", 5).location).toBe("ft");
        expect(walker.getHitLocation("r", 5).location).toBe("rrt");
        expect(walker.getHitLocation("lr", 10).location).toBe("rrt");
        expect(walker.getHitLocation("f", 12)).toMatchObject({ location: "cs", critical: true });
    });

    it.each(WALKER_ATTACK_DIRECTIONS.flatMap((direction) => [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((roll) => [direction.tag, roll] as const)))(
        "gives a walker location for %s on %i", (direction, roll) => {
            expect(WALKER_LOCATIONS).toContain(build().getHitLocation(direction as WalkerAttackDirection, roll).location);
        });

    it("treats a control hit as a center torso hit for infantry and vehicles in the walker's hex", () => {
        const walker = build();
        expect(walker.getHitLocation("f", 9, true).location).toBe("ct");
        expect(walker.getHitLocation("r", 12, true)).toMatchObject({ location: "ct", critical: true });
        expect(walker.getHitLocation("r", 5, true).location).toBe("rrt");
    });
});

describe("Walker damage", () => {
    it("takes armor, then structure, and passes the rest inward: leg to its side torso, torso to the center torso", () => {
        const walker = build();
        const legArmor = walker.getArmor("lfl");
        const legStructure = walker.getStructure("lfl");
        const lines = walker.applyDamage("lfl", legArmor + legStructure + 3);
        expect(walker.isLocationDestroyed("lfl")).toBe(true);
        expect(walker.getArmorLeft("lt")).toBe(walker.getArmor("lt") - 3);
        expect(lines.join(" ")).toMatch(/passes to the Left Torso/);

        walker.applyDamage("rt", walker.getArmor("rt") + walker.getStructure("rt") + 2);
        expect(walker.getArmorLeft("ct")).toBe(walker.getArmor("ct") - 2);
        walker.applyDamage("rrl", walker.getArmor("rrl") + walker.getStructure("rrl") + 1);
        // The right torso is gone: the leg's excess goes on through it to the center torso.
        expect(walker.getArmorLeft("ct")).toBe(walker.getArmor("ct") - 3);
    });

    it("gives the pilot a hit for each hit on the control section, and the turret counts as the control section", () => {
        const walker = build();
        walker.applyDamage("cs", 2);
        walker.applyDamage("cs", 1);
        expect(walker.getPilotHits()).toBe(2);
        walker.applyDamage("cs", walker.getArmor("cs") + walker.getStructure("cs"));
        expect(walker.isLocationDestroyed("cs")).toBe(true);
        expect(walker.isPilotKilled()).toBe(true);
        expect(walker.isDestroyed()).toBe(true);
    });

    it("is destroyed when the center torso's structure is gone; the rest of the damage is lost", () => {
        const walker = build();
        expect(walker.isDestroyed()).toBe(false);
        walker.applyDamage("ct", 999);
        expect(walker.isDestroyed()).toBe(true);
        expect(walker.getDestroyedReason()).toMatch(/center torso/i);
    });
});

describe("Walker legs and movement (Best-of p.37; #11 p.26)", () => {
    it("moves at the biped Walking MP x 1.25 on four legs, running from that base", () => {
        const walker = build();
        expect(walker.getWorkingLegs()).toBe(4);
        expect(walker.getPlayMovement()).toMatchObject({ walk: 5, run: 8, jump: 0 });
    });

    it("takes actuator hits off the current base", () => {
        const walker = build();
        hit(walker, "lfl", "Upper Leg Actuator");
        hit(walker, "rrl", "Foot Actuator");
        expect(walker.getPlayMovement()).toMatchObject({ walk: 3, run: 5 });
    });

    it("moves as a biped with one leg out, and an actuator hit on the lost leg does nothing more", () => {
        const walker = build();
        destroy(walker, "lfl");
        expect(walker.getWorkingLegs()).toBe(3);
        expect(walker.getPlayMovement()).toMatchObject({ walk: 4, run: 6 });
        hit(walker, "lfl", "Lower Leg Actuator");
        expect(walker.getPlayMovement()).toMatchObject({ walk: 4, run: 6 });
        hit(walker, "rfl", "Foot Actuator");
        expect(walker.getPlayMovement()).toMatchObject({ walk: 3, run: 5 });
    });

    it("loses a leg to a hip critical; later hips work as on a 'Mech (half, then none)", () => {
        const walker = build();
        hit(walker, "rrl", "Hip");
        expect(walker.getWorkingLegs()).toBe(3);
        expect(walker.getPlayMovement()).toMatchObject({ walk: 4, run: 6 });
        hit(walker, "lfl", "Hip");
        expect(walker.getPlayMovement()).toMatchObject({ walk: 2, run: 3 });
        hit(walker, "rfl", "Hip");
        expect(walker.getPlayMovement()).toMatchObject({ walk: 0, run: 0 });
    });

    it("crawls with two legs out and cannot move with three", () => {
        const walker = build();
        destroy(walker, "lfl");
        destroy(walker, "rrl");
        expect(walker.getWorkingLegs()).toBe(2);
        expect(walker.getPlayMovement()).toMatchObject({ walk: 1, run: 0, jump: 0 });
        expect(walker.getPlayMovement().text).toMatch(/crawl/i);
        destroy(walker, "rfl");
        expect(walker.getPlayMovement()).toMatchObject({ walk: 0, run: 0, jump: 0 });
    });

    it("loses jump jets with their slots and their legs, and cannot jump while crawling", () => {
        const walker = build();
        expect(walker.setJumpJets(4)).toBe(true);
        expect(walker.getPlayMovement().jump).toBe(4);
        hit(walker, "lfl", "Jump Jet");
        expect(walker.getPlayMovement().jump).toBe(3);
        destroy(walker, "rfl");
        expect(walker.getPlayMovement().jump).toBe(2);
        destroy(walker, "lrl");
        expect(walker.getPlayMovement().jump).toBe(0);
    });

    it("has a piloting bonus with four working legs (-3 on the target number) and loses it with a leg", () => {
        const walker = build();
        expect(walker.getPilotingModifier().total).toBe(-3);
        hit(walker, "lfl", "Upper Leg Actuator");
        expect(walker.getPilotingModifier().total).toBe(-2);
        destroy(walker, "rrl");
        // Moves as a biped: no bonus, and the lost leg adds nothing; the upper leg actuator still +1.
        expect(walker.getPilotingModifier().total).toBe(1);
        destroy(walker, "rfl");
        expect(walker.getPilotingModifier().total).toBe(6);
    });

    it("adds +3 for a gyro hit; a second destroys a standard gyro and immobilizes the walker", () => {
        const walker = build();
        hit(walker, "ct", walker.getGyroName());
        expect(walker.getPilotingModifier().total).toBe(0);
        hit(walker, "ct", walker.getGyroName(), 1);
        expect(walker.isGyroDestroyed()).toBe(true);
        expect(walker.getPlayMovement()).toMatchObject({ walk: 0, run: 0, jump: 0 });
    });

    it("kicks in any direction only with all four legs", () => {
        const walker = build();
        expect(walker.canKick()).toBe(true);
        hit(walker, "lrl", "Hip");
        expect(walker.canKick()).toBe(false);
    });
});

describe("An immobilized walker standing on every leg (#11 p.26 only)", () => {
    it.each([["future-wars-11", true], ["best-of-1991", false]] as const)("under %s: rule shown %s", (edition, shown) => {
        const walker = build(edition);
        expect(walker.getKnockOverRule()).toBeNull();
        hit(walker, "ct", walker.getGyroName());
        hit(walker, "ct", walker.getGyroName(), 1);
        expect(walker.getKnockOverRule() !== null).toBe(shown);
        if (shown) expect(walker.getKnockOverRule()).toMatch(/pushing/);
        // Once a leg's structure is gone, it no longer applies.
        destroy(walker, "lfl");
        expect(walker.getKnockOverRule()).toBeNull();
    });
});

describe("Walker critical hits (TW p.124, as a 'Mech)", () => {
    it("rolls the Determining Critical Hits Table and a line in tables of six", () => {
        const walker = build();
        expect(walker.rollCriticalHit("ct", { chance: 7 })).toEqual(["Critical hit roll 7.", "No critical hit."]);
        const log = walker.rollCriticalHit("ct", { chance: 8, lines: [1, 1] });
        expect(log[1]).toBe("One critical hit.");
        expect(walker.isSlotHit("ct", 0)).toBe(true);
        expect(walker.getEngineHits()).toBe(1);
        expect(walker.rollCriticalHit("lt", { chance: 12, lines: [1, 2, 3] })[1]).toBe("3 critical hits.");
    });

    it("blows a leg or the control section off on 12", () => {
        const walker = build();
        expect(walker.rollCriticalHit("rfl", { chance: 12 }).join(" ")).toMatch(/blown off/);
        expect(walker.isLocationDestroyed("rfl")).toBe(true);
        expect(walker.getWorkingLegs()).toBe(3);
        walker.rollCriticalHit("cs", { chance: 12 });
        expect(walker.isPilotKilled()).toBe(true);
    });

    it("adds +2 against an industrial walker (TW p.124)", () => {
        const walker = build();
        walker.setIndustrial(true);
        expect(walker.getCriticalHitRollModifier()).toBe(2);
        expect(walker.rollCriticalHit("ct", { chance: 6, lines: [1, 1] }).slice(0, 2)).toEqual(["Critical hit roll 6 + 2 = 8.", "One critical hit."]);
        expect(build().getCriticalHitRollModifier()).toBe(0);
    });

    it("makes an industrial walker's End Phase damage check on the Front column", () => {
        const walker = build();
        walker.setIndustrial(true);
        expect(walker.rollIndustrialDamageCheck(0, { location: 7, chance: 5 })).toEqual(["Location roll 7: Front Torso.", "Critical hit roll 5 + 2 = 7.", "No critical hit."]);
        expect(build().rollIndustrialDamageCheck(0, { location: 7, chance: 12 })).toEqual([]);
    });

    it("destroys the walker with a third engine hit and kills the pilot with a cockpit hit", () => {
        const walker = build();
        const engine = walker.getEngineName();
        hit(walker, "ct", engine, 0);
        hit(walker, "ct", engine, 1);
        expect(walker.isDestroyed()).toBe(false);
        expect(hit(walker, "ct", engine, 2).join(" ")).toMatch(/destroyed/);
        expect(walker.isDestroyed()).toBe(true);
        const other = build();
        expect(hit(other, "cs", "Cockpit").join(" ")).toMatch(/killed/);
        expect(other.getDestroyedReason()).toMatch(/pilot/i);
    });

    it("explodes ammunition: shots left x damage to the structure, inward, 2 pilot hits; CASE vents the rest", () => {
        const walker = build();
        expect(walker.addEquipment("autocannon-standard-b", "lt").added).toBe(true);
        expect(walker.addEquipment("ammo-ac-5-standard", "lt").added).toBe(true);
        expect(walker.getAmmoShots(0)).toBe(20);
        walker.setShotsFired(0, 4);
        const lines = hit(walker, "lt", "AC/5 - Standard Ammo");
        expect(lines[0]).toMatch(/80 damage/);
        // 10 to the left torso's structure, the other 70 to the center torso's 8: destroyed.
        expect(walker.isLocationDestroyed("lt")).toBe(true);
        expect(walker.isDestroyed()).toBe(true);
        expect(walker.getPilotHits()).toBe(2);
        expect(walker.getShotsLeft(0)).toBe(0);

        const cased = build();
        const eras = cased.getAvailableEras();
        cased.setEra(eras[eras.length - 1].tag);
        cased.addEquipment("autocannon-standard-b", "lt");
        cased.addEquipment("ammo-ac-5-standard", "lt");
        expect(cased.addEquipment("case", "lt").added).toBe(true);
        expect(hit(cased, "lt", "AC/5 - Standard Ammo").join(" ")).toMatch(/CASE/);
        expect(cased.getStructureLeft("ct")).toBe(cased.getStructure("ct"));
    });
});

describe("Walker weapons in play", () => {
    it("fires each location into its arcs (#11 p.27; Best-of p.36)", () => {
        const walker = build();
        walker.setTurret(true);
        walker.addEquipment("medium-laser", "rfl");
        walker.addEquipment("medium-laser", "cs", true);
        walker.addEquipment("medium-laser", "cs");
        walker.addEquipment("medium-laser", "rrt");
        const arcs = walker.getWeaponPlayLines().map((line) => line.arcs);
        expect(arcs).toEqual([["F", "RS"], ["F", "RS", "R", "LS"], ["F", "R"], ["R"]]);
    });

    it("loses a weapon with its slot and shows the sensor modifier", () => {
        const walker = build();
        walker.addEquipment("medium-laser", "ft");
        hit(walker, "ft", "Medium Laser");
        expect(walker.getWeaponPlayLines()[0]).toMatchObject({ destroyed: true, canFire: false });
        const other = build();
        other.addEquipment("medium-laser", "ft");
        hit(other, "cs", "Sensors");
        expect(other.getWeaponPlayLines()[0].toHit).toBe(2);
        hit(other, "cs", "Sensors", 1);
        expect(other.getWeaponPlayLines()[0].canFire).toBe(false);
    });

    it("prints the edition's base to-hit for a center torso weapon", () => {
        for (const [edition, base] of [["best-of-1991", 8], ["future-wars-11", 0]] as const) {
            const walker = build(edition);
            walker.setEngineType("compact");
            walker.setGyroType("compact");
            expect(walker.addEquipment("machine-gun", "ct").added).toBe(true);
            const line = walker.getWeaponPlayLines()[0];
            expect(line.arcs).toEqual([]);
            expect(line.reasons.join(" ") + line.note).toMatch(new RegExp(`base to-hit ${base}`));
        }
    });
});

describe("Walker pilot, saves and Battle Value", () => {
    it("keeps the in-play state and skills in a save, and leaves them out of a design save", () => {
        const walker = build();
        walker.setGunnery(3);
        walker.setPiloting(4);
        walker.applyDamage("ft", 5);
        hit(walker, "lfl", "Hip");
        const copy = new Walker(walker.exportJSON());
        expect(copy.getGunnery()).toBe(3);
        expect(copy.getPiloting()).toBe(4);
        expect(copy.getArmorLeft("ft")).toBe(walker.getArmor("ft") - 5);
        expect(copy.getWorkingLegs()).toBe(3);
        const design = walker.export(true);
        expect(design.inPlay).toBeUndefined();
        walker.resetInPlay();
        expect(walker.getWorkingLegs()).toBe(4);
        expect(walker.hasInPlayState()).toBe(false);
    });

    it("cleans junk in a saved in-play state", () => {
        const saved = { ...build().export(), inPlay: { armor: { ft: 9999, zz: 3 }, slots: { lfl: [0, 99, "x"] }, pilotHits: 40 } };
        const walker = new Walker(JSON.stringify(saved));
        expect(walker.getArmorLeft("ft")).toBe(0);
        expect(walker.isSlotHit("lfl", 0)).toBe(true);
        expect(walker.getInPlay().slots?.lfl).toEqual([0]);
        expect(walker.getPilotHits()).toBe(6);
    });

    it("gives a skill-adjusted Battle Value by the 'Mech skill table", () => {
        const walker = build();
        expect(walker.getSkillAdjustedBattleValue()).toBe(walker.getBattleValue());
        walker.setGunnery(3);
        walker.setPiloting(4);
        expect(walker.getSkillAdjustedBattleValue()).toBeGreaterThan(walker.getBattleValue());
    });
});
