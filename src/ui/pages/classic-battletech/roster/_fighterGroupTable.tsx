import * as React from 'react';
import { FaTrash } from 'react-icons/fa';
import AerospaceFighter from '../../../../classes/aerospace-fighter';
import Pilot from '../../../../classes/pilot';
import { IAppGlobals } from '../../../app-router';
import StatBar from '../../../components/stat-bar';
const Trash = FaTrash as any;

/**
 * The fighters in a Classic BattleTech roster group: add saved fighters from the Fighter Creator, set the
 * pilot's gunnery and piloting skills, and see damage at a glance.
 */
export default class FighterGroupTable extends React.Component<IFighterGroupTableProps, IFighterGroupTableState> {

    constructor(props: IFighterGroupTableProps) {
        super(props);
        this.state = {
            addFighterIndex: -1,
        }
    }

    private _save = (): void => {
        if( this.props.appGlobals.currentCBTForce ) {
            this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
        }
    }

    addFighter = (e: React.FormEvent<HTMLButtonElement>): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const save = this.props.appGlobals.fighterSaves[this.state.addFighterIndex];
        const force = this.props.appGlobals.currentCBTForce;
        if( save && force && force.groups[this.props.bmGroupIndex] ) {
            const fighter = new AerospaceFighter( JSON.stringify(save) );
            fighter.newUUID();
            fighter.resetInPlay();
            force.groups[this.props.bmGroupIndex].fighters.push( fighter );
            this._save();
            this.setState({ addFighterIndex: -1 });
        }
    }

    removeFighter = (e: React.FormEvent<HTMLButtonElement>, fighter: AerospaceFighter, index: number): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to remove '" + fighterName(fighter) + "' from this group?",
            "Yes",
            "No, thank you",
            () => {
                const force = this.props.appGlobals.currentCBTForce;
                if( force ) {
                    force.groups[this.props.bmGroupIndex].fighters.splice(index, 1);
                    this._save();
                }
            }
        );
    }

    updatePilot = (fighter: AerospaceFighter, field: "name" | "piloting" | "gunnery", value: string): void => {
        const pilot = new Pilot( fighter.getPilot().export() );
        if( field === "name" ) {
            pilot.name = value;
        } else {
            pilot[field] = +value;
        }
        fighter.setPilot( pilot );
        this._save();
    }

    render = (): React.ReactNode => {
        const force = this.props.appGlobals.currentCBTForce;
        if( !force || !force.groups[this.props.bmGroupIndex] ) {
            return null;
        }
        const fighters = force.groups[this.props.bmGroupIndex].fighters;
        const saves = this.props.appGlobals.fighterSaves;

        if( fighters.length === 0 && !this.props.showAdd ) {
            return null;
        }

        return (
            <table className="table">
                <thead>
                    <tr>
                        {this.props.showEdit ? <th className="min-width no-wrap"></th> : null}
                        <th>Fighter</th>
                        <th>Tons</th>
                        <th>Tech</th>
                        <th className="min-width no-wrap text-center">Piloting</th>
                        <th className="min-width no-wrap text-center">Gunnery</th>
                        <th className="min-width no-wrap text-center">Points</th>
                    </tr>
                </thead>
                {fighters.map( (fighter, index) => {
                    const pilot = fighter.getPilot();
                    const pilotBV = fighter.getPilotAdjustedBattleValue();
                    const baseBV = fighter.getBattleValue();
                    return (
                        <tbody key={fighter.getUUID()}>
                            <tr>
                                {this.props.showEdit ? (
                                    <td className="min-width no-wrap text-center">
                                        <button
                                            onClick={(e) => this.removeFighter(e, fighter, index)}
                                            title="Click here to remove this fighter."
                                            className="btn btn-danger btn-sm"
                                        >
                                            <Trash />
                                        </button>
                                    </td>
                                ) : null}
                                <td>
                                    {fighterName(fighter)}
                                    <div className='small-text'>
                                        {fighter.getFighterTypeName()}
                                        {this.props.showEdit ? (
                                            <>
                                                {" "}&ndash; Pilot:{" "}
                                                <input
                                                    type="text"
                                                    aria-label="Fighter pilot name"
                                                    value={pilot.name}
                                                    onChange={(e) => this.updatePilot(fighter, "name", e.currentTarget.value)}
                                                />
                                            </>
                                        ) : pilot.name && pilot.name.trim() ? (
                                            <> &ndash; <strong>Pilot:</strong> {pilot.name}</>
                                        ) : null}
                                    </div>
                                </td>
                                <td className="min-width no-wrap text-center">{fighter.getTonnage()}</td>
                                <td className="min-width no-wrap text-center small-text">{fighter.getTech().name}</td>
                                <td className="min-width no-wrap text-center">
                                    {this.props.showEdit ? (
                                        <SkillSelect label="Fighter piloting skill" value={pilot.piloting} onChange={(value) => this.updatePilot(fighter, "piloting", value)} />
                                    ) : pilot.piloting}
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {this.props.showEdit ? (
                                        <SkillSelect label="Fighter gunnery skill" value={pilot.gunnery} onChange={(value) => this.updatePilot(fighter, "gunnery", value)} />
                                    ) : pilot.gunnery}
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {pilotBV}
                                    {pilotBV !== baseBV ? <div className='small-text'>Base: {baseBV}</div> : null}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={this.props.showEdit ? 7 : 6}>
                                    {fighter.isDestroyed() ? (
                                        <div className="text-center color-bright-red"><strong>This Fighter is Destroyed</strong></div>
                                    ) : fighter.isDamaged() ? (
                                        <div className="text-center color-bright-red"><strong>This Fighter is Damaged</strong></div>
                                    ) : <div className="text-center">This Fighter is Undamaged</div>}
                                    <div className="bars">
                                        <StatBar
                                            color="blue"
                                            background="#aaa"
                                            currentPercentage={fighter.getArmorPercentage()}
                                            currentNumber={fighter.getCurrentArmor()}
                                            height={8}
                                            title="Current Armor Status"
                                        />
                                        <StatBar
                                            color="white"
                                            background="#aaa"
                                            currentPercentage={fighter.getStructurePercentage()}
                                            currentNumber={fighter.getCurrentStructure()}
                                            height={8}
                                            title="Current Structural Integrity"
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
                                            aria-label="Saved fighter to add"
                                            value={this.state.addFighterIndex}
                                            onChange={(e) => this.setState({ addFighterIndex: +e.currentTarget.value })}
                                        >
                                            <option value={-1}>Select a saved fighter...</option>
                                            {saves.map( (save, saveIndex) => (
                                                <option key={saveIndex} value={saveIndex}>
                                                    {`${save.name || ""} ${save.model || ""}`.trim() || "Unnamed Fighter"} ({save.tonnage} t)
                                                </option>
                                            ))}
                                        </select>{" "}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            disabled={this.state.addFighterIndex < 0}
                                            onClick={this.addFighter}
                                            title="Add the selected fighter to this group"
                                        >
                                            Add Fighter
                                        </button>
                                    </>
                                ) : (
                                    <span className="small-text">Save fighters in the Fighter Creator to add them to this group.</span>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                ) : null}
            </table>
        )
    }
}

const SkillSelect = (props: { label: string; value: number; onChange: (value: string) => void }) => (
    <select aria-label={props.label} value={props.value} onChange={(e) => props.onChange(e.currentTarget.value)}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map( (skill) => <option key={skill} value={skill}>{skill}</option> )}
    </select>
);

export const fighterName = (fighter: AerospaceFighter): string => {
    return `${fighter.getName()} ${fighter.getModel()}`.trim() || "Unnamed Fighter";
}

interface IFighterGroupTableProps {
    appGlobals: IAppGlobals;
    bmGroupIndex: number;
    showAdd: boolean;
    showEdit: boolean;
}

interface IFighterGroupTableState {
    addFighterIndex: number;
}
