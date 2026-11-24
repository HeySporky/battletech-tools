import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import WalkerRecordSheet from '../../../components/walker-record-sheet';
import { unitRulesLevel } from '../../../components/game-settings-block';

export default class WalkerCreatorRecordSheet extends React.Component<IRecordSheetProps> {
    constructor(props: IRecordSheetProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Record Sheet | Walker Creator");
    }

    render = (): JSX.Element => {
        const walker = this.props.appGlobals.currentWalker;
        if (!walker) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/walker-creator/summary`} appGlobals={this.props.appGlobals} rulesLevel={unitRulesLevel(walker, this.props.appGlobals.appSettings)} requiredRulesLevel={walker.getRequiredRulesLevel()}>
                <WalkerRecordSheet walker={walker} />
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}
