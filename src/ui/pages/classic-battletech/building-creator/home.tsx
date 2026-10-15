import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import Building, { IBuildingExport } from '../../../../classes/building';
import { findBuildingClassification } from '../../../../data/building-classifications';
import { IAppGlobals } from '../../../app-router';
import BuildingCreatorSideMenu from '../../../components/building-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class BuildingCreatorHome extends React.Component<IHomeProps> {
    constructor(props: IHomeProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Building Creator");
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.props.appGlobals.saveCurrentBuilding(new Building());
    }

    saveAsNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const building = this.props.appGlobals.currentBuilding;
        if (building) {
            // A copy saved as new gets its own id, so it never overwrites the row it was loaded from.
            const copy = new Building(building.exportJSON());
            if (this.props.appGlobals.buildingSaves.some((save) => save.uuid === copy.getUUID())) copy.newUUID();
            this.props.appGlobals.saveBuildingSaves([...this.props.appGlobals.buildingSaves, copy.export()]);
        }
    }

    loadSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.buildingSaves[saveIndex];
        if (save) this.props.appGlobals.saveCurrentBuilding(new Building(JSON.stringify(save)));
    }

    saveOver = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.buildingSaves[saveIndex];
        if (!this.props.appGlobals.currentBuilding || !save) return;
        this.props.appGlobals.openConfirmDialog(
            "Overwrite Confirmation",
            "Are you sure you want to save the currently loaded building over the saved building \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const building = this.props.appGlobals.currentBuilding;
                if (building) {
                    const saves = [...this.props.appGlobals.buildingSaves];
                    saves[saveIndex] = building.export();
                    this.props.appGlobals.saveBuildingSaves(saves);
                }
            }
        );
    }

    deleteSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.buildingSaves[saveIndex];
        if (!save) return;
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to delete the building \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const saves = [...this.props.appGlobals.buildingSaves];
                saves.splice(saveIndex, 1);
                this.props.appGlobals.saveBuildingSaves(saves);
            }
        );
    }

    render = (): JSX.Element => {
        if (!this.props.appGlobals.currentBuilding) return <></>;
        const saves = this.props.appGlobals.buildingSaves || [];

        return (
            <UIPage current="classic-battletech-building-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <BuildingCreatorSideMenu appGlobals={this.props.appGlobals} current="home" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Building Creator">
                            <p>
                                Build a gun emplacement, fortress or other building under the Tactical Operations: Advanced
                                Rules construction rules (pp. 126-131): choose its classification, type, Construction Factor
                                and size, armor it, then mount weapons, heat sinks and a power generator hex by hex.
                            </p>
                            <p className="smaller-text">
                                The summary checks each hex against its weight capacity and Heavy weapon limit and gives the
                                cost; the record sheet has Armor Factor and Construction Factor circles for every hex.
                                Castles Brian and Mobile Structures are not built here.
                            </p>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <button className="btn btn-primary pull-left btn-sm" onClick={this.startNew} title="Click here to clear out your current building and start over.">
                                    <File />&nbsp;Start Over
                                </button>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/building-creator/structure`} className="btn btn-primary pull-right btn-sm">
                                    Start Building <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>

                        <TextSection
                            label="Your Saved Buildings"
                            labelButton={
                                <button className="btn btn-primary btn-sm pull-right" title="Save the currently loaded building as a new row" onClick={this.saveAsNew}>
                                    <Save />&nbsp;Save as New
                                </button>
                            }
                        >
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Classification</th>
                                        <th>CF</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saves.length > 0 ? saves.map((save: IBuildingExport, saveIndex: number) => (
                                        <tr key={saveIndex}>
                                            <td title={"UUID: " + save.uuid}>{save.name || "(nameless)"}</td>
                                            <td>{findBuildingClassification(save.classification)?.name ?? save.classification}</td>
                                            <td className="min-width">{save.cf}</td>
                                            <td className="text-right">
                                                <button className="btn btn-sm btn-primary" type="button" title={"Load " + save.name + " into the editor"} onClick={(e) => this.loadSave(e, saveIndex)}>
                                                    <FolderOpen />
                                                </button>
                                                &nbsp;
                                                <button className="btn btn-sm btn-primary" type="button" title={"Save current building over " + save.name} onClick={(e) => this.saveOver(e, saveIndex)}>
                                                    <Save />
                                                </button>
                                                &nbsp;
                                                <button className="btn btn-sm btn-danger" type="button" title={"Delete " + save.name} onClick={(e) => this.deleteSave(e, saveIndex)}>
                                                    <Trash />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4}>You have no saved buildings yet.</td></tr>
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
