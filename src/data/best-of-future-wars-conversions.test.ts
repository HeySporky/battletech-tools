import { describe, expect, it } from "vitest";
import { IEquipmentItem } from "./data-interfaces";
import { getCompatibleAmmo, getEquipmentCatalogDefinitions, getEquipmentRulesLevel } from "./equipment-registry";
import { getPowerBoostedWeapon } from "./best-of-future-wars-conversions";
import snapshot from "./__fixtures__/tech-lists.json";

// Chunk B of the Best of Future Wars plan (#172): items that modify another. Every value was read on the page images of
// The Best of Future Wars, Volume One (1991), pp.27-28. A conversion is a record of its own built from the canon weapon,
// as "PPC w/ Capacitor" is, so it always sits in its weapon's slots and leaves with it.

const all: IEquipmentItem[] = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
const find = (tag: string): IEquipmentItem => {
    const found = all.find((item) => item.tag === tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found;
};

const POM_POMS: [string, string][] = [
    ["custom-pom-pom-ac-2", "autocannon-standard-a"], ["custom-pom-pom-ac-5", "autocannon-standard-b"],
    ["custom-pom-pom-ac-10", "autocannon-standard-c"], ["custom-pom-pom-ac-20", "autocannon-standard-d"],
];
const SWING_FIRES: [string, string][] = [
    ["custom-swing-fire-lrm-5", "lrm-5"], ["custom-swing-fire-lrm-10", "lrm-10"], ["custom-swing-fire-lrm-15", "lrm-15"],
    ["custom-swing-fire-lrm-20", "lrm-20"], ["custom-swing-fire-srm-2", "srm-2"], ["custom-swing-fire-srm-4", "srm-4"],
    ["custom-swing-fire-srm-6", "srm-6"],
];
// The p.28 chart: weapon, extra heat, extra damage, added range.
const BOOSTED: [string, string, number, number, number][] = [
    ["custom-power-booster-ppc", "standard-ppc", 3, 5, 3],
    ["custom-power-booster-large-laser", "large-laser", 2, 4, 3],
    ["custom-power-booster-medium-laser", "medium-laser", 1, 3, 2],
    ["custom-power-booster-small-laser", "small-laser", 1, 2, 1],
];
const BOOSTER_ITEMS = ["custom-power-booster-running", "custom-power-booster-jumping"];
const ALL_TAGS = [...POM_POMS.map(([tag]) => tag), ...SWING_FIRES.map(([tag]) => tag), ...BOOSTED.map(([tag]) => tag),
    "custom-power-booster-gatling-laser", ...BOOSTER_ITEMS];

describe("Rapid Fire Autocannon (Pom-Pom), p.27", () => {
    it.each(POM_POMS)("%s: +5 t, +2 slots, double heat, +100,000 C, same damage, two shots a turn", (tag, baseTag) => {
        const pomPom = find(tag);
        const ac = find(baseTag);
        expect(pomPom.weight).toBe(ac.weight + 5);
        expect(pomPom.space.battlemech).toBe(ac.space.battlemech + 2);
        expect(pomPom.heat).toBe(ac.heat * 2);
        expect(pomPom.cbills).toBe(ac.cbills + 100000);
        expect(pomPom.damage).toBe(ac.damage);
        expect(pomPom.conversion).toMatchObject({ kind: "pom-pom", baseTag, shotsPerTurn: 2, malfunctionRolls: 2 });
    });

    it("cuts 1 hex off short, 2 off medium and 3 off long: the AC/5 is 5 / 10 / 15", () => {
        expect(find("custom-pom-pom-ac-5").range).toMatchObject({ min: 3, short: 5, medium: 10, long: 15 });
        expect(find("custom-pom-pom-ac-2").range).toMatchObject({ short: 7, medium: 14, long: 21 });
        expect(find("custom-pom-pom-ac-20").range).toMatchObject({ short: 2, medium: 4, long: 6 });
    });

    it("takes the same ammunition as its autocannon, special rounds included", () => {
        const pomPom = find("custom-pom-pom-ac-5");
        expect(getCompatibleAmmo(pomPom, find("ammo-ac-5-standard"))).toBe(true);
        expect(getCompatibleAmmo(pomPom, find("ammo-ac-5-sabot"))).toBe(true);
        expect(getCompatibleAmmo(pomPom, find("ammo-ac-10-standard"))).toBe(false);
    });
});

describe("Swing Fire Missile System, p.27", () => {
    it.each(SWING_FIRES)("%s: +3 t, +2 slots, +75,000 C, the rack's own missiles", (tag, baseTag) => {
        const swing = find(tag);
        const rack = find(baseTag);
        expect(swing.weight).toBe(rack.weight + 3);
        expect(swing.space.battlemech).toBe(rack.space.battlemech + 2);
        expect(swing.cbills).toBe(rack.cbills + 75000);
        expect(swing.heat).toBe(rack.heat);
        expect(swing.range).toEqual(rack.range);
        expect(swing.conversion).toMatchObject({ kind: "swing-fire", baseTag, arcDegrees: 180 });
    });

    it("loses accuracy: the page prints no number, so +1 is ours and says so", () => {
        const swing = find("custom-swing-fire-lrm-10");
        expect(find("lrm-10").accuracyModifier).toBe(0);
        expect(swing.accuracyModifier).toBe(1);
        expect(swing.notes).toContain("+1 to-hit is ours");
    });

    it("feeds from the rack's ammunition", () => {
        expect(getCompatibleAmmo(find("custom-swing-fire-lrm-10"), find("ammo-lrm-standard"))).toBe(true);
        expect(getCompatibleAmmo(find("custom-swing-fire-srm-6"), find("ammo-srm-standard"))).toBe(true);
        expect(getCompatibleAmmo(find("custom-swing-fire-srm-6"), find("ammo-lrm-standard"))).toBe(false);
    });
});

describe("Power Booster, p.28", () => {
    it.each(BOOSTED)("%s: +2 t, +1 slot, +750,000 C on the weapon; boosted +%i heat, +%i damage, +%i range", (tag, baseTag, heat, damage, range) => {
        const boosted = find(tag);
        const weapon = find(baseTag);
        expect(boosted.weight).toBe(weapon.weight + 2);
        expect(boosted.space.battlemech).toBe(weapon.space.battlemech + 1);
        expect(boosted.cbills).toBe(weapon.cbills + 750000);
        // The record fires as the plain weapon; the boost is the pilot's choice each turn.
        expect(boosted.heat).toBe(weapon.heat);
        expect(boosted.damage).toBe(weapon.damage);
        expect(boosted.conversion?.booster).toEqual({ target: "weapon", extraHeat: heat, extraDamage: damage, addedRange: range });
    });

    it("a boosted shot adds the chart's heat, damage and range to each band", () => {
        const shot = getPowerBoostedWeapon(find("custom-power-booster-medium-laser"));
        expect(shot).toMatchObject({ heat: 4, damage: 8, range: { min: 0, short: 5, medium: 8, long: 11 } });
    });

    it("on the Gatling Laser the boost is 1 heat, 1 more point a hit and 1 hex", () => {
        const boosted = find("custom-power-booster-gatling-laser");
        expect(boosted.conversion?.booster).toEqual({ target: "weapon", extraHeat: 1, extraDamagePerHit: 1, addedRange: 1 });
        expect(getPowerBoostedWeapon(boosted)).toMatchObject({ heat: 2, damagePerCluster: 3, damageClusters: 6, range: { short: 3, medium: 5, long: 7 } });
    });

    it("the target kind picks the effect: running +2 MP at 1 heat a hex, jumping +50% at double heat", () => {
        const running = find("custom-power-booster-running");
        const jumping = find("custom-power-booster-jumping");
        expect(running.conversion?.booster).toEqual({ target: "running", extraRunMP: 2, runHeatPerHex: 1 });
        expect(jumping.conversion?.booster).toEqual({ target: "jumping", jumpMultiplier: 1.5, jumpHeatMultiplier: 2 });
        for (const item of [running, jumping]) {
            expect(item.weight).toBe(2);
            expect(item.space.battlemech).toBe(1);
            expect(item.cbills).toBe(750000);
            expect(item.maxPerUnit).toBe(1);
            expect(getPowerBoostedWeapon(item)).toBeUndefined();
        }
    });

    it("every booster carries the burn-out track in its notes", () => {
        for (const tag of [...BOOSTED.map(([t]) => t), "custom-power-booster-gatling-laser", ...BOOSTER_ITEMS]) {
            expect(find(tag).notes, tag).toContain("5 or less");
            expect(find(tag).notes, tag).toContain("a 2 burns out");
        }
    });
});

describe("Best of Future Wars conversions: catalog", () => {
    it("every record is Custom Homebrew credited to its author and page", () => {
        for (const tag of ALL_TAGS) {
            const item = find(tag);
            expect(item.catalog, tag).toBe("custom");
            expect(item.rulesLevel, tag).toBe(6);
            expect(getEquipmentRulesLevel(item), tag).toBe(6);
            expect(item.book, tag).toBe("The Best of Future Wars, Volume One");
            expect(item.notes, tag).toContain("*The Best of Future Wars, Volume One* (1991), p");
            expect(item.editionStats, tag).toBeUndefined();
            expect(snapshot.custom, tag).toContain(tag);
        }
    });

    it("no conversion answers to its canon weapon's tag or names", () => {
        for (const tag of ALL_TAGS) {
            const item = find(tag);
            if (!item.conversion?.baseTag) continue;
            expect(item.altTags ?? [], tag).not.toContain(item.conversion.baseTag);
            expect(item.altNames ?? [], tag).toEqual([]);
        }
    });

    // Review finding 1: a copied canon Alpha Strike block converted the weapon (wrongly) while its note said it did not.
    it("no conversion carries an Alpha Strike conversion: unresolved, as every custom record", () => {
        for (const tag of ALL_TAGS) {
            expect(find(tag).alphaStrike, tag).toEqual({ heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] });
        }
    });

    // Review finding 2: the articles convert 'Mech systems; vehicles, fighters and craft got the tonnage without the slots.
    it("every conversion is 'Mech-only", () => {
        for (const tag of ALL_TAGS) {
            const { battlemech, ...others } = find(tag).space;
            expect(battlemech, tag).toBeGreaterThan(0);
            for (const [unit, slots] of Object.entries(others)) expect(slots, `${tag} ${unit}`).toBe(-1);
        }
    });

    // Review finding 3 (owner rule): some stats are ours, so the credit reads "Inspired by"; the unsigned blocks say whose article they run in.
    it("credits read 'Inspired by', and the unsigned blocks say so", () => {
        for (const tag of ALL_TAGS) expect(find(tag).notes, tag).toContain("Inspired by: Karl Sanders, '");
        for (const tag of ["custom-pom-pom-ac-5", "custom-power-booster-ppc", "custom-power-booster-running"]) {
            expect(find(tag).notes, tag).toContain("unsigned");
        }
    });
});
