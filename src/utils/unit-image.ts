// A unit picture is shrunk before it is stored in the design (#95): at most 400 px on the long side, WebP at 0.8
// (JPEG where the browser cannot encode WebP), and at most 80 KB, retried once at 0.6.
export const UNIT_IMAGE_MAX_SIDE = 400;
export const UNIT_IMAGE_MAX_BYTES = 80 * 1024;
export const UNIT_IMAGE_TOO_BIG = "This picture is too detailed to store; try a smaller or simpler one.";
export const UNIT_IMAGE_NOT_AN_IMAGE = "Choose a PNG, JPEG, WebP or GIF picture.";
export const UNIT_IMAGE_UNREADABLE = "That picture could not be read.";

export interface IDecodedImage { width: number; height: number; source?: unknown }
export type UnitImageDecode = (file: Blob) => Promise<IDecodedImage>;
export type UnitImageEncode = (size: { width: number; height: number }, type: string, quality: number, source?: unknown) => Promise<Blob | null>;

/** The size that fits the long side to `max`, keeping the proportions; a smaller picture is not enlarged. */
export function fitSize(width: number, height: number, max = UNIT_IMAGE_MAX_SIDE): { width: number; height: number } {
    const longSide = Math.max(width, height);
    if (longSide <= max) return { width, height };
    const scale = max / longSide;
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

const ACCEPTED = /^image\/(?:png|jpeg|webp|gif|bmp)$/;

const defaultDecode: UnitImageDecode = async (file) => {
    const bitmap = await createImageBitmap(file);
    return { width: bitmap.width, height: bitmap.height, source: bitmap };
};

/** Draws the picture on a canvas and encodes it. White first: JPEG has no transparency and would turn transparent pixels black. */
export async function encodeOnCanvas(canvas: HTMLCanvasElement, size: { width: number; height: number }, type: string, quality: number, source: unknown): Promise<Blob | null> {
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(source as CanvasImageSource, 0, 0, size.width, size.height);
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

const defaultEncode: UnitImageEncode = (size, type, quality, source) => encodeOnCanvas(document.createElement("canvas"), size, type, quality, source);

const toDataUrl = async (blob: Blob): Promise<string> => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }
    return `data:${blob.type};base64,${btoa(binary)}`;
};

/** One encode: WebP, or JPEG when the browser hands back something else. */
async function encodeOnce(encode: UnitImageEncode, size: { width: number; height: number }, quality: number, source: unknown): Promise<Blob | null> {
    const webp = await encode(size, "image/webp", quality, source);
    if (webp && webp.type === "image/webp") return webp;
    const jpeg = await encode(size, "image/jpeg", quality, source);
    return jpeg && jpeg.type === "image/jpeg" ? jpeg : null;
}

/** Shrinks a chosen picture to a storable data URL, or says why it cannot be stored. */
export async function shrinkUnitImage(
    file: Blob,
    encode: UnitImageEncode = defaultEncode,
    decode: UnitImageDecode = defaultDecode,
): Promise<{ dataUrl: string } | { error: string }> {
    if (!ACCEPTED.test(file.type)) return { error: UNIT_IMAGE_NOT_AN_IMAGE };
    let decoded: IDecodedImage;
    try {
        decoded = await decode(file);
    } catch {
        return { error: UNIT_IMAGE_UNREADABLE };
    }
    if (!(decoded.width > 0) || !(decoded.height > 0)) return { error: UNIT_IMAGE_UNREADABLE };
    const size = fitSize(decoded.width, decoded.height);
    for (const quality of [0.8, 0.6]) {
        const blob = await encodeOnce(encode, size, quality, decoded.source);
        if (!blob) return { error: UNIT_IMAGE_UNREADABLE };
        if (blob.size <= UNIT_IMAGE_MAX_BYTES) return { dataUrl: await toDataUrl(blob) };
    }
    return { error: UNIT_IMAGE_TOO_BIG };
}
