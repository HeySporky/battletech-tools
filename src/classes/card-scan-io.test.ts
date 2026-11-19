import { describe, expect, it } from "vitest";
import { cardScanCrop, cardScanResize, cardScanTurn } from "./card-scan-io";

// A 3x2 image whose pixels are numbered 1 to 6 (red channel), row by row:
//   1 2 3
//   4 5 6
const image = () => {
    const data = new Uint8ClampedArray( 3 * 2 * 4 );
    for( let index = 0; index < 6; index++ ) data.set( [ index + 1, 0, 0, 255 ], index * 4 );
    return data;
};
const reds = ( data: ArrayLike<number> ) => Array.from( data ).filter( ( _value, index ) => index % 4 === 0 );

describe( "Card photo quarter turns", () => {
    it( "turns clockwise one, two and three quarters", () => {
        const one = cardScanTurn( image(), 3, 2, 1 );
        expect( [ one.width, one.height ] ).toEqual( [ 2, 3 ] );
        expect( reds( one.data ) ).toEqual( [ 4, 1, 5, 2, 6, 3 ] );
        const two = cardScanTurn( image(), 3, 2, 2 );
        expect( [ two.width, two.height ] ).toEqual( [ 3, 2 ] );
        expect( reds( two.data ) ).toEqual( [ 6, 5, 4, 3, 2, 1 ] );
        const three = cardScanTurn( image(), 3, 2, 3 );
        expect( [ three.width, three.height ] ).toEqual( [ 2, 3 ] );
        expect( reds( three.data ) ).toEqual( [ 3, 6, 2, 5, 1, 4 ] );
    } );

    it( "keeps every channel and comes back after four turns", () => {
        const start = image();
        start[1] = 77; start[2] = 88; start[3] = 99;
        let turned = { data: start as ArrayLike<number>, width: 3, height: 2 };
        for( let turn = 0; turn < 4; turn++ ) turned = cardScanTurn( turned.data, turned.width, turned.height, 1 );
        expect( [ turned.width, turned.height ] ).toEqual( [ 3, 2 ] );
        expect( Array.from( turned.data ) ).toEqual( Array.from( start ) );
    } );
} );

describe( "Card photo crops and scaling (plain code, the same pixels in every browser)", () => {
    it( "crops to whole pixels, rounding the region", () => {
        const crop = cardScanCrop( { data: image(), width: 3, height: 2 }, { left: 0.6, top: 0.4, width: 1.6, height: 1.5 } );
        expect( reds( crop ) ).toEqual( [ 2, 3, 5, 6 ] );
    } );
    it( "repeats the edge pixel for a region off the image", () => {
        const crop = cardScanCrop( { data: image(), width: 3, height: 2 }, { left: -1, top: 1, width: 5, height: 2 } );
        expect( reds( crop ) ).toEqual( [ 4, 4, 5, 6, 6, 4, 4, 5, 6, 6 ] );
    } );
    it( "scales by copying the source pixel each new pixel falls in", () => {
        const up = cardScanResize( image(), 3, 2, 2 );
        expect( [ up.width, up.height ] ).toEqual( [ 6, 4 ] );
        expect( reds( up.data ).slice( 0, 6 ) ).toEqual( [ 1, 1, 2, 2, 3, 3 ] );
        expect( reds( up.data ).slice( 18, 24 ) ).toEqual( [ 4, 4, 5, 5, 6, 6 ] );
        const down = cardScanResize( image(), 3, 2, 2 / 3 );
        expect( [ down.width, down.height ] ).toEqual( [ 2, 1 ] );
        expect( reds( down.data ) ).toEqual( [ 1, 2 ] );
    } );
} );
