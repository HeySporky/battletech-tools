import * as React from 'react';
import { Route, Routes } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';
import SmallCraftCreatorChassis from './chassis';
import SmallCraftCreatorArmor from './armor';
import SmallCraftCreatorEquipment from './equipment';
import SmallCraftCreatorCrew from './crew';
import SmallCraftCreatorSummary from './summary';
import SmallCraftCreatorRecordSheet from './record-sheet';
import SmallCraftCreatorPrintAS from './print-as';

import type { JSX } from "react";

export default class SmallCraftCreatorRouter extends React.Component<ISmallCraftCreatorRouterProps> {

    render = (): JSX.Element => {
        return (
            <Routes>
                <Route path={``} element={
                    <Home appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`chassis`} element={
                    <SmallCraftCreatorChassis appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`armor`} element={
                    <SmallCraftCreatorArmor appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`equipment`} element={
                    <SmallCraftCreatorEquipment appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`crew`} element={
                    <SmallCraftCreatorCrew appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`print-as`} element={
                    <SmallCraftCreatorPrintAS appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`summary`} element={
                    <SmallCraftCreatorSummary appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`record-sheet`} element={
                    <SmallCraftCreatorRecordSheet appGlobals={this.props.appGlobals} />
                }/>

                <Route path="*" element={
                    <Error404 appGlobals={this.props.appGlobals} />
                }/>
            </Routes>
        );
    }
}

interface ISmallCraftCreatorRouterProps {
    appGlobals: IAppGlobals;
}
