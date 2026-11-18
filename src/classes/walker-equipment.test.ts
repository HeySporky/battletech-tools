import { describe, expect, it } from "vitest";
import Walker from "./walker";
import { WALKER_LOCATIONS, WalkerLocation } from "../data/walker-construction";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { buildWalker as build } from "../test-support/builders";

// Clell Flint's walkers (#172), Chunk B of docs/superpowers/plans/2026-11-13-future-wars-walkers.md: equipment, the
// center-torso rule (Best-of p.36; Future Wars #11 p.26, read on the page images), the turret, heat sinks, jump jets
// and ammunition. What the text is silent on is NGCFells's, as the ledger lists.

const latestEra = (walker: Walker): void => {
    const eras = walker.getAvailableEras();
    expect(walker.setEra(eras[eras.length - 1].tag)).toBe(true);
};
const allSlots = (walker: Walker) => WALKER_LOCATIONS.flatMap((location) => walker.getSlots(location));

describe("Walker equipment", () => {
    it("mounts a medium laser on a leg, the front torso and in the turret", () => {
        const walker = build(50, 4);
        walker.setTurret(true);
        for (const [location, inTurret] of [["lfl", false], ["ft", false], ["cs", true]] as [WalkerLocation, boolean][]) {
            const result = walker.addEquipment("medium-laser", location, inTurret);
            expect(result.reason).toBeUndefined();
            expect(result.added).toBe(true);
        }
        expect(walker.getEquipment().map((each) => [each.tag, each.location, each.inTurret])).toEqual([
            ["medium-laser", "lfl", false], ["medium-laser", "ft", false], ["medium-laser", "cs", true],
        ]);
        expect(walker.getSlots("lfl")).toEqual(["Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator", "Medium Laser", null]);
        // Items below the turret mechanism are in the turret (Best-of p.36).
        const cs = walker.getSlots("cs");
        expect(cs.indexOf("Medium Laser")).toBeGreaterThan(cs.lastIndexOf("Turret"));
        expect(walker.getWeightLog().find((line) => line.name === "Equipment")?.weight).toBe(3);
    });

    it("refuses a medium laser in the center torso with the rule; a machine gun, small laser and flamer go in as anti-infantry only", () => {
        const walker = build(50, 4);
        const refused = walker.addEquipment("medium-laser", "ct");
        expect(refused.added).toBe(false);
        expect(refused.reason).toMatch(/machine guns, small lasers and flamers/);
        expect(refused.reason).toMatch(/p\.36/);
        expect(walker.getEquipment()).toHaveLength(0);
        // A standard center torso is full of engine and gyro: make room with a compact engine and gyro.
        expect(walker.setEngineType("compact")).toBe(true);
        expect(walker.setGyroType("compact")).toBe(true);
        for (const tag of ["machine-gun", "small-laser", "standard-flamer"]) expect(walker.addEquipment(tag, "ct").added).toBe(true);
        const ct = walker.getEquipment().filter((each) => each.location === "ct");
        expect(ct).toHaveLength(3);
        expect(ct.every((each) => each.antiInfantryOnly)).toBe(true);
        walker.addEquipment("small-laser", "ft");
        expect(walker.getEquipment().find((each) => each.location === "ft")?.antiInfantryOnly).toBe(false);
    });

    it("lets ammunition, which is not a weapon, into the center torso", () => {
        const walker = build(50, 4);
        walker.setEngineType("compact");
        walker.setGyroType("compact");
        expect(walker.addEquipment("ammo-machine-gun-standard", "ct").added).toBe(true);
    });

    it("puts turret items only in the control section of a walker with a turret", () => {
        const walker = build(50, 4);
        expect(walker.addEquipment("medium-laser", "cs", true).reason).toMatch(/no turret/i);
        walker.setTurret(true);
        expect(walker.addEquipment("medium-laser", "ft", true).reason).toMatch(/control section/i);
        expect(walker.addEquipment("medium-laser", "cs", true).added).toBe(true);
        // A control-section item outside the turret sits above the turret mechanism.
        expect(walker.addEquipment("small-laser", "cs").added).toBe(true);
        const cs = walker.getSlots("cs");
        expect(cs.indexOf("Small Laser")).toBeLessThan(cs.indexOf("Turret"));
        // Taking the turret off reports its items; nothing is deleted.
        walker.setTurret(false);
        expect(walker.getEquipment()).toHaveLength(2);
        expect(walker.getIssues().join(" ")).toMatch(/Medium Laser is in the turret, and the walker has no turret/);
    });

    it("never lets a location's slots or the walker's weight be exceeded", () => {
        const walker = build(50, 4);
        // A leg (6 slots, four actuators) has two free: a large laser (2) fits, then nothing more.
        expect(walker.addEquipment("large-laser", "rfl").added).toBe(true);
        const full = walker.addEquipment("machine-gun", "rfl");
        expect(full.added).toBe(false);
        expect(full.reason).toMatch(/slot/);
        const light = build(20, 4);
        // 10 tons left; an AC/20 weighs 14.
        const over = light.addEquipment("autocannon-standard-d", "cs");
        expect(over.added).toBe(false);
        expect(over.reason).toMatch(/ton/);
        expect(light.getWeight()).toBeLessThanOrEqual(light.getTons());
    });

    it("maps the 'Mech placement limits onto the walker: CASE goes in a torso", () => {
        const walker = build(50, 4);
        expect(walker.addEquipment("case", "lfl").reason).toMatch(/must be placed in/);
        expect(walker.addEquipment("case", "lt").added).toBe(true);
        expect(walker.addEquipment("case", "rrt").added).toBe(true);
    });

    it("offers the 'Mech catalog at the era, minus what a walker cannot mount", () => {
        const walker = build(50, 4);
        const offer = walker.getEquipmentOffer();
        const tags = offer.map((item) => item.tag);
        expect(tags).toContain("medium-laser");
        expect(tags).toContain("ammo-ac-5-standard");
        // Late Succession Wars (2901-3019): no Gauss Rifle yet, and CASE is lost (2840 to 3036).
        expect(tags).not.toContain("standard-gauss-rifle");
        expect(tags).not.toContain("case");
        latestEra(walker);
        const later = walker.getEquipmentOffer();
        expect(later.map((item) => item.tag)).toContain("standard-gauss-rifle");
        expect(later.map((item) => item.tag)).toContain("case");
        // Arm-only items, LAM and QuadVee parts, the 'Mech turret and spread items are not offered.
        expect(later.some((item) => item.requiresLowerArmActuator || item.requiresHandActuator || item.replacesHandActuator)).toBe(false);
        expect(later.some((item) => (item.chassisTypes?.length ?? 0) > 0)).toBe(false);
        expect(later.some((item) => item.variableFormula === "hatchet" || item.variableFormula === "mech-turret")).toBe(false);
        expect(later.some((item) => !!item.spreadLocations || !!item.spreadSlots)).toBe(false);
    });

    it("sizes variable equipment for the walker: MASC by tonnage, a targeting computer by its weapons", () => {
        const walker = build(60, 4);
        latestEra(walker);
        expect(walker.addEquipment("masc", "lt").added).toBe(true);
        expect(walker.getEquipment()[0].weight).toBe(3);
        expect(walker.getEquipment()[0].slots).toBe(3);
        walker.addEquipment("large-laser", "ft");
        walker.addEquipment("large-laser", "rrt");
        expect(walker.addEquipment("targeting-computer", "rt").added).toBe(true);
        expect(walker.getEquipment().find((each) => each.tag === "targeting-computer")?.weight).toBe(3);
    });

    it("industrial walkers: no MASC, Advanced Fire Control items only with it, industrial tools in the legs or outer torsos", () => {
        const walker = build(50, 4);
        walker.setIndustrial(true);
        latestEra(walker);
        expect(walker.addEquipment("masc", "lt").reason).toMatch(/IndustrialMech/);
        expect(walker.addEquipment("beagle-active-probe", "lt").reason).toMatch(/Advanced Fire Control/);
        walker.setAdvancedFireControl(true);
        expect(walker.addEquipment("beagle-active-probe", "lt").added).toBe(true);
        expect(walker.addEquipment("chainsaw", "cs").reason).toMatch(/legs or outer torsos/);
        const big = build(80, 4, true);
        big.setIndustrial(true);
        latestEra(big);
        expect(big.addEquipment("chainsaw", "lfl").added).toBe(true);
    });

    it("needs power amplifiers for energy weapons on an ICE or fuel cell walker (TM p.72)", () => {
        const walker = build(50, 4);
        walker.setIndustrial(true);
        walker.setEngineType("ice");
        walker.addEquipment("medium-laser", "ft");
        walker.addEquipment("medium-laser", "rrt");
        expect(walker.getPowerAmplifierWeight()).toBe(0.5);
        expect(walker.getWeightLog().some((line) => line.name === "Power Amplifiers" && line.weight === 0.5)).toBe(true);
    });

    it("removes equipment by its id", () => {
        const walker = build(50, 4);
        const { uuid } = walker.addEquipment("medium-laser", "ft");
        expect(walker.removeEquipment(uuid!)).toBe(true);
        expect(walker.getEquipment()).toHaveLength(0);
        expect(walker.removeEquipment("nope")).toBe(false);
    });

    it("totals the weapons' heat", () => {
        const walker = build(50, 4);
        walker.addEquipment("medium-laser", "ft");
        walker.addEquipment("small-laser", "rrt");
        expect(walker.getHeat()).toBe(4);
    });
});

// NGCFells's ruling 2026-11-14: "big items can split across adjacent sections, but only into one and only if there is
// enough room." Which locations are adjacent is NGCFells's (WALKER_ADJACENT_LOCATIONS).
describe("Walker split items (NGCFells's ruling)", () => {
    const gaussWalker = (): Walker => {
        const walker = build(50, 4);
        latestEra(walker);
        return walker;
    };

    it("splits a Gauss Rifle (7 slots) from the front torso into one adjacent location with room", () => {
        const walker = gaussWalker();
        const result = walker.addEquipment("standard-gauss-rifle", "ft");
        expect(result.reason).toBeUndefined();
        const gauss = walker.getEquipment()[0];
        // The center torso is next, but a Gauss Rifle is no center-torso weapon; the left front leg has room.
        expect(gauss.split).toEqual({ location: "lfl", slots: 1 });
        expect(walker.getSlots("ft")).toEqual(Array(6).fill("Gauss Rifle"));
        expect(walker.getSlots("lfl")).toEqual(["Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator", "Gauss Rifle", null]);
        expect(walker.getIssues()).toEqual([]);
    });

    it("splits into the adjacent location asked for, and refuses one that is not adjacent", () => {
        const walker = gaussWalker();
        expect(walker.addEquipment("standard-gauss-rifle", "ft", false, { splitInto: "rrl" }).reason).toMatch(/not next to the Front Torso/);
        expect(walker.addEquipment("standard-gauss-rifle", "ft", false, { splitInto: "rfl" }).added).toBe(true);
        expect(walker.getEquipment()[0].split).toEqual({ location: "rfl", slots: 1 });
    });

    it("splits into one location only: an AC/20 (10) does not go 6 + 2 + 2", () => {
        const walker = gaussWalker();
        const result = walker.addEquipment("autocannon-standard-d", "ft");
        expect(result.added).toBe(false);
        expect(result.reason).toMatch(/needs 10 slots/);
        expect(result.reason).toMatch(/one adjacent location/);
    });

    it("does not split an item that fits whole, a one-slot item or a turret item", () => {
        const walker = gaussWalker();
        walker.addEquipment("large-laser", "ft");
        expect(walker.getEquipment()[0].split).toBeUndefined();
        walker.setTurret(true);
        // The standard control section: 6 fixed, 2 turret slots, 4 left; a Gauss Rifle in the turret cannot split.
        expect(walker.addEquipment("standard-gauss-rifle", "cs", true).added).toBe(false);
    });

    it("keeps the split in a save; a save splitting into a location not adjacent drops the split with an issue", () => {
        const walker = gaussWalker();
        walker.addEquipment("standard-gauss-rifle", "ft");
        const copy = new Walker(walker.exportJSON());
        expect(copy.getEquipment()[0].split).toEqual({ location: "lfl", slots: 1 });
        expect(copy.getImportIssues()).toEqual([]);
        const data = walker.export();
        data.equipment![0].split = { location: "rrl", slots: 1 };
        const read = new Walker();
        read.import(data);
        expect(read.getImportIssues().join(" ")).toMatch(/split/i);
        expect(read.getEquipment()[0].split).toBeUndefined();
        expect(read.getIssues().join(" ")).toMatch(/Front Torso needs 7 slots/);
    });
});

describe("Walker heat sinks (as on a 'Mech)", () => {
    it("gets ten weight-free heat sinks with a fusion engine; the engine holds rating / 25 and the rest take slots", () => {
        const walker = build(50, 4); // rating 200: the engine holds 8
        expect(walker.getHeatSinks()).toBe(10);
        expect(walker.getEngineHeatSinkCapacity()).toBe(8);
        expect(walker.getHeatSinkWeight()).toBe(0);
        expect(allSlots(walker).filter((slot) => slot === "Heat Sink")).toHaveLength(2);
        expect(walker.setHeatSinks(12)).toBe(true);
        expect(walker.getHeatSinkWeight()).toBe(2);
        expect(allSlots(walker).filter((slot) => slot === "Heat Sink")).toHaveLength(4);
        expect(walker.setHeatSinks(9)).toBe(false);
        expect(walker.getHeatDissipation()).toBe(12);
    });

    it("takes double heat sinks (3 slots Inner Sphere) when the era has them; an industrial walker takes single only", () => {
        const walker = build(50, 4);
        expect(walker.getHeatSinkTypeOptions()).toEqual(["single"]);
        latestEra(walker);
        expect(walker.getHeatSinkTypeOptions()).toEqual(["single", "double"]);
        expect(walker.setHeatSinkType("double")).toBe(true);
        expect(walker.getHeatDissipation()).toBe(20);
        expect(allSlots(walker).filter((slot) => slot === "Double Heat Sink")).toHaveLength(6);
        walker.setIndustrial(true);
        expect(walker.getHeatSinkTypeOptions()).toEqual(["single"]);
        expect(walker.getIssues().join(" ")).toMatch(/Double heat sinks are not available to an industrial walker/);
    });

    it("an ICE engine brings no free heat sinks, a fission engine five (TM p.71)", () => {
        const walker = build(50, 4);
        walker.setIndustrial(true);
        walker.setEngineType("ice");
        expect(walker.getHeatSinks()).toBe(0);
        walker.setEngineType("fission");
        expect(walker.getHeatSinks()).toBe(5);
    });

    it("reports heat sinks that find no slot", () => {
        const walker = build(10, 10);
        expect(walker.setHeatSinks(60)).toBe(true);
        expect(walker.getIssues().join(" ")).toMatch(/heat sinks? (has|have) no slot/i);
    });
});

describe("Walker jump jets (NGCFells's: legs and outer torsos, by the 'Mech rule)", () => {
    it("places jump jets in the legs first, weighs them by weight class (TM p.51), at most the biped Walking MP", () => {
        const walker = build(50, 4);
        expect(walker.setJumpJets(4)).toBe(true);
        expect(walker.getJumpMP()).toBe(4);
        expect(walker.getJumpJetWeight()).toBe(2);
        for (const leg of ["lfl", "rfl", "lrl", "rrl"] as WalkerLocation[]) expect(walker.getSlots(leg)).toContain("Jump Jet");
        for (const location of ["ct", "cs"] as WalkerLocation[]) expect(walker.getSlots(location)).not.toContain("Jump Jet");
        expect(walker.setJumpJets(5)).toBe(false);
        const heavy = build(60, 4);
        expect(heavy.setJumpJets(2)).toBe(true);
        expect(heavy.getJumpJetWeight()).toBe(2);
        expect(heavy.getWeightLog().some((line) => line.name === "Jump Jets" && line.weight === 2)).toBe(true);
    });

    it("an industrial walker takes standard jump jets only, and none with an ICE or fuel cell", () => {
        const walker = build(50, 4);
        walker.setIndustrial(true);
        expect(walker.getJumpJetTypeOptions()).toEqual(["standard"]);
        walker.setEngineType("ice");
        expect(walker.getJumpJetTypeOptions()).toEqual([]);
        expect(walker.setJumpJets(2)).toBe(false);
    });
});

describe("Walker ammunition (by the 'Mech rules)", () => {
    it("mounts ammunition by the ton and reports a bin no weapon fires", () => {
        const walker = build(50, 4);
        latestEra(walker);
        expect(walker.addEquipment("ammo-ac-5-standard", "lt").added).toBe(true);
        expect(walker.getAmmo()).toHaveLength(1);
        expect(walker.getIssues().join(" ")).toMatch(/AC\/5 - Standard Ammo has no weapon to feed/);
        walker.addEquipment("autocannon-standard-b", "rt");
        expect(walker.getIssues().join(" ")).not.toMatch(/no weapon to feed/);
    });
});

describe("Walker equipment saves", () => {
    it("round-trips equipment, turret items, heat sinks and jump jets; an older save has none", () => {
        const walker = build(50, 4);
        walker.setTurret(true);
        walker.addEquipment("medium-laser", "cs", true);
        walker.addEquipment("machine-gun", "ft");
        walker.setHeatSinks(12);
        walker.setJumpJets(2);
        const copy = new Walker(walker.exportJSON());
        expect(copy.getEquipment().map((each) => [each.tag, each.location, each.inTurret])).toEqual([["medium-laser", "cs", true], ["machine-gun", "ft", false]]);
        expect(copy.getHeatSinks()).toBe(12);
        expect(copy.getJumpMP()).toBe(2);
        expect(copy.getImportIssues()).toEqual([]);
        const older = walker.export();
        delete older.equipment;
        delete older.heatSinks;
        delete older.jumpJets;
        const read = new Walker();
        expect(read.import(older)).toBe(true);
        expect(read.getEquipment()).toEqual([]);
        expect(read.getHeatSinks()).toBe(10);
        expect(read.getJumpMP()).toBe(0);
    });

    it("drops an unknown item or location with an issue, and keeps a misplaced item with an issue", () => {
        const data = build(50, 4).export();
        data.equipment = [
            { tag: "no-such-thing", location: "ft" },
            { tag: "medium-laser", location: "ct" },
            { tag: "small-laser", location: "nowhere" as WalkerLocation },
        ];
        const read = new Walker();
        read.import(data);
        expect(read.getImportIssues().join(" ")).toMatch(/Unknown equipment "no-such-thing"/);
        expect(read.getImportIssues().join(" ")).toMatch(/Unknown location "nowhere"/);
        expect(read.getEquipment().map((each) => each.tag)).toEqual(["medium-laser"]);
        expect(read.getIssues().join(" ")).toMatch(/machine guns, small lasers and flamers/);
    });

    it("an edition switch that shrinks the assault control section reports what no longer fits; nothing is deleted", () => {
        const walker = build(80, 4, true);
        walker.setEdition("future-wars-11");
        while (walker.getFreeSlots("cs") > 0 && walker.addEquipment("machine-gun", "cs").added);
        const count = walker.getEquipment().length;
        expect(count).toBeGreaterThan(2);
        walker.setEdition("best-of-1991");
        expect(walker.getEquipment()).toHaveLength(count);
        expect(walker.getIssues().join(" ")).toMatch(/Control Section/);
    });

    it("a walker opened after the construction ruleset was unticked keeps its items and reports what no longer fits", () => {
        const walker = build(80, 4, true);
        while (walker.getFreeSlots("rfl") > 0 && walker.addEquipment("machine-gun", "rfl").added);
        walker.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, []);
        expect(walker.getEquipment().filter((each) => each.location === "rfl").length).toBeGreaterThan(2);
        expect(walker.getIssues().join(" ")).toMatch(/Right Front Leg/);
    });
});
