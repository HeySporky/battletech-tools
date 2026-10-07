import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import AerospaceFighter, { IAerospaceFighterExport } from '../../../../classes/aerospace-fighter';
import { IAppGlobals } from '../../../app-router';
import FighterCreatorSideMenu from '../../../components/fighter-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class FighterCreatorHome extends React.Component<IHomeProps> {
    constructor(props: IHomeProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Fighter Creator");
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.props.appGlobals.saveCurrentFighter(new AerospaceFighter());
    }

    saveAsNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const fighter = this.props.appGlobals.currentFighter;
        if (fighter) {
            // A copy saved as new gets its own id, so it never overwrites the row it was loaded from.
            const copy = new AerospaceFighter(fighter.exportJSON());
            if (this.props.appGlobals.fighterSaves.some((save) => save.uuid === copy.getUUID())) copy.newUUID();
            this.props.appGlobals.saveFighterSaves([...this.props.appGlobals.fighterSaves, copy.export()]);
        }
    }

    loadSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.fighterSaves[saveIndex];
        if (save) this.props.appGlobals.saveCurrentFighter(new AerospaceFighter(JSON.stringify(save)));
    }

    saveOver = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.fighterSaves[saveIndex];
        if (!this.props.appGlobals.currentFighter || !save) return;
        this.props.appGlobals.openConfirmDialog(
            "Overwrite Confirmation",
            "Are you sure you want to save the currently loaded fighter over the saved fighter \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const fighter = this.props.appGlobals.currentFighter;
                if (fighter) {
                    const saves = [...this.props.appGlobals.fighterSaves];
                    saves[saveIndex] = fighter.export();
                    this.props.appGlobals.saveFighterSaves(saves);
                }
            }
        );
    }

    deleteSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.fighterSaves[saveIndex];
        if (!save) return;
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to delete the fighter \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const saves = [...this.props.appGlobals.fighterSaves];
                saves.splice(saveIndex, 1);
                this.props.appGlobals.saveFighterSaves(saves);
            }
        );
    }

    render = (): JSX.Element => {
        if (!this.props.appGlobals.currentFighter) return <></>;
        const saves = this.props.appGlobals.fighterSaves || [];

        return (
            <UIPage current="classic-battletech-fighter-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <FighterCreatorSideMenu appGlobals={this.props.appGlobals} current="home" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Fighter Creator">
                            <p>
                                Build an Aerospace Fighter (5 to 100 tons) or a Conventional Fighter (5 to 50 tons) under the
                                TechManual construction rules (pp. 180-197): an engine sized by Safe Thrust, fuel, armor on
                                four facings and up to five weapons in each firing arc. It shares the engine, heat sink and
                                equipment catalogs with the 'Mech and Vehicle Creators.
                            </p>
                            <p className="smaller-text">
                                Not built yet: Battle Value, cost, OmniFighter pods, external stores loads, a printable
                                record sheet and Alpha Strike conversion.
                            </p>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <button className="btn btn-primary pull-left btn-sm" onClick={this.startNew} title="Click here to clear out your current fighter and start over.">
                                    <File />&nbsp;Start Over
                                </button>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator/chassis`} className="btn btn-primary pull-right btn-sm">
                                    Start Building <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>

                        <TextSection
                            label="Your Saved Fighters"
                            labelButton={
                                <button className="btn btn-primary btn-sm pull-right" title="Save the currently loaded fighter as a new row" onClick={this.saveAsNew}>
                                    <Save />&nbsp;Save as New
                                </button>
                            }
                        >
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Thrust</th>
                                        <th>Tons</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saves.length > 0 ? saves.map((save: IAerospaceFighterExport, saveIndex: number) => (
                                        <tr key={saveIndex}>
                                            <td title={"UUID: " + save.uuid}>{`${save.model} ${save.name}`.trim() || "(nameless)"}</td>
                                            <td>{save.fighterType === "conventional" ? "Conventional" : "Aerospace"}</td>
                                            <td>{save.safeThrust}/{Math.ceil(save.safeThrust * 1.5)}</td>
                                            <td className="min-width">{save.tonnage}</td>
                                            <td className="text-right">
                                                <button className="btn btn-sm btn-primary" type="button" title={"Load " + save.name + " into the editor"} onClick={(e) => this.loadSave(e, saveIndex)}>
                                                    <FolderOpen />
                                                </button>
                                                &nbsp;
                                                <button className="btn btn-sm btn-primary" type="button" title={"Save current fighter over " + save.name} onClick={(e) => this.saveOver(e, saveIndex)}>
                                                    <Save />
                                                </button>
                                                &nbsp;
                                                <button className="btn btn-sm btn-danger" type="button" title={"Delete " + save.name} onClick={(e) => this.deleteSave(e, saveIndex)}>
                                                    <Trash />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5}>You have no saved fighters yet.</td></tr>
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
