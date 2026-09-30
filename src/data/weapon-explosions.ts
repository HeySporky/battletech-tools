import { IEquipmentItem } from "./data-interfaces";

/*
 * Explosive weapons: a critical hit (on a vehicle, a Weapon Destroyed result, TW p. 195) makes the weapon
 * explode like ammunition for a fixed amount of damage in its location. Values from the books in hand only;
 * a weapon not listed here has no sourced explosion value and is left unresolved.
 */
export interface IWeaponExplosion {
    damage: number;
    book: string;
    page: number;
}

const WEAPON_EXPLOSIONS: Record<string, IWeaponExplosion> = {
    "standard-gauss-rifle": { damage: 20, book: "TW", page: 135 },
    "clan-gauss-rifle": { damage: 20, book: "TW", page: 135 },
    "ap-gauss-rifle": { damage: 3, book: "TW", page: 135 },
    "gauss-rifle-light": { damage: 16, book: "TW", page: 136 },
    "gauss-rifle-heavy": { damage: 25, book: "TW", page: 136 },
    "hyper-assault-gauss-20": { damage: 10, book: "TW", page: 136 },
    "hyper-assault-gauss-30": { damage: 15, book: "TW", page: 136 },
    "hyper-assault-gauss-40": { damage: 20, book: "TW", page: 136 },
    "gauss-rifle-heavy-improved": { damage: 30, book: "TO", page: 314 },
    "gauss-rifle-magshot": { damage: 3, book: "TO", page: 314 },
    "silver-bullet-gauss-rifle": { damage: 20, book: "TO", page: 315 },
};

/** The explosion a weapon makes when destroyed by a critical hit, or null when none is sourced. */
export const getWeaponExplosionDamage = (item: Pick<IEquipmentItem, "tag"> & { altTags?: string[] }): IWeaponExplosion | null => {
    for (const tag of [item.tag, ...(item.altTags ?? [])]) {
        if (tag && Object.prototype.hasOwnProperty.call(WEAPON_EXPLOSIONS, tag)) return WEAPON_EXPLOSIONS[tag];
    }
    return null;
};
