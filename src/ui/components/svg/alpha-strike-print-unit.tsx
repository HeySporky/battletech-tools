import React from 'react';
import { AlphaStrikeUnit } from '../../../classes/alpha-strike-unit';
import { IASPilotAbility } from '../../../data/alpha-strike-pilot-abilities';
import { IASSpecialAbility } from '../../../data/alpha-strike-special-abilities';
import { IAppGlobals } from '../../app-router';
import BattleTechLogo from '../battletech-logo';
import './alpha-strike-card-svg.scss';

export default class AlphaStrikePrintUnitSVG extends React.Component<IAlphaStrikePrintUnitSVGProps, IAlphaStrikePrintUnitSVGState> {
    height: string = "100%";
    width: string = "auto";
    damageLeftBase = 0;
    buttonRadius = 15;

    activeDotColor = "rgb(200,0,0)";

    constructor(props: IAlphaStrikePrintUnitSVGProps) {
        super(props);
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
                    <circle
                        cx={xLoc + this.damageLeftBase + 4 + (currentLeftCount * (radius * 2 + 6)) }
                        cy={yLoc}
                        r={radius}
                        stroke={strokeColor}
                        strokeWidth={2}
                        fill={fillColor}
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
                <rect x="20" y="20" style={{zIndex: -1}} width="1010" height="710" fill={"rgb(255,255,255)"}></rect>                    

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
                                return <tspan key={abilityIndex}>{ability.ability}{comma}</tspan>;
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
                        <text x="112" y="0" className='data-pair'><tspan>SZ: </tspan>{this.props.asUnit.size}</text>
                        <text x="192" y="0" className='data-pair'><tspan>TMM: </tspan>{this.props.asUnit.currentTMM}</text>
                        <text x="518" y="0" className='data-pair' textAnchor='end'><tspan>{this.props.asUnit.isGroundUnit() ? "MV: " : "THR: "}</tspan>{this.props.measurementsInHexes ? this.props.asUnit.currentMoveHexes.trim() : this.props.asUnit.currentMove.trim()}</text>
                        {this.props.asUnit.isGroundUnit() && !this.props.forPrint ? (
                            <>
                                <text x="518" y="20" className='data-pair small' textAnchor='end'><tspan>Sprint: </tspan>{this.props.measurementsInHexes ? this.props.asUnit.currentMoveHexesSprint.trim() : 1}</text>
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
                        <text x="0" y="0">S (0)</text>
                        <text x="0" y="35" className='damage'>{this.props.asUnit.currentDamage.short}{this.props.asUnit.currentDamage.shortMinimal ? "*" : ""}</text>
                        <text x="0" y="56">{this.props.measurementsInHexes ? "0-3⬣" : '0-6'}</text>
                    </g>

                    <g transform={'translate(' + mediumDamageX +',24)'} className="damage-column">
                        <text x="0" y="0">M (2)</text>
                        <text x="0" y="35" className='damage'>{this.props.asUnit.currentDamage.medium}{this.props.asUnit.currentDamage.mediumMinimal ? "*" : ""}</text>
                        <text x="0" y="56">{this.props.measurementsInHexes ? "4-12⬣" : '6-24'}</text>
                    </g>

                    <g transform={'translate(' + longDamageX +',24)'} className="damage-column">
                        <text x="0" y="0">L (4)</text>
                        <text x="0" y="35" className='damage'>{this.props.asUnit.currentDamage.long}{this.props.asUnit.currentDamage.longMinimal ? "*" : ""}</text>
                        <text x="0" y="56">{this.props.measurementsInHexes ? "13-21⬣" : '24-42'}</text>
                    </g>

                    {this.props.showExtreme || this.props.asUnit.isAerospace ? (
                    <g transform={'translate(' + extremeDamageX +',24)'} className="damage-column">
                        <text x="0" y="0">E (4)</text>
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
                            x="1"
                            y="1"
                            width="30"
                            height="44"
                            rx="15"
                            fill={"rgb(102,102,102)"}
                        ></rect>
                        <rect
                            x="16"
                            y="1"
                            width="35"
                            height="44"
                            fill={"rgb(102,102,102)"}
                        ></rect>
                        <text className='heat-text' x="26" y="34" textAnchor="middle">1</text>

                        {/* 2 Heat */}
                        <rect
                            x="54"
                            y="1"
                            width="50"
                            height="44"
                            fill={"rgb(102,102,102)"}
                        ></rect>
                        <text className='heat-text' x="79" y="34" textAnchor="middle">2</text>

                        {/* 3 Heat */}
                        <rect
                            x="107"
                            y="1"
                            width="50"
                            height="44"
                            fill={"rgb(102,102,102)"}
                        ></rect>
                        <text className='heat-text' x="132" y="34" textAnchor="middle">3</text>

                        {/* Shutdown Heat */}
                        <rect
                            x="160"
                            y="1"
                            width="35"
                            height="44"
                            fill={"rgb(102,102,102)"}
                        ></rect>
                        <rect
                            x="180"
                            y="1"
                            width="30"
                            height="44"
                            rx="15"
                            ry="15"
                            fill={"rgb(102,102,102)"}
                        ></rect>
                        <text className='heat-text' x="185" y="34" textAnchor="middle">S</text>
                    </g>
                </g>
                ) : null}
                {/* End Heat Scale Box */}
                

                {/* Armor and Structure Box */}
                <g transform={showHeat ? "translate(36, 456)" : "translate(36, 440)"}>
                    <rect x="0" y="0" width="538" height="90" fill="rgb(209,210,212)" stroke='rgb(0,0,0)' strokeWidth={3} rx="20" ry="20"></rect>

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

                </g>
                {/* End Armor and Structure Box */}

                {/* Specials Box */}
                <g transform='translate(36, 556)'>
                <rect x="0" y="0" width="538" height="80" fill="rgb(209,210,212)" stroke='rgb(0,0,0)' strokeWidth={3} rx="20" ry="20"></rect>
                <foreignObject x="14" y="3" width="512" height="70">
                    <p className='specials'>SPECIAL:&nbsp;
                    {this.props.asUnit.abilities.map( (word, wordIndex) => {
                        let comma = this.props.asUnit && wordIndex < this.props.asUnit.abilities.length - 1 ? ", " : "";

                        return (
                            <React.Fragment key={wordIndex}>{word}{comma}</React.Fragment>
                        )
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

                            <circle
                                cx={161}
                                cy={critLineStart - 27 + this.buttonRadius + 4}
                                r={this.buttonRadius - 3}
                                fill={"rgb(255,255,255)"}
                                stroke="rgb(0,0,0)"
                                strokeWidth={2}
                            ></circle>
                            <circle
                                cx={161 + (this.buttonRadius * 1.8 + 1)}
                                cy={critLineStart - 27 + this.buttonRadius + 4}
                                r={this.buttonRadius - 3}
                                fill={"rgb(255,255,255)"}
                                stroke="rgb(0,0,0)"
                                strokeWidth={2}
                            ></circle>
        
                        <text x={151 + (this.buttonRadius * 1.8)*2} y={critLineStart} textAnchor="start" className='crit-description'>{this.props.asUnit.type.toLowerCase() === 'cv' ||  this.props.asUnit.type.toLowerCase() === 'sv' ? "½ MV and Damage" : "+1 Heat/Firing Weapons"}</text>
                        {critLineStart += critLineHeight}
                    </>
                ) : (
                    <></>
                )}

                <text x="144" y={critLineStart} textAnchor="end" className='crit-label'>FIRE CONTROL</text>
                <circle
                    cx={161}
                    cy={critLineStart - 27 + this.buttonRadius + 4}
                    r={this.buttonRadius - 3}
                    fill={"rgb(255,255,255)"}
                    stroke="rgb(0,0,0)"
                    strokeWidth={2}
                ></circle>
                <circle
                    cx={161 + (this.buttonRadius * 1.8 + 1)}
                    cy={critLineStart - 27 + this.buttonRadius + 4}
                    r={this.buttonRadius - 3}
                    fill={"rgb(255,255,255)"}
                    stroke="rgb(0,0,0)"
                    strokeWidth={2}
                ></circle>
                <circle
                    cx={161 + (this.buttonRadius * 1.8 + 1) * 2}
                    cy={critLineStart - 27 + this.buttonRadius + 4}
                    r={this.buttonRadius - 3}
                    fill={"rgb(255,255,255)"}
                    stroke="rgb(0,0,0)"
                    strokeWidth={2}
                ></circle>
                <circle
                    cx={161 + (this.buttonRadius * 1.8 + 1) * 3}
                    cy={critLineStart - 27 + this.buttonRadius + 4}
                    r={this.buttonRadius - 3}
                    fill={"rgb(255,255,255)"}
                    stroke="rgb(0,0,0)"
                    strokeWidth={2}
                ></circle>
                
                <text x={152 + (this.buttonRadius * 1.8)*4} y={critLineStart} textAnchor="start" className='crit-description'>+2 To Hit Each</text>
                {critLineStart += critLineHeight}

                {this.props.asUnit.type.toLowerCase() === 'bm' || this.props.asUnit.type.toLowerCase() === 'pm' ? (
                    <>
                        <text x="144" y={critLineStart} textAnchor="end" className='crit-label'>MP</text>
                        <circle
                            cx={161}
                            cy={critLineStart - 27 + this.buttonRadius + 4}
                            r={this.buttonRadius - 3}
                            fill={"rgb(255,255,255)"}
                            stroke="rgb(0,0,0)"
                            strokeWidth={2}
                        ></circle>
                        <circle
                            cx={161 + (this.buttonRadius * 1.8 + 1)}
                            cy={critLineStart - 27 + this.buttonRadius + 4}
                            r={this.buttonRadius - 3}
                            fill={"rgb(255,255,255)"}
                            stroke="rgb(0,0,0)"
                            strokeWidth={2}
                        ></circle>
                        <circle
                            cx={161 + (this.buttonRadius * 1.8 + 1) * 2}
                            cy={critLineStart - 27 + this.buttonRadius + 4}
                            r={this.buttonRadius - 3}
                            fill={"rgb(255,255,255)"}
                            stroke="rgb(0,0,0)"
                            strokeWidth={2}
                        ></circle>
                        <circle
                            cx={161 + (this.buttonRadius * 1.8 + 1) * 3}
                            cy={critLineStart - 27 + this.buttonRadius + 4}
                            r={this.buttonRadius - 3}
                            fill={"rgb(255,255,255)"}
                            stroke="rgb(0,0,0)"
                            strokeWidth={2}
                        ></circle>
                        <text x={153 + (this.buttonRadius * 1.8)*4} y={critLineStart} textAnchor="start" className='crit-description'>½ Move Each</text>
                        {critLineStart += critLineHeight}
                    </>
                ) :
                (
                    <></>
                )}

                <text x="144" y={critLineStart} textAnchor="end" className='crit-label'>WEAPONS</text>

                    <circle
                        cx={161}
                        cy={critLineStart - 27 + this.buttonRadius + 4}
                        r={this.buttonRadius - 3}
                        fill={"rgb(255,255,255)"}
                        stroke="rgb(0,0,0)"
                        strokeWidth={2}
                    ></circle>
                    <circle
                        cx={161 + (this.buttonRadius * 1.8 + 1)}
                        cy={critLineStart - 27 + this.buttonRadius + 4}
                        r={this.buttonRadius - 3}
                        fill={"rgb(255,255,255)"}
                        stroke="rgb(0,0,0)"
                        strokeWidth={2}
                    ></circle>
                    <circle
                        cx={161 + (this.buttonRadius * 1.8 + 1) * 2}
                        cy={critLineStart - 27 + this.buttonRadius + 4}
                        r={this.buttonRadius - 3}
                        fill={"rgb(255,255,255)"}
                        stroke="rgb(0,0,0)"
                        strokeWidth={2}
                    ></circle>
                    <circle
                        cx={161 + (this.buttonRadius * 1.8 + 1) * 3}
                        cy={critLineStart - 27 + this.buttonRadius + 4}
                        r={this.buttonRadius - 3}
                        fill={"rgb(255,255,255)"}
                        stroke="rgb(0,0,0)"
                        strokeWidth={2}
                    ></circle>

                <text x={153 + (this.buttonRadius * 1.8)*4} y={critLineStart} textAnchor="start" textRendering={"optimizeLegibility"} className='crit-description'>-1 Damage Each</text>
                {critLineStart += critLineHeight}

                {this.props.asUnit.type.toLowerCase() === 'cv' ||  this.props.asUnit.type.toLowerCase() === 'sv'? (
                    <>  
                        <g transform={"translate(0, " + (critLineStart - 2) + ")"}>
                            <text x="16" y="0" textAnchor="start" className='crit-label'>MOTIVE</text>

                            <g transform='translate(112, 0)'>
                                <circle className="" cx="0" cy={this.buttonRadius - 23} r={this.buttonRadius - 3} fill={"rgb(255,255,255)"} stroke='rgb(0,0,0)' strokeWidth={2}></circle>
                                <circle className="" cx="28" cy={this.buttonRadius - 23} r={this.buttonRadius - 3} fill={"rgb(255,255,255)"} stroke='rgb(0,0,0)' strokeWidth={2}></circle>
                                <text x="44" y="0" textAnchor="start" className='crit-description'>-2 MV</text>
                            </g>

                            <g transform='translate(230, 0)'>
                                <circle className="" cx="0" cy={this.buttonRadius - 23} r={this.buttonRadius - 3} fill={"rgb(255,255,255)"} stroke='rgb(0,0,0)' strokeWidth={2}></circle>
                                <circle className="" cx="28" cy={this.buttonRadius - 23} r={this.buttonRadius - 3} fill={"rgb(255,255,255)"} stroke='rgb(0,0,0)' strokeWidth={2}></circle>
                                <text x="44" y="0" textAnchor="start" className='crit-description'>½ MV</text>
                            </g>
                            
                            <g transform='translate(352, 0)'>
                                <circle className="" cx="0" cy={this.buttonRadius - 23} r={this.buttonRadius - 3} fill={"rgb(255,255,255)"} stroke='rgb(0,0,0)' strokeWidth={2}></circle>
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

                {this.props.inPlay && this.props.asUnit.isWrecked() ? (
                    <>
                    <text x="0" y="100" fontFamily="sans-serif" transform="rotate( 30, -100, 260)" fontSize="200" stroke="rgb(0,0,0)" strokeWidth="4" fill="rgb(200,0,0)" pointerEvents="none">WRECKED</text>
                    </>
                ) : null }

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

                <text x="-450" y="1020" transform="rotate(-90)" fontSize="15" fill="rgb(0,0,0)">©2018 The Topps Company. All rights reserved.</text>

                </svg>
            </>
        )
    }
}

interface IAlphaStrikePrintUnitSVGProps {
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

interface IAlphaStrikePrintUnitSVGState {
    showTakeDamage: boolean;

}