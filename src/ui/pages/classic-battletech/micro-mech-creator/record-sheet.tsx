import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import MicroMechRecordSheet from '../../../components/micro-mech-record-sheet';
import { unitRulesLevel } from '../../../components/game-settings-block';

export default class MicroMechCreatorRecordSheet extends React.Component<IRecordSheetProps> {
    constructor(props: IRecordSheetProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Record Sheet | Micro-Mech Creator");
    }

    render = (): JSX.Element => {
        const micro = this.props.appGlobals.currentMicroMech;
        if (!micro) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/micro-mech-creator/summary`} appGlobals={this.props.appGlobals} rulesLevel={unitRulesLevel(micro, this.props.appGlobals.appSettings)} requiredRulesLevel={micro.getRequiredRulesLevel()}>
                <MicroMechRecordSheet micro={micro} />
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}
