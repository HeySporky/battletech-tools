import React, { type JSX } from 'react';
import CapitalShip from '../../../../classes/capital-ship';
import TextSection from '../../../components/text-section';

/** The running totals every step of the creator shows: weight, thrust, armor, heat, and what is not legal yet. */
export default class CapitalShipStatusBar extends React.Component<ICapitalShipStatusBarProps> {
    render = (): JSX.Element => {
        const ship = this.props.ship;
        const issues = ship.getIssues(this.props.rulesLevel);
        const remaining = ship.getRemainingTonnage();
        return (
            <TextSection label={`${ship.getName()} ${ship.getModel()}`.trim() || ship.getShipTypeName()}>
                <div data-testid="cs-status">
                    <strong>Weight</strong>: <span data-testid="cs-weight">{ship.getCurrentTonnage().toLocaleString("en-US")}</span> of {ship.getTonnage().toLocaleString("en-US")} tons
                    (<span data-testid="cs-remaining" className={remaining < 0 ? "color-red" : ""}>{remaining.toLocaleString("en-US")}</span> left) &nbsp;|&nbsp;
                    <strong>Thrust</strong>: {ship.isWarShip() ? `${ship.getSafeThrust()}/${ship.getMaxThrust()}` : "station-keeping"} &nbsp;|&nbsp;
                    <strong>SI</strong>: {ship.getStructuralIntegrity()} &nbsp;|&nbsp;
                    <strong>Armor</strong>: {ship.getAllocatedArmorPoints()} of {ship.getPurchasedArmorPoints()} points placed &nbsp;|&nbsp;
                    <strong>Hottest bay</strong>: {ship.getHottestBayHeat()} heat of {ship.getHeatDissipation()} dissipated &nbsp;|&nbsp;
                    <strong>BV</strong>: {ship.getBattleValue().toLocaleString("en-US")}
                    {issues.length > 0 ? (
                        <ul className="color-red" data-testid="cs-issues">
                            {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                        </ul>
                    ) : null}
                </div>
            </TextSection>
        );
    }
}

interface ICapitalShipStatusBarProps {
    ship: CapitalShip;
    rulesLevel?: number;
}
