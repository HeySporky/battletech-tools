
import React from 'react';
import { Button } from 'react-bootstrap';
import { IEquipmentItem } from '../../data/data-interfaces';
import { IAppGlobals } from '../app-router';
import './available-equipment.scss';

export default class AvailableEquipment extends React.Component<IAvailableEquipmentProps, IAvailableEquipmentState> {

    updateEquipmentFilter = (e: React.FormEvent<HTMLInputElement>):void => {

        let appSettings = this.props.appGlobals.appSettings;

        appSettings.equipmentFilter = e.currentTarget.value;
        this.props.appGlobals.saveAppSettings( appSettings );


    }

    clickSelectCategory = ( newValue: string ): void => {

        let appSettings = this.props.appGlobals.appSettings;

        appSettings.installEquipCategory =newValue;
        this.props.appGlobals.saveAppSettings( appSettings );

    }

    equipmentFilter = ( item: IEquipmentItem ): boolean => {
        if(
            this.state.equipmentFilter.trim() === ""
                ||
            item.name.toLowerCase().trim().indexOf(
                this.state.equipmentFilter.toLowerCase().trim()
            ) > -1
                || (
                item.alternameName
                &&
                item.alternameName.toLowerCase().trim().indexOf(
                    this.state.equipmentFilter.toLowerCase().trim()
                ) > -1
            )

        ) {
            return true;
        }

        return false;
    }

    render = (): React.ReactFragment => {

        let currentCategory = "";

        let groupedItems : { [categoryName: string] : IEquipmentItem[]; }= {};
        for( let item of this.props.equipment ) {
            if( !this.props.hideUnavailable || item.available ) {
                if( !groupedItems[item.category ] ) {
                    groupedItems[item.category ] = []
                }
                if( this.props.appGlobals.appSettings.installEquipCategory === "" ) {
                    currentCategory = item.category;
                }
                groupedItems[item.category ].push( item );
            }
        }

        return (
<div>
    <h2>
        <input
            type="search"
            placeholder="Filter Equipment"
            value={this.state.equipmentFilter}
            onChange={this.updateEquipmentFilter}
            className="filter-equiment-box"
        />
        Avail Equip

    </h2>
    <table className="table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Cat</th>
                <th>Criticals</th>
                <th>Weight</th>
                <th>&nbsp;</th>
            </tr>
        </thead>

            {Object.keys(groupedItems).map((catName, catIndex) => {
                return (
                    <tbody key={catIndex}>
                <tr>
                    <th colSpan={5}>
                        <Button
                            className="full-width no-margin"
                            onClick={() => this.clickSelectCategory( catName)}
                        >
                            {catName}
                        </Button>
                    </th>
                </tr>
                    {this.state.equipmentFilter.trim() ||
                    currentCategory === catName ? (
                        <>
                        {groupedItems[catName].filter(this.equipmentFilter).map( (item, itemIndex) => {
                            if( !this.props.hideUnavailable || item.available ) {
                                return (
                                    <tr
                                        key={itemIndex}
                                        className={!item.available ? "disabled" : ""}
                                    >
                                        <td>{item.name}</td>
                                        <td>{item.category}</td>
                                        <td>{item.criticals}</td>
                                        <td>{item.weight}</td>
                                        <td>
                                            <Button
                                                variant="primary"
                                                className="btn-md"
                                                onClick={() => this.props.addFunction( item )}
                                                // disabled={!item.available}
                                            >
                                                Add
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            } else {
                                return <></>
                            }
                        })}
                        </>
                    ) : (
                        <></>
                    )}

                    </tbody>
                )
            })}

    </table>
</div>
        );
    }
}

interface IAvailableEquipmentProps {
    appGlobals: IAppGlobals;
    equipment: IEquipmentItem[];
    addFunction( item: IEquipmentItem ): boolean;
    hideUnavailable?: boolean;
}

interface IAvailableEquipmentState {
    updated: boolean;
    equipmentFilter: string;
}