// Reads the per-arc damage off a large craft's Alpha Strike card back (masterunitlist.battletech.com
// /units/{slug}/card.png?side=back). The live MUL publishes arc damage only as that image. The card's layout and
// fonts are fixed and its text is drawn without variation, so each glyph's black-and-white bitmap identifies it
// exactly (arc-card-glyphs.json, labelled by hand). A glyph not in that table makes the card unreadable rather
// than guessed.
import { readFileSync } from "node:fs";
import { PNG } from "pngjs";

/** The hand-labelled glyph table: bitmap key -> text. */
export const arcCardGlyphs = JSON.parse(readFileSync(new URL("./arc-card-glyphs.json", import.meta.url), "utf8"));

const DARK = 110; // luminance below this is ink
const PANELS = [
    { arc: "front", dx: 0, dy: 0 }, // "Nose" on DropShips and Small Craft
    { arc: "rear", dx: 465, dy: 0 }, // "Aft"
    { arc: "left", dx: 0, dy: 255 }, // "Left Wing" / "Left"
    { arc: "right", dx: 465, dy: 255 },
];
const HEADER = { top: 93, bottom: 114 };
const FIRST_ROW_TOP = 126; // the S row; M, L, E and SPE follow 34 px apart
const ROW_PITCH = 34;
const ROW_HEIGHT = 28;
const VALUE_LEFT = 168;
const VALUE_RIGHT = 488;
const RANGES = ["s", "m", "l", "e"];
const TOKEN_GAP = 20; // wider than this between glyphs: a new value

/** A black-and-white view of a PNG: dark(x, y) is true for ink. */
export function bitmapOfPng(buffer) {
    const png = PNG.sync.read(buffer);
    const { width, height, data } = png;
    return {
        width,
        height,
        dark(x, y) {
            const i = (y * width + x) * 4;
            return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] < DARK;
        },
    };
}

/** Ink runs along x in a band, split where more than `gap` blank columns fall. */
function inkRuns(bitmap, top, bottom, left, right, gap) {
    const runs = [];
    let start = -1;
    let last = -1;
    for (let x = left; x < right; x++) {
        let ink = false;
        for (let y = top; y < bottom && !ink; y++) ink = bitmap.dark(x, y);
        if (!ink) continue;
        if (start < 0 || x - last - 1 > gap) {
            if (start >= 0) runs.push([start, last]);
            start = x;
        }
        last = x;
    }
    if (start >= 0) runs.push([start, last]);
    return runs;
}

/** The glyph's bitmap key: its ink rows, cropped to the ink, "#" for ink and "." for paper, "|" ending each row. */
function glyphKey(bitmap, top, bottom, left, right) {
    let inkTop = bottom;
    let inkBottom = top;
    for (let x = left; x <= right; x++) {
        for (let y = top; y < bottom; y++) {
            if (bitmap.dark(x, y)) {
                inkTop = Math.min(inkTop, y);
                inkBottom = Math.max(inkBottom, y);
            }
        }
    }
    let key = "";
    for (let y = inkTop; y <= inkBottom; y++) {
        for (let x = left; x <= right; x++) key += bitmap.dark(x, y) ? "#" : ".";
        key += "|";
    }
    return key;
}

/** Reads the text in a band; unknown glyphs are collected in `unknown` and read as "?". */
function readText(bitmap, top, bottom, left, right, glyphs, unknown) {
    let text = "";
    for (const [glyphLeft, glyphRight] of inkRuns(bitmap, top, bottom, left, right, 0)) {
        const key = glyphKey(bitmap, top, bottom, glyphLeft, glyphRight);
        const label = glyphs[key];
        if (label === undefined) unknown.push(key);
        text += label ?? "?";
    }
    return text;
}

/**
 * The card back's per-arc damage: { front, rear, left, right }, each { std, cap?, scap, msl } of [s, m, l, e] as
 * printed ("8", "0*", "-", or "" for a blank cell), plus spe (the arc's special abilities). `capital` is true for the
 * JumpShip/WarShip/station card, which adds the CAP column. Returns { unknown } listing unreadable glyphs instead.
 */
export function readArcCard(bitmap, glyphs) {
    const unknown = [];
    const headerWords = inkRuns(bitmap, HEADER.top, HEADER.bottom, 140, 490, 8);
    const capital = headerWords.length === 4;
    if (headerWords.length !== 3 && !capital) {
        return { unknown: [`header has ${headerWords.length} words, not 3 or 4`] };
    }
    const columns = capital ? ["std", "cap", "scap", "msl"] : ["std", "scap", "msl"];
    const columnCentres = headerWords.map(([left, right]) => (left + right) / 2);
    const arcs = {};
    for (const panel of PANELS) {
        const arc = {};
        for (const column of columns) arc[column] = ["", "", "", ""];
        RANGES.forEach((_, row) => {
            const top = FIRST_ROW_TOP + row * ROW_PITCH + panel.dy;
            for (const [left, right] of inkRuns(bitmap, top, top + ROW_HEIGHT, VALUE_LEFT + panel.dx, VALUE_RIGHT + panel.dx, TOKEN_GAP)) {
                const centre = (left + right) / 2 - panel.dx;
                let nearest = 0;
                columnCentres.forEach((x, index) => {
                    if (Math.abs(x - centre) < Math.abs(columnCentres[nearest] - centre)) nearest = index;
                });
                const cell = arc[columns[nearest]];
                cell[row] += readText(bitmap, top, top + ROW_HEIGHT, left, right + 1, glyphs, unknown);
            }
        });
        const speTop = FIRST_ROW_TOP + RANGES.length * ROW_PITCH + panel.dy;
        // Abilities are written without spaces ("PNT12", "FLK1/1/1/-") and listed ", " apart. Glyph gaps can't tell
        // a space: the gap after a "1" is as wide as one.
        arc.spe = readText(bitmap, speTop, speTop + ROW_HEIGHT, VALUE_LEFT + panel.dx, VALUE_RIGHT + panel.dx, glyphs, unknown)
            .replace(/,/g, ", ");
        arcs[panel.arc] = arc;
    }
    if (unknown.length > 0) return { unknown };
    return { capital, arcs };
}

/**
 * The arcs as stored on a MUL record (BFArcs): each arc keeps only the columns with a value and its abilities if
 * any, e.g. { front: { std: ["8", "9", "4", ""] }, rear: { std: [...], spe: "PNT1" }, ... }. An arc with nothing
 * printed is left out, so an unarmed craft's blank card back is {}: read, with no arc damage.
 */
export function compactArcs(arcs) {
    const compact = {};
    for (const [arcName, arc] of Object.entries(arcs)) {
        const kept = {};
        for (const [column, values] of Object.entries(arc)) {
            if (column === "spe") {
                if (values) kept.spe = values;
            } else if (values.some((value) => value !== "")) {
                kept[column] = values;
            }
        }
        if (Object.keys(kept).length > 0) compact[arcName] = kept;
    }
    return compact;
}
