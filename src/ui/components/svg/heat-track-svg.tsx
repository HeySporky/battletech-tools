import React, { type JSX } from 'react';

export default class HeatTrackSVG extends React.Component<IHeatTrackSVGProps, IHeatTrackSVGState> {
    strokeColor = "rgb(0,0,0)";
    currentHeat = -1;
    bgColor = "rgb(255,255,255)";
    effectBGColor = "rgb(200,200,200)";

    constructor(props: IHeatTrackSVGProps) {
        super( props );

        if( this.props.currentHeat ) {
            this.currentHeat = this.props.currentHeat;
        }

        if( this.props.strokeColor ) {
            this.strokeColor = this.props.strokeColor;
        }

        if( this.props.bgColor ) {
            this.bgColor = this.props.bgColor;
        }

        if( this.props.effectBGColor ) {
            this.effectBGColor = this.props.effectBGColor;
        }
    }

    render = (): JSX.Element => {

        const heatScale: JSX.Element[] = [];
        const boxHeight = 36;
        // As on the Total Warfare sheet: an Overflow box, then 30 at the top down to 0.
        const overflowTop = this.props.yLoc + 60;
        const scaleTop = overflowTop + boxHeight + 8;
        const rowY = (heat: number) => scaleTop + boxHeight * (30 - heat);
        const boxWidth = 60;
        const normalBG = this.bgColor;
        const effectBG = this.effectBGColor;
        let boxBG = normalBG;

        for( let hCounter = 30; hCounter >= 0; hCounter-- ) {
            heatScale.push(
                <rect
                    key={hCounter.toString() + "a"}
                    x={this.props.xLoc}
                    y={rowY(hCounter)}
                    width={boxWidth}
                    height={boxHeight}
                    fill={this.strokeColor}
                />
            );

            if(
                hCounter === 5
                    ||
                hCounter === 8
                    ||
                hCounter === 10
                    ||
                hCounter === 13
                    ||
                hCounter === 14
                    ||
                hCounter === 15
                    ||
                hCounter === 17
                    ||
                hCounter === 18
                    ||
                hCounter === 19
                    ||
                hCounter === 20
                    ||
                hCounter === 22
                    ||
                hCounter === 23
                    ||
                hCounter === 24
                    ||
                hCounter === 25
                    ||
                hCounter === 26
                    ||
                hCounter === 28
                    ||
                hCounter === 30

            )
            {
                boxBG = effectBG;
            } else {
                boxBG = normalBG;
            }

            heatScale.push(
                <rect
                    key={hCounter.toString() + "b"}
                    x={this.props.xLoc + 2}
                    y={rowY(hCounter) + 2}
                    width={boxWidth -4}
                    height={boxHeight -4}
                    fill={boxBG}
                />
            );

            heatScale.push(
                <text
                    key={hCounter.toString() + "c"}
                    x={this.props.xLoc + 27}
                    y={rowY(hCounter) + 27}
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fill={this.strokeColor}
                    style={{fontWeight: 100}}
                    fontSize={boxHeight - 10}
                >
                    {hCounter}
                </text>
            );

            if(
                hCounter === 5
                    ||
                hCounter === 8
                    ||
                hCounter === 10
                    ||
                hCounter === 13
                    ||
                hCounter === 14
                    ||
                hCounter === 15
                    ||
                hCounter === 17
                    ||
                hCounter === 18
                    ||
                hCounter === 19
                    ||
                hCounter === 20
                    ||
                hCounter === 22
                    ||
                hCounter === 23
                    ||
                hCounter === 24
                    ||
                hCounter === 25
                    ||
                hCounter === 26
                    ||
                hCounter === 28
                    ||
                hCounter === 30
            ) {
                heatScale.push(
                    <text
                    key={hCounter.toString() + "d"}
                        x={this.props.xLoc + 43}
                        y={rowY(hCounter) + 21}
                        textAnchor="end"
                        fontFamily="sans-serif"
                        fill={this.strokeColor}
                        style={{fontWeight: 100}}
                        fontSize={boxHeight - 15}
                    >
                        *
                    </text>
                )
            }
        }

        return (
            <>
                <text
                    x={this.props.xLoc + boxWidth / 2}
                    y={this.props.yLoc + 10}
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fill={this.strokeColor}
                    style={{fontWeight: 700}}
                    fontSize={20}
                >
                    HEAT
                </text>
                <text
                    x={this.props.xLoc + boxWidth / 2}
                    y={this.props.yLoc + 30}
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fill={this.strokeColor}
                    style={{fontWeight: 700}}
                    fontSize={20}
                >
                    SCALE
                </text>

                <rect x={this.props.xLoc} y={overflowTop} width={boxWidth} height={boxHeight} rx={8} fill={this.bgColor} stroke={this.strokeColor} strokeWidth={2} />
                <text
                    x={this.props.xLoc + boxWidth / 2}
                    y={overflowTop + 15}
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fill={this.strokeColor}
                    fontSize={15}
                >Overflow</text>

                {heatScale}
            </>
        )
    }
}

interface IHeatTrackSVGProps {
    xLoc: number;
    yLoc: number;
    strokeColor?: string;
    currentHeat?: number;
    bgColor?: string;
    effectBGColor?: string;
}

interface IHeatTrackSVGState {
}