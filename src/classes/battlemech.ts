import { battlemechLocations } from "../data/battlemech-locations";
import { IArmorType, ICriticalLocations, IEngineOption, IEngineType, IEquipmentItem, IGyro, IHeatSync, IInternalStructurePerTon, IResolvedInternalStructure, ISplitLocation } from "../data/data-interfaces";
import { btEraOptions } from "../data/era-options";
import { mechArmorTypes } from "../data/mech-armor-types";
import { getEquipmentListByTech } from "../data/equipment-registry";
import { mechEngineOptions } from "../data/mech-engine-options";
import { mechEngineTypes } from "../data/mech-engine-types";
import { mechGyroTypes } from "../data/mech-gyro-types";
import { mechHeatSinkTypes } from "../data/mech-heat-sink-types";
import { mechInternalStructureTypes } from "../data/mech-internal-structure-types";
import { mechJumpJetTypes } from "../data/mech-jump-jet-types";
import { mechTypeOptions } from "../data/mech-type-options";
import { btTechOptions } from "../data/tech-options";
import { getHexDistanceFromModifier, getMovementModifier } from "../utils";
import { addCommas } from "../utils/addCommas";
import { adjustAlphaStrikeDamage, calculateAlphaStrikeValue, IAlphaStrikeExport } from "../utils/calculateAlphaStrikeValue";
import { generateUUID } from "../utils/generateUUID";
import { ISSWBasicInfo } from "../utils/getSSWXMLBasicInfo";
import { XMLParser } from "fast-xml-parser";
import { AlphaStrikeUnit, IAlphaStrikeDamage, IASMULUnit } from "./alpha-strike-unit";
import Pilot, { IPilot } from "./pilot";

interface IWeights {
    name: string;
    weight: number;
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
}
export interface IBattleMechExport {

    // in play variables

    selectedMech?: boolean;
    currentMovementMode?: string;
    currentToHitMovementModifier?: number;
    currentTargetModifier?: number;
    currentTargetJumpingMP?: number;
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

    // basic properties
    omnimech: boolean;
    additionalHeatSinks: number;
    allocation: ICriticalSlot[],
    armor_allocation: IArmorAllocation,
    armor_type: string;
    armor_weight: number;
    as_role: string;
    as_value: number;   // for easy listing
    battle_value: number;     // for easy listing
    c_bills: string;  // for easy listing
    engineType: string;
    equipment: IBMEquipmentExport[],
    era: string;
    features: string[],
    gyro: string;
    heat_sink_type: string;
    hideNonAvailableEquipment: boolean;
    introductoryRules?: boolean;
    is_type: string;
    jumpSpeed: number;
    lastUpdated: Date;
    location?: string;
    mechType: string;
    mirrorArmorAllocations: boolean;
    model: string;
    name: string;
    nickname: string;
    strictEra: boolean;
    tech: string;
    tech_label: string;  // for easy listing
    tonnage: number;
    uuid: string;
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

    private _introductoryRules: boolean = false;

    public basicSSWInfo: ISSWBasicInfo | null = null;

    // in play variables
    public selectedMech: boolean = false;

    public lastUpdated = new Date();
    public currentMovementMode: string = "n";
    public currentToHitMovementModifier: number = 0;
    public currentTargetModifier: number = 0;
    public currentTargetJumpingMP: number = 0;
    public currentHeat: number = 0;
    public damageLog: IMechDamageLog[] = [];
    public criticalDamage: Record<string, number[]> = {};

    // basic properties
    private _nickname = "";
    private _lastUpdated: Date = new Date();
    private _uuid: string = generateUUID();

    private _mechType = mechTypeOptions[0];
    private _tech = btTechOptions[0];
    private _era = btEraOptions[1]; // Default to Succession Wars
    private _model: string = "";
    private _name: string = "";
    private _tonnage = 20;
    private _hideNonAvailableEquipment: boolean = true;
    private _currentTonnage = 0;

    private _mirrorArmorAllocations: boolean = true;

    private _armorType = mechArmorTypes[0];

    private _maxArmor: number = 0;

    private _selectedInternalStructure = mechInternalStructureTypes[0];

    private _hasTripleStrengthMyomer: boolean = false;
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
    private _cockpitWeight: number = 3;
    private _totalInternalStructurePoints = 0;
    private _maxMoveHeat: number = 2;
    private _maxWeaponHeat: number = 0;
    private _heatDissipation: number = 0;
    private _additionalHeatSinks: number = 0;
    private _armorWeight: number = 0;
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
    private _defensiveBattleRating = 0;
    private _offensiveBattleRating = 0;
    private _pilotAdjustedBattleValue = 0;
    private _alphaStrikeValue = 0;

    private _calcLogBV = "";
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
        this._criticalAllocationTable = [];
        this._calc();
    }

    public newUUID() {
        this._uuid = generateUUID();
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
            if( typeTag === mechTypeOptions[lcounter].tag) {
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
        let rv: IGATOR = {
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
        for( let crit of this._criticalAllocationTable ) {
            if( crit.loc === loc ) {
                if( crit.tag === "case" ) {
                    return true;
                }
            }
        }
        return false;
    }

    private _calcBattleValue(): void {
        let hasCamo = false;
        let hasBasicStealth = false;
        let hasPrototypeStealth = false;
        let hasStandardStealth = false;
        let hasImprovedStealth = false;
        let hasMimetic = false;
        this._battleValue = 0;
        this._calcLogBV = "";
        /* *************************************************************************
        * STEP 1: CALCULATE DEFENSIVE BATTLE RATING - TechManual p. 302
        * *********************************************************************** */
        this._calcLogBV += "<strong>STEP 1: CALCULATE DEFENSIVE BATTLE RATING - TM p302</strong><br />";
        // 1A. Total Armor Factor Valuation (TM p. 302)
        let totalArmorFactor = 2.5 * this.getTotalArmor();
        this._calcLogBV += `Total Armor Factor = Armor Factor x 2.5: ${totalArmorFactor} = 2.5 x ${this.getTotalArmor()}<br />`;
        if (this._armorType.tag === "commercial") {
            totalArmorFactor *= 0.5;
            this._calcLogBV += `Total Armor Factor = 0.5 * Modifier for Commercial Armor: ${totalArmorFactor}<br />`;
        } else {
            this._calcLogBV += `Total Armor Factor = 1.0 * Modifier for Non-Commercial Armor: ${totalArmorFactor}<br />`;
        }
        // 1B. Internal Structure Points Valuation (TM p. 302)
        let totalInternalStructurePoints = 1.5 * this._totalInternalStructurePoints;
        this._calcLogBV += `Total Internal Structure Points = IS Points x 1.5: ${totalInternalStructurePoints} = 1.5 x ${this._totalInternalStructurePoints}<br />`;
        if (this.getInternalStructureType() === "industrial") {
            totalInternalStructurePoints *= 0.5;
            this._calcLogBV += `Total Internal Structure BV = 0.5 x Industrial Modifier: ${totalInternalStructurePoints}<br />`;
        } else {
            this._calcLogBV += `Total Internal Structure BV = 1.0 x Standard/Endo-Steel Modifier: ${totalInternalStructurePoints}<br />`;
        }
        // 1C. Adjust Internal Structure for Engine Type Safety Factor (TM p. 302 / Errata)
        const engineTag = this._engineType.tag;
        let engineModifier = 1.0;
        switch (engineTag) {
            case "light":
            case "xl":
            case "clan_xl":
                engineModifier = 0.75;
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
        totalInternalStructurePoints *= engineModifier;
        this._calcLogBV += `Engine Modification (${engineTag}) = ${engineModifier}x. Total IS BV: ${totalInternalStructurePoints}<br />`;
        // 1D. Gyro Points Modifier (TM p. 302)
        const gyroType = this.getGyro().tag;
        let gyroModifier = 0.5;
        if (gyroType === "heavy-duty") {
            gyroModifier = 1.0;
        }
        let totalGyroPoints = this.getTonnage() * gyroModifier;
        this._calcLogBV += `Total Gyro BV = ${gyroModifier} x Tonnage for ${gyroType} Gyro: ${totalGyroPoints} = ${gyroModifier} x ${this.getTonnage()}<br />`;
        // 1E. Get Explosive Ammo Modifiers (TM pp. 302-303)
        let explosiveAmmoModifiers = 0;
        this._calcLogBV += "<strong>Get Explosive Ammo Modifiers (TM p302-303)</strong><br />";
        // Build automated CASE enablement profile array cleanly using static map
        const caseMap: Record<string, boolean> = {};
        const validLocations = Object.keys(BattleMech.MECH_LOCATION_MAP);
        validLocations.forEach(locShorthand => {
            caseMap[locShorthand] = false; 
            const longKey = BattleMech.MECH_LOCATION_MAP[locShorthand];
            const critArray: any[] = (this._criticals as any)[longKey] || [];
            for (let lCrit = 0; lCrit < critArray.length; lCrit++) {
                if (critArray[lCrit] && critArray[lCrit].tag === "case") {
                    caseMap[locShorthand] = true;
                    break;
                }
            }
        });
        // 1F. Technology-Based Critical Evaluation (Clan vs Inner Sphere Rulesets)
        if (this._tech.tag === "clan" || this._tech.tag === "mclan") {
            const clanVulnerableShorthands = ["hd", "ct", "ll", "rl", "cl", "fll", "frl"];
            clanVulnerableShorthands.forEach(loc => {
                const longKey = BattleMech.MECH_LOCATION_MAP[loc];
                const critArray: any[] = (this._criticals as any)[longKey] || [];
                critArray.forEach((item) => {
                    if (item && item.obj) {
                        if (item.obj.explosive) {
                            this._calcLogBV += `Explosive Ammo Crit in ${longKey} (Clan, -15)<br />`;
                            explosiveAmmoModifiers += 15;
                        }
                        if (item.obj.gauss) {
                            this._calcLogBV += `Gauss Crit in ${longKey} (Clan, -1)<br />`;
                            explosiveAmmoModifiers += 1;
                        }
                    }
                });
            });
        } else {
            // Inner Sphere / Mixed IS Base processing loop parameters
            const isXLEngineActive = this.hasXLEngine();
            const isShorthands = ["hd", "ct", "lt", "rt", "la", "ra", "ll", "rl", "cl", "fll", "frl"];
            isShorthands.forEach(loc => {
                const longKey = BattleMech.MECH_LOCATION_MAP[loc];
                const critArray: any[] = (this._criticals as any)[longKey] || [];
                if (critArray.length === 0) return; 
                let isLocationProtected = false;
                if (loc === "lt" || loc === "rt") {
                    isLocationProtected = caseMap[loc] && !isXLEngineActive;
                } else if (loc === "la" || loc === "fll" || loc === "ll") {
                    isLocationProtected = caseMap["lt"];
                } else if (loc === "ra" || loc === "frl" || loc === "rl") {
                    isLocationProtected = caseMap["rt"];
                } else if (loc === "cl") {
                    isLocationProtected = caseMap["ct"];
                } else {
                    isLocationProtected = false; 
                }
                critArray.forEach((item) => {
                    if (!item || !item.obj) return;
                    if (item.obj.explosive) {
                        if (isLocationProtected) {
                            this._calcLogBV += `Explosive Ammo in ${longKey} protected by CASE. Penalty negated (0).<br />`;
                        } else {
                            this._calcLogBV += `Explosive Ammo Crit in ${longKey} (Inner Sphere, -15)<br />`;
                            explosiveAmmoModifiers += 15;
                        }
                    }
                    if (item.obj.gauss) {
                        if (isLocationProtected) {
                            this._calcLogBV += `Gauss Component in ${longKey} protected by CASE. Penalty negated (0).<br />`;
                        } else {
                            this._calcLogBV += `Gauss Crit in ${longKey} (Inner Sphere, -1)<br />`;
                            explosiveAmmoModifiers += 1;
                        }
                    }
                });
            });
        }
        // =====================================================================
        // 1G. COMPILE DEFENSIVE SUBTOTAL (TM p. 303)
        // =====================================================================
        let defensiveSubtotal = totalArmorFactor + totalInternalStructurePoints + totalGyroPoints - explosiveAmmoModifiers;
        this._calcLogBV += `Defensive Subtotal (Armor + IS + Gyro - Ammo Penalties): ${defensiveSubtotal} = ${totalArmorFactor} + ${totalInternalStructurePoints} + ${totalGyroPoints} - ${explosiveAmmoModifiers}<br />`;
        /* *************************************************************************
         * STEP 2: CALCULATE DEFENSIVE FACTOR MODIFIER & STEALTH GEAR - TM p. 304
         * *********************************************************************** */
        this._calcLogBV += "<strong>STEP 2: CALCULATE DEFENSIVE FACTOR MODIFIER - TM p304</strong><br />";
        // 2A. Gather movement metrics using native speed methods
        const runSpeed = this.getRunSpeed();
        const jumpSpeed = this.getJumpSpeed();
        const runModifier = getMovementModifier(runSpeed);
        const jumpModifier = getMovementModifier(jumpSpeed) + 1; // Jumping modifier bonus (TM p. 304)
        // Determine the optimal Target Movement Modifier (TMM)
        let moveModifier = Math.max(runModifier, jumpModifier);
        this._calcLogBV += `Best Base TMM: ${moveModifier} (Run TMM: ${runModifier}, Jump TMM: ${jumpModifier})<br />`;
        // Calculate baseline Defensive Factor Modifier
        let defensiveFactorModifier = 1 + (moveModifier / 10);
        if (defensiveFactorModifier < 1.0) {
            defensiveFactorModifier = 1.0;
        }
        this._calcLogBV += `Base Defensive Factor (1 + TMM / 10): ${defensiveFactorModifier.toFixed(2)} = 1 + ${moveModifier} / 10<br />`;
        // 2B. Process Defensive Factor Modifiers for Stealth and Advanced Camouflage Systems
        this._calcLogBV += "<strong>Defensive Factor Modifiers for Stealth / Advanced Electronic Systems</strong><br />";
        // Standard & Advanced Systems (Tactical Operations p. 342)
        if (hasCamo) {
            defensiveFactorModifier += 0.2;
            this._calcLogBV += "Applied Standard Camouflage Shielding (+0.20)<br />";
        }
        if (hasBasicStealth || hasPrototypeStealth || hasStandardStealth) {
            defensiveFactorModifier += 0.2;
            this._calcLogBV += "Activated Electronic/Standard Stealth Armor Matrix (+0.20)<br />";
        }
        if (hasImprovedStealth) {
            defensiveFactorModifier += 0.3;
            this._calcLogBV += "Activated Advanced Improved Stealth Suite (+0.30)<br />";
        }
        if (hasMimetic) {
            defensiveFactorModifier += 0.3;
            this._calcLogBV += "Activated Active Mimetic Light Polarization Layering (+0.30)<br />";
        }
        // -------------------------------------------------------------------------
        // FUTURE LEVEL 5 EXPANSION APOCRYPHAL HOOKS (Commented out for baseline accuracy)
        // -------------------------------------------------------------------------
        // if (this.hasEquipment("null_signature")) {
        //     defensiveFactorModifier += 0.2;
        //     this._calcLogBV += "Activated Null Signature System (NSS) Visual Shroud (+0.20)<br />";
        // }
        // if (this.hasEquipment("chameleon_frame") || this.hasEquipment("clps")) {
        //     defensiveFactorModifier += 0.2;
        //     this._calcLogBV += "Activated Chameleon Light Polarization Shielding (CLPS) (+0.20)<br />";
        // }
        // if (this.hasEquipment("poly_fullerene_reactive")) {
        //     this._calcLogBV += "Detected Poly-Fullerene Reactive Armor (PFRA) Signal Dampening Fields<br />";
        // }
        // 2C. Apply the defensive factor to the defensive subtotal (TM p. 303)
        let finalDefensiveBattleRating = defensiveSubtotal * defensiveFactorModifier;
        this._calcLogBV += `Final Defensive Rating Calculation = DBR Subtotal * Defensive Factor: ${finalDefensiveBattleRating.toFixed(2)} = ${defensiveSubtotal.toFixed(2)} x ${defensiveFactorModifier.toFixed(2)}<br />`;
        // Canonical Floor Check Rule Enforced (TM p. 303: "Minimum rating threshold of 1")
        if (finalDefensiveBattleRating < 1.0) {
            finalDefensiveBattleRating = 1.0;
            this._calcLogBV += "Final Defensive Battle Rating dropped below threshold. Enforcing canonical minimum floor: 1.0<br />";
        } else {
            this._calcLogBV += `Final Defensive Battle Rating (Subtotal x Defensive Factor): ${finalDefensiveBattleRating.toFixed(2)} = ${defensiveSubtotal.toFixed(2)} x ${defensiveFactorModifier.toFixed(2)}<br />`;
        }
        // Lock down the tracking properties safely
        this._defensiveBattleRating = finalDefensiveBattleRating;
        this._calcLogBV += `<strong>Final Defensive Battle Rating</strong>: ${this._defensiveBattleRating.toFixed(2)}<br />`;
        
                /* *************************************************************************
         * STEP 3: CALCULATE OFFENSIVE BATTLE RATING - TechManual p. 303
         * *********************************************************************** */
        this._calcLogBV += "<strong>STEP 3: CALCULATE OFFENSIVE BATTLE RATING - TM p303</strong><br />";

        const ammoBV: Record<string, number> = {};
        const weaponBV: Record<string, number> = {};
        let totalAmmoBV = 0;

        // 3A. Inventory Scan & Base Value Distribution (TM p. 303)
        for (let eqC = 0; eqC < this._equipmentList.length; eqC++) {
            const currentItem = this._equipmentList[eqC];
            const baseValue = currentItem.battleValue || 0;

            // Differentiate ammunition bins using absolute explicit tag boundaries
            if (currentItem.tag.startsWith("ammo-")) {
                if (!ammoBV[currentItem.tag]) {
                    ammoBV[currentItem.tag] = 0;
                }
                // Ammunition BV = Base Ammo Item Value x Tonnage Mass (TM p. 303)
                const assignedAmmoValue = baseValue * currentItem.weight;
                ammoBV[currentItem.tag] += assignedAmmoValue;

                this._calcLogBV += `+ Adding Ammunition: ${currentItem.name} (${currentItem.location}) = ${assignedAmmoValue.toFixed(2)} (${baseValue} BV x ${currentItem.weight} tons)<br />`;
            } else {
                // Accumulate weapon totals to handle duplicate weapons correctly for the Excessive Ammo Cap
                if (!weaponBV[currentItem.tag]) {
                    weaponBV[currentItem.tag] = 0;
                }
                weaponBV[currentItem.tag] += baseValue;
            }
        }

        // 3B. Map and Simplify Ammunition to Parent Weapon Structures
        const simplifiedAmmoBV: Record<string, number> = {};
        for (const weaponKey in weaponBV) {
            // Standard ammo tags follow the layout pattern: "ammo-weapon_tag"
            const matchingAmmoTag = `ammo-${weaponKey}`;
            if (ammoBV[matchingAmmoTag]) {
                simplifiedAmmoBV[weaponKey] = ammoBV[matchingAmmoTag];
            }
        }

        // 3C. Enforce Excessive Ammunition Rule Cap (TM p. 303)
        for (const ammoKey in simplifiedAmmoBV) {
            if (weaponBV[ammoKey]) {
                const totalAllowedCap = weaponBV[ammoKey];
                if (simplifiedAmmoBV[ammoKey] > totalAllowedCap) {
                    this._calcLogBV += `<strong>Excessive Ammunition Rule Triggered:</strong> Combined ammo BV for ${ammoKey} (${simplifiedAmmoBV[ammoKey].toFixed(2)}) exceeds weapon group total (${totalAllowedCap.toFixed(2)}). Capping value to match.<br />`;
                    simplifiedAmmoBV[ammoKey] = totalAllowedCap;
                }
                totalAmmoBV += simplifiedAmmoBV[ammoKey];
            }
        }

        this._calcLogBV += `<strong>Total Capped Ammo BV:</strong> ${totalAmmoBV.toFixed(2)}<br />`;

        // 3D. Engine Thermal Dissipation Capacity Evaluation (TM p. 303)
        let mechHeatEfficiency = 6; // Baseline structural buffer
        const sinkEfficiencyMultiplier = this.getHeatSinksType() === "double" ? 2 : 1;
        
        // Total Heat Dissipation Capacity = 6 + Total Dissipation Points - Max Movement Heat
        mechHeatEfficiency += (this.getHeatSinks() * sinkEfficiencyMultiplier) - this.getMaxMovementHeat();
        
        this._calcLogBV += `<strong>Heat Efficiency Capacity Pool:</strong> ${mechHeatEfficiency} (6 + Engine Sinks: ${this.getHeatSinks() * sinkEfficiencyMultiplier} - Movement Heat: ${this.getMaxMovementHeat()})<br />`;
        this._calcLogBV += "<strong>Total Weapon Heat Breakdown:</strong> ";

        // 3E. Weapon Heat Multiplier Mapping (TM p. 303 / Errata updates)
        let totalWeaponHeat = 0;
        const heatLogFragments: string[] = [];

        // Sort weapon assets using prioritized combat sorting logic
        this._equipmentList.sort((a, b) => sortByAdjustedBVThenHeat(a, b, this));

        for (let eqC = 0; eqC < this._equipmentList.length; eqC++) {
            const currentItem = this._equipmentList[eqC];
            if (currentItem.tag.startsWith("ammo-")) continue;

            let baseHeat = currentItem.heat || 0;

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

        this._calcLogBV += heatLogFragments.length > 0 ? heatLogFragments.join(" + ") : "0";
        this._calcLogBV += ` = ${totalWeaponHeat.toFixed(2)}<br />`;

        // 3F. Dynamic Weapon Arc & Thermal Efficiency Splitting Loop (TM pp. 303-304)
        let runningTotal = 0;
        let runningHeat = 0;
        let inHalfCost = false;

        for (let weaponC = 0; weaponC < this._equipmentList.length; weaponC++) {
            const currentItem = this._equipmentList[weaponC];
            if (currentItem.tag.startsWith("ammo-")) continue;

            const baseBV = currentItem.battleValue || 0;
            const weaponHeat = currentItem.bvHeat || 0;
            let finalWeaponMultiplier = 1.0;

            // Resolve explicit firing arc boundaries
            const isRearDominant = this.getTotalBVFrontWeapons() < this.getTotalBVRearWeapons();
            const isFlexibleLimb = this.isNotOnTorsoHeadOrLegs(currentItem.location);
            const waiveRearPenalty = isRearDominant || isFlexibleLimb;

            if (currentItem.rear) {
                if (waiveRearPenalty) {
                    this._calcLogBV += `+ Adding Rear Weapon ${currentItem.name} (${currentItem.location || "no location"}) - Base BV: ${baseBV} (Rear penalty waived), Heat: ${weaponHeat}<br />`;
                } else {
                    this._calcLogBV += `+ Adding Rear Weapon ${currentItem.name} (${currentItem.location || "no location"}) - Base BV: ${baseBV} halved due to Rear Arc: ${baseBV / 2}, Heat: ${weaponHeat}<br />`;
                    finalWeaponMultiplier *= 0.5;
                }
            } else {
                if (!waiveRearPenalty && this.getTotalBVFrontWeapons() < this.getTotalBVRearWeapons()) {
                    this._calcLogBV += `+ Adding Front Weapon ${currentItem.name} (${currentItem.location || "no location"}) - Base BV: ${baseBV} halved due to Rear Dominance: ${baseBV / 2}, Heat: ${weaponHeat}<br />`;
                    finalWeaponMultiplier *= 0.5;
                } else {
                    this._calcLogBV += `+ Adding Front Weapon ${currentItem.name} (${currentItem.location || "no location"}) - Base BV: ${baseBV}, Heat: ${weaponHeat}<br />`;
                }
            }

            // Apply Heat Inefficiency Half-Cost Rules (TM p. 304)
            if (totalWeaponHeat >= mechHeatEfficiency) {
                if (inHalfCost && weaponHeat > 0) {
                    finalWeaponMultiplier *= 0.5;
                    this._calcLogBV += `  [Thermal Penalty: Halved due to running hot] -> Cumulative Item Multiplier: ${finalWeaponMultiplier}<br />`;
                }

                runningHeat += weaponHeat;

                if (!inHalfCost && runningHeat >= mechHeatEfficiency && weaponHeat > 0) {
                    inHalfCost = true;
                    this._calcLogBV += "  (System limit reached: This component consumes the remaining thermal efficiency pool; subsequent weapons will incur a heat penalty.)<br />";
                }
            }

            runningTotal += baseBV * finalWeaponMultiplier;
        }

        // 3G. Finalize Offensive Calculations & Apply TSM Tonnage Modifiers (TM p. 303)
        const totalWeaponBV = runningTotal;
        this._calcLogBV += `<strong>Total Weapon BV:</strong> ${totalWeaponBV.toFixed(2)}<br />`;

        let modifiedMechTonnage = this.getTonnage();

        if (this._hasTripleStrengthMyomer) {
            modifiedMechTonnage *= 1.5; // TSM mass multiplier (TM p. 303)
            this._calcLogBV += `Triple-Strength Myomer (TSM) Active: Tonnage modified by 1.5x -> ${modifiedMechTonnage} tons (Base: ${this.getTonnage()})<br />`;
        } else {
            this._calcLogBV += `Standard Tonnage Applied: ${modifiedMechTonnage} tons<br />`;
        }

        const baseOffensiveRating = totalWeaponBV + totalAmmoBV + modifiedMechTonnage;

        // 3H. Apply Speed Factor Scaling Multiplier (TM p. 304)
        const speedFactorModifier = this._getSpeedFactorModifier();
        const finalOffensiveBattleRating = baseOffensiveRating * speedFactorModifier;

        this._calcLogBV += `<strong>Final Offensive Battle Rating:</strong> ${finalOffensiveBattleRating.toFixed(2)} ` +
            `(${totalWeaponBV.toFixed(2)} [Weapon BV] + ${totalAmmoBV.toFixed(2)} [Ammo BV] + ${modifiedMechTonnage} [Mech Tonnage]) ` +
            `x ${speedFactorModifier.toFixed(4)} [Speed Factor Rating]<br />`;

        this._offensiveBattleRating = finalOffensiveBattleRating;

        /* *************************************************************************
         * STEP 4: CALCULATE FINAL BATTLE VALUE - TechManual p. 304
         * *********************************************************************** */
        this._calcLogBV += "<strong>STEP 4: CALCULATE FINAL BATTLE VALUE - TM p304</strong><br />";

        // Pull verified class values calculated in previous steps
        const currentDBR = this._defensiveBattleRating;
        const currentOBR = this._offensiveBattleRating;
        
        let finalBattleValue = currentDBR + currentOBR;
        this._calcLogBV += `Unmodified Combined BV = Defensive Rating + Offensive Rating: ${finalBattleValue.toFixed(2)} = ${currentDBR.toFixed(2)} + ${currentOBR.toFixed(2)}<br />`;

        // Apply cockpit sizing penalty rules (TM p. 304)
        if (this._smallCockpit) {
            finalBattleValue *= 0.95;
            this._calcLogBV += `Small Cockpit Penalty Applied: Total multiplied by 0.95 -> Intermediate BV: ${finalBattleValue.toFixed(2)}<br />`;
        }

        // Execute absolute rounding to whole integer values (TM p. 304)
        const absoluteRoundedBV = Math.round(finalBattleValue);
        this._calcLogBV += `<strong>Final Unit Battle Value:</strong> ${absoluteRoundedBV} (Rounded from ${finalBattleValue.toFixed(2)})<br />`;
        
        // Commit values into the master class structures
        this._battleValue = absoluteRoundedBV;

        // Trigger secondary tracking updates for personnel/skills assignment
        this._setPilotAdjustedBattleValue();
    }

    /**
     * Applies pilot experience skill tracking multipliers to determine final deployment BV.
     * References the canonical cross-grid lookup matrix from TechManual, p. 305.
     */
    private _setPilotAdjustedBattleValue(): void {
        // Establish the explicit TechManual p. 305 lookup table matrix.
                ///                                GUNNERY: 
        //                                0     1     2     3     4     5     6     7     8
        const PILOT_MULTIPLIER_MATRIX = [
            /* Piloting 0 */           [2.80, 2.56, 2.24, 1.92, 1.60, 1.50, 1.43, 1.36, 1.28],
            /* Piloting 1 */           [2.63, 2.40, 2.10, 1.80, 1.50, 1.35, 1.33, 1.26, 1.19],
            /* Piloting 2 */           [2.45, 2.24, 1.96, 1.68, 1.40, 1.26, 1.19, 1.16, 1.10],
            /* Piloting 3 */           [2.28, 2.08, 1.82, 1.56, 1.30, 1.17, 1.11, 1.04, 1.01],
            /* Piloting 4 */           [2.01, 1.84, 1.61, 1.38, 1.15, 1.04, 0.98, 0.92, 0.86],
            /* Piloting 5 (Base) */    [1.82, 1.60, 1.40, 1.20, 1.00, 0.90, 0.85, 0.80, 0.75]
        ];
        // Fetch raw pilot credentials with safe default constraints
        const gunnery = this._pilot?.gunnery ?? 4;
        const piloting = this._pilot?.piloting ?? 5;
        let skillMultiplier = 1.0;
        // Securely check array boundary limits before querying the lookup index
        if (
            piloting >= 0 && 
            piloting < PILOT_MULTIPLIER_MATRIX.length && 
            gunnery >= 0 && 
            gunnery < PILOT_MULTIPLIER_MATRIX[piloting].length
        ) {
            skillMultiplier = PILOT_MULTIPLIER_MATRIX[piloting][gunnery];
        } else {
            // Fallback warning telemetry if an out-of-bounds custom skill rating is supplied
            this._calcLogBV += `[Pilot Data Alert] Skill rating layout (${gunnery}/${piloting}) falls outside standard matrix boundaries. Defaulting to 1.0x baseline modifier.<br />`;
        }
        // Calculate finalized personnel metrics and round to whole integer steps
        const adjustedValueRaw = this._battleValue * skillMultiplier;
        this._pilotAdjustedBattleValue = Math.round(adjustedValueRaw);
        this._calcLogBV += `<strong>Pilot Adjusted BV:</strong> ${this._pilotAdjustedBattleValue} ` +
            `(Base Unit BV: ${this._battleValue} x Skill Multiplier [G:${gunnery}/P:${piloting}]: ${skillMultiplier.toFixed(2)})<br />`;
    }

    /**
     * Calculates the non-linear speed scaling factor applied directly to the Offensive Battle Rating.
     * Coordinates movement metrics natively with the canonical Speed Factor Table rules (TechManual, p. 315).
     */
    private _getSpeedFactorModifier(): number {
        // Core formula implementation: Mobility = Run MP + (Jump MP / 2) (TM p. 315)
        const mobilityScore = this.getRunSpeed() + (this.getJumpSpeed() / 2);

        if (!Number.isFinite(mobilityScore)) {
            return 0.44;
        }

        // Static lookup table replicating the explicit values from TechManual p. 315
        // Index matches the exact mobilityScore value (Index 0 = 0 MP, Index 5 = 5 MP, etc.)
        const SPEED_FACTOR_TABLE: number[] = [
            0.44, // 0 MP
            0.54, // 1 MP
            0.65, // 2 MP
            0.77, // 3 MP
            0.88, // 4 MP
            1.00, // 5 MP (Standard Baseline Engine threshold)
            1.12, // 6 MP
            1.24, // 7 MP
            1.37, // 8 MP
            1.50, // 9 MP
            1.63, // 10 MP
            1.76, // 11 MP
            1.89, // 12 MP
            2.02, // 13 MP
            2.16, // 14 MP
            2.30, // 15 MP
            2.44, // 16 MP
            2.58, // 17 MP
            2.72, // 18 MP
            2.86, // 19 MP
            3.00, // 20 MP
            3.15, // 21 MP
            3.29, // 22 MP
            3.44, // 23 MP
            3.59, // 24 MP
            3.74  // 25 MP
        ];

        // Interpolate fractional mobility scores, such as Run 0 + Jump 1 / 2.
        if (mobilityScore >= 0 && mobilityScore < SPEED_FACTOR_TABLE.length) {
            const lowerIndex = Math.floor(mobilityScore);
            const upperIndex = Math.ceil(mobilityScore);
            const interpolation = mobilityScore - lowerIndex;
            return SPEED_FACTOR_TABLE[lowerIndex] +
                (SPEED_FACTOR_TABLE[upperIndex] - SPEED_FACTOR_TABLE[lowerIndex]) * interpolation;
        }

        // Mathematical Equation Fallback Rule for extreme/high-speed units (TM p. 315 footnote)
        // Formula: (1 + (Mobility - 5) / 10)^1.2 rounded precisely to two decimal places
        const highSpeedRaw = Math.pow((1 + (mobilityScore - 5) / 10), 1.2);
        return Number.isFinite(highSpeedRaw) ? parseFloat(highSpeedRaw.toFixed(2)) : 0.44;
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

    private _calcCBillCost() {
        // TODO Calculations
        this._calcLogCBill = "";

        let cbillDryTotal = 0;
        let cbillAmmoTotal = 0;
        // _this._calcLogCBill = "TODO";

        this._calcLogCBill += "<table class=\"cbill-cost\">\n";

        this._calcLogCBill += "<tbody>\n";
        // Cockpit
        if( this._smallCockpit ) {
            this._calcLogCBill += "<tr><td><strong>Small Cockpit</strong></td><td>175,000</td></tr>\n";
            cbillDryTotal += 175000;
        } else {
            this._calcLogCBill += "<tr><td><strong>Standard Cockpit</strong></td><td>200,000</td></tr>\n";
            cbillDryTotal += 200000;
        }

        // Life Support
        this._calcLogCBill += "<tr><td><strong>Life Support</strong></td><td>50,000</td></tr>\n";
        cbillDryTotal += 50000;

        // Sensors
        this._calcLogCBill += "<tr><td><strong>Sensors</strong><br /><span class=\"smaller-text\">2,000 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" + addCommas( 2000 * this.getTonnage()) + "</td></tr>\n";
        cbillDryTotal += 2000 * this.getTonnage() ;

        this._calcLogCBill += "<tr><td colspan=\"2\" class=\"text-right\"><strong>Cockpit Subtotal: " + addCommas(cbillDryTotal) + "</strong></td></tr>\n";

        // Myomer
        if( this._hasTripleStrengthMyomer ) {
            this._calcLogCBill += "<tr><td><strong>Triple-Strength Myomer</strong><br /><span class=\"smaller-text\">16,000 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 16000 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 16000 * this.getTonnage() ;
        } else {
            this._calcLogCBill += "<tr><td><strong>Standard Musculature</strong><br /><span class=\"smaller-text\">2,000 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 2000 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 2000 * this.getTonnage() ;
        }

        // Internal Structure
        // console.log( this._selectedInternalStructure.name );
        this._calcLogCBill += "<tr><td><strong>Internal Structure: " + this._selectedInternalStructure.name  + "</strong><br />" +  addCommas( this._selectedInternalStructure.cost ) + " x Unit Tonnage [" + this.getTonnage() + "]</td><td>" +  addCommas( this._selectedInternalStructure.cost * this.getTonnage() ) + "</td></tr>\n";
        cbillDryTotal += this._selectedInternalStructure.cost * this.getTonnage() ;

        this._calcLogCBill += "<tr><td colspan=\"2\"><strong>Actuators</strong></td></tr>\n";

        let actuatorTotal = 0;
        // Actuators
        if( this._mechType.tag.toLowerCase() === "quad" ) {
            this._calcLogCBill += "<tr><td>Right Front Upper Leg Actuator<br /><span class=\"smaller-text\">150 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 150 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 150 * this.getTonnage() ;
            actuatorTotal += 150 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Right Front Lower Leg Actuator<br /><span class=\"smaller-text\">80 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 80 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 80 * this.getTonnage() ;
            actuatorTotal += 80 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Right Front Foot Actuator<br /><span class=\"smaller-text\">120 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 120 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 120 * this.getTonnage() ;
            actuatorTotal += 120 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Left Front Upper Leg Actuator<br /><span class=\"smaller-text\">150 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 150 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 150 * this.getTonnage() ;
            actuatorTotal += 150 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Left Front Lower Leg Actuator<br /><span class=\"smaller-text\">80 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 80 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 80 * this.getTonnage() ;
            actuatorTotal += 80 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Left Front Foot Actuator<br /><span class=\"smaller-text\">120 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 120 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 120 * this.getTonnage() ;
            actuatorTotal += 120 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Right Rear Upper Leg Actuator<br /><span class=\"smaller-text\">150 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 150 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 150 * this.getTonnage() ;
            actuatorTotal += 150 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Right Rear Lower Leg Actuator<br /><span class=\"smaller-text\">80 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 80 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 80 * this.getTonnage() ;
            actuatorTotal += 80 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Right Rear Foot Actuator<br /><span class=\"smaller-text\">120 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 120 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 120 * this.getTonnage() ;
            actuatorTotal += 120 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Left Rear Upper Leg Actuator<br /><span class=\"smaller-text\">150 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 150 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 150 * this.getTonnage() ;
            actuatorTotal += 150 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Left Rear Lower Leg Actuator<br /><span class=\"smaller-text\">80 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 80 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 80 * this.getTonnage() ;
            actuatorTotal += 80 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Left Rear Foot Actuator<br /><span class=\"smaller-text\">120 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 120 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 120 * this.getTonnage() ;
            actuatorTotal += 120 * this.getTonnage() ;
        } else {

            this._calcLogCBill += "<tr><td>Right Upper Leg Actuator<br /><span class=\"smaller-text\">150 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 150 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 150 * this.getTonnage() ;
            actuatorTotal += 150 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Right Lower Leg Actuator<br /><span class=\"smaller-text\">80 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 80 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 80 * this.getTonnage() ;
            actuatorTotal += 80 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Right Foot Actuator<br /><span class=\"smaller-text\">120 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 120 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 120 * this.getTonnage() ;
            actuatorTotal += 120 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Left Upper Leg Actuator<br /><span class=\"smaller-text\">150 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( 150 * this.getTonnage() ) + "</td></tr>\n";
            cbillDryTotal += 150 * this.getTonnage() ;
            actuatorTotal += 150 * this.getTonnage() ;

            this._calcLogCBill += "<tr><td>Left Lower Leg Actuator<br /><span class=\"smaller-text\">80 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" + addCommas(80 * this.getTonnage()) + "</td></tr>\n";
            cbillDryTotal += 80 * this.getTonnage();
            actuatorTotal += 80 * this.getTonnage();

            this._calcLogCBill += "<tr><td>Left Foot Actuator<br /><span class=\"smaller-text\">120 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" + addCommas(120 * this.getTonnage()) + "</td></tr>\n";
            cbillDryTotal += 120 * this.getTonnage();
            actuatorTotal += 120 * this.getTonnage();

            // 2A. Arm Actuator Setups (Biped/LAM base plus Tripod extension)
            if (["biped", "lam", "tripod"].includes(this._mechType.tag.toLowerCase())) {
                const arms = ["Right", "Left"];
                
                arms.forEach(side => {
                    this._calcLogCBill += `<tr><td>${side} Shoulder Actuator<br /><span class="smaller-text">150 x Unit Tonnage [${this.getTonnage()}]</span></td><td>${addCommas(150 * this.getTonnage())}</td></tr>\n`;
                    cbillDryTotal += 150 * this.getTonnage();
                    actuatorTotal += 150 * this.getTonnage();

                    this._calcLogCBill += `<tr><td>${side} Upper Arm Actuator<br /><span class="smaller-text">150 x Unit Tonnage [${this.getTonnage()}]</span></td><td>${addCommas(150 * this.getTonnage())}</td></tr>\n`;
                    cbillDryTotal += 150 * this.getTonnage();
                    actuatorTotal += 150 * this.getTonnage();

                    // Check for structural hand/lower actuator exclusions if tracking custom options
                    this._calcLogCBill += `<tr><td>${side} Lower Arm Actuator<br /><span class="smaller-text">80 x Unit Tonnage [${this.getTonnage()}]</span></td><td>${addCommas(80 * this.getTonnage())}</td></tr>\n`;
                    cbillDryTotal += 80 * this.getTonnage();
                    actuatorTotal += 80 * this.getTonnage();

                    this._calcLogCBill += `<tr><td>${side} Hand Actuator<br /><span class="smaller-text">120 x Unit Tonnage [${this.getTonnage()}]</span></td><td>${addCommas(120 * this.getTonnage())}</td></tr>\n`;
                    cbillDryTotal += 120 * this.getTonnage();
                    actuatorTotal += 120 * this.getTonnage();
                });
            }

            // 2B. Advanced Chassis Exception: Tripod Center Leg Actuators (TM p. 278 structural adjustments)
            if (this._mechType.tag.toLowerCase() === "tripod") {
                this._calcLogCBill += "<tr><td>Center Rear Upper Leg Actuator<br /><span class=\"smaller-text\">150 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" + addCommas(150 * this.getTonnage()) + "</td></tr>\n";
                cbillDryTotal += 150 * this.getTonnage();
                actuatorTotal += 150 * this.getTonnage();

                this._calcLogCBill += "<tr><td>Center Rear Lower Leg Actuator<br /><span class=\"smaller-text\">80 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" + addCommas(80 * this.getTonnage()) + "</td></tr>\n";
                cbillDryTotal += 80 * this.getTonnage();
                actuatorTotal += 80 * this.getTonnage();

                this._calcLogCBill += "<tr><td>Center Rear Foot Actuator<br /><span class=\"smaller-text\">120 x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" + addCommas(120 * this.getTonnage()) + "</td></tr>\n";
                cbillDryTotal += 120 * this.getTonnage();
                actuatorTotal += 120 * this.getTonnage();
            }
        }

        // Close Actuator Layout Block subtotaling
        this._calcLogCBill += "<tr><td colspan=\"2\" class=\"text-right\"><strong>Actuators Subtotal: " + addCommas(actuatorTotal) + "</strong></td></tr>\n";

        // =====================================================================
        // ENGINE C-BILL COST CALCULATION (TechManual p. 278)
        // =====================================================================
        const engineType = this.getEngineType();
        const engineName = engineType.name;
        const engineRating = this.getEngineRating();
        const engineCostMultiplier = engineType.costMultiplier || 0;
        // Execute canonical cost calculation and round to the nearest whole C-Bill
        const engineCost = Math.round((engineCostMultiplier * engineRating * this.getTonnage()) / 75);
        this._calcLogCBill += "<tr><td><strong>Engine: " + engineName + "</strong><br />" +
            "<span class=\"smaller-text\">" + addCommas(engineCostMultiplier) + 
            " [Multiplier] x Engine Rating [" + engineRating + "] x Unit Tonnage [" + this.getTonnage() + "] / 75</span></td>" +
            "<td>" + addCommas(engineCost) + "</td></tr>\n";
        cbillDryTotal += engineCost;

        // Gyro
        let gyroName = this.getGyroName();
        let gyrocostMultiplier = this.getGyro().costMultiplier;
        let gyroTonnage = this.getGyroWeight();

        this._calcLogCBill += "<tr><td><strong>Gyro: " + gyroName  + "</strong><br /><span class=\"smaller-text\">" +  addCommas( gyrocostMultiplier ) + " x Gyro Tonnage [" + gyroTonnage + "]</span></td><td>" +  addCommas( gyrocostMultiplier * gyroTonnage  ) + "</td></tr>\n";
        cbillDryTotal += gyrocostMultiplier * gyroTonnage ;

        // Jump Jets
        let numberOfJumpJets = this.getNumberOfJumpJets();
        if( numberOfJumpJets ) {
            let jumpJetName = this._jumpJetType.name;
            let jumpJetCost = this._jumpJetType.costMultiplier;
            this._calcLogCBill += "<tr><td><strong>Jump Jets: " + jumpJetName  + "</strong><br /><span class=\"smaller-text\">" +  addCommas( jumpJetCost ) + " x (# Jump Jets [" +  numberOfJumpJets + "])<sup>2</sup> x Unit Tonnage [" + this.getTonnage() + "]</span></td><td>" +  addCommas( jumpJetCost * Math.pow( numberOfJumpJets, 2) *  this.getTonnage()  ) + "</td></tr>\n";
            cbillDryTotal += jumpJetCost * Math.pow( numberOfJumpJets, 2) *  this.getTonnage()  ;
        }

        // Heat Sinks
        let heatSinksName = this.getHeatSinksObj().name;
        let heatSinksCost =  this.getHeatSinksObj().cost ;
        let numberOfHeatSinks = this.getHeatSinks();
        let heatSinkType = this.getHeatSinksType();
        // console.log( numberOfHeatSinks );
        // console.log( heatSinkType );

        switch (heatSinkType) {
            case "single":
                this._calcLogCBill += "<tr><td><strong>Heat Sinks: " + heatSinksName  + "</strong><br /><span class=\"smaller-text\">" + addCommas(heatSinksCost) + " x (Number of Heat Sinks over 10 [" + (numberOfHeatSinks - 10 ) + "])</span></td><td>" +  addCommas( heatSinksCost * ( numberOfHeatSinks - 10 ) ) + "</td></tr>\n";
                cbillDryTotal +=  heatSinksCost * ( numberOfHeatSinks - 10 )  ;

                break;
            case "double":
                this._calcLogCBill += "<tr><td><strong>Heat Sinks:  " + heatSinksName  + "</strong><br /><span class=\"smaller-text\">" + addCommas(heatSinksCost) + " x (Number of Heat Sinks  [" + (numberOfHeatSinks  ) + "])</span></td><td>" +  addCommas( heatSinksCost * ( numberOfHeatSinks ) ) + "</td></tr>\n";
                cbillDryTotal +=  heatSinksCost * ( numberOfHeatSinks  )  ;

                break;
            default:
                break;
        }

        // Armor
        let armorName = this.getArmorObj().name;
        let armorcostMultiplier = this.getArmorObj().costMultiplier;
        let armorTonnage = this.getArmorWeight();

        this._calcLogCBill += "<tr><td><strong>Armor: " + armorName  + "</strong><br /><span class=\"smaller-text\">" +  addCommas( armorcostMultiplier ) + " x Armor Tonnage [" + armorTonnage + "]</span></td><td>" +  addCommas( armorcostMultiplier * armorTonnage  ) + "</td></tr>\n";
        cbillDryTotal += armorcostMultiplier * armorTonnage ;

        // Equipment
        for( let eqC = 0; eqC < this._equipmentList.length; eqC++) {
            if( this._equipmentList[eqC].tag.indexOf( "ammo-" ) === -1) {
                this._calcLogCBill += "<tr><td><strong>" + this._equipmentList[eqC].name + "</strong></td><td>" + addCommas(this._equipmentList[eqC].cbills) + "</td></tr>\n";
                cbillDryTotal += this._equipmentList[eqC].cbills;
            } else {
                this._calcLogCBill += "<tr><td><strong>" + this._equipmentList[eqC].name + "</strong></td><td class=\"text-right\">" + addCommas(this._equipmentList[eqC].cbills * this._equipmentList[eqC].weight) + "<div class=\"smaller-text\">(not included in dry cost)</div></td></tr>\n";
                cbillAmmoTotal += this._equipmentList[eqC].cbills * this._equipmentList[eqC].weight;
            }
        }

        // NOTE - for some reason SSW and the MUL are 1000 less here than the actual summation even when all the line items are right.
        this._calcLogCBill += "<tr><td colspan=\"2\" class=\"text-right\">&nbsp;</td></tr>\n";
        this._calcLogCBill += "<tr><td colspan=\"2\" class=\"text-right\"><strong>Dry Subtotal: " + addCommas(cbillDryTotal) + "</strong></td></tr>\n";

        // (Structural Cost + Weapon/Equipment Costs) x (Omni Conversion Cost*) x (1 + [Total Tonnage ÷ 100])

        this._calcLogCBill += "<tr><td colspan=\"2\" class=\"text-right\">&nbsp;</td></tr>\n";
        this._calcLogCBill += "<tr><td colSpan=\"2\">Cost Multiplier:<div class=\"smaller-text\">Sub Total [" + addCommas(cbillDryTotal) + "] x (1 + Unit Tonnage [" + this.getTonnage() + "] / 100) - rounded up</div></td><td>" + (1 + this.getTonnage() / 100 ) + "</td></tr>";
        this._calcLogCBill += "<tr><td class=\"text-right\"><strong>Final Dry Cost</strong>:</td><td>" + addCommas( Math.ceil(cbillDryTotal * ( 1 + this.getTonnage() / 100 ) ) ) + "</td></tr>\n";
        this._calcLogCBill += "<tr><td class=\"text-right\"><strong>Final Loaded Cost</strong>:</td><td>" + addCommas( Math.ceil( ( cbillDryTotal ) * ( 1 + this.getTonnage() / 100 ) ) + cbillAmmoTotal ) + "</td></tr>\n";

        // cbillDryTotal = Math.floor(cbillDryTotal)
        cbillDryTotal = Math.round( cbillDryTotal * (1 + this.getTonnage() / 100) );

        this._calcLogCBill += "</tbody></table>";
        this._cbillCost = addCommas(cbillDryTotal);
        this._cbillCostWithAmmo = addCommas( cbillDryTotal + cbillAmmoTotal)
    }

    public getNumberOfJumpJets() {
        return this.getJumpSpeed();
    }

    public getBattleValue() {
        return this._battleValue;
    }

    public getPilotAdjustedBattleValue() {
        return this._pilotAdjustedBattleValue;
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
            switch( this._engineType.tag ) {
                case "standard": {
                    return this._engine.weight.standard;
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
                    return this._engine.weight.compact;
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
                    return this._engine.weight.primitive;
                }
            }
            return 0;
        } else {
            return 0;
        }
    }

    public getEngineRating() {
        if( this._engine && this._engine.rating)
            return this._engine.rating;
        else
            return 0;

    }

    public getHeatSinks() {
        return 10 + this._additionalHeatSinks;
    }

    public getHeatSinksWeight() {
        return 0 + this._additionalHeatSinks;
    }

    public getGyroWeight() {
        if( this._engine ) {
            return Math.ceil(Math.ceil(this._engine.rating / 100) * this._gyro.weight_multiplier);
        } else {
            return 0;
        }
    }
    public getCockpitWeight() {
        return this._cockpitWeight;
    }

    public getInternalStructureWeight(): number {
        const typeTag = this.getType(); // e.g., 'biped', 'quad', 'tripod', 'lam', 'quadvee'
        const tonnage = this.getTonnage();
        
        // Ensure the chassis layout mappings exist to protect against undefined crashes
        if (
            this._selectedInternalStructure && 
            this._selectedInternalStructure.perMechType &&
            this._selectedInternalStructure.perMechType[typeTag.tag as keyof typeof this._selectedInternalStructure.perMechType] &&
            this._selectedInternalStructure.perMechType[typeTag.tag as keyof typeof this._selectedInternalStructure.perMechType][tonnage]
        ) {
            // Internal structure weight in classic rules is fundamentally derived from 
            // a multiplier against the Mech's total tonnage based on material technology.
            // Standard = 10% (0.1), Endo-Steel = 5% (0.05), Endo-Composite = 7.5% (0.075), Reinforced = 20% (0.2)
            
            let multiplier = 0.1; // Default fallback to Standard internal structure (10%)
            const structureTag = this._selectedInternalStructure.tag;

            if (structureTag === "endo-steel") multiplier = 0.05;
            if (structureTag === "endo-composite") multiplier = 0.075;
            if (structureTag === "reinforced") multiplier = 0.2;
            if (structureTag === "industrial") multiplier = 0.1;

            // Superheavy BattleMechs (105-200 tons) double their base internal structure weight multiplier rules!
            if (tonnage > 100) {
                multiplier = multiplier * 2;
            }

            return tonnage * multiplier;
        }

        return tonnage * 0.1; // Baseline automatic fallback calculation
    }

    public getJumpJetWeight() {
        if( this._tonnage <= 55) {
            // 10-55 tons
            return this._jumpSpeed * this._jumpJetType.weight_multiplier.light;
        } else if( this._tonnage <= 85) {
            // 60 - 85 tons
            return this._jumpSpeed * this._jumpJetType.weight_multiplier.medium;
        } else if( this._tonnage <= 100) {
            // 90 100 tons
            return this._jumpSpeed * this._jumpJetType.weight_multiplier.heavy;
        } else {
            // 105-200 tons
            return this._jumpSpeed * this._jumpJetType.weight_multiplier.superheavy;
        }
    }

    public getASCalcHTML() {
        return "<div class=\"mech-tro\">" + this._calcLogAS + "</div>";
    }

    public getBVCalcHTML() {
        return "<div class=\"mech-tro\">" + this._calcLogBV + "</div>";
    }

    public getCBillCalcHTML() {
        return "<div class=\"mech-tro\">" + this._calcLogCBill + "</div>";
    }

    public calcAlphaStrike(): AlphaStrikeUnit {

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

        switch (this._engineType.tag) {
          case "compact":
            // Compact Engines grant bonus structure based on tonnage brackets.
            // For Superheavies (105-200 tons), the baseline formula divides tonnage by 10 and adds bonus scaling.
            var structurePoints = 0;
            if (this._tonnage > 100) {
                // Superheavy / Colossal Scaling (105 to 200 tons) Caps at 20 structure for a maximum 200-ton unit.
                structurePoints = Math.min(20, Math.ceil(this._tonnage / 10) + 0);
            } else {
              // Standard Mech Tonnage Lookup Map (10 to 100 tons)
              const compactStructureMap: Record<number, number> = { 100: 10, 95: 10, 90: 10, 85: 9, 80: 8, 75: 8, 70: 7, 65: 7, 60: 7, 55: 6, 50: 5, 45: 5, 40: 4, 35: 4, 30: 3, 25: 3, 20: 2, 15: 2, 10: 1 };
              // Fallback to a math safety formula if tonnage isn't exactly matched on a 5-ton bracket
              structurePoints = compactStructureMap[this._tonnage] ?? Math.ceil(this._tonnage / 10);
            }
            this._alphaStrikeForceStats.structure = structurePoints;
            this._calcLogAS += `Engine is an IS Compact Engine <strong>setting structure to ${this._alphaStrikeForceStats.structure}</strong><br />\n`;
            break;
          case "is_xl":
          case "clan_xl":
          case "xxl":
          case "clan_xxl":
            // Base math algorithm for standard engine types: Math.ceil(this._tonnage / 10)
            // Extralight and XXL engines reduce this starting baseline:
            // - Clan XL: -1 Structure penalty (Minimum 1)
            // - IS XL: -2 Structure penalty (Minimum 1)
            // - XXL (Clan & IS): -3 Structure penalty (Minimum 1)
            structurePoints = 0;
            var baseCalculatedPoints = Math.ceil(this._tonnage / 10);
            if (this._tonnage > 100) {
              // Superheavy / Colossal Scaling (105 to 200 tons) as per standard Alpha Strike superheavy structure curves before applying engine penalty
              if (this._engineType.tag === "clan_xl") {
                structurePoints = baseCalculatedPoints - 1;
              } else if (this._engineType.tag === "is_xl") {
                structurePoints = baseCalculatedPoints - 2;
              } else { // XXL
                structurePoints = baseCalculatedPoints - 3;
              }
              structurePoints = Math.min(20, Math.max(1, structurePoints));
            } else {
              // Standard Mech Tonnage Lookup Maps (10 to 100 tons) with hardcoded canonical rules matching the official conversion charts
              const clanXlMap: Record<number, number> = { 100: 7, 95: 7, 90: 7, 85: 6, 80: 5, 75: 5, 70: 4, 65: 4, 60: 4, 55: 4, 50: 3, 45: 3, 40: 3, 35: 3, 30: 2, 25: 2, 20: 1, 15: 1, 10: 1 };
              const isXlMap: Record<number, number> = { 100: 5, 95: 5, 90: 5, 85: 5, 80: 4, 75: 4, 70: 3, 65: 3, 60: 3, 55: 3, 50: 2, 45: 2, 40: 2, 35: 2, 30: 1, 25: 1, 20: 1, 15: 1, 10: 1 };
              const xxlMap: Record<number, number> = { 100: 4, 95: 4, 90: 4, 85: 3, 80: 3, 75: 3, 70: 2, 65: 2, 60: 2, 55: 2, 50: 1, 45: 1, 40: 1, 35: 1, 30: 1, 25: 1, 20: 1, 15: 1, 10: 1 };
              // Map picker block
              let currentMap: Record<number, number> = clanXlMap;
              if (this._engineType.tag === "is_xl") currentMap = isXlMap;
              if (["xxl", "clan_xxl"].includes(this._engineType.tag)) currentMap = xxlMap;
              // Execute lookup, fall back safely to penalty calculation for non-standard tonnages
              const penalty = this._engineType.tag === "clan_xl" ? 1 : (this._engineType.tag === "is_xl" ? 2 : 3);
              structurePoints = currentMap[this._tonnage] ?? Math.max(1, baseCalculatedPoints - penalty);
            }
            this._alphaStrikeForceStats.structure = structurePoints;
            var engineDisplayNames: { [key: string]: string } = {
              "is_xl": "IS XL",
              "clan_xl": "Clan XL",
              "xxl": "XXL",
              "clan_xxl": "Clan XXL"
            };
            this._calcLogAS += `Engine is an ${engineDisplayNames[this._engineType.tag]} Fusion Engine <strong>setting structure to ${this._alphaStrikeForceStats.structure}</strong><br />\n`;
            break;

          case "light":
            // Inner Sphere Light Fusion Engine (LFE) Structure Logic. Light Engines suffer a flat -1 Structure modifier penalty (Minimum 1 point).
            structurePoints = 0;
            baseCalculatedPoints = Math.ceil(this._tonnage / 10);

            if (this._tonnage > 100) {
              // Superheavy / Colossal Scaling (105 to 200 tons) with standard -1 structural penalty baseline for Superheavies
              structurePoints = Math.max(1, baseCalculatedPoints - 1);
              structurePoints = Math.min(20, structurePoints);
            } else {
              // Standard Mech Tonnage Lookup Map (10 to 100 tons)
              const lightStructureMap: Record<number, number> = { 100: 5, 95: 5, 90: 5, 85: 5, 80: 4,  75: 4,  70: 4,  65: 4, 60: 3,  55: 3,  50: 3, 45: 2,  40: 2,  35: 2,  30: 2, 25: 1,  20: 1,  15: 1,  10: 1 };
              // Fallback to mathematical modifier logic if tonnage skips a 5-ton bracket
              structurePoints = lightStructureMap[this._tonnage] || Math.max(1, baseCalculatedPoints - 1);
            }
            this._alphaStrikeForceStats.structure = structurePoints;
            this._calcLogAS += `Engine is an IS Light Engine <strong>setting structure to ${this._alphaStrikeForceStats.structure}</strong><br />\n`;
            break;
          case "ice":
          case "fuel_cell":
          case "fission":
          case "primitive":
          case "standard":
          default:
            structurePoints = 0;
            baseCalculatedPoints = Math.ceil(this._tonnage / 10);
            if (this._tonnage > 100) {
              // Superheavy / Colossal Scaling (105 to 200 tons) progression up to the hard ceiling of 20
              structurePoints = Math.min(20, baseCalculatedPoints);
            } else {
              // Standard Mech Tonnage Lookup Map (10 to 100 tons) mathcing the canonical unpenalized Alpha Strike structure progression chart
              const standardStructureMap: Record<number, number> = { 100: 8, 95: 8, 90: 8, 85: 7, 80: 6,  75: 6, 70: 5,  65: 5,  60: 5, 55: 5, 50: 4,  45: 4, 40: 3,  35: 3, 30: 2,  25: 2, 20: 2,  15: 2, 10: 1 };
              // Fallback calculation for custom irregular tonnage profiles
              structurePoints = standardStructureMap[this._tonnage] || baseCalculatedPoints;
            }
            this._alphaStrikeForceStats.structure = structurePoints;
            // Map internal tags to clean logging display values
            engineDisplayNames = {
              "ice": "Internal Combustion",
              "fuel_cell": "Fuel Cell",
              "fission": "Fission",
              "primitive": "Primitive Fusion",
              "standard": "Standard Fusion"
            };
            this._calcLogAS += `Engine is a ${engineDisplayNames[this._engineType.tag]} Engine <strong>setting structure to ${this._alphaStrikeForceStats.structure}</strong><br />\n`;
            break;
          }

        // Heat Modified Damage, p115 AS companion
        let total_weapon_heat_short = 0;
        let total_weapon_heat_medium = 0;
        let total_weapon_heat_long = 0;
        // let total_weapon_heat_extreme = 0;
        let has_explosive = false;

        let lrmDamage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0

        }

        let heatDamage: IAlphaStrikeDamage = {
            short:0,
            medium: 0,
            long: 0,
            extreme: 0
        }

        let flakDamage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0
        }

        let acDamage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0
        }

        let srmDamage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0
        }

        let mslDamage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0
        }

        let rearDamage: IAlphaStrikeDamage = {
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

        for (let weapon_counter = 0; weapon_counter < this._equipmentList.length; weapon_counter++) {
            if (this._equipmentList[weapon_counter].explosive) {
                has_explosive = true;
            }
            if (this._equipmentList[weapon_counter].alphaStrike && !this._equipmentList[weapon_counter].isAmmo ) {
                if (this._equipmentList[weapon_counter].alphaStrike.rangeLong > 0) {
                    total_weapon_heat_long += +this._equipmentList[weapon_counter].alphaStrike.heat;
                }
                // if (this._equipmentList[weapon_counter].alphaStrike.rangeExtreme > 0) {
                //     total_weapon_heat_extreme += +this._equipmentList[weapon_counter].alphaStrike.heat;
                // }



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

                    if( this._equipmentList[weapon_counter].alphaStrike.rangeMedium > 0 )
                        total_weapon_heat_medium += +this._equipmentList[weapon_counter].alphaStrike.heat;
                    if( this._equipmentList[weapon_counter].alphaStrike.rangeShort > 0 )
                        total_weapon_heat_short += +this._equipmentList[weapon_counter].alphaStrike.heat;

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
                        if (this._alphaStrikeForceStats.abilityCodes.indexOf(this._equipmentList[weapon_counter].alphaStrike.notes[nC]) === -1) {
                            this._alphaStrikeForceStats.abilityCodes.push(this._equipmentList[weapon_counter].alphaStrike.notes[nC]);
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




        indirectFireRating = Math.round(indirectFireRating);

        let move_heat = 0;
        if (this.getJumpSpeed() > 0) {
            if (this.getJumpSpeed() < 3)
                move_heat += 3;
            else
                move_heat += +this.getJumpSpeed();

            this._calcLogAS += "<strong>Move Is " + this.getWalkSpeed() * 2 + "\"/" + this.getJumpSpeed() * 2 + "\"J</strong><br />\n";
        } else {
            move_heat += 2;
            this._calcLogAS += "<strong>Move Is " + this.getWalkSpeed() * 2 + "\"</strong><br />\n";
        }

        // if there are no explosive components, then the mech gets the ENE ability :)
        if (!has_explosive) {
            this._alphaStrikeForceStats.abilityCodes.push( "ENE" );
            this._calcLogAS += "Mech has no explosive components, gets ENE ability<br />\n";
        }

        let heatDissipation = 0;

        heatDissipation += (10 + this._additionalHeatSinks) * this._heatSinkType.dissipation;

        let max_short_overheat_value =  move_heat + total_weapon_heat_short ;
        let max_medium_overheat_value =  move_heat + total_weapon_heat_medium ;
        let max_long_overheat_value =  move_heat + total_weapon_heat_long;
        // let max_weapon_heat_extreme = move_heat + total_weapon_heat_extreme;

        let max_heat_output =  max_short_overheat_value;
        if( max_medium_overheat_value > max_heat_output)
            max_heat_output = max_medium_overheat_value
        if( max_long_overheat_value > max_heat_output)
            max_heat_output = max_long_overheat_value


        if( this._alphaStrikeForceStats.damage.short >= .5 && this._alphaStrikeForceStats.damage.short < 1) {
            this._alphaStrikeForceStats.damage.short = 0;
            this._alphaStrikeForceStats.damage.shortMinimal = true;
        } else {
            this._alphaStrikeForceStats.damage.short = Math.ceil( this._alphaStrikeForceStats.damage.short );
        }

        if( this._alphaStrikeForceStats.damage.medium >= .5 && this._alphaStrikeForceStats.damage.medium < 1) {
            this._alphaStrikeForceStats.damage.medium = 0;
            this._alphaStrikeForceStats.damage.mediumMinimal = true;
        } else {
            this._alphaStrikeForceStats.damage.medium = Math.ceil( this._alphaStrikeForceStats.damage.medium );
        }
        if( this._alphaStrikeForceStats.damage.long >= .5 && this._alphaStrikeForceStats.damage.long < 1) {
            this._alphaStrikeForceStats.damage.long = 0;
            this._alphaStrikeForceStats.damage.longMinimal = true;
        } else {
            this._alphaStrikeForceStats.damage.long = Math.ceil( this._alphaStrikeForceStats.damage.long );
        }
        if( this._alphaStrikeForceStats.damage.extreme >= .5 && this._alphaStrikeForceStats.damage.extreme < 1) {
            this._alphaStrikeForceStats.damage.extreme = 0;
            this._alphaStrikeForceStats.damage.extremeMinimal = true;
        } else {
            this._alphaStrikeForceStats.damage.extreme = Math.ceil( this._alphaStrikeForceStats.damage.extreme );
        }




        this._calcLogAS += "<strong>Base Short Damage: " + this._alphaStrikeForceStats.damage.short + "</strong><br />\n";
        this._calcLogAS += "<strong>Base Medium Damage: " + this._alphaStrikeForceStats.damage.medium + "</strong><br />\n";
        this._calcLogAS += "<strong>Base Long Damage: " + this._alphaStrikeForceStats.damage.long + "</strong><br />\n";
        this._calcLogAS += "<strong>Base Extreme Damage: " + this._alphaStrikeForceStats.damage.extreme + "</strong><br />\n";

        let final_overheat_value = 0;


        let weapon_heat_damage_short = Math.ceil((this._alphaStrikeForceStats.damage.short * heatDissipation) / (max_heat_output - 4));
        let weapon_heat_damage_medium = Math.ceil((this._alphaStrikeForceStats.damage.medium * heatDissipation) / (max_heat_output - 4));
        let weapon_heat_damage_long = Math.ceil((this._alphaStrikeForceStats.damage.long * heatDissipation) / (max_heat_output - 4));
        // let weapon_heat_damage_extreme = Math.ceil((this._alphaStrikeForceStats.damage.extreme * heatDissipation) / (max_heat_output - 4));



        // if( this._alphaStrikeForceStats.damage.short.toString() !== "0*" )
        this._alphaStrikeForceStats.damage.short = Math.ceil(+this._alphaStrikeForceStats.damage.short);

        // if( this._alphaStrikeForceStats.damage.medium.toString() !== "0*" )
        this._alphaStrikeForceStats.damage.medium = Math.ceil(+this._alphaStrikeForceStats.damage.medium);


        if (weapon_heat_damage_medium !== this._alphaStrikeForceStats.damage.medium || weapon_heat_damage_short !== this._alphaStrikeForceStats.damage.short )  {


            // Heat Modified Damage, p115 AS companion
            this._alphaStrikeForceStats.damage.short = weapon_heat_damage_short;

            this._alphaStrikeForceStats.damage.medium = weapon_heat_damage_medium;
            if( this._alphaStrikeForceStats.damage.medium > 0 && weapon_heat_damage_medium !== this._alphaStrikeForceStats.damage.medium  ) {

                this._calcLogAS += "total_weapon_heat_medium is over 3, weapon damages must be adjusted - " + weapon_heat_damage_medium + " as per p115<br />";

                final_overheat_value = this._alphaStrikeForceStats.damage.medium - weapon_heat_damage_medium;


            } else if( this._alphaStrikeForceStats.damage.short !== weapon_heat_damage_short ) {
                 final_overheat_value = this._alphaStrikeForceStats.damage.short - weapon_heat_damage_short;
            }

        }
        this._alphaStrikeForceStats.damage.short = weapon_heat_damage_short;
        this._alphaStrikeForceStats.damage.medium = weapon_heat_damage_medium;

        let final_long_overheat_value = 0;
        let heat_damage_long = 0;
        let heat_damage_extreme = 0;

        if (weapon_heat_damage_long > 4) {

            if( this._alphaStrikeForceStats.damage.long.toString() !== "0*" ) {
                heat_damage_long = +this._alphaStrikeForceStats.damage.long;
                heat_damage_extreme = +this._alphaStrikeForceStats.damage.extreme;


                this._alphaStrikeForceStats.damage.long = Math.ceil((+this._alphaStrikeForceStats.damage.long * heatDissipation) / (total_weapon_heat_long - 4));
                this._alphaStrikeForceStats.damage.extreme = Math.ceil((+this._alphaStrikeForceStats.damage.long * heatDissipation) / (total_weapon_heat_long - 4));

                if (heat_damage_long > +this._alphaStrikeForceStats.damage.long) {
                    final_long_overheat_value = heat_damage_long - +this._alphaStrikeForceStats.damage.long;
                    this._alphaStrikeForceStats.damage.long = (heat_damage_long - final_long_overheat_value);
                    this._alphaStrikeForceStats.damage.extreme = (heat_damage_extreme - final_long_overheat_value);
                }


            }
        }

        if (final_long_overheat_value > 0) {
            this._alphaStrikeForceStats.abilityCodes.push( "OVL " + final_long_overheat_value);

        }


        this._alphaStrikeForceStats.damage = adjustAlphaStrikeDamage(this._alphaStrikeForceStats.damage, true);

        // Determine Overheat Values - p116 AS Companion
        if( final_overheat_value > 4 )
            final_overheat_value = 4;

        this._alphaStrikeForceStats.ov = final_overheat_value;

        this._calcLogAS += "Move Heat: " + move_heat + "<br />\n";
        this._calcLogAS += "Weapon Heat: " + final_overheat_value + "<br />\n";
        this._calcLogAS += "Long Weapon Heat: " + total_weapon_heat_long + "<br />\n";
        this._calcLogAS += "Heat Dissipation: " + heatDissipation + "<br />\n";

        this._calcLogAS += "Short Overheat Damage: " + weapon_heat_damage_short + "<br />\n";
        this._calcLogAS += "Medium Overheat Damage: " + weapon_heat_damage_medium + "<br />\n";
        this._calcLogAS += "Long Overheat Damage: " + weapon_heat_damage_long + "<br />\n";
        this._calcLogAS += "Final Overheat Damage: " + final_overheat_value + "<br />\n";

        this._calcLogAS += "<strong>Final Short Damage: " + this._alphaStrikeForceStats.damage.short + "</strong><br />\n";
        this._calcLogAS += "<strong>Final Medium Damage: " + this._alphaStrikeForceStats.damage.medium + "</strong><br />\n";
        this._calcLogAS += "<strong>Final Long Damage: " + this._alphaStrikeForceStats.damage.long + "</strong><br />\n";
        this._calcLogAS += "<strong>Final Extreme Damage: " + this._alphaStrikeForceStats.damage.extreme + "</strong><br />\n";

        // Overheat Value is
        this._calcLogAS += "<strong>Final Overheat Value: " + final_overheat_value + "</strong><br />\n";
        this._calcLogAS += "<strong>Final Long Overheat Value: " + final_long_overheat_value + "</strong><br />\n";

        this._alphaStrikeForceStats.overheat = final_overheat_value;
        this._alphaStrikeForceStats.longOverheat = final_long_overheat_value;

        // Offensive Special Ability Factor
        // TODO

        this._alphaStrikeForceStats.name = this._model;
        this._alphaStrikeForceStats.type = "BM";

        let alphaStrikeCalculation = calculateAlphaStrikeValue(
            this._alphaStrikeForceStats,
            rearDamage,
            heatDamage,
            lrmDamage,
            flakDamage,
            acDamage,
            srmDamage,
            mslDamage,
            indirectFireRating,
        );

        this._calcLogAS += alphaStrikeCalculation.calcLogs;
        let finalValue = alphaStrikeCalculation.finalValue;
        this._alphaStrikeForceStats = alphaStrikeCalculation.alphaStrikeForceStats;

        this._alphaStrikeValue = Math.round(finalValue); // + " (WIP)";
        let asMechData: IASMULUnit = {
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

        asMechData["BFOverheat"] = this._alphaStrikeForceStats.overheat;


        if( this._alphaStrikeForceStats.jumpMove) {
            asMechData["BFMove"] = this._alphaStrikeForceStats.move.toString() + "\"/" + this._alphaStrikeForceStats.jumpMove + "\"J";
        } else {
            asMechData["BFMove"] = this._alphaStrikeForceStats.move.toString() + "\"";
        }

        this._alphaStrikeForceStats.abilityCodes.sort();
        asMechData["BFAbilities"] = this._alphaStrikeForceStats.abilityCodes.join( ", " ).toUpperCase();

        let unitObj = new AlphaStrikeUnit();

        unitObj.customName = this._alphaStrikeForceStats.customName;
        unitObj.setPilotSkill( this._pilot.gunnery );
        unitObj.importMUL( asMechData )
        unitObj.mechCreatorUUID = this._uuid;
        return unitObj;

    }

    public makeTROBBCode() {

        let html = "";
        // Header Info
        html += "Type: " + this.getName() + "\n";
        html += "Technology Base: " + this.getTech().name + "\n";
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
        html += "" + ( "Internal Structure ( " + this._selectedInternalStructure.name + " )" ).toString().padEnd(col1Padding + col2Padding, " " ) + "" + this.getInternalStructureWeight() + "\n";
        html += "" + this.getEngineName().padEnd(col1Padding, " " ) + "" + this.getEngineRating().toString().padEnd(col2Padding, " " ) + "" + this.getEngineWeight() + "\n";

        html += "Walking".padStart(col1Padding - 10, " " ) + " " + this.getWalkSpeed().toString().padStart(3, " " ) + "\n";
        html += "Running".padStart(col1Padding - 10, " " ) + " " + this.getRunSpeed().toString().padStart(3, " " ) + "\n";
        html += "Jumping".padStart(col1Padding - 10, " " ) + " " + this.getJumpSpeed().toString().padStart(3, " " ) + "\n";

        html += "" + this.getHeatSyncName().padEnd(col1Padding, " " ) + "" + this.getHeatSinks().toString().padEnd(col2Padding, " " ) + "" + this.getHeatSinksWeight() + "\n";
        html += "" + this.getGyroName().padEnd(col1Padding + col2Padding, " " ) + "" + this.getGyroWeight() + "\n";

        if( this._smallCockpit) {
            html += "Small Cockpit".padEnd(col1Padding + col2Padding, " " ) + "" + this.getCockpitWeight() + "\n";
        } else {
            html += "Cockpit".padEnd(col1Padding + col2Padding, " " ) + "" + this.getCockpitWeight() + "\n";
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
                let item = this._criticals[this._validJJLocations[locC].long][critC];
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
            let currentItem = this._equipmentList[countEQ];

            if( typeof(currentItem.location) === "undefined" )
                currentItem.location = "n/a";

            let item_location = this._getLocationAbbr(currentItem.location);

            if( currentItem.rear)
                item_location += " (R)"

            if( currentItem.ammoPerTon && currentItem.ammoPerTon > 0) {
                html += "" + (currentItem.name + " " + currentItem.ammoPerTon).padEnd(col1Padding, " " ) + "" + item_location.toUpperCase().toString().padEnd(col2Padding, " " ) + "" + currentItem.space.battlemech.toString().padEnd(col3Padding, " " ) + "" + currentItem.weight.toString().padEnd(col4Padding, " " ) + "\n";
            } else {
                html += "" + currentItem.name.padEnd(col1Padding, " " ) + "" + item_location.toUpperCase().toString().padEnd(col2Padding, " " ) + "" + currentItem.space.battlemech.toString().padEnd(col3Padding, " " ) + "" + currentItem.weight.toString().padEnd(col4Padding, " " ) + "\n";
            }

        }

        // List Jump Jets Allocations...

        for( let locC = 0; locC < this._validJJLocations.length; locC++) {

            let jjObjs = [];
            for( let critC = 0; critC < this._criticals[this._validJJLocations[locC].long].length; critC++) {
                let currentItem = this._criticals[this._validJJLocations[locC].long][critC];
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
                if( this._tonnage <= 55) {
                    // 10-55 tons
                    areaWeight = jjObjs.length * this._jumpJetType.weight_multiplier.light;
                } else if( this._tonnage <= 85) {
                    // 60 - 85 tons
                    areaWeight = jjObjs.length * this._jumpJetType.weight_multiplier.medium;
                } else if ( this._tonnage <= 100) {
                    // 90-100 tons
                    areaWeight = jjObjs.length * this._jumpJetType.weight_multiplier.heavy;
                } else {
                    // 105+ tons
                    areaWeight = jjObjs.length * this._jumpJetType.weight_multiplier.superheavy;
                }
                html += "" + jjObjs[0].name.padEnd(col1Padding, " " ) + "" + this._validJJLocations[locC].short.toUpperCase().padEnd(col2Padding, " " ) + "" + jjObjs.length.toString().padEnd(col3Padding, " " ) + "" + areaWeight.toString().padEnd(col4Padding, " " ) + "\n";

            }
        }

        let jjObjs = [];

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
            if( this._tonnage <= 55) {
                // 10-55 tons
                areaWeight = jjObjs.length * this._jumpJetType.weight_multiplier.light;
            } else if( this._tonnage <= 85) {
                // 60 - 85 tons
                areaWeight = jjObjs.length * this._jumpJetType.weight_multiplier.medium;
            } else {
                // 90+ tons
                areaWeight = jjObjs.length * this._jumpJetType.weight_multiplier.heavy;
            }
            html += "" + jjObjs[0].name.padEnd(col1Padding, " " ) + "n/a".toUpperCase().padEnd(col2Padding, " " ) + "" + jjObjs.length.toString().padEnd(col3Padding, " " ) + "" + areaWeight.toString().padEnd(col4Padding, " " ) + "\n";

        }

        let createdBy = "\n\nCreated with BattleTech Tools: [url]https://heysporky.github.io/battletech-tools/[/url]\n\n";

        return "[code]" + html + "[/code]" + createdBy;

    }

    public makeTROHTML() {

        let html = "<table class=\"mech-tro\">";

        // Header Info
        html += "<tr><td colspan=\"4\">Type: " + this.getName() + "</td></tr>";
        html += "<tr><td colspan=\"4\">Technology Base: " + this.getTech().name + "</td></tr>";
        html += "<tr><td colspan=\"4\">Era: " + this.getEra().name + "</td></tr>";
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
        html += "<tr><td colspan=\"3\">Internal Structure ( " + this._selectedInternalStructure.name + " )</td><td class=\"text-center\" colspan=\"1\">" + this.getInternalStructureWeight() + "</td></tr>";
        html += "<tr><td colspan=\"1\">" + this.getEngineName() + "</td><td class=\"text-center\" colspan=\"2\">" + this.getEngineRating() + "</td><td class=\"text-center\" colspan=\"1\">" + this.getEngineWeight() + "</td></tr>";

        html += "<tr><td colspan=\"1\" class=\"text-right\">Walking</td><td class=\"text-center\" colspan=\"2\">" + this.getWalkSpeed() + "</td><td colspan=\"1\">&nbsp;</td></tr>";
        html += "<tr><td colspan=\"1\" class=\"text-right\">Running</td><td class=\"text-center\" colspan=\"2\">" + this.getRunSpeed() + "</td><td colspan=\"1\">&nbsp;</td></tr>";
        html += "<tr><td colspan=\"1\" class=\"text-right\">Jumping</td><td class=\"text-center\" colspan=\"2\">" + this.getJumpSpeed() + "</td><td colspan=\"1\">&nbsp;</td></tr>";

        html += "<tr><td colspan=\"1\">" + this.getHeatSyncName() + "</td><td class=\"text-center\" colspan=\"2\">" + this.getHeatSinks() + "</td><td class=\"text-center\" colspan=\"1\">" + this.getHeatSinksWeight() + "</td></tr>";
        html += "<tr><td colspan=\"3\">" + this.getGyroName() + "</td><td class=\"text-center\" colspan=\"1\">" + this.getGyroWeight() + "</td></tr>";

        if( this._smallCockpit) {
            html += "<tr><td colspan=\"3\">Small Cockpit</td><td class=\"text-center\" colspan=\"1\">" + this.getCockpitWeight() + "</td></tr>";
        } else {
            html += "<tr><td colspan=\"3\">Cockpit</td><td class=\"text-center\" colspan=\"1\">" + this.getCockpitWeight() + "</td></tr>";
        }

        if( this._mechType.tag === "biped" ) {
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

        html += "<tr><th colspan=\"1\">Armor Value ( " + this._armorType.name + " )</th><th class=\"text-center\" colspan=\"2\">" + this.getTotalArmor() + "</th><th class=\"text-center\" colspan=\"1\">" + this.getArmorWeight() + "</th></tr>";

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
        if( this._mechType.tag === "biped" ) {

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
        } else {
            if( this._armorAllocation.rightArm === this._armorAllocation.leftArm) {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">R/L Front Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightArm + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightArm + "</td><td>&nbsp;</td></tr>";
            } else {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Right Front Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightArm + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightArm + "</td><td>&nbsp;</td></tr>";
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Left Front Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.leftArm + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.leftArm + "</td><td>&nbsp;</td></tr>";
            }

            if( this._armorAllocation.rightLeg === this._armorAllocation.leftLeg) {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">R/L Rear Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightLeg + "</td><td>&nbsp;</td></tr>";
            } else {
                html += "<tr><td  class=\"text-right\"colspan=\"1\">Right Rear Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.rightLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.rightLeg + "</td><td>&nbsp;</td></tr>";
                html += "<tr><td  class=\"text-right\"colspan=\"1\">R/L Leg</td><td class=\"text-center\" colspan=\"1\">" + this._internalStructure.leftLeg + "</td><td class=\"text-center\" colspan=\"1\">" + this._armorAllocation.leftLeg + "</td><td>&nbsp;</td></tr>";
            }
        }
        // End Factor Table
        html += "</table>";
        html += "<br />";

        // Weapons and Ammo
        html += "<table class=\"mech-tro\">";
        html += "<tr><th class=\"text-left\">Weapons<br />and Ammo</th><th class=\"text-center\">Location</th><th class=\"text-center\">Critical</th><th class=\"text-center\">Tonnage</th></tr>";

        this._equipmentList.sort(sortByLocationThenName);

        for( let countEQ = 0; countEQ < this._equipmentList.length; countEQ++) {
            let currentItem = this._equipmentList[countEQ];
            if( typeof(currentItem.location) === "undefined" )
                currentItem.location = "n/a";

            let item_location = this._getLocationAbbr(currentItem.location);

            if( currentItem.rear)
                item_location += " (R)"

            if( currentItem.isAmmo && currentItem.ammoPerTon && currentItem.ammoPerTon > 0)
                html += "<tr><td class=\"text-left\">" + currentItem.name + " " + currentItem.ammoPerTon + "</td><td class=\"text-center\">" + item_location.toUpperCase() + "</strong></td><td class=\"text-center\">" + currentItem.space.battlemech + "</td><td class=\"text-center\">" + currentItem.weight + "</td></tr>";
            else
                html += "<tr><td class=\"text-left\">" + currentItem.name + "</td><td class=\"text-center\">" + item_location.toUpperCase() + "</strong></td><td class=\"text-center\">" + currentItem.space.battlemech + "</td><td class=\"text-center\">" + currentItem.weight + "</td></tr>";
        }

        // Isolate the base unit weight per Jump Jet once to eliminate code duplication
        let singleJJWeight = 0;
        if (this._tonnage <= 55) {
            singleJJWeight = this._jumpJetType.weight_multiplier.light;       // 10 - 55 tons
        } else if (this._tonnage <= 85) {
            singleJJWeight = this._jumpJetType.weight_multiplier.medium;      // 60 - 85 tons
        } else if (this._tonnage <= 100) {
            singleJJWeight = this._jumpJetType.weight_multiplier.heavy;       // 90 - 100 tons
        } else {
            singleJJWeight = this._jumpJetType.weight_multiplier.superheavy;  // 105+ tons
        }

        // Process allocated Jump Jets across valid equipment locations
        for (let locC = 0; locC < this._validJJLocations.length; locC++) {
            const locationLong = this._validJJLocations[locC].long;
            const locationShort = this._validJJLocations[locC].short.toUpperCase();
    
            // Gather all Jump Jet objects occupying critical slots in this specific location
            let jjObjs = [];
            for (let critC = 0; critC < this._criticals[locationLong].length; critC++) {
                let item = this._criticals[locationLong][critC];
                if (item && item.tag && item.tag.indexOf("jj-") === 0) {
                    jjObjs.push(item);
                }
            }
            // If matching engines were found, append a clean summary table row
            if (jjObjs.length > 0) {
                const totalLocationWeight = jjObjs.length * singleJJWeight;
                const jjName = jjObjs[0].name;
                // Fixed the loose dangling </strong> tag from the original snippet
                html += `<tr><td class="text-left">${jjName}</td><td class="text-center"><strong>${locationShort}</strong></td><td class="text-center">${jjObjs.length}</td><td class="text-center">${totalLocationWeight.toFixed(2)}</td></tr>`;
            }
        }
        // Process any Unallocated/Floating Jump Jets lingering in the construction queue
        let unallocatedJJs = [];
        for (let critC = 0; critC < this._unallocatedCriticals.length; critC++) {
            let item = this._unallocatedCriticals[critC];
            if (item && item.tag && item.tag.indexOf("jj-") === 0) {
                unallocatedJJs.push(item);
            }
        }
        if (unallocatedJJs.length > 0) {
            const totalUnallocatedWeight = unallocatedJJs.length * singleJJWeight;
            const jjName = unallocatedJJs[0].name;
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

        this._maxMoveHeat = 2;
        this._heatDissipation = 0;

        this._weights = [];

        this._weights.push({
            name: "Internal Structure",
            weight: this.getInternalStructureWeight()
        });

        if( this._smallCockpit) {
            this._cockpitWeight = 2;
            this._weights.push({
                name: "Small Cockpit",
                weight: this.getCockpitWeight()
            });
        } else {
            this._cockpitWeight = 3;
            this._weights.push({
                name: "Cockpit",
                weight: this.getCockpitWeight()
            });
        }

        this._runSpeed = Math.ceil(this._walkSpeed * 1.5);

        if( this._engine) {

            this._weights.push({
                name: this._engineType.name + " - " + this._engineType.rating,
                weight: this.getEngineWeight()!
            });

            this._weights.push({
                name: this._gyro.name,
                weight: this.getGyroWeight()
            });

        }

        if( this._jumpSpeed > 0) {
            this._maxMoveHeat = this._jumpSpeed;
            this._weights.push({
                name: this._jumpJetType.name,
                weight: this.getJumpJetWeight()
            });
        }
        this._totalArmor = 0;
        if( this.getTech().tag === "clan" ) {
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
        this._unallocatedArmor = this._maxArmor - this._totalArmor;

        this._maxWeaponHeat = 0;
        if( this._additionalHeatSinks > 0)
            this._weights.push({
                name: "Additional Heat Sinks",
                weight: this._additionalHeatSinks
            });

        this._calcVariableEquipment();
        for( let countEQ = 0; countEQ < this._equipmentList.length; countEQ++) {
            if( this._equipmentList[countEQ].rear) {
                this._weights.push({
                    name: this._equipmentList[countEQ].name + " (rear)",
                    weight: this._equipmentList[countEQ].weight
                });
            } else {
                this._weights.push({
                    name: this._equipmentList[countEQ].name + "",
                    weight: this._equipmentList[countEQ].weight
                });
            }
            if( this._equipmentList[countEQ])
                this._maxWeaponHeat += this._equipmentList[countEQ].heat;
        }

        this._currentTonnage = 0;
        for( let weight_counter = 0; weight_counter < this._weights.length; weight_counter++) {
            this._currentTonnage += this._weights[weight_counter].weight;
        }

        this._remainingTonnage = this._tonnage - this._currentTonnage;

        this._heatSinkCriticals = {
            slotsEach: 1,
            number: 0,
        };
        
        this._heatDissipation = (this._additionalHeatSinks + 10) * this._heatSinkType.dissipation;
        if( this.getTech().tag === "clan" ) {
            this._heatSinkCriticals.slotsEach = this._heatSinkType.crits.clan;
        } else {
            this._heatSinkCriticals.slotsEach = this._heatSinkType.crits.is;
        }

        let findEngine = this.getEngine();
        if( findEngine && findEngine.rating) {
            this._heatSinkCriticals.number = this._additionalHeatSinks + 10 - Math.floor(findEngine.rating / 25);
        } else {
            this._heatSinkCriticals.number = 0
        }

        this._calcCriticals();
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
        let arr = currentArray ?? [];
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

    private _calcCriticals() {

        this._calcVariableEquipment();
        // WORK IN PROGRESS (Not so much? - JDG Apr 2 2022)
        // CORE FIXED LOCATIONS: Head (6 slots) & Torsos (12 slots) always exist
        this._criticals.head = Array(6).fill(null);
        this._criticals.centerTorso = Array(12).fill(null);
        this._criticals.leftTorso = Array(12).fill(null);
        this._criticals.rightTorso = Array(12).fill(null);

        const typeTag = this.getType().tag.toLowerCase();

        // DYNAMIC CRITICAL SLOTS: Get the stuff the different types need
        if (typeTag === "biped" || typeTag === "lam") {
            // Standard Bipeds and Land Air Mechs feature 12 slots per arm and 6 slots per leg
            this._criticals.leftArm = Array(12).fill(null);
            this._criticals.rightArm = Array(12).fill(null);
            this._criticals.leftLeg = Array(6).fill(null);
            this._criticals.rightLeg = Array(6).fill(null);
            // Scrub non-existent limbs in this type
            this._criticals.centerLeg = [];
            this._criticals.frontLeftLeg = [];
            this._criticals.frontRightLeg = [];
        } else if (typeTag === "quad" || typeTag === "quadvee") {
            // Quads and QuadVees possess 4 legs with 6 slots each. They have NO arms.
            this._criticals.frontLeftLeg = Array(6).fill(null);
            this._criticals.frontRightLeg = Array(6).fill(null);
            this._criticals.leftLeg = Array(6).fill(null);        // Rear Left Leg
            this._criticals.rightLeg = Array(6).fill(null);       // Rear Right Leg
            // Clear biped/tripod slot arrays
            this._criticals.leftArm = [];
            this._criticals.rightArm = [];
            this._criticals.centerLeg = [];
        } else if (typeTag === "tripod") {
            // Tripods possess 3 legs with 6 slots each, plus 2 standard 12-slot arms
            this._criticals.leftArm = Array(12).fill(null);
            this._criticals.rightArm = Array(12).fill(null);
            this._criticals.leftLeg = Array(6).fill(null);
            this._criticals.rightLeg = Array(6).fill(null);
            this._criticals.centerLeg = Array(6).fill(null);
            // Clear quad layout tracks
            this._criticals.frontLeftLeg = [];
            this._criticals.frontRightLeg = [];
        } else {
            // Safe Default Fallback: Standard Biped layout array profiles
            this._criticals.leftArm = Array(12).fill(null);
            this._criticals.rightArm = Array(12).fill(null);
            this._criticals.leftLeg = Array(6).fill(null);
            this._criticals.rightLeg = Array(6).fill(null);
            this._criticals.centerLeg = [];
            this._criticals.frontLeftLeg = [];
            this._criticals.frontRightLeg = [];
        }
        this._unallocatedCriticals = [];

        // Add required components....
        if( this._smallCockpit) {
            this._addCriticalItem( "life-support", "Life Support", 1, "hd", 0);
            this._addCriticalItem( "sensors", "Sensors", 1, "hd", 1);
            this._addCriticalItem( "cockpit", "Cockpit", 1, "hd", 2);
            this._addCriticalItem( "sensors", "Sensors", 1, "hd", 3);
        } else {
            this._addCriticalItem( "life-support", "Life Support", 1, "hd", 0);
            this._addCriticalItem( "sensors", "Sensors", 1, "hd", 1);
            this._addCriticalItem( "cockpit", "Cockpit", 1, "hd", 2);
            this._addCriticalItem( "sensors", "Sensors", 1, "hd", 4);
            this._addCriticalItem( "life-support", "Life Support", 1, "hd", 5);
        }
        if (typeTag === "quad" || typeTag === "quadvee") {
            // ---- QUAD / QUADVEE FRONT LEGS ----
            // Front Right Leg Actuators (replaces old arm hacks with direct location tracking keys)
            this._addCriticalItem("hip", "Hip", 1, "frl", 0);
            this._addCriticalItem("upper-leg-actuator", "Upper Leg Actuator", 1, "frl", 1);
            this._addCriticalItem("lower-leg-actuator", "Lower Leg Actuator", 1, "frl", 2);
            this._addCriticalItem("foot-actuator", "Foot Actuator", 1, "frl", 3);
            // Front Left Leg Actuators
            this._addCriticalItem("hip", "Hip", 1, "fll", 0);
            this._addCriticalItem("upper-leg-actuator", "Upper Leg Actuator", 1, "fll", 1);
            this._addCriticalItem("lower-leg-actuator", "Lower Leg Actuator", 1, "fll", 2);
            this._addCriticalItem("foot-actuator", "Foot Actuator", 1, "fll", 3);
        } else if (typeTag === "tripod") {
            // ---- TRIPOD ARMS & CONDITIONAL ACTUATORS ----
            // Tripods use standard arm actuators, but some configurations can completely drop arms.
            // Check if the current layout allocates structural space for them before populating.
            const rightArmIS = this._internalStructure.rightArm ?? 0;
            const leftArmIS = this._internalStructure.leftArm ?? 0;
            if (leftArmIS > 0) {
                this._addCriticalItem("shoulder", "Shoulder", 1, "la", 0);
                this._addCriticalItem("upper-arm-actuator", "Upper Arm Actuator", 1, "la", 1);
                if (this.hasLowerArmActuator("la")) {
                    this._addCriticalItem("lower-arm-actuator", "Lower Arm Actuator", 1, "la", 2);
                    if (this.hasHandActuator("la")) {
                        this._addCriticalItem("hand-actuator", "Hand Actuator", 1, "la", 3);
                    }
                }
            }
            if (rightArmIS > 0) {
                this._addCriticalItem("shoulder", "Shoulder", 1, "ra", 0);
                this._addCriticalItem("upper-arm-actuator", "Upper Arm Actuator", 1, "ra", 1);
                if (this.hasLowerArmActuator("ra")) {
                    this._addCriticalItem("lower-arm-actuator", "Lower Arm Actuator", 1, "ra", 2);
                    if (this.hasHandActuator("ra")) {
                        this._addCriticalItem("hand-actuator", "Hand Actuator", 1, "ra", 3);
                    }
                }
            }
        } else {
            // ---- BIPED / LAM SELECTION (STANDARD FALLBACK) ----
            // Left Arm Actuators
            this._addCriticalItem("shoulder", "Shoulder", 1, "la", 0);
            this._addCriticalItem("upper-arm-actuator", "Upper Arm Actuator", 1, "la", 1);
            if (this.hasLowerArmActuator("la")) {
                this._addCriticalItem("lower-arm-actuator", "Lower Arm Actuator", 1, "la", 2);
                if (this.hasHandActuator("la")) {
                    this._addCriticalItem("hand-actuator", "Hand Actuator", 1, "la", 3);
                }
            }
            // Right Arm Actuators
            this._addCriticalItem("shoulder", "Shoulder", 1, "ra", 0);
            this._addCriticalItem("upper-arm-actuator", "Upper Arm Actuator", 1, "ra", 1);
            if (this.hasLowerArmActuator("ra")) {
                this._addCriticalItem("lower-arm-actuator", "Lower Arm Actuator", 1, "ra", 2);
                if (this.hasHandActuator("ra")) {
                    this._addCriticalItem("hand-actuator", "Hand Actuator", 1, "ra", 3);
                }
            }
        }
        // Define baseline structural data constraints for our vroomie vrooms...
        let engineCrits: ICriticalLocations = { ct: 0, rt: 0, lt: 0 };
        const currentTechTag = this.getTech().tag;

        // Core Data Validation & Rollback Routing
        if (this._engineType.criticals && this._engineType.criticals[currentTechTag]) {
            engineCrits = this._engineType.criticals[currentTechTag];
        }

        // Fallback Check: Reset invalid or unvouched tech architectures immediately to standard
        if (!engineCrits || !engineCrits.ct || engineCrits.ct <= 3) {
            console.warn("Resetting engine to standard, engine not available for tech profile:", this._engineType?.criticals, currentTechTag);
            this.setEngineType("standard");
            if (this._engineType.criticals && this._engineType.criticals[currentTechTag]) {
                engineCrits = this._engineType.criticals[currentTechTag];
            } else {
                engineCrits = { ct: 6, rt: 0, lt: 0 }; 
            }
        }
        const engineName = this._engineType.name;
        // FIRST ENGINE BLOCK (Slots 1-3): Seats the upper drive mechanism
        // If an engine takes 6 slots, we limit the first sequential chunk to exactly 3 slots. Currently unless I can find something canonical or homebrew somewhere
        const engineCriticalTorso = engineCrits.ct ?? 0;
        const initialEngineAllocation = engineCriticalTorso > 3 ? 3 : engineCriticalTorso;
        if (initialEngineAllocation > 0) {
            this._addCriticalItem(
                "engine", 
                engineName, 
                initialEngineAllocation, 
                "ct"
            );
        }
        // GYRO POSITIONING (Slots 4-6): Injected immediately below the upper engine core as is tradition and as I saw all the way back in 1989.
        this._addCriticalItem(
            "gyro", 
            this._gyro.name, 
            this._gyro.criticals, 
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
        // TORSO SHIELDING: Distribute side shield critical slots
        if (engineCrits.rt) {
            this._addCriticalItem("engine", engineName, engineCrits.rt, "rt");
        }
        if (engineCrits.lt) {
            this._addCriticalItem("engine", engineName, engineCrits.lt, "lt");
        }

        // STANDARD & REAR LEGS: Track Left Leg (ll) and Right Leg (rl) structural presence. Am I standing?
        const leftLegIS = this._internalStructure.leftLeg ?? 0;
        const rightLegIS = this._internalStructure.rightLeg ?? 0;
        if (leftLegIS > 0) {
            this._addCriticalItem("hip", "Hip", 1, "ll", 0);
            this._addCriticalItem("upper-leg-actuator", "Upper Leg Actuator", 1, "ll", 1);
            this._addCriticalItem("lower-leg-actuator", "Lower Leg Actuator", 1, "ll", 2);
            this._addCriticalItem("foot-actuator", "Foot Actuator", 1, "ll", 3);
        }
        if (rightLegIS > 0) {
            this._addCriticalItem("hip", "Hip", 1, "rl", 0);
            this._addCriticalItem("upper-leg-actuator", "Upper Leg Actuator", 1, "rl", 1);
            this._addCriticalItem("lower-leg-actuator", "Lower Leg Actuator", 1, "rl", 2);
            this._addCriticalItem("foot-actuator", "Foot Actuator", 1, "rl", 3);
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
        let jump_move = this.getJumpSpeed();
        for( let jmc = 0; jmc < jump_move; jmc++) {
            this._unallocatedCriticals.push({
                uuid: generateUUID(),
                obj: null,
                name: this._jumpJetType.name,
                tag: "jj-" + this._jumpJetType.tag,
                rear: false,
                movable: true,
                crits: this._jumpJetType.criticals,
            });
        }

        // Armor
        let armorObj = this.getArmorObj();
        if( this.getTech().tag === "clan" ) {
            if( armorObj.crits.clan > 0) {
                // if( armorObj.critLocs) {
                //     for( let nameLoc in armorObj.critLocs) {
                //         this._addCriticalItem(
                //             armorObj.tag, // item_tag
                //             armorObj.name, // item_nickname
                //             armorObj.critLocs[nameLoc], // criticalCount
                //             nameLoc, // location
                //             null,// slot
                //             true, // movable
                //         );
                //     }
                // } else {
                    for( let aCounter = 0; aCounter < armorObj.crits.clan; aCounter++) {
                        this._unallocatedCriticals.push({
                            uuid: generateUUID(),
                            name: armorObj.name,
                            tag: armorObj.tag,
                            rollAgain: true,
                            rear: false,
                            crits: 1,
                            obj: armorObj,
                            movable: true
                        });
                    }
                // }
            }
        } else {
            if( armorObj.crits.is > 0) {
                // if( armorObj.critLocs ) {
                //     // console.log("Allocating Armor to first available slot", this.getName(), dontAllocateArmorCrits, armorObj.tag, )
                //     for( let nameLoc in armorObj.critLocs) {
                //         for( let count = 0; count < armorObj.critLocs[nameLoc]; count++) {
                //             this._addCriticalItem(
                //                 armorObj.tag, // item_tag
                //                 armorObj.name, // item_nickname
                //                 1, // criticalCount
                //                 nameLoc, // location
                //                 null,// slot
                //                 true, // movable
                //             );
                //         }
                //     }
                // } else {
                    // console.log("Adding Armor to unallocated", this.getName(), dontAllocateArmorCrits, armorObj.tag, )
                    for( let aCounter = 0; aCounter < armorObj.crits.is; aCounter++) {
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
                // }
            }
        }

        // Internal Structure critical Items
        if( this.getTech().tag === "clan" ) {
            for( let aCounter = 0; aCounter < this._selectedInternalStructure.crits.clan; aCounter++) {
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
            for( let aCounter = 0; aCounter < this._selectedInternalStructure.crits.is; aCounter++) {
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

        // Get optional equipment...
        // this._calcVariableEquipment();
        for( let elc = 0; elc < this._equipmentList.length; elc++) {
            // this._equipmentList[elc].location = "";
            let rearTag = "";
            let isRear = false;
            if( this._equipmentList[elc].rear) {
                rearTag = " (rear)";
                isRear = true;
            }


            this._unallocatedCriticals.push({
                // @ts-expect-error Legacy compatibility type mismatch                uuid: this._equipmentList[elc].uuid ? this._equipmentList[elc].uuid : "undefined?",
                name: this._equipmentList[elc].name + rearTag,
                tag: this._equipmentList[elc].tag,
                // loc: this._equipmentList[elc].location,
                rear: isRear,
                crits: this._equipmentList[elc].space.battlemech,
                obj: this._equipmentList[elc],
                movable: true,

            });


        }

        // Heat Sink Requirements
        let hs_requirements = this.getHeatSinkCriticalRequirements();
        let hs_nickname = "";
        if( hs_requirements.slotsEach > 1)
            hs_nickname = "Double Heat Sink";
        else
            hs_nickname ="Heat Sink";
        for( let hsc = 0; hsc < hs_requirements.number; hsc++) {

            this._unallocatedCriticals.push({
                obj: null,
                uuid: generateUUID(),
                name: hs_nickname,
                rear: false,
                tag: "heat-sink",
                crits: hs_requirements.slotsEach,
                movable: true
            });
        }

        // Allocate items per allocation table.
        // console.log( "_calc this._criticalAllocationTable", this._criticalAllocationTable);

        let criticalTally: Record<string, number> = {};
        this._sortCriticalAllocationTableByTagThenUUID();
        for( let item of this._criticalAllocationTable) {
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


    }

    public hasHandActuator(
        location: string,
    ) {
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

    public getMaxMovementHeat() {
        let maxMoveHeat = 2; // standard run heat.

        if( this.getJumpSpeed() > 2) {
            maxMoveHeat = this.getJumpSpeed();
        }

        // Stealth Armor
        if( this.getArmorType() === "stealth" ) {
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
        uuid: uuid
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

    private _isNextXCritsAvailable(
        areaArray: ICriticalSlot[],
        criticalCount: number,
        beginSlot: number,
        selfUUID: string,
    ): boolean {

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
        let placeholder: ICriticalSlot = {
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
    // CORE FIXED LOCATIONS: Head (6 slots) & Torsos (12 slots) are universal
    this._criticals.head = this._criticals.head.slice(0, 6);
    this._criticals.centerTorso = this._criticals.centerTorso.slice(0, 12);
    this._criticals.leftTorso = this._criticals.leftTorso.slice(0, 12);
    this._criticals.rightTorso = this._criticals.rightTorso.slice(0, 12);

    const typeTag = this._mechType.tag.toLowerCase();

    // DYNAMIC LIMB TRUNCATION: Clip arrays exactly to their structural rules profiles
    if (typeTag === "biped" || typeTag === "lam") {
        // Standard profiles: 12-slot manipulative arms and 6-slot driving legs
        this._criticals.leftArm = this._criticals.leftArm.slice(0, 12);
        this._criticals.rightArm = this._criticals.rightArm.slice(0, 12);
        this._criticals.leftLeg = this._criticals.leftLeg.slice(0, 6);
        this._criticals.rightLeg = this._criticals.rightLeg.slice(0, 6);
        // Wipe trailing advanced slots to ensure data cleanliness as we have been doing... 
        (this._criticals as any).centerLeg = [];
        (this._criticals as any).frontLeftLeg = [];
        (this._criticals as any).frontRightLeg = [];
    } else if (typeTag === "quad" || typeTag === "quadvee") {
        // Four-legged frames: 4 driving legs carrying exactly 6 inventory spaces each. No arms.
        (this._criticals as any).frontLeftLeg = ((this._criticals as any).frontLeftLeg ?? []).slice(0, 6);
        (this._criticals as any).frontRightLeg = ((this._criticals as any).frontRightLeg ?? []).slice(0, 6);
        this._criticals.leftLeg = this._criticals.leftLeg.slice(0, 6);   // Rear Left
        this._criticals.rightLeg = this._criticals.rightLeg.slice(0, 6); // Rear Right
        // Flush standard arm parameters
        this._criticals.leftArm = [];
        this._criticals.rightArm = [];
        (this._criticals as any).centerLeg = [];
    } else if (typeTag === "tripod") {
        // Tripods: 3 distinct 6-slot legs alongside two standard 12-slot weapon mount arms
        this._criticals.leftArm = this._criticals.leftArm.slice(0, 12);
        this._criticals.rightArm = this._criticals.rightArm.slice(0, 12);
        this._criticals.leftLeg = this._criticals.leftLeg.slice(0, 6);
        this._criticals.rightLeg = this._criticals.rightLeg.slice(0, 6);
        (this._criticals as any).centerLeg = ((this._criticals as any).centerLeg ?? []).slice(0, 6);
        // Flush quad tracks
        (this._criticals as any).frontLeftLeg = [];
        (this._criticals as any).frontRightLeg = [];
    } else {
        // Safe Architecture Fallback: Standard Biped profile clipping parameters
        this._criticals.leftArm = this._criticals.leftArm.slice(0, 12);
        this._criticals.rightArm = this._criticals.rightArm.slice(0, 12);
        this._criticals.leftLeg = this._criticals.leftLeg.slice(0, 6);
        this._criticals.rightLeg = this._criticals.rightLeg.slice(0, 6);
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

        for( let heatSink of mechHeatSinkTypes ) {
            if( heatSink.tag === newValue)
                this._heatSinkType = heatSink;
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

    public getWeaponHeat(): number {
        return +this._maxWeaponHeat;
    }

    public getActiveWeaponHeat(
        equipmentList: IEquipmentItem[] |  null = null
    ): number {
        if( equipmentList === null ) {
            equipmentList = this.equipmentList
        }
        let rv = 0;

        for( let eq of equipmentList) {
            if( eq.target ) {
                rv += +eq.heat;
            }
        }
        return rv;
    }

    public getTurnHeatDifference(
        equipmentList: IEquipmentItem[] |  null = null
    ): number {
        if( equipmentList === null ) {
            equipmentList = this.equipmentList
        }
        let rv = this.getActiveMoveHeat();
        rv += this.getActiveWeaponHeat(equipmentList);
        rv -= this.getActiveHeatDissipation();

        return rv;
    }

    public applyHeat() {
        this.currentHeat += this.getTurnHeatDifference();

        if( this.currentHeat < 0 ) {
            this.currentHeat = 0;
        }
    }

    public getActiveMoveHeat(): number {
        // TODO check if heat sinks are broken
        if( this.currentMovementMode === "w" ) {
            return 1;
        }
        if( this.currentMovementMode === "r" ) {
            return 2;
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

    public getHeatSummary(): number {
        // return  (10 + this._additionalHeatSinks) * this._heatSinkType.dissipation;
        return this.getMoveHeat() + this.getWeaponHeat() - this.getHeatDissipation()
    }

    public getWalkSpeed(): number {
        return this._walkSpeed;
    }

    public setWalkSpeed(
        walkSpeed: number,
    ) {
        this._walkSpeed = walkSpeed
        if (this._walkSpeed > 0) {
            this.setEngine(this._tonnage * this._walkSpeed);
        }

        if( this._jumpSpeed > this._walkSpeed)
            this.setJumpSpeed(this._walkSpeed);

        return this._walkSpeed;
    }

    public getRunSpeed() {
        return this._runSpeed;
    }

    public getJumpSpeed() {
        return this._jumpSpeed;
    }

    public setJumpSpeed(
        jumpSpeed: number,
    ) {
        this._jumpSpeed = +jumpSpeed;
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

    public setArmorType(armorTag: string) {
        for( let aCount = 0; aCount < mechArmorTypes.length; aCount++) {
            if( mechArmorTypes[aCount].tag === armorTag) {
                this._armorType = mechArmorTypes[aCount];
                this._calc();
            }
        }
        return this._armorType;
    }

    public setArmorCount( armorCount: number ) {

        // console.log("setArmorCount", armorCount)
        this._totalArmor = armorCount; // ;
        this._armorWeight = armorCount / 16

        // switch( this.getArmorType() ) {

        // default: // standard
        // _totalArmor = this._armorWeight * 16;
        // break;
        // }
        if( this.getTech().tag === "clan" ) {
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
            if( this.getTech().tag === "clan" ) {
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
        this._calc();
        return this._armorWeight;
    }

    public getEngine(): IEngineOption | null {
        return this._engine;
    }

    public setEngine(ratingNumber: number | string): any {
        // Explicit base-10 integer normalization to protect against string form inputs
        const parsedRating = typeof ratingNumber === "string" 
            ? Number.parseInt(ratingNumber, 10) 
            : Math.floor(ratingNumber);
        // Guard Clause: Exit immediately if the incoming data cannot resolve to a valid integer
        if (Number.isNaN(parsedRating) || parsedRating <= 0) {
            console.error(`setEngine failed: '${ratingNumber}' is not a valid engine rating integer.`);
            return 0;
        }
        // Scan engine options array using the normalized, type-safe integer
        for (const engine of mechEngineOptions) {
            if (engine.rating === parsedRating) {
                this._engine = engine;
                this._calc(); // Cascade down calculation rules only on a successful update
                return this._engine;
            }
        }

        // If an matching engine size doesn't exist in our catalog, alert the system and exit cleanly
        console.warn(`setEngine failed: Rating entry '${parsedRating}' could not be located in your options registry. Please submit a ticket on GitHub.`);
        return 0;
    }

    public getInternalStructureType() {
        return this._selectedInternalStructure.tag;
    }

    public getInternalStructure(): IResolvedInternalStructure {
        return this._internalStructure;
    }

    public setInternalStructureType(
        isTag: string,
    ) {
        for( let is of mechInternalStructureTypes) {
            if( isTag === is.tag) {
                this._selectedInternalStructure = is;
                return this._selectedInternalStructure;
            }
        }

        return null;
    }

    public getGyro() {
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

        if( typeof( this.criticalDamage ) === "undefined" ) {
            this.criticalDamage = {};
        }

        if( typeof( this.criticalDamage[location] ) === "undefined" ) {
            this.criticalDamage[location] = [];
        }

        let indexNumber = this.criticalDamage[location].indexOf( critSlotIndex );
        if( indexNumber === - 1 ) {
            this.criticalDamage[location].push( critSlotIndex );
        } else {
            this.criticalDamage[location].splice( indexNumber, 1);
        }

        this._calc();
    }

    public isCriticalDamaged(
        location: string,
        critSlotIndex: number
    ): boolean  {
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

    public setEra(
        eraTag: string,
    ) {

        for( let era of btEraOptions ) {
            if( eraTag === era.tag) {
                this._era = era;
                this._calc();
                return this._era;
            }
        }
        return null;
    }

    public getTech() {
        return this._tech;
    }

    public setTech(
        techTag: string,
    ) {
        for( let technology of btTechOptions ) {
            if( techTag === technology.tag) {
                this._tech = technology;
                this._calc();

                // set era to Clan Invasion (id 3) if the techID is 2 (Clan)
                // if( techID === 2 && this.getEra().id !== 3) {
                //     this.setEra(3);
                // }

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

    public setEngineType(
        engineTag: string,
    ) {
        for( let engine of mechEngineTypes) {
            if( engineTag.toLowerCase() === engine.tag) {
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
        for( let gyro of mechGyroTypes) {
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
        // default to Military Standard if tag not found.
        this._engineType = mechEngineTypes[0];
        return this._engineType;
    }
    public setEngineTypeByName(
        engineName: string,
    ) {
        for( let engine of mechEngineTypes) {
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
        for( let gyro of mechGyroTypes) {
            if( gyroType.toLowerCase() === gyro.tag) {
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

    getEngineName(): string {
        return this._engineType.name;
    }

    getHeatSyncName() {

        if( this._heatSinkType.tag === "single" ) {
            return "Single Heat Sinks";
        } else {
            return "Double Heat Sinks";
        }

    }

    getGyroName() {
        return this._gyro.name;
    }

    getName() {

        let name = "";
        if( this._name ) {
            name = " " + this._name;
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

    public toggleOmni() {
        this._omnimech = !this._omnimech;
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

        for( let area of Object.keys(this._criticals) )  {
            for( let crit of this._criticals[area] ) {
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

    public setTonnage(tonnage: number): number {
      this._tonnage = tonnage;
    
      // Get the current active mech configuration type tag key
      const mechTypeKey = this.getMechType().tag as keyof typeof this._selectedInternalStructure.perMechType;
      // Fetch the normalized structural data block for this specific tonnage
      const structureData = this._selectedInternalStructure.perMechType[mechTypeKey][this.getTonnage()];
      // Assigning core internal structure properties
      this._internalStructure.head = structureData.head;
      this._internalStructure.centerTorso = structureData.centerTorso;
      this._internalStructure.leftTorso = structureData.leftTorso;
      this._internalStructure.rightTorso = structureData.rightTorso;
      // Handling the alternate limb layouts (Arms vs. Front Legs)
      if ('leftArm' in structureData) {
        this._internalStructure.leftArm = structureData.leftArm ?? 0;
      } else {
        this._internalStructure.leftArm = 0;
      }
      if ('rightArm' in structureData) {
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

      // Establish core fixed armor allocations (Head maximum is 9; Torsos carry 2x internal structure)
      this._maxArmor = 9 + 
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

      this.setWalkSpeed(this._walkSpeed);
      this._calc();

      return this._tonnage;
    }

    public getMaxArmorTonnage(armorTag: string = "standard", techBase: "is" | "clan" = "is"): number {
      // Dynamically retrieve the absolute maximum armor points configured for this chassis layout
      const totalPoints = this.getMaxArmor();
    
      // Locate the armor data object by its unique tag identifier from our data file
      const armorData = mechArmorTypes.find(a => a.tag === armorTag);
    
      // Fall back to a standard 16 points/ton if tag is missing or data is malformed
      const pointsPerTon = armorData?.armorMultiplier[techBase] || 16;

      // Calculate raw fractional tonnage required
      const rawTonnage = totalPoints / pointsPerTon;
    
      // BattleTech armor must be purchased and allocated in half-ton (0.5) steps.
      // Multiplying by 2, rounding up, and dividing by 2 snaps it perfectly to the next half-ton.
      return Math.ceil(rawTonnage * 2) / 2;
    }

    public getMaxArmor(): number {
      // If _maxArmor was already calculated and cached during setTonnage(), return it
      if (this._maxArmor !== undefined && this._maxArmor > 0) {
        return this._maxArmor;
      }

      // Dynamic fallback calculation: Head maximum is 9; Torso locations carry 2x internal structure
      let totalMaxArmor = 9 +
        (this._internalStructure.centerTorso * 2) + 
        (this._internalStructure.leftTorso * 2) + 
        (this._internalStructure.rightTorso * 2);

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

    public setType(typeTag: string) {
      // Normalize to lowercase for clean matching
      const formattedTag = typeTag.toLowerCase();
    
      for (const mechType of mechTypeOptions) {
        if (mechType.tag.toLowerCase() === formattedTag) {
            this._mechType = mechType;
            
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

    public getTargetSummaryText(
        target: string
    ): string {
        let targetData = this.getTarget(target);

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
        let thinnedAllocations: ICriticalSlot[] = JSON.parse(JSON.stringify(this._criticalAllocationTable));


        for( let alloc of thinnedAllocations ) {
            delete alloc.obj
            delete alloc.damaged
        }

        let exportObject: IBattleMechExport = {


            // Non In-Play Variables
            // important info at the top for easy perusing
            model: this._model,
            name: this._name,
            tech: this._tech.tag,
            tech_label: this.getTech().name,
            tonnage: this.getTonnage(),
            as_role: this._alphaStrikeForceStats.role,
            as_value: this.getAlphaStrikeValue(),
            battle_value: this.getBattleValue(),
            c_bills: this.getCBillCost(),

            omnimech: this._omnimech,

            additionalHeatSinks: this._additionalHeatSinks,
            allocation: thinnedAllocations,
            armor_allocation: this._armorAllocation,
            armor_type: this.getArmorType(),
            armor_weight: this._armorWeight,
            engineType: this.getEngineType().tag,
            equipment: [],
            era: this._era.tag,
            features: [],
            gyro: this._gyro.tag,
            heat_sink_type: this.getHeatSinksType(),
            hideNonAvailableEquipment: this._hideNonAvailableEquipment,
            introductoryRules: this._introductoryRules,
            is_type: this.getInternalStructureType(),
            jumpSpeed: this._jumpSpeed,
            lastUpdated: this.lastUpdated,
            mechType: this._mechType.tag,
            mirrorArmorAllocations: this._mirrorArmorAllocations,
            nickname: this._nickname,
            strictEra: this._strictEra,
            uuid: this._uuid,
            walkSpeed: this._walkSpeed,
        };

        if( !noInPlayVariables ) {
            exportObject.as_custom_nickname = this._alphaStrikeForceStats.customName;
            exportObject.pilot = this._pilot.export();
            exportObject.armorBubbles = _armorBubbles;
            exportObject.criticalDamage = this.criticalDamage;
            exportObject.currentHeat = _currentHeat;
            exportObject.currentMovementMode =_currentMovementMode;
            exportObject.currentTargetJumpingMP =_currentTargetJumpingMP;
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
            if( noInPlayVariables ) {
                exportObject.equipment.push({
                    tag: this._equipmentList[countEQ].tag,
                    loc: this._equipmentList[countEQ].location,
                    // @ts-expect-error - yet another TS failure
                    allocationIndex: typeof(this._equipmentList[countEQ].allocationIndex) !== "undefined" ? this._equipmentList[countEQ].allocationIndex : -1,
                    // @ts-expect-error - yet another TS failure
                    allocationLocation: typeof(this._equipmentList[countEQ].allocationLocation) !== "undefined" ? this._equipmentList[countEQ].allocationLocation : "",
                    rear: this._equipmentList[countEQ].rear,
                    uuid: this._equipmentList[countEQ].uuid,
                    weight: this._equipmentList[countEQ].weight,
                    split_location: this._equipmentList[countEQ].split_location,

                });
            } else {
                exportObject.equipment.push({
                    tag: this._equipmentList[countEQ].tag,
                    loc: this._equipmentList[countEQ].location,
                    // @ts-expect-error - yet another TS failure
                    allocationIndex: typeof(this._equipmentList[countEQ].allocationIndex) !== "undefined" ? this._equipmentList[countEQ].allocationIndex : -1,
                    // @ts-expect-error - yet another TS failure
                    allocationLocation: typeof(this._equipmentList[countEQ].allocationLocation) !== "undefined" ? this._equipmentList[countEQ].allocationLocation : "",
                    rear: this._equipmentList[countEQ].rear,
                    weight: this._equipmentList[countEQ].weight,
                    uuid: this._equipmentList[countEQ].uuid,
                    target: this._equipmentList[countEQ].target,
                    resolved: this._equipmentList[countEQ].resolved,
                    damageClusterHits: this._equipmentList[countEQ].damageClusterHits,
                    split_location: this._equipmentList[countEQ].split_location,
                    currentAmmo: this._equipmentList[countEQ].currentAmmo,
                    selectedAmmoBinUUID: this._equipmentList[countEQ].selectedAmmoBinUUID,
                });
            }

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


            return exportObject;
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
        // let importObject: IBattleMechExport | null = null;
        let importObject: IBattleMechExport | null = null;
        try {
            importObject = JSON.parse(jsonString);

            if( importObject ) {
                return this.import( importObject );
            } else {
                return false
            }
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
            if( importObject.era)
                this.setEra(importObject.era);

            if( importObject.tech)
                this.setTech(importObject.tech);

            if( importObject.pilot)
                this._pilot = new Pilot(importObject.pilot);

            if( importObject.as_role)
                this.setASRole(importObject.as_role);

            if( importObject.armor_type)
                this.setArmorType(importObject.armor_type);

            if( importObject.as_custom_nickname)
                this.setASCustomName(importObject.as_custom_nickname);

            if( importObject.is_type)
                this.setInternalStructureType(importObject.is_type);

            if( importObject.walkSpeed)
                this.setWalkSpeed(importObject.walkSpeed);

            if( importObject.jumpSpeed)
                this.setJumpSpeed(importObject.jumpSpeed);

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

            if( importObject.armor_weight)
                this.setArmorWeight(importObject.armor_weight);

            if( importObject.armor_allocation)
                this._armorAllocation = importObject.armor_allocation;

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

                // Other features
            }

            if( importObject.equipment) {
                for( let countEQ = 0; countEQ < importObject.equipment.length; countEQ++) {

                    let importItem = importObject.equipment[countEQ];

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

                    // console.log("X", this.getName(), importItem.tag, importItem.split_location);
                    this.addEquipmentFromTag(
                        importItem.tag,
                        this.getTech().tag,
                        importItem.loc,
                        importItem.rear,
                        importItem.uuid,
                        importItem.target,
                        importItem.resolved,
                        undefined,
                        importItem.weight,
                        importItem.split_location,
                        importItem.currentAmmo,
                        importItem.selectedAmmoBinUUID,
                    );
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

            this._calc();
            return true;
        } else {
            return false;
        }

    }

    getEquipmentByUUID(
        uuid: string,
    ): IEquipmentItem | null {
        for( let eq of this._equipmentList ) {
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

        let equipmentList = this.getEquipmentList( equipmentListTag );

        if( equipmentList[equipmentIndex]) {

            let equipmentItem: IEquipmentItem = JSON.parse(JSON.stringify(equipmentList[equipmentIndex]));

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

        let equipmentList = this.getEquipmentList( equipmentListTag );

        for( let item of equipmentList ) {
            if(
                item.name.toLowerCase().trim() === equipmentName.toLowerCase().trim()
                    ||
                (item.alternateName && item.alternateName.toLowerCase().trim() === equipmentName.toLowerCase().trim() )
            ) {

                let equipmentItem: IEquipmentItem = JSON.parse(JSON.stringify( item ));

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
        }

        return null;
    };

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

        for( let item of equipmentList ) {
            if( equipmentTag === item.tag) {
                let equipmentItem: IEquipmentItem = JSON.parse(JSON.stringify(item));
                if( typeof(location) !== "undefined" )
                    equipmentItem.location = location;
                equipmentItem.rear = rear;
                equipmentItem.uuid = uuid;
                equipmentItem.target = target;
                equipmentItem.split_location = split_location;
                equipmentItem.resolved = false;

                if( currentAmmo === -1 && equipmentItem.isAmmo ) {
                    equipmentItem.currentAmmo = equipmentItem.ammoPerTon;
                } else {
                    equipmentItem.currentAmmo = currentAmmo;
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
                return equipmentItem;
            }
        }

        return null;
    };

    public removeEquipment(itemUUID: string | undefined) {

        if( itemUUID ) {
            for( let equipmentIndex in this._equipmentList ) {
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

    public hasXLEngine(): boolean {
        if(
            this._engineType && this._engineType.criticals
            && (
                (this._engineType.criticals.clan && this._engineType.criticals.clan.lt && this._engineType.criticals.clan.lt > 0)
                ||
                (this._engineType.criticals.clan && this._engineType.criticals.clan.rt && this._engineType.criticals.clan.rt > 0)
                ||
                (this._engineType.criticals.is && this._engineType.criticals.is.lt && this._engineType.criticals.is.lt > 0)
                ||
                (this._engineType.criticals.is && this._engineType.criticals.is.rt && this._engineType.criticals.is.rt > 0)
            )

        ) {
            return true;
        }

        return false;
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
            let damageSnarks: string[] = [
                "Massive hole in chest.",
                "Radiation leak, very dangerous.",
                "Where oh where did my reactor go?",
                "No Reactor. The 'mech will finally cool down!",
            ];
            return this._returnRandomString(damageSnarks);
        }

        if( this._structureInLocation( "hd" ) < 1 ) {
            let damageSnarks: string[] = [
                "Cockpit became a convertible",
                "Mechwarrior missing",
                "User error. Replace user.",
            ];
            return this._returnRandomString(damageSnarks);
        }


        if( this.engineHits() > 2 ) {
            let damageSnarks: string[] = [
                "Engine took too many hits",
                "Some days, even the engine has to take a nap.",
            ];
            return this._returnRandomString(damageSnarks);
        }
        if( this.gyroHits() > 2 ) {
            let damageSnarks: string[] = [
                "Oh man my mech can't keep it's liqueur!",
                "'mech drunk, can't stand",
            ];
            return this._returnRandomString(damageSnarks);
        }
        if( this.lifeSupportHits() > 0 ) {
            let damageSnarks: string[] = [
                "Mechwarrior can't breathe",
                "Needed to open a window to catch some air",
            ];
            return this._returnRandomString(damageSnarks);
        }
        if( this.sensorHits() > 1 ) {
            let damageSnarks: string[] = [
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
    ): IDamageResults[] {

        let rv: IDamageResults[] = [];

        // Check location armor
        // let armorDamage = true;
        // let structureDamage = false;

        let locationHasArmor = this._locationHasArmor(location);
        let locationHasStructure = this._locationHasStructure(location);
        while(
            !locationHasStructure &&
            !locationHasArmor &&
            location !== "ct" &&
            location !== "ctr" &&
            location !== "hd"
        ) {

            location = this._moveDamageLocationIn( location, rear );

            locationHasArmor = this._locationHasArmor(location);
            locationHasStructure = this._locationHasStructure(location);
        }

        if( locationHasArmor ) {
            let remainderDamage = this._takeArmorDamageAtLocation( location, amount );

            if( remainderDamage ) {
                // structureDamage = true;
                remainderDamage = this._takeStructureDamageAtLocation( location, remainderDamage )
                while(
                    remainderDamage > 0 &&
                    location !== "ct" &&
                    location !== "ctr" &&
                    location !== "hd"
                ) {
                    location = this._moveDamageLocationIn( location, rear );
                    remainderDamage = this._takeStructureDamageAtLocation( location, remainderDamage )
                }

            }
        } else if (locationHasStructure) {
            let remainderDamage = this._takeStructureDamageAtLocation( location, amount )
            while(
                remainderDamage > 0 &&
                location !== "ct" &&
                location !== "ctr" &&
                location !== "hd"
            ) {
                location = this._moveDamageLocationIn( location, rear );
                remainderDamage = this._takeStructureDamageAtLocation( location, remainderDamage )
            }

        }

        this._calc();
        return rv;

    }

    private _locationHasArmor(
        location: string
    ): boolean {
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
            for( let item of this._equipmentList ) {
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
            for( let item of this._equipmentList ) {
                if( item.uuid && item.uuid === itemUUID) {

                    item.rear = newValue;

                    for( let critAllItem of this._criticalAllocationTable ) {
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
        let srcLoc = fromLocation.toLowerCase().trim();
        let destLoc = toLocation.toLowerCase().trim();
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
        return this._moveItemToArea(
            fromLocationObj,
            fromItem,
            fromIndex,
            finalDestArray,
            toIndex,
            destLoc,
            fromItem.size || fromItem.crits || 1, // Dynamically evaluate size criteria parameters
            true                                  // Direct moves behave implicitly like a final segment block
        );
    }

    private _setEquipmentAllocation(
        uuid: string,
        allocationIndex: number,
        allocationLocation: string,
    ) {
        for( let item of this._equipmentList ) {
            if( item && item.uuid === uuid ) {
                item.allocationIndex = allocationIndex;
                item.allocationLocation = allocationLocation;
            }
        }
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

        // Determine Max Legal Slot Count for Target Location Component
        // Head and all leg configurations are locked to exactly 6 slots in BattleTech rules blueprints
        let maxLegalSlots = 12;
        if (
            normalizedTag === "hd" || 
            normalizedTag === "ll" || 
            normalizedTag === "rl" || 
            normalizedTag === "cl" || 
            normalizedTag === "fll" || 
            normalizedTag === "frl"
        ) {
            maxLegalSlots = 6;
        }

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
            fromLocation[fromIndex] = null;
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
        // Locate Equipment Object by its Definitive UUID Signature inside the Unallocated holding block
        for (let uaet_c = 0; uaet_c < this._unallocatedCriticals.length; uaet_c++) {
            const currentItem = this._unallocatedCriticals[uaet_c];
            if (currentItem && currentItem.uuid === equipmentUUID) {
                // Synchronize location coordinate bindings onto parent references safely
                if (currentItem.obj) {
                    currentItem.obj.location = normalizedLocation;
                }
                // Fallback back to native slots if no custom overrides are set
                const allocationSize = critSize < 0 ? (currentItem.crits || 1) : critSize;
                const placementSuccess = this._assignItemToArea(
                    targetCriticalArray,
                    currentItem,
                    allocationSize,
                    slotNumber,
                    normalizedLocation
                );
                // Cleanly extract item out of holding vector only on a verified placement success
                if (placementSuccess && removeFromUnallocated) {
                    this._unallocatedCriticals.splice(uaet_c, 1);
                }
                return placementSuccess;
            }
        }
        console.warn(`_allocateCritical failed: Component with UUID '${equipmentUUID}' could not be located in unallocated criticals inventory.`);
        return false;
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

    private _calcVariableEquipment() {
        for( let eqC = 0; eqC < this._equipmentList.length; eqC++) {
            if( this._equipmentList[ eqC ] && this._equipmentList[ eqC ].variableSize ) {

                let currentItem = this._equipmentList[ eqC ];

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

    public getAvailableEngines(): IEngineType[] {
        let returnValue: IEngineType[] = [];
        // Map all four possible tech tags back to their baseline lookup keys
        let lookupTag: "is" | "clan";
        switch (this._tech.tag) {
            case "clan":
            case "mclan":
                lookupTag = "clan";
                break;
            case "is":
            case "mis":
            default:
                lookupTag = "is";
                break;
        }
        for (let engine of mechEngineTypes) {
            // Enforce strict key verification against the normalized tech base
            if (engine.criticals && lookupTag in engine.criticals) {
                engine.available = this._itemIsAvailable(
                    engine.introduced, 
                    engine.extinct, 
                    engine.reintroduced
                );
                returnValue.push(engine);
            }
        }
        return returnValue;
    }

    public getAvailableGyros(): IGyro[] {
        let returnValue: IGyro[] = [];

        for(let gyro of mechGyroTypes ) {
            gyro.available = this._itemIsAvailable( gyro.introduced, gyro.extinct, gyro.reintroduced);

            returnValue.push( gyro );
        }

        return returnValue;
    }

    public getAvailableArmorTypes(): IArmorType[] {
        let returnValue: IArmorType[] = [];

        for(let armor of mechArmorTypes ) {
            armor.available = this._itemIsAvailable( armor.introduced, armor.extinct, armor.reintroduced);

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
        const eraEnd = this._era.yearEnd ?? Number.POSITIVE_INFINITY;
        if( introductionYear <= this._era.yearStart ) {
            if (ignoreExtinction) {
                return true;
            }
            if( extinctionYear > 0 && extinctionYear <= eraEnd ) {
                // item extinct, check to see if it was reintroduced
                if( reintroductionYear > 0 && reintroductionYear <= eraEnd ) {
                    return true;
                }
            } else {
                if( extinctionYear === 0 ) {
                    return true;
                }
            }
        }
        return false;
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

    public allocateArmorSane(): void {
        let totalArmor = this.getTotalArmor();
        const internalStructure = this.getInternalStructure();
        const maximumArmor = this.getMaxArmor();
        if (maximumArmor === 0 || totalArmor === 0) return;
        const percentage = totalArmor / maximumArmor;
        // Establish layout flags natively from our chassis choices
        const typeTag = this.getType().tag.toLowerCase();
        const hasArms = typeTag === "biped" || typeTag === "lam" || typeTag === "tripod";
        const isQuadStyle = typeTag === "quad" || typeTag === "quadvee";
        const isTripod = typeTag === "tripod";
        // Base structural estimations using explicit, available references
        const armArmor = hasArms ? Math.floor((internalStructure.rightArm || 0) * 2 * percentage) : 0;
        const torsoArmor = Math.floor(internalStructure.rightTorso * 1.75 * percentage);
        const rearArmor = Math.floor(internalStructure.rightTorso * 0.25 * percentage);
        // Legs require fallback math since base reference properties change across frames
        const referenceLegIS = internalStructure.rightLeg || internalStructure.frontRightLeg || 0;
        const legArmor = Math.floor(referenceLegIS * 2 * percentage);
        const centerTorsoArmor = Math.floor(internalStructure.centerTorso * 1.75 * percentage);
        const centerTorsoArmorRear = Math.floor(internalStructure.centerTorso * 0.25 * percentage);
        // Process allocations via structural availability checks
        // Head Allocation (Max 9 rule enforcement)
        let headArmor = hasArms ? armArmor : Math.floor(internalStructure.centerTorso * percentage);
        if (headArmor > 9) headArmor = 9;
        if (totalArmor >= headArmor) {
            this.setHeadArmor(headArmor);
            totalArmor -= headArmor;
        } else {
            this.setHeadArmor(0);
        }
        // Side Torsos Front & Rear
        if (totalArmor > torsoArmor) {
            this.setRightTorsoArmor(torsoArmor);
            totalArmor -= torsoArmor;
        }
        if (totalArmor > rearArmor) {
            this.setRightTorsoRearArmor(rearArmor);
            totalArmor -= rearArmor;
        }
        if (totalArmor > torsoArmor) {
            this.setLeftTorsoArmor(torsoArmor);
            totalArmor -= torsoArmor;
        }
        if (totalArmor > rearArmor) {
            this.setLeftTorsoRearArmor(rearArmor);
            totalArmor -= rearArmor;
        }
        // Dynamic Leg Allocation
        if (isQuadStyle) {
            const quadLegs: Array<keyof IArmorAllocation> = ["leftLeg", "rightLeg", "frontLeftLeg", "frontRightLeg"];
            quadLegs.forEach(legKey => {
                if (totalArmor > legArmor) {
                    switch (legKey) {
                        case "leftLeg":
                            this.setLeftLegArmor(legArmor);
                            break;
                        case "rightLeg":
                            this.setRightLegArmor(legArmor);
                            break;
                        case "frontLeftLeg":
                            this.setFrontLeftLegArmor(legArmor);
                            break;
                        case "frontRightLeg":
                            this.setFrontRightLegArmor(legArmor);
                            break;
                    }
                    totalArmor -= legArmor;
                }
            });
        } else {
            // Standard Biped/LAM legs plus Tripod's additional Center Leg
            if (totalArmor > legArmor) {
                this.setRightLegArmor(legArmor);
                totalArmor -= legArmor;
            }
            if (totalArmor > legArmor) {
                this.setLeftLegArmor(legArmor);
                totalArmor -= legArmor;
            }
            if (isTripod && totalArmor > legArmor) {
                this.setCenterLegArmor(legArmor);
                totalArmor -= legArmor;
            }
        }
        // Arm Allocation (Completely skipped for Quad / QuadVee)
        if (hasArms) {
            if (totalArmor > armArmor) {
                this.setRightArmArmor(armArmor);
                totalArmor -= armArmor;
            }
            if (totalArmor > armArmor) {
                this.setLeftArmArmor(armArmor);
                totalArmor -= armArmor;
            }
        }
        // Center Torso Rear
        if (totalArmor > centerTorsoArmorRear) {
            this.setCenterTorsoRearArmor(centerTorsoArmorRear);
            totalArmor -= centerTorsoArmorRear;
        } else {
            this.setCenterTorsoRearArmor(0);
        }
        // Center Torso Front Allocation (Use calculated base, then absorb the remainder)
        if (totalArmor >= centerTorsoArmor) {
            this.setCenterTorsoArmor(centerTorsoArmor);
            totalArmor -= centerTorsoArmor;
            // Add any remaining fractional or leftover points from the pool right here
            if (totalArmor > 0) {
                this.setCenterTorsoArmor(centerTorsoArmor + totalArmor);
                totalArmor = 0;
            }
        } else {
            // Fallback: If pool is heavily depleted, dump whatever is left
            this.setCenterTorsoArmor(totalArmor);
            totalArmor = 0;
        }
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
            head: 9, // Absolute standard max ceiling rule for Head locations
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
    }

    public getMaxCenterTorsoRearArmor(): number {
        return this.getInternalStructure().centerTorso * 2 - this.getArmorAllocation().centerTorso;
    }
    public getMaxCenterTorsoArmor(): number {
        return this.getInternalStructure().centerTorso * 2 - this.getArmorAllocation().centerTorsoRear;
    }

    public getMaxRightTorsoRearArmor(): number {
        return this.getInternalStructure().rightTorso * 2 - this.getArmorAllocation().rightTorso;
    }
    public getMaxRightTorsoArmor(): number {
        return this.getInternalStructure().rightTorso * 2 - this.getArmorAllocation().rightTorsoRear;
    }

    public getMaxLeftTorsoRearArmor(): number {
        return this.getInternalStructure().leftTorso * 2 - this.getArmorAllocation().leftTorso;
    }
    public getMaxLeftTorsoArmor(): number {
        return this.getInternalStructure().leftTorso * 2 - this.getArmorAllocation().leftTorsoRear;
    }

    public getAvailableEquipment(includeCustom: boolean = false): IEquipmentItem[] {
        let returnItems: IEquipmentItem[] = [];
        const techTag = this.getTech().tag;
        const clanAvailability = techTag === "clan" || techTag === "mclan";

        // Determine which equipment lists are eligible based on Tech base rules
        const includeClan = ["clan", "mclan", "mis"].includes(techTag); // We will want to watch this... 
        const includeIS = ["is", "mis", "mclan"].includes(techTag); // I may be doing these wrong
        // Process Clan items if active
        if (includeClan) {
            for (let item of getEquipmentListByTech("clan", includeCustom && !includeIS)) {
                item.criticals = item.space.battlemech;
                item.available = this._itemIsAvailable(item.introduced, item.extinct, item.reintroduced, clanAvailability);
                returnItems.push(item);
            }
        }
        // Process Inner Sphere items if active
        if (includeIS) {
            for (let item of getEquipmentListByTech("is", includeCustom)) {
                item.criticals = item.space.battlemech;
                item.available = this._itemIsAvailable(item.introduced, item.extinct, item.reintroduced);
                returnItems.push(item);
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
        console.log( "TODO mechOject toggleHeatBubble", clickLocation, clickIndex);
    }

    public lifeSupportHits(): number {
        let rv = 0;

        for( let critIndex in this._criticals.head ) {
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

    public engineHits(): number {
        let rv = 0;

        let lastName = "";
        for( let critIndex in this._criticals.centerTorso ) {

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
        for( let critIndex in this._criticals.leftTorso ) {

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
        for( let critIndex in this._criticals.rightTorso ) {

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

        return rv;
    }

    public gyroHits(): number {
        let rv = 0;


        let lastName = "";
        for( let critIndex in this._criticals.centerTorso ) {

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
        for( let critIndex in this._criticals.leftTorso ) {

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
        for( let critIndex in this._criticals.rightTorso ) {

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
    public sensorHits(): number {
        let rv = 0;

        for( let critIndex in this._criticals.head ) {
            if(
                this._criticals.head[critIndex]
                &&
                this._criticals.head[critIndex].name.toLowerCase().startsWith( "sensors" )
                &&
                this.isCriticalDamaged( "hd", +critIndex )
            ) {
                rv++;
            }
        }
        return rv;
    }

    public toggleISBubble(clickLocation: string, clickIndex: number): void {
        const targetProp = BattleMech.MECH_LOCATION_MAP[clickLocation];
        if (!targetProp) return;

        const bubbleArray = (this._structureBubbles as any)[targetProp];
        if (bubbleArray && bubbleArray[clickIndex] !== undefined) {
            bubbleArray[clickIndex] = !bubbleArray[clickIndex];
        }
    }

    public structureDamaged(clickLocation: string, clickIndex: number): boolean {
        const targetProp = BattleMech.MECH_LOCATION_MAP[clickLocation];
        if (!targetProp) return false;

        const bubbleArray = (this._structureBubbles as any)[targetProp];
        if (bubbleArray && bubbleArray[clickIndex] !== undefined) {
            return !bubbleArray[clickIndex];
        }
        return false;
    }   

    public armorDamaged(clickLocation: string, clickIndex: number): boolean {
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

        if( this._engineType.available === false ) {
            return true;
        }

        if( this._armorType.available === false ) {
            return true;
        }

        // if( this._heatSinkType.available === false ) {
        //     return true;
        // }

        for( let item of this.getInstalledEquipment() ) {

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

        let lines = importString.split( "\n" );

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
                    let splitLine = line.split( " " );

                    if( splitLine.length > 1 && !isNaN(+splitLine[0]) ) {

                        this.setAdditionalHeatSinks(+splitLine[0] - 10 )
                        this.setHeatSinksType( "double" )
                    }
                }
            }

            if( line.toLowerCase().startsWith( "single heat sinks: " )) {
                line = line.replace(/single heat sinks:/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    let splitLine = line.split( " " );

                    if( splitLine.length > 1 && !isNaN(+splitLine[0]) ) {

                        this.setAdditionalHeatSinks(+splitLine[0] - 10 )
                        this.setHeatSinksType( "single" )
                    }

                }
            }

            if( line.toLowerCase().startsWith( "heat sinks: " )) {
                line = line.replace(/heat sinks:/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    let splitLine = line.split( " " );

                    if( splitLine.length > 1 && !isNaN(+splitLine[0]) ) {

                        this.setAdditionalHeatSinks(+splitLine[0] - 10 )
                        this.setHeatSinksType( "single" )
                    }

                }
            }


            if( line.toLowerCase().startsWith( "armor factor: " )) {
                line = line.replace(/armor factor:/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    let splitLine = line.split( " " );

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
                    let splitLine = line.split( " " );

                    if( splitLine.length > 1 && +splitLine[1] > 0) {
                        this.setHeadArmor( +splitLine[1] )
                    }

                }
            }

            if( line.toLowerCase().startsWith( "center torso" ) && line.toLowerCase().indexOf( "(rear)" ) === -1 ) {
                line = line.replace(/center torso/ig, '').trim();
                if( line && line.indexOf( " " ) > - 1 ) {
                    line = line.replace(/ {2}/ig, ' ').trim();
                    let splitLine = line.split( " " );

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
                    let splitLine = line.split( " " );

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
                    let splitLine = line.split( " " );

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
                    let splitLine = line.split( " " );

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
                let lineSplit = line.split(' ');

                let equipmentLine = {
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
                        let nameSplit = equipmentLine.name.split( " " );
                        let count = +nameSplit[0];
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

                            for( let eqIndex in equipmentList ) {
                                let eq = equipmentList[eqIndex];

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
        return getEquipmentListByTech(equipmentListTag, includeCustom);
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
        this.currentMovementMode = "n"
        this.currentToHitMovementModifier = -1;
        this.damageLog = [];
        for( let item of this._equipmentList ) {
            item.resolved = false;
            item.damageClusterHits = [];
        }
    }

    public selectAmmoBin(
        weaponUUID: string,
        ammoUUID: string,
    ) {
        for( let eq of this._equipmentList ) {
            if( eq.uuid === weaponUUID  ) {
                eq.selectedAmmoBinUUID = ammoUUID;
            }
        }
    }
    public toggleResolved(
        eq_index: number
    ) {
        if( this._equipmentList.length > eq_index ) {
            this._equipmentList[eq_index].resolved = !this._equipmentList[eq_index].resolved;
            if( this._equipmentList[eq_index].selectedAmmoBinUUID  ) {
                if( this._equipmentList[eq_index].resolved )
                    this._decrementAmmoBin( this._equipmentList[eq_index].selectedAmmoBinUUID );
                else
                    this._incrementAmmoBin( this._equipmentList[eq_index].selectedAmmoBinUUID );
            }
        }
    }

    private _decrementAmmoBin( uuid: string | undefined ) {
        if( uuid ) {
            for( let eq of this._equipmentList ) {
                if( eq.uuid === uuid && eq.isAmmo && typeof(eq.currentAmmo) !== "undefined" && eq.currentAmmo > 0 ) {
                    eq.currentAmmo--;
                }
            }
        }
    }

    private _incrementAmmoBin( uuid: string | undefined ) {
        if( uuid ) {
            for( let eq of this._equipmentList ) {
                if( eq.uuid === uuid && eq.isAmmo && typeof(eq.currentAmmo) !== "undefined" && eq.currentAmmo > 0 ) {
                    eq.currentAmmo++;
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

    private _installSSWEquipment(
        item: any
    ) {

        let listTag = "is";
        let itemName = "";
        let location = "";
        let allocationIndex = -1;
        let rear = false;
        if( item.name &&  item.name["#text"].indexOf( "(IS) " ) > -1) {
            itemName = item.name["#text"].replace( "(IS) ", "" )
            listTag = "is";
        } else if( item.name &&  item.name["#text"].indexOf( "(CLAN) ") > -1 ) {
                itemName = item.name["#text"].replace( "(CLAN) ", "" )
                listTag = "clan";

        } else {
            itemName = item.name["#text"];
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
            location = item.location["#text"].toLowerCase().trim();

            if( typeof( item.location["@_index"]) !== "undefined" ) {
                allocationIndex =  +item.location["@_index"];
            }

        }
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


        if( itemName ) {

            let newItem = this.addEquipmentByName(
                itemName,
                listTag,
                location,
                rear,
                generateUUID(),
                undefined,
                item.splitlocation ? item.splitlocation : [],
            );

            if( !newItem ) {
                //TODO: Commenting out warning - Why is this firing  during alpha strike generation?
                //console.warn( "Cannot find any equipment named: '" + itemName + "'" );
                this._sswImportErrors.push( "Cannot find any equipment named: '" + itemName + "'" )
            } else {



                if( halfTon ) {
                    newItem.weight = .5;
                }

                newItem.allocationIndex = allocationIndex;
                newItem.allocationLocation = location;
                newItem.location = "un";
                newItem.rear = rear;
                newItem.split_location = [];


                if( item.splitlocation ) {
                    for( let split of item.splitlocation ) {

                        newItem.split_location.push(
                            {
                                loc: split["#text"].toLowerCase(),
                                index: +split["@_index"],
                                size: +split["@_number"],
                            }
                        )
                    }
                }
            }
        }
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

        this._sswImportErrors = [];



        const options = {
            ignoreAttributes : false
        };
        const parser = new XMLParser(options);
        let jObj = parser.parse(ssw_xml);

        // console.log( "battlemech.importSSWXML() jObj", jObj)
        if( jObj && jObj.mech && jObj.mech.mech_type === "BattleMech") {
            this.reset();

            if( jObj.mech.motive_type && jObj.mech.motive_type === "Quad" ) {
                this.setMechType("quad");
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
                if( jObj.mech.techbase["#text"].toLowerCase().indexOf("inner") > -1) {
                    this.setTech("is");
                } else if( jObj.mech.techbase["#text"].toLowerCase().indexOf("clan") > -1) {
                    this.setTech("clan");
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

            if( jObj.mech.armor ) {
                let totalArmor = 0;
                // It sure would be nice for SSW to have the armor weight in XML file 🙄
                if( jObj.mech.armor.ct ) {
                    this._armorAllocation.centerTorso = jObj.mech.armor.ct;
                    totalArmor += this._armorAllocation.centerTorso;
                }
                if( jObj.mech.armor.ctr ) {
                    this._armorAllocation.centerTorsoRear = jObj.mech.armor.ctr;
                    totalArmor += this._armorAllocation.centerTorsoRear;
                }
                if( jObj.mech.armor.hd ) {
                    this._armorAllocation.head = jObj.mech.armor.hd;
                    totalArmor += this._armorAllocation.head;
                }
                if( jObj.mech.armor.la ) {
                    this._armorAllocation.leftArm = jObj.mech.armor.la;
                    totalArmor += this._armorAllocation.leftArm;
                }
                if( jObj.mech.armor.ll ) {
                    this._armorAllocation.leftLeg = jObj.mech.armor.ll;
                    totalArmor += this._armorAllocation.leftLeg;
                }
                if( jObj.mech.armor.lt ) {
                    this._armorAllocation.leftTorso = jObj.mech.armor.lt;
                    totalArmor += this._armorAllocation.leftTorso;
                }
                if( jObj.mech.armor.ltr ) {
                    this._armorAllocation.leftTorsoRear = jObj.mech.armor.ltr;
                    totalArmor += this._armorAllocation.leftTorsoRear;
                }
                if( jObj.mech.armor.ra ) {
                    this._armorAllocation.rightArm = jObj.mech.armor.ra;
                    totalArmor += this._armorAllocation.rightArm;
                }
                if( jObj.mech.armor.rl ) {
                    this._armorAllocation.rightLeg = jObj.mech.armor.rl;
                    totalArmor += this._armorAllocation.rightLeg;
                }
                if( jObj.mech.armor.rt ) {
                    this._armorAllocation.rightTorso = jObj.mech.armor.rt;
                    totalArmor += this._armorAllocation.rightTorso;
                }
                if( jObj.mech.armor.rtr ) {
                    this._armorAllocation.rightTorsoRear = jObj.mech.armor.rtr;
                    totalArmor += this._armorAllocation.rightTorsoRear;
                }
                if( jObj.mech.armor.type ) {
                    if( jObj.mech.armor.type === "Standard Armor" ) {
                        this.setArmorType( "standard" )
                    } else if( jObj.mech.armor.type === "Ferro Fibrous" ) {
                        this.setArmorType( "ferro-fibrous" )
                    } else if( jObj.mech.armor.type === "Ferro-Fibrous" ) {
                        this.setArmorType( "ferro-fibrous" )
                    } else if( jObj.mech.armor.type === "Light Ferro Fibrous" ) {
                        this.setArmorType( "light-ferro-fibrous" )
                    } else if( jObj.mech.armor.type === "Light Ferro-Fibrous" ) {
                        this.setArmorType( "light-ferro-fibrous" )
                    } else if( jObj.mech.armor.type === "Heavy Ferro Fibrous" ) {
                        this.setArmorType( "heavy-ferro-fibrous" )
                    } else if( jObj.mech.armor.type === "Heavy Ferro-Fibrous" ) {
                        this.setArmorType( "heavy-ferro-fibrous" )
                    } else if( jObj.mech.armor.type.indexOf( "Stealth" )  > -1) {
                        this.setArmorType( "stealth" )
                    }

                    this.setArmorCount( totalArmor );


                    if( typeof(  jObj.mech.armor.location ) === "object" ) {
                        this._calcCriticals();


                        for( let loc of jObj.mech.armor.location ) {
                            let foundIndex = -1;


                            for( let critItemIndex in this._unallocatedCriticals ) {
                                if(
                                    this._unallocatedCriticals[critItemIndex]
                                    && this._unallocatedCriticals[critItemIndex].tag === this.getArmorType()
                                ) {
                                    foundIndex = +critItemIndex;
                                    break;
                                }
                            }

                            this.moveCritical(
                                "un",
                                foundIndex,
                                loc["#text"] ? loc["#text"].toLowerCase().trim() : "un",
                                loc["@_index"] ? +loc["@_index"] : -1,

                            )
                        }

                    }


                }
            }

            if( jObj.mech.engine ) {
                this.setWalkSpeed( +jObj.mech.engine["@_rating"] / this._tonnage );
                this.setEngineTypeByName( jObj.mech.engine["#text"] );
            }

            if( jObj.mech.gyro ) {
                this.setGyroTypeByName( jObj.mech.gyro["#text"] );
            }

            if( jObj.mech.baseloadout ) {


                if( jObj.mech.baseloadout.clancase ) {

                }

                if( jObj.mech.baseloadout.equipment && jObj.mech.baseloadout.equipment.length > 0 ) {

                    for( let item of jObj.mech.baseloadout.equipment ) {
                        this._installSSWEquipment( item );
                    }

                    this._calcCriticals();

                    for( let item of this._equipmentList ) {
                        let foundIndex = -1;
                        for( let critItemIndex in this._unallocatedCriticals ) {
                            if( this._unallocatedCriticals[critItemIndex] && this._unallocatedCriticals[critItemIndex].tag === item.tag ) {

                                foundIndex = +critItemIndex;
                                break;
                            }
                        }


                        let success = this.moveCritical(
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
                    }

                } else {
                    if( jObj.mech.baseloadout.equipment ) {
                        // a single weapon?!?!
                        this._installSSWEquipment( jObj.mech.baseloadout.equipment );


                        this._calcCriticals();

                        for( let item of this._equipmentList ) {
                            let foundIndex = -1;
                            for( let critItemIndex in this._unallocatedCriticals ) {
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
                        }
                    }
                }

                if( jObj.mech.baseloadout.heatsinks ) {

                    if( jObj.mech.baseloadout.heatsinks["type"].toLowerCase().indexOf("single") > -1)
                        this.setHeatSinksType( "single" )
                    else
                        this.setHeatSinksType( "double" )

                    this.setAdditionalHeatSinks( (+ jObj.mech.baseloadout.heatsinks["@_number"] ) - 10 );

                    if( typeof(  jObj.mech.baseloadout.heatsinks.location ) === "object" ) {
                        this._calcCriticals();

                        try {
                            for( let loc of jObj.mech.baseloadout.heatsinks.location ) {
                                let foundIndex = -1;


                                    for( let critItemIndex in this._unallocatedCriticals ) {
                                        if( this._unallocatedCriticals[critItemIndex] && this._unallocatedCriticals[critItemIndex].tag === "heat-sink" ) {
                                            foundIndex = +critItemIndex;
                                            break;
                                        }
                                    }


                                if( foundIndex > -1 ) {

                                    this.moveCritical(
                                        "un",
                                        foundIndex,
                                        loc["#text"] ? loc["#text"].toLowerCase().trim() : "un",
                                        loc["@_index"] ? +loc["@_index"] : -1,
                                    );
                                }


                            }
                        }

                        catch {
                            let foundIndex = -1;


                            for( let critItemIndex in this._unallocatedCriticals ) {
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

                    let jumpJetNumber = jObj.mech.baseloadout.jumpjets["@_number"];
                    this.setJumpSpeed(jumpJetNumber);
                    this._calcCriticals();

                    let jjType = "jj-standard";

                    if( jObj.mech.baseloadout.jumpjets.type && jObj.mech.baseloadout.jumpjets.type.toLowerCase().indexOf("improved") > -1 ) {
                        jjType = "jj-improved";
                    }
                    for( let loc of jObj.mech.baseloadout.jumpjets.location ) {
                        let foundIndex = -1;

                        for( let critItemIndex in this._unallocatedCriticals ) {
                            if( this._unallocatedCriticals[critItemIndex] && this._unallocatedCriticals[critItemIndex].tag === jjType ) {
                                foundIndex = +critItemIndex;
                                break;
                            }
                        }

                        if( foundIndex > -1 ) {
                            this.moveCritical(
                                "un",
                                foundIndex,
                                loc["#text"] ? loc["#text"].toLowerCase().trim() : "un",
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

            this._calc();
            this.calcAlphaStrike();

            if( this._unallocatedCriticals && this._unallocatedCriticals.length > 0 ) {
                this.sswImportErrors.push("Unallocated Criticals: " + this._unallocatedCriticals.length);
                for( let crit of this._unallocatedCriticals ) {
                    this.sswImportErrors.push("- " + crit.name + " (" + crit.tag + ")");
                }

            }
        }
    }

    public get sswImportErrors(): string[] {
        return this._sswImportErrors;
    }



    public getTotalBVFrontWeapons(): number {


        let rv = 0;
        for( let eq of this._equipmentList ) {
            if(
                eq.location &&
                (
                    eq.location === "ct"
                    ||
                    eq.location === "lt"
                    ||
                    eq.location === "rt"
                    ||
                    eq.location === "rl"
                    ||
                    eq.location === "ll"
                    ||
                    eq.location === "hd"
                )
                &&
                !eq.rear
            ) {
                rv += eq.battleValue ? eq.battleValue : 0
            }
        }

        return rv;
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

        let rv = 0;
        for( let eq of this._equipmentList ) {
            if(
                eq.location
                &&
                (
                    eq.location === "ct"
                    ||
                    eq.location === "lt"
                    ||
                    eq.location === "rt"
                    ||
                    eq.location === "rl"
                    ||
                    eq.location === "ll"
                    ||
                    eq.location === "hd"
                    ||
                    eq.location === "frl"
                    ||
                    eq.location === "fll"
                    ||
                    eq.location === "cl"
                )
                && eq.rear
            ) {
                rv += eq.battleValue ? eq.battleValue : 0
            }
        }

        return rv;
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

        let toLocation = this._getToLocationFromTag( toLocTag );

        if( toIndex === -1 ) {

            for( let itemIndex = 0; itemIndex < toLocation.length; itemIndex++ ) {

                if( toLocation[itemIndex] === null || typeof(toLocation[itemIndex]) === "undefined" ) {

                    toIndex = +itemIndex;
                    break;
                }

            }
            if( toIndex === -1 ) {

                let numSlots = 12;
                if(
                    toLocTag === "ll"
                    ||  toLocTag === "rl"
                    ||  toLocTag === "hd"
                ) {
                    numSlots = 6;
                }

                if( toLocation.length < numSlots) {
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



  function sortByAdjustedBVThenHeat(
      a: IEquipmentItem,
      b: IEquipmentItem,
      mech: BattleMech,
) {

    let aBattleValue = a.battleValue ? a.battleValue : 0;
    let bBattleValue = b.battleValue ? b.battleValue : 0;

    if( mech && a.rear && mech.getTotalBVFrontWeapons() >= mech.getTotalBVRearWeapons()) {
        aBattleValue = aBattleValue / 2;
    } else if( mech && !a.rear && mech.getTotalBVFrontWeapons() < mech.getTotalBVRearWeapons()) {
        aBattleValue = aBattleValue / 2;
    }

    if( mech && b.rear && mech.getTotalBVFrontWeapons() >= mech.getTotalBVRearWeapons() ) {
        bBattleValue = bBattleValue / 2;
    } else if( mech && !b.rear && mech.getTotalBVFrontWeapons() < mech.getTotalBVRearWeapons()) {
        bBattleValue = bBattleValue / 2;
    }

    if(  aBattleValue < bBattleValue )
        return 1;
    if(  aBattleValue > bBattleValue )
        return -1;



    if( a.heat < b.heat )
        return 1;
    if( a.heat > b.heat )
        return -1;


    // if( a.rear < b.rear )
    //     return -1;
    // if( a.rear > b.rear )
    //     return 1;

    return 0;
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