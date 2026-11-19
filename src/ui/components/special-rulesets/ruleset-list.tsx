import React, { type JSX } from 'react';
import { RulesEditionUnitType } from '../../../data/rules-editions';
import { getRulesetBlock, getSpecialRulesets, ISpecialRuleset, RulesetCategory } from '../../../data/special-rulesets';
import {
    EMPTY_RULESET_FILTER, filterRulesets, getRulesetPublications, groupRulesets, IRulesetListFilter, isRulesetFilterActive,
} from '../../../utils/ruleset-list';

/** Up to this many rulesets in all, every group starts open; past it only groups with something ticked do. */
const OPEN_ALL_UP_TO = 12;

/**
 * The Special Rulesets window's list (#324): a filter bar, then one folding group a category, then a row a ruleset with
 * its checkbox, source tag, one-line summary, More info button and, when it cannot be ticked, why.
 */
export default function RulesetList(props: {
    tickedIds: string[];
    unitType?: RulesEditionUnitType;
    filter: IRulesetListFilter;
    onFilter: (filter: IRulesetListFilter) => void;
    openGroups: Partial<Record<RulesetCategory, boolean>>;
    onGroupToggle: (category: RulesetCategory, open: boolean) => void;
    onToggle: (ids: string[]) => void;
    onMoreInfo: (id: string, button: HTMLButtonElement) => void;
}): JSX.Element {
    const all = getSpecialRulesets();
    const { filter } = props;
    const shown = filterRulesets(all, filter, props.tickedIds, props.unitType);
    const groups = groupRulesets(all, shown, props.tickedIds);
    const filtering = isRulesetFilterActive(filter);
    const set = (change: Partial<IRulesetListFilter>) => props.onFilter({ ...filter, ...change });

    const row = (ruleset: ISpecialRuleset) => {
        const ticked = props.tickedIds.includes(ruleset.id);
        const block = getRulesetBlock(props.tickedIds, ruleset.id, props.unitType);
        // A ticked ruleset with only a warning stays untickable; one another ticked ruleset needs does not.
        const disabled = ticked ? block?.kind === "neededBy" : !!block;
        return (
            <div key={ruleset.id} className="ruleset-row" data-testid={"ruleset-row-" + ruleset.id}>
                <label>
                    <input
                        type="checkbox"
                        checked={ticked}
                        disabled={disabled}
                        aria-describedby={"ruleset-about-" + ruleset.id}
                        onChange={() => props.onToggle([ruleset.id])}
                    />{" "}
                    {ruleset.name}
                </label>{" "}
                <span className="badge bg-secondary">{ruleset.source.tag}</span>{" "}
                {/* Hidden text, not aria-label, names the button: a label lookup by the ruleset's name finds only its checkbox. */}
                <button type="button" className="btn btn-link btn-sm p-0" data-ruleset-more-info={ruleset.id}
                    onClick={(event) => props.onMoreInfo(ruleset.id, event.currentTarget)}>
                    More info<span className="visually-hidden">: {ruleset.name}</span>
                </button>
                <p className="smaller-text" id={"ruleset-about-" + ruleset.id}>
                    {ruleset.summary}
                    {block ? <span className="color-red"> {block.reason}.</span> : null}
                </p>
            </div>
        );
    };

    return (
        <div className="ruleset-list">
            <div className="ruleset-filters">
                <label>
                    Search rulesets{" "}
                    <input type="search" value={filter.query} onChange={(event) => set({ query: event.currentTarget.value })} />
                </label>{" "}
                <label>
                    Source{" "}
                    <select value={filter.publication} onChange={(event) => set({ publication: event.currentTarget.value })}>
                        <option value="">All sources</option>
                        {getRulesetPublications(all).map((publication) => <option key={publication} value={publication}>{publication}</option>)}
                    </select>
                </label>{" "}
                <label>
                    <input type="checkbox" checked={filter.hideUnavailable} onChange={() => set({ hideUnavailable: !filter.hideUnavailable })} /> Hide unavailable
                </label>{" "}
                <label>
                    <input type="checkbox" checked={filter.tickedOnly} onChange={() => set({ tickedOnly: !filter.tickedOnly })} /> Show ticked only
                </label>
            </div>
            {groups.length === 0 ? (
                <p>
                    No rulesets match.{" "}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => props.onFilter(EMPTY_RULESET_FILTER)}>Clear filters</button>
                </p>
            ) : null}
            {groups.map((group) => {
                // While a search or filter is on every shown group is open, so no match hides in a folded group.
                const open = filtering || (props.openGroups[group.category] ?? (group.ticked > 0 || all.length <= OPEN_ALL_UP_TO));
                return (
                    <details key={group.category} open={open} data-testid={"ruleset-group-" + group.category}
                        onToggle={(event) => {
                            const now = (event.currentTarget as HTMLDetailsElement).open;
                            if (now !== open) props.onGroupToggle(group.category, now);
                        }}>
                        <summary><strong>{group.label} ({group.ticked} of {group.total} ticked)</strong></summary>
                        {group.rulesets.map(row)}
                    </details>
                );
            })}
        </div>
    );
}
