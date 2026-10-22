import * as React from 'react';
import { BattleMechForce } from '../../../../classes/battlemech-force';
import { getGroundTurnsUntilNextSpaceTurn, getSpaceTurn } from '../../../../utils/space-turn';

/**
 * The space turn tracker's strip in the turn bar (design 2026-10-22): the space turn, the ground turns left in it,
 * and the anti-orbital shots in flight. Nothing at all while "Space forces in this game" is off.
 */
export default function SpaceTrackerBar(props: { force: BattleMechForce; onResolve: () => void }) {
    const { force } = props;
    if (!force.spaceInPlay) return null;
    const left = getGroundTurnsUntilNextSpaceTurn(force.turn);
    const due = force.spaceTracker.getDueShots(force.turn).length;
    return (
        <div className="space-tracker-bar small-text">
            <div>
                <strong>Space turn {getSpaceTurn(force.turn)}</strong>
                <span>, next in {left} ground turn{left === 1 ? "" : "s"}</span>
            </div>
            {force.spaceTracker.shotsInFlight.map((shot) => (
                <div key={shot.id}>
                    {`${shot.unitName}: ${shot.weaponName} at hex ${shot.aimedHex}${shot.targetName ? ` (${shot.targetName})` : ""}`}
                </div>
            ))}
            {due > 0 ? (
                <button className="btn btn-sm btn-primary" onClick={props.onResolve}>
                    {`Resolve ${due} shot${due === 1 ? "" : "s"}`}
                </button>
            ) : null}
        </div>
    );
}
