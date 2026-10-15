import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight, FaTrash } from "react-icons/fa";
import CapitalShip from '../../../../classes/capital-ship';
import { IEquipmentItem } from '../../../../data/data-interfaces';
import { CUSTOM_HOMEBREW_RULES_LEVEL } from '../../../../data/equipment-registry';
import { findCapitalWeapon, getCapitalAmmoTags } from '../../../../data/capital-weapon-helpers';
import { getAdvancedAerospaceType } from '../../../../data/advanced-aerospace-construction';
import { IAppGlobals } from '../../../app-router';
import AvailableEquipment from '../../../components/available-equipment';
import CapitalShipCreatorSideMenu from '../../../components/capital-ship-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import CapitalShipStatusBar from './_statusBar';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const Trash = FaTrash as any;

export default class CapitalShipCreatorEquipment extends React.Component<IEquipmentProps, IEquipmentState> {
    state: IEquipmentState = { capitalTag: "" };

    constructor(props: IEquipmentProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Step 5 | JumpShip and WarShip Creator");
    }

    update = (change: (ship: CapitalShip) => void): void => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (ship) {
            change(ship);
            this.props.appGlobals.saveCurrentCapitalShip(ship);
        }
    }

    addEquipment = (item: IEquipmentItem): boolean => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (!ship) return false;
        const added = ship.addEquipmentFromTag(item.tag);
        this.props.appGlobals.saveCurrentCapitalShip(ship);
        return added !== null;
    }

    renderArcSelect = (ship: CapitalShip, label: string, value: string | undefined, allowHull: boolean, onChange: (arc: string) => void): JSX.Element => (
        <select aria-label={"Firing arc for " + label} className={value ? "" : "color-red"} value={value ?? ""} onChange={(e) => onChange(e.currentTarget.value)}>
            {allowHull ? <option value="hull">Hull</option> : <option value="">- choose an arc -</option>}
            {ship.getArcs().map((arc) => <option key={arc} value={arc}>{ship.getArcName(arc)}</option>)}
        </select>
    )

    renderCapitalWeapons = (ship: CapitalShip, rulesLevel: number): JSX.Element => {
        const available = ship.getAvailableCapitalWeapons(rulesLevel);
        const mounts = ship.getCapitalWeapons();
        const selected = available.find((weapon) => weapon.tag === this.state.capitalTag) ?? available[0];
        return (
            <TextSection label="Capital and Sub-Capital Weapons">
                <p className="smaller-text">
                    Each capital weapon needs a gunner of its own (SO:AA p.138). Ammunition is carried with the weapon it feeds,
                    at least 10 shots (p.142).
                </p>
                {available.length > 0 ? (
                    <div className="input-group mb-2">
                        <select aria-label="Capital weapon to add" data-testid="cs-capital-select" className="form-control" value={selected?.tag ?? ""} onChange={(e) => this.setState({ capitalTag: e.currentTarget.value })}>
                            {available.map((weapon) => <option key={weapon.tag} value={weapon.tag}>{weapon.name} ({weapon.weight.toLocaleString("en-US")} t)</option>)}
                        </select>
                        <button className="btn btn-primary btn-sm" data-testid="cs-capital-add" onClick={() => { if (selected) this.update((s) => s.addCapitalWeapon(selected.tag)); }}>
                            Add
                        </button>
                    </div>
                ) : <p>No capital weapons are available to this tech base, era and rules level.</p>}
                <table className="table" data-testid="cs-capital-installed">
                    <thead>
                        <tr><th>Name</th><th>Tons</th><th>Arc</th><th>Shots</th><th></th></tr>
                    </thead>
                    <tbody>
                        {mounts.map((mount) => (
                            <tr key={mount.uuid}>
                                <td>{mount.weapon.name}</td>
                                <td>{ship.getCapitalWeaponWeight(mount).toLocaleString("en-US")}</td>
                                <td>{this.renderArcSelect(ship, mount.weapon.name, mount.location, false, (arc) => this.update((s) => s.setCapitalWeaponLocation(mount.uuid, arc)))}</td>
                                <td>
                                    {getCapitalAmmoTags(mount.weapon).map((tag, _index, tags) => (
                                        <label key={tag} className="d-block">
                                            {tags.length > 1 ? `${findCapitalWeapon(tag)?.name ?? tag} ` : ""}
                                            <input
                                                type="number"
                                                min={0}
                                                aria-label={`Shots of ${findCapitalWeapon(tag)?.name ?? tag} for ${mount.weapon.name}`}
                                                style={{ width: "5em" }}
                                                value={mount.shots[tag] ?? 0}
                                                onChange={(e) => { const value = Number(e.currentTarget.value); this.update((s) => s.setCapitalWeaponShots(mount.uuid, tag, value)); }}
                                            />
                                        </label>
                                    ))}
                                </td>
                                <td>
                                    <button className="btn btn-danger btn-sm" title={"Remove " + mount.weapon.name} onClick={() => this.update((s) => s.removeCapitalWeapon(mount.uuid))}>
                                        <Trash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {mounts.length === 0 ? <tr><td colSpan={5}>No capital weapons.</td></tr> : null}
                    </tbody>
                </table>
            </TextSection>
        );
    }

    render = (): JSX.Element => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (!ship) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const limit = getAdvancedAerospaceType(ship.getShipType()).weaponsPerArc;

        return (
            <UIPage current="classic-battletech-capital-ship-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <CapitalShipCreatorSideMenu appGlobals={this.props.appGlobals} current="equipment" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <CapitalShipStatusBar ship={ship} rulesLevel={rulesLevel} />
                        <div className="row">
                            <div className="col-md-12 col-lg-7">
                                <TextSection label="Step 5: Standard Weapons and Equipment">
                                    <AvailableEquipment
                                        appGlobals={this.props.appGlobals}
                                        equipment={ship.getAvailableEquipment(rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL, rulesLevel)}
                                        addFunction={this.addEquipment}
                                    />
                                    <div className="clear-both overflow-hidden">
                                        <hr />
                                        <Link to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/crew`} className="btn btn-primary pull-right btn-sm">Next: Crew and Bays <ArrowCircleRight /></Link>
                                        <Link to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/armor`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                                    </div>
                                </TextSection>
                            </div>
                            <div className="col-md-12 col-lg-5">
                                <TextSection label="Installed Equipment">
                                    <p className="smaller-text">
                                        Weapons go in a firing arc, and each side arc must carry the same weapons as the other side. An arc
                                        holds {limit} weapons before expanded fire control is needed (SO:AA pp.133, 142-143).
                                    </p>
                                    <p data-testid="cs-arcs">
                                        {ship.getArcs().map((arc) => {
                                            const used = ship.getArcWeaponCount(arc);
                                            return (
                                                <span key={arc}>
                                                    <strong>{ship.getArcName(arc)}</strong>: {used}{used > limit ? ` (+${ship.getArcFireControlWeight(arc)} t fire control)` : ""}&nbsp;&nbsp;
                                                </span>
                                            );
                                        })}
                                    </p>
                                    <p><strong>Gunners needed</strong>: {ship.getMinimumGunners()} (one for every six standard weapons and one for each capital weapon, SO:AA p.138)</p>
                                    <table className="table" data-testid="cs-installed">
                                        <thead>
                                            <tr><th>Name</th><th>Tons</th><th>Location</th><th></th></tr>
                                        </thead>
                                        <tbody>
                                            {ship.getEquipmentList().map((item) => (
                                                <tr key={item.uuid}>
                                                    <td>{item.name}</td>
                                                    <td>{item.weight}</td>
                                                    <td>{this.renderArcSelect(ship, item.name, item.location, !ship.needsArc(item), (arc) => this.update((s) => s.setEquipmentLocation(item.uuid ?? "", arc)))}</td>
                                                    <td>
                                                        <button className="btn btn-danger btn-sm" title={"Remove " + item.name} onClick={() => this.update((s) => s.removeEquipment(item.uuid ?? ""))}>
                                                            <Trash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {ship.getEquipmentList().length === 0 ? <tr><td colSpan={4}>No standard equipment.</td></tr> : null}
                                        </tbody>
                                    </table>
                                </TextSection>
                                {this.renderCapitalWeapons(ship, rulesLevel)}
                            </div>
                        </div>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IEquipmentState {
    capitalTag: string;
}

interface IEquipmentProps {
    appGlobals: IAppGlobals;
}
