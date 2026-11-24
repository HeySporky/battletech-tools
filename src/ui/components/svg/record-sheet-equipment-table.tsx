import React, { type JSX } from 'react';
import { BattleMech, IGATOR } from "../../../classes/battlemech";
import { getTargetColor, getTargetToHitFromWeapon } from '../../../utils';
import RecordSheetGroupBoxSVG from './record-sheet-group-box-svg';
import { getQuirkSheetLines } from '../../../utils/quirk-sheet-lines';
import { getUnitDialBand } from '../../../utils/dial-weapons';
import { UNIT_IMAGE_MIN_SIDE, UnitImageSVG } from './record-sheet-svg-kit';

/** Splits the unit's quirk lines into sheet lines of about `width` characters. */
const wrapQuirks = (lines: string[], width: number): string[] => {
    const wrapped: string[] = [];
    let current = "Quirks:";
    for (const line of lines) {
        if (current.length + line.length + 2 > width && current !== "Quirks:") {
            wrapped.push(current + ",");
            current = "  " + line;
        } else {
            current += (current === "Quirks:" ? " " : ", ") + line;
        }
    }
    return lines.length ? [...wrapped, current] : [];
};

export default class RecordSheetEquipmentTable extends React.Component<IRecordSheetEquipmentTableProps, IRecordSheetEquipmentTableState> {
    // bgColor = "rgb(255,255,255)";
    // strokeColor = "rgb(0,0,0)";
    // // landscape: boolean = false;
    // inPlay: boolean = false;
    // eqLineHeight = 33;

    // colorMediumGray = "rgb(150, 150, 150)";
    // colorVeryLightGray = "rgb(200, 200, 200)";

    constructor(props: IRecordSheetEquipmentTableProps) {
        super( props );

        this.state = {

        };
    }

    viewGATOR = (
        gator: IGATOR
    ) => {
        if( this.props.viewGATOR ) {
            this.props.viewGATOR( gator );
        }
    }

    cycleTarget = (
        e: React.MouseEvent<SVGCircleElement | SVGTextElement>,
        index: number
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }

        this.props.mechData.cycleWeaponTarget( index );

        if( this.props.onChange ) {
            this.props.onChange( this.props.mechData );
        }
    }

    /** A click on a dial weapon's heat cell in play steps its setting up, wrapping to the lowest; locked once the weapon is marked fired. */
    cycleDial = (
        e: React.MouseEvent<SVGCircleElement | SVGTextElement>,
        index: number,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const item = this.props.mechData.equipmentList[index];
        if( !item?.dial || !item.uuid || item.target ) return;
        const current = this.props.mechData.getDialSetting( item.uuid );
        this.props.mechData.setDialSetting( item.uuid, current >= item.dial.max ? item.dial.min : current + 1 );
        if( this.props.onChange ) {
            this.props.onChange( this.props.mechData );
        }
    }

    openSetTargetDialog = (
        e: React.MouseEvent<SVGCircleElement | SVGTextElement>,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }

        if( this.props.openSetTargetDialog ) {
            this.props.openSetTargetDialog( this.props.mechData );
        }
    }

    render = (): JSX.Element => {

        const weapAndEqpTop = this.props.yLoc;
        const weapAndEqpLeft = this.props.xLoc;

        const wacCol1 = weapAndEqpLeft + 15;
        const wacCol2 = weapAndEqpLeft + 90;
        const wacCol3 = weapAndEqpLeft + 470;
        const wacCol4 = weapAndEqpLeft + 550;
        const wacCol5 = weapAndEqpLeft + 650;
        const wacCol6 = weapAndEqpLeft + 770;
        const wacCol7 = weapAndEqpLeft + 880;
        const wacCol8 = weapAndEqpLeft + 990;
        const wacCol9 = weapAndEqpLeft + 1100;

        const equipmentList: JSX.Element[] = [];
        let rearDesignation = "";

        const colorVeryLightGray = "rgb(200, 200, 200)";

        const eqLineHeight = 33;
        let bgColor = "rgb(255,255,255)";
        let strokeColor = "rgb(0,0,0)";
        // landscape: boolean = false;

        if( this.props.bgColor ) {
            bgColor = this.props.bgColor;
        }
        if( this.props.strokeColor ) {
            strokeColor = this.props.strokeColor;
        }

        const installed = this.props.mechData.equipmentList;
        const quirkLines = getQuirkSheetLines(
            this.props.mechData.quirks.getActive(installed.map((item) => item.uuid ?? ""), undefined),
            (uuid) => installed.find((item) => item.uuid === uuid)?.name,
        );
        // Each weapon's quirks print on a line of their own under its row, so later rows move down.
        let row = 0;
        for( let eq_count = 0; eq_count < this.props.mechData.equipmentList.length; eq_count++, row++) {
            if( eq_count % 2 === 0 )
                equipmentList.push( <rect key={ eq_count.toString() + "a"}x={wacCol1 - 5 } y={weapAndEqpTop + 93 + eqLineHeight * row} width={1180} height={eqLineHeight + 4} fill={colorVeryLightGray} /> );

            const ammoPerTon = this.props.mechData.getAmmoBinCapacity(this.props.mechData.equipmentList[ eq_count]);
            const currentAmmo = this.props.mechData.getAmmoBinRemaining(this.props.mechData.equipmentList[ eq_count]);
            const isAmmo = this.props.mechData.equipmentList[ eq_count].isAmmo ? true : false ;
            const isEquipment = this.props.mechData.equipmentList[ eq_count].isEquipment ? true : false ;
            const location = this.props.mechData.equipmentList[eq_count].location;
            const uuid = this.props.mechData.equipmentList[ eq_count].uuid;
            const modularArmorPoints = this.props.mechData.equipmentList[eq_count].isModularArmor
                ? this.props.mechData.getModularArmorCurrentPoints(this.props.mechData.equipmentList[eq_count])
                : null;
            let isDamaged = false;
            if( uuid && location )
                isDamaged = this.props.mechData.isEquipmentDamaged( uuid,  location);

            if( this.props.inPlay && !isAmmo && !isEquipment ) {


                const targetColor = getTargetColor( this.props.mechData.equipmentList[ eq_count].target );
                // The live sheet in Play Mode takes the game's "Use design quirks" switch, as the attack list does.
                const targetGATOR = getTargetToHitFromWeapon(
                    this.props.mechData,
                    eq_count,
                    null,
                    null,
                    !!this.props.quirksInPlay,
                );


                if( !isDamaged ) {
                    equipmentList.push(
                        <React.Fragment key={ eq_count.toString() + "b"}>
                            {this.props.mechData.equipmentList[ eq_count].target ? (
                                <text
                                    x={ 18 }
                                    y={weapAndEqpTop + 115 + eqLineHeight * row }
                                    textAnchor="start"
                                    fontFamily="sans-serif"
                                    fill={"black"}
                                    style={{fontWeight: 500}}
                                    fontSize={20}
                                    className="cursor-pointer"
                                    onClick={() => this.viewGATOR(targetGATOR)}
                                >
                                    {targetGATOR.finalToHit > 0 ? (
                                        <>
                                            {targetGATOR.finalToHit < 13 ? (
                                                <>{targetGATOR.finalToHit}+</>
                                            ) : (
                                                <>n/s</>
                                            )}
                                        </>
                                    ) : (
                                        <>n/s</>
                                    )}
                                </text>
                            ) : null}
                            <circle
                                stroke={"#009"}
                                strokeWidth="3"
                                fill={targetColor}
                                cx={wacCol1 + 50 }
                                cy={weapAndEqpTop + 110 + eqLineHeight * row }
                                r={15}
                                className="cursor-pointer"
                                onClick={(e) => this.cycleTarget( e, eq_count)}
                            />
                            <text
                                x={wacCol1 + 49 }
                                y={weapAndEqpTop + 115 + eqLineHeight * row }
                                textAnchor="middle"
                                fontFamily="sans-serif"
                                fill={"white"}
                                style={{fontWeight: 700}}
                                fontSize={25}
                                className="cursor-pointer"
                                onClick={(e) => this.cycleTarget( e, eq_count)}
                            >
                                {this.props.mechData.equipmentList[ eq_count].target}
                            </text>
                        </React.Fragment>
                        );
                }
            } else {
                equipmentList.push( <text key={ eq_count.toString() + "b"} x={wacCol1 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].count}</text> );
            }

            rearDesignation = "";
            if(  this.props.mechData.equipmentList[ eq_count].rear )
                rearDesignation = " [R]"
            else if( this.props.mechData.isTurretMounted( this.props.mechData.equipmentList[ eq_count] ) )
                rearDesignation = " [T]"

            if( ammoPerTon && isAmmo )
                equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "c"} x={wacCol2 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].name + rearDesignation} {currentAmmo}/{ammoPerTon} </text> );
            else
                equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "d"} x={wacCol2 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].name + rearDesignation}{modularArmorPoints !== null ? ` ${modularArmorPoints}/10` : ""}</text> );


            if( location ) {
                equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "e"} x={wacCol3 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{location.toUpperCase()}</text> );
            } else {
                equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "f"} x={wacCol3 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>-</text> );
            }

            if(!isAmmo && !isEquipment) {
                if(this.props.mechData.equipmentList[eq_count].heatPerShot) {
                    equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "g"} x={wacCol4 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].heat}/shot</text> );
                } else {
                    equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.props.inPlay && this.props.mechData.equipmentList[eq_count].dial ? (e) => this.cycleDial(e, eq_count) : this.openSetTargetDialog} key={ eq_count.toString() + "g"} x={wacCol4 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].dial && !this.props.inPlay ? this.props.mechData.equipmentList[eq_count].dial!.min + "-" + this.props.mechData.equipmentList[eq_count].dial!.max : this.props.mechData.getFutureWarsItemHeat(this.props.mechData.equipmentList[eq_count])}</text> );
                }
                if(this.props.mechData.equipmentList[eq_count].damagePerCluster) {
                    equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "h"} x={wacCol5 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].damagePerCluster}/hit</text> );
                } else {
                    if(this.props.mechData.equipmentList[eq_count].damagePerShot) {
                        equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "h"} x={wacCol5 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].damagePerShot}/shot</text> );
                    } else {
                        if( typeof(this.props.mechData.equipmentList[eq_count].damage) !== "undefined") {
                            if( typeof(this.props.mechData.equipmentList[eq_count].damage) === "number") {
                                // @ts-expect-error Legacy compatibility type mismatch
                                equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "h"} x={wacCol5 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].sonic ? "Stun" : this.props.mechData.equipmentList[eq_count].dial ? (this.props.inPlay ? (getUnitDialBand(this.props.mechData, this.props.mechData.equipmentList[eq_count])!.damage || "Stun") : "Dial") : this.props.mechData.equipmentList[eq_count].damage}</text> );
                            } else {
                                // @ts-expect-error Legacy compatibility type mismatch
                                equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "h"} x={wacCol5 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].damage.short} / {this.props.mechData.equipmentList[eq_count].damage.medium} / {this.props.mechData.equipmentList[eq_count].damage.long}</text> );
                            }
                        }
                    }
                }
            }

            if( this.props.mechData.equipmentList[eq_count].isMelee ) {
                equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "i"} x={wacCol7 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}> MELEE </text> );

            } else {

                if(!isAmmo && !isEquipment) {

                    if(this.props.mechData.equipmentList[eq_count].range.min === 0)
                        equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "j"} x={wacCol6 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>-</text> );
                    else
                        equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "k"} x={wacCol6 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].range.min}</text> );
                    equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "l"} x={wacCol7 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].range.short}</text> );
                    equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "m"} x={wacCol8 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].range.medium || "—"}</text> );
                    equipmentList.push( <text className={this.props.inPlay ? "cursor-pointer": ""} onClick={this.openSetTargetDialog} key={ eq_count.toString() + "n"} x={wacCol9 + 30 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>{this.props.mechData.equipmentList[eq_count].range.long || "—"}</text> );
                }

            }
            if( this.props.inPlay && isDamaged ) {
                equipmentList.push(
                    <line
                    key={ eq_count.toString() + "z"}
                    x1={ 10 }
                    y1={weapAndEqpTop + 110 + eqLineHeight * row }
                    x2={ this.props.width - 10 }
                    y2={weapAndEqpTop + 110 + eqLineHeight * row }

                    stroke={"rgb(200,0,0)"}
                    strokeWidth={4}
                /> );

            }
            const weaponQuirks = quirkLines.weapons.find((entry) => entry.uuid === this.props.mechData.equipmentList[eq_count].uuid);
            if( weaponQuirks ) {
                row++;
                equipmentList.push( <text key={ eq_count.toString() + "q"} x={wacCol2 + 20 } y={weapAndEqpTop + 116 + eqLineHeight * row } textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100, fontStyle: "italic"}} fontSize={24}>{weaponQuirks.text}</text> );
            }
        }

        for( const line of wrapQuirks(quirkLines.unit, 95) ) {
            equipmentList.push( <text key={ "quirks-" + row.toString()} x={wacCol1 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={26}>{line}</text> );
            row++;
        }

        // Footnotes for the power-dial and sonic weapons (#645).
        const dialKinds = new Set( this.props.mechData.equipmentList.filter( item => item.dial ).map( item => item.dial!.kind ) );
        const footnotes: string[] = [];
        if( dialKinds.has( "bombast" ) ) footnotes.push( "Bombast dial: 7-12; damage and heat equal the setting; +1 to hit per 2 above 7." );
        if( this.props.mechData.equipmentList.some( item => item.sonic ) ) footnotes.push( "Sonic projector: Hail / Deter, never lethal; Thin atmosphere or denser." );
        // LAM bomb bay stores, with the ones still loaded in play (IO:AE p.105).
        for( const line of this.props.mechData.getBombSheetLines() ) footnotes.push( "Bomb bays: " + line );
        for( const line of footnotes ) {
            equipmentList.push( <text key={ "dial-note-" + row.toString()} x={wacCol1 } y={weapAndEqpTop + 120 + eqLineHeight * row } textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={26}>{line}</text> );
            row++;
        }

        if( this.props.mechData.equipmentList.length === 0 ) {
            equipmentList.push( <text onClick={this.openSetTargetDialog} key={ "no-equipment"} x={this.props.width / 2 } y={weapAndEqpTop + 140} textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 100}} fontSize={30}>No Equipment Installed</text> );
        }



        // The unit picture (#95) goes in the empty part of the box below the last used line; no room, no picture.
        // With nothing installed the No Equipment Installed line sits there, so the picture starts below it; a Power Armor
        // suit has its rules box standing on the foot of the box, which the picture must stay above.
        const freeTop = weapAndEqpTop + (this.props.mechData.equipmentList.length === 0 ? 160 : 120 + eqLineHeight * row);
        const freeHeight = weapAndEqpTop + this.props.height - 15 - (this.props.reservedBottom ?? 0) - freeTop;
        const unitImage = freeHeight >= UNIT_IMAGE_MIN_SIDE
            ? <UnitImageSVG src={this.props.mechData.tro.getImage()} x={weapAndEqpLeft + 15} y={freeTop} width={this.props.width - 30} height={Math.min(freeHeight, 420)} />
            : null;

        return (

            <RecordSheetGroupBoxSVG
                width={this.props.width}
                height={this.props.height}
                xLoc={this.props.xLoc}
                yLoc={this.props.yLoc}
                title="Weapons And Equipment"
                bgColor={bgColor}
                strokeColor={this.props.boxStrokeColor}
            >
                {this.props.inPlay ?
                    <text x={wacCol1 } y={weapAndEqpTop + 80} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={35}></text>
                :
                    <text x={wacCol1 } y={weapAndEqpTop + 80} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={35}>Qty</text>
                }

	            <text x={wacCol2 } y={weapAndEqpTop + 80} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={35}>Type</text>
	            <text x={wacCol3 } y={weapAndEqpTop + 80} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={35}>Loc</text>
	            <text x={wacCol4 } y={weapAndEqpTop + 80} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={35}>Heat</text>
	            <text x={wacCol5 } y={weapAndEqpTop + 80} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={35}>Dmg</text>
	            <text x={wacCol6 } y={weapAndEqpTop + 80} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={35}>Min</text>
	            <text x={wacCol7 } y={weapAndEqpTop + 80} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={35}>Sht</text>
	            <text x={wacCol8 } y={weapAndEqpTop + 80} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={35}>Med</text>
	            <text x={wacCol9 } y={weapAndEqpTop + 80} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={35}>Lng</text>

                {equipmentList}
                {unitImage}
            </RecordSheetGroupBoxSVG>
        )
    }
}

interface IRecordSheetEquipmentTableProps {
    bgColor?: string;
    strokeColor?: string;
    boxStrokeColor?: string;
    mechData: BattleMech;
    inPlay?: boolean;
    /** The game's "Use design quirks" switch, for the to-hit numbers in play. */
    quirksInPlay?: boolean;
    xLoc: number;
    yLoc: number;
    width: number;
    height: number;
    /** Height at the foot of the box that something else draws over (the Power Armor rules box). */
    reservedBottom?: number;
    onChange?( mech: BattleMech ): void;
    viewGATOR?( gator: IGATOR): void;
    openSetTargetDialog?(
        currentBM: BattleMech,
    ): void;
    // landscape?: boolean;
    // itemIDField
}

interface IRecordSheetEquipmentTableState {
}