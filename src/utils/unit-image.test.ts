import { describe, expect, it, vi } from "vitest";
import { encodeOnCanvas, fitSize, shrinkUnitImage, UNIT_IMAGE_MAX_BYTES, UNIT_IMAGE_TOO_BIG } from "./unit-image";

const blobOf = (bytes: number, type: string): Blob => new Blob([new Uint8Array(bytes)], { type });
const picture = new Blob([new Uint8Array(10)], { type: "image/png" });
// The decode step is stubbed: no canvas in the test environment.
const decode = async () => ({ width: 1600, height: 800, draw: () => undefined });

describe("fitSize (#95)", () => {
    it("fits the long side to 400 without distortion and never upscales", () => {
        expect(fitSize(1600, 800)).toEqual({ width: 400, height: 200 });
        expect(fitSize(300, 200)).toEqual({ width: 300, height: 200 });
        expect(fitSize(500, 2000)).toEqual({ width: 100, height: 400 });
    });
});

describe("shrinkUnitImage (#95)", () => {
    it("accepts a first encode under 80 KB", async () => {
        const encode = vi.fn(async (_size: { width: number; height: number }, type: string) => blobOf(70 * 1024, type));
        const result = await shrinkUnitImage(picture, encode, decode);
        expect(encode).toHaveBeenCalledTimes(1);
        expect("dataUrl" in result && result.dataUrl.startsWith("data:image/webp;base64,")).toBe(true);
    });

    it("retries once at quality 0.6 when the first encode is over 80 KB", async () => {
        const sizes = [90 * 1024, 70 * 1024];
        const encode = vi.fn(async (_size: { width: number; height: number }, type: string, _quality: number) => blobOf(sizes.shift()!, type));
        const result = await shrinkUnitImage(picture, encode, decode);
        expect(encode).toHaveBeenCalledTimes(2);
        expect(encode.mock.calls[0][2]).toBe(0.8);
        expect(encode.mock.calls[1][2]).toBe(0.6);
        expect("dataUrl" in result).toBe(true);
    });

    it("rejects with the message when both encodes are over 80 KB", async () => {
        const encode = vi.fn(async (_size: { width: number; height: number }, type: string) => blobOf(UNIT_IMAGE_MAX_BYTES + 1, type));
        expect(await shrinkUnitImage(picture, encode, decode)).toEqual({ error: UNIT_IMAGE_TOO_BIG });
    });

    it("refuses a file that is not an image without encoding", async () => {
        const encode = vi.fn();
        const result = await shrinkUnitImage(new Blob(["hi"], { type: "text/plain" }), encode, decode);
        expect("error" in result).toBe(true);
        expect(encode).not.toHaveBeenCalled();
    });

    it("refuses an svg without encoding", async () => {
        const encode = vi.fn();
        const result = await shrinkUnitImage(new Blob(["<svg/>"], { type: "image/svg+xml" }), encode, decode);
        expect("error" in result).toBe(true);
        expect(encode).not.toHaveBeenCalled();
    });

    it("falls back to JPEG when the browser will not encode WebP", async () => {
        const types: string[] = [];
        const encode = vi.fn(async (_size: { width: number; height: number }, type: string) => {
            types.push(type);
            return blobOf(10 * 1024, type === "image/webp" ? "image/png" : type);
        });
        const result = await shrinkUnitImage(picture, encode, decode);
        expect(types).toEqual(["image/webp", "image/jpeg"]);
        expect("dataUrl" in result && result.dataUrl.startsWith("data:image/jpeg;base64,")).toBe(true);
    });
});

describe("encodeOnCanvas (#95)", () => {
    it("paints the canvas white before drawing, so transparent pixels do not turn black in JPEG", async () => {
        const calls: string[] = [];
        const context = {
            fillStyle: "",
            fillRect: () => calls.push(`fill ${context.fillStyle}`),
            drawImage: () => calls.push("draw"),
        };
        const canvas = { width: 0, height: 0, getContext: () => context, toBlob: (done: (blob: Blob | null) => void) => done(new Blob(["x"], { type: "image/jpeg" })) };
        const blob = await encodeOnCanvas(canvas as never, { width: 10, height: 5 }, "image/jpeg", 0.8, {});
        expect(blob?.type).toBe("image/jpeg");
        expect(calls).toEqual(["fill #ffffff", "draw"]);
        expect(canvas.width).toBe(10);
    });
});
