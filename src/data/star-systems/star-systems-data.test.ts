import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { STAR_SYSTEM_CORRECTIONS } from "./star-system-corrections";
import { IStarSystemDetail, IStarSystemIndexEntry, readSourced } from "./star-system-types";

const DIR = join( __dirname, "data" );
const index = JSON.parse( readFileSync( join( DIR, "index.json" ), "utf-8" ) ) as IStarSystemIndexEntry[];
const detail = ( id: string ): IStarSystemDetail => {
    const first = id[0].toLowerCase();
    const shard = first >= "a" && first <= "z" ? first : "other";
    return JSON.parse( readFileSync( join( DIR, `detail-${shard}.json` ), "utf-8" ) )[id];
};

describe( "Star system catalog (MegaMek Data)", () => {
    it( "holds every canon system", () => {
        expect( index ).toHaveLength( 3186 );
        expect( new Set( index.map( ( s ) => s.id ) ).size ).toBe( 3186 );
        const shards = readdirSync( DIR ).filter( ( f ) => f.startsWith( "detail-" ) );
        const total = shards.reduce( ( n, f ) => n + Object.keys( JSON.parse( readFileSync( join( DIR, f ), "utf-8" ) ) ).length, 0 );
        expect( total ).toBe( 3186 );
    } );

    it( "places Terra at the origin and Tharkad where MekHQ does", () => {
        const terra = index.find( ( s ) => s.id === "Terra" )!;
        expect( [terra.x, terra.y] ).toEqual( [0, 0] );
        const tharkad = index.find( ( s ) => s.id === "Tharkad" )!;
        expect( [tharkad.x, tharkad.y] ).toEqual( [-212.999, 151.773] );
    } );

    it( "keeps each field's source", () => {
        expect( readSourced( detail( "Tharkad" ).spectralType ) ).toEqual( { value: "G6V", source: "25 Years of Art and Fiction, pg. 167" } );
        const durant = detail( "Tharkad" ).planets.find( ( p ) => readSourced( p.name )?.value === "Durant" )!;
        expect( readSourced( durant.gravity ) ).toEqual( { value: 0.87, source: "MegaMek Data" } );
    } );

    it( "applies every correction in the corrections file", () => {
        // The correction step itself is tested in scripts/star-systems/test_import_mekhq_systems.py.
        for( const c of STAR_SYSTEM_CORRECTIONS ) {
            const path = c.path.split( "." );
            if( path[0] === "x" || path[0] === "y" || path[0] === "name" ) {
                expect( ( index.find( ( s ) => s.id === c.systemId ) as never )[path[0]] ).toEqual( c.value );
            } else if( path[0] === "planets" ) {
                const planet = detail( c.systemId ).planets.find( ( p ) => String( p.sysPos ) === path[1] ) as never;
                expect( planet[path[2]] ).toEqual( { value: c.value, source: c.source } );
            }
        }
    } );
} );
