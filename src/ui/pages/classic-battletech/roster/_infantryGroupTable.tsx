import * as React from 'react';
import { FaTrash } from 'react-icons/fa';
import InfantryPlatoon from '../../../../classes/infantry-platoon';
import { IAppGlobals } from '../../../app-router';
import StatBar from '../../../components/stat-bar';
const Trash = FaTrash as any;

/**
 * The conventional infantry in a Classic BattleTech roster group: add saved platoons from the Infantry Creator,
 * set their Gunnery and Anti-'Mech skills, and see their strength at a glance.
 */
export default class InfantryGroupTable extends React.Component<IInfantryGroupTableProps, IInfantryGroupTableState> {

    constructor(props: IInfantryGroupTableProps) {
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

    addPlatoon = (e: React.FormEvent<HTMLButtonElement>): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const save = this.props.appGlobals.infantrySaves[this.state.addIndex];
        const force = this.props.appGlobals.currentCBTForce;
        if( save && force && force.groups[this.props.bmGroupIndex] ) {
            const platoon = new InfantryPlatoon( JSON.stringify(save) );
            platoon.newUUID();
            platoon.resetInPlay();
            force.groups[this.props.bmGroupIndex].infantry.push( platoon );
            this._save();
            this.setState({ addIndex: -1 });
        }
    }

    removePlatoon = (e: React.FormEvent<HTMLButtonElement>, platoon: InfantryPlatoon, index: number): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to remove '" + platoon.getDisplayName() + "' from this group?",
            "Yes",
            "No, thank you",
            () => {
                const force = this.props.appGlobals.currentCBTForce;
                if( force ) {
                    force.groups[this.props.bmGroupIndex].infantry.splice(index, 1);
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
        const platoons = force.groups[this.props.bmGroupIndex].infantry;
        const saves = this.props.appGlobals.infantrySaves;

        if( platoons.length === 0 && !this.props.showAdd ) {
            return null;
        }

        return (
            <table className="table">
                <thead>
                    <tr>
                        {this.props.showEdit ? <th className="min-width no-wrap"></th> : null}
                        <th>Infantry</th>
                        <th>Troopers</th>
                        <th>Tech</th>
                        <th className="min-width no-wrap text-center">Anti-'Mech</th>
                        <th className="min-width no-wrap text-center">Gunnery</th>
                        <th className="min-width no-wrap text-center">Points</th>
                    </tr>
                </thead>
                {platoons.map( (platoon, index) => {
                    const adjustedBV = platoon.getSkillAdjustedBattleValue();
                    const baseBV = platoon.getBattleValue();
                    return (
                        <tbody key={platoon.getUUID()}>
                            <tr>
                                {this.props.showEdit ? (
                                    <td className="min-width no-wrap text-center">
                                        <button
                                            onClick={(e) => this.removePlatoon(e, platoon, index)}
                                            title="Click here to remove this platoon."
                                            className="btn btn-danger btn-sm"
                                        >
                                            <Trash />
                                        </button>
                                    </td>
                                ) : null}
                                <td>
                                    {platoon.getDisplayName()}
                                    <div className='small-text'>{platoon.getMotive().name} conventional infantry, {platoon.getMovementText()}</div>
                                </td>
                                <td className="min-width no-wrap text-center">{platoon.getTroopers()}</td>
                                <td className="min-width no-wrap text-center small-text">{platoon.getTechName()}</td>
                                <td className="min-width no-wrap text-center">
                                    {this.props.showEdit && platoon.hasAntiMechKit() ? (
                                        <SkillSelect label="Infantry Anti-'Mech skill" value={platoon.getAntiMechSkill()} onChange={(value) => { platoon.setAntiMechSkill(value); this._save(); }} />
                                    ) : platoon.canMakeAntiMechAttacks() ? platoon.getAntiMechSkill() : "-"}
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {this.props.showEdit ? (
                                        <SkillSelect label="Infantry gunnery skill" value={platoon.getGunnery()} onChange={(value) => { platoon.setGunnery(value); this._save(); }} />
                                    ) : platoon.getGunnery()}
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {adjustedBV}
                                    {adjustedBV !== baseBV ? <div className='small-text'>Base: {baseBV}</div> : null}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={this.props.showEdit ? 7 : 6}>
                                    {platoon.isDestroyed() ? (
                                        <div className="text-center color-bright-red"><strong>This Platoon is Destroyed</strong></div>
                                    ) : platoon.isDamaged() ? (
                                        <div className="text-center color-bright-red"><strong>This Platoon is Under Strength</strong></div>
                                    ) : <div className="text-center">This Platoon is at Full Strength</div>}
                                    <div className="bars">
                                        <StatBar
                                            color="white"
                                            background="#aaa"
                                            currentPercentage={platoon.getStrengthPercentage()}
                                            currentNumber={platoon.getCurrentTroopers()}
                                            height={8}
                                            title="Troopers Remaining"
                                        />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    )
                })}
                {this.props.showAdd ? (
                    <tfoot>
                        <tr>
                            <td colSpan={this.props.showEdit ? 7 : 6}>
                                {saves.length > 0 ? (
                                    <>
                                        <select
                                            aria-label="Saved infantry platoon to add"
                                            value={this.state.addIndex}
                                            onChange={(e) => this.setState({ addIndex: +e.currentTarget.value })}
                                        >
                                            <option value={-1}>Select a saved infantry platoon...</option>
                                            {saves.map( (save, saveIndex) => (
                                                <option key={saveIndex} value={saveIndex}>
                                                    {save.name || "Unnamed Platoon"} ({save.squadSize * save.squads} troopers)
                                                </option>
                                            ))}
                                        </select>{" "}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            disabled={this.state.addIndex < 0}
                                            onClick={this.addPlatoon}
                                            title="Add the selected infantry platoon to this group"
                                        >
                                            Add Infantry
                                        </button>
                                    </>
                                ) : (
                                    <span className="small-text">Save platoons in the Infantry Creator to add them to this group.</span>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                ) : null}
            </table>
        )
    }
}

const SkillSelect = (props: { label: string; value: number; onChange: (value: number) => void }) => (
    <select aria-label={props.label} value={props.value} onChange={(e) => props.onChange(+e.currentTarget.value)}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map( (skill) => <option key={skill} value={skill}>{skill}</option> )}
    </select>
);

interface IInfantryGroupTableProps {
    appGlobals: IAppGlobals;
    bmGroupIndex: number;
    showAdd: boolean;
    showEdit: boolean;
}

interface IInfantryGroupTableState {
    addIndex: number;
}
