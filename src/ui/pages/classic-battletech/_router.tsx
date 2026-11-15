import * as React from 'react';
import { Navigate, Route, Routes } from "react-router";
import { IAppGlobals } from '../../app-router';
import Error404 from "../error404";
import ClassicBattleTechHome from './home';

import type { JSX } from "react";

// Each creator and the roster load when opened, so no one chunk holds them all (#589).
const MechCreatorRouter = React.lazy(() => import("./mech-creator/_router"));
const BattleMechRosterRouter = React.lazy(() => import("./roster/_router"));
const VehicleCreatorRouter = React.lazy(() => import("./vehicle-creator/_router"));
const FighterCreatorRouter = React.lazy(() => import("./fighter-creator/_router"));
const InfantryCreatorRouter = React.lazy(() => import("./infantry-creator/_router"));
const BattleArmorCreatorRouter = React.lazy(() => import("./battle-armor-creator/_router"));
const ProtoMechCreatorRouter = React.lazy(() => import("./protomech-creator/_router"));
const MicroMechCreatorRouter = React.lazy(() => import("./micro-mech-creator/_router"));
const WalkerCreatorRouter = React.lazy(() => import("./walker-creator/_router"));
const SmallCraftCreatorRouter = React.lazy(() => import("./small-craft-creator/_router"));
const CapitalShipCreatorRouter = React.lazy(() => import("./capital-ship-creator/_router"));
const BuildingCreatorRouter = React.lazy(() => import("./building-creator/_router"));
const BvAccuracy = React.lazy(() => import("./bv-accuracy"));
const TroJbt = React.lazy(() => import("./tro-jbt"));
const TroReader = React.lazy(() => import("./tro-jbt").then((module) => ({ default: module.TroReader })));

export default class ClassicBattleTechRouter extends React.Component<IClassicBattleTechRouterProps, IClassicBattleTechRouterState> {

    render = (): JSX.Element => {
        return(
            <Routes>

                <Route path={``} element={
                    <ClassicBattleTechHome
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`mech-creator/*`} element={
                    <MechCreatorRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`vehicle-creator/*`} element={
                    <VehicleCreatorRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`fighter-creator/*`} element={
                    <FighterCreatorRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`infantry-creator/*`} element={
                    <InfantryCreatorRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`battle-armor-creator/*`} element={
                    <BattleArmorCreatorRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`protomech-creator/*`} element={
                    <ProtoMechCreatorRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`micro-mech-creator/*`} element={
                    <MicroMechCreatorRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`walker-creator/*`} element={
                    <WalkerCreatorRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`small-craft-creator/*`} element={
                    <SmallCraftCreatorRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`capital-ship-creator/*`} element={
                    <CapitalShipCreatorRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`building-creator/*`} element={
                    <BuildingCreatorRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`tro-jbt`} element={
                    <TroJbt
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                {["artvee", "ammunition", "micro-mechs"].map((slug) => (
                    <Route key={slug} path={`tro-jbt/${slug}`} element={
                        <TroReader
                            appGlobals={this.props.appGlobals}
                            slug={slug}
                        />
                    }/>
                ))}

                <Route path={`artvee-readout`} element={
                    <Navigate replace to={`${process.env.PUBLIC_URL}/classic-battletech/tro-jbt/artvee`} />
                }/>

                <Route path={`roster/*`} element={
                    <BattleMechRosterRouter
                        appGlobals={this.props.appGlobals}
                    />
                }/>

                <Route path={`battle-value-accuracy`} element={
                    <BvAccuracy
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

interface IClassicBattleTechRouterProps {
    appGlobals: IAppGlobals;
}

interface IClassicBattleTechRouterState {

}