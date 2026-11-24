import React, { type JSX } from 'react';
import InfantryPlatoon from '../../../../classes/infantry-platoon';
import { infantryProstheticItems, type IInfantryAugmentation } from '../../../../data/infantry-armor';

// Cybernetic and prosthetic augmentation for a platoon (Interstellar Operations: Alternate Eras pp.70-79). Every trooper carries the same
// implants (a fourth of them the communications implants, the commander the triple-core processor). Experimental rules, the pain shunt Advanced.

interface IAugmentationPanelProps {
    platoon: InfantryPlatoon;
    rulesLevel: number;
    update: (change: (platoon: InfantryPlatoon) => void) => void;
}

const priceText = (item: IInfantryAugmentation): string =>
    `${item.cost.toLocaleString("en-US")} C-bills ${item.costUnit ?? (item.scope === "all" ? "a trooper" : item.scope === "quarter" ? "for a fourth of the troopers" : "for the commander")}`;

const ItemSelect = (props: { testId: string; value: string; onChange: (tag: string) => void }): JSX.Element => (
    <select data-testid={props.testId} value={props.value} onChange={(e) => props.onChange(e.currentTarget.value)}>
        <option value="">(none)</option>
        {infantryProstheticItems.map((item) => <option key={item.tag} value={item.tag}>{item.name}</option>)}
    </select>
);

export default function InfantryAugmentationPanel(props: IAugmentationPanelProps): JSX.Element {
    const { platoon, rulesLevel, update } = props;
    const chosen = platoon.getAugmentations().map((item) => item.tag);
    const offered = platoon.getAugmentationOptions().filter((item) => chosen.includes(item.tag) || item.rulesLevel <= rulesLevel);
    if (offered.length === 0) return <></>;
    const toggle = (tag: string, on: boolean): void => update((p) => { p.setAugmentations([...p.getAugmentations().map((item) => item.tag).filter((other) => other !== tag), ...(on ? [tag] : [])]); });
    const limbs = platoon.getLimbs();
    const pairs = platoon.getExtraneousPairs();
    const improved = platoon.hasAugmentation("aug-limb-improved");
    const setLimb = (slot: number, item: string, count: number): void => update((p) => {
        const next = p.getLimbs();
        if (!item) next.splice(slot, 1); else next[slot] = { item, count };
        p.setLimbs(next.filter((limb) => limb));
    });
    const setPair = (slot: number, item: string): void => update((p) => {
        const next = p.getExtraneousPairs();
        if (!item) next.splice(slot, 1); else next[slot] = item;
        p.setExtraneousPairs(next.filter((entry) => entry));
    });
    const groups: { label: string; items: IInfantryAugmentation[] }[] = [
        { label: "Cybernetic implants", items: offered.filter((item) => item.group === "implant") },
        { label: "Prosthetics", items: offered.filter((item) => item.group === "prosthetic") },
    ];
    return (
        <div data-testid="infantry-augmentation">
            <h3>Cybernetic and Prosthetic Augmentation</h3>
            <p className="smaller-text">
                Interstellar Operations: Alternate Eras pp. 70-79; the pain shunt is Advanced, the rest Experimental.
                Every trooper carries the same implants, except the communications implants (a fourth of the troopers) and the triple-core processor (the commander).
                A faction that does not field an implant, or an era after it went extinct, pays double. {platoon.getAugmentations().length > 0 ? `${platoon.getAugmentations().length} chosen; the Limits Table suggests ${platoon.getAugmentationLimits().min} to ${platoon.getAugmentationLimits().max}.` : ""}
            </p>
            {groups.filter((group) => group.items.length > 0).map((group) => (
                <fieldset className="fieldset" key={group.label}>
                    <legend>{group.label}</legend>
                    {group.items.map((item) => (
                        <div key={item.tag}>
                            <label className="d-block">
                                <input
                                    type="checkbox"
                                    data-testid={`infantry-augmentation-${item.tag}`}
                                    disabled={!chosen.includes(item.tag) && !platoon.isAugmentationInEra(item)}
                                    checked={chosen.includes(item.tag)}
                                    onChange={(e) => toggle(item.tag, e.currentTarget.checked)}
                                />
                                &nbsp;{item.name} - {priceText(item)} ({item.rulesLevel < 4 ? "Advanced" : "Experimental"}; {item.factionNames}; {typeof item.introduced === "number" ? item.introduced : item.introduced === "ES" ? "Early Spaceflight" : "Pre-Spaceflight"})
                            </label>
                            <div className="smaller-text" style={{ marginLeft: "1.6em" }}>{item.rules}</div>
                            {item.tag === "aug-limb-enhanced" && chosen.includes(item.tag) ? (
                                <div style={{ marginLeft: "1.6em" }}>
                                    Carries <ItemSelect testId="infantry-limb-0" value={limbs[0]?.item ?? ""} onChange={(tag) => setLimb(0, tag, limbs[0]?.count ?? 1)} />
                                    &nbsp;on <select data-testid="infantry-limb-0-count" value={limbs[0]?.count ?? 1} onChange={(e) => setLimb(0, limbs[0]?.item ?? "", +e.currentTarget.value)}><option value={1}>1 limb</option><option value={2}>2 limbs</option></select>
                                </div>
                            ) : null}
                            {item.tag === "aug-limb-improved" && improved ? (
                                <div style={{ marginLeft: "1.6em" }}>
                                    {[0, 1].map((slot) => (
                                        <span key={slot} style={{ marginRight: "1em" }}>
                                            <ItemSelect testId={`infantry-limb-${slot}`} value={limbs[slot]?.item ?? ""} onChange={(tag) => setLimb(slot, tag, limbs[slot]?.count ?? 1)} />
                                            &nbsp;<select data-testid={`infantry-limb-${slot}-count`} value={limbs[slot]?.count ?? 1} onChange={(e) => setLimb(slot, limbs[slot]?.item ?? "", +e.currentTarget.value)}><option value={1}>x1</option><option value={2}>x2</option></select>
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                            {item.tag === "aug-limb-extraneous" && chosen.includes(item.tag) ? (
                                <div style={{ marginLeft: "1.6em" }}>
                                    {Array.from({ length: platoon.getMaxExtraneousPairs() }, (_unused, slot) => (
                                        <span key={slot} style={{ marginRight: "1em" }}>
                                            Pair {slot + 1}: <ItemSelect testId={`infantry-extraneous-${slot}`} value={pairs[slot] ?? ""} onChange={(tag) => setPair(slot, tag)} />
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </fieldset>
            ))}
        </div>
    );
}
