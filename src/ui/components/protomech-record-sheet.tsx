import React, { type JSX } from 'react';
import ProtoMech from '../../classes/protomech';
import ProtoMechRecordSheetSVG, { PROTOMECH_UNITS_PER_PAGE, protoMechSheetUnits, type IProtoMechSheetUnit } from './svg/protomech-record-sheet-svg';

// ProtoMech record sheets (see ProtoMechRecordSheetSVG): five ProtoMechs, a Point, to a page.
// With showDamage, damage marked in play is filled in.
export default class ProtoMechRecordSheet extends React.Component<IProtoMechRecordSheetProps> {
    render = (): JSX.Element => {
        const units = this.props.units ?? protoMechSheetUnits(this.props.protos ?? (this.props.proto ? [this.props.proto] : []));
        const pages: IProtoMechSheetUnit[][] = [];
        for (let i = 0; i < units.length; i += PROTOMECH_UNITS_PER_PAGE) pages.push(units.slice(i, i + PROTOMECH_UNITS_PER_PAGE));
        return (
            <>
                {pages.map((page, index) => (
                    <div key={index} className="print-page" style={{ maxHeight: "none", breakBefore: index > 0 ? "page" : undefined }}>
                        <ProtoMechRecordSheetSVG units={page} showDamage={this.props.showDamage} />
                    </div>
                ))}
            </>
        );
    }
}

interface IProtoMechRecordSheetProps {
    /** The designs to print, each with its Point, five ProtoMechs to a page. */
    protos?: ProtoMech[];
    /** Sheet blocks already split from their Points. */
    units?: IProtoMechSheetUnit[];
    /** One design. */
    proto?: ProtoMech;
    showDamage?: boolean;
}
