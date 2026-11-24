import React, { useId, useState, type JSX } from 'react';
import { Link } from 'react-router';
import { formatCitations, type ICalcBreakdown, type ICalcStep } from '../../data/calc-steps';
import type AerospaceFighter from '../../classes/aerospace-fighter';
import type BattleArmor from '../../classes/battle-armor';
import type InfantryPlatoon from '../../classes/infantry-platoon';
import type ProtoMech from '../../classes/protomech';
import type Vehicle from '../../classes/vehicle';
import type { BattleMech } from '../../classes/battlemech';
import { btRulesEditions, getRulesEdition } from '../../data/rules-editions';
import './calc-breakdown.scss';

export interface ICalcBreakdownProps {
    battleValue: (edition: string) => ICalcBreakdown;
    /** The cost under an edition: a Combat Vehicle's reads its Master Rules table under a Master Rules edition. */
    cost?: (edition: string) => ICalcBreakdown;
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
            skillLabel={mech.usesAerospaceSkills() && (pilot.aeroGunnery !== undefined || pilot.aeroPiloting !== undefined)
                ? `Gunnery ${pilot.gunnery} and ${pilot.aeroGunnery ?? pilot.gunnery} aerospace, Piloting ${pilot.piloting} and ${pilot.aeroPiloting ?? pilot.piloting} aerospace (averaged, IO:AE p.186)`
                : `Gunnery ${pilot.gunnery}, Piloting ${pilot.piloting}`}
            mulBattleValue={props.mulBattleValue}
            accuracyHref={props.accuracyHref ?? BV_ACCURACY_PATH}
        />
    );
}

/** A breakdown behind a button, closed until asked for, and left off a print while closed. */
export function CalcBreakdownToggle(props: { children: () => JSX.Element }): JSX.Element {
    const [open, setOpen] = useState(false);
    return (
        <div className="calc-breakdown-toggle">
            <button type="button" className="btn btn-sm btn-primary" aria-expanded={open} onClick={() => setOpen(!open)}>
                Battle Value and cost breakdown
            </button>
            {open ? props.children() : null}
        </div>
    );
}

/**
 * The editions a fighter's breakdown offers, oldest first: BattleTech 4th Edition (the last before Battle Value), the
 * two Master Rules editions (BV1 from AeroTech 2 and its Revised Edition) and Total Warfare (BV2). A fighter is built
 * under Total Warfare, so the breakdown starts there.
 */
export const FIGHTER_BREAKDOWN_EDITIONS = ["battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare"];

/** An aerospace or conventional fighter's breakdown. A Support Vehicle aircraft keeps its log until the Support Vehicle round. */
export function FighterCalcBreakdown(props: { fighter: AerospaceFighter; mulBattleValue?: number; accuracyHref?: string }): JSX.Element {
    const { fighter } = props;
    const pilot = fighter.getPilot();
    return (
        <CalcBreakdown
            battleValue={(edition) => fighter.getBattleValueBreakdown(edition)}
            cost={() => fighter.getCostBreakdown()}
            editions={FIGHTER_BREAKDOWN_EDITIONS}
            edition={fighter.getRulesEdition()}
            skillBattleValue={(edition) => fighter.getPilotAdjustedBattleValue(edition)}
            skillLabel={`Gunnery ${pilot.gunnery}, Piloting ${pilot.piloting}`}
            mulBattleValue={props.mulBattleValue}
            accuracyHref={props.accuracyHref ?? BV_ACCURACY_PATH}
        />
    );
}

/** An infantry platoon's breakdown: the same editions as a fighter's, starting on the platoon's own. A platoon the Master Rules give no line shows no BV1. */
export function InfantryCalcBreakdown(props: { platoon: InfantryPlatoon; mulBattleValue?: number; accuracyHref?: string }): JSX.Element {
    const { platoon } = props;
    return (
        <CalcBreakdown
            battleValue={(edition) => platoon.getBattleValueBreakdown(edition)}
            cost={() => platoon.getCostBreakdown()}
            editions={FIGHTER_BREAKDOWN_EDITIONS}
            edition={platoon.getRulesEdition()}
            skillBattleValue={(edition) => platoon.getSkillAdjustedBattleValue(edition)}
            skillLabel={`Gunnery ${platoon.getGunnery()}, Anti-'Mech ${platoon.getAntiMechSkill()}`}
            mulBattleValue={props.mulBattleValue}
            accuracyHref={props.accuracyHref ?? BV_ACCURACY_PATH}
        />
    );
}

/** A ProtoMech breakdown: the editions a fighter one offers (the 1998 Master Rules show no Battle Value, the Revised Edition BV1), starting on the design own. */
export function ProtoMechCalcBreakdown(props: { proto: ProtoMech; mulBattleValue?: number; accuracyHref?: string }): JSX.Element {
    const { proto } = props;
    return (
        <CalcBreakdown
            battleValue={(edition) => proto.getBattleValueBreakdown(edition)}
            cost={() => proto.getCostBreakdown()}
            editions={FIGHTER_BREAKDOWN_EDITIONS}
            edition={proto.getRulesEdition()}
            skillBattleValue={(edition) => proto.getSkillAdjustedBattleValue(edition)}
            skillLabel={`Gunnery ${proto.getGunnery()}`}
            mulBattleValue={props.mulBattleValue}
            accuracyHref={props.accuracyHref ?? BV_ACCURACY_PATH}
        />
    );
}

/**
 * A Combat Vehicle's breakdown: the editions a fighter's offers, starting on the vehicle's own. The cost reads BMR p.137 or
 * BMR(R) p.150 under a Master Rules edition. A Support Vehicle keeps its logs until the Support Vehicle round.
 */
export function VehicleCalcBreakdown(props: { vehicle: Vehicle; mulBattleValue?: number; accuracyHref?: string }): JSX.Element {
    const { vehicle } = props;
    const pilot = vehicle.getPilot();
    return (
        <CalcBreakdown
            battleValue={(edition) => vehicle.getBattleValueBreakdown(edition)}
            cost={(edition) => vehicle.getCostBreakdown(edition)}
            editions={FIGHTER_BREAKDOWN_EDITIONS}
            edition={vehicle.getRulesEdition()}
            skillBattleValue={(edition) => vehicle.getPilotAdjustedBattleValue(edition)}
            skillLabel={`Gunnery ${pilot.gunnery}, Piloting ${pilot.piloting}`}
            mulBattleValue={props.mulBattleValue}
            accuracyHref={props.accuracyHref ?? BV_ACCURACY_PATH}
        />
    );
}

/** A battle armor unit's breakdown: the same editions as a fighter's, starting on the unit's own (BV2, the Companion's BV1, the cost with training; #599). */
export function BattleArmorCalcBreakdown(props: { suit: BattleArmor; mulBattleValue?: number; accuracyHref?: string }): JSX.Element {
    const { suit } = props;
    return (
        <CalcBreakdown
            battleValue={(edition) => suit.getBattleValueBreakdown(edition)}
            cost={(edition) => suit.getCostBreakdown(edition)}
            editions={FIGHTER_BREAKDOWN_EDITIONS}
            edition={suit.getRulesEdition()}
            skillBattleValue={(edition) => suit.getSkillAdjustedBattleValue(edition)}
            skillLabel={`Gunnery ${suit.getGunnery()}, Anti-'Mech ${suit.getAntiMechSkill()}`}
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
    const cost = props.cost ? props.cost(edition) : null;
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
                    ) : battleValue.scheme === "bv1" ? (
                        <>
                            <p className="calc-breakdown-result"><strong>no BV1</strong> (the Master Rules give this unit no Battle Value 1)</p>
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
