import React from 'react';
import { AlphaStrikeUnit, IASAttack } from '../../classes/alpha-strike-unit';
import { IASPilotAbility } from '../../data/alpha-strike-pilot-abilities';
import { IASSpecialAbility } from '../../data/alpha-strike-special-abilities';
import { IAppGlobals } from '../app-router';
import './alpha-strike-play-card.scss';
import { FaDice, FaDiceFive, FaDiceFour, FaDiceOne, FaDiceSix, FaDiceThree, FaDiceTwo, FaShieldVirus } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { CONST_AS_OPFOR_BEHAVIORS, OpForBehavior } from '../../data/bryms-opfor-behaviors';
import { GiCartwheel } from 'react-icons/gi';

export default class AlphaStrikeUnitCard extends React.Component<IAlphaStrikeUnitCardProps, IAlphaStrikeUnitCardState> {

    constructor(props: IAlphaStrikeUnitCardProps) {
        super(props);
        this.state = {
            showTakeDamage: false,
            showMovementOptions: false,
            showAttackOverlay: null,
            showCriticalOverlay: null,
            showMotiveOverlay: null,
        }
    }

    private _toggleTakeDamage = () => {
        this.setState({
            showTakeDamage: !this.state.showTakeDamage,
        })
    }

    private _toggleMovementOptions = () => {
        if (this.props.asUnit && !this.props.asUnit.immobile) {
            this.setState({
                showMovementOptions: !this.state.showMovementOptions,
            })
        }
    }

    private _setMovement = (label: string, tmm: number = 0): void => {
        if( this.props.asUnit ) {
            this.props.asUnit.moveToken = {
                move: 0,
                currentMove: 0,
                currentSprint: 0,
                type: label,
                tmm: tmm
            };
            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
        this.setState({
            showMovementOptions: false,
        })
    }

    private _takeDamage = ( damageTaken: number ): void => {
        if(this.props.asUnit ) {
            this.props.asUnit.takeDamage( damageTaken );
            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
        this.setState({
            showTakeDamage: false,
        })
    }

    private _toggleArmorOrStructure = ( target: string, indexNumber: number ) => {
        if( this.props.asUnit ) {
            if( target === "armor" ) {
                if( this.props.asUnit.roundArmor.length > indexNumber) {
                    this.props.asUnit.roundArmor[indexNumber] = !this.props.asUnit.roundArmor[indexNumber];
                }

            } else {
                if( this.props.asUnit.roundStructure.length > indexNumber) {
                    this.props.asUnit.roundStructure[indexNumber] = !this.props.asUnit.roundStructure[indexNumber];
                }
            }
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
    }

    private _toggleEngineHit = ( reset: boolean = false ) => {
        if(this.props.asUnit ) {
  
            if (this.props.asUnit.roundEngineHits < 2) {
                this.props.asUnit.roundEngineHits += 1;
            } else if (reset) {
                this.props.asUnit.roundEngineHits = 0;
            }

            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
    }

    private _setHeat = ( newValue: number ) => {
        if(this.props.asUnit ) {
            if (this.props.asUnit.roundHeat !== newValue) {
                this.props.asUnit.roundHeat = newValue;
            } else {
                this.props.asUnit.roundHeat = 0;
            }

            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
    }

    private _toggleWeaponHit = ( reset: boolean = false ) => {
        if(this.props.asUnit ) {

            if (this.props.asUnit.roundWeaponHits < this.props.asUnit.maxWeaponHits) {
                this.props.asUnit.roundWeaponHits += 1;
            } else if (reset) {
                this.props.asUnit.roundWeaponHits = 0;
            } else {
                this._takeDamage(1);
            }

            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
    }

    private _toggleVehicle910 = (rollover : boolean = true): void =>  {
        if(this.props.asUnit) {
            let max = this.props.asUnit.move[0].move / 2;
            if (this.props.asUnit.roundVehicleMotive910 < max) {   
                this.props.asUnit.roundVehicleMotive910++;
            } else if (rollover) {
                this.props.asUnit.roundVehicleMotive910 = 0;
            }

            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
    }

    private _toggleVehicle11 = (rollover : boolean = true): void =>  {
        if(this.props.asUnit) {
            let max = this.props.asUnit.move[0].move / 2;
            if (this.props.asUnit.roundVehicleMotive11 < max) {   
                this.props.asUnit.roundVehicleMotive11++;
            } else if (rollover) {
                this.props.asUnit.roundVehicleMotive11 = 0;
            }

            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
    }

    private _toggleVehicle12 = (rollover : boolean = true): void => {
        if(this.props.asUnit ) {

            this.props.asUnit.roundVehicleMotive12 = rollover ? !this.props.asUnit.roundVehicleMotive12 : true;
            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );

        }
    }

    private _toggleFireControlHit = ( reset: boolean = false ): void => {
        if(this.props.asUnit ) {

            if (this.props.asUnit.roundFireControlHits < 6) {
                console.log('add one');
                this.props.asUnit.roundFireControlHits += 1;
            } else if (reset) {
                this.props.asUnit.roundFireControlHits = 0;
            } else {
                this._takeDamage(1);
            }
            console.log(this.props.asUnit.name, this.props.asUnit.roundFireControlHits);

            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
    }

    private _toggleMPHit = ( reset: boolean = false ): void => {
        if(this.props.asUnit ) {

            if (this.props.asUnit.roundMpControlHits < this.props.asUnit.maxMPHits) {
                this.props.asUnit.roundMpControlHits++;
            } else if (reset) {
                this.props.asUnit.roundMpControlHits = 0;
            } else {
                this._takeDamage(1);
            }

            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
    }

    private _adjustAltitude = (e: React.MouseEvent, amount: number ): void => {
        if (this.props.asUnit && this.props.asUnit.altitude + amount >= 0) {
            amount = e.shiftKey ? amount*5 : amount;
            amount = e.ctrlKey ? amount*10 : amount;
            this.props.asUnit.altitude += amount;
            
            if (this.props.asUnit.altitude < 0) {
                this.props.asUnit.altitude = 0;
            }

            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
    }

    private _rollCritical = (): void => {
        if (this.state.showCriticalOverlay) {
            this.setState({
                showCriticalOverlay: null,
            });
        } else {
            // Roll a crit
            if (this.props.asUnit && !this.props.asUnit.isWrecked()) {
                let result = 'No Critical';
                let roll1 = Math.ceil(Math.random()*6);
                let roll2 = Math.ceil(Math.random()*6);

                let roll = roll1 + roll2;

                if (this.props.asUnit.type.toLowerCase() === 'bm' || this.props.asUnit.type.toLowerCase() === 'im') {
                    switch (roll) {
                        case 2:
                            result = 'Ammo';
                            this._ammoHit();
                            break;
                        case 3:
                            result = 'Engine';
                            this._toggleEngineHit();
                            break;
                        case 4:
                            result = 'Fire Control';
                            this._toggleFireControlHit();
                            break;
                        case 5:
                            result = 'No Critical';
                            break;
                        case 6:
                            result = 'Weapon';
                            this._toggleWeaponHit();
                            break;
                        case 7:
                            result = 'MP';
                            this._toggleMPHit();
                            break;
                        case 8:
                            result = 'Weapon';
                            this._toggleWeaponHit();
                            break;
                        case 9:
                            result = 'No Critical';
                            break;
                        case 10:
                            result = 'Fire Control';
                            this._toggleFireControlHit();
                            break;
                        case 11:
                            result = 'Engine';
                            this._toggleEngineHit();
                            break;
                        case 12:
                            result = 'Unit Destroyed';
                            this._unitDestroyed();
                            break;
                    }
                } else if (this.props.asUnit.type.toLowerCase() === 'pm') {
                    switch (roll) {
                        case 2:
                            result = 'Weapon';
                            this._toggleWeaponHit();
                            break;
                        case 3:
                            result = 'Weapon';
                            this._toggleWeaponHit();
                            break;
                        case 4:
                            result = 'Fire Control';
                            this._toggleFireControlHit();
                            break;
                        case 5:
                            result = 'Movement';
                            this._toggleMPHit();
                            break;
                        case 6:
                            result = 'No Critical';
                            break;
                        case 7:
                            result = 'Movement';
                            this._toggleMPHit();
                            break;
                        case 8:
                            result = 'No Critical';
                            break;
                        case 9:
                            result = 'Movement';
                            this._toggleMPHit();
                            break;
                        case 10:
                            result = 'Unit Destroyed';
                            this._unitDestroyed();
                            break;
                        case 11:
                            result = 'Weapon';
                            this._toggleWeaponHit();
                            break;
                        case 12:
                            result = 'Weapon';
                            this._toggleWeaponHit();
                            break;
                    }
                } else if (this.props.asUnit.type.toLowerCase() === 'cv' || this.props.asUnit.type.toLowerCase() === 'sv') {
                    switch (roll) {
                        case 2:
                            result = 'Ammo';
                            this._ammoHit();
                            break;
                        case 3:
                            result = 'Crew Stunned';
                            break;
                        case 4:
                            result = 'Fire Control';
                            this._toggleFireControlHit();
                            break;
                        case 5:
                            result = 'Fire Control';
                            this._toggleFireControlHit();
                            break;
                        case 6:
                            result = 'No Critical';
                            break;
                        case 7:
                            result = 'No Critical';
                            break;
                        case 8:
                            result = 'No Critical';
                            break;
                        case 9:
                            result = 'Weapon';
                            this._toggleWeaponHit();
                            break;
                        case 10:
                            result = 'Weapon';
                            this._toggleWeaponHit();
                            break;
                        case 11:
                            result = 'Unit Destroyed';
                            this._unitDestroyed();
                            break;
                        case 12:
                            result = 'Engine';
                            this._toggleEngineHit();
                            break;
                    }
                } else if (this.props.asUnit.isAerospace) {
                    switch (roll) {
                        case 2:
                            result = 'Unit Destroyed';
                            this._unitDestroyed();
                            break;
                        case 3:
                            result = 'Fire Control';
                            this._toggleFireControlHit();
                            break;
                        case 4:
                            result = 'Engine';
                            this._toggleEngineHit();
                            break;
                        case 5:
                            result = 'Weapon';
                            this._toggleWeaponHit();
                            break;
                        case 6:
                            result = 'No Critical';
                            break;
                        case 7:
                            result = 'No Critical';
                            break;
                        case 8:
                            result = 'No Critical';
                            break;
                        case 9:
                            result = 'Weapon';
                            this._toggleWeaponHit();
                            break;
                        case 10:
                            result = 'Engine';
                            this._toggleEngineHit();
                            break;
                        case 11:
                            result = 'Fire Control';
                            this._toggleFireControlHit();
                            break;
                        case 12:
                            result = 'Unit Destroyed';
                            this._unitDestroyed();
                            break;
                    }
                }

                this.setState({
                    showCriticalOverlay: {
                        roll1: roll1,
                        roll2: roll2,
                        result: result,
                    },
                })
            }
        }
    }

    private _ammoHit = (): void => {
        if (this.props.asUnit) {
            if (this.props.asUnit.hasAbility('CASEII') || this.props.asUnit.hasAbility('ENE')) {
                // Do nothing!
            } else if (this.props.asUnit.hasAbility('CASE')) {
                this._takeDamage(1);
            } else {
                this._unitDestroyed();
            }
        }
    }

    private _unitDestroyed = (): void => {
        this._takeDamage(100);
    }

    private _rollMotive = () : void => {
        if (this.state.showMotiveOverlay) {
            this.setState({
                showMotiveOverlay: null,
            });
        } else if(this.props.asUnit && !this.props.asUnit.isWrecked()) {
            let result = 'No Hit';
            let roll1 = Math.ceil(Math.random()*6);
            let roll2 = Math.ceil(Math.random()*6);

            let roll = roll1 + roll2;
            if (this.props.asUnit.hasAbility('ARS')) {
                roll += -1;
            }
            if (this.props.asUnit.move[0].type.toLowerCase() === 'v' || this.props.asUnit.move[0].type.toLowerCase() === 'g') {
                roll += 2;
            } else if (this.props.asUnit.move[0].type.toLowerCase().indexOf('w') > -1 || this.props.asUnit.move[0].type.toLowerCase() === 'h') {
                roll += 1;
            }

            if (roll > 11) {
                this._toggleVehicle12(false);
                result = 'Unit Immobilized';
            } else if (roll > 10) {
                this._toggleVehicle11(false);
                result = '-50% move, -50% TMM';
            } else if (roll > 8) {
                this._toggleVehicle910(false);
                result = this.props.measurementsInHexes ? '-1 hex move, -1 TMM' : '-2" move, -1 TMM';
            }

            this.setState({
                showMotiveOverlay: {
                    roll1: roll1,
                    roll2: roll2,
                    result: result,
                }
            });
        }
    }

    private _showPilotAbility = (
        e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
        ability: IASPilotAbility | null,
    ) => {
        if( e && e.preventDefault ) e.preventDefault();

        if( this.props.showPilotAbility && ability ) {
            this.props.showPilotAbility( ability );
        }
    }

    private _ApplyNow = (): void => {
        this.props.appGlobals.openConfirmDialog(
        "Apply Changes to " + this.props.asUnit?.name,
        "This will apply all the staged changes to this unit's state.",
        "Apply",
        "Cancel",
        () => {
            if (this.props.asUnit) {
                this.props.asUnit.applyRound();
            }
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
        )
    }

    private _clearChanges = (): void => {
        if (this.props.asUnit) {
            this.props.asUnit.roundHeat = this.props.asUnit.currentHeat;
            this.props.asUnit.roundArmor = [];
            this.props.asUnit.roundStructure = [];
            this.props.asUnit.roundEngineHits = this.props.asUnit.engineHits;
            this.props.asUnit.roundFireControlHits = 0;
            this.props.asUnit.roundMpControlHits = 0;
            this.props.asUnit.roundWeaponHits = this.props.asUnit.engineHits;
            this.props.asUnit.roundVehicleMotive910 = this.props.asUnit.vehicleMotive910;
            this.props.asUnit.roundVehicleMotive11 = this.props.asUnit.vehicleMotive11;
            this.props.asUnit.roundVehicleMotive12 = false;
        }
        this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
    }

    private _makeArmorDots = (
        target: string = "armor",
    ): JSX.Element[] => {
        let dots: JSX.Element[] = []
        if (this.props.asUnit) {
            let currentDots: boolean[] = [];
            let roundDots: boolean[] = [];
            if (target === 'structure') {
                currentDots = this.props.asUnit.currentStructure;
                roundDots = this.props.asUnit.roundStructure;
            } else if (target === 'armor') {
                currentDots = this.props.asUnit.currentArmor;
                roundDots = this.props.asUnit.roundArmor;
            }

            for( let count = 0; count < currentDots.length; count++ ) {
                let classes = [];
                if (currentDots[count]) {
                    classes.push('active');
                }
                if (roundDots[count]) {
                    classes.push('staged');
                }

                dots.push(
                    <button key={count}
                        className={classes.join(' ')}
                        onClick={() => this._toggleArmorOrStructure( target, count.valueOf() )}
                    ></button>
                )
            }
        }

        return dots;
    }

    private _moveToken = (type: string, tmm: number = 0): JSX.Element => {
        if (type.length < 1) {
            type = "???";
        }

        if (this.props.asUnit) {
            
            // Add a TMM for jump (JMPS and JMPW are arlready considered)
            tmm = type === 'jump' || type === 'dfa' ? tmm + 1 : tmm;

            // Add TMM for Other > Target for target type
            // Aerospace
            if (this.props.asUnit.isAerospace && type !== 'ground' && type !== 'standstill') {
                tmm += 2;
            }
            // Is aeroborne DropShip
            if (this.props.asUnit.type.toLowerCase() === 'ds' && type !== 'standstill') {
                // Actually figure out how to determine altitude. It matters.
                tmm -= 2
            }

            // Is airborne VTOL or WiGE
            if (this.props.asUnit.move[0].type === 'v' || this.props.asUnit.move[0].type === 'g') {
                // Need to do Altitude for these!!!
                if (this.props.asUnit.altitude > 0) {
                    tmm += 1;
                }
            }

            // Is Battle Armor or Protomech
            if (this.props.asUnit.type.toLowerCase() === 'ba' || this.props.asUnit.type.toLowerCase() === 'pm') {
                tmm += 1;
            }

            // is Large
            if (this.props.asUnit.hasAbility('LG') || this.props.asUnit.hasAbility('SLG') || this.props.asUnit.hasAbility('VLG')) {
                tmm -= 1;
            }

            // Is hull down
            if (type === 'hull down') {
                tmm += 1;
            }

            // Override for immobile
            if (this.props.asUnit.immobile) {
                type = 'immobile';
                tmm = -4;
            }

            return ( 
                <div className={'token ' + type.toLowerCase()} title="TMM on the token includes all target modifiers and modifiers from Other>Target except STL because it is based on range">    
                    <div className='token-inner'></div>
                    <div className='data column evenly'>
                        {type !== "???" ? (<span>{tmm} TMM*</span>) : null }
                        <div className='move-type'>{type}</div>
                        {type !== "???" ? (<span>{tmm} TMM*</span>) : null }
                    </div>
                </div>
            );
        }

        return <></>;
    }

    private _moveOptions = (unit: AlphaStrikeUnit): JSX.Element => {
        let airborne: JSX.Element[] = [];
        let ground: JSX.Element[] = [];
        let aquatic: JSX.Element[] = [];
        let attackMoves: JSX.Element[] = [];

        if (this.props.asUnit) {
            // Check for Mimetic Armor
            let standstillTMM = 0;
            if (unit.hasAbility('MAS')) {
                standstillTMM += 3;
            } else if (unit.hasAbility('lmas')) {
                standstillTMM += 2;
            }
            ground.push(
                <div key="standstill" className='token-wrapper' onClick={() => this._setMovement('standstill', standstillTMM)}>
                    {this._moveToken('standstill', standstillTMM)}
                </div>
            );

            for (let moveC of unit.move) {
                if ((this.props.asUnit.isGroundUnit() && moveC.type !== 'j' && moveC.type !== 's' && moveC.currentMove > 0) || (moveC.type === 'j' && unit.move.length === 1)) {
                    ground.push(
                        <div key="ground" className='token-wrapper' onClick={() => this._setMovement('ground', moveC.tmm)}>
                            {this._moveToken('ground', moveC.tmm)}
                        </div>
                    );
                    if (unit.isGroundUnit()) {
                        ground.push(
                            <div key="sprint" className='token-wrapper' onClick={() => this._setMovement('sprint', moveC.tmm)}>
                                {this._moveToken('sprint', moveC.tmm)}
                            </div>
                        );
                        ground.push(
                            <div key="hull-down" className='token-wrapper' onClick={() => this._setMovement('hull down')}>
                                {this._moveToken('hull down', standstillTMM)}
                            </div>
                        );
                        if (!unit.isInfantry) {
                            attackMoves.push(
                                <div key="ground" className='token-wrapper' onClick={() => this._setMovement('charge', moveC.tmm)}>
                                    {this._moveToken('charge', moveC.tmm)}
                                </div>
                            );
                        }
                    }
                }
                if (moveC.type === 'j' && moveC.currentMove > 0) {
                    ground.push(
                        <div key="jump" className='token-wrapper' onClick={() => this._setMovement('jump', moveC.tmm)}>
                            {this._moveToken('jump', moveC.tmm)}
                        </div>
                    );
                    if (!unit.isInfantry) {
                        attackMoves.push(
                            <div key="jump" className='token-wrapper' onClick={() => this._setMovement('dfa', moveC.tmm)}>
                                {this._moveToken('dfa', moveC.tmm)}
                            </div>
                        );
                    }
                }
                if (moveC.type === 'a') {
                    airborne.push(
                        <div key="low" className='token-wrapper' title='The TMM includes Other > Target Modifiers for Airborne Aerospace' onClick={() => this._setMovement('low')}>
                            {this._moveToken('low')}
                        </div>
                    );
                    airborne.push(
                        <div key="middle" className='token-wrapper' title='The TMM includes Other > Target Modifiers for Airborne Aerospace' onClick={() => this._setMovement('middle')}>
                            {this._moveToken('middle')}
                        </div>
                    );
                    airborne.push(
                        <div key="high" className='token-wrapper' title='The TMM includes Other > Target Modifiers for Airborne Aerospace' onClick={() => this._setMovement('high')}>
                            {this._moveToken('high')}
                        </div>
                    );
                    airborne.push(
                        <div key="extreme" className='token-wrapper' title='The TMM includes Other > Target Modifiers for Airborne Aerospace' onClick={() => this._setMovement('extreme')}>
                            {this._moveToken('extreme')}
                        </div>
                    );
                }
                if (moveC.type === 's') {
                    aquatic.push(
                        <div key="ground" className='token-wrapper' onClick={() => this._setMovement('ground', moveC.tmm)}>
                            {this._moveToken('ground', moveC.tmm)}
                        </div>
                    );
                    aquatic.push(
                        <div key="sprinta" className='token-wrapper' onClick={() => this._setMovement('sprint', moveC.tmm)}>
                            {this._moveToken('sprint', moveC.tmm)}
                        </div>
                    );
                }
                if (moveC.type === 'v') {
                    airborne.push(
                        <div key="standstill" className='token-wrapper' onClick={() => this._setMovement('standstill', 0)}>
                            {this._moveToken('standstill', 0)}
                        </div>
                    );
                    airborne.push(
                        <div key="ground" className='token-wrapper' onClick={() => this._setMovement('ground', moveC.tmm)}>
                            {this._moveToken('ground', moveC.tmm)}
                        </div>
                    );
                    airborne.push(
                        <div key="sprint" className='token-wrapper' onClick={() => this._setMovement('sprint', moveC.tmm)}>
                            {this._moveToken('sprint', moveC.tmm)}
                        </div>
                    );
                }
            }
        }

        return <>
            {airborne.length > 0 ? (<><h5>Airborne options</h5><div className='row center'>{airborne}</div></>) : null }
            {airborne.length + aquatic.length + attackMoves.length > 0 ? (<h5>Ground options</h5>) : null }<div className='row center'>{ground}</div>
            {aquatic.length > 0 ? (<><h5>Submersible Options</h5><div className='row center'>{aquatic}</div></>) : null }
            {attackMoves.length > 0 ? (<><h5>Attack Moves</h5><div className='row center'>{attackMoves}</div></>) : null }
            <h5>
                <button onClick={() => this._setMovement('')}>Unset</button>
            </h5>
        </>;
    }

    private _moveStats = (unit: AlphaStrikeUnit): JSX.Element[] => {
        let data: JSX.Element[] = []

        for (let moveC of unit.move) {
            let distance = this.props.measurementsInHexes ? Math.ceil(moveC.currentMove/2) : moveC.currentMove;
            let label = 'Ground';
            switch (moveC.type) {
                case 'j':
                    label = 'Jump';
                    break;
                case 'a':
                    label = 'Thrust';
                    break;
                case 'h':
                    label = 'Hover';
                    break;
                case 'g':
                    label = 'WiGE';
                    break;
                case 't':
                    label = 'Tracked';
                    break;
                case 'w':
                    label = 'Wheeled';
                    break;
                case 'n':
                    label = 'Naval';
                    break;
                case 's':
                    label = 'Sub';
                    break;
                case 'qw':
                    label = 'Quad W';
                    break;
                case 'qt':
                    label = 'Quad T';
                    break;
                case 'v':
                    label = 'VTOL';
                    break;
                case 'f':
                    label = 'Foot';
                    break;
                case 'm':
                    label = 'Motorized';
                    break;
                case 'w(b)':
                    label = 'Bicycle';
                    break;
                case 'w(m)':
                    label = 'Monocycle';
                    break;
            }

            data.push(<div key={label} title={label + ' movement in ' + (this.props.measurementsInHexes ? 'hexes' : 'inches')} className='data-pair row justified'><span>{label}</span>{distance}</div>);

            // Special case for Sprint
            if ((unit.isGroundUnit() && moveC.type !== 'j') || moveC.type === 'v') {
                data.push(<div key={moveC.type + "sprint"} title={'Sprint movement in ' + (this.props.measurementsInHexes ? 'hexes' : 'inches')} className='data-pair row justified'><span>Sprint</span>{this.props.measurementsInHexes ? Math.ceil(moveC.currentSprint/2) : moveC.currentSprint}</div>)
            }
        }

        // Special case for Aerospace
        if (unit.isAerospace && unit.abilities.length > 0) {
            if (unit.getAbilityValues('BOMB').damage > -1) {
                data.push(<div key="bombs" className='data-pair row justified'><span>Bombs</span>{unit.getAbilityValues('BOMB').damage}</div>)
            }
            if (this.props.appGlobals.appSettings.alphaStrikeCombatRolls) {
                let elevation = 0;
                switch (unit.moveToken.type) {
                    case 'low':
                        elevation = 6;
                        break;
                    case 'middle':
                        elevation = 12;
                        break;
                    case 'high':
                        elevation = 30;
                        break;
                    case 'extreme':
                        elevation = 48;
                        break;
                }
                elevation = this.props.measurementsInHexes ? elevation / 2 : elevation;
                data.push(<div key="alt" className='data-pair row justified'><span>Altitude</span>{elevation}</div>)
            }
        }

        // Add altitude for VTOLs and WiGE
        if ((unit.move[0].type === 'v' || unit.move[0].type === 'g') && this.props.appGlobals.appSettings.alphaStrikeCombatRolls) {            
            data.push(<div key="alt" className='data-pair row justified'><span>Altitude</span>{unit.altitude}</div>)
            data.push(<div key="alt-adjust" className='row alt-adjust'><button className='' onClick={(e) => this._adjustAltitude(e, -1)}>-</button><button className='' onClick={(e) => this._adjustAltitude(e, 1)}>+</button></div>)
        }

        return data;
    }

    private _getRangeValues = ( range: number = 0) => {
        let values = {
            min: 0,
            max: 6,
        }
        switch (range) {
            case 0:
                break;
            case 1:
                values = {min: 6, max: 24}
                break;
            case 2:
                values = {min: 24, max: 42}
                break;
            case 3:
                values = {min: 42, max: 0}
                break;
        }

        return values;
    }

    private _getHeightNumber = ( height: string = 'low' ) => {
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

    private _getAttacks = (unit: AlphaStrikeUnit): JSX.Element[] => {
        let attacks: JSX.Element[] = []
        
        let physicalAttacks: IASAttack[] = [];
        let weaponAttacks: IASAttack[] = [];
        let bombAttacks: IASAttack[] = []
        // Sort attacks
        for (let attack of unit.attacks) {
            if (attack.type.toLowerCase() === 'physical') {
                physicalAttacks.push(attack);
            } else if (attack.type.toLowerCase() === 'bomb') {
                bombAttacks.push(attack);
            } else {
                weaponAttacks.push(attack);
            }
        }

        if (unit.isAerospace && weaponAttacks.length > 0 && (unit.moveToken.type !== 'ground' && unit.moveToken.type !== 'standstill')) {
            let heightNumber = this._getHeightNumber(this.props.asUnit?.moveToken.type);
            let strafe = weaponAttacks[0];
            let strafeDamage = unit.hasAbility('ENE') ? strafe.damage : Math.round(strafe.damage/2);
            let strafeToHit = strafe.toHit + 3;
            attacks.push(
                <button key={'strafe'} 
                    className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'attack-button' : 'attack-button no-hover'}
                    disabled={unit.moveToken.type !== 'low'}
                    onClick={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? () => this._showAttack({
                        name: 'Strafe',
                        type: 'strafe',
                        damage: strafeDamage,
                        minimal: strafe.minimal,
                        range: 0,
                        toHit: unit.hasPilotAbility('Golden Goose') ? strafeToHit - 1 : strafeToHit,
                        disabled: unit.moveToken.type !== 'low',
                    }) : undefined }>
                    <div className='data-pair row justified'>
                        {strafeDamage + (strafe.minimal ? "*" : "")}
                        <span className='range'>Low</span>
                        <span>{strafeToHit}</span>
                    </div>
                    <div className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'button' : 'button no-hover'}>Strafe</div>
                </button>
            );
            let rangeAttack = weaponAttacks[heightNumber];
            attacks.push(
                <button key={'strike'} 
                    className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'attack-button' : 'attack-button no-hover'}
                    disabled={rangeAttack.disabled}
                    onClick={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? () => this._showAttack({
                        name: rangeAttack.name,
                        type: rangeAttack.type,
                        damage: rangeAttack.damage,
                        minimal: rangeAttack.minimal,
                        range: rangeAttack.range,
                        toHit: unit.hasPilotAbility('Golden Goose') ? rangeAttack.toHit : rangeAttack.toHit + 1, // +1 for strike
                        disabled: rangeAttack.disabled,
                    }) : undefined }>
                    <div className='row justified'>
                        {weaponAttacks.map( (attack, attackIndex) => {
                            return <div key={attackIndex} className={attack.range !== this._getHeightNumber(this.props.asUnit?.moveToken.type) ? 'data-pair disabled' : 'data-pair'}>{attack.damage}</div>;
                        })}
                    </div>
                    <div className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'button' : 'button no-hover'}>Strike</div>
                </button>
            );
            if (bombAttacks.length > 0) {
                let bombAttack = bombAttacks[heightNumber > 1 ? 1 : 0];
                attacks.push(
                    <button key={'bombs'} 
                        className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'attack-button' : 'attack-button no-hover'}
                        disabled={bombAttack.disabled}
                        onClick={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? () => this._showAttack(bombAttack) : undefined }>
                        <div className='row justified'>
                            {bombAttacks.map( (attack, attackIndex) => {
                                if (this.props.asUnit) {
                                    return <div key={attackIndex} className={attack.disabled ? 'data-pair disabled' : 'data-pair'}>{attack.damage}<span>{attack.name.match(/[A-Z]/g)?.join('')}</span></div>;
                                } else {
                                    return null;
                                }
                            })}
                        </div>
                        <div className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'button' : 'button no-hover'}>Bomb</div>
                    </button>
                );
            }

            // Air to Air needs to pass variables to the modal to let it be any range
            attacks.push(
                <button key={'airToAir'} 
                    className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'attack-button' : 'attack-button no-hover'}
                    disabled={rangeAttack.disabled}
                    onClick={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? () => this._showAttack({
                        name: 'Air to Air',
                        type: 'a2a',
                        damage: rangeAttack.damage,
                        minimal: rangeAttack.minimal,
                        range: 0,
                        toHit: rangeAttack.toHit,
                        disabled: false,
                    }) : undefined }>
                    <div className='row justified'>
                        {weaponAttacks.map( (attack, attackIndex) => {
                            return <div key={attackIndex} className={'data-pair'}>{attack.damage}</div>;
                        })}
                    </div>
                    <div className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'button' : 'button no-hover'}>Air to Air</div>
                </button>
            );
        } else {
            let disabled = 0;
            for (let attack of physicalAttacks) {
                if (!attack.disabled || disabled === physicalAttacks.length-1) {
                    attacks.push(
                        <button key={'physical'+disabled} 
                            className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'attack-button physical' : 'attack-button physical no-hover'}
                            disabled={attack.disabled}
                            onClick={() => this._showAttack(attack)}>
                            <div className='row justified'>
                                {physicalAttacks.map( (attack, attackIndex) => {
                                    return <div key={attackIndex} className={attack.disabled ? 'data-pair disabled' : 'data-pair'}>{attack.damage}{attack.minimal ? '*' : ''}<span>{attack.name.charAt(0)}</span></div>;
                                })}
                            </div>
                            <div className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'button physical' : 'button physical no-hover'}>Physical</div>
                        </button>
                    );
                } else {
                    disabled += 1;
                }
            }

            for (let attack of weaponAttacks) {
                if (attack.name.toLowerCase() !== 'extreme' || this.props.showExtreme || this.props.asUnit?.isAerospace ) {
                    let values = this._getRangeValues(attack.range);
                    let min = this.props.measurementsInHexes ? Math.ceil(values.min/2) : values.min;
                    let max = this.props.measurementsInHexes ? Math.ceil(values.max/2) : values.max;
                    let range = '';

                    if (min > 0 && !max) {
                        range += min;
                    } else {
                        range += min + '-' + max;
                    }

                    attacks.push(
                        <button key={attack.name.toLowerCase()} 
                            className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'attack-button' : 'attack-button no-hover'}
                            disabled={attack.disabled}
                            onClick={() => this._showAttack(attack)}>
                            <div className='data-pair row justified'>
                                {attack.damage + (attack.minimal ? "*" : "")}
                                <span className='range' title={this.props.measurementsInHexes ? 'range in hexes' : 'range in inches'}>{range}</span>
                                <span>{attack.toHit}</span>
                            </div>
                            <div className={this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? 'button' : 'button no-hover'}>{attack.name}</div>
                        </button>
                    );
                }
            }
        }

        return attacks;
    }

    private _showAttack = ( attack: IASAttack | null ): void => {
        this.setState(
            {
                showAttackOverlay: attack,
            }
        );
    }

    private _heatButtons = (): JSX.Element[] => {
        let heat: JSX.Element[] = []

        if (this.props.asUnit) {
            let heatMax = this.props.asUnit.hasPilotAbility('Hot Dog') ? 5 : 4;
            for (let level = 1; level <= heatMax; level++) {
                let classes = [];

                if (this.props.asUnit.currentHeat >= level) {
                    classes.push('active');
                }
                if ((this.props.asUnit.roundHeat === level && this.props.asUnit.currentHeat !== level)
                ||
                (this.props.asUnit.roundHeat === 0 && this.props.asUnit.currentHeat === level)) {
                    classes.push('staged');
                }

                heat.push(<button key={level} className={classes.join(' ')} onClick={() => this._setHeat(level)}>{level === heatMax ? 'S' : level}</button>);
            }
        }

        return heat;
    }

    private _GetBehavior = (): JSX.Element => {
        let behavior = this.props.asUnit ? this.props.asUnit.currentBehavior : null;

        // Do overrides for damage and heat on render side so we retain the behavior if it is changed by Apply Now
        if (this.props.asUnit) {
            let override = '';
            if (this.props.asUnit.currentHeat > 1) {
                override = 'Overheat Protocol';
            }
            // Forced withdrawal due to damage
            if (this.props.asUnit.getCurrentArmor() === 0 && this.props.asUnit.getCurrentStructure() <= Math.ceil(this.props.asUnit.structure/2)) {
                override = 'Forced Withdrawal';
            }
            // Forced withdrawal due to weapon hits
            if (this.props.asUnit.damage.medium + this.props.asUnit.damage.long > 0 && this.props.asUnit.currentDamage.medium + this.props.asUnit.currentDamage.long < 1) {
                override = 'Forced Withdrawal';
            }
            if (override.length > 0) {
                for (let action of CONST_AS_OPFOR_BEHAVIORS) {
                    if (action.name === override) {
                        behavior = action;
                    }
                }
            }
        }

        let fragment = 
            <span>
                {behavior?.reroll ? (<><FaDice className="cursor-pointer behavior" onClick={(e) => this._rerollBehavior(e)} fontSize={20}/>&nbsp;</>) : null }
                <a className="behavior" onClick={(e) => this._showOpForBehavior(e, behavior)} href="/">{behavior?.name}</a>
            </span>
        ;

        return fragment;
    }

    private _showOpForBehavior = (
        e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
        behavior: OpForBehavior | null,
    ) => {
        if( e && e.preventDefault ) e.preventDefault();
        if( this.props.showOpForBehavior && behavior ) {
            this.props.showOpForBehavior(e, behavior );
        }
    }

    private _rerollBehavior = (
        e: React.MouseEvent<SVGElement, MouseEvent>
    ) => {
        if( e && e.preventDefault ) e.preventDefault();
        if (this.props.asUnit) {
            this.props.asUnit.currentBehavior = {
                name: "",
                quarry: "",
                movement: "",
                attack: "",
                reroll: false
            };
            
            this.props.asUnit.rollOpForBehavior();
            
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
    }

    render = (): JSX.Element => {
        if( !this.props.asUnit ) {
            return <></>
        }

        let showHeat = this.props.asUnit.type.toLocaleLowerCase() === "bm" || this.props.asUnit.type.toLocaleLowerCase() === "af" || this.props.asUnit.type.toLocaleLowerCase() === "im";

        let motive12 = this.props.asUnit.vehicleMotive12 ? 1 : 0;
        if (this.props.asUnit.vehicleMotive12 !== this.props.asUnit.roundVehicleMotive12) {
            motive12 = this.props.asUnit.roundVehicleMotive12 ? 1 : 0;
        }

        let pilotAbilitiesList = this.props.asUnit.getPilotAbilityList();
        let pilotAbilities = this.props.asUnit.getPilotAbilities();

        let breach = false;
        if (this.props.asUnit.isAerospace) {
            let threshold = 0;
            for(let index = 0; index < this.props.asUnit.roundArmor.length; index ++) {
                // Only increment if we're adding damage, not removing it
                if (this.props.asUnit.roundArmor[index] && !this.props.asUnit.currentArmor[index]) {
                    threshold += 1;
                }
            }
            breach = threshold > this.props.asUnit.threshold ? true : false;
        }

        let classes = ['alpha-strike-play-card'];
        if (this.props.asUnit.isWrecked()) {
            classes.push('wrecked');
        }

        return (
            <div className={classes.join(' ')}>
                <div className='name-stats column'>
                    <div className='row justified'>
                        <h3>
                            {this.props.asUnit.customName ? this.props.asUnit.customName : this.props.asUnit.class}
                        </h3>
                        <div className='data-pair'><span>PV</span>{this.props.asUnit.currentPoints}</div>
                    </div>
                    <div className='variant row justified'>
                        <span>{!this.props.asUnit.customName && this.props.asUnit.variant !== ' ' ? this.props.asUnit.variant : this.props.asUnit.name}</span>
                        {this.props.appGlobals.appSettings.alphaStrikeAIMode ? (
                            <span>{this._GetBehavior()}</span>
                        ) : null }
                    </div>
                    <div className='row justified'>
                        <div className='data-pair'><span>Role</span>{this.props.asUnit.role}</div>
                        <div className='data-pair'><span>Type</span>{this.props.asUnit.type.toUpperCase()}</div>
                        <div className='data-pair'><span>Size</span>{this.props.asUnit.size}</div>
                        <div className='data-pair'><span>Skill</span>{this.props.asUnit.currentSkill}</div>
                        <div className='data-pair'><span>TMM</span>{this.props.asUnit.getTMM()}</div>
                    </div>
                </div>

                <div className='move-heat row justified'>
                    {this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? (
                        <div className='token-wrapper' onClick={() => this._toggleMovementOptions()}>
                            
                            {this._moveToken(this.props.asUnit.moveToken.type, this.props.asUnit.moveToken.tmm)}

                            {this.state.showMovementOptions ? (
                                <div className='overlay column center'>
                                    {this._moveOptions(this.props.asUnit)}
                                </div>
                            ) : null }

                        </div>
                    ) : null }

                    <div className='move-stats column evenly'>
                        {this._moveStats(this.props.asUnit)}
                    </div>

                    {showHeat ? (
                    <div className='heat column'>
                        <div className='row justified'>
                            <h4>Heat</h4>
                            <div className='data-pair'><span>OV</span>{this.props.asUnit.overheat}</div>
                        </div>    
                        <div className='heat-scale row'>
                            {this._heatButtons()}
                        </div>
                    </div>
                    ) : null }

                    <div className='unit-portrait' style={{backgroundImage:"url("+this.props.asUnit.imageURL+")"}}></div>
                </div>

                <div className='attack-row row'>
                    <h4>Damage</h4>

                    <div className='attacks'>
                        {this._getAttacks(this.props.asUnit)}
                    </div>
                </div>

                <div className='armor-crits row justified nowrap'>
                    <div className='column justified'>
                        <div className={'armor-structure row nowrap' + (this.state.showTakeDamage ? ' take-damage' : '')}>
                            <button className='button damage' title="Take Damage" onClick={(e) => this._toggleTakeDamage()}>
                                <FaShieldVirus />
                            </button>

                            {this.state.showTakeDamage ? (
                                <div className='take-damage row'>
                                    <button onClick={() => this._takeDamage(1)}>1</button>
                                    <button onClick={() => this._takeDamage(2)}>2</button>
                                    <button onClick={() => this._takeDamage(3)}>3</button>
                                    <button onClick={() => this._takeDamage(4)}>4</button>
                                    <button onClick={() => this._takeDamage(5)}>5</button>
                                    <button onClick={() => this._takeDamage(6)}>6</button>
                                    <button onClick={() => this._takeDamage(7)}>7</button>
                                    <button onClick={() => this._takeDamage(8)}>8</button>
                                    <button onClick={() => this._takeDamage(9)}>9</button>
                                    <button onClick={() => this._takeDamage(10)}>10</button>
                                    <button onClick={() => this._takeDamage(11)}>11</button>
                                    <button onClick={() => this._takeDamage(12)}>12</button>
                                    <button onClick={() => this._takeDamage(13)}>13</button>
                                    <button onClick={() => this._takeDamage(14)}>14</button>
                                    <button onClick={() => this._takeDamage(15)}>15</button>
                                    <button onClick={() => this._takeDamage(16)}>16</button>
                                    <button onClick={() => this._takeDamage(17)}>17</button>
                                    <button onClick={() => this._takeDamage(18)}>18</button>
                                    <button onClick={() => this._takeDamage(19)}>19</button>
                                    <button onClick={() => this._takeDamage(20)}>20</button>
                                </div>
                            ) : (
                                <div className='column evenly'>
                                    <div className='armor row nowrap'>
                                        <div className='column center'>
                                            <label>A:</label>
                                        </div>
                                        <div className='row dots'>
                                            {this._makeArmorDots('armor')}
                                        </div>
                                    </div>
                                    <div className='structure row nowrap'>
                                        <label>S:</label>
                                        <div className='row dots'>
                                            {this._makeArmorDots('structure')}
                                        </div>
                                    </div>
                                </div>
                            ) }
                            {this.props.asUnit.isAerospace ? (
                                <div className={'data-pair threshold column text-center center' + (breach ? ' staged' : '')}><span>TH</span>{this.props.asUnit.threshold}</div>
                            ) : null }
                            
                            
                        </div>
                        {pilotAbilitiesList.length > 0 ? (
                            <div className='list spas'>
                                <span>SPAs:</span>
                                {pilotAbilities.map( (ability, abilityIndex) => {
                                    if (ability) {
                                        return <React.Fragment key={abilityIndex}><a onClick={(e) => this._showPilotAbility(e, this.props.asUnit ? ability : null)} href="/">{ability.ability}</a><span>, </span></React.Fragment>;
                                    } else {
                                        return null;
                                    }
                                })}
                            </div>
                        ) : null }
                        <div className='list specials'>
                            <span>Specials:</span>
                            {this.props.asUnit.currentAbilities.map( (word, wordIndex) => {
                                if (this.props.asUnit && this.props.showSpecialAbility) {
                                    let ability = this.props.asUnit.getSpecialAbility(word);
                                    if( ability !== null ) {
                                        return (
                                            //@ts-ignore
                                            <React.Fragment key={wordIndex}><a onClick={(e) => this.props.showSpecialAbility(e, ability)} title={"Click here to view the description for " + word} href="/">{word}</a><span>, </span></React.Fragment>
                                        )
                                    }  else {
                                        return <React.Fragment key={wordIndex}>{word}<span>, </span></React.Fragment>;
                                    }
                                }
                                return null;
                            })}
                        </div>
                    </div>

                    {!this.props.asUnit.isInfantry && this.props.asUnit.type !== "JS" ? (
                        <div className='crits column justified'>
                            <h4>Critical Hits</h4>
                            {this.props.asUnit.type.toLowerCase() !== "pm" ? (
                                <a href="#engineCrit" className={this.props.asUnit.engineHits !== this.props.asUnit.roundEngineHits ? 'data-pair row justified staged' : 'data-pair row justified'} onClick={() => this._toggleEngineHit(true)}><span>Engine</span>{this.props.asUnit.engineHits !== this.props.asUnit.roundEngineHits ? this.props.asUnit.roundEngineHits : this.props.asUnit.engineHits}</a>
                            ) : null }
                            <a 
                                href="#fireControlCrit"
                                className={this.props.asUnit.fireControlHits !== this.props.asUnit.roundFireControlHits ? 'data-pair row justified staged' : 'data-pair row justified'} 
                                onClick={() => this._toggleFireControlHit(true)}
                                >
                                    <span>Fire Control</span>
                                    {this.props.asUnit.fireControlHits !== this.props.asUnit.roundFireControlHits ? this.props.asUnit.roundFireControlHits : this.props.asUnit.fireControlHits}
                            </a>
                            <a 
                                href="#weaponCrit"
                                className={this.props.asUnit.weaponHits !== this.props.asUnit.roundWeaponHits ? 'data-pair row justified staged' : 'data-pair row justified'} 
                                onClick={() => this._toggleWeaponHit(true)}
                                >
                                    <span>Weapons</span>
                                    {this.props.asUnit.weaponHits !== this.props.asUnit.roundWeaponHits ? this.props.asUnit.roundWeaponHits : this.props.asUnit.weaponHits}
                            </a>
                            {this.props.asUnit.type.toLowerCase() === 'bm' || this.props.asUnit.type.toLowerCase() === 'im' || this.props.asUnit.type.toLowerCase() === 'pm' ? (
                                <a 
                                    href="#movementCrit"
                                    className={this.props.asUnit.mpControlHits !== this.props.asUnit.roundMpControlHits ? 'data-pair row justified staged' : 'data-pair row justified'} 
                                    onClick={() => this._toggleMPHit(true)}
                                    >
                                        <span>Movement</span>
                                        {this.props.asUnit.mpControlHits !== this.props.asUnit.roundMpControlHits ? this.props.asUnit.roundMpControlHits : this.props.asUnit.mpControlHits}
                                </a>
                            ) : null }
                            {this.props.asUnit.type.toLowerCase() === 'cv' ||  this.props.asUnit.type.toLowerCase() === 'sv'? (
                                <div className='vehicle data-pair row justified'>
                                    <span>Motive</span>
                                    <a href="#motive910crit" className={this.props.asUnit.roundVehicleMotive910 !== this.props.asUnit.vehicleMotive910 ? 'staged' : ''} onClick={() => this._toggleVehicle910()}>{this.props.asUnit.roundVehicleMotive910 !== this.props.asUnit.vehicleMotive910 ? this.props.asUnit.roundVehicleMotive910 : this.props.asUnit.vehicleMotive910}</a>
                                    <a href="#motive11crit" className={this.props.asUnit.roundVehicleMotive11 !== this.props.asUnit.vehicleMotive11 ? 'staged' : ''} onClick={() => this._toggleVehicle11()}>{this.props.asUnit.roundVehicleMotive11 !== this.props.asUnit.vehicleMotive11  ? this.props.asUnit.roundVehicleMotive11 : this.props.asUnit.vehicleMotive11}</a>
                                    <a href="#motive12crit" className={this.props.asUnit.vehicleMotive12 !== this.props.asUnit.roundVehicleMotive12 ? 'staged' : ''} onClick={() => this._toggleVehicle12()}>{motive12}</a>
                                </div>
                            ) : null }
                            {this.props.appGlobals.appSettings.alphaStrikeCombatRolls ? (
                                <div id='crit-buttons' className='row justified'>
                                    <button className='button' title="Roll Critical Hit" onClick={() => this._rollCritical()}>
                                        <FaDice />
                                        {this.state.showCriticalOverlay ? (
                                            <div className='overlay column evenly'>
                                                <h2>Critical Hit!</h2>
                                                <div className='row center'>
                                                    <div className='die'><DiceIcon roll={this.state.showCriticalOverlay.roll1}/></div>
                                                    <div className='die'><DiceIcon roll={this.state.showCriticalOverlay.roll2}/></div>
                                                    <span style={{lineHeight:'26px'}}>= {this.state.showCriticalOverlay.result}</span>
                                                </div>
                                            </div>
                                        ) : null }
                                    </button>
                                    {this.props.asUnit.type.toLowerCase() === 'cv' || this.props.asUnit.type.toLowerCase() === 'sv' ? (
                                        <button className='button' title='Roll for motive hit' onClick={() => this._rollMotive()}>
                                            <GiCartwheel />
                                            {this.state.showMotiveOverlay ? (
                                                <div className='overlay column evenly'>
                                                    <h2>Motive Hit</h2>
                                                    <div className='row center'>
                                                        <div className='die'><DiceIcon roll={this.state.showMotiveOverlay.roll1}/></div>
                                                        <div className='die'><DiceIcon roll={this.state.showMotiveOverlay.roll2}/></div>
                                                        <span style={{lineHeight:'26px'}}>= {this.state.showMotiveOverlay.result}</span>
                                                    </div>
                                                </div>
                                            ) : null }
                                        </button>
                                    ) : null }
                                </div>
                            ) : null }
                        </div>
                    ) : null }

                </div>

                {this.props.asUnit.hasRoundStaged() && !this.state.showCriticalOverlay ? (
                    <div className='staged-actions'>
                        <button className='button apply' onClick={() => this._ApplyNow()}>Apply Changes</button>
                        <button className='button apply' onClick={() => this._clearChanges()}>Cancel</button>
                    </div>
                ) : null }

                {this.state.showAttackOverlay && this.props.asUnit.moveToken.type !== '' ? (
                    <AlphaStrikeAttackOverlay
                        appGlobals={this.props.appGlobals}
                        unit={this.props.asUnit}
                        attack={this.state.showAttackOverlay}
                        close={() => this._showAttack(null)}
                    />
                ) : null }

            </div>
        )
    }
}

interface IAlphaStrikeUnitCardProps {
    asUnit: AlphaStrikeUnit | null;
    appGlobals: IAppGlobals;
    showExtreme?: boolean;
    measurementsInHexes: boolean;
    showPilotAbility( ability: IASPilotAbility ): void;
    showOpForBehavior?(e: React.FormEvent<HTMLAnchorElement>, behavior: OpForBehavior): void;
    showSpecialAbility?(
        e: React.FormEvent<HTMLAnchorElement>,
        ability: IASSpecialAbility | null
      ): void;
}

interface IAlphaStrikeUnitCardState {
    showTakeDamage: boolean;
    showMovementOptions: boolean;
    showAttackOverlay: IASAttack | null;
    showCriticalOverlay: {
        roll1: number,
        roll2: number,
        result: string,
    } | null;
    showMotiveOverlay: {
        roll1: number,
        roll2: number,
        result: string,
    } | null;
}

export class AlphaStrikeAttackOverlay extends React.Component<AlphaStrikeAttackOverlayProps, AlphaStrikeAttackOverlayState> {

    constructor(props: AlphaStrikeAttackOverlayProps) {
        super(props);

        let artillery = false;
        if (this.props.unit) {
            artillery = this.props.attack.damage === 0 && this.props.unit.getAbilityValues('ART').damage > -1;
        }

        this.state = {
            artillery: artillery,
            range: this.props.attack.range,
            baseDamage: this.props.attack.damage,
            minimal: this.props.attack.minimal,
            toHit: this.props.attack.toHit,
            // damageResult: 0,
            tmm: 0,
            stealth: 0,
            terrain: [
                false,
                false,
                false,
            ],
            targetNumber: this.props.attack.toHit,
            indirect: {
                enabled: false,
                noSpotter: false,
                spotterAttacked: false,
                spotterMove: 0,
                tag: false,
            },
            overheat: 0,
            rear: false,
            spotting: false,
            fromRear: false,
            narc: false,
            ams: false,
            tailing: false,
            swordsman: false,
            streetFighter: false,
            bombs: {
                max: this.props.attack.type === 'bomb' && this.props.unit ? this.props.unit.getAbilityValues('BOMB').damage : 0,
                using: 1,
            },
            multiTasker: 0,
        }
    }

    // Create Private variables from this.props.attack
    private maxDamage: number = 0;
    private targetNumber: number = 0;
    private tmmRange = this.props.attack.type === 'a2a' ? [-2,-1,0,1,2] : [-4,-3,-2,-1,0,1,2,3,4,5];
    private toHitRollResults: RollResult[] = [];
    private damageRollResults: RollResult[] = [];
    private totalDamage = 0;
    private ht = 0;
    private flk = 0;
    private crits = 0;

    private _calcAttack = (): void => {
        if (this.props.unit && this.props.attack) {
            let tn = this.state.toHit;
            // Adjust for attack options
            if (this.state.artillery) {
                tn += this.props.unit.hasPilotAbility('Oblique Artilleryman') ? 0 : 1;
            }
            tn += this.state.rear ? 1 : 0;
            tn += this.state.spotting ? 1 : 0;

            // Indirect fire
            if (this.state.indirect.enabled) {
                tn += 1;

                if (!this.state.indirect.tag) {
                    tn += this.state.indirect.spotterAttacked ? 1 : 0;
                    tn += this.state.indirect.spotterMove ? this.state.indirect.spotterMove : 0;
                } else if (this.state.artillery) {
                    tn += -1;
                }
                if (this.props.unit.hasPilotAbility('Oblique Attacker')) {
                    tn += this.state.indirect.noSpotter ? 2 : -1;
                }
            }

            // Negate Sniper bonus if the attack is IF or ART
            if (this.props.unit.hasPilotAbility('Sniper') && (this.state.artillery || this.state.indirect.enabled)) {
                tn += this.props.attack.range;
            } 
            
            tn += this.state.tmm;
            tn += this.state.stealth;
            tn += this._getTerrain();

            tn += this.state.tailing ? -2 : 0;

            // Damage
            let damage = this.state.baseDamage;
            damage += this.state.overheat;
            damage += this.state.fromRear ? 1 : 0;
            damage += this.state.narc ? 1: 0;
            damage += this.state.tailing ? 1 : 0;
            damage += this.state.swordsman ? 1 : 0;

            if (this.state.bombs.max > 0) {
                damage = this.state.bombs.using;
            }

            if (this.state.artillery && this.props.unit) {
                damage = this.props.unit.getAbilityValues('ART').damage;
            }

            if (this.state.multiTasker > 0) {
                tn += this.state.multiTasker > 1 ? 1 : 0;
                damage = this.props.appGlobals.appSettings.alphaStrikeVariableDamage !== 'attack' ? Math.floor(damage/2) : damage;
            }

            this.targetNumber = tn;
            this.maxDamage = damage;

            // Check all the to-hit rolls in case mods have been changed
            let weaponSpecialist = this.props.unit.hasPilotAbility('weapon specialist');
            this.crits = 0;
            let rollCrit = false;
            let SPACrit = false;
            for(let index = 0; index < this.toHitRollResults.length; index++) {
                let hit = this.toHitRollResults[index];
                if (hit.roll1 + hit.roll2 >= this.targetNumber) {
                    hit.hit = true;
                }  else {
                    hit.hit = false;
                }
                if (weaponSpecialist && !hit.hit) {
                    weaponSpecialist = false;
                    if (this.props.appGlobals.appSettings.alphaStrikeVariableDamage === 'attack') {
                        console.log('Weapon Specialist: Re-rolling failed attack ' + index + ' rolled:' + hit.roll1 + ', ' + hit.roll2);
                        let reRoll = this._rollToHit();
                        hit.roll1 = reRoll.roll1;
                        hit.roll2 = reRoll.roll2;
                        hit.hit = reRoll.hit;
                    } else if (hit.roll1 + hit.roll2 >= this.targetNumber - 1) {
                        console.log('Weapon Specialist: ' + hit.roll1 + ', ' + hit.roll2 + ' is within 1 of TN');
                        this.maxDamage = Math.floor(this.maxDamage/2);
                        this.maxDamage = this.maxDamage > 0 ? this.maxDamage : 1;
                        hit.hit = true;
                    }
                }
                // Check for crits
                if (!rollCrit && hit.roll1 + hit.roll2 === 12) {
                    this.crits += 1;
                    rollCrit = true;
                }
                if (!SPACrit
                    &&
                    this.props.attack.type === 'weapon'
                    &&
                    (this.props.unit.hasPilotAbility('Marksman') || this.props.unit.hasPilotAbility('Sharpshooter'))
                    &&
                    (this.props.unit.moveToken.type === 'standstill' || this.props.unit.moveToken.type === 'hull down')
                    &&
                    hit.roll1 + hit.roll2 > this.targetNumber + 2
                ) {
                    this.crits += 1;
                    SPACrit = true;
                }
                if (!SPACrit && this.props.attack.type === 'physical' && this.props.unit.hasPilotAbility('Swordsman') && !this.state.swordsman) {
                    this.crits += 1;
                    SPACrit = true;
                }
            }
            if (this.state.minimal && this.toHitRollResults.length) {
                let hit = this.toHitRollResults[this.toHitRollResults.length - 1];
                if (hit.roll1 + hit.roll2 >= this.targetNumber) {
                    hit.hit = true;
                }  else {
                    hit.hit = false;
                }
            }

            // Evalute damage
            this.totalDamage = 0;
            this.flk = 0;
            this.ht = 0;
            // Artillery is unique
            if (this.state.artillery) {
                // Figure this out! Pull in damage values from weapon / ammo type
            } else
            // Physical attack damage 
            if (this.props.attack.type === 'physical') {
                if (this.toHitRollResults.length > 0 && this.toHitRollResults[0].hit) {
                    this.totalDamage = this.maxDamage;
                    if (this.state.minimal) {
                        this.totalDamage += this.damageRollResults[this.damageRollResults.length-1].hit ? 1 : 0;
                    }
                }
            } else
            // Normal damage rules
            if (this.props.appGlobals.appSettings.alphaStrikeVariableDamage === '') {
                if (this.toHitRollResults.length > 0 && this.toHitRollResults[0].hit) {
                    this.totalDamage = this.maxDamage;
                    if (this.state.minimal) {
                        this.totalDamage += this.damageRollResults[this.damageRollResults.length-1].hit ? 1 : 0;
                    }                    
                    // Specials are all applied
                    this.ht = this.props.attack.type === 'physical' ? 0 : this.props.unit.getAbilityValues('ht', this.props.attack.range).damage;
                    this.ht += this.props.attack.type === 'physical' ? 0 : this.props.unit.getAbilityValues('ht', this.props.attack.range).minimal && this.damageRollResults[this.damageRollResults.length - 1].hit ? 1 : 0;
                } 
                if (this.props.attack.type !== 'physical' && this.toHitRollResults.length > 0 && !this.toHitRollResults[0].hit && this.toHitRollResults[0].roll1 + this.toHitRollResults[0].roll2 >= tn - 2) {
                    this.flk = this.props.unit.getAbilityValues('flk', this.props.attack.range).damage;
                    this.flk += this.props.unit.getAbilityValues('flk', this.props.attack.range).minimal && this.damageRollResults[this.damageRollResults.length - 1].hit ? 1 : 0;
                } else {
                    this.flk = 0;
                }
            } else
            // Multiple Damage Rolls
            if (this.props.appGlobals.appSettings.alphaStrikeVariableDamage === 'damage') {
                // Need to make sure there are enough damage dice
                let needed = this.state.minimal ? this.maxDamage + 1 : this.maxDamage;
                needed += this.props.unit.getAbilityValues('ht', this.props.attack.range).minimal || this.props.unit.getAbilityValues('flk', this.props.attack.range).minimal ? 1 : 0
                while (needed > this.damageRollResults.length) {
                    this.damageRollResults = [...this.damageRollResults, this._rollDamage(3)];
                }
                if (this.toHitRollResults.length > 0 && this.toHitRollResults[0].hit && this.damageRollResults.length > 0) {
                    for(let index = 0; index < this.maxDamage; index++) {
                        this.totalDamage += this.damageRollResults[index].hit ? 1 : 0;
                    }
                    if (this.state.minimal) {
                        this.totalDamage += this.damageRollResults[this.damageRollResults.length - 1].hit ? 1 : 0;
                    }
                    // Successful hits ALWAYS do at least 1 damage, except for 0* minimal
                    if (this.maxDamage > 0 && this.totalDamage === 0) {
                        console.log('Hits with Multiple Damage Rolls always do at least 1 damage');
                        this.totalDamage = 1;
                    }
                    // Specials are all applied
                    this.ht = this.props.unit.getAbilityValues('ht', this.props.attack.range).damage;
                    this.ht += this.props.unit.getAbilityValues('ht', this.props.attack.range).minimal && this.damageRollResults[this.damageRollResults.length - 1].hit ? 1 : 0;
                }
                if (this.toHitRollResults.length > 0 && !this.toHitRollResults[0].hit && this.toHitRollResults[0].roll1 + this.toHitRollResults[0].roll2 >= tn - 2) {
                    this.flk = this.props.unit.getAbilityValues('flk', this.props.attack.range).damage;
                    this.flk += this.props.unit.getAbilityValues('flk', this.props.attack.range).minimal && this.damageRollResults[this.damageRollResults.length - 1].hit ? 1 : 0;
                } else {
                    this.flk = 0;
                }
            } else 
            // Multiple Attack Rolls
            if (this.props.appGlobals.appSettings.alphaStrikeVariableDamage === 'attack' && this.toHitRollResults.length > 0) {
                let flk = this.props.unit.getAbilityValues('flk', this.props.attack.range).damage;
                flk += this.props.unit.getAbilityValues('flk', this.props.attack.range).minimal && this.damageRollResults[this.damageRollResults.length - 1].hit ? 1 : 0;
                let ht = this.props.unit.getAbilityValues('ht', this.props.attack.range).damage;
                ht += this.props.unit.getAbilityValues('ht', this.props.attack.range).minimal && this.damageRollResults[this.damageRollResults.length - 1].hit ? 1 : 0;
                let rolls = flk > -1 ? flk : 0;
                rolls += ht > -1 ? ht : 0;
                rolls = rolls > this.maxDamage ? rolls : this.maxDamage;
                let needed = rolls;
                while (needed > this.toHitRollResults.length) {
                    this.toHitRollResults = [...this.toHitRollResults, this._rollToHit()];
                }
                for(let index = 0; index < rolls; index++) {
                    this.totalDamage += this.toHitRollResults[index].hit && this.totalDamage < this.maxDamage ? 1 : 0;
                    if (flk > 0) {
                        if (!this.toHitRollResults[index].hit && this.toHitRollResults[index].roll1 + this.toHitRollResults[index].roll2 >= this.targetNumber - 2) {     
                            this.flk++;
                        }
                        flk--;
                    } else if (ht > 0) {
                        this.ht += this.toHitRollResults[index].hit ? 1 : 0;
                        ht--
                    }
                }
                if (this.state.minimal && this.toHitRollResults[this.toHitRollResults.length - 1].hit) {
                    this.totalDamage += this.damageRollResults[this.damageRollResults.length - 1].hit ? 1 : 0;
                }
            }
            // Rear attacks can't apply special effects
            if (this.state.rear) {
                this.ht = 0;
                this.flk = 0;
            }
        }
    }
    
    private _adjustTMM = ( amount: number ): void => {
        let nv = this.state.tmm !== amount ? amount : 0;
        this.setState({
            tmm: nv,
        });
    }

    private _targetStealth = ( level: number ): void => {
        let nv = this.state.stealth !== level ? level : 0;
        this.setState({
            stealth: nv,
        });
    }

    private _getTerrain = (): number => {
        let terrain = 0;
        for(let option of this.state.terrain) {
            terrain += option ? 1 : 0;
        }
        return terrain;
    }

    private _toggleTerrain = ( index: number ): void => {
        let terrain = this.state.terrain;
        terrain[index] = !terrain[index];
        this.setState({
            terrain: terrain,
        });
    }

    private _toggleArtillery = (): void => {
        // Need to turn off indirect and reset hitRolls
        this.setState({
            artillery: !this.state.artillery,
            indirect: {
                enabled:false,
                noSpotter: false,
                spotterAttacked: false,
                spotterMove: 0,
                tag: false,
            },
            tmm: 0,
            stealth: 0,
            fromRear: false,
            narc: false,
            ams: false,
        });
    }

    private _toggleIndirect = (): void => {
        if (this.props.unit) {
            let value = this.props.unit.getAbilityValues('IF');
            this.setState({
                indirect: {
                    enabled: !this.state.indirect.enabled,
                    noSpotter: false,
                    spotterAttacked: false,
                    spotterMove: 0,
                    tag: false,
                },
                baseDamage: value.damage > -1 && !this.state.indirect.enabled ? value.damage : this.props.attack.damage,
                minimal: value.minimal && !this.state.indirect.enabled ? value.minimal : this.props.attack.minimal,
                narc: this.state.indirect.enabled ? false : this.state.narc,
            });
        }
    }

    private _toggleSpotter = ( toggle : string ): void => {
        let indirect = this.state.indirect;
        if (toggle === 'noSpotter') {
            indirect.noSpotter = !indirect.noSpotter;
            indirect.spotterAttacked = false;
            indirect.tag = false;
            indirect.spotterMove = 0;
        } else if (toggle === 'spotterAttacked') {
            indirect.spotterAttacked = !indirect.spotterAttacked;
            indirect.noSpotter = false;
        } else if (toggle === 'tag') {
            indirect.tag = !indirect.tag;
            indirect.noSpotter = false;
        }
        this.setState({
            indirect: indirect,
        });
    }

    private _setSpotterMovement = ( value: number ): void => {
        let indirect = this.state.indirect;
        indirect.spotterMove = indirect.spotterMove !== value ? value : 0;
        this.setState({
            indirect: indirect,
        });
    }

    private _setOverheat = ( value: number ): void => {
        let nv = this.state.overheat === value ? 0 : value;
        this.setState({
            overheat: nv,
        });
    }

    private _toggleFromRear = (): void => {
        this.setState({
            fromRear: !this.state.fromRear,
        });
    }

    private _toggleSpotting = (): void => {
        this.setState({
            spotting: !this.state.spotting,
        });
    }

    private _toggleRear = (): void => {
        if (this.props.unit) {
            let value = this.props.unit.getAbilityValues('REAR');
            this.setState({
                rear: !this.state.rear,
                baseDamage: value.damage > -1 && !this.state.rear ? value.damage : this.props.attack.damage,
                minimal: value.minimal && !this.state.rear ? value.minimal : this.props.attack.minimal,
            });
        }
    }

    private _toggleNarc = (): void => {
        this.setState({
            narc: !this.state.narc,
        });
    }

    private _toggleTailing = (): void => {
        this.setState({
            tailing: !this.state.tailing,
        });
    }
    
    private _toggleSwordsman = (): void => {
        this.setState({
            swordsman: !this.state.swordsman,
        });
    }

    private _toggleStreetFighter = (): void => {
        if(this.props.unit) {
            let damage = this.props.attack.damage + this.props.unit.getCurrentDamage(0).value;
            let minimal = this.props.unit.getCurrentDamage(0).minimal;
            this.setState({
                streetFighter: !this.state.streetFighter,
                baseDamage: !this.state.streetFighter ? damage : this.props.attack.damage,
                minimal: minimal,
            });
        }
    }

    private _setAirToAirRange = ( range: number ): void => {
        if (this.props.unit) {
            for(let attack of this.props.unit.attacks) {
                if (attack.type === 'weapon' && attack.range === range) {
                    this.setState({
                        range: range,
                        toHit: attack.toHit,
                        baseDamage: attack.damage,
                        minimal: attack.minimal,
                    });
                }
            }
        }
    }

    private _setMultiTasker = ( target: number ): void => {
        this.setState({
            multiTasker: target !== this.state.multiTasker ? target : 0,
        });
    }

    private _setBombs( count: number ) {
        this.setState({
            bombs: {
                max: this.state.bombs.max,
                using: count,
            },
        });
    }

    private _setC3( range: number ) {
        if (this.props.unit) {
            this.setState({
                toHit: this.props.unit.getCurrentToHit(range),
            });
        }
    }

    private _attackOptions = (): JSX.Element[] => {
        let options: JSX.Element[] = [];
        if (this.props.unit) {
            let artillery = this.props.unit.getAbilityValues('ART');
            let indirect = this.props.unit.getAbilityValues('IF');
            let rear = this.props.unit.getAbilityValues('REAR', this.state.range);

            if (this.props.unit.hasC3()) {
                options.push(<div key={'C3'}>C3:
                
                    {this.props.unit.attacks.map( (attack) => {
                        if (attack.type === 'weapon' && attack.range < 3) {
                            return <button key={attack.name} className={this.state.toHit === attack.toHit ? 'staged' : ''} onClick={() => this._setC3(attack.range)}><span className='data-pair'>{attack.name.charAt(0)} <span>{attack.toHit}</span></span></button>;
                        }
                        return null;
                    })}
                
                </div>);
            }

            if ((artillery.damage > -1) && this.state.range === 2) {
                options.push(<button key='artillery' className={this.state.artillery ? 'staged' : ''} disabled={this.state.baseDamage === 0} onClick={() => this._toggleArtillery()}>Artillery</button>);
            }
            if ((indirect.damage > -1) || ((artillery.damage > -1 || artillery.minimal) && this.state.range === 2)) {
                options.push(<button key='indirect' className={this.state.indirect.enabled ? 'staged' : ''} disabled={indirect.damage < 0 && artillery.damage > -1 && !this.state.artillery} onClick={() => this._toggleIndirect()}>Indirect</button>);
            }
            if (rear.damage > -1) {
                options.push(<button key='rear' className={this.state.rear ? 'staged' : ''} onClick={() => this._toggleRear()}>Rear</button>);
            }

            if (this.props.unit && this.props.unit.isAerospace && this.props.attack.type === 'a2a') {
                // Air to Air attacks need to have range and tailing.
                for(let attack of this.props.unit.attacks) {
                    if (attack.type === 'weapon') {
                        options.push(<button key={attack.name} className={this.state.range === attack.range ? 'staged' : ''} onClick={() => this._setAirToAirRange(attack.range)}><span className='data-pair'>{attack.name.charAt(0)} {attack.damage} <span>{attack.toHit}</span></span></button>);
                    }
                }
                options.push(<button key='tailing' className={this.state.tailing ? 'staged' : ''} onClick={() => this._toggleTailing()}>Tailing</button>);
            }
        }

        // Any unit can spot
        options.push(<button key='spotting' className={this.state.spotting ? 'staged' : ''} onClick={() => this._toggleSpotting()}>Spotting</button>);

        return options;
    }

    private _multiAttack = (): JSX.Element[] | null => {
        let options: JSX.Element[] = [];

        if (this.props.appGlobals.appSettings.alphaStrikeVariableDamage !== 'attack') {
            options.push(<button key='primary' className={this.state.multiTasker === 1 ? 'staged' : ''} onClick={() => this._setMultiTasker(1)}>Primary</button>);
            options.push(<button key='secondary' className={this.state.multiTasker === 2 ? 'staged' : ''} onClick={() => this._setMultiTasker(2)}>Secondary</button>);
        } else if (this.props.attack.damage > 1) {
            let multi = this.props.unit?.hasPilotAbility('Multi-Tasker') || this.props.unit?.hasPilotAbility('Ground-Hugger') ? 1 : 2;
            options.push(<button key='secondary' className={this.state.multiTasker === multi ? 'staged' : ''} onClick={() => this._setMultiTasker(multi)}>Secondary</button>);
        }

        return options;
    }

    private _damageOptions = (): JSX.Element[] => {
        let options: JSX.Element[] = [];

        if (this.props.unit) {
            if (!this.props.unit.isAerospace) {
                options.push(<button key='fromRear' className={this.state.fromRear ? 'staged' : ''} onClick={() => this._toggleFromRear()}>From rear</button>);
            }

            if (this.props.unit.getAbilityValues('LRM', this.state.range).damage > -1 || this.props.unit.getAbilityValues('SRM', this.state.range).damage > -1 || this.state.indirect.enabled) {
                options.push(<button key='narc' className={this.state.narc ? 'staged' : ''} onClick={() => this._toggleNarc()}>Narc</button>);
                // options.push(<button key='ams' className={this.state.ams ? 'staged' : ''} onClick={() => this._toggleAMS()}>AMS</button>);
            }

            if (this.props.attack.type === 'physical') {
                if (this.props.unit.hasPilotAbility('Swordsman') && this.props.unit.hasAbility('MEL')) {
                    options.push(<button key='swordsman' className={this.state.swordsman ? 'staged' : ''} onClick={() => this._toggleSwordsman()}>Swordsman</button>);
                }
                if (this.props.unit.hasPilotAbility('Street Fighter')) {
                    options.push(<button key='streetFighter' className={this.state.streetFighter ? 'staged' : ''} onClick={() => this._toggleStreetFighter()}>Street Fighter</button>);
                }
            }
        }

        return options;
    }

    private _overheatOptions = (): JSX.Element[] => {
        let options: JSX.Element[] = [];

        if (this.props.unit) {
            let maxHeat = this.props.unit.hasPilotAbility('Hot Dog') ? 4 : 3;
            for(let index = 0; index < this.props.unit.overheat; index++) {
                options.push(<button key={'ov'+index+1} disabled={this.props.unit.currentHeat + index > maxHeat} className={this.state.overheat === index+1 ? 'staged' : ''} onClick={() => this._setOverheat(index+1)}>{index+1}</button>);
            }
        }

        return options;
    }

    private _bombOptions = (): JSX.Element[] => {
        let options: JSX.Element[] = [];
        for(let index = 1; index <= this.state.bombs.max; index++) {
            options.push(<button key={'bomb'+index} className={this.state.bombs.using === index ? 'staged' : ''} onClick={() => this._setBombs(index)}>{index}</button>);
        }
        return options;
    }

    private _rollAttack = (): void => {
        if (this.props.unit) {
            let attackRollResults: RollResult[] = [];
            let damageRollResults: RollResult[] = [];
            let rolls = this.props.attack.damage + this.props.unit.getAbilityValues('flk').damage + this.props.unit.getAbilityValues('ht').damage > 0 || this.state.minimal || this.props.unit.getAbilityValues('flk').minimal || this.props.unit.getAbilityValues('ht').minimal ? 1 : 0;
            if (this.state.artillery) {
                rolls = this.props.unit.getAbilityValues('ART').damage;
            } else if (this.props.attack.type === 'bomb') {
                rolls = this.state.bombs.max;
            } else if (this.props.appGlobals.appSettings.alphaStrikeVariableDamage === 'attack') {
                rolls = this.props.attack.damage; // fromRear
                rolls += this.props.unit ? this.props.unit.overheat : 0;
                rolls += this.state.minimal ? 1 : 0;
                if (this.props.unit.hasAbility('FLK') || this.props.unit.hasAbility('HT')) {
                    let specialRolls = this.props.unit.getAbilityValues('FLK', this.props.attack.range).damage + this.props.unit.getAbilityValues('HT', this.props.attack.range).damage;
                    specialRolls += this.props.unit.getAbilityValues('FLK', this.props.attack.range).minimal ? 1 : 0;
                    specialRolls += this.props.unit.getAbilityValues('HT', this.props.attack.range).minimal ? 1 : 0;
                    rolls = specialRolls > rolls ? specialRolls : rolls;
                }
            }

            for(let index = 0; index < rolls; index++) {
                attackRollResults.push(this._rollToHit());
            }

            if (this.props.appGlobals.appSettings.alphaStrikeVariableDamage === 'damage') {
                let maximum = this.maxDamage;
                if (this.state.artillery) {
                    maximum = this.props.unit.getAbilityValues('ART').damage;
                } else if (this.props.attack.type === 'bomb') {
                    maximum = this.state.bombs.max;
                }
                for(let index = 0; index < maximum; index++) {
                    damageRollResults.push(this._rollDamage(3));
                }
                if (this.state.minimal) {
                    damageRollResults.push(this._rollDamage(5));
                }
            } else {
                for(let index = 0; index < attackRollResults.length; index++) {
                    if (this.state.artillery || this.state.bombs.max > 0) {
                        damageRollResults.push(this._rollDamage(1));
                    } else {
                        damageRollResults.push(this._rollDamage(4));
                    }
                }
            }    

            this.toHitRollResults = attackRollResults;
            this.damageRollResults = damageRollResults;

            this.setState({});
        }
    }

    private _rollToHit = (): RollResult => {
        let roll1 = Math.ceil(Math.random()*6)
        let roll2 = Math.ceil(Math.random()*6)
        let hit = roll1 + roll2 >= this.targetNumber;

        return {
            roll1: roll1,
            roll2: roll2,
            hit: hit,
        };
    }

    private _rollDamage = ( targetNumber: number ): RollResult => {
        let roll1 = Math.ceil(Math.random()*6);
        let hit = roll1 >= targetNumber;

        return {
            roll1: roll1,
            roll2: 0,
            hit: hit,
        }
    }

    private _showDamageDice = (): boolean => {
        let show = false;
        if (this.props.unit && this.toHitRollResults.length > 0) {
            if (this.props.appGlobals.appSettings.alphaStrikeVariableDamage === 'damage') {
                // The first hit needs to be successful to show damage
                show = this.toHitRollResults[0].hit;
                if (this.props.unit.getAbilityValues('flk', this.props.attack.range).minimal && !this.toHitRollResults[0].hit && this.toHitRollResults[0].roll1 + this.toHitRollResults[0].roll2 >= this.targetNumber -2) {
                    show = true;
                }
            }
            if (this.props.attack.type === 'physical' && !this.state.minimal) {
                // Don't show for physical attacks
                show = false;
            }
        }

        // Never show damage with Artillery or Bombs
        if (this.state.artillery || this.state.bombs.max > 0) {
            show = false;
        } 

        return show;
    }

    private closeOverlay = (): void => {
        if (this.props.unit && this.toHitRollResults.length) {
            if (this.state.overheat > 0) {
                this.props.unit.roundHeat = this.state.overheat + this.props.unit.roundHeat;
            }
            if (this.props.unit.engineHits > 0) {
                this.props.unit.roundHeat += 1;
            }
        }
        this.props.close();
    }

    render = (): JSX.Element => {
        
        this._calcAttack();

        if (!this.props.unit || !this.props.attack) {
            return <></>;
        } else {
            return <>
                <div className='overlay column attack-overlay'>
                    <h3 className='row justified'>
                        <span>{this.props.attack.name}</span>
                        <button onClick={this.closeOverlay}><FiX /></button>
                    </h3>

                    {this.props.attack.type !== 'physical' ? (
                        <div className='row'>
                            <div className='column'>
                                <span className='label'>Attack Mods</span>
                                <div className='row'>
                                    {this._attackOptions()}
                                </div>
                            </div>
                        {!this.state.artillery && this.props.attack.type === 'weapon' && (this.props.unit?.hasPilotAbility('Multi-Tasker') || this.props.unit?.hasPilotAbility('Ground-Hugger') || this.props.appGlobals.appSettings.alphaStrikeVariableDamage === 'attack') ? (
                            <div className='column'>
                                <span className='label'>Multi-Target</span>
                                <div className='row button-group'>
                                    {this._multiAttack()}
                                </div>
                            </div>
                        ) : null }
                        </div>
                    ) : null }

                    {this.state.indirect.enabled ? (
                    <div className='row'>
                        <div className='column'>
                            <span className='label'>Spotter Mods</span>
                            <div className='row'>
                                {this.props.unit?.hasPilotAbility('Oblique Attacker') ? (
                                    <button className={this.state.indirect.noSpotter ? 'staged' : ''} onClick={() => this._toggleSpotter('noSpotter')}>None</button>
                                ) : null }
                                <button className={this.state.indirect.spotterAttacked ? 'staged' : ''} disabled={this.state.indirect.noSpotter} onClick={() => this._toggleSpotter('spotterAttacked')}>Attacked</button>
                                <button className={this.state.indirect.tag ? 'staged' : ''} disabled={this.state.indirect.noSpotter} onClick={() => this._toggleSpotter('tag')}>Tag</button>
                            </div>
                        </div>
                        <div className='column'>
                            <span className='label'>Spotter Movement Mod</span>
                            <div className='button-group'>
                                <button className={this.state.indirect.spotterMove === -1 ? 'staged' : ''} disabled={this.state.indirect.noSpotter} onClick={() => {this._setSpotterMovement(-1)}}>-1</button>
                                <button className={this.state.indirect.spotterMove === 0 ? 'staged' : ''} disabled={this.state.indirect.noSpotter} onClick={() => {this._setSpotterMovement(0)}}>0</button>
                                <button className={this.state.indirect.spotterMove === 1 ? 'staged' : ''} disabled={this.state.indirect.noSpotter} onClick={() => {this._setSpotterMovement(1)}}>1</button>
                                <button className={this.state.indirect.spotterMove === 2 ? 'staged' : ''} disabled={this.state.indirect.noSpotter} onClick={() => {this._setSpotterMovement(2)}}>2</button>
                            </div>
                        </div>
                    </div>
                    ) : null }

                    {!this.state.artillery && this.state.bombs.max === 0 ? (
                        <div className='row'>
                            <div className='column'>
                                <span className='label'>Target TMM + Other &gt; Target</span>
                                <div className='button-group'>
                                    {this.tmmRange.map( (value) => {
                                        let classes = [];
                                        if (value === this.state.tmm) {
                                            classes.push('staged');
                                        }
                                        return <button key={value} className={classes.join(' ')} disabled={this.state.artillery} onClick={() => this._adjustTMM(value)}>{value}</button>;
                                    })}
                                </div>
                            </div>
                            <div className='column'>
                                <span className='label'>Target Stealth</span>
                                <div className='button-group'>
                                    <button className={this.state.stealth === 1 ? 'staged' : ''} disabled={this.state.artillery} onClick={() => this._targetStealth(1)}>+1</button>
                                    <button className={this.state.stealth === 2 ? 'staged' : ''} disabled={this.state.artillery} onClick={() => this._targetStealth(2)}>+2</button>
                                </div>
                            </div>
                        </div>
                    ) : null }
                    
                    {this.state.bombs.max === 0 && this.props.attack.type !== 'a2a' ? (
                        <div className='column'>
                            <span className='label'>{this.state.indirect.enabled ? 'Spotter ' : '' }Terrain:</span>
                            <div className='row'>
                                <button className={this.state.terrain[0] ? 'staged' : ''} onClick={() => this._toggleTerrain(0)}>Woods</button>
                                <button className={this.state.terrain[2] ? 'staged' : ''} onClick={() => this._toggleTerrain(2)}>Partial Cover</button>
                                <button className={this.state.terrain[1] ? 'staged' : ''} onClick={() => this._toggleTerrain(1)}>Underwater</button>
                            </div>
                        </div>
                    ) : null }

                    
                        <div className='row'>
                            {!this.state.artillery && !this.props.unit?.isAerospace ? (
                                <div className='column'>
                                    <span className='label'>Damage Mods</span>
                                    <div className='row'>
                                        {this._damageOptions()}
                                    </div>
                                </div>
                            ) : null }
                            {!this.state.artillery && this.props.attack.type !== 'physical' && this.props.unit && this.props.unit.overheat > 0 && (this.state.range < 2 || (this.props.unit.hasAbility('OVL') && this.state.range < 3)) ? (
                                <div className='column'>
                                    <span className='label'>Overheat</span>
                                    <div className='button-group'>
                                        {this._overheatOptions()}
                                    </div>
                                </div>
                            ) : null }
                        </div>

                    {this.state.bombs.max > 1 ? (
                        <div className='column'>
                            <span className='label'>Number of bombs</span>
                            <div className='button-group'>
                                {this._bombOptions()}
                            </div>
                        </div>
                    ) : null }

                    <div className='end'>
                        <div className='row justified'>
                            <div className='data-pair'><span>TN</span>{this.targetNumber}</div>
                            <div className='data-pair'><span>{this.props.attack.type === 'bomb' || this.state.artillery ? 'Number of Strikes' : 'Potential Damage'}</span>{this.maxDamage}{this.state.minimal ? '*' : ''}</div>
                        </div>

                        <div className={'row results nowrap' + (this.props.appGlobals.appSettings.alphaStrikeVariableDamage.length === 0 && !this.state.artillery && this.props.attack.type !== 'bomb'? ' single-roll' : '')}>
                            <button id='roll-dice' className='button' onClick={() => this._rollAttack()}><FaDice /></button>

                            <div className='column justified'>
                                {this.toHitRollResults.length > 0  ? (
                                        <div id='hit-dice' className='row'>
                                            {this.toHitRollResults.map( (result, resultIndex) => {
                                                if (this.props.unit) {
                                                    let flk = this.props.unit.getAbilityValues('flk').damage > -1 ? this.props.unit?.getAbilityValues('flk').damage : 0;
                                                    flk += this.props.unit.getAbilityValues('flk', this.props.attack.range).minimal ? 1 : 0;
                                                    let ht = this.props.unit.getAbilityValues('ht').damage > -1 ? this.props.unit?.getAbilityValues('ht').damage : 0;
                                                    ht += this.props.unit.getAbilityValues('ht', this.props.attack.range).minimal ? 1 : 0;
                                                    let results = this.props.attack.type === 'physical' ? 1 : this.maxDamage;

                                                    if ((resultIndex < results + (this.state.minimal ? 1 : 0)) || this.state.artillery) {
                                                        let scatterDirection = this.damageRollResults[resultIndex];
                                                        let scatterDistance = this.targetNumber - result.roll1 - result.roll2;
                                                        scatterDistance = this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes ? Math.ceil(scatterDistance / 2) : scatterDistance;

                                                        let classes = result.hit ? [] : ['miss'];
                                                        if (resultIndex < flk && !result.hit) {
                                                            classes.push('flk');
                                                            if (result.roll1 + result.roll2 >= this.targetNumber - 2) {
                                                                classes.push('flk-hit');
                                                            }
                                                        } else if (resultIndex < flk + ht && resultIndex > flk) {
                                                            classes.push('ht');
                                                        }
                                                        if (this.state.minimal && resultIndex === this.toHitRollResults.length - 1) {
                                                            classes.push('minimal');
                                                        }

                                                        return <div key={resultIndex} className='die-pair'>
                                                            <DiceIcon classes={classes.join(' ')} roll={result.roll1}></DiceIcon>
                                                            <DiceIcon classes={classes.join(' ')} roll={result.roll2}></DiceIcon>
                                                            {(this.state.artillery || this.state.bombs.max > 0) && !result.hit ? (
                                                                <div><DiceIcon classes={'damage'} roll={scatterDirection.roll1}></DiceIcon> <span>{scatterDistance + (this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes ? '⬣' : '"')}</span></div>
                                                            ) : null }
                                                            {(this.state.minimal || (this.props.unit.getAbilityValues('flk', this.props.attack.range).minimal && classes.includes('flk')) || (this.props.unit.getAbilityValues('ht', this.props.attack.range).minimal && classes.includes('ht'))) && this.props.appGlobals.appSettings.alphaStrikeVariableDamage !== 'damage' ? (
                                                                <DiceIcon key={"minimal"} classes={this.damageRollResults[this.damageRollResults.length - 1].hit ? 'damage' : 'damage miss'} roll={this.damageRollResults[this.damageRollResults.length - 1].roll1}></DiceIcon>
                                                        ) : null }
                                                        </div>
                                                    }
                                                } 
                                                return null;
                                            })}
                                        </div>
                                ) : null }

                                {this._showDamageDice() ? (
                                    <div id='damage-dice' className='row'>
                                        {!this.state.minimal && this.toHitRollResults[0].hit ? this.damageRollResults.map( (result,resultIndex) => {
                                            if (resultIndex < this.maxDamage) {
                                                return <DiceIcon key={resultIndex} classes={result.hit ? 'damage' : 'damage miss'} roll={result.roll1}></DiceIcon>;
                                            } else {
                                                return null;
                                            }
                                        }) : null }
                                        {this.state.minimal || this.props.unit.getAbilityValues('ht', this.props.attack.range).minimal || (this.props.unit.getAbilityValues('flk', this.props.attack.range).minimal && !this.toHitRollResults[0].hit && this.toHitRollResults[0].roll1 + this.toHitRollResults[0].roll2 >= this.targetNumber -2) ? (
                                            <div className='die-pair'>
                                                <DiceIcon key={"minimal"} classes={this.damageRollResults[this.damageRollResults.length - 1].hit ? 'damage' : 'damage miss'} roll={this.damageRollResults[this.damageRollResults.length - 1].roll1}></DiceIcon>
                                            </div>
                                        ) : null }
                                    </div>
                                ) : null }
                            </div>
                        
                        {!this.state.artillery && this.state.bombs.max === 0 ? (
                            <div className='end row nowrap'>
                                <div className='column text-center justified data-pair fancy'>{this.totalDamage}<span>Damage</span></div>
                                {this.flk > 0 ? (<div className='column text-center justified data-pair fancy'>{this.flk}<span>FLK</span></div>) : null }
                                {this.ht > 0 ? (<div className='column text-center justified data-pair fancy'>{this.ht}<span>HT</span></div>) : null }
                                {this.crits > 0 ? (<div className='column text-center justified data-pair fancy'>{this.crits}<span>Crits</span></div>) : null }
                            </div>
                        ) : null }
                        
                        </div>
                    </div>
                </div>
            </>;
        }
    }
}

interface AlphaStrikeAttackOverlayProps {
    appGlobals: IAppGlobals;
    unit: AlphaStrikeUnit | null;
    attack: IASAttack;
    close(): void;
}

interface AlphaStrikeAttackOverlayState {
    artillery: boolean;
    targetNumber: number;
    range: number;
    baseDamage: number;
    toHit: number;
    minimal: boolean;
    // damageResult: number;
    tmm: number;
    stealth: number;
    terrain: boolean[];
    indirect: IndirectAttack;
    rear: boolean;
    spotting: boolean;
    overheat: number;
    fromRear: boolean;
    narc: boolean;
    ams: boolean;
    bombs: {
        max: number;
        using: number;
    };
    tailing: boolean;
    swordsman: boolean;
    streetFighter: boolean;
    multiTasker: number;
}

interface IndirectAttack {
    enabled: boolean;
    noSpotter: boolean;
    spotterMove: number;
    spotterAttacked: boolean;
    tag: boolean;
}

interface RollResult {
    roll1: number;
    roll2: number;
    hit: boolean;
}

export class DiceIcon extends React.Component<DiceProps> {
    
    render = (): JSX.Element => {
        let die = <></>;
        switch (this.props.roll) {
            case 1:
                die = <FaDiceOne />;
                break;
            case 2:
                die = <FaDiceTwo />;
                break;
            case 3:
                die = <FaDiceThree />;
                break;
            case 4:
                die = <FaDiceFour />;
                break;
            case 5:
                die = <FaDiceFive />;
                break;
            case 6:
                die = <FaDiceSix />;
                break;
        }
        return <span className={'die ' + this.props.classes}>{die}</span>;
    }

}

interface DiceProps {
    classes?: string;
    roll: number;
}
