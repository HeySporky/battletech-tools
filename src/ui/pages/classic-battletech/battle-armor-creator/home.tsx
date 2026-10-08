import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import BattleArmor, { IBattleArmorExport } from '../../../../classes/battle-armor';
import { IAppGlobals } from '../../../app-router';
import BattleArmorCreatorSideMenu from '../../../components/battle-armor-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { findBattleArmorWeightClass } from '../../../../data/battle-armor-construction';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class BattleArmorCreatorHome extends React.Component<IHomeProps> {
    constructor(props: IHomeProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Battle Armor Creator");
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.props.appGlobals.saveCurrentBattleArmor(new BattleArmor());
    }

    saveAsNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const suit = this.props.appGlobals.currentBattleArmor;
        if (suit) {
            // A copy saved as new gets its own id, so it never overwrites the row it was loaded from.
            const copy = new BattleArmor(suit.exportJSON());
            if (this.props.appGlobals.battleArmorSaves.some((save) => save.uuid === copy.getUUID())) copy.newUUID();
            this.props.appGlobals.saveBattleArmorSaves([...this.props.appGlobals.battleArmorSaves, copy.export()]);
        }
    }

    loadSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.battleArmorSaves[saveIndex];
        if (save) this.props.appGlobals.saveCurrentBattleArmor(new BattleArmor(JSON.stringify(save)));
    }

    saveOver = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.battleArmorSaves[saveIndex];
        if (!this.props.appGlobals.currentBattleArmor || !save) return;
        this.props.appGlobals.openConfirmDialog(
            "Overwrite Confirmation",
            "Are you sure you want to save the currently loaded design over the saved design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const suit = this.props.appGlobals.currentBattleArmor;
                if (suit) {
                    const saves = [...this.props.appGlobals.battleArmorSaves];
                    saves[saveIndex] = suit.export();
                    this.props.appGlobals.saveBattleArmorSaves(saves);
                }
            }
        );
    }

    deleteSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = this.props.appGlobals.battleArmorSaves[saveIndex];
        if (!save) return;
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to delete the design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const saves = [...this.props.appGlobals.battleArmorSaves];
                saves.splice(saveIndex, 1);
                this.props.appGlobals.saveBattleArmorSaves(saves);
            }
        );
    }

    render = (): JSX.Element => {
        if (!this.props.appGlobals.currentBattleArmor) return <></>;
        const saves = this.props.appGlobals.battleArmorSaves || [];

        return (
            <UIPage current="classic-battletech-battle-armor-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <BattleArmorCreatorSideMenu appGlobals={this.props.appGlobals} current="home" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Battle Armor Creator">
                            <p>
                                Build a suit of battle armor under the TechManual construction rules (pp. 160-173): choose its
                                technology base, weight class and body type, its motive systems and manipulators, armor it
                                point by point, and mount weapons and equipment in its arms and body.
                            </p>
                            <p className="smaller-text">
                                The creator checks the weight, the weapon slots and the weapon limits as you go, and the
                                summary gives the Anti-'Mech and mechanized capabilities, the Battle Value and cost of the
                                squad, and a record sheet.
                            </p>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <button className="btn btn-primary pull-left btn-sm" onClick={this.startNew} title="Click here to clear out your current design and start over.">
                                    <File />&nbsp;Start Over
                                </button>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator/chassis`} className="btn btn-primary pull-right btn-sm">
                                    Start Building <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>

                        <TextSection
                            label="Your Saved Battle Armor"
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
                                        <th>Class</th>
                                        <th>Troopers</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saves.length > 0 ? saves.map((save: IBattleArmorExport, saveIndex: number) => (
                                        <tr key={saveIndex}>
                                            <td title={"UUID: " + save.uuid}>{save.name || "(nameless)"}</td>
                                            <td>{findBattleArmorWeightClass(save.weightClass).name}, {save.techBase === "clan" ? "Clan" : "Inner Sphere"}</td>
                                            <td className="min-width">{save.squadSize}</td>
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
                                        <tr><td colSpan={4}>You have no saved battle armor designs yet.</td></tr>
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
