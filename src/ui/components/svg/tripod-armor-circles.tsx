import React, { type JSX } from 'react';
import { BattleMech } from '../../../classes/battlemech';
import BipedArmorCircles from './biped-armor-circles';
import { drawnBubble } from './armor-bubble-layouts';
import DamageCircleSVG from './damage-circle-svg';
import { TRIPOD_ARMOR_CENTER_LEG_LAYOUT, tripodCenterLegBubbles } from './tripod-diagram-svg';

/*
* Tripod shares Biped's head/torso/arm/leg armor layout, plus a Center Leg drawn between
* the legs (TripodArmorDiagramSVG, issue 77). This wraps the Biped pips and adds the
* Center Leg's label and pips inside that leg.
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
        const layout = TRIPOD_ARMOR_CENTER_LEG_LAYOUT;
        const centerLegArmor = this.props.mechData.getArmorAllocation().centerLeg ?? 0;
        const centerX = this.props.armorBoxLeft + this.props.armorBoxWidth / 2;
        const strokeColor = this.props.strokeColor ?? "rgb(0,0,0)";

        return (
            <>
                <BipedArmorCircles
                    {...this.props}
                    // The Center Leg fills the gap between the legs, so the button goes beside the left foot.
                    takeDamageButton={{ x: this.props.armorBoxLeft + 12, y: this.props.armorBoxTop + 925, size: 100 }}
                />

                <text x={centerX} y={this.props.armorBoxTop + layout.labelY} textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={14}>CENTER LEG</text>
                <text x={centerX} y={this.props.armorBoxTop + layout.labelY + 16} textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={14}>[{centerLegArmor}]</text>

                {tripodCenterLegBubbles(Math.min(centerLegArmor, this.props.mechData.getMaxLocationArmor("centerLeg")), layout).map((position, index) => {
                    return (
                        <DamageCircleSVG
                            key={index}
                            isFilled={this.props.mechData.armorDamaged("cl", index)}
                            xLoc={centerX + position.x}
                            yLoc={this.props.armorBoxTop + layout.firstRowY + position.y}
                            {...drawnBubble(position.radius)}
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
