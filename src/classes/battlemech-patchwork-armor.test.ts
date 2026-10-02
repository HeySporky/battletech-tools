import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { mechArmorTypes } from "../data/mech-armor-types";

const build = (options: { tech?: string, era?: string, type?: string, tonnage?: number, structure?: string } = {}) => {
    const mech = new BattleMech();
    mech.setTech(options.tech ?? "is");
    mech.setEra(options.era ?? "dark-ages");
    if (options.type) mech.setMechType(options.type);
    mech.setTonnage(options.tonnage ?? 55);
    if (options.structure) mech.setInternalStructureType(options.structure);
    mech.setWalkSpeed(3);
    // The tests set one side at a time.
    if (mech.mirrorArmorAllocations) mech.toggleMirrorArmorAllocations();
    return mech;
};
const patchwork = (options: Parameters<typeof build>[0] = {}) => {
    const mech = build(options);
    mech.setArmorType("patchwork");
    return mech;
};
const offered = (list: { tag: string, available?: boolean }[]) => list.filter(item => item.available).map(item => item.tag);
const tags = (list: { tag: string }[]) => list.map(item => item.tag);
const armor = (tag: string) => mechArmorTypes.find(item => item.tag === tag);
const add = (mech: BattleMech, tag: string) => mech.addEquipmentFromTag(tag, mech.getTech().tag, "", false, undefined, "", false, [], undefined, undefined);
const weightOf = (mech: BattleMech, name: string) => mech.getWeightBreakdown().find(entry => entry.name === name)?.weight;
const slotsOf = (slots: ({ tag: string, crits: number } | null)[], tag: string) => slots.filter(slot => slot && slot.tag === tag).map(slot => slot!.crits);

describe("Patchwork Armor: availability (TO:AUE p.189)", () => {
    it("is offered from 3075 at the Advanced rules level", () => {
        expect(offered(build().getAvailableArmorTypes(3))).toContain("patchwork");
        expect(offered(build().getAvailableArmorTypes(2))).not.toContain("patchwork");
        expect(offered(build({ era: "clan-inv" }).getAvailableArmorTypes(4))).not.toContain("patchwork");
    });

    it("needs the Advanced rules level", () => {
        expect(build().getRequiredRulesLevel()).toBeLessThan(3);
        expect(patchwork().getRequiredRulesLevel()).toBe(3);
    });

    it("starts every location on Standard armor", () => {
        const mech = patchwork();
        expect(mech.isPatchworkArmor()).toBe(true);
        expect(mech.getPatchworkLocations().map(location => location.key))
            .toEqual(["head", "centerTorso", "leftTorso", "rightTorso", "leftArm", "rightArm", "leftLeg", "rightLeg"]);
        for (const location of mech.getPatchworkLocations()) {
            expect(mech.getPatchworkArmorType(location.key).tag, location.key).toBe("standard");
        }
        expect(build().isPatchworkArmor()).toBe(false);
    });

    it("follows the chassis for its locations", () => {
        expect(patchwork({ type: "quad" }).getPatchworkLocations().map(location => location.key))
            .toEqual(["head", "centerTorso", "leftTorso", "rightTorso", "frontLeftLeg", "frontRightLeg", "leftLeg", "rightLeg"]);
        expect(patchwork({ type: "tripod" }).getPatchworkLocations().map(location => location.key))
            .toEqual(["head", "centerTorso", "leftTorso", "rightTorso", "leftArm", "rightArm", "leftLeg", "rightLeg", "centerLeg"]);
    });

    it("offers a location only the armor types legal for the unit", () => {
        const battleMech = tags(patchwork().getAvailablePatchworkArmorTypes(3));
        expect(battleMech).toEqual(expect.arrayContaining(["standard", "ferro-fibrous", "light-ferro-fibrous", "heavy-ferro-fibrous", "stealth-basic", "hardened", "laser-reflective", "reactive"]));
        // "Modular Armor is treated as an item, not as armor"; Ferro-Lamellor is Clan armor; Commercial and Industrial are IndustrialMech armor.
        for (const tag of ["patchwork", "modular", "ferro-lamellor", "commercial", "industrial", "primitive", "ferro-fibrous-prototype"]) {
            expect(battleMech, tag).not.toContain(tag);
        }
        expect(tags(patchwork({ tech: "clan" }).getAvailablePatchworkArmorTypes(3)))
            .toEqual(["standard", "ferro-fibrous", "hardened", "laser-reflective", "reactive", "ferro-lamellor", "heat-dissipating"]);
        expect(tags(patchwork({ structure: "industrial" }).getAvailablePatchworkArmorTypes(3)))
            .toEqual(["standard", "industrial", "commercial"]);
    });

    it("refuses an armor type the unit cannot mount", () => {
        const mech = patchwork();
        expect(mech.setPatchworkArmorType("leftArm", "commercial").tag).toBe("standard");
        expect(mech.setPatchworkArmorType("leftArm", "ferro-lamellor").tag).toBe("standard");
        expect(mech.setPatchworkArmorType("leftArm", "patchwork").tag).toBe("standard");
        expect(mech.setPatchworkArmorType("leftArm", "hardened").tag).toBe("hardened");
        expect(mech.getPatchworkArmorType("rightArm").tag).toBe("standard");
    });

    it("is open to IndustrialMechs and closed to Primitive 'Mechs", () => {
        expect(patchwork({ structure: "industrial" }).isPatchworkArmor()).toBe(true);
        const primitive = build();
        primitive.setPrimitive(true);
        primitive.setArmorType("patchwork");
        expect(primitive.isPatchworkArmor()).toBe(false);
        expect(offered(primitive.getAvailableArmorTypes(4))).not.toContain("patchwork");
    });
});

describe("Patchwork Armor: weight (TO:AUE pp.188-189)", () => {
    it("matches the book's Griffin: 18 points of ferro-fibrous on the arm weigh 1.5 tons, 17 points weigh 1 ton", () => {
        const griffin = patchwork({ tonnage: 55 });
        expect(griffin.getInternalStructure().rightArm).toBe(9);
        expect(griffin.setPatchworkArmorType("rightArm", "ferro-fibrous").tag).toBe("ferro-fibrous");
        expect(griffin.getPatchworkLocationSlots("rightArm")).toBe(2);
        griffin.setRightArmArmor(18);
        expect(griffin.getPatchworkLocationWeight("rightArm")).toBe(1.5);
        griffin.setRightArmArmor(17);
        expect(griffin.getPatchworkLocationWeight("rightArm")).toBe(1);
    });

    it("rounds each location up to the half ton and adds the locations up", () => {
        const mech = patchwork();
        mech.setPatchworkArmorType("rightArm", "ferro-fibrous");
        mech.setHeadArmor(9);            // 9 x 0.0625 = 0.5625 -> 1
        mech.setCenterTorsoArmor(20);
        mech.setCenterTorsoRearArmor(6); // 26 x 0.0625 = 1.625 -> 2
        mech.setRightArmArmor(17);       // 17 x 0.0558 = 0.9486 -> 1
        expect(mech.getPatchworkLocationWeight("head")).toBe(1);
        expect(mech.getPatchworkLocationWeight("centerTorso")).toBe(2);
        expect(mech.getPatchworkLocationWeight("leftLeg")).toBe(0);
        expect(mech.getArmorWeight()).toBe(4);
        expect(weightOf(mech, "Armor")).toBe(4);
        expect(mech.getTotalArmor()).toBe(52);
        expect(mech.getUnallocatedArmor()).toBe(0);
    });

    it("uses the tons-per-point figures printed in the tables", () => {
        const perPoint = (tag: string, base: "is" | "clan") => armor(tag)?.patchwork?.tonsPerPoint[base];
        expect([perPoint("standard", "is"), perPoint("standard", "clan")]).toEqual([0.0625, 0.0625]);
        expect(perPoint("stealth-basic", "is")).toBe(0.0625);
        expect(perPoint("light-ferro-fibrous", "is")).toBe(0.0590);
        expect([perPoint("ferro-fibrous", "is"), perPoint("ferro-fibrous", "clan")]).toEqual([0.0558, 0.0521]);
        expect(perPoint("heavy-ferro-fibrous", "is")).toBe(0.0504);
        expect(perPoint("industrial", "is")).toBe(0.0933);
        expect(perPoint("commercial", "is")).toBe(0.0417);
        expect(perPoint("ferro-lamellor", "clan")).toBe(0.0714);
        expect(perPoint("hardened", "is")).toBe(0.1250);
        expect([perPoint("laser-reflective", "is"), perPoint("laser-reflective", "clan")]).toEqual([0.0625, 0.0625]);
        expect([perPoint("reactive", "is"), perPoint("reactive", "clan")]).toEqual([0.0625, 0.0625]);
        // IO:AE p.82, Patchwork Armor Addendum.
        expect(perPoint("anti-penetrative-ablation", "is")).toBe(0.0833);
        expect(perPoint("ballistic-reinforced", "is")).toBe(0.0833);
        expect(perPoint("heat-dissipating", "is")).toBe(0.1000);
        expect(perPoint("impact-resistant", "is")).toBe(0.0714);
    });

    it("lists the 'Mech critical slots per location printed in the tables", () => {
        const slots = (tag: string) => armor(tag)?.patchwork?.slots;
        expect(slots("standard")).toEqual({ is: 0, clan: 0 });
        expect(slots("stealth-basic")).toEqual({ is: 2 });
        expect(slots("light-ferro-fibrous")).toEqual({ is: 1 });
        expect(slots("ferro-fibrous")).toEqual({ is: 2, clan: 1 });
        expect(slots("heavy-ferro-fibrous")).toEqual({ is: 3 });
        expect(slots("industrial")).toEqual({ is: 0, clan: 0 });
        expect(slots("commercial")).toEqual({ is: 0, clan: 0 });
        expect(slots("ferro-lamellor")).toEqual({ clan: 2 });
        expect(slots("hardened")).toEqual({ is: 0, clan: 0 });
        expect(slots("laser-reflective")).toEqual({ is: 2, clan: 1 });
        expect(slots("reactive")).toEqual({ is: 2, clan: 1 });
        expect(slots("anti-penetrative-ablation")).toEqual({ is: 1 });
        expect(slots("ballistic-reinforced")).toEqual({ is: 2 });
        expect(slots("heat-dissipating")).toEqual({ is: 1, clan: 1 });
        expect(slots("impact-resistant")).toEqual({ is: 2 });
        expect(slots("modular")).toBeUndefined();
        expect(slots("patchwork")).toBeUndefined();
    });

    it("weighs Clan ferro-fibrous by the printed 0.0521, so 48 points come to 3 tons", () => {
        // 48 / 19.2 is exactly 2.5 tons; the table's rounded figure gives 2.5008, which rounds up.
        const mech = patchwork({ tech: "clan", tonnage: 100 });
        mech.setPatchworkArmorType("centerTorso", "ferro-fibrous");
        mech.setCenterTorsoArmor(40);
        mech.setCenterTorsoRearArmor(8);
        expect(mech.getPatchworkLocationSlots("centerTorso")).toBe(1);
        expect(mech.getPatchworkLocationWeight("centerTorso")).toBe(3);
    });

    it("gives Allocate Max the chassis maximum and the weight that follows from it", () => {
        const mech = patchwork();
        mech.allocateArmorMax();
        expect(mech.getTotalArmor()).toBe(mech.getMaxArmor());
        const sum = mech.getPatchworkLocations().reduce((total, location) => total + mech.getPatchworkLocationWeight(location.key), 0);
        expect(mech.getArmorWeight()).toBe(sum);
        expect(mech.getUnallocatedArmor()).toBe(0);
    });

    it("goes back to tonnage-based armor when another armor type is chosen", () => {
        const mech = patchwork();
        mech.setHeadArmor(9);
        mech.setArmorType("standard");
        expect(mech.isPatchworkArmor()).toBe(false);
        mech.setArmorWeight(5);
        expect(mech.getArmorWeight()).toBe(5);
        expect(mech.getUnallocatedArmor()).toBe(71);
    });
});

describe("Patchwork Armor: weight accounting switch (TO:AUE p.188)", () => {
    it("rounds a location up to the half ton under standard accounting and to the kilogram under fractional accounting", () => {
        expect(BattleMech.roundPatchworkArmorWeight(1.0044, "standard")).toBe(1.5);
        expect(BattleMech.roundPatchworkArmorWeight(0.9486, "standard")).toBe(1);
        expect(BattleMech.roundPatchworkArmorWeight(1, "standard")).toBe(1);
        expect(BattleMech.roundPatchworkArmorWeight(0, "standard")).toBe(0);
        expect(BattleMech.roundPatchworkArmorWeight(1.0044, "fractional")).toBe(1.005);
        expect(BattleMech.roundPatchworkArmorWeight(0.9486, "fractional")).toBe(0.949);
        expect(BattleMech.roundPatchworkArmorWeight(1, "fractional")).toBe(1);
    });

    it("stays on standard accounting: fractional accounting is not built yet", () => {
        const mech = patchwork();
        expect(BattleMech.FRACTIONAL_ACCOUNTING_AVAILABLE).toBe(false);
        expect(mech.getWeightAccounting()).toBe("standard");
        expect(mech.setWeightAccounting("fractional")).toBe("standard");
        expect(mech.getWeightAccounting()).toBe("standard");
        mech.setPatchworkArmorType("rightArm", "ferro-fibrous");
        mech.setRightArmArmor(18);
        expect(mech.getPatchworkLocationWeight("rightArm")).toBe(1.5);
    });
});

describe("Patchwork Armor: critical slots (TO:AUE p.189)", () => {
    it("puts the slots in the location that carries the armor", () => {
        const mech = patchwork();
        mech.setPatchworkArmorType("rightArm", "ferro-fibrous");
        mech.setPatchworkArmorType("leftTorso", "heavy-ferro-fibrous");
        const criticals = mech.getCriticals();
        expect(slotsOf(criticals.rightArm, "ferro-fibrous")).toEqual([1, 1]);
        expect(slotsOf(criticals.leftTorso, "heavy-ferro-fibrous")).toEqual([1, 1, 1]);
        expect(slotsOf(criticals.leftArm, "ferro-fibrous")).toEqual([]);
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
    });

    it("fits the armor around equipment already placed in the location, and keeps it there through a save and a load", () => {
        const mech = patchwork();
        const laser = add(mech, "medium-laser")!;
        const freeSlot = mech.getCriticals().rightArm.findIndex(slot => !slot);
        expect(mech.moveCritical("un", mech.unallocatedCriticals.findIndex(critical => critical?.uuid === laser.uuid), "ra", freeSlot)).toBe(true);
        mech.setPatchworkArmorType("rightArm", "ferro-fibrous");
        for (const design of [mech, new BattleMech(mech.exportJSON())]) {
            const rightArm = design.getCriticals().rightArm;
            expect(rightArm[freeSlot]?.tag).toBe("medium-laser");
            expect(slotsOf(rightArm, "ferro-fibrous")).toEqual([1, 1]);
            expect(design.unallocatedCriticals.some(critical => critical?.tag === "ferro-fibrous")).toBe(false);
            expect(design.getChassisEquipmentViolations()).toEqual([]);
        }
    });

    it("takes one slot for Clan ferro-fibrous", () => {
        const mech = patchwork({ tech: "clan" });
        mech.setPatchworkArmorType("rightArm", "ferro-fibrous");
        expect(slotsOf(mech.getCriticals().rightArm, "ferro-fibrous")).toEqual([1]);
    });

    it("reports a location with no room for its armor", () => {
        // The head has one open slot; Inner Sphere ferro-fibrous needs two.
        const mech = patchwork();
        mech.setPatchworkArmorType("head", "ferro-fibrous");
        expect(mech.getChassisEquipmentViolations())
            .toEqual(["Patchwork Armor: Ferro Fibrous needs 2 free critical slots in the Head."]);
    });

    it("mounts Stealth armor as plain plating: two slots, no stealth system", () => {
        const mech = patchwork();
        const baseHeat = mech.getMaxMovementHeat();
        mech.setPatchworkArmorType("rightArm", "stealth-basic");
        mech.setRightArmArmor(16);
        expect(mech.getPatchworkLocationSlots("rightArm")).toBe(2);
        expect(mech.getPatchworkLocationWeight("rightArm")).toBe(1);
        expect(mech.getMaxMovementHeat()).toBe(baseHeat);
        expect(mech.getAlphaStrikeForceStats().abilities).not.toContain("STL");
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
    });
});

describe("Patchwork Armor: Battle Value and cost (TO:AUE p.194)", () => {
    it("has the Battle Value of a single-type design when every location is Standard", () => {
        const plain = build();
        plain.setArmorWeight(4);
        plain.setHeadArmor(9);
        plain.setCenterTorsoArmor(20);
        const mixed = patchwork();
        mixed.setHeadArmor(9);
        mixed.setCenterTorsoArmor(20);
        expect(mixed.getBattleValue()).toBe(plain.getBattleValue());
    });

    it("applies each armor type's modifier to its own location, then multiplies the sum by 2.5", () => {
        const mech = patchwork();
        mech.setPatchworkArmorType("leftArm", "hardened");
        mech.setPatchworkArmorType("rightArm", "ferro-fibrous");
        mech.setHeadArmor(9);
        mech.setCenterTorsoArmor(20);
        mech.setCenterTorsoRearArmor(6);
        mech.setLeftArmArmor(10);
        mech.setRightArmArmor(7);
        // 9 + 26 + (10 x 2 for Hardened) + 7 = 62.
        expect(mech.getBVCalcHTML()).toContain("Left Arm: 10 x 2 (Hardened Armor) = 20");
        expect(mech.getBVCalcHTML()).toContain("Total Armor Factor = Armor Factor x 2.5: 155 = 2.5 x 62");
    });

    it("prices each location's armor at its own type's cost per ton", () => {
        const mech = patchwork();
        mech.setPatchworkArmorType("rightArm", "ferro-fibrous");
        mech.setHeadArmor(9);      // 1 ton of Standard: 10,000
        mech.setRightArmArmor(17); // 1 ton of Ferro-Fibrous: 20,000
        expect(mech.getArmorCost()).toBe(30000);
        const plain = build();
        plain.setArmorWeight(4);
        expect(plain.getArmorCost()).toBe(40000);
    });
});

describe("Patchwork Armor: HarJel repair systems (IO:AE pp.82-83)", () => {
    const place = (mech: BattleMech, item: { uuid?: string }, loc: string, key: string) =>
        mech.moveCritical("un", mech.unallocatedCriticals.findIndex(critical => critical?.uuid === item.uuid), loc, (mech.getCriticals() as any)[key].findIndex((critical: unknown) => !critical));

    it("accepts a repair system only over an armor type it works with", () => {
        const mech = patchwork({ tech: "clan" });
        mech.setPatchworkArmorType("leftTorso", "hardened");
        const harjel = add(mech, "clan-harjel-ii")!;
        expect(place(mech, harjel, "rt", "rightTorso")).toBe(true);
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
        mech.setPatchworkArmorType("rightTorso", "hardened");
        expect(mech.getChassisEquipmentViolations()).toEqual(["HarJel II Self-Repair System does not work with Hardened armor."]);
    });

    it("multiplies the armor Battle Value of its location together with that location's armor modifier", () => {
        const mech = patchwork({ tech: "clan" });
        mech.setPatchworkArmorType("rightTorso", "ferro-fibrous");
        mech.setRightTorsoArmor(20);
        const harjel = add(mech, "clan-harjel-ii")!;
        expect(place(mech, harjel, "rt", "rightTorso")).toBe(true);
        expect(mech.getBVCalcHTML()).toContain("HarJel II Self-Repair System in rightTorso: armor x 1.1 on 20 points = +5.00");
    });
});

describe("Patchwork Armor: technical readout", () => {
    it("lists the armor type and weight of each location", () => {
        const mech = patchwork();
        mech.setPatchworkArmorType("rightArm", "ferro-fibrous");
        mech.setRightArmArmor(17);
        mech.setHeadArmor(9);
        for (const readout of [mech.makeTROHTML(), mech.makeTROBBCode()]) {
            expect(readout).toContain("Patchwork Armor");
            expect(readout).toContain("Right Arm: Ferro Fibrous, 1 ton");
            expect(readout).toContain("Head: Standard, 1 ton");
            expect(readout).toContain("Left Leg: Standard, 0 tons");
        }
    });
});

describe("Patchwork Armor: saved designs", () => {
    it("keeps the armor type of every location through a save and a load", () => {
        const mech = patchwork();
        mech.setPatchworkArmorType("rightArm", "ferro-fibrous");
        mech.setPatchworkArmorType("leftTorso", "hardened");
        mech.setRightArmArmor(17);
        mech.setLeftTorsoArmor(8);
        const saved = JSON.parse(mech.exportJSON());
        expect(saved.armor_type).toBe("patchwork");
        expect(saved.patchworkArmor).toMatchObject({ rightArm: "ferro-fibrous", leftTorso: "hardened", head: "standard" });
        const loaded = new BattleMech(mech.exportJSON());
        expect(loaded.isPatchworkArmor()).toBe(true);
        expect(loaded.getPatchworkArmorType("rightArm").tag).toBe("ferro-fibrous");
        expect(loaded.getPatchworkArmorType("leftTorso").tag).toBe("hardened");
        expect(loaded.getArmorWeight()).toBe(mech.getArmorWeight());
        expect(loaded.getArmorWeight()).toBe(2);
        expect(slotsOf(loaded.getCriticals().rightArm, "ferro-fibrous")).toEqual([1, 1]);
    });

    it("does not write the patchwork table for a single-type design", () => {
        expect(JSON.parse(build().exportJSON()).patchworkArmor).toBeUndefined();
    });
});
