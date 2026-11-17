import { IEquipmentItem } from "./data-interfaces";
import { applyDerivedValues } from "./derived-custom-values";
import { equipmentBallistic } from "./equipment-ballistic";
import { universalEquipment } from "./universal-equipment";

/*
 * ArtVee design 2026-10-20 (Custom Homebrew): the ComboGuns, an artillery tube with a drop-in autocannon breech.
 * In Vehicle Mode the gun fires as the autocannon (the top-level stats here, range +1/+2/+3 over the AC); in Siege
 * Mode it fires as the canon artillery piece named by `comboArtilleryTag`. Each bin feeds from either family.
 *
 * Battle value: the gun counts once, at the higher of its two profiles: the AC's BV x 1.33 (Vehicle Mode) or the
 * artillery piece's BV for its tech base (Siege Mode; TO:AUE p.195 Inner Sphere, p.197 Clan). Ammo BV is not set
 * here, so each bin counts its own ammunition's BV.
 */

const isBallisticList = equipmentBallistic.filter((item) => item.techBase === "is");

interface IComboGunRow {
    name: string;
    label: string;
    pieceTag: string;
    acTag: string;
    acAmmo: string;
    artilleryAmmo: string;
    asCode: string;
    damage: number;
    heat: number;
    range: { min: number; short: number; medium: number; long: number };
    weight: number;
    cbills: number;
    clanTubeBattleValue: number;
    shotsPerTon: number;
}

const comboRows: IComboGunRow[] = [
    { name: "thumper", label: "Thumper", pieceTag: "thumper-artillery", acTag: "autocannon-standard-b", acAmmo: "ac-5", artilleryAmmo: "ammo-thumper-standard", asCode: "ARTTH-1", damage: 5, heat: 1, range: { min: 3, short: 7, medium: 14, long: 21 }, weight: 15, cbills: 187500, clanTubeBattleValue: 48, shotsPerTon: 20 },
    { name: "sniper", label: "Sniper", pieceTag: "sniper-artillery", acTag: "autocannon-standard-c", acAmmo: "ac-10", artilleryAmmo: "ammo-sniper-standard", asCode: "ARTSN-1", damage: 10, heat: 3, range: { min: 0, short: 6, medium: 12, long: 18 }, weight: 20, cbills: 300000, clanTubeBattleValue: 96, shotsPerTon: 10 },
    { name: "long-tom", label: "Long Tom", pieceTag: "long-tom-artillery", acTag: "autocannon-standard-d", acAmmo: "ac-20", artilleryAmmo: "ammo-long-tom-standard", asCode: "ARTLT-1", damage: 20, heat: 7, range: { min: 0, short: 4, medium: 8, long: 12 }, weight: 30, cbills: 450000, clanTubeBattleValue: 560, shotsPerTon: 5 },
];

function comboGun(row: IComboGunRow, techBase: "is" | "clan"): IEquipmentItem {
    const ac = isBallisticList.find((item) => item.tag === row.acTag);
    if (!ac || ac.battleValue === undefined) throw new Error(`ComboGun: AC record ${row.acTag} not found`);
    const piece = universalEquipment.find((item) => item.tag === row.pieceTag);
    if (!piece || piece.battleValue === undefined) throw new Error(`ComboGun: artillery record ${row.pieceTag} not found`);
    const clan = techBase === "clan";
    // Clan standard AC ammunition is extinct from 2850, so the Clan gun feeds from its own breech rounds.
    const acAmmoTag = clan ? `ammo-custom-clan-artvee-ac-${row.acAmmo.replace("ac-", "")}` : `ammo-${row.acAmmo}-standard`;
    return {
        isAmmo: false,
        name: `ArtVee ${row.label} ComboGun${clan ? " (Clan)" : ""}`,
        altNames: [`ArtVee ${row.label} Combo Gun${clan ? " (Clan)" : ""}`],
        tag: `custom-${clan ? "clan-" : ""}artvee-${row.name}-combo`,
        techBase,
        catalog: "custom",
        comboArtilleryTag: row.pieceTag,
        sort: `artillery, artvee ${row.name} combo`,
        category: "Artillery Weapons",
        weaponType: ["ART"],
        notes: `ArtVee ComboGun (ArtVee design 2026-10-20): fires as ${ac.name} in Vehicle Mode and as the ${row.label} artillery piece in Siege Mode. Feeds from artillery and autocannon ammunition bins.`,
        damage: row.damage,
        damageAero: row.damage,
        accuracyModifier: 0,
        cbills: row.cbills,
        prototype: 2690,
        introduced: 2700,
        extinct: clan ? null : 2865,
        reintroduced: clan ? null : 3071,
        battleValue: Math.max(Math.round(ac.battleValue * 1.33), clan ? row.clanTubeBattleValue : piece.battleValue),
        heat: row.heat,
        heatAero: row.heat,
        weight: row.weight,
        range: { ...row.range },
        space: { battlemech: -1, protomech: -1, combatVehicle: 1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        shotsPerTon: row.shotsPerTon,
        ammoTypes: [row.artilleryAmmo, acAmmoTag],
        shotsPerTonByAmmo: { [row.artilleryAmmo]: row.shotsPerTon, [acAmmoTag]: row.shotsPerTon },
        minAmmoTons: 1,
        explosive: false,
        techRating: "e",
        rulesLevel: 6,
        book: "Custom",
        page: 0,
        alphaStrike: {
            ...JSON.parse(JSON.stringify(ac.alphaStrike)),
            specialAbility: [row.asCode],
            notes: ["Artillery special: Siege Mode only"],
        },
    };
}

export const artilleryCustom: IEquipmentItem[] = applyDerivedValues([
    ...comboRows.map((row) => comboGun(row, "is")),
    ...comboRows.map((row) => comboGun(row, "clan")),
    {
        // Solaris7 forum idea (#301, 'Custom Senario weapon', July-August 2018): Prince's roguelike-campaign superweapon, built
        // as he set it out on an Arrow IV baseline. Munchkin by design ("a superweapon for the PCs to find").
        name: "Nuclear Pulse Cannon", tag: "custom-nuclear-pulse-cannon", techBase: "is", catalog: "custom", sort: "artillery, nuclear pulse cannon", category: "Artillery Weapons",
        notes: "Munchkin by Prince, Solaris7 forum ('Custom Senario weapon - comments and criticisms needed!', 2018): a Rim Worlds Republic wonder weapon, a "
            + "mirrored breech-loading chamber that detonates a small nuclear charge and directs the blast out of the barrel. A direct-fire artillery weapon "
            + "(it cannot fire indirectly) that AMS cannot stop. 35 damage to the target hex and 18 to each adjacent hex; a target that tracks heat also takes "
            + "2D6 heat, any other takes 2D6 more damage (Thunder's pointer to the plasma rifle rule, TW p.139). Each shot generates 20 heat plus 1D6 more from "
            + "the charge. After 20 shots the barrel and firing assembly must be replaced, and firing makes the unit radioactive. 3 charges a ton. "
            + "Prince settled on 35 damage; heat is the top of his 15-20. Not printed in the thread: weight, slots and range are the Arrow IV's (TO:AUE p.96), "
            + "the adjacent damage half the target's as the Arrow IV's 20/10, dates and tech rating the Davy Crockett-M round's; BV 420 is the Arrow IV's "
            + "12 a point of damage (240 for 20) and cost is its 450,000 C-bills.",
        damage: 35, damageAero: 35, accuracyModifier: 0, cbills: 450000, prototype: 2593, introduced: 2600, extinct: 2830, reintroduced: 3044, battleValue: 420, heat: 20, heatAero: 20, weight: 15,
        range: { min: 0, maxMapSheets: 8, short: 0, medium: 0, long: 0 },
        space: { battlemech: 15, protomech: -1, combatVehicle: 1, supportVehicle: 7, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 3, ammoTypes: ["ammo-custom-nuclear-pulse-cannon-standard"], ammoBattleValue: 53, minAmmoTons: 1, explosive: false, weaponType: ["ART"], techRating: "f",
        book: "http://solaris7.com/thread/custom-senario-weapon-comments-and-criticisms-needed/", page: 0, rulesLevel: 7,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike conversion"] },
    },
]);

/** The canon artillery piece a ComboGun fires as in Siege Mode, or undefined for any other item. */
export function getComboArtillery(item: IEquipmentItem): IEquipmentItem | undefined {
    if (!item.comboArtilleryTag) return undefined;
    return universalEquipment.find((piece) => piece.tag === item.comboArtilleryTag);
}
