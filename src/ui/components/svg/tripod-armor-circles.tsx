import React from 'react';
import { BattleMech } from '../../../classes/battlemech';
import BipedArmorCircles from './biped-armor-circles';
import DamageCircleSVG from './damage-circle-svg';

/*
* Tripod shares Biped's head/torso/arm/leg armor layout, plus a unique Center Leg
* location neither Biped nor Quad have a slot for. Rather than duplicating the
* entire Biped pip grid, this wraps it and adds a compact Center Leg pip block
* below the existing legs (see TODO.md for the Tripod diagram art backlog item).
*/
export default class TripodArmorCircles extends React.Component<ITripodArmorCirclesProps, ITripodArmorCirclesState> {

    toggleArmorBubble = ( shortLoc: string, indexNumnber: number) => {
        if( this.props.inPlay ) {
            this.props.mechData.toggleArmorBubble(shortLoc, indexNumnber);
            if( this.props.onChange ) {
                this.props.onChange( this.props.mechData );
            }
        }
    }

    render = (): JSX.Element => {
        const centerLegArmor = this.props.mechData.getArmorAllocation().centerLeg ?? 0;
        const centerX = this.armorBoxCenterX();
        const centerLegTop = this.props.armorBoxTop + 680;

        return (
            <>
                <BipedArmorCircles {...this.props} />

                {Array.from({ length: centerLegArmor }, (_, index) => index).map((index) => {
                    const col = index % 3;
                    const row = Math.floor(index / 3);
                    return (
                        <DamageCircleSVG
                            key={index}
                            isFilled={this.props.mechData.armorDamaged("cl", index)}
                            xLoc={centerX + (col - 1) * 25}
                            yLoc={centerLegTop + row * 25}
                            radius={13}
                            inPlay={this.props.inPlay}
                            clickLocation="cl"
                            clickIndex={index}
                            clickFunction={this.toggleArmorBubble}
                        />
                    );
                })}
            </>
        )
    }

    armorBoxCenterX = (): number => {
        return this.props.armorBoxLeft + this.props.armorBoxWidth / 2;
    }
}

interface ITripodArmorCirclesProps {
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

interface ITripodArmorCirclesState {
}
