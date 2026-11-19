import { describe, expect, it } from "vitest";
import { MicroMechVersion } from "../data/micro-mech-construction";
import { getBattleValueSkillEdition, getSkillMultiplier } from "../data/battle-value";
import MicroMech from "./micro-mech";
import { buildMicroMech as build } from "../test-support/builders";

// Chunk F (#173): play mode. Rules from the "Micro-Mech Rules" section of "Micro-Mechs" 6.1.0.2 (raw text lines
// 37-182) and of Solarmech's 2019 post; where they say "as for Battlemechs", Total Warfare (2022 printing).

/** The Storm STM-3X as the document prints it: ER Small Laser (RA), Machine Gun (LA), 500 kg of its ammunition in the torso. */
const storm = (version: MicroMechVersion = "6.1.0.2"): MicroMech => {
    const micro = build(11, "biped", 6, 6);
    micro.setName("Storm STM-3X");
    for (const [location, points] of [["head", 4], ["torso", 16], ["torsoRear", 6], ["la", 4], ["ra", 4], ["ll", 6], ["rl", 6]] as const) micro.setArmor(location, points);
    expect(micro.addMount("micro-er-laser-small", "ra")).toBe(true);
    expect(micro.addMount("micro-machine-gun", "la")).toBe(true);
    expect(micro.setAmmo(1, 500, "torso")).toBe(true);
    micro.setVersion(version);
    return micro;
};

/** The Hillman HMN-2X: a 15-ton quad, Walk 5. */
const hillman = (): MicroMech => {
    const micro = build(15, "quad", 5, 0);
    for (const [location, points] of [["head", 4], ["torso", 18], ["torsoRear", 8], ["fll", 4], ["frl", 4], ["ll", 8], ["rl", 8]] as const) micro.setArmor(location, points);
    micro.addMount("micro-pulse-laser-small", "head");
    micro.addMount("micro-lrm-9", "torso");
    micro.setAmmo(1, 750, "torso");
    return micro;
};

const slotOf = (micro: MicroMech, location: Parameters<MicroMech["getPlaySlots"]>[0], name: string, nth = 0): number => {
    const index = micro.getPlaySlots(location).map((slot, i) => (slot === name ? i : -1)).filter((i) => i >= 0)[nth];
    expect(index, `${name} in ${location}`).toBeGreaterThanOrEqual(0);
    return index;
};

describe("Micro-Mech play: the slots", () => {
    it("places the jump jets in the free leg slots first, then the torso (NGCFells's), filling the Storm's 25 of 26", () => {
        const micro = storm();
        expect(micro.getPlaySlots("ll")).toEqual(["Upper Leg Actuator Group", "Lower Leg Actuator Group", "Jump Jet"]);
        expect(micro.getPlaySlots("rl")).toEqual(["Upper Leg Actuator Group", "Lower Leg Actuator Group", "Jump Jet"]);
        expect(micro.getPlaySlots("torso")).toEqual([
            "Life Support", "Cockpit", "Engine", "Engine", "Engine", "Gyro", "Gyro", "Ammo (Machine Gun)",
            "Jump Jet", "Jump Jet", "Jump Jet", "Jump Jet",
        ]);
        expect(micro.getPlaySlots("head")).toEqual(["Sensors", null]);
    });
});

describe("Micro-Mech play: damage", () => {
    it("moves damage from a limb or the head to the torso", () => {
        const micro = storm();
        micro.applyDamage("ra", 10);
        expect(micro.getArmorLeft("ra")).toBe(0);
        expect(micro.getStructureLeft("ra")).toBe(0);
        expect(micro.isLocationDestroyed("ra")).toBe(true);
        expect(micro.getArmorLeft("torso")).toBe(12);
        micro.applyDamage("head", 8);
        expect(micro.getStructureLeft("head")).toBe(0);
        expect(micro.getArmorLeft("torso")).toBe(10);
        // A destroyed location passes every further point on.
        micro.applyDamage("ra", 3);
        expect(micro.getArmorLeft("torso")).toBe(7);
    });

    it("puts rear hits on the rear torso armor, then the torso structure", () => {
        const micro = storm();
        micro.applyDamage("torso", 8, true);
        expect(micro.getArmorLeft("torsoRear")).toBe(0);
        expect(micro.getArmorLeft("torso")).toBe(16);
        expect(micro.getStructureLeft("torso")).toBe(9);
        micro.applyDamage("torsoRear", 1);
        expect(micro.getStructureLeft("torso")).toBe(8);
    });

    it("gives the pilot no hit from head or ordinary torso damage", () => {
        const micro = storm();
        micro.applyDamage("head", 5);
        micro.applyDamage("torso", 20);
        expect(micro.getPilotHits()).toBe(0);
        expect(micro.getCockpitArmorLeft()).toBe(3);
    });

    it("6.1.0.2: half of what goes past the torso structure (rounded down, ours) hits the 3-point cockpit, a pilot hit a point", () => {
        const micro = storm("6.1.0.2");
        const lines = micro.applyDamage("torso", 16 + 11 + 5);
        expect(micro.getStructureLeft("torso")).toBe(0);
        expect(micro.getCockpitArmorLeft()).toBe(1);
        expect(micro.getPilotHits()).toBe(2);
        expect(lines.join(" ")).toMatch(/cockpit/i);
        expect(micro.isDestroyed()).toBe(true);
    });

    it("2019: all of what goes past the torso structure hits the cockpit; three points kill the pilot", () => {
        const micro = storm("solarmech-2019");
        micro.applyDamage("torso", 16 + 11 + 5);
        expect(micro.getCockpitArmorLeft()).toBe(0);
        expect(micro.isPilotKilled()).toBe(true);
        expect(micro.getPilotHits()).toBe(6);
    });

    it("lets the boxes be marked by hand and reset", () => {
        const micro = storm();
        micro.setArmorDamage("la", 3);
        micro.setStructureDamage("la", 1);
        micro.setCockpitDamage(1);
        expect(micro.getArmorLeft("la")).toBe(1);
        expect(micro.getStructureLeft("la")).toBe(1);
        expect(micro.getCockpitArmorLeft()).toBe(2);
        micro.setArmorDamage("la", 99);
        expect(micro.getArmorLeft("la")).toBe(0);
        micro.resetInPlay();
        expect(micro.getArmorLeft("la")).toBe(4);
        expect(micro.getCockpitArmorLeft()).toBe(3);
        expect(micro.getInPlay()).toEqual({});
    });
});

describe("Micro-Mech play: critical hits", () => {
    it("rolls 1D6 over the head's two slots (1-3, 4-6) and a limb's three (1-2, 3-4, 5-6)", () => {
        const micro = storm();
        expect([1, 2, 3, 4, 5, 6].map((roll) => micro.getCriticalSlotForRoll("head", roll))).toEqual([0, 0, 0, 1, 1, 1]);
        expect([1, 2, 3, 4, 5, 6].map((roll) => micro.getCriticalSlotForRoll("la", roll))).toEqual([0, 0, 1, 1, 2, 2]);
    });

    it("rolls the torso as a BattleMech's: 1D6 for the column (1-3, 4-6), then 1D6 for the slot", () => {
        const micro = storm();
        expect(micro.getCriticalSlotForRoll("torso", 2, 5)).toBe(4);
        expect(micro.getCriticalSlotForRoll("torso", 5, 1)).toBe(6);
        expect(micro.getCriticalSlotForRoll("torso", 6, 6)).toBe(11);
    });

    it("rolls on the Determining Critical Hits Table: 8-9 one hit, rolling again on an empty slot", () => {
        const micro = storm();
        expect(micro.rollCriticalHit("head", { chance: 7 })).toEqual(["Critical hit roll 7: no critical hit."]);
        const lines = micro.rollCriticalHit("head", { chance: 8, lines: [5, 2] });
        expect(micro.isSlotHit("head", 0)).toBe(true);
        expect(lines.join(" ")).toMatch(/Sensors/);
    });

    it("blows a limb off on a 12", () => {
        const micro = storm();
        const lines = micro.rollCriticalHit("la", { chance: 12 });
        expect(lines.join(" ")).toMatch(/blown off/);
        expect(micro.isLocationDestroyed("la")).toBe(true);
        expect(micro.getWeaponPlayLines().find((line) => line.name === "Machine Gun")?.destroyed).toBe(true);
    });

    it("stops energy weapons after the first engine hit and destroys the unit on the second (no Stackpole)", () => {
        const micro = storm();
        expect(micro.canFireEnergyWeapons()).toBe(true);
        micro.setSlotHit("torso", slotOf(micro, "torso", "Engine"), true);
        expect(micro.getEngineHits()).toBe(1);
        expect(micro.canFireEnergyWeapons()).toBe(false);
        const laser = micro.getWeaponPlayLines().find((line) => line.name === "ER Laser, Small");
        expect(laser?.canFire).toBe(false);
        expect(micro.getWeaponPlayLines().find((line) => line.name === "Machine Gun")?.canFire).toBe(true);
        expect(micro.isDestroyed()).toBe(false);
        micro.setSlotHit("torso", slotOf(micro, "torso", "Engine", 1), true);
        expect(micro.isDestroyed()).toBe(true);
        expect(micro.getPlayMovement().walk).toBe(0);
    });

    it("kills the pilot on a cockpit hit", () => {
        const micro = storm();
        micro.setSlotHit("torso", slotOf(micro, "torso", "Cockpit"), true);
        expect(micro.isPilotKilled()).toBe(true);
        expect(micro.isDestroyed()).toBe(true);
    });

    it("explodes the ammunition: its shots left times damage to the structure, 3 pilot hits, and on into the cockpit with no CASE", () => {
        const micro = storm();
        micro.setShotsFired(0, 90);
        const lines = micro.setSlotHit("torso", slotOf(micro, "torso", "Ammo (Machine Gun)"), true);
        // 10 shots x 2 = 20 to the torso structure (11): 9 past it, half (4) to the cockpit, plus the 3 hits.
        expect(lines.join(" ")).toMatch(/explo/i);
        expect(micro.getArmorLeft("torso")).toBe(16);
        expect(micro.getStructureLeft("torso")).toBe(0);
        expect(micro.getCockpitArmorLeft()).toBe(0);
        expect(micro.getPilotHits()).toBe(6);
        expect(micro.getShotsLeft(0)).toBe(0);
    });

    it("spares the cockpit when the torso has CASE: the pilot takes only the 3 feedback hits", () => {
        const micro = build(16, "biped", 4, 0);
        micro.addMount("micro-machine-gun", "torso");
        micro.setAmmo(0, 250, "torso");
        micro.addMount("micro-case", "torso");
        micro.setSlotHit("torso", slotOf(micro, "torso", "Ammo (Machine Gun)"), true);
        expect(micro.getStructureLeft("torso")).toBe(0);
        expect(micro.getCockpitArmorLeft()).toBe(3);
        expect(micro.getPilotHits()).toBe(3);
        expect(micro.isPilotKilled()).toBe(false);
    });

    it("keeps a limb explosion with CASE in the limb (TW: excess dissipates)", () => {
        const micro = build(16, "biped", 4, 0);
        micro.setLowerArm("left", false);
        micro.addMount("micro-machine-gun", "torso");
        expect(micro.setAmmo(0, 250, "la")).toBe(true);
        expect(micro.addMount("micro-case", "la")).toBe(true);
        micro.setArmor("torso", 10);
        micro.setSlotHit("la", slotOf(micro, "la", "Ammo (Machine Gun)"), true);
        expect(micro.isLocationDestroyed("la")).toBe(true);
        expect(micro.getStructureLeft("torso")).toBe(14);
        expect(micro.getArmorLeft("torso")).toBe(10);
    });

    it("cuts Jump MP by one for each jump jet hit", () => {
        const micro = storm();
        expect(micro.getPlayMovement().jump).toBe(6);
        micro.setSlotHit("ll", 2, true);
        micro.setSlotHit("torso", slotOf(micro, "torso", "Jump Jet"), true);
        expect(micro.getPlayMovement().jump).toBe(4);
        micro.setSlotHit("ll", 2, false);
        expect(micro.getPlayMovement().jump).toBe(5);
    });

    it("puts arm weapons at +2 for a Lower Arm hit and +4 for an Upper Arm hit, not cumulative", () => {
        const micro = storm();
        const laser = () => micro.getWeaponPlayLines().find((line) => line.name === "ER Laser, Small");
        expect(laser()?.toHit).toBe(0);
        micro.setSlotHit("ra", 1, true);
        expect(laser()?.toHit).toBe(2);
        micro.setSlotHit("ra", 0, true);
        expect(laser()?.toHit).toBe(4);
        expect(micro.getWeaponPlayLines().find((line) => line.name === "Machine Gun")?.toHit).toBe(0);
    });

    it("puts every attack at +4 after a sensor hit, or with the head gone", () => {
        const micro = storm();
        micro.setSlotHit("head", 0, true);
        expect(micro.getWeaponPlayLines().every((line) => line.toHit === 4)).toBe(true);
        const other = storm();
        other.applyDamage("head", 6);
        expect(other.isLocationDestroyed("head")).toBe(true);
        expect(other.getWeaponPlayLines().every((line) => line.toHit === 4)).toBe(true);
        expect(other.getPilotHits()).toBe(0);
    });

    it("marks a weapon whose slot is hit as destroyed", () => {
        const micro = storm();
        micro.setSlotHit("la", slotOf(micro, "la", "Machine Gun"), true);
        const gun = micro.getWeaponPlayLines().find((line) => line.name === "Machine Gun");
        expect(gun?.destroyed).toBe(true);
        expect(gun?.canFire).toBe(false);
    });
});

describe("Micro-Mech play: movement and piloting", () => {
    it("gives the +1 agility bonus (-1) on every Piloting Skill Roll", () => {
        expect(storm("6.1.0.2").getPilotingModifier().total).toBe(-1);
        expect(storm("solarmech-2019").getPilotingModifier().total).toBe(-1);
    });

    it("6.1.0.2 gyro hit: the bonus is lost and rolls are 4 worse (+4); no running or jumping", () => {
        const micro = storm("6.1.0.2");
        micro.setSlotHit("torso", slotOf(micro, "torso", "Gyro"), true);
        expect(micro.isGyroDestroyed()).toBe(true);
        expect(micro.getPilotingModifier().total).toBe(4);
        const move = micro.getPlayMovement();
        expect([move.walk, move.run, move.jump]).toEqual([6, 0, 0]);
    });

    it("2019 gyro hit: rolls at +4, the -1 kept (+3); no running or jumping", () => {
        const micro = storm("solarmech-2019");
        micro.setSlotHit("torso", slotOf(micro, "torso", "Gyro"), true);
        expect(micro.getPilotingModifier().total).toBe(3);
        expect(micro.getPlayMovement().run).toBe(0);
    });

    it("takes 2 Walking MP and adds +2 for each Lower Leg hit", () => {
        const micro = storm();
        micro.setSlotHit("ll", 1, true);
        expect(micro.getPlayMovement()).toMatchObject({ walk: 4, run: 6 });
        expect(micro.getPilotingModifier().total).toBe(1);
        micro.setSlotHit("rl", 1, true);
        expect(micro.getPlayMovement()).toMatchObject({ walk: 2, run: 3 });
        expect(micro.getPilotingModifier().total).toBe(3);
    });

    it("halves Walking MP (round up, before the Lower Leg -2, TW pp.127-128 as errata'd) and adds +4 for an Upper Leg hit (the document's Piloting Skill Roll Table; NGCFells's ruling 2026-11-14), cumulative", () => {
        const micro = storm();
        micro.setSlotHit("ll", 0, true);
        expect(micro.getPlayMovement()).toMatchObject({ walk: 3, run: 5 });
        expect(micro.getPilotingModifier().total).toBe(3);
        expect(micro.getPilotingModifier().lines).toContain("Left Leg Upper Leg Actuator Group +4");
        micro.setSlotHit("ll", 1, true);
        expect(micro.getPlayMovement()).toMatchObject({ walk: 1, run: 2 });
        expect(micro.getPilotingModifier().total).toBe(5);
        micro.setSlotHit("rl", 0, true);
        expect(micro.getPlayMovement().walk).toBe(0);
    });

    it("2019 only: a Lower Leg hit calls for a roll whenever the unit runs", () => {
        const run = (micro: MicroMech) => micro.getPlayMovement().notes.some((note) => /runs/.test(note));
        const old = storm("6.1.0.2");
        old.setSlotHit("ll", 1, true);
        expect(run(old)).toBe(false);
        const post = storm("solarmech-2019");
        post.setSlotHit("ll", 1, true);
        expect(run(post)).toBe(true);
    });

    it("a biped with a leg gone walks 1 and cannot run; +5 replaces that leg's actuator modifiers (TW p.122)", () => {
        const micro = storm();
        micro.setSlotHit("ll", 1, true);
        micro.applyDamage("ll", 9);
        expect(micro.isLocationDestroyed("ll")).toBe(true);
        expect(micro.getPlayMovement()).toMatchObject({ walk: 1, run: 0 });
        expect(micro.getPilotingModifier().total).toBe(4);
        micro.applyDamage("rl", 9);
        expect(micro.getPlayMovement().walk).toBe(0);
    });

    it("a quad loses 1 MP for its first leg, walks 1 with two gone and 0 with three (TW p.122)", () => {
        const micro = hillman();
        micro.applyDamage("fll", 8);
        expect(micro.getPlayMovement().walk).toBe(4);
        micro.applyDamage("frl", 8);
        expect(micro.getPlayMovement()).toMatchObject({ walk: 1, run: 0 });
        micro.applyDamage("ll", 12);
        expect(micro.getPlayMovement().walk).toBe(0);
    });

    it("2019: a neurohelmet gives a further -1; 6.1.0.2 has none", () => {
        const post = storm("solarmech-2019");
        post.setNeurohelmet(true);
        expect(post.getPilotingModifier().total).toBe(-2);
        const old = storm("6.1.0.2");
        old.setNeurohelmet(true);
        expect(old.getPilotingModifier().total).toBe(-1);
    });
});

describe("Micro-Mech play: destroyed", () => {
    it("is destroyed when the pilot is dead, the engine has two hits or the torso structure is gone", () => {
        const dead = storm();
        dead.setPilotHits(6);
        expect(dead.isDestroyed()).toBe(true);
        const torso = storm();
        torso.setStructureDamage("torso", 11);
        expect(torso.isDestroyed()).toBe(true);
        const fine = storm();
        fine.applyDamage("ll", 9);
        fine.setPilotHits(5);
        expect(fine.isDestroyed()).toBe(false);
    });
});

describe("Micro-Mech play: ammunition, skills and the save", () => {
    it("counts shots per ammunition lot", () => {
        const micro = storm();
        expect(micro.getShotsLeft(0)).toBe(100);
        micro.setShotsFired(0, 12);
        expect(micro.getShotsLeft(0)).toBe(88);
        micro.setShotsFired(0, 500);
        expect(micro.getShotsLeft(0)).toBe(0);
    });

    it("keeps the in-play state in the save and leaves it out when clean", () => {
        const micro = storm();
        expect(micro.export().inPlay).toBeUndefined();
        micro.applyDamage("ra", 5);
        micro.setSlotHit("torso", 2, true);
        micro.setShotsFired(0, 3);
        micro.setPilotHits(1);
        const copy = new MicroMech(micro.exportJSON());
        expect(copy.getArmorLeft("ra")).toBe(0);
        expect(copy.getStructureLeft("ra")).toBe(1);
        expect(copy.isSlotHit("torso", 2)).toBe(true);
        expect(copy.getShotsLeft(0)).toBe(97);
        expect(copy.getPilotHits()).toBe(1);
        expect(micro.export(true).inPlay).toBeUndefined();
    });

    it("does not explode the ammunition again when a save with a hit ammunition slot is read", () => {
        const micro = build(16, "biped", 4, 0);
        micro.addMount("micro-machine-gun", "torso");
        micro.setAmmo(0, 250, "torso");
        micro.addMount("micro-case", "torso");
        micro.setSlotHit("torso", slotOf(micro, "torso", "Ammo (Machine Gun)"), true);
        const hits = micro.getPilotHits();
        expect(hits).toBe(3);
        const copy = new MicroMech(micro.exportJSON());
        expect(copy.getPilotHits()).toBe(hits);
        expect(copy.getInPlay()).toEqual(micro.getInPlay());
    });

    it("cleans a bad in-play save instead of failing", () => {
        const data = { ...storm().export(), inPlay: { armor: { la: 99, xx: 3 }, structure: "junk", cockpit: -4, slots: { torso: [2, 99, "a"] }, pilotHits: 40, shotsFired: [9999] } };
        const micro = new MicroMech(JSON.stringify(data));
        expect(micro.getArmorLeft("la")).toBe(0);
        expect(micro.getCockpitArmorLeft()).toBe(3);
        expect(micro.isSlotHit("torso", 2)).toBe(true);
        expect(micro.getPlaySlots("torso").length).toBe(12);
        expect(micro.getPilotHits()).toBe(6);
        expect(micro.getShotsLeft(0)).toBe(0);
    });

    it("takes the pilot's Gunnery and Piloting (4 and 5 by default) and the 'Mech skill multiplier for the roster BV", () => {
        const micro = storm();
        expect([micro.getGunnery(), micro.getPiloting()]).toEqual([4, 5]);
        expect(micro.getSkillAdjustedBattleValue()).toBe(micro.getBattleValue());
        micro.setGunnery(3);
        micro.setPiloting(4);
        const multiplier = getSkillMultiplier(3, 4, "mech", getBattleValueSkillEdition(undefined, "mech")) ?? 1;
        expect(multiplier).toBeGreaterThan(1);
        expect(micro.getSkillAdjustedBattleValue()).toBe(Math.round(micro.getBattleValue() * multiplier));
        const copy = new MicroMech(micro.exportJSON());
        expect([copy.getGunnery(), copy.getPiloting()]).toEqual([3, 4]);
    });
});
