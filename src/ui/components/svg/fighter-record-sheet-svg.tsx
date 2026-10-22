import React, { type JSX } from 'react';
import AerospaceFighter, { FighterLocation } from '../../../classes/aerospace-fighter';
import { AEROSPACE_FIGHTER_CRITICAL_BLOCK, FIGHTER_RETURN_TABLE, GROUND_MAP_STRAIGHT_MOVEMENT } from '../../../data/aerospace-record-sheet';
import { SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS, SUPPORT_VEHICLE_FIRE_CONTROL } from '../../../data/support-vehicle-construction';
import { aerospaceInventoryRows } from '../aerospace-sheet-blocks';
import { getUnitQuirkSheetLines, weaponQuirkSuffix } from '../quirk-sheet-block';
import { getRulesLevelName } from '../rules-level-print';
import {
    armorDataBox, criticalDamageBox, heatDataBox, heatScaleColumn, notesBox, pilotDataBox, unitDataBox, velocityRecordBox,
} from './aerospace-record-sheet-svg-blocks';
import FighterDiagramSVG from './fighter-diagram-svg';
import { DOC_HEIGHT, DOC_WIDTH, GRAY, INK, SHADE, checkbox, groupBox, rollTable, sheetFooter, text, titleBanner } from './record-sheet-svg-kit';

// A full-page fighter record sheet, laid out like the Total Warfare Aerospace and Conventional Fighter record sheets:
// fighter data with the weapons inventory, external stores, notes and the armor diagram on top; critical damage,
// pilot data and the velocity record below, with the heat data and heat scale (aerospace fighters) or the ground map
// straight movement and fighter return tables (conventional fighters) on the right. Fixed-wing support vehicles use
// the conventional layout. Our own title block and craft silhouette; no official art or logo.

const LEFT = { x: 25, w: 790 };
const MIDDLE_X = 835;
const RIGHT_X = 1325;
const TOP = 140;
const BOTTOM = 1690;

// Location codes, keyed under the inventory.
const LOCATION_CODES: Record<FighterLocation, string> = { nose: "N", leftWing: "LW", rightWing: "RW", aft: "A", fuselage: "FU" };

/**
 * The code written in an external stores box. The four the official sheet's key gives (HE, LG, C, RL) come from the
 * names' initials; a store with an acronym in its name uses that (TAG, LAA, FASCAM); a size is added after a dash.
 */
export const externalStoreCode = (name: string): string => {
    const base = name.replace(/^Bomb - /, "").replace(/\((C|Standard|Air-Launched)\)/g, "").trim();
    const acronym = /\(([A-Z]{2,})\)/.exec(base)?.[1];
    if (acronym) return acronym;
    const size = /\((Large|Small)\)/.exec(base)?.[1];
    const words = base.replace(/\(.*?\)/g, "").split(/[\s-]+/).filter((word) => word && !["Pod", "Missile"].includes(word));
    const code = words.map((word) => (/^[A-Z]{2,}$/.test(word) ? word : word[0].toUpperCase())).join("");
    return size ? `${code}-${size[0]}` : code;
};

export default class FighterRecordSheetSVG extends React.Component<IFighterRecordSheetSVGProps> {
    get fighter(): AerospaceFighter { return this.props.fighter; }

    get play() { return this.props.showDamage ? this.fighter.getInPlay() : null; }

    get title(): string { return `${this.fighter.getFighterTypeName().toUpperCase()} RECORD SHEET`; }

    get quirkLines() {
        const fighter = this.fighter;
        return getUnitQuirkSheetLines(fighter.quirks, fighter.getEquipmentList().map((item) => ({ uuid: item.uuid, label: item.name })), fighter.getQuirkTargets().locations);
    }

    renderFighterData(): JSX.Element {
        const fighter = this.fighter;
        const play = this.play;
        const quirkLines = this.quirkLines;
        const name = `${fighter.getName()} ${fighter.getModel()}`.trim();
        const engine = fighter.isSupportVehicle() ? fighter.getSupportEngine()?.name ?? "" : fighter.getEngineType().name;
        const label = (lx: number, ly: number, value: string) => text(lx, ly, value, { size: 22, weight: 700 });
        return unitDataBox(LEFT.x, TOP, LEFT.w, 1090, {
            title: "FIGHTER DATA",
            type: (fighter.isOmni() ? "Omni: " : "") + (name || fighter.getFighterTypeName()),
            left: [
                { label: "Thrust:" },
                { label: "Safe Thrust:", value: fighter.getSafeThrust(), indent: true },
                { label: "Maximum Thrust:", value: fighter.getMaxThrust(), indent: true },
                { label: "Engine:", value: `${engine} ${fighter.getEngineRating()}`, indent: true, valueAt: 140 },
            ],
            right: [
                { label: "Tonnage:", value: fighter.getTonnage() },
                { label: "Tech Base:", value: fighter.getTech().name },
                { label: "Rules Level:", value: getRulesLevelName(fighter.getRequiredRulesLevel()) },
                { label: "Fuel:", value: `${fighter.getFuelPoints()} points` },
            ],
            extra: fighter.tracksHeat() ? undefined : (ey) => (
                <g>
                    {label(LEFT.x + 40, ey + 5, "VSTOL")}{checkbox(LEFT.x + 130, ey + 3)}
                    {fighter.hasVSTOL() ? text(LEFT.x + 142, ey + 2, "X", { size: 22, weight: 700, anchor: "middle" }) : null}
                    {label(LEFT.x + 200, ey + 5, "STOL")}{checkbox(LEFT.x + 270, ey + 3)}
                </g>
            ),
            rows: aerospaceInventoryRows(
                fighter.getEquipmentList(),
                (tag) => LOCATION_CODES[tag as FighterLocation] ?? tag,
                (item) => (fighter.isPodMounted(item.uuid ?? "") ? " (pod)" : "") + (play && fighter.isWeaponDestroyed(item.uuid ?? "") ? " (destroyed)" : "") + weaponQuirkSuffix(quirkLines, item.uuid),
            ),
            locationKey: "Loc.: N Nose, LW Left Wing, RW Right Wing, A Aft, FU Fuselage",
            cost: fighter.getCBillCost(),
            bv: this.props.showPilot ? `${fighter.getBattleValue()} (${fighter.getPilotAdjustedBattleValue()} adj.)` : fighter.getBattleValue(),
        });
    }

    /** The notes printed on the sheet; crewOnSheet leaves out the crew and BAR a sheet with its own crew data prints. */
    noteLines(crewOnSheet = false): string[] {
        const fighter = this.fighter;
        const play = this.play;
        const notes: string[] = [];
        const quirkLines = this.quirkLines;
        if (quirkLines.unit.length) notes.push(`Quirks: ${quirkLines.unit.join(", ")}`);
        const ammo = fighter.getEquipmentList().filter((item) => item.isAmmo).map((item) => item.name);
        if (ammo.length) notes.push(`Ammo: ${ammo.join(", ")}`);
        if (fighter.getExternalStores().length) {
            notes.push(`External stores: ${fighter.getExternalStores().map((store) => `${store.count} x ${store.name.replace(/^Bomb - /, "")}`).join(", ")}; Thrust ${fighter.getLoadedSafeThrust()}/${fighter.getLoadedMaxThrust()} while loaded`);
        }
        if (fighter.isSupportVehicle()) {
            const fireControl = SUPPORT_VEHICLE_FIRE_CONTROL[fighter.getSupportFireControl()].name;
            const rating = `Tech Rating ${fighter.getSupportOverallTechRating()?.toUpperCase()}`;
            notes.push(crewOnSheet ? rating : `${rating}; Crew ${fighter.getCrew()}; BAR ${fighter.getBAR()}`);
            notes.push(`${fireControl.includes("Fire Control") ? fireControl : `Fire Control: ${fireControl}`}${fighter.getFireControlToHitModifier() > 0 ? ` (+${fighter.getFireControlToHitModifier()} to-hit)` : ""}`);
            const mods = fighter.getSupportChassisModifications().map((tag) => SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS.find((mod) => mod.tag === tag)?.name).filter(Boolean);
            if (mods.length) notes.push(`Chassis: ${mods.join(", ")}`);
        }
        if (fighter.getBays().length) notes.push(`Bays: ${fighter.getBays().map((bay) => `${fighter.getBayName(bay)} ${bay.amount}`).join(", ")}`);
        if (play && play.heatSinks > 0) notes.push(`Heat sinks lost: ${play.heatSinks}`);
        return notes;
    }

    renderNotes(): JSX.Element {
        return notesBox(LEFT.x, 1250, LEFT.w, 420, this.noteLines());
    }

    // Bombs and pods: a box a hardpoint, the boxes past the fighter's hardpoints shaded, with the codes keyed below.
    renderExternalStores(): JSX.Element {
        const fighter = this.fighter;
        const x = 1440, y = TOP, w = 535, h = 460;
        const hardpoints = Math.min(20, fighter.getExternalStoresHardpoints());
        const codes: string[] = [];
        const key = new Map<string, string>([["HE", "High-Explosive"], ["LG", "Laser-Guided"], ["C", "Cluster"], ["RL", "Rocket Launcher"]]);
        for (const store of fighter.getExternalStores()) {
            const code = externalStoreCode(store.name);
            if (!key.has(code)) key.set(code, store.name.replace(/^Bomb - /, ""));
            for (let i = 0; i < store.hardpoints; i++) codes.push(code);
        }
        const boxW = 88, boxH = 66, gap = 10;
        const left = x + (w - (5 * boxW + 4 * gap)) / 2;
        const keyLines = [...key.entries()].map(([code, name]) => `${code} - ${name}`);
        return groupBox(x, y, w, h, "EXTERNAL STORES/BOMBS", (
            <>
                {Array.from({ length: 20 }, (_, i) => {
                    const bx = left + (i % 5) * (boxW + gap), by = y + 60 + Math.floor(i / 5) * (boxH + gap);
                    return (
                        <g key={i}>
                            <rect data-testid="store-box" data-hardpoint={i < hardpoints ? "true" : "false"} x={bx} y={by} width={boxW} height={boxH} rx={10}
                                fill={i < hardpoints ? "white" : SHADE} stroke={INK} strokeWidth={2} />
                            {codes[i] ? text(bx + boxW / 2, by + 44, codes[i], { size: codes[i].length > 3 ? 18 : 26, weight: 700, anchor: "middle" }) : null}
                        </g>
                    );
                })}
                {text(x + 20, y + 385, "Key:", { size: 18, weight: 700 })}
                {keyLines.slice(0, 6).map((line, i) => text(x + 75 + (i % 2) * 230, y + 385 + Math.floor(i / 2) * 24, line, { size: 16 }, line))}
            </>
        ));
    }

    renderArmorData(): JSX.Element {
        const fighter = this.fighter;
        const armor = fighter.getArmorAllocation();
        const thresholds = fighter.getDamageThresholds();
        const arcs: { tag: keyof typeof armor; name: string }[] = [
            { tag: "nose", name: "Nose" }, { tag: "leftWing", name: "Left Wing" }, { tag: "rightWing", name: "Right Wing" }, { tag: "aft", name: "Aft" },
        ];
        const lines: [string, React.ReactNode][] = [["Structural Integrity:", fighter.getStructuralIntegrity()], ["Armor:", fighter.getArmorDescription()]];
        if (!fighter.tracksHeat()) lines.push(["BAR:", fighter.getBAR()]);
        return armorDataBox(MIDDLE_X, TOP, 590, 460, arcs.map((arc) => ({ name: arc.name, threshold: thresholds[arc.tag], armor: armor[arc.tag] })), lines);
    }

    renderArmorDiagram(): JSX.Element {
        const fighter = this.fighter;
        const play = this.play;
        const y = 620, h = 1050;
        const w = (fighter.tracksHeat() ? 1835 : 1975) - MIDDLE_X;
        const diagramW = w - 40;
        const diagramH = Math.round(diagramW / 600 * 470);
        return groupBox(MIDDLE_X, y, w, h, "ARMOR DIAGRAM", (
            <FighterDiagramSVG
                x={MIDDLE_X + 20}
                y={y + 50 + (h - 50 - diagramH) / 2}
                width={diagramW}
                silhouette
                maxPipSpacing={24}
                armor={fighter.getArmorAllocation()}
                structuralIntegrity={fighter.getStructuralIntegrity()}
                thresholds={fighter.getDamageThresholds()}
                armorDamage={play?.armorDamage}
                structureDamage={play?.structureDamage}
            />
        ));
    }

    renderCriticalDamage(): JSX.Element {
        const play = this.play;
        const filled = (name: string): number => {
            if (!play) return 0;
            switch (name) {
                case "Avionics": return play.avionics;
                case "Engine": return play.engine;
                case "FCS": return play.fcs;
                case "Sensors": return play.sensors;
                case "Gear": return play.gear ? 1 : 0;
                default: return 0;
            }
        };
        const track = (name: string) => ({ name, boxes: AEROSPACE_FIGHTER_CRITICAL_BLOCK.find((entry) => entry.name === name)!.boxes, filled: filled(name) });
        // As on the official sheet: Avionics, FCS and Sensors on the left; Engine, Gear and Life Support on the right.
        return criticalDamageBox(LEFT.x, BOTTOM, LEFT.w, 360, [["Avionics", "FCS", "Sensors"].map(track), ["Engine", "Gear", "Life Support"].map(track)]);
    }

    renderPilotData(): JSX.Element {
        const pilot = this.fighter.getPilot();
        const show = this.props.showPilot;
        return pilotDataBox(MIDDLE_X, BOTTOM, 470, 360, {
            name: show ? pilot.name : undefined,
            gunnery: show ? pilot.gunnery : undefined,
            piloting: show ? pilot.piloting : undefined,
            hits: this.play?.pilotHits ?? 0,
        });
    }

    renderHeatData(): JSX.Element {
        const fighter = this.fighter;
        return heatDataBox(RIGHT_X, BOTTOM, 510, 810, {
            count: fighter.getTotalHeatSinks(),
            dissipation: fighter.getHeatDissipation(),
            lost: this.play?.heatSinks ?? 0,
            double: fighter.getHeatSinkType().tag !== "single",
        });
    }

    renderGroundMapMovement(): JSX.Element {
        const x = RIGHT_X, y = BOTTOM, w = 650, h = 525;
        const table = {
            columns: ["Fighter", "Small Craft"],
            rows: GROUND_MAP_STRAIGHT_MOVEMENT.map((row) => ({ roll: `${row.velocity}`, cells: [`${row.fighter}`, `${row.smallCraft}`] })),
        };
        return groupBox(x, y, w, h, "GROUND MAP STRAIGHT MOVEMENT", (
            <>
                {text(x + w / 2, y + 68, "Minimum Straight Movement (in hexes)", { size: 20, weight: 700, anchor: "middle" })}
                {rollTable(table, x, y + 70, w, "", 29, 160, "VELOCITY")}
                {text(x + 20, y + 490, "Velocity above 12 is not possible on ground maps.", { size: 17 })}
                {text(x + 20, y + 515, "Fixed-wing support vehicles: double the Fighter column (TW p. 84).", { size: 17 })}
            </>
        ));
    }

    renderFighterReturn(): JSX.Element {
        const x = RIGHT_X, y = 2230, w = 650, h = 270;
        const table = { columns: ["Turns Before Return"], rows: FIGHTER_RETURN_TABLE.map((row) => ({ roll: row.safeThrust, cells: [`${row.turns}`] })) };
        return groupBox(x, y, w, h, "FIGHTER RETURN TABLE", (
            <>
                {rollTable(table, x, y + 55, w, "", 34, 250, "SAFE THRUST")}
                {text(x + 20, y + 255, "As printed on the Total Warfare conventional fighter record sheet.", { size: 16, fill: GRAY })}
            </>
        ));
    }

    render = (): JSX.Element => (
        <svg
            version="1.1"
            viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`}
            xmlns="http://www.w3.org/2000/svg"
            data-testid="fighter-record-sheet-svg"
        >
            <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
            {titleBanner(LEFT.x, 1395, this.title)}
            {this.renderFighterData()}
            {this.renderExternalStores()}
            {this.renderArmorData()}
            {this.renderArmorDiagram()}
            {this.renderNotes()}
            {this.renderCriticalDamage()}
            {this.renderPilotData()}
            {velocityRecordBox(LEFT.x, 2070, RIGHT_X - 20 - LEFT.x, 430)}
            {this.fighter.tracksHeat() ? <>{this.renderHeatData()}{heatScaleColumn(1855, 1270, this.play?.heat ?? -1)}</> : <>{this.renderGroundMapMovement()}{this.renderFighterReturn()}</>}
            {sheetFooter("Tables: Total Warfare pp. 92, 161.")}
        </svg>
    );
}

interface IFighterRecordSheetSVGProps {
    fighter: AerospaceFighter;
    showPilot?: boolean;
    showDamage?: boolean;
}
