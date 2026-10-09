import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import SmallCraftRecordSheet from '../../../components/small-craft-record-sheet';

export default class SmallCraftCreatorRecordSheet extends React.Component<IRecordSheetProps> {
    constructor(props: IRecordSheetProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Record Sheet | Small Craft Creator");
    }

    render = (): JSX.Element => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (!craft) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/summary`} appGlobals={this.props.appGlobals} requiredRulesLevel={craft.getRequiredRulesLevel()}>
                <SmallCraftRecordSheet craft={craft} />
            </PrintablePage>
        );
    }
}

interface IRecordSheetProps {
    appGlobals: IAppGlobals;
}
