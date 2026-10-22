import React, { type JSX } from 'react';
import Vehicle from '../../../classes/vehicle';
import { getArtVeeNotes } from '../../../classes/vehicle-artvee';
import { IEquipmentItem, VehicleLocation } from '../../../data/data-interfaces';
import { SUPPORT_VEHICLE_FIRE_CONTROL } from '../../../data/support-vehicle-construction';
import {
    getVehicleCriticalHitsSheet,
    getVehicleHitLocationSheet,
    getVehicleMotiveTypeModifierRows,
    getVehicleSheetKind,
    getVehicleSheetTitle,
    getVehicleTableName,
    IVehicleSheetTable,
    VEHICLE_MOTIVE_DAMAGE_SHEET_ROWS,
    VEHICLE_MOTIVE_DIRECTION_ROWS,
    VehicleSheetKind,
    VTOL_PHYSICAL_ATTACK_ROWS,
} from '../../../data/vehicle-record-sheet-tables';
import { getUnitQuirkSheetLines, weaponQuirkSuffix } from '../quirk-sheet-block';
import { getRulesLevelName } from '../rules-level-print';
import { DOC_HEIGHT, DOC_WIDTH, GRAY, INK, SHADE, checkbox, groupBox, hitBox, sheetFooter, text, wrapText } from './record-sheet-svg-kit';
import VehicleDiagramSVG from './vehicle-diagram-svg';

// A full-page Combat or Support Vehicle record sheet, laid out like the Total Warfare record sheets (Ground
// Vehicle, V.T.O.L. and Naval Vehicle): vehicle data, weapons inventory, crew and critical damage boxes, notes
// and the armor diagram on top; the hit location, motive system damage (or VTOL elevation track and physical
// attacks) and critical hits tables below. Our own diagram and title block; no official art or logo.
// Coordinates are in a 2000 x 2600 document, US Letter in proportion, as on our 'Mech sheet.


// The armor diagram takes about a third of the page, as on the official sheets.
const LEFT = { x: 25, w: 860 };
const MIDDLE = { x: 905, w: 440 };
const RIGHT = { x: 1365, w: 610 };
const TOP = 150;
const TOP_BOTTOM = 1290;

export { wrapText };

// Location codes as the official sheets print them (FR, LS, RS, RR, TU, BD); the rest follow the same pattern.
const LOCATION_CODES: Partial<Record<VehicleLocation, string>> = {
    front: "FR", left: "LS", right: "RS", rear: "RR", rotor: "RO", turret: "TU",
    frontLeft: "FLS", frontRight: "FRS", rearLeft: "RLS", rearRight: "RRS",
};

export const weaponDamageText = (item: IEquipmentItem): string => {
    if (item.isEquipment) return "—";
    let base = "—";
    if (item.damagePerCluster) base = `${item.damagePerCluster}/Msl`;
    else if (typeof item.damage === "number") base = item.damage ? `${item.damage}` : "—";
    else if (item.damage) base = `${item.damage.short}/${item.damage.medium}/${item.damage.long}`;
    // Weapon type codes (TM p. 200 style, e.g. [DB,S]); descriptive notes are not codes.
    const codes = (item.weaponType ?? []).filter((code) => /^[A-Z]{1,3}$/.test(code));
    return codes.length ? `${base} [${codes.join(",")}]` : base;
};

// The weapon's short name for the Ammo line: "AC/5" rather than "Autocannon/5".
const shortWeaponName = (weapon: IEquipmentItem | undefined, bin: IEquipmentItem): string =>
    weapon ? (weapon.alternateName ? weapon.alternateName.toUpperCase() : weapon.name) : bin.name;

export default class VehicleRecordSheetSVG extends React.Component<IVehicleRecordSheetSVGProps> {
    get vehicle(): Vehicle { return this.props.vehicle; }

    get kind(): VehicleSheetKind {
        return getVehicleSheetKind(this.vehicle.getMotiveType().tag, this.vehicle.isLargeNavalVessel());
    }

    locationCode(location: string): string {
        if (!location) return "—";
        const vehicle = this.vehicle;
        if (vehicle.isLargeNavalVessel() && location.startsWith("turret")) {
            const name = vehicle.getLocations().find((loc) => loc.tag === location)?.name ?? "";
            return name.replace("Turret ", "T");
        }
        if (location === "turret2") return "FT";
        if (location === "turret" && vehicle.hasDualTurret()) return "RT";
        return LOCATION_CODES[location as VehicleLocation] ?? location.toUpperCase();
    }

    renderTitle(): JSX.Element {
        const vehicle = this.vehicle;
        const title = getVehicleSheetTitle(vehicle.getMotiveType().tag, {
            superheavy: vehicle.isSuperheavy(), support: vehicle.isSupportVehicle(), largeNaval: vehicle.isLargeNavalVessel(),
        });
        return (
            <g>
                <rect x={LEFT.x} y={20} width={MIDDLE.x + MIDDLE.w - LEFT.x} height={95} rx={18} fill={INK} />
                {text((LEFT.x + MIDDLE.x + MIDDLE.w) / 2, 85, title, { size: 48, weight: 700, anchor: "middle", fill: "white" })}
            </g>
        );
    }

    renderVehicleData(): JSX.Element {
        const vehicle = this.vehicle;
        const support = vehicle.getSupportVehicleSettings();
        const x = LEFT.x, y = TOP, w = LEFT.w;
        const name = `${vehicle.getModel()} ${vehicle.getName()}`.trim() || (support ? "Support Vehicle" : "Combat Vehicle");
        const label = (lx: number, ly: number, value: string) => text(lx, ly, value, { size: 26, weight: 700 });
        const value = (vx: number, vy: number, v: React.ReactNode) => text(vx, vy, v, { size: 26 });
        // A name that ends in its acronym prints the acronym: "Internal Combustion (ICE)" is "ICE".
        const engineName = support ? vehicle.getSupportVehicleEngine()?.name ?? "" : vehicle.getEngineType().name;
        const engine = /\(([A-Z]{2,})\)$/.exec(engineName)?.[1] ?? engineName;
        const turret = vehicle.hasTurret() ? vehicle.getTurretName() : "None";
        const rows: [string, React.ReactNode][] = [
            ["Cruising:", vehicle.getCruiseMP()],
            ["Flanking:", vehicle.getFlankMP()],
            ...(vehicle.getJumpMP() > 0 ? [["Jumping:", vehicle.getJumpMP()] as [string, React.ReactNode]] : []),
        ];
        return groupBox(x, y, w, 330, "Vehicle Data", (
            <>
                {label(x + 20, y + 80, "Type:")}
                {text(x + 105, y + 80, name, { size: name.length > 40 ? 24 : 28, weight: 500 })}
                {label(x + 20, y + 120, "Movement Points:")}
                {rows.map(([l, v], index) => (
                    <g key={l}>
                        {text(x + 50, y + 155 + index * 33, l, { size: 26 })}
                        {value(x + 200, y + 155 + index * 33, v)}
                    </g>
                ))}
                {label(x + 20, y + 260, "Movement Type:")}
                {value(x + 235, y + 260, `${vehicle.isOmni() ? "Omni " : ""}${vehicle.getMotiveType().name}`)}
                {label(x + 20, y + 295, "Engine Type:")}
                {text(x + 235, y + 295, `${engine} ${vehicle.getEngineRating()}`, { size: `${engine} ${vehicle.getEngineRating()}`.length > 16 ? 20 : 26 })}

                {label(x + 460, y + 120, "Tonnage:")}
                {value(x + 625, y + 120, vehicle.getTonnage())}
                {label(x + 460, y + 155, "Tech Base:")}
                {value(x + 625, y + 155, vehicle.getTech().name)}
                {label(x + 460, y + 190, "Rules Level:")}
                {value(x + 625, y + 190, getRulesLevelName(vehicle.getRequiredRulesLevel()))}
                {label(x + 460, y + 225, "Era:")}
                {text(x + 625, y + 225, vehicle.getEra().name, { size: vehicle.getEra().name.length > 16 ? 19 : 26 })}
                {label(x + 460, y + 260, "Turret:")}
                {value(x + 625, y + 260, `${turret}${vehicle.hasSponsonTurrets() ? " + Sponsons" : ""}`)}
                {support ? (
                    <>
                        {label(x + 460, y + 295, "Tech Rating:")}
                        {value(x + 625, y + 295, (vehicle.getSupportVehicleOverallTechRating() ?? "").toUpperCase())}
                    </>
                ) : null}
            </>
        ));
    }

    renderWeapons(): JSX.Element {
        const vehicle = this.vehicle;
        const x = LEFT.x, y = TOP + 350, w = LEFT.w, h = TOP_BOTTOM - (TOP + 350);
        const quirkLines = getUnitQuirkSheetLines(vehicle.quirks, vehicle.getEquipmentList().map((item) => ({ uuid: item.uuid, label: item.name })), vehicle.getQuirkTargets().locations);

        // Like weapons in the same location share a row with their quantity, as the official sheets print them.
        const rows: { qty: number; item: IEquipmentItem; label: string }[] = [];
        for (const item of vehicle.getEquipmentList().filter((entry) => !entry.isAmmo)) {
            const label = `${item.name}${item.pintle ? " (pintle)" : ""}${vehicle.isSponsonMounted(item) ? " (sponson)" : ""}${weaponQuirkSuffix(quirkLines, item.uuid)}`;
            const same = rows.find((row) => row.label === label && (row.item.location || "") === (item.location || ""));
            if (same) same.qty++;
            else rows.push({ qty: 1, item, label });
        }

        const bins = vehicle.getEquipmentList().filter((item) => item.isAmmo);
        const ammoSummary = bins.length
            ? `Ammo${vehicle.hasCASE() ? " (CASE)" : ""}: ${bins.map((bin) => `(${shortWeaponName(vehicle.getAmmoBinWeapon(bin), bin)}) ${vehicle.getAmmoBinShots(bin)}`).join(", ")}`
            : "";
        const ammoLines = ammoSummary ? wrapText(ammoSummary, 64) : [];
        const quirkText = quirkLines.unit.length ? wrapText(`Quirks: ${quirkLines.unit.join(", ")}`, 64) : [];

        const col = { qty: x + 40, type: x + 75, loc: x + 445, dmg: x + 485, min: x + 660, sht: x + 717, med: x + 774, lng: x + 831 };
        const headerY = y + 80;
        const footer = (ammoLines.length + bins.length + quirkText.length) * 32 + 70;
        const space = h - 120 - footer;
        const lineHeight = Math.max(20, Math.min(34, space / Math.max(1, rows.length)));
        const font = Math.min(24, Math.round(lineHeight * 0.72));
        const showDamage = this.props.showDamage;

        let cursor = y + 120 + rows.length * lineHeight + 20;
        const below: JSX.Element[] = [];
        ammoLines.forEach((line, index) => { below.push(text(x + 20, cursor, line, { size: 24, weight: index === 0 ? 500 : 400 }, `ammo-${index}`)); cursor += 32; });
        // A box per bin to track the shots left, as many players pencil them in beside the Ammo line.
        bins.forEach((bin, index) => {
            const shots = vehicle.getAmmoBinShots(bin);
            const left = showDamage && bin.currentAmmo !== undefined ? `${bin.currentAmmo}` : "";
            below.push(
                <g key={`bin-${index}`}>
                    {text(x + 40, cursor, `${bin.name}:`, { size: 22 })}
                    <rect x={x + 520} y={cursor - 24} width={150} height={30} fill="white" stroke={INK} strokeWidth={2} />
                    {text(x + 580, cursor - 2, left, { size: 22, anchor: "end" })}
                    {text(x + 595, cursor - 2, `/ ${shots}`, { size: 22 })}
                </g>
            );
            cursor += 32;
        });
        quirkText.forEach((line, index) => { below.push(text(x + 20, cursor, line, { size: 22, italic: true }, `quirk-${index}`)); cursor += 32; });

        return groupBox(x, y, w, h, "Weapons & Equipment Inventory", (
            <>
                {text(col.qty, headerY, "Qty", { size: 24, weight: 700, anchor: "middle" })}
                {text(col.type, headerY, "Type", { size: 24, weight: 700 })}
                {text(col.loc, headerY, "Loc", { size: 24, weight: 700, anchor: "middle" })}
                {text(col.dmg, headerY, "Dmg", { size: 24, weight: 700 })}
                {text(col.min, headerY, "Min", { size: 24, weight: 700, anchor: "middle" })}
                {text(col.sht, headerY, "Sht", { size: 24, weight: 700, anchor: "middle" })}
                {text(col.med, headerY, "Med", { size: 24, weight: 700, anchor: "middle" })}
                {text(col.lng, headerY, "Lng", { size: 24, weight: 700, anchor: "middle" })}
                {text(col.sht - 30, headerY + 26, "Range in hexes; to-hit +0 / +2 / +4", { size: 18, fill: GRAY, anchor: "middle" })}
                {rows.length === 0 ? text(x + w / 2, y + 160, "No Weapons or Equipment", { size: 24, anchor: "middle", fill: GRAY }) : null}
                {rows.map((row, index) => {
                    const ry = y + 120 + index * lineHeight + lineHeight * 0.75;
                    const item = row.item;
                    const ranged = !item.isEquipment && (item.range?.long ?? 0) > 0;
                    const range = (n: number | undefined) => ranged && n ? `${n}` : "—";
                    return (
                        <g key={`${row.label}-${index}`}>
                            {index % 2 === 0 ? <rect x={x + 10} y={y + 120 + index * lineHeight} width={w - 20} height={lineHeight} fill={SHADE} /> : null}
                            {text(col.qty, ry, row.qty, { size: font, anchor: "middle" })}
                            {text(col.type, ry, row.label, { size: row.label.length > 32 ? Math.min(font, 19) : font })}
                            {text(col.loc, ry, this.locationCode(item.location || ""), { size: font, anchor: "middle" })}
                            {text(col.dmg, ry, weaponDamageText(item), { size: Math.min(font, 22) })}
                            {text(col.min, ry, range(item.range?.min), { size: font, anchor: "middle" })}
                            {text(col.sht, ry, range(item.range?.short), { size: font, anchor: "middle" })}
                            {text(col.med, ry, range(item.range?.medium), { size: font, anchor: "middle" })}
                            {text(col.lng, ry, range(item.range?.long), { size: font, anchor: "middle" })}
                        </g>
                    );
                })}
                {below}
                {text(x + 20, y + h - 22, `Cost: ${vehicle.getCBillCost().toLocaleString("en-US")} C-bills`, { size: 26, weight: 700 })}
                {text(x + w - 30, y + h - 22, `BV: ${vehicle.getBattleValue().toLocaleString("en-US")}`, { size: 26, weight: 700, anchor: "end" })}
            </>
        ));
    }

    renderCrew(): JSX.Element {
        const vehicle = this.vehicle;
        const x = MIDDLE.x, y = TOP, w = MIDDLE.w;
        const isVTOL = this.kind === "vtol";
        const pilot = vehicle.getPilot();
        const crew = this.props.showCrew;
        const blank = (bx: number, by: number, width: number) => <line x1={bx} y1={by + 4} x2={bx + width} y2={by + 4} stroke={INK} strokeWidth={2} />;
        const [first, second] = isVTOL
            ? [["Co-Pilot Hit", "+1", "Modifier to all To-Hit rolls"], ["Pilot Hit", "+2", "Modifier to Driving Skill rolls"]]
            : [["Commander Hit", "+1", "Modifier to all Skill rolls"], ["Driver Hit", "+2", "Modifier to Driving Skill rolls"]];
        return groupBox(x, y, w, 300, "Crew Data", (
            <>
                {text(x + 20, y + 80, "Crew:", { size: 26, weight: 700 })}
                {text(x + 105, y + 80, `${vehicle.getCrew()}${crew && pilot.name ? ` (${pilot.name})` : ""}`, { size: 26 })}
                {text(x + 20, y + 125, "Gunnery Skill:", { size: 24, weight: 700 })}
                {crew ? text(x + 190, y + 125, pilot.gunnery, { size: 26, testid: "crew-gunnery" }) : blank(x + 185, y + 125, 40)}
                {text(x + 230, y + 125, "Driving Skill:", { size: 24, weight: 700 })}
                {crew ? text(x + 385, y + 125, pilot.piloting, { size: 26 }) : blank(x + 380, y + 125, 40)}
                {[first, second].map(([name, modifier, note], index) => {
                    const cx = x + 20 + index * 215;
                    return (
                        <g key={name}>
                            {text(cx, y + 190, name, { size: 21 })}
                            {hitBox(cx + 160, y + 190, modifier)}
                            {wrapText(note, 20).map((line, li) => text(cx, y + 225 + li * 24, line, { size: 19 }, `${name}-${li}`))}
                        </g>
                    );
                })}
            </>
        ));
    }

    renderCriticalDamage(): JSX.Element {
        const vehicle = this.vehicle;
        const x = MIDDLE.x, y = TOP + 320, w = MIDDLE.w;
        const isVTOL = this.kind === "vtol";
        const turrets = vehicle.getLocations().filter((loc) => loc.tag.startsWith("turret"));
        const stabilizers = vehicle.getLocations().filter((loc) => loc.tag !== "rotor");
        const rowY = (n: number) => y + 85 + n * 42;
        const lines: JSX.Element[] = [];
        let row = 0;
        if (isVTOL) {
            lines.push(<g key="fs">{text(x + 20, rowY(row), "Flight Stabilizer*", { size: 22 })}{hitBox(x + 200, rowY(row), "+3")}</g>);
        } else if (turrets.length) {
            lines.push(<g key="tl">{text(x + 20, rowY(row), "Turret Locked", { size: 24 })}{turrets.map((loc, i) => checkbox(x + 185 + i * 30, rowY(row), loc.tag))}</g>);
        }
        lines.push(<g key="eh">{text(x + 262, rowY(row), "Engine Hit", { size: 24 })}{checkbox(x + 390, rowY(row))}</g>);
        row++;
        if (isVTOL && turrets.length) {
            lines.push(<g key="tl">{text(x + 20, rowY(row), "Turret Locked", { size: 24 })}{checkbox(x + 185, rowY(row))}</g>);
            row++;
        }
        lines.push(<g key="sh">{text(x + 20, rowY(row), "Sensor Hits", { size: 24 })}{["+1", "+2", "+3", "D"].map((m, i) => hitBox(x + 235 + i * 46, rowY(row), m, m))}</g>);
        row++;
        if (!isVTOL) {
            lines.push(<g key="mh">{text(x + 20, rowY(row), "Motive System Hits", { size: 24 })}{["+1", "+2", "+3"].map((m, i) => hitBox(x + 235 + i * 46, rowY(row), m, m))}</g>);
            row++;
        }
        lines.push(text(x + w / 2, rowY(row), "Stabilizers", { size: 24, weight: 700, anchor: "middle" }, "st"));
        row++;
        stabilizers.forEach((loc, index) => {
            const sx = x + 20 + (index % 3) * 140;
            const sy = rowY(row + Math.floor(index / 3));
            lines.push(<g key={loc.tag}>{text(sx, sy, loc.name, { size: loc.name.length > 8 ? 17 : 22 })}{checkbox(sx + 100, sy)}</g>);
        });
        return groupBox(x, y, w, 360, "Critical Damage", (
            <>
                {lines}
                {isVTOL ? text(x + 20, y + 345, "*Move at Cruising speed only", { size: 19, italic: true }) : null}
            </>
        ));
    }

    renderNotes(): JSX.Element {
        const vehicle = this.vehicle;
        const isSub = vehicle.getMotiveType().tag === "naval-sub";
        const x = MIDDLE.x, y = TOP + 700, w = MIDDLE.w, h = (TOP_BOTTOM - y) - (isSub ? 250 : 0);
        const support = vehicle.getSupportVehicleSettings();
        const notes: { text: string; testid?: string }[] = [];
        if (vehicle.getTroopSpace() > 0 || vehicle.getBays().length > 0) {
            notes.push({
                testid: "vehicle-bays-sheet",
                text: `Transport: ${[
                    ...(vehicle.getTroopSpace() > 0 ? [`Infantry Compartment ${vehicle.getTroopSpace()} t`] : []),
                    ...vehicle.getBays().map((bay) => `${vehicle.getBayName(bay)} ${bay.amount}${bay.doors > 0 ? ` (${bay.doors} door${bay.doors === 1 ? "" : "s"})` : ""}`),
                ].join(", ")}`,
            });
        }
        if (support) {
            const fireControl = SUPPORT_VEHICLE_FIRE_CONTROL[support.fireControl].name;
            notes.push({ text: `${fireControl.includes("Fire Control") ? fireControl : `Fire Control: ${fireControl}`}${vehicle.getFireControlToHitModifier() > 0 ? ` (+${vehicle.getFireControlToHitModifier()} to-hit)` : ""}` });
            if (vehicle.getSupportVehicleRangeKm() !== null) notes.push({ text: `Range ${vehicle.getSupportVehicleRangeKm()} km` });
        }
        if (vehicle.isArtVee()) notes.push({ text: "Siege Mode: Cruising 0, Flanking 0" });
        for (const note of vehicle.getFrankenVehicleNotes()) notes.push({ text: note });
        for (const note of getArtVeeNotes(vehicle)) notes.push({ text: note, testid: "artvee-note" });

        let cursor = y + 80;
        const lines: JSX.Element[] = [];
        notes.forEach((note, index) => {
            const wrapped = wrapText(note.text, 38);
            lines.push(
                <text key={index} x={x + 20} y={cursor} fontFamily="sans-serif" fontSize={20} fill={INK} data-testid={note.testid}>
                    {wrapped.map((line, li) => <tspan key={li} x={x + 20} dy={li === 0 ? 0 : 24}>{line}</tspan>)}
                </text>
            );
            cursor += wrapped.length * 24 + 8;
        });
        // Ruled lines for the player's own notes under any printed ones.
        for (let ly = cursor + 20; ly < y + h - 15; ly += 38) {
            lines.push(<line key={`rule-${ly}`} x1={x + 20} y1={ly} x2={x + w - 20} y2={ly} stroke={SHADE} strokeWidth={2} />);
        }
        return (
            <>
                {groupBox(x, y, w, h, "Notes", lines)}
                {isSub ? this.renderTrack(x, y + h + 20, w, 230, "Depth Track", "Depth", 20) : null}
            </>
        );
    }

    // A turn-by-turn track (VTOL elevation, submarine depth): rows of Turn numbers over blank cells.
    renderTrack(x: number, y: number, w: number, h: number, title: string, rowName: string, turns: number): JSX.Element {
        const perBand = turns > 20 ? 15 : 10;
        const bands = Math.ceil(turns / perBand);
        const labelW = rowName.length > 6 ? 125 : 90;
        const cellW = (w - 40 - labelW) / perBand;
        const cellH = 36;
        const bandH = (h - 70) / bands;
        const cells: JSX.Element[] = [];
        for (let band = 0; band < bands; band++) {
            const by = y + 60 + band * bandH;
            cells.push(<rect key={`b${band}`} x={x + 20} y={by} width={w - 40} height={cellH * 2} fill="white" stroke={INK} strokeWidth={2} />);
            cells.push(text(x + 28, by + 26, "Turn", { size: 20, weight: 700 }, `t${band}`));
            cells.push(text(x + 28, by + cellH + 26, rowName, { size: 20, weight: 700 }, `r${band}`));
            cells.push(<line key={`m${band}`} x1={x + 20} y1={by + cellH} x2={x + w - 20} y2={by + cellH} stroke={INK} strokeWidth={1.5} />);
            for (let i = 0; i < perBand; i++) {
                const cx = x + 20 + labelW + i * cellW;
                cells.push(<line key={`c${band}-${i}`} x1={cx} y1={by} x2={cx} y2={by + cellH * 2} stroke={INK} strokeWidth={1.5} />);
                cells.push(text(cx + cellW / 2, by + 26, band * perBand + i + 1, { size: 19, anchor: "middle" }, `n${band}-${i}`));
            }
        }
        return groupBox(x, y, w, h, title, cells);
    }

    renderArmor(): JSX.Element {
        const vehicle = this.vehicle;
        const x = RIGHT.x, y = TOP, w = RIGHT.w, h = TOP_BOTTOM - TOP;
        const support = vehicle.getSupportVehicleSettings();
        const armor = vehicle.getArmorAllocation() as unknown as Record<string, number | undefined>;
        const structure = vehicle.getStructureAllocation() as unknown as Record<string, number | undefined>;
        const locations = vehicle.getLocations();
        const listTop = y + 880;
        const step = Math.min(40, (y + h - 20 - listTop) / Math.max(1, locations.length));
        const armorName = (name: string, tag: string) => tag === "left" || tag === "right" ? `${name} Side Armor` : `${name} Armor`;
        return groupBox(x, y, w, h, "Armor Diagram", (
            <>
                {text(x + 20, y + 80, support ? `BAR: ${support.bar}` : `Armor: ${vehicle.getArmorDescription()}`, { size: 22, weight: 700 })}
                <VehicleDiagramSVG
                    x={x + 10}
                    y={y + 95}
                    width={w - 20}
                    motive={vehicle.getMotiveType()}
                    locations={locations}
                    structure={vehicle.getStructureAllocation()}
                    armor={vehicle.getArmorAllocation()}
                    armorDamage={this.props.showDamage ? vehicle.getInPlay().armorDamage : undefined}
                    structureDamage={this.props.showDamage ? vehicle.getInPlay().structureDamage : undefined}
                />
                {locations.map((loc, index) => (
                    <g key={loc.tag}>
                        {text(x + 20, listTop + index * step, `${armorName(loc.name, loc.tag)} (${armor[loc.tag] ?? 0})`, { size: Math.min(24, step * 0.65), weight: 500 })}
                        {text(x + w - 20, listTop + index * step, `Structure ${structure[loc.tag] ?? 0}`, { size: Math.min(20, step * 0.55), anchor: "end", fill: GRAY })}
                    </g>
                ))}
            </>
        ));
    }

    // A table of 2D6 rolls against columns, centred in its box.
    renderRollTable(table: IVehicleSheetTable, x: number, y: number, w: number, caption: string, rowHeight: number, firstColumnWidth: number): JSX.Element {
        const columnW = (w - 40 - firstColumnWidth) / table.columns.length;
        const cx = (i: number) => x + 20 + firstColumnWidth + columnW * i + columnW / 2;
        return (
            <g>
                {text((cx(0) + cx(table.columns.length - 1)) / 2, y, caption, { size: 22, weight: 700, anchor: "middle" })}
                {text(x + 20 + firstColumnWidth / 2, y + 30, "2D6 Roll", { size: 22, weight: 700, anchor: "middle" })}
                {table.columns.map((column, i) => text(cx(i), y + 30, column.toUpperCase(), { size: 22, weight: 700, anchor: "middle" }, column))}
                {table.rows.map((row, r) => (
                    <g key={row.roll}>
                        {r % 2 === 0 ? <rect x={x + 15} y={y + 38 + r * rowHeight} width={w - 30} height={rowHeight} fill={SHADE} /> : null}
                        {text(x + 20 + firstColumnWidth / 2, y + 38 + r * rowHeight + rowHeight * 0.75, row.roll, { size: 22, weight: 700, anchor: "middle" })}
                        {row.cells.map((cell, i) => text(cx(i), y + 38 + r * rowHeight + rowHeight * 0.75, cell, { size: 22, anchor: "middle" }, `${row.roll}-${i}`))}
                    </g>
                ))}
            </g>
        );
    }

    footnotes(x: number, y: number, notes: string[], width: number, size = 18): JSX.Element[] {
        const out: JSX.Element[] = [];
        let cursor = y;
        notes.forEach((note, n) => {
            wrapText(note, width).forEach((line, i) => {
                out.push(text(x, cursor, line, { size }, `fn-${n}-${i}`));
                cursor += size + 4;
            });
            cursor += 4;
        });
        return out;
    }

    renderHitLocations(): JSX.Element {
        const kind = this.kind;
        const superheavy = this.vehicle.isSuperheavy();
        const x = LEFT.x, y = TOP_BOTTOM + 20, w = 1100, h = 660;
        const tableName = getVehicleTableName(kind, { superheavy, support: this.vehicle.isSupportVehicle() }, "hit");
        const table = getVehicleHitLocationSheet(kind, superheavy);
        const criticalNote = `* A 2 or 12 (or an 8 on a side attack) may inflict a critical hit: apply damage to the armor normally, then roll once on the Critical Hits Table for that location (TW p. 192).${kind === "vtol" ? "" : " Against a vehicle with no turret, a 12 is a critical chance on the side facing the attack."}`;
        const notes = kind === "vtol"
            ? [criticalNote, "† A rotor hit deals the Damage Value / 10 (round up) to the rotor and costs 1 Cruising MP; work out Flanking MP again (Cruising x 1.5, round up). The loss takes effect at the end of the phase (TW p. 197)."]
            : kind === "largeNaval"
                ? [criticalNote, "† Also roll once on the Motive System Damage Table; attacks from above the waterline take -2 on that roll (TO:AUE p. 26). A 5 or 9 strikes the armor of the next hex in the direction named."]
                : [
                    criticalNote,
                    "† The motive system may be damaged even if the armor holds: apply damage normally, then also roll once on the Motive System Damage Table. The damage takes effect at the end of the phase (TW p. 192).",
                    superheavy
                        ? "§ Front Side and Rear Side results strike that half of the side attacked; Right/Left Side results strike the half nearest the attack (TO p. 378). With no turret, a Turret result strikes the side attacked."
                        : "§ Side results strike the side attacked. With no turret, a Turret result strikes the armor on the side attacked.",
                ];
        return groupBox(x, y, w, h, `${tableName} Hit Location Table`, (
            <>
                {this.renderRollTable(table, x, y + 75, w, "ATTACK DIRECTION", 30, 120)}
                {this.footnotes(x + 25, y + 475, notes, 112)}
            </>
        ));
    }

    renderMotiveDamage(): JSX.Element {
        const x = 1145, y = TOP_BOTTOM + 20, w = 830, h = 660;
        let cursor = y + 80;
        const lines: JSX.Element[] = [
            text(x + 25, cursor, "2D6 Roll", { size: 22, weight: 700 }, "h1"),
            text(x + 160, cursor, "Effect*", { size: 22, weight: 700 }, "h2"),
        ];
        cursor += 32;
        VEHICLE_MOTIVE_DAMAGE_SHEET_ROWS.forEach((row) => {
            lines.push(text(x + 70, cursor, row.roll, { size: 22, weight: 700, anchor: "middle" }, `r${row.roll}`));
            wrapText(row.effect, 56).forEach((line, i) => {
                lines.push(text(x + 160, cursor, line, { size: 22 }, `e${row.roll}-${i}`));
                cursor += 27;
            });
            cursor += 5;
        });
        cursor += 15;
        const blockTop = cursor;
        lines.push(text(x + 25, cursor, "Attack Direction Modifier:", { size: 22, weight: 700 }, "adm"));
        VEHICLE_MOTIVE_DIRECTION_ROWS.forEach(([name, mod], i) => {
            lines.push(text(x + 25, blockTop + 30 + i * 27, name, { size: 22 }, `ad${i}`));
            lines.push(text(x + 330, blockTop + 30 + i * 27, mod, { size: 22, anchor: "end" }, `adv${i}`));
        });
        lines.push(text(x + 400, blockTop, "Vehicle Type Modifiers:", { size: 22, weight: 700 }, "vtm"));
        const typeRows = getVehicleMotiveTypeModifierRows(this.kind);
        typeRows.forEach(([name, mod], i) => {
            lines.push(text(x + 400, blockTop + 30 + i * 27, name, { size: 22 }, `vt${i}`));
            lines.push(text(x + w - 30, blockTop + 30 + i * 27, mod, { size: 22, anchor: "end" }, `vtv${i}`));
        });
        cursor = blockTop + 30 + typeRows.length * 27 + 15;
        const note = "* Driving Skill Roll modifiers add up, but each one applies only once: a second 6-7 result adds nothing more, and the total can be no more than +6. "
            + "A vehicle reduced to 0 Cruising MP cannot move for the rest of the game but is not an immobile target. Damage takes effect at the end of the phase. "
            + "An immobilized hover vehicle over water of Depth 1 or deeper sinks and is destroyed (TW p. 193).";
        return groupBox(x, y, w, h, "Motive System Damage Table", (
            <>
                {lines}
                {this.footnotes(x + 25, cursor, [note], 84)}
            </>
        ));
    }

    renderVTOLHelpers(): JSX.Element {
        const x = 1145, y = TOP_BOTTOM + 20, w = 830;
        const py = y + 360;
        return (
            <>
                {this.renderTrack(x, y, w, 340, "VTOL Elevation Track", "Elevation", 30)}
                {groupBox(x, py, w, 300, "Physical Attacks Against VTOL Vehicles", (
                    <>
                        {text(x + 160, py + 80, "Difference in Levels", { size: 22, weight: 700, anchor: "middle" })}
                        {text(x + 560, py + 80, "Physical Attacks Allowed", { size: 22, weight: 700, anchor: "middle" })}
                        {VTOL_PHYSICAL_ATTACK_ROWS.map(([difference, allowed], i) => (
                            <g key={difference}>
                                {i % 2 === 0 ? <rect x={x + 15} y={py + 92 + i * 36} width={w - 30} height={36} fill={SHADE} /> : null}
                                {text(x + 160, py + 118 + i * 36, difference, { size: 22, anchor: "middle" })}
                                {text(x + 560, py + 118 + i * 36, allowed, { size: 22, anchor: "middle" })}
                            </g>
                        ))}
                    </>
                ))}
            </>
        );
    }

    renderCriticalHits(): JSX.Element {
        const kind = this.kind;
        const x = LEFT.x, y = TOP_BOTTOM + 700, w = DOC_WIDTH - 2 * LEFT.x, h = 400;
        const tableName = getVehicleTableName(kind, { superheavy: this.vehicle.isSuperheavy(), support: this.vehicle.isSupportVehicle() }, "critical");
        return groupBox(x, y, w, h, `${tableName} Critical Hits Table`, (
            <>
                {this.renderRollTable(getVehicleCriticalHitsSheet(kind === "vtol"), x + 100, y + 72, w - 200, "LOCATION HIT", 28, 160)}
                {text(x + 40, y + h - 18, `* Only with an ICE engine; with a fusion engine treat this result as Engine Hit.`, { size: 20 })}
                {text(x + w - 40, y + h - 18, `** If the vehicle carries no ammunition, treat this result as Weapon Destroyed.`, { size: 20, anchor: "end" })}
            </>
        ));
    }

    renderFooter(): JSX.Element {
        return sheetFooter("Tables: Total Warfare pp. 192-197.");
    }

    render = (): JSX.Element => (
        <svg
            version="1.1"
            viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`}
            xmlns="http://www.w3.org/2000/svg"
            data-testid="vehicle-record-sheet-svg"
        >
            <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
            {this.renderTitle()}
            {this.renderVehicleData()}
            {this.renderWeapons()}
            {this.renderCrew()}
            {this.renderCriticalDamage()}
            {this.renderNotes()}
            {this.renderArmor()}
            {this.renderHitLocations()}
            {this.kind === "vtol" ? this.renderVTOLHelpers() : this.renderMotiveDamage()}
            {this.renderCriticalHits()}
            {this.renderFooter()}
        </svg>
    );
}

interface IVehicleRecordSheetSVGProps {
    vehicle: Vehicle;
    showCrew?: boolean;
    showDamage?: boolean;
}
