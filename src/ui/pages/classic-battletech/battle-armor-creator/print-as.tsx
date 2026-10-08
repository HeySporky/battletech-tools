import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import AlphaStrikeUnitSVG from '../../../components/svg/alpha-strike-unit-svg';

/** The converted Alpha Strike cards of the suit: the base design, then each alternate loadout. */
export default class BattleArmorCreatorPrintAS extends React.Component<IPrintASProps> {
    constructor(props: IPrintASProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Alpha Strike Card | Battle Armor Creator");
    }

    render = (): JSX.Element => {
        const suit = this.props.appGlobals.currentBattleArmor;
        if (!suit) return <></>;
        const suits = [suit, ...suit.getLoadouts().map((_loadout, index) => suit.getLoadoutSuit(index))];

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator/summary`} appGlobals={this.props.appGlobals}
                requiredRulesLevel={Math.max(...suits.map((item) => item.getRequiredRulesLevel()))}
            >
                {suits.map((item, index) => (
                    <div className="print-page" key={index} data-testid="ba-as-card">
                        <AlphaStrikeUnitSVG
                            appGlobals={this.props.appGlobals}
                            asUnit={item.getAlphaStrikeUnit()}
                            measurementsInHexes={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
                        />
                    </div>
                ))}
            </PrintablePage>
        );
    }
}

interface IPrintASProps {
    appGlobals: IAppGlobals;
}
