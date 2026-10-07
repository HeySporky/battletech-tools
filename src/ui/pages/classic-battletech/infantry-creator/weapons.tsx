import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import InfantryPlatoon, { INFANTRY_SPECIAL_FEATURES } from '../../../../classes/infantry-platoon';
import { IInfantryWeapon, INFANTRY_WEAPON_CATEGORIES } from '../../../../data/infantry-weapons';
import { IAppGlobals } from '../../../app-router';
import InfantryCreatorSideMenu from '../../../components/infantry-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

const formatModifier = (modifier: number): string => modifier > 0 ? `+${modifier}` : `${modifier}`;
const weaponLabel = (weapon: IInfantryWeapon): string =>
    `${weapon.name} - range ${weapon.baseRange}, damage ${weapon.damage.toFixed(2)}${weapon.crew > 1 || weapon.encumbering ? `, crew ${weapon.crew}${weapon.encumbering ? "E" : ""}` : ""}`;
const typeLabel = (weapon: IInfantryWeapon): string =>
    `${weapon.type.charAt(0).toUpperCase()}${weapon.type.slice(1)} (${weapon.damageType})${weapon.special}`;

export default class InfantryCreatorWeapons extends React.Component<IWeaponsProps> {
    constructor(props: IWeaponsProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Step 2 | Infantry Creator");
    }

    update = (change: (platoon: InfantryPlatoon) => void): void => {
        const platoon = this.props.appGlobals.currentInfantry;
        if (platoon) {
            change(platoon);
            this.props.appGlobals.saveCurrentInfantry(platoon);
        }
    }

    renderOptions = (weapons: IInfantryWeapon[]): JSX.Element[] =>
        INFANTRY_WEAPON_CATEGORIES.filter((category) => weapons.some((weapon) => weapon.category === category.tag)).map((category) => (
            <optgroup key={category.tag} label={category.name}>
                {weapons.filter((weapon) => weapon.category === category.tag).map((weapon) => (
                    <option key={weapon.tag} value={weapon.tag}>{weaponLabel(weapon)}</option>
                ))}
            </optgroup>
        ));

    renderWeaponRow = (role: string, weapon: IInfantryWeapon, troopers: number): JSX.Element => (
        <tr key={role}>
            <td>{role}</td>
            <td>{weapon.name}</td>
            <td>{typeLabel(weapon)}</td>
            <td className="text-center">{weapon.baseRange}</td>
            <td className="text-center">{weapon.damage.toFixed(2)}</td>
            <td className="text-center">{weapon.crew}{weapon.encumbering ? "E" : ""}</td>
            <td className="text-center">{troopers}</td>
            <td className="text-right">{weapon.cost === null ? "not listed" : weapon.cost.toLocaleString("en-US")}</td>
        </tr>
    );

    render = (): JSX.Element => {
        const platoon = this.props.appGlobals.currentInfantry;
        if (!platoon) return <></>;
        const primary = platoon.getPrimaryWeapon();
        const secondary = platoon.getSecondaryWeapon();
        const maxPerSquad = platoon.getMaxSecondaryPerSquad();
        const modifiers = platoon.getRangeModifiers();
        const features = platoon.getSpecialFeatures();
        const lines = platoon.getSubPlatoons();
        const issues = platoon.getIssues();

        return (
            <UIPage current="classic-battletech-infantry-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <InfantryCreatorSideMenu appGlobals={this.props.appGlobals} current="weapons" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Step 2: Establish Platoon Weaponry">
                            <label>
                                Primary Weapon:
                                <select value={primary.tag} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setPrimaryWeapon(value)); }}>
                                    {this.renderOptions(platoon.getAvailablePrimaryWeapons())}
                                </select>
                            </label>
                            <p className="smaller-text">
                                Every trooper carries the primary weapon, which must be a Melee or Standard weapon. No primary weapon
                                counts for more than 0.60 damage a trooper; one that would gives the platoon heavy burst instead (TM p. 150).
                            </p>

                            <label>
                                Secondary Weapon:
                                <select value={secondary ? secondary.tag : ""} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setSecondaryWeapon(value)); }}>
                                    <option value="">None</option>
                                    {this.renderOptions(platoon.getAvailableSecondaryWeapons())}
                                </select>
                            </label>
                            {secondary ? (
                                <label>
                                    Secondary Weapons per Squad:
                                    <select value={platoon.getSecondaryPerSquad()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.setSecondaryPerSquad(value)); }}>
                                        {Array.from({ length: maxPerSquad + 1 }, (_unused, value) => <option key={value} value={value}>{value}</option>)}
                                    </select>
                                </label>
                            ) : null}
                            <p className="smaller-text">
                                Every squad carries the same secondary weapons: at most 2, or the squad's troopers divided by the weapon's crew
                                if that is lower. One trooper fires each in place of a primary weapon. With 2 per squad the platoon attacks at
                                the secondary weapon's range; 2 Support weapons per squad also cost mobility (TM pp. 151-152).
                            </p>

                            <table className="table" data-testid="infantry-weapons">
                                <thead>
                                    <tr>
                                        <th></th><th>Weapon</th><th>Type</th><th className="text-center">Base Range</th><th className="text-center">Damage</th>
                                        <th className="text-center">Crew</th><th className="text-center">Troopers</th><th className="text-right">Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.renderWeaponRow("Primary", primary, platoon.getPrimaryCount())}
                                    {secondary && platoon.getSecondaryCount() > 0 ? this.renderWeaponRow("Secondary", secondary, platoon.getSecondaryCount()) : null}
                                </tbody>
                            </table>

                            {issues.length > 0 ? (
                                <ul className="color-red">
                                    {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                </ul>
                            ) : null}

                            <h3>Final Range and Damage Values</h3>
                            <p data-testid="infantry-attack">
                                <strong>Movement</strong>: {platoon.getMovementText()} &nbsp;|&nbsp;
                                <strong>Range from</strong>: {platoon.getRangeWeapon().name} &nbsp;|&nbsp;
                                <strong>Platoon Damage</strong>: {platoon.getTotalDamage()} ({platoon.getDamagePerTrooper().toFixed(3)} a trooper)
                            </p>
                            <table className="table" data-testid="infantry-ranges">
                                <tbody>
                                    <tr>
                                        <th>Range in Hexes</th>
                                        {modifiers.map((_unused, range) => <td key={range} className="text-center">{range}</td>)}
                                    </tr>
                                    <tr>
                                        <th>To-Hit Modifier</th>
                                        {modifiers.map((modifier, range) => <td key={range} className="text-center">{formatModifier(modifier)}</td>)}
                                    </tr>
                                </tbody>
                            </table>
                            {features.length > 0 ? (
                                <ul>
                                    {features.map((code) => <li key={code}>{INFANTRY_SPECIAL_FEATURES[code]}</li>)}
                                </ul>
                            ) : null}
                            {platoon.getNotes().length > 0 ? (
                                <ul className="smaller-text">
                                    {platoon.getNotes().map((note, index) => <li key={index}>{note}</li>)}
                                </ul>
                            ) : null}

                            <h4>Max Weapon Damage by Troopers Remaining{lines.length > 1 ? ` (each sub-platoon of ${lines[0]})` : ""}</h4>
                            <table className="table" data-testid="infantry-damage">
                                <tbody>
                                    <tr>
                                        <th>Troopers</th>
                                        {platoon.getDamageTable().map((_unused, index) => <td key={index} className="text-center">{index + 1}</td>)}
                                    </tr>
                                    <tr>
                                        <th>Damage</th>
                                        {platoon.getDamageTable().map((damage, index) => <td key={index} className="text-center">{damage}</td>)}
                                    </tr>
                                </tbody>
                            </table>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/infantry-creator/summary`} className="btn btn-primary pull-right btn-sm">Next: Summary <ArrowCircleRight /></Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/infantry-creator/platoon`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IWeaponsProps {
    appGlobals: IAppGlobals;
}
