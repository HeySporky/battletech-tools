import { capitalWeapons } from "./capital-weapons";
import { subCapitalWeapons } from "./sub-capital-weapons";
import { ICapitalWeapon } from "./data-interfaces";
import { btRulesExpansions, getEditionStats, getEditionTimeline, getRulesEdition } from "./rules-editions";

// Capital and sub-capital weapons by tag, with the weight, cost and Battle Value of their ammunition. Each record
// prints its ammunition values per shot or per ton (ammo.cbillsPer, ammo.battleValuePer); these helpers turn a
// number of shots into tons, C-bills and BV whichever way the record is written.

export const CAPITAL_WEAPON_CATALOG: ICapitalWeapon[] = [...capitalWeapons, ...subCapitalWeapons];

/** The missiles an AR-10 fires: the standard ones only (TM p.342). */
export const AR10_MISSILE_TAGS = ["killer-whale", "white-shark", "barracuda"];

export const findCapitalWeapon = (tag: string): ICapitalWeapon | undefined => CAPITAL_WEAPON_CATALOG.find((weapon) => weapon.tag === tag);

const squash = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** A capital or sub-capital weapon by its name or one of its import names, ignoring case, spaces and punctuation. */
export const findCapitalWeaponByName = (name: string): ICapitalWeapon | undefined => {
    const key = squash(name);
    return key ? CAPITAL_WEAPON_CATALOG.find((weapon) => [weapon.name, weapon.tag, ...weapon.altNames].some((entry) => squash(entry) === key)) : undefined;
};

/** The weapons whose ammunition this one fires: its own, or the three standard missiles for an AR-10. */
export const getCapitalAmmoTags = (weapon: ICapitalWeapon): string[] =>
    weapon.tag === "ar-10-launcher" ? [...AR10_MISSILE_TAGS] : weapon.ammo ? [weapon.tag] : [];

export const getCapitalAmmoTons = (tag: string, shots: number): number => shots * (findCapitalWeapon(tag)?.ammo?.tonsPerShot ?? 0);

export const getCapitalAmmoCost = (tag: string, shots: number): number => {
    const ammo = findCapitalWeapon(tag)?.ammo;
    if (!ammo || ammo.cbills === null) return 0;
    return ammo.cbills * shots * (ammo.cbillsPer === "ton" ? ammo.tonsPerShot ?? 0 : 1);
};

export const getCapitalAmmoBattleValue = (tag: string, shots: number): number => {
    const ammo = findCapitalWeapon(tag)?.ammo;
    if (!ammo || ammo.battleValue === null) return 0;
    return ammo.battleValue * shots * (ammo.battleValuePer === "ton" ? ammo.tonsPerShot ?? 0 : 1);
};

/**
 * A capital or sub-capital weapon as `editionTag` prints it (BattleSpace, AeroTech 2 and AeroTech 2, Revised are
 * expansions; #151): a copy with that book's heat, damage, range, weight, prices, Battle Values and citation. The
 * record itself where the edition has no stats of its own (Total Warfare on). An edition with no Battle Value keeps
 * the catalog's figure, as getItemBattleValue does.
 */
export const getCapitalWeaponForEdition = (weapon: ICapitalWeapon, editionTag: string): ICapitalWeapon => {
    const stats = getEditionStats(weapon, editionTag);
    if (!stats) return weapon;
    const copy: ICapitalWeapon = { ...weapon, book: stats.book, page: stats.page, ammo: weapon.ammo ? { ...weapon.ammo } : null };
    if (stats.heat !== undefined) copy.heat = stats.heat;
    if (stats.damage !== undefined) copy.damage = stats.damage;
    if (stats.rangeBracket !== undefined) copy.range = stats.rangeBracket;
    if (stats.weight !== undefined) copy.weight = stats.weight;
    if (stats.cbills !== undefined) copy.cbills = stats.cbills;
    if (stats.battleValue !== undefined) copy.battleValue = stats.battleValue;
    if (copy.ammo && stats.tonsPerShot !== undefined) copy.ammo.tonsPerShot = stats.tonsPerShot;
    if (copy.ammo && stats.ammoCbills !== undefined) copy.ammo.cbills = stats.ammoCbills;
    if (copy.ammo && stats.ammoBattleValue !== undefined) copy.ammo.battleValue = stats.ammoBattleValue;
    return copy;
};

const editionName = (tag: string): string => btRulesExpansions.find((expansion) => expansion.tag === tag)?.name ?? getRulesEdition(tag).name;
const thousands = (value: number): string => value.toLocaleString("en-US");

/**
 * One line for each earlier edition or expansion that prints the weapon, saying where it differs from the record
 * (Total Warfare), for the creator: "AeroTech 2 (AT2 p.101): Battle Value 1,081".
 */
export const getCapitalWeaponEditionNotes = (weapon: ICapitalWeapon): string[] => {
    const table = weapon.editionStats ?? {};
    const tags = getEditionTimeline().map((entry) => entry.tag).filter((tag) => tag in table);
    return tags.map((tag, index) => {
        const stats = table[tag];
        if (!stats) return `${editionName(tag)}: as ${editionName(tags[index - 1])}`;
        const older = getCapitalWeaponForEdition(weapon, tag);
        const changes = [
            older.heat !== weapon.heat ? `heat ${older.heat}` : "",
            older.damage !== weapon.damage ? `damage ${older.damage}` : "",
            older.range !== weapon.range ? `range ${older.range}` : "",
            older.weight !== weapon.weight ? `${thousands(older.weight)} tons` : "",
            older.cbills !== weapon.cbills ? `${thousands(older.cbills)} C-bills` : "",
            stats.battleValue !== undefined && older.battleValue !== weapon.battleValue ? `Battle Value ${thousands(older.battleValue)}` : "",
            older.ammo?.tonsPerShot !== weapon.ammo?.tonsPerShot ? `${older.ammo?.tonsPerShot} tons a shot` : "",
            older.ammo?.cbills !== weapon.ammo?.cbills ? `ammunition ${thousands(older.ammo?.cbills ?? 0)} C-bills` : "",
            stats.ammoBattleValue !== undefined && older.ammo?.battleValue !== weapon.ammo?.battleValue ? `ammunition Battle Value ${thousands(older.ammo?.battleValue ?? 0)}` : "",
            stats.battleValue === undefined
                ? `no Battle Value${stats.maintenancePointValue !== undefined ? ` (Maintenance Point Value ${thousands(stats.maintenancePointValue)})` : ""}` : "",
        ].filter(Boolean);
        const same = changes.length === 0 || (stats.battleValue === undefined && changes.length === 1);
        return `${editionName(tag)} (${stats.book} p.${stats.page}): ${same ? ["as Total Warfare", ...changes].join("; ") : changes.join("; ")}`;
    });
};
