import { generateUUID } from "../utils/generateUUID";
import { calculateGroundPointValue, groundTMM } from "../utils/alphaStrikeGroundPointValue";
import { AlphaStrikeUnit, IASMULUnit } from "./alpha-strike-unit";
import { IGameSettingsUnit, UnitGameSettings } from "./unit-game-settings";
import { TechnicalReadout } from "./technical-readout";
import type { ITechnicalReadoutExport } from "../data/technical-readout-interfaces";
import { DEFAULT_RULES_EDITION, getSelectableRulesEditionTag } from "../data/rules-editions";
import { IEras } from "../data/data-interfaces";
import { btEraOptions, findEraByTag } from "../data/era-options";
import { getUnitTypeEras } from "../data/game-settings";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { mechEngineOptions } from "../data/mech-engine-options";
import { editionHasBattleValue, getBattleValueFor, getBattleValueSkillEdition, getSkillMultiplier, getSpeedFactor } from "../data/battle-value";
import { getRulesEdition } from "../data/rules-editions";
import { CalcTrace, ICalcBreakdown, formatCalcNumber } from "../data/calc-steps";
import { NO_BATTLE_VALUE_STEPS } from "../data/calc-steps-mech-bv1";
import {
    IMicroMechPrintedFigures,
    MICRO_MECH_BV1_STEPS,
    MICRO_MECH_BV2_STEPS,
    MICRO_MECH_COST_STEPS,
    MICRO_MECH_PRINTED_FIGURES,
} from "../data/calc-steps-micro-mech";
import {
    IMicroMechVersionRules,
    MICRO_MECH_ARMOR_KG_PER_POINT,
    MICRO_MECH_BORROWED_NOTE,
    MICRO_MECH_COCKPIT_ARMOR,
    MICRO_MECH_COCKPIT_KG,
    MICRO_MECH_CREDIT,
    MICRO_MECH_DEFAULT_VERSION,
    MICRO_MECH_LOCATIONS,
    MICRO_MECH_LOCATION_NAMES,
    MICRO_MECH_LOWER_ARM,
    MICRO_MECH_LOWER_LEG,
    MICRO_MECH_MAX_TONS,
    MICRO_MECH_MIN_TONS,
    MICRO_MECH_QUARTER_TON_KG,
    MICRO_MECH_SLOTS,
    MICRO_MECH_UPPER_ARM,
    MICRO_MECH_UPPER_LEG,
    MICRO_MECH_VERSION_RULES,
    MicroMechArmorType,
    MicroMechEngineKind,
    MicroMechLayout,
    MicroMechLocation,
    MicroMechVersion,
    ceilToQuarterTonKg,
    getMicroMechStructureRow,
    isMicroMechVersion,
} from "../data/micro-mech-construction";
import {
    IMicroMechItem,
    MicroMechAmmoType,
    findMicroMechItem,
    getMicroMechAmmoShots,
    getMicroMechItemAlphaStrike,
    getMicroMechItemBattleValue2,
    isMicroMechWeapon,
} from "../data/micro-mech-equipment-custom";

// A Micro-Mech (#173): a fan-made 10 to 19 ton walker with one torso, built in kilograms. Custom Homebrew.
// Construction: "Micro-Mechs" 6.1.0.2 or Solarmech's 2019 post, chosen by `version`; every rule that differs is a
// field of MICRO_MECH_VERSION_RULES. Equipment comes from the 6.1.0.2 table (micro-mech-equipment-custom.ts). Cost and
// Battle Value follow the 6.1.0.2 appendices (calc-steps-micro-mech.ts); a BV2 edition gets a provisional BV2 of ours.
// Play mode (in-play state saved with the roster) follows the rules sections of both texts (Chunk F of
// docs/superpowers/plans/2026-11-13-micro-mechs.md).

/** Alpha Strike unit type code for a Micro-Mech, and the ability that carries its play rules. Both are NGCFells's. */
export const MICRO_MECH_AS_TYPE = "MM";
export const MICRO_MECH_AS_ABILITY = "MCR";

export interface IMicroMechASDamageValue {
    damage: number;
    /** 0*: more than nothing and under half a point. */
    minimal: boolean;
}

export interface IMicroMechAlphaStrikeStats {
    type: typeof MICRO_MECH_AS_TYPE;
    size: 1;
    move: string;
    tmm: number;
    armor: number;
    structure: number;
    damageValues: { short: IMicroMechASDamageValue; medium: IMicroMechASDamageValue; long: IMicroMechASDamageValue };
    specialAbilities: string[];
    pointValue: number;
    calcLog: string[];
}

export const formatMicroMechASDamage = (value: IMicroMechASDamageValue): string => (value.minimal ? "0*" : `${value.damage}`);

export const MAX_MICRO_MECH_NAME_LENGTH = 120;
/** The highest rating in the standard engine table (TechManual p.49, as mech-engine-options.ts holds it). */
const MAX_ENGINE_RATING = 400;
const ALL_LOCATIONS: MicroMechLocation[] = ["head", "torso", "torsoRear", "la", "ra", "ll", "rl", "fll", "frl"];
const LAYOUTS: MicroMechLayout[] = ["biped", "quad"];
const ENGINE_KINDS: MicroMechEngineKind[] = ["fusion", "ice"];
/** The armor types the builder offers; the 2019 text also allows industrial armor (not built yet). */
const BUILT_ARMOR_TYPES: MicroMechArmorType[] = ["standard"];
/** A quad's front legs take the place of a biped's arms, for armor carried across a layout change. */
const QUAD_FOR_BIPED: Partial<Record<MicroMechLocation, MicroMechLocation>> = { la: "fll", ra: "frl" };

export type MicroMechSide = "left" | "right";
/** "A maximum of 4 weapons can be mounted on a Micro-Mech" (both texts). */
export const MICRO_MECH_MAX_WEAPONS = 4;
/** "Each critical slot can hold up to 1000kg of ammo" (6.1.0.2); "Ammunition amounts one ton or less are located in single slot" (both). */
const AMMO_KG_PER_SLOT = 1000;
/** A sanity cap on extra heat sinks where the text states no limit (2019). */
const MAX_EXTRA_HEAT_SINKS_UNLIMITED = 99;

export interface IMicroMechAmmoExport {
    type: MicroMechAmmoType;
    kg: number;
    location: MicroMechLocation;
}

export interface IMicroMechMountExport {
    tag: string;
    location: MicroMechLocation;
    /** The weapon's ammunition, one lot per type; each lot sits in one location. */
    ammo?: IMicroMechAmmoExport[];
}

export interface IMicroMechMount extends IMicroMechMountExport {
    item: IMicroMechItem;
    ammo: IMicroMechAmmoExport[];
}

export interface IMicroMechAmmoLot extends IMicroMechAmmoExport {
    mountIndex: number;
    tag: string;
    name: string;
    shots: number;
    /** Slots this lot fills by itself (lots that share a slot are counted in getSlots). */
    slots: number;
}

/** A filled slot: a fixed item, a mount's slot, a shared ammunition slot (the lots in it), or a placed jump jet (play). */
interface IMicroMechSlotEntry {
    name: string;
    kind: "fixed" | "mount" | "ammo" | "jet";
    mountIndex?: number;
    /** Indexes into getAmmoLots of the lots sharing this slot. */
    lots?: number[];
}

/**
 * The record sheet's state in play (Chunk F), saved with the roster. Every field is optional and absent when clean.
 * Counts are of what was lost: armor and structure points per location, cockpit armor points, hit slot indexes
 * (into getPlaySlots), pilot hits, and shots fired per ammunition lot (getAmmoLots order).
 */
export interface IMicroMechInPlay {
    armor?: Partial<Record<MicroMechLocation, number>>;
    structure?: Partial<Record<MicroMechLocation, number>>;
    cockpit?: number;
    slots?: Partial<Record<MicroMechLocation, number[]>>;
    pilotHits?: number;
    shotsFired?: number[];
    /** 2019 only: the pilot wears a neurohelmet. */
    neurohelmet?: boolean;
}

/** A weapon in play: its to-hit modifier from damage, whether it is destroyed, and whether it may fire now. */
export interface IMicroMechWeaponPlayLine {
    mountIndex: number;
    name: string;
    location: MicroMechLocation;
    toHit: number;
    destroyed: boolean;
    canFire: boolean;
    reasons: string[];
}

export interface IMicroMechPlayMovement {
    walk: number;
    run: number;
    jump: number;
    text: string;
    notes: string[];
}

export interface IMicroMechModifier {
    total: number;
    lines: string[];
}

/**
 * "A Micro-Mech uses the Battlemech hit location table. The Right Torso, Center Torso and Left Torso locations all
 * become a Torso hit location." The front / rear column of TW's 'Mech Hit Location Table (2 and 7 CT, 3-4 RA, 5 RL,
 * 6 RT, 8 LT, 9 LL, 10-11 LA, 12 head); on a quad the arms are the front legs and the legs the rear legs (TW).
 */
export const MICRO_MECH_HIT_LOCATIONS: Record<MicroMechLayout, Record<number, MicroMechLocation>> = {
    biped: { 2: "torso", 3: "ra", 4: "ra", 5: "rl", 6: "torso", 7: "torso", 8: "torso", 9: "ll", 10: "la", 11: "la", 12: "head" },
    quad: { 2: "torso", 3: "frl", 4: "frl", 5: "rl", 6: "torso", 7: "torso", 8: "torso", 9: "ll", 10: "fll", 11: "fll", 12: "head" },
};

/** Determining Critical Hits Table (TW p.124): the hits for a 2D6 roll; 12 blows a head or limb off. */
const criticalHitsForRoll = (roll: number): number => (roll >= 12 ? 3 : roll >= 10 ? 2 : roll >= 8 ? 1 : 0);
const MICRO_MECH_PILOT_HITS = 6;
/** "the pilot takes 3 hits from feedback" (both texts, Damaging a Micro-Mech Pilot). */
const AMMO_EXPLOSION_PILOT_HITS = 3;
const JUMP_JET_SLOT = "Jump Jet";

export interface IMicroMechExport {
    /** The save format. */
    format: 1;
    /** The rules text the design is built under; absent means 6.1.0.2. */
    version?: MicroMechVersion;
    rulesEdition?: string;
    rulesLevel?: number;
    rulesets?: string[];
    uuid: string;
    tro?: ITechnicalReadoutExport;
    name: string;
    tons: number;
    layout: MicroMechLayout;
    walkMP: number;
    engineKind: MicroMechEngineKind;
    jumpJets: number;
    sealed?: boolean;
    /** Lower Arm Actuator Groups fitted (a biped's); absent means both. */
    lowerArms?: { left: boolean; right: boolean };
    armor: Partial<Record<MicroMechLocation, number>>;
    /** Equipment, in the order it was added; absent in a Chunk A save. */
    mounts?: IMicroMechMountExport[];
    /** Heat sinks beyond the engine's free ones; absent means none. */
    extraHeatSinks?: number;
    era: string;
    /** The pilot's skills (roster); absent means 4 and 5. */
    gunnery?: number;
    piloting?: number;
    /** The record sheet in play (roster); absent when clean. */
    inPlay?: IMicroMechInPlay;
    lastUpdated?: string;
}

export interface IMicroMechWeightLine {
    name: string;
    kg: number;
}

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const formatKg = (kg: number): string => `${kg.toLocaleString("en-US")} kg`;
const fmt = (value: number): string => value.toLocaleString("en-US", { maximumFractionDigits: 3 });
/** A C-bill figure with its fraction rounded up (float noise removed first). */
const ceilCBill = (value: number): number => Math.ceil(Math.round(value * 1000) / 1000);
const round2 = (value: number): number => Math.round(value * 100) / 100;
/** Target Movement Modifier for hexes moved (BMR(R) p.33, capped at +4 there; Total Warfare p.117 goes on to +6). */
const targetMovementModifier = (hexes: number, cap = 6): number =>
    Math.min(cap, hexes >= 25 ? 6 : hexes >= 18 ? 5 : hexes >= 10 ? 4 : hexes >= 7 ? 3 : hexes >= 5 ? 2 : hexes >= 3 ? 1 : 0);
const CASE_TAG = "micro-case";
const CASE_II_TAG = "micro-case-ii";
const ARTEMIS_TAG = "micro-artemis-iv-fcs";
/** The table gives these no Battle Value and points to the Master Rules' force rules (notes C and D). */
const FORCE_VALUED_TAGS = ["micro-c3-master-computer", "micro-c3-slave", "micro-c3i-computer", "micro-target-acquisition-gear-tag"];
/** Battle Value 1 counts ECM as defensive and an active probe as offensive (BMR(R) pp.152-153). */
const isDefensiveBv1 = (item: IMicroMechItem): boolean => /-ecm/.test(item.tag);

/** Reads a saved Micro-Mech; null when the data is not one. Each value clamped on the way in gives an issue. */
export const normalizeMicroMechExport = (raw: unknown): { micro: IMicroMechExport | null; issues: string[] } => {
    const notOne = { micro: null, issues: ["Not a Micro-Mech record."] };
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return notOne;
    const data = raw as Partial<IMicroMechExport>;
    if (typeof data.tons !== "number" || typeof data.layout !== "string" || !data.armor || typeof data.armor !== "object") return notOne;
    const micro = new MicroMech();
    if (!micro.import(data as IMicroMechExport)) return notOne;
    return { micro: micro.export(), issues: micro.getImportIssues() };
};

export default class MicroMech implements IGameSettingsUnit {
    public lastUpdated: Date = new Date();

    private _uuid: string = generateUUID();
    public tro: TechnicalReadout = new TechnicalReadout();
    private _name: string = "";
    private _version: MicroMechVersion = MICRO_MECH_DEFAULT_VERSION;
    private _rulesEdition: string = DEFAULT_RULES_EDITION;
    /** The rules level and Special Rulesets the design is built under (#324). */
    public readonly gameSettings = new UnitGameSettings();
    private _tons: number = MICRO_MECH_MIN_TONS;
    private _layout: MicroMechLayout = "biped";
    private _walkMP: number = 4;
    private _engineKind: MicroMechEngineKind = "fusion";
    private _jumpJets: number = 0;
    private _sealed: boolean = false;
    private _lowerArms: Record<MicroMechSide, boolean> = { left: true, right: true };
    private _armor: Record<MicroMechLocation, number> = { head: 0, torso: 0, torsoRear: 0, la: 0, ra: 0, ll: 0, rl: 0, fll: 0, frl: 0 };
    private _mounts: { tag: string; location: MicroMechLocation; ammo: IMicroMechAmmoExport[] }[] = [];
    private _extraHeatSinks: number = 0;
    private _era: IEras = findEraByTag("jihad") ?? btEraOptions[btEraOptions.length - 1];
    private _gunnery: number = 4;
    private _piloting: number = 5;
    private _inPlay: IMicroMechInPlay = {};
    private _importIssues: string[] = [];

    constructor(json: string = "") {
        if (json) this.importJSON(json);
    }

    // Identity ---------------------------------------------------------------------------------------------------

    public getUUID(): string { return this._uuid; }
    public newUUID(): void { this._uuid = generateUUID(); }
    public getName(): string { return this._name; }
    public setName(name: string): void { this._name = String(name ?? "").slice(0, MAX_MICRO_MECH_NAME_LENGTH); }
    public getDisplayName(): string { return this._name.trim() || `${this._tons}-ton Micro-Mech`; }
    public getImportIssues(): string[] { return [...this._importIssues]; }

    /** A Micro-Mech follows the BattleMech rules except where noted, so it offers the 'Mech editions. */
    public getRulesEdition(): string { return this._rulesEdition; }
    public setRulesEdition(editionTag: string): string {
        this._rulesEdition = getSelectableRulesEditionTag(editionTag, "mech");
        return this._rulesEdition;
    }
    /** Inner Sphere: 6.1.0.2 uses the Inner Sphere table; the 2019 post allows "any tech base but Clan". */
    public getTechTag(): string { return this.getRules().techBase; }
    public setTechTag(_tag: string): void { /* Inner Sphere only */ }
    public chooseEra(tag: string): void { this.setEra(tag); }
    /** No date limit on the chassis (NGCFells's ruling 7): every Inner Sphere 'Mech era. */
    public getEra(): IEras { return this._era; }
    public getAvailableEras(): IEras[] { return getUnitTypeEras("mech", this.getTechTag()); }
    public setEra(tag: string): boolean {
        const era = this.getAvailableEras().find((item) => item.tag === tag);
        if (era) this._era = era;
        return !!era;
    }

    // Version ----------------------------------------------------------------------------------------------------

    public getVersion(): MicroMechVersion { return this._version; }
    public getRules(): IMicroMechVersionRules { return MICRO_MECH_VERSION_RULES[this._version]; }
    /** Changes the rules text. Nothing is removed or re-set: the design is re-checked and what is no longer legal is returned. */
    public setVersion(version: MicroMechVersion): string[] {
        if (isMicroMechVersion(version)) this._version = version;
        return this.getIssues();
    }

    // Chassis ----------------------------------------------------------------------------------------------------

    public getTons(): number { return this._tons; }
    public setTons(tons: number): boolean {
        if (!Number.isInteger(tons) || tons < MICRO_MECH_MIN_TONS || tons > MICRO_MECH_MAX_TONS) return false;
        this._tons = tons;
        this._walkMP = Math.min(this._walkMP, this.getMaxWalkMP());
        this._clampArmor();
        return true;
    }

    public getLayout(): MicroMechLayout { return this._layout; }
    public getLayoutOptions(): MicroMechLayout[] { return [...this.getRules().layouts]; }
    public isQuad(): boolean { return this._layout === "quad"; }
    /** A layout the version does not allow is refused. Arm armor moves to the front legs and back. */
    public setLayout(layout: MicroMechLayout): boolean {
        if (!this.getRules().layouts.includes(layout)) return false;
        if (layout === this._layout) return true;
        for (const [arm, frontLeg] of Object.entries(QUAD_FOR_BIPED) as [MicroMechLocation, MicroMechLocation][]) {
            const from = layout === "quad" ? arm : frontLeg;
            const to = layout === "quad" ? frontLeg : arm;
            this._armor[to] = this._armor[from];
            this._armor[from] = 0;
            for (const mount of this._mounts) {
                if (mount.location === from) mount.location = to;
                for (const lot of mount.ammo) if (lot.location === from) lot.location = to;
            }
        }
        this._layout = layout;
        this._clampArmor();
        return true;
    }
    public getLocations(): MicroMechLocation[] { return [...MICRO_MECH_LOCATIONS[this._layout]]; }
    public getLocationName(location: MicroMechLocation): string { return MICRO_MECH_LOCATION_NAMES[this._layout][location]; }

    // Movement and engine -----------------------------------------------------------------------------------------

    public getWalkMP(): number { return this._walkMP; }
    public getMaxWalkMP(): number { return Math.floor(MAX_ENGINE_RATING / this._tons); }
    public setWalkMP(walk: number): boolean {
        if (!Number.isInteger(walk) || walk < 1 || walk > this.getMaxWalkMP()) return false;
        this._walkMP = walk;
        return true;
    }
    /** "The running MP of a Micro-Mechs is determined the same as for Battlemechs": Walking MP x 1.5, rounded up. */
    public getRunMP(): number { return Math.ceil(this._walkMP * 1.5); }

    /** Tonnage x Walking MP. */
    public getEngineRating(): number { return this._tons * this._walkMP; }
    /** "use the next highest rated engine on the table". */
    public getInstalledEngineRating(): number { return this._engineOption().rating; }
    private _engineOption() {
        const rating = this.getEngineRating();
        return mechEngineOptions.find((item) => item.rating >= rating) ?? mechEngineOptions[mechEngineOptions.length - 1];
    }

    public getEngineKind(): MicroMechEngineKind { return this._engineKind; }
    public getEngineKindOptions(): MicroMechEngineKind[] { return ENGINE_KINDS.filter((kind) => this.getRules().engineKinds.includes(kind)); }
    public setEngineKind(kind: MicroMechEngineKind): boolean {
        if (!this.getEngineKindOptions().includes(kind)) return false;
        this._engineKind = kind;
        return true;
    }

    /** The fusion engine's table weight times the version's shielding, rounded up to the quarter ton. */
    public getFusionEngineWeight(): number {
        return ceilToQuarterTonKg(Math.round(this._engineOption().weight.standard * 1000 * this.getRules().fusionShielding));
    }
    public getEngineWeight(): number {
        if (this._engineKind === "fusion") return this.getFusionEngineWeight();
        // 6.1.0.2: "2x the weight of a fusion engine of the same rating". The 2019 post states no ICE weight; it falls
        // back on the BattleMech ICE weight (2 x standard fusion, the table's ICE column), with no shielding.
        if (this.getRules().iceWeight === "twice-fusion") return this.getFusionEngineWeight() * 2;
        return ceilToQuarterTonKg(Math.round(this._engineOption().weight.ice * 1000));
    }

    /** Rating / 100, rounded up to the quarter ton (both texts). */
    public getGyroWeight(): number { return ceilToQuarterTonKg(this.getInstalledEngineRating() * 10); }
    public getCockpitWeight(): number { return MICRO_MECH_COCKPIT_KG; }
    public getStructureWeight(): number { return this.getRules().structureKg(this._tons); }

    public isSealed(): boolean { return this._sealed; }
    public setSealed(sealed: boolean): void { this._sealed = !!sealed; }
    /** "use the same weight as the internal structure". */
    public getSealingWeight(): number { return this._sealed ? this.getStructureWeight() : 0; }

    /** An ICE has no free heat sinks (both texts). */
    public getFreeHeatSinks(): number {
        return this._engineKind === "fusion" ? this.getRules().freeHeatSinks(this.getInstalledEngineRating()) : 0;
    }

    // Heat sinks and power amplifiers --------------------------------------------------------------------------------

    public getExtraHeatSinks(): number { return this._extraHeatSinks; }
    /** "A maximum of ten single heat sinks can be added on the engine" (6.1.0.2); the 2019 post states no limit. */
    public getMaxExtraHeatSinks(): number { return this.getRules().maxExtraHeatSinks ?? MAX_EXTRA_HEAT_SINKS_UNLIMITED; }
    public setExtraHeatSinks(count: number): void { this._extraHeatSinks = clampInt(count, 0, this.getMaxExtraHeatSinks(), 0); }
    /** Heat sinks "are mounted on the engine and do not take up location slots". */
    public getHeatSinks(): number { return this.getFreeHeatSinks() + this._extraHeatSinks; }
    public getHeatSinkWeight(): number { return this._extraHeatSinks * this.getRules().heatSinkKg; }
    /** "enough heat sinks to dissipate all the heat generated by firing all its energy weapons in the same turn". */
    public getEnergyHeat(): number {
        return this.getMounts().filter((mount) => mount.item.kind === "energy").reduce((sum, mount) => sum + mount.item.heat, 0);
    }
    public getEnergyWeaponWeight(): number {
        return this.getMounts().filter((mount) => mount.item.kind === "energy").reduce((sum, mount) => sum + mount.item.weightKg, 0);
    }
    /**
     * An ICE's power amplifiers. 6.1.0.2: "1 ton per 10 tons of energy weapons or fraction there of". 2019: "10% of the
     * tonnage of the energy weapons rounded up to the nearest .25 ton". A fusion engine needs none.
     */
    public getPowerAmplifierWeight(): number {
        const energy = this.getEnergyWeaponWeight();
        if (this._engineKind !== "ice" || energy <= 0) return 0;
        if (this.getRules().powerAmplifiers === "per-10-tons") return Math.ceil(energy / 10000) * 1000;
        return ceilToQuarterTonKg(energy / 10);
    }

    // Jump jets ----------------------------------------------------------------------------------------------------

    public getJumpJets(): number { return this._jumpJets; }
    /** One jet is one Jump MP; as for a BattleMech, at most Walking MP. */
    public setJumpJets(jets: number): void { this._jumpJets = clampInt(jets, 0, this._walkMP, 0); }
    public getJumpMP(): number { return this._jumpJets; }
    public getJumpJetWeight(): number { return this._jumpJets * this.getRules().jumpJetKg; }

    // Structure and armor -----------------------------------------------------------------------------------------

    /** Internal structure points. A quad's front legs take leg structure (the quad record sheet); the rear torso has none. */
    public getStructure(location: MicroMechLocation): number {
        if (!this.getLocations().includes(location)) return 0;
        const row = getMicroMechStructureRow(this._tons);
        switch (location) {
            case "head": return row.head;
            case "torso": return row.torso;
            case "torsoRear": return 0;
            case "la": case "ra": return row.arm;
            default: return row.leg;
        }
    }
    public getTotalStructure(): number { return this.getLocations().reduce((sum, location) => sum + this.getStructure(location), 0); }

    /**
     * Armor maximum: twice the location's structure (the 2019 post: three times, for the head). The torso's front and
     * rear share one maximum, twice the torso structure. With no location, the whole design's maximum.
     */
    public getMaxArmor(location?: MicroMechLocation): number {
        if (!location) return this.getLocations().filter((item) => item !== "torsoRear").reduce((sum, item) => sum + this.getMaxArmor(item), 0);
        if (!this.getLocations().includes(location)) return 0;
        if (location === "torsoRear") return this.getMaxArmor("torso");
        return this.getStructure(location) * (location === "head" ? this.getRules().headArmorPerStructure : 2);
    }
    public getArmor(location: MicroMechLocation): number { return this.getLocations().includes(location) ? this._armor[location] : 0; }
    /** Sets a location's armor, capped at its maximum; a torso front and rear over their shared maximum is an issue. */
    public setArmor(location: MicroMechLocation, points: number): void {
        if (!this.getLocations().includes(location)) return;
        this._armor[location] = clampInt(points, 0, this.getMaxArmor(location), 0);
    }
    public getArmorPoints(): number { return this.getLocations().reduce((sum, location) => sum + this._armor[location], 0); }
    public getArmorType(): MicroMechArmorType { return "standard"; }
    public getArmorTypeOptions(): MicroMechArmorType[] { return BUILT_ARMOR_TYPES.filter((type) => this.getRules().armorTypes.includes(type)); }
    /** 62.5 kg a point, in whole kilograms: an odd number of points is an issue, and its half kilogram is counted up. */
    public getArmorWeight(): number { return Math.ceil(this.getArmorPoints() * MICRO_MECH_ARMOR_KG_PER_POINT); }

    /** Lowers armor that a smaller tonnage or a layout change no longer allows. */
    private _clampArmor(): void {
        for (const location of ALL_LOCATIONS) {
            this._armor[location] = this.getLocations().includes(location) ? Math.min(this._armor[location], this.getMaxArmor(location)) : 0;
        }
    }

    // Slots ------------------------------------------------------------------------------------------------------

    public hasLowerArm(side: MicroMechSide): boolean { return !this.isQuad() && this._lowerArms[side]; }
    /** Only the lower arm group may be removed ("Only the lower arm actuator may be removed"); a quad has no arms. */
    public setLowerArm(side: MicroMechSide, fitted: boolean): boolean {
        if (this.isQuad() || (side !== "left" && side !== "right")) return false;
        this._lowerArms[side] = !!fitted;
        return true;
    }

    /**
     * The location's slots: the fixed items, the equipment in the order added, the ammunition, then null for each free
     * slot. A location holding more than it has is longer than its slot count (an issue). Jump jets are counted by
     * getJumpJetSlotsFree, not placed.
     */
    public getSlots(location: MicroMechLocation): (string | null)[] {
        if (!this.getLocations().includes(location)) return [];
        const used = this._usedSlots(location);
        return [...used, ...new Array(Math.max(0, MICRO_MECH_SLOTS[location].slots - used.length)).fill(null)];
    }
    private _usedSlots(location: MicroMechLocation): string[] { return this._slotEntries(location).map((entry) => entry.name); }
    /** The filled slots of a location, in order, with what fills each (for play: which mount or ammunition a hit strikes). */
    private _slotEntries(location: MicroMechLocation): IMicroMechSlotEntry[] {
        const fixed: IMicroMechSlotEntry[] = MICRO_MECH_SLOTS[location].fixed.map((name) => ({ name, kind: "fixed" }));
        if ((location === "la" && this.hasLowerArm("left")) || (location === "ra" && this.hasLowerArm("right"))) fixed.push({ name: MICRO_MECH_LOWER_ARM, kind: "fixed" });
        const items: IMicroMechSlotEntry[] = [];
        const ammo = new Map<string, { name: string; kg: number; lots: number[] }>();
        let lotIndex = 0;
        this.getMounts().forEach((mount, mountIndex) => {
            if (mount.location === location) for (let i = 0; i < mount.item.slots; i++) items.push({ name: mount.item.name, kind: "mount", mountIndex });
            for (const lot of mount.ammo) {
                const index = lotIndex++;
                if (lot.location !== location) continue;
                // One slot holds up to 1,000 kg "for the same weapon class" (6.1.0.2), or of one ammunition type (2019).
                const key = this.getRules().ammoSlots === "weapon-class" ? mount.tag : `${mount.tag}|${lot.type}`;
                const group = ammo.get(key) ?? { name: mount.item.name, kg: 0, lots: [] };
                group.kg += lot.kg;
                group.lots.push(index);
                ammo.set(key, group);
            }
        });
        for (const group of ammo.values()) {
            for (let i = 0; i < Math.ceil(group.kg / AMMO_KG_PER_SLOT); i++) items.push({ name: `Ammo (${group.name})`, kind: "ammo", lots: [...group.lots] });
        }
        return [...fixed, ...items];
    }
    public getFreeSlots(location: MicroMechLocation): number { return this.getSlots(location).filter((slot) => slot === null).length; }
    public getTotalFreeSlots(): number { return this.getLocations().reduce((sum, location) => sum + this.getFreeSlots(location), 0); }
    public getTotalSlots(): number { return this.getLocations().reduce((sum, location) => sum + MICRO_MECH_SLOTS[location].slots, 0); }
    /** Every slot filled, jump jets included. */
    public getTotalUsedSlots(): number {
        return this.getLocations().reduce((sum, location) => sum + (location === "torsoRear" ? 0 : this._usedSlots(location).length), 0) + this._jumpJets;
    }

    // Equipment --------------------------------------------------------------------------------------------------

    public getMounts(): IMicroMechMount[] {
        return this._mounts.flatMap((mount) => {
            const item = findMicroMechItem(mount.tag);
            return item ? [{ tag: mount.tag, location: mount.location, item, ammo: mount.ammo.map((lot) => ({ ...lot })) }] : [];
        });
    }
    public getWeaponCount(): number { return this.getMounts().filter((mount) => isMicroMechWeapon(mount.item)).length; }

    /** Where the version allows this item. 2019: "Weapons cannot be mounted in the legs or the Head". */
    private _allowsItemAt(item: IMicroMechItem, location: MicroMechLocation): boolean {
        if (!this.getLocations().includes(location) || location === "torsoRear") return false;
        if (isMicroMechWeapon(item) && this.getRules().weaponLocations === "not-head-or-legs") return location === "la" || location === "ra" || location === "torso";
        return true;
    }
    /** 2019: "All ammunition must be mounted in the Torso". */
    private _allowsAmmoAt(location: MicroMechLocation): boolean {
        if (!this.getLocations().includes(location) || location === "torsoRear") return false;
        return this.getRules().ammoLocations === "any" || location === "torso";
    }
    private _fits(location: MicroMechLocation): boolean { return this._usedSlots(location).length <= MICRO_MECH_SLOTS[location].slots; }

    /**
     * Mounts a table item in one location. Refused: an unknown tag (the banned items have no row), a location the
     * version does not allow, or too few free slots there ("A Micro-Mech cannot spit weapons over multiple locations").
     * A fifth weapon is mounted and reported as an issue.
     */
    public addMount(tag: string, location: MicroMechLocation): boolean {
        const item = findMicroMechItem(tag);
        if (!item || !this._allowsItemAt(item, location)) return false;
        if (this.getFreeSlots(location) < item.slots) return false;
        this._mounts.push({ tag, location, ammo: [] });
        return true;
    }
    /** Removes the mount and its ammunition. */
    public removeMount(index: number): boolean {
        if (!Number.isInteger(index) || index < 0 || index >= this._mounts.length) return false;
        this._mounts.splice(index, 1);
        return true;
    }

    /**
     * Sets a weapon's ammunition of one type: "quarter ton, half ton, three-quarter ton or full ton lots", so a
     * multiple of 250 kg (0 removes it). The location defaults to the lot's own, else the torso where the version
     * keeps ammunition there, else the weapon's. Refused where there is no such ammunition, the location is not
     * allowed, or it has no free slot for it.
     */
    public setAmmo(mountIndex: number, kg: number, location?: MicroMechLocation, type: MicroMechAmmoType = "standard"): boolean {
        const mount = this._mounts[mountIndex];
        const item = mount ? findMicroMechItem(mount.tag) : undefined;
        if (!mount || !item?.ammo?.some((ammo) => ammo.type === type)) return false;
        if (!Number.isInteger(kg) || kg < 0 || kg % MICRO_MECH_QUARTER_TON_KG !== 0) return false;
        const before = mount.ammo.map((lot) => ({ ...lot }));
        const existing = mount.ammo.find((lot) => lot.type === type);
        mount.ammo = mount.ammo.filter((lot) => lot.type !== type);
        if (kg === 0) return true;
        const where = location ?? existing?.location ?? (this.getRules().ammoLocations === "torso" ? "torso" : mount.location);
        if (!this._allowsAmmoAt(where)) {
            mount.ammo = before;
            return false;
        }
        mount.ammo.push({ type, kg, location: where });
        mount.ammo.sort((a, b) => (item.ammo ?? []).findIndex((ammo) => ammo.type === a.type) - (item.ammo ?? []).findIndex((ammo) => ammo.type === b.type));
        if (!this._fits(where)) {
            mount.ammo = before;
            return false;
        }
        return true;
    }
    public getAmmoLots(): IMicroMechAmmoLot[] {
        const rule = this.getRules().ammoShots;
        return this.getMounts().flatMap((mount, mountIndex) => mount.ammo.map((lot) => {
            const ammo = mount.item.ammo?.find((each) => each.type === lot.type);
            return {
                ...lot,
                mountIndex,
                tag: mount.tag,
                name: mount.item.name,
                shots: ammo ? getMicroMechAmmoShots(ammo, lot.kg, rule) : 0,
                slots: Math.ceil(lot.kg / AMMO_KG_PER_SLOT),
            };
        }));
    }
    /** Jump jets "may be mounted on the legs and torso only", one slot each. */
    public getJumpJetSlotsFree(): number {
        return this.getLocations().filter((location) => location === "torso" || MICRO_MECH_SLOTS[location].fixed.includes("Upper Leg Actuator Group"))
            .reduce((sum, location) => sum + this.getFreeSlots(location), 0);
    }

    // Weight -----------------------------------------------------------------------------------------------------

    public getWeightLog(): IMicroMechWeightLine[] {
        const lines: IMicroMechWeightLine[] = [
            { name: "Internal structure", kg: this.getStructureWeight() },
            { name: `Engine (${this.getInstalledEngineRating()} ${this._engineKind === "fusion" ? "fusion" : "ICE"})`, kg: this.getEngineWeight() },
            { name: "Gyro", kg: this.getGyroWeight() },
            { name: "Cockpit", kg: this.getCockpitWeight() },
            { name: `Armor (${this.getArmorPoints()} points)`, kg: this.getArmorWeight() },
        ];
        if (this._jumpJets > 0) lines.push({ name: `Jump jets (${this._jumpJets})`, kg: this.getJumpJetWeight() });
        if (this._sealed) lines.push({ name: "Environmental sealing", kg: this.getSealingWeight() });
        if (this._extraHeatSinks > 0) lines.push({ name: `Heat sinks (${this._extraHeatSinks} extra)`, kg: this.getHeatSinkWeight() });
        if (this.getPowerAmplifierWeight() > 0) lines.push({ name: "Power amplifiers", kg: this.getPowerAmplifierWeight() });
        for (const mount of this.getMounts()) lines.push({ name: `${mount.item.name} (${this.getLocationName(mount.location)})`, kg: mount.item.weightKg });
        for (const lot of this.getAmmoLots()) {
            const type = lot.type === "cluster" ? ", cluster" : "";
            lines.push({ name: `Ammo (${lot.name}${type}), ${lot.shots} shots (${this.getLocationName(lot.location)})`, kg: lot.kg });
        }
        return lines;
    }
    public getWeight(): number { return this.getWeightLog().reduce((sum, line) => sum + line.kg, 0); }
    public getMaxWeight(): number { return this._tons * 1000; }
    public getRemainingWeight(): number { return this.getMaxWeight() - this.getWeight(); }

    // Cost -------------------------------------------------------------------------------------------------------

    /** The document's sample whose name, tonnage and weight this design has, if any: its printed figures are shown beside ours. */
    public getPrintedFigures(): IMicroMechPrintedFigures | undefined {
        const name = this._name.trim().toLowerCase();
        return MICRO_MECH_PRINTED_FIGURES.find((sample) => sample.name.toLowerCase() === name && sample.tons === this._tons && sample.weightKg === this.getWeight());
    }

    /**
     * The C-bill cost: the BattleMech Costs Table (Master Rules, Revised p.149) with the rows the document's appendix
     * changes. The ammunition carried is counted, as the document's samples count it. Fractions are rounded up.
     */
    public getCostBreakdown(): ICalcBreakdown {
        const trace = new CalcTrace(MICRO_MECH_COST_STEPS);
        const tons = this._tons;
        const rating = this.getInstalledEngineRating();
        let total = 0;
        const add = (id: string, label: string, detail: string | undefined, value: number): void => {
            total += value;
            trace.add(id, detail ? { label, detail, value } : { label, value });
        };
        const perTon = (id: string, label: string, rate: number, count = 1): void =>
            add(id, label, `${tons} tons x ${fmt(rate)}${count > 1 ? ` x ${count}` : ""}`, tons * rate * count);

        add("mm.cost.cockpit", "Cockpit", undefined, 150000);
        add("mm.cost.life-support", "Life Support", undefined, 40000);
        perTon("mm.cost.sensors", "Sensors", 1500);
        perTon("mm.cost.musculature", "Musculature (standard)", 2000);
        perTon("mm.cost.structure", "Internal Structure (standard)", 400);
        if (!this.isQuad()) {
            perTon("mm.cost.actuators", "Upper Arm Actuator Groups", 100, 2);
            const lower = (this.hasLowerArm("left") ? 1 : 0) + (this.hasLowerArm("right") ? 1 : 0);
            if (lower > 0) perTon("mm.cost.actuators", `Lower Arm Actuator Group${lower > 1 ? "s" : ""}`, 130, lower);
        }
        const legs = this.isQuad() ? 4 : 2;
        perTon("mm.cost.actuators", "Upper Leg Actuator Groups", 150, legs);
        perTon("mm.cost.actuators", "Lower Leg Actuator Groups", 200, legs);
        if (this._engineKind === "ice") {
            add("mm.cost.engine.ice", `Engine (${rating} ICE)`, `(1,250 x ${rating} x ${tons} tons) / 75, rounded up`, ceilCBill(1250 * rating * tons / 75));
        } else {
            add("mm.cost.engine", `Engine (${rating} fusion)`, `(5,000 x ${rating} x ${tons} tons) / 75, rounded up`, ceilCBill(5000 * rating * tons / 75));
        }
        add("mm.cost.gyro", "Gyro", `300,000 x ${this.getGyroWeight() / 1000} tons of gyro`, 300 * this.getGyroWeight());
        if (this._jumpJets > 0) add("mm.cost.jump-jets", "Jump Jets", `${tons} tons x ${this._jumpJets} jets squared x 150`, tons * this._jumpJets * this._jumpJets * 150);
        if (this._sealed) perTon("mm.cost.sealing", "Environmental Sealing", 1000);
        if (this._extraHeatSinks > 0) {
            const over = Math.max(0, this.getHeatSinks() - 10);
            add("mm.cost.heat-sinks", "Heat Sinks", `2,000 x ${over} over 10 (${this.getHeatSinks()} fitted)`, 2000 * over);
        }
        if (this.getPowerAmplifierWeight() > 0) {
            add("mm.cost.power-amplifiers", "Power Amplifiers", `20,000 x ${this.getPowerAmplifierWeight() / 1000} tons of amplifier`, 20 * this.getPowerAmplifierWeight());
        }
        add("mm.cost.armor", `Armor (${this.getArmorPoints()} points, standard)`, `10,000 x ${this.getArmorWeight() / 1000} tons of armor`, 10 * this.getArmorWeight());

        for (const mount of this.getMounts()) add("mm.cost.equipment", `${mount.item.name} (${this.getLocationName(mount.location)})`, undefined, mount.item.cost);
        for (const lot of this.getAmmoLots()) {
            const ammo = findMicroMechItem(lot.tag)?.ammo?.find((each) => each.type === lot.type);
            if (!ammo) continue;
            add("mm.cost.ammo", `Ammo (${lot.name}${lot.type === "cluster" ? ", cluster" : ""})`, `${fmt(ammo.costPerTon)} a ton x ${lot.kg / 1000} tons`, ammo.costPerTon * lot.kg / 1000);
        }
        trace.add("mm.cost.subtotal", { label: "Structural, weapon and equipment cost", value: total, emphasis: true });
        const multiplier = 1 + tons / 100;
        trace.add("mm.cost.multiplier", { label: "Final cost multiplier", detail: `1 + (${tons} tons / 100)`, value: multiplier });
        const result = ceilCBill(total * (100 + tons) / 100);
        trace.add("mm.cost.final", { label: "Total cost, rounded up", detail: `${fmt(total)} x ${multiplier}`, value: result, emphasis: true });
        const printed = this.getPrintedFigures();
        if (printed) {
            trace.add("mm.cost.printed", { label: printed.corrupt ? "The document prints (a corrupt figure)" : "The document prints", value: printed.cost });
        }
        if (this.getRules().borrowsTablesFrom) trace.add("mm.cost.borrowed", { label: "Cost rules from version 6.1.0.2" });
        return { kind: "cost", edition: this._rulesEdition, steps: trace.steps, result };
    }
    public getCBillCost(): number { return this.getCostBreakdown().result ?? 0; }

    // Battle Value -------------------------------------------------------------------------------------------------

    /** No official Battle Value exists for a fan-made unit: the document's under a BV1 edition, ours under BV2. */
    public isBattleValueProvisional(): true { return true; }

    /** Is the torso protected by CASE (CASE II counts)? */
    private _torsoHasCase(): boolean {
        return this.getMounts().some((mount) => mount.location === "torso" && (mount.tag === CASE_TAG || mount.tag === CASE_II_TAG));
    }
    private _hasCase(location: MicroMechLocation): boolean {
        return this.getMounts().some((mount) => mount.location === location && mount.tag === CASE_TAG);
    }
    private _hasCaseII(location: MicroMechLocation): boolean {
        return this.getMounts().some((mount) => mount.location === location && mount.tag === CASE_II_TAG);
    }
    /** The mounts an Artemis IV FCS is read as fitted to: one LRM or SRM launcher each, in the order mounted. */
    private _artemisMounts(): Set<number> {
        const mounts = this.getMounts();
        const systems = mounts.filter((mount) => mount.tag === ARTEMIS_TAG).length;
        const launchers = mounts.map((mount, index) => ({ mount, index })).filter(({ mount }) => mount.item.family === "lrm" || mount.item.family === "srm");
        return new Set(launchers.slice(0, systems).map(({ index }) => index));
    }

    /**
     * The document's Battle Value: the Master Rules (Revised) BattleMech procedure, pp.152-154, with the appendix's
     * changes. The Micro-Mech's tonnage; 30, 30, 20 and 5 points a ton of ammunition; 0.1 more on the Defensive
     * Movement Factor; no heat steps; part-ton ammunition at its fraction, unrounded.
     */
    private _calcBattleValue1(trace: CalcTrace): number {
        const mounts = this.getMounts();
        const lots = this.getAmmoLots();
        const armor = this.getArmorPoints() * 2;
        let defensive = armor;
        trace.add("mm.bv1.def.armor", { label: "Armor", detail: `${this.getArmorPoints()} points x 2`, value: armor, total: defensive });
        const structure = this.getTotalStructure() * 1.5;
        defensive += structure;
        trace.add("mm.bv1.def.structure", { label: "Internal structure", detail: `${this.getTotalStructure()} points x 1.5`, value: structure, total: defensive });
        defensive += this._tons;
        trace.add("mm.bv1.def.tonnage", { label: "Micro-Mech tonnage", value: this._tons, total: defensive });
        for (const mount of mounts) {
            if (!isDefensiveBv1(mount.item) || mount.item.battleValue === null) continue;
            defensive += mount.item.battleValue;
            trace.add("mm.bv1.def.equipment", { label: mount.item.name, value: mount.item.battleValue, total: defensive });
        }
        const torsoCase = this._torsoHasCase();
        for (const lot of lots) {
            const arm = lot.location === "la" || lot.location === "ra";
            const [rate, why] = this._hasCaseII(lot.location) ? [5, "CASE II in its location"]
                : arm && torsoCase ? [20, "in an arm, CASE in the torso"]
                : [30, arm ? "in an arm, no CASE in the torso" : `in the ${this.getLocationName(lot.location).toLowerCase()}`];
            const value = -rate * lot.kg / 1000;
            defensive += value;
            trace.add(lot.location === "head" && rate === 30 ? "mm.bv1.def.explosive.head" : "mm.bv1.def.explosive", {
                label: `Ammo (${lot.name}), ${why}`, detail: `${rate} x ${lot.kg / 1000} tons, subtracted`, value, total: defensive,
            });
        }
        trace.add("mm.bv1.def.no-heat", { label: "No heat step: a Micro-Mech does not generate heat" });
        defensive = Math.max(1, defensive);
        trace.add("mm.bv1.def.subtotal", { label: "Defensive subtotal (never below 1)", value: defensive, emphasis: true });
        // Attack Modifiers Table, BMR(R) p.33: 0-2 hexes +0, 3-4 +1, 5-6 +2, 7-9 +3, 10 or more +4; a jump +1 more.
        const run = this.getRunMP();
        const tmm = Math.max(targetMovementModifier(run, 4), this._jumpJets > 0 ? targetMovementModifier(this._jumpJets, 4) + 1 : 0);
        const factor = round2(1 + tmm / 10 + 0.1);
        trace.add("mm.bv1.def.factor", { label: "Defensive Movement Factor", detail: `1 + (target movement modifier +${tmm}) / 10 + 0.1 for a Micro-Mech`, value: factor });
        const defensiveRating = defensive * factor;
        trace.add("mm.bv1.def.rating", { label: "Defensive Battle Rating", detail: `${formatCalcNumber(defensive)} x ${factor}`, value: defensiveRating, emphasis: true });

        let offensive = 0;
        const artemis = this._artemisMounts();
        mounts.forEach((mount, index) => {
            const item = mount.item;
            if (isMicroMechWeapon(item)) {
                const base = item.battleValue ?? 0;
                const value = artemis.has(index) ? base * 1.2 : base;
                offensive += value;
                trace.add(artemis.has(index) ? "mm.bv1.off.weapon.artemis" : "mm.bv1.off.weapon", artemis.has(index)
                    ? { label: `${item.name} with Artemis IV`, detail: `${base} x 1.2`, value, total: offensive }
                    : { label: item.name, value, total: offensive });
            } else if (item.battleValue !== null && !isDefensiveBv1(item)) {
                offensive += item.battleValue;
                trace.add("mm.bv1.off.equipment", { label: item.name, value: item.battleValue, total: offensive });
            } else if (item.battleValue === null && FORCE_VALUED_TAGS.includes(item.tag)) {
                trace.add("mm.bv1.off.force", { label: `${item.name}: valued for the force`, value: 0, total: offensive });
            }
        });
        for (const lot of lots) {
            const ammo = findMicroMechItem(lot.tag)?.ammo?.find((each) => each.type === lot.type);
            if (!ammo) continue;
            const value = ammo.bvPerTon * lot.kg / 1000;
            offensive += value;
            trace.add("mm.bv1.off.ammo", { label: `Ammo (${lot.name}${lot.type === "cluster" ? ", cluster" : ""})`, detail: `${ammo.bvPerTon} a ton x ${lot.kg / 1000} tons, unrounded`, value, total: offensive });
        }
        trace.add("mm.bv1.off.base", { label: "Base Weapon Battle Rating", value: offensive, emphasis: true });
        trace.add("mm.bv1.off.no-heat", { label: "No heat efficiency step: a Micro-Mech does not generate heat" });
        const speed = getSpeedFactor(run + this._jumpJets);
        trace.add("mm.bv1.off.speed", { label: "Speed Factor", detail: `Running MP ${run} + Jumping MP ${this._jumpJets}`, value: speed });
        const offensiveRating = offensive * speed;
        trace.add("mm.bv1.off.rating", { label: "Offensive Battle Rating", detail: `${formatCalcNumber(offensive)} x ${speed}`, value: offensiveRating, emphasis: true });

        const result = Math.round(defensiveRating + offensiveRating);
        trace.add("mm.bv1.final.round", { label: "Battle Value (provisional)", detail: `${formatCalcNumber(defensiveRating)} + ${formatCalcNumber(offensiveRating)}, rounded`, value: result, emphasis: true });
        const printed = this.getPrintedFigures();
        if (printed) {
            trace.add("mm.bv1.final.printed", { label: printed.corrupt ? "The document prints (a corrupt figure)" : "The document prints", value: printed.battleValue });
        }
        if (this.getRules().borrowsTablesFrom) trace.add("mm.bv1.final.borrowed", { label: "Battle Value rules from version 6.1.0.2" });
        return result;
    }

    /**
     * Our provisional BV2 (NGCFells's ruling 2): the TechManual BattleMech procedure (pp.302-304) with each of the document's
     * changes carried across, each item at the BV2 figure the JBT catalog holds for it. Every step says what was done.
     */
    private _calcBattleValue2(trace: CalcTrace): number {
        const mounts = this.getMounts();
        const lots = this.getAmmoLots();
        const armor = this.getArmorPoints() * 2.5;
        let defensive = armor;
        trace.add("mm.bv2.def.armor", { label: "Armor", detail: `${this.getArmorPoints()} points x 2.5`, value: armor, total: defensive });
        const structure = this.getTotalStructure() * 1.5;
        defensive += structure;
        trace.add("mm.bv2.def.structure", { label: "Internal structure", detail: `${this.getTotalStructure()} points x 1.5`, value: structure, total: defensive });
        defensive += this._tons * 0.5;
        trace.add("mm.bv2.def.tonnage", { label: "Micro-Mech tonnage (gyro)", detail: `${this._tons} tons x 0.5`, value: this._tons * 0.5, total: defensive });
        for (const mount of mounts) {
            const bv2 = getMicroMechItemBattleValue2(mount.item);
            if (!bv2.defensive) continue;
            defensive += bv2.battleValue;
            trace.add("mm.bv2.def.equipment", { label: mount.item.name, value: bv2.battleValue, total: defensive });
        }
        const torsoCase = this._torsoHasCase();
        for (const lot of lots) {
            const arm = lot.location === "la" || lot.location === "ra";
            const [rate, why] = this._hasCaseII(lot.location) ? [0, "CASE II in its location"]
                : arm && torsoCase ? [15, "in an arm, CASE in the torso"]
                : [22.5, arm ? "in an arm, no CASE in the torso" : `in the ${this.getLocationName(lot.location).toLowerCase()}`];
            const value = rate === 0 ? 0 : -rate * lot.kg / 1000;
            defensive += value;
            trace.add("mm.bv2.def.explosive", { label: `Ammo (${lot.name}), ${why}`, detail: `${rate} x ${lot.kg / 1000} tons, subtracted`, value, total: defensive });
        }
        defensive = Math.max(1, defensive);
        trace.add("mm.bv2.def.subtotal", { label: "Defensive subtotal (never below 1)", value: defensive, emphasis: true });
        const run = this.getRunMP();
        const tmm = Math.max(targetMovementModifier(run), this._jumpJets > 0 ? targetMovementModifier(this._jumpJets) + 1 : 0);
        const factor = round2(1 + tmm / 10 + 0.1);
        trace.add("mm.bv2.def.factor", { label: "Defensive factor", detail: `1 + (target movement modifier +${tmm}) / 10 + 0.1 for a Micro-Mech`, value: factor });
        const defensiveRating = defensive * factor;
        trace.add("mm.bv2.def.rating", { label: "Defensive Battle Rating", detail: `${formatCalcNumber(defensive)} x ${factor}`, value: defensiveRating, emphasis: true });

        let offensive = 0;
        const artemis = this._artemisMounts();
        /** Unmodified weapon BV by table row, the cap on that row's ammunition (TM p.303). */
        const weaponTotals = new Map<string, number>();
        mounts.forEach((mount, index) => {
            const item = mount.item;
            const bv2 = getMicroMechItemBattleValue2(item);
            if (isMicroMechWeapon(item)) {
                weaponTotals.set(item.tag, (weaponTotals.get(item.tag) ?? 0) + bv2.battleValue);
                const value = artemis.has(index) ? bv2.battleValue * 1.2 : bv2.battleValue;
                offensive += value;
                const id = artemis.has(index) ? "mm.bv2.off.weapon.artemis" : bv2.fromCatalog ? "mm.bv2.off.weapon" : "mm.bv2.off.weapon.document";
                trace.add(id, artemis.has(index)
                    ? { label: `${item.name} with Artemis IV${bv2.fromCatalog ? "" : " (the document's figure)"}`, detail: `${bv2.battleValue} x 1.2`, value, total: offensive }
                    : { label: item.name, value, total: offensive });
            } else if (item.battleValue === null && FORCE_VALUED_TAGS.includes(item.tag)) {
                trace.add("mm.bv2.off.force", { label: `${item.name}: valued for the force`, value: 0, total: offensive });
            } else if (item.battleValue !== null && !bv2.defensive) {
                offensive += bv2.battleValue;
                trace.add("mm.bv2.off.equipment", { label: item.name, value: bv2.battleValue, total: offensive });
            }
        });
        const ammoTotals = new Map<string, { name: string; value: number }>();
        for (const lot of lots) {
            const item = findMicroMechItem(lot.tag);
            if (!item) continue;
            const bv2 = getMicroMechItemBattleValue2(item);
            const value = bv2.ammoPerTon * lot.kg / 1000;
            const group = ammoTotals.get(lot.tag) ?? { name: lot.name, value: 0 };
            group.value += value;
            ammoTotals.set(lot.tag, group);
            trace.add("mm.bv2.off.ammo", {
                label: `Ammo (${lot.name}${lot.type === "cluster" ? ", cluster" : ""})${bv2.ammoFromCatalog ? "" : " (the document's figure)"}`,
                detail: `${bv2.ammoPerTon} a ton x ${lot.kg / 1000} tons, unrounded`, value,
            });
        }
        let ammoCounted = 0;
        for (const [tag, group] of ammoTotals) {
            const cap = weaponTotals.get(tag) ?? 0;
            const counted = Math.min(group.value, cap);
            ammoCounted += counted;
            if (counted < group.value) {
                trace.add("mm.bv2.off.ammo.cap", { label: `Ammo (${group.name}) limited to its weapons' Battle Value`, detail: `${formatCalcNumber(group.value)} over ${formatCalcNumber(cap)}`, value: counted });
            }
        }
        if (ammoTotals.size > 0) {
            offensive += ammoCounted;
            trace.add("mm.bv2.off.ammo.total", { label: "Ammunition counted", value: ammoCounted, total: offensive });
        }
        offensive += this._tons;
        trace.add("mm.bv2.off.tonnage", { label: "Micro-Mech tonnage", value: this._tons, total: offensive });
        const speed = getSpeedFactor(run + Math.ceil(this._jumpJets / 2));
        trace.add("mm.bv2.off.speed", { label: "Speed factor", detail: `Running MP ${run} + half of Jumping MP ${this._jumpJets}, rounded up`, value: speed });
        const offensiveRating = offensive * speed;
        trace.add("mm.bv2.off.rating", { label: "Offensive Battle Rating", detail: `${formatCalcNumber(offensive)} x ${speed}`, value: offensiveRating, emphasis: true });

        const result = Math.round(defensiveRating + offensiveRating);
        trace.add("mm.bv2.final.round", { label: "Battle Value 2 (provisional, NGCFells's)", detail: `${formatCalcNumber(defensiveRating)} + ${formatCalcNumber(offensiveRating)}, rounded`, value: result, emphasis: true });
        if (this.getRules().borrowsTablesFrom) trace.add("mm.bv2.final.borrowed", { label: "Battle Value rules from version 6.1.0.2" });
        return result;
    }

    /**
     * The Battle Value steps under `edition`: the document's under a Battle Value 1 edition, NGCFells's provisional BV2 under
     * a BV2 edition, and one step with a null result under an edition older than the Battle Value system.
     */
    public getBattleValueBreakdown(edition: string = this._rulesEdition): ICalcBreakdown {
        if (!editionHasBattleValue(edition, "mech")) {
            const trace = new CalcTrace(NO_BATTLE_VALUE_STEPS);
            trace.add("none.no-battle-value", { label: `${getRulesEdition(edition).name} has no Battle Value. Battle Value first appears in the BattleTech Master Rules (1998)` });
            return { kind: "battle-value", edition, scheme: "none", steps: trace.steps, result: null };
        }
        return getBattleValueFor<ICalcBreakdown>(edition, "mech", {
            bv1: () => {
                const trace = new CalcTrace(MICRO_MECH_BV1_STEPS);
                return { kind: "battle-value", edition, scheme: "bv1", result: this._calcBattleValue1(trace), steps: trace.steps };
            },
            bv2: () => {
                const trace = new CalcTrace(MICRO_MECH_BV2_STEPS);
                return { kind: "battle-value", edition, scheme: "bv2", result: this._calcBattleValue2(trace), steps: trace.steps };
            },
        });
    }
    /** The Battle Value under `edition`; an edition with no Battle Value system reads NGCFells's BV2, as a BattleMech does. */
    public getBattleValue(edition: string = this._rulesEdition): number {
        return getBattleValueFor(edition, "mech", {
            bv1: () => this._calcBattleValue1(new CalcTrace(MICRO_MECH_BV1_STEPS)),
            bv2: () => this._calcBattleValue2(new CalcTrace(MICRO_MECH_BV2_STEPS)),
        });
    }

    // Play (Chunk F) ----------------------------------------------------------------------------------------------
    // "Micro-Mech Rules" in both texts (6.1.0.2 raw lines 37-182; the 2019 post's rules section). Where they say "as
    // for Battlemechs", Total Warfare (2022 printing) is followed and cited.

    public getGunnery(): number { return this._gunnery; }
    public setGunnery(skill: number): void { this._gunnery = clampInt(skill, 0, 8, 4); }
    public getPiloting(): number { return this._piloting; }
    public setPiloting(skill: number): void { this._piloting = clampInt(skill, 0, 8, 5); }
    /** "Micro-Mechs pilots use the gunnery and piloting skill ratings the same as a Mechwarrior": the 'Mech skill table. */
    public getSkillMultiplier(edition: string = this._rulesEdition): number {
        return getSkillMultiplier(this._gunnery, this._piloting, "mech", getBattleValueSkillEdition(edition, "mech")) ?? 1;
    }
    /** The Battle Value with the pilot's skills, for the roster (rounded to the nearest, as the other unit types). */
    public getSkillAdjustedBattleValue(edition: string = this._rulesEdition): number {
        return Math.floor(this.getBattleValue(edition) * this.getSkillMultiplier(edition) + 0.5);
    }

    public getInPlay(): IMicroMechInPlay { return JSON.parse(JSON.stringify(this._inPlay)); }
    /** Clears all damage, hits and shots fired; a 2019 pilot keeps the neurohelmet. */
    public resetInPlay(): void { this._inPlay = this._inPlay.neurohelmet ? { neurohelmet: true } : {}; }
    public hasInPlayState(): boolean { return Object.keys(this._inPlay).length > 0; }

    private _lost(field: "armor" | "structure", location: MicroMechLocation): number { return this._inPlay[field]?.[location] ?? 0; }
    private _setLost(field: "armor" | "structure", location: MicroMechLocation, points: number): void {
        const record = { ...(this._inPlay[field] ?? {}) };
        if (points > 0) record[location] = points;
        else delete record[location];
        if (Object.keys(record).length > 0) this._inPlay[field] = record;
        else delete this._inPlay[field];
    }
    public getArmorLeft(location: MicroMechLocation): number { return Math.max(0, this.getArmor(location) - this._lost("armor", location)); }
    public getStructureLeft(location: MicroMechLocation): number { return Math.max(0, this.getStructure(location) - this._lost("structure", location)); }
    /** Marks a location's armor points lost (the sheet's circles). */
    public setArmorDamage(location: MicroMechLocation, points: number): void {
        if (this.getLocations().includes(location)) this._setLost("armor", location, clampInt(points, 0, this.getArmor(location), 0));
    }
    public setStructureDamage(location: MicroMechLocation, points: number): void {
        if (this.getLocations().includes(location)) this._setLost("structure", location, clampInt(points, 0, this.getStructure(location), 0));
    }
    public getCockpitArmorLeft(): number { return MICRO_MECH_COCKPIT_ARMOR - (this._inPlay.cockpit ?? 0); }
    public setCockpitDamage(points: number): void {
        const lost = clampInt(points, 0, MICRO_MECH_COCKPIT_ARMOR, 0);
        if (lost > 0) this._inPlay.cockpit = lost;
        else delete this._inPlay.cockpit;
    }
    /** A location whose structure is gone. The rear torso is the torso's armor only. */
    public isLocationDestroyed(location: MicroMechLocation): boolean {
        return location !== "torsoRear" && this.getStructure(location) > 0 && this.getStructureLeft(location) === 0;
    }

    private _storedPilotHits(): number { return this._inPlay.pilotHits ?? 0; }
    private _addPilotHits(hits: number): void { this.setPilotHits(this._storedPilotHits() + hits); }
    /** Six hits, or killed outright (all three cockpit armor points gone, or a Cockpit critical hit). */
    public getPilotHits(): number { return this.isPilotKilled() ? MICRO_MECH_PILOT_HITS : this._storedPilotHits(); }
    public setPilotHits(hits: number): void {
        const value = clampInt(hits, 0, MICRO_MECH_PILOT_HITS, 0);
        if (value > 0) this._inPlay.pilotHits = value;
        else delete this._inPlay.pilotHits;
    }
    /** "The pilot is killed if all three of the cockpit's armor points are eliminated"; a Cockpit critical hit kills too. */
    public isPilotKilled(): boolean {
        return this._storedPilotHits() >= MICRO_MECH_PILOT_HITS || this.getCockpitArmorLeft() <= 0 || this._hitNames("torso").includes("Cockpit");
    }

    public hasNeurohelmet(): boolean { return this._inPlay.neurohelmet === true; }
    /** 2019 only ("Micro-Mechs can use a neurohelmet and this gives a -1 bonus to piloting rolls"); kept but unused under 6.1.0.2. */
    public setNeurohelmet(worn: boolean): void {
        if (worn) this._inPlay.neurohelmet = true;
        else delete this._inPlay.neurohelmet;
    }

    // Ammunition in play: one counter per lot, in getAmmoLots order.
    public getShotsFired(lotIndex: number): number { return this._inPlay.shotsFired?.[lotIndex] ?? 0; }
    public getShotsLeft(lotIndex: number): number {
        const lot = this.getAmmoLots()[lotIndex];
        return lot ? Math.max(0, lot.shots - this.getShotsFired(lotIndex)) : 0;
    }
    public setShotsFired(lotIndex: number, shots: number): void {
        const lots = this.getAmmoLots();
        if (!Number.isInteger(lotIndex) || lotIndex < 0 || lotIndex >= lots.length) return;
        const fired = lots.map((_lot, index) => this._inPlay.shotsFired?.[index] ?? 0);
        fired[lotIndex] = clampInt(shots, 0, lots[lotIndex].shots, 0);
        if (fired.some((value) => value > 0)) this._inPlay.shotsFired = fired;
        else delete this._inPlay.shotsFired;
    }

    // Slots in play ----------------------------------------------------------------------------------------------

    private _legLocations(): MicroMechLocation[] {
        return this.getLocations().filter((location) => MICRO_MECH_SLOTS[location].fixed.includes(MICRO_MECH_UPPER_LEG));
    }
    /**
     * Where the jump jets sit (NGCFells's: the texts say only "on the legs and torso"): one to each leg in turn while a
     * leg has a free slot, then the torso.
     */
    private _jetPlacement(): Partial<Record<MicroMechLocation, number>> {
        const legs = this._legLocations();
        const free: Partial<Record<MicroMechLocation, number>> = {};
        for (const location of [...legs, "torso" as MicroMechLocation]) free[location] = this.getFreeSlots(location);
        const placed: Partial<Record<MicroMechLocation, number>> = {};
        let left = this._jumpJets;
        let progress = true;
        while (left > 0 && progress) {
            progress = false;
            for (const leg of legs) {
                if (left > 0 && (free[leg] ?? 0) > 0) {
                    placed[leg] = (placed[leg] ?? 0) + 1;
                    free[leg] = (free[leg] ?? 0) - 1;
                    left--;
                    progress = true;
                }
            }
        }
        if (left > 0) placed.torso = Math.min(left, free.torso ?? 0);
        return placed;
    }
    private _playSlotEntries(location: MicroMechLocation): (IMicroMechSlotEntry | null)[] {
        if (!this.getLocations().includes(location)) return [];
        const entries: (IMicroMechSlotEntry | null)[] = this._slotEntries(location);
        const jets = this._jetPlacement()[location] ?? 0;
        for (let i = 0; i < jets; i++) entries.push({ name: JUMP_JET_SLOT, kind: "jet" });
        while (entries.length < MICRO_MECH_SLOTS[location].slots) entries.push(null);
        return entries;
    }
    /** The location's slots as the record sheet prints them in play: getSlots with the jump jets placed. */
    public getPlaySlots(location: MicroMechLocation): (string | null)[] {
        return this._playSlotEntries(location).map((entry) => entry?.name ?? null);
    }
    public isSlotHit(location: MicroMechLocation, slot: number): boolean { return this._inPlay.slots?.[location]?.includes(slot) ?? false; }
    private _hitNames(location: MicroMechLocation): string[] {
        const slots = this.getPlaySlots(location);
        return (this._inPlay.slots?.[location] ?? []).map((index) => slots[index]).filter((name): name is string => !!name);
    }
    public getEngineHits(): number { return this._hitNames("torso").filter((name) => name === "Engine").length; }
    /** "The gyro is destroyed by the first critical hit." */
    public isGyroDestroyed(): boolean { return this._hitNames("torso").includes("Gyro"); }
    /** A Sensors hit, or the head gone ("The sensors and any other systems mounted in the head are destroyed"). */
    public hasSensorDamage(): boolean { return this._hitNames("head").includes("Sensors") || this.isLocationDestroyed("head"); }
    /** "The first critical hit: The Micro-Mech cannot fire any energy weapons." */
    public canFireEnergyWeapons(): boolean { return this.getEngineHits() === 0; }

    /**
     * The slot a critical hit strikes. Head: 1D6, 1-3 the first slot, 4-6 the second. Arms and legs: 1-2, 3-4, 5-6.
     * Torso "use the same rules as a Battlemech": a first 1D6 picks the column (1-3, 4-6), a second the slot.
     */
    public getCriticalSlotForRoll(location: MicroMechLocation, first: number, second: number = 1): number {
        const d1 = clampInt(first, 1, 6, 1);
        const d2 = clampInt(second, 1, 6, 1);
        const where = location === "torsoRear" ? "torso" : location;
        if (where === "torso") return (d1 <= 3 ? 0 : 6) + d2 - 1;
        if (where === "head") return d1 <= 3 ? 0 : 1;
        return Math.floor((d1 - 1) / 2);
    }

    /**
     * Rolls on the Determining Critical Hits Table (TW p.124: 8-9 one hit, 10-11 two, 12 three in the torso or the
     * head or limb blown off), each hit rolling its slot again on an empty slot or one already hit (TW p.124).
     * `dice` gives the players' rolls in order.
     */
    public rollCriticalHit(location: MicroMechLocation, dice: { chance?: number; lines?: number[] } = {}): string[] {
        const die = () => 1 + Math.floor(Math.random() * 6);
        const queue = [...(dice.lines ?? [])];
        const next = () => queue.shift() ?? die();
        const where = location === "torsoRear" ? "torso" : location;
        if (!this.getLocations().includes(where)) return [];
        const name = this.getLocationName(where);
        const roll = dice.chance ?? die() + die();
        if (roll >= 12 && where !== "torso") {
            this.setArmorDamage(where, this.getArmor(where));
            this.setStructureDamage(where, this.getStructure(where));
            return [`Critical hit roll ${roll}: the ${name} is blown off${where === "head" ? "; its sensors are lost and the pilot is unhurt" : ""}.`];
        }
        const hits = criticalHitsForRoll(roll);
        if (hits === 0) return [`Critical hit roll ${roll}: no critical hit.`];
        const lines = [`Critical hit roll ${roll}: ${hits} critical hit${hits > 1 ? "s" : ""} in the ${name}.`];
        const slots = this.getPlaySlots(where);
        for (let hit = 0; hit < hits; hit++) {
            if (!slots.some((slot, index) => slot !== null && !this.isSlotHit(where, index))) {
                lines.push("No slot is left to hit.");
                break;
            }
            let slot = -1;
            for (let attempt = 0; attempt < 100 && slot < 0; attempt++) {
                const candidate = where === "torso" ? this.getCriticalSlotForRoll(where, next(), next()) : this.getCriticalSlotForRoll(where, next());
                if (slots[candidate] !== null && !this.isSlotHit(where, candidate)) slot = candidate;
            }
            if (slot < 0) slot = slots.findIndex((each, index) => each !== null && !this.isSlotHit(where, index));
            lines.push(`${slots[slot]} (slot ${slot + 1}) hit.`, ...this.setSlotHit(where, slot, true));
        }
        return lines;
    }

    /** Marks a slot hit or not; a new hit returns its effects (an ammunition slot explodes). */
    public setSlotHit(location: MicroMechLocation, slot: number, hit: boolean): string[] {
        const entries = this._playSlotEntries(location);
        const entry = entries[slot];
        if (!Number.isInteger(slot) || !entry) return [];
        const was = this.isSlotHit(location, slot);
        this._markSlot(location, slot, hit);
        if (!hit || was) return [];
        return this._criticalEffect(location, entry);
    }
    /** Records a slot as hit or not, with no effect (a save being read). */
    private _markSlot(location: MicroMechLocation, slot: number, hit: boolean): void {
        const record = { ...(this._inPlay.slots ?? {}) };
        const list = (record[location] ?? []).filter((index) => index !== slot);
        if (hit) list.push(slot);
        list.sort((a, b) => a - b);
        if (list.length > 0) record[location] = list;
        else delete record[location];
        if (Object.keys(record).length > 0) this._inPlay.slots = record;
        else delete this._inPlay.slots;
    }

    private _criticalEffect(location: MicroMechLocation, entry: IMicroMechSlotEntry): string[] {
        const rules = this.getRules();
        switch (entry.kind) {
            case "ammo": return this._explodeAmmo(location, entry.lots ?? []);
            case "jet": return ["A jump jet is lost: -1 Jump MP."];
            case "mount": return [`${entry.name} destroyed.`];
            default: break;
        }
        switch (entry.name) {
            case "Cockpit": return ["Cockpit hit: the pilot is killed."];
            case "Engine": return this.getEngineHits() >= 2
                ? ["Second engine hit: the power plant is destroyed and the unit is out of the game."]
                : ["First engine hit: no energy weapons may fire. If Life Support is also hit, the pilot takes one hit a turn until the engine is shut down."];
            case "Gyro": return [`Gyro destroyed. ${rules.gyroHit}`];
            case "Life Support": return ["Life Support hit: no effect in normal conditions; with an engine hit, one pilot hit a turn until the engine is shut down. See the notes for hostile environments."];
            case "Sensors": return ["Sensors hit: +4 to hit on all attacks, and only one target within short range."];
            case MICRO_MECH_UPPER_ARM: return ["Upper Arm Actuator Group hit: +4 to hit with this arm's weapons (not added to a Lower Arm hit)."];
            case MICRO_MECH_LOWER_ARM: return ["Lower Arm Actuator Group hit: +2 to hit with this arm's weapons."];
            case MICRO_MECH_UPPER_LEG: return ["Upper Leg Actuator Group hit: Walking MP halved, +4 on Piloting Skill Rolls, a roll whenever it runs; no kicks."];
            case MICRO_MECH_LOWER_LEG: return [`Lower Leg Actuator Group hit: -2 Walking MP, +2 on Piloting Skill Rolls${rules.lowerLegHitRunRoll ? ", a roll whenever it runs" : ""}; no kicks.`];
            default: return [`${entry.name} hit.`];
        }
    }

    /** Damage a shot of this weapon's ammunition does when it explodes: the damage value, or per missile times the tubes. */
    private _damagePerShot(item: IMicroMechItem): number {
        if (typeof item.damage === "number") return item.damage;
        const perMissile = /^(\d+)\/Hit$/.exec(item.damage);
        return perMissile ? Number(perMissile[1]) * (item.tubes ?? 1) : 0;
    }
    private _hasCaseAt(location: MicroMechLocation): boolean {
        return this.getMounts().some((mount) => mount.location === location && (mount.tag === CASE_TAG || mount.tag === CASE_II_TAG));
    }
    /**
     * "Same effects as an ammo explosion on a Battlemech except where noted": the shots left times the damage of each
     * go to the location's internal structure, the excess "directly to the internal structure of the next location
     * inward" (TW, Transferring Damage), or dissipating where there is CASE (TW, CASE). "The pilot of a Micro-Mech takes
     * three hits"; with no CASE the damage goes on past the torso into the cockpit.
     */
    private _explodeAmmo(location: MicroMechLocation, lotIndexes: number[]): string[] {
        const lots = this.getAmmoLots();
        const mounts = this.getMounts();
        let damage = 0;
        for (const index of lotIndexes) {
            const lot = lots[index];
            if (!lot) continue;
            damage += this.getShotsLeft(index) * this._damagePerShot(mounts[lot.mountIndex].item);
            this.setShotsFired(index, lot.shots);
        }
        this._addPilotHits(AMMO_EXPLOSION_PILOT_HITS);
        const lines = [`Ammunition explosion: ${damage} damage to the ${this.getLocationName(location)}'s internal structure; the pilot takes ${AMMO_EXPLOSION_PILOT_HITS} hits from feedback.`];
        let where = location;
        let remaining = damage;
        while (remaining > 0) {
            const points = Math.min(this.getStructureLeft(where), remaining);
            this.setStructureDamage(where, this._lost("structure", where) + points);
            remaining -= points;
            if (this.isLocationDestroyed(where)) lines.push(`${this.getLocationName(where)} destroyed.`);
            if (remaining <= 0) break;
            if (this._hasCaseAt(where)) {
                lines.push(`CASE: the other ${remaining} damage dissipates.`);
                break;
            }
            if (where === "torso") {
                lines.push(...this._damageCockpit(remaining));
                break;
            }
            where = "torso";
        }
        return lines;
    }

    /** Damage past the torso structure: the version's share of it (6.1.0.2 half, rounded down: ours) hits the cockpit armor, a pilot hit a point. */
    private _damageCockpit(overflow: number): string[] {
        const share = Math.floor(overflow * this.getRules().torsoOverflowToCockpit);
        const points = Math.min(share, this.getCockpitArmorLeft());
        if (points <= 0) return [`${overflow} damage past the torso structure; none reaches the cockpit.`];
        this.setCockpitDamage((this._inPlay.cockpit ?? 0) + points);
        this._addPilotHits(points);
        const lines = [`${overflow} damage past the torso structure: ${points} to the cockpit armor and ${points} pilot hit${points > 1 ? "s" : ""} (no critical hit roll).`];
        if (this.getCockpitArmorLeft() <= 0) lines.push("All three cockpit armor points are gone: the pilot is killed.");
        return lines;
    }

    /**
     * Applies damage "the same as for Battlemechs": armor, then structure. Damage passes from a limb or the head to the
     * torso; a destroyed location passes all of it on. Past the torso structure it reaches the cockpit (see
     * _damageCockpit). The pilot takes no hit from head or ordinary torso damage. A rear hit is the torso's rear armor.
     */
    public applyDamage(location: MicroMechLocation, points: number, rear: boolean = false): string[] {
        let where: MicroMechLocation = location === "torsoRear" ? "torso" : location;
        let useRear = rear || location === "torsoRear";
        if (!this.getLocations().includes(where)) return [];
        let remaining = clampInt(points, 0, 9999, 0);
        const lines: string[] = [];
        while (remaining > 0) {
            const name = this.getLocationName(where);
            if (this.isLocationDestroyed(where)) {
                if (where === "torso") {
                    lines.push(...this._damageCockpit(remaining));
                    break;
                }
                where = "torso";
                useRear = false;
                continue;
            }
            const armorAt: MicroMechLocation = where === "torso" && useRear ? "torsoRear" : where;
            const armor = Math.min(this.getArmorLeft(armorAt), remaining);
            if (armor > 0) {
                this.setArmorDamage(armorAt, this._lost("armor", armorAt) + armor);
                remaining -= armor;
            }
            if (remaining <= 0) break;
            const structure = Math.min(this.getStructureLeft(where), remaining);
            if (structure > 0) {
                this.setStructureDamage(where, this._lost("structure", where) + structure);
                remaining -= structure;
                lines.push(`${name}: ${structure} to the internal structure; roll for critical hits.`);
            }
            if (this.isLocationDestroyed(where)) lines.push(`${name} destroyed.`);
            if (remaining <= 0) break;
            if (where === "torso") {
                lines.push(...this._damageCockpit(remaining));
                break;
            }
            lines.push(`${remaining} passes to the torso.`);
            where = "torso";
            useRear = false;
        }
        return lines;
    }

    /** "Destroyed if the pilot is killed, the engine receives 2 critical hits or all the internal structure for the torso is eliminated." */
    public isDestroyed(): boolean {
        return this.isPilotKilled() || this.getEngineHits() >= 2 || this.isLocationDestroyed("torso");
    }
    public getDestroyedReason(): string | null {
        if (this.isPilotKilled()) return "The pilot is killed.";
        if (this.getEngineHits() >= 2) return "The engine is destroyed.";
        if (this.isLocationDestroyed("torso")) return "The torso's internal structure is gone.";
        return null;
    }

    private _legState(leg: MicroMechLocation): { destroyed: boolean; upper: boolean; lower: boolean } {
        const hits = this._hitNames(leg);
        return { destroyed: this.isLocationDestroyed(leg), upper: hits.includes(MICRO_MECH_UPPER_LEG), lower: hits.includes(MICRO_MECH_LOWER_LEG) };
    }

    /**
     * Movement now. Upper Leg hits halve Walking MP (round up; applied before the Lower Leg reductions, TW pp.127-128 as
     * errata'd for the hip), Lower Leg hits take 2 each; running is refigured on the new Walking MP. A lost leg follows
     * TW p.122: a biped walks 1 and cannot run, with both gone 0; a quad loses 1 MP for the first (replacing that
     * leg's actuator penalties), walks 1 with two gone and 0 with three. A gyro hit stops running and jumping. Each jump
     * jet hit, or on a lost leg, is -1 Jump MP.
     */
    public getPlayMovement(): IMicroMechPlayMovement {
        if (this.isDestroyed()) return { walk: 0, run: 0, jump: 0, text: "Destroyed", notes: [] };
        const rules = this.getRules();
        const notes: string[] = [];
        const legs = this._legLocations().map((leg) => ({ leg, ...this._legState(leg) }));
        const standing = legs.filter((leg) => !leg.destroyed);
        const lost = legs.length - standing.length;
        let walk = this._walkMP;
        for (const leg of standing) if (leg.upper) walk = Math.ceil(walk / 2);
        for (const leg of standing) if (leg.lower) walk -= 2;
        walk = Math.max(0, walk);
        let canRun = true;
        let canJump = true;
        if (this.isQuad()) {
            if (lost === 1) walk = Math.max(0, walk - 1);
            else if (lost === 2) { walk = Math.min(walk, 1); canRun = false; }
            else if (lost >= 3) { walk = 0; canRun = false; canJump = false; }
        } else if (lost === 1) {
            walk = Math.min(walk, 1);
            canRun = false;
        } else if (lost >= 2) {
            walk = 0;
            canRun = false;
            canJump = false;
        }
        if (lost > 0) notes.push("A leg is gone: +5 on Piloting Skill Rolls, a roll to stand, and a roll each time it lands from a jump (TW p.122).");
        if (this.isGyroDestroyed()) {
            canRun = false;
            canJump = false;
            notes.push("Gyro destroyed: it may stand, walk and fire; an attempt to run or jump falls in the hex.");
        }
        if (standing.some((leg) => leg.upper) || (rules.lowerLegHitRunRoll && standing.some((leg) => leg.lower))) {
            notes.push("A Piloting Skill Roll each time it runs (a leg actuator hit); a fall takes no damage, and standing again needs a roll.");
        }
        if (legs.some((leg) => leg.destroyed || leg.upper || leg.lower)) notes.push("No kick attacks: a leg actuator is damaged.");
        const run = canRun && walk > 0 ? Math.ceil(walk * 1.5) : 0;
        const jetsLost = this._hitNames("torso").filter((name) => name === JUMP_JET_SLOT).length
            + legs.reduce((sum, leg) => sum + (leg.destroyed ? this._jetPlacement()[leg.leg] ?? 0 : this._hitNames(leg.leg).filter((name) => name === JUMP_JET_SLOT).length), 0);
        const jump = canJump ? Math.max(0, this._jumpJets - jetsLost) : 0;
        return { walk, run, jump, text: `Walk ${walk}, Run ${run}${this._jumpJets > 0 ? `, Jump ${jump}` : ""}`, notes };
    }

    /**
     * The modifier on every Piloting Skill Roll now. "+1 bonus to all piloting rolls" (-1 on the target number). The
     * document's table: Lower Leg +2, Upper Leg +4, Gyro +4, Leg destroyed +5 (no modifiers for that leg's actuators).
     * The critical hit text gives the Upper Leg +2; the table's +4 is followed (NGCFells's ruling, 2026-11-14). A quad with all four legs takes
     * the BattleMech -2 (TW p.122: lost with a leg). 2019: an optional neurohelmet, a further -1.
     */
    public getPilotingModifier(): IMicroMechModifier {
        const rules = this.getRules();
        const lines: string[] = ["Agility bonus -1"];
        let total = -1;
        if (this.isGyroDestroyed()) {
            if (!rules.gyroHitKeepsAgilityBonus) {
                total += 1;
                lines.push("Gyro destroyed: agility bonus lost +1");
            }
            total += 4;
            lines.push("Gyro destroyed +4");
        }
        const legs = this._legLocations();
        for (const leg of legs) {
            const state = this._legState(leg);
            const name = this.getLocationName(leg);
            if (state.destroyed) {
                total += 5;
                lines.push(`${name} destroyed +5`);
                continue;
            }
            if (state.upper) { total += 4; lines.push(`${name} Upper Leg Actuator Group +4`); }
            if (state.lower) { total += 2; lines.push(`${name} Lower Leg Actuator Group +2`); }
        }
        if (this.isQuad() && legs.every((leg) => !this.isLocationDestroyed(leg))) {
            total -= 2;
            lines.push("Four legs -2 (TW p.122)");
        }
        if (rules.neurohelmet && this.hasNeurohelmet()) {
            total -= 1;
            lines.push("Neurohelmet -1");
        }
        return { total, lines };
    }

    /** Each weapon in play: lost with its slot or location; arm actuator and sensor modifiers; energy weapons after an engine hit. */
    public getWeaponPlayLines(): IMicroMechWeaponPlayLine[] {
        const lots = this.getAmmoLots();
        const sensors = this.hasSensorDamage();
        const destroyed = this.isDestroyed();
        return this.getMounts().flatMap((mount, mountIndex) => {
            if (!isMicroMechWeapon(mount.item)) return [];
            const reasons: string[] = [];
            const slotHit = this._playSlotEntries(mount.location).some((entry, index) => entry?.kind === "mount" && entry.mountIndex === mountIndex && this.isSlotHit(mount.location, index));
            const lost = slotHit || this.isLocationDestroyed(mount.location);
            if (lost) reasons.push(slotHit ? "destroyed" : `the ${this.getLocationName(mount.location)} is gone`);
            let toHit = 0;
            if (sensors) toHit += 4;
            if (mount.location === "la" || mount.location === "ra") {
                const hits = this._hitNames(mount.location);
                if (hits.includes(MICRO_MECH_UPPER_ARM)) toHit += 4;
                else if (hits.includes(MICRO_MECH_LOWER_ARM)) toHit += 2;
            }
            if (mount.item.kind === "energy" && !this.canFireEnergyWeapons()) reasons.push("engine hit: no energy weapons");
            if (mount.item.ammo) {
                const shots = lots.reduce((sum, lot, index) => sum + (lot.mountIndex === mountIndex ? this.getShotsLeft(index) : 0), 0);
                if (shots <= 0) reasons.push("no ammunition");
            }
            if (destroyed) reasons.push("the unit is destroyed");
            return [{ mountIndex, name: mount.item.name, location: mount.location, toHit, destroyed: lost, canFire: reasons.length === 0, reasons }];
        });
    }

    /** The play rules the sheet does not track, in our own words, for the play panel. */
    public getPlayNotes(): string[] {
        const rules = this.getRules();
        const notes = [
            "Stacking, line of sight (one level tall), unit displacement, fire and different-elevation physical attacks: as a vehicle. No partial cover.",
            "No heat scale. A shutdown Micro-Mech cannot be the target of an aimed shot; a targeting computer gives its -1 but no aimed shots.",
            "Hit locations: the BattleMech table, with the three torso locations as the one torso. A Micro-Mech kicking a Micro-Mech uses the kick table.",
            "No damage from a fall in its own hex. It stands for 1 MP without a roll while its leg actuators and gyro are whole.",
            "Physical attacks: a kick or stomp (base 3, 1 damage, all leg actuators whole, front hex) and a charge (1 damage a hex moved, 1 to itself; may charge a vehicle). No punch, club, push or death from above.",
            "It cannot be the target of leg or swarm attacks. -3 on rolls to enter, move in or leave a building.",
            "Dumping ammunition dumps all of it. The pilot cannot eject: climbing out takes 2 turns, 4 if prone or the torso structure is gone.",
            `Swamp: ${rules.swamp} ICE in water: ${rules.iceInWater}`,
            `Vacuum: only a sealed ${rules.vacuumEngines.join(" or ")} Micro-Mech. No extra MP in low gravity.`,
        ];
        return notes;
    }

    // Rules level, issues, notes -----------------------------------------------------------------------------------

    /** Every Micro-Mech is Custom Homebrew. */
    public getRequiredRulesLevel(): number { return CUSTOM_HOMEBREW_RULES_LEVEL; }

    public getIssues(): string[] {
        const rules = this.getRules();
        const issues: string[] = [];
        if (!rules.layouts.includes(this._layout)) issues.push(`The ${rules.name} allows no ${this._layout === "quad" ? "quad" : this._layout} Micro-Mechs.`);
        if (!rules.engineKinds.includes(this._engineKind)) issues.push(`The ${rules.name} allows no ${this._engineKind} engine.`);
        const over = this.getWeight() - this.getMaxWeight();
        if (over > 0) issues.push(`The design weighs ${formatKg(this.getWeight())}, ${formatKg(over)} over the ${this._tons}-ton limit.`);
        if (this._jumpJets > this._walkMP) issues.push(`${this._jumpJets} jump jets exceed Walking MP ${this._walkMP}.`);
        for (const location of this.getLocations()) {
            if (location === "torsoRear") continue;
            const max = this.getMaxArmor(location);
            if (location !== "torso" && this._armor[location] > max) {
                issues.push(`${this.getLocationName(location)} armor ${this._armor[location]} is over its maximum of ${max}.`);
            }
        }
        const torso = this._armor.torso + this._armor.torsoRear;
        if (torso > this.getMaxArmor("torso")) issues.push(`Torso front and rear armor together (${torso}) exceed twice the torso structure (${this.getMaxArmor("torso")}).`);
        if (this.getArmorPoints() % 2 === 1) issues.push(`An odd number of armor points (${this.getArmorPoints()}) does not come to a whole kilogram (62.5 kg a point).`);
        for (const location of this.getLocations()) {
            if (location === "torsoRear" || this._fits(location)) continue;
            issues.push(`${this.getLocationName(location)} holds ${this._usedSlots(location).length} slots of items in ${MICRO_MECH_SLOTS[location].slots} slots.`);
        }
        const weapons = this.getWeaponCount();
        if (weapons > MICRO_MECH_MAX_WEAPONS) issues.push(`${weapons} weapons are mounted; a Micro-Mech mounts at most ${MICRO_MECH_MAX_WEAPONS}.`);
        for (const mount of this.getMounts()) {
            const at = `${mount.item.name} (${this.getLocationName(mount.location)})`;
            if (!this._allowsItemAt(mount.item, mount.location)) issues.push(`${mount.item.name} is in the ${this.getLocationName(mount.location)}; ${rules.name} allows no weapon in the head or legs.`);
            if (mount.item.ammo && mount.ammo.length === 0) issues.push(`${at} carries no ammunition: at least 250 kg is needed.`);
            for (const lot of mount.ammo) {
                if (!this._allowsAmmoAt(lot.location)) issues.push(`${mount.item.name} ammunition is in the ${this.getLocationName(lot.location)}; ${rules.name} allows ammunition only in the torso.`);
            }
        }
        if (this._extraHeatSinks > this.getMaxExtraHeatSinks()) issues.push(`${this._extraHeatSinks} extra heat sinks exceed the ${this.getMaxExtraHeatSinks()} the engine may carry.`);
        const heat = this.getEnergyHeat();
        if (heat > this.getHeatSinks()) issues.push(`The energy weapons make ${heat} heat; the heat sinks dissipate ${this.getHeatSinks()}.`);
        if (this._jumpJets > this.getJumpJetSlotsFree()) issues.push(`The jump jets need ${this._jumpJets} slots in the torso and legs; ${this.getJumpJetSlotsFree()} are free.`);
        return issues;
    }
    public isLegal(): boolean { return this.getIssues().length === 0; }

    public getNotes(): string[] {
        const rules = this.getRules();
        const notes: string[] = [MICRO_MECH_CREDIT, `Built under ${rules.name}.`];
        if (rules.borrowsTablesFrom) notes.push(MICRO_MECH_BORROWED_NOTE);
        if (this.getArmorPoints() % 4 !== 0) {
            notes.push("The text buys armor by the quarter ton (4 points); the document's own samples use 2-point (125 kg) steps, as this design does.");
        }
        notes.push("The Battle Value is provisional: the document's own under a Battle Value 1 rules edition, and NGCFells's own under Battle Value 2.");
        if (this._engineKind === "ice") {
            notes.push("An ICE engine has no free heat sinks and needs power amplifiers for energy weapons.");
            notes.push(`Only a ${rules.vacuumEngines.join(" or ")} Micro-Mech may be sealed for vacuum.`);
        }
        if (this.getMounts().some((mount) => mount.ammo.length > 0)) {
            notes.push(rules.ammoSlots === "weapon-class"
                ? "One slot holds up to 1,000 kg of ammunition for one weapon, of any type: the document's LB-5X example, followed where its LB-2X example says each type takes its own slot."
                : "Each ammunition type takes its own slot, up to 1,000 kg.");
        }
        return notes;
    }

    // Alpha Strike ------------------------------------------------------------------------------------------------
    // Our ruleset (approved by NGCFells 2026-11-14): docs/superpowers/specs/2026-11-14-micro-mech-alpha-strike.md. NOT OFFICIAL.

    /** Shots carried for a mount, all its lots together. */
    private _mountShots(mountIndex: number): number {
        return this.getAmmoLots().filter((lot) => lot.mountIndex === mountIndex).reduce((sum, lot) => sum + lot.shots, 0);
    }

    public getAlphaStrikeStats(): IMicroMechAlphaStrikeStats {
        const log: string[] = [];
        const specials: string[] = [MICRO_MECH_AS_ABILITY];
        const add = (code: string): void => { if (code && !specials.includes(code)) specials.push(code); };

        // Move: 2 inches a Walking MP; the jump code, or both rates when they differ (ASC pp.92-93).
        const ground = this._walkMP * 2;
        const jump = this.getJumpMP() * 2;
        const move = jump <= 0 ? `${ground}"` : jump === ground ? `${ground}"j` : `${ground}"/${jump}"j`;
        const tmm = groundTMM(ground);
        const jumpDifference = jump > 0 ? groundTMM(jump) - tmm : 0;
        if (jumpDifference > 0) add(`JMPS${jumpDifference}`);
        if (jumpDifference < 0) add(`JMPW${-jumpDifference}`);
        log.push(`Move: ${this._walkMP} Walking MP x 2 = ${move}; Target Movement Modifier +${tmm}`);

        // Armor: armor points / 30, rounded (ASC p.95). Structure is always 1 (the document; ASC p.97 agrees).
        const armorPoints = this.getArmorPoints();
        const armor = Math.round(armorPoints / 30 + 1e-9);
        const structure = 1;
        log.push(`Armor: ${armorPoints} / 30 = ${(armorPoints / 30).toFixed(2)}, rounded to ${armor}. Structure: ${structure} (always)`);

        // Damage: every weapon fires forward; no heat step and no Overheat (ASC pp.99-101, 115).
        const mounts = this.getMounts();
        const artemis = this._artemisMounts();
        const total = [0, 0, 0];
        const sums = { lrm: [0, 0, 0], srm: [0, 0, 0], ac: [0, 0, 0], flak: [0, 0, 0], indirect: [0, 0, 0] };
        const heat = [0, 0, 0];
        let explosive = false;
        mounts.forEach((mount, index) => {
            const value = getMicroMechItemAlphaStrike(mount.item, artemis.has(index));
            value.abilities.forEach(add);
            if (!isMicroMechWeapon(mount.item)) return;
            if (mount.item.ammo || mount.item.oneShot) explosive = true;
            const shots = mount.item.ammo ? this._mountShots(index) : -1;
            // No ammunition: the weapon cannot fire. Few shots: x 0.75 (ASC p.101).
            const factor = shots === 0 ? 0 : shots > 0 && shots < value.fewShots ? 0.75 : 1;
            const damage = value.damage.map((each) => each * factor);
            damage.forEach((each, range) => {
                total[range] += each;
                heat[range] += factor > 0 ? value.heat[range] : 0;
                (Object.keys(sums) as (keyof typeof sums)[]).forEach((key) => { if (value[key]) sums[key][range] += each; });
            });
            const how = value.source === "catalog" ? "" : value.source === "cluster" ? " (NGCFells's: the Cluster Hits Table for this tube count)" : value.source === "ours" ? " (NGCFells's: damage / 10 by range)" : " (no value)";
            log.push(`${mount.item.name}${artemis.has(index) ? " with Artemis IV" : ""}: ${damage.map((each) => each.toFixed(3)).join(" / ")}${how}${shots === 0 ? ", no ammunition" : factor < 1 ? `, ${shots} shots: x 0.75` : ""}`);
        });
        const value = (damage: number): IMicroMechASDamageValue =>
            damage <= 1e-9 ? { damage: 0, minimal: false } : damage < 0.5 - 1e-9 ? { damage: 0, minimal: true } : { damage: Math.ceil(damage - 1e-9), minimal: false };
        const rated = (damage: number): IMicroMechASDamageValue =>
            damage <= 1e-9 ? { damage: 0, minimal: false } : damage < 0.5 - 1e-9 ? { damage: 0, minimal: true } : { damage: Math.round(damage + 1e-9), minimal: false };
        const damageValues = { short: value(total[0]), medium: value(total[1]), long: value(total[2]) };
        log.push(`Damage: ${total.map((each) => each.toFixed(3)).join(" / ")}, giving ${formatMicroMechASDamage(damageValues.short)}/${formatMicroMechASDamage(damageValues.medium)}/${formatMicroMechASDamage(damageValues.long)}. No Overheat`);

        // Special abilities (ASC pp.117-133), and MCR, which is NGCFells's.
        const triple = (values: number[], ranges: number): string => values.slice(0, ranges).map((each) => formatMicroMechASDamage(rated(each))).join("/");
        if (sums.lrm[1] >= 1 - 1e-9) add(`LRM${triple(sums.lrm, 3)}`);
        if (sums.srm[1] >= 1 - 1e-9) add(`SRM${triple(sums.srm, 2)}`);
        if (sums.ac[1] >= 1 - 1e-9) add(`AC${triple(sums.ac, 3)}`);
        if (sums.flak.some((each) => each > 1e-9)) add(`FLK${triple(sums.flak, 3)}`);
        if (sums.indirect[2] > 1e-9) add(`IF${formatMicroMechASDamage(rated(sums.indirect[2]))}`);
        const heatRatings = heat.map((points) => (points >= 11 ? 2 : points >= 5 ? 1 : 0));
        if (heatRatings.some((rating) => rating > 0)) add(`HT${heatRatings.map((rating) => rating || "-").join("/")}`);
        if (["PRB", "LPRB", "BH"].some((code) => specials.includes(code))) add("RCN");
        if (this._sealed) add("SEAL");
        if (!explosive) add("ENE");
        else {
            // CASE in the torso keeps an explosion from the cockpit; else each ammunition location needs its own.
            const lots = this.getAmmoLots();
            const guarded = (location: MicroMechLocation): boolean => this._hasCase(location) || this._hasCaseII(location);
            const all = (test: (location: MicroMechLocation) => boolean): boolean => lots.length > 0 && lots.every((lot) => test(lot.location));
            const index = specials.indexOf("CASE");
            if (index >= 0) specials.splice(index, 1);
            const indexII = specials.indexOf("CASEII");
            if (indexII >= 0) specials.splice(indexII, 1);
            if (all((location) => this._hasCaseII(location))) add("CASEII");
            else if (lots.length > 0 && (guarded("torso") || all(guarded))) add("CASE");
        }
        if (!explosive) for (const code of ["CASE", "CASEII"]) { const index = specials.indexOf(code); if (index >= 0) specials.splice(index, 1); }
        specials.sort();

        // Point Value: the ground procedure with the BattleMech lines (ASC pp.138-141, errata v1.6).
        const pv = calculateGroundPointValue({
            type: MICRO_MECH_AS_TYPE, size: 1, moves: [{ inches: ground, mode: "" }], jump,
            short: damageValues.short, medium: damageValues.medium, long: damageValues.long,
            overheat: 0, armor, structure, specials,
        });
        log.push(...pv.log);

        return { type: MICRO_MECH_AS_TYPE, size: 1, move, tmm, armor, structure, damageValues, specialAbilities: specials, pointValue: pv.pointValue, calcLog: log };
    }

    /** The converted Alpha Strike card, built the same way as a Master Unit List record; a custom source, so NOT OFFICIAL. */
    public getAlphaStrikeUnit(): AlphaStrikeUnit {
        const stats = this.getAlphaStrikeStats();
        const damage = stats.damageValues;
        const record = {
            Id: 0,
            Name: this.getDisplayName(),
            Class: "Micro-Mech",
            Variant: "",
            Tonnage: this._tons,
            Cost: this.getCBillCost(),
            BattleValue: this.getBattleValue(),
            BFType: stats.type,
            BFSize: stats.size,
            BFMove: stats.move,
            BFTMM: stats.tmm,
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
            MulSource: "custom",
            Role: { Id: 0, Name: "None", Image: null, SortOrder: 0 },
            Technology: { Id: 0, Name: "Inner Sphere", Image: null, SortOrder: 0 },
            Type: { Id: 0, Name: "Micro-Mech", Image: null, SortOrder: 0 },
        } as unknown as IASMULUnit;
        const unit = new AlphaStrikeUnit();
        unit.importMUL(record);
        unit.rulesLevel = this.getRequiredRulesLevel();
        unit.rulesets = this.gameSettings.getRulesets();
        return unit;
    }

    // Save -------------------------------------------------------------------------------------------------------

    /** The save. `noInPlayVariables` leaves the in-play state out (a design save). */
    public export(noInPlayVariables: boolean = false): IMicroMechExport {
        const armor: Partial<Record<MicroMechLocation, number>> = {};
        for (const location of this.getLocations()) armor[location] = this._armor[location];
        return {
            format: 1,
            version: this._version,
            ...(this._rulesEdition !== DEFAULT_RULES_EDITION ? { rulesEdition: this._rulesEdition } : {}),
            ...this.gameSettings.export(),
            uuid: this._uuid,
            tro: this.tro.export(),
            name: this._name,
            tons: this._tons,
            layout: this._layout,
            walkMP: this._walkMP,
            engineKind: this._engineKind,
            jumpJets: this._jumpJets,
            ...(this._sealed ? { sealed: true } : {}),
            ...(!this.isQuad() && !(this._lowerArms.left && this._lowerArms.right) ? { lowerArms: { ...this._lowerArms } } : {}),
            armor,
            mounts: this._mounts.map((mount) => ({ tag: mount.tag, location: mount.location, ...(mount.ammo.length ? { ammo: mount.ammo.map((lot) => ({ ...lot })) } : {}) })),
            ...(this._extraHeatSinks > 0 ? { extraHeatSinks: this._extraHeatSinks } : {}),
            era: this._era.tag,
            ...(this._gunnery !== 4 ? { gunnery: this._gunnery } : {}),
            ...(this._piloting !== 5 ? { piloting: this._piloting } : {}),
            ...(!noInPlayVariables && this.hasInPlayState() ? { inPlay: this.getInPlay() } : {}),
            lastUpdated: this.lastUpdated.toISOString(),
        };
    }
    public exportJSON(): string { return JSON.stringify(this.export()); }

    /** Reads a save. Each value out of range is clamped with an issue (getImportIssues); nothing is dropped silently. */
    public import(data: IMicroMechExport): boolean {
        if (!data || typeof data !== "object" || typeof data.tons !== "number") return false;
        const issues: string[] = [];
        this._uuid = typeof data.uuid === "string" && data.uuid ? data.uuid.slice(0, 64) : generateUUID();
        this.tro.import(data.tro);
        this.setName(typeof data.name === "string" ? data.name : "");
        if (data.version === undefined) this._version = MICRO_MECH_DEFAULT_VERSION;
        else if (isMicroMechVersion(data.version)) this._version = data.version;
        else {
            this._version = MICRO_MECH_DEFAULT_VERSION;
            issues.push(`Unknown rules version "${String(data.version).slice(0, 40)}": read as 6.1.0.2.`);
        }
        this._rulesEdition = getSelectableRulesEditionTag(data.rulesEdition, "mech");
        this.gameSettings.import(data);
        // A saved layout is kept even where the version does not allow it: the issue list says so.
        if (LAYOUTS.includes(data.layout)) this._layout = data.layout;
        else {
            this._layout = "biped";
            issues.push(`Unknown layout "${String(data.layout).slice(0, 40)}": read as biped.`);
        }
        const tons = clampInt(data.tons, MICRO_MECH_MIN_TONS, MICRO_MECH_MAX_TONS, MICRO_MECH_MIN_TONS);
        if (tons !== data.tons) issues.push(`Tonnage ${data.tons} is out of range: set to ${tons}.`);
        this._tons = tons;
        const walk = clampInt(data.walkMP, 1, this.getMaxWalkMP(), 1);
        if (walk !== data.walkMP) issues.push(`Walking MP ${String(data.walkMP)} is out of range: set to ${walk}.`);
        this._walkMP = walk;
        if (ENGINE_KINDS.includes(data.engineKind)) this._engineKind = data.engineKind;
        else {
            this._engineKind = "fusion";
            if (data.engineKind !== undefined) issues.push(`Unknown engine "${String(data.engineKind).slice(0, 40)}": read as fusion.`);
        }
        const jets = clampInt(data.jumpJets, 0, this._walkMP, 0);
        if (jets !== (data.jumpJets ?? 0)) issues.push(`Jump jets ${String(data.jumpJets)} are out of range: set to ${jets}.`);
        this._jumpJets = jets;
        this._sealed = data.sealed === true;
        this._lowerArms = {
            left: data.lowerArms?.left !== false,
            right: data.lowerArms?.right !== false,
        };
        this._armor = { head: 0, torso: 0, torsoRear: 0, la: 0, ra: 0, ll: 0, rl: 0, fll: 0, frl: 0 };
        for (const location of this.getLocations()) {
            const saved = data.armor?.[location];
            if (saved === undefined) continue;
            const points = clampInt(saved, 0, this.getMaxArmor(location), 0);
            if (points !== saved) issues.push(`${this.getLocationName(location)} armor ${String(saved)} is out of range: set to ${points}.`);
            this._armor[location] = points;
        }
        this._importMounts(data, issues);
        this._gunnery = clampInt(data.gunnery ?? 4, 0, 8, 4);
        this._piloting = clampInt(data.piloting ?? 5, 0, 8, 5);
        this._importInPlay(data.inPlay);
        this._era = this.getAvailableEras().find((era) => era.tag === data.era) ?? this._era;
        const saved = typeof data.lastUpdated === "string" ? new Date(data.lastUpdated) : new Date();
        this.lastUpdated = Number.isNaN(saved.getTime()) ? new Date() : saved;
        this._importIssues = issues;
        return true;
    }

    /** Mounts and heat sinks from a save. Rules issues (a fifth weapon, a version's location) stay for getIssues. */
    private _importMounts(data: IMicroMechExport, issues: string[]): void {
        this._mounts = [];
        const saved = Array.isArray(data.mounts) ? data.mounts : [];
        const layoutName = this._layout === "quad" ? "a quad" : "a biped";
        for (const raw of saved) {
            const tag = typeof raw?.tag === "string" ? raw.tag : "";
            const item = findMicroMechItem(tag);
            if (!item) {
                issues.push(`Unknown item "${tag.slice(0, 40)}": dropped.`);
                continue;
            }
            if (!this.getLocations().includes(raw.location) || raw.location === "torsoRear") {
                const name = ALL_LOCATIONS.includes(raw.location) ? MICRO_MECH_LOCATION_NAMES[this._layout][raw.location] : `"${String(raw.location).slice(0, 40)}"`;
                issues.push(`${item.name}: no ${name} on ${layoutName}: dropped.`);
                continue;
            }
            const ammo: IMicroMechAmmoExport[] = [];
            for (const lot of Array.isArray(raw.ammo) ? raw.ammo : []) {
                if (!item.ammo?.some((each) => each.type === lot?.type) || ammo.some((each) => each.type === lot.type)) {
                    issues.push(`${item.name} has no ${String(lot?.type).slice(0, 20)} ammunition: dropped.`);
                    continue;
                }
                if (!this.getLocations().includes(lot.location) || lot.location === "torsoRear") {
                    issues.push(`${item.name} ammunition: no such location on ${layoutName}: dropped.`);
                    continue;
                }
                const kg = clampInt(Math.round(Number(lot.kg) / MICRO_MECH_QUARTER_TON_KG) * MICRO_MECH_QUARTER_TON_KG, MICRO_MECH_QUARTER_TON_KG, 20000, MICRO_MECH_QUARTER_TON_KG);
                if (kg !== lot.kg) issues.push(`${item.name} ammunition ${String(lot.kg)} kg is not a 250 kg lot: set to ${kg} kg.`);
                ammo.push({ type: lot.type, kg, location: lot.location });
            }
            this._mounts.push({ tag, location: raw.location, ammo });
        }
        const extra = clampInt(data.extraHeatSinks ?? 0, 0, MAX_EXTRA_HEAT_SINKS_UNLIMITED, 0);
        if (extra !== (data.extraHeatSinks ?? 0)) issues.push(`Extra heat sinks ${String(data.extraHeatSinks)} are out of range: set to ${extra}.`);
        this._extraHeatSinks = extra;
    }

    /** Reads the in-play state, dropping or clamping anything that does not fit this design (no issue: it is play state). */
    private _importInPlay(raw: unknown): void {
        this._inPlay = {};
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
        const data = raw as Record<string, unknown>;
        const record = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {});
        const armor = record(data.armor);
        const structure = record(data.structure);
        const slots = record(data.slots);
        for (const location of this.getLocations()) {
            if (armor[location] !== undefined) this.setArmorDamage(location, Number(armor[location]));
            if (structure[location] !== undefined) this.setStructureDamage(location, Number(structure[location]));
            const list = Array.isArray(slots[location]) ? slots[location] as unknown[] : [];
            const entries = this._playSlotEntries(location);
            for (const slot of list) if (typeof slot === "number" && Number.isInteger(slot) && entries[slot]) this._markSlot(location, slot, true);
        }
        if (data.cockpit !== undefined) this.setCockpitDamage(Number(data.cockpit));
        if (data.pilotHits !== undefined) this.setPilotHits(Number(data.pilotHits));
        if (Array.isArray(data.shotsFired)) data.shotsFired.forEach((shots, index) => this.setShotsFired(index, Number(shots)));
        if (data.neurohelmet === true) this._inPlay.neurohelmet = true;
    }

    public importJSON(json: string): boolean {
        try {
            return this.import(JSON.parse(json));
        } catch {
            this._importIssues = ["The saved Micro-Mech could not be read."];
            return false;
        }
    }
}
