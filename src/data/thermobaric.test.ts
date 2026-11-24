import { describe, expect, it } from "vitest";
import { getAmmoBattleValuePerTon, getEquipmentCatalogDefinitions } from "./equipment-registry";
import { FUEL_AIR_MUNITIONS, getFuelAirBlastDamage, getFuelAirDamage, getFuelAirInfantryDamage, getFuelAirMunition, isFuelAirInfantryDestroyed } from "./thermobaric";

// Thermobaric weapons, fuel-air munitions (#611): rules in Interstellar Operations: Alternate Eras p.159, BV on pp.188-189
// (the Thermobaric Weapons rows of the Alternate Era Weapons and Equipment Battle Value Table), costs in the Additional Alternate Era
// Weapons and Equipment Table (bombs flat, shells 3 x the standard round), BattleForce p.204.
const all = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
const byTag = (tag: string) => all.find((item) => item.tag === tag || item.altTags?.includes(tag))!;

describe("Fuel-Air Munitions Table (IO:AE p.159)", () => {
    it("lists every munition's damage and radius as printed", () => {
        const damage = (tag: string) => getFuelAirMunition(tag)!;
        expect(damage("ammo-bomb-fuel-air-small")).toMatchObject({ damage: [20, 10, 5], radius: 2 });
        expect(damage("ammo-bomb-fuel-air-large")).toMatchObject({ damage: [30, 20, 10, 5], radius: 3 });
        expect(damage("ammo-arrow-iv-fae")).toMatchObject({ damage: [20, 10, 5], radius: 2 });
        for (const tag of ["ammo-thumper-fae", "ammo-thumper-cannon-fae"]) expect(damage(tag)).toMatchObject({ damage: [10, 5], radius: 1 });
        for (const tag of ["ammo-sniper-fae", "ammo-sniper-cannon-fae"]) expect(damage(tag)).toMatchObject({ damage: [20, 10, 5], radius: 2 });
        for (const tag of ["ammo-long-tom-fae", "ammo-long-tom-cannon-fae"]) expect(damage(tag)).toMatchObject({ damage: [30, 20, 10, 5], radius: 3 });
    });

    it("has a catalog record for each, citing p.159, each with its play rules in the record", () => {
        for (const munition of FUEL_AIR_MUNITIONS) {
            for (const tag of munition.tags) {
                const record = byTag(tag);
                expect(record, tag).toBeDefined();
                expect(record.book).toBe("IO:AE");
                expect(record.page).toBe(159);
                expect(record.rules, tag).toMatch(/atmosphere/i);
                expect(record.alphaStrike.notes.join(" "), tag).toMatch(/BattleForce/);
            }
        }
    });

    it("prints no BattleForce value but the one the table gives: 20A, 30A, 10A", () => {
        expect(getFuelAirMunition("ammo-bomb-fuel-air-small")!.battleForce).toBe(20);
        expect(getFuelAirMunition("ammo-bomb-fuel-air-large")!.battleForce).toBe(30);
        expect(getFuelAirMunition("ammo-thumper-cannon-fae")!.battleForce).toBe(10);
        expect(getFuelAirMunition("ammo-sniper-fae")!.battleForce).toBe(20);
        expect(getFuelAirMunition("ammo-long-tom-cannon-fae")!.battleForce).toBe(30);
    });
});

describe("fuel-air play effects (IO:AE p.159)", () => {
    it("does no damage in Very Thin, Trace or Vacuum atmosphere or in space, and half (rounding up) in Thin", () => {
        expect(getFuelAirDamage("ammo-long-tom-fae", "standard")).toEqual([30, 20, 10, 5]);
        expect(getFuelAirDamage("ammo-long-tom-fae", "thin")).toEqual([15, 10, 5, 3]);
        for (const atmosphere of ["very-thin", "trace", "vacuum", "space"] as const) expect(getFuelAirDamage("ammo-long-tom-fae", atmosphere)).toEqual([0, 0, 0, 0]);
    });

    it("doubles the damage on infantry, doubled again in clear or open terrain", () => {
        expect(getFuelAirInfantryDamage(20, false)).toBe(40);
        expect(getFuelAirInfantryDamage(20, true)).toBe(80);
    });

    it("destroys the rest of an infantry unit on 2D6 plus the distance of 9 or less (conventional) or under 7 (battle armor)", () => {
        expect(isFuelAirInfantryDestroyed(7, 2, "conventional")).toBe(true);
        expect(isFuelAirInfantryDestroyed(8, 2, "conventional")).toBe(false);
        expect(isFuelAirInfantryDestroyed(4, 2, "battle-armor")).toBe(true);
        expect(isFuelAirInfantryDestroyed(5, 2, "battle-armor")).toBe(false);
    });

    it("multiplies by 1.5 (rounding up) against a light building or a BAR under 10, halves (rounding down) for Castle Brian or armored buildings", () => {
        expect(getFuelAirBlastDamage(5, { lightBuildingOrLowBar: true })).toBe(8);
        expect(getFuelAirBlastDamage(5, { castleBrianOrArmored: true })).toBe(2);
        expect(getFuelAirBlastDamage(5, { lightBuildingOrLowBar: true, castleBrianOrArmored: true })).toBe(Math.ceil(Math.floor(5 / 2) * 1.5));
        expect(getFuelAirBlastDamage(5, {})).toBe(5);
    });
});

describe("fuel-air Battle Value (IO:AE pp.188-189)", () => {
    const weapon = (tag: string) => byTag(tag);
    it("rates bombs at 37 and 63 each and the Arrow IV missile at its standard round", () => {
        expect(byTag("ammo-bomb-fuel-air-small").battleValue).toBe(37);
        expect(byTag("ammo-bomb-fuel-air-large").battleValue).toBe(63);
        expect(getAmmoBattleValuePerTon(weapon("arrow-iv-system"), byTag("ammo-arrow-iv-fae"))).toBe(30);
    });

    it("rates every shell at 1.4 x the standard ammunition of the weapon that fires it", () => {
        const pairs: [string, string][] = [["thumper-artillery", "ammo-thumper-fae"], ["sniper-artillery", "ammo-sniper-fae"], ["long-tom-artillery", "ammo-long-tom-fae"],
            ["thumper-cannon", "ammo-thumper-cannon-fae"], ["sniper-cannon", "ammo-sniper-cannon-fae"], ["long-tom-cannon", "ammo-long-tom-cannon-fae"]];
        for (const [weaponTag, ammoTag] of pairs) {
            expect(getAmmoBattleValuePerTon(weapon(weaponTag), byTag(ammoTag)), ammoTag).toBeCloseTo(weapon(weaponTag).ammoBattleValue! * 1.4, 5);
        }
    });

    it("costs the shells at 3 x the standard round and the bombs at 18,000 and 35,000", () => {
        expect(byTag("ammo-thumper-fae").cbills).toBe(3 * byTag("ammo-thumper-standard").cbills);
        expect(byTag("ammo-sniper-fae").cbills).toBe(3 * byTag("ammo-sniper-standard").cbills);
        expect(byTag("ammo-long-tom-fae").cbills).toBe(3 * byTag("ammo-long-tom-standard").cbills);
        expect(byTag("ammo-arrow-iv-fae").cbills).toBe(3 * byTag("ammo-is-arrow-iv-standard").cbills);
        expect(byTag("ammo-bomb-fuel-air-small").cbills).toBe(18000);
        expect(byTag("ammo-bomb-fuel-air-large").cbills).toBe(35000);
    });
});
