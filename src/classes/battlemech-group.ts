import { generateUUID } from "../utils/generateUUID";
import { BattleMech, IBattleMechExport } from "./battlemech";
import Vehicle, { IVehicleExport } from "./vehicle";
import AerospaceFighter, { IAerospaceFighterExport } from "./aerospace-fighter";
import InfantryPlatoon, { IInfantryPlatoonExport } from "./infantry-platoon";

/** Most vehicles read from one saved group; far above any real lance or company. */
export const MAX_GROUP_VEHICLES = 100;
export const MAX_GROUP_FIGHTERS = 100;
export const MAX_GROUP_INFANTRY = 100;

export interface ICBTGroupExport {
	name: string;
	units: IBattleMechExport[];
	vehicles?: IVehicleExport[];
	fighters?: IAerospaceFighterExport[];
	infantry?: IInfantryPlatoonExport[];
	uuid: string;
	lastUpdated: Date;
	location?: string;
	groupLabel: string;
}

export class BattleMechGroup {

    public groupLabel: string = "Lance";

	public uuid: string = generateUUID();
	public lastUpdated: Date = new Date();

    public members: BattleMech[] = [];
    public vehicles: Vehicle[] = [];
    public fighters: AerospaceFighter[] = [];
    public infantry: InfantryPlatoon[] = [];

	public customName : string= "";

    constructor(importObj: ICBTGroupExport | null = null ) {
        if( importObj ) {
            this.import(importObj);
		}

	}

	public isUnderStrength(): boolean {
		for( let member of this.members ) {
			if( member.isUnderStrength() ) {
				return true;
			}
		}
		return this.vehicles.some( (vehicle) => vehicle.isDamaged() ) || this.fighters.some( (fighter) => fighter.isDamaged() )
			|| this.infantry.some( (platoon) => platoon.isDamaged() );
	}
	public getName(
		indexNumber: number,
		forFavorites: boolean = false,
	): string {
		if( this.customName && this.customName.trim() ) {
			return this.customName;
		} else {
			if( forFavorites )
				return "Unnamed " + this.groupLabel;
			else
				return this.groupLabel + " #" + (indexNumber + 1).toString();
		}
	}

	public setNew() {
		this.uuid = generateUUID();
		for( let mech of this.members ) {
			mech.newUUID();
		}
		for( let vehicle of this.vehicles ) {
			vehicle.newUUID();
		}
		for( let fighter of this.fighters ) {
			fighter.newUUID();
		}
		for( let platoon of this.infantry ) {
			platoon.newUUID();
		}
		this.lastUpdated = new Date();
	}

	public getTotaBV2(): number {
        let rv = 0;

        for( let unit of this.members ) {
            rv += unit.getPilotAdjustedBattleValue();
        }
        for( let vehicle of this.vehicles ) {
            rv += vehicle.getPilotAdjustedBattleValue();
        }
        for( let fighter of this.fighters ) {
            rv += fighter.getPilotAdjustedBattleValue();
        }
        for( let platoon of this.infantry ) {
            rv += platoon.getSkillAdjustedBattleValue();
        }

        return rv;
    }

	public getTotalTons(): number {
        let rv = 0;

        for( let unit of this.members ) {
            rv += unit.getTonnage();
        }
        for( let vehicle of this.vehicles ) {
            rv += vehicle.getTonnage();
        }
        for( let fighter of this.fighters ) {
            rv += fighter.getTonnage();
        }
        // Infantry count by their transport weight (TM p. 155).
        for( let platoon of this.infantry ) {
            rv += platoon.getWeight();
        }

        return rv;
    }

	getTech(): string {
        let rv = "";

        const techNames = [
            ...[...this.members, ...this.vehicles, ...this.fighters].map( (unit) => unit.getTech().name ),
            ...this.infantry.map( (platoon) => platoon.getTechName() ),
        ];
        for( let tech of techNames ) {
            if( rv !== tech && rv !== "" ) {
                rv = "Mixed"
            }  else {
                if( rv !== "Mixed")
                    rv = tech;
            }
        }

        return rv;
    }

    public import(importObj: ICBTGroupExport) {

		this.customName = importObj.name;
		for( let unit of importObj.units) {
			let theUnit = new BattleMech( JSON.stringify(unit) );
			this.members.push( theUnit );
		}
		// Vehicles in a saved group may come from someone else's backup: a list only, capped.
		const vehicles = Array.isArray(importObj.vehicles) ? importObj.vehicles.slice(0, MAX_GROUP_VEHICLES) : [];
		for( let vehicle of vehicles ) {
			// Skip entries that are not saved vehicles rather than adding blank default vehicles.
			if( vehicle && typeof vehicle === "object" && !Array.isArray(vehicle) ) {
				this.vehicles.push( new Vehicle( JSON.stringify(vehicle) ) );
			}
		}
		// Fighters likewise: a capped list, read through the fighter's own validating import.
		const fighters = Array.isArray(importObj.fighters) ? importObj.fighters.slice(0, MAX_GROUP_FIGHTERS) : [];
		for( let fighter of fighters ) {
			if( fighter && typeof fighter === "object" && !Array.isArray(fighter) ) {
				this.fighters.push( new AerospaceFighter( JSON.stringify(fighter) ) );
			}
		}
		// Infantry platoons likewise.
		const infantry = Array.isArray(importObj.infantry) ? importObj.infantry.slice(0, MAX_GROUP_INFANTRY) : [];
		for( let platoon of infantry ) {
			if( platoon && typeof platoon === "object" && !Array.isArray(platoon) ) {
				this.infantry.push( new InfantryPlatoon( JSON.stringify(platoon) ) );
			}
		}
        if( importObj.uuid ) {
            this.uuid = importObj.uuid;
        }

		if( importObj.groupLabel ) {
            this.groupLabel = importObj.groupLabel;
		}

        if( importObj.lastUpdated ) {
            this.lastUpdated = new Date(importObj.lastUpdated);
		}

    }

    public export(
		noInPlayVariabless: boolean = false,
	): ICBTGroupExport {
        let returnValue: ICBTGroupExport = {
			name: this.customName,
			units: [],
            uuid: this.uuid,
			lastUpdated: new Date(),
			groupLabel: this.groupLabel,
			vehicles: this.vehicles.map( (vehicle) => vehicle.export(noInPlayVariabless) ),
			fighters: this.fighters.map( (fighter) => fighter.export(noInPlayVariabless) ),
			infantry: this.infantry.map( (platoon) => platoon.export(noInPlayVariabless) ),
		}

		for( let unit of this.members ) {
			let exportUnit = unit.export(noInPlayVariabless);
			if( exportUnit ) {
				returnValue.units.push( exportUnit );
			}
		}

        return returnValue;
    }

	public getTotalUnits(): number {
        return this.members.length + this.vehicles.length + this.fighters.length + this.infantry.length;
    }

}