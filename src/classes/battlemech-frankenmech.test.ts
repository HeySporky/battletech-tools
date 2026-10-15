import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";

// FrankenMechs (CO pp.213-214): a 'Mech assembled from the body locations of others. The worked example is
// "Shorty" Sneede's 60-ton FrankenMech (CO pp.213-214); the Schwerer Gustav (XTRO:Mercenaries p.7) checks a
// hybrid of standard and endo steel structure.

const build = (options: { tech?: string, type?: string, tonnage?: number, walk?: number } = {}) => {
    const mech = new BattleMech();
    mech.setTech(options.tech ?? "is");
    mech.setEra("dark-ages");
    if (options.type) mech.setMechType(options.type);
    mech.setTonnage(options.tonnage ?? 60);
    mech.setWalkSpeed(options.walk ?? 4);
    if (mech.mirrorArmorAllocations) mech.toggleMirrorArmorAllocations();
    return mech;
};
const franken = (options: Parameters<typeof build>[0] = {}) => {
    const mech = build(options);
    mech.setFrankenMech(true);
    return mech;
};
const add = (mech: BattleMech, tag: string) => mech.addEquipmentFromTag(tag, mech.getTech().tag, "", false, undefined, "", false, [], undefined, undefined);
const slotsOf = (slots: ({ tag: string, crits: number } | null)[], tag: string) => slots.filter(slot => slot && slot.tag === tag).length;

/** Sneede's FrankenMech: a Rifleman's center torso, right torso and legs, a Warhammer's right arm, an Archer's left torso and left arm, a Phoenix Hawk's head. */
const sneede = () => {
    const mech = franken();
    mech.setFrankenMechDonor("centerTorso", { name: "Rifleman" });
    mech.setFrankenMechDonor("rightTorso", { name: "Rifleman" });
    mech.setFrankenMechDonor("leftLeg", { name: "Rifleman" });
    mech.setFrankenMechDonor("rightLeg", { name: "Rifleman" });
    mech.setFrankenMechDonor("rightArm", { tonnage: 70, name: "Warhammer" });
    mech.setFrankenMechDonor("leftTorso", { tonnage: 70, name: "Archer" });
    mech.setFrankenMechDonor("leftArm", { tonnage: 70, name: "Archer" });
    mech.setFrankenMechDonor("head", { tonnage: 45, name: "Phoenix Hawk" });
    return mech;
};

describe("FrankenMechs: availability (CO p.213)", () => {
    it("is offered at the Experimental rules level, in the current rules", () => {
        expect(build().canBeFrankenMech(3)).toBe(false);
        expect(build().canBeFrankenMech(4)).toBe(true);
        expect(build().setFrankenMech(true, 3)).toBe(false);
        expect(franken().getRequiredRulesLevel()).toBe(4);
        expect(build().getRequiredRulesLevel()).toBeLessThan(4);
    });

    it("cannot be an OmniMech", () => {
        const mech = build();
        mech.toggleOmni(4);
        expect(mech.isOmnimech).toBe(true);
        mech.setFrankenMech(true);
        expect(mech.isOmnimech).toBe(false);
        expect(mech.canBeOmniMech(4)).toBe(false);
    });

    it("starts every location as the center torso's 'Mech and changes nothing until a donor is set", () => {
        const plain = build();
        const mech = franken();
        expect(mech.getFrankenMechLocations().map(location => mech.getFrankenMechDonor(location.key).tonnage)).toEqual([60, 60, 60, 60, 60, 60, 60, 60]);
        expect(mech.getInternalStructureWeight()).toBe(plain.getInternalStructureWeight());
        expect(mech.getInternalStructure()).toEqual(plain.getInternalStructure());
        expect(mech.getBattleValue()).toBe(plain.getBattleValue());
    });
});

describe("FrankenMechs: the worked example (CO pp.213-214)", () => {
    it("weighs its structure location by location: 6.275 tons, rounded up to 6.5", () => {
        const mech = sneede();
        expect(mech.getFrankenMechLocationStructureWeight("centerTorso")).toBeCloseTo(1.5);
        expect(mech.getFrankenMechLocationStructureWeight("rightTorso")).toBeCloseTo(0.9);
        expect(mech.getFrankenMechLocationStructureWeight("leftTorso")).toBeCloseTo(1.05);
        expect(mech.getFrankenMechLocationStructureWeight("rightArm")).toBeCloseTo(0.7);
        expect(mech.getFrankenMechLocationStructureWeight("head")).toBeCloseTo(0.225);
        expect(mech.getInternalStructureWeight()).toBe(6.5);
    });

    it("takes each location's structure points, and so its armor limit, from its donor", () => {
        const structure = sneede().getInternalStructure();
        // 70-ton side torso and arms; the 60-ton center torso and legs.
        expect(structure.leftTorso).toBe(15);
        expect(structure.leftArm).toBe(11);
        expect(structure.rightArm).toBe(11);
        expect(structure.rightTorso).toBe(14);
        expect(structure.centerTorso).toBe(20);
        expect(structure.leftLeg).toBe(14);
        // The book's left torso armor, 24 front and 6 rear, needs a 70-ton torso: 2 x 15 = 30.
        expect(structure.leftTorso * 2).toBe(24 + 6);
    });

    it("comes to 60 tons with the book's engine, armor, heat sinks and weapons", () => {
        const mech = sneede();
        mech.setArmorWeight(9);
        mech.setAdditionalHeatSinks(4);
        for (const tag of ["medium-laser", "medium-laser", "medium-laser", "medium-laser", "standard-ppc", "lrm-20", "ammo-lrm-standard", "ammo-lrm-standard"]) {
            add(mech, tag);
        }
        expect(mech.getEngineRating()).toBe(240);
        expect(mech.getRemainingTonnage()).toBe(0);
    });

    it("names its donors in the readout", () => {
        const readout = sneede().makeTROHTML();
        expect(readout).toContain("Standard, FrankenMech");
        expect(readout).toMatch(/Head: 45-ton (&#39;|&#x27;|')Mech \(Phoenix Hawk\), Standard, 3 points/);
    });
});

describe("FrankenMechs: hybrid structure (XTRO:Mercenaries p.7)", () => {
    // The Schwerer Gustav: endo steel arms from a 65-ton 'Mech and right torso from a 70-ton one, the rest standard.
    const gustav = () => {
        const mech = franken({ tonnage: 100 });
        mech.setFrankenMechDonor("leftArm", { tonnage: 65, structure: "endo-steel" });
        mech.setFrankenMechDonor("rightArm", { tonnage: 65, structure: "endo-steel" });
        mech.setFrankenMechDonor("rightTorso", { tonnage: 70, structure: "endo-steel" });
        return mech;
    };

    it("weighs 8 tons, as printed", () => {
        // 3.5 x 0.1 x 2 + 3.5 x 0.15 + 10 x (0.15 + 0.25 + 0.05 + 0.1 x 2) = 7.725, rounded up.
        expect(gustav().getInternalStructureWeight()).toBe(8);
        expect(gustav().getInternalStructureLabel()).toBe("Hybrid, FrankenMech");
    });

    it("has the printed structure points", () => {
        const structure = gustav().getInternalStructure();
        expect(structure.rightTorso).toBe(15);
        expect(structure.leftTorso).toBe(21);
        expect(structure.leftArm).toBe(10);
        expect(structure.leftLeg).toBe(21);
    });

    it("puts each endo steel location's slots in that location (Internal Structure Distribution Table, CO p.212)", () => {
        const mech = gustav();
        const criticals = mech.getCriticals();
        expect(slotsOf(criticals.leftArm, "endo-steel")).toBe(2);
        expect(slotsOf(criticals.rightArm, "endo-steel")).toBe(2);
        expect(slotsOf(criticals.rightTorso, "endo-steel")).toBe(3);
        expect(slotsOf(criticals.leftTorso, "endo-steel")).toBe(0);
        expect(criticals.leftArm.find(slot => slot?.tag === "endo-steel")?.rollAgain).toBe(true);
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
    });

    it("uses the compact column for Clan endo steel", () => {
        const mech = franken({ tech: "clan" });
        mech.setFrankenMechDonor("leftArm", { structure: "endo-steel" });
        mech.setFrankenMechDonor("head", { structure: "endo-steel" });
        expect(mech.getFrankenMechLocationStructureSlots("leftArm")).toBe(1);
        expect(mech.getFrankenMechLocationStructureSlots("head")).toBe(0);
    });

    it("values each location's structure by its own type", () => {
        const mech = franken();
        mech.setFrankenMechDonor("leftArm", { structure: "reinforced" });
        expect(mech.getBVCalcHTML()).toContain("Internal Structure (Left Arm): 10 points x 1.5 x 2 (Reinforced) = 30.00");
        expect(mech.getBattleValue()).toBeGreaterThan(franken().getBattleValue());
    });
});

describe("FrankenMechs: structure slots kept from the donor's design (CO pp.212-213)", () => {
    // The Royal Fantasy Hunchbacks are Mixed Tech, with Inner Sphere and Clan endo steel side by side (XTRO:Royal
    // Fantasy p.8; MegaMek's files give the slots of each location).
    const anastasia = () => {
        const mech = franken({ tech: "mis", tonnage: 50 });
        for (const key of ["leftArm", "rightArm", "head"]) mech.setFrankenMechDonor(key, { structure: "endo-steel", structureTechBase: "clan" });
        for (const key of ["leftTorso", "leftLeg", "rightLeg"]) mech.setFrankenMechDonor(key, { structure: "endo-steel", structureTechBase: "is" });
        // Its Pinion head kept a Clan endo steel slot that the table does not give a head.
        mech.setFrankenMechDonor("head", { structureSlots: 1 });
        return mech;
    };

    it("builds Anastasia's hybrid structure: 3.5 tons, as printed", () => {
        const mech = anastasia();
        expect(mech.getInternalStructureWeight()).toBe(3.5);
        expect(mech.getFrankenMechTableStructureSlots("head")).toBe(0);
        expect(mech.getFrankenMechLocationStructureSlots("head")).toBe(1);
        expect(mech.getFrankenMechLocationStructureSlots("leftArm")).toBe(1);
        expect(mech.getFrankenMechLocationStructureSlots("leftTorso")).toBe(3);
        expect(slotsOf(mech.getCriticals().head, "endo-steel")).toBe(1);
        expect(mech.getCriticals().head.find(slot => slot?.tag === "endo-steel")?.name).toBe("Endo-Steel (Clan)");
        expect(mech.getCriticals().leftTorso.find(slot => slot?.tag === "endo-steel")?.name).toBe("Endo-Steel (IS)");
    });

    it("builds Drizella's: 3.5 tons, as printed", () => {
        const mech = franken({ tech: "mis", tonnage: 50 });
        for (const key of ["leftTorso", "rightTorso"]) mech.setFrankenMechDonor(key, { structure: "endo-steel", structureTechBase: "clan" });
        for (const key of ["centerTorso", "head"]) mech.setFrankenMechDonor(key, { structure: "endo-steel", structureTechBase: "is" });
        // The center torso's structure is the 'Mech's own, chosen in step 1.
        mech.setInternalStructureType("endo-steel");
        for (const key of ["leftArm", "rightArm", "leftLeg", "rightLeg"]) mech.setFrankenMechDonor(key, { structure: "standard" });
        expect(mech.getInternalStructureWeight()).toBe(3.5);
        expect(mech.getFrankenMechLocationStructureSlots("rightTorso")).toBe(1);
        expect(mech.getFrankenMechLocationStructureSlots("centerTorso")).toBe(1);
    });

    it("keeps the Ninjabolt's two endo steel slots in its right leg", () => {
        const mech = franken({ tonnage: 65 });
        for (const key of ["rightArm", "leftLeg", "rightLeg"]) mech.setFrankenMechDonor(key, { structure: "endo-steel" });
        mech.setFrankenMechDonor("rightLeg", { structureSlots: 2 });
        mech.setFrankenMechDonor("rightArm", { structureSlots: 2 });
        expect(slotsOf(mech.getCriticals().rightLeg, "endo-steel")).toBe(2);
        expect(slotsOf(mech.getCriticals().leftLeg, "endo-steel")).toBe(1);
        // XTRO:Boondocks p.6 prints 7 tons, which is each location rounded up on its own; the rule rounds the sum (CO
        // p.213; SO p.190 as well), as the Schwerer Gustav's and the Hunchbacks' printed weights do: 5.6, so 6.
        expect(mech.getInternalStructureWeight()).toBe(6);
    });

    it("takes only slot counts the structure has, and 0 for the table again", () => {
        const mech = franken();
        mech.setFrankenMechDonor("leftArm", { structure: "endo-steel" });
        expect(mech.getFrankenMechDonorSlotCounts("leftArm")).toHaveLength(14);
        expect(mech.setFrankenMechDonor("leftArm", { structureSlots: 15 }).structureSlots).toBeUndefined();
        expect(mech.setFrankenMechDonor("leftArm", { structureSlots: 4 }).structureSlots).toBe(4);
        expect(mech.setFrankenMechDonor("leftArm", { structureSlots: 0 }).structureSlots).toBeUndefined();
        // A tech base the 'Mech cannot mix is ignored, and standard structure has no slots to keep.
        expect(mech.setFrankenMechDonor("leftArm", { structureTechBase: "clan" }).structureTechBase).toBe("is");
        expect(mech.getFrankenMechDonorSlotCounts("rightArm")).toEqual([]);
    });
});

describe("FrankenMechs: limits (CO p.213)", () => {
    it("takes legs only from 'Mechs of the same tonnage or heavier", () => {
        const mech = franken({ tonnage: 35 });
        expect(mech.getFrankenMechDonorTonnages("leftLeg")[0]).toBe(35);
        expect(mech.getFrankenMechDonorTonnages("leftArm")[0]).toBeLessThan(35);
        expect(mech.setFrankenMechDonor("leftLeg", { tonnage: 30 }).tonnage).toBe(35);
        expect(mech.setFrankenMechDonor("leftLeg", { tonnage: 50 }).tonnage).toBe(50);
        // A heavier FrankenMech drops legs that are now too light.
        mech.setTonnage(55);
        expect(mech.getFrankenMechDonor("leftLeg").tonnage).toBe(55);
        expect(mech.getFrankenMechDonorTonnages("centerTorso")).toEqual([55]);
    });

    it("makes Piloting Skill Rolls harder when the legs differ", () => {
        const mech = franken();
        expect(mech.getFrankenMechLegPilotingModifier()).toBe(0);
        mech.setFrankenMechDonor("leftLeg", { name: "Archer" });
        expect(mech.getFrankenMechLegPilotingModifier()).toBe(1);
        mech.setFrankenMechDonor("leftLeg", { tonnage: 70 });
        expect(mech.getFrankenMechLegPilotingModifier()).toBe(2);
        expect(mech.getPilotingSkillModifier()).toBe(2);
    });

    it("lets lighter jump jets stay, at reduced performance: six half-ton jets on 60 tons give 3 MP and 6 heat", () => {
        const mech = franken();
        expect(mech.getFrankenMechJumpJetClasses()).toEqual(["light"]);
        mech.setFrankenMechJumpJetClass("light");
        expect(mech.getMaxJumpJetCount()).toBe(8);
        mech.setJumpSpeed(6);
        expect(mech.getJumpSpeed()).toBe(3);
        expect(mech.getJumpHeat()).toBe(6);
        expect(mech.getJumpJetWeight()).toBe(3);
        // Five give 2 MP: "fractional Jumping MPs are dropped".
        mech.setJumpSpeed(5);
        expect(mech.getJumpSpeed()).toBe(2);
        // Heavier jets cannot be mounted (CO errata v4.0), nor any on a 55-ton 'Mech, whose own are the lightest.
        expect(mech.setFrankenMechJumpJetClass("heavy")).toBe("light");
        expect(franken({ tonnage: 55, walk: 4 }).getFrankenMechJumpJetClasses()).toEqual([]);
        // Back to its own size, the count is held to its Walking MP.
        mech.setFrankenMechJumpJetClass(null);
        expect(mech.getJumpSpeed()).toBe(4);
    });

    it("needs standard myomer with MASC", () => {
        const mech = franken();
        add(mech, "masc");
        expect(mech.getChassisEquipmentViolations()).toEqual([]);
        mech.setMyomerType("tsm");
        expect(mech.getChassisEquipmentViolations()).toContain("FrankenMech: with MASC installed, only standard myomer can be used.");
    });

    it("is not offered by an earlier rules edition", () => {
        const mech = franken();
        mech.setRulesEdition("battledroids");
        expect(mech.isFrankenMech()).toBe(false);
        expect(mech.canBeFrankenMech(4)).toBe(false);
    });
});

describe("FrankenMechs: saving", () => {
    it("saves and reloads its donors and jump jets", () => {
        const mech = sneede();
        mech.setFrankenMechJumpJetClass("light");
        mech.setJumpSpeed(6);
        const saved = mech.export();
        expect(saved.frankenMech?.donors.head).toEqual({ tonnage: 45, structure: "standard", name: "Phoenix Hawk", structureTechBase: "is" });
        const loaded = new BattleMech(JSON.stringify(saved));
        expect(loaded.isFrankenMech()).toBe(true);
        expect(loaded.getFrankenMechDonor("leftArm")).toEqual({ tonnage: 70, structure: "standard", name: "Archer", structureTechBase: "is" });
        expect(loaded.getInternalStructureWeight()).toBe(6.5);
        expect(loaded.getJumpSpeed()).toBe(3);
        expect(loaded.getJumpJetCount()).toBe(6);
    });

    it("ignores donor values a 'Mech may not take", () => {
        const saved = sneede().export();
        const tampered = { ...saved, frankenMech: { donors: { ...saved.frankenMech!.donors, leftLeg: { tonnage: 20, structure: "<script>", name: 5 } } } };
        const loaded = new BattleMech(JSON.stringify(tampered));
        expect(loaded.getFrankenMechDonor("leftLeg")).toEqual({ tonnage: 60, structure: "standard", name: "", structureTechBase: "is" });
        expect(new BattleMech(JSON.stringify(build().export())).isFrankenMech()).toBe(false);
    });
});
