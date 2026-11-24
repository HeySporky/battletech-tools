
import React, { type JSX } from 'react';
import { BattleMech } from '../../../classes/battlemech';
import { QUAD_ARMOR_BUBBLES } from './armor-bubble-layouts';
import { renderArmorBubbles } from './armor-bubbles';
import TakeDamageButtonSVG from './take-damage-button';

export default class QuadArmorCircles extends React.Component<IQuadArmorCirclesProps, IQuadArmorCirclesState> {
    armorBoxTop = 0;
    armorBoxLeft = 0;
    armorBoxWidth = 0;

    constructor(props: IQuadArmorCirclesProps) {
        super(props);

        this.armorBoxWidth = this.props.armorBoxWidth;
        this.armorBoxLeft = this.props.armorBoxLeft;
        this.armorBoxTop = this.props.armorBoxTop;
    }

    toggleArmorBubble = ( shortLoc: string, indexNumnber: number): void => {
		if( this.props.inPlay ) {
			this.props.mechData.toggleArmorBubble(shortLoc, indexNumnber);
            if( this.props.onChange ) {
                this.props.onChange( this.props.mechData );
            }
		}
    }
    render = (): JSX.Element => {
        return (
            <>

{this.props.inPlay && (this.props.currentPhase === 2 ||  this.props.currentPhase === 3 )?
    <TakeDamageButtonSVG
        x={this.armorBoxLeft + 25}
        y={this.armorBoxTop + 325}
        height={125}
        width={125}
        onClick={this.props.openTakeDamageDialog}
    />
: null}

        {renderArmorBubbles( QUAD_ARMOR_BUBBLES, {
            mechData: this.props.mechData,
            inPlay: this.props.inPlay,
            armorBoxTop: this.armorBoxTop,
            armorBoxLeft: this.armorBoxLeft,
            armorBoxWidth: this.armorBoxWidth,
            onClick: this.toggleArmorBubble,
        })}
            </>
        )
    }
}

interface IQuadArmorCirclesProps {
    bgColor?: string;
    strokeColor?: string;

    mechData: BattleMech;
    inPlay?: boolean;
    currentPhase?: number;

    armorBoxTop: number;
    armorBoxLeft: number;
    armorBoxWidth: number;
    onChange?( mech: BattleMech ): void;
    openTakeDamageDialog?(): void;
}

interface IQuadArmorCirclesState {
}