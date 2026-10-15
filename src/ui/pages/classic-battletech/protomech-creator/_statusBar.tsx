import React, { type JSX } from 'react';
import ProtoMech from '../../../../classes/protomech';
import TextSection from '../../../components/text-section';

/** The running totals every step of the ProtoMech Creator shows: weight, room by location, and what is not legal yet. */
export default class ProtoMechStatusBar extends React.Component<IProtoMechStatusBarProps> {
    render = (): JSX.Element => {
        const proto = this.props.proto;
        const issues = proto.getIssues();
        return (
            <TextSection label={proto.getDisplayName()}>
                <div data-testid="pm-status">
                    <strong>Weight</strong>: <span data-testid="pm-weight">{proto.getWeight()}</span> of {proto.getMaxWeight()} kg
                    (<span data-testid="pm-remaining">{proto.getRemainingWeight()}</span> kg left) &nbsp;|&nbsp;
                    <strong>Items</strong>: {proto.getMountLocations().map((location) => {
                        const maxKg = proto.getLocationMaxWeight(location);
                        return `${proto.getLocationName(location)} ${proto.getLocationMounts(location).length}/${proto.getLocationItems(location)}${maxKg === null ? "" : ` (${proto.getLocationWeight(location)}/${maxKg} kg)`}`;
                    }).join(", ")} &nbsp;|&nbsp;
                    <strong>Movement</strong>: {proto.getMovementText()} &nbsp;|&nbsp;
                    <strong>BV</strong>: {proto.getBattleValue()}
                    {issues.length > 0 ? (
                        <ul className="color-red" data-testid="pm-issues">
                            {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                        </ul>
                    ) : null}
                </div>
            </TextSection>
        );
    }
}

interface IProtoMechStatusBarProps {
    proto: ProtoMech;
}
