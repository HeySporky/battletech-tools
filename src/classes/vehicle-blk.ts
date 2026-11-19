import { SUPPORT_VEHICLE_TECH_RATINGS } from "../data/support-vehicle-construction";
import { blkLines, blkValue, IBlkFile, parseBlkFile } from "../utils/blk-file";
import { IBlkAmmoLine, findBlkAmmo, findBlkAmmoWeapon, parseBlkAmmoLine } from "../utils/blk-ammo";
import { findImportedEquipment } from "../utils/importedEquipment";
import { infantryWeapons } from "../data/infantry-weapons";
import type { IVehicleArmorAllocation } from "../data/data-interfaces";
import { applyBlkQuirks, IBlkImportedItem } from "../utils/blk-quirks";
import { readBlkTechnicalReadout } from "../utils/blk-technical-readout";
import { getBlkFireControlSuffix, getBlkFittedTag } from "../utils/blk-fire-control";
import Vehicle from "./vehicle";
import AerospaceFighter, { FighterArc, FighterLocation } from "./aerospace-fighter";

// Reads a MegaMek ground, naval, rail or VTOL Support Vehicle ".blk" file into a Vehicle. Equipment is matched
// through the catalog's own import names (altNames and altTags) and the small tables below; anything with no
// match is left off and reported, so the importer never guesses.

/** MegaMek's Engine type codes (reference: MegaMek Engine.java), as this builder's Support Vehicle engines. */
const ENGINES: Record<string, string> = {
    // Support Vehicle files save a fuel cell as 6: the Boreas (code 6) burns hydrogen, fuel type H (AToW Companion p.194).
    "0": "ice", "1": "fusion", "4": "fuel-cell", "6": "fuel-cell", "7": "fission", "8": "none", "9": "maglev", "10": "steam",
    "11": "battery", "12": "solar", "13": "external",
};

const MOTIVES: Record<string, string> = {
    wheeled: "wheeled", tracked: "tracked", hover: "hover", vtol: "vtol", wige: "wige", naval: "naval-surface",
    hydrofoil: "hydrofoil", submarine: "naval-sub", rail: "rail", maglev: "rail",
};

/** Body items that are chassis modifications (TM pp.122-124, TO:AUE). */
const CHASSIS_MODS: Record<string, string> = {
    armoredchassis: "armored", isoffroadchassis: "off-road", svchassismodtractor: "tractor", svchassismodtrailer: "trailer",
    omnichassismod: "omni", amphibiouschassis: "amphibious", stolchassismod: "stol", bicyclechassismod: "bicycle",
    ultralightchassismod: "ultra-light", submersiblechassismod: "submersible", convertiblechassismod: "convertible",
    propchassismod: "prop", monocyclechassismod: "monocycle", vstolchassismod: "vstol", hydrofoilchassismod: "hydrofoil",
    issvdunebuggychassis: "dune-buggy", snowmobilechassis: "snowmobile", environmentalsealing: "environmental-sealing",
    externalpowerpickup: "external-power-pickup",
};

const FIRE_CONTROL: Record<string, string> = { basicfirecontrol: "basic", advancedfirecontrol: "advanced" };
/** Every line of every equipment block. */
const allEquipmentLines = (file: IBlkFile): string[] => Object.keys(file.blocks).filter((tag) => tag.endsWith(" equipment")).flatMap((tag) => file.blocks[tag]);

/** Lines that only mark a mount and carry no equipment of their own. */
const MARKERS = new Set(["pintleturret", "sponsonturret"]);

/** Seats and quarters: catalog tag, and tons of one (quarters are listed by weight). */
const SEATING: Record<string, { tag: string; tons?: number }> = {
    standardseats: { tag: "seating-standard" }, pillionseats: { tag: "seating-pillion" },
    ejectionseats: { tag: "support-vehicle-ejection-seat" },
    "1stclassquarters": { tag: "quarters-officer", tons: 10 }, "2ndclassquarters": { tag: "quarters-crew", tons: 7 },
    crewquarters: { tag: "quarters-crew", tons: 7 }, steeragequarters: { tag: "quarters-steerage", tons: 5 },
};

const CARGO_BAYS: Record<string, string> = {
    cargobay: "cargo", liquidcargobay: "cargo-liquid", refrigeratedcargobay: "cargo-refrigerated",
    insulatedcargobay: "cargo-insulated", livestockcargobay: "cargo-livestock",
};

// The file's locations, by unit type, as this builder's; armor is listed in the same order.
const TANK = [["front", "front"], ["right", "right"], ["left", "left"], ["rear", "rear"], ["turret", "turret"], ["rear turret", "turret"], ["front turret", "turret2"]];
const LARGE = [["front", "front"], ["front right", "frontRight"], ["front left", "frontLeft"], ["rear right", "rearRight"], ["rear left", "rearLeft"], ["rear", "rear"], ["turret", "turret"], ["rear turret", "turret"], ["front turret", "turret2"]];
const VTOL = [["front", "front"], ["right", "right"], ["left", "left"], ["rear", "rear"], ["rotor", "rotor"], ["turret", "turret"]];
const ARMOR_ORDER: Record<string, string[]> = {
    supporttank: ["front", "right", "left", "rear", "turret", "turret2"],
    largesupporttank: ["front", "frontRight", "frontLeft", "rearRight", "rearLeft", "rear", "turret", "turret2"],
    supportvtol: ["front", "right", "left", "rear", "rotor", "turret"],
};

// MegaMek's location abbreviations in a weapon quirk line; one not listed here is matched by the weapon's name alone.
const BLK_VEHICLE_LOCATIONS: Record<string, string> = { FR: "front", RS: "right", LS: "left", RR: "rear", TU: "turret", RO: "rotor" };
const BLK_FIXED_WING_LOCATIONS: Record<string, string> = { NOS: "nose", LWG: "leftWing", RWG: "rightWing", AFT: "aft" };

const key = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const numberOf = (file: IBlkFile, tag: string, fallback: number = 0): number => {
    const value = Number(blkValue(file, tag));
    return blkValue(file, tag).trim() !== "" && Number.isFinite(value) ? value : fallback;
};

/**
 * Reads a vehicle file's equipment, ammunition and transports into the vehicle: each block of the layout into its
 * location, the body unallocated. `skip` passes over lines the importer reads itself (chassis modifications, markers);
 * `mounted` sets what a line's mount suffix says about an item once it is placed.
 */
const readVehicleEquipment = (file: IBlkFile, vehicle: Vehicle, layout: string[][], faction: "is" | "clan", mixed: boolean, issues: string[],
    skip: (lineKey: string) => boolean, mounted: (added: { uuid?: string }, line: string) => void): IBlkImportedItem[] => {
    const pendingAmmo: { line: string; ammo: IBlkAmmoLine }[] = [];
    const placed: IBlkImportedItem[] = [];
    const blocks: [string, string | undefined][] = [["body", undefined], ...layout.map(([block, location]) => [block, location] as [string, string])];
    const lineName = (line: string): string => line.replace(/:.*$/, "").replace(/\((ST|R|Rear|PT)\)/gi, "").trim();
    for (const [block, location] of blocks) {
        // Fire control systems and capacitors, wherever the block lists them, go on a weapon of the block (blk-fire-control).
        const fireControl = blkLines(file, `${block} equipment`).map((line) => getBlkFireControlSuffix(lineName(line))).filter((suffix): suffix is string => !!suffix);
        // A Mast Mount opens the rotor to the items it holds, wherever the file lists it (TO:AUE p.162).
        const lines = blkLines(file, `${block} equipment`).sort((first, second) => Number(/mastmount/i.test(second)) - Number(/mastmount/i.test(first)));
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            const omniPod = /:OMNI/i.test(line);
            const name = lineName(line);
            const lineKey = key(name);
            if (skip(lineKey) || getBlkFireControlSuffix(name)) continue;
            // Primitive rounds are read as the standard ones.
            const ammoLine = parseBlkAmmoLine(name.replace(/\bprimitive\b/ig, ""));
            if (ammoLine) {
                pendingAmmo.push({ line, ammo: ammoLine });
                continue;
            }
            const match = findImportedEquipment(name, faction, mixed);
            // Light weapons on small Support Vehicles are infantry weapons, named as the infantry weapon list names them.
            const lightWeapon = match ? undefined : infantryWeapons.find((weapon) => weapon.name.toLowerCase() === name.toLowerCase());
            if (lightWeapon && location) {
                if (!vehicle.addLightWeapon(lightWeapon.tag, location, 0, /\((ST|PT)\)/i.test(line))) {
                    issues.push(`"${line}" could not be mounted as a light weapon and was left off.`);
                }
                continue;
            }
            if (!match) {
                issues.push(`"${line}" has no match in this catalog and was left off.`);
                continue;
            }
            const rear = /\((R|Rear)\)/i.test(line);
            const fits = fireControl.findIndex((suffix) => !!getBlkFittedTag(match.item.tag, suffix));
            const tag = fits >= 0 ? getBlkFittedTag(match.item.tag, fireControl.splice(fits, 1)[0])! : match.item.tag;
            const before = vehicle.getEquipmentList().length;
            vehicle.addEquipmentFromTag(tag, location, rear, undefined, mixed);
            const added = vehicle.getEquipmentList()[before];
            if (!added) {
                issues.push(`"${line}" could not be mounted and was left off.`);
                continue;
            }
            if (location && added.location !== location) issues.push(`"${line}" cannot go in the ${location} and was mounted unplaced.`);
            if (added.uuid) placed.push({ name, location: location ?? "", uuid: added.uuid });
            if (omniPod) vehicle.setPodMounted(added.uuid, true);
            // Artillery prices by its maker, not its carrier: an "IS" piece on a Clan unit is worth the IS BV.
            const maker = /^IS/.test(name) ? "is" : /^CL/.test(name) ? "clan" : undefined;
            if (maker && added.battleValueClan !== undefined && maker !== faction) vehicle.setBuiltTechBase(added.uuid ?? "", maker);
            mounted(added, line);
        }
        if (fireControl.length > 0) issues.push(`${fireControl.length} fire control system or capacitor line(s) in the ${block} had no weapon to fit and were left off.`);
    }
    // Ammunition goes with a mounted weapon of the name it gives.
    for (const ammo of pendingAmmo) {
        const weapon = findBlkAmmoWeapon(ammo.ammo, vehicle.getEquipmentList());
        const round = weapon ? findBlkAmmo(ammo.ammo, weapon) : undefined;
        const before = vehicle.getEquipmentList().length;
        if (round) vehicle.addEquipmentFromTag(round.tag, undefined, false, undefined, true);
        const added = vehicle.getEquipmentList()[before];
        if (!added) {
            issues.push(`Ammunition "${ammo.line}" has no weapon or no match in this catalog and was left off.`);
            continue;
        }
        if (weapon) vehicle.setAmmoBinWeapon(added.uuid ?? "", weapon.tag);
        if (ammo.ammo.half) vehicle.setHalfTonBin(added.uuid ?? "", true);
    }

    // Seats, quarters, cargo and troop space.
    for (const line of blkLines(file, "transporters")) {
        const parts = line.split(":");
        const kind = parts[0].toLowerCase().trim();
        const size = Number(parts[1]);
        const doors = Number(parts[2]) || 0;
        if (!Number.isFinite(size) || size <= 0) continue;
        const seating = SEATING[kind];
        if (seating) {
            const count = Math.round(seating.tons ? size / seating.tons : size);
            for (let index = 0; index < count; index++) vehicle.addEquipmentFromTag(seating.tag, undefined, false, undefined, true);
        } else if (CARGO_BAYS[kind]) {
            if (vehicle.addBay(CARGO_BAYS[kind])) vehicle.setBay(vehicle.getBays().length - 1, size, doors);
        } else if (kind === "troopspace") {
            vehicle.setTroopSpace(size);
        } else {
            issues.push(`Transport "${kind}" is not one this builder has and was left off.`);
        }
    }
    return placed;
};

export interface ISupportVehicleBlkResult {
    vehicle: Vehicle | null;
    /** What could not be carried over. */
    issues: string[];
    /** What was carried over in a different form. */
    notes: string[];
}

export const importSupportVehicleBlk = (text: string): ISupportVehicleBlkResult => {
    const file = parseBlkFile(text);
    if (!file) return { vehicle: null, issues: ["This is not a MegaMek unit file."], notes: [] };
    const unitType = key(blkValue(file, "UnitType"));
    const layout = unitType === "supporttank" ? TANK : unitType === "largesupporttank" ? LARGE : unitType === "supportvtol" ? VTOL : null;
    if (!layout) return { vehicle: null, issues: [`This file holds a ${blkValue(file, "UnitType") || "unit of an unknown type"}, not a ground or VTOL Support Vehicle.`], notes: [] };
    const issues: string[] = [];
    const notes: string[] = [];
    const vehicle = new Vehicle();
    vehicle.setSupportVehicle(true);
    vehicle.setName(blkValue(file, "Name"));
    vehicle.setModel(blkValue(file, "Model"));

    const type = blkValue(file, "type").toLowerCase();
    const clan = type.startsWith("clan") || type.includes("clan chassis");
    const mixed = type.includes("mixed");
    vehicle.setTech(mixed ? (clan ? "mclan" : "mis") : clan ? "clan" : "is");
    const faction = clan ? "clan" : "is";

    const motion = key(blkValue(file, "motion_type"));
    const motive = unitType === "supportvtol" ? "vtol" : MOTIVES[motion];
    if (!motive) issues.push(`Motive type "${blkValue(file, "motion_type")}" is not one this builder has; wheeled used.`);
    vehicle.setMotiveType(motive ?? "wheeled");
    const year = numberOf(file, "year");
    if (year > 0) {
        const era = vehicle.getAvailableEras().find((item) => item.yearStart <= year && (item.yearEnd ?? Infinity) >= year);
        if (era) vehicle.setEra(era.tag);
    }
    const tons = numberOf(file, "tonnage");
    vehicle.setTonnage(tons);
    if (vehicle.getTonnage() !== tons) issues.push(`The file's weight of ${tons} tons is outside the rules for this motive type; ${vehicle.getTonnage()} tons used.`);

    const rating = (tag: string): string | null => SUPPORT_VEHICLE_TECH_RATINGS[numberOf(file, tag, -1)] ?? null;
    for (const [part, tag] of [["structural", "structural_tech_rating"], ["engine", "engine_tech_rating"], ["armor", "armor_tech_rating"]] as const) {
        const value = rating(tag);
        if (value) vehicle.setSupportVehicleTechRating(part, value);
        else issues.push(`The file gives no ${part} tech rating; the builder's default used.`);
    }
    const engine = ENGINES[blkValue(file, "engine_type")];
    if (engine) vehicle.setSupportVehicleEngine(engine);
    else issues.push(`Engine type ${blkValue(file, "engine_type") || "(none given)"} is not one this builder has; the default used.`);

    // Chassis modifications come from the body, fire control from any block; set them before movement and equipment.
    const bodyLines = blkLines(file, "body equipment");
    for (const line of bodyLines) {
        const mod = CHASSIS_MODS[key(line.replace(/:.*$/, ""))];
        if (mod) vehicle.setSupportVehicleChassisModification(mod, true);
    }
    const fireControl = allEquipmentLines(file).map((line) => FIRE_CONTROL[key(line)]).find(Boolean);
    if (fireControl) vehicle.setSupportVehicleFireControl(fireControl);
    if (bodyLines.some((line) => key(line) === "omnichassismod")) vehicle.setOmni(true);
    const cruise = numberOf(file, "cruiseMP");
    vehicle.setCruiseMP(cruise);
    if (vehicle.getCruiseMP() !== cruise) issues.push(`Cruise MP ${cruise} is outside the rules; ${vehicle.getCruiseMP()} used.`);
    const bar = numberOf(file, "barrating", 0);
    vehicle.setBAR(bar > 0 ? bar : 10);
    const armorType = blkValue(file, "armor_type");
    if (armorType && !(Number(armorType) >= 43 && Number(armorType) <= 51) && armorType !== "0") {
        issues.push(`Armor type ${armorType} is not Support Vehicle armor; BAR ${vehicle.getBAR()} armor used.`);
    }

    // Turrets: any equipment or armor in one.
    const armor = blkLines(file, "armor").map((line) => Number(line)).filter((value) => Number.isFinite(value));
    const order = ARMOR_ORDER[unitType];
    const hasLines = (block: string) => blkLines(file, `${block} equipment`).some((line) => line.trim() !== "");
    const frontTurret = hasLines("front turret") || (armor[order.indexOf("turret2")] ?? 0) > 0;
    const turret = frontTurret || hasLines("turret") || hasLines("rear turret") || (armor[order.indexOf("turret")] ?? 0) > 0;
    vehicle.setHasTurret(turret);
    if (frontTurret) vehicle.setDualTurret(true);
    order.forEach((location, index) => {
        if (armor[index] !== undefined && vehicle.getLocations().some((entry) => entry.tag === location)) {
            vehicle.setArmorAllocation(location as never, armor[index]);
        }
    });

    const placed = readVehicleEquipment(file, vehicle, layout, faction, mixed, issues,
        (lineKey) => MARKERS.has(lineKey) || !!CHASSIS_MODS[lineKey] || !!FIRE_CONTROL[lineKey], (added, line) => { if (/\((ST|PT)\)/i.test(line)) vehicle.setPintle(added.uuid ?? "", true); });
    const fuel = numberOf(file, "fuel", -1);
    if (fuel >= 0) vehicle.setSupportVehicleFuel(fuel);
    applyBlkQuirks(file, vehicle, placed, issues, (abbr) => BLK_VEHICLE_LOCATIONS[abbr.toUpperCase()]);
    vehicle.tro.import(readBlkTechnicalReadout(file));
    return { vehicle, issues, notes };
};

/** MegaMek's Combat Vehicle engine codes (Engine.java), as this builder's engine types; Clan versions where they differ. */
const COMBAT_ENGINES: Record<string, { is: string; clan?: string }> = {
    "0": { is: "ice" }, "1": { is: "standard" }, "2": { is: "xl", clan: "clan_xl" }, "3": { is: "xxl", clan: "clan_xxl" },
    "4": { is: "cell" }, "5": { is: "light" }, "6": { is: "compact" }, "7": { is: "fission" },
};

/** MegaMek's armor codes (EquipmentType.T_ARMOR_*), as this builder's armor types. */
const COMBAT_ARMOR: Record<string, string> = {
    "0": "standard", "1": "ferro-fibrous", "2": "reactive", "3": "laser-reflective", "4": "hardened", "5": "light-ferro-fibrous",
    "6": "heavy-ferro-fibrous", "9": "ferro-fibrous-prototype", "10": "commercial", "14": "industrial", "16": "ferro-lamellor",
    "17": "primitive", "22": "vehicular-stealth", "23": "anti-penetrative-ablation", "24": "heat-dissipating", "25": "impact-resistant",
    "26": "ballistic-reinforced", "27": "ferro-aluminum",
};
/** MegaMek's Clan tech levels (TechConstants): an armor of one of these is the Clan version. */
const CLAN_TECH_LEVELS = new Set([2, 6, 8, 10, 12]);

/** Body items that are Combat Vehicle chassis modifications (TO:AUE pp.94, 114), without their IS/CL prefix. */
const COMBAT_CHASSIS_MODS: Record<string, string> = {
    flotationhull: "flotation-hull", limitedamphibiouschassis: "limited-amphibious", fullyamphibiouschassis: "fully-amphibious",
    dunebuggychassis: "dune-buggy", environmentalsealedchassis: "environmental-sealing", armoredmotivesystem: "armored-motive",
};
const VEHICLE_JUMP_JET = "vehiclejumpjet";
const SPONSON_TURRET = "sponsonturret";
const withoutTechPrefix = (lineKey: string): string => lineKey.replace(/^(is|cl)(?=[a-z])/, "");

export interface IVehicleBlkResult {
    vehicle: Vehicle | null;
    /** What could not be carried over. */
    issues: string[];
}

/** Reads a MegaMek Combat Vehicle ".blk" file (a tank, VTOL or naval vessel, superheavy ones too) into a Vehicle. */
export const importVehicleBlk = (text: string): IVehicleBlkResult => {
    const file = parseBlkFile(text);
    if (!file) return { vehicle: null, issues: ["This is not a MegaMek unit file."] };
    const unitType = key(blkValue(file, "UnitType"));
    if (unitType !== "tank" && unitType !== "vtol") {
        return { vehicle: null, issues: [`This file holds a ${blkValue(file, "UnitType") || "unit of an unknown type"}, not a Combat Vehicle.`] };
    }
    const issues: string[] = [];
    const vehicle = new Vehicle();
    vehicle.setName(blkValue(file, "Name"));
    vehicle.setModel(blkValue(file, "Model"));
    const type = blkValue(file, "type").toLowerCase();
    const clan = type.startsWith("clan") || type.includes("clan chassis");
    const mixed = type.includes("mixed");
    vehicle.setTech(mixed ? (clan ? "mclan" : "mis") : clan ? "clan" : "is");
    const faction = clan ? "clan" : "is";

    const motive = unitType === "vtol" ? "vtol" : MOTIVES[key(blkValue(file, "motion_type"))];
    if (!motive) return { vehicle: null, issues: [`Motive type "${blkValue(file, "motion_type")}" is not one this builder has.`] };
    vehicle.setMotiveType(motive);
    const year = numberOf(file, "year");
    if (year > 0) {
        const era = vehicle.getAvailableEras().find((item) => item.yearStart <= year && (item.yearEnd ?? Infinity) >= year);
        if (era) vehicle.setEra(era.tag);
    }
    const tons = numberOf(file, "tonnage");
    vehicle.setTonnage(tons);
    if (vehicle.getTonnage() !== tons) issues.push(`The file's weight of ${tons} tons is outside the rules for this motive type; ${vehicle.getTonnage()} tons used.`);

    // A Mixed Tech file says which engine it has; otherwise the chassis's tech base decides (BLKTankFile).
    const clanEngine = blkValue(file, "clan_engine") ? blkValue(file, "clan_engine").toLowerCase() === "true" : clan;
    const engine = COMBAT_ENGINES[blkValue(file, "engine_type") || "1"];
    if (engine) vehicle.setEngineType(clanEngine ? engine.clan ?? engine.is : engine.is);
    if (!engine || vehicle.getEngineType().tag !== (clanEngine ? engine.clan ?? engine.is : engine.is)) {
        issues.push(`Engine type ${blkValue(file, "engine_type")} is not one this builder has.`);
    }

    const bodyKeys = blkLines(file, "body equipment").map((line) => withoutTechPrefix(key(line.replace(/:.*$/, ""))));
    for (const lineKey of bodyKeys) {
        if (COMBAT_CHASSIS_MODS[lineKey]) {
            vehicle.setChassisModification(COMBAT_CHASSIS_MODS[lineKey], true, 4);
            if (!vehicle.hasChassisModification(COMBAT_CHASSIS_MODS[lineKey] as never)) issues.push(`Chassis modification "${lineKey}" does not fit this vehicle.`);
        }
    }
    if (blkValue(file, "omni")) vehicle.setOmni(true);
    const cruise = numberOf(file, "cruiseMP");
    vehicle.setCruiseMP(cruise);
    if (vehicle.getCruiseMP() !== cruise) issues.push(`Cruise MP ${cruise} is outside the rules; ${vehicle.getCruiseMP()} used.`);
    if (+blkValue(file, "internal_type") > 0) issues.push(`Structure type ${blkValue(file, "internal_type")} is not one this builder has.`);

    const armorCode = blkValue(file, "armor_type") || "0";
    const armorType = COMBAT_ARMOR[armorCode];
    if (armorType) vehicle.setArmorType(armorType);
    if (!armorType || vehicle.getArmorType().tag !== armorType) issues.push(`Armor type ${armorCode} is not one this builder has for this vehicle.`);
    const armorLevel = blkValue(file, "armor_tech_level");
    if (armorLevel) vehicle.setArmorTechBase(CLAN_TECH_LEVELS.has(+armorLevel) ? "clan" : "is");

    // The armor list's length says which turrets there are (BLKTankFile): four or six facings, then a turret, then a second.
    const armor = blkLines(file, "armor").map((line) => Number(line)).filter((value) => Number.isFinite(value));
    const superheavy = vehicle.isSuperheavy();
    const facings = unitType === "vtol" ? ["front", "right", "left", "rear", "rotor"] : superheavy ? ARMOR_ORDER.largesupporttank.slice(0, 6) : ARMOR_ORDER.supporttank.slice(0, 4);
    const turrets = armor.length - facings.length;
    vehicle.setHasTurret(turrets > 0);
    if (turrets > 1) vehicle.setDualTurret(true);
    const armorLocations = [...facings, "turret", "turret2"].slice(0, armor.length) as (keyof IVehicleArmorAllocation)[];
    armorLocations.forEach((location, index) => vehicle.setArmorAllocation(location, armor[index]));
    if (armorLocations.some((location, index) => (vehicle.getArmorAllocation()[location] ?? 0) !== armor[index])) {
        issues.push("The file's armor does not fit this vehicle's locations.");
    }

    // Each vehicular jump jet is a Jump MP; a sponson turret marker fits the pair, which "(ST)" weapons then go in.
    const equipmentKeys = Object.keys(file.blocks).filter((tag) => tag.endsWith(" equipment")).flatMap((tag) => file.blocks[tag]).map((line) => key(line.replace(/:.*$/, "")));
    const jets = equipmentKeys.filter((lineKey) => lineKey === VEHICLE_JUMP_JET).length;
    if (jets > 0) {
        vehicle.setJumpMP(jets);
        if (vehicle.getJumpMP() !== jets) issues.push(`${jets} vehicular jump jets do not fit this vehicle.`);
    }
    if (equipmentKeys.includes(SPONSON_TURRET)) vehicle.setSponsonTurrets(true);

    const layout = unitType === "vtol" ? VTOL : superheavy ? LARGE : TANK;
    const placed = readVehicleEquipment(file, vehicle, layout, faction, mixed, issues,
        // Read above, or no item of their own: Clan CASE is built into a Clan chassis (TM p.210), and the stealth line
        // marks Vehicular Stealth armor.
        (lineKey) => lineKey === VEHICLE_JUMP_JET || lineKey === SPONSON_TURRET || !!COMBAT_CHASSIS_MODS[withoutTechPrefix(lineKey)]
            || (lineKey === "clcase" && vehicle.hasCASE()) || (lineKey === "isvehicularstealth" && vehicle.getArmorType().tag === "vehicular-stealth"),
        (added, line) => {
            if (/\(ST\)/i.test(line) && !vehicle.setEquipmentSponson(added.uuid ?? "", true)) issues.push(`"${line}" could not go in a sponson turret.`);
            if (/\(PT\)/i.test(line)) vehicle.setPintle(added.uuid ?? "", true);
        });
    applyBlkQuirks(file, vehicle, placed, issues, (abbr) => BLK_VEHICLE_LOCATIONS[abbr.toUpperCase()]);
    vehicle.tro.import(readBlkTechnicalReadout(file));
    return { vehicle, issues };
};

export interface IFixedWingSupportBlkResult {
    fighter: AerospaceFighter | null;
    /** What could not be carried over. */
    issues: string[];
    /** What was carried over in a different form. */
    notes: string[];
}

/** The file's firing arcs, as this builder's; armor is listed nose, left wing, right wing, aft. */
const FIXED_WING_LOCATIONS: [string, FighterLocation][] = [
    ["nose", "nose"], ["left wing", "leftWing"], ["right wing", "rightWing"], ["aft", "aft"], ["wings", "fuselage"], ["body", "fuselage"],
];

/** Reads a MegaMek Fixed-Wing Support Vehicle ".blk" file into a support AerospaceFighter (TM pp.118-135). */
export const importFixedWingSupportBlk = (text: string): IFixedWingSupportBlkResult => {
    const file = parseBlkFile(text);
    if (!file) return { fighter: null, issues: ["This is not a MegaMek unit file."], notes: [] };
    if (key(blkValue(file, "UnitType")) !== "fixedwingsupport") {
        return { fighter: null, issues: [`This file holds a ${blkValue(file, "UnitType") || "unit of an unknown type"}, not a Fixed-Wing Support Vehicle.`], notes: [] };
    }
    const issues: string[] = [];
    const notes: string[] = [];
    const fighter = new AerospaceFighter();
    fighter.setFighterType("support");
    fighter.setSupportMotive("fixed-wing");
    fighter.setName(blkValue(file, "Name"));
    fighter.setModel(blkValue(file, "Model"));

    const type = blkValue(file, "type").toLowerCase();
    const clan = type.startsWith("clan") || type.includes("clan chassis");
    const mixed = type.includes("mixed");
    fighter.setTech(mixed ? (clan ? "mclan" : "mis") : clan ? "clan" : "is");
    const faction = clan ? "clan" : "is";
    const year = numberOf(file, "year");
    if (year > 0) {
        const era = fighter.getAvailableEras().find((item) => item.yearStart <= year && (item.yearEnd ?? Infinity) >= year);
        if (era) fighter.setEra(era.tag);
    }
    const tons = numberOf(file, "tonnage");
    fighter.setTonnage(tons);
    if (fighter.getTonnage() !== tons) issues.push(`The file's weight of ${tons} tons is outside the rules for a Fixed-Wing Support Vehicle; ${fighter.getTonnage()} tons used.`);

    const rating = (tag: string): string | null => SUPPORT_VEHICLE_TECH_RATINGS[numberOf(file, tag, -1)] ?? null;
    for (const [part, tag] of [["structural", "structural_tech_rating"], ["engine", "engine_tech_rating"], ["armor", "armor_tech_rating"]] as const) {
        const value = rating(tag);
        if (value) fighter.setSupportTechRating(part, value);
        else issues.push(`The file gives no ${part} tech rating; the builder's default used.`);
    }
    // Chassis modifications come from the body, fire control from any block; set them before the engine and thrust.
    const bodyLines = blkLines(file, "body equipment");
    for (const line of bodyLines) {
        const mod = CHASSIS_MODS[key(line.replace(/:.*$/, ""))];
        if (mod && mod !== "omni") fighter.setSupportChassisModification(mod, true);
    }
    const fireControl = allEquipmentLines(file).map((line) => FIRE_CONTROL[key(line)]).find(Boolean);
    if (fireControl) fighter.setSupportFireControl(fireControl);
    if (bodyLines.some((line) => key(line) === "omnichassismod")) fighter.setOmni(true);
    const engine = ENGINES[blkValue(file, "engine_type")];
    if (engine && fighter.getAvailableSupportEngines().some((option) => option.tag === engine)) fighter.setSupportEngine(engine);
    else issues.push(`Engine type ${blkValue(file, "engine_type") || "(none given)"} is not one a Fixed-Wing Support Vehicle has here; the default used.`);
    const thrust = numberOf(file, "SafeThrust", 1);
    fighter.setSafeThrust(thrust);
    if (fighter.getSafeThrust() !== thrust) issues.push(`Safe Thrust ${thrust} is outside the rules; ${fighter.getSafeThrust()} used.`);
    const bar = numberOf(file, "barrating", 0);
    fighter.setBAR(bar > 0 ? bar : 10);
    const armorType = blkValue(file, "armor_type");
    if (armorType && !(Number(armorType) >= 43 && Number(armorType) <= 51) && armorType !== "0") {
        issues.push(`Armor type ${armorType} is not Support Vehicle armor; BAR ${fighter.getBAR()} armor used.`);
    }
    const armor = blkLines(file, "armor").map((line) => Number(line)).filter((value) => Number.isFinite(value));
    (["nose", "leftWing", "rightWing", "aft"] as FighterArc[]).forEach((arc, index) => fighter.setArmorAllocation(arc, armor[index] ?? 0));

    // Equipment.
    const pendingAmmo: { line: string; ammo: IBlkAmmoLine }[] = [];
    const placed: IBlkImportedItem[] = [];
    for (const [block, location] of FIXED_WING_LOCATIONS) {
        for (const rawLine of blkLines(file, `${block} equipment`)) {
            const line = rawLine.trim();
            if (!line) continue;
            const name = line.replace(/:.*$/, "").replace(/\((R|Rear)\)/gi, "").trim();
            const lineKey = key(name);
            if (CHASSIS_MODS[lineKey] || FIRE_CONTROL[lineKey]) continue;
            const ammoLine = parseBlkAmmoLine(name.replace(/\bprimitive\b/ig, ""));
            if (ammoLine) {
                pendingAmmo.push({ line, ammo: ammoLine });
                continue;
            }
            const match = findImportedEquipment(name, faction, mixed);
            const added = match ? fighter.addEquipmentFromTag(match.item.tag, location) : null;
            if (!added) {
                issues.push(`"${line}" ${match ? "could not be mounted" : "has no match in this catalog"} and was left off.`);
                continue;
            }
            if (added.uuid) placed.push({ name, location, uuid: added.uuid });
            if (/:OMNI/i.test(line)) fighter.setPodMounted(added.uuid ?? "", true);
        }
    }
    for (const ammo of pendingAmmo) {
        const weapon = findBlkAmmoWeapon(ammo.ammo, fighter.getEquipmentList());
        const round = weapon ? findBlkAmmo(ammo.ammo, weapon) : undefined;
        if (!round || !fighter.addEquipmentFromTag(round.tag)) issues.push(`Ammunition "${ammo.line}" has no weapon or no match in this catalog and was left off.`);
        else if (ammo.ammo.half) notes.push(`"${ammo.line}" is a half-ton bin; carried as a full ton.`);
    }

    // Seats, quarters and cargo.
    for (const line of blkLines(file, "transporters")) {
        const parts = line.split(":");
        const kind = parts[0].toLowerCase().trim();
        const size = Number(parts[1]);
        const doors = Number(parts[2]) || 0;
        if (!Number.isFinite(size) || size <= 0) continue;
        const seating = SEATING[kind];
        if (seating) {
            const count = Math.round(seating.tons ? size / seating.tons : size);
            let added = 0;
            for (let index = 0; index < count; index++) if (fighter.addEquipmentFromTag(seating.tag)) added++;
            if (added < count) issues.push(`Only ${added} of ${count} "${kind}" could be carried.`);
        } else if (CARGO_BAYS[kind] && fighter.addBay(CARGO_BAYS[kind])) {
            fighter.setBay(fighter.getBays().length - 1, size, doors);
        } else {
            issues.push(`Transport "${kind}" is not one this builder has and was left off.`);
        }
    }
    // Heat sinks beyond the free ones; fuel is saved in Fuel Points (TM p.128).
    const sinks = numberOf(file, "heatsinks");
    fighter.setAdditionalHeatSinks(Math.max(0, sinks - fighter.getFreeHeatSinks()));
    const fuelPoints = numberOf(file, "fuel");
    if (fuelPoints > 0 && fighter.getFuelPointsPerTon() > 0) {
        fighter.setFuelTons(fuelPoints / fighter.getFuelPointsPerTon());
        if (fighter.getFuelPoints() !== Math.floor(fuelPoints)) {
            notes.push(`The file's ${fuelPoints} Fuel Points are ${fighter.getFuelPoints()} here: fuel is bought by the half ton from 5 tons, by the kilogram below (TM p.129).`);
        }
    }
    applyBlkQuirks(file, fighter, placed, issues, (abbr) => BLK_FIXED_WING_LOCATIONS[abbr.toUpperCase()]);
    fighter.tro.import(readBlkTechnicalReadout(file));
    return { fighter, issues, notes };
};
