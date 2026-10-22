import React, { type JSX } from 'react';
import ProtoMech, { PROTOMECH_CRITICAL_BOXES } from '../../../classes/protomech';
import type { ProtoMechLocation } from '../../../data/protomech-construction';
import { DOC_HEIGHT, DOC_WIDTH, GRAY, INK, SHADE, blank, groupBox, sheetFooter, text, titleBanner, wrapText } from './record-sheet-svg-kit';

// A ProtoMech record sheet laid out like the Total Warfare and record sheet book ones: five ProtoMech blocks, a Point
// to a page, each with the unit data and pilot data, the weapons inventory, the hit locations and critical hits, and
// the armor diagram: a white circle for every point of armor and a gray one for every point of internal structure
// (TW pp.185-187). Quads send arm hits to the legs and Gliders take near misses on their wings, and each chassis has
// its own torso weapon roll (IO:AE pp.93-94). Blocks left over are left to write in. Our own diagram; no official art.

export const PROTOMECH_UNITS_PER_PAGE = 5;

const X = 25;
const W = DOC_WIDTH - 2 * X;
const TOP = 140;
const BOTTOM = 2480;
const GAP = 20;
const BLOCK_H = (BOTTOM - TOP - GAP * (PROTOMECH_UNITS_PER_PAGE - 1)) / PROTOMECH_UNITS_PER_PAGE;
const CONSCIOUSNESS = ["3", "5", "7", "10", "11", "Dead"];

/** One ProtoMech of a Point. */
export interface IProtoMechSheetUnit { proto: ProtoMech; unit: number }

/** The sheet blocks for a list of designs: one for each ProtoMech of each Point, in order. */
export const protoMechSheetUnits = (protos: ProtoMech[]): IProtoMechSheetUnit[] =>
    protos.flatMap((proto) => Array.from({ length: proto.getPointSize() }, (_, unit) => ({ proto, unit })));

interface IHitRow { roll: string; location: ProtoMechLocation | null; name: string; effects: string[] }

/** The ProtoMech Hit Location Table with the critical hit boxes (TW pp.185-187; IO:AE p.93 for quads and Gliders). */
const hitRows = (proto: ProtoMech | undefined): IHitRow[] => {
    const quad = !!proto?.isQuad();
    const arm = (location: "la" | "ra", roll: string, name: string): IHitRow => ({ roll, location, name, effects: ["+1 to Hit", `${name} Destroyed`] });
    return [
        proto && !proto.hasMainGun()
            ? { roll: "2", location: null, name: "Main Gun", effects: ["None mounted: hits the Torso"] }
            : { roll: "2", location: "mainGun", name: "Main Gun", effects: ["Main Gun Destroyed"] },
        ...(quad ? [] : [arm("ra", "4", "Right Arm")]),
        { roll: quad ? "4,5,9,10" : "5,9", location: "legs", name: "Legs", effects: ["-1 Walk MP", "1/2 Walk MP", "No Move"] },
        { roll: "6,7,8", location: "torso", name: "Torso", effects: ["-1 Jump MP*", "1/2 Jump MP*", "Proto Destroyed"] },
        ...(quad ? [] : [arm("la", "10", "Left Arm")]),
        { roll: "12", location: "head", name: "Head", effects: ["+1 to Hit", "+2 to Hit, No Long Range"] },
        { roll: "3,11", location: null, name: "Near Miss", effects: [proto?.isGlider() ? "No damage; in flight, WiGE Cruising MP -1" : "No damage"] },
    ];
};

/** The 1D6 torso weapon roll for a torso critical hit, by chassis (Expanded ProtoMech Torso Weapon Critical Hit Table, IO:AE p.94). */
const torsoWeaponRoll = (proto: ProtoMech | undefined): [string, string | null][] => {
    const ultra = !!proto && (proto.isUltraheavy() || proto.isGlider());
    if (proto?.isQuad()) {
        return ultra ? [["1", "A"], ["2", "B"], ["3", "C"], ["4", "D"], ["5", "E"], ["6", "F"]] : [["1", "A"], ["2", "B"], ["3", "C"], ["4", "D"], ["5-6", null]];
    }
    return ultra ? [["1-2", "A"], ["3-4", "B"], ["5-6", "C"]] : [["1-2", "A"], ["3-4", "B"], ["5-6", null]];
};

export default class ProtoMechRecordSheetSVG extends React.Component<IProtoMechRecordSheetSVGProps> {
    /** Our armor diagram: a rounded box for each location, laid out like a ProtoMech, holding its circles. */
    renderDiagram(index: number, entry: IProtoMechSheetUnit | undefined, dx: number, dy: number, dw: number): JSX.Element {
        const proto = entry?.proto;
        const quad = !!proto?.isQuad();
        const cx = dx + dw / 2;
        const boxes: { location: ProtoMechLocation; label: string; x: number; y: number; w: number; h: number }[] = [
            { location: "head", label: "Head", x: cx - 55, y: dy + 22, w: 110, h: 62 },
            { location: "mainGun", label: "Main Gun", x: cx + 70, y: dy + 22, w: 95, h: 62 },
            { location: "torso", label: "Torso", x: cx - 85, y: dy + 112, w: 170, h: 140 },
            ...(quad ? [] : [
                { location: "la" as ProtoMechLocation, label: "Left Arm", x: cx - 172, y: dy + 112, w: 78, h: 140 },
                { location: "ra" as ProtoMechLocation, label: "Right Arm", x: cx + 94, y: dy + 112, w: 78, h: 140 },
            ]),
            { location: "legs", label: quad ? "Legs (all four)" : "Legs", x: quad ? cx - 165 : cx - 100, y: dy + 280, w: quad ? 330 : 200, h: 90 },
        ];
        return (
            <g>
                {boxes.map((box) => {
                    const present = !proto || proto.getLocations().includes(box.location);
                    const armor = proto ? proto.getArmor(box.location) : 0;
                    const structure = proto ? proto.getStructure(box.location) : 0;
                    const damage = proto && this.props.showDamage ? proto.getLocationDamage(entry!.unit, box.location) : 0;
                    const total = armor + structure;
                    const pitch = total > 0 ? Math.min(18, Math.sqrt(((box.w - 8) * (box.h - 8)) / total)) : 18;
                    const cols = Math.max(1, Math.floor((box.w - 8) / pitch));
                    const rows = Math.ceil(total / cols);
                    const left = box.x + (box.w - Math.min(total, cols) * pitch) / 2;
                    const top = box.y + (box.h - rows * pitch) / 2;
                    return (
                        <g key={box.location} data-testid={`proto-unit-${index + 1}-${box.location}`} data-armor={proto ? armor : undefined} data-structure={proto ? structure : undefined}>
                            {text(box.x + box.w / 2, box.y - 5, box.label, { size: 14, weight: 700, anchor: "middle", fill: present ? INK : GRAY })}
                            <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={14} fill="white" stroke={present ? INK : GRAY} strokeWidth={2} strokeDasharray={present ? undefined : "6 4"} />
                            {Array.from({ length: total }, (_, point) => {
                                const hit = point < damage;
                                return (
                                    <circle key={point} cx={left + (point % cols + 0.5) * pitch} cy={top + (Math.floor(point / cols) + 0.5) * pitch} r={pitch / 2 - 2}
                                        fill={hit ? INK : point < armor ? "white" : "rgb(170,170,170)"} stroke={INK} strokeWidth={1.2} data-hit={hit ? "filled" : undefined} />
                                );
                            })}
                        </g>
                    );
                })}
                {text(dx + dw / 2, dy + 392, "White: armor. Gray: internal structure.", { size: 13, anchor: "middle", fill: GRAY })}
            </g>
        );
    }

    renderUnit(index: number, entry: IProtoMechSheetUnit | undefined): JSX.Element {
        const x = X, y = TOP + index * (BLOCK_H + GAP), w = W, h = BLOCK_H;
        const proto = entry?.proto;
        const unit = entry?.unit ?? 0;
        const showDamage = !!proto && !!this.props.showDamage;
        const lines = proto ? proto.getWeaponLines() : [];
        const wx = x + 410, ww = 585;
        const col = { loc: wx + 330, dmg: wx + 405, min: wx + 460, sht: wx + 497, med: wx + 534, lng: wx + 571 };
        const hx = x + 1005, hw = 565;
        const dx = x + 1580, dw = w - 1580 - 15;
        const rows = hitRows(proto);
        const torsoNames: Record<string, string> = {};
        for (const line of lines) {
            const match = /^Torso ([A-Z])/.exec(line.location);
            if (match) torsoNames[match[1]] = line.name;
        }
        const roll = torsoWeaponRoll(proto).map(([dice, letter]) => `${dice}: ${letter === null ? "No Effect" : proto ? torsoNames[letter] ?? "No weapon" : `Torso Weapon ${letter}`}`);
        const notes = proto ? proto.getNotes().flatMap((note) => wrapText(note, 92)) : [];
        const lineH = Math.min(28, (h - 140 - Math.min(notes.length, 4) * 16) / Math.max(6, lines.length));
        const field = (fx: number, fy: number, label: string, value: React.ReactNode, valueX: number, blankW: number, key: string) => (
            <g key={key}>
                {text(fx, fy, label, { size: 19, weight: 700 })}
                {proto ? text(valueX, fy, value, { size: 19 }) : blank(valueX, fy, blankW)}
            </g>
        );
        const box = (bx: number, by: number, filled: boolean, key: string, shade = false) => (
            <rect key={key} x={bx} y={by - 15} width={18} height={18} rx={4} fill={filled ? INK : shade ? "rgb(170,170,170)" : "white"} stroke={INK} strokeWidth={1.5} data-hit={filled ? "filled" : undefined} />
        );
        const chassis = proto ? `${proto.getChassisName()}${proto.isUltraheavy() && !proto.getChassisName().includes("Ultra") ? ", Ultraheavy" : ""}` : "";
        const pilotHits = showDamage ? proto!.getPilotHits(unit) : 0;
        const pilotY = y + h - 150;

        return (
            <g key={index} data-testid={`proto-unit-${index + 1}`} data-blank={proto ? "false" : "true"}>
                {groupBox(x, y, w, h, `PROTOMECH ${index + 1}`, (
                    <>
                        {text(x + 20, y + 82, "Type:", { size: 19, weight: 700 })}
                        {proto ? text(x + 80, y + 82, proto.getDisplayName(), { size: proto.getDisplayName().length > 24 ? 16 : 19 }) : blank(x + 80, y + 82, 300)}
                        {field(x + 20, y + 112, "Tons:", proto?.getTons(), x + 80, 60, "tons")}
                        {field(x + 160, y + 112, "Chassis:", chassis, x + 250, 130, "chassis")}
                        {text(x + 20, y + 142, "Movement Points:", { size: 19, weight: 700 })}
                        {proto?.isGlider()
                            ? text(x + 20, y + 170, proto.getMovementText(), { size: 17 })
                            : field(x + 20, y + 170, "Walk/Run/Jump:", proto?.getMovementText(), x + 175, 150, "mp")}
                        {field(x + 20, y + 200, "Armor:", proto?.getArmorTypeName(), x + 90, 290, "armor")}
                        {field(x + 20, y + 230, "Frenzy:", proto ? `${proto.getFrenzyDamage()} damage` : "", x + 100, 80, "frenzy")}
                        {field(x + 210, y + 230, "BV:", proto?.getBattleValue(), x + 255, 100, "bv")}
                        {field(x + 20, y + 260, "Cost:", proto ? `${proto.getCBillCost().toLocaleString("en-US")} C-bills` : "", x + 80, 200, "cost")}
                        <g>
                            <rect x={x + 15} y={pilotY} width={380} height={135} rx={12} fill="white" stroke={INK} strokeWidth={2} />
                            <rect x={x + 15} y={pilotY} width={380} height={28} rx={12} fill={INK} />
                            {text(x + 205, pilotY + 21, "PILOT DATA", { size: 18, weight: 700, anchor: "middle", fill: "white" })}
                            {text(x + 25, pilotY + 56, "Name:", { size: 17, weight: 700 })}{blank(x + 90, pilotY + 56, 290)}
                            {text(x + 25, pilotY + 84, "Gunnery Skill:", { size: 17, weight: 700 })}
                            {proto ? text(x + 150, pilotY + 84, proto.getGunnery(), { size: 18 }) : blank(x + 150, pilotY + 84, 40)}
                            {text(x + 25, pilotY + 110, "Hits Taken", { size: 13, weight: 700 })}
                            {text(x + 25, pilotY + 127, "Consciousness #", { size: 13, weight: 700 })}
                            {CONSCIOUSNESS.map((number, hit) => {
                                const bx = x + 140 + hit * 41;
                                const filled = hit < pilotHits;
                                return (
                                    <g key={hit} data-hit={filled ? "filled" : undefined}>
                                        <rect x={bx} y={pilotY + 94} width={41} height={36} fill={filled ? INK : "white"} stroke={INK} strokeWidth={1.5} />
                                        <line x1={bx} x2={bx + 41} y1={pilotY + 112} y2={pilotY + 112} stroke={filled ? "white" : INK} strokeWidth={1} />
                                        {text(bx + 20.5, pilotY + 109, hit + 1, { size: 14, weight: 700, anchor: "middle", fill: filled ? "white" : INK })}
                                        {text(bx + 20.5, pilotY + 127, number, { size: number === "Dead" ? 11 : 14, anchor: "middle", fill: filled ? "white" : INK })}
                                    </g>
                                );
                            })}
                        </g>

                        <rect x={wx} y={y + 40} width={ww} height={30} rx={10} fill={INK} />
                        {text(wx + ww / 2, y + 62, "WEAPONS INVENTORY", { size: 19, weight: 700, anchor: "middle", fill: "white" })}
                        {text(wx + 8, y + 94, "Type", { size: 16, weight: 700 })}
                        {([["Loc", col.loc], ["Dmg", col.dmg], ["Min", col.min], ["Sht", col.sht], ["Med", col.med], ["Lng", col.lng]] as [string, number][])
                            .map(([label, lx]) => text(lx, y + 94, label, { size: 16, weight: 700, anchor: "middle" }, label))}
                        {proto
                            ? lines.map((line, i) => {
                                const ly = y + 102 + i * lineH;
                                const lost = showDamage && proto.isMountLost(unit, line.index);
                                const shots = line.shots === null ? "" : showDamage ? ` (${proto.getShotsLeft(unit, line.index)} of ${line.shots} shots)` : ` (${line.shots} shots)`;
                                const size = Math.min(16, lineH - 6);
                                return (
                                    <g key={line.index} data-lost={lost ? "true" : undefined}>
                                        {i % 2 === 0 ? <rect x={wx} y={ly} width={ww} height={lineH} fill={SHADE} /> : null}
                                        {text(wx + 8, ly + lineH * 0.72, `${line.name}${shots}`, { size: (line.name + shots).length > 34 ? size - 3 : size })}
                                        {text(col.loc, ly + lineH * 0.72, line.location.replace("Torso ", "T").replace("Right Arm", "RA").replace("Left Arm", "LA").replace("Main Gun", "MG").replace("Legs", "L"), { size, anchor: "middle" })}
                                        {text(col.dmg, ly + lineH * 0.72, line.damage, { size: line.damage.length > 5 ? size - 4 : size, anchor: "middle" })}
                                        {[line.long ? line.min || "—" : "", line.long ? line.short : "", line.long ? line.medium : "", line.long ? line.long : ""]
                                            .map((band, b) => text([col.min, col.sht, col.med, col.lng][b], ly + lineH * 0.72, band, { size, anchor: "middle" }, `b${b}`))}
                                        {lost ? <line x1={wx + 4} x2={wx + ww - 4} y1={ly + lineH / 2} y2={ly + lineH / 2} stroke={INK} strokeWidth={2} /> : null}
                                    </g>
                                );
                            })
                            : Array.from({ length: 6 }, (_, i) => <line key={i} x1={wx + 8} x2={wx + ww - 8} y1={y + 128 + i * 34} y2={y + 128 + i * 34} stroke={INK} strokeWidth={1.5} />)}
                        {notes.slice(0, 4).map((note, i) => text(wx + 8, y + h - 18 - (Math.min(notes.length, 4) - 1 - i) * 16, note, { size: 13, fill: GRAY }, `n${i}`))}

                        <rect x={hx} y={y + 40} width={hw} height={30} rx={10} fill={INK} />
                        {text(hx + hw / 2, y + 62, "HIT LOCATIONS AND CRITICAL HITS", { size: 19, weight: 700, anchor: "middle", fill: "white" })}
                        {([["2D6", hx + 8], ["LOCATION", hx + 75], ["1st HIT", hx + 185], ["2nd HIT", hx + 320], ["3rd HIT", hx + 445]] as [string, number][])
                            .map(([label, lx]) => text(lx, y + 94, label, { size: 15, weight: 700 }, label))}
                        {rows.map((row, r) => {
                            const ry = y + 124 + r * 33;
                            const criticals = showDamage && row.location ? proto!.getCriticals(unit, row.location) : 0;
                            const boxes = row.location === null ? 0 : row.location === "mainGun" ? 1 : PROTOMECH_CRITICAL_BOXES[row.location];
                            const mainGunGone = showDamage && row.location === "mainGun" && proto!.isLocationDestroyed(unit, "mainGun");
                            return (
                                <g key={row.roll}>
                                    {r % 2 === 0 ? <rect x={hx} y={ry - 22} width={hw} height={33} fill={SHADE} /> : null}
                                    {text(hx + 8, ry, row.roll, { size: 15, weight: 700 })}
                                    {text(hx + 75, ry, row.name, { size: row.name.length > 12 ? 12 : 15 })}
                                    {boxes === 0
                                        ? text(hx + 185, ry, row.effects[0], { size: 14 })
                                        : row.effects.map((effect, e) => {
                                            const ex = hx + [185, 320, 445][e];
                                            const two = effect.includes(", ") ? effect.split(", ") : [effect];
                                            return (
                                                <g key={e}>
                                                    {box(ex, ry, row.location === "mainGun" ? mainGunGone : e < criticals, `c${e}`, e > 0 && e === boxes - 1 && boxes > 1)}
                                                    {two.map((part, p) => text(ex + 23, ry - (two.length - 1) * 7 + p * 14, part, { size: two.length > 1 ? 12 : 13 }, `p${p}`))}
                                                </g>
                                            );
                                        })}
                                </g>
                            );
                        })}
                        {text(hx + 8, y + 124 + rows.length * 33 + 4, "*Torso Weapon Destroyed, roll 1D6:", { size: 14, weight: 700 })}
                        {wrapText(roll.join("; "), 74).map((line, i) => text(hx + 8, y + 124 + rows.length * 33 + 24 + i * 18, line, { size: 14 }, `r${i}`))}

                        {text(dx + dw / 2, y + 62, "ARMOR DIAGRAM", { size: 19, weight: 700, anchor: "middle" })}
                        {this.renderDiagram(index, entry, dx, y + 70, dw)}
                    </>
                ))}
            </g>
        );
    }

    render = (): JSX.Element => {
        const units = this.props.units.slice(0, PROTOMECH_UNITS_PER_PAGE);
        return (
            <svg
                version="1.1"
                viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`}
                xmlns="http://www.w3.org/2000/svg"
                data-testid="protomech-record-sheet-svg"
            >
                <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
                {titleBanner(X, W, "PROTOMECH RECORD SHEET")}
                {Array.from({ length: PROTOMECH_UNITS_PER_PAGE }, (_, i) => this.renderUnit(i, units[i]))}
                {sheetFooter("Tables: TW pp. 185-187; IO:AE pp. 93-94.")}
            </svg>
        );
    }
}

interface IProtoMechRecordSheetSVGProps {
    /** One to five ProtoMechs; blocks left over print blank. */
    units: IProtoMechSheetUnit[];
    showDamage?: boolean;
}
