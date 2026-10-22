import { IAssignedQuirk, IQuirk, IQuirkLocation, IQuirkTargets, QuirkAttach, QuirkLocationRule, QuirkUnitType } from "./quirk-interfaces";
import { quirks } from "./quirks";
import { customQuirks } from "./quirks-custom";
import { IDamagePerRange } from "./data-interfaces";
import { getRecordOfferIssue, getRulesEdition } from "./rules-editions";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

let localCustomQuirks: IQuirk[] = [];

/** Replaces this browser's custom quirk drafts (custom-content-local.ts). */
export function setLocalCustomQuirks(drafts: IQuirk[]): void {
    localCustomQuirks = [...drafts];
}

/** Every quirk: the official records, then the shared custom ones, then this browser's drafts. */
export function getQuirks(): IQuirk[] {
    return [...quirks, ...customQuirks, ...localCustomQuirks];
}

const key = (value: string): string => value.trim().toLowerCase();

/** The quirk answering to `tag`, by tag first, then by name or an alternate name, ignoring case. */
export function getQuirk(tag: string): IQuirk | undefined {
    const all = getQuirks();
    const wanted = key(tag);
    return all.find((quirk) => key(quirk.tag) === wanted)
        ?? all.find((quirk) => key(quirk.name) === wanted || quirk.altNames.some((name) => key(name) === wanted));
}

/** Why a quirk is not offered for this unit type, edition and rules level, or null when it is. */
export function getQuirkOfferIssue(
    quirk: IQuirk,
    unitType: QuirkUnitType,
    editionTag: string,
    rulesLevel: number,
): "unit-type" | "edition" | "level" | null {
    if (!quirk.unitTypes.includes(unitType)) {
        return "unit-type";
    }
    // Custom quirks, like custom equipment, are offered in every edition from the custom level up.
    const level = quirk.custom ? Math.max(quirk.rulesLevel, CUSTOM_HOMEBREW_RULES_LEVEL) : quirk.rulesLevel;
    if (level >= CUSTOM_HOMEBREW_RULES_LEVEL) {
        return level > rulesLevel ? "level" : null;
    }
    return getRecordOfferIssue({ ...quirk, rulesLevel: level }, editionTag, rulesLevel);
}

/** What a location rule asks for, for the builder's notes and refusals. */
export const QUIRK_LOCATION_RULE_TEXT: Record<QuirkLocationRule, string> = {
    "arm-without-hand": "an arm with a lower arm actuator and no hand actuator",
    "arm-with-hand": "an arm with a hand actuator",
    torso: "a torso location",
};

/** Whether the quirk may go on this location; true for a quirk without a location rule. */
export function isQuirkLocationAllowed(quirk: IQuirk, location: IQuirkLocation): boolean {
    switch (quirk.locationRule) {
        case "arm-without-hand": return !!location.arm && !!location.lowerArm && !location.hand;
        case "arm-with-hand": return !!location.arm && !!location.hand;
        case "torso": return !!location.torso;
        default: return true;
    }
}

/** What an assigned quirk is attached to. */
export function getAssignedAttach(assigned: IAssignedQuirk): QuirkAttach {
    return assigned.equipmentUuid ? "weapon" : assigned.location ? "location" : "unit";
}

/**
 * The points an assigned quirk is worth: positive for a positive quirk, negative for a negative one. `maxDamage` is
 * the weapon's maximum damage for a weapon-scope `per` cost, or the maximum damage of all the unit's non-physical
 * weapons for a unit-scope one (CO p.225, p.230).
 */
export function getQuirkPoints(quirk: IQuirk, assigned: IAssignedQuirk, maxDamage: number): number {
    const sign = quirk.kind === "negative" ? -1 : 1;
    const { cost } = quirk;
    let points = 0;
    if (cost.per) {
        points = maxDamage <= 0 && cost.zeroDamagePoints !== undefined
            ? cost.zeroDamagePoints
            : Math.ceil(Math.max(maxDamage, 0) / cost.per.damage) * cost.per.points;
    } else if (cost.byAttach) {
        points = cost.byAttach[getAssignedAttach(assigned)] ?? 0;
    } else if (cost.fromParameter) {
        const value = Number(assigned.parameter);
        points = Number.isFinite(value) && value > 0 ? value : 0;
    } else if (cost.choices) {
        const options = quirk.parameter?.options;
        if (options && typeof assigned.parameter === "string") {
            points = cost.choices[options.indexOf(assigned.parameter)] ?? 0;
        } else {
            const value = Number(assigned.parameter);
            points = cost.choices.includes(value) ? value : cost.choices[0];
        }
    } else {
        points = cost.points ?? 0;
    }
    return points === 0 ? 0 : sign * points;
}

/** The quirks the builder offers this unit type in this edition at this rules level: positive first, then by name. */
export function getOfferedQuirks(unitType: QuirkUnitType, editionTag: string, rulesLevel: number): IQuirk[] {
    return getQuirks()
        .filter((quirk) => getQuirkOfferIssue(quirk, unitType, editionTag, rulesLevel) === null)
        .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "positive" ? -1 : 1));
}

/**
 * One line for each assigned quirk the unit could not be given now, worded like the equipment lines. `only`
 * limits the lines to one kind of issue, for lists that report rules levels elsewhere.
 */
export function getQuirkIssues(
    assigned: IAssignedQuirk[],
    unitType: QuirkUnitType,
    editionTag: string,
    rulesLevel: number,
    only?: "edition",
): string[] {
    const issues: string[] = [];
    for (const quirk of assigned) {
        const record = getQuirk(quirk.tag);
        let line: string | null = null;
        if (!record) {
            line = only ? null : `Quirk: ${quirk.tag} (not in this browser's quirk list)`;
        } else {
            const issue = getQuirkOfferIssue(record, unitType, editionTag, rulesLevel);
            if (issue === "edition") {
                line = `Quirk: ${record.name} (not in ${getRulesEdition(editionTag).name})`;
            } else if (issue === "level" && !only) {
                line = `Quirk: ${record.name} (above the selected rules level)`;
            } else if (issue === "unit-type" && !only) {
                line = `Quirk: ${record.name} (not for this unit type)`;
            }
        }
        if (line && !issues.includes(line)) {
            issues.push(line);
        }
    }
    return issues;
}

/**
 * A weapon's maximum damage for pricing quirks by damage: the highest of its range brackets or its damage, or all its
 * clusters hitting. Launchers whose records give damage per missile and no cluster count price as weapons that deal
 * no damage for now.
 */
export function getWeaponMaxDamage(item: { damage?: number | IDamagePerRange | string; damageClusters?: number; damagePerCluster?: number }): number {
    const { damage } = item;
    let most = 0;
    if (typeof damage === "number") {
        most = damage;
    } else if (typeof damage === "string") {
        const value = parseFloat(damage);
        most = Number.isFinite(value) ? value : 0;
    } else if (damage) {
        most = Math.max(damage.short, damage.medium, damage.long);
    }
    if (item.damageClusters && item.damagePerCluster) {
        most = Math.max(most, item.damageClusters * item.damagePerCluster);
    }
    return Math.max(most, 0);
}

/** What a builder can attach quirks to, and the damage figures quirk costs are priced from. */
export function getQuirkTargets(
    locations: IQuirkLocation[],
    items: { uuid?: string; label: string; category?: string; damage?: number | IDamagePerRange | string; damageClusters?: number; damagePerCluster?: number }[],
): IQuirkTargets {
    const weapons = items.filter((item) => item.uuid).map((item) => ({ uuid: item.uuid as string, label: item.label, maxDamage: getWeaponMaxDamage(item), physical: item.category === "Melee" }));
    return {
        locations,
        weapons: weapons.map(({ uuid, label, maxDamage }) => ({ uuid, label, maxDamage })),
        // Unit-wide costs count every weapon but physical ones (CO p.225, p.230).
        unitMaxDamage: weapons.filter((weapon) => !weapon.physical).reduce((sum, weapon) => sum + weapon.maxDamage, 0),
    };
}
