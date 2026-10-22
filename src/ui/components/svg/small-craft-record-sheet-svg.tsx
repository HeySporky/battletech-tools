import React, { type JSX } from 'react';
import SmallCraft from '../../../classes/small-craft';
import { AEROSPACE_FIGHTER_CRITICAL_BLOCK } from '../../../data/aerospace-record-sheet';
import { SMALL_CRAFT_ARCS, SmallCraftArc, findTransportBayType, quartersTypes } from '../../../data/small-craft-construction';
import { aerospaceInventoryRows } from '../aerospace-sheet-blocks';
import { getUnitQuirkSheetLines, weaponQuirkSuffix } from '../quirk-sheet-block';
import { getRulesLevelName } from '../rules-level-print';
import {
    ICriticalTrack, armorDataBox, criticalDamageBox, heatDataBox, heatScaleColumn, notesBox, pilotDataBox, unitDataBox, velocityRecordBox,
} from './aerospace-record-sheet-svg-blocks';
import FighterDiagramSVG from './fighter-diagram-svg';
import { DOC_HEIGHT, DOC_WIDTH, INK, groupBox, sheetFooter, titleBanner, wrapText } from './record-sheet-svg-kit';

// A full-page Small Craft record sheet, laid out like the Total Warfare Aerodyne and Spheroid Small Craft record
// sheets: craft data with the weapons inventory, notes and the armor diagram on top; critical damage, crew data and the
// velocity record below, with the heat data and heat scale on the right. Armor data and a crew and cargo box take the
// place the fighter sheet gives its external stores. Our own title block and craft silhouettes; no official art or logo.

const LEFT = { x: 25, w: 790 };
const MIDDLE_X = 835;
const RIGHT_X = 1325;
const TOP = 140;
const BOTTOM = 1690;

// Arc codes, keyed under the inventory.
const ARC_CODES: Record<"aerodyne" | "spheroid", Record<SmallCraftArc | "hull", string>> = {
    aerodyne: { nose: "N", left: "LW", right: "RW", leftAft: "LW(R)", rightAft: "RW(R)", aft: "A", hull: "H" },
    spheroid: { nose: "N", left: "FL", right: "FR", leftAft: "AL", rightAft: "AR", aft: "A", hull: "H" },
};

// The engine loses 1 Safe Thrust a hit and the sixth destroys it; a thruster hit adds 1 to the cost of turning away
// from that side and the fourth disables it (TW pp. 239-240).
const ENGINE_BOXES = ["-1", "-2", "-3", "-4", "-5", "D"];
const THRUSTER_BOXES = ["+1", "+2", "+3", "D"];

export default class SmallCraftRecordSheetSVG extends React.Component<ISmallCraftRecordSheetSVGProps> {
    get craft(): SmallCraft { return this.props.craft; }

    get play() { return this.props.showDamage ? this.craft.getInPlay() : null; }

    get shape(): "aerodyne" | "spheroid" { return this.craft.isAerodyne() ? "aerodyne" : "spheroid"; }

    get quirkLines() {
        const craft = this.craft;
        return getUnitQuirkSheetLines(craft.quirks, craft.getEquipmentList().map((item) => ({ uuid: item.uuid, label: item.name })), craft.getQuirkTargets().locations);
    }

    renderCraftData(): JSX.Element {
        const craft = this.craft;
        const play = this.play;
        const quirkLines = this.quirkLines;
        const codes = ARC_CODES[this.shape];
        const name = `${craft.getName()} ${craft.getModel()}`.trim();
        const key = [...SMALL_CRAFT_ARCS.map((arc) => `${codes[arc]} ${craft.getArcName(arc)}`), "H Hull"].join(", ");
        return unitDataBox(LEFT.x, TOP, LEFT.w, 1090, {
            title: "CRAFT DATA",
            type: name || `${craft.getShapeName()} Small Craft`,
            left: [
                { label: "Thrust:" },
                { label: "Safe Thrust:", value: craft.getSafeThrust(), indent: true },
                { label: "Maximum Thrust:", value: craft.getMaxThrust(), indent: true },
                { label: "Fuel:", value: `${craft.getFuelPoints()} points (${craft.getFuelTons()} tons)`, indent: true, valueAt: 140 },
            ],
            right: [
                { label: "Tonnage:", value: craft.getTonnage() },
                { label: "Tech Base:", value: craft.getTech().name },
                { label: "Rules Level:", value: getRulesLevelName(craft.getRequiredRulesLevel()) },
                { label: "Burn Days:", value: `${craft.getBurnDays()} at 1 G` },
            ],
            rows: aerospaceInventoryRows(
                craft.getEquipmentList(),
                (tag) => codes[tag as SmallCraftArc | "hull"] ?? tag,
                (item) => (play && craft.isWeaponDestroyed(item.uuid ?? "") ? " (destroyed)" : "") + weaponQuirkSuffix(quirkLines, item.uuid),
            ),
            locationTitle: "Arc",
            locationKey: `Arc: ${key}`,
            cost: craft.getCBillCost(),
            bv: this.props.showPilot ? `${craft.getBattleValue()} (${craft.getPilotAdjustedBattleValue()} adj.)` : craft.getBattleValue(),
        });
    }

    renderArmorData(): JSX.Element {
        const craft = this.craft;
        const armor = craft.getArmorAllocation();
        const thresholds = craft.getDamageThresholds();
        const facings = ["nose", "left", "right", "aft"] as const;
        return armorDataBox(MIDDLE_X, TOP, 590, 460,
            facings.map((facing) => ({ name: craft.getFacingName(facing), threshold: thresholds[facing], armor: armor[facing] })),
            [["Structural Integrity:", craft.getStructuralIntegrity()], ["Armor:", craft.getArmorType().name]]);
    }

    // Crew, passengers, quarters, escape pods and bays: what the official sheet leaves to the notes.
    renderCrewAndCargo(): JSX.Element {
        const craft = this.craft;
        const play = this.play;
        const x = 1440, y = TOP, w = 535, h = 460;
        const quarters = quartersTypes.filter((type) => craft.getQuarters()[type.tag] > 0).map((type) => `${craft.getQuarters()[type.tag]} ${type.name}`);
        const lines: string[] = [
            `Crew: ${craft.getCrew()} (${craft.getOfficers()} officer${craft.getOfficers() === 1 ? "" : "s"}, ${craft.getMinimumGunners()} gunner${craft.getMinimumGunners() === 1 ? "" : "s"})`,
            `Passengers: ${craft.getPassengers()}`,
            `Quarters: ${quarters.join(", ") || "none"}`,
            `Escape Pods: ${craft.getEscapePods()}; Lifeboats: ${craft.getLifeBoats()}`,
            ...craft.getBays().map((bay) => {
                const type = findTransportBayType(bay.tag);
                const amount = type?.tonsEach === null ? `${bay.amount} tons` : `${bay.amount} (${craft.getBayWeight(bay)} tons)`;
                return `${craft.getBayName(bay)}: ${amount}, ${bay.doors} door${bay.doors === 1 ? "" : "s"}`;
            }),
        ];
        if (!craft.getBays().length) lines.push("No transport bays");
        if (play && play.doorsDamaged > 0) lines.push(`Doors damaged: ${play.doorsDamaged}`);
        if (play && play.cargoLostPercent > 0) lines.push(`Cargo lost: ${play.cargoLostPercent}%`);
        let cursor = y + 80;
        return groupBox(x, y, w, h, "CREW & CARGO", lines.map((line, index) => {
            const wrapped = wrapText(line, 44);
            const ly = cursor;
            cursor += wrapped.length * 26 + 8;
            return (
                <text key={index} x={x + 20} y={ly} fontFamily="sans-serif" fontSize={21} fill={INK}>
                    {wrapped.map((part, pi) => <tspan key={pi} x={x + (pi === 0 ? 20 : 40)} dy={pi === 0 ? 0 : 26}>{part}</tspan>)}
                </text>
            );
        }));
    }

    renderArmorDiagram(): JSX.Element {
        const craft = this.craft;
        const play = this.play;
        const armor = craft.getArmorAllocation();
        const thresholds = craft.getDamageThresholds();
        const y = 620, h = 1050, w = 1835 - MIDDLE_X;
        const diagramW = w - 40;
        const diagramH = Math.round(diagramW / 600 * 470);
        return groupBox(MIDDLE_X, y, w, h, "ARMOR DIAGRAM", (
            <FighterDiagramSVG
                x={MIDDLE_X + 20}
                y={y + 50 + (h - 50 - diagramH) / 2}
                width={diagramW}
                silhouette={this.shape}
                maxPipSpacing={24}
                armor={{ nose: armor.nose, leftWing: armor.left, rightWing: armor.right, aft: armor.aft }}
                structuralIntegrity={craft.getStructuralIntegrity()}
                thresholds={{ nose: thresholds.nose, leftWing: thresholds.left, rightWing: thresholds.right, aft: thresholds.aft }}
                armorDamage={play ? { nose: play.armorDamage.nose, leftWing: play.armorDamage.left, rightWing: play.armorDamage.right, aft: play.armorDamage.aft } : undefined}
                structureDamage={play?.structureDamage}
                sideLabels={{ left: craft.getFacingName("left"), right: craft.getFacingName("right") }}
            />
        ));
    }

    renderNotes(): JSX.Element {
        const craft = this.craft;
        const notes: string[] = [];
        const quirkLines = this.quirkLines;
        if (quirkLines.unit.length) notes.push(`Quirks: ${quirkLines.unit.join(", ")}`);
        const ammo = craft.getEquipmentList().filter((item) => item.isAmmo).map((item) => item.name);
        if (ammo.length) notes.push(`Ammo: ${ammo.join(", ")}`);
        notes.push("Engine: -1 Safe Thrust a hit, destroyed on the sixth. Thruster: +1 to turn away from that side a hit, disabled on the fourth (TW pp. 239-240).");
        return notesBox(LEFT.x, 1250, LEFT.w, 420, notes);
    }

    renderCriticalDamage(): JSX.Element {
        const play = this.play;
        const fighterBoxes = (name: string) => AEROSPACE_FIGHTER_CRITICAL_BLOCK.find((entry) => entry.name === name)!.boxes;
        const track = (name: string, boxes: string[], filled: number): ICriticalTrack => ({ name, boxes, filled: play ? filled : 0 });
        return criticalDamageBox(LEFT.x, BOTTOM, LEFT.w, 360, [
            [
                track("Avionics", fighterBoxes("Avionics"), play?.avionics ?? 0),
                track("FCS", fighterBoxes("FCS"), play?.fcs ?? 0),
                track("Sensors", fighterBoxes("Sensors"), play?.sensors ?? 0),
                track("Gear", fighterBoxes("Gear"), play?.gear ? 1 : 0),
            ],
            [
                track("Engine", ENGINE_BOXES, play?.engine ?? 0),
                track("Left Thruster", THRUSTER_BOXES, play?.leftThruster ?? 0),
                track("Right Thruster", THRUSTER_BOXES, play?.rightThruster ?? 0),
                track("Life Support", fighterBoxes("Life Support"), play?.lifeSupport ? 1 : 0),
            ],
        ]);
    }

    renderCrewData(): JSX.Element {
        const pilot = this.craft.getPilot();
        const show = this.props.showPilot;
        return pilotDataBox(MIDDLE_X, BOTTOM, 470, 360, {
            name: show ? pilot.name : undefined,
            gunnery: show ? pilot.gunnery : undefined,
            piloting: show ? pilot.piloting : undefined,
            hits: this.play?.crewHits ?? 0,
        }, "CREW DATA");
    }

    renderHeatData(): JSX.Element {
        const craft = this.craft;
        return heatDataBox(RIGHT_X, BOTTOM, 510, 810, {
            count: craft.getTotalHeatSinks(),
            dissipation: craft.getHeatDissipation(),
            lost: 0,
            double: craft.getHeatSinkType().tag !== "single",
        });
    }

    render = (): JSX.Element => (
        <svg
            version="1.1"
            viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`}
            xmlns="http://www.w3.org/2000/svg"
            data-testid="small-craft-record-sheet-svg"
        >
            <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
            {titleBanner(LEFT.x, 1395, `${this.shape} ${this.craft.getCraftTypeName()} RECORD SHEET`.toUpperCase())}
            {this.renderCraftData()}
            {this.renderArmorData()}
            {this.renderCrewAndCargo()}
            {this.renderArmorDiagram()}
            {this.renderNotes()}
            {this.renderCriticalDamage()}
            {this.renderCrewData()}
            {velocityRecordBox(LEFT.x, 2070, RIGHT_X - 20 - LEFT.x, 430)}
            {this.renderHeatData()}
            {heatScaleColumn(1855, 1270, this.play?.heat ?? -1)}
            {sheetFooter("Tables: Total Warfare pp. 161, 239-240.")}
        </svg>
    );
}

interface ISmallCraftRecordSheetSVGProps {
    craft: SmallCraft;
    showPilot?: boolean;
    showDamage?: boolean;
}
