import { describe, expect, it } from "vitest";
import { battledroidsUnitDesigns, battledroidsUnitKinds, getBattledroidsTankHitLocation } from "../data/battledroids-units";
import { getEditionPlayRules } from "../data/rules-editions";
import BattledroidsUnit from "./battledroids-unit";
import { BattleMechGroup } from "./battlemech-group";

// The tanks, jeeps and infantry of Expert Battledroids (Battledroids, FASA 1984, pp.22-23).
describe("Battledroids tanks, jeeps and infantry", () => {
    it("lists the seven fixed designs of the rulebook", () => {
        expect(battledroidsUnitDesigns.map(design => design.tag)).toEqual([
            "scr-8n-scorpion", "hnt-3r-hunter", "vde-3t-vedette", "jeep-srm", "jeep-mg", "infantry-srm", "infantry-mg",
        ]);
        const kind = (tag: string) => battledroidsUnitKinds.find(entry => entry.kind === tag)!;
        // BD p.22: tanks move 4, or 3 in a turn they fire; jeeps 6 or 5 and +1 to hit. BD p.23: infantry 1 hex, +2 to hit.
        expect([kind("tank").movementPoints, kind("tank").movementPointsFiring, kind("tank").toHitModifier]).toEqual([4, 3, 0]);
        expect([kind("jeep").movementPoints, kind("jeep").movementPointsFiring, kind("jeep").toHitModifier]).toEqual([6, 5, 1]);
        expect([kind("infantry").movementPoints, kind("infantry").movementPointsFiring, kind("infantry").toHitModifier]).toEqual([1, 1, 2]);
        // "20 points of front armor, 10 points of armor on each side, 8 points of back armor, and 5 points of turret armor."
        expect(kind("tank").armor).toEqual({ front: 20, left: 10, right: 10, back: 8, turret: 5 });
    });

    // BD p.22: Scorpion, three SRM 6 with 15 shots each; Hunter, one LRM 20 with 18; Vedette, auto cannon 40 and
    // machine gun 200; jeeps 5 SRM or 10 machine gun shots. BD p.23: infantry 12 SRM or 25 machine gun shots.
    it("arms each design as the rulebook does, with the ranges of the Weapons Table", () => {
        const lines = (tag: string) => new BattledroidsUnit(tag).getWeaponLines().map(line => [line.name, line.shots, line.range.short, line.range.medium, line.range.long]);
        expect(lines("scr-8n-scorpion")).toEqual([1, 2, 3].map(number => [`Short Range Missiles, 6 Rack #${number}`, 15, 3, 6, 9]));
        expect(lines("hnt-3r-hunter")).toEqual([["Long Range Missiles, 20 Rack", 18, 7, 14, 21]]);
        expect(lines("vde-3t-vedette").map(line => [line[1], line[2], line[3], line[4]])).toEqual([[40, 6, 12, 18], [200, 1, 2, 3]]);
        expect(lines("jeep-srm").map(line => line[1])).toEqual([5]);
        expect(lines("jeep-mg").map(line => line[1])).toEqual([10]);
        expect(lines("infantry-srm").map(line => line[1])).toEqual([12]);
        expect(lines("infantry-mg").map(line => line[1])).toEqual([25]);
        expect(new BattledroidsUnit("hnt-3r-hunter").getWeaponLines()[0].range.min).toBe(6);
    });

    // Tank Hit Locations, BD p.22.
    it("locates hits on a tank by the table", () => {
        const column = (side: boolean) => [2, 3, 4, 5, 9, 10, 12].map(roll => getBattledroidsTankHitLocation(roll, side));
        expect(column(false)).toEqual(["tracks", "tracks", "armor", "armor", "armor", "turret", "turret"]);
        expect(column(true)).toEqual(["tracks", "tracks", "tracks", "armor", "armor", "turret", "turret"]);
    });

    it("takes the damage of a tank by location and destroys it when one part has no armor left", () => {
        const tank = new BattledroidsUnit("vde-3t-vedette");
        tank.resolveHit("front", 8, 7);
        expect([tank.getArmorLeft("front"), tank.isDestroyed(), tank.isDamaged()]).toEqual([12, false, true]);
        // A side hit on a 4 is the tracks: no armor lost, and the tank cannot move.
        expect(tank.getMovementPoints()).toBe(4);
        tank.resolveHit("left", 10, 4);
        expect([tank.getArmorLeft("left"), tank.isImmobilized(), tank.getMovementPoints(), tank.isDestroyed()]).toEqual([10, true, 0, false]);
        tank.resolveHit("right", 5, 11);
        expect([tank.getArmorLeft("turret"), tank.isDestroyed(), tank.hasExploded()]).toEqual([0, true, false]);
        expect(tank.resolveHit("front", 5, 7)).toEqual(["VDE-3T Vedette is already destroyed."]);
    });

    it("explodes a tank killed through its back armor and rolls for a fire on 9 or more", () => {
        const tank = new BattledroidsUnit("hnt-3r-hunter");
        const log = tank.resolveHit("back", 8, 6, 9);
        expect([tank.isDestroyed(), tank.hasExploded()]).toEqual([true, true]);
        expect(log.join(" ")).toContain("a fire starts in the hex");
        const other = new BattledroidsUnit("hnt-3r-hunter");
        expect(other.resolveHit("back", 10, 6, 8).join(" ")).toContain("no fire");
    });

    it("moves a tank or jeep one point less in a turn it fires", () => {
        const tank = new BattledroidsUnit("scr-8n-scorpion");
        const jeep = new BattledroidsUnit("jeep-mg");
        tank.setFiring(true);
        jeep.setFiring(true);
        expect([tank.getMovementPoints(), jeep.getMovementPoints()]).toEqual([3, 5]);
    });

    // "Jeeps can withstand 5 points of damage"; one point kills an infantry unit and the rest carries over.
    it("destroys a jeep past 5 points and an infantry unit with 1, carrying the rest over", () => {
        const jeep = new BattledroidsUnit("jeep-srm");
        jeep.resolveHit("front", 5);
        expect([jeep.getDamage(), jeep.isDestroyed()]).toEqual([5, false]);
        expect(jeep.resolveHit("front", 3).join(" ")).toContain("2 points are left over for another jeep");
        expect(jeep.isDestroyed()).toBe(true);
        const squad = new BattledroidsUnit("infantry-mg");
        expect(squad.resolveHit("front", 5).join(" ")).toContain("4 points are left over for another infantry unit");
        expect(squad.isDestroyed()).toBe(true);
    });

    it("counts shots and never goes past what the unit carries", () => {
        const jeep = new BattledroidsUnit("jeep-srm");
        for (let shot = 0; shot < 7; shot++) jeep.changeShotsFired(0, 1);
        expect(jeep.getWeaponLines()[0].shotsLeft).toBe(0);
        jeep.changeShotsFired(0, -1);
        expect(jeep.getWeaponLines()[0].shotsLeft).toBe(1);
    });

    it("saves and restores a unit, and resets it", () => {
        const tank = new BattledroidsUnit("scr-8n-scorpion");
        tank.setName("Stinger Bait");
        tank.setGunnery(3);
        tank.resolveHit("left", 4, 7);
        tank.changeShotsFired(2, 1);
        const restored = new BattledroidsUnit(tank.exportJSON());
        expect([restored.getDisplayName(), restored.getGunnery(), restored.getArmorLeft("left"), restored.getWeaponLines()[2].shotsLeft, restored.getUUID()])
            .toEqual(["Stinger Bait", 3, 6, 14, tank.getUUID()]);
        restored.resetInPlay();
        expect([restored.isDamaged(), restored.getWeaponLines()[2].shotsLeft]).toEqual([false, 15]);
        expect("inPlay" in restored.export()).toBe(false);
        // A save naming no known design is refused; out-of-range numbers are clamped.
        expect(new BattledroidsUnit().importJSON(JSON.stringify({ design: "atlas" }))).toBe(false);
        const odd = new BattledroidsUnit(JSON.stringify({ design: "jeep-mg", gunnery: 99, inPlay: { damage: 500, shotsFired: [9000] } }));
        expect([odd.getGunnery(), odd.getDamage(), odd.getWeaponLines()[0].shotsLeft]).toEqual([8, 6, 0]);
    });

    it("travels with a roster group, and groups saved before it existed still load", () => {
        const group = new BattleMechGroup();
        group.battledroidsUnits.push(new BattledroidsUnit("hnt-3r-hunter"), new BattledroidsUnit("infantry-srm"));
        group.battledroidsUnits[0].resolveHit("front", 3, 7);
        expect(group.getTotalUnits()).toBe(2);
        expect(group.isUnderStrength()).toBe(true);
        const saved = JSON.parse(JSON.stringify(group.export()));
        const restored = new BattleMechGroup(saved);
        expect(restored.battledroidsUnits.map(unit => unit.getDesign().tag)).toEqual(["hnt-3r-hunter", "infantry-srm"]);
        expect(restored.battledroidsUnits[0].getArmorLeft("front")).toBe(17);

        const empty = new BattleMechGroup().export();
        expect("battledroidsUnits" in empty).toBe(false);
        const old = new BattleMechGroup({ ...empty, battledroidsUnits: [{ design: "nonsense" }, null, "x"] } as never);
        expect(old.battledroidsUnits).toEqual([]);
    });

    it("records the play rules of Battledroids on the edition", () => {
        // Heat Point Table, BD p.12; Movement Modifiers Table, BD p.5; critical hits on 7 or more, BD p.18.
        expect(getEditionPlayRules("battledroids")).toEqual({
            moveHeat: { walk: 0, run: 1, jumpPerHex: 1, jumpMinimum: 0 },
            maxTargetMovementModifier: 3,
            secondaryTargetModifiers: false,
            criticalHitRoll: 7,
        });
        expect(getEditionPlayRules("total-warfare")).toBeUndefined();
        expect(getEditionPlayRules(undefined)).toBeUndefined();
    });
});
