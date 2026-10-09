import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import ProtoMech, { IProtoMechExport } from '../../../../classes/protomech';
import { importProtoMechBlk } from '../../../../classes/protomech-blk';
import { PROTOMECH_CHASSIS } from '../../../../data/protomech-construction';
import { MAX_BLK_FILE_LENGTH } from '../../../../utils/blk-file';
import { IAppGlobals } from '../../../app-router';
import ProtoMechCreatorSideMenu from '../../../components/protomech-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class ProtoMechCreatorHome extends React.Component<IHomeProps, IHomeState> {
    constructor(props: IHomeProps) {
        super(props);
        this.state = { importName: "", importIssues: null };
        this.props.appGlobals.makeDocumentTitle("ProtoMech Creator");
    }

    // Reads a MegaMek ".blk" ProtoMech file into the editor, and lists what could not be carried over.
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
            const result = importProtoMechBlk(typeof reader.result === "string" ? reader.result : "");
            if (result.proto) this.props.appGlobals.saveCurrentProtoMech(result.proto);
            this.setState({ importName: file.name, importIssues: result.proto ? [...(result.notes ?? []), ...result.issues, ...result.proto.getIssues()] : result.issues, importLoaded: !!result.proto });
        };
        reader.onerror = () => this.setState({ importName: file.name, importIssues: ["The file could not be read."], importLoaded: false });
        reader.readAsText(file);
        input.value = "";
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.props.appGlobals.saveCurrentProtoMech(new ProtoMech());
    }

    saveAsNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const proto = this.props.appGlobals.currentProtoMech;
        if (proto) {
            // A copy saved as new gets its own id, so it never overwrites the row it was loaded from.
            const copy = new ProtoMech(proto.exportJSON());
            if (this.props.appGlobals.protoMechSaves.some((save) => save.uuid === copy.getUUID())) copy.newUUID();
            this.props.appGlobals.saveProtoMechSaves([...this.props.appGlobals.protoMechSaves, copy.export(true)]);
        }
    }

    loadSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.protoMechSaves[saveIndex];
        if (save) this.props.appGlobals.saveCurrentProtoMech(new ProtoMech(JSON.stringify(save)));
    }

    saveOver = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.protoMechSaves[saveIndex];
        if (!this.props.appGlobals.currentProtoMech || !save) return;
        this.props.appGlobals.openConfirmDialog(
            "Overwrite Confirmation",
            "Are you sure you want to save the currently loaded design over the saved design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const proto = this.props.appGlobals.currentProtoMech;
                if (proto) {
                    const saves = [...this.props.appGlobals.protoMechSaves];
                    saves[saveIndex] = proto.export(true);
                    this.props.appGlobals.saveProtoMechSaves(saves);
                }
            }
        );
    }

    deleteSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.protoMechSaves[saveIndex];
        if (!save) return;
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to delete the design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const saves = [...this.props.appGlobals.protoMechSaves];
                saves.splice(saveIndex, 1);
                this.props.appGlobals.saveProtoMechSaves(saves);
            }
        );
    }

    render = (): JSX.Element => {
        if (!this.props.appGlobals.currentProtoMech) return <></>;
        const saves = this.props.appGlobals.protoMechSaves || [];

        return (
            <UIPage current="classic-battletech-protomech-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <ProtoMechCreatorSideMenu appGlobals={this.props.appGlobals} current="home" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="ProtoMech Creator">
                            <p>
                                Build a ProtoMech under the TechManual construction rules (pp. 80-89): choose its weight, its engine
                                and jump jets, armor it point by point, and mount weapons in its torso, arms and main gun, with
                                ammunition bought by the shot.
                            </p>
                            <p className="smaller-text">
                                At the Advanced rules level the creator also builds Ultraheavy, Quad and Glider ProtoMechs
                                (Interstellar Operations: Alternate Eras, pp. 93-96). It checks the weight and each location's
                                limits as you go, and the summary gives the Battle Value and cost of the ProtoMech and its Point,
                                and a record sheet.
                            </p>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <button className="btn btn-primary pull-left btn-sm" onClick={this.startNew} title="Click here to clear out your current design and start over.">
                                    <File />&nbsp;Start Over
                                </button>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/protomech-creator/chassis`} className="btn btn-primary pull-right btn-sm">
                                    Start Building <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>

                        <TextSection label="Import a MegaMek File">
                            <p>
                                Load a ProtoMech from a MegaMek or MegaMekLab <code>.blk</code> file. The design replaces the one in the
                                editor; save your current design first if you want to keep it.
                            </p>
                            <label>
                                Choose a .blk file:{" "}
                                <input type="file" accept=".blk,text/plain" data-testid="pm-import-file" style={{ width: "auto" }} onChange={this.importFile} aria-label="Choose a .blk file" />
                            </label>
                            {this.state.importIssues !== null ? (
                                <div data-testid="pm-import-result">
                                    <p><strong>{this.state.importName}</strong>: {this.state.importLoaded ? "loaded into the editor." : "not loaded."}</p>
                                    {this.state.importIssues.length > 0 ? (
                                        <ul className={this.state.importLoaded ? "" : "color-red"}>
                                            {this.state.importIssues.map((issue, index) => <li key={index}>{issue}</li>)}
                                        </ul>
                                    ) : <p>Everything in the file was carried over, and the ProtoMech is legal.</p>}
                                </div>
                            ) : null}
                            <p className="smaller-text">
                                The file's equipment names are matched to this catalog; anything without a match is left off and listed.
                                Ammunition is shared out between the weapons that fire it.
                            </p>
                        </TextSection>

                        <TextSection
                            label="Your Saved ProtoMechs"
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
                                        <th>Chassis</th>
                                        <th>Point</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saves.length > 0 ? saves.map((save: IProtoMechExport, saveIndex: number) => (
                                        <tr key={saveIndex}>
                                            <td title={"UUID: " + save.uuid}>{save.name || "(nameless)"}</td>
                                            <td>{save.tons} tons, {PROTOMECH_CHASSIS.find((item) => item.tag === save.chassis)?.name ?? "Biped"}</td>
                                            <td className="min-width">{save.pointSize}</td>
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
                                        <tr><td colSpan={4}>You have no saved ProtoMechs yet.</td></tr>
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
