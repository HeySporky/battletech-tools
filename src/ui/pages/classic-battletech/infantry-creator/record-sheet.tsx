import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import InfantryRecordSheet from '../../../components/infantry-record-sheet';
import PrintablePage from '../../../components/printable-page';

export default class InfantryCreatorRecordSheet extends React.Component<IRecordSheetProps> {
    constructor(props: IRecordSheetProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Record Sheet | Infantry Creator");
    }

    render = (): JSX.Element => {
        const platoon = this.props.appGlobals.currentInfantry;
        if (!platoon) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/infantry-creator/summary`} appGlobals={this.props.appGlobals} requiredRulesLevel={platoon.getRequiredRulesLevel()}>
                <InfantryRecordSheet platoon={platoon} />
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}
