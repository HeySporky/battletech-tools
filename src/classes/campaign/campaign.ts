import { findCampaignEdition } from "../../data/campaign-editions";
import { generateUUID } from "../../utils/generateUUID";
import { CAMPAIGN_RULE_HOOKS } from "./campaign-rules";
import { IContractSheet, pickContractSheet } from "./contract-sheet";
import {
    CAMPAIGN_EXPORT_VERSION,
    CampaignSideRole,
    CampaignTimeStep,
    ICampaignArea,
    ICampaignBattleResult,
    ICampaignCombination,
    ICampaignDot,
    ICampaignEdition,
    ICampaignExport,
    ICampaignForceUnit,
    ICampaignLedgerEntry,
    ICampaignLogEntry,
    ICampaignPlanet,
    ICampaignSide,
    ICampaignTarget,
    ICustomDotType,
} from "./campaign-types";

/** No imported array grows past this, so a hostile or corrupt file cannot balloon the saved data. */
export const CAMPAIGN_MAX_ARRAY = 5000;
/** Characters of JSON an edition's state may hold (about 5,000 roster lines of 400 characters). */
export const CAMPAIGN_MAX_EDITION_STATE = 2000000;

export const STEP_LABELS: Record<CampaignTimeStep, string> = {
    month: "Month",
    turn: "Turn",
    track: "Track",
    sortie: "Sortie",
};

const isObject = ( v: unknown ): v is Record<string, any> => typeof v === "object" && v !== null && !Array.isArray( v );
const isString = ( v: unknown ): v is string => typeof v === "string";
const isNumber = ( v: unknown ): v is number => typeof v === "number" && isFinite( v );

/** Keeps the array's well-formed items (each rebuilt by `pick`, which returns null to drop one), capped. */
function cleanArray<T>( raw: unknown, pick: ( item: Record<string, any> ) => T | null ): T[] {
    if( !Array.isArray( raw ) ) return [];
    const out: T[] = [];
    for( const item of raw ) {
        if( out.length >= CAMPAIGN_MAX_ARRAY ) break;
        if( !isObject( item ) ) continue;
        const picked = pick( item );
        if( picked ) out.push( picked );
    }
    return out;
}

export const CAMPAIGN_SIDE_ROLES: CampaignSideRole[] = ["attacker", "defender", "other"];
const INTENTS: ICampaignTarget["intent"][] = ["travel", "assault", "defend"];

const pickSide = ( s: Record<string, any> ): ICampaignSide | null =>
    isString( s.id ) && isString( s.name ) && CAMPAIGN_SIDE_ROLES.includes( s.role ) ? { id: s.id, name: s.name, role: s.role } : null;

const pickLedger = ( e: Record<string, any> ): ICampaignLedgerEntry | null =>
    isString( e.id ) && isString( e.sideId ) && isNumber( e.step ) && isNumber( e.amount ) && isString( e.currency )
        ? { id: e.id, sideId: e.sideId, step: e.step, amount: e.amount, currency: e.currency,
            reason: isString( e.reason ) ? e.reason : "", rule: isString( e.rule ) ? e.rule : "" }
        : null;

const pickLog = ( e: Record<string, any> ): ICampaignLogEntry | null =>
    isString( e.id ) && isNumber( e.step ) && isString( e.text ) ? { id: e.id, step: e.step, text: e.text } : null;

const pickTarget = ( t: Record<string, any> ): ICampaignTarget | null =>
    isString( t.id ) && isString( t.sideId ) && isString( t.systemId ) && INTENTS.includes( t.intent )
        ? { id: t.id, sideId: t.sideId, systemId: t.systemId, intent: t.intent }
        : null;

const numOrNull = ( v: unknown ): number | null => ( isNumber( v ) ? v : null );

const pickForce = ( u: Record<string, any> ): ICampaignForceUnit | null =>
    isString( u.id ) && isString( u.sideId ) && ( u.kind === "battlemech" || u.kind === "alpha-strike" ) && isString( u.name )
        ? { id: u.id, sideId: u.sideId, kind: u.kind, savedId: isString( u.savedId ) ? u.savedId : null, name: u.name,
            cost: numOrNull( u.cost ), bv: numOrNull( u.bv ), pv: numOrNull( u.pv ), snapshot: u.snapshot ?? null,
            status: isString( u.status ) ? u.status : "" }
        : null;

const pickDot = ( d: Record<string, any> ): ICampaignDot | null =>
    isString( d.id ) && isString( d.type ) ? { id: d.id, type: d.type, destroyed: d.destroyed === true } : null;

const pickArea = ( a: Record<string, any> ): ICampaignArea | null => {
    if( !isString( a.id ) || !isString( a.name ) ) return null;
    const area: ICampaignArea = {
        id: a.id,
        name: a.name,
        terrain: isString( a.terrain ) ? a.terrain : "",
        controllerSideId: isString( a.controllerSideId ) ? a.controllerSideId : null,
        dots: cleanArray( a.dots, pickDot ),
        comboOverride: Array.isArray( a.comboOverride ) ? a.comboOverride.filter( isString ).slice( 0, CAMPAIGN_MAX_ARRAY ) : null,
    };
    if( typeof a.seized === "boolean" ) area.seized = a.seized;
    if( isString( a.siteId ) ) area.siteId = a.siteId;
    return area;
}

const pickCustomDot = ( t: Record<string, any> ): ICustomDotType | null =>
    isString( t.id ) && isString( t.name ) && isNumber( t.value ) && isNumber( t.target )
        ? { id: t.id, name: t.name, value: t.value, target: t.target }
        : null;

const pickCombination = ( c: Record<string, any> ): ICampaignCombination | null => {
    if( !isString( c.id ) || !isString( c.name ) || !isObject( c.needs ) || ( c.multiplier !== 2 && c.multiplier !== 3 ) ) return null;
    const needs: Record<string, number> = {};
    for( const [type, count] of Object.entries( c.needs ).slice( 0, 50 ) ) {
        if( isNumber( count ) && count > 0 && count <= 100 ) needs[type] = Math.floor( count );
    }
    return Object.keys( needs ).length > 0 ? { id: c.id, name: c.name, needs, multiplier: c.multiplier } : null;
}

const pickPlanet = ( p: unknown ): ICampaignPlanet | null =>
    isObject( p ) && isString( p.name )
        ? { systemId: isString( p.systemId ) ? p.systemId : null, name: p.name,
            areas: cleanArray( p.areas, pickArea ), customDotTypes: cleanArray( p.customDotTypes, pickCustomDot ),
            customCombinations: cleanArray( p.customCombinations, pickCombination ) }
        : null;

const isLeapYear = ( y: number ): boolean => ( y % 4 === 0 && y % 100 !== 0 ) || y % 400 === 0;
const daysInMonth = ( y: number, m: number ): number =>
    [31, isLeapYear( y ) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
const pad = ( n: number, width: number ): string => String( n ).padStart( width, "0" );

/** `YYYY-MM-DD` plus whole months, the day held back to the month's last day when it is shorter. */
export const addMonths = ( isoDate: string, months: number ): string => {
    const match = /^(\d{1,5})-(\d{2})-(\d{2})$/.exec( isoDate );
    if( !match ) return isoDate;
    const total = Number( match[1] ) * 12 + ( Number( match[2] ) - 1 ) + months;
    const year = Math.floor( total / 12 );
    const month = total - year * 12 + 1;
    const day = Math.min( Number( match[3] ), daysInMonth( year, month ) );
    return `${pad( year, 4 )}-${pad( month, 2 )}-${pad( day, 2 )}`;
}

export class Campaign {
    id: string = generateUUID();
    name: string = "New Campaign";
    editionId: string | null = null;
    rulesetIds: string[] = [];
    startDate: string = "3025-01-01";
    step: number = 0;
    sides: ICampaignSide[] = [];
    targets: ICampaignTarget[] = [];
    force: ICampaignForceUnit[] = [];
    ledger: ICampaignLedgerEntry[] = [];
    log: ICampaignLogEntry[] = [];
    planet: ICampaignPlanet | null = null;
    editionState: unknown = null;
    contractSheets: IContractSheet[] = [];

    constructor( data: ICampaignExport | null = null ) {
        if( data ) this.import( data );
    }

    get edition(): ICampaignEdition | undefined {
        return findCampaignEdition( this.editionId );
    }

    get currency(): string {
        return this.edition?.currency ?? "C-bills";
    }

    get timeStep(): CampaignTimeStep {
        return this.edition?.timeStep ?? "month";
    }

    export(): ICampaignExport {
        return JSON.parse( JSON.stringify( {
            version: CAMPAIGN_EXPORT_VERSION,
            id: this.id,
            name: this.name,
            editionId: this.editionId,
            rulesetIds: this.rulesetIds,
            startDate: this.startDate,
            step: this.step,
            sides: this.sides,
            targets: this.targets,
            force: this.force,
            ledger: this.ledger,
            log: this.log,
            planet: this.planet,
            editionState: this.editionState ?? null,
            contractSheets: this.contractSheets,
        } ) );
    }

    /** Throws on a non-object or a missing id; drops malformed array items; caps each array. */
    import( data: unknown ): void {
        if( !isObject( data ) ) throw new Error( "A campaign must be an object" );
        if( !isString( data.id ) || !data.id ) throw new Error( "A campaign needs an id" );
        if( isNumber( data.version ) && data.version > CAMPAIGN_EXPORT_VERSION ) throw new Error( "This campaign was saved by a newer version of the app" );
        this.id = data.id;
        this.name = isString( data.name ) ? data.name : "Campaign";
        this.editionId = isString( data.editionId ) ? data.editionId : null;
        // A ruleset listed twice would run its step hook twice (two paydays, for example).
        this.rulesetIds = Array.isArray( data.rulesetIds ) ? [ ...new Set( data.rulesetIds.filter( isString ) ) ].slice( 0, CAMPAIGN_MAX_ARRAY ) : [];
        this.startDate = isString( data.startDate ) ? data.startDate : "3025-01-01";
        this.step = isNumber( data.step ) && data.step >= 0 ? Math.floor( data.step ) : 0;
        this.sides = cleanArray( data.sides, pickSide );
        this.targets = cleanArray( data.targets, pickTarget );
        this.force = cleanArray( data.force, pickForce );
        this.ledger = cleanArray( data.ledger, pickLedger );
        this.log = cleanArray( data.log, pickLog );
        this.planet = pickPlanet( data.planet );
        this.contractSheets = cleanArray( data.contractSheets, pickContractSheet );
        const editionJson = data.editionState === undefined ? "null" : JSON.stringify( data.editionState ) ?? "null";
        if( editionJson.length > CAMPAIGN_MAX_EDITION_STATE ) throw new Error( "This campaign's edition data is too large" );
        this.editionState = JSON.parse( editionJson );
    }

    balance( sideId: string, currency: string = this.currency ): number {
        return this.ledger
            .filter( ( e ) => e.sideId === sideId && e.currency === currency )
            .reduce( ( sum, e ) => sum + e.amount, 0 );
    }

    addLedger( entry: Omit<ICampaignLedgerEntry, "id"> ): void {
        this.ledger.push( { id: generateUUID(), ...entry } );
    }

    addLog( text: string ): void {
        this.log.push( { id: generateUUID(), step: this.step, text } );
    }

    addSide( name: string, role: CampaignSideRole ): ICampaignSide {
        const side: ICampaignSide = { id: generateUUID(), name, role };
        this.sides.push( side );
        return side;
    }

    /**
     * A battle's result as the players type it in (the spec's after-battle form): logs it, marks each lost unit,
     * gives the area to the side that holds the ground (seized, when it changes hands), then runs the edition's
     * control and afterBattle hooks and each ticked ruleset's afterBattle.
     */
    recordBattle( result: ICampaignBattleResult ): void {
        const sideName = ( id: string | null ) => this.sides.find( ( s ) => s.id === id )?.name ?? "an unknown side";
        const stepLabel = `${STEP_LABELS[this.timeStep].toLowerCase()} ${this.step}`;
        const area = result.areaId ? this.planet?.areas.find( ( a ) => a.id === result.areaId ) : undefined;
        const parts = result.sides.map( ( s ) => {
            const lost = s.losses.map( ( id ) => this.force.find( ( u ) => u.id === id )?.name ).filter( ( n ): n is string => !!n );
            return `${sideName( s.sideId )} (${s.size}${lost.length ? ", lost " + lost.join( ", " ) : ""})`;
        } );
        const lostIds = new Set( result.sides.flatMap( ( s ) => s.losses ) );
        this.force = this.force.map( ( u ) => ( lostIds.has( u.id ) ? { ...u, status: `Lost in battle, ${stepLabel}` } : u ) );
        if( area && result.heldBySideId && area.controllerSideId !== result.heldBySideId ) {
            area.controllerSideId = result.heldBySideId;
            area.seized = true;
        }
        this.addLog( `Battle${area ? " at " + area.name : ""}: ${parts.join( " vs " )}; `
            + ( result.heldBySideId ? `${sideName( result.heldBySideId )} hold the ground` : "no one holds the ground" ) );
        if( area ) this.edition?.control?.( this, area, result );
        this.edition?.afterBattle?.( this, result );
        for( const id of this.rulesetIds ) CAMPAIGN_RULE_HOOKS[id]?.afterBattle?.( this, result );
    }

    /** ISO date: the start date plus `step` months on a month time step; the start date otherwise. */
    currentDate(): string {
        return this.timeStep === "month" ? addMonths( this.startDate, this.step ) : this.startDate;
    }

    /** Moves the campaign on one step at a time, running the edition's step hook and each ticked ruleset's. */
    advance( steps: number = 1 ): void {
        for( let i = 0; i < steps; i++ ) {
            this.step++;
            this.addLog( `${STEP_LABELS[this.timeStep]} ${this.step}` );
            this.edition?.onStep?.( this );
            for( const id of this.rulesetIds ) CAMPAIGN_RULE_HOOKS[id]?.onStep?.( this );
        }
    }
}
