import React, { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { FaArrowCircleLeft, FaPrint } from "react-icons/fa";
import { Link } from 'react-router';
import {
    blankContractSheetRow, CONTRACT_SHEET_MAX_ROWS, CONTRACT_SHEET_ROW_FIELDS, CONTRACT_SHEET_ROWS,
    contractSheetRowUsed, IContractSheet, IContractSheetRow, IContractSheetTerm, newContractSheet,
} from '../../../../classes/campaign/contract-sheet';
import {
    CONTRACT_FORMS, contractFormSourceText, DEFAULT_CONTRACT_FORM_ID, findContractForm, IDocumentForm, IRecordForm,
    MALLORYS_WORLD_HEXES, MALLORYS_WORLD_OPTIONS, MALLORYS_WORLD_REPLACEMENTS, NEGOTIATION_COLUMNS, TContractForm, TFormPart,
} from '../../../../classes/campaign/contract-sheet-versions';
import { IAppGlobals } from '../../../app-router';
import { useCampaign } from './campaign-store';
import './contract-sheet.scss';

const ArrowCircleLeft = FaArrowCircleLeft as any;
const PrintIcon = FaPrint as any;

/** Typing saves after this pause (and at once on leaving the page). */
const SAVE_DELAY_MS = 400;

const ROW_LABELS: Record<keyof IContractSheetRow, string> = {
    month: "Month", event: "Event", cost: "Cost", cover: "Cover", paid: "Paid", balance: "Balance", rep: "Rep",
};

type TTermKey = "basePay" | "transportation" | "support" | "salvage" | "command";

/** "contractType" -> "Contract type", for blanks the form does not name. */
const humanize = ( id: string ): string => {
    const words = id.replace( /([a-z])([A-Z0-9])/g, "$1 $2" ).toLowerCase();
    return words.charAt( 0 ).toUpperCase() + words.slice( 1 );
};

/** One "Label: ____" field on the sheet. */
function Field( props: { label: string; value: string; onChange: ( v: string ) => void; className?: string; suffix?: string } ): JSX.Element {
    return (
        <label className={`cs-field ${props.className ?? ""}`}>
            <span className="cs-label">{props.label}</span>
            <input type="text" className="cs-line" value={props.value} onChange={( e ) => props.onChange( e.currentTarget.value )} />
            {props.suffix ? <span className="cs-suffix">{props.suffix}</span> : null}
        </label>
    );
}

/** "Label: ____ % ( __ )", or "Label: ________ ( __ )" for Command. */
function TermField( props: { label: string; value: IContractSheetTerm; percent: boolean; onChange: ( v: IContractSheetTerm ) => void; className?: string } ): JSX.Element {
    return (
        <span className={`cs-field cs-term ${props.className ?? ""}`}>
            <label className="cs-term-main">
                <span className="cs-label">{props.label}</span>
                <input type="text" className="cs-line" value={props.value.percent} aria-label={props.percent ? `${props.label} percent` : props.label}
                    onChange={( e ) => props.onChange( { ...props.value, percent: e.currentTarget.value } )} />
            </label>
            {props.percent ? <span className="cs-suffix">%</span> : null}
            <span className="cs-suffix">(</span>
            <input type="text" className="cs-line cs-roll" value={props.value.roll} aria-label={`${props.label} roll`}
                onChange={( e ) => props.onChange( { ...props.value, roll: e.currentTarget.value } )} />
            <span className="cs-suffix">)</span>
        </span>
    );
}

/** A printed check box, ticked or not. */
function Box( props: { checked: boolean; label: string; onChange: ( v: boolean ) => void; dashed?: boolean } ): JSX.Element {
    return (
        <input type="checkbox" className={`cs-box-check${props.dashed ? " cs-dashed" : ""}`} checked={props.checked} aria-label={props.label}
            onChange={( e ) => props.onChange( e.currentTarget.checked )} />
    );
}

interface IFormProps {
    sheet: IContractSheet;
    onChange: ( s: IContractSheet ) => void;
}

const footer = ( form: TContractForm ): JSX.Element => (
    <div className="cs-footer">
        Form after the {form.name.replace( / \(.*\)$/, "" )} in {contractFormSourceText( form )}. BattleTech and ’Mech are trademarks of The
        Topps Company, Inc. Filled in and printed from Jeff's BattleTech Tools.
    </div>
);

/** The Mallory's World extras (Hot Spots: Draconis Reach p.204): Loneliness Island and Replacement 'Mechs, beside the ledger. */
function MallorysWorldPanel( props: IFormProps ): JSX.Element {
    const s = props.sheet;
    const tick = ( id: string, v: boolean ) => props.onChange( { ...s, checks: setCheck( s.checks, id, v ) } );
    return (
        <div className="cs-mallory">
            <div className="cs-common-title">LONELINESS ISLAND</div>
            <div><strong>Base Pay:</strong> 900</div>
            <div className="cs-common-line">(500 SP × Scale × 60 percent)</div>
            <div className="cs-mallory-sub">Captured Hex SP:</div>
            {MALLORYS_WORLD_HEXES.map( ( hex ) => (
                <div key={hex.id} className="cs-mallory-hex">
                    <span className={hex.label ? "" : "cs-common-line"}>{hex.label ? <strong>{hex.label}</strong> : null} {hex.value}</span>
                    <span className="cs-boxes">
                        {Array.from( { length: hex.boxes }, ( _, i ) => (
                            <Box key={i} checked={!!s.checks[`${hex.id}${i + 1}`]} label={`${hex.label || hex.value} box ${i + 1}`}
                                onChange={( v ) => tick( `${hex.id}${i + 1}`, v )} />
                        ) )}
                    </span>
                </div>
            ) )}
            <div className="cs-mallory-sub">Replacement ’Mechs:</div>
            <div className="cs-boxes cs-center">
                {Array.from( { length: MALLORYS_WORLD_REPLACEMENTS }, ( _, i ) => (
                    <Box key={i} checked={!!s.checks[`replacement${i + 1}`]} label={`Replacement ’Mech ${i + 1}`} dashed={i === MALLORYS_WORLD_REPLACEMENTS - 1}
                        onChange={( v ) => tick( `replacement${i + 1}`, v )} />
                ) )}
            </div>
        </div>
    );
}

/** A record sheet: Draconis Reach, Mallory's World, Hinterlands or Mercenaries, as printed. */
function RecordSheetForm( props: IFormProps & { form: IRecordForm } ): JSX.Element {
    const { sheet: s, form } = props;
    const set = <K extends keyof IContractSheet>( key: K, value: IContractSheet[K] ) => props.onChange( { ...s, [key]: value } );
    const term = ( key: TTermKey, label: string, percent: boolean, className?: string ) =>
        <TermField label={label} value={s[key]} percent={percent} className={className} onChange={( v ) => set( key, v )} />;
    const setRow = ( index: number, field: keyof IContractSheetRow, value: string ) =>
        set( "rows", s.rows.map( ( r, i ) => ( i === index ? { ...r, [field]: value } : r ) ) );
    return (
        <div className={`contract-sheet cs-form-${form.id}`}>
            <div className="cs-header">
                <div className="cs-brand">BATTLETECH</div>
                <div className="cs-title-box">{form.title.map( ( line, i ) => <React.Fragment key={i}>{i > 0 ? <br /> : null}{line}</React.Fragment> )}</div>
            </div>
            <div className="cs-box cs-terms">
                <div className="cs-line-row">
                    <Field label="Name:" value={s.name} onChange={( v ) => set( "name", v )} className="cs-grow" />
                    <Field label="Contract:" value={s.contract} onChange={( v ) => set( "contract", v )} className="cs-grow" />
                </div>
                <div className="cs-line-row">
                    <Field label="Type of Action:" value={s.typeOfAction} onChange={( v ) => set( "typeOfAction", v )} className="cs-grow" />
                    <Field label="Scale:" value={s.scale} onChange={( v ) => set( "scale", v )} className="cs-mid" />
                    <Field label="Length:" value={s.length} onChange={( v ) => set( "length", v )} className="cs-mid" suffix="Months" />
                </div>
                <div className="cs-line-row">
                    {term( "basePay", "Base Pay:", true, "cs-grow" )}
                    {term( "transportation", "Transportation:", true, "cs-grow" )}
                    {term( "support", "Support:", true, "cs-grow" )}
                </div>
                <div className="cs-line-row">
                    {term( "salvage", "Salvage:", true, "cs-third" )}
                    {term( "command", "Command:", false, "cs-grow" )}
                </div>
                <div className="cs-line-row">
                    <Field label="Starting Warchest:" value={s.startingWarchest} onChange={( v ) => set( "startingWarchest", v )} className="cs-grow" />
                </div>
            </div>
            <div className="cs-body">
                <div className="cs-box cs-ledger">
                    <table>
                        <thead>
                            <tr>{CONTRACT_SHEET_ROW_FIELDS.map( ( f ) => <th key={f} className={`cs-col-${f}`}>{ROW_LABELS[f]}</th> )}</tr>
                        </thead>
                        <tbody>
                            {s.rows.map( ( row, index ) => (
                                <tr key={index}>
                                    {CONTRACT_SHEET_ROW_FIELDS.map( ( f ) => (
                                        <td key={f} className={`cs-col-${f}`}>
                                            <input type="text" className="cs-line" value={row[f]} aria-label={`${ROW_LABELS[f]}, line ${index + 1}`}
                                                onChange={( e ) => setRow( index, f, e.currentTarget.value )} />
                                        </td>
                                    ) )}
                                </tr>
                            ) )}
                        </tbody>
                    </table>
                </div>
                <div className="cs-common">
                    <div className="cs-common-title">COMMON COSTS/PAY</div>
                    {form.commonCosts.map( ( group ) => (
                        <div key={group.heading}>
                            <div className="cs-common-heading">{group.heading}</div>
                            {group.lines.map( ( line ) => (
                                <div key={line.label} className="cs-common-line"><strong>{line.label}</strong> {line.value}</div>
                            ) )}
                        </div>
                    ) )}
                    {form.mallorysWorld ? <MallorysWorldPanel sheet={s} onChange={props.onChange} /> : null}
                </div>
            </div>
            {form.mallorysWorld ? (
                <div className="cs-options">
                    {MALLORYS_WORLD_OPTIONS.map( ( option ) => (
                        <label key={option.id}>
                            <Box checked={!!s.checks[option.id]} label={`${option.label} ${option.text}`}
                                onChange={( v ) => props.onChange( { ...s, checks: setCheck( s.checks, option.id, v ) } )} />
                            {" "}<strong>{option.label}</strong> {option.text}
                        </label>
                    ) )}
                </div>
            ) : null}
            {footer( form )}
        </div>
    );
}

const setCheck = ( checks: Record<string, boolean>, id: string, v: boolean ): Record<string, boolean> => {
    const next = { ...checks };
    if( v ) next[id] = true;
    else delete next[id];
    return next;
};

/** A contract or worksheet: the printed text with every blank an input. */
function DocumentForm( props: IFormProps & { form: IDocumentForm } ): JSX.Element {
    const { sheet: s, form } = props;
    const setField = ( id: string, v: string ) => {
        const fields = { ...s.fields };
        if( v ) fields[id] = v;
        else delete fields[id];
        props.onChange( { ...s, fields } );
    };
    const part = ( p: TFormPart, key: number ): React.ReactNode => {
        if( typeof p === "string" ) return <React.Fragment key={key}>{p}</React.Fragment>;
        if( "c" in p ) {
            return <Box key={key} checked={!!s.checks[p.c]} label={p.label ?? humanize( p.c )}
                onChange={( v ) => props.onChange( { ...s, checks: setCheck( s.checks, p.c, v ) } )} />;
        }
        if( "area" in p ) {
            return <textarea key={key} className="cs-area" rows={p.rows} value={s.fields[p.area] ?? ""} aria-label={p.label ?? humanize( p.area )}
                onChange={( e ) => setField( p.area, e.currentTarget.value )} />;
        }
        return <input key={key} type="text" className="cs-line cs-inline" style={{ width: `${p.w ?? 12}ch` }} value={s.fields[p.f] ?? ""}
            aria-label={p.label ?? humanize( p.f )} onChange={( e ) => setField( p.f, e.currentTarget.value )} />;
    };
    return (
        <div className={`contract-sheet cs-document cs-form-${form.id}`}>
            {form.blocks.map( ( block, i ) => {
                switch( block.type ) {
                    case "title": return <div key={i} className="cs-doc-title">{block.text}</div>;
                    case "heading": return <div key={i} className="cs-doc-heading">{block.text}</div>;
                    case "page-break": return <div key={i} className="cs-page-break" />;
                    case "para": return (
                        <p key={i} className={`cs-doc-para${block.indent ? " cs-indent" : ""}`}>
                            {block.lead ? <strong className="cs-doc-lead">{block.lead}</strong> : null}
                            {block.parts.map( part )}
                        </p>
                    );
                    case "table": return (
                        <table key={i} className="cs-doc-table">
                            <thead><tr>{block.head.map( ( h ) => <th key={h}>{h}</th> )}</tr></thead>
                            <tbody>{block.rows.map( ( row, r ) => <tr key={r}>{row.map( ( cell, c ) => <td key={c}>{cell}</td> )}</tr> )}</tbody>
                        </table>
                    );
                    case "negotiation-head": return (
                        <div key={i} className="cs-neg cs-neg-head"><span />{NEGOTIATION_COLUMNS.map( ( col ) => <span key={col.key}>{col.label}</span> )}</div>
                    );
                    case "negotiation": return (
                        <div key={i} className="cs-neg">
                            <span><em>{block.label}</em>{block.note ? <><br />{block.note}</> : null}</span>
                            {NEGOTIATION_COLUMNS.map( ( col, c ) => ( block.fixed && c > 0
                                ? <span key={col.key} className="cs-neg-fixed">—</span>
                                : <input key={col.key} type="text" className="cs-line" value={s.fields[`${block.id}${col.key}`] ?? ""}
                                    aria-label={`${block.label.replace( /:$/, "" )}, ${col.label}`} title={col.label}
                                    onChange={( e ) => setField( `${block.id}${col.key}`, e.currentTarget.value )} />
                            ) )}
                        </div>
                    );
                }
                return null;
            } )}
            {footer( form )}
        </div>
    );
}

const sheetLabel = ( s: IContractSheet, index: number ): string => {
    const form = findContractForm( s.versionId );
    const named = form.kind === "record"
        ? [s.name.trim(), s.contract.trim()].filter( Boolean ).join( ": " )
        : form.labelFields.map( ( f ) => ( s.fields[f] ?? "" ).trim() ).filter( Boolean ).join( " / " );
    const short = form.name.replace( / \(.*\)$/, "" );
    return `${named || `Sheet ${index + 1}`} (${short})`;
};

/**
 * A campaign's contract sheets (#639): pick one of the books' forms, fill it in on screen, keep it with the campaign,
 * and print it on Letter paper like the book's page.
 */
export default function CampaignContractSheets( props: { appGlobals: IAppGlobals; id: string | undefined } ): JSX.Element {
    const { loaded, campaign, error, update } = useCampaign( props.appGlobals, props.id );
    const [selectedId, setSelectedId] = useState<string | null>( null );
    const [draft, setDraft] = useState<IContractSheet | null>( null );
    const [newFormId, setNewFormId] = useState( DEFAULT_CONTRACT_FORM_ID );
    const pending = useRef<IContractSheet | null>( null );
    const updateRef = useRef( update );
    useEffect( () => { updateRef.current = update; } );

    const save = useCallback( ( sheet: IContractSheet ) => updateRef.current( ( c ) => {
        c.contractSheets = c.contractSheets.some( ( s ) => s.id === sheet.id )
            ? c.contractSheets.map( ( s ) => ( s.id === sheet.id ? sheet : s ) )
            : c.contractSheets.concat( sheet );
    } ), [] );
    const flush = useCallback( () => {
        if( pending.current ) save( pending.current );
        pending.current = null;
    }, [save] );

    // Save typing after a pause, and whatever is unsaved when the page closes.
    useEffect( () => {
        if( !draft ) return;
        const timer = setTimeout( flush, SAVE_DELAY_MS );
        return () => clearTimeout( timer );
    }, [draft, flush] );
    useEffect( () => () => flush(), [flush] );

    const sheets = campaign?.contractSheets ?? [];
    const stored = sheets.find( ( s ) => s.id === selectedId ) ?? sheets[0] ?? null;
    const sheet = draft && draft.id === stored?.id ? draft : stored;

    if( !loaded ) return <main className="campaign-contract-sheets"><p>Loading...</p></main>;
    if( !campaign ) {
        return (
            <main className="campaign-contract-sheets">
                <p>{error ? `This campaign cannot be opened: ${error}.` : "No campaign with this id."} <Link to="../.." relative="path">Back to campaigns</Link></p>
            </main>
        );
    }

    const form = sheet ? findContractForm( sheet.versionId ) : null;
    const change = ( next: IContractSheet ) => {
        pending.current = next;
        setDraft( next );
    };
    const select = ( id: string ) => {
        flush();
        setDraft( null );
        setSelectedId( id );
    };
    const add = () => {
        flush();
        const next = newContractSheet( "", newFormId );
        save( next );
        setDraft( null );
        setSelectedId( next.id );
    };
    const remove = () => {
        if( !sheet ) return;
        const label = sheetLabel( sheet, sheets.findIndex( ( s ) => s.id === sheet.id ) );
        props.appGlobals.openConfirmDialog( "Delete contract sheet", `Delete '${label}'? This cannot be undone.`, "Delete", "Cancel", () => {
            pending.current = null;
            setDraft( null );
            setSelectedId( null );
            update( ( c ) => { c.contractSheets = c.contractSheets.filter( ( s ) => s.id !== sheet.id ); } );
        } );
    };
    const addLines = () => {
        if( !sheet ) return;
        const room = CONTRACT_SHEET_MAX_ROWS - sheet.rows.length;
        if( room <= 0 ) return;
        change( { ...sheet, rows: sheet.rows.concat( Array.from( { length: Math.min( CONTRACT_SHEET_ROWS, room ) }, blankContractSheetRow ) ) } );
    };
    /** Saves what was just typed, then opens the browser's print dialog; only the sheet prints. */
    const print = () => {
        flush();
        window.print();
    };
    const usedLines = sheet ? sheet.rows.filter( contractSheetRowUsed ).length : 0;
    const formOptions = CONTRACT_FORMS.map( ( f ) => <option key={f.id} value={f.id}>{f.name}</option> );

    return (
        <>
            <header className="topmenu print-bar">
                <ul className="main-menu">
                    <li><Link title="Back to the campaign" className="current" to=".." relative="path"><ArrowCircleLeft /></Link></li>
                    {sheet ? <li><span title="Open the Print Dialog" role="button" onClick={print} className="current"><PrintIcon /></span></li> : null}
                </ul>
            </header>
            <main className="campaign-contract-sheets">
                <div className="print-bar cs-controls">
                    <h1 className="h4">{campaign.name}: Contract Sheets</h1>
                    <p className="smaller-text">
                        The mercenary contract forms from the books, filled in here and saved with this campaign. Print them on Letter paper.
                    </p>
                    <p>
                        <label>
                            New sheet form{" "}
                            <select value={newFormId} onChange={( e ) => setNewFormId( e.currentTarget.value )}>{formOptions}</select>
                        </label>{" "}
                        <button type="button" className="btn btn-primary btn-sm" onClick={add}>New sheet</button>
                    </p>
                    {sheet && form ? <>
                        <p>
                            {sheets.length > 1 ? <>
                                <label>
                                    Sheet{" "}
                                    <select value={sheet.id} onChange={( e ) => select( e.currentTarget.value )}>
                                        {sheets.map( ( s, i ) => <option key={s.id} value={s.id}>{sheetLabel( s.id === sheet.id ? sheet : s, i )}</option> )}
                                    </select>
                                </label>{" "}
                            </> : null}
                            <label>
                                This sheet's form{" "}
                                <select value={form.id} onChange={( e ) => change( { ...sheet, versionId: e.currentTarget.value } )}>{formOptions}</select>
                            </label>
                        </p>
                        <p className="smaller-text">From {contractFormSourceText( form )}. Changing the form keeps what you typed; blanks the new form does not print are kept for when you switch back.</p>
                        <p>
                            <button type="button" className="btn btn-primary btn-sm" onClick={print}>Print sheet</button>{" "}
                            {form.kind === "record" ? <>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={addLines}
                                    disabled={sheet.rows.length >= CONTRACT_SHEET_MAX_ROWS}>Add {CONTRACT_SHEET_ROWS} lines</button>{" "}
                            </> : null}
                            <button type="button" className="btn btn-danger btn-sm" onClick={remove}>Delete sheet</button>{" "}
                            {form.kind === "record" ? <span className="smaller-text">{usedLines} of {sheet.rows.length} lines used.</span> : null}
                        </p>
                    </> : null}
                </div>
                {sheet && form
                    ? form.kind === "record"
                        ? <RecordSheetForm sheet={sheet} form={form} onChange={change} />
                        : <DocumentForm sheet={sheet} form={form} onChange={change} />
                    : <p className="print-bar">No contract sheets yet.</p>}
            </main>
        </>
    );
}
