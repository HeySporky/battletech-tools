import { capitalWeapons } from "./capital-weapons";
import { subCapitalWeapons } from "./sub-capital-weapons";
import { ICapitalWeapon } from "./data-interfaces";

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
