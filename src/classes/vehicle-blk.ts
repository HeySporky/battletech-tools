import { SUPPORT_VEHICLE_TECH_RATINGS } from "../data/support-vehicle-construction";
import { blkLines, blkValue, IBlkFile, parseBlkFile } from "../utils/blk-file";
import { IBlkAmmoLine, findBlkAmmo, findBlkAmmoWeapon, findBlkAmmoWeaponInCatalog, parseBlkAmmoLine } from "../utils/blk-ammo";
import { findImportedEquipment } from "../utils/importedEquipment";
import { findInfantryWeaponByName, getFieldGunKind, infantryWeapons } from "../data/infantry-weapons";
import { findInfantryArmorByName, IInfantryArmor, infantryArmor, findInfantryAugmentationByKey, findInfantryProstheticItem } from "../data/infantry-armor";
import InfantryPlatoon, { findInfantryBeastMount, INFANTRY_ENGINEER_TASKS, INFANTRY_VETERAN_ANTI_MECH, INFANTRY_VETERAN_GUNNERY, INFANTRY_XCT_ENVIRONMENTS, InfantryEngineerTask } from "./infantry-platoon";
import type { IEquipmentItem, IVehicleArmorAllocation } from "../data/data-interfaces";
import { applyBlkQuirks, IBlkImportedItem } from "../utils/blk-quirks";
import { readBlkTechnicalReadout } from "../utils/blk-technical-readout";
import { getBlkFireControlSuffix, getBlkFittedTag } from "../utils/blk-fire-control";
import Vehicle from "./vehicle";
import { getVehicleBayWeight } from "../data/vehicle-transport-bays";
import AerospaceFighter, { FighterArc, FighterLocation } from "./aerospace-fighter";

// Reads a MegaMek ground, naval, rail or VTOL Support Vehicle ".blk" file into a Vehicle. Equipment is matched
// through the catalog's own import names (altNames and altTags) and the small tables below; anything with no
// match is left off and reported, so the importer never guesses.

/** MegaMek's Engine type codes (reference: MegaMek Engine.java), as this builder's Support Vehicle engines. */
const ENGINES: Record<string, string> = {
    // BLKFile's codes (read by BLKFile.translateEngineCode), not Engine's constants: 0 fusion, 1 ICE, 6 fuel cell (the
    // Boreas burns hydrogen, fuel type H, AToW Companion p.194), 7 fission, 8 none.
    "0": "fusion", "1": "ice", "6": "fuel-cell", "7": "fission", "8": "none", "9": "maglev", "10": "steam",
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
/** MegaMek's unit bays, by the cubicle (TM p.239): the size is the count. */
const UNIT_BAYS: Record<string, string> = {
    lightvehiclebay: "vehicle-light", heavyvehiclebay: "vehicle-heavy", superheavyvehiclebay: "vehicle-superheavy",
    mekbay: "mech", protomekbay: "protomech",
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
 * A ":SIZE:" a MegaMek line gives an item: communications equipment in tons (one record a ton, TM p.212), a MASH in
 * theaters (the core unit and an added theater for each past the first, TM p.228), a drone carrier control system in
 * the drones it controls (TO:AUE p.117).
 */
const readBlkItemSize = (vehicle: Vehicle, added: IEquipmentItem, line: string, location: string | undefined, mixed: boolean, issues: string[]): void => {
    const size = Number(/:SIZE:([\d.]+)/i.exec(line)?.[1]);
    if (!Number.isFinite(size) || size <= 0) return;
    const repeat = (tag: string, count: number): void => {
        for (let index = 0; index < count; index++) {
            const before = vehicle.getEquipmentList().length;
            vehicle.addEquipmentFromTag(tag, location, false, undefined, mixed);
            if (vehicle.getEquipmentList().length === before) {
                issues.push(`"${line}": only ${index + 1} of ${count + 1} could be carried.`);
                return;
            }
        }
    };
    const whole = Math.round(size);
    if (added.tag === "communications-equipment" || added.tag === "mash-core") {
        if (whole !== size) issues.push(`"${line}": ${added.tag === "mash-core" ? "theaters come" : "communications equipment comes"} whole; ${whole} used.`);
        repeat(added.tag === "mash-core" ? "mash-theater" : added.tag, whole - 1);
    } else if (added.variableFormula === "drone-carrier-control") {
        vehicle.setControlledDrones(added.uuid ?? "", whole);
    }
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
    const dumpers: { uuid: string; cargo: number }[] = [];
    const blocks: [string, string | undefined][] = [["body", undefined], ...layout.map(([block, location]) => [block, location] as [string, string])];
    const lineName = (line: string): string => line.replace(/:.*$/, "").replace(/\((ST|R|Rear|PT)\)/gi, "").trim();
    for (const [block, location] of blocks) {
        // Fire control systems and capacitors, wherever the block lists them, go on a weapon of the block (blk-fire-control).
        const fireControl = blkLines(file, `${block} equipment`).map((line) => getBlkFireControlSuffix(lineName(line))).filter((suffix): suffix is string => !!suffix);
        // A Mast Mount opens the rotor to the items it holds, wherever the file lists it (TO:AUE p.162).
        const lines = blkLines(file, `${block} equipment`).sort((first, second) => Number(/mastmount/i.test(second)) - Number(/mastmount/i.test(first)));
        // The cargo a dumper in this block dumps: the "Cargo:SIZE:" lines beside it, as MegaMek links them (TM p.243).
        const blockCargo = lines.filter((line) => key(line.replace(/:.*$/, "")) === "cargo").reduce((sum, line) => sum + (Number(/:SIZE:([\d.]+)/i.exec(line)?.[1]) || 0), 0);
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            const omniPod = /:OMNI/i.test(line);
            const name = lineName(line);
            const lineKey = key(name);
            if (skip(lineKey) || getBlkFireControlSuffix(name)) continue;
            // Primitive rounds are read as the standard ones; a tag that has the word (primitive-prototype-ac-20) keeps it.
            const ammoLine = parseBlkAmmoLine(name.replace(/(?<![\w-])primitive(?![\w-])/ig, ""));
            if (ammoLine) {
                pendingAmmo.push({ line, ammo: ammoLine });
                continue;
            }
            // Cargo listed as equipment ("Cargo:SIZE:20.0") is a vehicle's cargo bay, its size in tons (TM p.239).
            const cargoTons = lineKey === "cargo" ? Number(/:SIZE:([\d.]+)/i.exec(line)?.[1]) : NaN;
            if (cargoTons > 0 && vehicle.addBay("cargo")) {
                vehicle.setBay(vehicle.getBays().length - 1, cargoTons, 0);
                continue;
            }
            // A ladder's SIZE is its length in meters, 20 m a length to 100 m (TM pp.243-244).
            const ladderMeters = lineKey === "ladder" ? Number(/:SIZE:([\d.]+)/i.exec(line)?.[1]) : NaN;
            const match = ladderMeters > 0
                ? findImportedEquipment(`Ladder (${Math.min(100, Math.ceil(ladderMeters / 20) * 20)}m)`, faction, mixed)
                : findImportedEquipment(name, faction, mixed);
            // Light weapons on small Support Vehicles are infantry weapons, named as the infantry weapon list names them.
            // That name wins over a vehicle weapon the matcher also reads into it: "Machine Gun (Light)" is the
            // infantry support weapon (BV 1.5), the vehicle gun being "Light Machine Gun" (Ibex RV Militarized MG).
            // MegaMek's own names (InfantryStandardSRM, InfantryAssaultRifle) are the records' altNames, read when no vehicle
            // item has the name. A ":SIZE:" is the clips carried, the first one standard (MegaMek BLKFile; TM p.136).
            const lightWeapon = infantryWeapons.find((weapon) => weapon.name.toLowerCase() === name.toLowerCase())
                ?? (match ? undefined : findInfantryWeaponByName(name, faction) ?? undefined);
            const clips = Math.max(1, Math.round(Number(/:SIZE:([\d.]+)/i.exec(line)?.[1]) || 1));
            if (lightWeapon && location) {
                if (vehicle.addLightWeapon(lightWeapon.tag, location, clips - 1, /\((ST|PT)\)/i.test(line))) continue;
                if (!match) {
                    issues.push(`"${line}" could not be mounted as a light weapon and was left off.`);
                    continue;
                }
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
            readBlkItemSize(vehicle, added, line, location, mixed, issues);
            if (added.variableFormula === "dumper") dumpers.push({ uuid: added.uuid ?? "", cargo: blockCargo });
            mounted(added, line);
        }
        if (fireControl.length > 0) issues.push(`${fireControl.length} fire control system or capacitor line(s) in the ${block} had no weapon to fit and were left off.`);
    }
    // Ammunition goes with a mounted weapon of the name it gives.
    for (const ammo of pendingAmmo) {
        const mountedWeapon = findBlkAmmoWeapon(ammo.ammo, vehicle.getEquipmentList());
        // Ammunition for a gun another unit mounts (an ammunition carriage towed to its gun) is carried as cargo: the round of
        // the catalog weapon the line names, feeding nothing aboard.
        // A Support Vehicle may carry rounds for no gun aboard too: the Buffalo drone bomb's nine half-tons of machine gun
        // rounds (XTR: Succession Wars). They add no Battle Value: ammunition counts up to its weapon's BV (TM p.307).
        const weapon = mountedWeapon ?? (vehicle.isUnpoweredTrailer() || vehicle.isSupportVehicle() ? findBlkAmmoWeaponInCatalog(ammo.ammo) : undefined);
        const round = weapon ? findBlkAmmo(ammo.ammo, weapon) : undefined;
        const before = vehicle.getEquipmentList().length;
        if (round) vehicle.addEquipmentFromTag(round.tag, undefined, false, undefined, true);
        const added = vehicle.getEquipmentList()[before];
        if (!added) {
            issues.push(`Ammunition "${ammo.line}" has no weapon or no match in this catalog and was left off.`);
            continue;
        }
        if (mountedWeapon) vehicle.setAmmoBinWeapon(added.uuid ?? "", mountedWeapon.tag);
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
        } else if (UNIT_BAYS[kind]) {
            if (vehicle.addBay(UNIT_BAYS[kind])) vehicle.setBay(vehicle.getBays().length - 1, size, doors);
            else issues.push(`Transport "${kind}" could not be added and was left off.`);
        } else if (kind === "infantrybay") {
            // The size is the count of platoon bays, of the platoon type the fifth field names (MegaMek InfantryBay).
            const platoon = (parts[4] ?? "").toLowerCase().trim();
            const tag = platoon === "jump" ? "infantry-jump" : platoon === "motorized" ? "infantry-motorized" : platoon === "mechanized" ? "infantry-mechanized" : "infantry-foot";
            if (vehicle.addBay(tag)) vehicle.setBay(vehicle.getBays().length - 1, size, doors);
            else issues.push(`Transport "${kind}" could not be added and was left off.`);
        } else if (kind === "battlearmorbay") {
            // The size is the squads; the last field marks a Clan (2) or ComStar (1) bay, else the vehicle's tech base.
            const flags = Number(parts[6]) || 0;
            const tag = flags & 2 || (!flags && faction === "clan") ? "battle-armor-clan" : flags & 1 ? "battle-armor-is-6" : "battle-armor-is";
            if (vehicle.addBay(tag)) vehicle.setBay(vehicle.getBays().length - 1, size, doors);
            else issues.push(`Transport "${kind}" could not be added and was left off.`);
        } else if (kind === "troopspace") {
            vehicle.setTroopSpace(size);
        } else {
            issues.push(`Transport "${kind}" is not one this builder has and was left off.`);
        }
    }
    // A dumper dumps the cargo listed beside it; with none listed there, all the unit's cargo, the book's "all or some"
    // read as all (TM p.243; inferred, for NGCFells to review).
    const allCargo = vehicle.getBays().filter((bay) => bay.tag.startsWith("cargo")).reduce((sum, bay) => sum + getVehicleBayWeight(bay), 0);
    for (const dumper of dumpers) vehicle.setDumperCargo(dumper.uuid, dumper.cargo > 0 ? dumper.cargo : allCargo);
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

    // Chassis modifications come from the body, fire control from any block; set them before movement and equipment.
    const bodyLines = blkLines(file, "body equipment");
    for (const line of bodyLines) {
        const mod = CHASSIS_MODS[key(line.replace(/:.*$/, ""))];
        if (mod) vehicle.setSupportVehicleChassisModification(mod, true);
    }
    // The Combat Vehicle chassis modification a Support Vehicle may take: the Armored Motive System (TO:AUE p.94).
    const combatMods = bodyLines.map((line) => COMBAT_CHASSIS_MODS[withoutTechPrefix(key(line.replace(/:.*$/, "")))]).filter((tag): tag is string => !!tag);
    // Again once the chassis is known: a trailer's engine "none" needs the Trailer modification (TM p.126).
    if (engine) vehicle.setSupportVehicleEngine(engine);
    if (!engine || vehicle.getSupportVehicleEngine()?.tag !== engine) {
        issues.push(`Engine type ${blkValue(file, "engine_type") || "(none given)"} is not one this builder has; the default used.`);
    }
    const fireControl = allEquipmentLines(file).map((line) => FIRE_CONTROL[key(line)]).find(Boolean);
    if (fireControl) vehicle.setSupportVehicleFireControl(fireControl);
    if (bodyLines.some((line) => key(line) === "omnichassismod")) vehicle.setOmni(true);
    const cruise = numberOf(file, "cruiseMP");
    vehicle.setCruiseMP(cruise);
    // The file gives the base Cruising MP, before a hydrofoil's x 1.25 (TM p.123; the Silverback Coastal Cutter: 6, so 8).
    if (vehicle.getBaseCruiseMP() !== cruise) issues.push(`Cruise MP ${cruise} is outside the rules; ${vehicle.getBaseCruiseMP()} used.`);
    for (const tag of combatMods) {
        vehicle.setChassisModification(tag, true, 4);
        if (!vehicle.hasChassisModification(tag as never)) issues.push(`Chassis modification "${tag}" does not fit this vehicle.`);
    }
    // Vehicular Jump Jets, one a line, each 1 Jump MP: Experimental, open to Support Vehicles (TO:AUE p.161).
    const jets = allEquipmentLines(file).filter((line) => key(line.replace(/:.*$/, "")) === VEHICLE_JUMP_JET).length;
    if (jets > 0 && vehicle.setJumpMP(jets) !== jets) issues.push(`${jets} vehicular jump jets do not fit this vehicle; ${vehicle.getJumpMP()} used.`);
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
        (lineKey) => MARKERS.has(lineKey) || !!CHASSIS_MODS[lineKey] || !!FIRE_CONTROL[lineKey] || lineKey === VEHICLE_JUMP_JET || !!COMBAT_CHASSIS_MODS[withoutTechPrefix(lineKey)], (added, line) => { if (/\((ST|PT)\)/i.test(line)) vehicle.setPintle(added.uuid ?? "", true); });
    const fuel = numberOf(file, "fuel", -1);
    if (fuel >= 0) vehicle.setSupportVehicleFuel(fuel);
    applyBlkQuirks(file, vehicle, placed, issues, (abbr) => BLK_VEHICLE_LOCATIONS[abbr.toUpperCase()]);
    vehicle.tro.import(readBlkTechnicalReadout(file));
    return { vehicle, issues, notes };
};

/** MegaMek's Combat Vehicle engine codes (Engine.java), as this builder's engine types; Clan versions where they differ. */
const COMBAT_ENGINES: Record<string, { is: string; clan?: string }> = {
    // BLKFile's codes (BLKFile.translateEngineCode), not Engine's constants: the Manticore (fusion) is 0, the Scorpion (ICE) 1.
    "0": { is: "standard" }, "1": { is: "ice" }, "2": { is: "xl", clan: "clan_xl" }, "3": { is: "xxl", clan: "clan_xxl" },
    "4": { is: "light" }, "5": { is: "compact" }, "6": { is: "cell" }, "7": { is: "fission" },
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

/** Support Vehicle items a Combat Vehicle file may list (the Jeep, the Nike): kept as printed, by their key without the tech prefix. */
const PRINTED_SUPPORT_ITEMS: Record<string, string> = {
    offroadchassis: "Off-Road chassis", armoredchassis: "Armored chassis", advancedfirecontrol: "Advanced Fire Control",
};

/** Body items that are Combat Vehicle chassis modifications (TO:AUE pp.94, 114), without their IS/CL prefix. */
const COMBAT_CHASSIS_MODS: Record<string, string> = {
    flotationhull: "flotation-hull", limitedamphibiouschassis: "limited-amphibious", fullyamphibiouschassis: "fully-amphibious",
    dunebuggychassis: "dune-buggy", environmentalsealedchassis: "environmental-sealing", armoredmotivesystem: "armored-motive",
};
const VEHICLE_JUMP_JET = "vehiclejumpjet";
const SPONSON_TURRET = "sponsonturret";
/** MegaMek's Smart Robotic Control System lines (MiscType), as this builder's robotic control (IO:AE pp.134-135). */
const ROBOTIC_CONTROLS: Record<string, string> = {
    smartroboticcontrolsystem: "srcs", improvedsmartroboticcontrolsystem: "srcs-improved", improvedsrcs: "srcs-improved",
};
const withoutTechPrefix = (lineKey: string): string => lineKey.replace(/^(is|cl)(?=[a-z])/, "");

export interface IVehicleBlkResult {
    vehicle: Vehicle | null;
    /** What could not be carried over. */
    issues: string[];
    /** What was kept as printed although the rules do not allow it. */
    notes: string[];
}

/** Reads a MegaMek Combat Vehicle ".blk" file (a tank, VTOL or naval vessel, superheavy ones too) into a Vehicle. */
export const importVehicleBlk = (text: string): IVehicleBlkResult => {
    const file = parseBlkFile(text);
    if (!file) return { vehicle: null, issues: ["This is not a MegaMek unit file."], notes: [] };
    const unitType = key(blkValue(file, "UnitType"));
    const notes: string[] = [];
    if (unitType !== "tank" && unitType !== "vtol") {
        return { vehicle: null, issues: [`This file holds a ${blkValue(file, "UnitType") || "unit of an unknown type"}, not a Combat Vehicle.`], notes: [] };
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
    if (!motive) return { vehicle: null, issues: [`Motive type "${blkValue(file, "motion_type")}" is not one this builder has.`], notes: [] };
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
    // MegaMek engine code 8 is no engine: an unpowered Trailer (TM p.99), built with no control systems or crew.
    const unpowered = blkValue(file, "engine_type") === "8";
    const engine = COMBAT_ENGINES[blkValue(file, "engine_type") || "0"]; // no code: fusion, as BLKTankFile
    if (unpowered) {
        if (!vehicle.setUnpoweredTrailer(true)) issues.push(`An unpowered Trailer must be Tracked or Wheeled (TM p.98); ${vehicle.getMotiveType().name} is not.`);
    } else {
        if (engine) vehicle.setEngineType(clanEngine ? engine.clan ?? engine.is : engine.is);
        if (!engine || vehicle.getEngineType().tag !== (clanEngine ? engine.clan ?? engine.is : engine.is)) {
            issues.push(`Engine type ${blkValue(file, "engine_type")} is not one this builder has.`);
        }
    }

    const bodyKeys = blkLines(file, "body equipment").map((line) => withoutTechPrefix(key(line.replace(/:.*$/, ""))));
    for (const lineKey of bodyKeys) {
        if (COMBAT_CHASSIS_MODS[lineKey]) {
            vehicle.setChassisModification(COMBAT_CHASSIS_MODS[lineKey], true, 4);
            if (!vehicle.hasChassisModification(COMBAT_CHASSIS_MODS[lineKey] as never)) issues.push(`Chassis modification "${lineKey}" does not fit this vehicle.`);
        }
        if (ROBOTIC_CONTROLS[lineKey] && vehicle.setRoboticControl(ROBOTIC_CONTROLS[lineKey]).tag !== ROBOTIC_CONTROLS[lineKey]) {
            issues.push(`The file's Smart Robotic Control System ("${lineKey}") is not one this vehicle can have here.`);
        }
    }
    if (blkValue(file, "omni")) vehicle.setOmni(true);
    const cruise = numberOf(file, "cruiseMP");
    vehicle.setCruiseMP(cruise);
    // The file gives the base Cruising MP, before a hydrofoil's x 1.25 (TM p.123; the Silverback Coastal Cutter: 6, so 8).
    if (vehicle.getBaseCruiseMP() !== cruise) issues.push(`Cruise MP ${cruise} is outside the rules; ${vehicle.getBaseCruiseMP()} used.`);
    if (+blkValue(file, "internal_type") > 0) issues.push(`Structure type ${blkValue(file, "internal_type")} is not one this builder has.`);

    const armorCode = blkValue(file, "armor_type") || "0";
    const armorType = COMBAT_ARMOR[armorCode];
    if (armorType) vehicle.setArmorType(armorType);
    if (armorType && vehicle.getArmorType().tag !== armorType && clan && !mixed) {
        // As printed: an Inner Sphere armor (heavy ferro-fibrous) on a Clan design is built on a mixed chassis, with the armor of its own tech base.
        vehicle.setTech("mclan");
        vehicle.setArmorType(armorType);
        if (vehicle.getArmorType().tag === armorType) {
            vehicle.setArmorTechBase("is");
            notes.push(`The file's ${vehicle.getArmorType().name.toLowerCase()} is Inner Sphere armor on a Clan design, which the rules do not allow. It is kept as printed, on a mixed chassis with Inner Sphere armor, and flagged illegal as printed.`);
        } else vehicle.setTech("clan");
    }
    if (!armorType || vehicle.getArmorType().tag !== armorType) issues.push(`Armor type ${armorCode} is not one this builder has for this vehicle.`);
    const armorLevel = blkValue(file, "armor_tech_level");
    if (armorLevel && !notes.length) vehicle.setArmorTechBase(CLAN_TECH_LEVELS.has(+armorLevel) ? "clan" : "is");

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

    // Each vehicular jump jet is a Jump MP; a sponson turret marker fits the pair, which "(ST)" weapons then go in. A file
    // with "(ST)" lines and no marker has the pair too, as MegaMek reads it.
    const equipmentKeys = allEquipmentLines(file).map((line) => key(line.replace(/:.*$/, "")));
    const jets = equipmentKeys.filter((lineKey) => lineKey === VEHICLE_JUMP_JET).length;
    if (jets > 0) {
        vehicle.setJumpMP(jets);
        if (vehicle.getJumpMP() !== jets) issues.push(`${jets} vehicular jump jets do not fit this vehicle.`);
    }
    if (equipmentKeys.includes(SPONSON_TURRET) || allEquipmentLines(file).some((line) => /\(ST\)/i.test(line))) vehicle.setSponsonTurrets(true);

    // Clan CASE on an Inner Sphere chassis is the chassis's Clan CASE, weightless (TM p.210), not a half-ton item.
    if (equipmentKeys.includes("clcase") && vehicle.canChooseClanCASE()) vehicle.setClanCASE(true);
    // An OmniVehicle's turret weighs what the base chassis set, in every configuration (TM p.108).
    const baseTurret = Number(blkValue(file, "basechassisturretweight"));
    if (vehicle.isOmni() && baseTurret > 0) vehicle.setOmniTurretWeight(baseTurret);

    const layout = unitType === "vtol" ? VTOL : superheavy ? LARGE : TANK;
    const placed = readVehicleEquipment(file, vehicle, layout, faction, mixed, issues,
        // Read above, or no item of their own: Clan CASE is built into a Clan chassis (TM p.210), and the stealth line
        // marks Vehicular Stealth armor.
        (lineKey) => lineKey === VEHICLE_JUMP_JET || lineKey === SPONSON_TURRET || !!PRINTED_SUPPORT_ITEMS[withoutTechPrefix(lineKey)] || !!COMBAT_CHASSIS_MODS[withoutTechPrefix(lineKey)] || !!ROBOTIC_CONTROLS[lineKey]
            || (lineKey === "clcase" && vehicle.hasCASE()) || (lineKey === "isvehicularstealth" && vehicle.getArmorType().tag === "vehicular-stealth"),
        (added, line) => {
            if (/\(ST\)/i.test(line) && !vehicle.setEquipmentSponson(added.uuid ?? "", true)) issues.push(`"${line}" could not go in a sponson turret.`);
            if (/\(PT\)/i.test(line)) vehicle.setPintle(added.uuid ?? "", true);
        });
    applyBlkQuirks(file, vehicle, placed, issues, (abbr) => BLK_VEHICLE_LOCATIONS[abbr.toUpperCase()]);
    vehicle.tro.import(readBlkTechnicalReadout(file));
    for (const lineKey of equipmentKeys) {
        const printed = PRINTED_SUPPORT_ITEMS[withoutTechPrefix(lineKey)];
        if (printed) vehicle.addPrintedSupportItem(printed);
    }
    if (vehicle.getPrintedSupportItems().length > 0) {
        notes.push("This design lists a Support Vehicle item (Off-Road or Armored chassis, Advanced Fire Control) on a Combat Vehicle. It is kept as printed, with no effect applied, and flagged illegal as printed.");
    }
    return { vehicle, issues, notes };
};

/** MegaMek's aerospace armor codes (EquipmentType.T_ARMOR_*) as this builder's fighter armor; [Inner Sphere, Clan]. */
const FIGHTER_ARMOR: Record<string, [string, string]> = {
    "0": ["aerospace-standard", "aerospace-standard"], "41": ["aerospace-standard", "aerospace-standard"],
    "19": ["ferro-aluminum", "clan-ferro-aluminum"], "20": ["heavy-ferro-aluminum", "heavy-ferro-aluminum"],
    "21": ["light-ferro-aluminum", "light-ferro-aluminum"], "39": ["primitive-aerospace-fighter", "primitive-aerospace-fighter"],
};
/** MegaMek's fighter cockpit codes (Aero.COCKPIT_*): only the standard one is built here. */
const FIGHTER_COCKPITS = ["Standard Cockpit", "Small Cockpit", "Command Console", "Primitive Cockpit"];
/** The file's equipment blocks, as this builder's locations. MegaMek's "Wings" block holds nothing in any file. */
const FIGHTER_BLOCKS: [string, FighterLocation][] = [
    ["nose", "nose"], ["left wing", "leftWing"], ["right wing", "rightWing"], ["aft", "aft"], ["fuselage", "fuselage"],
];
const BLK_FIGHTER_LOCATIONS: Record<string, string> = { NOS: "nose", LWG: "leftWing", RWG: "rightWing", AFT: "aft", FSLG: "fuselage" };

export interface IFighterBlkResult {
    fighter: AerospaceFighter | null;
    /** What could not be carried over. */
    issues: string[];
}

/**
 * Reads a MegaMek aerospace or conventional fighter ".blk" file (BLKAeroSpaceFighterFile, BLKConvFighterFile) into an
 * AerospaceFighter (TM pp.184-197). What this builder lacks (a small, primitive or command console cockpit, an XXL
 * engine, vehicular stealth or other armor a fighter here cannot take, a half-ton bin) is reported, never guessed.
 */
export const importFighterBlk = (text: string): IFighterBlkResult => {
    const file = parseBlkFile(text);
    if (!file) return { fighter: null, issues: ["This is not a MegaMek unit file."] };
    const unitType = key(blkValue(file, "UnitType"));
    if (unitType !== "aerospacefighter" && unitType !== "convfighter") {
        return { fighter: null, issues: [`This file holds a ${blkValue(file, "UnitType") || "unit of an unknown type"}, not a fighter.`] };
    }
    const issues: string[] = [];
    const fighter = new AerospaceFighter();
    if (unitType === "convfighter") fighter.setFighterType("conventional");
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
    if (fighter.getTonnage() !== tons) issues.push(`The file's weight of ${tons} tons is outside the rules for a fighter; ${fighter.getTonnage()} tons used.`);
    const cockpit = numberOf(file, "cockpit_type", 0);
    if (cockpit !== 0) issues.push(`The file's ${FIGHTER_COCKPITS[cockpit] ?? `cockpit type ${cockpit}`} is not one this builder has; a standard cockpit used.`);

    // Engine first: it sets the free heat sinks. A Clan unit's engine is Clan unless the file says otherwise.
    const engineCode = blkValue(file, "engine_type") || "0";
    const clanEngine = blkValue(file, "clan_engine") ? /^true$/i.test(blkValue(file, "clan_engine")) : clan;
    const engineEntry = COMBAT_ENGINES[engineCode];
    const engine = engineEntry ? (clanEngine && engineEntry.clan ? engineEntry.clan : engineEntry.is) : undefined;
    if (engine) fighter.setEngineType(engine);
    if (!engine || fighter.getEngineType().tag !== engine) issues.push(`Engine type ${engineCode} is not one this fighter can have here; ${fighter.getEngineType().name} used.`);
    const thrust = numberOf(file, "SafeThrust", 1);
    fighter.setSafeThrust(thrust);
    if (fighter.getSafeThrust() !== thrust) issues.push(`Safe Thrust ${thrust} is outside the rules; ${fighter.getSafeThrust()} used.`);
    if (numberOf(file, "vstol") === 1) {
        fighter.setVSTOL(true);
        if (!fighter.hasVSTOL()) issues.push("The file's VSTOL gear could not be fitted.");
    }
    if (numberOf(file, "omni") === 1) fighter.setOmni(true);

    const sinkType = numberOf(file, "sink_type") === 1 ? "double" : "single";
    fighter.setHeatSinkType(sinkType);
    if (fighter.getHeatSinkType().tag !== sinkType) issues.push(`The file's ${sinkType} heat sinks are not allowed here.`);
    const sinks = numberOf(file, "heatsinks");
    fighter.setAdditionalHeatSinks(Math.max(0, sinks - fighter.getFreeHeatSinks()));
    if (fighter.getTotalHeatSinks() !== sinks) issues.push(`The file's ${sinks} heat sinks are fewer than the engine's free ones; ${fighter.getTotalHeatSinks()} used.`);

    const armorCode = blkValue(file, "armor_type") || "0";
    const armorClan = CLAN_TECH_LEVELS.has(numberOf(file, "armor_tech_level", -1)) || (clan && !blkValue(file, "armor_tech_level"));
    const armorTag = FIGHTER_ARMOR[armorCode]?.[armorClan ? 1 : 0];
    if (armorTag) fighter.setArmorType(armorTag);
    if (!armorTag || fighter.getArmorType().tag !== armorTag) issues.push(`Armor type ${armorCode} is not one this fighter can have here; ${fighter.getArmorType().name} used.`);
    const armor = blkLines(file, "armor").map((line) => Number(line)).filter((value) => Number.isFinite(value));
    (["nose", "rightWing", "leftWing", "aft"] as FighterArc[]).forEach((arc, index) => fighter.setArmorAllocation(arc, armor[index] ?? 0));

    // Equipment, then ammunition for the weapons mounted. Fire control (Artemis, capacitors) fits a weapon of its block.
    const placed: IBlkImportedItem[] = [];
    const pendingAmmo: { line: string; ammo: IBlkAmmoLine }[] = [];
    if (blkLines(file, "wings equipment").some((line) => line.trim())) issues.push("The file's Wings block is not a location this builder has; those items were left off.");
    const lineName = (line: string): string => line.replace(/:.*$/, "").replace(/\((R|Rear)\)/gi, "").trim();
    for (const [block, location] of FIGHTER_BLOCKS) {
        const fireControl = blkLines(file, `${block} equipment`).map((line) => getBlkFireControlSuffix(lineName(line))).filter((suffix): suffix is string => !!suffix);
        for (const rawLine of blkLines(file, `${block} equipment`)) {
            const line = rawLine.trim();
            if (!line) continue;
            const name = lineName(line);
            // A Clan fighter comes with CASE, weighing nothing (AT2R p.65; TM p.312 takes it as fitted).
            if (getBlkFireControlSuffix(name) || (key(name) === "clcase" && clan)) continue;
            const ammoLine = parseBlkAmmoLine(name.replace(/\bprimitive\b/ig, ""));
            if (ammoLine) {
                pendingAmmo.push({ line, ammo: ammoLine });
                continue;
            }
            const match = findImportedEquipment(name, faction, mixed);
            if (!match) {
                issues.push(`"${line}" has no match in this catalog and was left off.`);
                continue;
            }
            const fits = fireControl.findIndex((suffix) => !!getBlkFittedTag(match.item.tag, suffix));
            const tag = fits >= 0 ? getBlkFittedTag(match.item.tag, fireControl.splice(fits, 1)[0])! : match.item.tag;
            const added = fighter.addEquipmentFromTag(tag, location);
            if (!added) {
                issues.push(`"${line}" could not be mounted and was left off.`);
                continue;
            }
            if (added.uuid) placed.push({ name, location, uuid: added.uuid });
            if (/:OMNI/i.test(line)) fighter.setPodMounted(added.uuid ?? "", true);
        }
        if (fireControl.length > 0) issues.push(`${fireControl.length} fire control system or capacitor line(s) in the ${block} had no weapon to fit and were left off.`);
    }
    for (const ammo of pendingAmmo) {
        if (ammo.ammo.half) {
            issues.push(`"${ammo.line}" is a half-ton bin, which this builder does not carry outside Fractional Accounting; left off.`);
            continue;
        }
        const weapon = findBlkAmmoWeapon(ammo.ammo, fighter.getEquipmentList());
        const round = weapon ? findBlkAmmo(ammo.ammo, weapon) : undefined;
        const added = round ? fighter.addEquipmentFromTag(round.tag) : null;
        if (!added) {
            issues.push(`Ammunition "${ammo.line}" has no weapon or no match in this catalog and was left off.`);
            continue;
        }
        // One kind of round may feed launchers of several sizes: the bin keeps the one its line names.
        if (weapon) fighter.setAmmoBinWeapon(added.uuid ?? "", weapon.tag);
        if (/:OMNI/i.test(ammo.line)) fighter.setPodMounted(added.uuid ?? "", true);
    }
    for (const line of blkLines(file, "transporters")) {
        if (line.trim()) issues.push(`Transport "${line.split(":")[0]}" is not one a fighter carries here and was left off.`);
    }
    const fuelPoints = numberOf(file, "fuel");
    if (fuelPoints > 0) {
        fighter.setFuelTons(fuelPoints / fighter.getFuelPointsPerTon());
        if (fighter.getFuelPoints() !== fuelPoints) issues.push(`The file's ${fuelPoints} Fuel Points are ${fighter.getFuelPoints()} here: fuel is bought by the half ton (TM p.186).`);
    }
    applyBlkQuirks(file, fighter, placed, issues, (abbr) => BLK_FIGHTER_LOCATIONS[abbr.toUpperCase()]);
    fighter.tro.import(readBlkTechnicalReadout(file));
    return { fighter, issues };
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
            const ammoLine = parseBlkAmmoLine(name.replace(/(?<![\w-])primitive(?![\w-])/ig, ""));
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

export interface IInfantryBlkResult {
    platoon: InfantryPlatoon | null;
    /** What could not be carried over. */
    issues: string[];
    /** What was carried over in a different form. */
    notes: string[];
}

/** Motion types of an infantry file, as this builder's motive types. */
const INFANTRY_MOTIVES: Record<string, string> = {
    leg: "foot", motorized: "motorized", jump: "jump", hover: "mech-hover", tracked: "mech-tracked", wheeled: "mech-wheeled",
    // TO:AUE pp.135, 153: MegaMek writes Microlite and Microcopter (VTOL), SCUBA (UMU), Motorized SCUBA and Submarine (mechanized SCUBA).
    microlite: "microlite", microcopter: "microcopter", scuba: "scuba", umu: "scuba", motorizedscuba: "scuba-motorized", submarine: "scuba-mech",
};

/**
 * MegaMek's specialization bit mask (ConvInfantry): the six combat engineer tasks are bits 1 to 32 (BRIDGE, DEMO, FIRE, MINE, SENSOR,
 * TRENCH), then MARINES 64, MOUNTAIN_TROOPS 128, PARAMEDICS 256, PARATROOPS 512, TAG_TROOPS 1024, XCT 2048 and SCUBA 4096.
 */
const INFANTRY_SPECIALIZATION_BITS = { marines: 64, mountain: 128, paramedics: 256, paratroops: 512, tag: 1024, xct: 2048, scuba: 4096 } as const;

/**
 * What an infantry file holds that the platoon cannot carry yet, each said in one place so a later round can lift it
 * when it builds the feature (field guns, beasts, specializations, augmentation, the rare motives).
 */
export const INFANTRY_BLK_UNSUPPORTED = {
    fieldGun: (line: string) => `Field gun item "${line}" (the file's Field Guns Equipment) is not a field gun, field artillery or ammunition this builder has.`,
    beast: (motion: string) => `The mount "${motion}" is not a creature of the Beast-Mounted Infantry Sample Types Table (TO:AUE p.106).`,
    motive: (motion: string) => `The motion type "${motion}" is not one a platoon has yet.`,
    specialization: (what: string) => `The file's specialization is not one this platoon can have: ${what}.`,
    augmentation: (names: string) => `The file's augmentation (${names}) is not one conventional infantry has rules for (IO:AE pp.70-79: the neural interfaces and the Clan EI implant are for other unit types).`,
    prosthetic: (item: string) => `The file's prosthetic item "${item}" is not on the Enhanced Prosthetic Equipment Table (IO:AE p.78).`,
    disposableWeapon: (name: string) => `The file's disposable weapon "${name}" is not modeled yet.`,
    customArmor: (what: string) => `The file's armor differs from its kit (${what}); custom infantry armor is not modeled.`,
} as const;

/**
 * The file's Field Guns Equipment (TO:AUE pp.122-123): one line for each gun (or the one artillery piece) and one for each ton of
 * ammunition. Every gun is the same weapon, which is how the platoon holds them; whatever breaks that, or the crew or motive rules,
 * is reported and the platoon keeps what it can.
 */
const importInfantryFieldGuns = (platoon: InfantryPlatoon, lines: string[], faction: "is" | "clan", issues: string[], mixFor: (item: { name: string; techBase: string }) => void): void => {
    if (lines.length === 0) return;
    const gunLines = lines.filter((line) => !parseBlkAmmoLine(line));
    const ammoLines = lines.filter((line) => parseBlkAmmoLine(line));
    // A Clan platoon with the Star League autocannon names it plainly ("Autocannon/2"); the catalog calls it "(Clan, Star League)".
    const records = gunLines.map((line) => ({ line, item: (findImportedEquipment(line, faction) ?? (faction === "clan" ? findImportedEquipment(`${line} (Clan, Star League)`, "clan") : null))?.item }));
    for (const { line, item } of records) if (!item || getFieldGunKind(item) === null) issues.push(INFANTRY_BLK_UNSUPPORTED.fieldGun(line));
    // A name the file gives the other technology base ("ISUltraAC5" in a Clan file) would otherwise come back as this base's
    // weapon by its squashed name: a different gun (range, weight, BV). Where the other base has its own record, that gun is
    // taken and the platoon built with mixed technology (TO:AUE p.189), as for its other weapons and its armor kit.
    const otherFaction = faction === "clan" ? "is" : "clan";
    const otherPrefix = faction === "clan" ? /^IS(?=[A-Z\s])/ : /^(CL|Clan)(?=[A-Z\s])/;
    for (const record of records.filter((entry) => entry.item && otherPrefix.test(entry.line))) {
        const named = findImportedEquipment(record.line, otherFaction)?.item;
        if (named && named.tag !== record.item!.tag && getFieldGunKind(named) !== null && (named.techBase === "is" || named.techBase === "clan")) {
            mixFor({ name: named.name, techBase: named.techBase });
            record.item = named;
        }
    }
    const known = records.filter((record) => record.item && getFieldGunKind(record.item) !== null);
    if (known.length === 0) return;
    const weapon = known[0].item!;
    if (known.some((record) => record.item!.tag !== weapon.tag)) {
        issues.push("The file's field guns are not all one type and size, which a platoon needs (TO:AUE p.122); only the first type is read.");
    }
    const count = known.filter((record) => record.item!.tag === weapon.tag).length;
    if (!platoon.setFieldGuns(weapon.tag, count)) {
        issues.push(`${weapon.name} cannot be carried as a field gun by this platoon (${platoon.getMotive().name}, ${platoon.getTechName()}).`);
        return;
    }
    if (platoon.getFieldGunCount() !== count) issues.push(`${count} ${weapon.name} are over what ${platoon.getTroopers()} troopers can crew; ${platoon.getFieldGunCount()} used.`);
    // A file with no ammunition lines leaves it to the rule: a standard ton (cluster for an LB-X) a gun, which the platoon already holds.
    if (ammoLines.length > 0 && ammoLines.length !== count) issues.push(`${count} field gun${count === 1 ? "" : "s"} but ${ammoLines.length} tons of ammunition in the file (a ton each, TO:AUE p.123).`);
    ammoLines.slice(0, platoon.getFieldGunCount()).forEach((line, ton) => {
        const parsed = parseBlkAmmoLine(line);
        const round = parsed ? findBlkAmmo(parsed, weapon) : undefined;
        if (!parsed || findBlkAmmoWeapon(parsed, [weapon]) === undefined || !round) issues.push(INFANTRY_BLK_UNSUPPORTED.fieldGun(line));
        else if (!platoon.setFieldGunAmmo(ton, round.tag)) issues.push(`${round.name} cannot be fired by ${weapon.name} here.`);
    });
};

/**
 * The file's augmentation list (MegaMek's pilot option keys) and its prosthetic items (IO:AE pp.70-79): the implants conventional
 * infantry has rules for become the platoon's augmentation; the vehicular neural interfaces and the EI implant are reported.
 * Called before the weapons, as the implants decide how many secondary weapons a squad may carry (pp.74-75).
 */
const importInfantryAugmentation = (platoon: InfantryPlatoon, file: IBlkFile, issues: string[]): void => {
    const tags: string[] = [];
    for (const line of blkLines(file, "augmentation").map((entry) => entry.trim()).filter((entry) => entry)) {
        const record = findInfantryAugmentationByKey(line);
        if (!record) issues.push(INFANTRY_BLK_UNSUPPORTED.augmentation(line));
        else if (!tags.includes(record.tag)) tags.push(record.tag);
    }
    const blocks = Object.keys(file.blocks);
    const itemOf = (tag: string): string => blkValue(file, tag).trim();
    const slot = (tag: string, countTag: string): { item: string; count: number } | null => {
        if (!blocks.includes(tag.toLowerCase())) return null;
        const name = itemOf(tag);
        const found = findInfantryProstheticItem(name);
        if (!found) { issues.push(INFANTRY_BLK_UNSUPPORTED.prosthetic(name)); return null; }
        return { item: found.tag, count: blocks.includes(countTag.toLowerCase()) ? Math.max(1, Math.min(2, Math.round(Number(itemOf(countTag))) || 1)) : 1 };
    };
    // A file may write the first slot without its number.
    const limbs = [slot("prostheticEnhancement1", "prostheticEnhancement1Count") ?? slot("prostheticEnhancement", "prostheticEnhancementCount"), slot("prostheticEnhancement2", "prostheticEnhancement2Count")].filter((limb): limb is { item: string; count: number } => limb !== null);
    const pairs: string[] = [];
    for (const tag of ["extraneousPair1", "extraneousPair2"]) {
        if (!blocks.includes(tag.toLowerCase())) continue;
        const found = findInfantryProstheticItem(itemOf(tag));
        if (found) pairs.push(found.tag); else issues.push(INFANTRY_BLK_UNSUPPORTED.prosthetic(itemOf(tag)));
    }
    if (limbs.length > 0 && !tags.includes("aug-limb-enhanced") && !tags.includes("aug-limb-improved")) issues.push("The file's prosthetic items need the pl_enhanced or pl_ienhanced augmentation, which it does not list; they do nothing without it (IO:AE p.78).");
    if (pairs.length > 0 && !tags.includes("aug-limb-extraneous")) issues.push("The file's extraneous limbs need the pl_extra_limbs augmentation, which it does not list; they do nothing without it (IO:AE p.78).");
    platoon.setAugmentations(tags);
    platoon.setLimbs(limbs);
    platoon.setExtraneousPairs(pairs);
};

/**
 * Reads a MegaMek conventional infantry ".blk" file (BLKInfantryFile) into a platoon (TM pp.144-155, TO:AUE pp.129-130).
 * Anything the platoon cannot carry (field guns, beasts, specializations, augmentation, a weapon or kit with no
 * match here) is reported, never guessed; the file's rules level is worked out from what it carries.
 */
export const importInfantryBlk = (text: string): IInfantryBlkResult => {
    const file = parseBlkFile(text);
    if (!file) return { platoon: null, issues: ["This is not a MegaMek unit file."], notes: [] };
    if (key(blkValue(file, "UnitType")) !== "infantry") {
        return { platoon: null, issues: [`This file holds a ${blkValue(file, "UnitType") || "unit of an unknown type"}, not conventional infantry.`], notes: [] };
    }
    const issues: string[] = [];
    const notes: string[] = [];
    const platoon = new InfantryPlatoon();
    const has = (tag: string): boolean => file.blocks[tag.toLowerCase()] !== undefined;
    platoon.setName([blkValue(file, "Name"), blkValue(file, "Model")].filter((part) => part.trim()).join(" "));
    const type = blkValue(file, "type").toLowerCase();
    const clan = type.startsWith("clan") || type.includes("clan chassis");
    platoon.setTechBase(clan ? "clan" : "is");
    if (type.includes("mixed")) notes.push("The file is Mixed technology; the platoon is built on its Clan chassis.");
    const faction = clan ? "clan" : "is";
    const year = numberOf(file, "year");
    if (year > 0) {
        const era = platoon.getAvailableEras().find((item) => item.yearStart <= year && (item.yearEnd ?? Infinity) >= year);
        if (era) platoon.setEra(era.tag);
    }

    // Motion type, squad size and count.
    const motion = blkValue(file, "motion_type").trim();
    const motive = INFANTRY_MOTIVES[key(motion)];
    const beastName = /^beast:/i.test(motion) ? motion.replace(/^beast:/i, "").trim() : "";
    if (beastName) {
        // A creature of the table (TO:AUE p.106); MegaMek writes the table's own names, and a custom creature is not on it.
        const beastMount = findInfantryBeastMount(beastName);
        if (!beastMount || !platoon.setMount(beastMount.tag)) issues.push(INFANTRY_BLK_UNSUPPORTED.beast(motion));
    } else if (!motive) issues.push(INFANTRY_BLK_UNSUPPORTED.motive(motion));
    else platoon.setMotive(motive);

    // Specialization (TO:AUE pp.152-153, 162): MegaMek's bit mask, read before the squads, whose size it limits. SCUBA is a motive here: the
    // motion types Motorized SCUBA and Submarine carry its bit alone, a foot file with the bit is standard SCUBA, and a beast of the water
    // (a Hipposaur, an Orca) carries it because its riders need SCUBA gear (TO:AUE p.106).
    const bits = numberOf(file, "specialization", 0);
    const bitSet = (bit: number): boolean => (bits & bit) !== 0;
    const tasks: InfantryEngineerTask[] = INFANTRY_ENGINEER_TASKS.filter((task) => bitSet(task.bit)).map((task) => task.tag);
    const knownBits = INFANTRY_ENGINEER_TASKS.reduce((sum, task) => sum | task.bit, 0) | Object.values(INFANTRY_SPECIALIZATION_BITS).reduce((sum, bit) => sum | bit, 0);
    if ((bits & ~knownBits) !== 0) issues.push(INFANTRY_BLK_UNSUPPORTED.specialization(`bit mask ${bits} has bits this builder does not know`));
    if (bitSet(INFANTRY_SPECIALIZATION_BITS.scuba) && !platoon.getMotive().scuba && !platoon.isBeastMounted()) {
        if (platoon.getMotive().tag === "foot") platoon.setMotive("scuba");
        else issues.push(INFANTRY_BLK_UNSUPPORTED.specialization("SCUBA needs the foot, SCUBA or submarine motion types"));
    }
    const specialtyFor: [number, string][] = [[INFANTRY_SPECIALIZATION_BITS.marines, "marines"], [INFANTRY_SPECIALIZATION_BITS.mountain, "mountain"], [INFANTRY_SPECIALIZATION_BITS.paratroops, "paratroops"]];
    if (tasks.length > 0) {
        if (!platoon.setSpecialty("engineers", true) || !platoon.setEngineerTasks(tasks)) issues.push(INFANTRY_BLK_UNSUPPORTED.specialization(`Combat Engineers cannot go on ${platoon.getMotive().name} infantry`));
    }
    for (const [bit, tag] of specialtyFor) {
        if (bitSet(bit) && !platoon.setSpecialty(tag, true)) issues.push(INFANTRY_BLK_UNSUPPORTED.specialization(`${platoon.getSpecialtyBar(tag) ?? tag}`));
    }
    const squadSize = numberOf(file, "squad_size", 1);
    const squads = numberOf(file, "squadn", 1);
    // A Very Large or Monstrous creature carries a whole squad of its own (TO:AUE p.107); a file that lists its riders in smaller squads
    // (the Hipposaur files, 4 squads of 2 for 2 creatures of 4) is read as the creatures' squads, the troopers the same.
    const creatureRiders = platoon.getBeastSize()?.troopsPerCreature ?? 1;
    const regrouped = creatureRiders > 1 && squadSize !== creatureRiders && (squadSize * squads) % creatureRiders === 0;
    if (regrouped) {
        notes.push(`The file lists ${squads} squads of ${squadSize}; each ${platoon.getMount()?.name} carries ${creatureRiders} riders, so the platoon is ${(squadSize * squads) / creatureRiders} squads of ${creatureRiders} (TO:AUE p.107).`);
        platoon.setSquadSize(creatureRiders);
        platoon.setSquads((squadSize * squads) / creatureRiders);
    } else {
        platoon.setSquadSize(squadSize);
        platoon.setSquads(squads);
    }
    if (!regrouped && (platoon.getSquadSize() !== squadSize || platoon.getSquads() !== squads)) {
        issues.push(`${squads} squads of ${squadSize} are not allowed for ${platoon.getMotive().name} infantry here; ${platoon.getSquads()} of ${platoon.getSquadSize()} used.`);
    }

    // Augmentation first: it decides how many secondary weapons a squad may carry.
    importInfantryAugmentation(platoon, file, issues);

    // Mixed technology (TO:AUE p.189, Advanced): a file that carries the other base's weapon or armor kit is built as a mixed
    // platoon on its own base, said once in the notes.
    const mixFor = (item: { name: string; techBase: string }): void => {
        if (platoon.isMixedTech() || item.techBase !== (clan ? "is" : "clan")) return;
        platoon.setMixedTech(true);
        notes.push(`${item.name} is ${clan ? "Inner Sphere" : "Clan"} equipment: the platoon is built with mixed technology (TO:AUE p.189, Advanced).`);
    };

    // Weapons: the primary, and the secondary with its count per squad.
    const primary = blkValue(file, "Primary").trim();
    const primaryWeapon = findInfantryWeaponByName(primary, faction);
    if (primaryWeapon) mixFor(primaryWeapon);
    if (!primaryWeapon) issues.push(`Primary weapon "${primary}" has no match in this catalog.`);
    else if (!platoon.setPrimaryWeapon(primaryWeapon.tag)) issues.push(`Primary weapon "${primary}" cannot be carried by this platoon (${platoon.getMotive().name}, ${platoon.getTechName()}).`);
    const secondary = blkValue(file, "Secondary").trim();
    // A file with a secondn but no secondary weapon is a legacy file (BLKInfantryFile): nothing to carry.
    // TAG troops (TO:AUE p.153): MegaMek writes them as an InfantryTAG secondary weapon (and sets the TAG specialization from it); the
    // secondn of them in a squad are the TAG troopers, who replace secondary weapon troopers and carry no weapon of the platoon.
    const tagSecondary = key(secondary) === "infantrytag";
    if (tagSecondary) {
        const perSquad = numberOf(file, "secondn", 0);
        if (!platoon.setTagTroopersPerSquad(perSquad) || perSquad === 0) issues.push(INFANTRY_BLK_UNSUPPORTED.specialization(`${perSquad} TAG troopers a squad do not fit this platoon (at most 2 a squad, in its secondary weapon slots)`));
    } else if (bitSet(INFANTRY_SPECIALIZATION_BITS.tag)) {
        // The flag with no TAG weapon line and no count: 2 a squad, the number TAG troops need to work (p.153 note), taken and reported.
        if (platoon.setTagTroopersPerSquad(2)) notes.push("The file says TAG troops and not how many: 2 a squad are taken, the number TAG needs to work (TO:AUE p.153).");
        else issues.push(INFANTRY_BLK_UNSUPPORTED.specialization("TAG troops have no secondary weapon slots to take on this platoon"));
    }
    if (secondary && !tagSecondary) {
        const secondaryWeapon = findInfantryWeaponByName(secondary, faction);
        if (secondaryWeapon) mixFor(secondaryWeapon);
        const perSquad = Math.round(numberOf(file, "secondn", 0) * (regrouped ? squads / platoon.getSquads() : 1));
        if (!secondaryWeapon) issues.push(`Secondary weapon "${secondary}" has no match in this catalog.`);
        else if (!platoon.setSecondaryWeapon(secondaryWeapon.tag)) issues.push(`Secondary weapon "${secondary}" cannot be carried by this platoon (${platoon.getMotive().name}, ${platoon.getTechName()}).`);
        else {
            platoon.setSecondaryPerSquad(perSquad);
            const limiter = platoon.getSecondarySlotLimiter();
            const slots = platoon.getSecondarySlotsPerSquad();
            if (platoon.getSecondaryPerSquad() !== perSquad && perSquad > 0) {
                issues.push(limiter && perSquad > slots && !platoon.isBeastMounted()
                    ? `${perSquad} ${secondary} per squad are over the ${slots} secondary weapon${slots === 1 ? "" : "s"} a squad of ${limiter.name} may carry (TO:AUE p.${limiter.page}); ${platoon.getSecondaryPerSquad()} used.`
                    : `${perSquad} ${secondary} per squad are over what a squad of ${platoon.getSquadSize()} can crew; ${platoon.getSecondaryPerSquad()} used.`);
            }
        }
    }

    // Troopers Equipment: the Anti-'Mech kit, the armor kit, and what the platoon has no place for.
    let kit: IInfantryArmor | null = null;
    let antiMech = false;
    for (const rawLine of blkLines(file, "troopers equipment")) {
        const line = rawLine.trim();
        if (!line) continue;
        if (key(line) === "antimekgear") {
            antiMech = true;
            continue;
        }
        // Combat engineer tools come with their task (MegaMek adds them with the specialization); a tool with no task is reported.
        const tool = INFANTRY_ENGINEER_TASKS.find((task) => task.gear && key(task.gear) === key(line));
        if (tool) {
            if (!tasks.includes(tool.tag)) issues.push(INFANTRY_BLK_UNSUPPORTED.specialization(`"${line}" is ${tool.name} engineer gear and the file's specialization has no ${tool.name} task`));
            continue;
        }
        const armor = findInfantryArmorByName(line);
        if (armor && !kit) {
            kit = armor;
            continue;
        }
        issues.push(`"${line}" (Troopers Equipment) has no match in this catalog and was left off.`);
    }
    // An old file marks the kit by an Anti-'Mech skill better than 8.
    if (has("antimek") && numberOf(file, "antimek", 8) !== 8) antiMech = true;

    // The armor flags describe the kit; one that differs from the kit's own row is custom armor.
    const flagStealth = (["camo", "ir", "ecm"] as const).filter((system) => has(`sneak${system}`));
    const flagDest = has("dest");
    // A beast-mounted file writes the divisor of the armor and the creature together (the creature is not custom armor).
    const mountDivisor = platoon.getMountDamageDivisor();
    const flagDivisorRaw = has("armordivisor") ? Number(blkValue(file, "armordivisor")) : undefined;
    const flagDivisor = flagDivisorRaw !== undefined && mountDivisor !== 1 && flagDivisorRaw === mountDivisor && !kit ? undefined : flagDivisorRaw;
    const flagEncumbering = has("encumberingarmor");
    const flagSpace = has("spacesuit");
    if (!kit && (flagStealth.length > 0 || flagDest) && !flagEncumbering && !flagSpace && flagDivisor === undefined) {
        // A sneak suit written as its flags alone.
        kit = infantryArmor.find((armor) => armor.group === "sneak" && flagDest === armor.stealth.includes("dest")
            && armor.stealth.filter((system) => system !== "dest").length === flagStealth.length
            && flagStealth.every((system) => armor.stealth.includes(system))) ?? null;
        if (!kit) issues.push(INFANTRY_BLK_UNSUPPORTED.customArmor(`stealth ${[...flagStealth, ...(flagDest ? ["DEST"] : [])].join("/")}`));
    } else if (!kit && (flagStealth.length > 0 || flagDest || flagEncumbering || flagSpace || flagDivisor !== undefined)) {
        issues.push(INFANTRY_BLK_UNSUPPORTED.customArmor("flags without an armor kit"));
    } else if (kit) {
        const differs: string[] = [];
        if (flagEncumbering !== kit.encumbering) differs.push(flagEncumbering ? "encumbering" : "not encumbering");
        if (flagSpace !== kit.vacuum) differs.push(flagSpace ? "space suit" : "not a space suit");
        if (flagDivisor !== undefined && flagDivisor !== kit.damageDivisor && flagDivisor !== kit.damageDivisor * mountDivisor) differs.push(`damage divisor ${flagDivisor}`);
        const kitStealth = kit.stealth.filter((system) => system !== "dest");
        if (flagDest !== kit.stealth.includes("dest") || flagStealth.length !== kitStealth.length || !flagStealth.every((system) => kitStealth.includes(system))) differs.push("stealth systems");
        if (differs.length > 0) issues.push(INFANTRY_BLK_UNSUPPORTED.customArmor(`${kit.name}: ${differs.join(", ")}`));
    }
    if (kit) mixFor(kit);
    if (kit && !platoon.setArmor(kit.tag)) issues.push(`${kit.name} cannot be worn by ${platoon.getTechName()} infantry.`);
    if (antiMech && !platoon.setAntiMechKit(true)) issues.push("The Anti-'Mech kit cannot be carried by mechanized infantry.");

    // The creature limits of a beast-mounted platoon (creatures per platoon, TO:AUE p.107).
    for (const issue of platoon.getIssues()) if (platoon.isBeastMounted() && issue.includes("TO:AUE p.107")) issues.push(issue);

    // Paramedics (TO:AUE p.153): the file has the flag and no count; one a squad is taken, and a secondary weapon gives up its slot for each.
    if (bitSet(INFANTRY_SPECIALIZATION_BITS.paramedics)) {
        const weapons = platoon.getSecondaryPerSquad();
        if (!platoon.setParamedicsPerSquad(1)) issues.push(INFANTRY_BLK_UNSUPPORTED.specialization("paramedics have no secondary weapon slot to take on this platoon"));
        else notes.push(`The file says the platoon has paramedics and not how many: one a squad is taken${weapons > platoon.getSecondaryPerSquad() ? `, which leaves ${platoon.getSecondaryPerSquad()} of its ${weapons} secondary weapons a squad` : ""} (TO:AUE p.153).`);
    }
    // XCT troops (TO:AUE p.162): the file does not name the environment, so the first of vacuum, toxic, cold, hot, liquid and tainted that its
    // armor kit and platoon suit is taken.
    if (bitSet(INFANTRY_SPECIALIZATION_BITS.xct)) {
        const order = ["vacuum", "toxic", "cold", "hot", "liquid", "tainted"].map((tag) => INFANTRY_XCT_ENVIRONMENTS.find((item) => item.tag === tag)!);
        const chosen = order.find((environment) => platoon.setXCT(environment.tag) && platoon.getXCTProblem() === null);
        if (chosen) notes.push(`The file says XCT troops and not which environment: ${chosen.name} is taken from the armor kit; the kit also suits ${order.filter((item) => item.tag !== chosen.tag && !!platoon.getArmor() && item.armor.includes(platoon.getArmor()!.tag)).map((item) => item.name).join(", ") || "no other"} (TO:AUE p.162).`);
        else { platoon.setXCT(""); issues.push(INFANTRY_BLK_UNSUPPORTED.specialization(`XCT troops wear ${platoon.getArmor()?.name ?? "no armor kit"}, which suits no XCT environment`)); }
    }
    // Specialists must be Veteran or better (TO:AUE p.152): the platoon is set to the Veteran skills, as the file names none.
    if (platoon.isSpecialized()) {
        platoon.setGunnery(INFANTRY_VETERAN_GUNNERY);
        platoon.setAntiMechSkill(INFANTRY_VETERAN_ANTI_MECH);
        notes.push("Specialized infantry must be Veteran or better (TO:AUE p.152): Gunnery 3 and Anti-'Mech 4 are set; the Battle Value is the unit's, before skill.");
    }

    // What the platoon cannot carry yet.
    importInfantryFieldGuns(platoon, blkLines(file, "field guns equipment").map((line) => line.trim()).filter((line) => line), faction, issues, mixFor);
    // What the augmentation breaks (a combination the book bars, an implant not yet in the era) is reported with the file.
    for (const issue of platoon.getIssues()) if (issue.includes("IO:AE")) issues.push(issue);
    if (has("disposableweapon")) issues.push(INFANTRY_BLK_UNSUPPORTED.disposableWeapon(blkValue(file, "disposableWeapon")));
    if (has("armor_name") || has("infantryarmor")) issues.push(INFANTRY_BLK_UNSUPPORTED.customArmor("a named or numbered custom armor"));

    // The readout: the file's text, with its role and source added to the notes.
    const readout = readBlkTechnicalReadout(file);
    const role = blkValue(file, "role").trim();
    const source = blkValue(file, "source").trim();
    const extra = [role && key(role) !== "none" ? `Role: ${role}.` : "", source ? `Source: ${source}.` : ""].filter((line) => line);
    if (extra.length > 0) readout.text = { ...readout.text, notes: [readout.text?.notes, ...extra].filter((part) => part).join("\n\n") };
    platoon.tro.import(readout);
    return { platoon, issues, notes };
};
