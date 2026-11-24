import React, { type JSX } from 'react';
import { Route, Routes, useParams } from "react-router";
import { IAppGlobals } from '../../../app-router';
import Error404 from "../../error404";
import CampaignHome from './campaign-home';
import CampaignContractSheets from './contract-sheet';
import CampaignList from './list';
import CampaignPlanet from './planet';
import './campaigns.scss';

const Home = (props: { appGlobals: IAppGlobals }) => <CampaignHome appGlobals={props.appGlobals} id={useParams().id} />;
const Planet = (props: { appGlobals: IAppGlobals }) => <CampaignPlanet appGlobals={props.appGlobals} id={useParams().id} />;
const ContractSheets = (props: { appGlobals: IAppGlobals }) => <CampaignContractSheets appGlobals={props.appGlobals} id={useParams().id} />;

/** Campaign play (campaign plan, 2026-11-19): the list, one campaign, its planet's economy, its contract sheets (#639). */
export default function CampaignsRouter(props: { appGlobals: IAppGlobals }): JSX.Element {
    return (
        <Routes>
            <Route path={``} element={<CampaignList appGlobals={props.appGlobals} />} />
            <Route path={`:id`} element={<Home appGlobals={props.appGlobals} />} />
            <Route path={`:id/planet`} element={<Planet appGlobals={props.appGlobals} />} />
            <Route path={`:id/contract-sheet`} element={<ContractSheets appGlobals={props.appGlobals} />} />
            <Route path="*" element={<Error404 appGlobals={props.appGlobals} />} />
        </Routes>
    );
}
