import React, { useEffect, useId, useMemo, useState, type JSX } from 'react';
import type { IBundledAccuracy, IBundledMatch, IBundledMiss } from '../../../data/bundled-mechs-build';
import { BV_VERDICTS, getBvVerdictEntry, type BvVerdict, type IBvVerdict } from '../../../data/bv-verdicts';
import { formatCitations } from '../../../data/calc-steps';
import { btEraOptions } from '../../../data/era-options';
import { untabulate } from '../../../utils/packed-json';
import { IAppGlobals } from '../../app-router';
import TextSection from '../../components/text-section';
import UIPage from '../../components/ui-page';
import './bv-accuracy.scss';

const ISSUES_URL = "https://github.com/ngcfells/battletech-tools/issues/";

/** Every bundled type, in the order the counts list them. */
const UNIT_TYPE_NAMES: Record<IBundledAccuracy["unitType"], string> = {
    "mechs": "BattleMechs", "vehicles": "Combat Vehicles", "support-vehicles": "Support Vehicles", "fighters": "Fighters", "infantry": "Conventional infantry",
    "battle-armor": "Battle armor", "protomechs": "ProtoMechs", "small-craft": "Small Craft and DropShips",
};
const TYPE_ORDER = Object.keys(UNIT_TYPE_NAMES);

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

/** 'Mech weight classes by tonnage (TW p.16; superheavy from IO). */
const WEIGHT_CLASSES: { name: string, below: number }[] = [
    { name: "Ultralight", below: 20 },
    { name: "Light", below: 40 },
    { name: "Medium", below: 60 },
    { name: "Heavy", below: 80 },
    { name: "Assault", below: 101 },
    { name: "Superheavy", below: Infinity },
];
const weightClassOf = (tons?: number): string => tons === undefined ? "" : WEIGHT_CLASSES.find(({ below }) => tons < below)!.name;

/** The general timeline's eras (the Clan homeworld eras overlap them, so are left out of the filter). */
const ERAS = btEraOptions.filter((era) => !era.tag.startsWith("clan-"));
const eraOf = (year?: number): string => year === undefined ? "" : ERAS.find((era) => year >= era.yearStart && (!era.yearEnd || year <= era.yearEnd))?.name ?? "";

const RULES_ORDER = ["Introductory", "Standard", "Advanced", "Experimental", "Unofficial"];

const PAGE_SIZE = 100;

const formatNumber = (value: number): string => value.toLocaleString("en-US");

/** Each bundled type's record file, fetched when the page opens. */
const ACCURACY_FILES = import.meta.glob("../../../data/bundled/*-accuracy.json", { import: "default" }) as Record<string, () => Promise<unknown>>;

/** The record files, in the counts' order. The matched units are stored as a table. */
const loadAccuracy = (): Promise<IBundledAccuracy[]> =>
    Promise.all(Object.values(ACCURACY_FILES).map((load) => load())).then((files) => files.map((file) => {
        const record = file as IBundledAccuracy;
        return { ...record, ...(record.matches ? { matches: untabulate(record.matches) as IBundledMatch[] } : {}) };
    }).sort((a, b) => TYPE_ORDER.indexOf(a.unitType) - TYPE_ORDER.indexOf(b.unitType)));

/** One unit compared: a match, or a difference with its verdict. */
interface IRow {
    key: string;
    unitType: string;
    name: string;
    config: string;
    tons?: number;
    weightClass: string;
    tech: string;
    rules: string;
    year?: number;
    era: string;
    role: string;
    book: string;
    ours: number;
    mul: number;
    match: boolean;
    verdict?: BvVerdict;
    entry?: IBvVerdict;
}

// The weight classes are the 'Mechs' (other types are weighed on scales of their own).
const toRows = (records: IBundledAccuracy[], verdicts: Record<string, IBvVerdict>): IRow[] => records.flatMap((record) => {
    const weigh = (tons?: number) => record.unitType === "mechs" ? weightClassOf(tons) : "";
    return [
    ...(record.matches ?? []).map((match): IRow => ({
        key: `${record.unitType}:match:${match.mulId}`, unitType: record.unitType, name: match.name, config: "", tons: match.tons, weightClass: weigh(match.tons),
        tech: match.tech ?? "", rules: match.rules ?? "", year: match.year, era: eraOf(match.year), role: match.role ?? "", book: match.book ?? "",
        ours: match.bv, mul: match.bv, match: true,
    })),
    ...record.differs.map((miss: IBundledMiss): IRow => {
        const entry = getBvVerdictEntry(miss, verdicts);
        return {
            key: `${record.unitType}:${miss.mulId ?? miss.file}:${miss.config ?? ""}`, unitType: record.unitType, name: miss.name, config: miss.config ?? "", tons: miss.tons,
            weightClass: weigh(miss.tons), tech: miss.tech ?? "", rules: miss.rules ?? "", year: miss.year, era: eraOf(miss.year),
            role: miss.role ?? "", book: miss.book ?? "", ours: miss.ours, mul: miss.mul, match: false, verdict: entry?.verdict ?? "open", entry,
        };
    }),
    ];
});

type SortKey = "name" | "tons" | "year" | "ours" | "mul" | "difference";
const SORTS: { key: SortKey, label: string, value: (row: IRow) => number | string }[] = [
    { key: "name", label: "Unit", value: (row) => `${row.name} ${row.config}` },
    { key: "tons", label: "Tons", value: (row) => row.tons ?? -1 },
    { key: "year", label: "Year", value: (row) => row.year ?? -1 },
    { key: "ours", label: "JBT BV", value: (row) => row.ours },
    { key: "mul", label: "List BV", value: (row) => row.mul },
    { key: "difference", label: "Difference", value: (row) => Math.abs(row.ours - row.mul) },
];

/** Each sort's two ways in words, descending first. */
const SORT_WORDS: Record<SortKey, [string, string]> = {
    name: ["Z to A", "A to Z"],
    tons: ["heaviest first", "lightest first"],
    year: ["newest first", "oldest first"],
    ours: ["highest first", "lowest first"],
    mul: ["highest first", "lowest first"],
    difference: ["largest first", "smallest first"],
};

interface IFilters {
    search: string;
    unitType: string;
    result: "differs" | "matches" | "";
    verdict: BvVerdict | "";
    weightClass: string;
    tech: string;
    rules: string;
    era: string;
    role: string;
    book: string;
    direction: "higher" | "lower" | "";
}
const NO_FILTERS: IFilters = { search: "", unitType: "", result: "differs", verdict: "", weightClass: "", tech: "", rules: "", era: "", role: "", book: "", direction: "" };

const passes = (row: IRow, filters: IFilters, needle: string): boolean =>
    (!filters.unitType || row.unitType === filters.unitType)
    && (filters.result !== "differs" || !row.match) && (filters.result !== "matches" || row.match)
    && (!filters.verdict || row.verdict === filters.verdict)
    && (!filters.weightClass || row.weightClass === filters.weightClass)
    && (!filters.tech || row.tech === filters.tech)
    && (!filters.rules || row.rules === filters.rules)
    && (!filters.era || row.era === filters.era)
    && (!filters.role || row.role === filters.role)
    && (!filters.book || row.book === filters.book)
    && (filters.direction !== "higher" || row.ours > row.mul) && (filters.direction !== "lower" || row.ours < row.mul)
    && (!needle || `${row.name} ${row.config} ${row.book} ${row.entry?.note ?? ""}`.toLowerCase().includes(needle));

/** The distinct values of a field, in the given order first, then alphabetically. */
const choices = (rows: IRow[], field: (row: IRow) => string, order: string[] = []): string[] =>
    [...new Set(rows.map(field).filter(Boolean))].sort((a, b) => {
        const at = (value: string) => order.indexOf(value) < 0 ? order.length : order.indexOf(value);
        return at(a) - at(b) || a.localeCompare(b);
    });

interface IBvAccuracyProps {
    appGlobals: IAppGlobals;
    /** The record, when it is already in hand (tests); otherwise it is fetched. */
    data?: IBundledAccuracy[];
    verdicts?: Record<string, IBvVerdict>;
}

/**
 * The public Battle Value accuracy record (#599): how many units' Battle Value agrees with the Master Unit List's, and
 * every unit compared, found by name, book, weight, tech base, rules level, era and role. A unit that differs shows
 * the verdict reached so far. A verdict whose key matches no unit is not shown.
 */
export default function BvAccuracy(props: IBvAccuracyProps): JSX.Element {
    const [loaded, setLoaded] = useState<IBundledAccuracy[] | null>(props.data ?? null);
    const [failed, setFailed] = useState(false);
    const [filters, setFilters] = useState<IFilters>(NO_FILTERS);
    const [sort, setSort] = useState<{ key: SortKey, descending: boolean }>({ key: "name", descending: false });
    const [shown, setShown] = useState(PAGE_SIZE);
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
    const rows = useMemo(() => records ? toRows(records, verdicts) : [], [records, verdicts]);
    const hasMatches = !!records?.some((record) => record.matches);
    const needle = filters.search.trim().toLowerCase();
    const sorted = useMemo(() => {
        const value = SORTS.find(({ key }) => key === sort.key)!.value;
        const name = SORTS[0].value;
        const compare = (a: IRow, b: IRow) => {
            const left = value(a), right = value(b);
            const order = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
            return order || String(name(a)).localeCompare(String(name(b)));
        };
        return rows.filter((row) => passes(row, filters, needle)).sort((a, b) => sort.descending ? compare(b, a) : compare(a, b));
    }, [rows, filters, needle, sort]);

    const change = (field: keyof IFilters) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = event.currentTarget.value;
        setFilters((before) => ({ ...before, [field]: value, ...(field === "result" && value === "matches" ? { verdict: "", direction: "" } : {}) }));
        setShown(PAGE_SIZE);
    };
    const sortBy = (key: SortKey) => {
        setSort((before) => ({ key, descending: before.key === key ? !before.descending : key !== "name" }));
    };
    const select = (field: keyof IFilters, label: string, options: [string, string][], disabled = false) => (
        <div className="bv-accuracy-filter">
            <label htmlFor={`${id}-${field}`}>{label}</label>
            <select id={`${id}-${field}`} value={filters[field]} disabled={disabled} onChange={change(field)}>
                {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
        </div>
    );
    const all = (values: string[]): [string, string][] => [["", "All"], ...values.map((value): [string, string] => [value, value])];
    // Most units have no configuration, so the column shows only when one listed does.
    const hasConfig = sorted.slice(0, shown).some((row) => row.config);
    const filtered = Object.entries(filters).some(([field, value]) => value !== NO_FILTERS[field as keyof IFilters]);
    const ofType = rows.filter((row) => !filters.unitType || row.unitType === filters.unitType);
    const total = filters.result === "differs" ? ofType.filter((row) => !row.match).length : filters.result === "matches" ? ofType.filter((row) => row.match).length : ofType.length;

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
                            <p className="small-text">Match: the JBT Battle Value equals the list&apos;s. Match rate: the share of the units compared that match, rounded down. Every unit type the app ships designs for is here; a type&apos;s Battle Value steps are cited as its round is done.</p>

                            <h3>Find a unit</h3>
                            <p>
                                Search by name, configuration, book or note, and narrow the list by any of the Master Unit
                                List&apos;s facts about the unit. {hasMatches ? "Show matching units too to look up any unit compared." : null}
                            </p>
                            <dl className="bv-accuracy-verdicts">
                                {(Object.keys(VERDICT_NAMES) as BvVerdict[]).map((verdict) => (
                                    <div key={verdict}><dt>{VERDICT_NAMES[verdict]}</dt><dd>{VERDICT_MEANINGS[verdict]}</dd></div>
                                ))}
                            </dl>
                            <div className="bv-accuracy-filters" role="search">
                                <div className="bv-accuracy-filter bv-accuracy-search">
                                    <label htmlFor={`${id}-search`}>Search</label>
                                    <input id={`${id}-search`} type="search" value={filters.search} onChange={change("search")} placeholder="Name, book or note" />
                                </div>
                                {records.length > 1 ? select("unitType", "Unit type", [["", "All"], ...records.map((record): [string, string] => [record.unitType, UNIT_TYPE_NAMES[record.unitType] ?? record.unitType])]) : null}
                                {hasMatches ? select("result", "Result", [["differs", "Differs"], ["matches", "Matches"], ["", "All"]]) : null}
                                {select("verdict", "Verdict", all(Object.keys(VERDICT_NAMES)).map(([value, text]) => [value, value ? VERDICT_NAMES[value as BvVerdict] : text]), filters.result === "matches")}
                                {select("direction", "JBT is", [["", "Higher or lower"], ["higher", "Higher"], ["lower", "Lower"]], filters.result === "matches")}
                                {select("weightClass", "Weight", all(choices(rows, (row) => row.weightClass, WEIGHT_CLASSES.map(({ name }) => name))))}
                                {select("tech", "Tech base", all(choices(rows, (row) => row.tech)))}
                                {select("rules", "Rules level", all(choices(rows, (row) => row.rules, RULES_ORDER)))}
                                {select("era", "Era", all(choices(rows, (row) => row.era, ERAS.map(({ name }) => name))))}
                                {select("role", "Role", all(choices(rows, (row) => row.role)))}
                                {select("book", "Book", all(choices(rows, (row) => row.book)))}
                                <div className="bv-accuracy-filter">
                                    {/* The column headings sort too, but a phone shows each unit as a card, without them. */}
                                    <label htmlFor={`${id}-sort`}>Sort by</label>
                                    <select id={`${id}-sort`} value={`${sort.key}:${sort.descending ? "down" : "up"}`} onChange={(event) => {
                                        const [key, way] = event.currentTarget.value.split(":");
                                        setSort({ key: key as SortKey, descending: way === "down" });
                                    }}>
                                        {SORTS.flatMap(({ key, label }) => {
                                            const [down, up] = SORT_WORDS[key];
                                            const both: [string, string][] = [[`${key}:down`, `${label}, ${down}`], [`${key}:up`, `${label}, ${up}`]];
                                            return key === "name" ? both.reverse() : both;
                                        }).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                                    </select>
                                </div>
                                {filtered ? <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setFilters(NO_FILTERS); setShown(PAGE_SIZE); }}>Clear</button> : null}
                            </div>

                            <p aria-live="polite">{sorted.length === 0 ? "No unit matches." : `${formatNumber(sorted.length)} of ${formatNumber(total)} units shown.`}</p>
                            {sorted.length ? (
                                <table className="table bv-accuracy-units" aria-label="Units compared">
                                    <thead>
                                        <tr>
                                            {SORTS.slice(0, 3).map(({ key, label }) => <SortHeader key={key} label={label} numeric={key !== "name"} active={sort.key === key} descending={sort.descending} onSort={() => sortBy(key)} />)}
                                            {hasConfig ? <th scope="col">Configuration</th> : null}
                                            <th scope="col">Tech</th>
                                            <th scope="col">Book</th>
                                            {SORTS.slice(3).map(({ key, label }) => <SortHeader key={key} label={label} numeric={key !== "name"} active={sort.key === key} descending={sort.descending} onSort={() => sortBy(key)} />)}
                                            <th scope="col">Verdict</th>
                                            <th scope="col">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sorted.slice(0, shown).map((row) => {
                                            const difference = row.ours - row.mul;
                                            const entry = row.entry;
                                            return (
                                                <tr key={row.key} className={row.match ? "bv-accuracy-match" : undefined}>
                                                    <th scope="row">{row.name}</th>
                                                    <td data-label="Tons" className="bv-accuracy-number">{row.tons ?? ""}</td>
                                                    <td data-label="Year" className="bv-accuracy-number">{row.year ?? ""}</td>
                                                    {hasConfig ? <td data-label="Configuration">{row.config}</td> : null}
                                                    <td data-label="Tech">{row.tech}</td>
                                                    <td data-label="Book">{row.book}</td>
                                                    <td data-label="JBT BV" className="bv-accuracy-number">{formatNumber(row.ours)}</td>
                                                    <td data-label="List BV" className="bv-accuracy-number">{formatNumber(row.mul)}</td>
                                                    <td data-label="Difference" className="bv-accuracy-number">{difference === 0 ? "0" : `${difference > 0 ? "+" : "-"}${formatNumber(Math.abs(difference))}`}</td>
                                                    <td data-label="Verdict">{row.match ? "Match" : VERDICT_NAMES[row.verdict ?? "open"]}</td>
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
                            {sorted.length > shown ? (
                                <p>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShown(shown + PAGE_SIZE)}>Show {formatNumber(Math.min(PAGE_SIZE, sorted.length - shown))} more</button>{" "}
                                    <button type="button" className="btn btn-secondary" onClick={() => setShown(sorted.length)}>Show all {formatNumber(sorted.length)}</button>
                                </p>
                            ) : null}
                        </>
                    ) : null}
                </div>
            </TextSection>
        </UIPage>
    );
}

/** A column heading that sorts the list; pressed again, the other way. */
function SortHeader(props: { label: string, numeric: boolean, active: boolean, descending: boolean, onSort: () => void }): JSX.Element {
    return (
        <th scope="col" className={props.numeric ? "bv-accuracy-number" : undefined} aria-sort={props.active ? (props.descending ? "descending" : "ascending") : undefined}>
            <button type="button" className="bv-accuracy-sort" onClick={props.onSort}>
                {props.label}{props.active ? (props.descending ? " ▼" : " ▲") : null}
            </button>
        </th>
    );
}
