import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight, FaTrash } from "react-icons/fa";
import Building from '../../../../classes/building';
import { BUILDING_GENERATORS } from '../../../../data/building-classifications';
import { IEquipmentItem } from '../../../../data/data-interfaces';
import { CUSTOM_HOMEBREW_RULES_LEVEL } from '../../../../data/equipment-registry';
import { IAppGlobals } from '../../../app-router';
import AvailableEquipment from '../../../components/available-equipment';
import BuildingCreatorSideMenu from '../../../components/building-creator-side-menu';
import InputNumeric from "../../../components/form_elements/input_numeric";
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const Trash = FaTrash as any;

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_unused, index) => from + index);

export default class BuildingCreatorEquipment extends React.Component<IEquipmentProps> {
    constructor(props: IEquipmentProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Step 3 | Building Creator");
    }

    update = (change: (building: Building) => void): void => {
        const building = this.props.appGlobals.currentBuilding;
        if (building) {
            change(building);
            this.props.appGlobals.saveCurrentBuilding(building);
        }
    }

    addEquipment = (item: IEquipmentItem): boolean => {
        const building = this.props.appGlobals.currentBuilding;
        if (!building) return false;
        const added = building.addEquipmentFromTag(item.tag);
        this.props.appGlobals.saveCurrentBuilding(building);
        return added !== null;
    }

    render = (): JSX.Element => {
        const building = this.props.appGlobals.currentBuilding;
        if (!building) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const loads = building.getHexLoads();
        const worst = loads.reduce((least, load) => Math.min(least, load.remaining), Number.POSITIVE_INFINITY);
        const heat = building.getEnergyWeaponHeat();
        const generator = building.getGenerator();
        const carriesEquipment = building.getCapacityPerHex() > 0;
        const available = carriesEquipment ? building.getAvailableEquipment(rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL, rulesLevel) : [];

        return (
            <UIPage current="classic-battletech-building-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <BuildingCreatorSideMenu appGlobals={this.props.appGlobals} current="equipment" />
                    </div>
                    <div className="col-md-9 col-lg-10 row">
                        <div className="col-md-12 col-lg-7">
                            <TextSection label="Step 3: Weapons, Heat Sinks, Equipment and Power">
                                {carriesEquipment ? (
                                    <>
                                        <p className={worst < 0 ? "color-red" : ""} data-testid="building-remaining">
                                            <strong>Remaining Capacity</strong>: {building.getRemainingCapacity()} tons
                                            {building.getHexes() > 1 ? ` (least on one hex: ${worst})` : ""} &nbsp;|&nbsp;
                                            <strong>Energy Weapon Heat</strong>: {heat} of {building.getHeatDissipation()} sunk
                                        </p>
                                        {building.canMountHeavyWeapons() ? (
                                            <p className="smaller-text">
                                                Each hex may mount {building.getHeavyWeaponLimitPerHex()} tons of Heavy weapons, not counting ammunition,
                                                turrets, heat sinks or power amplifiers: a gun emplacement's CF / 3, a fortress's CF / 10 for each level
                                                (TO:AR p. 129).
                                            </p>
                                        ) : (
                                            <p className="smaller-text">Only gun emplacements and fortresses mount Heavy weapons (TO:AR p. 129); this building takes other equipment.</p>
                                        )}

                                        {building.canMountGenerator() ? (
                                            <>
                                                <label>
                                                    Power Generator:
                                                    <select value={generator?.tag ?? ""} onChange={(e) => { const value = e.currentTarget.value; this.update((b) => b.setGenerator(value)); }}>
                                                        <option value="">None (local power grid)</option>
                                                        {BUILDING_GENERATORS.map((option) => (
                                                            <option key={option.tag} value={option.tag}>{option.name} (x{option.weightMultiplier})</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <p className="smaller-text">
                                                    {generator ? `${building.getGeneratorWeight()} tons, spread evenly over the hexes. ` : ""}
                                                    A generator weighs one ton for each hex and level plus 10 percent of the Heavy energy weapons, times its
                                                    multiplier (TO:AR p. 132). On the grid, or on anything but fusion or fission, energy weapons need power
                                                    amplifiers and heat sinks for all their heat.
                                                </p>
                                            </>
                                        ) : null}

                                        <label>
                                            Heat Sink Type:
                                            <select value={building.getHeatSinkType().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((b) => b.setHeatSinkType(value)); }}>
                                                {building.getAvailableHeatSinkTypes().map((option) => (
                                                    <option key={option.tag} value={option.tag}>{option.name}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <InputNumeric
                                            label="Heat Sinks (1 ton each, none free)"
                                            value={building.getHeatSinks()}
                                            min={0}
                                            max={Math.max(building.getHeatSinks(), Math.min(2000, building.getTotalCapacity()))}
                                            step={1}
                                            setValue={(value) => this.update((b) => b.setHeatSinks(value))}
                                        />

                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={building.hasUnspecifiedEquipment()}
                                                onChange={(e) => { const value = e.currentTarget.checked; this.update((b) => b.setUnspecifiedEquipment(value)); }}
                                            />
                                            &nbsp;Count the leftover capacity as unspecified equipment (5,000 C-bills x CF for each hex; no effect in play, TO:AR p. 129)
                                        </label>

                                        <AvailableEquipment
                                            appGlobals={this.props.appGlobals}
                                            equipment={available}
                                            addFunction={this.addEquipment}
                                        />
                                    </>
                                ) : (
                                    <p>A {building.getClassification().name.toLowerCase()} has no internal weight capacity, so it mounts no equipment (TO:AR p. 127).</p>
                                )}

                                <div className="clear-both overflow-hidden">
                                    <hr />
                                    <Link to={`${process.env.PUBLIC_URL}/classic-battletech/building-creator/summary`} className="btn btn-primary pull-right btn-sm">Next: Summary <ArrowCircleRight /></Link>
                                    <div className="inline-block text-left">
                                        <Link to={`${process.env.PUBLIC_URL}/classic-battletech/building-creator/structure`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                                    </div>
                                </div>
                            </TextSection>
                        </div>
                        <div className="col-md-12 col-lg-5">
                            <TextSection label="Installed Equipment">
                                <p className="smaller-text">
                                    A turret (one a hex, on the roof) gives its weapons a 360-degree arc and weighs 10 percent of what it holds,
                                    rounded up to the half ton; ammunition stays out of it (TO:AUE p. 83).
                                </p>
                                <table className="table" data-testid="building-equipment">
                                    <thead>
                                        <tr><th>Name</th><th>Tons</th>{building.getHexes() > 1 ? <th>Hex</th> : null}<th>Turret</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {building.getEquipment().map((mount) => (
                                            <tr key={mount.item.uuid}>
                                                <td>{mount.item.name}</td>
                                                <td>{mount.item.weight}</td>
                                                {building.getHexes() > 1 ? (
                                                    <td>
                                                        <select
                                                            aria-label={"Hex for " + mount.item.name}
                                                            value={mount.hex}
                                                            onChange={(e) => { const value = +e.currentTarget.value; this.update((b) => b.setEquipmentHex(mount.item.uuid ?? "", value)); }}
                                                        >
                                                            {range(1, building.getHexes()).map((hex) => <option key={hex} value={hex}>{hex}</option>)}
                                                        </select>
                                                    </td>
                                                ) : null}
                                                <td>
                                                    {mount.item.isAmmo ? null : (
                                                        <input
                                                            type="checkbox"
                                                            aria-label={"Turret-mount " + mount.item.name}
                                                            checked={mount.turret}
                                                            onChange={(e) => { const value = e.currentTarget.checked; this.update((b) => b.setEquipmentTurret(mount.item.uuid ?? "", value)); }}
                                                        />
                                                    )}
                                                </td>
                                                <td>
                                                    <button className="btn btn-danger btn-sm" title={"Remove " + mount.item.name} onClick={() => this.update((b) => b.removeEquipment(mount.item.uuid ?? ""))}>
                                                        <Trash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {building.getEquipment().length === 0 ? <tr><td colSpan={5}>Nothing installed yet.</td></tr> : null}
                                    </tbody>
                                </table>
                            </TextSection>
                            {carriesEquipment ? (
                                <TextSection label="Load by Hex">
                                    <table className="table" data-testid="building-loads">
                                        <thead>
                                            <tr><th>Hex</th><th>Heavy Weapons</th><th>Turret</th><th>Amplifiers</th><th>Carried</th><th>Remaining</th></tr>
                                        </thead>
                                        <tbody>
                                            {loads.map((load) => (
                                                <tr key={load.hex} className={load.remaining < 0 || load.heavyWeapons > building.getHeavyWeaponLimitPerHex() ? "color-red" : ""}>
                                                    <td>{load.hex}</td>
                                                    <td>{building.canMountHeavyWeapons() ? `${load.heavyWeapons} / ${building.getHeavyWeaponLimitPerHex()}` : "-"}</td>
                                                    <td>{load.turret}</td>
                                                    <td>{load.powerAmplifiers}</td>
                                                    <td>{load.total}</td>
                                                    <td>{load.remaining}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p className="smaller-text">Carried counts armor, equipment, the turret, power amplifiers and the hex's share of heat sinks and generator.</p>
                                </TextSection>
                            ) : null}
                        </div>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IEquipmentProps {
    appGlobals: IAppGlobals;
}
