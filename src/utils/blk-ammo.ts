import { getCompatibleAmmo, getEquipmentListByTech } from "../data/equipment-registry";
import { IEquipmentItem } from "../data/data-interfaces";

// Ammunition lines in MegaMek ".blk" files name the weapon they feed ("IS Ammo AC/10", "IS Gauss Ammo",
// "ISRotaryAC2 Ammo", "IS LB 10-X Cluster Ammo", "IS Machine Gun Ammo - Half"). These helpers find the mounted
// weapon the line means and the catalog round for it; they never guess past a weapon that is actually mounted.

const squash = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const unprefixed = (value: string): string => squash(value).replace(/^(is|cl|clan)(?=[a-z0-9])/, "");

export interface IBlkAmmoLine {
    /** The weapon part of the line, squashed: "ac10", "gauss", "lb10x". */
    weaponKey: string;
    /** A half-ton bin ("- Half"). */
    half: boolean;
    /** The kind of round where it is not the standard one. */
    kind?: RegExp;
}

/** Reads an ammunition line; null when the line is not ammunition. */
export const parseBlkAmmoLine = (name: string): IBlkAmmoLine | null => {
    if (!/ammo/i.test(name)) return null;
    const kind = /artemis/i.test(name) ? /artemis/ : /cluster/i.test(name) ? /cluster/ : /homing/i.test(name) ? /homing/ : undefined;
    const weapon = name
        .replace(/\((clan|is)\)/ig, "")
        .replace(/\b(IS|Clan|CL)\b/g, "")
        .replace(/ammo/ig, "")
        .replace(/-\s*(half|full)\b/ig, "")
        .replace(/\b(cluster|slug|artemis-capable|artemis capable|homing|standard)\b/ig, "");
    return { weaponKey: unprefixed(weapon), half: /-\s*half/i.test(name), kind };
};

const weaponKeys = (item: IEquipmentItem): string[] =>
    [item.name, item.tag, item.alternateName ?? "", ...(item.altNames ?? []), ...(item.altTags ?? [])].filter(Boolean).map(unprefixed);

/**
 * The mounted weapon an ammunition line feeds: one whose name, tag or import name is the line's weapon, or failing
 * that the shortest one that begins with it ("Gauss" feeds a "Gauss Rifle").
 */
export const findBlkAmmoWeapon = (line: IBlkAmmoLine, mounted: IEquipmentItem[]): IEquipmentItem | undefined => {
    const weapons = mounted.filter((item) => !item.isAmmo && line.weaponKey);
    const exact = weapons.find((item) => weaponKeys(item).includes(line.weaponKey));
    if (exact) return exact;
    return weapons
        .filter((item) => weaponKeys(item).some((key) => key.startsWith(line.weaponKey)))
        .sort((a, b) => squash(a.name).length - squash(b.name).length)[0];
};

let ammoCatalog: IEquipmentItem[] | null = null;

/** The catalog round for a weapon: the line's kind of round, otherwise the standard one, its own tech base first. */
export const findBlkAmmo = (line: IBlkAmmoLine, weapon: IEquipmentItem): IEquipmentItem | undefined => {
    ammoCatalog = ammoCatalog ?? [...getEquipmentListByTech("is", false), ...getEquipmentListByTech("clan", false)].filter((item) => item.isAmmo);
    const wantClan = /clan/.test(weapon.tag);
    const candidates = ammoCatalog.filter((ammo) => getCompatibleAmmo(weapon, ammo))
        .sort((a, b) => Number(b.tag.includes("clan") === wantClan) - Number(a.tag.includes("clan") === wantClan));
    return line.kind
        ? candidates.find((ammo) => line.kind?.test(ammo.tag))
        : candidates.find((ammo) => !ammo.isSpecialAmmo) ?? candidates[0];
};
