import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import CapitalShipRecordSheet from '../../../components/capital-ship-record-sheet';
import { unitRulesLevel } from '../../../components/game-settings-block';

export default class CapitalShipCreatorRecordSheet extends React.Component<IRecordSheetProps> {
    constructor(props: IRecordSheetProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Record Sheet | JumpShip and WarShip Creator");
    }

    render = (): JSX.Element => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (!ship) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/summary`} appGlobals={this.props.appGlobals} requiredRulesLevel={ship.getRequiredRulesLevel()} rulesLevel={unitRulesLevel(ship, this.props.appGlobals.appSettings)}>
                <CapitalShipRecordSheet ship={ship} />
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}
