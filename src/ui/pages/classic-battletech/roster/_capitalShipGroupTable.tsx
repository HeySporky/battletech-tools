import * as React from 'react';
import { FaTrash } from 'react-icons/fa';
import CapitalShip from '../../../../classes/capital-ship';
import Pilot from '../../../../classes/pilot';
import { IAppGlobals } from '../../../app-router';
import StatBar from '../../../components/stat-bar';
const Trash = FaTrash as any;

/**
 * The JumpShips, WarShips and space stations in a Classic BattleTech roster group: add saved vessels from the
 * JumpShip and WarShip Creator, set the crew's gunnery and piloting skills, and see damage at a glance.
 */
export default class CapitalShipGroupTable extends React.Component<ICapitalShipGroupTableProps, ICapitalShipGroupTableState> {

    constructor(props: ICapitalShipGroupTableProps) {
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

    addShip = (e: React.FormEvent<HTMLButtonElement>): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        const save = this.props.appGlobals.capitalShipSaves[this.state.addIndex];
        const force = this.props.appGlobals.currentCBTForce;
        if( save && force && force.groups[this.props.bmGroupIndex] ) {
            const craft = new CapitalShip( JSON.stringify(save) );
            craft.newUUID();
            craft.resetInPlay();
            force.groups[this.props.bmGroupIndex].capitalShips.push( craft );
            this._save();
            this.setState({ addIndex: -1 });
        }
    }

    removeShip = (e: React.FormEvent<HTMLButtonElement>, craft: CapitalShip, index: number): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.props.appGlobals.openConfirmDialog(
            "Deletion Confirmation",
            "Are you sure you want to remove '" + capitalShipName(craft) + "' from this group?",
            "Yes",
            "No, thank you",
            () => {
                const force = this.props.appGlobals.currentCBTForce;
                if( force ) {
                    force.groups[this.props.bmGroupIndex].capitalShips.splice(index, 1);
                    this._save();
                }
            }
        );
    }

    updatePilot = (craft: CapitalShip, field: "name" | "piloting" | "gunnery", value: string): void => {
        const pilot = new Pilot( craft.getPilot().export() );
        if( field === "name" ) {
            pilot.name = value;
        } else {
            pilot[field] = +value;
        }
        craft.setPilot( pilot );
        this._save();
    }

    render = (): React.ReactNode => {
        const force = this.props.appGlobals.currentCBTForce;
        if( !force || !force.groups[this.props.bmGroupIndex] ) {
            return null;
        }
        const crafts = force.groups[this.props.bmGroupIndex].capitalShips;
        const saves = this.props.appGlobals.capitalShipSaves;

        if( crafts.length === 0 && !this.props.showAdd ) {
            return null;
        }

        return (
            <table className="table" data-testid="capital-ship-group-table">
                <thead>
                    <tr>
                        {this.props.showEdit ? <th className="min-width no-wrap"></th> : null}
                        <th>Vessel</th>
                        <th>Tons</th>
                        <th>Tech</th>
                        <th className="min-width no-wrap text-center">Piloting</th>
                        <th className="min-width no-wrap text-center">Gunnery</th>
                        <th className="min-width no-wrap text-center">Points</th>
                    </tr>
                </thead>
                {crafts.map( (craft, index) => {
                    const pilot = craft.getPilot();
                    const pilotBV = craft.getPilotAdjustedBattleValue();
                    const baseBV = craft.getBattleValue();
                    return (
                        <tbody key={craft.getUUID()}>
                            <tr>
                                {this.props.showEdit ? (
                                    <td className="min-width no-wrap text-center">
                                        <button
                                            onClick={(e) => this.removeShip(e, craft, index)}
                                            title="Click here to remove this vessel."
                                            className="btn btn-danger btn-sm"
                                        >
                                            <Trash />
                                        </button>
                                    </td>
                                ) : null}
                                <td>
                                    {capitalShipName(craft)}
                                    <div className='small-text'>
                                        {craft.getShipTypeName()}
                                        {this.props.showEdit ? (
                                            <>
                                                {" "}&ndash; Commander:{" "}
                                                <input
                                                    type="text"
                                                    aria-label="Vessel commander name"
                                                    value={pilot.name}
                                                    onChange={(e) => this.updatePilot(craft, "name", e.currentTarget.value)}
                                                />
                                            </>
                                        ) : pilot.name && pilot.name.trim() ? (
                                            <> &ndash; <strong>Commander:</strong> {pilot.name}</>
                                        ) : null}
                                    </div>
                                </td>
                                <td className="min-width no-wrap text-center">{craft.getTonnage()}</td>
                                <td className="min-width no-wrap text-center small-text">{craft.getTech().name}</td>
                                <td className="min-width no-wrap text-center">
                                    {this.props.showEdit ? (
                                        <SkillSelect label="Vessel piloting skill" value={pilot.piloting} onChange={(value) => this.updatePilot(craft, "piloting", value)} />
                                    ) : pilot.piloting}
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {this.props.showEdit ? (
                                        <SkillSelect label="Vessel gunnery skill" value={pilot.gunnery} onChange={(value) => this.updatePilot(craft, "gunnery", value)} />
                                    ) : pilot.gunnery}
                                </td>
                                <td className="min-width no-wrap text-center">
                                    {pilotBV}
                                    {pilotBV !== baseBV ? <div className='small-text'>Base: {baseBV}</div> : null}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={this.props.showEdit ? 7 : 6}>
                                    {craft.isDestroyed() ? (
                                        <div className="text-center color-bright-red"><strong>This vessel is Destroyed</strong></div>
                                    ) : craft.isDamaged() ? (
                                        <div className="text-center color-bright-red"><strong>This vessel is Damaged</strong></div>
                                    ) : <div className="text-center">This vessel is Undamaged</div>}
                                    <div className="bars">
                                        <StatBar
                                            color="blue"
                                            background="#aaa"
                                            currentPercentage={craft.getArmorPercentage()}
                                            currentNumber={craft.getCurrentArmor()}
                                            height={8}
                                            title="Current Armor Status"
                                        />
                                        <StatBar
                                            color="white"
                                            background="#aaa"
                                            currentPercentage={craft.getStructurePercentage()}
                                            currentNumber={craft.getCurrentStructure()}
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
                                            aria-label="Saved vessel to add"
                                            value={this.state.addIndex}
                                            onChange={(e) => this.setState({ addIndex: +e.currentTarget.value })}
                                        >
                                            <option value={-1}>Select a saved vessel...</option>
                                            {saves.map( (save, saveIndex) => (
                                                <option key={saveIndex} value={saveIndex}>
                                                    {`${save.name || ""} ${save.model || ""}`.trim() || "Unnamed Vessel"} ({save.tonnage} t)
                                                </option>
                                            ))}
                                        </select>{" "}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            disabled={this.state.addIndex < 0}
                                            onClick={this.addShip}
                                            title="Add the selected vessel to this group"
                                        >
                                            Add Vessel
                                        </button>
                                    </>
                                ) : (
                                    <span className="small-text">Save vessels in the JumpShip and WarShip Creator to add them to this group.</span>
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

export const capitalShipName = (craft: CapitalShip): string => {
    return `${craft.getName()} ${craft.getModel()}`.trim() || "Unnamed Vessel";
}

interface ICapitalShipGroupTableProps {
    appGlobals: IAppGlobals;
    bmGroupIndex: number;
    showAdd: boolean;
    showEdit: boolean;
}

interface ICapitalShipGroupTableState {
    addIndex: number;
}
