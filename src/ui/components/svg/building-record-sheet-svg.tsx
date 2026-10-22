import React, { type JSX } from 'react';
import Building, { BUILDING_CRITICAL_HITS, findBuildingCapitalWeapon } from '../../../classes/building';
import { DOC_HEIGHT, DOC_WIDTH, GRAY, INK, SHADE, blank, checkbox, groupBox, sheetFooter, text, titleBanner, wrapText } from './record-sheet-svg-kit';
import { weaponDamageText } from './vehicle-record-sheet-svg';

// A Structure Record Sheet laid out like the Tactical Operations one (TO:AUE p.215): structure data, the weapons and
// equipment inventory, a CF and armor line for every hex, crew data and a structure map to mark the building's
// footprint on, level by level. To those we add the rules a player looks up in play: what entering each hex costs,
// the Damage Threshold and the damage the building soaks up or deals (TO:AR pp.117-118, 124-125), and the Advanced
// Building Critical Hits Table (TO:AR pp.118-119). Hexes and weapons past the first page go on continuation pages.
// Our own map drawing; no official art.

/** Hexes on the first page; the rest go on continuation pages. */
export const BUILDING_HEXES_PER_PAGE = 40;
const HEXES_PER_CONTINUATION = 100;
const WEAPONS_PER_PAGE = 24;
const WEAPONS_PER_CONTINUATION = 36;
const MAP_LEVELS = 4;

const X = 25;
const TOP = 140;
const BOTTOM = 2480;
const LEFT_W = 930;
const RIGHT_X = X + LEFT_W + 20;
const RIGHT_W = DOC_WIDTH - X - RIGHT_X;

interface IWeaponLine { qty: number; type: string; hexLoc: string; dmg: string; min: string; sht: string; med: string; lng: string; status: string }

const signed = (value: number): string => `${value >= 0 ? "+" : ""}${value}`;

/** The inventory lines: identical items in the same hex and mount share a line unless play has marked them. */
export const buildingWeaponLines = (building: Building, showDamage: boolean): IWeaponLine[] => {
    const lines: IWeaponLine[] = [];
    const keyed = new Map<string, IWeaponLine>();
    for (const mount of building.getEquipment()) {
        const item = mount.item;
        const uuid = item.uuid || "";
        const ammo = showDamage && item.isAmmo && building.getAmmoCapacity(uuid) > 0 ? ` (${building.getAmmoShots(uuid)} of ${building.getAmmoCapacity(uuid)} shots)` : item.isAmmo && item.roundsPerTon ? ` (${item.roundsPerTon})` : "";
        const status = showDamage && !item.isAmmo ? building.getMountStatus(uuid) : "";
        const line: IWeaponLine = {
            qty: 1,
            type: `${item.name}${mount.automated ? " (A)" : ""}${ammo}`,
            hexLoc: `${mount.hex}${mount.turret ? " / T" : ""}`,
            dmg: item.isAmmo ? "" : weaponDamageText(item),
            min: item.isAmmo || !item.range ? "" : `${item.range.min || "—"}`,
            sht: item.isAmmo || !item.range ? "" : `${item.range.short ?? ""}`,
            med: item.isAmmo || !item.range ? "" : `${item.range.medium ?? ""}`,
            lng: item.isAmmo || !item.range ? "" : `${item.range.long ?? ""}`,
            status,
        };
        const key = `${line.type}|${line.hexLoc}`;
        const same = !showDamage && !item.isAmmo ? keyed.get(key) : undefined;
        if (same) same.qty += 1;
        else {
            lines.push(line);
            keyed.set(key, line);
        }
    }
    for (const mount of building.getLightWeapons()) {
        const ranges = Building.getLightWeaponRanges(mount.weapon);
        const shots = Building.getLightMountShots(mount);
        lines.push({
            qty: 1,
            type: `${mount.weapon.name}${shots === null ? "" : showDamage ? ` (${building.getLightWeaponShots(mount.uuid)} of ${shots} shots)` : ` (${shots} shots)`}`,
            hexLoc: `${mount.hex}${mount.mount === "turret" ? " / T" : mount.mount === "pintle" ? " / P" : ""}`,
            dmg: `${Building.getLightWeaponDamage(mount.weapon)}${mount.weapon.special ? ` [${mount.weapon.special}]` : ""}`,
            min: "—", sht: `${ranges.short}`, med: `${ranges.medium}`, lng: `${ranges.long}`,
            status: showDamage ? building.getLightWeaponStatus(mount.uuid) : "",
        });
    }
    for (const mount of building.getCapitalWeapons()) {
        const shots = Object.keys(mount.shots).filter((tag) => mount.shots[tag] > 0)
            .map((tag) => `${mount.shots[tag]} ${Object.keys(mount.shots).length > 1 ? `${findBuildingCapitalWeapon(tag)?.name} ` : ""}${mount.shots[tag] === 1 ? "shot" : "shots"}`);
        lines.push({
            qty: 1,
            type: `${mount.weapon.name}${shots.length ? ` (${shots.join(", ")})` : ""}${mount.ammoHex !== null ? `, ammo in hex ${mount.ammoHex}` : ""}`,
            hexLoc: `${mount.hex}${mount.sharedHexes.length > 0 ? ` (+${mount.sharedHexes.join(",")})` : ""}`,
            dmg: mount.weapon.damage !== null ? `${mount.weapon.damage}-C` : "*",
            min: "", sht: "", med: "", lng: mount.weapon.range ? `${mount.weapon.range}-C up` : "Up",
            status: "",
        });
    }
    return lines;
};

/** How many pages the building's sheet takes: hexes and inventory lines that do not fit run on. */
export const buildingSheetPages = (building: Building, showDamage = false): number => {
    const hexes = Math.max(0, building.getHexes() - BUILDING_HEXES_PER_PAGE);
    const weapons = Math.max(0, buildingWeaponLines(building, showDamage).length - WEAPONS_PER_PAGE);
    return 1 + Math.max(Math.ceil(hexes / HEXES_PER_CONTINUATION), Math.ceil(weapons / WEAPONS_PER_CONTINUATION));
};

export default class BuildingRecordSheetSVG extends React.Component<IBuildingRecordSheetSVGProps> {
    get building(): Building { return this.props.building; }
    get showDamage(): boolean { return !!this.props.showDamage; }

    // The inventory's column positions, for a table `w` wide starting at `x`.
    columns(x: number, w: number) {
        const right = x + w - 20;
        return { qty: x + 20, type: x + 62, hex: right - 420, dmg: right - 300, min: right - 190, sht: right - 135, med: right - 80, lng: right - 25 };
    }

    renderWeaponRows(lines: IWeaponLine[], x: number, w: number, y: number, rowH: number, rows: number): JSX.Element {
        const col = this.columns(x, w);
        const typeChars = Math.floor((col.hex - 50 - col.type) / 10);
        return (
            <g>
                {text(col.qty, y, "Qty", { size: 17, weight: 700 })}
                {text(col.type, y, "Type", { size: 17, weight: 700 })}
                {([["Hex/Loc", col.hex], ["Dmg", col.dmg], ["Min", col.min], ["Sht", col.sht], ["Med", col.med], ["Lng", col.lng]] as [string, number][])
                    .map(([label, lx]) => text(lx, y, label, { size: 17, weight: 700, anchor: "middle" }, label))}
                {Array.from({ length: rows }, (_, i) => {
                    const ly = y + 12 + i * rowH;
                    const line = lines[i];
                    const lost = !!line?.status;
                    const type = line ? `${line.type}${line.status ? ` - ${line.status}` : ""}` : "";
                    return (
                        <g key={i} data-testid={line ? "building-weapon" : undefined} data-qty={line ? line.qty : undefined}>
                            {i % 2 === 0 ? <rect x={x + 12} y={ly} width={w - 24} height={rowH} fill={SHADE} /> : null}
                            {line ? (
                                <>
                                    {text(col.qty + 10, ly + rowH * 0.74, line.qty, { size: 18, anchor: "middle" })}
                                    {text(col.type, ly + rowH * 0.74, type, { size: type.length > typeChars ? Math.max(12, Math.floor(18 * typeChars / type.length)) : 18, weight: lost ? 700 : 400 })}
                                    {text(col.hex, ly + rowH * 0.74, line.hexLoc, { size: line.hexLoc.length > 8 ? 13 : 18, anchor: "middle" })}
                                    {text(col.dmg, ly + rowH * 0.74, line.dmg, { size: line.dmg.length > 9 ? 13 : 18, anchor: "middle" })}
                                    {line.lng.endsWith("up") || line.lng === "Up"
                                        ? text((col.min + col.lng) / 2, ly + rowH * 0.74, `${line.lng.replace(" up", "")}, upward only`, { size: 16, anchor: "middle" })
                                        : [line.min, line.sht, line.med, line.lng].map((band, b) => text([col.min, col.sht, col.med, col.lng][b], ly + rowH * 0.74, band, { size: 18, anchor: "middle" }, `b${b}`))}
                                </>
                            ) : (
                                <line x1={col.type} x2={x + w - 20} y1={ly + rowH - 3} y2={ly + rowH - 3} stroke={GRAY} strokeWidth={1} />
                            )}
                        </g>
                    );
                })}
            </g>
        );
    }

    // One hex's line: its number, a blank for the mapsheet hex, CF and armor with blanks for what is left, and what
    // entering it costs.
    renderHexRow(hex: number, x: number, y: number, w: number): JSX.Element {
        const building = this.building;
        const cf = building.getCF();
        const armor = building.getArmorPoints();
        const currentCF = building.getHexCF(hex);
        const currentArmor = building.getHexArmor(hex);
        const damaged = this.showDamage && (currentCF < cf || currentArmor < armor);
        const destroyed = this.showDamage && building.isHexDestroyed(hex);
        const mp = building.getHexMPCost(hex);
        const psr = building.getHexPilotingModifier(hex);
        const enter = mp === null ? "No entry" : `+${mp} MP${psr === null ? "" : `, PSR ${signed(psr)}`}`;
        const c = { hex: x + 30, map: x + 58, cf: x + 172, armor: x + 280, enter: x + w - 8 };
        return (
            <g key={hex} data-testid="building-hex" data-hex={hex} data-cf={cf} data-armor={armor}
                data-current-cf={damaged ? currentCF : undefined} data-current-armor={damaged ? currentArmor : undefined}>
                {text(c.hex, y, hex, { size: 19, weight: 700, anchor: "middle" })}
                {blank(c.map, y, 62)}
                {text(c.cf, y, cf, { size: 18, anchor: "end" })}
                {damaged ? text(c.cf + 10, y, currentCF, { size: 19, weight: 700 }) : blank(c.cf + 8, y, 52)}
                {text(c.armor, y, armor, { size: 18, anchor: "end" })}
                {damaged ? text(c.armor + 10, y, currentArmor, { size: 19, weight: 700 }) : blank(c.armor + 8, y, 52)}
                {text(c.enter, y, enter, { size: enter.length > 16 ? 13 : 15, anchor: "end" })}
                {destroyed ? <line x1={x + 10} x2={x + w - 5} y1={y - 7} y2={y - 7} stroke={INK} strokeWidth={3} /> : null}
            </g>
        );
    }

    renderHexColumns(hexes: number[], x: number, y: number, w: number, columns: number, rowsPerColumn: number, rowH: number): JSX.Element {
        const colW = w / columns;
        return (
            <g>
                {Array.from({ length: columns }, (_, column) => {
                    const cx = x + column * colW;
                    const these = hexes.slice(column * rowsPerColumn, (column + 1) * rowsPerColumn);
                    return (
                        <g key={column}>
                            {text(cx + 30, y, this.building.getHexLabel() === "hex" ? "Hex" : "Side", { size: 15, weight: 700, anchor: "middle" })}
                            {text(cx + 89, y, "Map", { size: 15, weight: 700, anchor: "middle" })}
                            {text(cx + 185, y, "CF / Left", { size: 15, weight: 700, anchor: "middle" })}
                            {text(cx + 295, y, "Armor / Left", { size: 15, weight: 700, anchor: "middle" })}
                            {text(cx + colW - 8, y, "Entering", { size: 15, weight: 700, anchor: "end" })}
                            {these.map((hex, i) => (
                                <g key={hex}>
                                    {i % 2 === 0 ? <rect x={cx + 5} y={y + 10 + i * rowH} width={colW - 10} height={rowH} fill={SHADE} /> : null}
                                    {this.renderHexRow(hex, cx, y + 10 + i * rowH + rowH * 0.72, colW)}
                                </g>
                            ))}
                        </g>
                    );
                })}
            </g>
        );
    }

    // What play has done to hexes beyond their numbers, one line each.
    conditionLines(hexes: number[]): string[] {
        if (!this.showDamage) return [];
        const building = this.building;
        const lines: string[] = [];
        if (building.isBreached()) lines.push("BREACHED: unprotected personnel and equipment inside are lost.");
        for (const hex of hexes) {
            const state = building.getHexState(hex);
            const parts = [
                ...(building.isHexDestroyed(hex) ? [building.isGunEmplacement() ? "destroyed" : "collapsed"] : []),
                ...(state.gunnersKilled ? ["gunners killed"] : []),
                ...(state.gunnersStunned > 0 ? [`gunners stunned (${state.gunnersStunned})`] : []),
                ...(state.turretLocked ? ["turret locked"] : state.turretJammed ? ["turret jammed"] : []),
                ...(state.ammoExploded ? ["ammunition lost"] : []),
            ];
            if (parts.length) lines.push(`${building.getHexLabel() === "hex" ? "Hex" : "Hexside"} ${hex}: ${parts.join(", ")}.`);
        }
        return lines;
    }

    // One level of the structure map: a mapsheet-numbered hex grid, flattened as if seen at an angle.
    renderMapLevel(index: number, x: number, y: number, w: number, h: number): JSX.Element {
        const levels = this.building.getLevels();
        const r = 52;
        const k = (h - 20) / (7.5 * Math.sqrt(3) * r);
        const dy = Math.sqrt(3) * r * k;
        const left = x + 10 + r;
        const hexes: JSX.Element[] = [];
        for (let column = 1; column <= 9; column++) {
            for (let row = 1; row <= 7; row++) {
                const cx = left + (column - 1) * 1.5 * r;
                const cy = y + 10 + dy * (row - 0.5) + (column % 2 === 0 ? dy / 2 : 0);
                const points = (ox: number, oy: number) => Array.from({ length: 6 }, (_, p) => {
                    const angle = (Math.PI / 3) * p;
                    return `${(cx + ox + r * Math.cos(angle)).toFixed(1)},${(cy + oy + r * k * Math.sin(angle)).toFixed(1)}`;
                }).join(" ");
                const label = `${String(column).padStart(2, "0")}${String(row).padStart(2, "0")}`;
                hexes.push(
                    <g key={label}>
                        <polygon points={points(5, 5)} fill="rgb(150,150,150)" />
                        <polygon points={points(0, 0)} fill="white" stroke={INK} strokeWidth={2} />
                        {text(cx, cy + 7, label, { size: 19, anchor: "middle", italic: true })}
                    </g>,
                );
            }
        }
        const last = index === MAP_LEVELS - 1 && levels > MAP_LEVELS;
        const level = index < levels ? (last ? `${index + 1}-${levels}` : `${index + 1}`) : "";
        return (
            <g key={index} data-testid="building-map-level">
                {hexes}
                {text(x + w - 60, y + h / 2 + 10, "Level:", { size: 22, weight: 700, anchor: "middle" })}
                {level ? text(x + w - 60, y + h / 2 + 42, level, { size: 24, anchor: "middle" }) : blank(x + w - 95, y + h / 2 + 42, 70)}
            </g>
        );
    }

    renderFirstPage(): JSX.Element {
        const building = this.building;
        const classification = building.getClassification();
        const type = building.getType();
        const generator = building.getGenerator();
        const clan = building.getTechBase() === "clan";
        const doors = building.getDoors();
        const modifications = [
            ...(building.getSubsurface() !== "none" ? [`${building.getSubsurface() === "underwater" ? "Underwater" : "Underground"}, depth ${building.getDepth()}`] : []),
            ...(building.isTunnel() ? ["Tunnel"] : []),
            ...(building.isSealed() ? [`Environmental sealing (breach roll ${signed(building.getBreachModifier())})`] : []),
            ...(building.isOpenSpace() ? ["Open-space construction"] : []),
            ...(building.hasHeavyMetalSuperstructure() ? ["Heavy metal superstructure"] : []),
            ...(building.getCeilings() !== "standard" ? [`${building.getCeilings() === "high" ? "High" : "Low"} ceilings`] : []),
            ...(doors.length > 0 ? [`${doors.length} large ${doors.length === 1 ? "door" : "doors"} (${doors.map((height) => `${height} ${height === 1 ? "level" : "levels"}`).join(", ")})`] : []),
            ...building.getElevators().map((elevator) => `Industrial elevator in hex ${elevator.hex}: ${elevator.capacity} tons, ${elevator.levels} ${elevator.levels === 1 ? "level" : "levels"}`),
            ...(building.getLiquidStorage() > 0 ? [`Liquid storage for ${building.getLiquidCapacity()} tons`] : []),
        ];
        const lines = buildingWeaponLines(building, this.showDamage);
        const hexes = Array.from({ length: Math.min(building.getHexes(), BUILDING_HEXES_PER_PAGE) }, (_, i) => i + 1);
        const conditions = this.conditionLines(Array.from({ length: building.getHexes() }, (_, i) => i + 1));
        const field = (fx: number, fy: number, label: string, value: React.ReactNode, key: string, size = 21) => (
            <g key={key}>
                {text(fx, fy, label, { size: 21, weight: 700 })}
                {text(fx + label.length * 11.5 + 8, fy, value, { size })}
            </g>
        );

        const dataY = TOP, dataH = 330;
        const invY = dataY + dataH + 20, invH = 900;
        const cfY = invY + invH + 20, crewH = 150;
        const cfH = BOTTOM - crewH - 20 - cfY;
        const crewY = cfY + cfH + 20;
        const mapH = 1450;
        const rulesY = TOP + mapH + 20;
        const critY = rulesY;
        const critW = 600;
        const ruleX = RIGHT_X + critW + 20, ruleW = RIGHT_W - critW - 20;
        const cf = building.getCF();
        const threshold = Math.ceil(cf / 10);
        const critEffects: Record<string, string> = {
            "No Critical Hit": "No effect",
            "Weapon Malfunction": "A weapon jams until the gunners spend a Weapon Attack Phase clearing it",
            "Gunners Stunned": "The hex takes no actions next turn",
            "Weapon Destroyed": "A weapon is destroyed (1D6: 1-3 owner picks, 4-6 attacker)",
            "Gunners Killed": "No weapons fire from the hex for the rest of the scenario",
            "Turret Jammed (1-3) / Turret Locked (4-6)": "1D6 1-3 jammed until fixed (a second jam locks it); 4-6 locked",
            "Ammunition": "All the hex's ammunition explodes (CASE: 1/10 damage)",
            "Other": "One other item in the hex, at random, stops working",
        };

        return (
            <>
                {groupBox(X, dataY, LEFT_W, dataH, "STRUCTURE DATA", (
                    <>
                        {field(X + 20, dataY + 75, "Description:", building.getDisplayName(), "name", building.getDisplayName().length > 34 ? 17 : 21)}
                        {field(X + 20, dataY + 108, "Structure:", `${classification.name}${type.tag === "none" ? "" : `, ${type.name}`}`, "class")}
                        {field(X + 620, dataY + 108, "Levels:", building.getLevels(), "levels")}
                        {field(X + 20, dataY + 141, "Movement Type:", "Static", "move")}
                        {field(X + 330, dataY + 141, "MP:", "0", "mp")}
                        {text(X + 620, dataY + 141, "Tech Base:", { size: 21, weight: 700 })}
                        {field(X + 20, dataY + 174, "Powerplant Type:", generator ? `${generator.name} generator` : "None (local grid)", "power")}
                        {text(X + 660, dataY + 174, "Inner Sphere", { size: 20 })}{checkbox(X + 870, dataY + 174)}
                        {!clan ? text(X + 882, dataY + 172, "X", { size: 22, weight: 700, anchor: "middle" }) : null}
                        {text(X + 660, dataY + 207, "Clan", { size: 20 })}{checkbox(X + 870, dataY + 207)}
                        {clan ? text(X + 882, dataY + 205, "X", { size: 22, weight: 700, anchor: "middle" }) : null}
                        {field(X + 20, dataY + 207, "Size:", `${building.getHexes()} ${building.getHexLabel(building.getHexes() !== 1)}`, "size")}
                        {field(X + 250, dataY + 207, "CF:", `${cf}${building.isCapitalScale() ? " (capital)" : ""}`, "cf")}
                        {field(X + 20, dataY + 240, "Armor:", building.getArmorPoints() > 0 ? `${building.getArmorPoints()} a ${building.getHexLabel()}` : "None", "armor")}
                        {field(X + 330, dataY + 240, "Heat Sinks:", building.getHeatSinks() > 0 ? `${building.getHeatSinks()} ${building.getHeatSinkType().name}` : "0", "hs")}
                        {wrapText(modifications.length ? `Fittings: ${modifications.join("; ")}.` : `Damage scaling: ${building.getDamageScalingText()}`, 88).slice(0, 2)
                            .map((line, i) => text(X + 20, dataY + 273 + i * 24, line, { size: 18 }, `m${i}`))}
                    </>
                ))}

                {groupBox(X, invY, LEFT_W, invH, "WEAPONS & EQUIPMENT INVENTORY", (
                    <>
                        {this.renderWeaponRows(lines, X, LEFT_W, invY + 75, 29, WEAPONS_PER_PAGE)}
                        {lines.length > WEAPONS_PER_PAGE ? text(X + LEFT_W - 20, invY + invH - 75, `${lines.length - WEAPONS_PER_PAGE} more on the next page`, { size: 16, weight: 700, anchor: "end" }) : null}
                        {wrapText(`T: in the hex's rooftop turret; anything else fires in an arc set when the building is placed. A: automated, Gunnery 5.${building.getLightWeapons().length ? " P: on a pintle." : ""}${building.getCapitalWeapons().length ? " -C: capital scale, fired upward only (TO:AUE p.83)." : ""}`, 100).slice(0, 2)
                            .map((line, i) => text(X + 20, invY + invH - 52 + i * 20, line, { size: 15, fill: GRAY }, `l${i}`))}
                        {text(X + 20, invY + invH - 12, "Cost:", { size: 21, weight: 700 })}
                        {text(X + 85, invY + invH - 12, `${building.getCBillCost().toLocaleString("en-US")} C-bills`, { size: 21 })}
                        {text(X + 560, invY + invH - 12, "BV:", { size: 21, weight: 700 })}
                        {blank(X + 605, invY + invH - 12, 250)}
                    </>
                ))}

                {groupBox(X, cfY, LEFT_W, cfH, "CF & ARMOR", (
                    <>
                        {this.renderHexColumns(hexes, X, cfY + 72, LEFT_W, 2, 20, (cfH - 150) / 20)}
                        {building.getHexes() > BUILDING_HEXES_PER_PAGE ? text(X + LEFT_W - 20, cfY + cfH - 50, `${building.getHexLabel(true)} ${BUILDING_HEXES_PER_PAGE + 1}-${building.getHexes()} on the next page`, { size: 16, weight: 700, anchor: "end" }) : null}
                        {(conditions.length ? conditions : ["Map: the mapsheet hex it stands in. Entering: MP and Piloting/Driving Skill Roll for a unit moving in (TO:AR p.117)."])
                            .flatMap((line) => wrapText(line, 100)).slice(0, 2)
                            .map((line, i) => text(X + 20, cfY + cfH - 34 + i * 20, line, { size: 15, weight: conditions.length ? 700 : 400, fill: conditions.length ? INK : GRAY }, `c${i}`))}
                    </>
                ))}

                {groupBox(X, crewY, LEFT_W, crewH, "CREW DATA", (
                    <>
                        {field(X + 20, crewY + 78, "Crew:", `${building.getMinimumGunners()} ${building.getMinimumGunners() === 1 ? "gunner" : "gunners"}, ${building.getMinimumOfficers()} ${building.getMinimumOfficers() === 1 ? "officer" : "officers"}${building.getMinimumNonGunners() > 0 ? `, ${building.getMinimumNonGunners()} other` : ""}`, "crew")}
                        {text(X + 20, crewY + 116, "Gunnery Skill:", { size: 21, weight: 700 })}
                        {building.getMinimumGunners() > 0 || lines.length > 0 ? text(X + 180, crewY + 116, building.getGunnery(), { size: 21 }) : blank(X + 180, crewY + 116, 60)}
                    </>
                ))}

                {groupBox(RIGHT_X, TOP, RIGHT_W, mapH, "STRUCTURE MAP", (
                    <>
                        {Array.from({ length: MAP_LEVELS }, (_, i) => this.renderMapLevel(i, RIGHT_X + 10, TOP + 60 + i * ((mapH - 80) / MAP_LEVELS), RIGHT_W - 20, (mapH - 80) / MAP_LEVELS - 12))}
                    </>
                ))}

                {groupBox(RIGHT_X, critY, critW, BOTTOM - critY, "BUILDING CRITICAL HITS", (
                    <>
                        {text(RIGHT_X + 20, critY + 72, "2D6", { size: 18, weight: 700 })}
                        {text(RIGHT_X + 80, critY + 72, "EFFECT", { size: 18, weight: 700 })}
                        {BUILDING_CRITICAL_HITS.map((row, r) => {
                            const ry = critY + 84 + r * 84;
                            const name = row.name.startsWith("Turret") ? "Turret" : row.name;
                            return (
                                <g key={row.name}>
                                    {r % 2 === 0 ? <rect x={RIGHT_X + 12} y={ry} width={critW - 24} height={84} fill={SHADE} /> : null}
                                    {text(RIGHT_X + 20, ry + 28, row.min === row.max ? row.min : `${row.min}-${row.max}`, { size: 19, weight: 700 })}
                                    {text(RIGHT_X + 80, ry + 28, name, { size: 19, weight: 700 })}
                                    {wrapText(critEffects[row.name] ?? "", 52).slice(0, 2).map((line, i) => text(RIGHT_X + 80, ry + 52 + i * 21, line, { size: 16 }, `e${i}`))}
                                </g>
                            );
                        })}
                        {wrapText("Roll when one attack does more than the hex's Damage Threshold; an aimed shot adds 2. A result with nothing in the hex to affect is no critical hit (TO:AR pp.118-119).", 66)
                            .map((line, i) => text(RIGHT_X + 20, critY + 84 + 8 * 84 + 26 + i * 20, line, { size: 15, fill: GRAY }, `f${i}`))}
                    </>
                ))}

                {groupBox(ruleX, rulesY, ruleW, BOTTOM - rulesY, "STRUCTURE RULES", (
                    <>
                        {[
                            ["Damage Threshold", `${threshold}`, "Current CF / 10, round up, at the start of the turn (TO:AR p.118)."],
                            ["Attacks on units inside", `-${threshold}`, "The building absorbs current CF / 10, round up, from each attack (TW p.171)."],
                            ["Unit fails to enter", building.getHexMPCost(1) === null ? "No entry" : `${building.getUnitEntryDamage(1)}`, "Damage to a unit that fails its roll entering a hex (TO:AR p.117)."],
                            ["Firing through a hex", signed(building.getHexToHitModifier(1)), "To-hit modifier for the equipment inside; see each hex (TO:AR p.117)."],
                            ["Damage scaling", "", `${building.getDamageScalingText()} (TO:AR p.124).`],
                        ].map(([label, value, note], i) => {
                            const ry = rulesY + 80 + i * 150;
                            return (
                                <g key={label}>
                                    {text(ruleX + 20, ry, label, { size: 20, weight: 700 })}
                                    {text(ruleX + ruleW - 20, ry, value, { size: value.length > 12 ? 15 : 24, weight: 700, anchor: "end" })}
                                    {wrapText(note, 40).slice(0, 3).map((line, l) => text(ruleX + 20, ry + 26 + l * 21, line, { size: 16, fill: GRAY }, `n${l}`))}
                                </g>
                            );
                        })}
                    </>
                ))}
            </>
        );
    }

    renderContinuation(page: number): JSX.Element {
        const building = this.building;
        const lines = buildingWeaponLines(building, this.showDamage).slice(WEAPONS_PER_PAGE + (page - 1) * WEAPONS_PER_CONTINUATION, WEAPONS_PER_PAGE + page * WEAPONS_PER_CONTINUATION);
        const first = BUILDING_HEXES_PER_PAGE + (page - 1) * HEXES_PER_CONTINUATION + 1;
        const hexes = Array.from({ length: Math.max(0, Math.min(building.getHexes(), first + HEXES_PER_CONTINUATION - 1) - first + 1) }, (_, i) => first + i);
        const W = DOC_WIDTH - 2 * X;
        const invH = lines.length ? 130 + lines.length * 29 : 0;
        const cfY = TOP + (invH ? invH + 20 : 0);
        const rows = Math.ceil(hexes.length / 4);
        return (
            <>
                {lines.length ? groupBox(X, TOP, W, invH, "WEAPONS & EQUIPMENT INVENTORY (CONTINUED)", this.renderWeaponRows(lines, X, W, TOP + 75, 29, lines.length)) : null}
                {hexes.length ? groupBox(X, cfY, W, 110 + rows * 40, "CF & ARMOR (CONTINUED)", this.renderHexColumns(hexes, X, cfY + 72, W, 4, rows, 40)) : null}
            </>
        );
    }

    render = (): JSX.Element => {
        const page = this.props.page ?? 0;
        return (
            <svg
                version="1.1"
                viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`}
                xmlns="http://www.w3.org/2000/svg"
                data-testid="building-record-sheet-svg"
            >
                <rect x={0} y={0} width={DOC_WIDTH} height={DOC_HEIGHT} fill="white" />
                {titleBanner(X, DOC_WIDTH - 2 * X, page === 0 ? "STRUCTURE RECORD SHEET" : `STRUCTURE RECORD SHEET (CONTINUED): ${this.building.getDisplayName()}`)}
                {page === 0 ? this.renderFirstPage() : this.renderContinuation(page)}
                {sheetFooter("Tables: TW p.171; TO:AR pp.117-119, 124.")}
            </svg>
        );
    }
}

interface IBuildingRecordSheetSVGProps {
    building: Building;
    /** 0 for the sheet, 1 and on for continuation pages. */
    page?: number;
    /** Write in the Construction Factor and armor left, and what critical hits have done. */
    showDamage?: boolean;
}
