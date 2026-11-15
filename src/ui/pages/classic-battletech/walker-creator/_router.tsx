import * as React from 'react';
import { Route, Routes } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';
import WalkerCreatorChassis from './chassis';
import WalkerCreatorEquipment from './equipment';
import WalkerCreatorCriticals from './criticals';
import WalkerCreatorSummary from './summary';
import WalkerCreatorRecordSheet from './record-sheet';
import { CreatorPrintTRO, CreatorTechnicalReadoutStep } from '../../../components/creator-tro-pages';
import { WALKER_TRO } from '../creator-tro-configs';

import type { JSX } from "react";

// The routes open at any rules level: only the menu links are Custom Homebrew's, so a saved Walker always opens.
export default class WalkerCreatorRouter extends React.Component<IWalkerCreatorRouterProps> {

    render = (): JSX.Element => {
        return (
            <Routes>
                <Route path={``} element={
                    <Home appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`chassis`} element={
                    <WalkerCreatorChassis appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`equipment`} element={
                    <WalkerCreatorEquipment appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`criticals`} element={
                    <WalkerCreatorCriticals appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`summary`} element={
                    <WalkerCreatorSummary appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`technical-readout`} element={
                    <CreatorTechnicalReadoutStep appGlobals={this.props.appGlobals} config={WALKER_TRO} />
                }/>

                <Route path={`print-tro`} element={
                    <CreatorPrintTRO appGlobals={this.props.appGlobals} config={WALKER_TRO} />
                }/>

                <Route path={`record-sheet`} element={
                    <WalkerCreatorRecordSheet appGlobals={this.props.appGlobals} />
                }/>

                <Route path="*" element={
                    <Error404 appGlobals={this.props.appGlobals} />
                }/>
            </Routes>
        );
    }
}

interface IWalkerCreatorRouterProps {
    appGlobals: IAppGlobals;
}
