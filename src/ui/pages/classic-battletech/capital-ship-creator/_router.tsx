import * as React from 'react';
import { Route, Routes } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';
import CapitalShipCreatorChassis from './chassis';
import CapitalShipCreatorArmor from './armor';
import CapitalShipCreatorEquipment from './equipment';
import CapitalShipCreatorCrew from './crew';
import CapitalShipCreatorSummary from './summary';
import CapitalShipCreatorRecordSheet from './record-sheet';
import CapitalShipCreatorPrintAS from './print-as';

import type { JSX } from "react";

export default class CapitalShipCreatorRouter extends React.Component<ICapitalShipCreatorRouterProps> {

    render = (): JSX.Element => {
        return (
            <Routes>
                <Route path={``} element={<Home appGlobals={this.props.appGlobals} />} />
                <Route path={`chassis`} element={<CapitalShipCreatorChassis appGlobals={this.props.appGlobals} />} />
                <Route path={`armor`} element={<CapitalShipCreatorArmor appGlobals={this.props.appGlobals} />} />
                <Route path={`equipment`} element={<CapitalShipCreatorEquipment appGlobals={this.props.appGlobals} />} />
                <Route path={`crew`} element={<CapitalShipCreatorCrew appGlobals={this.props.appGlobals} />} />
                <Route path={`summary`} element={<CapitalShipCreatorSummary appGlobals={this.props.appGlobals} />} />
                <Route path={`record-sheet`} element={<CapitalShipCreatorRecordSheet appGlobals={this.props.appGlobals} />} />
                <Route path={`print-as`} element={<CapitalShipCreatorPrintAS appGlobals={this.props.appGlobals} />} />
                <Route path="*" element={<Error404 appGlobals={this.props.appGlobals} />} />
            </Routes>
        );
    }
}

interface ICapitalShipCreatorRouterProps {
    appGlobals: IAppGlobals;
}
