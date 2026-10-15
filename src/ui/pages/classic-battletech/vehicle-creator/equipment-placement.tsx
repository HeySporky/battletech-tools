import React, { type JSX } from 'react';
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import { Link } from 'react-router';
import { IAppGlobals } from '../../../app-router';
import VehicleCreatorSideMenu from '../../../components/vehicle-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

export default class VehicleCreatorEquipmentPlacement extends React.Component<IEquipmentPlacementProps, IEquipmentPlacementState> {
    constructor(props: IEquipmentPlacementProps) {
        super(props);
        this.state = { updated: false };
        this.props.appGlobals.makeDocumentTitle("Step 4 | Vehicle Creator");
    }

    setAmmoBinShots = (uuid: string | undefined, shots: number): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.setAmmoBinShots(uuid, shots);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    setLocation = (uuid: string | undefined, location: string): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle && uuid) {
            vehicle.setEquipmentLocation(uuid, location);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    setPod = (uuid: string | undefined, pod: boolean): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle && uuid) {
            vehicle.setPodMounted(uuid, pod);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    setHalfTon = (uuid: string | undefined, halfTon: boolean): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle && uuid) {
            vehicle.setHalfTonBin(uuid, halfTon);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    setPintle = (uuid: string | undefined, pintle: boolean): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle && uuid) {
            vehicle.setPintle(uuid, pintle);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    setClips = (uuid: string | undefined, clips: number): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle && uuid) {
            vehicle.setLightWeaponClips(uuid, clips);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;
        // Light and Medium weapons on a Small Support Vehicle: extra clips, and a pintle on their side (TM pp.136, 234).
        const lightWeapons = vehicle.getEquipmentList().some((item) => item.sizeLabel === "Extra clips");

        // Equipment mounts in the body locations or the turret; the VTOL rotor takes none.
        const locationOptions: { tag: string; name: string }[] = [
            { tag: "", name: "Unallocated" },
            ...vehicle.getLocations().filter((loc) => loc.tag !== "rotor"),
        ];
        const placementLocations = locationOptions.filter((loc) => loc.tag !== "");

        return (
            <UIPage current="classic-battletech-vehicle-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <VehicleCreatorSideMenu appGlobals={this.props.appGlobals} current="equipment-placement" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Step 4: Place Equipment">
                            <p>
                                <strong>Item Slots</strong>: <span className={vehicle.getUsedItemSlots() > vehicle.getTotalItemSlots() ? "color-red" : ""}>{vehicle.getUsedItemSlots()} / {vehicle.getTotalItemSlots()}</span>
                                {" "}(ammunition takes one slot per type)
                            </p>
                            {vehicle.hasSponsonTurrets() ? (
                                <p className={vehicle.getSponsonIssue() ? "color-red" : ""}>
                                    <strong>Sponson Turrets</strong>: weapons on the left and right sides go in the sponsons
                                    ({vehicle.getSponsonWeight()} t). {vehicle.getSponsonIssue() ?? "Both sponsons carry the same tonnage."} (TO pp. 348, 411)
                                </p>
                            ) : null}
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Weight</th>
                                        <th>Slots</th>
                                        <th>Location</th>
                                        {vehicle.isOmni() ? <th>Pod</th> : null}
                                        {lightWeapons ? <th>Extra Clips</th> : null}
                                        {lightWeapons && vehicle.canHavePintles() ? <th>Pintle</th> : null}
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehicle.getEquipmentList().map((item) => (
                                        <tr key={item.uuid}>
                                            <td>{item.name}</td>
                                            <td>
                                                {item.weight}
                                                {vehicle.canBeHalfTonBin(item) ? (
                                                    // Machine gun ammunition may come in half-ton lots (TM pp.107, 137).
                                                    <label className="d-block smaller-text">
                                                        <input
                                                            type="checkbox"
                                                            aria-label={`${item.name} is a half-ton lot`}
                                                            checked={vehicle.isHalfTonBin(item)}
                                                            onChange={(e) => this.setHalfTon(item.uuid, e.currentTarget.checked)}
                                                        />{" "}half ton
                                                    </label>
                                                ) : null}
                                                {vehicle.canSetAmmoBinShots(item) && vehicle.getAmmoBinShotsPerTon(item) > 0 ? (
                                                    <label className="smaller-text" data-testid="fractional-ammo-shots">
                                                        &nbsp;shots:&nbsp;
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={vehicle.getAmmoBinShotsPerTon(item)}
                                                            value={vehicle.getAmmoBinShots(item)}
                                                            onChange={(e) => this.setAmmoBinShots(item.uuid, +e.currentTarget.value)}
                                                            className="width-auto"
                                                        />
                                                    </label>
                                                ) : null}
                                            </td>
                                            <td>{vehicle.getItemSlots(item)}</td>
                                            <td>
                                                <select
                                                    value={item.location ?? ""}
                                                    onChange={(e) => this.setLocation(item.uuid, e.currentTarget.value)}
                                                >
                                                    {locationOptions.map((loc) => (
                                                        <option key={loc.tag} value={loc.tag}>{loc.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            {vehicle.isOmni() ? (
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`${item.name} is pod-mounted`}
                                                        checked={vehicle.isPodMounted(item.uuid)}
                                                        onChange={(e) => this.setPod(item.uuid, e.currentTarget.checked)}
                                                    />
                                                </td>
                                            ) : null}
                                            {lightWeapons ? (
                                                <td>
                                                    {item.sizeLabel === "Extra clips" ? (
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={1}
                                                            aria-label={`${item.name} extra clips`}
                                                            value={item.size ?? 0}
                                                            onChange={(e) => this.setClips(item.uuid, +e.currentTarget.value)}
                                                        />
                                                    ) : null}
                                                </td>
                                            ) : null}
                                            {lightWeapons && vehicle.canHavePintles() ? (
                                                <td>
                                                    {item.sizeLabel === "Extra clips" ? (
                                                        <input
                                                            type="checkbox"
                                                            aria-label={`${item.name} is on a pintle`}
                                                            checked={!!item.pintle}
                                                            onChange={(e) => this.setPintle(item.uuid, e.currentTarget.checked)}
                                                        />
                                                    ) : null}
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {vehicle.isOmni() ? (
                                <p className="smaller-text" data-testid="vehicle-pod-space">
                                    OmniVehicle: {vehicle.getPodTonnage()} tons pod-mounted, {vehicle.getPodSpace()} tons of pod space. What is not
                                    pod-mounted is fixed to the base chassis and is the same in every configuration, as are the engine, armor,
                                    structure and turret tonnage (TM pp. 95, 108).
                                </p>
                            ) : null}

                            <h3>Slots Used By Location</h3>
                            <table className="table">
                                <tbody>
                                    {placementLocations.map((loc) => (
                                        <tr key={loc.tag}>
                                            <td>{loc.name}</td>
                                            <td>{vehicle.getEquipmentSlotsUsed(loc.tag)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/summary`} className="btn btn-primary pull-right btn-sm">Next: Summary <ArrowCircleRight /></Link>
                                <div className="inline-block text-left">
                                    <Link to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/equipment-selection`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                                </div>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IEquipmentPlacementProps {
    appGlobals: IAppGlobals;
}

interface IEquipmentPlacementState {
    updated: boolean;
}
