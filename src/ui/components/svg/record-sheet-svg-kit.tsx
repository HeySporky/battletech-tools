import React, { type JSX } from 'react';
import RecordSheetGroupBoxSVG from './record-sheet-group-box-svg';

// Drawing helpers the full-page record sheets share (vehicle, fighter, Small Craft and the rest). Coordinates are
// in a 2000 x 2600 document, US Letter in proportion, as on our 'Mech sheet. Our own title block and footer; no
// official art or logo.

export const DOC_WIDTH = 2000;
export const DOC_HEIGHT = 2600;
export const INK = "rgb(0,0,0)";
export const GRAY = "rgb(110,110,110)";
export const SHADE = "rgb(225,225,225)";

export interface ITextOptions { size?: number; weight?: number; anchor?: "start" | "middle" | "end"; fill?: string; italic?: boolean; testid?: string }

export const text = (x: number, y: number, value: React.ReactNode, options: ITextOptions = {}, key?: string): JSX.Element => (
    <text key={key} x={x} y={y} fontFamily="sans-serif" fontSize={options.size ?? 24} fontWeight={options.weight ?? 400}
        textAnchor={options.anchor ?? "start"} fill={options.fill ?? INK} fontStyle={options.italic ? "italic" : undefined}
        data-testid={options.testid}>{value}</text>
);

export const checkbox = (x: number, y: number, key?: string): JSX.Element => (
    <rect key={key} x={x} y={y - 20} width={24} height={24} rx={4} fill="white" stroke={INK} strokeWidth={2} />
);

/** A crew or critical hit box: a rounded box holding its modifier, "+1" or "D". Filled black when marked in play. */
export const hitBox = (x: number, y: number, label: string, key?: string, filled = false): JSX.Element => (
    <g key={key} data-hit={filled ? "filled" : undefined}>
        <rect x={x} y={y - 22} width={38} height={28} rx={6} fill={filled ? INK : "white"} stroke={INK} strokeWidth={2} />
        {text(x + 19, y, label, { size: 20, anchor: "middle", fill: filled ? "white" : INK })}
    </g>
);

/** A blank line to write on. */
export const blank = (x: number, y: number, w: number, key?: string): JSX.Element => (
    <line key={key} x1={x} y1={y + 4} x2={x + w} y2={y + 4} stroke={INK} strokeWidth={2} />
);

/** Splits text into lines of at most `width` characters, breaking at spaces. */
export const wrapText = (value: string, width: number): string[] => {
    const lines: string[] = [];
    let line = "";
    for (const word of value.split(" ")) {
        if (line && line.length + word.length + 1 > width) {
            lines.push(line);
            line = word;
        } else {
            line = line ? `${line} ${word}` : word;
        }
    }
    return line ? [...lines, line] : lines;
};

// A long title shrinks to fit its tab (about 0.62 em a capital).
export const groupBox = (x: number, y: number, w: number, h: number, title: string, children: React.ReactNode): JSX.Element => (
    <RecordSheetGroupBoxSVG xLoc={x} yLoc={y} width={w} height={h} title={title} bgColor="rgb(255,255,255)" strokeColor={INK}
        textSize={Math.min(35, Math.floor((w - 110) / (title.length * 0.62)))}>
        {children}
    </RecordSheetGroupBoxSVG>
);

/** The sheet title: white on a black rounded banner. */
export const titleBanner = (x: number, w: number, title: string): JSX.Element => (
    <g>
        <rect x={x} y={20} width={w} height={95} rx={18} fill={INK} />
        {text(x + w / 2, 85, title, { size: Math.min(48, Math.floor((w - 60) / (title.length * 0.68))), weight: 700, anchor: "middle", fill: "white" })}
    </g>
);

/** A turn-by-turn track (VTOL elevation, submarine depth): numbered turns with a row to write in. */
export const trackGrid = (x: number, y: number, w: number, h: number, title: string, rowName: string, turns: number): JSX.Element => {
    const perBand = turns > 20 ? 15 : 10;
    const bands = Math.ceil(turns / perBand);
    const labelW = rowName.length > 6 ? 125 : 90;
    const cellW = (w - 40 - labelW) / perBand;
    const cellH = 36;
    const bandH = (h - 70) / bands;
    const cells: JSX.Element[] = [];
    for (let band = 0; band < bands; band++) {
        const by = y + 60 + band * bandH;
        cells.push(<rect key={`b${band}`} x={x + 20} y={by} width={w - 40} height={cellH * 2} fill="white" stroke={INK} strokeWidth={2} />);
        cells.push(text(x + 28, by + 26, "Turn", { size: 20, weight: 700 }, `t${band}`));
        cells.push(text(x + 28, by + cellH + 26, rowName, { size: 20, weight: 700 }, `r${band}`));
        cells.push(<line key={`m${band}`} x1={x + 20} y1={by + cellH} x2={x + w - 20} y2={by + cellH} stroke={INK} strokeWidth={1.5} />);
        for (let i = 0; i < perBand; i++) {
            const cx = x + 20 + labelW + i * cellW;
            cells.push(<line key={`c${band}-${i}`} x1={cx} y1={by} x2={cx} y2={by + cellH * 2} stroke={INK} strokeWidth={1.5} />);
            cells.push(text(cx + cellW / 2, by + 26, band * perBand + i + 1, { size: 19, anchor: "middle" }, `n${band}-${i}`));
        }
    }
    return groupBox(x, y, w, h, title, cells);
};

export interface ISheetTable { columns: string[]; rows: { roll: string; cells: string[] }[] }

/** A rules table: a caption over the columns, a first column of rolls (or other keys) and zebra rows. */
export const rollTable = (table: ISheetTable, x: number, y: number, w: number, caption: string, rowHeight: number, firstColumnWidth: number, firstColumnTitle = "2D6 Roll"): JSX.Element => {
    const columnW = (w - 40 - firstColumnWidth) / table.columns.length;
    const cx = (i: number) => x + 20 + firstColumnWidth + columnW * i + columnW / 2;
    return (
        <g>
            {caption ? text((cx(0) + cx(table.columns.length - 1)) / 2, y, caption, { size: 22, weight: 700, anchor: "middle" }) : null}
            {text(x + 20 + firstColumnWidth / 2, y + 30, firstColumnTitle, { size: 22, weight: 700, anchor: "middle" })}
            {table.columns.map((column, i) => text(cx(i), y + 30, column.toUpperCase(), { size: 22, weight: 700, anchor: "middle" }, column))}
            {table.rows.map((row, r) => (
                <g key={row.roll}>
                    {r % 2 === 0 ? <rect x={x + 15} y={y + 38 + r * rowHeight} width={w - 30} height={rowHeight} fill={SHADE} /> : null}
                    {text(x + 20 + firstColumnWidth / 2, y + 38 + r * rowHeight + rowHeight * 0.75, row.roll, { size: 22, weight: 700, anchor: "middle" })}
                    {row.cells.map((cell, i) => text(cx(i), y + 38 + r * rowHeight + rowHeight * 0.75, cell, { size: 22, anchor: "middle" }, `${row.roll}-${i}`))}
                </g>
            ))}
        </g>
    );
};

/** Our footer: the app's name and address, where the tables come from, and the trademark notices. */
export const sheetFooter = (tablesCitation: string): JSX.Element => {
    const y = DOC_HEIGHT - 80;
    const x = 25;
    return (
        <g>
            {text(x, y, "Created with Jeff's BattleTech Tools IIC", { size: 22, weight: 700, fill: GRAY })}
            {text(x, y + 30, "https://heysporky.github.io/battletech-tools/", { size: 18, fill: GRAY })}
            {text(DOC_WIDTH - x, y, `${tablesCitation} MechWarrior, BattleMech, 'Mech and AeroTech are registered trademarks of The Topps Company, Inc.`, { size: 16, anchor: "end", fill: GRAY })}
            {text(DOC_WIDTH - x, y + 30, "Catalyst Game Labs is a trademark of InMediaRes Productions, LLC. This sheet is not published or endorsed by either.", { size: 16, anchor: "end", fill: GRAY })}
        </g>
    );
};
