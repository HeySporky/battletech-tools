import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaPlus, FaTrash } from "react-icons/fa";
import MicroMech, { MICRO_MECH_MAX_WEAPONS } from '../../../../classes/micro-mech';
import { MicroMechLocation } from '../../../../data/micro-mech-construction';
import { IMicroMechItem, MicroMechAmmoType, MicroMechItemKind, microMechItems } from '../../../../data/micro-mech-equipment-custom';
import { IAppGlobals } from '../../../app-router';
import { MicroMechCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import MicroMechStatusBar from './_statusBar';
const ArrowCircleRight = FaArrowCircleRight as any;
const Plus = FaPlus as any;
const Trash = FaTrash as any;

const KIND_NAMES: Record<MicroMechItemKind, string> = { energy: "Energy weapons", ballistic: "Ballistic weapons", missile: "Missile weapons", equipment: "Equipment" };
const KINDS: MicroMechItemKind[] = ["energy", "ballistic", "missile", "equipment"];
const AMMO_STEP_KG = 250;
const AMMO_MAX_KG = 4000;

const ammoKgOptions = (current: number): number[] => {
    const top = Math.max(AMMO_MAX_KG, current);
    return Array.from({ length: top / AMMO_STEP_KG + 1 }, (_unused, index) => index * AMMO_STEP_KG);
};

export default class MicroMechCreatorEquipment extends React.Component<IEquipmentProps, IEquipmentState> {
    constructor(props: IEquipmentProps) {
        super(props);
        this.state = { location: "torso", filter: "", message: "" };
        this.props.appGlobals.makeDocumentTitle("Step 4 | Micro-Mech Creator");
    }

    update = (change: (micro: MicroMech) => boolean | void, refusal = ""): void => {
        const micro = this.props.appGlobals.currentMicroMech;
        if (!micro) return;
        const result = change(micro);
        this.setState({ message: result === false ? refusal : "" });
        this.props.appGlobals.saveCurrentMicroMech(micro);
    }

    /**
     * Sets a lot of ammunition. A lot already placed stays where it is; a new one goes where the version keeps it:
     * beside its weapon if there is a free slot, else the torso, else any other location that will take it.
     */
    setAmmoWhereItFits = (micro: MicroMech, mountIndex: number, kg: number, type: MicroMechAmmoType, current?: MicroMechLocation): boolean => {
        if (kg === 0 || current) return micro.setAmmo(mountIndex, kg, current, type);
        const home = micro.getMounts()[mountIndex]?.location;
        const candidates = [home, "torso" as const, ...micro.getLocations()].filter((where): where is MicroMechLocation => !!where && where !== "torsoRear");
        return Array.from(new Set(candidates)).some((where) => micro.setAmmo(mountIndex, kg, where, type));
    }

    add = (item: IMicroMechItem, location: MicroMechLocation): void => {
        this.update((m) => m.addMount(item.tag, location), `${item.name} does not fit in the ${this.props.appGlobals.currentMicroMech?.getLocationName(location)}: it needs ${item.slots} free ${item.slots === 1 ? "slot" : "slots"} in one location, and this version may not allow it there.`);
    }

    render = (): JSX.Element => {
        const micro = this.props.appGlobals.currentMicroMech;
        if (!micro) return <></>;
        const locations: MicroMechLocation[] = micro.getLocations().filter((each) => each !== "torsoRear");
        const location: MicroMechLocation = locations.includes(this.state.location) ? this.state.location : "torso";
        const filter = this.state.filter.trim().toLowerCase();
        const mounts = micro.getMounts();
        const rules = micro.getRules();

        return (
            <UIPage current="classic-battletech-micro-mech-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <MicroMechCreatorSideMenu appGlobals={this.props.appGlobals} current="equipment" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <MicroMechStatusBar micro={micro} />
                        <TextSection label="Step 4: Weapons, Ammunition and Equipment">
                            <p className="smaller-text">
                                A Micro-Mech mounts at most {MICRO_MECH_MAX_WEAPONS} weapons, and an item takes all its slots in one location.
                                A missile launcher is bought by the tube, and a group of any size is one weapon. Ammunition comes in 250 kg lots
                                and sits in the torso{rules.ammoLocations === "torso" ? " (this version allows it nowhere else)" : " or wherever it has a free slot"}.
                            </p>
                            {this.state.message ? <p className="color-red" data-testid="mm-message">{this.state.message}</p> : null}

                            <table className="table" data-testid="mm-mounts">
                                <thead>
                                    <tr><th>Item</th><th>Location</th><th>Weight</th><th>Ammunition</th><th><span className="visually-hidden">Actions</span></th></tr>
                                </thead>
                                <tbody>
                                    {mounts.length === 0 ? <tr><td colSpan={5}>Nothing mounted yet.</td></tr> : null}
                                    {mounts.map((mount, index) => (
                                        <tr key={index}>
                                            <td>{mount.item.name}{mount.item.heat > 0 ? <span className="smaller-text"> (heat {mount.item.heat})</span> : null}</td>
                                            <td>{micro.getLocationName(mount.location)}</td>
                                            <td>{mount.item.weightKg} kg, {mount.item.slots} {mount.item.slots === 1 ? "slot" : "slots"}</td>
                                            <td>
                                                {mount.item.ammo ? mount.item.ammo.map((ammo) => {
                                                    const lot = mount.ammo.find((each) => each.type === ammo.type);
                                                    const kg = lot?.kg ?? 0;
                                                    const shots = micro.getAmmoLots().find((each) => each.mountIndex === index && each.type === ammo.type)?.shots ?? 0;
                                                    return (
                                                        <div key={ammo.type}>
                                                            <select
                                                                aria-label={`${mount.item.name}${ammo.type === "cluster" ? " cluster" : ""} ammunition`}
                                                                data-testid={`mm-ammo-${index}-${ammo.type}`}
                                                                style={{ width: "auto" }} value={kg}
                                                                onChange={(e) => { const value = +e.currentTarget.value; this.update((m) => this.setAmmoWhereItFits(m, index, value, ammo.type, lot?.location), "That ammunition does not fit: it needs a free slot in a location this version allows."); }}
                                                            >
                                                                {ammoKgOptions(kg).map((option) => <option key={option} value={option}>{option === 0 ? "None" : `${option} kg`}</option>)}
                                                            </select>
                                                            {ammo.type === "cluster" ? " cluster" : ""}
                                                            {kg > 0 ? (
                                                                <>
                                                                    {` (${shots} shots) in `}
                                                                    <select
                                                                        aria-label={`${mount.item.name}${ammo.type === "cluster" ? " cluster" : ""} ammunition location`}
                                                                        data-testid={`mm-ammo-location-${index}-${ammo.type}`}
                                                                        style={{ width: "auto" }} value={lot?.location ?? mount.location}
                                                                        onChange={(e) => { const where = e.currentTarget.value as MicroMechLocation; this.update((m) => m.setAmmo(index, kg, where, ammo.type), "That ammunition does not fit there: the location needs a free slot, and this version may not allow it."); }}
                                                                    >
                                                                        {locations.map((option) => <option key={option} value={option}>{micro.getLocationName(option)}</option>)}
                                                                    </select>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    );
                                                }) : <span className="smaller-text">{mount.item.oneShot ? "one shot" : "none"}</span>}
                                            </td>
                                            <td className="text-right">
                                                <button className="btn btn-sm btn-danger" type="button" title={`Remove ${mount.item.name}`} aria-label={`Remove ${mount.item.name}`} onClick={() => this.update((m) => m.removeMount(index))}>
                                                    <Trash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <h3>Heat sinks</h3>
                            <p data-testid="mm-heat-text">
                                The engine gives {micro.getFreeHeatSinks()} free heat sinks. The energy weapons make {micro.getEnergyHeat()} heat.
                                {micro.getEngineKind() === "ice" ? ` An ICE engine needs ${micro.getPowerAmplifierWeight()} kg of power amplifiers for its energy weapons.` : ""}
                            </p>
                            <label>
                                Extra heat sinks ({rules.heatSinkKg} kg each, at most {micro.getMaxExtraHeatSinks()}):
                                <select data-testid="mm-extra-sinks" value={micro.getExtraHeatSinks()} style={{ width: "auto" }} onChange={(e) => { const value = +e.currentTarget.value; this.update((m) => m.setExtraHeatSinks(value)); }}>
                                    {Array.from({ length: Math.min(micro.getMaxExtraHeatSinks(), 20) + 1 }, (_unused, count) => count).map((count) => <option key={count} value={count}>{count}</option>)}
                                </select>
                            </label>

                            <h3>Add equipment</h3>
                            <label>
                                Location:
                                <select data-testid="mm-location" value={location} style={{ width: "auto" }} onChange={(e) => this.setState({ location: e.currentTarget.value as MicroMechLocation })}>
                                    {locations.map((option) => <option key={option} value={option}>{micro.getLocationName(option)} ({micro.getFreeSlots(option)} slots free)</option>)}
                                </select>
                            </label>
                            <label>
                                Search:
                                <input type="text" data-testid="mm-filter" value={this.state.filter} onChange={(e) => this.setState({ filter: e.currentTarget.value })} />
                            </label>
                            {KINDS.map((kind) => {
                                const items = microMechItems.filter((item) => item.kind === kind && (!filter || item.name.toLowerCase().includes(filter)));
                                if (items.length === 0) return null;
                                return (
                                    <details key={kind} open={filter !== "" || kind === "energy"}>
                                        <summary>{KIND_NAMES[kind]} ({items.length})</summary>
                                        <table className="table table-sm">
                                            <thead>
                                                <tr><th>Item</th><th className="text-center">Heat</th><th className="text-center">Damage</th><th className="text-center">kg</th><th className="text-center">Slots</th><th><span className="visually-hidden">Add</span></th></tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item) => (
                                                    <tr key={item.tag}>
                                                        <td>{item.name}</td>
                                                        <td className="text-center">{item.heat}</td>
                                                        <td className="text-center">{item.damage}</td>
                                                        <td className="text-center">{item.weightKg}</td>
                                                        <td className="text-center">{item.slots}</td>
                                                        <td className="text-right">
                                                            <button className="btn btn-sm btn-primary" type="button" title={`Add ${item.name} to the ${micro.getLocationName(location)}`} aria-label={`Add ${item.name}`} onClick={() => this.add(item, location)}>
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

                            <h3>Slots</h3>
                            <table className="table table-sm" data-testid="mm-slot-table">
                                <tbody>
                                    {micro.getLocations().filter((each) => each !== "torsoRear").map((each) => (
                                        <tr key={each}>
                                            <th>{micro.getLocationName(each)}</th>
                                            <td>{micro.getPlaySlots(each).map((slot) => slot ?? "(free)").join(", ")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="smaller-text">Jump jets take {micro.getJumpJets()} slots: one to each leg in turn while a leg has room, then the torso (NGCFells's placement; the texts say only "the legs and torso").</p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/micro-mech-creator/summary`} className="btn btn-primary pull-right btn-sm">
                                    Summary <ArrowCircleRight />
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
    location: MicroMechLocation;
    filter: string;
    message: string;
}
