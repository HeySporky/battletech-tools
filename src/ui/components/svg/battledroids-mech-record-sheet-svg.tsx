import React, { type JSX } from 'react';
import { getUnitRulesets } from '../../../classes/unit-game-settings';
import { BattleMech, ICriticalSlot } from '../../../classes/battlemech';
import { DOC_HEIGHT, DOC_WIDTH, INK, SHADE, groupBox, sheetFooter, text } from './record-sheet-svg-kit';

// The droid record sheet bound into Battledroids (FASA 1984, the photocopiable sheets after p.18): armor and internal
// structure drawn as boxes in the droid's shape, its data and DroidWarrior, heat sinks, ammunition, the Critical Hit
// Chart by location and the Heat Scale. The book's layout, our own drawing; no FASA logo; ours is in the shared footer.

const BOX = 22;
const STEP = 26;
const RIGHT = { x: 1415, w: 560 };
const LEFT_W = 1370;

// The Heat Scale as the sheet prints it, from 30 down.
export const HEAT_SCALE: Record<number, string> = {
    30: "Shut down", 28: "Ammo explosion; avoid on 8+", 26: "Shut down; avoid on 10+", 25: "-5 Move", 24: "-4 Fire",
    23: "Ammo explosion; avoid on 6+", 22: "Shutdown; avoid on 8+", 20: "-4 Move", 19: "Ammo explosion; avoid on 4+",
    18: "Shutdown; avoid on 6+", 17: "-3 Fire", 15: "-3 Move", 14: "Shutdown; avoid on 4+", 13: "-2 Fire", 10: "-2 Move",
    8: "-1 Firing", 5: "-1 Move",
};

type Location = "head" | "centerTorso" | "leftTorso" | "rightTorso" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

/** The ammunition block's lines: rounds for auto cannon and machine guns, racks of missiles by their size. */
export function getBattledroidsAmmo(mech: BattleMech): { autoCannon: number; machineGun: number; srm: string; lrm: string } {
    const totals = { autoCannon: 0, machineGun: 0, srm: new Map<number, number>(), lrm: new Map<number, number>() };
    for (const bin of mech.getInstalledEquipment().filter((item) => item.isAmmo)) {
        const tag = mech.getAmmoBinWeapon(bin)?.tag ?? "";
        const shots = mech.getAmmoBinCapacity(bin);
        const missiles = /^(srm|lrm)-(\d+)/.exec(tag);
        if (missiles) {
            const racks = totals[missiles[1] as "srm" | "lrm"];
            racks.set(+missiles[2], (racks.get(+missiles[2]) ?? 0) + shots);
        } else if (tag.includes("machine-gun")) {
            totals.machineGun += shots;
        } else {
            totals.autoCannon += shots;
        }
    }
    const packs = (racks: Map<number, number>) => [...racks].map(([size, count]) => `${size} per pack, ${count} packs`).join("; ");
    return { autoCannon: totals.autoCannon, machineGun: totals.machineGun, srm: packs(totals.srm), lrm: packs(totals.lrm) };
}

/**
 * A slot's line on the Critical Hit Chart: the item's name, repeated for each slot it fills, the engine and gyro by the
 * book's plain names; blank for an empty slot.
 */
const slotNames = (slots: (ICriticalSlot | null)[]): string[] => {
    let last = "";
    return slots.map((slot) => {
        if (!slot) return "";
        if (slot.name !== "placeholder") last = /Gyro/.test(slot.name) ? "Gyro" : /Engine|Fusion/.test(slot.name) ? "Engine" : slot.name.replace("(rear)", "(R)");
        return last;
    });
};

export default class BattledroidsMechRecordSheetSVG extends React.Component<IBattledroidsMechRecordSheetSVGProps> {
    /** A location's boxes, `columns` wide, with its name over them. */
    renderGrid(location: string, points: number, x: number, y: number, columns: number, label: string, box = BOX, step = STEP): JSX.Element {
        const w = columns * step - (step - box);
        return (
            <g key={location} data-testid={`droid-boxes-${location}`} data-points={points}>
                {text(x + w / 2, y - 10, label, { size: Math.min(22, Math.round(step * 0.68)), weight: 700, anchor: "middle" })}
                {Array.from({ length: points }, (_unused, i) => (
                    <rect key={i} x={x + (i % columns) * step} y={y + Math.floor(i / columns) * step} width={box} height={box} fill="white" stroke={INK} strokeWidth={2} />
                ))}
            </g>
        );
    }

    renderArmorDiagram(x: number, y: number, w: number, h: number): JSX.Element {
        const armor = this.props.mechData.getArmorAllocation();
        const cx = x + w / 2;
        const rows = (points: number, columns: number) => Math.ceil(points / columns);
        // The boxes as big as the diagram allows; a heavy droid's run a column wider each so they fill it, not run off it.
        const layout = (arm: number, side: number, center: number, leg: number, most: number) => {
            const torsoRows = Math.max(rows(armor.centerTorso, center), rows(armor.leftTorso, side), rows(armor.rightTorso, side), rows(armor.leftArm, arm) + 1);
            const legRows = Math.max(rows(armor.leftLeg, leg), rows(armor.rightLeg, leg));
            const rearRows = Math.max(rows(armor.centerTorsoRear, 6), rows(armor.leftTorsoRear, 6), rows(armor.rightTorsoRear, 6), 1);
            const step = Math.min(most, Math.floor((h - 400) / (rows(armor.head, 3) + torsoRows + legRows + rearRows)));
            return { arm, side, center, leg, step, torsoRows, legRows };
        };
        const narrow = layout(2, 3, 4, 3, 40);
        const { arm, side, center, leg, step, torsoRows, legRows } = narrow.step >= 30 ? narrow : layout(3, 4, 5, 4, 34);
        const box = Math.round(step * 0.82);
        const grid = (location: string, points: number, gx: number, gy: number, columns: number, label: string) =>
            this.renderGrid(location, points, gx, gy, columns, label, box, step);
        const torsoY = y + 135 + rows(armor.head, 3) * step + 40;
        const legY = torsoY + torsoRows * step + 75;
        const rearY = legY + legRows * step + 115;
        const sideX = center / 2 * step + 20;
        const armX = sideX + side * step + 30;
        return groupBox(x, y, w, h, "ARMOR DIAGRAM", (
            <g>
                {grid("head", armor.head, cx - 1.5 * step, y + 135, 3, "Head")}
                {grid("centerTorso", armor.centerTorso, cx - center / 2 * step, torsoY, center, "Center Torso")}
                {grid("leftTorso", armor.leftTorso, cx + sideX, torsoY, side, "Left Torso")}
                {grid("rightTorso", armor.rightTorso, cx - sideX - side * step, torsoY, side, "Right Torso")}
                {grid("leftArm", armor.leftArm, cx + armX, torsoY + step, arm, "Left Arm")}
                {grid("rightArm", armor.rightArm, cx - armX - arm * step, torsoY + step, arm, "Right Arm")}
                {grid("leftLeg", armor.leftLeg, cx + 25, legY, leg, "Left Leg")}
                {grid("rightLeg", armor.rightLeg, cx - 25 - leg * step, legY, leg, "Right Leg")}
                {text(cx, rearY - 55, "REAR ARMOR", { size: 24, weight: 700, anchor: "middle" })}
                {grid("rightTorsoRear", armor.rightTorsoRear, cx - 9 * step - 40, rearY, 6, "Right Torso")}
                {grid("centerTorsoRear", armor.centerTorsoRear, cx - 3 * step, rearY, 6, "Center Torso")}
                {grid("leftTorsoRear", armor.leftTorsoRear, cx + 3 * step + 40, rearY, 6, "Left Torso")}
            </g>
        ));
    }

    renderInternalStructure(x: number, y: number, w: number, h: number): JSX.Element {
        const structure = this.props.mechData.getInternalStructure();
        const box = 20;
        const step = 25;
        const cx = x + w / 2;
        const torsoY = y + 110 + Math.ceil(structure.head / 3) * step + 40;
        const legY = torsoY + Math.max(Math.ceil(Math.max(structure.centerTorso, structure.leftTorso, structure.rightTorso) / 3), Math.ceil((structure.leftArm ?? 0) / 2) + 1) * step + 50;
        const grid = (location: Location, points: number, gx: number, gy: number, columns: number, label: string) =>
            this.renderGrid(`is-${location}`, points, gx, gy, columns, label, box, step);
        return groupBox(x, y, w, h, "INTERNAL STRUCTURE", (
            <g>
                {grid("head", structure.head, cx - 1.5 * step, y + 110, 3, "Head")}
                {grid("centerTorso", structure.centerTorso, cx - 1.5 * step, torsoY, 3, "CT")}
                {grid("leftTorso", structure.leftTorso, cx + 1.5 * step + 12, torsoY, 3, "LT")}
                {grid("rightTorso", structure.rightTorso, cx - 4.5 * step - 12, torsoY, 3, "RT")}
                {grid("leftArm", structure.leftArm ?? 0, cx + 4.5 * step + 24, torsoY + 20, 2, "LA")}
                {grid("rightArm", structure.rightArm ?? 0, cx - 6.5 * step - 24, torsoY + 20, 2, "RA")}
                {grid("leftLeg", structure.leftLeg, cx + 20, legY, 3, "LL")}
                {grid("rightLeg", structure.rightLeg, cx - 20 - 3 * step, legY, 3, "RL")}
            </g>
        ));
    }

    renderData(x: number, y: number, w: number, h: number): JSX.Element {
        const mech = this.props.mechData;
        const pilot = mech.getPilot();
        const line = (ly: number, label: string, value: React.ReactNode, indent = 0) => (
            <g key={label}>
                {text(x + 30 + indent, ly, label, { size: 30 })}
                {text(x + w - 30, ly, value, { size: 30, weight: 700, anchor: "end" })}
            </g>
        );
        return groupBox(x, y, w, h, "DROID DATA", (
            <g>
                {text(x + 30, y + 90, "Type:", { size: 30 })}
                {text(x + w - 30, y + 90, mech.getChassisName(), { size: 30, weight: 700, anchor: "end" })}
                {text(x + w - 30, y + 128, mech.getModelName(), { size: 28, anchor: "end" })}
                {line(y + 180, "Tonnage:", mech.getTonnage())}
                {text(x + 30, y + 240, "Movement Points:", { size: 30 })}
                {line(y + 290, "Walking", mech.getWalkSpeed(), 40)}
                {line(y + 340, "Running", mech.getRunSpeed(), 40)}
                {line(y + 390, "Jumping", mech.getJumpSpeed(), 40)}
                <rect x={x + 15} y={y + 430} width={w - 30} height={2} fill={INK} />
                {text(x + w / 2, y + 485, "DROID WARRIOR", { size: 32, weight: 700, anchor: "middle" })}
                {line(y + 545, "Name:", pilot.name)}
                {line(y + 600, "Pilot Skill:", pilot.piloting)}
                {line(y + 655, "Gunnery Skill:", pilot.gunnery)}
                {text(x + 30, y + 725, "DroidWarrior Hits:", { size: 30 })}
                {[3, 5, 7, 10, 11].map((hit, i) => (
                    <g key={hit} data-testid="droid-warrior-hit">
                        <circle cx={x + 65 + i * 75} cy={y + 790} r={28} fill="white" stroke={INK} strokeWidth={2} />
                        {text(x + 65 + i * 75, y + 800, hit, { size: 28, weight: 700, anchor: "middle" })}
                    </g>
                ))}
                {text(x + 65 + 5 * 75, y + 800, "Dead", { size: 30, weight: 700 })}
            </g>
        ));
    }

    renderHeatSinks(x: number, y: number, w: number, h: number): JSX.Element {
        const count = this.props.mechData.getHeatSinks();
        const perRow = 10;
        const step = 38;
        const left = x + (w - perRow * step + 6) / 2;
        return groupBox(x, y, w, h, "TOTAL HEAT SINKS", (
            <g data-testid="droid-heat-sinks" data-count={count}>
                {text(x + w / 2, y + 85, `${count} heat sinks`, { size: 26, anchor: "middle" })}
                {Array.from({ length: count }, (_unused, i) => (
                    <rect key={i} x={left + (i % perRow) * step} y={y + 110 + Math.floor(i / perRow) * step} width={32} height={32} fill="white" stroke={INK} strokeWidth={2} />
                ))}
            </g>
        ));
    }

    renderAmmo(x: number, y: number, w: number, h: number): JSX.Element {
        const ammo = getBattledroidsAmmo(this.props.mechData);
        const row = (rx: number, ry: number, label: string, value: React.ReactNode) => (
            <g key={label}>
                {text(rx, ry, label, { size: 28, italic: true })}
                {text(rx + 300, ry, value || "—", { size: 28, weight: 700 })}
            </g>
        );
        return groupBox(x, y, w, h, "AMMO", (
            <g data-testid="droid-ammo">
                {row(x + 30, y + 90, "AutoCannon Rounds", ammo.autoCannon)}
                {row(x + 30, y + 140, "M.G. Rounds", ammo.machineGun)}
                {row(x + w / 2, y + 90, "S.R.M.", ammo.srm)}
                {row(x + w / 2, y + 140, "L.R.M.", ammo.lrm)}
            </g>
        ));
    }

    /** One location of the Critical Hit Chart; a twelve-slot location in two groups of six, "1" and "2" as the book has them. */
    renderCriticals(location: Location, title: string, x: number, y: number, w: number, lineH: number): { element: JSX.Element; height: number } {
        const names = slotNames(this.props.mechData.getCriticals()[location] ?? []);
        const lines: JSX.Element[] = [];
        names.forEach((name, i) => {
            const ly = y + 40 + i * lineH;
            lines.push(
                <g key={i} data-testid="droid-critical">
                    {text(x + 50, ly, `${(i % 6) + 1}.`, { size: 22 })}
                    {name ? text(x + 80, ly, name, { size: 22 }) : <rect x={x + 80} y={ly + 4} width={w - 100} height={1.5} fill={INK} />}
                </g>,
            );
            if (names.length > 6 && i % 6 === 2) lines.push(text(x + 18, ly + lineH / 2, i < 6 ? "1" : "2", { size: 32, weight: 700 }, `group${i}`));
        });
        return {
            height: 50 + names.length * lineH,
            element: (
                <g key={location} data-testid={`droid-criticals-${location}`}>
                    {text(x + w / 2, y, title, { size: 24, weight: 700, anchor: "middle" })}
                    <rect x={x + w / 2 - title.length * 7.5} y={y + 5} width={title.length * 15} height={2} fill={INK} />
                    {lines}
                </g>
            ),
        };
    }

    renderCriticalChart(x: number, y: number, w: number, h: number): JSX.Element {
        const columnW = w / 3;
        const lineH = 27;
        const column = (index: number, locations: [Location, string][], extra?: (cy: number) => JSX.Element) => {
            let cy = y + 85;
            const parts = locations.map(([location, title]) => {
                const { element, height } = this.renderCriticals(location, title, x + index * columnW, cy, columnW, lineH);
                cy += height + 25;
                return element;
            });
            return <g key={index}>{parts}{extra ? extra(cy) : null}</g>;
        };
        const hitBoxes = (cy: number) => (
            <g data-testid="droid-component-hits">
                {([["Engine", 3], ["Gyro", 2], ["Sensors", 2]] as [string, number][]).map(([label, boxes], r) => (
                    <g key={label}>
                        {text(x + columnW + 60, cy + 40 + r * 45, label, { size: 28 })}
                        {Array.from({ length: boxes }, (_unused, i) => (
                            <rect key={i} x={x + columnW + 200 + i * 34} y={cy + 16 + r * 45} width={28} height={28} fill="white" stroke={INK} strokeWidth={2} />
                        ))}
                    </g>
                ))}
            </g>
        );
        return groupBox(x, y, w, h, "CRITICAL HIT CHART", (
            <g>
                {column(0, [["rightArm", "RIGHT ARM"], ["rightTorso", "RIGHT TORSO"], ["rightLeg", "RIGHT LEG"]])}
                {column(1, [["head", "HEAD"], ["centerTorso", "CENTER TORSO"]], hitBoxes)}
                {column(2, [["leftArm", "LEFT ARM"], ["leftTorso", "LEFT TORSO"], ["leftLeg", "LEFT LEG"]])}
            </g>
        ));
    }

    renderHeatScale(x: number, y: number, w: number, h: number): JSX.Element {
        const rowH = (h - 70) / 31;
        return groupBox(x, y, w, h, "HEAT SCALE", (
            <g>
                {Array.from({ length: 31 }, (_unused, r) => {
                    const level = 30 - r;
                    const ry = y + 50 + r * rowH;
                    return (
                        <g key={level} data-testid="droid-heat-level" data-level={level}>
                            <rect x={x + 20} y={ry} width={60} height={rowH} fill={level % 2 ? "white" : SHADE} stroke={INK} strokeWidth={2} />
                            {text(x + 50, ry + rowH * 0.72, level, { size: 24, weight: 700, anchor: "middle" })}
                            {HEAT_SCALE[level] ? text(x + 95, ry + rowH * 0.72, HEAT_SCALE[level], { size: 22 }) : null}
                        </g>
                    );
                })}
            </g>
        ));
    }

    render = (): JSX.Element => (
        <svg version="1.1" viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`} xmlns="http://www.w3.org/2000/svg" data-testid="battledroids-mech-record-sheet-svg">
            <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
            {this.renderArmorDiagram(25, 25, 850, 1000)}
            {this.renderInternalStructure(895, 25, 500, 700)}
            {this.renderHeatSinks(895, 745, 500, 280)}
            {this.renderData(RIGHT.x, 25, RIGHT.w, 1000)}
            {this.renderAmmo(25, 1045, LEFT_W, 190)}
            <rect x={25} y={1255} width={LEFT_W} height={95} rx={18} fill={INK} />
            {text(25 + LEFT_W / 2, 1325, "BATTLEDROIDS", { size: 64, weight: 900, anchor: "middle", fill: "white" })}
            {this.renderCriticalChart(25, 1370, LEFT_W, 1120)}
            {this.renderHeatScale(RIGHT.x, 1045, RIGHT.w, 1445)}
            {sheetFooter("The droid record sheet of Battledroids (FASA 1984).", getUnitRulesets(this.props.mechData))}
        </svg>
    );
}

interface IBattledroidsMechRecordSheetSVGProps {
    mechData: BattleMech;
}
