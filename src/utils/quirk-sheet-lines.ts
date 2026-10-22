import { IAssignedQuirk } from "../data/quirk-interfaces";
import { getQuirk } from "../data/quirk-registry";

const years = (quirk: IAssignedQuirk): string | null => {
    if (quirk.fromYear !== undefined && quirk.toYear !== undefined) return `${quirk.fromYear}-${quirk.toYear}`;
    if (quirk.fromYear !== undefined) return `from ${quirk.fromYear}`;
    if (quirk.toYear !== undefined) return `to ${quirk.toYear}`;
    return null;
};

const parameter = (value: string | number): string =>
    typeof value === "string" ? value.charAt(0).toUpperCase() + value.slice(1) : String(value);

/** One quirk as the sheet prints it: its name, then its parameter, location and years in brackets. */
const describe = (quirk: IAssignedQuirk, locationLabel: ((tag: string) => string | undefined) | null): string => {
    const details = [
        quirk.parameter !== undefined ? parameter(quirk.parameter) : null,
        locationLabel && quirk.location ? locationLabel(quirk.location) ?? quirk.location.toUpperCase() : null,
        years(quirk),
    ].filter((detail): detail is string => detail !== null);
    const name = getQuirk(quirk.tag)?.name ?? quirk.tag;
    return details.length ? `${name} (${details.join(", ")})` : name;
};

/**
 * The record sheet's quirk lines, from a unit's active quirks: unit and location quirks as lines, and each weapon's
 * quirks together under that weapon. A weapon quirk whose weapon `weaponLabel` does not know prints nothing. Locations
 * print by `locationLabel`'s name, else as the tag in capitals ("LA").
 */
export function getQuirkSheetLines(
    active: IAssignedQuirk[],
    weaponLabel: (uuid: string) => string | undefined,
    locationLabel: (tag: string) => string | undefined = () => undefined,
): { unit: string[]; weapons: { uuid: string; text: string }[] } {
    const unit: string[] = [];
    const byWeapon = new Map<string, string[]>();
    for (const quirk of active) {
        if (!quirk.equipmentUuid) {
            unit.push(describe(quirk, locationLabel));
        } else if (weaponLabel(quirk.equipmentUuid) !== undefined) {
            byWeapon.set(quirk.equipmentUuid, [...(byWeapon.get(quirk.equipmentUuid) ?? []), describe(quirk, null)]);
        }
    }
    return { unit, weapons: [...byWeapon].map(([uuid, names]) => ({ uuid, text: names.join(", ") })) };
}
