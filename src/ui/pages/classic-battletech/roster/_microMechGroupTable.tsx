import * as React from 'react';
import { FaTrash } from 'react-icons/fa';
import MicroMech from '../../../../classes/micro-mech';
import { IAppGlobals } from '../../../app-router';
import { formatBattleValue } from '../../../../data/battle-value';
const Trash = FaTrash as any;

/**
 * The Micro-Mechs (fan-made, Custom Homebrew) in a Classic BattleTech roster group: add saved designs from the
 * Micro-Mech Creator. They are not on the Master Unit List, so there is no search button. The Battle Value is the
 * design's own (provisional) times the 'Mech skill multiplier for the pilot's Gunnery and Piloting.
 */
export default class MicroMechGroupTable extends React.Component<IMicroMechGroupTableProps, IMicroMechGroupTableState> {

    constructor(props: IMicroMechGroupTableProps) {
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

    addMicroMech = (e: React.FormEvent<HTMLButtonElement>): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const save = this.props.appGlobals.microMechSaves[this.state.addIndex];
        const force = this.props.appGlobals.currentCBTForce;
        if( save && force && force.groups[this.props.bmGroupIndex] ) {
            const micro = new MicroMech( JSON.stringify(save) );
            micro.newUUID();
            force.groups[this.props.bmGroupIndex].microMechs.push( micro );
            this._save();
            this.setState({ addIndex: -1 });
        }
    }

    removeMicroMech = (e: React.FormEvent<HTMLButtonElement>, micro: MicroMech, index: number): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to remove '" + micro.getDisplayName() + "' from this group?",
            "Yes",
            "No, thank you",
            () => {
                const force = this.props.appGlobals.currentCBTForce;
                if( force ) {
                    force.groups[this.props.bmGroupIndex].microMechs.splice(index, 1);
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
        const micros = force.groups[this.props.bmGroupIndex].microMechs;
        const saves = this.props.appGlobals.microMechSaves || [];

        // Nothing to add and nothing held: stay out of the way below Custom Homebrew.
        if( micros.length === 0 && ( !this.props.showAdd || saves.length === 0 ) ) {
            return null;
        }

        return (
            <table className="table" data-testid="micro-mech-group-table">
                <thead>
                    <tr>
                        {this.props.showEdit ? <th className="min-width no-wrap"><span className="visually-hidden">Actions</span></th> : null}
                        <th>Micro-Mech (fan-made, NOT OFFICIAL)</th>
                        <th className="min-width no-wrap text-center">Tons</th>
                        <th className="min-width no-wrap text-center">Move</th>
                        <th className="min-width no-wrap text-center">Gunnery</th>
                        <th className="min-width no-wrap text-center">Piloting</th>
                        <th className="min-width no-wrap text-center">BV</th>
                    </tr>
                </thead>
                <tbody>
                    {micros.map( (micro, index) => {
                        const edition = this.props.appGlobals.currentCBTForce?.rulesEdition;
                        const adjustedBV = formatBattleValue((each) => micro.getSkillAdjustedBattleValue(each), "mech", edition);
                        const baseBV = formatBattleValue((each) => micro.getBattleValue(each), "mech", edition);
                        const skill = (label: string, value: number, set: (skill: number) => void) => this.props.showEdit ? (
                            <select aria-label={`Micro-Mech ${label} skill`} value={value} onChange={(e) => { set(+e.currentTarget.value); this._save(); this.forceUpdate(); }}>
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map( (each) => <option key={each} value={each}>{each}</option> )}
                            </select>
                        ) : value;
                        return (
                        <tr key={micro.getUUID()}>
                            {this.props.showEdit ? (
                                <td className="min-width no-wrap text-center">
                                    <button
                                        onClick={(e) => this.removeMicroMech(e, micro, index)}
                                        title="Click here to remove this Micro-Mech."
                                        className="btn btn-danger btn-sm"
                                    >
                                        <Trash />
                                    </button>
                                </td>
                            ) : null}
                            <td>
                                {micro.getDisplayName()}
                                <div className='small-text'>{micro.isQuad() ? "Quad" : "Biped"} Micro-Mech, {micro.getRules().name}{micro.isLegal() ? "" : "; not legal yet"}</div>
                            </td>
                            <td className="min-width no-wrap text-center">{micro.getTons()}</td>
                            <td className="min-width no-wrap text-center">{micro.getWalkMP()}/{micro.getRunMP()}{micro.getJumpMP() > 0 ? `/${micro.getJumpMP()}` : ""}</td>
                            <td className="min-width no-wrap text-center">{skill("gunnery", micro.getGunnery(), (value) => micro.setGunnery(value))}</td>
                            <td className="min-width no-wrap text-center">{skill("piloting", micro.getPiloting(), (value) => micro.setPiloting(value))}</td>
                            <td className="min-width no-wrap text-center">
                                {adjustedBV}
                                {adjustedBV !== baseBV ? <div className='small-text'>Base: {baseBV}</div> : null}
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
                                            aria-label="Saved Micro-Mech to add"
                                            value={this.state.addIndex}
                                            onChange={(e) => this.setState({ addIndex: +e.currentTarget.value })}
                                        >
                                            <option value={-1}>Select a saved Micro-Mech...</option>
                                            {saves.map( (save, saveIndex) => (
                                                <option key={saveIndex} value={saveIndex}>
                                                    {save.name || "Unnamed Micro-Mech"} ({save.tons} tons)
                                                </option>
                                            ))}
                                        </select>{" "}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            disabled={this.state.addIndex < 0}
                                            onClick={this.addMicroMech}
                                            title="Add the selected Micro-Mech to this group"
                                        >
                                            Add Micro-Mech
                                        </button>
                                    </>
                                ) : (
                                    <span className="small-text">Save designs in the Micro-Mech Creator to add them to this group.</span>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                ) : null}
            </table>
        )
    }
}

interface IMicroMechGroupTableProps {
    appGlobals: IAppGlobals;
    bmGroupIndex: number;
    showAdd: boolean;
    showEdit: boolean;
}

interface IMicroMechGroupTableState {
    addIndex: number;
}
