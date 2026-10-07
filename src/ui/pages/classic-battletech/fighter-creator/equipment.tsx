import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight, FaTrash } from "react-icons/fa";
import AerospaceFighter, { FIGHTER_ARCS } from '../../../../classes/aerospace-fighter';
import { IEquipmentItem } from '../../../../data/data-interfaces';
import { CUSTOM_HOMEBREW_RULES_LEVEL } from '../../../../data/equipment-registry';
import { IAppGlobals } from '../../../app-router';
import AvailableEquipment from '../../../components/available-equipment';
import FighterCreatorSideMenu from '../../../components/fighter-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const Trash = FaTrash as any;

export default class FighterCreatorEquipment extends React.Component<IEquipmentProps> {
    constructor(props: IEquipmentProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Step 3 | Fighter Creator");
    }

    update = (change: (fighter: AerospaceFighter) => void): void => {
        const fighter = this.props.appGlobals.currentFighter;
        if (fighter) {
            change(fighter);
            this.props.appGlobals.saveCurrentFighter(fighter);
        }
    }

    addEquipment = (item: IEquipmentItem): boolean => {
        const fighter = this.props.appGlobals.currentFighter;
        if (!fighter) return false;
        const added = fighter.addEquipmentFromTag(item.tag);
        this.props.appGlobals.saveCurrentFighter(fighter);
        return added !== null;
    }

    render = (): JSX.Element => {
        const fighter = this.props.appGlobals.currentFighter;
        if (!fighter) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const remaining = fighter.getRemainingTonnage();

        return (
            <UIPage current="classic-battletech-fighter-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <FighterCreatorSideMenu appGlobals={this.props.appGlobals} current="equipment" />
                    </div>
                    <div className="col-md-9 col-lg-10 row">
                        <div className="col-md-12 col-lg-7">
                            <TextSection label="Step 3: Weapons and Equipment">
                                <p className={remaining < 0 ? "color-red" : ""}>
                                    <strong>Remaining Tonnage</strong>: {remaining} &nbsp;|&nbsp;
                                    <strong>Weapon Heat</strong>: {fighter.getWeaponHeat()} of {fighter.getHeatDissipation()} dissipated
                                </p>
                                <AvailableEquipment
                                    appGlobals={this.props.appGlobals}
                                    equipment={fighter.getAvailableEquipment(rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL, rulesLevel)}
                                    addFunction={this.addEquipment}
                                />

                                <div className="clear-both overflow-hidden">
                                    <hr />
                                    <Link to={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator/summary`} className="btn btn-primary pull-right btn-sm">Next: Summary <ArrowCircleRight /></Link>
                                    <div className="inline-block text-left">
                                        <Link to={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator/armor`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                                    </div>
                                </div>
                            </TextSection>
                        </div>
                        <div className="col-md-12 col-lg-5">
                            <TextSection label="Installed Equipment">
                                <p className="smaller-text">
                                    Each arc holds up to five weapons, fewer with some armor types; ammunition and other equipment
                                    sit in the fuselage and take no slot (TM p. 196).
                                </p>
                                <p>
                                    {FIGHTER_ARCS.map((arc) => {
                                        const used = fighter.getArcSlotsUsed(arc.tag);
                                        const available = fighter.getArcSlots(arc.tag);
                                        return (
                                            <span key={arc.tag} className={used > available ? "color-red" : ""}>
                                                <strong>{arc.name}</strong>: {used}/{available}&nbsp;&nbsp;
                                            </span>
                                        );
                                    })}
                                </p>
                                <table className="table">
                                    <thead>
                                        <tr><th>Name</th><th>Tons</th><th>Location</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {fighter.getEquipmentList().map((item) => (
                                            <tr key={item.uuid}>
                                                <td>{item.name}</td>
                                                <td>{item.weight}</td>
                                                <td>
                                                    {fighter.getItemSlots(item) === 0 ? "Fuselage" : (
                                                        <select
                                                            aria-label={"Firing arc for " + item.name}
                                                            className={item.location ? "" : "color-red"}
                                                            value={item.location ?? ""}
                                                            onChange={(e) => { const value = e.currentTarget.value; this.update((f) => f.setEquipmentLocation(item.uuid ?? "", value)); }}
                                                        >
                                                            <option value="">- choose an arc -</option>
                                                            {FIGHTER_ARCS.map((arc) => (
                                                                <option key={arc.tag} value={arc.tag}>{arc.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>
                                                <td>
                                                    <button className="btn btn-danger btn-sm" title={"Remove " + item.name} onClick={() => this.update((f) => f.removeEquipment(item.uuid ?? ""))}>
                                                        <Trash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {fighter.getEquipmentList().length === 0 ? <tr><td colSpan={4}>Nothing installed yet.</td></tr> : null}
                                    </tbody>
                                </table>
                            </TextSection>
                        </div>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IEquipmentProps {
    appGlobals: IAppGlobals;
}
