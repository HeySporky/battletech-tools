import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../../app-router';
import TextSection from '../../components/text-section';
import UIPage from '../../components/ui-page';
import { MdTableView } from "react-icons/md";
import { FaChessKnight } from "react-icons/fa";
const TableViewIcon = MdTableView as any;
const ChessKnight = FaChessKnight as any;

export default class AlphaStrikeHome extends React.Component<IAlphaStrikeHomeProps, IAlphaStrikeHomeState> {
    constructor(props: IAlphaStrikeHomeProps) {
        super(props);
        this.state = {
            updated: false,
        }

        this.props.appGlobals.makeDocumentTitle("AlphaStrikeHome");
    }

    render = (): JSX.Element => {
      return (
        <UIPage current="alpha-strike-home" appGlobals={this.props.appGlobals}>

          <TextSection
            label="Alpha Strike"
          >
              <div className="icon-links">
                <Link  to={`${process.env.PUBLIC_URL}/alpha-strike/roster`}>
                  <TableViewIcon />
                  Alpha Strike Roster
                </Link>
                <Link  to={`${process.env.PUBLIC_URL}/alpha-strike/aces`}>
                  <ChessKnight />
                  BattleTech: Aces
                </Link>
              </div>
           </TextSection>

        </UIPage>
      );
    }
}

interface IAlphaStrikeHomeProps {
  appGlobals: IAppGlobals;
}

interface IAlphaStrikeHomeState {
    updated: boolean;

}