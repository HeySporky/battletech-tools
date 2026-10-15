import React, { type JSX } from 'react';
import SmallCraft from '../../../../classes/small-craft';
import TextSection from '../../../components/text-section';

/** The running totals every step of the Small Craft Creator shows: weight, thrust, armor, heat, and what is not legal yet. */
export default class SmallCraftStatusBar extends React.Component<ISmallCraftStatusBarProps> {
    render = (): JSX.Element => {
        const craft = this.props.craft;
        const issues = craft.getIssues(this.props.rulesLevel);
        const remaining = craft.getRemainingTonnage();
        return (
            <TextSection label={`${craft.getName()} ${craft.getModel()}`.trim() || "Small Craft"}>
                <div data-testid="sc-status">
                    <strong>Weight</strong>: <span data-testid="sc-weight">{craft.getCurrentTonnage()}</span> of {craft.getTonnage()} tons
                    (<span data-testid="sc-remaining" className={remaining < 0 ? "color-red" : ""}>{remaining}</span> left) &nbsp;|&nbsp;
                    <strong>Thrust</strong>: {craft.getSafeThrust()}/{craft.getMaxThrust()} &nbsp;|&nbsp;
                    <strong>SI</strong>: {craft.getStructuralIntegrity()} &nbsp;|&nbsp;
                    <strong>Armor</strong>: {craft.getTotalArmorPoints()} of {craft.getAvailableArmorPoints()} points &nbsp;|&nbsp;
                    <strong>Heat</strong>: {craft.getWeaponHeat()} of {craft.getHeatDissipation()} dissipated &nbsp;|&nbsp;
                    <strong>BV</strong>: {craft.getBattleValue()}
                    {issues.length > 0 ? (
                        <ul className="color-red" data-testid="sc-issues">
                            {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                        </ul>
                    ) : null}
                </div>
            </TextSection>
        );
    }
}

interface ISmallCraftStatusBarProps {
    craft: SmallCraft;
    rulesLevel?: number;
}
