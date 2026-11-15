import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight, FaFile, FaFolderOpen, FaSave, FaTrash } from "react-icons/fa";
import Walker, { IWalkerExport } from '../../../../classes/walker';
import { WALKER_EDITION_RULES, getWalkerCredit } from '../../../../data/walker-construction';
import { IAppGlobals } from '../../../app-router';
import { WalkerCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { confirmReplaceDesign, designWouldBeLost } from '../../../components/confirm-replace-design';
const ArrowCircleRight = FaArrowCircleRight as any;
const File = FaFile as any;
const FolderOpen = FaFolderOpen as any;
const Save = FaSave as any;
const Trash = FaTrash as any;

export default class WalkerCreatorHome extends React.Component<IHomeProps> {
    constructor(props: IHomeProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Walker Creator");
    }

    // Before the design is replaced, offer to save it first.
    replaceDesign = (replace: () => void): void => {
        confirmReplaceDesign(this.props.appGlobals, {
            what: "Walker",
            lost: designWouldBeLost(this.props.appGlobals.currentWalker, () => new Walker(), this.props.appGlobals.walkerSaves || []),
            save: () => this.saveAsNew({ preventDefault: () => {} } as React.FormEvent<HTMLButtonElement>),
            replace,
        });
    }

    startNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.replaceDesign(() => this.props.appGlobals.saveCurrentWalker(new Walker()));
    }

    saveAsNew = (e: React.FormEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const walker = this.props.appGlobals.currentWalker;
        if (walker) {
            // A copy saved as new gets its own id, so it never overwrites the row it was loaded from.
            const copy = new Walker(walker.exportJSON());
            if ((this.props.appGlobals.walkerSaves || []).some((save) => save.uuid === copy.getUUID())) copy.newUUID();
            this.props.appGlobals.saveWalkerSaves([...(this.props.appGlobals.walkerSaves || []), copy.export()]);
        }
    }

    loadSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = (this.props.appGlobals.walkerSaves || [])[saveIndex];
        if (save) this.replaceDesign(() => this.props.appGlobals.saveCurrentWalker(new Walker(JSON.stringify(save))));
    }

    saveOver = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = (this.props.appGlobals.walkerSaves || [])[saveIndex];
        if (!this.props.appGlobals.currentWalker || !save) return;
        this.props.appGlobals.openConfirmDialog(
            "Overwrite Confirmation",
            "Are you sure you want to save the currently loaded design over the saved design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const walker = this.props.appGlobals.currentWalker;
                if (walker) {
                    const saves = [...(this.props.appGlobals.walkerSaves || [])];
                    saves[saveIndex] = walker.export();
                    this.props.appGlobals.saveWalkerSaves(saves);
                }
            }
        );
    }

    deleteSave = (e: React.FormEvent<HTMLButtonElement>, saveIndex: number): void => {
        e.preventDefault();
        const save = (this.props.appGlobals.walkerSaves || [])[saveIndex];
        if (!save) return;
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to delete the design \"" + save.name + "\"?",
            "Yes",
            "No, thank you",
            () => {
                const saves = [...(this.props.appGlobals.walkerSaves || [])];
                saves.splice(saveIndex, 1);
                this.props.appGlobals.saveWalkerSaves(saves);
            }
        );
    }

    render = (): JSX.Element => {
        const walker = this.props.appGlobals.currentWalker;
        if (!walker) return <></>;
        const saves = this.props.appGlobals.walkerSaves || [];

        return (
            <UIPage current="classic-battletech-walker-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <WalkerCreatorSideMenu appGlobals={this.props.appGlobals} current="home" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Walker Creator">
                            <p>
                                Build a Walker: Clell Flint's four-legged 'Mech from <em>Future Wars</em>, with ten locations (four legs,
                                four outer torsos, a center torso and a control section with an optional turret). Pick the printing of
                                the rules first, then the chassis, engine and armor, then the turret and the weapons.
                            </p>
                            <p className="smaller-text" data-testid="walker-credit">
                                <strong>Fan-made, Custom Homebrew.</strong> {getWalkerCredit(walker.getEdition(), walker.isIndustrial())} The creator is
                                offered at the Custom Homebrew rules level; a Walker you have saved opens at any level.
                            </p>
                            <ul className="smaller-text">
                                {Object.values(WALKER_EDITION_RULES).map((rules) => <li key={rules.tag}><strong>{rules.name}</strong>: {rules.source}.</li>)}
                            </ul>
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <button className="btn btn-primary pull-left btn-sm" onClick={this.startNew} title="Click here to clear out your current design and start over.">
                                    <File />&nbsp;Start Over
                                </button>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/walker-creator/chassis`} className="btn btn-primary pull-right btn-sm">
                                    Start Building <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>

                        <TextSection
                            label="Your Saved Walkers"
                            labelButton={
                                <button className="btn btn-primary btn-sm pull-right" title="Save the currently loaded design as a new row" onClick={this.saveAsNew}>
                                    <Save />&nbsp;Save as New
                                </button>
                            }
                        >
                            <table className="table" data-testid="walker-saves">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Size</th>
                                        <th>Printing</th>
                                        <th><span className="visually-hidden">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saves.length > 0 ? saves.map((save: IWalkerExport, saveIndex: number) => (
                                        <tr key={saveIndex}>
                                            <td title={"UUID: " + save.uuid}>{save.name || "(nameless)"}</td>
                                            <td>{save.tons} tons{save.industrial ? ", industrial" : ""}</td>
                                            <td className="min-width">{WALKER_EDITION_RULES[save.edition ?? "best-of-1991"]?.name ?? "Best of Future Wars"}</td>
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
                                        <tr><td colSpan={4}>You have no saved Walkers yet.</td></tr>
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
