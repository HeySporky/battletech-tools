import React, { type JSX } from 'react';
import BattledroidsUnit from '../../classes/battledroids-unit';
import BattledroidsUnitRecordSheetSVG from './svg/battledroids-unit-record-sheet-svg';

// Record sheets for the tanks, jeeps and infantry squads of Expert Battledroids (BD pp.22-23): two units to a page,
// as the book prints its droid record sheets (see BattledroidsUnitRecordSheetSVG). With showDamage, damage and shots
// used in play are filled in.
export default class BattledroidsUnitRecordSheet extends React.Component<IBattledroidsUnitRecordSheetProps> {
    render = (): JSX.Element => {
        const units = this.props.units;
        const pages = Array.from({ length: Math.ceil(units.length / 2) }, (_unused, page) => units.slice(page * 2, page * 2 + 2));
        return (
            <>
                {pages.map((pair, page) => (
                    <div key={pair[0].getUUID()} className="print-page" style={{ maxHeight: "none", breakBefore: page > 0 ? "page" : undefined }}>
                        <BattledroidsUnitRecordSheetSVG units={pair} showDamage={this.props.showDamage} />
                    </div>
                ))}
            </>
        );
    };
}

interface IBattledroidsUnitRecordSheetProps {
    units: BattledroidsUnit[];
    showDamage: boolean;
}
