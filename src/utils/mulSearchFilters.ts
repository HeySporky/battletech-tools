import type { IASMULUnit } from "../classes/alpha-strike-unit";
import { IEras } from "../data/data-interfaces";
import { btEraOptions } from "../data/era-options";
import { DEFAULT_MUL_SOURCE_SELECTION, MULSourceSelection } from "../data/mul-list-items";
import { RulesEditionUnitType } from "../data/rules-editions";
import { findSpecialRuleset, getRulesetConflict, ISpecialRuleset } from "../data/special-rulesets";
import { btTechOptions } from "../data/tech-options";
import { getMULAerospaceClass, MULAerospaceClass } from "./mulAerospaceClass";
import { getMULRecordStanding, UNIT_STANDING_ORDER, UnitStanding } from "./unit-standing";
import { getMULEraAliases, getMULEraLabel, MUL_ERA_ALIAS_OFFSET, mulEras } from "./mulUtilities";

/** The filters of a Master Unit List search, shared by the Alpha Strike and Classic rosters. */
export interface IMULSearchFilters {
    term: string;
    rules: string;
    tech: string;
    role: string;
    era: number;
    type: number;
    factions: number[];
    factionSearchTerm: string;
    // Ability codes the unit must have; a "!" prefix means it must not have it.
    abilities: string[];
    abilitySearchTerm: string;
    sources: MULSourceSelection;
    /** Special Rulesets (#324): they trim the Tech, Type and Era lists and leave their units out of the results. */
    rulesets: string[];
    /** The standings shown (canon, apocryphal, fan-made, munchkin): Canon alone for an event that takes only official units. */
    standings: UnitStanding[];
}

export function newMULSearchFilters(overrides: Partial<IMULSearchFilters> = {}): IMULSearchFilters {
    return {
        term: "",
        rules: "",
        tech: "",
        role: "",
        era: 0,
        type: 0,
        factions: [],
        factionSearchTerm: "",
        abilities: [],
        abilitySearchTerm: "",
        sources: DEFAULT_MUL_SOURCE_SELECTION,
        rulesets: [],
        standings: UNIT_STANDING_ORDER,
        ...overrides,
    };
}

// Special Rulesets in the MUL searches (#324 round 4). The searches keep the MUL's own Tech, Type and Era values, with
// "All"; a ticked ruleset takes away the values it removes, and the units, and a change moves a later filter whose
// value is no longer offered (Tech, then Type, then Era), never an earlier one.

/** MUL Tech filter values and the btTechOptions tags each stands for. */
export const MUL_TECH_BASES: Record<string, string[]> = { "inner sphere": ["is"], clan: ["clan"], mixed: ["mis", "mclan"] };
// MUL Technology ids: Primitive is Inner Sphere technology (4 in the MUL's own records, 57 on custom units, as the live
// site's Technologies filter takes it). Unknown (5, 75) is never left out.
const MUL_TECHNOLOGY_TAGS: Record<number, string[]> = { 1: ["is"], 2: ["clan"], 3: ["mis", "mclan"], 4: ["is"], 57: ["is"] };
// MUL type ids, and the Classic roster's aerospace kinds filed under type 17, as the unit types a ruleset removes.
const MUL_TYPE_UNIT_TYPES: Record<number, RulesEditionUnitType> = {
    18: "mech", 20: "mech", 19: "vehicle", 24: "vehicle", 21: "infantry", 22: "battle-armor", 23: "protomech",
    17: "fighter", 1701: "fighter", 1702: "fighter", 1703: "small-craft", 1704: "small-craft",
    1705: "capital-ship", 1706: "capital-ship", 1707: "capital-ship",
};

// The MUL files every aerospace unit under type 17: its class says which unit type it is.
const AEROSPACE_UNIT_TYPES: Record<MULAerospaceClass, RulesEditionUnitType> = {
    AF: "fighter", CF: "fighter", SC: "small-craft", DS: "small-craft", JS: "capital-ship", WS: "capital-ship", SS: "capital-ship",
};

const ticked = (rulesets: string[]): ISpecialRuleset[] => rulesets.flatMap((id) => findSpecialRuleset(id) ?? []);
const removedTech = (rulesets: string[]): string[] => ticked(rulesets).flatMap((ruleset) => ruleset.removesTechBases ?? []);

export function isMULTechOffered(tech: string, rulesets: string[]): boolean {
    const tags = MUL_TECH_BASES[(tech ?? "").toLowerCase()];
    return !tech || !tags || tags.some((tag) => !removedTech(rulesets).includes(tag));
}

export function isMULTypeOffered(typeId: number, rulesets: string[]): boolean {
    const unitType = MUL_TYPE_UNIT_TYPES[typeId];
    return !typeId || !unitType || !ticked(rulesets).some((ruleset) => ruleset.removesUnitTypes?.includes(unitType));
}

// The eras an Era filter value stands for: a Clan era alias its own era, a MUL era every era its years overlap.
function erasForMULEra(eraId: number): IEras[] {
    if (eraId >= MUL_ERA_ALIAS_OFFSET) {
        return btEraOptions.filter((era) => era.id === eraId - MUL_ERA_ALIAS_OFFSET);
    }
    const mulEra = mulEras.find((era) => era.id === eraId);
    return mulEra ? btEraOptions.filter((era) => era.yearStart <= (mulEra.yearEnd ?? Infinity) && (era.yearEnd ?? Infinity) >= mulEra.yearStart) : [];
}

const eraStart = (eraId: number): number => eraId >= MUL_ERA_ALIAS_OFFSET
    ? erasForMULEra(eraId)[0]?.yearStart ?? 0 : mulEras.find((era) => era.id === eraId)?.yearStart ?? 0;

/** An era is offered when one of the eras it stands for is not removed and builds with the Tech filter's tech. */
export function isMULEraOffered(eraId: number, tech: string, rulesets: string[]): boolean {
    if (!eraId) return true;
    const removed = removedTech(rulesets);
    const removedEras = ticked(rulesets).flatMap((ruleset) => ruleset.removesEras ?? []);
    const tags = (MUL_TECH_BASES[(tech ?? "").toLowerCase()] ?? btTechOptions.map((option) => option.tag)).filter((tag) => !removed.includes(tag));
    const eras = erasForMULEra(eraId);
    return eras.length === 0 || eras.some((era) => !removedEras.includes(era.tag) && era.techBases.some((tag) => tags.includes(tag)));
}

/**
 * Applies a change to the search filters, then moves Tech (to All), Type (to All) and Era (to the offered era nearest
 * by start year, ties going earlier) when their lists no longer offer them, leaving alone a filter the change itself
 * set. Returns a line per move, and names the ruleset a newly ticked one clashes with (which is dropped).
 */
export function changeMULSearchFilters(filters: IMULSearchFilters, changes: Partial<IMULSearchFilters>): { filters: IMULSearchFilters; moves: string[] } {
    const next: IMULSearchFilters = { ...filters, ...changes };
    const moves: string[] = [];
    if (changes.rulesets) {
        const kept: string[] = [];
        for (const id of changes.rulesets) {
            if (!findSpecialRuleset(id) || kept.includes(id)) continue;
            const clash = getRulesetConflict(kept, id);
            if (clash) moves.push("Clashes with " + clash.name);
            else kept.push(id);
        }
        // A ruleset whose requirement is not kept goes too, until nothing changes (dropping one may strand another).
        let dropped = true;
        while (dropped) {
            dropped = false;
            for (const id of [...kept]) {
                const missing = findSpecialRuleset(id)?.requires?.find((required) => !kept.includes(required));
                if (missing) {
                    kept.splice(kept.indexOf(id), 1);
                    moves.push("Needs " + (findSpecialRuleset(missing)?.name ?? missing));
                    dropped = true;
                }
            }
        }
        next.rulesets = kept;
    }
    if (!("tech" in changes) && !isMULTechOffered(next.tech, next.rulesets)) {
        next.tech = "";
        moves.push("Tech moved to All");
    }
    if (!("type" in changes) && !isMULTypeOffered(next.type, next.rulesets)) {
        next.type = 0;
        moves.push("Type moved to All");
    }
    if (!("era" in changes) && !isMULEraOffered(next.era, next.tech, next.rulesets)) {
        const start = eraStart(next.era);
        const offered = [...mulEras.map((era) => era.id), ...getMULEraAliases().map((alias) => alias.id)]
            .filter((id) => isMULEraOffered(id, next.tech, next.rulesets))
            .sort((a, b) => Math.abs(eraStart(a) - start) - Math.abs(eraStart(b) - start) || eraStart(a) - eraStart(b));
        next.era = offered[0] ?? 0;
        moves.push("Era moved to " + (next.era ? getMULEraLabel(next.era) : "All"));
    }
    return { filters: next, moves };
}

/** Leaves out the units whose tech base or unit type a ticked ruleset removes. */
export function filterMULByRulesets(units: IASMULUnit[], rulesets: string[]): IASMULUnit[] {
    if (rulesets.length === 0) return units;
    const removed = removedTech(rulesets);
    return units.filter((unit) => {
        const tags = MUL_TECHNOLOGY_TAGS[unit.Technology?.Id];
        const aerospace = getMULAerospaceClass(unit);
        const unitType = aerospace ? AEROSPACE_UNIT_TYPES[aerospace] : MUL_TYPE_UNIT_TYPES[unit.Type?.Id];
        return (!tags || tags.some((tag) => !removed.includes(tag)))
            && !(unitType && ticked(rulesets).some((ruleset) => ruleset.removesUnitTypes?.includes(unitType)));
    });
}

/** Leaves out the records whose standing is not ticked. */
export function filterMULByStanding(units: IASMULUnit[], standings: UnitStanding[]): IASMULUnit[] {
    return standings.length >= UNIT_STANDING_ORDER.length ? units : units.filter((unit) => standings.includes(getMULRecordStanding(unit)));
}

/**
 * Levels 0 and 1 (the Quick-Start Rules, and the 2013 Introductory chapter) load BattleMechs only, and only those the Master
 * Unit List rates Introductory or lower; a unit with no Rules value is left out there. Level 2 and up, or no level, keep
 * every unit (#646).
 */
export function filterMULByAlphaStrikeLevel(units: IASMULUnit[], rulesLevel: number | undefined): IASMULUnit[] {
    if (rulesLevel === undefined || rulesLevel >= 2) return units;
    return units.filter((unit) => unit.BFType === "BM" && (unit.Rules ?? "").trim().toLowerCase() === "introductory");
}
