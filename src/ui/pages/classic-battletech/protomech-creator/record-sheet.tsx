import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import ProtoMechRecordSheet from '../../../components/protomech-record-sheet';

export default class ProtoMechCreatorRecordSheet extends React.Component<IRecordSheetProps> {
    constructor(props: IRecordSheetProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Record Sheet | ProtoMech Creator");
    }

    render = (): JSX.Element => {
        const proto = this.props.appGlobals.currentProtoMech;
        if (!proto) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/protomech-creator/summary`} appGlobals={this.props.appGlobals} requiredRulesLevel={proto.getRequiredRulesLevel()}>
                <ProtoMechRecordSheet proto={proto} />
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}
