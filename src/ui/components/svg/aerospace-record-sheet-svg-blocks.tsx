import React, { type JSX } from 'react';
import { AEROSPACE_HEAT_SCALE, AEROSPACE_PILOT_HITS, toCapitalScale } from '../../../data/aerospace-record-sheet';
import { IAerospaceInventoryRow } from '../aerospace-sheet-blocks';
import { GRAY, INK, SHADE, blank, checkbox, groupBox, hitBox, text, wrapText, wrappedTspans } from './record-sheet-svg-kit';

// Blocks the full-page aerospace record sheets share (fighters, Small Craft and DropShips), laid out like the Total
// Warfare sheets: the unit data box with its weapons inventory, notes, armor data, critical damage, pilot data, the
// velocity record, heat data and the heat scale column. Coordinates are in the kit's 2000 x 2600 document.

export interface IDataEntry {
    label: string;
    value?: React.ReactNode;
    /** Indented under a heading entry (an entry with no value), as Safe and Maximum Thrust sit under "Thrust:". */
    indent?: boolean;
    /** Where the value starts, from the box's left edge; for a long value under a short label. */
    valueAt?: number;
}

export interface IUnitDataBox {
    title: string;
    type: string;
    left: IDataEntry[];
    right: IDataEntry[];
    /** Anything else under the two columns, such as the VSTOL and STOL boxes; drawn at the given y. */
    extra?: (y: number) => React.ReactNode;
    rows: IAerospaceInventoryRow[];
    locationTitle?: string;
    locationKey: string;
    /** Weapon bays (a DropShip's): a Bay column in place of Qty and Type, with capital-scale brackets too (TM p.199). */
    bays?: boolean;
    /** Bays without the capital-scale brackets: a Small Craft's, as it mounts no capital weapons. */
    standardScaleOnly?: boolean;
    /** JumpShips, WarShips and stations: standard bays print capital scale with standard in parentheses (SO:AA p.9). */
    capitalScale?: boolean;
    /** The ammunition carried, on a line under the inventory. */
    ammo?: string;
    cost: number;
    bv: React.ReactNode;
}

const label = (x: number, y: number, value: string, key?: string) => text(x, y, value, { size: 22, weight: 700 }, key);
const valueText = (x: number, y: number, value: React.ReactNode, key?: string) =>
    text(x, y, value, { size: String(value).length > 18 ? 18 : 24 }, key);

/** The unit data box: type, thrust, tonnage and the rest in two columns, the weapons inventory, then cost and BV. */
export const unitDataBox = (x: number, y: number, w: number, h: number, data: IUnitDataBox): JSX.Element => {
    const entries = (list: IDataEntry[], column: number) => list.map((entry, i) => {
        const ex = x + column + (entry.indent ? 20 : 0);
        const ey = y + 115 + i * 35;
        return (
            <g key={`${column}-${entry.label}`}>
                {label(ex, ey, entry.label)}
                {entry.value !== undefined ? valueText(x + (entry.valueAt ?? (column === 20 ? 245 : 545)), ey, entry.value) : null}
            </g>
        );
    });
    const rowsUsed = Math.max(data.left.length, data.right.length);
    const dividerY = y + 115 + rowsUsed * 35 + (data.extra ? 35 : 0) - 5;
    const inventoryTop = dividerY + 40;
    // A long key (a Small Craft's six arcs) wraps, and the inventory gives it the room.
    const keyLines = wrapText(data.locationKey, Math.floor((w - 40) / 8.4));
    const keyTop = y + h - 80 - (keyLines.length - 1) * 21;
    const ammoLines = data.ammo !== undefined ? wrapText(`Ammo: ${data.ammo}`, Math.floor((w - 40) / 10)) : [];
    const inventoryBottom = keyTop - 20 - ammoLines.length * 26 - (ammoLines.length ? 10 : 0);
    return groupBox(x, y, w, h, data.title, (
        <>
            {label(x + 20, y + 75, "Type:")}
            {text(x + 95, y + 75, data.type, { size: data.type.length > 34 ? 22 : 26, weight: 700 })}
            {entries(data.left, 20)}
            {entries(data.right, 400)}
            {data.extra ? data.extra(y + 115 + rowsUsed * 35) : null}
            <line x1={x + 10} y1={dividerY} x2={x + w - 10} y2={dividerY} stroke={INK} strokeWidth={2} />
            {inventory(x, inventoryTop, w, inventoryBottom, data.rows, data.locationTitle ?? "Loc.", data.bays || data.capitalScale, data.capitalScale, !data.standardScaleOnly)}
            {ammoLines.map((line, i) => text(x + 20, inventoryBottom + 30 + i * 26, line, { size: 20, weight: i === 0 ? 700 : 400 }, `ammo${i}`))}
            {keyLines.map((line, i) => text(x + 20, keyTop + i * 21, line, { size: 17, fill: GRAY }, `key${i}`))}
            {label(x + 20, y + h - 30, "Cost:")}{valueText(x + 95, y + h - 30, `${data.cost.toLocaleString("en-US")} C-Bills`)}
            {label(x + 420, y + h - 30, "BV:")}{valueText(x + 470, y + h - 30, data.bv)}
        </>
    ));
};

/**
 * The Weapons & Equipment Inventory, standard scale, with Attack Values by range bracket (TW p. 30). The rows shrink
 * to fit between top and bottom; shaded write-in rows fill the rest, as on the official sheet. With bays, each row is
 * a weapon bay named for its class and weapons, and the capital-scale brackets head the columns too (TM p.199).
 */
export const inventory = (x: number, top: number, w: number, bottom: number, rows: IAerospaceInventoryRow[], locationTitle: string, bays = false, capitalScale = false, capitalBrackets = bays): JSX.Element => {
    const col = { qty: x + 30, type: bays ? x + 20 : x + 65, loc: x + 440, ht: x + 495, srv: x + 565, mrv: x + 630, lrv: x + 695, erv: x + 755 };
    const brackets = [col.srv, col.mrv, col.lrv, col.erv];
    const head = bays && capitalBrackets ? 20 : 0;
    const tableTop = top + 70 + head;
    const space = bottom - tableTop;
    const lineHeight = Math.min(34, space / Math.max(rows.length, 1));
    const lines = Math.max(rows.length, Math.floor(space / lineHeight));
    const size = Math.min(20, Math.floor(lineHeight * 0.62));
    const typeWidth = col.loc - 30 - col.type;
    return (
        <g>
            {text(x + 20, top, "Weapons & Equipment Inventory", { size: 26, weight: 700 })}
            {head ? text(x + 20, top + 25, "Capital Scale", { size: 16 }) : null}
            {head ? ["(1-12)", "(13-24)", "(25-40)", "(41-50)"].map((bracket, i) => text(brackets[i], top + 25, bracket, { size: 16, anchor: "middle" }, `c${bracket}`)) : null}
            {text(x + 20, top + 25 + head, "Standard Scale", { size: 16 })}
            {["(0-6)", "(7-12)", "(13-20)", "(21-25)"].map((bracket, i) => text(brackets[i], top + 25 + head, bracket, { size: 16, anchor: "middle" }, bracket))}
            {bays ? null : text(col.qty, top + 55, "Qty", { size: 20, weight: 700, anchor: "middle" })}
            {text(col.type, top + 55 + head, bays ? "Bay" : "Type", { size: 20, weight: 700 })}
            {text(col.loc, top + 55 + head, locationTitle, { size: 20, weight: 700, anchor: "middle" })}
            {text(col.ht, top + 55 + head, "Ht", { size: 20, weight: 700, anchor: "middle" })}
            {["SRV", "MRV", "LRV", "ERV"].map((name, i) => text(brackets[i], top + 55 + head, name, { size: 20, weight: 700, anchor: "middle" }, name))}
            {Array.from({ length: lines }, (_, index) => index % 2 === 0
                ? <rect key={`shade${index}`} x={x + 10} y={tableTop + index * lineHeight} width={w - 20} height={lineHeight} fill={SHADE} /> : null)}
            {rows.length === 0 ? text(x + w / 2, tableTop + 60, "No Weapons or Equipment", { size: 24, anchor: "middle", fill: GRAY }) : null}
            {rows.map((row, index) => {
                const baseline = tableTop + index * lineHeight + lineHeight * 0.72;
                const cell = (cx: number, v: React.ReactNode, key: string) => text(cx, baseline, v, { size, anchor: "middle" }, key);
                // Capital scale with standard in parentheses needs a smaller figure to fit its column.
                const scaled = capitalScale && !row.capital;
                const valueCell = (cx: number, v: number, key: string) => text(cx, baseline, scaled ? `${toCapitalScale(v)} (${v})` : v, { size: scaled ? Math.min(size, 15) : size, anchor: "middle" }, key);
                return (
                    <g key={index}>
                        {bays ? null : cell(col.qty, row.quantity, "q")}
                        {text(col.type, baseline, row.name, { size: Math.max(13, Math.min(size, Math.floor(typeWidth / (row.name.length * 0.55)))) }, "n")}
                        {cell(col.loc, row.location, "l")}{cell(col.ht, row.heat, "h")}
                        {brackets.map((cx, i) => (!row.values ? cell(cx, "?", `v${i}`) : row.values[i] ? valueCell(cx, row.values[i], `v${i}`) : cell(cx, "—", `v${i}`)))}
                    </g>
                );
            })}
        </g>
    );
};

/** Printed notes, wrapped, with ruled lines under them for the player's own. */
export const notesBox = (x: number, y: number, w: number, h: number, notes: string[]): JSX.Element => {
    let cursor = y + 80;
    const lines: JSX.Element[] = [];
    const width = Math.floor((w - 40) / 11.5);
    notes.forEach((note, index) => {
        const wrapped = wrapText(note, width);
        lines.push(
            <text key={index} x={x + 20} y={cursor} fontFamily="sans-serif" fontSize={20} fill={INK}>
                {wrappedTspans(wrapped, () => x + 20, 24)}
            </text>
        );
        cursor += wrapped.length * 24 + 8;
    });
    for (let ly = cursor + 20; ly < y + h - 15; ly += 38) {
        lines.push(<line key={`rule-${ly}`} x1={x + 20} y1={ly} x2={x + w - 20} y2={ly} stroke={SHADE} strokeWidth={2} />);
    }
    return groupBox(x, y, w, h, "NOTES", lines);
};

/** Each arc's damage threshold with its total armor in parentheses, as the official diagram labels them, then other lines. */
export const armorDataBox = (x: number, y: number, w: number, h: number, arcs: { name: string; threshold: number; armor: number }[], lines: [string, React.ReactNode][]): JSX.Element =>
    groupBox(x, y, w, h, "ARMOR DATA", (
        <>
            {text(x + 20, y + 75, "Damage Threshold (Total Armor)", { size: 22, weight: 700 })}
            {arcs.map((arc, i) => (
                <g key={arc.name}>
                    {i % 2 === 0 ? <rect x={x + 15} y={y + 92 + i * 40} width={w - 30} height={40} fill={SHADE} /> : null}
                    {text(x + 30, y + 120 + i * 40, arc.name, { size: 22 })}
                    {text(x + 330, y + 120 + i * 40, `${arc.threshold} (${arc.armor})`, { size: 24, weight: 700, anchor: "middle" })}
                </g>
            ))}
            {lines.map(([name, value], i) => {
                const ly = y + 130 + arcs.length * 40 + i * 40;
                const long = String(value).length > 30;
                return (
                    <g key={name}>
                        {text(x + 20, ly, name, { size: 22, weight: 700 })}
                        {text(x + 30 + name.length * 13, ly, value, { size: long ? 17 : 22 })}
                    </g>
                );
            })}
        </>
    ));

export interface ICriticalTrack { name: string; boxes: string[]; filled: number }

/**
 * Critical damage tracks in columns: each track's name and its boxes, filled black for hits taken in play. Columns
 * share the width evenly unless columnStarts gives each one's offset from the box's left edge.
 */
export const criticalDamageBox = (x: number, y: number, w: number, h: number, columns: ICriticalTrack[][], columnStarts?: number[]): JSX.Element => {
    const columnW = (w - 30) / columns.length;
    return groupBox(x, y, w, h, "CRITICAL DAMAGE", columns.map((tracks, c) => {
        const rowH = (h - 80) / Math.max(...columns.map((column) => column.length));
        return tracks.map((track, r) => {
            const lx = x + (columnStarts ? columnStarts[c] : 30 + c * columnW), ly = y + 105 + r * rowH;
            // Six boxes need the room; their name goes above them.
            const stacked = track.boxes.length > 4;
            const boxesX = stacked ? lx : lx + 165;
            return (
                <g key={track.name} data-testid={`crit-${track.name}`} data-filled={track.filled}>
                    {text(lx, stacked ? ly - 30 : ly, track.name, { size: 22, weight: 700 })}
                    {track.boxes.map((box, i) => hitBox(boxesX + i * 52, ly, box, `${track.name}${i}`, i < track.filled))}
                </g>
            );
        });
    }));
};

/** Pilot data: name and skills, then the hits taken with the consciousness number and modifier of each. */
export const pilotDataBox = (x: number, y: number, w: number, h: number, pilot: { name?: string; gunnery?: number; piloting?: number; hits: number }, title = "PILOT DATA"): JSX.Element => {
    const cellX = (i: number) => x + 190 + i * 44;
    const row = (ry: number, name: string, values: string[], marks: boolean) => (
        <g>
            {text(x + 180, ry + 30, name, { size: 18, weight: 700, anchor: "end" })}
            {values.map((v, i) => {
                const hit = marks && i < pilot.hits;
                return (
                    <g key={i} data-hit={hit ? "filled" : undefined}>
                        <rect x={cellX(i)} y={ry} width={44} height={44} fill={hit ? INK : "white"} stroke={INK} strokeWidth={2} />
                        {text(cellX(i) + 22, ry + 30, v, { size: v.length > 2 ? 15 : 22, weight: 700, anchor: "middle", fill: hit ? "white" : INK })}
                    </g>
                );
            })}
        </g>
    );
    return groupBox(x, y, w, h, title, (
        <>
            {text(x + 20, y + 80, "Name:", { size: 22, weight: 700 })}
            {pilot.name ? text(x + 100, y + 80, pilot.name, { size: 22 }) : blank(x + 100, y + 80, w - 120)}
            {text(x + 20, y + 125, "Gunnery Skill:", { size: 20, weight: 700 })}
            {pilot.gunnery !== undefined ? text(x + 170, y + 125, pilot.gunnery, { size: 22 }) : blank(x + 170, y + 125, 40)}
            {text(x + 240, y + 125, "Piloting Skill:", { size: 20, weight: 700 })}
            {pilot.piloting !== undefined ? text(x + 385, y + 125, pilot.piloting, { size: 22 }) : blank(x + 385, y + 125, 40)}
            {row(y + 155, "Hits Taken", AEROSPACE_PILOT_HITS.map((entry) => `${entry.hit}`), true)}
            {row(y + 210, "Consciousness #", AEROSPACE_PILOT_HITS.map((entry) => entry.consciousness), false)}
            {row(y + 265, "Modifier", AEROSPACE_PILOT_HITS.map((entry) => entry.modifier), false)}
        </>
    ));
};

/** The velocity record: turns 1-20 in two bands, with thrust, velocity, effective velocity and altitude to write in. */
// JumpShips and WarShips stay in space, so their sheet has no Altitude row.
export const velocityRecordBox = (x: number, y: number, w: number, h: number, altitude = true): JSX.Element => {
    const rows = ["Turn #", "Thrust", "Velocity", "Effective Velocity", ...(altitude ? ["Altitude"] : [])];
    const labelW = 220, cellH = 30;
    const cellW = (w - 40 - labelW) / 10;
    const cells: JSX.Element[] = [];
    for (let band = 0; band < 2; band++) {
        const by = y + 60 + band * 180;
        rows.forEach((name, r) => {
            cells.push(text(x + 25, by + r * cellH + 22, name, { size: 18, weight: 700 }, `l${band}-${r}`));
            cells.push(<rect key={`r${band}-${r}`} x={x + 20 + labelW} y={by + r * cellH} width={w - 40 - labelW} height={cellH} fill={r === 0 ? SHADE : "white"} stroke={INK} strokeWidth={1.5} />);
        });
        for (let i = 0; i < 10; i++) {
            const cx = x + 20 + labelW + i * cellW;
            cells.push(<line key={`c${band}-${i}`} x1={cx} y1={by} x2={cx} y2={by + rows.length * cellH} stroke={INK} strokeWidth={1.5} />);
            cells.push(text(cx + cellW / 2, by + 22, band * 10 + i + 1, { size: 18, anchor: "middle" }, `n${band}-${i}`));
        }
    }
    return groupBox(x, y, w, h, "VELOCITY RECORD", cells);
};

/** Heat data: the effects by heat level (TW p. 161), the heat sinks with their dissipation, and single or double. */
export const heatDataBox = (x: number, y: number, w: number, h: number, sinks: { count: number; dissipation: number; lost: number; double: boolean }): JSX.Element => {
    const rowH = (h - 130) / AEROSPACE_HEAT_SCALE.length;
    const perRow = 4, spacing = 28;
    // Many heat sinks (a Small Craft's) shrink to fit their column.
    const rowsNeeded = Math.ceil(sinks.count / perRow);
    const pitch = Math.min(spacing, 560 / Math.max(rowsNeeded, 1));
    return groupBox(x, y, w, h, "HEAT DATA", (
        <>
            {text(x + 20, y + 70, "Heat", { size: 18, weight: 700 })}
            {text(x + 20, y + 90, "Level*", { size: 18, weight: 700 })}
            {text(x + 95, y + 90, "Effects", { size: 20, weight: 700 })}
            {AEROSPACE_HEAT_SCALE.map((entry, i) => (
                <g key={entry.heat}>
                    {text(x + 50, y + 125 + i * rowH, entry.heat, { size: 18, anchor: "end" })}
                    {text(x + 62, y + 125 + i * rowH, entry.effect, { size: 18 })}
                </g>
            ))}
            {text(x + 440, y + 70, "Heat Sinks:", { size: 18, weight: 700, anchor: "middle" })}
            {text(x + 440, y + 100, `${sinks.count} (${sinks.dissipation})`, { size: 22, weight: 700, anchor: "middle" })}
            {Array.from({ length: sinks.count }, (_, i) => (
                <circle key={i} cx={x + 398 + (i % perRow) * spacing} cy={y + 130 + Math.floor(i / perRow) * pitch} r={Math.min(11, pitch * 0.4)}
                    fill={i < sinks.lost ? INK : "white"} stroke={INK} strokeWidth={1.5} />
            ))}
            {text(x + 400, y + h - 75, "Single", { size: 18 })}{checkbox(x + 465, y + h - 75)}
            {text(x + 400, y + h - 35, "Double", { size: 18 })}{checkbox(x + 465, y + h - 35)}
            {text(x + 477, sinks.double ? y + h - 36 : y + h - 76, "X", { size: 22, weight: 700, anchor: "middle" })}
        </>
    ));
};

/** The heat scale column: an Overflow box, then 30 down to 0, levels with an effect starred; heat in play filled. */
export const heatScaleColumn = (x: number, top: number, heat: number): JSX.Element => {
    const w = 120, rowH = 37;
    const starred = new Set(AEROSPACE_HEAT_SCALE.map((entry) => entry.heat));
    return (
        <g>
            {text(x + w / 2, top - 40, "Heat", { size: 22, weight: 700, anchor: "middle" })}
            {text(x + w / 2, top - 14, "Scale", { size: 22, weight: 700, anchor: "middle" })}
            <rect x={x} y={top} width={w} height={44} rx={10} fill={heat > 30 ? INK : "white"} stroke={INK} strokeWidth={2} />
            {text(x + w / 2, top + 28, "Overflow", { size: 18, anchor: "middle", fill: heat > 30 ? "white" : INK })}
            {Array.from({ length: 31 }, (_, i) => {
                const level = 30 - i;
                const ry = top + 52 + i * rowH;
                const lit = level <= heat && level > 0;
                return (
                    <g key={level}>
                        <rect x={x} y={ry} width={w} height={rowH} fill={lit ? INK : "white"} stroke={INK} strokeWidth={2} />
                        {text(x + w / 2, ry + 27, starred.has(level) ? `${level}*` : `${level}`, { size: 22, weight: 700, anchor: "middle", fill: lit ? "white" : INK })}
                    </g>
                );
            })}
        </g>
    );
};

/**
 * Crew data for a DropShip or larger craft: skills, the crew's hits with the modifier for each (the sixth
 * incapacitates), the people aboard (blank lines where the design does not say) and the life boats and escape pods.
 */
export const largeCraftCrewBox = (x: number, y: number, w: number, h: number, crew: {
    gunnery?: number; piloting?: number; hits: number; modifiers: string[]; people: [string, number | undefined][]; lifeBoats: number; escapePods: number;
}): JSX.Element => {
    const cellX = (i: number) => x + 140 + i * 52;
    const row = (ry: number, name: string, values: string[], marks: boolean) => (
        <g>
            {text(x + 130, ry + 30, name, { size: 18, weight: 700, anchor: "end" })}
            {values.map((value, i) => {
                const hit = marks && i < crew.hits;
                return (
                    <g key={i} data-hit={hit ? "filled" : undefined}>
                        <rect x={cellX(i)} y={ry} width={52} height={44} fill={hit ? INK : "white"} stroke={INK} strokeWidth={2} />
                        {text(cellX(i) + 26, ry + 30, value, { size: value.length > 2 ? 16 : 22, weight: 700, anchor: "middle", fill: hit ? "white" : INK })}
                    </g>
                );
            })}
        </g>
    );
    const boatsY = y + 230 + Math.ceil(crew.people.length / 2) * 34 + 16;
    return groupBox(x, y, w, h, "CREW DATA", (
        <>
            {text(x + 20, y + 75, "Gunnery Skill:", { size: 20, weight: 700 })}
            {crew.gunnery !== undefined ? text(x + 165, y + 75, crew.gunnery, { size: 22 }) : blank(x + 165, y + 75, 40)}
            {text(x + 235, y + 75, "Piloting Skill:", { size: 20, weight: 700 })}
            {crew.piloting !== undefined ? text(x + 380, y + 75, crew.piloting, { size: 22 }) : blank(x + 380, y + 75, 40)}
            {row(y + 95, "Hits Taken", crew.modifiers.map((_, i) => `${i + 1}`), true)}
            {row(y + 139, "Modifier", crew.modifiers, false)}
            {crew.people.map(([name, value], i) => {
                const px = x + 20 + (i % 2) * 225, py = y + 230 + Math.floor(i / 2) * 34;
                return (
                    <g key={name}>
                        {text(px, py, name, { size: 18, weight: 700 })}
                        {value !== undefined ? text(px + 200, py, value.toLocaleString("en-US"), { size: 20, anchor: "end" }) : blank(px + 130, py, 70)}
                    </g>
                );
            })}
            {text(x + 20, boatsY, "Life Boats/Escape Pods:", { size: 18, weight: 700 })}
            {text(x + 260, boatsY, `${crew.lifeBoats}/${crew.escapePods}`, { size: 20 })}
        </>
    ));
};

/**
 * Heat data for a DropShip or larger craft: the heat sinks with their dissipation, single or double, and the heat
 * each arc makes firing everything in it. These craft have no heat scale (TM p.199; SO:AA p.11).
 */
export const heatPerArcBox = (x: number, y: number, w: number, h: number, sinks: { count: number; dissipation: number; double: boolean; arcs: [string, number][] }): JSX.Element =>
    groupBox(x, y, w, h, "HEAT DATA", (
        <>
            {text(x + 20, y + 75, "Heat Sinks:", { size: 20, weight: 700 })}
            {text(x + 20, y + 110, `${sinks.count.toLocaleString("en-US")} (${sinks.dissipation.toLocaleString("en-US")})`, { size: 22, weight: 700 })}
            {text(x + 20, y + 165, "Single", { size: 18 })}{checkbox(x + 90, y + 165)}
            {text(x + 20, y + 205, "Double", { size: 18 })}{checkbox(x + 90, y + 205)}
            {text(x + 102, sinks.double ? y + 204 : y + 164, "X", { size: 22, weight: 700, anchor: "middle" })}
            {text(x + 165, y + 75, "Heat Generation Per Arc", { size: 20, weight: 700 })}
            {sinks.arcs.map(([name, heat], i) => {
                const ax = x + 165 + (i % 2) * 240, ay = y + 110 + Math.floor(i / 2) * 36;
                return (
                    <g key={name}>
                        {text(ax, ay, `${name}:`, { size: 17 })}
                        {text(ax + 205, ay, heat.toLocaleString("en-US"), { size: 20, weight: 700, anchor: "end" })}
                    </g>
                );
            })}
        </>
    ));
