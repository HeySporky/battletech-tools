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
            <TextSection label="Jeff's Battletech Tools ilClan Edition BETA - State of the Site">
              The original <a href="https://jdgwf.github.io/battletech-tools">Jeff's BattleTech Tools</a> was created by Jeffrey D. Gordon. He passed from cancer in late 2024. This site is a fork of his original work, and is maintained by a group of volunteers. We are working to keep the site up to date and add new features. If you have any questions or suggestions, please feel free to reach out to us on the <a href="https://discord.gg/U539K45v8U">Discord</a>.<br/>
              <p><strong>Jeff wanted this app to be forever free and forever open source,</strong> even after his untimely demise. Having this app hosted at GitHub helps guarantee that.</p>
             <br /><br />Cancer sucks. Jeff's family has asked for any donations to be made to the <a href="https://colorectalcancer.org/?form=2024EOY" target="_blank" rel="noopener noreferrer">Colorectal Cancer Alliance</a><br /><br /></TextSection>
              </div>
          </div>
          <div className="row">
            <div className="col-md">
              <TextSection
                label="Available Tools"
                >
                  {/* Scrolls in its own box beside the news; it takes focus so a keyboard can scroll it. */}
                  <div className="home-scroll" role="region" aria-label="Available Tools" tabIndex={0}>
                  <ul className='styleless'>
                  <li>
                      <h3><Link to="alpha-strike/roster">Alpha Strike Roster</Link></h3>
                      <ul>
                        <li>Search the <a href="http://masterunitlist.info" target="_blank" rel="noopener noreferrer">Master Unit List (MUL)</a> and add units to your Companies, Lances, Stars and Binaries. A copy is bundled with the app and kept current every week, so search works offline.</li>
                        <li>Filter by rules, tech, type, era, role, faction and special ability, and tick which unit lists to search: the live MUL, the MUL 1.0 leftovers and custom units such as the ArtVees.</li>
                        <li>Add a unit from a photo of its printed card, or a 'Mech you built in the 'Mech Creator.</li>
                        <li>Your forces are stored on your device. Print them, or play with a live stack of cards: damage and heat change the card at once, and to-hit rolls update on the fly.</li>
                      </ul>
                      <br />
                      <h3>Advanced Search Terms</h3>
                      <ul>
                        <li><b>a:&lt;ability&gt;</b> - Search for abilities. Use <b>,</b> for AND (a:ECM,TAG), <b>!</b> for NOT (a:!CASE)</li>
                        <li><b>pv:30-50</b> - Point value ranges, or the &gt;, &lt;, &gt;=, &lt;= and = operators (pv&gt;=40)</li>
                        <li><b>short&gt;=x, medium&gt;=x, long&gt;=x</b> - Damage at each range, with the same operators</li>
                        <li><b>armor&gt;=x, structure&gt;=x</b> - Defensive stats, also as ranges (armor:4-6)</li>
                        <li><b>year:3050-3067</b> - Introduction year ranges</li>
                        <li><b>mv&gt;=10, jump&gt;0</b> - Movement and jump, mv also as ranges (mv:8-12)</li>
                        <li><b>dmg:3/3/2</b> - Exact damage profiles (use * for wildcards: dmg:3/*/*)</li>
                        <li><b>defense&gt;12</b> - Combined armor+structure value</li>
                      </ul>
                      Examples:
                      <ul>
                        <li><i>timber wolf a:IF,ECM long&gt;=3</i> - Timber Wolves with both IF and ECM, long damage 3+</li>
                        <li><i>pv:20-40 a:ECM,TAG</i> - Units 20-40 PV with both ECM and TAG</li>
                        <li><i>mv&gt;=10 jump&gt;0</i> - Fast jumping units</li>
                        <li><i>defense&gt;12 short&gt;=3 mv&lt;8</i> - Slow durable brawlers</li>
                        <li><i>year:3050-3067 a:!CASE</i> - Units introduced 3050-3067 without CASE</li>
                        <li><i>dmg:3/3/* armor:4-6</i> - Units with 3/3/any damage and 4-6 armor</li>
                      </ul>
                      Tech and Role are filters beside the search box, not search terms.
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
                      <p>Every creator follows its edition's construction rules and gives the unit a record sheet, Technical Readout, Battle Value and C-Bill cost, and every unit but a building an Alpha Strike card. 'Mechs and vehicles also show BV1 under the <i>BattleTech Master Rules</i> editions. Each creator starts with the Rules Edition, then that edition's own Rules Levels (Introductory to Experimental, plus Apocryphal, Custom Homebrew and Munchkin for non-canon play), and only offers what those allow. Before a load, import or start over replaces your design, each creator offers to save it. Saved units go into the Classic Roster.</p>
                      <p>Optional rules come as Special Rulesets: a searchable checklist grouped by Construction, Play, Campaign &amp; Economics and Setting, with each ruleset's source and author, a one-line summary, More info for the full text and tables, and the reason a greyed-out one cannot be ticked alongside the others. Fan-made rulesets sit at Custom Homebrew and are NOT OFFICIAL.</p>
                      <ul>
                        <li>
                          <h4><Link to="classic-battletech/mech-creator">'Mech Creator</Link></h4>
                          <ul>
                            <li>Biped, Quad, Tripod, LAM and QuadVee BattleMechs, OmniMechs, Superheavy 'Mechs, IndustrialMechs and Primitive 'Mechs.</li>
                            <li>Inner Sphere, Clan and Mixed technology from the canon equipment catalogs.</li>
                            <li>Any rules edition from <i>Battledroids</i> (1984) to the 2026 Core Rulebook, each offering only what its rulebook prints, with that book's weights, heat, ranges and damage.</li>
                            <li>The printed <i>Battledroids</i> droids: the ten in the box set, the Merlin, the Spider and the 1984 TCI kit-back sheets.</li>
                            <li>Shields on the record sheet, marked off in play.</li>
                            <li>Patchwork Armor, Fractional Accounting and FrankenMechs.</li>
                            <li>Import Solaris Skunk Werks (.ssw) designs or pasted TRO text.</li>
                            <li>Custom Homebrew: Compact 'Mechs (Clell Flint's construction rules, either printing) and Power Armor (Bill Swisher's 5, 10 and 15-ton suits from Future Wars #14, with four sample suits to load).</li>
                          </ul>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/micro-mech-creator">Micro-Mech Creator</Link> (Custom Homebrew)</h4>
                          <p>Solarmech's 10 to 19-ton Micro-Mechs, with step-by-step cost and Battle Value, record sheets, play mode, Alpha Strike cards and four sample designs. Offered once the rules level reaches Custom Homebrew.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/walker-creator">Walker Creator</Link> (Custom Homebrew)</h4>
                          <p>Clell Flint's four-legged walkers from Future Wars, and an industrial walker Inspired by Flint and TechManual, with record sheets, play mode, Alpha Strike cards and three sample walkers. Offered once the rules level reaches Custom Homebrew.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/vehicle-creator">Vehicle Creator</Link></h4>
                          <p>Combat Vehicles of every motive type, ArtVees, OmniVehicles and Support Vehicles (chassis modifications, BAR and tech ratings, light and medium weapons), with turrets, transport bays, Patchwork Armor, Fractional Accounting and MegaMek (.blk) import.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/fighter-creator">Fighter Creator</Link></h4>
                          <p>Aerospace and conventional fighters, OmniFighters, bombs and external stores, and Support Vehicle aircraft: airships, fixed-wing and satellites, with MegaMek (.blk) import for fixed-wing.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/infantry-creator">Infantry Creator</Link></h4>
                          <p>Conventional infantry platoons: motive types, weapons by era, armor kits and specializations.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/battle-armor-creator">Battle Armor Creator</Link></h4>
                          <p>Battle armor suits and squads, weapon loadouts, Tactical Operations equipment and mixed technology, with MegaMek (.blk) import.</p>
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
                          <h4><Link to="classic-battletech/capital-ship-creator">JumpShip and WarShip Creator</Link></h4>
                          <p>JumpShips, WarShips and space stations: K-F drive, capital armor and weapons in up to eight arcs, docking collars, grav decks and bays.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/building-creator">Building Creator</Link></h4>
                          <p>Buildings, gun emplacements, advanced buildings and Castles Brian, with their weapons. In the roster they take damage, critical hits and breaches.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/roster">Classic Roster</Link></h4>
                          <p>Electronic record sheets for every unit type above, grouped into lances and other formations. They let you:</p>
                          <ul>
                            <li>Search the Master Unit List by name, era, faction, tech, role and rules level and add the matching design of any unit type it lists to a group</li>
                            <li>Track each unit's movement modes and to-hit numbers at a glance</li>
                            <li>Set your targets' speed, range and other to-hit modifiers (up to 3 targets at a time)</li>
                            <li>Assign your weapons to your targets, with GATOR and the final to-hit worked out for you</li>
                            <li>Fire everything from one sheet, mark attacks as resolved and track cluster hits</li>
                            <li>Take damage and critical hits by location, with each unit type's own damage rules</li>
                            <li>Apply heat for each 'Mech's movement mode and the weapons it fired</li>
                            <li>Play <i>Battledroids</i> (1984) rules games</li>
                            <li>Run the Future Wars optional rules a unit carries (Opportunity Fire, Strategic Movement, Morale, Weapon Malfunctions, The Long Range Wars) and the fanzine's equipment from its own panels</li>
                            <li>Total the force's Battle Value under the rules edition you pick</li>
                            <li>Print the record sheets and Alpha Strike cards</li>
                          </ul>
                        </li>
                      </ul>
                      <br />
                    </li>
                    <li>
                        <h3><Link to="classic-battletech/tro-jbt">TRO - JBT</Link></h3>
                        <ul>
                          <li>The home of fan-made BattleTech material, gathered by NGCFells with links to every original post, site and Discord server, read a page at a time or downloaded as Markdown.</li>
                          <li>Unit Types: ArtVees, Micro-Mechs, Walkers, Power Armor, VTOLAMs and Permanent Air 'Mechs, each with its history, its rules and pages for its sample designs.</li>
                          <li>Equipment and Ammunition: The Best of Future Wars, Community Homebrew and Apocryphal equipment, and custom ammunition.</li>
                          <li>Each readout has a contents list to jump straight to a design or section.</li>
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
                        <h3><Link to="other-tools">Other Tools</Link></h3>
                        <ul>
                          <li>Links to other fan-made BattleTech tools, such as MegaMek and Solaris Skunk Werks.</li>
                        </ul>
                        <br />
                    </li>
                    <li>
                      <h4><Link to="settings/backup-and-restore">Backing up and Restoring</Link></h4>
                      <p className="alert alert-warning alert-thin">Your data is always private and stored on your own device. This means that if you lose your device you lose your data!</p>
                    </li>
                  </ul>

                  </div>
                </TextSection>
            </div>
            <div className="col-md">
            <TextSection
              label="News"
            >
                  {/* The news scrolls in its own box (discussion #13); it takes focus so a keyboard can scroll it. */}
                  <div className="home-scroll" role="region" aria-label="News" tabIndex={0}>
                  <ul className="news">
                  <li>
                  <h3>
                      <strong>November 17th, 2026</strong> - Power Armor, a new Special Rulesets window, and TRO - JBT by category
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Power Armor (issue #172).</strong> Bill Swisher's "poor man's BattleMech" from Future Wars #14 is a Special Ruleset at Custom Homebrew: build a 5, 10 or 15-ton suit in the 'Mech Creator, with its own record sheet, play rules (Target dialog, pilot criticals, unlatching the front plate), Battle Value and a PWA Alpha Strike ability. Four sample suits in step 1: the printed IPA-1 to IPA-3 and NGCFells's IPA-4. Fan-made, NOT OFFICIAL; where the article is silent the rulings are NGCFells's.</li>
                        <li><strong>Future Wars originals (issue #172).</strong> The Best of Future Wars equipment and rules were checked against the first printings in the Future Wars fanzine (1987-1990), and every credit, in the equipment notes and in TRO - JBT, now names the original issue, year and page before the 1991 reprint. Where the reprint changed a rule, play still follows the reprint until NGCFells rules on it; the notes say what differs.</li>
                        <li><strong>Special Rulesets window (issue #324).</strong> A searchable checklist grouped by Construction, Play, Campaign &amp; Economics and Setting, with each ruleset's source, a summary, why a greyed-out one cannot be ticked, and More info for the full text.</li>
                        <li><strong>TRO - JBT.</strong> The documents are sorted into Unit Types, Equipment, Ammunition and Other, and an opened readout has a contents list: click a design or section to go straight to it. Rulings and figures that are not the source's now name NGCFells as the one who made them.</li>
                        <li><strong>VTOLAM and Permanent Air 'Mech readouts.</strong> Two new Unit Types in TRO - JBT, with their history, what sets them apart, credits to BishopSteiner, professorheyteen, Red Pins and LAMFAN with links to their original posts, and a page for each of the thirteen sample designs. Web addresses in every readout are now clickable, so each source can be followed to the original.</li>
                        <li>Fixed: two TRO - JBT cards opened a missing page, and the armor Best Guess could over-armor a suit's head.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 16th, 2026</strong> - Best of Future Wars equipment and rules in play, Lore and Rules for equipment, and Community Homebrew
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Best of Future Wars (issue #172).</strong> More fanzine equipment at Custom Homebrew (Rapid Fire autocannon, Swing Fire missile racks, Power Boosters) and five optional rules as Special Rulesets: Opportunity Fire, Strategic Movement, Morale, Weapon Malfunctions and The Long Range Wars. A roster's Play page runs them all in Best of Future Wars and Future Wars Rules panels. Fan-made, NOT OFFICIAL; where the fanzine is silent the rulings are NGCFells's.</li>
                        <li><strong>Lore and Rules.</strong> Every piece of equipment can carry in-character lore and a how-it-plays rules field beside the notes that credit its source, editable in the equipment editor.</li>
                        <li><strong>Community Homebrew and Apocryphal equipment.</strong> From r/battletech, the QueerTech Discord and MechWarrior 5: the Superheavy PPC, Fusion Lance, Re-Engineered Fusion Engine, Tandem Charge SRMs, Reloading Rocket Launchers, the Plasma Lance and a Pilebunker (u/Xenosama), and the PPC-X and COIL. Where an author gave no Battle Value, cost, date or Alpha Strike values, NGCFells derived them; the new TRO - JBT card shows the method so you can price your own.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 15th, 2026</strong> - Walkers, 'Mech Alpha Strike heat, and Aces updates
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Walkers (issue #172).</strong> Clell Flint's four-legged 'Mechs from Future Wars #11 and The Best of Future Wars, at Custom Homebrew: a Walker Creator under either printing, an industrial walker Inspired by Flint and TechManual, record sheets, play mode, roster groups, NGCFells's Alpha Strike rules (WK, IWK) and three sample walkers by NGCFells with their own TRO - JBT readout. Cost and Battle Value are provisional. Fan-made, NOT OFFICIAL.</li>
                        <li><strong>Best of Future Wars equipment.</strong> The EII Point Defense System, Gatling Laser, Long Range Flamer, Penitrator, VHE and Inferno Gauss shells and SABOT rounds, each with a TRO - JBT page.</li>
                        <li><strong>'Mech Alpha Strike heat (issue #636).</strong> Conversions follow the Converting Heat errata v1.3; bundled 'Mech cards now match the Master Unit List on 2,763 of 3,473, up from 1,359. The Clan and Inner Sphere Laser AMS heat are no longer swapped.</li>
                        <li><strong>Aces (issues #637, #638, #605, #191).</strong> The automated force ranks its targets and can change mid-game; Battlefield Support cards can be spent; the Scouring Sands emplacements are in the custom list; the card library reads Command, Special Orders and Edge cards from photos at any angle; Named Pilots take Edge abilities, with reminders each phase. Thanks to Rekikire for the reports and card photos.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 14th, 2026</strong> - Micro-Mechs and Compact 'Mechs join Custom Homebrew
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Compact 'Mechs.</strong> Clell Flint's "Alternate Rules for Building Mechs" as two Special Rulesets, one per printing (Future Wars #11 and The Best of Future Wars), followed by the creator, record sheet and play mode. The 4-table critical roll is NGCFells's. Anything that no longer fits is left unallocated, never deleted. Fan-made, NOT OFFICIAL.</li>
                        <li><strong>Micro-Mechs (issue #173).</strong> Solarmech's 10 to 19-ton walkers (version 6.1.0.2, revised by an unnamed editor with Discord, or the 2019 post): a creator with step-by-step cost and Battle Value, record sheets, play mode, NGCFells's Alpha Strike rules (MM, MCR), four sample designs, a Micro-Mech Bay (MMT#) for DropShips and Small Craft, and Aces support with the new Custom units campaign option. Fan-made, NOT OFFICIAL.</li>
                        <li>DropShips and Small Craft now show the official unit-bay transport abilities (AT, ST, MT, PT, VTM, VTH, VTS).</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 12th, 2026</strong> - Four fan-made items, engine heat in play, and more Battle Values traced
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Custom Homebrew.</strong> The Permanent Air 'Mech (Red Pins and LAMFAN), with five of LAMFAN's Air-Slip designs as samples; the Mini Engine (u/VanillaPhysics); the Pile Bunker (u/FweeCom); and the Omni-Laser (u/heavyarmormecha). Each credits its author and says "Inspired by" where a number or rule is NGCFells's.</li>
                        <li><strong>Play mode.</strong> Engine hits add heat for every 'Mech, and an XXL or Mini Engine adds movement heat.</li>
                        <li><strong>Battle Value Accuracy.</strong> 3,941 'Mechs match the Master Unit List and 103 differ; 78 now carry a note on why NGCFells thinks the list's value is the one in question. Fixes found along the way: Clan 'Mech Mortars and RISC Emergency Coolant Systems import and value correctly, and a quad keeps its front-leg weapons.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 11th, 2026</strong> - Every 'Mech Battle Value shows its working
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Every 'Mech Battle Value and cost opens into its steps, each with book and page. A new Battle Value Accuracy page lists every 'Mech whose JBT value differs from the Master Unit List, and why.</li>
                        <li>Fixed: Primitive 'Mechs from MegaMek files carried oversized engines; machine gun arrays counted guns twice; two sizes of one launcher shared ammunition value; torpedo launchers can take Artemis IV.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 10th, 2026</strong> - Aces playtest updates, a patch, and a Mordel.net connection in the works
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Coming: a connection to Mordel.net, built on the public API Mordel.net's owner made for it. You will enter a free key from your own Mordel.net account once in Settings and bring designs, private ones included, into the roster and creators. The key stays on your device and goes only to Mordel.net.</li>
                        <li>Aces, from Rekikire's playtest: movement follows your roster, the Command card hands out Move First and Last and shows the ideal RED, YELLOW and BLUE unit, range damage comes from the unit's own values, duplicate names are numbered, and Behavior conditions are answered where the app knows enough. The critical hit tables are built in.</li>
                        <li>Patch: formation bonuses follow the book more closely, and fixes to size-40 missile clusters, saved Alpha Strike turns and wounds, vehicle motive boxes and low-skill Point Values.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 4th, 2026</strong> - Vehicle BV1, force Battle Value, jump packs and TRO - JBT
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>TRO - JBT</strong> is on the top menu: a home for NGCFells's custom creations. The ArtVee Technical Readout reads like a real TRO, a page at a time, with Markdown download, line art and two new play rules (the Bishop Move and jettisoning fouled spades).</li>
                        <li><strong>Master Rules Battle Value.</strong> Vehicles get BV1 under the Master Rules and its Revised Edition, and force Battle Value adds TAG with homing Arrow IV, C3 networks, semi-guided LRMs and command consoles.</li>
                        <li><strong>Jump packs</strong> for 'Mechs without jump jets (Maximum Tech and Tactical Operations), in the creator, on the record sheet and in play.</li>
                        <li>The Status page moved to the home page, plans live in GitHub issues, and the About page tells why this app exists.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 3rd, 2026</strong> - 'Mech BV1, Maximum Tech, and rules-level fixes
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>ArtVee Technical Readout:</strong> a Custom Homebrew history of the Mobile Artillery Platform and its nine sample designs. The ArtVee idea is by kris (helvedes heste).</li>
                        <li><strong>BV1 by edition.</strong> 'Mechs under the Master Rules, its Revised Edition or the Classic BattleTech box show BV1 beside BV2, matching the book's Goshawk and the Maximum Tech lists, Level 3 equipment included.</li>
                        <li><strong>Maximum Tech.</strong> Enhanced Imaging (cockpit, EI implants and play rules), armless 'Mechs, targeting and tracking systems, and Flare LRM ammunition. The Target dialog gains terrain, darkness, immobile targets and aimed shots; a targeting computer's -1 now applies.</li>
                        <li><strong>Fixes.</strong> Arm actuator costs follow the rulebook; Introductory and Level 1 offer only 3025 technology; Advanced and Experimental parts need their own levels; the Search Rules filter offers Experimental; equipment no longer drops when switching editions back. Aces card reader: more card wording, thanks to Rekikire. SSW imports give the printed Zeus X and Skinwalker B.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 2nd, 2026</strong> - Ammunition explosions by edition, Solaris7 equipment, and 28 more bundled 'Mechs
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Ammunition explosions</strong> follow your edition for 'Mechs, vehicles, buildings, fighters and small craft; DropShips run at zero net heat.</li>
                        <li><strong>Solaris7 forum equipment</strong>, each crediting its author and thread: ten items at Custom Homebrew and four railguns, armors and cannons at Munchkin. Thanks to Captain, Nightstalker666, Prince, Thunder, Lycaon and the late Lonely Coyote.</li>
                        <li><strong>28 more bundled 'Mechs</strong> from MegaMek, all 13 QuadVees among them, with new creator parts (Interface Cockpit with No Gyro, Smart Robotic Control System, prototype double heat sinks and endo steel). Printed record sheets win over MegaMek files where they differ.</li>
                        <li>Better Master Unit List matching for shared alternate names; the Skinwalker E and Basilisk (Quad) show their printed Battle Values. Aces fixes for Initiative, printed cards and phones. The weekly Master Unit List update.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 1st, 2026</strong> - Aces Command card form fix
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Aces: the Command card form keeps movement filter orders, orders with no phase, and Maintain this strategy.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>October 29th, 2026</strong> - A sharper Aces card reader, and 127 more bundled 'Mechs
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Aces card reader: lines are matched to the cards' printed phrases, slanted photos are straightened, and colours, numbers and cut-off lines read better. Thanks to Rekikire for the idea and test photos.</li>
                        <li>127 MegaMek 'Mechs the Master Unit List lacks now come with record sheets in the custom unit list, at a Battle Value worked out by the rules and errata.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>October 28th, 2026</strong> - Read a card from a photo, Not Official marks, and your force in the Aces game
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Card photos.</strong> The app can read a photo of your own printed card: add a unit to the Alpha Strike Roster from it, or fill the Aces card editor. Check what it reads; the photo never leaves your device, and no card text ships with the app.</li>
                        <li>Alpha Strike cards not from Master Unit List 2.0 say NOT OFFICIAL, on screen and in print.</li>
                        <li>Aces: your force's cards in the game with a Reset button, line-of-sight icons placed as printed, Overheat rows read from four numbers, and the Missile Boat's Indirect Fire line. Thanks to Rekikire.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 27th, 2026</strong> - Record sheet bubbles in each unit's own shape, 983 bundled Combat Vehicles, and a faster start
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Record sheets</strong> pack armor and structure bubbles in each location's own shape, superheavies never run short, and eight 'Mech bubble faults are fixed.</li>
                        <li><strong>Faster start:</strong> the first download is about a tenth of its old size.</li>
                        <li><strong>Bundled units:</strong> 983 Combat Vehicles plus Support Vehicles, Small Craft and DropShips, and superheavy and tripod 'Mechs (3,600 'Mechs in all), each matching its Master Unit List Battle Value. mordel.net joins Skunk Werks and MegaMek as a source of 'Mech files.</li>
                        <li>Vehicle Battle Value for stealth armor, jet boosters, arrays, drones, mast mounts and fire control; the Cockpit Command Console; "Custom" is now "Fan-made"; LRM 15 heat is 5; Aces line-of-sight icons; new menu icons.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 26th, 2026</strong> - One game settings block and Special Rulesets, 690 more bundled 'Mechs, and printing from the roster
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Game settings.</strong> Every Classic creator opens with Special Rulesets, Edition, Rules Level, Tech Base and Era, in that order; each step offers only what the ones above allow. Each design keeps its own level and rulesets.</li>
                        <li><strong>Special Rulesets</strong> are ticked in a pop-up and named on every record sheet, card and TRO built under them. Clan and Mixed tech start at the Clan Founding Years.</li>
                        <li><strong>OmniMechs and bundled 'Mechs.</strong> Skunk Werks OmniMech imports bring every configuration; 84 OmniMechs and 602 MegaMek 'Mechs join the bundled designs; IndustrialMechs keep Advanced Fire Control and eight show corrected Battle Values.</li>
                        <li><strong>Rosters.</strong> One Find Units list in the Classic Roster, TRO buttons, Print for any sheet, card or TRO, standing badges, and the sample VTOLAMs in the custom units. Alpha Strike cards show minimal damage as 0* and drop empty specials.</li>
                        <li>Also: mine dispenser Battle Value, Clan Founding Years tech choices, battle armor bay doors, and the printed card's trademark notice fits.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 25th, 2026</strong> - Primitive Small Craft and DropShips, the VTOLAM, and 2,859 Skunk Werks 'Mechs
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Primitive Small Craft and DropShips</strong> by year, 2100 to 2499, with K-F booms; MegaMek Primitive files import as such.</li>
                        <li><strong>The VTOLAM</strong> at Custom Homebrew, under BishopSteiner's rules (with his Locust) or professorheyteen's (with his seven designs at their published Battle Values).</li>
                        <li><strong>Custom Homebrew gear:</strong> the Léitíng-23 carbine (is-the-battlemech-cool-or-not), and VoiceOfAN's Improved 'Mech Taser and EMP Missiles from Battletech Into The Future.</li>
                        <li><strong>Bundled units:</strong> 2,859 Skunk Werks 'Mechs and 917 MegaMek battle armor, ProtoMechs, Small Craft and Support Vehicles, each matching its Master Unit List Battle Value, loaded only when needed.</li>
                        <li>Also: ForcePacks add every unit, offline too, with the Aces: Scouring Sands forces; BattleMech turrets; the Battledroids droid record sheet and the Merlin; battle armor rifle and IndustrialMech armor Battle Value fixes.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 24th, 2026</strong> - Skunk Werks imports, Battle Value and DropShip ammunition
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Skunk Werks imports place every item where the file puts it, and Battle Value matches Skunk Werks' BV2 on 2,881 of 2,934 BattleMechs, up from 2,285.</li>
                        <li>DropShip ammunition sits in its bays, MegaMek DropShip files import fully, and large-craft Alpha Strike cards get their arc backs from all 437 MUL cards.</li>
                        <li>Behind the scenes: one equipment registry with editions and Clan dates, checked against MegaMek's 3,830 official items.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 23rd, 2026</strong> - Technical Readouts for every unit type, and the Classic Roster MUL search
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Technical Readouts everywhere.</strong> The Vehicle, Fighter, Infantry, Battle Armor, ProtoMech, Small Craft, JumpShip and WarShip and Building Creators, and Battledroids droids, each have a TRO step and a printable sheet whose table lists every ton. MegaMek imports bring TRO text across, and Engine Table makers are filled in by edition.</li>
                        <li><strong>Classic Roster Master Unit List search</strong> (an idea from Camille, Centrella-Sworn): search by name, era, factions, tech, role and level, for every unit type, with View, TRO and Add.</li>
                        <li><strong>Rules.</strong> Alpha Strike Point Values follow errata v1.6; alternate munitions keep their round's Battle Value; 'Mech placement rules for physical weapons, spread equipment and AES; tripod record sheets; edition rules for ICE 'Mechs and torso armor.</li>
                        <li><strong>Anti-orbital Long Tom</strong> rounds do 5 standard-scale damage, after a suggestion from Vehrec.</li>
                        <li>Also: era availability per 'Mech, large vehicle engine dates, faster imports and restores, and many small layout fixes.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 22nd, 2026</strong> - New record sheets for every unit type, the ArtVee, and quirks in play
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <p>New on the <a href="https://ngcfells.github.io/battletech-tools" target="_blank" rel="noopener noreferrer">beta test site</a> and offered to upstream</p>
                      <ul>
                        <li><strong>Record sheets.</strong> Full-page sheets with every official table for vehicles, fighters, Small Craft, DropShips, JumpShips, WarShips, battle armor (five squads a page), infantry (four platoons), ProtoMechs (a Point a page), buildings, airships, satellites and Battledroids units.</li>
                        <li><strong>The ArtVee</strong>, a Custom Homebrew tank that transforms into artillery, an idea by kris (helvedes heste), with nine samples; the Armored Motive System; and from the Star League Discord, the anti-orbital Long Tom (SmilingNid) with a space turn tracker. The Hailstorm at Apocryphal; the Smoker and Buckler from Future Wars #32.</li>
                        <li><strong>Design quirks in play</strong> on either roster, by game year.</li>
                        <li><strong>Beta feedback.</strong> Era first in every builder, a tonnage bar, the 'Mech Creator's TRO step, chosen sponsons, larger warnings, and fixes to XL engines, CASE, Clan artillery, LRM aerospace damage, Alpha Strike heat and imported quirks.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 17th, 2026</strong> - Enhanced LRTs and the Light Blazer
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Enhanced Long Range Torpedo launchers with ammunition; the Light Blazer from BattleTech Gothic at Apocryphal; Interstellar Operations citations point to Alternate Eras.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>October 16th, 2026</strong> - JumpShips, WarShips and <i>Battledroids</i>
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>JumpShips, WarShips and space stations: creator, Battle Value, record sheet, Alpha Strike card and play. Every unit type can now be built and played.</li>
                        <li>Each edition has its own rules levels, and Battledroids designs show only what that book has. Creators offer to save before replacing a design; shields draw on the 'Mech sheet.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 15th, 2026</strong> - Every unit type, on the beta site
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>New creators for fighters, infantry, battle armor, ProtoMechs, Small Craft and DropShips, and buildings; Support Vehicles and OmniVehicles; Tripods, LAMs, QuadVees, Superheavy, Industrial and Primitive 'Mechs.</li>
                        <li>Rules levels from Introductory to Experimental plus Apocryphal, Custom Homebrew and Munchkin; rules editions from Battledroids (1984) to the 2026 Core Rulebook.</li>
                        <li>Skunk Werks and MegaMek imports, and Alpha Strike additions: an Aces companion, ability filters, paged results and a weekly Master Unit List update.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 1st, 2026</strong> - Vehicle Creator
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <p>The Vehicle Creator now covers the full Combat Vehicle rules: every motive type, Battle Value, cost, Alpha Strike cards and play in the Classic Roster.</p>
                   </li>
                  <li>
                  <h3>
                      <strong>September 29th, 2026</strong> - New Foundations
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Current tools (Vite, React 19, TypeScript) with automated tests; an offline Master Unit List; Battle Value fixes above 25 MP; the license is GPLv3, matching the code it came from.</li>
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
                  </div>
              </TextSection>
            </div>
          </div>
          <div className="row">
            <div className="col-md">
              <TextSection label="Status and Plans">
                <p>Bugs, plans and new ideas are all tracked in the <a href="https://github.com/HeySporky/battletech-tools/issues" target="_blank" rel="noopener noreferrer">GitHub issues</a>, so that is the place to see what is coming or to ask for something.</p>
                <p><strong>Current Focus:</strong> Getting the new unit creators and rules editions reviewed for the main site, then file imports and checking the data against the rulebooks.</p>
                <p><strong>Production Site:</strong> <a href="https://jeffs-bt-tools.github.io/battletech-tools" target="_blank" rel="noopener noreferrer">https://jeffs-bt-tools.github.io/battletech-tools</a><br />
            <strong>Development Site:</strong> <a href="https://heysporky.github.io/battletech-tools" target="_blank" rel="noopener noreferrer">https://heysporky.github.io/battletech-tools</a><br />
            <strong>Development Repo:</strong> <a href="https://github.com/HeySporky/battletech-tools" target="_blank" rel="noopener noreferrer">https://github.com/HeySporky/battletech-tools</a><br />
            <strong>Beta Test Site:</strong> <a href="https://ngcfells.github.io/battletech-tools" target="_blank" rel="noopener noreferrer">https://ngcfells.github.io/battletech-tools</a><br />
            <strong>Beta Test Repo:</strong> <a href="https://github.com/NGCFells/battletech-tools" target="_blank" rel="noopener noreferrer">https://github.com/NGCFells/battletech-tools</a></p>
                <p>New work is tried out on the beta test site first, then offered to the development repo for review. The beta site may have features, and bugs, that the others do not have yet.</p>
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
