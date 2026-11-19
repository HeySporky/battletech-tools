import React, { type JSX } from 'react';
import MicroMech from '../../../classes/micro-mech';
import { getUnitRulesets } from '../../../classes/unit-game-settings';
import { getMicroMechItemRange } from '../../../data/micro-mech-equipment-custom';
import { MICRO_MECH_COCKPIT_ARMOR, MICRO_MECH_CREDIT, type MicroMechLocation } from '../../../data/micro-mech-construction';
import { DOC_HEIGHT, DOC_WIDTH, GRAY, INK, SHADE, blank, groupBox, sheetFooter, text, titleBanner, wrapText } from './record-sheet-svg-kit';

// A Micro-Mech record sheet, one design to a page, laid out after the two sheets in the document (the biped and the
// quad): armor and structure for each location with the rear torso, the cockpit's 3 armor points, the critical slot
// tables with their die ranges (head 1-3 / 4-6; limbs 1-2 / 3-4 / 5-6; torso two columns of six), six pilot hits, the
// weapons and ammunition, and Walk / Run / Jump. There is no heat scale. Our own diagram and wording; no official art.
// Every box carries a test id so the play mode (Chunk F) can fill them: `micro-armor-<location>-<n>` (n from 1, hit
// from the outside in), `micro-structure-<location>-<n>`, `micro-cockpit-<n>`, `micro-pilot-<n>`.

const X = 25;
const W = DOC_WIDTH - 2 * X;
const LEFT = { x: X, w: 960 };
const RIGHT = { x: 1015, w: 960 };
const CONSCIOUSNESS = ["3", "5", "7", "10", "11", "Dead"];
const PITCH = 30;

/** The location's name on the sheet and its die ranges, one per column of slots (the document's record sheets). */
const slotRanges = (location: MicroMechLocation): string[] => {
    if (location === "head") return ["1-3", "4-6"];
    if (location === "torso") return ["1-3", "4-6"];
    return ["1-2", "3-4", "5-6"];
};

export default class MicroMechRecordSheetSVG extends React.Component<IMicroMechRecordSheetSVGProps> {
    /** A row of round boxes, armor white and structure gray, wrapped at `perRow`. Returns its height too. */
    renderCircles(prefix: string, x: number, y: number, count: number, perRow: number, fill: string): { element: JSX.Element; height: number } {
        const rows = Math.max(1, Math.ceil(count / perRow));
        return {
            height: rows * PITCH,
            element: (
                <g>
                    {Array.from({ length: count }, (_, i) => (
                        <circle key={i} data-testid={`${prefix}-${i + 1}`} cx={x + (i % perRow) * PITCH + PITCH / 2} cy={y + Math.floor(i / perRow) * PITCH + PITCH / 2} r={PITCH / 2 - 3}
                            fill={fill} stroke={INK} strokeWidth={1.5} />
                    ))}
                </g>
            ),
        };
    }

    renderArmorBox(micro: MicroMech): JSX.Element {
        const x = RIGHT.x, y = 140, w = RIGHT.w, h = 1120;
        const locations = micro.getLocations();
        const rowH = Math.floor((h - 70 - 20) / (locations.length + 1));
        const perRow = Math.floor((w - 330) / PITCH);
        return (
            <g data-testid="micro-armor-box">
                {groupBox(x, y, w, h, "ARMOR AND INTERNAL STRUCTURE", (
                    <>
                        {locations.map((location, row) => {
                            const ry = y + 60 + row * rowH;
                            const armor = micro.getArmor(location);
                            const structure = micro.getStructure(location);
                            const armorCircles = this.renderCircles(`micro-armor-${location}`, x + 300, ry, armor, perRow, "white");
                            const structureCircles = location === "torsoRear" ? null : this.renderCircles(`micro-structure-${location}`, x + 300, ry + armorCircles.height + 6, structure, perRow, "rgb(170,170,170)");
                            return (
                                <g key={location} data-testid={`micro-location-${location}`} data-armor={armor} data-structure={location === "torsoRear" ? undefined : structure}>
                                    {row % 2 === 0 ? <rect x={x + 10} y={ry - 6} width={w - 20} height={rowH - 4} fill={SHADE} /> : null}
                                    {text(x + 20, ry + 22, micro.getLocationName(location), { size: 24, weight: 700 })}
                                    {text(x + 20, ry + 50, `Armor ${armor}${location === "torsoRear" ? "" : `, structure ${structure}`}`, { size: 18, fill: GRAY })}
                                    {armorCircles.element}
                                    {structureCircles?.element}
                                </g>
                            );
                        })}
                        {(() => {
                            const ry = y + 60 + locations.length * rowH;
                            return (
                                <g data-testid="micro-cockpit">
                                    {text(x + 20, ry + 22, "Cockpit", { size: 24, weight: 700 })}
                                    {text(x + 20, ry + 50, `Armor ${MICRO_MECH_COCKPIT_ARMOR}`, { size: 18, fill: GRAY })}
                                    {this.renderCircles("micro-cockpit", x + 300, ry, MICRO_MECH_COCKPIT_ARMOR, perRow, "white").element}
                                </g>
                            );
                        })()}
                        {text(x + w - 20, y + h - 16, "White: armor. Gray: internal structure.", { size: 16, anchor: "end", fill: GRAY })}
                    </>
                ))}
            </g>
        );
    }

    renderSlotBox(micro: MicroMech, location: MicroMechLocation, x: number, y: number, w: number, rowH: number): JSX.Element {
        // The jump jets placed in the leg and torso slots, as the play mode hits them (Chunk F).
        const slots = micro.getPlaySlots(location);
        const ranges = slotRanges(location);
        // The torso prints as two columns of six; every other location as one column cut into die-range bands.
        const columns = location === "torso" ? 2 : 1;
        const perColumn = Math.ceil(slots.length / columns);
        const colW = (w - 20) / columns;
        const bandSize = location === "torso" ? perColumn : slots.length / ranges.length;
        const h = 44 + perColumn * rowH + 10;
        return (
            <g key={location} data-testid={`micro-slots-${location}`}>
                <rect x={x} y={y} width={w} height={h} rx={10} fill="white" stroke={INK} strokeWidth={2} />
                {text(x + 12, y + 30, micro.getLocationName(location), { size: 22, weight: 700 })}
                {slots.map((slot, i) => {
                    const column = Math.floor(i / perColumn);
                    const row = i % perColumn;
                    const sx = x + 10 + column * colW;
                    const sy = y + 44 + row * rowH;
                    const band = Math.floor(i / bandSize);
                    const startsBand = location === "torso" ? row === 0 : i % bandSize === 0;
                    return (
                        <g key={i} data-testid={`micro-slot-${location}-${i + 1}`} data-item={slot ?? undefined}>
                            {startsBand ? <line x1={sx} x2={sx + colW - 10} y1={sy} y2={sy} stroke={INK} strokeWidth={2.5} /> : <line x1={sx} x2={sx + colW - 10} y1={sy} y2={sy} stroke={GRAY} strokeWidth={1} />}
                            {text(sx + 4, sy + rowH - 8, startsBand ? ranges[band] : "", { size: 15, weight: 700, fill: GRAY }, `r${i}`)}
                            {text(sx + 54, sy + rowH - 8, `${row + 1}. ${slot ?? ""}`, { size: Math.min(20, rowH - 8) }, `s${i}`)}
                        </g>
                    );
                })}
            </g>
        );
    }

    renderSlots(micro: MicroMech): JSX.Element {
        const x = RIGHT.x, y = 1280, w = RIGHT.w, h = 1200;
        const rowH = 34;
        const ranged: MicroMechLocation[] = micro.isQuad() ? ["fll", "frl", "ll", "rl"] : ["la", "ra", "ll", "rl"];
        const headW = 300;
        const torsoH = 44 + 6 * rowH + 10;
        const limbH = 44 + 3 * rowH + 10;
        const gap = 14;
        const inner = x + 12;
        const half = (w - 24 - gap) / 2;
        return (
            <g data-testid="micro-slots-box">
                {groupBox(x, y, w, h, "CRITICAL HIT TABLE", (
                    <>
                        {this.renderSlotBox(micro, "head", inner, y + 50, headW, rowH)}
                        {this.renderSlotBox(micro, "torso", inner + headW + gap, y + 50, w - 24 - headW - gap, rowH)}
                        {this.renderSlotBox(micro, ranged[0], inner, y + 50 + torsoH + gap, half, rowH)}
                        {this.renderSlotBox(micro, ranged[1], inner + half + gap, y + 50 + torsoH + gap, half, rowH)}
                        {this.renderSlotBox(micro, ranged[2], inner, y + 50 + torsoH + limbH + gap * 2, half, rowH)}
                        {this.renderSlotBox(micro, ranged[3], inner + half + gap, y + 50 + torsoH + limbH + gap * 2, half, rowH)}
                        {wrapText("Roll 1D6 on the location's band for the slot hit; a slot that holds nothing is a no-effect hit. A critical hit on ammunition explodes it as in the BattleMech rules.", 105)
                            .map((line, i) => text(x + 20, y + 50 + torsoH + limbH * 2 + gap * 3 + 40 + i * 24, line, { size: 18, fill: GRAY }, `n${i}`))}
                    </>
                ))}
            </g>
        );
    }

    renderData(micro: MicroMech): JSX.Element {
        const { x, w } = LEFT;
        const y = 140, h = 330;
        const field = (fx: number, fy: number, label: string, value: React.ReactNode, valueX: number, testid?: string) => (
            <g key={label}>
                {text(fx, fy, label, { size: 22, weight: 700 })}
                {text(valueX, fy, value, { size: 22, testid })}
            </g>
        );
        const engine = micro.getEngineKind() === "ice" ? "ICE" : "Fusion";
        return (
            <g data-testid="micro-data-box">
                {groupBox(x, y, w, h, "MICRO-MECH DATA", (
                    <>
                        {field(x + 20, y + 80, "Type:", micro.getDisplayName(), x + 90, "micro-name")}
                        {field(x + 20, y + 118, "Tonnage:", `${micro.getTons()} (${micro.isQuad() ? "quad" : "biped"})`, x + 130)}
                        {field(x + 470, y + 118, "Engine:", `${engine} ${micro.getInstalledEngineRating()}`, x + 560)}
                        {field(x + 20, y + 156, "Walk / Run / Jump:", `${micro.getWalkMP()} / ${micro.getRunMP()} / ${micro.getJumpMP()}`, x + 250, "micro-movement")}
                        {field(x + 470, y + 156, "Heat sinks:", micro.getHeatSinks(), x + 600)}
                        {field(x + 20, y + 194, "Weight:", `${micro.getWeight().toLocaleString("en-US")} of ${micro.getMaxWeight().toLocaleString("en-US")} kg`, x + 120)}
                        {field(x + 470, y + 194, "Slots:", `${micro.getTotalUsedSlots()} of ${micro.getTotalSlots()}`, x + 560)}
                        {field(x + 20, y + 232, "Battle Value:", `${micro.getBattleValue().toLocaleString("en-US")} (provisional)`, x + 190, "micro-bv")}
                        {field(x + 20, y + 270, "Cost:", `${micro.getCBillCost().toLocaleString("en-US")} C-bills`, x + 90, "micro-cost")}
                        {text(x + 20, y + 306, `Rules: ${micro.getRules().name}. Era: ${micro.getEra().name}. ${micro.isLegal() ? "" : "NOT LEGAL: see the creator's summary."}`, { size: 17, fill: GRAY })}
                    </>
                ))}
            </g>
        );
    }

    renderWeapons(micro: MicroMech): JSX.Element {
        const { x, w } = LEFT;
        const y = 490, h = 560;
        const col = { loc: x + 370, heat: x + 475, dmg: x + 545, min: x + 645, sht: x + 705, med: x + 765, lng: x + 825, ammo: x + 925 };
        const mounts = micro.getMounts();
        const lots = micro.getAmmoLots();
        const rowH = Math.min(36, (h - 170) / Math.max(8, mounts.length + lots.length + 1));
        let r = 0;
        const rows: JSX.Element[] = [];
        mounts.forEach((mount, index) => {
            const range = getMicroMechItemRange(mount.item);
            const ry = y + 136 + r * rowH;
            const shots = lots.filter((lot) => lot.mountIndex === index).reduce((sum, lot) => sum + lot.shots, 0);
            rows.push(
                <g key={`m${index}`} data-testid={`micro-weapon-${index + 1}`}>
                    {r % 2 === 0 ? <rect x={x + 10} y={ry - rowH + 10} width={w - 20} height={rowH} fill={SHADE} /> : null}
                    {text(x + 18, ry, mount.item.name, { size: mount.item.name.length > 26 ? 17 : 20 })}
                    {text(col.loc, ry, micro.getLocationName(mount.location), { size: 17, anchor: "middle" })}
                    {text(col.heat, ry, mount.item.heat, { size: 18, anchor: "middle" })}
                    {text(col.dmg, ry, String(mount.item.damage), { size: String(mount.item.damage).length > 6 ? 14 : 18, anchor: "middle" })}
                    {range ? [range.min || "—", range.short, range.medium, range.long].map((value, b) => text([col.min, col.sht, col.med, col.lng][b], ry, value, { size: 18, anchor: "middle" }, `b${b}`)) : null}
                    {text(col.ammo, ry, shots > 0 ? shots : "", { size: 18, anchor: "middle" })}
                </g>,
            );
            r++;
        });
        for (const lot of lots) {
            const ry = y + 136 + r * rowH;
            rows.push(
                <g key={`a${r}`} data-testid={`micro-ammo-${lot.mountIndex + 1}`}>
                    {text(x + 18, ry, `Ammo: ${lot.name}${lot.type === "cluster" ? " (cluster)" : ""}, ${lot.kg} kg`, { size: 17, fill: GRAY })}
                    {text(col.loc, ry, micro.getLocationName(lot.location), { size: 17, anchor: "middle", fill: GRAY })}
                    {text(col.ammo, ry, lot.shots, { size: 18, anchor: "middle", fill: GRAY })}
                </g>,
            );
            r++;
        }
        return (
            <g data-testid="micro-weapons-box">
                {groupBox(x, y, w, h, "WEAPONS AND AMMUNITION", (
                    <>
                        {text(x + 18, y + 100, "Type", { size: 18, weight: 700 })}
                        {([["Location", col.loc], ["Heat", col.heat], ["Damage", col.dmg], ["Min", col.min], ["Sht", col.sht], ["Med", col.med], ["Lng", col.lng], ["Shots", col.ammo]] as [string, number][])
                            .map(([label, lx]) => text(lx, y + 100, label, { size: 17, weight: 700, anchor: "middle" }, label))}
                        {rows}
                        {mounts.length === 0 ? <g>{Array.from({ length: 6 }, (_, i) => blank(x + 18, y + 130 + i * 40, w - 40, `l${i}`))}</g> : null}
                        {text(x + 18, y + h - 16, "Ranges in hexes. Four weapons at most. A launcher is sold by the tube.", { size: 16, fill: GRAY })}
                    </>
                ))}
            </g>
        );
    }

    renderPilot(): JSX.Element {
        const { x, w } = LEFT;
        const y = 1070, h = 200;
        return (
            <g data-testid="micro-pilot-box">
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
                                <g key={hit} data-testid={`micro-pilot-${hit + 1}`}>
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

    renderNotes(micro: MicroMech): JSX.Element {
        const { x, w } = LEFT;
        const y = 1290, h = 1190;
        const notes = [
            "FAN-MADE (Custom Homebrew). NOT OFFICIAL: not a Catalyst Game Labs design.",
            MICRO_MECH_CREDIT,
            "A Micro-Mech follows the BattleMech rules except where its document notes. It has one torso, no heat scale, and weighs in kilograms.",
            ...micro.getNotes().filter((note) => note !== MICRO_MECH_CREDIT),
            ...micro.getIssues().map((issue) => `Issue: ${issue}`),
        ];
        const lines = notes.flatMap((note) => [...wrapText(note, 84), ""]);
        return (
            <g data-testid="micro-notes-box">
                {groupBox(x, y, w, h, "NOTES", (
                    <>
                        {lines.slice(0, 40).map((line, i) => text(x + 20, y + 80 + i * 26, line, { size: 18 }, `n${i}`))}
                        {Array.from({ length: 5 }, (_, i) => blank(x + 20, y + h - 190 + i * 36, w - 40, `w${i}`))}
                    </>
                ))}
            </g>
        );
    }

    render = (): JSX.Element => {
        const micro = this.props.micro;
        return (
            <svg version="1.1" viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`} xmlns="http://www.w3.org/2000/svg" data-testid="micro-mech-record-sheet-svg">
                <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
                {titleBanner(X, W, "MICRO-MECH RECORD SHEET (FAN-MADE, NOT OFFICIAL)")}
                {this.renderData(micro)}
                {this.renderWeapons(micro)}
                {this.renderPilot()}
                {this.renderNotes(micro)}
                {this.renderArmorBox(micro)}
                {this.renderSlots(micro)}
                {sheetFooter("Micro-Mechs 6.1.0.2 (fan-made).", getUnitRulesets(micro))}
            </svg>
        );
    }
}

interface IMicroMechRecordSheetSVGProps {
    micro: MicroMech;
}
