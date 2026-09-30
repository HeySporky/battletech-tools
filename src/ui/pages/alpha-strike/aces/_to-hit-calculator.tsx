import React, { type JSX } from 'react';
import {
    calculateAcesToHit,
    IAcesToHitInput,
    TAcesAttackType,
    TAcesMovementMode,
} from '../../../../classes/aces-helpers';

const movementModes: { id: TAcesMovementMode, label: string }[] = [
    { id: "standstill", label: "Stood still" },
    { id: "ground", label: "Ground move" },
    { id: "jump", label: "Jumped" },
    { id: "immobile", label: "Immobile" },
];

const attackTypes: { id: TAcesAttackType, label: string }[] = [
    { id: "weapon", label: "Weapon attack" },
    { id: "indirect", label: "Indirect fire" },
    { id: "charge", label: "Charge" },
    { id: "dfa", label: "Death from above" },
    { id: "anti-mech", label: "Anti-'Mech (infantry)" },
];

const targetTypes = [ "BM", "IM", "PM", "CV", "SV", "BA", "CI", "AF", "CF" ];

/**
 * Target number helper for Alpha Strike with the Aces additions (ASCE p.44; Aces pp.3-6, 18). It adds up
 * modifiers from the numbers entered; line of sight and range are still measured on the table.
 */
export default class AcesToHitCalculator extends React.Component<IAcesToHitCalculatorProps, IAcesToHitCalculatorState> {
    constructor(props: IAcesToHitCalculatorProps) {
        super(props);
        this.state = {
            input: {
                skill: props.skill === undefined ? 4 : props.skill,
                rangeInches: 12,
                attackType: "weapon",
                attackerMovement: "ground",
                targetType: "BM",
                targetTMM: 1,
                targetMovement: "ground",
                automatedAttacker: !!props.automatedAttacker,
            },
            spotterMovement: "standstill",
            spotterAttacking: false,
            spotterRange: 12,
            spotterIsInfantry: false,
        }
    }

    private _set = ( changes: Partial<IAcesToHitInput> ) => {
        this.setState({
            input: { ...this.state.input, ...changes },
        });
    }

    private _number = ( value: string ): number => {
        const rv = +value;
        return isNaN( rv ) ? 0 : rv;
    }

    private _check = ( label: string, key: keyof IAcesToHitInput ): JSX.Element => {
        return (
            <label>
                <input
                    type="checkbox"
                    checked={!!this.state.input[key]}
                    onChange={( e ) => this._set( { [key]: e.currentTarget.checked } as Partial<IAcesToHitInput> )}
                />
                {" "}{label}
            </label>
        );
    }

    render = (): JSX.Element => {
        const input: IAcesToHitInput = { ...this.state.input };
        if( input.attackType === "indirect" ) {
            input.spotter = {
                movement: this.state.spotterMovement,
                alsoAttacking: this.state.spotterAttacking,
                rangeToTargetInches: this.state.spotterRange,
                isInfantry: this.state.spotterIsInfantry,
            };
        }
        const result = calculateAcesToHit( input );
        const isPhysical = input.attackType === "charge" || input.attackType === "dfa" || input.attackType === "anti-mech";

        return (
            <div className="aces-to-hit">
                <div className="row">
                    <div className="col-lg-4">
                        <fieldset className="fieldset">
                            <legend>Attack</legend>
                            <label>Type:{" "}
                                <select value={input.attackType} onChange={( e ) => this._set( { attackType: e.currentTarget.value as TAcesAttackType } )}>
                                    {attackTypes.map( ( type ) => <option key={type.id} value={type.id}>{type.label}</option> )}
                                </select>
                            </label>
                            <label>Skill:{" "}
                                <input type="number" className="aces-number" value={input.skill} onChange={( e ) => this._set( { skill: this._number( e.currentTarget.value ) } )} />
                            </label>
                            {!isPhysical ? (
                                <label>Range (inches):{" "}
                                    <input type="number" className="aces-number" value={input.rangeInches} onChange={( e ) => this._set( { rangeInches: this._number( e.currentTarget.value ) } )} />
                                </label>
                            ) : null}
                            {this._check( "Automated (Aces) attacker", "automatedAttacker" )}
                            {this._check( "Secondary target", "secondaryTarget" )}
                        </fieldset>
                    </div>
                    <div className="col-lg-4">
                        <fieldset className="fieldset">
                            <legend>Attacker</legend>
                            <label>Movement:{" "}
                                <select value={input.attackerMovement} onChange={( e ) => this._set( { attackerMovement: e.currentTarget.value as TAcesMovementMode } )}>
                                    {movementModes.map( ( mode ) => <option key={mode.id} value={mode.id}>{mode.label}</option> )}
                                </select>
                            </label>
                            <label>Fire control hits:{" "}
                                <input type="number" className="aces-number" value={input.attackerFireControlHits || 0} onChange={( e ) => this._set( { attackerFireControlHits: this._number( e.currentTarget.value ) } )} />
                            </label>
                            <label>Heat:{" "}
                                <input type="number" className="aces-number" value={input.attackerHeat || 0} onChange={( e ) => this._set( { attackerHeat: this._number( e.currentTarget.value ) } )} />
                            </label>
                            {this._check( "Infantry (BA or CI)", "attackerIsInfantry" )}
                            {this._check( "Conventional infantry", "attackerIsConventionalInfantry" )}
                            {this._check( "Emplacement", "attackerIsEmplacement" )}
                            {this._check( "Also spotting for indirect fire", "attackerIsSpotting" )}
                        </fieldset>
                    </div>
                    <div className="col-lg-4">
                        <fieldset className="fieldset">
                            <legend>Target</legend>
                            <label>Type:{" "}
                                <select value={input.targetType} onChange={( e ) => this._set( { targetType: e.currentTarget.value } )}>
                                    {targetTypes.map( ( type ) => <option key={type} value={type}>{type}</option> )}
                                </select>
                            </label>
                            <label>Movement:{" "}
                                <select value={input.targetMovement} onChange={( e ) => this._set( { targetMovement: e.currentTarget.value as TAcesMovementMode } )}>
                                    {movementModes.map( ( mode ) => <option key={mode.id} value={mode.id}>{mode.label}</option> )}
                                </select>
                            </label>
                            <label>TMM:{" "}
                                <input type="number" className="aces-number" value={input.targetTMM} onChange={( e ) => this._set( { targetTMM: this._number( e.currentTarget.value ) } )} />
                            </label>
                            {input.targetMovement === "jump" ? (
                                <label title="JMPS# as a positive number, JMPW# as a negative number">JMPS/JMPW adjustment:{" "}
                                    <input type="number" className="aces-number" value={input.targetJumpAdjustment || 0} onChange={( e ) => this._set( { targetJumpAdjustment: this._number( e.currentTarget.value ) } )} />
                                </label>
                            ) : null}
                            {this._check( "Woods", "woods" )}
                            {this._check( "Partial cover", "partialCover" )}
                            {this._check( "Large", "targetIsLarge" )}
                            {this._check( "Airborne VTOL", "targetIsAirborneVTOL" )}
                            {this._check( "Emplacement", "targetIsEmplacement" )}
                            {this._check( "Carrying battle armor", "targetCarryingBattleArmor" )}
                        </fieldset>
                    </div>
                </div>

                {input.attackType === "indirect" ? (
                    <fieldset className="fieldset">
                        <legend>Spotter</legend>
                        <div className="aces-inline">
                            <label>Movement:{" "}
                                <select value={this.state.spotterMovement} onChange={( e ) => this.setState( { spotterMovement: e.currentTarget.value as TAcesMovementMode } )}>
                                    {movementModes.map( ( mode ) => <option key={mode.id} value={mode.id}>{mode.label}</option> )}
                                </select>
                            </label>
                            <label>Range to target (inches):{" "}
                                <input type="number" className="aces-number" value={this.state.spotterRange} onChange={( e ) => this.setState( { spotterRange: this._number( e.currentTarget.value ) } )} />
                            </label>
                            <label>
                                <input type="checkbox" checked={this.state.spotterAttacking} onChange={( e ) => this.setState( { spotterAttacking: e.currentTarget.checked } )} />
                                {" "}Spotter also attacks
                            </label>
                            <label>
                                <input type="checkbox" checked={this.state.spotterIsInfantry} onChange={( e ) => this.setState( { spotterIsInfantry: e.currentTarget.checked } )} />
                                {" "}Spotter is infantry
                            </label>
                        </div>
                        <p className="aces-muted">Woods and partial cover are judged from the spotter's line of sight.</p>
                    </fieldset>
                ) : null}

                <table className="table tighter-padding">
                    <tbody>
                        {result.modifiers.map( ( modifier, index ) => (
                            <tr key={index}>
                                <td>{modifier.label}</td>
                                <td className="text-right">{modifier.value > 0 ? "+" : ""}{modifier.value}</td>
                            </tr>
                        ) )}
                        <tr>
                            <th>Target number{result.rangeBracket ? " (" + result.rangeBracket + " range)" : ""}</th>
                            <th className="text-right">{result.allowed ? result.targetNumber + "+" : "Not allowed"}</th>
                        </tr>
                    </tbody>
                </table>
                {result.notes.length > 0 ? (
                    <ul className="aces-muted">
                        {result.notes.map( ( note, index ) => <li key={index}>{note}</li> )}
                    </ul>
                ) : null}
            </div>
        );
    }
}

interface IAcesToHitCalculatorProps {
    skill?: number;
    automatedAttacker?: boolean;
}

interface IAcesToHitCalculatorState {
    input: IAcesToHitInput;
    spotterMovement: TAcesMovementMode;
    spotterAttacking: boolean;
    spotterRange: number;
    spotterIsInfantry: boolean;
}
