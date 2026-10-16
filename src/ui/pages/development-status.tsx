import React, { type JSX } from 'react';
import './development-status.scss';
import {IAppGlobals} from '../app-router';
import UIPage from '../components/ui-page';
import TextSection from '../components/text-section';

export default class DevelopmentStatus extends React.Component<IDevelopmentStatusProps, IDevelopmentStatusState> {
    constructor(props: IDevelopmentStatusProps) {
        super(props);

        this.props.appGlobals.makeDocumentTitle("Development Status");
    }

    render = (): JSX.Element => {
      return (
        <UIPage current="dev-status" appGlobals={this.props.appGlobals}>
            <div className="flex">

            <TextSection label="Development Status" className='grow with-margins large-max-width-100'>

            <p><strong>Current Focus:</strong> Getting the new unit creators and rules editions reviewed for the main site, then file imports and checking the data against the rulebooks.<br />
            <strong>Production Site:</strong> <a href="https://jeffs-bt-tools.github.io/battletech-tools" target="_blank" rel="noopener noreferrer">https://jeffs-bt-tools.github.io/battletech-tools</a><br />
            <strong>Development Site:</strong> <a href="https://heysporky.github.io/battletech-tools" target="_blank" rel="noopener noreferrer">https://heysporky.github.io/battletech-tools</a><br />
            <strong>Development Repo:</strong> <a href="https://github.com/HeySporky/battletech-tools" target="_blank" rel="noopener noreferrer">https://github.com/HeySporky/battletech-tools</a><br />
            <strong>Beta Test Site:</strong> <a href="https://ngcfells.github.io/battletech-tools" target="_blank" rel="noopener noreferrer">https://ngcfells.github.io/battletech-tools</a><br />
            <strong>Beta Test Repo:</strong> <a href="https://github.com/NGCFells/battletech-tools" target="_blank" rel="noopener noreferrer">https://github.com/NGCFells/battletech-tools</a></p>
            <p>New work is tried out on the beta test site first, then offered to the development repo for review. The beta site may have features, and bugs, that the others do not have yet.</p>
            </TextSection>

              <TextSection
                label="Alpha Strike"
                className="grow with-margins large-max-width-50"
              >
                    <h4>Done</h4>
                    <ul>
                      <li><del>Force Manual formation bonuses (Davion, Kurita)</del></li>
                      <li><del>Filter units by era, faction and special ability</del></li>
                      <li><del>Search the Master Unit List offline, kept current every week</del></li>
                      <li><del>SPA point calculation fix</del></li>
                      <li><del><i>BattleTech: Aces</i> companion: card library, card reader, rules, to-hit calculator, campaigns</del></li>
                    </ul>
                    <h4>Coming</h4>
                    <ul>
                      <li><i>BattleTech: Aces</i>: the automated opponent, its additional rules and the <i>Scouring Sands</i> campaign</li>
                      <li>Small Craft and DropShips in Alpha Strike forces</li>
                      <li>Armor thresholds and rules levels on aerospace cards from the new Master Unit List</li>
                    </ul>
                  </TextSection>

              <TextSection
            label="'Mech Creator"
            className="grow with-margins large-max-width-50"
          >
                    <h4>Done</h4>
                    <ul>
                      <li><del>Every TechManual construction step, the record sheet and critical allocation</del></li>
                      <li><del>Biped, Quad, Tripod, LAM and QuadVee; OmniMechs, Superheavy, IndustrialMechs and Primitive 'Mechs</del></li>
                      <li><del>Canon Inner Sphere and Clan equipment, checked against the rulebooks</del></li>
                      <li><del>Rules levels, including Apocryphal, Custom Homebrew and Munchkin</del></li>
                      <li><del>Rules editions from <i>Battledroids</i> (1984) to the 2026 Core Rulebook</del></li>
                      <li><del>Each edition's own rules levels, starting with <i>Battledroids</i>' Basic, Advanced and Expert</del></li>
                      <li><del>Printed <i>Battledroids</i> droids: the box set, the Spider and the TCI kit backs</del></li>
                      <li><del>Shields on the record sheet</del></li>
                      <li><del>Patchwork Armor, Fractional Accounting and FrankenMechs</del></li>
                      <li><del>Solaris Skunk Werks import</del></li>
                    </ul>
                    <h4>Coming</h4>
                    <ul>
                      <li>The last missing equipment (M-Pod, B-Pod, Artemis V and Apollo launchers and others)</li>
                      <li>Placement rules for spread equipment, and cockpits limited by era</li>
                      <li>Pod-mounted heat sinks and jump jets on OmniMechs</li>
                      <li>Alpha Strike stats for LAMs</li>
                      <li>Compact 'Mechs, Micro 'Mechs, Hexapods and Octapods as Custom Homebrew rules</li>
                      <li>Each later rules edition's own levels and printed units, edition by edition</li>
                      <li>Shields absorbing damage on their own in play</li>
                    </ul>
                  </TextSection>

              <TextSection
            label="Other Unit Creators"
            className="grow with-margins large-max-width-50"
          >
                    <h4>Done</h4>
                    <ul>
                      <li><del>Combat Vehicles, OmniVehicles and Support Vehicles</del></li>
                      <li><del>Aerospace, conventional and OmniFighters</del></li>
                      <li><del>Conventional infantry and battle armor</del></li>
                      <li><del>ProtoMechs</del></li>
                      <li><del>Small Craft and DropShips</del></li>
                      <li><del>Buildings, gun emplacements and Castles Brian</del></li>
                      <li><del>JumpShips, WarShips and space stations</del></li>
                      <li><del>Save the current design before a load, import or start over replaces it</del></li>
                    </ul>
                    <h4>Coming</h4>
                    <ul>
                      <li>Mobile Structures</li>
                      <li>Earlier rules editions for each unit type, as their rulebooks are entered</li>
                      <li>Beast-mounted infantry, field guns and field artillery</li>
                      <li>A DropShip record sheet and Alpha Strike card of its own</li>
                      <li>Buildings in Alpha Strike</li>
                    </ul>
                  </TextSection>

              <TextSection
            label="Classic BattleTech Roster"
            className="grow with-margins large-max-width-50"
          >
                    <h4>Done</h4>
                    <ul>
                      <li><del>Apply heat, and manual adjustments</del></li>
                      <li><del>Take Damage dialog</del></li>
                      <li><del>Critical hit management</del></li>
                      <li><del>Play for every unit type the creators build, JumpShips and WarShips included</del></li>
                      <li><del><i>Battledroids</i> games</del></li>
                    </ul>
                    <h4>Coming</h4>
                    <ul>
                      <li>MechWarrior hits</li>
                      <li>Atmospheric and orbital movement for fighters</li>
                      <li>Cleanup, and workflow testing over many games</li>
                    </ul>
            </TextSection>

              <TextSection
            label="Imports and Exports"
            className="grow with-margins large-max-width-50"
          >
                    <h4>Coming</h4>
                    <ul>
                      <li>MegaMek and MegaMekLab files (.mtf, .blk) for every unit type, both ways</li>
                      <li>Solaris Skunk Werks export, and OmniMech configurations on import</li>
                      <li>HeavyMetal Pro and HeavyMetal Vee files (.hmp, .hmv)</li>
                      <li>The Drawing Board files (.dbm)</li>
                      <li>An import review screen that asks about anything it does not recognize</li>
                    </ul>
                  </TextSection>

              <TextSection
            label="General App"
            className="grow with-margins large-max-width-50"
          >
                    <h4>Possible Future</h4>
                    <ul>
                      <li>Google Drive Sign in/Sync</li>
                      <li>Office 365/ OneDrive Sign in/Sync</li>
                      <li>Dropbox Sign in/Sync</li>
                      <li>Apple iCloud Drive Sign in/Sync</li>
                      <li>NextCloud Sign in/Sync</li>
                    </ul>
                    <h4>Maybe, Someday</h4>
                    <ul>
                      <li>BattleTech Clix (WizKids) support</li>
                      <li>A simulator for the NOVA Combat Books</li>
                      <li>A BattleTech Collectible Card Game simulator</li>
                      <li>An AeroTech 2 play simulator</li>
                    </ul>
                  </TextSection>

            </div>
          </UIPage>
      );
    }
}

interface IDevelopmentStatusProps {
  appGlobals: IAppGlobals;
}

interface IDevelopmentStatusState {

}
