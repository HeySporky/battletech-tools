import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";

/** Compact 'Mechs plan, Chunk A (#172): every location's slot count comes from `getLocationSlotCount`. */
const build = (type: string, tonnage: number = 50, edition?: string): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-ages");
    mech.setTonnage(tonnage);
    mech.setWalkSpeed(4);
    if (edition) mech.setRulesEdition(edition);
    mech.setMechType(type);
    return mech;
};

const TAGS = ["hd", "ct", "lt", "rt", "la", "ra", "ll", "rl", "cl", "fll", "frl"];
const counts = (mech: BattleMech) => Object.fromEntries(TAGS.map(tag => [tag, mech.getLocationSlotCount(tag)]));
const torsoAndHead = { hd: 6, ct: 12, lt: 12, rt: 12 };

describe("BattleMech.getLocationSlotCount: the slot counts the class laid out before Chunk A", () => {
    it("gives a biped 6 in the head and legs, 12 in the torsos and arms, and 0 where it has no location", () => {
        expect(counts(build("biped"))).toEqual({ ...torsoAndHead, la: 12, ra: 12, ll: 6, rl: 6, cl: 0, fll: 0, frl: 0 });
    });

    it("gives a LAM the biped's counts", () => {
        expect(counts(build("lam"))).toEqual({ ...torsoAndHead, la: 12, ra: 12, ll: 6, rl: 6, cl: 0, fll: 0, frl: 0 });
    });

    it("gives a quad four 6-slot legs and no arms", () => {
        expect(counts(build("quad"))).toEqual({ ...torsoAndHead, la: 0, ra: 0, ll: 6, rl: 6, cl: 0, fll: 6, frl: 6 });
    });

    it("gives a QuadVee 2 slots a leg", () => {
        expect(counts(build("quadvee"))).toEqual({ ...torsoAndHead, la: 0, ra: 0, ll: 2, rl: 2, cl: 0, fll: 2, frl: 2 });
    });

    it("gives a tripod a 6-slot center leg and two 12-slot arms", () => {
        expect(counts(build("tripod"))).toEqual({ ...torsoAndHead, la: 12, ra: 12, ll: 6, rl: 6, cl: 6, fll: 0, frl: 0 });
    });

    it("gives an armless 'Mech's arms 0 slots", () => {
        const mech = build("biped", 50, "master-rules-revised");
        expect(mech.setArmless(true)).toBe(true);
        expect(mech.getLocationSlotCount("la")).toBe(0);
        expect(mech.getLocationSlotCount("ra")).toBe(0);
    });

    it("takes the critical table names and any case as well as the tags", () => {
        const mech = build("quad");
        expect(mech.getLocationSlotCount("head")).toBe(6);
        expect(mech.getLocationSlotCount("centerTorso")).toBe(12);
        expect(mech.getLocationSlotCount("frontLeftLeg")).toBe(6);
        expect(mech.getLocationSlotCount(" FRL ")).toBe(6);
        expect(mech.getLocationSlotCount("leftArm")).toBe(0);
        expect(mech.getLocationSlotCount("rll")).toBe(6);
        expect(mech.getLocationSlotCount("nowhere")).toBe(0);
    });

    it("lays out every location at its count", () => {
        const names: Record<string, string> = {
            hd: "head", ct: "centerTorso", lt: "leftTorso", rt: "rightTorso", la: "leftArm", ra: "rightArm",
            ll: "leftLeg", rl: "rightLeg", cl: "centerLeg", fll: "frontLeftLeg", frl: "frontRightLeg",
        };
        for (const type of ["biped", "lam", "quad", "quadvee", "tripod"]) {
            const mech = build(type);
            const criticals = mech.getCriticals() as unknown as Record<string, unknown[]>;
            for (const tag of TAGS) {
                expect(criticals[names[tag]]?.length ?? 0, `${type} ${tag}`).toBe(mech.getLocationSlotCount(tag));
            }
        }
    });

    it("refuses to place an item in a location the 'Mech does not have, rather than growing one", () => {
        const mech = build("quad");
        mech.addEquipmentFromTag("medium-laser", "is", "", false, undefined, "", false, [], undefined, undefined);
        const index = mech.getUnallocatedCriticals().findIndex(slot => slot?.tag === "medium-laser");
        expect(index).toBeGreaterThanOrEqual(0);
        expect(mech.moveCritical("un", index, "la", 0)).toBe(false);
        expect((mech.getCriticals() as unknown as Record<string, unknown[]>).leftArm.length).toBe(0);
    });
});
