import { generateUUID } from "../utils/generateUUID";
import { BattleValueUnitType, formatBattleValue, getBattleValueC3Share, getBattleValueTagBonus } from "../data/battle-value";
import { BattleMech, IBattleMechExport } from "./battlemech";
import Vehicle, { IVehicleExport } from "./vehicle";
import AerospaceFighter, { IAerospaceFighterExport } from "./aerospace-fighter";
import SmallCraft, { ISmallCraftExport } from "./small-craft";
import CapitalShip, { ICapitalShipExport } from "./capital-ship";
import InfantryPlatoon, { IInfantryPlatoonExport } from "./infantry-platoon";
import Building, { IBuildingExport } from "./building";
import BattleArmor, { IBattleArmorExport } from "./battle-armor";
import ProtoMech, { IProtoMechExport } from "./protomech";
import MicroMech, { IMicroMechExport } from "./micro-mech";
import Walker, { IWalkerExport, normalizeWalkerExport } from "./walker";
import BattledroidsUnit, { IBattledroidsUnitExport, findBattledroidsUnitDesign } from "./battledroids-unit";

/** Most vehicles read from one saved group; far above any real lance or company. */
export const MAX_GROUP_VEHICLES = 100;
export const MAX_GROUP_FIGHTERS = 100;
export const MAX_GROUP_SMALL_CRAFT = 100;
export const MAX_GROUP_CAPITAL_SHIPS = 50;
export const MAX_GROUP_INFANTRY = 100;
export const MAX_GROUP_BUILDINGS = 100;
export const MAX_GROUP_BATTLE_ARMOR = 100;
export const MAX_GROUP_PROTOMECHS = 100;
export const MAX_GROUP_MICRO_MECHS = 100;
export const MAX_GROUP_WALKERS = 100;
export const MAX_GROUP_BATTLEDROIDS_UNITS = 100;

/** The units that take part in a force's TAG and C3 adjustments. */
type TagUnit = BattleMech | Vehicle | AerospaceFighter | SmallCraft;

export interface ICBTGroupExport {
	name: string;
	units: IBattleMechExport[];
	vehicles?: IVehicleExport[];
	fighters?: IAerospaceFighterExport[];
	smallCraft?: ISmallCraftExport[];
	capitalShips?: ICapitalShipExport[];
	infantry?: IInfantryPlatoonExport[];
	battleArmor?: IBattleArmorExport[];
	protoMechs?: IProtoMechExport[];
	microMechs?: IMicroMechExport[];
	walkers?: IWalkerExport[];
	buildings?: IBuildingExport[];
	battledroidsUnits?: IBattledroidsUnitExport[];
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
    public smallCraft: SmallCraft[] = [];
    // JumpShips, WarShips and space stations.
    public capitalShips: CapitalShip[] = [];
    public infantry: InfantryPlatoon[] = [];
    public battleArmor: BattleArmor[] = [];
    // ProtoMech Points: each entry is one design fielded as up to five ProtoMechs.
    public protoMechs: ProtoMech[] = [];
    // Micro-Mechs (fan-made, Custom Homebrew): one entry is one Micro-Mech.
    public microMechs: MicroMech[] = [];
    /** Walkers (fan-made four-legged 'Mechs, Custom Homebrew) from the Walker Creator. */
    public walkers: Walker[] = [];
    // Gun emplacements and other buildings. No Battle Value method for them was found in the rulebooks, and they are not counted in tonnage.
    public buildings: Building[] = [];
    // The tanks, jeeps and infantry squads of Expert Battledroids (BD pp.22-23): fixed designs with no tonnage or Battle Value.
    public battledroidsUnits: BattledroidsUnit[] = [];

	public customName : string= "";

    constructor(importObj: ICBTGroupExport | null = null ) {
        if( importObj ) {
            this.import(importObj);
		}

	}

	public isUnderStrength(): boolean {
		for( const member of this.members ) {
			if( member.isUnderStrength() ) {
				return true;
			}
		}
		return this.vehicles.some( (vehicle) => vehicle.isDamaged() ) || this.fighters.some( (fighter) => fighter.isDamaged() )
			|| this.smallCraft.some( (craft) => craft.isDamaged() ) || this.capitalShips.some( (ship) => ship.isDamaged() )
			|| this.infantry.some( (platoon) => platoon.isDamaged() ) || this.battleArmor.some( (squad) => squad.isDamaged() )
			|| this.protoMechs.some( (point) => point.isDamaged() )
			|| this.buildings.some( (building) => building.isDamaged() )
			|| this.battledroidsUnits.some( (unit) => unit.isDamaged() );
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
		for( const mech of this.members ) {
			mech.newUUID();
		}
		for( const vehicle of this.vehicles ) {
			vehicle.newUUID();
		}
		for( const fighter of this.fighters ) {
			fighter.newUUID();
		}
		for( const craft of this.smallCraft ) {
			craft.newUUID();
		}
		for( const ship of this.capitalShips ) {
			ship.newUUID();
		}
		for( const platoon of this.infantry ) {
			platoon.newUUID();
		}
		for( const squad of this.battleArmor ) {
			squad.newUUID();
		}
		for( const point of this.protoMechs ) {
			point.newUUID();
		}
		for( const micro of this.microMechs ) {
			micro.newUUID();
		}
		for( const walker of this.walkers ) {
			walker.newUUID();
		}
		for( const building of this.buildings ) {
			building.newUUID();
		}
		for( const unit of this.battledroidsUnits ) {
			unit.newUUID();
		}
		this.lastUpdated = new Date();
	}

	/** The units that take part in a force's TAG adjustment (battle-value.ts `getBattleValueTagShare`). */
	private _tagUnits(): TagUnit[] { return [...this.members, ...this.vehicles, ...this.fighters, ...this.smallCraft]; }

	/**
	 * The group's skill-adjusted Battle Value under `edition` (each unit's own edition when left out). Before skill,
	 * each TAG carrier adds the guided ammo in `force` (the force's groups; this group alone when left out), then each
	 * C3 unit its network's share; `c3Networks` names each networked unit's network by its UUID.
	 */
	public getTotalBattleValue(edition?: string, force: BattleMechGroup[] = [this], c3Networks: Record<string, string> = {}): number {
        const sum = <T>(units: T[], battleValue: (unit: T) => number) => units.reduce((total, unit) => total + battleValue(unit), 0);
        const shares = force.flatMap((group) => group._tagUnits()).map((unit) => unit.getBattleValueTagShare(edition));
        const tagBonus = (unit: TagUnit) => getBattleValueTagBonus(edition, unit.getBattleValueTagShare(edition), shares);
        const withTag = (unit: TagUnit) => unit.getBattleValue(edition) + tagBonus(unit);
        const networked = force.flatMap((group) => [...group.members, ...group.vehicles]).filter((unit) => c3Networks[unit.getUUID()] && unit.getBattleValueC3Type());
        const c3Bonus = (unit: TagUnit) => {
            const member = networked.find((entry) => entry === unit);
            if (!member) return 0;
            const network = networked.filter((entry) => c3Networks[entry.getUUID()] === c3Networks[member.getUUID()]);
            return getBattleValueC3Share(edition, member.getBattleValueC3Type(), withTag(member), sum(network, withTag), network.length,
                member.getBattleValueC3Part(edition).weapons, network.flatMap((entry) => entry.getBattleValueC3Part(edition).systems));
        };
        return sum(this._tagUnits(), (unit) => unit.getPilotAdjustedBattleValue(edition, tagBonus(unit) + c3Bonus(unit)))
            + sum(this.capitalShips, (ship) => ship.getPilotAdjustedBattleValue(edition))
            + sum([...this.infantry, ...this.battleArmor], (unit) => unit.getSkillAdjustedBattleValue(edition))
            + sum(this.protoMechs, (point) => point.getSkillAdjustedPointBattleValue(edition))
            + sum(this.microMechs, (micro) => micro.getSkillAdjustedBattleValue(edition))
            // A Walker's provisional Battle Value with its pilot's skills, on the 'Mech skill table (Chunk F, ours).
            + sum(this.walkers, (walker) => walker.getSkillAdjustedBattleValue(edition));
    }

    /** The Battle Value unit types the group holds (buildings and Battledroids units have no BV). */
    public getBattleValueUnitTypes(): BattleValueUnitType[] {
        // A Support Vehicle aircraft sits with the fighters but has BV2 only.
        const aircraft = this.fighters.filter((fighter) => fighter.isSupportVehicle());
        const fighters = this.fighters.filter((fighter) => !fighter.isSupportVehicle());
        const lists: Array<[BattleValueUnitType, unknown[]]> = [["mech", this.members], ["vehicle", this.vehicles], ["fighter", fighters], ["support-aircraft", aircraft],
            ["small-craft", this.smallCraft], ["capital-ship", this.capitalShips], ["infantry", this.infantry], ["battle-armor", this.battleArmor], ["protomech", this.protoMechs], ["mech", this.microMechs], ["walker", this.walkers]];
        return lists.filter(([, units]) => units.length > 0).map(([type]) => type);
    }

    /** The group's skill-adjusted Battle Value text under `edition` (plan ruling 1), in `force` (see getTotalBattleValue). */
    public getBattleValueText(edition: string, force?: BattleMechGroup[], c3Networks?: Record<string, string>): string {
        return formatBattleValue((bvEdition) => this.getTotalBattleValue(bvEdition, force, c3Networks), this.getBattleValueUnitTypes(), edition);
    }

	public getTotalTons(): number {
        let rv = 0;

        for( const unit of this.members ) {
            rv += unit.getTonnage();
        }
        for( const vehicle of this.vehicles ) {
            rv += vehicle.getTonnage();
        }
        for( const fighter of this.fighters ) {
            rv += fighter.getTonnage();
        }
        for( const craft of this.smallCraft ) {
            rv += craft.getTonnage();
        }
        for( const ship of this.capitalShips ) {
            rv += ship.getTonnage();
        }
        // Infantry count by their transport weight (TM p. 155).
        for( const platoon of this.infantry ) {
            rv += platoon.getWeight();
        }
        // Battle armor takes 1 ton of cargo space for each trooper (Battle Armor Organization/Weight Table, TW p.214).
        for( const squad of this.battleArmor ) {
            rv += squad.getSquadSize();
        }
        for( const point of this.protoMechs ) {
            rv += point.getTons() * point.getPointSize();
        }
        for( const micro of this.microMechs ) {
            rv += micro.getTons();
        }
        for( const walker of this.walkers ) {
            rv += walker.getTons();
        }

        return rv;
    }

	getTech(): string {
        let rv = "";

        const techNames = [
            ...[...this.members, ...this.vehicles, ...this.fighters, ...this.smallCraft, ...this.capitalShips].map( (unit) => unit.getTech().name ),
            ...this.infantry.map( (platoon) => platoon.getTechName() ),
            ...this.battleArmor.map( (squad) => squad.isMixedTech() ? "Mixed" : squad.isClan() ? "Clan" : "Inner Sphere" ),
            ...this.protoMechs.map( (point) => point.hasInterfaceCockpit() ? "Mixed" : "Clan" ),
            ...this.microMechs.map( () => "Inner Sphere" ),
            ...this.walkers.map( (walker) => walker.getTechTag() === "clan" ? "Clan" : "Inner Sphere" ),
            ...this.buildings.map( (building) => building.getTech().name ),
            ...this.battledroidsUnits.map( () => "Battledroids" ),
        ];
        for( const tech of techNames ) {
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
		for( const unit of importObj.units) {
			const theUnit = new BattleMech( JSON.stringify(unit) );
			this.members.push( theUnit );
		}
		// Vehicles in a saved group may come from someone else's backup: a list only, capped.
		const vehicles = Array.isArray(importObj.vehicles) ? importObj.vehicles.slice(0, MAX_GROUP_VEHICLES) : [];
		for( const vehicle of vehicles ) {
			// Skip entries that are not saved vehicles rather than adding blank default vehicles.
			if( vehicle && typeof vehicle === "object" && !Array.isArray(vehicle) ) {
				this.vehicles.push( new Vehicle( JSON.stringify(vehicle) ) );
			}
		}
		// Fighters likewise: a capped list, read through the fighter's own validating import.
		const fighters = Array.isArray(importObj.fighters) ? importObj.fighters.slice(0, MAX_GROUP_FIGHTERS) : [];
		for( const fighter of fighters ) {
			if( fighter && typeof fighter === "object" && !Array.isArray(fighter) ) {
				this.fighters.push( new AerospaceFighter( JSON.stringify(fighter) ) );
			}
		}
		const capitalShips = Array.isArray(importObj.capitalShips) ? importObj.capitalShips.slice(0, MAX_GROUP_CAPITAL_SHIPS) : [];
		for( const ship of capitalShips ) {
			if( ship && typeof ship === "object" && !Array.isArray(ship) ) {
				this.capitalShips.push( new CapitalShip( JSON.stringify(ship) ) );
			}
		}
		// Small Craft likewise: a capped list, read through the craft's own validating import.
		const smallCraft = Array.isArray(importObj.smallCraft) ? importObj.smallCraft.slice(0, MAX_GROUP_SMALL_CRAFT) : [];
		for( const craft of smallCraft ) {
			if( craft && typeof craft === "object" && !Array.isArray(craft) ) {
				this.smallCraft.push( new SmallCraft( JSON.stringify(craft) ) );
			}
		}
		// Infantry platoons likewise.
		const infantry = Array.isArray(importObj.infantry) ? importObj.infantry.slice(0, MAX_GROUP_INFANTRY) : [];
		for( const platoon of infantry ) {
			if( platoon && typeof platoon === "object" && !Array.isArray(platoon) ) {
				this.infantry.push( new InfantryPlatoon( JSON.stringify(platoon) ) );
			}
		}
		// Battle armor squads likewise.
		const battleArmor = Array.isArray(importObj.battleArmor) ? importObj.battleArmor.slice(0, MAX_GROUP_BATTLE_ARMOR) : [];
		for( const squad of battleArmor ) {
			if( squad && typeof squad === "object" && !Array.isArray(squad) ) {
				this.battleArmor.push( new BattleArmor( JSON.stringify(squad) ) );
			}
		}
		// ProtoMech Points likewise.
		const protoMechs = Array.isArray(importObj.protoMechs) ? importObj.protoMechs.slice(0, MAX_GROUP_PROTOMECHS) : [];
		for( const point of protoMechs ) {
			if( point && typeof point === "object" && !Array.isArray(point) ) {
				this.protoMechs.push( new ProtoMech( JSON.stringify(point) ) );
			}
		}
		// Micro-Mechs likewise, read through their own validating import; an entry that is not one is skipped.
		const microMechs = Array.isArray(importObj.microMechs) ? importObj.microMechs.slice(0, MAX_GROUP_MICRO_MECHS) : [];
		for( const micro of microMechs ) {
			if( micro && typeof micro === "object" && !Array.isArray(micro) ) {
				this.microMechs.push( new MicroMech( JSON.stringify(micro) ) );
			}
		}
		// Walkers likewise, read through their own validating import; an entry that is not one is skipped.
		const walkers = Array.isArray(importObj.walkers) ? importObj.walkers.slice(0, MAX_GROUP_WALKERS) : [];
		for( const entry of walkers ) {
			const { walker } = normalizeWalkerExport(entry);
			if( walker ) {
				this.walkers.push( new Walker( JSON.stringify(walker) ) );
			}
		}
		// Buildings likewise.
		const buildings = Array.isArray(importObj.buildings) ? importObj.buildings.slice(0, MAX_GROUP_BUILDINGS) : [];
		for( const building of buildings ) {
			if( building && typeof building === "object" && !Array.isArray(building) ) {
				this.buildings.push( new Building( JSON.stringify(building) ) );
			}
		}
		// Battledroids units likewise; an entry that names no known design is skipped.
		const battledroidsUnits = Array.isArray(importObj.battledroidsUnits) ? importObj.battledroidsUnits.slice(0, MAX_GROUP_BATTLEDROIDS_UNITS) : [];
		for( const unit of battledroidsUnits ) {
			if( unit && typeof unit === "object" && !Array.isArray(unit) && findBattledroidsUnitDesign(unit.design) ) {
				this.battledroidsUnits.push( new BattledroidsUnit( JSON.stringify(unit) ) );
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
        const returnValue: ICBTGroupExport = {
			name: this.customName,
			units: [],
            uuid: this.uuid,
			lastUpdated: new Date(),
			groupLabel: this.groupLabel,
			vehicles: this.vehicles.map( (vehicle) => vehicle.export(noInPlayVariabless) ),
			fighters: this.fighters.map( (fighter) => fighter.export(noInPlayVariabless) ),
			infantry: this.infantry.map( (platoon) => platoon.export(noInPlayVariabless) ),
			buildings: this.buildings.map( (building) => building.export(noInPlayVariabless) ),
			// Left out when there are none, so groups saved without them stay as they were.
			...(this.battleArmor.length > 0 ? { battleArmor: this.battleArmor.map( (squad) => squad.export(noInPlayVariabless) ) } : {}),
			...(this.protoMechs.length > 0 ? { protoMechs: this.protoMechs.map( (point) => point.export(noInPlayVariabless) ) } : {}),
			...(this.microMechs.length > 0 ? { microMechs: this.microMechs.map( (micro) => micro.export() ) } : {}),
			...(this.walkers.length > 0 ? { walkers: this.walkers.map( (walker) => walker.export(noInPlayVariabless) ) } : {}),
			...(this.smallCraft.length > 0 ? { smallCraft: this.smallCraft.map( (craft) => craft.export(noInPlayVariabless) ) } : {}),
			...(this.capitalShips.length > 0 ? { capitalShips: this.capitalShips.map( (ship) => ship.export(noInPlayVariabless) ) } : {}),
			...(this.battledroidsUnits.length > 0 ? { battledroidsUnits: this.battledroidsUnits.map( (unit) => unit.export(noInPlayVariabless) ) } : {}),
		}

		for( const unit of this.members ) {
			const exportUnit = unit.export(noInPlayVariabless);
			if( exportUnit ) {
				returnValue.units.push( exportUnit );
			}
		}

        return returnValue;
    }

	public getTotalUnits(): number {
        return this.members.length + this.vehicles.length + this.fighters.length + this.smallCraft.length + this.capitalShips.length + this.infantry.length + this.battleArmor.length + this.protoMechs.length + this.microMechs.length + this.walkers.length + this.buildings.length + this.battledroidsUnits.length;
    }

}