import { describe, expect, it } from "vitest";
import { capitalWeapons } from "./capital-weapons";
import { subCapitalWeapons } from "./sub-capital-weapons";
import { getEquipmentCatalogDefinitions } from "./equipment-registry";

describe("capital and sub-capital weapon catalogs", () => {
    const all = [...capitalWeapons, ...subCapitalWeapons];
    const find = (tag: string) => all.find(item => item.tag === tag);

    it("lists every capital weapon of TechManual and TO:AUE", () => {
        const byCategory = (category: string) => capitalWeapons.filter(item => item.category === category).map(item => item.name);
        expect(byCategory("Naval Autocannon")).toEqual(["NAC/10", "NAC/20", "NAC/25", "NAC/30", "NAC/35", "NAC/40"]);
        expect(byCategory("Naval Gauss")).toEqual(["Light N-Gauss", "Medium N-Gauss", "Heavy N-Gauss"]);
        expect(byCategory("Naval Laser")).toEqual(["NL35", "NL45", "NL55"]);
        expect(byCategory("Naval PPC")).toEqual(["Light N-PPC", "Medium N-PPC", "Heavy N-PPC"]);
        expect(byCategory("Capital Missile")).toEqual([
            "Killer Whale", "White Shark", "Barracuda", "AR-10 Launcher", "Kraken-T", "Killer Whale-T", "White Shark-T", "Barracuda-T",
        ]);
        expect(byCategory("Screen Launcher")).toEqual(["Screen Launcher"]);
        expect(byCategory("Mass Driver")).toEqual(["Light Mass Driver", "Medium Mass Driver", "Heavy Mass Driver"]);
        expect(capitalWeapons.length).toBe(27);
        expect(capitalWeapons.every(item => item.scale === "capital")).toBe(true);
    });

    it("lists every sub-capital weapon of TO:AUE", () => {
        expect(subCapitalWeapons.map(item => item.name)).toEqual([
            "Light SCC", "Medium SCC", "Heavy SCC", "SCL/1", "SCL/2", "SCL/3", "Piranha", "Stingray", "Swordfish", "Manta Ray",
        ]);
        expect(subCapitalWeapons.every(item => item.scale === "sub-capital")).toBe(true);
    });

    it("cites a book and page for every record and leaves nothing unpriced", () => {
        for (const item of all) {
            expect(["TM", "TO:AUE"], item.tag).toContain(item.book);
            expect(item.page, item.tag).toBeGreaterThan(0);
            expect(item.cbills, item.tag).toBeGreaterThan(0);
            expect(item.weight, item.tag).toBeGreaterThan(0);
            expect(item.battleValue, item.tag).toBeGreaterThan(0);
            expect(item.techRating, item.tag).toMatch(/^[a-f]$/);
            expect(item.availability, item.tag).toMatch(/^[A-FX]-[A-FX]-[A-FX]-[A-FX]$/);
        }
    });

    it("never shares a tag with 'Mech equipment", () => {
        const tags = all.map(item => item.tag);
        expect(new Set(tags).size).toBe(tags.length);
        const mechTags = new Set(getEquipmentCatalogDefinitions().flatMap(definition => definition.equipment)
            .flatMap(item => [item.tag, ...(item.altTags ?? [])]));
        expect(tags.filter(tag => mechTags.has(tag))).toEqual([]);
        // The registry lists no capital catalog: these weapons are never offered to a 'Mech or a vehicle.
        expect(getEquipmentCatalogDefinitions().some(definition => /capital/i.test(definition.id))).toBe(false);
    });

    it("gives energy weapons no ammunition and everything else its shot weight", () => {
        for (const item of all) {
            const energy = ["Naval Laser", "Naval PPC", "Sub-Capital Laser"].includes(item.category);
            if (energy || item.tag === "ar-10-launcher") {
                expect(item.ammo, item.tag).toBeNull();
            } else {
                expect(item.ammo?.tonsPerShot, item.tag).toBeGreaterThan(0);
                expect(item.ammo?.cbills, item.tag).toBeGreaterThan(0);
                expect(item.ammo?.battleValue, item.tag).toBeGreaterThan(0);
            }
        }
    });

    it("carries the printed values (spot checks)", () => {
        // TO:AUE pp.143, 196, 220-221; dates IO:AE p.33
        expect(find("nac-10")).toMatchObject({
            heat: 30, damage: 10, range: "long", weight: 2000, cbills: 2000000, battleValue: 1896,
            ammo: { tonsPerShot: 0.2, cbills: 30000, battleValue: 237 },
            space: { supportVehicle: -1, smallCraft: -1, dropShip: -1, jumpShip: 1, warShip: 1, spaceStation: 1, mobileStructure: 1 },
            techBase: "both", techRating: "d", availability: "E-X-E-E",
            prototype: 2100, introduced: 2195, extinct: 2950, reintroduced: 3051, rulesLevel: 3, book: "TO:AUE", page: 143,
        });
        expect(find("heavy-n-gauss")).toMatchObject({ heat: 18, damage: 30, range: "extreme", weight: 7000, cbills: 50050000, battleValue: 6048, ammo: { tonsPerShot: 0.5 } });
        expect(find("nl55")).toMatchObject({ heat: 85, damage: 5.5, range: "extreme", weight: 1100, cbills: 1250000, battleValue: 1386, introduced: 2305 });
        expect(find("heavy-n-ppc")).toMatchObject({ heat: 225, damage: 15, range: "extreme", weight: 3000, cbills: 9050000, battleValue: 3780, page: 146 });
        // TM pp.210, 292, 296, 318, 342
        expect(find("killer-whale")).toMatchObject({
            heat: 20, damage: 4, range: "extreme", weight: 150, cbills: 150000, battleValue: 769,
            ammo: { tonsPerShot: 50, cbills: 20000, cbillsPer: "shot", battleValue: 96, battleValuePer: "shot" },
            techBase: "both", techRating: "e", availability: "D-E-E-D", prototype: 2200, introduced: 2305, extinct: 2950, reintroduced: 3051,
            rulesLevel: 2, book: "TM", page: 210,
        });
        expect(find("kraken-t")).toMatchObject({ heat: 50, damage: 10, weight: 220, cbills: 500000, battleValue: 2306, techBase: "is", prototype: 3053, introduced: 3057, ammo: { tonsPerShot: 100, cbills: 55000, battleValue: 288 } });
        expect(find("ar-10-launcher")).toMatchObject({ heat: null, damage: null, range: null, weight: 250, cbills: 250000, battleValue: 961, prototype: 2540, introduced: 2550 });
        expect(find("screen-launcher")).toMatchObject({
            heat: 10, damage: null, range: "short", weight: 40, cbills: 250000, battleValue: 160, battleValueDefensive: true,
            ammo: { tonsPerShot: 10, cbills: 10000, battleValue: 20 }, space: { smallCraft: 1, dropShip: 1 }, techBase: "is", book: "TM", page: 237,
        });
        // TO:AUE p.135: WarShips and space stations only, +2 to hit, no production date
        expect(find("light-mass-driver")).toMatchObject({
            heat: 30, damage: 60, range: "long", toHitModifier: 2, weight: 30000, cbills: 150000000, battleValue: 7056,
            ammo: { tonsPerShot: 30, cbills: 150000, battleValue: 882 },
            space: { supportVehicle: -1, smallCraft: -1, dropShip: -1, jumpShip: -1, warShip: 1, spaceStation: 1, mobileStructure: -1 },
            techBase: "is", prototype: 2715, introduced: null, extinct: 2855, reintroduced: 3066, rulesLevel: 4, page: 135,
        });
        // TO:AUE pp.155-156, 196, 222-223
        expect(find("scl-1")).toMatchObject({
            heat: 24, damage: 1, range: "long", weight: 150, cbills: 220000, battleValue: 237, ammo: null,
            space: { supportVehicle: 20, smallCraft: -1, dropShip: 1, jumpShip: 1, warShip: 1, spaceStation: 1, mobileStructure: 1 },
            techBase: "both", availability: "X-X-F-D", prototype: 3069, introduced: 3073, clanDates: { introduced: 3091, extinct: null, reintroduced: null },
        });
        expect(find("manta-ray")).toMatchObject({
            heat: 21, damage: 5, range: "short", weight: 160, cbills: 150000, battleValue: 396,
            ammo: { tonsPerShot: 18, cbills: 30000, battleValue: 50, battleValuePer: "shot" },
            space: { supportVehicle: 38 }, prototype: 3066, introduced: 3072, clanDates: { introduced: 3073, extinct: null, reintroduced: null }, page: 156,
        });
        expect(find("heavy-scc")).toMatchObject({ heat: 42, damage: 7, range: "medium", weight: 700, cbills: 1300000, battleValue: 991, ammo: { tonsPerShot: 2, cbills: 25000, battleValue: 124 }, space: { supportVehicle: 60 } });
    });
});
