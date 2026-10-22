import React, { type JSX } from 'react';
import CapitalShip from '../../classes/capital-ship';
import CapitalShipRecordSheetSVG from './svg/capital-ship-record-sheet-svg';

// A JumpShip, WarShip or space station record sheet: the full-page sheet (see CapitalShipRecordSheetSVG). With
// showDamage, damage marked in play is filled in.
export default class CapitalShipRecordSheet extends React.Component<ICapitalShipRecordSheetProps> {
    render = (): JSX.Element => (
        <div className="print-page" style={{ maxHeight: "none" }}>
            <CapitalShipRecordSheetSVG ship={this.props.ship} showPilot={this.props.showPilot} showDamage={this.props.showDamage} />
        </div>
    );
}

interface ICapitalShipRecordSheetProps {
    ship: CapitalShip;
    showPilot?: boolean;
    showDamage?: boolean;
}
