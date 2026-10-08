import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import BattleArmorRecordSheet from '../../../components/battle-armor-record-sheet';
import PrintablePage from '../../../components/printable-page';

export default class BattleArmorCreatorRecordSheet extends React.Component<IRecordSheetProps> {
    constructor(props: IRecordSheetProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Record Sheet | Battle Armor Creator");
    }

    render = (): JSX.Element => {
        const suit = this.props.appGlobals.currentBattleArmor;
        if (!suit) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator/summary`} appGlobals={this.props.appGlobals} requiredRulesLevel={suit.getRequiredRulesLevel()}>
                <BattleArmorRecordSheet suit={suit} />
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}
