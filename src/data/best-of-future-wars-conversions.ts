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
// Some stats on every record are NGCFells's (Battle Value at least), so the credit reads "Inspired by" (NGCFells's rule, 2026-11-12).
// The original issue comes first, then the reprint (Chunk R, 2026-11-17: each checked against the original's page image).
const cite = (author: string, title: string, original: string, page: number) =>
    `Custom Homebrew. Inspired by: ${author}, '${title}', ${original}; reprinted in *${BOOK}* (1991), p.${page}.`;
/** Future Wars #9 p.27 and #14 p.46 sign the column "Karl Sander"; #8 p.37 signs it "Karl Sanders". */
const SIGNED = "The original column is signed by Karl Sander; the reprint runs it on unsigned after his Gatling Laser.";
const UNRESOLVED_ALPHA_STRIKE = { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] };
/** The articles convert 'Mech systems: no vehicle, fighter or craft takes them. */
const mechOnly = (battlemech: number): IEquipmentItem["space"] =>
    ({ battlemech, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 });
const UNVALUED = "Battle Value is the base weapon's: the article gives none for the conversion, so ours, unverified.";
// The reprint's wording; the original (Future Wars #14 p.46) has no fourth-turn burnout and says a burned-out leg
// booster leaves the 'Mech able to walk but not run, with no word of an overhaul (Chunk R ledger; NGCFells to rule).
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
    // Unresolved, not the canon block: a copied block converts the weapon as the plain one and loses keywords the notes carried.
    alphaStrike: { ...UNRESOLVED_ALPHA_STRIKE, notes: [...UNRESOLVED_ALPHA_STRIKE.notes] },
    ...fields,
});

// --- Rapid Fire Autocannon (Pom-Pom Guns): Future Wars #9 p.27, Karl Sander's "New Technology..." column (with the Long
// Range Flamer); reprinted unsigned in the Best-of, p.27. Every number matches the original.
const POM_POM_AUTHOR = "Karl Sander";
/** In-character Technical Readout text (NGCFells's). */
const POM_POM_LORE = "A Pom-Pom conversion rebuilds an autocannon's feed and breech to cycle two shells in the time the original fired one. "
    + "The faster cycle costs the barrel some of its reach and doubles the heat it sheds, and the strain makes an already temperamental "
    + "weapon more prone to jams. Most technicians treat it as a field modification rather than a factory weapon.";

const pomPom = (baseTag: string, size: number): IEquipmentItem => {
    const ac = canonRecord(equipmentBallistic, baseTag);
    return converted(ac, {
        name: `Rapid Fire AC/${size} (Pom-Pom)`,
        tag: `custom-pom-pom-ac-${size}`,
        sort: `autocannon, ${String(size).padStart(3, "0")}, rapid fire`,
        weight: ac.weight + 5,
        space: mechOnly(ac.space.battlemech + 2),
        heat: ac.heat * 2,
        heatAero: (ac.heatAero ?? ac.heat) * 2,
        cbills: ac.cbills + 100000,
        range: { ...ac.range, short: ac.range.short - 1, medium: ac.range.medium - 2, long: ac.range.long - 3 },
        page: 27,
        conversion: { kind: "pom-pom", baseTag, shotsPerTurn: 2, malfunctionRolls: 2 },
        notes: `${cite(POM_POM_AUTHOR, "Rapid Fire Auto cannons: (Pom Pom Guns)", "*Future Wars* #9 (1988), p.27", 27)} ${SIGNED} ${UNVALUED} Dates are unverified.`,
        rules: `An AC/${size} converted to fire twice a turn, each shot rolled on its own, at double heat even when it fires once. `
            + "Same damage and rounds per ton as the autocannon; range cut by 1 hex at short, 2 at medium and 3 at long. "
            + "Still prone to breakdown: roll twice on the weapons malfunction table and take the worse. "
            + "+5 tons, +2 slots and +100,000 C-bills on the autocannon.",
        lore: POM_POM_LORE,
    });
};

// --- The Swing Fire Missile System, p.27 (same article run as the Gatling Laser).
const worseBy = (modifier: IEquipmentItem["accuracyModifier"], by: number): IEquipmentItem["accuracyModifier"] =>
    typeof modifier === "object" ? { short: modifier.short + by, medium: modifier.medium + by, long: modifier.long + by } : (modifier ?? 0) + by;
// NGCFells's lore (2026-11-16): the swivel is a Star League (SLDF) mount of about 2750. It was never wholly lost in the Inner
// Sphere (delicate copies kept running through the Succession Wars, which is where the fanzine met it), and the Clans took
// it with the Exodus. A rack's Swing Fire dates from the later of the mount and the rack, and shares the rack's gaps.
const SWING_FIRE_MOUNT_INTRODUCED = 2750;
/** NGCFells's ruling 2026-11-17: the Inner Sphere lost the mount (NGCFells's year 2830) and found it again in the Third Succession War (NGCFells's year 2880); the Clans kept it. */
const SWING_FIRE_IS_LOST = 2830;
const SWING_FIRE_IS_REDISCOVERED = 2880;
const SWING_FIRE_MOUNT = { is: { weight: 3, slots: 2 }, clan: { weight: 1.5, slots: 1 } };
/** In-character Technical Readout text (NGCFells's, built on NGCFells's lore above). */
const swingFireLore = (clan: boolean, torpedo: boolean): string => [
    "The Star League Defense Force fielded the Swing Fire mount around 2750 to let a 'Mech's missiles reach targets outside its "
    + "forward arc without turning the torso. The rack rides a powered ring that the pilot can swing through half a circle. "
    + "The ring's bearings and feed couplings are delicate, and the slack in the mechanism spoils a launcher's aim.",
    clan
        ? "The mount left the Inner Sphere with the Exodus. Clan technicians rebuilt the ring in lighter alloys at half its old mass "
          + "and bulk and fitted it to their own launchers, where it serves warriors who must cover a flank alone."
        : "The Star League's mount was lost in the Succession Wars. In the Third Succession War a cache of design schematics and technical "
          + "manuals turned up, and engineers reverse engineered the ring, so Swing Fire racks are back on Inner Sphere 'Mechs, though few factories build them.",
    torpedo ? "Naval refits put the ring under a torpedo tube, letting a 'Mech wading in the shallows, or swimming on Underwater Maneuvering Units, cover the water around it." : "",
].filter(Boolean).join(" ");
const swingFire = (baseTag: string): IEquipmentItem => {
    const rack = canonRecord(equipmentMissile, baseTag);
    const clan = rack.techBase === "clan";
    const mount = clan ? SWING_FIRE_MOUNT.clan : SWING_FIRE_MOUNT.is;
    const pageRack = /^(lrm|srm)-\d+$/.test(baseTag);
    const torpedo = /(^|-)(lrt|srt)-\d+$/.test(baseTag);
    const introduced = Math.max(rack.introduced ?? rack.prototype ?? SWING_FIRE_MOUNT_INTRODUCED, SWING_FIRE_MOUNT_INTRODUCED);
    const lostAndFound = !clan && introduced < SWING_FIRE_IS_LOST;
    return converted(rack, {
        name: `${rack.name} (Swing Fire)`,
        tag: `custom-swing-fire-${baseTag}`,
        sort: `${rack.sort}, swing fire`,
        weight: rack.weight + mount.weight,
        space: mechOnly(rack.space.battlemech + mount.slots),
        cbills: rack.cbills + 75000,
        accuracyModifier: worseBy(rack.accuracyModifier, 1),
        introduced,
        extinct: lostAndFound ? Math.min(rack.extinct ?? SWING_FIRE_IS_LOST, SWING_FIRE_IS_LOST) : rack.extinct ?? null,
        reintroduced: lostAndFound ? Math.max(rack.reintroduced ?? 0, SWING_FIRE_IS_REDISCOVERED) : rack.reintroduced ?? null,
        page: 27,
        conversion: { kind: "swing-fire", baseTag, arcDegrees: 180 },
        notes: `${cite("Karl Sanders", "Swing Fire Missle System", "*Future Wars* #8 (1988), p.37", 27)} The +1 to-hit is the original's (the reprint drops the number). The original also says the swing takes one turn, fires by AeroTech's front and rear arcs, and that a critical hit on the mount stops the swing; those are not yet in the rules (NGCFells to rule). `
            + (pageRack ? "" : `The page names the Inner Sphere LRM and SRM only; the ${torpedo ? "torpedo" : rack.name} version is NGCFells's. `)
            + (clan ? "The Clan mount is NGCFells's: half the page's weight, as Clan launchers run about half the Inner Sphere's. " : "")
            + `${UNVALUED} Dates are NGCFells's (NGCFells's ruling 2026-11-17): a Star League mount of about 2750 that the Clans took in the Exodus and kept; the Inner Sphere lost it in the Succession Wars (about 2830) and found a cache of design schematics and technical manuals in the Third Succession War (about 2880), from which it was reverse engineered.`,
        rules: `A ${rack.name} on a swivel: the pilot can turn its line of sight 180 degrees in combat. +1 to-hit. `
            + (torpedo ? "It fires only into or through water, as any torpedo rack. " : "")
            + `+${mount.weight} tons, +${mount.slots} slot${mount.slots === 1 ? "" : "s"} and +75,000 C-bills on the rack.`,
        lore: swingFireLore(clan, torpedo),
    });
};

// --- Power Booster, p.28. The chart: extra heat, extra damage, added range.
const BOOSTER_NOTES = `${cite("Karl Sander", "Power booster", "*Future Wars* #14 (1989), p.46", 28)} ${SIGNED} The original's chart also boosts the Hellborer (+5 heat, +20 damage, +8 range), which the reprint drops. Dates are unverified.`;
/** In-character Technical Readout text (NGCFells's): the shared booster paragraph, then what it drives. */
const boosterLore = (driven: string) => "A Power Booster is a bank of capacitors and overdriven couplings that pushes a system past its rated "
    + "output for a few seconds at a time. Every use strains the hardware, and a booster run hard turn after turn will burn itself out, "
    + `sometimes taking the system it drives with it. ${driven}`;
const boosterRules = (system: string) => `A Power Booster hooked to ${system}, noted on the sheet. ${BURN_OUT} 2 tons, 1 slot, 750,000 C-bills.`;

const boostedWeapon = (weapon: IEquipmentItem, tag: string, name: string, booster: NonNullable<IEquipmentConversion["booster"]>): IEquipmentItem => {
    const extraDamage = booster.extraDamage !== undefined ? `+${booster.extraDamage} damage` : `+${booster.extraDamagePerHit} damage a hit`;
    return converted(weapon, {
        name: `${name} w/ Power Booster`,
        tag,
        sort: `${weapon.sort}, power booster`,
        weight: weapon.weight + 2,
        space: mechOnly(weapon.space.battlemech + 1),
        cbills: weapon.cbills + 750000,
        page: 28,
        conversion: { kind: "power-booster", baseTag: weapon.tag, booster },
        notes: `${BOOSTER_NOTES} The chart gives a single "Added Range" figure; adding it to each band is NGCFells's reading. ${UNVALUED}`,
        rules: `${boosterRules(`a ${name}`)} Fires as the plain weapon; a boosted shot is +${booster.extraHeat} heat, ${extraDamage} and `
            + `+${booster.addedRange} hex${booster.addedRange === 1 ? "" : "es"} of range in each band.`,
        lore: boosterLore("Wired to a weapon, it pours extra power into a shot for more damage and reach, at the price of heat."),
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
    notes: BOOSTER_NOTES,
    rules: target === "running"
        ? `${boosterRules("the legs")} Running only: +2 MP to the running speed (no use when walking), at 1 heat a hex run.`
        : `${boosterRules("the jump jets")} +50% jump (a jump 6 'Mech jumps 9), at double heat a hex. Needs jump jets.`,
    lore: boosterLore(target === "running"
        ? "Wired to the leg actuators, it lends a 'Mech a burst of speed at a run, though it does nothing for a walking pace."
        : "Wired to the jump jets, it stretches each jump by half again, while the jets run twice as hot."),
    damage: 0, damageAero: 0, accuracyModifier: 0, cbills: 750000, introduced: null, extinct: null, reintroduced: null, battleValue: 0, heat: 0, heatAero: 0, weight: 2,
    range: { min: 0, short: 0, medium: 0, long: 0 },
    space: mechOnly(1),
    shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: [], techRating: "x", book: BOOK, page: 28, rulesLevel: 6, maxPerUnit: 1,
    conversion: target === "running"
        ? { kind: "power-booster", booster: { target: "running", extraRunMP: 2, runHeatPerHex: 1 } }
        : { kind: "power-booster", booster: { target: "jumping", jumpMultiplier: 1.5, jumpHeatMultiplier: 2 } },
    alphaStrike: { ...UNRESOLVED_ALPHA_STRIKE, notes: [...UNRESOLVED_ALPHA_STRIKE.notes] },
});

export const futureWarsPomPoms = (): IEquipmentItem[] => [
    pomPom("autocannon-standard-a", 2), pomPom("autocannon-standard-b", 5), pomPom("autocannon-standard-c", 10), pomPom("autocannon-standard-d", 20),
];

// p.27 names the Inner Sphere LRM and SRM; every other rack is NGCFells's extension (2026-11-16).
const sizes = (family: string, list: number[]) => list.map((size) => `${family}-${size}`);
const LRM = [5, 10, 15, 20];
const SRM = [2, 4, 6];
export const futureWarsSwingFires = (): IEquipmentItem[] => [
    ...sizes("lrm", LRM), ...sizes("srm", SRM), ...sizes("lrt", LRM), ...sizes("srt", SRM),
    ...sizes("streak-srm", SRM), ...sizes("enhanced-lrm", LRM), ...sizes("enhanced-lrt", LRM), ...sizes("extended-lrm", LRM),
    ...sizes("clan-lrm", LRM), ...sizes("clan-srm", SRM), ...sizes("clan-lrt", LRM), ...sizes("clan-srt", SRM),
    ...sizes("clan-streak-srm", SRM), ...sizes("clan-improved-lrm", LRM), ...sizes("clan-improved-srm", SRM), ...sizes("streak-lrm", LRM),
].map(swingFire);

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
