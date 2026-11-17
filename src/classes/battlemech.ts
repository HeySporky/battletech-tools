import { FUTURE_WARS_CONSTRUCTION_RULESETS, FUTURE_WARS_EXTRA_SLOT_TONS, FUTURE_WARS_SENSOR_SLOTS, IFutureWarsCockpit, getFutureWarsCockpit, getFutureWarsEngineSlots, getFutureWarsGyroSlots, getFutureWarsSlots, getFutureWarsWeightClass } from "../data/future-wars-construction";
import { findSpecialRuleset } from "../data/special-rulesets";
import { CalcTrace, ICalcBreakdown, ICalcCitation, ICalcStep, formatCalcNumber, renderCalcStepsHtml, renderCalcStepsTable } from "../data/calc-steps";
import { MECH_COST_STEPS, getMechCostStep } from "../data/calc-steps-mech-cost";
import { NO_BATTLE_VALUE_STEPS, getMechBv1Steps } from "../data/calc-steps-mech-bv1";
import { MECH_BV2_STEPS, MECH_BV2_WEAPON_CITES } from "../data/calc-steps-mech-bv2";
import { AlphaStrikeStructureColumn, getAlphaStrikeMechStructure } from "../data/alpha-strike-mech-structure";
import { findUnitCatalogRecord, getUnitCatalogRecords } from "../data/equipment-lookup";
import { IAssignedQuirk, IQuirkTargets, QuirkUnitType } from "../data/quirk-interfaces";
import { getQuirk, getQuirkIssues, getQuirkTargets } from "../data/quirk-registry";
import { findCanonEntry, resolveCanonQuirks } from "../data/quirk-canon";
import { ICanonQuirkEntry } from "../data/quirk-canon-interfaces";
import { QuirkList } from "./quirk-list";
import { TechnicalReadout } from "./technical-readout";
import { getBattleMechTroAdapter } from "./battlemech-tro";
import { isSSWNoMake, readSSWTechnicalReadout } from "../utils/ssw-technical-readout";
import { ITechnicalReadoutExport } from "../data/technical-readout-interfaces";
import { getAlphaStrikeQuirks, getQuirkHeatGenerated, getQuirkWeaponHeat } from "../utils/quirk-effects";
import { BattleValueC3Type, IBattleValueC3Part, IBattleValueTagShare, getBattleValueC3Part, getBattleValueC3Type, getBattleValueEdition, getBattleValueFor, getBattleValueRules, getBattleValueSkillEdition, getBattleValueTagShare, getSkillMultiplier, getSpeedFactor, getBattleValue1Ammo, editionHasBattleValue, rateBattleValue1, isBattleValue1Defensive } from "../data/battle-value";
import { battlemechLocations } from "../data/battlemech-locations";
import { IArmorType, ICockpitType, ICriticalLocations, IEngineOption, IEngineType, IEquipmentItem, IGyro, IHeatSync, IInternalStructure, IInternalStructurePerTon, IJumpJet, IMechType, IMyomerType, IResolvedInternalStructure, ISplitLocation, ITechDates } from "../data/data-interfaces";
import { btEraOptions, findEraByTag, getClosestEraForTech, getEraForYear, getErasForTech } from "../data/era-options";
import { mechArmorTypes } from "../data/mech-armor-types";
import { findAllByName, findByTag, matchesTag } from "../data/tag-match";
import { AmmoExplosionProtection, getAmmoExplosion, getAmmoExplosionRules } from "../data/ammo-explosion";
import { ComponentRecord, getComponentRecords, getComponentTiers, isCustomComponent } from "../data/custom-component-registry";
import type { CustomComponentKind, ISSWUnresolvedItem } from "../data/custom-content-types";
import { getCockpitType } from "../data/mech-cockpit-types";
import {
    getRoboticControlCost, getRoboticControlSystem, getRoboticControlSystemsFor, getRoboticControlWeight, getRoboticSkills,
    IRoboticControlSystem, RoboticControlTag, RoboticUnitType, SRCS_BATTLE_VALUE_MULTIPLIER, SRCS_RULES_LEVEL,
} from "../data/robotic-control-systems";
import { btMechTonnages } from "../data/mech-tonnages";
import { DEFAULT_RULES_EDITION, editionEngineHoldsHeatSinks, getEditionJumpJetWeight, getEditionPlayRules, getEditionStats, getEditionStructure, getEquipmentForEdition, getRulesEdition, isEarlierRulesEdition, isInRulesEdition, isOfferedInEdition, getRecordOfferIssue } from "../data/rules-editions";
import { APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL, EXPERIMENTAL_RULES_LEVEL, STANDARD_RULES_LEVEL, getItemBattleValue, getLauncherBattleValueWithoutFireControl, equipmentMatchesIdentifier, getWeaponAmmoFamilies, getEquipmentRulesLevel, ARTEMIS_FIRE_CONTROL, isArtemisCapableLauncher, isEquipmentOffered, isOmniFixedOnly, getAlphaStrikeEquipmentDisplayAbilityCodes, getAmmoBattleValuePerTon, getAmmoFamily, getAmmoRoundsPerTon, getCompatibleAmmo, getDatesAvailability, getEquipmentListByTech, getEquipmentListForChassis, mustUseStarLeagueVersion, starLeagueVersionInEra, getWeaponShotsPerTon, getBattleArmorScaleListByTech, getEquipmentCatalogDefinitions, getEquipmentOfferIssue, getTechDatesAvailability, isPostPrimitiveTechnology, servesTechBase } from "../data/equipment-registry";
import { getFractionalArmorTonsPerPoint, getFractionalEngineWeight, roundUpToKilogram } from "../data/fractional-accounting";
import { isUniversalEquipment } from "../data/universal-equipment";
import { mechEngineOptions } from "../data/mech-engine-options";
import { describeEngineRequirement, engineMeetsRequirement, FUSION_ENGINE_TAGS, getLargeEngineType, mechEngineTypes } from "../data/mech-engine-types";
import { mechGyroTypes } from "../data/mech-gyro-types";
import {
    FW_POWER_ARMOR_RULESET, POWER_ARMOR_FIVE_TON_STRUCTURE, POWER_ARMOR_FIVE_TON_WEAPONS, POWER_ARMOR_PILOT_SLOTS, POWER_ARMOR_TONNAGES,
    POWER_ARMOR_WALDO, getPowerArmorShieldingWeight, getPowerArmorSlots, isPowerArmorTonnage, needsPowerArmorShielding,
} from "../data/future-wars-power-armor";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { mechInternalStructureTypes } from "../data/mech-internal-structure-types";
import { mechJumpJetTypes, mechJumpPack } from "../data/mech-jump-jet-types";
import { mechMyomerTypes } from "../data/mech-myomer-types";
import { armlessMechOption, mechTypeOptions } from "../data/mech-type-options";
import { getTargetingComputerWeaponWeight, IVariableEquipmentContext, isTargetingComputerWeapon, sizeVariableEquipment } from "../data/variable-equipment";
import { btTechOptions } from "../data/tech-options";
import { getEditionTechBases, IGameSettings } from "../data/game-settings";
import { getHexDistanceFromModifier, getLocationName, getMovementModifier } from "../utils";
import { addCommas } from "../utils/addCommas";
import { rollCriticalLine } from "../utils/critical-tables";
import {
    getBoostedJumpHeat, getBoostedJumpMP, getBoostedRunHeat, getFutureWarsPlayKind, getInfernoGaussAmmoCritHeat, getLRFlamerBurn,
    getPowerBoosterRoll, INFERNO_GAUSS_HEAT_PER_TURN, INFERNO_GAUSS_TURNS_PER_HIT, LR_FLAMER_BURN_TURNS, MAX_EXTERNAL_HEAT_PER_TURN, PDS_INTEGRAL_BURSTS, PowerBoosterResult,
} from "../utils/future-wars-play";
import {
    FW_LONG_RANGE_WARS, FW_MORALE, FW_OPPORTUNITY_FIRE, FW_STRATEGIC_MOVEMENT, FW_WEAPON_MALFUNCTIONS, getMalfunctionEffect, getMalfunctionTable,
    getMechMoraleModifier, getMechMoraleResult, getStrategicMovementHeat, getStrategicMovementMP, IMalfunctionEffect, IMoraleResult,
    isMoralePass, MoraleStatus,
} from "../utils/future-wars-ruleset-tools";
import { calculateAlphaStrikeValue, IAlphaStrikeExport, isAlphaStrikeConversionKeyword } from "../utils/calculateAlphaStrikeValue";
import { addsNoAlphaStrikeWeaponHeat, alphaStrikeExtraHeat, alphaStrikeMovementHeat, applyAlphaStrikeHeat } from "../utils/alphaStrikeHeat";
import { isAlphaStrikeAbilityCode } from "../data/alpha-strike-special-abilities";
import { generateUUID } from "../utils/generateUUID";
import { ISSWBasicInfo, parseSSWXML } from "../utils/getSSWXMLBasicInfo";
import { correctSSWDesign } from "../data/mtf-design-corrections";
import { findImportedEquipment, ImportFaction } from "../utils/importedEquipment";
import { getMountedHeat, mateLaserInsulators } from "../data/laser-insulator";
import { findIncompleteCustomContent, hasIncompleteCustomContent } from "../data/custom-content-incomplete";
import { getVehicleSuspensionFactor } from "../data/vehicle-motive-types";
import {
    ICanonicalBattleMechRecord,
    ICanonicalSourceMetadata,
    parseBattleMechRecordJSON,
    toCanonicalBattleMechRecord,
} from "../data/canonical-record";
import { AlphaStrikeUnit, IAlphaStrikeDamage, IASMULUnit } from "./alpha-strike-unit";
import Pilot, { IPilot } from "./pilot";

interface IWeights {
    name: string;
    weight: number;
}

/** Shield sizes' Damage Absorption and Damage Capacity, from the Shield Table (TO:AUE p.103). */
const shieldTable: Record<"small" | "medium" | "large", [number, number]> = { small: [3, 11], medium: [5, 18], large: [7, 25] };

/** A shield as the record sheet shows it. */
export interface IMechShield {
    item: IEquipmentItem;
    location: string;
    size: string;
    damageAbsorption: number;
    damageCapacity: number;
    damageTaken: number;
}

export interface IRulesEditionReturn {
    edition: string;
    design: string;
    left: string;
    /** The rules level the design arrived at (#324): another level on the way back means the player picked it. */
    arrivalLevel?: number;
}

export interface ICriticalSlot {
    uuid: string;
    name: string;
    tag: string;
    rear: boolean;
    rollAgain?: boolean;
    crits: number;
    obj: any;
    movable?: boolean;
    placeholder?: boolean;
    /** A second ton of ammunition sharing this slot on a superheavy 'Mech (IO:AE p.157). */
    shared?: ICriticalSlot;

    size?: number;

    loc?: string;
    slot?: number;

    damaged?: boolean;
}

interface IMechCriticals {
    [location: string]: ICriticalSlot[];
}

interface IArmorAllocation {
    head: number;
    centerTorso: number;
    rightTorso: number;
    leftTorso: number;
    centerTorsoRear: number;
    rightTorsoRear: number;
    leftTorsoRear: number;
    leftArm: number;
    rightArm: number;
    leftLeg: number;
    rightLeg: number;
    frontRightLeg: number;
    frontLeftLeg: number;
    centerLeg: number;
}

export interface ICriticalHits {
    head: boolean[];
    centerTorso: boolean[];
    rightTorso: boolean[];
    leftTorso: boolean[];
    leftArm: boolean[];
    rightArm: boolean[];
    leftLeg: boolean[];
    rightLeg: boolean[];
    frontRightLeg: boolean[];
    frontLeftLeg: boolean[];
    centerLeg: boolean[];
}


interface IBMEquipmentExport {
    tag: string;
    loc: string | undefined;
    allocationIndex: number;
    allocationLocation: string;
    rear: boolean | undefined;
    uuid: string | undefined;
    weight: number | undefined;
    // in play variables
    target?: string | undefined;
    resolved?: boolean | undefined;
    damageClusterHits?: IClusterHit[] | undefined;
    split_location?: ISplitLocation[] | undefined;
    currentAmmo?: number | undefined;
    selectedAmmoBinUUID?: string | undefined;
    feedsWeaponTag?: string | undefined;
    currentAdditionalArmor?: number | undefined;
    shieldDamage?: number | undefined;
    size?: number | undefined;
    omniFixed?: boolean | undefined;
    /** An armored component (TO:AUE p.94). */
    armored?: boolean | undefined;
    /** Mounted in a BattleMech Turret (TO:AUE p.159). */
    turret?: boolean | undefined;
}

/** One OmniMech configuration (Prime, A, B...): its pod-mounted items and their critical slots. */
export interface IOmniConfiguration {
    name: string;
    equipment: IBMEquipmentExport[];
    allocation: ICriticalSlot[];
    bombLoadout?: Record<string, number>;
    /** What else a configuration sets (SSW loadouts vary all of it, #112); saves from before it leave it out. */
    chassis?: IOmniConfigurationChassis;
}

/** A configuration's heat sinks, jump jets, arm actuators and Clan CASE, with the heat sink and jump jet slots. */
export interface IOmniConfigurationChassis {
    additionalHeatSinks: number;
    jumpSpeed: number;
    /** Lower arm and hand actuators missing, as the save's no_lala/no_laha/no_rala/no_raha features. */
    noActuators: { lala: boolean, laha: boolean, rala: boolean, raha: boolean };
    clanCASE: boolean;
    slots: ICriticalSlot[];
}

/** The 'Mech one FrankenMech location came from (CO p.213): its tonnage, its internal structure and, optionally, its name. */
export interface IFrankenMechDonor {
    tonnage: number;
    structure: string;
    /** Which 'Mech it was; legs from different 'Mechs make Piloting Skill Rolls harder. Blank: the center torso's 'Mech. */
    name?: string;
    /** Whose structure it is: a Mixed Tech FrankenMech may carry Inner Sphere and Clan endo steel side by side. */
    structureTechBase?: "is" | "clan";
    /** Slots the structure took in this location on the donor's own design; left out, the distribution table's. */
    structureSlots?: number;
}

/** Jump jets a FrankenMech kept from a lighter 'Mech, named by the weight class they were built for (TM p.51). */
export type FrankenMechJumpJetClass = "light" | "medium" | "heavy";
/** Standard, Bimodal (IO:AE p.100), or a Custom Homebrew VTOLAM, a LAM whose second mode is a VTOL, under one of two fan rule sets. */
export type LAMType = "standard" | "bimodal" | "vtolam" | "vtolam-btitf" | "pam";

interface ILAMTypeRules {
    name: string;
    /** Conversion equipment: share of tonnage, rounded up to the ton (or the half ton). */
    conversion: number;
    halfTon?: boolean;
    costRate: number;
    modes: string[];
    minJumpMP: number;
    maxTonnage?: number;
    /** The VTOL-mode Cruise MP: the VTOL engine formula, or the 'Mech's Jump MP. */
    vtolCruise?: "engine" | "jump";
    /** The IO:AE p.108 LAM limits on engines, armor, structure, actuators and equipment. */
    lamLimits: boolean;
    /** Fan rules (Custom Homebrew rules level, Battle Value provisional). */
    homebrew?: boolean;
    notes?: string;
}

export const LAM_TYPE_RULES: Record<LAMType, ILAMTypeRules> = {
    // Conversion weight: 10%, Bimodal 15% (IO:AE p.108); cost: x0.75, Bimodal x0.65 (IO:AE p.180).
    standard: { name: "LAM", conversion: 0.1, costRate: 0.75, modes: ["mech", "airmech", "aerospace"], minJumpMP: 3, lamLimits: true },
    bimodal: { name: "Bimodal LAM", conversion: 0.15, costRate: 0.65, modes: ["mech", "aerospace"], minJumpMP: 3, lamLimits: true },
    // BishopSteiner's VTOLAM, "a form of Bimodal LAM" (deviantart.com/bishopsteiner/art/LOCUST-VTOLAM-concept-899660337).
    vtolam: {
        name: "VTOLAM", conversion: 0.2, costRate: 0.65, modes: ["mech", "vehicle"], minJumpMP: 0, maxTonnage: 30, vtolCruise: "engine", lamLimits: true,
        notes: "VTOLAM (Custom Homebrew; fan rules by BishopSteiner on DeviantArt): a Bimodal LAM whose second mode is a VTOL. Conversion equipment is 20% of tonnage, at most 30 tons, no jump jets required, any fusion engine and any gyro, no fuel, and landing skids in each side torso. In 'Mech mode the rotor armor is the rear center torso: 2 points of damage there destroy the rotors, and the unit can no longer convert.",
    },
    // professorheyteen's VTOLAM (Battletech Into The Future, battletechfuture.com/2024/05/28/the-vtolam/).
    "vtolam-btitf": {
        name: "VTOLAM", conversion: 0.1, halfTon: true, costRate: 0, modes: ["mech", "vehicle"], minJumpMP: 1, maxTonnage: 35, vtolCruise: "jump", lamLimits: false,
        notes: "VTOLAM (Custom Homebrew; fan rules by professorheyteen, Battletech Into The Future): conversion equipment is 10% of tonnage, at most 35 tons, with rotor equipment in each side torso and conversion equipment in each leg; any equipment a BattleMech can use. It takes 'Mech hit locations in both modes, but a hit roll of 2 is a rotor hit: the first gives +3 to every Piloting roll in VTOL mode, the second destroys the rotor and the VTOLAM crashes, taking falling damage for its flight level (1 level with a successful Piloting roll). A critical hit on the rotor or conversion equipment ends transformation (in VTOL mode it reverts to 'Mech mode). It converts during the Movement Phase while jumping or at cruising speed, and may convert without its arms.",
    },
    // Red Pins, BattleTech forums, "Custom Weapons and Equipment" (topic 44833), reply #5, 21 Feb 2015. The full rules
    // were never published; everything below the one line is our extrapolation (owner rulings 2026-11-12).
    pam: {
        name: "Permanent Air 'Mech", conversion: 0, costRate: 0, modes: ["airmech"], minJumpMP: 3, maxTonnage: 75, lamLimits: true, homebrew: true,
        notes: "Permanent Air 'Mech (Custom Homebrew). Inspired by: Red Pins, BattleTech forums, \"Custom Weapons and Equipment\" (topic 44833) and topics 13127 and 41508, who described it as an AirMech with only one mode, with Heavy PAMs of 60 to 75 tons on a reduced jump multiplier; and LAMFAN's Air-Slip Mechs (topic 83239). The rules here are our own extrapolation from the Land-Air 'Mech rules: it is a single-mode LAM that is always in AirMech mode and never converts, so it carries no conversion equipment (no weight, no cost). Its wings weigh the Inner Sphere Partial Wing's 7% of its mass, rounded up to the half ton, with no slots of their own; it keeps the LAM avionics (head and each side torso) and has no landing gear: it lands on its feet. Its AirMech Cruise MP is its Jump MP x 3, so it needs at least 3 Jump MP. A Heavy PAM (56 to 75 tons) flies on Jump MP x 2 and its wings weigh 15% of its mass; it may hover like any AirMech. It keeps every other LAM limit (engine, gyro, armor, structure, single-location equipment, biped, Inner Sphere) and carries no bomb bays: it never takes Fighter Mode to drop them. With no conversion equipment to hold it, the LAM's ton of fuel (80 points) is a required 1 ton of its own; AirMech movement on the ground map spends none, and Fuel Tanks may be added for space. Battle Value uses the LAM rules unchanged and is provisional.",
    },
};

export interface IFrankenMechExport {
    donors: Record<string, IFrankenMechDonor>;
    jumpJetClass?: FrankenMechJumpJetClass;
}

/** One Power Booster's track in play (The Best of Future Wars p.28), by the uuid of the item it is part of. */
export interface IFutureWarsBoosterState {
    /** Turns in a row it has been used, this one included when `usedThisTurn`. */
    turnInARow: number;
    usedThisTurn: boolean;
    /** Its roll this turn succeeded: the boost is on. */
    boostedThisTurn: boolean;
    /** Failed for good (5 or less, and so on). */
    failed?: boolean;
    /** Burned out the system it drives as well (a 2, or a fourth turn). */
    systemBurnedOut?: boolean;
}

/** The Best of Future Wars equipment in play (#172, Chunk C). Every field is absent until something happens. */
export interface IFutureWarsPlayState {
    boosters?: Record<string, IFutureWarsBoosterState>;
    /** Built-in PDS bursts spent, by the PDS's uuid. */
    pdsBurstsUsed?: Record<string, number>;
    /** Long Range Flamer hits burning on this 'Mech: one entry a hit, its age in turns (0 the turn it hit). */
    lrFlamerBurns?: number[];
    /** Turns of Inferno Gauss heat left on this 'Mech. */
    infernoGaussTurns?: number;
    /** Hexes run this turn with the leg booster on (its heat is 1 a hex). */
    boostedRunHexes?: number;
    /** Heat from inside the 'Mech waiting for this turn's heat phase (Inferno Gauss shells igniting). */
    pendingHeat?: number;
    // The play-rule rulesets (Chunk E; src/utils/future-wars-ruleset-tools.ts).
    /** Strategic Movement this turn: walking or running, and the MP used (pp.18-19). */
    strategicMovement?: { mode: "w" | "r"; mp: number };
    /** The weapon that took an opportunity shot this turn (p.17). */
    opportunityShot?: string;
    /** Morale (pp.22-26): class (0 Militia to 5 Crack; Regular when unset), status, Carry On modifier and routs. */
    morale?: IFutureWarsMoraleState;
    /** Malfunction rolls recorded on each weapon, by its uuid (p.29). */
    malfunctions?: Record<string, number[]>;
    /** Long Range Wars ranging: turns in a row this 'Mech has fired at the same target, -1 each (p.56). */
    ranging?: number;
    /** A Power Armor suit's pilot getting out: unlatching the front plate this turn, then out of the suit (p.15). */
    powerArmorExit?: "unlatching" | "out";
}

export interface IFutureWarsMoraleState {
    classIndex?: number;
    /** `pending` until the turn it was rolled ends; then `turnsLeft` counts the turns after it. */
    status?: { kind: MoraleStatus; turnsLeft: number; pending?: boolean; label: string; fire?: number | "none" };
    laterRollModifier?: number;
    routs?: number;
    /** The last check's outcome, for the panel. */
    last?: string;
}

export interface IBattleMechExport {

    // in play variables
    futureWarsPlay?: IFutureWarsPlayState;

    selectedMech?: boolean;
    currentMovementMode?: string;
    targetingRangeSetting?: "long" | "short";
    enhancedImagingOff?: boolean;
    currentToHitMovementModifier?: number;
    currentTargetModifier?: number;
    currentTargetJumpingMP?: number;
    jumpPackFuelUsed?: number;
    jumpPackLost?: string;
    targetAToHit?: ITargetToHit | null;
    targetBToHit?: ITargetToHit | null;
    targetCToHit?: ITargetToHit | null;
    currentHeat?: number;
    structureBubbles?: IMechDamageAllocation | null;
    armorBubbles?: IMechDamageAllocation | null;
    damageLog?: IMechDamageLog[];
    criticalDamage?: Record<string, number[]>;
    pilot?: IPilot,
    as_custom_nickname?: string;
    as_special_ammo_tag?: string;
    engineTechBase?: "is" | "clan";
    // Mixed Tech only, when set (#43).
    mixedTechBases?: { structure?: "is" | "clan"; armor?: "is" | "clan"; heatSink?: "is" | "clan" };

    // basic properties
    omnimech: boolean;
    additionalHeatSinks: number;
    allocation: ICriticalSlot[],
    armor_allocation: IArmorAllocation,
    armor_type: string;
    /** Patchwork Armor: armor type tag by location key; present only when armor_type is "patchwork". */
    patchworkArmor?: Record<string, string>;
    /** FrankenMech (CO pp.213-214): each location's donor, by long location key; present only on a FrankenMech. */
    frankenMech?: IFrankenMechExport;
    armor_weight: number;
    weight_accounting?: "fractional";   // Fractional Accounting (TO:AUE p.188); absent = standard rounding
    fractional_armor_points?: number;
    as_role: string;
    as_value: number;   // for easy listing
    battle_value: number;     // for easy listing
    c_bills: string;  // for easy listing
    engineType: string;
    equipment: IBMEquipmentExport[],
    era: string;
    features: string[],
    /** Armored critical records that are not equipment (engine, gyro, actuators, heat sinks...): "tag@loc:slot" (TO:AUE p.94). */
    armored_components?: string[];
    gyro: string;
    heat_sink_type: string;
    jump_jet_type?: string;
    myomer_type?: string;
    hideNonAvailableEquipment: boolean;
    /** Rules edition the design is built under; absent for the default edition (Total Warfare). */
    rulesEdition?: string;
    /** The printed droid the design was loaded from (an id from battledroids-mechs.ts); absent for a built design. */
    printedDroid?: string;
    /** The edition the design last left, its design then, and its design just after the switch (see setRulesEdition). */
    rulesEditionReturn?: IRulesEditionReturn;
    /** The design's own rules level (#324); absent in older saves, which show the app-wide level. */
    rulesLevel?: number;
    /** Special Rulesets the design is built under (ids from special-rulesets.ts); absent when none. */
    rulesets?: string[];
    /** Clell Flint's construction rules (#172): a heavy 'Mech's 4-ton, two-slot cockpit; absent when not chosen. */
    futureWarsLargeCockpit?: boolean;
    /** Clell Flint's construction rules: extra sensors, a head slot and half a ton; absent when not fitted. */
    extraSensors?: boolean;
    /** Clell Flint's construction rules: extra life support, a head slot and half a ton; absent when not fitted. */
    extraLifeSupport?: boolean;
    introductoryRules?: boolean;
    is_type: string;
    jumpSpeed: number;
    /** Tons of jump pack strapped on (Maximum Tech p.80; TO:AUE p.105). */
    jumpPackTons?: number;
    lastUpdated: Date;
    location?: string;
    mechType: string;
    quadVeeMotive?: "tracked" | "wheeled";
    lamType?: LAMType;
    /** LAM bombs loaded into Bomb Bays, keyed by bomb ammunition tag. */
    bombLoadout?: Record<string, number>;
    /** OmniMech configurations sharing this base chassis; `equipment` holds the active one. */
    omniConfigurations?: IOmniConfiguration[];
    activeOmniConfiguration?: string;
    /** The base chassis' additional heat sinks and jump MP; left out, what every configuration has. */
    omniBaseHeatSinks?: number;
    omniBaseJumpSpeed?: number;
    transformationMode?:"mech" | "airmech" | "aerospace" | "vehicle";
    mirrorArmorAllocations: boolean;
    model: string;
    name: string;
    nickname: string;
    strictEra: boolean;
    tech: string;
    tech_label: string;  // for easy listing
    tonnage: number;
    uuid: string;
    quirks?: IAssignedQuirk[];
    tro?: ITechnicalReadoutExport;
    walkSpeed: number;
}


export interface ITargetToHit {
    name: string;
    active: boolean;
    range: number;
    movement: number;
    otherMods: number;
    jumped: boolean;
    primary: boolean;
    inRearArc: boolean;
    /** Airborne, not grounded: an aerospace unit, a VTOL, a 'Mech on a combat drop; not a jumping 'Mech (CO p.225). */
    airborne?: boolean;
    /** Light and heavy woods, jungle or smoke hexes the attack passes through or into, the target's own included. */
    lightWoodsHexes?: number;
    heavyWoodsHexes?: number;
    /** The darkness or night modifier, as the scenario sets it. */
    darkness?: number;
    /** Shut down, or its warrior unconscious: an immobile target (TW p.110). */
    immobile?: boolean;
    /** The hit location an aimed shot names ("hd", "ct", "la" and so on), or unset for none. */
    aimedLocation?: string;
    /** A Power Armor suit: +1 to hit it (The Best of Future Wars p.14; #172). */
    powerArmor?: boolean;
}

export interface IGATOR {
    weaponName?: string;
    targetName?: string;
    targetObj?: ITargetToHit | null;
    explanation?: string;
    target?: string;
    rangeExplanation?: string;
    otherModifiersExplanation?: string;

    gunnerySkill: number;
    attackerMovementModifier: number;
    targetMovementModifier: number;
    otherModifiers: number;
    rangeModifier: number;
    finalToHit: number;
}

export class BattleMech {
    private static readonly SIGNATURE_SYSTEM_TAGS = ["null-signature-system", "void-signature-system", "chameleon-lps"];
    /** Superheavy Engine Type BV Modifier Table (IO:AE p.188), by engine tag; a large engine counts as its type. */
    private static readonly SUPERHEAVY_ENGINE_BV_MODIFIERS: Record<string, number> = {
        light: 0.825, xl: 0.75, clan_xl: 0.825, xxl: 0.5, clan_xxl: 0.75,
    };
    private static readonly HEAVY_GAUSS_TAGS = ["gauss-rifle-heavy", "gauss-rifle-heavy-improved"];
    private static readonly MECH_LOCATION_MAP: Record<string, string> = {
        // Shared location mapper for all front, rear, and advanced chassis locations
        hd: "head",
        ct: "centerTorso",
        lt: "leftTorso",
        rt: "rightTorso",
        la: "leftArm",
        ra: "rightArm",
        ll: "leftLeg",         // Rear Left Leg on Quads and QuadVees
        rl: "rightLeg",        // Rear Right Leg on Quads and QuadVees
        rtr: "rightTorsoRear",
        ctr: "centerTorsoRear",
        ltr: "leftTorsoRear",
        cl: "centerLeg",       // Added Tripod layout support
        fll: "frontLeftLeg",   // Added Quad / QuadVee layout support
        frl: "frontRightLeg"   // Added Quad / QuadVee layout support
    };

    private _targetAToHit: ITargetToHit = {
        name: "",
        active: false,
        range: 0,
        movement: 0,
        otherMods: 0,
        jumped: false,
        primary: true,
        inRearArc: false,
    };
    private _targetBToHit: ITargetToHit = {
        name: "",
        active: false,
        range: 0,
        movement: 0,
        otherMods: 0,
        jumped: false,
        primary: false,
        inRearArc: false,
    };
    private _targetCToHit: ITargetToHit = {
        name: "",
        active: false,
        range: 0,
        movement: 0,
        otherMods: 0,
        jumped: false,
        primary: false,
        inRearArc: false,
    };

    private _sswImportErrors: string[] = [];
    // Items and components an SSW import could not resolve, for the import review screen and custom drafts.
    private _sswUnresolved: ISSWUnresolvedItem[] = [];
    /** The make SSW gave each installed item, by the uuid it was installed under; read into the Technical Readout at the end of an import. */
    private _sswCopyMakes: { uuid: string; make: string }[] = [];

    private _introductoryRules: boolean = false;

    public basicSSWInfo: ISSWBasicInfo | null = null;

    // in play variables
    public selectedMech: boolean = false;

    public lastUpdated = new Date();
    public currentMovementMode: string = "n";
    /** A variable-range targeting system's End Phase setting (Maximum Tech p.59). */
    public targetingRangeSetting: "normal" | "long" | "short" = "normal";
    /** The Enhanced Imaging interface switched off in the End Phase (Maximum Tech p.61; IO:AE p.69). */
    public enhancedImagingOff = false;
    public currentToHitMovementModifier: number = 0;
    public currentTargetModifier: number = 0;
    public currentTargetJumpingMP: number = 0;
    /** Jump pack fuel spent in earlier turns: Fuel Points, or hexes under Maximum Tech. */
    public jumpPackFuelUsed = 0;
    /** How the jump pack left the 'Mech, empty while it is strapped on. */
    public jumpPackLost = "";
    public currentHeat: number = 0;
    /** The Best of Future Wars equipment's play state (#172); see IFutureWarsPlayState. */
    public futureWarsPlay: IFutureWarsPlayState = {};
    public damageLog: IMechDamageLog[] = [];
    public criticalDamage: Record<string, number[]> = {};

    // basic properties
    private _nickname = "";
    private _lastUpdated: Date = new Date();
    private _uuid: string = generateUUID();

    /** The design quirks assigned to this unit (quirk tables, Campaign Operations pp.228 and 232). */
    public quirks: QuirkList = new QuirkList();
    /** The Technical Readout fields: makes and text, all optional. */
    public tro: TechnicalReadout = new TechnicalReadout();

    private _mechType = mechTypeOptions[0];
    private _quadVeeMotive: "tracked" | "wheeled" = "tracked";
    // Standard LAMs have Mech/AirMech/Fighter modes; Bimodal LAMs have no AirMech mode (IO).
    private _lamType: LAMType = "standard";
    /** LAM bombs loaded into the Bomb Bays, keyed by bomb ammunition tag. */
    private _bombLoadout: Record<string, number> = {};
    /** Stored OmniMech configurations; the active one is live in _equipmentList. */
    private _omniConfigurations: IOmniConfiguration[] = [];
    private _activeOmniConfiguration = BattleMech.DEFAULT_OMNI_CONFIGURATION;
    /** Additional heat sinks and jump MP of the OmniMech base chassis, when the design gives them; the rest are pod-mounted. */
    private _omniBaseHeatSinks: number | undefined;
    private _omniBaseJumpSpeed: number | undefined;
    private _transformationMode: "mech" | "airmech" | "aerospace" | "vehicle" = "mech";
    private _tech = btTechOptions[0];
    private _era = btEraOptions[1]; // Default to the Star League
    /** The rules edition the design is built under (a tag from rules-editions.ts). */
    private _rulesEdition: string = DEFAULT_RULES_EDITION;
    /** The printed droid the design was loaded from (an id from battledroids-mechs.ts), if any. */
    private _printedDroid: string | undefined = undefined;
    private _rulesEditionReturn: IRulesEditionReturn | undefined = undefined;
    private _rulesLevel: number | undefined = undefined;
    private _rulesets: string[] = [];
    private _model: string = "";
    private _name: string = "";
    private _tonnage = 20;
    private _hideNonAvailableEquipment: boolean = true;
    private _currentTonnage = 0;

    private _mirrorArmorAllocations: boolean = true;

    private _armorType = mechArmorTypes[0];
    /** Patchwork Armor: the armor type tag of each hit location, by long location key (TO:AUE p.189). */
    private _patchworkArmor: Record<string, string> = {};
    /** Patchwork locations whose armor found no free critical slots; rebuilt with the critical table. */
    private _patchworkSlotShortfalls: string[] = [];
    /** FrankenMech (CO pp.213-214): a 'Mech built from the body locations of others. */
    private _frankenMech: boolean = false;
    /** FrankenMech donors by long location key; a location left out comes from the center torso's 'Mech. */
    private _frankenMechDonors: Record<string, Partial<IFrankenMechDonor>> = {};
    /** FrankenMech jump jets of a lighter weight class than the 'Mech's own; null for its own. */
    private _frankenMechJumpJetClass: FrankenMechJumpJetClass | null = null;
    /** FrankenMech locations whose structure found no free critical slots; rebuilt with the critical table. */
    private _frankenMechSlotShortfalls: string[] = [];

    private _maxArmor: number = 0;

    private _selectedInternalStructure = mechInternalStructureTypes[0];

    private _myomerType: IMyomerType = mechMyomerTypes[0];
    private _omnimech: boolean = false;
    private _remainingTonnage: number = 0;

    // Shared factory function to dynamically initialize clean empty arrays for damage tracking
    private createZeroedDamageRecord(): IMechDamageAllocation {
        const record: Partial<IMechDamageAllocation> = {};
        const uniqueLocations = Array.from(new Set(Object.values(BattleMech.MECH_LOCATION_MAP)));
        uniqueLocations.forEach(loc => {
            (record as any)[loc] = [];
        }); 
        return record as IMechDamageAllocation;
    }
    // Shared factory function to initialize the internal structure mapping profile cleanly
    private createZeroedStructureRecord(): IInternalStructurePerTon {
        const record: any = { tonnage: 0 };
        const uniqueLocations = Array.from(new Set(Object.values(BattleMech.MECH_LOCATION_MAP)));
        uniqueLocations.forEach(loc => {
            // Internal structure schemas track only true anatomical components, not rear protective arcs
            if (!loc.endsWith("Rear")) {
                record[loc] = 0;
            }
        });
        return record as IInternalStructurePerTon;
    }
    // Shared factory function to initialize a clean, zeroed out armor allocation profile
    private createZeroedArmorRecord(): IArmorAllocation {
        const record: any = {};
        const uniqueLocations = Array.from(new Set(Object.values(BattleMech.MECH_LOCATION_MAP)));
        uniqueLocations.forEach(loc => {
            record[loc] = 0;
        }); 
        return record as IArmorAllocation;
    }
    // Shared factory function to initialize a clean, zeroed out critical slots profile
    private createZeroedCriticalsRecord(): IMechCriticals {
        const record: Partial<IMechCriticals> = {};
        const uniqueLocations = Array.from(new Set(Object.values(BattleMech.MECH_LOCATION_MAP)));
        uniqueLocations.forEach(loc => {
            // Critical slots are mapped to physical locations, not rear armor faces
            if (!loc.endsWith("Rear")) {
                (record as any)[loc] = [];
            }
        });
        return record as IMechCriticals;
    }
    // Consolidated Property Definitions
    private _internalStructure: IResolvedInternalStructure = this.createZeroedStructureRecord() as IResolvedInternalStructure;
    private _armorAllocation: IArmorAllocation = this.createZeroedArmorRecord();
    private _armorBubbles: IMechDamageAllocation = this.createZeroedDamageRecord();
    private _structureBubbles: IMechDamageAllocation = this.createZeroedDamageRecord();
    private _criticals: IMechCriticals = this.createZeroedCriticalsRecord();

    // Do we have hands and/or wrists?
    private _no_right_arm_hand_actuator: boolean = false;
    private _no_right_arm_lower_actuator: boolean = false;
    private _no_left_arm_hand_actuator: boolean = false;
    private _no_left_arm_lower_actuator: boolean = false;

    private _smallCockpit: boolean = false;
    /** Torso-Mounted Cockpit (TO:AUE p.112). */
    private _torsoMountedCockpit: boolean = false;
    /** BattleMech Interface Cockpit (IO:AE p.110). */
    private _interfaceCockpit: boolean = false;
    /** Clell Flint's construction rules (#172): a heavy 'Mech's 4-ton cockpit ("a few heavy mechs", Best-of p.35). */
    private _futureWarsLargeCockpit: boolean = false;
    /** Clell Flint's construction rules: extra sensors, +1 head slot and +0.5 t (Best-of p.35). */
    private _extraSensors: boolean = false;
    /** Clell Flint's construction rules: extra life support, +1 head slot and +0.5 t (Best-of p.35). */
    private _extraLifeSupport: boolean = false;
    /** Smart Robotic Control System on top of the cockpit (IO:AE p.134); "none" for a piloted 'Mech. */
    private _roboticControl: RoboticControlTag = "none";
    // IndustrialMechs: the Advanced Fire Control cockpit enhancement (TM p.69). An option, off by default.
    private _advancedFireControl: boolean = false;
    // A Cockpit Command Console beside the cockpit (TO:AUE p.112). An option, off by default.
    private _commandConsole: boolean = false;
    private _armless: boolean = false;
    private _jumpPackTons: number = 0;
    // Clan Enhanced Imaging in the cockpit (Maximum Tech pp.60-61; IO:AE p.69). An option, off by default.
    private _enhancedImaging: boolean = false;
    // Built under the Primitive 'Mech rules (IO:AE pp.116-118). With later equipment it is a RetroTech unit.
    private _primitive: boolean = false;
    // Mixed Tech on an Inner Sphere base: Clan CASE, "seamless and weightless", in every location (TM p.210).
    // Clan-base designs always have it (TM p.303 note *).
    private _clanCASE: boolean = false;
    // Armored components that are not equipment items, by critical record: "tag@loc:slot" (TO:AUE p.94).
    // Equipment items carry their own `armored` flag.
    private _armoredSlots: Set<string> = new Set();
    private _cockpitWeight: number = 3;
    private _totalInternalStructurePoints = 0;
    private _maxMoveHeat: number = 2;
    private _heatDissipation: number = 0;
    private _additionalHeatSinks: number = 0;
    private _armorWeight: number = 0;
    /** Weight rounding: "fractional" is the Fractional Accounting construction option (TO:AUE p.188). */
    private _weightAccounting: "standard" | "fractional" = "standard";
    // Whether battle armor items were mounted at the last recalculation, so only the first one turns
    // Fractional Accounting on; and whether a saved design is loading, which keeps its own accounting.
    private _hadBattleArmorEquipment = false;
    private _importing = false;
    /** Armor points bought under Fractional Accounting, where armor is installed by the point. */
    private _fractionalArmorPoints: number = 0;
    private _totalArmor: number = 0;
    private _unallocatedArmor: number = 0;
    private _equipmentList: IEquipmentItem[] = [];
    private _sortedEquipmentList: IEquipmentItem[] = [];
    private _criticalAllocationTable: ICriticalSlot[] = [];
    private _weights: IWeights[] = [];
    private _strictEra: boolean = true;
    private _unallocatedCriticals: ICriticalSlot[] = [];
    private _gyro = mechGyroTypes[0];
    private _engine: IEngineOption | null = null;
    private _engineType = mechEngineTypes[0];
    private _engineTechBase: "is" | "clan" = "is";
    // A Mixed Tech 'Mech's structure, armor and heat sinks may each be the Inner Sphere or the Clan version, with
    // that version's slots (#43). Unset, they follow the chassis as before. A Clan 'Mech may pick the Star League
    // version while its era holds both versions' windows (#168).
    private _mixedTechBases: { structure?: "is" | "clan"; armor?: "is" | "clan"; heatSink?: "is" | "clan" } = {};
    private _jumpJetType = mechJumpJetTypes[0];
    // Movement Speeeds
    private _walkSpeed = 0;
    private _runSpeed = 0;
    private _jumpSpeed = 0;

    private _heatSinkCriticals = {
        slotsEach: 1,
        number: 0,
    };
    private _heatSinkType: IHeatSync = mechHeatSinkTypes[0];

    private _cbillCost = "0";
    private _cbillCostWithAmmo = "0";
    private _battleValue = 0;
    /** BV1 by edition, cleared with each recalculation. */
    private _battleValue1 = new Map<string, number>();
    private _defensiveBattleRating = 0;
    private _offensiveBattleRating = 0;
    private _pilotAdjustedBattleValue = 0;
    private _alphaStrikeValue = 0;
    private _alphaStrikeSpecialAmmoTag = "";

    private _calcLogBV = "";
    /** The cited steps of the last Battle Value 2 calculation; `_calcLogBV` is rendered from them. */
    private _battleValueSteps: ICalcStep[] = [];
    /** The cited steps of the last C-bill cost calculation; `_calcLogCBill` is rendered from them. */
    private _costSteps: ICalcStep[] = [];
    /** Set when a critical slot move changes what the Battle Value depends on; cleared by the next calculation. */
    private _battleValueStale = false;
    private _calcLogAS = "";
    private _calcLogCBill = "";

    private _validJJLocations = Object.entries(BattleMech.MECH_LOCATION_MAP)
    .filter(([short]) => short !== "hd" && !short.endsWith("r") && !short.endsWith("a"))
    .map(([short, long]) => ({ long, short }));

    private _pilot: Pilot = new Pilot( {
        name: "",
        piloting: 5,
        gunnery: 4,
        wounds: 0,
        alphaStrikeAbilities: [],
    });

    private _alphaStrikeForceStats: IAlphaStrikeExport = {
        mechCreatorUUID: "",
        name: "",
        move: 0,
        type: "BM",
        customName: "",
        role: "Brawler",
        jumpMove: 0,
        pv: 0,
        damage: {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0,
        },
        armor: 0,
        structure: 0,
        size: 0,
        skill: 4,
        overheat: 0,
        notes: "",
        tmm: 0,
        sizeClass: 0,
        sizeClassName: "",
        ov: 0,
        specialUnitAbilities: [],
        longHeat: 0,
        longOverheat: 0,
        abilityCodes: [],
    }

    constructor(importJSON: string = "" ) {
        if( importJSON ) {
            this.importJSON( importJSON );
        } else {
            this.setTonnage( 20 );
        }
        this._calc();
    }

    public reset() {
        this.lastUpdated = new Date();
        this._primitive = false;
        this._clanCASE = false;
        this._armoredSlots = new Set();
        this._rulesEdition = DEFAULT_RULES_EDITION;
        this._printedDroid = undefined;
        this.tro = new TechnicalReadout();
        this.quirks = new QuirkList();
        this._rulesEditionReturn = undefined;
        this._rulesLevel = undefined;
        this._rulesets = [];
        this._advancedFireControl = false;
        this._roboticControl = "none";
        this._commandConsole = false;
        this._armless = false;
        this._jumpPackTons = 0;
        this._enhancedImaging = false;
        this._patchworkArmor = {};
        this._frankenMech = false;
        this._frankenMechDonors = {};
        this._frankenMechJumpJetClass = null;
        this.setTonnage(20);
        this.setWalkSpeed(0);
        this.setWalkSpeed(0);
        this._equipmentList = [];
        this._sortedEquipmentList = [];
        this.setArmorWeight(0)
        this.setArmorType( "standard" );
        this.setASCustomName( "" )
        this.setASRole( "" )
        this.setMechType( "biped" );
        this.setAdditionalHeatSinks(0);
        this.setGyroType( "standard" );
        if( this._tech.tag === "is" ) {
            this.setHeatSinksType( "single" )
        } else {
            this.setHeatSinksType( "double" )
        }
        this.setInternalStructureType( "standard" );
        this.setEngineType( "standard" );
        this.setJumpJetType( "standard" );
        this._smallCockpit = false;
        this._torsoMountedCockpit = false;
        this._interfaceCockpit = false;
        this._futureWarsLargeCockpit = false;
        this._extraSensors = false;
        this._extraLifeSupport = false;
        this._criticalAllocationTable = [];
        this._calc();
    }

    public newUUID() {
        this._uuid = generateUUID();
    }

    /** Which column of the quirk tables this unit is graded by. */
    public getQuirkUnitType(): QuirkUnitType { return "mech"; }

    /** What the quirk picker can attach quirks to on this unit. */
    public getQuirkTargets(): IQuirkTargets {
        const hasArms = !this.isQuad() && !this.isQuadVee();
        const locations = battlemechLocations.filter((location) => !location.rear && !(this.isArmless() && ["la", "ra"].includes(location.tag))).map((location) => {
            const isArm = hasArms && (location.tag === "ra" || location.tag === "la");
            return {
                tag: location.tag, label: location.name,
                ...(isArm ? { arm: true, lowerArm: this.hasLowerArmActuator(location.tag), hand: this.hasHandActuator(location.tag) } : {}),
                ...(["ct", "lt", "rt"].includes(location.tag) ? { torso: true } : {}),
            };
        });
        const targets = getQuirkTargets(locations, this._equipmentList.filter((item) => item && !item.isAmmo).map((item) => ({ ...item, label: (item.location ? `${item.name} (${item.location!.toUpperCase()})` : item.name) })));
        return hasArms ? targets : { ...targets, quad: true };
    }

    /** One line for each quirk this unit could not be given now: rules edition, rules level or unit type. */
    public getQuirkIssues(rulesLevel: number): string[] {
        return getQuirkIssues(this.quirks.getAll(), this.getQuirkUnitType(), this._rulesEdition, rulesLevel, undefined, this.getQuirkTargets());
    }

    /**
     * The BattleMech Quirk Table's row for this chassis (BMM pp.90-95): by its name ("Atlas"), else its model field,
     * which holds the chassis for some Clan 'Mechs ("Timber Wolf"), else its nickname.
     */
    private _canonQuirkEntry(): ICanonQuirkEntry | undefined {
        return findCanonEntry(this._name) ?? findCanonEntry(this._model) ?? findCanonEntry(this._nickname);
    }

    /** Whether the BattleMech Quirk Table lists this chassis. */
    public hasCanonQuirks(): boolean {
        return !!this._canonQuirkEntry();
    }

    /**
     * Adds the chassis' canon quirks (BMM pp.90-95) to the player's own. A quirk already on the unit, or one the
     * quirk rules refuse beside another, is not added; null when the table does not list the chassis.
     */
    public applyCanonQuirks(): { added: number; notes: string[] } | null {
        const entry = this._canonQuirkEntry();
        if (!entry) return null;
        const clan = this._tech.tag === "clan" || this._tech.tag === "mclan";
        const weaponInfo = (uuid: string) => {
            const item = this._equipmentList.find((equipment) => equipment && equipment.uuid === uuid);
            // The table names weapons without the catalog's Clan marking: "ER Large Laser (Clan)" is an ER Large Laser.
            return item ? { name: item.name.replace(/^Clan /, "").replace(/ \(Clan\)$/, ""), location: item.location } : undefined;
        };
        const resolution = resolveCanonQuirks(entry, { targets: this.getQuirkTargets(), weaponInfo, clan, assigned: this.quirks.getAll() });
        let added = 0;
        const notes = [...resolution.notes];
        for (const quirk of resolution.quirks) {
            const refused = this.quirks.add(quirk);
            if (!refused) added++;
            else if (refused !== "duplicate") notes.push(`${getQuirk(quirk.tag)?.name ?? quirk.tag}: ${refused}, not added`);
        }
        return { added, notes };
    }

    public setTargets(
        a: ITargetToHit,
        b: ITargetToHit,
        c: ITargetToHit,
    ) {
        this._targetAToHit = a;
        this._targetBToHit = b;
        this._targetCToHit = c;
    }

    public getMovementToHitModifier(): number {
        if( this.currentMovementMode === "j" ) {
            return this.currentToHitMovementModifier + 1;
        }
        return this.currentToHitMovementModifier;
    }

    public setMechType(typeTag: string) {
        for( let lcounter = 0; lcounter < mechTypeOptions.length; lcounter++) {
            if( matchesTag(mechTypeOptions[lcounter], typeTag)) {
                this._mechType = mechTypeOptions[lcounter];
                this.setTonnage( this._tonnage );
                this._calc();
                return this._mechType;
            }
        }
        this._mechType = mechTypeOptions[0];
        this.setTonnage( this._tonnage );
        this._calc();
        return this._mechType;
    }

    public getGATOR(): IGATOR {
        const rv: IGATOR = {
            gunnerySkill: 0,
            attackerMovementModifier: 0,
            targetMovementModifier: 0,
            otherModifiers: 0,
            rangeModifier: 0,
            finalToHit: 0,
        };
        if( this._pilot ) {
            rv.gunnerySkill = this._pilot.gunnery;
        }
        return rv;
    }

    public hasCASE(
        loc: string
    ): boolean {
        for( const crit of this._criticalAllocationTable ) {
            if( crit.loc === loc ) {
                if( matchesTag(crit, "case") ) {
                    return true;
                }
            }
        }
        return false;
    }

    private _calcBattleValue(): void {
        this._battleValueStale = false;
        // Insulators follow their lasers' locations, which can change without a full recalculation.
        mateLaserInsulators(this._equipmentList);
        // Stealth Armor counts at full effect even when Modular Armor negates it in play (TO:AUE p.192).
        const hasBasicStealth = this._armorType.tag === "stealth-basic";
        const hasMimetic = this._armorType.tag === "mimetic";
        this._battleValue = 0;
        this._calcLogBV = "";
        const trace = new CalcTrace(MECH_BV2_STEPS);
        const rounded2 = (value: number): number => Math.round(value * 100) / 100;
        /* *************************************************************************
        * STEP 1: CALCULATE DEFENSIVE BATTLE RATING - TechManual p. 302
        * *********************************************************************** */
        // 1A. Total Armor Factor Valuation (TM p. 302). A Torso-Mounted Cockpit doubles the center torso armor, front
        // and rear, before any armor type modifier (TO:AUE p.193).
        const doubledCenterTorsoArmor = this.getCockpitType().tag === "torso-mounted"
            ? (this._armorAllocation.centerTorso ?? 0) + (this._armorAllocation.centerTorsoRear ?? 0) : 0;
        let totalArmorFactor = 2.5 * (this.getTotalArmor() + doubledCenterTorsoArmor);
        // Armor type BV modifier (Commercial 0.5, Hardened 2, Reactive/Reflective/Ballistic-Reinforced 1.5, ...).
        // A Blue Shield PFD adds 0.2 to the Armor Type and Internal Structure Type Modifiers (TO:AUE p.194).
        const blueShieldBonus = this._equipmentList.some(item => matchesTag(item, "blue-shield")) ? 0.2 : 0;
        const armorTypeMultiplier = (armor: IArmorType): number => BattleMech._armorBVMultiplier(armor) + blueShieldBonus;
        const armorBVMultiplier = armorTypeMultiplier(this._armorType);
        const isPatchwork = this.isPatchworkArmor();
        if (blueShieldBonus > 0) {
            trace.add("bv2.def.armor.blue-shield", { label: "Blue Shield: +0.2 to the armor and structure type modifiers" });
        }
        if (isPatchwork) {
            // Patchwork: "Calculate the modified Defensive Battle Rating on a location-by-location basis, and
            // then sum the total before multiplying by 2.5" (TO:AUE p.194).
            let modifiedArmorPoints = 0;
            for (const location of this.getPatchworkLocations()) {
                const locationArmor = this.getPatchworkArmorType(location.key);
                const points = this._getPatchworkLocationPoints(location.key) * (doubledCenterTorsoArmor > 0 && location.key === "centerTorso" ? 2 : 1);
                const multiplier = armorTypeMultiplier(locationArmor);
                modifiedArmorPoints += points * multiplier;
                trace.add("bv2.def.armor.patchwork", { label: `Armor, ${location.label} (${locationArmor.name})`, detail: `${points} points x ${multiplier}`, value: points * multiplier });
            }
            totalArmorFactor = 2.5 * modifiedArmorPoints;
            trace.add("bv2.def.armor.patchwork", { label: "Total Armor Factor", detail: `2.5 x ${modifiedArmorPoints}`, value: totalArmorFactor, emphasis: true });
        } else {
            if (doubledCenterTorsoArmor > 0) {
                trace.add("bv2.def.armor.torso-cockpit", { label: "Torso-mounted cockpit: center torso armor counted twice", value: doubledCenterTorsoArmor });
            }
            const armorPoints = this.getTotalArmor() + doubledCenterTorsoArmor;
            totalArmorFactor *= armorBVMultiplier;
            const darkAgeArmor = ["heat-dissipating", "anti-penetrative-ablation", "ballistic-reinforced", "impact-resistant"].includes(this._armorType.tag);
            trace.add(darkAgeArmor ? "bv2.def.armor.dark-age" : "bv2.def.armor", { label: "Armor", detail: `${armorPoints} points x 2.5 x ${armorBVMultiplier} (${this._armorType.name})`, value: totalArmorFactor });
        }
        // Modular Armor: its points count "using the Armor Type Modifier for the armor fitted in the same location"
        // (TO:AUE p.192).
        for (const pack of this.getModularArmorPacks()) {
            const longKey = pack.location ? BattleMech.MECH_LOCATION_MAP[pack.location] : undefined;
            const points = pack.additionalArmor ?? 0;
            if (!longKey || points <= 0) continue;
            const multiplier = isPatchwork ? armorTypeMultiplier(this.getPatchworkArmorType(longKey)) : armorBVMultiplier;
            totalArmorFactor += 2.5 * points * multiplier;
            trace.add("bv2.def.armor.modular", { label: `${pack.name} (${pack.location})`, detail: `${points} points x 2.5 x ${multiplier}`, value: 2.5 * points * multiplier, total: totalArmorFactor });
        }
        // HarJel repair systems: an armor multiplier "only for body sections where a HarJel system is located",
        // stacking with the armor type's own; "every critical slot ... will add -1 to the unit's Defensive BV" (IO:AE p.185).
        let repairSystemSlots = 0;
        const repairedLocations = new Set<string>();
        for (const item of this._equipmentList) {
            if (!item?.armorRepairBVMultiplier) continue;
            repairSystemSlots += this.getCriticalSlots(item.space.battlemech);
            const longKey = item.location ? BattleMech.MECH_LOCATION_MAP[item.location] : undefined;
            if (!longKey || repairedLocations.has(longKey)) continue;
            repairedLocations.add(longKey);
            const allocation = this._armorAllocation as unknown as Record<string, number>;
            const locationArmor = (allocation[longKey] ?? 0) + (allocation[`${longKey}Rear`] ?? 0);
            const locationBVMultiplier = isPatchwork ? armorTypeMultiplier(this.getPatchworkArmorType(longKey)) : armorBVMultiplier;
            const bonus = 2.5 * locationArmor * locationBVMultiplier * (item.armorRepairBVMultiplier - 1);
            totalArmorFactor += bonus;
            trace.add("bv2.def.armor.harjel", { label: `${item.name} in ${longKey}`, detail: `armor x ${item.armorRepairBVMultiplier} on ${locationArmor} points`, value: bonus, total: totalArmorFactor });
        }
        // 1B. Internal Structure Points Valuation (TM p. 302)
        let totalInternalStructurePoints = 1.5 * this._totalInternalStructurePoints;
        // Structure type modifier: Industrial and Composite 0.5, Reinforced 2.
        if (this.hasFrankenMechHybridStructure()) {
            // A FrankenMech of mixed structure: each location's points take their own type's modifier.
            const points = this._internalStructure as unknown as Record<string, number>;
            totalInternalStructurePoints = 0;
            for (const location of this.getFrankenMechLocations()) {
                const structure = this.getFrankenMechLocationStructure(location.key);
                const locationPoints = 1.5 * (points[location.key] ?? 0) * ((structure.bvMultiplier ?? 1) + blueShieldBonus);
                totalInternalStructurePoints += locationPoints;
                trace.add("bv2.def.structure.frankenmech", { label: `Internal structure, ${location.label} (${structure.name})`, detail: `${points[location.key] ?? 0} points x 1.5 x ${(structure.bvMultiplier ?? 1) + blueShieldBonus}`, value: locationPoints });
            }
            trace.add("bv2.def.structure.frankenmech", { label: "Total internal structure", value: totalInternalStructurePoints });
        } else {
            const structureBVMultiplier = (this._selectedInternalStructure?.bvMultiplier ?? 1) + blueShieldBonus;
            totalInternalStructurePoints *= structureBVMultiplier;
            trace.add("bv2.def.structure", { label: "Internal structure", detail: `${this._totalInternalStructurePoints} points x 1.5 x ${structureBVMultiplier} (${this._selectedInternalStructure?.name ?? "Standard"})`, value: totalInternalStructurePoints });
        }
        // 1C. Adjust Internal Structure for Engine Type Safety Factor (TM p. 302 / Errata)
        const engineTag = this._engineType.tag;
        let engineModifier = 1.0;
        switch (engineTag) {
            case "light":
            case "clan_xl":
                engineModifier = 0.75;
                break;
            case "xl":
            case BattleMech.RFE_TAG: // Lost with a side torso as an XL engine is (ours, #267)
                engineModifier = 0.5; // IS XL (TM p.302)
                break;
            case "xxl":
                engineModifier = 0.25; // IS XXL Errata Standard
                break;
            case "clan_xxl":
                engineModifier = 0.50; // Clan XXL Errata Standard
                break;
            default:
                engineModifier = 1.0; // Standard, Compact, Fission, ICE, Cell, Primitive
                break;
        }
        // A Superheavy 'Mech uses the Superheavy Engine Type BV Modifier Table instead (IO:AE p.188).
        if (this.isSuperheavy()) {
            engineModifier = BattleMech.SUPERHEAVY_ENGINE_BV_MODIFIERS[engineTag] ?? 1.0;
        }
        const structureBeforeEngine = totalInternalStructurePoints;
        totalInternalStructurePoints *= engineModifier;
        trace.add(this.isSuperheavy() ? "bv2.def.engine.superheavy" : "bv2.def.engine", { label: `Engine modifier (${engineTag})`, detail: `${structureBeforeEngine} x ${engineModifier}`, value: totalInternalStructurePoints });
        // 1D. Gyro Points Modifier (TM p. 302)
        const gyroType = this.getGyro().tag;
        let gyroModifier = 0.5;
        // A Superheavy 'Mech's gyro, and a gyroless interface-cockpit 'Mech's missing one, count as a standard gyro
        // for BV (IO:AE p.187).
        if (gyroType === "heavy-duty" && this.getTonnage() <= 100) {
            gyroModifier = 1.0;
        }
        const totalGyroPoints = this.getTonnage() * gyroModifier;
        trace.add("bv2.def.gyro", { label: `Gyro (${gyroType})`, detail: `${this.getTonnage()} tons x ${gyroModifier}`, value: totalGyroPoints });
        // 1D-2. Defensive Equipment (TM p. 302): AMS, ECM, active probes, pods, etc. AMS ammo counts
        // here too, capped at the BV of the AMS it feeds (Excessive Ammunition rule).
        let defensiveEquipmentBV = 0;
        let defensiveAmmoBV = 0;
        let defensiveAmmoCap = 0;
        for (const currentItem of this._equipmentList) {
            if (currentItem.isAmmo || currentItem.tag.startsWith("ammo-")) {
                const fedWeapon = this.getAmmoBinWeapon(currentItem);
                if (fedWeapon && this._isDefensiveBVEquipment(fedWeapon)) {
                    const ammoValue = getAmmoBattleValuePerTon(fedWeapon, currentItem) * currentItem.weight;
                    defensiveAmmoBV += ammoValue;
                    trace.add("bv2.def.equipment.ams-ammo", { label: `${currentItem.name} (${currentItem.location})`, detail: `ammunition for ${fedWeapon.name}`, value: ammoValue });
                }
            } else if (this._isDefensiveBVEquipment(currentItem)) {
                defensiveEquipmentBV += currentItem.battleValue || 0;
                if (currentItem.weaponType?.includes("AMS")) {
                    defensiveAmmoCap += currentItem.battleValue || 0;
                }
                trace.add("bv2.def.equipment", { label: `${currentItem.name} (${currentItem.location || "no location"})`, value: currentItem.battleValue || 0 });
            }
        }
        if (defensiveAmmoBV > defensiveAmmoCap) {
            trace.add("bv2.def.equipment.ams-ammo", { label: "Defensive ammunition capped at the AMS BV (Excessive Ammunition rule)", detail: `${defensiveAmmoBV.toFixed(2)} is over ${defensiveAmmoCap}`, value: defensiveAmmoCap });
            defensiveAmmoBV = defensiveAmmoCap;
        }
        defensiveEquipmentBV += defensiveAmmoBV;
        // Armored components: 5% of the protected item's BV for each slot, or 5 for each slot of an item with no BV
        // (TO:AUE p.192). The gyro's BV is its gyro points, as MegaMek and SSW count it.
        for (const armored of this.getArmoredComponentRecords()) {
            const itemBV = armored.item ? (armored.item.battleValue || 0) : armored.record.tag === "gyro" ? totalGyroPoints : 0;
            const value = itemBV > 0 ? itemBV * 0.05 * armored.slots : 5 * armored.slots;
            defensiveEquipmentBV += value;
            trace.add(armored.record.tag === "gyro" && !armored.item ? "bv2.def.equipment.armored-gyro" : "bv2.def.equipment.armored", { label: `Armored ${armored.record.name} (${armored.loc}, ${armored.slots} slot${armored.slots === 1 ? "" : "s"})`, value });
        }
        if (defensiveEquipmentBV !== 0) {
            trace.add("bv2.def.equipment.total", { label: "Total defensive equipment", value: defensiveEquipmentBV });
        }
        // 1E. Get Explosive Ammo Modifiers (TM pp. 302-303)
        let explosiveAmmoModifiers = 0;
        // CASE and CASE II by location.
        const caseMap: Record<string, boolean> = {};
        const caseIIMap: Record<string, boolean> = {};
        // Full CASE only: prototype CASE protects, but its ammunition slots still cost 8 each (IO:AE p.189).
        const fullCaseMap: Record<string, boolean> = {};
        const validLocations = Object.keys(BattleMech.MECH_LOCATION_MAP);
        validLocations.forEach(locShorthand => {
            const longKey = BattleMech.MECH_LOCATION_MAP[locShorthand];
            const critArray: any[] = (this._criticals as any)[longKey] || [];
            caseMap[locShorthand] = this.hasClanCASE()
                || critArray.some(critical => matchesTag(critical, "case") || matchesTag(critical, "case-prototype"));
            fullCaseMap[locShorthand] = this.hasClanCASE() || critArray.some(critical => matchesTag(critical, "case"));
            caseIIMap[locShorthand] = critArray.some(critical => matchesTag(critical, "case-ii") || matchesTag(critical, "clan-case-ii"));
        });
        // The next location inward on the Damage Transfer Diagram (TW p.123), legs left out: CASE II
        // covers its own location and the one that transfers into it, "excepting the legs" (TO:AUE p.193).
        const inward: Record<string, string> = { la: "lt", ra: "rt", lt: "ct", rt: "ct" };
        const hasCaseII = (loc: string): boolean => caseIIMap[loc] || (inward[loc] !== undefined && caseIIMap[inward[loc]]);
        // "Inner Sphere XL engine": three or more engine slots in each side torso, so CASE there cannot
        // save the 'Mech (TM p.302). Light and Clan XL engines take two and count as standard.
        const engineSideSlots = (this.getLargeEngineType() ?? this._engineType).criticals?.[this.getEngineTechBase()]?.lt ?? 0;
        const isClanBase = this._tech.tag === "clan" || this._tech.tag === "mclan";
        // Does an explosive slot in this location cost Battle Value (TM p.302)?
        //  Center torso, legs and head: always.
        //  A side torso: without CASE (a Clan 'Mech's is built in), or with an Inner Sphere XL engine, or a Clan
        //  'Mech's XXL engine "as for Inner Sphere XL Engines" (TO:AUE p.193).
        //  An arm: without CASE of its own, when the torso inward costs BV. CASE in the arm still saves an XL
        //  engine 'Mech, as the MUL, SSW and MegaMek count it, though TM p.302 says "any location".
        // A Superheavy 'Mech counts as a Clan 'Mech where any CASE protects the explosives, else as an Inner Sphere one
        // (IO:AE p.188).
        const isSuperheavy = this.isSuperheavy();
        const isPenalisedLocation = (loc: string, cases: Record<string, boolean> = caseMap): boolean => {
            if (hasCaseII(loc)) return false;
            if (isSuperheavy && cases[loc]) return false;
            if (loc === "lt" || loc === "rt") return !cases[loc] || engineSideSlots >= 3;
            if (loc === "la" || loc === "ra") return !cases[loc] && isPenalisedLocation(inward[loc], cases);
            return true;
        };
        // An explosive component loses 1 BV for each critical slot it fills (TM p.302). Only the first
        // slot of an item carries the item itself; its `crits` is the number of slots in this location.
        // A record can cap the slots counted: an HVAC counts as one slot (TO:AUE p.195).
        const explosiveSlotsCounted = new Map<string, number>();
        // A weapon split between locations (a Heavy Gauss Rifle 9 + 2) counts only its slots in each one.
        const explosiveComponentSlots = (critical: { obj: IEquipmentItem, crits?: number, uuid?: string }, critArray: any[]): number => {
            const item = critical.obj;
            if (!BattleMech._isExplosiveComponent(item)) return 0;
            const inLocation = critical.uuid ? critArray.filter(slot => slot && slot.uuid === critical.uuid).length : 0;
            const slots = Math.max(1, inLocation || (critical.crits ?? 1));
            if (item.explosiveBattleValueSlots === undefined) return slots;
            const key = item.uuid ?? item.tag;
            const counted = explosiveSlotsCounted.get(key) ?? 0;
            const allowed = Math.max(0, Math.min(slots, item.explosiveBattleValueSlots - counted));
            explosiveSlotsCounted.set(key, counted + allowed);
            return allowed;
        };
        // 1F. Explosive ammunition and components, location by location
        const techLabel = isClanBase ? "Clan" : "Inner Sphere";
        ["hd", "ct", "lt", "rt", "la", "ra", "ll", "rl", "cl", "fll", "frl"].forEach(loc => {
            const longKey = BattleMech.MECH_LOCATION_MAP[loc];
            const critArray: any[] = (this._criticals as any)[longKey] || [];
            if (critArray.length === 0) return;
            const penalised = isPenalisedLocation(loc);
            // Spared only because prototype CASE counts: each ammunition slot costs 8, not 15 (IO:AE p.189).
            const prototypeCaseOnly = !penalised && isPenalisedLocation(loc, fullCaseMap);
            // A Clan 'Mech's side torsos and arms were never listed; an Inner Sphere 'Mech's protected locations are.
            const armCaseXl = (loc === "la" || loc === "ra") && engineSideSlots >= 3 && caseMap[loc] && !hasCaseII(loc) && !isSuperheavy;
            const logProtected = !penalised && (!isClanBase || hasCaseII(loc) || armCaseXl);
            const protection = hasCaseII(loc) ? "CASE II" : "CASE";
            const protectedId = armCaseXl ? "bv2.def.explosive.arm-case-xl"
                : isSuperheavy && caseMap[loc] && !hasCaseII(loc) ? "bv2.def.explosive.superheavy" : "bv2.def.explosive.protected";
            critArray.forEach((item) => {
                // Prototype improved jump jets explode when hit (IO:AE p.97): 1 BV a slot, as an explosive component.
                if (item && !item.obj && item.tag === "jj-" + this._jumpJetType.tag && this._jumpJetType.explosive) {
                    if (penalised) {
                        trace.add("bv2.def.explosive.jump-jet", { label: `Explosive component: ${this._jumpJetType.name} in ${longKey} (${techLabel})`, value: -1 });
                        explosiveAmmoModifiers += 1;
                    } else if (logProtected) {
                        trace.add(protectedId, { label: `Explosive component (${this._jumpJetType.name}) in ${longKey} protected by ${protection}. Penalty negated`, value: 0 });
                    }
                    return;
                }
                if (!item || !item.obj) return;
                if (BattleMech._isExplosiveAmmoSlot(item.obj)) {
                    // An Extended Fuel Tank fills several slots, each an ammunition bin (TM p.244).
                    const slotsHere = item.uuid ? critArray.filter(slot => slot && slot.uuid === item.uuid).length : 0;
                    const ammoSlots = item.obj.explosiveAsAmmo ? Math.max(1, slotsHere || (item.crits ?? 1)) : 1;
                    if (penalised) {
                        for (let slot = 0; slot < ammoSlots; slot++) {
                            trace.add(BattleMech._isLAMInternalStore(item.obj) ? "bv2.def.explosive.lam-store" : "bv2.def.explosive.ammo", { label: `Explosive ammunition: ${item.obj.name} in ${longKey} (${techLabel})`, value: -15 });
                            explosiveAmmoModifiers += 15;
                        }
                    } else if (prototypeCaseOnly) {
                        for (let slot = 0; slot < ammoSlots; slot++) {
                            trace.add("bv2.def.explosive.prototype-case", { label: `Explosive ammunition: ${item.obj.name} in ${longKey} behind prototype CASE`, value: -8 });
                            explosiveAmmoModifiers += 8;
                        }
                    } else if (logProtected) {
                        trace.add(protectedId, { label: `Explosive ammunition in ${longKey} protected by ${protection}. Penalty negated`, value: 0 });
                    }
                }
                const componentSlots = explosiveComponentSlots(item, critArray);
                if (componentSlots > 0) {
                    if (penalised) {
                        trace.add("bv2.def.explosive.component", { label: `Explosive component: ${item.obj.name} in ${longKey} (${techLabel})`, value: -componentSlots });
                        explosiveAmmoModifiers += componentSlots;
                    } else if (logProtected) {
                        trace.add(protectedId, { label: `Explosive component (${item.obj.name}) in ${longKey} protected by ${protection}. Penalty negated`, value: 0 });
                    }
                }
            });
        });
        // =====================================================================
        // 1G. COMPILE DEFENSIVE SUBTOTAL (TM p. 303)
        // =====================================================================
        let defensiveSubtotal = totalArmorFactor + totalInternalStructurePoints + totalGyroPoints + defensiveEquipmentBV - explosiveAmmoModifiers - repairSystemSlots;
        if (repairSystemSlots > 0) {
            trace.add("bv2.def.harjel-slots", { label: "HarJel repair system slots (taken off in the Defensive Subtotal)", value: -repairSystemSlots });
        }
        trace.add("bv2.def.subtotal", { label: "Defensive Subtotal", detail: `${totalArmorFactor} + ${totalInternalStructurePoints} + ${totalGyroPoints} + ${defensiveEquipmentBV} - ${explosiveAmmoModifiers}${repairSystemSlots > 0 ? ` - ${repairSystemSlots}` : ""}`, value: defensiveSubtotal, emphasis: true });
        // "These subtractions cannot drop the running total below 1" (TM p.302).
        if (explosiveAmmoModifiers > 0 && defensiveSubtotal < 1) {
            defensiveSubtotal = 1;
            trace.add("bv2.def.floor", { label: "Penalties cannot take the total below 1: Defensive Subtotal set to 1", value: 1 });
        }
        /* *************************************************************************
         * STEP 2: CALCULATE DEFENSIVE FACTOR MODIFIER & STEALTH GEAR - TM p. 304
         * *********************************************************************** */
        // 2A. Gather movement metrics using native speed methods
        const runSpeed = this.getBVRunSpeed();
        const jumpSpeed = this.getBVJumpSpeed();
        // Standard LAMs rate their running TMM on AirMech Flank MP plus the +1 airborne
        // modifier; bimodal LAMs use the normal 'Mech TMM (IO:AE p.186).
        const runModifier = this.hasAirMechMode()
            ? getMovementModifier(this.getAirMechFlankMP()) + 1
            : getMovementModifier(runSpeed);
        if (this.hasAirMechMode()) {
            trace.add("bv2.def.tmm.lam", { label: `LAM: running TMM uses AirMech Flank MP ${this.getAirMechFlankMP()} +1 airborne` });
        }
        // Jumping modifier bonus (TM p. 304); UMU movement earns no jump bonus.
        const jumpModifier = Math.max(jumpSpeed > 0 ? getMovementModifier(jumpSpeed) + 1 : 0, getMovementModifier(this.getUMUSpeed()));
        // Determine the optimal Target Movement Modifier (TMM)
        const moveModifier = Math.max(runModifier, jumpModifier);
        trace.add("bv2.def.tmm", { label: "Best Base TMM", detail: `run ${runModifier}, jump ${jumpModifier}`, value: moveModifier });
        if (this.getUMUSpeed() > 0) {
            trace.add("bv2.def.tmm.umu", { label: "UMU movement modifier counted without the jump bonus" });
        }
        // Calculate baseline Defensive Factor Modifier
        let defensiveFactorModifier = 1 + (moveModifier / 10);
        if (defensiveFactorModifier < 1.0) {
            defensiveFactorModifier = 1.0;
        }
        trace.add("bv2.def.factor", { label: "Base Defensive Factor", detail: `1 + ${moveModifier} / 10`, value: rounded2(defensiveFactorModifier) });
        let factorAdjusted = false;
        const addFactor = (id: string, label: string, bonus: number): void => {
            factorAdjusted = true;
            trace.add(id, { label, value: rounded2(bonus), total: rounded2(defensiveFactorModifier) });
        };
        // 2B. Process Defensive Factor Modifiers for Stealth and Advanced Camouflage Systems
        if (hasBasicStealth) {
            defensiveFactorModifier += 0.2;
            addFactor("bv2.def.factor.stealth", "Stealth armor (+0.2)", 0.2);
        }
        if (hasMimetic) {
            defensiveFactorModifier += 0.3;
            addFactor("bv2.def.factor.stealth", "Mimetic armor (+0.3)", 0.3);
        }
        // Signature systems (TO:AUE pp.112, 148, 161): Null Signature and Chameleon each +2 TMM;
        // Void Signature raises the TMM to 3, or to 4 when it is already 3.
        const hasEquipmentTag = (tag: string) => this._equipmentList.some(item => matchesTag(item, tag));
        if (hasEquipmentTag("null-signature-system") && !hasBasicStealth) {
            defensiveFactorModifier += 0.2;
            addFactor("bv2.def.factor.null-signature", "Null-Signature System (+0.2)", 0.2);
        }
        if (hasEquipmentTag("chameleon-lps")) {
            defensiveFactorModifier += 0.2;
            addFactor("bv2.def.factor.chameleon", "Chameleon Light Polarization Shield (+0.2)", 0.2);
        }
        if (hasEquipmentTag("void-signature-system")) {
            const voidBonus = moveModifier < 3 ? (3 - moveModifier) / 10 : moveModifier === 3 ? 0.1 : 0;
            defensiveFactorModifier += voidBonus;
            addFactor("bv2.def.factor.void-signature", `Void-Signature System (+${voidBonus.toFixed(2)})`, voidBonus);
        }
        if (factorAdjusted) {
            trace.add("bv2.def.factor", { label: "Defensive Factor", value: rounded2(defensiveFactorModifier) });
        }
        // 2C. Apply the defensive factor to the defensive subtotal (TM p. 303)
        let finalDefensiveBattleRating = defensiveSubtotal * defensiveFactorModifier;
        // Canonical Floor Check Rule Enforced (TM p. 303: "Minimum rating threshold of 1")
        if (finalDefensiveBattleRating < 1.0) {
            finalDefensiveBattleRating = 1.0;
            trace.add("bv2.def.floor", { label: "The Defensive Battle Rating cannot fall below 1", value: 1 });
        }
        // Lock down the tracking properties safely
        this._defensiveBattleRating = finalDefensiveBattleRating;
        trace.add("bv2.def.rating", { label: "Defensive Battle Rating", detail: `${rounded2(defensiveSubtotal)} x ${rounded2(defensiveFactorModifier)}`, value: this._defensiveBattleRating, emphasis: true });
        
                /* *************************************************************************
         * STEP 3: CALCULATE OFFENSIVE BATTLE RATING - TechManual p. 303
         * *********************************************************************** */

        const ammoBV: Record<string, number> = {};
        const weaponBV: Record<string, number> = {};
        let totalAmmoBV = 0;

        // 3A. Inventory Scan & Base Value Distribution (TM p. 303)
        for (let eqC = 0; eqC < this._equipmentList.length; eqC++) {
            const currentItem = this._equipmentList[eqC];
            const baseValue = this._getWeaponBattleValue(currentItem);

            if (currentItem.isAmmo || currentItem.tag.startsWith("ammo-")) {
                // Ammo feeds weapons by family, so group each bin under the weapon it is loaded for.
                const fedWeapon = this.getAmmoBinWeapon(currentItem);
                if (!fedWeapon) {
                    trace.add("bv2.off.ammo.unused", { label: `Ignoring ammunition: ${currentItem.name} (${currentItem.location}), no mounted weapon fires it`, value: 0 });
                    continue;
                }
                if (this._isDefensiveBVEquipment(fedWeapon)) {
                    continue; // counted with defensive equipment (step 1D-2)
                }
                if (!ammoBV[fedWeapon.tag]) {
                    ammoBV[fedWeapon.tag] = 0;
                }
                // Ammunition BV = per-ton BV for the launcher it feeds x Tonnage Mass (TM p. 303)
                const perTonValue = getAmmoBattleValuePerTon(fedWeapon, currentItem);
                const assignedAmmoValue = perTonValue * currentItem.weight;
                ammoBV[fedWeapon.tag] += assignedAmmoValue;

                trace.add("bv2.off.ammo", { label: `${currentItem.name} (${currentItem.location})`, detail: `for ${fedWeapon.name}: ${perTonValue} BV x ${currentItem.weight} tons`, value: assignedAmmoValue });
            } else if (!this._isDefensiveBVEquipment(currentItem)) {
                // Accumulate weapon totals to handle duplicate weapons correctly for the Excessive Ammo Cap
                if (!weaponBV[currentItem.tag]) {
                    weaponBV[currentItem.tag] = 0;
                }
                weaponBV[currentItem.tag] += baseValue;
            }
        }

        // 3B. Map and Simplify Ammunition to Parent Weapon Structures
        const simplifiedAmmoBV: Record<string, number> = { ...ammoBV };

        // 3C. Enforce Excessive Ammunition Rule Cap (TM p. 303)
        for (const ammoKey in simplifiedAmmoBV) {
            if (weaponBV[ammoKey]) {
                const totalAllowedCap = weaponBV[ammoKey];
                if (simplifiedAmmoBV[ammoKey] > totalAllowedCap) {
                    trace.add("bv2.off.ammo.cap", { label: `Excessive Ammunition: ammo for ${ammoKey} capped at its weapons' BV`, detail: `${simplifiedAmmoBV[ammoKey].toFixed(2)} is over ${totalAllowedCap.toFixed(2)}`, value: totalAllowedCap });
                    simplifiedAmmoBV[ammoKey] = totalAllowedCap;
                }
                totalAmmoBV += simplifiedAmmoBV[ammoKey];
            }
        }

        if (totalAmmoBV !== 0) {
            trace.add("bv2.off.ammo.total", { label: "Total ammunition BV", value: totalAmmoBV });
        }

        // 3D. Engine Thermal Dissipation Capacity Evaluation (TM p. 303)
        let mechHeatEfficiency = 6; // Baseline structural buffer
        const sinkEfficiencyMultiplier = this._heatSinkType.dissipation;
        
        // Total Heat Dissipation Capacity = 6 + Total Dissipation Points - Max Movement Heat.
        // Prototype double heat sinks and Freezers beside single heat sinks (IO:AE p.65).
        let heatSinkCapacity = this.getHeatSinks() * sinkEfficiencyMultiplier + this.getEquipmentHeatDissipation();
        // Radical Heat Sink System: IO:AE p.185 says "multiply the unit's normal heat sink capacity by 1.4", but its
        // example gives 15 double heat sinks a capacity of 36 (30 + 15 x 0.4), as MegaMek, SSW and the MUL count it.
        if (this._equipmentList.some(item => matchesTag(item, "radical-heat-sink-system"))) {
            const radical = heatSinkCapacity + Math.ceil(this.getHeatSinks() * 0.4);
            trace.add("bv2.off.heat.radical", { label: "Radical Heat Sink System", detail: `heat sink capacity ${heatSinkCapacity} + ${this.getHeatSinks()} heat sinks x 0.4`, value: radical });
            heatSinkCapacity = radical;
        }
        mechHeatEfficiency += heatSinkCapacity - this.getMaxMovementHeat();
        // Signature systems run hot whenever they are on: their heat comes off the pool like Stealth Armor's 10
        // (TM p.303), not after the weapons (Null and Void Signature 10, Chameleon LPS 6; TO:AUE pp.112, 148, 161),
        // as MegaMek, SSW and the MUL count it.
        const isSignatureSystem = (item: IEquipmentItem): boolean => BattleMech.SIGNATURE_SYSTEM_TAGS.some(tag => matchesTag(item, tag));
        for (const item of this._equipmentList.filter(isSignatureSystem)) {
            mechHeatEfficiency -= item.heat || 0;
            trace.add("bv2.off.heat.signature", { label: `${item.name}: heat taken off the heat efficiency`, value: -(item.heat || 0) });
        }
        // Partial wing: +3 heat capacity in a standard atmosphere (TO:AUE p.105).
        const partialWingHeatBonus = this.getPartialWingHeatBonus();
        mechHeatEfficiency += partialWingHeatBonus;
        if (partialWingHeatBonus !== 0) {
            trace.add("bv2.off.heat.partial-wing", { label: "Partial wing heat bonus", value: partialWingHeatBonus });
        }
        // LAMs add 9 instead of 6 to heat capacity (IO:AE p.186). The +3 matches AirMech mode's
        // partial-wing heat bonus (IO:AE p.107), so bimodal LAMs, which have no AirMech mode,
        // keep the 'Mech value (as MegaMek also reads it; IO does not say).
        if (this.hasAirMechMode()) {
            mechHeatEfficiency += 3;
            trace.add("bv2.off.heat.lam", { label: `LAM: heat capacity +9 instead of +6; movement heat ${this.getMaxMovementHeat()} from AirMech Flank MP / 3` });
        }
        // RISC Emergency Coolant System: +4 to Heat Efficiency (IO:AE p.190).
        if (this._equipmentList.some(item => matchesTag(item, "risc-emergency-coolant-system"))) {
            mechHeatEfficiency += 4;
            trace.add("bv2.off.heat.emergency-coolant", { label: "RISC Emergency Coolant System: +4 heat efficiency", value: 4 });
        }
        // Coolant Pods: heat sinks x pods / 5, rounded up, at most twice the number of heat sinks (TO:AUE p.193).
        const coolantPods = this._equipmentList.filter(item => item?.coolantPod).length;
        if (coolantPods > 0) {
            const coolantPodCapacity = Math.min(Math.ceil(this.getHeatSinks() * coolantPods / 5), this.getHeatSinks() * 2);
            mechHeatEfficiency += coolantPodCapacity;
            trace.add("bv2.off.heat.coolant-pod", { label: "Coolant pods", detail: `${coolantPods} x ${this.getHeatSinks()} heat sinks / 5`, value: coolantPodCapacity });
        }
        
        trace.add("bv2.off.heat.efficiency", { label: "Heat efficiency", detail: `6 + ${heatSinkCapacity} heat sink capacity - ${this.getMaxMovementHeat()} movement heat`, value: mechHeatEfficiency });

        // 3E. Weapon Heat Multiplier Mapping (TM p. 303 / Errata updates)
        let totalWeaponHeat = 0;
        const heatLogFragments: string[] = [];

        for (let eqC = 0; eqC < this._equipmentList.length; eqC++) {
            const currentItem = this._equipmentList[eqC];
            if (currentItem.isAmmo || currentItem.tag.startsWith("ammo-") || this._isDefensiveBVEquipment(currentItem)) continue;
            if (isSignatureSystem(currentItem)) {
                currentItem.bvHeat = 0;
                continue;
            }

            // An insulated laser counts 1 less heat (TO:AUE p.194); prototype lasers count their IO:AE p.189 heat.
            let baseHeat = getMountedHeat(currentItem, currentItem.battleValueHeat ?? +(currentItem.heat || 0));
            // "Include the heat generated by the capacitor with that generated by the weapon" (TO:AUE p.194): +5 (p.149).
            if (/(^|-)ppc-capacitor$/.test(currentItem.tag)) baseHeat += 5;
            // Equipment with no BV and no heat (CASE II, a Nail Gun) adds nothing to the weapon steps.
            if (baseHeat === 0 && this._getWeaponBattleValue(currentItem) === 0) {
                currentItem.bvHeat = 0;
                continue;
            }

            // Apply specific ruleset multipliers for alternative fire modes
            if (currentItem.isOneShot) {
                baseHeat /= 4; // OS Heat adjustment
            } else if (currentItem.isStreak) {
                baseHeat /= 2; // Streak Heat adjustment
            } else if (currentItem.isUltra) {
                baseHeat *= 2; // Ultra RAC double fire expansion
            } else if (currentItem.isRotary) {
                baseHeat *= 6; // Rotary RAC multi-shot expansion
            }

            currentItem.bvHeat = baseHeat;
            totalWeaponHeat += baseHeat;
            heatLogFragments.push(`${baseHeat}`);
        }

        trace.add("bv2.off.heat.weapons", { label: "Total weapon heat", detail: heatLogFragments.length > 0 ? heatLogFragments.join(" + ") : "0", value: totalWeaponHeat });

        // 3F. Dynamic Weapon Arc & Thermal Efficiency Splitting Loop (TM pp. 303-304)
        let runningTotal = 0;
        let runningHeat = 0;
        let inHalfCost = false;

        // Rear-firing torso, leg and head weapons count half; when they are worth more than the
        // forward-firing weapons in those locations, the forward-firing ones are halved instead (TM p.303).
        // Turret-mounted items count in the front arc when the forward non-turret weapons are worth more than the
        // rear ones, otherwise in the rear (TO:AUE p.194), and then weigh in that arc.
        const frontBV = this.getTotalBVFrontWeapons();
        const rearBV = this.getTotalBVRearWeapons();
        const turretRear = !(frontBV > rearBV);
        const turretBV = this._totalTorsoHeadLegWeaponBV("turret");
        const isRearDominant = frontBV + (turretRear ? 0 : turretBV) < rearBV + (turretRear ? turretBV : 0);
        const firesRear = (item: IEquipmentItem): boolean => this.isTurretMounted(item) ? turretRear : !!item.rear;
        const arcMultiplier = (item: IEquipmentItem): number => {
            if (this.isNotOnTorsoHeadOrLegs(this._firingArcLocation(item))) return 1;
            return firesRear(item) === isRearDominant ? 1 : 0.5;
        };
        // The heat steps take the weapon with the highest Modified BV first and, between equals, the one
        // that generates the least heat (TM p.303). A copy is sorted: the installed list keeps its order.
        const weaponsByModifiedBV = this._equipmentList
            .filter(item => !(item.isAmmo || item.tag.startsWith("ammo-") || this._isDefensiveBVEquipment(item)))
            .filter(item => (item.bvHeat || 0) > 0 || this._getWeaponBattleValue(item) > 0)
            .map(item => ({ item, modifiedBV: this._getWeaponBattleValue(item) * arcMultiplier(item) }))
            .sort((a, b) => b.modifiedBV - a.modifiedBV || (a.item.bvHeat || 0) - (b.item.bvHeat || 0))
            .map(entry => entry.item);

        for (const currentItem of weaponsByModifiedBV) {
            const baseBV = this._getWeaponBattleValue(currentItem);
            const weaponHeat = currentItem.bvHeat || 0;
            let finalWeaponMultiplier = 1.0;

            // Resolve explicit firing arc boundaries
            const isFlexibleLimb = this.isNotOnTorsoHeadOrLegs(this._firingArcLocation(currentItem));
            const waiveRearPenalty = isRearDominant || isFlexibleLimb;

            const weaponNotes: string[] = [`Base BV ${baseBV}, heat ${weaponHeat}`];
            let arcHalved = false;
            let heatHalved = false;
            if (firesRear(currentItem)) {
                if (!waiveRearPenalty) {
                    weaponNotes.push("halved: rear arc");
                    arcHalved = true;
                    finalWeaponMultiplier *= 0.5;
                }
            } else {
                if (isRearDominant && !isFlexibleLimb) {
                    weaponNotes.push("halved: forward arc, rear weapons are worth more");
                    arcHalved = true;
                    finalWeaponMultiplier *= 0.5;
                }
            }

            // Apply Heat Inefficiency Half-Cost Rules (TM p. 304)
            if (totalWeaponHeat >= mechHeatEfficiency) {
                if (inHalfCost && weaponHeat > 0) {
                    finalWeaponMultiplier *= 0.5;
                    weaponNotes.push("halved: over heat efficiency");
                    heatHalved = true;
                }

                runningHeat += weaponHeat;

                if (!inHalfCost && runningHeat >= mechHeatEfficiency && weaponHeat > 0) {
                    inHalfCost = true;
                    weaponNotes.push("this weapon reaches the heat efficiency; later weapons count half");
                }
            }

            runningTotal += baseBV * finalWeaponMultiplier;
            const weaponCites: ICalcCitation[] = [];
            if (this.hasTargetingComputer() && isTargetingComputerWeapon(currentItem)) weaponCites.push(MECH_BV2_WEAPON_CITES.targetingComputer);
            if (currentItem.linkedWeaponTags?.length) weaponCites.push(MECH_BV2_WEAPON_CITES.machineGunArray);
            if (this._hasArmAES(currentItem.location)) weaponCites.push(MECH_BV2_WEAPON_CITES.actuatorEnhancement);
            if (this.hasDroneOperatingSystem()) weaponCites.push(MECH_BV2_WEAPON_CITES.droneOperatingSystem);
            if (/(^|-)ppc-capacitor$/.test(currentItem.tag)) weaponCites.push(MECH_BV2_WEAPON_CITES.ppcCapacitor);
            const turretMounted = this.isTurretMounted(currentItem);
            trace.add(heatHalved ? "bv2.off.weapon.overheat" : arcHalved ? "bv2.off.weapon.rear" : turretMounted ? "bv2.off.weapon.turret" : "bv2.off.weapon", {
                label: `${currentItem.name} (${(currentItem.location || "no location") + (turretMounted ? ", turret" : "")})`,
                detail: weaponNotes.join("; "),
                value: baseBV * finalWeaponMultiplier,
                total: runningTotal,
                cites: weaponCites,
            });
        }

        // 3G. Finalize Offensive Calculations & Apply TSM Tonnage Modifiers (TM p. 303)
        const totalWeaponBV = runningTotal;
        trace.add("bv2.off.weapons.total", { label: "Total weapon BV", value: totalWeaponBV, emphasis: true });

        let modifiedMechTonnage = this.getTonnage();

        // AES: +0.1 for each limb mounting one: arms, and every leg (biped 0.2, tripod 0.3, quad 0.4) (TO:AUE p.192).
        const aesMultiplier = this.getAESBVMultiplier();
        if (aesMultiplier !== 1) {
            modifiedMechTonnage *= aesMultiplier;
            trace.add("bv2.off.tonnage.aes", { label: "Actuator Enhancement System: tonnage modified", detail: `${this.getTonnage()} tons x ${aesMultiplier}`, value: modifiedMechTonnage });
        }
        if (this._myomerType.bvWeightMultiplier !== 1) {
            // TSM x 1.5, Industrial TSM x 1.15 (TM p. 303)
            modifiedMechTonnage *= this._myomerType.bvWeightMultiplier;
            trace.add("bv2.off.tonnage.tsm", { label: `${this._myomerType.name}: tonnage modified`, detail: `${this.getTonnage()} tons x ${this._myomerType.bvWeightMultiplier}`, value: modifiedMechTonnage });
        }

        const baseOffensiveRating = totalWeaponBV + totalAmmoBV + modifiedMechTonnage;
        trace.add("bv2.off.tonnage", { label: "Tonnage", detail: `weapons ${totalWeaponBV.toFixed(2)} + ammunition ${totalAmmoBV.toFixed(2)} + tonnage ${modifiedMechTonnage}`, value: modifiedMechTonnage, total: baseOffensiveRating });

        // 3H. Apply Speed Factor Scaling Multiplier (TM p. 304)
        const speedFactorModifier = this._getSpeedFactorModifier();
        let finalOffensiveBattleRating = baseOffensiveRating * speedFactorModifier;
        if (this.hasAirMechMode()) {
            trace.add("bv2.off.speed.lam", { label: "LAM: speed factor uses AirMech mode movement" });
        }
        trace.add("bv2.off.speed", { label: "Speed Factor", value: speedFactorModifier });
        trace.add("bv2.off.rating", { label: "Offensive Battle Rating", detail: `${baseOffensiveRating.toFixed(2)} x ${speedFactorModifier}`, value: finalOffensiveBattleRating, emphasis: this.hasAdvancedFireControl() });
        // "IndustrialMechs, unless equipped with Advanced Fire Control (see p. 69), multiply their
        // Offensive Battle Rating by 0.9" (TM p.304).
        if (!this.hasAdvancedFireControl()) {
            trace.add("bv2.off.industrial", { label: "IndustrialMech without Advanced Fire Control", detail: `${finalOffensiveBattleRating.toFixed(2)} x 0.9`, value: finalOffensiveBattleRating * 0.9, emphasis: true });
            finalOffensiveBattleRating *= 0.9;
        }
        this._offensiveBattleRating = finalOffensiveBattleRating;

        /* *************************************************************************
         * STEP 4: CALCULATE FINAL BATTLE VALUE - TechManual p. 304
         * *********************************************************************** */

        // Pull verified class values calculated in previous steps
        const currentDBR = this._defensiveBattleRating;
        const currentOBR = this._offensiveBattleRating;
        
        let finalBattleValue = currentDBR + currentOBR;
        trace.add("bv2.final.sum", { label: "Defensive + Offensive Battle Rating", detail: `${currentDBR.toFixed(2)} + ${currentOBR.toFixed(2)}`, value: finalBattleValue });

        // Small (TM p.304) and Torso-Mounted (TO:AUE p.193) cockpits multiply the BV by 0.95; a drone takes no
        // cockpit modifier (TO:AUE p.192).
        const cockpitBVMultiplier = this.hasDroneOperatingSystem() ? 1 : this.getCockpitType().bvMultiplier ?? 1;
        if (cockpitBVMultiplier !== 1) {
            finalBattleValue *= cockpitBVMultiplier;
            trace.add("bv2.final.cockpit", { label: `${this.getCockpitType().name}: total multiplied by ${cockpitBVMultiplier}`, value: finalBattleValue });
        }
        if (this._roboticControl !== "none") {
            finalBattleValue *= SRCS_BATTLE_VALUE_MULTIPLIER;
            trace.add("bv2.final.robotic", { label: `${this.getRoboticControl().name}: total multiplied by ${SRCS_BATTLE_VALUE_MULTIPLIER}`, value: finalBattleValue });
        }

        // Equipment that multiplies the final BV, once per kind (RISC Heat Sink Override Kit x1.01, IO:AE p.190).
        const finalMultipliers = new Map<string, IEquipmentItem>();
        for (const item of this._equipmentList) {
            if (item?.battleValueFinalMultiplier) finalMultipliers.set(item.tag, item);
        }
        finalMultipliers.forEach(item => {
            finalBattleValue *= item.battleValueFinalMultiplier!;
            trace.add(item.tag === "drone-operating-system" ? "bv2.final.drone" : item.tag === "risc-heat-sink-override-kit" ? "bv2.final.override-kit" : "bv2.final.equipment",
                { label: `${item.name}: total multiplied by ${item.battleValueFinalMultiplier}`, value: finalBattleValue });
        });

        // Execute absolute rounding to whole integer values (TM p. 304)
        const absoluteRoundedBV = Math.round(finalBattleValue);
        
        // LAM bombs add their BV to the base BV before the skill multiplier, as external stores do on
        // fighters (TM p.315). Provisional: IO:AE's LAM BV rules (p.186) do not say bombs follow that rule.
        const bombBV = this.getBombBattleValue();
        if (bombBV > 0) {
            trace.add("bv2.final.lam-bombs", { label: "Loaded bombs (external stores)", value: bombBV, total: absoluteRoundedBV + bombBV });
        }
        trace.add("bv2.final.round", { label: "Battle Value", detail: `${finalBattleValue.toFixed(2)} rounded${bombBV > 0 ? `, plus ${bombBV} for bombs` : ""}`, value: absoluteRoundedBV + bombBV, emphasis: true });

        // Commit values into the master class structures
        this._battleValue = absoluteRoundedBV + bombBV;
        this._battleValueSteps = trace.steps;
        // The log is the design's own edition's breakdown: its BV1 steps under a BV1 edition, and the one line saying so
        // under an edition without Battle Value.
        this._battleValue1.clear();
        const own = this._getBattleValueBreakdown(this._rulesEdition);
        if (own.scheme === "bv1") this._battleValue1.set(this._rulesEdition, own.result as number);
        this._calcLogBV = renderCalcStepsHtml(own.steps);

        // Trigger secondary tracking updates for personnel/skills assignment
        this._setPilotAdjustedBattleValue();
    }

    /**
     * Applies pilot experience skill tracking multipliers to determine final deployment BV.
     * Uses the skill table that goes with the 'Mech's edition's BV: that edition's own for a BV1 once entered, and
     * the TechManual's (p. 315) for BV2 (plan ruling 2).
     */
    private _setPilotAdjustedBattleValue(): void {
        // Fetch raw pilot credentials with safe default constraints
        const [gunnery, piloting] = this._getBattleValueSkills(this._rulesEdition);
        let skillMultiplier = 1.0;
        const matrixMultiplier = getSkillMultiplier(gunnery, piloting, "mech", getBattleValueSkillEdition(this._rulesEdition, "mech"));
        if (matrixMultiplier !== null) {
            skillMultiplier = matrixMultiplier;
        }
        // Calculate finalized personnel metrics and round to whole integer steps
        const baseBattleValue = this.getBattleValue();
        this._pilotAdjustedBattleValue = Math.round(baseBattleValue * skillMultiplier);
    }

    /**
     * Offensive Speed Factor (TechManual p. 316).
     *
     * Speed Factor MP = Run MP + round( Jump MP / 2 )
     * Speed Factor    = ( 1 + ( MP - 5 ) / 10 ) ^ 1.2, rounded to two decimal places
     *
     * The Speed Factor Table in the TechManual is this formula evaluated for MP 0-25, so one formula covers every
     * speed (same implementation as MegaMek's BVCalculator.offensiveSpeedFactor / offensiveSpeedFactorMP).
     */
    private _getSpeedFactorModifier(): number {
        // Speed Factor MP (TM p.316). Standard LAMs use 'Mech Run MP + half AirMech Flank MP, rounded normally (IO:AE p.186);
        // other 'Mechs use the better of Jump MP and UMU MP (TO:AUE p.107).
        const speedFactorMP = this.hasAirMechMode()
            ? this.getBVRunSpeed() + Math.round(this.getAirMechFlankMP() / 2)
            : this.getBVRunSpeed() + Math.round(Math.max(this.getBVJumpSpeed(), this.getUMUSpeed()) / 2);

        // Units without valid movement data (NaN/Infinity) fall back to the MP 0 factor instead of poisoning BV.
        return getSpeedFactor(speedFactorMP);
    }

    /**
     * BV1 (BMR pp.139-141 with the FanPro errata p.12; BMR(R) pp.152-154), from `edition`'s equipment tables (BMR
     * pp.142-144, BMR(R) pp.156-158) and its printing of Maximum Tech for Level 3 (pp.90-92). Fractions are kept to the
     * end. `trace` collects the cited steps when given (the edition's table from getMechBv1Steps).
     */
    private _calcBattleValue1(edition: string, trace?: CalcTrace, tagged = false): number {
        const fmt = formatCalcNumber;
        const isAmmo = (item: IEquipmentItem) => item.isAmmo || item.tag.startsWith("ammo-");
        const isDefensive = isBattleValue1Defensive;
        // Maximum Tech's Level 3 rules (pp.90-92), in the printing that goes with the edition.
        const levelThree = getBattleValueRules(edition, "mech").levelThree;
        const rate = (item: IEquipmentItem, weapon?: IEquipmentItem) => rateBattleValue1(edition, this._tech.tag, tagged, item, weapon);
        const valueOf = (item: IEquipmentItem, weapon?: IEquipmentItem) => rate(item, weapon).value;
        const binWeapon = (bin: IEquipmentItem) => this.getAmmoBinWeapon(bin);
        // The step an item's figure belongs to: the edition's tables, Maximum Tech's table or rule, or neither.
        const itemStep = (source: string, listed: string) =>
            source === "unlisted" ? "bv1.off.weapon.unlisted" : source === "level-three" ? "bv1.l3.item" : source === "artemis-v" ? "bv1.l3.item.artemis-v" : listed;

        // Step 1: Defensive Battle Rating (BMR(R) pp.152-153). Level 3 engines read their own multiplier, reinforced
        // structure counts double and composite half (Maximum Tech pp.91-92).
        const engineTag = (this.getLargeEngineType() ?? this._engineType).tag;
        const levelThreeEngine = levelThree?.engines[engineTag];
        const engineFactor = levelThreeEngine ?? ({ xl: 0.75, light: 1.125, clan_xl: 1.125, [BattleMech.RFE_TAG]: 0.75 } as Record<string, number>)[this._engineType.tag] ?? 1.5;
        const structureTypeFactor = levelThree ? ({ reinforced: 2, composite: 0.5 } as Record<string, number>)[this.getInternalStructureType()] ?? 1 : 1;
        const structureFactor = engineFactor * structureTypeFactor;
        // Hardened armor points count x 4, patchwork ones too (Maximum Tech pp.90-91).
        const hardened = !levelThree ? 0 : this.isPatchworkArmor()
            ? this.getPatchworkLocations().reduce((sum, location) => sum + (this.getPatchworkArmorType(location.key)?.tag === "hardened" ? this._getPatchworkLocationPoints(location.key) : 0), 0)
            : this._armorType.tag === "hardened" ? this.getTotalArmor() : 0;
        const armor = (this.getTotalArmor() + hardened) * 2;
        const structure = this._totalInternalStructurePoints * structureFactor;
        trace?.add("bv1.def.armor", { label: "Armor", detail: `${this.getTotalArmor()} points x 2`, value: this.getTotalArmor() * 2 });
        if (hardened) trace?.add("bv1.l3.def.armor.hardened", { label: "Hardened armor counts x 4", detail: `${hardened} points x 2 more`, value: hardened * 2 });
        const structureStep = levelThreeEngine !== undefined ? "bv1.l3.def.engine" : this._engineType.tag === "clan_xl" ? "bv1.def.structure.clan-xl"
            : this._engineType.tag === "light" ? "bv1.def.structure.light-engine" : "bv1.def.structure";
        trace?.add(structureStep, { label: `Internal structure (${this._engineType.name})`, detail: `${this._totalInternalStructurePoints} points x ${engineFactor}`, value: this._totalInternalStructurePoints * engineFactor });
        if (structureTypeFactor !== 1) {
            trace?.add("bv1.l3.def.structure-type", { label: `${structureTypeFactor === 2 ? "Reinforced" : "Composite"} internal structure`, detail: `structure value x ${structureTypeFactor}`, value: structure - this._totalInternalStructurePoints * engineFactor });
        }
        trace?.add("bv1.def.tonnage", { label: "Tonnage", value: this.getTonnage() });

        // Defensive equipment: anti-missile systems with their ammunition, A-Pods and ECM.
        const defensiveAmmo = getBattleValue1Ammo(this._equipmentList, binWeapon, valueOf, true);
        let defensiveGear = defensiveAmmo
            + this._equipmentList.reduce((sum, item) => sum + (!isAmmo(item) && isDefensive(item) ? valueOf(item) : 0), 0);
        if (trace) {
            for (const item of this._equipmentList) {
                if (isAmmo(item) || !isDefensive(item)) continue;
                const rating = rate(item);
                if (rating.value) trace.add(itemStep(rating.source, "bv1.def.equipment"), { label: item.name, value: rating.value });
            }
            if (defensiveAmmo) trace.add("bv1.def.equipment", { label: "Ammunition for defensive equipment", value: defensiveAmmo });
        }
        if (levelThree) {
            // Heavy-duty gyro +30, command console +25, 5 a slot of component armor; a torso-mounted cockpit adds the
            // center torso armor, front and rear, x 2 (Maximum Tech pp.91-92).
            const centerTorsoArmor = this.getCockpitType().tag === "torso-mounted" ? (this._armorAllocation.centerTorso ?? 0) + (this._armorAllocation.centerTorsoRear ?? 0) : 0;
            const heavyDutyGyro = this.getGyro().tag === "heavy-duty";
            const armoredSlots = this.getArmoredComponentRecords().reduce((sum, armored) => sum + armored.slots, 0);
            // Enhanced Imaging takes 25 off (p.91).
            defensiveGear += (heavyDutyGyro ? 30 : 0) + (this.hasCommandConsole() ? 25 : 0) - (this.hasEnhancedImaging() ? 25 : 0)
                + 5 * armoredSlots + centerTorsoArmor * 2;
            if (heavyDutyGyro) trace?.add("bv1.l3.def.gyro", { label: "Heavy-duty gyro", value: 30 });
            if (this.hasCommandConsole()) trace?.add("bv1.l3.def.command-console", { label: "Command console", value: 25 });
            if (this.hasEnhancedImaging()) trace?.add("bv1.l3.def.enhanced-imaging", { label: "Enhanced Imaging", value: -25 });
            if (armoredSlots) trace?.add("bv1.l3.def.component-armor", { label: "Component armor", detail: `${armoredSlots} slots x 5`, value: 5 * armoredSlots });
            if (centerTorsoArmor) trace?.add("bv1.l3.def.torso-cockpit", { label: "Torso-mounted cockpit", detail: `${centerTorsoArmor} center torso armor x 2`, value: centerTorsoArmor * 2 });
        }
        // 20 a ton of explosive ammo, a Gauss rifle counting as a ton. Clan: center torso, legs and head; Inner Sphere
        // XL engine: anywhere; otherwise also a side torso without CASE, or an arm without CASE there or inward (BMR(R)
        // p.153); under the Master Rules errata (p.12) only CASE inward excuses an arm. Level 3: CASE II protects as CASE
        // does, and ammo it covers costs 5 a ton (Maximum Tech p.92).
        const innerSphereXL = ((this.getLargeEngineType() ?? this._engineType).criticals?.[this.getEngineTechBase()]?.lt ?? 0) >= 3;
        const caseIn = (loc: string, tags: string[]) => ((this._criticals as any)[BattleMech.MECH_LOCATION_MAP[loc]] || [])
            .some((critical: any) => tags.some(tag => matchesTag(critical, tag)));
        const caseII = (loc: string) => !!levelThree && caseIn(loc, ["case-ii", "clan-case-ii"]);
        const hasCase = (loc: string) => this.hasClanCASE() || caseIn(loc, ["case", "case-prototype"]) || caseII(loc);
        const inward: Record<string, string> = { la: "lt", ra: "rt" };
        const armCaseInwardOnly = !!getBattleValueRules(edition, "mech").armCaseInwardOnly;
        const penalised = (loc: string) => innerSphereXL || !["lt", "rt", "la", "ra"].includes(loc)
            || (inward[loc] ? !(hasCase(inward[loc]) || (!armCaseInwardOnly && hasCase(loc))) : !hasCase(loc));
        let explosive = 0;
        for (const item of this._equipmentList) {
            const tons = BattleMech._isExplosiveAmmoSlot(item) ? item.weight : BattleMech._isExplosiveComponent(item) && item.gauss ? 1 : 0;
            if (tons > 0 && item.location && BattleMech.MECH_LOCATION_MAP[item.location] && penalised(item.location)) {
                const perTon = caseII(item.location) ? 5 : 20;
                explosive += perTon * tons;
                trace?.add(perTon === 5 ? "bv1.l3.def.case-ii" : "bv1.def.explosive", {
                    label: `Explosive: ${item.name} in the ${getLocationName(item.location, this._hasFrontLegs()).toLowerCase()}${perTon === 5 ? " behind CASE II" : ""}`,
                    detail: `${fmt(tons)} ${tons === 1 ? "ton" : "tons"} x ${perTon}`, value: -perTon * tons,
                });
            }
        }
        // Maximum potential heat: every weapon but the rear-firing ones (Ultra x 2, Streak / 2), plus running or
        // jumping, whichever is hotter; Stealth armor +10 (in the movement heat). Level 3: with Multi-Trac II the rear
        // weapons count in the heat and at full value (Maximum Tech p.91).
        const multiTracII = !!levelThree && this._equipmentList.some(item => matchesTag(item, "targeting-multi-trac-ii"));
        const firing = this._equipmentList.filter(item => !isAmmo(item) && !isDefensive(item));
        const statsEdition = getBattleValueEdition(edition);
        const heatOf = (item: IEquipmentItem) => (getEditionStats(item, statsEdition)?.heat ?? item.heat ?? 0) * (item.isUltra ? 2 : item.isStreak ? 0.5 : 1);
        const maxHeat = firing.filter(item => multiTracII || !item.rear).reduce((sum, item) => sum + heatOf(item), 0) + this.getMaxMovementHeat();
        // Level 3: each coolant pod adds 1 (Maximum Tech p.92).
        const coolantPods = levelThree ? this._equipmentList.filter(item => item?.coolantPod).length : 0;
        const sinkCapacity = this.getHeatSinks() * this._heatSinkType.dissipation + this.getEquipmentHeatDissipation() + coolantPods;
        const heatPenalty = Math.max(0, maxHeat - sinkCapacity) * 5;
        const stealth = this._armorType.tag === "stealth-basic";
        if (stealth) trace?.add("bv1.def.heat.stealth", { label: "Stealth armor", detail: "10 heat, counted in the maximum heat" });
        if (coolantPods) trace?.add("bv1.l3.def.coolant-pod", { label: "Coolant pods", detail: `${coolantPods} added to the heat sink capacity` });
        if (heatPenalty) trace?.add("bv1.def.heat", { label: "Heat the heat sinks cannot shed", detail: `(${fmt(maxHeat)} maximum heat - ${fmt(sinkCapacity)} heat sink capacity) x 5`, value: -heatPenalty });
        // The subtractions cannot take the total below 1.
        const unfloored = armor + structure + this.getTonnage() + defensiveGear - explosive - heatPenalty;
        const subtotal = Math.max(1, unfloored);
        trace?.add("bv1.def.subtotal", { label: "Defensive subtotal", detail: unfloored < 1 ? "the subtractions cannot take it below 1" : undefined, value: subtotal });
        // Defensive Movement Factor: the Target Movement Modifiers of the Attack Modifiers Table (BMR p.32, BMR(R) p.33:
        // up to +4), +1 more for jumping; MASC and TSM count.
        const tmm = (mp: number) => Math.min(getMovementModifier(mp), 4);
        const jump = this.getBVJumpSpeed();
        const movementModifier = Math.max(tmm(this.getBVRunSpeed()), jump > 0 ? tmm(jump) + 1 : 0);
        // Level 3: a null-signature system adds 0.5, a 'Mech designed without arms 0.1 (Maximum Tech p.92).
        const armlessFactor = levelThree && this.isArmless() ? 0.1 : 0;
        const nullSignature = !!levelThree && this._equipmentList.some(item => matchesTag(item, "null-signature-system"));
        const hasSupercharger = this._equipmentList.some(item => item?.variableFormula === "supercharger");
        const movementFactor = Math.round((1 + movementModifier / 10 + armlessFactor + (nullSignature ? 0.5 : 0)) * 100) / 100;
        const defensive = subtotal * movementFactor;
        if (levelThree && hasSupercharger) trace?.add("bv1.l3.def.factor.supercharger", { label: "Supercharger", detail: "its movement counts toward the Target Movement Modifier" });
        if (nullSignature) trace?.add("bv1.l3.def.factor.null-signature", { label: "Null-signature system", detail: "0.5 added to the Defensive Movement Factor" });
        if (armlessFactor) trace?.add("bv1.l3.def.factor.armless", { label: "Built without arms", detail: "0.1 added to the Defensive Movement Factor" });
        trace?.add("bv1.def.factor", { label: "Defensive Movement Factor", detail: `Target Movement Modifier +${movementModifier}`, value: movementFactor });
        trace?.add("bv1.def.rating", { label: "Defensive Battle Rating", detail: `${fmt(subtotal)} x ${movementFactor}`, value: defensive, emphasis: true });

        // Step 2: Offensive Battle Rating (BMR(R) pp.153-154). Rear weapons count half, unless they outweigh the rest.
        const weapons = firing.map(item => ({ item, rating: rate(item) })).map(entry => ({ ...entry, bv: entry.rating.value })).filter(entry => entry.bv > 0);
        const rearBV = weapons.reduce((sum, entry) => sum + (entry.item.rear ? entry.bv : 0), 0);
        const rearIsFront = rearBV > weapons.reduce((sum, entry) => sum + (entry.item.rear ? 0 : entry.bv), 0);
        const arc = (item: IEquipmentItem) => multiTracII || !!item.rear === rearIsFront ? 1 : 0.5;
        const weaponBV = weapons.reduce((sum, entry) => sum + entry.bv * arc(entry.item), 0);
        if (trace) {
            if (multiTracII && rearBV > 0) trace.add("bv1.l3.off.multi-trac", { label: "Multi-Trac II", detail: "rear-mounted weapons count in full" });
            for (const entry of weapons) {
                const share = arc(entry.item);
                trace.add(itemStep(entry.rating.source, "bv1.off.weapon"), {
                    label: `${entry.item.name}${entry.item.rear ? " (rear)" : ""}`,
                    detail: share === 1 ? undefined : `${fmt(entry.bv)} x 0.5${entry.item.rear ? "" : ", the rear weapons count as the front"}`,
                    value: entry.bv * share,
                });
            }
        }
        // A targeting computer: 20% of the weapons it links, rear ones halved, no ammo (BMR(R) p.153, note D p.158).
        // Level 3: a variable-range targeting system adds 10% "in the same way", Enhanced Imaging 5% (Maximum Tech p.91).
        const variableRange = !!levelThree && this._equipmentList.some(item => matchesTag(item, "targeting-variable-range"));
        const imaging = !!levelThree && this.hasEnhancedImaging();
        const computerShare = (this.hasTargetingComputer() ? 0.2 : 0) + (variableRange ? 0.1 : 0) + (imaging ? 0.05 : 0);
        const linkedBV = weapons.reduce((sum, entry) => sum + (isTargetingComputerWeapon(entry.item) ? entry.bv * arc(entry.item) : 0), 0);
        const computerBV = computerShare * linkedBV;
        if (this.hasTargetingComputer()) trace?.add("bv1.off.targeting-computer", { label: "Targeting computer", detail: `${fmt(linkedBV)} of linked weapons x 0.2`, value: 0.2 * linkedBV });
        if (variableRange) trace?.add("bv1.l3.off.targeting.variable-range", { label: "Variable-range targeting system", detail: `${fmt(linkedBV)} of linked weapons x 0.1`, value: 0.1 * linkedBV });
        if (imaging) trace?.add("bv1.l3.off.targeting.enhanced-imaging", { label: "Enhanced Imaging", detail: `${fmt(linkedBV)} of linked weapons x 0.05`, value: 0.05 * linkedBV });
        const ammoBV = getBattleValue1Ammo(this._equipmentList, binWeapon, valueOf, false);
        if (trace) {
            for (const bin of this._equipmentList.filter(isAmmo)) {
                const fed = binWeapon(bin);
                if (!fed || isDefensive(fed)) continue;
                const rating = rate(bin, fed);
                if (!rating.value) continue;
                trace.add(rating.source === "unlisted" ? "bv1.off.weapon.unlisted" : rating.multiplier !== 1 ? "bv1.l3.ammo.special" : "bv1.off.ammo", {
                    label: bin.name,
                    detail: `${fmt(bin.weight)} ${bin.weight === 1 ? "ton" : "tons"} x ${fmt(rating.value)}${rating.multiplier !== 1 ? ` (standard ammunition x ${rating.multiplier})` : ""}`,
                    value: rating.value * bin.weight,
                });
            }
        }
        let base = weaponBV + computerBV + ammoBV;
        trace?.add("bv1.off.base", { label: "Base Weapon Battle Rating", detail: `weapons ${fmt(weaponBV)} + targeting ${fmt(computerBV)} + ammunition ${fmt(ammoBV)}`, value: base });
        // Weapons that cannot be fired once the 'Mech overheats are worth half.
        if (maxHeat > sinkCapacity) {
            const x = sinkCapacity * base / maxHeat;
            const y = (base - x) / 2;
            base = x + (base - x) / 2;
            trace?.add("bv1.off.heat", { label: "Modified Weapon Battle Rating", detail: `X = ${fmt(sinkCapacity)} x base / ${fmt(maxHeat)} = ${fmt(x)}; Y = (base - X) / 2 = ${fmt(y)}; X + Y`, value: base });
        }
        // Speed Factor MP: Running + Jumping, +1 with MASC, a Supercharger (Max Tech p.91) or TSM; Stealth armor +0.2.
        const enhanced = this.hasTripleStrengthMyomer() || this._equipmentList.some(item => ["masc-is", "masc-clan", "supercharger"].includes(item?.variableFormula ?? ""));
        const speedMP = this.getRunSpeed() + jump + (enhanced ? 1 : 0);
        const speedFactor = getSpeedFactor(speedMP) + (stealth ? 0.2 : 0);
        const offensive = base * speedFactor;
        if (hasSupercharger) trace?.add("bv1.l3.off.speed.supercharger", { label: "Supercharger", detail: "counts as MASC does: 1 added to the MP" });
        if (stealth) trace?.add("bv1.off.speed.stealth", { label: "Stealth armor", detail: "0.2 added to the Speed Factor" });
        trace?.add("bv1.off.speed", { label: "Speed Factor", detail: `Running ${this.getRunSpeed()} + Jumping ${jump}${enhanced ? " + 1" : ""} = MP ${speedMP}`, value: speedFactor });
        trace?.add("bv1.off.rating", { label: "Offensive Battle Rating", detail: `${fmt(base)} x ${fmt(speedFactor)}`, value: offensive, emphasis: true });

        // Step 3: Final BV, rounded (BMR(R) p.154).
        // Level 3: a jump pack is left out above and adds its MP x 5 here (Maximum Tech p.92).
        const jumpPackMP = levelThree ? this.getJumpPackMP(edition) : 0;
        if (jumpPackMP > 0) trace?.add("bv1.l3.final.jump-pack", { label: "Jump pack", detail: `${jumpPackMP} MP x 5`, value: jumpPackMP * 5 });
        const battleValue = Math.round(defensive + offensive + jumpPackMP * 5);
        trace?.add("bv1.final.round", { label: "Battle Value", detail: `${fmt(defensive)} + ${fmt(offensive)}${jumpPackMP > 0 ? ` + ${jumpPackMP * 5}` : ""}, rounded`, value: battleValue, emphasis: true });
        return battleValue;
    }

    /** BV1 under `edition`, worked out once per edition until the 'Mech changes. */
    private _getBattleValue1(edition: string): number {
        let battleValue = this._battleValue1.get(edition);
        if (battleValue === undefined) {
            battleValue = this._calcBattleValue1(edition);
            this._battleValue1.set(edition, battleValue);
        }
        return battleValue;
    }

    public isQuad() {
        if( this._mechType.tag.toLowerCase() === "quad" )
            return true;
        else
            return false;
    }
    public isTripod() {
        if( this._mechType.tag.toLowerCase() === "tripod" )
            return true;
        else
            return false;
    }
    /** Triple-Strength Myomer in any form: standard, Industrial or prototype. */
    private static _isTripleStrengthMyomer(myomer: IMyomerType): boolean {
        return myomer.tripleStrength || /(^|-)tsm$/.test(myomer.tag);
    }

    /** Over 100 tons: a superheavy 'Mech (IO:AE pp.154-156). */
    public isSuperheavy(): boolean {
        return this._tonnage > 100;
    }

    /**
     * Critical slots an item takes on this chassis. On a superheavy 'Mech everything but the actuators,
     * sensors, life support and cockpit takes half its usual space, rounded up (IO:AE p.157).
     */
    public getCriticalSlots(standardSlots: number): number {
        return this.isSuperheavy() ? Math.ceil(standardSlots / 2) : standardSlots;
    }

    public isLAM() {
        if( this._mechType.tag.toLowerCase() === "lam" )
            return true;
        else
            return false;
    }
    public isQuadVee() {
        if( this._mechType.tag.toLowerCase() === "quadvee" )
            return true;
        else
            return false;
    }

    /** Four-legged chassis keep their front legs in "fll"/"frl" instead of the arm locations. */
    private _hasFrontLegs(): boolean {
        return this.isQuad() || this.isQuadVee();
    }

    /**
     * Hit location tables, the record sheet circles and saves made before front legs had their
     * own locations still name a four-legged 'Mech's front legs "la"/"ra".
     */
    private _normalizeLocation(location: string): string {
        if (this._hasFrontLegs()) {
            if (location === "la") return "fll";
            if (location === "ra") return "frl";
        }
        return location;
    }

    // Canonical location shorthands accepted from imports and UI. Rear variants (name + "r")
    // and split forms (name + "/" + name) are also accepted. Everything else is rejected at
    // the import boundary so it cannot reach the raw-HTML calc log.
    private static readonly ALLOWED_LOCATIONS: ReadonlySet<string> = new Set([
        "n/a", "hd", "ct", "lt", "rt", "la", "ra", "ll", "rl", "cl", "fll", "frl",
    ]);
    private _sanitizeLocationInput(location: unknown): string {
        if (typeof location !== "string") return "n/a";
        const trimmed = location.trim().toLowerCase();
        if (!trimmed) return "n/a";
        const parts = trimmed.split("/").map((p) => p.replace(/r$/, ""));
        for (const part of parts) {
            if (!BattleMech.ALLOWED_LOCATIONS.has(part)) return "n/a";
        }
        return trimmed;
    }

    // Escape strings that flow into calc-log HTML rendered via SanitizedHTML raw=true
    // (dangerouslySetInnerHTML). Used for equipment names and locations before they enter
    // _calcLogBV / _calcLogAS / _calcLogCBill.
    private _escapeLogText(value: unknown): string {
        if (value === null || typeof value === "undefined") return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    private _calcCBillCost() {
        const trace = new CalcTrace(MECH_COST_STEPS);
        let cbillDryTotal = 0;
        let cbillAmmoTotal = 0;
        const tonnage = this.getTonnage();

        // Cockpit: the chassis decides (Tripod, QuadVee, superheavy: IO:AE pp.215, 217); otherwise Standard or Small (TM p.277).
        const cockpit = this.getCockpitType();
        const cockpitStep = getMechCostStep("cockpit", cockpit.tag);
        trace.add(cockpitStep.id, { label: cockpit.tag === "standard" ? "Standard Cockpit" : cockpit.name, value: cockpit.cost, cites: cockpitStep.cites });
        cbillDryTotal += cockpit.cost;
        if (this.hasCommandConsole()) {
            const console = getCockpitType("command-console");
            trace.add("cost.cockpit.command-console", { label: console.name, value: console.cost });
            cbillDryTotal += console.cost;
        }
        if (this.hasEnhancedImaging()) {
            const imaging = this._getEnhancedImaging();
            trace.add("cost.cockpit.enhanced-imaging", { label: imaging.name, value: imaging.cost });
            cbillDryTotal += imaging.cost;
        }
        if (this._roboticControl !== "none") {
            const robotic = getRoboticControlCost(this._roboticControl, this.getRoboticControlWeight());
            trace.add("cost.cockpit.robotic", { label: this.getRoboticControl().name, value: robotic });
            cbillDryTotal += robotic;
        }

        // Life Support
        trace.add("cost.life-support", { label: "Life Support", value: 50000 });
        cbillDryTotal += 50000;

        // Sensors
        trace.add("cost.sensors", { label: "Sensors", detail: `2,000 x ${tonnage} tons`, value: 2000 * tonnage });
        cbillDryTotal += 2000 * tonnage;

        // Myomer
        {
            const primitiveMusculature = this._primitive && this._myomerType.tag === "standard";
            const myomerName = primitiveMusculature ? "Primitive Musculature"
                : this._myomerType.tag === "standard" ? "Standard Musculature" : this._myomerType.name;
            // Primitive 'Mech musculature costs 1,000 x tonnage (IO:AE pp.181, 215).
            // Superheavy standard musculature costs 12,000 x tonnage (IO:AE p.217).
            const superheavyMusculature = !primitiveMusculature && this._myomerType.tag === "standard" && this._tonnage > 100;
            const myomerCostPerTon = primitiveMusculature ? 1000 : superheavyMusculature ? 12000 : this._myomerType.costPerTon;
            const myomerCost = myomerCostPerTon * tonnage;
            const myomerStep = primitiveMusculature ? { id: "cost.musculature.primitive" }
                : superheavyMusculature ? { id: "cost.musculature.superheavy" }
                    : getMechCostStep("musculature", this._myomerType.tag);
            trace.add(myomerStep.id, { label: myomerName, detail: `${addCommas(myomerCostPerTon)} x ${tonnage} tons`, value: myomerCost, cites: "cites" in myomerStep ? myomerStep.cites : undefined });
            cbillDryTotal += myomerCost;
        }

        // Internal Structure. Superheavy structure uses its own per-ton table, and Tripod
        // structure costs x1.2 (IO:AE p.217).
        const superheavyStructureCost: Record<string, number> = { "standard": 4000, "industrial": 3000, "endo-steel": 16000, "endo-composite": 6400 };
        const structureCostPerTonOf = (structure: IInternalStructure): number => this._tonnage > 100
            ? superheavyStructureCost[structure.tag] ?? structure.cost
            : structure.cost;
        const structureChassisMultiplier = this.isTripod() ? 1.2 : 1;
        let structureCost = 0;
        if (this.hasFrankenMechHybridStructure()) {
            // Campaign Operations prices no hybrid structure: each location is read as its weight share of the
            // structure, at its own type's cost per ton of 'Mech.
            const locations = this.getFrankenMechLocations();
            const totalShare = locations.reduce((sum, location) => sum + (BattleMech.FRANKENMECH_STRUCTURE_SHARES[location.key] ?? 0), 0);
            for (const location of locations) {
                const structure = this.getFrankenMechLocationStructure(location.key);
                const share = (BattleMech.FRANKENMECH_STRUCTURE_SHARES[location.key] ?? 0) / totalShare;
                const locationCost = structureCostPerTonOf(structure) * tonnage * share * structureChassisMultiplier;
                trace.add("cost.structure.frankenmech", {
                    label: `Internal Structure, ${location.label}: ${structure.name}`,
                    detail: `${addCommas(structureCostPerTonOf(structure))} x ${tonnage} tons x ${Math.round(share * 1000) / 10}%${structureChassisMultiplier !== 1 ? " x 1.2 (Tripod)" : ""}`,
                    value: locationCost,
                });
                structureCost += locationCost;
            }
        } else {
            const structureCostPerTon = structureCostPerTonOf(this._selectedInternalStructure);
            structureCost = structureCostPerTon * tonnage * structureChassisMultiplier;
            const baseStructureCost = structureCostPerTon * tonnage;
            const structureStep = this._tonnage > 100 ? { id: "cost.structure.superheavy" } : getMechCostStep("structure", this._selectedInternalStructure.tag);
            trace.add(structureStep.id, {
                label: `Internal Structure: ${this._selectedInternalStructure.name}`,
                detail: `${addCommas(structureCostPerTon)} x ${tonnage} tons`,
                value: baseStructureCost,
                cites: "cites" in structureStep ? structureStep.cites : undefined,
            });
            if (structureChassisMultiplier !== 1) {
                trace.add("cost.structure.tripod", { label: "Tripod structure", detail: "structure cost x 1.2", value: structureCost - baseStructureCost });
            }
        }
        cbillDryTotal += structureCost;

        // Actuators (TM p.278): the shoulders and hips are not priced.
        let actuatorTotal = 0;
        const addActuator = (name: string, price: number) => {
            trace.add("cost.actuators", { label: `${name} Actuator`, detail: `${price} x ${tonnage} tons`, value: price * tonnage });
            cbillDryTotal += price * tonnage;
            actuatorTotal += price * tonnage;
        };
        const legActuators: [string, number][] = [["Upper Leg", 150], ["Lower Leg", 80], ["Foot", 120]];
        if (this._mechType.tag.toLowerCase() === "quad") {
            for (const side of ["Right Front", "Left Front", "Right Rear", "Left Rear"]) {
                for (const [part, price] of legActuators) addActuator(`${side} ${part}`, price);
            }
        } else {
            for (const side of ["Right", "Left"]) {
                for (const [part, price] of legActuators) addActuator(`${side} ${part}`, price);
            }

            // 2A. Arm actuators: upper 100, lower 50, hand 80 x tonnage; the shoulder is not priced (BMR(R) p.149; TM p.278).
            // Only what is mounted is bought, and an armless 'Mech buys none (Maximum Tech p.87).
            if (["biped", "lam", "tripod"].includes(this._mechType.tag.toLowerCase()) && !this.isArmless()) {
                ([["Right", "ra"], ["Left", "la"]] as const).forEach(([side, arm]) => {
                    const lowerArm = this.hasLowerArmActuator(arm);
                    const actuators: [string, number][] = [["Upper Arm", 100], ...(lowerArm ? [["Lower Arm", 50]] as [string, number][] : []), ...(lowerArm && this.hasHandActuator(arm) ? [["Hand", 80]] as [string, number][] : [])];
                    actuators.forEach(([name, price]) => addActuator(`${side} ${name}`, price));
                });
            }

            // 2B. Advanced Chassis Exception: Tripod Center Leg Actuators (TM p. 278 structural adjustments)
            if (this._mechType.tag.toLowerCase() === "tripod") {
                for (const [part, price] of legActuators) addActuator(`Center Rear ${part}`, price);
            }
        }

        // Superheavy actuators cost double (IO:AE p.217).
        if (this._tonnage > 100) {
            trace.add("cost.actuators.superheavy", { label: "Superheavy actuators cost double", value: actuatorTotal });
            cbillDryTotal += actuatorTotal;
        }

        // =====================================================================
        // ENGINE C-BILL COST CALCULATION (TechManual p. 278)
        // =====================================================================
        const engineType = this.getEngineType();
        const largeEngineType = this.getLargeEngineType();
        const engineName = largeEngineType?.name ?? engineType.name;
        const engineRating = this.getEngineRating();
        // Large engines carry their own multiplier, twice the base type's (TO:AUE p.219).
        const engineCostMultiplier = largeEngineType
            ? largeEngineType.costMultiplier
            : (engineType.costMultiplier || 0) * (this.isLargeEngine() ? 2 : 1);
        // No cost is rounded before the end (TM p.274).
        const engineCost = (engineCostMultiplier * engineRating * tonnage) / 75;
        const engineStep = getMechCostStep("engine", largeEngineType || this.isLargeEngine() ? "large" : engineType.tag);
        trace.add(engineStep.id, {
            label: `Engine: ${engineName}`,
            detail: `(${addCommas(engineCostMultiplier)} x rating ${engineRating} x ${tonnage} tons) / 75`,
            value: engineCost,
            cites: engineStep.cites,
        });
        cbillDryTotal += engineCost;

        // Gyro
        // Superheavy 'Mechs use the Superheavy Gyro: 500,000 x its own (doubled) weight, the
        // Heavy-Duty rate (IO:AE p.217).
        const superheavyGyroCostMultiplier = findByTag(mechGyroTypes, "heavy-duty")?.costMultiplier ?? 500000;
        const gyroName = this._tonnage > 100 ? "Superheavy (" + this.getGyroName() + ")" : this.getGyroName();
        const gyrocostMultiplier = this._tonnage > 100 ? superheavyGyroCostMultiplier : this.getGyro().costMultiplier;
        const gyroTonnage = this.getGyroWeight();
        const gyroStep = this._tonnage > 100 ? { id: "cost.gyro.superheavy" } : getMechCostStep("gyro", this.getGyro().tag);
        trace.add(gyroStep.id, {
            label: `Gyro: ${gyroName}`,
            detail: `${addCommas(gyrocostMultiplier)} x ${gyroTonnage} tons of gyro`,
            value: gyrocostMultiplier * gyroTonnage,
            cites: "cites" in gyroStep ? gyroStep.cites : undefined,
        });
        cbillDryTotal += gyrocostMultiplier * gyroTonnage;

        // Jump Jets
        const numberOfJumpJets = this.getNumberOfJumpJets();
        if (numberOfJumpJets) {
            const jumpJetCost = this._jumpJetType.costMultiplier;
            const jumpJetStep = getMechCostStep("jump-jets", this._jumpJetType.tag);
            trace.add(jumpJetStep.id, {
                label: `Jump Jets: ${this._jumpJetType.name}`,
                detail: `${addCommas(jumpJetCost)} x ${numberOfJumpJets} jump jets squared x ${tonnage} tons`,
                value: jumpJetCost * Math.pow(numberOfJumpJets, 2) * tonnage,
                cites: jumpJetStep.cites,
            });
            cbillDryTotal += jumpJetCost * Math.pow(numberOfJumpJets, 2) * tonnage;
        }

        // Jump Pack: priced with the equipment (Maximum Tech p.87; TO:AUE cost table).
        const jumpPackTons = this.getJumpPackTons();
        if (jumpPackTons > 0) {
            const jumpPackCost = mechJumpPack.costMultiplier * jumpPackTons;
            trace.add("cost.jump-pack", { label: mechJumpPack.name, detail: `${addCommas(mechJumpPack.costMultiplier)} x ${jumpPackTons} tons of pack`, value: jumpPackCost });
            cbillDryTotal += jumpPackCost;
        }

        // Heat Sinks
        const heatSinksName = this.getHeatSinksObj().name;
        const heatSinksCost = this.getHeatSinksObj().cost;
        const numberOfHeatSinks = this.getHeatSinks();
        const heatSinkType = this.getHeatSinksType();

        // Single-type sinks: the ones that come with the engine are free; double-type sinks are all paid for.
        const freeSinks = Math.min(this.getFreeHeatSinks(), this.getHeatSinksObj().freeSinks ?? (heatSinkType === "single" ? 10 : 0));
        const paidSinks = Math.max(0, numberOfHeatSinks - freeSinks);
        const heatSinkStep = getMechCostStep("heat-sinks", heatSinkType);
        trace.add(heatSinkStep.id, {
            label: `Heat Sinks: ${heatSinksName}`,
            detail: `${addCommas(heatSinksCost)} x ${paidSinks} heat sinks${freeSinks ? ` over ${freeSinks}` : ""}`,
            value: heatSinksCost * paidSinks,
            cites: heatSinkStep.cites,
        });
        cbillDryTotal += heatSinksCost * paidSinks;

        // Power amplifiers: 20,000 C-bills per ton (TM pp.278-279).
        const powerAmplifierWeight = this.getPowerAmplifierWeight();
        if (powerAmplifierWeight > 0) {
            trace.add("cost.power-amplifiers", { label: "Power Amplifiers", detail: `20,000 x ${powerAmplifierWeight} tons of amplifier`, value: 20000 * powerAmplifierWeight });
            cbillDryTotal += 20000 * powerAmplifierWeight;
        }

        // Armor
        if (this.isPatchworkArmor()) {
            // Patchwork: each location's armor at its own type's cost per ton.
            for (const location of this.getPatchworkLocations()) {
                const locationWeight = this.getPatchworkLocationWeight(location.key);
                if (locationWeight <= 0) continue;
                const locationArmor = this.getPatchworkArmorType(location.key);
                trace.add("cost.armor.patchwork", {
                    label: `Armor: ${locationArmor.name} (${location.label})`,
                    detail: `${addCommas(locationArmor.costMultiplier)} x ${locationWeight} tons of armor`,
                    value: locationArmor.costMultiplier * locationWeight,
                });
            }
        } else {
            const armorObj = this.getArmorObj();
            const armorStep = getMechCostStep("armor", armorObj.tag);
            trace.add(armorStep.id, {
                label: `Armor: ${armorObj.name}`,
                detail: `${addCommas(armorObj.costMultiplier)} x ${this.getArmorWeight()} tons of armor`,
                value: armorObj.costMultiplier * this.getArmorWeight(),
                cites: armorStep.cites,
            });
        }
        cbillDryTotal += this.getArmorCost();

        // Equipment
        for (const item of this._equipmentList) {
            if (item.tag.indexOf("ammo-") === -1) {
                trace.add("cost.equipment", { label: item.name, value: item.cbills });
                cbillDryTotal += item.cbills;
            } else {
                trace.add("cost.ammo", { label: item.name, detail: `${item.weight} tons x ${addCommas(item.cbills)}`, value: item.cbills * item.weight });
                cbillAmmoTotal += item.cbills * item.weight;
            }
        }

        // Armored components: 150,000 C-bills for each slot (TO:AUE p.217).
        const armoredComponentSlots = this.getArmoredComponentSlots();
        if (armoredComponentSlots > 0) {
            trace.add("cost.armored-components", { label: "Armored Components", detail: `150,000 x ${armoredComponentSlots} slots`, value: armoredComponentSlots * 150000 });
            cbillDryTotal += armoredComponentSlots * 150000;
        }

        const motiveGear = this._quadVeeMotiveGear();
        if (motiveGear) {
            trace.add("cost.quadvee-motive", { label: motiveGear.name, value: motiveGear.cbills });
            cbillDryTotal += motiveGear.cbills;
        }

        // Conversion equipment: LAM_TYPE_RULES, or QuadVee x0.5, of "WSC", the weapons, equipment and structure, read as
        // the whole dry cost so far, as the books' worked examples do ("structural, weapon, and equipment costs":
        // LAMs IO p.186, IO:AE p.180; QuadVees IO p.187, IO:AE p.181; user ruling 2026-10-26).
        const conversionRate = this.isLAM() ? LAM_TYPE_RULES[this._lamType].costRate : this.isQuadVee() ? 0.5 : 0;
        if (conversionRate > 0) {
            const conversionBase = cbillDryTotal;
            const conversionCost = conversionBase * conversionRate;
            trace.add(this.isVTOLAM() ? "cost.conversion.homebrew" : "cost.conversion", {
                label: "Conversion Equipment",
                detail: `${conversionRate} x structural, weapon and equipment costs ${addCommas(conversionBase)}`,
                value: conversionCost,
            });
            cbillDryTotal += conversionCost;
        }

        trace.add("cost.subtotal", { label: "Structure, weapons and equipment", value: cbillDryTotal, emphasis: true });

        // (Structural Cost + Weapon/Equipment Costs) x (Omni Conversion Cost) x (1 + [Total Tonnage / 100])
        // OmniMechs x1.25 (TM p.285). The Custom Homebrew Omni-LAM uses x1.75
        // in its place ("costs 1.75 times a normal mech", Kronos Battle Systems fan rule).
        const omniCostMultiplier = this.isOmniLAM() ? 1.75 : this._omnimech ? 1.25 : 1;
        // IndustrialMechs (Industrial internal structure) use 1 + tonnage / 400 (TM p.285).
        const tonnageDivisor = this.getInternalStructureType() === "industrial" ? 400 : 100;
        const costMultiplier = (1 + tonnage / tonnageDivisor) * omniCostMultiplier;

        if (omniCostMultiplier !== 1) {
            trace.add(this.isOmniLAM() ? "cost.omni.homebrew" : "cost.omni", { label: this.isOmniLAM() ? "Omni-LAM conversion" : "OmniMech conversion", value: omniCostMultiplier });
        }
        trace.add("cost.tonnage-multiplier", {
            label: "Tonnage multiplier",
            detail: `1 + ${tonnage} / ${tonnageDivisor}${tonnageDivisor === 400 ? " (IndustrialMech)" : ""}`,
            value: 1 + tonnage / tonnageDivisor,
        });
        if (this.usesEarlierRulesEdition()) {
            trace.add("cost.rules-edition", { label: "Worked out with the current rules (TechManual)" });
        }

        const finalDryCost = Math.round(cbillDryTotal * costMultiplier);
        trace.add("cost.final", { label: "Final cost", detail: `${addCommas(cbillDryTotal)} x ${costMultiplier}, rounded`, value: finalDryCost, emphasis: true });
        if (cbillAmmoTotal > 0) {
            trace.add("cost.final.loaded", { label: "Loaded cost, with the ammunition carried", value: finalDryCost + cbillAmmoTotal, emphasis: true });
        }

        this._costSteps = trace.steps;
        this._calcLogCBill = renderCalcStepsTable(trace.steps);
        this._cbillCost = addCommas(finalDryCost);
        this._cbillCostWithAmmo = addCommas(finalDryCost + cbillAmmoTotal);
    }

    /** The C-bill cost calculation as cited steps. */
    public getCostBreakdown(): ICalcBreakdown {
        this._calcCBillCost();
        const notes = this._futureWarsBreakdownNotes(this._rulesEdition);
        return { kind: "cost", edition: this._rulesEdition, steps: this._costSteps, result: this.getCBillCostNumeric(), ...(notes ? { notes } : {}) };
    }

    public getNumberOfJumpJets() {
        return this.getJumpSpeed();
    }

    /** Recalculates the Battle Value if critical slots have moved since it was last worked out. */
    private _refreshBattleValue(): void {
        if (this._battleValueStale) {
            this._calcBattleValue();
        }
    }

    /**
     * The Battle Value calculation under `edition` as cited steps: BV2, the edition's BV1, or for an edition older than
     * Battle Value one step saying so and a null result. An unknown edition reads the default edition's.
     */
    public getBattleValueBreakdown(edition: string = this._rulesEdition): ICalcBreakdown {
        // Always recalculated: the steps quote names and numbers that can change without a slot move marking the BV stale.
        this._calcBattleValue();
        const breakdown = this._getBattleValueBreakdown(edition);
        const notes = this._futureWarsBreakdownNotes(edition);
        return notes ? { ...breakdown, notes } : breakdown;
    }

    /** The breakdown under `edition`, from the BV2 steps already worked out. */
    private _getBattleValueBreakdown(edition: string): ICalcBreakdown {
        if (!editionHasBattleValue(edition, "mech")) {
            const trace = new CalcTrace(NO_BATTLE_VALUE_STEPS);
            trace.add("none.no-battle-value", { label: `${getRulesEdition(edition).name} has no Battle Value. Battle Value first appears in the BattleTech Master Rules (1998)` });
            return { kind: "battle-value", edition, scheme: "none", steps: trace.steps, result: null };
        }
        return getBattleValueFor<ICalcBreakdown>(edition, "mech", {
            bv1: () => {
                const trace = new CalcTrace(getMechBv1Steps(edition));
                const result = this._calcBattleValue1(edition, trace);
                return { kind: "battle-value", edition, scheme: "bv1", steps: trace.steps, result };
            },
            bv2: () => ({ kind: "battle-value", edition, scheme: "bv2", steps: this._battleValueSteps, result: this._battleValue }),
        });
    }

    public getBattleValue(edition: string = this._rulesEdition): number {
        this._refreshBattleValue();
        return getBattleValueFor(edition, "mech", { bv1: () => this._getBattleValue1(edition), bv2: () => this._battleValue });
    }

    /**
     * Battle Value adjusted for skill under `edition`, read on the skill table that goes with that BV (plan ruling 2).
     * `forceBonus` is the force adjustments (TAG) it adds before skill.
     */
    public getPilotAdjustedBattleValue(edition: string = this._rulesEdition, forceBonus: number = 0): number {
        this._refreshBattleValue();
        if (edition === this._rulesEdition && !forceBonus) return this._pilotAdjustedBattleValue;
        return Math.round((this.getBattleValue(edition) + forceBonus) * (getSkillMultiplier(...this._getBattleValueSkills(edition), "mech", getBattleValueSkillEdition(edition, "mech")) ?? 1));
    }

    /**
     * The Gunnery and Piloting Skills the skill table reads under `edition`. Level 3 BV1: a small (compact) or
     * torso-mounted cockpit reads Piloting 1 worse, Enhanced Imaging 1 better (Maximum Tech pp.61, 91). Otherwise EI
     * implants read both 1 better, only with the EI interface (IO:AE p.184; lowest 0).
     */
    private _getBattleValueSkills(edition: string): [gunnery: number, piloting: number] {
        const gunnery = this._pilot?.gunnery ?? 4;
        const piloting = this._pilot?.piloting ?? 5;
        if (!getBattleValueRules(edition, "mech").levelThree) {
            const implants = this._pilot?.eiImplants && this.hasEnhancedImaging() ? 1 : 0;
            return [Math.max(0, gunnery - implants), Math.max(0, piloting - implants)];
        }
        const cockpit = ["small", "torso-mounted"].includes(this.getCockpitType().tag) ? 1 : 0;
        return [gunnery, Math.min(7, Math.max(0, piloting + cockpit - (this.hasEnhancedImaging() ? 1 : 0)))];
    }

    /** This unit's part in its force's TAG adjustment under `edition` (BV v4.1 p.23; TO:AUE p.198). */
    public getBattleValueTagShare(edition: string = this._rulesEdition): IBattleValueTagShare {
        return getBattleValueTagShare(edition, this._equipmentList, (bin) => this.getAmmoBinWeapon(bin), [],
            () => this._calcBattleValue1(edition, undefined, true) - this.getBattleValue(edition));
    }

    /** The C3 system this unit joins a force's C3 network with, if any (BV v4.1 p.23). */
    public getBattleValueC3Type(): BattleValueC3Type | undefined {
        return getBattleValueC3Type(this._equipmentList);
    }

    /** This unit's C3 systems and weapon BV for a BV1 network. */
    public getBattleValueC3Part(edition: string = this._rulesEdition): IBattleValueC3Part {
        return getBattleValueC3Part(edition, this._equipmentList);
    }

    public getAlphaStrikeValue() {
        return this._alphaStrikeValue;
    }

    public getCBillCost( withAMMO: boolean = false): string {
        if( withAMMO )
            return this._cbillCostWithAmmo;
        else
            return this._cbillCost;
    }

    public getCBillCostNumeric( withAMMO: boolean = false): number {
        if( withAMMO )
            return parseInt(this._cbillCostWithAmmo.replace(/,/g, ''), 10);
        else
            return parseInt(this._cbillCost.replace(/,/g, ''), 10);
    }

    public getEngineWeight() {
        if( this._engine && this._engine.weight) {
            // if( this._engineType.tag === "clan-xl" ) {
            //     return this._engine.weight.xl;
            // } else {
            //     return this._engine.weight[this._engineType.tag];
            // }
            const weightTag = BattleMech.getEngineWeightTag(this._engineType.tag);
            if( this.usesFractionalAccounting() ) {
                const fractionalWeight = getFractionalEngineWeight(weightTag, this._engine.weight.standard);
                if( fractionalWeight !== null ) return fractionalWeight;
            }
            // A third lighter than the standard engine of the rating, to the half ton up (u/Bookwyrm517, #267).
            if( this._engineType.tag === BattleMech.RFE_TAG ) {
                return Math.ceil(this._engine.weight.standard * 0.67 * 2) / 2;
            }
            switch( weightTag ) {
                case "standard": {
                    // An earlier edition's own Engine Table (Battledroids prints the 170 at 6.5 tons).
                    const edition = isEarlierRulesEdition(this._rulesEdition) ? getEditionStats(this._engineType, this._rulesEdition) : undefined;
                    return edition?.engineWeights?.[this._engine.rating] ?? this._engine.weight.standard;
                }
                case "xl": {
                    return this._engine.weight.xl;
                }
                case "clan_xl": {
                    return this._engine.weight.clan_xl;
                }
                case "light": {
                    return this._engine.weight.light;
                }
                case "compact": {
                    return this._engine.weight.compact ?? 0;
                }
                case "xxl": {
                    return this._engine.weight.xxl;
                }
                case "clan_xxl": {
                    return this._engine.weight.clan_xxl;
                }
                case "ice": {
                    return this._engine.weight.ice;
                }
                case "cell": {
                    return this._engine.weight.cell;
                }
                case "fission": {
                    return this._engine.weight.fission;
                }
                case "primitive": {
                    return this._engine.weight.primitive ?? 0;
                }
            }
            return 0;
        } else {
            return 0;
        }
    }

    /**
     * The engine weight column an engine type reads. The custom Mini Engine weighs as a light engine of the same
     * rating (u/VanillaPhysics, #249); every other type reads its own column.
     */
    public static getEngineWeightTag(engineTag: string): string {
        if( engineTag === BattleMech.MINI_ENGINE_TAG ) return "light";
        // The Re-Engineered Fusion Engine is worked out from the standard engine (a third off).
        if( engineTag === BattleMech.RFE_TAG ) return "standard";
        return engineTag;
    }

    /** Custom Homebrew Mini Engine (mech-custom-engine-types.ts, #249). */
    public static readonly MINI_ENGINE_TAG = "mini-engine";

    /** Custom Homebrew Re-Engineered Fusion Engine (mech-custom-engine-types.ts, #267). */
    public static readonly RFE_TAG = "re-engineered-fusion";

    public getEngineRating() {
        if( this._engine && this._engine.rating)
            return this._engine.rating;
        else
            return 0;

    }

    /** Engines rated above 400 are large engines (TO:AUE p.119): double cost and two more center torso slots. */
    public isLargeEngine(): boolean {
        return this.getEngineRating() > 400;
    }

    /**
     * The large engine record for the current engine type, with its own dates, cost and slots.
     * Null at ratings up to 400, and for types that have no large form (Compact, Fuel Cell, Fission, Primitive).
     */
    public getLargeEngineType(): IEngineType | null {
        return this.isLargeEngine() ? getLargeEngineType(this._engineType.tag) ?? null : null;
    }

    /** Engine column of the ASC p.98 'Mech structure table. */
    private _getAlphaStrikeStructureColumn(): AlphaStrikeStructureColumn {
        const large = this.isLargeEngine();
        switch (this._engineType.tag) {
            case "clan_xl":
                return large ? "isXl" : "clanXl";
            case "clan_xxl":
                return large ? "clanLargeXxl" : "clanXxl";
            case "xl":
            case BattleMech.RFE_TAG:
                return "isXl";
            case "light":
                return large ? "isXl" : "isLight";
            case "xxl":
                return large ? "isLargeXxl" : "isXxl";
            case "compact":
                return "isCompact";
            default:
                // Large fusion (and other large standard-type engines) share the IS Light column.
                return large ? "isLight" : "standard";
        }
    }

    /**
     * Heat sinks that come with the engine at no cost in weight: 10 with a fusion engine, 5 with
     * fission, 1 with a fuel cell and none with an ICE (IndustrialMech Bonus Heat Sinks Table, TM p.71).
     */
    public getFreeHeatSinks(): number {
        switch (this._engineType.tag) {
            case "ice": return 0;
            case "cell": return 1;
            case "fission": return 5;
            default: return 10;
        }
    }

    public getHeatSinks() {
        return this.getFreeHeatSinks() + this._additionalHeatSinks;
    }

    /**
     * Power amplifiers: an ICE or fuel cell 'Mech carrying energy weapons mounts amplifiers weighing 10 percent
     * of those weapons, rounded up to the half ton; they take no critical slots (TM p.72).
     */
    public getPowerAmplifierWeight(): number {
        if (this._hasFusionOrFissionEngine()) return 0;
        const weight = this._equipmentList
            .filter(item => item && !item.isAmmo && item.category === "Energy Weapons" && !/vehicle-flamer|chemical-laser/.test(item.tag))
            .reduce((sum, item) => sum + (item.weight || 0), 0);
        return weight > 0 ? Math.ceil(weight / 10 * 2 - 1e-9) / 2 : 0;
    }

    public getHeatSinksWeight() {
        return this._additionalHeatSinks * (this._heatSinkType.weightEach ?? 1);
    }

    /** Most additional heat sinks the remaining tonnage allows, at the selected type's weight per sink. */
    public getMaxAdditionalHeatSinks(): number {
        const weightEach = this._heatSinkType.weightEach ?? 1;
        const available = this.getRemainingTonnage() + this.getHeatSinksWeight();
        return Math.max(this._additionalHeatSinks, Math.floor(available / weightEach + 1e-9));
    }

    /** Heat sinks the engine holds without critical slots: floor(rating / 25), doubled for Compact (TO:AUE p.128). */
    public getEngineHeatSinkCapacity(): number {
        // Battledroids and the Second Edition give every heat sink a box, the engine's ten included (BD p.25).
        if (!editionEngineHoldsHeatSinks(this._heatSinkType, this._rulesEdition)) {
            return 0;
        }
        const rating = this.getEngine()?.rating ?? 0;
        return Math.floor(rating / 25) * (this._heatSinkType.engineCapacityMultiplier ?? 1);
    }

    public getGyroWeight() {
        // "5 ton power armors do not require a gyro" (Best-of p.16).
        if (this._isFiveTonPowerArmor()) return 0;
        if( this._engine ) {
            // Superheavy Mechs (>100 tons) of any chassis type must mount the Superheavy Gyro:
            // it weighs as a Heavy-Duty gyro, engine rating / 100 rounded up, then doubled
            // (IO:AE p.156; IO errata v1.21 replaced the older "rating / 50" wording).
            if( this._tonnage > 100 ) {
                return Math.ceil(this._engine.rating / 100) * 2;
            }
            // Gyro weight: engine rating / 100 rounded up, times the gyro multiplier, rounded up to the half ton.
            return Math.ceil(Math.ceil(this._engine.rating / 100) * this._gyro.weight_multiplier * 2) / 2;
        } else {
            return 0;
        }
    }
    /**
     * The cockpit this chassis mounts. Tripods, QuadVees and superheavy 'Mechs have a mandatory
     * cockpit (IO:AE pp.128, 156, 159); everything else chooses between Standard and Small.
     */
    public getCockpitType(): ICockpitType {
        const superheavy = this._tonnage > 100;
        if (this.isTripod()) return getCockpitType(superheavy ? "superheavy-tripod" : "tripod");
        if (this.isQuadVee()) return getCockpitType("quadvee");
        // A Power Armor suit has no cockpit, only its waldo system (Best-of p.16).
        if (this.usesPowerArmorConstruction()) return POWER_ARMOR_WALDO;
        // A Primitive 'Mech mounts the 5-ton Primitive cockpit of its kind (IO:AE p.117).
        if (this._primitive) {
            return getCockpitType(!this.isIndustrialMech() ? "primitive"
                : this._advancedFireControl ? "primitive-industrial-advanced-fire-control" : "primitive-industrial");
        }
        // A superheavy IndustrialMech takes the superheavy BattleMech cockpit when it has Advanced Fire Control.
        if (superheavy) return getCockpitType(this.isIndustrialMech() && !this._advancedFireControl ? "superheavy-industrial" : "superheavy");
        if (this.isIndustrialMech()) return getCockpitType(this._advancedFireControl ? "industrial-advanced-fire-control" : "industrial");
        // Flint's cockpit rule replaces the cockpit choice: a small, torso-mounted or interface cockpit chosen before the
        // ruleset was ticked is built as his (owner ruling 4, 2026-11-13).
        if (this.usesFutureWarsConstruction()) return getCockpitType("standard");
        return getCockpitType(this._torsoMountedCockpit ? "torso-mounted" : this._smallCockpit ? "small" : this._interfaceCockpit ? "interface" : "standard");
    }

    private _roboticUnitType(): RoboticUnitType { return this.isIndustrialMech() ? "industrialmech" : "battlemech"; }

    /** The Smart Robotic Control System (IO:AE pp.134-135), or "none" for a piloted 'Mech. */
    public getRoboticControl(): IRoboticControlSystem { return getRoboticControlSystem(this._roboticControl); }

    /** Robotic control systems this 'Mech may mount, under its rules edition and at this rules level. */
    public getAvailableRoboticControls(rulesLevel: number = 2): IRoboticControlSystem[] {
        return getRoboticControlSystemsFor(this._roboticUnitType())
            .filter(system => system.tag === "none" || this.isOfferedInEdition(system, rulesLevel));
    }

    /**
     * Fits a Smart Robotic Control System on top of the cockpit (IO:AE pp.134-135), or "none" for a piloted 'Mech.
     * The pilot then takes the system's Gunnery and Piloting Skills. A system the 'Mech cannot mount is ignored.
     */
    public setRoboticControl(tag: string): IRoboticControlSystem {
        const wanted = getRoboticControlSystem(tag);
        const fits = getRoboticControlSystemsFor(this._roboticUnitType()).some(system => system.tag === wanted.tag);
        this._roboticControl = fits && this.isInRulesEdition(wanted) ? wanted.tag : "none";
        const skills = this.getRoboticSkills();
        if (skills) {
            this._pilot.gunnery = skills.gunnery;
            this._pilot.piloting = skills.piloting;
        }
        this._calc();
        return this.getRoboticControl();
    }

    /** Gunnery and Piloting Skills of a robotic 'Mech (IO:AE p.135); null when piloted. */
    public getRoboticSkills(): { gunnery: number; piloting: number } | null {
        return getRoboticSkills(this._roboticUnitType(), this._roboticControl);
    }

    /** Tons the SRCS adds to the cockpit: 5 percent of the 'Mech, 7 for the Improved grade, up to the half ton (IO:AE p.135). */
    public getRoboticControlWeight(): number {
        return getRoboticControlWeight(this._roboticUnitType(), this._roboticControl, this._tonnage,
            weight => this.usesFractionalAccounting() ? roundUpToKilogram(weight) : Math.ceil(weight * 2) / 2);
    }

    /** An IndustrialMech: a 'Mech built on industrial internal structure (TM p.66). */
    public isIndustrialMech(): boolean {
        return this._selectedInternalStructure.tag === "industrial";
    }

    /** Does the cockpit have fire control fit for combat? Always, except an IndustrialMech without the enhancement. */
    public hasAdvancedFireControl(): boolean {
        return !["industrial", "superheavy-industrial", "primitive-industrial"].includes(this.getCockpitType().tag);
    }

    /**
     * Cockpits this chassis may mount. Tripods, QuadVees and superheavy 'Mechs have one mandatory
     * cockpit; an IndustrialMech chooses whether to add Advanced Fire Control (TM p.69); any other
     * 'Mech chooses between the Standard, Small (TM p.52), Torso-Mounted (TO:AUE p.112) and Interface (IO:AE p.110) cockpits.
     */
    public getAvailableCockpits(rulesLevel: number = 2): ICockpitType[] {
        const current = this.getCockpitType();
        // The waldo is outside the cockpit catalog and is the suit's only choice.
        if (current.tag === POWER_ARMOR_WALDO.tag) return [{ ...POWER_ARMOR_WALDO, available: true, availableAsPrototype: false }];
        const superheavyIndustrial =this.isSuperheavy() && this.isIndustrialMech() && !this.isTripod();
        // A Primitive 'Mech's cockpit is part of what makes it Primitive, so its dates never withhold it.
        const mandatory = this._primitive
            || (!superheavyIndustrial && ["tripod", "superheavy-tripod", "quadvee", "superheavy"].includes(current.tag));
        const tags = this._primitive && this.isIndustrialMech() ? ["primitive-industrial", "primitive-industrial-advanced-fire-control"]
            : mandatory ? [current.tag]
            : superheavyIndustrial ? ["superheavy-industrial", "superheavy"]
            : this.isIndustrialMech() ? ["industrial", "industrial-advanced-fire-control"]
            : this.usesFutureWarsConstruction() ? ["standard"]
            : ["standard", "small", "torso-mounted", "interface"];
        return tags.map(tag => {
            // Copies: the availability marks are this 'Mech's, not the shared table's (issue 35).
            const cockpit = { ...getCockpitType(tag) };
            const availability = this._techDatesAvailability(cockpit, rulesLevel);
            cockpit.availableAsPrototype = availability.asPrototype;
            // The cockpit a chassis must mount is never withheld.
            cockpit.available = mandatory || (availability.available && this.isOfferedInEdition(cockpit, rulesLevel)
                && rulesLevel >= (cockpit.rulesLevel ?? 0));
            return cockpit;
        });
    }

    /** Choose one of the cockpits offered by getAvailableCockpits(); anything else is ignored. */
    public setCockpitType(tag: string): ICockpitType {
        if (this.getAvailableCockpits().some(cockpit => cockpit.tag === tag)) {
            if (tag === "standard" || tag === "small" || tag === "torso-mounted" || tag === "interface") {
                this._smallCockpit = tag === "small";
                this._torsoMountedCockpit = tag === "torso-mounted";
                this._interfaceCockpit = tag === "interface";
            }
            if (tag === "industrial" || tag === "industrial-advanced-fire-control") this._advancedFireControl = tag !== "industrial";
            if (tag === "primitive-industrial" || tag === "primitive-industrial-advanced-fire-control") this._advancedFireControl = tag !== "primitive-industrial";
            if (this.isIndustrialMech() && (tag === "superheavy" || tag === "superheavy-industrial")) this._advancedFireControl = tag === "superheavy";
            this._calc();
        }
        return this.getCockpitType();
    }

    /**
     * May this 'Mech add a Cockpit Command Console? Not with a Torso-Mounted Cockpit (TO:AUE p.112), on a QuadVee or
     * a tripod, whose cockpits already seat a second warrior (IO:AE pp.128, 159), nor where the console's head slot is
     * taken: by the interface cockpit's second slot or a LAM's avionics.
     */
    public canMountCommandConsole(): boolean {
        const typeTag = this._mechType.tag;
        if (typeTag === "tripod" || typeTag === "quadvee" || typeTag === "lam") return false;
        return !["torso-mounted", "interface"].includes(this.getCockpitType().tag);
    }

    /** The Command Console as the cockpit picker offers it: availability judged as getAvailableCockpits() does. */
    public getCommandConsoleOption(rulesLevel: number = 2): ICockpitType {
        return this._cockpitAddOnOption(getCockpitType("command-console"), this.canMountCommandConsole(), rulesLevel);
    }

    /** A cockpit add-on as the cockpit picker offers it, judged by its dates, edition and rules level there. */
    private _cockpitAddOnOption(record: ICockpitType, mountable: boolean, rulesLevel: number): ICockpitType {
        const addOn = { ...record };
        const availability = this._techDatesAvailability(addOn, rulesLevel);
        addOn.availableAsPrototype = availability.asPrototype;
        addOn.available = mountable && availability.available && this.isOfferedInEdition(addOn, rulesLevel);
        return addOn;
    }

    /**
     * May this 'Mech add Enhanced Imaging? Clan technology only (Maximum Tech p.60; IO:AE p.69). Under the Master Rules
     * it is one of Max Tech's cockpit systems, and a 'Mech takes only one: not with a small, torso-mounted or command
     * console cockpit (p.60). IO:AE puts it in any Clan cockpit.
     */
    public canMountEnhancedImaging(): boolean {
        if (this._tech.tag !== "clan" && this._tech.tag !== "mclan") return false;
        return !this.usesEarlierRulesEdition() || (this.getCockpitType().tag === "standard" && !this.hasCommandConsole());
    }

    /** Enhanced Imaging as the cockpit picker offers it. */
    public getEnhancedImagingOption(rulesLevel: number = 2): ICockpitType {
        return this._cockpitAddOnOption(this._getEnhancedImaging(), this.canMountEnhancedImaging(), rulesLevel);
    }

    /** Enhanced Imaging is mounted: chosen, and allowed by the cockpit and technology in force. */
    public hasEnhancedImaging(): boolean {
        return this._enhancedImaging && this.canMountEnhancedImaging();
    }

    /**
     * Enhanced Imaging gives its benefits and feedback: switched on in the End Phase, no sensors hit, and under TW a
     * pilot with EI implants (IO:AE p.69); Maximum Tech reads the interface alone (p.61).
     */
    public isEnhancedImagingActive(): boolean {
        return this.hasEnhancedImaging() && !this.enhancedImagingOff && this.sensorHits() === 0
            && (this.usesEarlierRulesEdition() || !!this._pilot?.eiImplants);
    }

    /** The roll Enhanced Imaging asks for on structure damage, for the play log and the sheet. */
    public getEnhancedImagingFeedback(): string {
        return this.usesEarlierRulesEdition()
            ? "roll 2D6, 7 or better or the pilot takes 1 damage (Maximum Tech p.61)"
            : "roll 2D6, 7 or better or the pilot takes 1 damage and a consciousness roll (IO:AE p.69)";
    }

    /** Add or remove Enhanced Imaging; returns whether it is mounted. */
    public setEnhancedImaging(mounted: boolean): boolean {
        if (mounted && !this.canMountEnhancedImaging()) return false;
        this._enhancedImaging = mounted;
        this._calc();
        return this.hasEnhancedImaging();
    }

    /** The Enhanced Imaging record with the name and add-on price the design's edition prints (Maximum Tech p.87). */
    private _getEnhancedImaging(): ICockpitType {
        const imaging = getCockpitType("enhanced-imaging-interface");
        const stats = getEditionStats(imaging, this._rulesEdition);
        return { ...imaging, name: stats?.name ?? imaging.name, cost: stats?.cbills ?? imaging.cost };
    }

    /** A Cockpit Command Console is mounted: chosen, and allowed by the cockpit and chassis in force. */
    public hasCommandConsole(): boolean {
        return this._commandConsole && this.canMountCommandConsole();
    }

    /** Add or remove the Cockpit Command Console; returns whether one is mounted. */
    public setCommandConsole(mounted: boolean): boolean {
        if (mounted && !this.canMountCommandConsole()) return false;
        this._commandConsole = mounted;
        this._calc();
        return this.hasCommandConsole();
    }

    /** May this 'Mech be built without arms? Bipeds and tripods (plan ruling R4): a quad has none, a LAM needs its own. */
    public canBeArmless(): boolean {
        return this._mechType.tag === "biped" || this._mechType.tag === "tripod";
    }

    /** Armless as the chassis step offers it, judged by the edition and rules level. */
    public getArmlessOption(rulesLevel: number = 2): IMechType & { available: boolean } {
        return { ...armlessMechOption, available: this.canBeArmless() && this.isOfferedInEdition(armlessMechOption, rulesLevel) };
    }

    /** Built without arms: chosen, and allowed by the chassis in force (Maximum Tech p.62). */
    public isArmless(): boolean {
        return this._armless && this.canBeArmless();
    }

    /**
     * May this 'Mech carry a jump pack? It is for a 'Mech that "lacks integral jump jets" (TO:AUE p.105), in every edition,
     * so never a LAM or a partial wing, which needs integrated jets (user ruling, #621). UMUs are not jets. The tables stop
     * at 100 tons.
     */
    public canCarryJumpPack(): boolean {
        const hasJumpJets = this._jumpSpeed > 0 && !this._jumpJetType.underwater;
        return this._tonnage <= 100 && !hasJumpJets && !this.isLAM() && !this.hasPartialWing();
    }

    /** The jump pack as the movement step offers it. Only TO:AUE's rules have dates. */
    public getJumpPackOption(rulesLevel: number = 2): IJumpJet {
        const availability = this._techDatesAvailability(mechJumpPack, rulesLevel);
        const inDate = this.usesEarlierRulesEdition() || availability.available;
        return { ...mechJumpPack, availableAsPrototype: availability.asPrototype, available: this.canCarryJumpPack() && inDate && this.isOfferedInEdition(mechJumpPack, rulesLevel) };
    }

    /** The heaviest pack: cargo up to the 'Mech's own tonnage (BMR(R) p.77), and no more than 20 tons under TO:AUE (p.105). */
    public getMaxJumpPackTons(): number {
        return this.usesEarlierRulesEdition() ? this._tonnage : Math.min(this._tonnage, mechJumpPack.maxPackTons ?? this._tonnage);
    }

    public getJumpPackTons(): number {
        return this.canCarryJumpPack() ? Math.min(this._jumpPackTons, this.getMaxJumpPackTons()) : 0;
    }

    /** Strap on a pack of `tons` in half-ton steps, 0 for none; returns the tons carried. */
    public setJumpPackTons(tons: number): number {
        this._jumpPackTons = Math.max(0, Math.round(+tons * 2) / 2);
        this._calc();
        return this.getJumpPackTons();
    }

    private _jumpPackRow() {
        return mechJumpPack.packByTonnage?.find(row => this._tonnage <= row.upTo);
    }

    /** Pack Jumping MP, at most Walking MP: tons over the jet weight (Maximum Tech p.80), or TO:AUE's table rounded up (p.105). */
    public getJumpPackMP(edition: string = this._rulesEdition): number {
        const tons = this.getJumpPackTons();
        const jetWeight = getEditionJumpJetWeight(mechJumpJetTypes[0], edition, this._tonnage);
        const mp = jetWeight ? Math.floor(tons / jetWeight) : Math.ceil(tons * (this._jumpPackRow()?.mpPerTon ?? 0));
        return Math.min(mp, this.getWalkSpeed());
    }

    /** Fuel: hexes under Maximum Tech (MP x 2, p.80), Fuel Points under TO:AUE (per pack ton, rounded up, p.105). */
    public getJumpPackFuel(): number {
        return this.usesEarlierRulesEdition() ? this.getJumpPackMP() * 2 : Math.ceil(this.getJumpPackTons() * (this._jumpPackRow()?.fuelPerTon ?? 0));
    }

    /** Fuel with its unit: hexes under Maximum Tech, Fuel Points under TO:AUE. */
    public getJumpPackFuelText(fuel: number = this.getJumpPackFuel()): string {
        return `${fuel} ${this.usesEarlierRulesEdition() ? "hexes" : "fuel"}`;
    }

    private _jumpPackFuelBeforeThisTurn(): number {
        return this.jumpPackLost ? 0 : Math.max(0, this.getJumpPackFuel() - this.jumpPackFuelUsed);
    }

    private _isJumpPackJump(): boolean {
        return this.currentMovementMode === "j" && this.getJumpPackTons() > 0 && !this.jumpPackLost;
    }

    /** Fuel left after this turn's jump, at one a Jump MP (TO:AUE p.105) or a hex (Maximum Tech p.81). */
    public getJumpPackFuelLeft(): number {
        return Math.max(0, this._jumpPackFuelBeforeThisTurn() - (this._isJumpPackJump() ? this.currentTargetJumpingMP : 0));
    }

    /** Jumping MP the pack gives now: modified like jump jets (it jumps "in the same manner"), at most the fuel left. */
    public getJumpPackSpeed(): number {
        return Math.min(this._applyJumpModifiers(this.getJumpPackMP()), this._jumpPackFuelBeforeThisTurn());
    }

    /** Drop the pack: 1 MP in the Movement Phase, as any cargo (BMR(R) p.78; TW p.261). */
    public dropJumpPack(how: string = "dropped"): void {
        this.jumpPackLost = how;
    }

    /** The sheet's Jumping MP: the jets', or the pack's on a 'Mech without them. */
    public getJumpingText(): string {
        return `${Math.max(this.getJumpSpeed(), this.getJumpPackSpeed())}`;
    }

    /** The sheet's pack line, each edition's own rules (Maximum Tech p.81; TO:AUE p.105). */
    public getJumpPackNote(): string {
        if (this.getJumpPackTons() <= 0) return "";
        if (this.jumpPackLost) return `Jump pack: ${this.jumpPackLost}`;
        return `Jump pack: ${this.getJumpPackTons()} t, ${this.getJumpPackFuelText(this.getJumpPackFuelLeft())}. No heat. Drop for 1 MP. `
            + "Any rear torso hit destroys it. Dropped when empty."
            + (this.usesEarlierRulesEdition() ? "" : " A combat drop burns all fuel.");
    }

    /** A hit on an arm that is not there "does no damage" and "does not transfer" (Maximum Tech p.62). */
    private static readonly ARMLESS_HIT = "Armless: the arm hit has no effect (Maximum Tech p.62).";

    private _isArmlessArm(location: string): boolean {
        return this.isArmless() && (location === "la" || location === "ra");
    }

    /** Build the 'Mech with or without arms; returns whether it is armless. Arm armor goes, arm equipment comes off. */
    public setArmless(armless: boolean): boolean {
        if (armless && !this.canBeArmless()) return false;
        this._armless = armless;
        if (armless) {
            this._armorAllocation.leftArm = 0;
            this._armorAllocation.rightArm = 0;
            for (const item of this._equipmentList) {
                if (item?.location === "la" || item?.location === "ra") item.location = "un";
            }
        }
        // setTonnage recalculates the structure, the maximum armor and everything after them.
        this.setTonnage(this._tonnage);
        return this.isArmless();
    }

    /**
     * Equipment an IndustrialMech cannot use without Advanced Fire Control (TM p.69): Artemis IV,
     * the Beagle Active Probe or its Clan equivalent, C3 and C3i units, and targeting computers.
     */
    /** What the "one to a location" groups are called in a violation message. */
    private static readonly LOCATION_GROUP_NAMES: Record<string, string> = {
        "harjel-repair": "HarJel repair system",
        "industrial-tool": "industrial tool",
        "spot-welder": "spot welder",
        "bridgelayer": "bridgelayer",
        "physical-weapon": "physical attack weapon",
        "shield": "shield",
        "spikes": "spike cluster",
        "aes": "Actuator Enhancement System",
    };

    /** The leg locations of this chassis. */
    private _legLocations(): string[] {
        return this._hasFrontLegs() ? ["fll", "frl", "ll", "rl"] : this.isTripod() ? ["ll", "rl", "cl"] : ["ll", "rl"];
    }

    /** Locations a spread item's slots go in on this chassis, or null when the item has no such rule. `withArms` counts an armless 'Mech's arms. */
    private _getSpreadLocations(item: IEquipmentItem | null | undefined, withArms: boolean = false): string[] | null {
        if (!item?.spreadLocations) return null;
        const arms = this._hasFrontLegs() || (this.isArmless() && !withArms) ? [] : ["la", "ra"];
        const legs = this._legLocations();
        switch (item.spreadLocations) {
            case "all": return ["hd", "ct", "lt", "rt", ...arms, ...legs];
            case "all-but-head": return ["ct", "lt", "rt", ...arms, ...legs];
            case "limbs-and-side-torsos": return ["lt", "rt", ...arms, ...legs];
            case "legs": return legs;
            case "side-torsos": return ["lt", "rt"];
            case "torsos": return ["lt", "ct", "rt"];
            case "one-side": return ["lt", "rt", ...arms];
        }
        return null;
    }

    /** A "one-side" spread item's locations on the other side from `location` (left: lt, la; right: rt, ra). */
    private _getOtherSideLocations(item: IEquipmentItem, location: string): string[] {
        if (item.spreadLocations !== "one-side") return [];
        return (this._getSpreadLocations(item) ?? []).filter(other => other[0] !== location[0]);
    }

    /**
     * Critical slots a spread item takes. The catalog (and its sizing formula) gives a two- or four-legged 'Mech's count;
     * a Tripod adds the third leg's share (IO:AE p.159).
     */
    public getSpreadSlotCount(item: IEquipmentItem): number {
        let slots = item.space.battlemech;
        const spreadLocations = this._getSpreadLocations(item, true);
        if (this.isTripod() && spreadLocations?.includes("cl")) {
            // A biped has one location fewer: the third leg.
            slots = slots / (spreadLocations.length - 1) * spreadLocations.length;
        }
        return this.getCriticalSlots(slots);
    }

    /** Most slots of a spread item one location may hold: its slots shared out evenly ("one-side": as many as fit). */
    private _getSpreadSlotsPerLocation(item: IEquipmentItem): number {
        const spreadLocations = this._getSpreadLocations(item);
        return spreadLocations && item.spreadLocations !== "one-side" ? Math.ceil(this.getSpreadSlotCount(item) / spreadLocations.length) : Infinity;
    }

    /**
     * 'Mech locations an item must be placed in, or null for anywhere. Industrial tools go in the arms of a
     * humanoid 'Mech and the side torsos of a four-legged one (TM pp.241-249).
     */
    private _getAllowedLocations(item: IEquipmentItem): string[] | null {
        if (item.armTool) return this._hasFrontLegs() ? ["lt", "rt"] : this.isArmless() ? [] : ["la", "ra"];
        if (!item.allowedLocations) return null;
        // "Superheavy 'Mechs may ignore the torso-only mounting restrictions applied to Heavy Gauss Rifles (standard and
        // improved), and may place these items in the arms" (IO:AE p.157).
        const allowed = this.isSuperheavy() && BattleMech.HEAVY_GAUSS_TAGS.includes(item.tag)
            ? [...item.allowedLocations, "la", "ra"] : item.allowedLocations;
        // A four-legged or armless 'Mech has no arm locations.
        return this._hasFrontLegs() || this.isArmless() ? allowed.filter(location => location !== "la" && location !== "ra") : allowed;
    }

    /** ECM suites, including the CEWS that work as one. */
    private static readonly ECM_TAGS: readonly string[] = [
        "ecm-suite", "guardian-ecm-prototype", "angel-ecm", "clan-angel-ecm", "clan-ecm-system", "clan-watchdog-cews", "clan-nova-cews",
    ];

    /**
     * Systems that may not share a 'Mech, or need another: AES (TO:AUE p.91), the Chameleon shield (p.112), the
     * Null-Signature (p.148) and Void-Signature (p.161) systems, Stealth Armor's ECM suite (TM p.213) and the targeting
     * and tracking systems (Maximum Tech p.58).
     */
    private _systemConflictViolations(mounted: IEquipmentItem[]): string[] {
        const violations: string[] = [];
        const find = (test: (item: IEquipmentItem) => boolean): { name: string } | undefined => mounted.find(test);
        const computer = find(item => !!item.variableFormula?.startsWith("targeting-computer"));
        const c3 = find(item => /^c3i?-/.test(item.tag) && item.tag !== BattleMech.C3_REMOTE_SENSOR_TAG);
        const masc = find(item => item.variableFormula === "masc-is" || item.variableFormula === "masc-clan");
        const tsm = BattleMech._isTripleStrengthMyomer(this._myomerType) ? this._myomerType : undefined;
        const stealth = this._armorType.tag === "stealth-basic" ? { name: "Stealth Armor" } : undefined;
        const ecm = find(item => BattleMech.ECM_TAGS.includes(item.tag));
        const aes = find(item => item.variableFormula === "aes-arm" || item.variableFormula === "aes-leg");
        const nss = find(item => item.tag === "null-signature-system");
        const vss = find(item => item.tag === "void-signature-system");
        const chameleon = find(item => item.tag === "chameleon-lps");
        const conflict = (system: { name: string } | undefined, others: ({ name: string } | undefined)[], cite: string) => {
            const names = others.filter((other): other is { name: string } => !!other).map(other => other.name);
            if (system && names.length > 0) violations.push(`${system.name} cannot be combined with ${names.join(", ")} (${cite}).`);
        };
        conflict(aes, [masc, tsm, computer], "TO:AUE p.91");
        conflict(nss, [computer, c3, stealth], "TO:AUE p.148");
        conflict(vss, [computer, c3, stealth, chameleon, nss], "TO:AUE p.161");
        conflict(chameleon, [stealth], "TO:AUE p.112");
        // One targeting and tracking system to a 'Mech (`maxPerUnit`), and a targeting or C3 computer counts as one.
        conflict(find(item => item.maxPerUnitGroup === "targeting-system"), [computer, c3], "Maximum Tech p.58");
        const fullHeadEjection = find(item => item.tag === "full-head-ejection-system" || item.tag === "clan-full-head-ejection-system");
        if (fullHeadEjection && this.getCockpitType().tag === "torso-mounted") {
            violations.push(`${fullHeadEjection.name} cannot be combined with a Torso-Mounted Cockpit (TO:AUE p.116).`);
        }
        // An insulator is mated to a laser in its own location (TO:AUE p.134).
        for (const insulator of mateLaserInsulators(this._equipmentList)) {
            violations.push(`${insulator.name} in the ${getLocationName(insulator.location ?? "", this._hasFrontLegs()).toLowerCase()} has no laser of its own to insulate (TO:AUE p.134).`);
        }
        // Prototype double heat sinks combine only with single heat sinks (IO:AE p.65).
        const extraSink = this._equipmentList.find(item => (item?.heatDissipation ?? 0) > 0);
        if (this._heatSinkType.tag !== "single" && extraSink) {
            violations.push(`${extraSink.name} combines only with single heat sinks (IO:AE p.65).`);
        }
        if (vss && !ecm) violations.push(`${vss.name} needs an ECM suite (TO:AUE p.161).`);
        if (stealth && !ecm) violations.push("Stealth Armor needs an ECM suite (TM p.213).");
        // A Power Booster hooked to the jump jets has nothing to boost without them (The Best of Future Wars p.28, #172).
        const jumpBooster = mounted.find(item => item.conversion?.booster?.target === "jumping");
        if (jumpBooster && this.getJumpSpeed() <= 0) {
            violations.push(`${jumpBooster.name} needs jump jets to boost (The Best of Future Wars p.28).`);
        }
        return violations;
    }

    /** "The C3 Remote Sensor system is incompatible with C3i-based systems" (TO:AUE p.110). */
    private static readonly C3_REMOTE_SENSOR_TAG = "c3-remote-sensor-launcher";
    private static _isC3iSystem(item: IEquipmentItem): boolean {
        return /^(clan-)?c3i/.test(item.tag.toLowerCase());
    }

    /** Armor a HarJel II or III repair system works with (IO:AE pp.82-83); heavy industrial armor is Standard armor. */
    private static readonly REPAIR_SYSTEM_ARMOR_TAGS = ["standard", "light-ferro-fibrous", "ferro-fibrous", "heavy-ferro-fibrous"];

    private static _needsAdvancedFireControl(item: IEquipmentItem): boolean {
        const tag = item.tag.toLowerCase();
        // The C3 Remote Sensor Launcher is a launcher, not a C3 unit.
        if (tag === BattleMech.C3_REMOTE_SENSOR_TAG) return false;
        return /-artemis-(iv|v|p)$/.test(tag) || /^c3/.test(tag)
            || ["beagle-active-probe", "clan-active-probe", "targeting-computer", "clan-targeting-computer"].includes(tag);
    }

    public getCockpitWeight() {
        return this._cockpitWeight;
    }

    public getInternalStructureWeight(): number {
        if (this._frankenMech) return this._getFrankenMechStructureWeight();
        const tripodMultiplier = this.getType().tag === "tripod" ? 1.1 : 1;
        return BattleMech._structureWeight(this._selectedInternalStructure?.tag, this.getTonnage(), tripodMultiplier, this.usesFractionalAccounting());
    }

    /**
     * Internal structure weight of a 'Mech of this tonnage, rounded up to the half ton (the kilogram under Fractional
     * Accounting). Share of 'Mech tonnage by
     * structure type (TechManual; TO:AUE for Composite, Endo-Composite, Reinforced); superheavy 'Mechs double it
     * except for Reinforced and Composite.
     */
    private static _structureWeight(structureTag: string | undefined, tonnage: number, multiplier: number = 1, fractional: boolean = false): number {
        const factors: Record<string, { base: number, superheavy: number }> = {
            "standard": { base: 0.1, superheavy: 0.2 },
            "endo-steel": { base: 0.05, superheavy: 0.1 },
            "endo-steel-prototype": { base: 0.05, superheavy: 0.1 },
            "endo-composite": { base: 0.075, superheavy: 0.15 },
            "composite": { base: 0.05, superheavy: 0.05 },
            "reinforced": { base: 0.2, superheavy: 0.2 },
            "industrial": { base: 0.2, superheavy: 0.4 },
        };
        const factor = factors[structureTag ?? ""] ?? factors["standard"];
        const weight = tonnage * (tonnage > 100 ? factor.superheavy : factor.base) * multiplier;
        // Structure weight rounds up to the half ton; under Fractional Accounting, up to the kilogram (TO:AUE p.188).
        return fractional ? roundUpToKilogram(weight) : Math.ceil(weight * 2) / 2;
    }

    /** Tons of one jump jet: the selected edition's figure where it prints one, else by weight class (TM p.51). */
    private _jumpJetWeightEach(): number {
        const edition = getEditionJumpJetWeight(this._jumpJetType, this._rulesEdition, this._tonnage);
        if( edition !== undefined ) {
            return edition;
        }
        // A FrankenMech's jets kept from a lighter 'Mech weigh what they did there (CO p.213).
        if( this._frankenMechJumpJetClass && this.usesLighterJumpJets() ) {
            return this._jumpJetType.weight_multiplier[this._frankenMechJumpJetClass];
        }
        return this._ownJumpJetWeightEach();
    }

    /** Tons of one jump jet built for this 'Mech's weight class (TM p.51). */
    private _ownJumpJetWeightEach(): number {
        if( this._tonnage <= 55) {
            // 10-55 tons
            return this._jumpJetType.weight_multiplier.light;
        } else if( this._tonnage <= 85) {
            // 60 - 85 tons
            return this._jumpJetType.weight_multiplier.medium;
        } else if( this._tonnage <= 100) {
            // 90 100 tons
            return this._jumpJetType.weight_multiplier.heavy;
        } else {
            // 105-200 tons
            return this._jumpJetType.weight_multiplier.superheavy;
        }
    }

    public getJumpJetWeight() {
        return this._jumpSpeed * this._jumpJetWeightEach();
    }

    public getASCalcHTML() {
        return "<div class=\"mech-tro\">" + this._calcLogAS + "</div>";
    }

    public getBVCalcHTML() {
        this._refreshBattleValue();
        return "<div class=\"mech-tro\">" + this._calcLogBV + "</div>";
    }

    public getCBillCalcHTML() {
        return "<div class=\"mech-tro\">" + this._calcLogCBill + "</div>";
    }

    public calcAlphaStrike(): AlphaStrikeUnit {
        mateLaserInsulators(this._equipmentList);

        this._alphaStrikeForceStats.name = this.getName();
        this._alphaStrikeForceStats.move = this.getWalkSpeed() * 2;
        this._alphaStrikeForceStats.jumpMove = this.getJumpSpeed() * 2;
        this._alphaStrikeForceStats.pv = 0;
        this._alphaStrikeForceStats.damage.short = 0;
        this._alphaStrikeForceStats.damage.medium = 0;
        this._alphaStrikeForceStats.damage.long = 0;
        this._alphaStrikeForceStats.damage.extreme = 0;
        this._alphaStrikeForceStats.damage.shortMinimal = false;
        this._alphaStrikeForceStats.damage.mediumMinimal = false
        this._alphaStrikeForceStats.damage.longMinimal = false
        this._alphaStrikeForceStats.damage.extremeMinimal = false
        this._alphaStrikeForceStats.armor = 0;
        this._alphaStrikeForceStats.structure = 0;
        this._alphaStrikeForceStats.skill = 4;
        this._alphaStrikeForceStats.ov = 0;
        this._alphaStrikeForceStats.notes = "";
        this._alphaStrikeForceStats.sizeClass = 0;
        this._alphaStrikeForceStats.sizeClassName = "";
        this._alphaStrikeForceStats.specialUnitAbilities = [];
        this._alphaStrikeForceStats.overheat = 0;
        this._alphaStrikeForceStats.longHeat = 0;
        this._alphaStrikeForceStats.abilityCodes = [];
        this._alphaStrikeForceStats.specialUnitAbilities = [];
        if (this._armorType.alphaStrikeAbility && !(this._armorType.tag === "stealth-basic" && this.hasActiveModularArmor())) {
            this._alphaStrikeForceStats.abilityCodes.push(this._armorType.alphaStrikeAbility);
        }

        // this._alphaStrikeForceStats.getAbilityCode(abilityCode) {
        //     for (let abiC = 0; abiC < this._alphaStrikeForceStats.abilityCodes.length; abiC++) {
        //         if (abilityCode.toLowerCase().trim() === this._alphaStrikeForceStats.abilityCodes[abiC].toLowerCase().trim()) {
        //             return this._alphaStrikeForceStats.abilityCodes[abiC];
        //         }
        //     }

        //     return null;
        // }

        // this._alphaStrikeForceStats.addAbilityCode(abilityCode, abilityValue) {

        //     this._alphaStrikeForceStats.abilityCodes.push({
        //         code: abilityCode,
        //         value: abilityValue
        //     });

        // }

        this._calcLogAS = "";

        // TODO - calculations
        this._calcLogAS += "Tonnage is " + this._tonnage + "<br />\n";
        if (this._tonnage > 100) {
            this._alphaStrikeForceStats.sizeClass = 4;
            this._alphaStrikeForceStats.sizeClassName = "Superheavy";
            this._alphaStrikeForceStats.specialUnitAbilities.push( "LG" );
            this._calcLogAS += "<strong>Setting Size to 4 (Superheavy)</strong><br />\n";
        } else if (this._tonnage >= 80) {
            this._alphaStrikeForceStats.sizeClass = 4;
            this._alphaStrikeForceStats.sizeClassName = "Assault";
            this._calcLogAS += "<strong>Setting Size to 4 (Assault)</strong><br />\n";
        } else if (this._tonnage >= 60) {
            this._alphaStrikeForceStats.sizeClass = 3;
            this._alphaStrikeForceStats.sizeClassName = "Heavy";
            this._calcLogAS += "<strong>Setting Size to 3 (Heavy)</strong><br />\n";
        } else if (this._tonnage >= 40) {
            this._alphaStrikeForceStats.sizeClass = 2;
            this._alphaStrikeForceStats.sizeClassName = "Medium";
            this._calcLogAS += "<strong>Setting Size to 2 (Medium)</strong><br />\n";
        } else if (this._tonnage >= 20){
            this._alphaStrikeForceStats.sizeClass = 1;
            this._alphaStrikeForceStats.sizeClassName = "Light";
            this._calcLogAS += "<strong>Setting Size to 1 (Light)</strong><br />\n";
        } else {
            this._alphaStrikeForceStats.sizeClass = 1;
            this._alphaStrikeForceStats.sizeClassName = "Ultralight";
            this._calcLogAS += "<strong>Setting Size to 1 (Ultralight)</strong><br />\n";
        }

        this._alphaStrikeForceStats.armor = +((this.getTotalArmor() / 30).toFixed(0));
        this._calcLogAS += "Converting total armor of " + this.getTotalArmor() + "<br />\n";
        this._calcLogAS += "<strong>Setting Armor to " + this._alphaStrikeForceStats.armor + "</strong><br />\n";

        // Structure: Alpha Strike Companion p.98, by tonnage and engine type.
        const structureColumn = this._getAlphaStrikeStructureColumn();
        let structurePoints = getAlphaStrikeMechStructure(structureColumn, this._tonnage) ?? Math.max(1, Math.ceil(this._tonnage / 10));
        this._calcLogAS += `Engine is ${this._engineType.name}${this.isLargeEngine() ? " (Large)" : ""}, ASC p.98 column ${structureColumn}: structure ${structurePoints}<br />\n`;
        if (this.getInternalStructureType() === "reinforced") {
            structurePoints *= 2;
            this._calcLogAS += "Reinforced internal structure x 2<br />\n";
        }
        this._alphaStrikeForceStats.structure = structurePoints;
        this._calcLogAS += `<strong>Setting structure to ${structurePoints}</strong><br />\n`;

        // Weapon heat for the heat step (Converting Heat errata v1.3): forward and rear-firing weapons apart, and again
        // for the weapons that reach Long range. Rocket and one-shot launchers add none; AMS heat is added below.
        let frontWeaponHeat = 0;
        let frontWeaponHeatLong = 0;
        let rearWeaponHeat = 0;
        let rearWeaponHeatLong = 0;
        let has_explosive = false;

        const lrmDamage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0

        }

        const heatDamage: IAlphaStrikeDamage = {
            short:0,
            medium: 0,
            long: 0,
            extreme: 0
        }

        const flakDamage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0
        }

        const acDamage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0
        }

        const srmDamage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0
        }

        const mslDamage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0
        }

        const rearDamage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0
        }

        let indirectFireRating = 0;

        let shortTotalDamage = 0;
        let mediumTotalDamage = 0;
        let longTotalDamage = 0;
        let extremeTotalDamage = 0;

        let shortTotalDamageRear = 0;
        let mediumTotalDamageRear = 0;
        let longTotalDamageRear = 0;
        let extremeTotalDamageRear = 0;

        const selectedSpecialAmmoTag = this.getAlphaStrikeSpecialAmmoTag();
        for (let weapon_counter = 0; weapon_counter < this._equipmentList.length; weapon_counter++) {
            if (this._equipmentList[weapon_counter].explosive) {
                has_explosive = true;
            }
            const equipment = this._equipmentList[weapon_counter];
            const appliesSelectedSpecialAmmo = equipment.isAmmo
                && equipment.isSpecialAmmo
                && equipment.tag === selectedSpecialAmmoTag;
            if (!equipment.isAmmo || appliesSelectedSpecialAmmo) {
                for (const displayAbilityCode of getAlphaStrikeEquipmentDisplayAbilityCodes(equipment)) {
                if (!this._alphaStrikeForceStats.abilityCodes.includes(displayAbilityCode)) {
                    this._alphaStrikeForceStats.abilityCodes.push(displayAbilityCode);
                }
                }
            }
            if (this._equipmentList[weapon_counter].alphaStrike && !this._equipmentList[weapon_counter].isAmmo ) {
                const strike = equipment.alphaStrike;
                const firesForDamage = +strike.rangeShort > 0 || +strike.rangeMedium > 0 || +strike.rangeLong > 0 || +strike.rangeExtreme > 0;
                const weaponHeat = firesForDamage && !addsNoAlphaStrikeWeaponHeat(equipment) ? getMountedHeat(equipment, +strike.heat || 0) : 0;
                if (equipment.rear) {
                    rearWeaponHeat += weaponHeat;
                    if (+strike.rangeLong > 0) rearWeaponHeatLong += weaponHeat;
                } else {
                    frontWeaponHeat += weaponHeat;
                    if (+strike.rangeLong > 0) frontWeaponHeatLong += weaponHeat;
                }



                if (this._equipmentList[weapon_counter].rear) {
                    this._calcLogAS += "Adding <strong>rear</strong> Weapon " + this._equipmentList[weapon_counter].tag + " - ";
                    this._calcLogAS += " ( " + this._equipmentList[weapon_counter].alphaStrike.rangeShort + ", ";
                    this._calcLogAS += this._equipmentList[weapon_counter].alphaStrike.rangeMedium + ", ";
                    this._calcLogAS += this._equipmentList[weapon_counter].alphaStrike.rangeLong + ", ";
                    this._calcLogAS += this._equipmentList[weapon_counter].alphaStrike.rangeExtreme + " )<br />\n";
                    shortTotalDamageRear += this._equipmentList[weapon_counter].alphaStrike.rangeShort;
                    mediumTotalDamageRear += this._equipmentList[weapon_counter].alphaStrike.rangeMedium;
                    longTotalDamageRear += this._equipmentList[weapon_counter].alphaStrike.rangeLong;
                    extremeTotalDamageRear += this._equipmentList[weapon_counter].alphaStrike.rangeExtreme;
                } else {

                    shortTotalDamage += this._equipmentList[weapon_counter].alphaStrike.rangeShort;
                    mediumTotalDamage += this._equipmentList[weapon_counter].alphaStrike.rangeMedium;
                    longTotalDamage += this._equipmentList[weapon_counter].alphaStrike.rangeLong;
                    extremeTotalDamage += this._equipmentList[weapon_counter].alphaStrike.rangeExtreme;

                    this._calcLogAS += "Adding Weapon " + this._equipmentList[weapon_counter].tag + " - ";
                    this._calcLogAS += " ( " + this._equipmentList[weapon_counter].alphaStrike.rangeShort + ", ";
                    this._calcLogAS += this._equipmentList[weapon_counter].alphaStrike.rangeMedium + ", ";
                    this._calcLogAS += this._equipmentList[weapon_counter].alphaStrike.rangeLong + ", ";
                    this._calcLogAS += this._equipmentList[weapon_counter].alphaStrike.rangeExtreme + " )<br />\n";

                }


                this._alphaStrikeForceStats.damage.short = shortTotalDamage;
                this._alphaStrikeForceStats.damage.medium = mediumTotalDamage;
                this._alphaStrikeForceStats.damage.long = longTotalDamage;
                this._alphaStrikeForceStats.damage.extreme = extremeTotalDamage;

                rearDamage.short = shortTotalDamageRear;
                rearDamage.medium = mediumTotalDamageRear;
                rearDamage.long = longTotalDamageRear;
                rearDamage.extreme = extremeTotalDamageRear;

                if ( this._equipmentList[weapon_counter].alphaStrike.notes && this._equipmentList[weapon_counter].alphaStrike.notes.length && this._equipmentList[weapon_counter].alphaStrike.notes.length > 0) {
                    for (let nC = 0; nC < this._equipmentList[weapon_counter].alphaStrike.notes.length; nC++) {
                        // Notes carry both ability codes and remarks ("Provisional workbook conversion"); only the
                        // codes, and the keywords calculateAlphaStrikeValue turns into damage codes, go on the card.
                        const note = this._equipmentList[weapon_counter].alphaStrike.notes[nC];
                        if (this._alphaStrikeForceStats.abilityCodes.indexOf(note) === -1
                            && (isAlphaStrikeAbilityCode(note) || isAlphaStrikeConversionKeyword(note))) {
                            this._alphaStrikeForceStats.abilityCodes.push(note);
                        }

                        if (this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase() === "mel" ) {
                            this._alphaStrikeForceStats.specialUnitAbilities.push( "MEL" );
                        }

                        if (this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase() === "heat" ) {
                            heatDamage.short += this._equipmentList[weapon_counter].alphaStrike.rangeShort;
                            heatDamage.medium += this._equipmentList[weapon_counter].alphaStrike.rangeMedium;
                            heatDamage.long += this._equipmentList[weapon_counter].alphaStrike.rangeLong;
                            heatDamage.extreme += this._equipmentList[weapon_counter].alphaStrike.rangeExtreme;
                        }

                        if (this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase() === "lrm" ) {
                            lrmDamage.short += +this._equipmentList[weapon_counter].alphaStrike.rangeShort;
                            lrmDamage.medium += +this._equipmentList[weapon_counter].alphaStrike.rangeMedium;
                            lrmDamage.long += +this._equipmentList[weapon_counter].alphaStrike.rangeLong;
                            lrmDamage.extreme += +this._equipmentList[weapon_counter].alphaStrike.rangeExtreme;
                        }

                        if (this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase() === "ac" ) {
                            acDamage.short += +this._equipmentList[weapon_counter].alphaStrike.rangeShort;
                            acDamage.medium += +this._equipmentList[weapon_counter].alphaStrike.rangeMedium;
                            acDamage.long += +this._equipmentList[weapon_counter].alphaStrike.rangeLong;
                            acDamage.extreme += +this._equipmentList[weapon_counter].alphaStrike.rangeExtreme;
                        }

                        if (this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase() === "flak" ) {
                            flakDamage.short += +this._equipmentList[weapon_counter].alphaStrike.rangeShort;
                            flakDamage.medium += +this._equipmentList[weapon_counter].alphaStrike.rangeMedium;
                            flakDamage.long += +this._equipmentList[weapon_counter].alphaStrike.rangeLong;
                            flakDamage.extreme += +this._equipmentList[weapon_counter].alphaStrike.rangeExtreme;
                        }

                        if (
                            this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase() === "indirect fire"
                            ||
                            this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase() === "if"
                            ||
                            this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase().startsWith( "if " )
                        ) {
                            indirectFireRating += +this._equipmentList[weapon_counter].alphaStrike.rangeLong;

                        }

                        if (this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase() === "indirect fire" || this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase() === "srm" ) {
                            srmDamage.short += this._equipmentList[weapon_counter].alphaStrike.rangeShort;
                            srmDamage.medium += this._equipmentList[weapon_counter].alphaStrike.rangeMedium;
                            srmDamage.long += this._equipmentList[weapon_counter].alphaStrike.rangeLong;
                            srmDamage.extreme += this._equipmentList[weapon_counter].alphaStrike.rangeExtreme;
                        }

                        if (this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase() === "missile" || this._equipmentList[weapon_counter].alphaStrike.notes[nC].toLowerCase() === "msl" ) {
                            mslDamage.short += this._equipmentList[weapon_counter].alphaStrike.rangeShort;
                            mslDamage.medium += this._equipmentList[weapon_counter].alphaStrike.rangeMedium;
                            mslDamage.long += this._equipmentList[weapon_counter].alphaStrike.rangeLong;
                            mslDamage.extreme += this._equipmentList[weapon_counter].alphaStrike.rangeExtreme;
                        }

                    }

                }

            }
        }





        this._calcLogAS += "<strong>Move Is " + this.getWalkSpeed() * 2 + "\"" + (this.getJumpSpeed() > 0 ? "/" + this.getJumpSpeed() * 2 + "\"J" : "") + "</strong><br />\n";

        // if there are no explosive components, then the mech gets the ENE ability :)
        if (!has_explosive) {
            this._alphaStrikeForceStats.abilityCodes.push( "ENE" );
            this._calcLogAS += "Mech has no explosive components, gets ENE ability<br />\n";
        }

        // Heat-modified damage, Overheat and OVL: the Alpha Strike Companion's Converting Heat errata v1.3 (CGL 2025),
        // which supersedes ASC pp.115-116, through the routine the walker uses too (#636).
        const move_heat = alphaStrikeMovementHeat({
            jumpMP: this.getJumpSpeed(), xxl: this.isXXLEngine(), improvedJets: this._jumpJetType.tag === "improved",
            industrial: this.isIndustrialMech(),
        });
        // Rear-firing weapons add no heat, unless they make more than the forward weapons; then theirs counts instead.
        const rearHotter = rearWeaponHeat > frontWeaponHeat;
        const weaponHeat = rearHotter ? rearWeaponHeat : frontWeaponHeat;
        const weaponHeatLong = rearHotter ? rearWeaponHeatLong : frontWeaponHeatLong;
        const extraHeat = alphaStrikeExtraHeat({
            equipmentTags: this._equipmentList.filter((item) => !item.isAmmo).map((item) => item.tag),
            stealthArmor: this._armorType.tag === "stealth-basic" || this._armorType.tag === "stealth-improved",
        });
        const heatDissipation = this.getHeatSinks() * this._heatSinkType.dissipation + this.getEquipmentHeatDissipation();
        const heatOutput = move_heat + weaponHeat + extraHeat;
        const heatOutputLong = move_heat + weaponHeatLong + extraHeat;
        const subtotals = [this._alphaStrikeForceStats.damage.short, this._alphaStrikeForceStats.damage.medium,
            this._alphaStrikeForceStats.damage.long, this._alphaStrikeForceStats.damage.extreme].map((value) => +value || 0);
        const heat = applyAlphaStrikeHeat({ subtotals, heatOutput, longHeatOutput: heatOutputLong, dissipation: heatDissipation });

        this._calcLogAS += "<strong>Damage subtotals: " + subtotals.map((value) => value.toFixed(2)).join(" / ") + "</strong><br />\n";
        this._calcLogAS += "Heat: " + move_heat + " movement + " + weaponHeat + (rearHotter ? " rear (hotter than the forward)" : "") + " weapon"
            + (extraHeat > 0 ? " + " + extraHeat + " AMS / stealth" : "") + " = " + heatOutput + " (Long " + heatOutputLong + "), less 4, against "
            + heatDissipation + " dissipation<br />\n";
        if (heat.hot) this._calcLogAS += "Heat-modified damage: " + heat.modified.map((value) => value.toFixed(1)).join(" / ") + "<br />\n";

        const [shortValue, mediumValue, longValue, extremeValue] = heat.values;
        this._alphaStrikeForceStats.damage.short = shortValue.damage;
        this._alphaStrikeForceStats.damage.shortMinimal = shortValue.minimal;
        this._alphaStrikeForceStats.damage.medium = mediumValue.damage;
        this._alphaStrikeForceStats.damage.mediumMinimal = mediumValue.minimal;
        this._alphaStrikeForceStats.damage.long = longValue.damage;
        this._alphaStrikeForceStats.damage.longMinimal = longValue.minimal;
        this._alphaStrikeForceStats.damage.extreme = extremeValue.damage;
        this._alphaStrikeForceStats.damage.extremeMinimal = extremeValue.minimal;

        // OVL is printed only when there is an Overheat to use at Long range (it does nothing otherwise).
        const final_overheat_value = heat.overheat;
        const final_long_overheat_value = heat.ovl ? heat.overheat : 0;
        if (final_long_overheat_value > 0) this._alphaStrikeForceStats.abilityCodes.push("OVL");
        this._alphaStrikeForceStats.ov = final_overheat_value;

        this._calcLogAS += "<strong>Final Damage: " + heat.values.map((value) => (value.minimal ? "0*" : String(value.damage))).join(" / ") + "</strong><br />\n";
        this._calcLogAS += "<strong>Final Overheat Value: " + final_overheat_value + (final_long_overheat_value > 0 ? ", OVL" : "") + "</strong><br />\n";

        this._alphaStrikeForceStats.overheat = final_overheat_value;
        this._alphaStrikeForceStats.longOverheat = final_long_overheat_value;

        // Offensive Special Ability Factor
        // TODO

        this._alphaStrikeForceStats.name = this._model;
        this._alphaStrikeForceStats.type = "BM";

        const alphaStrikeCalculation = calculateAlphaStrikeValue(
            this._alphaStrikeForceStats,
            rearDamage,
            heatDamage,
            lrmDamage,
            flakDamage,
            acDamage,
            srmDamage,
            mslDamage,
            indirectFireRating,
            heat.factor,
        );

        this._calcLogAS += alphaStrikeCalculation.calcLogs;
        const finalValue = alphaStrikeCalculation.finalValue;
        this._alphaStrikeForceStats = alphaStrikeCalculation.alphaStrikeForceStats;

        this._alphaStrikeValue = Math.round(finalValue); // + " (WIP)";
        const asMechData: IASMULUnit = {
            FormatedTonnage: this._tonnage.toString(),
            GroupName: "",
            BFAbilities: "",             // "";
            BFArmor: 0,             // number;
            BFDamageExtreme: 0,             // number;
            BFDamageLong: 0,            // number;
            BFDamageMedium: 0,          // number;
            BFDamageShort: 0,           // number;
            BFMove: "",          // string;
            BFOverheat: 0,          // number;
            BFPointValue: 0,            // number;
            BFSize: 0,          // number;
            BFStructure: 0,             // number;
            BFTMM: 0,           // number;
            BFThreshold: 0,             // number;
            BFType: "",          // string;
            BattleValue: 0,             // number;
            Class: "",           // string;
            Cost: 0,            // number;
            DateIntroduced: "",          // string;
            EraIcon: "",           //
            EraId: 0,           // number;
            EraStart: 0,            // number;
            Id: 0,          // number;
            ImageUrl: "",            // string;
            IsFeatured: true,          // true
            IsPublished: true,             // true
            Name: "",            // string;
            RS: "",          // string;
            RSId: 0,            // number;
            Release: 0,             // number;
            Role: {
                Name: "",
                Id: 0,
                Image: "",
                SortOrder: 0,
            },            // ASMULRole;
            Rules: "",           // string;
            Skill: 0,           // number;
            TRO: "",             // string;
            TROId: 0,           // number;
            Technology: {
                Name: "",
                Id: 0,
                SortOrder: 0,
                Image: "",
            },          // ASMULTech;
            Tonnage: 0,             // number;
            Type: {
                Name: "",
                Id: 0,
                SortOrder: 0,
                Image: "",
            },            // ASMULType;
            Variant: "",             // string;

            // // classification: "",
            // costCR: 0,
            // mulID: 0,
            // currentHeat: 0,
            // damage: {
            //     short: 0,
            //     medium: 0,
            //     long: 0,
            //     extreme: 0,
            // },
            // variant: "",
            // dateIntroduced: "",
            // name: "",
            // tonnage: 0,
            // tro: "",
            // role: "",
            // threshold: 0,
            // move: [],
            // jumpMove: 0,
            // structure: 0,
            // armor: 0,
            // type: "",
            // size: 0,
            // showDetails: false,
            // abilities: "",
            // overheat: 0,
            // basePoints: 0,
            // currentSkill: 0,
            // pilot: this._pilot.export(),
        };
        asMechData["BFPointValue"] = Math.round(finalValue);

        asMechData["Name"] = this.getName();
        asMechData["BFThreshold"] = 0;
        asMechData["Role"].Name = this._alphaStrikeForceStats.role;
        asMechData["BFType"] = "BM";
        asMechData["BFSize"] = this._alphaStrikeForceStats.sizeClass;

        asMechData["BFArmor"] = this._alphaStrikeForceStats.armor;
        asMechData["BFStructure"] = this._alphaStrikeForceStats.structure;

        asMechData["BFOverheat"] = final_overheat_value;

        asMechData["BFDamageShort"] = +this._alphaStrikeForceStats.damage.short;
        asMechData["BFDamageMedium"] = +this._alphaStrikeForceStats.damage.medium;
        asMechData["BFDamageLong"] = +this._alphaStrikeForceStats.damage.long;
        asMechData["BFDamageExtreme"] = +this._alphaStrikeForceStats.damage.extreme;
        asMechData["BFDamageShortMin"] = !!this._alphaStrikeForceStats.damage.shortMinimal;
        asMechData["BFDamageMediumMin"] = !!this._alphaStrikeForceStats.damage.mediumMinimal;
        asMechData["BFDamageLongMin"] = !!this._alphaStrikeForceStats.damage.longMinimal;
        asMechData["BFDamageExtremeMin"] = !!this._alphaStrikeForceStats.damage.extremeMinimal;

        asMechData["BFOverheat"] = this._alphaStrikeForceStats.overheat;


        if( this._alphaStrikeForceStats.jumpMove) {
            asMechData["BFMove"] = this._alphaStrikeForceStats.move.toString() + "\"/" + this._alphaStrikeForceStats.jumpMove + "\"J";
        } else {
            asMechData["BFMove"] = this._alphaStrikeForceStats.move.toString() + "\"";
        }

        this._alphaStrikeForceStats.abilityCodes.sort();
        asMechData["BFAbilities"] = this._alphaStrikeForceStats.abilityCodes.join( ", " ).toUpperCase();

        const unitObj = new AlphaStrikeUnit();

        unitObj.customName = this._alphaStrikeForceStats.customName;
        unitObj.setPilotSkill( this._pilot.gunnery );
        unitObj.importMUL( asMechData )
        unitObj.mechCreatorUUID = this._uuid;
        unitObj.quirks = getAlphaStrikeQuirks(this);
        unitObj.quirkEraStart = this.getEra().yearStart;
        // Carry the design's rules level so the Alpha Strike print guard and stamp apply.
        unitObj.rulesLevel = this.getRequiredRulesLevel();
        // The card credits the Special Rulesets the design is built under (#324).
        unitObj.rulesets = this.getRulesets();
        return unitObj;

    }

    public makeTROBBCode() {

        const typeTag = this._mechType.tag.toLowerCase();
        let html = "";
        // Header Info
        html += "Type: " + this.getName() + "\n";
        html += "Technology Base: " + this.getTech().name + "\n";
        if (this.getConstructionName()) html += "Construction: " + this.getConstructionName() + "\n";
        html += "Era: " + this.getEra().name + "\n";
        html += "Tonnage: " + this.getTonnage() + "\n";
        html += "Battle Value: " + this.getBattleValue() + "\n";
        html += "Alpha Strike Value: " + this.getAlphaStrikeValue() + "\n";
        html += "C-Bill Cost: $" + this.getCBillCost() + "\n";
        html += "\n";

        if( this._isAnachronistic() ) {
            html += "This 'mech is Anachronistic\n\n";
        }

        let col1Padding = 25;
        let col2Padding = 15;
        let col3Padding = 10;
        let col4Padding = 10;

        // Equipment
        html += "Equipment".padEnd(col1Padding + col2Padding, " " ) + "Mass\n";
        html += "" + ( "Internal Structure ( " + this.getInternalStructureLabel() + " )" ).toString().padEnd(col1Padding + col2Padding, " " ) + "" + this.getInternalStructureWeight() + "\n";
        for (const line of this._getFrankenMechReadoutLines()) {
            html += "  " + line + "\n";
        }
        html += "" + this.getEngineName().padEnd(col1Padding, " " ) + "" + this.getEngineRating().toString().padEnd(col2Padding, " " ) + "" + this.getEngineWeight() + "\n";

        html += "Walking".padStart(col1Padding - 10, " " ) + " " + this.getWalkSpeed().toString().padStart(3, " " ) + "\n";
        html += "Running".padStart(col1Padding - 10, " " ) + " " + this.getRunSpeed().toString().padStart(3, " " ) + "\n";
        html += "Jumping".padStart(col1Padding - 10, " " ) + " " + this.getJumpSpeed().toString().padStart(3, " " ) + "\n";
        if( this.getJumpPackTons() > 0 )
            html += `Jump Pack (${this.getJumpPackTons()} t)`.padStart(col1Padding - 10, " " ) + " " + this.getJumpPackMP().toString().padStart(3, " " ) + "\n";
        if( this.getMechanicalJumpBoosterSpeed() > 0 )
            html += "Jump Boosters".padStart(col1Padding - 10, " " ) + " " + this.getMechanicalJumpBoosterSpeed().toString().padStart(3, " " ) + "\n";
        if( this.getUMUSpeed() > 0 )
            html += "UMU".padStart(col1Padding - 10, " " ) + " " + this.getUMUSpeed().toString().padStart(3, " " ) + "\n";

        html += "" + this.getHeatSyncName().padEnd(col1Padding, " " ) + "" + this.getHeatSinks().toString().padEnd(col2Padding, " " ) + "" + this.getHeatSinksWeight() + "\n";
        html += "" + this.getGyroName().padEnd(col1Padding + col2Padding, " " ) + "" + this.getGyroWeight() + "\n";

        if( this._smallCockpit || this._torsoMountedCockpit || this._interfaceCockpit ) {
            html += this.getCockpitType().name.padEnd(col1Padding + col2Padding, " " ) + "" + this.getCockpitWeight() + "\n";
        } else {
            html += "Cockpit".padEnd(col1Padding + col2Padding, " " ) + "" + this.getCockpitWeight() + "\n";
        }
        if( this.hasCommandConsole() ) {
            const console = getCockpitType("command-console");
            html += console.name.padEnd(col1Padding + col2Padding, " " ) + "" + console.weight + "\n";
        }
        if( this.hasEnhancedImaging() ) {
            html += this._getEnhancedImaging().name.padEnd(col1Padding + col2Padding, " " ) + "0\n";
        }
        if( this.isArmless() ) {
            html += armlessMechOption.name.padEnd(col1Padding + col2Padding, " " ) + "0\n";
        }

        // if( this.getJumpJetWeight() > 0 ) {
        // html += "Jump Jets".padEnd( " ",col1Padding + col2Padding) + "" + this.getJumpJetWeight() + "\n";
        // }

        if( this._mechType.tag === "biped" ) {
            html += "Actuators: ";
            let actuator_html = "";

            if( this.hasLowerArmActuator( "ra" ))
                actuator_html += "RLA, ";
            if( this.hasLowerArmActuator( "la" ))
                actuator_html += "LLA, ";
            if( this.hasHandActuator( "ra" ))
                actuator_html += "RH, ";
            if( this.hasHandActuator( "la" ))
                actuator_html += "LH, ";

            if( actuator_html === "" )
                actuator_html = "No lower arm actuators";
            else
                actuator_html = actuator_html.substring(0, actuator_html.length - 2);

            html += actuator_html;
            html += "\n";
        }

        html += "" + ( "Armor Value ( " + this._armorType.name + " )" ).padEnd(col1Padding, " " ) + "" + this.getTotalArmor().toString().padEnd(col2Padding, " " ) + "" + this.getArmorWeight() + "\n";
        for (const line of this._getPatchworkReadoutLines()) {
            html += "  " + line + "\n";
        }

        col1Padding = 20;
        col2Padding = 10;
        col3Padding = 15;
        col4Padding = 10;

        // Armor Factor Table
        html += "Internal Structure".padStart(col1Padding + col2Padding, " ") + "Armor Value".padStart(col3Padding, " ") + "\n";
        html += "Head".padStart(col1Padding, " ") + "" + this._internalStructure.head.toString().padStart(col2Padding, " ") + "" + this._armorAllocation.head.toString().padStart(col3Padding, " ") + "\n";
        html += "Center Torso".padStart(col1Padding, " ") + "" + this._internalStructure.centerTorso.toString().padStart(col2Padding, " ") + "" + this._armorAllocation.centerTorso.toString().padStart(col3Padding, " ") + "\n";
        html += "Center Torso (Rear)".padStart(col1Padding, " ") + "".padStart(col2Padding, " ") + "" + this._armorAllocation.centerTorsoRear.toString().padStart(col3Padding, " ") + "\n"; 
        if (this._armorAllocation.rightTorso === this._armorAllocation.leftTorso && this._armorAllocation.rightTorsoRear === this._armorAllocation.leftTorsoRear) {
            html += "R/L Torso".padStart(col1Padding, " ") + "" + this._internalStructure.rightTorso.toString().padStart(col2Padding, " ") + "" + this._armorAllocation.rightTorso.toString().padStart(col3Padding, " ") + "\n";
            html += "R/L Torso (Rear)".padStart(col1Padding, " ") + "".padStart(col2Padding, " ") + "" + this._armorAllocation.rightTorsoRear.toString().padStart(col3Padding, " ") + "\n";
        } else {
            html += "Right Torso".padStart(col1Padding, " ") + "" + this._internalStructure.rightTorso.toString().padStart(col2Padding, " ") + "" + this._armorAllocation.rightTorso.toString().padStart(col3Padding, " ") + "\n";
            html += "Right Torso (Rear)".padStart(col1Padding, " ") + "".padStart(col2Padding, " ") + "" + this._armorAllocation.rightTorsoRear.toString().padStart(col3Padding, " ") + "\n";
            html += "Left Torso".padStart(col1Padding, " ") + "" + this._internalStructure.leftTorso.toString().padStart(col2Padding, " ") + "" + this._armorAllocation.leftTorso.toString().padStart(col3Padding, " ") + "\n";
            html += "Left Torso (Rear)".padStart(col1Padding, " ") + "".padStart(col2Padding, " ") + "" + this._armorAllocation.leftTorsoRear.toString().padStart(col3Padding, " ") + "\n";
        }
        if (typeTag === "biped" || typeTag === "lam") {
            const rightArmIS = this._internalStructure.rightArm ?? 0;
            const leftArmIS = this._internalStructure.leftArm ?? 0;
            const rightArmArmor = this._armorAllocation.rightArm ?? 0;
            const leftArmArmor = this._armorAllocation.leftArm ?? 0;
            const rightLegIS = this._internalStructure.rightLeg;
            const leftLegIS = this._internalStructure.leftLeg;
            const rightLegArmor = this._armorAllocation.rightLeg;
            const leftLegArmor = this._armorAllocation.leftLeg;
            if (rightArmArmor === leftArmArmor && rightArmIS === leftArmIS) {
                html += "R/L Arm".padStart(col1Padding, " ") + "" + rightArmIS.toString().padStart(col2Padding, " ") + "" + rightArmArmor.toString().padStart(col3Padding, " ") + "\n";
            } else {
                html += "Right Arm".padStart(col1Padding, " ") + "" + rightArmIS.toString().padStart(col2Padding, " ") + "" + rightArmArmor.toString().padStart(col3Padding, " ") + "\n";
                html += "Left Arm".padStart(col1Padding, " ") + "" + leftArmIS.toString().padStart(col2Padding, " ") + "" + leftArmArmor.toString().padStart(col3Padding, " ") + "\n";
            }
            if (rightLegArmor === leftLegArmor && rightLegIS === leftLegIS) {
                html += "R/L Leg".padStart(col1Padding, " ") + "" + rightLegIS.toString().padStart(col2Padding, " ") + "" + rightLegArmor.toString().padStart(col3Padding, " ") + "\n";
            } else {
                html += "Right Leg".padStart(col1Padding, " ") + "" + rightLegIS.toString().padStart(col2Padding, " ") + "" + rightLegArmor.toString().padStart(col3Padding, " ") + "\n";
                html += "Left Leg".padStart(col1Padding, " ") + "" + leftLegIS.toString().padStart(col2Padding, " ") + "" + leftLegArmor.toString().padStart(col3Padding, " ") + "\n";
            }
        } else if (typeTag === "quad" || typeTag === "quadvee") {
            const frontRightLegIS = this._internalStructure.frontRightLeg ?? 0;
            const frontLeftLegIS = this._internalStructure.frontLeftLeg ?? 0;
            const frontRightLegArmor = this._armorAllocation.frontRightLeg ?? 0;
            const frontLeftLegArmor = this._armorAllocation.frontLeftLeg ?? 0;
            const rearRightLegIS = this._internalStructure.rightLeg;
            const rearLeftLegIS = this._internalStructure.leftLeg;
            const rearRightLegArmor = this._armorAllocation.rightLeg;
            const rearLeftLegArmor = this._armorAllocation.leftLeg;
            if (frontRightLegArmor === frontLeftLegArmor && frontRightLegIS === frontLeftLegIS) {
                html += "R/L Front Leg".padStart(col1Padding, " ") + "" + frontRightLegIS.toString().padStart(col2Padding, " ") + "" + frontRightLegArmor.toString().padStart(col3Padding, " ") + "\n";
            } else {
                html += "Right Front Leg".padStart(col1Padding, " ") + "" + frontRightLegIS.toString().padStart(col2Padding, " ") + "" + frontRightLegArmor.toString().padStart(col3Padding, " ") + "\n";
                html += "Left Front Leg".padStart(col1Padding, " ") + "" + frontLeftLegIS.toString().padStart(col2Padding, " ") + "" + frontLeftLegArmor.toString().padStart(col3Padding, " ") + "\n";
            }
            if (rearRightLegArmor === rearLeftLegArmor && rearRightLegIS === rearLeftLegIS) {
                html += "R/L Rear Leg".padStart(col1Padding, " ") + "" + rearRightLegIS.toString().padStart(col2Padding, " ") + "" + rearRightLegArmor.toString().padStart(col3Padding, " ") + "\n";
            } else {
                html += "Right Rear Leg".padStart(col1Padding, " ") + "" + rearRightLegIS.toString().padStart(col2Padding, " ") + "" + rearRightLegArmor.toString().padStart(col3Padding, " ") + "\n";
                html += "Left Rear Leg".padStart(col1Padding, " ") + "" + rearLeftLegIS.toString().padStart(col2Padding, " ") + "" + rearLeftLegArmor.toString().padStart(col3Padding, " ") + "\n";
            }
        } else if (typeTag === "tripod") {
            const rightLegIS = this._internalStructure.rightLeg;
            const leftLegIS = this._internalStructure.leftLeg;
            const centerLegIS = this._internalStructure.centerLeg ?? 0;
            const rightLegArmor = this._armorAllocation.rightLeg;
            const leftLegArmor = this._armorAllocation.leftLeg;
            const centerLegArmor = this._armorAllocation.centerLeg ?? 0;
            const rightArmIS = this._internalStructure.rightArm ?? 0;
            const leftArmIS = this._internalStructure.leftArm ?? 0;
            const rightArmArmor = this._armorAllocation.rightArm ?? 0;
            const leftArmArmor = this._armorAllocation.leftArm ?? 0;
            if (rightArmIS > 0 || leftArmIS > 0 || rightArmArmor > 0 || leftArmArmor > 0) {
                if (rightArmArmor === leftArmArmor && rightArmIS === leftArmIS) {
                    html += "R/L Arm".padStart(col1Padding, " ") + "" + rightArmIS.toString().padStart(col2Padding, " ") + "" + rightArmArmor.toString().padStart(col3Padding, " ") + "\n";
                } else {
                    html += "Right Arm".padStart(col1Padding, " ") + "" + rightArmIS.toString().padStart(col2Padding, " ") + "" + rightArmArmor.toString().padStart(col3Padding, " ") + "\n";
                    html += "Left Arm".padStart(col1Padding, " ") + "" + leftArmIS.toString().padStart(col2Padding, " ") + "" + leftArmArmor.toString().padStart(col3Padding, " ") + "\n";
                }
            }
            if (rightLegArmor === leftLegArmor && rightLegIS === leftLegIS) {
                html += "R/L Leg".padStart(col1Padding, " ") + "" + rightLegIS.toString().padStart(col2Padding, " ") + "" + rightLegArmor.toString().padStart(col3Padding, " ") + "\n";
            } else {
                html += "Right Leg".padStart(col1Padding, " ") + "" + rightLegIS.toString().padStart(col2Padding, " ") + "" + rightLegArmor.toString().padStart(col3Padding, " ") + "\n";
                html += "Left Leg".padStart(col1Padding, " ") + "" + leftLegIS.toString().padStart(col2Padding, " ") + "" + leftLegArmor.toString().padStart(col3Padding, " ") + "\n";
            }
            html += "Center Leg".padStart(col1Padding, " ") + "" + centerLegIS.toString().padStart(col2Padding, " ") + "" + centerLegArmor.toString().padStart(col3Padding, " ") + "\n";
        } else {
            // Fallback: Default directly to a Standard Biped template layout structure
            const rightArmIS = this._internalStructure.rightArm ?? 0;
            const leftArmIS = this._internalStructure.leftArm ?? 0;
            const rightArmArmor = this._armorAllocation.rightArm ?? 0;
            const leftArmArmor = this._armorAllocation.leftArm ?? 0;
            const rightLegIS = this._internalStructure.rightLeg;
            const leftLegIS = this._internalStructure.leftLeg;
            const rightLegArmor = this._armorAllocation.rightLeg;
            const leftLegArmor = this._armorAllocation.leftLeg;
            if (rightArmArmor === leftArmArmor && rightArmIS === leftArmIS) {
                html += "R/L Arm".padStart(col1Padding, " ") + "" + rightArmIS.toString().padStart(col2Padding, " ") + "" + rightArmArmor.toString().padStart(col3Padding, " ") + "\n";
            } else {
                html += "Right Arm".padStart(col1Padding, " ") + "" + rightArmIS.toString().padStart(col2Padding, " ") + "" + rightArmArmor.toString().padStart(col3Padding, " ") + "\n";
                html += "Left Arm".padStart(col1Padding, " ") + "" + leftArmIS.toString().padStart(col2Padding, " ") + "" + leftArmArmor.toString().padStart(col3Padding, " ") + "\n";
            }
            if (rightLegArmor === leftLegArmor && rightLegIS === leftLegIS) {
                html += "R/L Leg".padStart(col1Padding, " ") + "" + rightLegIS.toString().padStart(col2Padding, " ") + "" + rightLegArmor.toString().padStart(col3Padding, " ") + "\n";
            } else {
                html += "Right Leg".padStart(col1Padding, " ") + "" + rightLegIS.toString().padStart(col2Padding, " ") + "" + rightLegArmor.toString().padStart(col3Padding, " ") + "\n";
                html += "Left Leg".padStart(col1Padding, " ") + "" + leftLegIS.toString().padStart(col2Padding, " ") + "" + leftLegArmor.toString().padStart(col3Padding, " ") + "\n";
            }
        }
        // End Factor Table
        html += "";
        html += "\n";

        col1Padding = 20;
        col2Padding = 10;
        col3Padding = 10;
        col4Padding = 10;

        this._equipmentList.sort(sortByLocationThenName);

        // Weapons and Ammo
        for( let countEQ = 0; countEQ < this._equipmentList.length; countEQ++) {
            if( this._equipmentList[countEQ].name.length + 3 > col1Padding)
                col1Padding = this._equipmentList[countEQ].name.length + 3;
        }

        for( let locC = 0; locC < this._validJJLocations.length; locC++) {

            for( let critC = 0; critC < this._criticals[this._validJJLocations[locC].long].length; critC++) {
                const item = this._criticals[this._validJJLocations[locC].long][critC];
                if(
                    item &&
                    item.tag &&
                    item.tag.indexOf( "jj-" ) === 0
                ) {
                    if( item.name.length + 3 > col1Padding)
                        col1Padding = item.name.length + 3;
                }
            }
        }

        html += "Weapons\n";

        html += "and Ammo".padEnd(col1Padding, " " ) + "Location".padEnd(col2Padding, " " ) + "Critical".padEnd(col3Padding, " " ) + "Tonnage".padEnd(col4Padding, " " ) + "\n";

        for( let countEQ = 0; countEQ < this._equipmentList.length; countEQ++) {
            const currentItem = this._equipmentList[countEQ];

            if( typeof(currentItem.location) === "undefined" )
                currentItem.location = "n/a";

            let item_location = this._getLocationAbbr(currentItem.location);

            if( currentItem.rear)
                item_location += " (R)"
            else if( this.isTurretMounted(currentItem) )
                item_location += " (T)"

            if( currentItem.isAmmo && this.getAmmoBinCapacity(currentItem) > 0) {
                html += "" + (currentItem.name + " " + this.getAmmoBinCapacity(currentItem)).padEnd(col1Padding, " " ) + "" + item_location.toUpperCase().toString().padEnd(col2Padding, " " ) + "" + this.getCriticalSlots(currentItem.space.battlemech).toString().padEnd(col3Padding, " " ) + "" + currentItem.weight.toString().padEnd(col4Padding, " " ) + "\n";
            } else {
                html += "" + currentItem.name.padEnd(col1Padding, " " ) + "" + item_location.toUpperCase().toString().padEnd(col2Padding, " " ) + "" + this.getCriticalSlots(currentItem.space.battlemech).toString().padEnd(col3Padding, " " ) + "" + currentItem.weight.toString().padEnd(col4Padding, " " ) + "\n";
            }

        }

        // List Jump Jets Allocations...

        for( let locC = 0; locC < this._validJJLocations.length; locC++) {

            const jjObjs = [];
            for( let critC = 0; critC < this._criticals[this._validJJLocations[locC].long].length; critC++) {
                const currentItem = this._criticals[this._validJJLocations[locC].long][critC];
                if(
                    currentItem &&
                    currentItem.tag &&
                    currentItem.tag.indexOf( "jj-" ) === 0
                ) {
                    jjObjs.push(currentItem);
                }
            }

            if( jjObjs.length > 0) {
                let areaWeight = 0;
                areaWeight = jjObjs.length * this._jumpJetWeightEach();
                html += "" + jjObjs[0].name.padEnd(col1Padding, " " ) + "" + this._validJJLocations[locC].short.toUpperCase().padEnd(col2Padding, " " ) + "" + jjObjs.length.toString().padEnd(col3Padding, " " ) + "" + areaWeight.toString().padEnd(col4Padding, " " ) + "\n";

            }
        }

        const jjObjs = [];

        for( let critC = 0; critC < this._unallocatedCriticals.length; critC++) {
            if(
                this._unallocatedCriticals[critC] &&
                this._unallocatedCriticals[critC].tag &&
                this._unallocatedCriticals[critC].tag.indexOf( "jj-" ) === 0
            ) {
                jjObjs.push(this._unallocatedCriticals[critC]);
            }
        }

        if( jjObjs.length > 0) {
            let areaWeight = 0;
            areaWeight = jjObjs.length * this._jumpJetWeightEach();
            html += "" + jjObjs[0].name.padEnd(col1Padding, " " ) + "n/a".toUpperCase().padEnd(col2Padding, " " ) + "" + jjObjs.length.toString().padEnd(col3Padding, " " ) + "" + areaWeight.toString().padEnd(col4Padding, " " ) + "\n";

        }

        const createdBy = "\n\nCreated with BattleTech Tools: [url]https://heysporky.github.io/battletech-tools/[/url]\n\n";

        return "[code]" + html + "[/code]" + createdBy;

    }

    public makeTROHTML() {

        // TRO output flows through SanitizedHTML raw={true} (dangerouslySetInnerHTML), so
        // every user-supplied string interpolated below must be HTML-escaped. Chassis name /
        // model / nickname come straight from imported JSON; equipment names from custom
        // catalogs can also be attacker-controlled.
        const esc = (v: unknown) => this._escapeLogText(v);

        let html = "<table class=\"mech-tro\">";
        const typeTag = this._mechType.tag.toLowerCase();

        // Header Info
        html += "<tr><td colspan=\"4\">Type: " + esc(this.getName()) + "</td></tr>";
        html += "<tr><td colspan=\"4\">Technology Base: " + esc(this.getTech().name) + "</td></tr>";
        if (this.getConstructionName()) html += "<tr><td colspan=\"4\">Construction: " + esc(this.getConstructionName()!) + "</td></tr>";
        html += "<tr><td colspan=\"4\">Era: " + esc(this.getEra().name) + "</td></tr>";
        html += "<tr><td colspan=\"4\">Tonnage: " + this.getTonnage() + "</td></tr>";
        html += "<tr><td colspan=\"4\">Battle Value: " + this.getBattleValue() + "</td></tr>";
        html += "<tr><td colspan=\"4\">Alpha Strike Value: " + this.getAlphaStrikeValue() + "</td></tr>";
        html += "<tr><td colspan=\"4\">C-Bill Cost: $" + this.getCBillCost() + "</td></tr>";
        html += "<tr><td colspan=\"4\">C-Bill Cost with Ammo: $" + this.getCBillCost(true) + "</td></tr>";
        html += "<tr><td colspan=\"4\">&nbsp;</td></tr>";

        if( this._isAnachronistic() ) {
            html += "<tr><td colspan=\"4\">This 'mech is Anachronistic</td></tr>";
            html += "<tr><td colspan=\"4\">&nbsp;</td></tr>";
        }

        // Equipment
        html += "<tr><th class=\"text-left\" colspan=\"3\">Equipment</th><th class=\"text-center\" colspan=\"1\">Mass</th></tr>";
        html += "<tr><td colspan=\"3\">Internal Structure ( " + esc(this.getInternalStructureLabel()) + " )</td><td class=\"text-center\" colspan=\"1\">" + this.getInternalStructureWeight() + "</td></tr>";
        for (const line of this._getFrankenMechReadoutLines()) {
            html += "<tr><td colspan=\"4\">&nbsp;&nbsp;" + esc(line) + "</td></tr>";
        }
        html += "<tr><td colspan=\"1\">" + esc(this.getEngineName()) + "</td><td class=\"text-center\" colspan=\"2\">" + this.getEngineRating() + "</td><td class=\"text-center\" colspan=\"1\">" + this.getEngineWeight() + "</td></tr>";

        html += "<tr><td colspan=\"1\" class=\"text-right\">Walking</td><td class=\"text-center\" colspan=\"2\">" + this.getWalkSpeed() + "</td><td colspan=\"1\">&nbsp;</td></tr>";
        html += "<tr><td colspan=\"1\" class=\"text-right\">Running</td><td class=\"text-center\" colspan=\"2\">" + this.getRunSpeed() + "</td><td colspan=\"1\">&nbsp;</td></tr>";
        html += "<tr><td colspan=\"1\" class=\"text-right\">Jumping</td><td class=\"text-center\" colspan=\"2\">" + this.getJumpSpeed() + "</td><td colspan=\"1\">&nbsp;</td></tr>";
        if( this.getJumpPackTons() > 0 )
            html += "<tr><td colspan=\"1\" class=\"text-right\">Jump Pack (" + this.getJumpPackTons() + " t)</td><td class=\"text-center\" colspan=\"2\">" + this.getJumpPackMP() + "</td><td colspan=\"1\">&nbsp;</td></tr>";
        if( this.getMechanicalJumpBoosterSpeed() > 0 )
            html += "<tr><td colspan=\"1\" class=\"text-right\">Jump Boosters</td><td class=\"text-center\" colspan=\"2\">" + this.getMechanicalJumpBoosterSpeed() + "</td><td colspan=\"1\">&nbsp;</td></tr>";
        if( this.getUMUSpeed() > 0 )
            html += "<tr><td colspan=\"1\" class=\"text-right\">UMU</td><td class=\"text-center\" colspan=\"2\">" + this.getUMUSpeed() + "</td><td colspan=\"1\">&nbsp;</td></tr>";

        html += "<tr><td colspan=\"1\">" + esc(this.getHeatSyncName()) + "</td><td class=\"text-center\" colspan=\"2\">" + this.getHeatSinks() + "</td><td class=\"text-center\" colspan=\"1\">" + this.getHeatSinksWeight() + "</td></tr>";
        html += "<tr><td colspan=\"3\">" + esc(this.getGyroName()) + "</td><td class=\"text-center\" colspan=\"1\">" + this.getGyroWeight() + "</td></tr>";

        if( this._smallCockpit || this._torsoMountedCockpit || this._interfaceCockpit ) {
            html += "<tr><td colspan=\"3\">" + esc(this.getCockpitType().name) + "</td><td class=\"text-center\" colspan=\"1\">" + this.getCockpitWeight() + "</td></tr>";
        } else {
            html += "<tr><td colspan=\"3\">Cockpit</td><td class=\"text-center\" colspan=\"1\">" + this.getCockpitWeight() + "</td></tr>";
        }
        if( this.hasCommandConsole() ) {
            const console = getCockpitType("command-console");
            html += "<tr><td colspan=\"3\">" + esc(console.name) + "</td><td class=\"text-center\" colspan=\"1\">" + console.weight + "</td></tr>";
        }
        if( this.hasEnhancedImaging() ) {
            html += "<tr><td colspan=\"3\">" + esc(this._getEnhancedImaging().name) + "</td><td class=\"text-center\" colspan=\"1\">0</td></tr>";
        }
        if( this.isArmless() ) {
            html += "<tr><td colspan=\"3\">" + armlessMechOption.name + "</td><td class=\"text-center\" colspan=\"1\">0</td></tr>";
        }

        if( typeTag === "biped" || typeTag === "lam" || typeTag === "tripod" ) {
            html += "<tr><td colspan=\"4\">Actuators: ";
            let actuator_html = "";

            if( this.hasLowerArmActuator( "ra" ))
                actuator_html += "RLA, ";
            if( this.hasLowerArmActuator( "la" ))
                actuator_html += "LLA, ";
            if( this.hasHandActuator( "ra" ))
                actuator_html += "RH, ";
            if( this.hasHandActuator( "la" ))
                actuator_html += "LH, ";

            if( actuator_html === "" )
                actuator_html = "No lower arm actuators";
            else
                actuator_html = actuator_html.substring(0, actuator_html.length - 2);

            html += actuator_html;
            html += "</td></tr>";
        }

        html += "<tr><th colspan=\"1\">Armor Value ( " + esc(this._armorType.name) + " )</th><th class=\"text-center\" colspan=\"2\">" + this.getTotalArmor() + "</th><th class=\"text-center\" colspan=\"1\">" + this.getArmorWeight() + "</th></tr>";
        for (const line of this._getPatchworkReadoutLines()) {
            html += "<tr><td colspan=\"4\">&nbsp;&nbsp;" + esc(line) + "</td></tr>";
        }

        // Armor Factor Table
        html += "<tr><td colspan=\"1\"></td><td class=\"text-center\" colspan=\"1\"><em style=\"font-size: 12px;\">Internal Structure</em></td><td class=\"text-center\" colspan=\"1\"><em style=\"font-size: 12px;\">Armor Value</em></td><td>&nbsp;</td></tr>";
        html += "<tr><td  class=\"text-right\"colspan=\"1\">Head</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.head + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.head + "</td><td>&nbsp;</td></tr>";
        html += "<tr><td  class=\"text-right\"colspan=\"1\">Center Torso</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.centerTorso + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.centerTorso + "</td><td>&nbsp;</td></tr>";
        html += "<tr><td  class=\"text-right\"colspan=\"1\">Center Torso (Rear)</td><td class=\"text-center\" colspan=\"1\">&nbsp;</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.centerTorsoRear + "</td><td>&nbsp;</td></tr>";
        if( this._armorAllocation.rightTorso === this._armorAllocation.leftTorso && this._armorAllocation.rightTorsoRear === this._armorAllocation.leftTorsoRear) {
            html += "<tr><td  class=\"text-right\"colspan=\"1\">R/L Torso</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightTorso + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightTorso + "</td><td>&nbsp;</td></tr>";
            html += "<tr><td  class=\"text-right\"colspan=\"1\">R/L Torso (Rear)</td><td class=\"text-center\" colspan=\"1\">&nbsp;</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightTorsoRear + "</td><td>&nbsp;</td></tr>";
        } else {
            html += "<tr><td  class=\"text-right\"colspan=\"1\">Right Torso</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightTorso + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightTorso + "</td><td>&nbsp;</td></tr>";
            html += "<tr><td  class=\"text-right\"colspan=\"1\">Right Torso (Rear)</td><td class=\"text-center\" colspan=\"1\">&nbsp;</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightTorsoRear + "</td><td>&nbsp;</td></tr>";

            html += "<tr><td  class=\"text-right\"colspan=\"1\">Left Torso</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.leftTorso + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.leftTorso + "</td><td>&nbsp;</td></tr>";
            html += "<tr><td  class=\"text-right\"colspan=\"1\">Left Torso (Rear)</td><td class=\"text-center\" colspan=\"1\">&nbsp;</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.leftTorsoRear + "</td><td>&nbsp;</td></tr>";
        }
        if( typeTag === "biped" || typeTag === "lam" || typeTag === "tripod" ) {

            if( this._armorAllocation.rightArm === this._armorAllocation.leftArm) {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">R/L Arm</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightArm + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightArm + "</td><td>&nbsp;</td></tr>";
            } else {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Right Arm</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightArm + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightArm + "</td><td>&nbsp;</td></tr>";
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Left Arm</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.leftArm + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.leftArm + "</td><td>&nbsp;</td></tr>";
            }

            if( this._armorAllocation.rightLeg === this._armorAllocation.leftLeg) {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">R/L Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightLeg + "</td><td>&nbsp;</td></tr>";
            } else {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Right Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightLeg + "</td><td>&nbsp;</td></tr>";
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Left Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.leftLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.leftLeg + "</td><td>&nbsp;</td></tr>";
            }
            if( typeTag === "tripod" ) {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Center Leg</td><td class=\"text-center\" colspan=\"1\">" + (this._internalStructure.centerLeg ?? 0) + "</td><td class=\"text-center\" colspan=\"1\">" + (this._armorAllocation.centerLeg ?? 0) + "</td><td>&nbsp;</td></tr>";
            }
        } else if( typeTag === "quad" || typeTag === "quadvee" ) {
            const frontRightLegIS = this._internalStructure.frontRightLeg ?? 0;
            const frontLeftLegIS = this._internalStructure.frontLeftLeg ?? 0;
            const frontRightLegArmor = this._armorAllocation.frontRightLeg ?? 0;
            const frontLeftLegArmor = this._armorAllocation.frontLeftLeg ?? 0;
            if( frontRightLegArmor === frontLeftLegArmor && frontRightLegIS === frontLeftLegIS ) {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">R/L Front Leg</td><td class=\"text-center\" colspan=\"1\">" + frontRightLegIS + "</td><td class=\"text-center\" colspan=\"1\">" + frontRightLegArmor + "</td><td>&nbsp;</td></tr>";
            } else {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Right Front Leg</td><td class=\"text-center\" colspan=\"1\">" + frontRightLegIS + "</td><td class=\"text-center\" colspan=\"1\">" + frontRightLegArmor + "</td><td>&nbsp;</td></tr>";
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Left Front Leg</td><td class=\"text-center\" colspan=\"1\">" + frontLeftLegIS + "</td><td class=\"text-center\" colspan=\"1\">" + frontLeftLegArmor + "</td><td>&nbsp;</td></tr>";
            }

            if( this._armorAllocation.rightLeg === this._armorAllocation.leftLeg ) {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">R/L Rear Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightLeg + "</td><td>&nbsp;</td></tr>";
            } else {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Right Rear Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightLeg + "</td><td>&nbsp;</td></tr>";
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Left Rear Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.leftLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.leftLeg + "</td><td>&nbsp;</td></tr>";
            }
        } else {
            html += "<tr><td colspan=\"4\">Unsupported 'Mech type: " + esc(this._mechType.name) + "</td></tr>";
        }
        // End Factor Table
        html += "</table>";
        html += "<br />";

        // Weapons and Ammo
        html += "<table class=\"mech-tro\">";
        html += "<tr><th class=\"text-left\">Weapons<br />and Ammo</th><th class=\"text-center\">Location</th><th class=\"text-center\">Critical</th><th class=\"text-center\">Tonnage</th></tr>";

        this._equipmentList.sort(sortByLocationThenName);

        for( let countEQ = 0; countEQ < this._equipmentList.length; countEQ++) {
            const currentItem = this._equipmentList[countEQ];
            if( typeof(currentItem.location) === "undefined" )
                currentItem.location = "n/a";

            let item_location = this._getLocationAbbr(currentItem.location);

            if( currentItem.rear)
                item_location += " (R)"
            else if( this.isTurretMounted(currentItem) )
                item_location += " (T)"

            const eqName = esc(currentItem.name);
            const eqLocAbbr = esc(item_location.toUpperCase());
            if( currentItem.isAmmo && this.getAmmoBinCapacity(currentItem) > 0)
                html += "<tr><td class=\"text-left\">" + eqName + " " + this.getAmmoBinCapacity(currentItem) + "</td><td class=\"text-center\">" + eqLocAbbr + "</strong></td><td class=\"text-center\">" + this.getCriticalSlots(currentItem.space.battlemech) + "</td><td class=\"text-center\">" + currentItem.weight + "</td></tr>";
            else
                html += "<tr><td class=\"text-left\">" + eqName + "</td><td class=\"text-center\">" + eqLocAbbr + "</strong></td><td class=\"text-center\">" + this.getCriticalSlots(currentItem.space.battlemech) + "</td><td class=\"text-center\">" + currentItem.weight + "</td></tr>";
        }

        // Isolate the base unit weight per Jump Jet once to eliminate code duplication
        let singleJJWeight = 0;
        singleJJWeight = this._jumpJetWeightEach();

        // Process allocated Jump Jets across valid equipment locations
        for (let locC = 0; locC < this._validJJLocations.length; locC++) {
            const locationLong = this._validJJLocations[locC].long;
            const locationShort = this._validJJLocations[locC].short.toUpperCase();
    
            // Gather all Jump Jet objects occupying critical slots in this specific location
            const jjObjs = [];
            for (let critC = 0; critC < this._criticals[locationLong].length; critC++) {
                const item = this._criticals[locationLong][critC];
                if (item && item.tag && item.tag.indexOf("jj-") === 0) {
                    jjObjs.push(item);
                }
            }
            // If matching engines were found, append a clean summary table row
            if (jjObjs.length > 0) {
                const totalLocationWeight = jjObjs.length * singleJJWeight;
                const jjName = esc(jjObjs[0].name);
                const locShortEsc = esc(locationShort);
                // Fixed the loose dangling </strong> tag from the original snippet
                html += `<tr><td class="text-left">${jjName}</td><td class="text-center"><strong>${locShortEsc}</strong></td><td class="text-center">${jjObjs.length}</td><td class="text-center">${totalLocationWeight.toFixed(2)}</td></tr>`;
            }
        }
        // Process any Unallocated/Floating Jump Jets lingering in the construction queue
        const unallocatedJJs = [];
        for (let critC = 0; critC < this._unallocatedCriticals.length; critC++) {
            const item = this._unallocatedCriticals[critC];
            if (item && item.tag && item.tag.indexOf("jj-") === 0) {
                unallocatedJJs.push(item);
            }
        }
        if (unallocatedJJs.length > 0) {
            const totalUnallocatedWeight = unallocatedJJs.length * singleJJWeight;
            const jjName = esc(unallocatedJJs[0].name);
            html += `<tr><td class="text-left">${jjName}</td><td class="text-center"><strong>N/A</strong></td><td class="text-center">${unallocatedJJs.length}</td><td class="text-center">${totalUnallocatedWeight.toFixed(2)}</td></tr>`;
        }

        // END Weapons and Ammo
        html += "</table>";

        return html;
    }

    private _getLocationAbbr(
        locationTag: string,
    ) {
        for( let countLoc = 0; countLoc < battlemechLocations.length; countLoc++) {
            if( locationTag === battlemechLocations[countLoc].tag) {
                if( battlemechLocations[countLoc].abbr !== "undefined" )
                    return battlemechLocations[countLoc].abbr;
                else
                    return battlemechLocations[countLoc].abbr;
            }
        }
        return "n/a";
    }

     private _calc() {

        if(!this._tonnage) {
            this._tonnage = 20;
        }
        this._adoptFractionalAccounting();
        const typeTag = this._mechType.tag.toLowerCase();

        if (typeTag === "lam") {
            if (!this._isLAMLegalGyro(this._gyro.tag)) {
                this._gyro = findByTag(mechGyroTypes, "standard") ?? mechGyroTypes[0];
            }
            this._jumpSpeed = Math.max(this._getLAMMinJumpMP(), this._jumpSpeed);
            // Canon LAMs cannot be OmniMechs; the Custom Homebrew Omni-LAM is Inner Sphere only
            // and keeps every arm actuator (fan rule restriction 3).
            if (this._omnimech && !this._hasOmniLAMTechBase()) {
                this._omnimech = false;
            }
            // Every LAM needs upper and lower arm actuators in both arms (IO, as implemented by
            // MegaMek's TestMek); the Omni-LAM also keeps its hands.
            if (this._hasLAMLimits()) {
                this._no_left_arm_lower_actuator = false;
                this._no_right_arm_lower_actuator = false;
            }
            if (this._omnimech) {
                this._no_left_arm_hand_actuator = false;
                this._no_right_arm_hand_actuator = false;
            }
            if (!this._isLAMLegalComponent("armor", this._armorType.tag)) {
                this._armorType = findByTag(mechArmorTypes, "standard") ?? mechArmorTypes[0];
            }
            if (!this._isLAMLegalComponent("structure", this._selectedInternalStructure.tag)) {
                this._selectedInternalStructure = findByTag(mechInternalStructureTypes, "standard") ?? mechInternalStructureTypes[0];
            }
            if (!this._isLAMLegalComponent("engine", this._engineType.tag)) {
                this._engineType = findByTag(mechEngineTypes, "standard") ?? mechEngineTypes[0];
            }
        }
        // Superheavy 'Mechs cannot jump, cannot use Triple-Strength Myomer (IO:AE p.156) and have
        // four structure types to choose from (p.155).
        if (this.isSuperheavy()) {
            this._jumpSpeed = 0;
            if (!BattleMech.SUPERHEAVY_STRUCTURE_TAGS.includes(this._selectedInternalStructure.tag)) {
                this._selectedInternalStructure = mechInternalStructureTypes.find(structure => structure.tag === "standard") ?? mechInternalStructureTypes[0];
            }
            if (BattleMech._isTripleStrengthMyomer(this._myomerType)) {
                this._myomerType = mechMyomerTypes.find(myomer => myomer.tag === "standard") ?? mechMyomerTypes[0];
            }
        }
        // Jump jets need a fusion or fission engine (TM p.69).
        if (!this._hasFusionOrFissionEngine()) {
            this._jumpSpeed = 0;
        }
        // A Primitive 'Mech has one armor type, set by its structure (IO:AE p.118).
        if (this._primitive && this._armorType.tag !== this._getPrimitiveArmorTag()) {
            this._armorType = findByTag(mechArmorTypes, this._getPrimitiveArmorTag()) ?? this._armorType;
        }
        // OmniMechs build fixed-only equipment (MASC, Partial Wing, signature systems...) into
        // the base chassis (MegaMek omniFixedOnly; provisional).
        if (this._omnimech) {
            for (const item of this._equipmentList) {
                if (item && isOmniFixedOnly(item)) item.omniFixed = true;
            }
        }

        // Running heat; an earlier edition's own Heat Point Table where it has one (Battledroids: 1, BD p.12).
        const editionMoveHeat = getEditionPlayRules(this._rulesEdition)?.moveHeat;
        this._maxMoveHeat = editionMoveHeat ? editionMoveHeat.run : 2;
        this._heatDissipation = 0;

        this._weights = [];

        this._weights.push({
            name: "Internal Structure",
            weight: this.getInternalStructureWeight()
        });

        if (this.usesPowerArmorConstruction()) {
            // The waldo system replaces the cockpit (Best-of p.16).
            this._cockpitWeight = POWER_ARMOR_WALDO.weight;
            this._weights.push({ name: POWER_ARMOR_WALDO.name, weight: POWER_ARMOR_WALDO.weight });
        } else if (typeTag === "quadvee" || typeTag === "tripod") {
            this._cockpitWeight = this.getCockpitType().weight;
            this._weights.push({
                name: typeTag === "tripod" ? "Tripod Multi-Pilot Cockpit" : "QuadVee Dual Cockpit",
                weight: this.getCockpitWeight()
            });
        } else if (this._tonnage > 100) {
            // Superheavy Bipeds/Quads require a two-pilot Superheavy Cockpit, same as any other Superheavy chassis.
            this._cockpitWeight = this.getCockpitType().weight;
            this._weights.push({
                name: this.getCockpitType().tag === "superheavy-industrial" ? this.getCockpitType().name : "Superheavy Cockpit",
                weight: this.getCockpitWeight()
            });
        } else if (this.isIndustrialMech() || this._primitive) {
            this._cockpitWeight = this.getCockpitType().weight;
            this._weights.push({
                name: this.getCockpitType().name,
                weight: this.getCockpitWeight()
            });
        } else if( (this._smallCockpit || this._torsoMountedCockpit || this._interfaceCockpit) && !this.usesFutureWarsConstruction() ) {
            this._cockpitWeight = this.getCockpitType().weight;
            this._weights.push({
                name: this.getCockpitType().name,
                weight: this.getCockpitWeight()
            });
        } else {
            this._cockpitWeight = this.getCockpitType().weight;
            this._weights.push({
                name: "Cockpit",
                weight: this.getCockpitWeight()
            });
        }
        // Clell Flint's cockpit weighs by class, its life support included (Best-of p.35); a Primitive cockpit keeps
        // its own weight (ours). Extra sensors and extra life support are half a ton each.
        const futureWarsCockpit = this._getFutureWarsCockpit();
        if (futureWarsCockpit) {
            this._cockpitWeight = futureWarsCockpit.tons;
            this._weights[this._weights.length - 1].weight = futureWarsCockpit.tons;
        }
        if (this.usesFutureWarsConstruction()) {
            if (this._extraSensors) this._weights.push({ name: "Extra Sensors", weight: FUTURE_WARS_EXTRA_SLOT_TONS });
            if (this._extraLifeSupport) this._weights.push({ name: "Extra Life Support", weight: FUTURE_WARS_EXTRA_SLOT_TONS });
        }
        if (this.hasCommandConsole()) {
            const console = getCockpitType("command-console");
            this._weights.push({ name: console.name, weight: console.weight });
        }
        if (this.getRoboticControlWeight() > 0) {
            this._weights.push({ name: this.getRoboticControl().name, weight: this.getRoboticControlWeight() });
        }

        // LAM/QuadVee conversion equipment is 10% of mass, rounded up to a whole ton
        // (IO:AE p.108 LAM; QuadVee IO:AE p.128).
        if (typeTag === "quadvee") {
            this._weights.push({
                name: "QuadVee Conversion / Motive Package",
                weight: Math.ceil(this._tonnage * 0.1)
            });
            const motiveGear = this._quadVeeMotiveGear()!;
            this._weights.push({ name: motiveGear.name, weight: motiveGear.weight });
        } else if (typeTag === "lam") {
            const rules = LAM_TYPE_RULES[this._lamType];
            const step = rules.halfTon ? 2 : 1;
            if (rules.conversion > 0) this._weights.push({ name: rules.name + " Conversion Equipment", weight: Math.ceil(this._tonnage * rules.conversion * step) / step });
            // A Permanent Air 'Mech has no conversion equipment to carry the LAM's ton of fuel, so it carries it itself.
            if (this.isPermanentAirMech()) {
                this._weights.push({ name: "Permanent Air 'Mech Wings", weight: this.getPermanentAirMechWingWeight() });
                this._weights.push({ name: "Fuel (required)", weight: 1 });
            }
        }

        this._runSpeed = Math.ceil(this._walkSpeed * 1.5);

        if( this._engine) {

            this._weights.push({
                name: this._engineType.name + " - " + this._engineType.rating,
                weight: this.getEngineWeight()!
            });

            this._weights.push({
                name: this.getGyroName(),
                weight: this.getGyroWeight()
            });
            // A 5-ton suit shields a fusion engine with half its weight (Best-of p.16).
            if (this._isFiveTonPowerArmor() && needsPowerArmorShielding(this._engineType.tag)) {
                this._weights.push({ name: "Fusion Engine Shielding", weight: getPowerArmorShieldingWeight(this.getEngineWeight() ?? 0) });
            }

        }

        if( this._jumpSpeed > 0) {
            this._maxMoveHeat = editionMoveHeat
                ? Math.max(editionMoveHeat.run, editionMoveHeat.jumpMinimum, this._jumpSpeed * editionMoveHeat.jumpPerHex)
                : this._jumpSpeed;
            this._weights.push({
                name: this._jumpJetType.name,
                weight: this.getJumpJetWeight()
            });
        }
        this._totalArmor = 0;
        // Patchwork: the weight follows the points in each location (TO:AUE p.189).
        if (this.isPatchworkArmor()) {
            this._armorWeight = this._getPatchworkArmorWeight();
        }
        if( this.usesFractionalAccounting() && !this.isPatchworkArmor() ) {
            // Armor is bought by the point, at the type's weight per point (TO:AUE p.188).
            this._armorWeight = roundUpToKilogram(this._fractionalArmorPoints * this.getFractionalArmorTonsPerPoint());
            this._maxArmor = this._fractionalArmorPoints;
        } else if( this.getArmorTechBase() === "clan" ) {
            this._maxArmor = Math.floor(this._armorWeight * this.getArmorObj().armorMultiplier.clan);
        } else {
            this._maxArmor = Math.floor(this._armorWeight * this.getArmorObj().armorMultiplier.is);
        }

        if( this._totalArmor > this._maxArmor)
            this._totalArmor = this._maxArmor;

        this._weights.push({
            name: "Armor",
            weight: this._armorWeight
        });

        // Reset the active tally counter before summation loops
        this._totalArmor = 0;

        // Core Fixed Allocations: Head & Torsos (Front/Rear) exist on every single BattleMech layout
        this._totalArmor += this._armorAllocation.head;
        this._totalArmor += this._armorAllocation.centerTorso;
        this._totalArmor += this._armorAllocation.leftTorso;
        this._totalArmor += this._armorAllocation.rightTorso;
        this._totalArmor += this._armorAllocation.centerTorsoRear;
        this._totalArmor += this._armorAllocation.leftTorsoRear;
        this._totalArmor += this._armorAllocation.rightTorsoRear;

        // Sum limbs based on anatomical configuration rules
        if (typeTag === "biped" || typeTag === "lam") {
            // Standard Bipeds and Aero-Mechs utilize traditional Left/Right Arms and Legs
            this._totalArmor += this._armorAllocation.rightArm ?? 0;
            this._totalArmor += this._armorAllocation.leftArm ?? 0;
            this._totalArmor += this._armorAllocation.rightLeg;
            this._totalArmor += this._armorAllocation.leftLeg;
        } else if (typeTag === "quad" || typeTag === "quadvee") {
            // Four-legged layouts substitute arms entirely for specialized front legs
            this._totalArmor += this._armorAllocation.frontRightLeg ?? 0;
            this._totalArmor += this._armorAllocation.frontLeftLeg ?? 0;
            this._totalArmor += this._armorAllocation.rightLeg; // Rear Right Leg
            this._totalArmor += this._armorAllocation.leftLeg;  // Rear Left Leg
        } else if (typeTag === "tripod") {
            // Tripods feature three distinct structural legs, alongside optional weapon arms
            this._totalArmor += this._armorAllocation.rightLeg;
            this._totalArmor += this._armorAllocation.leftLeg;
            this._totalArmor += this._armorAllocation.centerLeg ?? 0;
            this._totalArmor += this._armorAllocation.rightArm ?? 0;
            this._totalArmor += this._armorAllocation.leftArm ?? 0;
        } else {
            // Safe Baseline Fallback: Default to standard Biped layout tracking
            this._totalArmor += this._armorAllocation.rightArm ?? 0;
            this._totalArmor += this._armorAllocation.leftArm ?? 0;
            this._totalArmor += this._armorAllocation.rightLeg;
            this._totalArmor += this._armorAllocation.leftLeg;
        }

        // Compute remaining armor tonnage capacities accurately
        if (this.isPatchworkArmor()) {
            this._maxArmor = this._totalArmor;
        }
        this._unallocatedArmor = this._maxArmor - this._totalArmor;

        if( this._additionalHeatSinks > 0)
            this._weights.push({
                name: "Additional Heat Sinks",
                weight: this.getHeatSinksWeight()
            });
        if( this.getPowerAmplifierWeight() > 0)
            this._weights.push({
                name: "Power Amplifiers",
                weight: this.getPowerAmplifierWeight()
            });

        this._calcVariableEquipment();
        mateLaserInsulators(this._equipmentList);
        for( let countEQ = 0; countEQ < this._equipmentList.length; countEQ++) {
            if( this._equipmentList[countEQ].rear || this.isTurretMounted(this._equipmentList[countEQ]) ) {
                this._weights.push({
                    name: this._equipmentList[countEQ].name + (this._equipmentList[countEQ].rear ? " (rear)" : " (turret)"),
                    weight: this._equipmentList[countEQ].weight
                });
            } else {
                this._weights.push({
                    name: this._equipmentList[countEQ].name + "",
                    weight: this._equipmentList[countEQ].weight
                });
            }
        }

        this._currentTonnage = 0;
        for( let weight_counter = 0; weight_counter < this._weights.length; weight_counter++) {
            this._currentTonnage += this._weights[weight_counter].weight;
        }

        if( this.usesFractionalAccounting() ) {
            // Kilogram weights do not add up exactly in binary; keep the total to the gram.
            this._currentTonnage = Math.round(this._currentTonnage * 1e6) / 1e6;
        }
        this._remainingTonnage = this._tonnage - this._currentTonnage;
        if( this.usesFractionalAccounting() ) {
            this._remainingTonnage = Math.round(this._remainingTonnage * 1e6) / 1e6;
        }

        this._heatSinkCriticals = {
            slotsEach: 1,
            number: 0,
        };
        
        this._heatDissipation = this.getHeatSinks() * this._heatSinkType.dissipation + this.getPartialWingHeatBonus()
            + this.getEquipmentHeatDissipation();
        if( this.getHeatSinkTechBase() === "clan" ) {
            this._heatSinkCriticals.slotsEach = this._heatSinkType.crits.clan;
        } else {
            this._heatSinkCriticals.slotsEach = this._heatSinkType.crits.is;
        }

        const findEngine = this.getEngine();
        if( findEngine && findEngine.rating) {
            // Sinks the engine cannot hold need slots; Compact sinks pair up, two per slot.
            const external = Math.max(0, this.getHeatSinks() - this.getEngineHeatSinkCapacity());
            this._heatSinkCriticals.number = Math.ceil(external / this._getHeatSinksPerSlot());
            this._heatSinkCriticals.slotsEach = this.getCriticalSlots(this._heatSinkCriticals.slotsEach);
        } else {
            this._heatSinkCriticals.number = 0
        }

        this._calcCriticals();
        // Armored components: the slots are known only once the criticals are placed (TO:AUE p.94).
        const armoredComponentWeight = this.getArmoredComponentWeight();
        if( armoredComponentWeight > 0 ) {
            this._weights.push({ name: "Armored Components", weight: armoredComponentWeight });
            this._currentTonnage += armoredComponentWeight;
            this._remainingTonnage -= armoredComponentWeight;
        }
        this._trimBombLoadout();
        this._calcBattleValue();
        this._calcCBillCost();

        this._sortInstalledEquipment();
        this._sortedEquipmentList = [];
        const sortedEquipmentByKey = new Map<string, IEquipmentItem>();

        for (const equipment of this._equipmentList) {
            const key = `${equipment.location ?? ""}|${equipment.tag}`;
            const groupedEquipment = sortedEquipmentByKey.get(key);
            if (groupedEquipment) {
                groupedEquipment.count = (groupedEquipment.count ?? 0) + 1;
            } else {
                const equipmentCopy = JSON.parse(JSON.stringify(equipment)) as IEquipmentItem;
                equipmentCopy.count = 1;
                sortedEquipmentByKey.set(key, equipmentCopy);
            }
        }

        this._sortedEquipmentList = Array.from(sortedEquipmentByKey.values());

        this._calcArmorStructureBubbles();

        this._sortedEquipmentList.sort((a, b) => {
            const sortOrder = a.sort.localeCompare(b.sort);
            if (sortOrder !== 0) return sortOrder;
            const locationOrder = (a.location ?? "").localeCompare(b.location ?? "");
            if (locationOrder !== 0) return locationOrder;
            return a.tag.localeCompare(b.tag);
        });
    }

    private _calcArmorStructureBubbles() {
    // Tiny bubbles... on my mech... make me happy and you so wrecked...
    // Using .length truncation preserves historical check/damage states without inverting arrays
    const syncBubbles = (currentArray: boolean[] | undefined, targetCount: number): boolean[] => {
        const arr = currentArray ?? [];
        while (arr.length < targetCount) {
            arr.push(true); // Fill missing allocation boxes
        }
        if (arr.length > targetCount) {
            arr.length = targetCount; // Truncate trailing elements instantly
        }
        return arr;
    };

    // CORE FIXED LOCATIONS: As always, Head & Torsos (Front/Rear)
    this._armorBubbles.head = syncBubbles(this._armorBubbles.head, this._armorAllocation.head);
    this._armorBubbles.centerTorso = syncBubbles(this._armorBubbles.centerTorso, this._armorAllocation.centerTorso);
    this._armorBubbles.leftTorso = syncBubbles(this._armorBubbles.leftTorso, this._armorAllocation.leftTorso);
    this._armorBubbles.rightTorso = syncBubbles(this._armorBubbles.rightTorso, this._armorAllocation.rightTorso);
    this._armorBubbles.centerTorsoRear = syncBubbles(this._armorBubbles.centerTorsoRear, this._armorAllocation.centerTorsoRear);
    this._armorBubbles.leftTorsoRear = syncBubbles(this._armorBubbles.leftTorsoRear, this._armorAllocation.leftTorsoRear);
    this._armorBubbles.rightTorsoRear = syncBubbles(this._armorBubbles.rightTorsoRear, this._armorAllocation.rightTorsoRear);
    const typeTag = this._mechType.tag.toLowerCase();
    // DYNAMIC LIMB BLOCKS: Parse allocations by chassis anatomical layout rules
    if (typeTag === "biped" || typeTag === "lam") {
        // Standard Bipeds and LAMs utilize traditional arms and legs
        this._armorBubbles.leftArm = syncBubbles(this._armorBubbles.leftArm, this._armorAllocation.leftArm ?? 0);
        this._armorBubbles.rightArm = syncBubbles(this._armorBubbles.rightArm, this._armorAllocation.rightArm ?? 0);
        this._armorBubbles.leftLeg = syncBubbles(this._armorBubbles.leftLeg, this._armorAllocation.leftLeg);
        this._armorBubbles.rightLeg = syncBubbles(this._armorBubbles.rightLeg, this._armorAllocation.rightLeg);
        // Zeroing out unutilized areas to prevent phantom bubbles
        this._armorBubbles.centerLeg = [];
        this._armorBubbles.frontLeftLeg = [];
        this._armorBubbles.frontRightLeg = [];
    } else if (typeTag === "quad" || typeTag === "quadvee") {
        // Four-legged layout swaps out arms completely for dedicated Front Legs
        this._armorBubbles.frontLeftLeg = syncBubbles(this._armorBubbles.frontLeftLeg, this._armorAllocation.frontLeftLeg ?? 0);
        this._armorBubbles.frontRightLeg = syncBubbles(this._armorBubbles.frontRightLeg, this._armorAllocation.frontRightLeg ?? 0);
        this._armorBubbles.leftLeg = syncBubbles(this._armorBubbles.leftLeg, this._armorAllocation.leftLeg);   // Rear Left
        this._armorBubbles.rightLeg = syncBubbles(this._armorBubbles.rightLeg, this._armorAllocation.rightLeg); // Rear Right
        // Zeroing out unutilized biped/tripod bubbles
        this._armorBubbles.leftArm = [];
        this._armorBubbles.rightArm = [];
        this._armorBubbles.centerLeg = [];
    } else if (typeTag === "tripod") {
        // Tripods have standard legs, a specialized Center Leg, and conditional Arms
        this._armorBubbles.leftLeg = syncBubbles(this._armorBubbles.leftLeg, this._armorAllocation.leftLeg);
        this._armorBubbles.rightLeg = syncBubbles(this._armorBubbles.rightLeg, this._armorAllocation.rightLeg);
        this._armorBubbles.centerLeg = syncBubbles(this._armorBubbles.centerLeg, this._armorAllocation.centerLeg ?? 0);
        this._armorBubbles.leftArm = syncBubbles(this._armorBubbles.leftArm, this._armorAllocation.leftArm ?? 0);
        this._armorBubbles.rightArm = syncBubbles(this._armorBubbles.rightArm, this._armorAllocation.rightArm ?? 0);
        // Zeroing out unutilized quad bubbles
        this._armorBubbles.frontLeftLeg = [];
        this._armorBubbles.frontRightLeg = [];
    } else {
        // Safe Default Fallback: Standard Biped array tracking sync. Remember kids always have a bugout plan...
        this._armorBubbles.leftArm = syncBubbles(this._armorBubbles.leftArm, this._armorAllocation.leftArm ?? 0);
        this._armorBubbles.rightArm = syncBubbles(this._armorBubbles.rightArm, this._armorAllocation.rightArm ?? 0);
        this._armorBubbles.leftLeg = syncBubbles(this._armorBubbles.leftLeg, this._armorAllocation.leftLeg);
        this._armorBubbles.rightLeg = syncBubbles(this._armorBubbles.rightLeg, this._armorAllocation.rightLeg);
        this._armorBubbles.centerLeg = [];
        this._armorBubbles.frontLeftLeg = [];
        this._armorBubbles.frontRightLeg = [];
    }
    // NOW ON TO THE INTERNALS! The Toads are coming.
    if(!this._structureBubbles.head)
        this._structureBubbles.head = [];
    while( this._structureBubbles.head.length < this._internalStructure.head ) {
        this._structureBubbles.head.push( true )
    }
    if( this._structureBubbles.head.length > this._internalStructure.head ) {
        this._structureBubbles.head = this._structureBubbles.head.splice( 0, this._internalStructure.head)
    }
    if(!this._structureBubbles.centerTorso)
        this._structureBubbles.centerTorso = [];
    while( this._structureBubbles.centerTorso.length < this._internalStructure.centerTorso ) {
        this._structureBubbles.centerTorso.push( true )
    }
    if( this._structureBubbles.centerTorso.length > this._internalStructure.centerTorso ) {
        this._structureBubbles.centerTorso = this._structureBubbles.centerTorso.splice( 0, this._internalStructure.centerTorso)
    }
    if(!this._structureBubbles.rightTorso)
        this._structureBubbles.rightTorso = [];
    while( this._structureBubbles.rightTorso.length < this._internalStructure.rightTorso ) {
        this._structureBubbles.rightTorso.push( true )
    }
    if( this._structureBubbles.rightTorso.length > this._internalStructure.rightTorso ) {
        this._structureBubbles.rightTorso = this._structureBubbles.rightTorso.splice( 0, this._internalStructure.rightTorso)
    }
    if(!this._structureBubbles.leftTorso)
        this._structureBubbles.leftTorso = [];
    while( this._structureBubbles.leftTorso.length < this._internalStructure.leftTorso ) {
        this._structureBubbles.leftTorso.push( true )
    }
    if( this._structureBubbles.leftTorso.length > this._internalStructure.leftTorso ) {
        this._structureBubbles.leftTorso = this._structureBubbles.leftTorso.splice( 0, this._internalStructure.leftTorso)
    }
    this._structureBubbles.leftTorsoRear = [];
    this._structureBubbles.centerTorsoRear = [];
    this._structureBubbles.rightTorsoRear = [];
    if(!this._structureBubbles.leftArm)
        this._structureBubbles.leftArm = [];
    const leftArmBubbles = this._structureBubbles.leftArm;
    while( leftArmBubbles.length < (this._internalStructure.leftArm ?? 0) ) {
        leftArmBubbles.push( true )
    }
    if( leftArmBubbles.length > (this._internalStructure.leftArm ?? 0) ) {
        this._structureBubbles.leftArm = leftArmBubbles.splice( 0, this._internalStructure.leftArm ?? 0)
    }
    if(!this._structureBubbles.rightArm)
        this._structureBubbles.rightArm = [];
    const rightArmBubbles = this._structureBubbles.rightArm;
    while( rightArmBubbles.length < (this._internalStructure.rightArm ?? 0) ) {
        rightArmBubbles.push( true )
    }
    if( rightArmBubbles.length > (this._internalStructure.rightArm ?? 0) ) {
        this._structureBubbles.rightArm = rightArmBubbles.splice( 0, this._internalStructure.rightArm ?? 0)
    }
    if(!this._structureBubbles.rightLeg)
        this._structureBubbles.rightLeg = [];
    while( this._structureBubbles.rightLeg.length < this._internalStructure.rightLeg ) {
        this._structureBubbles.rightLeg.push( true )
    }
    if( this._structureBubbles.rightLeg.length > this._internalStructure.rightLeg ) {
        this._structureBubbles.rightLeg = this._structureBubbles.rightLeg.splice( 0, this._internalStructure.rightLeg)
    }
    if(!this._structureBubbles.leftLeg)
        this._structureBubbles.leftLeg = [];
    while( this._structureBubbles.leftLeg.length < this._internalStructure.leftLeg ) {
        this._structureBubbles.leftLeg.push( true )
    }
    if( this._structureBubbles.leftLeg.length > this._internalStructure.leftLeg ) {
        this._structureBubbles.leftLeg = this._structureBubbles.leftLeg.splice( 0, this._internalStructure.leftLeg)
    }
    // REAR FRAMEWORK RESETS: Internal structure sheets do not utilize distinct rear bubbles
    this._structureBubbles.centerTorsoRear = [];
    this._structureBubbles.leftTorsoRear = [];
    this._structureBubbles.rightTorsoRear = [];

    // CORE FIXED STRUCTURE: We know why.
    this._structureBubbles.head = syncBubbles(this._structureBubbles.head, this._internalStructure.head);
    this._structureBubbles.centerTorso = syncBubbles(this._structureBubbles.centerTorso, this._internalStructure.centerTorso);
    this._structureBubbles.leftTorso = syncBubbles(this._structureBubbles.leftTorso, this._internalStructure.leftTorso);
    this._structureBubbles.rightTorso = syncBubbles(this._structureBubbles.rightTorso, this._internalStructure.rightTorso);

    // DYNAMIC STRUCTURE LIMBS: I choose you Hedgehog!!! Help our buddy Wasp LAM out!!!
    if (typeTag === "biped" || typeTag === "lam") {
        // Standard Bipeds and Aero-Mechs utilize traditional arms and legs framework
        this._structureBubbles.leftArm = syncBubbles(this._structureBubbles.leftArm, this._internalStructure.leftArm ?? 0);
        this._structureBubbles.rightArm = syncBubbles(this._structureBubbles.rightArm, this._internalStructure.rightArm ?? 0);
        this._structureBubbles.leftLeg = syncBubbles(this._structureBubbles.leftLeg, this._internalStructure.leftLeg);
        this._structureBubbles.rightLeg = syncBubbles(this._structureBubbles.rightLeg, this._internalStructure.rightLeg);

        // Zeroing out unallocated bubble areas... No bubble beam attacks today
        this._structureBubbles.centerLeg = [];
        this._structureBubbles.frontLeftLeg = [];
        this._structureBubbles.frontRightLeg = [];

    } else if (typeTag === "quad" || typeTag === "quadvee") {
        // Four-legged layouts substitute the arms framework for an explicit Front Legs framework... they don't walk on their hands.
        this._structureBubbles.frontLeftLeg = syncBubbles(this._structureBubbles.frontLeftLeg, this._internalStructure.frontLeftLeg ?? 0);
        this._structureBubbles.frontRightLeg = syncBubbles(this._structureBubbles.frontRightLeg, this._internalStructure.frontRightLeg ?? 0);
        this._structureBubbles.leftLeg = syncBubbles(this._structureBubbles.leftLeg, this._internalStructure.leftLeg);   // Rear Left Frame
        this._structureBubbles.rightLeg = syncBubbles(this._structureBubbles.rightLeg, this._internalStructure.rightLeg); // Rear Right Frame
        // Zeroing out non-applicable bubbles
        this._structureBubbles.leftArm = [];
        this._structureBubbles.rightArm = [];
        this._structureBubbles.centerLeg = [];
    } else if (typeTag === "tripod") {
        // Tripods: tri... three... three legs ah ah ah... optional layout arms
        this._structureBubbles.leftLeg = syncBubbles(this._structureBubbles.leftLeg, this._internalStructure.leftLeg);
        this._structureBubbles.rightLeg = syncBubbles(this._structureBubbles.rightLeg, this._internalStructure.rightLeg);
        this._structureBubbles.centerLeg = syncBubbles(this._structureBubbles.centerLeg, this._internalStructure.centerLeg ?? 0);
        this._structureBubbles.leftArm = syncBubbles(this._structureBubbles.leftArm, this._internalStructure.leftArm ?? 0);
        this._structureBubbles.rightArm = syncBubbles(this._structureBubbles.rightArm, this._internalStructure.rightArm ?? 0);
        // Zeroing out non-applicable quad bubbles
        this._structureBubbles.frontLeftLeg = [];
        this._structureBubbles.frontRightLeg = [];
    } else {
        // Safe Default Fallback: Standard Biped structural synchronization... there is safety in bubbles, why else is there bubble wrap?
        this._structureBubbles.leftArm = syncBubbles(this._structureBubbles.leftArm, this._internalStructure.leftArm ?? 0);
        this._structureBubbles.rightArm = syncBubbles(this._structureBubbles.rightArm, this._internalStructure.rightArm ?? 0);
        this._structureBubbles.leftLeg = syncBubbles(this._structureBubbles.leftLeg, this._internalStructure.leftLeg);
        this._structureBubbles.rightLeg = syncBubbles(this._structureBubbles.rightLeg, this._internalStructure.rightLeg);
        this._structureBubbles.centerLeg = [];
        this._structureBubbles.frontLeftLeg = [];
        this._structureBubbles.frontRightLeg = [];
    }
}

    private _sortCriticalAllocationTableByTagThenUUID() {
        this._criticalAllocationTable.sort(
            (
                a: ICriticalSlot,
                b: ICriticalSlot,
            ) => {
                if( a.tag > b.tag ) {
                    return -1;
                } else if( a.tag < b.tag ) {
                    return 1;
                } else {
                    if( a.uuid > b.uuid ) {
                        return -1;
                    } else if( a.uuid < b.uuid ) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            }
        )
    }

    /** Location tags (and their legacy spellings) to the critical table that holds them. */
    private static readonly _SLOT_LOCATION_KEYS: Record<string, string> = {
        hd: "head", ct: "centerTorso", lt: "leftTorso", rt: "rightTorso", la: "leftArm", ra: "rightArm",
        ll: "leftLeg", rl: "rightLeg", cl: "centerLeg", fll: "frontLeftLeg", frl: "frontRightLeg",
        rll: "leftLeg", rrl: "rightLeg",
    };

    // ---- Clell Flint's alternate construction rules (#172, "Compact 'Mechs"; src/data/future-wars-construction.ts) ----

    /** The ticked Future Wars construction ruleset that the registry lists, or undefined. */
    private _futureWarsRuleset(): string | undefined {
        return this._rulesets.find(id => (FUTURE_WARS_CONSTRUCTION_RULESETS as readonly string[]).includes(id) && !!findSpecialRuleset(id));
    }

    /**
     * Is this 'Mech built under Clell Flint's construction rules? Only a two-legged BattleMech or IndustrialMech of up
     * to 100 tons (ours: his four-legged rules are the Walker unit type, and his tables stop at 100 tons); any other
     * type with the ruleset ticked is built by the standard rules and reported (getChassisEquipmentViolations).
     */
    public usesFutureWarsConstruction(): boolean {
        return !!this._futureWarsRuleset() && this._mechType.tag.toLowerCase() === "biped" && !!getFutureWarsWeightClass(this._tonnage);
    }

    // ---- Bill Swisher's Power Armor (#172; src/data/future-wars-power-armor.ts) ----

    private _powerArmorTicked(): boolean {
        return this._rulesets.includes(FW_POWER_ARMOR_RULESET) && !!findSpecialRuleset(FW_POWER_ARMOR_RULESET);
    }

    /**
     * Is this 'Mech a Power Armor suit? Only a two-legged 'Mech of 5, 10 or 15 tons (Best-of p.16; ours: no other
     * weight or type). Any other 'Mech with the ruleset ticked is built by the standard rules and reported.
     */
    public usesPowerArmorConstruction(): boolean {
        return this._powerArmorTicked() && this._mechType.tag.toLowerCase() === "biped" && isPowerArmorTonnage(this._tonnage);
    }

    /**
     * The only tonnages a construction ruleset builds, for the creator's tonnage list: Power Armor's 5, 10 and 15 on a
     * two-legged 'Mech with the ruleset ticked, or undefined when the usual list applies.
     */
    public getConstructionTonnages(): readonly number[] | undefined {
        return this._powerArmorTicked() && this._mechType.tag.toLowerCase() === "biped" ? POWER_ARMOR_TONNAGES : undefined;
    }

    /** A 5-ton suit: no gyro, its own structure, shielding and weapon list (Best-of p.16). */
    private _isFiveTonPowerArmor(): boolean {
        return this._tonnage === 5 && this.usesPowerArmorConstruction();
    }

    /** A weapon by its category, or a custom item that does damage (custom weapons are filed under "Custom Equipment"). */
    private static _isPowerArmorWeapon(item: IEquipmentItem): boolean {
        if (item.isAmmo) return false;
        return /weapons$|^(ballistic|energy|missile|artillery|melee)$/i.test(item.category ?? "")
            || (item.category === "Custom Equipment" && Number(item.damage) > 0);
    }

    /** What the Power Armor rules leave wrong on this design. */
    private _getPowerArmorIssues(): string[] {
        if (!this._powerArmorTicked()) return [];
        if (!this.usesPowerArmorConstruction()) {
            return [`Power Armor (Special Ruleset) is built at 5, 10 or 15 tons on two legs; this ${this._tonnage}-ton ${this._mechType.name} is built by the standard rules.`];
        }
        const issues: string[] = [];
        // Owner ruling 2026-11-17: Swisher's suits are Inner Sphere (3027); the Clans have ProtoMechs instead.
        if (this._tech.tag === "clan" || this._tech.tag === "mclan") {
            issues.push("Power Armor is built on an Inner Sphere base only (Inner Sphere, or Mixed Tech on an Inner Sphere base); this suit has a Clan base.");
        }
        if (this.isArmless()) {
            issues.push("Power Armor needs both arms, with their upper and lower arm actuators (Best-of p.16).");
        }
        if (this._isFiveTonPowerArmor() && this._pilot.piloting >= 5) {
            issues.push(`A 5-ton Power Armor suit has no gyro: a pilot of Piloting 5 or worse cannot pilot it (3 or better can; 4 at +2 to every Piloting Skill Roll), and this pilot has ${this._pilot.piloting} (Best-of p.16).`);
        }
        if (this._armorAllocation.head > this.getMaxHeadArmor()) {
            issues.push(`Head armor ${this._armorAllocation.head} is more than twice the head's ${this._internalStructure.head} internal structure points (Power Armor, Best-of p.16): at most ${this.getMaxHeadArmor()}.`);
        }
        for (const item of this._equipmentList) {
            if (!item || !BattleMech._isPowerArmorWeapon(item)) continue;
            if (item.location === "hd" || item.location === "ct") {
                issues.push(`${item.name} is in the ${item.location === "hd" ? "head" : "center torso"}: Power Armor carries no weapons in the head or center torso (Best-of p.15).`);
            }
            if (this._isFiveTonPowerArmor() && !(POWER_ARMOR_FIVE_TON_WEAPONS as readonly string[]).includes(item.tag)) {
                issues.push(`${item.name}: a 5-ton Power Armor suit carries only flamers, machine guns and small lasers (Best-of p.16).`);
            }
        }
        // One line for two of a weapon: the creator keys its issue list by text.
        return [...new Set(issues)];
    }

    /** Flint's cockpit for this 'Mech, when the ruleset is in use and the cockpit is one it replaces. */
    private _getFutureWarsCockpit(): IFutureWarsCockpit | undefined {
        if (!this.usesFutureWarsConstruction() || this._primitive) return undefined;
        return getFutureWarsCockpit(this._tonnage, this.getFutureWarsLargeCockpit());
    }

    /** A heavy 'Mech's 4-ton, two-slot cockpit ("a few heavy mechs", Best-of p.35). False for any other class. */
    public getFutureWarsLargeCockpit(): boolean {
        return this._futureWarsLargeCockpit && getFutureWarsWeightClass(this._tonnage)?.tag === "heavy";
    }

    public setFutureWarsLargeCockpit(large: boolean): boolean {
        this._futureWarsLargeCockpit = large;
        this._calc();
        return this.getFutureWarsLargeCockpit();
    }

    /** Special or additional sensors: one more head slot and half a ton (Best-of p.35). Kept, but unbuilt, without the ruleset. */
    public getExtraSensors(): boolean {
        return this._extraSensors;
    }

    public setExtraSensors(fitted: boolean): boolean {
        this._extraSensors = fitted;
        this._calc();
        return this._extraSensors;
    }

    /** Extra life support: one more head slot and half a ton (Best-of p.35). Kept, but unbuilt, without the ruleset. */
    public getExtraLifeSupport(): boolean {
        return this._extraLifeSupport;
    }

    public setExtraLifeSupport(fitted: boolean): boolean {
        this._extraLifeSupport = fitted;
        this._calc();
        return this._extraLifeSupport;
    }

    /** The head's armor cap: 9, or twice the head's structure under Flint's rules (Best-of p.35). */
    public getMaxHeadArmor(): number {
        // Power Armor: "since the head only has 1structure point it can only hold 2 points of armor" (Best-of p.16),
        // read as twice the head's structure at every weight (ours).
        return this.usesFutureWarsConstruction() || this.usesPowerArmorConstruction() ? (this._internalStructure.head ?? 0) * 2 : 9;
    }

    /** " on a light 'Mech under Clell Flint's construction rules", or nothing without them. */
    private _futureWarsClassPhrase(): string {
        const weightClass = this.usesFutureWarsConstruction() ? getFutureWarsWeightClass(this._tonnage) : undefined;
        return weightClass ? ` on a ${weightClass.name.toLowerCase()} 'Mech under Clell Flint's construction rules` : "";
    }

    /** Why an item of `size` slots cannot go in `location` at all, or undefined when the location is long enough. */
    public getSlotFitMessage(location: string, size: number): string | undefined {
        const slots = this.getLocationSlotCount(location);
        if (size <= slots) return undefined;
        const name = getLocationName(BattleMech._SLOT_TAGS[location] ?? location, this._hasFrontLegs()).toLowerCase();
        return `A ${size}-slot item cannot fit the ${name}: it has ${slots} critical slots${this._futureWarsClassPhrase()}.`;
    }

    /** Critical table names to location tags, for messages. */
    private static readonly _SLOT_TAGS: Record<string, string> = {
        head: "hd", centerTorso: "ct", leftTorso: "lt", rightTorso: "rt", leftArm: "la", rightArm: "ra",
        leftLeg: "ll", rightLeg: "rl", centerLeg: "cl", frontLeftLeg: "fll", frontRightLeg: "frl",
    };

    /**
     * What Flint's rules, or a ruleset gone from the registry, leave wrong: the ruleset ticked on a 'Mech it does not
     * build; a ruleset the app no longer lists; head armor over twice the head's structure; and each item whose saved
     * slots now run past the end of its location, left unallocated rather than cut.
     */
    private _getFutureWarsConstructionIssues(): string[] {
        const issues: string[] = [];
        for (const id of this._rulesets) {
            if (!findSpecialRuleset(id)) {
                issues.push(`Built under the Special Ruleset "${id}", which this version of the app does not list: checked by the standard rules.`);
            }
        }
        if (this._futureWarsRuleset() && !this.usesFutureWarsConstruction()) {
            issues.push(`Clell Flint's construction rules (Special Ruleset) are for two-legged 'Mechs of up to 100 tons; this ${this._mechType.name} is built by the standard rules. His four-legged rules are Walkers, a unit type of their own.`);
        }
        if (this.usesFutureWarsConstruction() && this._armorAllocation.head > this.getMaxHeadArmor()) {
            issues.push(`Head armor ${this._armorAllocation.head} is more than twice the head's ${this._internalStructure.head} internal structure points (Clell Flint's construction rules, Best-of p.35): at most ${this.getMaxHeadArmor()}.`);
        }
        const unallocated = new Map(this._unallocatedCriticals.filter(slot => slot?.uuid).map(slot => [slot.uuid, slot]));
        const reported = new Set<string>();
        for (const saved of this._criticalAllocationTable) {
            const item = unallocated.get(saved.uuid);
            if (!item || reported.has(saved.uuid) || !saved.loc || saved.loc === "un" || typeof saved.slot !== "number") continue;
            const slots = this.getLocationSlotCount(saved.loc);
            if (saved.slot + (saved.size ?? saved.crits ?? 1) <= slots) continue;
            reported.add(saved.uuid);
            const name = getLocationName(saved.loc, this._hasFrontLegs()).toLowerCase();
            issues.push(`${item.name} no longer fits the ${name} (${slots} critical slots${this._futureWarsClassPhrase()}): it is unallocated.`);
        }
        return issues;
    }

    /** The note on a Battle Value or cost breakdown worked out under Flint's rules, which give neither. */
    private _futureWarsBreakdownNotes(edition: string): string[] | undefined {
        if (!this.usesFutureWarsConstruction()) return undefined;
        return [`Built under Clell Flint's alternate construction rules (Future Wars); Battle Value and cost by ${getRulesEdition(edition).name} on the design as built.`];
    }

    /**
     * How many critical slots a location has on this 'Mech: head and legs 6, torsos and arms 12, a QuadVee leg 2, and 0
     * for a location this type lacks (a quad's arms, a biped's center leg) or an armless 'Mech's arms. Takes a location
     * tag ("hd", "fll") or a critical table name ("head", "frontLeftLeg"), in any case. Every place that sizes, trims or
     * fills a location reads it here, so a construction ruleset can change the counts in one place (#172).
     */
    public getLocationSlotCount(location: string): number {
        const raw = (location || "").trim();
        const key: string | undefined = BattleMech._SLOT_LOCATION_KEYS[raw.toLowerCase()]
            ?? Object.values(BattleMech._SLOT_LOCATION_KEYS).find(name => name.toLowerCase() === raw.toLowerCase());
        if (!key) return 0;
        // Clell Flint's construction rules size every location by weight class (Best-of p.35).
        if (this.usesFutureWarsConstruction()) {
            if ((key === "leftArm" || key === "rightArm") && this.isArmless()) return 0;
            return getFutureWarsSlots(this._tonnage, key) ?? 0;
        }
        // Power Armor: six slots a location and twelve in the center torso, as the FW #14 sheets print them.
        if (this.usesPowerArmorConstruction()) {
            if ((key === "leftArm" || key === "rightArm") && this.isArmless()) return 0;
            return getPowerArmorSlots(this._tonnage, key) ?? 0;
        }
        const typeTag = this._mechType.tag.toLowerCase();
        const fourLegged = typeTag === "quad" || typeTag === "quadvee";
        switch (key) {
            case "head":
                return 6;
            case "centerTorso": case "leftTorso": case "rightTorso":
                return 12;
            case "leftArm": case "rightArm":
                return fourLegged || this.isArmless() ? 0 : 12;
            case "leftLeg": case "rightLeg":
                return typeTag === "quadvee" ? 2 : 6;
            case "frontLeftLeg": case "frontRightLeg":
                return typeTag === "quadvee" ? 2 : typeTag === "quad" ? 6 : 0;
            case "centerLeg":
                return typeTag === "tripod" ? 6 : 0;
        }
        return 0;
    }

    private _calcCriticals() {

        this._calcVariableEquipment();
        // Every location is laid out at its slot count; a location this type lacks gets an empty table.
        const empty = (tag: string) => Array(this.getLocationSlotCount(tag)).fill(null);
        this._criticals.head = empty("hd");
        this._criticals.centerTorso = empty("ct");
        this._criticals.leftTorso = empty("lt");
        this._criticals.rightTorso = empty("rt");
        this._criticals.leftArm = empty("la");
        this._criticals.rightArm = empty("ra");
        this._criticals.leftLeg = empty("ll");   // a quad's rear left leg
        this._criticals.rightLeg = empty("rl");  // a quad's rear right leg
        this._criticals.centerLeg = empty("cl");
        this._criticals.frontLeftLeg = empty("fll");
        this._criticals.frontRightLeg = empty("frl");

        const typeTag = this.getType().tag.toLowerCase();
        this._unallocatedCriticals = [];

        // Add required components....
        // Tripod and superheavy cockpits take the one head slot of a standard cockpit; the QuadVee's pilot
        // and gunner take two (IO:AE record sheets; "all Tripod cockpits occupy the same number of critical
        // slots", p.159).
        const isSuperheavyCockpit = (typeTag === "biped" || typeTag === "quad" || typeTag === "lam") && this._tonnage > 100;
        const cockpitTag = typeTag === "quadvee" || typeTag === "tripod" || isSuperheavyCockpit ? "multi-pilot-cockpit" : "cockpit";
        const cockpitName = typeTag === "quadvee" ? "Cockpit (Pilot)"
            : typeTag === "tripod" ? (this._tonnage > 100 ? "Superheavy Tripod Cockpit" : "Tripod Cockpit")
            : isSuperheavyCockpit ? "Superheavy Cockpit" : "Cockpit";
        const torsoMountedCockpit = this.getCockpitType().tag === "torso-mounted";
        const futureWarsCockpit = this.usesFutureWarsConstruction()
            ? (this._getFutureWarsCockpit() ?? getFutureWarsCockpit(this._tonnage, this.getFutureWarsLargeCockpit()))
            : undefined;
        if( futureWarsCockpit ) {
            // Clell Flint's head (Best-of p.35): the cockpit's life support, two sensor slots, the cockpit, in that
            // order (ours), each extra beside its kind. The rest of the head is free.
            const lifeSupport = futureWarsCockpit.lifeSupportSlots + (this._extraLifeSupport ? 1 : 0);
            const sensors = FUTURE_WARS_SENSOR_SLOTS + (this._extraSensors ? 1 : 0);
            let headSlot = 0;
            for (let slot = 0; slot < lifeSupport; slot++) this._addCriticalItem("life-support", "Life Support", 1, "hd", headSlot++);
            for (let slot = 0; slot < sensors; slot++) this._addCriticalItem("sensors", "Sensors", 1, "hd", headSlot++);
            this._addCriticalItem(cockpitTag, cockpitName, futureWarsCockpit.slots, "hd", headSlot);
        } else if (this.usesPowerArmorConstruction()) {
            // Every FW #14 sheet keeps the printed Life Support and Sensors and writes "Pilot" in head slots 3-4; the
            // pilot's other two slots are center torso 11-12, placed after the engine below.
            this._addCriticalItem("life-support", "Life Support", 1, "hd", 0);
            this._addCriticalItem("sensors", "Sensors", 1, "hd", 1);
            this._addCriticalItem(cockpitTag, "Pilot", POWER_ARMOR_PILOT_SLOTS.size, "hd", POWER_ARMOR_PILOT_SLOTS.head);
            this._addCriticalItem("sensors", "Sensors", 1, "hd", 4);
            this._addCriticalItem("life-support", "Life Support", 1, "hd", 5);
        } else if( torsoMountedCockpit ) {
            // The head keeps its 2 sensor slots; cockpit and sensors go in the center torso, and Life Support in
            // each side torso, after the engine and gyro below (TO:AUE p.112).
            this._addCriticalItem( "sensors", "Sensors", 1, "hd", 0);
            this._addCriticalItem( "sensors", "Sensors", 1, "hd", 1);
        } else if( this._smallCockpit) {
            this._addCriticalItem( "life-support", "Life Support", 1, "hd", 0);
            this._addCriticalItem( "sensors", "Sensors", 1, "hd", 1);
            this._addCriticalItem(
                cockpitTag,
                cockpitName,
                1,
                "hd",
                2
            );
            // A Command Console takes slot 3, so the second Sensors move down (MegaMek's addSmallCommandConsole).
            this._addCriticalItem( "sensors", "Sensors", 1, "hd", this.hasCommandConsole() ? 4 : 3);
        } else {
            this._addCriticalItem( "life-support", "Life Support", 1, "hd", 0);
            this._addCriticalItem( "sensors", "Sensors", 1, "hd", 1);
            // The interface cockpit "takes one extra Cockpit critical slot" (IO:AE p.110): slot 4, as MegaMek places it.
            this._addCriticalItem(
                cockpitTag,
                cockpitName,
                this._interfaceCockpit ? 2 : 1,
                "hd",
                2
            );
            this._addCriticalItem( "sensors", "Sensors", 1, "hd", 4);
            this._addCriticalItem( "life-support", "Life Support", 1, "hd", 5);
        }
        if (typeTag === "lam" && this._hasLAMLimits()) {
            this._addCriticalItem("lam-avionics", "LAM Avionics", 1, "hd", 3);
        }
        // The console sits beside the cockpit, in the cockpit's own location (TO:AUE p.112).
        if (this.hasCommandConsole()) {
            // Under Flint's rules the console takes the head's first free slot (ours).
            this._addCriticalItem("command-console", "Command Console", 1, "hd", futureWarsCockpit ? null : 3);
        }
        if (typeTag === "quadvee") {
            this._addCriticalItem(cockpitTag, "Cockpit (Gunner)", 1, "hd", 3);
        }
        if (typeTag === "quad" || typeTag === "quadvee") {
            // ---- QUAD / QUADVEE FRONT LEGS ----
            // Front Right Leg Actuators (replaces old arm hacks with direct location tracking keys)
            if (typeTag === "quad") {
                this._addCriticalItem("hip", "Hip", 1, "frl", 0);
                this._addCriticalItem("upper-leg-actuator", "Upper Leg Actuator", 1, "frl", 1);
                this._addCriticalItem("lower-leg-actuator", "Lower Leg Actuator", 1, "frl", 2);
                this._addCriticalItem("foot-actuator", "Foot Actuator", 1, "frl", 3);
                this._addCriticalItem("hip", "Hip", 1, "fll", 0);
                this._addCriticalItem("upper-leg-actuator", "Upper Leg Actuator", 1, "fll", 1);
                this._addCriticalItem("lower-leg-actuator", "Lower Leg Actuator", 1, "fll", 2);
                this._addCriticalItem("foot-actuator", "Foot Actuator", 1, "fll", 3);
            } else {
                this._addCriticalItem("quadvee-conversion", "QuadVee Conversion / Motive Gear", 2, "frl");
                this._addCriticalItem("quadvee-conversion", "QuadVee Conversion / Motive Gear", 2, "fll");
            }
        } else if (!this.isArmless()) {
            // ---- BIPED / LAM / TRIPOD ARM ACTUATORS ----
            for (const arm of ["la", "ra"]) {
                this._addCriticalItem("shoulder", "Shoulder", 1, arm, 0);
                this._addCriticalItem("upper-arm-actuator", "Upper Arm Actuator", 1, arm, 1);
                if (this.hasLowerArmActuator(arm)) {
                    this._addCriticalItem("lower-arm-actuator", "Lower Arm Actuator", 1, arm, 2);
                    if (this.hasHandActuator(arm)) {
                        this._addCriticalItem("hand-actuator", "Hand Actuator", 1, arm, 3);
                    }
                }
            }
        }
        // Define baseline structural data constraints for our vroomie vrooms...
        let engineCrits: ICriticalLocations = { ct: 0, rt: 0, lt: 0 };
        const currentTechTag = this.getEngineTechBase();

        // Core Data Validation & Rollback Routing
        if (this._engineType.criticals && this._engineType.criticals[currentTechTag]) {
            engineCrits = this._engineType.criticals[currentTechTag];
        }

        // Fallback Check: Reset engines with no slot data for this tech base to standard.
        // Compact engines legitimately use 3 center torso slots.
        if (!engineCrits || !engineCrits.ct) {
            console.warn("Resetting engine to standard, engine not available for tech profile:", this._engineType?.criticals, currentTechTag);
            this.setEngineType("standard");
            if (this._engineType.criticals && this._engineType.criticals[currentTechTag]) {
                engineCrits = this._engineType.criticals[currentTechTag];
            } else {
                engineCrits = { ct: 6, rt: 0, lt: 0 }; 
            }
        }
        // Large engines (rating over 400) take their slots from their own record: two more center
        // torso slots than the base type, placed after the gyro (TO:AUE p.120).
        const largeEngineType = this.getLargeEngineType();
        const largeEngineCrits = largeEngineType?.criticals[currentTechTag];
        if (largeEngineCrits) {
            engineCrits = largeEngineCrits;
        }
        const engineName = largeEngineType?.name ?? this._engineType.name;
        // FIRST ENGINE BLOCK (Slots 1-3): Seats the upper drive mechanism
        // If an engine takes 6 slots, we limit the first sequential chunk to exactly 3 slots. Currently unless I can find something canonical or homebrew somewhere
        // A superheavy 'Mech's engine takes half its usual slots in each location, rounded up (IO:AE p.156).
        // Under Clell Flint's rules every engine's center torso slots go by its weight (Best-of p.36); half go before
        // the gyro and the rest after it (ours, as the standard 3 + 3).
        const engineCriticalTorso = futureWarsCockpit
            ? getFutureWarsEngineSlots(this.getEngineWeight() ?? 0)
            : this.getCriticalSlots((engineCrits.ct ?? 0) + (this.isLargeEngine() && !largeEngineCrits ? 2 : 0));
        const initialEngineAllocation = futureWarsCockpit ? Math.ceil(engineCriticalTorso / 2)
            : engineCriticalTorso > 3 ? 3 : engineCriticalTorso;
        if (initialEngineAllocation > 0) {
            this._addCriticalItem(
                "engine", 
                engineName, 
                initialEngineAllocation, 
                "ct"
            );
        }
        // GYRO POSITIONING (Slots 4-6): Injected immediately below the upper engine core as is tradition and as I saw all the way back in 1989.
        // Superheavy Mechs mount the Superheavy Gyro, which takes only 2 center torso slots (IO:AE p.156).
        // A 5-ton Power Armor suit has none.
        if (!this._isFiveTonPowerArmor()) this._addCriticalItem(
            "gyro",
            this._gyro.name,
            // Flint: "Gyroscopes take up one critical space per ton" (Best-of p.36).
            futureWarsCockpit ? getFutureWarsGyroSlots(this.getGyroWeight()) : this._tonnage > 100 ? 2 : this._gyro.criticals,
            "ct"
        );
        // SECOND ENGINE BLOCK (Slots 7-9): Handles the trailing split block for 6-slot engines
        const remainingEngineAllocation = engineCriticalTorso - initialEngineAllocation;
        if (remainingEngineAllocation > 0) {
            this._addCriticalItem(
                "engine",
                engineName,
                remainingEngineAllocation,
                "ct"
            );
        }
        if (this.usesPowerArmorConstruction()) {
            this._addCriticalItem(cockpitTag, "Pilot", POWER_ARMOR_PILOT_SLOTS.size, "ct", POWER_ARMOR_PILOT_SLOTS.centerTorso);
        }
        // TORSO SHIELDING: Distribute side shield critical slots
        if (engineCrits.rt) {
            this._addCriticalItem("engine", engineName, this.getCriticalSlots(engineCrits.rt), "rt");
        }
        if (engineCrits.lt) {
            this._addCriticalItem("engine", engineName, this.getCriticalSlots(engineCrits.lt), "lt");
        }
        if (torsoMountedCockpit) {
            this._addCriticalItem(cockpitTag, cockpitName, 1, "ct", null);
            this._addCriticalItem("sensors", "Sensors", 1, "ct", null);
            this._addCriticalItem("life-support", "Life Support", 1, "lt", null);
            this._addCriticalItem("life-support", "Life Support", 1, "rt", null);
        }
        if (typeTag === "lam" && !this._hasLAMLimits()) {
            // Battletech Into The Future's VTOLAM: rotor equipment in each side torso, conversion equipment in each leg.
            for (const location of ["lt", "rt"]) this._addCriticalItem("lam-rotor", "VTOLAM Rotor Equipment", 1, location);
            for (const location of ["ll", "rl"]) this._addCriticalItem("lam-conversion", "VTOLAM Conversion Equipment", 1, location);
        } else if (typeTag === "lam") {
            this._addCriticalItem("lam-avionics", "LAM Avionics", 1, "lt");
            this._addCriticalItem("lam-avionics", "LAM Avionics", 1, "rt");
            // A VTOLAM's landing gear is retractable skids, one slot in each side torso and none in the center.
            const gearName = this.isVTOLAM() ? "VTOLAM Landing Skids" : "LAM Landing Gear";
            // A Permanent Air 'Mech has no landing gear: it lands on its feet (owner ruling 2026-11-12).
            if (!this.isPermanentAirMech()) {
                if (!this.isVTOLAM()) this._addCriticalItem("lam-landing-gear", gearName, 1, "ct");
                this._addCriticalItem("lam-landing-gear", gearName, 1, "lt");
                this._addCriticalItem("lam-landing-gear", gearName, 1, "rt");
            }
        }

        // STANDARD & REAR LEGS: Track Left Leg (ll) and Right Leg (rl) structural presence. Am I standing?
        const leftLegIS = this._internalStructure.leftLeg ?? 0;
        const rightLegIS = this._internalStructure.rightLeg ?? 0;
        if (leftLegIS > 0 && typeTag !== "quadvee") {
            this._addCriticalItem("hip", "Hip", 1, "ll", 0);
            this._addCriticalItem("upper-leg-actuator", "Upper Leg Actuator", 1, "ll", 1);
            this._addCriticalItem("lower-leg-actuator", "Lower Leg Actuator", 1, "ll", 2);
            this._addCriticalItem("foot-actuator", "Foot Actuator", 1, "ll", 3);
        }
        if (rightLegIS > 0 && typeTag !== "quadvee") {
            this._addCriticalItem("hip", "Hip", 1, "rl", 0);
            this._addCriticalItem("upper-leg-actuator", "Upper Leg Actuator", 1, "rl", 1);
            this._addCriticalItem("lower-leg-actuator", "Lower Leg Actuator", 1, "rl", 2);
            this._addCriticalItem("foot-actuator", "Foot Actuator", 1, "rl", 3);
        }
        if (typeTag === "quadvee") {
            this._addCriticalItem("quadvee-conversion", "QuadVee Conversion / Motive Gear", 2, "rl");
            this._addCriticalItem("quadvee-conversion", "QuadVee Conversion / Motive Gear", 2, "ll");
        }
        // 2. Populate specialized Tripod Center Leg actuators
        if (typeTag === "tripod") {
            const centerLegIS = this._internalStructure.centerLeg ?? 0;
            if (centerLegIS > 0) {
                // Map center leg actuators cleanly onto its unique location tracking token key ('cl')
                this._addCriticalItem("hip", "Hip", 1, "cl", 0);
                this._addCriticalItem("upper-leg-actuator", "Upper Leg Actuator", 1, "cl", 1);
                this._addCriticalItem("lower-leg-actuator", "Lower Leg Actuator", 1, "cl", 2);
                this._addCriticalItem("foot-actuator", "Foot Actuator", 1, "cl", 3);
            }
        }
        // Jump Jets
        // Battledroids keeps jump jets off the Critical Hit Chart (BD p.25).
        const jumpJetCriticals = getEditionStats(this._jumpJetType, this._rulesEdition)?.criticals ?? this._jumpJetType.criticals;
        const jump_move = jumpJetCriticals > 0 ? this._jumpSpeed : 0;
        for( let jmc = 0; jmc < jump_move; jmc++) {
            this._unallocatedCriticals.push({
                uuid: generateUUID(),
                obj: null,
                name: this._jumpJetType.name,
                tag: "jj-" + this._jumpJetType.tag,
                rear: false,
                movable: true,
                crits: jumpJetCriticals,
            });
        }

        // Armor
        const armorObj = this.getArmorObj();
        const armorTechBase = this.getArmorTechBase();
        const armorCriticalLocations = armorObj.critLocs?.[typeTag as keyof NonNullable<typeof armorObj.critLocs>];
        // Patchwork armor slots belong to their locations. They are placed after the saved allocations below,
        // in the slots those leave free, so the restore loop skips them.
        const patchworkArmorTags = new Set<string>();
        if (this.isPatchworkArmor()) {
            for (const location of this.getPatchworkLocations()) {
                if (this.getPatchworkLocationSlots(location.key) > 0) patchworkArmorTags.add(this.getPatchworkArmorType(location.key).tag);
            }
        } else if (armorCriticalLocations) {
            // Armor with fixed slots in each location (Stealth) is placed after the saved allocations below, so it
            // takes the slots it was saved in and never ones the equipment was saved in (#43).
        } else {
            for (let armorCritical = 0; armorCritical < this.getCriticalSlots(armorObj.crits[armorTechBase]); armorCritical++) {
                this._unallocatedCriticals.push({
                    uuid: generateUUID(),
                    name: armorObj.name,
                    tag: armorObj.tag,
                    rear: false,
                    rollAgain: true,
                    crits: 1,
                    obj: armorObj,
                    movable: true,
                });
            }
        }

        // Internal Structure critical Items. A FrankenMech's are placed location by location after the saved
        // allocations, like patchwork armor's.
        const frankenMechStructureTags = new Set<string>(this._frankenMech
            ? this.getFrankenMechLocations().filter(location => this.getFrankenMechLocationStructureSlots(location.key) > 0)
                .map(location => this.getFrankenMechLocationStructure(location.key).tag)
            : []);
        if( this._frankenMech ) {
            // Placed below.
        } else if( this.getStructureTechBase() === "clan" ) {
            for( let aCounter = 0; aCounter < this.getCriticalSlots(this._selectedInternalStructure.crits.clan); aCounter++) {
                this._unallocatedCriticals.push({
                    uuid: generateUUID(),
                    name: this._selectedInternalStructure.name,
                    tag: this._selectedInternalStructure.tag,
                    rollAgain: true,
                    rear: false,
                    crits: 1,
                    obj: this._selectedInternalStructure,
                    movable: true
                });
            }

        } else {
            // Superheavy endo steel takes 7 slots and endo-composite 4 (IO:AE p.155).
            for( let aCounter = 0; aCounter < this.getCriticalSlots(this._selectedInternalStructure.crits.is); aCounter++) {
                this._unallocatedCriticals.push({
                    uuid: generateUUID(),
                    name: this._selectedInternalStructure.name,
                    tag: this._selectedInternalStructure.tag,
                    rollAgain: true,
                    rear: false,
                    crits: 1,
                    obj: this._selectedInternalStructure,
                    movable: true
                });
            }
        }

        // Myomer critical items (TSM variants spread anywhere but the head)
        for( let mCounter = 0; mCounter < this._myomerType.criticals; mCounter++) {
            this._unallocatedCriticals.push({
                uuid: generateUUID(),
                name: this._myomerType.name,
                tag: this._myomerType.tag,
                rear: false,
                crits: 1,
                obj: this._myomerType,
                movable: true
            });
        }

        // Get optional equipment...
        // this._calcVariableEquipment();
        for( let elc = 0; elc < this._equipmentList.length; elc++) {
            // this._equipmentList[elc].location = "";
            let rearTag = "";
            let isRear = false;
            if( this._equipmentList[elc].rear) {
                rearTag = " (rear)";
                isRear = true;
            } else if( this.isTurretMounted(this._equipmentList[elc]) ) {
                rearTag = " (turret)";
            }


            // Spread equipment (signature systems, sealing, tracks...) places each slot on its own.
            if( this._equipmentList[elc].spreadSlots ) {
                const baseUUID = this._equipmentList[elc].uuid ?? generateUUID();
                const spreadSlotCount = this.getSpreadSlotCount(this._equipmentList[elc]);
                for( let slotIndex = 0; slotIndex < spreadSlotCount; slotIndex++) {
                    this._unallocatedCriticals.push({
                        uuid: baseUUID + ":" + slotIndex,
                        name: this._equipmentList[elc].name,
                        tag: this._equipmentList[elc].tag,
                        rear: false,
                        crits: 1,
                        obj: this._equipmentList[elc],
                        movable: true,
                    });
                }
                continue;
            }

            // Equipment that takes no critical slot is carried but never placed (RISC Heat Sink Override Kit).
            if( this._equipmentList[elc].space.battlemech === 0 ) {
                continue;
            }

            this._unallocatedCriticals.push({
                uuid: this._equipmentList[elc].uuid ?? generateUUID(),
                name: this._equipmentList[elc].name + rearTag,
                tag: this._equipmentList[elc].tag,
                loc: this._equipmentList[elc].location,
                rear: isRear,
                crits: this.getCriticalSlots(this._equipmentList[elc].space.battlemech),
                obj: this._equipmentList[elc],
                movable: true,

            });


        }

        // Heat Sink Requirements
        const hs_requirements = this.getHeatSinkCriticalRequirements();
        let hs_nickname = "";
        if( (this._heatSinkType.perSlot ?? 1) > 1)
            hs_nickname = "Compact Heat Sinks";
        else if( hs_requirements.slotsEach > 1)
            hs_nickname = "Double Heat Sink";
        else
            hs_nickname ="Heat Sink";
        // A superheavy slot shared by several heat sinks says how many it holds (IO:AE p.157).
        const heatSinksPerSlot = this._getHeatSinksPerSlot();
        let externalHeatSinks = Math.max(0, this.getHeatSinks() - this.getEngineHeatSinkCapacity());
        for( let hsc = 0; hsc < hs_requirements.number; hsc++) {
            const heatSinksInSlot = Math.min(heatSinksPerSlot, externalHeatSinks);
            externalHeatSinks -= heatSinksInSlot;
            let hs_slotName = hs_nickname;
            if( this.isSuperheavy() && heatSinksPerSlot > 1 && heatSinksInSlot > 1 ) {
                hs_slotName = (hs_nickname === "Heat Sink" ? "Heat Sinks" : hs_nickname) + " (" + heatSinksInSlot + ")";
            }

            this._unallocatedCriticals.push({
                obj: null,
                uuid: generateUUID(),
                name: hs_slotName,
                rear: false,
                tag: "heat-sink",
                crits: hs_requirements.slotsEach,
                movable: true
            });
        }

        // Allocate items per allocation table.
        // console.log( "_calc this._criticalAllocationTable", this._criticalAllocationTable);

        const criticalTally: Record<string, number> = {};
        this._sortCriticalAllocationTableByTagThenUUID();
        for( const item of this._criticalAllocationTable) {
            // Armor with fixed critical locations (Stealth, ...) is placed after this loop, at its saved slots.
            if( armorCriticalLocations && item.tag === armorObj.tag ) {
                continue;
            }
            // The same goes for a patchwork location's armor slots and a FrankenMech's structure slots, which are
            // placed after this loop.
            if( patchworkArmorTags.has(item.tag) || frankenMechStructureTags.has(item.tag) ) {
                continue;
            }
            let removeFromUnallocated = false;
            // console.log( "criticalAllocationTable item", this.getName(), item.tag, item.loc, item.crits, item.size, item.uuid );

            if( !criticalTally[ item.uuid ] )
                criticalTally[ item.uuid ] = 0;

            if( item.size )
                criticalTally[ item.uuid ] += item.size;
            else
                criticalTally[ item.uuid ] += item.crits;

            if( criticalTally[ item.uuid ] >= item.crits )
                removeFromUnallocated = true;


            this._allocateCritical(
                item.tag,
                item.rear,
                item.loc,
                item.slot,
                removeFromUnallocated,
                item.size,
                item.uuid,
            )
        }

        if (armorCriticalLocations && !this.isPatchworkArmor()) {
            for (const [location, criticalCount] of Object.entries(armorCriticalLocations)) {
                if (!criticalCount || criticalCount <= 0) continue;
                const slots = this.getCriticalSlots(criticalCount);
                const saved = this._criticalAllocationTable.find((item) => item.tag === armorObj.tag && item.loc === location);
                const placed = (typeof saved?.slot === "number" && saved.slot > 0
                        && this._addCriticalItem(armorObj.tag, armorObj.name, slots, location, saved.slot, true))
                    || this._addCriticalItem(armorObj.tag, armorObj.name, slots, location, null, true);
                if (!placed) {
                    this._unallocatedCriticals.push({
                        uuid: generateUUID(), name: armorObj.name, tag: armorObj.tag, rear: false,
                        movable: true, crits: slots, obj: null,
                    } as ICriticalSlot);
                }
            }
        }

        // Patchwork: each location takes the slots of its own armor type, and they stay there. "If slot space
        // is unavailable ... the desired armor type may not be mounted there" (TO:AUE p.189).
        this._patchworkSlotShortfalls = [];
        if (this.isPatchworkArmor()) {
            for (const location of this.getPatchworkLocations()) {
                const slots = this.getPatchworkLocationSlots(location.key);
                if (slots <= 0) continue;
                const locationArmor = this.getPatchworkArmorType(location.key);
                let placed = 0;
                while (placed < slots && this._addCriticalItem(locationArmor.tag, locationArmor.name, 1, location.abbr, null, false, true)) {
                    placed++;
                }
                if (placed < slots) {
                    this._patchworkSlotShortfalls.push(`Patchwork Armor: ${locationArmor.name} needs ${slots} free critical slot${slots === 1 ? "" : "s"} in the ${location.label}.`);
                }
            }
        }

        // FrankenMech: each location keeps its own structure's slots, from the Internal Structure Distribution
        // Table (CO pp.212-213).
        this._frankenMechSlotShortfalls = [];
        for (const location of this._frankenMech ? this.getFrankenMechLocations() : []) {
            const slots = this.getFrankenMechLocationStructureSlots(location.key);
            if (slots <= 0) continue;
            const structure = this.getFrankenMechLocationStructure(location.key);
            const structureName = this.getFrankenMechLocationStructureName(location.key);
            let placed = 0;
            while (placed < slots && this._addCriticalItem(structure.tag, structureName, 1, location.abbr, null, false, true)) {
                placed++;
            }
            if (placed < slots) {
                this._frankenMechSlotShortfalls.push(`FrankenMech: ${structureName} structure needs ${slots} free critical slot${slots === 1 ? "" : "s"} in the ${location.label}.`);
            }
        }

    }

    public hasHandActuator(
        location: string,
    ) {
        if( this.isArmless() )
            return false;
        if( location === "ra" )
            if( this._no_right_arm_hand_actuator)
                return false;
        if( location === "la" )
            if( this._no_left_arm_hand_actuator)
                return false;
        return true;
    }

    public hasLowerArmActuator(
        location: string,
    ) {
        if( this.isArmless() )
            return false;
        // "Suits must have both upper and lower arm actuators" (Best-of p.16).
        if (this.usesPowerArmorConstruction()) return true;
        if( location === "ra" )
            if( this._no_right_arm_lower_actuator)
                return false;
        if( location === "la" )
            if( this._no_left_arm_lower_actuator)
                return false;
        return true;
    }

    public removeHandActuator(
        location: string,
    ) {
        if( location === "ra" ) {
            this._no_right_arm_hand_actuator = true;
        }
        if( location === "la" ) {
            this._no_left_arm_hand_actuator = true;
        }
        this._calc();

    }

    public removeLowerArmActuator(
        location: string,
    ) {
        // A Power Armor suit keeps its lower arm actuators (Best-of p.16).
        if (this.usesPowerArmorConstruction()) return;
        if( location === "ra" ) {
            this._no_right_arm_hand_actuator = true;
            this._no_right_arm_lower_actuator = true;

        }
        if( location === "la" ) {
            this._no_left_arm_hand_actuator = true;
            this._no_left_arm_lower_actuator = true;
        }
        this._calc();
    }

    public addHandActuator(
        location: string,
    ) {
        if( location === "ra" ) {
            this._no_right_arm_hand_actuator = false;
            this._no_right_arm_lower_actuator = false;

        }
        if( location === "la" ) {
            this._no_left_arm_hand_actuator = false;
            this._no_left_arm_lower_actuator = false;
        }
        this._calc();
    }

    public addLowerArmActuator(
        location: string,
    ) {
        if( location === "ra" ) {
            //    no_right_arm_hand_actuator = false;
            this._no_right_arm_lower_actuator = false;

        }
        if( location === "la" ) {
            //    no_left_arm_hand_actuator = false;
            this._no_left_arm_lower_actuator = false;
        }
        this._calc();
    }

    public toggleHandActuator(
        location: string,
    ) {
        if( location === "ra" ) {
            if( this._no_right_arm_hand_actuator ) {
                this._no_right_arm_hand_actuator = false;
                this._no_right_arm_lower_actuator = false;
            } else {
                this._no_right_arm_hand_actuator = true;
            }

        }
        if( location === "la" ) {
            if( this._no_left_arm_hand_actuator ) {
                this._no_left_arm_hand_actuator = false;
                this._no_left_arm_lower_actuator = false;
            } else {
                this._no_left_arm_hand_actuator = true;
            }

        }
        this._calc();
    }

    public toggleLowerArmActuator(
        location: string,
    ) {
        if( location === "ra" ) {
            if( this._no_right_arm_lower_actuator ) {
                this._no_right_arm_lower_actuator = false;
            } else {
                this._no_right_arm_lower_actuator = true;
                this._no_right_arm_hand_actuator = true;
            }
        }
        if( location === "la" ) {
            if( this._no_left_arm_lower_actuator ) {
                this._no_left_arm_lower_actuator = false;

            } else {
                this._no_left_arm_lower_actuator = true;
                this._no_left_arm_hand_actuator = true;
            }

        }
        this._calc();
    }

    /** Heat for running: 2, or 6 with an XXL engine. */
    public getRunHeat(): number {
        return this.isXXLEngine() ? 6 : 2;
    }

    /**
     * Heat for jumping the full jump MP: at least 3, one per MP (XXL: at least 6, two per MP).
     * Improved jump jets count half their MP, rounded up.
     */
    public getJumpHeat(): number {
        // UMUs generate 1 heat however far the unit moves (TO:AUE p.107).
        if (this._jumpJetType.underwater) return this.getUMUSpeed() > 0 ? 1 : 0;
        // Movement granted by a partial wing generates no heat.
        const jumpMP = this.getJumpSpeed() - (this.getJumpSpeed() > 0 ? this.getPartialWingJumpBonus() : 0);
        if (jumpMP <= 0) return 0;
        // Prototype improved jump jets: 2 heat a hex, at least 6 (IO:AE p.97).
        if (this._jumpJetType.heatPerHex) {
            const prototypeHeat = Math.max(this._jumpJetType.minimumHeat ?? 3, jumpMP * this._jumpJetType.heatPerHex);
            return this.isXXLEngine() ? prototypeHeat * 2 : prototypeHeat;
        }
        // A FrankenMech's lighter jets make heat jet by jet: six half-ton jets on a 60-ton 'Mech give 6 points (CO p.213).
        const jetsForHeat = this.usesLighterJumpJets() ? this._jumpSpeed : jumpMP;
        const heatMP = this._jumpJetType.tag === "improved" ? Math.ceil(jetsForHeat / 2) : jetsForHeat;
        return this.isXXLEngine() ? Math.max(6, heatMP * 2) : Math.max(3, heatMP);
    }

    /** XXL movement heat: XXL engines, and the custom Mini Engine, whose heat is "exactly like an XXL engine" (#249). */
    public isXXLEngine(): boolean {
        return this._engineType.tag === "xxl" || this._engineType.tag === "clan_xxl" || this._engineType.tag === BattleMech.MINI_ENGINE_TAG;
    }

    /**
     * Highest walking MP an engine can give this 'Mech: rating (walk MP x tonnage) is capped at 400,
     * or 500 with Large engines, which are Experimental technology (TO:AUE).
     */
    /** Lowest Walking MP an engine exists for. The Engine Table starts at a rating of 10, so a 5-ton battledroid needs 2 (BD p.23). */
    public getMinWalkSpeed(): number {
        return Math.max(1, Math.ceil(10 / Math.max(1, this.getTonnage())));
    }

    public getMaxWalkSpeed(rulesLevel: number = 2): number {
        // The Engine Tables before Total Warfare end at 400, whatever the rules level.
        const maxRating = rulesLevel >= EXPERIMENTAL_RULES_LEVEL && !this.usesEarlierRulesEdition() ? 500 : 400;
        const walk = Math.floor(maxRating / Math.max(1, this.getTonnage()));
        if (!this._primitive) return walk;
        // A Primitive engine's adjusted rating comes from the Master Engine Table, which ends at 400 (IO:AE p.117).
        let primitiveWalk = walk;
        while (primitiveWalk > 0 && this._engineRatingForWalk(primitiveWalk) > 400) primitiveWalk--;
        return primitiveWalk;
    }

    /** Jump jets need a fusion or fission engine (TM p.69; IO:AE p.117); so does running energy weapons without power amplifiers (TM p.72). */
    private _hasFusionOrFissionEngine(): boolean {
        return this._engineType.tag !== "ice" && this._engineType.tag !== "cell";
    }

    /** Highest jump MP the jump jet type allows: walking MP, or running MP for Improved jump jets. */
    public getMaxJumpSpeed(): number {
        if (this.isSuperheavy() || !this._hasFusionOrFissionEngine()) return 0;
        return this._jumpJetType.tag === "improved" || this._jumpJetType.jumpAsRun ? this.getRunSpeed() + this._hardenedArmorRunPenalty() : this.getWalkSpeed();
    }

    public getJumpJetType(): IJumpJet {
        return this._jumpJetType;
    }

    public setJumpJetType(tag: string): IJumpJet {
        const jumpJet = findByTag(getComponentRecords("jumpJet"), tag);
        if (jumpJet) {
            this._jumpJetType = jumpJet;
            this._calc();
        }
        return this._jumpJetType;
    }

    public getMyomerType(): IMyomerType {
        return this._myomerType;
    }

    public setMyomerType(tag: string): IMyomerType {
        const myomer = findByTag(getComponentRecords("myomer"), tag);
        if (myomer) {
            this._myomerType = myomer;
            this._calc();
        }
        return this._myomerType;
    }

    /** Whether the 'Mech has Triple-Strength Myomer (production or prototype). */
    public hasTripleStrengthMyomer(): boolean {
        return this._myomerType.tripleStrength;
    }

    public getAvailableMyomerTypes(rulesLevel: number = 2): IMyomerType[] {
        const techTag = this.getTech().tag;
        return mechMyomerTypes.map(entry => ({ ...entry })).map(myomer => {
            const availability = this._techDatesAvailability(myomer, rulesLevel);
            myomer.availableAsPrototype = availability.asPrototype;
            // Superheavy musculature is incompatible with Triple-Strength Myomer (IO:AE p.156).
            myomer.available = availability.available && (myomer.tag === "standard" || this.isOfferedInEdition(myomer, rulesLevel)) && servesTechBase(myomer.techBase, techTag)
                && !(this.isSuperheavy() && BattleMech._isTripleStrengthMyomer(myomer))
                && this._isChassisLegalMyomer(myomer);
            return myomer;
        });
    }

    public getAvailableJumpJets(rulesLevel: number = 2): IJumpJet[] {
        return mechJumpJetTypes.map(entry => ({ ...entry })).map(jumpJet => {
            const availability = this._techDatesAvailability(jumpJet, rulesLevel);
            jumpJet.availableAsPrototype = availability.asPrototype;
            // Superheavy 'Mechs mount no jump jets, improved jump jets or UMUs (IO:AE p.156).
            jumpJet.available = availability.available && this.isOfferedInEdition(jumpJet, rulesLevel) && !this.isSuperheavy()
                && !(jumpJet.innerSphereOnly && this.getTech().tag === "clan")
                // IndustrialMechs "may use only standard jump jets" (TM p.69).
                && this._hasFusionOrFissionEngine() && (!this.isIndustrialMech() || jumpJet.tag === "standard");
            return jumpJet;
        });
    }

    public getMaxMovementHeat() {
        // "ICE-powered IndustrialMechs ... always have a Movement Heat Value of 0" (TM p.303; the BV errata v4.1 keep
        // it to ICE, though fuel cell IndustrialMechs also make no walking or running heat in play, TW p.158).
        if (this.isIndustrialMech() && this._engineType.tag === "ice") return 0;
        // Battle Value uses the higher of running and jumping heat (TM p.303). Standard LAMs
        // use AirMech flank heat: 1 per 3 AirMech MP, rounded normally (IO pp.113, 192).
        let maxMoveHeat = this.hasAirMechMode()
            ? Math.round(this.getAirMechFlankMP() / 3)
            : Math.max(this.getRunHeat(), this.getJumpHeat());

        // Stealth Armor
        if( this.getArmorType() === "stealth-basic" ) {
            maxMoveHeat += 10;
        }

        return maxMoveHeat;
    }

    private _addCriticalItem(
    item_tag: string,
    item_nickname: string,
    criticalCount: number,
    location: string,
    slot: number | null = 0,
    movable: boolean = false,
    rollAgain: boolean = false,
): boolean {
    // Generate a unique identifier tracking tag for the component instance
    const uuid = generateUUID();
    const item: ICriticalSlot = {
        obj: null,
        rear: false,
        tag: item_tag,
        name: item_nickname,
        crits: criticalCount,
        movable: movable,
        uuid: uuid,
        ...(rollAgain ? { rollAgain: true } : {}),
    };

    // Standardize input parameters to eliminate undefined values
    const assignedSlot = (slot === undefined || slot === null) ? null : slot;

    if (!location) {
        return false;
    }

    const normalizedLocation = location.toLowerCase().trim();

    // Core Architecture Location Registry Mapping Dictionary
    // Natively maps standard biped, quad, and tripod inventory slots without dynamic type casting work arounds
    const locationMap: Record<string, any[] | undefined> = {
        "hd": this._criticals.head,
        "ct": this._criticals.centerTorso,
        "lt": this._criticals.leftTorso,
        "rt": this._criticals.rightTorso,
        "la": this._criticals.leftArm,
        "ra": this._criticals.rightArm,
        "ll": this._criticals.leftLeg,
        "rl": this._criticals.rightLeg,
        // Advanced layout location trackers mapped to their respective backing properties
        "cl": (this._criticals as any).centerLeg,
        "fll": (this._criticals as any).frontLeftLeg,
        "frl": (this._criticals as any).frontRightLeg
    };

    // Extract the target array reference matrix based on choice
    const targetCriticalArray = locationMap[normalizedLocation];
    if (targetCriticalArray) {
        return this._assignItemToArea(targetCriticalArray, item, criticalCount, assignedSlot, normalizedLocation);
    }
    // Unrecognized or unmapped structural string identifier fallback
    console.error(`_addCriticalItem failed: Location '${location}' is not a valid structural component for the active layout.`);
    return false;
}

    /**
     * On a superheavy 'Mech a slot of ammunition in the torsos, arms or legs may hold two tons, as long
     * as both feed the same weapon type; the rounds themselves may differ (IO:AE p.157).
     */
    private _canShareAmmunitionSlot(
        occupant: ICriticalSlot | null | undefined,
        incoming: ICriticalSlot,
        location: string,
    ): boolean {
        if (!this.isSuperheavy() || location === "hd" || location === "un") return false;
        if (!occupant || occupant.placeholder || occupant.shared || occupant.uuid === incoming.uuid) return false;
        const held = occupant.obj as IEquipmentItem | null;
        const added = incoming.obj as IEquipmentItem | null;
        if (!held?.isAmmo || !added?.isAmmo) return false;
        return getAmmoFamily(held) === getAmmoFamily(added);
    }

    /** Puts a second ton of ammunition into an occupied slot and names the slot for both. */
    private _shareAmmunitionSlot(occupant: ICriticalSlot, incoming: ICriticalSlot): void {
        const companion: ICriticalSlot = JSON.parse(JSON.stringify(incoming));
        delete companion.shared;
        companion.size = 1;
        occupant.shared = companion;
        const heldName = occupant.obj?.name ?? occupant.name;
        const addedName = companion.obj?.name ?? companion.name;
        occupant.name = heldName === addedName ? `${heldName} (x2)` : `${heldName} + ${addedName}`;
    }

    private _isNextXCritsAvailable(
        areaArray: ICriticalSlot[],
        criticalCount: number,
        beginSlot: number,
        selfUUID: string,
    ): boolean {
        // An item never runs past the end of its location: the slots past it would be cut off, and the item lost.
        if( beginSlot + criticalCount > areaArray.length ) {
            return false;
        }
        for( let countItem = 0; countItem < criticalCount; countItem++) {
            if(
                areaArray[beginSlot + countItem]
                    &&
                areaArray[beginSlot + countItem].uuid !== selfUUID
            ) {
                return false;
            }
        }
        return true;
    }

    private _assignItemToArea(
        areaArray: ICriticalSlot[],
        newItem: ICriticalSlot,
        criticalCount: number,
        slotNumber: number | null,
        location: string,
    ) {

        newItem = JSON.parse(JSON.stringify(newItem));
        // console.log("_assignItemToArea", this.getName(), newItem, criticalCount, slotNumber);
        const placeholder: ICriticalSlot = {
            uuid: newItem.uuid,
            name: "placeholder",
            placeholder: true,
            tag: "",
            crits: 1,
            rear: false,
            obj: null,
            size: criticalCount,
        };

        newItem.size = criticalCount;
        // A saved design's second ton of ammunition goes back into the slot it shared (slot 0 included,
        // which otherwise means "anywhere").
        if( typeof(slotNumber) === "number" && this._canShareAmmunitionSlot(areaArray[slotNumber], newItem, location) ) {
            this._shareAmmunitionSlot(areaArray[slotNumber], newItem);
            this._setEquipmentAllocation(newItem.uuid, slotNumber, location);
            return true;
        }
        // console.log( "newItem", newItem );
        if( typeof(slotNumber) === "undefined" || slotNumber === null || slotNumber === 0) {
            // place anywhere available
            for( let countArray = 0; countArray < areaArray.length; countArray++) {
                if( !areaArray[countArray]) {

                    if( this._isNextXCritsAvailable(areaArray, criticalCount - 1, countArray + 1, newItem.uuid)) {
                        for( let aita_c = 0; aita_c < criticalCount; aita_c++) {
                            if( aita_c === 0) {
                                areaArray[aita_c + countArray] = newItem;
                                areaArray[aita_c + countArray].size = criticalCount;
                                this._setEquipmentAllocation(
                                    newItem.uuid,
                                    aita_c + countArray,
                                    location
                                )
                            } else {
                                areaArray[aita_c + countArray] = placeholder;
                                areaArray[aita_c + countArray].size = criticalCount;
                            }
                        }
                        // this._updateCriticalAllocationTable();

                        return true;
                    }
                }
            }
        } else {
            // at specified slot
            if( !areaArray[slotNumber]) {
                if( this._isNextXCritsAvailable(areaArray, criticalCount - 1, slotNumber + 1, newItem.uuid)) {

                    for( let aita_c = 0; aita_c < criticalCount; aita_c++) {

                        if( aita_c === 0) {
                            areaArray[aita_c + slotNumber] = newItem;
                            areaArray[aita_c + slotNumber].size = criticalCount;
                            this._setEquipmentAllocation(
                                newItem.uuid,
                                aita_c + slotNumber,
                                location
                            )
                        } else {
                            areaArray[aita_c + slotNumber] = placeholder;
                            areaArray[aita_c + slotNumber].size = criticalCount;
                        }
                    }
                    // this._updateCriticalAllocationTable();

                    return true;
                }
            }
        }

        return false;
    }

    // Overriding this currently... I will look into removing the functionality entirely later... no need to trim if you are good the first round.
    private _trimCriticals() {
    // Clip every location to its slot count; a location this type lacks is emptied.
    for (const key of ["head", "centerTorso", "leftTorso", "rightTorso", "leftArm", "rightArm", "leftLeg", "rightLeg", "centerLeg", "frontLeftLeg", "frontRightLeg"]) {
        this._criticals[key] = (this._criticals[key] ?? []).slice(0, this.getLocationSlotCount(key));
    }
}

    public getHeatSinksType() {
        return this._heatSinkType.tag;
    }

    public getHeatSinksObj() {
        return this._heatSinkType;
    }

    public setHeatSinksType(
        newValue: string,
    ) {

        // Canon first, then custom, then this browser's drafts: the first tier with a match wins.
        for( const tier of getComponentTiers("heatSink") ) {
            const matches = tier.filter( ( heatSink ) => matchesTag( heatSink, newValue ) );
            if( matches.length > 0 ) {
                this._heatSinkType = matches[ matches.length - 1 ];
                break;
            }
        }

        for( let localCount = this._criticalAllocationTable.length; localCount >= 0; localCount--) {
            if( this._criticalAllocationTable[localCount] && this._criticalAllocationTable[localCount].tag === "heat-sink" )
                this._criticalAllocationTable.splice(localCount, 1);
        }

        this._calc();

        return this._heatSinkType;
    }

    public getCurrentTonnage() {
        return this._currentTonnage;
    }

    /**
     * Heat sinks one critical slot holds. A superheavy slot holds what two standard slots would:
     * two single or four compact heat sinks; larger sinks cannot share (IO:AE p.157).
     */
    private _getHeatSinksPerSlot(): number {
        const perSlot = this._heatSinkType.perSlot ?? 1;
        const standardSlots = this._heatSinkType.crits[this.getHeatSinkTechBase()];
        return this.isSuperheavy() && standardSlots === 1 ? perSlot * 2 : perSlot;
    }

    public getHeatSinkCriticalRequirements() {

        return this._heatSinkCriticals;
    }

    public getArmorAllocation() {
        return this._armorAllocation;
    }

    public getRemainingTonnage() {

        return this._remainingTonnage;

    }

    public  getMoveHeat(): number {
        return +this._maxMoveHeat;
    }

    /** Heat of every installed item fired at once; an insulated laser makes 1 less (TO:AUE p.134). */
    public getWeaponHeat(): number {
        // Worked out when read: a moved critical can mate an insulator with a laser without a full recalculation.
        mateLaserInsulators(this._equipmentList);
        return this._equipmentList.reduce((sum, item) => sum + (item ? getMountedHeat(item) : 0), 0);
    }

    public getActiveWeaponHeat(
        equipmentList: IEquipmentItem[] |  null = null,
        quirksInPlay: boolean = false,
    ): number {
        if( equipmentList === null ) {
            equipmentList = this.equipmentList
        }
        const installedUuids = quirksInPlay ? this.getQuirkInstalledUuids(equipmentList) : [];
        let rv = 0;

        for( const eq of equipmentList) {
            // The weapon that took an opportunity shot this turn fired, targeted now or not (The Best of Future Wars p.17).
            const opportunityShot = !!eq.uuid && eq.uuid === this.futureWarsPlay.opportunityShot;
            if( eq.target || opportunityShot ) {
                // A weapon its Power Booster burned out cannot fire (The Best of Future Wars p.28).
                if( eq.uuid && this.isFutureWarsSystemBurnedOut(eq.uuid) ) continue;
                // Nor one a play ruleset forbids this turn: Strategic Movement, a morale status, a malfunction.
                if( !opportunityShot && this.getFutureWarsRulesetNoFire(eq.uuid) ) continue;
                // A malfunction that puts the weapon out of action, or adds heat (The Best of Future Wars p.29).
                const malfunction = eq.uuid ? this.getWeaponMalfunction(eq.uuid) : undefined;
                if( malfunction?.out ) continue;
                rv += malfunction?.heat ?? 0;
                // A cooling jacket quirk changes the weapon's heat when fired (CO pp.227, 234).
                rv += quirksInPlay && eq.uuid
                    ? getQuirkWeaponHeat(this.quirks, installedUuids, this.getQuirkPlayYear(), eq.uuid, getMountedHeat(eq))
                    : getMountedHeat(eq);
                // A boosted shot's extra heat (p.28).
                if( eq.uuid && this.isPowerBoosterOn(eq.uuid) ) rv += eq.conversion?.booster?.extraHeat ?? 0;
            }
        }
        return rv;
    }

    // --- The Best of Future Wars equipment in play (#172, Chunk C; src/utils/future-wars-play.ts).

    private _booster(uuid: string): IFutureWarsBoosterState | undefined {
        return this.futureWarsPlay.boosters?.[uuid];
    }

    /** The item `uuid` in the in-play list, if it is a Power Booster or a boosted weapon. */
    private _boosterItem(uuid: string): IEquipmentItem | undefined {
        return this.equipmentList.find((item) => item.uuid === uuid && item.conversion?.kind === "power-booster");
    }

    /** Turns in a row the booster will have been used if it is used this turn (1 for a first use). */
    public getPowerBoosterTurnInARow(uuid: string): number {
        const state = this._booster(uuid);
        if( !state ) return 1;
        return state.usedThisTurn ? state.turnInARow : state.turnInARow + 1;
    }

    /** "ready", "on" (boosted this turn), "used" (rolled this turn, no boost), "failed" or "burned-out". */
    public getPowerBoosterStatus(uuid: string): "ready" | "on" | "used" | "failed" | "burned-out" {
        const state = this._booster(uuid);
        if( state?.systemBurnedOut ) return "burned-out";
        if( state?.failed ) return "failed";
        if( state?.boostedThisTurn ) return "on";
        if( state?.usedThisTurn ) return "used";
        return "ready";
    }

    /**
     * Roll the Power Booster `uuid` for this turn with the players' 2D6 `roll` (p.28). Undefined when it cannot be used:
     * not a booster, already rolled this turn, failed or burned out.
     */
    public rollPowerBooster(uuid: string, roll: number): PowerBoosterResult | undefined {
        if( !this._boosterItem(uuid) || this.getPowerBoosterStatus(uuid) !== "ready" ) return undefined;
        const turnInARow = this.getPowerBoosterTurnInARow(uuid);
        const result = getPowerBoosterRoll(turnInARow, roll);
        this.futureWarsPlay.boosters = {
            ...this.futureWarsPlay.boosters,
            [uuid]: {
                turnInARow, usedThisTurn: true, boostedThisTurn: result === "boosted",
                ...(result !== "boosted" ? { failed: true } : {}),
                ...(result === "system-burned-out" ? { systemBurnedOut: true } : {}),
            },
        };
        return result;
    }

    /** The booster `uuid` boosts this turn. */
    public isPowerBoosterOn(uuid: string): boolean {
        return !!this._booster(uuid)?.boostedThisTurn;
    }

    /** The system the booster `uuid` drives is burned out: a weapon must be replaced, jets cannot jump, legs cannot run. */
    public isFutureWarsSystemBurnedOut(uuid: string): boolean {
        return !!this._booster(uuid)?.systemBurnedOut;
    }

    private _boosterOnFor(target: "running" | "jumping"): boolean {
        return this.equipmentList.some((item) => item.uuid && item.conversion?.booster?.target === target && this.isPowerBoosterOn(item.uuid));
    }

    /** False for running when a leg booster burned out its system, and for jumping when a jet booster did (p.28). */
    public canUseFutureWarsMovementMode(mode: string): boolean {
        const target = mode === "r" ? "running" : mode === "j" ? "jumping" : undefined;
        if( !target ) return true;
        return !this.equipmentList.some((item) => item.uuid && item.conversion?.booster?.target === target && this.isFutureWarsSystemBurnedOut(item.uuid));
    }

    /** The 'Mech's jump MP with its jump-jet booster on this turn: half again (p.28). */
    public getBoostedJumpMP(): number {
        return getBoostedJumpMP(this.getJumpSpeed());
    }

    /** Running MP this turn in play: +2 with a leg booster on (p.28). */
    public getPlayRunSpeed(): number {
        return this.getRunSpeed() + (this._boosterOnFor("running") ? 2 : 0);
    }

    /** Jumping MP this turn in play: half again with a jump-jet booster on (p.28). */
    public getPlayJumpSpeed(): number {
        return this._boosterOnFor("jumping") ? this.getBoostedJumpMP() : this.getJumpSpeed();
    }

    /** A Long Range Flamer hit on this 'Mech: it burns this turn and the next two. */
    public addLRFlamerHit(count: number = 1): void {
        this.futureWarsPlay.lrFlamerBurns = [...(this.futureWarsPlay.lrFlamerBurns ?? []), ...Array.from({ length: Math.max(0, count) }, () => 0)];
    }

    /** What the Long Range Flamer burns on this 'Mech do this turn. */
    public getLRFlamerBurnThisTurn(): { damage: number; heat: number } {
        return getLRFlamerBurn(this.futureWarsPlay.lrFlamerBurns ?? []);
    }

    /** An Inferno Gauss shell hit on this 'Mech: 5 more turns of 10 heat (p.11). */
    public addInfernoGaussHit(): void {
        this.futureWarsPlay.infernoGaussTurns = (this.futureWarsPlay.infernoGaussTurns ?? 0) + INFERNO_GAUSS_TURNS_PER_HIT;
    }

    /**
     * Heat this turn's heat phase adds from the fanzine rules: fires burning on the 'Mech (Long Range Flamer and Inferno
     * Gauss), at most 15 a turn as all heat from outside the 'Mech (TW p.159), plus Inferno shells that ignited aboard
     * (their own heat, outside that cap).
     */
    public getFutureWarsIncomingHeat(): number {
        const external = this.getLRFlamerBurnThisTurn().heat + ((this.futureWarsPlay.infernoGaussTurns ?? 0) > 0 ? INFERNO_GAUSS_HEAT_PER_TURN : 0);
        return Math.min(MAX_EXTERNAL_HEAT_PER_TURN, external) + (this.futureWarsPlay.pendingHeat ?? 0);
    }

    /** Built-in bursts left in the PDS `uuid` (50 to start). */
    public getPDSIntegralBurstsLeft(uuid: string): number {
        return Math.max(0, PDS_INTEGRAL_BURSTS - (this.futureWarsPlay.pdsBurstsUsed?.[uuid] ?? 0));
    }

    /** The PDS's extra magazines aboard: its own ammunition bins. */
    private _pdsMagazines(uuid: string): IEquipmentItem[] {
        const pds = this.equipmentList.find((item) => item.uuid === uuid && getFutureWarsPlayKind(item) === "pds");
        if( !pds ) return [];
        return this.equipmentList.filter((item) => item.isAmmo && (pds.ammoTypes ?? []).includes(item.tag));
    }

    /** All bursts the PDS `uuid` has left: its built-in ones and those in its extra magazines. */
    public getPDSBurstsLeft(uuid: string): number {
        return this.getPDSIntegralBurstsLeft(uuid) + this._pdsMagazines(uuid).reduce((sum, bin) => sum + this.getAmmoBinRemaining(bin), 0);
    }

    /** Spend one burst of the PDS `uuid` on a salvo, the built-in ones first, then a magazine's; false when none is left. */
    public usePDSBurst(uuid: string): boolean {
        if( this.getPDSIntegralBurstsLeft(uuid) > 0 ) {
            this.futureWarsPlay.pdsBurstsUsed = { ...this.futureWarsPlay.pdsBurstsUsed, [uuid]: (this.futureWarsPlay.pdsBurstsUsed?.[uuid] ?? 0) + 1 };
            return true;
        }
        const bin = this._pdsMagazines(uuid).find((item) => this.getAmmoBinRemaining(item) > 0);
        if( !bin ) return false;
        bin.currentAmmo = this.getAmmoBinRemaining(bin) - 1;
        return true;
    }

    /** The items aboard that have a Best of Future Wars play rule. */
    public getFutureWarsPlayItems(): IEquipmentItem[] {
        return this.equipmentList.filter((item) => getFutureWarsPlayKind(item) !== undefined);
    }

    /** Next turn: burns age, Inferno heat counts down, a booster not used this turn starts its count again. */
    private _advanceFutureWarsPlay(): void {
        const play = this.futureWarsPlay;
        if( play.lrFlamerBurns ) {
            const burns = play.lrFlamerBurns.map((age) => age + 1).filter((age) => age < LR_FLAMER_BURN_TURNS);
            if( burns.length ) play.lrFlamerBurns = burns; else delete play.lrFlamerBurns;
        }
        if( play.infernoGaussTurns ) {
            play.infernoGaussTurns = Math.max(0, play.infernoGaussTurns - 1);
            if( !play.infernoGaussTurns ) delete play.infernoGaussTurns;
        }
        if( play.boosters ) {
            for( const state of Object.values(play.boosters) ) {
                if( !state.usedThisTurn ) state.turnInARow = 0;
                state.usedThisTurn = false;
                state.boostedThisTurn = false;
            }
        }
        // The pilot who spent the turn unlatching the plate leaves the suit in the End Phase (Best-of p.15, rule 12).
        if( play.powerArmorExit === "unlatching" ) play.powerArmorExit = "out";
        delete play.boostedRunHexes;
        delete play.pendingHeat;
        delete play.strategicMovement;
        delete play.opportunityShot;
        const status = play.morale?.status;
        if( status ) {
            if( status.pending ) delete status.pending;
            else if( --status.turnsLeft <= 0 ) delete play.morale!.status;
        }
    }

    // --- The Best of Future Wars play-rule rulesets (#172, Chunk E; src/utils/future-wars-ruleset-tools.ts).

    public hasFutureWarsRuleset(id: string): boolean {
        return this.getRulesets().includes(id);
    }

    /** The play rulesets this 'Mech carries, in the order the panel shows them. */
    public getFutureWarsPlayRulesets(): string[] {
        return [FW_STRATEGIC_MOVEMENT, FW_OPPORTUNITY_FIRE, FW_MORALE, FW_WEAPON_MALFUNCTIONS, FW_LONG_RANGE_WARS].filter((id) => this.hasFutureWarsRuleset(id));
    }

    /** Strategic Movement's MP: walking and running doubled (pp.18-19). */
    public getStrategicMovementMP(): { walk: number; run: number } {
        return getStrategicMovementMP(this.getWalkSpeed(), this.getRunSpeed());
    }

    /** Strategic Movement this turn (null: none). Its heat takes the place of the movement heat. */
    public setStrategicMovement(mode: "w" | "r" | null, mp: number = 0): void {
        if( !mode ) { delete this.futureWarsPlay.strategicMovement; return; }
        const max = this.getStrategicMovementMP()[mode === "w" ? "walk" : "run"];
        this.futureWarsPlay.strategicMovement = { mode, mp: Math.max(0, Math.min(max, mp)) };
    }

    /** An opportunity shot by this weapon this turn (null: none): the other weapons fire at +1 later (p.17). */
    public recordOpportunityShot(uuid: string | null): void {
        if( uuid ) this.futureWarsPlay.opportunityShot = uuid; else delete this.futureWarsPlay.opportunityShot;
    }

    public getMoraleClassIndex(): number {
        return this.futureWarsPlay.morale?.classIndex ?? 2;
    }

    public setMoraleClassIndex(index: number): void {
        this.futureWarsPlay.morale = { ...this.futureWarsPlay.morale, classIndex: Math.max(0, Math.min(5, index)) };
    }

    /** The modifier on a results roll now: class, status and Carry On results, plus `other`. */
    public getMoraleModifier(other: number = 0): number {
        const morale = this.futureWarsPlay.morale;
        return getMechMoraleModifier(this.getMoraleClassIndex(), morale?.status?.kind, morale?.laterRollModifier ?? 0, other);
    }

    /**
     * A morale check: `check` (2D6) against the class's number; on a failure `resultRoll` (2D6) plus the modifiers is
     * read on the 'Mech results table and applied: a status in place of any earlier one, a drop on the morale scale, a
     * modifier on later rolls; routs are counted (two mean surrender).
     */
    public rollMorale(check: number, resultRoll: number, other: number): { passed: boolean; total?: number; result?: IMoraleResult } {
        if( isMoralePass(this.getMoraleClassIndex(), check) ) {
            this.futureWarsPlay.morale = { ...this.futureWarsPlay.morale, last: "Passed (" + check + ")" };
            return { passed: true };
        }
        const total = resultRoll + this.getMoraleModifier(other);
        const result = getMechMoraleResult(total);
        const morale: IFutureWarsMoraleState = { ...this.futureWarsPlay.morale, last: "Failed (" + check + "), " + total + ": " + result.text };
        if( result.status ) {
            morale.status = { kind: result.status, turnsLeft: result.turns ?? 1, pending: true, label: result.label, fire: result.fire };
            if( result.status === "routed" ) morale.routs = (morale.routs ?? 0) + 1;
        }
        if( result.scaleDrop ) morale.classIndex = Math.max(0, this.getMoraleClassIndex() - result.scaleDrop);
        if( result.laterRollModifier ) morale.laterRollModifier = (morale.laterRollModifier ?? 0) + result.laterRollModifier;
        this.futureWarsPlay.morale = morale;
        return { passed: false, total, result };
    }

    /** Two routs: the 'Mech surrenders (p.24). */
    public isMoraleSurrendered(): boolean {
        return (this.futureWarsPlay.morale?.routs ?? 0) >= 2;
    }

    private _malfunctionTable(uuid: string) {
        const weapon = this.equipmentList.find((item) => item.uuid === uuid);
        return weapon ? getMalfunctionTable(weapon) : undefined;
    }

    /** Records a malfunction roll on a weapon (a "No effect" roll records nothing); undefined for a weapon with no table (p.29). */
    public recordWeaponMalfunction(uuid: string, roll: number): IMalfunctionEffect | undefined {
        const table = this._malfunctionTable(uuid);
        if( !table ) return undefined;
        const effect = getMalfunctionEffect(table, roll);
        if( !effect.noEffect ) {
            this.futureWarsPlay.malfunctions = { ...this.futureWarsPlay.malfunctions, [uuid]: [...(this.futureWarsPlay.malfunctions?.[uuid] ?? []), roll] };
        }
        return effect;
    }

    /** A jam cleared or a repair made: drops one recorded roll. */
    public clearWeaponMalfunction(uuid: string, index: number): void {
        const rolls = (this.futureWarsPlay.malfunctions?.[uuid] ?? []).filter((_roll, at) => at !== index);
        const malfunctions = { ...this.futureWarsPlay.malfunctions };
        if( rolls.length ) malfunctions[uuid] = rolls; else delete malfunctions[uuid];
        if( Object.keys(malfunctions).length ) this.futureWarsPlay.malfunctions = malfunctions; else delete this.futureWarsPlay.malfunctions;
    }

    /** A weapon's recorded malfunctions together: to-hit and heat added up (ours: they stack), out if any puts it out of action. */
    public getWeaponMalfunction(uuid: string): { toHit: number; heat: number; out: boolean; effects: IMalfunctionEffect[] } | undefined {
        const rolls = this.futureWarsPlay.malfunctions?.[uuid];
        const table = rolls?.length ? this._malfunctionTable(uuid) : undefined;
        if( !rolls?.length || !table ) return undefined;
        const effects = rolls.map((roll) => getMalfunctionEffect(table, roll));
        return {
            toHit: effects.reduce((sum, effect) => sum + effect.toHit, 0),
            heat: effects.reduce((sum, effect) => sum + effect.heat, 0),
            out: effects.some((effect) => effect.out),
            effects,
        };
    }

    /**
     * Why a weapon may not fire under a play ruleset, or undefined: Strategic Movement, a morale status, its opportunity
     * shot already taken, or a malfunction.
     */
    public getFutureWarsRulesetNoFire(uuid: string | undefined): string | undefined {
        const play = this.futureWarsPlay;
        if( play.powerArmorExit === "out" ) return "The pilot has left the suit (Power Armor, The Best of Future Wars p.15).";
        if( play.powerArmorExit === "unlatching" ) return "No moving or firing while unlatching the front plate (Power Armor, The Best of Future Wars p.15).";
        if( play.strategicMovement ) return "No firing while using Strategic Movement (The Best of Future Wars p.18).";
        const status = play.morale?.status;
        if( status?.fire === "none" ) return "No firing while " + status.kind + " (morale, The Best of Future Wars p.24).";
        if( uuid && play.opportunityShot === uuid ) return "This weapon took its opportunity shot this turn (The Best of Future Wars p.17).";
        if( uuid && this.getWeaponMalfunction(uuid)?.out ) return "Out of action from a malfunction (The Best of Future Wars p.29).";
        return undefined;
    }

    // --- Power Armor in play (#172, Power Armor plan Chunk C; Best-of pp.14-15).

    /** Where the suit's pilot is in getting out: unlatching this turn, out of the suit, or undefined (inside). */
    public getPowerArmorExit(): "unlatching" | "out" | undefined {
        return this.futureWarsPlay.powerArmorExit;
    }

    /** "The pilot must unlatch a plate ... this process takes one full turn" (p.15, rule 12); a suit only. */
    public startPowerArmorExit(): void {
        if( this.usesPowerArmorConstruction() ) this.futureWarsPlay.powerArmorExit = "unlatching";
    }

    /** Called off before the End Phase: the pilot stays in. */
    public cancelPowerArmorExit(): void {
        delete this.futureWarsPlay.powerArmorExit;
    }

    /** The play rulesets' to-hit modifiers on a weapon that may fire, with labels. */
    public getFutureWarsRulesetToHit(uuid: string | undefined): { modifier: number; label: string }[] {
        const play = this.futureWarsPlay;
        const rv: { modifier: number; label: string }[] = [];
        if( play.opportunityShot && play.opportunityShot !== uuid ) rv.push({ modifier: 1, label: "Opportunity Fire" });
        const status = play.morale?.status;
        if( status && typeof status.fire === "number" && status.fire ) rv.push({ modifier: status.fire, label: "Morale: " + status.kind });
        const malfunction = uuid ? this.getWeaponMalfunction(uuid) : undefined;
        if( malfunction?.toHit ) rv.push({ modifier: malfunction.toHit, label: "Malfunction" });
        return rv;
    }

    public getTurnHeatDifference(
        equipmentList: IEquipmentItem[] |  null = null,
        quirksInPlay: boolean = false,
    ): number {
        if( equipmentList === null ) {
            equipmentList = this.equipmentList
        }
        // A quirk's change to the heat built up (Combat Computer) never takes generated heat below 0 (CO p.225).
        const quirkHeat = quirksInPlay ? getQuirkHeatGenerated(this.quirks, this.getQuirkInstalledUuids(equipmentList), this.getQuirkPlayYear()) : 0;
        const generated = Math.max(0, this.getActiveMoveHeat() + this.getActiveWeaponHeat(equipmentList, quirksInPlay) + quirkHeat)
            + this.getEngineHitHeat() + this.getFutureWarsIncomingHeat();

        return generated - this.getActiveHeatDissipation();
    }

    /**
     * Out of the game: head or center torso structure gone, a side torso gone with an XL engine, more than two engine
     * hits (as `isWreckedBlurb` has them), or the MechWarrior killed (6 wounds).
     */
    public isDestroyed(): boolean {
        return !this._locationHasStructure("hd") || !this._locationHasStructure("ct")
            || (this.hasXLEngine() && (!this._locationHasStructure("lt") || !this._locationHasStructure("rt")))
            || this.engineHits() > 2
            || this.pilot.wounds >= 6;
    }

    /** The items quirks may be attached to in play: those fitted now, an OmniMech's current pods included. */
    public getQuirkInstalledUuids(equipmentList: IEquipmentItem[] | null = null): string[] {
        return (equipmentList ?? this.equipmentList).map((item) => item?.uuid).filter((uuid): uuid is string => !!uuid);
    }

    /** The force's "Game year", set by `BattleMechForce.syncQuirkPlayYear`; not saved with the 'Mech. */
    public quirkPlayYear: number | null = null;

    /** The year play checks a quirk's dates against: the game's year, or without one the start of the unit's era. */
    public getQuirkPlayYear(): number {
        return this.quirkPlayYear ?? this._era.yearStart;
    }

    public applyHeat(quirksInPlay: boolean = false) {
        this.currentHeat += this.getTurnHeatDifference(null, quirksInPlay);

        if( this.currentHeat < 0 ) {
            this.currentHeat = 0;
        }
    }

    public getActiveMoveHeat(): number {
        // A jump pack generates no heat (Maximum Tech p.81; TO:AUE p.105).
        if( this._isJumpPackJump() ) return 0;
        // Strategic Movement's heat takes the place of the table's (The Best of Future Wars pp.18-19).
        const strategic = this.futureWarsPlay.strategicMovement;
        if( strategic ) return getStrategicMovementHeat(strategic.mode, strategic.mp, this.getWalkSpeed(), this.getRunSpeed());
        const heat = this._unboostedMoveHeat();
        // A Power Booster on: legs, 1 heat a hex run (the boosted run MP until the hexes are entered); jump jets, double
        // heat a hex (The Best of Future Wars p.28). The booster's heat takes the place of the standard table's (run 2,
        // jump 1 a hex, at least 3); what the engine or edition adds over that table (an XXL's) stays on top (ours).
        if( this.currentMovementMode === "r" && this._boosterOnFor("running") ) {
            return Math.max(0, heat + getBoostedRunHeat(this.futureWarsPlay.boostedRunHexes ?? this.getPlayRunSpeed()) - 2);
        }
        if( this.currentMovementMode === "j" && this._boosterOnFor("jumping") ) {
            const standard = Math.max(3, this.currentTargetJumpingMP);
            return Math.max(0, heat + getBoostedJumpHeat(this.currentTargetJumpingMP) - standard);
        }
        return heat;
    }

    /** Movement heat by the engine's and edition's tables, without a Power Booster. */
    private _unboostedMoveHeat(): number {
        // An earlier edition's own Heat Point Table (Battledroids: walking 0, running 1, jumping 1 a hex, BD p.12).
        const editionMoveHeat = getEditionPlayRules(this._rulesEdition)?.moveHeat;
        if( editionMoveHeat ) {
            if( this.currentMovementMode === "w" ) return editionMoveHeat.walk;
            if( this.currentMovementMode === "r" ) return editionMoveHeat.run;
            if( this.currentMovementMode === "j" ) return Math.max(editionMoveHeat.jumpMinimum, this.currentTargetJumpingMP * editionMoveHeat.jumpPerHex);
            return 0;
        }
        // Fuel cell and ICE IndustrialMechs make no heat walking or running (TW p.158); a non-fusion BattleMech does (TO:AUE p.120).
        const noWalkRunHeat = this.isIndustrialMech() && !this._hasFusionOrFissionEngine();
        // XXL engines: 2 standing still, 4 walking, 6 running, jumping heat doubled with at least 6 (TO:AUE p.121).
        // The custom Mini Engine heats the same way (#249).
        if( this.isXXLEngine() ) {
            if( this.currentMovementMode === "w" ) return 4;
            if( this.currentMovementMode === "r" ) return 6;
            if( this.currentMovementMode === "j" ) {
                const jumped = Math.max(0, this.currentTargetJumpingMP);
                // As getJumpHeat: improved jets count half their MP, rounded up, before the doubling.
                const heatMP = this._jumpJetType.tag === "improved" ? Math.ceil(jumped / 2) : jumped;
                return Math.max(6, heatMP * 2);
            }
            return 2;
        }
        // TODO check if heat sinks are broken
        if( this.currentMovementMode === "w" ) {
            return noWalkRunHeat ? 0 : 1;
        }
        if( this.currentMovementMode === "r" ) {
            return noWalkRunHeat ? 0 : 2;
        }
        if( this.currentMovementMode === "j" ) {
            if( this.currentTargetJumpingMP > 3 ) {
                return this.currentTargetJumpingMP
            }
            return 3;
        }
        return 0;
    }

    public getActiveHeatDissipation(): number {
        // TODO check if heat sinks are broken
        return this._heatDissipation;
    }

    public getHeatDissipation(): number {
        return this._heatDissipation;
    }

    /** Heat dissipated by equipment beside the heat sinks: prototype double heat sinks and Freezers, 2 each (IO:AE p.65). */
    public getEquipmentHeatDissipation(): number {
        return this._equipmentList.reduce((sum, item) => sum + (item?.heatDissipation ?? 0), 0);
    }

    public getHeatSummary(): number {
        // return  (10 + this._additionalHeatSinks) * this._heatSinkType.dissipation;
        return this.getMoveHeat() + this.getWeaponHeat() - this.getHeatDissipation()
    }

    public getWalkSpeed(): number {
        return this.getEffectiveWalkSpeed();
    }

    public getEffectiveWalkSpeed(): number {
        if (this.isQuadVee() && this._transformationMode === "vehicle") {
            return this.getQuadVeeVehicleCruiseMP();
        }

        const legLocations = this.isQuad() || this.isQuadVee()
            ? ["ll", "rl", "fll", "frl"]
            : ["ll", "rl"];
        const destroyedLegCount = legLocations.filter(location => this._structureInLocation(location) <= 0).length;
        const destroyedLegs = this.isTripod() ? Math.max(0, destroyedLegCount - 1) : destroyedLegCount;
        const legAdjustedSpeed = Math.floor(this._walkSpeed * Math.max(0, 1 - destroyedLegs * 0.25));
        // Medium and large shields each cost 1 walking MP (TO:AUE p.103).
        const shieldPenalty = this._countShields("medium") + this._countShields("large");
        return Math.max(0, legAdjustedSpeed - this._modularArmorMPPenalty() - shieldPenalty);
    }

    public setWalkSpeed(
        walkSpeed: number,
    ) {
        this._walkSpeed = walkSpeed
        // Engine rating = tonnage x Walk MP; Walk 0 clears the engine (setEngine(0) -> null).
        this.setEngine(this._engineRatingForWalk(this._walkSpeed));

        if( this._jumpSpeed > this._walkSpeed * this._jumpJetsPerMP())
            this.setJumpSpeed(this._walkSpeed * this._jumpJetsPerMP());

        return this._walkSpeed;
    }

    /**
     * The engine rating a Walking MP needs: tonnage x Walking MP. For a Primitive 'Mech that result
     * "must be multiplied by 1.2 and rounded up to the nearest available Engine Rating" (IO:AE p.117).
     */
    private _engineRatingForWalk(walkSpeed: number): number {
        const rating = this._tonnage * walkSpeed;
        return this._primitive ? Math.ceil(rating * 1.2 / 5 - 1e-9) * 5 : rating;
    }

    public getRunSpeed() {
        return Math.max(0, Math.ceil(this.getEffectiveWalkSpeed() * 1.5) - this._hardenedArmorRunPenalty());
    }

    /**
     * Hardened Armor costs a 'Mech 1 Running MP, unless patchwork armor leaves it off every leg
     * (TO:AUE pp.93, 189 note **). The Improved Jump Jet limit ignores it (TO:AUE p.93).
     */
    private _hardenedArmorRunPenalty(): number {
        // Combat Vehicles lose no MP to it, so neither does a QuadVee in vehicle mode.
        if (this.isQuadVee() && this._transformationMode === "vehicle") return 0;
        if (!this.isPatchworkArmor()) return this._armorType?.tag === "hardened" ? 1 : 0;
        return this.getPatchworkLocations()
            .some(location => location.key.endsWith("Leg") && this.getPatchworkArmorType(location.key)?.tag === "hardened") ? 1 : 0;
    }

    /** Running MP with MASC and/or a Supercharger engaged: walk x 2, or x 2.5 with both (TM p.225; TO:AUE p.157). */
    public getBoostedRunSpeed(walk: number = this.getEffectiveWalkSpeed()): number {
        const masc = this._equipmentList.some(item => item?.variableFormula === "masc-is" || item?.variableFormula === "masc-clan");
        const supercharger = this._equipmentList.some(item => item?.variableFormula === "supercharger");
        const run = masc && supercharger ? Math.ceil(walk * 2.5) : masc || supercharger ? walk * 2 : Math.ceil(walk * 1.5);
        return Math.max(0, run - this._hardenedArmorRunPenalty());
    }

    /**
     * Running MP for Battle Value, the most the 'Mech can legally generate: MASC and Superchargers count as engaged,
     * and Triple-Strength Myomer (not Industrial TSM) as active, 1 more Walking MP (TM pp.302-304, 316).
     */
    public getBVRunSpeed(): number {
        return this._withoutModularArmorMPPenalty(() => {
            const walk = this.getEffectiveWalkSpeed();
            return this.getBoostedRunSpeed(this.hasTripleStrengthMyomer() && walk > 0 ? walk + 1 : walk);
        });
    }

    /** Jumping MP for Battle Value: the better of jump jets and Mechanical Jump Boosters. */
    public getBVJumpSpeed(): number {
        return this._withoutModularArmorMPPenalty(() => Math.max(this.getJumpSpeed(), this.getMechanicalJumpBoosterSpeed()));
    }

    /** Set while Battle Value reads movement: "Modular Armor's speed penalty is not taken into account" (TO:AUE p.192). */
    private _ignoreModularArmorMPPenalty = false;

    private _withoutModularArmorMPPenalty<T>(read: () => T): T {
        const previous = this._ignoreModularArmorMPPenalty;
        this._ignoreModularArmorMPPenalty = true;
        try {
            return read();
        } finally {
            this._ignoreModularArmorMPPenalty = previous;
        }
    }

    /** Working Modular Armor costs 1 Walking/Cruising and Jumping MP (TO:AUE p.93). */
    private _modularArmorMPPenalty(): number {
        return !this._ignoreModularArmorMPPenalty && this.hasActiveModularArmor() ? 1 : 0;
    }

    /** Jump MP from jump jets: shields and modular armor reduce it; a partial wing adds to it (TO:AUE pp.103, 105). */
    public getJumpSpeed() {
        if (this._jumpJetType.underwater) return 0;
        return this._applyJumpModifiers(this._getJumpJetMP());
    }

    /**
     * Jump MP the jets give before modifiers: one per jet, or for a FrankenMech's lighter jets their weight over a
     * full-size jet's, dropping fractions (CO p.213: on a 60-ton 'Mech six half-ton jets give 3 MP).
     */
    private _getJumpJetMP(): number {
        if (!this.usesLighterJumpJets()) return this._jumpSpeed;
        return Math.floor(this._jumpSpeed * this._jumpJetWeightEach() / this._ownJumpJetWeightEach() + 1e-9);
    }

    /** Jump jets mounted. Each gives a Jumping MP, except a FrankenMech's lighter jets. */
    public getJumpJetCount(): number {
        return this._jumpSpeed;
    }

    /** Most jump jets worth mounting: as many as give the highest Jumping MP. */
    public getMaxJumpJetCount(): number {
        return this.getMaxJumpSpeed() * this._jumpJetsPerMP();
    }

    /** Jump jets that make one Jumping MP: 1, or 2 or 4 of a FrankenMech's lighter jets. */
    private _jumpJetsPerMP(): number {
        return this.usesLighterJumpJets() ? Math.round(this._ownJumpJetWeightEach() / this._jumpJetWeightEach()) : 1;
    }

    /**
     * Does this FrankenMech keep jump jets from a lighter 'Mech? "Smaller jump jets can be retained on larger 'Mechs,
     * but their performance is reduced" (CO p.213). Not offered for UMUs, which are not jump jets, nor for LAMs,
     * whose conversion needs its Jumping MP.
     */
    public usesLighterJumpJets(): boolean {
        return this._frankenMech && this._frankenMechJumpJetClass !== null
            && !this._jumpJetType.underwater && !this.isLAM() && !this.usesEarlierRulesEdition();
    }

    /** Underwater MP from UMUs (TO:AUE p.107); UMUs replace jump jets. */
    public getUMUSpeed(): number {
        if (!this._jumpJetType.underwater || this._countShields("large") > 0) return 0;
        return Math.max(0, this._jumpSpeed - this._modularArmorMPPenalty());
    }

    /** Jump MP from Mechanical Jump Boosters (TO:AUE p.105): the booster's rated MP, modified like jump jets. */
    public getMechanicalJumpBoosterSpeed(): number {
        const booster = this._equipmentList.find(item => item?.variableFormula === "jump-booster");
        return booster ? this._applyJumpModifiers(Math.max(1, booster.size ?? 1)) : 0;
    }

    private _applyJumpModifiers(baseMP: number): number {
        if (baseMP <= 0 || this._countShields("large") > 0) return 0;
        const mp = baseMP - this._modularArmorMPPenalty() - this._countShields("medium");
        return Math.max(0, mp > 0 ? mp + this.getPartialWingJumpBonus() : mp);
    }

    /** Shields mounted of one size (TO:AUE p.103). */
    private _countShields(size: "small" | "medium" | "large"): number {
        return this._equipmentList.filter(item => matchesTag(item, "shield-" + size)).length;
    }

    public hasPartialWing(): boolean {
        return this._equipmentList.some(item => item?.variableFormula === "partial-wing-is" || item?.variableFormula === "partial-wing-clan");
    }

    /** Partial wing jump bonus in a standard atmosphere: +2 up to 55 tons, +1 heavier (TO:AUE p.105). */
    public getPartialWingJumpBonus(): number {
        if (!this.hasPartialWing()) return 0;
        return this.getTonnage() <= 55 ? 2 : 1;
    }

    /** Partial wing heat capacity bonus in a standard atmosphere (TO:AUE p.105). */
    public getPartialWingHeatBonus(): number {
        return this.hasPartialWing() ? 3 : 0;
    }

    public setJumpSpeed(
        jumpSpeed: number,
    ) {
        const requestedSpeed = Math.max(0, +jumpSpeed);
        this._jumpSpeed = this.isLAM()
            ? Math.max(this._getLAMMinJumpMP(), requestedSpeed)
            : requestedSpeed;
        this._calc();
        return this._jumpSpeed;
    }

    public getArmorWeight() {
        return this._armorWeight;
    }

    public getArmorType() {
        return this._armorType.tag;
    }

    public getArmorObj() {
        return this._armorType;
    }

    public getArmorTechBase(): "is" | "clan" {
        const techTag = this.getTech().tag;
        if (techTag === "clan") return this._clanComponentTechBase("armor");
        if (techTag === "is") return "is";
        if (this._mixedTechBases.armor && this._armorType.armorMultiplier[this._mixedTechBases.armor] > 0) return this._mixedTechBases.armor;
        const preferredBase = techTag === "mclan" ? "clan" : "is";
        if (this._armorType.armorMultiplier[preferredBase] > 0) return preferredBase;
        return preferredBase === "clan" ? "is" : "clan";
    }

    public setArmorType(armorTag: string) {
        if (armorTag === "stealth") {
            armorTag = "stealth-basic";
        }
        if (this.isLAM() && !this._isLAMLegalComponent("armor", armorTag)) {
            return this._armorType;
        }
        // Canon first, then custom, then this browser's drafts: the first tier with an accepted match wins.
        for( const tier of getComponentTiers("armor") ) {
            let accepted = false;
            for( const armor of tier ) {
                if( matchesTag(armor, armorTag)) {
                    const techTag = this.getTech().tag;
                    const supportsTech = techTag === "mis" || techTag === "mclan"
                        ? armor.armorMultiplier.is > 0 || armor.armorMultiplier.clan > 0
                        : armor.armorMultiplier[techTag === "clan" ? "clan" : "is"] > 0;
                    if (armor.unitTypes.battlemech && armor.constructionStatus !== "deferred" && armor.constructionMode !== "equipment" && supportsTech
                        && this._isArmorLegalForChassis(armor)) {
                        if (armor.tag === BattleMech.PATCHWORK_ARMOR_TAG && !this.isPatchworkArmor()) {
                            this._patchworkArmor = {};
                        }
                        this._armorType = armor;
                        this._calc();
                        accepted = true;
                    }
                }
            }
            if( accepted ) break;
        }
        return this._armorType;
    }

    public setArmorCount( armorCount: number ) {

        // console.log("setArmorCount", armorCount)
        if( this.usesFractionalAccounting() ) {
            this.setFractionalArmorPoints(armorCount);
            return;
        }
        this._totalArmor = armorCount; // ;
        this._armorWeight = armorCount / 16

        // switch( this.getArmorType() ) {

        // default: // standard
        // _totalArmor = this._armorWeight * 16;
        // break;
        // }
        if( this.getArmorTechBase() === "clan" ) {
            // console.log("AW clan: ", this._totalArmor, this.getArmorObj().armorMultiplier.is, this._totalArmor / this.getArmorObj().armorMultiplier.clan, this.getArmorObj().name )
            this._armorWeight = this._totalArmor / this.getArmorObj().armorMultiplier.clan;
        } else {
            // console.log("AW is: ", this._totalArmor, this.getArmorObj().armorMultiplier.is, this._totalArmor / this.getArmorObj().armorMultiplier.is, this.getArmorObj().name )
            this._armorWeight = this._totalArmor / this.getArmorObj().armorMultiplier.is;

        }
        if( this._armorWeight % .5 !== 0  ) {
            // and odd weight, likely wasted armor
            // console.log("AW is an odd weight, likely wasted armor: ", this._armorWeight, this._totalArmor )
            this._armorWeight = Math.ceil(this._armorWeight*2)/2;
            if( this.getArmorTechBase() === "clan" ) {
                // this._totalArmor = this._armorWeight * this.getArmorObj().armorMultiplier.clan;
                this._maxArmor = this._armorWeight * this.getArmorObj().armorMultiplier.clan;
            } else {
                this._maxArmor = this._armorWeight * this.getArmorObj().armorMultiplier.is;
            }
            // console.log("Asjusted weight/max armor/current armor: ", this._armorWeight, this._maxArmor, this._totalArmor )
        }

    }

    public getTotalArmor() {
        return this._totalArmor;
    }

    public getUnallocatedArmor() {
        return this._unallocatedArmor;
    }

    public setArmorWeight(
        armorWeight: number,
    ) {
        this._armorWeight = armorWeight;
        if( this.usesFractionalAccounting() ) {
            this._fractionalArmorPoints = this._armorPointsForWeight(armorWeight);
        }
        this._calc();
        return this._armorWeight;
    }

    public usesFractionalAccounting(): boolean {
        return this._weightAccounting === "fractional";
    }

    /** Fractional Accounting is "experimental-level unit design" (TO:AUE p.188): Experimental rules and above. */
    public canUseFractionalAccounting(rulesLevel: number = 2): boolean {
        // A TO:AUE rule: no earlier rulebook has it.
        return rulesLevel >= EXPERIMENTAL_RULES_LEVEL && !this.usesEarlierRulesEdition();
    }

    /**
     * Turns the Fractional Accounting construction option on or off (TO:AUE p.188). It can be turned on
     * only at the Experimental rules level or above; it can always be turned off.
     *
     * Turning it on keeps the armor points already bought. Turning it off rounds the armor and every
     * ammunition bin back up to the half ton.
     */
    public setWeightAccounting(accounting: "standard" | "fractional", rulesLevel: number = 2): "standard" | "fractional" {
        if( accounting === this._weightAccounting ) return this._weightAccounting;
        if( accounting === "fractional" ) {
            if( !this.canUseFractionalAccounting(rulesLevel) ) return this._weightAccounting;
            const points = this._armorPointsForWeight(this._armorWeight);
            this._weightAccounting = "fractional";
            this._fractionalArmorPoints = points;
        } else {
            this._weightAccounting = "standard";
            this._armorWeight = Math.ceil(this._armorWeight * 2 - 1e-6) / 2;
            for( const item of this._equipmentList ) {
                // Battle armor ammunition stays by the kilogram whatever the accounting (Ghosts of Obeedah p.54).
                if( item && item.isAmmo && !item.battleArmorScale ) item.weight = Math.ceil(item.weight * 2 - 1e-6) / 2;
            }
        }
        this._calc();
        return this._weightAccounting;
    }

    /**
     * A unit "built or modified to carry battle armor equipment uses the Fractional Accounting construction
     * option by default" (Ghosts of Obeedah p.54). The book's own designs (the Cherub, p.81-83) are built with
     * standard rounding, so the option is turned on when the first such item is mounted and can be turned off
     * (user ruling, 2026-10-14).
     */
    public defaultsToFractionalAccounting(): boolean {
        return this._equipmentList.some(item => item && item.battleArmorScale === true);
    }

    // Mounting the first battle armor item turns the option on; the armor already bought is kept, by the point.
    private _adoptFractionalAccounting(): void {
        const hasBattleArmorEquipment = this.defaultsToFractionalAccounting();
        const adopt = hasBattleArmorEquipment && !this._hadBattleArmorEquipment && !this._importing && !this.usesFractionalAccounting();
        this._hadBattleArmorEquipment = hasBattleArmorEquipment;
        if( !adopt ) return;
        const points = this._armorPointsForWeight(this._armorWeight);
        this._weightAccounting = "fractional";
        this._fractionalArmorPoints = points;
    }

    /** Ammunition can be bought by the shot under Fractional Accounting, and battle armor ammunition always. */
    public canSetAmmoBinShots( bin: IEquipmentItem ): boolean {
        return !!bin.isAmmo && (this.usesFractionalAccounting() || bin.battleArmorScale === true);
    }

    /** Tons per point of the selected armor under Fractional Accounting (Fractional Armor Table, TO:AUE p.188). */
    public getFractionalArmorTonsPerPoint(): number {
        const techBase = this.getArmorTechBase() === "clan" ? "clan" : "is";
        return getFractionalArmorTonsPerPoint(this.getArmorType(), techBase, this.getArmorObj().armorMultiplier[techBase]);
    }

    /** Whole armor points a weight of the selected armor buys, never more than the chassis can carry. */
    private _armorPointsForWeight(weight: number): number {
        const techBase = this.getArmorTechBase() === "clan" ? "clan" : "is";
        const tonsPerPoint = this.usesFractionalAccounting()
            ? this.getFractionalArmorTonsPerPoint()
            : 1 / (this.getArmorObj().armorMultiplier[techBase] || 16);
        return Math.max(0, Math.min(this.getChassisMaxArmor(), Math.floor(weight / tonsPerPoint + 1e-6)));
    }

    public getFractionalArmorPoints(): number {
        return this._fractionalArmorPoints;
    }

    /** Fractional Accounting: buy armor by the point, "in any desired quantity" (TO:AUE p.188). */
    public setFractionalArmorPoints(points: number): number {
        if( !this.usesFractionalAccounting() ) return this._fractionalArmorPoints;
        this._fractionalArmorPoints = Math.max(0, Math.min(this.getChassisMaxArmor(), Math.floor(points) || 0));
        this._calc();
        return this._fractionalArmorPoints;
    }

    /** Shots in one full ton of a bin's ammunition, for the weapon it feeds. */
    public getAmmoBinShotsPerTon( bin: IEquipmentItem ): number {
        if( !bin.isAmmo ) return 0;
        const weapon = this.getAmmoBinWeapon(bin);
        return weapon ? getWeaponShotsPerTon(weapon, bin) : getAmmoRoundsPerTon(bin);
    }

    /**
     * Fractional Accounting: carry ammunition by the shot. A shot weighs a full-ton bin divided by its
     * number of shots, and a bin still takes one critical slot for a ton "or fraction thereof", so a bin
     * holds from one shot to a full ton (TO:AUE p.189).
     */
    public setAmmoBinShots( ammoUUID: string | undefined, shots: number ): number {
        const bin = this._equipmentList.find(eq => eq && eq.uuid === ammoUUID && eq.isAmmo);
        if( !bin || !this.canSetAmmoBinShots(bin) ) return 0;
        const shotsPerTon = this.getAmmoBinShotsPerTon(bin);
        if( !(shotsPerTon > 0) ) return 0;
        const wanted = Math.max(1, Math.min(shotsPerTon, Math.floor(shots) || 1));
        bin.weight = roundUpToKilogram(wanted / shotsPerTon);
        this._calc();
        return wanted;
    }

    public getEngine(): IEngineOption | null {
        return this._engine;
    }

    public setEngine(ratingNumber: number | string): any {
        // Explicit base-10 integer normalization to protect against string form inputs
        const parsedRating = typeof ratingNumber === "string" 
            ? Number.parseInt(ratingNumber, 10) 
            : Math.floor(ratingNumber);
        // A rating of 0 means "no engine": reset() and Walk MP 0 (the "-Select Walking Speed-" option) both land here
        if (parsedRating === 0) {
            this._engine = null;
            this._calc();
            return 0;
        }
        // Guard Clause: Exit immediately if the incoming data cannot resolve to a valid integer
        if (Number.isNaN(parsedRating) || parsedRating < 0) {
            console.error(`setEngine failed: '${ratingNumber}' is not a valid engine rating integer.`);
            return 0;
        }
        // Scan engine options array using the normalized, type-safe integer
        for (const engine of mechEngineOptions) {
            if (engine.rating === parsedRating) {
                this._engine = engine;
                this._calc();
                return this._engine;
            }
        }
        // No engine has this rating. 0 is how reset() and Walk MP 0 say "no engine", and any other
        // unmatched rating means the old engine no longer fits either, so don't keep it.
        this._engine = null;
        this._calc();
        return 0;
    }

    public getInternalStructureType() {
        return this._selectedInternalStructure.tag;
    }

    public getInternalStructure(): IResolvedInternalStructure {
        if (this.isQuad() || this.isQuadVee()) {
            this._internalStructure.leftArm = this._internalStructure.frontLeftLeg;
            this._internalStructure.rightArm = this._internalStructure.frontRightLeg;
        }
        return this._internalStructure;
    }

    public setInternalStructureType(
        isTag: string,
    ) {
        if (this.isLAM() && !this._isLAMLegalComponent("structure", isTag)) {
            return this._selectedInternalStructure;
        }
        for( const is of getComponentRecords("structure")) {
            if( matchesTag(is, isTag)) {
                this._selectedInternalStructure = is;
                this._calc();
                return this._selectedInternalStructure;
            }
        }

        return null;
    }

    /** The gyro as built: none on a 5-ton Power Armor suit, which keeps the chosen one for when the ruleset is unticked. */
    public getGyro() {
        if (this._isFiveTonPowerArmor()) return findByTag(mechGyroTypes, "none") ?? this._gyro;
        return this._gyro;
    }

    public getEra() {
        return this._era;
    }

    public getCriticals() {
        this._trimCriticals();
        return this._criticals;
    }

    public toggleCritical(
        location: string,
        critSlotIndex: number
    ) {
        location = this._normalizeLocation(location);

        if( typeof( this.criticalDamage ) === "undefined" ) {
            this.criticalDamage = {};
        }

        if( typeof( this.criticalDamage[location] ) === "undefined" ) {
            this.criticalDamage[location] = [];
        }

        const indexNumber = this.criticalDamage[location].indexOf( critSlotIndex );
        if( indexNumber === - 1 ) {
            this.criticalDamage[location].push( critSlotIndex );
            const targetProp = BattleMech.MECH_LOCATION_MAP[location];
            const critical = targetProp ? (this._criticals as any)[targetProp]?.[critSlotIndex] : null;
            if (critical?.uuid) {
                const modularArmor = this._equipmentList.find(item => item.uuid === critical.uuid && item.isModularArmor);
                if (modularArmor) {
                    modularArmor.currentAdditionalArmor = 0;
                }
            }
        } else {
            this.criticalDamage[location].splice( indexNumber, 1);
        }

        this._calc();
    }

    public isCriticalDamaged(
        location: string,
        critSlotIndex: number
    ): boolean  {
        location = this._normalizeLocation(location);
        if( typeof( this.criticalDamage[location] ) === "undefined" ) {
            this.criticalDamage[location] = [];
        }

        if( this.criticalDamage[location].indexOf( critSlotIndex ) === - 1 ) {
            return false
        } else {
            return true;
        }
    }

    public getUnallocatedCriticals() {
        return this._unallocatedCriticals;
    }

    public getRulesEdition(): string {
        return this._rulesEdition;
    }

    /** The printed droid the design was loaded from, if any (an id from battledroids-mechs.ts). */
    public getPrintedDroid(): string | undefined {
        return this._printedDroid;
    }

    public setPrintedDroid(id: string | undefined): void {
        this._printedDroid = id || undefined;
    }

    /** What the Heat Scale adds to the To-Hit Number at the current heat: +1 at 8, +2 at 13, +3 at 17, +4 at 24 (TW pp.158-160; BD p.13). */
    public getHeatToHitModifier(): number {
        const heat = this.currentHeat;
        return heat >= 24 ? 4 : heat >= 17 ? 3 : heat >= 13 ? 2 : heat >= 8 ? 1 : 0;
    }

    /**
     * Roll for a critical hit in a location by the rules of the design's edition, for an edition whose play rules
     * are entered (Battledroids, BD p.18: 7 or more on two dice is one critical hit; one die picks the line in the
     * head or a leg, a die for the group and a die for the line elsewhere; an empty line is rolled again). The
     * line hit is marked. `dice` supplies the players' rolls: the chance roll, then the dice for the line in order.
     */
    public rollEditionCriticalHit(location: string, dice: { chance?: number; lines?: number[] } = {}): string[] {
        const rules = this.getEditionPlayRules();
        if (!rules) {
            return [];
        }
        const die = () => 1 + Math.floor(Math.random() * 6);
        const chance = dice.chance ?? die() + die();
        if (chance < rules.criticalHitRoll) {
            return [`Critical hit roll ${chance}: no critical hit (${rules.criticalHitRoll} or more is needed).`];
        }
        const normalized = this._normalizeLocation(location);
        const slots: (ICriticalSlot | null | undefined)[] = (this._criticals as any)[BattleMech.MECH_LOCATION_MAP[normalized]] ?? [];
        const lines = [...(dice.lines ?? [])];
        const next = () => lines.shift() ?? die();
        const slotCount = this.getLocationSlotCount(normalized) || slots.length;
        const log = [`Critical hit roll ${chance}: a critical hit.`];
        for (let attempt = 0; attempt < 100; attempt++) {
            // Tables of six, as on the sheet (src/utils/critical-tables.ts); two for a canon 12-slot location.
            const roll = rollCriticalLine(slotCount, next);
            if (roll.tableRoll !== undefined && !roll.table) {
                log.push(`Table roll ${roll.tableRoll}: no table, rolled again.`);
                continue;
            }
            const label = roll.table ? `${roll.tableNumber}${roll.line}` : `${roll.line}`;
            const index = roll.index ?? -1;
            if (!slots[index]) {
                log.push(`Line ${label} is empty: rolled again.`);
                continue;
            }
            let named = index;
            while (named > 0 && slots[named]?.placeholder) named--;
            const name = slots[named]?.name ?? "that line";
            if (this.isCriticalDamaged(normalized, index)) {
                log.push(`Line ${label}, ${name}: already hit.`);
            } else {
                this.toggleCritical(normalized, index);
                log.push(`Line ${label}: ${name} is hit.`, ...this._onSlotHit(normalized, slots[named]));
            }
            return log;
        }
        log.push("This location has nothing to hit.");
        return log;
    }

    /** Front/Rear column of the 'Mech Hit Location Table (TW p.119); on a four-legged 'Mech the arms are its front legs. */
    private static readonly FRONT_REAR_HIT_LOCATIONS: Readonly<Record<number, string>> = {
        2: "ct", 3: "ra", 4: "ra", 5: "rl", 6: "rt", 7: "ct", 8: "lt", 9: "ll", 10: "la", 11: "la", 12: "hd",
    };

    /**
     * Modifier to rolls on the Determining Critical Hits Table: +2 against an IndustrialMech (TW p.124); against a
     * Primitive or RetroTech 'Mech, +2 for a BattleMech and +4 for an IndustrialMech (IO:AE p.114). The +4 is read as
     * replacing TW's +2, not adding to it.
     */
    public getCriticalHitRollModifier(): number {
        if (this._primitive) return this.isIndustrialMech() ? 4 : 2;
        return this.isIndustrialMech() ? 2 : 0;
    }

    /**
     * Roll on the Determining Critical Hits Table for a location (TW p.124), or by the edition's own rule when it has
     * one (see rollEditionCriticalHit). Under Clell Flint's construction rules a location is longer; its line is rolled
     * in tables of six (ours, src/utils/critical-tables.ts). 8-9 is one critical hit, 10-11 two, 12 three in a torso or the head or limb
     * blown off. An IndustrialMech's modified 13 counts as 12 and 14 or more is four hits in a torso or the head or limb
     * blown off (TW p.124; IO:AE p.114); a Primitive BattleMech's 13 or more counts as 12. Each hit rolls a line on
     * the location's table, rolling again on an empty line, a line that cannot take a critical hit (endo steel,
     * ferro-fibrous armor, CASE; TW p.124) or one already hit. `dice` supplies the players' rolls in order;
     * `extraModifier` is added to the chance roll (a fall, see rollIndustrialMechDamageCheck).
     */
    public rollCriticalHit(location: string, dice: { chance?: number; lines?: number[] } = {}, extraModifier: number = 0): string[] {
        if (this._isArmlessArm(this._normalizeLocation(location))) return [BattleMech.ARMLESS_HIT];
        if (this.getEditionPlayRules()) return this.rollEditionCriticalHit(location, dice);
        const die = () => 1 + Math.floor(Math.random() * 6);
        const roll = dice.chance ?? die() + die();
        const modifier = this.getCriticalHitRollModifier() + extraModifier;
        const result = roll + modifier;
        const normalized = this._normalizeLocation(location);
        const torso = ["ct", "lt", "rt"].includes(normalized);
        const log = [modifier ? `Critical hit roll ${roll} + ${modifier} = ${result}.` : `Critical hit roll ${roll}.`];
        let hits = 0;
        let blownOff = false;
        if (this.isIndustrialMech() && result >= 14) {
            if (torso) hits = 4;
            else blownOff = true;
        } else {
            const capped = Math.min(12, result);
            if (capped >= 12) {
                if (torso) hits = 3;
                else blownOff = true;
            } else {
                hits = capped >= 10 ? 2 : capped >= 8 ? 1 : 0;
            }
        }
        if (blownOff) {
            log.push(`${getLocationName(location, this._hasFrontLegs())} blown off.`);
            this._blowOffLocation(normalized);
            this._calc();
            return log;
        }
        if (hits === 0) {
            log.push("No critical hit.");
            return log;
        }
        log.push(hits === 1 ? "One critical hit." : `${hits} critical hits.`);
        const slots: (ICriticalSlot | null | undefined)[] = (this._criticals as any)[BattleMech.MECH_LOCATION_MAP[normalized]] ?? [];
        const slotCount = this.getLocationSlotCount(normalized) || slots.length;
        const lines = [...(dice.lines ?? [])];
        const next = () => lines.shift() ?? die();
        const hittable = (index: number) => !!slots[index] && !this.isCriticalDamaged(normalized, index) && !this._isRollAgainSlot(slots[index]!);
        for (let hit = 0; hit < hits; hit++) {
            const open = slots.map((_, index) => index).filter(hittable);
            if (open.length === 0) {
                log.push("No line left that can take a critical hit.");
                break;
            }
            for (let attempt = 0; attempt < 100; attempt++) {
                // Tables of six, as on the sheet (src/utils/critical-tables.ts); two for a canon 12-slot location.
                const roll = rollCriticalLine(slotCount, next);
                if (roll.index === null || !hittable(roll.index)) continue;
                const index = roll.index;
                let named = index;
                while (named > 0 && slots[named]?.placeholder) named--;
                this.toggleCritical(normalized, index);
                const label = roll.table ? `${roll.table.label}, ${roll.line}` : `${roll.line}`;
                log.push(`Line ${label}: ${slots[named]?.name ?? "that line"} is hit.`, ...this._onSlotHit(normalized, slots[named]));
                break;
            }
        }
        return log;
    }

    /**
     * An IndustrialMech's End Phase damage check, made once in a turn in which it fell or was the target of a successful
     * physical attack: a roll on the Determining Critical Hits Table, +1 for each level fallen above 1, at a location
     * rolled on the Front/Rear column of the 'Mech Hit Location Table (TW pp.68, 144). MegaMek adds every level fallen;
     * this follows the book.
     */
    public rollIndustrialMechDamageCheck(levelsFallen: number = 0, dice: { location?: number; chance?: number; lines?: number[] } = {}): string[] {
        if (!this.isIndustrialMech()) return [];
        const die = () => 1 + Math.floor(Math.random() * 6);
        const locationRoll = dice.location ?? die() + die();
        const location = BattleMech.FRONT_REAR_HIT_LOCATIONS[locationRoll];
        if (!location) return [];
        const fallModifier = Math.max(0, Math.floor(levelsFallen) - 1);
        return [
            `Location roll ${locationRoll}: ${getLocationName(location, this._hasFrontLegs())}.`,
            ...this.rollCriticalHit(location, dice, fallModifier),
        ];
    }

    /** A line that cannot take a critical hit: armor and structure slots, CASE (TW p.124; CASE II and CASE-P via MegaMek). */
    private _isRollAgainSlot(slot: ICriticalSlot): boolean {
        if (slot.rollAgain) return true;
        if (/^(clan-|is-)?case(-ii|-prototype)?$/.test(slot.tag)) return true;
        const armorTags = this.isPatchworkArmor()
            ? this.getPatchworkLocations().map(location => this.getPatchworkArmorType(location.key).tag)
            : [this._armorType.tag];
        return armorTags.includes(slot.tag) || slot.tag === this._selectedInternalStructure.tag;
    }

    /** What protects a location from an ammunition explosion: CASE II, else CASE or Clan CASE (TW p.134; TO:AUE p.111). */
    private _ammoExplosionProtection(location: string): AmmoExplosionProtection {
        const slots: (ICriticalSlot | null | undefined)[] = (this._criticals as any)[BattleMech.MECH_LOCATION_MAP[location]] ?? [];
        if (slots.some(slot => matchesTag(slot, "case-ii") || matchesTag(slot, "clan-case-ii"))) return "case-ii";
        return this.hasClanCASE() || slots.some(slot => matchesTag(slot, "case") || matchesTag(slot, "case-prototype")) ? "case" : "none";
    }

    /**
     * A rolled critical hit on a slot: explosive ammunition there explodes by the edition's rules (TW p.125; TO:AUE
     * p.111; CRB pp.96-97). The damage starts on the location's internal structure and transfers inward until a
     * location with CASE vents it; damage over the edition's cap may strip armor where it stops. Returns the log lines.
     */
    private _onSlotHit(location: string, slot: ICriticalSlot | null | undefined): string[] {
        const powerArmor = this.usesPowerArmorConstruction();
        // A Power Armor suit's pilot: a critical in the head kills, in the center torso 1D6 hits (Best-of p.15, rules
        // 9-10; #172). Ours: logged for the player to mark, as other pilot hits are.
        if (powerArmor && slot?.name === "Pilot") {
            if (location === "hd") return ["The pilot is killed (Power Armor, The Best of Future Wars p.15)."];
            if (location === "ct") {
                const hits = 1 + Math.floor(Math.random() * 6);
                return [`The pilot takes 1D6 = ${hits} hits: mark them on the Hits track (Power Armor, The Best of Future Wars p.15).`];
            }
        }
        // Liao Inferno Gauss shells burn rather than explode: 30 heat (20 with CASE) and 1 a shell (The Best of Future
        // Wars p.11). The shells are spent; there is no damage. An empty bin does not ignite, as spent ammunition does
        // not explode (TW p.125).
        const inferno = this._equipmentList.find(item => item.uuid === slot?.uuid && item.isAmmo && getFutureWarsPlayKind(item) === "inferno-gauss"
            && this.getAmmoBinRemaining(item) > 0);
        if (inferno) {
            const heat = getInfernoGaussAmmoCritHeat(this.getAmmoBinRemaining(inferno), this._ammoExplosionProtection(location) !== "none");
            inferno.currentAmmo = 0;
            // Added in this turn's heat phase with the rest of the turn's heat.
            this.futureWarsPlay.pendingHeat = (this.futureWarsPlay.pendingHeat ?? 0) + heat;
            return [`${inferno.name} ignites: ${heat} heat (The Best of Future Wars p.11).`];
        }
        const explosive = (uuid: string | undefined) => this._equipmentList.find(item => item.uuid === uuid && item.isAmmo && item.explosive);
        const bin = explosive(slot?.uuid);
        const rules = getAmmoExplosionRules(this._rulesEdition, "mech");
        if (!bin || rules?.heatOnly) return [];
        // Every bin in the location explodes from BT2 to BT4 (BT2 p.25, BT4 p.24).
        const slots: (ICriticalSlot | null | undefined)[] = (this._criticals as any)[BattleMech.MECH_LOCATION_MAP[location]] ?? [];
        const bins = rules?.scope === "location" ? [...new Set(slots.map(item => explosive(item?.uuid)).filter(item => item !== undefined))] : [bin];
        const protection = this._ammoExplosionProtection(location);
        const explosion = getAmmoExplosion(this._rulesEdition, "mech", bins, item => this.getAmmoBinWeapon(item) ?? undefined, item => this.getAmmoBinRemaining(item), protection);
        if (!explosion?.baseDamage) return [];
        for (const item of bins) item.currentAmmo = 0;
        const vents = (at: string) => this._ammoExplosionProtection(at) !== "none";
        const centerTorsoLost = () => Array.from({ length: 40 }, (_, index) => this.structureDamaged("ct", index)).filter(Boolean).length;
        const centerTorsoBefore = centerTorsoLost();
        this.takeDamage(explosion.damage, location, false, { structureOnly: true, ventAt: vents });
        // A suit's pilot takes 1 hit, or is killed when the blast reaches the center torso: "the blast came from INSIDE
        // the armor" (Best-of p.15, rule 11; #172).
        const pilotLog = !powerArmor ? explosion.log
            : location === "ct" || centerTorsoLost() > centerTorsoBefore
                ? ["The explosion reaches the center torso: the pilot is killed (Power Armor, The Best of Future Wars p.15)."]
                : ["The pilot takes 1 hit (Power Armor, The Best of Future Wars p.15)."];
        let at = location;
        while (!this._locationHasStructure(at) && !vents(at) && at !== "ct" && at !== "hd") at = this._moveDamageLocationIn(at, false);
        const excess = explosion.baseDamage - explosion.damage;
        const toArmor = explosion.rules.excessToArmor?.[protection];
        if (excess > 0 && toArmor !== undefined && this._locationHasStructure(at)) {
            const torso = ["ct", "lt", "rt"].includes(at);
            const original: number = (this._armorAllocation as any)[BattleMech.MECH_LOCATION_MAP[at]] ?? 0;
            const points = toArmor === "all" ? Infinity : toArmor === "half" ? (torso ? excess : Math.ceil(original / 2)) : Math.min(excess, toArmor);
            this._takeArmorDamageAtLocation(torso ? at + "r" : at, points);
            this._calc();
        }
        const vented = protection === "none" ? [] : [`${protection === "case" ? "CASE" : "CASE II"} vents the rest.`];
        return [`${bins.map(item => item.name).join(", ")} explode${bins.length > 1 ? "" : "s"} for ${explosion.baseDamage} damage.`, ...vented, ...pilotLog];
    }

    /** A head or limb blown off: its armor and internal structure are gone. */
    private _blowOffLocation(location: string): void {
        const key = BattleMech.MECH_LOCATION_MAP[location];
        for (const bubbles of [(this._armorBubbles as any)[key], (this._structureBubbles as any)[key]]) {
            if (Array.isArray(bubbles)) bubbles.fill(false);
        }
    }

    /** The play rules of the design's edition where they differ from Total Warfare's; undefined when they do not. */
    public getEditionPlayRules() {
        return getEditionPlayRules(this._rulesEdition);
    }

    /** True when the design is built under an edition before Total Warfare, whose lists and stats come from that edition's rulebook. */
    public usesEarlierRulesEdition(): boolean {
        return isEarlierRulesEdition(this._rulesEdition);
    }

    /**
     * Do the rules of the design's edition include this record (a component type, tonnage, chassis type or item)?
     * With a rules level, records the edition allows only at the Apocryphal level count from that level up.
     */
    public isInRulesEdition(record: Parameters<typeof isInRulesEdition>[0], rulesLevel?: number): boolean {
        return isInRulesEdition(record, this._rulesEdition, rulesLevel);
    }

    /**
     * Is the record offered in the design's rules edition at this rules level? A record with no rules level is
     * Standard, as equipment is (getEquipmentRulesLevel).
     */
    public isOfferedInEdition(record: Parameters<typeof isOfferedInEdition>[0], rulesLevel: number): boolean {
        return isOfferedInEdition({ ...record, rulesLevel: record.rulesLevel ?? STANDARD_RULES_LEVEL }, this._rulesEdition, rulesLevel);
    }

    /**
     * Build the design under another rules edition. Mounted equipment takes the new edition's weight, heat,
     * damage, ranges, critical slots and price wherever it still held the old edition's; nothing is removed.
     * getRulesEditionIssues() lists what the new edition does not include. An unknown tag is ignored.
     */
    /** The design as it stands, for telling whether it changed: no ids, timestamps, way back or game settings (#324). */
    private _editionState(): string {
        const saved = this.export() as unknown as Record<string, unknown>;
        return JSON.stringify({ ...saved, uuid: undefined, lastUpdated: undefined, rulesEditionReturn: undefined, rulesLevel: undefined, rulesets: undefined });
    }

    /**
     * The edition the design last left, kept with the switch. Call again after anything that finishes the switch
     * (the creator's tonnage clamp), so that is not taken for a change.
     */
    public settleRulesEditionSwitch(): void {
        if (this._rulesEditionReturn) {
            this._rulesEditionReturn.left = this._editionState();
        }
    }

    /**
     * Change the rules edition; the edition decides. Equipment takes its stats, rules it lacks are dropped and the
     * design conformed. Going back to the edition the design just left, with nothing changed since, brings back the
     * design it had there exactly (a Battledroids droid's Jumping MP above its Walking MP, which Total Warfare caps).
     */
    public setRulesEdition(editionTag: string): string {
        const edition = getRulesEdition(editionTag);
        if (edition.tag !== editionTag || edition.tag === this._rulesEdition) {
            return this._rulesEdition;
        }
        const back = this._rulesEditionReturn;
        if (back && back.edition === edition.tag && back.left === this._editionState()) {
            this.reset();
            this.importJSON(back.design);
            this._rulesEditionReturn = undefined;
            return this._rulesEdition;
        }
        const leaving: IRulesEditionReturn = {
            edition: this._rulesEdition,
            design: JSON.stringify({ ...this.export(), rulesEditionReturn: undefined }),
            left: "",
        };
        const previous = this._rulesEdition;
        this._rulesEdition = edition.tag;
        const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
        const restat = (item: IEquipmentItem | null | undefined): void => {
            const record = item ? findUnitCatalogRecord("mis", item.tag) : undefined;
            if (!item || !record) {
                return;
            }
            const [before, after] = [getEquipmentForEdition(record, previous), getEquipmentForEdition(record, edition.tag)];
            for (const field of ["weight", "heat", "damage", "range", "space", "cbills", "book", "page"] as const) {
                if (same(item[field], before[field])) {
                    (item as unknown as Record<string, unknown>)[field] = JSON.parse(JSON.stringify(after[field] ?? null)) ?? undefined;
                }
            }
        };
        this._equipmentList.forEach(restat);
        // FrankenMechs are a Campaign Operations rule, which no earlier edition has.
        if (this.usesEarlierRulesEdition()) {
            this._frankenMech = false;
            this._frankenMechDonors = {};
            this._frankenMechJumpJetClass = null;
            // Primitive 'Mechs (IO:AE) and Fractional Accounting (TO:AUE) came later too.
            if (this._primitive) this.setPrimitive(false);
            if (this.usesFractionalAccounting()) this.setWeightAccounting("standard");
        }
        // The technology base must be one the edition has: Clan falls back to Inner Sphere, Mixed to its base.
        const techTags = this.getAvailableTechOptions().map((option) => option.tag);
        if (!techTags.includes(this._tech.tag)) {
            const base = this._tech.tag === "mclan" && techTags.includes("clan") ? "clan" : "is";
            this.setTech(base);
        }
        // The structure boxes are the edition's as well; setTonnage recalculates everything after them.
        this.setTonnage(this._tonnage);
        this._rulesEditionReturn = leaving;
        this.settleRulesEditionSwitch();
        return this._rulesEdition;
    }

    /** Technology bases the design's rules edition builds with (see `getEditionTechBases`). */
    public getAvailableTechOptions(): typeof btTechOptions {
        const tags = getEditionTechBases(this._rulesEdition);
        return btTechOptions.filter((option) => tags.includes(option.tag));
    }

    /** The design's own rules level, or `fallback` (the app-wide level) for a save from before designs kept one. */
    public getRulesLevel(fallback: number): number {
        return this._rulesLevel ?? fallback;
    }

    public getRulesets(): string[] {
        return [...this._rulesets];
    }

    /** The shared settings block's values for this design (#324). */
    public getGameSettings(fallbackLevel: number): IGameSettings {
        return {
            rulesets: this.getRulesets(),
            edition: this._rulesEdition,
            rulesLevel: this.getRulesLevel(fallbackLevel),
            techBase: this._tech.tag,
            era: this._era.tag,
        };
    }

    /**
     * Applies the settings block's values: edition, then tech base, then era. The level and rulesets go last, since
     * going back to the edition the design just left re-imports the save it had there.
     */
    public applyGameSettings(settings: IGameSettings): void {
        const futureWarsBefore = this.usesFutureWarsConstruction();
        const powerArmorBefore = this.usesPowerArmorConstruction();
        this._applyGameSettings(settings);
        // Ticking or unticking Flint's construction rules or Power Armor changes the structure and every location's slots.
        if (this.usesFutureWarsConstruction() !== futureWarsBefore || this.usesPowerArmorConstruction() !== powerArmorBefore) {
            this.setTonnage(this._tonnage);
        }
    }

    private _applyGameSettings(settings: IGameSettings): void {
        if (settings.edition !== this._rulesEdition) {
            const back = this._rulesEditionReturn;
            const awayLevel = this._rulesLevel;
            this.setRulesEdition(settings.edition);
            if (back && !this._rulesEditionReturn) {
                // Went back: the restored design wins, its tech base, era and level too, unless a level was picked
                // while away. The block's moves on the way out no longer apply.
                if (back.arrivalLevel !== awayLevel) this._rulesLevel = settings.rulesLevel;
                this._rulesets = [...settings.rulesets];
                return;
            }
            if (this._rulesEditionReturn) this._rulesEditionReturn.arrivalLevel = settings.rulesLevel;
        }
        if (settings.techBase !== this._tech.tag) this.setTech(settings.techBase);
        if (settings.era !== this._era.tag) this.setEra(settings.era);
        this._rulesLevel = settings.rulesLevel;
        this._rulesets = [...settings.rulesets];
    }

    /**
     * Construction rules of the design's edition that it breaks, one line each: today the least ammunition its
     * weapons must carry (a ton for each launcher or ballistic weapon in Battledroids, BD p.25). Weapons that
     * share ammunition are counted together. Always empty for Total Warfare and later editions.
     */
    public getRulesEditionRuleIssues(): string[] {
        const rule = this.usesEarlierRulesEdition() ? getRulesEdition(this._rulesEdition).ammoTonsFor : undefined;
        if (!rule) {
            return [];
        }
        const familiesByTag = new Map<string, string[]>();
        const groups = new Map<string, { names: Set<string>; weapons: number; families: string[] }>();
        for (const item of this._equipmentList) {
            if (!item || item.isAmmo) {
                continue;
            }
            if (!familiesByTag.has(item.tag)) {
                familiesByTag.set(item.tag, [...getWeaponAmmoFamilies(item)].sort());
            }
            const families = familiesByTag.get(item.tag)!;
            if (families.length === 0) {
                continue;
            }
            const group = groups.get(families.join("|")) ?? { names: new Set<string>(), weapons: 0, families };
            group.names.add(item.name);
            group.weapons++;
            groups.set(families.join("|"), group);
        }
        const issues: string[] = [];
        for (const group of groups.values()) {
            const carried = this._equipmentList.reduce((tons, item) => tons + (item?.isAmmo && group.families.includes(getAmmoFamily(item)) ? item.weight : 0), 0);
            const needed = rule === "launcher" ? group.weapons : 1;
            if (carried < needed) {
                issues.push(`Ammunition for ${Array.from(group.names).join(", ")}: at least ${needed} ${needed === 1 ? "ton" : "tons"}${rule === "launcher" ? " (1 for each weapon)" : ""}, ${carried} carried`);
            }
        }
        return issues;
    }

    /**
     * What the design uses that its rules edition does not include, one line each, naming the edition. Level
     * issues are reported by the rules-level warnings, not here.
     */
    public getRulesEditionIssues(rulesLevel?: number): string[] {
        const issues: string[] = [];
        const check = (kind: string, record: { name?: string; introducedInEdition?: string; editionStats?: IEquipmentItem["editionStats"] } | undefined, name?: string): void => {
            if (record && getRecordOfferIssue(record, this._rulesEdition, rulesLevel ?? 0) === "edition") {
                issues.push(`${kind}: ${name ?? record.name} (not in ${getRulesEdition(this._rulesEdition).name})`);
            }
        };
        if (!this.getAvailableTechOptions().some((option) => option.tag === this._tech.tag)) {
            issues.push(`Technology base: ${this._tech.name}`);
        }
        check("Chassis type", this._mechType);
        check("Tonnage", btMechTonnages.find(option => option.tons === this._tonnage) ?? {}, `${this._tonnage} tons`);
        check("Engine", this._engineType);
        if (this.usesEarlierRulesEdition() && this.isNonFusionBattleMech() && (rulesLevel ?? 0) < CUSTOM_HOMEBREW_RULES_LEVEL
            && getRecordOfferIssue(this._engineType, this._rulesEdition, rulesLevel ?? 0) !== "edition") {
            issues.push(`Engine: ${this._engineType.name} (vehicles only in ${getRulesEdition(this._rulesEdition).name})`);
        }
        check("Gyro", this._gyro);
        check("Cockpit", this.getCockpitType());
        if (this.hasCommandConsole()) check("Command Console", getCockpitType("command-console"));
        if (this.hasEnhancedImaging()) check("Enhanced Imaging", getCockpitType("enhanced-imaging-interface"));
        if (this.isArmless()) check("Chassis option", armlessMechOption);
        if (this.getJumpPackTons() > 0) check("Jump pack", mechJumpPack);
        check("Internal structure", this._selectedInternalStructure);
        check("Armor", this.getArmorObj());
        check("Heat sinks", this._heatSinkType);
        if (this._jumpSpeed > 0) check("Jump jets", this._jumpJetType);
        if (this._myomerType.tag !== "standard") check("Myomer", this._myomerType);
        const listed = new Set<string>();
        for (const item of this._equipmentList) {
            // Equipment is judged as the pickers judge it, so offered Custom Homebrew items are not flagged.
            if (item && !listed.has(item.tag)) {
                listed.add(item.tag);
                if (getEquipmentOfferIssue(item, this._rulesEdition, rulesLevel ?? 0) === "edition") {
                    issues.push(`Equipment: ${item.name} (not in ${getRulesEdition(this._rulesEdition).name})`);
                }
            }
        }
        issues.push(...getQuirkIssues(this.quirks.getAll(), this.getQuirkUnitType(), this._rulesEdition, rulesLevel ?? 0, "edition"));
        return issues;
    }

    public setEra(
        eraTag: string,
    ) {

        const era = findEraByTag(eraTag);
        if( !era ) {
            return null;
        }
        // An era the tech base cannot design in (e.g. a Clan-only era on an Inner Sphere 'Mech)
        // becomes the nearest one it can.
        this._era = getClosestEraForTech(era, this._tech.tag);
        this._calc();
        return this._era;
    }

    /** The eras this 'Mech's tech base can be designed in. */
    public getAvailableEras() {
        return getErasForTech(this._tech.tag);
    }

    public getTech() {
        return this._tech;
    }

    public setTech(
        techTag: string,
    ) {
        for( const technology of btTechOptions ) {
            if( matchesTag(technology, techTag)) {
                this._tech = technology;
                this._engineTechBase = technology.tag === "clan" || technology.tag === "mclan" ? "clan" : "is";
                this._mixedTechBases = {};
                // Clan-only eras are closed to the Inner Sphere, and Mixed Tech starts at the Clan Invasion.
                this._era = getClosestEraForTech(this._era, technology.tag);
                this._calc();

                return this._tech;
            }
        }
        return null;
    }

    public getMechType() {
        return this._mechType;
    }

    public getAlphaStrikeForceStats() {
        return this.calcAlphaStrike();
    }

    /**
     * Tag of the selected special ammunition. A design saved before a munition was re-tagged stores
     * the old tag, which the record keeps as an alias: the mounted round's current tag is returned.
     */
    public getAlphaStrikeSpecialAmmoTag(): string {
        const stored = this._alphaStrikeSpecialAmmoTag;
        if (!stored) return stored;
        const mounted = this.getAlphaStrikeSpecialAmmoOptions().find(ammo => equipmentMatchesIdentifier(ammo, stored));
        return mounted?.tag ?? stored;
    }

    public getAlphaStrikeSpecialAmmoOptions(): IEquipmentItem[] {
        const availableAmmo = new Map<string, IEquipmentItem>();
        for (const equipment of this._equipmentList) {
            if (equipment.isAmmo && equipment.isSpecialAmmo) {
                availableAmmo.set(equipment.tag, equipment);
            }
        }
        return Array.from(availableAmmo.values());
    }

    public setAlphaStrikeSpecialAmmoTag(ammoTag: string): string {
        const options = this.getAlphaStrikeSpecialAmmoOptions();
        const selectedAmmo = options.find(ammo => ammo.tag === ammoTag)
            ?? options.find(ammo => equipmentMatchesIdentifier(ammo, ammoTag));
        this._alphaStrikeSpecialAmmoTag = selectedAmmo?.tag ?? "";
        return this._alphaStrikeSpecialAmmoTag;
    }

    public getPilot() {
        return this._pilot;
    }

    public setPilotName(
        newValue: string,
    ) {
        this._pilot.name = newValue;
    }

    public setPilotPiloting(
        newValue: number,
    ) {
        this._pilot.piloting = newValue;
        this._calcBattleValue();
    }

    public setPilotGunnery(
        newValue: number,
    ) {
        this._pilot.gunnery = newValue;
        this._calcBattleValue();
    }

    public setPilotEIImplants(
        newValue: boolean,
    ) {
        this._pilot.eiImplants = newValue;
        this._calcBattleValue();
    }

    public setEngineType(
        engineTag: string,
    ) {
        if (this.isLAM() && !this._isLAMLegalComponent("engine", engineTag.toLowerCase())) {
            return this._engineType;
        }
        for( const engine of getComponentRecords("engine")) {
            if( matchesTag(engine, engineTag.toLowerCase())) {
                this._engineType = engine;
                this._calc();
                return this._engineType;
            }
        }
        // default to Military Standard if tag not found.
        this._engineType = mechEngineTypes[0];
        return this._engineType;
    }

    public setGyroTypeByName(
        gyroName: string,
    ) {
        for( const gyro of mechGyroTypes) {
            if(
                gyroName.toLowerCase().trim() === gyro.name.toLowerCase().trim()
                ||
                (
                    gyro.alternateName &&
                    gyroName.toLowerCase().trim() === gyro.alternateName.toLowerCase().trim()
                )

            ) {
                this._gyro = gyro;
                this._calc();
                return this._gyro;
            }
        }
        // default to the Standard gyro if the name is not found.
        this._gyro = mechGyroTypes[0];
        this._calc();
        return this._gyro;
    }
    public setEngineTypeByName(
        engineName: string,
    ) {
        for( const engine of mechEngineTypes) {
            if(
                engineName.toLowerCase().trim() === engine.name.toLowerCase().trim()
                ||
                (
                    engine.alternateName &&
                    engineName.toLowerCase().trim() === engine.alternateName.toLowerCase().trim()
                )

            ) {
                this._engineType = engine;
                this._calc();
                return this._engineType;
            }
        }
        // default to Military Standard if tag not found.
        this._engineType = mechEngineTypes[0];
        return this._engineType;
    }

    setGyroType(
        gyroType: string,
    ) {
        if (this.isLAM() && !this._isLAMLegalGyro(gyroType.toLowerCase())) {
            gyroType = "standard";
        }
        for( const gyro of getComponentRecords("gyro")) {
            if( matchesTag(gyro, gyroType.toLowerCase())) {
                this._gyro = gyro;
                this._calc();
                return this._gyro;
            }
        }
        // default to Military Standard if tag not found.
        this._gyro = mechGyroTypes[0];
        return this._gyro;
    }

    getEngineType() {
        return this._engineType;
    }

    public getEngineTechBase(): "is" | "clan" {
        if (this._tech.tag === "clan") {
            return "clan";
        }
        if (this._tech.tag === "is") {
            return "is";
        }
        return this._engineTechBase;
    }

    public setEngineTechBase(techBase: "is" | "clan"): "is" | "clan" {
        if (this._tech.tag === "mis" || this._tech.tag === "mclan") {
            this._engineTechBase = techBase;
            if (!this._engineType.criticals[techBase]) {
                this._engineType = mechEngineTypes[0];
            }
            this._calc();
        }
        return this.getEngineTechBase();
    }

    /** Whose structure slots the 'Mech uses: a Clan 'Mech's, unless the structure is the Star League version. */
    public getStructureTechBase(): "is" | "clan" {
        if (this._isMixedTechBase()) return this._mixedTechBases.structure ?? "is";
        if (this.getTech().tag === "clan") return this._clanComponentTechBase("structure");
        return this._defaultStructureTechBase(this._selectedInternalStructure);
    }

    /** Whose heat sink slots the 'Mech uses (Clan double heat sinks take 2, the Inner Sphere's 3). */
    public getHeatSinkTechBase(): "is" | "clan" {
        if (this._isMixedTechBase()) return this._mixedTechBases.heatSink ?? "is";
        return this.getTech().tag === "clan" ? this._clanComponentTechBase("heatSink") : "is";
    }

    /**
     * The versions of its structure, armor or heat sinks a 'Mech may mount: either on Mixed Tech; on a Clan 'Mech,
     * the Star League version beside the Clan one while the era holds both production windows (#168).
     */
    public getComponentTechBases(component: "structure" | "armor" | "heatSink"): ("is" | "clan")[] {
        const item = component === "structure" ? this._selectedInternalStructure : component === "armor" ? this._armorType : this._heatSinkType;
        // Versions that are the same in slots and armor factor are no choice at all.
        const armor = this._armorType.armorMultiplier;
        const versionsDiffer = item.crits.is !== item.crits.clan
            || (component === "armor" && armor.is > 0 && armor.clan > 0 && armor.is !== armor.clan);
        if (this._isMixedTechBase()) return versionsDiffer ? ["is", "clan"] : [this._mixedTechBases[component] ?? "is"];
        if (this.getTech().tag !== "clan") return ["is"];
        if (component === "armor" && !(armor.is > 0)) return ["clan"];
        if (!versionsDiffer) return ["clan"];
        if (this._usesStarLeagueVersion(item)) return ["is"];
        return this._starLeagueVersionInEra(item) ? ["clan", "is"] : ["clan"];
    }

    /** A Clan 'Mech's chosen version of a component, if the era still offers it, else its own default. */
    private _clanComponentTechBase(component: "structure" | "armor" | "heatSink"): "is" | "clan" {
        const choices = this.getComponentTechBases(component);
        const chosen = this._mixedTechBases[component];
        return chosen && choices.includes(chosen) ? chosen : choices[0];
    }

    /** On a Mixed Tech 'Mech: the Inner Sphere or Clan version of its structure, armor or heat sinks; on a Clan 'Mech, any version the era offers. */
    private _setMixedTechBase(component: "structure" | "armor" | "heatSink", techBase: "is" | "clan") {
        if (this._isMixedTechBase() || (this.getTech().tag === "clan" && this.getComponentTechBases(component).includes(techBase))) {
            this._mixedTechBases[component] = techBase;
            this._calc();
        }
    }

    public setStructureTechBase(techBase: "is" | "clan"): "is" | "clan" {
        this._setMixedTechBase("structure", techBase);
        return this.getStructureTechBase();
    }

    public setArmorTechBase(techBase: "is" | "clan"): "is" | "clan" {
        this._setMixedTechBase("armor", techBase);
        return this.getArmorTechBase();
    }

    public setHeatSinkTechBase(techBase: "is" | "clan"): "is" | "clan" {
        this._setMixedTechBase("heatSink", techBase);
        return this.getHeatSinkTechBase();
    }

    /** The engine's name; above rating 400, the large engine's (e.g. "Large XL Fusion"). */
    getEngineName(): string {
        if (this._primitive) {
            // Any engine in a Primitive 'Mech "is considered a Primitive engine" (IO:AE p.117).
            return this._engineType.tag === "standard"
                ? findByTag(mechEngineTypes, "primitive")?.name ?? "Primitive Fusion Engine"
                : this._engineType.name.startsWith("Primitive") ? this._engineType.name : "Primitive " + this._engineType.name;
        }
        return this.getLargeEngineType()?.name ?? this._engineType.name;
    }

    getHeatSyncName() {

        return this._heatSinkType.name + " Heat Sinks";

    }

    getGyroName() {
        return this.getGyro().name;
    }

    getName() {

        let name = "";
        if( this._name ) {
            name = " " + this._name;
        }
        const configuration = this.getOmniConfigurationLabel();
        if( configuration ) {
            name += " " + configuration;
        }
        if( this._nickname && this._nickname.trim() ) {
            let rv = this._nickname.trim();

            if( this._model && this._model.trim() )
                rv += " ( " + this._model.trim() + name + " )";

            return rv;
        } else {
            if( this._model && this._model.trim() )
                return this._model.trim() + name;
            else
                return "" + name;
        }

    }

    public setModel(
        newValue: string,
    ): string {
        this._model = newValue;
        return this._model;
    }

    /**
     * Whether this chassis may be built as an OmniMech at the given rules level. Tripods never
     * may; canon LAMs may not either (TRO:3085 pp.286-288), but the fan-made Omni-LAM allows it
     * for Inner Sphere LAMs at the Custom Homebrew rules level.
     */
    public canBeOmniMech(rulesLevel: number = 2): boolean {
        if (getRulesEdition(this._rulesEdition).noOmniMechs) return false;
        if (this.isTripod()) return false;
        // "Primitive 'Mechs cannot be constructed as OmniMechs" (IO:AE p.117).
        if (this._primitive) return false;
        // OmniMech parts on a FrankenMech lose their Omni abilities, and "cannot be reconfigured" (CO p.213).
        if (this._frankenMech) return false;
        // Battletech Into The Future has "no options for omniVTOL" yet.
        if (this.isLAM()) return rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL && this._hasOmniLAMTechBase() && this._hasLAMLimits();
        return true;
    }

    public toggleOmni(rulesLevel: number = 2) {
        if (!this._omnimech && !this.canBeOmniMech(rulesLevel)) {
            return;
        }
        this._omnimech = !this._omnimech;
        if (!this._omnimech) {
            this._equipmentList.forEach(item => { if (item) item.omniFixed = undefined; });
            // The design keeps the active configuration's equipment; the others are dropped.
            this._omniConfigurations = [];
            this._activeOmniConfiguration = BattleMech.DEFAULT_OMNI_CONFIGURATION;
            this._omniBaseHeatSinks = undefined;
            this._omniBaseJumpSpeed = undefined;
        }
        this._calc();
    }

    /** Standard LAMs and Permanent Air 'Mechs have an AirMech mode; Bimodal LAMs, VTOLAMs and other chassis do not. */
    public hasAirMechMode(): boolean {
        return this.isLAM() && LAM_TYPE_RULES[this._lamType].modes.includes("airmech");
    }

    /** AirMech Cruise MP: 'Mech-mode Jump MP x 3 (IO:AE p.102); x 2 for a Heavy Permanent Air 'Mech (Red Pins). */
    public getAirMechCruiseMP(): number {
        return this.hasAirMechMode() ? this.getJumpSpeed() * (this.isHeavyPermanentAirMech() ? 2 : 3) : 0;
    }

    /** A Permanent Air 'Mech over the LAM's 55 tons (to 75): Red Pins' Heavy PAM. */
    public isHeavyPermanentAirMech(): boolean {
        return this.isPermanentAirMech() && this._tonnage > BattleMech.LAM_MAX_TONNAGE;
    }

    /**
     * A Permanent Air 'Mech's wings: the Inner Sphere Partial Wing's 7% of mass, rounded up to the half ton (TO:AUE
     * p.104), 15% for a Heavy PAM, with no slots of their own: the LAM avionics stand for them (owner rulings 2026-11-12).
     */
    public getPermanentAirMechWingWeight(): number {
        if (!this.isPermanentAirMech()) return 0;
        // Percent in whole numbers, so 50 tons x 7% is exactly 3.5 tons and not a float a hair above it.
        return Math.ceil(this._tonnage * (this.isHeavyPermanentAirMech() ? 15 : 7) * 2 / 100) / 2;
    }

    /** AirMech Flank MP: Cruise MP x 1.5, rounded up (IO:AE p.102). */
    public getAirMechFlankMP(): number {
        return Math.ceil(this.getAirMechCruiseMP() * 1.5);
    }

    /**
     * Battle Value built on rules we have not yet verified against the book: loaded LAM
     * bombs (TM p.315's external-stores rule, which IO:AE p.186 does not extend to LAMs) and the Custom Homebrew Omni-LAM.
     * The LAM movement and heat adjustments themselves follow IO:AE p.186.
     */
    public isBattleValueProvisional(): boolean {
        return this.isOmniLAM() || this.isVTOLAM() || this.isPermanentAirMech() || (this.isLAM() && this.getBombLoadoutSlots() > 0);
    }

    /**
     * Alpha Strike values are provisional for every LAM: our conversion has no LAM
     * movement or LAM special abilities yet.
     */
    public isPointValueProvisional(): boolean {
        return this.isLAM() || this.isBattleValueProvisional();
    }

    /**
     * Lowest rules level at which this design is legal: its chassis type (IO:AE p.44), Ultra-light
     * or Superheavy tonnage (Advanced), prototype or rules-levelled equipment, and Custom
     * Homebrew content (fan rules, custom equipment). Standard (2) is tournament play.
     */
    public getRequiredRulesLevel(): number {
        let level = this._mechType.rulesLevel ?? 0;
        if (this._tonnage < 20 || this._tonnage > 100) level = Math.max(level, 3);
        // A record graded in the design's own edition (Max Tech's Level 3 under BMR(R)) reads that grade.
        const graded = (record: Parameters<typeof getEquipmentRulesLevel>[0] & { editionLevels?: { [edition: string]: number } }) =>
            record.editionLevels?.[this._rulesEdition] ?? getEquipmentRulesLevel(record);
        for (const item of this._equipmentList) {
            if (item) level = Math.max(level, graded(item));
        }
        for (const tag of Object.keys(this._bombLoadout)) {
            const bomb = this._findBomb(tag);
            if (bomb) level = Math.max(level, getEquipmentRulesLevel(bomb));
        }
        if (this.isOmniLAM() || this.isVTOLAM() || this.isPermanentAirMech()) level = Math.max(level, CUSTOM_HOMEBREW_RULES_LEVEL);
        // A custom or draft chassis component (custom-component-registry.ts) is homebrew.
        const components: [CustomComponentKind, { tag: string, rulesLevel?: number } | null | undefined][] = [
            ["armor", this._armorType], ["structure", this._selectedInternalStructure], ["engine", this._engineType],
            ["gyro", this._gyro], ["heatSink", this._heatSinkType], ["jumpJet", this._jumpJetType], ["myomer", this._myomerType],
        ];
        for (const [kind, record] of components) {
            if (isCustomComponent(kind, record as never)) {
                level = Math.max(level, CUSTOM_HOMEBREW_RULES_LEVEL, record?.rulesLevel ?? 0);
            } else if (record && (kind !== "jumpJet" || this.getJumpJetCount() > 0)) {
                // Advanced and Experimental parts (TO:AUE, IO:AE), graded as equipment is.
                level = Math.max(level, graded(record));
            }
        }
        // Primitive 'Mech construction is Advanced (IO:AE p.116).
        if (this._primitive) level = Math.max(level, 3);
        level = Math.max(level, this.getCockpitType().rulesLevel ?? 0);
        if (this.hasCommandConsole()) level = Math.max(level, getCockpitType("command-console").rulesLevel ?? 0);
        if (this.hasEnhancedImaging()) level = Math.max(level, graded(getCockpitType("enhanced-imaging-interface")));
        if (this.getJumpPackTons() > 0) level = Math.max(level, graded(mechJumpPack));
        // Level 3 in Maximum Tech; apocryphal from TW on (plan ruling R4).
        if (this.isArmless()) level = Math.max(level, this.isOfferedInEdition(armlessMechOption, 3) ? 3 : APOCRYPHAL_RULES_LEVEL);
        if (this._roboticControl !== "none") level = Math.max(level, SRCS_RULES_LEVEL);
        // An IndustrialMech with BattleMech armor is Experimental (TO:AUE p.92); the Dark Age armors are
        // "only under Experimental Mixed-Tech rules" (IO:AE p.82).
        const armorTypes = this.isPatchworkArmor()
            ? this.getPatchworkLocations().map(location => this.getPatchworkArmorType(location.key))
            : [this._armorType];
        if (armorTypes.some(armor => this._isIndustrialMechExperimentalArmor(armor))) level = Math.max(level, EXPERIMENTAL_RULES_LEVEL);
        for (const armor of armorTypes) level = Math.max(level, getEquipmentRulesLevel(armor));
        // Patchwork Armor is an "advanced construction option" (TO:AUE p.189).
        if (this.isPatchworkArmor()) level = Math.max(level, 3);
        // Non-Fusion BattleMechs are Experimental (TO:AUE p.120), and Custom Homebrew before Total Warfare.
        if (this.isNonFusionBattleMech()) level = Math.max(level, this._nonFusionBattleMechRulesLevel());
        if (this._frankenMech) level = Math.max(level, EXPERIMENTAL_RULES_LEVEL);
        // Armored components are Experimental (TO:AUE p.95).
        if (this.hasArmoredComponents()) level = Math.max(level, EXPERIMENTAL_RULES_LEVEL);
        // Fractional Accounting is "experimental-level unit design" (TO:AUE p.188).
        if (this.usesFractionalAccounting()) level = Math.max(level, EXPERIMENTAL_RULES_LEVEL);
        // The box sets before Total Warfare have no rules levels: only content from outside the canon keeps its level.
        // The Master Rules are graded like Total Warfare (BMR p.6, BMR(R) p.6).
        if (this.usesEarlierRulesEdition() && !getRulesEdition(this._rulesEdition).gradedLikeTotalWarfare && level < APOCRYPHAL_RULES_LEVEL) return 0;
        return level;
    }

    /**
     * Mark an installed item as OmniMech base-chassis (fixed) equipment, or return it to pod
     * space. Only OmniMechs have pods; on other units the flag is cleared.
     */
    public setEquipmentFixed(itemUUID: string | undefined, fixed: boolean): IEquipmentItem | null {
        const item = this._equipmentList.find(eq => eq?.uuid === itemUUID);
        if (!item) return null;
        // Some equipment can never be pod-mounted (see OMNI_FIXED_ONLY_TAGS).
        item.omniFixed = this._omnimech && (fixed || isOmniFixedOnly(item)) ? true : undefined;
        this._calc();
        return item;
    }

    /**
     * Pod space of the OmniMech base chassis, per location: slots not taken by chassis systems
     * or fixed equipment, plus the tonnage left for pods. Defines the model line that every
     * configuration (Prime, A, B...) is built into.
     */
    public getOmniPodSpace(): { locations: Record<string, number>, totalSlots: number, podTonnage: number } {
        const locations: Record<string, number> = {};
        if (!this._omnimech) return { locations, totalSlots: 0, podTonnage: 0 };
        const podUUIDs = new Set(this._equipmentList.filter(item => item && !item.omniFixed).map(item => item.uuid));
        const criticals = this._criticals as unknown as Record<string, (ICriticalSlot | null)[] | undefined>;
        for (const [location, slots] of Object.entries(criticals)) {
            if (!Array.isArray(slots) || slots.length === 0) continue;
            locations[location] = slots.filter(slot => !slot || podUUIDs.has(slot.uuid)).length;
        }
        const podWeight = this._equipmentList
            .filter(item => item && !item.omniFixed)
            .reduce((sum, item) => sum + (item.weight || 0), 0);
        return {
            locations,
            totalSlots: Object.values(locations).reduce((sum, slots) => sum + slots, 0),
            podTonnage: this.getRemainingTonnage() + podWeight + this._podChassisWeight(this._omniBaseChassis()),
        };
    }

    /**
     * The base chassis' additional heat sinks and jump MP: the design's own, else what every configuration has.
     * Heat sinks and jump jets above them are pod-mounted.
     */
    private _omniBaseChassis(): { additionalHeatSinks: number, jumpSpeed: number } {
        const chassis = [
            { additionalHeatSinks: this._additionalHeatSinks, jumpSpeed: this._jumpSpeed },
            // A configuration saved without its own chassis has the active one's; the compact format leaves out zeros.
            ...this._omniConfigurations.filter(configuration => configuration.name !== this._activeOmniConfiguration && configuration.chassis)
                .map(configuration => ({ additionalHeatSinks: configuration.chassis!.additionalHeatSinks ?? 0, jumpSpeed: configuration.chassis!.jumpSpeed ?? 0 })),
        ];
        return {
            additionalHeatSinks: this._omniBaseHeatSinks ?? Math.min(...chassis.map(entry => entry.additionalHeatSinks)),
            jumpSpeed: this._omniBaseJumpSpeed ?? Math.min(...chassis.map(entry => entry.jumpSpeed)),
        };
    }

    /** Weight of the active configuration's pod heat sinks and jump jets. */
    private _podChassisWeight(base: { additionalHeatSinks: number, jumpSpeed: number }): number {
        return Math.max(0, this._additionalHeatSinks - base.additionalHeatSinks) * (this._heatSinkType.weightEach ?? 1)
            + Math.max(0, this._jumpSpeed - base.jumpSpeed) * this._jumpJetWeightEach();
    }

    /** Remove every pod-mounted item, leaving the fixed base chassis to build a new configuration on. */
    public stripPodEquipment(): number {
        if (!this._omnimech) return 0;
        const podUUIDs = this._equipmentList.filter(item => item && !item.omniFixed).map(item => item.uuid);
        for (const uuid of podUUIDs) {
            this.removeEquipment(uuid);
        }
        this._calc();
        return podUUIDs.length;
    }

    /*
     * OmniMech configurations (Prime, A, B...) share the fixed base chassis and swap their
     * pod-mounted equipment. The active configuration lives in _equipmentList; the others are
     * stored snapshots of their pod items and critical slots.
     */
    public static readonly DEFAULT_OMNI_CONFIGURATION = "Prime";

    public getActiveOmniConfiguration(): string {
        return this._activeOmniConfiguration;
    }

    public getOmniConfigurationNames(): string[] {
        if (!this._omnimech) return [];
        const names = this._omniConfigurations.map(configuration => configuration.name);
        return names.includes(this._activeOmniConfiguration) ? names : [this._activeOmniConfiguration, ...names];
    }

    /**
     * The active configuration's name for display ("Prime", "A"), or "" when the design has
     * only one configuration or its model/name already ends with the configuration name.
     */
    public getOmniConfigurationLabel(): string {
        if (this.getOmniConfigurationNames().length < 2) return "";
        const configuration = this._activeOmniConfiguration.trim();
        const designation = ((this._model || "") + " " + (this._name || "")).trim().toLowerCase();
        if (!configuration || designation === configuration.toLowerCase() || designation.endsWith(" " + configuration.toLowerCase())) return "";
        return configuration;
    }

    /** A copy of this design with the named configuration active, e.g. for adding to a roster. */
    public cloneOmniConfiguration(name: string): BattleMech | null {
        if (!this.getOmniConfigurationNames().includes(name)) return null;
        const clone = new BattleMech(this.exportJSON(true));
        if (clone.getActiveOmniConfiguration() !== name) clone.switchOmniConfiguration(name);
        return clone;
    }

    /** The catalog tag of every pod in every stored OmniMech configuration. */
    public getOmniConfigurationEquipmentTags(): string[] {
        return this._omniConfigurations.flatMap(configuration => configuration.equipment.map(item => item.tag));
    }

    /** The uuid of every pod in every stored OmniMech configuration (the active one's pods are in the equipment list). */
    public getOmniConfigurationEquipmentUuids(): string[] {
        return this._omniConfigurations.flatMap(configuration => configuration.equipment.map(item => item.uuid).filter((uuid): uuid is string => !!uuid));
    }

    private _podItems(): IEquipmentItem[] {
        return this._equipmentList.filter(item => item && !item.omniFixed);
    }

    private _snapshotActiveOmniConfiguration(): IOmniConfiguration {
        const podItems = this._podItems();
        const podUUIDs = new Set(podItems.map(item => item.uuid));
        const allocation: ICriticalSlot[] = JSON.parse(JSON.stringify(
            this._criticalAllocationTable
                .filter(slot => podUUIDs.has(slot.uuid))
                .map(slot => ({ ...slot, obj: undefined, damaged: undefined }))
        ));
        return {
            name: this._activeOmniConfiguration,
            equipment: podItems.map(item => this._exportEquipmentItem(item, true)),
            allocation,
            bombLoadout: Object.keys(this._bombLoadout).length ? { ...this._bombLoadout } : undefined,
            chassis: {
                additionalHeatSinks: this._additionalHeatSinks,
                jumpSpeed: this._jumpSpeed,
                noActuators: {
                    lala: this._no_left_arm_lower_actuator, laha: this._no_left_arm_hand_actuator,
                    rala: this._no_right_arm_lower_actuator, raha: this._no_right_arm_hand_actuator,
                },
                clanCASE: this._clanCASE,
                slots: JSON.parse(JSON.stringify(
                    this._criticalAllocationTable
                        .filter(slot => BattleMech._isConfigurationChassisSlot(slot))
                        .map(slot => ({ ...slot, obj: undefined, damaged: undefined }))
                )),
            },
        };
    }

    /** Heat sink and jump jet slots, which a configuration places itself. */
    private static _isConfigurationChassisSlot(slot: ICriticalSlot): boolean {
        return slot?.tag === "heat-sink" || !!slot?.tag?.startsWith("jj-");
    }

    /** Sets a configuration's heat sinks, jump jets, arm actuators and Clan CASE, and places their slots. */
    private _loadOmniConfigurationChassis(chassis: IOmniConfigurationChassis): void {
        // The bundled designs' compact format leaves out empty and false fields (bundled-designs.ts).
        this._additionalHeatSinks = chassis.additionalHeatSinks ?? 0;
        this._jumpSpeed = chassis.jumpSpeed ?? 0;
        this._no_left_arm_lower_actuator = !!chassis.noActuators?.lala;
        this._no_left_arm_hand_actuator = !!chassis.noActuators?.laha;
        this._no_right_arm_lower_actuator = !!chassis.noActuators?.rala;
        this._no_right_arm_hand_actuator = !!chassis.noActuators?.raha;
        this._clanCASE = !!chassis.clanCASE;
        this._criticalAllocationTable = this._criticalAllocationTable.filter(slot => !BattleMech._isConfigurationChassisSlot(slot));
        for (const slot of chassis.slots ?? []) {
            this._criticalAllocationTable.push({ ...slot, rear: !!slot.rear, damaged: false, obj: null } as ICriticalSlot);
        }
    }

    private _storeActiveOmniConfiguration(): void {
        if (!this._omnimech) return;
        const snapshot = this._snapshotActiveOmniConfiguration();
        const index = this._omniConfigurations.findIndex(configuration => configuration.name === snapshot.name);
        if (index > -1) {
            this._omniConfigurations[index] = snapshot;
        } else {
            this._omniConfigurations.push(snapshot);
        }
    }

    /** Removes the live pod items and their critical slots, keeping the fixed base chassis. */
    private _clearPodItems(): void {
        const podUUIDs = new Set(this._podItems().map(item => item.uuid));
        this._equipmentList = this._equipmentList.filter(item => !podUUIDs.has(item.uuid));
        this._criticalAllocationTable = this._criticalAllocationTable.filter(slot => !podUUIDs.has(slot.uuid));
        this._bombLoadout = {};
    }

    private _loadOmniConfiguration(configuration: IOmniConfiguration | undefined): void {
        if (configuration) {
            if (configuration.chassis) this._loadOmniConfigurationChassis(configuration.chassis);
            for (const item of configuration.equipment) {
                this._restoreEquipmentItem(item);
            }
            for (const slot of configuration.allocation) {
                const restored: ICriticalSlot = { ...slot, rear: !!slot.rear, damaged: false } as ICriticalSlot;
                restored.obj = this.getEquipmentByUUID(restored.uuid);
                this._criticalAllocationTable.push(restored);
            }
            this._bombLoadout = configuration.bombLoadout ? { ...configuration.bombLoadout } : {};
        }
        this._calc();
    }

    /** Switches to another stored configuration; the current one is saved first. */
    public switchOmniConfiguration(name: string): boolean {
        if (!this._omnimech || name === this._activeOmniConfiguration) return false;
        const target = this._omniConfigurations.find(configuration => configuration.name === name);
        if (!target) return false;
        this._storeActiveOmniConfiguration();
        this._clearPodItems();
        this._activeOmniConfiguration = name;
        this._loadOmniConfiguration(JSON.parse(JSON.stringify(target)));
        return true;
    }

    /**
     * Adds a configuration and makes it active: empty pods on the base chassis, or a copy of
     * the current configuration's pods.
     */
    public addOmniConfiguration(name: string, copyCurrent: boolean = false): boolean {
        const trimmed = name.trim();
        if (!this._omnimech || !trimmed || this.getOmniConfigurationNames().includes(trimmed)) return false;
        this._storeActiveOmniConfiguration();
        const copy = copyCurrent ? this._snapshotActiveOmniConfiguration() : undefined;
        this._clearPodItems();
        this._activeOmniConfiguration = trimmed;
        this._loadOmniConfiguration(copy ? { ...copy, name: trimmed } : undefined);
        this._storeActiveOmniConfiguration();
        return true;
    }

    public renameOmniConfiguration(oldName: string, newName: string): boolean {
        const trimmed = newName.trim();
        if (!this._omnimech || !trimmed || this.getOmniConfigurationNames().includes(trimmed)) return false;
        this._storeActiveOmniConfiguration();
        const configuration = this._omniConfigurations.find(entry => entry.name === oldName);
        if (!configuration) return false;
        configuration.name = trimmed;
        if (this._activeOmniConfiguration === oldName) this._activeOmniConfiguration = trimmed;
        return true;
    }

    /** Deletes a configuration; deleting the active one switches to another. The last one stays. */
    public deleteOmniConfiguration(name: string): boolean {
        this._storeActiveOmniConfiguration();
        if (!this._omnimech || this._omniConfigurations.length < 2) return false;
        if (name === this._activeOmniConfiguration) {
            const next = this._omniConfigurations.find(configuration => configuration.name !== name)!;
            this.switchOmniConfiguration(next.name);
        }
        this._omniConfigurations = this._omniConfigurations.filter(configuration => configuration.name !== name);
        return true;
    }

    /** Battle Value and cost of every configuration, each built on the current base chassis. */
    public getOmniConfigurationStats(): { name: string, battleValue: number, cost: number, podTonnage: number }[] {
        if (!this._omnimech) return [];
        this._storeActiveOmniConfiguration();
        const exported = this.export(true);
        const base = this._omniBaseChassis();
        return this._omniConfigurations.map(configuration => {
            const variant = new BattleMech(JSON.stringify(exported));
            variant.switchOmniConfiguration(configuration.name);
            return {
                name: configuration.name,
                battleValue: variant.getBattleValue(),
                cost: variant.getCBillCostNumeric(),
                podTonnage: variant._podItems().reduce((sum, item) => sum + (item.weight || 0), 0) + variant._podChassisWeight(base),
            };
        });
    }

    /** A LAM built as an OmniMech under the Custom Homebrew Omni-LAM rule. */
    public isOmniLAM(): boolean {
        return this.isLAM() && this._omnimech;
    }

    private _hasOmniLAMTechBase(): boolean {
        const techTag = this.getTech().tag;
        return techTag === "is" || techTag === "mis";
    }

    /**
     * Custom Homebrew Omni-LAM construction checks (fan rule, "Construction Rules Update
     * KBS-3066-07-07-TRO3067 / Chassis Type: Omni-LAM", Kronos Battle Systems; Inner Sphere,
     * Tech Level 3; https://drive.google.com/file/d/0B5bLPOivte0vdXllN2Y3MUhhNGM/view).
     * Restriction 3 (arm actuators kept) is enforced by the model; restrictions 1 and 2 are
     * reported here. Left side = LA/LT/LL, right side = RA/RT/RL; the head and CT are centerline.
     */
    public getOmniLAMViolations(): string[] {
        if (!this.isOmniLAM()) return [];
        const violations: string[] = [];

        const sideWeight = (locations: string[]) => this._equipmentList
            .filter(item => item?.location && locations.includes(item.location))
            .reduce((sum, item) => sum + (item.weight || 0), 0);
        const leftWeight = sideWeight(["la", "lt", "ll"]);
        const rightWeight = sideWeight(["ra", "rt", "rl"]);
        if (leftWeight !== rightWeight) {
            violations.push(`Balance: left side carries ${leftWeight} tons of equipment and right side carries ${rightWeight} tons; they must match.`);
        }

        // Pod space = slots not used by chassis systems or fixed (base-chassis) equipment.
        const podSpace = this.getOmniPodSpace().locations;
        const sidePods = (locations: string[]) => locations.reduce((sum, location) => sum + (podSpace[location] ?? 0), 0);
        const leftPods = sidePods(["leftArm", "leftTorso", "leftLeg"]);
        const rightPods = sidePods(["rightArm", "rightTorso", "rightLeg"]);
        if (leftPods !== rightPods) {
            violations.push(`Pod space: the base chassis leaves ${leftPods} pod slots on the left side and ${rightPods} on the right; they must be equal.`);
        }

        return violations;
    }

    /*
     * LAM Bomb Bays, bombs, and fuel (IO pp.110-114). A LAM mounts at most 20 Bomb Bays of
     * 1 ton and 1 slot each, in the side torsos only. Each bay holds one bomb slot; bays in
     * the same location combine for multi-slot bombs (IO errata as quoted by a moderator,
     * bg.battletech.com forums topic 84643; errata document not checked).
     * Bomb mass is accounted for by the bays, so loaded bombs add no weight (IO:AE p.104), and
     * LAM cost counts only the bays and fuel tanks (IO:AE p.180).
     */
    /** LAMs need at least 3 Jump MP (IO:AE p.108); the usual walking-MP cap still applies. */
    public static readonly LAM_MIN_JUMP_MP = 3;
    /** LAMs weigh at most 55 tons (IO:AE p.108). */
    public static readonly LAM_MAX_TONNAGE = 55;
    /** Equipment LAMs may not mount (IO:AE p.108); bridge-layers are matched by tag prefix. */
    public static readonly LAM_PROHIBITED_TAGS: readonly string[] = [
        "supercharger", "backhoe", "combine", "dumper", "mechanical-jump-booster",
        "partial-wing", "clan-partial-wing", "chameleon-lps",
    ];
    /**
     * Equipment a superheavy 'Mech may not mount (IO:AE p.156): its musculature is incompatible with
     * MASC and the Actuator Enhancement System, it cannot use Superchargers or Modular Armor, and it
     * has no jumping or underwater movement, so no jump boosters or partial wings.
     */
    public static readonly SUPERHEAVY_PROHIBITED_TAGS: readonly string[] = [
        "masc", "clan-masc", "supercharger", "aes-arm", "aes-leg", "clan-aes-arm", "clan-aes-leg",
        "modular-armor", "clan-modular-armor", "mechanical-jump-booster", "partial-wing", "clan-partial-wing",
    ];
    /**
     * Artillery "ordinarily denied to standard-weight 'Mechs" that a superheavy 'Mech can mount
     * (IO:AE p.157): the Long Tom, which the TO:AUE construction table (p.217) gives no 'Mech space.
     */
    public static readonly SUPERHEAVY_ONLY_TAGS: readonly string[] = ["long-tom-artillery", "primitive-prototype-long-tom"];
    /**
     * Internal structure a superheavy 'Mech may use (IO:AE p.155): standard, endo steel and
     * endo-composite for BattleMechs, industrial for IndustrialMechs; "no other internal structure
     * types are available".
     */
    public static readonly SUPERHEAVY_STRUCTURE_TAGS: readonly string[] = ["standard", "endo-steel", "endo-composite", "industrial"];
    /** Gyros a LAM may use: Standard, Compact, Heavy-Duty (IO:AE p.108). */
    public static readonly LAM_GYRO_TAGS: readonly string[] = ["standard", "compact", "heavy-duty"];
    /** BishopSteiner's VTOLAM may use any fusion engine (and any gyro); it needs no fuel, as it flies on its rotors. */
    public static readonly VTOLAM_ENGINE_TAGS: readonly string[] = ["standard", "compact", "light", "xl", "clan_xl", "xxl", "clan_xxl"];

    private _getLAMMinJumpMP(): number {
        return LAM_TYPE_RULES[this._lamType].minJumpMP;
    }

    private _hasLAMLimits(): boolean {
        return LAM_TYPE_RULES[this._lamType].lamLimits;
    }

    /** The heaviest LAM of this type, when its rules set one. */
    public getLAMMaxTonnage(): number | null {
        return this.isLAM() ? LAM_TYPE_RULES[this._lamType].maxTonnage ?? BattleMech.LAM_MAX_TONNAGE : null;
    }

    private _isLAMLegalGyro(tag: string): boolean {
        return this.isVTOLAM() ? mechGyroTypes.some(gyro => gyro.tag === tag) : BattleMech.LAM_GYRO_TAGS.includes(tag);
    }

    /**
     * VTOL-mode Cruise MP: BishopSteiner's VTOL formula, (engine rating + VTOL suspension factor) / tonnage rounded down
     * (TM p.100), or Battletech Into The Future's Jump MP.
     */
    public getVTOLAMCruiseMP(): number {
        if (!this.isVTOLAM()) return 0;
        return LAM_TYPE_RULES[this._lamType].vtolCruise === "jump" ? this.getJumpSpeed()
            : Math.floor((this.getEngineRating() + getVehicleSuspensionFactor("vtol", this._tonnage)) / this._tonnage);
    }

    public getLAMTypeNotes(): string {
        return this.isLAM() ? LAM_TYPE_RULES[this._lamType].notes ?? "" : "";
    }

    public getVTOLAMFlankMP(): number {
        return Math.ceil(this.getVTOLAMCruiseMP() * 1.5);
    }
    public static readonly LAM_BOMB_BAY_TAG = "lam-bomb-bay";
    public static readonly LAM_FUEL_TANK_TAG = "lam-fuel-tank";
    public static readonly LAM_MAX_BOMB_BAYS = 20;
    public static readonly LAM_FUEL_POINTS_PER_TON = 80;

    public getBombBayCount(): number {
        return this._equipmentList.filter(item => matchesTag(item, BattleMech.LAM_BOMB_BAY_TAG)).length;
    }

    /** Bomb Bays per side torso; bays may only go in the left or right torso (IO:AE p.108). */
    public getBombBaysByLocation(): Record<string, number> {
        const bays: Record<string, number> = { lt: 0, rt: 0 };
        if (!this.isLAM()) return bays;
        for (const item of this._equipmentList) {
            if (matchesTag(item, BattleMech.LAM_BOMB_BAY_TAG) && item.location && item.location in bays) {
                bays[item.location]++;
            }
        }
        return bays;
    }

    /**
     * LAM fuel points: 80 from the conversion equipment plus 80 per Fuel Tank (IO:AE pp.180, 214). A Permanent Air
     * 'Mech carries that first ton as a required weight instead (owner ruling 2026-11-12).
     */
    public getLAMFuelPoints(): number {
        if (!this.isLAM() || this.isVTOLAM()) return 0;
        const tanks = this._equipmentList.filter(item => matchesTag(item, BattleMech.LAM_FUEL_TANK_TAG)).length;
        return BattleMech.LAM_FUEL_POINTS_PER_TON * (1 + tanks);
    }

    /** Bombs this LAM's tech base, era, and the given rules level allow. */
    public getAvailableBombs(rulesLevel: number = 2): IEquipmentItem[] {
        if (!this.isLAM()) return [];
        return getEquipmentListForChassis(this.getTech().tag)
            .filter(item => !!item.bombBaySlots && this.isOfferedInEdition(item, rulesLevel)
                && getEquipmentRulesLevel(item) <= rulesLevel
                && this._itemIsAvailable(item.introduced, item.extinct, item.reintroduced))
            .sort((a, b) => a.sort.localeCompare(b.sort));
    }

    private _findBomb(tag: string): IEquipmentItem | undefined {
        return getUnitCatalogRecords(this.getTech().tag, { otherTechBase: false, includeCustom: false }).find(item => !!item.bombBaySlots && matchesTag(item, tag));
    }

    public getBombLoadout(): Record<string, number> {
        return { ...this._bombLoadout };
    }

    public getBombLoadoutSlots(): number {
        return Object.entries(this._bombLoadout)
            .reduce((sum, [tag, count]) => sum + (this._findBomb(tag)?.bombBaySlots ?? 0) * count, 0);
    }

    /** True when every bomb fits in the bays of a single torso location. */
    public canCarryBombLoadout(loadout: Record<string, number> = this._bombLoadout): boolean {
        if (!this.isLAM()) return Object.keys(loadout).length === 0;
        const free = Object.values(this.getBombBaysByLocation());
        const sizes: number[] = [];
        for (const [tag, count] of Object.entries(loadout)) {
            const bomb = this._findBomb(tag);
            if (!bomb || !bomb.bombBaySlots) return false;
            for (let bombCount = 0; bombCount < count; bombCount++) sizes.push(bomb.bombBaySlots);
        }
        // Largest bombs first, each into the tightest location that still fits it.
        sizes.sort((a, b) => b - a);
        for (const size of sizes) {
            let best = -1;
            free.forEach((room, index) => {
                if (room >= size && (best < 0 || room < free[best])) best = index;
            });
            if (best < 0) return false;
            free[best] -= size;
        }
        return true;
    }

    /** Sets how many of one bomb are loaded; returns false (and changes nothing) if they do not fit. */
    public setBombCount(tag: string, count: number): boolean {
        const next = { ...this._bombLoadout };
        if (count > 0) {
            next[tag] = Math.floor(count);
        } else {
            delete next[tag];
        }
        if (!this.canCarryBombLoadout(next)) return false;
        this._bombLoadout = next;
        this._calc();
        return true;
    }

    public clearBombLoadout(): void {
        this._bombLoadout = {};
        this._calc();
    }

    /** Drops bombs that no longer fit (bays removed, chassis changed), keeping the rest in order. */
    private _trimBombLoadout(): void {
        if (Object.keys(this._bombLoadout).length === 0) return;
        const kept: Record<string, number> = {};
        for (const [tag, count] of Object.entries(this._bombLoadout)) {
            for (let bombCount = 0; bombCount < count; bombCount++) {
                const trial = { ...kept, [tag]: (kept[tag] ?? 0) + 1 };
                if (this.canCarryBombLoadout(trial)) Object.assign(kept, trial);
            }
        }
        this._bombLoadout = kept;
    }

    /** BV of the loaded bombs, added like aerospace external stores (via MegaMek; provisional). */
    public getBombBattleValue(): number {
        return Object.entries(this._bombLoadout)
            .reduce((sum, [tag, count]) => sum + (this._findBomb(tag)?.battleValue ?? 0) * count, 0);
    }

    // ---- Armored components (TO:AUE pp.94-95, 192, 217) ----

    private static readonly CRITICAL_LOCATIONS = ["hd", "ct", "lt", "rt", "la", "ra", "ll", "rl", "cl", "fll", "frl"];
    private static readonly CASE_TAGS = ["case", "case-ii", "clan-case-ii", "case-prototype"];
    // Chassis systems that are one component however many records they fill.
    private static readonly WHOLE_COMPONENT_TAGS = ["engine", "gyro", "cockpit", "multi-pilot-cockpit", "command-console", "sensors", "life-support"];

    private static _armoredSlotKey(tag: string, loc: string, slot: number): string {
        return `${tag}@${loc}:${slot}`;
    }

    // Armoring the cockpit systems, Command Console included, adds 1 ton in all (TO:AUE p.94).
    private static _isCockpitRecord(tag: string): boolean {
        return tag === "cockpit" || tag === "multi-pilot-cockpit" || tag === "command-console";
    }

    /**
     * SSW names the rear quad legs RLL and RRL, and a quad's front legs LA and RA (as the MTF converter writes them).
     * Quads have no arm slots, so the front legs go to FLL and FRL.
     */
    private _sswCriticalLocation(location: string): string {
        const code = location.toLowerCase().trim();
        return this._normalizeLocation(code === "rll" ? "ll" : code === "rrl" ? "rl" : code);
    }

    private _criticalArrayFor(loc: string): ICriticalSlot[] | undefined {
        const key = BattleMech.MECH_LOCATION_MAP[loc];
        return key ? (this._criticals as unknown as Record<string, ICriticalSlot[] | undefined>)[key] : undefined;
    }

    /** The installed item a critical record belongs to (spread items' records add ":n" to its uuid). */
    private _equipmentForRecord(record: ICriticalSlot): IEquipmentItem | undefined {
        const uuid = record.uuid ?? "";
        return this._equipmentList.find(item => item?.uuid && (item.uuid === uuid || uuid.startsWith(item.uuid + ":")));
    }

    /**
     * Anything on the Critical Hit Table can be armored except ammunition bins, CASE and "roll again" slots
     * (TO:AUE p.94). Superheavy 'Mechs may not use armored components (IO:AE p.156), nor the interface
     * cockpit component armor (IO:AE p.110).
     */
    private _canArmorRecord(record: ICriticalSlot): boolean {
        if (this.isSuperheavy()) return false;
        if (BattleMech._isCockpitRecord(record.tag) && this.getCockpitType().tag === "interface") return false;
        return this._isArmorableRecord(record);
    }

    /** Ammunition bins, CASE and "roll again" slots are never armored components (TO:AUE p.94). */
    private _isArmorableRecord(record: ICriticalSlot): boolean {
        if (record.placeholder || record.rollAgain) return false;
        const item = this._equipmentForRecord(record);
        if (!item) return true;
        return !(item.isAmmo || item.tag.startsWith("ammo-")) && !BattleMech.CASE_TAGS.includes(item.tag) && item.space.battlemech > 0;
    }

    /** Can this installed item be an armored component? */
    public canArmorEquipment(item: IEquipmentItem): boolean {
        if (this.isSuperheavy()) return false;
        if (item.isAmmo || item.tag.startsWith("ammo-")) return false;
        if (BattleMech.CASE_TAGS.includes(item.tag)) return false;
        return item.space.battlemech > 0;
    }

    public setEquipmentArmored(itemUUID: string | undefined, armored: boolean): IEquipmentItem | null {
        const item = this._equipmentList.find(eq => eq?.uuid === itemUUID);
        if (!item) return null;
        item.armored = armored && this.canArmorEquipment(item) ? true : undefined;
        this._calc();
        return item;
    }

    /**
     * The BattleMech Turret that can carry an item (TO:AUE p.158): a shoulder or quad turret carries items in its own
     * side torso, a head turret (its slot in the center torso) the head's. Ammunition and heat sinks ride along
     * uncounted, so they are not marked.
     */
    public getTurretFor(item: IEquipmentItem): IEquipmentItem | undefined {
        if (!this.canTurretEquipment(item)) return undefined;
        const location = item.location === "un" ? item.allocationLocation : item.location;
        return this._equipmentList.find(turret => turret?.variableFormula === "mech-turret" && (location === "hd"
            ? turret.tag === "mech-turret-head"
            : turret.tag !== "mech-turret-head" && (turret.location === "un" ? turret.allocationLocation : turret.location) === location));
    }

    /** Can this item be marked turret-mounted? Not ammunition, heat sinks or a turret itself. */
    public canTurretEquipment(item: IEquipmentItem): boolean {
        return item.variableFormula !== "mech-turret" && !item.isAmmo && !item.tag.startsWith("ammo-") && !item.tag.includes("heat-sink");
    }

    /** Is this item marked turret-mounted, with a turret in place to carry it? */
    public isTurretMounted(item: IEquipmentItem): boolean {
        return !!item.turret && !!this.getTurretFor(item);
    }

    /** Marks an item turret-mounted (no longer rear-firing), or not; it is carried once placed in a turret's location. */
    public setEquipmentTurret(itemUUID: string | undefined, turret: boolean): IEquipmentItem | null {
        const item = this._equipmentList.find(eq => eq?.uuid === itemUUID);
        if (!item) return null;
        item.turret = turret && this.canTurretEquipment(item) ? true : undefined;
        if (item.turret && item.rear) this.setRear(itemUUID, false);
        this._calc();
        return item;
    }

    /** Tons a turret carries: its items' weights, not counting ammunition and heat sinks (TO:AUE p.158). */
    private _getTurretCarriedWeight(turret: IEquipmentItem): number {
        return this._equipmentList
            .filter(item => item?.turret && this.getTurretFor(item) === turret)
            .reduce((sum, item) => sum + (item.weight || 0), 0);
    }

    /**
     * Every armored critical record, placed or not: its location ("un" when unplaced), first slot, slot count
     * and the item it belongs to (null for chassis systems, heat sinks and jump jets).
     */
    public getArmoredComponentRecords(): { loc: string, slot: number, slots: number, record: ICriticalSlot, item: IEquipmentItem | null }[] {
        const armored: { loc: string, slot: number, slots: number, record: ICriticalSlot, item: IEquipmentItem | null }[] = [];
        const consider = (record: ICriticalSlot | null | undefined, loc: string, slot: number) => {
            // Superheavy and interface-cockpit armor still counts; getChassisEquipmentViolations() flags it.
            if (!record || !this._isArmorableRecord(record)) return;
            const item = this._equipmentForRecord(record) ?? null;
            const isArmored = item ? item.armored === true : this._armoredSlots.has(BattleMech._armoredSlotKey(record.tag, loc, slot));
            if (isArmored) armored.push({ loc, slot, slots: Math.max(1, (loc === "un" ? record.crits : record.size ?? record.crits) || 1), record, item });
        };
        for (const loc of BattleMech.CRITICAL_LOCATIONS) {
            (this._criticalArrayFor(loc) ?? []).forEach((record, slot) => consider(record, loc, slot));
        }
        // Only equipment keeps its armor while unplaced.
        this._unallocatedCriticals.forEach((record, slot) => { if (record && this._equipmentForRecord(record)) consider(record, "un", slot); });
        return armored;
    }

    public hasArmoredComponents(): boolean {
        return this.getArmoredComponentRecords().length > 0;
    }

    /** Critical slots taken by armored components. */
    public getArmoredComponentSlots(): number {
        return this.getArmoredComponentRecords().reduce((sum, armored) => sum + armored.slots, 0);
    }

    /** 0.5 tons for each armored slot; an armored cockpit adds 1 ton (TO:AUE p.94). */
    public getArmoredComponentWeight(): number {
        let weight = 0;
        let cockpit = false;
        for (const armored of this.getArmoredComponentRecords()) {
            if (!armored.item && BattleMech._isCockpitRecord(armored.record.tag)) cockpit = true;
            else weight += 0.5 * armored.slots;
        }
        return weight + (cockpit ? 1 : 0);
    }

    /**
     * The chassis components that can be armored (engine, gyro, cockpit, sensors, life support, actuators, heat
     * sinks, jump jets...), each with its records' keys. An engine, gyro, cockpit, sensors or life support is one
     * component over all its slots (TO:AUE p.95); other records are listed one by one.
     */
    public getArmorableComponents(): { key: string, name: string, armored: boolean }[] {
        const components = new Map<string, { key: string, name: string, slotKeys: string[] }>();
        const locationNames: Record<string, string> = {
            hd: "Head", ct: "Center Torso", lt: "Left Torso", rt: "Right Torso", la: "Left Arm", ra: "Right Arm",
            ll: this.isQuad() || this.isQuadVee() ? "Rear Left Leg" : "Left Leg", rl: this.isQuad() || this.isQuadVee() ? "Rear Right Leg" : "Right Leg",
            cl: "Center Leg", fll: "Front Left Leg", frl: "Front Right Leg",
        };
        for (const loc of BattleMech.CRITICAL_LOCATIONS) {
            (this._criticalArrayFor(loc) ?? []).forEach((record, slot) => {
                if (!record || record.placeholder || this._equipmentForRecord(record) || !this._canArmorRecord(record)) return;
                const whole = BattleMech.WHOLE_COMPONENT_TAGS.includes(record.tag);
                const key = whole ? record.tag : record.movable ? BattleMech._armoredSlotKey(record.tag, loc, slot) : `${record.tag}@${loc}`;
                const name = whole ? record.name : record.movable ? `${record.name} (${locationNames[loc] ?? loc}, slot ${slot + 1})` : `${record.name} (${locationNames[loc] ?? loc})`;
                const component = components.get(key) ?? { key, name, slotKeys: [] };
                component.slotKeys.push(BattleMech._armoredSlotKey(record.tag, loc, slot));
                components.set(key, component);
            });
        }
        return [...components.values()].map(component => ({
            key: component.key,
            name: component.name,
            armored: component.slotKeys.some(slotKey => this._armoredSlots.has(slotKey)),
        }));
    }

    /** Armor, or un-armor, every record of one component from getArmorableComponents(). */
    public setComponentArmored(componentKey: string, armored: boolean): void {
        for (const loc of BattleMech.CRITICAL_LOCATIONS) {
            (this._criticalArrayFor(loc) ?? []).forEach((record, slot) => {
                if (!record || record.placeholder || this._equipmentForRecord(record)) return;
                const slotKey = BattleMech._armoredSlotKey(record.tag, loc, slot);
                const matches = componentKey === record.tag || componentKey === `${record.tag}@${loc}` || componentKey === slotKey;
                if (!matches) return;
                if (armored && this._canArmorRecord(record)) this._armoredSlots.add(slotKey);
                else this._armoredSlots.delete(slotKey);
            });
        }
        this._calc();
    }

    /** Is the critical slot at this index part of an armored component? The record sheet circles its number (TO:AUE p.95). */
    public isCriticalSlotArmored(location: string, index: number): boolean {
        const slots = this._criticalArrayFor(location);
        if (!slots || !slots[index]) return false;
        let start = index;
        while (start > 0 && slots[start]?.placeholder) start--;
        return this.getArmoredComponentRecords().some(armored => armored.loc === location && armored.slot === start && index < start + armored.slots);
    }

    /** Chassis-specific equipment limits (LAM Bomb Bays and other per-unit caps). */
    public getChassisEquipmentViolations(): string[] {
        const violations: string[] = [...this._getFutureWarsConstructionIssues(), ...this._getPowerArmorIssues()];
        // The Clans do not build superheavy 'Mechs (IO:AE p.154).
        if (this.isSuperheavy() && (this._tech.tag === "clan" || this._tech.tag === "mclan")) {
            violations.push("Superheavy 'Mechs are available only to the Inner Sphere tech base.");
        }
        if (this._engineType.tag === BattleMech.MINI_ENGINE_TAG && (this.isSuperheavy() || this.isLargeEngine())) {
            // The post (#249) covers neither, so we do not build them.
            violations.push("The Mini Engine is not built above a rating of 400 or for superheavy 'Mechs.");
        } else if (this._engineType.tag === BattleMech.RFE_TAG && (this.isSuperheavy() || this.isLargeEngine())) {
            violations.push("The Re-Engineered Fusion Engine is not built above a rating of 400 or for superheavy 'Mechs.");
        } else if (!this._isSuperheavyLegalEngine(this._engineType.tag)) {
            violations.push(this.isIndustrialMech()
                ? "Superheavy IndustrialMechs may use only standard fusion engines."
                : "Superheavy 'Mechs may use only fusion engines.");
        }
        // "Superheavy 'Mechs may not use armored components" (IO:AE p.156).
        if (this.isSuperheavy() && this.hasArmoredComponents()) {
            violations.push("Superheavy 'Mechs may not use armored components.");
        }
        // "The interface cockpit cannot be protected with component armor" (IO:AE p.110).
        if (this.getCockpitType().tag === "interface" && this.getArmoredComponentRecords().some(armored => BattleMech._isCockpitRecord(armored.record.tag))) {
            violations.push("The interface cockpit cannot be protected with component armor.");
        }
        if (this._gyro.tag === "none" && this.getCockpitType().tag !== "interface") {
            violations.push("Only a 'Mech with an interface cockpit may be built without a gyro.");
        }
        if (!this._isArmorLegalForChassis(this._armorType)) {
            violations.push(this._primitive
                ? `A Primitive 'Mech cannot mount ${this._armorType.name}.`
                : this.isIndustrialMech()
                ? `IndustrialMechs mount ${this._armorType.name} only under Experimental Mixed-Tech rules (IO:AE p.82).`
                : `${this._armorType.name} can only be mounted on an IndustrialMech.`);
        }
        if (this.isPatchworkArmor()) {
            // "A unit may also not mount armor types illegal for that unit type to mount" (TO:AUE p.189).
            for (const location of this.getPatchworkLocations()) {
                const locationArmor = this.getPatchworkArmorType(location.key);
                if (!this._isPatchworkLocationType(locationArmor)) {
                    violations.push(`Patchwork Armor: ${locationArmor.name} cannot be mounted on this unit (${location.label}).`);
                }
            }
            violations.push(...this._patchworkSlotShortfalls);
        }
        if (this._frankenMech) {
            violations.push(...this._frankenMechSlotShortfalls);
            // "If MASC is installed, only standard myomers can be used" (CO p.213).
            if (this._myomerType.tag !== "standard" && this._equipmentList.some(item => item && /(^|-)masc$/.test(item.tag.toLowerCase()))) {
                violations.push("FrankenMech: with MASC installed, only standard myomer can be used.");
            }
        }
        const chassisName = this._primitive ? "Primitive 'Mechs" : "IndustrialMechs";
        if (this._primitive) {
            const typeTag = this._mechType.tag.toLowerCase();
            if (this._tech.tag === "clan" || this._tech.tag === "mclan") {
                violations.push("Primitive 'Mechs can be built only with an Inner Sphere tech base.");
            }
            if (typeTag !== "biped" && typeTag !== "quad") {
                violations.push("Primitive 'Mechs may only be built as bipeds or four-legged units.");
            }
            if (this._tonnage > 100) {
                violations.push("Primitive 'Mechs may weigh between 10 and 100 tons.");
            }
            if (!BattleMech.PRIMITIVE_STRUCTURE_TAGS.includes(this._selectedInternalStructure.tag)) {
                violations.push("Primitive 'Mechs may use only standard or industrial internal structure.");
            }
        }
        if (this._hasBasicChassis()) {
            // A superheavy IndustrialMech's engine is reported above.
            if (!this._isChassisLegalEngine(this._engineType.tag) && this._isSuperheavyLegalEngine(this._engineType.tag)) {
                violations.push(this._primitive
                    ? "Primitive 'Mechs may use only ICE, fuel cell, fission or standard fusion engines."
                    : "IndustrialMechs may use only standard fusion, ICE, fuel cell or fission engines.");
            }
            if (this._gyro.tag !== "standard") {
                violations.push(`${chassisName} may use only standard gyros.`);
            }
            if (this._heatSinkType.tag !== "single") {
                violations.push(`${chassisName} may use only single heat sinks.`);
            }
            if (!this._primitive && this._jumpSpeed > 0 && this._jumpJetType.tag !== "standard") {
                violations.push("IndustrialMechs may use only standard jump jets.");
            }
        }
        if (!this._isChassisLegalMyomer(this._myomerType)) {
            violations.push(this._primitive ? `${this._myomerType.name} cannot be mounted on a Primitive 'Mech.`
                : this.isIndustrialMech() ? `${this._myomerType.name} cannot be mounted on an IndustrialMech.`
                : `${this._myomerType.name} can only be mounted on an IndustrialMech.`);
        }
        const counted = new Map<string, { item: IEquipmentItem; count: number; names: string[] }>();
        const repairSystems = new Set<string>();
        const perLocation = new Map<string, number>();
        for (const item of this._equipmentList) {
            if (!item) continue;
            if (item.chassisTypes?.length && !item.chassisTypes.includes(this._mechType.tag.toLowerCase())) {
                violations.push(`${item.name} can only be mounted on: ${item.chassisTypes.join(", ").toUpperCase()}.`);
            }
            if (this.isSuperheavy() && BattleMech.SUPERHEAVY_PROHIBITED_TAGS.includes(item.tag.toLowerCase())) {
                violations.push(`${item.name} cannot be mounted on a superheavy 'Mech.`);
            }
            if (item.tag === "mech-turret-head" && !this._torsoMountedCockpit) {
                violations.push(`${item.name} needs a Torso-Mounted Cockpit (TO:AUE p.158).`);
            }
            if (!this.isSuperheavy() && BattleMech.SUPERHEAVY_ONLY_TAGS.includes(item.tag.toLowerCase())) {
                violations.push(`${item.name} can only be mounted on a superheavy 'Mech.`);
            }
            if (!this.hasAdvancedFireControl() && BattleMech._needsAdvancedFireControl(item)) {
                violations.push(`${item.name} needs Advanced Fire Control on an IndustrialMech.`);
            }
            if (!engineMeetsRequirement(item.requiresEngine, this._engineType.tag)) {
                violations.push(`${item.name} needs ${describeEngineRequirement(item.requiresEngine!)}.`);
            }
            if (item.industrialMechOnly && !this.isIndustrialMech()) {
                violations.push(`${item.name} can only be mounted on an IndustrialMech.`);
            }
            // MASC on an IndustrialMech (TM p.70); MASC, Superchargers and the like on a Primitive 'Mech (IO:AE p.117).
            const isMASC = item.variableFormula === "masc-is" || item.variableFormula === "masc-clan";
            if (this._primitive && (isMASC || item.variableFormula === "supercharger")) {
                violations.push(`${item.name} cannot be mounted on a Primitive 'Mech.`);
            } else if (this.isIndustrialMech() && isMASC) {
                violations.push(`${item.name} cannot be mounted on an IndustrialMech.`);
            }
            const allowedLocations = this._getAllowedLocations(item);
            if (allowedLocations && item.location && BattleMech.MECH_LOCATION_MAP[item.location] && !allowedLocations.includes(item.location)) {
                violations.push(allowedLocations.length > 0
                    ? `${item.name} must be placed in: ${allowedLocations.join(", ").toUpperCase()}.`
                    : `${item.name} cannot be mounted on this chassis.`);
            }
            if ((item.location === "la" || item.location === "ra") && this.isArmless()) {
                violations.push(`${item.name}: an armless 'Mech has no arms to mount it (Maximum Tech p.62).`);
            // Arm weapons and their actuators (TM pp.220, 237; TO:AUE p.100).
            } else if ((item.location === "la" || item.location === "ra") && !this._hasFrontLegs()) {
                const arm = item.location.toUpperCase();
                const lowerArm = this.hasLowerArmActuator(item.location);
                const hand = lowerArm && this.hasHandActuator(item.location);
                if (item.requiresHandActuator && !hand) {
                    violations.push(`${item.name} needs lower arm and hand actuators in the ${arm}.`);
                } else if ((item.requiresLowerArmActuator || item.replacesHandActuator) && !lowerArm) {
                    violations.push(`${item.name} needs a lower arm actuator in the ${arm}.`);
                } else if (item.replacesHandActuator && hand) {
                    violations.push(`${item.name} replaces the hand actuator: remove the ${arm} hand actuator.`);
                }
            }
            if (item.armorRepairBVMultiplier) {
                // HarJel II / III: BattleMechs only, and only some armor types (IO:AE pp.82-83).
                if (this.isIndustrialMech()) {
                    violations.push(`${item.name} can only be mounted on a BattleMech.`);
                }
                // Under Patchwork Armor the armor that counts is the one in the system's own location.
                const repairLocation = item.location ? BattleMech.MECH_LOCATION_MAP[item.location] : undefined;
                const repairedArmor = this.isPatchworkArmor()
                    ? (repairLocation ? this.getPatchworkArmorType(repairLocation) : null)
                    : this._armorType;
                if (repairedArmor && !BattleMech.REPAIR_SYSTEM_ARMOR_TAGS.includes(repairedArmor.tag)) {
                    violations.push(`${item.name} does not work with ${repairedArmor.name.replace(/ Armor$/, "")} armor.`);
                }
                repairSystems.add(item.tag);
            }
            if (item.onePerLocationGroup && item.location && BattleMech.MECH_LOCATION_MAP[item.location]) {
                const key = `${item.onePerLocationGroup}@${item.location}`;
                perLocation.set(key, (perLocation.get(key) ?? 0) + 1);
            }
            if (item.maxPerUnit) {
                // Items in a group count together: one RISC Viral Jammer of any type (IO:AE p.88).
                const key = item.maxPerUnitGroup ?? item.tag;
                const entry = counted.get(key) ?? { item, count: 0, names: [] };
                entry.count++;
                if (!entry.names.includes(item.name)) entry.names.push(item.name);
                counted.set(key, entry);
            }
        }
        counted.forEach(({ item, count, names }) => {
            if (count > (item.maxPerUnit ?? count)) {
                violations.push(`${names.join(" / ")}: ${count} mounted; at most ${item.maxPerUnit} allowed.`);
            }
        });
        const mounted = this._equipmentList.filter(item => !!item);
        // "Leg-mounted AES components require that all of the unit's legs receive this equipment" (TO:AUE p.91).
        const legAES = mounted.filter(item => item.variableFormula === "aes-leg").length;
        const legCount = this._legLocations().length;
        if (legAES > 0 && legAES !== legCount) {
            violations.push(`Leg Actuator Enhancement Systems must be mounted in every leg (${legAES} of ${legCount}).`);
        }
        violations.push(...this._systemConflictViolations(mounted));
        // Spread equipment: only in its locations, shared out evenly.
        const spreadCounts = new Map<string, { item: IEquipmentItem; byLocation: Map<string, number> }>();
        for (const [location, area] of Object.entries(BattleMech.MECH_LOCATION_MAP)) {
            for (const slot of ((this._criticals as any)[area] ?? []) as (ICriticalSlot | null)[]) {
                const obj = slot?.obj as IEquipmentItem | null | undefined;
                if (!slot || slot.placeholder || !obj?.spreadLocations) continue;
                const entry = spreadCounts.get(obj.tag) ?? { item: obj, byLocation: new Map<string, number>() };
                entry.byLocation.set(location, (entry.byLocation.get(location) ?? 0) + 1);
                spreadCounts.set(obj.tag, entry);
            }
        }
        spreadCounts.forEach(({ item, byLocation }) => {
            const allowed = this._getSpreadLocations(item) ?? [];
            const perLocation = this._getSpreadSlotsPerLocation(item);
            const outside = Array.from(byLocation.keys()).filter(location => !allowed.includes(location));
            const crowded = Array.from(byLocation.entries()).filter(([, count]) => count > perLocation).map(([location]) => location);
            if (outside.length > 0) {
                violations.push(`${item.name}: only in ${allowed.join(", ").toUpperCase()} (not ${outside.join(", ").toUpperCase()}).`);
            }
            if (crowded.length > 0) {
                violations.push(`${item.name}: at most ${perLocation} slot${perLocation === 1 ? "" : "s"} in a location (${crowded.join(", ").toUpperCase()}).`);
            }
            const [first] = byLocation.keys();
            if (first && this._getOtherSideLocations(item, first).some(location => byLocation.has(location))) {
                violations.push(`${item.name}: one side only (a side torso and the arm on that side).`);
            }
        });
        if (mounted.some(item => item.tag === BattleMech.C3_REMOTE_SENSOR_TAG) && mounted.some(item => BattleMech._isC3iSystem(item))) {
            violations.push("C3 Remote Sensor Launcher is incompatible with C3i-based systems.");
        }
        // "the MRM FCS must be incorporated on all of an individual unit's standard MRM Launchers" (TO:AUE p.142).
        if (mounted.some(item => /^mrm-\d+-apollo$/.test(item.tag))) {
            const plain = Array.from(new Set(mounted.filter(item => /^mrm-\d+$/.test(item.tag)).map(item => item.name)));
            if (plain.length > 0) {
                violations.push(`The MRM Apollo FCS must be fitted to every standard MRM launcher on the unit (${plain.join(", ")} ${plain.length > 1 ? "have" : "has"} none).`);
            }
        }
        // "Units may not combine different HarJel repair systems" (IO:AE p.83).
        if (repairSystems.size > 1) {
            violations.push("HarJel II and HarJel III repair systems cannot be combined on one unit.");
        }
        perLocation.forEach((count, key) => {
            const [group, location] = key.split("@");
            if (count > 1) violations.push(`Only one ${BattleMech.LOCATION_GROUP_NAMES[group] ?? group} may be mounted in a location (${location.toUpperCase()}).`);
        });
        // "If Artemis IV is added to an applicable launcher, every applicable launcher on the unit must have Artemis IV" (TM p.207);
        // the same holds for Artemis V, which "is incompatible with Artemis IV" (TO:AUE p.94).
        const fitted = ARTEMIS_FIRE_CONTROL.filter(system => mounted.some(item => item.tag.endsWith(system.suffix)));
        for (const system of fitted) {
            const plain = Array.from(new Set(mounted.filter(item => isArtemisCapableLauncher(item.tag, system.suffix)).map(item => item.name)));
            if (plain.length > 0) {
                violations.push(`${system.name} must be fitted to every applicable launcher on the unit (${plain.join(", ")} ${plain.length > 1 ? "have" : "has"} none).`);
            }
        }
        if (fitted.length > 1 && fitted.some(system => system.suffix === "-artemis-v")) violations.push("Artemis V cannot be mounted alongside Artemis IV (TO:AUE p.94).");
        if (this.isLAM()) {
            const maxTonnage = this.getLAMMaxTonnage();
            if (maxTonnage !== null && this._tonnage > maxTonnage) {
                violations.push(`${LAM_TYPE_RULES[this._lamType].name}s weigh at most ${maxTonnage} tons under these rules.`);
            }
            if (this._getLAMMinJumpMP() > 0 && this.getJumpSpeed() > this.getMaxJumpSpeed()) {
                violations.push(`${LAM_TYPE_RULES[this._lamType].name}s need at least ${this._getLAMMinJumpMP()} Jump MP, but Jump MP ${this.getJumpSpeed()} exceeds Walk MP ${this.getWalkSpeed()}; raise the engine rating.`);
            }
            // No equipment split across locations; spreadable equipment stays in one location
            // (IO:AE p.108, Extra-Large Weapons and Other Items).
            const locationsByKey = new Map<string, { name: string; locations: Set<string> }>();
            for (const area of Object.keys(this._criticals)) {
                for (const slot of this._criticals[area] ?? []) {
                    if (!slot?.obj || !slot.uuid) continue;
                    const obj = slot.obj as IEquipmentItem;
                    const key = obj.spreadSlots ? `tag:${obj.tag}` : slot.uuid;
                    const entry = locationsByKey.get(key) ?? { name: obj.name, locations: new Set<string>() };
                    entry.locations.add(area);
                    locationsByKey.set(key, entry);
                }
            }
            locationsByKey.forEach(({ name, locations }) => {
                if (locations.size > 1 && this._hasLAMLimits()) violations.push(`${name} must be allocated to a single location on a LAM.`);
            });
            const torsoBays = Object.values(this.getBombBaysByLocation()).reduce((sum, bays) => sum + bays, 0);
            const placedBays = this._equipmentList.filter(item => matchesTag(item, BattleMech.LAM_BOMB_BAY_TAG) && item.location).length;
            if (placedBays > torsoBays) {
                violations.push(`${placedBays - torsoBays} Bomb Bay(s) are outside the side torsos; LAM bomb bays go only in the left or right torso (IO:AE p.108).`);
            }
        }
        return violations;
    }

    public isUnderStrength(): boolean {

        if(
            this.getArmorPercentage() !== 100
            ||
            this.getStructurePercentage() !== 100
            ||
            this.currentHeat > 0
        ) {
            return true;
        }

        if(
            this.engineHits() > 0
            ||
            this.gyroHits() > 0
            ||
            this.sensorHits() > 0
            ||
            this.lifeSupportHits() > 0
        ) {
            return true;
        }

        for( const area of Object.keys(this._criticals) )  {
            for( const crit of this._criticals[area] ) {
                if( crit && crit.damaged ) {
                    return true;
                }
            }
        }

        if( this.pilot.wounds > 0 )
            return true;


        return false;
    }

    public resetDamage(): void {
        // Safely iterate across whatever location arrays exist on this chassis inventory matrix
        const criticalAreas = Object.keys(this._criticals) as Array<keyof typeof this._criticals>;
        for (const area of criticalAreas) {
            const slotArray = this._criticals[area];
            if (Array.isArray(slotArray)) {
                for (let critC = 0; critC < slotArray.length; critC++) {
                    const component = slotArray[critC];
                    if (component && component.damaged) {
                        component.damaged = false;
                    }
                }
            }
        }
        // Clear allocated equipment table tracking rows
        for (let critC = 0; critC < this._criticalAllocationTable.length; critC++) {
            const component = this._criticalAllocationTable[critC];
            if (component && component.damaged) {
                component.damaged = false;
            }
        }

        // CHASSIS-AWARE BUBBLE SCRUBBER UTIL, or as I like to call it, Mr. Clean!
        // Safely process and true-out boolean arrays across whatever keys exist on bubble allocation states
        const resetBubbleMatrix = (bubbleObject: any) => {
            if (!bubbleObject) return;
            const locations = Object.keys(bubbleObject);
            for (const loc of locations) {
                const arr = bubbleObject[loc];
                if (Array.isArray(arr)) {
                    for (let i = 0; i < arr.length; i++) {
                        arr[i] = true; // Repair/Heal the specific sheet point box index
                    }
                }
            }
        };
        // Sequentially repair internal structure lines and external armor sheets for all active configurations
        resetBubbleMatrix(this._armorBubbles);
        resetBubbleMatrix(this._structureBubbles);
        // CORE METRIC RECOVERY RESETS
        this.currentHeat = 0;
        this.futureWarsPlay = {};
        this.jumpPackFuelUsed = 0;
        this.jumpPackLost = "";
        if (this.pilot) {
            this.pilot.wounds = 0;
        }
    }
    public get isOmnimech(): boolean {
        return this._omnimech;
    }

    public setName(
        newValue: string,
    ): string {
        this._name = newValue;
        return this._name;
    }

    public get name(): string {
        return this._name;
    }

    public getTonnage() {
        return this._tonnage;
    }

    /** The chassis name, e.g. "Archer". */
    public getChassisName(): string {
        return this._name;
    }

    /** The model designation, e.g. "ARC-2R". */
    public getModelName(): string {
        return this._model;
    }

    public setTonnage(tonnage: number): number {
      this._tonnage = tonnage;
    
      // Get the current active mech configuration type tag key
      const mechTypeKey = this.getMechType().tag as keyof typeof this._selectedInternalStructure.perMechType;
      // Fetch the normalized structural data block for this specific tonnage
      // An earlier edition's own Internal Structure Table comes first (Battledroids' runs down to 5 tons, BD p.24).
      const listedStructure = this._selectedInternalStructure.perMechType[mechTypeKey][this.getTonnage()];
      // A 5-ton Power Armor suit has its own row (Best-of p.16), whatever the structure type.
      const editionBoxes = this._isFiveTonPowerArmor() ? { ...POWER_ARMOR_FIVE_TON_STRUCTURE }
        : getEditionStructure(mechInternalStructureTypes[0], this._rulesEdition, this.getTonnage(), !listedStructure);
      const structureData: IInternalStructurePerTon = editionBoxes ? {
        tonnage: this.getTonnage(), head: editionBoxes.head, centerTorso: editionBoxes.ct, leftTorso: editionBoxes.torso, rightTorso: editionBoxes.torso,
        leftLeg: editionBoxes.leg, rightLeg: editionBoxes.leg,
        ...(mechTypeKey === "quad" || mechTypeKey === "quadvee"
          ? { frontLeftLeg: editionBoxes.leg, frontRightLeg: editionBoxes.leg }
          : { leftArm: editionBoxes.arm, rightArm: editionBoxes.arm }),
        ...(mechTypeKey === "tripod" ? { centerLeg: editionBoxes.leg } : {}),
      } : listedStructure;
      // Assigning core internal structure properties. Clell Flint's head has 3 to 6 points by class (Best-of p.35).
      this._internalStructure.head = this.usesFutureWarsConstruction()
        ? getFutureWarsWeightClass(tonnage)!.headStructure
        : structureData.head;
      this._internalStructure.centerTorso = structureData.centerTorso;
      this._internalStructure.leftTorso = structureData.leftTorso;
      this._internalStructure.rightTorso = structureData.rightTorso;
      // Handling the alternate limb layouts (Arms vs. Front Legs)
      if ('leftArm' in structureData && !this.isArmless()) {
        this._internalStructure.leftArm = structureData.leftArm ?? 0;
      } else {
        this._internalStructure.leftArm = 0;
      }
      if ('rightArm' in structureData && !this.isArmless()) {
        this._internalStructure.rightArm = structureData.rightArm ?? 0;
      } else {
        this._internalStructure.rightArm = 0;
      }
      // leftLeg and rightLeg equate to the rear legs on Quads and QuadVees.
      if ('leftLeg' in structureData) {
        this._internalStructure.leftLeg = structureData.leftLeg ?? 0;
        this._internalStructure.rightLeg = structureData.rightLeg ?? 0;
      }
      // For tripods
      if ('centerLeg' in structureData) {
        this._internalStructure.centerLeg = structureData.centerLeg ?? 0;
      } else {
        this._internalStructure.centerLeg = 0;
      }
      // For quads and quadvees
      if ('frontLeftLeg' in structureData) {
        this._internalStructure.frontLeftLeg = structureData.frontLeftLeg ?? 0;
        this._internalStructure.frontRightLeg = structureData.frontRightLeg ?? 0;
      } else {
        this._internalStructure.frontLeftLeg = 0;
        this._internalStructure.frontRightLeg = 0;
      }
      // A FrankenMech location keeps the structure of the 'Mech it came from (CO p.213).
      this._applyFrankenMechStructure(mechTypeKey);

      // Establish core fixed armor allocations (Head maximum is 9, or Flint's; Torsos carry 2x internal structure)
      this._maxArmor = this.getMaxHeadArmor() +
        (this._internalStructure.centerTorso * 2) + 
        (this._internalStructure.leftTorso * 2) + 
        (this._internalStructure.rightTorso * 2);

      const typeTag = this._mechType.tag.toLowerCase();

      // Dynamically calculate Limb Armor additions based on anatomical layout rules
      if (typeTag === "biped" || typeTag === "lam") {
        this._maxArmor += 
          ((this._internalStructure.leftArm || 0) * 2) + 
          ((this._internalStructure.rightArm || 0) * 2) + 
          (this._internalStructure.leftLeg * 2) + 
          (this._internalStructure.rightLeg * 2);
      } else if (typeTag === "quad" || typeTag === "quadvee") {
        this._maxArmor += 
          (this._internalStructure.frontLeftLeg * 2) + 
          (this._internalStructure.frontRightLeg * 2) + 
          (this._internalStructure.leftLeg * 2) + 
          (this._internalStructure.rightLeg * 2);
          // Sync legacy tracking hooks to keep structural indices consistent
          this._internalStructure.rightArm = this._internalStructure.rightLeg;
          this._internalStructure.leftArm = this._internalStructure.leftLeg;
      } else if (typeTag === "tripod") {
        this._maxArmor += 
          ((this._internalStructure.leftArm || 0) * 2) + 
          ((this._internalStructure.rightArm || 0) * 2) + 
          (this._internalStructure.leftLeg * 2) + 
          (this._internalStructure.rightLeg * 2) + 
          (this._internalStructure.centerLeg * 2);
      } else {
        // Fallback catch-all for unknown layout types
        this._maxArmor += 
          ((this._internalStructure.leftArm || 0) * 2) + 
          ((this._internalStructure.rightArm || 0) * 2) + 
          (this._internalStructure.leftLeg * 2) + 
          (this._internalStructure.rightLeg * 2);
      }
      // Sum up cumulative structural integrity profile points across active locations
      this._totalInternalStructurePoints = 
        this._internalStructure.head +
        this._internalStructure.centerTorso +
        this._internalStructure.leftTorso +
        this._internalStructure.rightTorso;

      if (typeTag === "quad" || typeTag === "quadvee") {
        this._totalInternalStructurePoints += 
          this._internalStructure.frontLeftLeg + 
          this._internalStructure.frontRightLeg + 
          this._internalStructure.leftLeg + 
          this._internalStructure.rightLeg;
      } else {
        this._totalInternalStructurePoints += 
          (this._internalStructure.leftArm || 0) + 
          (this._internalStructure.rightArm || 0) + 
          this._internalStructure.leftLeg + 
          this._internalStructure.rightLeg;
            
        if (typeTag === "tripod") {
          this._totalInternalStructurePoints += (this._internalStructure.centerLeg || 0);
        }
      }

      this.setWalkSpeed(this._walkSpeed > 0 ? Math.max(this._walkSpeed, this.getMinWalkSpeed()) : this._walkSpeed);
      this._calc();

      return this._tonnage;
    }

        public getMaxArmorTonnage(
            armorTag: string = this.getArmorType(),
            techBase: "is" | "clan" = this.getArmorTechBase()
        ): number {
      // Dynamically retrieve the absolute maximum armor points configured for this chassis layout
            const totalPoints = this.getChassisMaxArmor();
    
      // Locate the armor data object by its unique tag identifier from our data file
      const armorData = findByTag(mechArmorTypes, armorTag);
    
      // Fall back to a standard 16 points/ton if tag is missing or data is malformed
      const pointsPerTon = armorData?.armorMultiplier[techBase] || 16;

      // Calculate raw fractional tonnage required
      const rawTonnage = totalPoints / pointsPerTon;
    
      // BattleTech armor must be purchased and allocated in half-ton (0.5) steps.
      // Multiplying by 2, rounding up, and dividing by 2 snaps it perfectly to the next half-ton.
      return Math.ceil(rawTonnage * 2) / 2;
    }

    public getMaxArmor(): number {
            return this.getChassisMaxArmor();
        }

    /** True when each torso's front and rear armor are capped apart, each at twice its boxes (BD p.25, BT2 p.40, BTM p.80). */
    public torsoArmorSectionsApart(): boolean {
        return this.usesEarlierRulesEdition() && getRulesEdition(this._rulesEdition).torsoArmorSectionsApart === true;
    }

        private getChassisMaxArmor(torsoSections: number = this.torsoArmorSectionsApart() ? 2 : 1): number {
      // Dynamic fallback calculation: Head maximum is 9; Torso locations carry 2x internal structure, front and
      // rear together, or each section apart through the BattleTech Manual (BD p.25, BT2 p.40, BTM p.80)
      let totalMaxArmor = this.getMaxHeadArmor() +
        (this._internalStructure.centerTorso * 2 * torsoSections) + 
        (this._internalStructure.leftTorso * 2 * torsoSections) + 
        (this._internalStructure.rightTorso * 2 * torsoSections);

      const typeTag = this._mechType.tag.toLowerCase();

      // Dynamically calculate and add limb armor caps based on chassis anatomy layout
      if (typeTag === "biped" || typeTag === "lam") {
        totalMaxArmor += 
          ((this._internalStructure.leftArm || 0) * 2) + 
          ((this._internalStructure.rightArm || 0) * 2) + 
          (this._internalStructure.leftLeg * 2) + 
          (this._internalStructure.rightLeg * 2);
      } else if (typeTag === "quad" || typeTag === "quadvee") {
        totalMaxArmor += 
                    ((this._internalStructure.frontLeftLeg ?? 0) * 2) +
                    ((this._internalStructure.frontRightLeg ?? 0) * 2) +
          (this._internalStructure.leftLeg * 2) + 
          (this._internalStructure.rightLeg * 2);
      } else if (typeTag === "tripod") {
        totalMaxArmor += 
          ((this._internalStructure.leftArm || 0) * 2) + 
          ((this._internalStructure.rightArm || 0) * 2) + 
          (this._internalStructure.leftLeg * 2) + 
          (this._internalStructure.rightLeg * 2) + 
          ((this._internalStructure.centerLeg ?? 0) * 2);
      } else {
        // Standard catch-all anatomy fallback
        totalMaxArmor += 
          ((this._internalStructure.leftArm || 0) * 2) + 
          ((this._internalStructure.rightArm || 0) * 2) + 
          (this._internalStructure.leftLeg * 2) + 
          (this._internalStructure.rightLeg * 2);
      }

      return totalMaxArmor;
    }

    public getType() {
      return this._mechType;
    }

        public getQuadVeeMotive(): "tracked" | "wheeled" {
            return this._quadVeeMotive;
        }

        public getQuadVeeVehicleCruiseMP(): number {
            if (!this.isQuadVee()) {
                return 0;
            }
            if (this.hasMotiveSystemDamage()) {
                return 0;
            }
            const cruiseMP = this._walkSpeed + (this._quadVeeMotive === "wheeled" ? 1 : 0);
            return Math.max(0, cruiseMP - this._modularArmorMPPenalty());
        }

        public getTransformationMode(): "mech" | "airmech" | "aerospace" | "vehicle" {
            return this._transformationMode;
        }

        public setTransformationMode(mode: string): "mech" | "airmech" | "aerospace" | "vehicle" {
            const requestedMode = mode.toLowerCase();
            const allowedModes = this.isLAM()
                ? LAM_TYPE_RULES[this._lamType].modes
                : this.isQuadVee()
                        ? ["mech", "vehicle"]
                        : ["mech"];

            this._transformationMode = (allowedModes.includes(requestedMode) ? requestedMode : allowedModes[0]) as typeof this._transformationMode;
            return this._transformationMode;
        }

        public canUseJumpJetsInCurrentMode(): boolean {
            if (this.isQuadVee()) {
                return this._transformationMode === "mech";
            }
            // Bipeds, Quads, Tripods and LAMs (in every LAM mode) may use their jump jets.
            return true;
        }

        public canUsePhysicalAttacksInCurrentMode(): boolean {
            return !this.isLAM() || this._transformationMode === "mech";
        }

        public hasFullTorsoTwist(): boolean {
            return this.isTripod() || this.isQuadVee();
        }

        public getPilotingSkillModifier(): number {
            // Enhanced Imaging: every Piloting Skill Roll -1 (Maximum Tech p.61; IO:AE p.69).
            return (this.isTripod() ? -1 : 0) + (this.hasActiveModularArmor() ? 1 : 0) + this.getFrankenMechLegPilotingModifier()
                + (this.isEnhancedImagingActive() ? -1 : 0)
                // Torso-Mounted Cockpit, blinded: three sensor hits, or two both in the head (TO:AUE p.113).
                + (this.getCockpitType().tag === "torso-mounted" && (this.sensorHits() >= 3 || this.sensorHits(["hd"]) >= 2) ? 4 : 0)
                + this.getPowerArmorPilotingModifier();
        }

        /** A 5-ton Power Armor suit has no gyro: a pilot of Piloting 4 is +2 on every Piloting Skill Roll (Best-of p.16; #172). */
        public getPowerArmorPilotingModifier(): number {
            return this._isFiveTonPowerArmor() && this._pilot.piloting === 4 ? 2 : 0;
        }

        public ignoresSecondaryTargetModifier(): boolean {
            return this.isTripod();
        }

        public getAttackerMovementModifier(): number {
            return this.isLAM() && this._transformationMode === "airmech" ? 3 : 0;
        }

        public canUseHullDownRules(): boolean {
            return this.isQuadVee() && this._transformationMode === "vehicle";
        }

        public getOperationalHeightLevels(): number {
            if (this.isQuadVee() && this._transformationMode === "vehicle") {
                return 1;
            }
            return 2;
        }

        public canOperateAfterGyroFailure(): boolean {
            return this.isQuadVee() && this._transformationMode === "vehicle";
        }

        public hasMotiveSystemDamage(): boolean {
            if (!this.isQuadVee() || this._transformationMode !== "vehicle") {
                return false;
            }
            return ["fll", "frl", "ll", "rl"].some(location =>
                (this._criticals as any)[BattleMech.MECH_LOCATION_MAP[location]]?.some((item: ICriticalSlot | null) =>
                    !!item && matchesTag(item, "quadvee-conversion") && item.damaged
                )
            );
        }

        public getLAMType(): LAMType {
            return this._lamType;
        }

        public isVTOLAM(): boolean {
            return this.isLAM() && !!LAM_TYPE_RULES[this._lamType].vtolCruise;
        }

        /** A Custom Homebrew single-mode LAM, always in AirMech mode (LAM_TYPE_RULES.pam). */
        public isPermanentAirMech(): boolean {
            return this.isLAM() && this._lamType === "pam";
        }

        public isBimodalLAM(): boolean {
            return this.isLAM() && this._lamType === "bimodal";
        }

        public setLAMType(lamType: string): LAMType {
            const requested = lamType.toLowerCase();
            this._lamType = requested in LAM_TYPE_RULES ? requested as LAMType : "standard";
            if (!this._hasLAMLimits()) this._omnimech = false;
            this.setTransformationMode(this._transformationMode);
            const maxTonnage = this.getLAMMaxTonnage();
            if (maxTonnage !== null && this._tonnage > maxTonnage) this.setTonnage(maxTonnage);
            this._calc();
            return this._lamType;
        }

        public setQuadVeeMotive(motive: string): "tracked" | "wheeled" {
            this._quadVeeMotive = motive.toLowerCase() === "wheeled" ? "wheeled" : "tracked";
            this._calc();
            return this._quadVeeMotive;
        }

    public setType(typeTag: string) {
      // Normalize to lowercase for clean matching
      const formattedTag = typeTag.toLowerCase();
    
      for (const mechType of mechTypeOptions) {
        if (mechType.tag.toLowerCase() === formattedTag || matchesTag(mechType, formattedTag)) {
            this._mechType = mechType;
            if (formattedTag === "tripod" || formattedTag === "lam") {
                this._omnimech = false;
            }
            if (formattedTag !== "quadvee") {
                this._quadVeeMotive = "tracked";
            }
            if (formattedTag !== "lam") {
                this._lamType = "standard";
            }
            this._transformationMode = "mech";
            
            // Trigger cascading refresh of internal structure layouts and armor capacities
            this.setTonnage(this._tonnage);
            this.allocateArmorClear();
            this.clearCriticalAllocationTable();
            
            // Structural anatomy edge-cases: Clear or lock arm slots for limb-based vehicles
            if (formattedTag === "quad" || formattedTag === "quadvee") {
                this._clearArmCriticalAllocationTable();
            }
            
            this._calc();
            return this._mechType;
          }
        }
    }

    public exportJSON(
        noInPlayVariables: boolean = false,
    ): string {
        return JSON.stringify( this.export(noInPlayVariables) )
    }

    public exportCanonical(
        noInPlayVariables: boolean = false,
        source?: ICanonicalSourceMetadata,
    ): ICanonicalBattleMechRecord {
        return toCanonicalBattleMechRecord(this.export(noInPlayVariables), source);
    }

    public getTargetSummaryText(
        target: string
    ): string {
        const targetData = this.getTarget(target);

        if( targetData ) {
            if( targetData.active ) {
                return "MOVE: " + targetData.movement + " | RANGE: "+ targetData.range + " | OTHER: " + targetData.otherMods;
            } else {
                return "No Active Target";
            }
        }
        return "No Active Target";
    }

    public export(
        noInPlayVariables: boolean = false,
    ):IBattleMechExport {
        this._calc();
        this.calcAlphaStrike();

        // In Play Variables
        let _currentHeat = 0;

        let _targetAToHit: ITargetToHit | null = null;
        let _targetBToHit: ITargetToHit | null = null;
        let _targetCToHit: ITargetToHit | null = null;

        let _armorBubbles: IMechDamageAllocation | null = null;
        let _structureBubbles: IMechDamageAllocation | null = null;

        let _selectedMech = false;

        let _currentMovementMode = "";
        let _currentToHitMovementModifier = -1;
        let _currentTargetModifier = 0;
        let _currentTargetJumpingMP = 0;

        if( !noInPlayVariables ) {
            _currentHeat = this.currentHeat;

            _targetAToHit = this._targetAToHit;
            _targetBToHit = this._targetBToHit;
            _targetCToHit = this._targetCToHit;

            _armorBubbles = this._armorBubbles;
            _structureBubbles = this._structureBubbles;
            _selectedMech = this.selectedMech;

            _currentMovementMode = this.currentMovementMode;
            _currentToHitMovementModifier = this.currentToHitMovementModifier;
            _currentTargetModifier = this.currentTargetModifier;
            _currentTargetJumpingMP = this.currentTargetJumpingMP;
        }
        const thinnedAllocations: ICriticalSlot[] = JSON.parse(JSON.stringify(this._criticalAllocationTable));


        for( const alloc of thinnedAllocations ) {
            delete alloc.obj
            delete alloc.damaged
        }

        const exportObject: IBattleMechExport = {


            // Non In-Play Variables
            // important info at the top for easy perusing
            model: this._model,
            name: this._name,
            tech: this._tech.tag,
            tech_label: this.getTech().name,
            tonnage: this.getTonnage(),
            as_role: this._alphaStrikeForceStats.role,
            as_value: this.getAlphaStrikeValue(),
            as_special_ammo_tag: this.getAlphaStrikeSpecialAmmoTag(),
            battle_value: this.getBattleValue(),
            c_bills: this.getCBillCost(),

            omnimech: this._omnimech,

            additionalHeatSinks: this._additionalHeatSinks,
            allocation: thinnedAllocations,
            armor_allocation: this._armorAllocation,
            armor_type: this.getArmorType(),
            patchworkArmor: this.isPatchworkArmor()
                ? Object.fromEntries(this.getPatchworkLocations().map(location => [location.key, this.getPatchworkArmorType(location.key).tag]))
                : undefined,
            frankenMech: this._frankenMech
                ? {
                    donors: Object.fromEntries(this.getFrankenMechLocations().map(location => [location.key, this.getFrankenMechDonor(location.key)])),
                    jumpJetClass: this.getFrankenMechJumpJetClass() ?? undefined,
                }
                : undefined,
            armor_weight: this._armorWeight,
            weight_accounting: this.usesFractionalAccounting() ? "fractional" : undefined,
            fractional_armor_points: this.usesFractionalAccounting() ? this._fractionalArmorPoints : undefined,
            engineType: this.getEngineType().tag,
            engineTechBase: this.getEngineTechBase(),
            mixedTechBases: (this._isMixedTechBase() || this.getTech().tag === "clan") && Object.keys(this._mixedTechBases).length > 0 ? { ...this._mixedTechBases } : undefined,
            equipment: [],
            era: this._era.tag,
            rulesEdition: this._rulesEdition === DEFAULT_RULES_EDITION ? undefined : this._rulesEdition,
            printedDroid: this._printedDroid,
            rulesEditionReturn: this._rulesEditionReturn,
            rulesLevel: this._rulesLevel,
            rulesets: this._rulesets.length > 0 ? [...this._rulesets] : undefined,
            futureWarsLargeCockpit: this._futureWarsLargeCockpit || undefined,
            extraSensors: this._extraSensors || undefined,
            extraLifeSupport: this._extraLifeSupport || undefined,
            features: [],
            gyro: this._gyro.tag,
            heat_sink_type: this.getHeatSinksType(),
            jump_jet_type: this._jumpJetType.tag,
            myomer_type: this._myomerType.tag,
            hideNonAvailableEquipment: this._hideNonAvailableEquipment,
            introductoryRules: this._introductoryRules,
            is_type: this.getInternalStructureType(),
            jumpSpeed: this._jumpSpeed,
            ...(this.getJumpPackTons() > 0 ? { jumpPackTons: this.getJumpPackTons() } : {}),
            lastUpdated: this.lastUpdated,
            mechType: this._mechType.tag,
            quadVeeMotive: this._quadVeeMotive,
            lamType: this._lamType,
            bombLoadout: Object.keys(this._bombLoadout).length ? { ...this._bombLoadout } : undefined,
            transformationMode: this._transformationMode,
            mirrorArmorAllocations: this._mirrorArmorAllocations,
            nickname: this._nickname,
            strictEra: this._strictEra,
            uuid: this._uuid,
            walkSpeed: this._walkSpeed,
            quirks: this.quirks.export(),
            tro: this.tro.export(),
        };

        if( !noInPlayVariables ) {
            exportObject.as_custom_nickname = this._alphaStrikeForceStats.customName;
            exportObject.pilot = this._pilot.export();
            exportObject.armorBubbles = _armorBubbles;
            exportObject.criticalDamage = this.criticalDamage;
            exportObject.currentHeat = _currentHeat;
            exportObject.currentMovementMode =_currentMovementMode;
            if( this.targetingRangeSetting !== "normal" ) exportObject.targetingRangeSetting = this.targetingRangeSetting;
            if( this.enhancedImagingOff ) exportObject.enhancedImagingOff = true;
            exportObject.currentTargetJumpingMP =_currentTargetJumpingMP;
            if( !noInPlayVariables && this.jumpPackFuelUsed ) exportObject.jumpPackFuelUsed = this.jumpPackFuelUsed;
            if( !noInPlayVariables && this.jumpPackLost ) exportObject.jumpPackLost = this.jumpPackLost;
            if( !noInPlayVariables && Object.keys(this.futureWarsPlay).length ) exportObject.futureWarsPlay = JSON.parse(JSON.stringify(this.futureWarsPlay));
            exportObject.currentTargetModifier =_currentTargetModifier;
            exportObject.currentToHitMovementModifier =_currentToHitMovementModifier;
            exportObject.damageLog = this.damageLog;
            exportObject.selectedMech = _selectedMech;
            exportObject.structureBubbles = _structureBubbles;
            exportObject.targetAToHit = _targetAToHit;
            exportObject.targetBToHit = _targetBToHit;
            exportObject.targetCToHit = _targetCToHit;
        }

        for( let countEQ = 0; countEQ < this._equipmentList.length; countEQ++) {
            exportObject.equipment.push( this._exportEquipmentItem( this._equipmentList[countEQ], noInPlayVariables ) );
        }

        if( this._omnimech ) {
            this._storeActiveOmniConfiguration();
            exportObject.omniConfigurations = JSON.parse(JSON.stringify(this._omniConfigurations));
            exportObject.activeOmniConfiguration = this._activeOmniConfiguration;
            if( this._omniBaseHeatSinks !== undefined ) exportObject.omniBaseHeatSinks = this._omniBaseHeatSinks;
            if( this._omniBaseJumpSpeed !== undefined ) exportObject.omniBaseJumpSpeed = this._omniBaseJumpSpeed;
        }

        if( !this.hasLowerArmActuator( "la" ))
            exportObject.features.push( "no_lala" );
        if( !this.hasLowerArmActuator( "ra" ))
            exportObject.features.push( "no_rala" );
        if( !this.hasHandActuator( "la" ))
            exportObject.features.push( "no_laha" );
        if( !this.hasHandActuator( "ra" ))
            exportObject.features.push( "no_raha" );
        if( this._smallCockpit)
            exportObject.features.push( "sm_cockpit" );
        if( this._torsoMountedCockpit)
            exportObject.features.push( "torso_cockpit" );
        if( this._interfaceCockpit)
            exportObject.features.push( "interface_cockpit" );
        // Smart Robotic Control System (IO:AE p.134): its tag, "srcs" or "srcs-improved".
        if( this._roboticControl !== "none" )
            exportObject.features.push( this._roboticControl );
        // IndustrialMech cockpit with the Advanced Fire Control enhancement (TM p.69).
        if( this._advancedFireControl)
            exportObject.features.push( "afc" );
        // Cockpit Command Console (TO:AUE p.112).
        if( this.hasCommandConsole())
            exportObject.features.push( "command_console" );
        // Enhanced Imaging (Maximum Tech pp.60-61; IO:AE p.69).
        if( this.hasEnhancedImaging())
            exportObject.features.push( "enhanced_imaging" );
        // Built without arms (Maximum Tech p.62).
        if( this.isArmless())
            exportObject.features.push( "armless" );
        // Built under the Primitive 'Mech rules (IO:AE pp.116-118).
        if( this._primitive)
            exportObject.features.push( "primitive" );
        // Clan CASE on an Inner Sphere-base Mixed Tech design.
        if( this._clanCASE && this.canChooseClanCASE() )
            exportObject.features.push( "clan_case" );
        if( this._armoredSlots.size > 0 )
            exportObject.armored_components = [ ...this._armoredSlots ].sort();


            return exportObject;
    }

    private _exportEquipmentItem( item: IEquipmentItem, noInPlayVariables: boolean ): IBMEquipmentExport {
        const exported: IBMEquipmentExport = {
            tag: item.tag,
            loc: item.location,
            allocationIndex: typeof(item.allocationIndex) !== "undefined" ? item.allocationIndex : -1,
            allocationLocation: typeof(item.allocationLocation) !== "undefined" ? item.allocationLocation : "",
            rear: item.rear,
            uuid: item.uuid,
            weight: item.weight,
            split_location: item.split_location,
            feedsWeaponTag: item.feedsWeaponTag,
            currentAdditionalArmor: item.currentAdditionalArmor,
            size: item.size,
            omniFixed: item.omniFixed || undefined,
            armored: item.armored || undefined,
            turret: item.turret || undefined,
        };
        if( !noInPlayVariables ) {
            exported.target = item.target;
            exported.resolved = item.resolved;
            exported.damageClusterHits = item.damageClusterHits;
            exported.currentAmmo = item.currentAmmo;
            exported.selectedAmmoBinUUID = item.selectedAmmoBinUUID;
            exported.shieldDamage = item.shieldDamage;
        }
        return exported;
    }

    /** Re-creates one saved equipment item (import and OmniMech configuration switching). */
    private _restoreEquipmentItem( importItem: IBMEquipmentExport ): IEquipmentItem | null {
        // A saved design keeps whatever it mounted: Custom Homebrew, and equipment that has since
        // moved to the other tech base's catalog. The tech and rules-level filters limit what can be
        // added, not what can be loaded. Canon comes first, so a custom record can never capture a
        // canon save, and the design's own tech base before the other one.
        const restoreFrom = ( equipmentListTag: string, includeCustom: boolean ) => this.addEquipmentFromTag(
            importItem.tag,
            equipmentListTag,
            importItem.loc,
            importItem.rear ? true : false,
            importItem.uuid,
            importItem.target || "",
            importItem.resolved ? true : false,
            undefined,
            importItem.weight,
            importItem.split_location,
            importItem.currentAmmo,
            importItem.selectedAmmoBinUUID,
            includeCustom,
        );
        const techTag = this.getTech().tag;
        const otherTechTag = techTag === "clan" ? "mclan" : techTag === "is" ? "mis" : null;
        const restoredEquipment = restoreFrom(techTag, false)
            ?? (otherTechTag ? restoreFrom(otherTechTag, false) : null)
            ?? restoreFrom(techTag, true)
            ?? (otherTechTag ? restoreFrom(otherTechTag, true) : null);
        if (restoredEquipment && typeof importItem.currentAdditionalArmor === "number") {
            restoredEquipment.currentAdditionalArmor = importItem.currentAdditionalArmor;
        }
        if (restoredEquipment && typeof importItem.shieldDamage === "number") {
            restoredEquipment.shieldDamage = importItem.shieldDamage;
        }
        if (restoredEquipment && typeof importItem.size === "number") {
            restoredEquipment.size = importItem.size;
        }
        if (restoredEquipment && importItem.omniFixed) {
            restoredEquipment.omniFixed = true;
        }
        if (restoredEquipment && importItem.armored) {
            restoredEquipment.armored = true;
        }
        if (restoredEquipment && importItem.turret) {
            restoredEquipment.turret = true;
        }
        if (restoredEquipment && importItem.feedsWeaponTag) {
            restoredEquipment.feedsWeaponTag = importItem.feedsWeaponTag;
        }
        return restoredEquipment;
    }

    public setASRole(
        newValue: string,
    ) {
        return this._alphaStrikeForceStats.role = newValue;
    }

    public getASRole(): string {
        return this._alphaStrikeForceStats.role;
    }

    public setASCustomName(
        newValue: string,
    ) {
        return this._alphaStrikeForceStats.customName = newValue;
    }

    public getASCustomName() {
        return this._alphaStrikeForceStats.customName;
    }

    importJSON(
        jsonString: string,
    ) {
        let importObject: IBattleMechExport | null = null;
        try {
            importObject = parseBattleMechRecordJSON(jsonString);
            return this.import( importObject );
        } catch {
            return false;
        }
    }

    public cycleWeaponTarget(
        weaponIndex: number
    ) {
        if( this._equipmentList.length > weaponIndex ) {
            if( typeof(this._equipmentList[weaponIndex].target) === "undefined" ) {
                this._equipmentList[weaponIndex].target = "";
            }

            if( this._equipmentList[weaponIndex].target === "" ) {
                if( this._targetAToHit && this._targetAToHit.active ) {
                    this._equipmentList[weaponIndex].target = "a";
                    return;
                }
                if( this._targetBToHit && this._targetBToHit.active ) {
                    this._equipmentList[weaponIndex].target = "b";
                    return;
                }
                if( this._targetCToHit && this._targetCToHit.active ) {
                    this._equipmentList[weaponIndex].target = "c";
                    return;
                }
                console.warn( "cycleWeaponTarget No Active Targets!" )
                return;
            }

            if( this._equipmentList[weaponIndex].target === "a" ) {
                if( this._targetBToHit && this._targetBToHit.active ) {
                    this._equipmentList[weaponIndex].target = "b";
                    return;
                } else if( this._targetCToHit && this._targetCToHit.active ) {
                    this._equipmentList[weaponIndex].target = "c";
                    return;
                } else {
                    this._equipmentList[weaponIndex].target = "";
                    return;
                }
            }

            if( this._equipmentList[weaponIndex].target === "b" ) {
                if( this._targetCToHit && this._targetCToHit.active ) {
                    this._equipmentList[weaponIndex].target = "c";
                    return;
                } else {
                    this._equipmentList[weaponIndex].target = "";
                    return;
                }
            }

            if( this._equipmentList[weaponIndex].target === "c" ) {
                this._equipmentList[weaponIndex].target = "";
                return;
            }
        }
    }

    import(
        importObject: IBattleMechExport,
    ) {
        // A saved design keeps the accounting it was saved with, battle armor items or not.
        this._importing = true;
        try {
            return this._importRecord( importObject );
        } finally {
            this._importing = false;
            this._hadBattleArmorEquipment = this.defaultsToFractionalAccounting();
        }
    }

    private _importRecord(
        importObject: IBattleMechExport,
    ) {

        this.quirks.import(importObject?.quirks);
        this.tro.import(importObject?.tro);

        this.selectedMech = false;
        if( importObject && importObject.selectedMech ) {
            this.selectedMech = true;
        }

        if( importObject && importObject.criticalDamage ) {
            this.criticalDamage = importObject.criticalDamage;
        }

        if( importObject && importObject.omnimech ) {
            this._omnimech = importObject.omnimech;
        }

        if( importObject && importObject.currentHeat ) {
            this.currentHeat = importObject.currentHeat;
        }

        if( importObject && importObject.damageLog ) {
            this.damageLog = importObject.damageLog;
        }

        if( importObject && importObject.targetAToHit ) {
            this._targetAToHit = importObject.targetAToHit;
        }
        if( importObject && importObject.targetBToHit ) {
            this._targetBToHit = importObject.targetBToHit;
        }
        if( importObject && importObject.targetCToHit ) {
            this._targetCToHit = importObject.targetCToHit;
        }
        if( importObject && importObject.lastUpdated ) {
            this.lastUpdated = new Date(importObject.lastUpdated);
        }
        if( importObject && importObject.currentMovementMode ) {
            this.currentMovementMode = importObject.currentMovementMode;
        }
        this.targetingRangeSetting = importObject?.targetingRangeSetting ?? "normal";
        this.enhancedImagingOff = importObject?.enhancedImagingOff === true;
        this.jumpPackFuelUsed = importObject?.jumpPackFuelUsed ?? 0;
        this.futureWarsPlay = importObject?.futureWarsPlay && typeof importObject.futureWarsPlay === "object"
            ? JSON.parse(JSON.stringify(importObject.futureWarsPlay)) : {};
        this.jumpPackLost = importObject?.jumpPackLost ?? "";

        if( importObject && importObject.currentTargetModifier ) {
            this.currentTargetModifier = importObject.currentTargetModifier;
        }

        if( importObject && importObject.currentToHitMovementModifier ) {
            this.currentToHitMovementModifier = importObject.currentToHitMovementModifier;
        }

        if( importObject && importObject.currentTargetJumpingMP ) {
            this.currentTargetJumpingMP = importObject.currentTargetJumpingMP;
        }

        if( importObject && importObject.mechType  ) {
            if( importObject.name )
                this.setName(importObject.name);
            if( importObject.model )
                this.setModel(importObject.model);

            // console.log( "importObject.mechType", importObject.mechType );
            if( importObject.mechType)
                this.setMechType(importObject.mechType);
            // Before the tonnage and Walking MP: a Primitive 'Mech's engine rating depends on it.
            this._primitive = Array.isArray(importObject.features) && importObject.features.indexOf( "primitive" ) > -1;
            this._clanCASE = Array.isArray(importObject.features) && importObject.features.indexOf( "clan_case" ) > -1;
            this._armless = Array.isArray(importObject.features) && importObject.features.indexOf( "armless" ) > -1;
            this._armoredSlots = new Set( Array.isArray( importObject.armored_components )
                ? importObject.armored_components.filter( ( key ): key is string => typeof key === "string" )
                : [] );
            if (importObject.lamType) {
                this.setLAMType(importObject.lamType);
            }
            if (importObject.quadVeeMotive) {
                this.setQuadVeeMotive(importObject.quadVeeMotive);
            }
            if (importObject.transformationMode) {
                this.setTransformationMode(importObject.transformationMode);
            }

            // Before anything is mounted: the edition decides the stats of what is loaded.
            this._rulesEdition = getRulesEdition(importObject.rulesEdition).tag;
            this._rulesLevel = typeof importObject.rulesLevel === "number" ? importObject.rulesLevel : undefined;
            this._rulesets = Array.isArray(importObject.rulesets) ? importObject.rulesets.filter((id: unknown): id is string => typeof id === "string") : [];
            this._printedDroid = importObject.printedDroid || undefined;
            this._futureWarsLargeCockpit = importObject.futureWarsLargeCockpit === true;
            this._extraSensors = importObject.extraSensors === true;
            this._extraLifeSupport = importObject.extraLifeSupport === true;
            this._rulesEditionReturn = importObject.rulesEditionReturn || undefined;

            this.setTonnage(importObject.tonnage);

            if( importObject.lastUpdated ) {
                this._lastUpdated = new Date( importObject.lastUpdated )
            }

            this._mirrorArmorAllocations = false;
            if( importObject.mirrorArmorAllocations ) {
                this._mirrorArmorAllocations = true;
            }

            this._introductoryRules = false;
            if( importObject.introductoryRules ) {
                this._introductoryRules = true;
            }

            this._hideNonAvailableEquipment = importObject.hideNonAvailableEquipment;
            // Tech first: it decides which eras the saved era can be.
            if( importObject.tech)
                this.setTech(importObject.tech);

            if( importObject.era)
                this.setEra(importObject.era);

            if (importObject.engineTechBase) {
                this.setEngineTechBase(importObject.engineTechBase);
            }
            for (const component of ["structure", "armor", "heatSink"] as const) {
                // Stored as saved: the component itself is set further down, and the getters check the choice.
                const techBase = importObject.mixedTechBases?.[component];
                if (techBase === "is" || techBase === "clan") this._mixedTechBases[component] = techBase;
            }

            if( importObject.pilot)
                this._pilot = new Pilot(importObject.pilot);

            if( importObject.as_role)
                this.setASRole(importObject.as_role);

            // Structure before armor: Industrial structure makes an IndustrialMech, which the industrial armors need.
            if( importObject.is_type)
                this.setInternalStructureType(importObject.is_type);

            if( importObject.armor_type)
                this.setArmorType(importObject.armor_type);

            if( importObject.as_custom_nickname)
                this.setASCustomName(importObject.as_custom_nickname);

            if (importObject.as_special_ammo_tag) {
                this._alphaStrikeSpecialAmmoTag = importObject.as_special_ammo_tag;
            }

            // FrankenMech donors decide the structure points and weight; set after tonnage, type and structure,
            // and before the jump jets, whose count may depend on their size.
            this._frankenMech = false;
            this._frankenMechDonors = {};
            this._frankenMechJumpJetClass = null;
            const frankenMech = importObject.frankenMech;
            if (frankenMech && typeof frankenMech === "object" && this.setFrankenMech(true)) {
                const donors = frankenMech.donors && typeof frankenMech.donors === "object" ? frankenMech.donors : {};
                for (const location of this.getFrankenMechLocations()) {
                    const donor: unknown = donors[location.key];
                    if (!donor || typeof donor !== "object") continue;
                    const { tonnage, structure, name, structureTechBase, structureSlots } = donor as Record<string, unknown>;
                    this.setFrankenMechDonor(location.key, {
                        tonnage: typeof tonnage === "number" ? tonnage : undefined,
                        structure: typeof structure === "string" ? structure : undefined,
                        name: typeof name === "string" ? name : undefined,
                        structureTechBase: structureTechBase === "is" || structureTechBase === "clan" ? structureTechBase : undefined,
                        structureSlots: typeof structureSlots === "number" ? structureSlots : undefined,
                    });
                }
                const jetClass = this.getFrankenMechJumpJetClasses().find(candidate => candidate === frankenMech.jumpJetClass);
                if (jetClass) this._frankenMechJumpJetClass = jetClass;
            }

            if( importObject.walkSpeed)
                this.setWalkSpeed(importObject.walkSpeed);

            if( importObject.jumpSpeed)
                this.setJumpSpeed(importObject.jumpSpeed);
            this._jumpPackTons = importObject.jumpPackTons ?? 0;

            if( typeof(importObject.strictEra) !== "undefined" ) {
                if( importObject.strictEra)
                    this._strictEra = true;
                else
                    this._strictEra = false;
            }

            if( importObject.gyro)
                this.setGyroType(importObject.gyro);

            if( importObject.engineType)
                this.setEngineType(importObject.engineType);

            if( importObject.additionalHeatSinks)
                this.setAdditionalHeatSinks(importObject.additionalHeatSinks);

            if( importObject.heat_sink_type)
                this.setHeatSinksType(importObject.heat_sink_type);

            if( importObject.jump_jet_type)
                this.setJumpJetType(importObject.jump_jet_type);
            if( importObject.myomer_type)
                this.setMyomerType(importObject.myomer_type);

            // A saved design keeps its accounting whatever the rules level set now.
            this._weightAccounting = importObject.weight_accounting === "fractional" ? "fractional" : "standard";

            if( importObject.armor_weight)
                this.setArmorWeight(importObject.armor_weight);
            if( this.usesFractionalAccounting() && Number.isFinite(importObject.fractional_armor_points) ) {
                // Saved data is not trusted: never more points than the chassis can carry.
                this._fractionalArmorPoints = Math.max(0, Math.min(this.getChassisMaxArmor(), Math.floor(importObject.fractional_armor_points as number)));
            }

            if( importObject.armor_allocation)
                this._armorAllocation = importObject.armor_allocation;

            // Set after the structure and tech base, which decide what a location may carry.
            if (importObject.patchworkArmor && this.isPatchworkArmor()) {
                for (const [locationKey, armorTag] of Object.entries(importObject.patchworkArmor)) {
                    if (typeof armorTag === "string") this.setPatchworkArmorType(locationKey, armorTag);
                }
            }

            if( importObject.uuid)
                this._uuid = importObject.uuid;

            this._nickname = "";
            if( importObject.nickname)
                this._nickname = importObject.nickname;

            if( importObject.features) {

                // Lower Arm Actuators
                if( importObject.features.indexOf( "no_rala" ) > -1)
                    this.removeLowerArmActuator( "ra" );
                if( importObject.features.indexOf( "no_lala" ) > -1)
                    this.removeLowerArmActuator( "la" );

                // Hand Actuators
                if( importObject.features.indexOf( "no_raha" ) > -1)
                    this.removeHandActuator( "ra" );
                if( importObject.features.indexOf( "no_laha" ) > -1)
                    this.removeHandActuator( "la" );

                // Small Cockpit
                if( importObject.features.indexOf( "sm_cockpit" ) > -1)
                    this._smallCockpit = true;
                if( importObject.features.indexOf( "torso_cockpit" ) > -1)
                    this._torsoMountedCockpit = true;
                if( importObject.features.indexOf( "interface_cockpit" ) > -1)
                    this._interfaceCockpit = true;
                this._roboticControl = importObject.features.indexOf( "srcs-improved" ) > -1 ? "srcs-improved"
                    : importObject.features.indexOf( "srcs" ) > -1 ? "srcs" : "none";

                // IndustrialMech cockpit with Advanced Fire Control
                if( importObject.features.indexOf( "afc" ) > -1)
                    this._advancedFireControl = true;
                if( importObject.features.indexOf( "command_console" ) > -1)
                    this._commandConsole = true;
                if( importObject.features.indexOf( "enhanced_imaging" ) > -1)
                    this._enhancedImaging = true;

                // Other features
            }

            if( importObject.equipment) {
                for( let countEQ = 0; countEQ < importObject.equipment.length; countEQ++) {

                    const importItem = importObject.equipment[countEQ];

                    if( importItem.rear)
                        importItem.rear = true;
                    else
                        importItem.rear = false;

                    if( !importItem.target ) {
                        importItem.target = ""
                    }

                    if( !importItem.resolved ) {
                        importItem.resolved = false
                    }

                    if( !importItem.damageClusterHits ) {
                        importItem.damageClusterHits = []
                    }

                    this._restoreEquipmentItem( importItem );
                }
            }

            if( importObject.allocation) {

                importObject.allocation.sort(
                    (a, b) => {
                        if( a.uuid > b.uuid ) {
                            return -1;
                        } else if( a.uuid < b.uuid ) {
                            return 1;
                        } else {
                            return 0
                        }
                    }
                )

                // console.log( "importObject.allocation", this.getName(), importObject.allocation);
                this._criticalAllocationTable = importObject.allocation;

                for( let countEQ = 0; countEQ < this._criticalAllocationTable.length; countEQ++) {

                    this._criticalAllocationTable[countEQ].obj = this.getEquipmentByUUID( this._criticalAllocationTable[countEQ].uuid )

                    if( this._criticalAllocationTable[countEQ].rear)
                        this._criticalAllocationTable[countEQ].rear = true;
                    else
                        this._criticalAllocationTable[countEQ].rear = false;

                    if( this._criticalAllocationTable[countEQ].damaged)
                        this._criticalAllocationTable[countEQ].damaged = true;
                    else
                        this._criticalAllocationTable[countEQ].damaged = false;
                }
            }

            if( importObject && importObject.structureBubbles ) {
                this._structureBubbles = importObject.structureBubbles;
            }

            if( importObject && importObject.armorBubbles ) {
                this._armorBubbles = importObject.armorBubbles;
            }

            // Bombs last: they need the Bomb Bays placed; _calc drops any that no longer fit.
            this._bombLoadout = importObject.bombLoadout ? { ...importObject.bombLoadout } : {};

            // OmniMech configurations: the saved equipment is the active one; others stay stored.
            this._omniConfigurations = this._omnimech && Array.isArray(importObject.omniConfigurations)
                ? JSON.parse(JSON.stringify(importObject.omniConfigurations))
                : [];
            this._activeOmniConfiguration = importObject.activeOmniConfiguration || BattleMech.DEFAULT_OMNI_CONFIGURATION;
            this._omniBaseHeatSinks = this._omnimech ? importObject.omniBaseHeatSinks : undefined;
            this._omniBaseJumpSpeed = this._omnimech ? importObject.omniBaseJumpSpeed : undefined;

            this._calc();
            return true;
        } else {
            return false;
        }

    }

    getEquipmentByUUID(
        uuid: string,
    ): IEquipmentItem | null {
        for( const eq of this._equipmentList ) {
            if( eq.uuid === uuid ) {
                return eq;
            }
        }
        return null;
    }

    public getWeightBreakdown() {
        return this._weights;
    }

    // ---- FIXED CORE ARMOR SETTERS (UNIVERSAL) ----
    public setHeadArmor(armorValue: number): number {
        this._armorAllocation.head = armorValue;
        this._calc();
        return this._armorAllocation.head;
    }
    public setCenterTorsoArmor(armorValue: number): number {
        this._armorAllocation.centerTorso = armorValue;
        this._calc();
        return this._armorAllocation.centerTorso;
    }
    public setCenterTorsoRearArmor(armorValue: number): number {
        this._armorAllocation.centerTorsoRear = armorValue;
        this._calc();
        return this._armorAllocation.centerTorsoRear;
    }
    public setLeftTorsoArmor(armorValue: number): number {
        this._armorAllocation.leftTorso = armorValue;
        if (this._mirrorArmorAllocations) {
            this._armorAllocation.rightTorso = armorValue;
        }
        this._calc();
        return this._armorAllocation.leftTorso;
    }
    public setLeftTorsoRearArmor(armorValue: number): number {
        this._armorAllocation.leftTorsoRear = armorValue;
        if (this._mirrorArmorAllocations) {
            this._armorAllocation.rightTorsoRear = armorValue;
        }
        this._calc();
        return this._armorAllocation.leftTorsoRear;
    }
    public setRightTorsoArmor(armorValue: number): number {
        this._armorAllocation.rightTorso = armorValue;
        if (this._mirrorArmorAllocations) {
            this._armorAllocation.leftTorso = armorValue;
        }
        this._calc();
        return this._armorAllocation.rightTorso;
    }
    public setRightTorsoRearArmor(armorValue: number): number {
        this._armorAllocation.rightTorsoRear = armorValue;
        if (this._mirrorArmorAllocations) {
            this._armorAllocation.leftTorsoRear = armorValue;
        }
        this._calc();
        return this._armorAllocation.rightTorsoRear;
    }
    // ---- ANATOMICAL LIMB SETTERS WITH DYNAMIC ROUTING BASED ON CHASSIS CHOICE ----
    public setLeftArmArmor(armorValue: number): number {
        const typeTag = this._mechType.tag.toLowerCase();
        if (typeTag === "quad" || typeTag === "quadvee") {
            // Route directly to Front Left Leg allocation properties
            this._armorAllocation.frontLeftLeg = armorValue;
            if (this._mirrorArmorAllocations) {
                this._armorAllocation.frontRightLeg = armorValue;
            }
            this._calc();
            return this._armorAllocation.frontLeftLeg ?? 0;
        }
        // Baseline Biped/LAM arm allocation logic plus Tripod extension
        this._armorAllocation.leftArm = armorValue;
        if (this._mirrorArmorAllocations) {
            this._armorAllocation.rightArm = armorValue;
        }
        this._calc();
        return this._armorAllocation.leftArm ?? 0;
    }
    public setRightArmArmor(armorValue: number): number {
        const typeTag = this._mechType.tag.toLowerCase();
        if (typeTag === "quad" || typeTag === "quadvee") {
            this._armorAllocation.frontRightLeg = armorValue;
            if (this._mirrorArmorAllocations) {
                this._armorAllocation.frontLeftLeg = armorValue;
            }
            this._calc();
            return this._armorAllocation.frontRightLeg ?? 0;
        }
        this._armorAllocation.rightArm = armorValue;
        if (this._mirrorArmorAllocations) {
            this._armorAllocation.leftArm = armorValue;
        }
        this._calc();
        return this._armorAllocation.rightArm ?? 0;
    }
    public setLeftLegArmor(armorValue: number): number {
        // Both Bipeds and Quads utilize baseline leftLeg (Rear Left Leg on Quads)
        this._armorAllocation.leftLeg = armorValue;
        if (this._mirrorArmorAllocations) {
            this._armorAllocation.rightLeg = armorValue;
        }
        this._calc();
        return this._armorAllocation.leftLeg;
    }
    public setRightLegArmor(armorValue: number): number {
        // Both Bipeds and Quads utilize baseline rightLeg (Rear Right Leg on Quads)
        this._armorAllocation.rightLeg = armorValue;
        if (this._mirrorArmorAllocations) {
            this._armorAllocation.leftLeg = armorValue;
        }
        this._calc();
        return this._armorAllocation.rightLeg;
    }
    // ---- EXPLICIT ADVANCED UNIQUE LIMB SETTERS ----
    public setCenterLegArmor(armorValue: number): number {
        this._armorAllocation.centerLeg = armorValue;
        // Tripod center legs stand alone along the centerline anatomy, no mirroring step applies
        this._calc();
        return this._armorAllocation.centerLeg ?? 0;
    }
    public setFrontLeftLegArmor(armorValue: number): number {
        this._armorAllocation.frontLeftLeg = armorValue;
        if (this._mirrorArmorAllocations) {
            this._armorAllocation.frontRightLeg = armorValue;
        }
        this._calc();
        return this._armorAllocation.frontLeftLeg ?? 0;
    }
    public setFrontRightLegArmor(armorValue: number): number {
        this._armorAllocation.frontRightLeg = armorValue;
        if (this._mirrorArmorAllocations) {
            this._armorAllocation.frontLeftLeg = armorValue;
        }
        this._calc();
        return this._armorAllocation.frontRightLeg ?? 0;
    }

    public getAdditionalHeatSinks() {
        return this._additionalHeatSinks;
    };
    public addEquipment(
        equipmentIndex: number,
        equipmentListTag: string,
        location: string,
        rear: boolean = false,
        uuid: string | undefined | null,
        weight: number | undefined,
        split_location: ISplitLocation[],
    ) {
        if( !uuid ) {
            uuid = generateUUID()
        }

        const equipmentList = this.getEquipmentList( equipmentListTag );

        if( equipmentList[equipmentIndex]) {

            const equipmentItem: IEquipmentItem = JSON.parse(JSON.stringify(equipmentList[equipmentIndex]));

            if( typeof(location) !== "undefined" )
                equipmentItem.location = location;

            if( typeof(weight) !== "undefined" )
                equipmentItem.weight = weight;

            equipmentItem.rear = rear;
            equipmentItem.uuid = uuid;
            equipmentItem.split_location = split_location;

            this._equipmentList.push(equipmentItem);
            this._sortInstalledEquipment();

            return equipmentItem;
        }

        return null;
    };

    public addEquipmentByName(
        equipmentName: string,
        equipmentListTag: string,
        location: string,
        rear: boolean = false,
        uuid: string | undefined | null,
        weight: number | undefined,
        split_location: ISplitLocation[],
    ): IEquipmentItem | null {
        if( !uuid ) {
            uuid = generateUUID()
        }

        const equipmentList = this.getEquipmentList( equipmentListTag );

        for( const item of equipmentList ) {
            if(
                item.name.toLowerCase().trim() === equipmentName.toLowerCase().trim()
                    ||
                (item.alternateName && item.alternateName.toLowerCase().trim() === equipmentName.toLowerCase().trim() )
            ) {
                return this._installEquipmentRecord( item, location, rear, uuid, weight, split_location );
            }
        }

        return null;
    };

    // Installs a copy of a catalog record.
    private _installEquipmentRecord(
        item: IEquipmentItem,
        location: string,
        rear: boolean,
        uuid: string,
        weight: number | undefined,
        split_location: ISplitLocation[],
    ): IEquipmentItem {
        const equipmentItem: IEquipmentItem = JSON.parse(JSON.stringify( item ));

        if( typeof(location) !== "undefined" )
            equipmentItem.location = location;

        if( typeof(weight) !== "undefined" )
            equipmentItem.weight = weight;
        equipmentItem.rear = rear;
        equipmentItem.uuid = uuid;
        equipmentItem.split_location = split_location;

        if( equipmentItem.criticalsDivisor && equipmentItem.criticalsDivisor > -1 ) {
            equipmentItem.criticals = this.getTonnage() / equipmentItem.criticalsDivisor;
        }

        if(  equipmentItem.weightDivisor && equipmentItem.weightDivisor  > -1) {
            equipmentItem.weight = this.getTonnage() / equipmentItem.weightDivisor;
        }

        this._equipmentList.push(equipmentItem);
        this._sortInstalledEquipment();

        return equipmentItem;
    }

    public addEquipmentFromTag(
        equipmentTag: string,
        equipmentListTag: string,
        location: string | undefined,
        rear: boolean = false,
        uuid: string | undefined | null,
        target: string = "",
        resolved: boolean = false,
        damageClusterHits: IClusterHit[] = [],
        weight: number | undefined,
        split_location: ISplitLocation[] | undefined,
        currentAmmo: number = -1,
        selectedAmmoBinUUID: string = "",
        includeCustom: boolean = false,
    ): IEquipmentItem | null {
        if( !uuid ) {
            uuid = generateUUID()
        }

        if( !equipmentListTag) {
            equipmentListTag = this._tech.tag;
        }

        let equipmentList = this.getEquipmentList(equipmentListTag, includeCustom);
        // An exact tag beats an alias, so another record's altTag or display
        // name (e.g. a prototype's "Narc") can never capture a saved tag.
        const normalizedTag = equipmentTag.trim().toLowerCase();
        equipmentList = [
            ...equipmentList.filter( item => item.tag.toLowerCase() === normalizedTag ),
            ...equipmentList.filter( item => item.tag.toLowerCase() !== normalizedTag ),
        ];

        for( const item of equipmentList ) {
            if( equipmentMatchesIdentifier(item, equipmentTag)) {
                const equipmentItem: IEquipmentItem = JSON.parse(JSON.stringify(item));
                if( typeof(location) !== "undefined" )
                    equipmentItem.location = this._sanitizeLocationInput(location);
                equipmentItem.rear = rear;
                equipmentItem.uuid = uuid;
                equipmentItem.target = target;
                equipmentItem.split_location = split_location;
                equipmentItem.resolved = false;

                if( currentAmmo === -1 && equipmentItem.isAmmo ) {
                    // A fresh bin is full; its shot count depends on the weapon it feeds.
                    equipmentItem.currentAmmo = undefined;
                } else {
                    equipmentItem.currentAmmo = currentAmmo;
                }
                if (equipmentItem.isModularArmor && typeof equipmentItem.currentAdditionalArmor !== "number") {
                    equipmentItem.currentAdditionalArmor = equipmentItem.additionalArmor ?? 10;
                }

                equipmentItem.selectedAmmoBinUUID = selectedAmmoBinUUID;

                if( typeof(weight) !== "undefined" )
                    equipmentItem.weight = weight;
                equipmentItem.damageClusterHits = []
                if( resolved ) {
                    equipmentItem.resolved = true;
                }
                if( damageClusterHits ) {
                    equipmentItem.damageClusterHits = damageClusterHits;
                }
                this._equipmentList.push(equipmentItem);

                this._sortInstalledEquipment();
                this._calc();
                return equipmentItem;
            }
        }

        return null;
    };

    public removeEquipment(itemUUID: string | undefined) {

        if( itemUUID ) {
            for( const equipmentIndex in this._equipmentList ) {
                if( this._equipmentList[equipmentIndex] && itemUUID === this._equipmentList[equipmentIndex].uuid ) {
                    this._equipmentList.splice(+equipmentIndex, 1);
                    return 1;
                }
            }
        }
        return null;
    };

    public isWrecked(): boolean {

        if( this.isWreckedBlurb() !== "" ) {
            return true;
        }

        return false;
    }

    private _returnRandomString(
        from: string[]
    ): string {
        return from[ Math.floor(Math.random() * from.length) ]
    }

    /**
     * An engine that loses 3 or more hits with a side torso: the Inner Sphere XL and the XXL. A Light or Clan XL engine
     * (2 slots in each side torso) survives the loss of a side torso (TM p.47), so it does not count.
     */
    public hasXLEngine(): boolean {
        const sideSlots = (this.getLargeEngineType() ?? this._engineType)?.criticals?.[this.getEngineTechBase()];
        return (sideSlots?.lt ?? 0) >= 3 || (sideSlots?.rt ?? 0) >= 3;
    }

    public isWreckedBlurb(): string {

        if(
            this._structureInLocation( "ct" ) < 1
            ||
            (
                this.hasXLEngine()
                &&
                (
                    this._structureInLocation( "lt" ) < 1
                    ||
                    this._structureInLocation( "rt" ) < 1
                )
            )
        ) {
            const damageSnarks: string[] = [
                "Massive hole in chest.",
                "Radiation leak, very dangerous.",
                "Where oh where did my reactor go?",
                "No Reactor. The 'mech will finally cool down!",
            ];
            return this._returnRandomString(damageSnarks);
        }

        if( this._structureInLocation( "hd" ) < 1 ) {
            const damageSnarks: string[] = [
                "Cockpit became a convertible",
                "Mechwarrior missing",
                "User error. Replace user.",
            ];
            return this._returnRandomString(damageSnarks);
        }


        if( this.engineHits() > 2 ) {
            const damageSnarks: string[] = [
                "Engine took too many hits",
                "Some days, even the engine has to take a nap.",
            ];
            return this._returnRandomString(damageSnarks);
        }
        if( this.gyroHits() > 2 && !this.canOperateAfterGyroFailure() ) {
            const damageSnarks: string[] = [
                "Oh man my mech can't keep it's liqueur!",
                "'mech drunk, can't stand",
            ];
            return this._returnRandomString(damageSnarks);
        }
        if( this.lifeSupportHits() > 0 ) {
            const damageSnarks: string[] = [
                "Mechwarrior can't breathe",
                "Needed to open a window to catch some air",
            ];
            return this._returnRandomString(damageSnarks);
        }
        if( this.areSensorsDestroyed() ) {
            const damageSnarks: string[] = [
                "I can't see!",
            ];
            return this._returnRandomString(damageSnarks);
        }

        return "";
    }

    public takeDamage(
        amount: number,
        location: string,
        rear: boolean,
        // An ammunition explosion: it skips armor (TW p.125), and a location where `ventAt` holds (CASE) stops it.
        { structureOnly = false, ventAt = () => false }: { structureOnly?: boolean, ventAt?: (location: string) => boolean } = {},
    ): IDamageResults[] {

        const rv: IDamageResults[] = [];
        location = this._normalizeLocation(location);
        if (this._isArmlessArm(location)) {
            return [{ criticals: 0, criticalRoll: 0, criticalEffects: [BattleMech.ARMLESS_HIT], location, amount: 0 }];
        }
        // Any successful rear torso hit destroys a jump pack, and the 'Mech takes full damage (Maximum Tech p.81; TO:AUE p.105).
        const jumpPackHit = rear && !structureOnly && /^[clr]tr?$/.test(location) && this.getJumpPackTons() > 0 && !this.jumpPackLost;
        let structureHit = false;
        const structure = (at: string, damage: number) => {
            const left = this._takeStructureDamageAtLocation(at, damage);
            structureHit ||= left < damage;
            return left;
        };

        // Check location armor
        // let armorDamage = true;
        // let structureDamage = false;

        let locationHasArmor = !structureOnly && this._locationHasArmor(location);
        let locationHasStructure = this._locationHasStructure(location);
        while(
            !locationHasStructure &&
            !locationHasArmor &&
            !ventAt(location) &&
            location !== "ct" &&
            location !== "ctr" &&
            location !== "hd"
        ) {

            location = this._moveDamageLocationIn( location, rear );

            locationHasArmor = !structureOnly && this._locationHasArmor(location);
            locationHasStructure = this._locationHasStructure(location);
        }

        if( locationHasArmor ) {
            let remainderDamage = this._takeArmorDamageAtLocation( location, amount );

            if( remainderDamage ) {
                // structureDamage = true;
                remainderDamage = structure( location, remainderDamage )
                while(
                    remainderDamage > 0 &&
                    !ventAt(location) &&
                    location !== "ct" &&
                    location !== "ctr" &&
                    location !== "hd"
                ) {
                    location = this._moveDamageLocationIn( location, rear );
                    remainderDamage = structure( location, remainderDamage )
                }

            }
        } else if (locationHasStructure) {
            let remainderDamage = structure( location, amount )
            while(
                remainderDamage > 0 &&
                !ventAt(location) &&
                location !== "ct" &&
                location !== "ctr" &&
                location !== "hd"
            ) {
                location = this._moveDamageLocationIn( location, rear );
                remainderDamage = structure( location, remainderDamage )
            }

        }

        if (jumpPackHit) {
            this.dropJumpPack("destroyed");
            rv.push({ criticals: 0, criticalRoll: 0, criticalEffects: ["Jump pack destroyed by the rear torso hit."], location, amount });
        }
        // Enhanced Imaging feedback on internal structure damage (Maximum Tech p.61; IO:AE p.69).
        if (structureHit && this.isEnhancedImagingActive()) {
            rv.push({ criticals: 0, criticalRoll: 0, criticalEffects: ["Enhanced Imaging feedback: " + this.getEnhancedImagingFeedback()],
                location, amount });
        }
        this._calc();
        return rv;

    }

    private _locationHasArmor(
        location: string
    ): boolean {
        if (this.getActiveModularArmorAtLocation(location))
            return true;
        if( this._armorInLocation( location ) > 0 )
            return true;

        return false;
    }

    private _locationHasStructure(
        location: string
    ): boolean {
        if( this._structureInLocation( location ) > 0 )
            return true;

        return false;
    }

    private _structureInLocation(location: string): number {
        if (!location) {
            return -1;
        }

        const normalizedLocation = location.toLowerCase().trim();

        // Core Architecture Structural Location Registry Dictionary: Auto-handles rear location routing since internal framework maps onto front bubble tracks
        const structureMap: Record<string, boolean[] | undefined> = {
            "hd": this._structureBubbles.head,
            "ct": this._structureBubbles.centerTorso,
            "ctr": this._structureBubbles.centerTorso, // Rear maps to core front torso structure
            "lt": this._structureBubbles.leftTorso,
            "ltr": this._structureBubbles.leftTorso,
            "rt": this._structureBubbles.rightTorso,
            "rtr": this._structureBubbles.rightTorso,
            "la": this._structureBubbles.leftArm,
            "ra": this._structureBubbles.rightArm,
            "ll": this._structureBubbles.leftLeg,
            "rl": this._structureBubbles.rightLeg,
            // Advanced layout location trackers mapped to their respective backing properties
            "cl": (this._structureBubbles as any).centerLeg,
            "fll": (this._structureBubbles as any).frontLeftLeg,
            "frl": (this._structureBubbles as any).frontRightLeg
        };
        // Extract and extract target internal structure bubbles array reference
        const targetArray = structureMap[normalizedLocation];
        if (Array.isArray(targetArray)) {
            let undamagedCount = 0;
            // Fast integer loop iteration over the structural health state matrix indices
            for (let i = 0; i < targetArray.length; i++) {
                if (targetArray[i] === true) {
                    undamagedCount++;
                }
            }
            return undamagedCount;
        }
        // Unrecognized or unmapped location parameter tracking fall-through
        console.error(`_structureInLocation failed: Component key '${location}' cannot be found on active chassis layout configuration profile. Please open a ticket on GitHub.`);
        return -1;
    }

    private _armorInLocation(location: string): number {
        if (!location) {
            return -1;
        }
        const normalizedLocation = location.toLowerCase().trim();
        // Core Architecture Armor Location Registry Dictionary: Unlike structure, external armor explicitly splits front and rear torso bubbles into separate arrays
        const armorMap: Record<string, boolean[] | undefined> = {
            "hd": this._armorBubbles.head,
            "ct": this._armorBubbles.centerTorso,
            "ctr": this._armorBubbles.centerTorsoRear,
            "lt": this._armorBubbles.leftTorso,
            "ltr": this._armorBubbles.leftTorsoRear,
            "rt": this._armorBubbles.rightTorso,
            "rtr": this._armorBubbles.rightTorsoRear,
            "la": this._armorBubbles.leftArm,
            "ra": this._armorBubbles.rightArm,
            "ll": this._armorBubbles.leftLeg,
            "rl": this._armorBubbles.rightLeg,
            // New legs...
            "cl": (this._armorBubbles as any).centerLeg,
            "fll": (this._armorBubbles as any).frontLeftLeg,
            "frl": (this._armorBubbles as any).frontRightLeg
        };
        // Extract and check the target armor bubbles array reference
        const targetArray = armorMap[normalizedLocation];
        if (Array.isArray(targetArray)) {
            let undamagedCount = 0;
            for (let i = 0; i < targetArray.length; i++) {
                if (targetArray[i] === true) {
                    undamagedCount++;
                }
            }
            return undamagedCount;
        }
        // Who 'dis? New Mech.
        console.error(`_armorInLocation failed: Armor component key '${location}' cannot be found on active chassis layout configuration profile. Submit a ticket on GitHub.`);
        return -1;
    }

    private _takeArmorDamageAtLocation(location: string, amount: number): number {
        let damageTaken = 0;
        
        if (!location || amount <= 0) {
            return amount;
        }

        const normalizedLocation = location.toLowerCase().trim();
        const modularArmor = this.getActiveModularArmorAtLocation(normalizedLocation);
        if (modularArmor) {
            const modularDamage = Math.min(modularArmor.currentAdditionalArmor ?? 0, amount);
            modularArmor.currentAdditionalArmor = (modularArmor.currentAdditionalArmor ?? 0) - modularDamage;
            amount -= modularDamage;
            if (amount <= 0) {
                return 0;
            }
        }

        // Core Architecture Armor Matrix Lookup Dictionary
        const armorMap: Record<string, boolean[] | undefined> = {
            "hd": this._armorBubbles.head,
            "ct": this._armorBubbles.centerTorso,
            "ctr": this._armorBubbles.centerTorsoRear,
            "lt": this._armorBubbles.leftTorso,
            "ltr": this._armorBubbles.leftTorsoRear,
            "rt": this._armorBubbles.rightTorso,
            "rtr": this._armorBubbles.rightTorsoRear,
            "la": this._armorBubbles.leftArm,
            "ra": this._armorBubbles.rightArm,
            "ll": this._armorBubbles.leftLeg,
            "rl": this._armorBubbles.rightLeg,
            // New legs
            "cl": (this._armorBubbles as any).centerLeg,
            "fll": (this._armorBubbles as any).frontLeftLeg,
            "frl": (this._armorBubbles as any).frontRightLeg
        };
        const targetArray = armorMap[normalizedLocation];
        if (Array.isArray(targetArray)) {
            for (let i = 0; i < targetArray.length; i++) {
                // If we hit a healthy box and still have remaining incoming damage to apply
                if (targetArray[i] === true && damageTaken < amount) {
                    targetArray[i] = false; // Mark this specific bubble box index as damaged/destroyed
                    damageTaken++;
                }
                // Break early to save CPU cycles if we have completely satisfied the damage pool amount
                if (damageTaken >= amount) {
                    break;
                }
            }
        } else {
            console.error(`_takeArmorDamageAtLocation failed: Armor location target '${location}' is invalid for the active chassis layout template. Submit a GutHub ticket.`);
        }
        // Returns the remaining blow-through damage amount that penetrates to internal structure layers
        return amount - damageTaken;
    }

    private _takeStructureDamageAtLocation(location: string, amount: number): number {
        let damageTaken = 0;
        
        if (!location || amount <= 0) {
            return amount;
        }
        const normalizedLocation = location.toLowerCase().trim();

        // Core Architecture Internal Structure Mapping Dictionary: Rear hits ("ctr", "ltr", "rtr") correctly map to the back
        const structureMap: Record<string, boolean[] | undefined> = {
            "hd": this._structureBubbles.head,
            "ct": this._structureBubbles.centerTorso,
            "ctr": this._structureBubbles.centerTorso, 
            "lt": this._structureBubbles.leftTorso,
            "ltr": this._structureBubbles.leftTorso,
            "rt": this._structureBubbles.rightTorso,
            "rtr": this._structureBubbles.rightTorso,
            "la": this._structureBubbles.leftArm,
            "ra": this._structureBubbles.rightArm,
            "ll": this._structureBubbles.leftLeg,
            "rl": this._structureBubbles.rightLeg,
            // New legs
            "cl": (this._structureBubbles as any).centerLeg,
            "fll": (this._structureBubbles as any).frontLeftLeg,
            "frl": (this._structureBubbles as any).frontRightLeg
        };
        // Pop da bubbles
        const targetArray = structureMap[normalizedLocation];
        if (Array.isArray(targetArray)) {
            for (let i = 0; i < targetArray.length; i++) {
                // If we hit an intact structural box and still have remaining damage to apply
                if (targetArray[i] === true && damageTaken < amount) {
                    targetArray[i] = false; // Destroy this specific structural framework bubble box index
                    damageTaken++;
                }
                // Performance Guard: Break early the instant the incoming damage amount is completely absorbed
                if (damageTaken >= amount) {
                    break;
                }
            }
        } else {
            console.error(`_takeStructureDamageAtLocation failed: Component location target '${location}' is invalid for the active chassis layout template. Submit a ticket on GitHub`);
        }
        return amount - damageTaken;
    }

    private _moveDamageLocationIn(loc: string, rear: boolean): string {
        if (!loc) {
            return rear ? "ctr" : "ct";
        }
        const normalizedLoc = loc.toLowerCase().trim();
        // Front legs on Quads transfer inward to the side torsos, mirroring standard arm rules.
        if (normalizedLoc === "la" || normalizedLoc === "ll" || normalizedLoc === "fll") {
            return rear ? "ltr" : "lt";
        }
        if (normalizedLoc === "ra" || normalizedLoc === "rl" || normalizedLoc === "frl") {
            return rear ? "rtr" : "rt";
        }
        // A Tripod's Center Leg ('cl') transfers directly into the Center Torso frame
        if (normalizedLoc === "cl") {
            return rear ? "ctr" : "ct";
        }
        // Side Torsos -> Center Torso Transfer mapping rules
        if (normalizedLoc === "lt" || normalizedLoc === "rt" || normalizedLoc === "ltr" || normalizedLoc === "rtr") {
            return rear ? "ctr" : "ct";
        }
        // FALLBACK (If head or center torso takes transfer damage, it remains CT)
        return rear ? "ctr" : "ct";
    }

    public setweight (
        itemUUID: string | undefined,
        weight: number,
    ) {

        if( itemUUID ) {
            for( const item of this._equipmentList ) {
                if( item.uuid && item.uuid === itemUUID) {

                    item.weight = weight;
                    break;

                }
            }

        }
        // if( this._equipmentList[equipmentIndex]) {

        //     this._equipmentList[equipmentIndex].rear = newValue;
        //     for( let item of this._criticalAllocationTable ) {
        //         if( item.obj && item.obj.uuid === this._equipmentList[equipmentIndex].uuid ) {
        //             item.rear = newValue;
        //             item.obj.rear = newValue;
        //         }
        //     }
        // }

        this._calc();
    }

    public setRear(
        itemUUID: string | undefined,
        newValue: boolean
    ) {

        if( itemUUID ) {
            for( const item of this._equipmentList ) {
                if( item.uuid && item.uuid === itemUUID) {

                    item.rear = newValue;
                    if( newValue ) item.turret = undefined;

                    for( const critAllItem of this._criticalAllocationTable ) {
                        if( critAllItem.obj && critAllItem.uuid === itemUUID ) {
                            critAllItem.rear = newValue;
                            critAllItem.obj.rear = newValue;
                            break;
                        }

                    }
                    break;

                }
            }

        }
        // if( this._equipmentList[equipmentIndex]) {

        //     this._equipmentList[equipmentIndex].rear = newValue;
        //     for( let item of this._criticalAllocationTable ) {
        //         if( item.obj && item.obj.uuid === this._equipmentList[equipmentIndex].uuid ) {
        //             item.rear = newValue;
        //             item.obj.rear = newValue;
        //         }
        //     }
        // }

        this._calc();
        // return this._equipmentList[equipmentIndex].rear;
    };

    private _updateCriticalAllocationTable() {
        this._criticalAllocationTable = [];

        // Cast keys to valid property identifiers to preserve strict type indexing
        const criticalAreas = Object.keys(this._criticals) as Array<keyof typeof this._criticals>;
        // Dynamic map to translate internal class array property keys into canonical shorthand location labels
        const shortLocMap: Record<string, string> = {
            "head": "hd",
            "centerTorso": "ct",
            "rightTorso": "rt",
            "leftTorso": "lt",
            "rightArm": "ra",
            "leftArm": "la",
            "rightLeg": "rl",
            "leftLeg": "ll",
            // New legs
            "centerLeg": "cl",
            "frontLeftLeg": "fll",
            "frontRightLeg": "frl"
        };
        // Iterate across all asset location tracks natively
        for (const mechLocation of criticalAreas) {
            const slotArray = this._criticals[mechLocation];
            if (Array.isArray(slotArray)) {
                for (let critItemCounter = 0; critItemCounter < slotArray.length; critItemCounter++) {
                    const currentItem = slotArray[critItemCounter];
                    // Process movable weapon assets, ammo feeds, and customized modules
                    if (currentItem && currentItem.movable) {
                        // Pull shorthand token from map registry or fallback to 'un'
                        const shortLoc = shortLocMap[mechLocation] || "un";
                        // Sync index tracking references back onto the item instance safely
                        currentItem.loc = shortLoc;
                        currentItem.slot = critItemCounter;
                        if (!currentItem.size) {
                            currentItem.size = currentItem.crits;
                        }
                        // Push the item straight into the flat tracking array matrix
                        this._criticalAllocationTable.push(currentItem);
                        // The second ton of a shared ammunition slot is saved at the same location and slot.
                        if (currentItem.shared) {
                            currentItem.shared.loc = shortLoc;
                            currentItem.shared.slot = critItemCounter;
                            currentItem.shared.size = 1;
                            this._criticalAllocationTable.push(currentItem.shared);
                        }
                    }
                }
            }
        }
    }

    _removeUUIDFromUnallocated(
        uuid: string
    ) {

        for( let index = this._unallocatedCriticals.length - 1; index > -1; index--) {
            if( this._unallocatedCriticals[index] && uuid === this._unallocatedCriticals[index].uuid ) {
                this._unallocatedCriticals.splice( index, 1);
            }
        }
    }

    public moveCritical(
        fromLocation: string,
        fromIndex: number,
        toLocation: string,
        toIndex: number,
        split_location: ISplitLocation[] = [],
    ): boolean {
        if (!fromLocation || !toLocation) {
            return false;
        }
        // Normalize incoming structural shorthand tracking tokens cleanly
        const srcLoc = fromLocation.toLowerCase().trim();
        const destLoc = toLocation.toLowerCase().trim();
        // Maps standard, legacy, and new leg trackers directly to their active class backing fields
        const getCriticalArray = (locTag: string): ICriticalSlot[] | null => {
            switch (locTag) {
                case "un":   return this._unallocatedCriticals;
                case "hd":   return this._criticals.head;
                case "ct":   return this._criticals.centerTorso;
                case "lt":   return this._criticals.leftTorso;
                case "rt":   return this._criticals.rightTorso;
                case "la":   return this._criticals.leftArm;
                case "ra":   return this._criticals.rightArm;
                case "ll":   return this._criticals.leftLeg;
                case "rl":   return this._criticals.rightLeg;
                // Those shiny new legs
                case "cl":   return (this._criticals as any).centerLeg ?? null;
                case "fll":  return (this._criticals as any).frontLeftLeg ?? null;
                case "frl":  return (this._criticals as any).frontRightLeg ?? null;
                // Legacy / Alternate string safety handles mapped seamlessly to avoid application errors
                case "rll":  return this._criticals.leftLeg;
                case "rrl":  return this._criticals.rightLeg;
                default:     return null;
            }
        };
        // Extract originating array reference parameters
        const fromLocationObj = getCriticalArray(srcLoc);
        if (!fromLocationObj || !fromLocationObj[fromIndex]) {
            console.warn("moveCritical() failed: Primary source location component array or target slot index is empty.", srcLoc, fromIndex);
            return false;
        }
        const fromItem = fromLocationObj[fromIndex];
        const movingModularArmor = this._equipmentList.some(item => item.isModularArmor && item.uuid === fromItem.uuid);
        if (movingModularArmor && destLoc !== "un") {
            const duplicatePack = this._equipmentList.some(item =>
                item.isModularArmor
                && item.uuid !== fromItem.uuid
                && item.allocationLocation === destLoc
            );
            if (duplicatePack) {
                return false;
            }
        }
        // One HarJel repair system to a location (IO:AE p.83).
        const movingItem = this._equipmentList.find(item => item?.uuid === fromItem.uuid);
        // Equipment tied to a location, e.g. the IndustrialMech Ejection Seat in the head (TM p.214).
        const allowedLocations = movingItem ? this._getAllowedLocations(movingItem) : null;
        if (allowedLocations && destLoc !== "un" && !allowedLocations.includes(destLoc)) {
            return false;
        }
        if (this.isArmless() && (destLoc === "la" || destLoc === "ra")) {
            return false;
        }
        if (movingItem?.onePerLocationGroup && destLoc !== "un" && this._equipmentList.some(item =>
            item?.onePerLocationGroup === movingItem.onePerLocationGroup
            && item.uuid !== movingItem.uuid
            && item.allocationLocation === destLoc
        )) {
            return false;
        }
        // Spread equipment goes only in its locations, shared out evenly among them.
        const spreadItem = fromItem.obj as IEquipmentItem | null | undefined;
        const spreadLocations = this._getSpreadLocations(spreadItem);
        if (spreadItem && spreadLocations && destLoc !== "un" && destLoc !== srcLoc) {
            if (!spreadLocations.includes(destLoc)) return false;
            const held = (getCriticalArray(destLoc) ?? []).filter(slot => slot?.obj && !slot.placeholder && (slot.obj as IEquipmentItem).tag === spreadItem.tag).length;
            if (held >= this._getSpreadSlotsPerLocation(spreadItem)) return false;
            const holds = (location: string) => (getCriticalArray(location) ?? []).some(slot => slot?.obj && !slot.placeholder && (slot.obj as IEquipmentItem).tag === spreadItem.tag);
            if (this._getOtherSideLocations(spreadItem, destLoc).some(holds)) return false;
        }
        // PATHWAY A: ADVANCED ITEM SPLIT ALLOCATION PROCESSING (e.g., Critical Item splits across multiple parts)
        if (split_location && split_location.length > 0) {
            let overallSuccess = true;
            for (let splitIndex = 0; splitIndex < split_location.length; splitIndex++) {
                const split = split_location[splitIndex];
                const currentSplitDestTag = split.loc.toLowerCase().trim();
                const targetDestArray = getCriticalArray(currentSplitDestTag);
                if (targetDestArray) {
                    const isLastSplitSegment = splitIndex >= split_location.length - 1;
                    // Execute the move step onto the current destination index path
                    const partialSuccess = this._moveItemToArea(
                        fromLocationObj,
                        fromItem,
                        fromIndex,
                        targetDestArray,
                        split.index,
                        currentSplitDestTag,
                        split.size,
                        isLastSplitSegment
                    );
                    if (!partialSuccess) {
                        overallSuccess = false;
                    }
                } else {
                    overallSuccess = false;
                }
            }
            return overallSuccess;
        }
        // PATHWAY B: STANDARD DIRECT SINGLE-SLOT INVENTORY TRANSFERS
        const finalDestArray = getCriticalArray(destLoc);
        if (!finalDestArray) {
            console.warn("moveCritical() failed: Terminal destination location tag could not be resolved in the layout schema registry.", destLoc);
            return false;
        }
        const armoredKey = BattleMech._armoredSlotKey(fromItem.tag, srcLoc, fromIndex);
        const movingArmored = this._armoredSlots.has(armoredKey);
        const moved = this._moveItemToArea(
            fromLocationObj,
            fromItem,
            fromIndex,
            finalDestArray,
            toIndex,
            destLoc,
            fromItem.size || fromItem.crits || 1, // Dynamically evaluate size criteria parameters
            true                                  // Direct moves behave implicitly like a final segment block
        );
        // An armored heat sink or jump jet keeps its armor where it goes (TO:AUE p.94).
        if (moved && movingArmored) {
            this._armoredSlots.delete(armoredKey);
            const placedAt = finalDestArray.findIndex(slot => slot && !slot.placeholder && slot.uuid === fromItem.uuid);
            if (destLoc !== "un" && placedAt >= 0) this._armoredSlots.add(BattleMech._armoredSlotKey(fromItem.tag, destLoc, placedAt));
        }
        // Battle Value depends on where explosive items and CASE sit (TM pp.302-303). It is worked out
        // again when next read, not here: imports place many items in a row, and the calculation
        // reorders the equipment list.
        if (moved) {
            this._battleValueStale = true;
        }
        return moved;
    }

    private _setEquipmentAllocation(
        uuid: string,
        allocationIndex: number,
        allocationLocation: string,
    ) {
        for( const item of this._equipmentList ) {
            if( item && item.uuid === uuid ) {
                item.allocationIndex = allocationIndex;
                item.allocationLocation = allocationLocation;
                item.location = allocationLocation;
            }
        }
    }

    /** The second ton of a shared ammunition slot, as the slot's only occupant. */
    private _promoteSharedAmmunition(companion: ICriticalSlot): ICriticalSlot {
        companion.name = companion.obj?.name ?? companion.name;
        companion.size = 1;
        return companion;
    }

    private _moveItemToArea(
        fromLocation: any[], // Broaden to pass strict tuple/sparse assignment matching rules
        fromItem: ICriticalSlot,
        fromIndex: number,
        toLocation: any[],
        toIndex: number,
        toLocTag: string,
        toSize: number = -1,
        removeFrom: boolean = true,
    ): boolean {
        const targetSize = toSize === -1 ? (fromItem.crits || 1) : toSize;
        const normalizedTag = toLocTag.toLowerCase().trim();
        const typeTag = this._mechType.tag.toLowerCase();

        // The target location's slot count; 0 for a location this 'Mech lacks, so nothing is placed there.
        const maxLegalSlots = this.getLocationSlotCount(normalizedTag);

        // Automated Unassigned Index Resolution (Find next open gap space sequence)
        if (toIndex === -1) {
            for (let itemIndex = 0; itemIndex < toLocation.length; itemIndex++) {
                if (toLocation[itemIndex] === null || toLocation[itemIndex] === undefined) {
                    toIndex = itemIndex;
                    break;
                }
            }
            if (toIndex === -1 && toLocation.length < maxLegalSlots) {
                toIndex = Math.max(0, toLocation.length - 1);
            }
        }
        // Out-of-bounds array safety execution guard
        if (toIndex < 0 || toIndex + targetSize > maxLegalSlots) {
            return false;
        }
        // Expand the physical layout array buffer to match max capabilities if needed
        while (toLocation.length < toIndex + targetSize && toLocation.length < maxLegalSlots) {
            toLocation.push(null);
        }
        // A slot holding one ton of ammunition takes a second on a superheavy 'Mech (IO:AE p.157).
        if (targetSize === 1 && removeFrom && this._canShareAmmunitionSlot(toLocation[toIndex], fromItem, normalizedTag)) {
            const companion = fromItem.shared;
            delete fromItem.shared;
            fromItem.name = fromItem.obj?.name ?? fromItem.name;
            this._shareAmmunitionSlot(toLocation[toIndex], fromItem);
            fromLocation[fromIndex] = companion ? this._promoteSharedAmmunition(companion) : null;
            this._removeUUIDFromUnallocated(fromItem.uuid);
            this._setEquipmentAllocation(fromItem.uuid, toIndex, normalizedTag);
            this._updateCriticalAllocationTable();
            return true;
        }
        // Collision Validation Check
        let hasSpace = true;
        for (let testC = 0; testC < targetSize; testC++) {
            const structuralSlot = toLocation[toIndex + testC];
            if (structuralSlot && structuralSlot.uuid !== fromItem.uuid) {
                hasSpace = false;
                break;
            }
        }
        if (!hasSpace) {
            return false;
        }
        if (this.isLAM() && fromItem.obj && !this._isEquipmentAllowedForChassis(fromItem.obj as IEquipmentItem)) {
            return false;
        }
        // Equipment Legality Validation Filters (e.g. BattleTech Jump Jet validation mapping rules)
        if (fromItem.tag && fromItem.tag.startsWith("jj-")) {
            // Jump Jets can never mount to the Head location under any circumstances
            if (normalizedTag === "hd") {
                return false;
            }
            // Biped configurations can never fit jump jets into standard weapons arms
            if ((typeTag === "biped" || typeTag === "lam") && (normalizedTag === "ra" || normalizedTag === "la")) {
                return false;
            }
            // QuadVees follow specialized drive constraints preventing equipment in limbs based on tech modes
            if (typeTag === "quadvee" && (normalizedTag === "fll" || normalizedTag === "frl" || normalizedTag === "ll" || normalizedTag === "rl")) {
                // QuadVee chassis validation rules go here. I am thinking return false; but want to ruminate.
                // Feel free to let me know.
            }
        }
        // Commit Placement Changes & Populate Multi-Slot Component Placeholders
        const movingItem = fromLocation[fromIndex];
        if (movingItem) {
            movingItem.size = targetSize;
        }
        fromItem.loc = normalizedTag;
        fromItem.slot = toIndex;
        // The second ton of a shared ammunition slot stays where it is.
        const sharedCompanion = fromItem.shared;
        if (sharedCompanion) {
            delete fromItem.shared;
            fromItem.name = fromItem.obj?.name ?? fromItem.name;
        }
        // Deep clone object layout parameter state reference safely
        toLocation[toIndex] = JSON.parse(JSON.stringify(fromItem));
        toLocation[toIndex].size = targetSize;
        // Inject matching multi-slot alignment placeholders safely across remaining spans
        const placeholder: ICriticalSlot = {
            uuid: fromItem.uuid,
            name: "placeholder",
            placeholder: true,
            tag: fromItem.tag,
            crits: 1,
            rear: false,
            obj: null
        };
        for (let phC = 1; phC < targetSize; phC++) {
            toLocation[toIndex + phC] = placeholder;
        }
        // Clean up on Aisle Three
        if (removeFrom) {
            fromLocation[fromIndex] = sharedCompanion ? this._promoteSharedAmmunition(sharedCompanion) : null;
            let nextCounter = 1;
            while (fromIndex + nextCounter < fromLocation.length) {
                const trailingItem = fromLocation[fromIndex + nextCounter];
                if (trailingItem && trailingItem.name === "placeholder" && trailingItem.uuid === fromItem.uuid) {
                    fromLocation[fromIndex + nextCounter] = null; // Clean actual reference out of the index matrix
                    nextCounter++;
                } else {
                    break;
                }
            }
            this._removeUUIDFromUnallocated(toLocation[toIndex].uuid);
        }
        this._setEquipmentAllocation(fromItem.uuid, toIndex, normalizedTag);
        // Force downstream tables updates
        this._updateCriticalAllocationTable();
        return true;
    }

    private _allocateCritical(
        equipmentTag: string,
        equipmentRear: boolean,
        mechLocation: string | null | undefined,
        slotNumber: number | undefined,
        removeFromUnallocated: boolean,
        critSize: number = -1,
        equipmentUUID: string,
    ): boolean {
        // Structural guard clauses to ensure incoming routing attributes are fully resolved
        if (!mechLocation || slotNumber === undefined || !equipmentUUID) {
            return false;
        }
        const normalizedLocation = mechLocation.toLowerCase().trim();
        // Centralized Core Location Matrix Dictionary Mapping Lookups
        const locationMap: Record<string, any[] | undefined> = {
            "hd": this._criticals.head,
            "ct": this._criticals.centerTorso,
            "lt": this._criticals.leftTorso,
            "rt": this._criticals.rightTorso,
            "la": this._criticals.leftArm,
            "ra": this._criticals.rightArm,
            "ll": this._criticals.leftLeg,
            "rl": this._criticals.rightLeg,
            // Mech's got legs!!! Knows how to use 'em...
            "cl": (this._criticals as any).centerLeg,
            "fll": (this._criticals as any).frontLeftLeg,
            "frl": (this._criticals as any).frontRightLeg
        };

        const targetCriticalArray = locationMap[normalizedLocation];
        if (!targetCriticalArray) {
            console.error(`_allocateCritical failed: Target component area '${mechLocation}' is invalid for the active layout.`);
            return false;
        }
        // Locate the item in the unallocated holding block: by UUID first, then (as upstream always did) by tag and
        // rear-facing flag. Items rebuilt on every _calc() - heat sinks, for example - get a fresh UUID each time, so
        // the saved allocation table can only match them by tag.
        let matchIndex = this._unallocatedCriticals.findIndex(item => item && item.uuid === equipmentUUID);
        if (matchIndex < 0) {
            matchIndex = this._unallocatedCriticals.findIndex(item => item && matchesTag(item, equipmentTag) && item.rear === equipmentRear);
        }
        const currentItem = matchIndex >= 0 ? this._unallocatedCriticals[matchIndex] : undefined;
        if (!currentItem) {
            console.warn(`_allocateCritical failed: '${equipmentTag}' (UUID '${equipmentUUID}') could not be located in unallocated criticals inventory.`);
            return false;
        }
        // Synchronize location coordinate bindings onto parent references safely
        if (currentItem.obj) {
            currentItem.obj.location = normalizedLocation;
        }
        // Fallback back to native slots if no custom overrides are set
        // A saved size never exceeds what the item takes on this chassis: a superheavy design saved with
        // full-size slots loads at half size (IO:AE p.157).
        const allocationSize = critSize < 0 ? (currentItem.crits || 1) : Math.min(critSize, currentItem.crits || critSize);
        const placementSuccess = this._assignItemToArea(
            targetCriticalArray,
            currentItem,
            allocationSize,
            slotNumber,
            normalizedLocation
        );
        // Cleanly extract item out of holding vector only on a verified placement success
        if (placementSuccess && removeFromUnallocated) {
            this._unallocatedCriticals.splice(matchIndex, 1);
        }
        return placementSuccess;
    }

    private _clearArmCriticalAllocationTable() {
        for( let localCount = this._criticalAllocationTable.length; localCount >= 0; localCount--) {
            if(
                (
                    this._criticalAllocationTable[localCount] && this._criticalAllocationTable[localCount].loc === "ra"
                )
                    ||
                (
                    this._criticalAllocationTable[localCount] && this._criticalAllocationTable[localCount].loc === "la"
                )
            ) {
                this._criticalAllocationTable.splice(localCount, 1);
            }
        }
        this._calc();
    }

    public clearCriticalAllocationTable() {
        this._criticalAllocationTable = [];
        this._calc();
    }

    public setAdditionalHeatSinks(
        newValue: number
    ) {
        this._additionalHeatSinks = newValue;
        this._calc();
        return this._additionalHeatSinks;
    };

    public getUnallocatedCritCount() {
        return this._unallocatedCriticals.length;
    }

    public getInstalledEquipment() {
        this._calcVariableEquipment();
        return this._equipmentList;
    };

    /** Unit values that variable-size equipment is sized from. */
    private _variableEquipmentContext(): IVariableEquipmentContext {
        const directFireWeaponWeight = getTargetingComputerWeaponWeight(this._equipmentList);
        // Only a Ram Plate reads the charge figures.
        const hasRamPlate = this._equipmentList.some(item => item?.variableFormula === "ram-plate");
        const hasCoil = this._equipmentList.some(item => /^coil-[sml]$/.test(item?.variableFormula ?? ""));
        const spikedTorsos = hasRamPlate
            ? ["lt", "ct", "rt"].filter(loc => this._equipmentList.some(item => item?.tag === "spikes" && item.location === loc)).length : 0;
        return {
            ...(hasRamPlate ? { runMP: this.getBVRunSpeed(), torsoSpikes: spikedTorsos } : hasCoil ? { runMP: this.getBVRunSpeed() } : {}),
            tonnage: this.getTonnage(),
            engineRating: this.getEngine()?.rating ?? 0,
            engineWeight: this.getEngineWeight() ?? 0,
            directFireWeaponWeight,
            hasTSM: this._myomerType.tripleStrength,
            isQuad: this.isQuad() || this.isQuadVee(),
        };
    }

    /** A QuadVee's Tracks or Wheels, in the slots beside its conversion equipment (IO:AE pp.128, 181). */
    private _quadVeeMotiveGear(): { name: string; weight: number; cbills: number } | null {
        if (!this.isQuadVee()) return null;
        const wheeled = this._quadVeeMotive === "wheeled";
        const size = sizeVariableEquipment(wheeled ? "quadvee-wheels" : "tracks", this._variableEquipmentContext())!;
        return { name: wheeled ? "QuadVee Wheels" : "QuadVee Tracks", weight: size.weight, cbills: size.cbills };
    }

    /** A copy of a variable-size catalog item sized for this 'Mech (for pickers); other items are returned as-is. */
    public sizeEquipmentForUnit(item: IEquipmentItem): IEquipmentItem {
        if (!item.variableFormula) return item;
        const size = sizeVariableEquipment(item.variableFormula, { ...this._variableEquipmentContext(), size: item.size });
        if (!size) return item;
        return {
            ...item,
            space: { ...item.space, battlemech: size.slots },
            weight: size.weight,
            criticals: size.slots,
            cbills: size.cbills,
            damage: size.damage ?? item.damage,
            battleValue: size.battleValue ?? item.battleValue,
        };
    }

    private _calcVariableEquipment() {
        const context = this._variableEquipmentContext();
        for( let eqC = 0; eqC < this._equipmentList.length; eqC++) {
            const formula = this._equipmentList[ eqC ]?.variableFormula;
            if( formula ) {
                const turretWeight = formula === "mech-turret" ? this._getTurretCarriedWeight(this._equipmentList[ eqC ]) : undefined;
                const size = sizeVariableEquipment(formula, { ...context, size: this._equipmentList[ eqC ].size, turretWeight });
                if( size ) {
                    const currentItem = this._equipmentList[ eqC ];
                    currentItem.weight = size.weight;
                    currentItem.criticals = size.slots;
                    currentItem.space.battlemech = size.slots;
                    currentItem.cbills = size.cbills;
                    if( size.damage !== undefined ) currentItem.damage = size.damage;
                    if( size.battleValue !== undefined ) currentItem.battleValue = size.battleValue;
                }
                continue;
            }
            if( this._equipmentList[ eqC ] && this._equipmentList[ eqC ].variableSize ) {

                const currentItem = this._equipmentList[ eqC ];

                if(currentItem.criticalsDivisor) {
                    currentItem.criticals = Math.ceil( this.getTonnage() / currentItem.criticalsDivisor );
                }

                if( currentItem.weightDivisor ) {
                    currentItem.weight = Math.ceil( this.getTonnage() / currentItem.weightDivisor );
                }

                if( currentItem.damageDivisor ) {
                    currentItem.damage = Math.ceil( this.getTonnage() / currentItem.damageDivisor );
                }

                if( currentItem.damageBonus && typeof(currentItem.damage) === "number") {
                    currentItem.damage += currentItem.damageBonus;
                }
                if( currentItem.criticalsDivisor ) {
                    currentItem.space.battlemech = Math.ceil( this.getTonnage() / currentItem.criticalsDivisor );
                }

                if( currentItem.battleValuePerItemDamage && currentItem.damage) {
                    currentItem.battleValue = currentItem.battleValuePerItemDamage * +currentItem.damage;
                }

                if( currentItem.costPerItemTon ) {
                    currentItem.cbills = currentItem.costPerItemTon * currentItem.weight;
                }
            }
        }
    }

    /**
     * Superheavy 'Mechs take fusion engines only, and superheavy IndustrialMechs "may only use standard
     * and large fusion engine types" (IO:AE p.156). Large engines are the same type above rating 400.
     */
    private _isSuperheavyLegalEngine(engineTag: string): boolean {
        if (!this.isSuperheavy()) return true;
        return this.isIndustrialMech() ? engineTag === "standard" : FUSION_ENGINE_TAGS.includes(engineTag);
    }

    public getAvailableEngines(rulesLevel: number = 2): IEngineType[] {
        const returnValue: IEngineType[] = [];
        const lookupTag = this.getEngineTechBase();
        const weights = this._engine?.weight;
        const large = this.isLargeEngine();
        // Canon, then the custom catalog and this browser's drafts, which are offered only at the Custom Homebrew level.
        for (const engine of getComponentRecords("engine").map(entry => ({ ...entry }))) {
            const custom = isCustomComponent("engine", engine);
            if (custom && rulesLevel < CUSTOM_HOMEBREW_RULES_LEVEL && engine.tag !== this._engineType.tag) continue;
            // Enforce strict key verification against the normalized tech base
            if (engine.criticals && lookupTag in engine.criticals) {
                // Above rating 400 the large engine's own dates apply (IO:AE p.38); a type with
                // no large form is not offered.
                const largeEngine = large ? getLargeEngineType(engine.tag) : undefined;
                const engineDates = lookupTag === "clan" ? engine.clanDates ?? engine : engine;
                const availability = !large
                    ? this._datesAvailability(engineDates, rulesLevel)
                    : largeEngine ? this._datesAvailability(largeEngine, rulesLevel) : { available: false, asPrototype: false };
                // No weight at this rating: no large Compact, Fuel Cell or Fission engines, and Primitive
                // engines stop at an adjusted 400.
                const buildableAtRating = !weights || (weights as Record<string, number | undefined>)[BattleMech.getEngineWeightTag(engine.tag)] !== undefined;
                engine.availableAsPrototype = availability.asPrototype;
                engine.available = availability.available && buildableAtRating && this.isOfferedInEdition(engine, rulesLevel)
                    && (!custom || rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL)
                    // The Mini Engine's post covers neither large engines nor superheavies (#249).
                    && (engine.tag !== BattleMech.MINI_ENGINE_TAG || (!large && !this.isSuperheavy()))
                    && (engine.tag !== BattleMech.RFE_TAG || (!large && !this.isSuperheavy()))
                    && this._isSuperheavyLegalEngine(engine.tag)
                    && this._isChassisLegalEngine(engine.tag)
                    && (!this._isNonFusionBattleMechEngine(engine.tag) || rulesLevel >= this._nonFusionBattleMechRulesLevel())
                    && (!this.isLAM() || this._isLAMLegalComponent("engine", engine.tag));
                returnValue.push(engine);
            }
        }
        return returnValue;
    }

    /**
     * Non-ammunition components that explode when critically hit (Gauss rifles, Improved Heavy
     * lasers, etc.): -1 BV per slot (TM p.302), unlike explosive ammunition at -15 per slot.
     */
    private static _isExplosiveComponent(item: IEquipmentItem): boolean {
        return !item.isAmmo && !item.explosiveAsAmmo && !BattleMech._isLAMInternalStore(item) && (item.gauss === true || item.explosive === true);
    }

    /**
     * LAM bomb bays and fuel tanks: each slot counts as explosive ammunition (-15 BV) for the
     * defensive battle rating (-15 per slot, IO:AE p.186).
     */
    private static _isLAMInternalStore(item: IEquipmentItem): boolean {
        return matchesTag(item, BattleMech.LAM_BOMB_BAY_TAG) || matchesTag(item, BattleMech.LAM_FUEL_TANK_TAG);
    }

    /** Slots that take the -15 explosive ammunition BV penalty (TM p.302). */
    private static _isExplosiveAmmoSlot(item: IEquipmentItem): boolean {
        return (item.explosive === true && (item.isAmmo === true || item.explosiveAsAmmo === true)) || BattleMech._isLAMInternalStore(item);
    }

    /**
     * A weapon's BV for the offensive rating. Machine gun arrays have no BV of their own: they are
     * worth 0.67 x the BV of the (up to four) linked machine guns in their location (TM p.228).
     */
    private _getWeaponBattleValue(item: IEquipmentItem): number {
        // "All weapons on a unit equipped with a Drone Remote Operating System multiply their BVs by 0.8" (TO:AUE p.192).
        // Weapons, physical ones included, "linked to an AES" in their arm are worth x 1.25 (TO:AUE p.192).
        const multiplier = (this.hasDroneOperatingSystem() ? 0.8 : 1) * (this._hasArmAES(item.location) ? 1.25 : 1);
        if (item.linkedWeaponTags?.length) {
            if (!item.location) return 0;
            // A machine gun is linked to one array: where a location holds several arrays of a kind, its guns are
            // dealt among them in turn, at most four to an array.
            const arrays = this._equipmentList.filter(eq => eq.tag === item.tag && eq.location === item.location);
            const turn = arrays.indexOf(item);
            const linked = this._equipmentList
                .filter(eq => eq.location === item.location && !eq.linkedWeaponTags?.length && item.linkedWeaponTags!.includes(eq.tag))
                .filter((_gun, index) => index % arrays.length === turn)
                .slice(0, 4);
            return linked.reduce((sum, eq) => sum + (eq.battleValue || 0), 0) * 0.67 * multiplier;
        }
        // Targeting computer: direct-fire weapons x 1.25 (TM p.303).
        if (this.hasTargetingComputer() && isTargetingComputerWeapon(item)) {
            return getItemBattleValue(item, this._tech.tag) * 1.25 * multiplier;
        }
        return getItemBattleValue(item, this._tech.tag) * multiplier;
    }

    /** Is an Actuator Enhancement System mounted in this arm? */
    private _hasArmAES(location: string | undefined): boolean {
        return (location === "la" || location === "ra")
            && this._equipmentList.some(item => item?.variableFormula === "aes-arm" && item.location === location);
    }

    /** Is a Drone (Remote) Operating System fitted (TO:AUE p.117)? */
    public hasDroneOperatingSystem(): boolean {
        return this._equipmentList.some(item => item?.variableFormula === "drone-operating-system");
    }

    /** Set the size of an installed variable item (Mechanical Jump Booster MP), within its catalog limits. */
    public setEquipmentSize(itemUUID: string | undefined, size: number): IEquipmentItem | null {
        const item = this._equipmentList.find(eq => eq?.uuid === itemUUID);
        if (!item || !item.sizeLabel) return null;
        const step = item.sizeStep ?? 1;
        item.size = Math.max(step, Math.min(item.sizeMax ?? size, Math.round(size / step) * step));
        this._calc();
        return item;
    }

    /**
     * BV weight factor from Actuator Enhancement Systems: 10 percent of the tonnage for each limb mounting one
     * (TO:AUE p.192). Leg AES goes in every leg (TO:AUE p.91), so a biped gains 0.2, a tripod 0.3, a quad 0.4.
     */
    public getAESBVMultiplier(): number {
        const aes = this._equipmentList.filter(item => item?.variableFormula === "aes-arm" || item?.variableFormula === "aes-leg");
        let multiplier = 1;
        for (const arm of ["la", "ra"]) {
            if (aes.some(item => item.variableFormula === "aes-arm" && item.location === arm)) multiplier += 0.1;
        }
        const quad = this.isQuad() || this.isQuadVee();
        const legs = quad ? ["ll", "rl", "fll", "frl"] : this.isTripod() ? ["ll", "rl", "cl"] : ["ll", "rl"];
        if (legs.every(leg => aes.some(item => item.variableFormula === "aes-leg" && item.location === leg))) {
            multiplier += 0.1 * legs.length;
        }
        return Math.round(multiplier * 100) / 100;
    }

    /** Whether a targeting computer is installed (TM p.238). */
    public hasTargetingComputer(): boolean {
        return this._equipmentList.some(item => item?.variableFormula?.startsWith("targeting-computer"));
    }

    /**
     * The targeting and tracking system whose to-hit effects apply: the mounted one, or for a variable-range system
     * set to long or short, that system's record (Maximum Tech p.59).
     */
    public getTargetingSystem(): IEquipmentItem | undefined {
        const system = this._equipmentList.find(item => item?.targetingSystem);
        if (!system?.targetingSystem?.variableRange || this.targetingRangeSetting === "normal") return system;
        const tag = `targeting-${this.targetingRangeSetting}-range`;
        return this.getEquipmentList(this._tech.tag).find(item => item.tag === tag) ?? system;
    }

    /** Equipment whose BV counts toward the defensive rating (TM p.302: AMS, ECM, active probes, pods). */
    private _isDefensiveBVEquipment(item: IEquipmentItem): boolean {
        return item.battleValueDefensive === true;
    }

    /**
     * Availability of a construction component in the selected era: in production,
     * or (at the Experimental rules level) as a prototype.
     */
    private _datesAvailability(dates: ITechDates, rulesLevel: number): { available: boolean, asPrototype: boolean } {
        return getDatesAvailability(dates, rulesLevel, (introduced, extinct, reintroduced) => this._itemIsAvailable(introduced, extinct, reintroduced));
    }

    /** Availability using the Clan window for Clan designs; mixed tech may use either (getTechDatesAvailability). */
    private _techDatesAvailability(item: ITechDates & { clanDates?: ITechDates }, rulesLevel: number): { available: boolean, asPrototype: boolean } {
        return getTechDatesAvailability(item, this.getTech().tag, rulesLevel, (introduced, extinct, reintroduced) => this._itemIsAvailable(introduced, extinct, reintroduced));
    }

    /**
     * Whether this Clan design fields the Star League version of a component (Inner Sphere slots and
     * armor factor) because the Clan version is not yet in production in the selected era.
     */
    private _usesStarLeagueVersion(item: ITechDates & { clanDates?: ITechDates }): boolean {
        return this.getTech().tag === "clan" && mustUseStarLeagueVersion(item, (introduced, extinct, reintroduced) => this._itemIsAvailable(introduced, extinct, reintroduced));
    }

    /** Whether the selected era overlaps the years the Clans fielded the Star League version of a component. */
    private _starLeagueVersionInEra(item: ITechDates & { clanDates?: ITechDates }): boolean {
        return starLeagueVersionInEra(item, (introduced, extinct, reintroduced) => this._itemIsAvailable(introduced, extinct, reintroduced));
    }

    public getAvailableGyros(rulesLevel: number = 2): IGyro[] {
        const returnValue: IGyro[] = [];
        // A 5-ton Power Armor suit has no gyro and no choice of one (Best-of p.16).
        if (this._isFiveTonPowerArmor()) {
            const none = findByTag(mechGyroTypes, "none");
            if (none) return [{ ...none, available: true, availableAsPrototype: false }];
        }

        for (const gyro of mechGyroTypes.map(entry => ({ ...entry }))) {
            const availability = this._datesAvailability(gyro, rulesLevel);
            gyro.availableAsPrototype = availability.asPrototype;
            gyro.available = availability.available && this.isOfferedInEdition(gyro, rulesLevel) && !(gyro.innerSphereOnly && this.getTech().tag === "clan")
                && (!this.isLAM() || this._isLAMLegalGyro(gyro.tag))
                // Only an interface cockpit lets a 'Mech go without a gyro (IO:AE p.110).
                && (gyro.tag !== "none" || this.getCockpitType().tag === "interface")
                // IndustrialMechs and Primitive 'Mechs take the standard gyro only (TM p.69; IO:AE p.116).
                && (!this._hasBasicChassis() || gyro.tag === "standard");

            returnValue.push( gyro );
        }

        return returnValue;
    }

    public getAvailableInternalStructures(rulesLevel: number = 2): IInternalStructure[] {
        return mechInternalStructureTypes.map(entry => ({ ...entry })).map(structure => {
            const availability = this._techDatesAvailability(structure, rulesLevel);
            structure.availableAsPrototype = availability.asPrototype;
            structure.available = availability.available && this.isOfferedInEdition(structure, rulesLevel) && !(structure.innerSphereOnly && this.getTech().tag === "clan")
                && (!this.isLAM() || this._isLAMLegalComponent("structure", structure.tag))
                && (!this.isSuperheavy() || BattleMech.SUPERHEAVY_STRUCTURE_TAGS.includes(structure.tag))
                // "standard internal structure (or standard IndustrialMech structure, for IndustrialMechs)" (IO:AE p.116).
                && (!this._primitive || BattleMech.PRIMITIVE_STRUCTURE_TAGS.includes(structure.tag));
            return structure;
        });
    }

    public getAvailableHeatSinks(rulesLevel: number = 2): IHeatSync[] {
        return mechHeatSinkTypes.map(entry => ({ ...entry })).map(heatSink => {
            const availability = this._techDatesAvailability(heatSink, rulesLevel);
            heatSink.availableAsPrototype = availability.asPrototype;
            heatSink.available = availability.available && this.isOfferedInEdition(heatSink, rulesLevel) && servesTechBase(heatSink.techBase, this.getTech().tag)
                // IndustrialMechs and Primitive 'Mechs use single heat sinks only (TM p.71; IO:AE p.117).
                && (!this._hasBasicChassis() || heatSink.tag === "single");
            return heatSink;
        });
    }

    /**
     * IndustrialMech armor: Commercial, Industrial and Heavy Industrial (which is Standard armor) are for
     * IndustrialMechs, which "may not carry Ferro-Fibrous or Stealth armor" (TM p.72); the Dark Age armors
     * are open to them only under Experimental Mixed-Tech rules (IO:AE p.82). An Experimental IndustrialMech
     * "may also make use of all other BattleMech-legal armor types" (TO:AUE p.92), so those are legal here and
     * held to the rules level by _isIndustrialMechExperimentalArmor.
     */
    private _isArmorLegalForChassis(armor: IArmorType): boolean {
        if (this._primitive) return armor.tag === this._getPrimitiveArmorTag();
        if (!this.isIndustrialMech()) return !armor.industrialMechOnly;
        return !BattleMech.DARK_AGE_ARMOR_TAGS.includes(armor.tag) || this._isMixedTechBase();
    }

    /** An IndustrialMech armor beyond Standard and the industrial grades, which needs the Experimental rules level (TO:AUE p.92). */
    private _isIndustrialMechExperimentalArmor(armor: IArmorType): boolean {
        // Patchwork is a way of mounting armor, open to every 'Mech; its locations are held to the same rule.
        return this.isIndustrialMech() && !this._primitive && armor.industrialMechOnly !== true
            && armor.tag !== "standard" && armor.tag !== BattleMech.PATCHWORK_ARMOR_TAG;
    }

    public static readonly PATCHWORK_ARMOR_TAG = "patchwork";
    private static readonly PATCHWORK_LOCATIONS: Record<string, { key: string, abbr: string, label: string }> = {
        head: { key: "head", abbr: "hd", label: "Head" },
        centerTorso: { key: "centerTorso", abbr: "ct", label: "Center Torso" },
        leftTorso: { key: "leftTorso", abbr: "lt", label: "Left Torso" },
        rightTorso: { key: "rightTorso", abbr: "rt", label: "Right Torso" },
        leftArm: { key: "leftArm", abbr: "la", label: "Left Arm" },
        rightArm: { key: "rightArm", abbr: "ra", label: "Right Arm" },
        leftLeg: { key: "leftLeg", abbr: "ll", label: "Left Leg" },
        rightLeg: { key: "rightLeg", abbr: "rl", label: "Right Leg" },
        centerLeg: { key: "centerLeg", abbr: "cl", label: "Center Leg" },
        frontLeftLeg: { key: "frontLeftLeg", abbr: "fll", label: "Front Left Leg" },
        frontRightLeg: { key: "frontRightLeg", abbr: "frl", label: "Front Right Leg" },
    };

    /** Commercial armor counts half in the defensive BV; the other modifiers are on the records. */
    private static _armorBVMultiplier(armor: IArmorType): number {
        return armor.bvMultiplier ?? (armor.tag === "commercial" ? 0.5 : 1);
    }

    /**
     * The weight of one patchwork location's armor: "rounding the final result up to the nearest half-ton"
     * (TO:AUE p.189). Under Fractional Accounting such rounding is dropped and figures are rounded "up to
     * the nearest kilogram (0.001 tons)" (TO:AUE p.188).
     */
    public static roundPatchworkArmorWeight(weight: number, accounting: "standard" | "fractional" = "standard"): number {
        if (!(weight > 0)) return 0;
        return accounting === "fractional"
            ? Math.ceil(weight * 1000 - 1e-9) / 1000
            : Math.ceil(weight * 2 - 1e-9) / 2;
    }

    public getWeightAccounting(): "standard" | "fractional" {
        return this._weightAccounting;
    }

    /** Patchwork Armor: an armor type for each hit location (TO:AUE p.189). */
    public isPatchworkArmor(): boolean {
        return this._armorType.tag === BattleMech.PATCHWORK_ARMOR_TAG;
    }

    /** The hit locations that take an armor type under Patchwork Armor; a torso's front and rear share one. */
    public getPatchworkLocations(): { key: string, abbr: string, label: string }[] {
        const typeTag = this._mechType.tag.toLowerCase();
        const locations = BattleMech.PATCHWORK_LOCATIONS;
        const core = [locations.head, locations.centerTorso, locations.leftTorso, locations.rightTorso];
        if (typeTag === "quad" || typeTag === "quadvee") {
            return [...core, locations.frontLeftLeg, locations.frontRightLeg,
                { ...locations.leftLeg, label: "Rear Left Leg" }, { ...locations.rightLeg, label: "Rear Right Leg" }];
        }
        const limbs = [...(this.isArmless() ? [] : [locations.leftArm, locations.rightArm]), locations.leftLeg, locations.rightLeg];
        return typeTag === "tripod" ? [...core, ...limbs, locations.centerLeg] : [...core, ...limbs];
    }

    /** The tech base whose table row a patchwork location uses, or null when the armor has none for this unit. */
    private _getPatchworkTechBase(armor: IArmorType): "is" | "clan" | null {
        const slots = armor.patchwork?.slots;
        if (!slots) return null;
        const techTag = this.getTech().tag;
        const preferred = techTag === "clan" || techTag === "mclan" ? "clan" : "is";
        if (slots[preferred] !== undefined) return preferred;
        const other = preferred === "clan" ? "is" : "clan";
        return (techTag === "mis" || techTag === "mclan") && slots[other] !== undefined ? other : null;
    }

    /** Whether this unit may carry the armor in a patchwork location, dates aside. */
    private _isPatchworkLocationType(armor: IArmorType): boolean {
        return armor.tag !== BattleMech.PATCHWORK_ARMOR_TAG
            && armor.unitTypes.battlemech
            && armor.constructionStatus !== "deferred" && armor.constructionMode !== "equipment"
            && this._getPatchworkTechBase(armor) !== null
            && this._isArmorLegalForChassis(armor)
            && (!this.isLAM() || this._isLAMLegalComponent("armor", armor.tag));
    }

    /** The armor types this unit may put in a patchwork location: those it could mount as its only armor. */
    public getAvailablePatchworkArmorTypes(rulesLevel: number = 2): IArmorType[] {
        return this.getAvailableArmorTypes(rulesLevel).filter(armor => armor.available && this._isPatchworkLocationType(armor));
    }

    public getPatchworkArmorType(locationKey: string): IArmorType {
        return findByTag(mechArmorTypes, this._patchworkArmor[locationKey] ?? "standard") ?? mechArmorTypes[0];
    }

    public setPatchworkArmorType(locationKey: string, armorTag: string): IArmorType {
        const armor = findByTag(mechArmorTypes, armorTag);
        if (this.isPatchworkArmor() && armor && this._isPatchworkLocationType(armor)
            && this.getPatchworkLocations().some(location => location.key === locationKey)) {
            this._patchworkArmor[locationKey] = armor.tag;
            this._calc();
        }
        return this.getPatchworkArmorType(locationKey);
    }

    /** Armor points in a patchwork location, a torso's rear included. */
    private _getPatchworkLocationPoints(locationKey: string): number {
        const allocation = this._armorAllocation as unknown as Record<string, number>;
        return (allocation[locationKey] ?? 0) + (allocation[`${locationKey}Rear`] ?? 0);
    }

    /** Critical slots the location's armor takes there (Patchwork Armor Table, TO:AUE p.189; IO:AE p.82). */
    public getPatchworkLocationSlots(locationKey: string): number {
        if (!this.isPatchworkArmor()) return 0;
        const armor = this.getPatchworkArmorType(locationKey);
        const techBase = this._getPatchworkTechBase(armor);
        return techBase ? this.getCriticalSlots(armor.patchwork?.slots[techBase] ?? 0) : 0;
    }

    /** Tons of armor in the location: points x the type's tons per point, rounded per location. */
    public getPatchworkLocationWeight(locationKey: string): number {
        if (!this.isPatchworkArmor()) return 0;
        const armor = this.getPatchworkArmorType(locationKey);
        const techBase = this._getPatchworkTechBase(armor);
        const tonsPerPoint = techBase ? armor.patchwork?.tonsPerPoint[techBase] ?? 0 : 0;
        return BattleMech.roundPatchworkArmorWeight(this._getPatchworkLocationPoints(locationKey) * tonsPerPoint, this._weightAccounting);
    }

    private _getPatchworkArmorWeight(): number {
        return this.getPatchworkLocations().reduce((total, location) => total + this.getPatchworkLocationWeight(location.key), 0);
    }

    /** Armor cost: tons x the type's cost per ton; under Patchwork Armor, location by location. */
    public getArmorCost(): number {
        if (!this.isPatchworkArmor()) return this._armorType.costMultiplier * this._armorWeight;
        return this.getPatchworkLocations().reduce((total, location) =>
            total + this.getPatchworkLocationWeight(location.key) * this.getPatchworkArmorType(location.key).costMultiplier, 0);
    }

    /** One readout line per patchwork location: "Right Arm: Ferro Fibrous, 1.5 tons". */
    public _getPatchworkReadoutLines(): string[] {
        if (!this.isPatchworkArmor()) return [];
        return this.getPatchworkLocations().map(location => {
            const weight = this.getPatchworkLocationWeight(location.key);
            return `${location.label}: ${this.getPatchworkArmorType(location.key).name}, ${weight} ton${weight === 1 ? "" : "s"}`;
        });
    }

    /** HarJel II / III work with some armor types only; under Patchwork Armor one such location is enough to mount one. */
    private _hasRepairSystemArmor(): boolean {
        if (!this.isPatchworkArmor()) return BattleMech.REPAIR_SYSTEM_ARMOR_TAGS.includes(this._armorType.tag);
        return this.getPatchworkLocations().some(location => BattleMech.REPAIR_SYSTEM_ARMOR_TAGS.includes(this.getPatchworkArmorType(location.key).tag));
    }

    /**
     * FrankenMech internal structure weight, by location: "Each limb is considered to weigh 10 percent of the total
     * internal structure weight. The center torso weighs 25 percent, the left and right torso weigh 15 percent each,
     * and the head weighs 5 percent" (CO p.213).
     */
    private static readonly FRANKENMECH_STRUCTURE_SHARES: Record<string, number> = {
        head: 0.05, centerTorso: 0.25, leftTorso: 0.15, rightTorso: 0.15,
        leftArm: 0.1, rightArm: 0.1, leftLeg: 0.1, rightLeg: 0.1, frontLeftLeg: 0.1, frontRightLeg: 0.1, centerLeg: 0.1,
    };
    /**
     * Internal Structure Distribution Table (CO p.212): a location's slots for Inner Sphere endo steel ("is") and for
     * Clan endo steel or either endo-composite ("compact"). A four-legged 'Mech's front legs are legs (via MegaMek).
     */
    private static readonly FRANKENMECH_STRUCTURE_SLOTS: Record<"is" | "compact", Record<"head" | "centerTorso" | "sideTorso" | "arm" | "leg", number>> = {
        is: { head: 1, centerTorso: 1, sideTorso: 3, arm: 2, leg: 1 },
        compact: { head: 0, centerTorso: 1, sideTorso: 1, arm: 1, leg: 1 },
    };
    /** Structure a FrankenMech location may come with: the types the distribution table covers, or that take no slots. */
    public static readonly FRANKENMECH_STRUCTURE_TAGS: readonly string[] = ["standard", "endo-steel", "endo-composite", "reinforced", "composite", "industrial"];
    private static readonly FRANKENMECH_LEG_KEYS: readonly string[] = ["leftLeg", "rightLeg", "frontLeftLeg", "frontRightLeg", "centerLeg"];

    /** FrankenMech: built from the body locations of other 'Mechs (CO pp.213-214). */
    public isFrankenMech(): boolean {
        return this._frankenMech;
    }

    /**
     * FrankenMechs are Experimental: the published ones are "Experimental-FrankenMech" (XTRO:Royal Fantasy p.8),
     * and MegaMek offers them at that level. The rule is Campaign Operations', so an earlier edition has none.
     */
    public canBeFrankenMech(rulesLevel: number = 2): boolean {
        return rulesLevel >= EXPERIMENTAL_RULES_LEVEL && !this.usesEarlierRulesEdition();
    }

    /** Makes the design a FrankenMech, every location starting as the center torso's 'Mech, or an ordinary 'Mech again. */
    public setFrankenMech(frankenMech: boolean, rulesLevel: number = EXPERIMENTAL_RULES_LEVEL): boolean {
        if (frankenMech && !this._frankenMech && !this.canBeFrankenMech(rulesLevel)) return this._frankenMech;
        this._frankenMech = frankenMech;
        this._frankenMechDonors = {};
        this._frankenMechJumpJetClass = null;
        // OmniMech parts "lose all benefits and special abilities associated with OmniMechs" (CO p.213).
        if (frankenMech && this._omnimech) this.toggleOmni();
        this.setTonnage(this._tonnage);
        return this._frankenMech;
    }

    /** The body locations a FrankenMech is assembled from: those that take an armor type under Patchwork Armor. */
    public getFrankenMechLocations(): { key: string, abbr: string, label: string }[] {
        return this.getPatchworkLocations();
    }

    /** Where a location came from. The center torso sets the FrankenMech's tonnage and structure type. */
    public getFrankenMechDonor(locationKey: string): IFrankenMechDonor {
        const saved = this._frankenMech ? this._frankenMechDonors[locationKey] : undefined;
        const centerTorso = locationKey === "centerTorso";
        const structureTag = !centerTorso ? saved?.structure ?? this._selectedInternalStructure.tag : this._selectedInternalStructure.tag;
        const structure = findByTag(mechInternalStructureTypes, structureTag) ?? this._selectedInternalStructure;
        const structureTechBase = saved?.structureTechBase && this.getFrankenMechStructureTechBases().includes(saved.structureTechBase)
            ? saved.structureTechBase : this._defaultStructureTechBase(structure);
        const donor: IFrankenMechDonor = {
            tonnage: !centerTorso ? saved?.tonnage ?? this._tonnage : this._tonnage,
            structure: structureTag,
            name: saved?.name ?? "",
            structureTechBase,
        };
        const wholeUnitSlots = structure.crits[structureTechBase];
        if (saved?.structureSlots !== undefined && wholeUnitSlots > 0 && saved.structureSlots <= wholeUnitSlots) {
            donor.structureSlots = saved.structureSlots;
        }
        return donor;
    }

    /** Whose structure slots a whole 'Mech of this tech base uses: a Clan 'Mech's, unless the structure is the Star League version. */
    private _defaultStructureTechBase(structure: IInternalStructure): "is" | "clan" {
        return this.getTech().tag === "clan" && !this._usesStarLeagueVersion(structure) ? "clan" : "is";
    }

    /** Structure tech bases a location may come with: either on a Mixed Tech 'Mech, otherwise the 'Mech's own. */
    public getFrankenMechStructureTechBases(): ("is" | "clan")[] {
        if (this._isMixedTechBase()) return ["is", "clan"];
        return [this.getTech().tag === "clan" ? "clan" : "is"];
    }

    /** Slot counts a location's structure may have kept from its donor's design: 1 up to the whole structure's. */
    public getFrankenMechDonorSlotCounts(locationKey: string): number[] {
        const donor = this.getFrankenMechDonor(locationKey);
        const wholeUnitSlots = findByTag(mechInternalStructureTypes, donor.structure)?.crits[donor.structureTechBase ?? "is"] ?? 0;
        return Array.from({ length: wholeUnitSlots }, (_, index) => index + 1);
    }

    /**
     * Tonnages a location may come from. "The legs must be from a 'Mech of the same tonnage or heavier" (CO p.213);
     * other parts may come from any 'Mech up to 100 tons, or up to 200 on a superheavy (via MegaMek).
     */
    public getFrankenMechDonorTonnages(locationKey: string): number[] {
        if (locationKey === "centerTorso") return [this._tonnage];
        const typeKey = this.getMechType().tag as keyof IInternalStructure["perMechType"];
        const heaviest = this._tonnage > 100 ? 200 : 100;
        const lightest = BattleMech.FRANKENMECH_LEG_KEYS.includes(locationKey) ? this._tonnage : 0;
        return Object.keys(this._selectedInternalStructure.perMechType[typeKey] ?? {}).map(Number)
            .filter(tonnage => tonnage >= lightest && tonnage <= heaviest)
            .sort((a, b) => a - b);
    }

    /** Structure types a location may come with, marked available as the 'Mech's own structure selector marks them. */
    public getFrankenMechDonorStructures(rulesLevel: number = 2): IInternalStructure[] {
        return this.getAvailableInternalStructures(rulesLevel).filter(structure => this._isFrankenMechDonorStructure(structure.tag));
    }

    private _isFrankenMechDonorStructure(structureTag: string): boolean {
        if (!BattleMech.FRANKENMECH_STRUCTURE_TAGS.includes(structureTag)) return false;
        return !!findByTag(mechInternalStructureTypes, structureTag);
    }

    /** Sets where one location came from. Values the location may not take are ignored. */
    public setFrankenMechDonor(locationKey: string, donor: Partial<IFrankenMechDonor>): IFrankenMechDonor {
        if (!this._frankenMech || !this.getFrankenMechLocations().some(location => location.key === locationKey)) {
            return this.getFrankenMechDonor(locationKey);
        }
        const saved = { ...this._frankenMechDonors[locationKey] };
        if (donor.tonnage !== undefined && locationKey !== "centerTorso" && this.getFrankenMechDonorTonnages(locationKey).includes(donor.tonnage)) {
            saved.tonnage = donor.tonnage;
        }
        if (donor.structure !== undefined && locationKey !== "centerTorso" && this._isFrankenMechDonorStructure(donor.structure)) {
            saved.structure = findByTag(mechInternalStructureTypes, donor.structure)?.tag ?? saved.structure;
        }
        if (donor.name !== undefined) saved.name = donor.name.slice(0, BattleMech.FRANKENMECH_DONOR_NAME_LENGTH);
        if (donor.structureTechBase !== undefined && this.getFrankenMechStructureTechBases().includes(donor.structureTechBase)) {
            saved.structureTechBase = donor.structureTechBase;
        }
        this._frankenMechDonors[locationKey] = saved;
        // The slot count is checked against the structure just set; 0 goes back to the table.
        if (donor.structureSlots === 0) {
            delete saved.structureSlots;
        } else if (donor.structureSlots !== undefined && this.getFrankenMechDonorSlotCounts(locationKey).includes(donor.structureSlots)) {
            saved.structureSlots = donor.structureSlots;
        }
        this.setTonnage(this._tonnage);
        return this.getFrankenMechDonor(locationKey);
    }

    public static readonly FRANKENMECH_DONOR_NAME_LENGTH = 60;

    /** Drops donors the 'Mech can no longer take: a location it lost, legs lighter than the 'Mech, a structure it cannot use. */
    private _pruneFrankenMechDonors(): void {
        const locations = this.getFrankenMechLocations().map(location => location.key);
        for (const [locationKey, donor] of Object.entries(this._frankenMechDonors)) {
            if (!locations.includes(locationKey)) {
                delete this._frankenMechDonors[locationKey];
                continue;
            }
            if (donor.tonnage !== undefined && !this.getFrankenMechDonorTonnages(locationKey).includes(donor.tonnage)) delete donor.tonnage;
            if (donor.structure !== undefined && !this._isFrankenMechDonorStructure(donor.structure)) delete donor.structure;
        }
    }

    /** Gives each FrankenMech location the structure points of its donor's tonnage. */
    private _applyFrankenMechStructure(typeKey: keyof IInternalStructure["perMechType"]): void {
        if (!this._frankenMech) return;
        this._pruneFrankenMechDonors();
        const points = this._internalStructure as unknown as Record<string, number>;
        for (const location of this.getFrankenMechLocations()) {
            const donor = this.getFrankenMechDonor(location.key);
            const listed = this._selectedInternalStructure.perMechType[typeKey]?.[donor.tonnage] as unknown as Record<string, number | undefined> | undefined;
            const locationPoints = listed?.[location.key];
            if (locationPoints !== undefined) points[location.key] = locationPoints;
        }
    }

    public getFrankenMechLocationStructure(locationKey: string): IInternalStructure {
        return findByTag(mechInternalStructureTypes, this.getFrankenMechDonor(locationKey).structure) ?? this._selectedInternalStructure;
    }

    /** The location's structure by name, saying whose it is on a Mixed Tech 'Mech when it takes slots: "Endo-Steel (Clan)". */
    public getFrankenMechLocationStructureName(locationKey: string): string {
        const structure = this.getFrankenMechLocationStructure(locationKey);
        if (!this._isMixedTechBase() || structure.crits.is <= 0) return structure.name;
        return `${structure.name} (${this.getFrankenMechDonor(locationKey).structureTechBase === "clan" ? "Clan" : "IS"})`;
    }

    /** The location's share of its donor's whole internal structure weight (CO p.213). */
    public getFrankenMechLocationStructureWeight(locationKey: string): number {
        const donor = this.getFrankenMechDonor(locationKey);
        return BattleMech._structureWeight(donor.structure, donor.tonnage) * (BattleMech.FRANKENMECH_STRUCTURE_SHARES[locationKey] ?? 0);
    }

    /** "The combined weight of all eight locations is added together and the result is rounded up to the nearest .5 tons" (CO p.213). */
    private _getFrankenMechStructureWeight(): number {
        const total = this.getFrankenMechLocations().reduce((sum, location) => sum + this.getFrankenMechLocationStructureWeight(location.key), 0);
        return BattleMech.roundPatchworkArmorWeight(total, this._weightAccounting);
    }

    /**
     * Critical slots the location's structure takes there: "retained from the donor design or, if no critical slot
     * of the appropriate internal structure type is present, the number listed on the Internal Structure
     * Distribution Table" (CO pp.212-213).
     */
    public getFrankenMechLocationStructureSlots(locationKey: string): number {
        if (!this._frankenMech) return 0;
        const donor = this.getFrankenMechDonor(locationKey);
        if (donor.structureSlots !== undefined) return donor.structureSlots;
        return this.getFrankenMechTableStructureSlots(locationKey);
    }

    /** The Internal Structure Distribution Table's slots for the location's structure (CO p.212). */
    public getFrankenMechTableStructureSlots(locationKey: string): number {
        const donor = this.getFrankenMechDonor(locationKey);
        const structure = this.getFrankenMechLocationStructure(locationKey);
        const wholeUnitSlots = structure.crits[donor.structureTechBase ?? this._defaultStructureTechBase(structure)];
        if (wholeUnitSlots <= 0) return 0;
        // Inner Sphere endo steel takes 14 slots in a whole 'Mech; the table's other column is for the 7-slot kinds.
        const column = BattleMech.FRANKENMECH_STRUCTURE_SLOTS[wholeUnitSlots >= 14 ? "is" : "compact"];
        if (locationKey === "head" || locationKey === "centerTorso") return column[locationKey];
        if (locationKey === "leftTorso" || locationKey === "rightTorso") return column.sideTorso;
        return BattleMech.FRANKENMECH_LEG_KEYS.includes(locationKey) ? column.leg : column.arm;
    }

    /** Does a location's structure differ from the center torso's? Then the structure is a hybrid. */
    public hasFrankenMechHybridStructure(): boolean {
        return this._frankenMech && this.getFrankenMechLocations()
            .some(location => this.getFrankenMechDonor(location.key).structure !== this._selectedInternalStructure.tag);
    }

    /**
     * Piloting Skill Roll modifier for the legs: "if they are not from the same 'Mech, apply a +1 Piloting Skill Roll
     * modifier; if the legs are from different tonnage 'Mechs, apply a +2" (CO p.213). The +2 is read as taking the
     * place of the +1, since legs of different tonnages are never from the same 'Mech.
     */
    public getFrankenMechLegPilotingModifier(): number {
        if (!this._frankenMech) return 0;
        const legs = this.getFrankenMechLocations().filter(location => BattleMech.FRANKENMECH_LEG_KEYS.includes(location.key))
            .map(location => this.getFrankenMechDonor(location.key));
        if (new Set(legs.map(leg => leg.tonnage)).size > 1) return 2;
        return new Set(legs.map(leg => (leg.name ?? "").trim().toLowerCase())).size > 1 ? 1 : 0;
    }

    /** Lighter jump jet classes this FrankenMech may have kept; heavier jets "cannot be mounted" (CO p.213, errata v4.0). */
    public getFrankenMechJumpJetClasses(): FrankenMechJumpJetClass[] {
        if (!this._frankenMech || this.isLAM() || this._jumpJetType.underwater || this.isSuperheavy()) return [];
        const classes: FrankenMechJumpJetClass[] = ["light", "medium", "heavy"];
        return classes.filter(jetClass => this._jumpJetType.weight_multiplier[jetClass] < this._ownJumpJetWeightEach());
    }

    public getFrankenMechJumpJetClass(): FrankenMechJumpJetClass | null {
        return this.usesLighterJumpJets() ? this._frankenMechJumpJetClass : null;
    }

    /** Keeps lighter jump jets, or (null) the 'Mech's own size. The jet count is kept to what the new size allows. */
    public setFrankenMechJumpJetClass(jetClass: FrankenMechJumpJetClass | null): FrankenMechJumpJetClass | null {
        if (jetClass === null || this.getFrankenMechJumpJetClasses().includes(jetClass)) {
            this._frankenMechJumpJetClass = jetClass;
            this.setJumpSpeed(Math.min(this._jumpSpeed, this.getMaxJumpJetCount()));
        }
        return this.getFrankenMechJumpJetClass();
    }

    /** The structure as the readouts name it: a FrankenMech of mixed structure has "Hybrid" structure, as MegaMek writes it. */
    public getInternalStructureLabel(): string {
        if (!this._frankenMech) return this._selectedInternalStructure.name;
        return this.hasFrankenMechHybridStructure() ? "Hybrid, FrankenMech" : `${this._selectedInternalStructure.name}, FrankenMech`;
    }

    /** One readout line per FrankenMech location ("Right Arm: 70-ton 'Mech (Warhammer), Standard, 11 points"), then the legs' modifier. */
    public _getFrankenMechReadoutLines(): string[] {
        if (!this._frankenMech) return [];
        const points = this._internalStructure as unknown as Record<string, number>;
        const lines = this.getFrankenMechLocations().map(location => {
            const donor = this.getFrankenMechDonor(location.key);
            const name = donor.name?.trim() ? ` (${donor.name.trim()})` : "";
            const slots = this.getFrankenMechLocationStructureSlots(location.key);
            const slotText = slots > 0 ? `, ${slots} slot${slots === 1 ? "" : "s"}` : "";
            return `${location.label}: ${donor.tonnage}-ton 'Mech${name}, ${this.getFrankenMechLocationStructureName(location.key)}${slotText}, ${points[location.key] ?? 0} points`;
        });
        const legModifier = this.getFrankenMechLegPilotingModifier();
        if (legModifier > 0) {
            lines.push(`Legs from ${legModifier === 2 ? "'Mechs of different tonnages" : "different 'Mechs"}: +${legModifier} to Piloting Skill Rolls`);
        }
        return lines;
    }

    /** The Dark Age armors of IO:AE pp.80-82 (Advanced Armor Table). */
    public static readonly DARK_AGE_ARMOR_TAGS: readonly string[] = ["anti-penetrative-ablation", "ballistic-reinforced", "heat-dissipating", "impact-resistant"];
    /** Engines an IndustrialMech or a Primitive 'Mech may mount (TM p.68; IO:AE p.117). */
    public static readonly BASIC_ENGINE_TAGS: readonly string[] = ["standard", "ice", "cell", "fission"];
    public static readonly PRIMITIVE_STRUCTURE_TAGS: readonly string[] = ["standard", "industrial"];

    private _isMixedTechBase(): boolean {
        return this._tech.tag === "mis" || this._tech.tag === "mclan";
    }

    /** An IndustrialMech or a Primitive 'Mech: standard gyro and single heat sinks only. */
    private _hasBasicChassis(): boolean {
        return this._primitive || this.isIndustrialMech();
    }

    /** "Primitive BattleMechs can only mount Primitive BattleMech armor"; Primitive IndustrialMechs "only ... Commercial armor" (IO:AE p.118). */
    private _getPrimitiveArmorTag(): string {
        return this.isIndustrialMech() ? "commercial" : "primitive";
    }

    /** A superheavy IndustrialMech has its own, narrower engine rule (see _isSuperheavyLegalEngine). */
    private _isChassisLegalEngine(engineTag: string): boolean {
        return !this._hasBasicChassis() || BattleMech.BASIC_ENGINE_TAGS.includes(engineTag);
    }

    /**
     * An ICE, fuel cell or fission engine in a BattleMech: a "low-tech 'Mech" (Non-Fusion BattleMechs, TO:AUE p.120).
     * IndustrialMechs and Primitive 'Mechs mount these engines by their own rules.
     */
    private _isNonFusionBattleMechEngine(engineTag: string): boolean {
        return !this._hasBasicChassis() && /^(ice|cell|fission)$/.test(engineTag);
    }

    /**
     * The rules level of a Non-Fusion BattleMech: Experimental from Total Warfare on (TO:AUE p.120). The editions before
     * it build BattleMechs with a fusion engine only ("Each BattleMech carries one fusion plant", BMR p.111) and give
     * the ICE to vehicles and buildings (BTM pp.81-82, 84; BMR p.119), so there it is Custom Homebrew.
     */
    private _nonFusionBattleMechRulesLevel(): number {
        return this.usesEarlierRulesEdition() ? CUSTOM_HOMEBREW_RULES_LEVEL : EXPERIMENTAL_RULES_LEVEL;
    }

    /** A BattleMech with an ICE, fuel cell or fission engine (TO:AUE p.120). */
    public isNonFusionBattleMech(): boolean {
        return this._isNonFusionBattleMechEngine(this._engineType.tag);
    }

    /**
     * IndustrialMechs are "incompatible with the MASC and Triple-Strength Myomer (TSM) technologies" and may use
     * Industrial TSM instead (TM p.70); Primitive 'Mechs take no physical enhancement at all (IO:AE p.117).
     */
    private _isChassisLegalMyomer(myomer: IMyomerType): boolean {
        if (this._primitive) return myomer.tag === "standard";
        if (this.isIndustrialMech()) return myomer.tag === "standard" || myomer.tag === "industrial-tsm";
        return myomer.tag !== "industrial-tsm";
    }

    public isPrimitive(): boolean {
        return this._primitive;
    }

    /**
     * RetroTech: "RetroTech rules apply any time a unit built with the Primitive Tech Base is designed to employ any
     * non-Primitive weapons or equipment" (IO:AE p.116). Here that is anything first introduced after 2500, or jump
     * jets other than the standard kind (Primitive 'Mechs use prototype or standard jump jets; RetroTech 'Mechs any).
     */
    public isRetroTech(): boolean {
        if (!this._primitive) return false;
        if (this._jumpSpeed > 0 && this._jumpJetType.tag !== "standard") return true;
        return this._equipmentList.some(item => item && isPostPrimitiveTechnology(item));
    }

    /** "Primitive BattleMech", "RetroTech IndustrialMech" and so on; null for a 'Mech built to the modern rules. */
    public getConstructionName(): string | null {
        if (!this._primitive) return null;
        return (this.isRetroTech() ? "RetroTech " : "Primitive ") + (this.isIndustrialMech() ? "IndustrialMech" : "BattleMech");
    }

    /**
     * To-hit modifier on weapon attacks from the cockpit's fire control. An IndustrialMech without Advanced Fire
     * Control: +1 (TM p.69). A Primitive IndustrialMech cockpit: +2, or +1 with Advanced Fire Control; the Primitive
     * BattleMech cockpit "applies no modifiers in combat" (IO:AE p.114). RetroTech IndustrialMechs keep it (IO:AE p.116).
     */
    public getFireControlToHitModifier(): number {
        if (!this.isIndustrialMech()) return 0;
        if (this._primitive) return this.hasAdvancedFireControl() ? 1 : 2;
        return this.hasAdvancedFireControl() ? 0 : 1;
    }

    /**
     * Primitive 'Mechs "can only be built using Inner Sphere technology", "cannot be constructed as OmniMechs,
     * nor may they be designed as LAMs, QuadVees, or Tripods", and weigh 10 to 100 tons (IO:AE p.117).
     * A mixed-tech design with an Inner Sphere base is the RetroTech case of p.115.
     */
    public canBePrimitive(): boolean {
        const typeTag = this._mechType.tag.toLowerCase();
        // An IO:AE rule: no earlier rulebook has it.
        return !this.usesEarlierRulesEdition() && (typeTag === "biped" || typeTag === "quad") && !this._omnimech && this._tonnage <= 100
            && (this._tech.tag === "is" || this._tech.tag === "mis");
    }

    /** Does Clan CASE protect every location? Always on a Clan base; by choice on Inner Sphere-base Mixed Tech. */
    public hasClanCASE(): boolean {
        return this._tech.tag === "clan" || this._tech.tag === "mclan" || (this._clanCASE && this._tech.tag === "mis");
    }

    /** Can Clan CASE be chosen: an Inner Sphere-base Mixed Tech design. */
    public canChooseClanCASE(): boolean {
        return this._tech.tag === "mis";
    }

    public setClanCASE(clanCASE: boolean): boolean {
        this._clanCASE = clanCASE;
        this._calc();
        return this._clanCASE;
    }

    /** Switch the Primitive 'Mech rules on or off. Switching on replaces the components a Primitive 'Mech cannot use. */
    public setPrimitive(primitive: boolean): boolean {
        if (primitive && !this.canBePrimitive()) return this._primitive;
        this._primitive = primitive;
        if (primitive) {
            const standard = <T extends { tag: string }>(records: T[], current: T, keep: (record: T) => boolean): T =>
                keep(current) ? current : findByTag(records, "standard") ?? records[0];
            this._selectedInternalStructure = standard(mechInternalStructureTypes, this._selectedInternalStructure, structure => BattleMech.PRIMITIVE_STRUCTURE_TAGS.includes(structure.tag));
            this._engineType = standard(mechEngineTypes, this._engineType, engine => BattleMech.BASIC_ENGINE_TAGS.includes(engine.tag));
            this._gyro = standard(mechGyroTypes, this._gyro, gyro => gyro.tag === "standard");
            this._myomerType = standard(mechMyomerTypes, this._myomerType, myomer => myomer.tag === "standard");
            this._heatSinkType = findByTag(mechHeatSinkTypes, "single") ?? this._heatSinkType;
            this._smallCockpit = false;
            this._torsoMountedCockpit = false;
            this._interfaceCockpit = false;
            // The structure setter sizes the internal structure for the tonnage.
            this.setInternalStructureType(this._selectedInternalStructure.tag);
        }
        // The engine rating follows the rules in force; a Walking MP the adjusted rating cannot reach comes down.
        this.setWalkSpeed(Math.min(this._walkSpeed, this.getMaxWalkSpeed(EXPERIMENTAL_RULES_LEVEL)));
        return this._primitive;
    }

    public getAvailableArmorTypes(rulesLevel: number = 2): IArmorType[] {
        const returnValue: IArmorType[] = [];
        const techTag = this.getTech().tag;
        const isMixed = techTag === "mis" || techTag === "mclan";

        for (const armor of mechArmorTypes.map(entry => ({ ...entry }))) {
            const hasCompatibleMultiplier = armor.unitTypes.battlemech
                && armor.constructionStatus !== "deferred" && armor.constructionMode !== "equipment" && (isMixed
                ? armor.armorMultiplier.is > 0 || armor.armorMultiplier.clan > 0
                : (techTag === "clan" ? armor.armorMultiplier.clan : armor.armorMultiplier.is) > 0);
            const availability = this._techDatesAvailability(armor, rulesLevel);
            armor.availableAsPrototype = availability.asPrototype;
            // A Primitive 'Mech's one armor type is never withheld. On an IndustrialMech the BattleMech armors
            // need the Experimental rules level (TO:AUE p.92), the Dark Age ones a mixed tech base too (IO:AE p.82).
            const mandatory = this._primitive && armor.tag === this._getPrimitiveArmorTag();
            const experimentalOnly = this._isIndustrialMechExperimentalArmor(armor);
            armor.available = mandatory || (hasCompatibleMultiplier && availability.available && this.isOfferedInEdition(armor, rulesLevel)
                && this._isArmorLegalForChassis(armor)
                && (!experimentalOnly || rulesLevel >= EXPERIMENTAL_RULES_LEVEL)
                // Patchwork Armor is an "advanced construction option" (TO:AUE p.189).
                && (armor.tag !== BattleMech.PATCHWORK_ARMOR_TAG || rulesLevel >= 3)
                && (!this.isLAM() || this._isLAMLegalComponent("armor", armor.tag)));

            returnValue.push( armor );
        }

        return returnValue;
    }

    private _itemIsAvailable(
        introduced: number | null,
        extinct: number | null,
        reintroduced: number | null,
        ignoreExtinction: boolean = false,
    ): boolean {
        const introductionYear = introduced ?? 0;
        const extinctionYear = extinct ?? 0;
        const reintroductionYear = reintroduced ?? 0;
        const eraStart = this._era.yearStart;
        const eraEnd = this._era.yearEnd ?? Number.POSITIVE_INFINITY;
        const initialAvailabilityOverlapsEra =
            introductionYear <= eraEnd &&
            (extinctionYear === 0 || extinctionYear >= eraStart);

        if (ignoreExtinction) {
            return introductionYear <= eraEnd;
        }

        return initialAvailabilityOverlapsEra ||
            (reintroductionYear > 0 && reintroductionYear <= eraEnd);
    }

    /**
     * LAM construction limits: no armor or internal structure that occupies critical slots,
     * no Hardened armor, and only Standard or Compact fusion engines (IO:AE p.108).
     */
    private _isLAMLegalComponent(kind: "armor" | "structure" | "engine", tag: string): boolean {
        if (!this._hasLAMLimits()) return true;
        if (kind === "engine") {
            return this.isVTOLAM() ? BattleMech.VTOLAM_ENGINE_TAGS.includes(tag) : tag === "standard" || tag === "compact";
        }
        const component = kind === "armor"
            ? findByTag(mechArmorTypes, tag)
            : findByTag(mechInternalStructureTypes, tag);
        if (!component) return false;
        const occupiesSlots = (component.crits?.is ?? 0) > 0 || (component.crits?.clan ?? 0) > 0;
        return !occupiesSlots && tag !== "hardened";
    }

    private _isEquipmentAllowedForChassis(item: IEquipmentItem): boolean {
        // Chassis-specific equipment, e.g. LAM Bomb Bays and Fuel Tanks (IO:AE p.108).
        if (item.chassisTypes && item.chassisTypes.length > 0
            && !item.chassisTypes.includes(this._mechType.tag.toLowerCase())) {
            return false;
        }
        if (this.isSuperheavy() && BattleMech.SUPERHEAVY_PROHIBITED_TAGS.includes(item.tag.toLowerCase())) {
            return false;
        }
        if (!this.isSuperheavy() && BattleMech.SUPERHEAVY_ONLY_TAGS.includes(item.tag.toLowerCase())) {
            return false;
        }
        // TSEMP cannons need a fusion or fission engine, the BattleMech Taser a fusion engine (IO:AE p.85, TO:AUE p.158).
        if (!engineMeetsRequirement(item.requiresEngine, this._engineType.tag)) {
            return false;
        }
        if (!this.hasAdvancedFireControl() && BattleMech._needsAdvancedFireControl(item)) {
            return false;
        }
        if (item.industrialMechOnly && !this.isIndustrialMech()) {
            return false;
        }
        // "5 ton suits may only use flamers, MG's, and small lasers" (Best-of p.16).
        if (this._isFiveTonPowerArmor() && BattleMech._isPowerArmorWeapon(item)
            && !(POWER_ARMOR_FIVE_TON_WEAPONS as readonly string[]).includes(item.tag)) {
            return false;
        }
        // Nowhere to put it on this chassis: wrecking balls and salvage arms on a quad (TM pp.248-249).
        if (this._getAllowedLocations(item)?.length === 0) {
            return false;
        }
        // The C3 Remote Sensor Launcher and C3i exclude each other (TO:AUE p.110).
        if (item.tag === BattleMech.C3_REMOTE_SENSOR_TAG && this._equipmentList.some(other => other && BattleMech._isC3iSystem(other))) {
            return false;
        }
        if (BattleMech._isC3iSystem(item) && this._equipmentList.some(other => other?.tag === BattleMech.C3_REMOTE_SENSOR_TAG)) {
            return false;
        }
        // HarJel II / III: BattleMechs with compatible armor, and never the two kinds together (IO:AE pp.82-83).
        if (item.armorRepairBVMultiplier && (
            this.isIndustrialMech()
            || !this._hasRepairSystemArmor()
            || this._equipmentList.some(other => other?.armorRepairBVMultiplier && other.tag !== item.tag)
        )) {
            return false;
        }
        // Tripods mount weapons and equipment as a 'Mech of equal weight and size does (IO:AE p.159).
        if (!this.isLAM()) {
            return true;
        }
        const tag = item.tag.toLowerCase();
        const name = item.name.toLowerCase();
        // A VTOLAM has no fighter mode, so no fuel tanks or bomb bays.
        if (this.isVTOLAM() && (tag === BattleMech.LAM_FUEL_TANK_TAG || tag === BattleMech.LAM_BOMB_BAY_TAG)) return false;
        // A Permanent Air 'Mech never takes Fighter Mode, so torso bomb bays could not drop (owner ruling 2026-11-12).
        if (this.isPermanentAirMech() && tag === BattleMech.LAM_BOMB_BAY_TAG) return false;
        // Battletech Into The Future: "A VTOLAM can use any equipment a normal battlemech can use".
        if (!this._hasLAMLimits()) return true;
        // IO:AE p.108, Prohibited Technologies and construction notes: no artillery, no weapon
        // that needs a Piloting skill except physical attack weapons (heavy Gauss), no
        // supercharger, and none of the listed conversion-blocking equipment. Items split
        // across locations are reported by getChassisEquipmentViolations().
        return !(
            item.category === "Artillery Weapons" ||
            item.weaponType?.includes("ART") ||
            tag.includes("gauss-rifle-heavy") ||
            name.includes("heavy gauss") ||
            BattleMech.LAM_PROHIBITED_TAGS.includes(tag) ||
            tag.startsWith("bridge-layer")
        );
    }

    public allocateArmorClear() {
        this._armorAllocation = {
            head: 0,
            centerTorso: 0,
            rightTorso: 0,
            leftTorso: 0,
            centerTorsoRear: 0,
            rightTorsoRear: 0,
            leftTorsoRear: 0,
            leftArm: 0,
            rightArm: 0,
            leftLeg: 0,
            rightLeg: 0,
            centerLeg: 0,
            frontLeftLeg: 0,
            frontRightLeg: 0,
        }
    }

    // Best Guess: spread the purchased armor points proportionally to each
    // location's cap (head 9, every other location 2x internal structure,
    // with front + rear torso sharing one cap). Torsos split 7:1
    // front/rear. Rounding leftovers go round-robin in priority order, left/
    // right pairs together, so no location ever exceeds its cap and the
    // Step 4 dropdowns always contain the allocated value.
    public allocateArmorSane(): void {
        // Patchwork Armor has no purchased tonnage to spread: the weight follows the points.
        if (this.isPatchworkArmor()) return;
        this.allocateArmorClear();
        const chassisMax = this.getChassisMaxArmor();
        let remaining = Math.floor(Math.min(this._maxArmor, chassisMax));
        if (remaining <= 0 || chassisMax <= 0) {
            this._calc();
            return;
        }
        // Shares are of the shared-cap maximum; above it (the earliest editions' separate rear caps) the leftovers fill in
        const sharedMax = this.getChassisMaxArmor(1);
        const percentage = Math.min(1, remaining / sharedMax);
        const sectionsApart = this.torsoArmorSectionsApart();
        const internalStructure = this.getInternalStructure();
        const typeTag = this.getType().tag.toLowerCase();
        const hasArms = typeTag === "biped" || typeTag === "lam" || typeTag === "tripod";
        const isQuadStyle = typeTag === "quad" || typeTag === "quadvee";
        const isTripod = typeTag === "tripod";

        const allocation = this._armorAllocation;
        const structureOf = (location: keyof IArmorAllocation): number =>
            (internalStructure as unknown as Record<string, number | undefined>)[location] || 0;
        // Room left in a location, honoring the shared front/rear torso caps
        const roomIn = (location: keyof IArmorAllocation): number => {
            const value = allocation[location] || 0;
            if (sectionsApart && location !== "head") {
                return structureOf(location.replace("Rear", "") as keyof IArmorAllocation) * 2 - value;
            }
            switch (location) {
                case "head":
                    return 9 - value;
                case "centerTorso":
                case "centerTorsoRear":
                    return structureOf("centerTorso") * 2 - allocation.centerTorso - allocation.centerTorsoRear;
                case "leftTorso":
                case "leftTorsoRear":
                    return structureOf("leftTorso") * 2 - allocation.leftTorso - allocation.leftTorsoRear;
                case "rightTorso":
                case "rightTorsoRear":
                    return structureOf("rightTorso") * 2 - allocation.rightTorso - allocation.rightTorsoRear;
                default:
                    return structureOf(location) * 2 - value;
            }
        };
        const give = (location: keyof IArmorAllocation, points: number): void => {
            allocation[location] = (allocation[location] || 0) + points;
            remaining -= points;
        };

        // Priority order for leftover points; pairs stay symmetrical
        const slots: Array<Array<keyof IArmorAllocation>> = [
            ["centerTorso"],
            ["leftTorso", "rightTorso"],
            ["leftLeg", "rightLeg"],
        ];
        if (isTripod) slots.push(["centerLeg"]);
        if (isQuadStyle) slots.push(["frontLeftLeg", "frontRightLeg"]);
        if (hasArms) slots.push(["leftArm", "rightArm"]);
        slots.push(["head"], ["centerTorsoRear"], ["leftTorsoRear", "rightTorsoRear"]);

        // Proportional base allocation (floors never exceed the purchased points)
        const frontShare = 1.75;
        const rearShare = 0.25;
        for (const slot of slots) {
            for (const location of slot) {
                let base: number;
                if (location === "head") {
                    base = 9 * percentage;
                } else if (location === "centerTorsoRear" || location === "leftTorsoRear" || location === "rightTorsoRear") {
                    base = structureOf(location.replace("Rear", "") as keyof IArmorAllocation) * rearShare * percentage;
                } else if (location === "centerTorso" || location === "leftTorso" || location === "rightTorso") {
                    base = structureOf(location) * frontShare * percentage;
                } else {
                    base = structureOf(location) * 2 * percentage;
                }
                give(location, Math.min(Math.floor(base), roomIn(location)));
            }
        }

        // Round-robin the leftovers, pairs first, then singles for any odd point
        for (const allowSplitPairs of [false, true]) {
            let progressed = true;
            while (remaining > 0 && progressed) {
                progressed = false;
                for (const slot of slots) {
                    const members = allowSplitPairs ? slot.map(location => [location]) : [slot];
                    for (const group of members) {
                        if (remaining >= group.length && group.every(location => roomIn(location) > 0)) {
                            group.forEach(location => give(location, 1));
                            progressed = true;
                        }
                    }
                }
            }
        }

        this._calc();
    }

    public allocateArmorMax(): void {
        const internalStructure = this.getInternalStructure();
        // Core structural layout configs
        const typeTag = this.getType().tag.toLowerCase();
        const hasArms = typeTag === "biped" || typeTag === "lam" || typeTag === "tripod";
        const isQuadStyle = typeTag === "quad" || typeTag === "quadvee";
        const isTripod = typeTag === "tripod";
        // Generate a zeroed structure record to populate safely
        const maxAllocation: IArmorAllocation = {
            head: this.getMaxHeadArmor(), // 9, or twice the head's structure under Flint's rules
            centerTorso: Math.ceil((internalStructure.centerTorso || 0) * (5 / 3)),
            rightTorso: Math.ceil((internalStructure.rightTorso || 0) * (5 / 3)),
            leftTorso: Math.ceil((internalStructure.leftTorso || 0) * (5 / 3)),
            centerTorsoRear: Math.floor((internalStructure.centerTorso || 0) * (1 / 3)),
            rightTorsoRear: Math.floor((internalStructure.rightTorso || 0) * (1 / 3)),
            leftTorsoRear: Math.floor((internalStructure.leftTorso || 0) * (1 / 3)),
            leftArm: 0,
            rightArm: 0,
            leftLeg: 0,
            rightLeg: 0,
            centerLeg: 0,
            frontLeftLeg: 0,
            frontRightLeg: 0
        };
        // Conditional multi-chassis segment processing
        if (this.torsoArmorSectionsApart()) {
            // The earliest editions cap the front and the rear apart, each at twice the boxes (BD p.25, BT2 p.40, BTM p.80)
            for (const torso of ["centerTorso", "leftTorso", "rightTorso"] as const) {
                maxAllocation[torso] = (internalStructure[torso] || 0) * 2;
                maxAllocation[`${torso}Rear`] = (internalStructure[torso] || 0) * 2;
            }
        }
        if (hasArms) {
            maxAllocation.leftArm = (internalStructure.leftArm || 0) * 2;
            maxAllocation.rightArm = (internalStructure.rightArm || 0) * 2;
        }
        if (isQuadStyle) {
            // Quads allocate maximum structural health to all 4 matching legs symmetrically
            const referenceLegIS = internalStructure.rightLeg || internalStructure.frontRightLeg || 0;
            const maxLegArmor = referenceLegIS * 2;
            maxAllocation.leftLeg = maxLegArmor;
            maxAllocation.rightLeg = maxLegArmor;
            maxAllocation.frontLeftLeg = maxLegArmor;
            maxAllocation.frontRightLeg = maxLegArmor;
        } else {
            // Standard Biped/LAM structural layout plus Tripod's additional Center Leg
            maxAllocation.leftLeg = (internalStructure.leftLeg || 0) * 2;
            maxAllocation.rightLeg = (internalStructure.rightLeg || 0) * 2;
            if (isTripod) {
                maxAllocation.centerLeg = (internalStructure.centerLeg || 0) * 2;
            }
        }
        this._armorAllocation = maxAllocation;
        const armorMultiplier = this.getArmorObj().armorMultiplier[this.getArmorTechBase()];
        this._armorWeight = Math.ceil((this.getChassisMaxArmor() / armorMultiplier) * 2) / 2;
        this._fractionalArmorPoints = this.getChassisMaxArmor();
        this._calc();
    }

    /**
     * The most armor the rules let a location carry as allocated now: the head 9, a torso front or rear what its
     * shared allowance leaves (each its own under earlier editions), any other location twice its internal structure.
     */
    public getMaxLocationArmor(location: string): number {
        switch (location) {
            case "head": return this.getMaxHeadArmor();
            case "centerTorso": return this.getMaxCenterTorsoArmor();
            case "centerTorsoRear": return this.getMaxCenterTorsoRearArmor();
            case "leftTorso": return this.getMaxLeftTorsoArmor();
            case "leftTorsoRear": return this.getMaxLeftTorsoRearArmor();
            case "rightTorso": return this.getMaxRightTorsoArmor();
            case "rightTorsoRear": return this.getMaxRightTorsoRearArmor();
        }
        const structure = (this.getInternalStructure() as unknown as Record<string, number | undefined>)[location];
        return (structure ?? 0) * 2;
    }

    public getMaxCenterTorsoRearArmor(): number {
        return this.getInternalStructure().centerTorso * 2 - (this.torsoArmorSectionsApart() ? 0 : this.getArmorAllocation().centerTorso);
    }
    public getMaxCenterTorsoArmor(): number {
        return this.getInternalStructure().centerTorso * 2 - (this.torsoArmorSectionsApart() ? 0 : this.getArmorAllocation().centerTorsoRear);
    }

    public getMaxRightTorsoRearArmor(): number {
        return this.getInternalStructure().rightTorso * 2 - (this.torsoArmorSectionsApart() ? 0 : this.getArmorAllocation().rightTorso);
    }
    public getMaxRightTorsoArmor(): number {
        return this.getInternalStructure().rightTorso * 2 - (this.torsoArmorSectionsApart() ? 0 : this.getArmorAllocation().rightTorsoRear);
    }

    public getMaxLeftTorsoRearArmor(): number {
        return this.getInternalStructure().leftTorso * 2 - (this.torsoArmorSectionsApart() ? 0 : this.getArmorAllocation().leftTorso);
    }
    public getMaxLeftTorsoArmor(): number {
        return this.getInternalStructure().leftTorso * 2 - (this.torsoArmorSectionsApart() ? 0 : this.getArmorAllocation().leftTorsoRear);
    }

    public getAvailableEquipment(includeCustom: boolean = false, rulesLevel: number = 2): IEquipmentItem[] {
        const returnItems: IEquipmentItem[] = [];
        const techTag = this.getTech().tag;

        const addedTags = new Set<string>();
        const offeredLevel = includeCustom ? Math.max(rulesLevel, CUSTOM_HOMEBREW_RULES_LEVEL) : rulesLevel;
        const addEquipment = (item: IEquipmentItem, catalog: "is" | "clan" | "custom" | "universal"): void => {
            // space.battlemech -1 means the item cannot be mounted on a 'Mech at all
            // (ProtoMech-only weapons such as the ProtoMech ACs).
            // Bombs are loaded into Bomb Bays (see setBombCount), never mounted in critical slots.
            if (addedTags.has(item.tag) || item.space.battlemech < 0 || item.bombBaySlots) {
                return;
            }
            // Only what the selected rules edition offers at the selected rules level (custom content at its own level).
            if (!isEquipmentOffered(item, this._rulesEdition, offeredLevel)) {
                return;
            }
            item.catalog = isUniversalEquipment(item) ? "universal" : item.catalog ?? catalog;
            item.criticals = this.getCriticalSlots(item.space.battlemech);
            // The record's own dates, or its Clan dates on a Clan design (an IO prototype at Experimental).
            const { available: inEra, asPrototype } = this._techDatesAvailability(item, rulesLevel);
            item.availableAsPrototype = asPrototype;
            const limitKey = item.maxPerUnitGroup ?? item.tag;
            const underUnitLimit = !item.maxPerUnit
                || this._equipmentList.filter(installed => (installed?.maxPerUnitGroup ?? installed?.tag) === limitKey).length < item.maxPerUnit;
            item.available = inEra && this._isEquipmentAllowedForChassis(item) && underUnitLimit;
            addedTags.add(item.tag);
            returnItems.push(item);
        };

        for (const record of getEquipmentListForChassis(techTag, includeCustom)) {
            // Only what the selected rules edition offers at the selected rules level (custom content at its own level).
            if (!isEquipmentOffered(record, this._rulesEdition, offeredLevel)) {
                continue;
            }
            const item = getEquipmentForEdition(record, this._rulesEdition);
            const catalog = item.catalog ?? (item.category === "Custom Equipment" ? "custom" : techTag === "clan" ? "clan" : "is");
            addEquipment(item, catalog);
        }
        // Battle armor weapons on a 'Mech are Experimental (Ghosts of Obeedah p.53).
        if (rulesLevel >= EXPERIMENTAL_RULES_LEVEL) {
            const battleArmorScale = getBattleArmorScaleListByTech(techTag);
            // A 'Mech tracks heat, so its battle armor energy weapons run off heat sinks, never power cells.
            const energyTags = battleArmorScale.filter(item => item.category === "Energy Weapons").map(item => item.tag);
            for (const item of battleArmorScale) {
                if (!energyTags.includes(item.feedsWeaponTag ?? "")) addEquipment(item, item.catalog ?? "is");
            }
        }
        // Sort compiled equipment strictly by the dataset sorting values
        returnItems.sort((a, b) => {
            if (a.sort > b.sort) return 1;
            if (a.sort < b.sort) return -1;
            return 0;
        });
        return returnItems;
    }  

    public getAvailableEquipmentByCatalog(
        catalog: "all" | "is" | "clan" | "custom" | "universal",
        includeCustom: boolean = false,
        rulesLevel: number = 2,
    ): IEquipmentItem[] {
        const equipment = this.getAvailableEquipment(includeCustom, rulesLevel);
        return (catalog === "all" ? equipment : equipment.filter(item => item.catalog === catalog))
            .map(item => this.sizeEquipmentForUnit(item));
    }

    private _sortInstalledEquipment() {
        this._equipmentList.sort( ( a, b ) => {
            if( a.sort > b.sort ) {
                return 1;
            } if( a.sort < b.sort ) {
                return -1;
            } else {
                return 0;
            }
        })
    }

    public toggleMirrorArmorAllocations() {
        this._mirrorArmorAllocations = !this._mirrorArmorAllocations;
    }

    public toggleHeatBubble( clickLocation: string, clickIndex: number ): void {
        // TODO ~~Any ideas on what this is supposed to be? RHS? https://www.sarna.net/wiki/Radical_Heat_Sink_System
        // Not implemented: the heat bubbles are display only for now.
        void clickLocation;
        void clickIndex;
    }

    public lifeSupportHits(): number {
        let rv = 0;

        for( const critIndex in this._criticals.head ) {
            if(
                this._criticals.head[critIndex]
                &&
                this._criticals.head[critIndex].name.toLowerCase().startsWith( "life support" )
                &&
                this.isCriticalDamaged( "hd", +critIndex )
            ) {
                rv++;
            }
        }

        return rv;
    }

    public isEquipmentDamaged(uuid: string, loc: string): boolean {
        const targetProp = BattleMech.MECH_LOCATION_MAP[loc];
        if (!targetProp) return false;

        const critArray: any[] = (this._criticals as any)[targetProp];
        if (!critArray) return false;

        for (let critIndex = 0; critIndex < critArray.length; critIndex++) {
            const component = critArray[critIndex];
            if (
                component &&
                component.uuid === uuid &&
                this.isCriticalDamaged(loc, critIndex)
            ) {
                return true;
            }
        }
        return false;
    }

    /** Each shield mounted, with its Damage Absorption and Damage Capacity (TO:AUE p.103) and the capacity used up. */
    public getShields(): IMechShield[] {
        return this._equipmentList.flatMap(item => {
            const size = (["small", "medium", "large"] as const).find(name => matchesTag(item, "shield-" + name));
            if (!size) {
                return [];
            }
            const [damageAbsorption, damageCapacity] = shieldTable[size];
            return [{
                item, location: item.location ?? "", size: size[0].toUpperCase() + size.slice(1), damageAbsorption, damageCapacity,
                damageTaken: Math.min(damageCapacity, item.shieldDamage ?? 0),
            }];
        });
    }

    /** In play: a click on a shield's Damage Capacity circle marks it and every one before it, or clears it if it was the last marked. */
    public toggleShieldBubble(uuid: string, index: number): void {
        const shield = this.getShields().find(entry => entry.item.uuid === uuid);
        if (!shield) {
            return;
        }
        const marked = Math.min(shield.damageCapacity, index + 1);
        shield.item.shieldDamage = shield.damageTaken === marked ? marked - 1 : marked;
    }

    public getModularArmorPacks(): IEquipmentItem[] {
        return this._equipmentList.filter(item => item.isModularArmor);
    }

    public getModularArmorCurrentPoints(item: IEquipmentItem): number {
        if (!item.isModularArmor || !item.uuid || !item.allocationLocation) {
            return 0;
        }
        if (this.isEquipmentDamaged(item.uuid, item.allocationLocation)) {
            return 0;
        }
        return Math.max(0, item.currentAdditionalArmor ?? item.additionalArmor ?? 0);
    }

    public hasActiveModularArmor(): boolean {
        return this.getModularArmorPacks().some(item => this.getModularArmorCurrentPoints(item) > 0);
    }

    public getActiveModularArmorAtLocation(location: string): IEquipmentItem | null {
        const normalizedLocation = location.toLowerCase().trim();
        const rearTorsoLocations: Record<string, string> = { ctr: "ct", ltr: "lt", rtr: "rt" };
        const baseLocation = rearTorsoLocations[normalizedLocation] ?? normalizedLocation;
        const rearHit = normalizedLocation in rearTorsoLocations;

        return this.getModularArmorPacks().find(item => {
            if (this.getModularArmorCurrentPoints(item) <= 0 || item.allocationLocation !== baseLocation) {
                return false;
            }
            return ["ct", "lt", "rt"].includes(baseLocation) ? Boolean(item.rear) === rearHit : true;
        }) ?? null;
    }

    public engineHits(): number {
        let rv = 0;

        let lastName = "";
        for( const critIndex in this._criticals.centerTorso ) {

            if(
                this._criticals.centerTorso[critIndex]
                && !this._criticals.centerTorso[critIndex].placeholder
                && !this._criticals.centerTorso[critIndex].rollAgain
            ) {
                lastName = this._criticals.centerTorso[critIndex].name;
            }

            if(
                this._criticals.centerTorso[critIndex]
                &&
                (
                    lastName.toLowerCase().indexOf( "engine" ) > -1
                    ||
                    lastName.toLowerCase().indexOf( "fusion" ) > -1
                )
                &&
                this.isCriticalDamaged( "ct", +critIndex )
            ) {

                rv++;
            }
        }

        lastName = ""
        for( const critIndex in this._criticals.leftTorso ) {

            if(
                this._criticals.leftTorso[critIndex]
                && !this._criticals.leftTorso[critIndex].placeholder
                && !this._criticals.leftTorso[critIndex].rollAgain
            ) {
                lastName = this._criticals.leftTorso[critIndex].name;
            }

            if(
                this._criticals.leftTorso[critIndex]
                    &&
                (
                    lastName.toLowerCase().indexOf( "engine" ) > -1
                    ||
                    lastName.toLowerCase().indexOf( "fusion" ) > -1
                )
                &&
                this.isCriticalDamaged( "lt", +critIndex )
            ) {
                rv++;
            }
        }

        lastName = "";
        for( const critIndex in this._criticals.rightTorso ) {

            if(
                this._criticals.rightTorso[critIndex]
                && !this._criticals.rightTorso[critIndex].placeholder
                && !this._criticals.rightTorso[critIndex].rollAgain
            ) {
                lastName = this._criticals.rightTorso[critIndex].name;
            }

            if(
                this._criticals.rightTorso[critIndex]
                &&
                (
                    lastName.toLowerCase().indexOf( "engine" ) > -1
                    ||
                    lastName.toLowerCase().indexOf( "fusion" ) > -1
                )
                &&
                this.isCriticalDamaged( "rt", +critIndex )
            ) {
                rv++;
            }
        }

        // The custom Mini Engine's first hit is marked as two (u/VanillaPhysics, #249), so its second hit destroys it.
        if( rv > 0 && this._engineType.tag === BattleMech.MINI_ENGINE_TAG ) {
            rv++;
        }

        return rv;
    }

    /**
     * Heat a turn from engine hits, Heat Point Table (TW p.159): +5 for the first, +10 in all from the second.
     * XXL engines have no rule of their own here (TO:AUE p.121); the Mini Engine follows them with its first hit
     * marked as two (#249).
     */
    public getEngineHitHeat(): number {
        const hits = this.engineHits();
        return hits >= 2 ? 10 : hits === 1 ? 5 : 0;
    }

    public gyroHits(): number {
        let rv = 0;


        let lastName = "";
        for( const critIndex in this._criticals.centerTorso ) {

            if(
                this._criticals.centerTorso[critIndex]
                && !this._criticals.centerTorso[critIndex].placeholder
                && !this._criticals.centerTorso[critIndex].rollAgain
            ) {
                lastName = this._criticals.centerTorso[critIndex].name;
            }

            if(
                this._criticals.centerTorso[critIndex]
                &&
                lastName.toLowerCase().indexOf( "gyro" ) > -1
                    &&
                this.isCriticalDamaged( "ct", +critIndex )
            ) {
                rv++;
            }
        }
        lastName = ""
        for( const critIndex in this._criticals.leftTorso ) {

            if(
                this._criticals.leftTorso[critIndex]
                && !this._criticals.leftTorso[critIndex].placeholder
                && !this._criticals.leftTorso[critIndex].rollAgain
            ) {
                lastName = this._criticals.leftTorso[critIndex].name;
            }
            if(
                this._criticals.leftTorso[critIndex]
                &&
                lastName.toLowerCase().indexOf( "gyro" ) > -1
                    &&
                this.isCriticalDamaged( "lt", +critIndex )
            ) {
                rv++;
            }
        }
        lastName = "";
        for( const critIndex in this._criticals.rightTorso ) {

            if(
                this._criticals.rightTorso[critIndex]
                && !this._criticals.rightTorso[critIndex].placeholder
                && !this._criticals.rightTorso[critIndex].rollAgain
            ) {
                lastName = this._criticals.rightTorso[critIndex].name;
            }
            if(
                this._criticals.rightTorso[critIndex]
                &&
                lastName.toLowerCase().indexOf( "gyro" ) > -1
                    &&
                this.isCriticalDamaged( "rt", +critIndex )
            ) {
                rv++;
            }
        }

        return rv;
    }
    /** Damaged Sensors slots in the head and, with a Torso-Mounted Cockpit, the center torso (TO:AUE p.113). */
    public sensorHits(locations: string[] = ["hd", "ct"]): number {
        let rv = 0;

        for( const location of locations ) {
            const slots = this._criticals[BattleMech.MECH_LOCATION_MAP[location]];
            for( const critIndex in slots ) {
                if(
                    slots[critIndex]
                    &&
                    slots[critIndex].name.toLowerCase().startsWith( "sensors" )
                    &&
                    this.isCriticalDamaged( location, +critIndex )
                ) {
                    rv++;
                }
            }
        }
        return rv;
    }

    /** Sensors that can no longer fire weapons: two hits, one on an IndustrialMech (TW p.128), three with a
     * Torso-Mounted Cockpit (TO:AUE p.113). */
    public areSensorsDestroyed(): boolean {
        return this.sensorHits() >= (this.isIndustrialMech() ? 1 : this.getCockpitType().tag === "torso-mounted" ? 3 : 2);
    }

    /** Weapon attack to-hit for sensor hits: +2 at the first (BD p.18; TW p.117), +4 at a Torso-Mounted Cockpit's
     * second (TO:AUE p.113); none once the sensors can no longer fire. */
    public getSensorToHitModifier(): number {
        const hits = this.sensorHits();
        return hits === 0 || this.areSensorsDestroyed() ? 0 : hits === 1 ? 2 : 4;
    }

    public toggleISBubble(clickLocation: string, clickIndex: number): void {
        clickLocation = this._normalizeLocation(clickLocation);
        const targetProp = BattleMech.MECH_LOCATION_MAP[clickLocation];
        if (!targetProp) return;

        const bubbleArray = (this._structureBubbles as any)[targetProp];
        if (bubbleArray && bubbleArray[clickIndex] !== undefined) {
            bubbleArray[clickIndex] = !bubbleArray[clickIndex];
        }
    }

    public structureDamaged(clickLocation: string, clickIndex: number): boolean {
        clickLocation = this._normalizeLocation(clickLocation);
        const targetProp = BattleMech.MECH_LOCATION_MAP[clickLocation];
        if (!targetProp) return false;

        const bubbleArray = (this._structureBubbles as any)[targetProp];
        if (bubbleArray && bubbleArray[clickIndex] !== undefined) {
            return !bubbleArray[clickIndex];
        }
        return false;
    }   

    public armorDamaged(clickLocation: string, clickIndex: number): boolean {
        clickLocation = this._normalizeLocation(clickLocation);
        const targetProp = BattleMech.MECH_LOCATION_MAP[clickLocation];
        if (!targetProp) {
            return false; // Safe exit for unrecognized shorthand
        }
        const bubbleArray = (this._armorBubbles as any)[targetProp];
        
        if (bubbleArray && bubbleArray[clickIndex] !== undefined) {
            return !bubbleArray[clickIndex];
        }
        return false;
    }

    public toggleArmorBubble(clickLocation: string, clickIndex: number): void {
        clickLocation = this._normalizeLocation(clickLocation);
        const targetProp = BattleMech.MECH_LOCATION_MAP[clickLocation];
        if (!targetProp) {
            return; // Safe exit for unrecognized shorthand
        }
        const bubbleArray = (this._armorBubbles as any)[targetProp];
        if (bubbleArray && bubbleArray[clickIndex] !== undefined) {
            bubbleArray[clickIndex] = !bubbleArray[clickIndex];
        }
    }

    public heatSinkIsFilled( _hsIndex: number): boolean {
        // TODO
        return false;
    }

    private _isAnachronistic(): boolean {

        // The option lists mark copies (issue 35), so look this 'Mech's own marks up by tag, at the
        // rules level the design needs.
        const rulesLevel = Math.max(this.getRequiredRulesLevel(), 2);
        if (this.getAvailableEngines(rulesLevel).find(engine => engine.tag === this._engineType.tag)?.available === false) {
            return true;
        }

        if (this.getAvailableArmorTypes(rulesLevel).find(armor => armor.tag === this._armorType.tag)?.available === false) {
            return true;
        }

        // if( this._heatSinkType.available === false ) {
        //     return true;
        // }

        for( const item of this.getInstalledEquipment() ) {

            if( item.available === false ) {
                return true;
            }

        }

        return false;
    }

    public importTRO(
        importString: string
    ): void {
        importString = importString.trim();

        const lines = importString.split( "\n" );

        let inEquipmentList = false;
        let equipmentList: IEquipmentItem[] = [];

        for( let line of lines ) {

            if( line.toLowerCase().startsWith( "technology base:" )) {

                line = line.replace(/technology base:/ig, '').trim();
                if( line === "inner sphere" ) {
                    this.setTech( "is" )
                } else if (line === "clan" ) {
                    this.setTech( "clan" )
                }
                equipmentList = this.getEquipmentList( this.getTech().tag )

            }
            if( line.toLowerCase().startsWith( "tonnage: " )) {
                line = line.replace(/tonnage: /ig, '').trim();
                if( +line ) {
                    this.setTonnage( +line );
                }
            }
            if( line.toLowerCase().startsWith( "type: " )) {
                line = line.replace(/type:/ig, '').trim();
                if( line ) {
                    this.setModel( line )
                }
            }
            if( line.toLowerCase().startsWith( "walking mp: " )) {
                line = line.replace(/walking mp:/ig, '').trim();
                if( +line ) {
                    this.setWalkSpeed( +line )
                }
            }
            if( line.toLowerCase().startsWith( "jumping mp: " )) {
                line = line.replace(/jumping mp:/ig, '').trim();
                if( +line ) {
                    this.setJumpSpeed( +line )
                }
            }

            if( line.toLowerCase().startsWith( "double heat sinks: " )) {
                line = line.replace(/double heat sink:/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    const splitLine = line.split( " " );

                    if( splitLine.length > 1 && !isNaN(+splitLine[0]) ) {

                        this.setAdditionalHeatSinks(Math.max(0, +splitLine[0] - this.getFreeHeatSinks()))
                        this.setHeatSinksType( "double" )
                    }
                }
            }

            if( line.toLowerCase().startsWith( "single heat sinks: " )) {
                line = line.replace(/single heat sinks:/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    const splitLine = line.split( " " );

                    if( splitLine.length > 1 && !isNaN(+splitLine[0]) ) {

                        this.setAdditionalHeatSinks(Math.max(0, +splitLine[0] - this.getFreeHeatSinks()))
                        this.setHeatSinksType( "single" )
                    }

                }
            }

            if( line.toLowerCase().startsWith( "heat sinks: " )) {
                line = line.replace(/heat sinks:/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    const splitLine = line.split( " " );

                    if( splitLine.length > 1 && !isNaN(+splitLine[0]) ) {

                        this.setAdditionalHeatSinks(Math.max(0, +splitLine[0] - this.getFreeHeatSinks()))
                        this.setHeatSinksType( "single" )
                    }

                }
            }


            if( line.toLowerCase().startsWith( "armor factor: " )) {
                line = line.replace(/armor factor:/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    const splitLine = line.split( " " );

                    if( splitLine.length > 1 && +splitLine[1] > 0) {
                        this.setArmorWeight( +splitLine[1] )
                    }

                }
            }

            // Armor Locations
            if( line.toLowerCase().startsWith( "head" )) {
                line = line.replace(/head/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    const splitLine = line.split( " " );

                    if( splitLine.length > 1 && +splitLine[1] > 0) {
                        this.setHeadArmor( +splitLine[1] )
                    }

                }
            }

            if( line.toLowerCase().startsWith( "center torso" ) && line.toLowerCase().indexOf( "(rear)" ) === -1 ) {
                line = line.replace(/center torso/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    const splitLine = line.split( " " );

                    if( splitLine.length > 1 && +splitLine[1] > 0) {
                        this.setCenterTorsoArmor( +splitLine[1] )
                    }

                }
            }

            if( line.toLowerCase().startsWith( "center torso" ) && line.toLowerCase().indexOf( "(rear)" ) > -1 ) {

                line = line.replace(/center torso \(rear\)/ig, '').trim();

                if( +line > 0) {
                    this.setCenterTorsoRearArmor( +line )
                }

            }

            if( line.toLowerCase().startsWith( "r/l torso" ) && line.toLowerCase().indexOf( "(rear)" ) === -1 ) {
                line = line.replace(/r\/l torso/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    const splitLine = line.split( " " );

                    if( splitLine.length > 1 && +splitLine[1] > 0) {
                        this.setRightTorsoArmor( +splitLine[1] )
                        this.setLeftTorsoArmor( +splitLine[1] )
                    }

                }
            }

            if( line.toLowerCase().startsWith( "r/l torso" ) && line.toLowerCase().indexOf( "(rear)" ) > -1 ) {
                line = line.replace(/r\/l torso \(rear\)/ig, '').trim();

                if( +line > 0) {
                    this.setRightTorsoRearArmor( +line )
                    this.setLeftTorsoRearArmor( +line )
                }

            }

            if( line.toLowerCase().startsWith( "r/l leg" ) ) {
                line = line.replace(/r\/l leg/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    const splitLine = line.split( " " );

                    if( splitLine.length > 1 && +splitLine[1] > 0) {
                        this.setLeftLegArmor( +splitLine[1] )
                        this.setRightLegArmor( +splitLine[1] )
                    }

                }
            }

            if( line.toLowerCase().startsWith( "r/l arm" ) ) {
                line = line.replace(/r\/l arm/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    const splitLine = line.split( " " );

                    if( splitLine.length > 1 && +splitLine[1] > 0) {
                        this.setLeftArmArmor( +splitLine[1] )
                        this.setRightArmArmor( +splitLine[1] )
                    }

                }
            }

            if( line.toLowerCase().startsWith( "weapons" ) ) {
                inEquipmentList = true;
            }

            if( inEquipmentList && equipmentList.length > 0 ) {

                // remove double-spaces
                line = line.replace(/ {2}/ig, ' ').trim();
                const lineSplit = line.split(' ');

                const equipmentLine = {
                    name: "",
                    location: "",
                    criticals: 0,
                    weight: 0,
                    number: 1,

                }
                if(
                    lineSplit.length > 3
                    &&
                    !isNaN( +lineSplit[ lineSplit.length - 1] )
                        &&
                    !isNaN( +lineSplit[ lineSplit.length - 2] )
                ) {

                    equipmentLine.weight = +lineSplit[ lineSplit.length - 1];
                    equipmentLine.criticals = +lineSplit[ lineSplit.length - 2];
                    equipmentLine.location = lineSplit[ lineSplit.length - 3];
                    lineSplit.pop();
                    lineSplit.pop();
                    lineSplit.pop();
                    equipmentLine.name = lineSplit.join( " " )

                    if( !isNaN( +equipmentLine.name[0] ) ) {
                        const nameSplit = equipmentLine.name.split( " " );
                        const count = +nameSplit[0];
                        nameSplit.shift();
                        equipmentLine.name = nameSplit.join( " " )
                        equipmentLine.number = count;
                        equipmentLine.criticals = equipmentLine.criticals / count;
                        equipmentLine.weight = equipmentLine.weight /  count;
                    }


                    if(
                        equipmentLine.name.trim()
                        &&
                        equipmentLine.criticals > 0
                        &&
                        equipmentLine.weight > 0
                        &&
                        equipmentLine.location.trim()
                    ) {

                        if( equipmentLine.name.trim().toLowerCase().startsWith( "jump jet" ) ) {

                            for( let count = 0; count < equipmentLine.criticals; count++) {

                                    for( let critIndex = this._unallocatedCriticals.length -1; critIndex > -1; critIndex--  ) {

                                        if( this._unallocatedCriticals[critIndex] && this._unallocatedCriticals[critIndex].name.trim().toLowerCase().indexOf( "jump jet" ) > 1) {

                                            this.moveCritical(
                                                "un",
                                                +critIndex,
                                                equipmentLine.location.trim().toLowerCase(),
                                                -1,
                                            )
                                            break;
                                        }

                                    }

                            }

                        } else {

                            for( const eqIndex in equipmentList ) {
                                const eq = equipmentList[eqIndex];

                                if(
                                    (
                                        eq.name.toLowerCase().trim() === equipmentLine.name.trim().toLowerCase()
                                        ||
                                        eq.name.toLowerCase().trim() + "s" === equipmentLine.name.trim().toLowerCase()
                                    )

                                ) {

                                    for( let count = 0; count < equipmentLine.number; count++) {


                                        this.addEquipment(
                                            +eqIndex,
                                            this.getTech().tag,
                                            equipmentLine.location.trim().toLowerCase(),
                                            false,
                                            null,
                                            equipmentLine.weight,
                                            []
                                        )

                                        this._calcCriticals();

                                        for( let count = 0; count < equipmentLine.criticals; count++) {

                                            for( let critIndex = this._unallocatedCriticals.length -1; critIndex > -1; critIndex--  ) {

                                                if( this._unallocatedCriticals[critIndex] && this._unallocatedCriticals[critIndex].name.trim().toLowerCase() === equipmentLine.name.trim().toLowerCase() ) {

                                                    this.moveCritical(
                                                        "un",
                                                        +critIndex,
                                                        equipmentLine.location.trim().toLowerCase(),
                                                        -1,
                                                    )
                                                    break;
                                                }

                                            }

                                        }
                                    }

                                }

                            }

                        }

                    }
                }
            }

        }
        this._calc()
    }

    public getEquipmentList(
        equipmentListTag: string,
        includeCustom: boolean = false,
    ): IEquipmentItem[] {
        // Not filtered by rules edition: a saved design keeps what it mounts. Stats are the edition's.
        // Battle armor scale items go last, so a catalog record always wins a lookup.
        return [...getEquipmentListByTech(equipmentListTag, includeCustom), ...getBattleArmorScaleListByTech(equipmentListTag)]
            .map(item => getEquipmentForEdition(item, this._rulesEdition));
    }


    /* Public Getters */
    public get model(): string {
        return this._model;
    }

    public get introductoryRules(): boolean {
        return this._introductoryRules;
    }

    public set introductoryRules(
        nv: boolean,
    ) {
        this._introductoryRules = nv;
    }

    public get hideNonAvailableEquipment(): boolean {
        return this._hideNonAvailableEquipment;
    }
    public set hideNonAvailableEquipment(
        nv: boolean,
    ) {
        this._hideNonAvailableEquipment = nv;
    }

    public get nickname(): string {
        return this._nickname;
    }
    public set nickname(
        nv: string,
    ) {
        this._nickname = nv;
    }

    public get mirrorArmorAllocations(): boolean {
        return this._mirrorArmorAllocations;
    }

    public get unallocatedCriticals(): ICriticalSlot[] {
        return this._unallocatedCriticals;
    }
    public get criticals(): IMechCriticals {
        return this._criticals;
    }

    public set equipmentList(
        nv: IEquipmentItem[],
    ) {
        this._equipmentList = nv;
    }

    public get equipmentList(): IEquipmentItem[] {
        return this._equipmentList;
    }

    // public get sortedSeparatedEquipmentList(): IEquipmentItem[] {
    //     return this._sortedSeparatedEquipmentList;
    // }

    public get calcLogCBill(): string {
        return this._calcLogCBill;
    }
    public get calcLogAS(): string {
        return this._calcLogAS;
    }
    public get calcLogBV(): string {
        return this._calcLogBV;
    }

    public get pilot(): IPilot {
        return this._pilot;
    }

    public getUUID(): string { return this._uuid; }

    public get uuid(): string {
        return this._uuid;
    }

    public getTarget(
        targetLetter: string
    ) {
        if( targetLetter === "b" ) {
            return this._targetBToHit
        }
        if( targetLetter === "c" ) {
            return this._targetCToHit
        }
        return this._targetAToHit;
    }

    public getMovementText(): string {
        if( this.currentMovementMode ) {
            if( this.currentMovementMode === "n" ) {
                return "Has not moved";
            } else if( this.currentMovementMode === "w" ) {
                return "Walked " + getHexDistanceFromModifier(this.currentToHitMovementModifier) + "⬣";
            } else if( this.currentMovementMode === "r" ) {
                return "Ran " + getHexDistanceFromModifier(this.currentToHitMovementModifier) + "⬣";
            } else {
                return "Jumped " + getHexDistanceFromModifier(this.currentToHitMovementModifier) + "⬣";
            }
        } else {
            return "Remained Stationary";
        }

    }
    public getMovementToHitText(): string {
        if( this.currentMovementMode ) {
            if( this.currentMovementMode === "n" ) {
                return "Click here to set move for the turn";
            } else if( this.currentMovementMode === "w" ) {
                return "+1 to attack, -" + this.getMovementToHitModifier() + " to be hit";
            } else if( this.currentMovementMode === "r" ) {
                return "+2 to attack, -" + this.getMovementToHitModifier() + " to be hit";
            } else {
                return "+3 to attack, -" + this.getMovementToHitModifier() + " to be hit";
            }
        } else {
            return "-" + this.getMovementToHitModifier() + " to be hit";
        }

    }

    public getArmorPercentage(): number {
        return this.getCurrentArmor() / this.getTotalArmor() * 100;
    }
    public getStructurePercentage(): number {

        return this.getCurrentStructure() / this.getTotalStructure() * 100;
    }
    public getHeatPercentage(): number {
        return this.currentHeat / 30 * 100;
    }

    public getCurrentArmor(): number {
        let rv = 0;

        for( let count = 0; count < this._armorBubbles.head.length; count ++  ) {
            if( this._armorBubbles.head[count] ) {
                rv++
            }
        }

        for( let count = 0; count < this._armorBubbles.leftTorso.length; count ++  ) {
            if( this._armorBubbles.leftTorso[count] ) {
                rv++
            }
        }
        for( let count = 0; count < this._armorBubbles.centerTorso.length; count ++  ) {
            if( this._armorBubbles.centerTorso[count] ) {
                rv++
            }
        }
        for( let count = 0; count < this._armorBubbles.rightTorso.length; count ++  ) {
            if( this._armorBubbles.rightTorso[count] ) {
                rv++
            }
        }

        for( let count = 0; count < this._armorBubbles.leftTorsoRear.length; count ++  ) {
            if( this._armorBubbles.leftTorsoRear[count] ) {
                rv++
            }
        }
        for( let count = 0; count < this._armorBubbles.centerTorsoRear.length; count ++  ) {
            if( this._armorBubbles.centerTorsoRear[count] ) {
                rv++
            }
        }
        for( let count = 0; count < this._armorBubbles.rightTorsoRear.length; count ++  ) {
            if( this._armorBubbles.rightTorsoRear[count] ) {
                rv++
            }
        }

        for( let count = 0; count < this._armorBubbles.rightLeg.length; count ++  ) {
            if( this._armorBubbles.rightLeg[count] ) {
                rv++
            }
        }
        for( let count = 0; count < this._armorBubbles.rightArm.length; count ++  ) {
            if( this._armorBubbles.rightArm[count] ) {
                rv++
            }
        }

        for( let count = 0; count < this._armorBubbles.leftLeg.length; count ++  ) {
            if( this._armorBubbles.leftLeg[count] ) {
                rv++
            }
        }
        for( let count = 0; count < this._armorBubbles.leftArm.length; count ++  ) {
            if( this._armorBubbles.leftArm[count] ) {
                rv++
            }
        }

        return rv;
    }

    public getCurrentStructure(): number {
        let rv = 0;

        for( let count = 0; count < this._structureBubbles.head.length; count ++  ) {
            if( this._structureBubbles.head[count] ) {
                rv++
            }
        }

        for( let count = 0; count < this._structureBubbles.leftTorso.length; count ++  ) {
            if( this._structureBubbles.leftTorso[count] ) {
                rv++
            }
        }
        for( let count = 0; count < this._structureBubbles.centerTorso.length; count ++  ) {
            if( this._structureBubbles.centerTorso[count] ) {
                rv++
            }
        }
        for( let count = 0; count < this._structureBubbles.rightTorso.length; count ++  ) {
            if( this._structureBubbles.rightTorso[count] ) {
                rv++
            }
        }

        for( let count = 0; count < this._structureBubbles.rightLeg.length; count ++  ) {
            if( this._structureBubbles.rightLeg[count] ) {
                rv++
            }
        }
        for( let count = 0; count < this._structureBubbles.rightArm.length; count ++  ) {
            if( this._structureBubbles.rightArm[count] ) {
                rv++
            }
        }

        for( let count = 0; count < this._structureBubbles.leftLeg.length; count ++  ) {
            if( this._structureBubbles.leftLeg[count] ) {
                rv++
            }
        }
        for( let count = 0; count < this._structureBubbles.leftArm.length; count ++  ) {
            if( this._structureBubbles.leftArm[count] ) {
                rv++
            }
        }

        return rv;
    }

    public getTotalStructure(): number {
        let rv = 0;
        const typeTag = this._mechType.tag.toLowerCase();

        rv += this._internalStructure.head;

        rv += this._internalStructure.leftTorso;
        rv += this._internalStructure.centerTorso;
        rv += this._internalStructure.rightTorso;

        rv += this._internalStructure.leftLeg;
        rv += this._internalStructure.rightLeg;

        if (typeTag === "quad" || typeTag === "quadvee") {
            rv += this._internalStructure.frontLeftLeg ?? 0;
            rv += this._internalStructure.frontRightLeg ?? 0;
        } else {
            rv += this._internalStructure.leftArm ?? 0;
            rv += this._internalStructure.rightArm ?? 0;
            if (typeTag === "tripod") {
                rv += this._internalStructure.centerLeg ?? 0;
            }
        }

        return rv;
    }

    public turnReset() {
        // The turn's jump burns its fuel here, as the move may be reset until then; an empty pack drops (TO:AUE p.105).
        if( this._isJumpPackJump() ) {
            this.jumpPackFuelUsed += this.currentTargetJumpingMP;
            if( this._jumpPackFuelBeforeThisTurn() <= 0 ) this.dropJumpPack("out of fuel, dropped");
        }
        this.currentMovementMode = "n"
        this.currentToHitMovementModifier = -1;
        this.damageLog = [];
        this._advanceFutureWarsPlay();
        for( const item of this._equipmentList ) {
            item.resolved = false;
            item.damageClusterHits = [];
        }
    }

    public selectAmmoBin(
        weaponUUID: string,
        ammoUUID: string,
    ) {
        const weapon = this._equipmentList.find(eq => eq.uuid === weaponUUID);
        const bin = this._equipmentList.find(eq => eq.uuid === ammoUUID && eq.isAmmo);
        if( !weapon ) {
            return;
        }
        weapon.selectedAmmoBinUUID = ammoUUID;
        // A ton of ammunition is loaded for one launcher; bind an unbound bin
        // to the first weapon that draws from it.
        if( bin && !bin.feedsWeaponTag ) {
            bin.feedsWeaponTag = weapon.tag;
        }
    }

    /**
     * The weapon an ammunition bin is loaded for: its bound weapon if set,
     * otherwise the first mounted weapon that can fire it.
     */
    public getAmmoBinWeapon( bin: IEquipmentItem ): IEquipmentItem | null {
        const weapons = this._equipmentList.filter(eq => !eq.isAmmo && !eq.isEquipment);
        if( bin.feedsWeaponTag ) {
            // The launcher may be mounted with its fire control system: a bin for "lrm-20" feeds "lrm-20-artemis-iv".
            const bound = weapons.find(eq => matchesTag(eq, bin.feedsWeaponTag))
                ?? weapons.find(eq => eq.tag.startsWith(bin.feedsWeaponTag + "-") && getCompatibleAmmo(eq, bin));
            if( bound ) {
                return bound;
            }
        }
        return weapons.find(eq => getCompatibleAmmo(eq, bin)) ?? null;
    }

    /** Full shot count of an ammunition bin for the weapon it feeds. */
    public getAmmoBinCapacity( bin: IEquipmentItem ): number {
        if( !bin.isAmmo ) {
            return 0;
        }
        const weapon = this.getAmmoBinWeapon(bin);
        const shotsPerTon = weapon ? getWeaponShotsPerTon(weapon, bin) : getAmmoRoundsPerTon(bin);
        return Math.floor(shotsPerTon * (bin.weight || 1) + 1e-6);
    }

    /** Shots left in an ammunition bin; an untouched bin is full. */
    public getAmmoBinRemaining( bin: IEquipmentItem ): number {
        const capacity = this.getAmmoBinCapacity(bin);
        if( typeof(bin.currentAmmo) !== "number" || bin.currentAmmo < 0 ) {
            return capacity;
        }
        // Records saved before bins counted shots may hold a larger round count.
        return Math.min(bin.currentAmmo, capacity);
    }

    public toggleResolved(
        eq_index: number
    ) {
        if( this._equipmentList.length > eq_index ) {
            this._equipmentList[eq_index].resolved = !this._equipmentList[eq_index].resolved;
            if( this._equipmentList[eq_index].selectedAmmoBinUUID  ) {
                // One resolved attack spends one shot from the selected bin.
                if( this._equipmentList[eq_index].resolved )
                    this._decrementAmmoBin( this._equipmentList[eq_index].selectedAmmoBinUUID );
                else
                    this._incrementAmmoBin( this._equipmentList[eq_index].selectedAmmoBinUUID );
            }
        }
    }

    private _decrementAmmoBin( uuid: string | undefined, amount: number = 1 ) {
        if( uuid ) {
            for( const eq of this._equipmentList ) {
                if( eq.uuid === uuid && eq.isAmmo ) {
                    const remaining = this.getAmmoBinRemaining(eq);
                    if( remaining >= amount ) {
                        eq.currentAmmo = remaining - amount;
                    }
                }
            }
        }
    }

    private _incrementAmmoBin( uuid: string | undefined, amount: number = 1 ) {
        if( uuid ) {
            for( const eq of this._equipmentList ) {
                if( eq.uuid === uuid && eq.isAmmo ) {
                    eq.currentAmmo = Math.min(this.getAmmoBinRemaining(eq) + amount, this.getAmmoBinCapacity(eq));
                }
            }
        }
    }

    public setDamageClusterHits(
        eq_index: number,
        nv: IClusterHit[]
    ) {
        if( this._equipmentList.length > eq_index ) {
            this._equipmentList[eq_index].damageClusterHits = nv;
        }
    }

    /**
     * The catalog record an SSW component name stands for, matched on the record's name, alternateName or
     * altNames. SSW gives the Inner Sphere and Clan XL engines one name ("XL Engine") and tells them apart by
     * the element's techbase attribute (0 Inner Sphere, 1 Clan); a Clan one picks the record without Inner
     * Sphere criticals. An unknown name goes into the import errors and returns undefined.
     */
    private _findSSWComponent<K extends CustomComponentKind>(
        kind: K,
        component: string,
        sswName: unknown,
        sswTechbase?: unknown,
    ): ComponentRecord<K> | undefined {
        const isClan = String( sswTechbase ) === "1";
        const hasInnerSphereCriticals = ( record: ComponentRecord<K> ) => !!( record as { criticals?: { is?: unknown } } ).criticals?.is;
        // Canon wins; custom and draft records answer only names canon doesn't.
        for( const tier of getComponentTiers( kind ) ) {
            const matches = findAllByName( tier as ComponentRecord<K>[], sswName );
            if( matches.length > 0 ) {
                return matches.find( ( record ) => hasInnerSphereCriticals( record ) !== isClan ) ?? matches[0];
            }
        }
        this._sswImportErrors.push( "Cannot find any " + component + " named: '" + sswName + "'" );
        this._addSSWUnresolvedComponent( kind, String( sswName ), sswTechbase );
        return undefined;
    }

    /**
     * A custom component the setter refused (a draft's unknown stats are 0 at runtime, which no setter accepts):
     * report it, so the design isn't silently built with the fallback type.
     */
    private _checkSSWComponentUsed<K extends CustomComponentKind>( kind: K, record: ComponentRecord<K>, currentTag: string ) {
        if( currentTag !== record.tag && isCustomComponent( kind, record ) ) {
            this._sswImportErrors.push( "Cannot use the custom " + kind + " '" + record.name + "' until its stats are entered; using '" + currentTag + "' instead" );
            this._addSSWUnresolvedComponent( kind, record.name );
        }
    }

    /** An unresolved chassis component; its faction is SSW's techbase (0 Inner Sphere, 1 Clan), else the design's. */
    private _addSSWUnresolvedComponent( kind: CustomComponentKind | "cockpit", name: string, sswTechbase?: unknown ) {
        const techTag = this.getTech().tag;
        const faction = String( sswTechbase ) === "1" ? "clan"
            : String( sswTechbase ) === "0" ? "is"
                : techTag === "clan" || techTag === "mclan" ? "clan" : "is";
        this._sswUnresolved.push( {
            kind, name, sswName: name, faction, sswType: kind, location: "", slotIndex: -1, splitLocations: [], tons: null,
        } );
    }

    /** Moves one unallocated critical tagged `tag` to each SSW `<location index="N">loc</location>`. */
    private _placeSSWCriticals( sswLocations: unknown, tag: string ) {
        if( !sswLocations || typeof sswLocations !== "object" ) {
            return;
        }
        this._calcCriticals();
        const locations: any[] = Array.isArray( sswLocations ) ? sswLocations : [ sswLocations ];
        for( const loc of locations ) {
            const foundIndex = this._unallocatedCriticals.findIndex( ( crit ) => crit && crit.tag === tag );
            if( foundIndex < 0 ) {
                break;
            }
            this.moveCritical(
                "un",
                foundIndex,
                loc["#text"] ? this._sswCriticalLocation( String( loc["#text"] ) ) : "un",
                loc["@_index"] ? +loc["@_index"] : -1,
            );
        }
    }

    /** SSW armored components: one location element for each armored slot (TO:AUE p.94). */
    private _importSSWArmoredLocations( sswLocations: unknown ) {
        if( !sswLocations || typeof sswLocations !== "object" ) return;
        this._calcCriticals();
        for( const loc of Array.isArray( sswLocations ) ? sswLocations : [ sswLocations ] ) {
            const location = this._sswCriticalLocation( String( loc?.["#text"] ?? "" ) );
            const index = Number( loc?.["@_index"] );
            const slots = this._criticalArrayFor( location );
            if( !slots || !Number.isInteger( index ) || index < 0 || index >= slots.length ) continue;
            let start = index;
            while( start > 0 && slots[ start ]?.placeholder ) start--;
            const record = slots[ start ];
            if( !record || !this._isArmorableRecord( record ) ) {
                this._sswImportErrors.push( "Cannot armor slot " + ( index + 1 ) + " of the " + location );
                continue;
            }
            const item = this._equipmentForRecord( record );
            if( item ) item.armored = true;
            else this._armoredSlots.add( BattleMech._armoredSlotKey( record.tag, location, start ) );
        }
        this._calc();
    }

    /** SSW Patchwork Armor: each location element names its armor type and tech base (TO:AUE p.189). */
    private _importSSWPatchworkTypes( sswArmor: Record<string, unknown> ) {
        const quad = this.isQuad() || this.isQuadVee();
        const keys: Record<string, string> = {
            hd: "head", ct: "centerTorso", lt: "leftTorso", rt: "rightTorso",
            la: quad ? "frontLeftLeg" : "leftArm", ra: quad ? "frontRightLeg" : "rightArm", ll: "leftLeg", rl: "rightLeg", cl: "centerLeg",
        };
        for( const [ sswKey, locationKey ] of Object.entries( keys ) ) {
            const element = sswArmor[sswKey];
            if( !element || typeof element !== "object" ) continue;
            const typeName = ( element as Record<string, unknown> )["@_type"];
            if( !typeName ) continue;
            const armor = this._findSSWComponent( "armor", "armor", typeName, ( element as Record<string, unknown> )["@_techbase"] );
            if( armor && this.setPatchworkArmorType( locationKey, armor.tag ).tag !== armor.tag ) {
                this._sswImportErrors.push( "Cannot use '" + String( typeName ) + "' as patchwork armor in the " + locationKey );
            }
        }
    }

    /**
     * Armor with fixed slots in each location (Stealth: 2 in each arm, leg and side torso) is placed in the first free
     * slots, which can be ones the file gives a weapon. Moves each location's block to the file's first slot for it
     * (SSW always lists a location's armor slots together) (#43).
     */
    private _placeSSWFixedArmor( sswLocations: unknown, tag: string ) {
        if( !sswLocations || typeof sswLocations !== "object" ) {
            return;
        }
        const firstSlot = new Map<string, number>();
        for( const loc of Array.isArray( sswLocations ) ? sswLocations : [ sswLocations ] ) {
            const location = this._sswCriticalLocation( String( loc?.["#text"] ?? "" ) );
            const index = Number( loc?.["@_index"] );
            if( location && Number.isInteger( index ) ) firstSlot.set( location, Math.min( index, firstSlot.get( location ) ?? index ) );
        }
        const slotsOf: Record<string, ICriticalSlot[] | undefined> = {
            hd: this._criticals.head, ct: this._criticals.centerTorso, lt: this._criticals.leftTorso, rt: this._criticals.rightTorso,
            la: this._criticals.leftArm, ra: this._criticals.rightArm, ll: this._criticals.leftLeg, rl: this._criticals.rightLeg,
            fll: this._criticals.frontLeftLeg, frl: this._criticals.frontRightLeg, cl: this._criticals.centerLeg,
        };
        for( const [ location, target ] of firstSlot ) {
            const slots = slotsOf[ location ];
            const current = slots?.findIndex( ( slot ) => slot && slot.tag === tag && !slot.placeholder ) ?? -1;
            if( current >= 0 && current !== target ) {
                this.moveCritical( location, current, location, target );
            }
        }
    }

    /**
     * SSW lists an item spread over several locations (Talons: every leg) at one location only. Its other slots go in
     * the first free slots of its other locations, shared out evenly (#43).
     */
    private _placeSSWSpreadRemainder( item: IEquipmentItem, startSlots: Record<string, number> = {} ) {
        const locations = this._getSpreadLocations( item );
        if( !locations || !item.spreadSlots ) {
            return;
        }
        const perLocation = this._getSpreadSlotsPerLocation( item );
        const slotsOf: Record<string, ICriticalSlot[] | undefined> = {
            hd: this._criticals.head, ct: this._criticals.centerTorso, lt: this._criticals.leftTorso, rt: this._criticals.rightTorso,
            la: this._criticals.leftArm, ra: this._criticals.rightArm, ll: this._criticals.leftLeg, rl: this._criticals.rightLeg,
            cl: this._criticals.centerLeg, fll: this._criticals.frontLeftLeg, frl: this._criticals.frontRightLeg,
        };
        for( const location of locations ) {
            const slots = slotsOf[ location ];
            if( !slots ) continue;
            const held = () => slots.filter( ( slot ) => slot && !slot.placeholder && slot.tag === item.tag ).length;
            while( held() < perLocation ) {
                const piece = this._unallocatedCriticals.findIndex( ( slot ) => slot && slot.tag === item.tag );
                let free = -1;
                for( let index = Math.max( 0, startSlots[ location ] ?? 0 ); index < slots.length; index++ ) {
                    if( !slots[ index ] ) { free = index; break; }
                }
                if( piece < 0 || free < 0 || !this.moveCritical( "un", piece, location, free ) ) break;
            }
        }
    }

    /**
     * SSW gives a partial wing as <partialwing tech lsstart rsstart> and Mechanical Jump Boosters as <jumpbooster mp>,
     * outside the equipment list, and both were dropped (#43). The wing's slots start at lsstart and rsstart in the
     * side torsos; the boosters take the first free slots in the legs.
     */
    private _installSSWLocatedSystems( baseloadout: any ) {
        const add = ( tag: string ) => this.addEquipmentFromTag( tag, "", "", false, null, undefined, undefined, undefined, undefined, undefined );
        const wing = baseloadout?.partialwing;
        if( wing ) {
            const item = add( String( wing["@_tech"] ) === "1" ? "clan-partial-wing" : "partial-wing" );
            if( item ) {
                this._placeSSWSpreadRemainder( item, { lt: Number( wing["@_lsstart"] ) || 0, rt: Number( wing["@_rsstart"] ) || 0 } );
            } else {
                this._sswImportErrors.push( "Cannot import the partial wing" );
            }
        }
        const boosterMP = Number( baseloadout?.jumpbooster?.["@_mp"] );
        if( boosterMP > 0 ) {
            const item = add( "mechanical-jump-booster" );
            if( item?.uuid ) {
                this.setEquipmentSize( item.uuid, boosterMP );
                this._placeSSWSpreadRemainder( item );
            } else {
                this._sswImportErrors.push( "Cannot import the Mechanical Jump Boosters" );
            }
        }
        // <turret type="left torso|right torso|head" index>: the turret mechanism's slot; a head turret's is in the
        // center torso (TO:AUE p.158). A side-torso turret is a shoulder turret on a biped and a quad turret on a quad.
        for( const turret of ( [] as any[] ).concat( baseloadout?.turret ?? [] ) ) {
            const type = String( turret?.["@_type"] ?? "" ).toLowerCase().trim();
            const location = type === "head" ? "ct" : type === "left torso" ? "lt" : type === "right torso" ? "rt" : "";
            const item = location ? add( type === "head" ? "mech-turret-head" : this.isQuad() || this.isQuadVee() ? "mech-turret-quad" : "mech-turret-shoulder" ) : null;
            if( !item ) {
                this._sswImportErrors.push( "Cannot import the " + type + " turret" );
                continue;
            }
            this._calcCriticals();
            const piece = this._unallocatedCriticals.findIndex( ( record ) => record && record.uuid === item.uuid );
            if( piece < 0 || !this.moveCritical( "un", piece, location, Number( turret?.["@_index"] ) ) ) {
                this._sswImportErrors.push( "Cannot place the " + item.name + " in the " + location );
            }
        }
        // Actuator Enhancement Systems (TO:AUE p.91): <arm_aes location index> per arm, <leg_aes> with a location per leg (#46).
        const clan = this._tech.tag === "clan" || this._tech.tag === "mclan";
        const aesSlots = [
            ...( [] as any[] ).concat( baseloadout?.arm_aes ?? [] ).map( ( aes ) => ( { kind: "arm", loc: aes?.["@_location"], index: aes?.["@_index"] } ) ),
            ...( [] as any[] ).concat( baseloadout?.leg_aes?.location ?? [] ).map( ( aes ) => ( { kind: "leg", loc: aes?.["#text"] ?? aes, index: aes?.["@_index"] } ) ),
        ];
        for( const slot of aesSlots ) {
            const location = this._sswCriticalLocation( String( slot.loc ?? "" ) );
            const item = add( ( clan ? "clan-aes-" : "aes-" ) + slot.kind );
            if( !item ) {
                this._sswImportErrors.push( "Cannot import the " + slot.kind + " Actuator Enhancement System in the " + location );
                continue;
            }
            this._calcCriticals();
            const piece = this._unallocatedCriticals.findIndex( ( record ) => record && record.uuid === item.uuid );
            if( piece < 0 || !this.moveCritical( "un", piece, location, Number( slot.index ) ) ) {
                this._sswImportErrors.push( "Cannot place the Actuator Enhancement System in the " + location );
            }
        }
        // Systems with a slot in several locations come as <multislot name> with a <location index> per slot, outside
        // the equipment list, and were dropped (#46).
        const multislotTags: Record<string, string> = {
            "Blue Shield PFD": "blue-shield",
            "Chameleon LPS": "chameleon-lps",
            "Environmental Sealing": "environmental-sealing",
            "Null Signature System": "null-signature-system",
            "Tracks": "tracks",
            "Void Signature System": "void-signature-system",
        };
        for( const multislot of ( [] as any[] ).concat( baseloadout?.multislot ?? [] ) ) {
            const name = String( multislot?.["@_name"] ?? "" ).trim();
            const tag = multislotTags[ name ];
            const item = tag ? add( tag ) : null;
            if( !item ) {
                this._sswImportErrors.push( "Cannot import the " + name );
                continue;
            }
            for( const slot of ( [] as any[] ).concat( multislot?.location ?? [] ) ) {
                const location = this._sswCriticalLocation( String( slot?.["#text"] ?? slot ?? "" ) );
                this._calcCriticals();
                const piece = this._unallocatedCriticals.findIndex( ( record ) => record && record.tag === item.tag );
                if( piece < 0 || !this.moveCritical( "un", piece, location, Number( slot?.["@_index"] ) ) ) {
                    this._sswImportErrors.push( "Cannot place the " + name + " in the " + location );
                }
            }
        }
    }

    /**
     * SSW marks a Full-Head Ejection System, an IndustrialMech ejection seat and a Cockpit Command Console as
     * attributes of the cockpit type, outside the equipment list (#46). The FHES takes no slot (TO:AUE p.122); the
     * ejection seat takes a head slot (TM p.214); the Command Console takes the head slot beside the cockpit.
     */
    private _installSSWCockpitSystems( cockpitType: any ) {
        if( !cockpitType || typeof cockpitType !== "object" ) return;
        const flag = ( name: string ) => String( cockpitType[ "@_" + name ] ?? "" ).trim().toUpperCase() === "TRUE";
        const add = ( tag: string ) => this.addEquipmentFromTag( tag, "", "", false, null, undefined, undefined, undefined, undefined, undefined );
        if( flag( "fhes" ) ) {
            const clan = this._tech.tag === "clan" || this._tech.tag === "mclan";
            if( !add( clan ? "clan-full-head-ejection-system" : "full-head-ejection-system" ) ) {
                this._sswImportErrors.push( "Cannot import the Full-Head Ejection System" );
            }
        }
        if( flag( "ejectionseat" ) ) {
            const seat = add( "industrialmech-ejection-seat" );
            if( !seat ) {
                this._sswImportErrors.push( "Cannot import the ejection seat" );
            } else {
                this._calcCriticals();
                const piece = this._unallocatedCriticals.findIndex( ( slot ) => slot && slot.uuid === seat.uuid );
                const free = this._criticals.head.findIndex( ( slot ) => !slot );
                if( piece < 0 || free < 0 || !this.moveCritical( "un", piece, "hd", free ) ) {
                    this._sswImportErrors.push( "No free head slot for the ejection seat" );
                }
            }
        }
        if( flag( "commandconsole" ) && !this.setCommandConsole( true ) ) {
            this._sswImportErrors.push( "This 'Mech cannot mount a Cockpit Command Console (TO:AUE p.112)" );
        }
        // Not a Skunk Werks attribute: the MegaMek import sets it from MegaMek's "EIInterface" nocrit line.
        if( flag( "enhancedimaging" ) && !this.setEnhancedImaging( true ) ) {
            this._sswImportErrors.push( "This 'Mech cannot mount Enhanced Imaging (Clan only, IO:AE p.69)" );
        }
    }

    private _installSSWEquipment(
        item: any
    ) {
        // The list is kept sorted, so the new items are told apart by their UUIDs.
        const installed = new Set( this._equipmentList.map( ( equipment ) => equipment?.uuid ) );
        this._installSSWEquipmentItem( item );
        // An OmniMech's base loadout is its fixed equipment (#112).
        if( this._omnimech && item?.["@_omnifixed"] ) {
            for( const equipment of this._equipmentList ) {
                if( equipment && !installed.has( equipment.uuid ) ) equipment.omniFixed = true;
            }
        }
    }

    private _installSSWEquipmentItem(
        item: any
    ) {

        // Unprefixed items belong to the design's own tech base; SSW marks the other side's items
        // with "(IS) " or "(CL) " (older files: "(CLAN) ").
        const techTag = this.getTech().tag;
        let listTag: ImportFaction = techTag === "clan" || techTag === "mclan" ? "clan" : "is";
        let itemName = "";
        let location = "";
        let allocationIndex = -1;
        let rear = false;
        const techPrefix = item.name ? /\((IS|CL|CLAN)\) /.exec( item.name["#text"] ) : null;
        if( techPrefix ) {
            itemName = item.name["#text"].replace( techPrefix[0], "" );
            listTag = techPrefix[1] === "IS" ? "is" : "clan";
        } else {
            itemName = item.name["#text"];
            // SSW names the Inner Sphere suite "Guardian ECM Suite"; its unprefixed "ECM Suite" is the Clan one, on
            // Mixed Tech designs too (#43).
            if( String( itemName ).trim() === "ECM Suite" ) listTag = "clan";
        }

        // "(T) " marks a turret mount (the turret itself comes from _installSSWLocatedSystems).
        let turret = false;
        if( itemName.startsWith("(T) ") ) {
            itemName = itemName.slice( 4 );
            turret = true;
        }

        if( itemName.indexOf("(R) ") > -1 ) {
            itemName = itemName.replace( "(R) ", "" )
            rear = true;
        }


        let halfTon = false;
        if( itemName.indexOf(" (1/2)") > -1 ) {
            itemName = itemName.replace( " (1/2)", "" )
            halfTon = true;
        }

        if( item.location && item.location["#text"]) {
            // A four-legged design written with arm codes for its front legs keeps the item in the front leg.
            location = this._normalizeLocation( item.location["#text"].toLowerCase().trim() );

            if( typeof( item.location["@_index"]) !== "undefined" ) {
                allocationIndex =  +item.location["@_index"];
            }

        }
        // "@ <weapon>" is a ton loaded for that weapon: an MML-5 (LRM) ton feeds the MML, not an LRM 15 beside it (#46).
        const sswAmmoWeapon = itemName.startsWith( "@ " ) ? itemName.slice( 2 ) : "";
        if( itemName.indexOf( "@" ) > -1 )
            itemName = itemName.replace( "@ ", "Ammo (" ) + ")"

        if( location === "ctr" ) {
            rear = true;
            location = "ct";
        }
        if( location === "ltr" ) {
            rear = true;
            location = "lt";
        }
        if( location === "rtr" ) {
            rear = true;
            location = "rt";
        }


        // SSW lists a laser mated to a Laser Insulator as one item, "<laser> (Insulated)": install the laser, then its
        // insulator in the next slot of the same location (TO:AUE p.134).
        let insulated = false;
        if( / \(Insulated\)$/.test( itemName ) ) {
            itemName = itemName.replace( / \(Insulated\)$/, "" );
            insulated = true;
        }

        if( itemName ) {

            // SSW's names are listed on the catalog records (altNames); see findImportedEquipment.
            const mixedTech = techTag === "mis" || techTag === "mclan";
            let match = findImportedEquipment( itemName, listTag, mixedTech );
            // SSW puts a few items of the other tech base on single-tech designs (Clan Enhanced PPCs and Streak SRM-6
            // CPs on Inner Sphere 'Mechs). Install them as SSW does and say the design needs Mixed Tech.
            if( !match && !mixedTech ) {
                const other = findImportedEquipment( itemName, listTag, true );
                if( other && other.catalog !== "custom" && other.catalog !== "universal" && other.catalog !== listTag ) {
                    match = other;
                    this._sswImportErrors.push( "'" + item.name["#text"] + "' is " + ( other.catalog === "clan" ? "Clan" : "Inner Sphere" )
                        + " equipment (" + other.item.name + ") on " + ( listTag === "clan" ? "a Clan" : "an Inner Sphere" ) + " design; the design needs Mixed Tech" );
                }
            }
            const newItem = match ? this._installEquipmentRecord(
                match.item,
                location,
                rear,
                generateUUID(),
                undefined,
                item.splitlocation ? item.splitlocation : [],
            ) : null;

            if( !newItem ) {
                //TODO: Commenting out warning - Why is this firing  during alpha strike generation?
                //console.warn( "Cannot find any equipment named: '" + itemName + "'" );
                this._sswImportErrors.push( "Cannot find any equipment named: '" + itemName + "'" )
                const splits = Array.isArray( item.splitlocation ) ? item.splitlocation : item.splitlocation ? [ item.splitlocation ] : [];
                this._sswUnresolved.push( {
                    kind: String( item.type ).toLowerCase().trim() === "ammunition" ? "ammunition" : "equipment",
                    name: itemName,
                    sswName: item.name["#text"],
                    faction: listTag,
                    sswType: String( item.type ?? "" ).toLowerCase().trim(),
                    location,
                    slotIndex: allocationIndex,
                    splitLocations: splits.map( ( split: any ) => ( {
                        location: String( split["#text"] ?? "" ).toLowerCase().trim(),
                        index: +( split["@_index"] ?? -1 ),
                        number: Number.isFinite( +split["@_number"] ) ? +split["@_number"] : 0,
                    } ) ),
                    tons: item.tons !== undefined && Number.isFinite( +item.tons ) ? +item.tons : null,
                } );
            } else {



                if( halfTon ) {
                    newItem.weight = .5;
                }

                newItem.allocationIndex = allocationIndex;
                newItem.allocationLocation = location;
                newItem.location = "un";
                newItem.rear = rear;
                if( turret ) newItem.turret = true;
                newItem.split_location = [];
                // The MegaMek file converter names the weapon a ton is loaded for by its tag.
                const feeds = typeof item["@_feeds"] === "string" ? item["@_feeds"].trim() : "";
                if( newItem.isAmmo && feeds ) newItem.feedsWeaponTag = feeds;
                if( newItem.isAmmo && sswAmmoWeapon ) {
                    // Drop trailing qualifiers ("MML-5 (LRM)" -> "MML-5") until the name finds a weapon that fires the bin.
                    let name = sswAmmoWeapon;
                    while( name ) {
                        const weapon = findImportedEquipment( name, listTag, mixedTech )?.item;
                        if( weapon && !weapon.isAmmo && getCompatibleAmmo( weapon, newItem ) ) {
                            newItem.feedsWeaponTag = weapon.tag;
                            break;
                        }
                        const shorter = name.replace( / \([^()]*\)$/, "" );
                        name = shorter === name ? "" : shorter;
                    }
                }
                // Cargo bays and other sized items: SSW gives the size in tons.
                if( newItem.sizeLabel === "Tons" && item.tons !== undefined && +item.tons > 0 ) {
                    newItem.size = +item.tons;
                }
                const insulatorRecord = insulated
                    ? findImportedEquipment( listTag === "clan" ? "Laser Insulator (Clan)" : "Laser Insulator", listTag, mixedTech )?.item
                    : undefined;
                if( insulatorRecord ) {
                    const insulator = this._installEquipmentRecord( insulatorRecord, location, rear, generateUUID(), undefined, [] );
                    if( insulator ) {
                        insulator.allocationIndex = allocationIndex < 0 ? -1 : allocationIndex + ( newItem.space?.battlemech ?? 1 );
                        insulator.allocationLocation = location;
                        insulator.location = "un";
                        insulator.rear = rear;
                        insulator.split_location = [];
                    }
                }
                // SSW lists a machine gun array with its guns as one item, "MG Array (<count> <gun>)": install the
                // guns too, in the slots after the array (TM p.228).
                const arrayGuns = /^MG Array \(([2-4]) (.+)\)$/.exec( itemName.trim() );
                const gunRecord = arrayGuns ? findImportedEquipment( arrayGuns[2], listTag, mixedTech )?.item : undefined;
                if( arrayGuns && gunRecord ) {
                    for( let gun = 0; gun < +arrayGuns[1]; gun++ ) {
                        const installed = this._installEquipmentRecord( gunRecord, location, rear, generateUUID(), undefined, [] );
                        if( !installed ) continue;
                        installed.allocationIndex = allocationIndex < 0 ? -1 : allocationIndex + ( newItem.space?.battlemech ?? 1 ) + gun;
                        installed.allocationLocation = location;
                        installed.location = "un";
                        installed.rear = rear;
                        installed.split_location = [];
                    }
                } else if( arrayGuns ) {
                    this._sswImportErrors.push( "Cannot find the machine guns of '" + item.name["#text"] + "'" );
                }
                if( newItem.uuid && !isSSWNoMake( item.name["@_manufacturer"] ) ) {
                    this._sswCopyMakes.push( { uuid: newItem.uuid, make: String( item.name["@_manufacturer"] ).trim() } );
                }


                if( item.splitlocation ) {
                    for( const split of item.splitlocation ) {

                        newItem.split_location.push(
                            {
                                loc: this._normalizeLocation( split["#text"].toLowerCase() ),
                                index: +split["@_index"],
                                size: +split["@_number"],
                            }
                        )
                    }
                }
            }
        }
    }

    /**
     * SSW marks fire control once per design, on the base loadout (fcsa4, fcsa5, fcsapollo): every applicable
     * launcher carries it. The catalog holds a launcher with its fire control as its own record, so each launcher
     * is swapped for that record, keeping where and how it is mounted.
     */
    private _applySSWFireControl( baseloadout: Record<string, unknown> ): void {
        const systems = [ [ "@_fcsa4", "-artemis-iv" ], [ "@_fcsa5", "-artemis-v" ], [ "@_fcsapollo", "-apollo" ] ];
        const fitted = systems.filter( ( [ attribute ] ) => String( baseloadout[attribute] ?? "" ).toLowerCase().trim() === "true" );
        if( fitted.length === 0 ) return;
        const catalog = getEquipmentCatalogDefinitions().flatMap( definition => definition.equipment );
        this._equipmentList = this._equipmentList.map( item => {
            if( item.isAmmo ) return item;
            for( const [ , suffix ] of fitted ) {
                const withFireControl = catalog.find( candidate => candidate.tag === item.tag + suffix );
                if( !withFireControl ) continue;
                const plain = catalog.find( candidate => candidate.tag === item.tag );
                const swapped: IEquipmentItem = JSON.parse( JSON.stringify( withFireControl ) );
                // Fields the import set on the mounted copy (location, slot, rear, splits, id) carry over.
                for( const key of Object.keys( item ) as ( keyof IEquipmentItem )[] ) {
                    if( !plain || !( key in plain ) ) ( swapped as unknown as Record<string, unknown> )[key] = item[key];
                }
                return swapped;
            }
            return item;
        } );
    }

    public getCriticalsForLocation(
        shortLoc: string
    ): ICriticalSlot[] {
        shortLoc = shortLoc.toLowerCase().trim();
        if( shortLoc === "hd" ) {
            return this._criticals.head;
        }

        if( shortLoc === "ct" ) {
            return this._criticals.centerTorso;
        }
        if( shortLoc === "lt" ) {
            return this._criticals.leftTorso;
        }
        if( shortLoc === "rt" ) {
            return this._criticals.rightTorso;
        }

        if( shortLoc === "ra" ) {
            return this._criticals.rightArm;
        }
        if( shortLoc === "la" ) {
            return this._criticals.leftArm;
        }

        if( shortLoc === "rl" ) {
            return this._criticals.rightLeg;
        }
        if( shortLoc === "ll" ) {
            return this._criticals.leftLeg;
        }


        return [];
    }
    public importSSWXML(
        ssw_xml: string
    ): void {
        const jObj = parseSSWXML(ssw_xml);
        // A design whose file differs from its newest printed sheet gets the sheet's (#607).
        correctSSWDesign( jObj );
        const omnimech = String( jObj?.mech?.["@_omnimech"] ?? "" ).toLowerCase().trim() === "true";
        const loadouts: any[] = omnimech ? ( [] as any[] ).concat( jObj.mech.loadout ?? [] ) : [];
        if( loadouts.length === 0 ) {
            this._importSSWObject( omnimech ? BattleMech._withSSWLoadout( jObj, {} ) : jObj );
            return;
        }
        // An OmniMech file holds every loadout (Prime, A, B...): each becomes a configuration, the first one active (#112).
        const names: string[] = [];
        const configurations: IOmniConfiguration[] = [];
        for( const loadout of loadouts ) {
            let name = String( loadout["@_name"] ?? "" ).trim() || BattleMech.DEFAULT_OMNI_CONFIGURATION;
            for( let copy = 2; names.includes( name ); copy++ ) name = String( loadout["@_name"] ).trim() + " (" + copy + ")";
            names.push( name );
            const variant = configurations.length === 0 ? this : new BattleMech();
            variant._importSSWObject( BattleMech._withSSWLoadout( jObj, loadout ) );
            variant._activeOmniConfiguration = name;
            if( variant !== this ) {
                this._sswImportErrors.push( ...variant._sswImportErrors.map( ( error ) => name + ": " + error ) );
                this._sswUnresolved.push( ...variant._sswUnresolved );
            }
            configurations.push( variant._snapshotActiveOmniConfiguration() );
        }
        this._omniConfigurations = configurations;
    }

    /**
     * The file with one loadout in place of the base loadout: the base loadout's equipment marked fixed, then the
     * loadout's own (SSW repeats the base loadout's CASE in every loadout). A loadout without heat sinks, jump jets
     * or actuators keeps the base loadout's.
     */
    private static _withSSWLoadout( jObj: any, loadout: any ): any {
        const copy = JSON.parse( JSON.stringify( jObj ) );
        const base = copy.mech.baseloadout ?? {};
        const listed = ( value: unknown ): any[] => ( [] as any[] ).concat( value ?? [] );
        const key = ( item: any ) => JSON.stringify( [ item?.name?.["#text"] ?? item?.name, item?.location ] );
        const fixedKeys = new Set( listed( base.equipment ).map( key ) );
        // A loadout's heat sinks and jump jets give the total, but only the pod ones' slots: the fixed ones' are the base loadout's.
        const withFixedSlots = ( system: "heatsinks" | "jumpjets" ) => {
            if( !loadout[system] || !base[system] ) return {};
            const fixedSlots = listed( base[system].location );
            const fixedSlotKeys = new Set( fixedSlots.map( ( slot ) => JSON.stringify( slot ) ) );
            const podSlots = listed( loadout[system].location ).filter( ( slot ) => !fixedSlotKeys.has( JSON.stringify( slot ) ) );
            return { [system]: { ...loadout[system], location: [ ...fixedSlots, ...podSlots ] } };
        };
        // The base chassis' heat sinks and jump jets; a converted MegaMek file gives its own (battlemech-mtf.ts).
        copy.mech.omnibase ??= { "@_heatsinks": base.heatsinks?.["@_number"] ?? 0, "@_jumpjets": base.jumpjets?.["@_number"] ?? 0 };
        copy.mech.baseloadout = {
            ...base,
            ...loadout,
            ...withFixedSlots( "heatsinks" ),
            ...withFixedSlots( "jumpjets" ),
            equipment: [
                // A MegaMek file converted for this import (battlemech-mtf.ts) marks its pod items omnipod.
                ...listed( base.equipment ).map( ( item ) => item["@_omnipod"] ? item : { ...item, "@_omnifixed": "TRUE" } ),
                ...listed( loadout.equipment ).filter( ( item ) => !fixedKeys.has( key( item ) ) ),
            ],
        };
        delete copy.mech.loadout;
        return copy;
    }

    private _importSSWObject(
        jObj: any
    ): void {

        this._sswImportErrors = [];
        this._sswUnresolved = [];
        this._sswCopyMakes = [];

        // console.log( "battlemech.importSSWXML() jObj", jObj)
        // IndustrialMech and Primitive files were skipped without a word, leaving an empty design (#46).
        const sswMechTypes = [ "BattleMech", "IndustrialMech", "PrimitiveBattleMech", "PrimitiveIndustrialMech" ];
        if( jObj && jObj.mech && !sswMechTypes.includes( String( jObj.mech.mech_type ?? "" ).trim() ) ) {
            this._sswImportErrors.push( "Cannot import a " + String( jObj.mech.mech_type ?? "unit without a mech_type" ) + " file" );
        }
        if( jObj && jObj.mech && sswMechTypes.includes( String( jObj.mech.mech_type ?? "" ).trim() ) ) {
            this.reset();
            // A Primitive 'Mech: its engine rating depends on it, so before the tonnage and Walking MP (IO:AE p.116).
            this._primitive = String( jObj.mech.mech_type ).startsWith( "Primitive" );

            if( jObj.mech.motive_type && jObj.mech.motive_type === "Quad" ) {
                this.setMechType("quad");
            }
            // SSW writes no tripods, QuadVees or LAMs; a converted MegaMek file does (battlemech-mtf.ts).
            const lamMotive = /^(Standard|Bimodal) LAM$/.exec( String( jObj.mech.motive_type ) );
            if( lamMotive ) {
                this.setMechType("lam");
                this.setLAMType( lamMotive[1] );
            }
            if( jObj.mech.motive_type === "Tripod" ) {
                this.setMechType("tripod");
            }
            if( /^QuadVee (Tracks|Wheels)$/.test( String( jObj.mech.motive_type ) ) ) {
                this.setMechType("quadvee");
                this.setQuadVeeMotive( / Wheels$/.test( jObj.mech.motive_type ) ? "wheeled" : "tracked" );
            }
            if( jObj.mech["@_model" ] ) {
                this.setModel( jObj.mech["@_model"] );
            }
            if( jObj.mech["@_name" ] ) {
                this.setName( jObj.mech["@_name"] );
            }
            this._omnimech = false;
            if( jObj.mech["@_omnimech"] ) {
                if( jObj.mech["@_omnimech" ].toLowerCase().trim() === "true")
                    this._omnimech = true;

            }
            if( jObj.mech["@_solaris7id"] ) {

            }
            if( jObj.mech["@_solaris7imageid"] ) {

            }
            if( jObj.mech["@_sswimage"] ) {

            }
            if( jObj.mech["@_tons"] ) {
                this.setTonnage( +jObj.mech["@_tons"] )
            }
            if( jObj.mech.techbase && jObj.mech.techbase["#text"] ) {
                // Each component carries a techbase (0 Inner Sphere, 1 Clan, 2 either) that sets its slots
                // (Clan Endo-Steel and Ferro-Fibrous 7, Clan double heat sinks 2, a Clan XL engine 2 per side torso) (#43).
                const componentTech = ( component: any ): string => String( component?.["@_techbase"] ?? "2" );
                const ownTechBase = ( component: any ): "is" | "clan" | undefined =>
                    componentTech( component ) === "1" ? "clan" : componentTech( component ) === "0" ? "is" : undefined;
                if( jObj.mech.techbase["#text"].toLowerCase().indexOf("inner") > -1) {
                    this.setTech("is");
                } else if( jObj.mech.techbase["#text"].toLowerCase().indexOf("clan") > -1) {
                    this.setTech("clan");
                    // A Clan design may mount Star League structure, armor or heat sinks (#168); the era is set
                    // from the year below, and the getters check the choice against it.
                    const components = { structure: jObj.mech.structure, armor: jObj.mech.armor, heatSink: jObj.mech.baseloadout?.heatsinks };
                    for( const [component, data] of Object.entries( components ) as ["structure" | "armor" | "heatSink", any][] ) {
                        const techBase = ownTechBase( data );
                        if( techBase ) this._mixedTechBases[component] = techBase;
                    }
                } else if( jObj.mech.techbase["#text"].toLowerCase().indexOf("mixed") > -1) {
                    // SSW keeps no chassis tech base: its Mixed designs follow the Inner Sphere rules, with Clan
                    // CASE a choice of their own (<clancase>), and a Clan engine does not make a Clan chassis.
                    this.setTech( "mis" );
                    const engineTechBase = ownTechBase( jObj.mech.engine );
                    if( engineTechBase ) this.setEngineTechBase( engineTechBase );
                    const structureTechBase = ownTechBase( jObj.mech.structure );
                    if( structureTechBase ) this.setStructureTechBase( structureTechBase );
                    const armorTechBase = ownTechBase( jObj.mech.armor );
                    if( armorTechBase ) this.setArmorTechBase( armorTechBase );
                    const heatSinkTechBase = ownTechBase( jObj.mech.baseloadout?.heatsinks );
                    if( heatSinkTechBase ) this.setHeatSinkTechBase( heatSinkTechBase );
                }
            }
            // The design year sets the era, so era-dependent rules (such as a Clan design's Star League
            // equipment) match the design.
            const sswYear = Number( jObj.mech.year?.["#text"] ?? jObj.mech.year );
            if( Number.isFinite( sswYear ) && sswYear > 0 ) {
                const sswEra = getEraForYear( sswYear, this.getTech().tag );
                if( sswEra ) {
                    this.setEra( sswEra.tag );
                }
            }

            if( jObj.mech.baseloadout ) {
                if( jObj.mech.baseloadout.actuators ) {
                    if( jObj.mech.baseloadout.actuators["@_lh"] && jObj.mech.baseloadout.actuators["@_lh"].toLowerCase().trim() !== "true" ) {
                        this.removeHandActuator( "la" );
                    } else {
                        this.addHandActuator( "la" );
                    }
                    if( jObj.mech.baseloadout.actuators["@_lla"] && jObj.mech.baseloadout.actuators["@_lla"].toLowerCase().trim() !== "true" ) {
                        this.removeLowerArmActuator( "la" );
                    } else {
                        this.addLowerArmActuator( "la" );
                    }
                    if( jObj.mech.baseloadout.actuators["@_rh"] && jObj.mech.baseloadout.actuators["@_rh"].toLowerCase().trim() !== "true" ) {
                        this.removeHandActuator( "ra" );
                    } else {
                        this.addHandActuator( "ra" );
                    }
                    if( jObj.mech.baseloadout.actuators["@_rla"] && jObj.mech.baseloadout.actuators["@_rla"].toLowerCase().trim() !== "true" ) {
                        this.removeLowerArmActuator( "ra" );
                    } else {
                        this.addLowerArmActuator( "ra" );
                    }
                }
            }

            // The cockpit, engine, gyro and internal structure come before the armor and equipment, whose
            // critical slots depend on them (an XL engine fills side torso slots).
            if( jObj.mech.cockpit && jObj.mech.cockpit.type ) {
                const cockpitType = String( jObj.mech.cockpit.type["#text"] ?? jObj.mech.cockpit.type ).trim();
                if( cockpitType === "Small Cockpit" ) {
                    this._smallCockpit = true;
                } else if( cockpitType === "Torso-Mounted Cockpit" ) {
                    this._torsoMountedCockpit = true;
                } else if( cockpitType === "Interface Cockpit" ) {
                    this._interfaceCockpit = true;
                } else if( cockpitType === "Robotic Cockpit" || cockpitType === "Robotic Cockpit (Improved)" ) {
                    // A standard cockpit with a Smart Robotic Control System (IO:AE p.134). Skunk Werks has no Improved
                    // grade; the MegaMek import writes "(Improved)" for MegaMek's ImprovedSmartRoboticControlSystem.
                    this._roboticControl = cockpitType === "Robotic Cockpit" ? "srcs" : "srcs-improved";
                } else if( cockpitType === "Industrial w/ Adv. FC" ) {
                    // The IndustrialMech cockpit follows the internal structure; Advanced Fire Control is a choice (TM p.69).
                    this._advancedFireControl = true;
                } else if( cockpitType !== "Standard Cockpit" && cockpitType !== "Industrial Cockpit"
                    && cockpitType !== "Primitive Cockpit" && cockpitType !== "Primitive Industrial Cockpit" ) {
                    this._sswImportErrors.push( "Cannot import the cockpit type: '" + cockpitType + "'" );
                    this._addSSWUnresolvedComponent( "cockpit", cockpitType );
                }
            }

            if( jObj.mech.engine ) {
                this.setWalkSpeed( +jObj.mech.engine["@_rating"] / this._tonnage );
                // In a Primitive 'Mech any engine "is considered a Primitive engine" (IO:AE p.117); SSW names the I.C.E. and
                // fuel cell ones "Primitive I.C.E. Engine" and "Primitive Fuel-Cell Engine".
                const sswEngineName = String( jObj.mech.engine["#text"] ?? "" ).replace( /^Primitive (I\.C\.E\.|Fuel-Cell) Engine$/, "$1 Engine" );
                const engineType = this._findSSWComponent( "engine", "engine", sswEngineName, jObj.mech.engine["@_techbase"] );
                if( engineType ) {
                    this.setEngineType( engineType.tag );
                    this._checkSSWComponentUsed( "engine", engineType, this.getEngineType().tag );
                }
            }

            if( jObj.mech.gyro ) {
                const gyroType = this._findSSWComponent( "gyro", "gyro", jObj.mech.gyro["#text"] );
                if( gyroType ) {
                    this.setGyroType( gyroType.tag );
                    this._checkSSWComponentUsed( "gyro", gyroType, this.getGyro().tag );
                }
            }

            if( jObj.mech.structure && jObj.mech.structure.type ) {
                // A Primitive 'Mech's structure is standard or industrial (IO:AE p.117).
                const sswStructureNames: Record<string, string> = { "Primitive Structure": "Standard Structure", "Primitive Industrial Structure": "Industrial Structure" };
                const sswStructureName = String( jObj.mech.structure.type ).trim();
                const structureType = this._findSSWComponent( "structure", "internal structure", sswStructureNames[sswStructureName] ?? sswStructureName );
                if( structureType && this.setInternalStructureType( structureType.tag ) ) {
                    this._placeSSWCriticals( jObj.mech.structure.location, this.getInternalStructureType() );
                }
                if( structureType ) {
                    this._checkSSWComponentUsed( "structure", structureType, this.getInternalStructureType() );
                }
            }

            if( jObj.mech.armor ) {
                let totalArmor = 0;
                // It sure would be nice for SSW to have the armor weight in XML file 🙄
                // Patchwork locations carry their armor type as attributes, so the points are the element's text.
                const sswArmor = jObj.mech.armor;
                const armorPoints = ( value: unknown ): number => {
                    const points = Number( value && typeof value === "object" ? ( value as Record<string, unknown> )["#text"] : value );
                    return Number.isFinite( points ) ? points : 0;
                };
                // A Quad's front legs are SSW's la and ra; armor put in its arms counted for nothing (#46).
                const sswQuad = this.isQuad() || this.isQuadVee();
                const sswArmorLocations: [ string, keyof typeof this._armorAllocation ][] = [
                    [ "ct", "centerTorso" ], [ "ctr", "centerTorsoRear" ], [ "hd", "head" ], [ "la", sswQuad ? "frontLeftLeg" : "leftArm" ], [ "ll", "leftLeg" ],
                    [ "lt", "leftTorso" ], [ "ltr", "leftTorsoRear" ], [ "ra", sswQuad ? "frontRightLeg" : "rightArm" ], [ "rl", "rightLeg" ], [ "rt", "rightTorso" ],
                    [ "rtr", "rightTorsoRear" ], [ "cl", "centerLeg" ],
                ];
                for( const [ sswKey, allocationKey ] of sswArmorLocations ) {
                    if( !sswArmor[sswKey] ) continue;
                    const points = armorPoints( sswArmor[sswKey] );
                    ( this._armorAllocation as unknown as Record<string, number> )[allocationKey] = points;
                    totalArmor += points;
                }
                if( jObj.mech.armor.type ) {
                    const armorType = this._findSSWComponent( "armor", "armor", jObj.mech.armor.type );
                    if( armorType ) {
                        this.setArmorType( armorType.tag );
                        this._checkSSWComponentUsed( "armor", armorType, this.getArmorType() );
                    }

                    this.setArmorCount( totalArmor );

                    this._placeSSWCriticals( jObj.mech.armor.location, this.getArmorType() );
                    this._placeSSWFixedArmor( jObj.mech.armor.location, this.getArmorType() );
                }
            }

            // SSW writes MASC and TSM as the 'Mech's enhancement, beside the cockpit, not in the equipment list (#46).
            // TSM is the myomer, placed like structure; MASC joins the equipment below at the file's slot.
            const enhancement = jObj.mech.enhancement;
            if( enhancement && enhancement.type ) {
                const enhancementType = String( enhancement.type["#text"] ?? enhancement.type ).trim();
                const enhancementLocations: any[] = Array.isArray( enhancement.location ) ? enhancement.location : enhancement.location ? [ enhancement.location ] : [];
                if( enhancementType.toUpperCase() === "MASC" ) {
                    if( !jObj.mech.baseloadout ) jObj.mech.baseloadout = {};
                    const listed = jObj.mech.baseloadout.equipment;
                    jObj.mech.baseloadout.equipment = [
                        ...( Array.isArray( listed ) ? listed : listed ? [ listed ] : [] ),
                        {
                            name: { "#text": ( String( enhancement["@_techbase"] ) === "1" ? "(CL) " : "(IS) " ) + "MASC" },
                            type: "equipment",
                            location: enhancementLocations[0],
                        },
                    ];
                } else {
                    const myomer = this._findSSWComponent( "myomer", "myomer", enhancementType, enhancement["@_techbase"] );
                    if( myomer && this.setMyomerType( myomer.tag ).tag === myomer.tag ) {
                        this._placeSSWCriticals( enhancementLocations, myomer.tag );
                    }
                    if( myomer ) {
                        this._checkSSWComponentUsed( "myomer", myomer, this.getMyomerType().tag );
                    }
                }
            }

            if( jObj.mech.baseloadout ) {


                // SSW marks Clan CASE on the base loadout; it matters on Inner Sphere-base Mixed Tech designs.
                this._clanCASE = String( jObj.mech.baseloadout.clancase ?? "" ).trim().toUpperCase() === "TRUE";

                if( jObj.mech.baseloadout.equipment && jObj.mech.baseloadout.equipment.length > 0 ) {

                    for( const item of jObj.mech.baseloadout.equipment ) {
                        this._installSSWEquipment( item );
                    }
                    this._applySSWFireControl( jObj.mech.baseloadout );

                    this._calcCriticals();

                    for( const item of this._equipmentList ) {
                        let foundIndex = -1;
                        for( const critItemIndex in this._unallocatedCriticals ) {
                            if( this._unallocatedCriticals[critItemIndex] && this._unallocatedCriticals[critItemIndex].tag === item.tag ) {

                                foundIndex = +critItemIndex;
                                break;
                            }
                        }


                        const success = this.moveCritical(
                            "un",
                            foundIndex,
                            item.allocationLocation ? item.allocationLocation : "un",
                            item.allocationIndex ? item.allocationIndex : -1,
                            item.split_location,
                        );

                        if( !success ) {
                            //TODO: Why is this firing during Alpha Strike build?
                            /*
                            console.warn(
                                "unsuccessful crit allocation",
                                this.getName(),
                                item.name,
                                item.tag,
                                foundIndex,
                                item.allocationLocation,
                                item.allocationIndex,
                                item.criticals,
                                this._unallocatedCriticals,

                            )
                                */
                        }
                        item.location = item.allocationLocation;
                        this._placeSSWSpreadRemainder( item );
                    }

                } else {
                    if( jObj.mech.baseloadout.equipment ) {
                        // a single weapon?!?!
                        this._installSSWEquipment( jObj.mech.baseloadout.equipment );
                        this._applySSWFireControl( jObj.mech.baseloadout );


                        this._calcCriticals();

                        for( const item of this._equipmentList ) {
                            let foundIndex = -1;
                            for( const critItemIndex in this._unallocatedCriticals ) {
                                if( this._unallocatedCriticals[critItemIndex] && this._unallocatedCriticals[critItemIndex].tag === item.tag ) {
                                    foundIndex = +critItemIndex;
                                    break;
                                }
                            }

                            this.moveCritical(
                                "un",
                                foundIndex,
                                item.allocationLocation ? item.allocationLocation : "un",
                                item.allocationIndex ? item.allocationIndex : -1,
                                item.split_location,
                            );

                            item.location = item.allocationLocation;
                            // A lone spread item's other slots, as in the list above.
                            this._placeSSWSpreadRemainder( item );
                        }
                    }
                }

                this._installSSWLocatedSystems( jObj.mech.baseloadout );
                this._installSSWCockpitSystems( jObj.mech.cockpit?.type );
                // The Small, Torso-Mounted and Interface cockpits replace a BattleMech's standard cockpit (TM p.52;
                // TO:AUE p.112; IO:AE p.110); an IndustrialMech mounts its own (TM p.69), so SSW's choice cannot be kept (#46).
                if( this.isIndustrialMech() && ( this._smallCockpit || this._torsoMountedCockpit || this._interfaceCockpit ) ) {
                    this._sswImportErrors.push( "Cannot mount a " + ( this._smallCockpit ? "Small" : this._torsoMountedCockpit ? "Torso-Mounted" : "Interface" )
                        + " Cockpit on an IndustrialMech (TM p.69)" );
                }

                if( jObj.mech.baseloadout.heatsinks ) {

                    const heatSinkType = this._findSSWComponent( "heatSink", "heat sink", jObj.mech.baseloadout.heatsinks["type"] );
                    if( heatSinkType ) {
                        this.setHeatSinksType( heatSinkType.tag );
                        this._checkSSWComponentUsed( "heatSink", heatSinkType, this.getHeatSinksType() );
                    }

                    // The file gives the total; the engine brings some of them free (TM p.71).
                    this.setAdditionalHeatSinks( Math.max( 0, (+ jObj.mech.baseloadout.heatsinks["@_number"] ) - this.getFreeHeatSinks() ) );

                    if( typeof(  jObj.mech.baseloadout.heatsinks.location ) === "object" ) {
                        this._calcCriticals();

                        try {
                            for( const loc of ( [] as any[] ).concat( jObj.mech.baseloadout.heatsinks.location ?? [] ) ) {
                                let foundIndex = -1;


                                    for( const critItemIndex in this._unallocatedCriticals ) {
                                        if( this._unallocatedCriticals[critItemIndex] && this._unallocatedCriticals[critItemIndex].tag === "heat-sink" ) {
                                            foundIndex = +critItemIndex;
                                            break;
                                        }
                                    }


                                if( foundIndex > -1 ) {

                                    this.moveCritical(
                                        "un",
                                        foundIndex,
                                        loc["#text"] ? this._sswCriticalLocation( String( loc["#text"] ) ) : "un",
                                        loc["@_index"] ? +loc["@_index"] : -1,
                                    );
                                }


                            }
                        }

                        catch {
                            let foundIndex = -1;


                            for( const critItemIndex in this._unallocatedCriticals ) {
                                if( this._unallocatedCriticals[critItemIndex] && this._unallocatedCriticals[critItemIndex].tag === "heat-sink" ) {
                                    foundIndex = +critItemIndex;
                                    break;
                                }
                            }


                            if( foundIndex > -1 ) {
                                this.moveCritical(
                                    "un",
                                    foundIndex,
                                    jObj.mech.baseloadout.heatsinks.location["#text"] ? jObj.mech.baseloadout.heatsinks.location["#text"].toLowerCase().trim() : "un",
                                    jObj.mech.baseloadout.heatsinks.location["@_index"] ? +jObj.mech.baseloadout.heatsinks.location["@_index"] : -1,
                                );
                            }

                        }
                    }

                }


                if( jObj.mech.baseloadout.jumpjets ) {

                    const jumpJetNumber = jObj.mech.baseloadout.jumpjets["@_number"];
                    this.setJumpSpeed(jumpJetNumber);
                    this._calcCriticals();

                    if( jObj.mech.baseloadout.jumpjets.type ) {
                        const jumpJetType = this._findSSWComponent( "jumpJet", "jump jet", jObj.mech.baseloadout.jumpjets.type );
                        if( jumpJetType ) {
                            this.setJumpJetType( jumpJetType.tag );
                            this._checkSSWComponentUsed( "jumpJet", jumpJetType, this.getJumpJetType().tag );
                            this._calcCriticals();
                        }
                    }
                    const jjType = "jj-" + this.getJumpJetType().tag;

                    for( const loc of ( [] as any[] ).concat( jObj.mech.baseloadout.jumpjets.location ?? [] ) ) {
                        let foundIndex = -1;

                        for( const critItemIndex in this._unallocatedCriticals ) {
                            if( this._unallocatedCriticals[critItemIndex] && this._unallocatedCriticals[critItemIndex].tag === jjType ) {
                                foundIndex = +critItemIndex;
                                break;
                            }
                        }

                        if( foundIndex > -1 ) {
                            this.moveCritical(
                                "un",
                                foundIndex,
                                loc["#text"] ? this._sswCriticalLocation( String( loc["#text"] ) ) : "un",
                                loc["@_index"] ? +loc["@_index"] : -1,
                            );
                        }

                    }
                }

                if( jObj.mech.baseloadout.info ) {

                }

                if( jObj.mech.baseloadout.source ) {

                }
            }

            // Patchwork slots take the slots the placed equipment leaves free, so their types come last.
            if( this.isPatchworkArmor() && jObj.mech.armor ) this._importSSWPatchworkTypes( jObj.mech.armor );
            if( jObj.mech.baseloadout?.armored_locations ) this._importSSWArmoredLocations( jObj.mech.baseloadout.armored_locations.location );

            this._importSSWTechnicalReadout( jObj.mech );

            // The file gives the base chassis' total heat sinks; the engine brings some of them free (TM p.71).
            const omniBase = this._omnimech ? jObj.mech.omnibase : undefined;
            this._omniBaseHeatSinks = omniBase ? Math.max( 0, ( +omniBase["@_heatsinks"] || 0 ) - this.getFreeHeatSinks() ) : undefined;
            this._omniBaseJumpSpeed = omniBase ? +omniBase["@_jumpjets"] || 0 : undefined;

            this._calc();
            this.calcAlphaStrike();

            if( this._unallocatedCriticals && this._unallocatedCriticals.length > 0 ) {
                this.sswImportErrors.push("Unallocated Criticals: " + this._unallocatedCriticals.length);
                for( const crit of this._unallocatedCriticals ) {
                    this.sswImportErrors.push("- " + crit.name + " (" + crit.tag + ")");
                }

            }
        }
    }

    /** Replaces the TRO fields with what the SSW file holds: production, component and weapon makes, and the fluff text. */
    private _importSSWTechnicalReadout( mech: unknown ): void {
        this.tro.import( readSSWTechnicalReadout( mech ) );
        const adapter = getBattleMechTroAdapter( this );
        this.tro.applyImportedCopyMakes( this._sswCopyMakes, adapter.getEquipmentCopies(), copy => adapter.ensureEquipmentUuid( copy ) );
    }

    public get sswImportErrors(): string[] {
        return this._sswImportErrors;
    }

    /** What the last SSW import could not resolve to any record (see ISSWUnresolvedItem). */
    public getSSWUnresolved(): ISSWUnresolvedItem[] {
        return this._sswUnresolved;
    }

    /** Which slots of a location (SSW code: "hd", "ct", "lt", ...) hold something; [] for an unknown location. */
    /**
     * Custom drafts this design uses whose stats are not all entered yet, by name: its BV, heat and cost are not
     * reliable until they are (unknown stats count as 0).
     */
    public getIncompleteCustomStats(): string[] {
        if( !hasIncompleteCustomContent() ) return [];
        // The installed items and components, without export(): this runs on every status-bar render.
        return findIncompleteCustomContent( JSON.stringify( [
            this._equipmentList.map( ( item ) => item?.tag ),
            this.getArmorType(), this.getArmorObj(), this.getInternalStructureType(), this.getGyro(), this.getEngine(),
            this.getJumpJetType(), this.getMyomerType(), this.getHeatSinksType(), this.getHeatSinksObj(),
        ] ) );
    }

    public getCriticalOccupancy( sswLocation: string ): boolean[] {
        const keys: Record<string, string> = {
            hd: "head", ct: "centerTorso", lt: "leftTorso", rt: "rightTorso", la: "leftArm", ra: "rightArm",
            ll: "leftLeg", rl: "rightLeg", cl: "centerLeg", fll: "frontLeftLeg", frl: "frontRightLeg",
        };
        const slots = ( this.getCriticals() as unknown as Record<string, unknown> )[ keys[ sswLocation.toLowerCase().trim() ] ?? "" ];
        return Array.isArray( slots ) ? slots.map( ( slot ) => !!slot ) : [];
    }



    public getTotalBVFrontWeapons(): number {
        return this._totalTorsoHeadLegWeaponBV(false);
    }

    /**
     * Unmodified BV of the torso-, leg- and head-mounted weapons firing forward or to the rear (TM p.303), or in a turret, each
     * in its firing arc location: no fire control, targeting computer or other modifier.
     */
    private _totalTorsoHeadLegWeaponBV(arc: boolean | "turret"): number {
        const catalog = () => getEquipmentCatalogDefinitions().flatMap(definition => definition.equipment);
        let rv = 0;
        for( const eq of this._equipmentList ) {
            const inArc = arc === "turret" ? this.isTurretMounted(eq) : !!eq.rear === arc && !this.isTurretMounted(eq);
            if( !inArc || this.isNotOnTorsoHeadOrLegs(this._firingArcLocation(eq)) ) continue;
            if( eq.isAmmo || this._isDefensiveBVEquipment(eq) ) continue;
            rv += getLauncherBattleValueWithoutFireControl(eq, catalog, this._tech.tag);
        }
        return rv;
    }

    /**
     * Where a weapon fires from. One split between two locations "receives the more restrictive firing arc of the
     * two": an AC/20 in a torso and an arm "uses the torso arc, not the arm arc" (TM p.57).
     */
    private _firingArcLocation(item: IEquipmentItem): string | undefined {
        if( !item.uuid || !item.location ) return item.location;
        for( const loc of ["lt", "rt", "ct"] ) {
            if( loc !== item.location && this.getCriticalsForLocation(loc).some(slot => slot && slot.uuid === item.uuid) ) return loc;
        }
        return item.location;
    }

    public isNotOnTorsoHeadOrLegs(
        loc: string | undefined
    ): boolean {

        if(
            loc
            &&
            (
                loc === "ct"
                ||
                loc === "lt"
                ||
                loc === "rt"
                ||
                loc === "rl"
                ||
                loc === "ll"
                ||
                loc === "hd"
                ||
                loc === "frl"
                ||
                loc === "fll"
                ||
                loc === "cl"
            )
        ) {
            return false
        }
        return true;
    }
    public getTotalBVRearWeapons(): number {
        return this._totalTorsoHeadLegWeaponBV(true);
    }

    private _getToLocationFromTag(
        fromLocation: string,
    ): ICriticalSlot[] {


        if( fromLocation === "un" ) {
            return this._unallocatedCriticals;
        } else if( fromLocation === "hd" ) {

            return this._criticals.head;

        } else if( fromLocation === "ct" ) {
            return this._criticals.centerTorso;
        } else if( fromLocation === "rt" ) {
            return this._criticals.rightTorso;

        } else if( fromLocation === "ra" ) {

            return this._criticals.rightArm;

        } else if( fromLocation === "rl" ) {

            return this._criticals.rightLeg;

        } else if( fromLocation === "frl" ) {

            return this._criticals.frontRightLeg;

        } else if( fromLocation === "fll" ) {

            return this._criticals.frontLeftLeg;

        } else if( fromLocation === "cl" ) {

            return this._criticals.centerLeg;

        } else if( fromLocation === "lt" ) {

            return this._criticals.leftTorso;

        } else if( fromLocation === "la" ) {

            return this._criticals.leftArm;

        } else if( fromLocation === "ll" ) {

            return this._criticals.leftLeg;

        }

        return this._unallocatedCriticals;

    }

    public criticalCanBePlaced(
        toLocTag: string,
        toSize: number,
        toIndex: number,
        fromItem: ICriticalSlot | null,
    ): boolean {
        // Step One check to see if TO has enough slots for item....
        let hasSpace = true;

        const toLocation = this._getToLocationFromTag( toLocTag );

        if( toIndex === -1 ) {

            for( let itemIndex = 0; itemIndex < toLocation.length; itemIndex++ ) {

                if( toLocation[itemIndex] === null || typeof(toLocation[itemIndex]) === "undefined" ) {

                    toIndex = +itemIndex;
                    break;
                }

            }
            if( toIndex === -1 ) {

                if( toLocation.length < this.getLocationSlotCount( toLocTag ) ) {
                    toIndex = toLocation.length - 1;
                }
            }
        }

        if( toLocation.length < toIndex + toSize || toIndex < 0)
            return false;

        for( let testC = 0; testC < toSize; testC++) {
            if(
                toLocation[toIndex + testC]
            ) {
                if( fromItem ) {
                    if( toLocation[toIndex + testC].uuid !== fromItem.uuid ) {

                    } else {
                        hasSpace = false;
                    }

                } else {
                    hasSpace = false;
                }

            }
        }
        return hasSpace;
    }

}

export interface IClusterHit {
    location: string;
    damage: number;
    critical: boolean;
  }



function sortByLocationThenName( a: IEquipmentItem, b: IEquipmentItem ) {
    if( a.location && b.location && a.location > b.location )
        return 1;
    if( a.location && b.location && a.location < b.location )
        return -1;
    if( a.name > b.name )
        return 1;
    if( a.name < b.name )
        return -1;
    return 0;
}

export interface IMechDamageAllocation {
    head: boolean[],
    centerTorso: boolean[],
    rightTorso: boolean[],
    leftTorso: boolean[],
    leftArm: boolean[],
    rightArm: boolean[],
    leftLeg: boolean[],
    rightLeg: boolean[],

    rightTorsoRear: boolean[],
    centerTorsoRear: boolean[],
    leftTorsoRear: boolean[],

   frontRightLeg: boolean[],
   frontLeftLeg: boolean[],
   centerLeg: boolean[],
}

export interface IMechDamageLog {
    turn: number;
    location: string;
    rear: boolean;
    amount: number;
    damageResults: IDamageResults[];
}

export interface IDamageResults {
    criticals: number;
    criticalRoll: number;
    criticalEffects: string[];
    location: string;
    amount: number;
}