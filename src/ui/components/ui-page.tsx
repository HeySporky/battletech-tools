import React, { type JSX } from 'react';
import { IAppGlobals } from '../app-router';
import ErrorBoundary from './error-boundary';
import ShowAlerts from './show-alerts';
import TopMenu from './top-menu';

export default class UIPage extends React.Component<IUIPageProps, IUIPageState> {

    render = (): JSX.Element => {
        return (
        <div className={this.props.appGlobals.showMobile ? "ui-page show-mobile" : "ui-page"}>
          <TopMenu current={this.props.current} sub={this.props.sub} appGlobals={this.props.appGlobals} />
          <main className="content">
            {/* Each page's sections are h2s; the site's name is the page heading for screen readers. */}
            <h1 className="visually-hidden">Jeff's BattleTech Tools</h1>
            <ShowAlerts appGlobals={this.props.appGlobals} />
            <ErrorBoundary>{this.props.children}</ErrorBoundary>
          </main>
        </div>
        )
    }
}

interface IUIPageProps {
    appGlobals: IAppGlobals;
    current?: string;
    sub?: string;
    children?: React.ReactNode | React.ReactNode[];
  }

  interface IUIPageState {
      updated: boolean;

  }