import { CONST_AS_PILOT_ABILITIES, IASPilotAbility } from "../data/alpha-strike-pilot-abilities";
import { CONST_AS_SPECIAL_ABILITIES, IASSpecialAbility } from "../data/alpha-strike-special-abilities";
import { IAlphaStrikeExport } from "../utils/calculateAlphaStrikeValue";
import { generateUUID } from "../utils/generateUUID";
import Pilot, { IPilot } from "./pilot";
import { CONST_AS_OPFOR_BEHAVIORS, OpForBehavior } from "../data/bryms-opfor-behaviors";
import { CONST_AS_BEHAVIOR_TABLE } from "../data/bryms-opfor-behaviors";

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
    currentSprint: number;
    type: string;
    tmm: number;
};

export interface IASAttack {
    name: string;
    type: string;
    damage: number;
    minimal: boolean;
    toHit: number;
    range: number;
    disabled: boolean;
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

    BFDamageShortMin?: boolean;
    BFDamageMediumMin?: boolean;
    BFDamageLongMin?: boolean;
    BFDamageExtremeMin?: boolean;
}

export interface IAlphaStrikeUnitExport {
    mechCreatorUUID: string;

    customName?: string;

    currentArmor?: boolean[];
    currentStructure?: boolean[];
    engineHits?: number;
    fireControlHits?: number;
    mpControlHits?: number;
    weaponHits?: number;
    vehicleMotive910?: number;
    vehicleMotive11?: number;
    vehicleMotive12?: boolean;

    roundArmor?: boolean[];
    roundStructure?: boolean[];
    roundEngineHits?: number;
    roundFireControlHits?: number;
    roundMpControlHits?: number;
    roundWeaponHits?: number;
    roundVehicleMotive910?: number;
    roundVehicleMotive11?: number;
    roundVehicleMotive12?: boolean;
    roundHeat?: number;
    hullDown?: boolean;
    currentBehavior?: OpForBehavior;

    attacks?: IASAttack[];

    tmm: number;
    // Additional Fields we use internally
    classification: string;
    class: string;
    costCR: number;
    mulID: number;
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

    move: IMoveNumber[];
    moveToken: IMoveNumber;
    altitude: number;
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
    public moveToken: IMoveNumber = {
        move: 0,
        currentMove: 0,
        currentSprint: 0,
        type: '',
        tmm: 0
    };
    public altitude: number = 0;
    public currentAbilities: string[] = [];

    public attacks: IASAttack[] = [];

    public armor: number = 0;
    public structure: number = 1;

    public threshold: number = 0;

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

    public currentHeat: number = 0;
    public currentArmor: boolean[] = [];
    public currentStructure: boolean[] = [];
    public engineHits: number = 0;
    public fireControlHits: number = 0;
    public mpControlHits: number = 0;
    public weaponHits: number = 0;
    public maxWeaponHits: number = 0;
    public maxMPHits: number = 0;

    public vehicleMotive910: number = 0;
    public vehicleMotive11: number = 0;
    public vehicleMotive12: boolean = false;

    public roundHeat: number = 0;
    public roundArmor: boolean[] = [];
    public roundStructure: boolean[] = [];
    public roundEngineHits: number = 0;
    public roundFireControlHits: number = 0;
    public roundMpControlHits: number = 0;
    public roundWeaponHits: number = 0;
    public roundVehicleMotive910: number = 0;
    public roundVehicleMotive11: number = 0;
    public roundVehicleMotive12: boolean = false;
    public hullDown: boolean = false;
    public behaviors:string[] = [];
    public currentBehavior: OpForBehavior = {
        name: "",
        quarry: "",
        movement: "",
        attack: "",
        reroll: false
    };

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

    public importMUL( incomingMechData: IASMULUnit ) {

        if( typeof(incomingMechData) !== "undefined" && incomingMechData !== null ) {

            this.costCR = +incomingMechData.Cost;
            this.class = incomingMechData.Class ? incomingMechData.Class : "";
            this.variant = incomingMechData.Variant ? incomingMechData.Variant : "";
            this.name = incomingMechData.Name;
            this.dateIntroduced = incomingMechData.DateIntroduced;

            // if( incomingMechData.mechCreatorUUID ) {
            //     this.mechCreatorUUID = incomingMechData.mechCreatorUUID;
            // }

            this.tro = incomingMechData.TRO;

            this.mulID = incomingMechData.Id;

            this.tonnage = +incomingMechData.Tonnage;

            this.threshold = +incomingMechData.BFThreshold;

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
                extreme: incomingMechData.BFDamageLong >= 1 ? incomingMechData.BFDamageLong -1 : 0,
            };

            if( incomingMechData.BFDamageExtreme ) {
                this.damage.extreme = incomingMechData.BFDamageExtreme;
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
                let matches = incomingMechData.BFAbilities.match(/([^,(]+(\(.*?\))*)+/g);
                if (!matches){
                    this.abilities = [];
                } else {
                    for( let match of matches ) {
                        this.abilities.push(match.trim());
                    }
                }
            }

            this.overheat = +incomingMechData.BFOverheat;

            this.basePoints = +incomingMechData.BFPointValue;

            this.imageURL = incomingMechData.ImageUrl;

            let tmpMove = incomingMechData.BFMove;
            this.move = [];
            let tmpMoveObj: IMoveNumber = {
                move: 0,
                currentMove: 0,
                currentSprint: 0,
                type: "",
                tmm: 0
            }
            while( tmpMove.indexOf('"') > 0 )
                tmpMove = tmpMove.replace('"', "");
                if( tmpMove.indexOf("/") > 0 ) {
                    //split move....
                    let moveArray = tmpMove.split( "/" );

                    for( let moveCount = 0; moveCount < moveArray.length; moveCount++ ) {
                        tmpMoveObj = {
                            move: 0,
                            currentMove: 0,
                            currentSprint: 0,
                            type: "",
                            tmm: 0
                        };

                        tmpMoveObj.move = this._getRawNumber( moveArray[moveCount] );
                        tmpMoveObj.type = this._getRawAlpha( moveArray[moveCount] );

                        this.move.push( tmpMoveObj );
                    }
                } else {

                    tmpMoveObj = {
                        move: 0,
                        currentMove: 0,
                        currentSprint: 0,
                        type: "",
                        tmm: 0
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

            this.imageURL = incomingMechData.imageURL;

            this.currentHeat = incomingMechData.currentHeat;

            this.variant = incomingMechData.variant;
            this.tmm = incomingMechData.tmm;
            this.name = incomingMechData.name;
            this.dateIntroduced = incomingMechData.dateIntroduced;

            this.tro = incomingMechData.tro;

            this.role =  incomingMechData.role;

            for (let table of CONST_AS_BEHAVIOR_TABLE) {
                if (table.role === this.role) {
                    this.behaviors = table.behavior;
                }
            }

            this.tonnage = incomingMechData.tonnage / 1;

            this.threshold = incomingMechData.threshold / 1;

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

            if (incomingMechData.attacks) {
                this.attacks = incomingMechData.attacks;
            }

            this.move = incomingMechData.move;

            if( typeof(incomingMechData.abilities) === "string" ) {
                this.abilities = incomingMechData.abilities.split(",");
                for( let abi of this.abilities ) {
                    abi = abi.trim();
                }
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

        if( incomingMechData.mpControlHits ) {
            this.mpControlHits = incomingMechData.mpControlHits;
        }

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

        if (incomingMechData.moveToken) {
            this.moveToken = incomingMechData.moveToken;
        }

        if (incomingMechData.hullDown) {
            this.hullDown = incomingMechData.hullDown
        }

        if (incomingMechData.currentBehavior) {
            this.currentBehavior = incomingMechData.currentBehavior;
        }

        if (incomingMechData.altitude) {
            this.altitude = incomingMechData.altitude >= 0 ? incomingMechData.altitude : 0;
        }

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
            for( let abi of CONST_AS_PILOT_ABILITIES ) {
                if( this._pilot.alphaStrikeAbilities[0] === abi.id )
                    return abi;
            }

        }
        return null;
    }

    public get currentPilotVeteranAbility(): IASPilotAbility | null {
        if( this._pilot.alphaStrikeAbilities.length > 1 ) {
            for( let abi of CONST_AS_PILOT_ABILITIES ) {
                if( this._pilot.alphaStrikeAbilities[1] === abi.id )
                    return abi;
            }

        }
        return null;
    }

    public get currentPilotHeroAbility(): IASPilotAbility | null {
        if( this._pilot.alphaStrikeAbilities.length > 2 ) {
            for( let abi of CONST_AS_PILOT_ABILITIES ) {
                if( this._pilot.alphaStrikeAbilities[2] === abi.id )
                    return abi;
            }

        }
        return null;
    }

    public getPilotAbilities(): any[] {
        let rv: any[] = [];

        for( let id of this._pilot.alphaStrikeAbilities ) {
            let found = false;
            for( let card of CONST_AS_PILOT_ABILITIES ) {
                if( id === card.id ) {
                    rv.push(card);
                    found = true;
                    break;
                }
            }
            if(!found ) rv.push( null );
        }

        return rv;
    }

    getPilotAbilityList(): string[] {
        let rv: string[] = [];

        for( let id of this._pilot.alphaStrikeAbilities ) {
            for( let card of CONST_AS_PILOT_ABILITIES ) {
                if( id === card.id ) {
                    rv.push(card.ability + " (" + card.cost + ")");
                    break;
                }
            }
        }

        return rv;
    }

    public getTotalPilotAbilityPoints(): number {
        let rv = 0;

        for( let id of this._pilot.alphaStrikeAbilities ) {
            for( let card of CONST_AS_PILOT_ABILITIES ) {
                if( id === card.id ) {
                    rv += card.cost;
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

    public rollOpForBehavior(): void {
        if (this.currentBehavior.name === "" && this.behaviors.length > 0) {
            let index = Math.floor(Math.random() * 8);
            let IF = false;
            // Automatically reroll Indirect Fire behavior for Sniper and Missile Boat without IF#
            if (this.role === "Sniper" || this.role === "Missile Boat") {
                // See if any abilities are IF#
                for (let ability of this.abilities) {
                    if (ability.substring(0,2) === "IF") {
                        IF = true;
                    }
                }
                // Reroll until we get an new random number besides 2,3,4
                if (!IF) {
                    while (index > 1 && index < 5) {
                        index = Math.floor(Math.random() * 8);
                    }
                }
                
            }

            for (let action of CONST_AS_OPFOR_BEHAVIORS) {
                if (action.name === this.behaviors[index]) {
                    this.currentBehavior = action;
                }
            }
        }
    }

    private _getRawNumber( incomingString: string ): number {
        let myString = incomingString.replace(/\D/g,'');
        return +myString / 1;
    }

    private _getRawAlpha( incomingString: string ): string {
        let myString = incomingString.replace(/\d/g,'');
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

        if( this.engineHits > 0 ) {
            return true;
        }

        if( this.fireControlHits > 0 ) {
            return true;
        }

        if( this.mpControlHits > 0 ) {
            return true;
        }

        if( this.weaponHits > 0 ) {
            return true;
        }

        if(
            ( this.type && this.type.trim().toLowerCase() === "sv" )
                ||
            ( this.type && this.type.trim().toLowerCase() === "cv" )
        ) {

            if( this.vehicleMotive910 > 0 ) {
                return true;
            }
            if( this.vehicleMotive11 > 0 ) {
                return true;
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

        for( let point of this.roundArmor ) {
            if (point) {
                return true;
            }
        }
        for( let point of this.roundStructure ) {
            if (point) {
                return true;
            }
        }
        if (this.engineHits !== this.roundEngineHits) {
            return true;
        }
        if (this.fireControlHits !== this.roundFireControlHits) {
            return true;
        }
        if (this.mpControlHits !== this.roundMpControlHits) {
            return true;
        }
        if (this.weaponHits !== this.roundWeaponHits) {
            return true;
        }

        if(
            ( this.type && this.type.trim().toLowerCase() === "sv" )
                ||
            ( this.type && this.type.trim().toLowerCase() === "cv" )
        ) {

            if( this.roundVehicleMotive910 !== this.vehicleMotive910 ) {
                return true;
            }
            if( this.roundVehicleMotive11 !== this.vehicleMotive11 ) {
                return true;
            }

            if( this.roundVehicleMotive12 ) {
                return true;
            }
        }
        return false;
    }

    hasTripeStrengthMyomer(): boolean {
        return this.hasAbility("tsm");
    }

    hasC3(): boolean {
        for( let abi of this.abilities ) {
            if (abi.toLowerCase().trim().indexOf('c3') > -1) {
                return true;
            }
        }
        return false;
    }

    public hasAbility( ability: string ): boolean {
        for( let abi of this.abilities ) {
            if (abi.toLowerCase().trim() === ability.toLowerCase().trim()) {
                return true;
            }
        }
        return false;
    }

    public getAbilityValues = ( ability: string, range: number = 0 ) => {
        let result = {
            damage: -1,
            minimal: false,
        }
        // Find the ability
        for(let abi of this.currentAbilities) {
            if (abi.toLowerCase().indexOf(ability.toLowerCase()) > -1) {
                // This should fix TUR with specials to only return TUR values.
                let abilityString = abi.split(',')[0];
                // Get its value for this range
                let regex = new RegExp(String.raw`((?<=${ability}.*)(\d\*?))`, "gi");
                let matches = abilityString.match(regex);
                if (matches && range < matches.length) {
                    result.minimal = matches[range].indexOf('*') > -1;
                    result.damage = parseInt(matches[range]);
                }
            }
        }

        return result;
    }

    public hasPilotAbility( ability: string ): boolean {
        for( let abi of this.getPilotAbilities()) {
            if( abi && abi.ability.toLowerCase().trim() === ability.toLowerCase().trim()) {
                return true;
            }
        }
        return false;
    }

    public isWrecked(): boolean {
        this.calcCurrentValues();
        return !this.active;
    }

    public reset() {
        this.currentArmor = [];
        this.currentStructure = [];
        this.currentHeat = 0;
        this.engineHits = 0;
        this.fireControlHits = 0;
        this.weaponHits = 0;
        this.mpControlHits = 0;
        this.vehicleMotive910 = 0;
        this.vehicleMotive11 = 0;
        this.vehicleMotive12 = false;
        this.moveToken = {
            move: 0,
            currentMove: 0,
            currentSprint: 0,
            type: '',
            tmm: 0
        };
        this.altitude = 0;
        this.roundArmor = [];
        this.roundStructure = [];
        this.roundHeat = 0;
        this.roundEngineHits = 0;
        this.roundFireControlHits = 0;
        this.roundWeaponHits = 0;
        this.roundMpControlHits = 0;
        this.roundVehicleMotive910 = 0;
        this.roundVehicleMotive11 = 0;
        this.roundVehicleMotive12 = false;
        this.hullDown = false;
        this.currentBehavior = {
            name: "",
            quarry: "",
            movement: "",
            attack: "",
            reroll: false
        };
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

        this.maxWeaponHits = this.damage.short > this.damage.medium ? this.damage.short : this.damage.medium;
        this.maxWeaponHits = this.maxWeaponHits > this.damage.long ? this.maxWeaponHits : this.damage.long;
        this.maxWeaponHits += 1; // For 1 => 0* => 0

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
                pvDifference = 10 + Math.floor( ( this.basePoints - 104) / 10 );
            }
            this.currentPoints = this.basePoints - ( pvDifference * ( this.currentSkill - 4) );
        } else {
            // this.currentSkill = 4;
            this.currentPoints = this.basePoints;
        }

        if( typeof( this.currentArmor ) === "undefined" || this.currentArmor.length === 0 || this.currentArmor.length > this.armor ) {
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

        if( typeof( this.currentStructure ) === "undefined" || this.currentStructure.length === 0 || this.currentStructure.length > this.armor ) {
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

        if( typeof( this.engineHits ) !== "number" ) {
            this.engineHits = 0;
        }

        if( typeof( this.roundEngineHits ) !== "number" ) {
            this.roundEngineHits = this.engineHits;
        }

        if( typeof( this.fireControlHits ) !== "number" ) {
            this.fireControlHits = 0;
        }

        if( typeof( this.roundFireControlHits ) !== "number" ) {
            this.roundFireControlHits = this.fireControlHits;
        }

        if( typeof(this.vehicleMotive910) !== "number" ) {
            this.vehicleMotive910 = 0;
        }

        if( typeof(this.roundVehicleMotive910) !== "number" ) {
            this.roundVehicleMotive910 = this.vehicleMotive910;
        }

        if( typeof(this.vehicleMotive11) !== "number") {
            this.vehicleMotive11 = 0;
        }

        if( typeof(this.roundVehicleMotive11) !== "number" ) {
            this.roundVehicleMotive11 = this.vehicleMotive11;
        }

        if( typeof( this.mpControlHits ) !== "number" ) {
            this.mpControlHits = 0;
        }

        if (this.maxMPHits === 0) {
            if(
                ( this.type && this.type.toLowerCase() === "bm" )
                    ||
                ( this.type && this.type.toLowerCase() === "im" )
            ) {
                let move = this.move[0].move
                for (move; move > 2; move = Math.floor(move / 2)) {
                    this.maxMPHits++;
                }
                if (move <= 2 && move > 0) {
                    this.maxMPHits++;
                }
            }
        }

        if( typeof( this.roundMpControlHits ) !== "number" ) {
            this.roundMpControlHits = 0;
        }

        if( typeof( this.weaponHits ) !== "number" ) {
            this.weaponHits = 0;
        }

        if( typeof( this.roundWeaponHits ) !== "number" ) {
            this.roundWeaponHits = this.weaponHits;
        }

        let currentWeaponHits = this.weaponHits;
        let currentFCHits = this.fireControlHits;
        let currentEngineHits = this.engineHits;

        // Calculate Current Damage Values from Crits...
        this.currentDamage = {
            short: this.damage.short - currentWeaponHits,
            medium: this.damage.medium - currentWeaponHits,
            long: this.damage.long - currentWeaponHits,
            extreme: this.damage.extreme - currentWeaponHits,
            shortMinimal: this.damage.shortMinimal ? true : false,
            mediumMinimal: this.damage.mediumMinimal ? true : false,
            longMinimal: this.damage.longMinimal ? true : false,
            extremeMinimal: this.damage.extremeMinimal ? true : false,
        };

        if( this.currentDamage.short < 0 ) {
            this.currentDamage.short = 0;
            this.currentDamage.shortMinimal = false;
        } else if (this.damage.short > 0 && this.currentDamage.short === 0) {
            this.currentDamage.shortMinimal = true;
        }

        if( this.currentDamage.medium < 0 ) {
            this.currentDamage.medium = 0;
            this.currentDamage.mediumMinimal = false;
        } else if (this.damage.medium > 0 && this.currentDamage.medium === 0) {
            this.currentDamage.mediumMinimal = true;
        }

        if( this.currentDamage.long < 0 ) {
            this.currentDamage.long = 0;
            this.currentDamage.longMinimal = false;
        } else if (this.damage.long > 0 && this.currentDamage.long === 0) {
            this.currentDamage.longMinimal = true;
        }

        if( this.currentDamage.extreme < 0 ) {
            this.currentDamage.extreme = 0;
            this.currentDamage.extremeMinimal = false;
        } else if (this.damage.extreme > 0 && this.currentDamage.extreme === 0) {
            this.currentDamage.extremeMinimal = true;
        }

        this.currentAbilities = this.abilities.map( (abi) => {
            // console.log(abi.split(/\d|\(/));
            
            // Update special results with weapon hits.
            if (this.weaponHits > 0) {
                for(let name of ['flk', 'tur','srm','lrm','if','rear','ht','art','ac','iatm','msl','narc']) {
                    if (abi.toLowerCase().startsWith(name)) {
                        let string = '';
                        let onlyStrings = abi.split(/\d|-/);
                        let values = abi.match(/(\d+|-+)/g);
                        
                        // We've broken the longer string into an array of strings and values, we need to recombine it.
                        if (values && values.length && values.length === onlyStrings.length - 1) {
                            for (let range = 0; range < values.length; range++){
                                let valueNum = parseInt(values[range]) - this.weaponHits;
                                let newValue = '-';
                                if (valueNum > 0) {
                                    newValue = valueNum.toString();
                                } else if (valueNum === 0) {
                                    newValue = '0*';
                                }

                                string += onlyStrings[range] + newValue;
                                if (range === values.length - 1) {
                                    string += valueNum !== 0 ? onlyStrings[range + 1] : '';
                                }
                            }
                            abi = string;
                        }
                    }
                }
            }

            return abi;
        })

        // Consider Speed-Demon from pilot skills
        let speedDemon = false;
        for ( let ability = 0; ability < this._pilot.alphaStrikeAbilities.length; ability++) {
            if (this._pilot.alphaStrikeAbilities[ability] === 46) {
                speedDemon = true;
            }
        }

        if (this.move.length === 1 && this.move[0].type === 'j') {
            let newMove = [{
                move: this.move[0].move,
                type: '',
                currentMove: 0,
                currentSprint: 0,
                tmm: 0,
            }, this.move[0]];
            this.move = newMove;
        }

        let heatValue = this.hasPilotAbility('Hot Dog') && this.currentHeat > 0 ? this.currentHeat - 1 : this.currentHeat;
        this.currentMove = "";
        this.currentMoveHexes = "";
        this.currentTMM = "";

        for( let moveC = 0; moveC < this.move.length; moveC++ ) {
            this.move[moveC].currentMove = this.move[moveC].move;
            if( this.move[moveC].move < 5 ) {
                this.move[moveC].tmm = 0;
            } else if( this.move[moveC].move < 9 ) {
                this.move[moveC].tmm = 1;
            } else if( this.move[moveC].move < 13 ) {
                this.move[moveC].tmm = 2;
            } else if( this.move[moveC].move < 19 ) {
                this.move[moveC].tmm = 3;
            } else if( this.move[moveC].move < 35 ) {
                this.move[moveC].tmm = 4;
            } else {
                this.move[moveC].tmm = 5;
            }

            // Calculate BatteMech MP crit effects
            if(( this.type && this.type.toLowerCase() === "bm" ) || ( this.type && this.type.toLowerCase() === "im" )) {
                for( let count = 0; count < this.mpControlHits; count++ ) {
                    // Reduce movement by half for each hit. We round up the amount we subract to round down the effect.
                    let moveHit = Math.ceil(this.move[moveC].currentMove / 2);
                    // Reduce by minimum 2"
                    if( moveHit < 2 ) {
                        moveHit = 2;
                    }
                    this.move[moveC].currentMove -= moveHit;
                    // Movement can't go below 0
                    if( this.move[moveC].currentMove < 0 ) {
                        this.move[moveC].currentMove = 0;
                    }
                    // Reduce TMM by 1, bottom out at zero
                    this.move[moveC].tmm = this.move[moveC].tmm - 1 > 0 ? this.move[moveC].tmm - 1 : 0;
                }
            } else if (( this.type && this.type.trim().toLowerCase() === "sv" ) || ( this.type && this.type.trim().toLowerCase() === "cv" )) {
                // Vehicle Motive Crit effects
                if (this.engineHits > 0) {
                    this.move[moveC].currentMove = Math.floor( this.move[moveC].currentMove / 2 );
                    this.move[moveC].tmm = Math.floor(this.move[moveC].tmm / 2);
                }

                for( let count = 0; count < this.vehicleMotive11; count++) {
                    let half = Math.floor( this.move[moveC].currentMove / 2 );
                    if( half < 2 ) {
                        half = 2;
                    }
                    this.move[moveC].currentMove -= half;
                    let tmmHalf = Math.floor(this.move[moveC].tmm / 2);
                    if (tmmHalf < 1) {
                        tmmHalf = 1;
                    }
                    this.move[moveC].tmm -= tmmHalf;
                }

                for( let count = 0; count < this.vehicleMotive910; count++) {
                    this.move[moveC].currentMove -= 2;
                    this.move[moveC].tmm -= 1;
                }

                if( this.move[moveC].currentMove < 0 ) {
                    this.move[moveC].currentMove = 0;
                    this.move[moveC].tmm = 0;
                }

                if( this.vehicleMotive12 ) {
                    this.move[moveC].currentMove = 0;
                }
            }


            
            if (this.move[moveC].type !== 'j') {
                // Adjust movement for heat
                this.move[moveC].currentMove -= heatValue*2;
                // Negate heat 1 and add 2" for TSM
                if (this.hasTripeStrengthMyomer() && this.currentHeat > 0) {
                    this.move[moveC].currentMove += 4;
                };
                if (heatValue > 1) {
                    this.move[moveC].tmm -= 1;
                }
                // Calculate Sprint & Speed Demon
                if (this.isGroundUnit()) {
                    this.move[moveC].currentSprint = Math.ceil(this.move[moveC].currentMove*1.5);
                    if (speedDemon && this.move[moveC].currentMove > 0) {
                        this.move[moveC].currentMove += 2;
                        this.move[moveC].currentSprint += 4;
                    }
                }
            }

            // Failsafe to keep at 0
            if( this.move[moveC].currentMove < 0 || heatValue > 3 ) {
                this.move[moveC].currentMove = 0;
                this.move[moveC].tmm = 0;
                this.move[moveC].currentSprint = 0;
            }

            this.immobile = this.move[moveC].currentMove > 0 ? false : true;

            // Update strings for non-play mode
            this.currentMove += this.move[moveC].currentMove.toString() + "\"" + this.move[moveC].type;
            this.currentMoveHexes += ( this.move[moveC].currentMove / 2).toString() + "⬣" + this.move[moveC].type; 
            
            
            if( moveC !== this.move.length - 1 ) {
                this.currentTMM += this.move[moveC].tmm + "/";
                this.currentMove += "/";
                this.currentMoveHexes += "/";
            } else {
                this.currentTMM += this.move[moveC].tmm + this.move[moveC].type;
            }
        }
        
        this.currentMoveSprint = "" + (+this.move[0].currentMove * 1.5 ) + "\"";
        this.currentMoveHexesSprint = "" + ( Math.ceil(( +this.move[0].currentMove / 2) * 1.5) )+ "⬣";



        // Update To-Hit with movement
        let movementToHit = 0;
        // Battle Armor and Infantry are not affected by attacker movement modifiers. AS:CE pg 42.
        if (this.type && this.type.toLowerCase() !== "ba" && this.type.toLowerCase() !== "ci") {
            if (this.moveToken.type.toLowerCase() === "standstill" || this.moveToken.type.toLowerCase() === 'hull down') {
                movementToHit = -1;
            } else if (this.moveToken.type === "jump" || this.moveToken.type === 'dfa') {
                movementToHit = 2;
                for ( let ability = 0; ability < this._pilot.alphaStrikeAbilities.length; ability++) {
                    if (this._pilot.alphaStrikeAbilities[ability] === 26) {
                        movementToHit = 1;
                    }
                }
            }
        }

        // Calculate To-Hits with Criticals
        this.currentToHitShort = this.currentSkill + heatValue + currentFCHits * 2 + movementToHit; // + currentEngineHits;
        this.currentToHitMedium = this.currentSkill + 2 + heatValue + currentFCHits * 2 + movementToHit; // + currentEngineHits;
        this.currentToHitLong = this.currentSkill + 4 + heatValue + currentFCHits * 2 + movementToHit; // + currentEngineHits;
        this.currentToHitExtreme = this.currentSkill + 6 + heatValue + currentFCHits * 2 + movementToHit; // + currentEngineHits;

        if( currentEngineHits > 1 || this.getCurrentStructure() < 1) {
            this.active = false;
        } else {
            this.active = true;
        }

        // Here we do the attacks!
        this.attacks = [];
            if (this.hasAbility('AM')) {
                this.attacks.push(
                    {
                        name: 'AM',
                        type: 'physical',
                        damage: this.damage.short,
                        minimal: this.damage.shortMinimal ? true : false,
                        toHit: this.getCurrentToHit(0, 'physical'),
                        range: 0,
                        disabled: this.moveToken.type !== 'ground' && this.moveToken.type !== 'standstill' && this.moveToken.type !== 'jump',
                    }
                );
            } 
            if (this.type.toLowerCase() === 'bm' || this.type.toLowerCase() === 'pm' || this.type.toLowerCase() === 'im') {
                let name = 'Normal';
                let damage = this.size;
                if (this.hasAbility('MEL')) {
                    name = 'Melee';
                    damage += 1;
                }
                if (this.hasAbility('I-TSM') || this.hasAbility('TSMX')) {
                    damage += 1;
                }
                if (this.hasAbility('TSM') && this.currentHeat > 0) {
                    damage += 1;
                }
                if (this.hasPilotAbility('Fist Fire')) {
                    damage += Math.ceil(this.damage.short/2);
                }
                if (this.hasPilotAbility('Zweihander')) {
                    damage += 1;
                }
                if (this.hasPilotAbility('Melee Master')) {
                    damage += 1;
                }
                let disabled = this.moveToken.type !== 'ground' && this.moveToken.type !== 'standstill' && this.moveToken.type !== 'jump';
                disabled = this.immobile ? this.currentHeat > 3 : disabled;
                this.attacks.push(
                    {
                        name: name,
                        type: 'physical',
                        damage: damage,
                        minimal: false,
                        toHit: this.getCurrentToHit(0, 'physical'),
                        range: 0,
                        disabled: disabled,
                    }
                );
            }
            // Add Specials for BattleMechs and Vehicles
            if (this.isGroundUnit() && this.type.toLowerCase() !== 'pm' && !this.isInfantry) {
                for (let move of this.move) {
                    if (move.currentMove > 0 && move.type !== 'v') {
                        let damage = this.size + Math.floor(move.tmm/2);
                        let name = 'Charge';
                        let disabled =  this.moveToken.type.toLowerCase() !== 'charge';

                        if (move.type === 'j') {
                            damage += 1;
                            damage = this.hasAbility("JMPS2") ? damage + 1 : damage;
                            damage = this.hasAbility("JMPW2") ? damage - 1 : damage;
                            name = 'Death from Above';
                            disabled = this.moveToken.type.toLowerCase() !== 'dfa';
                        }
                        if (this.hasPilotAbility('Melee Master')) {
                            damage += 1;
                        }

                        this.attacks.push({
                            name: name,
                            type: 'physical',
                            damage: damage,
                            minimal: false,
                            toHit: this.getCurrentToHit(0, name),
                            range: 0,
                            disabled: disabled,
                        });
                    }
                }
            }
            let damage = this.getCurrentDamage(0);
            this.attacks.push({
                name: 'Short',
                type: 'weapon',
                damage: damage.value,
                minimal: damage.minimal,
                toHit: this.getCurrentToHit(0),
                range: 0,
                disabled: damage.disabled,
            });
            damage = this.getCurrentDamage(1);
            this.attacks.push({
                name: 'Medium',
                type: 'weapon',
                damage: damage.value,
                minimal: damage.minimal,
                toHit: this.getCurrentToHit(1),
                range: 1,
                disabled: damage.disabled,
            });
            damage = this.getCurrentDamage(2);
            this.attacks.push({
                name: this.getAbilityValues('ART').damage > -1 ? 'L / ART' : 'Long',
                type: 'weapon',
                damage: damage.value,
                minimal: damage.minimal,
                toHit: this.getCurrentToHit(2),
                range: 2,
                disabled: damage.disabled,
            });
            damage = this.getCurrentDamage(3);
            this.attacks.push({
                name: 'Extreme',
                type: 'weapon',
                damage: damage.value,
                minimal: damage.minimal,
                toHit: this.getCurrentToHit(3),
                range: 3,
                disabled: damage.disabled,
        });

        if (this.getAbilityValues('BOMB').damage > -1) {
            this.attacks.push({
                name: 'Dive Bomb',
                type: 'bomb',
                damage: this.getAbilityValues('BOMB').damage,
                minimal: false,
                toHit: this.getCurrentToHit(this.getHeightRange(this.moveToken.type), 'bomb'),
                range: 1,
                disabled: this.getHeightRange(this.moveToken.type) > 1 || this.moveToken.type === '',
            });
            this.attacks.push({
                name: 'Altitude Bomb',
                type: 'bomb',
                damage: this.getAbilityValues('BOMB').damage,
                minimal: false,
                toHit: this.getCurrentToHit(this.getHeightRange(this.moveToken.type), 'bomb'),
                range: 2,
                disabled: this.getHeightRange(this.moveToken.type) < 2 || this.moveToken.type === '',
            });
        }
    }
    /**
    * Returns a boolean if the unit is a ground unit. This is used for
    * calculating whether or not the unit can sprint
    *
    * @beta
    */
    public isGroundUnit(): boolean {
        if(
            this.type === "AF"
            ||
            this.type === "DA"
            ||
            this.type === "DS"
            ||
            this.type === "SC"
        ) {
            return false;
        }
        for( let moveC = 0; moveC < this.move.length; moveC++  ){
            if(this.move[moveC].type.toLowerCase() === "v" ) {
                return false;
            }
        }
        return true;
    }

    public getTMM(): string {
        let tmm = ''
        for (let moveC = 0; moveC < this.move.length; moveC++) {
            tmm += this.move[moveC].tmm + this.move[moveC].type;
            tmm = moveC < this.move.length -1 ? tmm + '/' : tmm;
        }
        return tmm;
    }

    public getSpecialAbility( tag: string ): IASSpecialAbility | null {
        if( this.abilities ) {
            for( let def of CONST_AS_SPECIAL_ABILITIES ) {
                if( tag.toLowerCase().trim() === def.tag.toLowerCase().trim() ) {
                    let newDef = JSON.parse(JSON.stringify(def));
                    newDef.rawTag = tag;
                    return newDef;
                }
                if(def.tag.indexOf("%") > 0) {
                    let baseTag = def.tag.substring(0, def.tag.indexOf("%") ).toLowerCase();

                    if( tag.toLowerCase().startsWith(baseTag) ) {
                        let newDef = JSON.parse(JSON.stringify(def));
                        newDef.rawTag = tag;
                        return newDef;
                    }
                }
                if(def.tag.indexOf("#") > 0) {
                    let baseTag = def.tag.substring(0, def.tag.indexOf("#") ).toLowerCase();
                    if( tag.toLowerCase().startsWith(baseTag) ) {
                        let tmp = tag.toLowerCase().replace(baseTag, "");
                        if( tmp.length > 0 ) {
                            // The special needs to start with a number, or with - after weapon crits reduce it to 0.
                            if( !Number.isNaN(Number(tmp[0]) || tmp.startsWith('-') ) ) {
                                let newDef = JSON.parse(JSON.stringify(def));
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
        this.currentHeat = newHeatValue;
        this.roundHeat = newHeatValue;
    }

    public applyRound() {
        if (this.roundHeat === -1) {
            this.currentHeat = 0;
            this.roundHeat = 0;
        } else if (this.roundHeat !== this.currentHeat) {
            this.currentHeat = this.roundHeat;
        }

        for(let pointIndex = 0; pointIndex < this.roundArmor.length; pointIndex++) {
            if (this.roundArmor[pointIndex]) {
                this.currentArmor[pointIndex] = !this.currentArmor[pointIndex];
                this.roundArmor[pointIndex] = false;
            }
        }
        for(let pointIndex = 0; pointIndex < this.roundStructure.length; pointIndex++) {
            if (this.roundStructure[pointIndex]) {
                this.currentStructure[pointIndex] = !this.currentStructure[pointIndex];
                this.roundStructure[pointIndex] = false;
            }
        }
        this.engineHits = this.roundEngineHits;
        this.fireControlHits = this.roundFireControlHits;
        this.mpControlHits = this.roundMpControlHits;
        this.weaponHits = this.roundWeaponHits;

        this.vehicleMotive910 = this.roundVehicleMotive910;
        this.vehicleMotive11 = this.roundVehicleMotive11;
        this.vehicleMotive12 = this.roundVehicleMotive12

        // Set the unit to hull down, so next round if it is still hull down it gets the -1 toHit modifier
        if (this.moveToken.type === 'hull down') {
            this.hullDown = true;
        } else {
            this.hullDown = false;
        }

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

        return structPoints;
    }

    public getHeightRange = ( height: string = 'low' ) => {
        let range = 0;
        switch (height) {
            case 'low':
                break;
            case 'middle':
                range = 1;
                break;
            case 'high':
                range = 2;
                break;
            case 'extreme':
                range = 3;
                break;
        }

        return range;
    }

    public getCurrentDamage( range: number = 0 ) {
        let rangeString = 'short';
        switch (range) {
            case 0:
                rangeString = 'short';
                break;
            case 1:
                rangeString = 'medium';
                break;
            case 2: 
                rangeString = 'long';
                break;
            case 3:
                rangeString = 'extreme';
                break;
        }
        
        let damage = {
            // @ts-ignore
            value: this.damage[rangeString] ? this.damage[rangeString] : 0,
            // @ts-ignore
            minimal: this.damage[rangeString+'Minimal'] ? true : false,
            disabled: false,
        }

        // Reduce from weapon hits
        damage.value -= this.weaponHits;

        // Reduce vehicle damage from Engine hits
        if ((this.type.toLowerCase() === 'cv' || this.type.toLowerCase() === 'sv') && this.engineHits) {
            for (let hits = 0; hits < this.engineHits; hits++) {
                damage.value = damage.value/2;
            }
            damage.value = Math.floor(damage.value);
        }

        // Adjust for hull-down
        if (this.moveToken.type === 'hull down') {
            if (this.type.toLowerCase() === 'cv' || this.type.toLowerCase() === 'sv') {
                damage.value = -1; // This will eval to 0, no minimal
            } else if(this.type.toLowerCase() === 'bm' || this.type.toLowerCase() === 'im') {
                // Reduce by 1, but not below 0*
                damage.value = damage.value - 1;
                if (damage.value < 1) {
                    damage.value = 0;
                    damage.minimal = true;
                }
            } else {
                // Half damage, rounded down
                damage.value = Math.floor(damage.value);
            }
            // Check to see if turret is better, and use that instead
            let turret = this.getAbilityValues('TUR', range);
            if (turret.damage > damage.value || (turret.minimal === true && damage.minimal === false)) {
                damage.value = turret.damage;
                damage.minimal = turret.minimal;
            }
        }

        // Sandblaster SPA check
        if (this.hasPilotAbility('Sandblaster')) {
            for(let SPA of ['AC', 'FLK', 'IATM', 'LRM', 'SRM', 'TOR']) {
                if (this.getAbilityValues(SPA, range).damage > -1) {
                    damage.value += range === 0 ? 2 : 1;
                }
            }
        }

        // SPA adjustments based on movement
        if (this.moveToken.type === 'standstill' || this.moveToken.type === 'hull down') {
            // Cluster Hitter SPA check
            if (this.hasPilotAbility('Cluster Hitter')) {
                for(let SPA of ['FLK', 'LRM', 'SRM']) {
                    if (this.getAbilityValues(SPA, range).damage > -1) {
                        damage.value += 1;
                    }
                }
            }

            // Half damage for unit with Marksman SPA that did not move
            if (this.hasPilotAbility('Marksman')) {
                damage.value = Math.floor(damage.value/2);
                damage.value = damage.value < 1 ? 1 : damage.value;
            }
        }
        
        // Check for minimal damage
        if( damage.value < 0 ) {
            damage.value = 0;
            damage.minimal = false;
            // @ts-ignore
        } else if (this.damage['range'] > 0 && damage.value === 0) {
            damage.minimal = true;
        }

        if(this.moveToken.type === 'sprint' || this.moveToken.type === 'charge' || this.moveToken.type === 'dfa') {
            damage.disabled = true;
        }
        if (!this.immobile && this.moveToken.type === '') {
            damage.disabled = true;
        }
        if (damage.value < 1 && !damage.minimal) {
            if (range === 2 && this.getAbilityValues('ART').damage > 0) {

            } else {
                damage.disabled = true;
            }
        }
        if (this.currentHeat > 3) {
            damage.disabled = true;
        }

        return damage;
    }

    public getCurrentToHit( range: number = 0, type: string = 'weapon' ) {
        let toHit = this.currentSkill;

        // Check Attacker Movement
        if (!this.isInfantry) {
            if (this.moveToken.type === "standstill" || this.immobile || (this.hullDown && this.moveToken.type === 'hull down')) {
                toHit -= 1;
            } else if (this.moveToken.type === "jump" || this.moveToken.type === 'dfa') {
                toHit += this.hasPilotAbility('Jumping Jack') ? 1 : 2;
            }
        }

        // Weapon Attack Type
        // -- Industrial Mech with no AFC
        if (this.type.toLowerCase() === 'im' && !this.hasAbility('AFC')) {
            toHit += 1;
        }
        // -- Support Vehicle with BFC or AFC
        if (this.type.toLowerCase() === 'sv' && !this.hasAbility('AFC')) {
            if (this.hasAbility('BFC')) {
                toHit += 1;
            } else {
                toHit += 2;
            }
        }
        // -- Grounded Dropship

        // -- Unit has SHLD and is a weapon attack
        if (this.hasAbility('SHLD') && type === 'weapon') {
            toHit += 1;
        }
        
        let heatValue = this.hasPilotAbility('Hot Dog') && this.currentHeat > 0 ? this.currentHeat - 1 : this.currentHeat;
        if (type !== 'physical') {
            // -- Fire Control Hits
            toHit += this.fireControlHits*2;
            // -- Heat
            toHit += heatValue;

            // Golden Goose reduces toHit for bombs
            if (type.toLowerCase() === 'bomb' && this.hasPilotAbility('Golden Goose')) {
                toHit += -2;
            }

        } else {
            // -- Charge or DFA
            if (type.toLowerCase() === 'charge' || type.toLowerCase() === 'death from above') {
                toHit += 1;
            } 
            // Physical normal or MEL
            else {
                if(this.hasAbility('I-TSM')) {
                    toHit += 2;
                }
            }
            if (this.hasPilotAbility('Melee Specialist')) {
                toHit += -1;
            }
            // -- AM attack
            if (this.isInfantry && this.hasAbility('AM')) {
                toHit += this.type.toLowerCase() === 'ci' ? 3 : 1;
            }
        }

        // Adjust for Range Master
        if (this.hasPilotAbility('Range Master (M)')) {
            if (range === 0) {
                toHit += 2;
            } else if (range === 1) {
                toHit += -2;
            }
        } else if (this.hasPilotAbility('Range Master (L)')) {
            if (range === 0) {
                toHit += 2;
            } else if (range === 2) {
                toHit += -2;
            }
        } else if (this.hasPilotAbility('Range Master (E)')) {
            if (range === 0) {
                toHit += 2;
            } else if (range === 3) {
                toHit += -2;
            }
        }

        // Add Range
        let rangeMod = 2;
        if (this.hasPilotAbility('Sniper')) {
            rangeMod = 1;
        }
        toHit += rangeMod*range;

        return toHit;
    }

    public setArmor( nv: number ) {
        this.armor = nv;
    }
    public setStructure( nv: number ) {
        this.armor = nv;
    }

    public export(
        noInPlayVariables: boolean = false,
    ): IAlphaStrikeUnitExport {
        // In Play Variables

        let _currentArmor: boolean[] = [];
        let _currentStructure: boolean[] = [];
        let _engineHits: number = 0;
        let _fireControlHits: number = 0;
        let _mpControlHits: number = 0;
        let _weaponHits: number = 0;

        let _vehicleMotive910: number = 0;
        let _vehicleMotive11: number = 0;
        let _vehicleMotive12: boolean = false;

        let _currentHeat = 0;

        let _roundArmor: boolean[] = [];
        let _roundStructure: boolean[] = [];
        let _roundEngineHits: number = 0;
        let _roundFireControlHits: number = 0;
        let _roundMpControlHits: number = 0;
        let _roundWeaponHits: number = 0;
        let _roundVehicleMotive910: number = 0;
        let _roundVehicleMotive11: number = 0;
        let _roundVehicleMotive12: boolean = false;
        let _roundHeat = 0;
        let _hullDown = false;

        let _behavior: OpForBehavior = {
            name: "",
            quarry: "",
            movement: "",
            attack: "",
            reroll: false
        };

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
            _hullDown = this.hullDown;
            _behavior = this.currentBehavior;
        }

        let rv:  IAlphaStrikeUnitExport = {
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
            hullDown: _hullDown,
            currentBehavior: _behavior,
            classification:  this.classification,
            class:  this.class?? "",
            costCR:  this.costCR,
            mulID:  this.mulID,
            currentHeat:  _currentHeat,
            damage:  this.damage,
            variant:  this.variant,
            dateIntroduced:  this.dateIntroduced,
            name:  this.name,
            tmm:  this.tmm,
            tonnage:  this.tonnage,
            tro:  this.tro,
            role:  this.role,
            threshold:  this.threshold,
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
            moveToken: this.moveToken,
            altitude: this.altitude,
        };

        return rv;
    }

    export2(): IAlphaStrikeExport {
        let rv: IAlphaStrikeExport = {
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

    calc(): string {

        let _calcLogAS = "";

        /* *********************************
         *
         * Alpha Strike Point Value ASC - p138
         *
         * ******************************** */

        this.basePoints = 0;
        _calcLogAS += "<div class=\"text-center\"><strong> - Calculating Point Value - </strong></div>\n";
        /* *********************************
         * Step 1: Determine Unit’s Offensive Value ASC - p138
         * ******************************** */

        _calcLogAS += "<strong>Step 1: Determine Unit’s Offensive Value ASC - p138</strong><br />\n";
        let offensive_value = 0;
        // Attack Damage Factor
        offensive_value += this.damage.short;
        offensive_value += this.damage.medium;
        offensive_value += this.damage.medium;
        offensive_value += this.damage.long;
        offensive_value += this.damage.extreme;

        _calcLogAS += "Attack Damage Factor: "
        + offensive_value.toString() + " ( "
        + this.damage.short.toString() + " + "
        + this.damage.medium.toString() + " + "
         + this.damage.long.toString() + " + "
         + this.damage.medium.toString() + " + "
         + this.damage.extreme.toString()
        + " )<br />\n";

        // Unit Size Factor
        if(
            this.type.toLowerCase().trim() === "bm"
            ||
            this.type.toLowerCase().trim() === "pm"
        )  {
            offensive_value += this.size / 2;
            _calcLogAS += "Unit Size Factor: " + (this.size / 2) + " ( " + this.size + " / 2)<br />\n";
        }

        // Overheat Factor
        let overHeatFactor = 0;
        if( this.overheat > 1) {
            offensive_value += 1;
            offensive_value += (this.overheat - 1) / 2;
            overHeatFactor += 1;
            overHeatFactor += (this.overheat - 1) / 2;
        } else {
            offensive_value += this.overheat;
            overHeatFactor += this.overheat;

        }

        _calcLogAS += "Overheat Factor: " + overHeatFactor + "<br />\n";

        /* *********************************
         * Step 1a: Apply Blanket Offensive Modifiers ASC - p139
         * ******************************** */
        _calcLogAS += "<strong>Step 1a: Apply Blanket Offensive Modifiers ASC - p139</strong><br />\n";
        // TODO

        /* *********************************
         * Step 2: Determine Unit’s Defensive Value ASC - p139
         * ******************************** */
        _calcLogAS += "<strong>Step 2: Determine Unit’s Defensive Value ASC - p139</strong><br />\n";
        // let movementFactor = 0;

        let _groundMove = 0;
        for( let move of this.move ) {
            if( move.type === "g" ) {
                _groundMove = move.move;
            }
        }

        // Movement Factor:
        let movementDefenseValue = 0;
        let bestMovement = 0;
        if( _groundMove > this.jumpMove) {
            movementDefenseValue += _groundMove * .25;
            bestMovement = _groundMove;
        } else {
            movementDefenseValue += this.jumpMove * .25;
            bestMovement = _groundMove;
        }

        if( this.jumpMove > 0) {
            movementDefenseValue += .5;
            _calcLogAS += "Movement Factor: " + movementDefenseValue + " ( " + bestMovement + " * .25 + .5)<br />\n";
        } else {
            _calcLogAS += "Movement Factor: " + movementDefenseValue + " ( " + bestMovement + " * .25)<br />\n";
        }

        // if (
        //     +rearDamage.short > 0 ||
        //     +rearDamage.medium > 0 ||
        //     +rearDamage.long > 0
        // ) {
        //     this.abilityCodes.push( "Rear" );
        // }

        // let highestDamage = 0;

        for (let aC = 0; aC < this.abilities.length; aC++) {

        //     // Replace Heat with Heat X/X/X
        //     if( this.abilityCodes[aC].toLowerCase() === "heat" ) {
        //         heatDamage = adjustAlphaStrikeDamage(heatDamage);
        //         this.abilityCodes[aC] = "Heat " + heatDamage.short + "/" + heatDamage.medium + "/" + heatDamage.long;
        //         highestDamage = getHighestDamage(heatDamage);
        //         offensive_value += highestDamage;
        //         if (heatDamage.medium.toString() !== "-" && +heatDamage.medium > 0)
        //             offensive_value += .5;

        //         _calcLogAS += "<strong>Adding</strong> Heat Ability: " + heatDamage.short + "/" + heatDamage.medium + "/" + heatDamage.long + "<br />\n";
        //         _calcLogAS += "Adding Heat Damage Factor to PV: " + highestDamage + "<br />\n";
        //         if (heatDamage.medium.toString() !== "-" && +heatDamage.medium > 0)
        //             _calcLogAS += "Adding Heat Medium Damage Bonus to PV: 0,5<br />\n";
        //     }

        //     // Replace LRM with LRM X/X/X
        //     if( this.abilityCodes[aC].toLowerCase() === "lrm" ) {
        //         lrmDamage = adjustAlphaStrikeDamage(lrmDamage);
        //         this.abilityCodes[aC] = "LRM " + lrmDamage.short + "/" + lrmDamage.medium + "/" + lrmDamage.long;
        //         _calcLogAS += "<strong>Adding</strong> LRM Ability: " + lrmDamage.short + "/" + lrmDamage.medium + "/" + lrmDamage.long + "<br />\n";

        //     }

        //     // Replace Flak with Flak X/X/X
        //     if( this.abilityCodes[aC].toLowerCase() === "flak" ) {
        //         flakDamage = adjustAlphaStrikeDamage(flakDamage);
        //         this.abilityCodes[aC] = "Flak " + flakDamage.short + "/" + flakDamage.medium + "/" + flakDamage.long;
        //         _calcLogAS += "<strong>Adding</strong> Flak Ability: " + flakDamage.short + "/" + flakDamage.medium + "/" + flakDamage.long + "<br />\n";
        //     }

        //     // Replace AC with AC X/X/X
        //     if( this.abilityCodes[aC].toLowerCase() === "ac" ) {
        //         acDamage = adjustAlphaStrikeDamage(acDamage);
        //         this.abilityCodes[aC] = "AC " + acDamage.short + "/" + acDamage.medium + "/" + acDamage.long;
        //         _calcLogAS += "<strong>Adding</strong> AC Ability: " + acDamage.short + "/" + acDamage.medium + "/" + acDamage.long + "<br />\n";
        //     }

        //     // Replace SRM with SRM X/X/X
        //     if( this.abilityCodes[aC].toLowerCase() === "srm" ) {
        //         srmDamage = adjustAlphaStrikeDamage(srmDamage);
        //         this.abilityCodes[aC] = "SRM " + srmDamage.short + "/" + srmDamage.medium + "/" + srmDamage.long;
        //         _calcLogAS += "<strong>Adding</strong> SRM Ability: " + srmDamage.short + "/" + srmDamage.medium + "/" + srmDamage.long + "<br />\n";
        //     }

        //     // Replace Missile with Missile X/X/X
        //     if( this.abilityCodes[aC].toLowerCase() === "missile" || this.abilityCodes[aC].toLowerCase() === "msl" ) {
        //         mslDamage = adjustAlphaStrikeDamage(mslDamage);
        //         this.abilityCodes[aC] = "MSL " + mslDamage.short + "/" + mslDamage.medium + "/" + mslDamage.long;
        //         _calcLogAS += "<strong>Adding</strong> Missile Ability: " + mslDamage.short + "/" + mslDamage.medium + "/" + mslDamage.long + "<br />\n";
        //     }

        //     // Replace Rear with Rear X/X/X
        //     if( this.abilityCodes[aC].toLowerCase() === "rear" ) {
        //         rearDamage = adjustAlphaStrikeDamage(rearDamage);
        //         this.abilityCodes[aC] = "Rear " + rearDamage.short + "/" + rearDamage.medium + "/" + rearDamage.long;
        //         _calcLogAS += "<strong>Adding</strong> Rear Ability: " + rearDamage.short + "/" + rearDamage.medium + "/" + rearDamage.long + "<br />\n";
        //     }

        //     // Replace IndirectFire with IF X
        //     if(
        //         this.abilityCodes[aC].toLowerCase() === "indirect fire"
        //         ||
        //         this.abilityCodes[aC].toLowerCase() === "if"
        //     ) {
        //         rearDamage = adjustAlphaStrikeDamage(rearDamage);
        //         this.abilityCodes[aC] = "IF " + indirectFireRating;
        //         _calcLogAS += "<strong>Adding</strong> IF Ability: " + indirectFireRating + "<br />\n";
        //         offensive_value += indirectFireRating;
        //         _calcLogAS += "Adding IF Rating to PV: " + indirectFireRating + "<br />\n";

        //     }

        }

        // Defensive Special Abilities Factor
        // TODO

        // Defensive Interaction Rating
        // TODO

        /* *********************************
         * Step 2a: Calculating Defensive Interaction Rating (DIR) ASC - p141
         * ******************************* */
        _calcLogAS += "<strong>Step 2a: Calculating Defensive Interaction Rating (DIR) ASC - p141</strong><br />\n";
        let bmDIR = 0;
        // Armor Factor
        if( this.type.toLowerCase().trim() === "bm") {
            _calcLogAS += "Armor Factor: " + (this.armor * 2) + " ( " + this.armor + " * 2)<br />\n";
            bmDIR += this.armor * 2;
        }
        // TODO other types of units

        // Structure Factor
        if( this.type.toLowerCase().trim() === "bm") {
            _calcLogAS += "Structure Factor: " + (this.structure * 1) + " ( " + this.structure + " * 1)<br />\n";
            bmDIR += this.structure * 1;
        }
        // TODO other types of units

        // Defense Factor
        let defensiveFactor = 0;
        if (bestMovement > 34) {
            _calcLogAS += "Base Defense Factor: +5 (movement 35\"+)<br />\n";
            defensiveFactor += 5;
        } else if (bestMovement > 18) {
            _calcLogAS += "Base Defense Factor: +4 (movement 19\"-34\")<br />\n";
            defensiveFactor += 4;
        } else if (bestMovement > 12) {
            _calcLogAS += "Base Defense Factor: +3 (movement 13\"-18\")<br />\n";
            defensiveFactor += 3;
        } else if (bestMovement > 8) {
            _calcLogAS += "Base Defense Factor: +2 (movement 9\"-12\")<br />\n";
            defensiveFactor += 2;
        } else if (bestMovement > 4) {
            _calcLogAS += "Base Defense Factor: +1 (movement 4\"-8\")<br />\n";
            defensiveFactor += 1;
        } else {
            _calcLogAS += "Base Defense Factor: +0 (movement 0\"-4\")<br />\n";
            defensiveFactor += 0;
        }


        if( defensiveFactor < 0 )
        defensiveFactor = 0;
        bmDIR += defensiveFactor;
        _calcLogAS += "Adding Defense Value from Step 2 above: " + (defensiveFactor) + "<br />\n";
        // Calculate the DIR
        _calcLogAS += "Total DIR: " + bmDIR + "<br />\n";

        /* *********************************
         * Step 3: Determine Unit’s Final Point Value ASC - p141
         * ******************************* */
        _calcLogAS += "<strong>Step 3: Determine Unit’s Final Point Value ASC - p141</strong><br />\n";
        let baseFinalValue = offensive_value + bmDIR + movementDefenseValue;
        _calcLogAS += "Base Point Value: " + baseFinalValue + " ( " + offensive_value + " + " + bmDIR + " + "  + movementDefenseValue + ")<br />\n";

        let finalValue = baseFinalValue;
        if (
            bestMovement >= 6 &&
            bestMovement <= 10 &&
            +this.damage.medium === 0 &&
            +this.damage.long === 0 &&
            +this.damage.extreme === 0
        ) {
            _calcLogAS += "Unit has 6 to 10\" of Move, but only delivers damage at Short range. Point Value * .75<br />\n";
            _calcLogAS += "Modified Point Value: " + (baseFinalValue * .75) + " ( " + offensive_value + " + " + bmDIR + " )<br />\n";
            finalValue = baseFinalValue * .75;
        }

        if (
            bestMovement >= 2 &&
            bestMovement <= 5 &&
            +this.damage.medium === 0 &&
            +this.damage.long === 0 &&
            +this.damage.extreme === 0
        ) {
            _calcLogAS += "Unit has 2 to 5\" of Move, but only delivers damage at Short range. Point Value * .5<br />\n";
            _calcLogAS += "Modified Point Value: " + (baseFinalValue * .5) + " ( " + offensive_value + " + " + bmDIR + " )<br />\n";
            finalValue = baseFinalValue * .5;
        }

        if (
            bestMovement >= 2 &&
            bestMovement <= 5 &&
            +this.damage.long === 0 &&
            +this.damage.extreme === 0
        ) {
            _calcLogAS += "Unit has 2 to 5\" of Move, but only delivers damage at Short and Medium ranges. Point Value * .75<br />\n";
            _calcLogAS += "Modified Point Value: " + (baseFinalValue * .75) + " ( " + offensive_value + " + " + bmDIR + " )<br />\n";
            finalValue = baseFinalValue * .75;
        }


        finalValue = Math.round(finalValue);

        _calcLogAS += "Final Point Value: " + finalValue + "<br />\n";

        /* *********************************
         * Step 3a: Add Force Bonuses ASC - p141
         * ******************************* */
        _calcLogAS += "<strong>Step 3a: Add Force Bonuses ASC - p141</strong><br />\n";
        // TODO
        _calcLogAS += "<strong class=\"color-red\">TODO<br />\n";

        this.basePoints = finalValue;

        this.calcCurrentValues();
        return _calcLogAS;
    }
}