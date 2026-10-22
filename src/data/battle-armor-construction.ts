/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
 * All official lore, trademarks, and intellectual property belong strictly to
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders.
 * Any original, fan-made content or custom homebrew data processed by this tool
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for
 * tabletop gameplay assistance. Content processed by this file is not intended
 * to challenge any copyright or trademark status, and this data is explicitly
 * excluded from the software's underlying license (GNU GPLv3).
 */

// Battle armor construction tables (TechManual pp.160-173), structural costs (TM p.281) and the Battle Value
// tables battle armor reads (TM p.316).

export type BattleArmorWeightClass = "pa-l" | "light" | "medium" | "heavy" | "assault";
export type BattleArmorTechBase = "is" | "clan";
export type BattleArmorBodyType = "humanoid" | "quad";
export type BattleArmorMotive = "none" | "jump" | "vtol" | "umu";

export interface IBattleArmorMotiveLimit {
    maxMP: number;
    kgPerMP: number;
    costPerMP: number;
}

export interface IBattleArmorWeightClass {
    tag: BattleArmorWeightClass;
    name: string;
    /** Total suit weight in kilograms (Battle Armor Structure Weights Table, TM p.163). */
    minWeight: number;
    maxWeight: number;
    chassisWeight: { clan: number; is: number };
    /** Weapon slots: each arm and the body of a humanoid, the body of a quad (null: no quads in this class). */
    armSlots: number;
    bodySlots: number;
    quadSlots: number | null;
    /** Battle Armor Ground MP Table, TM p.164. */
    freeGroundMP: { humanoid: number; quad: number | null };
    maxGroundMP: { humanoid: number; quad: number | null };
    kgPerGroundMP: number;
    /** Battle Armor Non-Ground Motive Systems Table, TM p.165; null where the table reads NA. */
    jump: IBattleArmorMotiveLimit;
    vtol: IBattleArmorMotiveLimit | null;
    umu: IBattleArmorMotiveLimit;
    /** Battle Armor Structural Costs, TM p.281. */
    chassisCost: number;
}

export const BATTLE_ARMOR_GROUND_MP_COST = 25000;
/** Clan Technology Multiplier on chassis, motive systems, manipulators and armor (TM p.281). */
export const BATTLE_ARMOR_CLAN_COST_MULTIPLIER = 1.1;

export const battleArmorWeightClasses: IBattleArmorWeightClass[] = [
    {
        tag: "pa-l", name: "PA(L) / Exoskeleton", minWeight: 80, maxWeight: 400, chassisWeight: { clan: 130, is: 80 },
        armSlots: 2, bodySlots: 2, quadSlots: null,
        freeGroundMP: { humanoid: 1, quad: null }, maxGroundMP: { humanoid: 3, quad: null }, kgPerGroundMP: 25,
        jump: { maxMP: 3, kgPerMP: 25, costPerMP: 50000 }, vtol: { maxMP: 7, kgPerMP: 30, costPerMP: 50000 }, umu: { maxMP: 5, kgPerMP: 45, costPerMP: 50000 },
        chassisCost: 50000,
    },
    {
        tag: "light", name: "Light", minWeight: 401, maxWeight: 750, chassisWeight: { clan: 150, is: 100 },
        armSlots: 2, bodySlots: 4, quadSlots: 5,
        freeGroundMP: { humanoid: 1, quad: 2 }, maxGroundMP: { humanoid: 3, quad: 5 }, kgPerGroundMP: 30,
        jump: { maxMP: 3, kgPerMP: 25, costPerMP: 50000 }, vtol: { maxMP: 6, kgPerMP: 40, costPerMP: 50000 }, umu: { maxMP: 5, kgPerMP: 45, costPerMP: 50000 },
        chassisCost: 50000,
    },
    {
        tag: "medium", name: "Medium", minWeight: 751, maxWeight: 1000, chassisWeight: { clan: 250, is: 175 },
        armSlots: 3, bodySlots: 4, quadSlots: 7,
        freeGroundMP: { humanoid: 1, quad: 2 }, maxGroundMP: { humanoid: 3, quad: 5 }, kgPerGroundMP: 40,
        jump: { maxMP: 3, kgPerMP: 50, costPerMP: 75000 }, vtol: { maxMP: 5, kgPerMP: 60, costPerMP: 100000 }, umu: { maxMP: 4, kgPerMP: 85, costPerMP: 75000 },
        chassisCost: 100000,
    },
    {
        tag: "heavy", name: "Heavy", minWeight: 1001, maxWeight: 1500, chassisWeight: { clan: 400, is: 300 },
        armSlots: 3, bodySlots: 6, quadSlots: 9,
        freeGroundMP: { humanoid: 1, quad: 2 }, maxGroundMP: { humanoid: 2, quad: 4 }, kgPerGroundMP: 80,
        jump: { maxMP: 2, kgPerMP: 125, costPerMP: 150000 }, vtol: null, umu: { maxMP: 3, kgPerMP: 160, costPerMP: 100000 },
        chassisCost: 200000,
    },
    {
        tag: "assault", name: "Assault", minWeight: 1501, maxWeight: 2000, chassisWeight: { clan: 700, is: 550 },
        armSlots: 4, bodySlots: 6, quadSlots: 11,
        freeGroundMP: { humanoid: 1, quad: 2 }, maxGroundMP: { humanoid: 2, quad: 4 }, kgPerGroundMP: 160,
        jump: { maxMP: 2, kgPerMP: 250, costPerMP: 300000 }, vtol: null, umu: { maxMP: 2, kgPerMP: 250, costPerMP: 150000 },
        chassisCost: 400000,
    },
];

export const findBattleArmorWeightClass = (tag: string): IBattleArmorWeightClass =>
    battleArmorWeightClasses.find((entry) => entry.tag === tag) ?? battleArmorWeightClasses[0];

export type BattleArmorManipulatorKind = "none" | "glove" | "basic" | "claw" | "cargo" | "drill" | "salvage";

export interface IBattleArmorManipulator {
    tag: string;
    name: string;
    kind: BattleArmorManipulatorKind;
    /** Kilograms each; a cargo lifter weighs this for every half ton it lifts (Battle Armor Manipulator Weight Table, TM p.166). */
    kg: number;
    mustPair: boolean;
    /** C-bills an arm; a cargo lifter costs this for every half ton it lifts (TM p.281). */
    cost: number;
    /** Battle Value counted with Anti-'Mech attacks: "each" a manipulator, "pair" for the two (TM p.317). */
    bv?: { value: number; per: "each" | "pair" };
}

export const battleArmorManipulators: IBattleArmorManipulator[] = [
    { tag: "none", name: "None", kind: "none", kg: 0, mustPair: false, cost: 0 },
    { tag: "armored-glove", name: "Armored Glove", kind: "glove", kg: 0, mustPair: false, cost: 2500 },
    { tag: "basic", name: "Basic Manipulator", kind: "basic", kg: 0, mustPair: false, cost: 5000 },
    { tag: "basic-mine-clearance", name: "Basic Manipulator (w/ Mine Clearance)", kind: "basic", kg: 15, mustPair: true, cost: 7500 },
    { tag: "battle-claw", name: "Battle Claw", kind: "claw", kg: 15, mustPair: false, cost: 10000 },
    { tag: "battle-claw-magnets", name: "Battle Claw (w/ Magnets)", kind: "claw", kg: 35, mustPair: true, cost: 12500, bv: { value: 3, per: "pair" } },
    { tag: "battle-claw-vibro", name: "Battle Claw (w/ Vibro-Claws)", kind: "claw", kg: 50, mustPair: false, cost: 15000, bv: { value: 1, per: "each" } },
    { tag: "cargo-lifter", name: "Cargo Lifter", kind: "cargo", kg: 30, mustPair: true, cost: 500 },
    { tag: "heavy-battle-claw", name: "Heavy Battle Claw", kind: "claw", kg: 20, mustPair: false, cost: 25000 },
    { tag: "heavy-battle-claw-magnets", name: "Heavy Battle Claw (w/ Magnets)", kind: "claw", kg: 40, mustPair: true, cost: 31250, bv: { value: 3, per: "pair" } },
    { tag: "heavy-battle-claw-vibro", name: "Heavy Battle Claw (w/ Vibro-Claws)", kind: "claw", kg: 60, mustPair: false, cost: 30000, bv: { value: 1, per: "each" } },
    { tag: "industrial-drill", name: "Industrial Drill", kind: "drill", kg: 30, mustPair: false, cost: 2500 },
    { tag: "salvage-arm", name: "Salvage Arm", kind: "salvage", kg: 30, mustPair: false, cost: 50000 },
];

export const findBattleArmorManipulator = (tag: string): IBattleArmorManipulator =>
    battleArmorManipulators.find((entry) => entry.tag === tag) ?? battleArmorManipulators[0];

/** Modular equipment adaptor: 10 kg and 2 weapon slots in the arm it is fitted to (TM p.166); 10,000 C-bills (TM p.281). */
export const BATTLE_ARMOR_ADAPTOR = { kg: 10, slots: 2, cost: 10000 };

/** Modular/Turret Mounts (TM p.262) and their prices (TM p.297). */
export const BATTLE_ARMOR_MODULAR_MOUNT = { kg: 10, slots: 1, cost: 1000 };
export const BATTLE_ARMOR_AP_MOUNT = { kg: 5, slots: 1, cost: 500 };
export const BATTLE_ARMOR_TURRET = {
    minCapacity: 1,
    maxCapacity: 10,
    /** A standard turret mount weighs 40 kg at a capacity of 1 slot and 10 kg more for each slot after. */
    baseKg: 30,
    kgPerSlot: 10,
    slots: 1,
    costPerSlot: 2500,
    /** A configurable turret mount: +10 kg, +1 slot, -1 capacity; not at the 1-slot size. */
    configurable: { kg: 10, slots: 1, capacity: -1, cost: 2500 },
};
/** A squad support weapon mount takes this share of the weapon's weight, ammunition included, on every suit (TM p.270). */
export const BATTLE_ARMOR_SQUAD_SUPPORT_SHARE: Record<BattleArmorTechBase, number> = { is: 0.5, clan: 0.4 };
export const BATTLE_ARMOR_SQUAD_SUPPORT_COST = 5000;
/** Detachable missile pack: 10 kg on the launcher (TM p.171), 10,000 C-bills (TM p.297). */
export const BATTLE_ARMOR_DETACHABLE = { kg: 10, cost: 10000 };
/** Missile reloads take a weapon slot for every 4 shots, rounded up (TM p.171). */
export const BATTLE_ARMOR_SHOTS_PER_SLOT = 4;
export const BATTLE_ARMOR_MAX_SQUAD = 6;

/** Battle Armor Weapon Limits Table (TM p.170). */
export const BATTLE_ARMOR_WEAPON_LIMITS = {
    arm: { antiMech: 1, total: 2 },
    body: { antiMech: 2, antiPersonnel: 2 },
    quadBody: { antiMech: 4, antiPersonnel: 4 },
};

/** Recommended Battle Armor Formations Table (TM p.172). */
export const battleArmorFormations: { name: string; techBase: BattleArmorTechBase; troopers: number }[] = [
    { name: "Clan (All)", techBase: "clan", troopers: 5 },
    { name: "Inner Sphere: Generic / Mercenary", techBase: "is", troopers: 4 },
    { name: "Capellan Confederation", techBase: "is", troopers: 4 },
    { name: "Draconis Combine", techBase: "is", troopers: 4 },
    { name: "Federated Suns", techBase: "is", troopers: 4 },
    { name: "Free Rasalhague Republic", techBase: "is", troopers: 4 },
    { name: "Free Worlds League", techBase: "is", troopers: 4 },
    { name: "Lyran Alliance", techBase: "is", troopers: 4 },
    { name: "ComStar / Word of Blake", techBase: "is", troopers: 6 },
    { name: "Periphery (General)", techBase: "is", troopers: 4 },
    { name: "Marian Hegemony", techBase: "is", troopers: 5 },
    { name: "Taurian Concordat", techBase: "is", troopers: 4 },
    { name: "Calderon Protectorate", techBase: "is", troopers: 4 },
];

/** Battle Armor Unit Size Modifier Table (TM p.316), by troopers in the unit. */
export const BATTLE_ARMOR_UNIT_SIZE_BV: number[] = [0, 1.0, 2.2, 3.6, 5.2, 7.0, 9.0];

/** Speed Factor (TM p.316): (1 + (MP - 5) / 10) ^ 1.2, to two decimal places; battle armor reads its best MP. */
export const getBattleArmorSpeedFactor = (mp: number): number =>
    Math.round(Math.pow(1 + (mp - 5) / 10, 1.2) * 100) / 100;

/** Target movement modifier for hexes moved (TW p.117). */
export const getBattleArmorTargetMovementModifier = (hexes: number): number => {
    if (hexes >= 25) return 6;
    if (hexes >= 18) return 5;
    if (hexes >= 10) return 4;
    if (hexes >= 7) return 3;
    if (hexes >= 5) return 2;
    if (hexes >= 3) return 1;
    return 0;
};
