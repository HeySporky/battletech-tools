import { IEquipmentItem } from "./data-interfaces";

// Laser Insulators (TO:AUE p.134): each is mated to a laser in its own location and takes 1 point off that laser's
// heat, to a minimum of 1; a second insulator on the same laser does nothing more. BV counts the lower heat (p.194).

export const LASER_INSULATOR_TAGS: readonly string[] = ["laser-insulator", "clan-laser-insulator"];

export function isLaserInsulator(item: IEquipmentItem): boolean {
    return LASER_INSULATOR_TAGS.includes(item.tag);
}

/** A standard-scale laser an insulator can be mated to; not a capital or sub-capital laser, nor a laser AMS. */
export function isInsulatableLaser(item: IEquipmentItem): boolean {
    return !item.isAmmo && item.category === "Energy Weapons" && /laser/i.test(item.name)
        && !/anti-missile|\bams\b|capital|naval/i.test(`${item.name} ${item.tag}`);
}

/** The heat an installed item makes: an insulated laser makes 1 less, to a minimum of 1. */
export function getMountedHeat(item: IEquipmentItem, heat: number = +(item.heat || 0)): number {
    return item.insulated && heat > 1 ? heat - 1 : heat;
}

/**
 * Mates each insulator with one laser in its own location, the hottest first, and marks those lasers `insulated`.
 * Returns the insulators left without a laser.
 */
export function mateLaserInsulators(items: readonly (IEquipmentItem | null | undefined)[]): IEquipmentItem[] {
    const installed = items.filter((item): item is IEquipmentItem => !!item);
    for (const item of installed) delete item.insulated;
    const unmated: IEquipmentItem[] = [];
    for (const insulator of installed.filter(isLaserInsulator)) {
        const laser = installed
            .filter((item) => isInsulatableLaser(item) && !item.insulated && item.location === insulator.location)
            .sort((a, b) => +(b.heat || 0) - +(a.heat || 0))[0];
        if (laser) laser.insulated = true;
        else unmated.push(insulator);
    }
    return unmated;
}
