import React, { type JSX } from 'react';
import Walker from '../../../classes/walker';
import { getUnitRulesets } from '../../../classes/unit-game-settings';
import { WALKER_HIT_TABLE, type WalkerLocation } from '../../../data/walker-construction';
import { getCriticalTables } from '../../../utils/critical-tables';
import { HEAT_SCALE } from './battledroids-mech-record-sheet-svg';
import { weaponDamageText } from './vehicle-record-sheet-svg';
import { DOC_HEIGHT, DOC_WIDTH, GRAY, INK, SHADE, blank, groupBox, sheetFooter, text, titleBanner, wrapText } from './record-sheet-svg-kit';

// A walker (four-legged 'Mech) record sheet, one design to a page. Our own layout and drawing, after the structure of a
// BattleMech sheet: a plan view of the ten locations (the walker faces up) with armor and structure circles, the
// critical hit tables in sixes with die numbers, the hit location table (Best-of p.36), the six firing arcs, the heat
// scale, six pilot hit boxes, the weapons and the credit. Every box carries a test id so the play mode (Chunk F) can
// fill them: `walker-armor-<location>-<n>` (n from 1, hit from the outside in), `walker-structure-<location>-<n>`,
// `walker-slot-<location>-<n>`, `walker-pilot-<n>`.

const X = 25;
const W = DOC_WIDTH - 2 * X;
const LEFT = { x: X, w: 860 };
const RIGHT = { x: 920, w: 1055 };
const CONSCIOUSNESS = ["3", "5", "7", "10", "11", "Dead"];
const PITCH = 24;

/** Short names for the weapons table and the slot lists. */
const SHORT: Record<WalkerLocation, string> = {
    cs: "CS", ft: "FT", lt: "LT", ct: "CT", rt: "RT", rrt: "RR", lfl: "LFL", rfl: "RFL", lrl: "LRL", rrl: "RRL",
};

/** The plan view's grid: the walker faces up; a leg at each corner, the torsos around the center torso. */
const PLAN: (WalkerLocation | null)[][] = [
    [null, "cs", null],
    ["lfl", "ft", "rfl"],
    ["lt", "ct", "rt"],
    ["lrl", "rrt", "rrl"],
];

/** The slot tables, two locations to a row. */
const SLOT_ROWS: [WalkerLocation, WalkerLocation][] = [["cs", "ct"], ["ft", "rrt"], ["lt", "rt"], ["lfl", "rfl"], ["lrl", "rrl"]];

export default class WalkerRecordSheetSVG extends React.Component<IWalkerRecordSheetSVGProps> {
    /** Round boxes, armor white and structure gray, wrapped at `perRow`. */
    renderCircles(prefix: string, x: number, y: number, count: number, perRow: number, fill: string): { element: JSX.Element; height: number } {
        const rows = count === 0 ? 0 : Math.ceil(count / perRow);
        return {
            height: rows * PITCH,
            element: (
                <g>
                    {Array.from({ length: count }, (_, i) => (
                        <circle key={i} data-testid={`${prefix}-${i + 1}`} cx={x + (i % perRow) * PITCH + PITCH / 2} cy={y + Math.floor(i / perRow) * PITCH + PITCH / 2} r={PITCH / 2 - 2.5}
                            fill={fill} stroke={INK} strokeWidth={1.4} />
                    ))}
                </g>
            ),
        };
    }

    renderArmorBox(walker: Walker): JSX.Element {
        const x = RIGHT.x, y = 140, w = RIGHT.w, h = 900;
        const cellW = (w - 40) / 3;
        const perRow = Math.floor((cellW - 16) / PITCH);
        const rowH = (h - 130) / PLAN.length;
        const cell = (location: WalkerLocation, cx: number, cy: number): JSX.Element => {
            const armor = walker.getArmor(location);
            const structure = walker.getStructure(location);
            const armorCircles = this.renderCircles(`walker-armor-${location}`, cx + 8, cy + 56, armor, perRow, "white");
            const structureCircles = this.renderCircles(`walker-structure-${location}`, cx + 8, cy + 62 + armorCircles.height, structure, perRow, "rgb(170,170,170)");
            const turret = location === "cs" && walker.hasTurret();
            return (
                <g key={location} data-testid={`walker-location-${location}`} data-armor={armor} data-structure={structure}>
                    <rect x={cx} y={cy} width={cellW - 8} height={rowH - 8} rx={10} fill="white" stroke={INK} strokeWidth={2} />
                    {text(cx + 10, cy + 28, walker.getLocationName(location), { size: 21, weight: 700 })}
                    {text(cx + 10, cy + 48, `Armor ${armor}, structure ${structure}${turret ? ", turret" : ""}`, { size: 15, fill: GRAY })}
                    {armorCircles.element}
                    {structureCircles.element}
                </g>
            );
        };
        return (
            <g data-testid="walker-armor-box">
                {groupBox(x, y, w, h, "ARMOR AND INTERNAL STRUCTURE", (
                    <>
                        {PLAN.map((row, r) => row.map((location, c) => {
                            const cx = x + 20 + c * cellW;
                            const cy = y + 62 + r * rowH;
                            if (location) return cell(location, cx, cy);
                            if (r === 0 && c === 0) {
                                return (
                                    <g key="legend">
                                        {text(cx + 8, cy + 30, "Top of the page is the front.", { size: 17, fill: GRAY })}
                                        {text(cx + 8, cy + 56, "Legs at the corners; the four", { size: 17, fill: GRAY })}
                                        {text(cx + 8, cy + 78, "outer torsos round the center.", { size: 17, fill: GRAY })}
                                    </g>
                                );
                            }
                            return (
                                <g key="legend2">
                                    {text(cx + 8, cy + 30, walker.hasTurret() ? "The turret counts as the" : "No turret.", { size: 17, fill: GRAY })}
                                    {walker.hasTurret() ? text(cx + 8, cy + 52, "control section for damage.", { size: 17, fill: GRAY }) : null}
                                </g>
                            );
                        }))}
                        {text(x + w - 20, y + h - 16, "White: armor. Gray: internal structure.", { size: 16, anchor: "end", fill: GRAY })}
                    </>
                ))}
            </g>
        );
    }

    renderSlotBox(walker: Walker, location: WalkerLocation, x: number, y: number, w: number, rowH: number): JSX.Element {
        const slots = walker.getSlots(location);
        const tables = getCriticalTables(slots.length);
        const colW = (w - 16) / Math.max(1, tables.length);
        const h = 40 + 6 * rowH + 10;
        return (
            <g key={location} data-testid={`walker-slots-${location}`} data-slots={slots.length}>
                <rect x={x} y={y} width={w} height={h} rx={10} fill="white" stroke={INK} strokeWidth={2} />
                {text(x + 12, y + 28, `${walker.getLocationName(location)} (${slots.length})`, { size: 21, weight: 700 })}
                {tables.map((table, t) => {
                    const sx = x + 8 + t * colW;
                    return Array.from({ length: table.length }, (_, row) => {
                        const index = table.start + row;
                        const slot = slots[index];
                        const sy = y + 40 + row * rowH;
                        const label = `${row + 1}. ${slot ?? ""}`;
                        const size = Math.max(12, Math.min(18, Math.floor((colW - 40) / (Math.max(label.length, 8) * 0.52))));
                        return (
                            <g key={index} data-testid={`walker-slot-${location}-${index + 1}`} data-item={slot ?? undefined}>
                                <line x1={sx} x2={sx + colW - 6} y1={sy} y2={sy} stroke={row === 0 ? INK : GRAY} strokeWidth={row === 0 ? 2.5 : 1} />
                                {row === 0 && table.label ? text(sx + 2, sy + rowH - 9, table.label, { size: 13, weight: 700, fill: GRAY }, `d${index}`) : null}
                                {text(sx + (table.label ? 34 : 4), sy + rowH - 9, label, { size }, `s${index}`)}
                            </g>
                        );
                    });
                })}
            </g>
        );
    }

    renderSlots(walker: Walker): JSX.Element {
        const x = RIGHT.x, y = 1060, w = RIGHT.w, h = 1420;
        const rowH = 26;
        const boxH = 40 + 6 * rowH + 10;
        const gap = 14;
        const half = (w - 24 - gap) / 2;
        // Two locations to a row; one with three tables (a long control section or center torso) takes a row of its own, so its
        // columns are wide enough to read.
        const wide = (location: WalkerLocation): boolean => getCriticalTables(walker.getSlotCount(location)).length > 2;
        const rows: WalkerLocation[][] = SLOT_ROWS.flatMap(([a, b]) => wide(a) || wide(b) ? [[a], [b]] : [[a, b]]);
        return (
            <g data-testid="walker-slots-box">
                {groupBox(x, y, w, h, "CRITICAL HIT TABLES", (
                    <>
                        {rows.map((row, r) => (
                            <g key={row[0]}>
                                {row.map((location, c) => this.renderSlotBox(walker, location, x + 12 + c * (half + gap), y + 50 + r * (boxH + gap), row.length === 1 ? w - 24 : half, rowH))}
                            </g>
                        ))}
                        {wrapText("Roll 1D6 for the table where a location has more than one (the die numbers by each), then 1D6 for the line. A line that holds nothing, or lies past the end of a short table, is rolled again.", 105)
                            .map((line, i) => text(x + 20, y + 50 + rows.length * (boxH + gap) + 12 + i * 22, line, { size: 17, fill: GRAY }, `n${i}`))}
                    </>
                ))}
            </g>
        );
    }

    renderData(walker: Walker): JSX.Element {
        const { x, w } = LEFT;
        const y = 140, h = 330;
        const field = (fx: number, fy: number, label: string, value: React.ReactNode, valueX: number, testid?: string) => (
            <g key={label}>
                {text(fx, fy, label, { size: 22, weight: 700 })}
                {text(valueX, fy, value, { size: 22, testid })}
            </g>
        );
        const totalSlots = walker.getLocations().reduce((sum, location) => sum + walker.getSlotCount(location), 0);
        const usedSlots = walker.getLocations().reduce((sum, location) => sum + walker.getSlots(location).filter((slot) => slot !== null).length, 0);
        return (
            <g data-testid="walker-data-box">
                {groupBox(x, y, w, h, walker.isIndustrial() ? "INDUSTRIAL WALKER DATA" : "WALKER DATA", (
                    <>
                        {field(x + 20, y + 80, "Type:", walker.getDisplayName(), x + 90, "walker-name")}
                        {field(x + 20, y + 118, "Tonnage:", `${walker.getTons()}${walker.isIndustrial() ? " (industrial)" : ""}`, x + 130)}
                        {field(x + 470, y + 118, "Engine:", `${walker.getEngineName()} ${walker.getEngineRating()}`, x + 560)}
                        {field(x + 20, y + 156, "Walk / Run / Jump:", `${walker.getWalkerWalkMP()} / ${walker.getRunMP()} / ${walker.getJumpMP()}`, x + 250, "walker-movement")}
                        {field(x + 470, y + 156, "Heat sinks:", walker.getHeatSinks(), x + 600)}
                        {field(x + 20, y + 194, "Weight:", `${walker.getWeight()} of ${walker.getTons()} tons`, x + 120)}
                        {field(x + 470, y + 194, "Slots:", `${usedSlots} of ${totalSlots}`, x + 560)}
                        {field(x + 20, y + 232, "Battle Value:", `${walker.getBattleValue().toLocaleString("en-US")} (provisional)`, x + 190, "walker-bv")}
                        {field(x + 20, y + 270, "Cost:", `${walker.getCBillCost().toLocaleString("en-US")} C-bills`, x + 90, "walker-cost")}
                        {text(x + 20, y + 306, `Rules: ${walker.getEditionRules().name}. Era: ${walker.getEra().name}. ${walker.isLegal() ? "" : "NOT LEGAL: see the creator's summary."}`, { size: 17, fill: GRAY })}
                        {text(x + 470, y + 80, `Walk is the biped Walk x 1.25 (${walker.getWalkMP()} as a biped)`, { size: 15, fill: GRAY })}
                    </>
                ))}
            </g>
        );
    }

    renderWeapons(walker: Walker): JSX.Element {
        const { x, w } = LEFT;
        const y = 490, h = 560;
        const col = { loc: x + 330, heat: x + 420, dmg: x + 495, min: x + 590, sht: x + 645, med: x + 700, lng: x + 755, ammo: x + 815 };
        const weapons = walker.getEquipment().filter((each) => !each.isAmmo);
        const ammo = walker.getAmmo();
        const rowH = Math.min(34, (h - 170) / Math.max(8, weapons.length + ammo.length + 1));
        let r = 0;
        const rows: JSX.Element[] = [];
        const where = (each: { location: WalkerLocation; inTurret: boolean; split?: { location: WalkerLocation } }): string =>
            `${SHORT[each.location]}${each.split ? `+${SHORT[each.split.location]}` : ""}${each.inTurret ? " (T)" : ""}`;
        weapons.forEach((each, index) => {
            const ry = y + 136 + r * rowH;
            const ranged = !each.item.isEquipment && (each.item.range?.long ?? 0) > 0;
            const range = (n: number | undefined) => ranged && n ? `${n}` : "—";
            rows.push(
                <g key={`w${index}`} data-testid={`walker-weapon-${index + 1}`}>
                    {r % 2 === 0 ? <rect x={x + 10} y={ry - rowH + 10} width={w - 20} height={rowH} fill={SHADE} /> : null}
                    {text(x + 18, ry, `${each.name}${each.antiInfantryOnly ? " *" : ""}`, { size: each.name.length > 26 ? 16 : 19 })}
                    {text(col.loc, ry, where(each), { size: 17, anchor: "middle" })}
                    {text(col.heat, ry, each.item.isEquipment ? "—" : each.heat, { size: 18, anchor: "middle" })}
                    {text(col.dmg, ry, weaponDamageText(each.item), { size: 15, anchor: "middle" })}
                    {text(col.min, ry, range(each.item.range?.min), { size: 18, anchor: "middle" })}
                    {text(col.sht, ry, range(each.item.range?.short), { size: 18, anchor: "middle" })}
                    {text(col.med, ry, range(each.item.range?.medium), { size: 18, anchor: "middle" })}
                    {text(col.lng, ry, range(each.item.range?.long), { size: 18, anchor: "middle" })}
                </g>,
            );
            r++;
        });
        ammo.forEach((each, index) => {
            const ry = y + 136 + r * rowH;
            const shots = Math.floor(each.weight * (each.item.shotsPerTon ?? 0));
            rows.push(
                <g key={`a${index}`} data-testid={`walker-ammo-${index + 1}`}>
                    {text(x + 18, ry, `Ammo: ${each.name}, ${each.weight} t`, { size: 17, fill: GRAY })}
                    {text(col.loc, ry, where(each), { size: 17, anchor: "middle", fill: GRAY })}
                    {text(col.ammo, ry, shots || "", { size: 18, anchor: "middle", fill: GRAY })}
                </g>,
            );
            r++;
        });
        const edition = walker.getEditionRules();
        return (
            <g data-testid="walker-weapons-box">
                {groupBox(x, y, w, h, "WEAPONS AND AMMUNITION", (
                    <>
                        {text(x + 18, y + 100, "Type", { size: 18, weight: 700 })}
                        {([["Location", col.loc], ["Heat", col.heat], ["Damage", col.dmg], ["Min", col.min], ["Sht", col.sht], ["Med", col.med], ["Lng", col.lng], ["Shots", col.ammo]] as [string, number][])
                            .map(([label, lx]) => text(lx, y + 100, label, { size: 17, weight: 700, anchor: "middle" }, label))}
                        {rows}
                        {weapons.length === 0 ? <g>{Array.from({ length: 6 }, (_, i) => blank(x + 18, y + 130 + i * 40, w - 40, `l${i}`))}</g> : null}
                        {text(x + 18, y + h - 38, "Ranges in hexes. (T): in the turret. A + joins the two locations of a split item.", { size: 15, fill: GRAY })}
                        {text(x + 18, y + h - 14, `* Center torso: fires only at infantry and vehicles in the walker's hex, short range, base to-hit ${edition.antiInfantryBaseToHit}, -2.`, { size: 15, fill: GRAY })}
                    </>
                ))}
            </g>
        );
    }

    renderPilot(): JSX.Element {
        const { x, w } = LEFT;
        const y = 1070, h = 200;
        return (
            <g data-testid="walker-pilot-box">
                {groupBox(x, y, w, h, "PILOT DATA", (
                    <>
                        {text(x + 20, y + 80, "Name:", { size: 22, weight: 700 })}{blank(x + 100, y + 80, 520)}
                        {text(x + 20, y + 118, "Gunnery Skill:", { size: 22, weight: 700 })}{blank(x + 190, y + 118, 80)}
                        {text(x + 330, y + 118, "Piloting Skill:", { size: 22, weight: 700 })}{blank(x + 495, y + 118, 80)}
                        {text(x + 20, y + 165, "Hits Taken", { size: 17, weight: 700 })}
                        {text(x + 20, y + 187, "Consciousness #", { size: 17, weight: 700 })}
                        {CONSCIOUSNESS.map((number, hit) => {
                            const bx = x + 200 + hit * 80;
                            return (
                                <g key={hit} data-testid={`walker-pilot-${hit + 1}`}>
                                    <rect x={bx} y={y + 138} width={80} height={52} fill="white" stroke={INK} strokeWidth={2} />
                                    <line x1={bx} x2={bx + 80} y1={y + 164} y2={y + 164} stroke={INK} strokeWidth={1} />
                                    {text(bx + 40, y + 158, hit + 1, { size: 18, weight: 700, anchor: "middle" })}
                                    {text(bx + 40, y + 184, number, { size: number === "Dead" ? 15 : 19, anchor: "middle" })}
                                </g>
                            );
                        })}
                    </>
                ))}
            </g>
        );
    }

    renderHitTable(): JSX.Element {
        const { x, w } = LEFT;
        const y = 1290, h = 470;
        const cols = [x + 60, x + 120, x + 400, x + 650];
        const rowH = 30;
        return (
            <g data-testid="walker-hit-table">
                {groupBox(x, y, w, h, "HIT LOCATION TABLE", (
                    <>
                        {text(cols[0], y + 78, "2D6", { size: 18, weight: 700, anchor: "middle" })}
                        {text(cols[1], y + 78, "Right Front / (Rear)", { size: 18, weight: 700 })}
                        {text(cols[2], y + 78, "Front / (Rear)", { size: 18, weight: 700 })}
                        {text(cols[3], y + 78, "Left Front / (Rear)", { size: 18, weight: 700 })}
                        {WALKER_HIT_TABLE.map((row, i) => {
                            const ry = y + 78 + (i + 1) * rowH;
                            return (
                                <g key={row.roll} data-testid={`walker-hit-${row.roll}`}>
                                    {i % 2 === 0 ? <rect x={x + 10} y={ry - rowH + 8} width={w - 20} height={rowH} fill={SHADE} /> : null}
                                    {text(cols[0], ry, row.roll, { size: 18, weight: 700, anchor: "middle" })}
                                    {text(cols[1], ry, row.rightFront, { size: 18 })}
                                    {text(cols[2], ry, row.front, { size: 18 })}
                                    {text(cols[3], ry, row.leftFront, { size: 18 })}
                                </g>
                            );
                        })}
                        {text(x + 18, y + h - 14, "Infantry and vehicles in the walker's hex use Front / (Rear), at random; a control hit is then a center torso hit.", { size: 14, fill: GRAY })}
                    </>
                ))}
            </g>
        );
    }

    /** The six firing arcs, one to a hex face, the walker facing the top (our drawing; Future Wars #11 p.27 shows the arcs). */
    renderArcs(walker: Walker): JSX.Element {
        const x = LEFT.x, y = 1780, w = 400, h = 340;
        const cx = x + w / 2, cy = y + 205, R = 100;
        const point = (angle: number, radius: number): [number, number] => [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)];
        const faces = ["Front", "Right front", "Right rear", "Rear", "Left rear", "Left front"];
        return (
            <g data-testid="walker-arcs">
                {groupBox(x, y, w, h, "FIRING ARCS", (
                    <>
                        {faces.map((name, i) => {
                            // Flat-topped hexes: the front face is straight up, so face i is centered on 60 i degrees clockwise.
                            const a0 = (i * 60 - 30) * Math.PI / 180;
                            const a1 = a0 + Math.PI / 3;
                            const [x0, y0] = point(a0, R);
                            const [x1, y1] = point(a1, R);
                            const [lx, ly] = point((a0 + a1) / 2, R * 0.62);
                            return (
                                <g key={name} data-testid={`walker-arc-${i + 1}`}>
                                    <polygon points={`${cx},${cy} ${x0},${y0} ${x1},${y1}`} fill={i % 2 === 0 ? SHADE : "white"} stroke={INK} strokeWidth={2} />
                                    {text(lx, ly + 5, name === "Front" ? "F" : name === "Rear" ? "R" : name.startsWith("Right") ? "RS" : "LS", { size: 20, weight: 700, anchor: "middle" })}
                                </g>
                            );
                        })}
                        <circle cx={cx} cy={cy} r={20} fill="white" stroke={INK} strokeWidth={2} />
                        {text(cx, cy + 5, "W", { size: 17, weight: 700, anchor: "middle" })}
                        {text(x + 12, y + 70, "Six arcs, one to a hex face.", { size: 15, fill: GRAY })}
                        {text(x + 12, y + 90, "F front, RS side, R rear, T turret.", { size: 15, fill: GRAY })}
                        {text(x + w - 12, y + h - 12, walker.hasTurret() ? "Turret: standard turret rules." : "No turret.", { size: 14, anchor: "end", fill: GRAY })}
                    </>
                ))}
            </g>
        );
    }

    renderHeat(walker: Walker): JSX.Element {
        const x = LEFT.x + 420, y = 1780, w = 440, h = 700;
        const levels = Object.keys(HEAT_SCALE).map(Number).sort((a, b) => b - a);
        const rowH = 33;
        return (
            <g data-testid="walker-heat-scale">
                {groupBox(x, y, w, h, "HEAT SCALE", (
                    <>
                        {text(x + 20, y + 70, "Heat", { size: 18, weight: 700 })}
                        {text(x + 110, y + 70, "Effect", { size: 18, weight: 700 })}
                        {levels.map((level, i) => {
                            const ry = y + 70 + (i + 1) * rowH;
                            return (
                                <g key={level}>
                                    {i % 2 === 0 ? <rect x={x + 10} y={ry - rowH + 9} width={w - 20} height={rowH} fill={SHADE} /> : null}
                                    {text(x + 50, ry, level, { size: 19, weight: 700, anchor: "middle" })}
                                    {text(x + 110, ry, HEAT_SCALE[level], { size: 19 })}
                                </g>
                            );
                        })}
                        {text(x + 20, y + h - 14, `Dissipation ${walker.getHeatDissipation()}`, { size: 17, fill: GRAY })}
                    </>
                ))}
            </g>
        );
    }

    renderNotes(walker: Walker): JSX.Element {
        const x = LEFT.x, y = 2140, w = 400, h = 340;
        const notes = [
            "FAN-MADE (Custom Homebrew). NOT OFFICIAL.",
            walker.getCredit(),
            ...walker.getIssues().map((issue) => `Issue: ${issue}`),
        ];
        const lines = notes.flatMap((note) => [...wrapText(note, 38), ""]);
        return (
            <g data-testid="walker-notes-box">
                {groupBox(x, y, w, h, "NOTES", (
                    <>
                        {lines.slice(0, 11).map((line, i) => text(x + 16, y + 70 + i * 24, line, { size: 16 }, `n${i}`))}
                    </>
                ))}
            </g>
        );
    }

    render = (): JSX.Element => {
        const walker = this.props.walker;
        return (
            <svg version="1.1" viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`} xmlns="http://www.w3.org/2000/svg" data-testid="walker-record-sheet-svg">
                <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
                {titleBanner(X, W, `${walker.isIndustrial() ? "INDUSTRIAL " : ""}WALKER RECORD SHEET (FAN-MADE, NOT OFFICIAL)`)}
                {this.renderData(walker)}
                {this.renderWeapons(walker)}
                {this.renderPilot()}
                {this.renderHitTable()}
                {this.renderArcs(walker)}
                {this.renderHeat(walker)}
                {this.renderNotes(walker)}
                {this.renderArmorBox(walker)}
                {this.renderSlots(walker)}
                {sheetFooter(`${walker.getEditionRules().name} (fan-made).`, getUnitRulesets(walker))}
            </svg>
        );
    }
}

interface IWalkerRecordSheetSVGProps {
    walker: Walker;
}
