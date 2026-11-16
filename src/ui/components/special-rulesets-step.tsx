import React, { useState, type JSX } from 'react';
import { RulesEditionUnitType } from '../../data/rules-editions';
import { getRulesetConflict, getSpecialRulesets, UNIT_TYPE_PLURALS } from '../../data/special-rulesets';
import FutureWarsRulesReference from './future-wars-rules-reference';
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
                {getSpecialRulesets().map((ruleset) => {
                    const ticked = props.rulesets.includes(ruleset.id);
                    const clash = ticked ? undefined : getRulesetConflict(props.rulesets, ruleset.id);
                    const removesThis = !ticked && !!props.unitType && !!ruleset.removesUnitTypes?.includes(props.unitType);
                    return (
                        <div key={ruleset.id}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={ticked}
                                    disabled={!!clash || removesThis}
                                    aria-describedby={"ruleset-about-" + ruleset.id}
                                    onChange={() => props.onToggle([ruleset.id])}
                                />{" "}
                                {ruleset.name}
                            </label>
                            <p className="smaller-text" id={"ruleset-about-" + ruleset.id}>
                                {ruleset.description}{" "}
                                Source: {ruleset.source.url ? <a href={ruleset.source.url} target="_blank" rel="noopener noreferrer">{ruleset.source.title}</a> : ruleset.source.title}.
                                {clash ? <span className="color-red"> Clashes with {clash.name}.</span> : null}
                                {removesThis && props.unitType ? <span className="color-red"> {UNIT_TYPE_PLURALS[props.unitType]} do not exist under this ruleset.</span> : null}
                            </p>
                            <FutureWarsRulesReference rulesetId={ruleset.id} />
                        </div>
                    );
                })}
            </StandardModal>
        </>
    );
}
