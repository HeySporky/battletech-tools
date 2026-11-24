import { QuirkList } from "../classes/quirk-list";
import { IAssignedQuirk, IQuirk, IQuirkTargets, QuirkEffect, QuirkRangeBand } from "../data/quirk-interfaces";
import { getQuirk } from "../data/quirk-registry";

/** One effect of one active quirk, labelled for play; `effect` is null for a quirk with none ("not yet applied in play"). */
export interface IAppliedQuirkEffect {
    effect: QuirkEffect | null;
    quirkName: string;
    /** The name with its range band, "Improved Targeting (Long)". */
    title: string;
    /** "Accurate Weapon (-1)", "Improved Targeting (Long) (-1)"; just the name for an effect without a modifier. */
    label: string;
    /** The weapon or bay the quirk is on, if any. */
    equipmentUuids?: string[];
    /** The location the quirk is on, if any. */
    location?: string;
    /** What the quirk is on, by name, for the play panel: "Medium Laser (RT)", "Left Arm". */
    on?: string;
    /** The assignment's parameter: a range band, a value. */
    parameter?: string | number;
}

/** What an attack is, for the to-hit effects that apply to it. */
export interface IQuirkAttackContext {
    weaponUuid?: string;
    /** Where the attack comes from: the punching arm. */
    location?: string;
    rangeBand?: QuirkRangeBand;
    vsAirborne?: boolean;
    /** "weapon" when absent. */
    attack?: "weapon" | "punch" | "arm-physical" | "physical";
    attackerRanOrFlanked?: boolean;
}

/** A unit that carries quirks in play: 'Mech, vehicle, fighter, battle armor, Small Craft, capital ship. */
export interface IQuirkCarrier {
    quirks: QuirkList;
    getEra(): { yearStart: number; yearEnd?: number | null };
    /** The game's year, from the force's "Game year"; null or absent when the roster sets none. */
    quirkPlayYear?: number | null;
    getQuirkTargets(): IQuirkTargets;
    isDestroyed(): boolean;
}

/** The weapons and bays the unit has fitted now, for `QuirkList.getActive`. */
export function getCarrierInstalledUuids(unit: IQuirkCarrier): string[] {
    const targets = unit.getQuirkTargets();
    return [...targets.weapons.map((weapon) => weapon.uuid), ...(targets.bays ?? []).flatMap((bay) => bay.uuids)];
}

/** A force's "Game year" as entered: a whole year above 0, else none (a cleared box reads as 0). */
export function normalizeGameYear(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) && value >= 1 ? Math.floor(value) : null;
}

/** The year play checks a quirk's years against: the game's year, or without one the start of the unit's era. */
export function getCarrierPlayYear(unit: IQuirkCarrier): number {
    return unit.quirkPlayYear ?? unit.getEra().yearStart;
}

/** The effects of a unit's quirks in play, with an assignment's years checked against `getCarrierPlayYear`. */
export function getCarrierQuirkEffects(unit: IQuirkCarrier): IAppliedQuirkEffect[] {
    const targets = unit.getQuirkTargets();
    const bayKey = (uuids: string[]): string => [...uuids].sort().join(",");
    const nameOf = (applied: IAppliedQuirkEffect): string | undefined => {
        if (applied.location) {
            return targets.locations.find((location) => location.tag === applied.location)?.label ?? applied.location.toUpperCase();
        }
        const uuids = applied.equipmentUuids;
        if (!uuids) {
            return undefined;
        }
        return targets.bays?.find((bay) => bayKey(bay.uuids) === bayKey(uuids))?.label
            ?? (uuids.length === 1 ? targets.weapons.find((weapon) => weapon.uuid === uuids[0])?.label : undefined);
    };
    return getQuirkEffects(unit.quirks, getCarrierInstalledUuids(unit), getCarrierPlayYear(unit)).map((applied) => {
        const on = nameOf(applied);
        return on ? { ...applied, on } : applied;
    });
}

/** A quirk as an Alpha Strike unit made from a design carries it: one the Companion lists, with its parameter. */
export interface IAlphaStrikeQuirk {
    tag: string;
    parameter?: string | number;
    /** The assignment's years, so play can check them against the game's year. */
    fromYear?: number;
    toYear?: number;
}

export type AlphaStrikeRangeBand = QuirkRangeBand | "extreme";

/**
 * The design's quirks that the Alpha Strike Companion lists (only those act in Alpha Strike, ASC p.59) and that are in
 * force at some time in the unit's era, each with its years for `getAlphaStrikeQuirksInYear`.
 */
export function getAlphaStrikeQuirks(unit: IQuirkCarrier): IAlphaStrikeQuirk[] {
    const era = unit.getEra();
    const eraEnd = era.yearEnd ?? Number.POSITIVE_INFINITY;
    return unit.quirks.getActive(getCarrierInstalledUuids(unit), undefined)
        .filter((assigned) => getQuirk(assigned.tag)?.alphaStrike)
        .filter((assigned) => (assigned.fromYear === undefined || assigned.fromYear <= eraEnd) && (assigned.toYear === undefined || assigned.toYear >= era.yearStart))
        .map((assigned) => ({
            tag: assigned.tag,
            ...(assigned.parameter !== undefined ? { parameter: assigned.parameter } : {}),
            ...(assigned.fromYear !== undefined ? { fromYear: assigned.fromYear } : {}),
            ...(assigned.toYear !== undefined ? { toYear: assigned.toYear } : {}),
        }));
}

/** The card's quirks in force in a year; all of them with no year. */
export function getAlphaStrikeQuirksInYear(quirks: IAlphaStrikeQuirk[], year: number | undefined): IAlphaStrikeQuirk[] {
    return year === undefined ? quirks
        : quirks.filter((quirk) => (quirk.fromYear === undefined || year >= quirk.fromYear) && (quirk.toYear === undefined || year <= quirk.toYear));
}

/** The Companion to-hit modifier of the unit's weapon attacks in one range band. */
export function getAlphaStrikeQuirkToHit(quirks: IAlphaStrikeQuirk[], band: AlphaStrikeRangeBand): number {
    let modifier = 0;
    for (const quirk of quirks) {
        for (const effect of getQuirk(quirk.tag)?.alphaStrike?.effects ?? []) {
            if (effect.type !== "to-hit" || (effect.attack ?? "weapon") !== "weapon" || effect.vsAirborne || effect.attackerRanOrFlanked) {
                continue;
            }
            const effectBand = effect.rangeBand === "parameter" ? (typeof quirk.parameter === "string" ? quirk.parameter.toLowerCase() : undefined) : effect.rangeBand;
            if (effect.rangeBand && effectBand !== band) {
                continue;
            }
            modifier += effect.modifier;
        }
    }
    return modifier;
}

const signed = (value: number): string => (value > 0 ? `+${value}` : `${value}`);

const capitalised = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const quirkTitle = (record: IQuirk, assigned: IAssignedQuirk): string =>
    record.parameter?.kind === "range-band" && typeof assigned.parameter === "string"
        ? `${record.name} (${capitalised(assigned.parameter)})` : record.name;

const effectModifier = (effect: QuirkEffect): number | undefined => "modifier" in effect ? effect.modifier : undefined;

const weaponsOf = (assigned: IAssignedQuirk): string[] | undefined =>
    assigned.bayUuids ?? (assigned.equipmentUuid ? [assigned.equipmentUuid] : undefined);

/** The effects of the quirks in force (see `QuirkList.getActive`), one entry per effect, in assignment order. */
export function getQuirkEffects(list: QuirkList, installedUuids: string[], year: number | undefined): IAppliedQuirkEffect[] {
    const applied: IAppliedQuirkEffect[] = [];
    for (const assigned of list.getActive(installedUuids, year)) {
        const record = getQuirk(assigned.tag);
        if (!record) {
            continue;
        }
        const title = quirkTitle(record, assigned);
        const equipmentUuids = weaponsOf(assigned);
        const effects: (QuirkEffect | null)[] = record.effects?.length ? record.effects : [null];
        for (const effect of effects) {
            const modifier = effect ? effectModifier(effect) : undefined;
            applied.push({
                effect,
                quirkName: record.name,
                title,
                label: modifier === undefined ? title : `${title} (${signed(modifier)})`,
                ...(equipmentUuids ? { equipmentUuids } : {}),
                ...(assigned.location ? { location: assigned.location } : {}),
                ...(assigned.parameter !== undefined ? { parameter: assigned.parameter } : {}),
            });
        }
    }
    return applied;
}

/** The quirk to-hit modifier of one attack by the unit, with the label of each effect that counted. */
export function getQuirkToHit(list: QuirkList, installedUuids: string[], year: number | undefined, context: IQuirkAttackContext): { modifier: number; labels: string[] } {
    const attack = context.attack ?? "weapon";
    let modifier = 0;
    const labels: string[] = [];
    for (const applied of getQuirkEffects(list, installedUuids, year)) {
        const effect = applied.effect;
        if (effect?.type !== "to-hit" || (effect.attack ?? "weapon") !== attack) {
            continue;
        }
        if (effect.scope === "weapon" && !(context.weaponUuid && applied.equipmentUuids?.includes(context.weaponUuid))) {
            continue;
        }
        if (effect.scope === "location" && !(context.location && applied.location === context.location)) {
            continue;
        }
        if (effect.vsAirborne && !context.vsAirborne) {
            continue;
        }
        if (effect.attackerRanOrFlanked && !context.attackerRanOrFlanked) {
            continue;
        }
        if (effect.rangeBand) {
            const band = effect.rangeBand === "parameter" ? (typeof applied.parameter === "string" ? applied.parameter.toLowerCase() : undefined) : effect.rangeBand;
            if (!context.rangeBand || band !== context.rangeBand) {
                continue;
            }
        }
        modifier += effect.modifier;
        labels.push(applied.label);
    }
    return { modifier, labels };
}

/** The change to the heat the unit builds up each turn (Combat Computer -4); the caller floors generated heat at 0. */
export function getQuirkHeatGenerated(list: QuirkList, installedUuids: string[], year: number | undefined): number {
    return getQuirkEffects(list, installedUuids, year)
        .reduce((sum, applied) => sum + (applied.effect?.type === "heat-generated" ? applied.effect.modifier : 0), 0);
}

/** A weapon's heat when fired, after its cooling jacket quirks, never below a quirk's minimum. */
export function getQuirkWeaponHeat(list: QuirkList, installedUuids: string[], year: number | undefined, weaponUuid: string, heat: number): number {
    let result = heat;
    let minimum = Number.NEGATIVE_INFINITY;
    for (const applied of getQuirkEffects(list, installedUuids, year)) {
        if (applied.effect?.type === "weapon-heat" && applied.equipmentUuids?.includes(weaponUuid)) {
            result += applied.effect.modifier;
            minimum = Math.max(minimum, applied.effect.minimum ?? Number.NEGATIVE_INFINITY);
        }
    }
    return Math.max(minimum, result);
}

export interface IQuirkInitiative { modifier: number; label: string; title: string }

/** The unit's largest Initiative effect, or null; a side takes the largest of its units', never the sum (CO p.225). */
export function getQuirkInitiative(list: QuirkList, installedUuids: string[], year: number | undefined): IQuirkInitiative | null {
    let best: IQuirkInitiative | null = null;
    for (const applied of getQuirkEffects(list, installedUuids, year)) {
        if (applied.effect?.type === "initiative" && (!best || applied.effect.modifier > best.modifier)) {
            best = { modifier: applied.effect.modifier, label: applied.label, title: applied.title };
        }
    }
    return best;
}
