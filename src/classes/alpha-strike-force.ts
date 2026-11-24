import { formationBonuses } from '../data/formation-bonuses';
import { generateUUID } from '../utils/generateUUID';
import { normalizeGameYear } from '../utils/quirk-effects';
import { IASEWarBoard, applyASEWarEndRound } from '../utils/alpha-strike-ewar-play';
import { DEFAULT_ALPHA_STRIKE_EDITION, asRulesEditions } from '../data/rules-editions';
import AlphaStrikeGroup, { IASGroupExport } from './alpha-strike-group';
import { AlphaStrikeUnit } from './alpha-strike-unit';

export interface IASForceExport {
    groups: IASGroupExport[];
	uuid: string;
	lastUpdated: Date;

    turn: number;
    phase: number;
    /** "Use design quirks": the Alpha Strike Companion's quirks apply in play. Missing in older saves. */
    quirksInPlay?: boolean;
    /** "Game year": the year play checks quirks' years against. Missing in older saves. */
    gameYear?: number | null;
    /** E-War board: ECM cover, C3 networks, drone control (#642 Phase 5). Left out when empty. */
    ewarBoard?: IASEWarBoard;
    /** The Alpha Strike rules edition the force plays by; left out when it is the default. */
    rulesEdition?: string;
    /** The rules level the force is limited to; left out while unset (no limit). */
    rulesLevel?: number;
}

export default class AlphaStrikeForce {
    _uuid: string = generateUUID();
    _lastUpdated: Date = new Date();

    public groups: AlphaStrikeGroup[] = [];

	public customName : string= "";

	public activeMembers: number = 0;
	public forcePoints: number = 0;
    public membersLabel: string = "";

    public turn: number = 1;
    public phase: number = 0;

    public quirksInPlay: boolean = false;
    /** E-War board: friendly ECM cover, C3 networks and drone control, by unit uuid. */
    public ewarBoard: IASEWarBoard = {};
    /** The rules edition play follows. */
    public rulesEdition: string = DEFAULT_ALPHA_STRIKE_EDITION;
    /** The rules level the force is limited to; undefined is no limit. Setting it never removes units (#646). */
    public rulesLevel: number | undefined = undefined;
    /** "Game year": play checks the cards' quirks' years against it; null for the start of each design's era. */
    public gameYear: number | null = null;

    constructor(importObj: IASForceExport | null = null ) {
        if( importObj ) {
            this.import(importObj);
            this.validateAllGroups();
        }

        if( this.groups.length === 0 ) {
            this.groups.push( new AlphaStrikeGroup() )
        }
    }

    public renameGroup( newName: string, groupIndex: number ) {
        if( this.groups.length > groupIndex && this.groups[groupIndex]) {
            this.groups[groupIndex].customName = newName;
        }
    }

    public selectGroupLabel( newName: string, groupIndex: number ) {
        if( this.groups.length > groupIndex && this.groups[groupIndex]) {
            this.groups[groupIndex].groupLabel = newName;
        }
    }

	public getActiveMembers() {
		this.activeMembers = 0;
        this.forcePoints = 0;
        let members = 0;
        for( const group of this.groups ) {
            for( const member of group.members ) {
                member.calcCurrentValues();
                members++;
                if( member.active )
                    this.activeMembers++;
                this.forcePoints += member.currentPoints / 1;
            }
        }

		this.membersLabel = " (" + this.activeMembers + "/" + members + ")";
    }

    public addToGroup(
        mulUnit: AlphaStrikeUnit,
        groupIndex: number = 0
    ) {
        if( this.groups.length === 0 ) {
            this.groups.push(new AlphaStrikeGroup());
        }
        // An index past the last group (a group removed since the page drew) adds to the last one, not nowhere.
        if( groupIndex >= this.groups.length || groupIndex < 0 )  {
            groupIndex = this.groups.length - 1;
        }
        if( this.groups.length > groupIndex && this.groups[groupIndex]) {
            // let exportData = mulUnit.export();

            // if( exportData ) {
                // let newUnit = new AlphaStrikeUnit( exportData );
                mulUnit.quirksInPlay = this.quirksInPlay;
                mulUnit.quirkPlayYear = this.gameYear;
                mulUnit.playEdition = this.rulesEdition;
                this.groups[groupIndex].members.push( mulUnit  );
                this.groups[groupIndex].sortUnits();
                this.groups[groupIndex].setAvailableFormationBonuses( formationBonuses.filter(x=>x.IsValid(this.groups[groupIndex], this.groups)));

                // Used to update nova/mechanized check
                for(const group of this.groups){
                    if(group.needsToCheckBonuses()){
                        group.setAvailableFormationBonuses( formationBonuses.filter(x=>x.IsValid(group, this.groups)));
                    }
                }
            // }
        }

    }

    public moveUnitToGroup(
        fromUnitIndex: number,
        fromGroupIndex: number,
        toGroupIndex: number ) {
        if(
            this.groups.length > fromGroupIndex
                &&
            this.groups.length > toGroupIndex

        )  {
            if( this.groups[fromGroupIndex].members.length > fromUnitIndex ) {
                const asUnit = this.groups[fromGroupIndex].members[fromUnitIndex];
                this.groups[fromGroupIndex].members.splice(fromUnitIndex, 1 );

                this.groups[toGroupIndex].members.push( asUnit);

                this.groups[toGroupIndex].sortUnits();
                this.groups[fromGroupIndex].sortUnits();
                this.groups[toGroupIndex].setAvailableFormationBonuses( formationBonuses.filter(x=>x.IsValid(this.groups[toGroupIndex], this.groups)));
                this.groups[fromGroupIndex].setAvailableFormationBonuses( formationBonuses.filter(x=>x.IsValid(this.groups[fromGroupIndex], this.groups)));
                for(const group of this.groups){
                    if(group.needsToCheckBonuses()){
                        group.setAvailableFormationBonuses( formationBonuses.filter(x=>x.IsValid(group, this.groups)));
                    }
                }
            }
        }
    }

    public newGroup() {
        this.groups.push( new AlphaStrikeGroup() );
    }

    public removeUnitFromGroup(asGroupIndex: number, asUnitIndex: number) {
        if( this.groups.length > asGroupIndex && this.groups[asGroupIndex]) {
            if( this.groups[asGroupIndex].members.length > asUnitIndex && this.groups[asGroupIndex].members[asUnitIndex]) {
                this.groups[asGroupIndex].members.splice( asUnitIndex, 1);
                this.groups[asGroupIndex].setAvailableFormationBonuses(formationBonuses.filter(x=>x.IsValid(this.groups[asGroupIndex], this.groups)));
                for(const group of this.groups){
                    if(group.needsToCheckBonuses()){
                        group.setAvailableFormationBonuses( formationBonuses.filter(x=>x.IsValid(group, this.groups)));
                    }
                }
            }
        }
    }

    public removeGroup(asGroupIndex: number) {
        if( this.groups.length > asGroupIndex && this.groups[asGroupIndex]) {
            this.groups.splice( asGroupIndex, 1);
            // A Nova or Mechanized bonus rests on another group's transports, which may just have left.
            this.validateAllGroups();
        }
    }

    public getTotalGroups(): number {
        return this.groups.length;
    }

    public getTotalUnits(): number {
        let returnValue: number = 0;

        for( const group of this.groups ) {
            returnValue += group.getTotalUnits();
        }

        return returnValue;
    }

    public getTotalPoints(): number {
        let returnValue: number = 0;

        for( const group of this.groups ) {
            returnValue += group.getTotalPoints();
        }

        return returnValue;
    }

    public export(
        noInPlayVariables: boolean = false,
    ): IASForceExport {
        const returnValue: IASForceExport = {
            groups: [],
            uuid: this._uuid,
            lastUpdated: new Date(),

            turn: this.turn,
            phase: this.phase,
            quirksInPlay: this.quirksInPlay,
            gameYear: this.gameYear,
        }

        for( const group of this.groups) {
            returnValue.groups.push( group.export(noInPlayVariables) );
        }
        if( this.rulesEdition !== DEFAULT_ALPHA_STRIKE_EDITION ) {
            returnValue.rulesEdition = this.rulesEdition;
        }
        if( this.rulesLevel !== undefined ) {
            returnValue.rulesLevel = this.rulesLevel;
        }
        if( !noInPlayVariables ) {
            const board = this.exportEWarBoard();
            if( Object.keys(board).length > 0 ) returnValue.ewarBoard = board;
        }

        return returnValue;
    }

    /** Every unit of every group (the E-War module's view of the force). */
    public getEWarUnits(): AlphaStrikeUnit[] {
        return this.groups.flatMap((group) => group.members);
    }

    /** End Round for E-War: one-turn state clears, jammers and C3 emergency masters count down. */
    public applyEWarRound(): void {
        applyASEWarEndRound(this.getEWarUnits(), this.ewarBoard, this.rulesEdition);
    }

    /** The board without the uuids of units that left the force or were reset. */
    private exportEWarBoard(): IASEWarBoard {
        const known = new Set(this.getEWarUnits().map((unit) => unit.uuid));
        const board = this.ewarBoard;
        const result: IASEWarBoard = {};
        const keepRecord = (record: Record<string, string[]> | undefined): Record<string, string[]> | undefined => {
            const kept: Record<string, string[]> = {};
            for( const [carrier, uuids] of Object.entries(record ?? {}) ) {
                if( known.has(carrier) ) kept[carrier] = uuids.filter((uuid) => known.has(uuid));
            }
            return Object.keys(kept).length > 0 ? kept : undefined;
        };
        const friendlyEcm = keepRecord(board.friendlyEcm);
        if( friendlyEcm ) result.friendlyEcm = friendlyEcm;
        const chaffCloud = keepRecord(board.chaffCloud);
        if( chaffCloud ) result.chaffCloud = chaffCloud;
        const networks = (board.c3Networks ?? []).map((network) => ({
            ...network,
            members: network.members.filter((uuid) => known.has(uuid)),
            ...(network.master && known.has(network.master) ? { master: network.master } : {}),
        }));
        for( const network of networks ) {
            if( network.master === undefined ) delete (network as { master?: string }).master;
        }
        if( networks.length > 0 ) result.c3Networks = networks;
        const droneControl: Record<string, string> = {};
        for( const [drone, controller] of Object.entries(board.droneControl ?? {}) ) {
            if( known.has(drone) && known.has(controller) ) droneControl[drone] = controller;
        }
        if( Object.keys(droneControl).length > 0 ) result.droneControl = droneControl;
        return JSON.parse(JSON.stringify(result)) as IASEWarBoard;
    }

    public validateAllGroups(): void {
        // First validate each group individually
        for (const group of this.groups) {
            group.setAvailableFormationBonuses(formationBonuses.filter(x => x.IsValid(group, this.groups)));
        }

        // Then revalidate all groups to ensure cross-group dependencies are met
        for (const group of this.groups) {
            if (group.formationBonus) {
                // If the current formation bonus is no longer valid, reset to None
                if (!group.availableFormationBonuses.find(x => x.Name === group.formationBonus?.Name)) {
                    group.formationBonus = formationBonuses.find(x => x.Name === "None");
                }
            }
        }
    }

    /** Hands the "Use design quirks" switch and the game year to every unit, which reads them in `calcCurrentValues`. */
    public syncQuirksInPlay(): void {
        for( const group of this.groups ) {
            for( const unit of group.members ) {
                unit.quirksInPlay = this.quirksInPlay;
                unit.quirkPlayYear = this.gameYear;
                const editionChanged = unit.playEdition !== this.rulesEdition;
                unit.playEdition = this.rulesEdition;
                // A unit built under another edition (a load, a force pack, a favourite group) works out its values again.
                if( editionChanged ) {
                    unit.calcCurrentValues();
                }
            }
        }
    }

    /** Picks the rules edition and has every unit work out its current values under it at once (#646). */
    public setRulesEdition(tag: string): void {
        this.rulesEdition = asRulesEditions.some((edition) => edition.tag === tag) ? tag : DEFAULT_ALPHA_STRIKE_EDITION;
        this.syncQuirksInPlay();
    }

    /** Limits the force to a rules level (undefined: no limit). Units already in the force stay; the roster badges them. */
    public setRulesLevel(level: number | undefined): void {
        this.rulesLevel = level;
    }

    public setGameYear(year: number): void {
        this.gameYear = normalizeGameYear(year);
        this.syncQuirksInPlay();
    }

    public import(importObj: IASForceExport) {
        for( const group of importObj.groups ) {
            this.groups.push( new AlphaStrikeGroup( group) );
        }
        if( importObj.uuid ) {
            this._uuid = importObj.uuid;
        }

        if( typeof(importObj.phase) !== "undefined" ) {
            this.phase = importObj.phase;
        }
        // The turn is exported beside the phase, so it is read back too (older saves, or a bad value, start at 1).
        if( typeof importObj.turn === "number" && Number.isFinite(importObj.turn) && importObj.turn >= 1 ) {
            this.turn = Math.floor(importObj.turn);
        }

        this.ewarBoard = importObj.ewarBoard && typeof importObj.ewarBoard === "object" ? JSON.parse(JSON.stringify(importObj.ewarBoard)) as IASEWarBoard : {};
        this.rulesEdition = typeof importObj.rulesEdition === "string" && asRulesEditions.some((edition) => edition.tag === importObj.rulesEdition)
            ? importObj.rulesEdition
            : DEFAULT_ALPHA_STRIKE_EDITION;
        this.rulesLevel = typeof importObj.rulesLevel === "number" && Number.isFinite(importObj.rulesLevel) ? importObj.rulesLevel : undefined;
        this.quirksInPlay = !!importObj.quirksInPlay;
        this.gameYear = normalizeGameYear(importObj.gameYear);
        this.syncQuirksInPlay();

        if( importObj.lastUpdated ) {
            this._lastUpdated = new Date(importObj.lastUpdated);
        }
    }
}
