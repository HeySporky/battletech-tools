import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import AlphaStrikeUnitSVG from '../../../components/svg/alpha-strike-unit-svg';

/** End Phase: the players' marked damage and heat land with the automated units' (Aces p.5), and the roster is saved. */
export const applyAcesPlayerForceRound = ( appGlobals: IAppGlobals ): void => {
    const force = appGlobals.currentASForce;
    if( !force ) return;
    for( const group of force.groups ) {
        for( const unit of group.members ) unit.applyRound();
    }
    appGlobals.saveCurrentASForce( force );
}

/**
 * The players' own force (the current Alpha Strike roster) in play on the Aces game page, so damage, heat and
 * critical hits are marked here without the roster open in a second tab. Each change saves the roster, the same as
 * its in-play view.
 */
export default class AcesPlayerForceCards extends React.Component<IAcesPlayerForceCardsProps> {
    private _save = (): void => {
        const force = this.props.appGlobals.currentASForce;
        if( force ) this.props.appGlobals.saveCurrentASForce( force );
        if( this.props.onChange ) this.props.onChange();
    }

    /** Repairs every unit of the roster, as the roster's own Reset does, so a new game needs no trip to the roster. */
    private _reset = (): void => {
        this.props.appGlobals.openConfirmDialog(
            "Reset your force?",
            "All units of your force (the current Alpha Strike roster) are repaired to full status.",
            "Reset",
            "Cancel",
            () => {
                const force = this.props.appGlobals.currentASForce;
                if( !force ) return;
                for( const group of force.groups ) {
                    for( const unit of group.members ) unit.reset();
                }
                this._save();
            },
        );
    }

    render = (): JSX.Element => {
        const force = this.props.appGlobals.currentASForce;
        const groups = force ? force.groups.filter( ( group ) => group.members.length > 0 ) : [];
        if( groups.length === 0 ) {
            return (
                <p className="aces-muted">
                    Your force is the current Alpha Strike roster, and it is empty.{" "}
                    <Link to={`${process.env.PUBLIC_URL}/alpha-strike/roster`}>Build it in the roster</Link>
                </p>
            );
        }
        return (
            <>
                <div className="aces-inline">
                    <button className="btn btn-secondary btn-sm" onClick={this._reset}>Reset your force</button>
                </div>
                {groups.map( ( group, groupIndex ) => (
                    <React.Fragment key={groupIndex}>
                        {groups.length > 1 ? <h4>{group.getName( groupIndex + 1 )}</h4> : null}
                        <div className="aces-unit-cards">
                            {group.members.map( ( unit ) => (
                                <div className="unit-card" key={unit.uuid}>
                                    <AlphaStrikeUnitSVG
                                        asUnit={unit}
                                        inPlay={true}
                                        appGlobals={this.props.appGlobals}
                                        className="small-margins"
                                        measurementsInHexes={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
                                        onChange={this._save}
                                    />
                                </div>
                            ) )}
                        </div>
                    </React.Fragment>
                ) )}
            </>
        );
    }
}

interface IAcesPlayerForceCardsProps {
    appGlobals: IAppGlobals;
    /** Called after the roster is saved, so the page redraws (a wrecked unit leaves the card reader's targets). */
    onChange?: () => void;
}
