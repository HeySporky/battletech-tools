import * as React from 'react';
import { Route, Routes } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';
import BuildingCreatorStructure from './structure';
import BuildingCreatorEquipment from './equipment';
import BuildingCreatorSummary from './summary';
import BuildingCreatorRecordSheet from './record-sheet';

import type { JSX } from "react";

export default class BuildingCreatorRouter extends React.Component<IBuildingCreatorRouterProps> {

    render = (): JSX.Element => {
        return (
            <Routes>
                <Route path={``} element={
                    <Home appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`structure`} element={
                    <BuildingCreatorStructure appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`equipment`} element={
                    <BuildingCreatorEquipment appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`summary`} element={
                    <BuildingCreatorSummary appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`record-sheet`} element={
                    <BuildingCreatorRecordSheet appGlobals={this.props.appGlobals} />
                }/>

                <Route path="*" element={
                    <Error404 appGlobals={this.props.appGlobals} />
                }/>
            </Routes>
        );
    }
}

interface IBuildingCreatorRouterProps {
    appGlobals: IAppGlobals;
}
