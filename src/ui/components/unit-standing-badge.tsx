import type { JSX } from "react";
import { FaDiceD20, FaGhost, FaShieldAlt, FaWrench } from "react-icons/fa";
import { UNIT_STANDINGS, UnitStanding } from "../../utils/unit-standing";
const ICONS: Record<UnitStanding, any> = { canon: FaShieldAlt, apocryphal: FaGhost, custom: FaWrench, munchkin: FaDiceD20 };

/** A unit's standing at a glance: canon, apocryphal, custom or munchkin, with its name for screen readers and on hover. */
export default function UnitStandingBadge( props: { standing: UnitStanding } ): JSX.Element {
    const Icon = ICONS[props.standing];
    const { label, description } = UNIT_STANDINGS[props.standing];
    return (
        <span className={"unit-standing unit-standing-" + props.standing} title={label + ": " + description}>
            <Icon aria-hidden="true" />
            <span className="visually-hidden">{label}</span>
        </span>
    );
}

/** The key to the badges, shown above a list that uses them. */
export function UnitStandingLegend(): JSX.Element {
    return (
        <p className="small-text unit-standing-legend">
            {( Object.keys( UNIT_STANDINGS ) as UnitStanding[] ).map( (standing) => (
                <span key={standing}><UnitStandingBadge standing={standing} /> {UNIT_STANDINGS[standing].label} </span>
            ) )}
        </p>
    );
}
