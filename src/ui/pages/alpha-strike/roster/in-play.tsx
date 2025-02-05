import React from 'react';
import { FaArrowCircleLeft, FaCog } from "react-icons/fa";
import { Link } from 'react-router-dom';
import AlphaStrikeGroup from '../../../../classes/alpha-strike-group';
import { CONST_BATTLETECH_URL } from '../../../../configVars';
import { IASPilotAbility } from '../../../../data/alpha-strike-pilot-abilities';
import { getSpecialAbilityTypeName, IASSpecialAbility } from '../../../../data/alpha-strike-special-abilities';
import { IAppGlobals } from '../../../app-router';
import BattleTechLogo from '../../../components/battletech-logo';
import StandardModal from '../../../components/standard-modal';
import AlphaStrikeUnitCard from '../../../components/alpha-strike-play-card';
import './in-play.scss';
import { IFormationBonus } from '../../../../data/formation-bonuses';
import { OpForBehavior } from '../../../../data/bryms-opfor-behaviors';
import InputCheckbox from '../../../components/form_elements/input_checkbox';

export default class AlphaStrikeRosterInPlay extends React.Component<IInPlayProps, IInPlayState> {

    constructor(props: IInPlayProps) {
        super(props);

        this.state = {
            updated: false,
            showPilotAbility: null,
            showSpecialAbility: null,
            showAlphaStrikeSettings: false,
            showFormationBonus: null,
            showOpForBehavior: null,
        };

        this.props.appGlobals.makeDocumentTitle("Playing Alpha Strike");
    }

    resetGroup = (
      e: React.FormEvent<HTMLButtonElement>,
      group: AlphaStrikeGroup,
    ): void => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      this.props.appGlobals.openConfirmDialog(
        "Confirmation",
        "Are you sure you want to reset all the units to full status?",
        "Yes",
        "No, Thank you",
        () => {
          for( let unit of group.members ) {
            if( unit && unit.reset ) {
              unit.reset();
            }

          }

          this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
        }
      )
    }

    toggleAlphaStrikeMeasurementsInHexes = (
        e: React.FormEvent<HTMLSpanElement>
      ): void => {

        if( e && e.preventDefault ) e.preventDefault();

        let appSettings = this.props.appGlobals.appSettings;

        appSettings.alphaStrikeMeasurementsInHexes = !appSettings.alphaStrikeMeasurementsInHexes;
        this.props.appGlobals.saveAppSettings( appSettings );
    }

    showPilotAbility = ( ability: IASPilotAbility ): void => {
      this.setState({
        showPilotAbility: ability,
      })
    };

    showSpecialAbility = (
      e: React.FormEvent<HTMLAnchorElement>,
      ability: IASSpecialAbility
    ): void => {
      e.preventDefault();
      this.setState({
        showSpecialAbility: ability,
      })
    };

    showFormationBonus = (e: React.FormEvent<HTMLAnchorElement>, bonus: IFormationBonus ): void => {
      e.preventDefault();
      this.setState({
        showFormationBonus: bonus,
      })
    };

    closeModal = (): void => {
      this.setState({
        showSpecialAbility: null,
        showFormationBonus: null,
        showPilotAbility: null,
        showOpForBehavior: null,
        showAlphaStrikeSettings: false,
      })
    }

    nextRound = (
      e: React.FormEvent<HTMLSpanElement>
    ): void => {
      if( e && e.preventDefault ) e.preventDefault();

      this.props.appGlobals.openConfirmDialog(
        "Next Round",
        "Ending the round will apply all the pending updates to all units heat and damage.",
        "Next Round",
        "Cancel",
        () => {
          if (this.props.appGlobals.currentASForce) {
            for (let group of this.props.appGlobals.currentASForce.groups) {
              for( let unit of group.members ) {
                unit.applyRound();

                // Leave units in hull down, otherwise reset their token
                if (unit.moveToken.type !== 'hull down') {
                  unit.moveToken = {
                    move: 0,
                    currentMove: 0,
                    currentSprint: 0,
                    type: '',
                    tmm: 0,
                  }
                }
                
                // Apply HarJel where applicable
                let harjel = unit.getAbilityValues('BHJ').damage - 1;
                if (harjel > 0 && unit.getCurrentArmor() > 0) {
                  for (let index = unit.currentArmor.length - 1; index > -1; index--) {
                    if (unit.currentArmor[index] && harjel > 0) {
                      unit.currentArmor[index] = false;
                      harjel--;
                    }
                  }
                }   
              }
            }
            // Roll new behaviors
            this.reRollOpForBehavior();

            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );

          }  
        }
      )
    }

    showOpForBehavior = (
      e: React.FormEvent<HTMLAnchorElement>,
      behavior: OpForBehavior,
    ): void => {
      e.preventDefault();
      this.setState({
        showOpForBehavior: behavior,
      })
    };

    reRollOpForBehavior = (): void => {
      if (this.props.appGlobals.currentASForce) {
        for (let group of this.props.appGlobals.currentASForce?.groups) {
          for (let unit of group.members) {
            if (unit && unit.currentBehavior) {
              unit.currentBehavior = {
                name: "",
                quarry: "",
                movement: "",
                attack: "",
                reroll: false
              }
              unit.rollOpForBehavior();
            }
          }
        }
        // Save the behaviors.
        this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
      }
    }

    // This is really gross, but I'm not sure else how to turn the behavior strings into HTML so they can use italics and bold.
    behaviorHTML = (text: string) => {
      return { __html: text};
    }

    showSettings = (): void => {
      this.setState({
        showAlphaStrikeSettings: true,
      });
    }

    setAlphaStrikeMeasurementsInHexes = ( event: React.FormEvent<HTMLInputElement>): void => {
      let appSettingsHome = this.props.appGlobals.appSettings;
      appSettingsHome.alphaStrikeMeasurementsInHexes = event.currentTarget.checked;
      this.props.appGlobals.saveAppSettings( appSettingsHome );
    }

    setAlphaStrikeAIMode = ( event: React.FormEvent<HTMLInputElement>): void => {
      let appSettingsHome = this.props.appGlobals.appSettings;
      appSettingsHome.alphaStrikeAIMode = event.currentTarget.checked;
      this.props.appGlobals.saveAppSettings( appSettingsHome );
    }

    setAlphaStrikeVariableDamage = (event: React.FormEvent<HTMLSelectElement> ): void => {
      let appSettingsHome = this.props.appGlobals.appSettings;
      appSettingsHome.alphaStrikeVariableDamage = event.currentTarget.value;
      this.props.appGlobals.saveAppSettings( appSettingsHome );
    }

    setAlphaStrikeCombatRolls = ( event: React.FormEvent<HTMLInputElement>): void => {
      let appSettingsHome = this.props.appGlobals.appSettings;
      appSettingsHome.alphaStrikeCombatRolls = event.currentTarget.checked;
      this.props.appGlobals.saveAppSettings( appSettingsHome );

      // Get rid of any move tokens.
      if (this.props.appGlobals.currentASForce && !appSettingsHome.alphaStrikeCombatRolls) {
        for (let group of this.props.appGlobals.currentASForce.groups) {
          for( let unit of group.members ) {
              unit.moveToken = {
                move: 0,
                currentMove: 0,
                currentSprint: 0,
                type: '',
                tmm: 0,
              }
          }
        }
        this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
      }
    }

    render = (): JSX.Element => {
      if(!this.props.appGlobals.currentASForce) {
        return <></>;
      }
      return (
        <>
{this.state.showPilotAbility ? (
<StandardModal
  title={this.state.showPilotAbility.ability+ " (" + this.state.showPilotAbility.cost + ")"}
  show={true}
  onClose={this.closeModal}
>
  <div className='text-center'><em>Pilot Special Ability</em> - <span title="Alpha Strike Commander's Edition">p{this.state.showPilotAbility.asce_page}</span></div>
  {this.state.showPilotAbility.summary.map( (line, lineIndex) => {
    return (
      <p key={lineIndex}>{line}</p>
    )
  })}
</StandardModal>
) : null}

{this.state.showSpecialAbility ? (
<StandardModal
  title={this.state.showSpecialAbility.rawTag + ": " + this.state.showSpecialAbility.name}
  show={true}
  onClose={this.closeModal}
>
  <div className='text-center'><em>{getSpecialAbilityTypeName(this.state.showSpecialAbility.type)}</em> - <span title="Alpha Strike Commander's Edition">p{this.state.showSpecialAbility.asce_page}</span></div>

  {this.state.showSpecialAbility.summary.map( (line, lineIndex) => {
    return (
      <p key={lineIndex}>{line}</p>
    )
  })}
</StandardModal>
) : null}

{this.state.showFormationBonus ? (
<StandardModal
  title={this.state.showFormationBonus.Name}
  show={true}
  onClose={this.closeModal}
>
{this.state.showFormationBonus.BonusDescription}
</StandardModal>
) : null}

{this.state.showOpForBehavior ? (
<StandardModal
  title={this.state.showOpForBehavior.name}
  show={true}
  onClose={this.closeModal}
>
  <div className=''>
    <h3>Quarry</h3>
    <p dangerouslySetInnerHTML={this.behaviorHTML(this.state.showOpForBehavior.quarry)}></p>
  </div>

  <div className=''>
    <h3>Movement</h3>
    <p dangerouslySetInnerHTML={this.behaviorHTML(this.state.showOpForBehavior.movement)}></p>
  </div>

  <div className=''>
    <h3>Attack</h3>
    <p dangerouslySetInnerHTML={this.behaviorHTML(this.state.showOpForBehavior.attack)}></p>
  </div>
  
</StandardModal>
) : null }

{this.state.showAlphaStrikeSettings ? (
<StandardModal
  title='Alpha Strike Settings'
  show={true}
  onClose={this.closeModal}
>

    <InputCheckbox
      label='Display Measurements in Hexes'
      checked={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
      onChange={this.setAlphaStrikeMeasurementsInHexes}
    />

    <InputCheckbox
      label='Enable Combat Rolls & Movement Tokens'
      checked={this.props.appGlobals.appSettings.alphaStrikeCombatRolls}
      onChange={this.setAlphaStrikeCombatRolls}
      description='This will add interactive movement tokens, buttons to roll critical hits, and enable attack buttons.'
    />

    <label>
      Damage Calculations:
      <select
        value={this.props.appGlobals.appSettings.alphaStrikeVariableDamage}
        onChange={this.setAlphaStrikeVariableDamage}
        disabled={!this.props.appGlobals.appSettings.alphaStrikeCombatRolls}
      >
        <option value="">Standard (one roll, full damage)</option>
        <option value="damage">Multiple Damage Rolls</option>
        <option value="attack">Multiple Attack Rolls</option>
      </select>
      <div className='small-text'>Choose between standard and variable damage rules for combat rolls.</div>
    </label>

    <InputCheckbox
      label='Enable generated behaviors'
      checked={this.props.appGlobals.appSettings.alphaStrikeAIMode}
      onChange={this.setAlphaStrikeAIMode}
      description="Adds a button to generate behaviors based on Brym's OpFor for units."
    />


  
</StandardModal>
) : null }

        <header className="play-bar flex-grid justified">
          <Link title="Click here to leave Play Mode (don't worry, you won't lose your current mech statuses)" className="current" to={`${process.env.PUBLIC_URL}/alpha-strike-roster`}><FaArrowCircleLeft /></Link>
          
          {this.props.appGlobals.appSettings.alphaStrikeAIMode ? (
            <button title="Roll behaviors for all units" className="" onClick={this.reRollOpForBehavior}>Generate Behaviors</button>
          ) : null }

          <button title="Apply damage and heat changes to end the round and start another" className="" onClick={this.nextRound}>Next Round</button>

          <button title="Settings" onClick={() => this.showSettings()}>
            <FaCog />
          </button>

        </header>
          {this.props.appGlobals.currentASForce.groups.map( (group, groupIndex) => {
            if( group.members.length === 0) {
              return (<></>);
            }
            return (
              <React.Fragment key={groupIndex}>
              <div className="in-play-group flex-grid">
                <div className='group-title row justified'>
                  <h2>
                  {group.getName(groupIndex + 1)}
                  </h2>
                  {group.formationBonus! && group.formationBonus!.Name !== "None" ?(
                      <a href="/" onClick={(e) => this.showFormationBonus(e, group.formationBonus!)}><strong>Formation Type</strong>:&nbsp;
                      {group.formationBonus!.Name}</a>
                  ) : null
                  }
                  

                  <div className='data-pair large'>
                    {group.isUnderStrength() ? (
                      <button
                        className="btn-primary"
                        title={"Click here to reset the damage for this " + group.groupLabel + ". You'll be prompted for confirmation."}
                        onClick={(e) => this.resetGroup( e, group )}
                      >
                        Reset Lance
                      </button>
                    ) : null}
                    <span>PV:</span>{group.getTotalPoints()}
                  </div>
                </div>

                
                <div className="section-content">
                  <div className={"flex-grid"}>
                  {group.members.map( (unit, unitIndex) => {
                    // if( unitIndex === 0 && group.members[unitIndex +1 ])

                    // let newInstance = new AlphaStrikeUnit( unit.export() );
                    return (
                    <React.Fragment key={unitIndex}>
                      <div className="unit-card">
                        <AlphaStrikeUnitCard
                          asUnit={unit}
                          appGlobals={this.props.appGlobals}
                          measurementsInHexes={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
                          showSpecialAbility={this.showSpecialAbility}
                          showPilotAbility={this.showPilotAbility}
                          showOpForBehavior={this.showOpForBehavior}
                        />
                      </div>
                    </React.Fragment>
                    )
                  })}

                  </div>
              </div>
              </div>
            </React.Fragment>
            )
          })}
          <footer className='flex-grid center'>
            <a
                href={CONST_BATTLETECH_URL}
                rel="noopener noreferrer"
                target="_blank"
                title="Click here to go to the official BattleTech website!"
            >
                <BattleTechLogo
                />
            </a>
          </footer>
        </>
      );
    }
}

interface IInPlayProps {
  appGlobals: IAppGlobals;

}

interface IInPlayState {
  updated: boolean;
  showPilotAbility: IASPilotAbility | null;
  showSpecialAbility: IASSpecialAbility | null;
  showFormationBonus: IFormationBonus | null;
  showOpForBehavior: OpForBehavior | null;
  showAlphaStrikeSettings: boolean;
}