import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import {
    acesBehaviorIds,
    acesIconTokens,
    acesLines,
    acesMoveTypes,
    formatAcesCommandOrderLine,
    formatAcesDeckOrderLine,
    formatAcesObjectiveLine,
    formatAcesPriorityLine,
    formatAcesScenarioUnitLine,
    formatAcesSpecialRuleLine,
    formatAcesWaypointLine,
    formatAcesZone,
    IAcesBehaviorColumn,
    IAcesCard,
    IAcesCardLibrary,
    IAcesCommandCard,
    IAcesScenario,
    IAcesSpecialOrder,
    mergeAcesCardLibrary,
    newAcesBehaviorColumn,
    newAcesCard,
    newAcesCommandCard,
    newAcesScenario,
    newAcesSpecialOrder,
    normalizeAcesCard,
    normalizeAcesCardLibrary,
    normalizeAcesCommandCard,
    normalizeAcesScenario,
    normalizeAcesSpecialOrder,
    parseAcesCommandOrderLine,
    parseAcesDeckOrderLine,
    parseAcesObjectiveLine,
    parseAcesOverheatLine,
    parseAcesPriorityLine,
    parseAcesScenarioUnitLine,
    parseAcesSpecialRuleLine,
    parseAcesStrategyLine,
    parseAcesWaypointLine,
    parseAcesZone,
    TAcesSpecialOrderKind,
    validateAcesCard,
    validateAcesCommandCard,
    validateAcesScenario,
} from '../../../../data/aces-cards';
import { getAcesSampleLibrary } from '../../../../data/aces-card-samples';
import { acesDecks, ACES_BOOK, ACES_SS_BOOK } from '../../../../data/aces-rules';
import { acesBehaviorLabel } from '../../../../classes/aces-engine';
import { getAcesCardLibrary, saveAcesCardLibrary } from '../../../../dataSaves';
import { acesCardScanOptions, applyAcesScanToCard, scanAcesCard, TAcesScanSide } from '../../../../classes/aces-card-scan';
import { generateUUID } from '../../../../utils/generateUUID';
import { AcesCardView, AcesCommandCardView, AcesScenarioView, AcesSpecialOrderView } from './_aces-card-view';
import './aces.scss';

/*
 * The players' own Aces cards, Command cards, Special Orders and sorties. Lists are typed one line per rule, with
 * icons written as bracket tokens; the card reader and the sortie loader read what is saved here.
 */

type TLibraryKind = "cards" | "commandCards" | "specialOrders" | "scenarios";
type TDraft = IAcesCard | IAcesCommandCard | IAcesSpecialOrder | IAcesScenario;

const kindLabels: { [kind in TLibraryKind]: string } = {
    cards: "Aces cards",
    commandCards: "Command cards",
    specialOrders: "Special Orders",
    scenarios: "Sorties",
};

const specialOrderKinds: { id: TAcesSpecialOrderKind, label: string }[] = [
    { id: "forced-withdrawal", label: "Forced Withdrawal" },
    { id: "fleeing", label: "Fleeing" },
    { id: "movement-objective", label: "Movement Objective" },
    { id: "destroy-objective", label: "Destroy Objective" },
    { id: "indirect-attacks", label: "Indirect Attacks" },
    { id: "other", label: "Other" },
];

type TPath = ( string | number )[];

const getPath = ( target: unknown, path: TPath ): unknown => {
    let rv: unknown = target;
    for( const key of path ) {
        if( rv === null || rv === undefined ) return undefined;
        rv = ( rv as Record<string | number, unknown> )[key];
    }
    return rv;
}

const setPath = ( target: unknown, path: TPath, value: unknown ) => {
    let parent = target as Record<string | number, unknown>;
    for( const key of path.slice( 0, -1 ) ) {
        parent = parent[key] as Record<string | number, unknown>;
    }
    parent[path[path.length - 1]] = value;
}

const copy = <T,>( value: T ): T => JSON.parse( JSON.stringify( value ) );

const validate = ( kind: TLibraryKind, record: TDraft ): string[] => {
    if( kind === "cards" ) return validateAcesCard( record as IAcesCard );
    if( kind === "commandCards" ) return validateAcesCommandCard( record as IAcesCommandCard );
    if( kind === "scenarios" ) return validateAcesScenario( record as IAcesScenario );
    return ( record as IAcesSpecialOrder ).name.trim() ? [] : [ "Name is missing." ];
}

const normalize = ( kind: TLibraryKind, value: unknown ): TDraft | null => {
    if( kind === "cards" ) return normalizeAcesCard( value );
    if( kind === "commandCards" ) return normalizeAcesCommandCard( value );
    if( kind === "scenarios" ) return normalizeAcesScenario( value );
    return normalizeAcesSpecialOrder( value );
}

const summary = ( kind: TLibraryKind, record: TDraft ): string => {
    if( kind === "cards" ) {
        const card = record as IAcesCard;
        return ( card.deck || "?" ) + " " + ( card.movePriority === null ? "---" : String( card.movePriority ).padStart( 3, "0" ) ) + ( card.cardNumber ? " (" + card.cardNumber + ")" : "" );
    }
    if( kind === "commandCards" ) {
        const card = record as IAcesCommandCard;
        return ( card.deck || "?" ) + ( card.faction ? ", " + card.faction : "" ) + " - " + card.letter;
    }
    if( kind === "scenarios" ) {
        const scenario = record as IAcesScenario;
        return ( scenario.code ? scenario.code + " - " : "" ) + ( scenario.name || "?" ) + ( scenario.campaign ? " (" + scenario.campaign + ")" : "" );
    }
    const order = record as IAcesSpecialOrder;
    return order.name || "?";
}

export default class AcesLibraryPage extends React.Component<IAcesLibraryPageProps, IAcesLibraryPageState> {
    private fileReader: FileReader | null = null;

    constructor(props: IAcesLibraryPageProps) {
        super(props);
        this.state = {
            library: null,
            kind: "cards",
            draft: null,
            draftIsNew: false,
            buffers: {},
            json: null,
            message: "",
            scans: [],
            scanning: false,
            scanChecked: false,
        }

        this.props.appGlobals.makeDocumentTitle("Aces Card Library");
    }

    componentDidMount = async () => {
        const library = await getAcesCardLibrary( this.props.appGlobals.appSettings );
        this.setState({ library: library });
    }

    componentDidUpdate = () => {
        // The photos go with the draft they were read into.
        if( !this.state.draft && this.state.scans.length > 0 ) {
            this.state.scans.forEach( ( scan ) => URL.revokeObjectURL( scan.photo ) );
            this.setState({ scans: [], scanChecked: false });
        }
    }

    componentWillUnmount = () => {
        this.state.scans.forEach( ( scan ) => URL.revokeObjectURL( scan.photo ) );
    }

    /* ----- card photo scan ----- */

    private _scanPhoto = async ( e: React.ChangeEvent<HTMLInputElement> ) => {
        const input = e.currentTarget;
        const file = input.files && input.files[0];
        if( !file || !this.state.draft ) return;
        const photo = URL.createObjectURL( file );
        this.setState({ scanning: true });
        let scan: IAcesCardScan;
        try {
            // Loaded on demand, with tesseract, so the library page stays small for everyone else.
            const { scanCardPhoto } = await import( '../../../../classes/card-scan-browser' );
            const result = await scanCardPhoto( file, scanAcesCard, acesCardScanOptions );
            scan = { photo: photo, side: result.side, warnings: result.warnings };
            if( result.side && this.state.draft ) {
                this.setState({ draft: applyAcesScanToCard( this.state.draft as IAcesCard, result ), buffers: {}, json: null });
            }
        } catch( err ) {
            scan = { photo: photo, side: null, warnings: [ "The photo couldn't be read (" + ( err instanceof Error ? err.message : String( err ) ) + "). The text reader downloads its English data the first time, so it needs a connection once." ] };
        }
        input.value = "";
        if( !this.state.draft ) {
            URL.revokeObjectURL( photo );
            this.setState({ scanning: false });
            return;
        }
        this.setState({ scans: [ ...this.state.scans, scan ], scanning: false, scanChecked: false });
    }

    private _renderScan = (): JSX.Element => {
        return (
            <fieldset className="fieldset aces-scan">
                <legend>Read a card from a photo</legend>
                <p className="aces-muted">
                    Photograph one side of the card straight on, filling the frame, and the text is read into the form
                    below for you to check. Do each side separately. The photo stays on your device.
                </p>
                <p className="aces-muted aces-scan-note">
                    <strong>The card reader isn't perfect.</strong> It misreads some words, numbers and icons. Check every line of the form against your card before you save it.
                </p>
                <label>
                    Photo of the Movement or Combat side:{" "}
                    <input type="file" accept="image/*" disabled={this.state.scanning} style={{ width: "auto" }} onChange={this._scanPhoto} />
                </label>
                {this.state.scanning ? <p><strong>Reading the card...</strong> This takes a little while, longer the first time.</p> : null}
                {this.state.scans.map( ( scan, index ) => (
                    <div key={index} className="aces-scan-result">
                        <p>
                            <strong>{scan.side === "movement" ? "Movement side" : scan.side === "combat" ? "Combat side" : "Not read"}</strong>
                            {scan.side ? ": filled in below. Check every line against the photo; OCR gets some words and icons wrong, and [?] marks an icon it couldn't place." : null}
                        </p>
                        {scan.warnings.length > 0 ? <ul className="aces-issue-error">{scan.warnings.map( ( warning, warningIndex ) => <li key={warningIndex}>{warning}</li> )}</ul> : null}
                        <a href={scan.photo} target="_blank" rel="noopener noreferrer"><img className="aces-scan-photo" src={scan.photo} alt={"Your photo of the card's " + ( scan.side || "" ) + " side"} /></a>
                    </div>
                ) )}
                {this.state.scans.some( ( scan ) => scan.side ) ? (
                    <label className="aces-check">
                        <input type="checkbox" checked={this.state.scanChecked} onChange={( e ) => this.setState({ scanChecked: e.currentTarget.checked })} />
                        {" "}I've checked the form against my photos
                    </label>
                ) : null}
            </fieldset>
        );
    }

    private _saveLibrary = ( library: IAcesCardLibrary, message: string = "" ) => {
        saveAcesCardLibrary( this.props.appGlobals.appSettings, library );
        this.setState({ library: library, message: message });
    }

    private _records = ( kind: TLibraryKind ): TDraft[] => {
        return this.state.library ? this.state.library[kind] as TDraft[] : [];
    }

    /* ----- library actions ----- */

    private _loadSamples = () => {
        if( !this.state.library ) return;
        this._saveLibrary( mergeAcesCardLibrary( this.state.library, getAcesSampleLibrary() ), "Samples loaded." );
    }

    private _removeSamples = () => {
        if( !this.state.library ) return;
        const library = this.state.library;
        this._saveLibrary( {
            ...library,
            cards: library.cards.filter( ( item ) => !item.sample ),
            commandCards: library.commandCards.filter( ( item ) => !item.sample ),
            specialOrders: library.specialOrders.filter( ( item ) => !item.sample ),
            scenarios: library.scenarios.filter( ( item ) => !item.sample ),
        }, "Samples removed." );
    }

    private _exportLibrary = () => {
        if( !this.state.library ) return;
        const blob = new Blob( [ JSON.stringify( this.state.library, null, 2 ) ], { type: "application/json" } );
        const url = URL.createObjectURL( blob );
        const link = document.createElement( "a" );
        link.href = url;
        link.download = "aces-card-library.json";
        document.body.appendChild( link );
        link.click();
        document.body.removeChild( link );
        URL.revokeObjectURL( url );
    }

    private _importFile = ( e: React.FormEvent<HTMLInputElement> ) => {
        const files = e.currentTarget.files;
        if( !files || files.length === 0 ) return;
        // Each import reads with its own reader, so a second import cannot pick up the first one's file.
        const reader = new FileReader();
        this.fileReader = reader;
        reader.onloadend = () => {
            if( !this.state.library ) return;
            if( reader.error || typeof reader.result !== "string" ) {
                this.setState({ message: "That file could not be read." });
                return;
            }
            try {
                const incoming = normalizeAcesCardLibrary( JSON.parse( reader.result ) );
                const count = incoming.cards.length + incoming.commandCards.length + incoming.specialOrders.length + incoming.scenarios.length;
                if( count === 0 ) {
                    this.setState({ message: "That file holds no Aces cards, Command cards, Special Orders or sorties: nothing was imported." });
                    return;
                }
                this._saveLibrary( mergeAcesCardLibrary( this.state.library, incoming ), "Imported " + count + " records." );
            }
            catch {
                this.setState({ message: "That file isn't an Aces card library (JSON)." });
            }
        };
        reader.readAsText( files[0] );
    }

    /* ----- record actions ----- */

    private _new = () => {
        let draft: TDraft;
        switch( this.state.kind ) {
            case "commandCards": draft = newAcesCommandCard(); break;
            case "specialOrders": draft = newAcesSpecialOrder(); break;
            case "scenarios": draft = newAcesScenario(); break;
            default: draft = newAcesCard();
        }
        this.setState({ draft: draft, draftIsNew: true, buffers: {}, json: null });
    }

    private _edit = ( record: TDraft ) => {
        this.setState({ draft: copy( record ), draftIsNew: false, buffers: {}, json: null });
    }

    private _duplicate = ( record: TDraft ) => {
        const draft = copy( record );
        draft.id = generateUUID();
        draft.sample = false;
        this.setState({ draft: draft, draftIsNew: true, buffers: {}, json: null });
    }

    private _delete = ( record: TDraft ) => {
        this.props.appGlobals.openConfirmDialog(
            "Delete " + summary( this.state.kind, record ) + "?",
            "This removes it from your card library.",
            "Delete",
            "Cancel",
            () => {
                if( !this.state.library ) return;
                const library = { ...this.state.library };
                const kind = this.state.kind;
                ( library[kind] as TDraft[] ) = ( library[kind] as TDraft[] ).filter( ( item ) => item.id !== record.id );
                this._saveLibrary( library );
            },
        );
    }

    private _saveDraft = () => {
        if( !this.state.library || !this.state.draft ) return;
        const kind = this.state.kind;
        const record = normalize( kind, this.state.draft );
        if( !record ) return;
        const library = { ...this.state.library };
        const list = ( library[kind] as TDraft[] ).filter( ( item ) => item.id !== record.id );
        const index = ( library[kind] as TDraft[] ).findIndex( ( item ) => item.id === record.id );
        list.splice( index > -1 ? index : list.length, 0, record );
        ( library[kind] as TDraft[] ) = list;
        this._saveLibrary( library, "Saved " + summary( kind, record ) + "." );
        this.setState({ draft: null, buffers: {}, json: null });
    }

    private _applyJSON = () => {
        if( this.state.json === null ) return;
        try {
            const record = normalize( this.state.kind, JSON.parse( this.state.json ) );
            if( !record ) {
                this.setState({ message: "That JSON isn't a " + kindLabels[this.state.kind] + " record." });
                return;
            }
            this.setState({ draft: record, buffers: {}, json: null, message: "" });
        }
        catch( error ) {
            this.setState({ message: "JSON error: " + String( error ) });
        }
    }

    /* ----- form fields ----- */

    private _change = ( path: TPath, value: unknown ) => {
        if( !this.state.draft ) return;
        const draft = this.state.draft;
        setPath( draft, path, value );
        this.setState({ draft: draft });
    }

    private _text = ( label: string, path: TPath, placeholder: string = "" ): JSX.Element => {
        const value = getPath( this.state.draft, path );
        return (
            <label className="aces-field">{label}
                <input type="text" value={typeof value === "string" ? value : ""} placeholder={placeholder} onChange={( e ) => this._change( path, e.currentTarget.value )} />
            </label>
        );
    }

    private _number = ( label: string, path: TPath ): JSX.Element => {
        const value = getPath( this.state.draft, path );
        return (
            <label className="aces-field">{label}
                <input type="number" className="aces-number" value={typeof value === "number" ? value : ""} onChange={( e ) => {
                    const raw = e.currentTarget.value;
                    this._change( path, raw.trim() === "" || isNaN( +raw ) ? null : +raw );
                }} />
            </label>
        );
    }

    private _check = ( label: string, path: TPath ): JSX.Element => {
        return (
            <label className="aces-check">
                <input type="checkbox" checked={getPath( this.state.draft, path ) === true} onChange={( e ) => this._change( path, e.currentTarget.checked )} /> {label}
            </label>
        );
    }

    private _select = ( label: string, path: TPath, options: { id: string, label: string }[], nullable: boolean = false ): JSX.Element => {
        const value = getPath( this.state.draft, path );
        return (
            <label className="aces-field">{label}
                <select value={value === null || value === undefined ? "" : String( value )} onChange={( e ) => this._change( path, nullable && e.currentTarget.value === "" ? null : e.currentTarget.value )}>
                    {options.map( ( option ) => <option key={option.id} value={option.id}>{option.label}</option> )}
                </select>
            </label>
        );
    }

    /**
     * A text area typed one line per entry. What the players type is kept as they typed it; each change is read
     * into the record right away so the preview stays current.
     */
    private _lines = <T,>( label: string, path: TPath, parse: ( line: string ) => T | null, format: ( item: T ) => string, help: string = "" ): JSX.Element => {
        const key = path.join( "." );
        const items = ( getPath( this.state.draft, path ) || [] ) as T[];
        const text = key in this.state.buffers ? this.state.buffers[key] : items.map( format ).join( "\n" );
        const lines = acesLines( text );
        const unread = lines.filter( ( line ) => parse( line ) === null );
        return (
            <label className="aces-field aces-field-wide">{label}
                <textarea
                    rows={Math.max( 2, Math.min( 10, lines.length + 1 ) )}
                    value={text}
                    onChange={( e ) => {
                        const value = e.currentTarget.value;
                        const parsed = acesLines( value ).map( parse ).filter( ( item ) => item !== null ) as T[];
                        setPath( this.state.draft, path, parsed );
                        this.setState({ buffers: { ...this.state.buffers, [key]: value }, draft: this.state.draft });
                    }}
                />
                {help ? <span className="aces-muted">{help}</span> : null}
                {unread.length > 0 ? <span className="aces-issue-error">Not understood: {unread.join( " / " )}</span> : null}
            </label>
        );
    }

    private _zone = ( label: string, ringsPath: TPath, keywordPath: TPath | null ): JSX.Element => {
        const key = ringsPath.join( "." );
        const rings = ( getPath( this.state.draft, ringsPath ) || [] ) as number[];
        const keyword = ( keywordPath ? getPath( this.state.draft, keywordPath ) : "" ) as "" | "nearest" | "any";
        const text = key in this.state.buffers ? this.state.buffers[key] : formatAcesZone( rings, keyword );
        return (
            <label className="aces-field">{label}
                <input type="text" value={text} placeholder={keywordPath ? "12 18 24, nearest or any" : "24"} onChange={( e ) => {
                    const value = e.currentTarget.value;
                    const zone = parseAcesZone( value );
                    setPath( this.state.draft, ringsPath, zone.zoneRings );
                    if( keywordPath ) setPath( this.state.draft, keywordPath, zone.zoneKeyword );
                    this.setState({ buffers: { ...this.state.buffers, [key]: value }, draft: this.state.draft });
                }} />
            </label>
        );
    }

    private _source = (): JSX.Element => {
        const draft = this.state.draft!;
        return (
            <div className="aces-inline">
                <label className="aces-field">Source book
                    <select value={draft.source ? draft.source.book : ""} onChange={( e ) => {
                        const book = e.currentTarget.value;
                        this._change( [ "source" ], book ? { book: book, page: draft.source ? draft.source.page : 0 } : null );
                    }}>
                        <option value="">Your own card</option>
                        <option value={ACES_BOOK}>{ACES_BOOK}</option>
                        <option value={ACES_SS_BOOK}>{ACES_SS_BOOK}</option>
                    </select>
                </label>
                {draft.source ? this._number( "Page", [ "source", "page" ] ) : null}
            </div>
        );
    }

    private _columnEditor = ( title: string, path: TPath ): JSX.Element => {
        const column = getPath( this.state.draft, path ) as IAcesBehaviorColumn;
        const moveOptions = acesMoveTypes.map( ( id ) => ( { id: id, label: id.charAt( 0 ).toUpperCase() + id.slice( 1 ) } ) );
        return (
            <fieldset className="fieldset" key={path.join( "." )}>
                <legend>{title}</legend>
                {this._text( "Condition", [ ...path, "condition" ], "If there are any [moved] enemies in 18\"" )}
                {/* Rows as the cards print them: zone, target, movement, then the movement filters. */}
                <div className="aces-inline">
                    {this._zone( "Zone", [ ...path, "zoneRings" ], [ ...path, "zoneKeyword" ] )}
                </div>
                <div className="aces-inline">
                    {this._check( "⌖ only targets in attack range", [ ...path, "targetInAttackRange" ] )}
                    {this._check( "👁 only targets in line of sight", [ ...path, "targetInLOS" ] )}
                    {this._check( "⊘ only targets out of line of sight", [ ...path, "targetNoLOS" ] )}
                    {this._check( "✔ only targets that moved", [ ...path, "targetMoved" ] )}
                    {this._select( "Then pick", [ ...path, "targetSelect" ], [
                        { id: "", label: "-" }, { id: "nearest", label: "Nearest" },
                        { id: "red", label: "Red list" }, { id: "yellow", label: "Yellow list" }, { id: "blue", label: "Blue list" },
                    ] )}
                </div>
                <div className="aces-inline">
                    {this._select( "Movement", [ ...path, "moveType" ], moveOptions )}
                    {this._select( "Alternative", [ ...path, "altMoveType" ], [ { id: "", label: "None" }, ...moveOptions ], true )}
                    {column.altMoveType ? this._text( "Alternative when", [ ...path, "altMoveWhen" ], "if needed" ) : null}
                </div>
                {this._lines( "Movement filters, best first", [ ...path, "filters" ], ( line ) => line, ( line ) => line )}
            </fieldset>
        );
    }

    private _renderCardForm = (): JSX.Element => {
        const deckOptions = [ { id: "", label: "Not listed" }, ...acesDecks.map( ( deck ) => ( { id: deck.id, label: deck.name } ) ) ];
        return (
            <>
                <div className="aces-inline">
                    {this._text( "Deck name", [ "deck" ], "Brawler" )}
                    {this._select( "Deck type", [ "deckId" ], deckOptions )}
                    {this._text( "Card", [ "cardNumber" ], "4/6" )}
                    {this._number( "Movement priority", [ "movePriority" ] )}
                    {this._number( "Combat priority", [ "combatPriority" ] )}
                </div>
                {acesBehaviorIds.map( ( behavior ) => this._columnEditor( acesBehaviorLabel( behavior ), [ behavior ] ) )}
                <fieldset className="fieldset">
                    <legend>Combat</legend>
                    {this._zone( "Zone", [ "combat", "zoneRings" ], [ "combat", "zoneKeyword" ] )}
                    {this._lines( "Target filters, in order", [ "combat", "filters" ], parseAcesPriorityLine, formatAcesPriorityLine,
                        "\"[lowest] Armor\" ranks by a stat, \"[yellow] list\" uses the Command card, anything else you judge at the table. Start a line with ? if you can't read it." )}
                    {this._check( "If there are no enemies in line of sight: use the Indirect Fire special order card", [ "combat", "indirectIfNoLOS" ] )}
                    {this._lines( "Overheat rows, top first", [ "combat", "overheat" ], parseAcesOverheatLine, ( row ) => row.text,
                        "Type them as printed, e.g. \"If TN6 or less and OV might let unit hit target's structure: Use up to 3 OV.\"" )}
                </fieldset>
            </>
        );
    }

    private _renderCommandCardForm = (): JSX.Element => {
        return (
            <>
                <div className="aces-inline">
                    {this._text( "Command deck", [ "deck" ], "Star Captain" )}
                    {this._text( "Faction", [ "faction" ], "Clan Jade Falcon" )}
                    {this._text( "Letter", [ "letter" ], "A" )}
                    {this._text( "Card", [ "cardNumber" ], "2/10" )}
                </div>
                {this._lines( "Orders", [ "orders" ], parseAcesCommandOrderLine, formatAcesCommandOrderLine,
                    "One line per order: phase | printed text | behavior or movement filter (optional), e.g. \"movement | ... add the following movement filter | 0. cover vs [highest] enemies\". A line with no phase applies to every phase; enter a multi-part order as one line per part. Move First / Move Last orders are recognized, with their ranking in parentheses." )}
                <div className="aces-inline aces-top">
                    {this._lines( "Red list", [ "red" ], parseAcesPriorityLine, formatAcesPriorityLine )}
                    {this._lines( "Yellow list", [ "yellow" ], parseAcesPriorityLine, formatAcesPriorityLine )}
                    {this._lines( "Blue list", [ "blue" ], parseAcesPriorityLine, formatAcesPriorityLine )}
                </div>
                <fieldset className="fieldset">
                    <legend>Support (back of the card)</legend>
                    {this._text( "Support orders", [ "supportOrders" ] )}
                    {this._zone( "Emplacement Zone", [ "emplacementZoneRings" ], null )}
                    <div className="aces-inline aces-top">
                        {this._lines( "Emplacements", [ "emplacements" ], parseAcesPriorityLine, formatAcesPriorityLine )}
                        {this._lines( "Artillery", [ "artillery" ], parseAcesPriorityLine, formatAcesPriorityLine )}
                        {this._lines( "Battlefield Support", [ "bsp" ], parseAcesPriorityLine, formatAcesPriorityLine )}
                    </div>
                    {this._lines( "Strategy decisions", [ "strategy" ], parseAcesStrategyLine, ( row ) => row.auto === "maintain" ? row.text : row.letter + " | " + row.text,
                        "letter | condition, top row first. The app answers \"objective is complete\" and \"no armor\" rows itself. A card with no decisions: type \"Maintain this strategy\"." )}
                </fieldset>
            </>
        );
    }

    private _renderSpecialOrderForm = (): JSX.Element => {
        const draft = this.state.draft as IAcesSpecialOrder;
        return (
            <>
                <div className="aces-inline">
                    {this._select( "Kind", [ "kind" ], specialOrderKinds )}
                    {this._text( "Name", [ "name" ] )}
                    {this._text( "Card", [ "cardNumber" ], "1/5" )}
                    {this._number( "Priority", [ "priority" ] )}
                    {this._check( "Priority is a modifier (e.g. -500)", [ "priorityIsModifier" ] )}
                </div>
                {this._lines( "Rules", [ "rules" ], ( line ) => line, ( line ) => line )}
                <label className="aces-check">
                    <input type="checkbox" checked={draft.column !== null} onChange={( e ) => this._change( [ "column" ], e.currentTarget.checked ? newAcesBehaviorColumn() : null )} />
                    {" "}Replaces the behavior columns (Forced Withdrawal, Fleeing)
                </label>
                {draft.column ? this._columnEditor( "Column", [ "column" ] ) : null}
                {this._lines( "Filters applied first (0a, 0b ...)", [ "preFilters" ], ( line ) => line, ( line ) => line )}
                {this._lines( "Spotter list", [ "spotter" ], ( line ) => line, ( line ) => line )}
            </>
        );
    }

    private _renderScenarioForm = (): JSX.Element => {
        return (
            <>
                <div className="aces-inline">
                    {this._text( "Code", [ "code" ], "00" )}
                    {this._text( "Name", [ "name" ] )}
                    {this._text( "Campaign", [ "campaign" ] )}
                    {this._text( "Play area", [ "playArea" ] )}
                    {this._number( "Turns", [ "turnLimit" ] )}
                </div>
                <fieldset className="fieldset">
                    <legend>Player force</legend>
                    {this._number( "PV limit", [ "playerPVLimit" ] )}
                    {this._lines( "Units", [ "playerUnits" ], parseAcesScenarioUnitLine, formatAcesScenarioUnitLine, "name | skill" )}
                    {this._text( "Note", [ "playerUnitsNote" ] )}
                </fieldset>
                <fieldset className="fieldset">
                    <legend>Opposing force</legend>
                    <div className="aces-inline">
                        {this._text( "Name", [ "opposingName" ] )}
                        {this._number( "PV", [ "opposingPV" ] )}
                        {this._text( "Command deck", [ "commandDeck" ] )}
                        {this._text( "Start on card", [ "commandStartCard" ], "A" )}
                    </div>
                    {this._lines( "Units", [ "opposingUnits" ], parseAcesScenarioUnitLine, formatAcesScenarioUnitLine, "name | skill | Aces deck" )}
                    {this._lines( "Stacked decks (guided sorties)", [ "deckOrder" ], parseAcesDeckOrderLine, formatAcesDeckOrderLine, "Deck: priority, priority, ... top card first" )}
                </fieldset>
                <fieldset className="fieldset">
                    <legend>Objectives and turn track</legend>
                    {this._lines( "Objectives", [ "objectives" ], parseAcesObjectiveLine, formatAcesObjectiveLine, "primary or secondary | destroy, movement or other | text | SP" )}
                    {this._text( "Sortie end", [ "sortieEnd" ] )}
                    {this._text( "Reconnaissance", [ "reconnaissance" ] )}
                    {this._text( "Waypoint setup", [ "waypointSetup" ] )}
                    {this._lines( "Waypoints", [ "waypoints" ], parseAcesWaypointLine, formatAcesWaypointLine, "turn | token label | what happens" )}
                    {this._lines( "Special rules", [ "specialRules" ], parseAcesSpecialRuleLine, formatAcesSpecialRuleLine, "setup, initiative, movement, combat, end or any | name | text" )}
                    {this._text( "Story reference", [ "storyReference" ], "Briefing: Aces SS p.4" )}
                </fieldset>
            </>
        );
    }

    private _renderEditor = (): JSX.Element => {
        const draft = this.state.draft!;
        const kind = this.state.kind;
        const issues = validate( kind, draft );
        const unchecked = this.state.scans.some( ( scan ) => scan.side ) && !this.state.scanChecked;
        let form: JSX.Element;
        let preview: JSX.Element;
        switch( kind ) {
            case "commandCards":
                form = this._renderCommandCardForm();
                preview = <AcesCommandCardView card={draft as IAcesCommandCard} />;
                break;
            case "specialOrders":
                form = this._renderSpecialOrderForm();
                preview = <AcesSpecialOrderView order={draft as IAcesSpecialOrder} />;
                break;
            case "scenarios":
                form = this._renderScenarioForm();
                preview = <AcesScenarioView scenario={draft as IAcesScenario} />;
                break;
            default:
                form = this._renderCardForm();
                preview = <AcesCardView card={draft as IAcesCard} />;
        }
        return (
            <TextSection label={( this.state.draftIsNew ? "New " : "Edit " ) + kindLabels[kind].replace( /s$/, "" )}>
                <div className="aces-inline">
                    <button className="btn btn-primary btn-sm" disabled={unchecked} title={unchecked ? "Check the scanned card against your photo first" : undefined} onClick={this._saveDraft}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => this.setState( { draft: null, buffers: {}, json: null } )}>Cancel</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => this.setState( { json: this.state.json === null ? JSON.stringify( draft, null, 2 ) : null } )}>
                        {this.state.json === null ? "Edit as JSON" : "Back to the form"}
                    </button>
                </div>
                {issues.length > 0 ? (
                    <ul className="aces-issue-error">{issues.map( ( issue, index ) => <li key={index}>{issue}</li> )}</ul>
                ) : <p className="aces-muted">The card reader can use this record.</p>}
                {kind === "cards" && this.state.json === null ? this._renderScan() : null}
                <div className="row">
                    <div className="col-lg-7">
                        {this.state.json !== null ? (
                            <>
                                <textarea className="aces-json" rows={24} value={this.state.json} onChange={( e ) => this.setState( { json: e.currentTarget.value } )} />
                                <button className="btn btn-primary btn-sm" onClick={this._applyJSON}>Apply JSON</button>
                            </>
                        ) : (
                            <>
                                {form}
                                {this._text( "Notes", [ "notes" ] )}
                                {this._source()}
                            </>
                        )}
                    </div>
                    <div className="col-lg-5">
                        <h4>Preview</h4>
                        {preview}
                    </div>
                </div>
            </TextSection>
        );
    }

    private _renderList = (): JSX.Element => {
        const kind = this.state.kind;
        const records = this._records( kind );
        return (
            <TextSection label="Aces Card Library">
                <p>
                    Type in the cards and sorties from your own Aces box and campaign books; the Game Tracker deals
                    them to the automated units and the card reader walks each card for you. One sample of each kind,
                    from the rulebook's worked examples, is available to show how records look.
                </p>
                <div className="aces-inline">
                    <button className="btn btn-secondary btn-sm" onClick={this._loadSamples}>Load samples</button>
                    <button className="btn btn-secondary btn-sm" onClick={this._removeSamples}>Remove samples</button>
                    <button className="btn btn-secondary btn-sm" onClick={this._exportLibrary}>Export library</button>
                    <label>Import library:{" "}<input type="file" accept="application/json,.json" style={{ width: "auto" }} onChange={this._importFile} /></label>
                    <Link to={`${process.env.PUBLIC_URL}/alpha-strike/aces/print`}>Print cards</Link>
                </div>
                {this.state.message ? <p><strong>{this.state.message}</strong></p> : null}
                <div className="aces-phase-bar">
                    {( Object.keys( kindLabels ) as TLibraryKind[] ).map( ( item ) => (
                        <button key={item} className={"btn btn-sm " + ( item === kind ? "btn-primary" : "btn-secondary" )} onClick={() => this.setState( { kind: item, draft: null } )}>
                            {kindLabels[item]} ({this._records( item ).length})
                        </button>
                    ) )}
                    <button className="btn btn-primary btn-sm" onClick={this._new}>New</button>
                </div>
                {records.length > 0 ? (
                    <table className="table tighter-padding">
                        <tbody>
                            {records.map( ( record ) => {
                                const issues = validate( kind, record );
                                return (
                                    <tr key={record.id}>
                                        <td>
                                            {summary( kind, record )}
                                            {record.sample ? <span className="aces-muted"> (sample, {record.source ? record.source.book + " p." + record.source.page : ""})</span> : null}
                                            {issues.length > 0 ? <><br /><span className="aces-issue-error">{issues.join( " " )}</span></> : null}
                                        </td>
                                        <td className="text-right">
                                            <button className="btn btn-primary btn-sm" onClick={() => this._edit( record )}>Edit</button>{" "}
                                            <button className="btn btn-secondary btn-sm" onClick={() => this._duplicate( record )}>Copy</button>{" "}
                                            <button className="btn btn-danger btn-sm" onClick={() => this._delete( record )}>Delete</button>
                                        </td>
                                    </tr>
                                );
                            } )}
                        </tbody>
                    </table>
                ) : <p className="aces-muted">No {kindLabels[kind].toLowerCase()} yet.</p>}
                <details>
                    <summary>Icon tokens</summary>
                    <table className="table tighter-padding">
                        <tbody>
                            {acesIconTokens.map( ( icon ) => (
                                <tr key={icon.token}><td><code>[{icon.token}]</code></td><td>{icon.label}</td><td>{icon.meaning}</td></tr>
                            ) )}
                        </tbody>
                    </table>
                </details>
            </TextSection>
        );
    }

    render = (): JSX.Element => {
        return (
            <UIPage current="alpha-strike-aces" appGlobals={this.props.appGlobals}>
                <div className="aces-page">
                    {!this.state.library ? (
                        <TextSection label="Aces Card Library"><p>Loading...</p></TextSection>
                    ) : this.state.draft ? this._renderEditor() : this._renderList()}
                </div>
            </UIPage>
        );
    }
}

interface IAcesLibraryPageProps {
    appGlobals: IAppGlobals;
}

interface IAcesLibraryPageState {
    library: IAcesCardLibrary | null;
    kind: TLibraryKind;
    draft: TDraft | null;
    draftIsNew: boolean;
    buffers: { [path: string]: string };
    json: string | null;
    message: string;
    /** Photos read into the card being edited, shown beside the form until it's saved or dropped. */
    scans: IAcesCardScan[];
    scanning: boolean;
    /** A scanned card can't be saved until the player says they checked it against the photo. */
    scanChecked: boolean;
}

interface IAcesCardScan {
    photo: string;
    side: TAcesScanSide | null;
    warnings: string[];
}
