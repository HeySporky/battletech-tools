import * as React from 'react';
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { getMULDisplayName, IASMULUnit } from '../../classes/alpha-strike-unit';
import { CONST_CUSTOM_MUL_GITHUB_OWNER, CONST_CUSTOM_MUL_GITHUB_REPO } from '../../configVars';
import {
    buildCustomMULRecord,
    customMULRecordToForm,
    CUSTOM_MUL_FILE_PATH,
    CUSTOM_RULES_LEVELS,
    CUSTOM_TECHNOLOGIES,
    CUSTOM_UNIT_TYPES,
    emptyCustomMULForm,
    ICustomMULForm,
    mergeCustomMULEntries,
    mulIdentity,
    newCustomMULKey,
    nextCustomMULId,
    serializeCustomMULRecords,
    validateCustomMULForm,
} from '../../data/custom-mul';
import { getLocalCustomMULUnits, saveLocalCustomMULUnits } from '../../data/custom-mul-local';
import bundledCustomUnits from '../../data/mul/custom/custom-units.json';
import { loadMULListItems } from '../../data/mul-list-items';
import { submitGithubFileContribution } from '../../utils/githubContribution';
import { getMULAerospaceRoles, getMULEraIDs, getMULEraLabel, getMULGroundRoles } from '../../utils/mulUtilities';
import { IAppGlobals } from '../app-router';
import StandardModal from '../components/standard-modal';
import UIPage from '../components/ui-page';
const Edit = FaEdit as any;
const Plus = FaPlus as any;
const Trash = FaTrash as any;

const GITHUB_TOKEN_SESSION_KEY = "customMULGithubToken";

// The shared list as shipped in this build. Read-only here; changes to it go through pull requests.
const sharedRecords = bundledCustomUnits as unknown as IASMULUnit[];
const sharedKeys = new Set(sharedRecords.map((record) => record.MulUnitKey));

function damageSummary(record: IASMULUnit): string {
    return [
        [record.BFDamageShort, record.BFDamageShortMin],
        [record.BFDamageMedium, record.BFDamageMediumMin],
        [record.BFDamageLong, record.BFDamageLongMin],
    ].map(([value, minimal]) => minimal ? "0*" : value).join("/");
}

export default class CustomMULEditor extends React.Component<ICustomMULEditorProps, ICustomMULEditorState> {

    constructor(props: ICustomMULEditorProps) {
        super(props);

        this.state = {
            localRecords: getLocalCustomMULUnits(),
            selectedKeys: [],
            editForm: null,
            editKey: null,
            editErrors: [],
            canonicalIdentities: null,
            showJSON: false,
            storageError: false,
            githubToken: sessionStorage.getItem(GITHUB_TOKEN_SESSION_KEY) ?? "",
            rememberGithubToken: sessionStorage.getItem(GITHUB_TOKEN_SESSION_KEY) !== null,
            isSubmittingContribution: false,
            contributionError: "",
            contributionPullRequestUrl: "",
        };

        this.props.appGlobals.makeDocumentTitle("Custom MUL Editor");
    }

    componentDidMount(): void {
        // Used to stop canonical MUL 2.0 units from being re-entered as customs.
        void loadMULListItems("mul2").then((units) => {
            this.setState({
                canonicalIdentities: new Set(units.map((unit) => mulIdentity(unit.Name, unit.Variant))),
            });
        });
    }

    _setLocalRecords = (localRecords: IASMULUnit[]): void => {
        const saved = saveLocalCustomMULUnits(localRecords);
        this.setState({
            localRecords,
            storageError: !saved,
            selectedKeys: this.state.selectedKeys.filter((key) => localRecords.some((record) => record.MulUnitKey === key)),
        });
    }

    // Shared list with this browser's entries applied on top: what a merged pull request would produce.
    _combinedFileText = (): string => mergeCustomMULEntries(serializeCustomMULRecords(sharedRecords), this.state.localRecords);

    openAdd = (): void => {
        this.setState({ editForm: emptyCustomMULForm(), editKey: null, editErrors: [], contributionError: "" });
    }

    // Editing a shared entry saves a local copy under the same key, i.e. a proposed change to it.
    openEdit = (record: IASMULUnit): void => {
        this.setState({ editForm: customMULRecordToForm(record), editKey: record.MulUnitKey ?? null, editErrors: [], contributionError: "" });
    }

    closeEdit = (): void => {
        this.setState({ editForm: null, editKey: null, editErrors: [] });
    }

    updateField = (field: keyof ICustomMULForm) => (
        event: React.FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ): void => {
        if (!this.state.editForm) {
            return;
        }
        this.setState({ editForm: { ...this.state.editForm, [field]: event.currentTarget.value } });
    }

    // Validates and saves the open form to this browser. Returns the saved record, or null if invalid.
    _saveEditLocally = (): IASMULUnit | null => {
        const form = this.state.editForm;
        if (!form) {
            return null;
        }

        const errors = validateCustomMULForm(form, {
            customRecords: [...this.state.localRecords, ...sharedRecords],
            canonicalIdentities: this.state.canonicalIdentities ?? undefined,
            editingKey: this.state.editKey ?? undefined,
        });
        if (errors.length > 0) {
            this.setState({ editErrors: errors });
            return null;
        }

        const existing = this.state.localRecords.find((record) => record.MulUnitKey === this.state.editKey)
            ?? sharedRecords.find((record) => record.MulUnitKey === this.state.editKey);
        const record = buildCustomMULRecord(form, {
            id: existing?.Id ?? nextCustomMULId([...this.state.localRecords, ...sharedRecords]),
            key: existing?.MulUnitKey ?? newCustomMULKey(),
            createdAt: existing?.CustomInfo?.createdAt ?? new Date().toISOString(),
        });
        record.CustomInfo = { ...record.CustomInfo!, local: true };

        const isLocal = this.state.localRecords.some((item) => item.MulUnitKey === record.MulUnitKey);
        this._setLocalRecords(isLocal
            ? this.state.localRecords.map((item) => item.MulUnitKey === record.MulUnitKey ? record : item)
            : [...this.state.localRecords, record]);
        this.closeEdit();
        return record;
    }

    saveEditLocally = (): void => {
        this._saveEditLocally();
    }

    saveEditAndSubmit = (): void => {
        if (!this.state.githubToken.trim()) {
            this.setState({ editErrors: ["Enter a GitHub personal access token on the page (under Submit to the shared list) to submit a pull request. Use Save Locally to keep the entry for now."] });
            return;
        }
        const record = this._saveEditLocally();
        if (record) {
            void this.submitEntries([record]);
        }
    }

    removeRecord = (record: IASMULUnit): void => {
        this.props.appGlobals.openConfirmDialog(
            "Confirmation",
            `Delete <strong>${getMULDisplayName(record)}</strong> from this browser? Pull requests already submitted are not affected.`,
            "Delete",
            "Cancel",
            () => this._setLocalRecords(this.state.localRecords.filter((item) => item.MulUnitKey !== record.MulUnitKey)),
        );
    }

    toggleSelected = (key: string): void => {
        this.setState({
            selectedKeys: this.state.selectedKeys.includes(key)
                ? this.state.selectedKeys.filter((item) => item !== key)
                : [...this.state.selectedKeys, key],
        });
    }

    submitEntries = async (entries: IASMULUnit[]): Promise<void> => {
        if (entries.length === 0) {
            return;
        }
        const names = entries.map(getMULDisplayName);
        this.setState({ isSubmittingContribution: true, contributionError: "", contributionPullRequestUrl: "" });
        try {
            const result = await submitGithubFileContribution({
                token: this.state.githubToken,
                upstreamOwner: CONST_CUSTOM_MUL_GITHUB_OWNER,
                upstreamRepo: CONST_CUSTOM_MUL_GITHUB_REPO,
                filePath: CUSTOM_MUL_FILE_PATH,
                fileContents: (currentUpstream) => mergeCustomMULEntries(currentUpstream, entries),
                branchPrefix: "custom-mul",
                commitMessage: `Custom MUL: ${names.length === 1 ? names[0] : `${names.length} entries`}`,
                pullRequestTitle: `Custom MUL: ${names.length === 1 ? names[0] : `${names.length} entries`}`,
                pullRequestBody: [
                    "Submitted from the in-app Custom MUL Editor. These are non-canonical, user-supplied Alpha Strike units - please review stats, attribution, and licensing before merging.",
                    "",
                    ...entries.map((entry) => `- **${getMULDisplayName(entry)}** (${entry.Class}, PV ${entry.BFPointValue}) by ${entry.CustomInfo?.author ?? "unknown"}${entry.CustomInfo?.source ? ` - ${entry.CustomInfo.source}` : ""}`),
                ].join("\n"),
            });

            const submittedKeys = new Set(entries.map((entry) => entry.MulUnitKey));
            this._setLocalRecords(this.state.localRecords.map((record) => submittedKeys.has(record.MulUnitKey)
                ? { ...record, CustomInfo: { ...record.CustomInfo!, pullRequestUrl: result.pullRequestUrl } }
                : record));
            this.setState({ isSubmittingContribution: false, contributionPullRequestUrl: result.pullRequestUrl, selectedKeys: [] });
        } catch (error) {
            this.setState({
                isSubmittingContribution: false,
                contributionError: error instanceof Error ? error.message : "Unknown error submitting contribution.",
            });
        }
    }

    downloadFile = (): void => {
        const blob = new Blob([this._combinedFileText()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "custom-units.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    updateGithubToken = (event: React.FormEvent<HTMLInputElement>): void => {
        const token = event.currentTarget.value;
        this.setState({ githubToken: token });
        if (this.state.rememberGithubToken) {
            sessionStorage.setItem(GITHUB_TOKEN_SESSION_KEY, token);
        }
    }

    toggleRememberGithubToken = (event: React.FormEvent<HTMLInputElement>): void => {
        const remember = event.currentTarget.checked;
        this.setState({ rememberGithubToken: remember });
        if (remember) {
            sessionStorage.setItem(GITHUB_TOKEN_SESSION_KEY, this.state.githubToken);
        } else {
            sessionStorage.removeItem(GITHUB_TOKEN_SESSION_KEY);
        }
    }

    _renderTextField = (label: string, field: keyof ICustomMULForm, placeholder: string = "", colClass: string = "col-md-3"): JSX.Element => {
        return (
            <div className={colClass}>
                <label className="d-block">
                    {label}<br />
                    <input
                        type="text"
                        value={this.state.editForm ? this.state.editForm[field] : ""}
                        placeholder={placeholder}
                        onChange={this.updateField(field)}
                    />
                </label>
            </div>
        );
    }

    _renderSelect = (label: string, field: keyof ICustomMULForm, options: { value: string; label: string }[], colClass: string = "col-md-3"): JSX.Element => {
        return (
            <div className={colClass}>
                <label className="d-block">
                    {label}<br />
                    <select
                        value={this.state.editForm ? this.state.editForm[field] : ""}
                        onChange={this.updateField(field)}
                    >
                        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
            </div>
        );
    }

    _renderEditForm = (): JSX.Element => {
        const asOptions = (values: string[]) => values.map((value) => ({ value, label: value }));
        return (
            <>
                {this.state.editKey && sharedKeys.has(this.state.editKey) ? (
                    <div className="alert alert-info">
                        This entry is in the shared list. Saving keeps your changed copy in this browser; submit it to propose the change.
                    </div>
                ) : null}
                {this.state.editErrors.length > 0 ? (
                    <div className="alert alert-danger">
                        <ul className="no-margins">
                            {this.state.editErrors.map((error, index) => <li key={index}>{error}</li>)}
                        </ul>
                    </div>
                ) : null}
                <fieldset className="fieldset">
                    <legend>Identity</legend>
                    <div className="row">
                        {this._renderTextField("Name (chassis)", "name", "Vindicator", "col-md-4")}
                        {this._renderTextField("Variant / model", "variant", "VND-X", "col-md-4")}
                        {this._renderSelect("Unit type", "unitType", CUSTOM_UNIT_TYPES.map((type) => ({ value: type.name, label: type.name })), "col-md-4")}
                    </div>
                    <div className="row">
                        {this._renderSelect("Technology", "technology", asOptions(CUSTOM_TECHNOLOGIES.map((tech) => tech.name)))}
                        {this._renderSelect("Rules level", "rules", asOptions(CUSTOM_RULES_LEVELS))}
                        {this._renderSelect("Role", "role", asOptions(["None", ...getMULGroundRoles(), ...getMULAerospaceRoles()]))}
                        {this._renderSelect("Era", "eraId", [{ value: "0", label: "Unknown" }, ...getMULEraIDs().map((eraId) => ({ value: String(eraId), label: getMULEraLabel(eraId) }))])}
                    </div>
                    <div className="row">
                        {this._renderTextField("Intro year", "dateIntroduced", "3067")}
                        {this._renderTextField("Tonnage", "tonnage", "45")}
                        {this._renderTextField("Battle Value", "battleValue", "0")}
                        {this._renderTextField("Point Value (PV)", "pointValue", "28")}
                    </div>
                </fieldset>
                <fieldset className="fieldset">
                    <legend>Alpha Strike Card</legend>
                    <div className="row">
                        {this._renderTextField("Size", "size", "1-4")}
                        {this._renderTextField("Move", "move", "8\"j or 8\"/6\"j")}
                        {this._renderTextField("TMM", "tmm", "2")}
                        {this._renderTextField("Overheat (OV)", "overheat", "0")}
                    </div>
                    <div className="row">
                        {this._renderTextField("Armor", "armor", "5")}
                        {this._renderTextField("Structure", "structure", "4")}
                        {this._renderTextField("Threshold (aero)", "threshold", "0")}
                    </div>
                    <div className="row">
                        {this._renderTextField("Damage S", "damageShort", "2 or 0*")}
                        {this._renderTextField("Damage M", "damageMedium", "2 or 0*")}
                        {this._renderTextField("Damage L", "damageLong", "1 or 0*")}
                        {this._renderTextField("Damage E (aero)", "damageExtreme", "0")}
                    </div>
                    <div className="row">
                        {this._renderTextField("Special abilities (comma separated)", "abilities", "CASE, ENE, IF1", "col-md-12")}
                    </div>
                </fieldset>
                <fieldset className="fieldset">
                    <legend>Attribution</legend>
                    <div className="row">
                        {this._renderTextField("Author / designer", "author", "Who created this unit", "col-md-6")}
                        {this._renderTextField("Source", "source", "Fan TRO, campaign book, URL...", "col-md-6")}
                    </div>
                    <div className="row">
                        <div className="col-md-12">
                            <label className="d-block">
                                Notes<br />
                                <textarea
                                    value={this.state.editForm?.notes ?? ""}
                                    onChange={this.updateField("notes")}
                                    rows={3}
                                    style={{ width: "100%" }}
                                />
                            </label>
                        </div>
                    </div>
                </fieldset>
            </>
        );
    }

    _renderStatsCells = (record: IASMULUnit): JSX.Element => {
        return (
            <>
                <td>{record.Class}</td>
                <td className="text-center">{record.BFPointValue}</td>
                <td className="text-center">{record.BFSize}</td>
                <td className="text-center">{record.BFMove}</td>
                <td className="text-center">{record.BFArmor}/{record.BFStructure}</td>
                <td className="text-center no-wrap">{damageSummary(record)}</td>
                <td>{record.BFAbilities}</td>
                <td title={record.CustomInfo?.source}>{record.CustomInfo?.author}</td>
            </>
        );
    }

    render = (): JSX.Element => {
        const byName = (a: IASMULUnit, b: IASMULUnit) => getMULDisplayName(a).localeCompare(getMULDisplayName(b));
        const local = [...this.state.localRecords].sort(byName);
        const shared = [...sharedRecords].sort(byName);
        const selected = this.state.localRecords.filter((record) => this.state.selectedKeys.includes(record.MulUnitKey ?? ""));
        const canSubmit = !this.state.isSubmittingContribution && this.state.githubToken.trim() !== "";

        return (
            <UIPage current="custom-mul-editor" appGlobals={this.props.appGlobals}>
                <div className="alert alert-warning text-center">
                    <p className="no-margins"><strong>Developers only!</strong> Data entry for non-canonical custom units.</p>
                </div>

                {this.state.editForm ? (
                    <StandardModal
                        show={true}
                        className="modal-xl"
                        onClose={this.closeEdit}
                        onSave={this.saveEditLocally}
                        labelSave="Save Locally"
                        onSaveAsNew={this.saveEditAndSubmit}
                        labelSaveAsNew="Save Locally + Submit PR"
                        title={this.state.editKey ? `Editing ${this.state.editForm.name || "Custom Unit"}` : "New Custom Unit"}
                    >
                        {this._renderEditForm()}
                    </StandardModal>
                ) : null}

                {this.state.showJSON ? (
                    <StandardModal
                        show={true}
                        className="modal-xl"
                        onClose={() => this.setState({ showJSON: false })}
                        title={`${CUSTOM_MUL_FILE_PATH} (shared list + your entries)`}
                    >
                        <textarea
                            style={{ width: "100%", height: "73vh" }}
                            spellCheck={false}
                            readOnly={true}
                            value={this._combinedFileText()}
                        />
                    </StandardModal>
                ) : null}

                <div className="alert alert-info">
                    <p>
                        <strong>Custom units</strong> are non-canonical Alpha Strike units. They appear in unit search when
                        <em> MUL 2.0 + MUL 1.0 + customs</em> is selected, tagged <strong>Custom</strong>.
                    </p>
                    <ul className="no-margins">
                        <li><strong>Save Locally</strong> keeps an entry in this browser; it shows up in your own searches right away.</li>
                        <li><strong>Submit PR</strong> proposes entries for the shared list ({CONST_CUSTOM_MUL_GITHUB_OWNER}/{CONST_CUSTOM_MUL_GITHUB_REPO}) so everyone gets them once merged.</li>
                    </ul>
                </div>

                {this.state.storageError ? (
                    <div className="alert alert-danger">This browser would not save your entries (storage is full or disabled). Download them before leaving this page.</div>
                ) : null}

                <div className="text-right">
                    <button className="btn btn-primary btn-sm" onClick={this.openAdd}><Plus />&nbsp;New Custom Unit</button>
                    <button className="btn btn-secondary btn-sm" onClick={this.downloadFile}>Download custom-units.json</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => this.setState({ showJSON: true })}>Show JSON</button>
                </div>

                <h3>Your Entries (this browser)</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>&nbsp;</th>
                            <th>&nbsp;</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th className="text-center">PV</th>
                            <th className="text-center">Size</th>
                            <th className="text-center">Move</th>
                            <th className="text-center">A/S</th>
                            <th className="text-center">Damage</th>
                            <th>Abilities</th>
                            <th>Author</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {local.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="text-center">No local entries. Use <strong>New Custom Unit</strong> to create one.</td>
                            </tr>
                        ) : local.map((record) => (
                            <tr key={record.MulUnitKey}>
                                <td className="min-width">
                                    <input
                                        type="checkbox"
                                        title="Include in the next pull request"
                                        checked={this.state.selectedKeys.includes(record.MulUnitKey ?? "")}
                                        onChange={() => this.toggleSelected(record.MulUnitKey ?? "")}
                                    />
                                </td>
                                <td className="min-width no-wrap">
                                    <button className="btn btn-primary btn-sm" title="Edit" onClick={() => this.openEdit(record)}><Edit /></button>
                                    <button className="btn btn-danger btn-sm" title="Delete from this browser" onClick={() => this.removeRecord(record)}><Trash /></button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        title={canSubmit ? "Submit this entry as a pull request" : "Enter a GitHub token below to submit"}
                                        disabled={!canSubmit}
                                        onClick={() => void this.submitEntries([record])}
                                    >
                                        Submit PR
                                    </button>
                                </td>
                                <td>{getMULDisplayName(record)}</td>
                                {this._renderStatsCells(record)}
                                <td className="no-wrap">
                                    {record.CustomInfo?.pullRequestUrl ? (
                                        <a href={record.CustomInfo.pullRequestUrl} target="_blank" rel="noopener noreferrer">PR submitted</a>
                                    ) : sharedKeys.has(record.MulUnitKey) ? "Edit of shared entry" : "Local only"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {local.length > 0 ? (
                    <div className="text-right">
                        <button
                            className="btn btn-primary btn-sm"
                            disabled={!canSubmit || selected.length === 0}
                            onClick={() => void this.submitEntries(selected)}
                        >
                            Submit {selected.length || ""} Selected as One PR
                        </button>
                    </div>
                ) : null}

                <div className="alert alert-secondary">
                    <h4>Submit to the shared list</h4>
                    <p>
                        Pull requests use your own GitHub personal access token (needs the <code>public_repo</code> scope). The token is
                        used only to call GitHub's API directly from your browser - this app has no backend and never sees or stores it.
                        Each pull request adds your entries to the shared list as it currently exists on GitHub.
                    </p>
                    <label>
                        GitHub Personal Access Token:<br />
                        <input
                            type="password"
                            autoComplete="off"
                            value={this.state.githubToken}
                            onChange={this.updateGithubToken}
                            className="width-auto"
                        />
                    </label>
                    <br />
                    <label>
                        <input
                            type="checkbox"
                            checked={this.state.rememberGithubToken}
                            onChange={this.toggleRememberGithubToken}
                        />
                        &nbsp;Remember token for this browser tab only
                    </label>
                    {this.state.isSubmittingContribution ? <div className="alert alert-info">Submitting pull request…</div> : null}
                    {this.state.contributionPullRequestUrl ? (
                        <div className="alert alert-success">
                            Pull request created: <a href={this.state.contributionPullRequestUrl} target="_blank" rel="noopener noreferrer">{this.state.contributionPullRequestUrl}</a>
                        </div>
                    ) : null}
                    {this.state.contributionError ? (
                        <div className="alert alert-danger">{this.state.contributionError}</div>
                    ) : null}
                </div>

                <h3>Shared List (shipped with the app)</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>&nbsp;</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th className="text-center">PV</th>
                            <th className="text-center">Size</th>
                            <th className="text-center">Move</th>
                            <th className="text-center">A/S</th>
                            <th className="text-center">Damage</th>
                            <th>Abilities</th>
                            <th>Author</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shared.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="text-center">The shared list is empty.</td>
                            </tr>
                        ) : shared.map((record) => (
                            <tr key={record.MulUnitKey}>
                                <td className="min-width no-wrap">
                                    <button className="btn btn-primary btn-sm" title="Propose a change (saves an edited copy locally)" onClick={() => this.openEdit(record)}><Edit /></button>
                                </td>
                                <td>{getMULDisplayName(record)}</td>
                                {this._renderStatsCells(record)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </UIPage>
        );
    }
}

interface ICustomMULEditorProps {
    appGlobals: IAppGlobals;
}

interface ICustomMULEditorState {
    localRecords: IASMULUnit[];
    selectedKeys: string[];
    editForm: ICustomMULForm | null;
    editKey: string | null;
    editErrors: string[];
    canonicalIdentities: Set<string> | null;
    showJSON: boolean;
    storageError: boolean;
    githubToken: string;
    rememberGithubToken: boolean;
    isSubmittingContribution: boolean;
    contributionError: string;
    contributionPullRequestUrl: string;
}
