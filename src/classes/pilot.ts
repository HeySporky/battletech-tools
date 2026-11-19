import { CONST_AS_PILOT_ABILITIES, IASPilotAbility } from "../data/alpha-strike-pilot-abilities";

export interface IPilot {
    name: string;
    piloting: number;
    gunnery: number;
    wounds: number;
    alphaStrikeAbilities: number[];
    /** Clan enhanced imaging neural implants (IO:AE p.69); older saves leave it out. */
    eiImplants?: boolean;
}

export default class Pilot {
    name: string = "";
    piloting: number = 5;
    gunnery: number = 4;
    wounds: number = 0;
    alphaStrikeAbilities: number[] = [];
    eiImplants: boolean = false;

    constructor(importObj: IPilot | null = null ) {
        if( importObj ) {
            this.import(importObj);
        }

    }

    import(importObj: IPilot | null = null  ) {
        // Crews come back from saves and other people's backups: keep only well-formed values
        // (text name, whole skills 0-8, a list of ability ids).
        const skill = (value: unknown, fallback: number) =>
            typeof value === "number" && Number.isFinite(value) ? Math.min(8, Math.max(0, Math.round(value))) : fallback;
        if( importObj ) {
            if( typeof importObj.name === "string" ) {
                this.name = importObj.name;
            }
            this.piloting = skill(importObj.piloting, this.piloting);
            this.gunnery = skill(importObj.gunnery, this.gunnery);
            // Wounds are exported, so they are read back: whole, 0 to 6 (the sixth kills the MechWarrior).
            if( typeof importObj.wounds === "number" && Number.isFinite(importObj.wounds) ) {
                this.wounds = Math.min(6, Math.max(0, Math.floor(importObj.wounds)));
            }
            if( Array.isArray(importObj.alphaStrikeAbilities) ) {
                this.alphaStrikeAbilities = importObj.alphaStrikeAbilities.filter((id): id is number => typeof id === "number" && Number.isFinite(id));
            }
            this.eiImplants = importObj.eiImplants === true;
        }
    }

    getASAbilities(): IASPilotAbility[] {
        const rv: IASPilotAbility[] = [];

        for( const id of this.alphaStrikeAbilities ) {
            for( const abi of CONST_AS_PILOT_ABILITIES) {
                if( abi.id === id ) {
                    rv.push( abi );
                    break;
                }
            }
        }

        return rv;
    }


    export(): IPilot {
        const rv: IPilot = {
            name: this.name,
            piloting: this.piloting,
            gunnery: this.gunnery,
            wounds: this.wounds,
            alphaStrikeAbilities: this.alphaStrikeAbilities,
            eiImplants: this.eiImplants,
        }

        return rv;
    }


}
