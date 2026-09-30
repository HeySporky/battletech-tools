import * as React from 'react';
import { Route, Routes } from "react-router";
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import AcesCampaignPage from './campaign';
import AcesGamePage from './game';
import AcesHome from './home';
import AcesLibraryPage from './library';
import AcesPrintPage from './print';
import AcesRulesPage from './rules';

import type { JSX } from "react";

export default class AcesRouter extends React.Component<IAcesRouterProps, IAcesRouterState> {

    render = (): JSX.Element => {
        return(
            <Routes>
                <Route path={``} element={
                    <AcesHome
                        appGlobals={this.props.appGlobals}
                    />
                }/>
                <Route path={`game`} element={
                    <AcesGamePage
                        appGlobals={this.props.appGlobals}
                    />
                }/>
                <Route path={`campaign`} element={
                    <AcesCampaignPage
                        appGlobals={this.props.appGlobals}
                    />
                }/>
                <Route path={`library`} element={
                    <AcesLibraryPage
                        appGlobals={this.props.appGlobals}
                    />
                }/>
                <Route path={`print`} element={
                    <AcesPrintPage
                        appGlobals={this.props.appGlobals}
                    />
                }/>
                <Route path={`rules`} element={
                    <AcesRulesPage
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path="*" element={
                    <Error404
                        appGlobals={this.props.appGlobals}
                    />
                }/>
            </Routes>
        )
    }
}

interface IAcesRouterProps {
    appGlobals: IAppGlobals;
}

interface IAcesRouterState {

}
