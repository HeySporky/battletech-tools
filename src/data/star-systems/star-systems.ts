import factionData from "./data/factions.json";
import { IStarSystemDetail, IStarSystemGarrison, IStarSystemIndexEntry, IStarSystemSite } from "./star-system-types";

/*
 * Star system lookups for campaigns. The data (MegaMek Data, verified against our books: STAR-SYSTEMS-CREDITS.md)
 * is fetched the first time a campaign page needs it: the index once, the detail one shard at a time.
 */

/** Strategic Operations: a JumpShip jumps "approximately 30 light years" (jump diagrams, 2011 printing). */
export const DEFAULT_JUMP_RANGE_LY = 30;

type IFactionName = { name: string; changes: [number, string][] };
const FACTION_NAMES = ( factionData as unknown as { factions: Record<string, IFactionName> } ).factions;

/**
 * An owner code's name on the date, from MegaMek Data's faction files (name changes by year, so "LA" is the Lyran
 * Commonwealth in 3025 and the Lyran Alliance in 3060). A code MegaMek Data does not name is shown as it is.
 */
export const getFactionName = ( code: string, date: string ): string => {
    const faction = Object.prototype.hasOwnProperty.call( FACTION_NAMES, code ) ? FACTION_NAMES[code] : undefined;
    if( !faction ) return code;
    const year = parseInt( date.slice( 0, 4 ), 10 );
    // MegaMek's base name is the one used before the first change (ComStar is "SLCOMNET" until 2788).
    let name = faction.name;
    for( const [from, changed] of faction.changes ) if( year >= from ) name = changed;
    return name;
};

type Loaders = Record<string, () => Promise<unknown>>;
const indexLoader = import.meta.glob( "./data/index.json", { import: "default" } ) as Loaders;
const detailLoaders = import.meta.glob( "./data/detail-*.json", { import: "default" } ) as Loaders;

/**
 * A promise cache by key that forgets a load that fails, so a failed chunk fetch is tried again on the next call
 * instead of needing a page reload.
 */
export const cacheUntilRejected = <T>() => {
    const cache = new Map<string, Promise<T>>();
    return ( key: string, load: () => Promise<T> ): Promise<T> => {
        let pending = cache.get( key );
        if( !pending ) {
            const started = load();
            pending = started;
            cache.set( key, started );
            started.catch( () => { if( cache.get( key ) === started ) cache.delete( key ); } );
        }
        return pending;
    };
}

let index: IStarSystemIndexEntry[] = [];
const indexCache = cacheUntilRejected<IStarSystemIndexEntry[]>();
const shards = cacheUntilRejected<Record<string, IStarSystemDetail>>();

/** Fetches the index of every system (once). */
export const loadStarSystemIndex = (): Promise<IStarSystemIndexEntry[]> =>
    indexCache( "index", () => indexLoader["./data/index.json"]().then( ( data ) => {
        index = data as IStarSystemIndexEntry[];
        return index;
    } ) );

/** The index if it has been fetched (loadStarSystemIndex), else empty. */
export const getStarSystemIndex = (): IStarSystemIndexEntry[] => index;

const shardOf = ( id: string ): string => {
    const first = id.charAt( 0 ).toLowerCase();
    return first >= "a" && first <= "z" ? first : "other";
}

export const loadStarSystemDetail = async ( id: string ): Promise<IStarSystemDetail | undefined> => {
    const file = `./data/detail-${shardOf( id )}.json`;
    const loader = detailLoaders[file];
    if( !loader ) return undefined;
    const shard = await shards( file, () => loader().then( ( data ) => data as Record<string, IStarSystemDetail> ) );
    return Object.prototype.hasOwnProperty.call( shard, id ) ? shard[id] : undefined;
}

export interface IStarSystemSites {
    sites: IStarSystemSite[];
    garrisons: IStarSystemGarrison[];
}

const sitesCache = cacheUntilRejected<IStarSystemSites>();

/** Industrial sites and garrisons read from our own books (not MegaMek Data), fetched once. */
export const loadStarSystemSites = (): Promise<IStarSystemSites> =>
    sitesCache( "sites", () => import( "./star-systems-sites.json" ).then( ( module ) => {
        const data = ( module.default ?? module ) as Partial<IStarSystemSites>;
        return { sites: data.sites ?? [], garrisons: data.garrisons ?? [] };
    } ) );

/** The garrison entries of the latest date on or before `date` (several books may list one date). */
export const getSystemGarrisons = ( garrisons: IStarSystemGarrison[], systemId: string, date: string ): IStarSystemGarrison[] => {
    const here = garrisons.filter( ( g ) => g.systemId === systemId && g.date <= date );
    if( here.length === 0 ) return [];
    const latest = here.reduce( ( best, g ) => ( g.date > best ? g.date : best ), here[0].date );
    return here.filter( ( g ) => g.date === latest );
}

const normalise = ( text: string ): string => text.toLowerCase().replace( /['’`]/g, "" ).trim();

/** Case- and apostrophe-insensitive; names that start with the query first, then the rest, each alphabetical. */
export const searchStarSystems = ( query: string, limit: number = 20 ): IStarSystemIndexEntry[] => {
    const q = normalise( query );
    if( !q ) return [];
    const prefix: IStarSystemIndexEntry[] = [];
    const inside: IStarSystemIndexEntry[] = [];
    for( const system of index ) {
        const name = normalise( system.name );
        if( name.startsWith( q ) ) prefix.push( system );
        else if( name.includes( q ) ) inside.push( system );
    }
    return prefix.concat( inside ).slice( 0, limit );
}

/** The owners on the date (ISO): the last entry on or before it; none before the first. */
export const getSystemOwners = ( system: IStarSystemIndexEntry, date: string ): string[] => {
    let owners: string[] = [];
    for( const entry of system.owners ) {
        if( entry.date > date ) break;
        owners = entry.factions;
    }
    return owners;
}

export const getDistanceLY = ( a: Pick<IStarSystemIndexEntry, "x" | "y">, b: Pick<IStarSystemIndexEntry, "x" | "y"> ): number =>
    Math.hypot( a.x - b.x, a.y - b.y );

// Systems bucketed in squares one jump wide, so each step of the search looks at 9 squares, not every system.
const grids = new Map<number, { cells: Map<string, IStarSystemIndexEntry[]>; source: IStarSystemIndexEntry[] }>();
const cellKey = ( cx: number, cy: number ) => cx + "," + cy;

const gridFor = ( jumpRange: number ): Map<string, IStarSystemIndexEntry[]> => {
    const cached = grids.get( jumpRange );
    if( cached && cached.source === index ) return cached.cells;
    const cells = new Map<string, IStarSystemIndexEntry[]>();
    for( const system of index ) {
        const key = cellKey( Math.floor( system.x / jumpRange ), Math.floor( system.y / jumpRange ) );
        const list = cells.get( key );
        if( list ) list.push( system ); else cells.set( key, [system] );
    }
    grids.set( jumpRange, { cells, source: index } );
    return cells;
}

/** Fewest jumps of at most jumpRange light-years from a to b (breadth-first); null when b cannot be reached. */
export const getFewestJumps = ( a: IStarSystemIndexEntry, b: IStarSystemIndexEntry, jumpRange: number ): number | null => {
    if( a.id === b.id ) return 0;
    if( !( jumpRange > 0 ) ) return null;
    const cells = gridFor( jumpRange );
    const seen = new Set<string>( [a.id] );
    let frontier: IStarSystemIndexEntry[] = [a];
    for( let jumps = 1; frontier.length > 0; jumps++ ) {
        const next: IStarSystemIndexEntry[] = [];
        for( const here of frontier ) {
            const cx = Math.floor( here.x / jumpRange );
            const cy = Math.floor( here.y / jumpRange );
            for( let dx = -1; dx <= 1; dx++ ) for( let dy = -1; dy <= 1; dy++ ) {
                for( const there of cells.get( cellKey( cx + dx, cy + dy ) ) || [] ) {
                    if( seen.has( there.id ) || getDistanceLY( here, there ) > jumpRange ) continue;
                    if( there.id === b.id ) return jumps;
                    seen.add( there.id );
                    next.push( there );
                }
            }
        }
        frontier = next;
    }
    return null;
}
