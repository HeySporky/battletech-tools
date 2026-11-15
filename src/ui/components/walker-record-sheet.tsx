import React, { type JSX } from 'react';
import Walker from '../../classes/walker';
import WalkerRecordSheetSVG from './svg/walker-record-sheet-svg';

// Walker record sheets (see WalkerRecordSheetSVG): one design to a page.
export default class WalkerRecordSheet extends React.Component<IWalkerRecordSheetProps> {
    render = (): JSX.Element => {
        const walkers = this.props.walkers ?? (this.props.walker ? [this.props.walker] : []);
        return (
            <>
                {walkers.map((walker, index) => (
                    <div key={`${walker.getUUID()}-${index}`} className="print-page" style={{ maxHeight: "none", breakBefore: index > 0 ? "page" : undefined }}>
                        <WalkerRecordSheetSVG walker={walker} />
                    </div>
                ))}
            </>
        );
    }
}

interface IWalkerRecordSheetProps {
    /** The designs to print, one to a page. */
    walkers?: Walker[];
    /** One design. */
    walker?: Walker;
}
