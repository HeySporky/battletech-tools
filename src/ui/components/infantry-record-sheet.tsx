import React, { type JSX } from 'react';
import InfantryPlatoon from '../../classes/infantry-platoon';
import InfantryRecordSheetSVG, { INFANTRY_LINES_PER_PAGE, infantrySheetLines, type IInfantrySheetLine } from './svg/infantry-record-sheet-svg';

// Conventional infantry record sheets (see InfantryRecordSheetSVG): four platoons or sub-platoons to a page.
// With showDamage, troopers lost in play are crossed off.
export default class InfantryRecordSheet extends React.Component<IInfantryRecordSheetProps> {
    render = (): JSX.Element => {
        const lines = this.props.lines ?? infantrySheetLines(this.props.platoons ?? (this.props.platoon ? [this.props.platoon] : []));
        const pages: IInfantrySheetLine[][] = [];
        for (let i = 0; i < lines.length; i += INFANTRY_LINES_PER_PAGE) pages.push(lines.slice(i, i + INFANTRY_LINES_PER_PAGE));
        return (
            <>
                {pages.map((page, index) => (
                    <div key={index} className="print-page" style={{ maxHeight: "none", breakBefore: index > 0 ? "page" : undefined }}>
                        <InfantryRecordSheetSVG lines={page} showDamage={this.props.showDamage} />
                    </div>
                ))}
            </>
        );
    }
}

interface IInfantryRecordSheetProps {
    /** The platoons to print, four lines to a page. */
    platoons?: InfantryPlatoon[];
    /** Sheet lines already split from their platoons. */
    lines?: IInfantrySheetLine[];
    /** One platoon. */
    platoon?: InfantryPlatoon;
    showDamage?: boolean;
}
