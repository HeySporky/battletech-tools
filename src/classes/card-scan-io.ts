/*
 * Shared steps for reading a photo of a printed card (Aces behavior cards, Alpha Strike unit cards): the image and
 * the OCR engine are reached through ICardScanIO, so the same parsing runs in the browser and in tests. Regions are
 * cleaned to black text on white before OCR, and icon colours are measured from the pixels.
 */

export interface ICardScanRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface ICardScanBox {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

export interface ICardScanWord {
    text: string;
    bbox: ICardScanBox;
}

export interface ICardScanLine {
    text: string;
    bbox: ICardScanBox;
    words: ICardScanWord[];
}

/** Share of a region's pixels in each icon colour, 0 to 1. */
export interface ICardScanColours {
    red: number;
    yellow: number;
    blue: number;
    green: number;
}

/**
 * How a region is read. "plain": the photo as it is, for finding the layout. "dark": black card text, everything
 * lighter (cream, gold, tags) dropped. "panel": as dark, for a cream panel whose border or header bar may edge
 * the crop. "ink": as panel, and dark red text too (the values on Alpha Strike unit cards). "red": red lettering
 * only. "colour": red, orange and yellow lettering (unit card titles) over darker art. "bright": white text
 * on the black bands (title, footer). "digits": the big white priority number, digits only. "dim" and "dim-digits":
 * as bright and digits, for a darker photo whose white print reads grey: the cut is set from the region's own
 * brightest pixels.
 */
export type TCardScanMode = "plain" | "dark" | "panel" | "ink" | "red" | "colour" | "heavy" | "bright" | "digits" | "dim" | "dim-digits";

export interface ICardScanIO {
    width: number;
    height: number;
    /**
     * OCR of a region, boxes in whole-image pixels. scale (default 1) resizes the region first. singleLine reads the
     * region as one line of text, for rows the scan has already found; OCR's own page layout is poor on sparse rows.
     * charset limits what OCR may read the region as (a number's digits).
     */
    recognize: ( rect: ICardScanRect, mode: TCardScanMode, scale?: number, singleLine?: boolean, charset?: string ) => Promise<ICardScanLine[]>;
    colours: ( rect: ICardScanRect ) => ICardScanColours;
    /** The region's RGBA pixels, row by row. */
    pixels: ( rect: ICardScanRect ) => ArrayLike<number>;
}

/** White margin round a region before OCR; text touching the edge is often dropped. */
export const cardScanMargin = 32;

/** Hue (degrees) and saturation of a pixel, or null when it's too dark or grey to have a colour. */
const hueOf = ( r: number, g: number, b: number ): { hue: number, saturation: number } | null => {
    const max = Math.max( r, g, b ) / 255;
    const min = Math.min( r, g, b ) / 255;
    const delta = max - min;
    if( max < 0.3 || delta / max < 0.5 ) return null;
    let hue: number;
    if( max === r / 255 ) hue = 60 * ( ( ( g - b ) / 255 / delta ) % 6 );
    else if( max === g / 255 ) hue = 60 * ( ( b - r ) / 255 / delta + 2 );
    else hue = 60 * ( ( r - g ) / 255 / delta + 4 );
    return { hue: hue < 0 ? hue + 360 : hue, saturation: delta / max };
}

const isInk = ( r: number, g: number, b: number, mode: TCardScanMode, brightCut: number ): boolean => {
    if( mode === "bright" || mode === "digits" || mode === "dim" || mode === "dim-digits" ) return 0.299 * r + 0.587 * g + 0.114 * b > brightCut;
    if( mode === "red" || mode === "colour" || mode === "heavy" ) {
        const colour = hueOf( r, g, b );
        if( !colour ) return false;
        return mode === "red" ? colour.hue < 18 || colour.hue >= 330 : colour.hue < 65 || colour.hue >= 330;
    }
    // Unit card panels are a textured mid grey, so their text needs a darker cut than the cream Aces panels.
    if( Math.max( r, g, b ) < ( mode === "ink" ? 90 : 115 ) ) return true;
    // Printed red is strongly red and not light; the cards' pink-grey panels are neither.
    return mode === "ink" && r > 100 && r > g * 2 && r > b * 2 && 0.299 * r + 0.587 * g + 0.114 * b < 150;
}

/**
 * The brightness cut for white print in a darker photo: a little under the region's brightest 1% of pixels (the
 * print), and never so low the cards' gold comes through.
 */
const dimCut = ( data: ArrayLike<number>, count: number ): number => {
    const levels = new Uint32Array( 256 );
    for( let index = 0; index < count; index++ ) levels[Math.round( 0.299 * data[index * 4] + 0.587 * data[index * 4 + 1] + 0.114 * data[index * 4 + 2] )]++;
    let seen = 0, level = 255;
    for( ; level > 0 && seen < count * 0.01; level-- ) seen += levels[level];
    return Math.max( 140, Math.min( 200, level * 0.92 ) );
}

/** Clears each connected blob of ink (pixel count and bounding box) that drop picks out. */
const dropBlobs = ( ink: Uint8Array, width: number, height: number, drop: ( count: number, box: ICardScanBox ) => boolean ): void => {
    const seen = new Uint8Array( ink.length );
    for( let start = 0; start < ink.length; start++ ) {
        if( !ink[start] || seen[start] ) continue;
        const blob = [ start ];
        seen[start] = 1;
        const box: ICardScanBox = { x0: width, y0: height, x1: 0, y1: 0 };
        for( let index = 0; index < blob.length; index++ ) {
            const x = blob[index] % width, y = Math.floor( blob[index] / width );
            box.x0 = Math.min( box.x0, x );
            box.y0 = Math.min( box.y0, y );
            box.x1 = Math.max( box.x1, x );
            box.y1 = Math.max( box.y1, y );
            for( const [ dx, dy ] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ] ) {
                const nx = x + dx, ny = y + dy;
                if( nx < 0 || nx >= width || ny < 0 || ny >= height ) continue;
                const next = ny * width + nx;
                if( ink[next] && !seen[next] ) { seen[next] = 1; blob.push( next ); }
            }
        }
        if( drop( blob.length, box ) ) for( const index of blob ) ink[index] = 0;
    }
}

/**
 * Black-and-white copy of RGBA pixels for OCR, with a white margin. Dark text is a pixel whose brightest channel is
 * low, so coloured tags and the red flame drop out with the background; bright text is the reverse.
 */
export const cardScanBinarize = ( data: ArrayLike<number>, width: number, height: number, mode: TCardScanMode ): { data: Uint8ClampedArray<ArrayBuffer>, width: number, height: number } => {
    const outWidth = width + cardScanMargin * 2;
    const outHeight = height + cardScanMargin * 2;
    const rv = new Uint8ClampedArray( outWidth * outHeight * 4 ).fill( 255 );
    const ink = new Uint8Array( width * height );
    const columnInk = new Array<number>( width ).fill( 0 );
    const rowInk = new Array<number>( height ).fill( 0 );
    const brightCut = mode === "dim" || mode === "dim-digits" ? dimCut( data, width * height ) : 200;
    for( let y = 0; y < height; y++ ) {
        for( let x = 0; x < width; x++ ) {
            const index = ( y * width + x ) * 4;
            const r = data[index], g = data[index + 1], b = data[index + 2];
            if( !isInk( r, g, b, mode, brightCut ) ) continue;
            ink[y * width + x] = 1;
            columnInk[x]++;
            rowInk[y]++;
        }
    }
    // A panel's border or header bar caught at the crop's edge reads as solid ink and throws off the OCR's layout.
    const edgeColumn = ( x: number ) => ( mode === "panel" || mode === "ink" ) && ( x < width * 0.08 || x >= width * 0.92 ) && columnInk[x] > height * ( mode === "ink" ? 0.6 : 0.3 );
    // Unit cards also run dark header bars (DAMAGE, HEAT SCALE) across their panels; no row of text is that solid.
    const edgeRow = ( y: number ) => ( mode === "panel" && ( y < height * 0.12 || y >= height * 0.88 ) && rowInk[y] > width * 0.5 ) || ( mode === "ink" && rowInk[y] > width * 0.55 );
    // The unit cards' panel texture leaves lone dark specks; a letter's pixels always have inked neighbours.
    const speck = ( x: number, y: number ): boolean => {
        if( mode !== "ink" ) return false;
        let neighbours = 0;
        for( let dy = -1; dy <= 1; dy++ ) for( let dx = -1; dx <= 1; dx++ ) {
            if( ( dx || dy ) && x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height ) neighbours += ink[( y + dy ) * width + x + dx];
        }
        return neighbours < 3;
    }
    // What's left of a header bar's edge is a long thin rule; no letter is ten times as wide as it is tall.
    if( mode === "ink" ) dropBlobs( ink, width, height, ( _count, box ) => box.y1 - box.y0 < 10 && box.x1 - box.x0 > ( box.y1 - box.y0 + 1 ) * 10 );
    // The unit cards' chassis names are so heavy their letters' gaps close up; thinning every stroke opens them.
    const thin = ( x: number, y: number ): boolean => {
        if( mode !== "heavy" ) return false;
        const reach = Math.max( 2, Math.round( height * 0.04 ) );
        for( let dy = -reach; dy <= reach; dy++ ) for( let dx = -reach; dx <= reach; dx++ ) {
            if( x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height || !ink[( y + dy ) * width + x + dx] ) return true;
        }
        return false;
    }
    for( let y = 0; y < height; y++ ) {
        if( edgeRow( y ) ) continue;
        for( let x = 0; x < width; x++ ) {
            if( !ink[y * width + x] || edgeColumn( x ) || speck( x, y ) || thin( x, y ) ) continue;
            const out = ( ( y + cardScanMargin ) * outWidth + x + cardScanMargin ) * 4;
            rv[out] = rv[out + 1] = rv[out + 2] = 0;
        }
    }
    return { data: rv, width: outWidth, height: outHeight };
}

/** The boxes (region pixels) of each connected blob of ink in a region, cleaned as for OCR in the given mode. */
export const cardScanInkBoxes = ( io: ICardScanIO, rect: ICardScanRect, mode: TCardScanMode ): ICardScanBox[] => {
    const clean = cardScanBinarize( io.pixels( rect ), rect.width, rect.height, mode );
    const ink = new Uint8Array( rect.width * rect.height );
    for( let y = 0; y < rect.height; y++ ) for( let x = 0; x < rect.width; x++ ) {
        if( clean.data[( ( y + cardScanMargin ) * clean.width + x + cardScanMargin ) * 4] === 0 ) ink[y * rect.width + x] = 1;
    }
    const rv: ICardScanBox[] = [];
    dropBlobs( ink, rect.width, rect.height, ( _count, box ) => { rv.push( { ...box } ); return false; } );
    return rv;
}

/**
 * The text rows in a region, as whole-image rects: runs of rows holding ink once the region is cleaned as for OCR.
 * Runs closer than gap pixels merge (a letter's parts), and runs shorter than minHeight are dropped (specks, rules).
 * The outer columns are left out of the count, and the rects trimmed: a panel's rounded border runs down them.
 */
export const cardScanRows = ( io: ICardScanIO, rect: ICardScanRect, mode: TCardScanMode, minHeight: number, maxTall = Infinity, gap = 3 ): ICardScanRect[] => {
    const clean = cardScanBinarize( io.pixels( rect ), rect.width, rect.height, mode );
    const ink = new Uint8Array( rect.width * rect.height );
    for( let y = 0; y < rect.height; y++ ) for( let x = 0; x < rect.width; x++ ) {
        if( clean.data[( ( y + cardScanMargin ) * clean.width + x + cardScanMargin ) * 4] === 0 ) ink[y * rect.width + x] = 1;
    }
    // The panels' printed texture survives cleaning as small clusters of specks; a letter is one larger blob. Blobs
    // taller than maxTall are dropped too: card art beside a narrower panel, far taller than the panel's text.
    const minArea = Math.round( minHeight * minHeight * 0.3 );
    dropBlobs( ink, rect.width, rect.height, ( count, box ) => count < minArea || box.y1 - box.y0 > maxTall );
    const inset = Math.round( rect.width * 0.04 );
    const rowInk: number[] = [];
    for( let y = 0; y < rect.height; y++ ) {
        let count = 0;
        for( let x = inset; x < rect.width - inset; x++ ) count += ink[y * rect.width + x];
        rowInk.push( count );
    }
    // A text row crosses many strokes; a row of leftover texture far fewer.
    const minInk = Math.max( 3, Math.round( ( rect.width - inset * 2 ) * 0.025 ) );
    const runs: { top: number, bottom: number }[] = [];
    for( let y = 0; y < rect.height; y++ ) {
        if( rowInk[y] < minInk ) continue;
        const last = runs[runs.length - 1];
        if( last && y - last.bottom <= gap ) last.bottom = y + 1;
        else runs.push( { top: y, bottom: y + 1 } );
    }
    const pad = Math.max( 2, Math.round( minHeight / 4 ) );
    return runs.filter( ( run ) => run.bottom - run.top >= minHeight ).map( ( run ) => {
        const top = Math.max( 0, run.top - pad );
        const bottom = Math.min( rect.height, run.bottom + pad );
        // Text can start nearer the edge than the count's inset; the border itself sits in the outer 1.5%.
        const trim = Math.round( rect.width * 0.015 );
        return { left: rect.left + trim, top: rect.top + top, width: rect.width - trim * 2, height: bottom - top };
    } );
}

/**
 * How far a photo's text lines slope, in degrees (positive runs down to the right), up to 10 either way; 0 when
 * the photo is already level to half a degree or shows no clear lines. The dark pixels are sheared at each trial
 * angle and the one that stacks them into the sharpest rows wins.
 */
export const cardScanSkew = ( data: ArrayLike<number>, width: number, height: number ): number => {
    // A copy about 400 pixels wide is plenty to see the lines and quick to shear.
    const step = Math.max( 1, Math.round( width / 400 ) );
    const dark: [ number, number ][] = [];
    for( let y = 0; y < height; y += step ) for( let x = 0; x < width; x += step ) {
        const at = ( y * width + x ) * 4;
        if( data[at] * 0.299 + data[at + 1] * 0.587 + data[at + 2] * 0.114 < 100 ) dark.push( [ x / step, y / step ] );
    }
    if( dark.length < 200 ) return 0;
    const rows = Math.ceil( height / step ) + Math.ceil( width / step );
    const sharpness = ( degrees: number ): number => {
        const slope = Math.tan( degrees * Math.PI / 180 );
        const counts = new Float64Array( rows * 2 + 1 );
        for( const [ x, y ] of dark ) counts[Math.round( y - x * slope ) + rows]++;
        return counts.reduce( ( sum, count ) => sum + count * count, 0 );
    };
    let best = 0;
    let bestScore = sharpness( 0 );
    const level = bestScore;
    for( let degrees = -10; degrees <= 10; degrees += 0.25 ) {
        const score = sharpness( degrees );
        if( score > bestScore ) {
            best = degrees;
            bestScore = score;
        }
    }
    return Math.abs( best ) < 0.5 || bestScore < level * 1.02 ? 0 : best;
}

/**
 * The photo turned by -degrees about its centre (undoing cardScanSkew's slope), on a canvas grown to hold it all,
 * the new corners white.
 */
export const cardScanRotate = ( data: ArrayLike<number>, width: number, height: number, degrees: number ): { data: Uint8ClampedArray<ArrayBuffer>, width: number, height: number } => {
    const angle = -degrees * Math.PI / 180;
    const cos = Math.cos( angle );
    const sin = Math.sin( angle );
    const outWidth = Math.ceil( Math.abs( width * cos ) + Math.abs( height * sin ) );
    const outHeight = Math.ceil( Math.abs( width * sin ) + Math.abs( height * cos ) );
    const out = new Uint8ClampedArray( outWidth * outHeight * 4 ).fill( 255 );
    for( let y = 0; y < outHeight; y++ ) for( let x = 0; x < outWidth; x++ ) {
        // Each new pixel from the source point that turns onto it, blended from the four around it.
        const dx = x - outWidth / 2;
        const dy = y - outHeight / 2;
        const sx = dx * cos + dy * sin + width / 2;
        const sy = -dx * sin + dy * cos + height / 2;
        const x0 = Math.floor( sx );
        const y0 = Math.floor( sy );
        if( x0 < 0 || y0 < 0 || x0 >= width - 1 || y0 >= height - 1 ) continue;
        const ax = sx - x0;
        const ay = sy - y0;
        for( let c = 0; c < 4; c++ ) {
            const at = ( px: number, py: number ) => data[( py * width + px ) * 4 + c];
            out[( y * outWidth + x ) * 4 + c] = ( at( x0, y0 ) * ( 1 - ax ) + at( x0 + 1, y0 ) * ax ) * ( 1 - ay ) + ( at( x0, y0 + 1 ) * ( 1 - ax ) + at( x0 + 1, y0 + 1 ) * ax ) * ay;
        }
    }
    return { data: out, width: outWidth, height: outHeight };
}

/** RGBA pixels, row by row. */
export interface ICardScanImage {
    data: ArrayLike<number>;
    width: number;
    height: number;
}

/** The photo turned clockwise by whole quarter turns. */
export const cardScanTurn = ( data: ArrayLike<number>, width: number, height: number, quarters: 1 | 2 | 3 ): { data: Uint8ClampedArray<ArrayBuffer>, width: number, height: number } => {
    const outWidth = quarters === 2 ? width : height;
    const outHeight = quarters === 2 ? height : width;
    const out = new Uint8ClampedArray( width * height * 4 );
    for( let y = 0; y < outHeight; y++ ) for( let x = 0; x < outWidth; x++ ) {
        // The source pixel that lands on (x, y).
        const sx = quarters === 1 ? y : quarters === 2 ? width - 1 - x : width - 1 - y;
        const sy = quarters === 1 ? height - 1 - x : quarters === 2 ? height - 1 - y : x;
        const from = ( sy * width + sx ) * 4, to = ( y * outWidth + x ) * 4;
        for( let c = 0; c < 4; c++ ) out[to + c] = data[from + c];
    }
    return { data: out, width: outWidth, height: outHeight };
}

/** How a card type is held: its printed shape, and whether a scan's result found the card at all. */
export interface ICardScanOptions<T> {
    shape: "landscape" | "portrait";
    found: ( result: T ) => boolean;
}

/**
 * Reads a photo that may be turned a quarter or upside down. A photo the other shape from the card is turned a
 * quarter clockwise first; if the card isn't found, the other way, then the photo as it came. A photo the card's
 * shape is read as it is, then upside down, then a quarter turned. The first result that finds the card wins, else
 * the first result. makeIO readies each turned photo for the scan (scaling, straightening).
 */
export const scanWithTurns = async <T,>( image: ICardScanImage, makeIO: ( image: ICardScanImage ) => ICardScanIO | Promise<ICardScanIO>, scan: ( io: ICardScanIO ) => Promise<T>, options?: ICardScanOptions<T> ): Promise<T> => {
    const turned = ( quarters: number ): ICardScanImage => quarters % 4 === 0 ? image : cardScanTurn( image.data, image.width, image.height, ( quarters % 4 ) as 1 | 2 | 3 );
    if( !options ) return scan( await makeIO( image ) );
    const sideways = ( image.width >= image.height ) !== ( options.shape === "landscape" );
    const results: T[] = [];
    for( const quarters of sideways ? [ 1, 3, 0 ] : [ 0, 2, 1 ] ) {
        const result = await scan( await makeIO( turned( quarters ) ) );
        if( options.found( result ) ) return result;
        results.push( result );
    }
    return results[0];
}

/** Icon colours from RGBA pixels. Tags and checks are strongly saturated; the card's cream and gold are not. */
export const cardScanColoursFromPixels = ( data: ArrayLike<number> ): ICardScanColours => {
    const rv: ICardScanColours = { red: 0, yellow: 0, blue: 0, green: 0 };
    const count = Math.floor( data.length / 4 );
    if( count === 0 ) return rv;
    for( let index = 0; index < count; index++ ) {
        const r = data[index * 4] / 255;
        const g = data[index * 4 + 1] / 255;
        const b = data[index * 4 + 2] / 255;
        const max = Math.max( r, g, b );
        const min = Math.min( r, g, b );
        const delta = max - min;
        if( max < 0.25 || delta === 0 ) continue;
        let hue: number;
        if( max === r ) hue = 60 * ( ( ( g - b ) / delta ) % 6 );
        else if( max === g ) hue = 60 * ( ( b - r ) / delta + 2 );
        else hue = 60 * ( ( r - g ) / delta + 4 );
        if( hue < 0 ) hue += 360;
        // The moved check is a dark, muted green (about 0.5 saturation, 0.3 to 0.5 value); nothing else on the cards
        // is green at all.
        if( hue >= 80 && hue < 170 ) { if( delta / max >= 0.35 ) rv.green++; continue; }
        if( max < 0.3 || delta / max < 0.6 ) continue;
        if( hue < 18 || hue >= 330 ) rv.red++;
        // The gold condition boxes reach 0.6 saturation; the YELLOW tag is 0.8 and up.
        else if( hue < 55 ) { if( delta / max >= 0.75 ) rv.yellow++; }
        else if( hue >= 180 && hue < 260 ) rv.blue++;
    }
    rv.red /= count;
    rv.yellow /= count;
    rv.blue /= count;
    rv.green /= count;
    return rv;
}
