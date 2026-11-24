import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import SmallCraft, { ISmallCraftExport } from '../../../../classes/small-craft';
import BlkImportSection from '../../../components/blk-import-section';
import { getFwDropShipSamples, IFwDropShipSample } from '../../../../data/future-wars-dropship-samples';
import { forumCreditLine, getSeaDropshipSamples, ISeaDropshipSample } from '../../../../data/seadropship-samples';
import { FW_DROPSHIP_SOURCES } from '../../../../data/future-wars-dropships';
import { IAppGlobals } from '../../../app-router';
import { SmallCraftCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { confirmReplaceDesign, designWouldBeLost } from '../../../components/confirm-replace-design';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class SmallCraftCreatorHome extends React.Component<IHomeProps> {
    constructor(props: IHomeProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Small Craft Creator");
    }

    // A MegaMek file of the kind, read by the shared MegaMek reader.
    loadBlk = (unit: unknown): string[] => {
        const craft = unit as SmallCraft;
        this.replaceDesign(() => this.props.appGlobals.saveCurrentSmallCraft(craft));
        return craft.getIssues(4);
    }

    // Before the design is replaced, offer to save it first.
    replaceDesign = (replace: () => void): void => {
        confirmReplaceDesign(this.props.appGlobals, {
            what: "small craft",
            lost: designWouldBeLost(this.props.appGlobals.currentSmallCraft, () => new SmallCraft(), this.props.appGlobals.smallCraftSaves || []),
            save: () => this.saveAsNew({ preventDefault: () => {} } as React.FormEvent<HTMLButtonElement>),
            replace,
        });
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.replaceDesign(() => this.props.appGlobals.saveCurrentSmallCraft(new SmallCraft()));
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

    loadSample = (e: React.FormEvent<HTMLButtonElement>, sampleId: string): void => {
        e.preventDefault();
        const sample = getFwDropShipSamples().find((each) => each.id === sampleId);
        if (sample) this.replaceDesign(() => this.props.appGlobals.saveCurrentSmallCraft(new SmallCraft(JSON.stringify(sample.save))));
    }

    loadSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.smallCraftSaves[saveIndex];
        if (save) this.replaceDesign(() => this.props.appGlobals.saveCurrentSmallCraft(new SmallCraft(JSON.stringify(save))));
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
                                Build a Small Craft or a DropShip under the TechManual construction rules (pp. 180-197): an aerodyne
                                or spheroid Small Craft of 100 to 200 tons, or a DropShip of 200 to 35,000 tons (aerodyne) or 100,000
                                tons (spheroid). Choose its thrust, fuel and Structural Integrity, armor its four facings, mount
                                weapons by firing arc, and give its crew and passengers quarters and its cargo a bay.
                            </p>
                            <p className="smaller-text">
                                The creator checks the weight and the rules as you go, and the summary gives the Battle Value, the
                                cost, a record sheet and an Alpha Strike card. Primitive Small Craft and DropShips are built to Interstellar
                                Operations: Alternate Eras (pp. 119-121), and four Future Wars DropShip methods are Special Rulesets.
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

                        <BlkImportSection accept={["small-craft"]} testId="sc" onLoad={this.loadBlk} />

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
                                        <th><span className="visually-hidden">Actions</span></th>
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
                        {getSeaDropshipSamples().length > 0 ? (
                        <TextSection label="Sample SeaDropships">
                            <p className="smaller-text">
                                Custom Homebrew, NOT OFFICIAL. Aerodyne DropShips on the Flotation Hull, which land on water like a runway and sail
                                afloat: Vehrec's Pelican and NGCFells's Petrel and Gannet, after Vehrec's BattleTech forums posts, and StingerTheRaven's Pregnant Guppy from the BattleTech forums. Loading one replaces the design you are working on; see <Link to={`${process.env.PUBLIC_URL}/classic-battletech/tro-jbt/seadropships`}>TRO - JBT: SeaDropships</Link>.
                            </p>
                            <table className="table" data-testid="seadropship-samples">
                                <thead>
                                    <tr><th>Name</th><th>Hull</th><th>Idea by</th><th><span className="visually-hidden">Actions</span></th></tr>
                                </thead>
                                <tbody>
                                    {getSeaDropshipSamples().map((sample: ISeaDropshipSample) => (
                                        <tr key={sample.id}>
                                            <td>{sample.name}</td>
                                            <td>{sample.tonnage.toLocaleString("en-US")} tons, Aerodyne</td>
                                            <td>{sample.forum ? <a href={sample.forum.url} target="_blank" rel="noopener noreferrer" title={forumCreditLine(sample.forum)}>{sample.credit}</a> : sample.credit}</td>
                                            <td className="text-right">
                                                <button className="btn btn-sm btn-primary" type="button" data-testid={"seadropship-sample-" + sample.id} title={"Load " + sample.name + " into the editor"} onClick={() => this.replaceDesign(() => this.props.appGlobals.saveCurrentSmallCraft(new SmallCraft(JSON.stringify(sample.save))))}>
                                                    <FolderOpen />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TextSection>
                        ) : null}
                        <TextSection label="Sample DropShips (Future Wars)">
                            <p className="smaller-text">
                                Custom Homebrew, NOT OFFICIAL. The DropShips the Future Wars authors printed, each built by its author's
                                construction method, and NGCFells's verification builds: the Leopard, Union and Overlord of DropShips and
                                JumpShips (FASA, 1988) under each method, to show how far each lands from the canon tonnage. Where a sheet
                                breaks its own rule, the design follows the rule and its notes say what the sheet prints. Loading one
                                replaces the design you are working on and ticks its method; see <Link to={`${process.env.PUBLIC_URL}/classic-battletech/tro-jbt/future-wars-dropships`}>TRO - JBT: Future Wars DropShips</Link>.
                            </p>
                            <table className="table" data-testid="fw-dropship-samples">
                                <thead>
                                    <tr><th>Name</th><th>Method</th><th>Hull</th><th>Printed in</th><th><span className="visually-hidden">Actions</span></th></tr>
                                </thead>
                                <tbody>
                                    {getFwDropShipSamples().map((sample: IFwDropShipSample) => (
                                        <tr key={sample.id}>
                                            <td>{sample.name}{sample.group === "canon" ? " (verification build)" : ""}</td>
                                            <td>{FW_DROPSHIP_SOURCES[sample.method].split(",")[0]}</td>
                                            <td>{sample.tonnage.toLocaleString("en-US")} tons, {sample.save.shape === "spheroid" ? "Spheroid" : "Aerodyne"}</td>
                                            <td>{sample.source}</td>
                                            <td className="text-right">
                                                <button className="btn btn-sm btn-primary" type="button" data-testid={"fw-dropship-sample-" + sample.id} title={"Load " + sample.name + " (" + sample.id + ") into the editor"} onClick={(e) => this.loadSample(e, sample.id)}>
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

