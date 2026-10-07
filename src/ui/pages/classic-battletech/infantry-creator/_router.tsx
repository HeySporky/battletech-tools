import * as React from 'react';
import { Route, Routes } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';
import InfantryCreatorPlatoon from './platoon';
import InfantryCreatorWeapons from './weapons';
import InfantryCreatorSummary from './summary';
import InfantryCreatorRecordSheet from './record-sheet';

import type { JSX } from "react";

export default class InfantryCreatorRouter extends React.Component<IInfantryCreatorRouterProps> {

    render = (): JSX.Element => {
        return (
            <Routes>
                <Route path={``} element={
                    <Home appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`platoon`} element={
                    <InfantryCreatorPlatoon appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`weapons`} element={
                    <InfantryCreatorWeapons appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`summary`} element={
                    <InfantryCreatorSummary appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`record-sheet`} element={
                    <InfantryCreatorRecordSheet appGlobals={this.props.appGlobals} />
                }/>

                <Route path="*" element={
                    <Error404 appGlobals={this.props.appGlobals} />
                }/>
            </Routes>
        );
    }
}

interface IInfantryCreatorRouterProps {
    appGlobals: IAppGlobals;
}
