import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaPlus, FaTrash } from "react-icons/fa";
import Walker from '../../../../classes/walker';
import { WALKER_CENTER_TORSO_RULE, WalkerLocation } from '../../../../data/walker-construction';
import { IEquipmentItem } from '../../../../data/data-interfaces';
import { IAppGlobals } from '../../../app-router';
import { WalkerCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import WalkerStatusBar from './_statusBar';
const ArrowCircleRight = FaArrowCircleRight as any;
const Plus = FaPlus as any;
const Trash = FaTrash as any;

/** Where an item goes: a location, or the turret (which is in the control section). */
type Place = WalkerLocation | "turret";

const HEAT_SINK_NAMES: Record<string, string> = { single: "Single heat sinks", double: "Double heat sinks" };
const MAX_EXTRA_SINKS = 40;

export default class WalkerCreatorEquipment extends React.Component<IEquipmentProps, IEquipmentState> {
    constructor(props: IEquipmentProps) {
        super(props);
        this.state = { place: "ft", filter: "", message: "" };
        this.props.appGlobals.makeDocumentTitle("Step 4 | Walker Creator");
    }

    update = (change: (walker: Walker) => boolean | void, refusal = ""): void => {
        const walker = this.props.appGlobals.currentWalker;
        if (!walker) return;
        const result = change(walker);
        this.setState({ message: result === false ? refusal : "" });
        this.props.appGlobals.saveCurrentWalker(walker);
    }

    add = (item: IEquipmentItem, place: Place): void => {
        const walker = this.props.appGlobals.currentWalker;
        if (!walker) return;
        const result = place === "turret" ? walker.addEquipment(item.tag, "cs", true) : walker.addEquipment(item.tag, place, false);
        // The reason is the rule's own words (the center torso limit, no room, over the tonnage).
        this.setState({ message: result.added ? "" : (result.reason ?? `${item.name} cannot be mounted there.`) });
        this.props.appGlobals.saveCurrentWalker(walker);
    }

    render = (): JSX.Element => {
        const walker = this.props.appGlobals.currentWalker;
        if (!walker) return <></>;
        const locations = walker.getLocations();
        const turret = walker.hasTurret();
        const place: Place = this.state.place === "turret" && !turret ? "ft" : this.state.place;
        const filter = this.state.filter.trim().toLowerCase();
        const mounts = walker.getEquipment();
        const offer = walker.getEquipmentOffer().filter((item) => !filter || item.name.toLowerCase().includes(filter));
        const categories = Array.from(new Set(offer.map((item) => item.category)));
        const heatTypes = walker.getHeatSinkTypeOptions();

        return (
            <UIPage current="classic-battletech-walker-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <WalkerCreatorSideMenu appGlobals={this.props.appGlobals} current="equipment" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <WalkerStatusBar walker={walker} />
                        <TextSection label="Step 4: Turret, Weapons, Heat Sinks and Equipment">
                            <p className="smaller-text">
                                An item that does not fit whole in a location splits into one adjacent location with room (ours), except in the control
                                section. {WALKER_CENTER_TORSO_RULE}
                            </p>
                            {this.state.message ? <p className="color-red" data-testid="walker-message">{this.state.message}</p> : null}

                            <h3>Turret</h3>
                            <label>
                                <input type="checkbox" data-testid="walker-turret" checked={turret}
                                    onChange={(e) => { const value = e.currentTarget.checked; this.update((w) => w.setTurret(value)); }} />
                                &nbsp;Turret on the control section ({walker.getTurretWeight() || "2 to 6"} tons; items listed below the turret mechanism are in the turret)
                            </label>

                            <h3>Heat sinks</h3>
                            <p data-testid="walker-heat-text">
                                The engine gives {walker.getFreeHeatSinks()} free heat sinks and holds {walker.getEngineHeatSinkCapacity()} without slots.
                                The weapons make {walker.getHeat()} heat; {walker.getHeatSinks()} sinks dissipate {walker.getHeatDissipation()}.
                                {walker.getPowerAmplifierWeight() > 0 ? ` Power amplifiers: ${walker.getPowerAmplifierWeight()} tons.` : ""}
                            </p>
                            <label>
                                Total heat sinks:
                                <select data-testid="walker-sinks" value={walker.getHeatSinks()} style={{ width: "auto" }} onChange={(e) => { const value = +e.currentTarget.value; this.update((w) => w.setHeatSinks(value)); }}>
                                    {Array.from({ length: MAX_EXTRA_SINKS + 1 }, (_unused, extra) => walker.getFreeHeatSinks() + extra).map((total) => <option key={total} value={total}>{total}</option>)}
                                </select>
                            </label>
                            {heatTypes.length > 1 ? (
                                <label>
                                    Type:
                                    <select data-testid="walker-sink-type" value={walker.getHeatSinkType()} style={{ width: "auto" }} onChange={(e) => { const value = e.currentTarget.value; this.update((w) => w.setHeatSinkType(value)); }}>
                                        {heatTypes.map((tag) => <option key={tag} value={tag}>{HEAT_SINK_NAMES[tag] ?? tag}</option>)}
                                    </select>
                                </label>
                            ) : null}

                            <h3>Mounted</h3>
                            <table className="table" data-testid="walker-mounts">
                                <thead>
                                    <tr><th>Item</th><th>Location</th><th>Weight</th><th><span className="visually-hidden">Actions</span></th></tr>
                                </thead>
                                <tbody>
                                    {mounts.length === 0 ? <tr><td colSpan={4}>Nothing mounted yet.</td></tr> : null}
                                    {mounts.map((mount) => (
                                        <tr key={mount.uuid}>
                                            <td>
                                                {mount.name}{mount.heat > 0 ? <span className="smaller-text"> (heat {mount.heat})</span> : null}
                                                {mount.antiInfantryOnly ? <span className="smaller-text"> (anti-infantry only)</span> : null}
                                            </td>
                                            <td>
                                                {walker.getLocationName(mount.location)}{mount.inTurret ? " (turret)" : ""}
                                                {mount.split ? ` and ${walker.getLocationName(mount.split.location)} (${mount.split.slots} of ${mount.slots} slots)` : ""}
                                            </td>
                                            <td>{mount.weight} tons, {mount.slots} {mount.slots === 1 ? "slot" : "slots"}</td>
                                            <td className="text-right">
                                                <button className="btn btn-sm btn-danger" type="button" title={`Remove ${mount.name}`} aria-label={`Remove ${mount.name}`}
                                                    onClick={() => this.update((w) => w.removeEquipment(mount.uuid))}>
                                                    <Trash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <h3>Add equipment</h3>
                            <label>
                                Location:
                                <select data-testid="walker-location" value={place} style={{ width: "auto" }} onChange={(e) => this.setState({ place: e.currentTarget.value as Place })}>
                                    {locations.map((location) => <option key={location} value={location}>{walker.getLocationName(location)} ({walker.getFreeSlots(location)} slots free)</option>)}
                                    {turret ? <option value="turret">Turret</option> : null}
                                </select>
                            </label>
                            <label>
                                Search:
                                <input type="text" data-testid="walker-filter" value={this.state.filter} onChange={(e) => this.setState({ filter: e.currentTarget.value })} />
                            </label>
                            {categories.map((category) => {
                                const items = offer.filter((item) => item.category === category);
                                return (
                                    <details key={category} open={filter !== ""}>
                                        <summary>{category} ({items.length})</summary>
                                        <table className="table table-sm">
                                            <thead>
                                                <tr><th>Item</th><th className="text-center">Heat</th><th className="text-center">Tons</th><th className="text-center">Slots</th><th><span className="visually-hidden">Add</span></th></tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item) => (
                                                    <tr key={item.tag}>
                                                        <td>{item.name}</td>
                                                        <td className="text-center">{item.heat || 0}</td>
                                                        <td className="text-center">{item.weight ?? 0}</td>
                                                        <td className="text-center">{item.criticals ?? 0}</td>
                                                        <td className="text-right">
                                                            <button className="btn btn-sm btn-primary" type="button" title={`Add ${item.name}`} aria-label={`Add ${item.name}`} onClick={() => this.add(item, place)}>
                                                                <Plus />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </details>
                                );
                            })}

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/walker-creator/criticals`} className="btn btn-primary pull-right btn-sm">
                                    Next Step <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IEquipmentProps {
    appGlobals: IAppGlobals;
}

interface IEquipmentState {
    place: Place;
    filter: string;
    message: string;
}
