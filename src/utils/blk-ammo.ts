import { getCompatibleAmmo, getEquipmentListByTech } from "../data/equipment-registry";
import { IEquipmentItem } from "../data/data-interfaces";

// Ammunition lines in MegaMek ".blk" files name the weapon they feed ("IS Ammo AC/10", "IS Gauss Ammo",
// "ISRotaryAC2 Ammo", "IS LB 10-X Cluster Ammo", "IS Machine Gun Ammo - Half"). These helpers find the mounted
// weapon the line means and the catalog round for it; they never guess past a weapon that is actually mounted.

const squash = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const unprefixed = (value: string): string => squash(value).replace(/^(clan|is|cl)(?=[a-z0-9])/, "");
/** Short weapon names ammunition lines use where the catalog spells the weapon out. */
const WEAPON_ALIASES: Record<string, string> = Object.assign(Object.create(null), {
    mg: "machinegun", lightmg: "machinegunlight", heavymg: "machinegunheavy", lmg: "machinegunlight", hmg: "machinegunheavy",
});

/** The kind of round a line names: an MML's LRM or SRM rounds, an ATM's ER or HE, Artemis IV or V, Narc-capable, cluster or homing. */
const lineKind = (name: string): RegExp | undefined => {
    const artemis = /artemis\s*v\b/i.test(name) ? "artemis-v" : /artemis/i.test(name) ? "artemis-iv" : "";
    const mml = /\bmml/i.test(name) ? /\b(lrm|srm)\b/i.exec(name)?.[1].toLowerCase() : undefined;
    if (mml) return new RegExp(`-${mml}-${artemis || "standard"}$`);
    if (artemis) return new RegExp(`${artemis}$`);
    const atm = /\batm/i.test(name) ? /\b(er|he)\b/i.exec(name)?.[1].toLowerCase() : undefined;
    if (atm) return new RegExp(`-atm-${atm}$`);
    if (/narc[- ]capable/i.test(name)) return /-narc(-capable)?$/;
    return /cluster/i.test(name) ? /cluster/ : /homing/i.test(name) ? /homing/ : undefined;
};

export interface IBlkAmmoLine {
    /** The weapon part of the line, squashed: "ac10", "gauss", "lb10x". */
    weaponKey: string;
    /** A half-ton bin ("- Half"). */
    half: boolean;
    /** The kind of round where it is not the standard one. */
    kind?: RegExp;
}

/** Reads an ammunition line; null when the line is not ammunition. */
export const parseBlkAmmoLine = (line: string): IBlkAmmoLine | null => {
    // Narc and iNarc lines name their rounds "Pods" ("ISiNarc Pods").
    if (!/ammo|\bpods$/i.test(line)) return null;
    // Vehicle files run the words together ("ISArrowIVHomingAmmo", "CLLargeChemLaserAmmo").
    const name = line.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
    const kind = lineKind(name);
    let weapon = name
        .replace(/\((clan|is)\)/ig, "")
        .replace(/\b(IS|Clan|CL)\b/g, "")
        .replace(/ammo|\bpods$/ig, "")
        // "SC" is the shaped-charge round, the 'Mech Mortar's standard one.
        .replace(/\bSC\b/g, "")
        .replace(/-\s*(half|full)\b/ig, "")
        .replace(/\b(artemis(\s*v)?|narc)[- ]capable\b/ig, "")
        .replace(/\b(cluster|slug|homing|standard)\b/ig, "");
    if (/\bmml/i.test(name)) weapon = weapon.replace(/\b(lrm|srm)\b/ig, "");
    if (/\batm/i.test(name)) weapon = weapon.replace(/\b(er|he)\b/ig, "");
    // "Hyper-Assault Gauss Rifle/20 Ammo" feeds the "Hyper-Assault Gauss 20", "AC/10 Primitive" the "Primitive Prototype AC/10".
    const weaponKey = unprefixed(weapon).replace(/^hyperassaultgaussrifle/, "hyperassaultgauss").replace(/^(.+)primitive$/, "primitiveprototype$1")
        .replace(/^(s|l)rtorpedo/, "$1rt").replace(/chemlaser/, "chemicallaser").replace(/^mortar/, "mechmortar");
    return { weaponKey: WEAPON_ALIASES[weaponKey] ?? weaponKey, half: /-\s*half/i.test(line), kind };
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
