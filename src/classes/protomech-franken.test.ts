import { describe, expect, it } from "vitest";
import ProtoMech from "./protomech";
import { getProtoMechStructureRow } from "../data/protomech-construction";

// FrankenProtos: a Custom Homebrew rule (the user's, 2026-10-14) after CO pp.213-214's FrankenMechs.

const franken = (tons: number = 5): ProtoMech => {
    const proto = new ProtoMech();
    proto.setTons(tons);
    proto.setFrankenProto(true);
    return proto;
};

describe("FrankenProtos (Custom Homebrew)", () => {
    it("is offered at the Custom Homebrew rules level", () => {
        expect(new ProtoMech().canBeFrankenProto(4)).toBe(false);
        expect(new ProtoMech().setFrankenProto(true, 5)).toBe(false);
        expect(franken().getRequiredRulesLevel()).toBe(6);
        // Until a donor is set, nothing changes.
        expect(franken().getStructureWeight()).toBe(new ProtoMech().getStructureWeight());
    });

    it("takes each location's structure and armor limit from its donor", () => {
        const proto = franken(5);
        proto.setFrankenProtoDonor("la", { tons: 9, name: "Minotaur" });
        expect(proto.getStructure("la")).toBe(getProtoMechStructureRow(9).arm.structure);
        expect(proto.getMaxArmor("la")).toBe(getProtoMechStructureRow(9).arm.maxArmor);
        expect(proto.getStructure("ra")).toBe(getProtoMechStructureRow(5).arm.structure);
        expect(proto.getFrankenProtoNotes()).toContain("Left Arm: 9-ton ProtoMech (Minotaur)");
    });

    it("weighs each location's share of its donor's structure", () => {
        const proto = franken(5);
        proto.setFrankenProtoDonor("la", { tons: 9 });
        proto.setFrankenProtoDonor("head", { tons: 3 });
        // Torso 0.55 x 500 + head 0.05 x 300 + arms 0.1 x 900 and 0.1 x 500 + legs 0.2 x 500 = 530 kg.
        expect(proto.getStructureWeight()).toBe(530);
    });

    it("takes legs only from a ProtoMech at least as heavy, and Ultraheavy parts only on an Ultraheavy", () => {
        const proto = franken(5);
        expect(proto.getFrankenProtoDonorTons("legs")[0]).toBe(5);
        expect(proto.setFrankenProtoDonor("legs", { tons: 4 }).tons).toBe(5);
        expect(proto.getFrankenProtoDonorTons("la").at(-1)).toBe(9);
        expect(franken(12).getFrankenProtoDonorTons("la").at(-1)).toBe(15);
        // A heavier torso drops legs that are now too light.
        proto.setFrankenProtoDonor("legs", { tons: 6 });
        proto.setTons(8);
        expect(proto.getFrankenProtoDonor("legs").tons).toBe(8);
    });

    it("gives a four-legged FrankenProto's legs 40% and no arms", () => {
        const proto = new ProtoMech();
        proto.setChassis("quad");
        proto.setTons(5);
        proto.setFrankenProto(true);
        expect(proto.getFrankenProtoLocations()).toEqual(["head", "legs"]);
        expect(proto.getFrankenProtoStructureKg("legs")).toBe(200);
        expect(proto.getStructureWeight()).toBe(500);
    });

    it("saves and reloads, checking each donor", () => {
        const proto = franken(5);
        proto.setFrankenProtoDonor("la", { tons: 9, name: "Minotaur" });
        const saved = proto.export();
        const loaded = new ProtoMech(JSON.stringify(saved));
        expect(loaded.isFrankenProto()).toBe(true);
        expect(loaded.getFrankenProtoDonor("la")).toEqual({ tons: 9, name: "Minotaur" });
        const tampered = new ProtoMech(JSON.stringify({ ...saved, frankenProto: { la: { tons: 40, name: 3 }, legs: { tons: 2 } } }));
        expect(tampered.getFrankenProtoDonor("la")).toEqual({ tons: 5, name: "" });
        expect(tampered.getFrankenProtoDonor("legs").tons).toBe(5);
        expect(new ProtoMech(JSON.stringify(new ProtoMech().export())).isFrankenProto()).toBe(false);
    });
});
