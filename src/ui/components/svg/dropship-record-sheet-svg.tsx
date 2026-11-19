import React, { type JSX } from 'react';
import { getUnitRulesets } from '../../../classes/unit-game-settings';
import SmallCraft from '../../../classes/small-craft';
import { AEROSPACE_FIGHTER_CRITICAL_BLOCK } from '../../../data/aerospace-record-sheet';
import { SMALL_CRAFT_ARCS, SmallCraftArc } from '../../../data/small-craft-construction';
import { FW_DROPSHIP_SOURCES, getHousemanIntegrity } from '../../../data/future-wars-dropships';
import { weaponBayName } from '../../../data/weapon-bays';
import { aerospaceInventoryRows, aerospaceSheetBattleValue, IAerospaceInventoryRow } from '../aerospace-sheet-blocks';
import { bayQuirkSuffix, getUnitQuirkSheetLines, weaponQuirkSuffix } from '../quirk-sheet-block';
import { getRulesLevelName } from '../rules-level-print';
import { ICriticalTrack, criticalDamageBox, heatPerArcBox, largeCraftCrewBox, notesBox, unitDataBox, velocityRecordBox } from './aerospace-record-sheet-svg-blocks';
import FighterDiagramSVG from './fighter-diagram-svg';
import { DOC_HEIGHT, DOC_WIDTH, groupBox, sheetFooter, text, titleBanner } from './record-sheet-svg-kit';

// A full-page DropShip record sheet, laid out like the Total Warfare Aerodyne and Spheroid DropShip record sheets:
// DropShip data with the weapon bays down the left and the armor diagram filling the right; notes, crew data and the
// velocity record below, with critical damage and the heat data (heat generated per arc, no heat scale) on the right.
// Our own title block and silhouettes; no official art; the BattleTech logo is in the shared footer.

const LEFT = { x: 25, w: 790 };
const MIDDLE_X = 835;
const RIGHT_X = 1325;
const RIGHT_W = 1975 - RIGHT_X;
const TOP = 140;
const LOWER = 1660;
// Clear of the footer.
const BOTTOM = 2480;

const ARC_CODES: Record<"aerodyne" | "spheroid", Record<SmallCraftArc | "hull", string>> = {
    aerodyne: { nose: "N", left: "LW", right: "RW", leftAft: "LW(R)", rightAft: "RW(R)", aft: "A", hull: "H" },
    spheroid: { nose: "N", left: "FL", right: "FR", leftAft: "AL", rightAft: "AR", aft: "A", hull: "H" },
};

// The engine loses 1 Safe Thrust a hit and the sixth destroys it; a thruster hit adds 1 to the cost of turning away
// from that side and the fourth disables it (TW pp. 239-240). The K-F boom and docking collar are destroyed outright.
const ENGINE_BOXES = ["-1", "-2", "-3", "-4", "-5", "D"];
const THRUSTER_BOXES = ["+1", "+2", "+3", "D"];

// The crew's hits: +1 to hit each, the sixth incapacitates the crew (TW p.240).
const CREW_MODIFIERS = ["+1", "+2", "+3", "+4", "+5", "Incp."];

export { weaponBayName };

/**
 * A Small Craft's or DropShip's inventory: its weapon bays, as both always fire full bays (TM pp.195, 199; user ruling
 * 2026-10-22), then the rest of its equipment. In play a bay notes its destroyed weapons.
 */
export const craftInventoryRows = (craft: SmallCraft, codes: Record<SmallCraftArc | "hull", string>, play: boolean, quirkLines: ReturnType<typeof getUnitQuirkSheetLines>): IAerospaceInventoryRow[] => {
    const allBays = SMALL_CRAFT_ARCS.flatMap((arc) => craft.getArcWeaponBays(arc).map((bay) => bay.uuids));
    const bays = SMALL_CRAFT_ARCS.flatMap((arc) => craft.getArcWeaponBays(arc).map((bay): IAerospaceInventoryRow => {
        const destroyed = play ? bay.uuids.filter((uuid) => craft.isWeaponDestroyed(uuid)).length : 0;
        return {
            quantity: 1, name: weaponBayName(bay) + bayQuirkSuffix(quirkLines, bay.uuids, allBays) + (destroyed ? ` (${destroyed} destroyed)` : ""), location: codes[arc], heat: bay.heat, values: bay.values, capital: bay.capital,
        };
    }));
    const inBays = new Set(allBays.flat());
    const equipment = aerospaceInventoryRows(
        craft.getEquipmentList().filter((item) => !inBays.has(item.uuid ?? "")),
        (tag) => codes[tag as SmallCraftArc | "hull"] ?? tag,
        (item) => (play && craft.isWeaponDestroyed(item.uuid ?? "") ? " (destroyed)" : "") + weaponQuirkSuffix(quirkLines, item.uuid),
    ).map((row) => (row.quantity > 1 ? { ...row, name: `${row.quantity} ${row.name}` } : row));
    return [...bays, ...equipment];
};

export default class DropShipRecordSheetSVG extends React.Component<IDropShipRecordSheetSVGProps> {
    get craft(): SmallCraft { return this.props.craft; }

    get play() { return this.props.showDamage ? this.craft.getInPlay() : null; }

    get shape(): "aerodyne" | "spheroid" { return this.craft.isAerodyne() ? "aerodyne" : "spheroid"; }

    get quirkLines() {
        const craft = this.craft;
        return getUnitQuirkSheetLines(craft.quirks, craft.getEquipmentList().map((item) => ({ uuid: item.uuid, label: item.name })), craft.getQuirkTargets().locations,
            craft.getCapitalWeapons().map((mount) => mount.uuid));
    }

    // Fighters and Small Craft carried, and the launch rate of each: two a turn per working door (TM p.196).
    get carried(): { fighters: number; smallCraft: number; fighterDoors: number; smallCraftDoors: number } {
        const bays = this.craft.getBays();
        const sum = (tag: string, field: "amount" | "doors") => bays.filter((bay) => bay.tag === tag).reduce((total, bay) => total + bay[field], 0);
        return { fighters: sum("fighter", "amount"), smallCraft: sum("small-craft", "amount"), fighterDoors: sum("fighter", "doors"), smallCraftDoors: sum("small-craft", "doors") };
    }

    get inventoryRows(): IAerospaceInventoryRow[] {
        return craftInventoryRows(this.craft, ARC_CODES[this.shape], !!this.play, this.quirkLines);
    }

    renderDropShipData(): JSX.Element {
        const craft = this.craft;
        const codes = ARC_CODES[this.shape];
        const carried = this.carried;
        const name = `${craft.getName()} ${craft.getModel()}`.trim();
        const key = [...SMALL_CRAFT_ARCS.map((arc) => `${codes[arc]} ${craft.getArcName(arc)}`), "H Hull"].join(", ");
        const ammo = craft.getAmmoSheetLines();
        return unitDataBox(LEFT.x, TOP, LEFT.w, LOWER - 20 - TOP, {
            title: "DROPSHIP DATA",
            type: name || `${craft.getShapeName()} DropShip`,
            left: [
                { label: "Thrust:" },
                { label: "Safe Thrust:", value: craft.getSafeThrust(), indent: true },
                { label: "Maximum Thrust:", value: craft.getMaxThrust(), indent: true },
                { label: "Fuel:", value: `${craft.getFuelPoints()} points (${craft.getFuelTons()} tons)`, indent: true, valueAt: 140 },
                { label: "Fighters/Small Craft:", value: `${carried.fighters}/${carried.smallCraft}`, valueAt: 270 },
            ],
            right: [
                { label: "Tonnage:", value: craft.getTonnage() },
                { label: "Tech Base:", value: craft.getTech().name },
                { label: "Rules Level:", value: getRulesLevelName(craft.getRequiredRulesLevel()) },
                { label: "Burn Days:", value: `${craft.getBurnDays()} at 1 G` },
                { label: "Launch Rate:", value: `${carried.fighterDoors * 2}/${carried.smallCraftDoors * 2}` },
            ],
            rows: this.inventoryRows,
            bays: true,
            locationTitle: "Loc",
            locationKey: `Arc: ${key}. (C): capital weapons, capital-scale values.`,
            ammo: ammo.join(", ") || "none",
            cost: craft.getCBillCost(),
            bv: aerospaceSheetBattleValue(craft, "small-craft", this.props.showPilot),
        });
    }

    renderArmorDiagram(): JSX.Element {
        const craft = this.craft;
        const play = this.play;
        const armor = craft.getArmorAllocation();
        const thresholds = craft.getDamageThresholds();
        const y = TOP, h = LOWER - 20 - TOP, w = 1975 - MIDDLE_X;
        const diagramH = Math.min(h - 140, Math.round((w - 40) / 600 * 760));
        const diagramW = Math.round(diagramH / 760 * 600);
        return groupBox(MIDDLE_X, y, w, h, "ARMOR DIAGRAM", (
            <>
                {text(MIDDLE_X + 20, y + 80, `Structural Integrity: ${craft.getStructuralIntegrity()}`, { size: 24, weight: 700 })}
                {text(MIDDLE_X + w - 20, y + 80, `Armor: ${craft.getArmorType().name}`, { size: 22, anchor: "end" })}
                {text(MIDDLE_X + 20, y + 110, "Damage Threshold (Total Armor) at each arc; standard scale.", { size: 18 })}
                <FighterDiagramSVG
                    x={MIDDLE_X + (w - diagramW) / 2}
                    y={y + 120 + (h - 120 - diagramH) / 2}
                    tall
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
            </>
        ));
    }

    renderNotes(): JSX.Element {
        const craft = this.craft;
        const notes: string[] = [];
        const quirkLines = this.quirkLines;
        if (quirkLines.unit.length) notes.push(`Quirks: ${quirkLines.unit.join(", ")}`);
        craft.getBays().forEach((bay, index) => notes.push(`Bay ${index + 1}: ${craft.getBayName(bay)} (${bay.amount}) ${bay.doors} Door${bay.doors === 1 ? "" : "s"}`));
        // Future Wars DropShip construction (#172): the method, its fire factors, Houseman's integrity row.
        const method = craft.getFwDropShipMethod();
        if (method) {
            notes.push(`Construction: ${FW_DROPSHIP_SOURCES[method]}`);
            const factors = SMALL_CRAFT_ARCS.map((arc) => [arc, craft.getArcFireFactors(arc)] as const)
                .filter(([, value]) => !!value && value.factors > 0)
                .map(([arc, value]) => `${craft.getArcName(arc)} ${value!.factors}${value!.bonus > 0 ? ` (+${value!.bonus} to hit)` : ""}`);
            if (factors.length > 0) notes.push(`Fire Factors: ${factors.join(", ")}`);
            if (method === "houseman") {
                const row = getHousemanIntegrity(craft.getStructuralIntegrity());
                notes.push(`Integrity ${row.integrity}: internal structure ${row.internalStructure}, armor at most ${row.maxArmor} a facing, ${row.acceleration} G${row.extended ? " (NGCFells's extension)" : ""}`);
            }
        }
        const play = this.play;
        if (play && play.doorsDamaged > 0) notes.push(`Doors damaged: ${play.doorsDamaged}`);
        if (play && play.cargoLostPercent > 0) notes.push(`Cargo lost: ${play.cargoLostPercent}%`);
        notes.push("Weapons fire by bay. Standard-scale damage to capital armor is a tenth, rounded (TW pp. 234, 238).");
        return notesBox(LEFT.x, LOWER, LEFT.w, 380, notes);
    }

    renderCrewData(): JSX.Element {
        const craft = this.craft;
        const pilot = craft.getPilot();
        const show = this.props.showPilot;
        return largeCraftCrewBox(MIDDLE_X, LOWER, 470, 380, {
            gunnery: show ? pilot.gunnery : undefined,
            piloting: show ? pilot.piloting : undefined,
            hits: this.play?.crewHits ?? 0,
            modifiers: CREW_MODIFIERS,
            people: [
                ["Crew:", craft.getCrew()], ["Marines:", undefined],
                ["Passengers:", craft.getPassengers()], ["Elementals:", undefined],
                ["Other:", undefined], ["Battle Armor:", undefined],
            ],
            lifeBoats: craft.getLifeBoats(),
            escapePods: craft.getEscapePods(),
        });
    }

    renderCriticalDamage(): JSX.Element {
        const play = this.play;
        const fighterBoxes = (name: string) => AEROSPACE_FIGHTER_CRITICAL_BLOCK.find((entry) => entry.name === name)!.boxes;
        const track = (name: string, boxes: string[], filled: number): ICriticalTrack => ({ name, boxes, filled: play ? filled : 0 });
        return criticalDamageBox(RIGHT_X, LOWER, RIGHT_W, 560, [
            [
                track("Avionics", fighterBoxes("Avionics"), play?.avionics ?? 0),
                track("FCS", fighterBoxes("FCS"), play?.fcs ?? 0),
                track("Sensors", fighterBoxes("Sensors"), play?.sensors ?? 0),
                track("Left Thruster", THRUSTER_BOXES, play?.leftThruster ?? 0),
                track("Right Thruster", THRUSTER_BOXES, play?.rightThruster ?? 0),
                track("Engine", ENGINE_BOXES, play?.engine ?? 0),
            ],
            [
                track("Gear", fighterBoxes("Gear"), play?.gear ? 1 : 0),
                track("Life Support", fighterBoxes("Life Support"), play?.lifeSupport ? 1 : 0),
                track("K-F Boom", ["D"], play?.kfBoom ? 1 : 0),
                track("Docking Collar", ["D"], play?.dockingCollar === "destroyed" ? 1 : 0),
            ],
        ], [30, 420]);
    }

    // Heat sinks and the heat each arc makes firing everything in it, against the sinks' dissipation (TM p.199).
    renderHeatData(): JSX.Element {
        const craft = this.craft;
        return heatPerArcBox(RIGHT_X, 2240, RIGHT_W, BOTTOM - 2240, {
            count: craft.getTotalHeatSinks(),
            dissipation: craft.getHeatDissipation(),
            double: craft.getHeatSinkType().tag !== "single",
            arcs: SMALL_CRAFT_ARCS.map((arc) => [craft.getArcName(arc), craft.getArcHeat(arc)]),
        });
    }

    render = (): JSX.Element => (
        <svg
            version="1.1"
            viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`}
            xmlns="http://www.w3.org/2000/svg"
            data-testid="dropship-record-sheet-svg"
        >
            <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
            {titleBanner(LEFT.x, 1395, `${this.shape} DROPSHIP RECORD SHEET`.toUpperCase())}
            {this.renderDropShipData()}
            {this.renderArmorDiagram()}
            {this.renderNotes()}
            {this.renderCrewData()}
            {this.renderCriticalDamage()}
            {velocityRecordBox(LEFT.x, 2060, RIGHT_X - 20 - LEFT.x, BOTTOM - 2060)}
            {this.renderHeatData()}
            {sheetFooter("Tables: TW pp. 234, 238-240; TM p. 199.", getUnitRulesets(this.craft))}
        </svg>
    );
}

interface IDropShipRecordSheetSVGProps {
    craft: SmallCraft;
    showPilot?: boolean;
    showDamage?: boolean;
}
