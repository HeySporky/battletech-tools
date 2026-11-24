import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import VehicleRecordSheet from '../../../components/vehicle-record-sheet';
import { unitRulesLevel } from '../../../components/game-settings-block';

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
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/summary`} appGlobals={this.props.appGlobals} requiredRulesLevel={vehicle.getRequiredRulesLevel()} rulesLevel={unitRulesLevel(vehicle, this.props.appGlobals.appSettings)}>
                <VehicleRecordSheet vehicle={vehicle} showAlphaStrike={true} />
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
