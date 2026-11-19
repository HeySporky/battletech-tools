import React, { type JSX } from 'react';
import MicroMech from '../../../../classes/micro-mech';
import TextSection from '../../../components/text-section';
import { formatBattleValue } from '../../../../data/battle-value';

/** The running totals every step of the Micro-Mech Creator shows: weight, slots, movement, and what is not legal yet. */
export default class MicroMechStatusBar extends React.Component<IMicroMechStatusBarProps> {
    render = (): JSX.Element => {
        const micro = this.props.micro;
        const issues = micro.getIssues();
        const jump = micro.getJumpMP();
        return (
            <TextSection label={micro.getDisplayName()}>
                <div data-testid="mm-status">
                    <strong>Weight</strong>: <span data-testid="mm-weight">{micro.getWeight()}</span> of {micro.getMaxWeight()} kg
                    (<span data-testid="mm-remaining">{micro.getRemainingWeight()}</span> kg left) &nbsp;|&nbsp;
                    <strong>Slots</strong>: <span data-testid="mm-slots">{micro.getTotalUsedSlots()}</span> of {micro.getTotalSlots()} &nbsp;|&nbsp;
                    <strong>Weapons</strong>: {micro.getWeaponCount()} of 4 &nbsp;|&nbsp;
                    <strong>Movement</strong>: {micro.getWalkMP()}/{micro.getRunMP()}{jump > 0 ? `/${jump}` : ""} &nbsp;|&nbsp;
                    <strong>Heat</strong>: {micro.getEnergyHeat()} of {micro.getHeatSinks()} sinks &nbsp;|&nbsp;
                    <strong>BV</strong>: {formatBattleValue((edition) => micro.getBattleValue(edition), "mech", micro.getRulesEdition())}
                    {issues.length > 0 ? (
                        <ul className="color-red" data-testid="mm-issues">
                            {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                        </ul>
                    ) : null}
                </div>
            </TextSection>
        );
    }
}

interface IMicroMechStatusBarProps {
    micro: MicroMech;
}
