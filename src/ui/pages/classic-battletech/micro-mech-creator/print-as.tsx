import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import PrintablePage from '../../../components/printable-page';
import AlphaStrikeUnitSVG from '../../../components/svg/alpha-strike-unit-svg';
import { unitRulesLevel } from '../../../components/game-settings-block';
import { MICRO_MECH_AS_ABILITY_TEXT } from '../../../../data/alpha-strike-special-abilities';
import { MICRO_MECH_CREDIT } from '../../../../data/micro-mech-construction';
import { MICRO_MECH_AS_ABILITY } from '../../../../classes/micro-mech';

/**
 * The Micro-Mech's Alpha Strike card. The conversion is NGCFells's (docs/superpowers/specs/2026-11-14-micro-mech-alpha-strike.md):
 * the card is marked NOT OFFICIAL, and the MCR ability, which no rulebook explains, is spelled out under it.
 */
export default class MicroMechCreatorPrintAS extends React.Component<IPrintASProps> {
    constructor(props: IPrintASProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Alpha Strike Card | Micro-Mech Creator");
    }

    render = (): JSX.Element => {
        const micro = this.props.appGlobals.currentMicroMech;
        if (!micro) return <></>;

        return (
            <PrintablePage backTo={`${process.env.PUBLIC_URL}/classic-battletech/micro-mech-creator/summary`} appGlobals={this.props.appGlobals} rulesLevel={unitRulesLevel(micro, this.props.appGlobals.appSettings)}
                requiredRulesLevel={micro.getRequiredRulesLevel()}
            >
                <div className="print-page" data-testid="micro-as-card">
                    <AlphaStrikeUnitSVG
                        appGlobals={this.props.appGlobals}
                        asUnit={micro.getAlphaStrikeUnit()}
                        measurementsInHexes={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
                    />
                </div>
                {/* Under the card, outside its page box: what MM and MCR mean, since no rulebook says. */}
                <div className="print-page">
                    <div className="text-left med-small-text" data-testid="micro-as-rules">
                        <p><strong>NOT OFFICIAL.</strong> This card is made by this app's own Alpha Strike rules for Micro-Mechs (Custom Homebrew). Unit type MM is a Micro-Mech.</p>
                        <p><strong>{MICRO_MECH_AS_ABILITY} (Micro-Mech)</strong></p>
                        <ul>
                            {MICRO_MECH_AS_ABILITY_TEXT.slice(1).map((line, index) => <li key={index}>{line}</li>)}
                        </ul>
                        <p>{MICRO_MECH_CREDIT}</p>
                        <p className="hide-on-print"><Link to={`${process.env.PUBLIC_URL}/classic-battletech/tro-jbt/micro-mechs`}>The full rules are in TRO - JBT: Micro-Mechs.</Link></p>
                    </div>
                </div>
            </PrintablePage>
        );
    }
}

interface IPrintASProps {
    appGlobals: IAppGlobals;
}
