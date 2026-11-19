import { formationBonuses } from '../data/formation-bonuses';
import { generateUUID } from '../utils/generateUUID';
import { normalizeGameYear } from '../utils/quirk-effects';
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

        return returnValue;
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
            }
        }
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

        this.quirksInPlay = !!importObj.quirksInPlay;
        this.gameYear = normalizeGameYear(importObj.gameYear);
        this.syncQuirksInPlay();

        if( importObj.lastUpdated ) {
            this._lastUpdated = new Date(importObj.lastUpdated);
        }
    }
}
