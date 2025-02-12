import React from 'react';
import { AlphaStrikeUnit } from '../../../classes/alpha-strike-unit';
import { IASPilotAbility } from '../../../data/alpha-strike-pilot-abilities';
import { IASSpecialAbility } from '../../../data/alpha-strike-special-abilities';
import { IAppGlobals } from '../../app-router';
import BattleTechLogo from '../battletech-logo';
import './alpha-strike-card-svg.scss';

export default class AlphaStrikeUnitSVG extends React.Component<IAlphaStrikeUnitSVGProps, IAlphaStrikeUnitSVGState> {
    height: string = "100%";
    width: string = "auto";
    damageLeftBase = 0;
    buttonRadius = 15;

    activeDotColor = "rgb(200,0,0)";

    constructor(props: IAlphaStrikeUnitSVGProps) {
        super(props);
        this.state = {
            showTakeDamage: false,
        }
        if( this.props.height ) {
            this.height = this.props.height;
        }

        if( this.props.width ) {
            this.width = this.props.width;
        }

        this.damageLeftBase = 0;
        if( this.props.inPlay ) {
            this.damageLeftBase = 40;
        }

    }

    private _toggleTakeDamage = () => {
        this.setState({
            showTakeDamage: !this.state.showTakeDamage,
        })
    }

    private _takeDamage = ( damageTaken: number ): void => {
        if( this.props.inPlay && this.props.asUnit ) {
            this.props.asUnit.takeDamage( damageTaken );
            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
        this.setState({
            showTakeDamage: false,
        })
    }

    private _toggleArmorOrStructure = ( target: string, indexNumber: number ) => {


        if( this.props.inPlay && this.props.asUnit ) {
            if( target === "armor" ) {
                if( this.props.asUnit.currentArmor.length > indexNumber) {
                    this.props.asUnit.currentArmor[indexNumber] = !this.props.asUnit.currentArmor[indexNumber];
                    this.props.asUnit.calcCurrentValues();
                    this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
                }

            } else {
                if( this.props.asUnit.currentStructure.length > indexNumber) {
                    this.props.asUnit.currentStructure[indexNumber] = !this.props.asUnit.currentStructure[indexNumber];
                    this.props.asUnit.calcCurrentValues();
                    this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
                }
            }
        }
    }

    private _toggleEngineHit = (  indexNumber: number ) => {
        if( this.props.inPlay && this.props.asUnit ) {

            if( this.props.asUnit.engineHits.length > indexNumber) {
                this.props.asUnit.engineHits[indexNumber] = !this.props.asUnit.engineHits[indexNumber];
                this.props.asUnit.calcCurrentValues();
                this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
            }
        }
    }

    private _setHeat = ( newValue: number ) => {
        if( this.props.inPlay && this.props.asUnit ) {
            this.props.asUnit.currentHeat = newValue;
            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
    }

    private _toggleWeaponHit = (indexNumber: number ): void =>  {
        if( this.props.inPlay && this.props.asUnit ) {

            if( this.props.asUnit.weaponHits.length > indexNumber) {
                this.props.asUnit.weaponHits[indexNumber] = !this.props.asUnit.weaponHits[indexNumber];
                this.props.asUnit.calcCurrentValues();
                this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
            }
        }
    }

    private _toggleVehicle910 = (indexNumber: number ): void =>  {
        if( this.props.inPlay && this.props.asUnit ) {

            if( this.props.asUnit.vehicleMotive910.length > indexNumber) {
                this.props.asUnit.vehicleMotive910[indexNumber] = !this.props.asUnit.vehicleMotive910[indexNumber];
                this.props.asUnit.calcCurrentValues();
                this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
            }
        }
    }

    private _toggleVehicle11 = (indexNumber: number ): void =>  {
        if( this.props.inPlay && this.props.asUnit ) {

            if( this.props.asUnit.vehicleMotive11.length > indexNumber) {
                this.props.asUnit.vehicleMotive11[indexNumber] = !this.props.asUnit.vehicleMotive11[indexNumber];
                this.props.asUnit.calcCurrentValues();
                this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
            }
        }
    }

    private _toggleVehicle12 = (): void => {
        if( this.props.inPlay && this.props.asUnit ) {

            this.props.asUnit.vehicleMotive12 = !this.props.asUnit.vehicleMotive12;
            this.props.asUnit.calcCurrentValues();
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );

        }
    }

    private _toggleFireControlHit = (indexNumber: number ): void => {
        if( this.props.inPlay && this.props.asUnit ) {

            if( this.props.asUnit.fireControlHits.length > indexNumber) {
                this.props.asUnit.fireControlHits[indexNumber] = !this.props.asUnit.fireControlHits[indexNumber];
                this.props.asUnit.calcCurrentValues();
                this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
            }
        }
    }

    private _toggleMPHit = (indexNumber: number ): void => {
        if( this.props.inPlay && this.props.asUnit ) {

            if( this.props.asUnit.mpControlHits.length > indexNumber) {
                this.props.asUnit.mpControlHits[indexNumber] = !this.props.asUnit.mpControlHits[indexNumber];
                this.props.asUnit.calcCurrentValues();
                this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
            }
        }
    }

    private _showPilotAbility = (
        e: React.MouseEvent<SVGTextElement, MouseEvent>,
        ability: IASPilotAbility | null,
    ) => {
        if( e && e.preventDefault ) e.preventDefault();

        if( this.props.showPilotAbility && ability ) {
            this.props.showPilotAbility( ability );
        }
    }

    private _makeArmorDots = (
        count: number,
        fillColor: string = "rgb(255,255,255)",
        strokeColor: string = "rgb(0,0,0)",
        radius: number = 0,
        target: string = "armor",
    ): JSX.Element[] => {
        let dots: JSX.Element[] = []
        // We reduce the number of dots per row to accommodate a threshold number
        let maxCountInRow = this.props.asUnit && this.props.asUnit.threshold!==0 ? 15 : 17;
        if (!this.props.inPlay) {
            maxCountInRow = maxCountInRow + 2;
        }
        // If armor is more than 1 row, nudge the display upwards to make room for both above the structure.
        let yLoc = target === "armor" && this.props.asUnit && this.props.asUnit.armor > maxCountInRow ? -22 : -10;
        let xLoc = this.props.inPlay ? 0 : 40;

        if( radius === 0 ) {
            radius = this.buttonRadius - 5;
        }
        let currentLeftCount = 0;
        for( let currentCount = 0; currentCount < count; currentCount++ ) {

            if( currentCount > maxCountInRow-1 ) {
                if( currentCount === maxCountInRow) {
                    currentLeftCount = 0;
                    yLoc = yLoc + radius*2 + 6;
                } else {
                    currentLeftCount++;
                }
            } else {
                currentLeftCount = currentCount;
            }
            dots.push(
                <React.Fragment key={currentCount}>
                    <circle className={this.props.inPlay ? "cursor-pointer" : ""}
                        cx={xLoc + this.damageLeftBase + 4 + (currentLeftCount * (radius * 2 + 6)) }
                        cy={yLoc}
                        r={radius}
                        stroke={strokeColor}
                        strokeWidth={2}
                        fill={this.props.inPlay && this.props.asUnit && this.props.asUnit.currentStructure.length > currentCount && this.props.asUnit.currentStructure[currentCount] ? this.activeDotColor : fillColor}
                        onClick={() => this._toggleArmorOrStructure( target, currentCount )}
                    />
                </React.Fragment>
            )
        }

        return dots;
    }

    render = (): JSX.Element => {
        if( !this.props.asUnit ) {
            return <></>
        }

        let showHeat = this.props.asUnit.type.toLocaleLowerCase() === "bm" || this.props.asUnit.type.toLocaleLowerCase() === "af";
        let critLineStart = showHeat ? 63 : 72;
        let critLineHeight = showHeat ? 33 : 36;

        let damageLabelColWidth = 110;
        let damageColWidth=170;
        if ((this.props.showExtreme && this.props.asUnit.damage.extreme > 0) || this.props.asUnit.isAerospace){
            damageColWidth = 120;
            damageLabelColWidth = 100;
        }

        let shortDamageX = damageLabelColWidth;
        let mediumDamageX = damageLabelColWidth + damageColWidth;
        let longDamageX = damageLabelColWidth + damageColWidth*2;
        let extremeDamageX = damageLabelColWidth + damageColWidth*3;

        let pilotAbilitiesList = this.props.asUnit.getPilotAbilityList();
        let pilotAbilities = this.props.asUnit.getPilotAbilities();

        return (

            <>
                <svg className={"alpha-strike-card unit-type-" + this.props.asUnit.type.toLowerCase() + " " + this.props.className} version="1.1" x="0px" y="0px" viewBox="0 0 1050 750" xmlns="http://www.w3.org/2000/svg">
                
                <rect x="0" y="0" width="100%" height="100%" fill="rgb(35,31,32)"></rect>
                <rect x="20" y="20" style={{zIndex: -1}} width="1010" height="710" fill={this.props.asUnit.isWrecked() ? this.activeDotColor : "rgb(255,255,255)"}></rect>                    

                {this.props.asUnit.imageURL ? (
                    <image x="770" y="100" href={this.props.asUnit.imageURL} className="unit-portrait"></image>
                ) : (
                    <></>
                )}

                {/* Unit Name */}
                <g className='card-name' transform='translate(36, 50)'>
                    <text x="0" y="2" className="variant">{this.props.asUnit.customName ? this.props.asUnit.customName : this.props.asUnit.variant}</text>
                    <text x="0" y="60" className="impact">{this.props.asUnit.class ? this.props.asUnit.class : this.props.asUnit.name.replace(this.props.asUnit.variant, " ").trim()}</text>

                    {pilotAbilitiesList.length > 0 ? (
                    <>
                        <text
                            x="0"
                            y={showHeat ? 92 : 99 }
                            fill="rgb(0,130,0)"
                            className='pilot-abilities'>
                            {pilotAbilitiesList.length > 1 ? (
                                <>Pilot Abilities: </>
                            ) : (
                                <>Pilot Ability: </>
                            )}
                        {pilotAbilities.map( (ability, abilityIndex) => {
                            if (ability) {
                                let comma = abilityIndex < pilotAbilitiesList.length - 1 ? ", " : "";
                                return <tspan key={abilityIndex} className={this.props.forPrint ? '' : 'cursor-pointer'} onClick={(e) => this._showPilotAbility(e, this.props.asUnit ? ability : null)}>{ability.ability}{comma}</tspan>;
                            } else {
                                return null;
                            }
                        })}
                        </text>
                        
                        <text x="0" y={showHeat ? 122 : 136} textAnchor="start" className='spa small data-pair'><tspan>SPA Total: </tspan>{this.props.asUnit.getTotalPilotAbilityPoints()}</text>
                    </>
                    ) : null}
                </g>

                {/* Point Value Box */}
                <g transform="translate(1030, 20)" className='point-value'>
                    <path d="M -100 0 L -136 68 H -42 L -6 0" fill="rgb(188,189,192"/>
                    <path d="M -226 -1 L -180 80 H 0" fill='transparent' stroke='rgb(0,0,0)' strokeWidth={3}/>
                    <path d="M -213 -1 L -174 68 H 0" fill='transparent' stroke='rgb(0,0,0)' strokeWidth={3}/>
                    <text x="-90" y="48" textAnchor="middle" className='current'><tspan>PV: </tspan>{this.props.asUnit.currentPoints}</text>
                    {this.props.asUnit.currentPoints !== this.props.asUnit.basePoints ? (
                        <text x="-10" y="106" textAnchor="end" className='base small data-pair'><tspan>Base PV: </tspan>{this.props.asUnit.basePoints.toString().toUpperCase()}</text>
                    ) : null}
                    
                </g>

                {/* Movement Box  */}
                <g transform={showHeat ? "translate(36, 186)" : "translate(36, 210)"}>
                    <rect x="0" y="0" width="538" height="90" fill="rgb(209,210,212)" stroke="rgb(0,0,0)" strokeWidth={3} rx="15" ry="15"></rect>
                    <g transform="translate(10, 31)">
                        <text x="0" y="0" className='data-pair'><tspan>TP: </tspan>{this.props.asUnit.type}</text>
                        <text x="116" y="0" className='data-pair'><tspan>SZ: </tspan>{this.props.asUnit.size}</text>
                        <text x="198" y="0" className='data-pair'><tspan>TMM: </tspan>{this.props.asUnit.currentTMM}</text>
                        <text x="518" y="0" className='data-pair' textAnchor='end'><tspan>{this.props.asUnit.isGroundUnit() ? "MV: " : "THR: "}</tspan>{this.props.measurementsInHexes ? this.props.asUnit.currentMoveHexes.trim() : this.props.asUnit.currentMove.trim()}</text>
                        {this.props.asUnit.isGroundUnit() && !this.props.forPrint ? (
                            <>
                                <text x="518" y="20" className='data-pair small' textAnchor='end'><tspan>Sprint: </tspan>{this.props.measurementsInHexes ? this.props.asUnit.currentMoveHexesSprint.trim() : this.props.asUnit.currentMoveSprint.trim()}</text>
                            </>
                        ) : null}
                    </g>

                    <g transform="translate(10, 80)">
                        <text x="0" y="0" className='data-pair'><tspan>ROLE: </tspan>{this.props.asUnit.role.toUpperCase()}</text>
                        <text x="518" y="0" className='data-pair' textAnchor='end'><tspan>SKILL: </tspan>{this.props.asUnit.currentSkill}</text>
                    </g>
                </g>

                {/* Damage Box */}
                <g transform={showHeat ? "translate(36, 286)" : "translate(36, 324)"}>
                    <rect x="0" y="0" width="540" height="90" fill="rgb(209,210,212)" stroke='rgb(0,0,0)' strokeWidth={3} rx="20" ry="20"></rect>
                    <text x="-45" y="25" className='vertical-text' textAnchor="middle" >DAMAGE</text>

                    <g transform={'translate(' + shortDamageX +',24)'} className="damage-column">
                        <text x="0" y="0">S (0{this.props.forPrint ? "" : " | " + this.props.asUnit.currentToHitShort + "+"})</text>
                        <text x="0" y="35" className='damage'>{this.props.asUnit.currentDamage.short}{this.props.asUnit.currentDamage.shortMinimal ? "*" : ""}</text>
                        <text x="0" y="56">{this.props.measurementsInHexes ? "0-3⬣" : '0-6'}</text>
                    </g>

                    <g transform={'translate(' + mediumDamageX +',24)'} className="damage-column">
                        <text x="0" y="0">M (2{this.props.forPrint ? "" : " | " + this.props.asUnit.currentToHitMedium + "+"})</text>
                        <text x="0" y="35" className='damage'>{this.props.asUnit.currentDamage.medium}{this.props.asUnit.currentDamage.mediumMinimal ? "*" : ""}</text>
                        <text x="0" y="56">{this.props.measurementsInHexes ? "4-12⬣" : '6-24'}</text>
                    </g>

                    <g transform={'translate(' + longDamageX +',24)'} className="damage-column">
                        <text x="0" y="0">L (4{this.props.forPrint ? "" : " | " + this.props.asUnit.currentToHitLong + "+"})</text>
                        <text x="0" y="35" className='damage'>{this.props.asUnit.currentDamage.long}{this.props.asUnit.currentDamage.longMinimal ? "*" : ""}</text>
                        <text x="0" y="56">{this.props.measurementsInHexes ? "13-21⬣" : '24-42'}</text>
                    </g>

                    {this.props.showExtreme || this.props.asUnit.isAerospace ? (
                    <g transform={'translate(' + extremeDamageX +',24)'} className="damage-column">
                        <text x="0" y="0">E (4{this.props.forPrint ? "" : " | " + this.props.asUnit.currentToHitExtreme + "+"})</text>
                        <text x="0" y="35" className='damage'>{this.props.asUnit.currentDamage.extreme}{this.props.asUnit.currentDamage.extremeMinimal ? "*" : ""}</text>
                        <text x="0" y="56" className='range'>{this.props.measurementsInHexes ? ">22⬣" : '>42'}</text>
                    </g>
                    ) : null}

                </g>

                {/* Heat Scale Box */}
                {showHeat ? (
                <g transform="translate(36, 386)">
                    <rect x="0" y="0" width="538" height="60" fill="rgb(209,210,212)" stroke='rgb(0,0,0)' strokeWidth={3} rx="20" ry="20"></rect>
                    <text x="10" y="41" className='data-pair'><tspan>OV: </tspan>{this.props.asUnit.overheat}</text>
                    <rect x="99" y="14" width="2" height="34" fill="rgb(0,0,0)"></rect>
                    <text x="112" y="41" className='data-pair'>HEAT SCALE</text>

                    <g transform="translate(310, 7)">
                    <rect x="0" y="0" width="212" height="46" fill="rgb(0,0,0)" stroke="rgb(0,0,0)" strokeWidth={3} rx="15" ry="15"></rect>

                    {/* 1 Heat */}
                        <rect
                            onClick={() => this._setHeat(this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 1 ? 0 : 1)}
                            className={this.props.inPlay && this.props.asUnit ? "cursor-pointer" : ""}
                            x="1"
                            y="1"
                            width="30"
                            height="44"
                            rx="15"
                            fill={this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 1 ? "rgb(204, 187, 0)" : "rgb(102,102,102)"}
                        ></rect>
                        <rect
                            onClick={() => this._setHeat(this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 1 ? 0 : 1)}
                            className={this.props.inPlay && this.props.asUnit ? "cursor-pointer" : ""}
                            x="16"
                            y="1"
                            width="35"
                            height="44"
                            fill={this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 1 ? "rgb(204, 187, 0)" : "rgb(102,102,102)"}
                        ></rect>
                        <text onClick={() => this._setHeat(this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 1 ? 0 : 1)} className={this.props.inPlay && this.props.asUnit ? "heat-text cursor-pointer" : "heat-text"} x="26" y="34" textAnchor="middle">1</text>

                        {/* 2 Heat */}
                        <rect
                            onClick={() => this._setHeat(this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 2 ? 0 : 2)}
                            className={this.props.inPlay && this.props.asUnit ? "cursor-pointer" : ""}
                            x="54"
                            y="1"
                            width="50"
                            height="44"
                            fill={this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 2 ? "rgb(236,87,16)" : "rgb(102,102,102)"}
                        ></rect>
                        <text onClick={() => this._setHeat(this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 2 ? 0 : 2)} className={this.props.inPlay && this.props.asUnit ? "heat-text cursor-pointer" : "heat-text"} x="79" y="34" textAnchor="middle">2</text>

                        {/* 3 Heat */}
                        <rect
                        onClick={() => this._setHeat(this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 3 ? 0 : 3)}
                        className={this.props.inPlay && this.props.asUnit ? "cursor-pointer" : ""}
                            x="107"
                            y="1"
                            width="50"
                            height="44"
                            fill={this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 3 ? "rgb(200,0,0)" : "rgb(102,102,102)"}
                        ></rect>
                        <text onClick={() => this._setHeat(this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 3 ? 0 : 3)} className={this.props.inPlay && this.props.asUnit ? "heat-text cursor-pointer" : "heat-text"} x="132" y="34" textAnchor="middle">3</text>

                        {/* Shutdown Heat */}
                        <rect
                            onClick={() => this._setHeat(this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 4 ? 0 : 4)}
                            className={this.props.inPlay && this.props.asUnit ? "cursor-pointer" : ""}
                            x="160"
                            y="1"
                            width="35"
                            height="44"
                            fill={this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat > 3 ? "rgb(255,10,10)" : "rgb(102,102,102)"}
                        ></rect>
                        <rect
                            onClick={() => this._setHeat(this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 4 ? 0 : 4)}
                            className={this.props.inPlay && this.props.asUnit ? "cursor-pointer" : ""}
                            x="180"
                            y="1"
                            width="30"
                            height="44"
                            rx="15"
                            ry="15"
                            fill={this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat > 3 ? "rgb(255,10,10)" : "rgb(102,102,102)"}
                        ></rect>
                        <text onClick={() => this._setHeat(this.props.inPlay && this.props.asUnit && this.props.asUnit.currentHeat === 4 ? 0 : 4)} className={this.props.inPlay && this.props.asUnit ? "heat-text cursor-pointer" : "heat-text"} x="185" y="34" textAnchor="middle">S</text>
                    </g>
                </g>
                ) : null}
                {/* End Heat Scale Box */}
                

                {/* Armor and Structure Box */}
                <g transform={showHeat ? "translate(36, 456)" : "translate(36, 440)"}>
                    <rect x="0" y="0" width="538" height="90" fill="rgb(209,210,212)" stroke='rgb(0,0,0)' strokeWidth={3} rx="20" ry="20"></rect>

                    {this.props.inPlay ? (
                        <>
                        <rect onClick={this._toggleTakeDamage} className="cursor-pointer" x="5" y="5" width="45" height="80" fill="rgb(255,0, 0)" rx="15" ry="15" />
                        <text x="-45" y="21" onClick={this._toggleTakeDamage} className='vertical-text cursor-pointer' fill="rgba(255,255,255)" textAnchor="middle" >TAKE</text>
                        <text x="-45" y="38" onClick={this._toggleTakeDamage} className='vertical-text cursor-pointer' fill="rgba(255,255,255)" textAnchor="middle" >DAMAGE</text>
                        </>
                    ): (
                        <></>
                    )}

                    {this.state.showTakeDamage ? (
                        <g transform='translate(62, 25)'>
                            <text x="231.5" y="-7" textAnchor="middle" fontFamily="sans-serif" fontSize="18">Click below to add damage taken</text>
                            <rect x="0" y="0" width="463" height="60" fill="rgb(0,0,0)" rx="15" ry="15"></rect>

                            <rect className="cursor-pointer" onClick={() => this._takeDamage(1)} x="2" y="2" rx="15" ry="15" width="30" height="56" fill="rgb(102,102,102)"></rect>
                            <rect className="cursor-pointer" onClick={() => this._takeDamage(1)} x="20" y="2" width="30" height="56" fill="rgb(102,102,102)"></rect>
                            <text className="cursor-pointer" onClick={() => this._takeDamage(1)} x="27" y="42" textAnchor="middle" style={{fill: "rgb(255,255,255)"}} fontFamily="sans-serif" fontSize={35}>1</text>

                            <rect className="cursor-pointer" onClick={() => this._takeDamage(2)} x="52" y="2" width="50" height="56" fill="rgb(102,102,102)"></rect>
                            <text className="cursor-pointer" onClick={() => this._takeDamage(2)} x="77" y="42" textAnchor="middle" style={{fill: "rgb(255,255,255)"}} fontFamily="sans-serif" fontSize={35}>2</text>

                            <rect className="cursor-pointer" onClick={() => this._takeDamage(3)} x="104" y="2" width="50" height="56" fill="rgb(102,102,102)"></rect>
                            <text className="cursor-pointer" onClick={() => this._takeDamage(3)} x="129" y="42" textAnchor="middle" style={{fill: "rgb(255,255,255)"}} fontFamily="sans-serif" fontSize={35}>3</text>

                            <rect className="cursor-pointer" onClick={() => this._takeDamage(4)} x="156" y="2" width="50" height="56" fill="rgb(102,102,102)"></rect>
                            <text className="cursor-pointer" onClick={() => this._takeDamage(4)} x="181" y="42" textAnchor="middle" style={{fill: "rgb(255,255,255)"}} fontFamily="sans-serif" fontSize={35}>4</text>

                            <rect className="cursor-pointer" onClick={() => this._takeDamage(5)} x="208" y="2" width="50" height="56" fill="rgb(102,102,102)"></rect>
                            <text className="cursor-pointer" onClick={() => this._takeDamage(5)} x="233" y="42" textAnchor="middle" style={{fill: "rgb(255,255,255)"}} fontFamily="sans-serif" fontSize={35}>5</text>

                            <rect className="cursor-pointer" onClick={() => this._takeDamage(6)} x="260" y="2" width="50" height="56" fill="rgb(102,102,102)"></rect>
                            <text className="cursor-pointer" onClick={() => this._takeDamage(6)} x="285" y="42" textAnchor="middle" style={{fill: "rgb(255,255,255)"}} fontFamily="sans-serif" fontSize={35}>6</text>

                            <rect className="cursor-pointer" onClick={() => this._takeDamage(7)} x="312" y="2" width="50" height="56" fill="rgb(102,102,102)"></rect>
                            <text className="cursor-pointer" onClick={() => this._takeDamage(7)} x="337" y="42" textAnchor="middle" style={{fill: "rgb(255,255,255)"}} fontFamily="sans-serif" fontSize={35}>7</text>

                            <rect className="cursor-pointer" onClick={() => this._takeDamage(8)} x="364" y="2" width="50" height="56" fill="rgb(102,102,102)"></rect>
                            <text className="cursor-pointer" onClick={() => this._takeDamage(8)} x="389" y="42" textAnchor="middle" style={{fill: "rgb(255,255,255)"}} fontFamily="sans-serif" fontSize={35}>8</text>

                            <rect className="cursor-pointer" onClick={() => this._takeDamage(9)} x="431" y="2" rx="15" ry="15" width="30" height="56" fill="rgb(102,102,102)"></rect>
                            <rect className="cursor-pointer" onClick={() => this._takeDamage(9)} x="416" y="2" width="30" height="56" fill="rgb(102,102,102)"></rect>
                            <text className="cursor-pointer" onClick={() => this._takeDamage(9)} x="438" y="42" textAnchor="middle" style={{fill: "rgb(255,255,255)"}} fontFamily="sans-serif" fontSize={35}>9</text>
                        </g>
                    ) : (

                        <>
                        {/* Armor */}
                        <g transform={this.props.inPlay ? 'translate(56,38)' : 'translate(10,38)'}>
                            <text x="0" y="0" className='data-pair'><tspan>A:</tspan></text>
                            {this._makeArmorDots(
                                this.props.asUnit.armor,
                                "rgb(255,255,255)",
                                "rgb(0,0,0)",
                                0,
                                "armor",
                            )}
                        </g>
                        {/* End Armor */}

                        {/* Structure */}
                        <g transform={this.props.asUnit.armor >  (this.props.asUnit && this.props.asUnit.threshold!==0 ? 15 : 17) ? (
                                this.props.inPlay ? 'translate(56,80)' : 'translate(10,80)'
                            ) : (
                                this.props.inPlay ? 'translate(56,76)' : 'translate(10,76)'
                            )}>
                            <text x="0" y="0" className='data-pair'><tspan>S:</tspan></text>
                            {this._makeArmorDots(
                                this.props.asUnit.structure,
                                "rgb(153,153,153)",
                                "rgb(0,0,0)",
                                0,
                                "structure",
                            )}
                        </g>
                        {/* End Structure */}

                        {/* Threshold Display */}
                        {this.props.asUnit.threshold!==0 ? (
                            <g transform='translate(503, 36)' className='data-pair'>
                                <text x="0" y="0" textAnchor="middle"><tspan>TH</tspan></text>
                                <text x="0" y="40" textAnchor="middle" className='threshold'>{this.props.asUnit.threshold}</text>
                            </g>
                        ) : null
                        }
                        {/* End Threshold Display */}
                        </>
                    )}

                </g>
                {/* End Armor and Structure Box */}

                {/* Specials Box */}
                <g transform='translate(36, 556)'>
                <rect x="0" y="0" width="538" height="80" fill="rgb(209,210,212)" stroke='rgb(0,0,0)' strokeWidth={3} rx="20" ry="20"></rect>
                <foreignObject x="14" y="3" width="512" height="70">
                    <p className='specials'>SPECIAL:&nbsp;
                    {this.props.asUnit.abilities.map( (word, wordIndex) => {
                        let comma = this.props.asUnit && wordIndex < this.props.asUnit.abilities.length - 1 ? ", " : "";

                        if( this.props.asUnit && this.props.inPlay ) {
                            let ability = this.props.asUnit.getSpecialAbility(word);
                            if( ability !== null ) {
                                return (
                                    //@ts-ignore
                                    <React.Fragment key={wordIndex}><a onClick={(e) => this.props.showSpecialAbility(e, ability)} title={"Click here to view the description for " + word} href="/">{word}</a>{comma}</React.Fragment>
                                )
                            } else {
                                return (
                                    <React.Fragment key={wordIndex}>{word}{comma}</React.Fragment>
                                )
                            }
                        } else {
                            return (
                                <React.Fragment key={wordIndex}>{word}{comma}</React.Fragment>
                            )
                        }
                    })}
                    </p>
                </foreignObject>
                </g>

                {/* Critical Hits */}
                {!this.props.asUnit.isInfantry && this.props.asUnit.type !== "JS" ? (
                <g transform={showHeat ? "translate(584, 456)" : "translate(584, 440)"}>
                {/* Outline Box and Title */}
                <rect x="0" y="0" width="430" height={showHeat ? 180 : 196} fill="rgb(209,210,212)" stroke='rgb(0,0,0)' strokeWidth={3} rx="20" ry="20"></rect>
                <text x="215" y={showHeat ? 33 : 39} textAnchor="middle" fontSize="35" className='strong'>CRITICAL HITS</text>
                {/* End Outline Box and Title */}

                {this.props.asUnit.type.toLowerCase() !== "pm" ? (
                    <>
                        <text x="144" y={critLineStart} textAnchor="end" className='crit-label'>ENGINE</text>

                        {this.props.asUnit.engineHits.map( (ehValue, ehIndex) => {
                            let fillColor = "rgb(255,255,255)";
                            if( ehValue ) {
                                fillColor = this.activeDotColor;
                            }
                            return (
                                <React.Fragment key={ehIndex}>
                                    <circle
                                        cx={161 + (this.buttonRadius * 1.8 + 1) * ehIndex}
                                        cy={critLineStart - 27 + this.buttonRadius + 4}
                                        r={this.buttonRadius - 3}
                                        fill={fillColor}
                                        stroke="rgb(0,0,0)"
                                        strokeWidth={2}
                                        className={this.props.inPlay ? "cursor-pointer" : ""}
                                        onClick={() => this._toggleEngineHit(ehIndex)}
                                    ></circle>
                                </React.Fragment>
                            )
                        })}

                        <text x={151 + (this.buttonRadius * 1.8)*2} y={critLineStart} textAnchor="start" className='crit-description'>{this.props.asUnit.type.toLowerCase() === 'cv' ||  this.props.asUnit.type.toLowerCase() === 'sv' ? "½ MV and Damage" : "+1 Heat/Firing Weapons"}</text>
                        {critLineStart += critLineHeight}
                    </>
                ) : (
                    <></>
                )}

                <text x="144" y={critLineStart} textAnchor="end" className='crit-label'>FIRE CONTROL</text>
                {this.props.asUnit.fireControlHits.map( (fcValue, fcIndex) => {
                            let fillColor = "rgb(255,255,255)";
                            if( fcValue ) {
                                fillColor = this.activeDotColor;
                            }
                            return (
                                <React.Fragment key={fcIndex}>
                                    <circle
                                        cx={161 + (this.buttonRadius * 1.8 + 1) * fcIndex}
                                        cy={critLineStart - 27 + this.buttonRadius + 4}
                                        r={this.buttonRadius - 3}
                                        fill={fillColor}
                                        stroke="rgb(0,0,0)"
                                        strokeWidth={2}
                                        className={this.props.inPlay ? "cursor-pointer" : ""}
                                        onClick={() => this._toggleFireControlHit(fcIndex)}
                                    ></circle>
                                </React.Fragment>
                            )
                })}
                <text x={152 + (this.buttonRadius * 1.8)*4} y={critLineStart} textAnchor="start" className='crit-description'>+2 To Hit Each</text>
                {critLineStart += critLineHeight}

                {this.props.asUnit.type.toLowerCase() === 'bm' || this.props.asUnit.type.toLowerCase() === 'pm' ? (
                    <>
                        <text x="144" y={critLineStart} textAnchor="end" className='crit-label'>MP</text>
                        {this.props.asUnit.mpControlHits.map( (mpValue, mpIndex) => {
                            let fillColor = "rgb(255,255,255)";
                            if( mpValue ) {
                                fillColor = this.activeDotColor;
                            }
                            return (
                                <React.Fragment key={mpIndex}>
                                    <circle
                                        cx={161 + (this.buttonRadius * 1.8 + 1) * mpIndex}
                                        cy={critLineStart - 27 + this.buttonRadius + 4}
                                        r={this.buttonRadius - 3}
                                        fill={fillColor}
                                        stroke="rgb(0,0,0)"
                                        strokeWidth={2}
                                        className={this.props.inPlay ? "cursor-pointer" : ""}
                                        onClick={() => this._toggleMPHit(mpIndex)}
                                    ></circle>
                                </React.Fragment>
                            )
                        })}
                        <text x={153 + (this.buttonRadius * 1.8)*4} y={critLineStart} textAnchor="start" className='crit-description'>½ Move Each</text>
                        {critLineStart += critLineHeight}
                    </>
                ) :
                (
                    <></>
                )}

                <text x="144" y={critLineStart} textAnchor="end" className='crit-label'>WEAPONS</text>
                {this.props.asUnit.weaponHits.map( (whValue, whIndex) => {
                            let fillColor = "rgb(255,255,255)";
                            if( whValue ) {
                                fillColor = this.activeDotColor;
                            }
                            return (
                                <React.Fragment key={whIndex}>
                                    <circle
                                        cx={161 + (this.buttonRadius * 1.8 + 1) * whIndex}
                                        cy={critLineStart - 27 + this.buttonRadius + 4}
                                        r={this.buttonRadius - 3}
                                        fill={fillColor}
                                        stroke="rgb(0,0,0)"
                                        strokeWidth={2}
                                        className={this.props.inPlay ? "cursor-pointer" : ""}
                                        onClick={() => this._toggleWeaponHit(whIndex)}
                                    ></circle>
                                </React.Fragment>
                            )
                })}
                <text x={153 + (this.buttonRadius * 1.8)*4} y={critLineStart} textAnchor="start" textRendering={"optimizeLegibility"} className='crit-description'>-1 Damage Each</text>
                {critLineStart += critLineHeight}

                {this.props.asUnit.type.toLowerCase() === 'cv' ||  this.props.asUnit.type.toLowerCase() === 'sv'? (
                    <>  
                        <g transform={"translate(0, " + (critLineStart - 2) + ")"}>
                            <text x="16" y="0" textAnchor="start" className='crit-label'>MOTIVE</text>

                            <g transform='translate(112, 0)'>
                                <circle onClick={() => this._toggleVehicle910(0)} className="" cx="0" cy={this.buttonRadius - 23} r={this.buttonRadius - 3} fill={this.props.asUnit.vehicleMotive910[0] ? this.activeDotColor : "rgb(255,255,255)"} stroke='rgb(0,0,0)' strokeWidth={2}></circle>
                                <circle onClick={() => this._toggleVehicle910(1)} className="" cx="28" cy={this.buttonRadius - 23} r={this.buttonRadius - 3} fill={this.props.asUnit.vehicleMotive910[1] ? this.activeDotColor : "rgb(255,255,255)"} stroke='rgb(0,0,0)' strokeWidth={2}></circle>
                                <text x="44" y="0" textAnchor="start" className='crit-description'>-2 MV</text>
                            </g>

                            <g transform='translate(230, 0)'>
                                <circle onClick={() => this._toggleVehicle11(0)} className="" cx="0" cy={this.buttonRadius - 23} r={this.buttonRadius - 3} fill={this.props.asUnit.vehicleMotive11[0] ? this.activeDotColor : "rgb(255,255,255)"} stroke='rgb(0,0,0)' strokeWidth={2}></circle>
                                <circle onClick={() => this._toggleVehicle11(1)} className="" cx="28" cy={this.buttonRadius - 23} r={this.buttonRadius - 3} fill={this.props.asUnit.vehicleMotive11[1] ? this.activeDotColor : "rgb(255,255,255)"} stroke='rgb(0,0,0)' strokeWidth={2}></circle>
                                <text x="44" y="0" textAnchor="start" className='crit-description'>½ MV</text>
                            </g>
                            
                            <g transform='translate(352, 0)'>
                                <circle onClick={() => this._toggleVehicle12()} className="" cx="0" cy={this.buttonRadius - 23} r={this.buttonRadius - 3} fill={this.props.asUnit.vehicleMotive12 ? this.activeDotColor : "rgb(255,255,255)"} stroke='rgb(0,0,0)' strokeWidth={2}></circle>
                                <text x="16" y="0" textAnchor="start" className='crit-description'>0 MV</text>
                            </g>
                        </g>
                        {critLineStart += critLineHeight}
                    </>
                ) : (
                    <></>
                )}

                    </g>
                ) : (
                    <>
                        {/* Infantry has no crits */}
                    </>
                )}

                {/* End Critical Hits */}

                {this.props.asUnit.isWrecked() ? (
                    <>
                    <text x="0" y="100" fontFamily="sans-serif" transform="rotate( 30, -100, 260)" fontSize="200" stroke="rgb(0,0,0)" strokeWidth="4" fill="rgb(200,0,0)" pointerEvents="none">WRECKED</text>
                    </>
                ) : (
                    <></>
                )}

                <g transform='translate(20, 650)'>
                <path d="M 0 50 L 19 80 H 0" fill="rgb(188,189,192"/>
                <path d="M 96 15 H 188 L 226 80 H 134" fill="rgb(188,189,192"/>
                <path d="M 300 15 H 392 L 430 80 H 338" fill="rgb(188,189,192"/>
                <path d="M 0 15 H 475 L 513 80" fill='transparent' stroke='rgb(0,0,0)' strokeWidth={3}/>
                <path d="M 0 0 H 486 L 532 80" fill='transparent' stroke='rgb(0,0,0)' strokeWidth={3}/>
                <text x="21" y="64" textAnchor="start" className='card-title'>ALPHA STRIKE STATS</text>
                </g>

                <BattleTechLogo
                    xLoc={586}
                    yLoc={660}
                    width={414}
                    baseColor='rgb(35,31,32)'
                    altColor='rgb(105,106,108)'
                />

                </svg>
            </>
        )
    }
}

interface IAlphaStrikeUnitSVGProps {
    height?: string;
    width?: string;
    asUnit: AlphaStrikeUnit | null;
    inPlay?: boolean;
    appGlobals: IAppGlobals;
    className?: string;
    forPrint?: boolean;
    showExtreme?: boolean;
    measurementsInHexes: boolean;
    showPilotAbility?( ability: IASPilotAbility ): void;
    showSpecialAbility?(
        e: React.FormEvent<HTMLAnchorElement>,
        ability: IASSpecialAbility
      ): void
}

interface IAlphaStrikeUnitSVGState {
    showTakeDamage: boolean;

}