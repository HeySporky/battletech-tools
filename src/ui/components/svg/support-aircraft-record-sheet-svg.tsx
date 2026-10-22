import React, { type JSX } from 'react';
import { FighterLocation } from '../../../classes/aerospace-fighter';
import { ADVANCED_AEROSPACE_CREW_HITS } from '../../../data/aerospace-record-sheet';
import { AIRSHIP_VELOCITY_TABLE } from '../../../data/support-aircraft';
import { aerospaceInventoryRows } from '../aerospace-sheet-blocks';
import { weaponQuirkSuffix } from '../quirk-sheet-block';
import { getRulesLevelName } from '../rules-level-print';
import { largeCraftCrewBox, notesBox, unitDataBox, velocityRecordBox } from './aerospace-record-sheet-svg-blocks';
import FighterDiagramSVG from './fighter-diagram-svg';
import FighterRecordSheetSVG from './fighter-record-sheet-svg';
import { DOC_HEIGHT, DOC_WIDTH, INK, SHADE, groupBox, hitBox, sheetFooter, text, titleBanner } from './record-sheet-svg-kit';

// The Airship and Satellite record sheets, laid out like the Total Warfare Airship Record Sheet and the Tactical
// Operations Satellite Record Sheet (TO:AUE p.213): the craft data with its weapons inventory down the left, the armor
// diagram on the right, then notes, crew data and critical damage, with the velocity record and the Airship Velocity
// Table (TW p.204) for an Airship. A Satellite holds station, so it has neither. Fixed-wing Support Vehicles print on
// the conventional fighter sheet. Our own title block and craft silhouettes; no official art or logo.

const LEFT = { x: 25, w: 790 };
const MIDDLE_X = 835;
const RIGHT_X = 1325;
const TOP = 140;

// The engine track of these sheets runs -1 to -5 Thrust, then destroyed; the Thrusters, CIC and the rest are the
// large craft's tracks.
const TRACKS: Record<string, string[]> = {
    Avionics: ["+1", "+2", "+5"],
    FCS: ["+2", "+4", "D"],
    CIC: ["+2", "+4", "D"],
    Sensors: ["+1", "+2", "+5"],
    "Left Thrusters": ["+1", "+2", "+3", "D"],
    "Right Thrusters": ["+1", "+2", "+3", "D"],
    Engine: ["-1", "-2", "-3", "-4", "-5", "D"],
    Gear: ["+5"],
    "Life Support": ["+2"],
};

export default class SupportAircraftRecordSheetSVG extends FighterRecordSheetSVG {
    get satellite(): boolean { return this.fighter.getSupportMotive() === "satellite"; }

    get locationCodes(): Record<FighterLocation, string> {
        return this.satellite
            ? { nose: "N", leftWing: "L", rightWing: "R", aft: "A", fuselage: "FU" }
            : { nose: "N", leftWing: "LW", rightWing: "RW", aft: "A", fuselage: "FU" };
    }

    renderCraftData(h: number): JSX.Element {
        const craft = this.fighter;
        const play = this.play;
        const quirkLines = this.quirkLines;
        const name = `${craft.getName()} ${craft.getModel()}`.trim();
        const codes = this.locationCodes;
        const ammo = craft.getEquipmentList().filter((item) => item.isAmmo).map((item) => item.name);
        return unitDataBox(LEFT.x, TOP, LEFT.w, h, {
            title: this.satellite ? "SATELLITE DATA" : "AIRSHIP DATA",
            type: name || craft.getFighterTypeName(),
            left: this.satellite
                ? [{ label: "Thrust:" }, { label: "Station Keeping Only", indent: true }, { label: "Engine:", value: craft.getSupportEngine()?.name ?? "", valueAt: 140 }]
                : [
                    { label: "Thrust:" },
                    { label: "Safe Thrust:", value: craft.getSafeThrust(), indent: true },
                    { label: "Maximum Thrust:", value: craft.getMaxThrust(), indent: true },
                    { label: "Engine:", value: craft.getSupportEngine()?.name ?? "", valueAt: 140 },
                ],
            right: [
                { label: "Tonnage:", value: craft.getTonnage() },
                { label: "Tech Base:", value: craft.getTech().name },
                { label: "Rules Level:", value: getRulesLevelName(craft.getRequiredRulesLevel()) },
                this.satellite ? { label: "Burn Days:", value: craft.getSatelliteBurnDays() } : { label: "Fuel:", value: `${craft.getFuelPoints()} points` },
            ],
            rows: aerospaceInventoryRows(
                craft.getEquipmentList(),
                (tag) => codes[tag as FighterLocation] ?? tag,
                (item) => (play && craft.isWeaponDestroyed(item.uuid ?? "") ? " (destroyed)" : "") + weaponQuirkSuffix(quirkLines, item.uuid),
            ),
            locationKey: this.satellite ? "Loc.: N Nose, L Left, R Right, A Aft, FU Fuselage" : "Loc.: N Nose, LW Left Wing, RW Right Wing, A Aft, FU Fuselage",
            ammo: ammo.length ? ammo.join(", ") : "",
            cost: craft.getCBillCost(),
            bv: this.props.showPilot ? `${craft.getBattleValue()} (${craft.getPilotAdjustedBattleValue()} adj.)` : craft.getBattleValue(),
        });
    }

    // The diagram stands tall, centered in its box, with the BAR above it as on the official sheets.
    renderDiagram(h: number): JSX.Element {
        const craft = this.fighter;
        const play = this.play;
        const w = DOC_WIDTH - 25 - MIDDLE_X;
        const diagramW = Math.min(w - 40, Math.round((h - 100) * 600 / 760));
        const diagramH = Math.round(diagramW / 600 * 760);
        return groupBox(MIDDLE_X, TOP, w, h, "ARMOR DIAGRAM", (
            <>
                {text(MIDDLE_X + w - 30, TOP + 80, `BAR: ${craft.getBAR()}`, { size: 24, weight: 700, anchor: "end" })}
                {text(MIDDLE_X + w - 30, TOP + 108, "Standard Scale", { size: 16, anchor: "end" })}
                <FighterDiagramSVG
                    x={MIDDLE_X + (w - diagramW) / 2}
                    y={TOP + 90 + (h - 90 - diagramH) / 2}
                    width={diagramW}
                    tall
                    silhouette={this.satellite ? "satellite" : "airship"}
                    sideLabels={this.satellite ? { left: "Left", right: "Right" } : undefined}
                    maxPipSpacing={24}
                    armor={craft.getArmorAllocation()}
                    structuralIntegrity={craft.getStructuralIntegrity()}
                    thresholds={craft.getDamageThresholds()}
                    armorDamage={play?.armorDamage}
                    structureDamage={play?.structureDamage}
                />
            </>
        ));
    }

    renderCrew(y: number, h: number): JSX.Element {
        const craft = this.fighter;
        const pilot = craft.getPilot();
        const show = this.props.showPilot;
        return largeCraftCrewBox(MIDDLE_X, y, 470, h, {
            gunnery: show ? pilot.gunnery : undefined,
            piloting: show ? pilot.piloting : undefined,
            hits: this.play?.pilotHits ?? 0,
            modifiers: ADVANCED_AEROSPACE_CREW_HITS,
            people: [
                ["Crew:", craft.getCrew()], ["Marines:", undefined],
                ["Passengers:", undefined], ["Elementals:", undefined],
                ["Other:", undefined], ["Battle Armor:", undefined],
            ],
            lifeBoats: 0,
            escapePods: 0,
        });
    }

    renderCriticals(y: number, h: number): JSX.Element {
        const play = this.play;
        const filled = (name: string): number => {
            if (!play) return 0;
            switch (name) {
                case "Avionics": return play.avionics;
                case "FCS": case "CIC": return play.fcs;
                case "Sensors": return play.sensors;
                case "Engine": return Math.min(6, play.engine);
                case "Gear": return play.gear ? 1 : 0;
                default: return 0;
            }
        };
        // As on the official sheets: the main tracks down the left, with Left and Right under a Thrusters heading, and
        // Gear and Life Support in the right-hand column.
        const x = RIGHT_X, w = DOC_WIDTH - 25 - RIGHT_X;
        const left = this.satellite
            ? ["Avionics", "CIC", "Sensors", "Thrusters", "Left Thrusters", "Right Thrusters"]
            : ["Avionics", "FCS", "Sensors", "Thrusters", "Left Thrusters", "Right Thrusters", "Engine"];
        const right = this.satellite ? ["Life Support"] : ["Gear", "Life Support"];
        const rowH = Math.min(52, (h - 90) / left.length);
        const track = (name: string, tx: number, ty: number, boxesX: number) => {
            if (!TRACKS[name]) return <g key={name}>{text(tx, ty, name, { size: 22, weight: 700 })}</g>;
            const label = name.replace(/ Thrusters$/, "");
            const marked = filled(name);
            return (
                <g key={name} data-testid={`crit-${name}`} data-filled={marked}>
                    {text(label === name ? tx : tx + 30, ty, label, { size: 22, weight: 700 })}
                    {TRACKS[name].map((box, i) => hitBox(boxesX + i * 44, ty, box, `${name}${i}`, i < marked))}
                </g>
            );
        };
        return groupBox(x, y, w, h, "CRITICAL DAMAGE", (
            <>
                {left.map((name, r) => track(name, x + 25, y + 95 + r * rowH, x + 165))}
                {right.map((name, r) => track(name, x + 445, y + 95 + r * rowH, x + w - 65))}
            </>
        ));
    }

    // Airship Velocity Table (TW p.204): the Thrust Points spent in each turn of the four-turn cycle at each velocity.
    renderAirshipVelocityTable(y: number, h: number): JSX.Element {
        const x = RIGHT_X, w = DOC_WIDTH - 25 - RIGHT_X;
        const rowH = (h - 130) / AIRSHIP_VELOCITY_TABLE.length;
        const firstW = 170, colW = (w - 40 - firstW) / 4;
        const cx = (i: number) => x + 20 + firstW + colW * i + colW / 2;
        return groupBox(x, y, w, h, "AIRSHIP VELOCITY TABLE", (
            <>
                {text((cx(0) + cx(3)) / 2, y + 68, "Thrust Points per Cycle Turn", { size: 20, weight: 700, anchor: "middle" })}
                {text(x + 20 + firstW / 2, y + 88, "Current", { size: 18, weight: 700, anchor: "middle" })}
                {text(x + 20 + firstW / 2, y + 108, "Velocity", { size: 18, weight: 700, anchor: "middle" })}
                {[1, 2, 3, 4].map((turn, i) => text(cx(i), y + 108, turn, { size: 20, weight: 700, anchor: "middle" }, `t${turn}`))}
                {AIRSHIP_VELOCITY_TABLE.map((row, r) => {
                    const ry = y + 118 + r * rowH;
                    return (
                        <g key={row.velocity} data-testid="airship-velocity" data-velocity={row.velocity} data-thrust={row.thrustPerTurn.join(",")}>
                            {r % 2 === 0 ? <rect x={x + 15} y={ry} width={w - 30} height={rowH} fill={SHADE} /> : null}
                            {text(x + 20 + firstW / 2, ry + rowH * 0.75, row.velocity, { size: 18, anchor: "middle" })}
                            {row.thrustPerTurn.map((points, i) => text(cx(i), ry + rowH * 0.75, points || "—", { size: 18, anchor: "middle" }, `p${i}`))}
                        </g>
                    );
                })}
                <line x1={x + 20 + firstW} y1={y + 118} x2={x + 20 + firstW} y2={y + 118 + rowH * AIRSHIP_VELOCITY_TABLE.length} stroke={INK} strokeWidth={1.5} />
            </>
        ));
    }

    render = (): JSX.Element => {
        const satellite = this.satellite;
        const title = satellite ? "SATELLITE RECORD SHEET" : "AIRSHIP RECORD SHEET";
        const lower = satellite ? 1380 : 1620;
        const lowerH = satellite ? 520 : 420;
        return (
            <svg
                version="1.1"
                viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`}
                xmlns="http://www.w3.org/2000/svg"
                data-testid="support-aircraft-record-sheet-svg"
            >
                <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
                {titleBanner(LEFT.x, 1395, title)}
                {this.renderCraftData(satellite ? 1760 : 1460)}
                {this.renderDiagram(lower - 20 - TOP)}
                {this.renderCrew(lower, lowerH)}
                {this.renderCriticals(lower, lowerH)}
                {satellite
                    ? notesBox(LEFT.x, 1920, DOC_WIDTH - 50, 540, this.noteLines(true))
                    : <>
                        {notesBox(LEFT.x, lower, LEFT.w, lowerH, this.noteLines(true))}
                        {velocityRecordBox(LEFT.x, 2060, RIGHT_X - 20 - LEFT.x, 410)}
                        {this.renderAirshipVelocityTable(2060, 410)}
                    </>}
                {sheetFooter(satellite ? "Tables: Total Warfare pp. 204-206; Tactical Operations: Advanced Units & Equipment p. 66." : "Tables: Total Warfare pp. 204-206.")}
            </svg>
        );
    };
}
