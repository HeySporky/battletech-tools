import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight, FaTrash } from "react-icons/fa";
import Building, { findBuildingCapitalWeapon } from '../../../../classes/building';
import { BUILDING_GENERATORS } from '../../../../data/building-classifications';
import { IEquipmentItem } from '../../../../data/data-interfaces';
import { CUSTOM_HOMEBREW_RULES_LEVEL } from '../../../../data/equipment-registry';
import { INFANTRY_WEAPON_CATEGORIES } from '../../../../data/infantry-weapons';
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

export default class BuildingCreatorEquipment extends React.Component<IEquipmentProps, { lightTag: string; capitalTag: string }> {
    constructor(props: IEquipmentProps) {
        super(props);
        this.state = { lightTag: "", capitalTag: "" };
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
        const lightAvailable = carriesEquipment ? building.getAvailableLightWeapons(rulesLevel) : [];
        const lightTag = lightAvailable.some((weapon) => weapon.tag === this.state.lightTag) ? this.state.lightTag : lightAvailable[0]?.tag ?? "";
        const lightLimit = building.getLightWeaponLimitPerHex();
        const capitalAvailable = carriesEquipment ? building.getAvailableCapitalWeapons(rulesLevel) : [];
        const capitalTag = capitalAvailable.some((weapon) => weapon.tag === this.state.capitalTag) ? this.state.capitalTag : capitalAvailable[0]?.tag ?? "";
        const showBunkers = building.getHexes() > 1 && (rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL || building.usesAmmoBunkers());
        const capitalCategories = capitalAvailable.map((weapon) => weapon.category).filter((category, index, list) => list.indexOf(category) === index);

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
                                            <p className="smaller-text">Only gun emplacements, fortresses and Castles Brian mount Heavy weapons (TO:AR p. 129); this building takes other equipment.</p>
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
                                                    amplifiers, except flamers and those that fire ammunition. Whatever the power, the heat sinks must cover
                                                    all the energy weapons' heat, as on a vehicle.
                                                </p>
                                            </>
                                        ) : null}

                                        {generator ? (
                                            <label>
                                                Hexes of other buildings the generator powers (each times its levels):
                                                <input type="number" min={0} max={100000} value={building.getPoweredHexes()} onChange={(e) => { const value = +e.currentTarget.value || 0; this.update((b) => b.setPoweredHexes(value)); }} />
                                            </label>
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

                                        <label>
                                            Tons of capacity for liquid fuel or chemical storage:
                                            <input type="number" min={0} max={building.getTotalCapacity()} value={building.getLiquidStorage()} onChange={(e) => { const value = +e.currentTarget.value || 0; this.update((b) => b.setLiquidStorage(value)); }} />
                                        </label>
                                        <p className="smaller-text">
                                            {building.getLiquidStorage() > 0 ? `Holds ${building.getLiquidCapacity()} tons, spread evenly over the hexes. ` : ""}
                                            Each ton holds 0.91 tons, at 100 C-bills a ton (TO:AR pp. 134, 208).
                                        </p>

                                        {building.canMountElevators() ? (
                                            <div data-testid="building-elevators">
                                                <p><strong>Industrial Elevators</strong>: {building.getElevators().length}{building.getElevatorWeight() > 0 ? `, ${building.getElevatorWeight()} tons` : ""}</p>
                                                {building.getElevators().map((elevator, index) => (
                                                    <p key={index}>
                                                        {building.getHexes() > 1 ? (
                                                            <label>
                                                                Elevator {index + 1} hex:
                                                                <select value={elevator.hex} onChange={(e) => { const value = +e.currentTarget.value; this.update((b) => b.setElevator(index, value, elevator.capacity, elevator.levels)); }}>
                                                                    {range(1, building.getHexes()).map((hex) => <option key={hex} value={hex}>{hex}</option>)}
                                                                </select>
                                                            </label>
                                                        ) : null}
                                                        <label>
                                                            Elevator {index + 1} capacity in tons (up to {building.getStandardCF()}):
                                                            <input type="number" min={1} max={building.getStandardCF()} value={elevator.capacity} onChange={(e) => { const value = +e.currentTarget.value || 1; this.update((b) => b.setElevator(index, elevator.hex, value, elevator.levels)); }} />
                                                        </label>
                                                        <label>
                                                            Elevator {index + 1} levels reached above the ground level:
                                                            <select value={elevator.levels} onChange={(e) => { const value = +e.currentTarget.value; this.update((b) => b.setElevator(index, elevator.hex, elevator.capacity, value)); }}>
                                                                {range(1, building.getLevels()).map((value) => <option key={value} value={value}>{value}{value === building.getLevels() ? " (the roof)" : ""}</option>)}
                                                            </select>
                                                        </label>
                                                        <button className="btn btn-danger btn-sm" onClick={() => this.update((b) => b.removeElevator(index))}>Remove Elevator {index + 1}</button>
                                                    </p>
                                                ))}
                                                <button className="btn btn-primary btn-sm" onClick={() => this.update((b) => b.addElevator(1, Math.min(20, b.getStandardCF()), 1))}>Add Industrial Elevator</button>
                                                <p className="smaller-text">
                                                    A ton for every 20 tons lifted, rounded up, times the levels reached; it lifts no more than the Construction
                                                    Factor and fills its hex on the levels it serves (TO:AR pp. 135-136).
                                                </p>
                                            </div>
                                        ) : null}

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
                                    rounded up to the half ton; ammunition stays out of it (TO:AUE p. 83). An automated weapon needs no gunners and
                                    fires with a Gunnery skill of 5, at 1,000 C-bills a ton (TO:AR pp. 131, 208).
                                </p>
                                <table className="table" data-testid="building-equipment">
                                    <thead>
                                        <tr><th>Name</th><th>Tons</th>{building.getHexes() > 1 ? <th>Hex</th> : null}<th>Turret</th><th>Automated</th><th></th></tr>
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
                                                    {Building.canAutomate(mount.item) ? (
                                                        <input
                                                            type="checkbox"
                                                            aria-label={"Automate " + mount.item.name}
                                                            checked={mount.automated}
                                                            onChange={(e) => { const value = e.currentTarget.checked; this.update((b) => b.setEquipmentAutomated(mount.item.uuid ?? "", value)); }}
                                                        />
                                                    ) : null}
                                                </td>
                                                <td>
                                                    <button className="btn btn-danger btn-sm" title={"Remove " + mount.item.name} onClick={() => this.update((b) => b.removeEquipment(mount.item.uuid ?? ""))}>
                                                        <Trash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {building.getEquipment().length === 0 ? <tr><td colSpan={6}>Nothing installed yet.</td></tr> : null}
                                    </tbody>
                                </table>
                            </TextSection>
                            {carriesEquipment && building.canMountLightWeapons() ? (
                                <TextSection label="Light and Medium Weapons">
                                    <p className="smaller-text">
                                        Weapons from the Conventional Infantry Weapons Table: its Standard weapons are Light and its Support weapons
                                        Medium. A hex mounts up to {lightLimit}, 6 for each level (TO:AR p. 129). Each needs the crew the table gives it,
                                        no heat sinks and no power amplifiers, comes with one free clip and may carry more (TM pp. 136-137). Melee
                                        weapons are offered only at the Custom Homebrew rules level. A pintle
                                        weighs 5 percent of its weapon, to the kilogram; a weapon may go in the hex's turret instead (TO:AUE p. 83).
                                    </p>
                                    <div className="form-inline">
                                        <select aria-label="Light or Medium weapon to add" value={lightTag} onChange={(e) => this.setState({ lightTag: e.currentTarget.value })}>
                                            {INFANTRY_WEAPON_CATEGORIES.map((category) => {
                                                const weapons = lightAvailable.filter((weapon) => weapon.category === category.tag);
                                                return weapons.length === 0 ? null : (
                                                    <optgroup key={category.tag} label={category.name}>
                                                        {weapons.map((weapon) => (
                                                            <option key={weapon.tag} value={weapon.tag}>
                                                                {weapon.name} ({Building.getLightWeaponClass(weapon)}, {weapon.weight} kg, damage {Building.getLightWeaponDamage(weapon)})
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                );
                                            })}
                                        </select>{" "}
                                        <button className="btn btn-primary btn-sm" disabled={!lightTag} data-testid="building-light-add" onClick={() => this.update((b) => { b.addLightWeapon(lightTag); })}>
                                            Add
                                        </button>
                                    </div>
                                    <table className="table" data-testid="building-light-weapons">
                                        <thead>
                                            <tr><th>Name</th><th>Class</th><th>Kg</th>{building.getHexes() > 1 ? <th>Hex</th> : null}<th>Mount</th><th>Extra Clips</th><th>Shots</th><th>Crew</th><th></th></tr>
                                        </thead>
                                        <tbody>
                                            {building.getLightWeapons().map((mount) => (
                                                <tr key={mount.uuid}>
                                                    <td>{mount.weapon.name}</td>
                                                    <td>{Building.getLightWeaponClass(mount.weapon)}</td>
                                                    <td>{Math.round(Building.getLightMountWeight(mount) * 100000) / 100}</td>
                                                    {building.getHexes() > 1 ? (
                                                        <td>
                                                            <select
                                                                aria-label={"Hex for " + mount.weapon.name}
                                                                value={mount.hex}
                                                                onChange={(e) => { const value = +e.currentTarget.value; this.update((b) => b.setLightWeaponHex(mount.uuid, value)); }}
                                                            >
                                                                {range(1, building.getHexes()).map((hex) => <option key={hex} value={hex}>{hex}</option>)}
                                                            </select>
                                                        </td>
                                                    ) : null}
                                                    <td>
                                                        <select
                                                            aria-label={"Mount for " + mount.weapon.name}
                                                            value={mount.mount}
                                                            onChange={(e) => { const value = e.currentTarget.value; this.update((b) => b.setLightWeaponMount(mount.uuid, value)); }}
                                                        >
                                                            <option value="fixed">Fixed</option>
                                                            <option value="pintle">Pintle</option>
                                                            <option value="turret">Turret</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        {Building.canCarryClips(mount.weapon) ? (
                                                            <input
                                                                type="number"
                                                                aria-label={"Extra clips for " + mount.weapon.name}
                                                                min={0}
                                                                max={999}
                                                                step={1}
                                                                style={{ width: "5em" }}
                                                                value={mount.clips}
                                                                onChange={(e) => { const value = +e.currentTarget.value; this.update((b) => b.setLightWeaponClips(mount.uuid, value)); }}
                                                            />
                                                        ) : "-"}
                                                    </td>
                                                    <td>{Building.getLightMountShots(mount) ?? "-"}</td>
                                                    <td>{mount.weapon.crew}</td>
                                                    <td>
                                                        <button className="btn btn-danger btn-sm" title={"Remove " + mount.weapon.name} onClick={() => this.update((b) => { b.removeLightWeapon(mount.uuid); })}>
                                                            <Trash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {building.getLightWeapons().length === 0 ? <tr><td colSpan={9}>None mounted.</td></tr> : null}
                                        </tbody>
                                    </table>
                                </TextSection>
                            ) : null}
                            {carriesEquipment && building.canMountCapitalWeapons() ? (
                                <TextSection label="Capital and Sub-Capital Weapons">
                                    <p className="smaller-text">
                                        Only fortresses and Castles Brian carry them (TO:AR p. 129). A hex takes one capital weapon that is not a
                                        missile launcher, and as many launchers as it has tonnage for. Anything but a launcher needs a fusion or
                                        fission generator and weighs 10 percent more for fire control. A weapon too heavy for its hex divides its
                                        weight evenly with hexes next to it; no hex that holds one, or a share of one, takes a turret. They fire
                                        upward only, with no arc on a ground map (TO:AUE p. 83). Each needs 7 gunners (TO:AR p. 130). Mass Drivers,
                                        for WarShips and space stations alone, are not offered.
                                    </p>
                                    <label>
                                        Add:&nbsp;
                                        <select aria-label="Capital weapon to add" value={capitalTag} onChange={(e) => this.setState({ capitalTag: e.currentTarget.value })}>
                                            {capitalCategories.map((category) => (
                                                <optgroup key={category} label={category}>
                                                    {capitalAvailable.filter((weapon) => weapon.category === category).map((weapon) => (
                                                        <option key={weapon.tag} value={weapon.tag}>
                                                            {weapon.name} ({weapon.weight} t{weapon.damage !== null ? `, damage ${weapon.damage}-C` : ""})
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        &nbsp;
                                        <button className="btn btn-primary btn-sm" disabled={!capitalTag} data-testid="building-capital-add" onClick={() => this.update((b) => { b.addCapitalWeapon(capitalTag); })}>
                                            Add
                                        </button>
                                    </label>
                                    <table className="table" data-testid="building-capital-weapons">
                                        <thead>
                                            <tr><th>Name</th><th>Tons</th><th>Fire Control</th><th>Heat</th><th>Damage</th><th>Range</th>{building.getHexes() > 1 ? <th>Hex</th> : null}{building.getHexes() > 1 ? <th>Shared With Hexes</th> : null}<th>Shots</th><th>Ammo Tons</th>{showBunkers ? <th>Ammo Bunker</th> : null}<th></th></tr>
                                        </thead>
                                        <tbody>
                                            {building.getCapitalWeapons().map((mount) => (
                                                <tr key={mount.uuid}>
                                                    <td>{mount.weapon.name}</td>
                                                    <td>{mount.weapon.weight}</td>
                                                    <td>{Building.getCapitalFireControlWeight(mount.weapon) || "-"}</td>
                                                    <td>{mount.weapon.heat ?? "*"}</td>
                                                    <td>{mount.weapon.damage !== null ? `${mount.weapon.damage}-C` : mount.weapon.tag === "ar-10-launcher" ? "*" : "-"}</td>
                                                    <td style={{ textTransform: "capitalize" }}>{mount.weapon.range ?? "*"}</td>
                                                    {building.getHexes() > 1 ? (
                                                        <td>
                                                            <select
                                                                aria-label={"Hex for " + mount.weapon.name}
                                                                value={mount.hex}
                                                                onChange={(e) => { const value = +e.currentTarget.value; this.update((b) => b.setCapitalWeaponHex(mount.uuid, value)); }}
                                                            >
                                                                {loads.map((load) => <option key={load.hex} value={load.hex}>{load.hex}</option>)}
                                                            </select>
                                                        </td>
                                                    ) : null}
                                                    {building.getHexes() > 1 ? (
                                                        <td>
                                                            {loads.filter((load) => load.hex !== mount.hex).map((load) => (
                                                                <label key={load.hex} style={{ marginRight: "0.5em", whiteSpace: "nowrap" }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        aria-label={`Share ${mount.weapon.name} with hex ${load.hex}`}
                                                                        checked={mount.sharedHexes.includes(load.hex)}
                                                                        disabled={!mount.sharedHexes.includes(load.hex) && mount.sharedHexes.length >= 6}
                                                                        onChange={(e) => {
                                                                            const hexes = e.currentTarget.checked ? [...mount.sharedHexes, load.hex] : mount.sharedHexes.filter((hex) => hex !== load.hex);
                                                                            this.update((b) => b.setCapitalWeaponSharedHexes(mount.uuid, hexes));
                                                                        }}
                                                                    />
                                                                    &nbsp;{load.hex}
                                                                </label>
                                                            ))}
                                                        </td>
                                                    ) : null}
                                                    <td>
                                                        {Building.getCapitalAmmoTags(mount.weapon).length === 0 ? "-" : Building.getCapitalAmmoTags(mount.weapon).map((ammoTag) => (
                                                            <label key={ammoTag} style={{ display: "block", whiteSpace: "nowrap" }}>
                                                                {Building.getCapitalAmmoTags(mount.weapon).length > 1 ? `${findBuildingCapitalWeapon(ammoTag)?.name}: ` : ""}
                                                                <input
                                                                    type="number"
                                                                    aria-label={`${Building.getCapitalAmmoTags(mount.weapon).length > 1 ? findBuildingCapitalWeapon(ammoTag)?.name + " shots" : "Shots"} for ${mount.weapon.name}`}
                                                                    min={0}
                                                                    max={9999}
                                                                    step={1}
                                                                    style={{ width: "6em" }}
                                                                    value={mount.shots[ammoTag] ?? 0}
                                                                    onChange={(e) => { const value = +e.currentTarget.value; this.update((b) => b.setCapitalWeaponShots(mount.uuid, ammoTag, value)); }}
                                                                />
                                                            </label>
                                                        ))}
                                                    </td>
                                                    <td>{Building.getCapitalAmmoWeight(mount) || "-"}</td>
                                                    {showBunkers ? (
                                                        <td>
                                                            {Building.getCapitalAmmoTags(mount.weapon).length === 0 ? "-" : (
                                                                <select
                                                                    aria-label={"Ammunition bunker hex for " + mount.weapon.name}
                                                                    value={mount.ammoHex ?? 0}
                                                                    onChange={(e) => { const value = +e.currentTarget.value; this.update((b) => b.setCapitalWeaponAmmoHex(mount.uuid, value)); }}
                                                                >
                                                                    <option value={0}>With the weapon</option>
                                                                    {loads.filter((load) => load.hex !== mount.hex).map((load) => <option key={load.hex} value={load.hex}>Hex {load.hex}</option>)}
                                                                </select>
                                                            )}
                                                        </td>
                                                    ) : null}
                                                    <td>
                                                        <button className="btn btn-danger btn-sm" title={"Remove " + mount.weapon.name} onClick={() => this.update((b) => { b.removeCapitalWeapon(mount.uuid); })}>
                                                            <Trash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {building.getCapitalWeapons().length === 0 ? <tr><td colSpan={12}>None mounted.</td></tr> : null}
                                        </tbody>
                                    </table>
                                    {showBunkers ? <p className="smaller-text">Custom rule: capital weapons in the hexes next to an ammunition bunker share it. Pick the bunker's hex for each weapon; its ammunition is carried there, and weapons that fire the same ammunition draw on one supply.</p> : null}
                                    <p className="smaller-text">An AR-10 takes its heat, damage and range from the missile it fires: standard Killer Whales, White Sharks and Barracudas (TM p. 342).</p>
                                </TextSection>
                            ) : null}
                            {carriesEquipment ? (
                                <TextSection label="Load by Hex">
                                    <table className="table" data-testid="building-loads">
                                        <thead>
                                            <tr><th>Hex</th><th>Heavy Weapons</th><th>Light and Medium</th><th>Capital Weapons</th><th>Turret</th><th>Amplifiers</th><th>Elevators and Tanks</th><th>Carried</th><th>Remaining</th></tr>
                                        </thead>
                                        <tbody>
                                            {loads.map((load) => (
                                                <tr key={load.hex} className={load.remaining < 0 || load.heavyWeapons > building.getHeavyWeaponLimitPerHex() || building.getLightWeaponCount(load.hex) > lightLimit ? "color-red" : ""}>
                                                    <td>{load.hex}</td>
                                                    <td>{building.canMountHeavyWeapons() ? `${load.heavyWeapons} / ${building.getHeavyWeaponLimitPerHex()}` : "-"}</td>
                                                    <td>{building.canMountLightWeapons() ? `${building.getLightWeaponCount(load.hex)} / ${lightLimit} (${load.lightWeapons} t)` : "-"}</td>
                                                    <td>{building.canMountCapitalWeapons() ? load.capitalWeapons : "-"}</td>
                                                    <td>{load.turret}</td>
                                                    <td>{load.powerAmplifiers}</td>
                                                    <td>{load.fittings}</td>
                                                    <td>{load.total}</td>
                                                    <td>{load.remaining}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p className="smaller-text">Carried counts armor, equipment, Light and Medium weapons with their clips and pintles, capital weapons with their fire control and ammunition, the turret, power amplifiers, elevators and the hex's share of heat sinks, generator and liquid storage.</p>
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
