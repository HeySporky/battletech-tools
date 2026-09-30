
import React, { type JSX } from 'react';
import { FaArrowCircleLeft, FaPrint } from "react-icons/fa";
import { Link } from 'react-router';
import { CONST_BATTLETECH_URL } from '../../configVars';
import { IAppGlobals } from '../app-router';
import BattleTechLogo from './battletech-logo';
import RulesLevelStamp, { printWithRulesLevelGuard } from './rules-level-print';
import ErrorBoundary from './error-boundary';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const Print = FaPrint as any;

export default class PrintablePage extends React.Component<IPrintablePageProps, IPrintablePageState> {

    // Guard against printing a unit above the selected rules level by mistake.
    print = (): void => {
        printWithRulesLevelGuard(this.props.requiredRulesLevel, this.props.appGlobals.appSettings.mechRulesFilter);
    }

    render = (): JSX.Element => {
        return (
        <>
          <div className="print-bar">
            <a
                href={CONST_BATTLETECH_URL}
                rel="noopener noreferrer"
                target="_blank"
                title="Click here to go to the official BattleTech website!"
                className="pull-right"
            >
                <BattleTechLogo />
            </a>

            <Link
              to={this.props.backTo}
              className="pull-left"
            >
              <button className="btn btn-primary">
                <ArrowCircleLeft />
              </button>
            </Link>
            <button
              className="btn btn-primary"
              onClick={this.print}
            >
              <Print /> Print
            </button>
          </div>
          <div className="print-bg">
            <RulesLevelStamp requiredRulesLevel={this.props.requiredRulesLevel} provisionalNote={this.props.provisionalNote} />
            <ErrorBoundary showSettingsLink={true}>{this.props.children}</ErrorBoundary>
          </div>
        </>
        )
    }
}

interface IPrintablePageProps {
    appGlobals: IAppGlobals;
    backTo: string;
    /** Lowest rules level the printed unit is legal at; stamps and guards printing above Standard. */
    requiredRulesLevel?: number;
    provisionalNote?: string;
    children?: React.ReactNode | React.ReactNode[];
  }

  interface IPrintablePageState {
      updated: boolean;

  }