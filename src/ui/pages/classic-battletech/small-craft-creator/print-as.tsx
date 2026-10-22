import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import SmallCraftAlphaStrikeCard from '../../../components/small-craft-as-card';

/** The converted Alpha Strike card of the Small Craft: a large aerospace card with four firing arcs (ASC p.101). */
export default class SmallCraftCreatorPrintAS extends React.Component<IPrintASProps> {
    constructor(props: IPrintASProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Alpha Strike Card | Small Craft Creator");
    }

    render = (): JSX.Element => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (!craft) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/summary`} appGlobals={this.props.appGlobals}
                requiredRulesLevel={craft.getRequiredRulesLevel()}
            >
                <div className="print-page" data-testid="sc-as-card">
                    <SmallCraftAlphaStrikeCard craft={craft} />
                </div>
            </PrintablePage>
        );
    }
}

interface IPrintASProps {
    appGlobals: IAppGlobals;
}
