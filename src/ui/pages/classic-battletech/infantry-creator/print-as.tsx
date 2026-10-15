import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import AlphaStrikeUnitSVG from '../../../components/svg/alpha-strike-unit-svg';

export default class InfantryCreatorPrintAS extends React.Component<IPrintASProps> {
    constructor(props: IPrintASProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Alpha Strike Card | Infantry Creator");
    }

    render = (): JSX.Element => {
        const platoon = this.props.appGlobals.currentInfantry;
        if (!platoon) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/infantry-creator/summary`} appGlobals={this.props.appGlobals}
                requiredRulesLevel={platoon.getRequiredRulesLevel()}
            >
                <div className="print-page">
                    <AlphaStrikeUnitSVG
                        appGlobals={this.props.appGlobals}
                        asUnit={platoon.getAlphaStrikeUnit()}
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
