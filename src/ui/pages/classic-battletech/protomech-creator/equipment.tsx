import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaPlus, FaTrash } from "react-icons/fa";
import ProtoMech, { MAX_PROTOMECH_SHOTS, formatProtoMechDamage } from '../../../../classes/protomech';
import { ProtoMechMountLocation, getProtoMechEquipmentKg } from '../../../../data/protomech-construction';
import { IAppGlobals } from '../../../app-router';
import ProtoMechCreatorSideMenu from '../../../components/protomech-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import ProtoMechStatusBar from './_statusBar';
const ArrowCircleRight = FaArrowCircleRight as any;
const Plus = FaPlus as any;
const Trash = FaTrash as any;

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_unused, index) => from + index);

export default class ProtoMechCreatorEquipment extends React.Component<IEquipmentProps, IEquipmentState> {
    constructor(props: IEquipmentProps) {
        super(props);
        this.state = { location: "torso", tubes: {}, filter: "" };
        this.props.appGlobals.makeDocumentTitle("Step 5 | ProtoMech Creator");
    }

    update = (change: (proto: ProtoMech) => void): void => {
        const proto = this.props.appGlobals.currentProtoMech;
        if (proto) {
            change(proto);
            this.props.appGlobals.saveCurrentProtoMech(proto);
        }
    }

    render = (): JSX.Element => {
        const proto = this.props.appGlobals.currentProtoMech;
        if (!proto) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const locations = proto.getMountLocations();
        const location: ProtoMechMountLocation = locations.includes(this.state.location) ? this.state.location : "torso";
        const filter = this.state.filter.trim().toLowerCase();
        const catalog = proto.getAvailableCatalogItems(rulesLevel).filter((item) => !filter || item.name.toLowerCase().includes(filter));
        const mounts = proto.getMounts();

        return (
            <UIPage current="classic-battletech-protomech-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <ProtoMechCreatorSideMenu appGlobals={this.props.appGlobals} current="equipment" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <ProtoMechStatusBar proto={proto} />
                        <TextSection label="Step 5: Mounted Weapons and Equipment">
                            <table className="table" data-testid="pm-mounts">
                                <thead>
                                    <tr><th>Item</th><th>Location</th><th>Weight</th><th>Ammunition</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {mounts.length === 0 ? <tr><td colSpan={5}>Nothing mounted yet.</td></tr> : null}
                                    {mounts.map((mount, index) => {
                                        const missile = proto.getMissile(mount);
                                        const special = proto.getSpecial(mount);
                                        const ammoOptions = proto.getAmmoOptions(mount);
                                        return (
                                            <tr key={index}>
                                                <td>
                                                    {proto.getMountName(mount)}
                                                    {missile ? (
                                                        <>
                                                            {" "}
                                                            <select aria-label={`${proto.getMountName(mount)} tubes`} value={mount.tubes ?? 1} style={{ width: "auto" }} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.updateMount(index, { tubes: value })); }}>
                                                                {range(1, missile.maxTubes).map((tubes) => <option key={tubes} value={tubes}>{tubes} {tubes === 1 ? "tube" : "tubes"}</option>)}
                                                            </select>
                                                        </>
                                                    ) : null}
                                                    {proto.needsHeatSinks(mount) ? <span className="smaller-text"> (heat {proto.getCatalogItem(mount)?.heat ?? 0})</span> : null}
                                                </td>
                                                <td>
                                                    <select aria-label={`${proto.getMountName(mount)} location`} value={mount.location} style={{ width: "auto" }} onChange={(e) => { const value = e.currentTarget.value as ProtoMechMountLocation; this.update((p) => p.updateMount(index, { location: value })); }}>
                                                        {locations.filter((option) => !special || special.locations.includes(option)).map((option) => (
                                                            <option key={option} value={option}>{proto.getLocationName(option)}</option>
                                                        ))}
                                                    </select>
                                                    {mount.location === "torso" && !special ? (
                                                        <label style={{ display: "inline", marginLeft: "0.5em" }}>
                                                            <input type="checkbox" checked={!!mount.rear} onChange={(e) => { const value = e.currentTarget.checked; this.update((p) => p.updateMount(index, { rear: value })); }} />
                                                            &nbsp;rear
                                                        </label>
                                                    ) : null}
                                                </td>
                                                <td>{proto.getMountWeight(mount)} kg</td>
                                                <td>
                                                    {special?.fixedShots ? `${special.fixedShots} shots, built in` : null}
                                                    {proto.usesAmmo(mount) && !special ? (
                                                        <>
                                                            <input
                                                                type="number" min={0} max={MAX_PROTOMECH_SHOTS} style={{ width: "5em" }}
                                                                aria-label={`${proto.getMountName(mount)} shots`} data-testid={`pm-shots-${index}`}
                                                                value={proto.getShots(mount)}
                                                                onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.updateMount(index, { shots: value })); }}
                                                            />
                                                            &nbsp;shots, {proto.getAmmoWeight(mount)} kg
                                                            {ammoOptions.length > 1 ? (
                                                                <select aria-label={`${proto.getMountName(mount)} ammunition`} value={proto.getAmmo(mount)?.tag ?? ""} style={{ width: "auto", marginLeft: "0.5em" }} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.updateMount(index, { ammoTag: value })); }}>
                                                                    {ammoOptions.map((ammo) => <option key={ammo.tag} value={ammo.tag}>{ammo.name}</option>)}
                                                                </select>
                                                            ) : null}
                                                        </>
                                                    ) : null}
                                                </td>
                                                <td className="text-right">
                                                    <button className="btn btn-sm btn-danger" type="button" title={`Remove ${proto.getMountName(mount)}`} onClick={() => this.update((p) => p.removeMount(index))}>
                                                        <Trash />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <p className="smaller-text">
                                Every item takes one slot whatever its size. Ammunition is bought by the shot, a volley for a missile
                                launcher, and counts toward neither a location's items nor its weight (TM pp. 87-88).
                            </p>
                        </TextSection>

                        <TextSection label="Add Weapons and Equipment">
                            <label>
                                Mount in:
                                <select data-testid="pm-add-location" value={location} onChange={(e) => this.setState({ location: e.currentTarget.value as ProtoMechMountLocation })}>
                                    {locations.map((option) => {
                                        const maxKg = proto.getLocationMaxWeight(option);
                                        return <option key={option} value={option}>{proto.getLocationName(option)} ({proto.getLocationItems(option)} {proto.getLocationItems(option) === 1 ? "item" : "items"}{maxKg === null ? ", any weight" : `, ${maxKg} kg`})</option>;
                                    })}
                                </select>
                            </label>
                            {!proto.hasMainGun() ? <p className="smaller-text">A main gun mount is chosen in Step 1.</p> : null}

                            <h4>Missile Launchers, by the Tube</h4>
                            <table className="table">
                                <tbody>
                                    {proto.getAvailableMissiles(rulesLevel).map((missile) => {
                                        const tubes = this.state.tubes[missile.family] ?? 1;
                                        return (
                                            <tr key={missile.family}>
                                                <td>{missile.name}</td>
                                                <td>
                                                    <select aria-label={`${missile.name} tubes`} data-testid={`pm-tubes-${missile.family}`} value={tubes} style={{ width: "auto" }} onChange={(e) => this.setState({ tubes: { ...this.state.tubes, [missile.family]: +e.currentTarget.value } })}>
                                                        {range(1, missile.maxTubes).map((count) => <option key={count} value={count}>{count} {count === 1 ? "tube" : "tubes"}</option>)}
                                                    </select>
                                                </td>
                                                <td>{missile.kgPerTube * tubes} kg ({missile.kgPerTube} kg a tube)</td>
                                                <td>BV {missile.bv[tubes - 1]}</td>
                                                <td className="smaller-text">{missile.book} p. {missile.page}</td>
                                                <td className="text-right">
                                                    <button className="btn btn-sm btn-primary" type="button" data-testid={`pm-add-pm-${missile.family}`} title={`Add ${missile.name} ${tubes}`} onClick={() => this.update((p) => p.addMount(`pm-${missile.family}`, location, tubes))}>
                                                        <Plus />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <h4>ProtoMech Equipment</h4>
                            <table className="table">
                                <tbody>
                                    {proto.getAvailableSpecials(rulesLevel).length === 0 ? <tr><td>None at this rules level for this chassis.</td></tr> : null}
                                    {proto.getAvailableSpecials(rulesLevel).map((item) => (
                                        <tr key={item.tag}>
                                            <td title={item.notes}>{item.name}</td>
                                            <td>{getProtoMechEquipmentKg(item, proto.getTons())} kg</td>
                                            <td>{item.locations.map((option) => proto.getLocationName(option)).join(", ")}</td>
                                            <td className="smaller-text">{item.book} p. {item.page}</td>
                                            <td className="text-right">
                                                <button className="btn btn-sm btn-primary" type="button" data-testid={`pm-add-${item.tag}`} title={`Add ${item.name}`} disabled={!item.locations.includes(location)} onClick={() => this.update((p) => p.addMount(item.tag, location))}>
                                                    <Plus />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <h4>Weapons and Electronics</h4>
                            <label>
                                Search:
                                <input type="text" value={this.state.filter} data-testid="pm-filter" onChange={(e) => this.setState({ filter: e.currentTarget.value })} />
                            </label>
                            <table className="table" data-testid="pm-catalog">
                                <thead>
                                    <tr><th>Item</th><th>Weight</th><th>Heat</th><th>Damage</th><th>Range</th><th>BV</th><th>Source</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {catalog.map((item) => (
                                        <tr key={item.tag}>
                                            <td>{item.name}</td>
                                            <td>{Math.round(item.weight * 1000)} kg</td>
                                            <td>{item.heat || ""}</td>
                                            <td>{formatProtoMechDamage(item.damage)}</td>
                                            <td>{item.range && item.range.long ? `${item.range.min || 0}/${item.range.short}/${item.range.medium}/${item.range.long}` : ""}</td>
                                            <td>{item.battleValue || ""}</td>
                                            <td className="smaller-text">{item.book} p. {item.page}</td>
                                            <td className="text-right">
                                                <button className="btn btn-sm btn-primary" type="button" data-testid={`pm-add-${item.tag}`} title={`Add ${item.name}`} onClick={() => this.update((p) => p.addMount(item.tag, location))}>
                                                    <Plus />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/protomech-creator/summary`} className="btn btn-primary pull-right btn-sm">
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
    /** Where the next item added goes. */
    location: ProtoMechMountLocation;
    /** Tubes chosen for each launcher family before it is added. */
    tubes: Record<string, number>;
    filter: string;
}
