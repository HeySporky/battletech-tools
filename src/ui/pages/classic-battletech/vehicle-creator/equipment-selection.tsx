import React, { type JSX } from 'react';
import { FaArrowCircleLeft, FaArrowCircleRight, FaTrash } from "react-icons/fa";
import { Link } from 'react-router';
import { IEquipmentItem } from '../../../../data/data-interfaces';
import { CUSTOM_HOMEBREW_RULES_LEVEL } from '../../../../data/equipment-registry';
import { IAppGlobals } from '../../../app-router';
import AvailableEquipment from '../../../components/available-equipment';
import { VehicleCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import TonnageBar from '../../../components/tonnage-bar';
import UIPage from '../../../components/ui-page';
import VehicleLightWeapons from './_light-weapons';
import { unitRulesLevel } from '../../../components/game-settings-block';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const Trash = FaTrash as any;

export default class VehicleCreatorEquipmentSelection extends React.Component<IEquipmentSelectionProps, IEquipmentSelectionState> {
    constructor(props: IEquipmentSelectionProps) {
        super(props);
        this.state = { updated: false };
        this.props.appGlobals.makeDocumentTitle("Step 3 | Vehicle Creator");
    }

    addEquipment = (item: IEquipmentItem): boolean => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle) {
            vehicle.addEquipmentFromTag(item.tag, "");
            this.props.appGlobals.saveCurrentVehicle(vehicle);
            return true;
        }
        return false;
    }

    removeEquipment = (uuid: string | undefined): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle && uuid) {
            vehicle.removeEquipment(uuid);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;
        const rulesLevel = unitRulesLevel(vehicle, this.props.appGlobals.appSettings);

        return (
            <UIPage current="classic-battletech-vehicle-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <VehicleCreatorSideMenu appGlobals={this.props.appGlobals} current="equipment-selection" />
                    </div>
                    <div className="col-md-9 col-lg-10 row">
                        <div className="col-md-12 col-lg-8">
                            <TextSection label="Step 3: Select Equipment">
                                <p><strong>Remaining Tonnage</strong>: {vehicle.getRemainingTonnage()}</p>
                                <AvailableEquipment
                                    appGlobals={this.props.appGlobals}
                                    equipment={vehicle.getAvailableEquipmentByCatalog("all", rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL, rulesLevel)}
                                    mounted={vehicle.getEquipmentList()}
                                    addFunction={this.addEquipment}
                                />
                                {vehicle.isSupportVehicle() && vehicle.getTonnage() < 5 ? <VehicleLightWeapons appGlobals={this.props.appGlobals} /> : null}

                                <div className="clear-both overflow-hidden">
                                    <hr />
                                    <Link to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/equipment-placement`} className="btn btn-primary pull-right btn-sm">Next: Equipment Placement <ArrowCircleRight /></Link>
                                    <div className="inline-block text-left">
                                        <Link to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/armor`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                                    </div>
                                </div>
                            </TextSection>
                        </div>
                        <div className="col-md-12 col-lg-4">
                            <TextSection label="Installed Equipment">
                                <table className="table">
                                    <thead>
                                        <tr><th>Name</th><th>Weight</th><th><span className="visually-hidden">Actions</span></th></tr>
                                    </thead>
                                    <tbody>
                                        {vehicle.getEquipmentList().map((item) => (
                                            <tr key={item.uuid}>
                                                <td>{item.name}</td>
                                                <td>{item.weight}</td>
                                                <td>
                                                    <button className="btn btn-danger btn-sm" onClick={() => this.removeEquipment(item.uuid)}>
                                                        <Trash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </TextSection>
                        </div>
                    </div>
                </div>
                <TonnageBar used={vehicle.getCurrentTonnage()} total={vehicle.getTonnage()} slots={{ used: vehicle.getUsedItemSlots(), total: vehicle.getTotalItemSlots() }} />
            </UIPage>
        );
    }
}

interface IEquipmentSelectionProps {
    appGlobals: IAppGlobals;
}

interface IEquipmentSelectionState {
    updated: boolean;
}
