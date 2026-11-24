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
              <div className="alert alert-info" role="region" aria-label="Mordel.net connection">
                <h2>New: bring your Mordel.net designs into the tools</h2>
                <p>
                  Add your free <a href="https://mordel.net" target="_blank" rel="noopener noreferrer">Mordel.net</a> API key once
                  and pull units straight from Mordel.net, your own private designs included, into your rosters and the 'Mech Creator.
                </p>
                <ol>
                  <li><strong>Get a key.</strong> Sign in on <a href="https://mordel.net" target="_blank" rel="noopener noreferrer">mordel.net</a> and request an API key on your account page. It starts with <code>mn_</code>.</li>
                  <li><strong>Put it in Settings.</strong> Open <Link to="settings">Settings</Link>, find the <em>Mordel.net</em> box, paste the key into <em>API key</em> and press <em>Save key</em>. The tools check it with Mordel.net and tell you if it was accepted. <em>Test key</em> checks it again any time.</li>
                  <li><strong>Use it.</strong> In the <Link to="classic-battletech/mech-creator/imports">'Mech Creator imports</Link> pick <em>Start From a mordel.net 'Mech</em>; the Classic and Alpha Strike rosters have the same Mordel.net units list in their Add dialogs. <em>My Mordel designs</em> lists your own, or paste a unit link or a type and id such as <code>bm/23454</code>.</li>
                </ol>
                <p>
                  <strong>Where your key lives.</strong> Only in this browser, on this device, in the site's local storage. It goes only to
                  Mordel.net, in a request header (never in a web address), and it is never sent to us or anyone else. It is left out of
                  backups and settings exports, and the page shows only dots and the last four characters. Another device or browser needs the
                  key added again. <em>Remove key</em> in Settings deletes it and the unit details pulled with it from this device. If you
                  revoke the key on Mordel.net, the tools tell you it was refused and ask for a new one.
                </p>
              </div>
            </div>
          </div>
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
                        <li>Search the <a href="https://masterunitlist.battletech.com/" target="_blank" rel="noopener noreferrer">Master Unit List (MUL)</a> and add units to your Companies, Lances, Stars and Binaries. A copy is bundled with the app and kept current every week, so search works offline.</li>
                        <li>Filter by rules, tech, type, era, role, faction and special ability, and tick which unit lists to search: the live MUL, the MUL 1.0 leftovers and custom units such as the VTOLAMs.</li>
                        <li>Add a unit from a photo of its printed card, or a 'Mech you built in the 'Mech Creator.</li>
                        <li>Your forces are stored on your device. Print them, or play with a live stack of cards: damage and heat change the card at once, and to-hit rolls update on the fly.</li>
                      </ul>
                      <br />
                      <h3>Advanced Search Terms</h3>
                      <ul>
                        <li><b>a:&lt;ability&gt;</b> - Search for abilities. Use <b>,</b> for AND (a:ECM,TAG), <b>!</b> for NOT (a:!CASE)</li>
                        <li><b>pv:30-50</b> - Point value ranges, or the &gt;, &lt;, &gt;=, &lt;= and = operators (pv&gt;=40)</li>
                        <li><b>short&gt;=x, medium&gt;=x, long&gt;=x</b> - Damage at each range, with the same operators, or as ranges (short:2-3)</li>
                        <li><b>role:striker, tech:clan</b> - Role and tech base, as the Role and Tech filters do (role:firesupport, tech:is)</li>
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
                        <li><i>role:sniper tech:clan long:3-9</i> - Clan snipers with long damage 3 to 9</li>
                        <li><i>defense&gt;12 short&gt;=3 mv&lt;8</i> - Slow durable brawlers</li>
                        <li><i>year:3050-3067 a:!CASE</i> - Units introduced 3050-3067 without CASE</li>
                        <li><i>dmg:3/3/* armor:4-6</i> - Units with 3/3/any damage and 4-6 armor</li>
                      </ul>
                      A word:value term the search does not know is left out, and the search box says so.
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
                          <p>Combat Vehicles of every motive type, OmniVehicles and Support Vehicles (chassis modifications, BAR and tech ratings, light and medium weapons), with turrets, transport bays, Patchwork Armor, Fractional Accounting and MegaMek (.blk) import.</p>
                        </li>
                        <li>
                          <h4><Link to="classic-battletech/fighter-creator">Fighter Creator</Link></h4>
                          <p>Aerospace and conventional fighters, OmniFighters, bombs and external stores, and Support Vehicle aircraft: airships, fixed-wing and satellites, with MegaMek (.blk) import for fighters and fixed-wing.</p>
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
                          <li>Unit Types: Micro-Mechs, Walkers, Power Armor, VTOLAMs and Permanent Air 'Mechs, each with its history, its rules and pages for its sample designs.</li>
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
                      <h3><Link to="game-management/campaigns">Campaigns</Link></h3>
                      <ul>
                        <li>Keeps a campaign's sides, ledgers, log, force snapshots and campaign planet, with Future Wars Economics and two mercenary editions inspired by the Mercenary's Handbooks.</li>
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
                      <strong>November 23rd, 2026</strong> - Community content update, conventional infantry and Maximum Tech
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Combat Vehicle Battle Value and cost, step by step (issues #599 and #600).</strong> The Vehicle Creator's summary now shows the Battle Value and the C-Bill cost as cited steps, each with its page, under a switch between rules editions: BV2 from TechManual pp.307-308 (the Hephaestus works out to 777 as the book prints), BV1 from the BattleTech Master Rules (1998, pp.141-142 with the FanPro errata) and the Revised Edition (pp.154-155) with Maximum Tech's Level 3 rules, and the cost from TechManual p.279 or, under the Master Rules editions, their Vehicle Costs Tables (BMR p.137, BMR(R) p.150). The roster search viewer has the same breakdown for a bundled vehicle, with the Master Unit List BV beside ours. A turret weapon is in no arc and counts in full, as the current TechManual says; the 3rd and 4th printings treated it as facing forward, and a design can pick that printing (Apocryphal). Cost fixes: ammunition is no longer part of a vehicle's cost (TechManual p.282; the cost shows a loaded cost beside it), a Clan chassis is billed 50,000 for each location that stores ammunition or explosives (TechManual pp.210, 292), superchargers and VTOL jet boosters cost 10,000 times the engine rating (Tactical Operations: Advanced Units &amp; Equipment p.223), and the Clan LRM launchers with Artemis IV cost the launcher plus 100,000 (TechManual p.291). Bundled Combat Vehicle costs were rebuilt (850 lower, 76 higher); no Battle Value changed.</li>
                        <li><strong>Aerospace leftovers (issues #137, #145, #148, #149, #150 and #152).</strong> The fighter play panel tracks altitude, velocity and thrust spent on the low-altitude map, applies the velocity loss, climb and descent costs, the stall and the Control Roll triggers, and works out the to-hit of strike, strafing, dive-bombing and altitude-bombing attacks, each under the rules of the book you pick: AeroTech (1986), BattleSpace (1993), AeroTech 2, AeroTech 2 Revised or Total Warfare (the BattleSpace strafing number is cut off by the scan of the book, so it shows as unresolved rather than guessed). The Booby Trap (Tactical Operations: AUE p.109) joins fighters, Small Craft and DropShips, space minefields play out on a Small Craft with a Space Mine Dispenser (attack capacity 6, the Space Mines Table), and the 5-ton Escape Pod and Life Boat sample files are reported as equipment a large craft carries, not units. JumpShips, space stations and WarShips take Naval Repair Facilities (pressurized, unpressurized and reinforced, by capacity); a station can carry energy storage batteries (100,000 tons each) and a jump sail sized like a JumpShip's, with its Sail Integrity filled on the sheet; stations, WarShips, DropShips and Small Craft can be SDS (Caspar) drones with the drone control system, steerage quarters, self-destruct and (WarShips) the SLDF jammer, all Experimental, WarShips at 800,000 tons at most. At Custom Homebrew and Munchkin, expanded fire control costs 10,000 C-bills a ton (ours: the books price none), summed with the components before the type multiplier as Strategic Operations: Advanced Aerospace Rules p.147 applies it.</li>
                        <li><strong>Capital weapons by edition (issue #151).</strong> Naval autocannons, lasers, PPCs and Gauss rifles, the capital missiles and the AR10 now carry the values BattleSpace (1993, Master Weapons Table p.71), AeroTech 2 (pp.54 and 101) and AeroTech 2 Revised (pp.75 and 82) print, read from the page images. Heat, damage, range, tons and prices are the same as Total Warfare in all three; AeroTech 2 and its revision print their own Battle Values for the energy and ballistic weapons (NL45 1,081 against 1,134, for example), and BattleSpace prints no Battle Value at all, only a Maintenance Point Value for its campaign rules. The tele-operated missiles and the Screen Launcher first appear in AeroTech 2; nothing was dropped later. The Capital Ship Creator lists these per-edition differences under the weapon you pick. Total Warfare Battle Values do not change, and capital ships are still built under Total Warfare only.</li>
                        <li><strong>LAM leftovers (issues #159, #160 and #161).</strong> Loaded LAM bombs add their Battle Value before skill as external stores do (Tech Manual p.315); Interstellar Operations: Alternate Eras is silent on it, so the Battle Value log marks the reading as inferred and the BV is no longer flagged provisional for it. The Alamo (Type II) nuclear missile, ten bomb slots, joins the LAM bomb load behind a new off-by-default Special Ruleset, Nuclear Weapons (IO:AE), at Experimental, with no Battle Value (IO:AE p.160); the Prototype Rocket Launcher pod joins at Experimental, one slot. Loaded bombs print on the record sheet and the Technical Readout, and the roster movement dialog drops or fires them: the Alamo resolves by its blast rings as text, a LAM in 'Mech mode may only fire rocket pods. LAM and Permanent Air 'Mech pilots now have separate aerospace Piloting and Gunnery (LAM Skill Table, IO:AE p.100); Battle Value uses the average of each pair, rounded normally (IO:AE p.186), and an old save with no aerospace skills plays and rates as before. Alpha Strike keeps the BattleMech pair.</li>
                        <li><strong>Star League Discord content.</strong> All content that came from the Star League Discord has been removed from selection, pending verification from its creators. Anything that comes back will be listed here once its creator gives the okay.</li>
                        <li><strong>Conventional infantry: bundled platoons and the math behind them (issues #600 and #599).</strong> 317 MegaMek infantry platoons now ship with the app: search them in the roster, view the record sheet, and add them. The Infantry Creator gains field guns and field artillery, beast-mounted infantry (the eleven creatures of Tactical Operations: Advanced Units &amp; Equipment pp.106-108), specialized infantry (marines, mountain troops, paratroops, SCUBA, TAG troops and more), XCT troops, mechanized VTOL and SCUBA platoons, and cybernetic and prosthetic augmentation (Interstellar Operations: Alternate Eras pp.70-79), each with its sheet, TRO, play, Battle Value, cost and Alpha Strike rules. The Gungnir heavy support Gauss rifle and Snub-Nose support PPC join the weapon list (A Time of War Companion p.195). Infantry gets the Battle Value and cost breakdown 'Mechs and fighters have, every step with the page it comes from, in the Infantry Creator and the roster viewer, with the Master Unit List&apos;s BV beside ours. Battle Value 1 is in for infantry too, from the Master Rules tables. A foot platoon with two support weapons a squad, which may move or fire but not both, now rates at 0 MP for Battle Value, as Total Warfare&apos;s infantry table (p.213) and the Master Unit List do. Archaic weapons such as blades and bows no longer count again for Anti-&apos;Mech attacks, and encumbering armor slows a platoon on the ground but not its jumps. Platoons can now mix Clan and Inner Sphere technology (Tactical Operations: Advanced Units &amp; Equipment p.189), which brings in the Clan LRM points; the Hammel Marksman sniper rifle (Shrapnel #1) joins the weapon list; and platoons riding branths count as airborne for Battle Value.</li>
                        <li><strong>ProtoMechs: bundled designs and the math behind them (issues #600 and #599).</strong> 70 of MegaMek&apos;s ProtoMechs now ship with the app (it was 64), each one at the Master Unit List&apos;s Battle Value: the WoR Ultraheavy Boggart, Hobgoblin and Sprite, which the list files under the chassis name alone, are matched now, and the Svartalfa Ultra takes the armor Technical Readout: Prototypes p.91 prints (65 points). ProtoMechs get the Battle Value and cost breakdown the other units have, every step with the page it comes from (TechManual pp.279, 282, 285, 306 and 316-318, Tactical Operations: Advanced Units &amp; Equipment pp.196-197, Interstellar Operations: Alternate Eras pp.190 and 215), in the ProtoMech Creator and the roster viewer, with the list&apos;s BV beside ours. Battle Value 1 is in too, under the Master Rules, Revised Edition (pp.154-156), and it reproduces the BV1 of all eight ProtoMechs in Technical Readout: 3060 (Harpy 28, Siren 52, Satyr 98, Centaur 140, Hydra 139, Roc 284, Gorgon 213, Minotaur 367). The 16 that still differ from the list are on the Battle Value Accuracy page, each with a verdict and its page: four (Centaur, Basilisk, Procyon 3, Triton 2) are worked by the list at the first TechManual printing&apos;s LRM 3 figures (35 and 5 a ton), which the corrected printings changed to 34 and 4 (p.318); three follow the myomer booster differently from TM p.306, which adds 1 to the Speed Factor. MegaMek &apos;Mech files that name the RISC Heat Sink Override Kit in a header line now import with it, which brings four RISC designs (BattleAxe BKX-RISC, Emperor EMP-6X, Malice, Savage Wolf) to MegaMek&apos;s Battle Value.</li>
                        <li><strong>Maximum Tech under the Master Rules (issue #612).</strong> The rest of Maximum Tech's Level 3 weapons and equipment now join BMR (1998) and BMR(R) at Advanced (Level 3), with the weight, slots and price Maximum Tech prints: X-pulse and Clan ER pulse lasers, the heavy flamer, light autocannons, the Thumper, Sniper and Long Tom cannons, Thunderbolt launchers, CASE II, coolant pods, superchargers, the grenade launcher, compact and laser heat sinks, the Inner Sphere targeting computer in BMR, PPC capacitors, and armor-piercing, caseless, flechette and tracer autocannon ammunition. ProtoMechs can take a jump pack (TO:AUE p.105), and Clan battle armor can have EI neural implants (Experimental; IO:AE pp.69, 184). Still open: the Clan ATM under BMR (no Battle Value is printed for it).</li>
                        <li><strong>Armless 'Mechs at Level 2 (issue #617).</strong> Below Advanced, an armless 'Mech keeps its arms with armor, structure, shoulder and upper arm actuator, and nothing else (Maximum Tech p.62). Armless 'Mechs refuse FrankenMech arm donors, and the choice no longer comes back after a round trip through a quad.</li>
                        <li><strong>Satellite uplink and field or mobile HQ (issue #622).</strong> The enhanced satellite uplink (Maximum Tech p.59) gives its side +2 Initiative, and costs the carrying unit +1 to attacks and Piloting and any spotting or C3 while it is on; it has a switch in play and a box on the record sheet. The roster play page now shows the side Initiative bonus with the unit it comes from and the page, and drops it when that unit is destroyed or the uplink is switched off. A vehicle uplink has its own switch in vehicle play and the same +1 on attacks and Driving Skill Rolls. A vehicle with 3 to 6 tons of communications equipment is a field HQ and with 7 or more a mobile HQ (p.70); Crew Killed ends its bonus as Maximum Tech p.70 has it (a Commander Hit alone does not), and a stabilizer hit ends it unless the vehicle sat still the turn before. Each side's BV takes one uplink or HQ, and the command console adds its 200 beside an uplink but not an HQ (pp.91-92); the roster force line shows the total.</li>
                        <li><strong>Combat drop (issue #628).</strong> The movement dialog has a Combat drop button: under Total Warfare a jump pack stands in for jump jets, burns all its fuel during the landing and is jettisoned (TO:AUE p.105); under the Master Rules any 'Mech may make the assault drop with a Piloting Skill Roll to land (BMR(R) p.78).</li>
                        <li><strong>Handheld weapons, thermobaric weapons and prosthetics (issue #611).</strong> A &apos;Mech with two full sets of arm and hand actuators can carry a handheld weapon, built in the equipment step as its own small design: weapons, ammunition by the shot, standard heat sinks and armor, 2 x the cost, and its Battle Value (weapons and ammunition plus armor x 2) added to the carrier&apos;s final BV (Maximum Tech pp.79, 92 for the Master Rules; TO:AUE pp.126-128, 193 from Total Warfare on). The roster drops and picks it up; the damage dialog asks for the 1D6 on a hit to an arm (or the front center torso under Maximum Tech) and sends the damage to the weapon on its hit roll, and a Triple-Strength Myomer &apos;Mech that cools below activation heat must drop a weapon over 10 percent of its tonnage (TO:AUE p.128). A biped ProtoMech can carry one too (Experimental, 10 percent of its tonnage, kept per ProtoMech in play). The fuel-air munitions now carry their damage tables, atmosphere, infantry and building rules and BattleForce values (IO:AE pp.159, 204), and the prosthetic limb BV table is checked against IO:AE p.186.</li>
                        <li><strong>Trailers and Level 3 vehicle items (issue #624).</strong> The roster can link a trailer to its tractor: under the Master Rules Level 3 Battle Value each is rated on the combined rig MP and the values add up (Maximum Tech p.92). The bulldozer blade, amphibious capability and dune buggy now stand in both Master Rules editions with Maximum Tech&apos;s prices and pages, joined by the vehicle coolant system (9 tons, 2 items, 90,000 C-bills, +15 to the base Defensive Battle Rating; Maximum Tech pp.87-88, 92).</li>
                        <li><strong>SeaDropships from the BattleTech forums (issue #643, Custom Homebrew).</strong> The Pelican SeaDropship and its sisters the Petrel and Gannet: a Flotation Hull that lands on water like a runway and sails afloat, with a well deck for hovercraft and boats. The Pelican follows Vehrec&apos;s BattleTech forums posts (<a href="https://www.battletech.com/forums/index.php?topic=44777.0" target="_blank" rel="noopener noreferrer">14 February 2015</a> and <a href="https://www.battletech.com/forums/index.php?topic=73429.0" target="_blank" rel="noopener noreferrer">4 May 2021</a>); the Petrel, the Gannet, the Flotation Hull, rules and stats are NGCFells&apos;s, and the three ships have their own readout in TRO - JBT. Added the Pregnant Guppy, a 4,000-ton flying boat built from its forum stat block on the Flotation Hull, to the Small Craft Creator&apos;s sample SeaDropships (Custom Homebrew by StingerTheRaven (BattleTech forums, Pregnant Guppy: an amphibious dropship, 25 April 2021)). Merged his bow ramp into play: afloat, hover vehicles launch from the vehicle bays down a ramp into the water. Naval vehicles now use the bays as ground units do (the rules team&apos;s 2020 forum answer), and nothing but Jumping or VTOL units leaves a ship in a turn it moves afloat (TO:AUE p.25), with a Moved afloat box in play. Added the Large Well Deck, a bay bought by the ton that floats a Large Naval Vessel out of the stern, with the NVT Alpha Strike special (ours, levels 6-7) (Custom Homebrew by Chaeronea and The_Caveman (BattleTech forums, Black and Blue - DropShips and Wet Navy Ships, December 2015)). The record sheet notes both. Every one of these items now links its forum thread in its notes and in TRO - JBT, with the older forum threads that had the same ideas first (floodable bays).</li>
                        <li><strong>Infantry and beast rulings (issues #599 and #600).</strong> Beast-mounted infantry Battle Value now adds the rider&apos;s and the creature&apos;s damage divisors, as Tactical Operations: Advanced Units &amp; Equipment p.191 prints it (an unarmored rider counts 1), so beast platoons rate higher, and in play their damage is divided by that same sum instead of by the armor and then the creature; the Branth Irregulars now match the Master Unit List at 43. Encumbering armor now takes 1 MP off VTOL infantry and beast riders too (jumps still keep theirs); only support weapons on Very Large and Monstrous creatures cost no MP, and riders of Large creatures carry no support weapons. A Very Large creature&apos;s Anti-&apos;Mech note quotes the p.108 text that differs from the table we follow. Specialty, XCT, mechanized VTOL and SCUBA cost multipliers now apply to the total, after field guns, beasts, implants, Narc and TAG (p.225). In Battle Value 1, TAG troops take the TAG +1, and specialties Maximum Tech prints no line for are marked provisional. Clan field gun points that carry Inner Sphere guns now load as mixed technology.</li>
                        <li><strong>Battle armor: more MegaMek suits, the math with its pages, and trooper training (issues #600 and #599).</strong> 1,032 MegaMek battle armor designs now ship with the app, up from 921. The Master Unit List renamed many variants, so the build now finds a suit through its old MUL number when the squad size agrees, and the Tengu&apos;s jump, the Phalanx&apos;s two ammunition lines, a myomer booster written once for each location and the Kage&apos;s ECM (carried by one trooper, it covers the squad) read as the files mean them. A mixed-technology suit can carry the Clan UMU or VTOL system, the heat sensor fits a Clan suit, and the RISC advanced point defense system (Interstellar Operations: Alternate Eras p.85) and the BattleMech neural interface unit (p.110, PA(L) suits only) are in, so the Aegis, the Sea Fox, the Tornado G17, the Headhunter and the interface suits import. Battle armor Battle Value and cost now show step by step with their pages in the creator, the add-units viewer and the MUL search: Battle Value 2 on TechManual p.310, and Battle Value 1 under both Master Rules from the Classic BattleTech Companion pp.187-190, the only formula in print (cited under the Revised Master Rules, provisional under the 1998 ones, which print only a table of stock suits; the Revised table&apos;s Clan Standard rows show where they differ). The cost now includes the trooper training TechManual p.285 prices, 150,000 for an Inner Sphere trooper and 200,000 for a Clan one, so Max&apos;s Purifier squad comes to the 3,523,500 TechManual p.286 works out; under the Master Rules the Revised Edition&apos;s fixed price for a stock suit is shown beside the built cost. The list still differs on 150 suits. 108 of them have a verdict on the Battle Value accuracy page (MegaMek&apos;s calculator agrees with ours on 87, and the other 21 are the rulings on burdened suits, the Kage support weapon, the heavy grenade launcher and magnetic clamps); the rest stay open.</li>
                        <li><strong>Support Vehicles: bundled designs and the math behind them (issues #600 and #599).</strong> 183 MegaMek Support Vehicles now ship with the app, up from 97: search them in the roster, view the record sheet and TRO, and open the Battle Value and C-Bill cost as cited steps, each with its page, with the Master Unit List&apos;s Battle Value beside ours. The import now reads infantry weapons and their clips, battle armor, infantry and vehicle bays, ladders, the dumper and the handheld searchlight, and fits the chin turret, the Armored Motive System and vehicular jump jets on a Support Vehicle (Tactical Operations: Advanced Units &amp; Equipment pp.94, 160-161). Dune buggy and environmental sealing add to a Support Vehicle&apos;s type modifier as they do a Combat Vehicle&apos;s (p.193), a rail trailer rates at 1 MP, and two designs take their book armor (the Buffalo Drone Bomb and the HMRV Salvage Bed). 41 designs now match the list; each one that differs has its verdict.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 22nd, 2026</strong> - Alpha Strike rules editions and rules levels
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Mordel.net units.</strong> Add your Mordel.net API key in Settings and bring Mordel.net designs, your private ones included, into the 'Mech Creator and the rosters. The key stays on your device and goes only to Mordel.net. Checked against the live Mordel.net site (thanks to Scott for the API). See the box at the top of this page.</li>
                        <li><strong>Fighters: bundled designs and the math behind them (issues #600 and #599).</strong> 315 MegaMek fighters now ship with the app: search them in the roster, view the record sheet and TRO, and add them. Fighters also get the Battle Value and cost breakdown 'Mechs have, every step with the page it comes from, in the fighter creator and the roster viewer, with the Master Unit List&apos;s BV beside ours. Battle Value 1 is in for fighters too, from AeroTech 2 and its Revised Edition. Checking every bundled fighter against the list and MegaMek turned up a few fixes: Clan LRM 20s run at 6 heat (TW p.304), an ammo bin stays with the launcher it feeds (an MRM 30&apos;s rounds are not an MRM 10&apos;s), machine gun arrays and modular armor count, an HVAC counts as a Gauss weapon, the wings join the nose against the aft, and a drone operating system takes its 0.8 off the weapons. Fighter prices now leave the ammo out, as TechManual p.282 says, and show the loaded price beside it.</li>
                        <li><strong>Unit pictures (issue #95).</strong> Upload a picture of your unit on the Technical Readout step of any creator. It is shrunk to fit and kept in the design (and in your backups), then shows on the record sheet, the Technical Readout and the Alpha Strike card. A design without a picture prints exactly as before.</li>
                        <li><strong>SSW import asks about unknown items (issue #76).</strong> Before an .ssw import is saved, each item the catalogs do not know gets a short form: tech base, tons and slots (best guesses filled in, each with an I do not know box), and optional damage, heat, ranges and a source note. Save stays off until every required answer is given, and an I do not know is marked estimated on the design status bar. RISC Laser Pulse Module lasers now have Alpha Strike values from the Alpha Strike Companion's conversion table (IO:AE p.197 for the rule).</li>
                        <li><strong>A tidier menu (issue #97).</strong> The Equipment Editor and the Custom MUL Editor now sit under Settings, with a Developer Tools box on the Settings page, and show only with the developer menu on. Old links to them still work.</li>
                        <li><strong>Sonic projectors (issue #645, Custom Homebrew).</strong> Military and law-enforcement sonic projectors that never kill. They are built, priced and converted to Alpha Strike (SNC, ours), and played in the roster: stunned troopers and a Morale Check on conventional infantry. The sonic projectors are by NGCFells. The Bombast Laser now has its dial in play too.</li>
                        <li><strong>Rotary and Ultra autocannon play (issue #643).</strong> Rotary and Ultra ACs now play their rate of fire and jams.</li>
                        <li><strong>E-War follow-ups and vehicle special ammo (issues #647, #648).</strong> Vehicles and trailers now pick the special ammunition their Alpha Strike card plays as a munition. In Alpha Strike E-War play: a unit&apos;s own RAMS and a friend&apos;s are both spent on one hit; 2013 boosted C3 links five units; a master counts toward the network size; standard and boosted C3 share one network, and a master of masters reaches a company-level 12; drones shut down and restart in the End Phase, and a blocked line to the controller or a destroyed controller shuts them down; a jam lasts only while its jammer runs, and you pick which jammer set it; the TSEMP roll takes -1 against BattleMechs and any aerospace unit, not industrial mechs. LMAS now counts +3 in Alpha Strike Point Values, as the Companion&apos;s Defense Factor table prints it (Mimetic Armor, MAS and LMAS); the Master Unit List prices LMAS infantry at 2, so our Point Values differ from it there on purpose.</li>
                        <li><strong>Alpha Strike for every custom item (issue #647).</strong> Every Custom Homebrew and Munchkin record now has an Alpha Strike conversion or a stated reason. New specials of ours, levels 6-7 only: ITAS (Improved &apos;Mech Taser, VoiceOfAN), BSF (Blue Saviour, u/PleiadesMechworks), NPC (Nuclear Pulse Cannon, Prince), PSC (Periscope, Thunder and Solaris7), SMKT and SMKB (Smoker and Buckler, Future Wars #32), PBR and PBJ (Power Booster, Karl Sander); the Hailstorm gets HAIL at its own level. Swing Fire racks, the EII PDS, the Penitrator and the pile bunker now carry damage or MEL. Canon lookups: the BattleMech Taser (MTAS, with its effect roll in play), the Apollo MRMs, Coolant Pods in the heat sum and the Recon Camera. The ASCE Alternate Munitions (Armor-Piercing, Flak, Heat-Seeker, Semi-Guided and the rest) are chosen with the special ammunition, and our own rounds (EMP, boosted, VHE, Inferno Gauss) are added at levels 6-7.</li>
                        <li><strong>Alpha Strike editions (issue #646).</strong> An Alpha Strike force now picks its rules edition (the 2013 book or the Commander&apos;s Edition) and a rules level. Play, pilot abilities and costs follow it: the 2013 book keeps the card TMM under heat, takes a weapon hit straight to 0, and does not halve a vehicle&apos;s TMM on an engine hit; its pilot abilities come from the Alpha Strike Companion. Levels 0 and 1 are the Quick-Start Rules and load BattleMechs only, with no building until Standard.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 21st, 2026</strong> - Electronic warfare in roster play: missiles, stealth and sensors, C3 networks
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Electronic warfare in roster play (issue #642).</strong> Every unit type now knows its E-War gear (AMS, Artemis, Narc, TAG, ECM, probes, C3, stealth systems, communications equipment) and keeps its E-War state in saves, and each unit plays it under its own rules edition, from The BattleTech Compendium to the Core Rulebook, with Maximum Tech's Level 3 items offered under the Master Rules. Every effect is a labelled line in the to-hit number, the cluster chart or the unit's E-War box, and an old save loads unchanged. Not yet: the Personal ECM's effect on other units in its hex and the Blue Saviour hooks (Phase 4), and the Alpha Strike E-War specials (Phase 5).</li>
                        <li><strong>The catalog audit.</strong> The E-War items were checked one by one against every rules edition, the expansions and both Alpha Strike rulebooks. An item a book never printed is not offered as printed in it (the BattleMech Manual and the Core Rulebook lost items they never printed), Maximum Tech's Laser AMS, Artemis V, Streak LRMs, Angel ECM (1.5 tons for Clan 'Mechs), Bloodhound probe, Null-Signature System and infantry ECM suits are offered under the Master Rules with Maximum Tech's weights and prices, and the Light Active Probe joins the Alpha Strike special abilities. An item or rule a later book drops (the Nova CEWS, the prototype probes and ECM, the APDS, ECCM and ghost targets, aerospace ECM, Naval C3, EW Equipment) stays available in the later books as apocryphal and plays by its last printed rule.</li>
                        <li><strong>Missile defenses and guidance.</strong> Artemis IV (+2), Artemis V (+3, -1 to hit, never past a 12), the prototype Artemis (+1), Apollo (loses the MRM -1), Narc and iNarc pods (+2, and -1 to hit for a homing pod or a Core Rulebook Narc), semi-guided LRMs on a TAG-designated target and the anti-missile systems (AMS, Laser AMS and the RISC APDS) work under each edition that prints them, with that book's numbers: the Compendium through the Master Rules (Revised) shoot down 1D6 missiles (2D6 for the Clan AMS), Total Warfare and the BattleMech Manual shift the attacker's Cluster Hits roll by -4 for 1 heat and 1 ammunition, and the Core Rulebook lets an AMS engage two missile attacks a turn. Hostile ECM cancels Artemis and Narc where the books say so and friendly ECCM restores them; the Core Rulebook MRM has no +1 to hit and a -1 on the Cluster Hits roll (Apollo removes it); AMS cannot engage Thunder, Swarm, Flare or Arrow IV missiles; AMS heat counts in the turn heat; missile hits split into damage groupings with a location roll each. The Target dialog has an E-War box, the cluster chart shows each shift with its label, and the Taking Damage dialog has a missile-attack panel that applies the defense, the heat and the ammunition. TAG and each AMS's engagements clear on Next Turn; pods stay. Every other unit type shows what its gear does under its own edition.</li>
                        <li><strong>Stealth, ECM and probes.</strong> Stealth armor, Null-Signature, Void-Signature, Chameleon LPS, Mimetic armor, battle armor stealth and sneak suits change the to-hit number as each edition prints them: pick the target's stealth systems in the Target dialog (or the stealth box on the other play views) and the range or hexes moved. Systems add up; Chameleon will not run with Void-Signature. Your own stealth, ECM and ECCM modes and ghost targets are switches in the unit's E-War box, and Stealth armor switches the ECM off where the book says so. ECM and ECCM suites are counted on the line of fire (an Angel suite counts apart and spoils Streak locks), a unit the force board puts inside hostile ECM loses its Artemis and Narc effects, and each probe, the Nova CEWS included, shows its range and what it can find.</li>
                        <li><strong>C3 networks.</strong> Name a network, its type (Master/Slave, C3i, Boosted, Naval, Nova link, Modular), each unit's role and the Master a Slave hangs from; the edition's limits are checked and a network that breaks them is refused with the reason. A unit shares the range of the nearest networked unit (give its distance in hexes in the Target dialog), unless it is cut off: its computer or its Master is destroyed, a stealth system is on (not Chameleon LPS), or hostile ECM covers it or its Master (the Core Rulebook adds a TN penalty for the range gained instead of cutting it off). The Emergency Master takes over for six turns, Remote Sensor pods work for three, a Nova link starts the turn after it is declared, and battle armor equipment on a unit over 3 tons does nothing.</li>
                        <li><strong>The rest of the gear.</strong> EW Equipment, communications equipment (ECCM and ghost targets), aerospace ECM (hex fields and ECCM, Strategic Operations), and the Maximum Tech infantry disposable Narc launcher and TAG (apocryphal, each launcher fires once) are in.</li>
                        <li><strong>Custom and fan E-War items.</strong> The Personal ECM Suite (Pleiades Mechworks: a Guardian for its own hex, no ECCM mode), the Modular C3 and Chaff Pod 2.0 (Prince, Solaris7 forum, April 2020), the ER Improved Narc Launcher and the fan Null-Signature System play under the rules above, and each is in the Technical Readout with its author and lore.</li>
                        <li><strong>Alpha Strike: the Chaff Pod.</strong> No Alpha Strike book converts the Chaff Pod (Tactical Operations: Advanced Units &amp; Equipment p.111). The Companion, its errata to v1.6 and the Commander&apos;s Edition are silent, and the Companion&apos;s Screen Launchers are capital-scale chaff. So we wrote one, the CHF# special. Each pod, once a scenario, fills a 2-inch cloud until the End Phase: light smoke, an ECM bubble ECCM cannot negate, and anti-missile cover (−1 damage from IF, SRM and LRM attacks, minimum 1) for friend and foe alike. Chaff Pod 2.0 converts as CHF4. Our Alpha Strike rules appear only at the Custom Homebrew and Munchkin levels: a canon or Apocryphal design keeps the canon card, with no special for the pod. The canon Chaff Pod is now also marked Experimental, as its book has it.</li>
                      <li><strong>Alpha Strike: electronic warfare in play.</strong> Alpha Strike roster play now applies its E-War specials instead of only listing them, by the edition the force plays (the Commander&apos;s Edition by default, the 2013 book where it differs): ECM and ECCM cover you name on a new board, probes overwhelmed by hostile ECM, stealth and mimetic armor with the modified to-hit shown beside the card, AMS and RAMS and Narc beacons on missile hits, C3, C3i, Boosted, Nova and naval networks with the emergency master, drones, TAG, the RISC viral jammers and TSEMP. The conversion also follows the Companion&apos;s v1.6 errata and the MUL: Guardian ECM, C3, Nova, Watchdog, probes, Void-Signature (MAS) and Chameleon LPS (STL) give the specials they should, and infantry camo gives LMAS. Ours, for Custom Homebrew and Munchkin only: the Personal ECM is an LECM, the Modular C3 a C3i, the fan Null-Signature an STL, and Chaff Pods are CHF#.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 20th, 2026</strong> - Campaigns: planets, star systems and mercenary contracts
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Campaigns (issue #172).</strong> Game Management has a new Campaigns page. A campaign keeps its sides, each side's ledger of C-bills, a log, snapshots of each force and an optional campaign planet split into areas. Advance it a step at a time. Record a battle after you play one: who fought, what was lost and who holds the ground. Change the name, sides, start date and planet later in Setup. Campaigns are saved on your device and go into the full backup.</li>
                        <li><strong>Star systems.</strong> Pick the campaign planet from the JBT star system catalog, built by NGCFells on MegaMek Data (CC BY-NC-SA 4.0) and checked against the BattleTech sourcebooks and the Inner Sphere Cartography Society maps, with each system's owner and garrisons named for the campaign's date, the fewest jumps to each target and the sites the books place there.</li>
                        <li><strong>Future Wars: Economics.</strong> Herb Barents's resource dots (Future Wars #5 and The Best of Future Wars), as a Special Ruleset: each area's dots pay the side that holds it every quarter, with the printed combinations. Both printings merged into one ruleset by NGCFells's decision. With it comes an economic damage table derived by NGCFells, inspired by Herb Barents: after a battle in an area, its dots can be destroyed. Fan-made, NOT OFFICIAL.</li>
                        <li><strong>Mercenary units.</strong> Two campaign editions for mercenary commands, inspired by Mercenary's Handbook (1987) and Mercenary's Handbook 3055: roster, pay and upkeep each month, contract negotiation and signing, contracts that end early, are lost or go to a breach hearing, and in 3055 the Dragoons Rating. Where a book leaves a rule open, NGCFells decided how to read it, and each panel lists those readings.</li>
                        <li><strong>Support Vehicle Battle Value (issue #600).</strong> Infantry light machine guns on pintle mounts count as the infantry weapon, a bulldozer counts BV 10 as defensive equipment (TechManual p.317), and a Large Support VTOL has one location per side (TechManual p.124). The armed Brunel Dump Trucks carry 10 tons of standard armor, NGCFells's correction, as their record text describes. They stay as printed, though their weapons need more item slots than a 150-ton Support Vehicle has (34 and 24 of 20) and they weigh 168.5 tons, so the unit lists now mark them Illegal, with what they break on hover.</li>
                        <li><strong>Vehicle engines (issue #600).</strong> Vehicles converted from MegaMek's unit files had their engines mixed up: every fusion vehicle was built with an internal combustion engine and every ICE vehicle with a fusion one, and light, compact and fuel cell engines were swapped. Battle Values were right, but weights, C-bill costs and record sheet engines were not: the Manticore weighed 76.5 of its 60 tons. Now fixed, with new costs for 828 Combat Vehicles and 74 Support Vehicles. Trailers now have no engine, industrial equipment (backhoes, rock cutters, chainsaws, combines, mining drills) mounts on vehicles as TechManual allows, and a Support Vehicle that weighs more than its tonnage says so. Sponson turrets now weigh 10% of the weapons in both sponsons together, rounded up to the half ton once, and the two sponsons need not carry the same tonnage (Tactical Operations: Advanced Units &amp; Equipment p.158, corrected printing); 18 vehicles that came out half a ton heavy now fit.</li>
                        <li><strong>Alpha Strike: low ammunition.</strong> A weapon's Alpha Strike damage now follows the Ammunition rule of Alpha Strike Companion p.101: under 10 shots a weapon (20 for an Ultra autocannon, 60 for a Rotary), damage x0.75; a one-shot missile launcher x0.1, rocket launchers unchanged; a Multi-Missile Launcher counts the average of its LRM and SRM shots. 156 more bundled 'Mech cards now match the Master Unit List, among them the Timber Wolf, Bowman, Mad Cat III, Scylla and Stalker.</li>
                        <li><strong>AirMech mode in play (issue #634).</strong> A LAM in AirMech mode, and a Permanent Air 'Mech every turn, moves by Walking, Running, AirMech Cruise or AirMech Flank (Interstellar Operations: Alternate Eras pp.102-103), with the AirMech attacker modifiers (+1 to +4), the airborne +1 to be hit, heat of the AirMech MP spent / 3 and its elevation on the sheet. Airborne physical attacks and the AirMech Ram are listed in the physical attack phase (p.106).</li>
                        <li><strong>Mercenary contract sheets (issue #639).</strong> Each campaign now has Contract sheets: the books' mercenary contract forms with every blank a field you can type in and every box one you can tick. Pick the form for each sheet: the Mercenary Contract Record Sheet from Hot Spots: Draconis Reach (p.203), its Mallory's World version with Loneliness Island (p.204), Hot Spots: Hinterlands (p.151, as corrected by the errata, or the first printing) or the BattleTech: Mercenaries rulebook (p.33); the Contract of Mercenary Employment from Hot Spots (Hinterlands p.152, Draconis Reach p.205) or Mercenaries (p.35); the Mercenary Contract from Mercenary's Handbook (1987); or the two-page Mercenary Contract Worksheet from Field Manual: Mercenaries (Revised) (pp.187-188). Keep a sheet for each contract, change a sheet's form without losing what you typed, add ledger lines when 23 are not enough, and print each on Letter paper at the book's page count. Sheets are saved with the campaign.</li>
                        <li><strong>Vehicle weights.</strong> Four Combat Vehicles came out over their tonnage, and each was checked against its book. Laser insulators now take 1 heat off their laser when the heat sinks are counted (Tactical Operations: Advanced Units &amp; Equipment p.134; the Pandion 3140 Upgrade is 20 tons again). Heavy flamers, fed by ammunition, need no power amplifiers on an internal combustion engine (the Sokar's weight table in Technical Readout: Prototypes). An Inner Sphere-chassis Mixed Tech vehicle can take Clan CASE, which weighs nothing (TechManual p.210; the Skulker C). An OmniVehicle's turret keeps its base chassis weight in every configuration and holds up to 10 times that weight (TechManual p.108), set on the Vehicle Creator's first page. The Ajax Assault Tank C stays as printed and is flagged illegal: its pods need 44.5 tons and the chassis has 42.</li>
                        <li><strong>Alpha Strike: ATM damage.</strong> ATM and Improved ATM launchers now add the damage of the Alpha Strike Companion's Weapon Conversion Table (pp.109-110: an ATM 6 is 1.5 / 1 / 0.5, an Improved ATM 6 1.8 / 1.2 / 0.6 with the errata), not values already rounded for a single weapon. 66 more 'Mech cards now match the Master Unit List.</li>
                        <li><strong>Support Vehicle checks.</strong> Every bundled Support Vehicle that broke a construction rule was checked against its book. Bridgelayers take 1 item slot on a Support Vehicle (TechManual p.344). BAR 10 armor takes Inner Sphere Ferro-Fibrous space at armor Tech Rating E and Clan space at F (TechManual errata). All the ammunition for one weapon type, slug and cluster alike, shares one item slot (TechManual p.136). A Small Support Vehicle without fire control needs 1 gunner per weapon (TechManual p.131). A drone has no crew, and a small drone's operating system is weighed in kilograms (Tactical Operations: Advanced Units &amp; Equipment p.117; the Hi-Scout drones of Technical Readout: 3039). The Estevez tanks carry their printed BAR 8 armor, and now match their Master Unit List Battle Values. The Air Car, both Estevez tanks, the Jonah and other designs that break the rules as printed stay, flagged illegal.</li>
                        <li><strong>Pleiades Mechworks equipment (issues #640, #641).</strong> u/PleiadesMechworks's fan items from r/NormalBattletech, at the Custom Homebrew level: the Autocannon/12 with seven munitions and Boosted Autocannon Rounds for the AC/2, 5, 10, 12 and 20 (their longer range and extra heat are in the to-hit and the heat), the "Personal" ECM Suite (which does not count as an ECM suite for Stealth Armor), the Blue Saviour Dispersion Field, and the Pilot Suit cockpit. In roster play the Blue Saviour switches on and off in the End Phase, adds 7 heat, halves energy damage in and out (and again for Laser Reflective armor, which now halves energy hits whether or not a Blue Saviour is fitted: tick Energy weapon in the Take Damage window), rolls its failure check after six turns and explodes for 5 when a slot is hit; the Pilot Suit plays Piloting and Gunnery 1 better. The Hardsuit PA(L) and Hardsuit PA(L) VTOL battle armor are in the Classic roster's unit search with Custom units ticked. With the electronic warfare rules in play the Blue Saviour now meets a missile attack as one anti-missile system (once a turn, no ammunition and no heat of its own, after any real AMS), and counts as inside hostile ECM that no ECCM clears (its Artemis and Narc are cancelled, its C3 is cut off); the Personal ECM covers the other units you name as sharing its hex, as friendly ECM, while its suite works. Stealth off and cannot-be-hidden stay reminders. Battle Values and costs not in the posts are NGCFells's, and the notes say so.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 19th, 2026</strong> - Future Wars DropShips: four ways to build a DropShip
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Future Wars DropShip construction.</strong> Four fan methods from Future Wars are Special Rulesets in the Small Craft Creator at the Custom Homebrew level: Mark Stock's (#16, reprinted in The Best of Future Wars), Erik Eid's (#25), Mike Reese's and Doug Houseman's (#36). Tick one on a DropShip and step 2 weighs the ship by that author's rules: engine, structure, fuel, bridge, heat sinks, armor, bays and quarters. Where Stock says to look values up in DropShips and JumpShips, NGCFells fitted formulae to every DropShip in that book; you can still type your own. Houseman's integrity table is extended past its eighth row. Fire factors per arc print in the record sheet's notes. Fan-made, NOT OFFICIAL (issue #172).</li>
                        <li><strong>Sample DropShips.</strong> The Small Craft Creator's home page loads Stock's Pioneer A, B and C and Reese's UNION-12, THUNDERWOLF and GOLIATH-R, each built to its author's rule with what the sheet prints in its notes, and NGCFells's verification builds: the canon Leopard, Union and Overlord weighed by each method. TRO - JBT has a Future Wars DropShips readout with the methods, the formulae beside every DS&amp;JS DropShip, and each design.</li>
                        <li><strong>DropShip rulings.</strong> DropShips may mount ECM suites, NGCFells's ruling: TechManual p.213 puts no unit restriction on them (its p.342 table prints NA), and AeroTech 2 Revised p.25 allows them; a DropShip uses one only against ground units. C3 stays off DropShips in every edition. Houseman's DropShips get the TechManual's free heat sinks, with his thrusters as the engine.</li>
                        <li><strong>Active probes on DropShips.</strong> DropShips may now mount active probes (Beagle, Clan, Clan Light and Bloodhound), following NGCFells's ECM ruling: TechManual p.204 puts no unit restriction on them (its p.342 table prints NA), AeroTech 2 Revised p.25 allows them, and Tactical Operations lists the Bloodhound as available to DropShips. A DropShip uses one only against ground units.</li>
                        <li><strong>Battle Value checks (issue #599).</strong> A Superheavy 'Mech with CASE now counts it the way a Clan 'Mech does (Interstellar Operations: Alternate Eras p.188), so ammunition in its center torso, legs and head still costs Battle Value. Three more designs where the Master Unit List differs from the JBT value now cite why: the Grand Titan T-IT-N13M and Deep Lord RCL-Z1M, whose published record sheets print the JBT value, and the Temax Cat Ninjabolt TMC-NB, where the list charges the HVAC/10 for each slot (Tactical Operations: Advanced Units &amp; Equipment p.195).</li>
                        <li><strong>Unit search terms (issue #625).</strong> The Master Unit List search box now takes <i>role:striker</i> and <i>tech:clan</i> (a two-word role without its space, as <i>role:firesupport</i>; <i>tech:is</i> for Inner Sphere), and damage ranges such as <i>short:2-3</i>, <i>medium:</i> and <i>long:</i>. A word:value term it does not know is no longer searched as part of a unit's name: it is left out, and a line under the search box names it.</li>
                        <li><strong>Safer unit text (issue #215).</strong> Technical Readout text and the Battle Value and cost breakdowns are built from unit data, and an imported file brings its own names and text. That markup now goes through DOMPurify, so it keeps its tables and styling but can never run a script.</li>
                        <li><strong>Battledroids heat sinks (issue #206).</strong> Battledroids puts every heat sink on the Critical Hit Chart, the engine's ten included, so a printed droid now loads with all of them placed. The Merlin's go where its chart prints them (Battledroids p.25). No other listing says where, so the rest follow the Merlin's &quot;divided among all 8 hit locations&quot;: one to each location in the chart's order, round after round, until they are all placed. They can be moved like any other heat sink once the droid is edited.</li>
                        <li><strong>CASE on vehicle sheets (issue #135).</strong> A vehicle with CASE now has its rule printed under the Critical Hits Table, checked against Total Warfare p.194: an Ammunition result puts the ammunition's damage on the rear armor instead, any excess is ignored, and the crew is stunned. (A fan-made sheet said the rear armor is lost outright; only the ammunition's damage comes off it.)</li>
                        <li><strong>Fixes.</strong> The Small Craft Creator's introduction now covers DropShips and Primitive craft. Rulings in ruleset and equipment text are credited to NGCFells by name.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 18th, 2026</strong> - Heat-Seeking Thunderbolts and Thunderbolt torpedoes
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Lopunny's Thunderbolts.</strong> Heat-Seeking ammunition for the Thunderbolt 5, 10, 15 and 20 (the canon Heat-Seeking rules, with the Thunderbolt's full shots a ton), and Thunderbolt Torpedo launchers with the Thunderbolt's statistics, both introduced 3082, as Custom Homebrew. NGCFells ruled the torpedoes are launchers of their own, as the LRT is apart from the LRM. Both are in TRO - JBT. Thanks, Lopunny!</li>
                        <li><strong>Fix.</strong> Heat-Seeking LRM ammunition is introduced in 2340, as Tactical Operations prints it; the catalog had the year transposed to 2430.</li>
                      </ul>
                  </li>
                  <li>
                  <h3>
                      <strong>November 17th, 2026</strong> - Power Armor, a new Special Rulesets window, and TRO - JBT by category
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <ul>
                        <li><strong>Power Armor (issue #172).</strong> Bill Swisher's "poor man's BattleMech" from Future Wars #14 is a Special Ruleset at Custom Homebrew: build a 5, 10 or 15-ton suit in the 'Mech Creator, with its own record sheet, play rules (Target dialog, pilot criticals, unlatching the front plate), Battle Value and a PWA Alpha Strike ability. Four sample suits in step 1: the printed IPA-1 to IPA-3 and NGCFells's IPA-4. Fan-made, NOT OFFICIAL; where the article is silent the rulings are NGCFells's.</li>
                        <li><strong>Future Wars originals (issue #172).</strong> The Best of Future Wars equipment and rules were checked against the first printings in the Future Wars fanzine (1987-1990), and every credit, in the equipment notes and in TRO - JBT, now names the original issue, year and page before the 1991 reprint. Where the reprint only fixed a slip, the original is followed. Where the two printings give different rules, you can now choose: Morale, Weapon Malfunctions and The Long Range Wars each have an original-printing Special Ruleset beside the reprint's, and "Future Wars: equipment as first printed" plays the Power Booster, Inferno Gauss shells, Long Range Flamer fuel, EII PDS and Swing Fire as the original issues had them. TRO - JBT's Best of Future Wars readout lists every difference under "Two printings".</li>
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
                        <li><strong>Community Homebrew and Apocryphal equipment.</strong> From r/battletech and MechWarrior 5: the Superheavy PPC, Fusion Lance, Re-Engineered Fusion Engine, Tandem Charge SRMs, Reloading Rocket Launchers, the PPC-X and COIL. Where an author gave no Battle Value, cost, date or Alpha Strike values, NGCFells derived them; the new TRO - JBT card shows the method so you can price your own.</li>
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
                        <li><strong>TRO - JBT</strong> is on the top menu: a home for NGCFells's custom creations. Its Technical Readouts read like real TROs, a page at a time, with Markdown download and line art.</li>
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
                        <li><strong>Rules.</strong> Alpha Strike Point Values follow errata v1.6; alternate munitions keep their round's Battle Value; 'Mech placement rules for physical weapons, spread equipment and AES; tripod record sheets; edition rules for ICE 'Mechs and torso armor.</li>
                        <li>Also: era availability per 'Mech, large vehicle engine dates, faster imports and restores, and many small layout fixes.</li>
                      </ul>
                   </li>
                  <li>
                  <h3>
                      <strong>October 22nd, 2026</strong> - New record sheets for every unit type, and quirks in play
                    </h3>
                    <h4>Author - NGCFells</h4>
                      <p>New on the <a href="https://ngcfells.github.io/battletech-tools" target="_blank" rel="noopener noreferrer">beta test site</a> and offered to upstream</p>
                      <ul>
                        <li><strong>Record sheets.</strong> Full-page sheets with every official table for vehicles, fighters, Small Craft, DropShips, JumpShips, WarShips, battle armor (five squads a page), infantry (four platoons), ProtoMechs (a Point a page), buildings, airships, satellites and Battledroids units.</li>
                        <li><strong>Custom Homebrew</strong>: the Armored Motive System. The Hailstorm at Apocryphal; the Smoker and Buckler from Future Wars #32.</li>
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
                      <p>We've added Faction Filters to the Alpha Strike Roster. It works identically to the <a href="https://masterunitlist.battletech.com/" target="_blank" rel="noopener noreferrer">MUL</a> faction search on the unit page. The search will pull up a mech if it's available for ANY of the factions you pick, not ALL of them.</p>

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
