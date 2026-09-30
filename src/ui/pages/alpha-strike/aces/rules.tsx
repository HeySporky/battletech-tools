import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import {
    acesCombatSteps,
    acesCrewTable,
    acesDecks,
    acesDifficultyLevels,
    acesEdgeUses,
    acesEndPhaseSteps,
    acesExistingForceBrackets,
    acesGoldenRules,
    acesMotiveSystemsTable,
    acesMovementCostTable,
    acesMovementSteps,
    acesNonCampaignDifficulty,
    acesPilotEdgeAbilityThresholds,
    acesPilotEdgeTokenThresholds,
    acesPilotSkillThresholds,
    acesRepairMultipliers,
    acesRequiredOptionalRules,
    acesSalvageTargets,
    acesScouringSandsAvailability,
    acesVehicleCriticalHitTable,
    acesWaypointScanRanges,
    ACES_FORCED_WITHDRAWAL_PRIORITY_MODIFIER,
    ACES_INITIATIVE_COMMANDER_DESTROYED_MODIFIER,
    ACES_INITIATIVE_LAST_WINNER_MODIFIER,
    ACES_MAX_AUTOMATED_TARGET_NUMBER,
    ACES_MOTIVE_HOVER_WHEELED_MODIFIER,
    ACES_MOVE_FIRST_PRIORITY,
    ACES_MOVE_LAST_PRIORITY,
    ACES_MVP_BONUS,
    ACES_NEW_NAMED_PILOT_COST,
    ACES_PURCHASE_SP_PER_PV,
    ACES_REARM_COST_PER_UNIT,
    ACES_SELL_SP_PER_PV,
    ACES_WAYPOINT_SCAN_RANGE,
    ACES_WOUNDED_CREW_COST,
    IAcesTableRow,
} from '../../../../data/aces-rules';
import AcesToHitCalculator from './_to-hit-calculator';
import './aces.scss';

const rollRange = ( row: IAcesTableRow<unknown> ): string => {
    return row.min === row.max ? "" + row.min : row.min + "-" + row.max;
}

const formatStep = ( value: number | null ): string => {
    if( value === null ) return "Prohibited";
    return value === 0 ? "+0" : "+" + value;
}

/** Summaries of the Aces rules the app uses, in our own words, with the page to read in your own book. */
export default class AcesRulesPage extends React.Component<IAcesRulesPageProps, IAcesRulesPageState> {
    constructor(props: IAcesRulesPageProps) {
        super(props);
        this.state = {
            updated: false,
        }

        this.props.appGlobals.makeDocumentTitle("Aces Rules Reference");
    }

    render = (): JSX.Element => {
        return (
        <UIPage current="alpha-strike-aces" appGlobals={this.props.appGlobals}>
          <div className="aces-page">
            <TextSection label="Aces Rules Reference">
                <p className="aces-muted">
                    Summaries only, with page numbers from the BattleTech: Aces rulebook (and Scouring Sands, marked SS).
                    Check the full wording in your own book.
                </p>
                <h4>Golden rules (<em>Aces</em> p.10)</h4>
                <ol>
                    {acesGoldenRules.map( ( rule, index ) => <li key={index}>{rule}</li> )}
                </ol>
            </TextSection>

            <TextSection label="To-Hit Calculator">
                <AcesToHitCalculator />
            </TextSection>

            <TextSection label="Turn Sequence">
                <div className="row">
                    <div className="col-lg-4">
                        <h4>Initiative (<em>Aces</em> p.32)</h4>
                        <ul>
                            <li>Won Initiative last turn: {ACES_INITIATIVE_LAST_WINNER_MODIFIER}</li>
                            <li>Force commander destroyed: {ACES_INITIATIVE_COMMANDER_DESTROYED_MODIFIER}</li>
                            <li>Move First token = priority {ACES_MOVE_FIRST_PRIORITY}; Move Last token = priority {ACES_MOVE_LAST_PRIORITY} (<em>Aces</em> p.8)</li>
                            <li>Forced Withdrawal: {ACES_FORCED_WITHDRAWAL_PRIORITY_MODIFIER} to priority (<em>Aces</em> p.8)</li>
                            <li>Lowest priority activates first; ties go to the lowest PV (<em>Aces</em> p.11)</li>
                        </ul>
                    </div>
                    <div className="col-lg-4">
                        <h4>Movement activation (<em>Aces</em> p.11)</h4>
                        <ol>
                            {acesMovementSteps.map( ( step, index ) => <li key={index}>{step}</li> )}
                        </ol>
                        <h4>Combat activation (<em>Aces</em> p.18)</h4>
                        <ol>
                            {acesCombatSteps.map( ( step, index ) => <li key={index}>{step}</li> )}
                        </ol>
                        <p className="aces-muted">An automated unit ignores targets it would need {ACES_MAX_AUTOMATED_TARGET_NUMBER + 1}+ to hit.</p>
                    </div>
                    <div className="col-lg-4">
                        <h4>End Phase (<em>Aces</em> p.32)</h4>
                        <ol>
                            {acesEndPhaseSteps.map( ( step, index ) => <li key={index}>{step}</li> )}
                        </ol>
                    </div>
                </div>
            </TextSection>

            <TextSection label="Aces Decks">
                <table className="table tighter-padding">
                    <thead>
                        <tr><th>Deck</th><th>Role</th><th>Product</th><th>Plays like</th></tr>
                    </thead>
                    <tbody>
                        {acesDecks.map( ( deck ) => (
                            <tr key={deck.id}>
                                <td>{deck.name}</td>
                                <td>{deck.role}</td>
                                <td>{deck.product} p.{deck.source.page}</td>
                                <td>{deck.summary}</td>
                            </tr>
                        ) )}
                    </tbody>
                </table>
                <p className="aces-muted">
                    Units sharing too few copies of a deck split it evenly, setting extras aside, and recombine on each
                    reshuffle (<em>Aces</em> p.38).
                </p>
            </TextSection>

            <TextSection label="Vehicles and Infantry">
                <div className="row">
                    <div className="col-lg-6">
                        <h4>Motive Systems Damage (<em>Aces</em> p.4)</h4>
                        <table className="table tighter-padding">
                            <thead><tr><th>2D6</th><th>Effect</th></tr></thead>
                            <tbody>
                                {acesMotiveSystemsTable.map( ( row, index ) => (
                                    <tr key={index}><td>{rollRange( row )}</td><td>{row.label}</td></tr>
                                ) )}
                            </tbody>
                        </table>
                        <p className="aces-muted">Hover and wheeled units add +{ACES_MOTIVE_HOVER_WHEELED_MODIFIER} to the roll.</p>
                    </div>
                    <div className="col-lg-6">
                        <h4>Vehicle Critical Hits (<em>Aces</em> p.4)</h4>
                        <table className="table tighter-padding">
                            <thead><tr><th>2D6</th><th>Effect</th></tr></thead>
                            <tbody>
                                {acesVehicleCriticalHitTable.map( ( row, index ) => (
                                    <tr key={index}><td>{rollRange( row )}</td><td>{row.label}</td></tr>
                                ) )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <h4>Movement costs (<em>Aces</em> pp.4-5)</h4>
                <table className="table tighter-padding">
                    <thead>
                        <tr><th>Terrain</th><th>Tracked</th><th>Wheeled</th><th>Hover</th><th>Infantry</th><th>Note</th></tr>
                    </thead>
                    <tbody>
                        {acesMovementCostTable.map( ( row, index ) => (
                            <tr key={index}>
                                <td>{row.terrain}</td>
                                <td>{formatStep( row.tracked )}</td>
                                <td>{formatStep( row.wheeled )}</td>
                                <td>{formatStep( row.hover )}</td>
                                <td>{formatStep( row.infantry )}</td>
                                <td>{row.note}</td>
                            </tr>
                        ) )}
                    </tbody>
                </table>
            </TextSection>

            <TextSection label="Difficulty">
                <div className="row">
                    <div className="col-lg-6">
                        <h4>Single games (<em>Aces</em> p.38)</h4>
                        <ul>
                            {acesNonCampaignDifficulty.map( ( option ) => <li key={option.id}>{option.label}</li> )}
                        </ul>
                    </div>
                    <div className="col-lg-6">
                        <h4>Campaigns (<em>Aces</em> pp.28-29)</h4>
                        <table className="table tighter-padding">
                            <thead><tr><th>Level</th><th>PV</th><th>SP earned</th></tr></thead>
                            <tbody>
                                {acesDifficultyLevels.map( ( level ) => (
                                    <tr key={level.id}>
                                        <td>{level.name}</td>
                                        <td>{level.pvModifier > 0 ? "+" : ""}{level.pvModifier}%</td>
                                        <td>{level.spPercent}%</td>
                                    </tr>
                                ) )}
                            </tbody>
                        </table>
                        <h4>Existing force (<em>Aces</em> p.29)</h4>
                        <table className="table tighter-padding">
                            <thead><tr><th>Total Named Pilot SP</th><th>PV</th></tr></thead>
                            <tbody>
                                {acesExistingForceBrackets.map( ( bracket, index ) => (
                                    <tr key={index}>
                                        <td>{bracket.minSP.toLocaleString()}{bracket.maxSP === null ? "+" : " - " + bracket.maxSP.toLocaleString()}</td>
                                        <td>{bracket.pvModifier}%</td>
                                    </tr>
                                ) )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </TextSection>

            <TextSection label="Campaign Play">
                <div className="row">
                    <div className="col-lg-6">
                        <h4>Required optional rules (<em>Aces</em> p.24)</h4>
                        <ul>
                            {acesRequiredOptionalRules.map( ( rule, index ) => <li key={index}>{rule}</li> )}
                        </ul>
                        <h4>Edge (<em>Aces</em> p.24)</h4>
                        <ul>
                            {acesEdgeUses.map( ( use, index ) => <li key={index}>{use}</li> )}
                        </ul>
                        <h4>Waypoint scan range (<em>Aces</em> p.24)</h4>
                        <p>
                            {ACES_WAYPOINT_SCAN_RANGE}" base
                            {acesWaypointScanRanges.map( ( scan ) => ", " + scan.ability + " " + scan.range + "\"" ).join( "" )}.
                            The unit must not have sprinted.
                        </p>
                    </div>
                    <div className="col-lg-6">
                        <h4>After the sortie (<em>Aces</em> pp.33-36)</h4>
                        <ul>
                            <li>Salvage Check on 2D6: {Object.keys( acesSalvageTargets ).map( ( type ) => type + " " + acesSalvageTargets[type] + "+" ).join( ", " )}</li>
                            <li>Crew roll on 2D6: {acesCrewTable.map( ( row ) => rollRange( row ) + " " + row.effect ).join( ", " )}</li>
                            <li>Rearm {ACES_REARM_COST_PER_UNIT} SP per unit fielded; wounded or killed crew {ACES_WOUNDED_CREW_COST} SP; new Named Pilot {ACES_NEW_NAMED_PILOT_COST} SP</li>
                            <li>Repairs per Size (non-'Mechs count half Size): destroyed {acesRepairMultipliers["destroyed"]}, crippled {acesRepairMultipliers["crippled"]}, structure or critical {acesRepairMultipliers["structure-or-critical"]}, armor only {acesRepairMultipliers["armor-only"]}</li>
                            <li>MVP bonus: {ACES_MVP_BONUS} SP, not taken from the warchest</li>
                            <li>Buy at PV x{ACES_PURCHASE_SP_PER_PV} SP, sell at PV x{ACES_SELL_SP_PER_PV} SP (Skill 4 PV)</li>
                        </ul>
                        <h4>Named Pilot tracks (<em>Aces</em> pp.27, 29)</h4>
                        <table className="table tighter-padding">
                            <thead><tr><th>Track</th><th>SP needed</th></tr></thead>
                            <tbody>
                                <tr><td>Skill</td><td>{acesPilotSkillThresholds.map( ( step ) => step.value + " @ " + step.sp ).join( ", " )}</td></tr>
                                <tr><td>Edge tokens</td><td>{acesPilotEdgeTokenThresholds.map( ( step ) => step.value + " @ " + step.sp ).join( ", " )}</td></tr>
                                <tr><td>Edge abilities</td><td>{acesPilotEdgeAbilityThresholds.map( ( step ) => step.value + " @ " + step.sp ).join( ", " )}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </TextSection>

            <TextSection label="Scouring Sands: Apolakkia Availability (SS p.20)">
                <table className="table tighter-padding">
                    <thead><tr><th>Unit</th><th>Type</th><th>PV</th><th>SP to buy</th></tr></thead>
                    <tbody>
                        {acesScouringSandsAvailability.map( ( unit, index ) => (
                            <tr key={index}>
                                <td>{unit.name}</td>
                                <td>{unit.type}</td>
                                <td>{unit.pv}</td>
                                <td>{unit.pv * ACES_PURCHASE_SP_PER_PV}</td>
                            </tr>
                        ) )}
                    </tbody>
                </table>
            </TextSection>
          </div>
        </UIPage>
        );
    }
}

interface IAcesRulesPageProps {
    appGlobals: IAppGlobals;
}

interface IAcesRulesPageState {
    updated: boolean;
}
