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

    setLocation = (uuid: string | undefined, location: string): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle && uuid) {
            vehicle.setEquipmentLocation(uuid, location);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;

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
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehicle.getEquipmentList().map((item) => (
                                        <tr key={item.uuid}>
                                            <td>{item.name}</td>
                                            <td>{item.weight}</td>
                                            <td>{item.space?.combatVehicle ?? 0}</td>
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

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
