import React, { type JSX } from 'react';
import { IAcesIdealTarget } from '../../../../classes/aces-engine';
import AcesText from './_aces-text';

interface IAcesIdealTargetsProps {
    targets: IAcesIdealTarget[];
}

const colorLabels = { red: "RED", yellow: "YELLOW", blue: "BLUE" };

/** The ideal player unit for each color list of the face-up Command card, so nobody has to look the lists up. */
export default function AcesIdealTargets( props: IAcesIdealTargetsProps ): JSX.Element | null {
    if( props.targets.length === 0 ) return null;
    return (
        <ul className="aces-ideal-targets" aria-label="Ideal targets from the Command card">
            {props.targets.map( ( entry ) => (
                <li key={entry.color}>
                    <strong>Ideal {colorLabels[entry.color]}:</strong>{" "}
                    {entry.ideal ? entry.ideal.name : null}
                    {!entry.ideal && entry.pending ? <span className="aces-muted">needs your answer: <AcesText text={entry.pending.text} /></span> : null}
                    {!entry.ideal && !entry.pending && entry.tied.length > 0 ? <span className="aces-muted">tied: {entry.tied.map( ( unit ) => unit.name ).join( ", " )}. The players choose.</span> : null}
                    {!entry.ideal && !entry.pending && entry.tied.length === 0 ? <span className="aces-muted">no player units</span> : null}
                </li>
            ) )}
        </ul>
    );
}
