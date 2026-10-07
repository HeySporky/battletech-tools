import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import BuildingRecordSheet from '../../../components/building-record-sheet';
import PrintablePage from '../../../components/printable-page';

export default class BuildingCreatorRecordSheet extends React.Component<IRecordSheetProps> {
    constructor(props: IRecordSheetProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Record Sheet | Building Creator");
    }

    render = (): JSX.Element => {
        const building = this.props.appGlobals.currentBuilding;
        if (!building) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/building-creator/summary`} appGlobals={this.props.appGlobals} requiredRulesLevel={building.getRequiredRulesLevel()}>
                <BuildingRecordSheet building={building} />
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}
