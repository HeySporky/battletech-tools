import React, { useState } from "react";
import { BattleMech } from "../../classes/battlemech";
import ProtoMech from "../../classes/protomech";
import { getHandheldIssue, IHandheldDesign } from "../../classes/handheld-weapon";
import { availabilityOptionLabel, isOptionShown } from "./availability-options";

interface IHandheldWeaponPanelProps {
    /** The 'Mech, or the ProtoMech (TO:AUE p.128), that carries it. */
    mech: BattleMech | ProtoMech;
    rulesLevel: number;
    /** Called after the design changes, to save the 'Mech. */
    onChange: () => void;
}

/**
 * The 'Mech creator's handheld weapon (#611): a small design of its own, carried in the hands, built from the weapons the edition's
 * rules let it hold (Maximum Tech p.79; TO:AUE pp.126-128), with its weight, heat sinks, cost and Battle Value worked out.
 */
export default function HandheldWeaponPanel(props: IHandheldWeaponPanelProps): React.JSX.Element | null {
    const [, setTick] = useState(0);
    const mech = props.mech;
    const option = mech.getHandheldOption(props.rulesLevel);
    const design = mech.getHandheldWeapon();
    if (!isOptionShown(option, design !== null)) return null;
    const analysis = mech.getHandheldAnalysis();
    const edition = mech.getRulesEdition();
    const weapons = (mech instanceof ProtoMech ? mech.getHandheldWeaponChoices() : mech.getAvailableEquipment(false, props.rulesLevel))
        .filter((item) => ("available" in item ? item.available : true) && !item.isAmmo && getHandheldIssue(item, edition) === null)
        .sort((first, second) => first.name.localeCompare(second.name));
    const change = (next: IHandheldDesign | null): void => {
        mech.setHandheldWeapon(next);
        props.onChange();
        setTick((value) => value + 1);
    };
    const current: IHandheldDesign = design ?? { entries: [], armor: 0 };
    const update = (index: number, patch: Partial<IHandheldDesign["entries"][number]>): void =>
        change({ ...current, entries: current.entries.map((entry, position) => (position === index ? { ...entry, ...patch } : entry)) });

    return (
        <fieldset className="fieldset clear-both" data-testid="handheld-weapon">
            <legend>{availabilityOptionLabel(option)}</legend>
            <p className="smaller-text">
                A weapon of its own, carried in both hands: no tonnage or critical slots on the 'Mech, but its weight counts toward the cargo
                limit ({mech.getHandheldCargoLimit()} t). Its BV is added to the 'Mech's final BV ({analysis?.rules?.battleValueSource ?? "TO:AUE p.193; Maximum Tech p.92"}).
            </p>
            {current.entries.map((entry, index) => (
                <div key={index} className="clear-both">
                    <select value={entry.tag} data-testid={`handheld-entry-${index}`} onChange={(event) => update(index, { tag: event.currentTarget.value, shots: undefined, ammoTag: undefined })}>
                        {weapons.some((item) => item.tag === entry.tag) ? null : <option value={entry.tag}>{entry.tag}</option>}
                        {weapons.map((item) => <option key={item.tag} value={item.tag}>{item.name}</option>)}
                    </select>
                    &nbsp;x&nbsp;
                    <input type="number" min={1} value={entry.count ?? 1} style={{ width: "4em" }} onChange={(event) => update(index, { count: Math.max(1, Math.floor(+event.currentTarget.value || 1)) })} />
                    &nbsp;shots each:&nbsp;
                    <input type="number" min={0} value={entry.shots ?? 0} style={{ width: "5em" }} onChange={(event) => update(index, { shots: Math.max(0, Math.floor(+event.currentTarget.value || 0)) })} />
                    &nbsp;<button className="btn btn-xs btn-danger" onClick={() => change({ ...current, entries: current.entries.filter((_, position) => position !== index) })}>Remove</button>
                </div>
            ))}
            <div className="clear-both">
                <select value="" data-testid="handheld-add" onChange={(event) => {
                    if (event.currentTarget.value) change({ ...current, entries: [...current.entries, { tag: event.currentTarget.value }] });
                }}>
                    <option value="">Add a weapon...</option>
                    {weapons.map((item) => <option key={item.tag} value={item.tag}>{item.name}</option>)}
                </select>
                &nbsp;Armor points:&nbsp;
                <input type="number" min={0} value={current.armor} style={{ width: "5em" }} data-testid="handheld-armor" onChange={(event) => change({ ...current, armor: Math.max(0, Math.floor(+event.currentTarget.value || 0)) })} />
                {design ? <>&nbsp;<button className="btn btn-xs btn-danger" onClick={() => change(null)}>Remove the handheld weapon</button></> : null}
            </div>
            {analysis ? (
                <p data-testid="handheld-summary">
                    <strong>{analysis.weight}</strong> tons ({analysis.heatSinks} heat sinks), <strong>{Math.round(analysis.cost).toLocaleString()}</strong> C-bills
                    (before the 'Mech's cost multiplier), BV <strong>{analysis.battleValue}</strong>.
                </p>
            ) : null}
            <p className="smaller-text">{option.alphaStrikeNote}</p>
            {mech.getHandheldIssues().map((issue) => <p key={issue} className="text-danger smaller-text">{issue}</p>)}
        </fieldset>
    );
}
