import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import InfantryPlatoon, { IInfantryPlatoonExport, INFANTRY_MOTIVE_TYPES } from '../../../../classes/infantry-platoon';
import { IAppGlobals } from '../../../app-router';
import InfantryCreatorSideMenu from '../../../components/infantry-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class InfantryCreatorHome extends React.Component<IHomeProps> {
    constructor(props: IHomeProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Infantry Creator");
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.props.appGlobals.saveCurrentInfantry(new InfantryPlatoon());
    }

    saveAsNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const platoon = this.props.appGlobals.currentInfantry;
        if (platoon) {
            // A copy saved as new gets its own id, so it never overwrites the row it was loaded from.
            const copy = new InfantryPlatoon(platoon.exportJSON());
            if (this.props.appGlobals.infantrySaves.some((save) => save.uuid === copy.getUUID())) copy.newUUID();
            this.props.appGlobals.saveInfantrySaves([...this.props.appGlobals.infantrySaves, copy.export()]);
        }
    }

    loadSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.infantrySaves[saveIndex];
        if (save) this.props.appGlobals.saveCurrentInfantry(new InfantryPlatoon(JSON.stringify(save)));
    }

    saveOver = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.infantrySaves[saveIndex];
        if (!this.props.appGlobals.currentInfantry || !save) return;
        this.props.appGlobals.openConfirmDialog(
            "Overwrite Confirmation",
            "Are you sure you want to save the currently loaded platoon over the saved platoon \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const platoon = this.props.appGlobals.currentInfantry;
                if (platoon) {
                    const saves = [...this.props.appGlobals.infantrySaves];
                    saves[saveIndex] = platoon.export();
                    this.props.appGlobals.saveInfantrySaves(saves);
                }
            }
        );
    }

    deleteSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.infantrySaves[saveIndex];
        if (!save) return;
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to delete the platoon \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const saves = [...this.props.appGlobals.infantrySaves];
                saves.splice(saveIndex, 1);
                this.props.appGlobals.saveInfantrySaves(saves);
            }
        );
    }

    render = (): JSX.Element => {
        if (!this.props.appGlobals.currentInfantry) return <></>;
        const saves = this.props.appGlobals.infantrySaves || [];

        return (
            <UIPage current="classic-battletech-infantry-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <InfantryCreatorSideMenu appGlobals={this.props.appGlobals} current="home" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Infantry Creator">
                            <p>
                                Build a conventional infantry platoon under the TechManual construction rules (pp. 144-155):
                                choose how it moves and whose formation it follows, give the troopers a primary weapon and
                                each squad up to two secondary weapons, and the creator works out its range modifiers and
                                the damage it does at every strength.
                            </p>
                            <p className="smaller-text">
                                The summary gives the transport weight, Battle Value and cost, and a record sheet with a
                                line for each platoon or sub-platoon. Battle armor is a separate unit type and is not
                                built here.
                            </p>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <button className="btn btn-primary pull-left btn-sm" onClick={this.startNew} title="Click here to clear out your current platoon and start over.">
                                    <File />&nbsp;Start Over
                                </button>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/infantry-creator/platoon`} className="btn btn-primary pull-right btn-sm">
                                    Start Building <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>

                        <TextSection
                            label="Your Saved Platoons"
                            labelButton={
                                <button className="btn btn-primary btn-sm pull-right" title="Save the currently loaded platoon as a new row" onClick={this.saveAsNew}>
                                    <Save />&nbsp;Save as New
                                </button>
                            }
                        >
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Motive Type</th>
                                        <th>Troopers</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saves.length > 0 ? saves.map((save: IInfantryPlatoonExport, saveIndex: number) => (
                                        <tr key={saveIndex}>
                                            <td title={"UUID: " + save.uuid}>{save.name || "(nameless)"}</td>
                                            <td>{INFANTRY_MOTIVE_TYPES.find((motive) => motive.tag === save.motive)?.name ?? save.motive}</td>
                                            <td className="min-width">{save.squadSize * save.squads}</td>
                                            <td className="text-right">
                                                <button className="btn btn-sm btn-primary" type="button" title={"Load " + save.name + " into the editor"} onClick={(e) => this.loadSave(e, saveIndex)}>
                                                    <FolderOpen />
                                                </button>
                                                &nbsp;
                                                <button className="btn btn-sm btn-primary" type="button" title={"Save current platoon over " + save.name} onClick={(e) => this.saveOver(e, saveIndex)}>
                                                    <Save />
                                                </button>
                                                &nbsp;
                                                <button className="btn btn-sm btn-danger" type="button" title={"Delete " + save.name} onClick={(e) => this.deleteSave(e, saveIndex)}>
                                                    <Trash />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4}>You have no saved platoons yet.</td></tr>
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
