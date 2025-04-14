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
            <TextSection label="Jeff's Battletech Tools IIC - State of the Site">
              The original <a href="https://jdgwf.github.io/battletech-tools">Jeff's BattleTech Tools</a> was created by Jeffrey D. Gordon. He passed from cancer in late 2024. This site is a fork of his original work, and is maintained by a group of volunteers. We are working to keep the site up to date and add new features. If you have any questions or suggestions, please feel free to reach out to us on the <a href="https://discord.gg/U539K45v8U">Discord</a>.
             <br /><br />Cancer sucks. Jeff's family has asked for any donations to be made to the <a href="https://colorectalcancer.org/?form=2024EOY" target="_blank">Colorectal Cancer Alliance</a><br /><br /></TextSection>.
              </div>
          </div>
          <div className="row">
            <div className="col-md">
              <TextSection
                label="Available Tools"
                >
                  <ul className='styleless'>
                  <li>
                      <h3><Link to="alpha-strike/roster">Alpha Strike Roster</Link></h3>
                      <ul>
                        <li>The ability to search the <a href="http://masterunitlist.info" target="_blank">Master Unit List (MUL)</a> and add Alpha Strike Units to your Companies/Lances/Stars/Binaries, etc.</li>
                        <li>After the MUL is searched and added to your forces, your units are stored offline on your local device.</li>
                        <li>You may print your AS forces here (which you can do on the MUL if you like), but more importantly you can...</li>
                        <li>Play your Alpha Strike games using a live in-play virtual stack of Alpha Strike Cards. When you unit takes damage or heat, the effects of the damage affect the card live and immediately. All your to-hit rolls are updated on-the-fly.</li>
                      </ul>
                      <br />
                      <h3>Advanced Search Terms</h3>
                      <ul>
                        <li><b>a:&lt;ability&gt;</b> - Search for units with the specified ability.</li>
                        <li><b>pv&gt;x, pv&lt;x, pv&gt;=x, pv&lt;=x, pv=x</b> - Search for units in the specified point value range. Range must be limited to 40 points to respect MUL search capabilities.</li>
                        <li><b>short&gt;x, short&gt;=x, medium&gt;x, medium&gt;=x, long&gt;x, long&gt;=x</b> - Filter units by damage value</li>
                        <li><b>armor&gt;x, armor&gt;=x, structure&gt;x, structure&gt;=x</b> - This will filter on armor and structure</li>
                        <li><b>intro&gt;x, intro&gt;=x, intro&lt;x, intro&lt;=x</b> - Filter units by the in universe year they were introduced.</li>
                      </ul>
                      Examples:
                      <ul>
                        <li><i>timber wolf a:if long&gt;=3</i> - This will return all Timber Wolves with both indirect fire and a long range damage value of 3+</li>
                        <li><i>pv&gt;=20 pv&lt;=40 a:ecm</i> - This will return all units with a point cost between 20 and 40 who have the ECM ability</li>
                      </ul>
                      <br />
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
                      <p><strong>Jeff wanted this app to be forever free and forever open source,</strong> even after his untimely demise. Having this app hosted at GitHub helps guarantee that.</p>
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
                  <h3>
                      <strong>April 14th, 2025</strong> - Play Mode Improvements
                    </h3>
                    <h4>Author - Spork</h4>
                      <p>Patch Notes:</p>
                      <p>Added advanced search terms. See search guide on the left hand side of this page.</p>
                      <p>Updated print mode to improve look and feel. Added mech tokens and ability cards.</p>
                      <p>Ability crits will now lower values of appropriate special weapon attacks. (LRM,SRM,IF,HT,ARTX,TUR,etc.)</p>
                      <p>Formations now require 3 units before they can be selected, per ASCE rules. This change aims to lower confusion about them for new players.</p>
                      <p>Added even more Forcepacks!</p>
                      <p>Added remaining formations from Kurita manual</p>
                   </li>   
                   <li>
                  <h3>
                      <strong>March 20th, 2025</strong> - Play Mode Improvements
                    </h3>
                    <h4>Author - Spork</h4>
                      <p>Patch Notes:</p>
                      <p>We've added a couple of improvements to the play mode feature!</p>
                      <p>First, you can now choose how many cards appear in each row. This should help users on smaller screens see easier.</p>
                      <p>Secondly, damage for a round is now tracked in a blue color and doesn't affect your stats until you hit 'Apply' or 'End Round'.</p>
                      <p>As always, feedback and bug reports can be made on our Discord!</p>

                   </li>   
                  <li>
                  <h3>
                      <strong>December 26th, 2024</strong> - Alpha Strike Match Play Generator
                    </h3>
                    <h4>Author - Spork</h4>
                      <p>Patch Notes:</p>
                      <p>The initial release of our matchplay generator can be found <Link to="game-management/match-play">here</Link>. This will allow you to generate deployments and scenarios for the Alpha Strike Match Play Beta, and includes a custom ban system to add some variety to the format.</p>

                   </li>                
                   <li>
                  <h3>
                      <strong>December 24th, 2024</strong> - More Force Packs!
                    </h3>
                    <h4>Author - Spork</h4>
                      <p>Patch Notes:</p>
                      <p>FleetFootMike and Shadoblade have been working to add several force packs to the Alpha Strike roster, as well as rework the way that system is architected. Enjoy!.</p>

                   </li>                
                  <li>
                  <h3>
                      <strong>December 16th, 2024</strong> - Tukayyid Formation Bonuses
                    </h3>
                    <h4>Author - Spork</h4>
                      <p>Patch Notes:</p>
                      <p>We've added the 3 formation bonuses from the Tukayyid campaign book: Phalanx Star, Rogue Star and Strategic Command Star. I'm convinced the last one only exists because of Phellan's Star Composition in the third Blood of Kerensky Book. We've also fixed a couple of bugs. Formation Bonuses will show up properly when you add a Force Pack to your force. Additionally, the Command Lance will show up along with all of the other formations for an empty lance.</p>

                   </li>                
                  <li> 
                  <h3>
                      <strong>December 13th, 2024</strong> - Faction Filtering
                    </h3>
                    <h4>Author - Spork</h4>
                      <p>We've added Faction Filters to the Alpha Strike Roster. It works identically to the <a href="http://masterunitlist.info" target="_blank">MUL</a> faction search on the unit page. The search will pull up a mech if it's available for ANY of the factions you pick, not ALL of them.</p>

                   </li>                
                  <li>
                  <h3>
                      <strong>December 12th, 2024</strong> - New Fork
                    </h3>
                    <h4>Author - Spork</h4>
                  <p>This is a development fork of <a href="https://jdgwf.github.io/battletech-tools/" target="_blank">Jeff's Battletech Tools</a>. The goal is to keep the project running and updated after Jeff's untimely passing, while leaving the original site as it was. The original code base can be found on <a href="https://github.com/jdgwf/battletech-tools">GitHub</a>.</p>

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