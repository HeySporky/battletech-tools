import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import MicroMech, { IMicroMechExport } from '../../../../classes/micro-mech';
import { MICRO_MECH_CREDIT, MICRO_MECH_VERSION_RULES } from '../../../../data/micro-mech-construction';
import { MICRO_MECH_SAMPLES } from '../../../../data/micro-mech-samples';
import { IAppGlobals } from '../../../app-router';
import { MicroMechCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { confirmReplaceDesign, designWouldBeLost } from '../../../components/confirm-replace-design';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class MicroMechCreatorHome extends React.Component<IHomeProps> {
    constructor(props: IHomeProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Micro-Mech Creator");
    }

    // Before the design is replaced, offer to save it first.
    replaceDesign = (replace: () => void): void => {
        confirmReplaceDesign(this.props.appGlobals, {
            what: "Micro-Mech",
            lost: designWouldBeLost(this.props.appGlobals.currentMicroMech, () => new MicroMech(), this.props.appGlobals.microMechSaves || []),
            save: () => this.saveAsNew({ preventDefault: () => {} } as React.FormEvent<HTMLButtonElement>),
            replace,
        });
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.replaceDesign(() => this.props.appGlobals.saveCurrentMicroMech(new MicroMech()));
    }

    saveAsNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const micro = this.props.appGlobals.currentMicroMech;
        if (micro) {
            // A copy saved as new gets its own id, so it never overwrites the row it was loaded from.
            const copy = new MicroMech(micro.exportJSON());
            if (this.props.appGlobals.microMechSaves.some((save) => save.uuid === copy.getUUID())) copy.newUUID();
            this.props.appGlobals.saveMicroMechSaves([...this.props.appGlobals.microMechSaves, copy.export()]);
        }
    }

    loadSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.microMechSaves[saveIndex];
        if (save) this.replaceDesign(() => this.props.appGlobals.saveCurrentMicroMech(new MicroMech(JSON.stringify(save))));
    }

    loadSample = (e: React.FormEvent<HTMLButtonElement>, sampleId: string): void => {
        e.preventDefault();
        const sample = MICRO_MECH_SAMPLES.find((each) => each.id === sampleId);
        if (sample) this.replaceDesign(() => this.props.appGlobals.saveCurrentMicroMech(new MicroMech(JSON.stringify(sample.save))));
    }

    saveOver = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.microMechSaves[saveIndex];
        if (!this.props.appGlobals.currentMicroMech || !save) return;
        this.props.appGlobals.openConfirmDialog(
            "Overwrite Confirmation",
            "Are you sure you want to save the currently loaded design over the saved design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const micro = this.props.appGlobals.currentMicroMech;
                if (micro) {
                    const saves = [...this.props.appGlobals.microMechSaves];
                    saves[saveIndex] = micro.export();
                    this.props.appGlobals.saveMicroMechSaves(saves);
                }
            }
        );
    }

    deleteSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.microMechSaves[saveIndex];
        if (!save) return;
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to delete the design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const saves = [...this.props.appGlobals.microMechSaves];
                saves.splice(saveIndex, 1);
                this.props.appGlobals.saveMicroMechSaves(saves);
            }
        );
    }

    render = (): JSX.Element => {
        if (!this.props.appGlobals.currentMicroMech) return <></>;
        const saves = this.props.appGlobals.microMechSaves || [];

        return (
            <UIPage current="classic-battletech-micro-mech-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <MicroMechCreatorSideMenu appGlobals={this.props.appGlobals} current="home" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Micro-Mech Creator">
                            <p>
                                Build a Micro-Mech: a fan-made walker of 10 to 19 tons with a single torso, built in kilograms,
                                with at most four weapons. Pick the rules text first (the revised 6.1.0.2 document or the author's
                                own 2019 post), then the chassis, engine and armor, then the weapons and ammunition.
                            </p>
                            <p className="smaller-text" data-testid="mm-credit">
                                <strong>Fan-made, Custom Homebrew, NOT OFFICIAL.</strong> {MICRO_MECH_CREDIT} The creator is offered at
                                the Custom Homebrew rules level; a Micro-Mech you have saved opens at any level.
                            </p>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <button className="btn btn-primary pull-left btn-sm" onClick={this.startNew} title="Click here to clear out your current design and start over.">
                                    <File />&nbsp;Start Over
                                </button>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/micro-mech-creator/chassis`} className="btn btn-primary pull-right btn-sm">
                                    Start Building <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>

                        <TextSection
                            label="Your Saved Micro-Mechs"
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
                                        <th>Size</th>
                                        <th>Rules</th>
                                        <th><span className="visually-hidden">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saves.length > 0 ? saves.map((save: IMicroMechExport, saveIndex: number) => (
                                        <tr key={saveIndex}>
                                            <td title={"UUID: " + save.uuid}>{save.name || "(nameless)"}</td>
                                            <td>{save.tons} tons, {save.layout === "quad" ? "quad" : "biped"}</td>
                                            <td className="min-width">{MICRO_MECH_VERSION_RULES[save.version ?? "6.1.0.2"]?.name ?? "6.1.0.2"}</td>
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
                                        <tr><td colSpan={4}>You have no saved Micro-Mechs yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </TextSection>

                        <TextSection label="Sample Micro-Mechs">
                            <p className="smaller-text">
                                The four designs the 6.1.0.2 document prints, built under NGCFells's rules. Loading one replaces the design
                                you are working on; its Technical Readout notes say where it differs from the print.
                            </p>
                            <table className="table" data-testid="mm-samples">
                                <thead>
                                    <tr><th>Name</th><th><span className="visually-hidden">Actions</span></th></tr>
                                </thead>
                                <tbody>
                                    {MICRO_MECH_SAMPLES.map((sample) => (
                                        <tr key={sample.id}>
                                            <td>{sample.name}</td>
                                            <td className="text-right">
                                                <button className="btn btn-sm btn-primary" type="button" data-testid={"mm-sample-" + sample.id} title={"Load " + sample.name + " into the editor"} onClick={(e) => this.loadSample(e, sample.id)}>
                                                    <FolderOpen />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
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

