/*
 * Reading a photo of a printed card in the browser: the photo is decoded on a canvas, regions are cropped and cleaned
 * in plain code (card-scan-io), and tesseract.js reads them. Nothing leaves the device but the one-time download of
 * tesseract's English data.
 */
import {
    cardScanBinarize, cardScanColoursFromPixels, cardScanCrop, cardScanLanczos, cardScanMargin, cardScanResize, cardScanRotate, cardScanSkew, ICardScanImage, ICardScanIO, ICardScanLine,
    ICardScanOptions, ICardScanRect, scanWithTurns, TCardScanMode,
} from "./card-scan-io";

/** The scan's layout rules were tuned on cards about this wide, so every photo is scaled to it. */
const cardWidth = 2000;

/**
 * The photo as it was taken, upright by its EXIF orientation. Its colours are left as the camera stored them: phones
 * tag photos Display P3, and the browser's usual conversion to sRGB shifts the very values the readers were tuned on.
 */
const decodePhoto = async ( file: Blob ): Promise<CanvasImageSource & { width: number, height: number, close?: () => void }> => {
    try {
        return await createImageBitmap( file, { colorSpaceConversion: "none", imageOrientation: "from-image" } );
    } catch {
        // A browser that rejects those options: decoded as an image element, colours converted.
        const url = URL.createObjectURL( file );
        try {
            const image = new Image();
            image.src = url;
            await image.decode();
            return Object.assign( image, { width: image.naturalWidth, height: image.naturalHeight } );
        } finally {
            URL.revokeObjectURL( url );
        }
    }
}

/** Python's round(), halves to even, as the readers' test photos were sized. */
const roundHalfEven = ( value: number ): number => {
    const floor = Math.floor( value );
    const rest = value - floor;
    return rest > 0.5 || ( rest === 0.5 && floor % 2 === 1 ) ? floor + 1 : floor;
}

/**
 * The photo's pixels at the card width. It is decoded at its own size (a canvas copies pixels 1:1 untouched) and
 * scaled by cardScanLanczos, exactly as the readers' test photos were made from the phone's JPEGs.
 */
const loadPhoto = async ( file: Blob ): Promise<ICardScanImage> => {
    const image = await decodePhoto( file );
    let pixels: ImageData;
    try {
        const canvas = document.createElement( "canvas" );
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext( "2d", { willReadFrequently: true } )!;
        context.drawImage( image, 0, 0 );
        pixels = context.getImageData( 0, 0, canvas.width, canvas.height );
    } finally {
        if( image.close ) image.close();
    }
    return cardScanLanczos( pixels.data, pixels.width, pixels.height, cardWidth, roundHalfEven( pixels.height * cardWidth / pixels.width ) );
}

const toCanvas = ( data: ArrayLike<number>, width: number, height: number ): HTMLCanvasElement => {
    const canvas = document.createElement( "canvas" );
    canvas.width = width;
    canvas.height = height;
    canvas.getContext( "2d" )!.putImageData( new ImageData( Uint8ClampedArray.from( data ), width, height ), 0, 0 );
    return canvas;
}

/** The photo (perhaps turned) at the card width and straightened: the layout rules look for level rows. */
const readyPhoto = ( image: ICardScanImage ): ICardScanImage => {
    let photo = image.width === cardWidth ? image : cardScanResize( image.data, image.width, image.height, cardWidth / image.width );
    // A photo taken at a slant is straightened, then brought back to the card width the rules expect.
    const skew = cardScanSkew( photo.data, photo.width, photo.height );
    if( skew !== 0 ) {
        const level = cardScanRotate( photo.data, photo.width, photo.height, skew );
        photo = cardScanResize( level.data, level.width, level.height, photo.width / level.width );
    }
    return photo;
}

/**
 * Reads one card photo with a card type's scan. The result is a draft for the player to check against the card.
 * With options, a photo turned a quarter or upside down is turned round until the scan finds the card.
 */
export const scanCardPhoto = async <T,>( file: Blob, scan: ( io: ICardScanIO ) => Promise<T>, options?: ICardScanOptions<T> ): Promise<T> => {
    const loaded = await loadPhoto( file );

    // Loaded on demand: tesseract is large and only the card readers use it.
    const { createWorker, PSM } = await import( "tesseract.js" );
    const worker = await createWorker( "eng" );
    const makeIO = ( image: ICardScanImage ): ICardScanIO => {
        const photo = readyPhoto( image );
        const pixels = ( rect: ICardScanRect ) => cardScanCrop( photo, rect );
        return {
            width: photo.width,
            height: photo.height,
            recognize: async ( rect: ICardScanRect, mode: TCardScanMode, scale = 1, singleLine = false, charset = "" ): Promise<ICardScanLine[]> => {
                let canvas: HTMLCanvasElement;
                let offset = 0;
                if( mode === "plain" ) {
                    canvas = toCanvas( pixels( rect ), Math.round( rect.width ), Math.round( rect.height ) );
                } else {
                    const clean = cardScanBinarize( pixels( rect ), Math.round( rect.width ), Math.round( rect.height ), mode );
                    const scaled = scale === 1 ? clean : cardScanResize( clean.data, clean.width, clean.height, scale );
                    canvas = toCanvas( scaled.data, scaled.width, scaled.height );
                    offset = cardScanMargin;
                }
                const digits = mode === "digits" || mode === "dim-digits";
                const special = digits || singleLine || !!charset;
                if( special ) await worker.setParameters( { tessedit_char_whitelist: digits ? "0123456789" : charset, tessedit_pageseg_mode: digits || singleLine ? PSM.SINGLE_LINE : PSM.AUTO } );
                const { data } = await worker.recognize( canvas, {}, { blocks: true } );
                if( special ) await worker.setParameters( { tessedit_char_whitelist: "", tessedit_pageseg_mode: PSM.AUTO } );
                // Boxes back to whole-photo pixels.
                const shift = ( box: { x0: number, y0: number, x1: number, y1: number } ) => ( {
                    x0: box.x0 / scale - offset + rect.left, y0: box.y0 / scale - offset + rect.top,
                    x1: box.x1 / scale - offset + rect.left, y1: box.y1 / scale - offset + rect.top,
                } );
                const rv: ICardScanLine[] = [];
                for( const block of data.blocks || [] ) for( const paragraph of block.paragraphs ) for( const line of paragraph.lines ) {
                    rv.push( { text: line.text.trim(), bbox: shift( line.bbox ), words: line.words.map( ( word ) => ( { text: word.text, bbox: shift( word.bbox ) } ) ) } );
                }
                return rv;
            },
            colours: ( rect: ICardScanRect ) => cardScanColoursFromPixels( pixels( rect ) ),
            pixels: pixels,
        };
    };
    try {
        return await scanWithTurns( loaded, makeIO, scan, options );
    } finally {
        await worker.terminate();
    }
}
