import React, { type JSX } from 'react';
import InfantryPlatoon, { INFANTRY_SPECIAL_FEATURES } from '../../../classes/infantry-platoon';
import {
    INFANTRY_BURST_FIRE_BATTLE_ARMOR, INFANTRY_BURST_FIRE_UNITS, INFANTRY_LEG_ATTACKS, INFANTRY_NON_INFANTRY_DAMAGE, INFANTRY_NON_INFANTRY_DAMAGE_NOTES,
    INFANTRY_SWARM_ATTACKS, INFANTRY_SWARM_ATTACK_MODIFIERS, INFANTRY_SWARM_SITUATION_MODIFIERS,
} from '../../../data/infantry-record-sheet';
import { DOC_HEIGHT, DOC_WIDTH, GRAY, INK, SHADE, blank, groupBox, sheetFooter, text, titleBanner, wrapText } from './record-sheet-svg-kit';

// A conventional infantry record sheet laid out like the Total Warfare and record sheet book ones: four platoon
// blocks, each with thirty numbered troopers and the Max Weapon Damage under each, the range modifiers out to the
// platoon's reach and its movement, then the anti-'Mech, non-infantry weapon and burst-fire damage tables. An
// oversized platoon takes a block for each sub-platoon (TM p.146). Blocks left over are left to write in. Excess
// troopers and range boxes beyond the platoon's reach are blacked out (TM p.156). Our own trooper figure.

export const INFANTRY_LINES_PER_PAGE = 4;
const MAX_TROOPERS = 30;
const MAX_RANGE = 21;

const X = 25;
const W = DOC_WIDTH - 2 * X;
const TOP = 140;
const BOTTOM = 2480;
const GAP = 20;
const BLOCK_H = 330;
const TABLES_TOP = TOP + INFANTRY_LINES_PER_PAGE * (BLOCK_H + GAP);

/** One record sheet line: a platoon, or one sub-platoon of an oversized one. */
export interface IInfantrySheetLine { platoon: InfantryPlatoon; line: number }

/** The sheet lines for a list of platoons: one for each platoon or sub-platoon, in order. */
export const infantrySheetLines = (platoons: InfantryPlatoon[]): IInfantrySheetLine[] =>
    platoons.flatMap((platoon) => platoon.getSubPlatoons().map((_troopers, line) => ({ platoon, line })));

const signed = (modifier: number): string => modifier > 0 ? `+${modifier}` : `${modifier}`;

/** Our trooper figure: a soldier at port arms. */
const trooperFigure = (x: number, y: number, fill: string): JSX.Element => (
    <g fill={fill}>
        <circle cx={x + 13} cy={y + 6} r={5.5} />
        <rect x={x + 7} y={y + 13} width={12} height={16} rx={3} />
        <rect x={x + 7} y={y + 29} width={5} height={15} />
        <rect x={x + 14} y={y + 29} width={5} height={15} />
        <line x1={x + 2} y1={y + 28} x2={x + 25} y2={y + 12} stroke={fill} strokeWidth={3} />
    </g>
);

/** Zebra rows under bold column headers. Columns are [x, anchor] pairs; returns the drawing. */
const rows = (x: number, y: number, w: number, columns: [number, "start" | "middle"][], cells: string[][], rowH: number, size = 19): JSX.Element => (
    <g>
        {cells.map((row, r) => (
            <g key={r}>
                {r % 2 === 0 ? <rect x={x} y={y + r * rowH} width={w} height={rowH} fill={SHADE} /> : null}
                {row.map((cell, c) => text(columns[c][0], y + r * rowH + rowH * 0.7, cell, { size, anchor: columns[c][1] }, `${r}-${c}`))}
            </g>
        ))}
    </g>
);

export default class InfantryRecordSheetSVG extends React.Component<IInfantryRecordSheetSVGProps> {
    notes(platoon: InfantryPlatoon): string[] {
        const secondary = platoon.getSecondaryWeapon();
        const notes = [
            `Weapons: ${platoon.getPrimaryWeapon().name}${secondary && platoon.getSecondaryPerSquad() > 0 ? `; ${secondary.name}, ${platoon.getSecondaryPerSquad()} per squad` : ""}. Range from ${platoon.getRangeWeapon().name}.`,
            ...platoon.getSpecialFeatures().map((code) => `${INFANTRY_SPECIAL_FEATURES[code]}.`),
            `Prohibited terrain: ${platoon.getMotive().prohibitedTerrain}.`,
            ...platoon.getNotes(),
        ];
        return notes;
    }

    renderLine(index: number, entry: IInfantrySheetLine | undefined): JSX.Element {
        const x = X, y = TOP + index * (BLOCK_H + GAP), w = W, h = BLOCK_H;
        const platoon = entry?.platoon;
        const lines = platoon ? platoon.getSubPlatoons() : [];
        const troopers = entry && platoon ? lines[entry.line] : MAX_TROOPERS;
        const active = entry && platoon && this.props.showDamage ? platoon.getLineTroopers(entry.line) : troopers;
        const modifiers = platoon ? platoon.getRangeModifiers() : [];
        const armor = platoon?.getArmor();
        const rx = x + 440, rw = w - 460, cellW = rw / MAX_TROOPERS;
        const rangeLabelW = 130, rangeW = (rw - rangeLabelW) / (MAX_RANGE + 1);
        const notes = platoon ? wrapText(this.notes(platoon).join(" "), 200).slice(0, 3) : [];

        const cells = Array.from({ length: MAX_TROOPERS }, (_, i) => {
            const number = MAX_TROOPERS - i;
            const cx = rx + i * cellW;
            const excess = !!platoon && number > troopers;
            const lost = !excess && !!platoon && number > active;
            return (
                <g key={number} data-testid={`inf-platoon-${index + 1}-trooper-${number}`} data-excess={excess ? "true" : undefined}>
                    <rect x={cx} y={y + 58} width={cellW} height={100} fill={excess ? INK : "white"} stroke={INK} strokeWidth={1.5} />
                    <line x1={cx} y1={y + 80} x2={cx + cellW} y2={y + 80} stroke={excess ? "white" : INK} strokeWidth={1} />
                    <line x1={cx} y1={y + 132} x2={cx + cellW} y2={y + 132} stroke={excess ? "white" : INK} strokeWidth={1} />
                    {excess ? null : (
                        <>
                            {text(cx + 4, y + 76, number, { size: 16 })}
                            {trooperFigure(cx + cellW / 2 - 13, y + 84, platoon && number <= troopers ? INK : GRAY)}
                            {lost ? (
                                <g data-hit="filled">
                                    <line x1={cx + 4} y1={y + 84} x2={cx + cellW - 4} y2={y + 130} stroke={INK} strokeWidth={4} />
                                    <line x1={cx + cellW - 4} y1={y + 84} x2={cx + 4} y2={y + 130} stroke={INK} strokeWidth={4} />
                                </g>
                            ) : null}
                            {platoon ? (
                                <g data-testid={`inf-platoon-${index + 1}-damage-${number}`} data-value={platoon.getDamageForTroopers(number)}>
                                    {text(cx + cellW / 2, y + 152, platoon.getDamageForTroopers(number), { size: 18, anchor: "middle" })}
                                </g>
                            ) : null}
                        </>
                    )}
                </g>
            );
        });

        const ranges = Array.from({ length: MAX_RANGE + 1 }, (_, range) => {
            const cx = rx + rangeLabelW + range * rangeW;
            const reach = platoon ? range < modifiers.length : undefined;
            return (
                <g key={range} data-testid={`inf-platoon-${index + 1}-range-${range}`} data-reach={reach === undefined ? undefined : String(reach)}>
                    <rect x={cx} y={y + 190} width={rangeW} height={56} fill={reach === false ? INK : "white"} stroke={INK} strokeWidth={1.5} />
                    {text(cx + rangeW / 2, y + 211, range, { size: 18, weight: 700, anchor: "middle", fill: reach === false ? "white" : INK })}
                    {reach ? text(cx + rangeW / 2, y + 239, signed(modifiers[range]), { size: 20, anchor: "middle" }) : null}
                </g>
            );
        });

        const field = (fx: number, fy: number, label: string, value: React.ReactNode, valueX: number, blankW: number) => (
            <g key={label}>
                {text(fx, fy, label, { size: 20, weight: 700 })}
                {platoon ? text(valueX, fy, value, { size: 20 }) : blank(valueX, fy, blankW)}
            </g>
        );
        const name = platoon ? platoon.getDisplayName() : "";
        const subtitle = platoon
            ? `${platoon.getMotive().name}, ${platoon.getTechName()} ${platoon.getFormation().name}${lines.length > 1 ? `, Sub-platoon ${entry!.line + 1} of ${lines.length}` : ""}`
            : "";

        return (
            <g key={index} data-testid={`inf-platoon-${index + 1}`} data-blank={platoon ? "false" : "true"}>
                {groupBox(x, y, w, h, `CONVENTIONAL INFANTRY: PLATOON/POINT ${index + 1}`, (
                    <>
                        {platoon ? text(x + 20, y + 82, name, { size: name.length > 30 ? 18 : 22, weight: 700 }) : blank(x + 20, y + 82, 400)}
                        {platoon ? text(x + 20, y + 108, subtitle, { size: subtitle.length > 44 ? 14 : 16, fill: GRAY }) : null}
                        {field(x + 20, y + 145, "Gunnery Skill:", platoon?.getGunnery(), x + 210, 60)}
                        {field(x + 20, y + 178, "Anti-'Mech Skill:", platoon?.getAntiMechSkill(), x + 210, 60)}
                        {field(x + 20, y + 211, "Armor:", armor ? armor.name : "None", x + 100, 300)}
                        {field(x + 20, y + 244, "Damage Divisor:", platoon ? `${platoon.getDamageDivisor()}${armor?.encumbering ? "E" : ""}` : "", x + 210, 60)}
                        {field(x + 20, y + 277, "Troopers:", `${troopers} (${platoon?.getSquads() ?? ""} squads of ${platoon?.getSquadSize() ?? ""} in all)`, x + 130, 270)}
                        {text(x + 20, y + 310, "Commander:", { size: 20, weight: 700 })}{blank(x + 150, y + 310, 250)}
                        {cells}
                        {text(rx, y + 178, "Max Weapon Damage under each trooper, always applied in 2-point groupings. Mark off troopers from the left, one a point of damage (two for mechanized).", { size: 14, fill: GRAY })}
                        {text(rx + rw, y + 182, "RANGE IN HEXES (TO-HIT MODIFIER)", { size: 16, weight: 700, anchor: "end" })}
                        {text(rx, y + 211, "Range:", { size: 18, weight: 700 })}
                        {text(rx, y + 239, "Modifier:", { size: 18, weight: 700 })}
                        {ranges}
                        {notes.map((note, i) => text(rx, y + 266 + i * 15, note, { size: 13, fill: GRAY }, `n${i}`))}
                        {field(rx, y + h - 14, "BV:", platoon ? `${platoon.getBattleValue()}${lines.length > 1 ? " (whole platoon)" : ""}` : "", rx + 45, 120)}
                        {field(rx + 330, y + h - 14, "Transport Wt:", platoon ? `${platoon.getWeight(troopers)} tons` : "", rx + 475, 120)}
                        {field(rx + 720, y + h - 14, "Movement MP:", platoon?.getMP(), rx + 870, 60)}
                        {field(rx + 1000, y + h - 14, "Type:", platoon ? `${platoon.getMotive().moveType}${platoon.isMoveOrFire() ? ", Move or Shoot" : ""}` : "", rx + 1070, 300)}
                    </>
                ))}
            </g>
        );
    }

    renderTables(): JSX.Element {
        const top = TABLES_TOP, colA = { x: X, w: 620 }, colB = { x: 665, w: 650 }, colC = { x: 1335, w: DOC_WIDTH - X - 1335 };
        const header = (hx: number, hy: number, label: string, anchor: "start" | "middle" = "middle", key?: string) => text(hx, hy, label, { size: 17, weight: 700, anchor }, key);
        const legH = 270, swarmH = 190, modifiersTop = top + legH + swarmH + 2 * GAP;
        const burst = (title: string, entries: [string, string][], by: number) => (
            <g>
                {text(colC.x + 20, by, title, { size: 18, weight: 700, italic: true })}
                {header(colC.x + 20, by + 28, "WEAPON", "start")}{header(colC.x + colC.w - 150, by + 28, "DAMAGE VS. CONV. INF.")}
                {rows(colC.x + 15, by + 36, colC.w - 30, [[colC.x + 20, "start"], [colC.x + colC.w - 150, "middle"]], entries.map(([weapon, damage]) => [weapon, damage]), 30, 18)}
            </g>
        );
        return (
            <g>
                {groupBox(colA.x, top, colA.w, legH, "LEG ATTACKS TABLE", (
                    <>
                        {header(colA.x + 170, top + 75, "ACTIVE TROOPERS")}{header(colA.x + 460, top + 75, "ATTACK MODIFIER")}
                        {rows(colA.x + 15, top + 85, colA.w - 30, [[colA.x + 170, "middle"], [colA.x + 460, "middle"]], INFANTRY_LEG_ATTACKS, 34)}
                    </>
                ))}
                {groupBox(colA.x, top + legH + GAP, colA.w, swarmH, "SWARM ATTACKS TABLE", (
                    <>
                        {header(colA.x + 170, top + legH + GAP + 75, "ACTIVE TROOPERS")}{header(colA.x + 460, top + legH + GAP + 75, "ATTACK MODIFIER")}
                        {rows(colA.x + 15, top + legH + GAP + 85, colA.w - 30, [[colA.x + 170, "middle"], [colA.x + 460, "middle"]], INFANTRY_SWARM_ATTACKS, 34)}
                    </>
                ))}
                {groupBox(colA.x, modifiersTop, colA.w, BOTTOM - modifiersTop, "SWARM ATTACK MODIFIERS TABLE", (
                    <>
                        {header(colA.x + 20, modifiersTop + 70, "ACTIVE", "start")}{header(colA.x + 20, modifiersTop + 90, "TROOPERS", "start")}
                        {header(colA.x + 400, modifiersTop + 70, "FRIENDLY MECHANIZED BATTLE")}{header(colA.x + 400, modifiersTop + 90, "ARMOR TROOPERS ACTIVE")}
                        {[1, 2, 3, 4, 5, 6].map((n, i) => header(colA.x + 210 + i * 76, modifiersTop + 115, `${n}`, "middle", `m${n}`))}
                        {rows(colA.x + 15, modifiersTop + 123, colA.w - 30, [[colA.x + 20, "start"], ...[0, 1, 2, 3, 4, 5].map((i): [number, "middle"] => [colA.x + 210 + i * 76, "middle"])],
                            INFANTRY_SWARM_ATTACK_MODIFIERS.map(([troopers, modifiers]) => [troopers, ...modifiers]), 32)}
                        {header(colA.x + 20, modifiersTop + 310, "SITUATION*", "start")}
                        {INFANTRY_SWARM_SITUATION_MODIFIERS.map(([situation, modifier], i) => (
                            <g key={situation}>{text(colA.x + 20, modifiersTop + 334 + i * 24, situation, { size: 18 })}{text(colA.x + 420, modifiersTop + 334 + i * 24, modifier, { size: 18 })}</g>
                        ))}
                        {text(colA.x + 20, BOTTOM - 34, "*Modifiers are cumulative.", { size: 14, fill: GRAY })}
                        {text(colA.x + 20, BOTTOM - 15, "**Also used for friendly battle armor mounting a unit swarmed by 15 or fewer troopers.", { size: 14, fill: GRAY })}
                    </>
                ))}
                {groupBox(colB.x, top, colB.w, 600, "NON-INFANTRY WEAPON DAMAGE AGAINST INFANTRY TABLE", (
                    <>
                        {header(colB.x + 20, top + 75, "WEAPON TYPE*", "start")}{header(colB.x + 500, top + 64, "CONVENTIONAL")}{header(colB.x + 500, top + 84, "TROOPERS HIT")}
                        {rows(colB.x + 15, top + 92, colB.w - 30, [[colB.x + 20, "start"], [colB.x + 500, "middle"]], INFANTRY_NON_INFANTRY_DAMAGE, 32, 18)}
                        {INFANTRY_NON_INFANTRY_DAMAGE_NOTES.flatMap((note) => wrapText(note, 82)).map((line, i) => text(colB.x + 20, top + 372 + i * 19, line, { size: 14, fill: GRAY }, `f${i}`))}
                    </>
                ))}
                {groupBox(colB.x, top + 600 + GAP, colB.w, BOTTOM - top - 600 - GAP, "DAMAGE TO CONVENTIONAL INFANTRY", (
                    <>
                        {[
                            "Clear terrain: infantry hit in Clear terrain, or any terrain with no to-hit modifier, take double damage, from any weapon.",
                            "Other infantry: damage from conventional infantry is always the full Damage Value; the Non-Infantry Weapon table does not reduce it.",
                            "Burst-fire: roll the dice on the Burst-Fire table; battle armor rolls once for each hit on the Cluster Hits Table.",
                            "Buildings: burst-fire weapons against infantry in a building hex use their standard Damage Value, as direct-fire ballistic weapons.",
                        ].flatMap((note) => wrapText(note, 74)).map((line, i) => text(colB.x + 20, top + 600 + GAP + 75 + i * 22, line, { size: 16 }, `d${i}`))}
                        {text(colB.x + 20, BOTTOM - 20, "TW p.216.", { size: 14, fill: GRAY })}
                    </>
                ))}
                {groupBox(colC.x, top, colC.w, BOTTOM - top, "BURST-FIRE WEAPON DAMAGE VS. CONVENTIONAL INFANTRY TABLE", (
                    <>
                        {burst("BattleMechs, ProtoMechs and Vehicles", INFANTRY_BURST_FIRE_UNITS, top + 75)}
                        {burst("Battle Armor*", INFANTRY_BURST_FIRE_BATTLE_ARMOR, top + 340)}
                        {wrapText("*A burst-fire battle armor weapon not listed here, such as the small pulse laser, uses the BattleMechs, ProtoMechs and Vehicles damage.", 78)
                            .map((line, i) => text(colC.x + 20, BOTTOM - 45 + i * 19, line, { size: 14, fill: GRAY }, `b${i}`))}
                    </>
                ))}
            </g>
        );
    }

    render = (): JSX.Element => {
        const lines = this.props.lines.slice(0, INFANTRY_LINES_PER_PAGE);
        return (
            <svg
                version="1.1"
                viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`}
                xmlns="http://www.w3.org/2000/svg"
                data-testid="infantry-record-sheet-svg"
            >
                <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
                {titleBanner(X, W, "CONVENTIONAL INFANTRY RECORD SHEET")}
                {Array.from({ length: INFANTRY_LINES_PER_PAGE }, (_, i) => this.renderLine(i, lines[i]))}
                {this.renderTables()}
                {sheetFooter("Tables: TW pp. 216-217, 221.")}
            </svg>
        );
    }
}

interface IInfantryRecordSheetSVGProps {
    /** One to four platoons or sub-platoons; blocks left over print blank. */
    lines: IInfantrySheetLine[];
    showDamage?: boolean;
}
