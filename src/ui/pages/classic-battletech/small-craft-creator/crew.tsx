import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight, FaTrash } from "react-icons/fa";
import SmallCraft from '../../../../classes/small-craft';
import { findTransportBayType, quartersTypes, transportBayTypes } from '../../../../data/small-craft-construction';
import { IAppGlobals } from '../../../app-router';
import InputNumeric from "../../../components/form_elements/input_numeric";
import SmallCraftCreatorSideMenu from '../../../components/small-craft-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import SmallCraftStatusBar from './_statusBar';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const Trash = FaTrash as any;

export default class SmallCraftCreatorCrew extends React.Component<ICrewProps> {
    constructor(props: ICrewProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Crew and Bays | Small Craft Creator");
    }

    update = (change: (craft: SmallCraft) => void): void => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (craft) {
            change(craft);
            this.props.appGlobals.saveCurrentSmallCraft(craft);
        }
    }

    render = (): JSX.Element => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (!craft) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const people = craft.getCrew() + craft.getPassengers();
        const techBase = craft.getChassisTechBase();
        const bayOptions = transportBayTypes.filter((type) => !type.tech || type.tech === techBase || craft.isMixedTech());
        const remaining = craft.getRemainingTonnage();

        return (
            <UIPage current="classic-battletech-small-craft-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <SmallCraftCreatorSideMenu appGlobals={this.props.appGlobals} current="crew" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <SmallCraftStatusBar craft={craft} rulesLevel={rulesLevel} />
                        <TextSection label="Crew and Quarters">
                            <InputNumeric
                                label={`Crew (at least ${craft.getMinimumCrew()}: 3 and ${craft.getMinimumGunners()} gunner${craft.getMinimumGunners() === 1 ? "" : "s"})`}
                                value={craft.getCrew()}
                                min={craft.getMinimumCrew()}
                                max={200}
                                step={1}
                                setValue={(count) => this.update((c) => c.setCrew(count))}
                            />
                            <InputNumeric
                                label={`Officers among the crew (normally ${craft.getMinimumOfficers()}: one in five)`}
                                value={craft.getOfficers()}
                                min={0}
                                max={craft.getCrew()}
                                step={1}
                                setValue={(count) => this.update((c) => c.setOfficers(count))}
                            />
                            <InputNumeric
                                label="Passengers"
                                value={craft.getPassengers()}
                                min={0}
                                max={200}
                                step={1}
                                setValue={(count) => this.update((c) => c.setPassengers(count))}
                            />
                            <h3>Quarters</h3>
                            {quartersTypes.map((type) => (
                                <InputNumeric
                                    key={type.tag}
                                    label={`${type.name} (${type.tons} tons each)`}
                                    value={craft.getQuarters()[type.tag]}
                                    min={0}
                                    max={200}
                                    step={1}
                                    setValue={(count) => this.update((c) => c.setQuarters(type.tag, count))}
                                />
                            ))}
                            <p className={craft.getQuartersCapacity() < people ? "color-red" : ""} data-testid="sc-quarters">
                                <strong>Quarters</strong>: {craft.getQuartersCapacity()} for {people} crew and passengers &nbsp;|&nbsp;
                                <strong>Weight</strong>: {craft.getQuartersWeight()} tons
                            </p>
                            <p className="smaller-text">
                                Everyone aboard needs quarters: by custom first-class for officers and crew quarters for the rest,
                                though a spartan craft may bunk everyone in steerage. Troops and crews carried in bays bunk there
                                and need none (TM pp. 188-189, 195, 236).
                            </p>
                        </TextSection>

                        <TextSection label="Transport Bays">
                            <table className="table" data-testid="sc-bays">
                                <thead>
                                    <tr><th>Bay</th><th>Amount</th><th>Doors</th><th>Tons</th><th>Holds</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {craft.getBays().map((bay, index) => {
                                        const type = findTransportBayType(bay.tag);
                                        const byTheTon = type?.tonsEach === null;
                                        return (
                                            <tr key={index}>
                                                <td>{craft.getBayName(bay)}</td>
                                                <td>
                                                    <InputNumeric
                                                        label={byTheTon ? "Tons" : "Bays"}
                                                        value={bay.amount}
                                                        min={byTheTon ? 0.5 : 1}
                                                        max={200}
                                                        step={byTheTon ? 0.5 : 1}
                                                        setValue={(amount) => this.update((c) => c.setBay(index, amount, bay.doors))}
                                                    />
                                                </td>
                                                <td>
                                                    <InputNumeric
                                                        label="Doors"
                                                        value={bay.doors}
                                                        min={0}
                                                        max={craft.getMaxBayDoors()}
                                                        step={1}
                                                        setValue={(doors) => this.update((c) => c.setBay(index, bay.amount, doors))}
                                                    />
                                                </td>
                                                <td>{craft.getBayWeight(bay)}</td>
                                                <td>{type?.capacity}</td>
                                                <td>
                                                    <button className="btn btn-danger btn-sm" title={"Remove " + craft.getBayName(bay)} onClick={() => this.update((c) => c.removeBay(index))}>
                                                        <Trash />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {craft.getBays().length === 0 ? <tr><td colSpan={6}>No bays yet.</td></tr> : null}
                                </tbody>
                            </table>
                            <label>
                                Add a bay:
                                <select data-testid="sc-add-bay" value="" onChange={(e) => { const value = e.currentTarget.value; if (value) this.update((c) => c.addBay(value, 1)); }}>
                                    <option value="">- choose a bay -</option>
                                    {bayOptions.map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name} ({option.tonsEach === null ? "by the ton" : `${option.tonsEach} tons`})</option>
                                    ))}
                                </select>
                            </label>
                            {remaining > 0 ? (
                                <p>
                                    <button className="btn btn-primary btn-sm" data-testid="sc-fill-cargo" onClick={() => this.update((c) => c.addBay("cargo", remaining))}>
                                        Make the {remaining} unspent tons a cargo bay
                                    </button>
                                </p>
                            ) : null}
                            <p className={craft.getBayDoors() > craft.getMaxBayDoors() ? "color-red" : ""}>
                                <strong>Bay Doors</strong>: {craft.getBayDoors()} of {craft.getMaxBayDoors()} &nbsp;|&nbsp;
                                <strong>Cargo Capacity</strong>: {craft.getCargoCapacity()} tons
                            </p>
                            <p className="smaller-text">
                                A bay for units other than infantry needs at least one door; an aerodyne Small Craft has no more
                                than 2 doors and a spheroid no more than 4 (TM p. 196). Bay weights and capacities are TechManual's
                                Transport Bay table (p. 239). Unspent weight is cargo if the craft has a bay for it.
                            </p>

                            <h3>Escape Systems</h3>
                            <InputNumeric
                                label="Escape Pods (7 tons each, 7 people)"
                                value={craft.getEscapePods()}
                                min={0}
                                max={20}
                                step={1}
                                setValue={(count) => this.update((c) => c.setEscapePods(count))}
                            />
                            <InputNumeric
                                label="Lifeboats (7 tons each, 7 people)"
                                value={craft.getLifeBoats()}
                                min={0}
                                max={20}
                                step={1}
                                setValue={(count) => this.update((c) => c.setLifeBoats(count))}
                            />

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/summary`} className="btn btn-primary pull-right btn-sm">Next: Summary <ArrowCircleRight /></Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/equipment`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface ICrewProps {
    appGlobals: IAppGlobals;
}
