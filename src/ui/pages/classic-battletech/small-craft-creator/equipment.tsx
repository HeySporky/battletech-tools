import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight, FaTrash } from "react-icons/fa";
import SmallCraft from '../../../../classes/small-craft';
import { IEquipmentItem } from '../../../../data/data-interfaces';
import { CUSTOM_HOMEBREW_RULES_LEVEL } from '../../../../data/equipment-registry';
import { SMALL_CRAFT_ARCS, SMALL_CRAFT_WEAPONS_PER_ARC } from '../../../../data/small-craft-construction';
import { IAppGlobals } from '../../../app-router';
import AvailableEquipment from '../../../components/available-equipment';
import SmallCraftCreatorSideMenu from '../../../components/small-craft-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import SmallCraftStatusBar from './_statusBar';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const Trash = FaTrash as any;

export default class SmallCraftCreatorEquipment extends React.Component<IEquipmentProps> {
    constructor(props: IEquipmentProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Step 5 | Small Craft Creator");
    }

    update = (change: (craft: SmallCraft) => void): void => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (craft) {
            change(craft);
            this.props.appGlobals.saveCurrentSmallCraft(craft);
        }
    }

    addEquipment = (item: IEquipmentItem): boolean => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (!craft) return false;
        const added = craft.addEquipmentFromTag(item.tag);
        this.props.appGlobals.saveCurrentSmallCraft(craft);
        return added !== null;
    }

    render = (): JSX.Element => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (!craft) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;

        return (
            <UIPage current="classic-battletech-small-craft-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <SmallCraftCreatorSideMenu appGlobals={this.props.appGlobals} current="equipment" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <SmallCraftStatusBar craft={craft} rulesLevel={rulesLevel} />
                        <div className="row">
                            <div className="col-md-12 col-lg-7">
                                <TextSection label="Step 5: Weapons and Equipment">
                                    <AvailableEquipment
                                        appGlobals={this.props.appGlobals}
                                        equipment={craft.getAvailableEquipment(rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL, rulesLevel)}
                                        addFunction={this.addEquipment}
                                    />

                                    <div className="clear-both overflow-hidden">
                                        <hr />
                                        <Link to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/crew`} className="btn btn-primary pull-right btn-sm">Next: Crew and Bays <ArrowCircleRight /></Link>
                                        <div className="inline-block text-left">
                                            <Link to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/armor`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                                        </div>
                                    </div>
                                </TextSection>
                            </div>
                            <div className="col-md-12 col-lg-5">
                                <TextSection label="Installed Equipment">
                                    <p className="smaller-text">
                                        Weapons go in a firing arc; the two side arcs of a pair must carry the same weapons. An arc
                                        holds 12 weapons before extra fire control is needed. Every ammunition-fed weapon needs 10
                                        turns of fire (TM pp. 194-196).
                                    </p>
                                    <p data-testid="sc-arcs">
                                        {SMALL_CRAFT_ARCS.map((arc) => {
                                            const used = craft.getArcWeaponCount(arc);
                                            return (
                                                <span key={arc}>
                                                    <strong>{craft.getArcName(arc)}</strong>: {used}{used > SMALL_CRAFT_WEAPONS_PER_ARC ? ` (+${craft.getArcFireControlWeight(arc)} t fire control)` : ""}&nbsp;&nbsp;
                                                </span>
                                            );
                                        })}
                                    </p>
                                    <p>
                                        <strong>Gunners needed</strong>: {craft.getMinimumGunners()} (one for every six weapons, TM p. 189)
                                    </p>
                                    <table className="table" data-testid="sc-installed">
                                        <thead>
                                            <tr><th>Name</th><th>Tons</th><th>Location</th><th></th></tr>
                                        </thead>
                                        <tbody>
                                            {craft.getEquipmentList().map((item) => (
                                                <tr key={item.uuid}>
                                                    <td>{item.name}</td>
                                                    <td>{item.weight}</td>
                                                    <td>
                                                        {craft.getItemSlots(item) === 0 ? "Hull" : (
                                                            <select
                                                                aria-label={"Firing arc for " + item.name}
                                                                className={item.location ? "" : "color-red"}
                                                                value={item.location ?? ""}
                                                                onChange={(e) => { const value = e.currentTarget.value; this.update((c) => c.setEquipmentLocation(item.uuid ?? "", value)); }}
                                                            >
                                                                {craft.needsArc(item) ? <option value="">- choose an arc -</option> : <option value="hull">Hull</option>}
                                                                {SMALL_CRAFT_ARCS.map((arc) => (
                                                                    <option key={arc} value={arc}>{craft.getArcName(arc)}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-danger btn-sm" title={"Remove " + item.name} onClick={() => this.update((c) => c.removeEquipment(item.uuid ?? ""))}>
                                                            <Trash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {craft.getEquipmentList().length === 0 ? <tr><td colSpan={4}>Nothing installed yet.</td></tr> : null}
                                        </tbody>
                                    </table>
                                </TextSection>
                            </div>
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
