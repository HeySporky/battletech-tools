import React, { type JSX } from 'react';
import MicroMech from '../../classes/micro-mech';
import MicroMechRecordSheetSVG from './svg/micro-mech-record-sheet-svg';

// Micro-Mech record sheets (see MicroMechRecordSheetSVG): one design to a page.
export default class MicroMechRecordSheet extends React.Component<IMicroMechRecordSheetProps> {
    render = (): JSX.Element => {
        const micros = this.props.micros ?? (this.props.micro ? [this.props.micro] : []);
        return (
            <>
                {micros.map((micro, index) => (
                    <div key={`${micro.getUUID()}-${index}`} className="print-page" style={{ maxHeight: "none", breakBefore: index > 0 ? "page" : undefined }}>
                        <MicroMechRecordSheetSVG micro={micro} />
                    </div>
                ))}
            </>
        );
    }
}

interface IMicroMechRecordSheetProps {
    /** The designs to print, one to a page. */
    micros?: MicroMech[];
    /** One design. */
    micro?: MicroMech;
}
