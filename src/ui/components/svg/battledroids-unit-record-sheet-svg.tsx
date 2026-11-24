import React, { type JSX } from 'react';
import BattledroidsUnit from '../../../classes/battledroids-unit';
import { battledroidsRulesTables } from '../../../data/battledroids-rules';
import { BattledroidsArmorLocation } from '../../../data/battledroids-units';
import { getClusterHitsPerRoll } from '../../../utils';
import { DOC_HEIGHT, DOC_WIDTH, INK, SHADE, checkbox, groupBox, rollTable, sheetFooter, text, titleBanner, wrapText } from './record-sheet-svg-kit';

// A full-page record sheet for the tanks, jeeps and infantry of Expert Battledroids (BD pp.22-23). The book prints
// none for them, so this follows its droid record sheet: two units to a page, each with an armor diagram (or damage
// boxes), its data and its weapons, and the rules the book gives the unit; the right column carries what the book's
// tables sheet gives a player firing them. Our own title block and silhouettes; no official art; the BattleTech logo is in the shared footer.

const UNIT = { x: 25, w: 1280, h: 1150 };
const UNIT_Y = [140, 1310];
const RIGHT = { x: 1325, w: 650 };
const TOP = 140;
const BOTTOM = 2460;
const BOX = 24;

const MISSILES_FIRED = [2, 4, 5, 6, 10, 15, 20];

// Tank Hit Locations, BD p.22: two dice, by the side the attack comes from.
const TANK_HIT_LOCATIONS = {
    columns: ["Front/Back", "Side"],
    rows: [
        { roll: "2-3", cells: ["Tracks", "Tracks"] },
        { roll: "4", cells: ["Armor", "Tracks"] },
        { roll: "5-9", cells: ["Armor", "Armor"] },
        { roll: "10-12", cells: ["Turret", "Turret"] },
    ],
};

// The rules tables a unit's player needs, as the play screen's reference panel gives them.
const RULES_TABLES = ["To-Hit Number", "Movement Modifiers", "Terrain Modifiers", "Targets Other Than Battledroids"];

export default class BattledroidsUnitRecordSheetSVG extends React.Component<IBattledroidsUnitRecordSheetSVGProps> {
    /** A row of boxes to mark off, the lost ones filled when damage is shown. */
    renderBoxes(x: number, y: number, total: number, left: number, perRow: number, key: string): JSX.Element[] {
        return Array.from({ length: total }, (_unused, i) => (
            <rect key={`${key}${i}`} x={x + (i % perRow) * (BOX + 4)} y={y + Math.floor(i / perRow) * (BOX + 4)} width={BOX} height={BOX}
                fill={this.props.showDamage && i >= left ? INK : "white"} stroke={INK} strokeWidth={2} />
        ));
    }

    renderArmorLocation(unit: BattledroidsUnit, location: BattledroidsArmorLocation, x: number, y: number, perRow: number, label: string, labelAt: "above" | "below"): JSX.Element {
        const points = unit.getArmor(location);
        const left = unit.getArmorLeft(location);
        const rows = Math.ceil(points / perRow);
        const w = Math.min(points, perRow) * (BOX + 4) - 4;
        return (
            <g data-testid={`armor-${location}`} data-points={points} data-left={this.props.showDamage ? left : undefined}>
                {text(x + w / 2, labelAt === "above" ? y - 10 : y + rows * (BOX + 4) + 20, `${label} (${points})`, { size: 20, weight: 700, anchor: "middle" })}
                {this.renderBoxes(x, y, points, left, perRow, location)}
            </g>
        );
    }

    renderTankSilhouette(cx: number, top: number, turret: boolean): JSX.Element {
        // Seen from above: two tracks, the hull between them, and a turret with its gun or a raised casemate.
        return (
            <g data-testid="tank-silhouette" fill="white" stroke={INK} strokeWidth={3}>
                <rect x={cx - 120} y={top} width={44} height={300} rx={14} />
                <rect x={cx + 76} y={top} width={44} height={300} rx={14} />
                {Array.from({ length: 9 }, (_unused, i) => (
                    <g key={i}>
                        <line x1={cx - 120} y1={top + 30 + i * 30} x2={cx - 76} y2={top + 30 + i * 30} strokeWidth={1.5} />
                        <line x1={cx + 76} y1={top + 30 + i * 30} x2={cx + 120} y2={top + 30 + i * 30} strokeWidth={1.5} />
                    </g>
                ))}
                <path d={`M ${cx - 76} ${top + 30} L ${cx - 50} ${top + 10} L ${cx + 50} ${top + 10} L ${cx + 76} ${top + 30} L ${cx + 76} ${top + 290} L ${cx - 76} ${top + 290} Z`} />
                {turret ? (
                    <g>
                        <rect x={cx - 7} y={top - 45} width={14} height={120} rx={4} />
                        <circle cx={cx} cy={top + 125} r={50} />
                    </g>
                ) : (
                    <g>
                        <rect x={cx - 55} y={top + 50} width={110} height={130} rx={10} />
                        <circle cx={cx - 30} cy={top + 35} r={9} /><circle cx={cx} cy={top + 35} r={9} /><circle cx={cx + 30} cy={top + 35} r={9} />
                    </g>
                )}
            </g>
        );
    }

    renderArmorDiagram(unit: BattledroidsUnit, x: number, y: number, w: number, h: number): JSX.Element {
        const cx = x + w / 2;
        const top = y + 200;
        const turret = unit.getDesign().weapons.some((weapon) => /turret/i.test(weapon.arc));
        return groupBox(x, y, w, h, "ARMOR DIAGRAM", (
            <g>
                {this.renderArmorLocation(unit, "front", cx - 138, y + 90, 10, "Front", "above")}
                {this.renderTankSilhouette(cx, top, turret)}
                {this.renderArmorLocation(unit, "left", cx - 196, top + 70, 2, "Left", "below")}
                {this.renderArmorLocation(unit, "right", cx + 144, top + 70, 2, "Right", "below")}
                {this.renderArmorLocation(unit, "turret", cx - 68, top + 205, 5, "Turret", "below")}
                {this.renderArmorLocation(unit, "back", cx - 110, top + 330, 8, "Back", "below")}
            </g>
        ));
    }

    renderDamage(unit: BattledroidsUnit, x: number, y: number, w: number, h: number): JSX.Element {
        const kind = unit.getKind().kind;
        const total = unit.getDamageToDestroy();
        const cx = x + w / 2;
        const sy = y + 110;
        const silhouette = kind === "jeep" ? (
            // A jeep from above: body, bonnet, windscreen, four wheels and the gun mount.
            <g data-testid="jeep-silhouette" fill="white" stroke={INK} strokeWidth={3}>
                {[[-95, 20], [55, 20], [-95, 200], [55, 200]].map(([dx, dy]) => <rect key={`${dx}${dy}`} x={cx + dx} y={sy + dy} width={40} height={70} rx={10} />)}
                <rect x={cx - 70} y={sy} width={140} height={290} rx={22} />
                <line x1={cx - 70} y1={sy + 95} x2={cx + 70} y2={sy + 95} />
                <rect x={cx - 60} y={sy + 105} width={120} height={14} rx={4} />
                <circle cx={cx} cy={sy + 200} r={26} />
                <rect x={cx - 6} y={sy + 120} width={12} height={80} rx={3} />
            </g>
        ) : (
            // Three troopers of the squad, one carrying the squad's weapon.
            <g data-testid="infantry-silhouette" fill="white" stroke={INK} strokeWidth={3}>
                {[-110, 0, 110].map((dx) => (
                    <g key={dx}>
                        <circle cx={cx + dx} cy={sy + 40} r={26} />
                        <path d={`M ${cx + dx - 34} ${sy + 72} L ${cx + dx + 34} ${sy + 72} L ${cx + dx + 28} ${sy + 190} L ${cx + dx - 28} ${sy + 190} Z`} />
                        <line x1={cx + dx - 16} y1={sy + 190} x2={cx + dx - 22} y2={sy + 290} strokeWidth={10} />
                        <line x1={cx + dx + 16} y1={sy + 190} x2={cx + dx + 22} y2={sy + 290} strokeWidth={10} />
                    </g>
                ))}
                <rect x={cx + 60} y={sy + 90} width={110} height={18} rx={4} />
            </g>
        );
        const boxesW = total * (BOX + 12) - 12;
        const damage = this.props.showDamage ? unit.getDamage() : 0;
        return groupBox(x, y, w, h, "DAMAGE", (
            <g>
                {silhouette}
                <g data-testid="damage-boxes" data-boxes={total} data-marked={this.props.showDamage ? damage : undefined}>
                    {text(cx, y + h - 95, total === 1 ? "1 point of damage destroys the unit" : `Destroyed by the ${total}th point of damage`, { size: 22, weight: 700, anchor: "middle" })}
                    {Array.from({ length: total }, (_unused, i) => (
                        <rect key={i} x={cx - boxesW / 2 + i * (BOX + 12)} y={y + h - 70} width={BOX + 4} height={BOX + 4}
                            fill={i < damage ? INK : "white"} stroke={INK} strokeWidth={2} />
                    ))}
                </g>
            </g>
        ));
    }

    renderData(unit: BattledroidsUnit, x: number, y: number, w: number, h: number): JSX.Element {
        const kind = unit.getKind();
        const design = unit.getDesign();
        const label = (lx: number, ly: number, value: string) => text(lx, ly, value, { size: 24, weight: 700 });
        const value = (lx: number, ly: number, v: React.ReactNode) => text(lx, ly, v, { size: 24 });
        const mark = (mx: number, my: number, on: boolean) => (
            <g>{checkbox(mx, my)}{on ? text(mx + 12, my - 1, "X", { size: 22, weight: 700, anchor: "middle" }) : null}</g>
        );
        const lx = x + 30;
        const showDamage = this.props.showDamage;
        return groupBox(x, y, w, h, `${kind.name.toUpperCase()} DATA`, (
            <g>
                {label(lx, y + 80, "Type:")}{value(lx + 90, y + 80, unit.getDisplayName())}
                {unit.getDisplayName() !== design.name ? value(lx + 90, y + 112, design.name) : null}
                {label(lx, y + 150, "Movement Points:")}
                {value(lx + 30, y + 185, "Not firing:")}{value(lx + 230, y + 185, kind.movementPoints)}
                {value(lx + 30, y + 220, "Firing:")}{value(lx + 230, y + 220, kind.movementPointsFiring)}
                {label(lx, y + 265, "Attacks Against It:")}{value(lx + 250, y + 265, kind.toHitModifier > 0 ? `+${kind.toHitModifier} to hit` : "No modifier")}
                {text(x + w / 2, y + 320, "CREW", { size: 24, weight: 700, anchor: "middle" })}
                {label(lx, y + 360, "Gunnery Skill:")}{value(lx + 190, y + 360, unit.getGunnery())}
                {kind.armor ? (
                    <g>
                        {label(lx, y + 410, "Tracks:")}{mark(lx + 110, y + 410, !!showDamage && unit.isImmobilized())}
                        {value(lx + 150, y + 410, "Hit: the tank cannot move")}
                    </g>
                ) : null}
                {label(lx, y + 455, "Destroyed:")}{mark(lx + 150, y + 455, !!showDamage && unit.isDestroyed())}
                {wrapText(design.notes, Math.floor((w - 60) / 11)).slice(0, 3).map((line, i) => text(lx, y + 500 + i * 26, line, { size: 20, italic: true }, `n${i}`))}
            </g>
        ));
    }

    renderWeapons(unit: BattledroidsUnit, x: number, y: number, w: number, h: number): JSX.Element {
        const columns: [string, number, "start" | "middle"][] = [
            ["Weapon", 30, "start"], ["Arc", 400, "start"], ["Damage", 640, "middle"], ["Min", 790, "middle"],
            ["Short", 880, "middle"], ["Med", 970, "middle"], ["Long", 1060, "middle"], ["Shots", 1170, "middle"],
        ];
        const lines = unit.getWeaponLines();
        return groupBox(x, y, w, h, "WEAPONS", (
            <g>
                {columns.map(([title, cx, anchor]) => text(x + cx, y + 70, title, { size: 22, weight: 700, anchor }, title))}
                {lines.map((line, r) => {
                    const ry = y + 80 + r * 34;
                    const cells: React.ReactNode[] = [
                        line.name, line.arc, line.damage, line.range.min || "—", line.range.short, line.range.medium, line.range.long,
                        this.props.showDamage ? `${line.shotsLeft} of ${line.shots}` : line.shots,
                    ];
                    return (
                        <g key={line.line} data-testid="weapon-line">
                            {r % 2 === 0 ? <rect x={x + 20} y={ry} width={w - 40} height={34} fill={SHADE} /> : null}
                            {cells.map((cell, i) => text(x + columns[i][1], ry + 25, cell, { size: 22, anchor: columns[i][2] }, `c${i}`))}
                        </g>
                    );
                })}
            </g>
        ));
    }

    renderRules(unit: BattledroidsUnit, x: number, y: number, w: number, h: number): JSX.Element {
        const kind = unit.getKind();
        const width = Math.floor((w - 70) / 10.5);
        const paragraphs: [string, string][] = [["Stacking: ", kind.stacking], ["Movement: ", kind.movement], ...kind.combat.map((rule): [string, string] => ["• ", rule])];
        const out: JSX.Element[] = [];
        let ly = y + 70;
        paragraphs.forEach(([lead, body], p) => {
            wrapText(lead + body, width).forEach((line, i) => {
                if (ly > y + h - 20) return;
                out.push(text(x + 30, ly, line, { size: 21 }, `r${p}-${i}`));
                ly += 27;
            });
            ly += 4;
        });
        return groupBox(x, y, w, h, `${kind.name.toUpperCase()} RULES`, <g>{out}</g>);
    }

    renderUnit(unit: BattledroidsUnit, y: number): JSX.Element {
        const { x, w } = UNIT;
        const top = 580;
        return (
            <g key={unit.getUUID()} data-testid="battledroids-unit">
                {unit.getKind().armor ? this.renderArmorDiagram(unit, x, y, 620, top) : this.renderDamage(unit, x, y, 620, top)}
                {this.renderData(unit, x + 640, y, w - 640, top)}
                {this.renderWeapons(unit, x, y + top + 20, w, 200)}
                {this.renderRules(unit, x, y + top + 240, w, UNIT.h - top - 240)}
            </g>
        );
    }

    /** One of the book's rules tables: the case on the left, what it does on the right. */
    renderRulesTable(title: string, y: number): { element: JSX.Element; height: number } {
        const table = battledroidsRulesTables.find((t) => t.title === title)!;
        const rows: JSX.Element[] = [];
        let ry = y + 50;
        table.rows.forEach(([key, value], r) => {
            const keyLines = wrapText(key, 24);
            const valueLines = wrapText(value, 30);
            const rowH = Math.max(keyLines.length, valueLines.length) * 24 + 10;
            rows.push(
                <g key={key}>
                    {r % 2 === 0 ? <rect x={RIGHT.x + 15} y={ry} width={RIGHT.w - 30} height={rowH} fill={SHADE} /> : null}
                    {keyLines.map((line, i) => text(RIGHT.x + 25, ry + 23 + i * 24, line, { size: 20, weight: 700 }, `k${i}`))}
                    {valueLines.map((line, i) => text(RIGHT.x + 300, ry + 23 + i * 24, line, { size: 20 }, `v${i}`))}
                </g>,
            );
            ry += rowH;
        });
        const height = ry - y + 20;
        return { element: <g key={title}>{groupBox(RIGHT.x, y, RIGHT.w, height, title.toUpperCase(), rows)}</g>, height };
    }

    renderMissileHitTable(y: number): { element: JSX.Element; height: number } {
        const rowH = 30;
        const firstW = 110;
        const columnW = (RIGHT.w - 40 - firstW) / MISSILES_FIRED.length;
        const cx = (i: number) => RIGHT.x + 20 + firstW + columnW * i + columnW / 2;
        const height = 120 + 11 * rowH;
        return {
            height,
            element: (
                <g key="missile">
                    {groupBox(RIGHT.x, y, RIGHT.w, height, "MISSILE HIT TABLE", (
                        <g>
                            {text((cx(0) + cx(MISSILES_FIRED.length - 1)) / 2, y + 60, "Number of Missiles Fired", { size: 22, weight: 700, anchor: "middle" })}
                            {text(RIGHT.x + 20 + firstW / 2, y + 90, "2D6 Roll", { size: 22, weight: 700, anchor: "middle" })}
                            {MISSILES_FIRED.map((fired, i) => text(cx(i), y + 90, fired, { size: 22, weight: 700, anchor: "middle" }, `h${fired}`))}
                            {Array.from({ length: 11 }, (_unused, r) => {
                                const roll = r + 2;
                                const hits = MISSILES_FIRED.map((fired) => getClusterHitsPerRoll(roll, fired));
                                const ry = y + 98 + r * rowH;
                                return (
                                    <g key={roll} data-testid="missile-hit" data-roll={roll} data-hits={hits.join(",")}>
                                        {r % 2 === 0 ? <rect x={RIGHT.x + 15} y={ry} width={RIGHT.w - 30} height={rowH} fill={SHADE} /> : null}
                                        {text(RIGHT.x + 20 + firstW / 2, ry + 23, roll, { size: 22, weight: 700, anchor: "middle" })}
                                        {hits.map((hit, i) => text(cx(i), ry + 23, hit, { size: 22, anchor: "middle" }, `m${i}`))}
                                    </g>
                                );
                            })}
                        </g>
                    ))}
                </g>
            ),
        };
    }

    /** The tank's firing arc (BD p.22): the two hexes straight ahead and the forward hex on either side. */
    renderFiringArc(y: number, h: number): JSX.Element {
        // As large as the box allows: three hexes tall, under the title and over the key.
        const r = Math.min(64, (h - 160) / (3 * Math.sqrt(3)));
        const hexW = r * 1.5;
        const hexH = r * Math.sqrt(3);
        const cx = RIGHT.x + RIGHT.w / 2;
        const baseY = y + h - 70 - hexH / 2;
        const hex = (hx: number, hy: number, shaded: boolean, key: string) => (
            <polygon key={key} fill={shaded ? "rgb(170,170,170)" : "white"} stroke={INK} strokeWidth={2}
                points={Array.from({ length: 6 }, (_unused, i) => `${hx + r * Math.cos((Math.PI / 3) * i)},${hy + r * Math.sin((Math.PI / 3) * i)}`).join(" ")} />
        );
        // Flat-topped hexes: the tank's column of three, and two hexes in each column beside it.
        const cells: [number, number, boolean][] = [
            [cx, baseY, false], [cx, baseY - hexH, true], [cx, baseY - 2 * hexH, true],
            [cx - hexW, baseY - hexH / 2, false], [cx - hexW, baseY - 1.5 * hexH, true],
            [cx + hexW, baseY - hexH / 2, false], [cx + hexW, baseY - 1.5 * hexH, true],
        ];
        return (
            <g key="arc">
                {groupBox(RIGHT.x, y, RIGHT.w, h, "TANK FIRING ARC", (
                    <g>
                        {cells.map(([hx, hy, shaded], i) => hex(hx, hy, shaded, `x${i}`))}
                        <path d={`M ${cx} ${baseY - 28} L ${cx + 18} ${baseY + 22} L ${cx - 18} ${baseY + 22} Z`} fill={INK} />
                        {text(cx, y + h - 22, "Shaded: in arc. A turret fires in any direction.", { size: 20, anchor: "middle" })}
                    </g>
                ))}
            </g>
        );
    }

    renderTables(): JSX.Element {
        const parts: JSX.Element[] = [];
        let y = TOP;
        for (const title of RULES_TABLES) {
            const { element, height } = this.renderRulesTable(title, y);
            parts.push(element);
            y += height + 20;
        }
        const hitH = 60 + 4 * 34 + 30;
        parts.push(<g key="hit">{groupBox(RIGHT.x, y, RIGHT.w, hitH, "TANK HIT LOCATIONS", rollTable(TANK_HIT_LOCATIONS, RIGHT.x, y + 40, RIGHT.w, "", 34, 160))}</g>);
        y += hitH + 20;
        const missile = this.renderMissileHitTable(y);
        parts.push(missile.element);
        y += missile.height + 20;
        parts.push(this.renderFiringArc(y, BOTTOM - y));
        return <g>{parts}</g>;
    }

    render = (): JSX.Element => (
        <svg version="1.1" viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`} xmlns="http://www.w3.org/2000/svg" data-testid="battledroids-unit-record-sheet-svg">
            <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
            {titleBanner(25, DOC_WIDTH - 50, "BATTLEDROIDS UNIT RECORD SHEET")}
            {this.props.units.slice(0, 2).map((unit, i) => this.renderUnit(unit, UNIT_Y[i]))}
            {this.renderTables()}
            {sheetFooter("Tables: Battledroids (FASA 1984) pp.9-10, 15, 22-23 and its game tables sheet.")}
        </svg>
    );
}

interface IBattledroidsUnitRecordSheetSVGProps {
    /** One or two units; a sheet holds two. */
    units: BattledroidsUnit[];
    showDamage?: boolean;
}
