import * as React from "react";
import { AlphaStrikeUnit } from "../../classes/alpha-strike-unit";
import type { BattleMech } from "../../classes/battlemech";
import type ProtoMech from "../../classes/protomech";
import type Vehicle from "../../classes/vehicle";
import { hideMordelUnit, loadMordelList, mordelListShipped, mordelTopUpDue, topUpMordelList } from "../../data/mordel-list";
import { mordelToASMULUnit } from "../../utils/mordel/mordel-alpha-strike";
import { fetchMordelDetail, fetchMyMordelUnits, MordelKeyError, MordelUnavailableError, parseMordelUnitRef } from "../../utils/mordel/mordel-api";
import { importMordelBlk } from "../../utils/mordel/mordel-blk";
import { getMordelKey } from "../../utils/mordel/mordel-key";
import { importMordelMech } from "../../utils/mordel/mordel-mtf";
import { IMordelDetail, IMordelListRow, mordelKeyOf, MordelType } from "../../utils/mordel/mordel-types";

// mordel.net units for a roster or the 'Mech designer: the shipped list to search, the user's own designs, and a box
// for a link to any unit. Alpha Strike cards come from the list itself; a Classic unit's full detail is pulled with
// the user's own key and built here, with a warning when our Battle Value is not mordel.net's.

export type MordelPanelMode = "alpha-strike" | "classic" | "designer";

interface IMordelUnitsPanelProps {
    mode: MordelPanelMode;
    onAddAS?: (unit: AlphaStrikeUnit) => void;
    onAddMech?: (mech: BattleMech) => void;
    onAddVehicle?: (vehicle: Vehicle) => void;
    onAddProtoMech?: (proto: ProtoMech) => void;
}

interface IStatus {
    tone: "success" | "warning" | "danger" | "info";
    text: string;
    details?: string[];
    cautions?: string[];
    settingsLink?: boolean;
}

type Tab = "list" | "mine";

const TYPE_LABELS: Record<MordelType, string> = { bm: "BattleMech", im: "IndustrialMech", cv: "Combat Vehicle", pm: "ProtoMech" };
const MAX_RESULTS = 50;
const SETTINGS_PATH = `${process.env.PUBLIC_URL ?? ""}/settings`;
const TABS: { id: Tab; label: string }[] = [{ id: "list", label: "Mordel.net units" }, { id: "mine", label: "My Mordel designs" }];

const unitName = (unit: IMordelListRow): string => unit.name.trim();

export default function MordelUnitsPanel(props: IMordelUnitsPanelProps): React.JSX.Element {
    const { mode } = props;
    const idBase = React.useId();
    const [tab, setTab] = React.useState<Tab>("list");
    const [rows, setRows] = React.useState<IMordelListRow[] | null>(null);
    const [listError, setListError] = React.useState(false);
    const [term, setTerm] = React.useState("");
    const [busy, setBusy] = React.useState<string | null>(null);
    const [status, setStatus] = React.useState<IStatus | null>(null);
    const [mine, setMine] = React.useState<IMordelListRow[] | null>(null);
    const [mineNote, setMineNote] = React.useState<string | null>(null);
    const [link, setLink] = React.useState("");
    // False once the panel is closed: a pull that finishes later must not add the unit or set state.
    const mounted = React.useRef(true);
    const tabRefs = React.useRef<Record<Tab, HTMLButtonElement | null>>({ list: null, mine: null });

    React.useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    // The types this page can take.
    const types = React.useMemo<MordelType[]>(() => {
        if (mode === "alpha-strike") return ["bm", "im", "cv", "pm"];
        const list: MordelType[] = [];
        if (props.onAddMech) list.push("bm", "im");
        if (mode === "classic" && props.onAddVehicle) list.push("cv");
        if (mode === "classic" && props.onAddProtoMech) list.push("pm");
        return list;
    }, [mode, props.onAddMech, props.onAddVehicle, props.onAddProtoMech]);

    // The list, then once a day (with a key) the units changed on mordel.net since, quietly.
    React.useEffect(() => {
        let live = true;
        const load = () => loadMordelList().then((list) => { if (live) setRows(list); });
        load()
            .then(() => {
                if (!live || !getMordelKey() || !mordelTopUpDue()) return;
                return topUpMordelList().then(() => (live ? load() : undefined)).catch(() => undefined);
            })
            .catch(() => { if (live) setListError(true); });
        return () => { live = false; };
    }, []);

    const results = React.useMemo(() => {
        const search = term.trim().toLowerCase();
        if (!rows || search.length < 3) return [];
        return rows.filter((row) => types.includes(row.unit_type_short)
            && (mode !== "alpha-strike" || !!row.alpha_strike)
            && (row.name.toLowerCase().includes(search) || (row.designer ?? "").toLowerCase().includes(search)));
    }, [rows, term, types, mode]);

    const showError = (error: unknown, name: string): void => {
        if (error instanceof MordelKeyError) {
            setStatus({ tone: "danger", text: error.message, settingsLink: true });
        } else if (error instanceof MordelUnavailableError) {
            setStatus({ tone: "danger", text: error.message });
        } else {
            setStatus({ tone: "danger", text: `${name} could not be built: ${(error as Error)?.message ?? error}` });
        }
    };

    /** Builds the unit from its detail and hands it to the page. */
    const addDetail = (detail: IMordelDetail): void => {
        const name = unitName(detail);
        if (mode === "alpha-strike") {
            const record = mordelToASMULUnit(detail);
            if (!record) { setStatus({ tone: "warning", text: `${name} has no Alpha Strike card on mordel.net.` }); return; }
            const unit = new AlphaStrikeUnit();
            unit.importMUL(record);
            props.onAddAS?.(unit);
            setStatus({ tone: "success", text: `${name} added.` });
            return;
        }
        const type = detail.unit_type_short;
        if (!types.includes(type)) {
            setStatus({ tone: "warning", text: `${name} is a ${TYPE_LABELS[type] ?? type}, which this page does not take.` });
            return;
        }
        let built: { ok: boolean; ourBV: number; issues: string[]; cautions: string[]; add: () => void } | null = null;
        if (type === "bm" || type === "im") {
            const result = importMordelMech(detail);
            if (result.mech) {
                built = {
                    ok: result.bvOk, ourBV: result.ourBV, issues: result.issues, cautions: result.cautions ?? [],
                    add: () => props.onAddMech?.(result.mech!),
                };
            }
        } else {
            const result = importMordelBlk(detail);
            if (result.unit) {
                const unit = result.unit;
                built = {
                    ok: result.bvOk, ourBV: result.ourBV, issues: result.issues, cautions: [],
                    add: () => (type === "cv" ? props.onAddVehicle?.(unit as Vehicle) : props.onAddProtoMech?.(unit as ProtoMech)),
                };
            }
        }
        if (!built) { setStatus({ tone: "danger", text: `${name} could not be built from its mordel.net detail.` }); return; }
        built.add();
        if (built.ok) {
            setStatus({ tone: "success", text: `${name} added.`, cautions: built.cautions });
        } else {
            const theirs = detail.battle_value ?? "none given";
            setStatus({
                tone: "warning",
                text: `${name} added, but check it: our Battle Value is ${built.ourBV} and mordel.net's is ${theirs}.`,
                details: built.issues,
                cautions: built.cautions,
            });
        }
    };

    /** Adds a row: an Alpha Strike card straight from the list, anything else from its detail. */
    const addRow = async (row: IMordelListRow): Promise<void> => {
        const name = unitName(row);
        setStatus(null);
        if (mode === "alpha-strike" && row.alpha_strike) { addDetail(row as IMordelDetail); return; }
        if (!getMordelKey()) {
            setStatus({ tone: "info", text: `Pulling ${name} from mordel.net needs your own mordel.net API key.`, settingsLink: true });
            return;
        }
        setBusy(mordelKeyOf(row));
        try {
            const detail = await fetchMordelDetail(row.unit_type_short, row.id, row.updated ?? row.created ?? null);
            if (!mounted.current) return;
            if (!detail) {
                hideMordelUnit(mordelKeyOf(row));
                setRows((list) => list?.filter((entry) => mordelKeyOf(entry) !== mordelKeyOf(row)) ?? list);
                setMine((list) => list?.filter((entry) => mordelKeyOf(entry) !== mordelKeyOf(row)) ?? list);
                setStatus({ tone: "warning", text: `mordel.net no longer has ${name}, or your key may not see it. It is hidden from this list.` });
                return;
            }
            addDetail(detail);
        } catch (error) {
            if (mounted.current) showError(error, name);
        } finally {
            if (mounted.current) setBusy(null);
        }
    };

    const loadMine = async (): Promise<void> => {
        setStatus(null);
        if (!getMordelKey()) {
            setStatus({ tone: "info", text: "Your own designs come from mordel.net with your own API key.", settingsLink: true });
            return;
        }
        setBusy("mine");
        try {
            const list = await fetchMyMordelUnits();
            if (!mounted.current) return;
            setMine(list.filter((row) => types.includes(row.unit_type_short)));
            setMineNote(list.length ? null : "mordel.net lists no designs under this key. Paste a link to one below instead.");
        } catch (error) {
            if (mounted.current) showError(error, "Your designs");
        } finally {
            if (mounted.current) setBusy(null);
        }
    };

    const addLink = async (): Promise<void> => {
        const ref = parseMordelUnitRef(link);
        if (!ref) { setStatus({ tone: "warning", text: "That is not a mordel.net unit link, or a type and id such as bm/23454." }); return; }
        await addRow({ unit_type_short: ref.type, id: ref.id, name: `${ref.type}/${ref.id}`, updated: null } as IMordelListRow);
    };

    const verb = mode === "designer" ? "Load" : "Add";

    const table = (list: IMordelListRow[]) => (
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr>
                        <th>Name</th><th>Type</th><th className="text-center">Tons</th><th className="text-center">BV</th><th>Designer</th>
                        <th><span className="visually-hidden">Action</span></th>
                    </tr>
                </thead>
                <tbody>
                    {list.slice(0, MAX_RESULTS).map((row) => (
                        <tr key={mordelKeyOf(row)}>
                            <td>{unitName(row)}</td>
                            <td>{TYPE_LABELS[row.unit_type_short] ?? row.unit_type}</td>
                            <td className="text-center">{row.tons}</td>
                            <td className="text-center">{row.battle_value ?? "-"}</td>
                            <td>{row.canon ? "Canon" : row.designer ?? ""}{row.privacy && row.privacy !== "public" ? ` (${row.privacy === "private" ? "private" : "semi-private"})` : ""}</td>
                            <td className="text-right">
                                <button type="button" className="btn btn-primary btn-sm no-right-margin" disabled={busy !== null}
                                    aria-label={`${verb} ${unitName(row)}`} onClick={() => void addRow(row)}>
                                    {busy === mordelKeyOf(row) ? "Pulling..." : verb}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {list.length > MAX_RESULTS ? <p className="small">Showing {MAX_RESULTS} of {list.length}: narrow the search to see the rest.</p> : null}
        </div>
    );

    const tabId = (id: Tab) => `${idBase}-tab-${id}`;
    const panelId = `${idBase}-panel`;
    const onTabKey = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const index = TABS.findIndex((entry) => entry.id === tab);
        const next = event.key === "Home" ? 0
            : event.key === "End" ? TABS.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
        setTab(TABS[next].id);
        tabRefs.current[TABS[next].id]?.focus();
    };

    const statusBody = status ? (
        <div className={`alert alert-${status.tone}`}>
            {status.text}
            {status.settingsLink ? (
                <> <a href={SETTINGS_PATH} target="_blank" rel="noopener noreferrer">
                    Open Settings<span className="visually-hidden"> (opens in a new tab)</span>
                </a></>
            ) : null}
            {status.details?.length ? <ul className="small">{status.details.map((line, index) => <li key={index}>{line}</li>)}</ul> : null}
            {status.cautions?.length ? status.cautions.map((line, index) => <p key={index} className="small mb-0">{line}</p>) : null}
        </div>
    ) : null;

    const listBody = listError ? <div className="alert alert-danger">The mordel.net list could not be loaded.</div>
        : rows === null ? <p>Loading the mordel.net list...</p>
        : rows.length === 0 && !mordelListShipped() ? (
            <p>
                This build does not ship the mordel.net list. With your own mordel.net API key saved in Settings, the
                units changed on mordel.net lately are pulled in; any unit can also be pulled by its link under My Mordel designs.
            </p>
        )
        : term.trim().length < 3 ? <p className="small">Type at least three letters.</p>
        : results.length === 0 ? <p>No mordel.net units match.</p>
        : table(results);

    return (
        <div className="mordel-units-panel">
            <p className="small">
                Units designed on <a href="https://mordel.net" target="_blank" rel="noopener noreferrer">the mordel.net unit builder</a>.
                {mode === "alpha-strike" ? " Alpha Strike cards come with the list." : " Each unit is pulled with your own mordel.net API key."}
            </p>
            <div className="btn-group" role="tablist" aria-label="mordel.net units">
                {TABS.map((entry) => (
                    <button key={entry.id} type="button" role="tab" id={tabId(entry.id)} aria-selected={tab === entry.id}
                        aria-controls={panelId} tabIndex={tab === entry.id ? 0 : -1}
                        ref={(element) => { tabRefs.current[entry.id] = element; }}
                        className={`btn btn-sm ${tab === entry.id ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setTab(entry.id)} onKeyDown={onTabKey}>
                        {entry.label}
                    </button>
                ))}
            </div>

            {/* Both live regions are always there, so a message that appears is read out. */}
            <div role="alert">{status?.tone === "danger" ? statusBody : null}</div>
            <div role="status">{status && status.tone !== "danger" ? statusBody : null}</div>

            <div role="tabpanel" id={panelId} aria-labelledby={tabId(tab)}>
                {tab === "list" ? (
                    <>
                        <label className="width-100">
                            Search mordel.net units
                            <input type="search" className="form-control" value={term} placeholder="Name, model or designer"
                                onChange={(event) => setTerm(event.target.value)} />
                        </label>
                        {listBody}
                    </>
                ) : (
                    <>
                        <p>
                            <button type="button" className="btn btn-primary btn-sm" disabled={busy !== null} onClick={() => void loadMine()}>
                                {busy === "mine" ? "Loading..." : mine ? "Reload my designs" : "Load my designs"}
                            </button>
                        </p>
                        {mineNote ? <p className="small">{mineNote}</p> : null}
                        {mine && mine.length ? table(mine) : mine && !mineNote ? <p>No designs of a type this page takes.</p> : null}
                        <label className="width-100">
                            A mordel.net unit link, or a type and id (bm/23454)
                            <input type="text" className="form-control" value={link} onChange={(event) => setLink(event.target.value)} />
                        </label>
                        <button type="button" className="btn btn-primary btn-sm" disabled={busy !== null || !link.trim()} onClick={() => void addLink()}>
                            {mode === "designer" ? "Load this unit" : "Add this unit"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
