import * as React from 'react';
import { Route, Routes } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';
import MicroMechCreatorChassis from './chassis';
import MicroMechCreatorEquipment from './equipment';
import MicroMechCreatorSummary from './summary';
import MicroMechCreatorRecordSheet from './record-sheet';
import MicroMechCreatorPrintAS from './print-as';

import type { JSX } from "react";

// The routes open at any rules level: only the menu links are Custom Homebrew's, so a saved Micro-Mech always opens.
export default class MicroMechCreatorRouter extends React.Component<IMicroMechCreatorRouterProps> {

    render = (): JSX.Element => {
        return (
            <Routes>
                <Route path={``} element={
                    <Home appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`chassis`} element={
                    <MicroMechCreatorChassis appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`equipment`} element={
                    <MicroMechCreatorEquipment appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`summary`} element={
                    <MicroMechCreatorSummary appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`record-sheet`} element={
                    <MicroMechCreatorRecordSheet appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`print-as`} element={
                    <MicroMechCreatorPrintAS appGlobals={this.props.appGlobals} />
                }/>

                <Route path="*" element={
                    <Error404 appGlobals={this.props.appGlobals} />
                }/>
            </Routes>
        );
    }
}

interface IMicroMechCreatorRouterProps {
    appGlobals: IAppGlobals;
}
