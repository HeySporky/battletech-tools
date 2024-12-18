import * as React from 'react';
import { Route, Routes } from "react-router-dom";
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';


export default class AlphaStrikeGameManagementRouter extends React.Component<IAlphaStrikeGameManagementRouterProps, IAlphaStrikeGameManagementRouterState> {

    render = (): JSX.Element => {
        return(
            <Routes>

                <Route path={``} element={
                    <Home
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

interface IAlphaStrikeGameManagementRouterProps {
    appGlobals: IAppGlobals;
}

interface IAlphaStrikeGameManagementRouterState {

}