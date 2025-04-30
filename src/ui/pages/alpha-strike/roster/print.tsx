import React from 'react';
import { FaArrowCircleLeft, FaBan, FaCheckCircle, FaPrint } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { CONST_BATTLETECH_URL } from '../../../../configVars';
import { IAppGlobals } from '../../../app-router';
import BattleTechLogo from '../../../components/battletech-logo';
import AlphaStrikePilotCardSVG from '../../../components/svg/alpha-strike-pilot-card-svg';
import AlphaStrikePrintUnitSVG from '../../../components/svg/alpha-strike-print-unit';
import './print.scss';
import AlphaStrikeToggleRulerHexes from "./_toggleRulerHexes";
import AlphaStrikeUnitToken from '../../../components/svg/alpha-strike-unit-token';
import AlphaStrikeGroup from '../../../../classes/alpha-strike-group';

export default class AlphaStrikeRosterPrint extends React.Component<IPrintProps, IPrintState> {
    constructor(props: IPrintProps) {
        super(props);

        this.state = {
            updated: false,
            tokens: true,
        };

        this.props.appGlobals.makeDocumentTitle("Printing Alpha Strike Force");
    }

    private _toggleTokens = (): void => {
      this.setState({
        tokens: !this.state.tokens,
      });
    }

    render = (): JSX.Element => {
      // Create a running list of pilot ability cards to render on the last page.
      let forceSPAs: any[] = [];
      let formationBonus: any[] = [];

      let pages: PrintPage[] = [];
      pages.push({
        units: 0,
        groups: [],
      });

      if(!this.props.appGlobals.currentASForce) {
        return <></>;
      }

      
      for (let group of this.props.appGlobals.currentASForce.groups) {
        // Find a home for this group
        let placed = false;
        for (let index = 0; index < pages.length; index++) {
          // Check all the pages to see if it'll fit
          if (pages[index].units + group.members.length + (group.members.length % 2) < 9) {
            pages[index].units = pages[index].units + group.members.length + (group.members.length % 2);
            pages[index].groups.push(group);
            placed = true;
          }
        }
        // If it didn't fit, make a new page
        if (!placed) {
          pages.push({
            units: group.members.length,
            groups: [group],
          });
        }
        // Grab the formation bonus for later
        if (group.formationBonus?.Name !== 'None') {
          formationBonus.push(group.formationBonus);
        }
      }

      return (
        <>
          <header className="topmenu">
          <ul className="main-menu">
                <li><Link title="Click here to leave Play Mode (don't worry, you won't lose your current mech statuses)" className="current" to={`${process.env.PUBLIC_URL}/alpha-strike/roster`}><FaArrowCircleLeft /></Link></li>
                <li><span title="Click here open the Print Dialog" onClick={() => window.print()} className="current" ><FaPrint /></span></li>
                <li>
                  <AlphaStrikeToggleRulerHexes
                    appGlobals={this.props.appGlobals}
                  />

                </li>
                <li><span title="Click here to toggle printing unit tokens" onClick={() => this._toggleTokens()} className="current" >
                  {this.state.tokens ? (<FaCheckCircle />) : <FaBan /> }
                  </span></li>

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

              <div className="header-message">Note: Don't forget to uncheck "headers and footers" to save ink and unnecessary spacing.</div>

          </header>
          <div className="print-cards">
            {pages.map( (page) => {
              if( page.groups.length === 0) {
                return (<></>);
              }
              return <div className={"print-section"}>
              {page.groups.map( (group, groupIndex) => {
                if( group.members.length === 0) {
                  return (<></>);
                }
                return (
                  <React.Fragment key={groupIndex}>
                    <div className='section-header'>
                      <h2>{group.getName(groupIndex + 1)}</h2>
                      {group.formationBonus!.Name!=="None"?(
                        <div className="lance-bonus">
                            <strong>Bonus</strong>:&nbsp;
                            <em>{group.formationBonus!.Name}</em>
                        </div>
                      ) : null}
                      <div className="units-summary">
                      {group.getTotalPoints()} points - {group.getTotalUnits()} units
                      </div>
                    </div>

                    <div className="section-content">
                      {group.members.map( (unit, unitIndex) => {
                        // Add the pilot's abilities to the cards we need to print at the end.
                        if (unit.getPilotAbilityList().length > 0) {
                          forceSPAs.push(
                            {
                              abilities: unit.getPilotAbilities(),
                              totalCost: unit.getTotalPilotAbilityPoints(),
                              variant: unit.customName ? unit.customName : unit.variant,
                              class: unit.class ? unit.class : unit.name.replace(unit.variant, " ").trim(),
                            }
                          );
                        }
                      
                        return (

                        <React.Fragment key={unitIndex}>
                          <div className={"unit-card"}>
                            <AlphaStrikePrintUnitSVG
                              asUnit={unit}
                              inPlay={false}
                              forPrint={true}
                              appGlobals={this.props.appGlobals}
                              measurementsInHexes={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
                            />
                          </div>
                        </React.Fragment>
                        )
                      })}
                      

                      </div>

                </React.Fragment>
                )
              })}
              
              </div>
            })}

          {/* Print out the SPAs for the units in this force. */}
          {forceSPAs.length > 0 || formationBonus.length > 0 ? (
          <div className="print-section">
            <div className='section-header'>
              <h2>Formation Bonuses and Special Pilot Abilities</h2>
            </div>
            <div className='section-content'>
              {formationBonus.map( (bonus, bonusIndex) => {
                  return <div className='ability-card' key={bonusIndex}>
                    
                        <div className="lance-bonus">
                            <strong>Bonus</strong>:&nbsp;
                            <em>{bonus.Name}</em> - {bonus.BonusDescription}
                        </div>
                      
                </div>;
                
              })}
              {forceSPAs.map( (unit, unitIndex) => {
                return (
                  <div className={"ability-card"} key={unitIndex}>
                    <AlphaStrikePilotCardSVG
                      pilotAbilities={unit.abilities}
                      totalCost={unit.totalCost}
                      unitVariant={unit.variant}
                      unitClass={unit.class}
                      inPlay={false}
                      appGlobals={this.props.appGlobals}
                      measurementsInHexes={this.props.appGlobals.appSettings.alphaStrikeMeasurementsInHexes}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          ) : null}

          {/* Print out unit tokens for each unit in the force */}
          {this.state.tokens ? (
            <div className={"print-section "}>
              <div className='section-header'>
                <h2>Unit Tokens</h2>
              </div>
              <div className="section-content tokens">
            {this.props.appGlobals.currentASForce.groups.map( (group, groupIndex) => {
              if( group.members.length === 0) {
                return (<></>);
              }
              return (
                <React.Fragment key={groupIndex}>
                    {group.members.map( (unit, unitIndex) => {
                    
                      return (

                      <React.Fragment key={unitIndex}>
                          <AlphaStrikeUnitToken
                            asUnit={unit}
                            groupName={group.getName(groupIndex + 1)}
                            appGlobals={this.props.appGlobals}
                          />
                      </React.Fragment>
                      )
                    })}

              </React.Fragment>
              )
            })}
            
              </div>
            </div>
          ) : null }

            <footer className="print-footer">
              <div className="print-logo">
                <BattleTechLogo
                        width={120}
                        baseColor='rgb(35,31,32)'
                        altColor='rgb(105,106,108)'
                    />
              </div>
              <p>Printed using Jeff's BattleTech Tools IIC at https://{window.location.hostname}/battletech-tools/. Huge thanks to the Master Unit List</p>
              <p>MechWarrior, BattleMech, ‘Mech and AeroTech are registered trademarks of The Topps Company, Inc. All Rights Reserved.</p>
            </footer>
          </div>


        </>
      );
    }
}

interface IPrintProps {
  appGlobals: IAppGlobals;

}

interface PrintPage {
  units: number,
  groups: AlphaStrikeGroup[],
}

interface IPrintState {
  updated: boolean;
  tokens: boolean;
}