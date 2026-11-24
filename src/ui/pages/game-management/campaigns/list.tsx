import React, { useState, type JSX } from 'react';
import { Link, useNavigate } from 'react-router';
import { Campaign, CAMPAIGN_SIDE_ROLES } from '../../../../classes/campaign/campaign';
import { CampaignSideRole, ICampaignSide } from '../../../../classes/campaign/campaign-types';
import { CAMPAIGN_EDITIONS, findCampaignEdition } from '../../../../data/campaign-editions';
import { findSpecialRuleset, RulesetCategory } from '../../../../data/special-rulesets';
import { generateUUID } from '../../../../utils/generateUUID';
import { EMPTY_RULESET_FILTER, IRulesetListFilter } from '../../../../utils/ruleset-list';
import { IAppGlobals } from '../../../app-router';
import RulesetList from '../../../components/special-rulesets/ruleset-list';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { readCampaign, useCampaigns } from './campaign-store';
import PlanetPicker from './planet-picker';

/** The new-campaign form: name, start date, planet (from a star system or free text), campaign rulesets, sides. */
function NewCampaign(props: { onCreate: (campaign: Campaign) => void; onCancel: () => void }): JSX.Element {
    const [name, setName] = useState("New Campaign");
    const [startDate, setStartDate] = useState("3025-01-01");
    const [systemId, setSystemId] = useState<string | null>(null);
    const [planet, setPlanet] = useState("");
    const [rulesetIds, setRulesetIds] = useState<string[]>([]);
    const [filter, setFilter] = useState<IRulesetListFilter>(EMPTY_RULESET_FILTER);
    const [openGroups, setOpenGroups] = useState<Partial<Record<RulesetCategory, boolean>>>({ campaign: true });
    const [moreInfo, setMoreInfo] = useState<string | null>(null);
    const [sides, setSides] = useState<ICampaignSide[]>([]);
    const [sideName, setSideName] = useState("");
    const [sideRole, setSideRole] = useState<CampaignSideRole>("attacker");
    const [editionId, setEditionId] = useState("");

    const toggle = (ids: string[]) => setRulesetIds((ticked) => {
        let next = [...ticked];
        for (const id of ids) next = next.includes(id) ? next.filter((t) => t !== id) : next.concat(id);
        return next;
    });

    const addSide = () => {
        if (!sideName.trim()) return;
        setSides(sides.concat({ id: generateUUID(), name: sideName.trim(), role: sideRole }));
        setSideName("");
    };

    const create = () => {
        const campaign = new Campaign();
        campaign.name = name.trim() || "Campaign";
        campaign.startDate = /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : "3025-01-01";
        campaign.editionId = findCampaignEdition(editionId)?.id ?? null;
        campaign.rulesetIds = rulesetIds;
        campaign.sides = sides;
        campaign.planet = planet.trim()
            ? { systemId, name: planet.trim(), areas: [], customDotTypes: [], customCombinations: [] }
            : null;
        campaign.addLog("Campaign started");
        props.onCreate(campaign);
    };

    return (
        <div className="campaign-new">
            <p>
                <label>Campaign name <input type="text" value={name} onChange={(e) => setName(e.currentTarget.value)} /></label>
                <label>Start date <input type="text" value={startDate} placeholder="3025-01-01" onChange={(e) => setStartDate(e.currentTarget.value)} /></label>
                <label>
                    Edition{" "}
                    <select value={editionId} onChange={(e) => setEditionId(e.currentTarget.value)}>
                        <option value="">No edition rules</option>
                        {CAMPAIGN_EDITIONS.map((edition) => <option key={edition.id} value={edition.id}>{edition.name}</option>)}
                    </select>
                </label>
            </p>
            <PlanetPicker systemId={systemId} name={planet} onChange={(id, name) => { setSystemId(id); setPlanet(name); }} />
            <h4>Campaign rulesets</h4>
            <RulesetList tickedIds={rulesetIds} filter={filter} onFilter={setFilter} openGroups={openGroups}
                onGroupToggle={(category, isOpen) => setOpenGroups({ ...openGroups, [category]: isOpen })}
                onToggle={toggle} onMoreInfo={(id) => setMoreInfo(moreInfo === id ? null : id)} categories={["campaign"]} />
            {moreInfo ? <p className="smaller-text">{describeRuleset(moreInfo)}</p> : null}
            <h4>Sides</h4>
            <ul>{sides.map((side) => <li key={side.id}>{side.name} ({side.role}) <button type="button" className="btn btn-link btn-sm" onClick={() => setSides(sides.filter((s) => s.id !== side.id))}>Remove</button></li>)}</ul>
            <p>
                <label>Side name <input type="text" value={sideName} onChange={(e) => setSideName(e.currentTarget.value)} /></label>
                <label>
                    Role{" "}
                    <select value={sideRole} onChange={(e) => setSideRole(e.currentTarget.value as CampaignSideRole)}>
                        {CAMPAIGN_SIDE_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                </label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addSide}>Add side</button>
            </p>
            <p>
                <button type="button" className="btn btn-primary" disabled={sides.length === 0} onClick={create}>Create campaign</button>{" "}
                <button type="button" className="btn btn-secondary" onClick={props.onCancel}>Cancel</button>
                {sides.length === 0 ? <span className="smaller-text"> Add at least one side.</span> : null}
            </p>
        </div>
    );
}

const describeRuleset = (id: string): string => {
    const ruleset = findSpecialRuleset(id);
    return ruleset ? `${ruleset.name}: ${ruleset.description} Source: ${ruleset.source.title}.` : "";
};

export default function CampaignList(props: { appGlobals: IAppGlobals }): JSX.Element {
    const { campaigns, saveAll } = useCampaigns(props.appGlobals);
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    const remove = (id: string, name: string) => {
        props.appGlobals.openConfirmDialog("Delete campaign", `Delete the campaign '${name}'? This cannot be undone.`, "Delete", "Cancel",
            () => saveAll((campaigns ?? []).filter((c) => c.id !== id)));
    };

    return (
        <UIPage current="game-management-campaigns" appGlobals={props.appGlobals}>
            <div className="campaign-page">
                <TextSection label="Campaigns">
                    {campaigns === null ? <p>Loading...</p> : campaigns.length === 0 ? <p>No campaigns yet.</p> : (
                        <table className="campaign-table">
                            <thead><tr><th>Name</th><th>Edition</th><th>Step</th><th></th></tr></thead>
                            <tbody>
                                {campaigns.map((data) => {
                                    const { campaign, error } = readCampaign(data);
                                    return (
                                        <tr key={data.id}>
                                            <td>{data.name}</td>
                                            <td>{findCampaignEdition(data.editionId)?.name ?? "No edition rules"}</td>
                                            <td>{campaign ? <>{campaign.timeStep} {data.step} ({campaign.currentDate()})</> : <span className="smaller-text">Cannot be opened: {error}</span>}</td>
                                            <td>
                                                {campaign ? <><Link className="btn btn-primary btn-sm" to={data.id}>Open</Link>{" "}</> : null}
                                                <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(data.id, data.name)}>Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    {!creating ? <p><button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>New campaign</button></p> : null}
                </TextSection>
                {creating && campaigns !== null ? (
                    <TextSection label="New campaign">
                        <NewCampaign onCancel={() => setCreating(false)} onCreate={(campaign) => {
                            saveAll(campaigns.concat(campaign.export()));
                            setCreating(false);
                            navigate(campaign.id);
                        }} />
                    </TextSection>
                ) : null}
            </div>
        </UIPage>
    );
}
