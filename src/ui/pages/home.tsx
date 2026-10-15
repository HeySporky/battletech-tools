import React, { type JSX } from 'react';
import { Link } from 'react-router';
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
             <br /><br />Cancer sucks. Jeff's family has asked for any donations to be made to the <a href="https://colorectalcancer.org/?form=2024EOY" target="_blank" rel="noopener noreferrer">Colorectal Cancer Alliance</a><br /><br /></TextSection>.
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
                        <li>The ability to search the <a href="http://masterunitlist.info" target="_blank" rel="noopener noreferrer">Master Unit List (MUL)</a> and add Alpha Strike Units to your Companies/Lances/Stars/Binaries, etc.</li>
                        <li>A copy of the Master Unit List is bundled with the app and kept current every week, so you can search it offline.</li>
                        <li>Filter the search by faction and special ability.</li>
                        <li>After the MUL is searched and added to your forces, your units are stored offline on your local device.</li>
                        <li>You may print your AS forces here (which you can do on the MUL if you like), but more importantly you can...</li>
                        <li>Play your Alpha Strike games using a live in-play virtual stack of Alpha Strike Cards. When your unit takes damage or heat, the effects of the damage affect the card live and immediately. All your to-hit rolls are updated on-the-fly.</li>
                      </ul>
                      <br />
                      <h3>Advanced Search Terms</h3>
                      <ul>
                        <li><b>a:&lt;ability&gt;</b> - Search for abilities. Use <b>,</b> for AND (a:ECM,TAG), <b>!</b> for NOT (a:!CASE)</li>
                        <li><b>pv:30-50</b> - Point value ranges. Also supports &gt;, &lt;, &gt;=, &lt;=, = operators (e.g., pv&gt;=40)</li>
                        <li><b>short&gt;=x, medium&gt;=x, long&gt;=x</b> - Damage filters. Now supports all comparison operators and ranges</li>
                        <li><b>armor&gt;=x, structure&gt;=x</b> - Defensive stats. Supports ranges (armor:4-6)</li>
                        <li><b>year:3050-3067</b> - Introduction year ranges (replaces intro syntax)</li>
                        <li><b>mv&gt;=10, jump&gt;0</b> - Movement and jump filters</li>
                        <li><b>dmg:3/3/2</b> - Exact damage profiles (use * for wildcards: dmg:3/*/*)</li>
                        <li><b>defense&gt;12</b> - Combined armor+structure value</li>
                      </ul>
                      Examples:
                      <ul>
                        <li><i>timber wolf a:IF,ECM long&gt;=3</i> - Timber Wolves with both IF and ECM, long damage 3+</li>
                        <li><i>pv:20-40 a:ECM,TAG</i> - Units 20-40 PV with both ECM and TAG</li>
                        <li><i>role:Striker mv&gt;=10 jump&gt;0</i> - Fast jumping strikers</li>
                        <li><i>defense&gt;12 short&gt;=3 mv&lt;8</i> - Slow durable brawlers</li>
                        <li><i>tech:clan year:3050-3067 a:!CASE</i> - Clan Invasion era units without CASE</li>
                        <li><i>dmg:3/3/* armor:4-6</i> - Units with 3/3/any damage and 4-6 armor</li>
                      </ul>
                      <br />
                    </li>
                    <li>
                      <h3><Link to="alpha-strike/aces">BattleTech: Aces</Link></h3>
                      <ul>
                        <li>A companion for the solo and co-op <i>BattleTech: Aces</i> game: the card library, a card reader, the rules, a to-hit calculator and campaign tracking.</li>
                      </ul>
                      <br />
                    </li>
                    <li>
                      <h3><Link to="classic-battletech">Classic BattleTech Tools</Link></h3>
                      <p>Every creator follows the TechManual's construction steps and gives the unit a record sheet, Battle Value and C-Bill cost, and every unit but a building an Alpha Strike card. Each one starts with the Rules Edition and the Rules Level (Introductory to Experimental, plus Apocryphal, Custom Homebrew and Munchkin for non-canon play), and only offers what those allow. Saved units go into the Classic Roster.</p>
                      <ul>
                        <li>
                          <h4><Link to="classic-battletech/mech-creator">'Mech Creator</Link></h4>
                          <ul>
                            <li>Biped, Quad, Tripod, LAM and QuadVee BattleMechs, OmniMechs, Superheavy 'Mechs, IndustrialMechs and Primitive 'Mechs.</li>
                            <li>Inner Sphere, Clan and Mixed technology from the canon equipment catalogs.</li>
                            <li>Build under any rules edition from <i>Battledroids</i> (1984) to the 2026 Core Rulebook: each edition offers only what its rulebook prints, with that book's weights, heat, ranges and damage.</li>
                            <li>Patchwork Armor, Fractional Accounting and FrankenMechs.</li>
                            <li>Import Solaris Skunk Werks (.ssw) designs.</li>
                          </ul>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/vehicle-creator">Vehicle Creator</Link></h4>
                          <p>Combat Vehicles of every motive type, OmniVehicles and Support Vehicles (chassis modifications, BAR and tech ratings, light and medium weapons), with turrets, transport bays, Patchwork Armor and Fractional Accounting.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/fighter-creator">Fighter Creator</Link></h4>
                          <p>Aerospace and conventional fighters, OmniFighters, bombs and external stores, and Support Vehicle aircraft: airships, fixed-wing and satellites.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/infantry-creator">Infantry Creator</Link></h4>
                          <p>Conventional infantry platoons: motive types, weapons by era, armor kits and specializations.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/battle-armor-creator">Battle Armor Creator</Link></h4>
                          <p>Battle armor suits and squads, weapon loadouts, Tactical Operations equipment and mixed technology.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/protomech-creator">ProtoMech Creator</Link></h4>
                          <p>ProtoMechs and Points, with MegaMek (.blk) import.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/small-craft-creator">Small Craft Creator</Link></h4>
                          <p>Small Craft and DropShips, aerodyne and spheroid: fuel, crew, bays and doors, and capital weapons by arc, with MegaMek (.blk) import.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/building-creator">Building Creator</Link></h4>
                          <p>Buildings, gun emplacements, advanced buildings and Castles Brian, with their weapons. In the roster they take damage, critical hits and breaches.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/roster">Classic Roster</Link></h4>
                          <p>Electronic record sheets for every unit type above, grouped into lances and other formations. They let you:</p>
                          <ul>
                            <li>Track your movement modes and to-hit numbers for each unit at a glance</li>
                            <li>Set your targets' speed, range and other to-hit modifiers (up to 3 targets at a time)</li>
                            <li>Assign your weapons to your targets: your GATOR and final to-hit are worked out for you</li>
                            <li>Fire everything from one sheet, mark attacks as resolved and track cluster hits</li>
                            <li>Take damage and critical hits by location, with each unit type's own damage rules</li>
                            <li>Apply heat for each 'Mech's movement mode and the weapons it fired</li>
                            <li>Play <i>Battledroids</i> (1984) rules games</li>
                            <li>Print the record sheets and Alpha Strike cards</li>
                          </ul>
                        </li>
                      </ul>
                      <br />
                    </li>
                    <li>
                      <h3><Link to="game-management/match-play">Alpha Strike Match Play</Link></h3>
                      <ul>
                        <li>Generates deployments and scenarios for the Alpha Strike Match Play format, with a custom ban system for variety.</li>
                      </ul>
                      <br />
                    </li>
                    <li>
                      <h4><Link to="settings/backup-and-restore">Backing up and Restoring</Link></h4>
                      <p className="alert alert-warning alert-thin">Your data is always private and stored on your own device. This means that if you lose your device you lose your data!</p>
                      <p><strong>Jeff wanted this app to be forever free and forever open source,</strong> even after his untimely demise. Having this app hosted at GitHub helps guarantee that.</p>
                    </li>
                  </ul>
                  <h3>Why? What's the purpose of this app? I use Solaris Skunk Werks/Mech Factory/ etc.</h3>
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
                      <strong>October 15th, 2026</strong> - Every unit type, on the beta site
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <p>The <a href="https://ngcfells.github.io/battletech-tools" target="_blank" rel="noopener noreferrer">beta test site</a> now builds and plays every ground and aerospace unit short of JumpShips. This work is offered to the main site for review.</p>
                      <ul>
                        <li>New creators: fighters (aerospace, conventional and OmniFighters), conventional infantry, battle armor, ProtoMechs, Small Craft and DropShips, and buildings, each with a record sheet, Battle Value, cost and a place in the Classic Roster.</li>
                        <li>Vehicles: Support Vehicles of every motive type and OmniVehicles.</li>
                        <li>'Mechs: Tripods, LAMs, QuadVees, Superheavy 'Mechs, IndustrialMechs and Primitive 'Mechs, with the canon Inner Sphere and Clan equipment checked against the rulebooks.</li>
                        <li>Rules levels from Introductory to Experimental, plus Apocryphal, Custom Homebrew and Munchkin for non-canon play.</li>
                        <li>Rules editions: build a 'Mech under any core rulebook from <i>Battledroids</i> (1984) to the 2026 Core Rulebook, and play <i>Battledroids</i> games. Every creator now starts with the rules edition.</li>
                        <li>Patchwork Armor, Fractional Accounting, FrankenMechs and the <i>Ghosts of Obeedah</i> units.</li>
                        <li>Solaris Skunk Werks import for 'Mechs, and MegaMek import for ProtoMechs and Small Craft.</li>
                        <li>Alpha Strike: a companion for <i>BattleTech: Aces</i>, special ability filters, search results in pages, and the bundled Master Unit List updated every week.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 1st, 2026</strong> - Vehicle Creator
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <p>The Vehicle Creator now covers the full Combat Vehicle rules: every motive type, Battle Value, cost, Alpha Strike cards and play in the Classic Roster. Imports were hardened along the way.</p>
                   </li>
                  <li>
                  <h3>
                      <strong>September 29th, 2026</strong> - New Foundations
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>The app moved to current tools (Vite, React 19, TypeScript), with automated tests on every change.</li>
                        <li>The Alpha Strike Roster searches a copy of the Master Unit List bundled with the app, so it works offline.</li>
                        <li>Fixed: Battle Value for units faster than 25 MP (TechManual p.316), and engines with no matching rating.</li>
                        <li>The license is now GPLv3, matching the code it came from.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>July 26th, 2025</strong> - Enhanced Alpha Strike Search
                    </h3>
                    <h4>Author - Spork</h4>
                      <p>Patch Notes:</p>
                      <p>Major improvements to the Alpha Strike unit search system:</p>
                      <ul>
                        <li>New range syntax: <code>pv:30-50</code>, <code>year:3050-3067</code>, <code>armor:4-6</code></li>
                        <li>Movement filters: <code>mv&gt;=10</code>, <code>jump&gt;0</code> for finding mobile units</li>
                        <li>Advanced ability searches: <code>a:ECM,TAG</code> (both), <code>a:!CASE</code> (without)</li>
                        <li>Damage profile matching: <code>dmg:3/3/2</code> for exact profiles, <code>dmg:3/*/*</code> with wildcards</li>
                        <li>Combined defense values: <code>defense&gt;12</code> for total armor + structure</li>
                        <li>All comparison operators now support &gt;=, &lt;=, != for more precise filtering</li>
                      </ul>
                      <p>See the updated search guide on this page for full details and examples!</p>
                   </li>   
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
                      <p>We've added Faction Filters to the Alpha Strike Roster. It works identically to the <a href="http://masterunitlist.info" target="_blank" rel="noopener noreferrer">MUL</a> faction search on the unit page. The search will pull up a mech if it's available for ANY of the factions you pick, not ALL of them.</p>

                   </li>                
                  <li>
                  <h3>
                      <strong>December 12th, 2024</strong> - New Fork
                    </h3>
                    <h4>Author - Spork</h4>
                  <p>This is a development fork of <a href="https://jdgwf.github.io/battletech-tools/" target="_blank" rel="noopener noreferrer">Jeff's Battletech Tools</a>. The goal is to keep the project running and updated after Jeff's untimely passing, while leaving the original site as it was. The original code base can be found on <a href="https://github.com/jdgwf/battletech-tools">GitHub</a>.</p>

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