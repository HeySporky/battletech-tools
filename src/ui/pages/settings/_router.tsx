import * as React from 'react';
import { Route, Routes } from "react-router";
import { IAppGlobals } from '../../app-router';
import Error404 from "../error404";
import SettingsBackupAndRestore from './backup-and-restore';
import SettingsHome from './home';

import type { JSX } from "react";

// The back-end editors (#97): loaded only when opened (the app router wraps every route in Suspense).
const EquipmentEditor = React.lazy(() => import("../equipment-editor"));
const CustomMULEditor = React.lazy(() => import("../custom-mul-editor"));

export default class SettingsRouter extends React.Component<ISettingsRouterProps, ISettingsRouterState> {

    render = (): JSX.Element => {
        return(
            <Routes>

                <Route path={``} element={
                    <SettingsHome
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`backup-and-restore`} element={
                    <SettingsBackupAndRestore
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`equipment-editor`} element={
                    <EquipmentEditor
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`custom-mul-editor`} element={
                    <CustomMULEditor
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

interface ISettingsRouterProps {
    appGlobals: IAppGlobals;
}

interface ISettingsRouterState {

}