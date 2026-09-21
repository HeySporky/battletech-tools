import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import Vehicle, { IVehicleExport } from '../../../../classes/vehicle';
import { IAppGlobals } from '../../../app-router';
import VehicleCreatorSideMenu from '../../../components/vehicle-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class VehicleCreatorHome extends React.Component<IHomeProps, IHomeState> {
    constructor(props: IHomeProps) {
        super(props);
        this.state = { updated: false };
        this.props.appGlobals.makeDocumentTitle("Vehicle Creator");
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.props.appGlobals.saveCurrentVehicle(new Vehicle());
    }

    saveAsNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        if (this.props.appGlobals.currentVehicle) {
            const vehicleSaves = this.props.appGlobals.vehicleSaves || [];
            vehicleSaves.push(this.props.appGlobals.currentVehicle.export());
            this.props.appGlobals.saveVehicleSaves(vehicleSaves);
        }
    }

    loadSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        if (this.props.appGlobals.vehicleSaves.length > saveIndex) {
            const vehicle = new Vehicle();
            vehicle.importJSON(JSON.stringify(this.props.appGlobals.vehicleSaves[saveIndex]));
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    saveOver = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        if (this.props.appGlobals.currentVehicle && this.props.appGlobals.vehicleSaves.length > saveIndex) {
            this.props.appGlobals.openConfirmDialog(
                "Overwrite Confirmation",
                "Are you sure you want to save the currently loaded vehicle over the saved vehicle \"" + this.props.appGlobals.vehicleSaves[saveIndex].name + "\"?",
                "Yes",
                "No, thank you",
                () => {
                    if (this.props.appGlobals.currentVehicle) {
                        const vehicleSaves = this.props.appGlobals.vehicleSaves;
                        vehicleSaves[saveIndex] = this.props.appGlobals.currentVehicle.export();
                        this.props.appGlobals.saveVehicleSaves(vehicleSaves);
                    }
                }
            );
        }
    }

    deleteSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        if (this.props.appGlobals.vehicleSaves.length > saveIndex) {
            this.props.appGlobals.openConfirmDialog(
                "Deletion Confirmation",
                "Are you sure you want to delete the vehicle \"" + this.props.appGlobals.vehicleSaves[saveIndex].name + "\"?",
                "Yes",
                "No, thank you",
                () => {
                    const vehicleSaves = this.props.appGlobals.vehicleSaves;
                    vehicleSaves.splice(saveIndex, 1);
                    this.props.appGlobals.saveVehicleSaves(vehicleSaves);
                }
            );
        }
    }

    render = (): JSX.Element => {
        if (!this.props.appGlobals.currentVehicle) return <></>;

        return (
            <UIPage current="classic-battletech-vehicle-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <VehicleCreatorSideMenu appGlobals={this.props.appGlobals} current="home" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Vehicle Creator">
                            <p>
                                Build a Combat Vehicle (Tracked, Wheeled, Hover, VTOL, WiGE, or Naval)
                                following the same construction rules used for BattleMechs, sharing the
                                same engine, armor, heat sink, and equipment catalogs.
                            </p>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <button
                                    className="btn btn-primary pull-left btn-sm"
                                    onClick={this.startNew}
                                    title="Click here to clear out your current vehicle and start over."
                                >
                                    <File />&nbsp;Start Over
                                </button>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/step1`} className="btn btn-primary pull-right btn-sm">
                                    Start Building <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>

                        <TextSection
                            label="Your Saved Vehicles"
                            labelButton={
                                <button className="btn btn-primary btn-sm pull-right" title="Save the currently loaded vehicle as a new row" onClick={this.saveAsNew}>
                                    <Save />&nbsp;Save as New
                                </button>
                            }
                        >
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Motive Type</th>
                                        <th>Tons</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                {this.props.appGlobals.vehicleSaves && this.props.appGlobals.vehicleSaves.length > 0 ? (
                                    this.props.appGlobals.vehicleSaves.map((save: IVehicleExport, saveIndex: number) => (
                                        <tbody key={saveIndex}>
                                            <tr>
                                                <td title={"UUID: " + save.uuid}>{`${save.model} ${save.name}`.trim()}</td>
                                                <td>{save.motiveType}</td>
                                                <td className="min-width">{save.tonnage}</td>
                                                <td className="text-right">
                                                    <button className="btn btn-sm btn-primary" type="button" title={"Load " + save.name + " into the editor"} onClick={(e) => this.loadSave(e, saveIndex)}>
                                                        <FolderOpen />
                                                    </button>
                                                    &nbsp;
                                                    <button className="btn btn-sm btn-primary" type="button" title={"Save current vehicle over " + save.name} onClick={(e) => this.saveOver(e, saveIndex)}>
                                                        <Save />
                                                    </button>
                                                    &nbsp;
                                                    <button className="btn btn-sm btn-danger" type="button" title={"Delete " + save.name} onClick={(e) => this.deleteSave(e, saveIndex)}>
                                                        <Trash />
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    ))
                                ) : (
                                    <tbody>
                                        <tr><td colSpan={4}>You have no saved vehicles yet.</td></tr>
                                    </tbody>
                                )}
                            </table>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IHomeProps {
    appGlobals: IAppGlobals;
}


interface IHomeState {
    updated: boolean;
}
