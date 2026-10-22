import React from 'react';
import { IMechShield } from '../../../classes/battlemech';

interface IShieldDiagramSVGProps {
    shield: IMechShield;
    /** The strip's left edge and top, in sheet units. */
    xLoc: number;
    yLoc: number;
    /** Which side of the strip the label lines up with: the sheet's outer edge. */
    side: "left" | "right";
    strokeColor: string;
    inPlay?: boolean;
    onToggle?: ( uuid: string, index: number ) => void;
}

const width = 46;
const spacing = 19;
const radius = 8;

/**
 * A shield drawn beside its arm, the way the Gundam RX-78-2 sheet draws it: its size, a circle for each point of Damage
 * Capacity (filled as it is used up) and a diamond for each point of Damage Absorption (TO:AUE p.103).
 */
export default class ShieldDiagramSVG extends React.Component<IShieldDiagramSVGProps> {
    render = (): React.ReactNode => {
        const { shield, xLoc, yLoc, side, strokeColor, inPlay, onToggle } = this.props;
        const key = `shield-${shield.location}`;
        const columns = [xLoc + width / 2 - spacing / 2, xLoc + width / 2 + spacing / 2];
        const dcRows = Math.ceil(shield.damageCapacity / 2);
        const dcTop = yLoc + 30;
        const daTop = dcTop + dcRows * spacing + 24;
        const height = daTop - yLoc + shield.damageAbsorption * spacing;
        const labelX = side === "left" ? xLoc : xLoc + width;
        const anchor = side === "left" ? "start" : "end";
        const click = ( index: number ) => () => {
            if( inPlay && onToggle && shield.item.uuid ) {
                onToggle( shield.item.uuid, index );
            }
        };
        return (
            <g>
                <text x={labelX} y={yLoc - 26} textAnchor={anchor} fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={14}>{shield.size.toUpperCase()}</text>
                <text x={labelX} y={yLoc - 10} textAnchor={anchor} fontFamily="sans-serif" fill={strokeColor} style={{fontWeight: 700}} fontSize={14}>SHIELD</text>
                <rect x={xLoc} y={yLoc} width={width} height={height} rx={6} fill="none" stroke={strokeColor} strokeWidth={3} />
                <text x={xLoc + width / 2} y={yLoc + 18} textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} fontSize={13}>DC</text>
                {Array.from({ length: shield.damageCapacity }, ( _, index ) => (
                    <circle
                        key={index}
                        className={`${key}-dc${index < shield.damageTaken ? " taken" : ""}`}
                        cx={columns[index % 2]}
                        cy={dcTop + Math.floor(index / 2) * spacing + radius}
                        r={radius}
                        fill={index < shield.damageTaken ? strokeColor : "white"}
                        stroke={strokeColor}
                        strokeWidth={2}
                        style={inPlay ? { cursor: "pointer" } : undefined}
                        onClick={click( index )}
                    />
                ))}
                <text x={xLoc + width / 2} y={daTop - 8} textAnchor="middle" fontFamily="sans-serif" fill={strokeColor} fontSize={13}>DA</text>
                {Array.from({ length: shield.damageAbsorption }, ( _, index ) => {
                    const cx = xLoc + width / 2;
                    const cy = daTop + index * spacing + radius;
                    return (
                        <polygon
                            key={index}
                            className={`${key}-da`}
                            points={`${cx},${cy - radius} ${cx + radius},${cy} ${cx},${cy + radius} ${cx - radius},${cy}`}
                            fill="white"
                            stroke={strokeColor}
                            strokeWidth={2}
                        />
                    );
                })}
            </g>
        );
    }
}
