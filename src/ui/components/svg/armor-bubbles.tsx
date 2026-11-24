import React, { type JSX } from 'react';
import type { BattleMech } from '../../../classes/battlemech';
import { bubblePositions, drawnBubble, type BubblePoint, type IArmorBubbleLocation } from './armor-bubble-layouts';
import DamageCircleSVG from './damage-circle-svg';
import type { IStructureBubbleLocation } from './structure-bubble-layouts';

interface IBubbleBoxOptions {
    mechData: BattleMech;
    inPlay?: boolean;
    onClick( loc: string, index: number ): void;
}

interface IArmorBubblesOptions extends IBubbleBoxOptions {
    armorBoxTop: number;
    armorBoxLeft: number;
    armorBoxWidth: number;
}

interface IStructureBubblesOptions extends IBubbleBoxOptions {
    isBoxTop: number;
    isBoxLeft: number;
    isBoxWidth: number;
}

interface IBubbleLocation {
    loc: string;
    radius: number;
    points: BubblePoint[];
}

/** One DamageCircleSVG per point, `count` of them per location, filled from each location's center outward. */
const renderBubbles = <L extends IBubbleLocation>(
    layout: L[],
    count: ( location: L ) => number,
    isFilled: ( loc: string, index: number ) => boolean,
    box: { top: number; centerX: number },
    options: IBubbleBoxOptions,
): JSX.Element[] => layout.flatMap( (location) => {
    const { points, radius } = bubblePositions( location.points, location.radius, count( location ) );
    return points.map( ([x, y], index) => (
        <DamageCircleSVG
            key={location.loc + index}
            isFilled={isFilled( location.loc, index )}
            xLoc={box.centerX + x}
            yLoc={box.top + y}
            {...drawnBubble( radius )}
            inPlay={options.inPlay}
            clickLocation={location.loc}
            clickIndex={index}
            clickFunction={options.onClick}
        />
    ));
});

/** One DamageCircleSVG per point of armor, up to what the rules allow the location, filled from its center outward. */
export const renderArmorBubbles = ( layout: IArmorBubbleLocation[], options: IArmorBubblesOptions ): JSX.Element[] => {
    const allocation = options.mechData.getArmorAllocation();
    return renderBubbles(
        layout,
        (location) => Math.min( allocation[location.field] ?? 0, options.mechData.getMaxLocationArmor( location.field ) ),
        (loc, index) => options.mechData.armorDamaged( loc, index ),
        { top: options.armorBoxTop, centerX: options.armorBoxLeft + options.armorBoxWidth / 2 },
        options,
    );
};

/** One DamageCircleSVG per point of internal structure, filled from each location's center outward. */
export const renderStructureBubbles = ( layout: IStructureBubbleLocation[], options: IStructureBubblesOptions ): JSX.Element[] => {
    const structure = options.mechData.getInternalStructure();
    return renderBubbles(
        layout,
        (location) => structure[location.field] ?? 0,
        (loc, index) => options.mechData.structureDamaged( loc, index ),
        { top: options.isBoxTop, centerX: options.isBoxLeft + options.isBoxWidth / 2 },
        options,
    );
};
