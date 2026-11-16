import { IEquipmentItem, IEquipmentConversion } from "./data-interfaces";
import { equipmentBallistic } from "./equipment-ballistic";
import { equipmentEnergy } from "./equipment-energy";
import { equipmentMissile } from "./equipment-missile";

/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
 * All official lore, trademarks, and intellectual property belong strictly to
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders.
 * Any original, fan-made content or custom homebrew data processed by this tool
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for
 * tabletop gameplay assistance. Content processed by this file is not intended
 * to challenge any copyright or trademark status, and this data is explicitly
 * excluded from the software's underlying license (GNU GPLv3).
 */

/**
 * The Best of Future Wars, Volume One (1991), pp.27-28 (#172, Chunk B of the fanzine plan): three items that change
 * another. Each converted weapon is a record of its own, made from the canon weapon's record the way "PPC w/ Capacitor"
 * is, so the conversion always shares its weapon's slots and is removed with it. The two Power Boosters that drive
 * the legs or the jump jets are items of their own.
 */

const BOOK = "The Best of Future Wars, Volume One";
const cite = (author: string, title: string, page: number) => `Custom Homebrew: ${author}, '${title}', *${BOOK}* (1991), p.${page}.`;
const UNVALUED = "Battle Value is the base weapon's: the article gives none for the conversion, so ours, unverified.";
const BURN_OUT = "Each use rolls 2D6: 5 or less and the booster fails for good; on a second turn running it fails on 9 or less, "
    + "on a third on 11 or less, and a fourth turn running burns it out. At any time a 2 burns out the system it drives as well "
    + "(a weapon or jump jets must be replaced; a leg booster leaves the 'Mech able only to walk until a major overhaul).";

const canonRecord = (catalog: IEquipmentItem[], tag: string): IEquipmentItem => {
    const record = catalog.find((item) => item.tag === tag);
    if (!record) throw new Error(`Best of Future Wars: canon record ${tag} not found`);
    return record;
};

/** The canon weapon's stats, without the canon identity: no other tags, names, editions or edition overrides. */
const statsOf = (weapon: IEquipmentItem): IEquipmentItem => {
    const stats: IEquipmentItem = { ...weapon, range: { ...weapon.range }, space: { ...weapon.space } };
    delete stats.editions;
    delete stats.editionStats;
    delete stats.introducedInEdition;
    delete stats.alternateName;
    delete stats.prototype;
    return stats;
};

const converted = (weapon: IEquipmentItem, fields: Partial<IEquipmentItem> & { conversion: IEquipmentConversion }): IEquipmentItem => ({
    ...statsOf(weapon),
    altTags: [],
    altNames: [],
    // The canon weapon's ammunition feeds the conversion: its own bins and every special munition it takes.
    ammoTypes: [...(weapon.ammoTypes ?? []), ...((weapon.shotsPerTon ?? 0) > 0 || weapon.ammoTypes?.length ? [`ammo-${weapon.tag}`, ...(weapon.altTags ?? []).map((tag) => `ammo-${tag}`)] : [])],
    munitionTypes: weapon.munitionTypes,
    catalog: "custom",
    rulesLevel: 6,
    introduced: null,
    extinct: null,
    reintroduced: null,
    book: BOOK,
    alphaStrike: { ...weapon.alphaStrike, notes: ["Custom equipment: no Alpha Strike conversion"] },
    ...fields,
});

// --- Rapid Fire Autocannon (Pom-Pom Guns), p.27: unsigned, it runs on in Karl Sanders' article after the Gatling Laser, as the
// Long Range Flamer and the Power Booster do (Chunk A credits the Flamer to him the same way).
const POM_POM_AUTHOR = "Karl Sanders";

const pomPom = (baseTag: string, size: number): IEquipmentItem => {
    const ac = canonRecord(equipmentBallistic, baseTag);
    return converted(ac, {
        name: `Rapid Fire AC/${size} (Pom-Pom)`,
        tag: `custom-pom-pom-ac-${size}`,
        sort: `autocannon, ${String(size).padStart(3, "0")}, rapid fire`,
        weight: ac.weight + 5,
        space: { ...ac.space, battlemech: ac.space.battlemech + 2 },
        heat: ac.heat * 2,
        heatAero: (ac.heatAero ?? ac.heat) * 2,
        cbills: ac.cbills + 100000,
        range: { ...ac.range, short: ac.range.short - 1, medium: ac.range.medium - 2, long: ac.range.long - 3 },
        page: 27,
        conversion: { kind: "pom-pom", baseTag, shotsPerTurn: 2, malfunctionRolls: 2 },
        notes: `${cite(POM_POM_AUTHOR, "Rapid Fire Autocannon (Pom-Pom Guns)", 27)} An AC/${size} converted to fire twice a turn, each shot rolled `
            + "on its own, at double heat even when it fires once. Same damage and rounds per ton as the autocannon; range cut by 1 hex at short, "
            + "2 at medium and 3 at long. Still prone to breakdown: roll twice on the weapons malfunction table and take the worse. "
            + `+5 tons, +2 slots and +100,000 C-bills on the autocannon. ${UNVALUED} Dates are unverified.`,
    });
};

// --- The Swing Fire Missile System, p.27 (same article run as the Gatling Laser).
const worseBy = (modifier: IEquipmentItem["accuracyModifier"], by: number): IEquipmentItem["accuracyModifier"] =>
    typeof modifier === "object" ? { short: modifier.short + by, medium: modifier.medium + by, long: modifier.long + by } : (modifier ?? 0) + by;
const swingFire = (baseTag: string): IEquipmentItem => {
    const rack = canonRecord(equipmentMissile, baseTag);
    return converted(rack, {
        name: `${rack.name} (Swing Fire)`,
        tag: `custom-swing-fire-${baseTag}`,
        sort: `${rack.sort}, swing fire`,
        weight: rack.weight + 3,
        space: { ...rack.space, battlemech: rack.space.battlemech + 2 },
        cbills: rack.cbills + 75000,
        accuracyModifier: worseBy(rack.accuracyModifier, 1),
        page: 27,
        conversion: { kind: "swing-fire", baseTag, arcDegrees: 180 },
        notes: `${cite("Karl Sanders", "The Swing Fire Missile System", 27)} A ${rack.name} rebuilt on a swivel: the pilot can turn its line of sight `
            + "180 degrees in combat. Delicate, and the swivel's give costs accuracy; the page prints no number, so the +1 to-hit is ours. "
            + `+3 tons, +2 slots and +75,000 C-bills on the rack. ${UNVALUED} Dates are unverified.`,
    });
};

// --- Power Booster, p.28. The chart: extra heat, extra damage, added range.
const boosterNotes = (system: string) => `${cite("Karl Sanders", "Power Booster", 28)} A Power Booster hooked to ${system}, noted on the sheet. `
    + `${BURN_OUT} 2 tons, 1 slot, 750,000 C-bills. Dates are unverified.`;

const boostedWeapon = (weapon: IEquipmentItem, tag: string, name: string, booster: NonNullable<IEquipmentConversion["booster"]>): IEquipmentItem => {
    const extraDamage = booster.extraDamage !== undefined ? `+${booster.extraDamage} damage` : `+${booster.extraDamagePerHit} damage a hit`;
    return converted(weapon, {
        name: `${name} w/ Power Booster`,
        tag,
        sort: `${weapon.sort}, power booster`,
        weight: weapon.weight + 2,
        space: { ...weapon.space, battlemech: weapon.space.battlemech + 1 },
        cbills: weapon.cbills + 750000,
        page: 28,
        conversion: { kind: "power-booster", baseTag: weapon.tag, booster },
        notes: `${boosterNotes(`a ${name}`)} Fires as the plain weapon; a boosted shot is +${booster.extraHeat} heat, ${extraDamage} and `
            + `+${booster.addedRange} hex${booster.addedRange === 1 ? "" : "es"} of range (added to each band: the chart's single "Added Range" figure read that way, ours). ${UNVALUED}`,
    });
};

const BOOSTER_CHART: [string, string, number, number, number][] = [
    ["standard-ppc", "PPC", 3, 5, 3],
    ["large-laser", "Large Laser", 2, 4, 3],
    ["medium-laser", "Medium Laser", 1, 3, 2],
    ["small-laser", "Small Laser", 1, 2, 1],
];

const boosterItem = (target: "running" | "jumping"): IEquipmentItem => ({
    name: target === "running" ? "Power Booster (Running)" : "Power Booster (Jump Jets)",
    tag: `custom-power-booster-${target}`,
    techBase: "universal", catalog: "custom", altTags: [], altNames: [],
    sort: `equipment, power booster, ${target}`, category: "Custom Equipment",
    notes: target === "running"
        ? `${boosterNotes("the legs")} Running only: +2 MP to the running speed (no use when walking), at 1 heat a hex run.`
        : `${boosterNotes("the jump jets")} +50% jump (a jump 6 'Mech jumps 9), at double heat a hex. Needs jump jets.`,
    damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 750000, introduced: null, extinct: null, reintroduced: null, battleValue: 0, heat: 0, heatAero: 0, weight: 2,
    range: { min: 0, short: 0, medium: 0, long: 0 },
    space: { battlemech: 1, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
    shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "x", book: BOOK, page: 28, rulesLevel: 6, maxPerUnit: 1,
    conversion: target === "running"
        ? { kind: "power-booster", booster: { target: "running", extraRunMP: 2, runHeatPerHex: 1 } }
        : { kind: "power-booster", booster: { target: "jumping", jumpMultiplier: 1.5, jumpHeatMultiplier: 2 } },
    alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] },
});

export const futureWarsPomPoms = (): IEquipmentItem[] => [
    pomPom("autocannon-standard-a", 2), pomPom("autocannon-standard-b", 5), pomPom("autocannon-standard-c", 10), pomPom("autocannon-standard-d", 20),
];

export const futureWarsSwingFires = (): IEquipmentItem[] => ["lrm-5", "lrm-10", "lrm-15", "lrm-20", "srm-2", "srm-4", "srm-6"].map(swingFire);

/** The boosted weapons; the Gatling Laser is passed in from the custom energy catalog that defines it. */
export const futureWarsBoostedWeapons = (gatling: IEquipmentItem): IEquipmentItem[] => [
    ...BOOSTER_CHART.map(([baseTag, name, extraHeat, extraDamage, addedRange]) => boostedWeapon(canonRecord(equipmentEnergy, baseTag),
        `custom-power-booster-${baseTag === "standard-ppc" ? "ppc" : baseTag}`, name, { target: "weapon", extraHeat, extraDamage, addedRange })),
    { ...boostedWeapon(gatling, "custom-power-booster-gatling-laser", "Gatling Laser", { target: "weapon", extraHeat: 1, extraDamagePerHit: 1, addedRange: 1 }), techBase: gatling.techBase },
];

export const futureWarsBoosterItems = (): IEquipmentItem[] => [boosterItem("running"), boosterItem("jumping")];

/** A boosted weapon's shot with the booster on (p.28), or undefined for anything that is not a weapon booster. */
export function getPowerBoostedWeapon(item: IEquipmentItem): Pick<IEquipmentItem, "heat" | "damage" | "damagePerCluster" | "damageClusters" | "range"> | undefined {
    const booster = item.conversion?.kind === "power-booster" ? item.conversion.booster : undefined;
    if (!booster || booster.target !== "weapon") return undefined;
    const added = booster.addedRange ?? 0;
    return {
        heat: item.heat + (booster.extraHeat ?? 0),
        damage: typeof item.damage === "number" ? item.damage + (booster.extraDamage ?? 0) : item.damage,
        damagePerCluster: item.damagePerCluster !== undefined ? item.damagePerCluster + (booster.extraDamagePerHit ?? 0) : undefined,
        damageClusters: item.damageClusters,
        range: { ...item.range, short: item.range.short + added, medium: item.range.medium + added, long: item.range.long + added },
    };
}
