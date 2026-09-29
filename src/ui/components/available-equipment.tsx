
import React, { type JSX } from 'react';
import { IEquipmentItem } from '../../data/data-interfaces';
import { getEquipmentSubtype, getEquipmentSubtypes } from '../../data/equipment-subtypes';
import { sortEquipment } from '../../utils';
import { IAppGlobals } from '../app-router';
import './available-equipment.scss';
import InputField from './form_elements/input_field';

export default class AvailableEquipment extends React.Component<IAvailableEquipmentProps, IAvailableEquipmentState> {

    constructor( props: IAvailableEquipmentProps ) {
        super(props);
        this.state = {
            updated: false,
            subtype: "",
            // equipmentFilter: this.props.appGlobals.appSettings.equipmentFilter,
        }
    }

    updateEquipmentFilter = (e: React.FormEvent<HTMLInputElement>):void => {

        let appSettings = this.props.appGlobals.appSettings;

        appSettings.equipmentFilter = e.currentTarget.value;
        this.props.appGlobals.saveAppSettings( appSettings );

    }

    clickSelectCategory = ( newValue: string ): void => {

        let appSettings = this.props.appGlobals.appSettings;

        appSettings.installEquipCategory =newValue;
        this.props.appGlobals.saveAppSettings( appSettings );
        // Subtypes belong to one category; start the new one unfiltered
        this.setState({ subtype: "" });

    }

    _equipmentFilter = ( item: IEquipmentItem ): boolean => {

        if(
            this.props.appGlobals.appSettings.equipmentFilter.trim() === ""
                ||
            item.name.toLowerCase().trim().indexOf(
                this.props.appGlobals.appSettings.equipmentFilter.toLowerCase().trim()
            ) > -1
                || [
                    item.alternateName ?? "",
                    ...(item.altNames ?? []),
                    ...(item.altTags ?? []),
                ].some(alias => alias.toLowerCase().trim().indexOf(
                    this.props.appGlobals.appSettings.equipmentFilter.toLowerCase().trim()
                ) > -1)

        ) {
            return true;
        }

        return false;
    }

    _subtypeFilter = ( item: IEquipmentItem ): boolean => {
        return this.state.subtype === "" || getEquipmentSubtype( item ) === this.state.subtype;
    }

    render = (): JSX.Element => {

        let currentCategory = this.props.appGlobals.appSettings.installEquipCategory;

        let groupedItems : { [categoryName: string] : IEquipmentItem[]; }= {};
        for( let item of this.props.equipment ) {
            if( !this.props.hideUnavailable || item.available ) {
                if( !groupedItems[ item.category ] ) {
                    groupedItems[ item.category ] = []
                }
                if( currentCategory.trim() === "" ) {

                    currentCategory = item.category;
                }
                groupedItems[ item.category ].push( item );
            }
        }

        return (
<div>
    <h2>

        <InputField
            type="search"
            placeholder="Filter Equipment"
            value={this.props.appGlobals.appSettings.equipmentFilter}
            onChange={this.updateEquipmentFilter}
            className="filter-equiment-box"
        />
        Available Equipment

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

                // this.props.appGlobals.appSettings.equipmentFilter
                if(!catName)
                    return <React.Fragment key={catIndex}></React.Fragment>
                const isCurrentCategory = currentCategory.trim().toLowerCase() === catName.trim().toLowerCase();
                return (
                    <tbody key={catIndex}>
                <tr>
                    <th colSpan={5}>
                        <button
                            className="btn btn-primary full-width no-margin"
                            onClick={() => this.clickSelectCategory( catName)}
                        >
                            {catName}
                        </button>
                    </th>
                </tr>
                    {this.props.appGlobals.appSettings.equipmentFilter.trim()
                    ||
                    isCurrentCategory ? (
                        <>
                        {isCurrentCategory && getEquipmentSubtypes(groupedItems[catName]).length > 1 ? (
                            <tr>
                                <td colSpan={5}>
                                    <label>
                                        Type:
                                        <select
                                            value={this.state.subtype}
                                            onChange={(event: React.FormEvent<HTMLSelectElement>) => this.setState({ subtype: event.currentTarget.value })}
                                            title="Show one weapon family within this category"
                                        >
                                            <option value="">All {catName}</option>
                                            {getEquipmentSubtypes(groupedItems[catName]).map( (subtype) => {
                                                return (
                                                    <option key={subtype} value={subtype}>{subtype}</option>
                                                )
                                            })}
                                        </select>
                                    </label>
                                </td>
                            </tr>
                        ) : null}
                        {groupedItems[catName].filter(this._equipmentFilter).filter( (item) => !isCurrentCategory || this._subtypeFilter( item ) ).sort( sortEquipment ).map( (item, itemIndex) => {
                            if( !this.props.hideUnavailable || item.available ) {
                                return (
                                    <tr
                                        key={itemIndex}
                                        className={!item.available ? "disabled" : ""}
                                    >
                                        <td>{item.name}{item.availableAsPrototype ? <span className="small-text"> (Prototype)</span> : null}</td>
                                        <td>{item.category}</td>
                                        <td>{item.criticals}</td>
                                        <td>{item.weight}</td>
                                        <td>
                                            <button
                                                className="btn btn-primary btn-md"
                                                onClick={() => this.props.addFunction( item )}
                                                // disabled={!item.available}
                                            >
                                                Add
                                            </button>
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
    subtype: string;
    // equipmentFilter: string;
}