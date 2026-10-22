import { IEquipmentItem } from "./data-interfaces";
import { ammoCatalog } from "./ammo";
import { equipmentArtillery } from "./equipment-artillery";

/*
 * Hailstorm artillery: Apocryphal (rules level 5), from the MechWarrior 5: Mercenaries and Clans video games, which
 * show it as an artillery battery and give no tabletop stats. User rulings 2026-10-22: both tech bases; towed only
 * (Support Vehicle trailers); 35 damage at 12 mapsheets (the Long Tom does 25 at 30, TO:AUE p.96); 25 tons; 4 shots
 * a ton; the Long Tom's dates; the munitions the Long Tom, Sniper and Thumper all fire.
 *
 * Derived from the Long Tom (our method, not a published one): cost 15,000 C-bills a ton, as the Long Tom and Sniper;
 * Battle Value 368 x 35/25; heat 20 x 35/25; Support Vehicle slots half the tonnage, rounded down, as the canon tubes.
 * Each round costs and counts per shot as the Long Tom's round x 35/25, so a ton of 4 is x 1.12 the Long Tom's ton of 5.
 */

const SCALE = 35 / 25;
const SHOTS = 4;
const PER_TON = SCALE * SHOTS / 5;

const longTom = equipmentArtillery.find((item) => item.tag === "long-tom-artillery")!;

const sharedMunitions = ["standard", "cluster", "copperhead", "fae", "fascam", "flechette", "illumination", "smoke", "thunder"];

const toHailstorm = (text: string) => text.replace(/long-tom/g, "hailstorm").replace(/Long Tom/g, "Hailstorm");

const apocryphalAlphaStrike = { specialAbility: [], heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Apocryphal: no Alpha Strike conversion"] };

export const artilleryApocryphal: IEquipmentItem[] = [{
    isAmmo: false,
    name: "Hailstorm Artillery",
    altNames: ["Hailstorm", "Hailstorm Artillery Tube"],
    tag: "hailstorm-artillery",
    editions: [],
    techBase: "universal",
    altTags: [],
    sort: "artillery, hailstorm",
    category: "Artillery Weapons",
    notes: "Towed tube artillery from the MechWarrior 5 video games (Apocryphal): a heavy, short-ranged piece that fires as the Long Tom does, "
        + "for 35 points to the target hex, 25, 15 and 5 to the rings around it, out to 12 mapsheets. Mounts only on a Support Vehicle trailer. "
        + "Fires the munitions the Long Tom, Sniper and Thumper share, in its own caliber. Stats by user ruling 2026-10-22; cost, Battle Value and heat "
        + "scaled from the Long Tom.",
    damage: 35,
    damageAero: 35,
    accuracyModifier: 0,
    cbills: 375000,
    introduced: longTom.introduced,
    extinct: null,
    reintroduced: null,
    prototype: longTom.prototype,
    battleValue: Math.round(longTom.battleValue! * SCALE),
    heat: Math.round(longTom.heat * SCALE),
    weight: 25,
    range: { min: 0, short: 0, medium: 0, long: 0, extreme: 0, maxMapSheets: 12 },
    space: { battlemech: -1, protomech: -1, combatVehicle: -1, supportVehicle: 12, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
    shotsPerTon: SHOTS,
    ammoBattleValue: 52,
    ammoTypes: ["ammo-hailstorm-standard"],
    minAmmoTons: 1,
    explosive: false,
    weaponType: ["ART"],
    techRating: longTom.techRating,
    rulesLevel: 5,
    trailerOnly: true,
    book: "MW5",
    page: 0,
    alphaStrike: apocryphalAlphaStrike,
    heatAero: Math.round(longTom.heat * SCALE),
}];

export const ammoApocryphal: IEquipmentItem[] = ammoCatalog
    .filter((item) => sharedMunitions.some((munition) => item.tag.replace(/^ammo-(is|clan)-/, "ammo-") === `ammo-long-tom-${munition}`))
    .map((item): IEquipmentItem => ({
        isAmmo: true,
        isSpecialAmmo: item.isSpecialAmmo,
        name: toHailstorm(item.name),
        altNames: (item.altNames ?? []).map(toHailstorm),
        tag: toHailstorm(item.tag),
        editions: [],
        techBase: item.techBase,
        altTags: (item.altTags ?? []).map(toHailstorm),
        sort: item.sort.replace("long tom", "hailstorm"),
        category: item.category,
        cbills: Math.round(item.cbills * PER_TON),
        introduced: item.introduced,
        extinct: item.extinct,
        reintroduced: item.reintroduced,
        battleValue: Math.round((item.battleValue ?? 0) * PER_TON),
        heat: 0,
        heatAero: 0,
        weight: 1,
        range: { min: 0, short: 0, medium: 0, long: 0 },
        space: { battlemech: -1, protomech: -1, combatVehicle: -1, supportVehicle: 1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        roundsPerTon: Math.max(1, Math.floor((item.roundsPerTon ?? 5) * SHOTS / 5)),
        explosive: item.explosive,
        techRating: item.techRating,
        book: "MW5",
        page: 0,
        alphaStrike: apocryphalAlphaStrike,
        rulesLevel: 5,
        prototype: item.prototype,
        notes: `Hailstorm round (Apocryphal, MechWarrior 5 video games): rules as the Long Tom's ${item.name.replace(/^Long Tom Artillery - /, "")} `
            + `(${item.book} p.${item.page}). Where that round's damage follows the Long Tom's 25, use the Hailstorm's 35 (our provisional reading). `
            + `Cost and Battle Value are the Long Tom round's x 1.12 (35/25 a shot, 4 shots a ton against 5).`,
    }));
