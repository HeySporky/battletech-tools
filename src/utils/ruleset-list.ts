import { RulesEditionUnitType } from "../data/rules-editions";
import { getRulesetBlock, ISpecialRuleset, RULESET_CATEGORIES, RulesetCategory } from "../data/special-rulesets";

// The Special Rulesets window's search, filters and category groups (#324). Pure, so the window only renders.

export interface IRulesetListFilter {
    query: string;
    /** A source publication; "" for all. */
    publication: string;
    hideUnavailable: boolean;
    tickedOnly: boolean;
}

export const EMPTY_RULESET_FILTER: IRulesetListFilter = { query: "", publication: "", hideUnavailable: false, tickedOnly: false };

export function isRulesetFilterActive(filter: IRulesetListFilter): boolean {
    return filter.query.trim() !== "" || filter.publication !== "" || filter.hideUnavailable || filter.tickedOnly;
}

/** Lower case, with curly and modifier apostrophes made straight, so "’Mech" finds "'Mech". */
function normalize(text: string): string {
    return text.toLowerCase().replace(/[‘’ʼ]/g, "'");
}

function haystack(ruleset: ISpecialRuleset): string {
    const { title, tag, publication, author } = ruleset.source;
    return normalize([ruleset.name, ruleset.summary, ruleset.description, title, tag, publication, author ?? ""].join(" "));
}

/** The rulesets the window shows: every word of the query found, the publication matched, and the two toggles applied. */
export function filterRulesets(
    rulesets: readonly ISpecialRuleset[],
    filter: IRulesetListFilter,
    tickedIds: readonly string[],
    unitType?: RulesEditionUnitType,
): ISpecialRuleset[] {
    const terms = normalize(filter.query).split(/\s+/).filter((term) => term !== "");
    return rulesets.filter((ruleset) => {
        const ticked = tickedIds.includes(ruleset.id);
        if (filter.tickedOnly && !ticked) return false;
        if (filter.publication && ruleset.source.publication !== filter.publication) return false;
        // A ticked ruleset is never hidden as unavailable, even when it carries a warning.
        if (filter.hideUnavailable && !ticked && getRulesetBlock(tickedIds, ruleset.id, unitType)) return false;
        if (terms.length > 0) {
            const text = haystack(ruleset);
            if (!terms.every((term) => text.includes(term))) return false;
        }
        return true;
    });
}

export interface IRulesetGroup {
    category: RulesetCategory;
    label: string;
    rulesets: ISpecialRuleset[];
    /** Counted over every ruleset of the category, shown or not. */
    ticked: number;
    total: number;
}

/** The shown rulesets by category, in the window's order; a category with nothing shown is left out. */
export function groupRulesets(all: readonly ISpecialRuleset[], shown: readonly ISpecialRuleset[], tickedIds: readonly string[]): IRulesetGroup[] {
    return RULESET_CATEGORIES.map(({ id, label }) => {
        const inCategory = all.filter((ruleset) => ruleset.category === id);
        return {
            category: id,
            label,
            rulesets: shown.filter((ruleset) => ruleset.category === id),
            ticked: inCategory.filter((ruleset) => tickedIds.includes(ruleset.id)).length,
            total: inCategory.length,
        };
    }).filter((group) => group.rulesets.length > 0);
}

/** The distinct source publications, sorted, for the window's Source filter. */
export function getRulesetPublications(rulesets: readonly ISpecialRuleset[]): string[] {
    return [...new Set(rulesets.map((ruleset) => ruleset.source.publication))].sort((a, b) => a.localeCompare(b));
}
