import { describe, expect, it } from "vitest";
import { artilleryCustom, getComboArtillery } from "./artillery-custom";
import { getCompatibleAmmo, getEquipmentCatalogDefinitions, getEquipmentRulesLevel, getWeaponShotsPerTon } from "./equipment-registry";
import { ammoCatalog } from "./ammo";
import { ammoCustom } from "./ammo-custom";
import { IEquipmentItem } from "./data-interfaces";

const isAmmoList = ammoCatalog.filter((item) => item.techBase === "is");
const clanAmmoList = ammoCatalog.filter((item) => item.techBase === "clan");
const universalAmmoList = ammoCatalog.filter((item) => item.techBase === "universal");

const allAmmo = [...universalAmmoList, ...isAmmoList, ...clanAmmoList, ...ammoCustom];
const ammo = (tag: string): IEquipmentItem => {
    const found = allAmmo.find((item) => item.tag === tag);
    if (!found) throw new Error(`no ammo ${tag}`);
    return found;
};
const gun = (tag: string): IEquipmentItem => {
    const found = artilleryCustom.find((item) => item.tag === tag);
    if (!found) throw new Error(`no gun ${tag}`);
    return found;
};

const rows = [
    { name: "thumper", piece: "thumper-artillery", damage: 5, heat: 1, range: { min: 3, short: 7, medium: 14, long: 21 }, weight: 15, cbills: 187500, bv: 93, clanBv: 93, ac: "5", shots: 20 },
    { name: "sniper", piece: "sniper-artillery", damage: 10, heat: 3, range: { min: 0, short: 6, medium: 12, long: 18 }, weight: 20, cbills: 300000, bv: 164, clanBv: 164, ac: "10", shots: 10 },
    { name: "long-tom", piece: "long-tom-artillery", damage: 20, heat: 7, range: { min: 0, short: 4, medium: 8, long: 12 }, weight: 30, cbills: 450000, bv: 368, clanBv: 560, ac: "20", shots: 5 },
];

describe("ArtVee combo guns", () => {
    it("each combo gun fires as its canon artillery piece in Siege Mode", () => {
        for (const row of rows) {
            for (const tag of [`custom-artvee-${row.name}-combo`, `custom-clan-artvee-${row.name}-combo`]) {
                expect(getComboArtillery(gun(tag))?.tag).toBe(row.piece);
            }
        }
        expect(getComboArtillery({ ...gun("custom-artvee-thumper-combo"), comboArtilleryTag: undefined })).toBeUndefined();
    });

    it("carries the Vehicle Mode AC profile with +1/+2/+3 range (ArtVee design 2026-10-20)", () => {
        expect(artilleryCustom).toHaveLength(6);
        for (const row of rows) {
            for (const tag of [`custom-artvee-${row.name}-combo`, `custom-clan-artvee-${row.name}-combo`]) {
                const item = gun(tag);
                expect(item.damage).toBe(row.damage);
                expect(item.heat).toBe(row.heat);
                expect(item.range).toEqual(row.range);
                expect(item.weight).toBe(row.weight);
                expect(item.cbills).toBe(row.cbills);
                expect(item.weaponType).toEqual(["ART"]);
                expect(item.category).toBe("Artillery Weapons");
                expect(item.space.combatVehicle).toBe(1);
            }
        }
    });

    // Higher of AC BV x 1.33 and the tube BV for the tech base: TO:AUE p.195 (IS Long Tom 368), p.197 (Clan Long Tom 560).
    it("counts once at the higher profile's BV, the tube BV by tech base", () => {
        for (const row of rows) {
            expect(gun(`custom-artvee-${row.name}-combo`).battleValue).toBe(row.bv);
            expect(gun(`custom-clan-artvee-${row.name}-combo`).battleValue).toBe(row.clanBv);
        }
    });

    it("feeds from both artillery and AC bins", () => {
        for (const row of rows) {
            const other = rows.find((candidate) => candidate.ac !== row.ac)!;
            const artilleryAmmo = ammo(`ammo-${row.name}-standard`);
            const isGun = gun(`custom-artvee-${row.name}-combo`);
            const clanGun = gun(`custom-clan-artvee-${row.name}-combo`);
            expect(getCompatibleAmmo(isGun, artilleryAmmo)).toBe(true);
            expect(getCompatibleAmmo(isGun, ammo(`ammo-is-ac-${row.ac}-standard`))).toBe(true);
            expect(getCompatibleAmmo(isGun, ammo(`ammo-is-ac-${other.ac}-standard`))).toBe(false);
            expect(getCompatibleAmmo(clanGun, ammo(`ammo-custom-clan-artvee-ac-${row.ac}`))).toBe(true);
            expect(getWeaponShotsPerTon(isGun, artilleryAmmo)).toBe(row.shots);
            expect(getWeaponShotsPerTon(isGun, ammo(`ammo-is-ac-${row.ac}-standard`))).toBe(row.shots);
            expect(getWeaponShotsPerTon(clanGun, ammo(`ammo-custom-clan-artvee-ac-${row.ac}`))).toBe(row.shots);
        }
    });

    it("the Clan combos do not feed from Clan standard AC ammunition (extinct 2850) but from breech rounds with the canon IS AC stats", () => {
        for (const row of rows) {
            const clanGun = gun(`custom-clan-artvee-${row.name}-combo`);
            const breech = ammo(`ammo-custom-clan-artvee-ac-${row.ac}`);
            const canon = ammo(`ammo-is-ac-${row.ac}-standard`);
            expect(getCompatibleAmmo(clanGun, ammo(`ammo-clan-ac-${row.ac}-standard`))).toBe(false);
            expect(breech).toMatchObject({ techBase: "clan", catalog: "custom", rulesLevel: 6, book: "Custom", page: 0, prototype: 2690, introduced: 2700, extinct: null, reintroduced: null });
            for (const key of ["weight", "roundsPerTon", "cbills", "battleValue", "explosive", "techRating"] as const) {
                expect(breech[key], key).toEqual(canon[key]);
            }
            expect(breech.notes).toContain("ArtVee ruling 2026-10-21");
        }
    });

    it("is Custom Homebrew and vehicle-only", () => {
        for (const item of artilleryCustom) {
            expect(getEquipmentRulesLevel(item)).toBe(6);
            expect(item.catalog).toBe("custom");
            expect(item.space.battlemech).toBe(-1);
            expect(item.space.aerospaceFighter).toBe(-1);
            expect(item.space.supportVehicle).toBe(-1);
        }
    });

    it("is registered in the custom artillery catalog with IS and Clan dates", () => {
        const definition = getEquipmentCatalogDefinitions().find((catalog) => catalog.id === "artillery-custom");
        expect(definition?.custom).toBe(true);
        expect(definition?.category).toBe("artillery");
        expect(gun("custom-artvee-sniper-combo")).toMatchObject({ techBase: "is", prototype: 2690, introduced: 2700, extinct: 2865, reintroduced: 3071 });
        expect(gun("custom-clan-artvee-sniper-combo")).toMatchObject({ techBase: "clan", prototype: 2690, introduced: 2700, extinct: null, reintroduced: null });
    });
});
