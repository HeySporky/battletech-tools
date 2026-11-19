import { describe, expect, it } from "vitest";
import { BattleMechForce, ICBTForceExport } from "./battlemech-force";
import { IAntiOrbitalShot, MAX_TRACKED_GUNS, SpaceTracker } from "./space-tracker";

// Space turn tracker (design 2026-10-22): an option at setup, saved with the force; off saves only the off flag.
const shot = (fields: Partial<IAntiOrbitalShot> = {}): IAntiOrbitalShot => ({
    id: "s1", gunKey: "u:w", unitName: "Gun 1", weaponName: "Long Tom", aimedHex: "0712", targetName: "Lola III",
    firedGroundTurn: 3, firedSpaceTurn: 1, ...fields,
});

describe("space tracker state", () => {
    it("is off by default and saves only the off flag", () => {
        const saved = new BattleMechForce().export();
        expect(saved.spaceInPlay).toBe(false);
        expect("spaceTracker" in saved).toBe(false);
    });

    it("loads a force saved before the tracker with the option off", () => {
        const old = new BattleMechForce().export();
        delete (old as Partial<ICBTForceExport>).spaceInPlay;
        expect(new BattleMechForce(old).spaceInPlay).toBe(false);
    });

    it("saves and reloads the option, shots in flight, cooldowns and destroyed guns", () => {
        const force = new BattleMechForce();
        force.spaceInPlay = true;
        force.spaceTracker.shotsInFlight.push(shot());
        force.spaceTracker.lastFired["u:w"] = 1;
        force.spaceTracker.destroyedGuns.push("u:x");
        const back = new BattleMechForce(JSON.parse(JSON.stringify(force.export())));
        expect(back.spaceInPlay).toBe(true);
        expect(back.spaceTracker.export()).toEqual(force.spaceTracker.export());
        expect(back.spaceTracker.shotsInFlight).toHaveLength(1);
    });

    it("reads corrupt saved state bounded and without throwing", () => {
        const tracker = new SpaceTracker({ shotsInFlight: "x", lastFired: { a: -4, b: "2" }, destroyedGuns: Array(5000).fill("g") });
        expect(tracker.shotsInFlight).toEqual([]);
        expect(tracker.lastFired).toEqual({});
        expect(tracker.destroyedGuns.length).toBeLessThanOrEqual(MAX_TRACKED_GUNS);
        const mixed = new SpaceTracker({ shotsInFlight: [shot(), { id: 5 }, shot({ id: "s2", firedSpaceTurn: 0 }), null] });
        expect(mixed.shotsInFlight.map((s) => s.id)).toEqual(["s1"]);
        expect(() => new SpaceTracker(null)).not.toThrow();
        expect(() => new SpaceTracker("junk")).not.toThrow();
    });

    it("lists a shot as due from the next space turn", () => {
        const tracker = new SpaceTracker({ shotsInFlight: [shot()] });
        expect(tracker.getDueShots(6)).toHaveLength(0);
        expect(tracker.getDueShots(7)).toHaveLength(1);
    });
});

describe("deferred minors (2026-10-22)", () => {
    it("opens the space phase only on the first ground turn of a space turn with shots due", () => {
        const tracker = new SpaceTracker({ shotsInFlight: [shot()] });
        expect(tracker.opensSpacePhase(6)).toBe(false);
        expect(tracker.opensSpacePhase(7)).toBe(true);
        expect(tracker.opensSpacePhase(8)).toBe(false);
        expect(new SpaceTracker().opensSpacePhase(7)).toBe(false);
    });

    it("keeps shots in flight with the option off, through a reload, for when it is turned back on", () => {
        const force = new BattleMechForce();
        force.spaceInPlay = true;
        force.spaceTracker.shotsInFlight.push(shot());
        force.spaceInPlay = false;
        const back = new BattleMechForce(JSON.parse(JSON.stringify(force.export())));
        expect(back.spaceInPlay).toBe(false);
        back.spaceInPlay = true;
        expect(back.spaceTracker.shotsInFlight).toHaveLength(1);
    });
});
