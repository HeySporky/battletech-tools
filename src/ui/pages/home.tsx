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
                          </ul>
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
                          <li>Our custom creations: the ArtVee Technical Readout and Ammunition, read a page at a time or downloaded as Markdown.</li>
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
                      <strong>November 16th, 2026</strong> - More Best of Future Wars equipment, now playable, and Lore and Rules for equipment
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>More Best of Future Wars equipment.</strong> Fan-made, NOT OFFICIAL, at the Custom Homebrew rules level, for 'Mechs only: the Rapid Fire (Pom-Pom) AC/2 to AC/20; Swing Fire missile racks that turn to fire 180 degrees, for Inner Sphere and Clan LRMs, SRMs, Streaks and torpedo racks; and Power Boosters for the PPC, the lasers, the legs and the jump jets (issue #172).</li>
                        <li><strong>Best of Future Wars equipment in play.</strong> On a roster's Play page, a 'Mech carrying fanzine equipment gets a Best of Future Wars panel. Power Boosters roll each turn and keep their turns-in-a-row count; a failed booster or burned-out system is shown, and the Movement dialog shows the boosted run and jump MP. Boosted heat stacks with an XXL engine's extra heat. The PDS counts its built-in bursts plus any extra magazine and resolves each salvo. Long Range Flamer and Inferno Gauss fires burn on the 'Mech for their turns, at most 15 heat a turn from outside, and burning Inferno shells add their heat at the heat phase. VHE and SABOT rounds, the Penitrator and the Long Range Flamer's to-hit are handled too. Fan-made, NOT OFFICIAL; where the fanzine is silent the rulings are ours.</li>
                        <li><strong>Lore and Rules.</strong> Equipment now has a Lore field, in-character Technical Readout text, and a Rules field, how it plays, beside the notes that credit the source. Both can be edited in the equipment editor. Every Best of Future Wars item has both, and the <em>Best of Future Wars Equipment</em> technical readout now carries the lore.</li>
                        <li><strong>Best of Future Wars play rules.</strong> Five optional rules from the fanzine are now Special Rulesets at the Custom Homebrew level: Opportunity Fire, Strategic Movement, Morale, Weapon Malfunctions and The Long Range Wars. Each credits its author and page, and opening it in the Special Rulesets window shows a summary of the rule and its tables. Fan-made, NOT OFFICIAL (issue #172).</li>
                        <li><strong>Future Wars rules in play.</strong> A 'Mech built with any of the five Best of Future Wars play rulesets gets a Future Wars Rules panel on the roster's Play page. Strategic Movement shows the doubled MP and puts its heat in place of the movement heat. Opportunity Fire works out the shot's to-hit and puts +1 on the other weapons. Morale checks set a Disorganized, Broken or Routed status that changes the 'Mech's to-hit or stops it firing, and counts down turn by turn. Weapon Malfunctions are recorded on the weapon, with their to-hit and heat applied until cleared. The Long Range Wars adds extended and extreme range, with ranging, to the Target dialog. Fan-made, NOT OFFICIAL; where the fanzine is silent the rulings are ours.</li>
                        <li><strong>Homebrew and Apocryphal equipment, and how we price it.</strong> From r/battletech and MechWarrior 5, NOT OFFICIAL: the Superheavy PPC, the Fusion Lance (its damage, Battle Value and cost follow the 'Mech's engine), the Re-Engineered Fusion Engine, a Tandem Charge SRM house rule, Reloading Rocket Launchers, two community examples from u/Xenosama on the QueerTech Discord server (the Plasma Lance and a Pilebunker, kept apart from the Reddit Pile Bunker and credited to each author), and the Apocryphal PPC-X and COIL weapons from the video games (the COILs now in hexes, at the Apocryphal level they always belonged at). Wherever an author gave no Battle Value, cost, date, tech rating or Alpha Strike values, we derived them and said so in the item's notes, checked against canon weapons; every Custom, Apocryphal and Munchkin item now has its lore and rules too, and fan weapons now count on Alpha Strike cards. The new TRO - JBT card <em>Community Homebrew and Apocryphal Equipment</em> shows the method, the canon check and every figure, so you can price your own the same way.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 15th, 2026</strong> - Walkers join Custom Homebrew, and 'Mech Alpha Strike cards get their heat right
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>The Best of Future Wars equipment.</strong> Fan-made, NOT OFFICIAL, at the Custom Homebrew rules level: the EII Point Defense System, Gatling Laser, Long Range Flamer and the Penitrator missile, VHE and Inferno shells for the Gauss Rifle, and SABOT rounds for the AC/2, AC/5, AC/10 and AC/20. Where a number is ours, the notes say so. Each has a page in the new <em>Best of Future Wars Equipment</em> technical readout (issue #172).</li>
                        <li><strong>Walkers.</strong> Clell Flint's four-legged 'Mechs from <em>Future Wars</em> #11 and <em>The Best of Future Wars, Volume One</em> (1991). Fan-made, NOT OFFICIAL, offered at the Custom Homebrew rules level; a walker you have saved opens at any level. Pick the printing you build under: the two differ in a few places, and the walker follows its own.</li>
                        <li>A walker has ten locations: four legs, front, left, right and rear torsos, a center torso that takes only belly guns (machine guns, small lasers, flamers) and a control section that can carry a turret. Its Walking MP is the engine's figure times 1.25, as Flint's rule rounds it.</li>
                        <li>The Walker Creator covers the chassis, engine, gyro, cockpit, turret, heat sinks, jump jets, armor and weapons, Flint's variant slot counts, and an item split between two locations. Cost and Battle Value are shown step by step; both are ours and marked provisional.</li>
                        <li>An industrial walker is ours, Inspired by Flint's rules and the IndustrialMech rules of <em>TechManual</em>.</li>
                        <li>Record sheets and printing, roster groups, and play mode: damage by location, critical hits, lost legs, ammunition, and the effects on movement and Piloting.</li>
                        <li>Alpha Strike: our own ruleset, with cards for a walker (type WK) and an industrial walker (IWK), read as a BattleMech and an IndustrialMech wherever the rules ask. A WLK ability carries the four-legged rules, and AIF# carries the belly guns. Walkers can join an Alpha Strike roster and an Aces campaign (with Custom units on).</li>
                        <li>Three sample walkers of ours on the creator's home page (Flint printed no designs): the Harrowhound HRH-1, the Ironback IBK-2T with a turret, and the Steppe Titan STN-5V under the variant slots.</li>
                        <li>TRO - JBT: Walkers, a new readout: what a walker is, the Alpha Strike rules and every code on the card, and the three samples as printed TRO entries with their stat blocks.</li>
                        <li><strong>'Mech Alpha Strike heat (issue #636).</strong> The conversion of a 'Mech that runs hot now follows the Converting Heat errata v1.3: Overheat is no longer always 0, damage is scaled before it is rounded, and minimal damage (0*) is no longer turned around. AMS, stealth and Chameleon heat count; rocket and one-shot launchers do not. Against the Master Unit List, the damage and Overheat of our bundled 'Mechs now match on 2,763 of 3,473 cards, up from 1,359.</li>
                        <li>The Clan and Inner Sphere Laser AMS had each other's heat (now 5 and 7).</li>
                        <li><strong>Aces ranks its targets (issue #637).</strong> The automated force now ranks Starting Armor, [S]/[M] damage and "no Armor" target lines from the unit cards, and hides "None." orders. Thanks to Rekikire for the report.</li>
                        <li><strong>Change the automated force mid-game (issue #638).</strong> Units can be added to or removed from the automated force during a game, searching the MUL including the custom list. Thanks to Rekikire for the report.</li>
                        <li><strong>Battlefield Support (issue #605).</strong> Battlefield Support cards can be chosen and spent, up to the Command card's limit per turn. Thanks to Rekikire for the report.</li>
                        <li><strong>Aces emplacements (issue #191).</strong> The Light (3x AC/2), Medium (2x AC/5) and Heavy (AC/20) Emplacements from the <em>Aces: Scouring Sands</em> Battlefield Support cards are in the custom unit list, as printed (the MUL lists none; thanks to Rekikire for the card photos). The Scouring Sands sorties that call for them now bring them in at Skill 4, and the Aces game marks them as emplacements with no deck.</li>
                        <li><strong>Aces card photos.</strong> The Alpha Strike Aces card library can now read photos of Command cards, Special Orders cards and Edge cards, as well as the behavior cards it read before. Photos turned sideways or upside down now read too. Thanks to Rekikire for the card photos.</li>
                        <li><strong>Edge cards.</strong> Edge cards are a new kind in the card library: add them with a form, see them in a list, import and export them as JSON, or read them from a photo.</li>
                        <li><strong>Edge abilities for Named Pilots.</strong> A Named Pilot in a campaign now picks Edge abilities from the Edge cards you entered. Names typed earlier still work.</li>
                        <li><strong>Edge reminders in play.</strong> During a campaign game, each phase lists the Edge abilities of your living Named Pilots that apply: the cost, your condition line and a short hint.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 14th, 2026</strong> - Micro-Mechs and Compact 'Mechs join Custom Homebrew
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Compact 'Mechs.</strong> Two Special Rulesets at Custom Homebrew, one for each printing of Clell Flint's "Alternate Rules for Building Mechs": Future Wars #11 and the Best of Future Wars. Fan-made, NOT OFFICIAL. Turn one on and a biped 'Mech of up to 100 tons is built by his tables. The two cannot be on together.</li>
                        <li>Critical slots by weight class, head structure of 3 to 6 with head armor at most twice that, his cockpits (a heavy 'Mech may take the 4-ton one), two sensor slots, extra sensors and life support, engine slots in the center torso by engine weight, and a gyro of one slot per ton.</li>
                        <li>The creator, record sheet and play mode all follow. Locations of more than six slots are rolled in tables of six; the 4-table roll (1, 2, 3, 4, re-roll 5-6) is ours, and the ruleset says so. The record sheet shrinks its type to fit; an assault 'Mech's middle column is small.</li>
                        <li>Anything that no longer fits is left unallocated, never deleted. 'Mechs built without the ruleset are unchanged, except that an item can no longer be placed past the end of a location.</li>
                        <li>Not built yet: Flint's walkers and the rest of the Best of Future Wars. Both are planned (issue #172).</li>
                        <li><strong>Micro-Mechs</strong>: a creator, record sheets, play mode and Alpha Strike cards.</li>
                        <li>Needs the Custom Homebrew rules level to be offered; a Micro-Mech you have saved opens at any level. Fan-made, NOT OFFICIAL. Micro-Mechs are by Solarmech; version 6.1.0.2 was revised by an unnamed editor with Discord. Where a rule or number is ours, the notes say so.</li>
                        <li>A Micro-Mech is a walker of 10 to 19 tons built in kilograms, with one torso and at most four weapons. Build one under either rules text: the 6.1.0.2 document or Solarmech's 2019 post.</li>
                        <li>The creator covers the chassis, engine, armor, weapons, ammunition and heat sinks, with cost and Battle Value shown step by step. The Battle Value of the document is used for the classic editions; a second Battle Value is ours and marked provisional.</li>
                        <li>Record sheets and printing, roster groups, and play mode: damage, critical hits, ammunition explosions, pilot hits, and the effects on movement and to-hit.</li>
                        <li>Alpha Strike: our own ruleset (type MM, one ability, MCR), with cards, an entry on the Alpha Strike roster's add page, and a TRO - JBT entry that explains every code.</li>
                        <li>Sample Micro-Mechs on the creator's home page: the document's Storm, Tunnel Rat, Hillman and Slayer. The Storm's and Hillman's Battle Values differ from the document's print (223 and 339 against 217 and 352; we keep the rules text), and the Tunnel Rat's printed mass, cost and Battle Value are corrupt, so its figures are ours.</li>
                        <li>Alpha Strike cards for Micro-Mechs show no heat scale or OV, as official vehicle cards do. An Upper Leg Actuator hit is +4 on Piloting, as the document's table prints.</li>
                        <li>A Micro-Mech Bay (75 tons, one Micro-Mech of up to 19 tons) in the DropShip, Small Craft and capital ship creators at Custom Homebrew, with our own Alpha Strike transport ability, MMT#. DropShips and Small Craft now also show the official unit-bay transport abilities (AT, ST, MT, PT, VTM, VTH, VTS), which they were missing.</li>
                        <li>Aces: a Micro-Mech's Engine Hit follows MCR, and the to-hit calculator offers MM targets. A new campaign option, Custom units (Custom Homebrew, not in <em>Aces</em>), lets advanced force creation take Micro-Mechs and lets a Named Pilot fly one.</li>
                        <li>Not built yet: the document's RolePlaying and BattleForce 2 appendices. They wait for those games to get sections of their own.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 12th, 2026</strong> - Four fan-made items join Custom Homebrew, play mode counts engine heat, and nine more 'Mech Battle Values are traced to their cause
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Everything below needs the Custom Homebrew rules level to be offered. A design that already carries one still opens and shows it at any level. Each item's notes credit the author of the post it comes from and say "Inspired by" where a number or rule is ours.</li>
                        <li>Permanent Air 'Mech (Red Pins and LAMFAN, BattleTech forums): a single-mode Land-Air 'Mech that stays an AirMech. It has no conversion equipment and no landing gear, keeps its avionics, and carries a ton of fuel. Wings weigh as an Inner Sphere partial wing (7% of its mass); a Heavy Permanent Air 'Mech of 56 to 75 tons has Cruise at twice its Jump MP and 15% wings. A sample picker in step 1 loads five of LAMFAN's Air-Slip Mech designs rebuilt under these rules: Sparrow SPW-2J, Magpie MGP-1E and MGP-3A, Dire Hawk DRH-4K and DRH-3D.</li>
                        <li>Mini Engine (u/VanillaPhysics): critical slots of a standard engine, weight of a light engine, heat of an XXL engine, and destroyed on a second hit with the first counted as two. Not offered above rating 400 or on superheavies. Its Battle Value treatment is ours. The engine picker now lists custom engines too.</li>
                        <li>Pile Bunker with its ammunition (u/FweeCom): a 5-ton, 5-slot melee weapon, 15 damage, 2 heat, three shots to the ton, explosive. The author calls the numbers tentative.</li>
                        <li>Omni-Laser (u/heavyarmormecha): a 10-ton, 4-slot Inner Sphere laser from 3150, range 6/12/18, with Focus, Pulse and Dazzler modes described in its notes. The record carries the Focus mode's 20 heat and 16 damage. The posts give no cost or Battle Value, so both show as unverified.</li>
                        <li>Play mode: engine hits now add heat for every 'Mech (5 a turn after the first hit, 10 after the second), and an XXL or Mini Engine adds movement heat in play (2 standing, 4 walking, 6 running, jumping doubled with a minimum of 6).</li>
                        <li>Not built yet: AirMech movement in play (enhancement #634), the Pile Bunker's Piloting roll and the Omni-Laser's mode choice in play.</li>
                        <li>Battle Value Accuracy: of the 103 'Mechs whose value differs from the Master Unit List, 73 now carry a note saying why we think the list's value is the one in question (55 from the rule, with the page cited, and 18 from the publisher's own record sheet or write-up). One comes from a fault in the file we import, and 29 were still being worked that morning.</li>
                        <li>The nine added today: Hercules HRC-LS-9004, Buccaneer BCN-6PX 'Pan', Kraken XR, Savage Coyote Z, Gladiator GLD-1R (Keller), Wolfhound WLF-2X, Turkina U, Xanthos XNT-6O and Malak C-MK-OS Caelestis. Each note on the page says what the list's value would need and which page says otherwise.</li>
                        <li>Two readings were checked on the page and stand as they were: an Improved Gauss Rifle counts as explosive like every other Gauss rifle, and CASE II spares a Blue Shield Particle Field Damper's slots, because a hit on an active Blue Shield is an explosion.</li>
                        <li>Later the same day: 3,941 'Mechs now match the list and 103 differ: 78 with a note questioning the list's value (60 from the rule, 18 from a record sheet or write-up), one import fault, and 24 still being worked. Five notes were added: Antlion LK-3D, Woodsman D, Crossbow D and Osteon A (the list's value needs 'Mech Mortar ammunition at 1.2 times the value the tables print) and Thunderbolt IIC 2 (the list counts improved heavy laser slots that a Clan 'Mech's side torso does not count).</li>
                        <li>Three fixes of ours came out of that work. A Clan 'Mech Mortar in a MegaMek file is now read as the Clan launcher, so six more designs import. A RISC Emergency Coolant System now counts as an explosive slot for Battle Value, so the Goshawk II RISC matches the list and joins the bundled designs. A four-legged 'Mech from a MegaMek file now keeps what it carries in its front legs there: the Goliath GOL-3S record sheet shows its two front-leg ER Medium Lasers again (its Battle Value did not change), and ammunition in a front leg now counts as explosive.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 11th, 2026</strong> - Every 'Mech Battle Value shows its working, checked against the Master Unit List
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Every Battle Value and cost figure for a 'Mech now opens into its steps, each with the book and page it comes from, in the designer summary and the unit viewer.</li>
                        <li>A new page, Battle Value Accuracy, compares our 'Mech numbers with the Master Unit List: 3,940 match and 103 differ, each listed with both numbers. For 64 of those we think the list's value is the one in question: 47 where we have read the rule, with the page cited, and 17 where the publisher's own record sheet prints our number. One comes from a fault in the file we import; the other 38 are still being worked.</li>
                        <li>Later the same day: a Primitive 'Mech from a MegaMek file now walks at the speed its file states and carries the engine that speed needs. The Commando COM-1AK now matches the list and joins the bundled designs, three more Primitive files import, and seven bundled Primitive 'Mechs (Archer ARC-1A, four Phoenix PX-1K variants, Reconquista, Rook NH-1X) cost less than before because their engines were oversized. Their Battle Values did not change.</li>
                        <li>Fixes found along the way: several machine gun arrays in one location no longer count the same guns twice, Clan heavy machine gun arrays from MegaMek files link their guns, a 'Mech with two sizes of the same launcher values each ton of ammunition for the launcher it feeds, and torpedo launchers can now carry Artemis IV like the missile launchers of their size.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 10th, 2026</strong> - Aces playtest updates, a patch, and a Mordel.net connection in the works
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Coming: we are working on a new connection to Mordel.net. Mordel.net's owner has built a public API for it, and we are building on it. When it is ready, you will make a free key on your own Mordel.net account, enter it once in Settings, and then look up designs there, including your own private ones, and bring them into the roster and the creators. Your key stays on your device and goes only to Mordel.net. It is not released yet; nothing changes for you today.</li>
                        <li>Aces updates from Rekikire's playtest: the number of player units able to move follows your roster when Movement starts; the Command card hands out Move First and Move Last by itself; damage at range comes from the unit's own short, medium and long values and the distance you enter (you can still type over it); the Command card is found when the sortie names the deck and faction, with a warning when none matches; duplicate unit names are numbered in force order on both sides; the Command card shows the ideal RED, YELLOW and BLUE unit; and Behavior conditions that depend on distances, who has moved, or a crippled unit are answered for you where the app knows enough, and asked when it does not. The critical hit tables are built in, checked against the <i>Alpha Strike Companion Expansion</i> and its errata.</li>
                        <li>Patch: the Alpha Strike formation bonuses now follow the book more closely (Striker/Cavalry checks every unit's Move, Fast Assault needs the Assault Lance's Juggernaut or two Snipers, Pursuit wants a Medium attack over 1, Anti-Air reads FLK, AC and ARTX as printed, Rifle enforces the 8" Move, and the Strategic Command Star accepts an aerospace fighter). Fixed: missile launchers of size 40 (MRM 40 and the like) got the wrong Cluster Hits Table result; an Alpha Strike force's turn and a pilot's wounds are now read back from a save; a unit added to a missing group goes to the last group; vehicle motive boxes no longer grow each time an older save is recalculated; and low-skill Point Values step for every 10 points or part over 104.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 4th, 2026</strong> - Vehicle BV1, force Battle Value, jump packs and TRO - JBT
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>TRO - JBT is on the top menu: a home for our custom creations, with a card for each document. The ArtVee Technical Readout now reads a page at a time and its Markdown can be downloaded, and the anti-orbital Long Tom has its own page under Ammunition.</li>
                        <li>Two new ArtVee rules in Play Mode: the Bishop Move, a risky lateral shift in Vehicle Mode, and jettisoning fouled spades to escape Siege Mode at +1 to hit with its artillery after that. The rules are in the ArtVee Technical Readout.</li>
                        <li>Vehicles now have their own Battle Value under the <i>BattleTech Master Rules</i> and its Revised Edition, beside the current figure, and read that edition's skill table. <i>Maximum Tech</i>'s Level 3 vehicle rules apply under the Revised Edition.</li>
                        <li>The Status page has moved to the home page, and plans now live in the GitHub issues. Available Tools scrolls in its own box beside the News, and the story of why this app exists is on the About page.</li>
                        <li>Force Battle Value under the <i>BattleTech Master Rules</i> and its Revised Edition: units with homing Arrow IV missiles or TAG add 200 once the force has both (under the Revised Edition a C3 master counts as TAG), and a complete C3 network adds 35 percent of each member's weapons. With <i>Maximum Tech</i>'s rules, semi-guided LRM ammunition counts six times beside friendly TAG, and a command console adds 200 once to the force total.</li>
                        <li>The ArtVee Technical Readout now reads like a real TRO: a signed introduction, a Star League, a Clan and an Inner Sphere section, full spec lines and stat pages for all nine designs, and line art of the Falconet in both modes and mid-conversion.</li>
                        <li>Jump packs can now be strapped onto 'Mechs in the 'Mech creator: at Advanced rules under the <i>BattleTech Master Rules, Revised</i> (<i>Maximum Tech</i>) and under Total Warfare (<i>Tactical Operations</i>). They add no design weight or slots, cost 20,000 C-bills a ton, and BV1 adds the pack's MP x 5 to the final BV. They are only for 'Mechs without jump jets, so never beside jets, on a LAM or with partial wings. The technical readout, the record sheet and Play Mode all show them.</li>
                        <li>Jump packs now work in play mode: the record sheet shows the pack's Jumping MP and fuel, a jump on the pack makes no heat and burns its fuel, an empty pack drops off, any rear torso hit destroys it, and the Set Movement dialog can drop it for 1 MP.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 3rd, 2026</strong> - 'Mech BV1, Aces card reader and SSW import fixes
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>The ArtVee now has its own Technical Readout, a Custom Homebrew history of the Mobile Artillery Platform from the Star League to 3085: how the conversion works, the doctrine, the makers, and all nine sample designs with their stats and crews. Read it from the Classic BattleTech menu, or from the sample list in the Vehicle Creator. The ArtVee idea is by kris (helvedes heste).</li>
                        <li>Battle Value by rules edition: a 'Mech built under the <i>BattleTech Master Rules</i>, its Revised Edition or the Classic BattleTech box set now shows its BV1, worked out by that book's rules and equipment tables, with the current rules' BV2 beside it. It matches the Goshawk example in the book and the <i>Maximum Tech</i> BV lists. Under the Revised Edition, <i>Maximum Tech</i>'s Level 3 values count too: its equipment table, XXL and Large engines, hardened armor, reinforced and composite structure, CASE II, heavy-duty gyros, torso-mounted cockpits, command consoles, coolant pods and special ammunition. Other unit types show BV2 until their BV1 is in.</li>
                        <li>Flare LRM ammunition can now be loaded under the <i>BattleTech Master Rules</i> and its Revised Edition (a Level 2 munition, at the normal LRM price), and at the Apocryphal level under Total Warfare, whose errata removed it. <i>Maximum Tech</i> values it at 5% of the standard ammunition's BV.</li>
                        <li>Enhanced Imaging (EI) can now be added to Clan 'Mechs in the 'Mech creator: as <i>Maximum Tech</i>'s Level 3 cockpit system under the <i>BattleTech Master Rules</i>, Revised Edition (400,000 C-bills for the cockpit instead of 200,000, and not with a small, torso-mounted or command console cockpit), and as the Experimental EI interface under Total Warfare. It weighs nothing and takes no slots. BV1 adds 5% of the weapons, takes 25 off the defensive rating and reads the Piloting Skill 1 better. MegaMek files with an EI interface import with it. MechWarriors can now have EI neural implants (a box in the roster's pilot editor, saved with the pilot): under Total Warfare a pilot with implants in a 'Mech with the EI interface reads Gunnery and Piloting 1 better for BV (<i>Interstellar Operations: Alternate Eras</i> p.184); the interface alone changes nothing. EI's record sheet notes come next. Also fixed: a design built under the Master Rules now reports the rules level its equipment needs there (a Variable-Range system needs Level 3); it used to report none.</li>
                        <li>Play mode's Target dialog now takes woods, jungle and smoke hexes, darkness, an immobile target and an aimed shot location for each target, and the to-hit adds sensor hits too. EI is switched on or off there (End Phase): while on it gives Piloting -1, softens woods and smoke, ignores darkness, aims as a targeting computer does, and asks for a feedback roll when internal structure is hit. The 'Mech record sheet prints an EI note in the Warrior Data box: an on box, marked in play while EI is active, and the feedback roll. Fixed: a targeting computer's -1 to hit was never applied in play; it is now, or +3 in its place for an aimed shot (Total Warfare p.143).</li>
                        <li>Armless 'Mechs from <i>Maximum Tech</i> can now be built in the 'Mech creator, under the <i>BattleTech Master Rules, Revised</i> at Advanced rules: bipeds and tripods give up their arm armor, structure, slots and actuators, and BV1 adds 0.1 to the Defensive Movement Factor. The record sheet leaves the arms off, and in play an arm hit does nothing.</li>
                        <li>Targeting and tracking systems from <i>Maximum Tech</i> can now be mounted under the <i>BattleTech Master Rules</i>, Revised Edition, at Level 3: Long-Range, Short-Range, Variable-Range, Anti-Aircraft, Multi-Trac and Multi-Trac II, one to a 'Mech and not with a targeting or C3 computer. Variable-Range and Multi-Trac II take half a ton and a head slot and raise the sensors' price. In play, the to-hit numbers use their range, anti-aircraft and multi-target modifiers, and a Variable-Range setting is picked in the Target dialog. BV1 adds 10% of the weapons for Variable-Range, and counts rear weapons in full with Multi-Trac II. Also fixed: a secondary target in the front arc was labelled "In Rear Arc", and the Target dialog gave the secondary-target modifiers as -1 / -2 when they are +1 / +2.</li>
                        <li>Fixed: 'Mech costs charged for shoulders and for arm actuators a design does not mount, and at the wrong prices. They now follow the rulebook's table (upper arm 100, lower arm 50, hand 80, per ton), so most printed costs drop.</li>
                        <li>Fixed: the unit search's Search Rules filter now offers Experimental, and it narrows your saved designs by their own rules level too (before, a saved design showed under every choice).</li>
                        <li>Fixed: in the 'Mech creator, changing the rules level after switching editions and then switching back could drop the equipment added in between (an LRM 5 vanished, so its ammunition was not listed).</li>
                        <li>Rules levels fixed: Introductory under Total Warfare, and Level 1 under the <i>BattleTech Master Rules</i> and its Revised Edition, now offer only the technology of 3025 (standard lasers, PPCs, autocannons, machine guns, flamers, LRMs and SRMs, the hatchet, and standard engines, gyros, armor, structure, heat sinks and jump jets). Everything else needs Standard / Level 2.</li>
                        <li>Fixed: the 'Mech creator offered Advanced and Experimental parts at the Standard rules level. Hardened, reactive, laser-reflective, ferro-lamellor and modular armor, XXL and large engines, reinforced and composite structure, compact heat sinks, 'Mech UMUs and super-cooled myomer now need Experimental; laser heat sinks and the Dark Age armors need Advanced (<i>Tactical Operations: Advanced Units &amp; Equipment</i>, <i>Interstellar Operations: Alternate Eras</i>). A design's required rules level now counts these parts too.</li>
                        <li>Aces: the card photo reader knows more of the cards' condition, movement and combat filter wording, thanks to Rekikire's typed card list.</li>
                        <li>Where an SSW file differs from the newest printed record sheet, importing it now gives the printed design too: the Zeus X ZEU-X and ZEU-X2 get their patchwork armor (Record Sheets: Dark Age), and the Skinwalker B gets its Improved Heavy Medium Lasers (Recognition Guide: ilClan 24).</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 2nd, 2026</strong> - Ammunition explosions by edition, Aces fixes, equipment from the Solaris7 forum, and 28 more bundled 'Mechs
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Ammunition explosions now follow the edition you play, for 'Mechs, vehicles, buildings, fighters and small craft: a critical hit rolled on an ammunition bin explodes it, and CASE and CASE II protect as that edition says. Fighters and small craft can also lose ammunition to a failed heat Avoid Roll. ProtoMechs have no ammunition explosion rule: their critical hits never reach ammunition.</li>
                        <li>DropShips in play run at zero net heat, with no Heat Scale or heat Avoid Rolls.</li>
                        <li>Aces: the Initiative roller adds the Command card's Initiative order; printed cards put Support orders on their own line above the Emplacements columns; on phones, icon links wrap and tracker tables scroll sideways.</li>
                        <li>New custom equipment from the Solaris7 forum, each record naming its author and thread, with anything the posts didn't give taken from the nearest canon item. At Custom Homebrew: Captain's Inner Sphere Heavy Laser, the Light Autocannon/10 and /20, the ER Improved Narc Launcher, the Inner Sphere Light Chemical Laser, the Rotary Small Chemical Laser, Small and Medium Laser Arrays, the 'Mech Periscope, Chaff Pod 2.0 and the Modular C3 (sized by how many units it links).</li>
                        <li>At Munchkin, for games that want them: Nightstalker666's and Captain's railguns (Captain's takes one whole side of a 'Mech, side torso and arm), nanotube armor, and Prince's Nuclear Pulse Cannon. Thanks to Captain, Nightstalker666, Prince, Thunder, Lycaon and the late Lonely Coyote.</li>
                        <li>28 more bundled 'Mechs from MegaMek's files, including all 13 QuadVees (Arion, Boreas, Cyllaros, Harpagos and Notos), LAMs, FrankenMechs, and designs with prototype heat sinks, jump jets, endo steel and ferro-fibrous, Interface Cockpits, Robotic Cockpits, Large XXL engines and patchwork armor.</li>
                        <li>New in the 'Mech creator: the Interface Cockpit with No Gyro, the Smart Robotic Control System, prototype double heat sinks and prototype endo steel structure.</li>
                        <li>Where a MegaMek file differs from the newest printed record sheet, importing it now gives the printed design: Shorty Sneede's two Hybrid Riflemen (ForcePack Record Sheets: Snord's Irregulars) and the Temax Cat (XTRO: Boondocks).</li>
                        <li>QuadVees can now use any armor and internal structure a quad can, and their tracks or wheels are now included in weight and cost.</li>
                        <li>Bundled units are now matched to the right Master Unit List entry when two entries share an alternate name: the Ryoken III (Skinwalker) and the Ryoken III-XP each get their own, and 9 battle armor designs, the Procyon and the Condor Heavy Hover Tank are now matched.</li>
                        <li>The Skinwalker E shows its printed Battle Value of 3,107 (Recognition Guide: ilClan 24), where the live Master Unit List still says 3,102.</li>
                        <li>ProtoMech quad melee weapon systems now count the ProtoMech's base Frenzy damage in their Battle Value (Interstellar Operations: Alternate Eras p.190): the Basilisk (Quad) is 258, as printed in The Wars of Reaving.</li>
                        <li>The weekly Master Unit List update.</li>
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
                        <li>Aces card reader: the conditions and movement filters repeat the same few phrases, changing only a number or colour, so each line read from the photo is matched to the nearest printed phrase and only the number or colour is taken from the photo. A line too far from every phrase stays as read for you to correct. Thanks to Rekikire for the idea.</li>
                        <li>Aces card reader: a photo taken at a slant (up to 10 degrees) is straightened before it's read.</li>
                        <li>Aces card reader: the moved check is read across a range of greens, so lighting and camera colour matter less. 1s and 7s in priority numbers are told apart by their shape, card numbers are found in dim footers, and the colour of the Armor lost icon is read. A last line cut off by the photo's edge is filled in with the cards' usual ending and flagged for you to check. Thanks to Rekikire for the test photos.</li>
                        <li>Bundled 'Mechs: 127 'Mechs from MegaMek's files that the Master Unit List doesn't have now come with a record sheet and an entry in the custom unit list, at this app's own Battle Value, worked out by the rules and errata.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>October 28th, 2026</strong> - Read a card from a photo, Not Official marks, and your force in the Aces game
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>For players who find the cards' small print hard to read, the app can read a photo of your own printed card. The reader isn't perfect: it misreads some letters, numbers and icons, so check everything it fills in against your card. The photo never leaves your device, and no card text ships with the app.</li>
                        <li>Alpha Strike Roster: Add from a Card Photo, on the Add Units page. If the Master Unit List lists the unit and agrees with the card, its unit is added. If the card's values differ (an older printing, or a misread), the two show side by side and you choose. A custom, or a unit printed elsewhere, is read into a form to check and add as printed.</li>
                        <li>Aces card library: the card editor reads a photo of either side of a card into the form, to be checked before it can be saved.</li>
                        <li>Alpha Strike cards whose stats aren't from Master Unit List 2.0 say NOT OFFICIAL, on screen and in print: units from MUL 1.0, the custom unit lists, the unit creators, and cards added from a photo as printed. Forces saved before today keep their units' marks by whether they came from the Master Unit List.</li>
                        <li>Aces game: a Your Force Cards section shows your current Alpha Strike roster in play, so you don't need the roster open in another tab, with a Reset your force button that repairs every unit for a new game. Thanks to Rekikire for the idea.</li>
                        <li>Aces cards: the line-of-sight target icons come before "moved", as the cards print them, and sit on their own row under the zone.</li>
                        <li>Aces card reader: the Overheat rows are the same on every card but for four numbers, so the reader now picks out just the numbers and writes the rows from them, leaving far fewer words to correct. Thanks to Rekikire.</li>
                        <li>Aces cards: a tick box for the Missile Boat's "If there are no enemies in line of sight: use the Indirect Fire special order card" line. In the game, when the unit falls back to indirect fire, the card reminds you to use that special order card. The card reader ticks it when it reads the line. Thanks to Rekikire.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 27th, 2026</strong> - Record sheet bubbles in each unit's own shape, 983 bundled Combat Vehicles, and a faster start
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Record sheets: armor and structure bubbles are packed inside each location's own shape. A vehicle's sections are cut from its hull, an aerospace craft's arcs are its wings, nose and tail, and a ProtoMech is drawn as a figure. 'Mech bubbles fill each location from the center out.</li>
                        <li>Superheavy 'Mechs (up to 200 tons) no longer run out of armor or structure bubbles, and a sheet never shows more armor than the rules allow a location. Eight 'Mech bubbles that toggled or showed the wrong point are fixed, and small bubbles draw as rings, not black dots.</li>
                        <li>The app opens faster: the first download is about a tenth of its old size, and unit types load as they're needed.</li>
                        <li>The bundled record sheets behind the Master Unit List search add 983 Combat Vehicles, plus Support Vehicles, Small Craft and DropShips, each matching its Master Unit List Battle Value, or MegaMek's where the Master Unit List gives none. MegaMek vehicles the Master Unit List lacks are in the custom units, credited to MegaMek.</li>
                        <li>Vehicle Battle Value: stealth armor, VTOL jet boosters and superchargers, machine gun arrays, drones, the VTOL mast mount, and support vehicle fire control (heavy weapons only, <i>TechManual</i> p.316).</li>
                        <li>Cockpit Command Console for 'Mechs: 3 tons and a head slot beside the cockpit (<i>Tactical Operations: Advanced Units &amp; Equipment</i> pp.112-113), and it imports from Skunk Werks and MegaMek files.</li>
                        <li>Superheavy and tripod 'Mechs import from MegaMek files, with the superheavy engine Battle Value table, Radical Heat Sinks and the Klondike rocket launchers: 3600 bundled 'Mechs.</li>
                        <li>mordel.net is a third source of 'Mech files, after Skunk Werks and MegaMek, for canon 'Mechs neither has.</li>
                        <li>Canon means listed on the Master Unit List or printed on an official record sheet. The "Custom" standing is now "Fan-made", shown beside the rules level, and both roster searches can filter by standing.</li>
                        <li>Two designs with the same name and model but different gear are kept as separate models, each with its own designation.</li>
                        <li>LRM 15 launchers make 5 heat, not 6, as <i>Total Warfare</i> p.303 prints.</li>
                        <li>Aces cards: the line-of-sight target icons ("in line of sight", "out of line of sight") can be entered and are used in play.</li>
                        <li>Battle Armor and the JumpShip/WarShip creator have their own menu icons.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 26th, 2026</strong> - One game settings block and Special Rulesets, 690 more bundled 'Mechs, IndustrialMech Battle Values, and printing from the roster
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Every Classic unit creator now opens with the same game settings, in one order: Special Rulesets, Edition, Rules Level, Tech Base, Era. Each step offers only what the steps above it allow, and a change moves only the steps below it, so a later choice no longer undoes an earlier one. The old per-creator edition, level, tech and era controls are gone.</li>
                        <li>Each design keeps its own rules level and rulesets. The last level you pick is the default for your next design and for the roster searches.</li>
                        <li>Special Rulesets: optional and homebrew rules that change how the game plays or how units are built, ticked in a pop-up window. Two rulesets that change the same thing cannot both be ticked. For now there is one sample, "The Clans never existed (alternate universe)": no Clan or Mixed tech, and no ProtoMechs. Real rulesets come in through GitHub issues.</li>
                        <li>Clan and Mixed tech start at the Clan Founding Years: there are no Clans in the Star League era any more.</li>
                        <li>The Alpha Strike unit creator opens with Special Rulesets and the Rules Level. Both roster Master Unit List searches have Special Rulesets on top: ticked rulesets trim the Tech, Type and Era lists and the results.</li>
                        <li>Every record sheet, Alpha Strike card and Technical Readout of a unit built under Special Rulesets names them and their source. Alpha Strike cards made from a Classic design carry its rulesets.</li>
                        <li>The printed Alpha Strike card's trademark notice no longer runs off the top of the card.</li>
                        <li>Importing a Solaris Skunk Werks OmniMech now brings in every configuration in the file (Prime, A, B...), not only the base chassis. The base loadout's equipment is fixed; each configuration's is in pods.</li>
                        <li>An OmniMech configuration now keeps its own heat sinks, jump jets, lower arm and hand actuators and Clan CASE, as the published configurations vary them.</li>
                        <li>The bundled designs behind the Master Unit List search now include 84 OmniMechs with their configurations, and 602 'Mechs that Skunk Werks has no file for, converted from MegaMek's files. Each one matches its Master Unit List Battle Value.</li>
                        <li>IndustrialMechs imported from MegaMek's files keep their Advanced Fire Control. MegaMek gives such a 'Mech a BattleMech cockpit, which had been read as a plain Industrial cockpit, so their Battle Value came out about 4% low. The Guard, Gulon, Inquisitor II, Reptar and others now match the Master Unit List and are among the bundled designs.</li>
                        <li>Vehicular Mine Dispensers count 8 Battle Value each, and Space Mine Dispensers 10: the value of a 10-point minefield of their mines (<i>Tactical Operations: Advanced Units &amp; Equipment</i> pp.195, 197).</li>
                        <li>The Master Unit List search shows a corrected Battle Value for eight IndustrialMechs whose MUL figure is out of date or departs from <i>TechManual</i>: the Jabberwocky JAW-65A, JAW-66B and JAW-66D, the Quasit QUA-51M and QUA-51P, the Diomede D-M3D-3 and D-M3D-4 and the Patron PTN-1, each with its source. Nail and rivet gun ammunition counts 0 (<i>TechManual</i> p.317), and commercial armor half (p.315).</li>
                        <li>Classic Roster: the Skunk Werks list in the Add dialog has a TRO button, as the Master Unit List search does, and so does the list of your saved 'Mechs.</li>
                        <li>Classic and Alpha Strike Rosters: viewing a record sheet, card or TRO now offers Print, which prints only what is shown. Clicking a 'Mech's record sheet beside its TRO shows the sheet at full width; click again to bring the TRO back.</li>
                        <li>The BattleTech logo on a printed TRO is now drawn in black and gray, as on the record sheets; it had been pale yellow on white.</li>
                        <li>Alpha Strike Roster: the Master Unit List search lists units as soon as it opens, with no filters set; it had shown none until a filter changed.</li>
                        <li>The eight sample VTOLAMs are in the custom units, as the ArtVees are: both roster searches find them when "Custom units" is ticked, each with its designer's credit, and the Classic Roster adds the sample design.</li>
                        <li>A 'Mech's Alpha Strike card shows minimal damage as 0*, not 0. Its LRM, SRM and AC specials need 10 or more points of damage at medium range, as the Master Unit List's do; minimal indirect fire is IF0*, and a special with no damage is left off, where the card had shown IF 0, SRM 0/0/0 or HEAT 0/0/0.</li>
                        <li>Classic Roster: one Find Units list replaces the separate Master Unit List search and Skunk Werks import. It holds the Master Unit List and every design off it (your saved designs, the samples and the bundled designs), with a Source column, and lists a design with the same name, model and layout once.</li>
                        <li>A standing badge (canon, apocryphal, custom, munchkin) beside each unit in both roster searches, with a legend.</li>
                        <li>In the Clan Founding Years (2800-2840) a Clan 'Mech picks Clan or Star League structure, armor and heat sinks, which that era offers both of; Mixed Tech 'Mechs get the same choice wherever the versions differ. Clan vehicles may take Star League Ferro-Fibrous armor, and Clan fighters, Small Craft and DropShips Inner Sphere Ferro-Aluminum, in the years before the Clan versions.</li>
                        <li>A battle armor bay on a Small Craft or DropShip starts with a door, and is flagged if it has none to share (<i>TechManual</i> p.196).</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 25th, 2026</strong> - Primitive Small Craft and DropShips, and the VTOLAM
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>The Small Craft and DropShip creator builds Primitive craft (<i>Interstellar Operations: Alternate Eras</i> pp.119-121), by year of introduction from 2100 to 2499: engine, controls and fuel by year, the Primitive DropShip weight limits and free heat sinks, armor at 0.66, single heat sinks only, and a RetroTech note on later equipment. DropShips choose their K-F boom: standard, prototype or none. MegaMek Primitive craft files import as Primitive, with their boom.</li>
                        <li>The fighter, Small Craft and capital ship creators show heat as, for example, "20 dissipated of 34 generated".</li>
                        <li>The Merlin, the 60-ton droid the <i>Battledroids</i> rulebook builds as its construction example (pp.23-25), can be picked with the book's ten. The text prints the head's armor as 0 and each arm's as 28, which come to 199 instead of 192; the sheet beside it shows 9 and 20, which match, so those are used.</li>
                        <li>The VTOLAM, a LAM whose second mode is a VTOL, at the Custom Homebrew rules level, under two fan rule sets. BishopSteiner's (DeviantArt): conversion equipment 20% of tonnage, at most 30 tons, no jump jets needed, landing skids in the side torsos, and VTOL movement from the engine; with his Locust VTOLAM as a sample. professorheyteen's (<i>Battletech Into The Future</i>): 10% conversion equipment, at most 35 tons, any 'Mech equipment, and VTOL movement equal to the Jump MP; with all seven of his designs as samples (Locust for Hell's Horses and the LCAF, Firefly, Icestorm, Flea, Spider and Valkyrie), each at its published Battle Value. Pick the LAM type in the 'Mech Creator's step 1; in Play Mode a VTOLAM switches between 'Mech and VTOL.</li>
                        <li>A Custom Homebrew infantry weapon: the Ceres Arms Léitíng-23 heavy combat carbine, from is-the-battlemech-cool-or-not's Tumblr. Its <i>A Time of War</i> stats are converted by the <i>A Time of War Companion</i>'s rules (pp.169-171): damage 0.28, range 0, Battle Value 0.26, from 3100. Infantry platoons, battle armor anti-personnel mounts, buildings and Support Vehicles offer it only at the Custom Homebrew rules level.</li>
                        <li>Alpha Strike Roster: "Quickly add a ForcePack" now adds every unit in the pack. Most packs had been adding only some of their units, or none, because units were matched without their variant. Packs can now be added offline too, and the list has every opposing force from the <i>Aces: Scouring Sands</i> campaign book: two training forces and 21 sorties, each unit at the book's skill.</li>
                        <li>'Mech Creator: <i>Battledroids</i> droids now print on the book's own droid record sheet: armor and internal structure as boxes in the droid's shape, the DroidWarrior's name, skills and hits, heat sinks, ammunition, the Critical Hit Chart and the Heat Scale. Play mode keeps the sheet with the trackers.</li>
                        <li>'Mech Creator: BattleMech Turrets (<i>Tactical Operations: Advanced Units &amp; Equipment</i>): shoulder, head and quad turrets, with a Turret column on the equipment step to mark what each carries. The turret weighs 10% of what it carries, Battle Value counts its weapons in the right firing arc, and the record sheet marks them. SSW files with turrets now import with them, so designs such as the Quickdraw QKD-8X and Uraeus UAE-7R match their Battle Values.</li>
                        <li>Custom Homebrew: the Improved 'Mech Taser (iTaser) and EMP Missiles for every non-Streak Inner Sphere missile launcher, police equipment by VoiceOfAN from <i>Battletech Into The Future</i>. Pick the Custom Homebrew rules level to use them.</li>
                        <li>2,859 'Mechs converted from the Solaris Skunk Werks files, up from about 500, each checked against the Battle Value on the Master Unit List (or in the file, where the MUL has none). The Classic Roster's Master Unit List search now finds a record sheet, TRO and Add button for each of them, and the 'Mech Creator's import list has them all, every rules level, a page at a time. They load only when a list needs them, so the app no longer imports 500 'Mechs at every launch. OmniMechs come later, once the Skunk Werks import reads their configurations.</li>
                        <li>917 more record sheets in the Classic Roster's Master Unit List search: 820 battle armor squads, 62 ProtoMechs, 30 Small Craft and DropShips and 5 Support Vehicles, converted from MegaMek's unit files (MegaMek Data by The MegaMek Team, CC BY-NC-SA 4.0). Each one's Battle Value matches the Master Unit List's. The rest are left out until their import or Battle Value is right.</li>
                        <li>Battle armor carrying an assault rifle in an anti-personnel mount no longer counts the rifle in its Battle Value, as the Master Unit List values them. That brings 181 more suits into line with it, among them the Achileus and the Elemental.</li>
                        <li>Saved IndustrialMechs keep their industrial armor (such as Commercial) when loaded again. They had been reloading with Standard armor, which changed their Battle Value and cost.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 24th, 2026</strong> - Skunk Werks imports, Battle Value and DropShip ammunition
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Skunk Werks imports: designs place every item where the file puts it (unplaced slots on the bundled designs down from 1,253), every canon item on them imports, the Torso-Mounted Cockpit can be built and imported, and files with a broken image attribute (the Summoner and Puma) load. A design that uses a draft item whose stats are not all entered says so on every creator step and on the saved list.</li>
                        <li>Battle Value now matches Skunk Werks' BV2 on 2,881 of its 2,934 BattleMechs, up from 2,285, and on its IndustrialMech and Primitive designs, among them split weapons, CASE with XL engines, Artemis on improved launchers, forward and rear weapons, and prototype improved jump jets.</li>
                        <li>DropShip ammunition sits in its weapons' bays and counts at the rate of the launchers in its bay and arc (<i>TechManual</i> p.311). MegaMek DropShip files import their internal weapon names, Artemis on MMLs, PPC Capacitors, Clan, MML, ATM, HAG and primitive rounds, bay quirks, Obsolete years and Narc pods. MML ammunition reads its shots at its own round's rate, Clan AMS fires 24 shots a ton, cruise missiles count their heat on aerospace units, and ammunition on fighters, Small Craft, DropShips and vehicles caps at its weapons' Battle Value.</li>
                        <li>Master Unit List: DropShip, Small Craft and capital ship Alpha Strike cards get a back with their damage by firing arc, read off all 437 MUL card backs, and their own unit type (they were taken for aerospace fighters). Records from the new MUL get their armor threshold, rules level, TRO and image.</li>
                        <li>Behind the scenes: every equipment catalog shares one record core and one registry, with each record's editions, tech base and Clan dates, so Clan units use the Clan dates everywhere and a mixed-tech fighter or Small Craft takes a production window over a prototype. The pre-<i>Total Warfare</i> expansions count as editions on one dated timeline, and every catalog was checked against MegaMek's 3,830 official items.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 23rd, 2026</strong> - Bug fixes, and the Classic Roster MUL search for every unit type
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Each 'Mech's engine, armor, gyro, structure, heat sink, cockpit, myomer and jump jet lists show that 'Mech's own era availability; opening another 'Mech no longer changes them, or whether a design reads as Anachronistic.</li>
                        <li>Vehicles above engine rating 400 follow the large engine's own dates, as 'Mechs do: no Large Fusion before its 2630 prototype, and the Inner Sphere Large XL is out of reach between its loss in 2822 and its recovery in 3054.</li>
                        <li>Faster: importing a Small Craft or DropShip <i>.blk</i> file takes a fraction of a second instead of 5 to 15, every change in the Small Craft, fighter and capital ship creators is quicker on designs with Artemis launchers, and restoring a backup full of saved vehicles takes under a second.</li>
                        <li>The 'Mech Creator's Alpha Strike Role is a drop-down of the published ground roles instead of a text box.</li>
                        <li>The Classic BattleTech roster page's issue link goes to the current project instead of Jeff's original one.</li>
                        <li>The 'Mech sheet's "Created with" footer is on three lines, so a long site name no longer runs into the trademark notices.</li>
                        <li>Alpha Strike roster: each ForcePack's name and members wrap in their own column beside the add button.</li>
                        <li>The 'Mech Creator's Skunk Werks imports page describes the importer as it is now and explains the green check.</li>
                        <li>Classic BattleTech roster: the 2022 "In Development" banner is replaced with a description of what the roster does now, the page is titled as the Classic BattleTech roster, a one-unit favorite says "One Unit", and the printed force's tech is no longer "Mixed" because of an empty group or a group of <i>Battledroids</i> units.</li>
                        <li>Tripod 'Mechs have a proper record sheet: the armor, internal structure and damage transfer diagrams draw a Center Leg between the legs, with a bubble for every point of its armor and structure (a 100-ton Tripod's 42 Center Leg armor no longer stops at 30), and the 'Mech Creator's armor step shows the same Tripod. The Center Torso label closes its bracket again.</li>
                        <li>The structure record sheet prints all of a building's fittings: sealing, superstructure, ceilings, doors, elevators and storage past the first two lines are no longer cut off, and a long list carries on to a second page.</li>
                        <li>Anti-orbital Long Tom rounds now do 5 points of standard-scale damage instead of 2 capital, after a suggestion from Vehrec on the Star League Discord: the round is mostly propellant, made to buffet landing DropShips. Against capital armor, standard damage is totaled, divided by 10 and rounded normally.</li>
                        <li>Rules editions: the <i>BattleTech Manual</i>, both <i>Compendiums</i> and both <i>Master Rules</i> give the Internal Combustion Engine to vehicles and buildings only, so the 'Mech Creator offers it under them only at the Custom Homebrew level, an ICE 'Mech built to them is Custom Homebrew, and switching an ICE 'Mech to one of them lists the engine. From <i>Total Warfare</i> on, an ICE BattleMech is still Experimental.</li>
                        <li>Rules editions: under <i>Battledroids</i>, the second edition and the <i>BattleTech Manual</i>, each torso's front and rear armor has its own maximum of twice that location's structure, as those books print it. From the <i>BattleTech Compendium</i> on, front and rear share one maximum.</li>
                        <li>Classic Roster Master Unit List search, an idea from Camille, Centrella-Sworn on the Star League Discord: in a group's Add dialog, search the MUL by name, era, factions, tech, role and rules level at once, and add the 'Mech design that matches (your saved one first, else the bundled Skunk Werks one).</li>
                        <li>Both roster searches now take the unit lists as checkboxes, so the live MUL, the MUL 1.0 leftovers and custom units can be searched in any mix. The sample ArtVees are in the custom list, and their Alpha Strike cards now print IF0* and drop an empty REAR as the MUL does.</li>
                        <li>Alpha Strike Point Values follow the <i>Alpha Strike Companion</i> errata v1.6 for every ground unit, in the 'Mech conversion and the Alpha Strike creator alike, and a jumper is priced on its jump. A card's "IF 0*" no longer prints as "IFNaN".</li>
                        <li>Alternate munitions keep their standard round's Battle Value: IS LB 5-X cluster, Copperhead, Arrow IV homing and 22 more.</li>
                        <li>Restoring a backup keeps its favorite groups after the page reloads, and the Alpha Strike favorites are capped like the Classic ones.</li>
                        <li>Classic roster: both force total lines count every unit type and show the tonnage.</li>
                        <li>'Mech placement follows the rules for physical weapons (hatchets, swords, maces, vibroblades and claws need their actuators and go in the arms), spread equipment (stealth systems, Chameleon, partial wings, tracks), AES and the stealth system conflicts. Saved designs that break them are flagged.</li>
                        <li>The Classic Roster's Master Unit List search now finds vehicles, fighters, infantry, battle armor and ProtoMechs as well as 'Mechs, and adds each to its own table in the group. Every group table has a Search MUL button, the bundled ArtVee designs are found too, and each result has View (its record sheet) and TRO buttons beside Add.</li>
                        <li>Vehicles, fighters, infantry, battle armor and ProtoMechs now keep a Technical Readout in their saves, ready for each creator's own TRO step.</li>
                        <li>The Vehicle Creator has its Technical Readout step: Step 5, between Place Equipment and Summary. Enter the manufacturer, the makes of the chassis, engine, armor and each weapon, and the history text, then print the modern-style TRO sheet from that step or from the Summary.</li>
                        <li>The Fighter Creator has its Technical Readout step too: Step 4, between Weapons and Equipment and Summary, with the same printable TRO sheet.</li>
                        <li>The Infantry Creator has its Technical Readout step: Step 3, between Platoon Weaponry and Summary, with the same printable TRO sheet.</li>
                        <li>The Battle Armor Creator has its Technical Readout step: Step 6, after Loadouts and before Summary, with the same printable TRO sheet. Importing a MegaMek battle armor file now brings its manufacturer, factory, component makes and history text across too.</li>
                        <li>The ProtoMech Creator has its Technical Readout step: Step 6, between Weapons and Equipment and Summary, with the same printable TRO sheet. Importing a MegaMek ProtoMech file brings its TRO fields across too. The sheet now gives a ProtoMech's mass in tons (it printed the kilogram total as tons).</li>
                        <li>The vehicle TRO sheet's construction table now lists every ton, the way the printed TROs do: control systems, lift equipment, turrets, heat sinks, movement, armor factor, internal structure and armor by location, and ammunition, with locations by name.</li>
                        <li>The fighter TRO sheet's construction table does the same: engine with Safe and Maximum Thrust, structural integrity, cockpit, fuel, heat sinks, armor by arc and ammunition, adding up to the fighter's tonnage.</li>
                        <li>The infantry TRO sheet's table now gives transport weight, tech base, movement, formation, platoon make-up, armor kit and damage divisor, anti-'Mech training and special features, with each weapon's trooper count.</li>
                        <li>The Small Craft Creator has its Technical Readout step: Step 7, between Crew, Quarters and Bays and Summary, with the same printable TRO sheet. Its table lists every ton: engine with Safe and Maximum Thrust, structural integrity, fuel, heat sinks, quarters and bays, armor by side and the weapons by arc, capital weapons included for DropShips. Importing a MegaMek Small Craft or DropShip file brings its TRO fields across too.</li>
                        <li>The Classic Roster's Master Unit List search now finds Small Craft and DropShips too: the Small Craft table has its own Search MUL button, and each result has View, TRO and Add, landing in the group's Small Craft table. Before, the MUL's Small Craft and DropShips were taken for fighters and sent to the Fighter Creator.</li>
                        <li>The Master Unit List search now tells JumpShips, WarShips and space stations from Small Craft and DropShips: they match the vessels you saved in the JumpShip and WarShip Creator and go into the group's capital ship table, which has its own Search MUL button. One you have not built links to that creator, not the Small Craft Creator. Capital ships have no TRO button yet; their Technical Readout step comes next.</li>
                        <li>The JumpShip and WarShip Creator has its Technical Readout step: Step 7, between Crew, Quarters, Bays and Collars and Summary, with the same printable TRO sheet. Its table lists every ton: structural integrity, engine with Safe and Maximum Thrust (or the station-keeping drive), fuel, K-F drive and jump sail, controls, heat sinks, docking collars, grav decks, quarters and bays, armor by facing with the free armor counted, and the weapons by arc, capital weapons included. The vessel's K-F drive gets a make of its own. The Master Unit List search now has a TRO button for capital ships too.</li>
                        <li>Behind the scenes: every creator's Technical Readout step and printed TRO sheet are now one shared page instead of a copy per creator, so a fix to one reaches them all.</li>
                        <li>The Building Creator has its Technical Readout step: Step 4, between Weapons, Power and Equipment and Summary, with the same printable TRO sheet. Its table gives the superstructure and Construction Factor, size, weight capacity and modifications, then every ton of the load, with each weapon's hex.</li>
                        <li>Building Creator Summary: the total weight now matches the weight lines above it; a generator spread over several hexes could add a few kilograms of rounding (31.002 tons for a 31-ton generator).</li>
                        <li>Behind the scenes: the step menus beside every creator are now one shared menu instead of nine copies.</li>
                        <li><i>Battledroids</i> droids, the book's and your own Expert designs, have the same Technical Readout step and printed TRO sheet as any 'Mech (Step 7 of the 'Mech Creator). The 1984 and 1985 Engine Tables name a maker for every rating, so a droid's power plant reads as that maker until you enter another: the Merlin's 240 is a Pitban, the Griffin's 275 a CoreTek. The same holds for designs built under <i>BattleTech, Second Edition</i>.</li>
                        <li>Importing a MegaMek Support Vehicle file (ground, VTOL or Fixed-Wing) now brings its Technical Readout across too: manufacturer, factory, the makes of chassis, engine, armor, communications and targeting systems, and the overview, capabilities, deployment, history and notes text.</li>
                        <li>The Engine Table makers now cover designs built under <i>The BattleTech Manual</i>, <i>The BattleTech Compendium</i>, <i>BattleTech, Third Edition</i>, <i>The Rules of Warfare</i> and <i>BattleTech, Fourth Edition</i>: those books print one table of their own, which differs from the 1984 one at ratings 125 to 155 (a 130 is a Magna rather than a Vlar). The <i>Master Rules</i> tables give tonnages only, so designs under them get no default maker.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 22nd, 2026</strong> - Beta feedback and new record sheets for vehicles, fighters, Small Craft, DropShips, capital ships, battle armor, infantry, ProtoMechs, buildings, airships, satellites and <i>Battledroids</i> units
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <p>New on the <a href="https://ngcfells.github.io/battletech-tools" target="_blank" rel="noopener noreferrer">beta test site</a> and offered to upstream</p>
                      <ul>
                        <li>Light and Clan XL engines survive the loss of a side torso; only the Inner Sphere XL and XXL engines are lost with one.</li>
                        <li>Battle Value counts prototype CASE as CASE, and Clan artillery (Long Tom 560, Sniper 96, Thumper 48) uses its own Battle Value on every unit that can mount it: 'Mechs, vehicles, fighters, Small Craft, DropShips and capital ships.</li>
                        <li>LRM launchers do 3 aerospace damage for every 5 missiles (LRM 20: 12), Inner Sphere and Clan, and the Clan Rotary ACs have the same aerospace heat as the Inner Sphere ones.</li>
                        <li>On the 'Mech sheet, a weapon with no medium or long range bracket (the Nail and Rivet Guns) prints a dash instead of 0.</li>
                        <li>Alpha Strike: heat only ever lowers a unit's damage, so two LRM 5s no longer show 5 short-range damage.</li>
                        <li>Importing a design no longer keeps the previous design's quirks.</li>
                        <li>Every builder asks for the era first, and the era decides which tech bases you can pick. The Clan tech base starts with the Clan Founding Years, not the Star League.</li>
                        <li>The equipment list shows only ammunition for the weapons you have mounted; tick "Show all ammunition" to see the rest. Ammunition sorts by weapon in every list.</li>
                        <li>A tonnage bar stays on screen while you add equipment, and turns red when you are over.</li>
                        <li>The 'Mech Creator has an optional Step 7, Technical Readout: who made the design and its engine, armor and each weapon (a weapon type can be marked mixed, with a make per copy), plus the Overview, Capabilities and other TRO text. Print it as a TRO sheet. The SSW importer now keeps these fields, and they are saved with the design.</li>
                        <li>Sponsons are placement choices: you decide which weapons go in them.</li>
                        <li>Vehicle ammunition goes in the Body, and the vehicle armor diagram has a top-down outline for each motive type.</li>
                        <li>Warnings and small print are larger and easier to read.</li>
                        <li>The vehicle record sheet is now one full page with every table the official sheets print: hit locations, motive system damage and critical hits, plus the VTOL elevation track, the submarine depth track and the super-heavy, Large Support Vehicle and Large Naval Vessel tables.</li>
                        <li>The fighter record sheet is one full page too: external stores boxes for your bombs, the armor diagram, critical damage, pilot data, the velocity record and the heat scale, or, for conventional fighters, the ground map straight movement and fighter return tables.</li>
                        <li>The 'Mech sheet's heat scale now runs from 30 at the top down to 0, with an Overflow box, as on the official sheet.</li>
                        <li>Small Craft and DropShips get full-page sheets for aerodyne and spheroid shapes. The Small Craft sheet adds a crew and cargo box; the DropShip sheet lists weapons by bay with their combined heat and damage, carried fighters and Small Craft with their launch rate, crew data, the K-F boom and docking collar, and heat generated per arc.</li>
                        <li>JumpShips, WarShips and space stations get full-page sheets laid out like the Strategic Operations ones: weapon bays in capital scale with standard scale in parentheses, each facing's armor in squares with its damage threshold, structural integrity, K-F drive, sail and docking collars in the hull, crew data, critical damage, heat generated per arc and the velocity record. Damage marked in play is filled in on the roster's printout.</li>
                        <li>The battle armor sheet holds five squads to a page, as the Total Warfare one does, with the leg attack, swarm attack, swarm attack modifier, swarm hit location and transport position tables beside them. The roster prints its battle armor five squads to a page, and the creator prints a design with its alternate loadouts.</li>
                        <li>The conventional infantry sheet holds four platoons to a page: thirty numbered troopers with the damage the platoon does under each, the range modifiers out to its reach, and its movement, armor and skills. Troopers it does not have and ranges it cannot reach are blacked out. An oversized platoon gets a block for each sub-platoon. Below them are the leg attack, swarm attack, swarm attack modifier, non-infantry weapon damage and burst-fire damage tables.</li>
                        <li>The ProtoMech sheet holds a Point of five to a page: each block has the weapons inventory, pilot data with the consciousness track, the hit location table with its critical hit boxes and an armor diagram. The torso weapon roll names your torso weapons, and quads and Gliders get their own hit tables.</li>
                        <li>Buildings print on a Structure Record Sheet like the Tactical Operations one: structure data, the weapons inventory, a line for every hex with its Construction Factor, armor and what entering it costs, crew data and a numbered map to mark the footprint on, level by level. Beside the map are the building critical hits table and the building's Damage Threshold and damage figures. Long walls run on to continuation pages.</li>
                        <li>Airships and satellites get their own sheets, laid out like the Total Warfare Airship and Tactical Operations Satellite ones: craft data and weapons, the armor diagram, crew data, and critical damage with the thrusters. An airship's sheet adds the velocity record and the Airship Velocity Table, which gives the Thrust Points for each turn of the four-turn cycle. Fixed-wing Support Vehicles stay on the conventional fighter sheet.</li>
                        <li>The <i>Battledroids</i> tanks, jeeps and infantry squads print two to a page, in the style of the book's droid record sheet: an armor diagram or damage boxes, the unit's data and weapons, and the rules the book gives it. Beside them are the To-Hit Number, movement, terrain and target modifiers, the Tank Hit Locations, the Missile Hit Table and the tank firing arc. Missile launchers show their damage per missile.</li>
                        <li>Anti-orbital Long Tom ammunition, a Custom round requested on the Star League Discord by SmilingNid: it fires surface-to-orbit under the Strategic Operations rules for 5 points of damage, 3 shots a ton. The Federated Suns built it after Edo, with a prototype in 3055 and production from 3062.</li>
                        <li>The Hailstorm, the towed artillery piece from the <i>MechWarrior 5</i> games, at the Apocryphal rules level: 35 points out to 12 mapsheets, with the rounds the other tubes fire. It mounts only on a Support Vehicle trailer.</li>
                        <li>For games with space forces, a space turn tracker in Play Mode: tick "Space forces in this game" on the roster page. It counts the space turn (6 ground turns each), tracks each anti-orbital Long Tom shot from firing to the space phase, and reminds you of the rolls for firing early and for resolving each shot.</li>
                        <li>The ArtVee (Artillery Vehicle), a Custom Homebrew tracked tank that transforms the way a LAM does, an idea put forward on the Star League Discord by kris (helvedes heste). Some powers call it a MAP (Mobile Artillery Platform). In Vehicle Mode it moves and fires an autocannon; in Siege Mode it stands still and fires real artillery. Both come from one ComboGun: a Thumper, Sniper or Long Tom tube with a drop-in AC/5, AC/10 or AC/20 breech. Build one in the Combat Vehicle creator at the Custom Homebrew rules level: tracked, with an XL or XXL engine, at least 4/6 movement (3/5 with a Long Tom), the ComboGun in a turret, and the Armored Motive System recommended. It has one blended Battle Value, as LAMs do, and its record sheet and single Alpha Strike card show both modes. In Play Mode a transformation is declared before the unit moves and is its only action that turn. The Star League built them from 2700 and the Inner Sphere lost them in the Succession Wars; the Clans kept theirs, and the Free Worlds League brought them back in 3071. Nine sample designs ship with the app: a Star League, a Clan and an Inner Sphere MAP pattern of each.</li>
                        <li>The Armored Motive System, Experimental technology from <i>Tactical Operations: Advanced Units &amp; Equipment</i>, for Combat Vehicles with tracked, wheeled, hover, hydrofoil, naval or WiGE motive: −2 on Motive System Damage rolls. And two smoke devices from <i>Future Wars</i> #32, the Smoker and the Buckler Smoke Dispenser, as Custom equipment.</li>
                        <li>Design quirks in play: tick "Use design quirks" on either roster page (it is off by default, and saved with the force). In Classic play a unit's quirks change its to-hit numbers (an Accurate Weapon, Improved Targeting in its range band), a Combat Computer cuts the heat it builds up, and the side's best Initiative quirk shows in the header. Each unit lists its quirks and what they do, including the ones you apply at the table. In Alpha Strike, units made from a design carry the quirks the Alpha Strike Companion lists, and their to-hit numbers change with them.</li>
                        <li>More quirks in play: a Game year on either roster (blank uses each unit's era start), so a quirk that has ended or not yet begun by then does not apply; an Airborne box on each target for Anti-Aircraft Targeting; cooling jacket quirks change a fired weapon's heat; Barrel Fist counts only for its own arm's punches; and a wrecked or engine-hit 'Mech drops out of its side's Initiative quirk. Improved Cooling Jacket can only go on a weapon or bay that makes heat. The <i>Campaign Operations</i> errata deletes No Torso Twist, so it stays for the designs that have it at the Apocryphal level, and Weak Legs follows the errata.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 17th, 2026</strong> - Enhanced LRTs and the Light Blazer
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li>Enhanced Long Range Torpedo launchers (5, 10, 15 and 20) with their ammunition, built like the Enhanced LRMs with the torpedo rules.</li>
                        <li>The Light Blazer from <i>BattleTech Gothic</i>, at the Apocryphal rules level; its weight and slots are provisional.</li>
                        <li>Interstellar Operations citations now point to the <i>Alternate Eras</i> pages.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>October 16th, 2026</strong> - JumpShips, WarShips and <i>Battledroids</i>
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <p>New on the <a href="https://ngcfells.github.io/battletech-tools" target="_blank" rel="noopener noreferrer">beta test site</a>, and offered to the main site for review:</p>
                      <ul>
                        <li>JumpShips, WarShips and space stations: a creator, Battle Value, record sheet, Alpha Strike card and play in the Classic Roster. Every unit type can now be built and played.</li>
                        <li>Each rules edition has its own rules levels. <i>Battledroids</i> has Basic, Advanced and Expert; below Expert you pick from the droids the books print: the box set's ten, the Spider and the 1984 TCI kit backs.</li>
                        <li><i>Battledroids</i> designs show only what that rulebook has, and undoing an edition switch brings back the design you had.</li>
                        <li>Every creator offers to save your design before a load, import or start over replaces it.</li>
                        <li>'Mech record sheets draw shields beside the arm, with Damage Capacity and Damage Absorption to mark off in play.</li>
                      </ul>
                   </li>
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
