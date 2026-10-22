import React, { type JSX } from 'react';
import CapitalShip from '../../../classes/capital-ship';
import { AdvancedAerospaceArc, AdvancedAerospaceFacing } from '../../../data/advanced-aerospace-construction';
import { ADVANCED_AEROSPACE_CREW_HITS, ADVANCED_AEROSPACE_CRITICAL_BLOCK } from '../../../data/aerospace-record-sheet';
import { IAerospaceInventoryRow, aerospaceInventoryRows } from '../aerospace-sheet-blocks';
import { getUnitQuirkSheetLines } from '../quirk-sheet-block';
import { getRulesLevelName } from '../rules-level-print';
import { ICriticalTrack, criticalDamageBox, heatPerArcBox, largeCraftCrewBox, notesBox, unitDataBox, velocityRecordBox } from './aerospace-record-sheet-svg-blocks';
import { weaponBayName } from './dropship-record-sheet-svg';
import { DOC_HEIGHT, DOC_WIDTH, GRAY, INK, groupBox, sheetFooter, text, titleBanner } from './record-sheet-svg-kit';

// A full-page JumpShip, WarShip or space station record sheet, laid out like the Strategic Operations sheets: the
// unit data with the weapon bays down the left, the armor diagram in capital-scale squares on the right with the
// structural integrity, K-F drive, sail and docking collars in the hull; crew data, critical damage, heat data per
// arc, notes and (not for a station) the velocity record below. Filled in as SO:AA pp.9-11 and p.146 say. Our own
// title block and hull drawing; no official art or logo.

const LEFT = { x: 25, w: 790 };
const MIDDLE_X = 835;
const RIGHT_X = 1325;
const RIGHT_W = 1975 - RIGHT_X;
const TOP = 140;
const DIAGRAM = { x: MIDDLE_X, y: TOP, w: 1975 - MIDDLE_X, h: 1380 };
const LOWER = 1540;
const NOTES_Y = 1720;
const VELOCITY_Y = 2070;
const BOTTOM = 2480;

const ARC_CODES: Record<AdvancedAerospaceArc, string> = {
    nose: "N", foreLeft: "FL", foreRight: "FR", leftBroadside: "LBS", rightBroadside: "RBS", aftLeft: "AL", aftRight: "AR", aft: "A",
};

/**
 * Squares to mark off, as many as fit in the area at the largest size up to 22; filled in black for damage taken.
 * The group carries the count (and the damage, in play) for tests and screen readers.
 */
const squares = (count: number, damaged: number | undefined, x: number, y: number, w: number, h: number, testid: string): JSX.Element => {
    let size = 22;
    while (size > 3 && Math.floor(w / size) * Math.floor(h / size) < count) size -= 0.5;
    const perRow = Math.max(1, Math.floor(w / size));
    return (
        <g data-testid={testid} data-count={count} data-damage={damaged}>
            {Array.from({ length: count }, (_, i) => (
                <rect key={i} x={x + (i % perRow) * size} y={y + Math.floor(i / perRow) * size} width={size - 2} height={size - 2}
                    fill={i < (damaged ?? 0) ? INK : "white"} stroke={INK} strokeWidth={Math.max(0.6, size / 14)} />
            ))}
        </g>
    );
};

export default class CapitalShipRecordSheetSVG extends React.Component<ICapitalShipRecordSheetSVGProps> {
    get ship(): CapitalShip { return this.props.ship; }

    get play() { return this.props.showDamage ? this.ship.getInPlay() : null; }

    get typeName(): string { return this.ship.getShipTypeName(); }

    // Weapons print only in their bays, so a quirked weapon is named with its arc in the notes.
    get quirkLines() {
        const ship = this.ship;
        const label = (item: { name: string; location?: string }) => item.name + (item.location ? ` (${ship.getArcName(item.location as AdvancedAerospaceArc)})` : "");
        const items = ship.getEquipmentList().map((item) => ({ uuid: item.uuid, label: label(item) }));
        const lines = getUnitQuirkSheetLines(ship.quirks, items, ship.getQuirkTargets().locations);
        return { unit: lines.unit, weapons: lines.weapons.map((weapon) => `${items.find((item) => item.uuid === weapon.uuid)?.label ?? weapon.uuid}: ${weapon.text}`) };
    }

    get carried(): { fighters: number; smallCraft: number; fighterDoors: number; smallCraftDoors: number } {
        const bays = this.ship.getBays();
        const sum = (tag: string, field: "amount" | "doors") => bays.filter((bay) => bay.tag === tag).reduce((total, bay) => total + bay[field], 0);
        return { fighters: sum("fighter", "amount"), smallCraft: sum("small-craft", "amount"), fighterDoors: sum("fighter", "doors"), smallCraftDoors: sum("small-craft", "doors") };
    }

    get inventoryRows(): IAerospaceInventoryRow[] {
        const ship = this.ship;
        const play = this.play;
        const bays = ship.getArcs().flatMap((arc) => ship.getArcWeaponBays(arc).map((bay, index): IAerospaceInventoryRow => ({
            quantity: 1,
            name: weaponBayName(bay) + (play && ship.isBayDestroyed(arc, index) ? " (destroyed)" : ""),
            location: ARC_CODES[arc],
            heat: bay.heat,
            values: bay.values,
            capital: bay.capital,
        })));
        const equipment = aerospaceInventoryRows(
            ship.getEquipmentList().filter((item) => !ship.isWeapon(item)),
            (tag) => ARC_CODES[tag as AdvancedAerospaceArc] ?? (tag === "hull" ? "H" : tag),
        ).map((row) => ({ ...row, name: row.quantity > 1 ? `${row.quantity} ${row.name}` : row.name, values: null }));
        return [...bays, ...equipment.map((row) => ({ ...row, values: [0, 0, 0, 0] as [number, number, number, number] }))];
    }

    renderData(): JSX.Element {
        const ship = this.ship;
        const carried = this.carried;
        const name = `${ship.getName()} ${ship.getModel()}`.trim();
        const key = [...ship.getArcs().map((arc) => `${ARC_CODES[arc]} ${ship.getArcName(arc)}`), "H Hull"].join(", ");
        const ammo = [
            ...ship.getCapitalWeapons().filter((mount) => ship.getCapitalShots(mount) > 0)
                .map((mount) => `${mount.weapon.name} (${ARC_CODES[mount.location as AdvancedAerospaceArc] ?? mount.location}) ${ship.getCapitalShots(mount)}`),
            ...ship.getEquipmentList().filter((item) => item.isAmmo).map((item) => item.name),
        ];
        const thrust = ship.isWarShip()
            ? [
                { label: "Thrust:" },
                { label: "Safe Thrust:", value: ship.getSafeThrust(), indent: true },
                { label: "Maximum Thrust:", value: ship.getMaxThrust(), indent: true },
            ]
            : [{ label: "Thrust:", value: "Station-Keeping Only", valueAt: 140 }];
        return unitDataBox(LEFT.x, TOP, LEFT.w, NOTES_Y - 20 - TOP, {
            title: `${this.typeName.toUpperCase()} DATA`,
            type: name || this.typeName,
            left: [
                ...thrust,
                { label: "Fuel:", value: `${ship.getFuelPoints().toLocaleString("en-US")} points (${ship.getFuelTons().toLocaleString("en-US")} tons)`, valueAt: 140 },
                { label: "DropShip Capacity:", value: ship.getDockingCollars(), valueAt: 270 },
                { label: "Fighters/Small Craft:", value: `${carried.fighters}/${carried.smallCraft}`, valueAt: 270 },
            ],
            right: [
                { label: "Tonnage:", value: ship.getTonnage().toLocaleString("en-US") },
                { label: "Tech Base:", value: ship.getTech().name },
                { label: "Rules Level:", value: getRulesLevelName(ship.getRequiredRulesLevel()) },
                { label: "Burn Days:", value: ship.getBurnDays().toLocaleString("en-US") },
                { label: "Launch Rate:", value: `${carried.fighterDoors * 2}/${carried.smallCraftDoors * 2}` },
            ],
            rows: this.inventoryRows,
            capitalScale: true,
            locationTitle: "Loc",
            locationKey: `Arc: ${key}. Standard bays: capital scale (standard scale). (C): capital weapons.`,
            ammo: ammo.join(", ") || "none",
            cost: ship.getCBillCost(),
            bv: this.props.showPilot ? `${ship.getBattleValue().toLocaleString("en-US")} (${ship.getPilotAdjustedBattleValue().toLocaleString("en-US")} adj.)` : ship.getBattleValue().toLocaleString("en-US"),
        });
    }

    // One facing: its name, damage threshold and total armor, then its armor in squares.
    renderFacing(facing: AdvancedAerospaceFacing, x: number, y: number, w: number, h: number): JSX.Element {
        const ship = this.ship;
        const armor = ship.getFacingArmor(facing);
        return (
            <g key={facing}>
                <rect x={x} y={y} width={w} height={h} fill="white" stroke={INK} strokeWidth={2} rx={8} />
                {text(x + 10, y + 26, ship.getFacingName(facing), { size: 20, weight: 700 })}
                {text(x + w - 10, y + 26, `Threshold ${ship.getDamageThresholds()[facing]} (${armor})`, { size: 17, anchor: "end" })}
                {squares(armor, this.play ? this.play.armorDamage[facing] : undefined, x + 10, y + 38, w - 20, h - 46, `capital-armor-${facing}`)}
            </g>
        );
    }

    // The hull: our own drawing, a long hull with drive and docking spines for a JumpShip or WarShip, a wheel for a
    // station; the integrity tracks sit inside it.
    renderHull(cx: number, top: number, bottom: number): JSX.Element {
        const fill = "rgb(232,232,232)", stroke = "rgb(150,150,150)";
        if (this.ship.isSpaceStation()) {
            const cy = (top + bottom) / 2, r = (bottom - top) / 2;
            return (
                <g data-testid="station-silhouette" fill={fill} stroke={stroke} strokeWidth={3}>
                    <circle cx={cx} cy={cy} r={r} />
                    <circle cx={cx} cy={cy} r={r - 40} fill="white" />
                    {[0, 60, 120].map((angle) => <rect key={angle} x={cx - 24} y={top} width={48} height={bottom - top} transform={`rotate(${angle} ${cx} ${cy})`} />)}
                    <rect x={cx - 190} y={cy - 250} width={380} height={500} rx={60} />
                </g>
            );
        }
        return (
            <g data-testid="capital-silhouette" fill={fill} stroke={stroke} strokeWidth={3}>
                <path d={`M${cx - 120},${top + 70} L${cx - 70},${top} L${cx + 70},${top} L${cx + 120},${top + 70} Z`} />
                <rect x={cx - 210} y={top + 60} width={420} height={bottom - top - 120} rx={70} />
                {[0.28, 0.62].map((at) => (
                    <g key={at}>
                        <rect x={cx - 250} y={top + (bottom - top) * at} width={40} height={110} rx={10} />
                        <rect x={cx + 210} y={top + (bottom - top) * at} width={40} height={110} rx={10} />
                    </g>
                ))}
                <path d={`M${cx - 150},${bottom - 60} L${cx - 190},${bottom} L${cx + 190},${bottom} L${cx + 150},${bottom - 60} Z`} />
            </g>
        );
    }

    renderArmorDiagram(): JSX.Element {
        const ship = this.ship;
        const play = this.play;
        const { x, y, w } = DIAGRAM;
        const cx = x + w / 2;
        const side = 300, center = 440;
        const sideX = { left: x + 20, right: x + w - 20 - side };
        const tracks: { label: string; count: number; damaged?: number; height: number; testid: string }[] = [
            { label: `Structural Integrity: ${ship.getStructuralIntegrity()}`, count: ship.getStructuralIntegrity(), damaged: play?.structureDamage, height: 200, testid: "capital-track-si" },
            ...(ship.hasKFDrive() ? [
                { label: `K-F Drive Integrity: ${ship.getKFDriveIntegrity()}`, count: ship.getKFDriveIntegrity(), damaged: play?.kfDriveDamage, height: 90, testid: "capital-track-kf" },
                { label: `Sail Integrity: ${ship.getJumpSailIntegrity()}`, count: ship.getJumpSailIntegrity(), height: 50, testid: "capital-track-sail" },
            ] : []),
            // A station may carry a sail with energy storage batteries (SO:AA p.136); we do not build one, so the
            // official sheet's line is left to write in.
            ...(ship.isSpaceStation() ? [{ label: "Sail Integrity: ____", count: 0, height: 50, testid: "capital-track-sail" }] : []),
            { label: `Docking Collars: ${ship.getDockingCollars()}`, count: ship.getDockingCollars(), damaged: play?.dockingCollarsDamaged, height: 50, testid: "capital-track-collars" },
        ];
        let trackY = y + 470;
        return groupBox(x, y, w, DIAGRAM.h, "ARMOR DIAGRAM", (
            <>
                {text(x + 20, y + 75, "Capital Scale", { size: 22, weight: 700 })}
                {text(x + w - 20, y + 75, `Armor: ${ship.getArmorType().name}`, { size: 20, anchor: "end" })}
                {text(x + 20, y + 100, "Each facing: Damage Threshold (Total Armor).", { size: 17, fill: GRAY })}
                {this.renderHull(cx, y + 380, y + 1110)}
                {this.renderFacing("nose", cx - center / 2 - 40, y + 115, center + 80, 250)}
                {this.renderFacing("foreLeft", sideX.left, y + 390, side, 340)}
                {this.renderFacing("foreRight", sideX.right, y + 390, side, 340)}
                {this.renderFacing("aftLeft", sideX.left, y + 760, side, 340)}
                {this.renderFacing("aftRight", sideX.right, y + 760, side, 340)}
                {this.renderFacing("aft", cx - center / 2 - 40, y + 1120, center + 80, 245)}
                {tracks.map((track) => {
                    const ty = trackY;
                    trackY += track.height + 40;
                    return (
                        <g key={track.testid}>
                            {text(cx, ty, track.label, { size: 20, weight: 700, anchor: "middle" })}
                            {squares(track.count, track.damaged, cx - 170, ty + 10, 340, track.height, track.testid)}
                        </g>
                    );
                })}
            </>
        ));
    }

    renderNotes(y: number, h: number): JSX.Element {
        const ship = this.ship;
        const notes: string[] = [];
        const quirks = this.quirkLines;
        if (quirks.unit.length) notes.push(`Quirks: ${quirks.unit.join(", ")}`);
        if (quirks.weapons.length) notes.push(`Weapon quirks: ${quirks.weapons.join("; ")}`);
        ship.getBays().forEach((bay, index) => notes.push(`Bay ${index + 1}: ${ship.getBayName(bay)} (${bay.amount}) ${bay.doors} Door${bay.doors === 1 ? "" : "s"}`));
        if (ship.getGravDeckCount() > 0) notes.push(`Grav Decks: ${ship.getGravDeckCount()}`);
        if (ship.isMonitor()) notes.push(`Monitor (Custom): carried on ${ship.getCarrierCollarsNeeded()} docking collars.`);
        const play = this.play;
        if (play && play.gravDecksDamaged > 0) notes.push(`Grav decks damaged: ${play.gravDecksDamaged}`);
        if (play && play.doorsDamaged > 0) notes.push(`Doors damaged: ${play.doorsDamaged}`);
        if (play && play.cargoLostPercent > 0) notes.push(`Cargo lost: ${play.cargoLostPercent}%`);
        notes.push("No heat scale: an arc may not fire if its heat would pass the heat sinks' capacity (SO:AA p.11).");
        return notesBox(LEFT.x, y, LEFT.w, h, notes);
    }

    renderCrewData(): JSX.Element {
        const ship = this.ship;
        const pilot = ship.getPilot();
        const show = this.props.showPilot;
        return largeCraftCrewBox(MIDDLE_X, LOWER, 470, 400, {
            gunnery: show ? pilot.gunnery : undefined,
            piloting: show ? pilot.piloting : undefined,
            hits: this.play?.crewHits ?? 0,
            modifiers: ADVANCED_AEROSPACE_CREW_HITS,
            people: [
                ["Crew:", ship.getCrew()], ["Marines:", ship.getMarines()],
                ["Passengers:", ship.getPassengers()], ["Elementals:", undefined],
                ["Other:", undefined], ["Battle Armor:", undefined],
            ],
            lifeBoats: ship.getLifeBoats(),
            escapePods: ship.getEscapePods(),
        });
    }

    renderCriticalDamage(): JSX.Element {
        const play = this.play;
        const station = this.ship.isSpaceStation();
        const boxes = (name: string) => ADVANCED_AEROSPACE_CRITICAL_BLOCK.find((entry) => entry.name === name)!.boxes;
        const track = (name: string, filled: number): ICriticalTrack => ({ name, boxes: boxes(name), filled: play ? filled : 0 });
        return criticalDamageBox(RIGHT_X, LOWER, RIGHT_W, 560, [
            [
                track("Avionics", play?.avionics ?? 0),
                track("CIC", play?.cic ?? 0),
                track("Sensors", play?.sensors ?? 0),
                track("Left Thrusters", play?.leftThruster ?? 0),
                track("Right Thrusters", play?.rightThruster ?? 0),
                ...(station ? [] : [track("Engine", play?.engine ?? 0)]),
            ],
            [track("Life Support", play?.lifeSupport ? 1 : 0)],
        ], [30, 420]);
    }

    renderHeatData(): JSX.Element {
        const ship = this.ship;
        return heatPerArcBox(RIGHT_X, 2120, RIGHT_W, BOTTOM - 2120, {
            count: ship.getTotalHeatSinks(),
            dissipation: ship.getHeatDissipation(),
            double: ship.getHeatSinkType().tag !== "single",
            arcs: ship.getArcs().map((arc) => [ship.getArcName(arc), ship.getArcWeaponBays(arc).reduce((sum, bay) => sum + bay.heat, 0)]),
        });
    }

    render = (): JSX.Element => {
        const station = this.ship.isSpaceStation();
        return (
            <svg
                version="1.1"
                viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`}
                xmlns="http://www.w3.org/2000/svg"
                data-testid="capital-ship-record-sheet-svg"
            >
                <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
                {titleBanner(LEFT.x, 1395, `${this.typeName} RECORD SHEET`.toUpperCase())}
                {this.renderData()}
                {this.renderArmorDiagram()}
                {this.renderNotes(NOTES_Y, (station ? BOTTOM : VELOCITY_Y - 20) - NOTES_Y)}
                {this.renderCrewData()}
                {this.renderCriticalDamage()}
                {station ? null : velocityRecordBox(LEFT.x, VELOCITY_Y, RIGHT_X - 20 - LEFT.x, BOTTOM - VELOCITY_Y, false)}
                {this.renderHeatData()}
                {sheetFooter("Tables: SO:AA pp. 9-11.")}
            </svg>
        );
    }
}

interface ICapitalShipRecordSheetSVGProps {
    ship: CapitalShip;
    showPilot?: boolean;
    showDamage?: boolean;
}
