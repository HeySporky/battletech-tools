import React, { useId, useState, type JSX } from 'react';
import { Link } from 'react-router';
import { formatCitations, type ICalcBreakdown, type ICalcStep } from '../../data/calc-steps';
import type { BattleMech } from '../../classes/battlemech';
import { btRulesEditions, getRulesEdition } from '../../data/rules-editions';
import './calc-breakdown.scss';

export interface ICalcBreakdownProps {
    battleValue: (edition: string) => ICalcBreakdown;
    cost?: () => ICalcBreakdown;
    /** Edition tags to offer, oldest first. */
    editions: string[];
    /** The design's own edition: the starting choice. */
    edition: string;
    /** The Battle Value adjusted for the pilot's skills under an edition, shown under the total. */
    skillBattleValue?: (edition: string) => number;
    /** The skills that adjustment is for, in words ("Gunnery 4, Piloting 5"). */
    skillLabel?: string;
    /** A bundled Master Unit List design's BV, shown beside ours under a BV2 edition only. */
    mulBattleValue?: number;
    /** Link shown when mulBattleValue differs from ours. */
    accuracyHref?: string;
}

/** Where the Battle Value accuracy record lives. */
export const BV_ACCURACY_PATH = `${process.env.PUBLIC_URL}/classic-battletech/battle-value-accuracy`;

/** A 'Mech's breakdown: every rules edition that covers 'Mechs, oldest first, starting on the design's own. */
export function MechCalcBreakdown(props: { mech: BattleMech; mulBattleValue?: number; accuracyHref?: string }): JSX.Element {
    const { mech } = props;
    const pilot = mech.getPilot();
    return (
        <CalcBreakdown
            battleValue={(edition) => mech.getBattleValueBreakdown(edition)}
            cost={() => mech.getCostBreakdown()}
            editions={btRulesEditions.filter((edition) => (edition.unitTypes ?? ["mech"]).includes("mech")).map((edition) => edition.tag)}
            edition={mech.getRulesEdition()}
            skillBattleValue={(edition) => mech.getPilotAdjustedBattleValue(edition)}
            skillLabel={`Gunnery ${pilot.gunnery}, Piloting ${pilot.piloting}`}
            mulBattleValue={props.mulBattleValue}
            accuracyHref={props.accuracyHref ?? BV_ACCURACY_PATH}
        />
    );
}

const formatNumber =(value: number): string => value.toLocaleString("en-US", { maximumFractionDigits: 3 });

const STATUS_TEXT = {
    "provisional": "Provisional:",
    "source-missing": "Source not yet in NGCFells's library:",
} as const;

/** The steps as rows of label, arithmetic, result and citation, under a heading row per section. Text only: no markup is read from a step. */
function StepsTable(props: { steps: ICalcStep[]; caption: string }): JSX.Element {
    const rows: JSX.Element[] = [];
    let section: string | undefined;
    const noted = new Map<string, string>();
    props.steps.forEach((step, index) => {
        if (step.section !== section) {
            section = step.section;
            rows.push(<tr key={`section-${index}`} className="calc-breakdown-section"><th colSpan={4} scope="colgroup">{section}</th></tr>);
        }
        const cites = formatCitations(step.cites);
        // A note many rows share (every weapon's price) is printed on the first of them; the rest point back to it.
        let note = step.note ?? "";
        if (step.status !== "cited" && note) {
            const first = noted.get(note);
            if (first === undefined) noted.set(note, step.label);
            else note = `as noted at ${first}, above.`;
        }
        rows.push(
            <tr key={index} className={step.emphasis ? "calc-breakdown-emphasis" : undefined}>
                <td className="calc-breakdown-label">{step.label}</td>
                <td className="calc-breakdown-detail">{step.detail ?? ""}</td>
                <td className="calc-breakdown-value">
                    {typeof step.value === "number" ? formatNumber(step.value) : ""}
                    {typeof step.total === "number" ? <span className="calc-breakdown-running">running total {formatNumber(step.total)}</span> : null}
                </td>
                <td className="calc-breakdown-cites">
                    {cites ? <span>{cites}</span> : null}
                    {step.status !== "cited" ? <span className="calc-breakdown-status">{STATUS_TEXT[step.status]} {note}</span> : null}
                </td>
            </tr>
        );
    });
    return (
        <table className="calc-breakdown-steps">
            <caption className="visually-hidden">{props.caption}</caption>
            <thead>
                <tr><th scope="col">Step</th><th scope="col">Arithmetic</th><th scope="col">Result</th><th scope="col">Source</th></tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
    );
}

/**
 * A unit's Battle Value and cost as the calculation's own cited steps (#599), with a switch between rules editions.
 * The steps come from the calculation: nothing here works a number out.
 */
export default function CalcBreakdown(props: ICalcBreakdownProps): JSX.Element {
    const offered = props.editions.includes(props.edition) ? props.edition : props.editions[props.editions.length - 1] ?? props.edition;
    const [edition, setEdition] = useState(offered);
    const id = useId();
    const battleValue = props.battleValue(edition);
    const cost = props.cost ? props.cost() : null;
    const hasBattleValue = battleValue.scheme !== "none" && battleValue.result !== null;
    const showMul = hasBattleValue && battleValue.scheme === "bv2" && typeof props.mulBattleValue === "number";
    const mulDifference = showMul ? (battleValue.result as number) - (props.mulBattleValue as number) : 0;

    return (
        <div className="calc-breakdown">
            <label className="calc-breakdown-edition" htmlFor={`${id}-edition`}>Rules edition</label>{" "}
            <select id={`${id}-edition`} value={edition} onChange={(event) => setEdition(event.currentTarget.value)}>
                {props.editions.map((tag) => <option key={tag} value={tag}>{getRulesEdition(tag).name}</option>)}
            </select>

            <div className="calc-breakdown-sections">
                <section aria-labelledby={`${id}-bv`}>
                    <h4 id={`${id}-bv`}>Battle Value</h4>
                    {hasBattleValue ? (
                        <>
                            <p className="calc-breakdown-result">
                                <strong>{formatNumber(battleValue.result as number)}</strong>
                                {battleValue.scheme === "bv1" ? " (Battle Value 1, as this edition works it out)" : null}
                            </p>
                            {props.skillBattleValue ? (
                                <p>Adjusted for skill{props.skillLabel ? ` (${props.skillLabel})` : ""}: {formatNumber(props.skillBattleValue(edition))}</p>
                            ) : null}
                            {showMul ? (
                                <p>
                                    Master Unit List: {formatNumber(props.mulBattleValue as number)}
                                    {mulDifference !== 0 ? `. The JBT value differs by ${mulDifference > 0 ? "+" : "-"}${formatNumber(Math.abs(mulDifference))}. ` : null}
                                    {mulDifference !== 0 && props.accuracyHref ? <Link to={props.accuracyHref}>See the Battle Value accuracy record</Link> : null}
                                </p>
                            ) : null}
                            {battleValue.notes?.map((note, index) => <p key={index} className="smaller-text">{note}</p>)}
                            <StepsTable steps={battleValue.steps} caption="Battle Value steps" />
                        </>
                    ) : (
                        battleValue.steps.map((step, index) => <p key={index}>{step.label}</p>)
                    )}
                </section>

                {cost ? (
                    <section aria-labelledby={`${id}-cost`}>
                        <h4 id={`${id}-cost`}>Cost</h4>
                        {cost.result !== null ? <p className="calc-breakdown-result"><strong>{formatNumber(cost.result)} C-bills</strong></p> : null}
                        {cost.notes?.map((note, index) => <p key={index} className="smaller-text">{note}</p>)}
                        <StepsTable steps={cost.steps} caption="Cost steps" />
                    </section>
                ) : null}
            </div>
        </div>
    );
}
