import React from 'react';
import { MineExplosion } from "react-game-icons";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { CONST_GITHUB_OWNER, CONST_GITHUB_REPO } from '../../configVars';
import { IEquipmentItem } from "../../data/data-interfaces";
import { getEquipmentCatalogById, getEquipmentCatalogDefinitions, getEquipmentCatalogExportName } from '../../data/equipment-registry';
import { getAeroRangeLabel, sortEquipment } from '../../utils';
import { addCommas } from "../../utils/addCommas";
import { exportCleanJSON } from "../../utils/exportCleanJSON";
import { submitEquipmentCatalogContribution } from '../../utils/githubContribution';
import { IAppGlobals } from '../app-router';
import EquipmentEditForm from '../components/equipment-edit-form';
import StandardModal from '../components/standard-modal';
import UIPage from '../components/ui-page';
import './equipment-editor.scss';
const Edit = FaEdit as any;
const Plus = FaPlus as any;
const Trash = FaTrash as any;

const GITHUB_TOKEN_SESSION_KEY = "equipmentEditorGithubToken";


export default class EquipmentEditor extends React.Component<IEquipmentEditorProps, IEquipmentEditorState> {
    fileDataList = getEquipmentCatalogDefinitions();

    constructor(props: IEquipmentEditorProps) {
        super(props);

        let currentList = this.props.appGlobals.appSettings.equipmentEditorFile;

        let currentListData: IEquipmentItem[] = [];

        if( !currentList || !currentList.trim() ) {
            currentList = "mech-is-equipment-weapons-ballistic"
        }
        currentListData = getEquipmentCatalogById(currentList)
            ?? getEquipmentCatalogById("mech-is-equipment-weapons-ballistic")
            ?? [];

        currentListData = this._normalizeListData(currentListData);

        this.state = {
            isDirty: false,
            updated: false,
            currentList: currentList,
            currentListData: currentListData,
            showJSON: false,
            editItem: null,
            editItemIndex: -1,
            githubToken: sessionStorage.getItem(GITHUB_TOKEN_SESSION_KEY) ?? "",
            rememberGithubToken: sessionStorage.getItem(GITHUB_TOKEN_SESSION_KEY) !== null,
            isSubmittingContribution: false,
            contributionError: "",
            contributionPullRequestUrl: "",
        }

        this.props.appGlobals.makeDocumentTitle("Equipment Editor");
    }

    _normalizeListData = (data: IEquipmentItem[]): IEquipmentItem[] => {
        for(let item of data) {
            if( typeof(item.heatAero) === "undefined") {
                item.heatAero = item.heat;
            }
        }
        return [...data].sort(sortEquipment);
    }

    showJSON = (
        e: React.FormEvent<HTMLButtonElement>
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.setState({
            showJSON: true,
        })
    }

    closeJSON = (
        e: React.FormEvent<HTMLButtonElement>
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.setState({
            showJSON: false,
        })
    }

    selectList = (
        e: React.FormEvent<HTMLSelectElement>,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        if( getEquipmentCatalogById(e.currentTarget.value) ) {

            if( this.state.isDirty ) {
                this.props.appGlobals.openConfirmDialog(
                    "Your data has been changed",
                    "If you change your list, all your work on the older list will be lost - be sure to make sure you've saved your changed into the appropriate JSON file!",
                    "Proceed",
                    "Cancel",
                    () => {
                        let currentListData: IEquipmentItem[] = getEquipmentCatalogById(e.currentTarget.value) ?? [];

                        currentListData = this._normalizeListData(currentListData);

                        this.setState({
                            currentList: e.currentTarget.value,
                            currentListData: currentListData,
                            isDirty: false,
                        });

                        let appSettings = this.props.appGlobals.appSettings;

                        appSettings.equipmentEditorFile = e.currentTarget.value;
                        this.props.appGlobals.saveAppSettings( appSettings );
                    }
                )
            } else {
                let currentListData: IEquipmentItem[] = getEquipmentCatalogById(e.currentTarget.value) ?? [];

                currentListData = this._normalizeListData(currentListData);

                this.setState({
                    currentList: e.currentTarget.value,
                    currentListData: currentListData,
                });

                let appSettings = this.props.appGlobals.appSettings;

                appSettings.equipmentEditorFile = e.currentTarget.value;
                this.props.appGlobals.saveAppSettings( appSettings );
            }

        }

    }

    _getFileVariable = ( fileN: string): string  => {
        return getEquipmentCatalogExportName(fileN) ?? "unknown";
    }

    _makeJSONText = (): string => {
        let rv = `import { IEquipmentItem } from "./data-interfaces";

/*
* The data here is/may be copyrighted and NOT included in the GPLv3 license.
*/
`

        rv += "export const " + this._getFileVariable( this.state.currentList) + ": IEquipmentItem[] = ";

        rv += exportCleanJSON(
            this.state.currentListData,
        )

        return rv;
    }

    closeEditItem = (
        e: React.FormEvent<HTMLButtonElement>,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.setState({
            editItem: null,
            editItemIndex: -1,
        })
    }

    editItemOnChange = ( newValue: IEquipmentItem): void => {
        this.setState({
            editItem: newValue,
        })
    }

    _getCategoryName = (): string => {
        if( this.state.currentList.toLocaleLowerCase().indexOf("-energy") > -1) {
            return "Energy Weapons"
        } else if( this.state.currentList.toLocaleLowerCase().indexOf("-ballistic") > -1) {
            return "Ballistic Weapons"
        } else if( this.state.currentList.toLocaleLowerCase().indexOf("-misc") > -1) {
            return "Miscellaneous Equipment"
        } else if( this.state.currentList.toLocaleLowerCase().indexOf("-missiles") > -1) {
            return "Missile Weapons"
        }

        return "????";
    }

    _getTechnologyName = (): string => {
        return this.state.currentList.indexOf("-is-") > -1 ? "Inner Sphere" : "Clan"
    }

    editItem = (
        e: React.FormEvent<HTMLButtonElement>,
        item: IEquipmentItem,
        itemIndex: number,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.setState({
            editItem: JSON.parse(JSON.stringify(item)),
            editItemIndex: itemIndex,
        })
    }

    addItem = (
        e: React.FormEvent<HTMLButtonElement>,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        let item: IEquipmentItem = {
            uuid: "",
            notes: "",
            count: 0,
            name: "",
            alternateName: "",
            tag: "",
            sort: "",
            category: "",
            damage: 0,
            damagePerShot: false,
            damageAero: 0,
            heatAero: 0,
            heatPerShot: false,
            damagePerCluster: 0,
            damageClusters: 0,
            accuracyModifier: 0,

            accuracyModifiier: 0,
            cbills: 0,
            cbillsOneShot: 0,
            introduced: 0,
            extinct: 0,
            reintroduced: 0,
            battleValue: 0,
            battleValueOneShot: 0,
            heat: 0,
            weight: 0,
            range: {
                min: 0,
                short: 0,
                medium: 0,
                long: 0,
                extreme: 0,
            },
            space: {
                battlemech: 0,
                protomech: 0,
                combatVehicle: 0,
                supportVehicle: 0,
                aerospaceFighter: 0,
                smallCraft: 0,
                dropShip: 0,
            },
            ammoPerTon: 0,
            minAmmoTons: 0,
            explosive: false,
            gauss: false,
            weaponType: [],
            techRating: "",
            unique: false,
            book: "TM",
            page: 0,
            alphaStrike: {
                heat: 0,
                rangeShort: 0,
                rangeMedium: 0,
                rangeLong: 0,
                rangeExtreme: 0,
                tc: false,
                notes: [],
            },
            battleValuePerItemDamage: 0,
            requiresHandActuator: false,

            weightDivisor: 0,
            damageDivisor: 0,
            criticalsDivisor: 0,

            variableSize: false,
            isMelee: false,
            costPerItemTon: 0,
            location: "",
            rear: false,
            criticals: 0,
            available: false,
        }

        this.setState({
            editItem: item,
            editItemIndex: -1,
        })
    }

    saveItem = () => {
        let currentListData = [...this.state.currentListData];
        if( this.state.editItem !== null ) {
            if( this.state.editItemIndex > - 1 ) {
                if( this.state.editItemIndex < currentListData.length ) {
                    currentListData[this.state.editItemIndex] = this.state.editItem;
                }
            } else {
                currentListData.push( this.state.editItem );
            }

            this.setState({
                currentListData: currentListData.sort(sortEquipment),
                editItem: null,
                isDirty: true,
                editItemIndex: -1,
            })
        }
    }

    saveItemAsNew = () => {
        let currentListData = [...this.state.currentListData];
        if( this.state.editItem !== null ) {

            currentListData.push( this.state.editItem );

            this.setState({
                currentListData: currentListData.sort(sortEquipment),
                editItem: null,
                isDirty: true,
                editItemIndex: -1,
            })
        }
    }

    deleteItem = (
        e: React.FormEvent<HTMLButtonElement>,
        item: IEquipmentItem,
        itemIndex: number,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.props.appGlobals.openConfirmDialog(
            "Delete this equipment entry?",
            `Are you sure you want to remove "${item.name || item.tag}" from this list? This only affects your local editing session until you export or submit your changes.`,
            "Delete",
            "Cancel",
            () => {
                this.setState({
                    currentListData: this.state.currentListData.filter( (_, index) => index !== itemIndex ),
                    isDirty: true,
                })
            }
        )
    }

    downloadTSFile = (
        e: React.FormEvent<HTMLButtonElement>,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const blob = new Blob([this._makeJSONText()], { type: "text/typescript" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${this.state.currentList}.ts`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    updateGithubToken = (
        e: React.FormEvent<HTMLInputElement>,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const token = e.currentTarget.value;
        this.setState({ githubToken: token });
        if( this.state.rememberGithubToken ) {
            sessionStorage.setItem(GITHUB_TOKEN_SESSION_KEY, token);
        }
    }

    toggleRememberGithubToken = (
        e: React.FormEvent<HTMLInputElement>,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const remember = e.currentTarget.checked;
        this.setState({ rememberGithubToken: remember });
        if( remember ) {
            sessionStorage.setItem(GITHUB_TOKEN_SESSION_KEY, this.state.githubToken);
        } else {
            sessionStorage.removeItem(GITHUB_TOKEN_SESSION_KEY);
        }
    }

    submitGithubContribution = async (
        e: React.FormEvent<HTMLButtonElement>,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.setState({
            isSubmittingContribution: true,
            contributionError: "",
            contributionPullRequestUrl: "",
        })

        try {
            const filePath = `src/data/${this.state.currentList}.ts`;
            const result = await submitEquipmentCatalogContribution({
                token: this.state.githubToken,
                upstreamOwner: CONST_GITHUB_OWNER,
                upstreamRepo: CONST_GITHUB_REPO,
                filePath,
                fileContents: this._makeJSONText(),
                commitMessage: `Update ${this.state.currentList}.ts via Equipment Editor`,
                pullRequestTitle: `Equipment Editor contribution: ${this.state.currentList}`,
                pullRequestBody: "Submitted from the in-app Equipment Editor. This data is user-supplied and unverified - please review stats, sourcing, and licensing before merging.",
            });

            this.setState({
                isSubmittingContribution: false,
                contributionPullRequestUrl: result.pullRequestUrl,
            })
        } catch (error) {
            this.setState({
                isSubmittingContribution: false,
                contributionError: error instanceof Error ? error.message : "Unknown error submitting contribution.",
            })
        }
    }

    render = (): JSX.Element => {

      return (
    <UIPage current="equipment-editor" appGlobals={this.props.appGlobals}>
        <div className="alert alert-warning text-center">
            <p className="no-margins"><strong>Developers only!</strong> This area is getting <em>really close</em> for data-entry, but this should never be used by the average user.</p>
        </div>
{this.state.showJSON ? (
    <StandardModal
        show={true}
        className="modal-xl"
        onClose={this.closeJSON}
        title={"JSON Export for file " + this.state.currentList + ".ts"}
    >
        <div className="alert alert-info">
            <strong>Remember</strong>: editing this page won't make the changes permanent. You'll need top copy/paste the contents below into /src/data/{this.state.currentList + ".ts"}
        </div>
        <textarea
            style={{
                width: "100%",
                height: "73vh",
            }}
            spellCheck={false}
            readOnly={true}
            value={this._makeJSONText()}
        />

    </StandardModal>
) : null}

{this.state.editItem ? (
    <StandardModal
        show={true}
        className="modal-xl"
        onClose={this.closeEditItem}
        onSave={this.state.editItemIndex > -1 ? this.saveItem : undefined}
        onAdd={this.state.editItemIndex === -1 ? this.saveItem : undefined}
        onSaveAsNew={this.state.editItemIndex > -1 ? this.saveItemAsNew : undefined}
        title={this.state.editItemIndex > -1 ? "Editing Item" : "Adding Item"}
    >
        <EquipmentEditForm
            editingItem={this.state.editItem}
            onChange={this.editItemOnChange}
            category={this._getCategoryName()}
            techBase={this._getTechnologyName()}
        />
    </StandardModal>
) : null}

<button
    className='btn btn-secondary btn-sm pull-right'
    onClick={this.downloadTSFile}
>
    Download .ts File
</button>
<button
    className='btn btn-primary btn-sm pull-right'
    onClick={this.showJSON}
>
    Show JSON Export
</button>

<div className="alert alert-secondary">
    <p className="no-margins">
        <strong>Contribute your changes</strong>: editing here only affects this browser session.
        Download the file above and open a Pull Request yourself, or submit one directly below using
        your own GitHub personal access token (needs the <code>public_repo</code> scope). The token is
        used only to call GitHub's API directly from your browser - this app has no backend and never
        sees or stores it.
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
    <br />
    <button
        className="btn btn-sm btn-primary"
        disabled={this.state.isSubmittingContribution || !this.state.githubToken.trim()}
        onClick={this.submitGithubContribution}
    >
        {this.state.isSubmittingContribution ? "Submitting…" : "Submit as GitHub Pull Request"}
    </button>
    {this.state.contributionPullRequestUrl ? (
        <div className="alert alert-success">
            Pull request created: <a href={this.state.contributionPullRequestUrl} target="_blank" rel="noopener noreferrer">{this.state.contributionPullRequestUrl}</a>
        </div>
    ) : null}
    {this.state.contributionError ? (
        <div className="alert alert-danger">{this.state.contributionError}</div>
    ) : null}
</div>

<label>
    Select List:&nbsp;
    <select
        value={this.state.currentList}
        onChange={this.selectList}
        className="inline-block width-auto"
    >
        {this.fileDataList.map( (catalog, fileIndex) => {
            return (
                <option key={fileIndex} value={catalog.id}>{catalog.id}.ts</option>
            )
        })}
    </select>
</label>
<table className="table">
    <thead>
        <tr>
            <th colSpan={10} className="text-center">
                {this._getTechnologyName()} {this._getCategoryName()}
            </th>
        </tr>
        <tr>
            <th>
                Name
                <div className="small-text">tag (sorting)</div>
            </th>
            <th className="min-width text-center no-wrap">
                Damage (Aero)<br />
                <div className="small-text">Or Shots per ton</div>
            </th>
            <th className="min-width text-center no-wrap">
                Range (Aero)
                <div className="small-text">or Min Ammo Tons</div>
            </th>
            <th className="min-width text-center no-wrap">BM Crits</th>
            <th className="min-width text-center no-wrap">Mass</th>

            <th className="min-width text-center no-wrap">Heat</th>
            <th className="min-width text-center no-wrap">BV</th>
            <th className="min-width text-center no-wrap">CBills</th>
            <th className="min-width text-center no-wrap">Explosive</th>

            <th className="min-width text-center no-wrap">Active</th>

            <th
                className="min-width text-right no-wrap"
            >
                <button
                    className="btn btn-sm btn-primary"
                    onClick={this.addItem}
                >
                    <Plus />&nbsp;Add
                </button>
            </th>
        </tr>
    </thead>
{this.state.currentListData.map( (
    item: IEquipmentItem,
    itemIndex: number,
) => {
    return (
        <tbody key={itemIndex}>
            <tr>
                <td>
                    {item.name}<br />
                    <div className="small-text">{item.tag}</div>
                </td>
                <td className="text-center no-wrap">
                    {item.isAmmo ? (
                        <>
                            {item.ammoPerTon} shots / ton
                        </>
                    ) : (
                        <>
{item.damageDivisor && item.damageDivisor > 0 ? (
                        <>
                            <>Mass ÷ {item.damageDivisor}<br /></>
                        </>
                    ) : (
                        <>
                        {item.damageClusters ? (
                            <>
                                Clusters: {item.damageClusters}<br />
                                Damage Per: {item.damagePerCluster}<br />
                            </>
                        ) : (
                            <>
                                {typeof(item.damage) === "number" ? (
                                    <>
                                        {item.damage}
                                        {item.damagePerShot ? (
                                            <>/shot</>
                                        ) : null}
                                    </>
                                ) : (
                                    <>{item.damage?.short} / {item.damage?.medium} / {item.damage?.long} </>
                                )}
                            </>
                        )}
                        &nbsp;<span title="Aero damage">({item.damageAero})</span>
                        </>
                    )
                    }
                        </>
                    )}

                </td>
                <td className="text-center no-wrap">
                {item.isAmmo ? (
                        <>
                        min tons: {item.minAmmoTons}
                        </>
                    ) : (
                        <>
                    {item.isMelee ? (
                        <>Melee</>
                    ) : (
                        <>
                        {item.range.short} / {item.range.medium} / {item.range.long}
                        &nbsp;<span title="Aero range">({item.rangeAero ? getAeroRangeLabel(item.rangeAero) : <span className="color-red">N/E</span>})</span>
                        </>
                    )}
</>
                    )}
                </td>
                <td className="text-center no-wrap">

                {item.criticalsDivisor && item.criticalsDivisor > 1 ? (
                        <>Mass ÷ {item.criticalsDivisor}<br /></>
                    ) : (
                        <>{item.space.battlemech}<br /></>
                    )}

                </td>
                <td className="text-center no-wrap ">
                    {item.weightDivisor && item.weightDivisor > 1 ? (
                        <>Mass ÷ {item.weightDivisor}<br /></>
                    ) : (
                        <>{item.weight}<br /></>
                    )}

                </td>

                <td className="text-center no-wrap ">
                    {item.heat}
                    {item.heatPerShot ? (
                        <>/shot</>
                    ) : null}
                    <br />
                </td>
                <td className="text-center no-wrap ">
                    {item.battleValue}
                    {item.battleValueDefensive ? (
                        <sup title="Battle Value is Calculated as Defensive">D</sup>
                    ) : null}
                    <br />
                </td>

                <td className="text-center no-wrap ">
                    {addCommas(item.cbills)}<br />
                </td>

                <td className="text-center no-wrap ">
                    <div className="text-center explosive-tag">
                    {item.explosive ? (
                        <MineExplosion />
                    ) : null}
                    </div>
                </td>
                <td className="text-center no-wrap ">
                    {item.introduced ?? "?"}-{item.extinct && item.extinct > 0 ? item.extinct : "current"}<br />
                    {item.reintroduced && item.reintroduced > 0 ? (
                        <div className="small-text">Reintroduced: {item.reintroduced}</div>
                    ): null}
                </td>

                <td className="text-center no-wrap">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => this.editItem( e, item, itemIndex)}
                    >
                        <Edit />
                    </button>
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={(e) => this.deleteItem( e, item, itemIndex)}
                    >
                        <Trash />
                    </button>
                </td>
            </tr>
        </tbody>
    )
})}

</table>
    </UIPage>
      );
    }
}

interface IEquipmentEditorProps {
  appGlobals: IAppGlobals;
}

interface IEquipmentEditorState {
    isDirty: boolean;
    updated: boolean;
    currentList: string;
    currentListData: IEquipmentItem[]
    showJSON: boolean;
    editItem: IEquipmentItem | null;
    editItemIndex: number;
    githubToken: string;
    rememberGithubToken: boolean;
    isSubmittingContribution: boolean;
    contributionError: string;
    contributionPullRequestUrl: string;
}
