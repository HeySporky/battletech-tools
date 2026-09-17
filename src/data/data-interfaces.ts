import { string } from "prop-types";
import { IClusterHit } from "../classes/battlemech";

export interface IArmorType {
	tag: string;
	name: string;
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
	critLocs?: {
		[key: string]: number;
    };
    available?: boolean;
}

export interface IEngineOption {
	name: string;
	rating: number;
	weight: {
        standard: number;
        xl: number;
        clan_xl: number;
        light: number;
        compact: number;
        xxl: number;
        clan_xxl: number;
        ice: number;
		cell: number;
		fission: number;
        primitive: number;
        comp?: number;		
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
	name: string;
    alternateName?: string;
	costMultiplier: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
    criticals: {
        [key: string]: ICriticalLocations;
    },
    rating: number;
    available?: boolean;
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
}

export interface ISplitLocation {
    loc: string;
    index: number;
    size: number;
}
export interface IEquipmentItem {
    split_location?: ISplitLocation[];
    isRotary?: boolean;
    isStreak?: boolean;
    isUltra?: boolean;
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
    tag: string;
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
    ammoPerTon?: number;
    minAmmoTons?: number;
    explosive?: boolean;
    gauss?: boolean;
    weaponType?: string[];
    techRating?: string;
    unique?: boolean;
    book: string;
    page: number;
    alphaStrike: {
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
    isMelee?: boolean;
    costPerItemTon?: number;
    location?: string;
    rear?: boolean;
    criticals?: number;
    available?: boolean;
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
    weight_multiplier: number;
    criticals: number;
    costMultiplier: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
    available?: boolean;
}

export interface IHeatSync {
    name: string;
    tag: string;
    dissipation: number;
    crits: {
        [key: string]: number;
    },
    cost: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
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
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
}

export interface IJumpJet {
    name: string;
    tag: string;
    weight_multiplier: {
        light: number;
        medium: number;
        heavy: number;
        superheavy: number;
    },
    criticals: number;
    costMultiplier: number;
    introduced: number | null;
    extinct: number | null;
    reintroduced: number | null;
}

export interface IMechType {
    id: number;
    tag: string;
    name: string;
}

export interface ITechOptions {
	id: number;
	tag: string;
	name: string;
}

export interface IEras {
    id: number;
    tag: string;
    name: string;
    yearStart: number;
    yearEnd: number | null;
}

export interface IRulesLevelOption {
    id: number;
    sswid: number | null;
    tag: string;
    name: string;
}
