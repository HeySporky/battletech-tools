import { describe, expect, it } from "vitest";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { MICRO_MECH_SLOTS, MICRO_MECH_VERSION_RULES, MicroMechLayout, getMicroMechStructureRow } from "../data/micro-mech-construction";
import MicroMech, { normalizeMicroMechExport } from "./micro-mech";
import { CalcStepDefs, ICalcBreakdown, findCalcDefProblems } from "../data/calc-steps";
import { MICRO_MECH_BV1_STEPS, MICRO_MECH_BV2_STEPS, MICRO_MECH_COST_STEPS } from "../data/calc-steps-micro-mech";
import { buildMicroMech as build } from "../test-support/builders";

// Fixtures: the four sample designs of "Micro-Mechs" 6.1.0.2 (their weight tables), chassis only: equipment is Chunk B.
/** The Storm STM-3X: 11 tons, biped, Walk 6, 6 jets, 46 points of armor. */
const storm = (): MicroMech => {
    const micro = build(11, "biped", 6, 6);
    micro.setName("Storm STM-3X");
    micro.setArmor("head", 4);
    micro.setArmor("torso", 16);
    micro.setArmor("torsoRear", 6);
    micro.setArmor("la", 4);
    micro.setArmor("ra", 4);
    micro.setArmor("ll", 6);
    micro.setArmor("rl", 6);
    return micro;
};

describe("Micro-Mech construction, version 6.1.0.2", () => {
    it.each([
        // name, tons, layout, walk, installed rating, engine kg, gyro kg, structure kg, free sinks
        ["Storm STM-3X", 11, "biped", 6, 70, 2500, 750, 1100, 7],
        ["Tunnel Rat TNR-1X", 13, "biped", 4, 55, 2000, 750, 1300, 5],
        ["Hillman HMN-2X", 15, "quad", 5, 75, 2500, 750, 1500, 7],
        ["Slayer SL-X4", 18, "quad", 5, 90, 3750, 1000, 1800, 9],
    ] as [string, number, MicroMechLayout, number, number, number, number, number, number][])(
        "%s: engine, gyro and structure as the document prints them",
        (_name, tons, layout, walk, rating, engine, gyro, structure, sinks) => {
            const micro = build(tons, layout, walk, 0);
            expect(micro.getVersion()).toBe("6.1.0.2");
            expect(micro.getEngineRating()).toBe(tons * walk);
            expect(micro.getInstalledEngineRating()).toBe(rating);
            expect(micro.getEngineWeight()).toBe(engine);
            expect(micro.getGyroWeight()).toBe(gyro);
            expect(micro.getStructureWeight()).toBe(structure);
            expect(micro.getFreeHeatSinks()).toBe(sinks);
        },
    );

    it("runs at Walking MP x 1.5, rounded up, as a BattleMech", () => {
        expect(build(11, "biped", 6, 0).getRunMP()).toBe(9);
        expect(build(15, "quad", 5, 0).getRunMP()).toBe(8);
        expect(build(13, "biped", 4, 0).getRunMP()).toBe(6);
    });

    it("has a 1,500 kg cockpit and 125 kg jump jets", () => {
        const micro = storm();
        expect(micro.getCockpitWeight()).toBe(1500);
        expect(micro.getJumpJets()).toBe(6);
        expect(micro.getJumpJetWeight()).toBe(750);
        expect(micro.getJumpMP()).toBe(6);
    });

    it("allows no more jump jets than Walking MP", () => {
        const micro = build(11, "biped", 4, 6);
        expect(micro.getJumpJets()).toBe(4);
    });

    it("weighs armor at 62.5 kg a point", () => {
        expect(storm().getArmorWeight()).toBe(2875);
        const hillman = build(15, "quad", 5, 0);
        hillman.setArmor("head", 4); hillman.setArmor("torso", 18); hillman.setArmor("torsoRear", 8);
        hillman.setArmor("fll", 4); hillman.setArmor("frl", 4); hillman.setArmor("ll", 8); hillman.setArmor("rl", 8);
        expect(hillman.getArmorPoints()).toBe(54);
        expect(hillman.getArmorWeight()).toBe(3375);
        const slayer = build(18, "quad", 5, 5);
        slayer.setArmor("head", 4); slayer.setArmor("torso", 20); slayer.setArmor("torsoRear", 4);
        for (const leg of ["fll", "frl", "ll", "rl"] as const) slayer.setArmor(leg, 8);
        expect(slayer.getArmorPoints()).toBe(60);
        expect(slayer.getArmorWeight()).toBe(3750);
    });

    it("an odd number of armor points is an issue, not a rounding", () => {
        const micro = storm();
        micro.setArmor("la", 3);
        expect(micro.getArmorWeight()).toBe(2813);
        expect(micro.getIssues().some((issue) => /odd number of armor points/i.test(issue))).toBe(true);
    });

    it("the Storm's armor is legal and is the 11-ton maximum; one more torso point is an issue", () => {
        const micro = storm();
        expect(micro.getMaxArmor()).toBe(46);
        expect(micro.getArmorPoints()).toBe(46);
        expect(micro.getIssues()).toEqual([]);
        micro.setArmor("torso", 17);
        expect(micro.getArmor("torso")).toBe(17);
        expect(micro.getIssues().some((issue) => /torso front and rear/i.test(issue))).toBe(true);
    });

    it("caps a location's armor at twice its structure", () => {
        const micro = storm();
        micro.setArmor("head", 9);
        expect(micro.getArmor("head")).toBe(4);
        micro.setArmor("la", 9);
        expect(micro.getArmor("la")).toBe(4);
    });

    it("a quad's front legs take leg structure (the quad record sheet)", () => {
        const micro = build(15, "quad", 5, 0);
        expect(micro.getStructure("fll")).toBe(4);
        expect(micro.getStructure("frl")).toBe(4);
        expect(micro.getStructure("la")).toBe(0);
        expect(micro.getMaxArmor("fll")).toBe(8);
    });

    it("sealing weighs what the structure weighs", () => {
        const micro = storm();
        expect(micro.getSealingWeight()).toBe(0);
        micro.setSealed(true);
        expect(micro.isSealed()).toBe(true);
        expect(micro.getSealingWeight()).toBe(1100);
    });

    it("an ICE weighs twice the fusion engine and has no free heat sinks", () => {
        const micro = storm();
        micro.setEngineKind("ice");
        expect(micro.getEngineKind()).toBe("ice");
        expect(micro.getEngineWeight()).toBe(5000);
        expect(micro.getFreeHeatSinks()).toBe(0);
        expect(micro.getNotes().some((note) => /vacuum/i.test(note))).toBe(true);
    });

    it("refuses a tonnage of 9 or 20", () => {
        const micro = new MicroMech();
        expect(micro.setTons(9)).toBe(false);
        expect(micro.setTons(20)).toBe(false);
        expect(micro.getTons()).toBe(10);
        expect(micro.setTons(19)).toBe(true);
    });

    it("offers no Endo Steel, Ferro-Fibrous, XL or Light engine", () => {
        const micro = new MicroMech();
        expect(micro.getEngineKindOptions()).toEqual(["fusion", "ice"]);
        expect(micro.getArmorTypeOptions()).toEqual(["standard"]);
        expect(micro.setEngineKind("xl" as never)).toBe(false);
        expect(micro.getEngineKind()).toBe("fusion");
    });

    it("a biped has 26 slots, 12 free, 10 with both lower arms", () => {
        const micro = new MicroMech();
        micro.setLowerArm("left", false);
        micro.setLowerArm("right", false);
        expect(micro.getSlots("head")).toEqual(["Sensors", null]);
        expect(micro.getSlots("la")).toEqual(["Upper Arm Actuator Group", null, null]);
        expect(micro.getSlots("torso")).toHaveLength(12);
        const all = micro.getLocations().reduce((sum, location) => sum + micro.getSlots(location).length, 0);
        expect(all).toBe(26);
        expect(micro.getTotalFreeSlots()).toBe(12);
        micro.setLowerArm("left", true);
        micro.setLowerArm("right", true);
        expect(micro.hasLowerArm("left")).toBe(true);
        expect(micro.getSlots("ra")).toEqual(["Upper Arm Actuator Group", "Lower Arm Actuator Group", null]);
        expect(micro.getTotalFreeSlots()).toBe(10);
        expect(micro.getFreeSlots("torso")).toBe(5);
        expect(micro.getFreeSlots("ll")).toBe(1);
    });

    it("a quad has no arms and four 3-slot legs", () => {
        const micro = build(15, "quad", 5, 0);
        expect(micro.getLocations()).toEqual(["head", "torso", "torsoRear", "fll", "frl", "ll", "rl"]);
        expect(micro.hasLowerArm("left")).toBe(false);
        expect(micro.setLowerArm("left", true)).toBe(false);
        for (const leg of ["fll", "frl", "ll", "rl"] as const) expect(micro.getSlots(leg)).toHaveLength(3);
        expect(micro.getTotalFreeSlots()).toBe(10);
        expect(MICRO_MECH_SLOTS.torsoRear.slots).toBe(0);
    });

    it("needs the jump jets' slots in the torso and legs", () => {
        const micro = build(11, "biped", 9, 9);
        expect(micro.getJumpJets()).toBe(9);
        // Torso 5 free + legs 1 + 1 = 7.
        expect(micro.getIssues().some((issue) => /jump jets need 9 slots/i.test(issue))).toBe(true);
    });

    it("weighs the Storm's chassis as its weight table prints it", () => {
        const micro = storm();
        // Structure 1100 + engine 2500 + gyro 750 + cockpit 1500 + armor 2875 + jets 750; the weapons are Chunk B.
        expect(micro.getWeight()).toBe(9475);
        expect(micro.getRemainingWeight()).toBe(1525);
        expect(micro.getWeightLog().map((line) => line.kg)).toEqual([1100, 2500, 750, 1500, 2875, 750]);
    });

    it("reports a design a quarter ton over its tonnage", () => {
        const micro = build(10, "biped", 10, 10);
        for (const location of micro.getLocations()) micro.setArmor(location, micro.getMaxArmor(location));
        micro.setArmor("torsoRear", 0);
        micro.setSealed(true);
        expect(micro.getRemainingWeight()).toBeLessThan(0);
        expect(micro.getIssues().some((issue) => /over the 10-ton/i.test(issue))).toBe(true);
    });

    it("requires the Custom Homebrew rules level", () => {
        expect(new MicroMech().getRequiredRulesLevel()).toBe(CUSTOM_HOMEBREW_RULES_LEVEL);
    });

    it("credits the author in its notes", () => {
        expect(new MicroMech().getNotes()[0]).toMatch(/^Micro-Mechs by Solarmech/);
    });

    it("round-trips through exportJSON / importJSON", () => {
        const micro = storm();
        micro.setSealed(true);
        micro.setLowerArm("left", false);
        const copy = new MicroMech(micro.exportJSON());
        expect(copy.export()).toEqual(micro.export());
        expect(copy.getWeight()).toBe(micro.getWeight());
        expect(copy.getImportIssues()).toEqual([]);
    });

    it("normalizeMicroMechExport rejects junk", () => {
        for (const junk of [null, 5, "x", [], {}, { tons: "11" }, { tons: 11, layout: "biped" }]) {
            expect(normalizeMicroMechExport(junk).micro).toBeNull();
        }
    });

    it("normalizeMicroMechExport clamps out-of-range values with an issue for each", () => {
        const saved = storm().export();
        const { micro, issues } = normalizeMicroMechExport({ ...saved, tons: 25, walkMP: 99, jumpJets: -3, layout: "tripod", armor: { ...saved.armor, head: 40 } });
        expect(micro).not.toBeNull();
        expect(micro!.tons).toBe(19);
        expect(micro!.layout).toBe("biped");
        expect(micro!.jumpJets).toBe(0);
        expect(micro!.armor.head).toBe(4);
        expect(issues.some((issue) => /tonnage/i.test(issue))).toBe(true);
        expect(issues.some((issue) => /walking mp/i.test(issue))).toBe(true);
        expect(issues.some((issue) => /jump jets/i.test(issue))).toBe(true);
        expect(issues.some((issue) => /layout/i.test(issue))).toBe(true);
        expect(issues.some((issue) => /head armor/i.test(issue))).toBe(true);
    });

    it("a save with no version loads as 6.1.0.2", () => {
        const saved: Record<string, unknown> = { ...storm().export() };
        delete saved.version;
        const micro = new MicroMech();
        expect(micro.import(saved as never)).toBe(true);
        expect(micro.getVersion()).toBe("6.1.0.2");
        expect(micro.getImportIssues()).toEqual([]);
    });

    it("the structure table matches the document", () => {
        expect(getMicroMechStructureRow(19)).toEqual({ tons: 19, head: 2, torso: 16, arm: 3, leg: 4 });
        expect(getMicroMechStructureRow(14)).toEqual({ tons: 14, head: 2, torso: 13, arm: 2, leg: 4 });
    });
});

describe("Micro-Mech construction, Solarmech's 2019 version", () => {

    it("rounds structure up to the quarter ton: 11 tons is 1,250 kg", () => {
        expect(of2019(11, 6).getStructureWeight()).toBe(1250);
        expect(of2019(14, 6).getStructureWeight()).toBe(1500);
        expect(of2019(10, 6).getStructureWeight()).toBe(1000);
    });

    it("shields fusion at x 1.5: a rating-70 engine is 3,000 kg", () => {
        expect(of2019(11, 6).getEngineWeight()).toBe(3000);
    });

    it("an ICE weighs the BattleMech ICE weight, unshielded", () => {
        const micro = of2019(11, 6);
        micro.setEngineKind("ice");
        expect(micro.getEngineWeight()).toBe(4000);
        expect(micro.getFreeHeatSinks()).toBe(0);
    });

    it("weighs a jump jet at 500 kg", () => {
        const micro = of2019(11, 6);
        micro.setJumpJets(2);
        expect(micro.getJumpJetWeight()).toBe(1000);
    });

    it("free heat sinks are rating / 25, at least 3", () => {
        expect(of2019(11, 6).getFreeHeatSinks()).toBe(3); // rating 70
        expect(of2019(10, 10).getFreeHeatSinks()).toBe(4); // rating 100
    });

    it("head armor may reach 3 x structure", () => {
        const micro = of2019(11, 6);
        micro.setArmor("head", 9);
        expect(micro.getArmor("head")).toBe(6);
        expect(micro.getMaxArmor()).toBe(48);
    });

    it("refuses a quad", () => {
        const micro = of2019(11, 6);
        expect(micro.getLayoutOptions()).toEqual(["biped"]);
        expect(micro.setLayout("quad")).toBe(false);
        expect(micro.getLayout()).toBe("biped");
    });

    it("lists industrial armor among its armor types", () => {
        expect(MICRO_MECH_VERSION_RULES["solarmech-2019"].armorTypes).toEqual(["standard", "industrial"]);
    });

    it("notes the borrowed tables", () => {
        expect(of2019(11, 6).getNotes().some((note) => /from version 6\.1\.0\.2/.test(note))).toBe(true);
    });

    it("switching the Storm to it reports the overweight and removes nothing", () => {
        const micro = storm();
        const before = micro.export();
        const reported = micro.setVersion("solarmech-2019");
        expect(micro.getVersion()).toBe("solarmech-2019");
        expect(micro.getJumpJets()).toBe(6);
        expect(micro.export().armor).toEqual(before.armor);
        // Structure 1250 + engine 3000 + gyro 750 + cockpit 1500 + armor 2875 + jets 3000 = 12,375 kg on 11 tons.
        expect(micro.getWeight()).toBe(12375);
        expect(reported.some((issue) => /over the 11-ton/i.test(issue))).toBe(true);
    });

    it("switching a quad to it keeps the layout and reports it", () => {
        const micro = build(15, "quad", 5, 0);
        const reported = micro.setVersion("solarmech-2019");
        expect(micro.getLayout()).toBe("quad");
        expect(reported.some((issue) => /quad/i.test(issue))).toBe(true);
    });

    it("switching back from 6 head armor keeps it and reports it", () => {
        const micro = of2019(11, 6);
        micro.setArmor("head", 6);
        const reported = micro.setVersion("6.1.0.2");
        expect(micro.getArmor("head")).toBe(6);
        expect(reported.some((issue) => /head armor/i.test(issue))).toBe(true);
    });

    it("round-trips its version", () => {
        const micro = of2019(12, 5);
        expect(new MicroMech(micro.exportJSON()).getVersion()).toBe("solarmech-2019");
    });
});

// Chunk B: equipment, ammunition, heat sinks. The samples' weapon lines as the document prints them.
const stormArmed = (): MicroMech => {
    const micro = storm();
    expect(micro.addMount("micro-er-laser-small", "ra")).toBe(true);
    expect(micro.addMount("micro-machine-gun", "la")).toBe(true);
    // "1 Machine Gun LA 0 100 1 500 / (Ammo Location:1) T 0 1 500": 500 kg, 100 shots, in the torso.
    expect(micro.setAmmo(1, 500, "torso")).toBe(true);
    return micro;
};

const tunnelRat = (): MicroMech => {
    const micro = build(13, "biped", 4, 4);
    micro.setLowerArm("left", false);
    for (const [location, points] of [["head", 4], ["torso", 18], ["torsoRear", 6], ["la", 4], ["ra", 4], ["ll", 6], ["rl", 6]] as const) micro.setArmor(location, points);
    micro.addMount("micro-er-laser-medium", "ra");
    micro.addMount("micro-grenade-launcher", "head");
    micro.setAmmo(1, 500, "torso");
    micro.addMount("micro-beagle-active-probe", "torso");
    micro.addMount("micro-recoilless-rifle-heavy", "la");
    micro.setAmmo(3, 500, "la");
    return micro;
};

const hillman = (): MicroMech => {
    const micro = build(15, "quad", 5, 0);
    for (const [location, points] of [["head", 4], ["torso", 18], ["torsoRear", 8], ["fll", 4], ["frl", 4], ["ll", 8], ["rl", 8]] as const) micro.setArmor(location, points);
    micro.addMount("micro-pulse-laser-small", "head");
    micro.addMount("micro-lrm-9", "torso");
    micro.setAmmo(1, 750, "torso");
    return micro;
};

const slayer = (): MicroMech => {
    const micro = build(18, "quad", 5, 5);
    for (const [location, points] of [["head", 4], ["torso", 20], ["torsoRear", 4], ["fll", 8], ["frl", 8], ["ll", 8], ["rl", 8]] as const) micro.setArmor(location, points);
    micro.addMount("micro-laser-large", "torso");
    micro.addMount("micro-laser-small", "head");
    return micro;
};

describe("Micro-Mech equipment, version 6.1.0.2", () => {
    it.each([
        ["Storm STM-3X", stormArmed, 10975],
        ["Tunnel Rat TNR-1X", tunnelRat, 12975],
        ["Hillman HMN-2X", hillman, 14975],
        ["Slayer SL-X4", slayer, 17925],
    ] as [string, () => MicroMech, number][])("%s comes to its printed total", (_name, make, total) => {
        const micro = make();
        expect(micro.getWeight()).toBe(total);
        expect(micro.getIssues()).toEqual([]);
    });

    it("fills 25 of the Storm's 26 slots", () => {
        const micro = stormArmed();
        expect(micro.getTotalSlots()).toBe(26);
        expect(micro.getTotalUsedSlots()).toBe(25);
        expect(micro.getSlots("la")).toEqual(["Upper Arm Actuator Group", "Lower Arm Actuator Group", "Machine Gun"]);
        expect(micro.getSlots("torso").filter((slot) => slot === "Ammo (Machine Gun)")).toHaveLength(1);
    });

    it("counts the shots in a lot from the table", () => {
        const lots = stormArmed().getAmmoLots();
        expect(lots).toHaveLength(1);
        expect(lots[0]).toMatchObject({ mountIndex: 1, tag: "micro-machine-gun", type: "standard", kg: 500, location: "torso", shots: 100, slots: 1 });
        expect(hillman().getAmmoLots()[0].shots).toBe(10);
        expect(tunnelRat().getAmmoLots().map((lot) => lot.shots)).toEqual([12, 12]);
    });

    it("lists each weapon, lot and system in the weight log", () => {
        const names = stormArmed().getWeightLog().map((line) => `${line.name}: ${line.kg}`);
        expect(names).toContain("ER Laser, Small (Right Arm): 500");
        expect(names).toContain("Machine Gun (Left Arm): 500");
        expect(names).toContain("Ammo (Machine Gun), 100 shots (Torso): 500");
    });

    it("makes a fifth weapon an issue; equipment does not count", () => {
        const micro = build(19, "biped", 4, 0);
        for (const location of ["head", "la", "ra", "torso"] as const) micro.addMount("micro-laser-small", location);
        micro.addMount("micro-beagle-active-probe", "torso");
        expect(micro.getWeaponCount()).toBe(4);
        expect(micro.getIssues().join(" ")).not.toMatch(/weapons/);
        expect(micro.addMount("micro-laser-small", "torso")).toBe(true);
        expect(micro.getWeaponCount()).toBe(5);
        expect(micro.getIssues()).toContain("5 weapons are mounted; a Micro-Mech mounts at most 4.");
    });

    it("counts a missile group of any size as one weapon", () => {
        const micro = build(19, "biped", 4, 0);
        micro.addMount("micro-lrm-20", "torso");
        micro.addMount("micro-srm-1", "head");
        expect(micro.getWeaponCount()).toBe(2);
    });

    it("refuses a weapon that does not fit its location: a weapon is never split", () => {
        const micro = build(19, "biped", 4, 0);
        // An arm with both actuator groups has one free slot; a Large Laser needs two.
        expect(micro.addMount("micro-laser-large", "ra")).toBe(false);
        micro.setLowerArm("right", false);
        expect(micro.addMount("micro-laser-large", "ra")).toBe(true);
        expect(micro.addMount("micro-ppc", "head")).toBe(false);
        expect(micro.addMount("micro-laser-small", "torsoRear")).toBe(false);
        expect(micro.addMount("micro-laser-small", "fll")).toBe(false);
    });

    it("refuses an unknown or banned item", () => {
        const micro = build(19, "biped", 4, 0);
        for (const tag of ["ams", "melee-hatchet", "masc", "melee-sword", "tsm", "medium-laser", "micro-nothing"]) expect(micro.addMount(tag, "torso"), tag).toBe(false);
        expect(micro.getMounts()).toEqual([]);
    });

    it("removes a mount with its ammunition", () => {
        const micro = stormArmed();
        expect(micro.removeMount(1)).toBe(true);
        expect(micro.getAmmoLots()).toEqual([]);
        expect(micro.getMounts().map((mount) => mount.tag)).toEqual(["micro-er-laser-small"]);
        expect(micro.removeMount(5)).toBe(false);
    });

    it("needs at least a quarter ton of ammunition for each ammunition weapon", () => {
        const micro = build(19, "biped", 4, 0);
        micro.addMount("micro-machine-gun", "torso");
        expect(micro.getIssues()).toContain("Machine Gun (Torso) carries no ammunition: at least 250 kg is needed.");
        micro.setAmmo(0, 250);
        expect(micro.getIssues().join(" ")).not.toMatch(/no ammunition/);
    });

    it("sells ammunition in 250 kg lots, up to 1,000 kg a slot", () => {
        const micro = build(19, "biped", 4, 0);
        micro.addMount("micro-autocannon-2", "torso");
        expect(micro.setAmmo(0, 300)).toBe(false);
        expect(micro.setAmmo(0, -250)).toBe(false);
        expect(micro.setAmmo(0, 1000)).toBe(true);
        expect(micro.getAmmoLots()[0]).toMatchObject({ shots: 45, slots: 1 });
        expect(micro.setAmmo(0, 1250)).toBe(true);
        expect(micro.getAmmoLots()[0]).toMatchObject({ shots: 56, slots: 2 });
        expect(micro.setAmmo(0, 0)).toBe(true);
        expect(micro.getAmmoLots()).toEqual([]);
    });

    it("refuses ammunition for a weapon that takes none, or a type it does not have", () => {
        const micro = build(19, "biped", 4, 0);
        micro.addMount("micro-laser-small", "torso");
        micro.addMount("micro-machine-gun", "torso");
        expect(micro.setAmmo(0, 250)).toBe(false);
        expect(micro.setAmmo(1, 250, "torso", "cluster")).toBe(false);
        expect(micro.setAmmo(7, 250)).toBe(false);
    });

    it("keeps one weapon's standard and cluster ammunition in one slot (the LB-5X example)", () => {
        const micro = build(19, "biped", 4, 0);
        // The LB-2X fills four of the torso's five free slots; both lots share the fifth.
        micro.addMount("micro-lb-2x-ac", "torso");
        expect(micro.setAmmo(0, 500, "torso", "cluster")).toBe(true);
        expect(micro.setAmmo(0, 250, "torso", "standard")).toBe(true);
        expect(micro.getAmmoLots().map((lot) => [lot.type, lot.kg])).toEqual([["standard", 250], ["cluster", 500]]);
        expect(micro.getSlots("torso").filter((slot) => slot?.startsWith("Ammo"))).toHaveLength(1);
        expect(micro.getFreeSlots("torso")).toBe(0);
    });

    it("refuses ammunition that has no free slot", () => {
        const micro = build(19, "biped", 4, 0);
        micro.addMount("micro-machine-gun", "ra");
        expect(micro.setAmmo(0, 250, "ra")).toBe(false);
        expect(micro.setAmmo(0, 250, "la")).toBe(true);
    });

    it("needs heat sinks for the summed heat of the energy weapons: free plus at most 10 extra at 125 kg", () => {
        const micro = slayer();
        expect(micro.getEnergyHeat()).toBe(9);
        expect(micro.getHeatSinks()).toBe(9);
        micro.addMount("micro-laser-small", "ll");
        expect(micro.getEnergyHeat()).toBe(10);
        expect(micro.getIssues()).toContain("The energy weapons make 10 heat; the heat sinks dissipate 9.");
        micro.setExtraHeatSinks(1);
        expect(micro.getHeatSinks()).toBe(10);
        expect(micro.getWeightLog()).toContainEqual({ name: "Heat sinks (1 extra)", kg: 125 });
        expect(micro.getIssues().join(" ")).not.toMatch(/heat/);
        micro.setExtraHeatSinks(11);
        expect(micro.getExtraHeatSinks()).toBe(10);
    });

    it("needs no heat sinks for ballistic and missile weapons", () => {
        const micro = build(19, "biped", 4, 0);
        micro.addMount("micro-machine-gun", "torso");
        micro.addMount("micro-srm-2", "torso");
        expect(micro.getEnergyHeat()).toBe(0);
    });

    it("gives an ICE a ton of power amplifiers per 10 tons of energy weapons or part, and no free heat sinks", () => {
        const micro = build(19, "biped", 4, 0);
        micro.setEngineKind("ice");
        expect(micro.getPowerAmplifierWeight()).toBe(0);
        micro.addMount("micro-laser-small", "head");
        expect(micro.getPowerAmplifierWeight()).toBe(1000);
        micro.addMount("micro-ppc", "torso");
        micro.addMount("micro-pulse-laser-large", "torso");
        expect(micro.getPowerAmplifierWeight()).toBe(2000);
        expect(micro.getWeightLog()).toContainEqual({ name: "Power amplifiers", kg: 2000 });
        expect(micro.getHeatSinks()).toBe(micro.getExtraHeatSinks());
        micro.setEngineKind("fusion");
        expect(micro.getPowerAmplifierWeight()).toBe(0);
    });

    it("moves arm equipment to the front legs and back with the layout", () => {
        const micro = stormArmed();
        micro.setJumpJets(0);
        micro.setLayout("quad");
        expect(micro.getMounts().map((mount) => mount.location)).toEqual(["frl", "fll"]);
        micro.setLayout("biped");
        expect(micro.getMounts().map((mount) => mount.location)).toEqual(["ra", "la"]);
    });

    it("reports a lower arm group fitted into a full arm", () => {
        const micro = build(19, "biped", 4, 0);
        micro.setLowerArm("right", false);
        micro.addMount("micro-laser-large", "ra");
        micro.setLowerArm("right", true);
        expect(micro.getIssues()).toContain("Right Arm holds 4 slots of items in 3 slots.");
    });

    it("counts jump jets against the slots the equipment leaves", () => {
        const micro = stormArmed();
        micro.addMount("micro-laser-small", "ll");
        expect(micro.getIssues()).toContain("The jump jets need 6 slots in the torso and legs; 5 are free.");
    });

    it("saves and reads mounts, ammunition and heat sinks", () => {
        const micro = stormArmed();
        micro.setExtraHeatSinks(2);
        const copy = new MicroMech(micro.exportJSON());
        expect(copy.export()).toEqual(micro.export());
        expect(copy.getWeight()).toBe(micro.getWeight());
        expect(copy.getImportIssues()).toEqual([]);
    });

    it("drops an unreadable mount or lot with an issue for each", () => {
        const data = stormArmed().export();
        data.mounts = [
            ...data.mounts!,
            { tag: "micro-nothing", location: "torso" },
            { tag: "micro-laser-small", location: "fll" },
            { tag: "micro-autocannon-2", location: "torso", ammo: [{ type: "standard", kg: 300, location: "torso" }, { type: "cluster", kg: 250, location: "torso" }] },
        ];
        const { micro, issues } = normalizeMicroMechExport(data);
        expect(micro?.mounts?.map((mount) => mount.tag)).toEqual(["micro-er-laser-small", "micro-machine-gun", "micro-autocannon-2"]);
        expect(micro?.mounts?.[2].ammo).toEqual([{ type: "standard", kg: 250, location: "torso" }]);
        expect(issues).toEqual([
            "Unknown item \"micro-nothing\": dropped.",
            "Laser, Small: no Left Front Leg on a biped: dropped.",
            "Autocannon/2 ammunition 300 kg is not a 250 kg lot: set to 250 kg.",
            "Autocannon/2 has no cluster ammunition: dropped.",
        ]);
    });

    it("reads a Chunk A save with no equipment", () => {
        const data = storm().export();
        delete data.mounts;
        delete data.extraHeatSinks;
        const micro = new MicroMech(JSON.stringify(data));
        expect(micro.getMounts()).toEqual([]);
        expect(micro.getExtraHeatSinks()).toBe(0);
        expect(micro.getImportIssues()).toEqual([]);
    });
});

describe("Micro-Mech equipment, version solarmech-2019", () => {
    it("refuses a weapon in the head or a leg, and ammunition outside the torso", () => {
        const micro = build(19, "biped", 4, 0);
        micro.setVersion("solarmech-2019");
        expect(micro.addMount("micro-laser-small", "head")).toBe(false);
        expect(micro.addMount("micro-laser-small", "ll")).toBe(false);
        expect(micro.addMount("micro-c3-slave", "head")).toBe(true);
        expect(micro.addMount("micro-case", "ll")).toBe(true);
        expect(micro.addMount("micro-machine-gun", "ra")).toBe(true);
        expect(micro.setAmmo(2, 250, "ra")).toBe(false);
        expect(micro.setAmmo(2, 250)).toBe(true);
        expect(micro.getAmmoLots()[0].location).toBe("torso");
    });

    it("reports the Tunnel Rat's head weapon and arm ammunition, and removes nothing", () => {
        const micro = tunnelRat();
        const issues = micro.setVersion("solarmech-2019");
        expect(issues).toContain("Grenade Launcher is in the Head; Solarmech's 2019 post (Micro-Mechs for BattleTech, Part 1) allows no weapon in the head or legs.");
        expect(issues).toContain("Recoilless Rifle (Heavy) ammunition is in the Left Arm; Solarmech's 2019 post (Micro-Mechs for BattleTech, Part 1) allows ammunition only in the torso.");
        expect(micro.getMounts()).toHaveLength(4);
        expect(micro.getAmmoLots()).toHaveLength(2);
    });

    it("weighs heat sinks at 500 kg with no limit, and counts part-ton shots as a fraction of the ton", () => {
        const micro = build(19, "biped", 4, 0);
        micro.setVersion("solarmech-2019");
        micro.setExtraHeatSinks(12);
        expect(micro.getExtraHeatSinks()).toBe(12);
        expect(micro.getWeightLog()).toContainEqual({ name: "Heat sinks (12 extra)", kg: 6000 });
        micro.addMount("micro-srm-2", "torso");
        micro.setAmmo(0, 750);
        expect(micro.getAmmoLots()[0].shots).toBe(37);
    });

    it("weighs power converters at 10 percent of the energy weapons, up to the quarter ton", () => {
        const micro = build(19, "biped", 4, 0);
        micro.setVersion("solarmech-2019");
        micro.setEngineKind("ice");
        micro.addMount("micro-laser-small", "torso");
        expect(micro.getPowerAmplifierWeight()).toBe(250);
        micro.addMount("micro-ppc", "torso");
        micro.addMount("micro-laser-medium", "ra");
        // 8,500 kg of energy weapons: 850 kg, up to 1,000.
        expect(micro.getPowerAmplifierWeight()).toBe(1000);
    });

    it("keeps one ammunition type to a slot", () => {
        const micro = build(19, "biped", 4, 0);
        micro.setVersion("solarmech-2019");
        // The LB-2X fills four of the torso's five free slots: the cluster lot needs a sixth.
        micro.addMount("micro-lb-2x-ac", "torso");
        expect(micro.setAmmo(0, 250, "torso", "standard")).toBe(true);
        expect(micro.setAmmo(0, 250, "torso", "cluster")).toBe(false);
        expect(micro.getAmmoLots().map((lot) => lot.type)).toEqual(["standard"]);
    });

    it("reports extra heat sinks over the 6.1.0.2 limit after a switch back, and keeps them", () => {
        const micro = build(19, "biped", 4, 0);
        micro.setVersion("solarmech-2019");
        micro.setExtraHeatSinks(12);
        expect(micro.setVersion("6.1.0.2")).toContain("12 extra heat sinks exceed the 10 the engine may carry.");
        expect(micro.getExtraHeatSinks()).toBe(12);
    });
});

// Chunk C: cost and Battle Value. The document's appendices (PDF pp.11-12) over the Master Rules, Revised pp.149, 152-154.
const BV1 = "master-rules-revised";
const BV2 = "total-warfare";
const named = (make: () => MicroMech, name: string): MicroMech => {
    const micro = make();
    micro.setName(name);
    return micro;
};
const stepsOf = (breakdown: ICalcBreakdown, id: string) => breakdown.steps.filter((step) => step.id === id);
const valueOf = (breakdown: ICalcBreakdown, id: string) => stepsOf(breakdown, id).map((step) => step.value);
const of2019 = (tons: number, walk: number): MicroMech => {
    const micro = new MicroMech();
    micro.setVersion("solarmech-2019");
    micro.setTons(tons);
    micro.setWalkMP(walk);
    return micro;
};
/** An 11-ton biped, Walk 6, with a torso machine gun and 1,000 kg of its ammunition where asked (no left lower arm, for the slots). */
const withAmmo = (ammoAt: "la" | "torso" | "ll" | "head", caseAt?: ["micro-case" | "micro-case-ii", "la" | "torso"]): MicroMech => {
    const micro = build(11, "biped", 6, 0);
    micro.setLowerArm("left", false);
    expect(micro.addMount("micro-machine-gun", "torso")).toBe(true);
    expect(micro.setAmmo(0, 1000, ammoAt)).toBe(true);
    if (caseAt) expect(micro.addMount(caseAt[0], caseAt[1])).toBe(true);
    return micro;
};

describe("Micro-Mech step definitions", () => {
    it.each([
        ["cost", MICRO_MECH_COST_STEPS],
        ["Battle Value 1", MICRO_MECH_BV1_STEPS],
        ["Battle Value 2", MICRO_MECH_BV2_STEPS],
    ] as [string, CalcStepDefs][])("the %s table is clean", (_name, defs) => {
        expect(findCalcDefProblems(defs)).toEqual([]);
    });

    it("every BV2 step is provisional and says it is NGCFells's", () => {
        for (const def of Object.values(MICRO_MECH_BV2_STEPS)) {
            expect(def.status).toBe("provisional");
        }
        expect(MICRO_MECH_BV2_STEPS["mm.bv2.def.armor"].note).toMatch(/NGCFells's, not the document's/);
    });
});

describe("Micro-Mech cost (6.1.0.2 appendix)", () => {
    it("the rows the document changes, on the Storm", () => {
        const cost = stormArmed().getCostBreakdown();
        expect(valueOf(cost, "mm.cost.cockpit")).toEqual([150000]);
        expect(valueOf(cost, "mm.cost.life-support")).toEqual([40000]);
        // Sensors: tonnage x 1,500.
        expect(valueOf(cost, "mm.cost.sensors")).toEqual([16500]);
        // Upper arm x 100 (two), lower arm x 130 (two), upper leg x 150 (two), lower leg x 200 (two).
        expect(valueOf(cost, "mm.cost.actuators")).toEqual([2200, 2860, 3300, 4400]);
        // Jump jets: tonnage x jets squared x 150.
        expect(valueOf(cost, "mm.cost.jump-jets")).toEqual([59400]);
        expect(stepsOf(cost, "mm.cost.sealing")).toEqual([]);
    });

    it("the rows left as the BattleMech's, on the Storm", () => {
        const cost = stormArmed().getCostBreakdown();
        expect(valueOf(cost, "mm.cost.musculature")).toEqual([22000]);
        expect(valueOf(cost, "mm.cost.structure")).toEqual([4400]);
        // (5,000 x 70 x 11) / 75 = 51,333.33, rounded up.
        expect(valueOf(cost, "mm.cost.engine")).toEqual([51334]);
        expect(valueOf(cost, "mm.cost.gyro")).toEqual([225000]);
        expect(valueOf(cost, "mm.cost.armor")).toEqual([28750]);
        expect(valueOf(cost, "mm.cost.equipment")).toEqual([11250, 5000]);
        // 500 kg of machine gun ammunition at 1,000 a ton.
        expect(valueOf(cost, "mm.cost.ammo")).toEqual([500]);
        expect(valueOf(cost, "mm.cost.multiplier")).toEqual([1.11]);
    });

    it("only the lower arm groups fitted are priced", () => {
        const micro = build(11, "biped", 6, 0);
        micro.setLowerArm("left", false);
        expect(valueOf(micro.getCostBreakdown(), "mm.cost.actuators")).toEqual([2200, 1430, 3300, 4400]);
        micro.setLowerArm("right", false);
        expect(valueOf(micro.getCostBreakdown(), "mm.cost.actuators")).toEqual([2200, 3300, 4400]);
    });

    it("a quad prices four legs and no arms", () => {
        expect(valueOf(build(15, "quad", 5, 0).getCostBreakdown(), "mm.cost.actuators")).toEqual([9000, 12000]);
    });

    it("environmental sealing: tonnage x 1,000", () => {
        const micro = build(11, "biped", 6, 0);
        micro.setSealed(true);
        expect(valueOf(micro.getCostBreakdown(), "mm.cost.sealing")).toEqual([11000]);
    });

    it("an ICE engine: (1,250 x rating x tonnage) / 75, with TechManual-priced power amplifiers", () => {
        const micro = build(11, "biped", 6, 0);
        expect(micro.setEngineKind("ice")).toBe(true);
        expect(micro.addMount("micro-laser-small", "ra")).toBe(true);
        const cost = micro.getCostBreakdown();
        expect(stepsOf(cost, "mm.cost.engine")).toEqual([]);
        // (1,250 x 70 x 11) / 75 = 12,833.33, rounded up.
        expect(valueOf(cost, "mm.cost.engine.ice")).toEqual([12834]);
        // 1 ton of amplifiers at 20,000 a ton: ours, from the TechManual.
        expect(valueOf(cost, "mm.cost.power-amplifiers")).toEqual([20000]);
        expect(stepsOf(cost, "mm.cost.power-amplifiers")[0].status).toBe("provisional");
    });

    it("heat sinks: 2,000 for each over 10, as the BattleMech table has it", () => {
        const micro = build(11, "biped", 6, 0);
        micro.setExtraHeatSinks(2);
        // 7 free + 2 = 9: none over 10.
        expect(valueOf(micro.getCostBreakdown(), "mm.cost.heat-sinks")).toEqual([0]);
        micro.setExtraHeatSinks(5);
        expect(valueOf(micro.getCostBreakdown(), "mm.cost.heat-sinks")).toEqual([4000]);
    });

    it.each([
        ["Storm STM-3X", stormArmed, 695853],
        ["Hillman HMN-2X", hillman, 852898],
        ["Slayer SL-X4", slayer, 1073387],
    ] as [string, () => MicroMech, number][])("%s costs what the document prints", (name, make, printed) => {
        const micro = named(make, name);
        expect(micro.getCBillCost()).toBe(printed);
        expect(valueOf(micro.getCostBreakdown(), "mm.cost.printed")).toEqual([printed]);
    });

    it("the Tunnel Rat: our figure, beside the document's corrupt one", () => {
        const micro = named(tunnelRat, "Tunnel Rat TNR-1X");
        const cost = micro.getCostBreakdown();
        expect(micro.getCBillCost()).toBe(990510);
        expect(stepsOf(cost, "mm.cost.printed")[0]).toMatchObject({ value: 8993460, label: "The document prints (a corrupt figure)" });
    });

    it("a design that is not a sample shows no printed figure", () => {
        expect(stepsOf(stormArmed().getCostBreakdown(), "mm.cost.printed").length).toBe(1);
        const changed = stormArmed();
        changed.setArmor("head", 2);
        expect(stepsOf(changed.getCostBreakdown(), "mm.cost.printed")).toEqual([]);
        expect(stepsOf(named(stormArmed, "My Storm").getCostBreakdown(), "mm.cost.printed")).toEqual([]);
    });

    it("the 2019 version borrows the 6.1.0.2 cost rules and says so", () => {
        const micro = of2019(11, 6);
        expect(stepsOf(micro.getCostBreakdown(), "mm.cost.borrowed").length).toBe(1);
        expect(stepsOf(stormArmed().getCostBreakdown(), "mm.cost.borrowed")).toEqual([]);
    });
});

describe("Micro-Mech Battle Value (6.1.0.2 appendix, BV1 editions)", () => {
    it("is always provisional", () => {
        expect(new MicroMech().isBattleValueProvisional()).toBe(true);
    });

    it("the Slayer comes to the document's 531", () => {
        const micro = named(slayer, "Slayer SL-X4");
        const bv = micro.getBattleValueBreakdown(BV1);
        expect(bv.scheme).toBe("bv1");
        expect(valueOf(bv, "mm.bv1.def.armor")).toEqual([120]);
        expect(valueOf(bv, "mm.bv1.def.structure")).toEqual([49.5]);
        // The Micro-Mech's own tonnage.
        expect(valueOf(bv, "mm.bv1.def.tonnage")).toEqual([18]);
        // Run 8 (+3) and Jump 5 (+2, +1): 1.3, and 0.1 more for a Micro-Mech.
        expect(valueOf(bv, "mm.bv1.def.factor")).toEqual([1.4]);
        expect(valueOf(bv, "mm.bv1.off.weapon")).toEqual([124, 9]);
        // Running 8 + Jumping 5 = 13.
        expect(valueOf(bv, "mm.bv1.off.speed")).toEqual([2.02]);
        expect(bv.result).toBe(531);
        expect(micro.getBattleValue(BV1)).toBe(531);
        expect(valueOf(bv, "mm.bv1.final.printed")).toEqual([531]);
    });

    it("has no heat steps, even with more heat than sinks", () => {
        const micro = build(18, "quad", 5, 0);
        micro.addMount("micro-er-ppc", "torso");
        const bv = micro.getBattleValueBreakdown(BV1);
        expect(micro.getEnergyHeat()).toBeGreaterThan(micro.getHeatSinks());
        expect(stepsOf(bv, "mm.bv1.def.no-heat").length).toBe(1);
        expect(stepsOf(bv, "mm.bv1.off.no-heat").length).toBe(1);
        // 229 x the Speed Factor for Running 8 (1.37): nothing halved.
        expect(valueOf(bv, "mm.bv1.off.rating")[0]).toBeCloseTo(229 * 1.37, 6);
    });

    it.each([
        // where the ammunition is, CASE, the points a ton
        ["torso", "torso", undefined, -30, "mm.bv1.def.explosive"],
        ["a leg", "ll", undefined, -30, "mm.bv1.def.explosive"],
        ["an arm, no CASE in the torso", "la", undefined, -30, "mm.bv1.def.explosive"],
        ["an arm, CASE in the arm only", "la", ["micro-case", "la"], -30, "mm.bv1.def.explosive"],
        ["an arm, CASE in the torso", "la", ["micro-case", "torso"], -20, "mm.bv1.def.explosive"],
        ["the torso, CASE in the torso", "torso", ["micro-case", "torso"], -30, "mm.bv1.def.explosive"],
        ["the torso, CASE II there", "torso", ["micro-case-ii", "torso"], -5, "mm.bv1.def.explosive"],
        ["an arm, CASE II there", "la", ["micro-case-ii", "la"], -5, "mm.bv1.def.explosive"],
        ["the head (NGCFells's: as the torso)", "head", undefined, -30, "mm.bv1.def.explosive.head"],
    ] as [string, "la" | "torso" | "ll" | "head", ["micro-case" | "micro-case-ii", "la" | "torso"] | undefined, number, string][])(
        "a ton of ammunition in %s", (_name, ammoAt, caseAt, points, id) => {
            const bv = withAmmo(ammoAt, caseAt).getBattleValueBreakdown(BV1);
            expect([...valueOf(bv, "mm.bv1.def.explosive"), ...valueOf(bv, "mm.bv1.def.explosive.head")]).toEqual([points]);
            expect(stepsOf(bv, id).length).toBe(1);
        });

    it("part-ton ammunition counts its fraction, unrounded, in the penalty and in its Battle Value", () => {
        // The Storm: 500 kg of machine gun ammunition (1 a ton) in the torso.
        const bv = stormArmed().getBattleValueBreakdown(BV1);
        expect(valueOf(bv, "mm.bv1.def.explosive")).toEqual([-15]);
        expect(valueOf(bv, "mm.bv1.off.ammo")).toEqual([0.5]);
        // The Hillman: 750 kg of LRM 9 ammunition (10 a ton).
        const hill = hillman().getBattleValueBreakdown(BV1);
        expect(valueOf(hill, "mm.bv1.def.explosive")).toEqual([-22.5]);
        expect(valueOf(hill, "mm.bv1.off.ammo")).toEqual([7.5]);
    });

    it("the Storm and the Hillman: our figure from the rules text, beside the document's", () => {
        const stormBv = named(stormArmed, "Storm STM-3X").getBattleValueBreakdown(BV1);
        // (92 + 34.5 + 11 - 15) x 1.4 + (17 + 5 + 0.5) x 2.3 = 223.25.
        expect(stormBv.result).toBe(223);
        expect(valueOf(stormBv, "mm.bv1.final.printed")).toEqual([217]);
        const hillBv = named(hillman, "Hillman HMN-2X").getBattleValueBreakdown(BV1);
        // (108 + 46.5 + 15 - 22.5) x 1.4 + (12 + 78 + 7.5) x 1.37 = 339.375. Structure 31: the 15-ton row, four legs.
        expect(valueOf(hillBv, "mm.bv1.def.structure")).toEqual([46.5]);
        expect(hillBv.result).toBe(339);
        expect(valueOf(hillBv, "mm.bv1.final.printed")).toEqual([352]);
    });

    it("ECM is defensive, an active probe offensive", () => {
        const micro = build(15, "quad", 5, 0);
        micro.addMount("micro-guardian-ecm-suite", "torso");
        micro.addMount("micro-beagle-active-probe", "torso");
        const bv = micro.getBattleValueBreakdown(BV1);
        expect(valueOf(bv, "mm.bv1.def.equipment")).toEqual([61]);
        expect(valueOf(bv, "mm.bv1.off.equipment")).toEqual([10]);
    });

    it("Artemis IV adds 20 percent to one launcher, not its ammunition; C3 and TAG add nothing here", () => {
        const micro = build(19, "biped", 3, 0);
        micro.addMount("micro-srm-2", "la");
        micro.setAmmo(0, 1000, "torso");
        micro.addMount("micro-srm-2", "ra");
        micro.addMount("micro-artemis-iv-fcs", "torso");
        micro.addMount("micro-c3-slave", "torso");
        micro.addMount("micro-target-acquisition-gear-tag", "torso");
        const bv = micro.getBattleValueBreakdown(BV1);
        expect(valueOf(bv, "mm.bv1.off.weapon.artemis")[0]).toBeCloseTo(25.2, 6);
        expect(valueOf(bv, "mm.bv1.off.weapon")).toEqual([21]);
        expect(valueOf(bv, "mm.bv1.off.ammo")).toEqual([3]);
        expect(valueOf(bv, "mm.bv1.off.force")).toEqual([0, 0]);
    });

    it("the defensive subtotal never falls below 1", () => {
        const micro = build(10, "biped", 1, 0);
        micro.addMount("micro-machine-gun", "la");
        micro.setAmmo(0, 2000, "torso");
        const bv = micro.getBattleValueBreakdown(BV1);
        // 0 armor + 22 x 1.5 structure + 10 tons - 60 = -17.
        expect(valueOf(bv, "mm.bv1.def.subtotal")).toEqual([1]);
    });

    it("both BV1 editions give the document's figure; an older edition has none", () => {
        const micro = slayer();
        expect(micro.getBattleValue("master-rules")).toBe(531);
        expect(micro.getBattleValueBreakdown("master-rules").scheme).toBe("bv1");
        const none = micro.getBattleValueBreakdown("battletech-4th-edition");
        expect(none.scheme).toBe("none");
        expect(none.result).toBeNull();
    });

    it("the 2019 version borrows the 6.1.0.2 Battle Value rules and says so", () => {
        expect(stepsOf(of2019(11, 6).getBattleValueBreakdown(BV1), "mm.bv1.final.borrowed").length).toBe(1);
        expect(stepsOf(of2019(11, 6).getBattleValueBreakdown(BV2), "mm.bv2.final.borrowed").length).toBe(1);
    });
});

describe("Micro-Mech provisional BV2 (NGCFells's)", () => {
    it("the Storm, step by step", () => {
        const bv = stormArmed().getBattleValueBreakdown(BV2);
        expect(bv.scheme).toBe("bv2");
        expect(bv.steps.every((step) => step.status === "provisional")).toBe(true);
        expect(valueOf(bv, "mm.bv2.def.armor")).toEqual([115]);
        expect(valueOf(bv, "mm.bv2.def.structure")).toEqual([34.5]);
        // Tonnage enters the BV2 defensive rating through the gyro: 11 x 0.5.
        expect(valueOf(bv, "mm.bv2.def.tonnage")).toEqual([5.5]);
        // 500 kg in the torso at 22.5 a ton.
        expect(valueOf(bv, "mm.bv2.def.explosive")).toEqual([-11.25]);
        expect(valueOf(bv, "mm.bv2.def.subtotal")).toEqual([143.75]);
        // Run 9 (+3), Jump 6 (+2, +1): 1.3, and 0.1 more.
        expect(valueOf(bv, "mm.bv2.def.factor")).toEqual([1.4]);
        expect(valueOf(bv, "mm.bv2.off.weapon")).toEqual([17, 5]);
        expect(valueOf(bv, "mm.bv2.off.ammo")).toEqual([0.5]);
        expect(valueOf(bv, "mm.bv2.off.tonnage")).toEqual([11]);
        // Running 9 + half of Jumping 6 = 12.
        expect(valueOf(bv, "mm.bv2.off.speed")).toEqual([1.89]);
        // 143.75 x 1.4 + 33.5 x 1.89 = 264.565.
        expect(bv.result).toBe(265);
        expect(stormArmed().getBattleValue(BV2)).toBe(265);
        expect(stepsOf(bv, "mm.bv2.final.printed" as string)).toEqual([]);
    });

    it("no heat efficiency limit: every weapon in full", () => {
        const micro = build(18, "quad", 5, 0);
        micro.addMount("micro-er-ppc", "torso");
        micro.addMount("micro-er-laser-medium", "head");
        expect(valueOf(micro.getBattleValueBreakdown(BV2), "mm.bv2.off.weapon")).toEqual([229, 62]);
    });

    it("an item with a BV2 figure in the JBT catalog uses it; one without keeps the document's", () => {
        const micro = build(19, "biped", 3, 0);
        // Large Laser: the document prints 124, BV2 is 123. Heavy Flamer: 20 and 3 a ton against BV2's 15 and 2.
        micro.addMount("micro-laser-large", "torso");
        micro.addMount("micro-flamer-heavy", "la");
        micro.setAmmo(1, 1000, "torso");
        // No book prints an LRM 9.
        micro.addMount("micro-lrm-9", "torso");
        expect(micro.setAmmo(2, 500, "ll")).toBe(true);
        const bv = micro.getBattleValueBreakdown(BV2);
        expect(valueOf(bv, "mm.bv2.off.weapon")).toEqual([123, 15]);
        expect(valueOf(bv, "mm.bv2.off.weapon.document")).toEqual([78]);
        expect(valueOf(bv, "mm.bv2.off.ammo")).toEqual([2, 5]);
        expect(stepsOf(bv, "mm.bv2.off.ammo")[1].label).toMatch(/the document's figure/);
        expect(micro.getBattleValueBreakdown(BV1).steps.find((step) => step.label === "Laser, Large")?.value).toBe(124);
    });

    it("ammunition penalties by weight: 22.5 a ton, 15 in an arm with torso CASE, none under CASE II", () => {
        expect(valueOf(withAmmo("torso").getBattleValueBreakdown(BV2), "mm.bv2.def.explosive")).toEqual([-22.5]);
        expect(valueOf(withAmmo("la").getBattleValueBreakdown(BV2), "mm.bv2.def.explosive")).toEqual([-22.5]);
        expect(valueOf(withAmmo("la", ["micro-case", "torso"]).getBattleValueBreakdown(BV2), "mm.bv2.def.explosive")).toEqual([-15]);
        expect(valueOf(withAmmo("torso", ["micro-case-ii", "torso"]).getBattleValueBreakdown(BV2), "mm.bv2.def.explosive")).toEqual([0]);
    });

    it("a weapon's ammunition is worth no more than the weapon", () => {
        const micro = build(19, "biped", 3, 0);
        micro.addMount("micro-grenade-launcher", "la");
        // 3 tons at 1 a ton against a grenade launcher worth 2 (both the document's figures: no book prints a BV2).
        expect(micro.setAmmo(0, 3000, "torso")).toBe(true);
        const bv = micro.getBattleValueBreakdown(BV2);
        expect(valueOf(bv, "mm.bv2.off.ammo")).toEqual([3]);
        expect(valueOf(bv, "mm.bv2.off.ammo.cap")).toEqual([2]);
        expect(stepsOf(bv, "mm.bv2.off.ammo.total")[0]).toMatchObject({ value: 2, total: 4 });
        expect(valueOf(bv, "mm.bv2.off.tonnage")[0]).toBe(19);
        expect(stepsOf(bv, "mm.bv2.off.tonnage")[0].total).toBe(2 + 2 + 19);
    });

    it("active probes and ECM are defensive under BV2", () => {
        const micro = build(15, "quad", 5, 0);
        micro.addMount("micro-guardian-ecm-suite", "torso");
        micro.addMount("micro-beagle-active-probe", "torso");
        const bv = micro.getBattleValueBreakdown(BV2);
        expect(valueOf(bv, "mm.bv2.def.equipment")).toEqual([61, 10]);
        expect(stepsOf(bv, "mm.bv2.off.equipment")).toEqual([]);
    });
});
