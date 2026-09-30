import {
    acesCrewTable,
    acesDifficultyLevels,
    acesExistingForceBrackets,
    acesPilotEdgeAbilityThresholds,
    acesPilotEdgeTokenThresholds,
    acesPilotSkillThresholds,
    acesRepairMultipliers,
    acesSalvageTargets,
    ACES_ADVANCED_FORCE_TYPES,
    ACES_EXISTING_FORCE_MIN_WARCHEST,
    ACES_MAX_MECHS_PER_CHASSIS,
    ACES_MAX_NAMED_PILOTS,
    ACES_MAX_OTHER_PER_VARIANT,
    ACES_MIN_NAMED_PILOTS,
    ACES_MIN_UNITS,
    ACES_MVP_BONUS,
    ACES_NAMED_PILOT_STARTING_SP,
    ACES_NEW_NAMED_PILOT_COST,
    ACES_OMNI_RECONFIGURE_PV_MULTIPLIER,
    ACES_OMNI_RECONFIGURE_SIZE_MULTIPLIER,
    ACES_PURCHASE_SP_PER_PV,
    ACES_REARM_COST_PER_UNIT,
    ACES_SELL_SP_PER_PV,
    ACES_STARTING_PV,
    ACES_UNSPENT_PV_TO_SP,
    ACES_WOUNDED_CREW_COST,
    IAcesDifficultyLevel,
    IAcesPilotThreshold,
    lookupAcesTable,
    TAcesCrewResult,
    TAcesRepairCategory,
} from "../data/aces-rules";
import { generateUUID } from "../utils/generateUUID";

/*
 * BattleTech: Aces campaign bookkeeping (Aces pp.26-37): force creation, Named Pilots, difficulty, the
 * after-sortie steps and the campaign log. The sortie stories, objectives and rewards come from the players' own
 * Campaign Book; the players type in the SP values it lists.
 */

/* ---------------------------------------------------------------------------------------------------------------
 * Difficulty (Aces pp.28-29)
 * ------------------------------------------------------------------------------------------------------------- */

export const getAcesDifficulty = ( id: string ): IAcesDifficultyLevel => {
    return acesDifficultyLevels.find( ( level ) => level.id === id ) || acesDifficultyLevels[1];
}

export const getAcesExistingForcePVModifier = ( totalNamedPilotSP: number ): number => {
    for( const bracket of acesExistingForceBrackets ) {
        if( totalNamedPilotSP >= bracket.minSP && ( bracket.maxSP === null || totalNamedPilotSP <= bracket.maxSP ) ) {
            return bracket.pvModifier;
        }
    }
    return 0;
}

/**
 * Player force PV percentage for each sortie: the difficulty and existing-force modifiers are added together
 * before multiplying (Aces p.29: Rookie +20% and 3,500 SP -10% make 110%).
 */
export const getAcesPlayerForcePVPercent = (
    difficultyId: string,
    existingForce: boolean,
    totalNamedPilotSP: number,
): number => {
    let percent = 100 + getAcesDifficulty( difficultyId ).pvModifier;
    if( existingForce ) {
        percent += getAcesExistingForcePVModifier( totalNamedPilotSP );
    }
    return percent;
}

export const getAcesSortiePVLimit = ( listedPV: number, pvPercent: number ): number => {
    return listedPV * pvPercent / 100;
}

/* ---------------------------------------------------------------------------------------------------------------
 * Force creation (Aces pp.26, 29, 31, 36)
 * ------------------------------------------------------------------------------------------------------------- */

export interface IAcesRosterUnit {
    id: string;
    /** Chassis (the MUL class), e.g. "Warhammer". */
    chassis: string;
    /** Variant, e.g. "WHM-6R". */
    variant: string;
    /** Display name. */
    name: string;
    /** Alpha Strike type: BM, CV, BA, CI ... */
    type: string;
    size: number;
    /** PV at Skill 4. */
    pv: number;
    omni: boolean;
    enhancedNoAmmo: boolean;
    status: "active" | "truly-destroyed" | "sold";
    mulID: number;
    notes: string;
}

export interface IAcesForceIssue {
    severity: "error" | "warning";
    message: string;
}

/** Checks a starting force (Aces p.26). Advanced mode adds the unit type and duplicate limits. */
export const validateAcesStartingForce = (
    units: IAcesRosterUnit[],
    advanced: boolean,
    budget: number = ACES_STARTING_PV,
): IAcesForceIssue[] => {
    const issues: IAcesForceIssue[] = [];
    const active = units.filter( ( unit ) => unit.status === "active" );
    const totalPV = active.reduce( ( total, unit ) => total + unit.pv, 0 );

    if( active.length < ACES_MIN_UNITS ) {
        issues.push( { severity: "error", message: "The force needs at least " + ACES_MIN_UNITS + " units (" + active.length + " now)." } );
    }
    if( totalPV > budget ) {
        issues.push( { severity: "error", message: "The force is " + totalPV + " PV, over the " + budget + " PV budget." } );
    }

    if( advanced ) {
        const mechsByChassis: { [chassis: string]: string[] } = {};
        const othersByVariant: { [key: string]: number } = {};
        for( const unit of active ) {
            const type = unit.type.trim().toUpperCase();
            if( ACES_ADVANCED_FORCE_TYPES.indexOf( type ) === -1 ) {
                issues.push( { severity: "error", message: unit.name + ": only BM, BA, CV and CI units may be taken." } );
            }
            if( type === "BM" ) {
                const chassis = unit.chassis.trim().toLowerCase();
                if( !mechsByChassis[chassis] ) mechsByChassis[chassis] = [];
                mechsByChassis[chassis].push( unit.variant.trim().toLowerCase() );
            } else {
                const key = unit.chassis.trim().toLowerCase() + "|" + unit.variant.trim().toLowerCase();
                othersByVariant[key] = ( othersByVariant[key] || 0 ) + 1;
            }
        }
        for( const chassis in mechsByChassis ) {
            const variants = mechsByChassis[chassis];
            if( variants.length > ACES_MAX_MECHS_PER_CHASSIS ) {
                issues.push( { severity: "error", message: "At most " + ACES_MAX_MECHS_PER_CHASSIS + " 'Mechs of the " + chassis + " chassis." } );
            }
            if( new Set( variants ).size < variants.length ) {
                issues.push( { severity: "error", message: "Two 'Mechs of the " + chassis + " chassis cannot be the same variant." } );
            }
        }
        for( const key in othersByVariant ) {
            if( othersByVariant[key] > ACES_MAX_OTHER_PER_VARIANT ) {
                issues.push( { severity: "error", message: "At most " + ACES_MAX_OTHER_PER_VARIANT + " of the same chassis and variant (" + key.replace( "|", " " ) + ")." } );
            }
        }
    }

    return issues;
}

/** Unspent starting PV becomes SP (Aces pp.26, 29: 5 PV = 200 SP). */
export const getAcesUnspentPVAsSP = ( totalPV: number, budget: number = ACES_STARTING_PV ): number => {
    return Math.max( 0, budget - totalPV ) * ACES_UNSPENT_PV_TO_SP;
}

/** An existing force starts a new campaign with at least 400 SP (Aces p.29). */
export const getAcesExistingForceWarchest = ( warchest: number, totalPV: number ): number => {
    return Math.max( warchest, ACES_EXISTING_FORCE_MIN_WARCHEST ) + getAcesUnspentPVAsSP( totalPV );
}

/** OMNI reconfiguration cost (Aces p.31). */
export const getAcesOmniReconfigureCost = ( size: number, currentPV: number, newPV: number ): number => {
    if( newPV <= currentPV ) return size * ACES_OMNI_RECONFIGURE_SIZE_MULTIPLIER;
    return ( newPV - currentPV ) * ACES_OMNI_RECONFIGURE_PV_MULTIPLIER;
}

/** Buying and selling always use the Skill 4 PV (Aces p.36). */
export const getAcesPurchaseCost = ( pv: number ): number => pv * ACES_PURCHASE_SP_PER_PV;
export const getAcesSalePrice = ( pv: number ): number => pv * ACES_SELL_SP_PER_PV;

/* ---------------------------------------------------------------------------------------------------------------
 * Named Pilots (Aces pp.27, 35)
 * ------------------------------------------------------------------------------------------------------------- */

/** The stat a pilot card column has reached for the SP allocated to it. */
export const getAcesPilotStat = ( thresholds: IAcesPilotThreshold[], sp: number ): number => {
    let rv = thresholds[0].value;
    for( const threshold of thresholds ) {
        if( sp >= threshold.sp ) rv = threshold.value;
    }
    return rv;
}

/** SP still needed in a column to reach the next value, or null at the top of the track. */
export const getAcesPilotSPToNext = ( thresholds: IAcesPilotThreshold[], sp: number ): number | null => {
    for( const threshold of thresholds ) {
        if( sp < threshold.sp ) return threshold.sp - sp;
    }
    return null;
}

export type TAcesPilotColumn = "skill" | "edgeTokens" | "edgeAbilities";

export interface IAcesNamedPilotExport {
    id: string;
    callsign: string;
    /** BM, CV or BA; fixed for the campaign (Aces p.27). */
    type: string;
    skillSP: number;
    edgeTokenSP: number;
    edgeAbilitySP: number;
    /** Earned but not yet allocated. The rules require allocating at once; this only holds it until entered. */
    unallocatedSP: number;
    wounded: boolean;
    killed: boolean;
    mvpCount: number;
    edgeAbilities: string[];
    sortiesPlayed: number;
    notes: string;
}

export class AcesNamedPilot {
    public id: string = generateUUID();
    public callsign: string = "";
    public type: string = "BM";
    public skillSP: number = 0;
    public edgeTokenSP: number = 0;
    public edgeAbilitySP: number = 0;
    public unallocatedSP: number = ACES_NAMED_PILOT_STARTING_SP;
    public wounded: boolean = false;
    public killed: boolean = false;
    public mvpCount: number = 0;
    public edgeAbilities: string[] = [];
    public sortiesPlayed: number = 0;
    public notes: string = "";

    constructor( importData: IAcesNamedPilotExport | null = null ) {
        if( importData ) {
            this.import( importData );
        }
    }

    public get totalSP(): number {
        return this.skillSP + this.edgeTokenSP + this.edgeAbilitySP + this.unallocatedSP;
    }

    public get skill(): number {
        return getAcesPilotStat( acesPilotSkillThresholds, this.skillSP );
    }

    public get edgeTokens(): number {
        return getAcesPilotStat( acesPilotEdgeTokenThresholds, this.edgeTokenSP );
    }

    public get edgeAbilityCount(): number {
        return getAcesPilotStat( acesPilotEdgeAbilityThresholds, this.edgeAbilitySP );
    }

    /** Moves unallocated SP into a column; returns false if there isn't enough. */
    public allocate( column: TAcesPilotColumn, amount: number ): boolean {
        amount = Math.floor( amount );
        if( amount <= 0 || amount > this.unallocatedSP ) return false;
        this.unallocatedSP -= amount;
        if( column === "skill" ) this.skillSP += amount;
        if( column === "edgeTokens" ) this.edgeTokenSP += amount;
        if( column === "edgeAbilities" ) this.edgeAbilitySP += amount;
        return true;
    }

    public export(): IAcesNamedPilotExport {
        return {
            id: this.id,
            callsign: this.callsign,
            type: this.type,
            skillSP: this.skillSP,
            edgeTokenSP: this.edgeTokenSP,
            edgeAbilitySP: this.edgeAbilitySP,
            unallocatedSP: this.unallocatedSP,
            wounded: this.wounded,
            killed: this.killed,
            mvpCount: this.mvpCount,
            edgeAbilities: this.edgeAbilities.slice(),
            sortiesPlayed: this.sortiesPlayed,
            notes: this.notes,
        };
    }

    public import( data: IAcesNamedPilotExport ) {
        if( typeof data.id === "string" && data.id ) this.id = data.id;
        if( typeof data.callsign === "string" ) this.callsign = data.callsign;
        if( typeof data.type === "string" ) this.type = data.type;
        this.skillSP = +data.skillSP || 0;
        this.edgeTokenSP = +data.edgeTokenSP || 0;
        this.edgeAbilitySP = +data.edgeAbilitySP || 0;
        this.unallocatedSP = +data.unallocatedSP || 0;
        this.wounded = !!data.wounded;
        this.killed = !!data.killed;
        this.mvpCount = +data.mvpCount || 0;
        this.edgeAbilities = Array.isArray( data.edgeAbilities ) ? data.edgeAbilities.filter( ( a ) => typeof a === "string" ) : [];
        this.sortiesPlayed = +data.sortiesPlayed || 0;
        if( typeof data.notes === "string" ) this.notes = data.notes;
    }
}

export type TAcesPilotSortieStatus = "participated" | "absent" | "killed";

/**
 * Named Pilot shares of a sortie's earnings (Aces p.35). Participants (including pilots wounded this sortie) get up
 * to the outcome's maximum, pilots who sat out get half, killed pilots nothing. If earnings can't cover every
 * share, they are split evenly, absent pilots still getting half a participant's share. Canon doesn't say how to
 * round an uneven split; shares are rounded down so pilots never take more than the earnings.
 */
export const getAcesPilotShares = (
    earnings: number,
    maxPerPilot: number,
    pilots: { id: string, status: TAcesPilotSortieStatus }[],
): { [id: string]: number } => {
    const rv: { [id: string]: number } = {};
    const participants = pilots.filter( ( pilot ) => pilot.status === "participated" ).length;
    const absent = pilots.filter( ( pilot ) => pilot.status === "absent" ).length;
    const weight = participants + absent / 2;

    let share = 0;
    if( earnings > 0 && weight > 0 ) {
        share = Math.min( maxPerPilot, earnings / weight );
    }

    for( const pilot of pilots ) {
        if( pilot.status === "participated" ) rv[pilot.id] = Math.floor( share );
        else if( pilot.status === "absent" ) rv[pilot.id] = Math.floor( share / 2 );
        else rv[pilot.id] = 0;
    }
    return rv;
}

/* ---------------------------------------------------------------------------------------------------------------
 * After-sortie steps (Aces pp.33-36)
 * ------------------------------------------------------------------------------------------------------------- */

/** Units truly destroyed without a Salvage Check (Aces p.33). */
export const isAcesAutomaticallyTrulyDestroyed = (
    ammoCriticalWithoutCASE: boolean,
    crashedWhileAirborne: boolean,
    isEmplacement: boolean,
): boolean => {
    return ammoCriticalWithoutCASE || crashedWhileAirborne || isEmplacement;
}

/** The 2D6 Salvage Check target for a unit type, or null if the book gives none (Aces p.33). */
export const getAcesSalvageTarget = ( type: string ): number | null => {
    const target = acesSalvageTargets[ type.trim().toUpperCase() ];
    return typeof target === "number" ? target : null;
}

export const passesAcesSalvageCheck = ( type: string, roll: number ): boolean | null => {
    const target = getAcesSalvageTarget( type );
    if( target === null ) return null;
    return roll >= target;
}

/**
 * Crew of a destroyed unit (Aces p.33): Crew Killed or Unit Destroyed critical hits kill, Crew Stunned wounds,
 * otherwise roll 2D6.
 */
export const resolveAcesCrew = (
    roll: number | null,
    crewKilledCritical: boolean = false,
    crewStunnedCritical: boolean = false,
): TAcesCrewResult | null => {
    if( crewKilledCritical ) return "killed";
    if( crewStunnedCritical ) return "wounded";
    if( roll === null ) return null;
    return lookupAcesTable( acesCrewTable, roll ).effect;
}

/** Size used for repairs: BattleMechs full Size, other types half, not rounded (Aces p.34). */
export const getAcesRepairSize = ( type: string, size: number ): number => {
    return type.trim().toUpperCase() === "BM" ? size : size / 2;
}

export const getAcesRepairCost = ( type: string, size: number, category: TAcesRepairCategory ): number => {
    return getAcesRepairSize( type, size ) * acesRepairMultipliers[category];
}

export interface IAcesSortieLedgerInput {
    primaryObjectiveSP: number;
    otherObjectivesSP: number;
    /** SP Earned percentage from the difficulty level (Aces p.28). */
    spPercent: number;
    reconnaissanceSP: number;
    /** Net SP cost from Waypoints revealed during the sortie; negative for gains. */
    waypointSP: number;
    /** Units fielded, excluding ENE units and truly destroyed units (Aces p.34). */
    unitsToRearm: number;
    /** Wounded or killed crews, including wounded Named Pilots (Aces p.34). */
    woundedOrKilledCrews: number;
    newNamedPilots: number;
    /** Sum of repair Sizes per category (non-'Mechs already halved). */
    destroyedSize: number;
    crippledSize: number;
    structureOrCriticalSize: number;
    armorOnlySize: number;
}

export interface IAcesSortieLedger {
    totalIncome: number;
    rearming: number;
    personnelWounded: number;
    personnelNewPilots: number;
    repairsDestroyed: number;
    repairsCrippled: number;
    repairsStructure: number;
    repairsArmor: number;
    totalExpenses: number;
    earnings: number;
}

/** Sortie Log income, expenses and earnings (Aces pp.34, 37). */
export const calculateAcesSortieLedger = ( input: IAcesSortieLedgerInput ): IAcesSortieLedger => {
    const totalIncome = ( input.primaryObjectiveSP + input.otherObjectivesSP ) * input.spPercent / 100;
    const rearming = input.unitsToRearm * ACES_REARM_COST_PER_UNIT;
    const personnelWounded = input.woundedOrKilledCrews * ACES_WOUNDED_CREW_COST;
    const personnelNewPilots = input.newNamedPilots * ACES_NEW_NAMED_PILOT_COST;
    const repairsDestroyed = input.destroyedSize * acesRepairMultipliers["destroyed"];
    const repairsCrippled = input.crippledSize * acesRepairMultipliers["crippled"];
    const repairsStructure = input.structureOrCriticalSize * acesRepairMultipliers["structure-or-critical"];
    const repairsArmor = input.armorOnlySize * acesRepairMultipliers["armor-only"];
    const totalExpenses = input.reconnaissanceSP + input.waypointSP + rearming + personnelWounded + personnelNewPilots
        + repairsDestroyed + repairsCrippled + repairsStructure + repairsArmor;

    return {
        totalIncome: totalIncome,
        rearming: rearming,
        personnelWounded: personnelWounded,
        personnelNewPilots: personnelNewPilots,
        repairsDestroyed: repairsDestroyed,
        repairsCrippled: repairsCrippled,
        repairsStructure: repairsStructure,
        repairsArmor: repairsArmor,
        totalExpenses: totalExpenses,
        earnings: totalIncome - totalExpenses,
    };
}

/* ---------------------------------------------------------------------------------------------------------------
 * Campaign record
 * ------------------------------------------------------------------------------------------------------------- */

export interface IAcesSortieRecord {
    id: string;
    datePlayed: string;
    number: string;
    name: string;
    win: boolean;
    ledgerInput: IAcesSortieLedgerInput | null;
    /** Earnings from the Sortie Log (0 for a failed sortie, which is replayed; Aces p.32). */
    earnings: number;
    /** SP given to Named Pilots (not counting the MVP bonus, which is not from the warchest). */
    namedPilotSP: number;
    purchases: number;
    sales: number;
    warchestBalance: number;
    keywords: string[];
    mvpPilotId: string;
    notes: string;
}

export const ACES_CAMPAIGN_EXPORT_VERSION = 1;

export interface IAcesCampaignExport {
    version: number;
    id: string;
    name: string;
    campaignBook: string;
    difficulty: string;
    existingForce: boolean;
    advancedForceCreation: boolean;
    startingWarchest: number;
    roster: IAcesRosterUnit[];
    pilots: IAcesNamedPilotExport[];
    sorties: IAcesSortieRecord[];
    memorial: string[];
    lastUpdated: string;
}

export class AcesCampaign {
    public id: string = generateUUID();
    public name: string = "";
    public campaignBook: string = "";
    public difficulty: string = "standard";
    public existingForce: boolean = false;
    public advancedForceCreation: boolean = false;
    public startingWarchest: number = 0;
    public roster: IAcesRosterUnit[] = [];
    public pilots: AcesNamedPilot[] = [];
    public sorties: IAcesSortieRecord[] = [];
    public memorial: string[] = [];

    constructor( importData: IAcesCampaignExport | null = null ) {
        if( importData ) {
            this.import( importData );
        }
    }

    public get warchest(): number {
        if( this.sorties.length === 0 ) return this.startingWarchest;
        return this.sorties[ this.sorties.length - 1 ].warchestBalance;
    }

    public get keywords(): string[] {
        const rv: string[] = [];
        for( const sortie of this.sorties ) {
            for( const keyword of sortie.keywords ) {
                if( rv.indexOf( keyword ) === -1 ) rv.push( keyword );
            }
        }
        return rv;
    }

    public getActiveRoster(): IAcesRosterUnit[] {
        return this.roster.filter( ( unit ) => unit.status === "active" );
    }

    public getRosterPV(): number {
        return this.getActiveRoster().reduce( ( total, unit ) => total + unit.pv, 0 );
    }

    public getLivingPilots(): AcesNamedPilot[] {
        return this.pilots.filter( ( pilot ) => !pilot.killed );
    }

    public getTotalNamedPilotSP(): number {
        return this.getLivingPilots().reduce( ( total, pilot ) => total + pilot.totalSP, 0 );
    }

    public getPVPercent(): number {
        return getAcesPlayerForcePVPercent( this.difficulty, this.existingForce, this.getTotalNamedPilotSP() );
    }

    public getSPPercent(): number {
        return getAcesDifficulty( this.difficulty ).spPercent;
    }

    public getIssues(): IAcesForceIssue[] {
        const issues: IAcesForceIssue[] = [];
        if( this.sorties.length === 0 ) {
            issues.push( ...validateAcesStartingForce( this.roster, this.advancedForceCreation ) );
        }
        const living = this.getLivingPilots().length;
        if( living < ACES_MIN_NAMED_PILOTS || living > ACES_MAX_NAMED_PILOTS ) {
            issues.push( { severity: "error", message: "A force needs " + ACES_MIN_NAMED_PILOTS + " to " + ACES_MAX_NAMED_PILOTS + " Named Pilots (" + living + " now)." } );
        }
        for( const pilot of this.getLivingPilots() ) {
            if( pilot.unallocatedSP > 0 ) {
                issues.push( { severity: "warning", message: ( pilot.callsign || "A pilot" ) + " has " + pilot.unallocatedSP + " SP to allocate." } );
            }
        }
        return issues;
    }

    /**
     * Records a completed sortie: warchest = previous balance + earnings - Named Pilot SP - purchases + sales
     * (Aces p.37). Pilots gain their shares as unallocated SP; the MVP gets the bonus on top. With negative
     * earnings the pilots earn nothing (Aces p.34). A failed sortie skips every after-sortie step and is
     * replayed (Aces p.32): only the loss is logged.
     */
    public recordSortie(
        sortie: Omit<IAcesSortieRecord, "id" | "namedPilotSP" | "warchestBalance">,
        maxSPPerPilot: number,
        pilotStatus: { [pilotId: string]: TAcesPilotSortieStatus },
        woundedThisSortie: string[] = [],
    ): IAcesSortieRecord {
        if( !sortie.win ) {
            const loss: IAcesSortieRecord = {
                ...sortie,
                id: generateUUID(),
                ledgerInput: null,
                earnings: 0,
                namedPilotSP: 0,
                purchases: 0,
                sales: 0,
                warchestBalance: this.warchest,
                keywords: [],
                mvpPilotId: "",
            };
            this.sorties.push( loss );
            return loss;
        }

        const earnings = sortie.earnings;
        const shares = getAcesPilotShares(
            earnings,
            maxSPPerPilot,
            this.getLivingPilots().map( ( pilot ) => ( { id: pilot.id, status: pilotStatus[pilot.id] || "absent" } ) ),
        );

        let namedPilotSP = 0;
        for( const pilot of this.getLivingPilots() ) {
            const share = shares[pilot.id] || 0;
            namedPilotSP += share;
            pilot.unallocatedSP += share;
            if( pilotStatus[pilot.id] === "participated" || pilotStatus[pilot.id] === "killed" ) {
                pilot.sortiesPlayed++;
            }
            // Previously wounded pilots recover; newly wounded ones sit out the next sortie (Aces p.33).
            pilot.wounded = woundedThisSortie.indexOf( pilot.id ) > -1;
            if( pilotStatus[pilot.id] === "killed" ) {
                pilot.killed = true;
                pilot.wounded = false;
                this.memorial.push( pilot.callsign );
            }
        }
        if( sortie.mvpPilotId ) {
            const mvp = this.pilots.find( ( pilot ) => pilot.id === sortie.mvpPilotId && !pilot.killed );
            if( mvp ) {
                mvp.unallocatedSP += ACES_MVP_BONUS;
                mvp.mvpCount++;
            }
        }

        const record: IAcesSortieRecord = {
            ...sortie,
            id: generateUUID(),
            earnings: earnings,
            namedPilotSP: namedPilotSP,
            warchestBalance: this.warchest + earnings - namedPilotSP - sortie.purchases + sortie.sales,
            keywords: sortie.win ? sortie.keywords : [],
        };
        this.sorties.push( record );
        return record;
    }

    public export(): IAcesCampaignExport {
        return {
            version: ACES_CAMPAIGN_EXPORT_VERSION,
            id: this.id,
            name: this.name,
            campaignBook: this.campaignBook,
            difficulty: this.difficulty,
            existingForce: this.existingForce,
            advancedForceCreation: this.advancedForceCreation,
            startingWarchest: this.startingWarchest,
            roster: this.roster.map( ( unit ) => ( { ...unit } ) ),
            pilots: this.pilots.map( ( pilot ) => pilot.export() ),
            sorties: this.sorties.map( ( sortie ) => ( { ...sortie, keywords: sortie.keywords.slice() } ) ),
            memorial: this.memorial.slice(),
            lastUpdated: new Date().toISOString(),
        };
    }

    public import( data: IAcesCampaignExport ) {
        if( !data || typeof data !== "object" ) return;
        if( typeof data.id === "string" && data.id ) this.id = data.id;
        if( typeof data.name === "string" ) this.name = data.name;
        if( typeof data.campaignBook === "string" ) this.campaignBook = data.campaignBook;
        if( typeof data.difficulty === "string" ) this.difficulty = getAcesDifficulty( data.difficulty ).id;
        this.existingForce = !!data.existingForce;
        this.advancedForceCreation = !!data.advancedForceCreation;
        this.startingWarchest = +data.startingWarchest || 0;
        this.roster = Array.isArray( data.roster ) ? data.roster.map( ( unit ) => ( { ...unit } ) ) : [];
        this.pilots = Array.isArray( data.pilots ) ? data.pilots.map( ( pilot ) => new AcesNamedPilot( pilot ) ) : [];
        this.sorties = Array.isArray( data.sorties ) ? data.sorties.map( ( sortie ) => ( {
            ...sortie,
            keywords: Array.isArray( sortie.keywords ) ? sortie.keywords : [],
        } ) ) : [];
        this.memorial = Array.isArray( data.memorial ) ? data.memorial.slice() : [];
    }
}
