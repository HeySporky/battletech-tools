import { ICanonQuirkEntry, ICanonResolution } from "./quirk-canon-interfaces";
import { IAssignedQuirk, IQuirkTargets } from "./quirk-interfaces";
import { getQuirk } from "./quirk-registry";
import { canonMechQuirks } from "./quirks-canon-mechs";

/** A chassis name to match on: case, apostrophes and spacing ignored. */
const chassisKey = (value: string): string => value.toLowerCase().replace(/['’]/g, "").replace(/\s+/g, " ").trim();

/** A weapon name to match on: case, spacing and hyphens ignored. */
const weaponKey = (value: string): string => value.toLowerCase().replace(/[\s-]+/g, "");

/** The same name, or one the other's plural ("Medium Lasers" is a Medium Laser). */
const isWeaponPlural = (a: string, b: string): boolean => a === `${b}s` || b === `${a}s`;

/** The canon entry for a chassis, by its name or another name it goes by. */
export const findCanonEntry = (chassis: string, entries: ICanonQuirkEntry[] = canonMechQuirks): ICanonQuirkEntry | undefined => {
    const wanted = chassisKey(chassis);
    return wanted ? entries.find((entry) => [entry.chassis, ...(entry.altChassis ?? [])].some((name) => chassisKey(name) === wanted)) : undefined;
};

/**
 * Places a canon entry's quirks on one unit. A quirk it cannot place (no such weapon, the other tech base, a
 * qualifier it cannot read, a tag the catalog lacks) is left off with a note; it never goes on a different weapon.
 */
export const resolveCanonQuirks = (entry: ICanonQuirkEntry, unit: {
    targets: IQuirkTargets;
    /** Each weapon target's equipment name and location tag, by uuid. */
    weaponInfo: (uuid: string) => { name: string; location?: string } | undefined;
    clan: boolean;
    /** The quirks already on the unit: a one-weapon quirk the player has moved to another such weapon stays there. */
    assigned?: IAssignedQuirk[];
}): ICanonResolution => {
    const quirks: IAssignedQuirk[] = [];
    const notes: string[] = [];
    for (const canon of entry.quirks) {
        const record = getQuirk(canon.tag);
        if (!record) {
            notes.push(`${canon.tag}: not in the quirk catalog`);
            continue;
        }
        if (canon.note) {
            notes.push(`${record.name} (${canon.note}): not applied, check by hand`);
            continue;
        }
        if (canon.techBase && (canon.techBase === "clan") !== unit.clan) {
            notes.push(`${record.name}: ${canon.techBase === "clan" ? "Clan" : "Inner Sphere"} only, not applied`);
            continue;
        }
        const base: IAssignedQuirk = { tag: record.tag };
        if (canon.parameter !== undefined) base.parameter = canon.parameter;
        if (canon.fromYear !== undefined) base.fromYear = canon.fromYear;
        if (canon.toYear !== undefined) base.toYear = canon.toYear;
        if (canon.weapon) {
            const wanted = weaponKey(canon.weapon.name);
            // An exact name first; a plural only when no weapon has the exact name, so "X" and "Xs" stay apart.
            const located = unit.targets.weapons.filter((weapon) => {
                const info = unit.weaponInfo(weapon.uuid);
                return info && (!canon.weapon!.location || info.location === canon.weapon!.location);
            });
            const nameOf = (uuid: string): string => weaponKey(unit.weaponInfo(uuid)!.name);
            const exact = located.filter((weapon) => nameOf(weapon.uuid) === wanted);
            const matches = exact.length ? exact : located.filter((weapon) => isWeaponPlural(nameOf(weapon.uuid), wanted));
            if (!matches.length) {
                const where = canon.weapon.location ? ` in the ${canon.weapon.location.toUpperCase()}` : "";
                notes.push(`${record.name}: no ${canon.weapon.name}${where} on this 'Mech, not applied`);
                continue;
            }
            if (!canon.weapon.all && matches.some((weapon) => unit.assigned?.some((quirk) => quirk.tag === record.tag && quirk.equipmentUuid === weapon.uuid))) continue;
            const chosen = canon.weapon.all ? matches : matches.slice(0, 1);
            if (!canon.weapon.all && matches.length > 1) notes.push(`${record.name}: put on the first of ${matches.length} ${canon.weapon.name}`);
            quirks.push(...chosen.map((weapon) => ({ ...base, equipmentUuid: weapon.uuid })));
        } else if (canon.locations) {
            quirks.push(...canon.locations.map((location) => ({ ...base, location })));
        } else {
            quirks.push(base);
        }
    }
    return { quirks, notes };
};
