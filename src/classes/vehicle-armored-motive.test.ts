import { describe, expect, it } from "vitest";
import Vehicle from "./vehicle";

describe("Armored Motive System (TO:AUE pp.94-95, errata v7.0)", () => {
    const build = (options: { motive?: string; tonnage?: number; era?: string; tech?: string } = {}): Vehicle => {
        const vehicle = new Vehicle();
        vehicle.setMotiveType(options.motive ?? "tracked");
        vehicle.setTonnage(options.tonnage ?? 55);
        if (options.tech) vehicle.setTech(options.tech);
        if (options.era) vehicle.setEra(options.era);
        return vehicle;
    };
    const armored = (options: Parameters<typeof build>[0] = {}, rulesLevel = 4): Vehicle => {
        const vehicle = build({ era: "jihad", ...options });
        vehicle.setChassisModification("armored-motive", true, rulesLevel);
        return vehicle;
    };

    it("weighs 15% Inner Sphere, 10% Clan, rounded up to the half ton (TO:AUE p.94, errata v7.0)", () => {
        const record = armored({ era: "jihad" }).getChassisModifications()[0];
        expect(armored({ tonnage: 55 }).getChassisModificationWeight(record)).toBe(8.5);
        expect(armored({ tonnage: 55, tech: "clan", era: "clan-inv" }).getChassisModificationWeight(record)).toBe(5.5);
        expect(armored({ tonnage: 70 }).getChassisModificationWeight(record)).toBe(10.5);
        // 10% of 55 t is 5.5 t, already a half ton: the plan's "6" was a slip.
        expect(armored({ tonnage: 58, tech: "clan", era: "clan-inv" }).getChassisModificationWeight(record)).toBe(6);
    });

    it("adds +0.1 to the motive type modifier (TO:AUE p.193)", () => {
        expect(armored().getBattleValueLog()).toContain("chassis modifications +0.1");
        expect(build({ era: "jihad" }).getBattleValueLog()).not.toContain("chassis modifications +0.1");
    });

    it("takes -2 on Motive System Damage Table rolls (TO:AUE p.95)", () => {
        const plain = build({ era: "jihad" });
        const withIt = armored();
        for (const cause of ["attack", "skid", "jump"] as const) {
            expect(withIt.getMotiveDamageRollModifier("front", cause)).toBe(plain.getMotiveDamageRollModifier("front", cause) - 2);
        }
        expect(withIt.getMotiveDamageRollModifier("front")).toBe(plain.getMotiveDamageRollModifier("front") - 2);
    });

    it("gives ARS on the Alpha Strike card (ASCE p.76)", () => {
        expect(armored().getAlphaStrikeStats().specialAbilities).toContain("ARS");
        expect(build({ era: "jihad" }).getAlphaStrikeStats().specialAbilities).not.toContain("ARS");
    });

    it("is refused outside its dates", () => {
        const offered = (vehicle: Vehicle, level: number) => vehicle.getAvailableChassisModifications(level).some((m) => m.tag === "armored-motive");
        expect(offered(build({ era: "civil-war" }), 6)).toBe(false);
        expect(offered(build({ era: "jihad" }), 4)).toBe(true);
        expect(offered(build({ era: "jihad" }), 3)).toBe(false);
        expect(offered(build({ era: "clan-inv", tech: "clan" }), 4)).toBe(true);

        const vehicle = armored();
        expect(vehicle.getChassisModificationIssues()).toEqual([]);
        vehicle.setEra("civil-war");
        expect(vehicle.getChassisModificationIssues()).toHaveLength(1);
        expect(vehicle.getChassisModificationIssues()[0]).toContain("not available before 3071");
    });

    it("is not offered to VTOLs or Support Vehicles", () => {
        const vtol = build({ motive: "vtol", tonnage: 20, era: "jihad" });
        expect(vtol.getAvailableChassisModifications(4).map((m) => m.tag)).not.toContain("armored-motive");
        const support = build({ era: "jihad" });
        support.setSupportVehicle(true);
        expect(support.getAvailableChassisModifications(4)).toEqual([]);
    });

    it("keeps a mounted modification listed and reported when the era no longer offers it (submarine)", () => {
        const sub = armored({ motive: "naval-sub", tonnage: 100 });
        sub.setEra("civil-war");
        expect(sub.getAvailableChassisModifications(4)).toEqual([]);
        expect(sub.getChassisModificationOptions(4).map((m) => m.tag)).toEqual(["armored-motive"]);
        expect(sub.getChassisModificationIssues()).toHaveLength(1);
        sub.setChassisModification("armored-motive", false, 4);
        expect(sub.getChassisModificationOptions(4)).toEqual([]);
    });
});
