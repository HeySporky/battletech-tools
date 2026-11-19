import React, { type JSX } from 'react';
import { IAppGlobals } from '../app-router';
import './about.scss';
import UIPage from '../components/ui-page';
import TextSection from '../components/text-section';
import TrademarkNoticeParagraphs from '../components/trademark-notice';
import { getSpecialRulesets } from '../../data/special-rulesets';

export default class About extends React.Component<IAboutProps, IAboutState> {

  constructor(props: IAboutProps) {
    super(props);

    this.props.appGlobals.makeDocumentTitle("About Jeff's BattleTech Tools IIC");
  }

    render = (): JSX.Element => {
      return (
    <UIPage current="about" appGlobals={this.props.appGlobals}>
    <div className="row">
        <div className="col-md-6">
        <TextSection
            label="Current Maintainers"
          >   
              <h3 className="h4"><strong>Michael "Spork" Evans</strong></h3>
              Software Architecture and Development - <a href="https://github.com/HeySporky">GitHub</a> - <a href="https://instagram.com/TheSpork">Instagram</a>
              <br /><br />
              <h3 className="h4"><strong>FleetfootMike</strong></h3>
              DevOps/Design - <a href="https://www.talesfromtheperiphery.org.uk/">Podcast</a>
              <br /><br />
              <h3 className="h4"><strong>NGCFells</strong></h3>
              Gaming Grognard - <a href="https://github.com/ngcfells">GitHub</a>
              <br />
              Started playing BattleTech when it was known as BattleDroids on 12/25/1984... Been doing it ever since. An archivist and web archeologist, he is always looking for that next old crusty thing someone left stashed in an old pizza box covered in Crown Royal bags.
              <br /><br />
              <h3 className="h4"><strong>Phasertech</strong></h3>
              QA/User Experience<br /><br />
              <h3 className="h4"><strong>Shadoblade</strong></h3>
              More Info Soon!
              <br /><br />
              <h3 className="h4"><strong>blackstarthegodkiller</strong></h3>
              Spiritual Bum / Research Lead<br /><br />
              <br /><br />
              <h3 className="h4"><strong>A Great Discord Community</strong> -  <a href="https://discord.gg/U539K45v8U">Join us!</a></h3>
              <br />
              </TextSection>
          <TextSection
            label="Why This App?"
          >
            <h3 className="h4">Why? What's the purpose of this app? I use Solaris Skunk Werks/Mech Factory/ etc.</h3>
            <p>Each of these software packages are amazing tools! However what they lack is complete cross-platform compatibility and ease of tablet use. Sure, <a href="https://battletech.rpg.hu/mechfactory_frame.php">Mech Factory</a> comes close, but it can't be used offline.</p>
            <p>Jeff created this app originally as an electronic Alpha Strike roster sheet, but it's grown into more.</p>
          </TextSection>
          <TextSection
            label="Original Maintainers"
          >
              <h3 className="h4"><a href="https://github.com/JDGwf" rel="noopener noreferrer">Jeffrey D. Gordon</a></h3>
              <strong>Original Developer</strong> - <a href="https://jdgwf.com/">Jeffrey D. Gordon</a><br />
              <p>Jeff started playing BattleTech in 1985 and started his career as a professional developer in 1996. He created this and other gaming tools as a labor of love. He passed from cancer in late 2024. You can find his original version of this software at <a href="https://jdgwf.github.io/battletech-tools">https://jdgwf.github.io/battletech-tools</a></p>

              <hr />
              <h3 className="h4"><a href="https://github.com/MoonSword22" rel="noopener noreferrer">MoonSword22</a></h3>
              <p><strong>Data Entry and consulting</strong></p>

              <hr />
              <h3 className="h4"><a href="https://github.com/cam-smith" rel="noopener noreferrer">cam-smith</a></h3>
              <p><strong>Fixes for formation bonuses and aero damages</strong></p>

              </TextSection>
        </div>
        <div className="col-md-6">
        <TextSection
          label="Software License"
        >
            <p>This project is open source (GPLv3) with exceptions to the Data directory, see below.</p>

            <p>View the full license here: <a href="https://github.com/HeySporky/battletech-tools/blob/master/LICENSE">at the GitHub repository</a></p>

            <h3 className="h4">Exceptions</h3>
            <p>The data in ./src/data/* contains copyrighted material and is not included. Each of the comments header in the file repeats this exception in the above license.</p>
          </TextSection>
          <TextSection
            label="Bundled Designs"
          >
            <p>The bundled BattleMechs and IndustrialMechs are converted from the <a href="https://github.com/Solaris-Skunk-Werks/SSW-Master">Solaris Skunk Werks</a> project's files, those it has no file for from MegaMek's, and the canon 'Mechs neither has a file for from the MegaMek-format files <a href="https://www.mordel.net">mordel.net</a> generates.</p>
            <p>Those 'Mechs, and the bundled battle armor, ProtoMechs, Small Craft and DropShips and Support Vehicles, are converted from <a href="https://github.com/MegaMek/megamek">MegaMek</a>'s unit files: MegaMek Data &copy; 2025-2026 by The MegaMek Team, licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>. A design NGCFells has checked against its printed Technical Readout is NGCFells's own transcription and no longer carries this notice.</p>
          </TextSection>
          <TextSection
            label="Special Rulesets"
          >
            <p>Special Rulesets are optional and homebrew rules that change how the game plays or how units are built. Tick them in the first step of any unit creator, the Alpha Strike unit creator or a roster's Master Unit List search. Every record sheet, Alpha Strike card and Technical Readout of a unit built under them names them and their source. New rulesets come in through <a href="https://github.com/ngcfells/battletech-tools/issues">GitHub issues</a>.</p>
            <ul>
              {getSpecialRulesets().map((ruleset) => (
                <li key={ruleset.id}>
                  <strong>{ruleset.name}</strong>: {ruleset.description} Source: {ruleset.source.url ? <a href={ruleset.source.url}>{ruleset.source.title}</a> : ruleset.source.title}.
                </li>
              ))}
            </ul>
          </TextSection>
          <TextSection
            label="Copyrights"
          >
          <p>This site and app is a completely free fan-site that makes no claim to ownership to any of <a href="http://catalystgamelabs.com/">Catalyst Game Labs</a>, <a href="http://topps.com">The Topps Company, Inc</a>, or <a href="http://microsoft.com">Microsoft Corporation</a> properties.</p>

          <TrademarkNoticeParagraphs subject="site" />

          <p><a href="http://bg.battletech.com/?page_id=34">See additional information on the BattleTech The Board Game Website</a></p>
        </TextSection>
        <TextSection
        label="Bug Reporting"
      >
          <p>Please submit any bugs as issues on the <a href="https://github.com/HeySporky/battletech-tools/issues">github project</a>.</p>
        </TextSection>
      </div>
    </div>

          </UIPage>
      );
    }
}

interface IAboutProps {
  appGlobals: IAppGlobals;
}

interface IAboutState {

}