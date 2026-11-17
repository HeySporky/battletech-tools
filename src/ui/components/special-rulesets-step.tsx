import React, { useState, type JSX } from 'react';
import { RulesEditionUnitType } from '../../data/rules-editions';
import { RulesetCategory } from '../../data/special-rulesets';
import { EMPTY_RULESET_FILTER, IRulesetListFilter } from '../../utils/ruleset-list';
import RulesetList from './special-rulesets/ruleset-list';
import StandardModal from './standard-modal';

/**
 * The Special Rulesets step (#324), first in the settings block and in the roster MUL searches: a yes/no, a button
 * that reopens the window, and the window itself with one checkbox per ruleset. The caller keeps the ticked ids and
 * learns which ones to toggle, in order ("No" toggles every ticked one).
 */
export default function SpecialRulesetsStep(props: {
    rulesets: string[];
    /** The unit type being built; a ruleset that removes it is disabled. Left out by the searches. */
    unitType?: RulesEditionUnitType;
    /** Shown inside the window as well, since the caller's own notice sits behind it. */
    notice: string;
    onToggle: (ids: string[]) => void;
}): JSX.Element {
    const [windowOpen, setWindowOpen] = useState(false);
    // The list's search, filters and folded groups last while the step is on the page.
    const [filter, setFilter] = useState<IRulesetListFilter>(EMPTY_RULESET_FILTER);
    const [openGroups, setOpenGroups] = useState<Partial<Record<RulesetCategory, boolean>>>({});
    const using = props.rulesets.length > 0 || windowOpen;

    const choose = (value: string): void => {
        if (value === "yes") {
            setWindowOpen(true);
        } else {
            props.onToggle(props.rulesets);
        }
    };

    return (
        <>
            <label>
                Special Rulesets:
                <select value={using ? "yes" : "no"} onChange={(e) => choose(e.currentTarget.value)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                </select>
            </label>
            {using ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setWindowOpen(true)}>Choose rulesets</button>
            ) : null}
            <p className="smaller-text">
                Optional and homebrew rules that change how the game plays or how units are built. Leave this off for standard BattleTech.
            </p>

            <StandardModal show={windowOpen} title="Special Rulesets" className="modal-xl" onClose={() => setWindowOpen(false)}>
                {props.notice ? <p className="smaller-text">{props.notice}</p> : null}
                <RulesetList
                    tickedIds={props.rulesets}
                    unitType={props.unitType}
                    filter={filter}
                    onFilter={setFilter}
                    openGroups={openGroups}
                    onGroupToggle={(category, open) => setOpenGroups((groups) => ({ ...groups, [category]: open }))}
                    onToggle={props.onToggle}
                    onMoreInfo={() => undefined}
                />
            </StandardModal>
        </>
    );
}
