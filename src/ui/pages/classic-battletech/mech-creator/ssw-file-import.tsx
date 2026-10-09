import React, { type JSX } from 'react';
import type { ICustomContentDraft } from '../../../../data/custom-content-types';
import { missingFields } from '../../../../utils/sswDraftBuilder';
import { ISSWImportResult, runSSWImportSession, sswImportLimitError } from '../../../../utils/sswImportSession';
import { IAppGlobals } from '../../../app-router';
import MechCreatorSideMenu from '../../../components/mech-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';

// Import any .ssw files from disk: one review row per file, then save the ones you want. Items the catalogs
// don't know become custom content drafts, saved in this browser.
const STATUS_LABELS: Record<ISSWImportResult["status"], { label: string; className: string }> = {
    clean: { label: "Clean", className: "badge bg-success" },
    warnings: { label: "Warnings", className: "badge bg-warning text-dark" },
    unresolved: { label: "Placeholders", className: "badge bg-info text-dark" },
    canonPending: { label: "Canon item missing", className: "badge bg-secondary" },
    failed: { label: "Failed", className: "badge bg-danger" },
};

export default class MechCreatorSSWFileImport extends React.Component<ISSWFileImportProps, ISSWFileImportState> {
    constructor(props: ISSWFileImportProps) {
        super(props);
        this.state = { busy: false, results: [], drafts: [], selected: {}, openRow: -1, message: "", error: "", storageWarning: false };
        this.props.appGlobals.makeDocumentTitle("Import .ssw Files | 'Mech Creator");
    }

    readFiles = async (fileList: FileList | null): Promise<void> => {
        if (!fileList || fileList.length === 0) return;
        const limitError = sswImportLimitError([...fileList]);
        if (limitError) {
            this.setState({ message: "", error: limitError });
            return;
        }
        this.setState({ busy: true, message: "", error: "" });
        try {
            const files = await Promise.all([...fileList].map(async (file) => ({ fileName: file.name, xml: await file.text() })));
            const { results, drafts, saved } = await runSSWImportSession(files);
            const selected: Record<number, boolean> = {};
            // A design missing a canon item has understated weight, BV and cost: the user ticks it knowingly.
            results.forEach((result, index) => { selected[index] = result.status !== "failed" && result.status !== "canonPending"; });
            this.setState({ results, drafts, selected, openRow: -1, storageWarning: !saved });
        } catch (error) {
            this.setState({ error: `The import stopped: ${String(error)}` });
        } finally {
            this.setState({ busy: false });
        }
    }

    onFileInput = (event: React.ChangeEvent<HTMLInputElement>): void => { void this.readFiles(event.currentTarget.files); }
    onDrop = (event: React.DragEvent<HTMLDivElement>): void => { event.preventDefault(); void this.readFiles(event.dataTransfer.files); }
    toggle = (index: number): void => this.setState({ selected: { ...this.state.selected, [index]: !this.state.selected[index] } });

    draftsFor = (result: ISSWImportResult): ICustomContentDraft[] =>
        this.state.drafts.filter((draft) => result.draftIds.includes(draft.id));

    incompleteCustomStats = (result: ISSWImportResult): boolean =>
        this.draftsFor(result).some((draft) => draft.status !== "complete" || missingFields(draft).length > 0);

    saveSelected = (): void => {
        const saves = this.props.appGlobals.battleMechSaves ?? [];
        let count = 0;
        this.state.results.forEach((result, index) => {
            if (result.mech && this.state.selected[index]) { saves.push(result.mech.export(true)); count++; }
        });
        this.props.appGlobals.saveBattleMechSaves(saves);
        this.setState({ message: `${count} design${count === 1 ? "" : "s"} added to your 'Mech saves.` });
    }

    render = (): JSX.Element => {
        const open = this.state.results[this.state.openRow];
        return (
            <UIPage current="classic-battletech-mech-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <MechCreatorSideMenu appGlobals={this.props.appGlobals} current="imports" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Import .ssw files">
                            <div className="drop-zone alert alert-secondary text-center" onDragOver={(event) => event.preventDefault()} onDrop={this.onDrop}>
                                <p>Drop Solaris Skunk Werks <code>.ssw</code> files here, or choose them:</p>
                                <input type="file" multiple accept=".ssw" onChange={this.onFileInput} aria-label="Choose .ssw files" />
                            </div>
                            {this.state.busy ? <div className="alert alert-info">Importing…</div> : null}
                            {this.state.storageWarning ? <div className="alert alert-warning">This browser would not save the custom content drafts (private mode or storage full). They work until you close this tab.</div> : null}
                            {this.state.error ? <div className="alert alert-danger">{this.state.error}</div> : null}
                            {this.state.message ? <div className="alert alert-success">{this.state.message}</div> : null}
                            {this.state.results.length > 0 ? (
                                <table className="table table-sm">
                                    <thead><tr><th></th><th>File</th><th>Design</th><th>Status</th><th className="text-end">BV (ours / SSW)</th><th className="text-end">Issues</th><th></th></tr></thead>
                                    <tbody>
                                        {this.state.results.map((result, index) => (
                                            <tr key={result.fileName + index}>
                                                <td><input type="checkbox" disabled={!result.mech} checked={!!this.state.selected[index]} onChange={() => this.toggle(index)} aria-label={`Select ${result.fileName}`} /></td>
                                                <td>{result.fileName}</td>
                                                <td>{result.designName}</td>
                                                <td><span className={STATUS_LABELS[result.status].className}>{STATUS_LABELS[result.status].label}</span></td>
                                                <td className="text-end">{result.ourBV ?? "-"} / {result.sswBV2 ?? "-"}</td>
                                                <td className="text-end">{result.warnings.length + result.unresolved.length}</td>
                                                <td><button type="button" className="btn btn-sm btn-secondary" onClick={() => this.setState({ openRow: this.state.openRow === index ? -1 : index })}>Details</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : null}
                            {open ? (
                                <div className="card card-body mb-3" data-testid="ssw-import-detail">
                                    <h4>{open.designName}</h4>
                                    {open.failureReason ? <div className="alert alert-danger">{open.failureReason}</div> : null}
                                    {open.status === "canonPending" ? <div className="alert alert-warning" data-testid="ssw-import-canon-missing">A canon item this design uses is not in the catalogs yet, so it was left off: weight, BV and cost are understated. The design is not ticked for saving.</div> : null}
                                    {this.incompleteCustomStats(open) ? <div className="alert alert-warning">Incomplete custom stats: BV, heat and cost are not reliable until the placeholders' stats are entered.</div> : null}
                                    {open.unresolved.length > 0 ? (
                                        <>
                                            <h5>Not in the catalogs</h5>
                                            <ul>{open.unresolved.map((item, index) => (
                                                <li key={index}>{item.kind}: {item.sswName}{open.canonPending.includes(item.name) ? " (canon item, not yet in the catalog; it cannot be submitted as custom)" : ""}</li>
                                            ))}</ul>
                                            {open.draftIds.length > 0 ? (
                                                <p>Custom content drafts (placeholders, saved in this browser): {this.draftsFor(open).map((draft) => String(draft.record.name)).join(", ")}</p>
                                            ) : null}
                                        </>
                                    ) : null}
                                    {open.warnings.length > 0 ? (<><h5>Warnings</h5><ul>{open.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></>) : null}
                                </div>
                            ) : null}
                            {this.state.results.some((result) => result.mech) ? (
                                <button type="button" className="btn btn-primary" onClick={this.saveSelected}>Save selected to my 'Mechs</button>
                            ) : null}
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface ISSWFileImportProps { appGlobals: IAppGlobals; }
interface ISSWFileImportState {
    busy: boolean;
    results: ISSWImportResult[];
    drafts: ICustomContentDraft[];
    selected: Record<number, boolean>;
    openRow: number;
    message: string;
    error: string;
    storageWarning: boolean;
}
