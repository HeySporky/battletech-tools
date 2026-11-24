import React, { type JSX } from 'react';
import Walker from '../../../../classes/walker';
import TextSection from '../../../components/text-section';
import { formatBattleValue } from '../../../../data/battle-value';

/** The running totals every step of the Walker Creator shows: weight, movement, heat, and what is not legal yet. */
export default class WalkerStatusBar extends React.Component<IWalkerStatusBarProps> {
    render = (): JSX.Element => {
        const walker = this.props.walker;
        const issues = walker.getIssues();
        const jump = walker.getJumpMP();
        return (
            <TextSection label={walker.getDisplayName()}>
                <div data-testid="walker-status">
                    <strong>Weight</strong>: <span data-testid="walker-weight">{walker.getWeight()}</span> of {walker.getTons()} tons
                    (<span data-testid="walker-remaining">{walker.getRemainingWeight()}</span> left) &nbsp;|&nbsp;
                    <strong>Movement</strong>: {walker.getWalkerWalkMP()}/{walker.getRunMP()}{jump > 0 ? `/${jump}` : ""} &nbsp;|&nbsp;
                    <strong>Heat</strong>: {walker.getHeat()} of {walker.getHeatSinks()} sinks &nbsp;|&nbsp;
                    <strong>Armor</strong>: {walker.getArmorPoints()} &nbsp;|&nbsp;
                    <strong>BV</strong> (provisional): {formatBattleValue((edition) => walker.getBattleValue(edition), "walker", walker.getRulesEdition())}
                    {issues.length > 0 ? (
                        <ul className="color-red" data-testid="walker-issues">
                            {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                        </ul>
                    ) : null}
                </div>
            </TextSection>
        );
    }
}

interface IWalkerStatusBarProps {
    walker: Walker;
}
