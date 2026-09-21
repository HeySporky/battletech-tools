import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';
import VehicleCreatorStep1 from './step1';
import VehicleCreatorArmor from './armor';
import VehicleCreatorEquipmentSelection from './equipment-selection';
import VehicleCreatorEquipmentPlacement from './equipment-placement';
import VehicleCreatorSummary from './summary';
import VehicleCreatorRecordSheet from './record-sheet';

export default class VehicleCreatorRouter extends React.Component<IVehicleCreatorRouterProps, IVehicleCreatorRouterState> {

    render = (): JSX.Element => {
        return (<>
            <Routes>
                <Route path={``} element={
                    <Home appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`step1`} element={
                    <VehicleCreatorStep1 appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`armor`} element={
                    <VehicleCreatorArmor appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`equipment-selection`} element={
                    <VehicleCreatorEquipmentSelection appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`equipment-placement`} element={
                    <VehicleCreatorEquipmentPlacement appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`summary`} element={
                    <VehicleCreatorSummary appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`record-sheet`} element={
                    <VehicleCreatorRecordSheet appGlobals={this.props.appGlobals} />
                }/>

                <Route path="*" element={
                    <Error404 appGlobals={this.props.appGlobals} />
                }/>
            </Routes>
        </>);
    }
}

interface IVehicleCreatorRouterProps {
    appGlobals: IAppGlobals;
}

interface IVehicleCreatorRouterState {
}
