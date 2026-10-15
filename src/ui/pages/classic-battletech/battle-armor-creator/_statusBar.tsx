import React, { type JSX } from 'react';
import BattleArmor, { BATTLE_ARMOR_LOCATION_NAMES } from '../../../../classes/battle-armor';
import TextSection from '../../../components/text-section';

/** The running totals every step of the Battle Armor Creator shows: weight, slots by location, and what is not legal yet. */
export default class BattleArmorStatusBar extends React.Component<IBattleArmorStatusBarProps> {
    render = (): JSX.Element => {
        const suit = this.props.suit;
        const issues = suit.getIssues();
        const weightClass = suit.getWeightClass();
        return (
            <TextSection label={suit.getDisplayName()}>
                <div data-testid="ba-status">
                    <strong>Weight</strong>: <span data-testid="ba-weight">{suit.getWeight()}</span> of {weightClass.maxWeight} kg
                    (<span data-testid="ba-remaining">{suit.getRemainingWeight()}</span> kg left) &nbsp;|&nbsp;
                    <strong>Slots free</strong>: {suit.getLocations().map((location) => `${BATTLE_ARMOR_LOCATION_NAMES[location]} ${suit.getFreeSlots(location)}/${suit.getSlots(location)}`).join(", ")}
                    {suit.getArmorSlots() > 0 ? `, less ${suit.getArmorSlots()} for armor` : ""} &nbsp;|&nbsp;
                    <strong>Movement</strong>: {suit.getMovementText()} &nbsp;|&nbsp;
                    <strong>BV</strong>: {suit.getBattleValue()}
                    {issues.length > 0 ? (
                        <ul className="color-red" data-testid="ba-issues">
                            {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                        </ul>
                    ) : null}
                </div>
            </TextSection>
        );
    }
}

interface IBattleArmorStatusBarProps {
    suit: BattleArmor;
}
