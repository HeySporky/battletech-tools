import React, { type JSX } from 'react';
import { BattleMech } from '../../../classes/battlemech';
import { getCriticalTables } from '../../../utils/critical-tables';

export default class CritAllocationTableSVG extends React.Component<ICritAllocationTableSVGProps, ICritAllocationTableSVGState> {


    constructor(props: ICritAllocationTableSVGProps) {
        super( props );

        this.state = {

        };
    }

    render = (): JSX.Element => {

        // let bgColor = "rgb(255,255,255)";
        const strokeColor = "rgb(0,0,0)";
        // let landscape: boolean = false;
        // let inPlay: boolean = false;
        const colorMediumGray = "rgb(150, 150, 150)";
        const colorVeryLightGray = "rgb(200, 200, 200)";
        // let colorTan = "#fdfde3";
        // A location's slots print in tables of six with a blank line between them (TW p.124's two tables; ours past
        // 12 slots under Clell Flint's construction rules, #172). `scale` shrinks the type to fit a long location.
        const scale = this.props.scale ?? 1;
        const fontSize = 25 * scale;
        const boxWidth = 275;
        const lineBuffer = 6 * scale;
        const tables = getCriticalTables( this.props.critData.length );
        const isTableStart = (index: number) => index > 0 && tables.some( table => table.start === index );
        const tableEnd = (index: number) => tables.find( table => table.start + table.length - 1 === index );

        const critTable: JSX.Element[] = [];
        const critBackgrounds: JSX.Element[] = [];

        let lineCount = 0;
        let dieNumber = 1;
        let lastName = "";
        let yStartBox = -1;
        let lastWasPlaceHolder = false;
        let lastRollAgain = false;
        let boxHeight = 0

        for( let critC = 0; critC < this.props.critData.length; critC++ ) {

            if( this.props.critData[ critC ] ) {
                this.props.critData[ critC ].name = this.props.critData[ critC ].name.replace("(rear)", "[R]");

                if( this.props.critData[ critC ].name === "placeholder" ) {
                    critTable.push( <text key={critC.toString() + "a"}  x={this.props.xLoc } y={this.props.yLoc + lineCount * (fontSize + lineBuffer)} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 500}} fontSize={fontSize}>{lastName}</text> );
                    lastWasPlaceHolder = true;
                } else {
                    if( this.props.critData[ critC ].rollAgain ) {
                        critTable.push( <text key={critC.toString() + "b"} x={this.props.xLoc } y={this.props.yLoc + lineCount * (fontSize + lineBuffer)} textAnchor="start" fontFamily="sans-serif" fill={colorMediumGray} style={{fontWeight: 100}} fontSize={fontSize}>({this.props.critData[ critC ].name})</text> );
                    } else {

                        if( this.props.critData[ critC ].obj && this.props.critData[ critC ].obj.isAmmo && this.props.mechData.getAmmoBinCapacity(this.props.critData[ critC ].obj) > 0 ) {
                            critTable.push( <text key={critC.toString() + "c"} x={this.props.xLoc } y={this.props.yLoc + lineCount * (fontSize + lineBuffer)} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 500}} fontSize={fontSize}>{this.props.critData[ critC ].name} {this.props.mechData.getAmmoBinRemaining(this.props.critData[ critC ].obj)}/{this.props.mechData.getAmmoBinCapacity(this.props.critData[ critC ].obj)}</text> );
                        } else {
                            critTable.push( <text key={critC.toString() + "d"} x={this.props.xLoc } y={this.props.yLoc + lineCount * (fontSize + lineBuffer)} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 500}} fontSize={fontSize}>{this.props.critData[ critC ].name}</text> );
                        }

                    }

                    if(
                         ( yStartBox > -1  && lastWasPlaceHolder )
                            ||
                        //  ( yStartBox > -1 && lastRollAgain && lastRollAgain === false )
                        //     ||
                         ( yStartBox > -1 && lastRollAgain === false && lastWasPlaceHolder === false )
                    ) {

                        boxHeight = (this.props.yLoc + lineCount * (fontSize + lineBuffer) - yStartBox - lineBuffer );

                        if( isTableStart( critC ) ) {
                            boxHeight = (this.props.yLoc + (lineCount - 1 ) * (fontSize + lineBuffer) - yStartBox - lineBuffer );
                        }
                        critBackgrounds.push( <rect key={critC.toString() + "e"} x={this.props.xLoc - 10} rx={15} ry={15} y={yStartBox - fontSize + 2} width={boxWidth} height={ boxHeight } stroke={strokeColor} strokeWidth={2} fill={colorVeryLightGray} /> );

                    }

                    lastName = this.props.critData[ critC ].name;
                    if(  this.props.critData[ critC ].rollAgain )
                        lastRollAgain = true;
                    else
                        lastRollAgain = false;
                    yStartBox = this.props.yLoc + lineCount * (fontSize + lineBuffer);
                    lastWasPlaceHolder = false;
                }

                if( this.props.mechData.isCriticalDamaged( this.props.location, critC) ) {
                    critTable.push(
                        <line
                            key={critC}
                            x1={this.props.xLoc - 50}
                            y1={this.props.yLoc + lineCount * (fontSize + lineBuffer) - fontSize / 2.5}
                            x2={this.props.xLoc + boxWidth + 10 }
                            y2={this.props.yLoc + lineCount * (fontSize + lineBuffer) - fontSize / 2.5 }
                            strokeWidth={4}
                            stroke={"rgb(200,0,0)"}
                        >
                        </line> );
                }
            } else {
                critTable.push( <text key={critC.toString() + "f"}  x={this.props.xLoc } y={this.props.yLoc + lineCount * (fontSize + lineBuffer)} textAnchor="start" fontFamily="sans-serif" fill={colorMediumGray} style={{fontWeight: 100}} fontSize={fontSize}>(roll again)</text> );
                    if(
                         ( yStartBox > -1  && lastWasPlaceHolder )
                            ||
                        //  ( yStartBox > -1 && lastRollAgain && lastRollAgain === false )
                        //     ||
                         ( yStartBox > -1 && lastRollAgain === false && lastWasPlaceHolder === false )
                    ) {
                        boxHeight = (this.props.yLoc + lineCount * (fontSize + lineBuffer) - yStartBox - lineBuffer );

                        if( isTableStart( critC ) ) {
                            boxHeight = (this.props.yLoc + (lineCount - 1 ) * (fontSize + lineBuffer) - yStartBox - lineBuffer );
                    }
                    critBackgrounds.push( <rect  key={critC.toString() + "g"} x={ this.props.xLoc - 10} rx={15} ry={15} y={yStartBox - fontSize + 2} width={boxWidth} height={boxHeight} stroke={strokeColor} strokeWidth={2} fill={colorVeryLightGray} /> );

                }

                yStartBox = -1;
                lastWasPlaceHolder = false;

            }

            critTable.push( <text key={critC.toString() + "h"} data-testid="crit-line-die" x={this.props.xLoc - 40} y={this.props.yLoc + lineCount * (fontSize + lineBuffer)} textAnchor="start" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 500}} fontSize={fontSize}>{dieNumber}.</text> );
            // An armored component's slot numbers are circled (TO:AUE p.95).
            if( this.props.mechData.isCriticalSlotArmored( this.props.location, critC ) ) {
                critTable.push( <circle key={critC.toString() + "armored"} data-testid="armored-slot" cx={this.props.xLoc - 30} cy={this.props.yLoc + lineCount * (fontSize + lineBuffer) - fontSize / 2.8} r={fontSize * 0.62} stroke={strokeColor} strokeWidth={2} fill="none" /> );
            }

            lineCount++;
            dieNumber++;
            const endedTable = tableEnd( critC );
            if( endedTable ) {
                dieNumber = 1;
                // A blank line before the next table.
                if( endedTable !== tables[tables.length - 1] ) lineCount++;
            }

            if( critC === this.props.critData.length - 1 ) {
                if(
                     ( yStartBox > -1 && lastRollAgain === false)
                ) {

                    const boxHeight = (this.props.yLoc + lineCount * (fontSize + lineBuffer) - yStartBox - lineBuffer );

                    critBackgrounds.push( <rect  key={critC.toString() + "i"} x={this.props.xLoc - 10} rx={15} ry={15} y={yStartBox - fontSize + 2} width={boxWidth} height={boxHeight} stroke={strokeColor} strokeWidth={2} fill={colorVeryLightGray} /> );

                }
            }
        }

        if( tables.length > 1 ) {
            tables.forEach( (table, tableIndex) => {
                // Beside the middle of the table: lines 0-5 of the first, after a blank line the next.
                const middleLine = tableIndex * 7 + (table.length - 1) / 2 + 0.25;
                critTable.push(<text key={"end" + tableIndex} data-testid="crit-table-dice" x={this.props.xLoc - 80} y={this.props.yLoc + middleLine * (fontSize + lineBuffer)} textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={fontSize * 1.25}>{table.label}</text> );
            });
        }

        return (
        <g
            x={this.props.yLoc}
            y={this.props.xLoc}
            data-crit-location={this.props.location}
        >
            {critBackgrounds}
            {critTable}
        </g>
        )
    }
}

interface ICritAllocationTableSVGProps {
    strokeColor?: string;
    critData: any[];
    location: string;
    mechData: BattleMech;
    inPlay?: boolean;
    xLoc: number;
    yLoc: number;
    /** Type size against the standard sheet's (1); a long location is printed smaller to fit (#172). */
    scale?: number;
}

interface ICritAllocationTableSVGState {
}