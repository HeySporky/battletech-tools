import * as React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { BattleMech } from '../../../../classes/battlemech';
import { BattleMechGroup } from '../../../../classes/battlemech-group';
import { IAppGlobals } from '../../../app-router';
import InputField from '../../../components/form_elements/input_field';
import MechViewPanel from '../../../components/mech-view-panel';
import StandardModal from '../../../components/standard-modal';
import StatBar from '../../../components/stat-bar';
import BattleMechAddMechDialog from './_addMechDialog';
import VehicleGroupTable, { C3NetworkField } from './_vehicleGroupTable';
import FighterGroupTable from './_fighterGroupTable';
import SmallCraftGroupTable from './_smallCraftGroupTable';
import CapitalShipGroupTable from './_capitalShipGroupTable';
import InfantryGroupTable from './_infantryGroupTable';
import BattleArmorGroupTable from './_battleArmorGroupTable';
import ProtoMechGroupTable from './_protoMechGroupTable';
import MicroMechGroupTable from './_microMechGroupTable';
import WalkerGroupTable from './_walkerGroupTable';
import BattledroidsGroupTable from './_battledroidsGroupTable';
import BuildingGroupTable from './_buildingGroupTable';
import type { JSX } from "react";
import { formatBattleValue } from '../../../../data/battle-value';
import { DEFAULT_RULES_EDITION } from '../../../../data/rules-editions';
const Edit = FaEdit as any;
const Trash = FaTrash as any;

export default class BattleMechTableGroup extends React.Component<IBattleMechTableGroupProps, IBattleMechTableGroupState> {

    constructor(props: IBattleMechTableGroupProps) {
        super(props);
        this.state = {
            viewingUnit: null,
            addingUnitsModal: false,
            addingUnitsGroupIndex: -1,
            editingUnitIndex: -1,
            editingUnit: null,
        }
    }

    viewUnit = (
        e: React.FormEvent<HTMLButtonElement>,
        bm: BattleMech,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.setState({
            viewingUnit: bm,
        })
    }

    closeViewUnit = (
        e: React.FormEvent<HTMLButtonElement> | null,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.setState({
            viewingUnit: null,
        })
    }

    addViewedUnit = (
        e: React.FormEvent<HTMLButtonElement> | null,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        if( this.props.appGlobals.currentCBTForce && this.state.viewingUnit ) {

            const bmGroup = this.props.appGlobals.currentCBTForce.groups[this.props.bmGroupIndex];
            const newBM = new BattleMech( this.state.viewingUnit.exportJSON()  );
            newBM.newUUID();
            bmGroup.members.push (
                newBM
            )
            // this.props.onChange( bmGroup );
            this.setState({
                viewingUnit: null,
            })
        }

    }

    closeAddingUnits = (
        e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault()
      }

      this.setState({
        addingUnitsModal: false,
      })

    }

  onAddUnitsChange = ( nv: BattleMechGroup ): void => {
    if( this.props.appGlobals.currentCBTForce && this.props.appGlobals.currentCBTForce.groups[this.state.addingUnitsGroupIndex] ) {
      const currentCBTForce = this.props.appGlobals.currentCBTForce;
      currentCBTForce.groups[this.state.addingUnitsGroupIndex] = nv;
      this.props.appGlobals.saveCurrentCBTForce( currentCBTForce );

    }

  }

    openAddingUnits = (
        e: React.FormEvent<HTMLButtonElement>,
        addingUnitsGroupIndex: number,
        mulTypeID?: number,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault()
      }
      // The other unit tables open the same search filtered to their own MUL type.
      if( mulTypeID !== undefined ) {
        const appSettings = this.props.appGlobals.appSettings;
        appSettings.cbtMULSearch = { ...appSettings.cbtMULSearch, type: mulTypeID };
        this.props.appGlobals.saveAppSettings( appSettings );
      }

      this.setState({
        addingUnitsModal: true,
        addingUnitsGroupIndex: addingUnitsGroupIndex,
      })

    }

    openEditDialog = (
        e: React.FormEvent<HTMLButtonElement>,
        editUnitIndex: number,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault()
        }

        if( this.props.appGlobals.currentCBTForce ) {
            const currentCBTForce = this.props.appGlobals.currentCBTForce;
            const editUnit = new BattleMech(currentCBTForce.groups[this.props.bmGroupIndex].members[editUnitIndex].exportJSON() );
            this.setState({
                editingUnit: editUnit,
                editingUnitIndex: editUnitIndex,
            })
        } else {
            console.error("Cannot find this.props.appGlobals.currentCBTForce!")
        }

    }

    saveUnit= (
        e: React.FormEvent<HTMLButtonElement>,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault()
        }

        if( this.props.appGlobals.currentCBTForce && this.state.editingUnit) {
            const currentCBTForce = this.props.appGlobals.currentCBTForce;
            const saveUnit = new BattleMech(this.state.editingUnit.exportJSON() );
            currentCBTForce.groups[this.props.bmGroupIndex].members[this.state.editingUnitIndex] = saveUnit;
            this.props.appGlobals.saveCurrentCBTForce( currentCBTForce );
            this.setState({
                editingUnit: null,
                editingUnitIndex: -1,
            })
        } else {
            console.error("Cannot find this.props.appGlobals.currentCBTForce!")
        }
    }

    removeUnit = (
        e: React.FormEvent<HTMLButtonElement>,
        removeUnit: BattleMech,
        removeUnitIndex: number,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault()
      }

      this.props.appGlobals.openConfirmDialog(
          "Deletion Confirmation",
          "Are you sure you want to remove '" + removeUnit.model + "' from this group?",
          "Yes",
          "No, thank you",
          () => {
            if( this.props.appGlobals.currentCBTForce ) {
                const currentCBTForce = this.props.appGlobals.currentCBTForce;
                currentCBTForce.groups[this.props.bmGroupIndex].members.splice(removeUnitIndex, 1);
                this.props.appGlobals.saveCurrentCBTForce( currentCBTForce );
            }
          }
      )

    }

    closeEditDialog = (
        e: React.FormEvent<HTMLButtonElement>,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault()
      }

      this.setState({
        editingUnit: null,
        editingUnitIndex: -1,
      })

    }

    updateNickname = ( event: React.FormEvent<HTMLInputElement>): void => {
        const mech = this.state.editingUnit;
        if( mech ) {
            mech.nickname = event.currentTarget.value;
            this.setState({
                editingUnit: mech,
            })
        }
    }

    setPilotName = ( event: React.FormEvent<HTMLInputElement>): void => {
        const mech = this.state.editingUnit;
        if( mech ) {
            mech.setPilotName( event.currentTarget.value );
            this.setState({
                editingUnit: mech,
            })
        }
    }

      setPilotPiloting = ( event: React.FormEvent<HTMLSelectElement>): void => {

        const mech = this.state.editingUnit;
        if( mech ) {
            mech.setPilotPiloting( +event.currentTarget.value );
            this.setState({
                editingUnit: mech,
            })
        }
      }

      setPilotGunnery = ( event: React.FormEvent<HTMLSelectElement>): void => {

        const mech = this.state.editingUnit;
        if( mech ) {
            mech.setPilotGunnery( +event.currentTarget.value );
            this.setState({
                editingUnit: mech,
            })
        }
      }

      setPilotEIImplants = ( event: React.FormEvent<HTMLInputElement>): void => {
        const mech = this.state.editingUnit;
        if( mech ) {
            mech.setPilotEIImplants( event.currentTarget.checked );
            this.setState({
                editingUnit: mech,
            })
        }
      }

    render = (): JSX.Element => {
        if(!this.props.appGlobals.currentCBTForce) {
            return (<>No BM Force Error</>);
        }
        return(
<>
{this.state.editingUnit ? (
    <StandardModal
        show={true}
        onClose={this.closeEditDialog}
        title={"Editing " + this.state.editingUnit.model}
        onSave={this.saveUnit}
    >
        <div className="small-text">Here you may edit the Mech Nickname, Mechwarrior name, and skills. Skill changes will display both base and adjusted BV.</div>
        <InputField
            label="'Mech Nickname"
            value={this.state.editingUnit.nickname}
            onChange={this.updateNickname}
        />
        <div className="row">
            <div className="col-md-6">
                <fieldset className="fieldset">
                <legend>Mechwarrior Data</legend>
                <div className="row">
                    <div className="col-sm-12">

                    <InputField
                        value={this.state.editingUnit.getPilot().name}
                        onChange={this.setPilotName}
                        label="Handle"
                    />
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-6">
                    <label>
                        Piloting:<br />

                        <select
                        value={this.state.editingUnit.getPilot().piloting}
                        onChange={this.setPilotPiloting}
                        >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                        <option value={6}>6</option>
                        <option value={7}>7</option>
                        <option value={8}>8</option>
                        <option value={9}>9</option>
                        <option value={10}>10</option>
                        </select>
                    </label>
                    </div>
                    <div className="col-sm-6">
                    <label>
                        Gunnery:<br />
                        <select
                        value={this.state.editingUnit.getPilot().gunnery}
                        onChange={this.setPilotGunnery}
                        >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                        <option value={6}>6</option>
                        <option value={7}>7</option>
                        <option value={8}>8</option>
                        <option value={9}>9</option>
                        <option value={10}>10</option>
                        </select>
                    </label>
                    </div>
                </div>
                {this.state.editingUnit.hasEnhancedImaging() || this.state.editingUnit.getPilot().eiImplants ? (
                    <label className="d-block">
                        <input
                            type="checkbox"
                            checked={this.state.editingUnit.getPilot().eiImplants}
                            onChange={this.setPilotEIImplants}
                        />{" "}
                        EI neural implants (with the 'Mech's EI interface: Gunnery and Piloting 1 better for BV, IO:AE p.184)
                    </label>
                ) : null}
                </fieldset>
            </div>
            <div className="col-md-6">
                <fieldset className="fieldset">
                    <legend>Pilot Adjusted BV</legend>
                    <div>
                        <strong>Base BV</strong>: {formatBattleValue((edition) => this.state.editingUnit?.getBattleValue(edition) ?? 0, "mech", this.props.appGlobals.currentCBTForce?.rulesEdition)}
                    </div>
                    <div>
                        <strong>Adjusted BV</strong>: {formatBattleValue((edition) => this.state.editingUnit?.getPilotAdjustedBattleValue(edition) ?? 0, "mech", this.props.appGlobals.currentCBTForce?.rulesEdition)}
                    </div>

                </fieldset>
            </div>
        </div>
    </StandardModal>
) : null}
{this.state.addingUnitsModal && this.props.appGlobals.currentCBTForce ? (
    <StandardModal
        show={true}
        onClose={this.closeAddingUnits}
        className="modal-xl"
        title={this.props.appGlobals.currentCBTForce && this.props.appGlobals.currentCBTForce.groups[this.state.addingUnitsGroupIndex] ? "Adding units to '" + this.props.appGlobals.currentCBTForce.groups[this.state.addingUnitsGroupIndex].getName(this.state.addingUnitsGroupIndex) + "'" : "Adding units to Current Force"}
        >
            <BattleMechAddMechDialog
                appGlobals={this.props.appGlobals}
                currentForce={this.props.appGlobals.currentCBTForce.groups[this.state.addingUnitsGroupIndex]}
                currentForceIndex={this.state.addingUnitsGroupIndex}
                onChange={this.onAddUnitsChange}
            />
        </StandardModal>
): null}


{this.state.viewingUnit ? (
    <StandardModal
        show={true}
        onClose={this.closeViewUnit}
        onAdd={this.addViewedUnit}
        className="modal-xl"
        printable={true}
    >

        <h3 className="text-center">Viewing {this.state.viewingUnit.model}</h3>
        <MechViewPanel mech={this.state.viewingUnit} />
    </StandardModal>
) : (
<>
    <table className="table">
    <thead>
      <tr>
{this.props.showEdit ? (
        <th className="min-width no-wrap">
        {this.props.showAdd ? (
          <button
            className="btn btn-primary btn-sm"
            title="Add 'Mechs, or search the Master Unit List for any unit type"
            onClick={(e) => this.openAddingUnits( e, this.props.bmGroupIndex)}
            >
            Add
            </button>
        ) : null}

        </th>
): null}
        <th>Name</th>
        <th>Tons</th>
        <th>Tech</th>
        <th className="min-width no-wrap text-center">Piloting</th>
        <th className="min-width no-wrap text-center">Gunnery</th>
        <th className="min-width no-wrap text-center">Points</th>

      </tr>
    </thead>

    {this.props.appGlobals.currentCBTForce.groups[this.props.bmGroupIndex].members.length > 0 ? (
      <>
        {this.props.appGlobals.currentCBTForce.groups[this.props.bmGroupIndex].members.map( (mechObj, mechIndex) => {
            const pilotBV2 = formatBattleValue((edition) => mechObj.getPilotAdjustedBattleValue(edition), "mech", this.props.appGlobals.currentCBTForce?.rulesEdition);
            const baseBV2 = formatBattleValue((edition) => mechObj.getBattleValue(edition), "mech", this.props.appGlobals.currentCBTForce?.rulesEdition);

            return (
                <tbody key={mechIndex}>
                <tr>
                {this.props.showEdit ?
                    <td className="min-width no-wrap text-center">
                        <button
                            onClick={(e) => this.openEditDialog(e, mechIndex)}
                            title="Edit the name and pilot of this unit"
                            className="btn btn-primary btn-sm"
                        >
                        <Edit />
                        </button>
                      <button
                        onClick={(e) => this.removeUnit(e, mechObj, mechIndex)}
                        title="Click here to remove this unit."
                        className="btn btn-danger btn-sm"
                      >
                        <Trash />
                      </button>
                    </td>
                    : null}
                    <td>
                        {mechObj.getName()}
                        {mechObj.pilot.name && mechObj.pilot.name.trim() ? (
                            <div className='small-text'>
                                <strong>Pilot:</strong> {mechObj.pilot.name}
                            </div>
                        ) : null}
                        {this.props.appGlobals.currentCBTForce ? (
                            <C3NetworkField force={this.props.appGlobals.currentCBTForce} unit={mechObj} edit={!!this.props.showEdit}
                                onChange={() => this.props.appGlobals.currentCBTForce && this.props.appGlobals.saveCurrentCBTForce(this.props.appGlobals.currentCBTForce)} />
                        ) : null}
                    </td>
                    <td className="min-width no-wrap text-center">{mechObj.getTonnage()}</td>
                    <td className="min-width no-wrap text-center small-text">{mechObj.getTech().name}</td>
                    <td className="min-width no-wrap text-center">{mechObj.pilot.piloting}</td>
                    <td className="min-width no-wrap text-center">{mechObj.pilot.gunnery}</td>
                    <td className="min-width no-wrap text-center">
                        {pilotBV2 !== baseBV2 ? (
                            <>
                                {pilotBV2}
                                <div className='small-text'>Base: {baseBV2}</div>
                            </>
                        ) : (
                            <>{pilotBV2}</>
                        )}
                    </td>

                </tr>
                <tr>
                    <td colSpan={7}>
                        {mechObj.isUnderStrength() ? (
                            <div className="text-center color-bright-red"><strong>This Mech is Damaged</strong></div>
                        ): <div className="text-center">This Mech is Undamaged</div>}
                    <div className="bars">
                        <StatBar
                            color="blue"
                            background="#aaa"
                            currentPercentage={mechObj.getArmorPercentage()}
                            currentNumber={mechObj.getCurrentArmor()}
                            height={8}
                            title="Current Armor Status"
                        />
                        <StatBar
                            color="white"
                            background="#aaa"
                            currentPercentage={mechObj.getStructurePercentage()}
                            currentNumber={mechObj.getCurrentStructure()}
                            height={8}
                            title="Current Internal Structure Status"
                        />
                        <StatBar
                            color="red"
                            background="#aaa"
                            currentPercentage={mechObj.getHeatPercentage()}
                            currentNumber={mechObj.currentHeat}
                            height={8}
                            title={"Current Heat Status: " + mechObj.currentHeat}
                        />
                        </div>
                    </td>
                </tr>

                </tbody>
            )
        })}
      </>
) : (
<tbody><tr><td colSpan={this.props.showEdit ? 7 : 6} className="text-center">No Units</td></tr></tbody>
)}

<tfoot>
<tr>

<td colSpan={1}>
{this.props.appGlobals.currentCBTForce.groups[this.props.bmGroupIndex].getTotalUnits() > 0 ? (
    <>
        {this.props.appGlobals.currentCBTForce.groups[this.props.bmGroupIndex].getTotalUnits() > 1 ? (
            <>{this.props.appGlobals.currentCBTForce.groups[this.props.bmGroupIndex].getTotalUnits()} Units</>
        ) : (
            <>One Unit</>
        )}
    </>
) : (
    <>No Units</>
)}
</td>
<td colSpan={this.props.showEdit ? 4 : 3} className="text-center">
    {this.props.appGlobals.currentCBTForce.groups[this.props.bmGroupIndex].getTotalTons()} Tons - {this.props.appGlobals.currentCBTForce.groups[this.props.bmGroupIndex].getTech()}
</td>
<td colSpan={2} className="text-right">BV: {this.props.appGlobals.currentCBTForce.groups[this.props.bmGroupIndex].getBattleValueText(this.props.appGlobals.currentCBTForce?.rulesEdition ?? DEFAULT_RULES_EDITION, this.props.appGlobals.currentCBTForce.groups, this.props.appGlobals.currentCBTForce.c3Networks)}</td>
</tr>
</tfoot>

</table>
<VehicleGroupTable
    appGlobals={this.props.appGlobals}
    onSearchMUL={(e) => this.openAddingUnits( e, this.props.bmGroupIndex, 19 )}
    bmGroupIndex={this.props.bmGroupIndex}
    showAdd={this.props.showAdd}
    showEdit={this.props.showEdit}
/>
<FighterGroupTable
    appGlobals={this.props.appGlobals}
    onSearchMUL={(e) => this.openAddingUnits( e, this.props.bmGroupIndex, 17 )}
    bmGroupIndex={this.props.bmGroupIndex}
    showAdd={this.props.showAdd}
    showEdit={this.props.showEdit}
/>
<SmallCraftGroupTable
    appGlobals={this.props.appGlobals}
    onSearchMUL={(e) => this.openAddingUnits( e, this.props.bmGroupIndex, 17 )}
    bmGroupIndex={this.props.bmGroupIndex}
    showAdd={this.props.showAdd}
    showEdit={this.props.showEdit}
/>
<CapitalShipGroupTable
    appGlobals={this.props.appGlobals}
    onSearchMUL={(e) => this.openAddingUnits( e, this.props.bmGroupIndex, 17 )}
    bmGroupIndex={this.props.bmGroupIndex}
    showAdd={this.props.showAdd}
    showEdit={this.props.showEdit}
/>
<InfantryGroupTable
    appGlobals={this.props.appGlobals}
    onSearchMUL={(e) => this.openAddingUnits( e, this.props.bmGroupIndex, 21 )}
    bmGroupIndex={this.props.bmGroupIndex}
    showAdd={this.props.showAdd}
    showEdit={this.props.showEdit}
/>
<BattleArmorGroupTable
    appGlobals={this.props.appGlobals}
    onSearchMUL={(e) => this.openAddingUnits( e, this.props.bmGroupIndex, 22 )}
    bmGroupIndex={this.props.bmGroupIndex}
    showAdd={this.props.showAdd}
    showEdit={this.props.showEdit}
/>
<ProtoMechGroupTable
    appGlobals={this.props.appGlobals}
    onSearchMUL={(e) => this.openAddingUnits( e, this.props.bmGroupIndex, 23 )}
    bmGroupIndex={this.props.bmGroupIndex}
    showAdd={this.props.showAdd}
    showEdit={this.props.showEdit}
/>
<MicroMechGroupTable
    appGlobals={this.props.appGlobals}
    bmGroupIndex={this.props.bmGroupIndex}
    showAdd={this.props.showAdd}
    showEdit={this.props.showEdit}
/>
<WalkerGroupTable
    appGlobals={this.props.appGlobals}
    bmGroupIndex={this.props.bmGroupIndex}
    showAdd={this.props.showAdd}
    showEdit={this.props.showEdit}
/>
<BuildingGroupTable
    appGlobals={this.props.appGlobals}
    bmGroupIndex={this.props.bmGroupIndex}
    showAdd={this.props.showAdd}
    showEdit={this.props.showEdit}
/>
<BattledroidsGroupTable
    appGlobals={this.props.appGlobals}
    bmGroupIndex={this.props.bmGroupIndex}
    showAdd={this.props.showAdd}
    showEdit={this.props.showEdit}
/>
</>
)}
</>
        )
    }
}

interface IBattleMechTableGroupProps {
    appGlobals: IAppGlobals;
    bmGroupIndex: number;
    showAdd: boolean;
    showEdit: boolean;
}

interface IBattleMechTableGroupState {
    viewingUnit: BattleMech | null;
    editingUnit: BattleMech | null;
    editingUnitIndex: number;

    addingUnitsModal: boolean;
    addingUnitsGroupIndex: number;
}