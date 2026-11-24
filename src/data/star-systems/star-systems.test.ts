import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { IStarSystemIndexEntry } from "./star-system-types";
import {
    cacheUntilRejected,
    DEFAULT_JUMP_RANGE_LY,
    getDistanceLY,
    getFactionName,
    getFewestJumps,
    getStarSystemIndex,
    getSystemGarrisons,
    getSystemOwners,
    loadStarSystemSites,
    loadStarSystemDetail,
    loadStarSystemIndex,
    searchStarSystems,
} from "./star-systems";

const raw = JSON.parse( readFileSync( join( __dirname, "data", "index.json" ), "utf-8" ) ) as IStarSystemIndexEntry[];
const byId = ( id: string ) => raw.find( ( s ) => s.id === id )!;

describe( "Faction names", () => {
    it( "names an owner code as it was called on the date (MegaMek Data name changes)", () => {
        expect( getFactionName( "LA", "3025-01-01" ) ).toBe( "Lyran Commonwealth" );
        expect( getFactionName( "LA", "3060-06-01" ) ).toBe( "Lyran Alliance" );
        expect( getFactionName( "LA", "3090-01-01" ) ).toBe( "Lyran Commonwealth" );
        expect( getFactionName( "PP.AbM", "2810-01-01" ) ).toBe( "Abaddon Mining Settlements" );
    } );

    it( "falls back to the code when MegaMek Data has no name for it", () => {
        expect( getFactionName( "CEI", "3025-01-01" ) ).toBe( "CEI" );
    } );

    it( "has a name for nearly every owner code in the index", () => {
        const codes = new Set( raw.flatMap( ( s ) => s.owners.flatMap( ( o ) => o.factions ) ) );
        const unnamed = [ ...codes ].filter( ( code ) => getFactionName( code, "3025-01-01" ) === code );
        expect( unnamed.sort() ).toEqual( ["CEI", "SE"] );
    } );
} );

describe( "Star system lookups", () => {
    it( "caches a load, but forgets a failed one so the next call tries again", async () => {
        const cached = cacheUntilRejected<string>();
        let calls = 0;
        const failOnce = () => { calls++; return calls === 1 ? Promise.reject( new Error( "chunk failed" ) ) : Promise.resolve( "data" ); };
        await expect( cached( "index", failOnce ) ).rejects.toThrow( "chunk failed" );
        expect( await cached( "index", failOnce ) ).toBe( "data" );
        expect( await cached( "index", failOnce ) ).toBe( "data" );
        expect( calls ).toBe( 2 );
    } );

    it( "finds Tharkad by a partial name", async () => {
        await loadStarSystemIndex();
        expect( getStarSystemIndex() ).toHaveLength( 3186 );
        expect( searchStarSystems( "thark" ).map( ( s ) => s.id ) ).toContain( "Tharkad" );
        expect( searchStarSystems( "Thark" )[0].id ).toBe( "Tharkad" );
    } );

    it( "ignores apostrophes and puts prefix matches first", async () => {
        await loadStarSystemIndex();
        const withApostrophe = raw.find( ( s ) => s.name.includes( "'" ) )!;
        const typed = withApostrophe.name.replace( /'/g, "" ).toLowerCase();
        expect( searchStarSystems( typed ).map( ( s ) => s.id ) ).toContain( withApostrophe.id );
        const results = searchStarSystems( "new", 50 );
        const firstNonPrefix = results.findIndex( ( s ) => !s.name.toLowerCase().startsWith( "new" ) );
        if( firstNonPrefix >= 0 ) expect( results.slice( firstNonPrefix ).every( ( s ) => !s.name.toLowerCase().startsWith( "new" ) ) ).toBe( true );
    } );

    it( "knows who held Tharkad in 3025", () => {
        const tharkad = byId( "Tharkad" );
        const expected = [...tharkad.owners].reverse().find( ( o ) => o.date <= "3025-01-01" )!.factions;
        expect( getSystemOwners( tharkad, "3025-01-01" ) ).toEqual( expected );
        expect( expected ).toEqual( ["LA"] );
        expect( getSystemOwners( tharkad, "1000-01-01" ) ).toEqual( [] );
    } );

    it( "measures Terra to Tharkad", () => {
        expect( getDistanceLY( byId( "Terra" ), byId( "Tharkad" ) ) ).toBeCloseTo( 261.5, 1 );
    } );

    it( "counts jumps", async () => {
        await loadStarSystemIndex();
        // Strategic Operations: a jump of "approximately 30 light years".
        expect( DEFAULT_JUMP_RANGE_LY ).toBe( 30 );
        const terra = byId( "Terra" );
        const near = raw.find( ( s ) => s.id !== "Terra" && getDistanceLY( terra, s ) <= 30 )!;
        expect( getFewestJumps( terra, near, 30 ) ).toBe( 1 );
        expect( getFewestJumps( terra, terra, 30 ) ).toBe( 0 );
        expect( getFewestJumps( terra, byId( "Tharkad" ), 30 )! ).toBeGreaterThanOrEqual( 9 );
    } );

    it( "returns null when no path exists", async () => {
        await loadStarSystemIndex();
        expect( getFewestJumps( byId( "Terra" ), byId( "Tharkad" ), 1 ) ).toBeNull();
    } );

    it( "picks the garrisons on or nearest before the date", () => {
        const garrisons = [
            { systemId: "Tharkad", date: "3054-01-01", faction: "LA", units: ["Royal Guard"], source: "Objective Raids p.1" },
            { systemId: "Tharkad", date: "3054-01-01", faction: "LA", units: ["Tharkad Militia"], source: "Objective Raids p.1" },
            { systemId: "Tharkad", date: "3060-01-01", faction: "LA", units: ["Later"], source: "Field Manual p.2" },
            { systemId: "Donegal", date: "3050-01-01", faction: "LA", units: ["Elsewhere"], source: "x" },
        ];
        expect( getSystemGarrisons( garrisons, "Tharkad", "3055-06-01" ).flatMap( ( g ) => g.units ) ).toEqual( ["Royal Guard", "Tharkad Militia"] );
        expect( getSystemGarrisons( garrisons, "Tharkad", "3060-01-01" ).flatMap( ( g ) => g.units ) ).toEqual( ["Later"] );
        expect( getSystemGarrisons( garrisons, "Tharkad", "3000-01-01" ) ).toEqual( [] );
    } );

    it( "loads the sites and garrisons file", async () => {
        const data = await loadStarSystemSites();
        expect( Array.isArray( data.sites ) ).toBe( true );
        expect( Array.isArray( data.garrisons ) ).toBe( true );
    } );

    it( "loads one system's detail", async () => {
        const detail = await loadStarSystemDetail( "Tharkad" );
        expect( detail?.planets.length ).toBeGreaterThan( 0 );
        expect( await loadStarSystemDetail( "No Such System" ) ).toBeUndefined();
    } );
} );
