import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import CapitalShipAlphaStrikeCard from '../../../components/capital-ship-as-card';

/** The converted Alpha Strike card of the vessel: a large aerospace card with four arcs (ASC pp.102-103). */
export default class CapitalShipCreatorPrintAS extends React.Component<IPrintASProps> {
    constructor(props: IPrintASProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Alpha Strike Card | JumpShip and WarShip Creator");
    }

    render = (): JSX.Element => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (!ship) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/summary`} appGlobals={this.props.appGlobals}
                requiredRulesLevel={ship.getRequiredRulesLevel()}
            >
                <div className="print-page">
                    <CapitalShipAlphaStrikeCard ship={ship} />
                </div>
            </PrintablePage>
        );
    }
}

interface IPrintASProps {
    appGlobals: IAppGlobals;
}
