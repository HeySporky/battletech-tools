import { describe, expect, it } from "vitest";
import { ammoCustom } from "./ammo-custom";
import { ballisticCustom } from "./ballistic-custom";
import { energyCustom } from "./energy-custom";
import { equipmentEnergy } from "./equipment-energy";
import { miscCustom } from "./misc-custom";
import { missileCustom } from "./missile-custom";
import { IEquipmentItem } from "./data-interfaces";

// NGCFells's era rulings of 2026-11-16: where and when each of these items belongs in the setting, and why.

const all: IEquipmentItem[] = [...equipmentEnergy, ...energyCustom, ...miscCustom, ...ballisticCustom, ...ammoCustom];
const record = (tag: string): IEquipmentItem => {
    const found = all.find((item) => item.tag === tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found;
};
const dates = (item: IEquipmentItem) => ({ prototype: item.prototype ?? null, introduced: item.introduced ?? null, extinct: item.extinct ?? null, reintroduced: item.reintroduced ?? null });

describe("era rulings", () => {
    it("COIL: a Clan Wolverine weapon, prototyped 2810, made 2815, lost with the Clan in 2824, back in 3025; Inner Sphere only", () => {
        for (const tag of ["coil_s", "coil_m", "coil_l"]) {
            const item = record(tag);
            expect(dates(item), tag).toEqual({ prototype: 2810, introduced: 2815, extinct: 2824, reintroduced: 3025 });
            expect(item.techBase, tag).toBe("is");
            expect(item.lore, tag).toContain("Clan Wolverine");
            expect(item.lore, tag).toContain("Natasha Kerensky");
            expect(item.lore, tag).toContain("desgra");
            expect(item.notes, tag).toContain("11 June 2807");
            expect(item.notes, tag).toContain("7 July 2824");
            expect(item.notes, tag).toContain("https://www.sarna.net/wiki/Clan_Wolverine");
            // A Clan unit knows a firing COIL by its pattern, breaks Zellbrigen and hunts the carrier first.
            expect(item.lore, tag).toContain("firing pattern");
            expect(item.lore, tag).toContain("breaks Zellbrigen");
            expect(item.rules, tag).toContain("Clan reaction");
            expect(item.rules, tag).toContain("priority target");
            expect(item.rules, tag).toContain("break Zellbrigen");
            expect(item.notes, tag).toContain("Zellbrigen broken");
        }
    });

    it("Fusion Lance: a Succession Wars desperation weapon built on Tikonov III in 3028 (Operation RAT, Capellan against Davion)", () => {
        const lance = record("custom-fusion-lance");
        expect(dates(lance)).toEqual({ prototype: 3028, introduced: 3028, extinct: null, reintroduced: null });
        expect(lance.techBase).toBe("is");
        for (const text of ["Tikonov", "Tikograd", "Capellan", "Crucis Lancers", "Pavel Ridzik", "23 September to 18 October 3028", "Charles Duncan"]) {
            expect(`${lance.lore} ${lance.notes}`, text).toContain(text);
        }
        expect(lance.notes).toContain("are NGCFells's");
        // The Supercharger is only a roll the post borrows; its date plays no part.
        expect(lance.notes).not.toMatch(/Supercharger's technology/);
    });

    it("Smoker: very old tech that never went out of style, for both tech bases", () => {
        const smoker = record("custom-smoker");
        expect(dates(smoker)).toEqual({ prototype: null, introduced: 1950, extinct: null, reintroduced: null });
        expect(smoker.techBase).toBe("universal");
        expect(smoker.lore).toContain("never gone out of style");
    });

    it("Periscope: developed in the Succession Wars for water worlds, Inner Sphere only", () => {
        const periscope = record("custom-mech-periscope");
        expect(periscope.techBase).toBe("is");
        expect(periscope.introduced).toBeGreaterThanOrEqual(2781);
        expect(periscope.introduced).toBeLessThanOrEqual(3049);
        expect(periscope.lore).toContain("water worlds");
        expect(periscope.lore).toContain("Clans took no part");
    });

    it("Buckler Smoke Dispenser: an SLDF design of about 2650, in both tech bases, for second-line units and ArtVees; Gargoyle only markets it", () => {
        const buckler = record("custom-buckler-smoke-dispenser");
        expect(dates(buckler)).toEqual({ prototype: null, introduced: 2650, extinct: null, reintroduced: null });
        expect(buckler.techBase).toBe("universal");
        for (const text of ["SLDF", "ArtVees", "Solahma", "Gargoyle Industries"]) expect(buckler.lore, text).toContain(text);
        expect(buckler.notes).toContain("no end to that production");
    });

    it("EII Point Defense System: a prototype of about 3028 with no production run, so no introduction date", () => {
        const pds = record("custom-eii-pds");
        expect(dates(pds)).toEqual({ prototype: 3028, introduced: null, extinct: null, reintroduced: null });
        expect(pds.notes).toContain("Tikonov");
        expect(pds.notes).toContain("JumpShips");
        expect(dates(record("ammo-custom-eii-pds-standard")).prototype).toBe(3028);
    });

    it("era review of the original articles: Pom-Pom (Marik), Penitrator (Steiner), SABOT (Gargoyle) are Inner Sphere 3025 items; the boosters are 3025", () => {
        const every: IEquipmentItem[] = [...all, ...missileCustom];
        const find = (tag: string) => every.find((item) => item.tag === tag);
        for (const tag of ["custom-pom-pom-ac-2", "custom-pom-pom-ac-20", "custom-penitrator", "ammo-custom-penitrator-standard", "ammo-ac-5-sabot", "ammo-ac-10-sabot"]) {
            const item = find(tag);
            expect(item, tag).toBeDefined();
            expect(item!.techBase, tag).toBe("is");
            expect(item!.introduced, tag).toBe(3025);
            expect(item!.notes, tag).toContain("Era (era review of the original article, 2026-11-17)");
        }
        expect(find("custom-pom-pom-ac-10")!.notes).toContain("House Marik");
        expect(find("custom-penitrator")!.notes).toContain("only House Steiner");
        expect(find("ammo-ac-20-sabot")!.notes).toContain("Gargoyle");
        for (const kind of ["ppc", "large-laser", "medium-laser", "small-laser", "running", "jumping"]) {
            expect(find(`custom-power-booster-${kind}`)!.introduced, kind).toBe(3025);
        }
    });

    it("Long Range Flamer and its fuel: the vehicle flamer's dates (1950, never extinct) and rating", () => {
        const vehicle = all.find((item) => item.tag === "vehicle-flamer")!;
        for (const tag of ["custom-lr-flamer", "ammo-custom-lr-flamer-standard"]) {
            const item = all.find((entry) => entry.tag === tag);
            expect(item, tag).toBeDefined();
            expect(dates(item!), tag).toEqual(dates(vehicle));
            expect(item!.techRating, tag).toBe(vehicle.techRating);
        }
    });

    it("Gatling Laser and its Power Booster: field-tested 3025, in service 3028, never extinct", () => {
        for (const tag of ["custom-gatling-laser", "custom-power-booster-gatling-laser"]) {
            const found = [...energyCustom, ...miscCustom].find((item) => item.tag === tag);
            expect(found, tag).toBeDefined();
            expect(dates(found!), tag).toEqual({ prototype: 3025, introduced: 3028, extinct: null, reintroduced: null });
        }
    });
});
