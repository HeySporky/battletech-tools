import * as React from 'react';
import { Route, Routes } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import Home from './home';
import BattleArmorCreatorChassis from './chassis';
import BattleArmorCreatorEquipment from './equipment';
import BattleArmorCreatorSummary from './summary';
import BattleArmorCreatorRecordSheet from './record-sheet';

import type { JSX } from "react";

export default class BattleArmorCreatorRouter extends React.Component<IBattleArmorCreatorRouterProps> {

    render = (): JSX.Element => {
        return (
            <Routes>
                <Route path={``} element={
                    <Home appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`chassis`} element={
                    <BattleArmorCreatorChassis appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`equipment`} element={
                    <BattleArmorCreatorEquipment appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`summary`} element={
                    <BattleArmorCreatorSummary appGlobals={this.props.appGlobals} />
                }/>

                <Route path={`record-sheet`} element={
                    <BattleArmorCreatorRecordSheet appGlobals={this.props.appGlobals} />
                }/>

                <Route path="*" element={
                    <Error404 appGlobals={this.props.appGlobals} />
                }/>
            </Routes>
        );
    }
}

interface IBattleArmorCreatorRouterProps {
    appGlobals: IAppGlobals;
}
