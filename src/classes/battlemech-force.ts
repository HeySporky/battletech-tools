import { formatBattleValue, getBattleValueRules } from "../data/battle-value";
import { DEFAULT_RULES_EDITION, getRulesEdition } from "../data/rules-editions";
import { generateUUID } from "../utils/generateUUID";
import { getCarrierInstalledUuids, getQuirkInitiative, IQuirkCarrier, IQuirkInitiative, normalizeGameYear } from "../utils/quirk-effects";
import { BattleMech } from "./battlemech";
import { BattleMechGroup, ICBTGroupExport } from "./battlemech-group";
import { ISpaceTrackerExport, SpaceTracker } from "./space-tracker";

/** Most groups read from one saved force. */
export const MAX_FORCE_GROUPS = 200;

export interface ICBTForceExport {
    groups: ICBTGroupExport[];
	uuid: string;
	lastUpdated: Date;

    heatApplied: boolean;
    turn: number;
    phase: number;
    hideHelp: boolean;

    /** "Space forces in this game": the space turn tracker (design 2026-10-22). Missing in older saves. */
    spaceInPlay?: boolean;
    /** Saved whenever it tracks anything, so turning the option off and on again keeps the shots in flight. */
    spaceTracker?: ISpaceTrackerExport;
    /** "Use design quirks": quirk effects apply in Play Mode. Missing in older saves. */
    quirksInPlay?: boolean;
    /** "Game year": the year play checks quirks' years against. Missing in older saves. */
    gameYear?: number | null;
    /** The rules edition being played, whose Battle Value the roster shows (plan ruling 3). Missing in older saves. */
    rulesEdition?: string;
    /** Each networked unit's C3 network name, by unit UUID (BV v4.1 p.23). Missing in older saves and with no networks. */
    c3Networks?: Record<string, string>;
}

export class BattleMechForce {

	// public members: BattleMechGroup[] = [];

	public groupLabel: string = "Lance";

	private _uuid: string = generateUUID();
	private _lastUpdated: Date = new Date();

	public customName : string= "";

    public groups: BattleMechGroup[] = [];

    public turn: number = 1;
    public phase: number = 0;

    public hideHelp: boolean = false;

    public heatApplied: boolean = false;

    public spaceInPlay: boolean = false;
    public spaceTracker: SpaceTracker = new SpaceTracker();

    public quirksInPlay: boolean = false;
    /** "Game year": play checks quirks' years against it; null for the start of each unit's era. */
    public gameYear: number | null = null;
    /** The rules edition being played: the roster's Battle Values and totals follow it (plan ruling 3). */
    public rulesEdition: string = DEFAULT_RULES_EDITION;
    /** Each networked unit's C3 network name, by unit UUID: the units sharing a name form one network. */
    public c3Networks: Record<string, string> = {};

    constructor(importObj: ICBTForceExport | null = null ) {
        if( importObj ) {
            this.import(importObj);
        }

        if( this.groups.length === 0 ) {
            this.groups.push( new BattleMechGroup() )
        }
    }

    setSelectedMech(
        uuid: string
    ) {
        for( const group of this.groups ) {
            for( const unit of group.members ) {
                if( unit.uuid === uuid ) {
                    unit.selectedMech = true;
                } else {
                    unit.selectedMech = false;
                }
            }
        }
    }

    getSelectedMech(): BattleMech | null {
        for( const group of this.groups ) {
            for( const unit of group.members ) {
                if( unit.selectedMech ) {
                    return unit;
                }
            }
        }
        return null;
    }

    public removeGroup(asGroupIndex: number) {
        if( this.groups.length > asGroupIndex && this.groups[asGroupIndex]) {
            this.groups.splice( asGroupIndex, 1);
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

    public export(
        noInPlayVariabless: boolean = false,
    ): ICBTForceExport {
        const returnValue: ICBTForceExport = {
            groups: [],
            uuid: this._uuid,
            lastUpdated: new Date(),
            turn: this.turn,
            phase: this.phase,
            hideHelp: this.hideHelp,
            heatApplied: this.heatApplied,
            spaceInPlay: this.spaceInPlay,
            quirksInPlay: this.quirksInPlay,
            gameYear: this.gameYear,
            rulesEdition: this.rulesEdition === DEFAULT_RULES_EDITION ? undefined : this.rulesEdition,
        }
        if( this.spaceTracker.hasState() ) {
            returnValue.spaceTracker = this.spaceTracker.export();
        }
        // Only units still in the force keep their network.
        const uuids = new Set(this.groups.flatMap((group) => [...group.members, ...group.vehicles].map((unit) => unit.getUUID())));
        const c3Networks = Object.entries(this.c3Networks).filter(([uuid]) => uuids.has(uuid));
        if( c3Networks.length > 0 ) {
            returnValue.c3Networks = Object.fromEntries(c3Networks);
        }

        for( const group of this.groups) {
            returnValue.groups.push( group.export(noInPlayVariabless) );
        }

        return returnValue;
    }

    getUnitViaUUID(
        uuid: string
    ): BattleMech | null {
        for( const group of this.groups ) {
            for( const unit of group.members ) {
                if( unit.uuid === uuid )
                    return unit;
            }
        }
        return null;
    }

    updateUnitViaUUID(
        nv: BattleMech
    ): boolean {
        for( const groupIndex in this.groups ) {
            for( const unitIndex in this.groups[groupIndex].members ) {
                if( this.groups[groupIndex].members[unitIndex].uuid === nv.uuid ) {
                    this.groups[groupIndex].members[unitIndex] = nv;
                    return true;
                }
            }
        }
        return false;
    }

    public getPhaseName(
        num: number
    ): string {
        if( num === 0 ) {
            return "Initiative Phase"
        } else if( num === 1 ) {
            return "Movement Phase"
        } else if( num === 2 ) {
            return "Weapon Attack Phase"
        } else if( num === 3 ) {
            return "Physical Attack Phase"
        } else if( num === 4 ) {
            return "Heat Phase"
        } else if( num === 5 ) {
            return "End Phase"
        }

        return "???"
    }

    public import(importObj: ICBTForceExport) {
        // Forces come back from saves and other people's backups: read a bounded list of groups.
        const groups = Array.isArray(importObj.groups) ? importObj.groups.slice(0, MAX_FORCE_GROUPS) : [];
        for( const group of groups ) {
            this.groups.push( new BattleMechGroup( group) );
        }
        if( importObj.uuid ) {
            this._uuid = importObj.uuid;
        }

        if( typeof(importObj.turn) !== "undefined" ) {
            this.turn = importObj.turn;
        }
        if( typeof(importObj.phase) !== "undefined" ) {
            this.phase = importObj.phase;
        }

        if( typeof(importObj.hideHelp) !== "undefined" ) {
            this.hideHelp = importObj.hideHelp;
        }

        if( typeof(importObj.heatApplied) !== "undefined" ) {
            this.heatApplied = importObj.heatApplied;
        }

        this.spaceInPlay = importObj.spaceInPlay === true;
        this.quirksInPlay = !!importObj.quirksInPlay;
        this.gameYear = normalizeGameYear(importObj.gameYear);
        // An unknown or missing edition reads the default one.
        this.rulesEdition = getRulesEdition(importObj.rulesEdition).tag;
        this.c3Networks = {};
        if( importObj.c3Networks && typeof importObj.c3Networks === "object" ) {
            for( const [uuid, name] of Object.entries(importObj.c3Networks) ) {
                if( typeof name === "string" && name ) this.setC3Network(uuid, name);
            }
        }
        this.syncQuirkPlayYear();
        this.spaceTracker = new SpaceTracker( importObj.spaceTracker );

        if( importObj.lastUpdated ) {
            this._lastUpdated = new Date(importObj.lastUpdated);
        }

    }

    public setGameYear(year: number): void {
        this.gameYear = normalizeGameYear(year);
        this.syncQuirkPlayYear();
    }

    /** Hands the game year to every unit, which checks its quirks' years against it in play. */
    public syncQuirkPlayYear(): void {
        for( const group of this.groups ) {
            const units: IQuirkCarrier[] = [...group.members, ...group.vehicles, ...group.fighters, ...group.smallCraft, ...group.capitalShips, ...group.battleArmor];
            for( const unit of units ) {
                unit.quirkPlayYear = this.gameYear;
            }
        }
    }

    /**
     * The side's Initiative quirk: the largest of its units still in the game, never the sum (CO p.225). Null when
     * none has one. Read only with the game's "Use design quirks" switch on.
     */
    public getInitiativeModifier(): IQuirkInitiative | null {
        let best: IQuirkInitiative | null = null;
        for( const group of this.groups ) {
            const units: IQuirkCarrier[] = [...group.members, ...group.vehicles, ...group.fighters, ...group.smallCraft, ...group.capitalShips, ...group.battleArmor];
            for( const unit of units ) {
                if( unit.isDestroyed() ) continue;
                const initiative = getQuirkInitiative(unit.quirks, getCarrierInstalledUuids(unit), this.gameYear ?? unit.getEra().yearStart);
                if( initiative && (!best || initiative.modifier > best.modifier) ) best = initiative;
            }
        }
        return best;
    }

    public applyHeat() {
        this.heatApplied = true;
        for( const group of this.groups ) {
            for( const unit of group.members ) {
                unit.applyHeat(this.quirksInPlay);
            }
        }
    }

    public getTotalUnits(): number {
        let returnValue: number = 0;

        for( const group of this.groups ) {
            returnValue += group.getTotalUnits();
        }

        return returnValue;
    }

    /** Puts the unit with `uuid` in the C3 network `name` (an empty name takes it out of any network). */
    public setC3Network(uuid: string, name: string): void {
        if( name ) {
            this.c3Networks[uuid] = name.slice(0, 20);
        } else {
            delete this.c3Networks[uuid];
        }
    }

    /** The force's skill-adjusted Battle Value under its edition, as the roster shows it (plan ruling 1); a command console counts once for the side. */
    public getBattleValueText(): string {
        const types = [...new Set(this.groups.flatMap((group) => group.getBattleValueUnitTypes()))];
        const hasConsole = this.groups.some((group) => group.members.some((unit) => unit.hasCommandConsole()));
        return formatBattleValue((edition) => this.groups.reduce((total, group) => total + group.getTotalBattleValue(edition, this.groups, this.c3Networks), 0)
            + (hasConsole ? getBattleValueRules(edition, "mech").levelThree?.commandConsole ?? 0 : 0), types, this.rulesEdition);
    }

    getTech(): string {
        let rv = "";

        for( const group of this.groups ) {
            const tech = group.getTech();
            // An empty group has no tech of its own.
            if( tech === "" ) {
                continue;
            }
            if( rv !== tech && rv !== "" ) {
                rv = "Mixed";
            }  else {
                if( rv !== "Mixed")
                    rv = tech;
            }
        }

        return rv;
    }

    getTotalTons(): number {
        let returnValue: number = 0;

        for( const group of this.groups ) {
            returnValue += group.getTotalTons();
        }

        return returnValue;
    }

    public newGroup() {
        this.groups.push( new BattleMechGroup() );
    }

    public getTotalGroups(): number {
        return this.groups.length;
    }
}