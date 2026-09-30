import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";
import Pilot from "./pilot";
import { getWeaponExplosionDamage } from "../data/weapon-explosions";

// Combat Vehicle rules automated in play mode and construction: Total Warfare (corrected 2010 PDF) and
// Tactical Operations (2008).
const build = (motive: string, tonnage: number = 50): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setMotiveType(motive);
    vehicle.setTonnage(tonnage);
    vehicle.setEngineType("ice");
    vehicle.setCruiseMP(motive === "vtol" ? 8 : 5);
    if (motive !== "vtol") vehicle.setHasTurret(true);
    for (const loc of vehicle.getLocations()) vehicle.setArmorAllocation(loc.tag, loc.tag === "rotor" ? 2 : 10);
    const pilot = new Pilot();
    pilot.gunnery = 4;
    pilot.piloting = 5;
    vehicle.setPilot(pilot);
    return vehicle;
};

const mount = (vehicle: Vehicle, tag: string, location: string) => {
    vehicle.addEquipmentFromTag(tag);
    const item = vehicle.getEquipmentList()[vehicle.getEquipmentList().length - 1];
    vehicle.setEquipmentLocation(item.uuid || "", location);
    return vehicle.getEquipmentList().find((entry) => entry.uuid === item.uuid)!;
};

describe("Explosive weapons (TW pp. 135-136, 195; TO pp. 314-315)", () => {
    it("knows each Gauss weapon's explosion damage from the books", () => {
        const damage = (tag: string) => getWeaponExplosionDamage({ tag } as never)?.damage ?? null;
        expect(damage("standard-gauss-rifle")).toBe(20);
        expect(damage("clan-gauss-rifle")).toBe(20);
        expect(damage("ap-gauss-rifle")).toBe(3);
        expect(damage("gauss-rifle-light")).toBe(16);
        expect(damage("gauss-rifle-heavy")).toBe(25);
        expect(damage("hyper-assault-gauss-30")).toBe(15);
        expect(damage("gauss-rifle-heavy-improved")).toBe(30);
        expect(damage("gauss-rifle-magshot")).toBe(3);
        expect(damage("silver-bullet-gauss-rifle")).toBe(20);
        // Not in the books in hand (Interstellar Operations): left unresolved rather than guessed.
        expect(damage("clan-improved-gauss-rifle")).toBeNull();
    });

    it("Weapon Destroyed on a Gauss rifle explodes it in its location, without losing the ammunition", () => {
        const tank = build("tracked", 60);
        const gauss = mount(tank, "standard-gauss-rifle", "front");
        const text = tank.applyCriticalHit("weaponDestroyed", "front", gauss.uuid);
        expect(text).toContain("20 damage");
        expect(tank.getStructureRemaining("front")).toBe(0);
        expect(tank.getInPlay().criticals.ammoExploded).toBe(false);
    });
});

describe("Armor-piercing ammunition (TW p. 140)", () => {
    it("an attack that damages only armor still rolls for a critical hit, with the autocannon's modifier", () => {
        const tank = build("tracked");
        tank.resolveAttack(7, "front", 5, { armorPiercing: 10 });
        expect(tank.takeFollowUpRolls()).toEqual([{ kind: "critical", location: "front", modifier: -2 }]);
        // 8 - 2 = 6: Driver Hit on the Front column.
        expect(tank.resolveFollowUpRoll({ kind: "critical", location: "front", modifier: -2 }, 8)).toContain("Driver Hit");
    });

    it("internal structure damage makes the standard roll instead", () => {
        const tank = build("tracked");
        tank.resolveAttack(7, "front", 12, { armorPiercing: 20 });
        expect(tank.takeFollowUpRolls()).toEqual([{ kind: "critical", location: "front" }]);
    });
});

describe("Motive rolls outside attacks", () => {
    it("a ground vehicle (not hover) that skids rolls on the Motive System Damage Table (TW p. 192)", () => {
        const wheeled = build("wheeled");
        wheeled.startSkidMotiveRoll();
        const [roll] = wheeled.takeFollowUpRolls();
        expect(roll).toEqual({ kind: "motive", direction: "front", cause: "skid" });
        // Wheeled +2; no attack direction modifier.
        expect(wheeled.getMotiveDamageRollModifier("front", "skid")).toBe(2);
        const hover = build("hover");
        expect(hover.startSkidMotiveRoll()).toContain("hover");
        expect(hover.takeFollowUpRolls()).toEqual([]);
    });

    it("every vehicular jump rolls on landing with the jump modifiers, +1 into rough or woods (TO p. 349)", () => {
        const tracked = build("tracked");
        tracked.setJumpMP(3);
        tracked.startJumpLandingRoll(true);
        expect(tracked.takeFollowUpRolls()).toEqual([{ kind: "motive", direction: "front", cause: "jump", roughTerrain: true }]);
        expect(tracked.getMotiveDamageRollModifier("front", "jump", true)).toBe(3);
        const hover = build("hover");
        expect(hover.getMotiveDamageRollModifier("front", "jump", false)).toBe(-1);
        const wige = build("wige");
        expect(wige.getMotiveDamageRollModifier("front", "jump", false)).toBe(-2);
    });
});

describe("VTOL chin turret (TO p. 348)", () => {
    it("cannot target units above the VTOL", () => {
        const vtol = build("vtol", 20);
        vtol.setHasTurret(true);
        const gun = mount(vtol, "machine-gun", "turret");
        const nose = mount(vtol, "medium-laser", "front");
        expect(vtol.getWeaponToHitModifier(gun)).toBe(0);
        vtol.setTargetAbove(true);
        expect(vtol.getWeaponToHitModifier(gun)).toBeNull();
        expect(vtol.getWeaponToHitModifier(nose)).toBe(0);
    });
});

describe("Sponson turrets (TO pp. 348, 411)", () => {
    it("weigh 10% of the weapons in both sponsons, 5% a side rounded up to the half ton, Experimental", () => {
        const tank = build("tracked", 60);
        mount(tank, "large-laser", "left");
        mount(tank, "large-laser", "right");
        expect(tank.setSponsonTurrets(true)).toBe(true);
        expect(tank.getSponsonWeight()).toBe(1);
        expect(tank.getRequiredRulesLevel()).toBeGreaterThanOrEqual(4);
        expect(tank.getSponsonIssue()).toBeNull();
        mount(tank, "medium-laser", "left");
        expect(tank.getSponsonIssue()).toContain("same tonnage");
    });

    it("fire over 180 degrees, cannot jam, and cannot be combined with jump jets", () => {
        const tank = build("tracked", 60);
        const left = mount(tank, "large-laser", "left");
        mount(tank, "large-laser", "right");
        tank.setSponsonTurrets(true);
        expect(tank.getWeaponFiringArc(left)).toEqual({ arc: "left", turretRotation: null, sponson: true });
        expect(tank.describeFiringArc(tank.getWeaponFiringArc(left))).toContain("sponson");
        tank.setJumpMP(2);
        expect(tank.getJumpMP()).toBe(0);
        tank.setSponsonTurrets(false);
        tank.setJumpMP(2);
        expect(tank.setSponsonTurrets(true)).toBe(false);
    });

    it("cost 4,000 C-bills per ton of sponson and survive export/import", () => {
        const tank = build("tracked", 60);
        mount(tank, "large-laser", "left");
        mount(tank, "large-laser", "right");
        tank.setSponsonTurrets(true);
        expect(tank.getCBillCostLog()).toContain("Sponson Turrets");
        const copy = new Vehicle(tank.exportJSON());
        expect(copy.hasSponsonTurrets()).toBe(true);
    });
});

describe("Vehicular jump jets cost (TO p. 411)", () => {
    it("adds 200 x tonnage x Jump MP squared", () => {
        const tank = build("tracked", 40);
        tank.setJumpMP(3);
        expect(tank.getCBillCostLog()).toContain("Jump Jets: 72,000");
    });
});

describe("Rules fixes found in the security review", () => {
    it("a destroyed turret cannot rotate; an Engine Hit set by hand locks the turret", () => {
        const tank = build("tracked");
        tank.setCriticalHit("turretDestroyed", true);
        expect(tank.canRotateTurret("turret")).toBe(false);
        const engine = build("tracked");
        engine.setCriticalHit("engineHit", true);
        expect(engine.getInPlay().criticals.turretLocked).toBe(true);
    });

    it("tracked ammunition survives export/import, clamped to the bin", () => {
        const tank = build("tracked");
        mount(tank, "machine-gun", "front");
        const bin = mount(tank, "ammo-machine-gun-standard", "body");
        bin.currentAmmo = 37;
        const copy = new Vehicle(tank.exportJSON());
        expect(copy.getEquipmentList().find((item) => item.isAmmo)?.currentAmmo).toBe(37);
        const save = JSON.parse(tank.exportJSON());
        save.equipment.find((item: { tag: string }) => item.tag === "ammo-machine-gun-standard").currentAmmo = 1e9;
        expect(new Vehicle(JSON.stringify(save)).getEquipmentList().find((item) => item.isAmmo)?.currentAmmo).toBe(200);
    });
});
