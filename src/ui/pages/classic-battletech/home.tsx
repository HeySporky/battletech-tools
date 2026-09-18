import React from 'react';
import { Link } from 'react-router-dom';
import { IAppGlobals } from '../../app-router';
import TextSection from '../../components/text-section';
import UIPage from '../../components/ui-page';
import { GiMissileMech } from "react-icons/gi";
import { MdTableView } from 'react-icons/md';
const MissileMechIcon = GiMissileMech as any;
const TableViewIcon = MdTableView as any;


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

                  <Link  to={`${process.env.PUBLIC_URL}/classic-battletech/roster`}>
                    <TableViewIcon />
                    Classic BattleTech Roster
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