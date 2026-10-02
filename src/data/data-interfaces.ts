import { IClusterHit } from "../classes/battlemech";
import type { VariableEquipmentFormula } from "./variable-equipment";

export interface IArmorUnitTypes {
    battlemech: boolean;
    protomech: boolean;
    combatVehicle: boolean;
    supportVehicle: boolean;
    aerospaceFighter: boolean;
    smallCraft: boolean;
    dropShip: boolean;
    battleArmor: boolean;
    jumpShip: boolean;
    warShip: boolean;
}

export type ArmorCriticalLocationsByChassis = Partial<Record<
    "biped" | "quad" | "tripod" | "lam" | "quadvee",
    Partial<Record<keyof ICriticalLocations, number>>
>>;

export interface IArmorType {
	tag: string;
	/** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
	altTags?: string[];
	name: string;
    unitTypes: IArmorUnitTypes;
    constructionStatus?: "implemented" | "deferred";
    constructionMode?: "base" | "equipment";
    alphaStrikeAbility?: string;
    crits: {
        [key: string]: number;
    },
	armorMultiplier: {
		clan: number;
		is: number;
	},
	costMultiplier: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
    /** Multiplier on the armor factor in the defensive BV (TM p.302, TO:AUE; e.g. Hardened 2, Reactive 1.5). */
    bvMultiplier?: number;
    /** An IndustrialMech armor grade (Commercial, Industrial): not for BattleMechs (TM p.72). */
    industrialMechOnly?: boolean;
    /** IO prototype year; with `introduced: null` the armor exists only as a prototype. */
    prototype?: number;
    /** Clan availability window when it differs from the Inner Sphere dates above. */
    clanDates?: ITechDates;
    book?: string;
    page?: number | null;
    notes?: string;
    critLocs?: ArmorCriticalLocationsByChassis;
    available?: boolean;
    availableAsPrototype?: boolean;
}

export interface IEngineOption {
	name: string;
	rating: number;
	weight: {
        standard: number;
        xl: number;
        clan_xl: number;
        light: number;
        /** Absent above rating 400: compact engines cannot be large engines. */
        compact?: number;
        xxl: number;
        clan_xxl: number;
        ice: number;
        /** Absent above rating 400: there are no large fuel cell or fission engines (TO:AUE p.120). */
		cell?: number;
		fission?: number;
        /** Absent where the primitive-adjusted rating exceeds 400: primitive engines cannot be large engines. */
        primitive?: number;
	}
}

export interface ICriticalLocations {
	hd?: number,
	ct?: number,
	ra?: number,
	rt?: number,
	rl?: number,
	la?: number,
	lt?: number,
	ll?: number,
    cl?: number,
    fll?: number,
    frl?: number,
}

export interface IEngineType {
	tag: string;
	/** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
	altTags?: string[];
	name: string;
    alternateName?: string;
	costMultiplier: number;
    /** IO prototype year, when it precedes `introduced`; offered at the Experimental rules level. */
    prototype?: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
    criticals: {
        [key: string]: ICriticalLocations;
    },
    rating: number;
    available?: boolean;
    /** Set when the engine is offered only as an Experimental prototype. */
    availableAsPrototype?: boolean;
    /** Rulebook abbreviation for the construction rule (TM, TO:AUE, IO). */
    book?: string;
    /** Printed page in `book`. */
    page?: number;
    /** Large engine records only: tag of the engine type this is the over-400 form of. */
    largeOf?: string;
}

export interface IDamagePerRange {
    short: number;
    medium: number;
    long: number;
    aeroShort: number;
    aeroMedium: number;
    aeroLong: number;
}

export interface IAccuracyModifier {
    short: number;
    medium: number;
    long: number;
}

export interface IRangeNumbers {
    min?: number;
    short: number;
    medium: number;
    long: number;
    extreme?: number;
    maxMapSheets?: number;
}

export interface ISplitLocation {
    loc: string;
    index: number;
    size: number;
}

export interface IAmmoProfile {
    damagePerMissile: number;
    range: IRangeNumbers;
    alphaStrikeDamage: {
        short: number;
        medium: number;
        long: number;
        extreme: number;
    };
}

export interface IEquipmentItem {
    catalog?: "is" | "clan" | "custom" | "universal";
    metadata?: IEquipmentMetadata;
    split_location?: ISplitLocation[];
    isRotary?: boolean;
    isStreak?: boolean;
    isUltra?: boolean;
    isSpecialAmmo?: boolean;
    isModularArmor?: boolean;
    additionalArmor?: number;
    currentAdditionalArmor?: number;
    needsAmmo?: boolean;
    uuid?: string;
    resolved?: boolean;
    damageClusterHits?: IClusterHit[];
    count?: number;
    allocationIndex?: number;
    allocationLocation?: string;
    notes?: string;
    target?: string;
    name: string;
    isEquipment?: boolean;
    isAmmo?: boolean;
    alternateName?: string;
    altNames?: string[];
    tag: string;
    altTags?: string[];
    sort: string;
    category: string;
    currentAmmo?: number;
    selectedAmmoBinUUID?: string;
    bvHeat?: number;
    damage?: number | IDamagePerRange;
    damagePerShot?: boolean;
    damageBonus?: number;
    rangeAero?: string;
    heatPerShot?: boolean;
    damageAero?: number;
    isOneShot?: boolean;
    damagePerCluster?: number;
    damageClusters?: number;
    ammoPerShot?: number;
    ammoTypes?: string[];
    ammoProfile?: IAmmoProfile;
    accuracyModifier?: number | IAccuracyModifier;
    accuracyModifiier?: number;
    cbills: number;
    cbillsOneShot?: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
    battleValue?: number;
    battleValueDefensive?: boolean;
    battleValueOneShot?: number;
    heat: number;
    heatAero: number;
    weight: number;
    range: IRangeNumbers,
    space: ICriticalSpace,
    /** IO prototype year when it precedes `introduced` (production); available only at Experimental rules. */
    prototype?: number;
    /** Set on listed equipment when it is available only as an Experimental prototype. */
    availableAsPrototype?: boolean;
    /** Ammunition: rounds (missiles, slugs, pods) in one ton. */
    roundsPerTon?: number;
    /** Weapons: published number of times the weapon fires from one ton of its ammunition. */
    shotsPerTon?: number;
    /** Weapons: published shots per ton keyed by ammo family/tag, for launchers whose count depends on the ammo (MML). */
    shotsPerTonByAmmo?: Record<string, number>;
    /** Weapons: BV per ton of this weapon's standard ammunition (TM/TO per-launcher ammo BV). */
    ammoBattleValue?: number;
    /** Special munitions: multiplier on the launcher's ammo BV (TO:AUE munition BV). */
    battleValueMultiplier?: number;
    /**
     * Special munitions whose BV per ton is published per launcher, not as a multiplier: keyed by the
     * launcher family and rack size ("lrm-5", "srm-6", "mml-9").
     */
    battleValueByLauncher?: Record<string, number>;
    /** Minefield munitions: BV per ton comes from the launcher's rack size and shots (TO:AUE pp.185, 197-198). */
    minefieldBattleValue?: "thunder" | "thunder-augmented" | "thunder-inferno" | "thunder-vibrabomb" | "thunder-active" | "fascam";
    /** Weapon arrays (MG Array): tags of the weapons it links in its own location; its BV derives from them. */
    linkedWeaponTags?: string[];
    /** Ammunition bins in a unit: tag of the weapon this bin is loaded for. */
    feedsWeaponTag?: string;
    /** @deprecated Legacy field; read only to import older records. Use roundsPerTon (ammo) or shotsPerTon (weapons). */
    ammoPerTon?: number;
    minAmmoTons?: number;
    explosive?: boolean;
    gauss?: boolean;
    /**
     * Slots that take the -1 explosive component BV penalty, when not all of them:
     * an HVAC counts as a Gauss weapon "with one critical slot" (TO:AUE p.195, footnote Q).
     */
    explosiveBattleValueSlots?: number;
    weaponType?: string[];
    techRating?: string;
    unique?: boolean;
    book: string;
    /** Rulebook page; null when the page has not been verified in the book. */
    page: number | null;
    alphaStrike: {
        specialAbility?: string[];
        damageAoE?: number;
        heat: number;
        rangeShort: number;
        rangeMedium: number;
        rangeLong: number;
        rangeExtreme: number;
        tc: boolean;
        notes: string[];
    };
    battleValuePerItemDamage?: number;
    requiresHandActuator?: boolean;

    weightDivisor?: number;
    damageDivisor?: number;
    criticalsDivisor?: number;

    variableSize?: boolean;
    /** Sizing rule for variable equipment (see variable-equipment.ts); implies variableSize. */
    variableFormula?: VariableEquipmentFormula;
    /** Each critical slot is placed on its own (spread across locations), e.g. Null Signature System. */
    spreadSlots?: boolean;
    /** Label for a user-chosen size on the installed item (e.g. "Jump MP"); its value is `size`. */
    sizeLabel?: string;
    /** Largest size the picker offers. */
    sizeMax?: number;
    /** Size chosen for this installed item (see sizeLabel). */
    size?: number;
    isMelee?: boolean;
    costPerItemTon?: number;
    location?: string;
    rear?: boolean;
    criticals?: number;
    available?: boolean;
    rulesLevel?: number;
    /** OmniMech base-chassis (fixed) equipment; everything else on an OmniMech is pod-mounted. */
    omniFixed?: boolean;
    /** 'Mech chassis types (mech-type tags) this item may be mounted on, e.g. ["lam"]; unset = any. */
    chassisTypes?: string[];
    /** Most copies of this item one unit may mount (e.g. LAM Bomb Bays, 20). */
    maxPerUnit?: number;
    /** Items sharing a group count together against `maxPerUnit` (the two RISC Viral Jammers: one of any type). */
    maxPerUnitGroup?: string;
    /**
     * HarJel repair systems: multiplier on the armor Battle Value of the location the item sits in,
     * stacking with the armor type's own (IO:AE p.185). Each slot also takes 1 off the Defensive BV.
     */
    armorRepairBVMultiplier?: number;
    /** IndustrialMechs only (the IndustrialMech Ejection Seat, TM p.213). */
    industrialMechOnly?: boolean;
    /** 'Mech locations (short keys, e.g. "hd") the item must be placed in; unset = anywhere. */
    allowedLocations?: string[];
    /** Only one item of this group may be mounted in a location (HarJel repair systems, IO:AE p.83). */
    onePerLocationGroup?: string;
    /** Multiplier on the unit's final Battle Value, applied once however many are mounted (RISC Heat Sink Override Kit, IO:AE p.190). */
    battleValueFinalMultiplier?: number;
    /** Coolant Pod: raises the heat sink capacity used for Battle Value (TO:AUE p.193). */
    coolantPod?: boolean;
    /** Engine the unit must have: fusion, or fusion or fission. Unset = any engine. */
    requiresEngine?: "fusion" | "fusion-or-fission";
    /** Bombs: bomb bay (or fighter bomb) slots one bomb occupies. Bombs are loaded, not mounted. */
    bombBaySlots?: number;
}

export interface IEquipmentMetadata {
    domains?: EquipmentDomain[];
    techBase?: "is" | "clan" | "mixed" | "custom";
    rulesLevel?: number;
    source?: IEquipmentSource;
    ammunitionTags?: string[];
}

export type EquipmentDomain =
    | "battlemech"
    | "vehicle"
    | "aerospace"
    | "dropship"
    | "warship"
    | "infantry";

export interface IEquipmentSource {
    book: string;
    page: number;
    sourceFile?: string;
    sourceFormat?: string;
    warnings?: string[];
}

export interface ICriticalSpace {
    battlemech: number;
    protomech: number;
    combatVehicle: number;
    supportVehicle: number;
    aerospaceFighter: number;
    smallCraft: number;
    dropShip: number;
}

export interface IGyro {
    name: string;
    alternateName?: string;
    tag: string;
    /** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
    altTags?: string[];
    weight_multiplier: number;
    criticals: number;
    costMultiplier: number;
    /** Inner Sphere only (TM): not offered to pure Clan designs. */
    innerSphereOnly?: boolean;
    /** IO prototype year, when it precedes `introduced`; offered at the Experimental rules level. */
    prototype?: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
    book?: string;
    page?: number | null;
    available?: boolean;
    availableAsPrototype?: boolean;
}

export interface ITechDates {
    prototype?: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
}

export interface ICockpitType {
    name: string;
    tag: string;
    /** Tons. For an add-on (Command Console) this is the weight added to the base cockpit. */
    weight: number;
    cost: number;
    /** Multiplier on the final BV (Small: TM p.304; Torso-Mounted: TO:AUE p.193). */
    bvMultiplier?: number;
    /** Only this technology base builds it. */
    techBase?: "is" | "clan";
    /** Mounted alongside another cockpit instead of replacing it. */
    addOn?: boolean;
    /** "implemented": the 'Mech builder mounts it; "deferred": catalogued for reference only. */
    constructionStatus: "implemented" | "deferred";
    book: string;
    page: number;
    notes?: string;
    /** IO prototype year, when it precedes `introduced`. */
    prototype?: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
    /** Clan availability window when it differs from the Inner Sphere dates above. */
    clanDates?: ITechDates;
    /** Set by the builder: may this design mount it in its era and rules level? */
    available?: boolean;
    /** Set when it is offered only as an Experimental prototype. */
    availableAsPrototype?: boolean;
}

export interface IHeatSync {
    name: string;
    tag: string;
    /** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
    altTags?: string[];
    dissipation: number;
    crits: {
        [key: string]: number;
    },
    cost: number;
    /** Heat sinks that cost nothing (single-type sinks: the first 10); double-type sinks pay for all. */
    freeSinks?: number;
    /** Only this technology base builds it (Laser: Clan; prototypes: Inner Sphere). */
    techBase?: "is" | "clan";
    /** Tons per heat sink beyond the free ones (default 1; Compact 1.5). */
    weightEach?: number;
    /** Heat sinks that share one critical slot (default 1; Compact 2). */
    perSlot?: number;
    /** Multiplier on the engine's integral capacity, floor(rating / 25) (default 1; Compact 2). */
    engineCapacityMultiplier?: number;
    book?: string;
    page?: number | null;
    notes?: string;
    /** IO prototype year, when it precedes `introduced`; offered at the Experimental rules level. */
    prototype?: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
    /** Clan availability window when it differs from the Inner Sphere one above. */
    clanDates?: ITechDates;
    available?: boolean;
    availableAsPrototype?: boolean;
}

export interface IInternalStructurePerTon {
    tonnage: number;
    head: number;
    centerTorso: number;
	// Spliting the old 'rlTorso' into individual sides for clarity
    leftTorso: number;
	rightTorso:number;
	// Making arms optional to fully support Quads (which lack arms entirely) as well as some Bipeds and Tripods
	leftArm?: number;
    rightArm?: number;
	// Core biped legs or rear legs for Quads
    leftLeg: number;
	rightLeg: number;
	// New conditional limbs to expand anatomy models dynamically
  	centerLeg?: number;     // Used by Tripods (e.g., Hedgehog, Ares)
  	frontLeftLeg?: number;  // Used by Quads instead of arms
  	frontRightLeg?: number; // Used by Quads instead of arms
}

export interface IResolvedInternalStructure extends IInternalStructurePerTon {
    leftArm: number;
    rightArm: number;
    centerLeg: number;
    frontLeftLeg: number;
    frontRightLeg: number;
}

export interface IRawMechStructure {
    head: number;
    ct: number;
    torso: number;
    arm: number;
    leg: number;
}

export interface IMechTonnage {
    tons: number;
    type: string;
}

export interface IInternalStructure {
    name: string;
    tag: string;
    /** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
    altTags?: string[];
    crits: {
        clan: number;
		is: number;
    };
	cost: number;
	
    // Replaces the old 'perTon: Record<number, IInternalStructurePerTon>' mapping
  	// to separate structural logic neatly by the core Mech configurations
  	perMechType: {
    	biped: Record<number, IInternalStructurePerTon>;
    	quad: Record<number, IInternalStructurePerTon>;
        quadvee: Record<number, IInternalStructurePerTon>;
    	tripod: Record<number, IInternalStructurePerTon>;
		// LAMs follow Biped structure but have unique tonnage limits (max 55 tons) and component rules
    	lam: Record<number, IInternalStructurePerTon>;
  	};
    /** Multiplier on internal structure points in the defensive BV (Industrial/Composite 0.5, Reinforced 2). */
    bvMultiplier?: number;
    /** No Clan version exists (Composite). */
    innerSphereOnly?: boolean;
    book?: string;
    page?: number | null;
    /** IO prototype year, when it precedes `introduced`; offered at the Experimental rules level. */
    prototype?: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
    /** Clan availability window when it differs from the Inner Sphere one above. */
    clanDates?: ITechDates;
    available?: boolean;
    availableAsPrototype?: boolean;
}

export interface IJumpJet {
    name: string;
    tag: string;
    /** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
    altTags?: string[];
    weight_multiplier: {
        light: number;
        medium: number;
        heavy: number;
        superheavy: number;
    },
    criticals: number;
    costMultiplier: number;
    book?: string;
    page?: number;
    /** UMUs: underwater MP instead of jump MP (TO:AUE p.107). */
    underwater?: boolean;
    /** Jump MP may reach Running MP instead of Walking MP (improved and prototype improved jump jets). */
    jumpAsRun?: boolean;
    /** Heat per hex jumped and the least heat a jump costs, when not the standard 1 and 3. */
    heatPerHex?: number;
    minimumHeat?: number;
    /** Not available to a Clan tech base. */
    innerSphereOnly?: boolean;
    /** IO prototype year, when it precedes `introduced`; offered at the Experimental rules level. */
    prototype?: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
    /** Clan availability window when it differs from the Inner Sphere one above. */
    clanDates?: ITechDates;
    available?: boolean;
    availableAsPrototype?: boolean;
}

export interface IMyomerType {
    name: string;
    tag: string;
    /** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
    altTags?: string[];
    /** Critical slots, spread anywhere except the head. */
    criticals: number;
    /** C-bills per 'Mech ton (musculature line of the cost table). */
    costPerTon: number;
    /** Offensive BV weight factor (TM p.303: TSM x 1.5; Industrial TSM x 1.15). */
    bvWeightMultiplier: number;
    /** Doubles physical weapon damage when hot (TSM and its prototype). */
    tripleStrength: boolean;
    techBase?: "is" | "clan";
    book: string;
    page: number | null;
    notes?: string;
    prototype?: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
    clanDates?: ITechDates;
    available?: boolean;
    availableAsPrototype?: boolean;
}

export interface IMechType {
    id: number;
    tag: string;
    /** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
    altTags?: string[];
    name: string;
    /** Lowest rules level (rules-level-options ids) at which this chassis is legal. */
    rulesLevel: number;
    book?: string;
    page?: number;
    notes?: string;
}

export interface ITechOptions {
	id: number;
	tag: string;
	/** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
	altTags?: string[];
	name: string;
}

export interface IEras {
    id: number;
    tag: string;
    /** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
    altTags?: string[];
    name: string;
    yearStart: number;
    yearEnd: number | null;
}

export interface IRulesLevelOption {
    id: number;
    sswid: number | null;
    tag: string;
    /** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
    altTags?: string[];
    name: string;
}

// Combat Vehicle domain (Phase 2) - shared with BattleMech via the same engine/armor/heat sink/equipment catalogs.
export interface IVehicleMotiveType {
    id: number;
    tag: string;
    /** Earlier tags for this record, so old saves still resolve (see tag-match.ts). */
    altTags?: string[];
    name: string;
    minTonnage: number;
    standardMaxTonnage: number;
    /** Largest Superheavy tonnage (Advanced rules); null when the motive type has no Superheavy version. */
    superheavyMaxTonnage: number | null;
    /** Lift/dive equipment weighing 10% of tonnage (hover, VTOL, WiGE, hydrofoil, submarine). */
    liftEquipment?: string;
    /** VTOLs have a Rotor location. */
    hasRotor?: boolean;
    /** "standard" turret, or "chin" (VTOL chin turret, Advanced rules). */
    turret: "standard" | "chin";
    /** Hardened armor is not allowed on VTOL, hover or WiGE vehicles. */
    allowsHardenedArmor: boolean;
    /** Vehicular jump jets fit only hover, wheeled, tracked and WiGE vehicles. */
    allowsJumpJets: boolean;
    naval: boolean;
    /** Alpha Strike movement mode code (e.g. 8"t). */
    alphaStrikeMove: string;
    book: string;
    page: number | null;
}

export interface IVehicleArmorAllocation {
    front: number;
    left: number;
    right: number;
    rear: number;
    turret: number;
    /** VTOL rotor; absent in saves made before VTOL support. */
    rotor?: number;
    /** Superheavy vehicles replace Left/Right with four side locations. */
    frontLeft?: number;
    frontRight?: number;
    rearLeft?: number;
    rearRight?: number;
    /** Front turret of a dual-turret vehicle ("turret" is then the rear turret). */
    turret2?: number;
}

export interface IVehicleStructureAllocation {
    front: number;
    left: number;
    right: number;
    rear: number;
    turret: number;
    rotor?: number;
    frontLeft?: number;
    frontRight?: number;
    rearLeft?: number;
    rearRight?: number;
    turret2?: number;
}

export type VehicleLocation = "front" | "left" | "right" | "rear" | "frontLeft" | "frontRight" | "rearLeft" | "rearRight"
    | "rotor" | "turret" | "turret2";

