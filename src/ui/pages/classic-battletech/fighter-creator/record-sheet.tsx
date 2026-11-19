import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import FighterRecordSheet from '../../../components/fighter-record-sheet';
import PrintablePage from '../../../components/printable-page';
import { unitRulesLevel } from '../../../components/game-settings-block';

export default class FighterCreatorRecordSheet extends React.Component<IRecordSheetProps> {
    constructor(props: IRecordSheetProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Record Sheet | Fighter Creator");
    }

    render = (): JSX.Element => {
        const fighter = this.props.appGlobals.currentFighter;
        if (!fighter) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator/summary`} appGlobals={this.props.appGlobals} requiredRulesLevel={fighter.getRequiredRulesLevel()} rulesLevel={unitRulesLevel(fighter, this.props.appGlobals.appSettings)}>
                <FighterRecordSheet fighter={fighter} showAlphaStrike={true} />
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}
