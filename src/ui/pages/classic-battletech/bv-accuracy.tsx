import React, { useEffect, useId, useState, type JSX } from 'react';
import type { IBundledAccuracy, IBundledMiss } from '../../../data/bundled-mechs-build';
import { BV_VERDICTS, getBvVerdict, getBvVerdictEntry, type BvVerdict, type IBvVerdict } from '../../../data/bv-verdicts';
import { formatCitations } from '../../../data/calc-steps';
import { IAppGlobals } from '../../app-router';
import TextSection from '../../components/text-section';
import UIPage from '../../components/ui-page';
import './bv-accuracy.scss';

const ISSUES_URL = "https://github.com/ngcfells/battletech-tools/issues/";

const UNIT_TYPE_NAMES: Record<IBundledAccuracy["unitType"], string> = { mechs: "BattleMechs" };

const VERDICT_NAMES: Record<BvVerdict, string> = {
    "open": "Open",
    "our-bug": "JBT bug",
    "import": "Import fault",
    "mul-suspect": "Master Unit List questioned",
};

const VERDICT_MEANINGS: Record<BvVerdict, string> = {
    "open": "not looked into yet. Until it is, treat the JBT number as the one in doubt.",
    "our-bug": "the JBT calculation is wrong; the issue linked tracks the fix.",
    "import": "the design file JBT converts is wrong or is read wrongly, so the two numbers are not for the same unit.",
    "mul-suspect": "the rules, read on the page cited, give the JBT number and not the list's.",
};

const formatNumber = (value: number): string => value.toLocaleString("en-US");

/** The record files, fetched when the page opens. */
const loadAccuracy = (): Promise<IBundledAccuracy[]> =>
    import("../../../data/bundled/mechs-accuracy.json").then((module) => [module.default as IBundledAccuracy]);

interface IBvAccuracyProps {
    appGlobals: IAppGlobals;
    /** The record, when it is already in hand (tests); otherwise it is fetched. */
    data?: IBundledAccuracy[];
    verdicts?: Record<string, IBvVerdict>;
}

/**
 * The public Battle Value accuracy record (#599): how many units' Battle Value agrees with the Master Unit List's, and
 * every unit where it does not, with the verdict reached so far. A verdict whose key matches no unit is not shown.
 */
export default function BvAccuracy(props: IBvAccuracyProps): JSX.Element {
    const [loaded, setLoaded] = useState<IBundledAccuracy[] | null>(props.data ?? null);
    const [failed, setFailed] = useState(false);
    const [verdictFilter, setVerdictFilter] = useState<BvVerdict | "">("");
    const [search, setSearch] = useState("");
    const id = useId();
    const verdicts = props.verdicts ?? BV_VERDICTS;
    const { appGlobals, data } = props;

    useEffect(() => {
        appGlobals.makeDocumentTitle("Battle Value accuracy");
    }, [appGlobals]);

    useEffect(() => {
        if (data) return;
        let live = true;
        loadAccuracy().then((result) => { if (live) setLoaded(result); }).catch(() => { if (live) setFailed(true); });
        return () => { live = false; };
    }, [data]);

    const records = data ?? loaded;
    const needle = search.trim().toLowerCase();
    const shows = (miss: IBundledMiss): boolean =>
        (!verdictFilter || getBvVerdict(miss, verdicts) === verdictFilter)
        && (!needle || `${miss.name} ${miss.config ?? ""}`.toLowerCase().includes(needle));

    return (
        <UIPage current="classic-battletech" appGlobals={props.appGlobals}>
            <TextSection label="Battle Value accuracy">
                <div className="bv-accuracy">
                    <p>
                        We work out every Battle Value from the rulebooks and their errata, step by step, and show the steps and
                        the page each one comes from. This page compares the result with the Master Unit List. Every unit where
                        the two differ is listed here, including the ones that are open JBT bugs. Nothing is left off to make
                        the count look better.
                    </p>
                    <p>
                        Not part of this record yet: a unit the Master Unit List gives no Battle Value for, a design file that
                        failed to import, and an OmniMech configuration the list has no entry for (we can only check that one
                        against its own file). The first two are counted below as not yet checked.
                    </p>

                    {failed ? <p role="alert">The accuracy record could not be loaded. Reload the page to try again.</p> : null}
                    {!records && !failed ? <p>Loading the accuracy record.</p> : null}

                    {records ? (
                        <>
                            <table className="table bv-accuracy-counts" aria-label="Battle Value accuracy by unit type">
                                <thead>
                                    <tr>
                                        <th scope="col">Unit type</th>
                                        <th scope="col">Match</th>
                                        <th scope="col">Differ</th>
                                        <th scope="col">Not yet checked</th>
                                        <th scope="col">Match rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((record) => {
                                        const compared = record.matched + record.differs.length;
                                        const percent = compared ? Math.floor(record.matched / compared * 1000) / 10 : 0;
                                        return (
                                            <tr key={record.unitType}>
                                                <th scope="row">{UNIT_TYPE_NAMES[record.unitType] ?? record.unitType}</th>
                                                <td>{formatNumber(record.matched)}</td>
                                                <td>{formatNumber(record.differs.length)}</td>
                                                <td>{formatNumber(record.notChecked.importFailed + record.notChecked.noMulEntry)}</td>
                                                <td>{compared ? `${percent}%` : ""}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <p className="small-text">Match: the JBT Battle Value equals the list&apos;s. Match rate: the share of the units compared that match, rounded down. Other unit types join this record as their calculations are cited.</p>

                            <h3>Units whose Battle Value differs</h3>
                            <dl className="bv-accuracy-verdicts">
                                {(Object.keys(VERDICT_NAMES) as BvVerdict[]).map((verdict) => (
                                    <div key={verdict}><dt>{VERDICT_NAMES[verdict]}</dt><dd>{VERDICT_MEANINGS[verdict]}</dd></div>
                                ))}
                            </dl>
                            <div className="bv-accuracy-filters">
                                <label htmlFor={`${id}-verdict`}>Verdict</label>
                                <select id={`${id}-verdict`} value={verdictFilter} onChange={(event) => setVerdictFilter(event.currentTarget.value as BvVerdict | "")}>
                                    <option value="">All</option>
                                    {(Object.keys(VERDICT_NAMES) as BvVerdict[]).map((verdict) => <option key={verdict} value={verdict}>{VERDICT_NAMES[verdict]}</option>)}
                                </select>
                                <label htmlFor={`${id}-search`}>Search by name</label>
                                <input id={`${id}-search`} type="search" value={search} onChange={(event) => setSearch(event.currentTarget.value)} />
                            </div>

                            {records.map((record) => {
                                const rows = record.differs.filter(shows);
                                return (
                                    <div key={record.unitType}>
                                        <p aria-live="polite">{rows.length === 0 ? "No unit matches." : `${formatNumber(rows.length)} of ${formatNumber(record.differs.length)} ${UNIT_TYPE_NAMES[record.unitType] ?? record.unitType} shown.`}</p>
                                        {rows.length ? (
                                            <table className="table bv-accuracy-units" aria-label="Units whose Battle Value differs">
                                                <thead>
                                                    <tr>
                                                        <th scope="col">Unit</th>
                                                        <th scope="col">Configuration</th>
                                                        <th scope="col">JBT BV</th>
                                                        <th scope="col">List BV</th>
                                                        <th scope="col">Difference</th>
                                                        <th scope="col">Verdict</th>
                                                        <th scope="col">Note</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rows.map((miss) => {
                                                        const entry = getBvVerdictEntry(miss, verdicts);
                                                        const difference = miss.ours - miss.mul;
                                                        return (
                                                            <tr key={`${miss.mulId ?? miss.file}:${miss.config ?? ""}`}>
                                                                <th scope="row">{miss.name}</th>
                                                                <td data-label="Configuration">{miss.config ?? ""}</td>
                                                                <td data-label="JBT BV" className="bv-accuracy-number">{formatNumber(miss.ours)}</td>
                                                                <td data-label="List BV" className="bv-accuracy-number">{formatNumber(miss.mul)}</td>
                                                                <td data-label="Difference" className="bv-accuracy-number">{difference > 0 ? "+" : "-"}{formatNumber(Math.abs(difference))}</td>
                                                                <td data-label="Verdict">{VERDICT_NAMES[entry?.verdict ?? "open"]}</td>
                                                                <td data-label="Note">
                                                                    {entry ? (
                                                                        <>
                                                                            {entry.note}
                                                                            {entry.cites?.length ? <> ({formatCitations(entry.cites)})</> : null}
                                                                            {typeof entry.issue === "number" ? <> <a href={`${ISSUES_URL}${entry.issue}`} target="_blank" rel="noopener noreferrer">#{entry.issue}</a></> : null}
                                                                        </>
                                                                    ) : null}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </>
                    ) : null}
                </div>
            </TextSection>
        </UIPage>
    );
}
