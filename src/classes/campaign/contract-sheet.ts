import { generateUUID } from "../../utils/generateUUID";
import { CONTRACT_FORMS, DEFAULT_CONTRACT_FORM_ID } from "./contract-sheet-versions";

/**
 * Contract sheets (#639): the books' mercenary contract forms, filled in on screen and saved with the campaign. Each
 * sheet names its form (contract-sheet-versions.ts). Record sheets use the named fields and the ledger; contracts and
 * worksheets keep their blanks in `fields` and their boxes in `checks`. Every value is the player's own text.
 */

/** Ledger lines printed on the record sheets. More can be added on screen; print adds a page as needed. */
export const CONTRACT_SHEET_ROWS = 23;
/** Most ledger lines one sheet keeps. */
export const CONTRACT_SHEET_MAX_ROWS = 200;
/** Most characters in one field. */
export const CONTRACT_SHEET_MAX_TEXT = 500;
/** Most characters in a multi-line box. */
export const CONTRACT_SHEET_MAX_AREA = 2000;
/** Most blanks or boxes one sheet keeps. */
export const CONTRACT_SHEET_MAX_KEYS = 400;

/** A "percent (roll)" pair: Base Pay, Transportation, Support and Salvage print "____ % ( __ )". */
export interface IContractSheetTerm {
    percent: string;
    roll: string;
}

export interface IContractSheetRow {
    month: string;
    event: string;
    cost: string;
    cover: string;
    paid: string;
    balance: string;
    rep: string;
}

export interface IContractSheet {
    id: string;
    /** The form this sheet follows (contract-sheet-versions.ts). */
    versionId: string;
    name: string;
    contract: string;
    typeOfAction: string;
    scale: string;
    length: string;
    basePay: IContractSheetTerm;
    transportation: IContractSheetTerm;
    support: IContractSheetTerm;
    salvage: IContractSheetTerm;
    command: IContractSheetTerm;
    startingWarchest: string;
    rows: IContractSheetRow[];
    /** The other forms' blanks, by field id. */
    fields: Record<string, string>;
    /** Ticked boxes, by box id (only ticked ones are kept). */
    checks: Record<string, boolean>;
}

export const CONTRACT_SHEET_ROW_FIELDS: ( keyof IContractSheetRow )[] = ["month", "event", "cost", "cover", "paid", "balance", "rep"];

export const blankContractSheetRow = (): IContractSheetRow => ( { month: "", event: "", cost: "", cover: "", paid: "", balance: "", rep: "" } );

const blankTerm = (): IContractSheetTerm => ( { percent: "", roll: "" } );

export function newContractSheet( name: string = "", versionId: string = DEFAULT_CONTRACT_FORM_ID ): IContractSheet {
    return {
        id: generateUUID(),
        versionId: CONTRACT_FORMS.some( ( f ) => f.id === versionId ) ? versionId : DEFAULT_CONTRACT_FORM_ID,
        name,
        contract: "",
        typeOfAction: "",
        scale: "",
        length: "",
        basePay: blankTerm(),
        transportation: blankTerm(),
        support: blankTerm(),
        salvage: blankTerm(),
        command: blankTerm(),
        startingWarchest: "",
        rows: Array.from( { length: CONTRACT_SHEET_ROWS }, blankContractSheetRow ),
        fields: {},
        checks: {},
    };
}

/** A filled-in ledger line (any field typed). */
export const contractSheetRowUsed = ( row: IContractSheetRow ): boolean => CONTRACT_SHEET_ROW_FIELDS.some( ( f ) => row[f].trim() !== "" );

const text = ( v: unknown, max: number = CONTRACT_SHEET_MAX_TEXT ): string => ( typeof v === "string" ? v.slice( 0, max ) : "" );

const term = ( v: unknown ): IContractSheetTerm => {
    const o = v && typeof v === "object" ? v as Record<string, unknown> : {};
    return { percent: text( o.percent ), roll: text( o.roll ) };
};

const KEY = /^[A-Za-z0-9]{1,64}$/;

const pickFields = ( v: unknown ): Record<string, string> => {
    const out: Record<string, string> = {};
    if( !v || typeof v !== "object" || Array.isArray( v ) ) return out;
    for( const [k, value] of Object.entries( v as Record<string, unknown> ).slice( 0, CONTRACT_SHEET_MAX_KEYS ) ) {
        if( KEY.test( k ) && typeof value === "string" && value !== "" ) out[k] = text( value, CONTRACT_SHEET_MAX_AREA );
    }
    return out;
};

const pickChecks = ( v: unknown ): Record<string, boolean> => {
    const out: Record<string, boolean> = {};
    if( !v || typeof v !== "object" || Array.isArray( v ) ) return out;
    for( const [k, value] of Object.entries( v as Record<string, unknown> ).slice( 0, CONTRACT_SHEET_MAX_KEYS ) ) {
        if( KEY.test( k ) && value === true ) out[k] = true;
    }
    return out;
};

/** A stored sheet, cleaned: non-strings become empty, text is capped, and the ledger keeps at least the printed lines. */
export function pickContractSheet( s: Record<string, any> ): IContractSheet | null {
    if( typeof s.id !== "string" || !s.id ) return null;
    const rows: IContractSheetRow[] = ( Array.isArray( s.rows ) ? s.rows : [] )
        .slice( 0, CONTRACT_SHEET_MAX_ROWS )
        .map( ( r: unknown ) => {
            const o = r && typeof r === "object" ? r as Record<string, unknown> : {};
            const row = blankContractSheetRow();
            for( const f of CONTRACT_SHEET_ROW_FIELDS ) row[f] = text( o[f] );
            return row;
        } );
    while( rows.length < CONTRACT_SHEET_ROWS ) rows.push( blankContractSheetRow() );
    return {
        id: s.id,
        // Sheets saved before versions, or naming a form this build does not know, are the Draconis Reach sheet.
        versionId: CONTRACT_FORMS.some( ( f ) => f.id === s.versionId ) ? s.versionId : DEFAULT_CONTRACT_FORM_ID,
        name: text( s.name ),
        contract: text( s.contract ),
        typeOfAction: text( s.typeOfAction ),
        scale: text( s.scale ),
        length: text( s.length ),
        basePay: term( s.basePay ),
        transportation: term( s.transportation ),
        support: term( s.support ),
        salvage: term( s.salvage ),
        command: term( s.command ),
        startingWarchest: text( s.startingWarchest ),
        rows,
        fields: pickFields( s.fields ),
        checks: pickChecks( s.checks ),
    };
}
