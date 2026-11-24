import { describe, expect, it } from "vitest";
import {
    AERO_GROUND_RULES, AERO_GROUND_EDITIONS, accelerate, changeAltitude, endFlightMovement, getAeroGroundEdition, getAirToGroundToHit, getBombScatter,
    getControlRollTarget, getHexesToMove, newFlightState, startFlightTurn,
} from "./aero-ground-play";

describe("Fighters on the low-altitude map, Total Warfare (TW pp.80-84, 242-247)", () => {
    it("halves velocity each turn, then spends thrust on velocity and altitude: altitude 5, velocity 6", () => {
        let state = { ...newFlightState(), altitude: 5, velocity: 6 };
        state = startFlightTurn(state, "total-warfare");
        expect(state.velocity).toBe(3);
        const faster = accelerate(state, 2, "total-warfare", 6);
        expect(faster.state.velocity).toBe(5);
        expect(faster.state.thrustUsed).toBe(2);
        expect(getHexesToMove(faster.state.velocity, "total-warfare")).toBe(5);
        // Dive three altitudes (free): +1 velocity for two or more, and a Control Roll for more than two, modifier 3.
        const dive = changeAltitude(faster.state, -3, "total-warfare");
        expect(dive.state.altitude).toBe(2);
        expect(dive.state.velocity).toBe(6);
        expect(dive.state.thrustUsed).toBe(2);
        expect(dive.controlRolls).toEqual([{ reason: "Descended 3 altitudes", modifier: 3 }]);
    });

    it("climbs for 2 Thrust an altitude and leaves the map above altitude 10 (TW p.84)", () => {
        const start = { ...newFlightState(), altitude: 9, velocity: 4 };
        const climb = changeAltitude(start, 2, "total-warfare");
        expect(climb.state.thrustUsed).toBe(4);
        expect(climb.leftMap).toBe(true);
        expect(climb.notes.join(" ")).toContain("space map");
    });

    it("makes a Control Roll only for a descent of more than two altitudes; AT2 and AT2 Revised roll for more than one", () => {
        const start = { ...newFlightState(), altitude: 6, velocity: 4 };
        expect(changeAltitude(start, -2, "total-warfare").controlRolls).toEqual([]);
        expect(changeAltitude(start, -2, "aerotech-2-revised").controlRolls).toEqual([{ reason: "Descended 2 altitudes", modifier: 2 }]);
        expect(changeAltitude(start, -2, "aerotech-2").controlRolls).toEqual([{ reason: "Descended 2 altitudes", modifier: 2 }]);
        // The extra point of velocity needs two altitudes in each book, and never goes past 12.
        expect(changeAltitude(start, -1, "total-warfare").state.velocity).toBe(4);
        expect(changeAltitude({ ...start, velocity: 12 }, -2, "total-warfare").state.velocity).toBe(12);
    });

    it("rolls for a velocity over twice Safe Thrust, +1 a point of excess (TW p.84); AT2 Revised does not allow it", () => {
        const fast = { ...newFlightState(), altitude: 4, velocity: 14 };
        expect(endFlightMovement(fast, "total-warfare", { safeThrust: 6 }).controlRolls).toEqual([{ reason: "Velocity 14 is 2 over twice Safe Thrust (12)", modifier: 2 }]);
        expect(endFlightMovement({ ...fast, velocity: 12 }, "total-warfare", { safeThrust: 6 }).controlRolls).toEqual([]);
        const refused = endFlightMovement(fast, "aerotech-2-revised", { safeThrust: 6 });
        expect(refused.notes.join(" ")).toContain("may not fly");
    });

    it("stalls at velocity 0: falls an altitude and rolls; VSTOL with thrust left hovers instead (TW p.84)", () => {
        const stopped = { ...newFlightState(), altitude: 3, velocity: 0 };
        const stalled = endFlightMovement(stopped, "total-warfare", { safeThrust: 5 });
        expect(stalled.state.altitude).toBe(2);
        expect(stalled.controlRolls).toEqual([{ reason: "Stalled at velocity 0", modifier: 0 }]);
        const hover = endFlightMovement(stopped, "total-warfare", { safeThrust: 5, vstol: true, thrustLeft: 2 });
        expect(hover.state.altitude).toBe(3);
        expect(hover.controlRolls).toEqual([]);
        // Falling out of altitude 1 means landing or crashing.
        expect(endFlightMovement({ ...stopped, altitude: 1 }, "total-warfare", { safeThrust: 5 }).notes.join(" ")).toContain("land or crash");
    });

    it("does nothing at altitude 0 (landed) or when the unit is in space", () => {
        const landed = newFlightState();
        expect(endFlightMovement(landed, "total-warfare", { safeThrust: 5 }).state).toEqual(landed);
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 0 }, "strike", "total-warfare").allowed).toBe(false);
        expect(changeAltitude(landed, -1, "total-warfare").state.altitude).toBe(0);
    });

    it("rolls a Control Roll against the Piloting Skill plus the modifiers", () => {
        expect(getControlRollTarget(5, 3)).toBe(8);
        expect(getControlRollTarget(5, 3, 2)).toBe(10);
    });
});

describe("Air-to-ground attacks (TW pp.242-247)", () => {
    it("strike: Gunnery +2, altitude 5 or lower and not NOE, dropping one altitude, no bombs (the Shiva, Gunnery 4)", () => {
        const strike = getAirToGroundToHit({ gunnery: 4, altitude: 3 }, "strike", "total-warfare");
        expect(strike).toMatchObject({ allowed: true, modifier: 2, baseToHit: 6, altitudeLoss: 1, usesBombs: false });
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 5 }, "strike", "total-warfare").allowed).toBe(true);
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 6 }, "strike", "total-warfare").allowed).toBe(false);
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 1 }, "strike", "total-warfare").reason).toContain("NOE");
    });

    it("strafe: Gunnery +4 within three altitudes, +2 more at NOE, one to five hexes, friendly units included", () => {
        const strafe = getAirToGroundToHit({ gunnery: 4, altitude: 3 }, "strafe", "total-warfare");
        expect(strafe).toMatchObject({ allowed: true, modifier: 4, baseToHit: 8, hexes: [1, 5], hitsFriendlies: true, altitudeLoss: 0 });
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 1 }, "strafe", "total-warfare")).toMatchObject({ modifier: 6, baseToHit: 10 });
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 4 }, "strafe", "total-warfare").allowed).toBe(false);
    });

    it("bombs: dive-bombing Gunnery +2 from altitude 5 or lower diving two; altitude-bombing adds the altitude, up to ten hexes", () => {
        const dive = getAirToGroundToHit({ gunnery: 4, altitude: 4 }, "dive-bomb", "total-warfare");
        expect(dive).toMatchObject({ allowed: true, modifier: 2, baseToHit: 6, altitudeLoss: 2, usesBombs: true, terrainAndMovement: false, hitsFriendlies: true });
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 2 }, "dive-bomb", "total-warfare").allowed).toBe(false);
        const high = getAirToGroundToHit({ gunnery: 4, altitude: 7 }, "altitude-bomb", "total-warfare");
        expect(high).toMatchObject({ allowed: true, modifier: 9, baseToHit: 13, hexes: [1, 10], terrainAndMovement: false });
        expect(high.labels.join(" ")).toContain("altitude 7");
        expect(AERO_GROUND_RULES["total-warfare"].attacks["altitude-bomb"]?.name).toBe("Altitude-bombing");
        expect(AERO_GROUND_RULES["aerotech-2-revised"].attacks["altitude-bomb"]?.name).toBe("Level-bombing");
    });

    it("adds the attacker's damage modifiers and the Safe Thrust penalty, and stops at an automatic miss", () => {
        const hit = getAirToGroundToHit({ gunnery: 4, altitude: 3, otherModifiers: 2, exceededSafeThrust: true }, "strike", "total-warfare");
        expect(hit.baseToHit).toBe(10);
        expect(hit.labels.join(" ")).toContain("exceeded Safe Thrust");
        const miss = getAirToGroundToHit({ gunnery: 8, altitude: 7, otherModifiers: 4 }, "altitude-bomb", "total-warfare");
        expect(miss.autoMiss).toBe(true);
    });

    it("scatters a missed bomb by the margin of failure in Total Warfare and 1D6 hexes in AT2 Revised (TW p.245, AT2R p.37)", () => {
        expect(getBombScatter("total-warfare", { marginOfFailure: 3, direction: 2, distanceRoll: 6 })).toMatchObject({ hexes: 3, direction: 2 });
        expect(getBombScatter("aerotech-2-revised", { marginOfFailure: 3, direction: 2, distanceRoll: 6 })).toMatchObject({ hexes: 6, direction: 2 });
        expect(getBombScatter("aerotech-2", { marginOfFailure: 3, direction: 5, distanceRoll: 1 })).toMatchObject({ hexes: 1, direction: 5 });
    });
});

describe("Earlier editions where they differ from Total Warfare", () => {
    it("AT2 (p.28): velocity falls by 5 each turn to 0, and a unit moves half its velocity in hexes", () => {
        expect(startFlightTurn({ ...newFlightState(), altitude: 4, velocity: 8 }, "aerotech-2").velocity).toBe(3);
        expect(startFlightTurn({ ...newFlightState(), altitude: 4, velocity: 3 }, "aerotech-2").velocity).toBe(0);
        expect(getHexesToMove(7, "aerotech-2")).toBe(4);
        expect(getHexesToMove(7, "aerotech-2-revised")).toBe(7);
    });

    it("BattleSpace (pp.83-85): six altitude levels, velocity reset every turn, strike 8 (4 against a building), dive-bombing low or medium only", () => {
        expect(AERO_GROUND_RULES.battlespace.maxAltitude).toBe(6);
        expect(startFlightTurn({ ...newFlightState(), altitude: 3, velocity: 7 }, "battlespace").velocity).toBe(0);
        const strike = getAirToGroundToHit({ gunnery: 4, altitude: 3 }, "strike", "battlespace");
        expect(strike).toMatchObject({ allowed: true, baseToHit: 8 });
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 3 }, "strike", "battlespace", { targetIsStructure: true }).baseToHit).toBe(4);
        expect(getAirToGroundToHit({ gunnery: 5, altitude: 3 }, "strike", "battlespace").baseToHit).toBe(9);
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 4 }, "dive-bomb", "battlespace")).toMatchObject({ allowed: true, baseToHit: 6 });
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 2 }, "dive-bomb", "battlespace").allowed).toBe(false);
        // Ripple bombing: base 8, +1 for each level above very low (altitude 2).
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 5 }, "altitude-bomb", "battlespace")).toMatchObject({ allowed: true, baseToHit: 11, hexes: [1, 10] });
        expect(AERO_GROUND_RULES.battlespace.attacks["altitude-bomb"]?.name).toBe("Ripple bombing");
        // NOE: +2 to every to-hit roll, +1 for a Clan OmniFighter.
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 1 }, "strike", "battlespace").baseToHit).toBe(10);
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 1, omniFighter: true }, "strike", "battlespace").baseToHit).toBe(9);
    });

    // The English scan cuts the number off p.84; the Spanish edition of the same page prints it: "La tirada basica para
    // impactar de una pasada de ametrallamiento es de 8" (page image read 2026-11-23).
    it("BattleSpace: strafing is base 8, moved by Gunnery above or below 4 as the book prints (pp.34, 80, 84)", () => {
        const strafe = getAirToGroundToHit({ gunnery: 4, altitude: 3 }, "strafe", "battlespace");
        expect(strafe).toMatchObject({ allowed: true, baseToHit: 8, hexes: [1, 5], hitsFriendlies: true });
        expect(getAirToGroundToHit({ gunnery: 3, altitude: 3 }, "strafe", "battlespace").baseToHit).toBe(7);
        expect(strafe.labels.join(" ")).toContain("base 8 for Gunnery 4");
        expect(strafe.labels.join(" ")).not.toContain("inferred");
    });

    it("BattleSpace: climbing costs 2 Thrust a level, 1 Thrust a hex, and a stall falls one level", () => {
        const climb = changeAltitude({ ...newFlightState(), altitude: 2 }, 3, "battlespace");
        expect(climb.state.altitude).toBe(5);
        expect(climb.state.thrustUsed).toBe(6);
        expect(climb.leftMap).toBe(false);
        expect(changeAltitude({ ...newFlightState(), altitude: 6 }, 1, "battlespace").notes.join(" ")).toContain("standard BattleSpace");
        expect(getHexesToMove(5, "battlespace")).toBe(5);
        const stalled = endFlightMovement({ ...newFlightState(), altitude: 4, velocity: 0 }, "battlespace", { safeThrust: 5 });
        expect(stalled.state.altitude).toBe(3);
        expect(stalled.controlRolls).toEqual([]);
    });

    it("AeroTech (1986): no altitude levels, no strike; strafing base 8 over a three-hex row, dive-bombing base 6", () => {
        const rules = AERO_GROUND_RULES.aerotech;
        expect(rules.maxAltitude).toBeNull();
        expect(rules.attacks.strike).toBeUndefined();
        const strafe = getAirToGroundToHit({ gunnery: 4, altitude: 1 }, "strafe", "aerotech");
        expect(strafe).toMatchObject({ allowed: true, baseToHit: 8, hexes: [3, 3] });
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 1 }, "dive-bomb", "aerotech")).toMatchObject({ allowed: true, baseToHit: 6 });
        expect(getAirToGroundToHit({ gunnery: 4, altitude: 1 }, "strike", "aerotech").allowed).toBe(false);
        expect(changeAltitude({ ...newFlightState(), altitude: 1 }, 1, "aerotech").notes.join(" ")).toContain("no altitude levels");
    });

    it("lists the editions and falls back to Total Warfare for any other tag", () => {
        expect(AERO_GROUND_EDITIONS.map((entry) => entry.tag)).toEqual(["aerotech", "battlespace", "aerotech-2", "aerotech-2-revised", "total-warfare"]);
        expect(getAeroGroundEdition("battletech-4th-edition")).toBe("total-warfare");
        expect(getAeroGroundEdition("aerotech-2")).toBe("aerotech-2");
        expect(getAeroGroundEdition(undefined)).toBe("total-warfare");
    });
});
