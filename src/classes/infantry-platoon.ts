import { generateUUID } from "../utils/generateUUID";
import { getEWarKind, normalizeEWarPlay, type IEWarGear, type IEWarPlayState } from "../utils/ewar-play";
import { IGameSettingsUnit, UnitGameSettings } from "./unit-game-settings";
import { chooseEraByTechBase } from "../data/era-choice";
import { TechnicalReadout } from "./technical-readout";
import type { ITechnicalReadoutExport } from "../data/technical-readout-interfaces";
import { IInfantryWeapon, INFANTRY_FIELD_GUN_RULES_LEVEL, INFANTRY_MAX_PRIMARY_DAMAGE, INFANTRY_SUPPORT_PPC_TAG, InfantryFieldGunKind, findFieldGunRecord, findFieldGunAmmo, findInfantryWeapon, getFieldGunAmmoOptions, getFieldGunCrew, getFieldGunKind, getFieldGunRecords, getFieldGunShotsPerTon, infantryWeapons, isInfantryWeaponAtRulesLevel, isInfantryWeaponAvailable } from "../data/infantry-weapons";
import type { IEquipmentItem } from "../data/data-interfaces";
import { getAllowedAlphaStrikeCodes, getAmmoBattleValuePerTon, getEquipmentRulesLevel } from "../data/equipment-registry";
import { btEraOptions, findEraByTag, getErasForTech } from "../data/era-options";
import { IEras } from "../data/data-interfaces";
import { DEFAULT_RULES_EDITION, getRulesEdition, getSelectableRulesEditionTag } from "../data/rules-editions";
import { IInfantryArmor, IInfantryAugmentation, INFANTRY_ARMOR_RULES_LEVEL, INFANTRY_STEALTH_SYSTEMS, IInfantryProstheticItem, findInfantryArmor, findInfantryAugmentation, findInfantryProstheticItem, infantryArmor, infantryAugmentations } from "../data/infantry-armor";
import { editionHasBattleValue, getBattleValueFor, getBattleValueSkillEdition, getSkillMultiplier, rateBattleValue1 } from "../data/battle-value";
import { CalcTrace, formatCalcNumber, formatCalcStep, type ICalcBreakdown, type ICalcStep } from "../data/calc-steps";
import { INFANTRY_BV1_ENGINEERS, INFANTRY_BV1_EQUIPMENT, INFANTRY_BV1_STANDARD_SIZE, INFANTRY_BV2_STEPS, INFANTRY_COST_STEPS, getInfantryBv1Class, getInfantryBv1Line, getInfantryBv1Steps } from "../data/calc-steps-infantry";
import { NO_BATTLE_VALUE_STEPS } from "../data/calc-steps-mech-bv1";
import { AlphaStrikeUnit, IASMULUnit } from "./alpha-strike-unit";

// Conventional infantry platoon construction (TechManual pp.144-155), Battle Value (TM p.309) and cost (TM pp.276, 282).

export type InfantryMotive = "foot" | "motorized" | "jump" | "mech-hover" | "mech-tracked" | "mech-wheeled" | "beast"
    | "microlite" | "microcopter" | "scuba" | "scuba-motorized" | "scuba-mech";
export type InfantryTechBase = "is" | "clan";

export interface IInfantryMotiveType {
    tag: InfantryMotive;
    name: string;
    maxSquadSize: number;
    maxPlatoonSize: number;
    mp: number;
    moveType: string;
    prohibitedTerrain: string;
    /** Tons per trooper, without Anti-'Mech kits (TM p.155). */
    weightPerTrooper: number;
    /** Fewest troopers the platoon may be broken into for transport. */
    minimumBreakdown: number;
    costMultiplier: number;
    mechanized: boolean;
    /** MP lost for carrying 2 support weapons per squad; foot platoons move or fire instead (TM p.151). */
    supportMPLoss: number;
    /** The rules level the motive needs, when above Standard (TO:AUE: the VTOL and SCUBA motives are Advanced). */
    rulesLevel?: number;
    /** Most squads in a platoon, where the book sets one (mechanized VTOL and SCUBA, TO:AUE pp.135, 153). */
    maxSquads?: number;
    /** Most secondary weapons a squad carries, where the book sets one (microlite 0, micro-copter 1, SCUBA 0/1/2). */
    maxSecondary?: number;
    /** The MP on the ground, for a motive whose MP above is its VTOL or submarine MP. */
    groundMP?: number;
    vtol?: boolean;
    scuba?: boolean;
    /** MP lost for carrying any support weapon (micro-copter, TO:AUE p.136). */
    supportAnyMPLoss?: number;
}

// Conventional Infantry Motive Types Table (TM p.145), Weight Table (p.155) and cost multipliers (p.282).
export const INFANTRY_MOTIVE_TYPES: IInfantryMotiveType[] = [
    { tag: "foot", name: "Foot", maxSquadSize: 10, maxPlatoonSize: 30, mp: 1, moveType: "Ground", prohibitedTerrain: "Water (Any)", weightPerTrooper: 0.085, minimumBreakdown: 1, costMultiplier: 1.0, mechanized: false, supportMPLoss: 0 },
    { tag: "motorized", name: "Motorized", maxSquadSize: 10, maxPlatoonSize: 30, mp: 3, moveType: "Ground", prohibitedTerrain: "Water (Any)", weightPerTrooper: 0.195, minimumBreakdown: 1, costMultiplier: 1.6, mechanized: false, supportMPLoss: 1 },
    { tag: "jump", name: "Jump", maxSquadSize: 10, maxPlatoonSize: 30, mp: 3, moveType: "Jump", prohibitedTerrain: "Water (Any)", weightPerTrooper: 0.165, minimumBreakdown: 1, costMultiplier: 2.6, mechanized: false, supportMPLoss: 1 },
    { tag: "mech-hover", name: "Mechanized (Hover)", maxSquadSize: 5, maxPlatoonSize: 20, mp: 5, moveType: "Hover", prohibitedTerrain: "Woods (Any)", weightPerTrooper: 1, minimumBreakdown: 5, costMultiplier: 3.2, mechanized: true, supportMPLoss: 1 },
    { tag: "mech-tracked", name: "Mechanized (Tracked)", maxSquadSize: 7, maxPlatoonSize: 28, mp: 3, moveType: "Tracked", prohibitedTerrain: "Woods (Heavy), Water (Depth 1+)", weightPerTrooper: 1, minimumBreakdown: 5, costMultiplier: 3.2, mechanized: true, supportMPLoss: 0 },
    { tag: "mech-wheeled", name: "Mechanized (Wheeled)", maxSquadSize: 6, maxPlatoonSize: 24, mp: 4, moveType: "Wheeled", prohibitedTerrain: "Rough, Rubble, Woods (Any), Water (Depth 1+)", weightPerTrooper: 1, minimumBreakdown: 5, costMultiplier: 3.2, mechanized: true, supportMPLoss: 1 },
    // Beast-mounted (TO:AUE p.106): the creature sets the MP, the movement type, the terrain, the squad and platoon sizes and the
    // weight; these are the figures before a creature is chosen (see getMotive).
    { tag: "beast", name: "Beast-Mounted", maxSquadSize: 10, maxPlatoonSize: 21, mp: 2, moveType: "Ground", prohibitedTerrain: "By creature", weightPerTrooper: 0.2, minimumBreakdown: 1, costMultiplier: 1.0, mechanized: false, supportMPLoss: 0 },
    // Mechanized VTOL infantry (TO:AUE pp.135-136): at most 4 squads, never broken below a squad; 1.5 and 2 tons a trooper (p.152;
    // p.225 gives +1.4 and +1.9 on the 0.1 ton foot trooper, the same weights); cost x4 and x4.5 (p.225). They may walk 1 MP as foot.
    { tag: "microlite", name: "Mechanized (Microlite VTOL)", maxSquadSize: 2, maxPlatoonSize: 8, mp: 6, moveType: "VTOL", prohibitedTerrain: "As VTOLs (TW p.54) in flight; Water (Any) on the ground", weightPerTrooper: 1.5, minimumBreakdown: 2, costMultiplier: 4, mechanized: true, supportMPLoss: 0, rulesLevel: 3, maxSquads: 4, maxSecondary: 0, groundMP: 1, vtol: true },
    { tag: "microcopter", name: "Mechanized (Micro-Copter VTOL)", maxSquadSize: 4, maxPlatoonSize: 16, mp: 5, moveType: "VTOL", prohibitedTerrain: "As VTOLs (TW p.54) in flight; Water (Any) on the ground", weightPerTrooper: 2, minimumBreakdown: 4, costMultiplier: 4.5, mechanized: true, supportMPLoss: 0, rulesLevel: 3, maxSquads: 4, maxSecondary: 1, groundMP: 1, vtol: true, supportAnyMPLoss: 1 },
    // SCUBA (TO:AUE p.153, Specialized Infantry Types Table): the added tons (0.05, 0.1, 0.9) are on the table's base of 0.1 ton, which
    // is the 0.085 ton foot trooper with its 0.015 ton kit; the weights here are the foot or mechanized weight plus those tons.
    { tag: "scuba", name: "SCUBA (Standard)", maxSquadSize: 10, maxPlatoonSize: 30, mp: 1, moveType: "Submarine", prohibitedTerrain: "Water (Depth 3+)", weightPerTrooper: 0.135, minimumBreakdown: 1, costMultiplier: 2, mechanized: false, supportMPLoss: 0, rulesLevel: 3, maxSquads: 4, maxSecondary: 0, groundMP: 1, scuba: true },
    { tag: "scuba-motorized", name: "SCUBA (Motorized)", maxSquadSize: 6, maxPlatoonSize: 12, mp: 2, moveType: "Submarine", prohibitedTerrain: "Water (Depth 3+)", weightPerTrooper: 0.185, minimumBreakdown: 1, costMultiplier: 2.5, mechanized: false, supportMPLoss: 0, rulesLevel: 3, maxSquads: 2, maxSecondary: 1, groundMP: 1, scuba: true },
    { tag: "scuba-mech", name: "SCUBA (Mechanized)", maxSquadSize: 5, maxPlatoonSize: 20, mp: 3, moveType: "Submarine", prohibitedTerrain: "Depth 0 and non-water hexes", weightPerTrooper: 1, minimumBreakdown: 5, costMultiplier: 3.2, mechanized: true, supportMPLoss: 0, rulesLevel: 3, maxSquads: 4, maxSecondary: 2, scuba: true },
];

export type InfantryBeastSize = "large" | "very-large" | "monstrous";

export interface IInfantryBeastSize {
    tag: InfantryBeastSize;
    name: string;
    /** Most troopers one creature carries; Very Large and Monstrous creatures are each a squad. */
    troopsPerCreature: number;
    creaturesPerPlatoon: number;
    /** Added to the to-hit number of attacks against the platoon. */
    toHit: number;
    /** Support weapons per creature (their crews halved, rounded up); a Large creature carries none. */
    supportWeapons: number;
    /** MP added to enter a building hex, and the CF the building takes per platoon entering, leaving and for each hex inside. */
    buildingMP: number;
    buildingCF: number;
    /** Anti-'Mech Leg and Swarm attacks the size allows. */
    leg: boolean;
    swarm: boolean;
}

// Creature Size Table (TO:AUE p.107, 7th printing).
export const INFANTRY_BEAST_SIZES: Record<InfantryBeastSize, IInfantryBeastSize> = {
    "large": { tag: "large", name: "Large", troopsPerCreature: 1, creaturesPerPlatoon: 21, toHit: 0, supportWeapons: 0, buildingMP: 0, buildingCF: 0, leg: true, swarm: true },
    "very-large": { tag: "very-large", name: "Very Large", troopsPerCreature: 2, creaturesPerPlatoon: 7, toHit: -1, supportWeapons: 2, buildingMP: 1, buildingCF: 2, leg: true, swarm: false },
    "monstrous": { tag: "monstrous", name: "Monstrous", troopsPerCreature: 4, creaturesPerPlatoon: 2, toHit: -2, supportWeapons: 3, buildingMP: 2, buildingCF: 4, leg: false, swarm: false },
};

export interface IInfantryBeastMount {
    tag: string;
    name: string;
    size: InfantryBeastSize;
    /** Tons per creature, riders not counted. */
    weight: number;
    mp: number;
    moveType: "Ground" | "Submarine" | "VTOL";
    /** Bonus damage at range 0: D6 against conventional infantry (burst-fire), and points per platoon against other units. */
    bonusVsInfantryDice: number;
    bonusVsOthers: number;
    damageDivisor: number;
    terrain: string;
    /** Page of TO:AUE. */
    page: number;
}

// Beast-Mounted Infantry Sample Types Table (TO:AUE p.106, 7th printing; read from the page image). The same eleven are the
// creatures of MegaMek's infantry files (InfantryMount), whose figures agree.
export const INFANTRY_BEAST_MOUNTS: IInfantryBeastMount[] = [
    { tag: "donkey", name: "Donkey", size: "large", weight: 0.15, mp: 2, moveType: "Ground", bonusVsInfantryDice: 0, bonusVsOthers: 0, damageDivisor: 1, terrain: "Water (Depth 1+)", page: 106 },
    { tag: "coventry-kangaroo", name: "Coventry Kangaroo", size: "large", weight: 0.11, mp: 3, moveType: "Ground", bonusVsInfantryDice: 1, bonusVsOthers: 1, damageDivisor: 1, terrain: "Water (Depth 1+)", page: 106 },
    { tag: "horse", name: "Horse", size: "large", weight: 0.5, mp: 3, moveType: "Ground", bonusVsInfantryDice: 0, bonusVsOthers: 0, damageDivisor: 1, terrain: "Water (Depth 1+)", page: 106 },
    { tag: "camel", name: "Camel", size: "large", weight: 0.65, mp: 2, moveType: "Ground", bonusVsInfantryDice: 0, bonusVsOthers: 0, damageDivisor: 1, terrain: "Water (Depth 1+)", page: 106 },
    { tag: "branth", name: "Branth", size: "large", weight: 0.72, mp: 6, moveType: "VTOL", bonusVsInfantryDice: 2, bonusVsOthers: 1, damageDivisor: 1, terrain: "As VTOLs (TW p.54)", page: 106 },
    { tag: "odessan-raxx", name: "Odessan Raxx", size: "large", weight: 2.4, mp: 2, moveType: "Ground", bonusVsInfantryDice: 1, bonusVsOthers: 1, damageDivisor: 1, terrain: "Water (Depth 1+)", page: 106 },
    { tag: "tabiranth", name: "Tabiranth", size: "large", weight: 0.25, mp: 2, moveType: "Ground", bonusVsInfantryDice: 1, bonusVsOthers: 1, damageDivisor: 1, terrain: "Water (Depth 1+)", page: 106 },
    { tag: "tariq", name: "Tariq", size: "large", weight: 0.51, mp: 5, moveType: "Ground", bonusVsInfantryDice: 0, bonusVsOthers: 0, damageDivisor: 1, terrain: "Water (Depth 1+)", page: 106 },
    { tag: "elephant", name: "Elephant", size: "very-large", weight: 6, mp: 2, moveType: "Ground", bonusVsInfantryDice: 1, bonusVsOthers: 1, damageDivisor: 2, terrain: "Water (Depth 2+)", page: 106 },
    { tag: "orca", name: "Orca", size: "very-large", weight: 7.2, mp: 5, moveType: "Submarine", bonusVsInfantryDice: 2, bonusVsOthers: 1, damageDivisor: 2, terrain: "As Submarines (TW pp.56-57)", page: 106 },
    { tag: "hipposaur", name: "Hipposaur", size: "monstrous", weight: 35.5, mp: 2, moveType: "Submarine", bonusVsInfantryDice: 10, bonusVsOthers: 4, damageDivisor: 4, terrain: "1 Ground MP on Land", page: 106 },
];

/** The creature with that tag or name (MegaMek writes "Beast:Coventry Kangaroo"); case does not matter. */
export const findInfantryBeastMount = (tagOrName: string): IInfantryBeastMount | undefined => {
    const wanted = tagOrName.trim().toLowerCase();
    return INFANTRY_BEAST_MOUNTS.find((mount) => mount.tag === wanted || mount.name.toLowerCase() === wanted);
};

/** The text of TO:AUE p.108 on anti-'Mech attacks from Very Large and Monstrous creatures, quoted where it differs from the p.107 table. */
export const INFANTRY_BEAST_TEXT_VERY_LARGE = "For units using Very Large creatures (roughly the size of a Terran elephant), the unit may not engage in Leg Attacks.";
export const INFANTRY_BEAST_TEXT_MONSTROUS = "Units riding Monstrous-sized creatures (roughly the size of a Terran humpback whale) may not make anti-'Mech attacks.";

/** Beast-mounted infantry is an Advanced rule (TO:AUE p.107). */
export const INFANTRY_BEAST_RULES_LEVEL = 3;
/** Mixed Clan and Inner Sphere technology is an Advanced construction option (TO:AUE p.189). */
export const INFANTRY_MIXED_TECH_RULES_LEVEL = 3;
/** Beast-mounted infantry costs 5,000 C-bills for each ton of the whole unit (TO:AUE p.225). */
export const INFANTRY_BEAST_COST_PER_TON = 5000;
/** Most support weapons a squad may carry on any creature (Monstrous: 3, TO:AUE p.107). */
export const INFANTRY_MAX_SECONDARY_PER_SQUAD_BEAST = 3;
/** Most secondary weapons a squad may carry with both dermal armor and triple-strength myomer implants (IO:AE pp.74-75). */
export const INFANTRY_MAX_SECONDARY_PER_SQUAD_AUGMENTED = 4;

export type InfantrySpecialty = "engineers" | "marines" | "mountain" | "paratroops" | "tag" | "paramedics";
export type InfantryEngineerTask = "bridge" | "demolition" | "firefighting" | "minesweeping" | "sensor" | "trench";
export type InfantryXCTEnvironment = "cold" | "hot" | "liquid" | "vacuum" | "toxic" | "tainted";

export interface IInfantrySpecialty {
    tag: InfantrySpecialty;
    name: string;
    /** Limits on the platoon; null leaves the motive type's own ("as chosen", "as platoon type"). */
    maxSquadSize: number | null;
    maxPlatoonSize: number | null;
    maxSquads: number | null;
    maxSecondary: number | null;
    /** Mountain Troops and Paratroops use the basic Foot motive type, 1 Ground MP (p.152). */
    footOnly: boolean;
    /** Tons added to each trooper (a paramedic only, for Paramedics: they are the troopers it names). */
    addedTons: number;
    /** Cost multiplier of the Conventional Infantry Construction Data (p.225); Paramedics are 0.375 a medic, added last instead. */
    costMultiplier: number;
    /** Added to the unit type modifier of the final Battle Value (p.193). */
    bvModifier: number;
    prohibitedTerrain: string | null;
    ratings: string;
    /** Latest Intro Date of the Construction Data (PS pre-spaceflight, ES early spaceflight). */
    intro: string;
}

// Specialized Infantry Types Table (TO:AUE p.153, read from the page image), the Conventional Infantry Construction Data (p.225) and the
// Unit Type Modifiers Table addendum (p.193). Marines and the VTOL motives are ES, the rest PS.
export const INFANTRY_SPECIALTIES: IInfantrySpecialty[] = [
    { tag: "engineers", name: "Combat Engineers", maxSquadSize: 10, maxPlatoonSize: 20, maxSquads: 2, maxSecondary: 0, footOnly: false, addedTons: 0.1, costMultiplier: 5, bvModifier: 0.1, prohibitedTerrain: null, ratings: "C/A-B-A", intro: "PS" },
    { tag: "marines", name: "Marines", maxSquadSize: 10, maxPlatoonSize: 30, maxSquads: 4, maxSecondary: null, footOnly: false, addedTons: 0, costMultiplier: 3, bvModifier: 0.3, prohibitedTerrain: null, ratings: "C/A-A-A", intro: "ES" },
    { tag: "mountain", name: "Mountain Troops", maxSquadSize: 10, maxPlatoonSize: 20, maxSquads: 2, maxSecondary: 1, footOnly: true, addedTons: 0, costMultiplier: 2, bvModifier: 0.2, prohibitedTerrain: "Water (Any)", ratings: "B/A-A-A", intro: "PS" },
    { tag: "paratroops", name: "Paratroops", maxSquadSize: 10, maxPlatoonSize: 30, maxSquads: 3, maxSecondary: 1, footOnly: true, addedTons: 0.05, costMultiplier: 3, bvModifier: 0.1, prohibitedTerrain: "Water (Any)", ratings: "B/A-A-A", intro: "PS" },
    { tag: "tag", name: "TAG Troops", maxSquadSize: null, maxPlatoonSize: null, maxSquads: null, maxSecondary: null, footOnly: false, addedTons: 0, costMultiplier: 1, bvModifier: 0, prohibitedTerrain: null, ratings: "E/F-X-E (E-X-E-E)", intro: "As the TAG" },
    { tag: "paramedics", name: "Paramedics", maxSquadSize: null, maxPlatoonSize: null, maxSquads: null, maxSecondary: null, footOnly: false, addedTons: 0.05, costMultiplier: 1, bvModifier: 0, prohibitedTerrain: null, ratings: "B/C-C-C", intro: "PS" },
];

export const findInfantrySpecialty = (tag: string): IInfantrySpecialty | undefined => INFANTRY_SPECIALTIES.find((item) => item.tag === tag);

/** Paramedics add 0.375 of the finished platoon cost for each medic (TO:AUE p.225), after every other step. */
export const INFANTRY_PARAMEDIC_COST_FRACTION = 0.375;
/** XCT troops cost x1.5 (p.225) and add 0.1 to the unit type modifier (p.193). */
export const INFANTRY_XCT_COST_MULTIPLIER = 1.5;
export const INFANTRY_XCT_BV_MODIFIER = 0.1;
/** SCUBA adds 0.1 to the unit type modifier, for the three SCUBA types alike (p.193). */
export const INFANTRY_SCUBA_BV_MODIFIER = 0.1;
/** Most paramedics or TAG troopers in a squad, together (p.153 note); each replaces a secondary weapon trooper. */
export const INFANTRY_MAX_SPECIAL_TROOPERS_PER_SQUAD = 2;
/** Paramedics may tend up to 5 wounded each (p.153). */
export const INFANTRY_WOUNDED_PER_PARAMEDIC = 5;
/** TAG troops are TAG troopers at 3/6/9 hexes (TW p.142), and need 2 in a squad to work (p.153). */
export const INFANTRY_TAG_RANGES = "3/6/9";
/** Cost of one TAG, 50,000 C-bills (MT p.40, TW). TO:AUE p.225 has no row for TAG Troops: a TAG trooper is priced as a secondary weapon trooper with it. */
export const INFANTRY_TAG_WEAPON_COST = 50000;
/** The Veteran experience level TO:AUE p.152 asks of every specialist (Gunnery 3, Anti-'Mech 4). */
export const INFANTRY_VETERAN_GUNNERY = 3;
export const INFANTRY_VETERAN_ANTI_MECH = 4;
/** Specialized infantry is an Advanced rule (TO:AUE p.152). */
export const INFANTRY_SPECIALTY_RULES_LEVEL = 3;

export interface IInfantryEngineerTask {
    tag: InfantryEngineerTask;
    name: string;
    /** The rule, in short (TO:AUE p.152-153). */
    text: string;
    /** The Alpha Strike special the Companion gives a platoon with this task: TRN, MSW or FF (ASC pp.126-127); none for the rest. */
    alphaStrike: string | null;
    /** MegaMek's bit of the file's specialization mask (ConvInfantry), and the tool its file carries. */
    bit: number;
    gear: string | null;
}

export const INFANTRY_ENGINEER_TASKS: IInfantryEngineerTask[] = [
    { tag: "bridge", name: "Bridge-Building", text: "Raises 2 single-hex Light Bridges (CF 15) or 1 Medium Bridge (CF 40) a scenario, double over water, by 6 full turns adjacent to the hex with no other action; damage in a turn adds a turn; destroyed first, the bridge is lost.", alphaStrike: null, bit: 1, gear: "Infantry Bridge Kit" },
    { tag: "demolition", name: "Demolition", text: "Plants charges on a structure: the turns spent in the hex (6 at most) times the damage of an SRM platoon of the same numbers; detonated in any later End Phase, against that hex of the structure only.", alphaStrike: null, bit: 2, gear: "Demolition Charge" },
    { tag: "firefighting", name: "Firefighting", text: "Fights one burning adjacent hex or unit in place of a weapon attack, which hits; 2D6 of 8+ puts it out (-2 to the roll if an Inferno or a fuel-fed flamer started it); the target is 1 lower for each turn in a row on the same fire, to 3, and a further platoon fighting it takes 1 more off.", alphaStrike: "FF", bit: 4, gear: "Fire Extinguisher" },
    { tag: "minesweeping", name: "Minesweeping", text: "On entering a mined hex, disables mines in place of a weapon attack: 2D6 for each minefield type, 9+ clears it, 3 or less detonates it.", alphaStrike: "MSW", bit: 8, gear: "Light Minesweeper" },
    { tag: "sensor", name: "Sensor", text: "Sets up to 2 Remote Sensors a squad, one a hex a turn at 1 MP, and still attacks; each works as a Remote Sensor (TO:AUE p.187).", alphaStrike: null, bit: 16, gear: null },
    { tag: "trench", name: "Trench/Fieldworks", text: "Digs a fortified hex in 3 full turns with no other action (not on water, pavement or buildings): +2 against attacks (not flamers or area-effect) on infantry dug into it, and it is not Clear terrain for damage; damage in a turn adds a turn.", alphaStrike: "TRN", bit: 32, gear: "Vibro-Shovel" },
];

export const findInfantryEngineerTask = (tag: string): IInfantryEngineerTask | undefined => INFANTRY_ENGINEER_TASKS.find((item) => item.tag === tag);

export interface IInfantryXCTEnvironment {
    tag: InfantryXCTEnvironment;
    name: string;
    /** The armor kits the environment needs (TO:AUE p.162), by their tag in the infantry armor catalog. */
    armor: string[];
    /** What the troops gain (p.163). */
    effect: string;
}

const XCT_SPACESUITS = ["inf-armor-spacesuit", "inf-armor-spacesuit-combat"];
const XCT_ENVIRONMENT_SUITS = ["inf-armor-environment-suit-hostile", "inf-armor-environment-suit-marine"];
// Xenoplanetary Condition-Trained Troops construction (TO:AUE p.162; read from the page, the 7th printing). "Cooling Suit (any type)" is read as
// both MechWarrior cooling rows of the Infantry Armor Table (suit and vest); "Spacesuit (any)" as both spacesuits.
export const INFANTRY_XCT_ENVIRONMENTS: IInfantryXCTEnvironment[] = [
    { tag: "cold", name: "Extreme Temperatures (Cold)", armor: ["inf-armor-snowsuit", ...XCT_ENVIRONMENT_SUITS, ...XCT_SPACESUITS], effect: "Unaffected by the movement limits of extreme temperatures." },
    { tag: "hot", name: "Extreme Temperatures (Hot)", armor: ["inf-armor-mechwarrior-cooling-suit", "inf-armor-mechwarrior-cooling-vest-only", ...XCT_ENVIRONMENT_SUITS, "inf-armor-heatsuit", ...XCT_SPACESUITS], effect: "Unaffected by the movement limits of extreme temperatures." },
    { tag: "liquid", name: "Hazardous Liquids", armor: ["inf-armor-environment-suit-light", ...XCT_ENVIRONMENT_SUITS, "inf-armor-engineering-suit"], effect: "Divides the damage of hazardous liquid pools (TO:AR p.47) by 3, rounding down, to a minimum of 1." },
    { tag: "vacuum", name: "Vacuum or Trace Atmosphere", armor: [...XCT_ENVIRONMENT_SUITS, ...XCT_SPACESUITS], effect: "Doubles all damage taken in those atmospheres (suit breaches)." },
    { tag: "toxic", name: "Toxic Atmosphere", armor: [...XCT_ENVIRONMENT_SUITS, ...XCT_SPACESUITS], effect: "Doubles all damage taken in that atmosphere (suit breaches)." },
    { tag: "tainted", name: "Tainted Atmosphere (not Toxic)", armor: ["inf-armor-environment-suit-light", ...XCT_ENVIRONMENT_SUITS, ...XCT_SPACESUITS], effect: "Doubles all damage taken in that atmosphere (suit breaches)." },
];

export const findInfantryXCTEnvironment = (tag: string): IInfantryXCTEnvironment | undefined => INFANTRY_XCT_ENVIRONMENTS.find((item) => item.tag === tag);

/** Tons an Anti-'Mech Infantry kit adds to each trooper (TM p.155). */
export const INFANTRY_ANTI_MECH_KIT_TONS = 0.015;
/** Cost multiplier for Anti-'Mech Training and Equipment (TM p.282). */
export const INFANTRY_ANTI_MECH_COST_MULTIPLIER = 5;

/**
 * Field gear of Maximum Tech p.40 (BMR rules, both printings): a disposable Narc launcher (one a squad, four a platoon, three for
 * jump; +10,000 C-bills each) and TAG for a platoon with lasers (+50,000 C-bills). The Total Warfare family dropped it, so the
 * platoon (which plays under Total Warfare) offers it as apocryphal, playing by the BMR rule.
 */
export const INFANTRY_FIELD_GEAR = [
    { tag: "inf-field-narc", name: "Disposable Narc launcher", cost: 10000, book: "MT", page: 40 },
    { tag: "inf-field-tag", name: "Infantry TAG", cost: 50000, book: "MT", page: 40 },
] as const;
/** Anti-'Mech Skill of a platoon without kits, or of any mechanized platoon; it cannot be improved (TM pp.155, 309). */
export const INFANTRY_FIXED_ANTI_MECH_SKILL = 8;
export const INFANTRY_MAX_SQUADS_PER_PLATOON = 5;
export const INFANTRY_MAX_SECONDARY_PER_SQUAD = 2;
/** Most squads a formation may be given here: the Marian Hegemony's ten (TM p.147). */
export const INFANTRY_MAX_SQUADS = 10;
/** MP a platoon carrying the Support Particle Cannon is held to (TM p.352). */
export const INFANTRY_SUPPORT_PPC_MP = 2;
/** Conventional infantry follow Total Warfare's standard rules. */
export const INFANTRY_RULES_LEVEL = 2;

export interface IInfantryFormation {
    tag: string;
    name: string;
    techBase: InfantryTechBase;
    /** Troopers per squad and squads per platoon, by motive type. */
    sizes: Partial<Record<InfantryMotive, [number, number]>>;
    notes?: string;
}

const standardIS: Partial<Record<InfantryMotive, [number, number]>> = {
    "foot": [7, 4], "motorized": [7, 4], "jump": [7, 3], "mech-hover": [5, 4], "mech-wheeled": [6, 4], "mech-tracked": [7, 4], "beast": [7, 3],
};
const taurian: Partial<Record<InfantryMotive, [number, number]>> = {
    "foot": [10, 3], "motorized": [10, 3], "jump": [10, 3], "mech-hover": [5, 4], "mech-wheeled": [5, 4], "mech-tracked": [5, 4], "beast": [7, 3],
};

/** The motive whose Formations Table row a VTOL or SCUBA motive takes (those are on no row of TM p.147). */
const INFANTRY_FORMATION_LIKE: Partial<Record<InfantryMotive, InfantryMotive>> = {
    "microlite": "mech-hover", "microcopter": "mech-hover", "scuba": "foot", "scuba-motorized": "motorized", "scuba-mech": "mech-tracked",
};

// Conventional Infantry Formations (by Tech Base) Table (TM p.147).
export const INFANTRY_FORMATIONS: IInfantryFormation[] = [
    { tag: "is-generic", name: "Generic / Mercenary", techBase: "is", sizes: standardIS },
    { tag: "capellan-confederation", name: "Capellan Confederation", techBase: "is", sizes: standardIS },
    { tag: "draconis-combine", name: "Draconis Combine", techBase: "is", sizes: standardIS },
    { tag: "federated-suns", name: "Federated Suns", techBase: "is", sizes: standardIS },
    { tag: "free-rasalhague-republic", name: "Free Rasalhague Republic", techBase: "is", sizes: standardIS },
    { tag: "free-worlds-league", name: "Free Worlds League", techBase: "is", sizes: standardIS },
    { tag: "lyran-alliance", name: "Lyran Alliance", techBase: "is", sizes: standardIS },
    { tag: "comstar-word-of-blake", name: "ComStar / Word of Blake", techBase: "is", sizes: { "foot": [6, 6], "motorized": [6, 6], "jump": [6, 5], "mech-hover": [5, 4], "mech-wheeled": [6, 4], "mech-tracked": [6, 4], "beast": [7, 3] } },
    { tag: "periphery-major", name: "Periphery (Major)", techBase: "is", sizes: standardIS, notes: "Includes the Circinus Federation, Magistracy of Canopus, Niops Association, Outworlds Alliance, Nueva Castile, Hanseatic League and pirates." },
    { tag: "marian-hegemony", name: "Marian Hegemony", techBase: "is", sizes: { "foot": [10, 10], "motorized": [10, 10], "jump": [10, 5], "mech-hover": [5, 4], "mech-wheeled": [5, 4], "mech-tracked": [5, 4], "beast": [7, 3] } },
    { tag: "taurian-concordat", name: "Taurian Concordat", techBase: "is", sizes: taurian },
    { tag: "calderon-protectorate", name: "Calderon Protectorate", techBase: "is", sizes: taurian },
    { tag: "clan", name: "Clan (All)", techBase: "clan", sizes: { "foot": [5, 5], "motorized": [5, 5], "jump": [5, 4], "mech-hover": [5, 4], "mech-wheeled": [5, 4], "mech-tracked": [5, 4], "beast": [7, 3] } },
];

// Conventional Infantry Range Modifiers Table (TM p.149): to-hit modifiers by Base Range, from the platoon's own
// hex (index 0) out to three times the Base Range. A range past the end of a row cannot be attacked.
export const INFANTRY_RANGE_MODIFIERS: number[][] = [
    [0],
    [-2, 0, 2, 4],
    [-2, 0, 0, 2, 2, 4, 4],
    [-2, 0, 0, 0, 2, 2, 2, 4, 4, 4],
    [-2, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4],
    [-1, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4],
    [-1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 4, 4, 4, 5, 5, 5],
    [-1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 6, 6, 6, 6],
];

export const INFANTRY_SPECIAL_FEATURES: Record<string, string> = {
    A: "Anti-aircraft: may attack airborne aerospace units",
    B: "Heavy burst: -1 to-hit in its own hex, +1D6 damage against conventional infantry",
    F: "Flame-based: may apply its damage as heat instead",
    N: "Non-penetrating: affects other conventional infantry only",
};

export interface IInfantryASDamageValue {
    damage: number;
    /** Minimal damage, printed 0* (Alpha Strike Companion p.103). */
    minimal: boolean;
}

export interface IInfantryAlphaStrikeStats {
    type: "CI";
    size: number;
    /** Inches. */
    movement: number;
    movementCode: string;
    /** A SCUBA platoon's water movement, listed beside its ground movement (ASC p.93). */
    secondaryMovement?: { movement: number; code: string };
    armor: number;
    structure: number;
    damageValues: { short: IInfantryASDamageValue; medium: IInfantryASDamageValue; long: IInfantryASDamageValue };
    specialAbilities: string[];
    /** Inches of VTOL movement from powered flight wings (IO:AE p.195); absent without them. */
    flightMovement?: number;
    pointValue: number;
    /** The conversion, one plain-text line per step. */
    calcLog: string[];
}

export const formatInfantryASDamage = (value: IInfantryASDamageValue): string => (value.minimal ? "0*" : `${value.damage}`);

// Infantry Troop Factor Table (Alpha Strike Companion p.103): the number of troopers whose damage is converted,
// by the unit's full size. Index 0 is unused; the table starts at 2 troopers, so a lone trooper counts as 1.
const INFANTRY_TROOP_FACTORS: number[] = [
    0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 13, 14, 15, 16, 16, 17, 17, 17, 18, 18,
];

// Alpha Strike movement codes for conventional infantry (ASC p.93).
const INFANTRY_AS_MOVEMENT_CODES: Record<InfantryMotive, string> = {
    "foot": "f", "motorized": "m", "jump": "j", "mech-hover": "h", "mech-tracked": "t", "mech-wheeled": "w", "beast": "f",
    // Mechanized VTOL is "v" (ASC p.93); a SCUBA platoon walks as foot and swims as UMU (see getAlphaStrikeStats); the mechanized one is a submarine.
    "microlite": "v", "microcopter": "v", "scuba": "f", "scuba-motorized": "f", "scuba-mech": "s",
};

const roundToHalf = (value: number): number => Math.round(value * 2 + 1e-9) / 2;

/** How an attack against the platoon is counted (Total Warfare pp.215-217). */
export type InfantryAttackKind = "direct" | "physical" | "cluster-ballistic" | "pulse" | "cluster-missile" | "area-effect" | "burst" | "infantry" | "heat";

// Non-Infantry Weapon Damage Against Infantry Table (TW p.216). "formula" kinds take the weapon's Damage Value;
// the others take damage that is already worked out (dice for a burst-fire weapon, a platoon's own damage, or
// the figure a heat-effect weapon's entry gives).
export const INFANTRY_ATTACK_KINDS: { tag: InfantryAttackKind; name: string; formula: string; nonInfantryWeapon: boolean }[] = [
    { tag: "direct", name: "Direct Fire (Ballistic or Energy)", formula: "Damage Value / 10", nonInfantryWeapon: true },
    { tag: "physical", name: "BattleMech Physical Attack", formula: "Damage Value / 10", nonInfantryWeapon: true },
    { tag: "cluster-ballistic", name: "Cluster (Ballistic)", formula: "Damage Value / 10 + 1", nonInfantryWeapon: true },
    { tag: "pulse", name: "Pulse", formula: "Damage Value / 10 + 2", nonInfantryWeapon: true },
    { tag: "cluster-missile", name: "Cluster (Missile)", formula: "Damage Value / 5", nonInfantryWeapon: true },
    { tag: "area-effect", name: "Area-Effect (AE)", formula: "Damage Value / 0.5", nonInfantryWeapon: true },
    { tag: "burst", name: "Burst-Fire Weapon", formula: "the dice rolled on the Burst-Fire Weapon table", nonInfantryWeapon: false },
    { tag: "infantry", name: "Conventional Infantry", formula: "the attacking platoon's damage", nonInfantryWeapon: false },
    { tag: "heat", name: "Heat-Effect Weapon", formula: "the damage its entry gives against infantry", nonInfantryWeapon: false },
];

/** Most damage one attack may be entered with. */
export const INFANTRY_MAX_ATTACK_DAMAGE = 1000;

export interface IInfantryInPlay {
    /** Damage points marked on each record sheet line; a mechanized trooper takes 2 to eliminate. */
    damage: number[];
    /** Troopers stunned by a sonic projector hit (#645): out of the attack until the End Phase of `returnTurn`. */
    stunned?: { troopers: number; returnTurn: number };
    /** A failed Morale Check after a stun: the platoon must move away from the firer and makes no attacks until `untilTurn` ends. */
    fellBack?: { untilTurn: number; fromName?: string };
    /**
     * Field guns (TO:AUE p.123): the one facing for all of them, the rounds left in each ton of ammunition (kept at platoon
     * level, not cut by trooper loss), and what stops them firing this turn. Absent until it is set; the rounds then start full.
     */
    fieldGuns?: { facing: number; shots?: number[]; moved?: boolean; usedInfantryWeapons?: boolean };
    /**
     * Combat Engineers (TO:AUE pp.152-153): the task designated before the scenario, the turns of work done (and the turns damage
     * added), the bridge units spent (a Light Bridge is 1 of 2, a Medium Bridge 2), the Remote Sensors set and the turns in a row on a fire.
     */
    engineers?: { task: InfantryEngineerTask; turns: number; extraTurns: number; bridgeUnits: number; sensors: number; fireTurns: number };
}

/** Field guns or the one field artillery piece, as saved (TO:AUE pp.122-123): the weapon record's tag, how many, and each ton of ammunition. */
export interface IInfantryFieldGunsExport {
    weapon: string;
    count: number;
    ammo: string[];
}

/** Motive types that may tow field guns: motorized, and mechanized wheeled or tracked (TO:AUE p.122). */
const FIELD_GUN_MOTIVES: readonly string[] = ["motorized", "mech-wheeled", "mech-tracked"];
/** Hexsides a facing may take, 0 to 5. */
const FIELD_GUN_FACINGS = 6;

/** Cybernetic and prosthetic augmentation, as saved (IO:AE pp.70-79): the augmentation records' tags, what the limbs carry and the extraneous pairs. */
export interface IInfantryAugmentationExport {
    implants: string[];
    /** What the enhanced or improved limbs carry: an item tag and how many of it each trooper has. */
    limbs?: { item: string; count: number }[];
    /** The item of each extraneous pair of limbs. */
    extraneous?: string[];
}

export interface IInfantryPlatoonExport {
    /** The rules edition it is built under (rules-editions.ts); absent means Total Warfare. */
    rulesEdition?: string;
    rulesLevel?: number;
    rulesets?: string[];
    uuid: string;
    tro?: ITechnicalReadoutExport;
    lastUpdated: string;
    name: string;
    techBase: InfantryTechBase;
    /** Mixed Clan and Inner Sphere technology (TO:AUE p.189); absent for a pure platoon and in older saves. */
    mixedTech?: boolean;
    formation: string;
    /** Era tag; absent in platoons saved before eras were tracked, which load into the latest era. */
    era?: string;
    motive: InfantryMotive;
    /** Creature tag of a beast-mounted platoon (INFANTRY_BEAST_MOUNTS); absent otherwise and in saves from before beasts. */
    mount?: string;
    squadSize: number;
    squads: number;
    primaryWeapon: string;
    secondaryWeapon: string;
    secondaryPerSquad: number;
    /** Infantry armor tag (Tactical Operations); empty or absent for a platoon without it. */
    armor?: string;
    antiMechKit: boolean;
    /** Maximum Tech p.40 field gear tags (disposable Narc launcher, TAG); absent when none. */
    fieldGear?: string[];
    /** Field guns or field artillery (TO:AUE pp.122-123); absent when none. */
    fieldGuns?: IInfantryFieldGunsExport;
    /** Specialized infantry (TO:AUE p.152): the specialty tags, the engineer tasks, the paramedics and TAG troopers a squad, and the XCT environment. Absent when none. */
    specialties?: string[];
    engineerTasks?: string[];
    paramedics?: number;
    tagTroopers?: number;
    xct?: string;
    /** Cybernetic and prosthetic augmentation (IO:AE pp.70-79); absent when none and in saves from before it. */
    augmentation?: IInfantryAugmentationExport;
    gunnery: number;
    antiMech: number;
    inPlay?: IInfantryInPlay;
    ewarPlay?: IEWarPlayState;
}

const savedString = (value: unknown, fallback: string = ""): string => typeof value === "string" ? value : fallback;
const savedNumber = (value: unknown, fallback: number, min: number, max: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
/** Rounds normally, .5 up; the small allowance keeps 0.285 x 2 style products from falling short in binary. */
const roundNormally = (value: number): number => Math.floor(value + 0.5 + 1e-9);
const roundUpHalf = (tons: number): number => Math.ceil(tons * 2 - 1e-9) / 2;
/** One line a calculation adds from a sub-calculation (an implant's value). */
interface IInfantryBvItem { label: string; detail: string; value: number }
/** A Battle Value worked out as cited steps: `result` is null where the edition's books give the platoon no value. */
interface IInfantryBvResult { value: number; result: number | null; log: string[]; steps: ICalcStep[] }
interface IInfantryCostResult { value: number | null; log: string[]; steps: ICalcStep[] }

const format = (value: number, digits: number = 2): string => value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** The newest era a technology base can design in: every weapon that is not extinct is on offer there. */
const latestEra = (techBase: InfantryTechBase): IEras => {
    const eras = getErasForTech(techBase);
    return eras[eras.length - 1] ?? btEraOptions[btEraOptions.length - 1];
};

const DEFAULT_PRIMARY = "inf-auto-rifle";
export const MAX_INFANTRY_NAME_LENGTH = 120;

/** A saved platoon cleaned by a full import, with what the import changed; null when it is not an object. */
export const normalizeInfantryPlatoonExport = (raw: unknown): { platoon: IInfantryPlatoonExport | null; issues: string[] } => {
    if (!isPlainObject(raw)) return { platoon: null, issues: ["Skipped a saved platoon that could not be read"] };
    let json: string;
    try {
        json = JSON.stringify(raw);
    } catch {
        return { platoon: null, issues: ["Skipped a saved platoon that could not be read"] };
    }
    const loaded = new InfantryPlatoon(json);
    return { platoon: loaded.export(true), issues: [...loaded.getImportIssues()] };
};

export default class InfantryPlatoon implements IGameSettingsUnit {
    private _uuid: string = generateUUID();
    public tro: TechnicalReadout = new TechnicalReadout();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _rulesEdition: string = DEFAULT_RULES_EDITION;
    /** The rules level and Special Rulesets the design is built under (#324). */
    public readonly gameSettings = new UnitGameSettings();
    private _techBase: InfantryTechBase = "is";
    private _mixedTech = false;
    private _formation: IInfantryFormation = INFANTRY_FORMATIONS[0];
    private _era: IEras = latestEra("is");
    private _motive: IInfantryMotiveType = INFANTRY_MOTIVE_TYPES[0];
    private _mount: IInfantryBeastMount | null = null;
    private _squadSize: number = 7;
    private _squads: number = 4;
    private _primary: IInfantryWeapon = findInfantryWeapon(DEFAULT_PRIMARY) ?? infantryWeapons[0];
    private _secondary: IInfantryWeapon | null = null;
    private _secondaryPerSquad: number = 0;
    private _armor: IInfantryArmor | null = null;
    private _antiMechKit: boolean = false;
    /** Specialized infantry (TO:AUE pp.152-153, 162-163). */
    private _specialties: InfantrySpecialty[] = [];
    private _engineerTasks: InfantryEngineerTask[] = [];
    private _paramedicsPerSquad: number = 0;
    private _tagPerSquad: number = 0;
    private _xct: InfantryXCTEnvironment | null = null;
    private _augmentations: string[] = [];
    private _limbs: { item: string; count: number }[] = [];
    private _extraneous: string[] = [];
    private _gunnery: number = 4;
    private _antiMech: number = 5;
    private _inPlay: IInfantryInPlay = { damage: [] };
    /** What the unit has switched on, been hit by or been told by the force board in E-War play (#642). */
    public ewarPlay: IEWarPlayState = {};
    private _importIssues: string[] = [];

    constructor(importJSON: string = "") {
        if (importJSON) this.importJSON(importJSON);
    }

    // Identity

    public getUUID(): string { return this._uuid; }
    public newUUID(): void { this._uuid = generateUUID(); }
    public getName(): string { return this._name; }
    /** The rules edition the design is built under. Only the editions with rules for this unit type are offered. */
    public getRulesEdition(): string { return this._rulesEdition; }
    public setRulesEdition(editionTag: string): string {
        this._rulesEdition = getSelectableRulesEditionTag(editionTag, "infantry");
        return this._rulesEdition;
    }
    public getTechTag(): string { return this.getTechBase(); }
    public setTechTag(tag: string): void { this.setTechBase(tag === "clan" ? "clan" : "is"); }
    public chooseEra(tag: string): void { chooseEraByTechBase(this, tag); }

    public setName(name: string): void { this._name = String(name ?? "").slice(0, MAX_INFANTRY_NAME_LENGTH); }
    /** The saved name, or the book's style of name: motive and weapon (TM p.154). */
    public getDisplayName(): string { return this._name.trim() || this.getNomenclature(); }
    public getNomenclature(): string {
        const weapon = this.getSecondaryCount() > 0 && this._secondary ? this._secondary.name : this._primary.name;
        return [this.getMotive().name, ...this.getSpecialtyNames(), weapon, "Infantry"].join(" ");
    }
    public getImportIssues(): readonly string[] { return this._importIssues; }
    /** Standard, or Advanced once the platoon wears Tactical Operations infantry armor. */
    /** Standard rules; Advanced with infantry armor; a Custom Homebrew weapon's own level. */
    public getRequiredRulesLevel(): number {
        let level = this._armor ? Math.max(INFANTRY_RULES_LEVEL, INFANTRY_ARMOR_RULES_LEVEL) : INFANTRY_RULES_LEVEL;
        if (this.isBeastMounted()) level = Math.max(level, INFANTRY_BEAST_RULES_LEVEL);
        if (this._mixedTech) level = Math.max(level, INFANTRY_MIXED_TECH_RULES_LEVEL);
        if (this._motive.rulesLevel) level = Math.max(level, this._motive.rulesLevel);
        if (this._specialties.length > 0 || this._paramedicsPerSquad > 0 || this._tagPerSquad > 0 || this._xct) level = Math.max(level, INFANTRY_SPECIALTY_RULES_LEVEL);
        const guns = this._fieldGun && this.getFieldGunCount() > 0
            ? Math.max(INFANTRY_FIELD_GUN_RULES_LEVEL, getEquipmentRulesLevel(this._fieldGun), ...this._fieldGunAmmo.map((ammo) => getEquipmentRulesLevel(ammo)))
            : 0;
        const implants = this.getAugmentations().reduce((most, item) => Math.max(most, item.rulesLevel), 0);
        return Math.max(level, guns, implants, this._primary.rulesLevel ?? 0, this._secondary?.rulesLevel ?? 0);
    }

    // Step 1: platoon type (TM p.145)

    public getTechBase(): InfantryTechBase { return this._techBase; }
    public isClan(): boolean { return this._techBase === "clan"; }
    public getTechName(): string { return this._mixedTech ? `Mixed (${this.isClan() ? "Clan" : "Inner Sphere"})` : this.isClan() ? "Clan" : "Inner Sphere"; }
    /**
     * Mixed technology (TO:AUE p.189, an Advanced construction option): "Any unit may be constructed using a mix of Clan and
     * Inner Sphere technologies". The platoon keeps its own base's formations and eras, and may carry the other base's
     * weapons and armor kits, each by its own base's dates.
     */
    public isMixedTech(): boolean { return this._mixedTech; }
    public setMixedTech(on: boolean): void {
        this._mixedTech = !!on;
        if (!this._mixedTech) {
            this._clampWeapons();
            if (this._armor && !this.isArmorForPlatoon(this._armor)) this._armor = null;
            if (this._fieldGun && !findFieldGunRecord(this._fieldGun.tag, this._techBase)) this.setFieldGuns("", 0);
        }
    }
    /** The motive type; a beast-mounted platoon's is built from its creature and size (TO:AUE pp.106-107). */
    public getMotive(): IInfantryMotiveType {
        const mount = this._mount;
        if (this._motive.tag !== "beast" || !mount) return this._motive;
        const size = INFANTRY_BEAST_SIZES[mount.size];
        return {
            ...this._motive,
            name: `Beast-Mounted (${mount.name})`,
            maxSquadSize: size.troopsPerCreature === 1 ? 10 : size.troopsPerCreature,
            maxPlatoonSize: size.creaturesPerPlatoon * size.troopsPerCreature,
            mp: mount.mp,
            moveType: mount.moveType,
            prohibitedTerrain: mount.terrain,
        };
    }
    public getMount(): IInfantryBeastMount | null { return this._motive.tag === "beast" ? this._mount : null; }
    public isBeastMounted(): boolean { return this.getMount() !== null; }
    public getBeastSize(): IInfantryBeastSize | null { const mount = this.getMount(); return mount ? INFANTRY_BEAST_SIZES[mount.size] : null; }
    public isMechanized(): boolean { return this._motive.mechanized; }
    public getFormation(): IInfantryFormation { return this._formation; }
    public getAvailableFormations(): IInfantryFormation[] { return INFANTRY_FORMATIONS.filter((formation) => formation.techBase === this._techBase); }

    public getEra(): IEras { return this._era; }
    public getAvailableEras(): IEras[] { return getErasForTech(this._techBase); }
    /** Sets the era the platoon is raised in; weapons it carries that the era does not have are reported, not removed. */
    public setEra(tag: string): boolean {
        const era = findEraByTag(tag);
        if (!era || !this.getAvailableEras().some((item) => item.tag === era.tag)) return false;
        this._era = era;
        return true;
    }
    /** Is the weapon in production for this technology base during the platoon's era (TM pp.298-301)? */
    public isWeaponInEra(weapon: IInfantryWeapon): boolean {
        // A mixed technology platoon's weapon of the other base goes by that base's dates.
        const base = weapon.techBase === "is" || weapon.techBase === "clan" ? weapon.techBase : this._techBase;
        return isInfantryWeaponAvailable(weapon, this._mixedTech ? base : this._techBase, this._era.yearStart, this._era.yearEnd);
    }

    /** Changes the technology base, moving to that base's first formation and dropping weapons it cannot use. */
    public setTechBase(techBase: InfantryTechBase): void {
        if (techBase !== "is" && techBase !== "clan") return;
        this._techBase = techBase;
        if (!this.getAvailableEras().some((item) => item.tag === this._era.tag)) this._era = latestEra(techBase);
        if (this._formation.techBase !== techBase) this._formation = this.getAvailableFormations()[0];
        this.applyFormation();
        this._clampWeapons();
        if (this._armor && !this.isArmorForPlatoon(this._armor)) this._armor = null;
    }

    public setFormation(tag: string): boolean {
        const formation = this.getAvailableFormations().find((item) => item.tag === tag);
        if (!formation) return false;
        this._formation = formation;
        this.applyFormation();
        return true;
    }

    public setMotive(tag: string): boolean {
        const motive = INFANTRY_MOTIVE_TYPES.find((item) => item.tag === tag);
        if (!motive) return false;
        this._motive = motive;
        // A beast-mounted platoon starts on a Horse; any other motive type has no creature.
        this._mount = motive.tag === "beast" ? (this._mount ?? findInfantryBeastMount("horse") ?? null) : null;
        this.applyFormation();
        this._clampWeapons();
        this._pruneFieldGear();
        this._pruneSpecialties();
        return true;
    }

    /** Mounts the platoon on a creature (TO:AUE p.106), making it beast-mounted; false for a creature not on the table. */
    public setMount(tag: string): boolean {
        const mount = findInfantryBeastMount(tag);
        if (!mount) return false;
        this._motive = INFANTRY_MOTIVE_TYPES.find((item) => item.tag === "beast") ?? this._motive;
        this._mount = mount;
        this.applyFormation();
        this._clampWeapons();
        this._pruneFieldGear();
        this._pruneSpecialties();
        return true;
    }

    /**
     * The squad size and count of the Formations Table, or a full beast-mounted platoon (TO:AUE p.107): a squad is one creature's riders.
     * The VTOL and SCUBA motives are on no row of the table: they take the arrangement of the motive they are built on (foot, motorized,
     * mechanized), held to their own squad size and squad limits (TO:AUE pp.135, 153); a specialty holds the squad size too.
     */
    public getFormationSizes(): [number, number] {
        const size = this.getBeastSize();
        if (size) return size.troopsPerCreature === 1 ? this._formation.sizes.beast ?? [7, 3] : [size.troopsPerCreature, size.creaturesPerPlatoon];
        const motive = this._motive;
        const listed = this._formation.sizes[motive.tag] ?? this._formation.sizes[INFANTRY_FORMATION_LIKE[motive.tag] ?? "foot"] ?? [7, 4];
        return [Math.min(listed[0], this.getMaxSquadSize()), Math.min(listed[1], motive.maxSquads ?? INFANTRY_MAX_SQUADS)];
    }

    /** Sets the squad size and count the Formations Table gives this affiliation and motive type (TM p.147). */
    public applyFormation(): void {
        const [squadSize, squads] = this.getFormationSizes();
        this._squadSize = squadSize;
        this._squads = squads;
        this.resetInPlay();
        this._clampSecondaryCount();
    }

    /** True while the platoon keeps the Formations Table's arrangement; a designer may choose another (TM p.146). */
    public usesFormationSizes(): boolean {
        const [squadSize, squads] = this.getFormationSizes();
        return this._squadSize === squadSize && this._squads === squads;
    }

    public getSquadSize(): number { return this._squadSize; }
    public getSquads(): number { return this._squads; }
    public setSquadSize(size: number): void {
        this._squadSize = savedNumber(size, this._squadSize, 1, this.getMaxSquadSize());
        this._clampSecondaryCount();
        this.resetInPlay();
    }
    public setSquads(count: number): void {
        this._squads = savedNumber(count, this._squads, 1, INFANTRY_MAX_SQUADS);
        this.resetInPlay();
    }
    public getTroopers(): number { return this._squadSize * this._squads; }

    /**
     * Troopers on each record sheet line. A formation over the motive type's platoon maximum is split as evenly as
     * possible into sub-platoons, odd troopers going to the first (TM p.146).
     */
    public getSubPlatoons(): number[] {
        const troopers = this.getTroopers();
        const count = Math.max(1, Math.ceil(troopers / this.getMaxPlatoonSize()));
        const base = Math.floor(troopers / count);
        const extra = troopers - base * count;
        return Array.from({ length: count }, (_unused, index) => base + (index < extra ? 1 : 0));
    }
    public isOversized(): boolean { return this.getSubPlatoons().length > 1; }

    // Step 2: weapons (TM pp.148-152)

    public getPrimaryWeapon(): IInfantryWeapon { return this._primary; }
    public getSecondaryWeapon(): IInfantryWeapon | null { return this._secondary; }
    public getSecondaryPerSquad(): number { return this._secondary ? this._secondaryPerSquad : 0; }
    /** Troopers firing the secondary weapon: one per weapon, whatever its crew (TM p.151). */
    public getSecondaryCount(): number { return this.getSecondaryPerSquad() * this._squads; }
    /** Troopers firing the primary weapon: those left after the secondary weapons, the paramedics and the TAG troopers (who carry no weapon of the platoon). */
    public getPrimaryCount(): number { return Math.max(0, this.getTroopers() - this.getSecondaryCount() - this.getParamedicCount() - this.getTagTrooperCount()); }

    public isWeaponForTechBase(weapon: IInfantryWeapon): boolean { return this._mixedTech || weapon.techBase === "universal" || weapon.techBase === this._techBase; }

    /** Why the platoon may not carry the weapon at all, or null when it may. */
    private _weaponBar(weapon: IInfantryWeapon): string | null {
        if (!this.isWeaponForTechBase(weapon)) return `${weapon.name} is not available to ${this.isClan() ? "Clan" : "Inner Sphere"} infantry`;
        if (this.isMechanized() && weapon.type === "melee") return "Mechanized infantry may not use melee weapons (TM p.148)";
        if (this.isMechanized() && weapon.damageType === "P") return "Mechanized infantry may not use point-blank weapons (TM p.148)";
        // "Support weapons" are the Support type of the Conventional Infantry Weapons Table (TM p.148), whatever their crew.
        if (weapon.type === "support" && this.getBeastSize()?.supportWeapons === 0) return "Infantry mounted on Large creatures may not carry support weapons (TO:AUE p.107)";
        if (weapon.tag === INFANTRY_SUPPORT_PPC_TAG && this._motive.tag !== "motorized" && this._motive.tag !== "mech-tracked") {
            return "The Support Particle Cannon may only be carried by motorized and mechanized (tracked) platoons (TM p.352)";
        }
        return null;
    }

    /** Primary weapons must be Melee or Standard (TM p.150). */
    public canBePrimary(weapon: IInfantryWeapon): boolean {
        return weapon.type !== "support" && this._weaponBar(weapon) === null;
    }

    /** A platoon with a Melee primary weapon may only add a Melee or Standard secondary (TM p.151). */
    public canBeSecondary(weapon: IInfantryWeapon): boolean {
        if (this._weaponBar(weapon) !== null) return false;
        if (this._primary.type === "melee" && weapon.type === "support") return false;
        return this.getMaxSecondaryPerSquad(weapon) > 0;
    }

    /** Weapons on offer: those the platoon may carry that its era and rules level have, and the one it carries already. */
    public getAvailablePrimaryWeapons(rulesLevel: number = INFANTRY_RULES_LEVEL): IInfantryWeapon[] {
        return infantryWeapons.filter((weapon) => this.canBePrimary(weapon)
            && ((this.isWeaponInEra(weapon) && isInfantryWeaponAtRulesLevel(weapon, rulesLevel)) || weapon.tag === this._primary.tag));
    }
    public getAvailableSecondaryWeapons(rulesLevel: number = INFANTRY_RULES_LEVEL): IInfantryWeapon[] {
        return infantryWeapons.filter((weapon) => this.canBeSecondary(weapon)
            && ((this.isWeaponInEra(weapon) && isInfantryWeaponAtRulesLevel(weapon, rulesLevel)) || weapon.tag === this._secondary?.tag));
    }

    /** 2 per squad, or the squad's troopers divided by the weapon's crew, whichever is lower (TM p.151). */
    public getMaxSecondaryPerSquad(weapon: IInfantryWeapon | null = this._secondary): number {
        if (!weapon) return 0;
        const size = this.getBeastSize();
        // Dermal armor and triple-strength myomer each cut every crew by 1 and let a squad carry one more secondary weapon (IO:AE pp.74-75).
        const squadLimit = INFANTRY_MAX_SECONDARY_PER_SQUAD + this.getStrengthImplantCount();
        // Beast-mounted: a creature carries the support weapons its size allows, with each crew halved, rounded up (TO:AUE p.107).
        if (size) {
            const crew = Math.max(1, Math.ceil(this.getEffectiveCrew(weapon) / 2));
            const limit = weapon.type === "support" ? size.supportWeapons : squadLimit;
            return Math.max(0, Math.min(limit - this.getSpecialTroopersPerSquad(), Math.floor(this._squadSize / crew)));
        }
        // The motive, the specialties and the implants hold the secondary weapons a squad carries; paramedics and TAG troopers
        // take slots (TO:AUE p.153).
        return Math.max(0, Math.min(this.getSecondarySlotsPerSquad() - this.getSpecialTroopersPerSquad(), Math.floor(this._squadSize / Math.max(1, this.getEffectiveCrew(weapon)))));
    }

    public setPrimaryWeapon(tag: string): boolean {
        const weapon = findInfantryWeapon(tag);
        if (!weapon || !this.canBePrimary(weapon)) return false;
        this._primary = weapon;
        if (this._secondary && !this.canBeSecondary(this._secondary)) this.setSecondaryWeapon("");
        this._pruneFieldGear();
        return true;
    }

    /** An empty tag removes the secondary weapon. A newly chosen weapon starts at one per squad. */
    public setSecondaryWeapon(tag: string): boolean {
        if (!tag) {
            this._secondary = null;
            this._secondaryPerSquad = 0;
            this._pruneFieldGear();
            return true;
        }
        const weapon = findInfantryWeapon(tag);
        if (!weapon || !this.canBeSecondary(weapon)) return false;
        this._secondary = weapon;
        if (this._secondaryPerSquad < 1) this._secondaryPerSquad = 1;
        this._clampSecondaryCount();
        return true;
    }

    public setSecondaryPerSquad(count: number): void {
        this._secondaryPerSquad = savedNumber(count, this._secondaryPerSquad, 0, INFANTRY_MAX_SECONDARY_PER_SQUAD_AUGMENTED);
        this._clampSecondaryCount();
    }

    private _clampSecondaryCount(): void {
        this._clampSpecialTroopers();
        if (!this._secondary) {
            this._secondaryPerSquad = 0;
            return;
        }
        this._secondaryPerSquad = Math.min(this._secondaryPerSquad, this.getMaxSecondaryPerSquad());
        this._pruneFieldGear();
    }

    private _clampWeapons(): void {
        if (!this.canBePrimary(this._primary)) {
            const fallback = findInfantryWeapon(DEFAULT_PRIMARY);
            this._primary = fallback && this.canBePrimary(fallback) ? fallback : this.getAvailablePrimaryWeapons()[0] ?? this._primary;
        }
        if (this._secondary && !this.canBeSecondary(this._secondary)) this.setSecondaryWeapon("");
        this._clampSecondaryCount();
    }

    /** True when the platoon carries 2 Support secondary weapons per squad, which costs it mobility (TM p.151). */
    public carriesHeavySupportLoad(): boolean {
        // Dermal armor or triple-strength myomer carry the weapons with no MP reduction (IO:AE pp.74-75).
        return !!this._secondary && this._secondary.type === "support" && this.getSecondaryPerSquad() >= 2 && this.getStrengthImplantCount() === 0;
    }

    /** Foot platoons with 2 support weapons per squad may move or fire in a turn, not both (TM p.151); prosthetic leg MASC frees them to do both (IO:AE p.77). */
    public isMoveOrFire(): boolean { return this._motive.tag === "foot" && this.carriesHeavySupportLoad() && !this._has("aug-pl-masc"); }

    public getMP(): number {
        // Beast-mounted infantry move by the creature: support weapons on a Very Large or Monstrous creature cost no MP, and a Large one
        // carries none (TO:AUE p.107). Encumbering armor still takes 1 MP, to a minimum of 1 (p.130; NGCFells 2026-11-23).
        if (this.isBeastMounted()) return this._armor?.encumbering ? Math.max(1, this.getMotive().mp - 1) : this.getMotive().mp;
        let mp = this.getMotive().mp;
        if (this.carriesHeavySupportLoad()) mp -= this._motive.supportMPLoss;
        // A micro-copter platoon with any support weapon loses 1 VTOL MP (TO:AUE p.136).
        if (this._motive.supportAnyMPLoss && this._secondary?.type === "support" && this.getSecondaryCount() > 0) mp -= this._motive.supportAnyMPLoss;
        // Encumbering armor: -1 MP, to a minimum of 1, on top of the support weapon penalty (TO:AUE p.130). "The platoon's
        // mobility" is its ground or VTOL movement; jump MP stays (NGCFells 2026-11-23; the MUL's Royal Gurkha 115).
        if (this._armor?.encumbering && this._motive.tag !== "jump") mp = Math.max(1, mp - 1);
        // Prosthetic leg MASC: +1 Ground MP for foot infantry; a platoon held to move-or-fire keeps its 1 MP and may attack too (IO:AE p.77).
        if (this._motive.tag === "foot" && this._has("aug-pl-masc") && !this.carriesHeavySupportLoad()) mp += 1;
        if (this.getSecondaryCount() > 0 && this._secondary?.tag === INFANTRY_SUPPORT_PPC_TAG) mp = Math.min(mp, INFANTRY_SUPPORT_PPC_MP);
        // A platoon with field artillery moves as motorized infantry with 1 MP (TO:AUE p.123).
        if (this.isFieldArtillery()) mp = 1;
        return Math.max(0, mp);
    }

    /**
     * The MP as the record sheet prints it. A VTOL platoon may also walk 1 MP as foot infantry (TO:AUE p.135); a SCUBA platoon (not the
     * mechanized one) walks 1 MP and swims at the motive's MP (p.153); a Microlite must move at least 1 hex a turn to stay up.
     */
    public getMovementText(): string {
        const motive = this.getMotive();
        const ground = motive.groundMP !== undefined ? ` ${motive.groundMP} (Ground)` : "";
        // Powered flight wings give VTOL movement beside the ground MP (IO:AE p.185).
        const flight = this.getFlightMP() > 0 ? `, ${this.getFlightMP()} (VTOL)` : "";
        if (motive.scuba && motive.groundMP !== undefined) return `${motive.groundMP} (Ground), ${this.getMP()} (Submarine)${flight}`;
        return `${this.getMP()} (${motive.moveType})${motive.vtol ? `,${ground}` : ""}${flight}${this.isMoveOrFire() ? ", Move or Shoot" : ""}`;
    }

    /** The weapon whose range, modifiers and damage type the platoon attacks with (TM p.152). */
    public getRangeWeapon(): IInfantryWeapon {
        return this._secondary && this.getSecondaryPerSquad() >= 2 ? this._secondary : this._primary;
    }

    /** Weapons the platoon actually fields. */
    private _fieldedWeapons(): IInfantryWeapon[] {
        return this._secondary && this.getSecondaryCount() > 0 ? [this._primary, this._secondary] : [this._primary];
    }

    // Field gear (Maximum Tech p.40)

    private _fieldGear: string[] = [];

    /** Whether the fielded weapons include a laser, which TAG needs. */
    private _hasLaser(): boolean { return this._fieldedWeapons().some((weapon) => /laser/i.test(weapon.name)); }

    /** The field gear on offer, all apocryphal here; TAG only with a laser. */
    public getFieldGearOptions(): { tag: string; name: string; cost: number; apocryphal: boolean; available: boolean }[] {
        return INFANTRY_FIELD_GEAR.map((gear) => ({ tag: gear.tag, name: gear.name, cost: gear.cost, apocryphal: true, available: gear.tag === "inf-field-tag" ? this._hasLaser() : !this.isMechanized() }));
    }
    public getFieldGear(): string[] { return [...this._fieldGear]; }
    /** Replaces the field gear; false (and no change) when a tag is unknown or TAG is asked of a platoon without a laser. */
    public setFieldGear(tags: string[]): boolean {
        const offered = this.getFieldGearOptions();
        if (tags.some((tag) => !offered.some((option) => option.tag === tag && option.available))) return false;
        this._fieldGear = INFANTRY_FIELD_GEAR.map((gear) => gear.tag as string).filter((tag) => tags.includes(tag));
        return true;
    }
    /** Takes the TAG off when the lasers are gone. */
    private _pruneFieldGear(): void {
        this._fieldGear = this._fieldGear.filter((tag) => (tag !== "inf-field-tag" || this._hasLaser()) && (tag !== "inf-field-narc" || !this.isMechanized()));
    }
    /** Disposable Narc launchers carried: one a squad, at most four a platoon (three for jump infantry). */
    public getNarcLaunchers(): number {
        return this._fieldGear.includes("inf-field-narc") ? Math.min(this._squads, this._motive.tag === "jump" ? 3 : 4) : 0;
    }

    // Field guns and field artillery (Tactical Operations: Advanced Units & Equipment pp.122-123, 190-191, 225)

    private _fieldGun: IEquipmentItem | null = null;
    private _fieldGunCount: number = 0;
    private _fieldGunAmmo: IEquipmentItem[] = [];

    /** The one weapon every field gun is, or the field artillery piece; null for a platoon with none. */
    public getFieldGunWeapon(): IEquipmentItem | null { return this._fieldGun; }
    public getFieldGunCount(): number { return this._fieldGun ? this._fieldGunCount : 0; }
    public hasFieldGuns(): boolean { return this.getFieldGunCount() > 0; }
    public getFieldGunKind(): InfantryFieldGunKind | null { return this._fieldGun ? getFieldGunKind(this._fieldGun) : null; }
    public isFieldArtillery(): boolean { return this.getFieldGunKind() === "artillery"; }
    /** Troopers that crew one gun: its tons rounded up, ammunition not counted, at least 2 (p.122). */
    public getFieldGunCrew(): number { return this._fieldGun ? getFieldGunCrew(this._fieldGun) : 0; }
    /** Most guns the troopers can crew; field artillery is one piece (p.122). */
    public getMaxFieldGuns(): number {
        if (!this._fieldGun) return 0;
        return this.isFieldArtillery() ? 1 : Math.floor(this.getTroopers() / this.getFieldGunCrew());
    }
    /** Why this platoon may not tow field guns, or null when it may: motorized, or mechanized wheeled or tracked (p.122). */
    public getFieldGunBar(): string | null {
        return FIELD_GUN_MOTIVES.includes(this._motive.tag) ? null : "Field guns and field artillery may only be towed by motorized or mechanized wheeled or tracked platoons (TO:AUE p.122)";
    }
    /** The weapons on offer: those this technology base has, in the platoon's era and at the rules level, and the one it carries. */
    public getAvailableFieldGuns(rulesLevel: number = INFANTRY_FIELD_GUN_RULES_LEVEL): IEquipmentItem[] {
        if (this.getFieldGunBar() !== null) return [];
        return getFieldGunRecords(this._fieldGunBases()).filter((item) => item.tag === this._fieldGun?.tag
            || (this._isFieldGunInEra(item) && Math.max(INFANTRY_FIELD_GUN_RULES_LEVEL, getEquipmentRulesLevel(item)) <= rulesLevel));
    }
    private _isFieldGunInEra(item: IEquipmentItem): boolean {
        return typeof item.introduced !== "number" || item.introduced <= (this._era.yearEnd ?? Number.POSITIVE_INFINITY);
    }
    /** The ammunition a ton of this weapon may hold; an LB-X fires cluster only (p.123). */
    public getFieldGunAmmoOptions(): IEquipmentItem[] { return this._fieldGun ? getFieldGunAmmoOptions(this._fieldGun, this._fieldGunBases()) : []; }
    /** The technology bases the guns come from: the platoon's, and the other one too with mixed technology (TO:AUE p.189). */
    private _fieldGunBases(): ("is" | "clan")[] {
        return this._mixedTech ? [this._techBase, this._techBase === "clan" ? "is" : "clan"] : [this._techBase];
    }
    /** One ton of ammunition for each gun (p.123); each ton may be a different type. */
    public getFieldGunAmmo(): IEquipmentItem[] { return [...this._fieldGunAmmo]; }
    private _defaultFieldGunAmmo(): IEquipmentItem | null { return this.getFieldGunAmmoOptions()[0] ?? null; }

    /**
     * Takes one weapon type as the platoon's field guns, the count held to what the crew can man (and to one for artillery,
     * never under one). An empty tag, or a count of 0, takes them off. False, with no change, when the weapon is not a field
     * gun this technology base has or the platoon cannot tow guns. The ammunition is one standard ton (cluster for an LB-X) a gun.
     */
    public setFieldGuns(tag: string, count: number): boolean {
        if (!tag || !(count >= 1)) {
            this._fieldGun = null;
            this._fieldGunCount = 0;
            this._fieldGunAmmo = [];
            this._inPlay.fieldGuns = undefined;
            return true;
        }
        const weapon = findFieldGunRecord(tag, this._fieldGunBases());
        if (!weapon || this.getFieldGunBar() !== null) return false;
        const same = this._fieldGun?.tag === weapon.tag;
        this._fieldGun = weapon;
        this._fieldGunCount = Math.max(1, Math.min(Math.round(count), this.getMaxFieldGuns()));
        const kept = same ? this._fieldGunAmmo : [];
        const fallback = this._defaultFieldGunAmmo();
        this._fieldGunAmmo = Array.from({ length: this._fieldGunCount }, (_unused, index) => kept[index] ?? fallback).filter((ammo): ammo is IEquipmentItem => ammo !== null);
        this._inPlay.fieldGuns = undefined;
        return true;
    }

    /** Loads ton `index` with this ammunition; false when the weapon cannot fire it (an LB-X with a slug round) or there is no such ton. */
    public setFieldGunAmmo(index: number, tag: string): boolean {
        if (!this._fieldGun || index < 0 || index >= this._fieldGunCount) return false;
        const ammo = findFieldGunAmmo(tag, this._fieldGun, this._fieldGunBases());
        if (!ammo) return false;
        const loaded = [...this._fieldGunAmmo];
        loaded[index] = ammo;
        this._fieldGunAmmo = loaded;
        this._inPlay.fieldGuns = undefined;
        return true;
    }

    /** Tons of the guns and their ammunition, added to the transport weight (p.122). */
    public getFieldGunWeight(): number {
        return this._fieldGun ? this.getFieldGunCount() * (this._fieldGun.weight + 1) : 0;
    }

    /** Battle Value of the guns and of their ammunition (TO:AUE p.191); the ammunition is held to the guns' value, as for any unit. */
    public getFieldGunBattleValue(): { weapons: number; ammo: number; log: string[]; count: number; each: number; name: string; tons: number; loaded: number } {
        const weapon = this._fieldGun;
        if (!weapon || this.getFieldGunCount() === 0) return { weapons: 0, ammo: 0, log: [], count: 0, each: 0, name: "", tons: 0, loaded: 0 };
        const each = (this.isClan() && weapon.battleValueClan !== undefined ? weapon.battleValueClan : weapon.battleValue) ?? 0;
        const weapons = each * this.getFieldGunCount();
        const loaded = this._fieldGunAmmo.reduce((sum, ammo) => sum + getAmmoBattleValuePerTon(weapon, ammo), 0);
        const ammo = Math.min(loaded, weapons);
        const log = [`Field ${this.isFieldArtillery() ? "artillery" : "guns"}: ${this.getFieldGunCount()} x ${weapon.name} (${format(each)}) = ${format(weapons)}`];
        if (loaded > 0) log.push(`${weapon.name} ammunition: ${this._fieldGunAmmo.length} tons = ${format(ammo)}${ammo < loaded ? ` (held to the guns' value; ${format(loaded)} carried)` : ""}`);
        return { weapons, ammo, log, count: this.getFieldGunCount(), each, name: weapon.name, tons: this._fieldGunAmmo.length, loaded };
    }

    /** Guns the troopers still crew: each needs its full crew; field artillery is lost when the troopers fall under its tons (p.123). */
    public getActiveFieldGuns(): number {
        const weapon = this._fieldGun;
        if (!weapon) return 0;
        const troopers = this.getCurrentTroopers();
        if (this.isFieldArtillery()) return troopers >= Math.ceil(weapon.weight - 1e-9) ? 1 : 0;
        return Math.min(this.getFieldGunCount(), Math.floor(troopers / this.getFieldGunCrew()));
    }
    /** Anti-'Mech attacks in play: not while a gun stands (p.123), and not at all when the build bars them. */
    public canMakeAntiMechAttacksNow(): boolean {
        return !this.isMechanized() && !this._armor?.encumbering && this.getActiveFieldGuns() === 0;
    }
    /** The Anti-'Mech Skill in play: the kit's once the guns are gone, otherwise the fixed 8 (TM p.155). */
    public getAntiMechSkillNow(): number { return this.canMakeAntiMechAttacksNow() && this.isAntiMechKitChosen() ? this._antiMech : INFANTRY_FIXED_ANTI_MECH_SKILL; }

    private _fieldGunPlay(): { facing: number; shots?: number[]; moved?: boolean; usedInfantryWeapons?: boolean } {
        return this._inPlay.fieldGuns ?? (this._inPlay.fieldGuns = { facing: 0 });
    }
    public getFieldGunFacing(): number { return this._inPlay.fieldGuns?.facing ?? 0; }
    public setFieldGunFacing(facing: number): void { this._fieldGunPlay().facing = savedNumber(facing, 0, 0, FIELD_GUN_FACINGS - 1); }
    public setFieldGunMoved(moved: boolean): void { this._fieldGunPlay().moved = !!moved; }
    public setFieldGunUsedInfantryWeapons(used: boolean): void { this._fieldGunPlay().usedInfantryWeapons = !!used; }
    public hasFieldGunMoved(): boolean { return !!this._inPlay.fieldGuns?.moved; }
    public hasFieldGunUsedInfantryWeapons(): boolean { return !!this._inPlay.fieldGuns?.usedInfantryWeapons; }
    /** Rounds left in each ton of ammunition; full until a gun fires. */
    public getFieldGunShots(): number[] {
        const weapon = this._fieldGun;
        if (!weapon) return [];
        const saved = this._inPlay.fieldGuns?.shots;
        if (saved && saved.length === this._fieldGunAmmo.length) return [...saved];
        return this._fieldGunAmmo.map((ammo) => Math.floor(getFieldGunShotsPerTon(weapon, ammo)));
    }
    /** The End Phase: the guns may fire again next turn (see endTurnStun). */
    private _endTurnFieldGuns(): void {
        const play = this._inPlay.fieldGuns;
        if (play) { delete play.moved; delete play.usedInfantryWeapons; }
    }

    /** Why the guns cannot fire now, or null when they can (TO:AUE p.123). */
    public canFireFieldGuns(): string | null {
        if (!this._fieldGun) return "The platoon has no field guns";
        if (this.getActiveFieldGuns() === 0) return "No gun is crewed: the platoon plays as a normal platoon of its type";
        if (this.hasFieldGunMoved()) return "The platoon moved this turn, so its field guns cannot fire";
        if (this.hasFieldGunUsedInfantryWeapons()) return "The platoon used its infantry weapons this turn, so its field guns cannot fire";
        return null;
    }

    /** The damage one shot of the weapon does at the vehicle scale: its own value, or the size in its name (an Ultra, LB-X or Rotary). */
    private _fieldGunDamage(weapon: IEquipmentItem): number {
        if (typeof weapon.damage === "number") return weapon.damage;
        return Number(/(\d+)/.exec(weapon.name)?.[1] ?? 0);
    }
    private _fieldGunRangeText(weapon: IEquipmentItem): string {
        const range = weapon.range;
        if (this.isFieldArtillery() && range.maxMapSheets) return `up to ${range.maxMapSheets} map sheets`;
        return `minimum ${range.min ?? 0}, short ${range.short}, medium ${range.medium}, long ${range.long}`;
    }

    /**
     * Fires `guns` guns, each `shotsEach` rounds, at one or several targets in the platoon's arc (no secondary target modifier,
     * p.123); the rounds come out of the platoon's ammunition, the first ton with rounds first. Says what happened; a refusal
     * spends nothing.
     */
    public fireFieldGuns(guns: number, shotsEach: number = 1): string[] {
        const weapon = this._fieldGun;
        const reason = this.canFireFieldGuns();
        if (!weapon || reason) return [reason ?? "The platoon has no field guns"];
        const active = this.getActiveFieldGuns();
        const fired = savedNumber(guns, 1, 1, 1000);
        const rounds = fired * savedNumber(shotsEach, 1, 1, 100);
        if (fired > active) return [`Only ${active} ${active === 1 ? "gun is" : "guns are"} crewed`];
        const shots = this.getFieldGunShots();
        const left = shots.reduce((sum, value) => sum + value, 0);
        if (rounds > left) return [`Only ${left} ${left === 1 ? "round is" : "rounds are"} left`];
        let owed = rounds;
        for (let ton = 0; ton < shots.length && owed > 0; ton++) {
            const taken = Math.min(shots[ton], owed);
            shots[ton] -= taken;
            owed -= taken;
        }
        this._fieldGunPlay().shots = shots;
        const damage = this._fieldGunDamage(weapon);
        return [`Fired ${fired} x ${weapon.name}, ${rounds} ${rounds === 1 ? "round" : "rounds"}: damage ${damage} each, range ${this._fieldGunRangeText(weapon)}, facing ${this.getFieldGunFacing()}; ${left - rounds} rounds left`];
    }

    /** The field gun rules that apply in play (TO:AUE p.123), for the play panel and the record sheet. */
    public getFieldGunPlayNotes(): string[] {
        const weapon = this._fieldGun;
        if (!weapon) return [];
        const notes: string[] = [];
        if (this.isFieldArtillery()) {
            notes.push("The platoon moves as motorized infantry with 1 MP and spends MP to change facing like a vehicle (TO:AUE p.123).");
            notes.push("Field artillery must fire into its turret arc, and cannot fire in a turn the platoon moved or used its infantry weapons; against airborne units it fires flak as direct-fire artillery does (TO:AR p.153).");
            notes.push(`The artillery is lost when the troopers fall under ${Math.ceil(weapon.weight - 1e-9)}.`);
            return notes;
        }
        notes.push("Each gun fires with its vehicle weapon's range, damage and modifiers; one facing for all (a turret arc, TW pp.105-106); several targets in that arc, no secondary target modifier (TO:AUE p.123).");
        notes.push("Field guns cannot fire in a turn the platoon moved or used its infantry weapons, and cannot attack the same hex as the platoon; they may fire at airborne aerospace units.");
        notes.push("A gun with no full crew counts destroyed as troopers die; ammunition is kept for the platoon, not for a gun, and trooper loss does not cut it. With every gun gone the platoon plays as a normal platoon of its type.");
        if (/ultra|uac|rotary|rac/.test(weapon.tag)) notes.push("Ultra and Rotary field guns never jam, and are immune to fire control failures.");
        if (/gauss/.test(weapon.tag)) notes.push("Gauss field guns never explode.");
        if (/lbx/.test(weapon.tag)) notes.push("An LB-X field gun fires cluster ammunition only, and may make flak attacks (TW p.114).");
        notes.push("The platoon makes no Anti-'Mech attacks while it has a gun.");
        return notes;
    }

    /**
     * The field guns as the record sheet prints them: the guns, their crew, the ammunition ton by ton and the facing; in play, the
     * guns still crewed and the rounds left in each ton (TO:AUE p.123).
     */
    public getFieldGunSheetText(inPlay: boolean = false): string {
        const weapon = this._fieldGun;
        if (!weapon || this.getFieldGunCount() === 0) return "";
        const count = this.getFieldGunCount();
        const what = this.isFieldArtillery() ? `Field artillery: ${weapon.name}, needs ${Math.ceil(weapon.weight - 1e-9)} troopers` : `Field guns: ${count} x ${weapon.name}, crew ${this.getFieldGunCrew()} each (${count * this.getFieldGunCrew()})`;
        const ammo = this._fieldGunAmmo.map((item) => item.name.replace(/\s*ammo$/i, "")).join(", ");
        if (!inPlay) return `${what}. Ammunition (a ton each): ${ammo || "none"}. Facing (0-5): ____.`;
        return `${what}. Crewed: ${this.getActiveFieldGuns()} of ${count}. Rounds left by ton: ${this.getFieldGunShots().join(" / ")}. Facing ${this.getFieldGunFacing()}.`;
    }

    /**
     * Alpha Strike for the guns. No Alpha Strike book converts field guns (ASC pp.96-103 cover only the infantry weapons), so
     * this follows MegaMek's conversion and is inferred: guns replace the infantry damage with their vehicle weapon values
     * (x 0.75 when a gun has under 10 rounds, as for a vehicle) and give AC; field artillery keeps the infantry damage and
     * adds its artillery special. Flak (FLK) is not converted: no rule here sets it.
     */
    private _fieldGunAlphaStrike(): { damage: { short: IInfantryASDamageValue; medium: IInfantryASDamageValue; long: IInfantryASDamageValue } | null; specials: string[]; log: string[] } | null {
        const weapon = this._fieldGun;
        if (!weapon || this.getFieldGunCount() === 0) return null;
        const log: string[] = [];
        if (this.isFieldArtillery()) {
            const specials = getAllowedAlphaStrikeCodes(weapon, this.getRequiredRulesLevel());
            log.push(`Field artillery ${weapon.name} (inferred from MegaMek, no printed rule): infantry damage kept; special ${specials.join(", ") || "none on its record"}`);
            return { damage: null, specials, log };
        }
        const rounds = this._fieldGunAmmo.reduce((sum, ammo) => sum + Math.floor(getFieldGunShotsPerTon(weapon, ammo)), 0);
        const multiplier = rounds / this.getFieldGunCount() >= 10 ? 1 : 0.75;
        const as = weapon.alphaStrike;
        const raw = [as?.rangeShort ?? 0, as?.rangeMedium ?? 0, as?.rangeLong ?? 0].map((value) => value * multiplier * this.getFieldGunCount());
        const tenth = (value: number): number => Math.ceil(Math.round(value * 1000) / 100) / 10;
        const convert = (value: number): IInfantryASDamageValue => {
            const rounded = tenth(value);
            return rounded <= 0 ? { damage: 0, minimal: false } : rounded < 0.5 ? { damage: 0, minimal: true } : { damage: Math.ceil(rounded), minimal: false };
        };
        const damage = { short: convert(raw[0]), medium: convert(raw[1]), long: convert(raw[2]) };
        log.push(`Field guns (inferred from MegaMek, no printed rule): ${this.getFieldGunCount()} x ${weapon.name} at ${as?.rangeShort ?? 0}/${as?.rangeMedium ?? 0}/${as?.rangeLong ?? 0}${multiplier < 1 ? ` x ${multiplier} (under 10 rounds a gun)` : ""} = ${raw.map((value) => value.toFixed(2)).join("/")}; ${[damage.short, damage.medium, damage.long].map(formatInfantryASDamage).join("/")}`);
        const specials: string[] = [];
        if ((as?.notes ?? []).some((note) => note.toLowerCase() === "ac") && tenth(raw[1]) >= 1) {
            specials.push(`AC${[damage.short, damage.medium, damage.long].map((_value, index) => (Math.round(tenth(raw[index])) || "-")).join("/")}`);
        }
        return { damage, specials, log };
    }

    /** A primary weapon over the 0.60 limit counts as 0.60 and gives the platoon heavy burst (TM p.150). */
    public isPrimaryDamageCapped(): boolean { return this._primary.damage > INFANTRY_MAX_PRIMARY_DAMAGE; }
    public getPrimaryDamage(): number { return Math.min(this._primary.damage, INFANTRY_MAX_PRIMARY_DAMAGE); }

    /** Special feature codes that apply to the platoon's attack (Infantry Weapon Classifications Table, TM p.148). */
    public getSpecialFeatures(): string[] {
        const features = new Set<string>();
        for (const weapon of this._fieldedWeapons()) {
            // Anti-aircraft and flame-based: one weapon is enough.
            if (weapon.special.includes("A")) features.add("A");
            if (weapon.special.includes("F")) features.add("F");
        }
        if (this.hasHeavyBurst()) features.add("B");
        // Non-penetrating applies only when that weapon sets the Base Range.
        if (this.getRangeWeapon().special.includes("N")) features.add("N");
        return [...features].sort();
    }

    /** Heavy burst needs at least 2 such weapons per squad; a primary weapon is carried by far more than that. */
    public hasHeavyBurst(): boolean {
        if (this._primary.special.includes("B") || this.isPrimaryDamageCapped()) return true;
        return !!this._secondary && this._secondary.special.includes("B") && this.getSecondaryPerSquad() >= 2;
    }

    /**
     * Modifier added in the platoon's own hex on top of the range table: +1 for a point-blank weapon, -1 for heavy
     * burst and +1 for a weapon with a crew of 2 or more, or of 1E (TM pp.148-149, 152).
     */
    public getSameHexModifier(): number {
        let modifier = 0;
        if (this.getRangeWeapon().damageType === "P") modifier += 1;
        if (this.hasHeavyBurst()) modifier -= 1;
        // Dermal armor and triple-strength myomer cut the crews and remove the encumbering of the weapons (IO:AE pp.74-75).
        const strong = this.getStrengthImplantCount() > 0;
        if (this._fieldedWeapons().some((weapon) => this.getEffectiveCrew(weapon) >= 2 || (weapon.encumbering && !strong))) modifier += 1;
        return modifier;
    }

    /** To-hit modifiers from the platoon's own hex outwards, with the implants' modifier on every one; the list ends at its maximum range. */
    public getRangeModifiers(): number[] {
        const row = INFANTRY_RANGE_MODIFIERS[this.getRangeWeapon().baseRange] ?? INFANTRY_RANGE_MODIFIERS[0];
        const implants = this.getImplantToHitModifier();
        return row.map((modifier, range) => (range === 0 ? modifier + this.getSameHexModifier() : modifier) + implants);
    }
    public getMaxRange(): number { return this.getRangeModifiers().length - 1; }

    /** Damage of the full formation, rounded normally (TM p.152). */
    public getTotalDamage(): number {
        const secondary = this._secondary ? this.getSecondaryCount() * this._secondary.damage : 0;
        return roundNormally(secondary + this.getPrimaryCount() * this.getPrimaryDamage());
    }
    public getDamagePerTrooper(): number {
        const troopers = this.getTroopers();
        return troopers > 0 ? this.getTotalDamage() / troopers : 0;
    }
    /** Damage with that many troopers left on a record sheet line (TM p.152). */
    public getDamageForTroopers(troopers: number): number { return roundNormally(this.getDamagePerTrooper() * Math.max(0, troopers)); }
    /** Max Weapon Damage boxes for one record sheet line: index 0 is one surviving trooper. */
    public getDamageTable(lineTroopers: number = this.getSubPlatoons()[0]): number[] {
        return Array.from({ length: lineTroopers }, (_unused, index) => this.getDamageForTroopers(index + 1));
    }

    // Infantry armor (Tactical Operations: Advanced Units & Equipment pp.129-130)

    public getArmor(): IInfantryArmor | null { return this._armor; }
    /** 1 without infantry armor. */
    public getArmorDamageDivisor(): number { return this._armor ? this._armor.damageDivisor : 1; }
    /** The creature's divisor, 1 without one (TO:AUE p.106). */
    public getMountDamageDivisor(): number { return this.getMount()?.damageDivisor ?? 1; }
    /**
     * What divides the damage the platoon takes: the rider's divisor (armor and implants, 1 when unarmored, p.129) plus the
     * creature's, the same sum the Defensive Battle Rating uses (TO:AUE p.191, "Sum of Damage Divisors"). The text of p.108 says
     * the creature's divides damage "in the same fashion as infantry armor"; NGCFells ruled 2026-11-23 that this is the sum, not
     * the armor's division and then the creature's.
     */
    public getDamageDivisor(): number {
        const mount = this.getMount();
        return mount ? this.getImplantDamageDivisor() + mount.damageDivisor : this.getImplantDamageDivisor();
    }
    public isArmorForPlatoon(armor: IInfantryArmor): boolean {
        return this._mixedTech || armor.techBase === "universal" || armor.techBase === this._techBase;
    }
    public isArmorInEra(armor: IInfantryArmor): boolean {
        return typeof armor.introduced !== "number" || armor.introduced <= (this._era.yearEnd ?? Number.POSITIVE_INFINITY);
    }
    /** Armor on offer: what the technology base and era have, and the armor worn already. */
    public getAvailableArmor(): IInfantryArmor[] {
        return infantryArmor.filter((armor) => armor.tag === this._armor?.tag || (this.isArmorForPlatoon(armor) && this.isArmorInEra(armor)));
    }
    /** An empty tag removes the armor. The whole platoon wears one type. */
    public setArmor(tag: string): boolean {
        if (!tag) {
            this._armor = null;
            return true;
        }
        const armor = findInfantryArmor(tag);
        if (!armor || !this.isArmorForPlatoon(armor)) return false;
        this._armor = armor;
        return true;
    }
    /** Defensive Factor added for stealth armor (TO:AUE p.191); the modifiers are cumulative. */
    public getStealthDefensiveFactor(): number {
        return (this._armor?.stealth ?? []).reduce((sum, system) => sum + INFANTRY_STEALTH_SYSTEMS[system].defensiveFactor, 0);
    }

    // Anti-'Mech capability, weight (TM p.155)

    /** Mechanized platoons are barred from Anti-'Mech attacks and take no kits. */
    /**
     * True while the kits count. A platoon that cannot make Anti-'Mech attacks, for its motive type or its
     * encumbering armor, has neither the benefits nor the drawbacks of the kits it chose (their weight, cost and
     * skill) until it can again (user ruling, 2026-10-07).
     */
    public hasAntiMechKit(): boolean { return this._antiMechKit && this.canMakeAntiMechAttacks(); }
    /** The designer's choice, whether or not the platoon can use it now. */
    public isAntiMechKitChosen(): boolean { return this._antiMechKit && !this.isMechanized(); }
    public setAntiMechKit(equipped: boolean): boolean {
        if (equipped && this.isMechanized()) return false;
        this._antiMechKit = !!equipped;
        return true;
    }
    /**
     * Mechanized platoons cannot, nor can a platoon in encumbering armor (TO:AUE p.130), one with field guns (p.123), or one
     * on a Monstrous creature (the Creature Size Table: no Leg or Swarm attacks).
     */
    public canMakeAntiMechAttacks(): boolean {
        return !this.isMechanized() && !this._armor?.encumbering && !this.hasFieldGuns()
            && !!(this.getBeastSize()?.leg || this.getBeastSize()?.swarm || !this.isBeastMounted());
    }
    /** Leg attacks: not Monstrous creatures (p.107; the text of p.108 bars Very Large ones instead, see getNotes). */
    public canMakeLegAttacks(): boolean { return this.canMakeAntiMechAttacks() && (this.getBeastSize()?.leg ?? true); }
    /** Swarm attacks: Large creatures only. */
    public canMakeSwarmAttacks(): boolean { return this.canMakeAntiMechAttacks() && (this.getBeastSize()?.swarm ?? true); }

    // Beast-mounted infantry (TO:AUE pp.106-108)

    /**
     * Where the text of p.108 and the Creature Size Table (p.107) differ on a creature's anti-'Mech attacks: the table is
     * followed (NGCFells 2026-11-23) and the text quoted. Null for a Large creature, which the two treat alike.
     */
    public getBeastAntiMechNote(): string | null {
        const size = this.getBeastSize();
        if (size?.tag === "very-large") return `Anti-'Mech attacks follow the Creature Size Table (TO:AUE p.107): no Swarm attacks from a Very Large creature, Leg attacks allowed. The text of p.108 differs: "${INFANTRY_BEAST_TEXT_VERY_LARGE}"`;
        if (size?.tag === "monstrous") return `Anti-'Mech attacks follow the Creature Size Table (TO:AUE p.107): no Leg or Swarm attacks from a Monstrous creature. The text of p.108 says the same in other words: "${INFANTRY_BEAST_TEXT_MONSTROUS}"`;
        return null;
    }

    /** Added to the to-hit number of attacks against the platoon by the creature's size: 0, -1 or -2. */
    public getAttackerToHitModifier(): number { return this.getBeastSize()?.toHit ?? 0; }
    /** At range 0: D6 added against conventional infantry and points per platoon against other units; it stacks with anti-'Mech damage. */
    public getBonusDamage(): { infantryDice: number; others: number } {
        const mount = this.getMount();
        return { infantryDice: mount?.bonusVsInfantryDice ?? 0, others: mount?.bonusVsOthers ?? 0 };
    }
    public getBonusDamageText(): string {
        const { infantryDice, others } = this.getBonusDamage();
        if (infantryDice === 0 && others === 0) return "";
        return `${infantryDice > 0 ? `+${infantryDice}D6` : "No bonus"} against conventional infantry (${others} against other units) at range 0`;
    }
    /** Creatures carrying the troopers on a record sheet line: a Large creature carries 1, any other is one squad. */
    public getCreatures(troopers: number = this.getTroopers()): number {
        const size = this.getBeastSize();
        if (!size) return 0;
        return size.troopsPerCreature === 1 ? troopers : Math.ceil(troopers / Math.max(1, this._squadSize));
    }

    // Specialized infantry (TO:AUE pp.152-153), Xenoplanetary Condition-Trained (XCT) troops (pp.162-163)

    /**
     * What holds a squad's secondary weapon slots below the 2 a squad of TM p.151: a specialty (TO:AUE p.153) or the motive
     * (mechanized VTOL p.135, SCUBA p.153), with the page; null when nothing does.
     */
    public getSecondarySlotLimiter(): { name: string; page: string } | null {
        const slots = this.getSecondarySlotsPerSquad();
        if (slots >= INFANTRY_MAX_SECONDARY_PER_SQUAD + this.getStrengthImplantCount()) return null;
        const specialty = this._specialtyRecords().find((item) => item.maxSecondary === slots);
        if (specialty) return { name: specialty.name, page: "153" };
        return { name: `${this._motive.name} infantry`, page: this._motive.vtol ? "135" : "153" };
    }

    private _specialtyRecords(): IInfantrySpecialty[] {
        return this._specialties.map((tag) => findInfantrySpecialty(tag)).filter((item): item is IInfantrySpecialty => item !== undefined);
    }
    /** The specialties on the platoon, in the table's order; Paramedics and TAG Troops count while a squad has any. */
    public getSpecialties(): InfantrySpecialty[] {
        return INFANTRY_SPECIALTIES.map((item) => item.tag).filter((tag) => this.hasSpecialty(tag));
    }
    public hasSpecialty(tag: string): boolean {
        if (tag === "paramedics") return this._paramedicsPerSquad > 0;
        if (tag === "tag") return this._tagPerSquad > 0;
        return this._specialties.includes(tag as InfantrySpecialty);
    }
    /** The SCUBA types are motive types here (their movement differs); the book lists them among the specialties. */
    public isScuba(): boolean { return !!this._motive.scuba; }
    public isSpecialized(): boolean { return this.getSpecialties().length > 0 || this.isScuba(); }
    public getSpecialtyNames(): string[] {
        return [...this.getSpecialties().map((tag) => findInfantrySpecialty(tag)?.name ?? tag), ...(this._xct ? ["XCT"] : [])];
    }

    /** The most restrictive of the motive type and every specialty (p.152). */
    public getMaxSquadSize(): number {
        return Math.min(this.getMotive().maxSquadSize, ...this._specialtyRecords().map((item) => item.maxSquadSize ?? Infinity));
    }
    public getMaxPlatoonSize(): number {
        return Math.min(this.getMotive().maxPlatoonSize, ...this._specialtyRecords().map((item) => item.maxPlatoonSize ?? Infinity));
    }
    /** Squads in a platoon or sub-platoon: 5 (TM p.146), or the motive's (VTOL, SCUBA) or a specialty's if lower. */
    public getMaxSquads(): number {
        return Math.min(INFANTRY_MAX_SQUADS_PER_PLATOON, this._motive.maxSquads ?? Infinity, ...this._specialtyRecords().map((item) => item.maxSquads ?? Infinity));
    }
    /** Secondary weapon slots in a squad: 2 (TM p.151) or the motive's or a specialty's lower figure; paramedics and TAG troopers fill slots. */
    public getSecondarySlotsPerSquad(): number {
        // Dermal armor and triple-strength myomer each add one to the 2 a squad (IO:AE pp.74-75); the motive and specialties cap it.
        return Math.min(INFANTRY_MAX_SECONDARY_PER_SQUAD + this.getStrengthImplantCount(), this._motive.maxSecondary ?? Infinity, ...this._specialtyRecords().map((item) => item.maxSecondary ?? Infinity));
    }
    public getProhibitedTerrain(): string {
        const parts = [this.getMotive().prohibitedTerrain, ...this._specialtyRecords().map((item) => item.prohibitedTerrain ?? "")].filter((part) => part);
        const noWater = parts.some((part) => part.includes("Water (Any)"));
        return [...new Set(parts.map((part) => noWater && !part.includes("Water (Any)") ? part.replace(/,?\s*Water \(Depth [^)]*\)/, "").trim() : part).filter((part) => part))].join("; ");
    }

    /** Why the specialty cannot go on this platoon, or null when it can. */
    public getSpecialtyBar(tag: string): string | null {
        const specialty = findInfantrySpecialty(tag);
        if (!specialty) return `${tag} is not a specialized infantry type`;
        if (tag === "paramedics" || tag === "tag") {
            return this._maxSpecialsPerSquad(tag) > 0 || this.hasSpecialty(tag) ? null : `${specialty.name} replace secondary weapon troopers, and this platoon has no secondary weapon slot to give (TO:AUE p.153)`;
        }
        if (this.isBeastMounted()) return `${specialty.name} are not offered to beast-mounted infantry (TO:AUE p.153 lists foot, motorized, jump and mechanized platoons)`;
        if (specialty.footOnly && this._motive.tag !== "foot" && this._motive.tag !== "scuba") return `${specialty.name} use the Foot motive type, 1 Ground MP (TO:AUE p.153)`;
        return null;
    }
    /** Switches a specialty on or off. Paramedics and TAG Troops start at one a squad; false, with no change, when the platoon cannot have it. */
    public setSpecialty(tag: string, on: boolean): boolean {
        if (tag === "paramedics") return on ? this.setParamedicsPerSquad(Math.max(1, this._paramedicsPerSquad)) : (this.setParamedicsPerSquad(0), true);
        if (tag === "tag") return on ? this.setTagTroopersPerSquad(Math.max(1, this._tagPerSquad)) : (this.setTagTroopersPerSquad(0), true);
        const specialty = findInfantrySpecialty(tag);
        if (!specialty) return false;
        const kind = specialty.tag;
        if (on) {
            if (this.getSpecialtyBar(tag) !== null) return false;
            if (!this._specialties.includes(kind)) this._specialties = INFANTRY_SPECIALTIES.map((item) => item.tag).filter((item) => this._specialties.includes(item) || item === kind);
        } else {
            this._specialties = this._specialties.filter((item) => item !== kind);
        }
        this._pruneSpecialties();
        return true;
    }
    /** Drops what the platoon can no longer have after a change of motive, creature, squad size or secondary weapons. */
    private _pruneSpecialties(): void {
        this._specialties = this._specialties.filter((tag) => this.getSpecialtyBar(tag) === null);
        if (!this._specialties.includes("engineers")) this._engineerTasks = [];
        this._squadSize = Math.min(this._squadSize, this.getMaxSquadSize());
        this._clampSpecialTroopers();
        this._clampSecondaryCount();
    }

    // Paramedics and TAG troops: up to 2 a squad together, each replacing a secondary weapon trooper (p.153).

    public getParamedicsPerSquad(): number { return this._paramedicsPerSquad; }
    public getParamedicCount(): number { return this._paramedicsPerSquad * this._squads; }
    public getTagTroopersPerSquad(): number { return this._tagPerSquad; }
    public getTagTrooperCount(): number { return this._tagPerSquad * this._squads; }
    public getSpecialTroopersPerSquad(): number { return this._paramedicsPerSquad + this._tagPerSquad; }
    /** TAG troops only work with at least 2 troopers a squad assigned (p.153 note ***). */
    public isTagWorking(): boolean { return this._tagPerSquad >= 2; }
    /** Most of this kind a squad may have now: 2 together, within the slots and the squad. */
    private _maxSpecialsPerSquad(kind: "paramedics" | "tag"): number {
        const other = kind === "paramedics" ? this._tagPerSquad : this._paramedicsPerSquad;
        return Math.max(0, Math.min(INFANTRY_MAX_SPECIAL_TROOPERS_PER_SQUAD, this.isBeastMounted() ? INFANTRY_MAX_SECONDARY_PER_SQUAD : this.getSecondarySlotsPerSquad(), this._squadSize) - other);
    }
    private _clampSpecialTroopers(): void {
        this._tagPerSquad = Math.min(this._tagPerSquad, this._maxSpecialsPerSquad("tag"));
        this._paramedicsPerSquad = Math.min(this._paramedicsPerSquad, this._maxSpecialsPerSquad("paramedics"));
    }
    /** Sets paramedics a squad, held to the secondary slots left; secondary weapons give way. False when the count asked for does not fit. */
    public setParamedicsPerSquad(count: number): boolean {
        const wanted = savedNumber(count, this._paramedicsPerSquad, 0, 99);
        this._paramedicsPerSquad = Math.min(wanted, this._maxSpecialsPerSquad("paramedics"));
        this._clampSecondaryCount();
        this._clampWeapons();
        return this._paramedicsPerSquad === wanted;
    }
    public setTagTroopersPerSquad(count: number): boolean {
        const wanted = savedNumber(count, this._tagPerSquad, 0, 99);
        this._tagPerSquad = Math.min(wanted, this._maxSpecialsPerSquad("tag"));
        this._clampSecondaryCount();
        this._clampWeapons();
        return this._tagPerSquad === wanted;
    }

    // Combat Engineers: the tasks the platoon is trained for; none chosen leaves every task open, picked before the scenario (p.152).

    public getEngineerTasks(): InfantryEngineerTask[] { return [...this._engineerTasks]; }
    public getAvailableEngineerTasks(): IInfantryEngineerTask[] {
        return this.hasSpecialty("engineers") ? INFANTRY_ENGINEER_TASKS.filter((item) => this._engineerTasks.length === 0 || this._engineerTasks.includes(item.tag)) : [];
    }
    public setEngineerTasks(tags: string[]): boolean {
        if (!this.hasSpecialty("engineers") || tags.some((tag) => !findInfantryEngineerTask(tag))) return false;
        this._engineerTasks = INFANTRY_ENGINEER_TASKS.map((item) => item.tag).filter((tag) => tags.includes(tag));
        this._inPlay.engineers = undefined;
        return true;
    }

    // XCT troops: one environment, and an armor kit that suits it (p.162).

    public getXCT(): InfantryXCTEnvironment | null { return this._xct; }
    public getXCTEnvironment(): IInfantryXCTEnvironment | null { return this._xct ? findInfantryXCTEnvironment(this._xct) ?? null : null; }
    /** An empty tag removes it; false for an environment not on the list. The armor is checked in getIssues. */
    public setXCT(tag: string): boolean {
        if (!tag) { this._xct = null; return true; }
        const environment = findInfantryXCTEnvironment(tag);
        if (!environment) return false;
        this._xct = environment.tag;
        return true;
    }
    /** The armor kits that suit the environment, from what this platoon's technology base and era have. */
    public getXCTArmorOptions(tag: string | null = this._xct): IInfantryArmor[] {
        const environment = tag ? findInfantryXCTEnvironment(tag) : undefined;
        return environment ? this.getAvailableArmor().filter((armor) => environment.armor.includes(armor.tag)) : [];
    }
    /** Why the XCT choice is not legal, or null: the armor kit must be one the environment names, and no creature or VTOL platoon for vacuum or trace. */
    public getXCTProblem(): string | null {
        const environment = this.getXCTEnvironment();
        if (!environment) return null;
        if (!this._armor || !environment.armor.includes(this._armor.tag)) return `XCT troops for ${environment.name.toLowerCase()} must wear one of: ${environment.armor.map((tag) => findInfantryArmor(tag)?.name ?? tag).join(", ")} (TO:AUE p.162)`;
        if (environment.tag === "vacuum" && (this.isBeastMounted() || this._motive.vtol)) return "XCT troops may not be beast-mounted or mechanized VTOL infantry if they are to operate in vacuum or trace atmospheres (TO:AUE p.162)";
        return null;
    }
    /** The damage XCT troops take from a hazard of their environment (p.163): a hazardous liquid pool divided by 3 (rounded down, at least 1), a bad atmosphere doubled. */
    public getXCTEnvironmentDamage(damage: number): { damage: number; text: string } {
        const environment = this.getXCTEnvironment();
        const base = savedNumber(damage, 0, 0, INFANTRY_MAX_ATTACK_DAMAGE);
        if (!environment) return { damage: base, text: "Not XCT troops: the damage stands" };
        if (environment.tag === "liquid") {
            const result = base > 0 ? Math.max(1, Math.floor(base / 3)) : 0;
            return { damage: result, text: `${base} hazardous liquid damage divided by 3, rounded down, at least 1: ${result} (TO:AUE p.163)` };
        }
        if (environment.tag === "cold" || environment.tag === "hot") return { damage: base, text: "Extreme temperatures do these troops no damage of their own and do not limit their movement (TO:AUE p.163)" };
        return { damage: base * 2, text: `${base} damage doubled by suit breaches in ${environment.name.toLowerCase()}: ${base * 2} (TO:AUE p.163)` };
    }

    /** The parts of the Battle Value's unit type modifier (TO:AUE p.193): each specialty, SCUBA and XCT. */
    public getTypeModifierParts(): { name: string; value: number }[] {
        const parts = this._specialtyRecords().filter((item) => item.bvModifier > 0).map((item) => ({ name: item.name, value: item.bvModifier }));
        if (this.isScuba()) parts.push({ name: "SCUBA", value: INFANTRY_SCUBA_BV_MODIFIER });
        if (this._xct) parts.push({ name: "XCT", value: INFANTRY_XCT_BV_MODIFIER });
        return parts;
    }
    public getTypeModifier(): number { return Math.round((1 + this.getTypeModifierParts().reduce((sum, part) => sum + part.value, 0)) * 1e6) / 1e6; }

    /** Specialists must be Veteran or better (TO:AUE p.152): Gunnery 3, and Anti-'Mech 4 where there is a kit. */
    public meetsVeteranRule(): boolean {
        return this._gunnery <= INFANTRY_VETERAN_GUNNERY && (!this.hasAntiMechKit() || this._antiMech <= INFANTRY_VETERAN_ANTI_MECH);
    }

    /** Alpha Strike specials the specialties give, each by the Companion's conversion text (ASC Special Unit Abilities: MTN, PAR, TAG, TRN, MSW, FF). */
    private _specialtyAlphaStrike(log: string[]): string[] {
        const codes: string[] = [];
        const add = (code: string, why: string): void => {
            if (!codes.includes(code)) { codes.push(code); log.push(`${code}: ${why}`); }
        };
        if (this.hasSpecialty("mountain")) add("MTN", "mountain climbing gear and Thin Atmosphere immunity (Alpha Strike Companion, Mountain Troops)");
        if (this.hasSpecialty("paratroops")) add("PAR", "paratroop equipment (Alpha Strike Companion, Paratroopers)");
        if (this.isTagWorking()) add("TAG", "TAG troops carry TAG (Alpha Strike Companion, Target Acquisition Gear)");
        for (const task of this.getAvailableEngineerTasks()) {
            // Left open (no task chosen), the engineers have no task to convert.
            if (this._engineerTasks.length > 0 && task.alphaStrike) add(task.alphaStrike, `${task.name} engineers (Alpha Strike Companion, ${task.alphaStrike === "TRN" ? "Trenchworks/Fieldworks Engineers" : task.alphaStrike === "MSW" ? "Minesweeper" : "Firefighter"})`);
        }
        return codes;
    }

    public getGunnery(): number { return this._gunnery; }
    public setGunnery(skill: number): void { this._gunnery = savedNumber(skill, this._gunnery, 0, 8); }
    /** 8, fixed, without Anti-'Mech kits or on a mechanized platoon. */
    public getAntiMechSkill(): number { return this.hasAntiMechKit() ? this._antiMech : INFANTRY_FIXED_ANTI_MECH_SKILL; }
    public setAntiMechSkill(skill: number): void { this._antiMech = savedNumber(skill, this._antiMech, 0, 8); }

    /**
     * Tons per trooper: the motive's, the Anti-'Mech kit's and each specialty's added tons (TO:AUE p.153; its example, a motorized
     * marine combat engineer, is 0.21 + 0 + 0.1 = 0.31 with the kit). Paramedics add theirs to the medics only (see getParamedicTons).
     */
    public getWeightPerTrooper(): number {
        const added = this._specialties.reduce((sum, tag) => sum + (findInfantrySpecialty(tag)?.addedTons ?? 0), 0);
        return Math.round((this.getMotive().weightPerTrooper + (this.hasAntiMechKit() ? INFANTRY_ANTI_MECH_KIT_TONS : 0) + added) * 1e6) / 1e6;
    }
    /** The 0.05 ton each paramedic adds (p.153), for `troopers` of the platoon's troopers (the medics are spread evenly). */
    public getParamedicTons(troopers: number = this.getTroopers()): number {
        const total = this.getTroopers();
        return total > 0 ? this.getParamedicCount() * (findInfantrySpecialty("paramedics")?.addedTons ?? 0) * Math.min(1, troopers / total) : 0;
    }
    /**
     * Transport weight, rounded up to the half ton. The field guns and their ammunition ride with the whole platoon (TO:AUE
     * p.122); a platoon is not broken down below one gun and its ammunition. Beast-mounted: every creature plus 0.2 t for
     * each trooper, rider and gear (p.107).
     */
    public getWeight(troopers: number = this.getTroopers()): number {
        const mount = this.getMount();
        if (mount) return roundUpHalf(this.getCreatures(troopers) * mount.weight + troopers * this.getMotive().weightPerTrooper);
        return roundUpHalf(troopers * this.getWeightPerTrooper() + this.getParamedicTons(troopers) + (troopers >= this.getTroopers() ? this.getFieldGunWeight() : 0));
    }
    /**
     * The least the platoon may be broken down to for transport: one creature and its riders (TO:AUE p.107), or no less
     * than one field gun and its ammunition (p.122).
     */
    public getMinimumBreakdownWeight(): number {
        const mount = this.getMount();
        if (mount) return roundUpHalf(mount.weight + Math.min(this._squadSize, INFANTRY_BEAST_SIZES[mount.size].troopsPerCreature) * this.getMotive().weightPerTrooper);
        const guns = this.getFieldGunCount();
        const oneGun = guns > 0 ? this.getFieldGunWeight() / guns : 0;
        return roundUpHalf(Math.max(this.getMotive().minimumBreakdown * this.getWeightPerTrooper(), oneGun));
    }

    // Cybernetic and prosthetic augmentation (Interstellar Operations: Alternate Eras pp.70-79; cost p.179, Battle Value pp.184-186,
    // Alpha Strike pp.194-195). Every trooper carries the same implants, except where the book says a fourth of them or the
    // commander alone do (the communications implants and the triple-core processor).

    private _has(tag: string): boolean { return this._augmentations.includes(tag); }
    public hasAugmentation(tag: string): boolean { return this._has(tag); }
    /** The augmentation the platoon has, in the catalog's order. */
    public getAugmentations(): IInfantryAugmentation[] { return infantryAugmentations.filter((item) => this._augmentations.includes(item.tag)); }
    /** Every implant and prosthetic conventional infantry has rules for. */
    public getAugmentationOptions(): IInfantryAugmentation[] { return [...infantryAugmentations]; }
    /** Replaces the augmentation; false (and no change) when a tag is not one. Whether the combination is legal is reported by getIssues. */
    public setAugmentations(tags: string[]): boolean {
        if (tags.some((tag) => !findInfantryAugmentation(tag))) return false;
        this._augmentations = infantryAugmentations.map((item) => item.tag).filter((tag) => tags.includes(tag));
        this._clampSecondaryCount();
        return true;
    }

    /** What the enhanced or improved prosthetic limbs carry: an item and how many of it each trooper has (1 or 2), two kinds at most. */
    public getLimbs(): { item: string; count: number }[] { return this._limbs.map((limb) => ({ ...limb })); }
    public setLimbs(items: { item: string; count: number }[]): boolean {
        const limbs: { item: string; count: number }[] = [];
        for (const entry of items) {
            const item = findInfantryProstheticItem(entry.item);
            if (!item) return false;
            limbs.push({ item: item.tag, count: savedNumber(entry.count, 1, 1, 2) });
        }
        this._limbs = limbs.slice(0, 2);
        return true;
    }
    /** The item of each pair of extraneous limbs (one item a limb, so two of each); at most two pairs. */
    public getExtraneousPairs(): string[] { return [...this._extraneous]; }
    public setExtraneousPairs(items: string[]): boolean {
        const pairs: string[] = [];
        for (const entry of items) {
            const item = findInfantryProstheticItem(entry);
            if (!item) return false;
            pairs.push(item.tag);
        }
        this._extraneous = pairs.slice(0, 2);
        return true;
    }
    /** Two pairs of extraneous limbs, or one with glider or flight wings (IO:AE p.78). */
    public getMaxExtraneousPairs(): number { return this._has("aug-glider") || this._has("aug-flight") ? 1 : 2; }

    /** The items the troopers carry that count: the limbs of the enhanced or improved augmentation, and two of each extraneous pair's item. */
    private _prostheticItems(): { item: IInfantryProstheticItem; count: number }[] {
        const entries: { item: IInfantryProstheticItem; count: number }[] = [];
        const limbs = this._has("aug-limb-improved") ? this._limbs : this._has("aug-limb-enhanced") ? this._limbs.slice(0, 1) : [];
        for (const limb of limbs) {
            const item = findInfantryProstheticItem(limb.item);
            if (item) entries.push({ item, count: limb.count });
        }
        if (this._has("aug-limb-extraneous")) {
            for (const tag of this._extraneous.slice(0, this.getMaxExtraneousPairs())) {
                const item = findInfantryProstheticItem(tag);
                if (item) entries.push({ item, count: 2 });
            }
        }
        return entries;
    }

    /** How many of dermal armor and triple-strength myomer the troopers have: each cuts every weapon crew by 1 and lifts the secondary limit by 1 (IO:AE pp.74-75). */
    public getStrengthImplantCount(): number { return (this._has("aug-dermal-armor") ? 1 : 0) + (this._has("aug-tsm") ? 1 : 0); }
    /** The weapon's crew with those implants' reduction, never below 1. */
    public getEffectiveCrew(weapon: IInfantryWeapon): number { return Math.max(1, weapon.crew - this.getStrengthImplantCount()); }

    /**
     * The divisor with the implants: triple-strength myomer alone gives 0.5 (no other armor), dermal camouflage keeps it from falling
     * to 0.5, dermal armor adds 1 to whatever the armor and the other implants make (IO:AE pp.74-75); combined with dermal armor
     * and no armor, triple-strength gives 1.5.
     */
    public getImplantDamageDivisor(): number {
        let divisor = this.getArmorDamageDivisor();
        if (!this._armor && this._has("aug-tsm")) divisor = 0.5;
        if (divisor === 0.5 && this._has("aug-dermal-camo")) divisor = 1;
        if (this._has("aug-dermal-armor")) divisor += 1;
        return divisor;
    }
    /** The implants that change the divisor, for the log lines. */
    public getDivisorImplants(): IInfantryAugmentation[] {
        const tags = [this._has("aug-dermal-armor") ? "aug-dermal-armor" : "", !this._armor && this._has("aug-tsm") ? "aug-tsm" : "", this._has("aug-dermal-camo") && this.getArmorDamageDivisor() === 0.5 ? "aug-dermal-camo" : ""];
        return this.getAugmentations().filter((item) => tags.includes(item.tag));
    }

    /** Dermal camouflage: foot or jump infantry in no other armor. The to-hit modifier against it by hexes moved, 0, 1, 2 and 3 or more (IO:AE p.74); null when it does not work. */
    public getCamoModifiers(): number[] | null {
        if (!this._has("aug-dermal-camo") || this._armor) return null;
        return this._motive.tag === "foot" || this._motive.tag === "jump" ? [3, 2, 1, 0] : null;
    }
    /** Range of the Inner Sphere active probe the sensory implants give: 3 hexes for enhanced multi-modal ones, 2 for IR/EM, audio and multi-modal, else 0 (IO:AE pp.72-73). */
    public getProbeRange(): number {
        if (this._has("aug-enh-mm")) return 3;
        return this._has("aug-mm") || this._has("aug-sensory-visual") || this._has("aug-sensory-audio") ? 2 : 0;
    }
    /** -1 to hit for all weapon attacks from laser-sight, telescopic and multi-modal implants, which do not stack (IO:AE pp.72-73). */
    public getImplantToHitModifier(): number {
        return this._has("aug-sensory-laser") || this._has("aug-sensory-tele") || this._has("aug-mm") || this._has("aug-enh-mm") ? -1 : 0;
    }
    /** 2 MP of VTOL movement from powered flight wings (IO:AE p.79). */
    public getFlightMP(): number { return this._has("aug-flight") && !this.isBeastMounted() ? 2 : 0; }
    /** The best target-number modifier to the platoon's Anti-'Mech attacks the prosthetics give: -2 for a grappler line, -1 for climbing claws (IO:AE p.78). */
    public getAntiMechToHitModifier(): number {
        return this._prostheticItems().reduce((best, entry) => Math.min(best, entry.item.antiMech), 0);
    }
    /** 1.2 on the Anti-'Mech Battle Rating for grappler lines and climbing claws (IO:AE p.191). */
    public getAntiMechBattleRatingMultiplier(): { multiplier: number; name: string } {
        const tool = this._prostheticItems().find((entry) => entry.item.antiMech !== 0);
        return tool ? { multiplier: 1.2, name: tool.item.name } : { multiplier: 1, name: "" };
    }

    /**
     * The extra damage the platoon does to a target in its own hex: triple-strength myomer's 0.14 a trooper, the tail's 0.21 and the
     * prosthetic items' damage, which is against other conventional infantry only for the items the table marks (IO:AE pp.75, 78-79).
     */
    public getSameHexBonusDamage(infantryTargets: boolean = false, troopers: number = this.getTroopers()): number {
        let perTrooper = (this._has("aug-tsm") ? 0.14 : 0) + (this._has("aug-tail") ? 0.21 : 0);
        for (const { item, count } of this._prostheticItems()) if (infantryTargets || !item.infantryOnly) perTrooper += item.damage * count;
        return perTrooper * Math.max(0, troopers);
    }
    /** The platoon's damage in its own hex with that many troopers: the usual damage and the bonus, rounded normally. */
    public getOwnHexDamage(troopers: number = this.getTroopers(), infantryTargets: boolean = false): number {
        return roundNormally(this.getDamageForTroopers(troopers) + this.getSameHexBonusDamage(infantryTargets, troopers));
    }

    /**
     * The skills the Battle Value multiplier is found from change as the Battle Value table says (IO:AE pp.184, 191): the pain shunt,
     * a communications implant and the triple-core processor each take 1 off the Anti-'Mech skill (the infantry's Piloting), and
     * sensory implants of any kind take 1 off Gunnery, once. A skill never falls below 0. The boosted communications implant counts as a C3 slave instead.
     */
    public getAugmentationSkillModifiers(): { gunnery: number; piloting: number; log: string[]; detail: string } {
        let gunnery = 0;
        let piloting = 0;
        const gunnerySources: string[] = [];
        const pilotingSources: string[] = [];
        const add = (tag: string, kind: "gunnery" | "piloting"): void => {
            const record = findInfantryAugmentation(tag);
            if (!this._has(tag) || !record) return;
            if (kind === "gunnery") { gunnery -= 1; gunnerySources.push(record.name); } else { piloting -= 1; pilotingSources.push(record.name); }
        };
        add("aug-pain-shunt", "piloting");
        add("aug-comm", "piloting");
        add("aug-tcp", "piloting");
        const sensory = ["aug-sensory-audio", "aug-sensory-visual", "aug-sensory-laser", "aug-sensory-tele", "aug-mm", "aug-enh-mm"].find((tag) => this._has(tag));
        if (sensory) add(sensory, "gunnery");
        const log: string[] = [];
        let detail = "";
        if (gunnery !== 0 || piloting !== 0) {
            const parts: string[] = [];
            if (gunnery !== 0) parts.push(`Gunnery ${this._gunnery} to ${Math.max(0, this._gunnery + gunnery)} (${gunnerySources.join(", ")})`);
            if (piloting !== 0) parts.push(`Anti-'Mech ${this.getAntiMechSkill()} to ${Math.max(0, this.getAntiMechSkill() + piloting)} (${pilotingSources.join(", ")})`);
            detail = parts.join("; ");
            log.push(`Skill modifiers of the implants (IO:AE p.184), used for the multiplier: ${detail}`);
        }
        return { gunnery, piloting, log, detail };
    }

    /** Is the faction of the platoon's formation one that fields this implant? A generic or mercenary formation counts as one that can buy it (IO:AE p.71). */
    private _augmentationFactionOk(item: IInfantryAugmentation): boolean {
        return item.factions.length === 0 || this._formation.tag === "is-generic" || item.factions.includes(this._formation.tag);
    }
    /** Is the implant in existence by the end of the platoon's era (the Prototype column of IO:AE p.52)? */
    public isAugmentationInEra(item: IInfantryAugmentation): boolean {
        return typeof item.introduced !== "number" || item.introduced <= (this._era.yearEnd ?? Number.POSITIVE_INFINITY);
    }
    /** Has the implant gone extinct before the platoon's era (the Notes column of IO:AE p.52)? */
    private _augmentationExtinct(item: IInfantryAugmentation): boolean { return item.extinct !== undefined && this._era.yearStart > item.extinct; }

    /**
     * What the augmentation adds to the platoon's final cost (IO:AE pp.71, 179, 217): each implant's price for each trooper that carries it,
     * doubled where the faction does not field it and doubled again where it is extinct in the era; an enhanced limb is priced for each limb,
     * an improved one for each set of two items, an extraneous one for each pair.
     */
    public getAugmentationCost(): { value: number; log: string[]; items: { label: string; detail: string; value: number }[] } {
        const troopers = this.getTroopers();
        const log: string[] = [];
        const items: { label: string; detail: string; value: number }[] = [];
        let total = 0;
        let perTrooper = 0;
        let everyTrooper = true;
        for (const item of this.getAugmentations()) {
            const carriers = item.scope === "all" ? troopers : item.scope === "quarter" ? Math.ceil(troopers / 4) : 1;
            let units = 1;
            let detail = "";
            if (item.tag === "aug-limb-enhanced") {
                units = Math.max(1, this._limbs[0]?.count ?? 1);
                detail = ` (${units} limb${units === 1 ? "" : "s"})`;
            } else if (item.tag === "aug-limb-improved") {
                units = Math.max(1, Math.ceil(this._limbs.reduce((sum, limb) => sum + limb.count, 0) / 2));
                detail = ` (${units} set${units === 1 ? "" : "s"} of two items)`;
            } else if (item.tag === "aug-limb-extraneous") {
                units = Math.max(1, Math.min(this._extraneous.length, this.getMaxExtraneousPairs()));
                detail = ` (${units} pair${units === 1 ? "" : "s"})`;
            }
            const notes: string[] = [];
            let multiplier = 1;
            if (!this._augmentationFactionOk(item)) { multiplier *= 2; notes.push(`x2: ${this._formation.name} does not field it`); }
            if (this._augmentationExtinct(item)) { multiplier *= 2; notes.push(`x2: extinct since ${item.extinct}`); }
            const each = item.cost * units * multiplier;
            total += carriers * each;
            if (item.scope === "all") perTrooper += each; else everyTrooper = false;
            const who = item.scope === "all" ? `${carriers}` : item.scope === "quarter" ? `${carriers} (a fourth of the troopers)` : "1 (the commander)";
            log.push(`Augmentation, ${item.name}${detail}: ${who} x ${format(each, 0)} = ${format(carriers * each, 0)}${notes.length > 0 ? ` (${notes.join("; ")})` : ""} (IO:AE p.217)`);
            items.push({ label: `Augmentation, ${item.name}${detail}`, detail: `${who} x ${format(each, 0)}${notes.length > 0 ? ` (${notes.join("; ")})` : ""}`, value: carriers * each });
        }
        if (total > 0) log.push(everyTrooper ? `Augmentation, every trooper: ${troopers} x ${format(perTrooper, 0)} = ${format(total, 0)}, added to the platoon's final cost (IO:AE p.179)` : `Augmentation total: ${format(total, 0)}, added to the platoon's final cost (IO:AE p.179)`);
        return { value: total, log, items };
    }

    /**
     * The augmentation's steps in the Battle Value (IO:AE pp.184-186, 191): the pheromone effuser's 0.05 a trooper goes to the defensive rating,
     * and the toxin effuser's 0.23, triple-strength myomer's 0.1, the suicide implants' 0.12, the tail's 0.2 and the prosthetic items' own
     * values (for each trooper, for each item) go to the weapons. Dermal armor and the other divisors work through the damage divisor.
     */
    private _augmentationBattleValue(): { defensive: number; offensive: number; defensiveItems: IInfantryBvItem[]; offensiveItems: IInfantryBvItem[] } {
        const troopers = this.getTroopers();
        const defensiveItems: IInfantryBvItem[] = [];
        const offensiveItems: IInfantryBvItem[] = [];
        let defensive = 0;
        let offensive = 0;
        const perTrooper = (tag: string, label: string, value: number): void => {
            if (!this._has(tag)) return;
            const amount = troopers * value;
            offensive += amount;
            offensiveItems.push({ label, detail: `${troopers} x ${formatCalcNumber(value)}`, value: amount });
        };
        if (this._has("aug-pheromone")) {
            defensive += troopers * 0.05;
            defensiveItems.push({ label: "Pheromone gas effuser, added before the Defensive Factor", detail: `${troopers} x 0.05`, value: troopers * 0.05 });
        }
        perTrooper("aug-toxin", "Toxin gas effuser", 0.23);
        perTrooper("aug-tsm", "Triple-strength myomer implants", 0.1);
        perTrooper("aug-suicide", "Explosive suicide implants", 0.12);
        perTrooper("aug-tail", "Prosthetic tail", 0.2);
        for (const { item, count } of this._prostheticItems()) {
            if (item.battleValue <= 0) continue;
            const amount = troopers * item.battleValue * count;
            offensive += amount;
            offensiveItems.push({ label: `${count} x ${item.name}`, detail: `${troopers} x ${formatCalcNumber(item.battleValue * count)}`, value: amount });
        }
        return { defensive, offensive, defensiveItems, offensiveItems };
    }

    /** Extra damage and the multi-modal multiplier in the Alpha Strike attack values (IO:AE pp.194-195). */
    private _alphaStrikeAugmentationDamage(troopFactor: number): { extra: number; multiplier: number; log: string[] } {
        const log: string[] = [];
        let extra = 0;
        if (this._has("aug-tsm")) {
            extra += 0.14 * troopFactor;
            log.push(`Extra damage from triple-strength myomer implants: 0.14 x ${troopFactor} troopers = ${format(0.14 * troopFactor)}`);
        }
        const prosthetic = this._prostheticItems().reduce((sum, entry) => sum + entry.item.damage * entry.count, 0);
        if (prosthetic > 0) {
            extra += prosthetic * troopFactor;
            log.push(`Extra damage from prosthetic limbs: ${format(prosthetic)} x ${troopFactor} troopers = ${format(prosthetic * troopFactor)}`);
        }
        const multiplier = this._has("aug-mm") || this._has("aug-enh-mm") ? 1.05 : 1;
        if (multiplier !== 1) log.push("Multi-modal sensory implants: attack values x 1.05 before rounding");
        return { extra, multiplier, log };
    }

    /** The special abilities the implants give a conventional infantry element (IO:AE pp.194-195). */
    private _alphaStrikeAugmentationSpecials(): { specials: string[]; log: string[] } {
        const specials: string[] = [];
        const log: string[] = [];
        const give = (codes: string[], because: string): void => {
            specials.push(...codes.filter((code) => !specials.includes(code)));
            log.push(`${because}: ${codes.join(", ")}`);
        };
        if (this._has("aug-comm") || this._has("aug-boosted-comm")) give(["CI"], "Communications implants");
        if (this._has("aug-boosted-comm")) give(["C3I"], "Boosted communications implants");
        if (this._has("aug-enh-mm")) give(["PRB", "RCN"], "Enhanced multi-modal sensory implants");
        else if (["aug-sensory-audio", "aug-sensory-visual", "aug-sensory-laser", "aug-sensory-tele", "aug-mm"].some((tag) => this._has(tag))) give(["LPRB", "RCN"], "Sensory implants");
        if (this._has("aug-filtration")) give(["FI"], "Filtration implants");
        if (this._has("aug-tsm")) give(["TSI"], "Triple-strength myomer implants");
        if (this._has("aug-tcp")) give(["TCP", "MHQ1"], "Triple-core processor implant");
        if (this._has("aug-pl-masc") && this._motive.tag === "foot") give(["PL"], "Prosthetic leg MASC");
        if (this._has("aug-glider") || this._has("aug-flight")) give(["PAR"], "Prosthetic wings");
        return { specials, log };
    }

    /** What stops the augmentation being legal (IO:AE pp.70-79); nothing is removed, the platoon shows the issue. */
    private _augmentationIssues(): string[] {
        const issues: string[] = [];
        const chosen = this.getAugmentations();
        if (chosen.length === 0) return issues;
        const together = (first: string, second: string, why: string): void => {
            const a = findInfantryAugmentation(first);
            const b = findInfantryAugmentation(second);
            if (a && b && this._has(first) && this._has(second)) issues.push(`${a.name} and ${b.name} cannot be combined${why ? `: ${why}` : ""} (IO:AE p.${Math.max(a.page, b.page)})`);
        };
        for (const item of chosen) {
            if (!this.isAugmentationInEra(item)) issues.push(`${item.name} is not available in the ${this._era.name} era (IO:AE p.52)`);
        }
        together("aug-dermal-armor", "aug-dermal-camo", "");
        together("aug-tsm", "aug-pl-masc", "");
        together("aug-glider", "aug-flight", "a trooper has one set of wings");
        together("aug-limb-enhanced", "aug-limb-improved", "improved limbs take the place of enhanced ones");
        if (this._has("aug-pl-masc") && this._motive.tag !== "foot") issues.push("Prosthetic Leg MASC is for foot infantry only (IO:AE p.77)");
        if (this._has("aug-dermal-camo") && this._motive.tag !== "foot" && this._motive.tag !== "jump") issues.push("Dermal camouflage is for foot or jump infantry only (IO:AE p.74)");
        const senses = ["aug-sensory-audio", "aug-sensory-visual", "aug-sensory-laser", "aug-sensory-tele"].filter((tag) => this._has(tag));
        if (senses.length > 2) issues.push("A trooper can carry at most two sensory implants, one optical and one audio, or two optical (IO:AE p.72)");
        if (this._has("aug-limb-enhanced")) {
            if (this._limbs.length === 0) issues.push("Choose what the enhanced prosthetic limbs carry (IO:AE p.78)");
            else if (this._limbs.length > 1) issues.push("Enhanced prosthetic limbs carry one kind of item, up to two of it for each trooper (IO:AE p.78)");
        }
        if (this._has("aug-limb-improved")) {
            const items = this._limbs.reduce((sum, limb) => sum + limb.count, 0);
            if (items < 2) issues.push("Improved prosthetic limbs need at least two items (IO:AE p.78)");
            if (items > 4) issues.push("Improved prosthetic limbs carry four items at most (IO:AE p.78)");
        }
        if (this._has("aug-limb-extraneous")) {
            if (this._extraneous.length === 0) issues.push("Choose what each pair of extraneous limbs carries (IO:AE p.78)");
            if (this._extraneous.length > this.getMaxExtraneousPairs()) issues.push(this.getMaxExtraneousPairs() === 1 ? "Extraneous limbs are held to one pair with glider or powered flight wings (IO:AE p.78)" : "A trooper may have two pairs of extraneous limbs at most (IO:AE p.78)");
        }
        return issues;
    }

    /** The limits of the Cybernetic/Prosthetic Augmentation Limits Table for a platoon of infantry (IO:AE p.71): 1 to 4, +1/+2 for the Word of Blake, -1/-2 for the Clans (never below 1). */
    public getAugmentationLimits(): { min: number; max: number } {
        let min = 1;
        let max = 4;
        if (this._formation.tag === "comstar-word-of-blake") { min += 1; max += 2; }
        if (this.isClan()) { min = Math.max(1, min - 1); max = Math.max(1, max - 2); }
        return { min, max };
    }

    /** What an augmentation line reads in the notes, the record sheet and the TRO. */
    private _augmentationLabel(item: IInfantryAugmentation): string {
        const limbs = this._limbs.map((limb) => `${limb.count} x ${findInfantryProstheticItem(limb.item)?.name ?? limb.item}`).join(", ");
        const pairs = this._extraneous.map((tag) => `2 x ${findInfantryProstheticItem(tag)?.name ?? tag}`).join(", ");
        if (item.tag === "aug-limb-enhanced" || item.tag === "aug-limb-improved") return limbs ? `${item.name} (${limbs})` : item.name;
        if (item.tag === "aug-limb-extraneous") return pairs ? `${item.name} (${pairs})` : item.name;
        return item.name;
    }

    /** The augmentation, each with what its limbs carry, one entry each. */
    public getAugmentationLabels(): string[] { return this.getAugmentations().map((item) => this._augmentationLabel(item)); }
    /** The augmentation as a record sheet line; empty for a platoon without any. */
    public getAugmentationSheetText(): string {
        const labels = this.getAugmentationLabels();
        return labels.length > 0 ? `Augmentation: ${labels.join("; ")}` : "";
    }

    /** The rules the augmentation puts into play, one line each, for the play panel and the notes (IO:AE pp.70-79). */
    public getAugmentationPlayNotes(): string[] {
        const items = this.getAugmentations();
        if (items.length === 0) return [];
        const notes: string[] = items.map((item) => `${this._augmentationLabel(item)}: ${item.rules}`);
        const camo = this.getCamoModifiers();
        if (camo) notes.push(`Attacks against the platoon take +${camo[0]} if it stayed put, +${camo[1]} if it moved 1 hex, +${camo[2]} if it moved 2 hexes, none past that (dermal camouflage, p.74).`);
        if (this._has("aug-pl-masc")) notes.push("Attacks against the platoon take +1 to-hit (prosthetic leg MASC, p.77).");
        if (this.getProbeRange() > 0) notes.push(`${this.getProbeRange()}-hex active probe, Inner Sphere quality; hostile ECM disrupts it (pp.72-73).`);
        if (this.getImplantToHitModifier() !== 0) notes.push(`${this.getImplantToHitModifier()} to-hit for all the platoon's weapon attacks (already in the range table).`);
        if (this._has("aug-pain-shunt")) notes.push("Flame-based damage to the platoon is halved (applied when a heat-effect attack is resolved); the platoon's Morale Checks take -4 and it ignores Forced Withdrawal (p.72).");
        const same = this.getSameHexBonusDamage();
        const infantry = this.getSameHexBonusDamage(true);
        if (same > 0 || infantry > 0) notes.push(`In its own hex the platoon does +${format(same)} damage with all troopers${infantry > same ? ` (+${format(infantry)} against other conventional infantry)` : ""}; with ${this.getAttackTroopers()} active, ${this.getOwnHexDamage(this.getAttackTroopers())} damage${infantry > same ? `, ${this.getOwnHexDamage(this.getAttackTroopers(), true)} against other conventional infantry` : ""} (pp.75, 78-79).`);
        const melee = this._prostheticItems().some((entry) => entry.item.melee) || this._has("aug-tail");
        if (melee) notes.push("Melee prosthetics and the tail attack at +2 to hit, the most any of them add, and reach only the platoon's own hex (pp.78-79).");
        if (this.getAntiMechToHitModifier() !== 0) notes.push(`${this.getAntiMechToHitModifier()} to the target number of its Anti-'Mech attacks (p.78).`);
        if (this.getFlightMP() > 0) notes.push("2 MP of VTOL movement, except in vacuum; may drop from VTOLs and hovering DropShips as jump infantry (p.79).");
        return notes;
    }

    /** What the rules say about augmentation as a whole, for the notes (IO:AE pp.70-71). */
    private _augmentationNotes(): string[] {
        const items = this.getAugmentations();
        if (items.length === 0) return [];
        const notes: string[] = [];
        const limits = this.getAugmentationLimits();
        const count = items.length;
        notes.push(`Augmentation: ${count} augmentation${count === 1 ? "" : "s"} for each trooper; the Augmentation Limits Table suggests ${limits.min} to ${limits.max} for ${this.isClan() ? "Clan " : this._formation.tag === "comstar-word-of-blake" ? "Word of Blake Manei Domini " : ""}infantry${count < limits.min || count > limits.max ? ", so this is outside the guide" : ""} (IO:AE p.71). Only elite troops of fanatic loyalty are qualified, and the Clans almost never field more than a Star of them (p.70). Experimental rules.`);
        for (const item of items) {
            const extra: string[] = [];
            if (!this._augmentationFactionOk(item)) extra.push(`${this._formation.name} does not field it (${item.factionNames}): double cost`);
            if (this._augmentationExtinct(item)) extra.push(`extinct since ${item.extinct}: double cost`);
            notes.push(`${this._augmentationLabel(item)} (IO:AE p.${item.page}; ${item.cost.toLocaleString("en-US")} C-bills${item.costUnit ? ` ${item.costUnit}` : item.scope === "all" ? " a trooper" : item.scope === "quarter" ? " for a fourth of the troopers" : " for the commander"}): ${item.rules}${extra.length > 0 ? ` ${extra.join("; ")}.` : ""}`);
        }
        notes.push("Every trooper must carry the same implants for the rules to apply, except the communications implants (a fourth of the troopers, rounded up) and the triple-core processor (the commander). Attacks by an augmented platoon on conventional infantry add +2 to the Morale Check target number; fatigue sets in 3 turns later; maintenance and healing times triple, with +4 to the rolls; an EMP, TSEMP or nuclear hit may shut the implants down for the scenario (2D6, 6 or less) (IO:AE p.70).");
        if (this._has("aug-tcp")) notes.push("The triple-core processor's +2 Initiative needs a VDNI link, which conventional infantry cannot make (IO:AE p.75); in Alpha Strike the TCP special applies (p.195).");
        if (this._has("aug-dermal-camo")) notes.push("Dermal camouflage cannot be used well while the troopers carry bulky items (p.74).");
        return notes;
    }

    /** Reads the saved augmentation; what is not an implant conventional infantry has, or not a prosthetic item, is reported and left off. */
    private _importAugmentation(saved: unknown): void {
        this._augmentations = [];
        this._limbs = [];
        this._extraneous = [];
        if (!isPlainObject(saved)) return;
        const wanted = Array.isArray(saved.implants) ? saved.implants : [];
        const tags: string[] = [];
        for (const entry of wanted) {
            if (typeof entry === "string" && findInfantryAugmentation(entry)) tags.push(entry);
            else this._importIssues.push(`Augmentation '${String(entry).slice(0, 60)}' is not one conventional infantry has: removed`);
        }
        this._augmentations = infantryAugmentations.map((item) => item.tag).filter((tag) => tags.includes(tag));
        if (Array.isArray(saved.limbs)) {
            for (const limb of saved.limbs) {
                const item = isPlainObject(limb) ? findInfantryProstheticItem(savedString(limb.item)) : null;
                if (item && isPlainObject(limb)) this._limbs.push({ item: item.tag, count: savedNumber(limb.count, 1, 1, 2) });
                else this._importIssues.push(`Prosthetic item '${isPlainObject(limb) ? savedString(limb.item).slice(0, 60) : "?"}' is not on the Enhanced Prosthetic Equipment Table: left off`);
            }
            this._limbs = this._limbs.slice(0, 2);
        }
        if (Array.isArray(saved.extraneous)) {
            for (const entry of saved.extraneous) {
                const item = typeof entry === "string" ? findInfantryProstheticItem(entry) : null;
                if (item) this._extraneous.push(item.tag);
                else this._importIssues.push(`Extraneous limb item '${String(entry).slice(0, 60)}' is not on the Enhanced Prosthetic Equipment Table: left off`);
            }
            this._extraneous = this._extraneous.slice(0, 2);
        }
    }

    // Battle Value (TM p.309)

    /**
     * Target movement modifier at the platoon's MP, with +1 for a jumping or airborne unit: Total Warfare's "Jumped/Airborne
     * (non-aerospace units)" row (TW p.117). A mechanized VTOL platoon and a platoon on a flying creature (the branth) move
     * as VTOLs (TO:AUE pp.108, 135), so they take it; the Defensive Factor counts "any VTOL movement modifier" (TM p.315).
     */
    public getTargetMovementModifier(): number {
        const mp = this.getMP();
        return InfantryPlatoon._tmmForMP(mp) + ((this._motive.tag === "jump" || this.fliesAsVtol()) && mp > 0 ? 1 : 0);
    }

    /** Moves as a VTOL: a mechanized VTOL platoon, or one riding a VTOL creature (TO:AUE p.108). */
    public fliesAsVtol(): boolean { return !!this._motive.vtol || this.getMount()?.moveType === "VTOL"; }

    private static _tmmForMP(mp: number): number {
        if (mp >= 25) return 6;
        if (mp >= 18) return 5;
        if (mp >= 10) return 4;
        if (mp >= 7) return 3;
        if (mp >= 5) return 2;
        if (mp >= 3) return 1;
        return 0;
    }

    /**
     * The modifier the Defensive Factor uses: the ground modifier, or a higher one the augmentation gives: dermal camouflage's
     * +3 for standing still, when that is the highest (IO:AE p.184), and powered flight wings' VTOL movement, a 2 MP modifier
     * with +1 for the VTOL (IO:AE p.185; counted like jump movement).
     */
    private _bvTargetMovement(): { value: number; note: string } {
        const ground = this.getTargetMovementModifier();
        const camo = this.getCamoModifiers() ? 3 : 0;
        const flight = this.getFlightMP() > 0 ? InfantryPlatoon._tmmForMP(this.getFlightMP()) + 1 : 0;
        if (camo > ground && camo >= flight) return { value: camo, note: "dermal camouflage +3 when stationary (IO:AE p.184)" };
        if (flight > ground) return { value: flight, note: `powered flight wings, ${this.getFlightMP()} MP of VTOL movement (IO:AE p.185)` };
        return { value: ground, note: "" };
    }

    /**
     * The MP the Speed Factor reads. A move-or-fire foot platoon (TM p.151) is the Generic Conventional Infantry Units
     * table's 0 Ground MP unit, which "can either move or make a weapon attack in a turn" (TW p.213): 0, as the MUL and
     * MegaMek rate it. Its record sheet and Alpha Strike card keep the 1 MP (the MUL prints 2"f).
     */
    public getBattleValueMP(): number {
        return this.isMoveOrFire() ? 0 : this.getMP();
    }

    /** Speed Factor for the platoon's fastest movement mode, to two decimal places (TM p.316). */
    public static speedFactor(mp: number): number {
        return Math.round(Math.pow(1 + (mp - 5) / 10, 1.2) * 100) / 100;
    }

    /**
     * Battle Value 2 as cited steps (TM p.309, worked platoon p.310; TO:AUE pp.191, 193; IO:AE pp.184-186, 191): each step is recorded with its
     * page (INFANTRY_BV2_STEPS), and the log is those steps as text.
     */
    private _calcBattleValue(): IInfantryBvResult {
        const trace = new CalcTrace(INFANTRY_BV2_STEPS);
        const fmt = formatCalcNumber;
        const troopers = this.getTroopers();
        const mount = this.getMount();
        const augmentation = this._augmentationBattleValue();

        // Step 1: Defensive Battle Rating. Troopers x 1.5 x the sum of the damage divisors (TO:AUE p.191): the armor kit's with the
        // implants', and a mount's beside the rider's, where an unarmored rider counts its clothing's 1 (p.129).
        const base = troopers * 1.5;
        trace.add("ci.bv2.def.troopers", { label: "Troopers", detail: `${troopers} troopers x 1.5`, value: base });
        let rating = base;
        if (this._armor && !mount) {
            rating = base * this.getArmorDamageDivisor();
            trace.add("ci.bv2.def.divisor", { label: `Armor kit ${this._armor.name}`, detail: `${fmt(base)} x damage divisor ${fmt(this.getArmorDamageDivisor())}`, value: rating });
        }
        const implants = this.getDivisorImplants();
        if (implants.length > 0 && !mount) {
            rating = base * this.getImplantDamageDivisor();
            trace.add("ci.bv2.def.divisor.implant", { label: implants.map((item) => item.name).join(", "), detail: `${fmt(base)} x damage divisor ${fmt(this.getImplantDamageDivisor())}`, value: rating });
        }
        if (mount) {
            const rider = this.getImplantDamageDivisor();
            rating = base * (rider + this.getMountDamageDivisor());
            const riderText = [this._armor?.name ?? "", ...implants.map((item) => item.name)].filter((name) => name).join(", ");
            trace.add("ci.bv2.def.divisor.beast", { label: `Damage divisors with the ${mount.name} mount${riderText ? ` (rider: ${riderText})` : ""}`, detail: `${fmt(base)} x (${fmt(rider)} + ${fmt(this.getMountDamageDivisor())})`, value: rating });
        }
        for (const item of augmentation.defensiveItems) trace.add("ci.bv2.def.augmentation", { label: item.label, detail: item.detail, value: item.value });

        // The Defensive Factor from the highest target movement modifier, and the addenda of TO:AUE p.191.
        const movement = this._bvTargetMovement();
        const factorId = movement.note ? "ci.bv2.def.factor.implant" : this.fliesAsVtol() && this.getMP() > 0 ? "ci.bv2.def.factor.vtol" : "ci.bv2.def.factor";
        let factor = 1 + movement.value / 10;
        trace.add(factorId, { label: "Defensive Factor", detail: `Target Movement Modifier +${movement.value}${movement.note ? ` (${movement.note})` : ""}: 1 + ${movement.value} / 10`, value: factor });
        const stealth = this.getStealthDefensiveFactor();
        if (stealth > 0) {
            const before = factor;
            factor += stealth;
            trace.add("ci.bv2.def.factor.stealth", { label: "Defensive Factor with stealth armor", detail: `${fmt(before)} + ${fmt(stealth)}`, value: factor });
        }
        const mountFactor = mount?.size === "very-large" ? -0.1 : mount?.size === "monstrous" ? -0.2 : 0;
        if (mount && mountFactor !== 0) {
            const before = factor;
            factor += mountFactor;
            trace.add("ci.bv2.def.factor.beast", { label: "Defensive Factor with mount", detail: `${fmt(before)} - ${fmt(-mountFactor)} (${INFANTRY_BEAST_SIZES[mount.size].name} mount)`, value: factor });
        }
        const defensive = (rating + augmentation.defensive) * factor;
        trace.add("ci.bv2.def.rating", { label: "Defensive Battle Rating", detail: `${augmentation.defensive > 0 ? `(${fmt(rating)} + ${fmt(augmentation.defensive)})` : fmt(rating)} x ${fmt(factor)}`, value: defensive, emphasis: true });

        // Step 2: Offensive Battle Rating.
        const primary = this.getPrimaryCount() * this._primary.battleValue;
        trace.add(this._primary.battleValueInferred ? "ci.bv2.off.primary.inferred" : "ci.bv2.off.primary", { label: `${this.getPrimaryCount()} x ${this._primary.name}`, detail: `${this.getPrimaryCount()} x ${fmt(this._primary.battleValue)}`, value: primary });
        let weapons = primary;
        if (this._secondary && this.getSecondaryCount() > 0) {
            const secondary = this.getSecondaryCount() * this._secondary.battleValue;
            trace.add(this._secondary.battleValueInferred ? "ci.bv2.off.secondary.inferred" : "ci.bv2.off.secondary", { label: `${this.getSecondaryCount()} x ${this._secondary.name}`, detail: `${this.getSecondaryCount()} x ${fmt(this._secondary.battleValue)}`, value: secondary });
            weapons += secondary;
        }
        if (this.canMakeAntiMechAttacks()) {
            // Archaic weapons are not added again: a blade or bow does nothing to a 'Mech (NGCFells 2026-11-23; the MUL and
            // MegaMek alike, the Otomo Guard 59).
            const archaic = (this._primary.category === "archaic" ? primary : 0)
                + (this._secondary?.category === "archaic" ? this.getSecondaryCount() * this._secondary.battleValue : 0);
            const again = weapons - archaic;
            const note = archaic > 0 ? ", archaic weapons left out" : "";
            // Grappler lines and climbing claws multiply the Anti-'Mech Battle Rating by 1.2 (IO:AE p.191).
            const antiMech = this.getAntiMechBattleRatingMultiplier();
            if (antiMech.multiplier > 1) {
                const added = again * antiMech.multiplier;
                trace.add(archaic > 0 ? "ci.bv2.off.anti-mech.tool.archaic" : "ci.bv2.off.anti-mech.tool", { label: `Anti-'Mech attack capability: weapons added again${note}, Anti-'Mech Battle Rating x ${fmt(antiMech.multiplier)} (${antiMech.name})`, detail: `${fmt(weapons)} + ${fmt(again)} x ${fmt(antiMech.multiplier)}`, value: weapons + added });
                weapons += added;
            } else {
                // A Very Large creature: the Creature Size Table's Leg attacks, where the text of p.108 bars them (TO:AUE pp.107-108).
                trace.add(archaic > 0 ? "ci.bv2.off.anti-mech.archaic" : this.getBeastSize()?.tag === "very-large" ? "ci.bv2.off.anti-mech.beast" : "ci.bv2.off.anti-mech", { label: `Anti-'Mech attack capability: weapons added again${note}`, detail: `${fmt(weapons)} + ${fmt(again)}`, value: weapons + again });
                weapons += again;
            }
        }
        // Gas effusers, triple-strength myomer, suicide implants and prosthetic weapons add to the weapons (IO:AE pp.185-186).
        for (const item of augmentation.offensiveItems) {
            trace.add("ci.bv2.off.augmentation", { label: item.label, detail: item.detail, value: item.value });
            weapons += item.value;
        }
        // Field guns and field artillery, with their ammunition, go into the offensive sum before the speed factor (TO:AUE p.191).
        const fieldGuns = this.getFieldGunBattleValue();
        if (fieldGuns.weapons > 0) {
            trace.add("ci.bv2.off.field-guns", { label: `Field ${this.isFieldArtillery() ? "artillery" : "guns"}: ${fieldGuns.count} x ${fieldGuns.name}`, detail: `${fieldGuns.count} x ${fmt(fieldGuns.each)}`, value: fieldGuns.weapons });
            weapons += fieldGuns.weapons;
            if (fieldGuns.loaded > 0) {
                trace.add("ci.bv2.off.field-guns.ammo", { label: `${fieldGuns.name} ammunition`, detail: `${fieldGuns.tons} tons${fieldGuns.ammo < fieldGuns.loaded ? `, held to the guns' value (${fmt(fieldGuns.loaded)} carried)` : ""}`, value: fieldGuns.ammo });
                weapons += fieldGuns.ammo;
            }
        }
        const speedMP = this.getBattleValueMP();
        const speedFactor = InfantryPlatoon.speedFactor(speedMP);
        trace.add("ci.bv2.off.speed", { label: "Speed Factor", detail: `${speedMP} MP${this.isMoveOrFire() ? " (move or fire)" : ""}`, value: speedFactor });
        const offensive = weapons * speedFactor;
        trace.add("ci.bv2.off.rating", { label: "Offensive Battle Rating", detail: `${fmt(weapons)} x ${fmt(speedFactor)}`, value: offensive, emphasis: true });

        // Step 3: Final Battle Value. The Unit Type Modifiers addendum (TO:AUE p.193): specialized infantry add to a base of 1, and the sum multiplies the total.
        const sum = defensive + offensive;
        trace.add("ci.bv2.final.sum", { label: "Defensive + Offensive Battle Rating", detail: `${fmt(defensive)} + ${fmt(offensive)}`, value: sum });
        const parts = this.getTypeModifierParts();
        const typeModifier = this.getTypeModifier();
        let total = sum;
        if (parts.length > 0) {
            total = sum * typeModifier;
            trace.add("ci.bv2.final.type-modifier", { label: "Unit type modifier", detail: `1 ${parts.map((part) => `+ ${fmt(part.value)} (${part.name})`).join(" ")} = ${fmt(typeModifier)}; ${fmt(sum)} x ${fmt(typeModifier)}`, value: total });
        }
        const value = roundNormally(total);
        trace.add("ci.bv2.final.round", { label: "Battle Value", detail: `${fmt(total)} rounded`, value, emphasis: true });
        // The skill-modifying implants change the skills the multiplier is found from, after this value (IO:AE p.184).
        const skills = this.getAugmentationSkillModifiers();
        if (skills.detail) trace.add("ci.bv2.final.skill", { label: "Skill modifiers of the implants, used for the multiplier", detail: skills.detail });
        return { value, result: value, log: trace.steps.map(formatCalcStep), steps: trace.steps };
    }

    /**
     * Battle Value 1 as cited steps under a Master Rules edition: the platoon's line on the Infantry Battle Values table (BMR p.142 with its
     * errata, BMR(R) p.155), scaled to the platoon's size, plus the unit equipment and field guns of Maximum Tech p.93 (getInfantryBv1Steps).
     * A platoon the books give no line (mechanized, a motive the Master Rules lack, a weapon outside the six classes) has no value: `result` is null
     * and the value 0, with the step that says why.
     */
    private _calcBattleValue1(edition: string): IInfantryBvResult {
        const trace = new CalcTrace(getInfantryBv1Steps(edition));
        const fmt = formatCalcNumber;
        const none = (): IInfantryBvResult => ({ value: 0, result: null, log: trace.steps.map(formatCalcStep), steps: trace.steps });
        // Maximum Tech's submersible infantry are foot infantry equipped to operate underwater (p.42): standard SCUBA reads the foot line.
        const submersible = this._motive.tag === "scuba";
        const motive = submersible ? "foot" : this._motive.tag;
        if (motive !== "foot" && motive !== "jump" && motive !== "motorized") {
            if (this.isMechanized() && !this._motive.vtol && !this._motive.scuba) trace.add("ci.bv1.mechanized", { label: `${this.getMotive().name} platoon`, detail: "no line on the Infantry Battle Values table" });
            else trace.add("ci.bv1.motive", { label: `${this.getMotive().name} platoon`, detail: "no line on the Infantry Battle Values table" });
            return none();
        }
        const trained = this.hasAntiMechKit();
        const column = trained ? 1 : 0;
        let table: number;
        if (motive === "motorized" && this.hasSpecialty("engineers")) {
            table = INFANTRY_BV1_ENGINEERS[column];
            trace.add("ci.bv1.table.level3", { label: "Motorized Engineers (Level 3)", detail: trained ? "Anti-'Mech trained column" : "untrained column", value: table });
        } else {
            // The Master Rules name a platoon by its heavy weapon: the TechManual builds those as rifle troopers with the support weapon as the secondary.
            const secondaryClass = this._secondary && this.getSecondaryCount() > 0 ? getInfantryBv1Class(this._secondary) : null;
            const bySecondary = !!secondaryClass && secondaryClass !== "rifle";
            const weaponClass = bySecondary ? secondaryClass : getInfantryBv1Class(this._primary);
            const named = bySecondary ? this._secondary! : this._primary;
            if (!weaponClass) {
                trace.add("ci.bv1.weapon-class", { label: this._primary.name, detail: "not a rifle, machine gun, flamer, laser, SRM or LRM" });
                return none();
            }
            trace.add("ci.bv1.map", { label: "Weapon class", detail: `${named.name} (${bySecondary ? "secondary" : "primary"}) read as ${weaponClass}` });
            table = getInfantryBv1Line(motive, weaponClass, trained);
            trace.add(weaponClass === "lrm" ? "ci.bv1.table.lrm" : "ci.bv1.table", { label: `${this.getMotive().name} ${weaponClass} platoon`, detail: trained ? "Anti-'Mech trained column" : "untrained column", value: table });
        }
        let total = table;
        const standard = INFANTRY_BV1_STANDARD_SIZE[motive];
        if (this.getTroopers() !== standard) {
            total = table * this.getTroopers() / standard;
            trace.add("ci.bv1.size", { label: "Platoon size", detail: `${fmt(table)} x ${this.getTroopers()} / ${standard} troopers`, value: total });
        }
        // Unit equipment (Maximum Tech p.93), added before the skill adjustment.
        const addEquipment = (key: keyof typeof INFANTRY_BV1_EQUIPMENT, label: string, count: number = 1): void => {
            const each = INFANTRY_BV1_EQUIPMENT[key][column] ?? INFANTRY_BV1_EQUIPMENT[key][0];
            total += each * count;
            trace.add("ci.bv1.equipment", { label, detail: `${count} x ${fmt(each)}`, value: each * count });
        };
        const stealth = this._armor?.stealth ?? [];
        if (stealth.includes("camo")) addEquipment("sneak-suits", "Camouflage sneak suits");
        if (stealth.includes("ecm")) addEquipment("ecm-suits", "ECM suits");
        if (this._armor?.encumbering) addEquipment("heavy-armor", `Heavy armor (${this._armor.name})`);
        if (this.getNarcLaunchers() > 0) addEquipment("narc", "Narc launchers", this.getNarcLaunchers());
        // TAG +1 for the TAG field gear or a TAG Troops platoon, once (NGCFells 2026-11-23).
        if (this._fieldGear.includes("inf-field-tag") || this.getTagTrooperCount() > 0) addEquipment("tag", this.getTagTrooperCount() > 0 ? "TAG (TAG Troops)" : "TAG");
        if (this.hasSpecialty("paratroops")) addEquipment("paratroops", "Paratroops");
        // Specialties Maximum Tech prints no line or equipment row for keep the weapon line, marked provisional (NGCFells 2026-11-23).
        const unlisted = [
            ...(["marines", "mountain"] as const).filter((tag) => this.hasSpecialty(tag)).map((tag) => findInfantrySpecialty(tag)!.name),
            ...(this.hasSpecialty("engineers") && motive !== "motorized" ? [findInfantrySpecialty("engineers")!.name] : []),
            ...(this.getParamedicCount() > 0 ? [findInfantrySpecialty("paramedics")!.name] : []),
            ...(this.getTagTrooperCount() > 0 ? [findInfantrySpecialty("tag")!.name] : []),
            ...(this._xct ? ["XCT troops"] : []),
        ];
        if (unlisted.length > 0) trace.add("ci.bv1.specialty", { label: unlisted.join(", "), detail: "no line in Maximum Tech: the weapon line is kept", value: 0 });
        if (submersible) {
            const each = INFANTRY_BV1_EQUIPMENT.submersible[column] ?? INFANTRY_BV1_EQUIPMENT.submersible[0];
            total += each;
            trace.add("ci.bv1.submersible", { label: "Submersible (SCUBA) infantry", detail: `foot line + ${fmt(each)}`, value: each });
        }
        // Field guns: each gun's Master Rules weapon BV, no ammunition (Maximum Tech p.93); a gun the tables do not print, at its BV2 figure (provisional).
        if (this._fieldGun && this.getFieldGunCount() > 0) {
            // A mixed platoon's gun of the other technology base reads that base's table (TO:AUE p.189).
            const gunBase = this._fieldGun.techBase === "is" || this._fieldGun.techBase === "clan" ? this._fieldGun.techBase : this._techBase;
            const rating = rateBattleValue1(edition, gunBase, false, this._fieldGun);
            const value = rating.value * this.getFieldGunCount();
            total += value;
            const unlisted = rating.source === "unlisted";
            trace.add(unlisted ? "ci.bv1.field-guns.unlisted" : "ci.bv1.field-guns", { label: `${this.getFieldGunCount()} x ${this._fieldGun.name}`, detail: `${this.getFieldGunCount()} x ${fmt(rating.value)}${unlisted ? " (not in the Master Rules tables: the BV2 figure)" : ""}`, value });
        }
        const value = roundNormally(total);
        trace.add("ci.bv1.final.round", { label: "Battle Value 1", detail: `${fmt(total)} rounded`, value, emphasis: true });
        return { value, result: value, log: trace.steps.map(formatCalcStep), steps: trace.steps };
    }

    /** BV1 under a Master Rules edition once the infantry's BV1 is entered (0 where the books give the platoon no line), BV2 otherwise. */
    private _bvFor(edition: string): IInfantryBvResult {
        return getBattleValueFor<IInfantryBvResult>(edition, "infantry", { bv1: () => this._calcBattleValue1(edition), bv2: () => this._calcBattleValue() });
    }

    public getBattleValue(edition: string = this._rulesEdition): number { return this._bvFor(edition).value; }
    /** The calculation, one plain-text line per step, each with its page. */
    public getBattleValueLog(edition: string = this._rulesEdition): string[] { return this._bvFor(edition).log; }

    /**
     * The Battle Value steps under `edition`, each with its page (#599): BV2 under a Total Warfare edition, BV1 under the Master Rules
     * (a null result where the books give the platoon no line), and one step with a null result under an edition older than the Battle
     * Value system.
     */
    public getBattleValueBreakdown(edition: string = this._rulesEdition): ICalcBreakdown {
        if (!editionHasBattleValue(edition, "infantry")) {
            const trace = new CalcTrace(NO_BATTLE_VALUE_STEPS);
            trace.add("none.no-battle-value", { label: `${getRulesEdition(edition).name} has no Battle Value. Battle Value first appears in the BattleTech Master Rules (1998)` });
            return { kind: "battle-value", edition, scheme: "none", steps: trace.steps, result: null };
        }
        const bv1 = getBattleValueFor<boolean>(edition, "infantry", { bv1: () => true, bv2: () => false });
        const calculated = this._bvFor(edition);
        return { kind: "battle-value", edition, scheme: bv1 ? "bv1" : "bv2", steps: calculated.steps, result: calculated.result };
    }

    /**
     * The rules edition's skill multiplier (TechManual p.315 by default). Under the TechManual, mechanized platoons
     * adjust Gunnery only and use the table's 5 column (TM p.314); under the Master Rules every infantry unit does.
     * An edition with no table gives 1.
     */
    public getSkillMultiplier(edition?: string): number {
        // Any other platoon without usable kits reads Anti-'Mech 8, "which cannot be improved" (BV v4.1 p.23, #609).
        // Implants that change the effective skills (IO:AE p.184); no skill falls below 0 or rises above 8.
        const skills = this.getAugmentationSkillModifiers();
        return getSkillMultiplier(Math.min(8, Math.max(0, this._gunnery + skills.gunnery)), Math.min(8, Math.max(0, this.getAntiMechSkill() + skills.piloting)), this.isMechanized() ? "mechanized-infantry" : "infantry", getBattleValueSkillEdition(edition ?? this._rulesEdition, "infantry")) ?? 1;
    }
    public getSkillAdjustedBattleValue(edition?: string): number { return roundNormally(this.getBattleValue(edition) * this.getSkillMultiplier(edition)); }

    // Cost (TM pp.276, 282)

    /**
     * Base Trooper Cost = 2,000 x the square root of the weapon's cost, times the motive type's multiplier and 5 for
     * Anti-'Mech training and equipment. The book prices a platoon with one weapon type; where a secondary weapon
     * is carried, each trooper is priced by the weapon they fire, as MegaMek does. Null when a fielded weapon has
     * no price in the cost table.
     */
    private _calcCost(): IInfantryCostResult {
        const unpriced = this._fieldedWeapons().filter((weapon) => weapon.cost === null);
        const trace = new CalcTrace(INFANTRY_COST_STEPS);
        if (unpriced.length > 0) {
            const names = unpriced.map((weapon) => weapon.name).join(" or ");
            trace.add("ci.cost.unpriced", { label: `No price for ${names}`, detail: "the cost table (TM pp.298-301) gives none, so the platoon has no cost" });
            return { value: null, log: [`The cost table (TM pp.298-301) gives no price for ${names}.`], steps: trace.steps };
        }
        const fmt = formatCalcNumber;
        const trooperCost = (weapon: IInfantryWeapon): number => 2000 * Math.sqrt(weapon.cost ?? 0);
        let total = this.getPrimaryCount() * trooperCost(this._primary);
        trace.add("ci.cost.trooper", { label: `${this.getPrimaryCount()} x ${this._primary.name}`, detail: `${this.getPrimaryCount()} troopers x 2,000 x square root of ${format(this._primary.cost ?? 0, 0)}`, value: total, total });
        if (this._secondary && this.getSecondaryCount() > 0) {
            const secondary = this.getSecondaryCount() * trooperCost(this._secondary);
            total += secondary;
            trace.add("ci.cost.secondary", { label: `${this.getSecondaryCount()} x ${this._secondary.name}`, detail: `${this.getSecondaryCount()} troopers x 2,000 x square root of ${format(this._secondary.cost ?? 0, 0)}`, value: secondary, total });
        }
        if (this.getTagTrooperCount() > 0) {
            // TO:AUE p.225 has no row for TAG Troops: each is priced as a secondary weapon trooper carrying a TAG (provisional).
            const tagCost = this.getTagTrooperCount() * 2000 * Math.sqrt(INFANTRY_TAG_WEAPON_COST);
            total += tagCost;
            trace.add("ci.cost.tag-troopers", { label: `${this.getTagTrooperCount()} TAG troopers`, detail: `${this.getTagTrooperCount()} TAG troopers x 2,000 x square root of ${format(INFANTRY_TAG_WEAPON_COST, 0)}`, value: tagCost, total });
        }
        if (this._armor) {
            const armorCost = this._armor.cost * this.getTroopers();
            total += armorCost;
            trace.add("ci.cost.armor", { label: this._armor.name, detail: `${this.getTroopers()} x ${format(this._armor.cost, 0)}`, value: armorCost, total });
        }
        // The TechManual's motive multipliers price each trooper (p.282). The mechanized VTOL and SCUBA rows of TO:AUE p.225 are
        // "TC x", the Total Unit Cost "applied to final calculations", as are the specialties and XCT: those come last (below).
        const motive = this.getMotive();
        const motiveId = this._motive.tag === "scuba-mech" ? "ci.cost.motive.scuba-mech" : this._motive.vtol ? "ci.cost.motive.vtol" : this._motive.scuba ? "ci.cost.specialization" : "ci.cost.motive";
        const motiveOnTotal = !!this._motive.vtol || (!!this._motive.scuba && this._motive.tag !== "scuba-mech");
        if (!motiveOnTotal) {
            total *= motive.costMultiplier;
            trace.add(motiveId, { label: motive.name, detail: `x ${fmt(motive.costMultiplier)}`, total });
        }
        if (this.hasAntiMechKit()) {
            total *= INFANTRY_ANTI_MECH_COST_MULTIPLIER;
            trace.add("ci.cost.anti-mech", { label: "Anti-'Mech training and equipment", detail: `x ${INFANTRY_ANTI_MECH_COST_MULTIPLIER}`, total });
        }
        if (this._fieldGun && this.getFieldGunCount() > 0) {
            // Field guns and field artillery cost what the weapon costs (TO:AUE p.225).
            const gunCost = this.getFieldGunCount() * (this._fieldGun.cbills ?? 0);
            total += gunCost;
            trace.add("ci.cost.field-guns", { label: `${this.getFieldGunCount()} x ${this._fieldGun.name}`, detail: `${this.getFieldGunCount()} x ${format(this._fieldGun.cbills ?? 0, 0)}`, value: gunCost, total });
        }
        if (this.isBeastMounted()) {
            const beastCost = INFANTRY_BEAST_COST_PER_TON * this.getWeight();
            total += beastCost;
            trace.add("ci.cost.beast", { label: "Beast mounts", detail: `${format(INFANTRY_BEAST_COST_PER_TON, 0)} x ${this.getWeight()} tons (the whole unit)`, value: beastCost, total });
        }
        // Each trooper's implants and limbs are added to the platoon's final cost (IO:AE p.179).
        const augmentation = this.getAugmentationCost();
        for (const item of augmentation.items) {
            total += item.value;
            trace.add("ci.cost.augmentation", { label: item.label, detail: item.detail, value: item.value, total });
        }
        if (this.getNarcLaunchers() > 0) {
            total += this.getNarcLaunchers() * 10000;
            trace.add("ci.cost.narc", { label: "Disposable Narc launchers", detail: `${this.getNarcLaunchers()} x 10,000`, value: this.getNarcLaunchers() * 10000, total });
        }
        if (this._fieldGear.includes("inf-field-tag")) {
            total += 50000;
            trace.add("ci.cost.tag", { label: "TAG equipment", value: 50000, total });
        }
        // The "TC x" multipliers of TO:AUE p.225 on the total unit cost, after field guns, beasts, augmentation, Narc and TAG
        // (NGCFells 2026-11-23): the mechanized VTOL and SCUBA motives, the specialties and XCT troops.
        if (motiveOnTotal) {
            total *= motive.costMultiplier;
            trace.add(motiveId, { label: motive.name, detail: `x ${fmt(motive.costMultiplier)} (the total unit cost)`, total });
        }
        for (const tag of this._specialties) {
            const specialty = findInfantrySpecialty(tag);
            if (specialty && specialty.costMultiplier !== 1) {
                total *= specialty.costMultiplier;
                trace.add("ci.cost.specialization", { label: specialty.name, detail: `x ${fmt(specialty.costMultiplier)} (the total unit cost)`, total });
            }
        }
        if (this._xct) {
            total *= INFANTRY_XCT_COST_MULTIPLIER;
            trace.add("ci.cost.specialization", { label: "XCT troops", detail: `x ${fmt(INFANTRY_XCT_COST_MULTIPLIER)} (the total unit cost)`, total });
        }
        // Paramedics: 0.375 of the finished total for each medic, added after every other step (TO:AUE p.225, note **).
        if (this.getParamedicCount() > 0) {
            const medics = this.getParamedicCount() * INFANTRY_PARAMEDIC_COST_FRACTION * total;
            trace.add("ci.cost.paramedics", { label: `${this.getParamedicCount()} paramedics`, detail: `${this.getParamedicCount()} x ${INFANTRY_PARAMEDIC_COST_FRACTION} x ${format(total)} (the total so far), added last`, value: medics, total: total + medics });
            total += medics;
        }
        const value = Math.floor(total + 1e-6);
        trace.add("ci.cost.final", { label: "Cost", detail: `${format(total)} rounded down`, value, emphasis: true });
        return { value, log: trace.steps.map(formatCalcStep), steps: trace.steps };
    }

    public getCBillCost(): number | null { return this._calcCost().value; }
    public getCBillCostLog(): string[] { return this._calcCost().log; }
    /** The C-bill cost calculation as cited steps (an empty list, and a null result, where a fielded weapon has no price). */
    public getCostBreakdown(): ICalcBreakdown {
        const cost = this._calcCost();
        return { kind: "cost", edition: this._rulesEdition, steps: cost.steps, result: cost.value };
    }

    // Alpha Strike conversion (Alpha Strike Companion pp.92-103, 138-140)

    /**
     * The converted Alpha Strike stats of one platoon; an oversized formation converts its first sub-platoon, as
     * each is a unit of its own. The conversion follows the Alpha Strike Companion; the Point Value is worked out
     * as MegaMek does, which the Master Unit List's infantry cards match.
     */
    public getAlphaStrikeStats(): IInfantryAlphaStrikeStats {
        const log: string[] = [];
        const troopers = this.getSubPlatoons()[0];

        const movement = this.getMP() * 2;
        // A beast-mounted platoon moves by its creature: ground is foot, VTOL the mechanized VTOL code (ASC p.93); the Companion has no
        // code for a submarine creature, so MegaMek's "s" is used for those.
        const mountCode = { Ground: "f", VTOL: "v", Submarine: "s" } as const;
        const movementCode = this.getMount() ? mountCode[this.getMount()!.moveType] : INFANTRY_AS_MOVEMENT_CODES[this._motive.tag];
        log.push(`Move: ${this.getMP()} MP x 2 = ${movement}"${movementCode}${this.getMount()?.moveType === "Submarine" ? " (no Companion code for submarine infantry: MegaMek's s)" : ""}`);
        // A SCUBA platoon lists its ground and its water movement together, and has the UMU special (ASC p.93, "Underwater Maneuvering Systems").
        const swims = !!this.getMotive().scuba && this.getMotive().groundMP !== undefined;
        const groundMovement = swims ? this.getMotive().groundMP! * 2 : movement;
        if (swims) log.push(`SCUBA: ${this.getMotive().groundMP} ground MP and ${this.getMP()} water MP, each x 2 = ${groundMovement}"f/${movement}"s, and the UMU special (ASC p.93)`);

        // 15 over the damage divisor; a mechanized platoon's divisor is halved (ASC p.99). A beast rider's divisor is the rider's plus the mount's, summed as for BV and play (TO:AUE p.191; NGCFells 2026-11-23).
        const divisor = this.getDamageDivisor() * (this.isMechanized() ? 0.5 : 1);
        const armor = Math.round(troopers * divisor / 15 + 1e-9);
        log.push(`Armor: ${troopers} troopers / (15 / damage divisor ${divisor}${this.isBeastMounted() ? `, ${this.getMount()!.name} mount included` : ""}) = ${(troopers * divisor / 15).toFixed(2)}, rounded to ${armor}`);
        const structure = 1;

        const troopFactor = INFANTRY_TROOP_FACTORS[Math.min(troopers, 30)] ?? 0;
        // Triple-strength myomer's and the prosthetics' extra damage goes into the attack values before conversion; multi-modal implants x1.05 before rounding (IO:AE pp.194-195).
        const augmentDamage = this._alphaStrikeAugmentationDamage(troopFactor);
        log.push(...augmentDamage.log);
        const platoonDamage = this.getDamageForTroopers(troopFactor) + augmentDamage.extra;
        const converted = platoonDamage / 10 * augmentDamage.multiplier;
        const value: IInfantryASDamageValue = converted > 0 && converted < 0.5 ? { damage: 0, minimal: true } : { damage: Math.ceil(converted - 1e-9), minimal: false };
        const none: IInfantryASDamageValue = { damage: 0, minimal: false };
        const maxRange = this.getMaxRange();
        const reachesMedium = maxRange > 3;
        const reachesLong = maxRange > 15;
        log.push(`Damage: Troop Factor ${troopFactor} for ${troopers} troopers; ${platoonDamage} damage at ${troopFactor} troopers / 10 = ${converted.toFixed(1)}: ${formatInfantryASDamage(value)}`);
        log.push(`Range: ${maxRange} ${maxRange === 1 ? "hex" : "hexes"}: ${reachesLong ? "Short, Medium and Long" : reachesMedium ? "Short and Medium" : "Short only"}`);
        let damageValues = { short: value, medium: reachesMedium ? value : none, long: reachesLong ? value : none };
        // Field guns replace the infantry damage with their vehicle weapon values; artillery adds its special (inferred, see _fieldGunAlphaStrike).
        const guns = this._fieldGunAlphaStrike();
        if (guns) log.push(...guns.log);
        if (guns?.damage) damageValues = guns.damage;

        const specialAbilities: string[] = [];
        if (this.canMakeAntiMechAttacks()) specialAbilities.push("AM");
        specialAbilities.push(`CAR${this.getWeight(troopers)}`);
        const specialtySpecials = this._specialtyAlphaStrike(log);
        specialAbilities.push(...specialtySpecials.filter((code) => !specialAbilities.includes(code)));
        if (swims) specialAbilities.push("UMU");
        if (guns) specialAbilities.push(...guns.specials.filter((code) => !specialAbilities.includes(code)));
        const implantSpecials = this._alphaStrikeAugmentationSpecials();
        log.push(...implantSpecials.log);
        specialAbilities.push(...implantSpecials.specials.filter((code) => !specialAbilities.includes(code)));
        // A platoon that can deliver heat has HT equal to its Short damage, 2 at most (ASC p.121).
        let heat = 0;
        if (!guns?.damage && this.getSpecialFeatures().includes("F") && value.damage >= 1) {
            heat = Math.min(2, value.damage);
            specialAbilities.push(`HT${heat}/${reachesMedium ? heat : "-"}/${reachesLong ? heat : "-"}`);
        }

        // Camo and the DEST suit are mimetic armor: LMAS, as the MUL lists for every stealthy infantry unit (ASC p.127, ASCE p.140).
        const mimetic = (!!this._armor && this._armor.stealth.some((system) => system === "camo" || system === "dest")) || this._has("aug-dermal-camo");
        // Dermal camouflage gives LMAS to conventional infantry (IO:AE p.194; the implant's stealth works for foot and jump platoons in no other armor, which the book does not repeat for Alpha Strike).
        if (mimetic) specialAbilities.push("LMAS");

        // Point Value.
        const points = (item: IInfantryASDamageValue): number => item.minimal ? 0.5 : item.damage;
        const short = points(damageValues.short);
        const medium = points(damageValues.medium);
        const long = points(damageValues.long);
        let offensive = short + medium * 2 + long;
        log.push(`Offensive Value: ${short} + 2 x ${medium} + ${long} = ${offensive}`);
        // TAG troops carry the TAG special, +0.5 on the Offensive Special Ability Factor Table (ASC p.139).
        if (specialtySpecials.includes("TAG")) {
            offensive += 0.5;
            log.push(`TAG: + 0.5 = ${offensive} (ASC p.139)`);
        }
        if (heat > 0) {
            const heatValue = heat + (reachesMedium ? 0.5 : 0);
            offensive += heatValue;
            log.push(`HT: + ${heatValue} = ${offensive}`);
        }
        const jumps = this._motive.tag === "jump" && movement > 0;
        let targetMovement = 0;
        if (movement >= 35) targetMovement = 5;
        else if (movement >= 19) targetMovement = 4;
        else if (movement >= 13) targetMovement = 3;
        else if (movement >= 9) targetMovement = 2;
        else if (movement >= 5) targetMovement = 1;
        let defensive = movement / 8 + (jumps ? 0.5 : 0);
        const defenseModifier = Math.max(targetMovement, mimetic ? 3 : 0) + (jumps ? 1 : 0); // LMAS: +3 per the Companion Defense Factor table (Alpha Strike Companion, Mimetic Armor line); the MUL prices LMAS infantry at 2, so our PV is off the MUL here on purpose (#648 M9)
        const defenseFactor = 1 + (defenseModifier <= 2 ? 0.1 : 0.25) * defenseModifier;
        const interaction = roundToHalf((armor * 2 + structure * 2) * defenseFactor);
        log.push(`Defensive Value: ${movement} / 8${jumps ? " + 0.5 (jump)" : ""} = ${defensive}; (Armor ${armor} x 2 + Structure ${structure} x 2) x ${defenseFactor.toFixed(2)} = ${interaction}`);
        defensive += interaction;
        let subTotal = offensive + defensive;
        // Agile bonus and brawler penalty; a unit an infantry transport can carry (CAR 8 or less) is no brawler.
        let agile = 0;
        if (targetMovement > 1) {
            if (medium > 0) agile = (targetMovement - 1) * medium;
            else if (targetMovement >= 3) agile = (targetMovement - 2) * short;
        }
        agile = roundToHalf(agile);
        let brawler = 0;
        if (movement >= 2 && this.getWeight(troopers) > 8) {
            const shortOnly = medium + long === 0 && short > 0;
            const shortAndMedium = long === 0 && short + medium > 0;
            if (movement >= 6 && movement <= 10 && shortOnly) brawler = 0.25;
            else if (movement < 6 && shortOnly) brawler = 0.5;
            else if (movement < 6 && shortAndMedium) brawler = 0.25;
        }
        const penalty = roundToHalf(subTotal * brawler);
        if (agile > 0) log.push(`Agile: + ${agile}`);
        if (penalty > 0) log.push(`Brawler: - ${penalty}`);
        subTotal += agile - penalty;
        const pointValue = Math.max(1, Math.round(subTotal + 1e-9));
        log.push(`Point Value: ${offensive} + ${defensive}${agile > 0 ? ` + ${agile}` : ""}${penalty > 0 ? ` - ${penalty}` : ""} = ${subTotal}, rounded to ${pointValue}`);

        const flightMovement = this.getFlightMP() * 2;
        if (flightMovement > 0) log.push(`Powered flight wings: ${this.getFlightMP()} MP of VTOL movement = ${flightMovement}"v (IO:AE p.195); the Point Value is worked out on the ground movement, as the Companion has no rule for it.`);
        return {
            type: "CI", size: 1, movement: groundMovement, movementCode: swims ? "f" : movementCode, armor, structure, damageValues, specialAbilities, pointValue, calcLog: log,
            ...(swims ? { secondaryMovement: { movement, code: "s" } } : {}),
            ...(flightMovement > 0 ? { flightMovement } : {}),
        };
    }

    /** The converted Alpha Strike card, built the same way as a Master Unit List record. */
    public getAlphaStrikeUnit(): AlphaStrikeUnit {
        const stats = this.getAlphaStrikeStats();
        const damage = stats.damageValues;
        const record = {
            Id: 0,
            Name: this.getDisplayName(),
            Class: this.getDisplayName(),
            Variant: "",
            Tonnage: this.getWeight(this.getSubPlatoons()[0]),
            Cost: this.getCBillCost() ?? 0,
            BattleValue: this.getBattleValue(),
            BFType: stats.type,
            BFSize: stats.size,
            BFMove: `${stats.movement}"${stats.movementCode}${stats.secondaryMovement ? `/${stats.secondaryMovement.movement}"${stats.secondaryMovement.code}` : ""}${stats.flightMovement ? `/${stats.flightMovement}"v` : ""}`,
            BFTMM: 0,
            BFArmor: stats.armor,
            BFStructure: stats.structure,
            BFThreshold: 0,
            BFDamageShort: damage.short.damage,
            BFDamageMedium: damage.medium.damage,
            BFDamageLong: damage.long.damage,
            BFDamageExtreme: 0,
            BFDamageShortMin: damage.short.minimal,
            BFDamageMediumMin: damage.medium.minimal,
            BFDamageLongMin: damage.long.minimal,
            BFDamageExtremeMin: false,
            BFOverheat: 0,
            BFPointValue: stats.pointValue,
            BFAbilities: stats.specialAbilities.join(","),
            Role: { Id: 0, Name: "None", Image: null, SortOrder: 0 },
            Technology: { Id: 0, Name: this.getTechName(), Image: null, SortOrder: 0 },
            Type: { Id: 21, Name: "Infantry", Image: null, SortOrder: 0 },
        } as unknown as IASMULUnit;
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        // The unit picture stored in the design (#95); with none, the picture the MUL record gave stays.
        if (this.tro.getImage()) unit.imageURL = this.tro.getImage();
        unit.rulesLevel = Math.max(2, this.getRequiredRulesLevel());
        // The card credits the Special Rulesets the design is built under (#324).
        unit.rulesets = this.gameSettings.getRulesets();
        return unit;
    }

    // Legality

    public getIssues(): string[] {
        const issues: string[] = [];
        const troopers = this.getTroopers();
        const subPlatoons = this.getSubPlatoons();
        if (this._squadSize > this.getMaxSquadSize()) {
            issues.push(`${this.getMotive().name} squads hold at most ${this.getMaxSquadSize()} troopers (${this.isSpecialized() ? "TO:AUE p.153" : "TM p.145"})`);
        }
        // A mechanized VTOL or SCUBA platoon is never split into sub-platoons: its squad limit is the platoon's.
        if (!this.isBeastMounted() && this._squads > this.getMaxSquads() * (this._motive.maxSquads !== undefined && this.isMechanized() ? 1 : subPlatoons.length)) {
            issues.push(`At most ${this.getMaxSquads()} squads are allowed per platoon or sub-platoon (${this.isSpecialized() || this._motive.maxSquads ? "TO:AUE pp.135, 153" : "TM p.146"})`);
        }
        if (this.isMechanized() && troopers > this.getMaxPlatoonSize()) {
            issues.push(`${this.getMotive().name} platoons hold at most ${this.getMaxPlatoonSize()} troopers (${this.isSpecialized() ? "TO:AUE p.153" : "TM p.145"})`);
        }
        const mount = this.getMount();
        const beastSize = this.getBeastSize();
        if (mount && beastSize) {
            // A Large creature carries 1 trooper; each Very Large or Monstrous creature is a squad of its own riders.
            const creatures = beastSize.troopsPerCreature === 1 ? troopers : this._squads;
            if (creatures > beastSize.creaturesPerPlatoon) issues.push(`A ${mount.name} platoon holds at most ${beastSize.creaturesPerPlatoon} ${mount.name}s (${beastSize.name} creatures, TO:AUE p.107)`);
        }
        for (const weapon of this._fieldedWeapons()) {
            const bar = this._weaponBar(weapon);
            if (bar) issues.push(bar);
            else if (!this.isWeaponInEra(weapon)) issues.push(`${weapon.name} is not available to ${this.getTechName()} infantry in the ${this._era.name} era (TM pp.298-301)`);
        }
        if (this._armor) {
            if (!this.isArmorForPlatoon(this._armor)) issues.push(`${this._armor.name} is not available to ${this.getTechName()} infantry (TO:AUE p.${this._armor.page})`);
            else if (!this.isArmorInEra(this._armor)) issues.push(`${this._armor.name} is not available in the ${this._era.name} era (TO:AUE p.${this._armor.page})`);
        }
        if (this._primary.type === "support") issues.push("The primary weapon must be a Melee or Standard weapon (TM p.150)");
        if (this._secondary && this._primary.type === "melee" && this._secondary.type === "support") {
            issues.push("A platoon with a Melee primary weapon may only carry a Melee or Standard secondary weapon (TM p.151)");
        }
        if (this._secondary && this.getSecondaryPerSquad() > this.getMaxSecondaryPerSquad()) {
            issues.push(`A squad of ${this._squadSize} can crew ${this.getMaxSecondaryPerSquad()} ${this._secondary.name} at most (TM p.151)`);
        }
        issues.push(...this._fieldGunIssues());
        issues.push(...this._augmentationIssues());
        issues.push(...this._specialtyIssues());
        return issues;
    }

    /** Every specialized infantry, paramedic, TAG, SCUBA, VTOL and XCT rule the platoon breaks (TO:AUE pp.135-136, 152-153, 162-163). */
    private _specialtyIssues(): string[] {
        const issues: string[] = [];
        if (this.isSpecialized() && !this.meetsVeteranRule()) {
            issues.push(`Specialized infantry must be Veteran or better: Gunnery ${INFANTRY_VETERAN_GUNNERY}${this.hasAntiMechKit() ? ` and Anti-'Mech ${INFANTRY_VETERAN_ANTI_MECH}` : ""} or lower (TO:AUE p.152)`);
        }
        for (const tag of this._specialties) {
            const bar = this.getSpecialtyBar(tag);
            if (bar) issues.push(bar);
        }
        if (this.getSpecialTroopersPerSquad() > this.getSecondarySlotsPerSquad() && !this.isBeastMounted()) {
            issues.push(`Paramedics and TAG troopers replace secondary weapon troopers: this platoon has ${this.getSecondarySlotsPerSquad()} secondary slots a squad (TO:AUE p.153)`);
        }
        if (this._motive.maxSecondary !== undefined && this._secondary && this.getSecondaryPerSquad() > this._motive.maxSecondary) {
            issues.push(`${this.getMotive().name} squads carry at most ${this._motive.maxSecondary} support weapons (TO:AUE pp.136, 153)`);
        }
        const xct = this.getXCTProblem();
        if (xct) issues.push(xct);
        return issues;
    }

    /** Every field gun rule the platoon breaks (TO:AUE pp.122-123). */
    private _fieldGunIssues(): string[] {
        const weapon = this._fieldGun;
        if (!weapon || this._fieldGunCount === 0) return [];
        const issues: string[] = [];
        const bar = this.getFieldGunBar();
        if (bar) issues.push(bar);
        if (getFieldGunKind(weapon) === null) issues.push(`${weapon.name} is not a weapon a platoon may use as a field gun or field artillery (TO:AUE p.122)`);
        else if (weapon.techBase !== undefined && weapon.techBase !== "universal" && weapon.techBase !== this._techBase) issues.push(`${weapon.name} is not available to ${this.getTechName()} infantry`);
        else if (!this._isFieldGunInEra(weapon)) issues.push(`${weapon.name} is not available in the ${this._era.name} era (TO:AUE p.122)`);
        if (this.isFieldArtillery()) {
            const tons = Math.ceil(weapon.weight - 1e-9);
            if (this._fieldGunCount > 1) issues.push("A platoon may carry only one field artillery piece (TO:AUE p.122)");
            if (this.getTroopers() < tons) issues.push(`${weapon.name} needs a platoon of at least ${tons} troopers (its tons, ammunition not counted); this one has ${this.getTroopers()} (TO:AUE p.122)`);
        } else if (this._fieldGunCount > this.getMaxFieldGuns()) {
            issues.push(`A platoon of ${this.getTroopers()} can crew ${this.getMaxFieldGuns()} ${weapon.name} field guns (${this.getFieldGunCrew()} troopers each) at most; ${this._fieldGunCount} are fitted (TO:AUE p.122)`);
        }
        if (this._fieldGunAmmo.length !== this._fieldGunCount) {
            issues.push(`Field guns carry 1 ton of ammunition each: ${this._fieldGunCount} tons are needed, ${this._fieldGunAmmo.length} are loaded (TO:AUE p.123)`);
        }
        for (const ammo of this._fieldGunAmmo) {
            if (!getFieldGunAmmoOptions(weapon, this._techBase).some((option) => option.tag === ammo.tag)) {
                issues.push(`${ammo.name} cannot be fired by ${weapon.name}${/lbx/.test(weapon.tag) ? " (an LB-X field gun fires cluster ammunition only, TO:AUE p.123)" : ""}`);
            }
        }
        return issues;
    }

    /** Things worth knowing that do not make the platoon illegal. */
    public getNotes(): string[] {
        const notes: string[] = [];
        const subPlatoons = this.getSubPlatoons();
        if (subPlatoons.length > 1) {
            notes.push(`Oversized: ${this.getTroopers()} troopers are fielded as ${subPlatoons.length} sub-platoons of ${subPlatoons.join(", ")} (TM p.146).`);
        }
        if (this.isPrimaryDamageCapped()) {
            notes.push(`${this._primary.name} counts as ${INFANTRY_MAX_PRIMARY_DAMAGE.toFixed(2)} damage per trooper and gives the platoon heavy burst (TM p.150).`);
        }
        if (this.isMoveOrFire()) notes.push("With 2 support weapons per squad, a foot platoon may move or fire in a turn, not both (TM p.151).");
        else if (this.carriesHeavySupportLoad() && this._motive.supportMPLoss > 0) notes.push("Carrying 2 support weapons per squad costs 1 MP (TM p.151).");
        if (this._secondary?.tag === INFANTRY_SUPPORT_PPC_TAG && this.getSecondaryCount() > 0) notes.push("The Support Particle Cannon holds the platoon to 2 MP (TM p.352).");
        if (this._armor) {
            notes.push(`${this._armor.name}: damage to the platoon is divided by ${this._armor.damageDivisor}, fractions rounded up (TO:AUE p.129). Advanced rules.`);
            if (this._armor.encumbering) notes.push("Encumbering armor: -1 MP (to a minimum of 1) and no Anti-'Mech Leg or Swarm attacks (TO:AUE p.130).");
            if (this._armor.vacuum) notes.push("The troopers may operate in vacuum (TO:AUE p.130).");
            for (const system of this._armor.stealth) {
                const stealth = INFANTRY_STEALTH_SYSTEMS[system];
                notes.push(`${stealth.name}: Camo to-hit modifier ${stealth.camoToHit} by MP moved (0/1/2/3/4+), IR to-hit modifier ${stealth.irToHit} at Short/Medium/Long for non-infantry attackers, ECM effect: ${stealth.ecm} (TO:AUE p.130).`);
            }
        }
        if (this.isAntiMechKitChosen() && !this.hasAntiMechKit() && !this.hasFieldGuns()) notes.push("The Anti-'Mech kits add no weight, cost or skill while the platoon's armor keeps it from Anti-'Mech attacks.");
        else if (this.canMakeAntiMechAttacks() && !this.hasAntiMechKit() && !this.hasFieldGuns()) notes.push("Without Anti-'Mech kits the platoon's Anti-'Mech Skill is fixed at 8 (TM p.155).");
        if (this.isMechanized()) notes.push("Mechanized infantry cannot make Anti-'Mech Leg or Swarm attacks (TM p.144).");
        if (this._fieldGun && this.getFieldGunCount() > 0) {
            notes.push(`${this.getFieldGunCount()} ${this._fieldGun.name} ${this.isFieldArtillery() ? "field artillery" : "field guns"}: ${this.isFieldArtillery() ? `needs ${Math.ceil(this._fieldGun.weight - 1e-9)} troopers` : `${this.getFieldGunCrew()} troopers a gun`}, ${format(this.getFieldGunWeight(), 1)} tons with ammunition added to the transport weight, Advanced rules (TO:AUE pp.122-123).`);
            if (this.isAntiMechKitChosen()) notes.push("The Anti-'Mech kits add no weight, cost or skill while the platoon has field guns, which keep it from Anti-'Mech attacks (TO:AUE p.123).");
        }
        const mount = this.getMount();
        const beastSize = this.getBeastSize();
        if (mount && beastSize) {
            notes.push(`${mount.name}: ${beastSize.name} creature (TO:AUE p.106). Attacks against the platoon take ${beastSize.toHit >= 0 ? "+" : ""}${beastSize.toHit} to-hit; damage is divided by the rider's divisor plus ${mount.damageDivisor}, fractions rounded up (p.191 sum of divisors; the text of p.108 reads "in the same fashion as infantry armor", ruled by NGCFells 2026-11-23 to use the sum). Advanced rules.`);
            if (this.getBonusDamageText()) notes.push(`${this.getBonusDamageText().replace(/^./, (letter) => letter.toUpperCase())}; it stacks with anti-'Mech damage (p.108).`);
            const antiMechNote = this.getBeastAntiMechNote();
            if (antiMechNote) notes.push(antiMechNote);
            if (beastSize.buildingMP > 0) notes.push(`Entering a building costs +${beastSize.buildingMP} MP and does ${beastSize.buildingCF} CF damage for each platoon entering or leaving and each hex inside (p.107).`);
            if (beastSize.supportWeapons === 0) notes.push("A Large creature carries no support weapons (p.107).");
            else notes.push(`Up to ${beastSize.supportWeapons} support weapons per creature with no MP loss, each crew halved and rounded up (p.107).`);
            if (mount.moveType === "Submarine") notes.push(`Submarine creatures need SCUBA gear on their riders (p.106); ${mount.name === "Orca" ? "Orcas must surface once every 180 turns" : "Hipposaurs must surface once every 2 turns"} to breathe.`);
            if (mount.moveType === "VTOL") notes.push("VTOL creatures may not operate on the High Altitude Map and spend 1 MP every turn, even when stationary (p.106).");
            notes.push(`Transport weight is the creatures plus 0.2 t for each trooper; it breaks down no lower than one creature and its riders (p.107).`);
        }
        notes.push(...this.getSpecialtyNotes());
        notes.push(...this._augmentationNotes());
        if (!this.usesFormationSizes()) notes.push(`Custom arrangement: ${this._formation.name} ${this.getMotive().name.toLowerCase()} platoons are ${this.getFormationSizes().join(" troopers in each of ")} squads (TM p.147).`);
        return notes;
    }

    /** What the specialties, the VTOL and SCUBA motives and XCT change, in the book's terms (TO:AUE pp.135-136, 152-153, 162-163). */
    public getSpecialtyNotes(): string[] {
        const notes: string[] = [];
        const motive = this.getMotive();
        if (this.isSpecialized()) {
            notes.push(`Specialized infantry: Veteran or better only, the most restrictive limits of the motive and every specialty (squads of ${this.getMaxSquadSize()}, platoons of ${this.getMaxPlatoonSize()} troopers and ${this.getMaxSquads()} squads, ${this.getSecondarySlotsPerSquad()} secondary weapons a squad), Advanced rules (TO:AUE p.152).`);
        }
        if (motive.vtol) {
            notes.push(`${motive.tag === "microlite" ? "Microlite" : "Micro-copter"} VTOL infantry: ${motive.mp} VTOL MP (take-off, landing and terrain as VTOLs), and may walk ${motive.groundMP} MP as foot infantry; ${motive.tag === "microlite" ? "must enter at least 1 hex a turn to stay in flight, and may carry no support weapons" : "may hover in flight at 0 MP, and a platoon with any support weapon loses 1 VTOL MP"}; no Anti-'Mech attacks; never broken down below a squad (TO:AUE pp.135-136). Advanced rules.`);
        }
        if (this.isScuba()) {
            notes.push(motive.tag === "scuba-mech"
                ? "Mechanized SCUBA infantry use the rules for submarine vehicles (TO:AUE p.153)."
                : `${motive.name}: ${motive.groundMP} MP on land and ${motive.mp} MP in water as a submarine or UMU unit, down to depth 2; primary and secondary weapons have half their range underwater (rounded down) and no disposable weapons are used (TO:AUE p.153).`);
        }
        if (this.hasSpecialty("engineers")) {
            const tasks = this.getAvailableEngineerTasks();
            notes.push(`Combat Engineers: ${this._engineerTasks.length === 0 ? "every task is open; designate one before the scenario" : `trained for ${tasks.map((task) => task.name).join(", ")}; designate one before the scenario`} (TO:AUE p.152).`);
        }
        if (this.hasSpecialty("marines")) notes.push("Marines suffer no combat penalties in vacuum, zero-G or boarding actions, fighting as foot infantry in normal conditions (TO:AUE p.153).");
        if (this.hasSpecialty("mountain")) notes.push("Mountain Troops are immune to Thin atmospheres (not vacuum) and climb 3 levels a hex instead of 1 (TO:AUE p.153).");
        if (this.hasSpecialty("paratroops")) notes.push("Paratroops may make combat drops from aerospace units in the atmosphere (not vacuum): 2D6 for each squad on landing, 3 or less is 1 casualty and the squad scatters (TO:AUE p.153).");
        if (this.getParamedicCount() > 0) notes.push(`${this.getParamedicCount()} paramedics (${this._paramedicsPerSquad} a squad) replace secondary weapon troopers, carry no weapons and deal no damage; moving next to or into a hex of wounded, they tend up to ${INFANTRY_WOUNDED_PER_PARAMEDIC} each from the next turn (TO:AUE p.153). They do not slow the platoon.`);
        if (this.getTagTrooperCount() > 0) notes.push(`${this.getTagTrooperCount()} TAG troopers (${this._tagPerSquad} a squad) replace secondary weapon troopers and make TAG attacks at ${INFANTRY_TAG_RANGES} hexes (TW p.142) besides the platoon's weapon attacks; TAG only works with at least 2 troopers a squad${this.isTagWorking() ? "" : ", which this platoon does not have, so its TAG does not work"} (TO:AUE p.153). They do not slow the platoon.`);
        const xct = this.getXCTEnvironment();
        if (xct) notes.push(`XCT troops (${xct.name}): ${xct.effect} Troops outfitted for one environment may not be deployed in another hazardous one (TO:AUE p.163). Advanced rules.`);
        return notes;
    }

    /** One line for the record sheet: the specialties, what to mark in play (the engineer task and turns), the medics, the TAG troopers and XCT. */
    public getSpecialtySheetText(inPlay: boolean = false): string {
        const parts: string[] = [];
        const names = [...this.getSpecialties().filter((tag) => tag !== "paramedics" && tag !== "tag").map((tag) => findInfantrySpecialty(tag)?.name ?? tag), ...(this.isScuba() ? [this.getMotive().name] : [])];
        if (names.length > 0) parts.push(names.join(", "));
        if (this.hasSpecialty("engineers")) {
            const progress = inPlay ? this.getEngineerProgress() : null;
            parts.push(progress ? `engineer task ${findInfantryEngineerTask(progress.task)?.name}, ${progress.turns} turns` : `engineer task ______, turns __${this._engineerTasks.length > 0 ? ` (${this.getAvailableEngineerTasks().map((task) => task.name).join(", ")})` : ""}`);
        }
        if (this.getParamedicCount() > 0) parts.push(`${inPlay ? this.getActiveParamedics() : this.getParamedicCount()} paramedics (5 wounded each)`);
        if (this.getTagTrooperCount() > 0) parts.push(`${this.getTagTrooperCount()} TAG troopers (${INFANTRY_TAG_RANGES}${this.isTagWorking() ? "" : ", not working"})`);
        if (this._xct) parts.push(`XCT: ${this.getXCTEnvironment()?.name}`);
        if (this._motive.vtol) parts.push(`${this._motive.mp} VTOL MP${this._motive.tag === "microlite" ? ", moves 1 hex a turn" : ""}`);
        return parts.join("; ");
    }

    // Play (Total Warfare pp.215-217)

    public getInPlay(): IInfantryInPlay { return this._inPlay; }
    public resetInPlay(): void { this._inPlay = { damage: [] }; this.ewarPlay = {}; }
    /**
     * The E-War gear of the platoon (#642): its armor kit when that carries ECM (a sneak suit with ECM), no uuid, location
     * "armor". A platoon has no equipment list and no per-item damage state, so destroyed is always false.
     */
    public getEWarGear(): IEWarGear[] {
        const kind = this._armor ? getEWarKind(this._armor.tag) : null;
        const gear: IEWarGear[] = this._armor && kind ? [{ kind, tag: this._armor.tag, name: this._armor.name, location: "armor", destroyed: false }] : [];
        // Maximum Tech p.40 field gear: the disposable Narc launcher and TAG are read as Narc and TAG by the missile rules.
        for (const entry of INFANTRY_FIELD_GEAR) {
            const fieldKind = this._fieldGear.includes(entry.tag) ? getEWarKind(entry.tag) : null;
            if (fieldKind) gear.push({ kind: fieldKind, tag: entry.tag, name: entry.name, location: "field gear", destroyed: false });
        }
        return gear;
    }

    /**
     * Damage points that eliminate one trooper. Against infantry and burst-fire attacks each mechanized trooper
     * takes twice the damage (TW p.217), so mechanized platoons are tracked in half-troopers.
     */
    public getDamagePointsPerTrooper(): number { return this.isMechanized() ? 2 : 1; }

    public getLineDamage(line: number): number {
        const troopers = this.getSubPlatoons()[line] ?? 0;
        return Math.min(Math.max(0, this._inPlay.damage[line] ?? 0), troopers * this.getDamagePointsPerTrooper());
    }
    public setLineDamage(line: number, points: number): void {
        const lines = this.getSubPlatoons();
        if (line < 0 || line >= lines.length) return;
        const damage = lines.map((_troopers, index) => this.getLineDamage(index));
        damage[line] = savedNumber(points, damage[line], 0, lines[line] * this.getDamagePointsPerTrooper());
        const before = this.getCurrentTroopers();
        this._inPlay.damage = damage;
        // The dead come off the stunned first (#645): a platoon that loses troopers loses that many stunned ones too.
        if (this._inPlay.stunned) {
            const lost = before - this.getCurrentTroopers();
            if (lost > 0) this._inPlay.stunned.troopers = Math.max(0, this._inPlay.stunned.troopers - lost);
            if (this._inPlay.stunned.troopers <= 0) delete this._inPlay.stunned;
        }
    }
    /** Troopers still active on a record sheet line. */
    public getLineTroopers(line: number): number {
        const troopers = this.getSubPlatoons()[line] ?? 0;
        return troopers - Math.floor(this.getLineDamage(line) / this.getDamagePointsPerTrooper());
    }
    public setLineTroopers(line: number, troopers: number): void {
        const full = this.getSubPlatoons()[line] ?? 0;
        this.setLineDamage(line, (full - savedNumber(troopers, full, 0, full)) * this.getDamagePointsPerTrooper());
    }
    /** Damage the line does on a successful attack with the troopers it has left. */
    public getLineAttackDamage(line: number): number { return this.getDamageForTroopers(this.getLineTroopers(line) - this._stunnedOnLine(line)); }

    // --- Stun and rout (#645): sonic projectors.

    /** Troopers stunned now; never more than the living, so the dead come off the stunned first. */
    public getStunnedTroopers(): number { return Math.min(this._inPlay.stunned?.troopers ?? 0, this.getCurrentTroopers()); }
    /** Troopers free to attack: the living less the stunned. */
    public getAttackTroopers(): number { return this.getCurrentTroopers() - this.getStunnedTroopers(); }
    /** The stunned are taken from the last line backward. */
    private _stunnedOnLine(line: number): number {
        let left = this.getStunnedTroopers();
        for (let later = this.getSubPlatoons().length - 1; later > line; later--) left -= Math.min(left, this.getLineTroopers(later));
        return Math.min(left, this.getLineTroopers(line));
    }
    /** An environment-sealed armor kit is immune to stun (a sealed kit lets the troopers work in vacuum). */
    public isStunImmune(): { immune: boolean; reason?: string } {
        return this._armor?.vacuum ? { immune: true, reason: "sealed armor kit" } : { immune: false };
    }
    /**
     * `troopers` (the band's dice, rolled by the players) are stunned in turn `turn` and return in the End Phase of the next turn.
     * Sonic needs Thin atmosphere or denser, and a standard armor kit halves its dice, rounding down.
     */
    public resolveStun(troopers: number, turn: number, options: { sonic?: boolean; atmosphere?: string }): string[] {
        const immune = this.isStunImmune();
        if (immune.immune) return [`Immune: ${immune.reason}`];
        let count = savedNumber(troopers, 0, 0, 1000);
        const log: string[] = [];
        if (options.sonic) {
            if (options.atmosphere === "trace" || options.atmosphere === "vacuum") return ["No effect: sonic needs Thin atmosphere or denser"];
            if (this._armor) {
                count = Math.floor(count / 2);
                log.push(`${this._armor.name} halves the sonic dice: ${count}`);
            }
        }
        const total = Math.min(this.getCurrentTroopers(), this.getStunnedTroopers() + count);
        this._inPlay.stunned = { troopers: total, returnTurn: turn + 1 };
        log.push(`${total} of ${this.getCurrentTroopers()} troopers stunned until the End Phase of turn ${turn + 1}`);
        return log;
    }
    /** The End Phase of `turn`: the stunned return when their turn comes, and a fall-back that has run its turn ends. */
    public endTurnStun(turn: number): void {
        if (this._inPlay.stunned && turn >= this._inPlay.stunned.returnTurn) delete this._inPlay.stunned;
        if (this._inPlay.fellBack && turn > this._inPlay.fellBack.untilTurn) delete this._inPlay.fellBack;
        this._endTurnFieldGuns();
    }
    /** The Morale Check after a stun (TO:AR pp.180-181): a failure means the platoon falls back next turn. */
    public setMoraleResult(passed: boolean, turn: number, fromName?: string): void {
        if (passed) { delete this._inPlay.fellBack; return; }
        this._inPlay.fellBack = { untilTurn: turn + 1, ...(fromName ? { fromName } : {}) };
    }
    public isFellBack(turn: number): boolean { return !!this._inPlay.fellBack && turn <= this._inPlay.fellBack.untilTurn; }
    public getCurrentTroopers(): number { return this.getSubPlatoons().reduce((sum, _troopers, line) => sum + this.getLineTroopers(line), 0); }
    public isLineDestroyed(line: number): boolean { return this.getLineTroopers(line) <= 0; }
    public isDestroyed(): boolean { return this.getCurrentTroopers() <= 0; }
    public isDamaged(): boolean { return this.getSubPlatoons().some((_troopers, line) => this.getLineDamage(line) > 0); }
    public getStrengthPercentage(): number {
        const troopers = this.getTroopers();
        return troopers > 0 ? Math.round(this.getCurrentTroopers() / troopers * 100) : 0;
    }

    /**
     * Applies one successful attack to a record sheet line and says what it did. A non-infantry weapon eliminates
     * troopers by the Non-Infantry Weapon Damage Against Infantry Table, fractions rounded up and doubled against
     * mechanized infantry; a burst-fire, infantry or heat-effect attack applies its damage point for point. Either
     * is doubled against a platoon in Clear terrain (TW pp.216-217). Modifiers apply in the order the books give
     * them (user ruling, 2026-10-07): Clear terrain (TW p.216), mechanized infantry (TW p.217), then infantry
     * armor's damage divisor (TO:AUE p.129).
     */
    /** Armor and mount names for the lines that say what divided the damage. */
    private _divisorSource(): string {
        return [this._armor?.name ?? "", ...this.getDivisorImplants().map((item) => item.name), this.getMount() ? `${this.getMount()!.name} mount` : ""].filter((part) => part).join(" and ");
    }
    public resolveAttack(line: number, kind: InfantryAttackKind, damage: number, clearTerrain: boolean = false): string[] {
        const lines = this.getSubPlatoons();
        const attack = INFANTRY_ATTACK_KINDS.find((item) => item.tag === kind);
        if (!attack || line < 0 || line >= lines.length) return [];
        let value = savedNumber(damage, 0, 0, INFANTRY_MAX_ATTACK_DAMAGE);
        const perTrooper = this.getDamagePointsPerTrooper();
        const log: string[] = [];
        // Pain-shunted troopers halve the damage of flame-based weapons (IO:AE p.72); the book gives no rounding, so it is rounded down as MegaMek does.
        if (kind === "heat" && this._has("aug-pain-shunt") && value > 0) {
            value = Math.floor(value / 2);
            log.push(`Artificial pain shunt: flame damage halved to ${value}`);
        }
        let points: number;
        if (attack.nonInfantryWeapon) {
            let troopers: number;
            if (kind === "cluster-ballistic") troopers = Math.ceil(value / 10) + 1;
            else if (kind === "pulse") troopers = Math.ceil(value / 10) + 2;
            else if (kind === "cluster-missile") troopers = Math.ceil(value / 5);
            else if (kind === "area-effect") troopers = value * 2;
            else troopers = Math.ceil(value / 10);
            if (value <= 0) troopers = 0;
            log.push(`${attack.name}, Damage Value ${value}: ${attack.formula} = ${troopers} ${troopers === 1 ? "trooper" : "troopers"} hit`);
            if (clearTerrain && troopers > 0) {
                troopers *= 2;
                log.push(`Clear terrain: doubled to ${troopers}`);
            }
            if (this.isMechanized() && troopers > 0) {
                troopers *= 2;
                log.push(`Mechanized infantry: doubled to ${troopers}`);
            }
            if (this.getDamageDivisor() !== 1 && troopers > 0) {
                troopers = Math.ceil(troopers / this.getDamageDivisor() - 1e-9);
                log.push(`${this._divisorSource()}, damage divisor ${this.getDamageDivisor()}: ${troopers}`);
            }
            points = troopers * perTrooper;
        } else {
            points = value;
            log.push(`${attack.name}: ${value} damage`);
            if (clearTerrain && points > 0) {
                points *= 2;
                log.push(`Clear terrain: doubled to ${points}`);
            }
            if (this.isMechanized() && value > 0) log.push("Mechanized infantry: each trooper takes 2 points to eliminate");
            if (this.getDamageDivisor() !== 1 && points > 0) {
                points = Math.ceil(points / this.getDamageDivisor() - 1e-9);
                log.push(`${this._divisorSource()}, damage divisor ${this.getDamageDivisor()}: ${points}`);
            }
        }
        const before = this.getLineTroopers(line);
        this.setLineDamage(line, this.getLineDamage(line) + points);
        const after = this.getLineTroopers(line);
        log.push(`${before - after} ${before - after === 1 ? "trooper" : "troopers"} eliminated: ${after} of ${lines[line]} remain`);
        if (after <= 0) log.push(lines.length > 1 ? `Sub-platoon ${line + 1} is destroyed` : "The platoon is destroyed");
        return log;
    }

    // Specialized infantry in play (TO:AUE pp.152-153). The dice are rolled by the players; these keep the counters and judge the rolls.

    private _engineerPlay(): NonNullable<IInfantryInPlay["engineers"]> | null {
        const tasks = this.getAvailableEngineerTasks();
        if (tasks.length === 0) return null;
        const saved = this._inPlay.engineers;
        if (saved && tasks.some((task) => task.tag === saved.task)) return saved;
        return (this._inPlay.engineers = { task: tasks[0].tag, turns: 0, extraTurns: 0, bridgeUnits: 0, sensors: 0, fireTurns: 0 });
    }
    /** The task the engineers designated for the scenario; null for a platoon that is not Combat Engineers. */
    public getEngineerTask(): InfantryEngineerTask | null { return this._engineerPlay()?.task ?? null; }
    /** Designates the task (before the scenario, p.152); work done on another task starts over, bridge units and Remote Sensors spent stay spent. */
    public setEngineerTask(tag: string): boolean {
        const play = this._engineerPlay();
        const task = this.getAvailableEngineerTasks().find((item) => item.tag === tag);
        if (!play || !task) return false;
        if (play.task !== task.tag) { play.task = task.tag; play.turns = 0; play.extraTurns = 0; play.fireTurns = 0; }
        return true;
    }
    public getEngineerProgress(): { task: InfantryEngineerTask; turns: number; needed: number | null; bridgeUnits: number; sensors: number; sensorsMax: number; fireTurns: number } | null {
        const play = this._engineerPlay();
        if (!play) return null;
        const base = play.task === "bridge" ? 6 : play.task === "trench" ? 3 : play.task === "demolition" ? 6 : null;
        return { task: play.task, turns: play.turns, needed: base === null ? null : base + (play.task === "demolition" ? 0 : play.extraTurns), bridgeUnits: play.bridgeUnits, sensors: play.sensors, sensorsMax: this.getSquads() * 2, fireTurns: play.fireTurns };
    }
    /**
     * One turn of work on a bridge (6 turns), a fortified hex (3) or demolition charges (up to 6 turns): the platoon does nothing else, and
     * damage in a turn adds a turn to a bridge or a fortified hex (p.152). Says what stands.
     */
    public workEngineers(damaged: boolean = false): string[] {
        const play = this._engineerPlay();
        if (!play) return ["The platoon is not Combat Engineers"];
        if (this.isDestroyed()) return ["The platoon is destroyed: unfinished work is lost"];
        if (play.task !== "bridge" && play.task !== "trench" && play.task !== "demolition") return ["This task takes no turns of work: use its own control"];
        if (play.task === "bridge" && play.bridgeUnits >= 2) return ["Both bridge units of the scenario are spent (2 Light Bridges or 1 Medium Bridge)"];
        if (play.task === "demolition") {
            play.turns = Math.min(6, play.turns + 1);
            return [`Charges set for ${play.turns} ${play.turns === 1 ? "turn" : "turns"} (6 at most): ${this.getDemolitionDamage()} damage to the structure when detonated, announced in an End Phase`];
        }
        play.turns += 1;
        if (damaged) play.extraTurns += 1;
        const needed = (play.task === "bridge" ? 6 : 3) + play.extraTurns;
        const lines = [`${play.task === "bridge" ? "Bridge" : "Fortified hex"}: turn ${Math.min(play.turns, needed)} of ${needed}${damaged ? " (damage this turn added a turn)" : ""}`];
        if (play.turns >= needed) {
            if (play.task === "trench") {
                lines.push("The fortified hex is dug: +2 to attacks (not flamers or area-effect) against infantry that dig in; it is not Clear terrain for damage against infantry");
                play.turns = 0;
                play.extraTurns = 0;
            } else {
                lines.push("The bridge is ready to raise: complete it as a Light or a Medium Bridge");
            }
        }
        return lines;
    }
    /** Finishes the bridge worked on: a Light Bridge (CF 15) takes 1 of the 2 bridge units, a Medium Bridge (CF 40) both; double the CF over water. */
    public completeBridge(kind: "light" | "medium", overWater: boolean = false): string[] {
        const play = this._engineerPlay();
        if (!play || play.task !== "bridge") return ["The platoon has not designated bridge-building"];
        if (play.turns < 6 + play.extraTurns) return [`The bridge needs ${6 + play.extraTurns} turns of work; ${play.turns} done`];
        const units = kind === "light" ? 1 : 2;
        if (play.bridgeUnits + units > 2) return [`A ${kind} bridge needs ${units} of the 2 bridge units; ${2 - play.bridgeUnits} left`];
        play.bridgeUnits += units;
        play.turns = 0;
        play.extraTurns = 0;
        return [`A ${kind} bridge is raised in one hex: CF ${(kind === "light" ? 15 : 40) * (overWater ? 2 : 1)}${overWater ? " (doubled over water)" : ""}; ${2 - play.bridgeUnits} of 2 bridge units left`];
    }
    /** Damage of the charges set: the turns (6 at most) times the damage of an SRM platoon of the same numbers (p.152). */
    public getDemolitionDamage(): number {
        const play = this._inPlay.engineers;
        if (!play || play.task !== "demolition") return 0;
        const perTurn = roundNormally((findInfantryWeapon("inf-srm-launcher-standard-two-shot")?.damage ?? 0) * this.getCurrentTroopers());
        return play.turns * perTurn;
    }
    public detonateCharges(): string[] {
        const play = this._engineerPlay();
        if (!play || play.task !== "demolition" || play.turns === 0) return ["No charges are set"];
        const damage = this.getDemolitionDamage();
        play.turns = 0;
        return [`Charges detonated in this End Phase: ${damage} damage to the hex of the structure they were set in, and none directly to units there (collapse damage follows TW pp.176-177)`];
    }
    /**
     * A firefighting attempt (it hits): 2D6 of 8+, -2 to the roll if an Inferno or a fuel-fed flamer started the fire, the target 1 lower for
     * each turn in a row on the same fire (to 3) and 1 lower for each other platoon fighting it (p.152).
     */
    public resolveFirefight(roll: number, options: { inferno?: boolean; extraPlatoons?: number } = {}): string[] {
        const play = this._engineerPlay();
        if (!play || play.task !== "firefighting") return ["The platoon has not designated firefighting"];
        const target = Math.max(3, 8 - play.fireTurns - savedNumber(options.extraPlatoons, 0, 0, 20));
        const result = savedNumber(roll, 0, 0, 20) - (options.inferno ? 2 : 0);
        if (result >= target) {
            play.fireTurns = 0;
            return [`Rolled ${roll}${options.inferno ? " -2 (Inferno or fuel-fed flamer)" : ""} = ${result} against ${target}+: the fire is out`];
        }
        play.fireTurns += 1;
        return [`Rolled ${roll}${options.inferno ? " -2 (Inferno or fuel-fed flamer)" : ""} = ${result} against ${target}+: the fire burns on; the target is ${Math.max(3, 8 - play.fireTurns - savedNumber(options.extraPlatoons, 0, 0, 20))}+ next turn if the platoon keeps at it`];
    }
    /** Disabling mines: 2D6 for each minefield type, 9+ clears, 3 or less detonates (p.152). */
    public resolveMinesweeping(roll: number): string[] {
        if (this.getEngineerTask() !== "minesweeping") return ["The platoon has not designated minesweeping"];
        const value = savedNumber(roll, 0, 0, 20);
        return [value >= 9 ? `Rolled ${value}: the minefield is cleared` : value <= 3 ? `Rolled ${value}: the minefield detonates` : `Rolled ${value}: the minesweepers fail and the minefield stays active`];
    }
    /** Sets one Remote Sensor (1 MP; the platoon may still attack), up to 2 a squad (p.152). */
    public deploySensor(): string[] {
        const play = this._engineerPlay();
        if (!play || play.task !== "sensor") return ["The platoon has not designated sensor work"];
        const most = this.getSquads() * 2;
        if (play.sensors >= most) return [`All ${most} Remote Sensors are set`];
        play.sensors += 1;
        return [`Remote Sensor ${play.sensors} of ${most} set in this hex for 1 MP; it works as a Remote Sensor (TO:AUE p.187)`];
    }

    /** Paramedics still on their feet: the medics are spread through the platoon, so they fall with it. */
    public getActiveParamedics(): number {
        const total = this.getTroopers();
        return total > 0 ? Math.min(this.getParamedicCount(), Math.ceil(this.getParamedicCount() * this.getCurrentTroopers() / total - 1e-9)) : 0;
    }
    /** Wounded the paramedics may tend: 5 each (p.153). */
    public getParamedicCapacity(): number { return this.getActiveParamedics() * INFANTRY_WOUNDED_PER_PARAMEDIC; }
    public tendWounded(wounded: number): string[] {
        if (this.getParamedicCount() === 0) return ["The platoon has no paramedics"];
        const capacity = this.getParamedicCapacity();
        const tended = Math.min(capacity, savedNumber(wounded, 0, 0, 100000));
        return [`${this.getActiveParamedics()} paramedics move next to or into the hex and tend ${tended} of ${wounded} wounded (up to ${capacity}), starting next turn (TO:AUE p.153)`];
    }
    /** A combat drop (p.153): 2D6 for each squad; 3 or less is 1 casualty, and the squad scatters. `rolls` are the squads' rolls, in order. */
    public resolveParatroopDrop(rolls: number[]): string[] {
        if (!this.hasSpecialty("paratroops")) return ["The platoon is not Paratroops"];
        const lines: string[] = [];
        rolls.slice(0, this.getSquads()).forEach((roll, index) => {
            const value = savedNumber(roll, 7, 0, 20);
            if (value > 3) { lines.push(`Squad ${index + 1} rolled ${value}: lands safely`); return; }
            const line = this.getSubPlatoons().findIndex((_troopers, at) => this.getLineTroopers(at) > 0);
            if (line >= 0) this.setLineDamage(line, this.getLineDamage(line) + this.getDamagePointsPerTrooper());
            lines.push(`Squad ${index + 1} rolled ${value}: 1 casualty, and the squad scatters like scattered battle armor`);
        });
        lines.push(`${this.getCurrentTroopers()} of ${this.getTroopers()} troopers on the ground`);
        return lines;
    }
    /** A TAG attack at 3/6/9 hexes, besides the platoon's weapon attacks (TW p.142); it works with at least 2 TAG troopers a squad (p.153). */
    public fireTag(): string[] {
        if (this.getTagTrooperCount() === 0) return ["The platoon has no TAG troops"];
        if (!this.isTagWorking()) return [`TAG only works with at least 2 troopers a squad assigned: this platoon has ${this._tagPerSquad}`];
        return [`TAG attack at ${INFANTRY_TAG_RANGES} hexes (short/medium/long), in addition to the platoon's weapon attacks; the TAG does not set the platoon's range`];
    }

    // Saving

    public export(noInPlayVariables: boolean = false): IInfantryPlatoonExport {
        const stunState = this._inPlay.stunned && this.getStunnedTroopers() > 0 ? { stunned: { ...this._inPlay.stunned } } : {};
        const fellBackState = this._inPlay.fellBack ? { fellBack: { ...this._inPlay.fellBack } } : {};
        const gunState = this._inPlay.fieldGuns && this._fieldGun ? { fieldGuns: { ...this._inPlay.fieldGuns, ...(this._inPlay.fieldGuns.shots ? { shots: [...this._inPlay.fieldGuns.shots] } : {}) } } : {};
        const engineerState = this._inPlay.engineers && this.hasSpecialty("engineers") ? { engineers: { ...this._inPlay.engineers } } : {};
        const hasPlay = this.isDamaged() || "stunned" in stunState || "fellBack" in fellBackState || "fieldGuns" in gunState || "engineers" in engineerState;
        const inPlay = noInPlayVariables || !hasPlay ? undefined : { damage: this.getSubPlatoons().map((_troopers, line) => this.getLineDamage(line)), ...stunState, ...fellBackState, ...gunState, ...engineerState };
        return {
            ...(inPlay ? { inPlay } : {}),
            ...(!noInPlayVariables && Object.keys(this.ewarPlay).length ? { ewarPlay: JSON.parse(JSON.stringify(this.ewarPlay)) as IEWarPlayState } : {}),
            uuid: this._uuid,
            tro: this.tro.export(),
            lastUpdated: this.lastUpdated.toISOString(),
            name: this._name,
            ...(this._rulesEdition !== DEFAULT_RULES_EDITION ? { rulesEdition: this._rulesEdition } : {}),
            ...this.gameSettings.export(),
            techBase: this._techBase,
            ...(this._mixedTech ? { mixedTech: true } : {}),
            formation: this._formation.tag,
            era: this._era.tag,
            motive: this._motive.tag,
            ...(this.getMount() ? { mount: this.getMount()!.tag } : {}),
            squadSize: this._squadSize,
            squads: this._squads,
            primaryWeapon: this._primary.tag,
            secondaryWeapon: this._secondary ? this._secondary.tag : "",
            secondaryPerSquad: this.getSecondaryPerSquad(),
            ...(this._armor ? { armor: this._armor.tag } : {}),
            antiMechKit: this._antiMechKit,
            ...(this._fieldGear.length > 0 ? { fieldGear: [...this._fieldGear] } : {}),
            ...(this._fieldGun && this._fieldGunCount > 0 ? { fieldGuns: { weapon: this._fieldGun.tag, count: this._fieldGunCount, ammo: this._fieldGunAmmo.map((ammo) => ammo.tag) } } : {}),
            ...(this._specialties.length > 0 ? { specialties: [...this._specialties] } : {}),
            ...(this._engineerTasks.length > 0 ? { engineerTasks: [...this._engineerTasks] } : {}),
            ...(this._paramedicsPerSquad > 0 ? { paramedics: this._paramedicsPerSquad } : {}),
            ...(this._tagPerSquad > 0 ? { tagTroopers: this._tagPerSquad } : {}),
            ...(this._xct ? { xct: this._xct } : {}),
            ...(this._augmentations.length > 0 ? { augmentation: { implants: this.getAugmentations().map((item) => item.tag), ...(this._limbs.length > 0 ? { limbs: this._limbs.map((limb) => ({ ...limb })) } : {}), ...(this._extraneous.length > 0 ? { extraneous: [...this._extraneous] } : {}) } } : {}),
            gunnery: this._gunnery,
            antiMech: this._antiMech,
        };
    }

    public exportJSON(): string { return JSON.stringify(this.export()); }

    /** Reads a saved platoon one field at a time; anything unusable falls back to a default and is reported. */
    public importJSON(json: string): boolean {
        this._importIssues = [];
        let raw: unknown;
        try {
            raw = JSON.parse(json);
        } catch {
            this._importIssues.push("The saved platoon could not be read");
            return false;
        }
        if (!isPlainObject(raw)) {
            this._importIssues.push("The saved platoon could not be read");
            return false;
        }

        const uuid = savedString(raw.uuid);
        if (/^[0-9a-zA-Z-]{8,64}$/.test(uuid)) this._uuid = uuid;
        this.tro.import(raw.tro);
        const updated = new Date(savedString(raw.lastUpdated));
        if (!Number.isNaN(updated.getTime())) this.lastUpdated = updated;
        this.setName(savedString(raw.name));
        this._rulesEdition = getSelectableRulesEditionTag(raw.rulesEdition, "infantry");
        this.gameSettings.import(raw);

        this._techBase = raw.techBase === "clan" ? "clan" : "is";
        this._mixedTech = raw.mixedTech === true;
        const formation = INFANTRY_FORMATIONS.find((item) => item.tag === raw.formation && item.techBase === this._techBase);
        if (!formation && raw.formation !== undefined) this._importIssues.push(`Unknown formation '${savedString(raw.formation).slice(0, 60)}': using ${this.getAvailableFormations()[0].name}`);
        this._formation = formation ?? this.getAvailableFormations()[0];
        this._era = latestEra(this._techBase);
        if (raw.era !== undefined && !this.setEra(savedString(raw.era))) this._importIssues.push(`Unknown era '${savedString(raw.era).slice(0, 60)}': using ${this._era.name}`);
        const motive = INFANTRY_MOTIVE_TYPES.find((item) => item.tag === raw.motive);
        if (!motive && raw.motive !== undefined) this._importIssues.push(`Unknown motive type '${savedString(raw.motive).slice(0, 60)}': using Foot`);
        this._motive = motive ?? INFANTRY_MOTIVE_TYPES[0];
        // The creature of a beast-mounted platoon; a save from before beasts has none, and a stray one on any other platoon is dropped.
        this._mount = null;
        if (this._motive.tag === "beast") {
            const savedMount = savedString(raw.mount);
            this._mount = findInfantryBeastMount(savedMount) ?? null;
            if (!this._mount) {
                this._mount = findInfantryBeastMount("horse") ?? null;
                this._importIssues.push(savedMount ? `Unknown creature '${savedMount.slice(0, 60)}': using Horse` : "A beast-mounted platoon with no creature: using Horse");
            }
        }

        // Specialized infantry and XCT troops (TO:AUE pp.152, 162): read before the squads, whose size they limit. A save from before them has none.
        this._specialties = [];
        this._engineerTasks = [];
        this._paramedicsPerSquad = 0;
        this._tagPerSquad = 0;
        this._xct = null;
        if (Array.isArray(raw.specialties)) {
            for (const saved of raw.specialties) {
                const tag = savedString(saved);
                const kind = INFANTRY_SPECIALTIES.find((item) => item.tag === tag && tag !== "paramedics" && tag !== "tag");
                if (!kind) this._importIssues.push(`Unknown specialty '${tag.slice(0, 60)}': removed`);
                else if (!this.setSpecialty(kind.tag, true)) this._importIssues.push(`${kind.name} cannot go on this platoon: removed`);
            }
        }
        if (Array.isArray(raw.engineerTasks)) {
            const tasks = raw.engineerTasks.map((task) => savedString(task)).filter((task) => findInfantryEngineerTask(task));
            if (tasks.length < raw.engineerTasks.length) this._importIssues.push("Some saved engineer tasks are not on the list: removed");
            if (tasks.length > 0 && !this.setEngineerTasks(tasks)) this._importIssues.push("Engineer tasks need the Combat Engineers specialty: removed");
        }
        if (raw.xct !== undefined && !this.setXCT(savedString(raw.xct))) this._importIssues.push(`Unknown XCT environment '${savedString(raw.xct).slice(0, 60)}': removed`);

        // The implants load before the weapons: they decide how many secondary weapons a squad may carry (IO:AE pp.74-75).
        this._importAugmentation(raw.augmentation);
        const [formationSquadSize, formationSquads] = this.getFormationSizes();
        this._squadSize = savedNumber(raw.squadSize, formationSquadSize, 1, this.getMaxSquadSize());
        this._squads = savedNumber(raw.squads, formationSquads, 1, INFANTRY_MAX_SQUADS);
        if (typeof raw.squadSize === "number" && raw.squadSize !== this._squadSize) this._importIssues.push(`Squad size set to ${this._squadSize}`);
        if (typeof raw.squads === "number" && raw.squads !== this._squads) this._importIssues.push(`Squads set to ${this._squads}`);
        // Paramedics and TAG troopers take secondary weapon slots, so they are set before the weapons.
        const medics = savedNumber(raw.paramedics, 0, 0, 99);
        const tagTroopers = savedNumber(raw.tagTroopers, 0, 0, 99);
        if (tagTroopers > 0 && !this.setTagTroopersPerSquad(tagTroopers)) this._importIssues.push(`TAG troopers a squad set to ${this._tagPerSquad}`);
        if (medics > 0 && !this.setParamedicsPerSquad(medics)) this._importIssues.push(`Paramedics a squad set to ${this._paramedicsPerSquad}`);

        this._primary = findInfantryWeapon(DEFAULT_PRIMARY) ?? infantryWeapons[0];
        this._secondary = null;
        this._secondaryPerSquad = 0;
        const primaryTag = savedString(raw.primaryWeapon);
        if (primaryTag && !this.setPrimaryWeapon(primaryTag)) {
            this._clampWeapons();
            this._importIssues.push(`Primary weapon '${primaryTag.slice(0, 60)}' cannot be carried: using ${this._primary.name}`);
        } else {
            this._clampWeapons();
        }
        const secondaryTag = savedString(raw.secondaryWeapon);
        const perSquad = savedNumber(raw.secondaryPerSquad, 0, 0, INFANTRY_MAX_SECONDARY_PER_SQUAD_AUGMENTED);
        if (secondaryTag && perSquad > 0) {
            if (this.setSecondaryWeapon(secondaryTag)) {
                this.setSecondaryPerSquad(perSquad);
                if (this._secondaryPerSquad !== perSquad) this._importIssues.push(`Secondary weapons per squad set to ${this._secondaryPerSquad}`);
            } else {
                this._importIssues.push(`Secondary weapon '${secondaryTag.slice(0, 60)}' cannot be carried: removed`);
            }
        }

        this._armor = null;
        const armorTag = savedString(raw.armor);
        if (armorTag && !this.setArmor(armorTag)) this._importIssues.push(`Infantry armor '${armorTag.slice(0, 60)}' cannot be worn: removed`);

        this._antiMechKit = raw.antiMechKit === true && !this.isMechanized();
        this._fieldGear = [];
        if (Array.isArray(raw.fieldGear)) {
            const wanted = raw.fieldGear.filter((tag): tag is string => typeof tag === "string");
            const usable = wanted.filter((tag) => this.getFieldGearOptions().some((option) => option.tag === tag && option.available));
            if (usable.length < wanted.length) this._importIssues.push("Some saved field gear cannot be carried: removed");
            this.setFieldGear(usable);
        }
        this._importFieldGuns(raw.fieldGuns);
        this._gunnery = savedNumber(raw.gunnery, 4, 0, 8);
        this._antiMech = savedNumber(raw.antiMech, 5, 0, 8);

        this._inPlay = { damage: [] };
        this.ewarPlay = normalizeEWarPlay(raw.ewarPlay);
        if (isPlainObject(raw.inPlay) && Array.isArray(raw.inPlay.damage)) {
            const saved = raw.inPlay.damage;
            const stun = raw.inPlay.stunned;
            if (isPlainObject(stun) && Number(stun.troopers) > 0) this._inPlay.stunned = { troopers: savedNumber(stun.troopers, 0, 0, 1000), returnTurn: savedNumber(stun.returnTurn, 1, 0, 100000) };
            const back = raw.inPlay.fellBack;
            if (isPlainObject(back)) this._inPlay.fellBack = { untilTurn: savedNumber(back.untilTurn, 0, 0, 100000), ...(typeof back.fromName === "string" ? { fromName: back.fromName } : {}) };
            this.getSubPlatoons().forEach((_troopers, line) => this.setLineDamage(line, savedNumber(saved[line], 0, 0, INFANTRY_MAX_ATTACK_DAMAGE)));
            const engineers = raw.inPlay.engineers;
            if (isPlainObject(engineers) && this.getAvailableEngineerTasks().some((task) => task.tag === engineers.task)) {
                this._inPlay.engineers = {
                    task: engineers.task as InfantryEngineerTask,
                    turns: savedNumber(engineers.turns, 0, 0, 100), extraTurns: savedNumber(engineers.extraTurns, 0, 0, 100),
                    bridgeUnits: savedNumber(engineers.bridgeUnits, 0, 0, 2), sensors: savedNumber(engineers.sensors, 0, 0, this.getSquads() * 2), fireTurns: savedNumber(engineers.fireTurns, 0, 0, 100),
                };
            }
            const guns = raw.inPlay.fieldGuns;
            if (isPlainObject(guns) && this._fieldGun) {
                const gun = this._fieldGun;
                const shots = Array.isArray(guns.shots) && guns.shots.length === this._fieldGunAmmo.length && guns.shots.every((value) => typeof value === "number")
                    ? guns.shots.map((value, ton) => savedNumber(value, 0, 0, Math.floor(getFieldGunShotsPerTon(gun, this._fieldGunAmmo[ton])))) : undefined;
                this._inPlay.fieldGuns = { facing: savedNumber(guns.facing, 0, 0, FIELD_GUN_FACINGS - 1), ...(shots ? { shots } : {}), ...(guns.moved === true ? { moved: true } : {}), ...(guns.usedInfantryWeapons === true ? { usedInfantryWeapons: true } : {}) };
            }
        }
        return true;
    }

    /** Reads the saved field guns; what cannot be carried is reported and left off, but a count over the crew is kept so the platoon shows the issue. */
    private _importFieldGuns(saved: unknown): void {
        this._fieldGun = null;
        this._fieldGunCount = 0;
        this._fieldGunAmmo = [];
        if (!isPlainObject(saved)) return;
        const tag = savedString(saved.weapon);
        const weapon = findFieldGunRecord(tag, this._fieldGunBases());
        if (!weapon) {
            this._importIssues.push(`Field gun '${tag.slice(0, 60)}' is not a field gun or field artillery this platoon may carry: removed`);
            return;
        }
        this._fieldGun = weapon;
        const wanted = savedNumber(saved.count, 1, 1, 100);
        this._fieldGunCount = getFieldGunKind(weapon) === "artillery" ? 1 : wanted;
        if (this._fieldGunCount !== wanted) this._importIssues.push(`Field artillery is one piece: ${wanted} set to 1`);
        const ammo = Array.isArray(saved.ammo) ? saved.ammo.filter((item): item is string => typeof item === "string").slice(0, this._fieldGunCount) : [];
        for (const ammoTag of ammo) {
            const found = findFieldGunAmmo(ammoTag, weapon, this._fieldGunBases());
            if (found) this._fieldGunAmmo.push(found);
            else this._importIssues.push(`Field gun ammunition '${ammoTag.slice(0, 60)}' cannot be fired by ${weapon.name}: left off`);
        }
    }
}
