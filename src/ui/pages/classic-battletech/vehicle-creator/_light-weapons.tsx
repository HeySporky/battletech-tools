import React, { type JSX } from 'react';
import { IAppGlobals } from '../../../app-router';
import InputCheckbox from "../../../components/form_elements/input_checkbox";
import InputNumeric from "../../../components/form_elements/input_numeric";
import { isInfantryWeaponAvailable } from '../../../../data/infantry-weapons';
import { getLightWeaponDamage, getLightWeaponRanges, SUPPORT_VEHICLE_LIGHT_WEAPONS } from '../../../../data/support-vehicle-light-weapons';

/**
 * Light (Standard) and Medium (Support) infantry weapons for a Small Support Vehicle, in a location or on a pintle on
 * that side (TM pp.136-137, 234).
 */
export default class VehicleLightWeapons extends React.Component<IVehicleLightWeaponsProps, IVehicleLightWeaponsState> {
    constructor(props: IVehicleLightWeaponsProps) {
        super(props);
        this.state = { weapon: "", location: "front", clips: 0, pintle: false };
    }

    private add = (): void => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (vehicle && this.state.weapon) {
            vehicle.addLightWeapon(this.state.weapon, this.state.location, this.state.clips, this.state.pintle);
            this.props.appGlobals.saveCurrentVehicle(vehicle);
        }
    }

    render = (): JSX.Element => {
        const vehicle = this.props.appGlobals.currentVehicle;
        if (!vehicle) return <></>;
        const era = vehicle.getEra();
        const techs: ("is" | "clan")[] = vehicle.getTech().tag === "clan" ? ["clan"] : vehicle.getTech().tag === "is" ? ["is"] : ["is", "clan"];
        const weapons = SUPPORT_VEHICLE_LIGHT_WEAPONS.filter((weapon) => techs.some((tech) => (weapon.techBase === "both" || weapon.techBase === tech)
            && isInfantryWeaponAvailable(weapon, tech, era.yearStart, era.yearEnd ?? null)));
        const locations = vehicle.getLocations().filter((loc) => loc.tag !== "rotor");
        return (
            <>
                <h3>Light and Medium Weapons</h3>
                <p className="smaller-text">
                    A Small Support Vehicle mounts infantry weapons: Standard ones as Light weapons and Support ones as Medium
                    weapons. Each takes 1 item slot with its ammunition and comes with one clip; damage rounds to the nearest point
                    and the ranges are the Base Range, twice it and three times it (TM p.136).
                </p>
                <label>
                    Weapon:
                    <select value={this.state.weapon} onChange={(e) => this.setState({ weapon: e.currentTarget.value })}>
                        <option value="">Choose a weapon</option>
                        {weapons.map((weapon) => {
                            const ranges = getLightWeaponRanges(weapon);
                            return (
                                <option key={weapon.tag} value={weapon.tag}>
                                    {weapon.name} ({weapon.type === "support" ? "Medium" : "Light"}, {weapon.weight} kg, damage {getLightWeaponDamage(weapon)}, {ranges.short}/{ranges.medium}/{ranges.long}, crew {weapon.crew})
                                </option>
                            );
                        })}
                    </select>
                </label>
                <label>
                    Location:
                    <select value={this.state.location} onChange={(e) => this.setState({ location: e.currentTarget.value })}>
                        {locations.map((loc) => <option key={loc.tag} value={loc.tag}>{loc.name}</option>)}
                    </select>
                </label>
                <InputNumeric
                    label="Extra clips"
                    value={this.state.clips}
                    min={0}
                    step={1}
                    setValue={(clips: number) => this.setState({ clips })}
                />
                {vehicle.canHavePintles() ? (
                    <InputCheckbox
                        label="On a pintle (180-degree arc on its side; 5 percent of the weapon's weight, TM p.234)"
                        checked={this.state.pintle}
                        setValue={(pintle: boolean) => this.setState({ pintle })}
                    />
                ) : null}
                <button className="btn btn-primary btn-sm" disabled={!this.state.weapon} onClick={this.add}>Add Weapon</button>
            </>
        );
    }
}

interface IVehicleLightWeaponsProps {
    appGlobals: IAppGlobals;
}

interface IVehicleLightWeaponsState {
    weapon: string;
    location: string;
    clips: number;
    pintle: boolean;
}
