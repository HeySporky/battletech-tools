import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import ProtoMech, { IProtoMechExport } from '../../../../classes/protomech';
import { PROTOMECH_CHASSIS } from '../../../../data/protomech-construction';
import BlkImportSection from '../../../components/blk-import-section';
import { IAppGlobals } from '../../../app-router';
import { ProtoMechCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { confirmReplaceDesign, designWouldBeLost } from '../../../components/confirm-replace-design';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class ProtoMechCreatorHome extends React.Component<IHomeProps> {
    constructor(props: IHomeProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("ProtoMech Creator");
    }

    // A MegaMek file of the kind, read by the shared MegaMek reader.
    loadBlk = (unit: unknown): string[] => {
        const proto = unit as ProtoMech;
        this.replaceDesign(() => this.props.appGlobals.saveCurrentProtoMech(proto));
        return proto.getIssues();
    }

    // Before the design is replaced, offer to save it first.
    replaceDesign = (replace: () => void): void => {
        confirmReplaceDesign(this.props.appGlobals, {
            what: "ProtoMech",
            lost: designWouldBeLost(this.props.appGlobals.currentProtoMech, () => new ProtoMech(), this.props.appGlobals.protoMechSaves || []),
            save: () => this.saveAsNew({ preventDefault: () => {} } as React.FormEvent<HTMLButtonElement>),
            replace,
        });
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.replaceDesign(() => this.props.appGlobals.saveCurrentProtoMech(new ProtoMech()));
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
        if (save) this.replaceDesign(() => this.props.appGlobals.saveCurrentProtoMech(new ProtoMech(JSON.stringify(save))));
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

                        <BlkImportSection accept={["protomechs"]} testId="pm" onLoad={this.loadBlk}
                            note={"The file's equipment names are matched to this catalog; anything without a match is left off and listed. Ammunition is shared out between the weapons that fire it."} />

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
                                        <th><span className="visually-hidden">Actions</span></th>
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

