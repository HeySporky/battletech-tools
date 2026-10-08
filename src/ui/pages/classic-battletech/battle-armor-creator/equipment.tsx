import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight, FaPlus, FaTrash } from "react-icons/fa";
import BattleArmor, { BATTLE_ARMOR_LOCATION_NAMES, BATTLE_ARMOR_WEAPON_PACK, BattleArmorLocation, IBattleArmorMountedItem } from '../../../../classes/battle-armor';
import { BATTLE_ARMOR_TURRET } from '../../../../data/battle-armor-construction';
import { IBattleArmorEquipment, findBattleArmorEquipment } from '../../../../data/battle-armor-equipment';
import { IAppGlobals } from '../../../app-router';
import BattleArmorCreatorSideMenu from '../../../components/battle-armor-creator-side-menu';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import BattleArmorStatusBar from './_statusBar';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const Plus = FaPlus as any;
const Trash = FaTrash as any;

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_unused, index) => from + index);

export default class BattleArmorCreatorEquipment extends React.Component<IEquipmentProps, IEquipmentState> {
    constructor(props: IEquipmentProps) {
        super(props);
        this.state = { location: "body" };
        this.props.appGlobals.makeDocumentTitle("Step 5 | Battle Armor Creator");
    }

    update = (change: (suit: BattleArmor) => void): void => {
        const suit = this.props.appGlobals.currentBattleArmor;
        if (suit) {
            change(suit);
            this.props.appGlobals.saveCurrentBattleArmor(suit);
        }
    }

    private _weightText = (equipment: IBattleArmorEquipment): string => {
        if (equipment.variableWeight) return "chosen";
        const oneShot = typeof equipment.oneShot === "object" ? ` [${equipment.oneShot.kg} kg]` : "";
        return `${equipment.kg} kg${oneShot}`;
    }

    private _slotText = (equipment: IBattleArmorEquipment): string =>
        `${equipment.slots}${typeof equipment.oneShot === "object" ? ` [${equipment.oneShot.slots}]` : ""}`;

    private _itemRow = (suit: BattleArmor, entry: IBattleArmorMountedItem, index: number): JSX.Element | null => {
        const equipment = findBattleArmorEquipment(entry.tag);
        if (!equipment) return null;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const missile = equipment.kind === "missile";
        const mountable = !equipment.noMount && !suit.isQuad();
        return (
            <tr key={index} data-testid="ba-mounted-item">
                <td>
                    {equipment.name}
                    {equipment.notes ? <div className="smaller-text">{equipment.notes}</div> : null}
                </td>
                <td>
                    {equipment.bodyOnly ? "Body" : (
                        <select value={entry.location} onChange={(e) => { const value = e.currentTarget.value as BattleArmorLocation; this.update((s) => s.updateItem(index, { location: value })); }}>
                            {suit.getLocations().map((location) => <option key={location} value={location}>{BATTLE_ARMOR_LOCATION_NAMES[location]}</option>)}
                        </select>
                    )}
                </td>
                <td>
                    {missile && equipment.oneShot !== "always" && !suit.isOneShot(entry) ? (
                        <label>
                            Shots:
                            <select data-testid="ba-item-shots" value={suit.getItemShots(entry)} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.updateItem(index, { shots: value })); }}>
                                {range(1, 20).map((value) => <option key={value} value={value}>{value}</option>)}
                            </select>
                        </label>
                    ) : null}
                    {missile && typeof equipment.oneShot === "object" ? (
                        <label>
                            <input type="checkbox" checked={suit.isOneShot(entry)} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.updateItem(index, { oneShot: value })); }} />
                            &nbsp;One-shot
                        </label>
                    ) : null}
                    {missile ? (
                        <label>
                            <input type="checkbox" data-testid="ba-item-detachable" checked={!!entry.detachable} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.updateItem(index, { detachable: value })); }} />
                            &nbsp;Detachable (+10 kg)
                        </label>
                    ) : null}
                    {mountable ? (
                        <label>
                            <input type="checkbox" data-testid="ba-item-modular" checked={!!entry.modular} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.updateItem(index, { modular: value })); }} />
                            &nbsp;Modular weapon mount (+10 kg, +1 slot)
                        </label>
                    ) : null}
                    {suit.canUseWeaponPack(entry) && rulesLevel >= BATTLE_ARMOR_WEAPON_PACK.rulesLevel ? (
                        <label>
                            <input type="checkbox" data-testid="ba-item-dwp" checked={!!entry.dwp} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.updateItem(index, { dwp: value })); }} />
                            &nbsp;Detachable weapon pack (75% of its weight, 1 slot; TO:AUE pp.98-99)
                        </label>
                    ) : null}
                    {mountable && equipment.kind !== "equipment" ? (
                        <label>
                            <input type="checkbox" data-testid="ba-item-ssw" checked={!!entry.squadSupport} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.updateItem(index, { squadSupport: value })); }} />
                            &nbsp;Squad support weapon ({suit.isClan() ? "40" : "50"}% of its weight on each suit)
                        </label>
                    ) : null}
                    {equipment.variableWeight ? (
                        <label>
                            Kilograms:
                            <input type="number" min={0} max={2000} value={entry.kg ?? 0} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.updateItem(index, { kg: value })); }} />
                        </label>
                    ) : null}
                </td>
                <td className="text-right">{suit.getItemWeight(entry)} kg</td>
                <td className="text-right">{suit.getItemSlots(entry)}</td>
                <td className="text-right">
                    <button className="btn btn-sm btn-danger" type="button" title={"Remove " + equipment.name} onClick={() => this.update((s) => s.removeItem(index))}><Trash /></button>
                </td>
            </tr>
        );
    }

    render = (): JSX.Element => {
        const suit = this.props.appGlobals.currentBattleArmor;
        if (!suit) return <></>;
        const locations = suit.getLocations();
        const location = locations.includes(this.state.location) ? this.state.location : "body";
        const turret = suit.getTurret();
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const available = suit.getAvailableEquipment(rulesLevel);
        const groups = Array.from(new Set(available.map((equipment) => equipment.group)));
        const apWeapons = suit.getAntiPersonnelWeapons();

        return (
            <UIPage current="classic-battletech-battle-armor-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <BattleArmorCreatorSideMenu appGlobals={this.props.appGlobals} current="equipment" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <BattleArmorStatusBar suit={suit} />

                        <TextSection label="Step 5: Mounted Weapons and Equipment">
                            <table className="table">
                                <thead>
                                    <tr><th>Item</th><th>Location</th><th>Options</th><th className="text-right">Weight</th><th className="text-right">Slots</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {suit.getItems().length > 0 ? suit.getItems().map((entry, index) => this._itemRow(suit, entry, index)) : (
                                        <tr><td colSpan={6}>Nothing is mounted yet.</td></tr>
                                    )}
                                </tbody>
                            </table>

                            {suit.isQuad() ? (
                                <>
                                    <h3>Turret Mount</h3>
                                    <label>
                                        Turret Capacity:
                                        <select data-testid="ba-turret" value={turret ? turret.size : 0} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.setTurret(value, !!turret?.configurable)); }}>
                                            <option value={0}>No turret</option>
                                            {range(BATTLE_ARMOR_TURRET.minCapacity, BATTLE_ARMOR_TURRET.maxCapacity).map((value) => (
                                                <option key={value} value={value}>{value} {value === 1 ? "slot" : "slots"} ({BATTLE_ARMOR_TURRET.baseKg + BATTLE_ARMOR_TURRET.kgPerSlot * value} kg)</option>
                                            ))}
                                        </select>
                                    </label>
                                    {turret && turret.size > 1 ? (
                                        <label>
                                            <input type="checkbox" data-testid="ba-turret-configurable" checked={turret.configurable} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.setTurret(turret.size, value)); }} />
                                            &nbsp;Configurable (+10 kg, +1 slot, 1 less capacity)
                                        </label>
                                    ) : null}
                                    <p className="smaller-text">A quad may fit one turret mount, in the body (TM pp. 171, 262). It holds {suit.getSlots("turret")} slots of weapons and ammunition.</p>
                                </>
                            ) : null}

                            <h3>Anti-Personnel Weapon Mounts</h3>
                            {suit.getAPMounts().map((mount, index) => (
                                <div key={index} data-testid="ba-ap-mount">
                                    <label>
                                        {BATTLE_ARMOR_LOCATION_NAMES[mount.location]} mount:
                                        <select value={mount.weapon} onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setAPMountWeapon(index, value)); }}>
                                            <option value="">Empty</option>
                                            {apWeapons.map((weapon) => <option key={weapon.tag} value={weapon.tag}>{weapon.name} (damage {weapon.damage}, BV {weapon.battleValue})</option>)}
                                        </select>
                                    </label>
                                    <button className="btn btn-sm btn-danger" type="button" title="Remove this mount" onClick={() => this.update((s) => s.removeAPMount(index))}><Trash /></button>
                                </div>
                            ))}
                            <p>
                                {locations.filter((entry) => entry !== "turret").map((entry) => (
                                    <button key={entry} className="btn btn-sm btn-primary" type="button" data-testid={`ba-add-ap-${entry}`} onClick={() => this.update((s) => s.addAPMount(entry))}>
                                        <Plus /> {BATTLE_ARMOR_LOCATION_NAMES[entry]}
                                    </button>
                                ))}
                            </p>
                            <p className="smaller-text">
                                A mount weighs 5 kg and takes 1 slot; it carries a Standard-type conventional infantry weapon whose weight is not counted
                                (TM pp. 170, 262, 271). An arm takes 1 anti-'Mech weapon and 1 mount, or 2 mounts; a humanoid body 2 and 2; a quad body 4 and 4.
                            </p>
                        </TextSection>

                        <TextSection label={`Battle Armor Equipment Table: ${suit.isClan() ? "Clan" : "Inner Sphere"}`}>
                            <label>
                                Add to:
                                <select data-testid="ba-add-location" value={location} onChange={(e) => this.setState({ location: e.currentTarget.value as BattleArmorLocation })}>
                                    {locations.map((entry) => <option key={entry} value={entry}>{BATTLE_ARMOR_LOCATION_NAMES[entry]} ({suit.getFreeSlots(entry)} slots free)</option>)}
                                </select>
                            </label>
                            <table className="table">
                                <thead>
                                    <tr><th>Item</th><th>Damage</th><th>Range (min/sht/med/lng)</th><th>Weight</th><th>Ammo</th><th>Slots</th><th>BV</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {groups.map((group) => (
                                        <React.Fragment key={group}>
                                            <tr><th colSpan={8}>{group}</th></tr>
                                            {available.filter((equipment) => equipment.group === group).map((equipment) => (
                                                <tr key={equipment.tag}>
                                                    <td>
                                                        {equipment.name} <span className="smaller-text">({equipment.book ?? "TM"} p.{equipment.page}{equipment.rulesLevel === 4 ? ", Experimental" : equipment.rulesLevel === 3 ? ", Advanced" : ""})</span>
                                                        {!suit.isEquipmentInEra(equipment) ? <div className="smaller-text color-red">Not in the {suit.getEra().name} era</div> : null}
                                                    </td>
                                                    <td>{equipment.damage}</td>
                                                    <td>{equipment.range}</td>
                                                    <td>{this._weightText(equipment)}</td>
                                                    <td>{equipment.oneShot === "always" ? "OS" : equipment.ammoKg ? `${equipment.ammoKg} kg${equipment.kind === "missile" ? " a shot" : ` (${equipment.magazine})`}` : ""}</td>
                                                    <td>{this._slotText(equipment)}</td>
                                                    <td>{equipment.defensive ? `+${equipment.defensiveValue ?? 1} def.` : equipment.bv}</td>
                                                    <td className="text-right">
                                                        <button className="btn btn-sm btn-primary" type="button" data-testid={`ba-add-${equipment.tag}`} title={`Add ${equipment.name} to the ${BATTLE_ARMOR_LOCATION_NAMES[location]}`} onClick={() => this.update((s) => s.addItem(equipment.tag, location))}>
                                                            <Plus />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                            <p className="smaller-text">
                                TechManual pp. 346-348. Figures in brackets are the one-shot launcher. A launcher's weight is the launcher unloaded: each
                                shot adds its weight, and every 4 shots take a weapon slot (TM p. 171). Other weapons carry one magazine in their weight.
                                Items from Tactical Operations: Advanced Units &amp; Equipment (pp. 224-225) are listed from the Advanced or Experimental rules
                                level. The table shows what the {suit.getEra().name} era has (IO:AE pp. 46-47); the era and rules level are chosen in Step 1.
                            </p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator/loadouts`} className="btn btn-primary pull-right btn-sm">
                                    Next Step <ArrowCircleRight />
                                </Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator/chassis`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IEquipmentProps {
    appGlobals: IAppGlobals;
}

interface IEquipmentState {
    location: BattleArmorLocation;
}
