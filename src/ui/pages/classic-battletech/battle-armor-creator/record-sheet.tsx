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

        // The base design, then a sheet for each alternate loadout.
        const suits = [suit, ...suit.getLoadouts().map((_loadout, index) => suit.getLoadoutSuit(index))];

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator/summary`} appGlobals={this.props.appGlobals} requiredRulesLevel={Math.max(...suits.map((item) => item.getRequiredRulesLevel()))}>
                {suits.map((item, index) => <BattleArmorRecordSheet key={index} suit={item} />)}
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}
