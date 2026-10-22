import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight, FaTrash } from "react-icons/fa";
import CapitalShip, { MAX_CAPITAL_SHIP_PEOPLE } from '../../../../classes/capital-ship';
import { GRAV_DECKS } from '../../../../data/advanced-aerospace-construction';
import { findTransportBayType, quartersTypes, transportBayTypes } from '../../../../data/small-craft-construction';
import { IAppGlobals } from '../../../app-router';
import NumberField from "./_numberField";
import CapitalShipCreatorSideMenu from '../../../components/capital-ship-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import CapitalShipStatusBar from './_statusBar';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const Trash = FaTrash as any;

export default class CapitalShipCreatorCrew extends React.Component<ICrewProps> {
    constructor(props: ICrewProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Crew and Bays | JumpShip and WarShip Creator");
    }

    update = (change: (ship: CapitalShip) => void): void => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (ship) {
            change(ship);
            this.props.appGlobals.saveCurrentCapitalShip(ship);
        }
    }

    render = (): JSX.Element => {
        const ship = this.props.appGlobals.currentCapitalShip;
        if (!ship) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const people = ship.getPeopleNeedingQuarters();
        const techBase = ship.getChassisTechBase();
        const bayOptions = transportBayTypes.filter((type) => !type.tech || type.tech === techBase || ship.isMixedTech());
        const remaining = ship.getRemainingTonnage();

        return (
            <UIPage current="classic-battletech-capital-ship-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <CapitalShipCreatorSideMenu appGlobals={this.props.appGlobals} current="crew" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <CapitalShipStatusBar ship={ship} rulesLevel={rulesLevel} />
                        <TextSection label="Crew and Quarters">
                            <NumberField
                                label={`Crew, officers and gunners included (at least ${ship.getMinimumCrew()}: ${ship.getBaseCrew()} and ${ship.getMinimumGunners()} gunners)`}
                                value={ship.getCrew()}
                                min={ship.getMinimumCrew()}
                                max={MAX_CAPITAL_SHIP_PEOPLE}
                                step={1}
                                setValue={(count) => this.update((s) => s.setCrew(count))}
                            />
                            <NumberField
                                label={`Officers among the crew (at least ${ship.getMinimumOfficers()}: one in six)`}
                                value={ship.getOfficers()}
                                min={0}
                                max={ship.getCrew()}
                                step={1}
                                setValue={(count) => this.update((s) => s.setOfficers(count))}
                            />
                            <NumberField label="Marines" value={ship.getMarines()} min={0} max={MAX_CAPITAL_SHIP_PEOPLE} step={1} setValue={(count) => this.update((s) => s.setMarines(count))} />
                            <NumberField label="Passengers" value={ship.getPassengers()} min={0} max={MAX_CAPITAL_SHIP_PEOPLE} step={1} setValue={(count) => this.update((s) => s.setPassengers(count))} />
                            <h3>Quarters</h3>
                            {quartersTypes.map((type) => (
                                <NumberField
                                    key={type.tag}
                                    label={`${type.name} (${type.tons} tons each)`}
                                    value={ship.getQuarters()[type.tag]}
                                    min={0}
                                    max={MAX_CAPITAL_SHIP_PEOPLE}
                                    step={1}
                                    setValue={(count) => this.update((s) => s.setQuarters(type.tag, count))}
                                />
                            ))}
                            <button className="btn btn-primary btn-sm" data-testid="cs-quarters-fill" onClick={() => this.update((s) => {
                                // The book's usual split: officers' quarters for the officers, crew quarters for everyone else.
                                s.setQuarters("firstClass", s.getOfficers());
                                s.setQuarters("crew", Math.max(0, s.getPeopleNeedingQuarters() - s.getOfficers() - s.getQuarters().secondClass - s.getQuarters().steerage));
                            })}>
                                Quarter everyone: officers 10 t, the rest 7 t
                            </button>
                            <p className={ship.getQuartersCapacity() < people ? "color-red" : ""} data-testid="cs-quarters">
                                <strong>Quarters</strong>: {ship.getQuartersCapacity()} for {people} crew, marines and passengers &nbsp;|&nbsp;
                                <strong>Weight</strong>: {ship.getQuartersWeight().toLocaleString("en-US")} tons
                            </p>
                            <p className="smaller-text">
                                All but bay personnel need quarters; officers usually get 10-ton quarters and the rest 7-ton ones, but any
                                quarters will do so long as everyone has one (SO:AA p.138).
                            </p>
                        </TextSection>

                        <TextSection label="Docking Collars and Grav Decks">
                            <NumberField
                                label={`Docking Collars (1,000 tons each; up to ${ship.getMaxDockingCollars()})`}
                                value={ship.getDockingCollars()}
                                min={0}
                                max={ship.getMaxDockingCollars()}
                                step={1}
                                setValue={(count) => this.update((s) => s.setDockingCollars(count))}
                            />
                            {GRAV_DECKS.filter((deck) => !deck.stationOnly || ship.isSpaceStation()).map((deck) => (
                                <NumberField
                                    key={deck.tag}
                                    label={`${deck.name} (${deck.tons} tons each)`}
                                    value={ship.getGravDecks()[deck.tag]}
                                    min={0}
                                    max={ship.getMaxGravDecks()}
                                    step={1}
                                    setValue={(count) => this.update((s) => s.setGravDecks(deck.tag, count))}
                                />
                            ))}
                            <p className="smaller-text">
                                One docking collar for every 50,000 tons, rounded up; each carries up to 100,000 tons (TO:AUE p.116; SO:AA p.142
                                with errata v5.0). Up to {ship.getMaxGravDecks()} grav decks: three, and one for every 100,000 tons (TO:AUE p.126).
                            </p>
                        </TextSection>

                        <TextSection label="Transport Bays">
                            <table className="table" data-testid="cs-bays">
                                <thead>
                                    <tr><th>Bay</th><th>Amount</th><th>Doors</th><th>Tons</th><th>Holds</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {ship.getBays().map((bay, index) => {
                                        const type = findTransportBayType(bay.tag);
                                        const byTheTon = type?.tonsEach === null;
                                        return (
                                            <tr key={index}>
                                                <td>{ship.getBayName(bay)}</td>
                                                <td>
                                                    <NumberField label={byTheTon ? "Tons" : "Bays"} value={bay.amount} min={byTheTon ? 0.5 : 1} max={ship.getTonnage()} step={byTheTon ? 0.5 : 1}
                                                        setValue={(amount) => this.update((s) => s.setBay(index, amount, bay.doors))} />
                                                </td>
                                                <td>
                                                    <NumberField label="Doors" value={bay.doors} min={0} max={ship.getMaxBayDoors()} step={1}
                                                        setValue={(doors) => this.update((s) => s.setBay(index, bay.amount, doors))} />
                                                </td>
                                                <td>{ship.getBayWeight(bay).toLocaleString("en-US")}</td>
                                                <td>{type?.capacity}</td>
                                                <td>
                                                    <button className="btn btn-danger btn-sm" title={"Remove " + ship.getBayName(bay)} onClick={() => this.update((s) => s.removeBay(index))}>
                                                        <Trash />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {ship.getBays().length === 0 ? <tr><td colSpan={6}>No bays yet.</td></tr> : null}
                                </tbody>
                            </table>
                            <label>
                                Add a bay:
                                <select data-testid="cs-add-bay" value="" onChange={(e) => { const value = e.currentTarget.value; if (value) this.update((s) => s.addBay(value, 1)); }}>
                                    <option value="">- choose a bay -</option>
                                    {bayOptions.map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name} ({option.tonsEach === null ? "by the ton" : `${option.tonsEach} tons`})</option>
                                    ))}
                                </select>
                            </label>
                            {remaining > 0 ? (
                                <p>
                                    <button className="btn btn-primary btn-sm" data-testid="cs-fill-cargo" onClick={() => this.update((s) => s.addBay("cargo", remaining))}>
                                        Make the {remaining.toLocaleString("en-US")} unspent tons a cargo bay
                                    </button>
                                </p>
                            ) : null}
                            <p className={ship.getBayDoors() > ship.getMaxBayDoors() ? "color-red" : ""}>
                                <strong>Bay Doors</strong>: {ship.getBayDoors()} of {ship.getMaxBayDoors()} &nbsp;|&nbsp;
                                <strong>Cargo Capacity</strong>: {ship.getCargoCapacity().toLocaleString("en-US")} tons
                            </p>
                            <p className="smaller-text">
                                A vessel with transport bays needs at least one bay door; the most doors are set by type and tonnage
                                (SO:AA p.143). Bay weights and capacities are TechManual's Transport Bay table (p. 239).
                            </p>

                            <h3>Escape Systems</h3>
                            <NumberField label="Escape Pods (7 tons each, 7 people)" value={ship.getEscapePods()} min={0} max={MAX_CAPITAL_SHIP_PEOPLE} step={1} setValue={(count) => this.update((s) => s.setEscapePods(count))} />
                            <NumberField label="Lifeboats (7 tons each, 7 people)" value={ship.getLifeBoats()} min={0} max={MAX_CAPITAL_SHIP_PEOPLE} step={1} setValue={(count) => this.update((s) => s.setLifeBoats(count))} />

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/summary`} className="btn btn-primary pull-right btn-sm">Next: Summary <ArrowCircleRight /></Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/equipment`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
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
