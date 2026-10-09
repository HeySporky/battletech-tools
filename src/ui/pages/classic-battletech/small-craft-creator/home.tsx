import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import SmallCraft, { ISmallCraftExport } from '../../../../classes/small-craft';
import { importSmallCraftBlk } from '../../../../classes/small-craft-blk';
import { MAX_BLK_FILE_LENGTH } from '../../../../utils/blk-file';
import { IAppGlobals } from '../../../app-router';
import SmallCraftCreatorSideMenu from '../../../components/small-craft-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class SmallCraftCreatorHome extends React.Component<IHomeProps, IHomeState> {
    constructor(props: IHomeProps) {
        super(props);
        this.state = { importName: "", importIssues: null };
        this.props.appGlobals.makeDocumentTitle("Small Craft Creator");
    }

    // Reads a MegaMek ".blk" Small Craft file into the editor, and lists what could not be carried over.
    importFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const input = e.currentTarget;
        const file = input.files && input.files[0];
        if (!file) return;
        if (file.size > MAX_BLK_FILE_LENGTH) {
            this.setState({ importName: file.name, importIssues: ["The file is too large to be a unit file."] });
            input.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = importSmallCraftBlk(typeof reader.result === "string" ? reader.result : "");
            if (result.craft) this.props.appGlobals.saveCurrentSmallCraft(result.craft);
            this.setState({ importName: file.name, importIssues: result.craft ? [...result.notes, ...result.issues, ...result.craft.getIssues(4)] : result.issues, importLoaded: !!result.craft });
        };
        reader.onerror = () => this.setState({ importName: file.name, importIssues: ["The file could not be read."], importLoaded: false });
        reader.readAsText(file);
        input.value = "";
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.props.appGlobals.saveCurrentSmallCraft(new SmallCraft());
    }

    saveAsNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const craft = this.props.appGlobals.currentSmallCraft;
        if (craft) {
            // A copy saved as new gets its own id, so it never overwrites the row it was loaded from.
            const copy = new SmallCraft(craft.exportJSON());
            if (this.props.appGlobals.smallCraftSaves.some((save) => save.uuid === copy.getUUID())) copy.newUUID();
            this.props.appGlobals.saveSmallCraftSaves([...this.props.appGlobals.smallCraftSaves, copy.export(true)]);
        }
    }

    loadSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.smallCraftSaves[saveIndex];
        if (save) this.props.appGlobals.saveCurrentSmallCraft(new SmallCraft(JSON.stringify(save)));
    }

    saveOver = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.smallCraftSaves[saveIndex];
        if (!this.props.appGlobals.currentSmallCraft || !save) return;
        this.props.appGlobals.openConfirmDialog(
            "Overwrite Confirmation",
            "Are you sure you want to save the currently loaded design over the saved design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const craft = this.props.appGlobals.currentSmallCraft;
                if (craft) {
                    const saves = [...this.props.appGlobals.smallCraftSaves];
                    saves[saveIndex] = craft.export(true);
                    this.props.appGlobals.saveSmallCraftSaves(saves);
                }
            }
        );
    }

    deleteSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.smallCraftSaves[saveIndex];
        if (!save) return;
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to delete the design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const saves = [...this.props.appGlobals.smallCraftSaves];
                saves.splice(saveIndex, 1);
                this.props.appGlobals.saveSmallCraftSaves(saves);
            }
        );
    }

    render = (): JSX.Element => {
        if (!this.props.appGlobals.currentSmallCraft) return <></>;
        const saves = this.props.appGlobals.smallCraftSaves || [];

        return (
            <UIPage current="classic-battletech-small-craft-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <SmallCraftCreatorSideMenu appGlobals={this.props.appGlobals} current="home" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Small Craft Creator">
                            <p>
                                Build a Small Craft under the TechManual construction rules (pp. 180-197): an aerodyne or spheroid
                                craft of 100 to 200 tons. Choose its thrust, fuel and Structural Integrity, armor its four facings,
                                mount weapons by firing arc, and give its crew and passengers quarters and its cargo a bay.
                            </p>
                            <p className="smaller-text">
                                The creator checks the weight and the rules as you go, and the summary gives the Battle Value, the
                                cost, a record sheet and an Alpha Strike card. Primitive Small Craft are not built here yet.
                            </p>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <button className="btn btn-primary pull-left btn-sm" onClick={this.startNew} title="Click here to clear out your current design and start over.">
                                    <File />&nbsp;Start Over
                                </button>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/chassis`} className="btn btn-primary pull-right btn-sm">
                                    Start Building <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>

                        <TextSection label="Import a MegaMek File">
                            <p>
                                Load a Small Craft from a MegaMek or MegaMekLab <code>.blk</code> file. The design replaces the one in the
                                editor; save your current design first if you want to keep it.
                            </p>
                            <label>
                                Choose a .blk file:{" "}
                                <input type="file" accept=".blk,text/plain" data-testid="sc-import-file" style={{ width: "auto" }} onChange={this.importFile} aria-label="Choose a .blk file" />
                            </label>
                            {this.state.importIssues !== null ? (
                                <div data-testid="sc-import-result">
                                    <p><strong>{this.state.importName}</strong>: {this.state.importLoaded ? "loaded into the editor." : "not loaded."}</p>
                                    {this.state.importIssues.length > 0 ? (
                                        <ul className={this.state.importLoaded ? "" : "color-red"}>
                                            {this.state.importIssues.map((issue, index) => <li key={index}>{issue}</li>)}
                                        </ul>
                                    ) : <p>Everything in the file was carried over, and the Small Craft is legal.</p>}
                                </div>
                            ) : null}
                            <p className="smaller-text">
                                The file's equipment names are matched to this catalog; anything without a match is left off and listed.
                            </p>
                        </TextSection>

                        <TextSection
                            label="Your Saved Small Craft"
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
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saves.length > 0 ? saves.map((save: ISmallCraftExport, saveIndex: number) => (
                                        <tr key={saveIndex}>
                                            <td title={"UUID: " + save.uuid}>{`${save.name} ${save.model}`.trim() || "(nameless)"}</td>
                                            <td>{save.tonnage} tons, {save.shape === "spheroid" ? "Spheroid" : "Aerodyne"}</td>
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
                                        <tr><td colSpan={3}>You have no saved Small Craft yet.</td></tr>
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

interface IHomeState {
    importName: string;
    /** What the last import reported; null before any import. */
    importIssues: string[] | null;
    importLoaded?: boolean;
}
