import React, { type JSX } from 'react';
import BattleArmor from '../../classes/battle-armor';
import BattleArmorRecordSheetSVG, { BA_SQUADS_PER_PAGE } from './svg/battle-armor-record-sheet-svg';

// Battle armor record sheets (see BattleArmorRecordSheetSVG): five squads to a page, as on the Total Warfare sheet.
// With showDamage, damage marked in play is filled in.
export default class BattleArmorRecordSheet extends React.Component<IBattleArmorRecordSheetProps> {
    render = (): JSX.Element => {
        const squads = this.props.squads ?? (this.props.suit ? [this.props.suit] : []);
        const pages: BattleArmor[][] = [];
        for (let i = 0; i < squads.length; i += BA_SQUADS_PER_PAGE) pages.push(squads.slice(i, i + BA_SQUADS_PER_PAGE));
        return (
            <>
                {pages.map((page, index) => (
                    <div key={index} className="print-page" style={{ maxHeight: "none", breakBefore: index > 0 ? "page" : undefined }}>
                        <BattleArmorRecordSheetSVG squads={page} showDamage={this.props.showDamage} />
                    </div>
                ))}
            </>
        );
    }
}

interface IBattleArmorRecordSheetProps {
    /** The squads to print, five to a page. */
    squads?: BattleArmor[];
    /** One squad. */
    suit?: BattleArmor;
    showDamage?: boolean;
}
