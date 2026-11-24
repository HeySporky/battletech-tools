import * as React from 'react';
import { FaTrash } from 'react-icons/fa';
import Walker from '../../../../classes/walker';
import { IAppGlobals } from '../../../app-router';
import { formatBattleValue } from '../../../../data/battle-value';
const Trash = FaTrash as any;

/**
 * The Walkers (fan-made four-legged 'Mechs, Custom Homebrew) in a Classic BattleTech roster group: add saved designs
 * from the Walker Creator. They are not on the Master Unit List, so there is no search button. The pilot's skills
 * adjust the provisional Battle Value on the 'Mech skill table (NGCFells's), with the design's own shown as the base.
 */
export default class WalkerGroupTable extends React.Component<IWalkerGroupTableProps, IWalkerGroupTableState> {

    constructor(props: IWalkerGroupTableProps) {
        super(props);
        this.state = {
            addIndex: -1,
        }
    }

    private _save = (): void => {
        if( this.props.appGlobals.currentCBTForce ) {
            this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
        }
    }

    addWalker = (e: React.FormEvent<HTMLButtonElement>): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const save = this.props.appGlobals.walkerSaves[this.state.addIndex];
        const force = this.props.appGlobals.currentCBTForce;
        if( save && force && force.groups[this.props.bmGroupIndex] ) {
            const walker = new Walker( JSON.stringify(save) );
            walker.newUUID();
            force.groups[this.props.bmGroupIndex].walkers.push( walker );
            this._save();
            this.setState({ addIndex: -1 });
        }
    }

    removeWalker = (e: React.FormEvent<HTMLButtonElement>, walker: Walker, index: number): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to remove '" + walker.getDisplayName() + "' from this group?",
            "Yes",
            "No, thank you",
            () => {
                const force = this.props.appGlobals.currentCBTForce;
                if( force ) {
                    force.groups[this.props.bmGroupIndex].walkers.splice(index, 1);
                    this._save();
                }
            }
        );
    }

    render = (): React.ReactNode => {
        const force = this.props.appGlobals.currentCBTForce;
        if( !force || !force.groups[this.props.bmGroupIndex] ) {
            return null;
        }
        const walkers = force.groups[this.props.bmGroupIndex].walkers;
        const saves = this.props.appGlobals.walkerSaves || [];

        // Nothing to add and nothing held: stay out of the way below Custom Homebrew.
        if( walkers.length === 0 && ( !this.props.showAdd || saves.length === 0 ) ) {
            return null;
        }

        return (
            <table className="table" data-testid="walker-group-table">
                <thead>
                    <tr>
                        {this.props.showEdit ? <th className="min-width no-wrap"><span className="visually-hidden">Actions</span></th> : null}
                        <th>Walker (fan-made, NOT OFFICIAL)</th>
                        <th className="min-width no-wrap text-center">Tons</th>
                        <th className="min-width no-wrap text-center">Move</th>
                        <th className="min-width no-wrap text-center">Gunnery</th>
                        <th className="min-width no-wrap text-center">Piloting</th>
                        <th className="min-width no-wrap text-center">BV</th>
                    </tr>
                </thead>
                <tbody>
                    {walkers.map( (walker, index) => {
                        const adjustedBV = formatBattleValue((each) => walker.getSkillAdjustedBattleValue(each), "walker", force.rulesEdition);
                        const baseBV = formatBattleValue((each) => walker.getBattleValue(each), "walker", force.rulesEdition);
                        const skill = (label: string, value: number, set: (skill: number) => void) => this.props.showEdit ? (
                            <select aria-label={`Walker ${label} skill`} value={value} onChange={(e) => { set(+e.currentTarget.value); this._save(); this.forceUpdate(); }}>
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map( (each) => <option key={each} value={each}>{each}</option> )}
                            </select>
                        ) : value;
                        return (
                        <tr key={walker.getUUID()}>
                            {this.props.showEdit ? (
                                <td className="min-width no-wrap text-center">
                                    <button
                                        onClick={(e) => this.removeWalker(e, walker, index)}
                                        title="Click here to remove this Walker."
                                        className="btn btn-danger btn-sm"
                                    >
                                        <Trash />
                                    </button>
                                </td>
                            ) : null}
                            <td>
                                {walker.getDisplayName()}
                                <div className='small-text'>{walker.isIndustrial() ? "Industrial " : ""}Walker, {walker.getEditionRules().name}{walker.isLegal() ? "" : "; not legal yet"}</div>
                            </td>
                            <td className="min-width no-wrap text-center">{walker.getTons()}</td>
                            <td className="min-width no-wrap text-center">{walker.getWalkerWalkMP()}/{walker.getRunMP()}{walker.getJumpMP() > 0 ? `/${walker.getJumpMP()}` : ""}</td>
                            <td className="min-width no-wrap text-center">{skill("gunnery", walker.getGunnery(), (value) => walker.setGunnery(value))}</td>
                            <td className="min-width no-wrap text-center">{skill("piloting", walker.getPiloting(), (value) => walker.setPiloting(value))}</td>
                            <td className="min-width no-wrap text-center" data-testid={`walker-group-bv-${index}`}>
                                {adjustedBV}
                                <div className='small-text'>{adjustedBV !== baseBV ? `Base: ${baseBV}, ` : ""}provisional</div>
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
                {this.props.showAdd ? (
                    <tfoot>
                        <tr>
                            <td colSpan={this.props.showEdit ? 7 : 6}>
                                {saves.length > 0 ? (
                                    <>
                                        <select
                                            aria-label="Saved Walker to add"
                                            value={this.state.addIndex}
                                            onChange={(e) => this.setState({ addIndex: +e.currentTarget.value })}
                                        >
                                            <option value={-1}>Select a saved Walker...</option>
                                            {saves.map( (save, saveIndex) => (
                                                <option key={saveIndex} value={saveIndex}>
                                                    {save.name || "Unnamed Walker"} ({save.tons} tons)
                                                </option>
                                            ))}
                                        </select>{" "}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            disabled={this.state.addIndex < 0}
                                            onClick={this.addWalker}
                                            title="Add the selected Walker to this group"
                                        >
                                            Add Walker
                                        </button>
                                    </>
                                ) : (
                                    <span className="small-text">Save designs in the Walker Creator to add them to this group.</span>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                ) : null}
            </table>
        )
    }
}

interface IWalkerGroupTableProps {
    appGlobals: IAppGlobals;
    bmGroupIndex: number;
    showAdd: boolean;
    showEdit: boolean;
}

interface IWalkerGroupTableState {
    addIndex: number;
}
