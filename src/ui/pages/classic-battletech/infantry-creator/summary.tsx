import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft } from "react-icons/fa";
import { INFANTRY_SPECIAL_FEATURES, formatInfantryASDamage } from '../../../../classes/infantry-platoon';
import { IAppGlobals } from '../../../app-router';
import InfantryCreatorSideMenu from '../../../components/infantry-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;

export default class InfantryCreatorSummary extends React.Component<ISummaryProps> {
    constructor(props: ISummaryProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Summary | Infantry Creator");
    }

    render = (): JSX.Element => {
        const platoon = this.props.appGlobals.currentInfantry;
        if (!platoon) return <></>;
        const issues = platoon.getIssues();
        const notes = platoon.getNotes();
        const secondary = platoon.getSecondaryWeapon();
        const features = platoon.getSpecialFeatures();
        const cost = platoon.getCBillCost();
        const lines = platoon.getSubPlatoons();
        const as = platoon.getAlphaStrikeStats();

        return (
            <UIPage current="classic-battletech-infantry-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <InfantryCreatorSideMenu appGlobals={this.props.appGlobals} current="summary" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label={`Summary: ${platoon.getDisplayName()}`}>
                            {issues.length === 0 ? (
                                <p><strong>This platoon is legal under the TechManual construction rules.</strong></p>
                            ) : (
                                <>
                                    <p className="color-red"><strong>This platoon is not legal yet:</strong></p>
                                    <ul className="color-red">
                                        {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                    </ul>
                                </>
                            )}

                            <p data-testid="infantry-summary">
                                <strong>Type</strong>: {platoon.getMotive().name} conventional infantry &nbsp;|&nbsp;
                                <strong>Tech</strong>: {platoon.isClan() ? "Clan" : "Inner Sphere"} ({platoon.getFormation().name}) &nbsp;|&nbsp;
                                <strong>Troopers</strong>: {platoon.getTroopers()} ({platoon.getSquads()} squads of {platoon.getSquadSize()}) &nbsp;|&nbsp;
                                <strong>Battle Value</strong>: {platoon.getBattleValue()} &nbsp;|&nbsp;
                                <strong>Cost</strong>: {cost === null ? "not listed" : `${cost.toLocaleString("en-US")} C-bills`}
                            </p>
                            <p>
                                <strong>Movement</strong>: {platoon.getMovementText()} &nbsp;|&nbsp;
                                <strong>Prohibited Terrain</strong>: {platoon.getMotive().prohibitedTerrain} &nbsp;|&nbsp;
                                <strong>Transport Weight</strong>: {platoon.getWeight()} tons{lines.length > 1 ? ` (${lines.map((troopers) => platoon.getWeight(troopers)).join(", ")} by sub-platoon)` : ""},
                                may be broken down to {platoon.getMotive().minimumBreakdown} {platoon.getMotive().minimumBreakdown === 1 ? "trooper" : "troopers"} per transport
                            </p>
                            <p>
                                <strong>Primary Weapon</strong>: {platoon.getPrimaryCount()} x {platoon.getPrimaryWeapon().name} &nbsp;|&nbsp;
                                <strong>Secondary Weapon</strong>: {secondary && platoon.getSecondaryCount() > 0 ? `${platoon.getSecondaryCount()} x ${secondary.name} (${platoon.getSecondaryPerSquad()} per squad)` : "None"} &nbsp;|&nbsp;
                                <strong>Platoon Damage</strong>: {platoon.getTotalDamage()} &nbsp;|&nbsp;
                                <strong>Maximum Range</strong>: {platoon.getMaxRange()} {platoon.getMaxRange() === 1 ? "hex" : "hexes"}
                            </p>
                            <p>
                                <strong>Gunnery</strong>: {platoon.getGunnery()} &nbsp;|&nbsp;
                                <strong>Anti-'Mech</strong>: {platoon.canMakeAntiMechAttacks() ? platoon.getAntiMechSkill() : "no Anti-'Mech attacks"} &nbsp;|&nbsp;
                                <strong>Infantry Armor</strong>: {platoon.getArmor() ? `${platoon.getArmor()?.name} (damage divisor ${platoon.getDamageDivisor()})` : "None"} &nbsp;|&nbsp;
                                <strong>Skill-Adjusted Battle Value</strong>: {platoon.getSkillAdjustedBattleValue()} (x {platoon.getSkillMultiplier().toFixed(2)})
                            </p>
                            {features.length > 0 ? (
                                <ul>
                                    {features.map((code) => <li key={code}>{INFANTRY_SPECIAL_FEATURES[code]}</li>)}
                                </ul>
                            ) : null}
                            {notes.length > 0 ? (
                                <ul className="smaller-text">
                                    {notes.map((note, index) => <li key={index}>{note}</li>)}
                                </ul>
                            ) : null}

                            <h3>Battle Value Calculation</h3>
                            <ul data-testid="infantry-bv-log">
                                {platoon.getBattleValueLog().map((line, index) => <li key={index}>{line}</li>)}
                            </ul>
                            <p className="smaller-text">
                                TechManual p. 309, for Gunnery 4 and Anti-'Mech 5; the skill multiplier is from the table on p. 315. Infantry
                                armor follows Tactical Operations: Advanced Units &amp; Equipment p. 191.
                            </p>

                            <h3>Cost Calculation</h3>
                            <ul data-testid="infantry-cost-log">
                                {platoon.getCBillCostLog().map((line, index) => <li key={index}>{line}</li>)}
                            </ul>
                            <p className="smaller-text">
                                TechManual pp. 276 and 282. The book prices a platoon from one weapon; where a secondary weapon is carried,
                                each trooper is priced by the weapon they fire, and infantry armor is added for each trooper before the
                                multipliers, as MegaMek does.
                            </p>

                            <h3>Alpha Strike Stats</h3>
                            <table className="table" data-testid="infantry-as">
                                <tbody>
                                    <tr><td>Type / Size</td><td>{as.type} / {as.size}</td></tr>
                                    <tr><td>Move</td><td>{as.movement}"{as.movementCode}</td></tr>
                                    <tr><td>Damage (S/M/L)</td><td>{formatInfantryASDamage(as.damageValues.short)}/{formatInfantryASDamage(as.damageValues.medium)}/{formatInfantryASDamage(as.damageValues.long)}</td></tr>
                                    <tr><td>Armor / Structure</td><td>{as.armor} / {as.structure}</td></tr>
                                    <tr><td>Special Abilities</td><td>{as.specialAbilities.join(", ")}</td></tr>
                                    <tr><td>Point Value</td><td>{as.pointValue}</td></tr>
                                </tbody>
                            </table>
                            <ul className="smaller-text">
                                {as.calcLog.map((line, index) => <li key={index}>{line}</li>)}
                            </ul>
                            <p className="smaller-text">
                                Converted with the Alpha Strike Companion rules (pp. 92-103), with the Point Value worked out as MegaMek
                                does; checked against Master Unit List cards. {lines.length > 1 ? "Each sub-platoon is a unit of its own; the card is for the first. " : ""}
                                Published platoons should still use their MUL card.
                            </p>
                            <Link to={`${process.env.PUBLIC_URL}/classic-battletech/infantry-creator/print-as`} className="btn btn-primary btn-sm">Print Alpha Strike Card</Link>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/infantry-creator/record-sheet`} className="btn btn-primary pull-right btn-sm">View Record Sheet</Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/infantry-creator/weapons`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface ISummaryProps {
    appGlobals: IAppGlobals;
}
