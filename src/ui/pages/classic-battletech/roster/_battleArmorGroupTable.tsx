import * as React from 'react';
import { FaTrash } from 'react-icons/fa';
import BattleArmor from '../../../../classes/battle-armor';
import { IAppGlobals } from '../../../app-router';
import StatBar from '../../../components/stat-bar';
const Trash = FaTrash as any;

/**
 * The battle armor in a Classic BattleTech roster group: add saved suits from the Battle Armor Creator as squads,
 * pick the loadout each is fielded in, set Gunnery and Anti-'Mech skills, and see their strength at a glance.
 */
export default class BattleArmorGroupTable extends React.Component<IBattleArmorGroupTableProps, IBattleArmorGroupTableState> {

    constructor(props: IBattleArmorGroupTableProps) {
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

    addSquad = (e: React.FormEvent<HTMLButtonElement>): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const save = this.props.appGlobals.battleArmorSaves[this.state.addIndex];
        const force = this.props.appGlobals.currentCBTForce;
        if( save && force && force.groups[this.props.bmGroupIndex] ) {
            const squad = new BattleArmor( JSON.stringify(save) );
            squad.newUUID();
            squad.resetInPlay();
            force.groups[this.props.bmGroupIndex].battleArmor.push( squad );
            this._save();
            this.setState({ addIndex: -1 });
        }
    }

    removeSquad = (e: React.FormEvent<HTMLButtonElement>, squad: BattleArmor, index: number): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to remove '" + squad.getDisplayName() + "' from this group?",
            "Yes",
            "No, thank you",
            () => {
                const force = this.props.appGlobals.currentCBTForce;
                if( force ) {
                    force.groups[this.props.bmGroupIndex].battleArmor.splice(index, 1);
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
        const squads = force.groups[this.props.bmGroupIndex].battleArmor;
        const saves = this.props.appGlobals.battleArmorSaves || [];

        if( squads.length === 0 && !this.props.showAdd ) {
            return null;
        }

        return (
            <table className="table" data-testid="battle-armor-group-table">
                <thead>
                    <tr>
                        {this.props.showEdit ? <th className="min-width no-wrap"></th> : null}
                        <th>Battle Armor</th>
                        <th>Troopers</th>
                        <th>Tech</th>
                        <th className="min-width no-wrap text-center">Anti-'Mech</th>
                        <th className="min-width no-wrap text-center">Gunnery</th>
                        <th className="min-width no-wrap text-center">Points</th>
                    </tr>
                </thead>
                {squads.map( (squad, index) => {
                    const adjustedBV = squad.getSkillAdjustedBattleValue();
                    const baseBV = squad.getBattleValue();
                    const capabilities = squad.getCapabilities();
                    const loadouts = squad.getLoadouts();
                    return (
                        <tbody key={squad.getUUID()}>
                            <tr>
                                {this.props.showEdit ? (
                                    <td className="min-width no-wrap text-center">
                                        <button
                                            onClick={(e) => this.removeSquad(e, squad, index)}
                                            title="Click here to remove this squad."
                                            className="btn btn-danger btn-sm"
                                        >
                                            <Trash />
                                        </button>
                                    </td>
                                ) : null}
                                <td>
                                    {squad.getDisplayName()}
                                    <div className='small-text'>{squad.getWeightClass().name} battle armor, {squad.getMovementText()}</div>
                                    {this.props.showEdit && loadouts.length > 0 ? (
                                        <label className='small-text'>
                                            Loadout:{" "}
                                            <select
                                                aria-label="Battle armor loadout"
                                                value={squad.getActiveLoadout()}
                                                onChange={(e) => { squad.setActiveLoadout(+e.currentTarget.value); this._save(); }}
                                            >
                                                <option value={-1}>Base design</option>
                                                {loadouts.map( (loadout, loadoutIndex) => <option key={loadoutIndex} value={loadoutIndex}>{loadout.name}</option> )}
                                            </select>
                                        </label>
                                    ) : null}
                                </td>
                                <td className="min-width no-wrap text-center">{squad.getSquadSize()}</td>
                                <td className="min-width no-wrap text-center small-text">{squad.getTechName()}</td>
                                <td className="min-width no-wrap text-center">
                                    {!capabilities.swarm && !capabilities.leg ? "-" : this.props.showEdit ? (
                                        <SkillSelect label="Battle armor Anti-'Mech skill" value={squad.getAntiMechSkill()} onChange={(value) => { squad.setAntiMechSkill(value); this._save(); }} />
                                    ) : squad.getAntiMechSkill()}
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {this.props.showEdit ? (
                                        <SkillSelect label="Battle armor gunnery skill" value={squad.getGunnery()} onChange={(value) => { squad.setGunnery(value); this._save(); }} />
                                    ) : squad.getGunnery()}
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {adjustedBV}
                                    {adjustedBV !== baseBV ? <div className='small-text'>Base: {baseBV}</div> : null}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={this.props.showEdit ? 7 : 6}>
                                    {squad.isDestroyed() ? (
                                        <div className="text-center color-bright-red"><strong>This Squad is Destroyed</strong></div>
                                    ) : squad.isDamaged() ? (
                                        <div className="text-center color-bright-red"><strong>This Squad is Damaged</strong></div>
                                    ) : <div className="text-center">This Squad is at Full Strength</div>}
                                    <div className="bars">
                                        <StatBar
                                            color="white"
                                            background="#aaa"
                                            currentPercentage={squad.getStrengthPercentage()}
                                            currentNumber={squad.getActiveTroopers()}
                                            height={8}
                                            title="Troopers Active"
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
                                            aria-label="Saved battle armor to add"
                                            value={this.state.addIndex}
                                            onChange={(e) => this.setState({ addIndex: +e.currentTarget.value })}
                                        >
                                            <option value={-1}>Select a saved battle armor design...</option>
                                            {saves.map( (save, saveIndex) => (
                                                <option key={saveIndex} value={saveIndex}>
                                                    {save.name || "Unnamed Battle Armor"} ({save.squadSize} troopers)
                                                </option>
                                            ))}
                                        </select>{" "}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            disabled={this.state.addIndex < 0}
                                            onClick={this.addSquad}
                                            title="Add the selected battle armor to this group"
                                        >
                                            Add Battle Armor
                                        </button>
                                    </>
                                ) : (
                                    <span className="small-text">Save suits in the Battle Armor Creator to add them to this group.</span>
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

interface IBattleArmorGroupTableProps {
    appGlobals: IAppGlobals;
    bmGroupIndex: number;
    showAdd: boolean;
    showEdit: boolean;
}

interface IBattleArmorGroupTableState {
    addIndex: number;
}
