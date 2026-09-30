import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import {
    AcesCampaign,
    AcesNamedPilot,
    calculateAcesSortieLedger,
    getAcesExistingForceWarchest,
    getAcesPilotSPToNext,
    getAcesPurchaseCost,
    getAcesRepairCost,
    getAcesSalePrice,
    getAcesSalvageTarget,
    getAcesSortiePVLimit,
    getAcesUnspentPVAsSP,
    IAcesRosterUnit,
    IAcesSortieLedgerInput,
    resolveAcesCrew,
    TAcesPilotColumn,
    TAcesPilotSortieStatus,
} from '../../../../classes/aces-campaign';
import {
    acesDifficultyLevels,
    acesPilotEdgeAbilityThresholds,
    acesPilotEdgeTokenThresholds,
    acesPilotSkillThresholds,
    ACES_MAX_NAMED_PILOTS,
    ACES_NAMED_PILOT_TYPES,
    ACES_STARTING_PV,
    IAcesPilotThreshold,
    TAcesRepairCategory,
} from '../../../../data/aces-rules';
import { generateUUID } from '../../../../utils/generateUUID';
import { getAcesCampaigns, saveAcesCampaigns } from '../../../../dataSaves';
import './aces.scss';

const emptyLedgerInput = (): IAcesSortieLedgerInput => {
    return {
        primaryObjectiveSP: 0,
        otherObjectivesSP: 0,
        spPercent: 100,
        reconnaissanceSP: 0,
        waypointSP: 0,
        unitsToRearm: 0,
        woundedOrKilledCrews: 0,
        newNamedPilots: 0,
        destroyedSize: 0,
        crippledSize: 0,
        structureOrCriticalSize: 0,
        armorOnlySize: 0,
    };
}

const ledgerFields: { key: keyof IAcesSortieLedgerInput, label: string }[] = [
    { key: "primaryObjectiveSP", label: "Primary objective SP" },
    { key: "otherObjectivesSP", label: "Other objectives SP" },
    { key: "reconnaissanceSP", label: "Reconnaissance SP spent" },
    { key: "waypointSP", label: "Waypoint SP (net cost; negative for gains)" },
    { key: "unitsToRearm", label: "Units to rearm (not ENE, not truly destroyed)" },
    { key: "woundedOrKilledCrews", label: "Wounded or killed crews" },
    { key: "newNamedPilots", label: "New Named Pilots" },
    { key: "destroyedSize", label: "Repair Size: destroyed" },
    { key: "crippledSize", label: "Repair Size: crippled" },
    { key: "structureOrCriticalSize", label: "Repair Size: structure or critical damage" },
    { key: "armorOnlySize", label: "Repair Size: armor only" },
];

const repairCategories: { id: TAcesRepairCategory, label: string }[] = [
    { id: "destroyed", label: "Destroyed (salvaged)" },
    { id: "crippled", label: "Crippled" },
    { id: "structure-or-critical", label: "Structure or critical damage" },
    { id: "armor-only", label: "Armor damage only" },
    { id: "none", label: "Undamaged" },
];

interface ISortieDraft {
    number: string;
    name: string;
    win: boolean;
    maxSPPerPilot: number;
    ledgerInput: IAcesSortieLedgerInput;
    pilotStatus: { [pilotId: string]: TAcesPilotSortieStatus };
    wounded: string[];
    mvpPilotId: string;
    keywords: string;
    purchases: number;
    sales: number;
    notes: string;
}

const newSortieDraft = ( campaign: AcesCampaign | null ): ISortieDraft => {
    const pilotStatus: { [pilotId: string]: TAcesPilotSortieStatus } = {};
    if( campaign ) {
        for( const pilot of campaign.getLivingPilots() ) {
            pilotStatus[pilot.id] = pilot.wounded ? "absent" : "participated";
        }
    }
    const ledgerInput = emptyLedgerInput();
    if( campaign ) ledgerInput.spPercent = campaign.getSPPercent();
    return {
        number: campaign ? "" + ( campaign.sorties.length + 1 ) : "1",
        name: "",
        win: true,
        maxSPPerPilot: 0,
        ledgerInput: ledgerInput,
        pilotStatus: pilotStatus,
        wounded: [],
        mvpPilotId: "",
        keywords: "",
        purchases: 0,
        sales: 0,
        notes: "",
    };
}

/** A pilot's status in the draft; pilots added after the draft was started take part unless wounded (Aces p.33). */
const getDraftStatus = ( draft: ISortieDraft, pilot: AcesNamedPilot ): TAcesPilotSortieStatus => {
    return draft.pilotStatus[pilot.id] || ( pilot.wounded ? "absent" : "participated" );
}

export default class AcesCampaignPage extends React.Component<IAcesCampaignPageProps, IAcesCampaignPageState> {
    constructor(props: IAcesCampaignPageProps) {
        super(props);
        this.state = {
            loaded: false,
            campaigns: [],
            currentId: "",
            newPilotCallsign: "",
            newPilotType: "BM",
            allocateAmount: {},
            sortie: newSortieDraft( null ),
            showSortie: false,
            salvageType: "BM",
            salvageRoll: 7,
            crewRoll: 7,
            crewKilled: false,
            crewStunned: false,
            repairType: "BM",
            repairSize: 2,
            repairCategory: "armor-only",
            listedPV: 0,
        }

        this.props.appGlobals.makeDocumentTitle("Aces Campaigns");
    }

    componentDidMount = async () => {
        const data = await getAcesCampaigns( this.props.appGlobals.appSettings );
        const campaigns = data.map( ( entry ) => new AcesCampaign( entry ) );
        this.setState({
            loaded: true,
            campaigns: campaigns,
            currentId: campaigns.length > 0 ? campaigns[0].id : "",
            sortie: newSortieDraft( campaigns.length > 0 ? campaigns[0] : null ),
        });
    }

    private _getCurrent = (): AcesCampaign | null => {
        return this.state.campaigns.find( ( campaign ) => campaign.id === this.state.currentId ) || null;
    }

    private _save = () => {
        saveAcesCampaigns( this.props.appGlobals.appSettings, this.state.campaigns.map( ( campaign ) => campaign.export() ) );
        this.setState({ campaigns: this.state.campaigns });
    }

    private _update = ( change: ( campaign: AcesCampaign ) => void ) => {
        const campaign = this._getCurrent();
        if( !campaign ) return;
        change( campaign );
        this._save();
    }

    private _num = ( value: string ): number => {
        const rv = +value;
        return isNaN( rv ) ? 0 : rv;
    }

    private _newCampaign = () => {
        const campaign = new AcesCampaign();
        campaign.name = "New Aces campaign";
        this.state.campaigns.push( campaign );
        this.setState({ currentId: campaign.id, sortie: newSortieDraft( campaign ) }, this._save );
    }

    private _deleteCampaign = () => {
        const campaign = this._getCurrent();
        if( !campaign ) return;
        this.props.appGlobals.openConfirmDialog(
            "Delete campaign?",
            "Delete \"" + campaign.name + "\" and its whole sortie log? This can't be undone.",
            "Delete",
            "Cancel",
            () => {
                const campaigns = this.state.campaigns.filter( ( entry ) => entry.id !== campaign.id );
                this.setState({
                    campaigns: campaigns,
                    currentId: campaigns.length > 0 ? campaigns[0].id : "",
                }, () => saveAcesCampaigns( this.props.appGlobals.appSettings, campaigns.map( ( entry ) => entry.export() ) ) );
            },
        );
    }

    private _selectCampaign = ( id: string ) => {
        const campaign = this.state.campaigns.find( ( entry ) => entry.id === id ) || null;
        this.setState({ currentId: id, sortie: newSortieDraft( campaign ), showSortie: false });
    }

    /* ----- roster ----- */

    private _importRoster = () => {
        const force = this.props.appGlobals.currentASForce;
        if( !force ) return;
        this._update( ( campaign ) => {
            for( const group of force.groups ) {
                for( const unit of group.members ) {
                    const entry: IAcesRosterUnit = {
                        id: generateUUID(),
                        chassis: unit.class || unit.name,
                        variant: unit.variant,
                        name: unit.name,
                        type: unit.type,
                        size: unit.size,
                        // Roster PV at Skill 4, which is what Aces force building and trading use (Aces pp.26, 36).
                        pv: unit.basePoints,
                        omni: ( unit.abilities || [] ).some( ( ability ) => ability.trim().toUpperCase() === "OMNI" ),
                        enhancedNoAmmo: ( unit.abilities || [] ).some( ( ability ) => ability.trim().toUpperCase() === "ENE" ),
                        status: "active",
                        mulID: unit.mulID,
                        notes: "",
                    };
                    campaign.roster.push( entry );
                }
            }
        } );
    }

    private _renderRoster = ( campaign: AcesCampaign ): JSX.Element => {
        const rosterPV = campaign.getRosterPV();
        const issues = campaign.getIssues();
        const pvPercent = campaign.getPVPercent();
        return (
            <>
                <div className="aces-inline">
                    <button className="btn btn-primary btn-sm" onClick={this._importRoster}>Add units from the current Alpha Strike roster</button>
                    <span>{campaign.getActiveRoster().length} active units, {rosterPV} PV (Skill 4)</span>
                    {campaign.sorties.length === 0 ? (
                        <span className="aces-muted">Unspent PV from {ACES_STARTING_PV}: {getAcesUnspentPVAsSP( rosterPV )} SP</span>
                    ) : null}
                </div>
                {issues.length > 0 ? (
                    <ul>
                        {issues.map( ( issue, index ) => (
                            <li key={index} className={issue.severity === "error" ? "aces-issue-error" : ""}>{issue.message}</li>
                        ) )}
                    </ul>
                ) : null}
                <table className="table tighter-padding">
                    <thead>
                        <tr><th>Unit</th><th>Type</th><th>Size</th><th>PV</th><th>Buy / sell</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                        {campaign.roster.map( ( unit ) => (
                            <tr key={unit.id} className={unit.status !== "active" ? "aces-muted" : ""}>
                                <td>{unit.name}{unit.omni ? " (OMNI)" : ""}{unit.enhancedNoAmmo ? " (ENE)" : ""}</td>
                                <td>{unit.type}</td>
                                <td>{unit.size}</td>
                                <td>{unit.pv}</td>
                                <td>{getAcesPurchaseCost( unit.pv )} / {getAcesSalePrice( unit.pv )} SP</td>
                                <td>
                                    <select value={unit.status} onChange={( e ) => { const value = e.currentTarget.value as IAcesRosterUnit["status"]; this._update( () => { unit.status = value; } ); }}>
                                        <option value="active">Active</option>
                                        <option value="truly-destroyed">Truly destroyed</option>
                                        <option value="sold">Sold</option>
                                    </select>
                                </td>
                                <td>
                                    <button className="btn btn-danger btn-sm" onClick={() => this._update( ( c ) => { c.roster = c.roster.filter( ( entry ) => entry.id !== unit.id ); } )}>Remove</button>
                                </td>
                            </tr>
                        ) )}
                    </tbody>
                </table>
                <fieldset className="fieldset">
                    <legend>Sortie PV limit (<em>Aces</em> pp.28-29)</legend>
                    <div className="aces-inline">
                        <span>Player force PV: {pvPercent}% of the sortie's listed PV</span>
                        <label>Listed PV:{" "}
                            <input type="number" className="aces-number" value={this.state.listedPV} onChange={( e ) => this.setState( { listedPV: this._num( e.currentTarget.value ) } )} />
                        </label>
                        <strong>Your limit: {getAcesSortiePVLimit( this.state.listedPV, pvPercent )} PV</strong>
                    </div>
                </fieldset>
            </>
        );
    }

    /* ----- pilots ----- */

    private _addPilot = () => {
        const callsign = this.state.newPilotCallsign.trim();
        if( !callsign ) return;
        this._update( ( campaign ) => {
            const pilot = new AcesNamedPilot();
            pilot.callsign = callsign;
            pilot.type = this.state.newPilotType;
            campaign.pilots.push( pilot );
        } );
        this.setState({ newPilotCallsign: "" });
    }

    private _renderTrack = ( pilot: AcesNamedPilot, column: TAcesPilotColumn, label: string, value: number, sp: number, thresholds: IAcesPilotThreshold[] ): JSX.Element => {
        const toNext = getAcesPilotSPToNext( thresholds, sp );
        const key = pilot.id + column;
        const amount = this.state.allocateAmount[key] || 0;
        return (
            <td>
                <strong>{label} {value}</strong> <span className="aces-muted">({sp} SP{toNext === null ? ", maxed" : ", " + toNext + " to next"})</span>
                {pilot.unallocatedSP > 0 && !pilot.killed ? (
                    <div>
                        <input
                            type="number"
                            className="aces-number"
                            min={0}
                            max={pilot.unallocatedSP}
                            value={amount || ""}
                            onChange={( e ) => this.setState( { allocateAmount: { ...this.state.allocateAmount, [key]: this._num( e.currentTarget.value ) } } )}
                        />{" "}
                        <button className="btn btn-primary btn-sm" onClick={() => {
                            this._update( () => { pilot.allocate( column, amount ); } );
                            this.setState( { allocateAmount: { ...this.state.allocateAmount, [key]: 0 } } );
                        }}>Allocate</button>
                    </div>
                ) : null}
            </td>
        );
    }

    private _renderPilots = ( campaign: AcesCampaign ): JSX.Element => {
        return (
            <>
                <table className="table tighter-padding">
                    <thead>
                        <tr><th>Pilot</th><th>Skill</th><th>Edge tokens</th><th>Edge abilities</th><th>Unallocated</th><th></th></tr>
                    </thead>
                    <tbody>
                        {campaign.pilots.map( ( pilot ) => (
                            <tr key={pilot.id} className={pilot.killed ? "aces-muted" : ""}>
                                <td>
                                    <strong>{pilot.callsign}</strong> ({pilot.type})
                                    <br /><span className="aces-muted">
                                        {pilot.totalSP} SP total, {pilot.sortiesPlayed} sorties, MVP x{pilot.mvpCount}
                                        {pilot.wounded ? ", wounded (sits out the next sortie)" : ""}{pilot.killed ? ", killed" : ""}
                                    </span>
                                    <br />
                                    <input
                                        type="text"
                                        placeholder="Edge abilities chosen"
                                        value={pilot.edgeAbilities.join( ", " )}
                                        onChange={( e ) => { const value = e.currentTarget.value; this._update( () => { pilot.edgeAbilities = value.split( "," ).map( ( entry ) => entry.trimStart() ); } ); }}
                                    />
                                </td>
                                {this._renderTrack( pilot, "skill", "Skill", pilot.skill, pilot.skillSP, acesPilotSkillThresholds )}
                                {this._renderTrack( pilot, "edgeTokens", "Edge", pilot.edgeTokens, pilot.edgeTokenSP, acesPilotEdgeTokenThresholds )}
                                {this._renderTrack( pilot, "edgeAbilities", "Abilities", pilot.edgeAbilityCount, pilot.edgeAbilitySP, acesPilotEdgeAbilityThresholds )}
                                <td>{pilot.unallocatedSP} SP</td>
                                <td>
                                    {!pilot.killed ? (
                                        <label><input type="checkbox" checked={pilot.wounded} onChange={( e ) => { const value = e.currentTarget.checked; this._update( () => { pilot.wounded = value; } ); }} /> Wounded</label>
                                    ) : null}{" "}
                                    <button className="btn btn-danger btn-sm" onClick={() => this.props.appGlobals.openConfirmDialog(
                                        "Remove pilot?",
                                        "Remove " + pilot.callsign + " from the campaign? Use this for mistakes; pilots killed in a sortie go to the memorial instead.",
                                        "Remove",
                                        "Cancel",
                                        () => this._update( ( c ) => { c.pilots = c.pilots.filter( ( entry ) => entry.id !== pilot.id ); } ),
                                    )}>Remove</button>
                                </td>
                            </tr>
                        ) )}
                    </tbody>
                </table>
                {campaign.getLivingPilots().length < ACES_MAX_NAMED_PILOTS ? (
                    <div className="aces-inline">
                        <label>Callsign:{" "}
                            <input type="text" value={this.state.newPilotCallsign} onChange={( e ) => this.setState( { newPilotCallsign: e.currentTarget.value } )} />
                        </label>
                        <label>Unit type:{" "}
                            <select value={this.state.newPilotType} onChange={( e ) => this.setState( { newPilotType: e.currentTarget.value } )}>
                                {ACES_NAMED_PILOT_TYPES.map( ( type ) => <option key={type} value={type}>{type}</option> )}
                            </select>
                        </label>
                        <button className="btn btn-primary btn-sm" onClick={this._addPilot}>Add Named Pilot</button>
                    </div>
                ) : null}
                {campaign.memorial.length > 0 ? (
                    <p className="aces-muted">Memorial: {campaign.memorial.join( ", " )}</p>
                ) : null}
            </>
        );
    }

    /* ----- after the sortie ----- */

    private _setSortie = ( changes: Partial<ISortieDraft> ) => {
        this.setState({ sortie: { ...this.state.sortie, ...changes } });
    }

    private _setLedger = ( key: keyof IAcesSortieLedgerInput, value: number ) => {
        this._setSortie( { ledgerInput: { ...this.state.sortie.ledgerInput, [key]: value } } );
    }

    private _recordSortie = () => {
        const campaign = this._getCurrent();
        if( !campaign ) return;
        const draft = this.state.sortie;
        const ledger = calculateAcesSortieLedger( draft.ledgerInput );
        const pilotStatus: { [pilotId: string]: TAcesPilotSortieStatus } = {};
        for( const pilot of campaign.getLivingPilots() ) {
            pilotStatus[pilot.id] = getDraftStatus( draft, pilot );
        }
        this._update( ( c ) => {
            c.recordSortie(
                {
                    datePlayed: new Date().toISOString(),
                    number: draft.number,
                    name: draft.name,
                    win: draft.win,
                    ledgerInput: { ...draft.ledgerInput },
                    earnings: ledger.earnings,
                    purchases: draft.purchases,
                    sales: draft.sales,
                    keywords: draft.keywords.split( "," ).map( ( keyword ) => keyword.trim() ).filter( ( keyword ) => keyword !== "" ),
                    mvpPilotId: draft.mvpPilotId,
                    notes: draft.notes,
                },
                draft.maxSPPerPilot,
                pilotStatus,
                draft.wounded,
            );
        } );
        this.setState({ sortie: newSortieDraft( campaign ), showSortie: false });
    }

    private _renderSortieWizard = ( campaign: AcesCampaign ): JSX.Element => {
        const draft = this.state.sortie;
        const ledger = calculateAcesSortieLedger( draft.ledgerInput );
        const salvageTarget = getAcesSalvageTarget( this.state.salvageType );
        const crew = resolveAcesCrew( this.state.crewRoll, this.state.crewKilled, this.state.crewStunned );
        const living = campaign.getLivingPilots();

        return (
            <>
                <div className="aces-inline">
                    <label>Sortie #:{" "}
                        <input type="text" className="aces-number" value={draft.number} onChange={( e ) => this._setSortie( { number: e.currentTarget.value } )} />
                    </label>
                    <label>Name:{" "}
                        <input type="text" value={draft.name} onChange={( e ) => this._setSortie( { name: e.currentTarget.value } )} />
                    </label>
                    <label>
                        <input type="checkbox" checked={draft.win} onChange={( e ) => this._setSortie( { win: e.currentTarget.checked } )} />
                        {" "}Sortie won
                    </label>
                </div>
                {!draft.win ? (
                    <p>A failed sortie skips every after-sortie step and is played again (<em>Aces</em> p.32). Only the loss is logged.</p>
                ) : (
                    <>
                        <div className="row">
                            <div className="col-lg-6">
                                <fieldset className="fieldset">
                                    <legend>Sortie Log (<em>Aces</em> pp.34, 37)</legend>
                                    <table className="table tighter-padding">
                                        <tbody>
                                            {ledgerFields.map( ( field ) => (
                                                <tr key={field.key}>
                                                    <td>{field.label}</td>
                                                    <td>
                                                        <input type="number" className="aces-number" value={draft.ledgerInput[field.key]} onChange={( e ) => this._setLedger( field.key, this._num( e.currentTarget.value ) )} />
                                                    </td>
                                                </tr>
                                            ) )}
                                            <tr><td>SP earned % (difficulty)</td><td>{draft.ledgerInput.spPercent}%</td></tr>
                                            <tr><th>Total income</th><th>{ledger.totalIncome}</th></tr>
                                            <tr><td>Rearming</td><td>{ledger.rearming}</td></tr>
                                            <tr><td>Personnel</td><td>{ledger.personnelWounded + ledger.personnelNewPilots}</td></tr>
                                            <tr><td>Repairs</td><td>{ledger.repairsDestroyed + ledger.repairsCrippled + ledger.repairsStructure + ledger.repairsArmor}</td></tr>
                                            <tr><th>Total expenses</th><th>{ledger.totalExpenses}</th></tr>
                                            <tr><th>Earnings</th><th>{ledger.earnings}</th></tr>
                                        </tbody>
                                    </table>
                                    <p className="aces-muted">Repair Sizes: 'Mechs use full Size, other units half Size, not rounded (<em>Aces</em> p.34).</p>
                                </fieldset>
                            </div>
                            <div className="col-lg-6">
                                <fieldset className="fieldset">
                                    <legend>Helpers (<em>Aces</em> pp.33-34)</legend>
                                    <div className="aces-inline">
                                        <label>Salvage: type{" "}
                                            <select value={this.state.salvageType} onChange={( e ) => this.setState( { salvageType: e.currentTarget.value } )}>
                                                {[ "BM", "CV", "BA", "CI" ].map( ( type ) => <option key={type} value={type}>{type}</option> )}
                                            </select>
                                        </label>
                                        <label>roll{" "}
                                            <input type="number" className="aces-number" value={this.state.salvageRoll} onChange={( e ) => this.setState( { salvageRoll: this._num( e.currentTarget.value ) } )} />
                                        </label>
                                        <span>{salvageTarget === null ? "No target listed" : ( this.state.salvageRoll >= salvageTarget ? "Salvaged" : "Truly destroyed" ) + " (" + salvageTarget + "+)"}</span>
                                    </div>
                                    <p className="aces-muted">Ammo critical without CASE, crashing while airborne, and emplacements are truly destroyed without a check.</p>
                                    <div className="aces-inline">
                                        <label>Crew roll{" "}
                                            <input type="number" className="aces-number" value={this.state.crewRoll} onChange={( e ) => this.setState( { crewRoll: this._num( e.currentTarget.value ) } )} />
                                        </label>
                                        <label><input type="checkbox" checked={this.state.crewKilled} onChange={( e ) => this.setState( { crewKilled: e.currentTarget.checked } )} /> Crew Killed or Unit Destroyed crit</label>
                                        <label><input type="checkbox" checked={this.state.crewStunned} onChange={( e ) => this.setState( { crewStunned: e.currentTarget.checked } )} /> Crew Stunned crit</label>
                                        <strong>{crew}</strong>
                                    </div>
                                    <div className="aces-inline">
                                        <label>Repair: type{" "}
                                            <select value={this.state.repairType} onChange={( e ) => this.setState( { repairType: e.currentTarget.value } )}>
                                                {[ "BM", "CV", "BA", "CI" ].map( ( type ) => <option key={type} value={type}>{type}</option> )}
                                            </select>
                                        </label>
                                        <label>Size{" "}
                                            <input type="number" className="aces-number" value={this.state.repairSize} onChange={( e ) => this.setState( { repairSize: this._num( e.currentTarget.value ) } )} />
                                        </label>
                                        <select value={this.state.repairCategory} onChange={( e ) => this.setState( { repairCategory: e.currentTarget.value as TAcesRepairCategory } )}>
                                            {repairCategories.map( ( category ) => <option key={category.id} value={category.id}>{category.label}</option> )}
                                        </select>
                                        <strong>{getAcesRepairCost( this.state.repairType, this.state.repairSize, this.state.repairCategory )} SP</strong>
                                    </div>
                                </fieldset>
                            </div>
                        </div>

                        <fieldset className="fieldset">
                            <legend>Named Pilots (<em>Aces</em> pp.33, 35)</legend>
                            <div className="aces-inline">
                                <label>Max SP per pilot for this outcome:{" "}
                                    <input type="number" className="aces-number" value={draft.maxSPPerPilot} onChange={( e ) => this._setSortie( { maxSPPerPilot: this._num( e.currentTarget.value ) } )} />
                                </label>
                                <label>MVP:{" "}
                                    <select value={draft.mvpPilotId} onChange={( e ) => this._setSortie( { mvpPilotId: e.currentTarget.value } )}>
                                        <option value="">None</option>
                                        {living.map( ( pilot ) => <option key={pilot.id} value={pilot.id}>{pilot.callsign}</option> )}
                                    </select>
                                </label>
                            </div>
                            <table className="table tighter-padding">
                                <tbody>
                                    {living.map( ( pilot ) => (
                                        <tr key={pilot.id}>
                                            <td>{pilot.callsign}{pilot.wounded ? " (wounded last sortie)" : ""}</td>
                                            <td>
                                                <select value={getDraftStatus( draft, pilot )} onChange={( e ) => this._setSortie( { pilotStatus: { ...draft.pilotStatus, [pilot.id]: e.currentTarget.value as TAcesPilotSortieStatus } } )}>
                                                    <option value="participated">Took part</option>
                                                    <option value="absent">Sat out (half share)</option>
                                                    <option value="killed">Killed</option>
                                                </select>
                                            </td>
                                            <td>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={draft.wounded.indexOf( pilot.id ) > -1}
                                                        onChange={( e ) => {
                                                            const checked = e.currentTarget.checked;
                                                            this._setSortie( { wounded: checked ? [ ...draft.wounded, pilot.id ] : draft.wounded.filter( ( id ) => id !== pilot.id ) } );
                                                        }}
                                                    /> Wounded this sortie
                                                </label>
                                            </td>
                                        </tr>
                                    ) )}
                                </tbody>
                            </table>
                            <p className="aces-muted">
                                Read the maximum SP per pilot from the sortie's outcome in your book. If earnings can't cover
                                every share they are split evenly and rounded down; pilots earn nothing when earnings are negative.
                            </p>
                        </fieldset>

                        <div className="aces-inline">
                            <label>Keywords (comma separated):{" "}
                                <input type="text" value={draft.keywords} onChange={( e ) => this._setSortie( { keywords: e.currentTarget.value } )} />
                            </label>
                            <label>Purchases (SP):{" "}
                                <input type="number" className="aces-number" value={draft.purchases} onChange={( e ) => this._setSortie( { purchases: this._num( e.currentTarget.value ) } )} />
                            </label>
                            <label>Sales (SP):{" "}
                                <input type="number" className="aces-number" value={draft.sales} onChange={( e ) => this._setSortie( { sales: this._num( e.currentTarget.value ) } )} />
                            </label>
                        </div>
                    </>
                )}
                <label>Notes:{" "}
                    <textarea value={draft.notes} onChange={( e ) => this._setSortie( { notes: e.currentTarget.value } )} />
                </label>
                <p>
                    <button className="btn btn-primary" onClick={this._recordSortie}>Record sortie</button>
                </p>
            </>
        );
    }

    private _renderSortieLog = ( campaign: AcesCampaign ): JSX.Element => {
        if( campaign.sorties.length === 0 ) {
            return <p className="aces-muted">No sorties played yet. Starting warchest: {campaign.startingWarchest} SP.</p>;
        }
        return (
            <table className="table tighter-padding">
                <thead>
                    <tr><th>#</th><th>Sortie</th><th>Result</th><th>Earnings</th><th>Pilot SP</th><th>Purchases</th><th>Sales</th><th>Warchest</th><th>Keywords</th></tr>
                </thead>
                <tbody>
                    {campaign.sorties.map( ( sortie ) => (
                        <tr key={sortie.id}>
                            <td>{sortie.number}</td>
                            <td>{sortie.name}{sortie.notes ? <><br /><span className="aces-muted">{sortie.notes}</span></> : null}</td>
                            <td>{sortie.win ? "Won" : "Failed"}</td>
                            <td>{sortie.earnings}</td>
                            <td>{sortie.namedPilotSP}</td>
                            <td>{sortie.purchases}</td>
                            <td>{sortie.sales}</td>
                            <td>{sortie.warchestBalance}</td>
                            <td>{sortie.keywords.join( ", " )}</td>
                        </tr>
                    ) )}
                </tbody>
            </table>
        );
    }

    private _renderSettings = ( campaign: AcesCampaign ): JSX.Element => {
        const rosterPV = campaign.getRosterPV();
        return (
            <>
                <div className="aces-inline">
                    <label>Name:{" "}
                        <input type="text" value={campaign.name} onChange={( e ) => { const value = e.currentTarget.value; this._update( ( c ) => { c.name = value; } ); }} />
                    </label>
                    <label>Campaign book:{" "}
                        <input type="text" placeholder="e.g. Scouring Sands" value={campaign.campaignBook} onChange={( e ) => { const value = e.currentTarget.value; this._update( ( c ) => { c.campaignBook = value; } ); }} />
                    </label>
                    <label>Difficulty:{" "}
                        <select value={campaign.difficulty} onChange={( e ) => { const value = e.currentTarget.value; this._update( ( c ) => { c.difficulty = value; } ); }}>
                            {acesDifficultyLevels.map( ( level ) => (
                                <option key={level.id} value={level.id}>{level.name} ({level.pvModifier > 0 ? "+" : ""}{level.pvModifier}% PV, {level.spPercent}% SP)</option>
                            ) )}
                        </select>
                    </label>
                </div>
                <div className="aces-inline">
                    <label><input type="checkbox" checked={campaign.existingForce} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( c ) => { c.existingForce = value; } ); }} /> Existing force from another campaign (<em>Aces</em> p.29)</label>
                    <label><input type="checkbox" checked={campaign.advancedForceCreation} onChange={( e ) => { const value = e.currentTarget.checked; this._update( ( c ) => { c.advancedForceCreation = value; } ); }} /> Advanced force creation (<em>Aces</em> p.26)</label>
                    <label>Starting warchest (SP):{" "}
                        <input type="number" className="aces-number" value={campaign.startingWarchest} onChange={( e ) => { const value = this._num( e.currentTarget.value ); this._update( ( c ) => { c.startingWarchest = value; } ); }} />
                    </label>
                    {campaign.existingForce ? (
                        <span className="aces-muted">Carried-over warchest (at least 400) plus unspent PV: {getAcesExistingForceWarchest( campaign.startingWarchest, rosterPV )} SP</span>
                    ) : rosterPV > 0 ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => this._update( ( c ) => { c.startingWarchest = getAcesUnspentPVAsSP( rosterPV ); } )}>
                            Set from unspent PV ({getAcesUnspentPVAsSP( rosterPV )} SP)
                        </button>
                    ) : null}
                </div>
                <p>
                    Warchest: <strong>{campaign.warchest} SP</strong>. Keywords: {campaign.keywords.length > 0 ? campaign.keywords.join( ", " ) : "none"}.
                </p>
            </>
        );
    }

    render = (): JSX.Element => {
        const campaign = this._getCurrent();
        return (
        <UIPage current="alpha-strike-aces" appGlobals={this.props.appGlobals}>
          <div className="aces-page">
            <TextSection label="Aces Campaigns">
                {!this.state.loaded ? <p>Loading...</p> : (
                    <div className="aces-inline">
                        {this.state.campaigns.length > 0 ? (
                            <label>Campaign:{" "}
                                <select value={this.state.currentId} onChange={( e ) => this._selectCampaign( e.currentTarget.value )}>
                                    {this.state.campaigns.map( ( entry ) => <option key={entry.id} value={entry.id}>{entry.name || "Unnamed campaign"}</option> )}
                                </select>
                            </label>
                        ) : <span>No campaigns yet.</span>}
                        <button className="btn btn-primary btn-sm" onClick={this._newCampaign}>New campaign</button>
                        {campaign ? <button className="btn btn-danger btn-sm" onClick={this._deleteCampaign}>Delete campaign</button> : null}
                    </div>
                )}
            </TextSection>

            {campaign ? (
                <>
                    <TextSection label="Campaign Settings">
                        {this._renderSettings( campaign )}
                    </TextSection>
                    <TextSection label="Force Roster">
                        {this._renderRoster( campaign )}
                    </TextSection>
                    <TextSection label="Named Pilots">
                        {this._renderPilots( campaign )}
                    </TextSection>
                    <TextSection
                        label="After the Sortie"
                        labelButton={
                            <button className="btn btn-secondary btn-sm" onClick={() => this.setState( { showSortie: !this.state.showSortie } )}>
                                {this.state.showSortie ? "Hide" : "Record a sortie"}
                            </button>
                        }
                    >
                        {this.state.showSortie ? this._renderSortieWizard( campaign ) : (
                            <p className="aces-muted">Record each sortie to update the warchest, pilot SP and keywords.</p>
                        )}
                    </TextSection>
                    <TextSection label="Sortie Log">
                        {this._renderSortieLog( campaign )}
                    </TextSection>
                </>
            ) : null}
          </div>
        </UIPage>
        );
    }
}

interface IAcesCampaignPageProps {
    appGlobals: IAppGlobals;
}

interface IAcesCampaignPageState {
    loaded: boolean;
    campaigns: AcesCampaign[];
    currentId: string;
    newPilotCallsign: string;
    newPilotType: string;
    allocateAmount: { [key: string]: number };
    sortie: ISortieDraft;
    showSortie: boolean;
    salvageType: string;
    salvageRoll: number;
    crewRoll: number;
    crewKilled: boolean;
    crewStunned: boolean;
    repairType: string;
    repairSize: number;
    repairCategory: TAcesRepairCategory;
    listedPV: number;
}
