import React from 'react';
import { FaArrowCircleLeft, FaColumns } from "react-icons/fa";
import { FiRefreshCcw } from "react-icons/fi";
import { Link } from 'react-router-dom';
import AlphaStrikeGroup from '../../../../classes/alpha-strike-group';
import { CONST_BATTLETECH_URL } from '../../../../configVars';
import { IASPilotAbility } from '../../../../data/alpha-strike-pilot-abilities';
import { getSpecialAbilityTypeName, IASSpecialAbility } from '../../../../data/alpha-strike-special-abilities';
import { IAppGlobals } from '../../../app-router';
import BattleTechLogo from '../../../components/battletech-logo';
import StandardModal from '../../../components/standard-modal';
import AlphaStrikeUnitSVG from '../../../components/svg/alpha-strike-unit-svg';
import './in-play.scss';
import AlphaStrikeToggleRulerHexes from "./_toggleRulerHexes";

export default class AlphaStrikeRosterInPlay extends React.Component<IInPlayProps, IInPlayState> {

    constructor(props: IInPlayProps) {
        super(props);


        this.state = {
            updated: false,
            showPilotAbility: null,
            showSpecialAbility: null,
        };

        this.props.appGlobals.makeDocumentTitle("Playing Alpha Strike");
    }

    nextRound = (
      e: React.FormEvent<HTMLSpanElement>
    ): void => {
      if( e && e.preventDefault ) e.preventDefault();

      this.props.appGlobals.openConfirmDialog(
        "End Round",
        "Ending the round will apply all the pending updates to all units heat and damage.",
        "End Round",
        "Cancel",
        () => {
          if (this.props.appGlobals.currentASForce) {
            for (let group of this.props.appGlobals.currentASForce.groups) {
              for( let unit of group.members ) {
                unit.applyRound();
              }
            }
    
            this.props.appGlobals.saveCurrentASForce( this.props.appGlobals.currentASForce );
    
          }  
        }
      )

          
    } 

    toggleCardMode = (
      e: React.FormEvent<HTMLSpanElement>
    ): void => {

      if( e && e.preventDefault ) e.preventDefault();

      let appSettings = this.props.appGlobals.appSettings;

      if (appSettings.alphaStrikeInPlayColumns < 5) {
        appSettings.alphaStrikeInPlayColumns++;
      } else {
        appSettings.alphaStrikeInPlayColumns = 1;
      }

      this.props.appGlobals.saveAppSettings( appSettings );

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

    showPilotAbility = ( ability: IASPilotAbility ): void => {
      this.setState({
        showPilotAbility: ability,
      })
    };

    closePilotAbility = (
      e: React.FormEvent<HTMLButtonElement>
    ): void => {
      if( e && e.preventDefault ) e.preventDefault();

      this.setState({
        showPilotAbility: null,
      })
    }

    showSpecialAbility = (
      e: React.FormEvent<HTMLAnchorElement>,
      ability: IASSpecialAbility
    ): void => {
      e.preventDefault();
      this.setState({
        showSpecialAbility: ability,
      })
    };

    closeSpecialAbility = (
      e: React.FormEvent<HTMLButtonElement>
    ): void => {
      if( e && e.preventDefault ) e.preventDefault();

      this.setState({
        showSpecialAbility: null,
      })
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
  onClose={this.closePilotAbility}
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
  onClose={this.closeSpecialAbility}
>
  <div className='text-center'><em>{getSpecialAbilityTypeName(this.state.showSpecialAbility.type)}</em> - <span title="Alpha Strike Commander's Edition">p{this.state.showSpecialAbility.asce_page}</span></div>

  {this.state.showSpecialAbility.summary.map( (line, lineIndex) => {
    return (
      <p key={lineIndex}>{line}</p>
    )
  })}
</StandardModal>
) : null}

          <header className="topmenu">
          <ul className="main-menu">
                <li><Link title="Click here to leave Play Mode (don't worry, you won't lose your current mech statuses)" className="current" to={`${process.env.PUBLIC_URL}/alpha-strike-roster`}><FaArrowCircleLeft /></Link></li>

                <li title="Switch to showing 2+ cards per row"><span className="current" onClick={this.toggleCardMode}><FaColumns /> {this.props.appGlobals.appSettings.alphaStrikeInPlayColumns}</span></li>

                <li>
                  <AlphaStrikeToggleRulerHexes
                    appGlobals={this.props.appGlobals}
                  />
                </li>

                <li title="Apply damage and heat changes to end the round"><span className="" onClick={this.nextRound}>End Round</span></li>

                <li className="logo">
                    <a
                        href={CONST_BATTLETECH_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                        title="Click here to go to the official BattleTech website!"
                    >
                        <BattleTechLogo />
                    </a>
                </li>

            </ul>

          </header>
          {this.props.appGlobals.currentASForce.groups.map( (group, groupIndex) => {
            if( group.members.length === 0) {
              return (<></>);
            }
            return (
              <React.Fragment key={groupIndex}>
              <div className="text-section lr-margin">
                <h2>
                  {group.isUnderStrength() ? (
                    <button
                      className="pull-right btn-primary btn-sm"
                      title={"Click here to reset the damage for this " + group.groupLabel + ". You'll be prompted for confirmation."}
                      onClick={(e) => this.resetGroup( e, group )}
                    >
                      <FiRefreshCcw />&nbsp;Reset
                    </button>
                  ) : null}

                  {group.getName(groupIndex + 1)}
                </h2>
                <div className="section-content">
                  <div className={"flex-grid flex-" + this.props.appGlobals.appSettings.alphaStrikeInPlayColumns}>
                  {group.formationBonus!.Name!=="None"?(
                    <>
                    <div>
                      <p><strong>Bonus</strong>:&nbsp;
                      <em>{group.formationBonus!.Name}</em> - {group.formationBonus!.BonusDescription}</p>
                    </div>
                    </>
                  ) : null
                  }
                  {group.members.map( (unit, unitIndex) => {
                    // if( unitIndex === 0 && group.members[unitIndex +1 ])

                    // let newInstance = new AlphaStrikeUnit( unit.export() );
                    return (
                    <React.Fragment key={unitIndex}>
                      <div className="unit-card">
                        <AlphaStrikeUnitSVG
                          asUnit={unit}
                          inPlay={true}
                          appGlobals={this.props.appGlobals}
                          className="small-margins"
                          measurementsInHexes={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
                          showSpecialAbility={this.showSpecialAbility}
                          showPilotAbility={this.showPilotAbility}
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
        </>
      );
    }
}

interface IInPlayProps {
  appGlobals: IAppGlobals;

}

interface IInPlayState {
  updated: boolean;
  showPilotAbility: IASPilotAbility | null,
  showSpecialAbility: IASSpecialAbility | null
}