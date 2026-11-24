// Test helper for #95: the unit picture on a record sheet must lie inside the sheet and cover no printed text.
// Needs a DOM (happy-dom). Text boxes are estimated from the font size (about 0.55 em a character). Nested <svg x y
// width height viewBox> elements are mapped to sheet coordinates; elements under a transform are skipped.
import { cleanup, render } from "@testing-library/react";
import { mkdirSync, writeFileSync } from "node:fs";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect } from "vitest";

interface IBox { x: number; y: number; w: number; h: number }

const num = (value: string | null | undefined, fallback = 0): number => {
    const parsed = Number.parseFloat(value ?? "");
    return Number.isFinite(parsed) ? parsed : fallback;
};

/** A point (and a length such as a font size) of an element mapped to the sheet's own coordinates; null under a transform. */
const toSheet = (element: Element, root: Element, px: number, py: number, length: number): { x: number; y: number; length: number } | null => {
    let x = px;
    let y = py;
    let size = length;
    for (let node = element.parentElement; node && node !== root; node = node.parentElement) {
        if (node.getAttribute("transform")) return null;
        if (node.tagName.toLowerCase() !== "svg") continue;
        const box = (node.getAttribute("viewBox") ?? "").split(/\s+/).map(Number);
        let scale = 1;
        if (box.length === 4 && box.every(Number.isFinite) && box[2] > 0 && box[3] > 0) {
            const w = num(node.getAttribute("width"), box[2]);
            const h = num(node.getAttribute("height"), w * box[3] / box[2]);
            scale = Math.min(w / box[2], h / box[3]);
            x = (x - box[0]) * scale;
            y = (y - box[1]) * scale;
            size *= scale;
        }
        x += num(node.getAttribute("x"));
        y += num(node.getAttribute("y"));
    }
    return { x, y, length: size };
};

const overlaps = (a: IBox, b: IBox): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** The sheet's one unit picture: a safe data URL, a "meet" fit, inside the viewBox, clear of every <text>. */
export function assertImageClear(sheet: React.ReactElement, label = "sheet"): void {
    // UNIT_IMAGE_DUMP=<folder> also writes the sheet as <folder>/<label>.svg, to look at where the free areas are.
    if (process.env.UNIT_IMAGE_DUMP) {
        mkdirSync(process.env.UNIT_IMAGE_DUMP, { recursive: true });
        writeFileSync(`${process.env.UNIT_IMAGE_DUMP}/${label}.svg`, renderToStaticMarkup(sheet).replace("<svg ", "<svg xmlns=\"http://www.w3.org/2000/svg\" "));
    }
    // Rendered by React into the test DOM, so no markup string is ever parsed.
    cleanup();
    const host = render(sheet).container;
    const svg = host.querySelector("svg");
    expect(svg, `${label}: an svg`).not.toBeNull();
    const images = [...host.querySelectorAll("image[data-testid='unit-image']")];
    expect(images.length, `${label}: one unit picture`).toBe(1);
    const image = images[0];
    expect(image.getAttribute("href")).toMatch(/^data:image\/(png|jpeg|webp);base64,/);
    expect(image.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
    const view = (svg!.getAttribute("viewBox") ?? "0 0 0 0").split(/\s+/).map(Number);
    const corner = toSheet(image, svg!, num(image.getAttribute("x")), num(image.getAttribute("y")), num(image.getAttribute("width")));
    expect(corner, `${label}: the picture is not under a transform`).not.toBeNull();
    const scale = corner!.length / Math.max(1e-9, num(image.getAttribute("width")));
    const box: IBox = { x: corner!.x, y: corner!.y, w: corner!.length, h: num(image.getAttribute("height")) * scale };
    expect(box.w, `${label}: width`).toBeGreaterThan(0);
    expect(box.h, `${label}: height`).toBeGreaterThan(0);
    expect(box.x, `${label}: inside left`).toBeGreaterThanOrEqual(view[0]);
    expect(box.y, `${label}: inside top`).toBeGreaterThanOrEqual(view[1]);
    expect(box.x + box.w, `${label}: inside right`).toBeLessThanOrEqual(view[0] + view[2]);
    expect(box.y + box.h, `${label}: inside bottom`).toBeLessThanOrEqual(view[1] + view[3]);
    for (const text of host.querySelectorAll("text")) {
        const shown = (text.textContent ?? "").trim();
        if (!shown) continue;
        const at = toSheet(text, svg!, num(text.getAttribute("x")), num(text.getAttribute("y")), num(text.getAttribute("font-size"), 16));
        if (!at) continue;
        const width = shown.length * at.length * 0.55;
        const anchor = text.getAttribute("text-anchor");
        const left = anchor === "middle" ? at.x - width / 2 : anchor === "end" ? at.x - width : at.x;
        const textBox: IBox = { x: left, y: at.y - at.length, w: width, h: at.length * 1.25 };
        expect(overlaps(box, textBox), `${label}: the picture covers "${shown}"`).toBe(false);
    }
}
