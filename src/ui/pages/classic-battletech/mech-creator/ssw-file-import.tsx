import React, { type JSX } from 'react';
import { isIncompleteDraft } from '../../../../data/custom-content-local';
import type { ICustomContentDraft } from '../../../../data/custom-content-types';
import { acceptSSWImport, analyzeSSWImport, ISSWImportAnalysis, ISSWImportResult, sswImportLimitError } from '../../../../utils/sswImportSession';
import { type ISSWImportAnswer, missingAnswers } from '../../../../utils/sswDraftBuilder';
import { IAppGlobals } from '../../../app-router';
import { MechCreatorSideMenu } from '../../../components/creator-side-menus';
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
        this.state = { busy: false, analysis: null, answers: {}, results: [], drafts: [], selected: {}, openRow: -1, message: "", error: "", storageWarning: false, evidenceWarning: false };
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
            // Nothing is saved yet: the importer answers the questions, then Save builds the drafts from the answers.
            const analysis = await analyzeSSWImport(files);
            const { results } = analysis;
            const selected: Record<number, boolean> = {};
            // A design missing a canon item has understated weight, BV and cost: the user ticks it knowingly.
            results.forEach((result, index) => { selected[index] = result.status !== "failed" && result.status !== "canonPending"; });
            const answers = Object.fromEntries(analysis.questions.map((question) => [question.key, question.guess]));
            this.setState({ analysis, answers, results, drafts: [], selected, openRow: -1, message: "", storageWarning: false, evidenceWarning: false });
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
        this.draftsFor(result).some(isIncompleteDraft);

    setAnswer = (key: string, change: Partial<ISSWImportAnswer>): void =>
        this.setState({ answers: { ...this.state.answers, [key]: { ...this.state.answers[key], ...change } } });

    answersMissing = (): boolean =>
        (this.state.analysis?.questions ?? []).some((question) => missingAnswers(question, this.state.answers[question.key]).length > 0);

    saveSelected = async (): Promise<void> => {
        const { analysis } = this.state;
        if (!analysis || this.answersMissing()) return;
        this.setState({ busy: true });
        try {
            const { results, drafts, saved, evidenceSaved } = await acceptSSWImport(analysis, this.state.answers);
            const saves = this.props.appGlobals.battleMechSaves ?? [];
            let count = 0;
            results.forEach((result, index) => {
                if (result.mech && this.state.selected[index]) { saves.push(result.mech.export(true)); count++; }
            });
            this.props.appGlobals.saveBattleMechSaves(saves);
            this.setState({
                results, drafts, analysis: null, storageWarning: !saved, evidenceWarning: saved && !evidenceSaved,
                message: `${count} design${count === 1 ? "" : "s"} added to your 'Mech saves.`,
            });
        } catch (error) {
            this.setState({ error: `The import stopped: ${String(error)}` });
        } finally {
            this.setState({ busy: false });
        }
    }

    num = (text: string): number | null => (text.trim() === "" || Number.isNaN(Number(text)) ? null : Number(text));

    renderQuestion = (question: ISSWImportAnalysis["questions"][number]): JSX.Element => {
        const answer = this.state.answers[question.key] ?? question.guess;
        const set = (change: Partial<ISSWImportAnswer>) => this.setAnswer(question.key, change);
        const unknownBox = (field: "techBase" | "tons" | "slots") => (
            <label className="ms-2"><input type="checkbox" checked={answer.unknown[field]} onChange={(event) => set({ unknown: { ...answer.unknown, [field]: event.currentTarget.checked } })} aria-label="I do not know" /> I do not know</label>
        );
        const range = answer.range ?? { short: 0, medium: 0, long: 0 };
        return (
            <fieldset key={question.key} className="border p-2 mb-2" data-testid="ssw-import-question">
                <legend className="fs-6">{question.name}</legend>
                <p className="small">Used by {question.designs.join(", ")}. SSW files do not carry these, so the values below are best guesses.</p>
                {question.required.includes("techBase") ? (
                    <div><label>Tech base <select value={answer.techBase ?? ""} onChange={(event) => set({ techBase: event.currentTarget.value === "clan" ? "clan" : event.currentTarget.value === "is" ? "is" : null, edited: { ...answer.edited, techBase: true } })}>
                        <option value="">Choose…</option><option value="is">Inner Sphere</option><option value="clan">Clan</option></select></label>{unknownBox("techBase")}</div>
                ) : null}
                {question.required.includes("tons") ? (
                    <div><label>Tons <input type="number" min={0} step={0.5} value={answer.tons ?? ""} onChange={(event) => set({ tons: this.num(event.currentTarget.value), edited: { ...answer.edited, tons: true } })} /></label>{unknownBox("tons")}</div>
                ) : null}
                {question.required.includes("slots") ? (
                    <div><label>Slots <input type="number" min={0} step={1} value={answer.slots ?? ""} onChange={(event) => set({ slots: this.num(event.currentTarget.value), edited: { ...answer.edited, slots: true } })} /></label>{unknownBox("slots")}</div>
                ) : null}
                {question.kind === "equipment" ? (
                    <div className="small">
                        <label>Damage <input type="number" min={0} value={answer.damage ?? ""} onChange={(event) => set({ damage: this.num(event.currentTarget.value) })} /></label>{" "}
                        <label>Heat <input type="number" min={0} value={answer.heat ?? ""} onChange={(event) => set({ heat: this.num(event.currentTarget.value) })} /></label>{" "}
                        <label>Short range <input type="number" min={0} value={answer.range?.short ?? ""} onChange={(event) => set({ range: { ...range, short: this.num(event.currentTarget.value) ?? 0 } })} /></label>{" "}
                        <label>Medium range <input type="number" min={0} value={answer.range?.medium ?? ""} onChange={(event) => set({ range: { ...range, medium: this.num(event.currentTarget.value) ?? 0 } })} /></label>{" "}
                        <label>Long range <input type="number" min={0} value={answer.range?.long ?? ""} onChange={(event) => set({ range: { ...range, long: this.num(event.currentTarget.value) ?? 0 } })} /></label>
                    </div>
                ) : null}
                <div className="small"><label>Source note <input type="text" value={answer.sourceNote ?? ""} onChange={(event) => set({ sourceNote: event.currentTarget.value })} /></label> (optional)</div>
            </fieldset>
        );
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
                            {this.state.evidenceWarning ? <div className="alert alert-warning">The drafts are saved, but this browser's storage is full, so the source .ssw files were not kept with them. Import the files again before proposing the drafts.</div> : null}
                            {this.state.error ? <div className="alert alert-danger">{this.state.error}</div> : null}
                            {this.state.message ? <div className="alert alert-success">{this.state.message}</div> : null}
                            {(this.state.analysis?.questions.length ?? 0) > 0 ? (
                                <div>
                                    <h4>Items the catalogs do not know</h4>
                                    <p>Tell us what you can about each one. Tech base, tons and slots are needed, or tick I do not know to keep the best guess (it is marked estimated). Damage, heat, ranges and the source note are optional. Save stays off until each is answered.</p>
                                    {this.state.analysis!.questions.map((question) => this.renderQuestion(question))}
                                </div>
                            ) : null}
                            {this.state.results.length > 0 ? (
                                <table className="table table-sm">
                                    <thead><tr><th><span className="visually-hidden">Actions</span></th><th>File</th><th>Design</th><th>Status</th><th className="text-end">BV (JBT / SSW)</th><th className="text-end">Issues</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
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
                                <button type="button" className="btn btn-primary" disabled={this.state.busy || !this.state.analysis || this.answersMissing()} onClick={() => void this.saveSelected()}>Save selected to my 'Mechs</button>
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
    analysis: ISSWImportAnalysis | null;
    answers: Record<string, ISSWImportAnswer>;
    results: ISSWImportResult[];
    drafts: ICustomContentDraft[];
    selected: Record<number, boolean>;
    openRow: number;
    message: string;
    error: string;
    storageWarning: boolean;
    evidenceWarning: boolean;
}
