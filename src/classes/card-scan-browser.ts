/*
 * Reading a photo of a printed card in the browser: the photo goes on a canvas, regions are cropped and cleaned
 * there, and tesseract.js reads them. Nothing leaves the device but the one-time download of tesseract's English data.
 */
import {
    cardScanBinarize, cardScanColoursFromPixels, cardScanMargin, cardScanRotate, cardScanSkew, ICardScanImage, ICardScanIO, ICardScanLine, ICardScanOptions, ICardScanRect,
    scanWithTurns, TCardScanMode,
} from "./card-scan-io";

/** The scan's layout rules were tuned on cards about this wide, so every photo is scaled to it. */
const cardWidth = 2000;

/** The photo's pixels, scaled to the card width. */
const loadPhoto = async ( file: Blob ): Promise<ImageData> => {
    const url = URL.createObjectURL( file );
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement( "canvas" );
        canvas.width = cardWidth;
        canvas.height = Math.round( image.naturalHeight * cardWidth / image.naturalWidth );
        const context = canvas.getContext( "2d", { willReadFrequently: true } )!;
        context.drawImage( image, 0, 0, canvas.width, canvas.height );
        return context.getImageData( 0, 0, canvas.width, canvas.height );
    } finally {
        URL.revokeObjectURL( url );
    }
}

const toCanvas = ( image: ICardScanImage ): HTMLCanvasElement => {
    const canvas = document.createElement( "canvas" );
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext( "2d" )!.putImageData( new ImageData( Uint8ClampedArray.from( image.data ), image.width, image.height ), 0, 0 );
    return canvas;
}

/** The photo (perhaps turned) at the card width and straightened: the layout rules look for level rows. */
const readyPhoto = ( image: ICardScanImage ): HTMLCanvasElement => {
    const canvas = document.createElement( "canvas" );
    canvas.width = cardWidth;
    canvas.height = Math.round( image.height * cardWidth / image.width );
    const context = canvas.getContext( "2d", { willReadFrequently: true } )!;
    context.drawImage( toCanvas( image ), 0, 0, canvas.width, canvas.height );
    // A photo taken at a slant is straightened.
    const photo = context.getImageData( 0, 0, canvas.width, canvas.height );
    const skew = cardScanSkew( photo.data, photo.width, photo.height );
    if( skew === 0 ) return canvas;
    const level = cardScanRotate( photo.data, photo.width, photo.height, skew );
    // Back to the card width the rules expect.
    canvas.height = Math.round( level.height * cardWidth / level.width );
    context.drawImage( toCanvas( level ), 0, 0, canvas.width, canvas.height );
    return canvas;
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
        const photoContext = photo.getContext( "2d", { willReadFrequently: true } )!;
        const pixels = ( rect: ICardScanRect ) => photoContext.getImageData( rect.left, rect.top, rect.width, rect.height ).data;
        return {
            width: photo.width,
            height: photo.height,
            recognize: async ( rect: ICardScanRect, mode: TCardScanMode, scale = 1, singleLine = false, charset = "" ): Promise<ICardScanLine[]> => {
                const canvas = document.createElement( "canvas" );
                let offset = 0;
                if( mode === "plain" ) {
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                    canvas.getContext( "2d" )!.drawImage( photo, rect.left, rect.top, rect.width, rect.height, 0, 0, rect.width, rect.height );
                } else {
                    const clean = cardScanBinarize( pixels( rect ), rect.width, rect.height, mode );
                    const full = document.createElement( "canvas" );
                    full.width = clean.width;
                    full.height = clean.height;
                    full.getContext( "2d" )!.putImageData( new ImageData( clean.data, clean.width, clean.height ), 0, 0 );
                    canvas.width = Math.max( 1, Math.round( clean.width * scale ) );
                    canvas.height = Math.max( 1, Math.round( clean.height * scale ) );
                    canvas.getContext( "2d" )!.drawImage( full, 0, 0, canvas.width, canvas.height );
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
