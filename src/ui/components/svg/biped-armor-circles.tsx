
import React, { type JSX } from 'react';
import { BattleMech } from '../../../classes/battlemech';
import { BIPED_ARMOR_BUBBLES } from './armor-bubble-layouts';
import { renderArmorBubbles } from './armor-bubbles';
import TakeDamageButtonSVG from './take-damage-button';

export default class BipedArmorCircles extends React.Component<IBipedArmorCirclesProps, IBipedArmorCirclesState> {
    armorBoxTop = 0;
    armorBoxLeft = 0;
    armorBoxWidth = 0;

    constructor(props: IBipedArmorCirclesProps) {
        super(props);

        this.armorBoxWidth = this.props.armorBoxWidth;
        this.armorBoxLeft = this.props.armorBoxLeft;
        this.armorBoxTop = this.props.armorBoxTop;
    }

    toggleArmorBubble = ( shortLoc: string, indexNumnber: number) => {
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
{this.props.inPlay && (this.props.currentPhase === 2 ||  this.props.currentPhase === 3 ) ?
    <TakeDamageButtonSVG
        x={this.props.takeDamageButton ? this.props.takeDamageButton.x : this.armorBoxLeft + this.props.armorBoxWidth / 2 - 75}
        y={this.props.takeDamageButton ? this.props.takeDamageButton.y : this.armorBoxTop + 700}
        height={this.props.takeDamageButton ? this.props.takeDamageButton.size : 150}
        width={this.props.takeDamageButton ? this.props.takeDamageButton.size : 150}
        onClick={this.props.openTakeDamageDialog}
    />
: null}

        {renderArmorBubbles( BIPED_ARMOR_BUBBLES, {
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

interface IBipedArmorCirclesProps {
    bgColor?: string;
    strokeColor?: string;

    mechData: BattleMech;
    inPlay?: boolean;
    currentPhase?: number;

    armorBoxTop: number;
    armorBoxLeft: number;
    armorBoxWidth: number;


    // Where the Take Damage button goes in play; between the legs unless a Tripod's Center Leg is there.
    takeDamageButton?: { x: number; y: number; size: number };

    onChange?( mech: BattleMech ): void;
    openTakeDamageDialog?(): void;
}

interface IBipedArmorCirclesState {
}