import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import VehicleRecordSheet from '../../../components/vehicle-record-sheet';

export default class VehicleCreatorRecordSheet extends React.Component<IRecordSheetProps, IRecordSheetState> {
    constructor(props: IRecordSheetProps) {
        super(props);
        this.state = { updated: false };
        this.props.appGlobals.makeDocumentTitle("Record Sheet | Vehicle Creator");
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/summary`} appGlobals={this.props.appGlobals} requiredRulesLevel={vehicle.getRequiredRulesLevel()}>
                <VehicleRecordSheet vehicle={vehicle} />
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}

interface IRecordSheetState {
    updated: boolean;
}
