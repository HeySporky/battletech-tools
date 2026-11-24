import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import CapitalShip, { ICapitalShipExport } from '../../../../classes/capital-ship';
import { getAdvancedAerospaceType } from '../../../../data/advanced-aerospace-construction';
import { IAppGlobals } from '../../../app-router';
import { CapitalShipCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class CapitalShipCreatorHome extends React.Component<IHomeProps> {
    constructor(props: IHomeProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("JumpShip and WarShip Creator");
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.props.appGlobals.saveCurrentCapitalShip(new CapitalShip());
    }

    saveAsNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const ship = this.props.appGlobals.currentCapitalShip;
        if (ship) {
            // A copy saved as new gets its own id, so it never overwrites the row it was loaded from.
            const copy = new CapitalShip(ship.exportJSON());
            if (this.props.appGlobals.capitalShipSaves.some((save) => save.uuid === copy.getUUID())) copy.newUUID();
            this.props.appGlobals.saveCapitalShipSaves([...this.props.appGlobals.capitalShipSaves, copy.export()]);
        }
    }

    loadSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.capitalShipSaves[saveIndex];
        if (save) this.props.appGlobals.saveCurrentCapitalShip(new CapitalShip(JSON.stringify(save)));
    }

    saveOver = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.capitalShipSaves[saveIndex];
        if (!this.props.appGlobals.currentCapitalShip || !save) return;
        this.props.appGlobals.openConfirmDialog(
            "Overwrite Confirmation",
            "Are you sure you want to save the currently loaded design over the saved design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const ship = this.props.appGlobals.currentCapitalShip;
                if (ship) {
                    const saves = [...this.props.appGlobals.capitalShipSaves];
                    saves[saveIndex] = ship.export();
                    this.props.appGlobals.saveCapitalShipSaves(saves);
                }
            }
        );
    }

    deleteSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.capitalShipSaves[saveIndex];
        if (!save) return;
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to delete the design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const saves = [...this.props.appGlobals.capitalShipSaves];
                saves.splice(saveIndex, 1);
                this.props.appGlobals.saveCapitalShipSaves(saves);
            }
        );
    }

    render = (): JSX.Element => {
        if (!this.props.appGlobals.currentCapitalShip) return <></>;
        const saves = this.props.appGlobals.capitalShipSaves || [];

        return (
            <UIPage current="classic-battletech-capital-ship-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <CapitalShipCreatorSideMenu appGlobals={this.props.appGlobals} current="home" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="JumpShip, WarShip and Space Station Creator">
                            <p>
                                Build a JumpShip, WarShip or space station under the Strategic Operations: Advanced Aerospace Rules
                                construction rules (pp. 130-149, with errata v5.0): choose the hull, its drives and K-F drive, armor
                                its six facings, mount standard and capital weapons in up to eight firing arcs, and give it a crew,
                                quarters, transport bays, docking collars and grav decks.
                            </p>
                            <p className="smaller-text">
                                The creator checks the weight and the rules as you go, and the summary gives the cost. Battle Value,
                                record sheets, Alpha Strike cards and play are not built for these vessels yet.
                            </p>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <button className="btn btn-primary pull-left btn-sm" onClick={this.startNew} title="Click here to clear out your current design and start over.">
                                    <File />&nbsp;Start Over
                                </button>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator/chassis`} className="btn btn-primary pull-right btn-sm">
                                    Start Building <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>

                        <TextSection
                            label="Your Saved Vessels"
                            labelButton={
                                <button className="btn btn-primary btn-sm pull-right" title="Save the currently loaded design as a new row" onClick={this.saveAsNew}>
                                    <Save />&nbsp;Save as New
                                </button>
                            }
                        >
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Hull</th>
                                        <th><span className="visually-hidden">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saves.length > 0 ? saves.map((save: ICapitalShipExport, saveIndex: number) => (
                                        <tr key={saveIndex}>
                                            <td title={"UUID: " + save.uuid}>{`${save.name} ${save.model}`.trim() || "(nameless)"}</td>
                                            <td>{save.tonnage.toLocaleString("en-US")} tons, {getAdvancedAerospaceType(save.shipType).name}</td>
                                            <td className="text-right">
                                                <button className="btn btn-sm btn-primary" type="button" title={"Load " + save.name + " into the editor"} onClick={(e) => this.loadSave(e, saveIndex)}>
                                                    <FolderOpen />
                                                </button>
                                                &nbsp;
                                                <button className="btn btn-sm btn-primary" type="button" title={"Save current design over " + save.name} onClick={(e) => this.saveOver(e, saveIndex)}>
                                                    <Save />
                                                </button>
                                                &nbsp;
                                                <button className="btn btn-sm btn-danger" type="button" title={"Delete " + save.name} onClick={(e) => this.deleteSave(e, saveIndex)}>
                                                    <Trash />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={3}>You have no saved vessels yet.</td></tr>
                                    )}
                                </tbody>
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
