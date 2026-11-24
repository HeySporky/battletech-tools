import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import AlphaStrikeUnitSVG from '../../../components/svg/alpha-strike-unit-svg';
import { unitRulesLevel } from '../../../components/game-settings-block';
import { WALKER_AS_ABILITY_TEXT, getWalkerAntiInfantryFireText } from '../../../../data/alpha-strike-special-abilities';
import { WALKER_AS_ABILITY } from '../../../../classes/walker';

/**
 * The walker's Alpha Strike card. The conversion is NGCFells's (docs/superpowers/specs/2026-11-15-walker-alpha-strike.md):
 * the card is marked NOT OFFICIAL, and the WLK and AIF# abilities, which no rulebook explains, are spelled out under it.
 */
export default class WalkerCreatorPrintAS extends React.Component<IPrintASProps> {
    constructor(props: IPrintASProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Alpha Strike Card | Walker Creator");
    }

    render = (): JSX.Element => {
        const walker = this.props.appGlobals.currentWalker;
        if (!walker) return <></>;
        const stats = walker.getAlphaStrikeStats();
        const antiInfantry = stats.specialAbilities.find((code) => code.startsWith("AIF"));

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/walker-creator/summary`} appGlobals={this.props.appGlobals} rulesLevel={unitRulesLevel(walker, this.props.appGlobals.appSettings)}
                requiredRulesLevel={walker.getRequiredRulesLevel()}
            >
                <div className="print-page" data-testid="walker-as-card">
                    <AlphaStrikeUnitSVG
                        appGlobals={this.props.appGlobals}
                        asUnit={walker.getAlphaStrikeUnit()}
                        measurementsInHexes={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
                    />
                </div>
                {/* Under the card, outside its page box: what WK, WLK and AIF mean, since no rulebook says. */}
                <div className="print-page">
                    <div className="text-left med-small-text" data-testid="walker-as-rules">
                        <p><strong>NOT OFFICIAL.</strong> This card is made by this app's own Alpha Strike rules for walkers (Custom Homebrew). Unit type {stats.type} is {stats.type === "IWK" ? "an industrial walker" : "a walker"}.</p>
                        <p><strong>{WALKER_AS_ABILITY} (Walker)</strong></p>
                        <ul>
                            {WALKER_AS_ABILITY_TEXT.slice(1).map((line, index) => <li key={index}>{line}</li>)}
                        </ul>
                        {antiInfantry ? (
                            <>
                                <p><strong>{antiInfantry} (Anti-Infantry Fire)</strong></p>
                                <ul data-testid="walker-as-aif">
                                    {getWalkerAntiInfantryFireText(walker.getEditionRules()).map((line, index) => <li key={index}>{line}</li>)}
                                </ul>
                            </>
                        ) : null}
                        <p>{walker.getCredit()}</p>
                        <p className="hide-on-print"><Link to={`${process.env.PUBLIC_URL}/classic-battletech/tro-jbt/walkers#alpha-strike-rules`}>The full rules are in TRO - JBT: Walkers.</Link></p>
                    </div>
                </div>
            </PrintablePage>
        );
    }
}

interface IPrintASProps {
    appGlobals: IAppGlobals;
}
