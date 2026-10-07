import * as React from 'react';
import { Route, Routes } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';
import FighterCreatorChassis from './chassis';
import FighterCreatorArmor from './armor';
import FighterCreatorEquipment from './equipment';
import FighterCreatorSummary from './summary';

import type { JSX } from "react";

export default class FighterCreatorRouter extends React.Component<IFighterCreatorRouterProps> {

    render = (): JSX.Element => {
        return (
            <Routes>
                <Route path={``} element={
                    <Home appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`chassis`} element={
                    <FighterCreatorChassis appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`armor`} element={
                    <FighterCreatorArmor appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`equipment`} element={
                    <FighterCreatorEquipment appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`summary`} element={
                    <FighterCreatorSummary appGlobals={this.props.appGlobals} />
                }/>

                <Route path="*" element={
                    <Error404 appGlobals={this.props.appGlobals} />
                }/>
            </Routes>
        );
    }
}

interface IFighterCreatorRouterProps {
    appGlobals: IAppGlobals;
}
