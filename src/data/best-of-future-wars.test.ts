import { describe, expect, it } from "vitest";
import { IEquipmentItem } from "./data-interfaces";
import { getCompatibleAmmo, getEquipmentCatalogDefinitions, getEquipmentRulesLevel, getWeaponShotsPerTon } from "./equipment-registry";
import snapshot from "./__fixtures__/tech-lists.json";

// Chunk A of the Best of Future Wars plan (#172): the plain equipment records. Every value below was read on the page
// image of The Best of Future Wars, Volume One (1991); see the ledger for what each page printed and left out.

const all: IEquipmentItem[] = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
const find = (tag: string): IEquipmentItem => {
    const found = all.find((item) => item.tag === tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found;
};
const canon = (tag: string): IEquipmentItem => find(tag);

const WEAPONS = ["custom-gatling-laser", "custom-lr-flamer", "custom-eii-pds", "custom-penitrator"];
const AMMO = [
    "ammo-custom-lr-flamer-standard", "ammo-custom-eii-pds-standard", "ammo-is-gauss-rifle-vhe", "ammo-is-gauss-rifle-inferno",
    "ammo-ac-2-sabot", "ammo-ac-5-sabot", "ammo-ac-10-sabot", "ammo-ac-20-sabot", "ammo-custom-penitrator-standard",
];
const AUTHOR_AND_PAGE: Record<string, [string, number]> = {
    "custom-gatling-laser": ["Karl Sanders", 27],
    "custom-lr-flamer": ["Karl Sanders", 28],
    "ammo-custom-lr-flamer-standard": ["Karl Sanders", 28],
    "custom-eii-pds": ["Mike Reese", 8],
    "ammo-custom-eii-pds-standard": ["Mike Reese", 8],
    "ammo-is-gauss-rifle-vhe": ["Chris Congdon", 11],
    "ammo-is-gauss-rifle-inferno": ["Chris Congdon", 11],
    "ammo-ac-2-sabot": ["Charles J. Tomaszewski", 21],
    "ammo-ac-5-sabot": ["Charles J. Tomaszewski", 21],
    "ammo-ac-10-sabot": ["Charles J. Tomaszewski", 21],
    "ammo-ac-20-sabot": ["Charles J. Tomaszewski", 21],
    "custom-penitrator": ["Herb Barents", 20],
    "ammo-custom-penitrator-standard": ["Herb Barents", 20],
};

describe("Best of Future Wars equipment (Custom Homebrew)", () => {
    it("Gatling Laser: 2 points a hit, 6 shots on the SRM 6 cluster column, 1-2 / 3-4 / 5-6, 4 t, 2 slots, 50,000 C", () => {
        const gatling = find("custom-gatling-laser");
        expect(gatling.damagePerCluster).toBe(2);
        expect(gatling.damageClusters).toBe(6);
        expect(gatling.range).toMatchObject({ min: 0, short: 2, medium: 4, long: 6 });
        expect(gatling.weight).toBe(4);
        expect(gatling.space.battlemech).toBe(2);
        expect(gatling.cbills).toBe(50000);
        // Printed in no stat block: Battle Value is derived (derived-cost-and-bv.test.ts), 12 damage over 6 hexes.
        expect(gatling.battleValue).toBe(72);
        // The stat block prints no heat; ours, from the prose ("retards heat build-up by 75%").
        expect(gatling.heat).toBeGreaterThan(0);
        expect(gatling.notes).toContain("Not printed in The Best of Future Wars");
        expect(gatling.notes).toContain("heat is ours, 1");
    });

    it("Long Range Flamer: 5 + 5 heat, 1-4 / 5-8 / 9-12, 15 shots a ton, heat 8, 5 t, 2 slots, 65,000 C", () => {
        const flamer = find("custom-lr-flamer");
        const ammo = find("ammo-custom-lr-flamer-standard");
        expect(flamer.damage).toBe(5);
        expect(flamer.range).toMatchObject({ min: 0, short: 4, medium: 8, long: 12 });
        expect(flamer.heat).toBe(8);
        expect(flamer.weight).toBe(5);
        expect(flamer.space.battlemech).toBe(2);
        expect(flamer.cbills).toBe(65000);
        expect(flamer.shotsPerTon).toBe(15);
        expect(ammo.roundsPerTon).toBe(15);
        expect(flamer.rules).toContain("2 plus 5");
        expect(flamer.rules).toContain("0 plus 5");
        expect(ammo.explosive).toBe(true);
        expect(ammo.rules).toContain("hit that many times");
        expect(getCompatibleAmmo(flamer, ammo)).toBe(true);
        expect(getWeaponShotsPerTon(flamer, ammo)).toBe(15);
    });

    it("EII Point Defense System: 2 t, 2 slots, 0.5 t of ammo built in (50 bursts), damage 4, range 1 / 2 / 3, 100 bursts a ton", () => {
        const pds = find("custom-eii-pds");
        const ammo = find("ammo-custom-eii-pds-standard");
        expect(pds.weight).toBe(2);
        expect(pds.space.battlemech).toBe(2);
        expect(pds.damage).toBe(4);
        expect(pds.heat).toBe(0);
        expect(pds.range).toMatchObject({ min: 0, short: 1, medium: 2, long: 3 });
        expect(pds.rules).toContain("50 bursts");
        expect(ammo.roundsPerTon).toBe(100);
        expect(getCompatibleAmmo(pds, ammo)).toBe(true);
        expect(getWeaponShotsPerTon(pds, ammo)).toBe(100);
        // Printed in no stat block: cost, derived from the Anti-Missile System that does the same job (derived-cost-and-bv.test.ts).
        expect(pds.cbills).toBe(100000);
        // Not printed: the year is ours, the 3025 baseline of the fanzine (derived-custom-values.ts).
        expect(pds.introduced).toBe(3025);
    });

    it("VHE Gauss shell: 5 shots a ton, damage 20 / 5, 1-4 / 5-12 / 13-19, feeds the Gauss Rifle, introduced 3040", () => {
        const vhe = find("ammo-is-gauss-rifle-vhe");
        const gauss = canon("standard-gauss-rifle");
        expect(vhe.roundsPerTon).toBe(5);
        expect(vhe.range).toMatchObject({ min: 0, short: 4, medium: 12, long: 19 });
        expect(vhe.rules).toContain("20");
        expect(vhe.rules).toContain("30 points");
        expect(vhe.introduced).toBe(3040);
        expect(getCompatibleAmmo(gauss, vhe)).toBe(true);
        expect(getWeaponShotsPerTon(gauss, vhe)).toBe(5);
    });

    it("Liao Inferno Gauss shell: 8 shots a ton, 2 + 10 heat a turn for 5 turns, 1-7 / 8-15 / 16-22, feeds the Gauss Rifle", () => {
        const inferno = find("ammo-is-gauss-rifle-inferno");
        const gauss = canon("standard-gauss-rifle");
        expect(inferno.roundsPerTon).toBe(8);
        expect(inferno.range).toMatchObject({ min: 0, short: 7, medium: 15, long: 22 });
        expect(inferno.rules).toContain("30 heat");
        expect(inferno.rules).toContain("20");
        // An ammo hit adds heat (p.11), not damage: the generic explosion code must stay off it.
        expect(inferno.explosive).toBe(false);
        expect(inferno.notes).toContain("heat, not damage");
        expect(getCompatibleAmmo(gauss, inferno)).toBe(true);
        expect(getWeaponShotsPerTon(gauss, inferno)).toBe(8);
    });

    it("SABOT shells: one round in five, the chart's 4 / 3 / 2 / 1 a ton, feed the four standard autocannon", () => {
        const chart: [string, string, number, string][] = [
            ["autocannon-standard-a", "ammo-ac-2-sabot", 4, "1 external, 1 internal"],
            ["autocannon-standard-b", "ammo-ac-5-sabot", 3, "3 external, 2 internal"],
            ["autocannon-standard-c", "ammo-ac-10-sabot", 2, "5 external, 3 internal"],
            ["autocannon-standard-d", "ammo-ac-20-sabot", 1, "10 external, 5 internal"],
        ];
        for (const [weaponTag, ammoTag, rounds, damage] of chart) {
            const ammo = find(ammoTag);
            const weapon = canon(weaponTag);
            expect(ammo.roundsPerTon, ammoTag).toBe(rounds);
            expect(ammo.rules, ammoTag).toContain(damage);
            expect(ammo.rules, ammoTag).toContain("+1");
            expect(getCompatibleAmmo(weapon, ammo), ammoTag).toBe(true);
            expect(getWeaponShotsPerTon(weapon, ammo), ammoTag).toBe(rounds);
        }
        // An AC/5 does not fire the AC/20 round.
        expect(getCompatibleAmmo(canon("autocannon-standard-b"), find("ammo-ac-20-sabot"))).toBe(false);
    });

    it("The Penitrator: 3 t launcher, 0.5 t missile (2 a ton), 8 / 12 / 24 / 36 hexes, about 250,000 C a ton", () => {
        const launcher = find("custom-penitrator");
        const missile = find("ammo-custom-penitrator-standard");
        expect(launcher.weight).toBe(3);
        expect(launcher.range).toMatchObject({ min: 8, short: 12, medium: 24, long: 36 });
        expect(missile.roundsPerTon).toBe(2);
        expect(missile.cbills).toBe(250000);
        expect(launcher.rules).toContain("1d8");
        expect(launcher.rules).toContain("1d6");
        expect(launcher.rules).toContain("1d4");
        expect(launcher.rules).toContain("1d4/2");
        expect(launcher.rules).toMatch(/critical/);
        expect(launcher.notes).toContain("minimum range of 8 is ours");
        expect(getCompatibleAmmo(launcher, missile)).toBe(true);
        expect(getWeaponShotsPerTon(launcher, missile)).toBe(2);
    });

    it("every record is Custom Homebrew fan material credited to its author and printed page", () => {
        for (const tag of [...WEAPONS, ...AMMO]) {
            const item = find(tag);
            const [author, page] = AUTHOR_AND_PAGE[tag];
            expect(item.catalog, tag).toBe("custom");
            expect(item.rulesLevel, tag).toBe(6);
            expect(getEquipmentRulesLevel(item), tag).toBe(6);
            expect(item.book, tag).toBe("The Best of Future Wars, Volume One");
            expect(item.page, tag).toBe(page);
            expect(item.notes, tag).toContain(`${author}, '`);
            expect(item.notes, tag).toContain("*The Best of Future Wars, Volume One* (1991), p");
        }
    });

    // Owner ruling (2026-11-16): notes keep the source and credit, Rules hold the play text, Lore the in-character TRO text.
    it("every record splits credit notes, play Rules and TRO Lore", () => {
        for (const tag of [...WEAPONS, ...AMMO]) {
            const item = find(tag);
            expect(item.rules, tag).toBeTruthy();
            expect(item.lore, tag).toBeTruthy();
            expect(item.rules, tag).not.toContain("Custom Homebrew");
            expect(item.lore, tag).not.toContain("Custom Homebrew");
            expect(item.lore, tag).not.toMatch(/\bours\b|unverified/);
        }
    });

    it("every record's tag is in the custom tech list fixture", () => {
        for (const tag of [...WEAPONS, ...AMMO]) {
            expect(snapshot.custom, tag).toContain(tag);
        }
    });

    it("ammunition is ammunition and weapons are not", () => {
        for (const tag of AMMO) expect(find(tag).isAmmo, tag).toBe(true);
        for (const tag of WEAPONS) expect(find(tag).isAmmo ?? false, tag).toBe(false);
    });
});
