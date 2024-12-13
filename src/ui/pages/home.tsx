import React from 'react';
import { Link } from 'react-router-dom';
import { IAppGlobals } from '../app-router';
import TextSection from '../components/text-section';
import UIPage from '../components/ui-page';
import './home.scss';

export default class Home extends React.Component<IHomeProps, IHomeState> {
    constructor(props: IHomeProps) {
        super(props);
        this.state = {
            updated: false,
        }

        this.props.appGlobals.makeDocumentTitle("Home");
    }

    render = (): JSX.Element => {
      return (
        <UIPage current="home" appGlobals={this.props.appGlobals}>

          <div className="row">
            <div className="col-md">
              <TextSection
                label="Jeff's BattleTech Tools"
                >
                  <ul className='styleless'>
                    <li>
                      <h3><Link to="alpha-strike/roster">Alpha Strike Roster</Link></h3>
                      <ul>
                        <li>The ability to search the <a href="http://masterunitlist.info" target="mul">Master Unit List (MUL)</a> and add Alpha Strike Units to your Companies/Lances/Stars/Binaries, etc.</li>
                        <li>After the MUL is searched and added to your forces, your units are stored offline on your local device.</li>
                        <li>You may print your AS forces here (which you can do on the MUL if you like), but more importantly you can...</li>
                        <li>Play your Alpha Strike games using a live in-play virtual stack of Alpha Strike Cards. When you unit takes damage or heat, the effects of the damage affect the card live and immediately. All your to-hit rolls are updated on-the-fly.</li>
                      </ul>
                    </li>
                    <li>
                      <h3><Link to="classic-battletech">Classic BattleTech Tools</Link></h3>
                      <ul>
                        <li>
                          <h4><Link to="classic-battletech/mech-creator">'Mech Creator</Link></h4>
                          <p>The 'mech creator closely follows the Classic BattleTech Tech Manual's steps in creating a BattleMech, whether it is a Biped or Quad.</p>
                          <ul>
                            <li>BattleValue 2, Alpha Strike Stats, and C-Bill cost are all matching up with standard BattleTech designs</li>
                            <li>Currently most introductory and standard equipment are available to Inner Sphere designs.</li>
                            <li>Very basic Clan 'mechs can be created, though data entry for the Clan equipment is lagging.</li>
                            <li>When you save your 'mechs you have the ability to add them to your 'mech roster.</li>
                          </ul>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/roster">'Mech Roster</Link></h4>
                          <p>Heavily under construction. Like the Alpha Strike Roster, this is a set of Electronic Record Sheets which will allow you to:</p>
                          <ul>
                            <li>Track your movement modes and to-hit numbers for each mech at a glance</li>
                            <li>Set your targets speed, range, and other to-hit modifiers (you may have up to 3 targets at one time)</li>
                            <li>Assign your weapons to your targets, your GATOR and final To-Hit will be calculated for you</li>
                            <li>During the Firing Phase, you'll open up a single sheet with all your 'mechs and weapons with their respective targets with the ability to mark the attack as resolved. Cluster hits are easily tracked as well.</li>
                            <li>Heat is automatically assigned during the heat phase per the 'mech's movement mode and discharged weapons.</li>
                          </ul>
                        </li>

                      </ul>

                    </li>
                    <li>
                      <h4><Link to="settings/backup-and-restore">Backing up and Restoring</Link></h4>
                      <p className="alert alert-warning alert-thin">Your data is always private and stored on your own device. This means that if you lose your device you lose your data!</p>
                      <p><strong>He wanted this app to be forever free and forever open source,</strong> even after his untimely demise. Having this app hosted at GitHub helps guarantee that.</p>
                    </li>
                  </ul>
                  <h3>Why? What's the purpose of ths app? I use Solaris Skunk Werks/Mech Factory/ etc.</h3>
                  <p>Each of these software packages are amazing tools! However what they lack is complete cross-platform compatibility and ease of tablet use. Sure, <a href="https://battletech.rpg.hu/mechfactory_frame.php">Mech Factory</a> comes close, but it can't be used offline.</p>
                  <p>Jeff created this app originally as an electronic Alpha Strike roster sheet, but it's grown into more.</p>

                  <h3>What's next?</h3>
                  <p>Plans will be updated on the <Link to="dev-status">Development Status Page</Link>.</p>
                </TextSection>
            </div>
            <div className="col-md">
            <TextSection
              label="News"
            >
                  <ul className="news">
                  <li>
                  <h4>
                      <strong>December 12th, 2024</strong> - New Fork
                    </h4>
                  <p>This is a development fork of <a href="https://jdgwf.github.io/battletech-tools/">Jeff's Battletech Tools</a>. The goal is to keep the project running and updated after Jeff's untimely passing, while leaving the original site as it was. The original code base can be found on <a href="https://github.com/jdgwf/battletech-tools">GitHub</a>.</p>

                    <p>This first push will have Formation Bonuses from the Davion Force Manual, as well as an Updated ReadMe as a test of the deployment systems.</p>
                    <p><strong>Patch Notes</strong></p>
                    <p>- Added Davion Force Manual Formations to AS Builder</p>
                    <p>- Updated ReadMes</p>
                    <p>- Removed extraneous console warnings</p>
                    <p>- Disabled custom analytics</p>
                    <p>- Made Special Pilot Ability rules more clear on pilot edit page</p>
                    <p>- Fixed bug where SPAs were being added to force PV totals.</p>
                    <p>- Fixed bug where first picked SPA description was showing for second and third SPAs</p>
                    <p>- All of a pilot's SPAs now show when printing your force.</p>
                  </li>
                  
                  </ul>
              </TextSection>
            </div>
          </div>

        </UIPage>
      );
    }
}

interface IHomeProps {
  appGlobals: IAppGlobals;
}

interface IHomeState {
    updated: boolean;

}