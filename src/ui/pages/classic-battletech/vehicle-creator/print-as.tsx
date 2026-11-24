import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import AlphaStrikeUnitSVG from '../../../components/svg/alpha-strike-unit-svg';
import { unitRulesLevel } from '../../../components/game-settings-block';

export default class VehicleCreatorPrintAS extends React.Component<IPrintASProps, IPrintASState> {
    constructor(props: IPrintASProps) {
        super(props);
        this.state = { updated: false };
        this.props.appGlobals.makeDocumentTitle("Alpha Strike Card | Vehicle Creator");
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/summary`} appGlobals={this.props.appGlobals}
                requiredRulesLevel={vehicle.getRequiredRulesLevel()} rulesLevel={unitRulesLevel(vehicle, this.props.appGlobals.appSettings)}
            >
                <div className="print-page">
                    <AlphaStrikeUnitSVG
                        appGlobals={this.props.appGlobals}
                        asUnit={vehicle.getAlphaStrikeUnit()}
                        measurementsInHexes={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
                    />
                </div>
            </PrintablePage>
        );
    }
}

interface IPrintASProps {
    appGlobals: IAppGlobals;
}

interface IPrintASState {
    updated: boolean;
}
