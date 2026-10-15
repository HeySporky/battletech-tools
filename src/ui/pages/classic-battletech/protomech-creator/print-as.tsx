import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import AlphaStrikeUnitSVG from '../../../components/svg/alpha-strike-unit-svg';

/** The converted Alpha Strike card of the ProtoMech; each ProtoMech of a Point is its own unit (ASC p.97). */
export default class ProtoMechCreatorPrintAS extends React.Component<IPrintASProps> {
    constructor(props: IPrintASProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Alpha Strike Card | ProtoMech Creator");
    }

    render = (): JSX.Element => {
        const proto = this.props.appGlobals.currentProtoMech;
        if (!proto) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/protomech-creator/summary`} appGlobals={this.props.appGlobals}
                requiredRulesLevel={proto.getRequiredRulesLevel()}
            >
                <div className="print-page" data-testid="pm-as-card">
                    <AlphaStrikeUnitSVG
                        appGlobals={this.props.appGlobals}
                        asUnit={proto.getAlphaStrikeUnit()}
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
