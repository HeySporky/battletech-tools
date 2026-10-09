import { FaArrowCircleLeft, FaPrint } from "react-icons/fa";
import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import BattleTechLogo from '../../../components/battletech-logo';
import './print.scss';
import BattleMechSVG from "../../../components/svg/battlemech-svg";
import { CONST_BATTLETECH_URL } from "../../../../configVars";
import RulesLevelStamp, { getHighestRulesLevel, printWithRulesLevelGuard } from "../../../components/rules-level-print";
import VehicleRecordSheet from "../../../components/vehicle-record-sheet";
import { vehicleName } from "./_vehicleGroupTable";
import FighterRecordSheet from "../../../components/fighter-record-sheet";
import InfantryRecordSheet from "../../../components/infantry-record-sheet";
import BattleArmorRecordSheet from "../../../components/battle-armor-record-sheet";
import ProtoMechRecordSheet from "../../../components/protomech-record-sheet";
import BattledroidsUnitRecordSheet from "../../../components/battledroids-unit-record-sheet";
import BuildingRecordSheet from "../../../components/building-record-sheet";
import { buildingSummary } from "./_buildingGroupTable";
import { fighterName } from "./_fighterGroupTable";
const ArrowCircleLeft = FaArrowCircleLeft as any;
const PrintIcon = FaPrint as any;

export default class ClassicBattleTechRosterPrint extends React.Component<IPrintProps, IPrintState> {
    constructor(props: IPrintProps) {
        super(props);

        this.state = {
            updated: false,
        };

        this.props.appGlobals.makeDocumentTitle("Printing CBT Force");
    }

    // Units above the selected rules level ask for confirmation before printing.
    print = (): void => {
      const groups = this.props.appGlobals.currentCBTForce?.groups ?? [];
      const rulesLevels = [
        ...groups.flatMap( (group) => group.members ).map( (unit) => unit.getRequiredRulesLevel() ),
        ...groups.flatMap( (group) => group.vehicles ).map( (vehicle) => vehicle.getRequiredRulesLevel() ),
        ...groups.flatMap( (group) => group.fighters ).map( (fighter) => fighter.getRequiredRulesLevel() ),
        ...groups.flatMap( (group) => group.infantry ).map( (platoon) => platoon.getRequiredRulesLevel() ),
        ...groups.flatMap( (group) => group.battleArmor ).map( (squad) => squad.getRequiredRulesLevel() ),
        ...groups.flatMap( (group) => group.protoMechs ).map( (point) => point.getRequiredRulesLevel() ),
        ...groups.flatMap( (group) => group.buildings ).map( (building) => building.getRequiredRulesLevel() ),
      ];
      printWithRulesLevelGuard(
        getHighestRulesLevel( rulesLevels ),
        this.props.appGlobals.appSettings.mechRulesFilter,
      );
    }

    render = (): JSX.Element => {
      if(!this.props.appGlobals.currentCBTForce) {
        return <></>;
      }
      return (
        <>
          <header className="topmenu">
            <ul className="main-menu">
                <li><Link title="Click here to leave Play Mode (don't worry, you won't lose your current mech statuses)" className="current" to={`${process.env.PUBLIC_URL}/classic-battletech/roster`}><ArrowCircleLeft /></Link></li>
                <li><span title="Click here open the Print Dialog" onClick={this.print} className="current" ><PrintIcon /></span></li>
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
          <div className={"summary-page"}>
            <br />
            <h1 className="text-center">Classic BattleTech Force Summary</h1>

          <table className="full-width">
            <tbody>
              <tr>
                <td className="text-center"><strong># Groups:</strong> {this.props.appGlobals.currentCBTForce.getTotalGroups()}</td>
                <td className="text-center"><strong># Units:</strong> {this.props.appGlobals.currentCBTForce.getTotalUnits()}</td>
                <td className="text-center"><strong>Tons:</strong> {this.props.appGlobals.currentCBTForce.getTotalTons()}</td>
                <td className="text-center"><strong>Tech:</strong> {this.props.appGlobals.currentCBTForce.getTech()}</td>
                <td className="text-center"><strong>Total BV2:</strong> {this.props.appGlobals.currentCBTForce.getTotalBV2()}</td>
              </tr>
            </tbody>
          </table>
            {/* <p className="text-right">

            <strong># Groups:</strong> {this.props.appGlobals.currentCBTForce.getTotalGroups()}<br />
            <strong># Units:</strong> {this.props.appGlobals.currentCBTForce.getTotalUnits()}<br />
            <strong>Tons:</strong> {this.props.appGlobals.currentCBTForce.getTotalTons()}<br />
            <strong>Tech:</strong> {this.props.appGlobals.currentCBTForce.getTech()}<br />
            <strong>Total BV2:</strong> {this.props.appGlobals.currentCBTForce.getTotalBV2()}</p> */}
            {this.props.appGlobals.currentCBTForce.groups.map( (group, groupIndex) => {
              return (
                <div className="group" key={groupIndex}>
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th
                          colSpan={2}
                          className="no-right-border"
                        >
                          {group.getName(groupIndex)}
                        </th>
                        <th
                          colSpan={5}
                          className="text-right"
                        >
                          # Units {group.getTotalUnits()}
                          &nbsp;|&nbsp;
                          {group.getTotalTons()} Tons - {group.getTech()}
                          &nbsp;|&nbsp;
                          Group BV2: {group.getTotaBV2()}
                        </th>
                      </tr>
                      <tr>
                        <th>
                          Unit Name
                        </th>
                        <th className="min-width no-wrap">
                        Tons
                        </th>
                        <th className="min-width no-wrap">
                        Tech
                        </th>
                        <th className="min-width no-wrap">
                        MW Piloting
                        </th>
                        <th className="min-width no-wrap">
                        MW Gunnery
                        </th>
                        <th className="min-width no-wrap">
                          Base BV2
                        </th>
                        <th className="min-width no-wrap">
                          Adjusted BV2
                        </th>
                      </tr>
                    </thead>
                    {group.members.map( (unit, unitIndex) => {
                    return (
                    <tbody key={unitIndex}>
                    <tr>
                        <td>
                          {unit.getName()}
                        </td>
                        <td>
                          {unit.getTonnage()}
                        </td>
                        <td className="small-text">
                          {unit.getTech().name}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {unit.pilot.piloting}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {unit.pilot.gunnery}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {unit.getBattleValue()}
                        </td>
                        <td className="min-width no-wrap text-right">
                          {unit.getPilotAdjustedBattleValue()}
                        </td>
                      </tr>
                    </tbody>
                    )
                    })}
                    {group.vehicles.map( (vehicle) => (
                    <tbody key={vehicle.getUUID()}>
                      <tr>
                        <td>
                          {vehicleName(vehicle)} ({vehicle.getMotiveType().name})
                        </td>
                        <td>
                          {vehicle.getTonnage()}
                        </td>
                        <td className="small-text">
                          {vehicle.getTech().name}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {vehicle.getPilot().piloting}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {vehicle.getPilot().gunnery}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {vehicle.getBattleValue()}
                        </td>
                        <td className="min-width no-wrap text-right">
                          {vehicle.getPilotAdjustedBattleValue()}
                        </td>
                      </tr>
                    </tbody>
                    ))}
                    {group.fighters.map( (fighter) => (
                    <tbody key={fighter.getUUID()}>
                      <tr>
                        <td>
                          {fighterName(fighter)} ({fighter.getFighterTypeName()})
                        </td>
                        <td>
                          {fighter.getTonnage()}
                        </td>
                        <td className="small-text">
                          {fighter.getTech().name}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {fighter.getPilot().piloting}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {fighter.getPilot().gunnery}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {fighter.getBattleValue()}
                        </td>
                        <td className="min-width no-wrap text-right">
                          {fighter.getPilotAdjustedBattleValue()}
                        </td>
                      </tr>
                    </tbody>
                    ))}
                    {group.infantry.map( (platoon) => (
                    <tbody key={platoon.getUUID()}>
                      <tr>
                        <td>
                          {platoon.getDisplayName()} ({platoon.getMotive().name} infantry, {platoon.getTroopers()} troopers)
                        </td>
                        <td>
                          {platoon.getWeight()}
                        </td>
                        <td className="small-text">
                          {platoon.getTechName()}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {platoon.canMakeAntiMechAttacks() ? platoon.getAntiMechSkill() : "-"}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {platoon.getGunnery()}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {platoon.getBattleValue()}
                        </td>
                        <td className="min-width no-wrap text-right">
                          {platoon.getSkillAdjustedBattleValue()}
                        </td>
                      </tr>
                    </tbody>
                    ))}
                    {group.battleArmor.map( (squad) => (
                    <tbody key={squad.getUUID()}>
                      <tr>
                        <td>
                          {squad.getDisplayName()} ({squad.getWeightClass().name} battle armor, {squad.getSquadSize()} troopers)
                        </td>
                        <td>
                          {squad.getSquadSize()}
                        </td>
                        <td className="small-text">
                          {squad.isClan() ? "Clan" : "Inner Sphere"}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {squad.getCapabilities().swarm || squad.getCapabilities().leg ? squad.getAntiMechSkill() : "-"}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {squad.getGunnery()}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {squad.getBattleValue()}
                        </td>
                        <td className="min-width no-wrap text-right">
                          {squad.getSkillAdjustedBattleValue()}
                        </td>
                      </tr>
                    </tbody>
                    ))}
                    {group.protoMechs.map( (point) => (
                    <tbody key={point.getUUID()}>
                      <tr>
                        <td>
                          {point.getDisplayName()} ({point.getTons()}-ton {point.getChassisName()} ProtoMech, Point of {point.getPointSize()})
                        </td>
                        <td>
                          {point.getTons() * point.getPointSize()}
                        </td>
                        <td className="small-text">
                          {point.getTechName()}
                        </td>
                        <td className="min-width no-wrap text-center">
                          -
                        </td>
                        <td className="min-width no-wrap text-center">
                          {point.getGunnery()}
                        </td>
                        <td className="min-width no-wrap text-center">
                          {point.getPointBattleValue()}
                        </td>
                        <td className="min-width no-wrap text-right">
                          {point.getSkillAdjustedPointBattleValue()}
                        </td>
                      </tr>
                    </tbody>
                    ))}
                    {group.battledroidsUnits.map( (unit) => (
                    <tbody key={unit.getUUID()}>
                      <tr>
                        <td>
                          {unit.getDisplayName()} ({unit.getKind().name}, Battledroids p.{unit.getDesign().page})
                        </td>
                        <td>-</td>
                        <td className="small-text">Battledroids</td>
                        <td className="min-width no-wrap text-center">-</td>
                        <td className="min-width no-wrap text-center">
                          {unit.getGunnery()}
                        </td>
                        <td className="min-width no-wrap text-center">-</td>
                        <td className="min-width no-wrap text-right">-</td>
                      </tr>
                    </tbody>
                    ))}
                    {group.buildings.map( (building) => (
                    <tbody key={building.getUUID()}>
                      <tr>
                        <td>
                          {building.getDisplayName()} ({buildingSummary(building)})
                        </td>
                        <td>-</td>
                        <td className="small-text">
                          {building.getTech().name}
                        </td>
                        <td className="min-width no-wrap text-center">-</td>
                        <td className="min-width no-wrap text-center">
                          {building.getMinimumGunners() > 0 ? building.getGunnery() : "-"}
                        </td>
                        <td className="min-width no-wrap text-center">-</td>
                        <td className="min-width no-wrap text-right">-</td>
                      </tr>
                    </tbody>
                    ))}
                  </table>
                </div>
              )
            })}
            <div className="print-footer">
              <div className="print-logo">
                <BattleTechLogo />
              </div>
              <p>Printed using Jeff's BattleTech Tools IIC at https://{window.location.hostname}/battletech-tools/. Huge thanks to the Master Unit List</p>
              <p>MechWarrior, BattleMech, ‘Mech and AeroTech are registered trademarks of The Topps Company, Inc. All Rights Reserved.</p>
            </div>
          </div>
          {this.props.appGlobals.currentCBTForce.groups.map( (group, groupIndex) => {
            if( group.getTotalUnits() === 0) {
              return (<React.Fragment key={groupIndex}></React.Fragment>);
            }
            return (
              <React.Fragment key={groupIndex}>
              <div className="print-section">

                  {group.members.map( (unit, unitIndex) => {
                    return (

                    <React.Fragment key={unitIndex}>
                      <div className={"page"}>
                        <RulesLevelStamp
                          requiredRulesLevel={unit.getRequiredRulesLevel()}
                          provisionalNote={unit.isBattleValueProvisional() ? "provisional BV" : undefined}
                        />
                        <BattleMechSVG
                          mechData={unit}
                        />
                      </div>
                    </React.Fragment>
                    )
                  })}
                  {group.vehicles.map( (vehicle) => (
                      <div className={"page"} key={vehicle.getUUID()}>
                        <RulesLevelStamp
                          requiredRulesLevel={vehicle.getRequiredRulesLevel()}
                        />
                        <VehicleRecordSheet
                          vehicle={vehicle}
                          showCrew={true}
                          showDamage={true}
                        />
                      </div>
                  ))}
                  {group.fighters.map( (fighter) => (
                      <div className={"page"} key={fighter.getUUID()}>
                        <RulesLevelStamp
                          requiredRulesLevel={fighter.getRequiredRulesLevel()}
                        />
                        <FighterRecordSheet
                          fighter={fighter}
                          showPilot={true}
                          showDamage={true}
                        />
                      </div>
                  ))}
                  {group.infantry.map( (platoon) => (
                      <div className={"page"} key={platoon.getUUID()}>
                        <RulesLevelStamp
                          requiredRulesLevel={platoon.getRequiredRulesLevel()}
                        />
                        <InfantryRecordSheet
                          platoon={platoon}
                          showDamage={true}
                        />
                      </div>
                  ))}
                  {group.battleArmor.map( (squad) => (
                      <div className={"page"} key={squad.getUUID()}>
                        <RulesLevelStamp
                          requiredRulesLevel={squad.getRequiredRulesLevel()}
                        />
                        <BattleArmorRecordSheet
                          suit={squad}
                          showDamage={true}
                        />
                      </div>
                  ))}
                  {group.protoMechs.map( (point) => (
                      <div className={"page"} key={point.getUUID()}>
                        <RulesLevelStamp
                          requiredRulesLevel={point.getRequiredRulesLevel()}
                        />
                        <ProtoMechRecordSheet
                          proto={point}
                          showDamage={true}
                        />
                      </div>
                  ))}
                  {group.battledroidsUnits.map( (unit) => (
                      <div className={"page"} key={unit.getUUID()}>
                        <BattledroidsUnitRecordSheet
                          unit={unit}
                          showDamage={true}
                        />
                      </div>
                  ))}
                  {group.buildings.map( (building) => (
                      <div className={"page"} key={building.getUUID()}>
                        <RulesLevelStamp
                          requiredRulesLevel={building.getRequiredRulesLevel()}
                        />
                        <BuildingRecordSheet
                          building={building}
                          showDamage={true}
                        />
                      </div>
                  ))}

              </div>

            </React.Fragment>
            )
          })}

            {/* <footer className="print-footer">
              <div className="print-logo">
                <BattleTechLogo />
              </div>
              <p>Printed using Jeff's BattleTech Tools at https://heysporky.github.io/battletech-tools/. Huge thanks to the Master Unit List</p>
              <p>MechWarrior, BattleMech, ‘Mech and AeroTech are registered trademarks of The Topps Company, Inc. All Rights Reserved.</p>
            </footer> */}
            {/* <header className="print-header">&nbsp;</header> */}

        </>
      );
    }
}

interface IPrintProps {
  appGlobals: IAppGlobals;

}

interface IPrintState {
  updated: boolean;
}