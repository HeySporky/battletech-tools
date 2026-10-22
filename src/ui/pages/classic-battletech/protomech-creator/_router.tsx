import * as React from 'react';
import { Route, Routes } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';
import ProtoMechCreatorChassis from './chassis';
import ProtoMechCreatorEquipment from './equipment';
import ProtoMechCreatorSummary from './summary';
import ProtoMechCreatorRecordSheet from './record-sheet';
import ProtoMechCreatorPrintAS from './print-as';

import type { JSX } from "react";

export default class ProtoMechCreatorRouter extends React.Component<IProtoMechCreatorRouterProps> {

    render = (): JSX.Element => {
        return (
            <Routes>
                <Route path={``} element={
                    <Home appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`chassis`} element={
                    <ProtoMechCreatorChassis appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`equipment`} element={
                    <ProtoMechCreatorEquipment appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`print-as`} element={
                    <ProtoMechCreatorPrintAS appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`summary`} element={
                    <ProtoMechCreatorSummary appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`record-sheet`} element={
                    <ProtoMechCreatorRecordSheet appGlobals={this.props.appGlobals} />
                }/>

                <Route path="*" element={
                    <Error404 appGlobals={this.props.appGlobals} />
                }/>
            </Routes>
        );
    }
}

interface IProtoMechCreatorRouterProps {
    appGlobals: IAppGlobals;
}
