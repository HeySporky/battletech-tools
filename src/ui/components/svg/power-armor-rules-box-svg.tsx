import React, { type JSX } from 'react';
import { BattleMech } from '../../../classes/battlemech';
import { getPowerArmorBuildingRow, getPowerArmorSheetRules, POWER_ARMOR_RULES_CITE } from '../../../data/future-wars-power-armor';
import { breakLines } from '../../../utils/breakLines';

/**
 * Power Armor plan, Chunk C (#172): the suit's own row of the Building Effects Table and its play rules in short, for
 * the foot of the Weapons and Equipment box. Ours: the FW #14 sample sheets print neither (Best-of pp.14-16).
 */
const RULES_LINE_HEIGHT = 23;
/** The height of the box, as tall as its lines; the weapons table reserves it so a unit picture stays above the box (#95). */
export const powerArmorRulesBoxHeight = (mech: BattleMech): number =>
    86 + getPowerArmorSheetRules(mech.getTonnage()).flatMap(rule => breakLines(rule, 122)).length * RULES_LINE_HEIGHT + 14;

export default function PowerArmorRulesBoxSVG(props: { mech: BattleMech; xLoc: number; bottom: number; width: number; strokeColor: string; bgColor: string }): JSX.Element {
    const { mech, xLoc, bottom, width, strokeColor, bgColor } = props;
    const tons = mech.getTonnage();
    const row = getPowerArmorBuildingRow(tons);
    const left = xLoc + 15;
    const tableLeft = xLoc + 470;
    const column = 105;
    const lineHeight = RULES_LINE_HEIGHT;
    const lines = getPowerArmorSheetRules(tons).flatMap(rule => breakLines(rule, 122).map((line, index) => (index ? "    " : "• ") + line));
    // As tall as its lines, standing on the foot of the Weapons and Equipment box.
    const height = powerArmorRulesBoxHeight(mech);
    const yLoc = bottom - height;
    const signed = (value: number) => (value > 0 ? "+" : "") + value;
    return (
        <g data-testid="power-armor-box" fontFamily="sans-serif" fill={strokeColor}>
            <rect x={xLoc} y={yLoc} width={width} height={height} rx={15} ry={15} fill={bgColor} stroke={strokeColor} strokeWidth={2} />
            <text x={left} y={yLoc + 30} style={{ fontWeight: 700 }} fontSize={26}>POWER ARMOR</text>
            <text x={left} y={yLoc + 56} style={{ fontWeight: 700 }} fontSize={18}>BUILDING EFFECTS ({tons} TONS)</text>
            {row.map((cell, index) => (
                <text key={"b" + index} x={tableLeft + index * column} y={yLoc + 28} style={{ fontWeight: 700 }} fontSize={18}>{cell.building}</text>
            ))}
            {row.map((cell, index) => (
                <text key={"v" + index} x={tableLeft + index * column} y={yLoc + 54} fontSize={22}>{cell.mp}/{signed(cell.pilot)}</text>
            ))}
            <text x={tableLeft + row.length * column} y={yLoc + 28} fontSize={16}>MP to enter /</text>
            <text x={tableLeft + row.length * column} y={yLoc + 50} fontSize={16}>Piloting modifier</text>
            {lines.map((line, index) => (
                <text key={"r" + index} x={left} y={yLoc + 86 + index * lineHeight} fontSize={20}>{line}</text>
            ))}
            <text x={xLoc + width - 15} y={yLoc + height - 8} textAnchor="end" fontSize={14} style={{ fontStyle: "italic" }}>{POWER_ARMOR_RULES_CITE}</text>
        </g>
    );
}
