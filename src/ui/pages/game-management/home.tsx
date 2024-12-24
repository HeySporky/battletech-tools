import React from 'react';
import { Link } from 'react-router-dom';
import { IAppGlobals } from '../../app-router';
import TextSection from '../../components/text-section';
import UIPage from '../../components/ui-page';
import { MdTableView } from "react-icons/md";

export default class GameManagementHome extends React.Component<IGameManagementHomeProps, IGameManagementHomeState> {
    constructor(props: IGameManagementHomeProps) {
        super(props);
        this.state = {
            updated: false,
        }

        this.props.appGlobals.makeDocumentTitle("GameManagementHome");
    }

    render = (): JSX.Element => {
      return (
        <UIPage current="game-management-home" appGlobals={this.props.appGlobals}>

          <TextSection
            label="Game Management"
          >
              <div className="icon-links">
                <Link  to={`${process.env.PUBLIC_URL}/game-management/match-play`}>
                  <MdTableView />
                  Alpha Strike Match Play
                </Link>
              </div>
           </TextSection>

        </UIPage>
      );
    }
}

interface IGameManagementHomeProps {
  appGlobals: IAppGlobals;
}

interface IGameManagementHomeState {
    updated: boolean;

}