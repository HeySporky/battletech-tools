// JumpShip, WarShip and space station construction (Strategic Operations: Advanced Aerospace Rules pp.130-149).
// They build on the DropShip steps (TM pp.180-197): quarters, transport bays, escape systems, capital weapons and
// capital armor come from the same tables (small-craft-construction.ts, capital-weapons.ts, aerospace-armor-types.ts).

import { roundUpToHalfTon } from "./small-craft-construction";

export type AdvancedAerospaceType = "jumpShip" | "warShip" | "spaceStation";

export interface IAdvancedAerospaceTypeData {
    tag: AdvancedAerospaceType;
    name: string;
    /** Weight range and step in tons (Advanced Aerospace Unit Types Table, SO:AA p.133). */
    minTons: number;
    maxTons: number;
    tonsStep: number;
    /** Weapons each firing arc holds before expanded fire control is needed (SO:AA p.133, errata v5.0). */
    weaponsPerArc: number;
    /** Structural Integrity weight: tonnage / this for a fixed SI of 1 (SO:AA p.134); null for a WarShip. */
    siDivisor: number | null;
    /** Engine Mass Factor (Advanced Aerospace Unit Base Engine Formulae, SO:AA p.135). */
    engineFactor: number;
    /** Controls weigh tonnage x this, rounded up to the ton (Advanced Aerospace Control Systems Table, SO:AA p.137). */
    controlsFactor: number;
    /** Maximum armor tons = SI weight / divisor + bonus, rounded down to the half ton (SO:AA p.140). */
    armorDivisor: number;
    armorBonusTons: number;
    /** Base crew = fixed + 1 per this many tons, rounded up (Advanced Aerospace Unit Minimum Crew Table, SO:AA p.138). */
    baseCrew: number;
    tonsPerCrew: number;
    /** Bay doors = fixed + tonnage / this, rounded up (Advanced Aerospace Unit Maximum Bay Doors Table, SO:AA p.143). */
    baseBayDoors: number;
    tonsPerBayDoor: number;
    /** Final cost multiplier (Advanced Aerospace Unit Final Costs Table, SO:AA p.146). */
    costMultiplier: number;
    /** Defensive Battle Rating unit type modifier (SO:AA p.149). */
    bvTypeModifier: number;
}

export const advancedAerospaceTypes: IAdvancedAerospaceTypeData[] = [
    {
        tag: "jumpShip", name: "JumpShip", minTons: 50000, maxTons: 500000, tonsStep: 1000, weaponsPerArc: 12,
        siDivisor: 150, engineFactor: 0.012, controlsFactor: 0.0025, armorDivisor: 12, armorBonusTons: 0,
        baseCrew: 6, tonsPerCrew: 20000, baseBayDoors: 7, tonsPerBayDoor: 50000, costMultiplier: 1.25, bvTypeModifier: 0.75,
    },
    {
        tag: "warShip", name: "WarShip", minTons: 100000, maxTons: 2500000, tonsStep: 10000, weaponsPerArc: 20,
        siDivisor: null, engineFactor: 0.06, controlsFactor: 0.0025, armorDivisor: 50, armorBonusTons: 0,
        baseCrew: 45, tonsPerCrew: 5000, baseBayDoors: 8, tonsPerBayDoor: 100000, costMultiplier: 2, bvTypeModifier: 0.8,
    },
    {
        tag: "spaceStation", name: "Space Station", minTons: 2000, maxTons: 2500000, tonsStep: 500, weaponsPerArc: 20,
        siDivisor: 100, engineFactor: 0.012, controlsFactor: 0.001, armorDivisor: 3, armorBonusTons: 60,
        baseCrew: 45, tonsPerCrew: 5000, baseBayDoors: 8, tonsPerBayDoor: 75000, costMultiplier: 5, bvTypeModifier: 0.7,
    },
];
export const getAdvancedAerospaceType = (tag: AdvancedAerospaceType): IAdvancedAerospaceTypeData =>
    advancedAerospaceTypes.find((type) => type.tag === tag) ?? advancedAerospaceTypes[0];

/**
 * Armor facings: six on every type (SO:AA p.140). Firing arcs: the same six on a JumpShip or station, plus the two
 * broadsides on a WarShip (Advanced Aerospace Unit Record Sheet Table, SO:AA p.133). The weapon bay text on p.142
 * also gives JumpShips the broadsides; the table, and the SO errata v3.02 that struck them from it, do not, and
 * errata v5.0 is silent. The book disagrees with itself, so MegaMek decides: broadsides on WarShips only.
 */
export type AdvancedAerospaceFacing = "nose" | "foreLeft" | "foreRight" | "aftLeft" | "aftRight" | "aft";
export const ADVANCED_AEROSPACE_FACINGS: AdvancedAerospaceFacing[] = ["nose", "foreLeft", "foreRight", "aftLeft", "aftRight", "aft"];
export type AdvancedAerospaceArc = AdvancedAerospaceFacing | "leftBroadside" | "rightBroadside";
export const getAdvancedAerospaceArcs = (type: AdvancedAerospaceType): AdvancedAerospaceArc[] => type === "warShip"
    ? ["nose", "foreLeft", "foreRight", "leftBroadside", "rightBroadside", "aftLeft", "aftRight", "aft"]
    : [...ADVANCED_AEROSPACE_FACINGS];
export const ADVANCED_AEROSPACE_ARC_NAMES: Record<AdvancedAerospaceArc, string> = {
    nose: "Nose", foreLeft: "Fore-Left", foreRight: "Fore-Right", leftBroadside: "Left Broadside",
    rightBroadside: "Right Broadside", aftLeft: "Aft-Left", aftRight: "Aft-Right", aft: "Aft",
};
/**
 * The arcs in order around the hull, going left from the nose, for Battle Value (SO:AA p.149): a WarShip's broadsides
 * sit between its fore and aft sides. The arc opposite another is half way round.
 */
export const getAdvancedAerospaceArcRing = (type: AdvancedAerospaceType): AdvancedAerospaceArc[] => type === "warShip"
    ? ["nose", "foreLeft", "leftBroadside", "aftLeft", "aft", "aftRight", "rightBroadside", "foreRight"]
    : ["nose", "foreLeft", "aftLeft", "aft", "aftRight", "foreRight"];
/** The Battle Value "front" is the strongest of these: a WarShip's nose, aft or broadsides, any arc on the others (SO:AA p.149). */
export const getAdvancedAerospaceFrontArcCandidates = (type: AdvancedAerospaceType): AdvancedAerospaceArc[] => type === "warShip"
    ? ["nose", "aft", "leftBroadside", "rightBroadside"]
    : getAdvancedAerospaceArcRing(type);

/** Side weapons match the other side (SO:AA p.142). */
export const ADVANCED_AEROSPACE_OPPOSITE_ARC: Partial<Record<AdvancedAerospaceArc, AdvancedAerospaceArc>> = {
    foreLeft: "foreRight", foreRight: "foreLeft", leftBroadside: "rightBroadside", rightBroadside: "leftBroadside",
    aftLeft: "aftRight", aftRight: "aftLeft",
};

const roundUpToTon = (tons: number): number => Math.ceil(tons - 1e-9);
const roundDownToHalfTon = (tons: number): number => Math.floor(tons * 2 + 1e-9) / 2;

/** Maximum Thrust is Safe Thrust x 1.5, rounded up; station-keeping drives have none (SO:AA p.135). */
export const getAdvancedAerospaceMaxThrust = (type: AdvancedAerospaceType, safeThrust: number): number =>
    type === "warShip" ? Math.ceil(safeThrust * 1.5) : 0;

/** A WarShip's Structural Integrity runs from its Maximum Thrust to 30 times it; the others have 1 (SO:AA pp.134, 136). */
export const ADVANCED_AEROSPACE_MAX_SI_FACTOR = 30;

/** Structural Integrity weight, rounded up to the half ton (SO:AA pp.134, 136). */
export const getAdvancedAerospaceStructureWeight = (type: AdvancedAerospaceType, tonnage: number, structuralIntegrity: number): number => {
    const divisor = getAdvancedAerospaceType(type).siDivisor;
    return roundUpToHalfTon(divisor === null ? structuralIntegrity * tonnage / 1000 : tonnage / divisor);
};

/** Engine weight, rounded up to the half ton: a WarShip's maneuvering drive also scales with Safe Thrust (SO:AA p.135). */
export const getAdvancedAerospaceEngineWeight = (type: AdvancedAerospaceType, tonnage: number, safeThrust: number): number =>
    roundUpToHalfTon(getAdvancedAerospaceType(type).engineFactor * tonnage * (type === "warShip" ? safeThrust : 1));

/**
 * Fuel points a ton and tons a burn-day at 1 G by weight (Advanced Aerospace Unit Fuel Table, SO:AA p.135):
 * [lowest tonnage, points a ton, tons a day]. The table prints the fourth row as "200,000 to 249,000"; the next row
 * starts "Over 249,999", so it is read as 249,999.
 */
const ADVANCED_AEROSPACE_FUEL: [number, number, number][] = [
    [250000, 2.5, 39.52], [200000, 5, 39.52], [110000, 5, 19.75], [100000, 10, 19.75], [50000, 10, 9.77], [0, 10, 2.82],
];
const fuelRow = (tonnage: number): [number, number, number] => ADVANCED_AEROSPACE_FUEL.find(([tons]) => tonnage >= tons) ?? ADVANCED_AEROSPACE_FUEL[5];
export const getAdvancedAerospaceFuelPointsPerTon = (tonnage: number): number => fuelRow(tonnage)[1];
/** Space stations and JumpShips burn a tenth as much holding station (SO:AA p.135). */
export const getAdvancedAerospaceStrategicFuelPerDay = (type: AdvancedAerospaceType, tonnage: number): number =>
    type === "warShip" ? fuelRow(tonnage)[2] : fuelRow(tonnage)[2] / 10;
/** Fuel comes in half tons; fuel and pumps weigh the fuel x 1.02, rounded up to the ton (SO:AA p.135). */
export const getAdvancedAerospaceFuelPumpWeight = (fuelTons: number): number => roundUpToTon(fuelTons * 1.02) - fuelTons;

/**
 * Kearny-Fuchida drive (Kearny-Fuchida Drive Table, SO:AA p.137): a JumpShip's standard drive or a WarShip's compact
 * one, and the jump sail. JumpShips and WarShips must have one (SO:AA errata v5.0, p.136). A space station with energy storage batteries may carry a sail as a JumpShip of its size.
 * Weights and integrities round up to the whole number.
 */
export const getKFDriveWeight = (type: AdvancedAerospaceType, tonnage: number): number =>
    type === "jumpShip" ? roundUpToTon(tonnage * 0.95) : type === "warShip" ? roundUpToTon(tonnage * 0.4525) : 0;
export const getKFDriveIntegrity = (type: AdvancedAerospaceType, tonnage: number): number => {
    const drive = getKFDriveWeight(type, tonnage);
    if (!drive) return 0;
    return Math.ceil((type === "jumpShip" ? 1.2 + drive / 60000 : 2 + drive / 25000) - 1e-9);
};
export const getJumpSailWeight = (type: AdvancedAerospaceType, tonnage: number): number =>
    roundUpToTon(30 + tonnage / (type === "warShip" ? 20000 : 7500));
export const getJumpSailIntegrity = (sailTons: number): number => Math.ceil(1 + sailTons / 20 - 1e-9);

/** Controls, rounded up to the whole ton (SO:AA p.137). */
export const getAdvancedAerospaceControlsWeight = (type: AdvancedAerospaceType, tonnage: number): number =>
    roundUpToTon(tonnage * getAdvancedAerospaceType(type).controlsFactor);

/**
 * Crew (Advanced Aerospace Unit Minimum Crew Table, SO:AA p.138): the base crew, plus a gunner for every six
 * standard weapons and one for each capital weapon; one in six of the whole crew is an officer, rounded up.
 */
export const getAdvancedAerospaceBaseCrew = (type: AdvancedAerospaceType, tonnage: number): number => {
    const data = getAdvancedAerospaceType(type);
    return data.baseCrew + Math.ceil(tonnage / data.tonsPerCrew - 1e-9);
};
export const getAdvancedAerospaceMinimumGunners = (standardWeapons: number, capitalWeapons: number): number =>
    Math.ceil(standardWeapons / 6 - 1e-9) + capitalWeapons;
export const getAdvancedAerospaceMinimumOfficers = (crew: number): number => Math.ceil(crew / 6 - 1e-9);
/** Crew an item needs beyond the gunners (Additional Crew, SO:AA p.138): communications by the ton, kitchens, MASH theaters. */
export const ADVANCED_AEROSPACE_ADDITIONAL_CREW = { communicationsPerTon: 1, fieldKitchen: 3, mashTheater: 5 };

/** Free heat sinks: 45 + the square root of engine tons x 2, rounded down (SO:AA p.139). */
export const getAdvancedAerospaceFreeHeatSinks = (engineTons: number): number => Math.floor(45 + Math.sqrt(engineTons * 2) + 1e-9);

/** Maximum armor in tons, rounded down to the half ton (Advanced Unit Armor Maximums, SO:AA p.140). */
export const getAdvancedAerospaceMaxArmorTons = (type: AdvancedAerospaceType, structureTons: number): number => {
    const data = getAdvancedAerospaceType(type);
    return roundDownToHalfTon(structureTons / data.armorDivisor + data.armorBonusTons);
};
/** Free capital armor on each facing: SI / 10, rounded normally (SO:AA p.140). */
export const getAdvancedAerospaceFreeArmorPerFacing = (structuralIntegrity: number): number => Math.max(0, Math.floor(structuralIntegrity / 10 + 0.5));
/** Capital armor points bought: tons x points a ton, rounded down (SO:AA p.140). */
export const getAdvancedAerospaceArmorPoints = (armorTons: number, pointsPerTon: number): number => Math.floor(armorTons * pointsPerTon + 1e-9);

/** Bay doors, rounded up (SO:AA p.143). */
export const getAdvancedAerospaceMaxBayDoors = (type: AdvancedAerospaceType, tonnage: number): number => {
    const data = getAdvancedAerospaceType(type);
    return data.baseBayDoors + Math.ceil(tonnage / data.tonsPerBayDoor - 1e-9);
};

/**
 * Docking collars: 1,000 tons each, one for every 50,000 tons of vessel, rounded up (Docking Hardpoint, TO:AUE p.116;
 * added to SO:AA p.142 by SO:AA errata v5.0, which also corrects the examples to 7 for the Odyssey and 39 for the
 * McKenna). A JumpShip or WarShip carries up to 100,000 tons on each collar (SO:AA p.142).
 */
export const DOCKING_COLLAR_TONS = 1000;
/** Energy storage batteries, space stations only: 100,000 tons and 1,000,000 C-bills each (TO:AUE pp.188, 221; SO:AA p.153). */
export const ENERGY_STORAGE_BATTERY_TONS = 100000;
export const ENERGY_STORAGE_BATTERY_COST = 1000000;
/** Ours (NGCFells, 2026-11-22, #152): expanded fire control costs this much a ton at Custom Homebrew and Munchkin; the books price none. */
export const FIRE_CONTROL_PRICE_PER_TON = 10000;
export const DOCKING_COLLAR_MAX_CARRIED_TONS = 100000;
export const getMaxDockingCollars = (tonnage: number): number => tonnage < 50000 ? 0 : Math.ceil(tonnage / 50000 - 1e-9);

/**
 * Grav decks (TO:AUE p.126): 50 tons under 100 meters across, 100 tons to 250 meters, 500 tons to 1,000 meters (a space
 * station only; JumpShips and WarShips go up to 250). Three decks, plus one for every 100,000 tons or part of it.
 */
export type GravDeckSize = "small" | "medium" | "large";
export const GRAV_DECKS: { tag: GravDeckSize; name: string; tons: number; cost: number; stationOnly: boolean }[] = [
    { tag: "small", name: "Grav Deck (under 100 m)", tons: 50, cost: 5000000, stationOnly: false },
    { tag: "medium", name: "Grav Deck (100-250 m)", tons: 100, cost: 10000000, stationOnly: false },
    { tag: "large", name: "Grav Deck (over 250 m)", tons: 500, cost: 40000000, stationOnly: true },
];
export const getMaxGravDecks = (tonnage: number): number => 3 + Math.ceil(tonnage / 100000 - 1e-9);

/** A lithium-fusion battery weighs 1 percent of the vessel (TO:AUE p.135). */
export const getLithiumFusionBatteryWeight = (tonnage: number): number => roundUpToHalfTon(tonnage * 0.01);

/**
 * Expanded fire control for an arc over its weapon limit: the arc's weapons / the limit, rounded down, x a tenth of
 * the arc's weapon tons (ammunition aside), rounded up to the half ton (SO:AA p.143).
 */
export const getAdvancedAerospaceFireControlWeight = (type: AdvancedAerospaceType, weaponCount: number, weaponTons: number): number => {
    const limit = getAdvancedAerospaceType(type).weaponsPerArc;
    return weaponCount > limit ? roundUpToHalfTon(Math.floor(weaponCount / limit) * 0.1 * weaponTons) : 0;
};
/** A weapon bay holds up to 700 standard (70 capital) damage (SO:AA p.142). */
export const ADVANCED_AEROSPACE_MAX_BAY_CAPITAL_DAMAGE = 70;

/**
 * Structural costs (Advanced Aerospace Unit Structural Costs and Availability, SO:AA p.146). A JumpShip or space
 * station has no Safe Thrust; its drive-unit line is priced at the 0.2 Thrust of station-keeping, which p.135 also gives as 0.1 G.
 */
export const STATION_KEEPING_THRUST = 0.2;
export interface IAdvancedAerospaceCostInput {
    type: AdvancedAerospaceType;
    tonnage: number;
    safeThrust: number;
    structuralIntegrity: number;
    engineTons: number;
    fuelTons: number;
    crewAndPassengers: number;
    arcsWithWeapons: number;
    dockingCollars: number;
    sailTons: number;
    kfIntegrity: number;
    lithiumFusionBattery: boolean;
    /** False for a custom monitor, which has no K-F drive to pay for. */
    kfDrive?: boolean;
}
export const getAdvancedAerospaceStructuralCosts = (input: IAdvancedAerospaceCostInput): { name: string; cost: number }[] => {
    const thrust = input.type === "warShip" ? input.safeThrust : STATION_KEEPING_THRUST;
    const costs = [
        { name: "Bridge", cost: 200000 + 10 * input.tonnage },
        { name: "Computer", cost: 200000 },
        { name: "Life Support", cost: 5000 * input.crewAndPassengers },
        { name: "Sensors", cost: 80000 },
        { name: "Fire Control Computer", cost: 100000 },
        { name: "Gunnery Control Systems", cost: 10000 * input.arcsWithWeapons },
        { name: "Structure", cost: 100000 * input.structuralIntegrity },
        { name: "Drive Unit", cost: 500 * thrust * (input.tonnage / 100) },
        { name: "Engine", cost: 1000 * input.engineTons },
        { name: "Engine Control Unit", cost: 1000 },
        { name: "Attitude Thrusters", cost: 25000 },
        { name: "Docking Collars", cost: 100000 * input.dockingCollars },
        { name: "Fuel Tanks", cost: 200 * input.fuelTons },
    ];
    if (input.type !== "spaceStation" && input.kfDrive !== false) {
        // A compact core multiplies every drive component by 5; a lithium-fusion battery makes it 3 (standard) or 15 (compact).
        const kfMultiplier = input.type === "warShip" ? (input.lithiumFusionBattery ? 15 : 5) : (input.lithiumFusionBattery ? 3 : 1);
        const kf = 60000000 + 75000000 * input.dockingCollars
            + 25000000 + 5000000 * input.dockingCollars
            + 50000000
            + 50000 * input.kfIntegrity
            + 50000 * input.sailTons
            + 500000 + 200000 * input.dockingCollars;
        costs.push({ name: "K-F Drive", cost: kf * kfMultiplier });
        costs.push({
            name: "K-F Drive Support Systems",
            cost: input.type === "warShip" ? 20000000 * (50 + input.tonnage / 10000) : 10000000 * (input.tonnage / 10000),
        });
    }
    return costs;
};
// Custom Homebrew (rules level 6): the monitor, a WarShip built without a K-F drive. The SLDF built prototypes in
// 2683 (project AMPHITRITE, XTRO: Boondoggles p.19), but no construction rules were published; these figures are this
// tool's, drawn from that account. Without the drive's frame acting as a keel the hull needed more structure, the
// monitors had double the crew, and one had to be carried between systems by a JumpShip, as a DropShip is.
/** The keel replacing the K-F drive's frame: half the structure's weight again, rounded up to the half ton. */
export const MONITOR_KEEL_STRUCTURE_FRACTION = 0.5;
/** A monitor's base crew is doubled. */
export const MONITOR_CREW_MULTIPLIER = 2;
export const getMonitorKeelWeight = (structureTons: number): number => Math.ceil(structureTons * MONITOR_KEEL_STRUCTURE_FRACTION * 2 - 1e-9) / 2;
/** A carrier holds a monitor on one docking collar for every 100,000 tons, rounded up (each collar carries up to 100,000 tons). */
export const getMonitorCarrierCollars = (tonnage: number): number => Math.ceil(tonnage / DOCKING_COLLAR_MAX_CARRIED_TONS - 1e-9);

/** A space station built to ride a JumpShip (a K-F boom, 100,000 tons at most) uses x20, not x5 (SO:AA p.139). */
export const getAdvancedAerospaceCostMultiplier = (type: AdvancedAerospaceType, kfBoom: boolean = false): number =>
    type === "spaceStation" && kfBoom ? 20 : getAdvancedAerospaceType(type).costMultiplier;

/**
 * Battle Value (SO:AA p.149): capital armor x 25 and capital SI x 20 in the Defensive Battle Rating; the Speed
 * Factor uses a Maximum Thrust of 0 for a station, 1 for a JumpShip and the real one for a WarShip.
 */
export const ADVANCED_AEROSPACE_BV_ARMOR_FACTOR = 25;
export const ADVANCED_AEROSPACE_BV_SI_FACTOR = 20;
export const getAdvancedAerospaceBVMaxThrust = (type: AdvancedAerospaceType, safeThrust: number): number =>
    type === "warShip" ? getAdvancedAerospaceMaxThrust(type, safeThrust) : type === "jumpShip" ? 1 : 0;

// ---- SDS (Caspar) drone control (IO:AE pp.134, 140-141; the Terran Hegemony Space Defense System drones, #150) -------------

export type SdsLevel = "none" | "standard" | "improved";
export type SdsCraftKind = "smallCraft" | "dropShip" | "spaceStation" | "warShip";

/** The SDS Drone Control System Equipment Table (IO:AE p.134): base skills, the percentage of the vessel on top of its controls, the extra percentage for the next skill step. */
export const SDS_DCS_TABLE: Record<SdsCraftKind, { name: string; gunnery: number; piloting: number; percent: number; improvedPercent: number; improvedGunnery: number; improvedPiloting: number }> = {
    smallCraft: { name: "Small Craft", gunnery: 5, piloting: 6, percent: 5, improvedPercent: 2, improvedGunnery: 4, improvedPiloting: 5 },
    dropShip: { name: "DropShip", gunnery: 5, piloting: 6, percent: 4, improvedPercent: 4, improvedGunnery: 4, improvedPiloting: 5 },
    spaceStation: { name: "Space Station", gunnery: 4, piloting: 5, percent: 8, improvedPercent: 4, improvedGunnery: 3, improvedPiloting: 4 },
    warShip: { name: "WarShip", gunnery: 4, piloting: 5, percent: 6, improvedPercent: 4, improvedGunnery: 3, improvedPiloting: 4 },
};
/** An SDS WarShip may weigh 800,000 tons at most (IO:AE p.134, table note). */
export const SDS_MAX_WARSHIP_TONS = 800000;
export const SDS_WARSHIP_LIMIT_MESSAGE = "An SDS (Caspar) WarShip may be 800,000 tons at most (IO:AE p.134).";
/** The self-destruct takes 10 percent of the drone, to at most 10,000 tons (IO:AE p.141); the SLDF Jammer weighs 30,000 tons (p.140). */
export const SDS_SELF_DESTRUCT_MAX_TONS = 10000;
export const SDS_JAMMER_TONS = 30000;
/** Experimental (IO:AE pp.134, 140, 141). */
export const SDS_RULES_LEVEL = 4;
/**
 * Prices (IO:AE p.215, Additional Alternate Era Weapons and Equipment, read from the page image): the SDS (Caspar) Drone
 * Control System 500,000 + (50,000 x IT), the SDS Self-Destruct System 1,000,000, the SDS Jammer System 800M. The IO:AE cost
 * rules say the Caspar price replaces the normal cockpit/crew systems (here the Bridge line; sensors and life support stay)
 * and that IT includes the unit's default controls with the Caspar share added to them.
 */
export const SDS_SELF_DESTRUCT_COST = 1000000;
export const SDS_JAMMER_COST = 800000000;
export const getSdsControlCost = (controlsTons: number, sdsTons: number): number => 500000 + 50000 * (controlsTons + sdsTons);

/** The control system on top of the standard controls: a percentage of the vessel, rounded up by the caller (IO:AE p.134). */
export const getSdsControlPercent = (kind: SdsCraftKind, level: SdsLevel): number => {
    if (level === "none") return 0;
    const row = SDS_DCS_TABLE[kind];
    return row.percent + (level === "improved" ? row.improvedPercent : 0);
};
export const getSdsSkills = (kind: SdsCraftKind, level: SdsLevel): { gunnery: number; piloting: number } => {
    const row = SDS_DCS_TABLE[kind];
    return level === "improved" ? { gunnery: row.improvedGunnery, piloting: row.improvedPiloting } : { gunnery: row.gunnery, piloting: row.piloting };
};
/** Weight with whole-percent arithmetic, so 10 percent of 420,000 tons is 42,000 and not 42,000.000000000007. */
export const getSdsControlWeight = (kind: SdsCraftKind, tonnage: number, level: SdsLevel, roundUp: (tons: number) => number): number =>
    roundUp(tonnage * getSdsControlPercent(kind, level) / 100 - 1e-9);
/** Steerage quarters for half the minimum crew of the human-operated equivalent, rounded up (IO:AE p.134). */
export const getSdsSupportQuarters = (minimumCrew: number): number => Math.ceil(Math.max(0, minimumCrew) / 2);
export const getSdsSelfDestructWeight = (tonnage: number): number => Math.min(SDS_SELF_DESTRUCT_MAX_TONS, Math.ceil(tonnage / 10 - 1e-9));
/** A ram that triggers the self-destruct adds Safe Thrust x tonnage to the rammed unit Structural Integrity, to 500 points (IO:AE p.141). */
export const getSdsRamDamage = (safeThrust: number, tonnage: number): number => Math.min(500, Math.max(0, safeThrust * tonnage));
/** Rules text a sheet or the creator shows beside an SDS drone. */
export const SDS_DRONE_NOTES: string[] = [
    "Operates by the standard rules for its unit type, as a human-operated unit; it does not use the Robotic Independent Command rules (IO:AE p.134).",
    "A functional SDS drone can never jump while its AI is active: an SDS WarShip still carries a K-F drive, and its crew must first receive a deactivation command from a friendly human-controlled ATAC unit, then a prepare-for-boarding command, and board it to engage the drive by hand (IO:AE p.134).",
    "Any time an SDS drone is not shut down before a jump, 2D6 on arrival against 12: failing by 8 or more it self-destructs, by 7 or less it goes rogue (IO:AE p.134).",
    "Its ECM zone is 1 hex larger than normal: 3 hexes for a WarShip, 2 for a DropShip, adjacent hexes for a Small Craft (IO:AE p.134).",
];
export const SDS_SELF_DESTRUCT_NOTES: string[] = [
    "Operates as the booby trap (TO:AUE p.109), located in the engine section and taking no critical slot; a ram that connects sets it off for Safe Thrust x tonnage extra Structural Integrity damage to the rammed unit, to 500 (IO:AE p.141).",
    "A critical hit to the aft section of a unit with it: on 12 or higher on another 2D6 it goes off, destroying the engine and damaging its own ship.",
    "A drone also sets it off when every engine critical is destroyed, at 98 percent or more Structural Integrity lost (rounded up), on losing control in a boarding action, or on a Destruct command from a friendly human-operated ATAC unit.",
];
