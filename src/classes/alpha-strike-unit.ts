import { CONST_AS_PILOT_ABILITIES, getPilotAbilityForEdition, IASPilotAbility } from "../data/alpha-strike-pilot-abilities";
import { CONST_AS_SPECIAL_ABILITIES, IASSpecialAbility } from "../data/alpha-strike-special-abilities";
import { IASEWarPlayState } from "../utils/alpha-strike-ewar-play";
import { APOCRYPHAL_RULES_LEVEL } from "../data/rules-level-options";
import { DEFAULT_ALPHA_STRIKE_EDITION, getAlphaStrikeEdition } from "../data/rules-editions";
import { calculateGroundPointValue, splitSpecialAbilities } from "../utils/alphaStrikeGroundPointValue";
import { IAlphaStrikeExport } from "../utils/calculateAlphaStrikeValue";
import { generateUUID } from "../utils/generateUUID";
import type { UnitStanding } from "../utils/unit-standing";
import { getAlphaStrikeQuirksInYear, getAlphaStrikeQuirkToHit, IAlphaStrikeQuirk } from "../utils/quirk-effects";
import Pilot, { IPilot } from "./pilot";

export interface IAlphaStrikeDamage {
    short: number;
    medium: number;
    long: number;
    extreme: number;
    shortMinimal?: boolean;
    mediumMinimal?: boolean;
    longMinimal?: boolean;
    extremeMinimal?: boolean;
}

export interface IMoveNumber {
    move: number;
    currentMove: number;
    type: string;
};

/** A large craft's firing arcs: DropShips and Small Craft call front and rear "Nose" and "Aft". */
export type ASArcName = "front" | "rear" | "left" | "right";
export const AS_ARC_NAMES: ASArcName[] = ["front", "rear", "left", "right"];
/** An arc's attack classes (standard, capital, sub-capital, capital missile), S/M/L/E as printed ("4", "0*", ""). */
export type ASArcAttackClass = "std" | "cap" | "scap" | "msl";
export const AS_ARC_ATTACK_CLASSES: ASArcAttackClass[] = ["std", "cap", "scap", "msl"];
export type IASArcDamage = Partial<Record<ASArcAttackClass, string[]>> & { spe?: string };
export type IASArcs = Partial<Record<ASArcName, IASArcDamage>>;

const ARC_VALUE = /^[0-9]{0,4}\*?$|^-$/;
const ARC_ABILITIES = /^[A-Za-z0-9 ,/*().+-]{1,160}$/;

/** The arcs in saved or MUL data, keeping only well-formed values; null when there are none. */
export function sanitizeASArcs(raw: unknown): IASArcs | null {
    if (!raw || typeof raw !== "object") return null;
    const arcs: IASArcs = {};
    for (const arcName of AS_ARC_NAMES) {
        const arc = (raw as Record<string, unknown>)[arcName];
        if (!arc || typeof arc !== "object") continue;
        const kept: IASArcDamage = {};
        for (const attackClass of AS_ARC_ATTACK_CLASSES) {
            const values = (arc as Record<string, unknown>)[attackClass];
            if (Array.isArray(values) && values.length === 4 && values.every((value) => typeof value === "string" && ARC_VALUE.test(value))) {
                kept[attackClass] = [...values];
            }
        }
        const spe = (arc as Record<string, unknown>).spe;
        if (typeof spe === "string" && ARC_ABILITIES.test(spe)) kept.spe = spe;
        if (Object.keys(kept).length > 0) arcs[arcName] = kept;
    }
    return Object.keys(arcs).length > 0 ? arcs : null;
}

export interface ASMULType {
    Id: number;
    Image: string | null;
    Name: string;
    SortOrder: number;
}
export interface ASMULRole {
    Id: number;
    Image: string | null;
    Name: string;
    SortOrder: number;
}
export interface ASMULTech {
    Id: number;
    Image: string | null;
    Name: string;
    SortOrder: number;
}
export interface IASMULUnit {
    // mechCreatorUUID: string;
    FormatedTonnage: string | null; // typo in MUL
    GroupName: string | null;
    BFAbilities: string | null;
    BFArmor: number;
    BFDamageExtreme: number;
    BFDamageLong: number;
    BFDamageMedium: number;
    BFDamageShort: number;
    BFMove: string;
    BFOverheat: number;
    BFPointValue: number;
    BFSize: number;
    BFStructure: number;
    BFTMM: number;
    BFThreshold: number;
    BFType: string | null;
    /** Large craft only: damage by firing arc, read off the MUL card back. */
    BFArcs?: IASArcs;
    BattleValue: number;
    Class: string;

    Cost: number;
    DateIntroduced: string;
    EraIcon:string;
    EraId: number;
    EraStart: number;
    Id: number;
    ImageUrl: string;
    IsFeatured: boolean;
    IsPublished: boolean;
    Name: string;
    RS: string;
    RSId: number;
    Release: number;
    Role: ASMULRole;
    Rules: string;
    Skill: number;
    TRO: string;
    TROId: number;
    Technology: ASMULTech;
    Tonnage: number;
    Type: ASMULType;
    Variant: string | null;

    // Opaque public_uid from masterunitlist.battletech.com — the only stable join key the live site exposes.
    MulUnitKey?: string;

    // Per-era faction availability from the live site (the loader maps FactionIds to the getMULFactionLabels() ids).
    Availability?: { EraId: number; FactionIds: number[] }[];

    BFDamageShortMin?: boolean;
    BFDamageMediumMin?: boolean;
    BFDamageLongMin?: boolean;
    BFDamageExtremeMin?: boolean;

    // Which bundled list served this record; set by the MUL chunk loader, not stored in the data files.
    MulSource?: MULSource;

    // Present only on non-canonical custom entries (shared list or this browser's local entries).
    CustomInfo?: ICustomMULInfo;
}

// MUL 2.0 and custom records keep the model in Variant ("Black Knight" + "BL-7-KNT"); MUL 1.0 records
// already carry the full designation in Name.
export function getMULDisplayName(unit: Pick<IASMULUnit, "Name" | "Variant" | "MulUnitKey">): string {
    const name = (unit.Name ?? "").trim();
    const variant = (unit.Variant ?? "").trim();
    if (!unit.MulUnitKey || !variant || name.toLowerCase().endsWith(variant.toLowerCase())) {
        return name;
    }
    return `${name} ${variant}`;
}

// mul2: masterunitlist.battletech.com (current). mul1: legacy numeric-id MUL records the live site no longer lists.
// custom: non-canonical units, from the shared curated list or saved locally in this browser.
// mordel: a mordel.net unit, pulled with the user's own API key.
export type MULSource = MULListSource | "mordel";
/** The sources the shipped MUL lists come from (mordel.net units have their own list). */
export type MULListSource = "mul2" | "mul1" | "custom";

export interface ICustomMULInfo {
    author: string;
    source: string;
    notes: string;
    /** Custom unless set: a custom entry may be apocryphal (licensed, not canon) or munchkin. */
    standing?: UnitStanding;
    createdAt: string;
    updatedAt: string;
    // Only on entries saved in this browser; the shared list never stores these.
    local?: boolean;
    pullRequestUrl?: string;
}

export interface IAlphaStrikeUnitExport {
    mechCreatorUUID: string;
    /** E-War play state (ECM mode, Narc beacons, jams...); left out when empty or in a fresh export. */
    ewarPlay?: IASEWarPlayState;
    /** The Alpha Strike Alternate Munition the selected special ammunition plays as (alpha-strike-munitions.ts, #647). */
    munition?: string;
    /** Rules level id (rules-level-options): from the MUL "Rules" field or the unit's creator. */
    rulesLevel?: number;
    /** Special Rulesets (#324) a hand-built card is made under; left out when none. */
    rulesets?: string[];
    /** The design's Alpha Strike Companion quirks; none for a MUL unit or an older save. */
    quirks?: IAlphaStrikeQuirk[];
    /** The start of the design's era: the year its quirks are checked against when the game sets none. */
    quirkEraStart?: number;


    customName?: string;

    currentArmor?: boolean[];
    currentStructure?: boolean[];
    engineHits?: boolean[];
    fireControlHits?: boolean[];
    mpControlHits?: boolean[];
    weaponHits?: boolean[];
    vehicleMotive910?: boolean[];
    vehicleMotive11?: boolean[];
    vehicleMotive12?: boolean;

    roundArmor?: boolean[];
    roundStructure?: boolean[];
    roundEngineHits?: boolean[];
    roundFireControlHits?: boolean[];
    roundMpControlHits?: boolean[];
    roundWeaponHits?: boolean[];
    roundVehicleMotive910?: boolean[];
    roundVehicleMotive11?: boolean[];
    roundVehicleMotive12?: boolean;
    roundHeat?: number;

    tmm: number;
    // Additional Fields we use internally
    classification: string;
    class: string;
    costCR: number;
    mulID: number;
    /** The unit list the stats came from: mul2, mul1 or custom; empty for the creators and older saves. */
    mulSource?: string;
    currentHeat: number;
    damage: IAlphaStrikeDamage;
    variant: string;
    dateIntroduced: string;
    name: string;
    tonnage: number;
    tro: string;
    role: string;
    threshold: number;
    pilot: IPilot;
    imageURL: string;
    arcs?: IASArcs | null;

    move: IMoveNumber[];
    jumpMove: number;
    structure: number;
    armor: number;
    type: string;
    size: number;
    showDetails: boolean;
    abilities: string | string[];
    overheat: number;
    basePoints: number;
    currentSkill: number;

    uuid: string;
}

export class AlphaStrikeUnit {

    public uuid: string = generateUUID();
    public originalStats: IASMULUnit | null = null;

    public mechCreatorUUID: string = "";

    /** In-play E-War state (#642 Phase 5): ECM mode, stood still, Narc beacons, jams, TSEMP and chaff. */
    public ewarPlay: IASEWarPlayState = {};

    /** The ASCE Alternate Munition the unit's selected special ammunition plays as (#647); empty for standard rounds. */
    public munition: string = "";

    public classification: string = "";
    public costCR: number = 0;

    public isAerospace: boolean = false;
    public isInfantry: boolean = false;
    public immobile: boolean = false;

    public class: string = ""
    public variant: string = "";
    public name: string = "";
    public dateIntroduced: string = "";
    public era: string = "";

    public tro: string = "";

    /** Rules level id (rules-level-options); undefined when unknown. */
    public rulesLevel: number | undefined = undefined;
    /** Special Rulesets (#324) the unit creator built the card under. */
    public rulesets: string[] = [];

    /** The Companion quirks of the design this unit was made from (ASC pp.59-67); the MUL has no quirk data. */
    public quirks: IAlphaStrikeQuirk[] = [];
    /** The force's "Use design quirks" switch, set by `AlphaStrikeForce.syncQuirksInPlay`; not saved with the unit. */
    public quirksInPlay: boolean = false;
    /** The Alpha Strike rules edition this unit plays by; the force sets it (#646). Not saved on the unit. */
    public playEdition: string = DEFAULT_ALPHA_STRIKE_EDITION;
    /** The start of the design's era, saved with the unit; quirks are checked against it when the game sets no year. */
    public quirkEraStart: number | undefined = undefined;
    /** The force's "Game year", set by `AlphaStrikeForce.syncQuirksInPlay`; not saved with the unit. */
    public quirkPlayYear: number | null = null;

    public showDetails: boolean = false;

    public active: boolean = true;

    public tonnage: number = 0;

    public type: string = "BM";
    public size: number = 0;
    public tmm: number = 0;

    public imageURL: string = "";

    public currentMove: string = "";
    public currentMoveHexes: string = "";
    public currentMoveSprint: string = "";
    public currentMoveHexesSprint: string = "";
    public currentTMM: string = "";

    public armor: number = 0;
    public structure: number = 1;

    public threshold: number = 0;
    /** Large craft from the MUL: damage by firing arc. */
    public arcs: IASArcs | null = null;

    public currentToHitShort: number = 0;
    public currentToHitMedium: number = 0;
    public currentToHitLong: number = 0;
    public currentToHitExtreme: number = 0;

    public damage: IAlphaStrikeDamage = {
            short: 0,
            medium: 0,
            long: 0,
            extreme: 0,
            shortMinimal: false,
            mediumMinimal: false,
            longMinimal: false,
            extremeMinimal: false,
        };

    public move: IMoveNumber[] = [];
    public jumpMove: number = 0;

    public mulID: number = 0;
    /** The unit list the stats came from (mul2, mul1, custom); empty for the creators and saves from before it was kept. */
    public mulSource: string = "";

    public abilities: string[] = [];

    public overheat: number = 0;
    public role = "";

    public basePoints: number = 0;
    public currentPoints: number = 0;

    public currentDamage: IAlphaStrikeDamage = {
        short: 0,
        medium: 0,
        long: 0,
        extreme: 0,
        shortMinimal: false,
        mediumMinimal: false,
        longMinimal: false,
        extremeMinimal: false,
    };

    public currentAbilities: string[] = [];

    public currentHeat: number = 0;
    public currentArmor: boolean[] = [];
    public currentStructure: boolean[] = [];
    public engineHits: boolean[] = [];
    public fireControlHits: boolean[] = [];
    public mpControlHits: boolean[] = [];
    public weaponHits: boolean[] = [];

    public vehicleMotive910: boolean[] = [];
    public vehicleMotive11: boolean[] = [];
    public vehicleMotive12: boolean = false;

    public roundHeat: number = 0;
    public roundArmor: boolean[] = [];
    public roundStructure: boolean[] = [];
    public roundEngineHits: boolean[] = [];
    public roundFireControlHits: boolean[] = [];
    public roundMpControlHits: boolean[] = [];
    public roundWeaponHits: boolean[] = [];
    public roundVehicleMotive910: boolean[] = [];
    public roundVehicleMotive11: boolean[] = [];
    public roundVehicleMotive12: boolean = false;

    private _pilot: Pilot = new Pilot( {
        name: "",
        piloting: 5,
        gunnery: 4,
        wounds: 0,
        alphaStrikeAbilities: [],
    });

    public customName: string = "";

    constructor( ) {
        this._pilot = new Pilot();
    }

    public setPilotSkill( nv: number ) {
        this._pilot.gunnery = nv;
    }

    /**
     * Whether the card's stats are official: from MUL 2.0. A save from before the list was kept counts when it has a
     * MUL id, as only MUL units had one; the creators' units don't.
     */
    public isOfficial(): boolean {
        return this.mulSource ? this.mulSource === "mul2" : this.mulID > 0;
    }

    public importMUL( incomingMechData: IASMULUnit ) {

        if( typeof(incomingMechData) !== "undefined" && incomingMechData !== null ) {

            this.costCR = +incomingMechData.Cost;
            // MUL 2.0 records use Class for the unit type ("BattleMech") and Name for the chassis;
            // MUL 1.0 records use Class for the chassis.
            this.class = incomingMechData.MulUnitKey
                ? (incomingMechData.Name ?? "").trim()
                : (incomingMechData.Class ? incomingMechData.Class : "");
            this.variant = incomingMechData.Variant ? incomingMechData.Variant : "";
            this.name = getMULDisplayName(incomingMechData);
            this.dateIntroduced = incomingMechData.DateIntroduced;

            // if( incomingMechData.mechCreatorUUID ) {
            //     this.mechCreatorUUID = incomingMechData.mechCreatorUUID;
            // }

            this.tro = incomingMechData.TRO;

            this.rulesLevel = getRulesLevelFromMULRules(incomingMechData.Rules);

            this.mulID = incomingMechData.Id;
            this.mulSource = incomingMechData.MulSource ?? "";

            this.tonnage = +incomingMechData.Tonnage;

            // Only aerospace units have an armor threshold. The MUL sync moves the live site's "TH n" ability here (#48).
            this.threshold = Number(incomingMechData.BFThreshold) || 0;
            this.arcs = sanitizeASArcs(incomingMechData.BFArcs);

            if( incomingMechData.Role && incomingMechData.Role.Name ) {
                this.role = incomingMechData.Role.Name;
            } else {
                this.role = "Not Specified";
            }

            if( incomingMechData.BFType )
                this.type = incomingMechData.BFType;
            this.size = incomingMechData.BFSize;

            this.armor = +incomingMechData.BFArmor;
            this.structure = +incomingMechData.BFStructure;


            this.damage = {
                short: incomingMechData.BFDamageShort,
                medium: incomingMechData.BFDamageMedium,
                long: incomingMechData.BFDamageLong,
                extreme: 0,
            };

            if( incomingMechData.BFDamageExtreme ) {
                this.damage.extreme = incomingMechData.BFDamageExtreme;
            } else {
                this.damage.extreme = 0;
            }

            if( incomingMechData.BFDamageShortMin ) {
                this.damage.shortMinimal = true;
            }
            if( incomingMechData.BFDamageMediumMin ) {
                this.damage.mediumMinimal = true;
            }
            if( incomingMechData.BFDamageLongMin ) {
                this.damage.longMinimal = true;
            }
            if( incomingMechData.BFDamageExtremeMin ) {
                this.damage.extremeMinimal = true;
            }
        

            if( incomingMechData.BFAbilities && incomingMechData.BFAbilities.trim() ) {
                // The role is its own field: an older Master Unit List sync also stored it as an ability.
                const roleName = incomingMechData.Role?.Name?.trim();
                this.abilities = incomingMechData.BFAbilities.split(",").map(ability => ability.trim())
                    .filter(ability => ability !== "" && ability !== roleName);
            }

            this.overheat = +incomingMechData.BFOverheat;

            this.basePoints = +incomingMechData.BFPointValue;



            this.imageURL = incomingMechData.ImageUrl;

            let tmpMove = incomingMechData.BFMove;
            this.move = [];
            let tmpMoveObj: IMoveNumber = {
                move: 0,
                currentMove: 0,
                type: ""
            }
            tmpMove = tmpMove.replace(/"/g, "");
            if( tmpMove.indexOf("/") > 0 ) {
                //split move....
                const moveArray = tmpMove.split( "/" );

                for( let moveCount = 0; moveCount < moveArray.length; moveCount++ ) {
                    tmpMoveObj = {
                        move: 0,
                        currentMove: 0,
                        type: ""
                    };

                    tmpMoveObj.move = this._getRawNumber( moveArray[moveCount] );
                    tmpMoveObj.type = this._getRawAlpha( moveArray[moveCount] );

                    this.move.push( tmpMoveObj );
                }

            } else {

                tmpMoveObj = {
                    move: 0,
                    currentMove: 0,
                    type: ""
                };

                tmpMoveObj.move = this._getRawNumber( tmpMove );
                tmpMoveObj.type = this._getRawAlpha( tmpMove );

                this.move.push( tmpMoveObj );

            }
            
            this.calcCurrentValues();

        }

    }

    public importUnit( incomingMechData: IAlphaStrikeUnitExport ) {
        if( incomingMechData && incomingMechData.uuid )
            this.uuid = incomingMechData.uuid;
        if( typeof(incomingMechData) !== "undefined" && incomingMechData !== null ) {

            // Internally Processed Data

            if( incomingMechData.classification )
                this.classification = incomingMechData.classification;
            if( incomingMechData.class)
                this.class = incomingMechData.class;
            this.costCR = incomingMechData.costCR / 1;

            this.mulID = incomingMechData.mulID / 1;
            this.mulSource = incomingMechData.mulSource ?? "";

            this.imageURL = incomingMechData.imageURL;

            this.currentHeat = incomingMechData.currentHeat;

            this.variant = incomingMechData.variant;
            this.tmm = incomingMechData.tmm;
            this.name = incomingMechData.name;
            this.dateIntroduced = incomingMechData.dateIntroduced;

            this.tro = incomingMechData.tro;

            this.rulesLevel = typeof incomingMechData.rulesLevel === "number" ? incomingMechData.rulesLevel : undefined;
            this.rulesets = Array.isArray(incomingMechData.rulesets) ? incomingMechData.rulesets.filter((id): id is string => typeof id === "string") : [];
            this.quirks = Array.isArray(incomingMechData.quirks)
                ? incomingMechData.quirks.filter((quirk) => quirk && typeof quirk.tag === "string").map((quirk) => ({ ...quirk }))
                : [];
            this.quirkEraStart = typeof incomingMechData.quirkEraStart === "number" ? incomingMechData.quirkEraStart : undefined;

            this.role =  incomingMechData.role;

            this.tonnage = incomingMechData.tonnage / 1;

            this.threshold = incomingMechData.threshold / 1;
            this.arcs = sanitizeASArcs(incomingMechData.arcs);

            this.type = incomingMechData.type;
            this.size = incomingMechData.size / 1;

            this.armor = incomingMechData.armor / 1;
            this.structure = incomingMechData.structure / 1;

            this.move = incomingMechData.move;
            this.jumpMove = +incomingMechData.jumpMove;

            this.damage = {
                short: incomingMechData.damage.short,
                medium: incomingMechData.damage.medium,
                long: incomingMechData.damage.long,
                extreme: incomingMechData.damage.extreme,
                shortMinimal: incomingMechData.damage.shortMinimal ? true : false,
                mediumMinimal: incomingMechData.damage.mediumMinimal ? true : false,
                longMinimal: incomingMechData.damage.longMinimal ? true : false,
                extremeMinimal: incomingMechData.damage.extremeMinimal ? true : false,
            };

            if( !this.damage.extreme )
                this.damage.extreme = 0;

            this.move = incomingMechData.move;

            if( typeof(incomingMechData.abilities) === "string" ) {
                this.abilities = incomingMechData.abilities.split(",").map(ability => ability.trim());
            } else {
                this.abilities = incomingMechData.abilities;
            }


            this.showDetails = incomingMechData.showDetails;

            this.overheat = incomingMechData.overheat / 1;

            this.basePoints = incomingMechData.basePoints / 1;


            if( incomingMechData.pilot)
                this._pilot.import(incomingMechData.pilot);

            if( incomingMechData.currentSkill && incomingMechData.currentSkill > 0  )
                this._pilot.gunnery = incomingMechData.currentSkill;


            this.currentPoints = this.basePoints;
        }

        if( incomingMechData.currentArmor ) {
            this.currentArmor = incomingMechData.currentArmor;
        }

        if( typeof incomingMechData.munition === "string" ) {
            this.munition = incomingMechData.munition;
        }

        if( incomingMechData.ewarPlay && typeof incomingMechData.ewarPlay === "object" ) {
            this.ewarPlay = JSON.parse(JSON.stringify(incomingMechData.ewarPlay)) as IASEWarPlayState;
        }

        if( incomingMechData.currentStructure ) {
            this.currentStructure = incomingMechData.currentStructure;
        }

        if( incomingMechData.engineHits )
        this.engineHits = incomingMechData.engineHits;

        if( incomingMechData.fireControlHits )
            this.fireControlHits = incomingMechData.fireControlHits;

        if( incomingMechData.vehicleMotive910 ) {
            this.vehicleMotive910 = incomingMechData.vehicleMotive910;
        }
        if( incomingMechData.vehicleMotive11 ) {
            this.vehicleMotive11 = incomingMechData.vehicleMotive11;
        }
        if( incomingMechData.vehicleMotive12 ) {
            this.vehicleMotive12 = incomingMechData.vehicleMotive12;
        }

        if( incomingMechData.mpControlHits )
        this.mpControlHits = incomingMechData.mpControlHits;

        if( incomingMechData.weaponHits )
            this.weaponHits = incomingMechData.weaponHits;

        if( incomingMechData.roundArmor ) {
            this.roundArmor = incomingMechData.roundArmor;
        }

        if( incomingMechData.roundStructure ) {
            this.roundStructure = incomingMechData.roundStructure;
        }

        if( incomingMechData.roundEngineHits ) {
            this.roundEngineHits = incomingMechData.roundEngineHits;
        }

        if( incomingMechData.roundFireControlHits ) {
            this.roundFireControlHits = incomingMechData.roundFireControlHits;
        }

        if( incomingMechData.roundMpControlHits ) {
            this.roundMpControlHits = incomingMechData.roundMpControlHits;
        }

        if( incomingMechData.roundWeaponHits ) {
            this.roundWeaponHits = incomingMechData.roundWeaponHits;
        }

        if( incomingMechData.roundVehicleMotive910 ) {
            this.roundVehicleMotive910 = incomingMechData.roundVehicleMotive910;
        }

        if( incomingMechData.roundVehicleMotive11 ) {
            this.roundVehicleMotive11 = incomingMechData.roundVehicleMotive11;
        }

        if( incomingMechData.roundVehicleMotive12 ) {
            this.roundVehicleMotive12 = incomingMechData.roundVehicleMotive12;
        }

        if( incomingMechData.roundHeat ) {
            this.roundHeat = incomingMechData.roundHeat;
        }

            if( incomingMechData.customName )
            this.customName = incomingMechData.customName;


        if( incomingMechData.pilot)
            this._pilot.import(incomingMechData.pilot);


        this.calcCurrentValues();
    }

    public get currentSkill(): number {
        return this._pilot.gunnery;
    }

    public get currentPilotAbilityID(): number {

        if( this._pilot.alphaStrikeAbilities.length > 0 ) {
            return this._pilot.alphaStrikeAbilities[0];
        }
        return 0;
    }

    public get currentPilotAbilityID2(): number {

        if( this._pilot.alphaStrikeAbilities.length > 1 ) {
            return this._pilot.alphaStrikeAbilities[1];
        }
        return 0;
    }

    public get currentPilotAbilityID3(): number {

        if( this._pilot.alphaStrikeAbilities.length > 2 ) {
            return this._pilot.alphaStrikeAbilities[2];
        }
        return 0;
    }

    public get currentPilotAbility(): IASPilotAbility | null {

        if( this._pilot.alphaStrikeAbilities.length > 0 ) {
            for( const abi of CONST_AS_PILOT_ABILITIES ) {
                if( this._pilot.alphaStrikeAbilities[0] === abi.id )
                    return abi;
            }

        }
        return null;
    }

    public get currentPilotVeteranAbility(): IASPilotAbility | null {
        if( this._pilot.alphaStrikeAbilities.length > 1 ) {
            for( const abi of CONST_AS_PILOT_ABILITIES ) {
                if( this._pilot.alphaStrikeAbilities[1] === abi.id )
                    return abi;
            }

        }
        return null;
    }

    public get currentPilotHeroAbility(): IASPilotAbility | null {
        if( this._pilot.alphaStrikeAbilities.length > 2 ) {
            for( const abi of CONST_AS_PILOT_ABILITIES ) {
                if( this._pilot.alphaStrikeAbilities[2] === abi.id )
                    return abi;
            }

        }
        return null;
    }

    public getPilotAbilities(): any[] {
        const rv: any[] = [];



        for( const id of this._pilot.alphaStrikeAbilities ) {
            let found = false;
            for( const card of CONST_AS_PILOT_ABILITIES ) {
                if( id === card.id ) {
                    // A held ability the edition does not offer stays, marked so the card can say so.
                    const forEdition = getPilotAbilityForEdition(card, this.playEdition);
                    rv.push(forEdition.offered
                        ? { ...card, cost: forEdition.cost, source: forEdition.source }
                        : { ...card, notInEdition: true });
                    found = true;
                    break;
                }
            }
            if(!found ) rv.push( null );
        }


        return rv;
    }

    getPilotAbilityList(): string[] {
        const rv: string[] = [];

        for( const id of this._pilot.alphaStrikeAbilities ) {
            for( const card of CONST_AS_PILOT_ABILITIES ) {
                if( id === card.id ) {
                    rv.push(card.ability + " (" + getPilotAbilityForEdition(card, this.playEdition).cost + ")");
                    break;
                }
            }
        }


        return rv;
    }

    public getTotalPilotAbilityPoints(): number {
        let rv = 0;

        for( const id of this._pilot.alphaStrikeAbilities ) {
            for( const card of CONST_AS_PILOT_ABILITIES ) {
                if( id === card.id ) {
                    // Held abilities the edition does not offer keep their points, at the record cost.
                    rv += getPilotAbilityForEdition(card, this.playEdition).cost;
                }
            }
        }


        return rv;
    }

    public set currentPilotAbilityID( nv: number ) {
        this._pilot.alphaStrikeAbilities = [nv];

    }
    public set currentPilotAbilityID2( nv: number ) {
        while( this._pilot.alphaStrikeAbilities.length < 2 )
            this._pilot.alphaStrikeAbilities.push(0);
        this._pilot.alphaStrikeAbilities[1] = nv;

    }

    public set currentPilotAbilityID3( nv: number ) {
        while( this._pilot.alphaStrikeAbilities.length < 3 )
            this._pilot.alphaStrikeAbilities.push(0);
        this._pilot.alphaStrikeAbilities[2] = nv;

    }


    private _getRawNumber( incomingString: string ): number {
        const myString = incomingString.replace(/\D/g,'');
        return +myString / 1;
    }

    private _getRawAlpha( incomingString: string ): string {
        const myString = incomingString.replace(/\d/g,'');
        return myString.toLowerCase().trim();
    }

    public toggleShowingDetails() {

        if( this.showDetails) {
            this.showDetails = false;
        } else {
            this.showDetails = true;
        }

    }

    public setSkill( newSkillValue: number ) {
        this._pilot.gunnery = newSkillValue;
        // this._pilot.piloting = newSkillValue + 1;
        this.calcCurrentValues();
    }

    public isUnderStrength(): boolean {

        if( this.getCurrentArmor() < this.armor ) {
            return true;
        }
        if( this.getCurrentStructure() < this.structure ) {
            return true;
        }

        if( this.getEngineHits() > 0 ) {
            return true;
        }

        if( this.getFireControlHits() > 0 ) {
            return true;
        }

        if( this.getMPHits() > 0 ) {
            return true;
        }

        if( this.getWeaponHits() > 0 ) {
            return true;
        }

        if(
            ( this.type && this.type.trim().toLowerCase() === "sv" )
                ||
            ( this.type && this.type.trim().toLowerCase() === "cv" )
        ) {

            for( let mpHitsCount = 0; mpHitsCount < this.vehicleMotive910.length; mpHitsCount++) {
                if( this.vehicleMotive910[ mpHitsCount ] ) {
                    return true;
                }
            }
            for( let mpHitsCount = 0; mpHitsCount < this.vehicleMotive11.length; mpHitsCount++) {
                if( this.vehicleMotive11[ mpHitsCount ] ) {
                    return true;
                }
            }

            if( this.vehicleMotive12 ) {
                return true;
            }
        }
        return false;
    }

    public hasRoundStaged(): boolean {

        if (this.roundHeat !== this.currentHeat) {
            return true;
        }

        for( const point of this.roundArmor ) {
            if (point) {
                return true;
            }
        }
        for( const point of this.roundStructure ) {
            if (point) {
                return true;
            }
        }
        for( const point of this.roundEngineHits ) {
            if (point) {
                return true;
            }
        }
        for( const point of this.roundFireControlHits ) {
            if (point) {
                return true;
            }
        }
        for( const point of this.roundMpControlHits ) {
            if (point) {
                return true;
            }
        }
        for( const point of this.roundWeaponHits ) {
            if (point) {
                return true;
            }
        }

        if(
            ( this.type && this.type.trim().toLowerCase() === "sv" )
                ||
            ( this.type && this.type.trim().toLowerCase() === "cv" )
        ) {

            for( let mpHitsCount = 0; mpHitsCount < this.roundVehicleMotive910.length; mpHitsCount++) {
                if( this.roundVehicleMotive910[ mpHitsCount ] ) {
                    return true;
                }
            }
            for( let mpHitsCount = 0; mpHitsCount < this.vehicleMotive11.length; mpHitsCount++) {
                if( this.roundVehicleMotive11[ mpHitsCount ] ) {
                    return true;
                }
            }

            if( this.roundVehicleMotive12 ) {
                return true;
            }
        }
        return false;
    }


    public getEngineHits(): number {
        let rv = 0;
        if( this.engineHits ) {
            for( const val of this.engineHits  ) {
                if( val ) {
                    rv++;
                }
            }
        }

        return rv;
    }

    hasTripeStrengthMyomer(): boolean {

        return this.hasAbility("tsm");

    }

    public hasAbility( ability: string ): boolean {
        for( const abi of this.abilities ) {
            if( abi.toLowerCase().trim() === ability.toLowerCase().trim()) {
                return true;
            }
        }
        return false;
    }
    public getFireControlHits(): number {
        let rv = 0;
        if( this.engineHits ) {
            for( const val of this.fireControlHits  ) {
                if( val ) {
                    rv++;
                }
            }
        }

        return rv;
    }

    public getMPHits(): number {
        let rv = 0;
        if( this.engineHits ) {
            for( const val of this.mpControlHits  ) {
                if( val ) {
                    rv++;
                }
            }
        }

        return rv;
    }

    public isWrecked(): boolean {
        this.calcCurrentValues()
        return !this.active;
    }


    public getWeaponHits(): number {
        let rv = 0;
        if( this.engineHits ) {
            for( const val of this.weaponHits  ) {
                if( val ) {
                    rv++;
                }
            }
        }

        return rv;
    }

    public reset() {
        this.ewarPlay = {};
        this.currentArmor = [];
        this.currentStructure = [];
        this.currentHeat = 0;
        this.engineHits = [];
        this.fireControlHits = [];
        this.weaponHits = [];
        this.mpControlHits = [];
        this.vehicleMotive910 = [];
        this.vehicleMotive11 = [];
        this.vehicleMotive12 = false;
        this.roundArmor = [];
        this.roundStructure = [];
        this.roundHeat = 0;
        this.roundEngineHits = [];
        this.roundFireControlHits = [];
        this.roundWeaponHits = [];
        this.roundMpControlHits = [];
        this.roundVehicleMotive910 = [];
        this.roundVehicleMotive11 = [];
        this.roundVehicleMotive12 = false;
        this.calcCurrentValues();
    }

    public calcCurrentValues() {


        while( this._pilot.alphaStrikeAbilities.length < 3 ) this._pilot.alphaStrikeAbilities.push(0);
        if( this.currentSkill > 4 ) {
            this._pilot.alphaStrikeAbilities[0] = 0;
            this._pilot.alphaStrikeAbilities[1] = 0;
            this._pilot.alphaStrikeAbilities[2] = 0;
        } else if( this.currentSkill > 3 ) {
            this._pilot.alphaStrikeAbilities[1] = 0;
            this._pilot.alphaStrikeAbilities[2] = 0;
        } else if( this.currentSkill > 1 ) {
            this._pilot.alphaStrikeAbilities[2] = 0;
        }
        if(
            (this.type && this.type.trim().toLowerCase() === "sv")
                ||
            (this.type && this.type.trim().toLowerCase() === "cv")
        ) {
            while( this.mpControlHits.length < 5 ) {
                this.mpControlHits.push( false );
            }

        }

        this.isAerospace = false;
        if(
            (this.type && this.type.trim().toLowerCase() === "af")
                    ||
            (this.type && this.type.trim().toLowerCase() === "cf")
        ) {
            this.isAerospace = true;
        }

        this.isInfantry = false;
        if(
            (this.type && this.type.trim().toLowerCase() === "ba")
                    ||
            (this.type && this.type.trim().toLowerCase() === "ci")
        ) {
            this.isInfantry = true;
        }

        let pvDifference = 0;
        if( this.currentSkill < 4) {
            // improved skill....

            if( this.basePoints <= 7) {
                pvDifference = 1;
            } else if( this.basePoints <= 12) {
                pvDifference = 2;
            } else if( this.basePoints <= 17) {
                pvDifference = 3;
            } else if( this.basePoints <= 22) {
                pvDifference = 4;
            } else if( this.basePoints <= 27) {
                pvDifference = 5;
            } else if( this.basePoints <= 32) {
                pvDifference = 6;
            } else if( this.basePoints <= 37) {
                pvDifference = 7;
            } else if( this.basePoints <= 42) {
                pvDifference = 8;
            } else if( this.basePoints <= 47) {
                pvDifference = 9;
            } else if( this.basePoints <= 52) {
                pvDifference = 10;
            } else {
                pvDifference = 10 + Math.ceil( ( this.basePoints - 52) / 5 );
            }
            this.currentPoints = this.basePoints + ( pvDifference * ( 4 - this.currentSkill ) ) ;
        } else if( this.currentSkill > 4) {
            // low skill....

            if( this.basePoints <= 14) {
                pvDifference = 1;
            } else if( this.basePoints <= 24) {
                pvDifference = 2;
            } else if( this.basePoints <= 34) {
                pvDifference = 3;
            } else if( this.basePoints <= 44) {
                pvDifference = 4;
            } else if( this.basePoints <= 54) {
                pvDifference = 5;
            } else if( this.basePoints <= 64) {
                pvDifference = 6;
            } else if( this.basePoints <= 74) {
                pvDifference = 7;
            } else if( this.basePoints <= 84) {
                pvDifference = 8;
            } else if( this.basePoints <= 94) {
                pvDifference = 9;
            } else if( this.basePoints <= 104) {
                pvDifference = 10;
            } else {
                pvDifference = 10 + Math.ceil( ( this.basePoints - 104) / 10 );
            }
            this.currentPoints = this.basePoints - ( pvDifference * ( this.currentSkill - 4) );
        } else {
            // this.currentSkill = 4;
            this.currentPoints = this.basePoints;
        }

        if( typeof( this.currentArmor ) === "undefined" || this.currentArmor.length === 0 ) {
            this.currentArmor = [];
            for( let armorCount = 0; armorCount < this.armor; armorCount++) {
                this.currentArmor.push( false );
            }
        }

        if( typeof( this.roundArmor ) === "undefined" || this.roundArmor.length !== this.currentArmor.length ) {
            this.roundArmor = [];
            for( let armorCount = 0; armorCount < this.armor; armorCount++) {
                this.roundArmor.push( false );
            }
        }

        if( typeof( this.currentStructure ) === "undefined" || this.currentStructure.length === 0 ) {
            this.currentStructure = [];
            for( let structureCount = 0; structureCount < this.structure; structureCount++) {
                this.currentStructure.push( false );
            }
        }

        if( typeof( this.roundStructure ) === "undefined" || this.roundStructure.length !== this.currentStructure.length ) {
            this.roundStructure = [];
            for( let structureCount = 0; structureCount < this.structure; structureCount++) {
                this.roundStructure.push( false );
            }
        }

        if( typeof( this.engineHits ) === "undefined"  || this.engineHits.length === 0  ) {
            this.engineHits = [];
            for( let engineHitsCount = 0; engineHitsCount < 2; engineHitsCount++) {
                this.engineHits.push( false );
                this.roundEngineHits.push( false );
            }
        }

        if( typeof( this.roundEngineHits ) === "undefined"  || this.roundEngineHits. length !== this.engineHits.length ) {
            this.roundEngineHits = [];
            for( let engineHitsCount = 0; engineHitsCount < 2; engineHitsCount++) {
                this.roundEngineHits.push( false );
            }
        }

        if( typeof( this.fireControlHits ) === "undefined"  || this.fireControlHits.length === 0  ) {
            this.fireControlHits = [];
            for( let fcHitsCount = 0; fcHitsCount < 4; fcHitsCount++) {
                this.fireControlHits.push( false );
            }
        }

        if( typeof( this.roundFireControlHits ) === "undefined"  || this.roundFireControlHits.length !== this.fireControlHits.length  ) {
            this.roundFireControlHits = [];
            for( let fcHitsCount = 0; fcHitsCount < 4; fcHitsCount++) {
                this.roundFireControlHits.push( false );
            }
        }

        if( typeof(this.vehicleMotive910) === "undefined" || this.vehicleMotive910.length === 0 ) {
            this.vehicleMotive910 = [];
            this.roundVehicleMotive910 = [];
            for(let hitCount = 0; hitCount < 2; hitCount++) {
                this.vehicleMotive910.push( false );
                this.roundVehicleMotive910.push( false );
            }
        }

        if( typeof(this.roundVehicleMotive910) === "undefined" || this.roundVehicleMotive910.length !== this.vehicleMotive910.length ) {
            this.roundVehicleMotive910 = [];
            for(let hitCount = 0; hitCount < 2; hitCount++) {
                this.roundVehicleMotive910.push( false );
            }
        }

        if( typeof(this.vehicleMotive11) === "undefined" || this.vehicleMotive11.length === 0 ) {
            this.vehicleMotive11 = [];
            this.roundVehicleMotive11 = [];
            for(let hitCount = 0; hitCount < 2; hitCount++) {
                this.vehicleMotive11.push( false );
                this.roundVehicleMotive11.push( false );
            }
        }

        if( typeof(this.roundVehicleMotive11) === "undefined" || this.roundVehicleMotive11.length !== this.vehicleMotive11.length ) {
            this.roundVehicleMotive11 = [];
            for(let hitCount = 0; hitCount < 2; hitCount++) {
                this.roundVehicleMotive11.push( false );
            }
        }

        if( typeof( this.mpControlHits ) === "undefined"  || this.mpControlHits.length === 0  ) {
            this.mpControlHits = [];
            let numberOfHits = 4;
            if(
                ( this.type && this.type.toLowerCase() === "bm" )
                    ||
                ( this.type && this.type.toLowerCase() === "im" )
            ) {
                // mechs have 4 hits
                numberOfHits = 4;
            }

            if(
                ( this.type && this.type.trim().toLowerCase() === "sv" )
                    ||
                ( this.type && this.type.trim().toLowerCase() === "cv" )
            ) {
                // vehicles have 5 hits
                numberOfHits = 5;
            }

            for( let mpHitsCount = 0; mpHitsCount < numberOfHits; mpHitsCount++) {
                this.mpControlHits.push( false );
            }
        }

        if( typeof( this.roundMpControlHits ) === "undefined"  || this.roundMpControlHits.length !== this.mpControlHits.length  ) {
            // Started empty: adding to a list of another length never reached the right one, and grew it on every call.
            this.roundMpControlHits = [];
            for ( let mpHitsCount = 0; mpHitsCount < this.mpControlHits.length; mpHitsCount++) {
                this.roundMpControlHits.push( false );
            }
        }

        if( typeof( this.weaponHits ) === "undefined"  || this.weaponHits.length === 0  ) {
            this.weaponHits = [];
            this.roundWeaponHits = [];
            for( let weaponHitsCount = 0; weaponHitsCount < 4; weaponHitsCount++) {
                this.weaponHits.push( false );
                this.roundWeaponHits.push( false );
            }
        }

        if( typeof( this.roundWeaponHits ) === "undefined"  || this.roundWeaponHits.length !== this.weaponHits.length ) {
            this.roundWeaponHits = [];
            for( let weaponHitsCount = 0; weaponHitsCount < 4; weaponHitsCount++) {
                this.roundWeaponHits.push( false );
            }
        }



        let currentWeaponHits = 0;
        for( let weaponHitsCount = 0; weaponHitsCount < this.weaponHits.length; weaponHitsCount++) {
            if( this.weaponHits[ weaponHitsCount ] )
                currentWeaponHits++;
        }

        let currentFCHits = 0;
        for( let fcHitsCount = 0; fcHitsCount < this.fireControlHits.length; fcHitsCount++) {
            if( this.fireControlHits[ fcHitsCount ] )
                currentFCHits++;
        }

        // let currentMPHits = 0;
        // for( let mpHitsCount = 0; mpHitsCount < this.mpControlHits.length; mpHitsCount++) {
        //     if( this.mpControlHits[ mpHitsCount ] )
        //         currentMPHits++;
        // }

        let currentEngineHits = 0;
        for( let engineHitsCount = 0; engineHitsCount < this.engineHits.length; engineHitsCount++) {
            if( this.engineHits[ engineHitsCount ] )
                currentEngineHits++;
        }
        const playRules = getAlphaStrikeEdition(this.playEdition).playRules;
        // Calculate Current Damage Values from Crits...
        
        const [shortDamage, shortMinimal] = this.calculateDamage(this.damage.short, currentWeaponHits, this.damage.shortMinimal || false, playRules.weaponHitToMinimal);
        const [mediumDamage, mediumMinimal] = this.calculateDamage(this.damage.medium, currentWeaponHits, this.damage.mediumMinimal || false, playRules.weaponHitToMinimal);
        const [longDamage, longMinimal] = this.calculateDamage(this.damage.long, currentWeaponHits, this.damage.longMinimal || false, playRules.weaponHitToMinimal);
        const [extremeDamage, extremeMinimal] = this.calculateDamage(this.damage.extreme, currentWeaponHits, this.damage.extremeMinimal || false, playRules.weaponHitToMinimal);

        this.currentDamage = {
            short: shortDamage,
            medium: mediumDamage,
            long: longDamage,
            extreme: extremeDamage,
            shortMinimal: shortMinimal,
            mediumMinimal: mediumMinimal,
            longMinimal: longMinimal,
            extremeMinimal: extremeMinimal,
        };

        this.currentAbilities = this.abilities.map((abi) => {
                const split = abi.trimStart().split(/\d/);

                const canBeCritAbilities = ['FLK', 'HT', 'IF', 'LRM', 'MSL', 'SRM', 'TUR(', 'TOR', 'REAR', 'AC','IATM']
                // If there are no numbers, it's not got damage values.
                // MUL cards space the code from its values ("IF 0*", "TUR (2/2/1"), so compare without spaces.
                if (split.length === 1 || !canBeCritAbilities.includes(split[0].replace(/\s+/g, "").toUpperCase())) {
                    return abi;
                }
                // Keep the card's own spelling of the code, space included.
                const type = split[0];
                let values = abi.trimStart().slice(type.length).trim();
                let turret = false;

                // If the last character is a parenthesis, remove it and set turret to true
                // This is a bit of a hack, but it works for now
                if (values.endsWith(")")) {
                    turret = true;
                    values = values.slice(0, values.length - 1);
                }
                const damageValues = values.split("/");
                const abiString = type + damageValues.map((damageValue) => {
                    let damage = 0;
                    let minimal = false;
                    let dash = false;
                    if (damageValue === "-") {
                        dash = true;
                    } else {
                        [damage, minimal] = this.calculateDamage(+damageValue, currentWeaponHits, damageValue === "0*", playRules.weaponHitToMinimal);
                    }
                    return dash ? "-" : minimal ? "0*" : damage.toString();
                }).join("/");

                return turret? abiString + ")" : abiString;
        });


        for( let moveC = 0; moveC < this.move.length; moveC++ ) {
            this.move[moveC].currentMove = this.move[moveC].move;
        }

        // Calculate Critical Movement
        if(
            ( this.type && this.type.toLowerCase() === "bm" )
                ||
            ( this.type && this.type.toLowerCase() === "im" )
                ||
            // A Micro-Mech (Custom Homebrew) takes critical hits on the 'Mech column.
            ( this.type && this.type.toLowerCase() === "mm" )
                ||
            // A walker (Custom Homebrew): WK as a BattleMech, IWK as an IndustrialMech.
            ( this.type && ( this.type.toLowerCase() === "wk" || this.type.toLowerCase() === "iwk" ) )
        ) {
            // for BattleMechs
            for( let count = 0; count < this.getMPHits(); count++ ) {
                for( let moveC = 0; moveC < this.move.length; moveC++ ) {
                    let moveHit = Math.round(this.move[moveC].currentMove / 2);
                    if( moveHit < 2 ) {
                        moveHit = 2;
                    }
                    this.move[moveC].currentMove -= moveHit;
                    if( this.move[moveC].currentMove < 0 ) {
                        this.move[moveC].currentMove = 0;
                    }
                }
            }

        }

        if(
            ( this.type && this.type.trim().toLowerCase() === "sv" )
                ||
            ( this.type && this.type.trim().toLowerCase() === "cv" )
        ) {
            let vehicle11Hits = 0;
            let vehicle910Hits = 0;

            for( let mpHitsCount = 0; mpHitsCount < this.vehicleMotive910.length; mpHitsCount++) {
                if( this.vehicleMotive910[ mpHitsCount ] ) {
                    vehicle910Hits++;
                }
            }
            for( let mpHitsCount = 0; mpHitsCount < this.vehicleMotive11.length; mpHitsCount++) {
                if( this.vehicleMotive11[ mpHitsCount ] ) {
                    vehicle11Hits++;
                }
            }

            for( let moveC = 0; moveC < this.move.length; moveC++ ) {

                // Vehicles with an engine hit halve their movement (round down)
                if (this.getEngineHits() > 0) {
                    this.move[moveC].currentMove = Math.floor(this.move[moveC].currentMove / 2);
                }

                for( let count = 0; count < vehicle11Hits; count++) {
                    let half = Math.floor( this.move[moveC].currentMove / 2 );
                    if( half < 2 ) {
                        half = 2;
                    }
                    this.move[moveC].currentMove -= half;
                }

                for( let count = 0; count < vehicle910Hits; count++) {
                    this.move[moveC].currentMove -= 2;
                }

                if( this.move[moveC].currentMove < 0 ) {
                    this.move[moveC].currentMove = 0;
                }

                if( this.vehicleMotive12 ) {
                    this.move[moveC].currentMove = 0;
                }
            }
        }

        this.currentMove = "";
        this.currentTMM = "";
        this.currentMoveHexes = "";

        this.immobile = true;
        if( this.move[0]?.type === "j" ) {
            this.move = [
                {
                    move: this.move[0].move,
                    currentMove: this.move[0].currentMove,
                    type: "",
                },
                {
                    move: this.move[0].move,
                    currentMove: this.move[0].currentMove,
                    type: this.move[0].type,
                }
            ]
        }
        for( let moveC = 0; moveC < this.move.length; moveC++ ) {




            let tmpTMM = 0;


            if( this.hasTripeStrengthMyomer() && this.currentHeat === 1 ) {
                if( this.move[moveC].currentMove < 5 ) {
                    tmpTMM = 0;
                } else if( this.move[moveC].currentMove < 9 ) {
                    tmpTMM = 1;
                } else if( this.move[moveC].currentMove < 13 ) {
                    tmpTMM = 2;
                } else if( this.move[moveC].currentMove < 19 ) {
                    tmpTMM = 3;
                } else if( this.move[moveC].currentMove < 35 ) {
                    tmpTMM = 4;
                } else {
                    tmpTMM = 5;
                }
            } else {
                if( this.move[moveC].move < 5 ) {
                    tmpTMM = 0;
                } else if( this.move[moveC].move < 9 ) {
                    tmpTMM = 1;
                } else if( this.move[moveC].move < 13 ) {
                    tmpTMM = 2;
                } else if( this.move[moveC].move < 19 ) {
                    tmpTMM = 3;
                } else if( this.move[moveC].move < 35 ) {
                    tmpTMM = 4;
                } else {
                    tmpTMM = 5;
                }
            }



            // Subtract Heat from Current Move
            if( this.move[moveC].type !== "j" || this.move.length === 1 ) {
                // if( this.type.toLowerCase().trim() === "bm" ) {

                // }
                if( this.hasTripeStrengthMyomer() ) {
                    switch( this.currentHeat ) {
                        case 1: {
                            this.move[moveC].currentMove += 2;
                            break;
                        }
                        case 2: {
                            // no effect on movement
                            break;
                        }
                        default: {
                            this.move[moveC].currentMove = this.move[moveC].currentMove - this.currentHeat * 2;

                            break;
                        }
                    }
                    if (this.move[moveC].currentMove < 0 || this.currentHeat === 4){
                        this.move[moveC].currentMove = 0;
                    }
                } else {
                    // if( this.move[moveC].type != "j" ) {
                        this.move[moveC].currentMove = this.move[moveC].currentMove - this.currentHeat * 2;
                        //can't have minus move, or heat level "4" === shutdown
                        if (this.move[moveC].currentMove < 0 || this.currentHeat === 4){
                            this.move[moveC].currentMove = 0;
                        }
                    // }
                }

            }

            this.currentMoveSprint = "" + (+this.move[0].currentMove * 1.5 ) + "\"";
            this.currentMoveHexesSprint = "" + ( Math.ceil(( +this.move[0].currentMove / 2) * 1.5) )+ "⬣";

            this.currentMove += this.move[moveC].currentMove.toString() + "\"" + this.move[moveC].type;
            this.currentMoveHexes += ( this.move[moveC].currentMove / 2).toString() + "⬣" + this.move[moveC].type;





            // if( this.move[moveC].type === "j" ) {
            //     tmpTMM++;
            // }
            if( this.move[moveC].type === "j" && (
                this.hasAbility("JMPS") || this.hasAbility("JMPW")
            )
            ) {
                tmpTMM++;
            }

            const typeLower = this.type.trim().toLowerCase();
            if (typeLower === "sv" || typeLower === "cv") {
                if (playRules.vehicleEngineHitHalvesTmm && this.getEngineHits() > 0) {
                    // Vehicles with an engine hit halve their TMM (round down; ASCE p.50 only, the 2013 book halves Move and damage)
                    tmpTMM = Math.floor(tmpTMM / 2);
                }
            }

            // MP Hits against Move
            for( let count = 0; count < this.getMPHits(); count++ ) {
                let tmmHit = Math.round(tmpTMM / 2);
                if( tmmHit < 1 ) {
                    tmmHit = 1;
                }
                tmpTMM -= tmmHit;

                if( tmpTMM < 0 ) {
                    tmpTMM = 0;
                }

                // for( let moveC = 0; moveC < this.move.length; moveC++ ) {
                    // let moveHit = Math.round(this.move[moveC].currentMove / 2);
                    // if( moveHit < 2 ) {
                    //     moveHit = 2;
                    // }
                    // this.move[moveC].currentMove -= moveHit;
                    // if( this.move[moveC].currentMove < 0 ) {
                    //     this.move[moveC].currentMove = 0;
                    // }
                // }
            }
            if(
                ( this.type && this.type.trim().toLowerCase() === "sv" )
                    ||
                ( this.type && this.type.trim().toLowerCase() === "cv" )
            ) {

                for( let mpHitsCount = 0; mpHitsCount < this.vehicleMotive910.length; mpHitsCount++) {
                    if( this.vehicleMotive910[ mpHitsCount ] ) {
                        tmpTMM -= 1;
                    }
                }
                for( let mpHitsCount = 0; mpHitsCount < this.vehicleMotive11.length; mpHitsCount++) {
                    if( this.vehicleMotive11[ mpHitsCount ] ) {
                        let half = Math.floor(tmpTMM / 2);
                        if( half < 1 ) {
                            half = 1;
                        }
                        tmpTMM -= half;
                    }
                }
            }

            if( this.move[moveC].currentMove < 0 ) {
                this.move[moveC].currentMove = 0;
            }

            if( this.move[moveC].currentMove === 0 )
                tmpTMM = -4;

            // shut down units have a tmm of -4 (ASC pg. 53)
            if( this.currentHeat === 4 ){
                tmpTMM = -4;
                this.immobile = true;
            } else {
                // -1 TMM at heat level 2 or higher (ASCE p.53 only; the 2013 book keeps the card TMM)
                if( playRules.heatLowersTmm && this.currentHeat > 1 && this.move[moveC].type !== "j" ){
                    tmpTMM -= 1;
                    if( tmpTMM < 0 ) {
                        tmpTMM = 0;
                    }
                }
                // UNCOMMENT the below area if it's a -1 TMM at OV3 on top of the -1 TMM at OV2
                // if( this.currentHeat > 2 ){
                //     tmpTMM -= 1;
                //     if( tmpTMM < 0 ) {
                //         tmpTMM = 0;
                //     }
                // }
            }

            if( this.move[moveC].currentMove > 0 )
            this.immobile = false;

            if( tmpTMM.toString() + "/" !== this.currentTMM )
                this.currentTMM += tmpTMM.toString() + this.move[moveC].type.toLowerCase();



            if( moveC !== this.move.length - 1 ) {
                this.currentTMM += "/";
                this.currentMove += "/";
                this.currentMoveHexes += "/";
            }

        }
        if( this.currentTMM.endsWith("/"))
            this.currentTMM = this.currentTMM.substring( 0, this.currentTMM.length - 1);

        // Calculate To-Hits with Criticals
        this.currentToHitShort = this.currentSkill + this.currentHeat + currentFCHits * 2; // + currentEngineHits;
        this.currentToHitMedium = this.currentSkill + 2 + this.currentHeat + currentFCHits * 2; // + currentEngineHits;
        this.currentToHitLong = this.currentSkill + 4 + this.currentHeat + currentFCHits * 2; // + currentEngineHits;
        this.currentToHitExtreme = this.currentSkill + 6 + this.currentHeat + currentFCHits * 2; // + currentEngineHits;
        // The Companion's quirks, with the game's "Use design quirks" switch on (ASC pp.59-67).
        if( this.quirksInPlay ) {
            const quirks = getAlphaStrikeQuirksInYear(this.quirks, this.quirkPlayYear ?? this.quirkEraStart);
            this.currentToHitShort += getAlphaStrikeQuirkToHit(quirks, "short");
            this.currentToHitMedium += getAlphaStrikeQuirkToHit(quirks, "medium");
            this.currentToHitLong += getAlphaStrikeQuirkToHit(quirks, "long");
            this.currentToHitExtreme += getAlphaStrikeQuirkToHit(quirks, "extreme");
        }

        this.currentHeat = this.currentHeat / 1;

        // Engine Hit Heat Effects
        // if( currentEngineHits === 1 )
        //     if( this.currentHeat < 1)
        //         this.currentHeat = 1;

        if( this.currentHeat < 0 )
            this.currentHeat = 0;

        if( this.currentHeat > 4 )
            this.currentHeat = 4;

        this.getCurrentStructure();

        if( currentEngineHits > 1 )
            this.active = false;


    }

    private calculateDamage(damage: number, weaponHits: number, minimal: boolean | undefined, weaponHitToMinimal: boolean = true): [number, boolean] {
        const typeLower = this.type.trim().toLowerCase();
        if ((typeLower === "sv") || (typeLower === "cv")) {
            if (this.getEngineHits() > 0) {
                // Vehicles with an engine hit halve their damage (round down)
                damage = Math.floor(damage / 2);
            }
        }

        if (minimal === false) {
            damage = (+damage - weaponHits);
            // If weapon damage is now 0, and there are still hits, we have hit the minimal damage threshold
            if (weaponHitToMinimal && damage == 0 && weaponHits > 0) {
                minimal = true;
            } else if (damage < 0) {
                damage = 0;
            }
            // If we are already at minimal damage and have weapon hits, we go to 0 damage
        } else if (minimal === true) {
            if (weaponHits) {
                damage = 0;
                minimal = false;
            }
        }
        // Catch the rest
        else {
            damage = 0;
        }
        return [damage, minimal ? true : false];
    }
    /** True for a large craft whose damage is given by firing arc. */
    public hasArcs(): boolean {
        return this.arcs !== null;
    }

    /**
    * Returns a boolean if the unit is a ground unit. This is used for
    * calculating whether or not the unit can sprint
    *
    * @beta
    */
    public isGroundUnit(): boolean {
        // Fighters, Small Craft, DropShips and capital ships (ASC unit type codes).
        if( ["AF", "CF", "SC", "DS", "DA", "JS", "WS", "SS"].includes(this.type) ) {
            return false;
        }
        for( let moveC = 0; moveC < this.move.length; moveC++  ){
            if(this.move[moveC].type.toLowerCase() === "v" ) {
                return false;
            }
        }
        return true;
    }

    public getSpecialAbility( tag: string ): IASSpecialAbility | null {
        if( this.abilities ) {
            for( const def of CONST_AS_SPECIAL_ABILITIES ) {
                if( tag.toLowerCase().trim() === def.tag.toLowerCase().trim() ) {
                    const newDef = JSON.parse(JSON.stringify(def));
                    newDef.rawTag = tag;
                    return newDef;
                }
                if(def.tag.indexOf("%") > 0) {
                    const baseTag = def.tag.substring(0, def.tag.indexOf("%") ).toLowerCase();

                    if( tag.toLowerCase().startsWith(baseTag) ) {
                        const newDef = JSON.parse(JSON.stringify(def));
                        newDef.rawTag = tag;
                        return newDef;
                    }
                }
                if(def.tag.indexOf("#") > 0) {
                    const baseTag = def.tag.substring(0, def.tag.indexOf("#") ).toLowerCase();
                    if( tag.toLowerCase().startsWith(baseTag) ) {
                        const tmp = tag.toLowerCase().replace(baseTag, "");
                        if( tmp.length > 0 ) {
                            if( !Number.isNaN(Number(tmp[0])) ) {
                                const newDef = JSON.parse(JSON.stringify(def));
                                newDef.rawTag = tag;
                                return newDef;
                            }
                        }
                    }
                }
            }

        }
        return null;
    }

    public setHeat( newHeatValue: number ) {
        this.roundHeat = newHeatValue;
    }

    public applyRound() {
        this.currentHeat = this.roundHeat;
        this.roundArmor.forEach((point, pointIndex) => {
            if (point) {
                this.currentArmor[pointIndex] = !this.currentArmor[pointIndex];
                this.roundArmor[pointIndex] = false;
            }
        });
        this.roundStructure.forEach((point, pointIndex) => {
            if (point) {
                this.currentStructure[pointIndex] = !this.currentStructure[pointIndex];
                this.roundStructure[pointIndex] = false;
            }
        });
        this.roundEngineHits.forEach((point, pointIndex) => {
            if (point) {
                this.engineHits[pointIndex] = !this.engineHits[pointIndex];
                this.roundEngineHits[pointIndex] = false;
            }
        });
        this.roundFireControlHits.forEach((point, pointIndex) => {
            if (point) {
                this.fireControlHits[pointIndex] = !this.fireControlHits[pointIndex];
                this.roundFireControlHits[pointIndex] = false;
            }
        });
        this.roundMpControlHits.forEach((point, pointIndex) => {
            if (point) {
                this.mpControlHits[pointIndex] = !this.mpControlHits[pointIndex];
                this.roundMpControlHits[pointIndex] = false;
            }
        });
        this.roundWeaponHits.forEach((point, pointIndex) => {
            if (point) {
                this.weaponHits[pointIndex] = !this.weaponHits[pointIndex];
                this.roundWeaponHits[pointIndex] = false;
            }
        });
        this.roundVehicleMotive910.forEach((point, pointIndex) => {
            if (point) {
                this.vehicleMotive910[pointIndex] = !this.vehicleMotive910[pointIndex];
                this.roundVehicleMotive910[pointIndex] = false;
            }
        });
        this.roundVehicleMotive11.forEach((point, pointIndex) => {
            if (point) {
                this.vehicleMotive11[pointIndex] = !this.vehicleMotive11[pointIndex];
                this.roundVehicleMotive11[pointIndex] = false;
            }
        });
        if (this.roundVehicleMotive12) {
            this.vehicleMotive12 = !this.vehicleMotive12;
        }
        this.roundVehicleMotive12 = false;
    }

    public takeDamage( numberOfPoints: number ) {
        let leftOverPoints = numberOfPoints;
        
        for( let pointCounter = 0; pointCounter < numberOfPoints; pointCounter++ ) {
            for( let armorCounter = 0; armorCounter < this.roundArmor.length; armorCounter++ ) {
                if( this.roundArmor[armorCounter] === false && this.currentArmor[armorCounter] === false ) {
                    if( leftOverPoints > 0 ) {
                        this.roundArmor[armorCounter] = true;
                        leftOverPoints--;
                    }
                } else if ( this.roundArmor[armorCounter] === true && this.currentArmor[armorCounter] === true ) {
                    this.roundArmor[armorCounter] = false;
                }
            }
            for( let structureCounter = 0; structureCounter < this.roundStructure.length; structureCounter++ ) {
                if( this.roundStructure[structureCounter] === false && this.currentStructure[structureCounter] === false ) {
                    if( leftOverPoints > 0 ) {
                        this.roundStructure[structureCounter] = true;
                        leftOverPoints--;
                    } 
                } else if ( this.roundStructure[structureCounter] === true && this.currentStructure[structureCounter] === true ) {
                    this.roundStructure[structureCounter] = false;
                }
            }
            
        }

        this.calcCurrentValues();
    }

    public getCurrentArmor() {
        let armorPoints = 0;
        for( let armorCounter = 0; armorCounter < this.currentArmor.length; armorCounter++ ) {
            if( this.currentArmor[armorCounter] === false ) {
                armorPoints++;
            }
        }
        return armorPoints;
    }

    public getCurrentStructure() {
        let structPoints = 0;
        for( let structureCounter = 0; structureCounter < this.currentStructure.length; structureCounter++ ) {
            if( this.currentStructure[structureCounter] === false ) {
                structPoints++;
            }
        }

        if( structPoints < 1 )
            this.active = false;
        else
            this.active = true;

        return structPoints;
    }

    public setArmor( nv: number ) {
        this.armor = nv;
    }
    public setStructure( nv: number ) {
        this.structure = nv;
    }

    public export(
        noInPlayVariables: boolean = false,
    ): IAlphaStrikeUnitExport {
        // In Play Variables

        let _currentArmor: boolean[] = [];
        let _currentStructure: boolean[] = [];
        let _engineHits: boolean[] = [];
        let _fireControlHits: boolean[] = [];
        let _mpControlHits: boolean[] = [];
        let _weaponHits: boolean[] = [];

        let _vehicleMotive910: boolean[] = [];
        let _vehicleMotive11: boolean[] = [];
        let _vehicleMotive12: boolean = false;

        let _currentHeat = 0;

        let _roundArmor: boolean[] = [];
        let _roundStructure: boolean[] = [];
        let _roundEngineHits: boolean[] = [];
        let _roundFireControlHits: boolean[] = [];
        let _roundMpControlHits: boolean[] = [];
        let _roundWeaponHits: boolean[] = [];
        let _roundVehicleMotive910: boolean[] = [];
        let _roundVehicleMotive11: boolean[] = [];
        let _roundVehicleMotive12: boolean = false;
        let _roundHeat = 0;

        if( !noInPlayVariables ) {
            _currentArmor = this.currentArmor;
            _currentHeat = this.currentHeat;

            _currentStructure = this.currentStructure;
            _engineHits = this.engineHits;
            _fireControlHits = this.fireControlHits;
            _mpControlHits = this.mpControlHits;
            _weaponHits = this.weaponHits;
            _vehicleMotive910 = this.vehicleMotive910;
            _vehicleMotive11 = this.vehicleMotive11;
            _vehicleMotive12 = this.vehicleMotive12;
            _roundArmor = this.roundArmor;
            _roundStructure = this.roundStructure;
            _roundEngineHits = this.roundEngineHits;
            _roundFireControlHits = this.roundFireControlHits;
            _roundMpControlHits = this.roundMpControlHits;
            _roundWeaponHits = this.roundWeaponHits;
            _roundVehicleMotive910 = this.roundVehicleMotive910;
            _roundVehicleMotive11 = this.roundVehicleMotive11;
            _roundVehicleMotive12 = this.roundVehicleMotive12;
            _roundHeat = this.roundHeat;
        }

        const rv:  IAlphaStrikeUnitExport = {
            mechCreatorUUID:  this.mechCreatorUUID,
            customName: this.customName,
            currentArmor: _currentArmor,
            currentStructure: _currentStructure,
            engineHits: _engineHits,
            fireControlHits: _fireControlHits,
            mpControlHits: _mpControlHits,
            weaponHits: _weaponHits,
            vehicleMotive910:  _vehicleMotive910,
            vehicleMotive11:  _vehicleMotive11,
            vehicleMotive12:  _vehicleMotive12,
            roundArmor: _roundArmor,
            roundStructure: _roundStructure,
            roundEngineHits: _roundEngineHits,
            roundFireControlHits: _roundFireControlHits,
            roundMpControlHits: _roundMpControlHits,
            roundWeaponHits: _roundWeaponHits,
            roundVehicleMotive910: _roundVehicleMotive910,
            roundVehicleMotive11: _roundVehicleMotive11,
            roundVehicleMotive12: _roundVehicleMotive12,
            roundHeat: _roundHeat,
            classification:  this.classification,
            class:  this.class?? "",
            costCR:  this.costCR,
            mulID:  this.mulID,
            mulSource:  this.mulSource,
            currentHeat:  _currentHeat,
            damage:  this.damage,
            variant:  this.variant,
            dateIntroduced:  this.dateIntroduced,
            name:  this.name,
            tmm:  this.tmm,
            tonnage:  this.tonnage,
            tro:  this.tro,
            rulesLevel:  this.rulesLevel,
            ...(this.munition ? { munition: this.munition } : {}),
            ...(this.rulesets.length > 0 ? { rulesets: [...this.rulesets] } : {}),
            ...(!noInPlayVariables && Object.keys(this.ewarPlay).length > 0 ? { ewarPlay: JSON.parse(JSON.stringify(this.ewarPlay)) as IASEWarPlayState } : {}),
            quirks:  this.quirks.map((quirk) => ({ ...quirk })),
            quirkEraStart:  this.quirkEraStart,
            role:  this.role,
            threshold:  this.threshold,
            arcs:  this.arcs,
            pilot:  this._pilot,
            imageURL:  this.imageURL,
            move:  this.move,
            jumpMove:  this.jumpMove,
            structure:  this.structure,
            armor:  this.armor,
            type:  this.type,
            size:  this.size,
            showDetails:  this.showDetails,
            abilities:  this.abilities,
            overheat:  this.overheat,
            basePoints:  this.basePoints,
            currentSkill:  this.currentSkill,
            uuid: this.uuid,
        };

        return rv;
    }

    export2(): IAlphaStrikeExport {
        const rv: IAlphaStrikeExport = {
            mechCreatorUUID: this.uuid,
            name: this.name,
            move: this.move[0].move,
            type: this.type,
            customName: this.customName,
            role: this.role,
            jumpMove: this.jumpMove,
            pv: this.basePoints,
            damage: this.damage,
            armor: this.armor,
            structure: this.structure,
            size: this.size,
            skill: this._pilot.gunnery,
            overheat: this.overheat,
            notes: "",
            tmm: this.tmm,
            sizeClass: this.size,
            sizeClassName: "",
            ov: this.overheat,
            specialUnitAbilities: this.abilities,
            longHeat: this.overheat,
            longOverheat: this.overheat,
            abilityCodes: this.abilities,
        }
        return rv;
    }

    /**
     * Recalculates the Point Value of a ground unit from its card (ASC pp.138-141 as corrected by errata v1.6),
     * with the same rules as the 'Mech conversion. Aerospace cards keep the Point Value they were given.
     */
    calc(): string {
        const ground = ["BM", "IM", "PM", "CV", "SV", "BA", "CI", "MM", "WK", "IWK"];
        const type = (this.type || "").trim().toUpperCase();
        const jumpEntries = this.move.filter((move) => move.type === "j");
        const moves = this.move.filter((move) => move.type !== "j").map((move) => ({ inches: +move.move || 0, mode: (move.type || "").toLowerCase() }));
        const jump = Math.max(+this.jumpMove || 0, ...jumpEntries.map((move) => +move.move || 0));
        // A card prints only the jump when it equals the ground Move ('12"j').
        if (moves.length === 0 && jump > 0) moves.push({ inches: jump, mode: "" });
        // Airships, fixed-wing and satellite support vehicles move in thrust, and price as aerospace units.
        const aerospaceMove = moves.some((move) => ["a", "i", "k", "p"].includes(move.mode));
        if (!ground.includes(type) || aerospaceMove) {
            this.calcCurrentValues();
            return "<div class=\"text-center\"><strong> - Point Value - </strong></div>\n"
                + "The Point Value of an aerospace unit is not recalculated here; it keeps " + this.basePoints + ".<br />\n";
        }

        const damage = (value: number, minimal: boolean | undefined) => ({ damage: +value || 0, minimal: !!minimal });
        const pv = calculateGroundPointValue({
            type,
            size: this.size,
            moves,
            jump,
            short: damage(this.damage.short, this.damage.shortMinimal),
            medium: damage(this.damage.medium, this.damage.mediumMinimal),
            long: damage(this.damage.long, this.damage.longMinimal),
            overheat: +this.overheat || 0,
            armor: +this.armor || 0,
            structure: +this.structure || 0,
            specials: splitSpecialAbilities(Array.isArray(this.abilities) ? this.abilities.join(",") : this.abilities),
        });
        this.basePoints = pv.pointValue;
        this.calcCurrentValues();
        return "<div class=\"text-center\"><strong> - Calculating Point Value - </strong></div>\n"
            + pv.log.map((line) => line + "<br />\n").join("");
    }
}

/** MUL "Rules" values mapped to rules-level-options ids (Introductory 1 ... Experimental 4). */
export function getRulesLevelFromMULRules(rules: string | undefined | null): number | undefined {
    switch ((rules ?? "").trim().toLowerCase()) {
        case "introductory": return 1;
        case "standard": return 2;
        case "advanced": return 3;
        case "experimental": return 4;
        case "unofficial": return APOCRYPHAL_RULES_LEVEL;
        default: return undefined;
    }
}
