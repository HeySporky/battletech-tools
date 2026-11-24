import React, { type JSX } from 'react';
import Building from '../../classes/building';
import BuildingRecordSheetSVG, { buildingSheetPages } from './svg/building-record-sheet-svg';

// A Structure Record Sheet (see BuildingRecordSheetSVG), with continuation pages for a building whose hexes or
// inventory do not fit on one. With showDamage, what play has left is written in.
export default class BuildingRecordSheet extends React.Component<IBuildingRecordSheetProps> {
    render = (): JSX.Element => {
        const pages = buildingSheetPages(this.props.building, !!this.props.showDamage);
        return (
            <>
                {Array.from({ length: pages }, (_, page) => (
                    <div key={page} className="print-page" style={{ maxHeight: "none", breakBefore: page > 0 ? "page" : undefined }}>
                        <BuildingRecordSheetSVG building={this.props.building} page={page} showDamage={this.props.showDamage} />
                    </div>
                ))}
            </>
        );
    }
}

interface IBuildingRecordSheetProps {
    building: Building;
    /** Write in the armor and Construction Factor lost in play, and list critical hits. */
    showDamage?: boolean;
}
