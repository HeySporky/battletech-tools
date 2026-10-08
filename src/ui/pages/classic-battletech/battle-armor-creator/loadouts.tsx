import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight, FaPlus, FaTrash } from "react-icons/fa";
import BattleArmor, { BATTLE_ARMOR_LOCATION_NAMES, BattleArmorArm, MAX_BATTLE_ARMOR_LOADOUTS } from '../../../../classes/battle-armor';
import { battleArmorManipulators } from '../../../../data/battle-armor-construction';
import { findBattleArmorEquipment } from '../../../../data/battle-armor-equipment';
import { IAppGlobals } from '../../../app-router';
import BattleArmorCreatorSideMenu from '../../../components/battle-armor-creator-side-menu';
import InputField from '../../../components/form_elements/input_field';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import BattleArmorStatusBar from './_statusBar';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const Plus = FaPlus as any;
const Trash = FaTrash as any;

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_unused, index) => from + index);

/** Alternate loadouts: what the suit's modular mounts and equipment adaptors carry on another mission. */
export default class BattleArmorCreatorLoadouts extends React.Component<ILoadoutsProps> {
    constructor(props: ILoadoutsProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Loadouts | Battle Armor Creator");
    }

    update = (change: (suit: BattleArmor) => void): void => {
        const suit = this.props.appGlobals.currentBattleArmor;
        if (suit) {
            change(suit);
            this.props.appGlobals.saveCurrentBattleArmor(suit);
        }
    }

    render = (): JSX.Element => {
        const suit = this.props.appGlobals.currentBattleArmor;
        if (!suit) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const mounts = suit.getSwappableItems();
        const arms = suit.getAdaptorArms();
        const options = suit.getMountOptions(rulesLevel);
        const loadouts = suit.getLoadouts();

        return (
            <UIPage current="classic-battletech-battle-armor-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <BattleArmorCreatorSideMenu appGlobals={this.props.appGlobals} current="loadouts" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <BattleArmorStatusBar suit={suit} />
                        <TextSection label="Alternate Loadouts">
                            <p>
                                A weapon in a standard modular weapon mount or a configurable turret mount, and the manipulator in a modular
                                equipment adaptor, can be changed between missions (TM pp. 167, 171, 262). Each loadout here names what those
                                mounts carry in place of the base design's choice; everything else on the suit stays as built.
                            </p>
                            {!suit.canHaveLoadouts() ? (
                                <p data-testid="ba-no-loadouts"><strong>This suit has no modular weapon mount, configurable turret or equipment adaptor, so it has one loadout.</strong></p>
                            ) : (
                                <>
                                    {loadouts.map((loadout, index) => {
                                        const refit = suit.getLoadoutSuit(index);
                                        const issues = refit.getIssues();
                                        return (
                                            <div key={index} data-testid="ba-loadout" className="loadout-block">
                                                <InputField
                                                    label="Loadout name"
                                                    value={loadout.name}
                                                    onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setLoadoutName(index, value)); }}
                                                />
                                                {mounts.map((mount) => {
                                                    const base = findBattleArmorEquipment(mount.entry.tag);
                                                    const swap = loadout.weapons[String(mount.index)];
                                                    const equipment = swap ? findBattleArmorEquipment(swap.tag) : null;
                                                    const missile = equipment?.kind === "missile" && equipment.oneShot !== "always";
                                                    return (
                                                        <div key={mount.index}>
                                                            <label>
                                                                {BATTLE_ARMOR_LOCATION_NAMES[mount.entry.location]} {mount.entry.location === "turret" ? "mount" : "modular mount"} (base: {base?.name ?? mount.entry.tag}):
                                                                <select
                                                                    data-testid="ba-loadout-weapon"
                                                                    value={swap?.tag ?? ""}
                                                                    onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setLoadoutWeapon(index, mount.index, value)); }}
                                                                >
                                                                    <option value="">As the base design</option>
                                                                    {options.map((option) => <option key={option.tag} value={option.tag}>{option.name} ({option.kg} kg, {option.slots} {option.slots === 1 ? "slot" : "slots"})</option>)}
                                                                </select>
                                                            </label>
                                                            {swap && missile ? (
                                                                <label>
                                                                    Shots:
                                                                    <select value={swap.shots ?? 1} onChange={(e) => { const value = +e.currentTarget.value; this.update((s) => s.setLoadoutWeapon(index, mount.index, swap.tag, value, swap.oneShot)); }}>
                                                                        {range(1, 20).map((value) => <option key={value} value={value}>{value}</option>)}
                                                                    </select>
                                                                </label>
                                                            ) : null}
                                                            {swap && equipment && typeof equipment.oneShot === "object" ? (
                                                                <label>
                                                                    <input type="checkbox" checked={!!swap.oneShot} onChange={(e) => { const value = e.currentTarget.checked; this.update((s) => s.setLoadoutWeapon(index, mount.index, swap.tag, swap.shots, value)); }} />
                                                                    &nbsp;One-shot
                                                                </label>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })}
                                                {arms.map((arm: BattleArmorArm) => (
                                                    <label key={arm}>
                                                        {BATTLE_ARMOR_LOCATION_NAMES[arm]} adaptor (base: {suit.getManipulator(arm).name}):
                                                        <select
                                                            data-testid={`ba-loadout-manipulator-${arm}`}
                                                            value={loadout.manipulators[arm] ?? ""}
                                                            onChange={(e) => { const value = e.currentTarget.value; this.update((s) => s.setLoadoutManipulator(index, arm, value)); }}
                                                        >
                                                            <option value="">As the base design</option>
                                                            {battleArmorManipulators.map((option) => <option key={option.tag} value={option.tag}>{option.name}{option.kg > 0 ? ` (${option.kg} kg)` : ""}</option>)}
                                                        </select>
                                                    </label>
                                                ))}
                                                <p data-testid="ba-loadout-values">
                                                    <strong>Weight</strong>: {refit.getWeight()} of {refit.getWeightClass().maxWeight} kg &nbsp;|&nbsp;
                                                    <strong>Battle Value</strong>: {refit.getBattleValue()} &nbsp;|&nbsp;
                                                    <strong>Cost</strong>: {refit.getCBillCost().toLocaleString("en-US")} C-bills
                                                </p>
                                                {issues.length > 0 ? (
                                                    <ul className="color-red" data-testid="ba-loadout-issues">
                                                        {issues.map((issue, issueIndex) => <li key={issueIndex}>{issue}</li>)}
                                                    </ul>
                                                ) : null}
                                                <button className="btn btn-sm btn-danger" type="button" title={"Remove the loadout " + loadout.name} onClick={() => this.update((s) => s.removeLoadout(index))}>
                                                    <Trash /> Remove this loadout
                                                </button>
                                                <hr />
                                            </div>
                                        );
                                    })}
                                    {loadouts.length < MAX_BATTLE_ARMOR_LOADOUTS ? (
                                        <button className="btn btn-sm btn-primary" type="button" data-testid="ba-add-loadout" onClick={() => this.update((s) => s.addLoadout(""))}>
                                            <Plus /> Add a loadout
                                        </button>
                                    ) : null}
                                    <p className="smaller-text">
                                        Every loadout must stay inside the suit's weight and slots, and is checked like the base design. A loadout is
                                        chosen for a squad when it is added to a roster, and each has its own record sheet and Alpha Strike card.
                                    </p>
                                </>
                            )}

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator/summary`} className="btn btn-primary pull-right btn-sm">
                                    Summary <ArrowCircleRight />
                                </Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator/equipment`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface ILoadoutsProps {
    appGlobals: IAppGlobals;
}
