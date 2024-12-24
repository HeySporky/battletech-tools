import * as React from 'react';
import { Route, Routes } from "react-router-dom";
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';


export default class MatchPlayRouter extends React.Component<IMatchPlayRouterProps, IMatchPlayRouterState> {

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

interface IMatchPlayRouterProps {
    appGlobals: IAppGlobals;
}

interface IMatchPlayRouterState {

}