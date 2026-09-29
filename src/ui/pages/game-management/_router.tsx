import * as React from 'react';
import { Route, Routes } from "react-router";
import { IAppGlobals } from '../../app-router';
import Error404 from "../error404";
import GameManagementHome from './home';
import MatchPlayRouter from './match-play/_router';

import type { JSX } from "react";

export default class GameManagementRouter extends React.Component<IGameManagementRouterProps, IGameManagementRouterState> {

    render = (): JSX.Element => {
        return(
            <Routes>

                <Route path={``} element={
                    <GameManagementHome
                        appGlobals={this.props.appGlobals}
                    />
                }/>
                <Route path={`match-play/*`} element={
                    <MatchPlayRouter
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

interface IGameManagementRouterProps {
    appGlobals: IAppGlobals;
}

interface IGameManagementRouterState {

}