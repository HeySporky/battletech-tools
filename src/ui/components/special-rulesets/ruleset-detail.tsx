import React, { useEffect, useRef, type JSX } from 'react';
import { RulesEditionUnitType } from '../../../data/rules-editions';
import {
    CHANGE_LABELS, findSpecialRuleset, getRulesetBlock, getRulesetRelations, ISpecialRuleset, RULESET_CATEGORIES,
} from '../../../data/special-rulesets';
import FutureWarsRulesReference from '../future-wars-rules-reference';

/**
 * One ruleset's More info view in the Special Rulesets window (#324): everything about it, what it cannot be used with,
 * what it needs, and a Tick/Untick button that refuses what the list refuses.
 */
export default function RulesetDetail(props: {
    id: string;
    tickedIds: string[];
    unitType?: RulesEditionUnitType;
    onToggle: (ids: string[]) => void;
    onBack: () => void;
}): JSX.Element | null {
    const back = useRef<HTMLButtonElement>(null);
    useEffect(() => back.current?.focus(), [props.id]);
    const ruleset = findSpecialRuleset(props.id);
    if (!ruleset) {
        return null;
    }
    const ticked = props.tickedIds.includes(ruleset.id);
    const block = getRulesetBlock(props.tickedIds, ruleset.id, props.unitType);
    const disabled = ticked ? block?.kind === "neededBy" : !!block;
    const relations = getRulesetRelations(ruleset.id);
    const category = RULESET_CATEGORIES.find((entry) => entry.id === ruleset.category)?.label ?? ruleset.category;
    const names = (list: ISpecialRuleset[]) => list.map((other) => other.name).join("; ");
    const cannot = [...relations.clashesWith, ...relations.excludes];

    return (
        <div className="ruleset-detail" data-testid={"ruleset-detail-" + ruleset.id}>
            <button type="button" ref={back} className="btn btn-secondary btn-sm" onClick={props.onBack}>&larr; Back to list</button>
            <h4 className="mt-2">{ruleset.name}</h4>
            <p className="small-text">Category: {category} &middot; Source: {ruleset.source.tag}</p>
            <p>{ruleset.description}</p>
            <FutureWarsRulesReference rulesetId={ruleset.id} open />
            <p className="small-text">
                Source: {ruleset.source.url
                    ? <a href={ruleset.source.url} target="_blank" rel="noopener noreferrer">{ruleset.source.title}</a>
                    : ruleset.source.title}
                {ruleset.source.author ? <><br />Author: {ruleset.source.author}</> : null}
            </p>
            <ul className="small-text">
                <li>Changes: {ruleset.changes.map((change) => CHANGE_LABELS[change] ?? change).join(", ")}</li>
                {cannot.length > 0 ? <li>Cannot be used with: {names(cannot)}</li> : null}
                {relations.requires.length > 0 ? <li>Needs: {names(relations.requires)}</li> : null}
                {relations.requiredBy.length > 0 ? <li>Needed by: {names(relations.requiredBy)}</li> : null}
            </ul>
            {block ? <p className="color-red">{block.reason}.</p> : null}
            <button type="button" className="btn btn-primary btn-sm" disabled={disabled} onClick={() => props.onToggle([ruleset.id])}>
                {ticked ? "Untick this ruleset" : "Tick this ruleset"}
            </button>
        </div>
    );
}
