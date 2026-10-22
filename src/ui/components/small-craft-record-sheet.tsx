import React, { type JSX } from 'react';
import SmallCraft from '../../classes/small-craft';
import SmallCraftAlphaStrikeCard from './small-craft-as-card';
import DropShipRecordSheetSVG from './svg/dropship-record-sheet-svg';
import SmallCraftRecordSheetSVG from './svg/small-craft-record-sheet-svg';

// A Small Craft or DropShip record sheet: the full-page sheet (see SmallCraftRecordSheetSVG, DropShipRecordSheetSVG) and, when asked, a second page with
// the Alpha Strike card. With showDamage, damage marked in play is filled in.
export default class SmallCraftRecordSheet extends React.Component<ISmallCraftRecordSheetProps> {
    render = (): JSX.Element => (
        <>
            <div className="print-page" style={{ maxHeight: "none" }}>
                {this.props.craft.isDropShip()
                    ? <DropShipRecordSheetSVG craft={this.props.craft} showPilot={this.props.showPilot} showDamage={this.props.showDamage} />
                    : <SmallCraftRecordSheetSVG craft={this.props.craft} showPilot={this.props.showPilot} showDamage={this.props.showDamage} />}
            </div>
            {this.props.showAlphaStrike ? (
                <div className="print-page vehicle-sheet-extras" style={{ breakBefore: "page" }}>
                    <h3>Alpha Strike</h3>
                    <SmallCraftAlphaStrikeCard craft={this.props.craft} />
                </div>
            ) : null}
        </>
    );
}

interface ISmallCraftRecordSheetProps {
    craft: SmallCraft;
    showPilot?: boolean;
    showDamage?: boolean;
    /** Adds a second page with the Alpha Strike card. */
    showAlphaStrike?: boolean;
}
