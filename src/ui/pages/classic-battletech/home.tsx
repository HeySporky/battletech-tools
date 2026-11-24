import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../app-router';
import TextSection from '../../components/text-section';
import UIPage from '../../components/ui-page';
import { microMechCreatorOffered } from '../../components/micro-mech-offer';
import { walkerCreatorOffered } from '../../components/walker-offer';
import { GiBattleMech, GiBunker, GiJetFighter, GiMissileMech, GiRank3, GiSamusHelmet, GiSpaceShuttle, GiSpaceship, GiTank } from "react-icons/gi";
import { MdFactCheck, MdTableView } from 'react-icons/md';
const MissileMechIcon = GiMissileMech as any;
const TableViewIcon = MdTableView as any;
const AccuracyIcon = MdFactCheck as any;
const VehicleIcon = GiTank as any;
const FighterIcon = GiJetFighter as any;
const InfantryIcon = GiRank3 as any;
const BattleArmorIcon = GiSamusHelmet as any;
const ProtoMechIcon = GiBattleMech as any;
const MicroMechIcon = GiBattleMech as any;
const WalkerIcon = GiBattleMech as any;
const SmallCraftIcon = GiSpaceShuttle as any;
const CapitalShipIcon = GiSpaceship as any;
const BuildingIcon = GiBunker as any;


export default class ClassicBattleTechHome extends React.Component<IClassicBattleTechHomeProps, IClassicBattleTechHomeState> {
    constructor(props: IClassicBattleTechHomeProps) {
        super(props);
        this.state = {
            updated: false,
        }

        this.props.appGlobals.makeDocumentTitle("Classic BattleTech Home");
    }

    render = (): JSX.Element => {
      return (
        <UIPage current="classic-battletech-home" appGlobals={this.props.appGlobals}>

          <TextSection
            label="Classic BattleTech"
          >
              <div className="icon-links">
                  <Link className="mech-creator-link" to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator`}>
                    <MissileMechIcon />
                    'Mech Creator
                  </Link>

                  <Link className="mech-creator-link" to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator`}>
                    <VehicleIcon />
                    Vehicle Creator
                  </Link>

                  <Link className="mech-creator-link" to={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator`}>
                    <FighterIcon />
                    Fighter Creator
                  </Link>

                  <Link className="mech-creator-link" to={`${process.env.PUBLIC_URL}/classic-battletech/infantry-creator`}>
                    <InfantryIcon />
                    Infantry Creator
                  </Link>

                  <Link className="mech-creator-link" to={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator`}>
                    <BattleArmorIcon />
                    Battle Armor Creator
                  </Link>

                  <Link className="mech-creator-link" to={`${process.env.PUBLIC_URL}/classic-battletech/protomech-creator`}>
                    <ProtoMechIcon />
                    ProtoMech Creator
                  </Link>

                  {microMechCreatorOffered(this.props.appGlobals) ? (
                    <Link className="mech-creator-link" to={`${process.env.PUBLIC_URL}/classic-battletech/micro-mech-creator`}>
                      <MicroMechIcon />
                      Micro-Mech Creator (Custom Homebrew)
                    </Link>
                  ) : null}

                  {walkerCreatorOffered(this.props.appGlobals) ? (
                    <Link className="mech-creator-link" to={`${process.env.PUBLIC_URL}/classic-battletech/walker-creator`}>
                      <WalkerIcon />
                      Walker Creator (Custom Homebrew)
                    </Link>
                  ) : null}

                  <Link className="mech-creator-link" to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator`}>
                    <SmallCraftIcon />
                    Small Craft Creator
                  </Link>

                  <Link className="mech-creator-link" to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator`}>
                    <CapitalShipIcon />
                    JumpShip and WarShip Creator
                  </Link>

                  <Link className="mech-creator-link" to={`${process.env.PUBLIC_URL}/classic-battletech/building-creator`}>
                    <BuildingIcon />
                    Building Creator
                  </Link>

                  <Link  to={`${process.env.PUBLIC_URL}/classic-battletech/roster`}>
                    <TableViewIcon />
                    Classic BattleTech Roster
                  </Link>

                  <Link to={`${process.env.PUBLIC_URL}/classic-battletech/battle-value-accuracy`}>
                    <AccuracyIcon />
                    Battle Value Accuracy
                  </Link>
              </div>

            </TextSection>

        </UIPage>
      );
    }
}

interface IClassicBattleTechHomeProps {
  appGlobals: IAppGlobals;
}

interface IClassicBattleTechHomeState {
    updated: boolean;

}