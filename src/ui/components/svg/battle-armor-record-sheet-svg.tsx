import React, { type JSX } from 'react';
import BattleArmor from '../../../classes/battle-armor';
import { findBattleArmorEquipment, findBattleArmorMineType } from '../../../data/battle-armor-equipment';
import {
    BA_LEG_ATTACKS, BA_SWARM_ATTACKS, BA_SWARM_ATTACK_MODIFIERS, BA_SWARM_EQUIPMENT_MODIFIERS, BA_SWARM_HIT_LOCATIONS,
    BA_SWARM_SITUATION_MODIFIERS, BA_TRANSPORT_POSITIONS,
} from '../../../data/battle-armor-record-sheet';
import { findInfantryWeapon } from '../../../data/infantry-weapons';
import { getUnitQuirkSheetLines, weaponQuirkSuffix } from '../quirk-sheet-block';
import { DOC_HEIGHT, DOC_WIDTH, GRAY, INK, SHADE, blank, checkbox, groupBox, sheetFooter, text, titleBanner, wrapText } from './record-sheet-svg-kit';

// A battle armor record sheet laid out like the Total Warfare one: five squad blocks down the left, each with the
// unit data, weapons and a row of circles per trooper, and the leg attack, swarm attack, swarm modifier, swarm hit
// location and transport position tables down the right. Up to five squads print on one page; blocks left over are
// left to write in, as on the official sheet. Our own trooper figure; no official art or logo.

export const BA_SQUADS_PER_PAGE = 5;

const LEFT = { x: 25, w: 1290 };
const RIGHT = { x: 1335, w: 640 };
const TOP = 140;
const BOTTOM = 2480;
const GAP = 20;
const SQUAD_H = (BOTTOM - TOP - GAP * (BA_SQUADS_PER_PAGE - 1)) / BA_SQUADS_PER_PAGE;
const BLANK_CIRCLES = 18;

interface IWeaponLine { name: string; damage: string; bands: string[] }

/** Our trooper figure: a helmeted suit standing, or a four-legged one for quad battle armor. */
const trooperFigure = (x: number, y: number, quad: boolean): JSX.Element => quad ? (
    <g fill={GRAY}>
        <rect x={x} y={y + 10} width={30} height={14} rx={5} />
        <circle cx={x + 30} cy={y + 10} r={6} />
        {[2, 9, 18, 25].map((lx) => <rect key={lx} x={x + lx} y={y + 22} width={4} height={14} />)}
    </g>
) : (
    <g fill={GRAY}>
        <circle cx={x + 15} cy={y + 6} r={6} />
        <rect x={x + 7} y={y + 13} width={16} height={14} rx={3} />
        <rect x={x + 2} y={y + 14} width={5} height={12} rx={2} />
        <rect x={x + 23} y={y + 14} width={5} height={12} rx={2} />
        <rect x={x + 8} y={y + 27} width={6} height={11} />
        <rect x={x + 16} y={y + 27} width={6} height={11} />
    </g>
);

/** A rules table: headers over its columns (each a list of lines), then zebra rows. Returns the drawing and its height. */
const table = (x: number, y: number, columns: { x: number; header: string[]; anchor?: "start" | "middle" }[], rows: string[][], rowH: number, size = 20): JSX.Element => {
    const headerLines = Math.max(...columns.map((column) => column.header.length));
    const top = y + headerLines * 24 + 8;
    return (
        <g>
            {columns.map((column, c) => column.header.map((line, l) => text(column.x, y + 20 + l * 24, line, { size: 18, weight: 700, anchor: column.anchor ?? "middle" }, `h${c}-${l}`)))}
            {rows.map((row, r) => (
                <g key={r}>
                    {r % 2 === 0 ? <rect x={x} y={top + r * rowH} width={RIGHT.w - 30} height={rowH} fill={SHADE} /> : null}
                    {row.map((cell, c) => text(columns[c].x, top + r * rowH + rowH * 0.72, cell, { size, weight: c === 0 ? 700 : 400, anchor: columns[c].anchor ?? "middle" }, `${r}-${c}`))}
                </g>
            ))}
        </g>
    );
};

export default class BattleArmorRecordSheetSVG extends React.Component<IBattleArmorRecordSheetSVGProps> {
    weaponLines(suit: BattleArmor): IWeaponLine[] {
        const quirks = getUnitQuirkSheetLines(suit.quirks, suit.getItems().map((entry) => ({ uuid: entry.uuid, label: findBattleArmorEquipment(entry.tag)?.name ?? entry.tag })), suit.getQuirkTargets().locations);
        const lines: IWeaponLine[] = [];
        for (const entry of suit.getItems()) {
            const equipment = findBattleArmorEquipment(entry.tag);
            if (!equipment) continue;
            const range = equipment.range.split("/");
            const shots = suit.getItemShots(entry);
            const name = (suit.isMixedTech() ? (equipment.techBase === "clan" ? "Clan " : "IS ") : "") + equipment.name
                + (entry.squadSupport ? " (squad support)" : "") + (entry.modular ? " (modular)" : "") + (entry.detachable ? " (detachable)" : "")
                + (entry.trooper ? ` (trooper ${entry.trooper})` : "") + (equipment.mineDispenser ? ` (${findBattleArmorMineType(entry.mine).name} mines)` : "")
                + (shots > 0 ? ` (${shots} shot${shots === 1 ? "" : "s"})` : "") + weaponQuirkSuffix(quirks, entry.uuid);
            lines.push({ name, damage: equipment.damage, bands: (range.length === 4 ? range : ["", "", "", equipment.range]).map((band) => band === "-" ? "—" : band) });
        }
        for (const mount of suit.getAPMounts()) {
            const weapon = findInfantryWeapon(mount.weapon);
            lines.push({ name: `AP mount: ${weapon ? weapon.name : "empty"}`, damage: weapon ? String(weapon.damage) : "", bands: ["", "", "", weapon ? `${weapon.baseRange}` : ""] });
        }
        return lines;
    }

    // The notes under the weapons: unit quirks, manipulators and anything that limits anti-'Mech attacks.
    notes(suit: BattleArmor): string[] {
        const quirks = getUnitQuirkSheetLines(suit.quirks, [], suit.getQuirkTargets().locations);
        const notes: string[] = [];
        if (quirks.unit.length) notes.push(`Quirks: ${quirks.unit.join(", ")}.`);
        if (!suit.isQuad()) notes.push(`Manipulators: ${suit.getManipulator("la").name} (left), ${suit.getManipulator("ra").name} (right).`);
        notes.push(...suit.getCapabilities().notes);
        return notes;
    }

    renderSquad(index: number, suit: BattleArmor | undefined): JSX.Element {
        const x = LEFT.x, y = TOP + index * (SQUAD_H + GAP), w = LEFT.w, h = SQUAD_H;
        const showDamage = !!suit && this.props.showDamage;
        const capabilities = suit?.getCapabilities();
        const other = suit ? suit.getMovementText().split(" / ").slice(1).join(", ") : "";
        const col = { dmg: x + 470, min: x + 535, sht: x + 590, med: x + 645, lng: x + 700 };
        const weapons = suit ? this.weaponLines(suit) : [];
        const notes = suit ? this.notes(suit).flatMap((note) => wrapText(note, 95)) : [];
        const notesY = y + h - 58 - (notes.length - 1) * 19;
        const lineH = Math.min(30, (notesY - 30 - (y + 205)) / Math.max(4, weapons.length));
        const weaponSize = Math.min(18, Math.max(12, lineH - 6));
        const mark = (cx: number, cy: number, on: boolean | undefined, key: string) => (
            <g key={key}>{checkbox(cx, cy)}{on ? text(cx + 12, cy, "X", { size: 22, weight: 700, anchor: "middle" }) : null}</g>
        );

        // Trooper rows: the number, our figure, the trooper circle and a circle for each armor point.
        const rowsX = x + 760, rowH = (h - 120) / 6;
        const circles = suit ? suit.getArmorPoints() : BLANK_CIRCLES;
        const pitch = Math.min(26, (x + w - 20 - (rowsX + 80)) / (circles + 1));
        const troopers = Array.from({ length: 6 }, (_, t) => {
            const ry = y + 60 + t * rowH;
            const present = !suit || t < suit.getSquadSize();
            const damage = showDamage && suit ? suit.getTrooperDamage(t) : 0;
            const dead = showDamage && suit ? !suit.isTrooperActive(t) : false;
            return (
                <g key={t}>
                    <rect x={rowsX} y={ry} width={x + w - 20 - rowsX} height={rowH - 6} rx={10} fill="white" stroke={INK} strokeWidth={2} />
                    {text(rowsX + 14, ry + rowH * 0.62, t + 1, { size: 26, weight: 700, fill: present ? INK : GRAY })}
                    {trooperFigure(rowsX + 36, ry + (rowH - 6) / 2 - 19, !!suit?.isQuad())}
                    {present ? (
                        <g data-testid={`ba-squad-${index + 1}-trooper-${t + 1}`} data-count={circles}>
                            <circle cx={rowsX + 80 + pitch / 2} cy={ry + (rowH - 6) / 2} r={pitch / 2 - 2} fill={dead ? INK : "rgb(170,170,170)"} stroke={INK} strokeWidth={1.5} data-hit={dead ? "filled" : undefined} />
                            {Array.from({ length: circles }, (_, c) => (
                                <circle key={c} cx={rowsX + 80 + pitch * (c + 1.5)} cy={ry + (rowH - 6) / 2} r={pitch / 2 - 3}
                                    fill={c < damage ? INK : "white"} stroke={INK} strokeWidth={1.5} data-hit={c < damage ? "filled" : undefined} />
                            ))}
                        </g>
                    ) : <line x1={rowsX + 80} y1={ry + (rowH - 6) / 2} x2={x + w - 40} y2={ry + (rowH - 6) / 2} stroke={GRAY} strokeWidth={2} />}
                </g>
            );
        });
        const armor = suit ? suit.getArmor() : null;

        return (
            <g key={index} data-testid={`ba-squad-${index + 1}`} data-blank={suit ? "false" : "true"}>
                {groupBox(x, y, w, h, `BATTLE ARMOR: SQUAD/POINT ${index + 1}`, (
                    <>
                        {text(x + 20, y + 80, "Type:", { size: 20, weight: 700 })}
                        {suit ? text(x + 85, y + 80, `${suit.getDisplayName()} (${suit.getWeightClass().name}${suit.isQuad() ? ", Quad" : ""}, ${suit.getTechName()})`, { size: 20 }) : blank(x + 85, y + 80, 620)}
                        {text(x + 20, y + 113, "Gunnery Skill:", { size: 20, weight: 700 })}
                        {suit ? text(x + 175, y + 113, suit.getGunnery(), { size: 22 }) : blank(x + 175, y + 113, 50)}
                        {text(x + 430, y + 113, "Anti-'Mech Skill:", { size: 20, weight: 700 })}
                        {suit ? text(x + 610, y + 113, suit.getAntiMechSkill(), { size: 22 }) : blank(x + 610, y + 113, 50)}
                        {text(x + 20, y + 146, "Ground MP:", { size: 20, weight: 700 })}
                        {suit ? text(x + 175, y + 146, suit.getTotalGroundMP(), { size: 22 }) : blank(x + 175, y + 146, 50)}
                        {text(x + 430, y + 146, "Other MP:", { size: 20, weight: 700 })}
                        {suit ? text(x + 540, y + 146, other || "—", { size: 22 }) : blank(x + 540, y + 146, 160)}
                        {text(x + 20, y + 185, "Weapons & Equip.", { size: 20, weight: 700 })}
                        {([["Dmg", col.dmg], ["Min", col.min], ["Sht", col.sht], ["Med", col.med], ["Lng", col.lng]] as [string, number][]).map(([label, cx]) => text(cx, y + 185, label, { size: 18, weight: 700, anchor: "middle" }, label))}
                        {suit
                            ? weapons.map((line, i) => {
                                const ly = y + 205 + (i + 0.8) * lineH;
                                return (
                                    <g key={i}>
                                        {i % 2 === 0 ? <rect x={x + 15} y={y + 205 + i * lineH} width={710} height={lineH} fill={SHADE} /> : null}
                                        {text(x + 20, ly, line.name, { size: line.name.length > 46 ? Math.min(weaponSize, 15) : weaponSize })}
                                        {text(col.dmg, ly, line.damage, { size: weaponSize, anchor: "middle" })}
                                        {line.bands.map((band, b) => text([col.min, col.sht, col.med, col.lng][b], ly, band, { size: weaponSize, anchor: "middle" }, `b${b}`))}
                                    </g>
                                );
                            })
                            : Array.from({ length: 4 }, (_, i) => <line key={i} x1={x + 20} x2={x + 720} y1={y + 235 + i * 34} y2={y + 235 + i * 34} stroke={INK} strokeWidth={1.5} />)}
                        {notes.map((note, i) => text(x + 20, notesY + i * 19, note, { size: 15, fill: GRAY }, `n${i}`))}
                        {text(x + 20, y + h - 22, "Mechanized:", { size: 19, weight: 700 })}{mark(x + 140, y + h - 22, capabilities?.mechanized, "mech")}
                        {text(x + 200, y + h - 22, "Swarm:", { size: 19, weight: 700 })}{mark(x + 275, y + h - 22, capabilities?.swarm, "swarm")}
                        {text(x + 335, y + h - 22, "Leg:", { size: 19, weight: 700 })}{mark(x + 385, y + h - 22, capabilities?.leg, "leg")}
                        {text(x + 445, y + h - 22, "AP:", { size: 19, weight: 700 })}{mark(x + 485, y + h - 22, suit ? suit.getAPMounts().length > 0 : undefined, "ap")}
                        {troopers}
                        {text(rowsX, y + h - 22, "Armor:", { size: 19, weight: 700 })}
                        {armor
                            ? text(rowsX + 75, y + h - 22, `${armor.name}, ${suit!.getArmorPoints()} a trooper${armor.special !== "None" && suit!.getArmorPoints() > 0 ? ` (${armor.special})` : ""}`, { size: 16 })
                            : blank(rowsX + 75, y + h - 22, 400)}
                    </>
                ))}
            </g>
        );
    }

    renderTables(): JSX.Element {
        const x = RIGHT.x, w = RIGHT.w, cx = (fraction: number) => x + w * fraction;
        const modifierColumns = [1, 2, 3, 4, 5, 6].map((n, i) => ({ x: x + 300 + i * 52, header: ["", `${n}`] }));
        return (
            <g>
                {groupBox(x, TOP, w, 240, "LEG ATTACKS TABLE", table(x + 15, TOP + 55, [
                    { x: cx(0.32), header: ["BATTLE ARMOR", "TROOPERS ACTIVE"] }, { x: cx(0.75), header: ["BASE TO-HIT", "MODIFIER"] },
                ], BA_LEG_ATTACKS.map((row) => [...row]), 32))}
                {groupBox(x, TOP + 260, w, 180, "SWARM ATTACKS TABLE", table(x + 15, TOP + 315, [
                    { x: cx(0.32), header: ["BATTLE ARMOR", "TROOPERS ACTIVE"] }, { x: cx(0.75), header: ["BASE TO-HIT", "MODIFIER"] },
                ], BA_SWARM_ATTACKS.map((row) => [...row]), 32))}
                {groupBox(x, TOP + 460, w, 560, "SWARM ATTACK MODIFIERS TABLE", (
                    <>
                        {text(x + 20, TOP + 525, "ATTACKING ENEMY", { size: 16, weight: 700 })}
                        {text(x + 20, TOP + 545, "BATTLE ARMOR", { size: 16, weight: 700 })}
                        {text(x + 20, TOP + 565, "TROOPERS ACTIVE", { size: 16, weight: 700 })}
                        {text(x + 430, TOP + 525, "FRIENDLY MECHANIZED BATTLE", { size: 16, weight: 700, anchor: "middle" })}
                        {text(x + 430, TOP + 545, "ARMOR TROOPERS ACTIVE", { size: 16, weight: 700, anchor: "middle" })}
                        {table(x + 15, TOP + 570, [{ x: x + 100, header: ["", ""] }, ...modifierColumns],
                            BA_SWARM_ATTACK_MODIFIERS.map(([attackers, modifiers]) => [attackers, ...modifiers]), 34)}
                        {text(x + 20, TOP + 860, "BATTLE ARMOR EQUIPMENT", { size: 18, weight: 700 })}
                        {BA_SWARM_EQUIPMENT_MODIFIERS.map(([name, modifier], i) => (
                            <g key={name}>{text(x + 20, TOP + 885 + i * 24, name, { size: 18 })}{text(x + 420, TOP + 885 + i * 24, modifier, { size: 18 })}</g>
                        ))}
                        {text(x + 20, TOP + 920, "SITUATION*", { size: 18, weight: 700 })}
                        {BA_SWARM_SITUATION_MODIFIERS.map(([name, modifier], i) => (
                            <g key={name}>{text(x + 20, TOP + 945 + i * 24, name, { size: 18 })}{text(x + 420, TOP + 945 + i * 24, modifier, { size: 18 })}</g>
                        ))}
                        {text(x + 20, TOP + 1008, "*Modifiers are cumulative.", { size: 14, fill: GRAY })}
                    </>
                ))}
                {groupBox(x, TOP + 1040, w, 490, "SWARM ATTACKS HIT LOCATION TABLE", table(x + 15, TOP + 1095, [
                    { x: x + 70, header: ["2D6", "ROLL"] }, { x: cx(0.42), header: ["BIPEDAL", "LOCATION"] }, { x: cx(0.78), header: ["FOUR-LEGGED", "LOCATION"] },
                ], BA_SWARM_HIT_LOCATIONS.map((row) => [...row]), 32, 19))}
                {groupBox(x, TOP + 1550, w, BOTTOM - TOP - 1550, "TRANSPORT POSITIONS TABLE", (
                    <>
                        {table(x + 15, TOP + 1605, [
                            { x: x + 75, header: ["TROOPER", "NUMBER"] }, { x: cx(0.45), header: ["'MECH", "LOCATION"] }, { x: cx(0.82), header: ["VEHICLE", "LOCATION"] },
                        ], BA_TRANSPORT_POSITIONS.map(([trooper, mech, vehicle]) => [trooper, mech, vehicle]), 34, 19)}
                        {table(x + 15, TOP + 1940, [
                            { x: x + 75, header: ["TROOPER", "NUMBER"] }, { x: cx(0.55), header: ["LARGE SUPPORT", "VEHICLE LOCATION*"] },
                        ], BA_TRANSPORT_POSITIONS.map(([trooper, , , large]) => [trooper, large]), 34, 19)}
                        {text(x + 20, BOTTOM - 22, "*Unit 1 and Unit 2 represent two battle armor units.", { size: 15, fill: GRAY })}
                    </>
                ))}
            </g>
        );
    }

    render = (): JSX.Element => {
        const squads = this.props.squads.slice(0, BA_SQUADS_PER_PAGE);
        return (
            <svg
                version="1.1"
                viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`}
                xmlns="http://www.w3.org/2000/svg"
                data-testid="battle-armor-record-sheet-svg"
            >
                <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
                {titleBanner(LEFT.x, DOC_WIDTH - 2 * LEFT.x, "BATTLE ARMOR RECORD SHEET")}
                {Array.from({ length: BA_SQUADS_PER_PAGE }, (_, i) => this.renderSquad(i, squads[i]))}
                {this.renderTables()}
                {sheetFooter("Tables: TW pp. 221-222, 227.")}
            </svg>
        );
    }
}

interface IBattleArmorRecordSheetSVGProps {
    /** One to five squads; blocks left over print blank. */
    squads: BattleArmor[];
    showDamage?: boolean;
}
