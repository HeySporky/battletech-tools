import { describe, expect, it } from "vitest";
import { BattleMechForce } from "./battlemech-force";
import { buildVehicle } from "../test-support/builders";

// Trailers under Battle Value 1 (#624): "A tractor and trailer combination is considered a single unit. Calculate the BV for the
// tractor and each trailer separately, using the MP of the combined tractor-trailer rig in all cases. Then, add together all the
// Battle Values" (Maximum Tech p.92). The roster links a trailer to its tractor; unlinked, an unmotorized trailer reads Flank 1
// (TM p.317) as before. The rig's MP is the tractor's, after the weight it pulls costs it speed like unprotected cargo
// (BMR p.72; TW p.205): up to a quarter of the tractor's weight, 3 MP or half the Cruising MP, whichever is less; more, half.
const EDITION = "master-rules-revised";

const rig = (trailerTons: number) => {
    const force = new BattleMechForce();
    const tractor = buildVehicle("wheeled", 50);
    const trailer = buildVehicle("wheeled", trailerTons);
    trailer.setCruiseMP(0);
    force.groups[0].vehicles.push(tractor, trailer);
    return { force, tractor, trailer };
};
// The BV1 Speed Factor step (cv.bv1.off.speed) carries the MP it was read from in its detail ("MP 5").
const speedMP = (vehicle: ReturnType<typeof buildVehicle>) => /MP (\d+)/.exec(vehicle.getBattleValueBreakdown(EDITION).steps.find((step) => step.id === "cv.bv1.off.speed")?.detail ?? "")?.[1];

describe("a roster rig link (Maximum Tech p.92)", () => {
    it("reads Flank 1 for an unlinked trailer, and the tractor's own Flank MP for the tractor", () => {
        const { trailer, tractor } = rig(10);
        expect(speedMP(trailer)).toBe("1");
        expect(speedMP(tractor)).toBe(String(tractor.getFlankMP()));
    });

    it("rates the tractor and every trailer with the rig's MP once linked", () => {
        const { force, tractor, trailer } = rig(10);
        const alone = tractor.getBattleValue(EDITION);
        const loose = trailer.getBattleValue(EDITION);
        expect(force.setRig(trailer.getUUID(), tractor.getUUID())).toEqual([]);
        // 10 tons is under a quarter of 50: Cruising 5 loses min(3, half) = 2 MP, so 3 Cruising and a Flank of 5.
        expect(force.getRigFlankMP(tractor.getUUID())).toBe(5);
        expect(speedMP(tractor)).toBe("5");
        expect(speedMP(trailer)).toBe("5");
        expect(tractor.getBattleValue(EDITION)).toBeLessThan(alone);
        expect(trailer.getBattleValue(EDITION)).toBeGreaterThan(loose);
    });

    it("halves the Cruising MP for more than a quarter of the tractor's weight", () => {
        const { force, tractor, trailer } = rig(20);
        force.setRig(trailer.getUUID(), tractor.getUUID());
        // Cruising 5 halves to 2 (rounded down), Flank 3.
        expect(force.getRigFlankMP(tractor.getUUID())).toBe(3);
        expect(speedMP(trailer)).toBe("3");
    });

    it("adds the trailers' weight together and holds them to the tractor's own weight", () => {
        const { force, tractor, trailer } = rig(30);
        const second = buildVehicle("wheeled", 30);
        second.setCruiseMP(0);
        force.groups[0].vehicles.push(second);
        expect(force.setRig(trailer.getUUID(), tractor.getUUID())).toEqual([]);
        expect(force.setRig(second.getUUID(), tractor.getUUID()).join(" ")).toMatch(/weight/i);
        expect(force.getRigTractor(second.getUUID())).toBe("");
    });

    it("keeps BV2 and any other edition's figures as they were", () => {
        const { force, tractor, trailer } = rig(10);
        const before = [tractor.getBattleValue("total-warfare"), trailer.getBattleValue("total-warfare")];
        force.setRig(trailer.getUUID(), tractor.getUUID());
        expect([tractor.getBattleValue("total-warfare"), trailer.getBattleValue("total-warfare")]).toEqual(before);
    });

    it("adds the rig's Battle Values together in the force total", () => {
        const { force, tractor, trailer } = rig(10);
        force.setRig(trailer.getUUID(), tractor.getUUID());
        const group = force.groups[0];
        const expected = Math.round(tractor.getPilotAdjustedBattleValue(EDITION)) + Math.round(trailer.getPilotAdjustedBattleValue(EDITION));
        expect(group.getTotalBattleValue(EDITION, force.groups, force.c3Networks)).toBe(expected);
    });

    it("unlinks and refuses a link to itself, to another trailer or across a chain", () => {
        const { force, tractor, trailer } = rig(10);
        expect(force.setRig(trailer.getUUID(), trailer.getUUID()).length).toBeGreaterThan(0);
        force.setRig(trailer.getUUID(), tractor.getUUID());
        const third = buildVehicle("wheeled", 5);
        force.groups[0].vehicles.push(third);
        expect(force.setRig(third.getUUID(), trailer.getUUID()).join(" ")).toMatch(/trailer/i);
        expect(force.setRig(trailer.getUUID(), "")).toEqual([]);
        expect(speedMP(trailer)).toBe("1");
        expect(force.getRigTractor(trailer.getUUID())).toBe("");
    });

    it("saves and loads the link, and drops it when a unit leaves the force", () => {
        const { force, tractor, trailer } = rig(10);
        force.setRig(trailer.getUUID(), tractor.getUUID());
        const loaded = new BattleMechForce(JSON.parse(JSON.stringify(force.export())));
        const loadedTrailer = loaded.groups[0].vehicles.find((vehicle) => vehicle.getUUID() === trailer.getUUID())!;
        expect(loaded.getRigTractor(trailer.getUUID())).toBe(tractor.getUUID());
        expect(speedMP(loadedTrailer)).toBe("5");
        force.groups[0].vehicles.splice(0, 1);
        expect(force.export().rigs).toBeUndefined();
    });
});
